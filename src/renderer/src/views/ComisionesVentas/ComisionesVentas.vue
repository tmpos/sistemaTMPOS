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
const vendedorFilter = ref('');
const porcentajeComision = ref(5); // 5% por defecto
const comisionesPorVendedor = ref([]);

const totalVentas = computed(() => comisionesPorVendedor.value.reduce((sum, v) => sum + v.total, 0));
const totalComisiones = computed(() => comisionesPorVendedor.value.reduce((sum, v) => sum + v.comision, 0));

const cargarDatos = async () => {
  loading.value = true;
  try {
    const fechaInicioFormato = `${fechaInicio.value} 00:00:00`;
    const fechaFinFormato = `${fechaFin.value} 23:59:59`;

    const response = await peticionesFetchOffline('datosVentasPorRango', fechaInicioFormato, fechaFinFormato);
    const facturas = response.facturas || [];

    const comisionesPorVendedorMap = {};

    facturas.forEach(factura => {
      const vendedor = factura.usuario || factura.cajero || 'Sin Asignar';
      const total = parseFloat(factura.total) || 0;
      const comision = total * (porcentajeComision.value / 100);

      if (!comisionesPorVendedorMap[vendedor]) {
        comisionesPorVendedorMap[vendedor] = {
          vendedor,
          cantidad: 0,
          total: 0,
          comision: 0
        };
      }

      comisionesPorVendedorMap[vendedor].cantidad++;
      comisionesPorVendedorMap[vendedor].total += total;
      comisionesPorVendedorMap[vendedor].comision += comision;
    });

    comisionesPorVendedor.value = Object.values(comisionesPorVendedorMap).sort((a, b) => b.comision - a.comision);

    if (vendedorFilter.value) {
      comisionesPorVendedor.value = comisionesPorVendedor.value.filter(v =>
        v.vendedor.toLowerCase().includes(vendedorFilter.value.toLowerCase())
      );
    }

    toast.add({
      severity: 'success',
      summary: 'Datos Cargados',
      detail: `Se encontraron ${comisionesPorVendedor.value.length} vendedores`,
      life: 3000
    });

  } catch (error) {
    console.error('Error:', error);
    toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar los datos', life: 3000 });
  } finally {
    loading.value = false;
  }
};

const exportarPDF = () => {
  try {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;

    doc.setFillColor(30, 58, 138);
    doc.rect(0, 0, pageWidth, 40, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.setFont(undefined, 'bold');
    doc.text('COMISIONES DE VENTAS', pageWidth / 2, 20, { align: 'center' });
    doc.setFontSize(10);
    doc.text(`Período: ${fechaInicio.value} - ${fechaFin.value}`, pageWidth / 2, 28, { align: 'center' });
    doc.text(`Porcentaje de Comisión: ${porcentajeComision.value}%`, pageWidth / 2, 34, { align: 'center' });

    const rows = comisionesPorVendedor.value.map(v => [
      v.vendedor,
      v.cantidad.toString(),
      `RD$ ${v.total.toFixed(2)}`,
      `${porcentajeComision.value}%`,
      `RD$ ${v.comision.toFixed(2)}`
    ]);

    rows.push([
      { content: 'TOTALES', styles: { fontStyle: 'bold' } },
      '',
      { content: `RD$ ${totalVentas.value.toFixed(2)}`, styles: { fontStyle: 'bold' } },
      '',
      { content: `RD$ ${totalComisiones.value.toFixed(2)}`, styles: { fontStyle: 'bold', fillColor: [220, 252, 231] } }
    ]);

    doc.autoTable({
      startY: 50,
      head: [['Vendedor', 'Facturas', 'Total Ventas', '%', 'Comisión']],
      body: rows,
      theme: 'grid',
      headStyles: { fillColor: [30, 58, 138] },
      styles: { fontSize: 9 },
      columnStyles: {
        1: { halign: 'center' },
        2: { halign: 'right' },
        3: { halign: 'center' },
        4: { halign: 'right' }
      }
    });

    const pdfBlob = doc.output('blob');
    const pdfUrl = URL.createObjectURL(pdfBlob);

    Swal.fire({
      title: '<strong>Comisiones de Ventas</strong>',
      html: `<embed src="${pdfUrl}" type="application/pdf" width="100%" height="600px" />`,
      width: '90%',
      showCloseButton: true,
      showConfirmButton: true,
      confirmButtonText: '<i class="pi pi-download"></i> Descargar',
      preConfirm: () => {
        const link = document.createElement('a');
        link.href = pdfUrl;
        link.download = `ComisionesVentas_${nfecha('fechaAmericana')}.pdf`;
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
    const data = comisionesPorVendedor.value.map(v => ({
      Vendedor: v.vendedor,
      'Cantidad de Facturas': v.cantidad,
      'Total Ventas': v.total.toFixed(2),
      'Porcentaje Comisión': `${porcentajeComision.value}%`,
      'Comisión': v.comision.toFixed(2)
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Comisiones de Ventas');
    XLSX.writeFile(wb, `ComisionesVentas_${nfecha('fechaAmericana')}.xlsx`);

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
          <div class="bg-green-100 text-green-700 rounded-full p-3">
            <i class="pi pi-dollar text-2xl"></i>
          </div>
          <div>
            <h1 class="text-3xl font-bold text-gray-800">Comisiones de Ventas</h1>
            <p class="text-gray-600">Cálculo de comisiones por vendedor</p>
          </div>
        </div>
      </div>

      <Card class="mb-6">
        <template #content>
          <div class="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <label class="font-semibold text-gray-700 mb-2 block">Fecha Inicio</label>
              <DatePicker v-model="fechaInicio" dateFormat="yy-mm-dd" showIcon class="w-full" />
            </div>
            <div>
              <label class="font-semibold text-gray-700 mb-2 block">Fecha Fin</label>
              <DatePicker v-model="fechaFin" dateFormat="yy-mm-dd" showIcon class="w-full" />
            </div>
            <div>
              <label class="font-semibold text-gray-700 mb-2 block">% Comisión</label>
              <InputNumber v-model="porcentajeComision" :min="0" :max="100" suffix="%" class="w-full" />
            </div>
            <div>
              <label class="font-semibold text-gray-700 mb-2 block">Filtrar Vendedor</label>
              <InputText v-model="vendedorFilter" placeholder="Buscar..." class="w-full" />
            </div>
            <div class="flex items-end gap-2">
              <Button label="Cargar" icon="pi pi-refresh" @click="cargarDatos" :loading="loading" />
              <Button label="PDF" icon="pi pi-file-pdf" @click="exportarPDF" severity="danger" />
              <Button label="Excel" icon="pi pi-file-excel" @click="exportarExcel" severity="success" />
            </div>
          </div>
        </template>
      </Card>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <Card>
          <template #content>
            <div class="flex items-center gap-3">
              <div class="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <i class="pi pi-shopping-cart text-2xl text-blue-600"></i>
              </div>
              <div>
                <p class="text-sm text-gray-600">Total Ventas</p>
                <p class="text-2xl font-bold text-blue-600">RD$ {{ totalVentas.toFixed(2) }}</p>
              </div>
            </div>
          </template>
        </Card>
        <Card>
          <template #content>
            <div class="flex items-center gap-3">
              <div class="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <i class="pi pi-dollar text-2xl text-green-600"></i>
              </div>
              <div>
                <p class="text-sm text-gray-600">Total Comisiones ({{ porcentajeComision }}%)</p>
                <p class="text-2xl font-bold text-green-600">RD$ {{ totalComisiones.toFixed(2) }}</p>
              </div>
            </div>
          </template>
        </Card>
      </div>

      <Card>
        <template #title>Comisiones por Vendedor</template>
        <template #content>
          <DataTable :value="comisionesPorVendedor" :rows="10" :paginator="comisionesPorVendedor.length > 10" sortField="comision" :sortOrder="-1">
            <Column field="vendedor" header="Vendedor" sortable>
              <template #body="{ data }">
                <div class="flex items-center gap-2">
                  <i class="pi pi-user text-green-600"></i>
                  <span class="font-semibold">{{ data.vendedor }}</span>
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
                <span class="text-blue-600 font-semibold">RD$ {{ data.total.toFixed(2) }}</span>
              </template>
            </Column>
            <Column header="% Comisión" style="text-align: center">
              <template #body>
                <Tag :value="`${porcentajeComision}%`" severity="warning" />
              </template>
            </Column>
            <Column field="comision" header="Comisión" sortable style="text-align: right">
              <template #body="{ data }">
                <span class="text-green-600 font-bold text-lg">RD$ {{ data.comision.toFixed(2) }}</span>
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
