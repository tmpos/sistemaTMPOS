<script setup>
import { ref, onMounted, computed } from 'vue';
import * as XLSX from 'xlsx';
import { Chart as ChartJS, BarElement, CategoryScale, LinearScale, Title, Tooltip, Legend, ArcElement } from 'chart.js'; 
import { Chart } from 'vue-chartjs';

ChartJS.register(BarElement, CategoryScale, LinearScale, Title, Tooltip, Legend, ArcElement); 

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
const tipoComprobante = ref('todas');

const facturasFiltradas = ref([]); // Nuevo: Almacena las facturas filtradas
const chartDataDelDia = ref(null); // Datos para la tarta
const chartOptionsDelDia = ref(null); // Opciones para la tarta
const datosDelDia = ref({
  efectivo: 0.00,
  transferencia: 0.00,
  tarjeta: 0.00
});
const searchQuery = ref('');
/************************************************************************/
// Función para obtener los datos desde el backend
const fetchData = async () => {
  const fechaInicio = route.params.fechainicio;
  const fechaFin = route.params.fechafin;

  const response = await peticionesFetch(`${link.value}${api.value}`, `datosventasporrango`, {
    fechainicio: `${fechaInicio}`,
    fechafinal: `${fechaFin}`,
  }, tokenCifrado.value, 'POST');

  dataAarray.value = response;
  facturasArray.value = response['facturas'];
};

/************************************************************************/

/************************************************************************/
const setChartDataDelDia = () => {
  const documentStyle = getComputedStyle(document.body);
  const defaultColors = ['#00bcd4', '#ff9800', '#9e9e9e'];

  return {
    labels: ['EFECTIVO', 'TARJETA', 'TRANSFERENCIA'],
    datasets: [
      {
        data: [datosDelDia.value.efectivo, datosDelDia.value.tarjeta, datosDelDia.value.transferencia],
        backgroundColor: [
          documentStyle.getPropertyValue('--cyan-500') || defaultColors[0],
          documentStyle.getPropertyValue('--orange-500') || defaultColors[1],
          documentStyle.getPropertyValue('--gray-500') || defaultColors[2]
        ],
        hoverBackgroundColor: [
          documentStyle.getPropertyValue('--cyan-400') || defaultColors[0],
          documentStyle.getPropertyValue('--orange-400') || defaultColors[1],
          documentStyle.getPropertyValue('--gray-400') || defaultColors[2]
        ]
      }
    ]
  };
};

/************************************************************************/
// Establecer las opciones del gráfico de la tarta
const setChartOptionsDelDia = () => {
  const documentStyle = getComputedStyle(document.documentElement);
  const textColor = documentStyle.getPropertyValue('--text-color');

  return {
    plugins: {
      legend: {
        labels: {
          usePointStyle: true,
          color: textColor
        }
      }
    }
  };
};
/************************************************************************/
const clientesData = ref([]);
const fetchClientes = async () => {
  try {
    const response = await peticionesFetch(
      `${link.value}${api.value}`,
      'datosarraypost',
      { tabla: 'clientes' },
      tokenCifrado.value,
      'POST'
    );
    clientesData.value = response;
  } catch (error) {
    toast.add({ 
      severity: 'error', 
      summary: 'Error', 
      detail: 'Failed to fetch data from clientes', 
      life: 3000 
    });
  }
};

/************************************************************************/
const fnFiltrarFacturas = (tipoComprobante) => {
    if (tipoComprobante === 'todas') {
        // Retorna todas las facturas
        facturasFiltradas.value = [...facturasArray.value];
    } else if (tipoComprobante === 'con_comprobantes') {
        // Filtrar facturas que tengan comprobantes válidos
        facturasFiltradas.value = facturasArray.value.filter(factura =>factura.tipo_factura !== 'SIN COMPROBANTE'
        );

    } else {
        // Filtrar facturas por tipo de comprobante especificado
        facturasFiltradas.value = facturasArray.value.filter(factura => 
            factura.tipo_factura === tipoComprobante
        );
    }
    // Actualizar el gráfico después de aplicar el filtro
    actualizarChartDelDia();
};

/************************************************************************/
const facturasFiltradasComputadas = computed(() => {
  let filteredFacturas = facturasArray.value;
 
  // Filtrar por tipo de comprobante
  if (tipoComprobante.value !== 'todas') {
    filteredFacturas = filteredFacturas.filter(factura => factura.tipo_factura === tipoComprobante.value);
  }

  // Filtrar por búsqueda de texto en campos relevantes
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    filteredFacturas = filteredFacturas.filter(factura => {
      return (
        factura.no_factura.toString().toLowerCase().includes(query) ||
        factura.nombre_cliente.toLowerCase().includes(query) ||
        factura.vendedor.toLowerCase().includes(query)
      );
    });
  }

  return filteredFacturas;
});

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

  //const resultados = procesarDatosPorRango(dataAarray.value);


    chartDataDelDia.value = setChartDataDelDia();
    chartOptionsDelDia.value = setChartOptionsDelDia();


fnFiltrarFacturas('todas')
actualizarChartDelDia();

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

const actualizarChartDelDia = () => {
  const resultados = { ventas: 0, ganancias: 0, impuestos: 0, gastos: 0, devoluciones: 0, abonos: 0, taller: 0, cuentas_cobrar: 0 };

  const efectivo = facturasFiltradas.value.reduce((acc, factura) => acc + parseFloat(factura.efectivo || 0), 0);
  const tarjeta = facturasFiltradas.value.reduce((acc, factura) => acc + parseFloat(factura.tarjeta || 0), 0);
  const transferencia = facturasFiltradas.value.reduce((acc, factura) => acc + parseFloat(factura.transferencia || 0), 0);

    resultados.ventas += facturasFiltradas.value.reduce((acc, factura) => acc + parseFloat(factura.total || 0), 0);
    resultados.ganancias += facturasFiltradas.value.reduce((acc, factura) => acc + parseFloat(factura.ganancia || 0), 0);
    resultados.impuestos += facturasFiltradas.value.reduce((acc, factura) => acc + parseFloat(factura.impuesto || 0), 0);

    resultadosPorRango.value = resultados;

   chartDataDelDia.value = {
    labels: ['EFECTIVO', 'TARJETA', 'TRANSFERENCIA'],
    datasets: [
      {
        data: [efectivo, tarjeta, transferencia],
        backgroundColor: ['#00bcd4', '#ff9800', '#9e9e9e'],
        hoverBackgroundColor: ['#00acc1', '#fb8c00', '#8e8e8e']
      }
    ]
  };
};



const seleccionarComprobante = (tipo) => {
  tipoComprobante.value = tipo;  // Actualiza el tipo seleccionado
  fnFiltrarFacturas(tipo);  // Filtra las facturas
};

const calcularSubtotal = (producto) => producto.cantidad * producto.precio;
const calcularTotalModal = computed(() => productosFactura.value?.reduce((total, producto) => total + calcularSubtotal(producto), 0) || 0);

const columns = [
  { field: 'no_factura', header: 'Factura' },
  { field: 'comprobante', header: 'Comprobante' },
  { field: 'tipo_factura', header: 'Tipo Comp.' },
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


const totalesFiltrados = computed(() => {
  const resultados = {
    ventas: 0,
    ganancias: 0,
    impuestos: 0
  };

  // Calcular totales basados en las facturas filtradas
  facturasFiltradasComputadas.value.forEach(factura => {
    resultados.ventas += parseFloat(factura.total || 0);
    resultados.ganancias += parseFloat(factura.ganancia || 0);
    resultados.impuestos += parseFloat(factura.impuesto || 0);
  });

  return resultados;
});

const fnDownloadFacturas = async () => {
    // Asegurarse de cargar los datos de los clientes
    await fetchClientes();

    // Verificar que las facturas estén correctamente filtradas
    const facturasParaDescargar = facturasFiltradasComputadas.value.length > 0 
        ? facturasFiltradasComputadas.value 
        : facturasFiltradas.value;

    // Generar los datos para Excel
    const data = facturasParaDescargar.map(item => {
        const clienteEncontrado = clientesData.value.find(dato => dato.codigo === item.cod_cliente);
        return {
            fecha: item.fecha_emision,
            cliente: item.nombre_cliente,
            tipo_factura: item.tipo_factura,
            rnc_cliente: clienteEncontrado ? clienteEncontrado.cedula : 'N/A', // Devuelve la cédula del cliente
            comprobante: item.comprobante,
            forma_pago: item.metodo_pago,
            ganancia: item.ganancia,
            impuestos: item.impuesto,
            total: item.total
        };
    });

    if (data.length === 0) {
        toast.add({
            severity: 'warn',
            summary: 'Advertencia',
            detail: 'No hay facturas para descargar.',
            life: 3000,
        });
        return;
    }

    // Crear la hoja de cálculo y el libro Excel
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Facturas');

    // Generar el archivo Excel en binario
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });

    // Crear un Blob a partir de los datos binarios y descargar el archivo
    const blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.download = 'facturas.xlsx';
    link.click();
};



function calcularTotalesPorCategoria(datos) {
  // Inicializar un objeto donde guardaremos los totales
  const totales = {
    ventas: 0,
    ganancias: 0,
    impuestos: 0,
    gastos: 0,
    devoluciones: 0,
    abonos: 0,
    taller: 0,
    cuentas_cobrar: 0
  };

  // Calcular los totales sumando los valores de cada categoría
  if (datos.ventas ) {
    totales.ventas = datos.ventas;
  }else{
    totales.ventas = 0;
  }

  if (datos.ganancias ) {
    totales.ganancias = datos.ganancias;
  }else{
    totales.ganancias = 0;
  }

  if (datos.impuestos ) {
    totales.impuestos = datos.impuestos;
  }else{
    totales.impuestos = 0;
  }

  if (datos.gastos ) {
    totales.gastos = datos.gastos;
  }else{
    totales.gastos = 0;
  }

  if (datos.devoluciones) {
    totales.devoluciones = datos.devoluciones;
  }else{
    totales.devoluciones = 0;
  }

  if (datos.abonos ) {
    totales.abonos = datos.abonos;
  }else{
    totales.abonos = 0;
  }

  if (datos.taller ) {
    totales.taller = datos.taller;
  }else{
    totales.taller = 0;
  }

  if (datos.cuentas_cobrar ) {
    totales.cuentas_cobrar = datos.cuentas_cobrar;
  }else{
    totales.cuentas_cobrar = 0;
  }

  return totales;
}


const fnPrintFacturas = ()=>{
   const totales = calcularTotalesPorCategoria(totalesFiltrados.value);
   console.log("totales", totales);
   const datosEmpresa = JSON.stringify(enviarDatosLocalStorage())
   window.electron.ipcRenderer.invoke('reporte',JSON.stringify(totales),datosEmpresa);

}

</script>

<template>
  <main class="content-wrapper">
    <div class="w-full px-4 mt-1">
      <div class="grid grid-cols-12 gap-4">
        <div class="md:col-span-12 mt-1">
          <div class="card shadow-sm">

            <div class="card-body">
<div class="grid grid-cols-12 gap-4 text-center">
  <!-- Tarjetas dinámicas basadas en totalesFiltrados -->
  <div class="md:col-span-4 lg:col-span-3 mb-3">
    <div class="card bg-light border">
      <div class="card-body">
        <h6><strong>Ventas Totales</strong></h6>
        <p class="text-success display-6">{{ totalesFiltrados.ventas.toFixed(2) }}</p>
      </div>
    </div>
  </div>

  <div class="md:col-span-4 lg:col-span-3 mb-3">
    <div class="card bg-light border">
      <div class="card-body">
        <h6><strong>Ganancias Totales</strong></h6>
        <p class="text-success display-6">{{ totalesFiltrados.ganancias.toFixed(2) }}</p>
      </div>
    </div>
  </div>

  <div class="md:col-span-4 lg:col-span-3 mb-3">
    <div class="card bg-light border">
      <div class="card-body">
        <h6><strong>Impuestos Totales</strong></h6>
        <p class="text-warning display-6">{{ totalesFiltrados.impuestos.toFixed(2) }}</p>
      </div>
    </div>
  </div>
</div>

            </div>
          </div>
        </div>


        <div class="col-span-12 md:col-span-6 mt-2">
              <Card class="altura">
                <template #title>REPORTE DE VENTAS</template>
                











                <template #content>
<div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-2 gap-4">
  <!-- REPORTE DE VENTAS -->
  <Button label="Todas" raised outlined severity="secondary"  @click="seleccionarComprobante('todas')" icon="pi pi-file" iconPos="top" />
  <Button label="Sin Comrpobante" raised outlined severity="secondary"  @click="seleccionarComprobante('SIN COMPROBANTE')" icon="pi pi-file" iconPos="top" />
  <Button label="Con Comprobantes" raised outlined severity="secondary"  @click="seleccionarComprobante('con_comprobantes')" icon="pi pi-file" iconPos="top" />
  <Button label="Consumidor Final" raised outlined severity="secondary"  @click="seleccionarComprobante('CONSUMIDOR FINAL')" icon="pi pi-file" iconPos="top" />
  <Button label="Comprobante Fiscal" raised outlined severity="secondary"  @click="seleccionarComprobante('COMPROBANTE CON VALOR FISCAL')" icon="pi pi-file" iconPos="top" />
  <Button label="Regímenes Especiales" raised outlined severity="secondary"  @click="seleccionarComprobante('REGIMENES ESPECIALES')" icon="pi pi-file" iconPos="top" />
  <Button label="Gubernamental" raised outlined severity="secondary"  @click="seleccionarComprobante('GUBERNAMENTAL')" icon="pi pi-file" iconPos="top" />
</div>
                </template>
              </Card>
  
        </div>

  <div class="col-span-12 md:col-span-6">
 <Card class="mt-2">
         <template #content>
<Chart v-if="chartDataDelDia && chartOptionsDelDia" type="pie" :data="chartDataDelDia" :options="chartOptionsDelDia" class="w-full md:w-30rem chart-size" />
         </template>
</Card>
  </div>



        <div class="col-span-12">
          <fieldset class="border p-3 rounded mb-2">
            <legend class="float-none w-auto px-2">LISTADO DE FACTURAS</legend>
            <div class="card">

              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
              <div style="display: flex; align-items: center;">
                  <Button icon="pi pi-print" class="ml-1" @click="fnPrintFacturas" />
                  <Button icon="pi pi-download" class="ml-1" @click="fnDownloadFacturas" />
              </div>
              <input v-model="searchQuery" placeholder="Buscar facturas..." class="p-inputtext p-component" />
            </div>

              <DataTable :value="facturasFiltradasComputadas" scrollable scrollHeight="600px" @rowSelect="onRowSelect" selectionMode="single" dataKey="id" paginator :rows="10" :rowsPerPageOptions="[5, 10, 20, 50]" tableStyle="min-width: 50rem" :rowClass="rowClass">
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
.chart-size {
  height: 400px !important;
  width: 100%;  
}
.altura{
    height: 436px !important;
}

</style>
