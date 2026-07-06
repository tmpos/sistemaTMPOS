<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import {
  envioElectron,
  encryptarPassword,
  nfecha,
  transformarFechaTimestamp,
  formatearFecha
} from '../../funciones/funciones.js';
import { useDatosEmpresa } from '../../stores';
import { useToast } from "primevue/usetoast";

const router = useRouter();
const toast = useToast();
const datosEmpresa = useDatosEmpresa();

const link = ref('');
const api = ref('');
const token = ref('');
const tokenCifrado = ref(null);
const visibleRango = ref(false);
const rangoFecha = ref([]);
const tipo = ref('rango');
const position = ref('top');

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
const fnBuscarRango = () => {
  if (!rangoFecha.value || rangoFecha.value.length < 2) {
    toast.add({
      severity: 'warn',
      summary: 'Advertencia',
      detail: 'Selecciona un rango de fechas válido',
      life: 3000
    });
    return;
  }

  const fechaInicioN = transformarFechaTimestamp(formatearFecha(rangoFecha.value[0]), false);
  const fechaFinN = transformarFechaTimestamp(formatearFecha(rangoFecha.value[1]), false);

  router.push(`/${tipo.value}/${fechaInicioN} 00:00:00/${fechaFinN} 23:59:59`);
  visibleRango.value = false;
};

/************************************************************************/
const abrirModalRango = (tipoReporte) => {
  tipo.value = tipoReporte;
  rangoFecha.value = [];
  visibleRango.value = true;
};

// Reportes organizados por categorías
const reportesVentas = [
  { label: 'Ventas Generales', to: '/informes', icon: 'pi pi-chart-line', color: 'bg-blue-50 hover:bg-blue-100 text-blue-700' },
  { label: 'Reporte Anual', to: '/graficos', icon: 'pi pi-calendar', color: 'bg-purple-50 hover:bg-purple-100 text-purple-700' },
  { label: 'Reporte Mensual', to: '/reporte-mes', icon: 'pi pi-calendar-minus', color: 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700' },
  { label: 'Reporte Semanal', to: '/reporte-semana', icon: 'pi pi-calendar-times', color: 'bg-cyan-50 hover:bg-cyan-100 text-cyan-700' },
  { label: 'Reporte de Hoy', to: '/reporte-hoy', icon: 'pi pi-clock', color: 'bg-green-50 hover:bg-green-100 text-green-700' },
  { label: 'Últimos 7 días', to: '/ultimos7dias', icon: 'pi pi-chart-bar', color: 'bg-teal-50 hover:bg-teal-100 text-teal-700' }
];

const reportesPersonal = [
  { label: 'Por Vendedores', to: '/reporte-vendedores', icon: 'pi pi-users', color: 'bg-orange-50 hover:bg-orange-100 text-orange-700' },
  { label: 'Por Cajeros', to: '/reporte-cajeros', icon: 'pi pi-user', color: 'bg-amber-50 hover:bg-amber-100 text-amber-700' },
  { label: 'Por Clientes', to: '/reporte-clientes', icon: 'pi pi-user-plus', color: 'bg-yellow-50 hover:bg-yellow-100 text-yellow-700' },
  { label: 'Por Delivery', to: '/reporte-delivery', icon: 'pi pi-car', color: 'bg-lime-50 hover:bg-lime-100 text-lime-700' },
  { label: 'Por Instaladores', to: '/reporte-instaladores', icon: 'pi pi-wrench', color: 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700' },
  { label: 'Por Técnicos', to: '/reporte-tecnicos', icon: 'pi pi-cog', color: 'bg-sky-50 hover:bg-sky-100 text-sky-700' },
  { label: 'Comisiones', to: '/comisiones', icon: 'pi pi-money-bill', color: 'bg-rose-50 hover:bg-rose-100 text-rose-700' }
];

const reportesCuentas = [
  { label: 'Cuentas Por Cobrar', to: '/cuentas-cobrar', icon: 'pi pi-dollar', color: 'bg-green-50 hover:bg-green-100 text-green-700' },
  { label: 'Cuentas Por Pagar', to: '/cuentas-pagar', icon: 'pi pi-money-bill', color: 'bg-red-50 hover:bg-red-100 text-red-700' },
  { label: 'Transacciones', to: '/transacciones', icon: 'pi pi-arrows-h', color: 'bg-blue-50 hover:bg-blue-100 text-blue-700' },
  { label: 'Compras', to: '/compras', icon: 'pi pi-shopping-cart', color: 'bg-purple-50 hover:bg-purple-100 text-purple-700' }
];

const reportesContabilidad = [
  { label: 'Estado de Resultados', to: '/estado-resultados', icon: 'pi pi-chart-pie', color: 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700' },
  { label: 'Estado de Situación', to: '/estado-situacion', icon: 'pi pi-briefcase', color: 'bg-violet-50 hover:bg-violet-100 text-violet-700' },
  { label: 'Libro Diario', to: '/libro-diario', icon: 'pi pi-book', color: 'bg-fuchsia-50 hover:bg-fuchsia-100 text-fuchsia-700' },
  { label: 'Balance de Comprobación', to: '/balance-comprobacion', icon: 'pi pi-list', color: 'bg-pink-50 hover:bg-pink-100 text-pink-700' },
  { label: 'Movimientos de Cuentas', to: '/movimientos-cuentas', icon: 'pi pi-sync', color: 'bg-rose-50 hover:bg-rose-100 text-rose-700' },
  { label: 'Impuestos y Retenciones', to: '/impuestos-retenciones', icon: 'pi pi-percentage', color: 'bg-red-50 hover:bg-red-100 text-red-700' }
];

const reportesFiscales = [
  { label: 'Reporte 606', to: '/reporte-606', icon: 'pi pi-file-pdf', color: 'bg-blue-50 hover:bg-blue-100 text-blue-700' },
  { label: 'Reporte 607', to: '/reporte-607', icon: 'pi pi-file-pdf', color: 'bg-green-50 hover:bg-green-100 text-green-700' },
  { label: 'Reporte 608', to: '/reporte-608', icon: 'pi pi-file-pdf', color: 'bg-orange-50 hover:bg-orange-100 text-orange-700' }
];
</script>

<template>
  <main class="content-wrapper bg-gray-50 min-h-screen">
    <div class="w-full px-4 py-6">
      <!-- Header -->
      <div class="mb-6">
        <h1 class="text-3xl font-bold text-gray-800 mb-2">Sistema de Reportes</h1>
        <p class="text-gray-600">Consulta y analiza la información de tu negocio</p>
      </div>

      <!-- REPORTE DE VENTAS -->
      <Card class="mb-6 shadow-lg">
        <template #title>
          <div class="flex items-center gap-2">
            <i class="pi pi-chart-line text-blue-600"></i>
            <span>Reportes de Ventas</span>
          </div>
        </template>
        <template #content>
          <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            <router-link
              v-for="reporte in reportesVentas"
              :key="reporte.to"
              :to="reporte.to"
              class="group"
            >
              <div :class="['p-4 rounded-lg border-2 border-transparent transition-all duration-200 hover:border-current hover:shadow-md', reporte.color]">
                <div class="flex flex-col items-center text-center gap-2">
                  <i :class="reporte.icon + ' text-2xl'"></i>
                  <span class="text-sm font-medium">{{ reporte.label }}</span>
                </div>
              </div>
            </router-link>

            <!-- Reportes con rango de fecha -->
            <button
              @click="abrirModalRango('rango')"
              :class="['p-4 rounded-lg border-2 border-transparent transition-all duration-200 hover:border-current hover:shadow-md', 'bg-slate-50 hover:bg-slate-100 text-slate-700']"
            >
              <div class="flex flex-col items-center text-center gap-2">
                <i class="pi pi-calendar-plus text-2xl"></i>
                <span class="text-sm font-medium">Rango de Fechas</span>
              </div>
            </button>

            <button
              @click="abrirModalRango('ventas')"
              :class="['p-4 rounded-lg border-2 border-transparent transition-all duration-200 hover:border-current hover:shadow-md', 'bg-gray-50 hover:bg-gray-100 text-gray-700']"
            >
              <div class="flex flex-col items-center text-center gap-2">
                <i class="pi pi-filter text-2xl"></i>
                <span class="text-sm font-medium">Ventas por Rango</span>
              </div>
            </button>
          </div>
        </template>
      </Card>

      <!-- REPORTES POR PERSONAL -->
      <Card class="mb-6 shadow-lg">
        <template #title>
          <div class="flex items-center gap-2">
            <i class="pi pi-users text-orange-600"></i>
            <span>Reportes por Personal</span>
          </div>
        </template>
        <template #content>
          <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            <router-link
              v-for="reporte in reportesPersonal"
              :key="reporte.to"
              :to="reporte.to"
              class="group"
            >
              <div :class="['p-4 rounded-lg border-2 border-transparent transition-all duration-200 hover:border-current hover:shadow-md', reporte.color]">
                <div class="flex flex-col items-center text-center gap-2">
                  <i :class="reporte.icon + ' text-2xl'"></i>
                  <span class="text-sm font-medium">{{ reporte.label }}</span>
                </div>
              </div>
            </router-link>
          </div>
        </template>
      </Card>

      <!-- REPORTE DE CUENTAS -->
      <Card class="mb-6 shadow-lg">
        <template #title>
          <div class="flex items-center gap-2">
            <i class="pi pi-wallet text-green-600"></i>
            <span>Reportes de Cuentas</span>
          </div>
        </template>
        <template #content>
          <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            <router-link
              v-for="reporte in reportesCuentas"
              :key="reporte.to"
              :to="reporte.to"
              class="group"
            >
              <div :class="['p-4 rounded-lg border-2 border-transparent transition-all duration-200 hover:border-current hover:shadow-md', reporte.color]">
                <div class="flex flex-col items-center text-center gap-2">
                  <i :class="reporte.icon + ' text-2xl'"></i>
                  <span class="text-sm font-medium">{{ reporte.label }}</span>
                </div>
              </div>
            </router-link>
          </div>
        </template>
      </Card>

      <!-- REPORTE DE CONTABILIDAD -->
      <Card class="mb-6 shadow-lg">
        <template #title>
          <div class="flex items-center gap-2">
            <i class="pi pi-calculator text-purple-600"></i>
            <span>Reportes de Contabilidad</span>
          </div>
        </template>
        <template #content>
          <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            <router-link
              v-for="reporte in reportesContabilidad"
              :key="reporte.to"
              :to="reporte.to"
              class="group"
            >
              <div :class="['p-4 rounded-lg border-2 border-transparent transition-all duration-200 hover:border-current hover:shadow-md', reporte.color]">
                <div class="flex flex-col items-center text-center gap-2">
                  <i :class="reporte.icon + ' text-2xl'"></i>
                  <span class="text-sm font-medium">{{ reporte.label }}</span>
                </div>
              </div>
            </router-link>
          </div>
        </template>
      </Card>

      <!-- REPORTES FISCALES -->
      <Card class="mb-6 shadow-lg">
        <template #title>
          <div class="flex items-center gap-2">
            <i class="pi pi-file text-red-600"></i>
            <span>Reportes Fiscales</span>
          </div>
        </template>
        <template #content>
          <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            <router-link
              v-for="reporte in reportesFiscales"
              :key="reporte.to"
              :to="reporte.to"
              class="group"
            >
              <div :class="['p-4 rounded-lg border-2 border-transparent transition-all duration-200 hover:border-current hover:shadow-md', reporte.color]">
                <div class="flex flex-col items-center text-center gap-2">
                  <i :class="reporte.icon + ' text-2xl'"></i>
                  <span class="text-sm font-medium">{{ reporte.label }}</span>
                </div>
              </div>
            </router-link>
          </div>
        </template>
      </Card>

      <!-- Modal de Rango de Fechas -->
      <Dialog
        v-model:visible="visibleRango"
        :position="position"
        modal
        header="Seleccionar Rango de Fechas"
        :style="{ width: '500px' }"
        :breakpoints="{ '960px': '75vw', '640px': '90vw' }"
      >
        <template #header>
          <div class="flex items-center gap-2">
            <i class="pi pi-calendar text-blue-600"></i>
            <span class="font-bold">Seleccionar Rango de Fechas</span>
          </div>
        </template>

        <div class="p-4">
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Selecciona el rango de fechas para el reporte
          </label>
          <DatePicker
            v-model="rangoFecha"
            dateFormat="dd/mm/yy"
            :showIcon="true"
            selectionMode="range"
            :manualInput="false"
            class="w-full"
            placeholder="Selecciona un rango"
          />
        </div>

        <template #footer>
          <div class="flex justify-end gap-2">
            <Button
              label="Cancelar"
              severity="secondary"
              outlined
              @click="visibleRango = false"
            />
            <Button
              label="Generar Reporte"
              severity="primary"
              icon="pi pi-check"
              @click="fnBuscarRango"
            />
          </div>
        </template>
      </Dialog>

      <Toast />
    </div>
  </main>
</template>

<style scoped>
.content-wrapper {
  min-height: calc(100vh - 60px);
}

/* Animación hover para las tarjetas */
.group:hover .pi {
  transform: scale(1.1);
  transition: transform 0.2s ease-in-out;
}
</style>
