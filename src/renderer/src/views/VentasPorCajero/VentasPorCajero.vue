<script setup>
import { ref, onMounted, computed } from 'vue';
import { useToast } from 'primevue/usetoast';
import { peticionesFetchOffline, nfecha, envioElectron, transformarFechaTimestamp, agregarDiasalaFechaActual } from '@/funciones/funciones.js';
import { useDatosEmpresa } from '@/stores';
import Swal from 'sweetalert2';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';

const toast = useToast();
const datosEmpresa = useDatosEmpresa();
const loading = ref(false);

const fechaInicio = ref('');
const fechaFin = ref('');
const cajeroFilter = ref('');
const ventasPorCajero = ref([]);

// Computed
const totalVentas = computed(() => ventasPorCajero.value.reduce((sum, v) => sum + v.total, 0));
const totalFacturas = computed(() => ventasPorCajero.value.reduce((sum, v) => sum + v.cantidad, 0));
const promedioVenta = computed(() => totalFacturas.value > 0 ? totalVentas.value / totalFacturas.value : 0);

const cargarDatos = async () => {
  loading.value = true;
  try {
    const fechaInicioFormato = `${fechaInicio.value} 00:00:00`;
    const fechaFinFormato = `${fechaFin.value} 23:59:59`;

    const response = await peticionesFetchOffline('datosVentasPorRango', fechaInicioFormato, fechaFinFormato);
    const facturas = response.facturas || [];

    // Agrupar por cajero
    const ventasPorCajeroMap = {};

    facturas.forEach(factura => {
      const cajero = factura.cajero || factura.usuario || 'Sin Asignar';
      const total = parseFloat(factura.total) || 0;

      if (!ventasPorCajeroMap[cajero]) {
        ventasPorCajeroMap[cajero] = {
          cajero,
          cantidad: 0,
          total: 0,
          facturas: []
        };
      }

      ventasPorCajeroMap[cajero].cantidad++;
      ventasPorCajeroMap[cajero].total += total;
      ventasPorCajeroMap[cajero].facturas.push(factura);
    });

    ventasPorCajero.value = Object.values(ventasPorCajeroMap).sort((a, b) => b.total - a.total);

    if (cajeroFilter.value) {
      ventasPorCajero.value = ventasPorCajero.value.filter(v =>
        v.cajero.toLowerCase().includes(cajeroFilter.value.toLowerCase())
      );
    }

    toast.add({
      severity: 'success',
      summary: 'Datos Cargados',
      detail: `Se encontraron ${ventasPorCajero.value.length} cajeros`,
      life: 3000
    });

  } catch (error) {
    console.error('Error:', error);
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'No se pudieron cargar los datos',
      life: 3000
    });
  } finally {
    loading.value = false;
  }
};

const exportarPDF = () => {
  try {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;

    // Header
    doc.setFillColor(30, 58, 138);
    doc.rect(0, 0, pageWidth, 40, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.setFont(undefined, 'bold');
    doc.text('VENTAS POR CAJERO', pageWidth / 2, 20, { align: 'center' });
    doc.setFontSize(10);
    doc.text(`Período: ${fechaInicio.value} - ${fechaFin.value}`, pageWidth / 2, 30, { align: 'center' });

    // Tabla
    const rows = ventasPorCajero.value.map(v => [
      v.cajero,
      v.cantidad.toString(),
      `RD$ ${v.total.toFixed(2)}`,
      `RD$ ${(v.total / v.cantidad).toFixed(2)}`
    ]);

    rows.push([
      { content: 'TOTALES', styles: { fontStyle: 'bold' } },
      { content: totalFacturas.value.toString(), styles: { fontStyle: 'bold' } },
      { content: `RD$ ${totalVentas.value.toFixed(2)}`, styles: { fontStyle: 'bold' } },
      { content: `RD$ ${promedioVenta.value.toFixed(2)}`, styles: { fontStyle: 'bold' } }
    ]);

    doc.autoTable({
      startY: 50,
      head: [['Cajero', 'Cant. Facturas', 'Total Ventas', 'Promedio']],
      body: rows,
      theme: 'grid',
      headStyles: { fillColor: [30, 58, 138] },
      styles: { fontSize: 9 },
      columnStyles: {
        1: { halign: 'center' },
        2: { halign: 'right' },
        3: { halign: 'right' }
      }
    });

    const pdfBlob = doc.output('blob');
    const pdfUrl = URL.createObjectURL(pdfBlob);

    Swal.fire({
      title: '<strong>Ventas por Cajero</strong>',
      html: `<embed src="${pdfUrl}" type="application/pdf" width="100%" height="600px" />`,
      width: '90%',
      showCloseButton: true,
      showConfirmButton: true,
      confirmButtonText: '<i class="pi pi-download"></i> Descargar',
      preConfirm: () => {
        const link = document.createElement('a');
        link.href = pdfUrl;
        link.download = `VentasPorCajero_${nfecha('fechaAmericana')}.pdf`;
        link.click();
        return false;
      }
    }).then(() => {
      setTimeout(() => URL.revokeObjectURL(pdfUrl), 1000);
    });

  } catch (error) {
    console.error('Error:', error);
    toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo generar el PDF', life: 3000 });
  }
};

const exportarExcel = () => {
  try {
    const data = ventasPorCajero.value.map(v => ({
      Cajero: v.cajero,
      'Cantidad de Facturas': v.cantidad,
      'Total Ventas': v.total.toFixed(2),
      'Promedio por Factura': (v.total / v.cantidad).toFixed(2)
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Ventas por Cajero');
    XLSX.writeFile(wb, `VentasPorCajero_${nfecha('fechaAmericana')}.xlsx`);

    toast.add({ severity: 'success', summary: 'Exportado', detail: 'Excel generado exitosamente', life: 3000 });
  } catch (error) {
    console.error('Error:', error);
    toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo generar el Excel', life: 3000 });
  }
};

onMounted(async () => {
  try {
    const datosJSON = await envioElectron('datosarchivo');
    if (!datosEmpresa.empresa.nombre) {
      await datosEmpresa.inicializarDatosEmpresa(datosJSON.VITE_LINKURL + datosJSON.VITE_LINK_API);
    }
    fechaInicio.value = transformarFechaTimestamp(agregarDiasalaFechaActual(-30), false);
    fechaFin.value = nfecha('fechaAmericana');
    await cargarDatos();
  } catch (error) {
    console.error('Error:', error);
  }
});
</script>

<template>
  <main class="content-wrapper bg-gray-50 min-h-screen p-6">
    <div class="max-w-7xl mx-auto">
      <div class="mb-6">
        <div class="flex items-center gap-3 mb-2">
          <div class="bg-blue-100 text-blue-700 rounded-full p-3">
            <i class="pi pi-user text-2xl"></i>
          </div>
          <div>
            <h1 class="text-3xl font-bold text-gray-800">Ventas por Cajero</h1>
            <p class="text-gray-600">Análisis de desempeño de cajeros</p>
          </div>
        </div>
      </div>

      <!-- Filtros -->
      <Card class="mb-6">
        <template #content>
          <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label class="font-semibold text-gray-700 mb-2 block">Fecha Inicio</label>
              <DatePicker v-model="fechaInicio" dateFormat="yy-mm-dd" showIcon class="w-full" />
            </div>
            <div>
              <label class="font-semibold text-gray-700 mb-2 block">Fecha Fin</label>
              <DatePicker v-model="fechaFin" dateFormat="yy-mm-dd" showIcon class="w-full" />
            </div>
            <div>
              <label class="font-semibold text-gray-700 mb-2 block">Filtrar Cajero</label>
              <InputText v-model="cajeroFilter" placeholder="Buscar cajero..." class="w-full" />
            </div>
            <div class="flex items-end gap-2">
              <Button label="Cargar" icon="pi pi-refresh" @click="cargarDatos" :loading="loading" />
              <Button label="PDF" icon="pi pi-file-pdf" @click="exportarPDF" severity="danger" />
              <Button label="Excel" icon="pi pi-file-excel" @click="exportarExcel" severity="success" />
            </div>
          </div>
        </template>
      </Card>

      <!-- Stats -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <template #content>
            <div class="flex items-center gap-3">
              <div class="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <i class="pi pi-dollar text-2xl text-green-600"></i>
              </div>
              <div>
                <p class="text-sm text-gray-600">Total Ventas</p>
                <p class="text-2xl font-bold text-green-600">RD$ {{ totalVentas.toFixed(2) }}</p>
              </div>
            </div>
          </template>
        </Card>
        <Card>
          <template #content>
            <div class="flex items-center gap-3">
              <div class="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <i class="pi pi-shopping-cart text-2xl text-blue-600"></i>
              </div>
              <div>
                <p class="text-sm text-gray-600">Total Facturas</p>
                <p class="text-2xl font-bold text-blue-600">{{ totalFacturas }}</p>
              </div>
            </div>
          </template>
        </Card>
        <Card>
          <template #content>
            <div class="flex items-center gap-3">
              <div class="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <i class="pi pi-chart-line text-2xl text-purple-600"></i>
              </div>
              <div>
                <p class="text-sm text-gray-600">Promedio por Factura</p>
                <p class="text-2xl font-bold text-purple-600">RD$ {{ promedioVenta.toFixed(2) }}</p>
              </div>
            </div>
          </template>
        </Card>
      </div>

      <!-- Tabla -->
      <Card>
        <template #title>Listado de Cajeros</template>
        <template #content>
          <DataTable :value="ventasPorCajero" :rows="10" :paginator="ventasPorCajero.length > 10" sortField="total" :sortOrder="-1">
            <Column field="cajero" header="Cajero" sortable>
              <template #body="{ data }">
                <div class="flex items-center gap-2">
                  <i class="pi pi-user text-blue-600"></i>
                  <span class="font-semibold">{{ data.cajero }}</span>
                </div>
              </template>
            </Column>
            <Column field="cantidad" header="Facturas" sortable style="text-align: center">
              <template #body="{ data }">
                <Tag :value="data.cantidad" severity="info" />
              </template>
            </Column>
            <Column field="total" header="Total Ventas" sortable style="text-align: right">
              <template #body="{ data }">
                <span class="text-green-600 font-bold">RD$ {{ data.total.toFixed(2) }}</span>
              </template>
            </Column>
            <Column header="Promedio" style="text-align: right">
              <template #body="{ data }">
                <span class="text-purple-600 font-semibold">RD$ {{ (data.total / data.cantidad).toFixed(2) }}</span>
              </template>
            </Column>
            <Column header="% del Total" style="text-align: center">
              <template #body="{ data }">
                <Tag :value="`${((data.total / totalVentas) * 100).toFixed(1)}%`" severity="success" />
              </template>
            </Column>
          </DataTable>
        </template>
      </Card>
    </div>
  </main>
  <Toast />
</template>

<style scoped>
.content-wrapper {
  min-height: calc(100vh - 60px);
}
</style>
