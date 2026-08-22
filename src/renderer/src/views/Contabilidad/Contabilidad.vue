<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { enviarDatosPorPost, eliminarDatos, obtenerIdsSeleccionados, borrarTodoslosDatos, lenguajeDataTable, nfecha, cerrarSession, arrayToObjetoFromTabla, peticionesFetch, encryptarPassword, envioElectron, mensajetoast, peticiones, lasMayusculas } from '../../funciones/funciones.js';
import bcrypt from 'bcryptjs';
import Swal from 'sweetalert2';
import { useToast } from "primevue/usetoast";

const router = useRouter();
const toast = useToast();

/************************************************************************/
const visibleCambioEmpresa = ref(false);
const empresasVisible = ref(false);

/************************************************************************/
import { useDatosEmpresa } from '../../stores';
const datosEmpresa = useDatosEmpresa();
const link = ref('');
const api = ref('');
const token = ref('');
const patronTelefono = ref('');
const linkImpresora = ref('');
const patroncedula = ref('');
const tokenCorto = ref('');
const tokenCifrado = ref(null);
const empresasArray = ref([]);
const empresasArrayGuardada = ref([]);
const empresaSelected = ref(null);
const searchQuery = ref('');

/************************************************************************/
document.body.classList.add('sidebar-close');

/************************************************************************/
// Menús organizados por categoría
const menuReportes = [
  { label: 'Mayor General', to: '/mayorgeneral', icon: 'pi pi-book', color: 'bg-blue-50 hover:bg-blue-100 text-blue-700', description: 'Consulta movimientos por cuenta' },
  { label: 'Libro Diario', to: '/asientodiario', icon: 'pi pi-book-open', color: 'bg-sky-50 hover:bg-sky-100 text-sky-700', description: 'Registro cronológico de transacciones' },
  { label: 'Balance de Comprobación', to: '/balance', icon: 'pi pi-chart-bar', color: 'bg-green-50 hover:bg-green-100 text-green-700', description: 'Verifica saldos de cuentas' },
  { label: 'Estado de Resultados', to: '/estado-resultados', icon: 'pi pi-chart-line', color: 'bg-purple-50 hover:bg-purple-100 text-purple-700', description: 'Análisis de ingresos y gastos' },
  { label: 'Estado de Situación', to: '/estado-situacion', icon: 'pi pi-briefcase', color: 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700', description: 'Balance general de la empresa' },
  { label: 'Movimientos de Cuentas', to: '/movimientos-cuentas', icon: 'pi pi-arrows-h', color: 'bg-rose-50 hover:bg-rose-100 text-rose-700', description: 'Detalle de movimientos por cuenta contable' },
  { label: 'Trazabilidad de Transacciones', to: '/trazabilidad-transacciones', icon: 'pi pi-arrow-right-arrow-left', color: 'bg-violet-50 hover:bg-violet-100 text-violet-700', description: 'Consulta el origen y destino de cada movimiento' },
  { label: 'Antigüedad de Saldos', to: '/antiguedad-saldos', icon: 'pi pi-clock', color: 'bg-red-50 hover:bg-red-100 text-red-700', description: 'Cartera vigente y vencida por tramos' },
  { label: 'Flujo de Caja', to: '/flujo-caja', icon: 'pi pi-chart-line', color: 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700', description: 'Proyección de cobros, pagos y liquidez' },
  { label: 'Valoración de Inventario', to: '/valoracion-inventario', icon: 'pi pi-chart-pie', color: 'bg-lime-50 hover:bg-lime-100 text-lime-700', description: 'Costo, margen y conciliación contable del inventario' },
  { label: 'Integridad del Sistema', to: '/integridad-sistema', icon: 'pi pi-shield', color: 'bg-orange-50 hover:bg-orange-100 text-orange-700', description: 'Detecta inconsistencias entre módulos' },
  { label: 'Reportes y Analítica', to: '/reportes-analitica', icon: 'pi pi-chart-pie', color: 'bg-teal-50 hover:bg-teal-100 text-teal-700', description: 'Reportes dinámicos y análisis de datos' },
  { label: '606 - Reporte de Compras', to: '/reporte-606', icon: 'pi pi-file-import', color: 'bg-amber-50 hover:bg-amber-100 text-amber-700', description: 'Reporte fiscal de compras (606)' },
  { label: '607 - Reporte de Ventas', to: '/reporte-607', icon: 'pi pi-file-export', color: 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700', description: 'Reporte fiscal de ventas (607)' },
];

const menuGestion = [
  { label: 'Asiento Diario', to: '/asientodiario', icon: 'pi pi-calendar', color: 'bg-orange-50 hover:bg-orange-100 text-orange-700', description: 'Registro de asientos contables' },
  { label: 'Catálogo de Cuentas', to: '/cuentas', icon: 'pi pi-th-large', color: 'bg-cyan-50 hover:bg-cyan-100 text-cyan-700', description: 'Administra plan de cuentas' },
  { label: 'Kardex de Inventario', to: '/kardex-inventario', icon: 'pi pi-list-check', color: 'bg-blue-50 hover:bg-blue-100 text-blue-700', description: 'Historial completo de entradas y salidas' },
  { label: 'Conteo Físico', to: '/conteo-fisico', icon: 'pi pi-clipboard', color: 'bg-amber-50 hover:bg-amber-100 text-amber-700', description: 'Conteos y ajustes auditados de inventario' },
  { label: 'Transferencias entre Almacenes', to: '/transferencias-almacenes', icon: 'pi pi-truck', color: 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700', description: 'Despacho, tránsito y recepción de mercancía' },
  { label: 'Órdenes de Compra', to: '/ordenes-compra', icon: 'pi pi-shopping-cart', color: 'bg-teal-50 hover:bg-teal-100 text-teal-700', description: 'Solicitudes y recepción de proveedores' },
  { label: 'Períodos Contables', to: '/periodos-contables', icon: 'pi pi-lock', color: 'bg-slate-50 hover:bg-slate-100 text-slate-700', description: 'Cierre y reapertura auditada de meses' },
  { label: 'Centro de Aprobaciones', to: '/centro-aprobaciones', icon: 'pi pi-check-square', color: 'bg-purple-50 hover:bg-purple-100 text-purple-700', description: 'Autoriza operaciones sensibles' },
  { label: 'Centros de Costo', to: '/centros-costo', icon: 'pi pi-sitemap', color: 'bg-fuchsia-50 hover:bg-fuchsia-100 text-fuchsia-700', description: 'Presupuesto contra ejecución por área' },
  { label: 'Comprobantes Electrónicos', to: '/comprobantes-electronicos', icon: 'pi pi-file-pdf', color: 'bg-red-50 hover:bg-red-100 text-red-700', description: 'Gestión de comprobantes fiscales electrónicos' },
  { label: 'Cierre de Año Fiscal', to: '/cierre-fiscal', icon: 'pi pi-lock', color: 'bg-red-50 hover:bg-red-100 text-red-700', description: 'Cierre contable anual' },
];

const menuFinanciero = [
  { label: 'Cuentas por Pagar', to: '/cuentasxpagar', icon: 'pi pi-money-bill', color: 'bg-red-50 hover:bg-red-100 text-red-700', description: 'Gestión de cuentas por pagar' },
  { label: 'Cuentas por Cobrar', to: '/cuentas_cobrar', icon: 'pi pi-dollar', color: 'bg-green-50 hover:bg-green-100 text-green-700', description: 'Gestión de cuentas por cobrar' },
  { label: 'Bancos', to: '/banco', icon: 'pi pi-building-columns', color: 'bg-blue-50 hover:bg-blue-100 text-blue-700', description: 'Gestión de cuentas bancarias' },
  { label: 'Utilidades', to: '/utilidades', icon: 'pi pi-chart-pie', color: 'bg-purple-50 hover:bg-purple-100 text-purple-700', description: 'Análisis de utilidades' },
  { label: 'Distribución de Utilidades', to: '/distribucion-utilidades', icon: 'pi pi-percentage', color: 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700', description: 'Configura reparto automático por cuenta contable' },
];

const menuBancos = [
  { label: 'Transacciones Bancarias', to: '/transaccionesbancarias', icon: 'pi pi-arrows-h', color: 'bg-blue-50 hover:bg-blue-100 text-blue-700', description: 'Registro de transacciones bancarias' },
  { label: 'Cheques', to: '/cheques', icon: 'pi pi-book', color: 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700', description: 'Gestión y control de cheques' },
  { label: 'Conciliaciones Bancarias', to: '/conciliaciones', icon: 'pi pi-calculator', color: 'bg-purple-50 hover:bg-purple-100 text-purple-700', description: 'Concilia saldos bancarios con registros contables' },
  { label: 'Comisiones Bancarias', to: '/comisionesbancarias', icon: 'pi pi-percentage', color: 'bg-pink-50 hover:bg-pink-100 text-pink-700', description: 'Gestión de comisiones y cargos bancarios' },
];

const menuOperaciones = [
  { label: 'Gastos Fijos', to: '/gastosfijos', icon: 'pi pi-wallet', color: 'bg-orange-50 hover:bg-orange-100 text-orange-700', description: 'Gestión de gastos fijos' },
  { label: 'Gastos', to: '/gastos', icon: 'pi pi-credit-card', color: 'bg-yellow-50 hover:bg-yellow-100 text-yellow-700', description: 'Registro de gastos' },
  { label: 'Entradas Extra', to: '/entradas', icon: 'pi pi-arrow-down', color: 'bg-green-50 hover:bg-green-100 text-green-700', description: 'Registro de entradas extraordinarias' },
  { label: 'Entradas Fijas', to: '/entradasfijas', icon: 'pi pi-arrow-down', color: 'bg-teal-50 hover:bg-teal-100 text-teal-700', description: 'Gestión de entradas fijas' },
  { label: 'Caja', to: '/caja', icon: 'pi pi-box', color: 'bg-amber-50 hover:bg-amber-100 text-amber-700', description: 'Gestión y control de caja' },
  { label: 'Caja Chica', to: '/caja-chica', icon: 'pi pi-coins', color: 'bg-lime-50 hover:bg-lime-100 text-lime-700', description: 'Gestión de caja chica, pagos y compras menores' },
  { label: 'Recibos', to: '/recibos', icon: 'pi pi-receipt', color: 'bg-cyan-50 hover:bg-cyan-100 text-cyan-700', description: 'Gestión de recibos' },
  { label: 'Ventas', to: '/reportes', icon: 'pi pi-shopping-cart', color: 'bg-green-50 hover:bg-green-100 text-green-700', description: 'Reporte de ventas' },
  { label: 'Inventario/Compras', to: '/compras', icon: 'pi pi-box', color: 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700', description: 'Gestión de inventario y compras' },
];

const menuAdministrativo = [
  { label: 'Recursos Humanos', to: '/nomina', icon: 'pi pi-users', color: 'bg-cyan-50 hover:bg-cyan-100 text-cyan-700', description: 'Gestión de recursos humanos' },
  { label: 'Activos Fijos', to: '/activos-fijos', icon: 'pi pi-desktop', color: 'bg-gray-50 hover:bg-gray-100 text-gray-700', description: 'Gestión de activos fijos' },
];

const menuAnalisis = [
  { label: 'Gerenciales/Estadísticas', to: '/graficos', icon: 'pi pi-chart-bar', color: 'bg-pink-50 hover:bg-pink-100 text-pink-700', description: 'Reportes gerenciales y estadísticas' },
  { label: 'Ventas por Vendedores', to: '/reporte-vendedores', icon: 'pi pi-users', color: 'bg-orange-50 hover:bg-orange-100 text-orange-700', description: 'Análisis de ventas por vendedor' },
  { label: 'Ventas por Cajero', to: '/ventas-por-cajero', icon: 'pi pi-user', color: 'bg-blue-50 hover:bg-blue-100 text-blue-700', description: 'Reporte de ventas por cajero' },
  { label: 'Ventas por Clientes', to: '/ventas-por-clientes', icon: 'pi pi-users', color: 'bg-purple-50 hover:bg-purple-100 text-purple-700', description: 'Análisis de ventas por cliente' },
  { label: 'Taller por Técnicos', to: '/taller-por-tecnicos', icon: 'pi pi-wrench', color: 'bg-orange-50 hover:bg-orange-100 text-orange-700', description: 'Desempeño de técnicos del taller' },
  { label: 'Comisiones de Ventas', to: '/comisiones-ventas', icon: 'pi pi-dollar', color: 'bg-green-50 hover:bg-green-100 text-green-700', description: 'Cálculo de comisiones por vendedor' },
];

const menuEmpresa = [
  { label: 'Cambio de Empresa', action: 'cambiarEmpresa', icon: 'pi pi-building', color: 'bg-teal-50 hover:bg-teal-100 text-teal-700', description: 'Cambiar contexto empresarial' },
];

const allMenuItems = computed(() => {
  const items = [...menuReportes, ...menuGestion, ...menuBancos, ...menuFinanciero, ...menuOperaciones, ...menuAdministrativo, ...menuAnalisis];
  if (esSoporte.value) items.push(...menuEmpresa);
  return items;
});

const esSoporte = computed(() => datosEmpresa.datosUsuario?.usuario === 'Soporte');

const menuFiltrado = computed(() => {
  if (!searchQuery.value) return null;

  const query = searchQuery.value.toLowerCase();
  return allMenuItems.value.filter(item =>
    item.label.toLowerCase().includes(query) ||
    item.description.toLowerCase().includes(query)
  );
});

/************************************************************************/
const handleKeyDown = (event) => {
  if (event.ctrlKey && event.key === 'p') {
    event.preventDefault();

    Swal.fire({
      title: 'Introduce la contraseña',
      input: 'password',
      inputPlaceholder: 'Contraseña',
      showCancelButton: true,
      confirmButtonText: 'Aceptar',
      cancelButtonText: 'Cancelar'
    }).then(async (result) => {
      if (result.isConfirmed) {
        const contrasenaIngresada = result.value;

        if (contrasenaIngresada === token.value || contrasenaIngresada === tokenCorto.value) {
          const empresas = await peticionesFetch(`https://master.tmposrd.com${api.value}`, 'datosarraypost', { 'tabla': 'empresas' }, tokenCifrado.value, 'POST');
          empresasArray.value = empresas;
          visibleCambioEmpresa.value = true;
        } else {
          toast.add({ severity: 'error', summary: 'Error', detail: 'Contraseña incorrecta', life: 3000 });
        }
      }
    });
  }
};

/************************************************************************/
const empresasAll = async () => {
  try {
    const empresas = await peticionesFetch(`https://master.tmposrd.com${api.value}`, 'datosarraypost', { 'tabla': 'empresas' }, tokenCifrado.value, 'POST');
    empresasArrayGuardada.value = empresas;
    empresasArray.value = empresas;
  } catch (error) {
    console.error('Error al cargar empresas:', error);
    toast.add({ severity: 'error', summary: 'Error', detail: 'Error al cargar empresas', life: 3000 });
  }
};

/************************************************************************/
onMounted(async () => {
  try {
    const datosJSON = await envioElectron('datosarchivo');
    link.value = datosJSON.VITE_LINKURL;
    api.value = datosJSON.VITE_LINK_API;
    token.value = datosJSON.VITE_TOKEN;
    patronTelefono.value = datosJSON.VITE_PATRON_TELEFONO;
    linkImpresora.value = datosJSON.VITE_IMPRESORA_LOCAL;
    patroncedula.value = datosJSON.VITE_PATRON_CEDULA;
    tokenCorto.value = datosJSON.VITE_TOKEN_CORTO;
    tokenCifrado.value = await encryptarPassword(token.value, 10);

    await empresasAll();
    window.addEventListener('keydown', handleKeyDown);

    if (datosEmpresa.datosUsuario.usuario !== "Soporte") {
      const empresasA = datosJSON.VITE_EMPRESAS;
      if (empresasA) {
        let nombreEmpresaArray = empresasA.split(',').map(empresa => empresa.trim());
        let empresasFiltradas = empresasArrayGuardada.value.filter(empresa =>
          nombreEmpresaArray.includes(empresa.nombre)
        );
        empresasArray.value = empresasFiltradas;
      }
    }
  } catch (error) {
    console.error('Error en onMounted:', error);
    toast.add({ severity: 'error', summary: 'Error', detail: 'Error al inicializar', life: 3000 });
  }
});

/************************************************************************/
const fnRealizarCambioEmpresa = async () => {
  if (!empresaSelected.value) {
    toast.add({ severity: 'warn', summary: 'Advertencia', detail: 'Selecciona una empresa', life: 3000 });
    return;
  }

  try {
    const datos = empresaSelected.value;
    const nJSONResponse = await envioElectron('datosarchivo');

    const nJSON = nJSONResponse;
    nJSON.VITE_LINKURL = datos.link.replace(/\/$/, '');
    const clonedData = JSON.parse(JSON.stringify(nJSON));
    await window.electron.ipcRenderer.invoke('actualizarjson', clonedData);

    toast.add({ severity: 'success', summary: 'Éxito', detail: 'Empresa cambiada, redirigiendo...', life: 2000 });

    setTimeout(() => {
      cerrarSession();
      router.push('/login');
    }, 2000);
  } catch (error) {
    console.error('Error al cambiar empresa:', error);
    toast.add({ severity: 'error', summary: 'Error', detail: 'Error al cambiar empresa', life: 3000 });
  }
};

/************************************************************************/
const fnCambiarEmpresa = async (empresa) => {
  try {
    const datos = empresa;
    const nJSONResponse = await envioElectron('datosarchivo');

    const nJSON = nJSONResponse;
    nJSON.VITE_LINKURL = datos.link.replace(/\/$/, '');
    const clonedData = JSON.parse(JSON.stringify(nJSON));
    await window.electron.ipcRenderer.invoke('actualizarjson', clonedData);

    toast.add({ severity: 'success', summary: 'Éxito', detail: 'Empresa cambiada, redirigiendo...', life: 2000 });

    setTimeout(() => {
      cerrarSession();
      router.push('/login');
    }, 2000);
  } catch (error) {
    console.error('Error al cambiar empresa:', error);
    toast.add({ severity: 'error', summary: 'Error', detail: 'Error al cambiar empresa', life: 3000 });
  }
};

/************************************************************************/
const handleMenuClick = (item) => {
  if (item.action === 'cambiarEmpresa') {
    empresasVisible.value = true;
  } else if (item.to) {
    router.push(item.to);
  }
};
</script>

<template>
  <main class="content-wrapper bg-gray-50 min-h-screen">
    <div class="w-full px-4 py-6">
      <!-- Header -->
      <div class="mb-6">
        <h1 class="text-3xl font-bold text-gray-800 mb-2">Módulo de Contabilidad</h1>
        <p class="text-gray-600">Gestiona todos los aspectos contables de tu empresa</p>
      </div>

      <!-- Buscador -->
      <Card class="mb-6">
        <template #content>
          <div class="relative">
            <i class="pi pi-search absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Buscar módulo contable..."
              class="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
            />
          </div>
        </template>
      </Card>

      <!-- Resultados de búsqueda -->
      <div v-if="menuFiltrado && menuFiltrado.length > 0" class="mb-6">
        <Card>
          <template #title>
            <div class="flex items-center gap-2">
              <i class="pi pi-search text-blue-600"></i>
              <span>Resultados de búsqueda ({{ menuFiltrado.length }})</span>
            </div>
          </template>
          <template #content>
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              <div
                v-for="item in menuFiltrado"
                :key="item.label"
                @click="handleMenuClick(item)"
                :class="[
                  'p-5 rounded-xl border-2 border-transparent transition-all duration-200 cursor-pointer hover:border-current hover:shadow-lg transform hover:scale-105',
                  item.color
                ]"
              >
                <div class="flex flex-col items-center text-center gap-3">
                  <div class="w-16 h-16 rounded-full bg-white bg-opacity-50 flex items-center justify-center">
                    <i :class="item.icon + ' text-3xl'"></i>
                  </div>
                  <div>
                    <h3 class="font-bold text-base mb-1">{{ item.label }}</h3>
                    <p class="text-xs opacity-80">{{ item.description }}</p>
                  </div>
                </div>
              </div>
            </div>
          </template>
        </Card>
      </div>

      <!-- Menú principal (cuando no hay búsqueda) -->
      <div v-else>
        <!-- Reportes Contables -->
        <Card class="mb-6 shadow-lg">
          <template #title>
            <div class="flex items-center gap-2">
              <i class="pi pi-chart-line text-blue-600"></i>
              <span>Reportes Contables</span>
            </div>
          </template>
          <template #content>
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              <div
                v-for="item in menuReportes"
                :key="item.label"
                @click="handleMenuClick(item)"
                :class="[
                  'p-5 rounded-xl border-2 border-transparent transition-all duration-200 cursor-pointer hover:border-current hover:shadow-lg transform hover:scale-105',
                  item.color
                ]"
              >
                <div class="flex flex-col items-center text-center gap-3">
                  <div class="w-16 h-16 rounded-full bg-white bg-opacity-50 flex items-center justify-center">
                    <i :class="item.icon + ' text-3xl'"></i>
                  </div>
                  <div>
                    <h3 class="font-bold text-base mb-1">{{ item.label }}</h3>
                    <p class="text-xs opacity-80">{{ item.description }}</p>
                  </div>
                </div>
              </div>
            </div>
          </template>
        </Card>

        <!-- Gestión Contable -->
        <Card class="mb-6 shadow-lg">
          <template #title>
            <div class="flex items-center gap-2">
              <i class="pi pi-cog text-orange-600"></i>
              <span>Gestión Contable</span>
            </div>
          </template>
          <template #content>
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div
                v-for="item in menuGestion"
                :key="item.label"
                @click="handleMenuClick(item)"
                :class="[
                  'p-5 rounded-xl border-2 border-transparent transition-all duration-200 cursor-pointer hover:border-current hover:shadow-lg transform hover:scale-105',
                  item.color
                ]"
              >
                <div class="flex flex-col items-center text-center gap-3">
                  <div class="w-16 h-16 rounded-full bg-white bg-opacity-50 flex items-center justify-center">
                    <i :class="item.icon + ' text-3xl'"></i>
                  </div>
                  <div>
                    <h3 class="font-bold text-base mb-1">{{ item.label }}</h3>
                    <p class="text-xs opacity-80">{{ item.description }}</p>
                  </div>
                </div>
              </div>
            </div>
          </template>
        </Card>

        <!-- Bancos -->
        <Card class="mb-6 shadow-lg">
          <template #title>
            <div class="flex items-center gap-2">
              <i class="pi pi-building-columns text-blue-600"></i>
              <span>Bancos</span>
            </div>
          </template>
          <template #content>
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div
                v-for="item in menuBancos"
                :key="item.label"
                @click="handleMenuClick(item)"
                :class="[
                  'p-5 rounded-xl border-2 border-transparent transition-all duration-200 cursor-pointer hover:border-current hover:shadow-lg transform hover:scale-105',
                  item.color
                ]"
              >
                <div class="flex flex-col items-center text-center gap-3">
                  <div class="w-16 h-16 rounded-full bg-white bg-opacity-50 flex items-center justify-center">
                    <i :class="item.icon + ' text-3xl'"></i>
                  </div>
                  <div>
                    <h3 class="font-bold text-base mb-1">{{ item.label }}</h3>
                    <p class="text-xs opacity-80">{{ item.description }}</p>
                  </div>
                </div>
              </div>
            </div>
          </template>
        </Card>

        <!-- Módulos Financieros -->
        <Card class="mb-6 shadow-lg">
          <template #title>
            <div class="flex items-center gap-2">
              <i class="pi pi-wallet text-green-600"></i>
              <span>Módulos Financieros</span>
            </div>
          </template>
          <template #content>
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div
                v-for="item in menuFinanciero"
                :key="item.label"
                @click="handleMenuClick(item)"
                :class="[
                  'p-5 rounded-xl border-2 border-transparent transition-all duration-200 cursor-pointer hover:border-current hover:shadow-lg transform hover:scale-105',
                  item.color
                ]"
              >
                <div class="flex flex-col items-center text-center gap-3">
                  <div class="w-16 h-16 rounded-full bg-white bg-opacity-50 flex items-center justify-center">
                    <i :class="item.icon + ' text-3xl'"></i>
                  </div>
                  <div>
                    <h3 class="font-bold text-base mb-1">{{ item.label }}</h3>
                    <p class="text-xs opacity-80">{{ item.description }}</p>
                  </div>
                </div>
              </div>
            </div>
          </template>
        </Card>

        <!-- Operaciones -->
        <Card class="mb-6 shadow-lg">
          <template #title>
            <div class="flex items-center gap-2">
              <i class="pi pi-shopping-cart text-indigo-600"></i>
              <span>Operaciones</span>
            </div>
          </template>
          <template #content>
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              <div
                v-for="item in menuOperaciones"
                :key="item.label"
                @click="handleMenuClick(item)"
                :class="[
                  'p-5 rounded-xl border-2 border-transparent transition-all duration-200 cursor-pointer hover:border-current hover:shadow-lg transform hover:scale-105',
                  item.color
                ]"
              >
                <div class="flex flex-col items-center text-center gap-3">
                  <div class="w-16 h-16 rounded-full bg-white bg-opacity-50 flex items-center justify-center">
                    <i :class="item.icon + ' text-3xl'"></i>
                  </div>
                  <div>
                    <h3 class="font-bold text-base mb-1">{{ item.label }}</h3>
                    <p class="text-xs opacity-80">{{ item.description }}</p>
                  </div>
                </div>
              </div>
            </div>
          </template>
        </Card>

        <!-- Gestión Administrativa -->
        <Card class="mb-6 shadow-lg">
          <template #title>
            <div class="flex items-center gap-2">
              <i class="pi pi-users text-cyan-600"></i>
              <span>Gestión Administrativa</span>
            </div>
          </template>
          <template #content>
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div
                v-for="item in menuAdministrativo"
                :key="item.label"
                @click="handleMenuClick(item)"
                :class="[
                  'p-5 rounded-xl border-2 border-transparent transition-all duration-200 cursor-pointer hover:border-current hover:shadow-lg transform hover:scale-105',
                  item.color
                ]"
              >
                <div class="flex flex-col items-center text-center gap-3">
                  <div class="w-16 h-16 rounded-full bg-white bg-opacity-50 flex items-center justify-center">
                    <i :class="item.icon + ' text-3xl'"></i>
                  </div>
                  <div>
                    <h3 class="font-bold text-base mb-1">{{ item.label }}</h3>
                    <p class="text-xs opacity-80">{{ item.description }}</p>
                  </div>
                </div>
              </div>
            </div>
          </template>
        </Card>

        <!-- Análisis y Reportes Gerenciales -->
        <Card class="mb-6 shadow-lg">
          <template #title>
            <div class="flex items-center gap-2">
              <i class="pi pi-chart-bar text-pink-600"></i>
              <span>Análisis y Reportes Gerenciales</span>
            </div>
          </template>
          <template #content>
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div
                v-for="item in menuAnalisis"
                :key="item.label"
                @click="handleMenuClick(item)"
                :class="[
                  'p-5 rounded-xl border-2 border-transparent transition-all duration-200 cursor-pointer hover:border-current hover:shadow-lg transform hover:scale-105',
                  item.color
                ]"
              >
                <div class="flex flex-col items-center text-center gap-3">
                  <div class="w-16 h-16 rounded-full bg-white bg-opacity-50 flex items-center justify-center">
                    <i :class="item.icon + ' text-3xl'"></i>
                  </div>
                  <div>
                    <h3 class="font-bold text-base mb-1">{{ item.label }}</h3>
                    <p class="text-xs opacity-80">{{ item.description }}</p>
                  </div>
                </div>
              </div>
            </div>
          </template>
        </Card>

        <!-- Configuración de Empresa -->
        <Card v-if="esSoporte" class="shadow-lg">
          <template #title>
            <div class="flex items-center gap-2">
              <i class="pi pi-building text-teal-600"></i>
              <span>Configuración de Empresa</span>
            </div>
          </template>
          <template #content>
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div
                v-for="item in menuEmpresa"
                :key="item.label"
                @click="handleMenuClick(item)"
                :class="[
                  'p-5 rounded-xl border-2 border-transparent transition-all duration-200 cursor-pointer hover:border-current hover:shadow-lg transform hover:scale-105',
                  item.color
                ]"
              >
                <div class="flex flex-col items-center text-center gap-3">
                  <div class="w-16 h-16 rounded-full bg-white bg-opacity-50 flex items-center justify-center">
                    <i :class="item.icon + ' text-3xl'"></i>
                  </div>
                  <div>
                    <h3 class="font-bold text-base mb-1">{{ item.label }}</h3>
                    <p class="text-xs opacity-80">{{ item.description }}</p>
                  </div>
                </div>
              </div>
            </div>
          </template>
        </Card>
      </div>

      <!-- Panel de Empresas -->
      <Card v-if="esSoporte && empresasVisible" class="mt-6 shadow-lg">
        <template #title>
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <i class="pi pi-building text-teal-600"></i>
              <span>Selecciona una Empresa</span>
            </div>
            <Button
              icon="pi pi-times"
              text
              rounded
              severity="secondary"
              @click="empresasVisible = false"
            />
          </div>
        </template>
        <template #content>
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            <div
              v-for="item in empresasArray"
              :key="item.id"
              @click="fnCambiarEmpresa(item)"
              class="p-6 rounded-xl bg-gradient-to-br from-teal-50 to-cyan-50 hover:from-teal-100 hover:to-cyan-100 border-2 border-teal-200 hover:border-teal-400 transition-all duration-200 cursor-pointer hover:shadow-xl transform hover:scale-105"
            >
              <div class="flex flex-col items-center text-center gap-3">
                <div class="w-16 h-16 rounded-full bg-teal-600 flex items-center justify-center">
                  <i class="pi pi-building text-3xl text-white"></i>
                </div>
                <div>
                  <h3 class="font-bold text-base text-teal-800">{{ item.nombre }}</h3>
                  <p class="text-xs text-teal-600 mt-1">Click para cambiar</p>
                </div>
              </div>
            </div>
          </div>
        </template>
      </Card>
    </div>

    <!-- Modal de Cambio de Empresa (alternativo) -->
    <Dialog
      v-model:visible="visibleCambioEmpresa"
      modal
      header="Cambio de Empresa"
      :style="{ width: '500px' }"
      :breakpoints="{ '960px': '90vw' }"
    >
      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Selecciona la empresa</label>
          <Dropdown
            v-model="empresaSelected"
            :options="empresasArray"
            optionLabel="nombre"
            placeholder="Selecciona una empresa"
            class="w-full"
          >
            <template #value="slotProps">
              <div v-if="slotProps.value" class="flex items-center gap-2">
                <i class="pi pi-building"></i>
                <span>{{ slotProps.value.nombre }}</span>
              </div>
              <span v-else>{{ slotProps.placeholder }}</span>
            </template>
            <template #option="slotProps">
              <div class="flex items-center gap-2">
                <i class="pi pi-building"></i>
                <span>{{ slotProps.option.nombre }}</span>
              </div>
            </template>
          </Dropdown>
        </div>

        <div class="p-4 bg-blue-50 border-l-4 border-blue-400 rounded">
          <div class="flex items-start gap-2">
            <i class="pi pi-info-circle text-blue-600 mt-0.5"></i>
            <p class="text-sm text-blue-800">
              Al cambiar de empresa se cerrará la sesión actual y deberás iniciar sesión nuevamente.
            </p>
          </div>
        </div>
      </div>

      <template #footer>
        <Button label="Cancelar" severity="secondary" outlined @click="visibleCambioEmpresa = false" />
        <Button
          label="Cambiar Empresa"
          severity="primary"
          icon="pi pi-refresh"
          @click="fnRealizarCambioEmpresa"
          :disabled="!empresaSelected"
        />
      </template>
    </Dialog>

    <Toast />
  </main>
</template>

<style scoped>
.content-wrapper {
  min-height: calc(100vh - 60px);
}

/* Animación suave para las cards */
.transform {
  transition: transform 0.2s ease-in-out;
}
</style>
