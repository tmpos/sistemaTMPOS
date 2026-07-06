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
const clienteFilter = ref('');
const ventasPorCliente = ref([]);

const totalVentas = computed(() => ventasPorCliente.value.reduce((sum, v) => sum + v.total, 0));
const totalFacturas = computed(() => ventasPorCliente.value.reduce((sum, v) => sum + v.cantidad, 0));
const clientesActivos = computed(() => ventasPorCliente.value.length);

const cargarDatos = async () => {
  loading.value = true;
  try {
    const fechaInicioFormato = `${fechaInicio.value} 00:00:00`;
    const fechaFinFormato = `${fechaFin.value} 23:59:59`;

    const response = await peticionesFetchOffline('datosVentasPorRango', fechaInicioFormato, fechaFinFormato);
    const facturas = response.facturas || [];

    const ventasPorClienteMap = {};

    facturas.forEach(factura => {
      const cliente = factura.nombre || 'Cliente General';
      const telefono = factura.telefono || '';
      const total = parseFloat(factura.total) || 0;

      if (!ventasPorClienteMap[cliente]) {
        ventasPorClienteMap[cliente] = {
          cliente,
          telefono,
          cantidad: 0,
          total: 0,
          ultimaCompra: factura.fecha
        };
      }

      ventasPorClienteMap[cliente].cantidad++;
      ventasPorClienteMap[cliente].total += total;
      if (new Date(factura.fecha) > new Date(ventasPorClienteMap[cliente].ultimaCompra)) {
        ventasPorClienteMap[cliente].ultimaCompra = factura.fecha;
      }
    });

    ventasPorCliente.value = Object.values(ventasPorClienteMap).sort((a, b) => b.total - a.total);

    if (clienteFilter.value) {
      ventasPorCliente.value = ventasPorCliente.value.filter(v =>
        v.cliente.toLowerCase().includes(clienteFilter.value.toLowerCase())
      );
    }

    toast.add({
      severity: 'success',
      summary: 'Datos Cargados',
      detail: `Se encontraron ${ventasPorCliente.value.length} clientes`,
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
    doc.text('VENTAS POR CLIENTES', pageWidth / 2, 20, { align: 'center' });
    doc.setFontSize(10);
    doc.text(`Período: ${fechaInicio.value} - ${fechaFin.value}`, pageWidth / 2, 30, { align: 'center' });

    const rows = ventasPorCliente.value.map(v => [
      v.cliente,
      v.telefono,
      v.cantidad.toString(),
      `RD$ ${v.total.toFixed(2)}`,
      v.ultimaCompra
    ]);

    doc.autoTable({
      startY: 50,
      head: [['Cliente', 'Teléfono', 'Facturas', 'Total', 'Última Compra']],
      body: rows,
      theme: 'grid',
      headStyles: { fillColor: [30, 58, 138] },
      styles: { fontSize: 8 },
      columnStyles: {
        2: { halign: 'center' },
        3: { halign: 'right' }
      }
    });

    const pdfBlob = doc.output('blob');
    const pdfUrl = URL.createObjectURL(pdfBlob);

    Swal.fire({
      title: '<strong>Ventas por Clientes</strong>',
      html: `<embed src="${pdfUrl}" type="application/pdf" width="100%" height="600px" />`,
      width: '90%',
      showCloseButton: true,
      showConfirmButton: true,
      confirmButtonText: '<i class="pi pi-download"></i> Descargar',
      preConfirm: () => {
        const link = document.createElement('a');
        link.href = pdfUrl;
        link.download = `VentasPorClientes_${nfecha('fechaAmericana')}.pdf`;
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
    const data = ventasPorCliente.value.map(v => ({
      Cliente: v.cliente,
      Teléfono: v.telefono,
      'Cantidad de Facturas': v.cantidad,
      'Total Ventas': v.total.toFixed(2),
      'Última Compra': v.ultimaCompra
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Ventas por Clientes');
    XLSX.writeFile(wb, `VentasPorClientes_${nfecha('fechaAmericana')}.xlsx`);

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
          <div class="bg-purple-100 text-purple-700 rounded-full p-3">
            <i class="pi pi-users text-2xl"></i>
          </div>
          <div>
            <h1 class="text-3xl font-bold text-gray-800">Ventas por Clientes</h1>
            <p class="text-gray-600">Análisis de comportamiento de clientes</p>
          </div>
        </div>
      </div>

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
              <label class="font-semibold text-gray-700 mb-2 block">Filtrar Cliente</label>
              <InputText v-model="clienteFilter" placeholder="Buscar cliente..." class="w-full" />
            </div>
            <div class="flex items-end gap-2">
              <Button label="Cargar" icon="pi pi-refresh" @click="cargarDatos" :loading="loading" />
              <Button label="PDF" icon="pi pi-file-pdf" @click="exportarPDF" severity="danger" />
              <Button label="Excel" icon="pi pi-file-excel" @click="exportarExcel" severity="success" />
            </div>
          </div>
        </template>
      </Card>

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
              <div class="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <i class="pi pi-users text-2xl text-purple-600"></i>
              </div>
              <div>
                <p class="text-sm text-gray-600">Clientes Activos</p>
                <p class="text-2xl font-bold text-purple-600">{{ clientesActivos }}</p>
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
      </div>

      <Card>
        <template #title>Listado de Clientes</template>
        <template #content>
          <DataTable :value="ventasPorCliente" :rows="10" :paginator="ventasPorCliente.length > 10" sortField="total" :sortOrder="-1">
            <Column field="cliente" header="Cliente" sortable>
              <template #body="{ data }">
                <div class="flex items-center gap-2">
                  <i class="pi pi-user text-purple-600"></i>
                  <span class="font-semibold">{{ data.cliente }}</span>
                </div>
              </template>
            </Column>
            <Column field="telefono" header="Teléfono"></Column>
            <Column field="cantidad" header="Facturas" sortable style="text-align: center">
              <template #body="{ data }">
                <Tag :value="data.cantidad" severity="info" />
              </template>
            </Column>
            <Column field="total" header="Total Compras" sortable style="text-align: right">
              <template #body="{ data }">
                <span class="text-green-600 font-bold">RD$ {{ data.total.toFixed(2) }}</span>
              </template>
            </Column>
            <Column field="ultimaCompra" header="Última Compra" sortable></Column>
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
