<script setup>
import { ref, computed, onMounted } from 'vue';
import { useToast } from "primevue/usetoast";
import {
  envioElectron,
  encryptarPassword,
  formatearFecha,
  peticionesFetchOffline
} from '@/funciones/funciones.js';
import { useDatosEmpresa } from '@/stores';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

const toast = useToast();
const datosEmpresa = useDatosEmpresa();

const link = ref('');
const api = ref('');
const token = ref('');
const tokenCifrado = ref(null);
const loading = ref(false);

// Filtros
const rangoFecha = ref([]);
const busqueda = ref('');
const cajeroFilter = ref('');

// Datos
const ventasData = ref([]);
const cajeros = ref([]);

// Agrupación por cajero
const ventasPorCajero = computed(() => {
  const agrupado = {};

  ventasData.value.forEach(venta => {
    const cajero = venta.cajero || 'Sin Cajero';

    if (!agrupado[cajero]) {
      agrupado[cajero] = {
        cajero: cajero,
        totalVentas: 0,
        totalMonto: 0,
        efectivo: 0,
        tarjeta: 0,
        transferencia: 0,
        ventas: []
      };
    }

    agrupado[cajero].totalVentas++;
    agrupado[cajero].totalMonto += parseFloat(venta.total || 0);
    agrupado[cajero].efectivo += parseFloat(venta.efectivo || 0);
    agrupado[cajero].tarjeta += parseFloat(venta.tarjeta || 0);
    agrupado[cajero].transferencia += parseFloat(venta.transferencia || 0);
    agrupado[cajero].ventas.push(venta);
  });

  let resultado = Object.values(agrupado).sort((a, b) => b.totalMonto - a.totalMonto);

  if (cajeroFilter.value) {
    resultado = resultado.filter(item => item.cajero === cajeroFilter.value);
  }

  if (busqueda.value) {
    const query = busqueda.value.toLowerCase();
    resultado = resultado.filter(item =>
      item.cajero.toLowerCase().includes(query)
    );
  }

  return resultado;
});

// Estadísticas
const totalVentas = computed(() => {
  return ventasPorCajero.value.reduce((sum, v) => sum + v.totalVentas, 0);
});

const totalMonto = computed(() => {
  return ventasPorCajero.value.reduce((sum, v) => sum + v.totalMonto, 0);
});

const mejorCajero = computed(() => {
  if (ventasPorCajero.value.length === 0) return null;
  return ventasPorCajero.value[0];
});

/************************************************************************/
document.body.classList.add('sidebar-close');

/************************************************************************/
onMounted(async() => {
  try {
    const datosJSON = await envioElectron('datosarchivo');
    link.value = datosJSON.VITE_LINKURL;
    api.value = datosJSON.VITE_LINK_API;
    token.value = datosJSON.VITE_TOKEN;

    tokenCifrado.value = await encryptarPassword(token.value, 10);

    if (!datosEmpresa.empresa.nombre) {
      await datosEmpresa.inicializarDatosEmpresa(link.value + api.value);
    }

    const hoy = new Date();
    const primerDia = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    const ultimoDia = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0);
    rangoFecha.value = [primerDia, ultimoDia];

    await cargarDatos();
  } catch (error) {
    console.error('Error al inicializar:', error);
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Error al cargar configuración',
      life: 3000
    });
  }
});

/************************************************************************/
const cargarDatos = async () => {
  if (!rangoFecha.value || rangoFecha.value.length < 2) {
    toast.add({
      severity: 'warn',
      summary: 'Advertencia',
      detail: 'Selecciona un rango de fechas válido',
      life: 3000
    });
    return;
  }

  loading.value = true;
  try {
    const response = await peticionesFetchOffline('getDataAsArray', 'facturas');

    const fechaInicio = new Date(rangoFecha.value[0]);
    const fechaFin = new Date(rangoFecha.value[1]);
    fechaFin.setHours(23, 59, 59, 999);

    ventasData.value = (response || []).filter(factura => {
      const fechaFactura = new Date(factura.fecha_emision);
      return fechaFactura >= fechaInicio && fechaFactura <= fechaFin;
    });

    const cajerosSet = new Set(ventasData.value.map(v => v.cajero || 'Sin Cajero'));
    cajeros.value = [{ label: 'Todos', value: '' }, ...Array.from(cajerosSet).map(v => ({ label: v, value: v }))];

    toast.add({
      severity: 'success',
      summary: 'Éxito',
      detail: `${ventasData.value.length} ventas cargadas`,
      life: 3000
    });
  } catch (error) {
    console.error('Error al cargar datos:', error);
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Error al cargar datos',
      life: 3000
    });
  } finally {
    loading.value = false;
  }
};

/************************************************************************/
const exportarExcel = () => {
  if (ventasPorCajero.value.length === 0) {
    toast.add({ severity: 'warn', summary: 'Advertencia', detail: 'No hay datos para exportar', life: 3000 });
    return;
  }

  const datos = ventasPorCajero.value.map((item, index) => ({
    'Posición': index + 1,
    'Cajero': item.cajero,
    'Total Ventas': item.totalVentas,
    'Monto Total': `RD$ ${item.totalMonto.toFixed(2)}`,
    'Efectivo': `RD$ ${item.efectivo.toFixed(2)}`,
    'Tarjeta': `RD$ ${item.tarjeta.toFixed(2)}`,
    'Transferencia': `RD$ ${item.transferencia.toFixed(2)}`
  }));

  const ws = XLSX.utils.json_to_sheet(datos);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Cajeros');

  const periodo = `${formatearFecha(rangoFecha.value[0])}_${formatearFecha(rangoFecha.value[1])}`;
  XLSX.writeFile(wb, `Reporte_Cajeros_${periodo}.xlsx`);

  toast.add({ severity: 'success', summary: 'Éxito', detail: 'Archivo Excel exportado correctamente', life: 3000 });
};

/************************************************************************/
const exportarPDF = () => {
  if (ventasPorCajero.value.length === 0) {
    toast.add({ severity: 'warn', summary: 'Advertencia', detail: 'No hay datos para exportar', life: 3000 });
    return;
  }

  const doc = new jsPDF();
  doc.setFontSize(16);
  doc.text('REPORTE POR CAJEROS', 105, 15, { align: 'center' });

  doc.setFontSize(10);
  doc.text(`Empresa: ${datosEmpresa.empresa.nombre || 'N/A'}`, 14, 25);
  doc.text(`Periodo: ${formatearFecha(rangoFecha.value[0])} - ${formatearFecha(rangoFecha.value[1])}`, 14, 30);

  const tableData = ventasPorCajero.value.map((item, index) => [
    index + 1,
    item.cajero,
    item.totalVentas,
    `RD$ ${item.totalMonto.toLocaleString('es-DO', { minimumFractionDigits: 2 })}`,
    `RD$ ${item.efectivo.toLocaleString('es-DO', { minimumFractionDigits: 2 })}`,
    `RD$ ${item.tarjeta.toLocaleString('es-DO', { minimumFractionDigits: 2 })}`
  ]);

  doc.autoTable({
    startY: 35,
    head: [['#', 'Cajero', 'Ventas', 'Monto Total', 'Efectivo', 'Tarjeta']],
    body: tableData,
    theme: 'grid',
    headStyles: { fillColor: [255, 193, 7] }
  });

  const periodo = `${formatearFecha(rangoFecha.value[0])}_${formatearFecha(rangoFecha.value[1])}`;
  doc.save(`Reporte_Cajeros_${periodo}.pdf`);

  toast.add({ severity: 'success', summary: 'Éxito', detail: 'PDF generado correctamente', life: 3000 });
};
</script>

<template>
  <main class="content-wrapper bg-gray-50 min-h-screen">
    <div class="w-full px-4 py-6">
      <div class="mb-6">
        <div class="flex items-center justify-between mb-2">
          <div>
            <h1 class="text-3xl font-bold text-gray-800">Reporte por Cajeros</h1>
            <p class="text-gray-600 mt-1">Análisis de ventas por cajero</p>
          </div>
          <div class="flex gap-2">
            <Button label="Excel" icon="pi pi-file-excel" severity="success" @click="exportarExcel" :disabled="loading || ventasPorCajero.length === 0" />
            <Button label="PDF" icon="pi pi-file-pdf" severity="danger" @click="exportarPDF" :disabled="loading || ventasPorCajero.length === 0" />
          </div>
        </div>
      </div>

      <Card class="mb-6 shadow-lg">
        <template #title>
          <div class="flex items-center gap-2">
            <i class="pi pi-filter text-amber-600"></i>
            <span>Filtros y Búsqueda</span>
          </div>
        </template>
        <template #content>
          <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div class="flex flex-col gap-2">
              <label class="font-semibold text-sm text-gray-700">Rango de Fechas</label>
              <DatePicker v-model="rangoFecha" selectionMode="range" dateFormat="dd/mm/yy" :showIcon="true" placeholder="Selecciona rango" class="w-full" />
            </div>
            <div class="flex flex-col gap-2">
              <label class="font-semibold text-sm text-gray-700">Cajero</label>
              <Dropdown v-model="cajeroFilter" :options="cajeros" optionLabel="label" optionValue="value" placeholder="Todos los cajeros" class="w-full" />
            </div>
            <div class="flex flex-col gap-2">
              <label class="font-semibold text-sm text-gray-700">Búsqueda</label>
              <InputText v-model="busqueda" placeholder="Buscar cajero..." class="w-full" />
            </div>
            <div class="flex items-end">
              <Button label="Cargar Datos" icon="pi pi-search" severity="primary" @click="cargarDatos" :loading="loading" class="w-full" />
            </div>
          </div>
        </template>
      </Card>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card class="shadow-lg">
          <template #content>
            <div class="flex items-center justify-between">
              <div>
                <p class="text-gray-600 text-sm mb-1">Total Ventas</p>
                <p class="text-2xl font-bold text-blue-600">{{ totalVentas }}</p>
              </div>
              <div class="bg-blue-100 p-3 rounded-full">
                <i class="pi pi-shopping-cart text-blue-600 text-2xl"></i>
              </div>
            </div>
          </template>
        </Card>

        <Card class="shadow-lg">
          <template #content>
            <div class="flex items-center justify-between">
              <div>
                <p class="text-gray-600 text-sm mb-1">Monto Total</p>
                <p class="text-2xl font-bold text-green-600">RD$ {{ totalMonto.toLocaleString('es-DO', { minimumFractionDigits: 2 }) }}</p>
              </div>
              <div class="bg-green-100 p-3 rounded-full">
                <i class="pi pi-dollar text-green-600 text-2xl"></i>
              </div>
            </div>
          </template>
        </Card>

        <Card class="shadow-lg">
          <template #content>
            <div class="flex items-center justify-between">
              <div>
                <p class="text-gray-600 text-sm mb-1">Mejor Cajero</p>
                <p class="text-lg font-bold text-amber-600">{{ mejorCajero?.cajero || 'N/A' }}</p>
                <p class="text-xs text-gray-500" v-if="mejorCajero">{{ mejorCajero.totalVentas }} ventas</p>
              </div>
              <div class="bg-amber-100 p-3 rounded-full">
                <i class="pi pi-star text-amber-600 text-2xl"></i>
              </div>
            </div>
          </template>
        </Card>
      </div>

      <Card class="shadow-lg">
        <template #title>
          <div class="flex items-center gap-2">
            <i class="pi pi-user text-amber-600"></i>
            <span>Ventas por Cajero</span>
          </div>
        </template>
        <template #content>
          <DataTable :value="ventasPorCajero" :paginator="true" :rows="20" :loading="loading" stripedRows showGridlines responsiveLayout="scroll" paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown" :rowsPerPageOptions="[10, 20, 50]" currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} cajeros">
            <template #empty>
              <div class="text-center py-8">
                <i class="pi pi-inbox text-gray-400 text-5xl mb-3"></i>
                <p class="text-gray-500">No se encontraron datos en el periodo seleccionado</p>
              </div>
            </template>

            <Column header="#" :style="{ width: '60px' }">
              <template #body="slotProps">{{ ventasPorCajero.indexOf(slotProps.data) + 1 }}</template>
            </Column>
            <Column field="cajero" header="Cajero" :style="{ minWidth: '200px' }"></Column>
            <Column field="totalVentas" header="Total Ventas" :style="{ minWidth: '120px' }">
              <template #body="slotProps"><Tag :value="slotProps.data.totalVentas" severity="info" /></template>
            </Column>
            <Column field="totalMonto" header="Monto Total" :style="{ minWidth: '150px' }">
              <template #body="slotProps">
                <span class="font-bold text-green-700">RD$ {{ slotProps.data.totalMonto.toLocaleString('es-DO', { minimumFractionDigits: 2 }) }}</span>
              </template>
            </Column>
            <Column field="efectivo" header="Efectivo" :style="{ minWidth: '130px' }">
              <template #body="slotProps">
                <span class="font-semibold text-blue-700">RD$ {{ slotProps.data.efectivo.toLocaleString('es-DO', { minimumFractionDigits: 2 }) }}</span>
              </template>
            </Column>
            <Column field="tarjeta" header="Tarjeta" :style="{ minWidth: '130px' }">
              <template #body="slotProps">
                <span class="font-semibold text-purple-700">RD$ {{ slotProps.data.tarjeta.toLocaleString('es-DO', { minimumFractionDigits: 2 }) }}</span>
              </template>
            </Column>
          </DataTable>
        </template>
      </Card>

      <Toast />
    </div>
  </main>
</template>

<style scoped>
.content-wrapper {
  min-height: calc(100vh - 60px);
}
</style>
