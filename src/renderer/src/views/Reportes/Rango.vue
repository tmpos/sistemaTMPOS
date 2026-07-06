<script setup>
import { ref, onMounted, computed } from 'vue';
import { Chart as ChartJS, BarElement, CategoryScale, LinearScale, Title, Tooltip, Legend } from 'chart.js';
import { Chart } from 'vue-chartjs';

// Registrar componentes de Chart.js que se necesitan
ChartJS.register(BarElement, CategoryScale, LinearScale, Title, Tooltip, Legend);

import { peticionesFetch, envioElectron, encryptarPassword, enviarDatosLocalStorage, peticionesFetchOffline, arrayToObjetoFromTablaOffline, crearTablaSiNoExisteOffline } from '../../funciones/funciones.js';
import { useToast } from "primevue/usetoast";
import LoadingOverlay from '../../Loading/LoadingOverlay.vue';
import { useDatosEmpresa } from '../../stores';
import Swal from 'sweetalert2';
import { useRouter, useRoute } from 'vue-router';

const loading = ref(true);
const link = ref(null);
const api = ref(null);
const token = ref(null);
const tokenCifrado = ref(null);
const dataAarray = ref([]);
const resultadosPorRango = ref({ ventas: 0, ganancias: 0, impuestos: 0, gastos: 0, devoluciones: 0, abonos: 0, taller: 0, cuentas_cobrar: 0 });
const chartData = ref(null);
const chartOptions = ref(null);
const facturasArray = ref([]);
const visibleProductosModal = ref(false);
const productosFactura = ref();

const router = useRouter();
const route = useRoute();
const datosEmpresa = useDatosEmpresa();
const toast = useToast();

/************************************************************************/
// Función para obtener los datos desde el backend
const fetchData = async () => {
  const fechaInicio = route.params.fechainicio;
  const fechaFin = route.params.fechafin;



const response = await peticionesFetchOffline('datosVentasPorRango', fechaInicio,fechasSemana.fechaFin);

  dataAarray.value = response;
  facturasArray.value = response['facturas'];
};

/************************************************************************/
// Procesar datos para el rango de fechas
const procesarDatosPorRango = (datos) => {
  const resultados = { ventas: 0, ganancias: 0, impuestos: 0, gastos: 0, devoluciones: 0, abonos: 0, taller: 0, cuentas_cobrar: 0 };

  datos.facturas?.forEach(factura => {
    resultados.ventas += parseFloat(factura.total) || 0;
    resultados.ganancias += parseFloat(factura.ganancia) || 0;
    resultados.impuestos += parseFloat(factura.impuesto) || 0;
  });

  datos.gastos?.forEach(gasto => { resultados.gastos += parseFloat(gasto.cantidad) || 0; });
  datos.taller?.forEach(taller => { resultados.taller += parseFloat(taller.total) || 0; });
  datos.cuentas_cobrar?.forEach(cuenta => { resultados.cuentas_cobrar += parseFloat(cuenta.monto_credito) || 0; });
  datos.devoluciones?.forEach(devolucion => { resultados.devoluciones += parseFloat(devolucion.cantidad) || 0; });
  datos.abonos?.forEach(abono => { resultados.abonos += parseFloat(abono.cantidad) || 0; });

  return resultados;
};

/************************************************************************/
// Configuración de los datos para el gráfico
const setChartData = (resultados) => {
  const documentStyle = getComputedStyle(document.documentElement);
  return {
    labels: ['Rango de Fechas'],
    datasets: [
      { label: 'Ventas', backgroundColor: documentStyle.getPropertyValue('--p-cyan-500'), data: [resultados.ventas] },
      { label: 'Ganancias', backgroundColor: documentStyle.getPropertyValue('--p-gray-500'), data: [resultados.ganancias] },
      { label: 'Gastos', backgroundColor: documentStyle.getPropertyValue('--p-red-500'), data: [resultados.gastos] },
      { label: 'Impuestos', backgroundColor: documentStyle.getPropertyValue('--p-purple-500'), data: [resultados.impuestos] },
      { label: 'Devoluciones', backgroundColor: documentStyle.getPropertyValue('--p-green-500'), data: [resultados.devoluciones] },
      { label: 'Abonos', backgroundColor: documentStyle.getPropertyValue('--p-blue-500'), data: [resultados.abonos] },
      { label: 'Taller', backgroundColor: documentStyle.getPropertyValue('--p-orange-500'), data: [resultados.taller] },
      { label: 'Cuentas por Cobrar', backgroundColor: documentStyle.getPropertyValue('--p-yellow-500'), data: [resultados.cuentas_cobrar] }
    ]
  };
};

/************************************************************************/
// Configuración de las opciones del gráfico
const setChartOptions = () => {
  const documentStyle = getComputedStyle(document.documentElement);
  const textColor = documentStyle.getPropertyValue('--p-text-color');
  const textColorSecondary = documentStyle.getPropertyValue('--p-text-muted-color');
  const surfaceBorder = documentStyle.getPropertyValue('--p-content-border-color');

  return {
    maintainAspectRatio: false,
    plugins: { legend: { labels: { color: textColor } } },
    scales: {
      x: { ticks: { color: textColorSecondary }, grid: { display: false, drawBorder: false } },
      y: { ticks: { color: textColorSecondary }, grid: { color: surfaceBorder, drawBorder: false } }
    }
  };
};

/************************************************************************/
// Montar el componente
onMounted(async () => {
  const datosJSON = await envioElectron('datosarchivo');
  link.value = datosJSON.VITE_LINKURL;
  api.value = datosJSON.VITE_LINK_API;
  token.value = datosJSON.VITE_TOKEN;

  tokenCifrado.value = await encryptarPassword(token.value, 10);
  if (!datosEmpresa.empresa.nombre) {
    await datosEmpresa.inicializarDatosEmpresa(link.value + api.value);
  }

  await fetchData();
  loading.value = false;

  const resultados = procesarDatosPorRango(dataAarray.value);
  resultadosPorRango.value = resultados;

  chartData.value = setChartData(resultados);
  chartOptions.value = setChartOptions();
});

/************************************************************************/
// Función para manejar la selección de filas en la tabla
const onRowSelect = (event) => {
  const texto = `<div><h2>No: ${event.data.no_factura}</h2><p><b>${event.data.nombre_cliente}</b></p></div>`;
  Swal.fire({
    title: 'Factura Seleccionada',
    html: texto,
    icon: 'info',
    showCancelButton: true,
    confirmButtonText: 'Imprimir',
    cancelButtonText: 'Productos',
    showDenyButton: true,
    denyButtonText: 'Eliminar',
  }).then((result) => {
    if (result.isConfirmed) {
      const impresionpagina = link.value + '/vista/impresoratermica.php?factura=' + event.data.no_factura;
      const datosEmpresa = JSON.stringify(enviarDatosLocalStorage());
      window.electron.ipcRenderer.invoke('ticket', event.data.no_factura, datosEmpresa);
    } else if (result.isDenied) {
      Swal.fire({
        title: 'Introduce la contraseña',
        input: 'password',
        inputPlaceholder: 'Contraseña',
        showCancelButton: true,
        confirmButtonText: 'Eliminar',
        cancelButtonText: 'Cancelar'
      }).then(async (result) => {
        if (result.isConfirmed) {
          const contrasenaIngresada = result.value;
          if (contrasenaIngresada === token.value) {
            const datosFactura = await peticionesFetchOffline('deleteEntry', 'facturas', event.data.id);
            if (datosFactura[0] === 'ok') {
              toast.add({ severity: 'success', summary: 'Éxito', detail: 'Datos eliminados correctamente', life: 3000 });
            } else {
              toast.add({ severity: 'error', summary: 'Error', detail: 'Error al eliminar los datos', life: 3000 });
            }
          }
        }
      });
    } else if (result.dismiss === Swal.DismissReason.cancel) {
      visibleProductosModal.value = true;
      productosFactura.value = JSON.parse(event.data.productos);
    }
  });
};

const calcularSubtotal = (producto) => producto.cantidad * producto.precio;
const calcularTotalModal = computed(() => productosFactura.value?.reduce((total, producto) => total + calcularSubtotal(producto), 0) || 0);

const columns = [
  { field: 'no_factura', header: 'Factura' },
  { field: 'comprobante', header: 'Comprobante' },
  { field: 'nombre_cliente', header: 'Cliente' },
  { field: 'vendedor', header: 'Vendedor' },
  { field: 'fecha_emision', header: 'Fecha' },
  { field: 'hora', header: 'Hora' },
  { field: 'subtotal', header: 'Subtotal' },
  { field: 'impuesto', header: 'Impuestos' },
  { field: 'metodo_pago', header: 'Metodo_Pago' },
  { field: 'efectivo', header: 'Efectivo' },
  { field: 'tarjeta', header: 'Tarjeta' },
  { field: 'transferencia', header: 'Transferencia' },
  { field: 'ganancia', header: 'Ganancia' },
  { field: 'total', header: 'Total' },
];

const rowClass = (data) => {
  switch (data.metodo_pago) {
    case 'EFECTIVO':
      return 'metodo-pago-efectivo';
    case 'TARJETA':
      return 'metodo-pago-tarjeta';
    case 'TRANSFERENCIA':
      return 'metodo-pago-transferencia';
    default:
      return '';
  }
};
</script>

<template>
  <main class="content-wrapper">
    <div class="w-full px-4 mt-1">
      <div class="grid grid-cols-12 gap-4">
        <div class="md:col-span-12 mt-1">
          <div class="card shadow-sm">
            <div class="card-header bg-primary text-white text-center">
              <h5>Resumen Financiero</h5>
            </div>
            <div class="card-body">
              <div class="grid grid-cols-12 gap-4 text-center">
                <!-- Tarjetas dinámicas basadas en resultadosPorRango -->
                <div class="md:col-span-4 lg:col-span-3 mb-3" v-if="resultadosPorRango">
                  <div class="card bg-light border">
                    <div class="card-body">
                      <h6><strong>Ventas Totales</strong></h6>
                      <p class="text-success display-6">{{ resultadosPorRango.ventas.toFixed(2) }}</p>
                    </div>
                  </div>
                </div>

                <div class="md:col-span-4 lg:col-span-3 mb-3" v-if="resultadosPorRango">
                  <div class="card bg-light border">
                    <div class="card-body">
                      <h6><strong>Ganancias Totales</strong></h6>
                      <p class="text-success display-6">{{ resultadosPorRango.ganancias.toFixed(2) }}</p>
                    </div>
                  </div>
                </div>

                <div class="md:col-span-4 lg:col-span-3 mb-3" v-if="resultadosPorRango">
                  <div class="card bg-light border">
                    <div class="card-body">
                      <h6><strong>Gastos Totales</strong></h6>
                      <p class="text-danger display-6">{{ resultadosPorRango.gastos.toFixed(2) }}</p>
                    </div>
                  </div>
                </div>

                <div class="md:col-span-4 lg:col-span-3 mb-3" v-if="resultadosPorRango">
                  <div class="card bg-light border">
                    <div class="card-body">
                      <h6><strong>Impuestos Totales</strong></h6>
                      <p class="text-warning display-6">{{ resultadosPorRango.impuestos.toFixed(2) }}</p>
                    </div>
                  </div>
                </div>

                <div class="md:col-span-4 lg:col-span-3 mb-3" v-if="resultadosPorRango">
                  <div class="card bg-light border">
                    <div class="card-body">
                      <h6><strong>Devoluciones Totales</strong></h6>
                      <p class="text-info display-6">{{ resultadosPorRango.devoluciones.toFixed(2) }}</p>
                    </div>
                  </div>
                </div>

                <div class="md:col-span-4 lg:col-span-3 mb-3" v-if="resultadosPorRango">
                  <div class="card bg-light border">
                    <div class="card-body">
                      <h6><strong>Abonos Totales</strong></h6>
                      <p class="text-info display-6">{{ resultadosPorRango.abonos.toFixed(2) }}</p>
                    </div>
                  </div>
                </div>

                <div class="md:col-span-4 lg:col-span-3 mb-3" v-if="resultadosPorRango">
                  <div class="card bg-light border">
                    <div class="card-body">
                      <h6><strong>Taller</strong></h6>
                      <p class="text-info display-6">{{ resultadosPorRango.taller.toFixed(2) }}</p>
                    </div>
                  </div>
                </div>

                <div class="md:col-span-4 lg:col-span-3 mb-3" v-if="resultadosPorRango">
                  <div class="card bg-light border">
                    <div class="card-body">
                      <h6><strong>Cuentas por Cobrar</strong></h6>
                      <p class="text-info display-6">{{ resultadosPorRango.cuentas_cobrar.toFixed(2) }}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="md:col-span-12">
          <fieldset class="border p-3 rounded mb-2">
            <legend class="float-none w-auto px-2">Datos de Gráficos</legend>
            <div class="card">
              <Chart v-if="chartData && chartOptions" type="bar" :data="chartData" :options="chartOptions" class="h-[30rem]" />
            </div>
          </fieldset>
        </div>

        <div class="col-span-12">
          <fieldset class="border p-3 rounded mb-2">
            <legend class="float-none w-auto px-2">LISTADO DE FACTURAS</legend>
            <div class="card">
              <DataTable :value="facturasArray" scrollable scrollHeight="600px" @rowSelect="onRowSelect" selectionMode="single" dataKey="id" paginator :rows="10" :rowsPerPageOptions="[5, 10, 20, 50]" tableStyle="min-width: 50rem" :rowClass="rowClass">
                <Column sortable v-for="col of columns" :key="col.field" :field="col.field" :header="col.header" />
              </DataTable>
            </div>
          </fieldset>
        </div>

        <Dialog v-model:visible="visibleProductosModal" modal header="Productos" :style="{ width: '50rem' }">
          <fieldset class="border p-3 rounded mb-2">
            <legend class="float-none w-auto px-2">Productos</legend>
            <table class="table-auto w-full">
              <thead>
                <tr><th>Cantidad</th><th>Nombre</th><th>Precio</th><th>Subtotal</th></tr>
              </thead>
              <tbody>
                <tr v-for="producto in productosFactura" :key="producto.codigo">
                  <td>{{ producto.cantidad }}</td>
                  <td>{{ producto.nombre }}</td>
                  <td>{{ producto.precio }}</td>
                  <td>{{ calcularSubtotal(producto) }}</td>
                </tr>
              </tbody>
            </table>
            <div class="flex justify-end mt-4">
              <strong>Total: {{ calcularTotalModal }}</strong>
            </div>
          </fieldset>
        </Dialog>

        <LoadingOverlay :visible="loading" />
        <Toast />
      </div>
    </div>
  </main>
</template>

<style >
.metodo-pago-efectivo { color: #00bcd4 !important; }
.metodo-pago-tarjeta { color: #ff9800 !important; }
.metodo-pago-transferencia { color: #9e9e9e !important; }
</style>
