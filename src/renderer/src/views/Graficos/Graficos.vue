<script setup>
import { ref, onMounted } from 'vue';
import { Line } from 'vue-chartjs';
import { peticionesFetch, nfecha, envioElectron, encryptarPassword } from '../../funciones/funciones.js';
import { useToast } from "primevue/usetoast";
import LoadingOverlay from '../../Loading/LoadingOverlay.vue';
import { useDatosEmpresa } from '../../stores';

const loading = ref(true);
const link = ref(null);
const api = ref(null);
const token = ref(null);
const tokenCifrado = ref(null);
const dataAarray = ref([]);

const datosEmpresa = useDatosEmpresa();
const resultadosPorMes = ref({ ventas: [], ganancias: [], impuestos: [], gastos: [], devoluciones: [], abonos: [], taller: [], cuentas_cobrar: [], meses: [] }); 
const resultadosPorMesVista = ref(null); // Define resultadosPorMes como ref
const chartData = ref(null); // Inicializa como null
const chartOptions = ref(null); // Inicializa como null
const mesSeleccionado = ref("Todo"); // Por defecto, se muestra "Todo"
/************************************************************************/
// Función para obtener los datos desde el backend
const fetchData = async () => {
    const fechaFinN = nfecha('timestamp');
    const response = await peticionesFetch(`${link.value}${api.value}`, `datosventasporrango`, {
        fechainicio: '2024-01-01 00:00:01',
        fechafinal: fechaFinN,
    }, tokenCifrado.value, 'POST');
    dataAarray.value = response;
};

/************************************************************************/
const calcularTotal = (array) => {
    return array.reduce((acc, valor) => acc + valor, 0).toFixed(2);
};

/************************************************************************/
// Procesar datos mensuales para generar ventas, ganancias, impuestos, etc.
const procesarDatosMensuales = (datos) => {
    const resultadosPorMes = {
        ventas: Array(12).fill(0),
        ganancias: Array(12).fill(0),
        impuestos: Array(12).fill(0),
        gastos: Array(12).fill(0),
        devoluciones: Array(12).fill(0),
        abonos: Array(12).fill(0),
        taller: Array(12).fill(0), // Agregar taller
        cuentas_cobrar: Array(12).fill(0), // Agregar cuentas por cobrar
        meses: ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'],
    };

    // Procesar "registrocaja"
/*    if (datos.registrocaja && datos.registrocaja.length > 0) {
        datos.registrocaja.forEach((registro) => {
            const fecha = new Date(registro.updated_at);
            const mes = fecha.getMonth();

            resultadosPorMes.ventas[mes] += parseFloat(registro.ventas) || 0;
            resultadosPorMes.ganancias[mes] += parseFloat(registro.ganancias) || 0;
            resultadosPorMes.gastos[mes] += parseFloat(registro.gastos) || 0;
            resultadosPorMes.devoluciones[mes] += parseFloat(registro.devoluciones) || 0;
            resultadosPorMes.abonos[mes] += parseFloat(registro.abono) || 0;
            resultadosPorMes.taller[mes] += parseFloat(registro.taller) || 0; // Sumar valores de taller
            //resultadosPorMes.cuentas_cobrar[mes] += parseFloat(registro.cuentas_cobrar) || 0; // Sumar cuentas por cobrar
        });
    }*/

    // Procesar "facturas"
    if (datos.facturas && datos.facturas.length > 0) {
        datos.facturas.forEach((factura) => {
            const fecha = new Date(factura.updated_at);
            const mes = fecha.getMonth();

            resultadosPorMes.ventas[mes] += parseFloat(factura.total) || 0;
            resultadosPorMes.ganancias[mes] += parseFloat(factura.ganancia) || 0;
            resultadosPorMes.impuestos[mes] += parseFloat(factura.impuesto) || 0;
        });
    }


    if (datos.gastos && datos.gastos.length > 0) {
        datos.gastos.forEach((gastos) => {
            const fecha = new Date(gastos.updated_at);
            const mes = fecha.getMonth();

            resultadosPorMes.gastos[mes] += parseFloat(gastos.cantidad) || 0;

        });
    }


    if (datos.taller && datos.taller.length > 0) {
        datos.taller.forEach((taller) => {
            const fecha = new Date(taller.updated_at);
            const mes = fecha.getMonth();
            resultadosPorMes.taller[mes] += parseFloat(taller.total) || 0;

        });
    }


    if (datos.cuentas_cobrar && datos.cuentas_cobrar.length > 0) {
        datos.cuentas_cobrar.forEach((cuentas_cobrar) => {
            const fecha = new Date(cuentas_cobrar.updated_at);
            const mes = fecha.getMonth();
            resultadosPorMes.cuentas_cobrar[mes] += parseFloat(cuentas_cobrar.monto_credito) || 0;

        });
    }


    if (datos.devoluciones && datos.devoluciones.length > 0) {
        datos.devoluciones.forEach((devoluciones) => {
            const fecha = new Date(devoluciones.updated_at);
            const mes = fecha.getMonth();
            resultadosPorMes.devoluciones[mes] += parseFloat(devoluciones.cantidad) || 0;

        });
    }



    return resultadosPorMes;
};


/************************************************************************/
// Establecer datos del gráfico
const setChartData = (resultadosPorMes) => {
    const documentStyle = getComputedStyle(document.documentElement);

    return {
        labels: resultadosPorMes.meses,
        datasets: [
            {
                label: 'Ventas',
                backgroundColor: documentStyle.getPropertyValue('--p-cyan-500'),
                borderColor: documentStyle.getPropertyValue('--p-cyan-500'),
                data: resultadosPorMes.ventas
            },
            {
                label: 'Ganancias',
                backgroundColor: documentStyle.getPropertyValue('--p-gray-500'),
                borderColor: documentStyle.getPropertyValue('--p-gray-500'),
                data: resultadosPorMes.ganancias
            },
            {
                label: 'Gastos',
                backgroundColor: documentStyle.getPropertyValue('--p-red-500'),
                borderColor: documentStyle.getPropertyValue('--p-red-500'),
                data: resultadosPorMes.gastos
            },
            {
                label: 'Impuestos',
                backgroundColor: documentStyle.getPropertyValue('--p-purple-500'),
                borderColor: documentStyle.getPropertyValue('--p-purple-500'),
                data: resultadosPorMes.impuestos
            },
            {
                label: 'Devoluciones',
                backgroundColor: documentStyle.getPropertyValue('--p-green-500'),
                borderColor: documentStyle.getPropertyValue('--p-green-500'),
                data: resultadosPorMes.devoluciones
            },
            {
                label: 'Abonos',
                backgroundColor: documentStyle.getPropertyValue('--p-blue-500'),
                borderColor: documentStyle.getPropertyValue('--p-blue-500'),
                data: resultadosPorMes.abonos
            },
            {
                label: 'Taller', // Agregar Taller
                backgroundColor: documentStyle.getPropertyValue('--p-orange-500'),
                borderColor: documentStyle.getPropertyValue('--p-orange-500'),
                data: resultadosPorMes.taller
            },
            {
                label: 'Cuentas por Cobrar', // Agregar Cuentas por Cobrar
                backgroundColor: documentStyle.getPropertyValue('--p-yellow-500'),
                borderColor: documentStyle.getPropertyValue('--p-yellow-500'),
                data: resultadosPorMes.cuentas_cobrar
            }
        ]
    };
};


/************************************************************************/
// Establecer las opciones del gráfico
const setChartOptions = () => {
    const documentStyle = getComputedStyle(document.documentElement);
    const textColor = documentStyle.getPropertyValue('--p-text-color');
    const textColorSecondary = documentStyle.getPropertyValue('--p-text-muted-color');
    const surfaceBorder = documentStyle.getPropertyValue('--p-content-border-color');

    return {
        maintainAspectRatio: false,
        aspectRatio: 0.8,
        plugins: {
            legend: {
                labels: {
                    color: textColor
                }
            }
        },
        scales: {
            x: {
                ticks: {
                    color: textColorSecondary,
                    font: {
                        weight: 500
                    }
                },
                grid: {
                    display: false,
                    drawBorder: false
                }
            },
            y: {
                ticks: {
                    color: textColorSecondary
                },
                grid: {
                    color: surfaceBorder,
                    drawBorder: false
                }
            }
        }
    };
};

/************************************************************************/
const filtrarPorMes = () => {
  if (!resultadosPorMes.value) return; // Verifica que resultadosPorMes está disponible

  let datosFiltrados;

  if (mesSeleccionado.value === "Todo") {
    // Mostrar todos los meses
    resultadosPorMesVista.value = resultadosPorMes.value;
  } else {
    const mesIndex = parseInt(mesSeleccionado.value);
    
    // Filtrar solo el mes seleccionado
    resultadosPorMesVista.value = {
      ventas: [resultadosPorMes.value.ventas[mesIndex]],
      ganancias: [resultadosPorMes.value.ganancias[mesIndex]],
      impuestos: [resultadosPorMes.value.impuestos[mesIndex]],
      gastos: [resultadosPorMes.value.gastos[mesIndex]],
      devoluciones: [resultadosPorMes.value.devoluciones[mesIndex]],
      abonos: [resultadosPorMes.value.abonos[mesIndex]],
      taller: [resultadosPorMes.value.taller[mesIndex]],
      cuentas_cobrar: [resultadosPorMes.value.cuentas_cobrar[mesIndex]],
      meses: [resultadosPorMes.value.meses[mesIndex]] // Solo mostrar el mes seleccionado
    };
  }

  // Actualizar los datos del gráfico
  chartData.value = setChartData(resultadosPorMesVista.value);
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

    const resultados = procesarDatosMensuales(dataAarray.value);
    if (resultados) {
      resultadosPorMes.value = resultados;
      resultadosPorMesVista.value = resultados; // Inicializa con todos los meses
      chartData.value = setChartData(resultados); // Inicializa el gráfico con todos los datos
      chartOptions.value = setChartOptions();
    }

    chartData.value = setChartData(resultadosPorMes);
    chartOptions.value = setChartOptions();

filtrarPorMes()

});
</script>
<template>
  <main class="content-wrapper">
    <div class="w-full px-4 mt-1">
      <div class="grid grid-cols-12 gap-4">

        <!-- Resumen en Card -->
        <div class="md:col-span-12 mt-1">
          <div class="card shadow-sm">
            <div class="card-header bg-primary text-white text-center">
              <h5>Resumen Financiero</h5>
            </div>
            <div class="card-body">
              <div class="grid grid-cols-12 gap-4 text-center">
                <div class="md:col-span-4 offset-md-4">
                  <label for="mesSelect" class="form-label">Selecciona un Mes:</label>
                  <!-- Asegúrate de que resultadosPorMes y meses estén disponibles antes de usar el select -->
                  <select v-if="resultadosPorMes && resultadosPorMes.meses" v-model="mesSeleccionado" @change="filtrarPorMes" class="form-select" id="mesSelect">
                    <option value="Todo">Todo</option>
                    <option v-for="(mes, index) in resultadosPorMes.meses" :key="index" :value="index">{{ mes }}</option>
                  </select>
                </div>
<div class="col-span-12 mt-4"></div>
                <!-- Tarjetas dinámicas basadas en resultadosPorMesVista -->
                <div class="md:col-span-4 lg:col-span-3 mb-3" v-if="resultadosPorMesVista">
                  <div class="card bg-light border">
                    <div class="card-body">
                      <h6><strong>Ventas Totales</strong></h6>
                      <p class="text-success display-6">{{ calcularTotal(resultadosPorMesVista.ventas) }}</p>
                    </div>
                  </div>
                </div>
                <div class="md:col-span-4 lg:col-span-3 mb-3" v-if="resultadosPorMesVista">
                  <div class="card bg-light border">
                    <div class="card-body">
                      <h6><strong>Ganancias Totales</strong></h6>
                      <p class="text-success display-6">{{ calcularTotal(resultadosPorMesVista.ganancias) }}</p>
                    </div>
                  </div>
                </div>
                <div class="md:col-span-4 lg:col-span-3 mb-3" v-if="resultadosPorMesVista">
                  <div class="card bg-light border">
                    <div class="card-body">
                      <h6><strong>Gastos Totales</strong></h6>
                      <p class="text-danger display-6">{{ calcularTotal(resultadosPorMesVista.gastos) }}</p>
                    </div>
                  </div>
                </div>
                <div class="md:col-span-4 lg:col-span-3 mb-3" v-if="resultadosPorMesVista">
                  <div class="card bg-light border">
                    <div class="card-body">
                      <h6><strong>Impuestos Totales</strong></h6>
                      <p class="text-warning display-6">{{ calcularTotal(resultadosPorMesVista.impuestos) }}</p>
                    </div>
                  </div>
                </div>
                <div class="md:col-span-4 lg:col-span-3 mb-3" v-if="resultadosPorMesVista">
                  <div class="card bg-light border">
                    <div class="card-body">
                      <h6><strong>Devoluciones Totales</strong></h6>
                      <p class="text-info display-6">{{ calcularTotal(resultadosPorMesVista.devoluciones) }}</p>
                    </div>
                  </div>
                </div>
                <div class="md:col-span-4 lg:col-span-3 mb-3" v-if="resultadosPorMesVista">
                  <div class="card bg-light border">
                    <div class="card-body">
                      <h6><strong>Abonos Totales</strong></h6>
                      <p class="text-info display-6">{{ calcularTotal(resultadosPorMesVista.abonos) }}</p>
                    </div>
                  </div>
                </div>
                <div class="md:col-span-4 lg:col-span-3 mb-3" v-if="resultadosPorMesVista">
                  <div class="card bg-light border">
                    <div class="card-body">
                      <h6><strong>Taller</strong></h6>
                      <p class="text-info display-6">{{ calcularTotal(resultadosPorMesVista.taller) }}</p>
                    </div>
                  </div>
                </div>
                <div class="md:col-span-4 lg:col-span-3 mb-3" v-if="resultadosPorMesVista">
                  <div class="card bg-light border">
                    <div class="card-body">
                      <h6><strong>Cuentas por Cobrar</strong></h6>
                      <p class="text-info display-6">{{ calcularTotal(resultadosPorMesVista.cuentas_cobrar) }}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="md:col-span-12">
          <fieldset class="border p-3 rounded mb-2">
            <legend class="float-none w-auto px-2">Datos de Graficos</legend>
            <div class="grid grid-cols-12 gap-4">
              <div class="sm:col-span-12">
                <div class="card">
                  <!-- Renderiza el gráfico solo si chartData y chartOptions están listos -->
                  <Chart v-if="chartData && chartOptions" type="bar" :data="chartData" :options="chartOptions" class="h-[30rem]" />
                </div>
              </div>
            </div>
          </fieldset>
        </div>


        <LoadingOverlay :visible="loading" />
        <Toast />
      </div>
    </div>
  </main>
</template>


<style scoped>
</style>
