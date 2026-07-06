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
const clienteFilter = ref('');

// Datos
const ventasData = ref([]);
const clientes = ref([]);

// Agrupación por cliente
const ventasPorCliente = computed(() => {
  const agrupado = {};

  ventasData.value.forEach(venta => {
    const cliente = venta.nombre_cliente || 'Cliente General';
    const codCliente = venta.cod_cliente || '';

    if (!agrupado[codCliente]) {
      agrupado[codCliente] = {
        cliente: cliente,
        codCliente: codCliente,
        telefono: venta.telefono_cliente || '',
        totalVentas: 0,
        totalMonto: 0,
        ultimaCompra: venta.fecha_emision,
        ventas: []
      };
    }

    agrupado[codCliente].totalVentas++;
    agrupado[codCliente].totalMonto += parseFloat(venta.total || 0);

    // Actualizar última compra
    if (new Date(venta.fecha_emision) > new Date(agrupado[codCliente].ultimaCompra)) {
      agrupado[codCliente].ultimaCompra = venta.fecha_emision;
    }

    agrupado[codCliente].ventas.push(venta);
  });

  let resultado = Object.values(agrupado).sort((a, b) => b.totalMonto - a.totalMonto);

  if (clienteFilter.value) {
    resultado = resultado.filter(item => item.cliente === clienteFilter.value);
  }

  if (busqueda.value) {
    const query = busqueda.value.toLowerCase();
    resultado = resultado.filter(item =>
      item.cliente.toLowerCase().includes(query) ||
      item.codCliente.toLowerCase().includes(query) ||
      item.telefono.toLowerCase().includes(query)
    );
  }

  return resultado;
});

// Estadísticas
const totalClientes = computed(() => ventasPorCliente.value.length);
const totalVentas = computed(() => {
  return ventasPorCliente.value.reduce((sum, v) => sum + v.totalVentas, 0);
});
const totalMonto = computed(() => {
  return ventasPorCliente.value.reduce((sum, v) => sum + v.totalMonto, 0);
});
const mejorCliente = computed(() => {
  if (ventasPorCliente.value.length === 0) return null;
  return ventasPorCliente.value[0];
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

    const clientesSet = new Set(ventasData.value.map(v => v.nombre_cliente || 'Cliente General'));
    clientes.value = [{ label: 'Todos', value: '' }, ...Array.from(clientesSet).map(v => ({ label: v, value: v }))];

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
  if (ventasPorCliente.value.length === 0) {
    toast.add({ severity: 'warn', summary: 'Advertencia', detail: 'No hay datos para exportar', life: 3000 });
    return;
  }

  const datos = ventasPorCliente.value.map((item, index) => ({
    'Posición': index + 1,
    'Cliente': item.cliente,
    'Código': item.codCliente,
    'Teléfono': item.telefono,
    'Total Ventas': item.totalVentas,
    'Monto Total': `RD$ ${item.totalMonto.toFixed(2)}`,
    'Promedio por Compra': `RD$ ${(item.totalMonto / item.totalVentas).toFixed(2)}`,
    'Última Compra': formatearFecha(item.ultimaCompra)
  }));

  const ws = XLSX.utils.json_to_sheet(datos);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Clientes');

  const periodo = `${formatearFecha(rangoFecha.value[0])}_${formatearFecha(rangoFecha.value[1])}`;
  XLSX.writeFile(wb, `Reporte_Clientes_${periodo}.xlsx`);

  toast.add({ severity: 'success', summary: 'Éxito', detail: 'Archivo Excel exportado correctamente', life: 3000 });
};

/************************************************************************/
const exportarPDF = () => {
  if (ventasPorCliente.value.length === 0) {
    toast.add({ severity: 'warn', summary: 'Advertencia', detail: 'No hay datos para exportar', life: 3000 });
    return;
  }

  const doc = new jsPDF();
  doc.setFontSize(16);
  doc.text('REPORTE POR CLIENTES', 105, 15, { align: 'center' });

  doc.setFontSize(10);
  doc.text(`Empresa: ${datosEmpresa.empresa.nombre || 'N/A'}`, 14, 25);
  doc.text(`Periodo: ${formatearFecha(rangoFecha.value[0])} - ${formatearFecha(rangoFecha.value[1])}`, 14, 30);

  const tableData = ventasPorCliente.value.map((item, index) => [
    index + 1,
    item.cliente,
    item.totalVentas,
    `RD$ ${item.totalMonto.toLocaleString('es-DO', { minimumFractionDigits: 2 })}`,
    formatearFecha(item.ultimaCompra)
  ]);

  doc.autoTable({
    startY: 35,
    head: [['#', 'Cliente', 'Ventas', 'Monto Total', 'Última Compra']],
    body: tableData,
    theme: 'grid',
    headStyles: { fillColor: [255, 235, 59] }
  });

  const periodo = `${formatearFecha(rangoFecha.value[0])}_${formatearFecha(rangoFecha.value[1])}`;
  doc.save(`Reporte_Clientes_${periodo}.pdf`);

  toast.add({ severity: 'success', summary: 'Éxito', detail: 'PDF generado correctamente', life: 3000 });
};
</script>

<template>
  <main class="content-wrapper bg-gray-50 min-h-screen">
    <div class="w-full px-4 py-6">
      <div class="mb-6">
        <div class="flex items-center justify-between mb-2">
          <div>
            <h1 class="text-3xl font-bold text-gray-800">Reporte por Clientes</h1>
            <p class="text-gray-600 mt-1">Análisis de compras por cliente</p>
          </div>
          <div class="flex gap-2">
            <Button label="Excel" icon="pi pi-file-excel" severity="success" @click="exportarExcel" :disabled="loading || ventasPorCliente.length === 0" />
            <Button label="PDF" icon="pi pi-file-pdf" severity="danger" @click="exportarPDF" :disabled="loading || ventasPorCliente.length === 0" />
          </div>
        </div>
      </div>

      <Card class="mb-6 shadow-lg">
        <template #title>
          <div class="flex items-center gap-2">
            <i class="pi pi-filter text-yellow-600"></i>
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
              <label class="font-semibold text-sm text-gray-700">Cliente</label>
              <Dropdown v-model="clienteFilter" :options="clientes" optionLabel="label" optionValue="value" placeholder="Todos los clientes" class="w-full" />
            </div>
            <div class="flex flex-col gap-2">
              <label class="font-semibold text-sm text-gray-700">Búsqueda</label>
              <InputText v-model="busqueda" placeholder="Buscar cliente..." class="w-full" />
            </div>
            <div class="flex items-end">
              <Button label="Cargar Datos" icon="pi pi-search" severity="primary" @click="cargarDatos" :loading="loading" class="w-full" />
            </div>
          </div>
        </template>
      </Card>

      <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card class="shadow-lg">
          <template #content>
            <div class="flex items-center justify-between">
              <div>
                <p class="text-gray-600 text-sm mb-1">Total Clientes</p>
                <p class="text-2xl font-bold text-purple-600">{{ totalClientes }}</p>
              </div>
              <div class="bg-purple-100 p-3 rounded-full">
                <i class="pi pi-users text-purple-600 text-2xl"></i>
              </div>
            </div>
          </template>
        </Card>

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
                <p class="text-gray-600 text-sm mb-1">Mejor Cliente</p>
                <p class="text-lg font-bold text-yellow-600">{{ mejorCliente?.cliente || 'N/A' }}</p>
                <p class="text-xs text-gray-500" v-if="mejorCliente">{{ mejorCliente.totalVentas }} compras</p>
              </div>
              <div class="bg-yellow-100 p-3 rounded-full">
                <i class="pi pi-star text-yellow-600 text-2xl"></i>
              </div>
            </div>
          </template>
        </Card>
      </div>

      <Card class="shadow-lg">
        <template #title>
          <div class="flex items-center gap-2">
            <i class="pi pi-user-plus text-yellow-600"></i>
            <span>Compras por Cliente</span>
          </div>
        </template>
        <template #content>
          <DataTable :value="ventasPorCliente" :paginator="true" :rows="20" :loading="loading" stripedRows showGridlines responsiveLayout="scroll" paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown" :rowsPerPageOptions="[10, 20, 50]" currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} clientes">
            <template #empty>
              <div class="text-center py-8">
                <i class="pi pi-inbox text-gray-400 text-5xl mb-3"></i>
                <p class="text-gray-500">No se encontraron datos en el periodo seleccionado</p>
              </div>
            </template>

            <Column header="#" :style="{ width: '60px' }">
              <template #body="slotProps">{{ ventasPorCliente.indexOf(slotProps.data) + 1 }}</template>
            </Column>
            <Column field="cliente" header="Cliente" :style="{ minWidth: '200px' }"></Column>
            <Column field="telefono" header="Teléfono" :style="{ minWidth: '120px' }"></Column>
            <Column field="totalVentas" header="Total Compras" :style="{ minWidth: '120px' }">
              <template #body="slotProps"><Tag :value="slotProps.data.totalVentas" severity="info" /></template>
            </Column>
            <Column field="totalMonto" header="Monto Total" :style="{ minWidth: '150px' }">
              <template #body="slotProps">
                <span class="font-bold text-green-700">RD$ {{ slotProps.data.totalMonto.toLocaleString('es-DO', { minimumFractionDigits: 2 }) }}</span>
              </template>
            </Column>
            <Column header="Promedio" :style="{ minWidth: '130px' }">
              <template #body="slotProps">
                <span class="font-semibold text-blue-700">RD$ {{ (slotProps.data.totalMonto / slotProps.data.totalVentas).toLocaleString('es-DO', { minimumFractionDigits: 2 }) }}</span>
              </template>
            </Column>
            <Column field="ultimaCompra" header="Última Compra" :style="{ minWidth: '120px' }">
              <template #body="slotProps">{{ formatearFecha(slotProps.data.ultimaCompra) }}</template>
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
