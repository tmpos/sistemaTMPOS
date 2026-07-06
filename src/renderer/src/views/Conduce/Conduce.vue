
<script setup>
import { ref, onMounted, nextTick, watchEffect,computed } from 'vue';
import axios from 'axios';
import { enviarDatosPorPost, eliminarDatos, obtenerIdsSeleccionados, borrarTodoslosDatos, lenguajeDataTable, nfecha, arrayToObjetoFromTabla, peticionesFetch, encryptarPassword, envioElectron, mensajetoast, crearTablaSiNoExiste, peticiones, lasMayusculas, peticionesFetchOffline, arrayToObjetoFromTablaOffline, crearTablaSiNoExisteOffline } from '@/funciones/funciones.js';
import Swal from 'sweetalert2'
import { useToast } from "primevue/usetoast";
const toast = useToast();
import { useRouter, useRoute } from 'vue-router';
const router = useRouter();
/************************************************************************/
/************************************************************************/
const usuarioLocal = ref({})
/************************************************************************/
const camposArray = ['no_conduce', 'no_factura', 'cod_cliente', 'cliente', 'telefono', 'direccion', 'fecha', 'vencimiento', 'chofer', 'placa', 'entrega', 'total','almacen', 'productos'];
/************************************************************************/
import { useDatosEmpresa } from '@/stores'
const datosEmpresa = useDatosEmpresa();
const link = ref('');
const api = ref('');
const token = ref('');
const patronTelefono = ref('');
const linkImpresora = ref('');
const patroncedula = ref('');
const tokenCifrado = ref('');
const tokenCorto = ref('');
/************************************************************************/
const selectedItems = ref([]);
/************************************************************************/
const position = ref('top');
const openPosition = (pos) => {
    position.value = pos;
    visible.value = true;
}
/************************************************************************/
const datoscamposConduce = ref({})
/************************************************************************/
const visible = ref(false);
const visiblecrear = ref(false);
const value = ref(null);
const id = ref(null);
const datoscampos = ref({});
const data = ref([]);
const searchQuery = ref('');
const ConduceEditar = ref(null);
/************************************************************************/
async function limpiarCamposCrear() {
datoscamposConduce.value = {}
await campos();
}
/************************************************************************/
watchEffect(() => {
  if (visiblecrear.value) {
  }
});
/************************************************************************/
const fetchAndSetupData = async () => {
const response = await peticionesFetchOffline('getDataAsArray', 'conduce');
    const jsonData = response.filter(fact=>fact.almacen === datosEmpresa.empresa.nombre).reverse();
    data.value = jsonData;
};
/************************************************************************/
async function campos() {
  const campos = await arrayToObjetoFromTablaOffline('conduce');
  datoscamposConduce.value = campos;
}
/************************************************************************/
onMounted(async () => {
const datosJSON = await envioElectron('datosarchivo');
link.value = datosJSON.VITE_LINKURL;
api.value = datosJSON.VITE_LINK_API;
token.value = datosJSON.VITE_TOKEN;
patronTelefono.value = datosJSON.VITE_PATRON_TELEFONO;
linkImpresora.value = datosJSON.VITE_IMPRESORA_LOCAL;
patroncedula.value = datosJSON.VITE_PATRON_CEDULA;
tokenCorto.value = datosJSON.VITE_TOKEN_CORTO;

tokenCifrado.value = await encryptarPassword(token.value, 10);
await crearTablaSiNoExisteOffline('conduce', camposArray, toast);
usuarioLocal.value = JSON.parse(window.localStorage.getItem('usuarioLocal'))[0] || {};
await campos();
await fetchAndSetupData();
});
/************************************************************************/
  async function borrarTodo() {
    Swal.fire({
        title: "¿Estás seguro?",
        text: "¡Se borrarán los datos!",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Sí, de acuerdo",
        cancelButtonText: "No, cancelar"
    }).then(async (result) => {
        if (result.isConfirmed) {
            const { value: password } = await Swal.fire({
                title: 'Introduce la contraseña',
                input: 'password',
                inputPlaceholder: 'Contraseña',
                showCancelButton: true,
                confirmButtonText: 'Confirmar',
                cancelButtonText: 'Cancelar'
            });
            if (password) {
               if (password === token.value || password === tokenCorto.value) {
                    const envioDatos = await peticionesFetchOffline('deleteAll', 'conduce');
                    if (envioDatos[0] == 'ok') {
                        fetchAndSetupData();
                        toast.add({ severity: 'success', summary: 'Éxito', detail: 'Datos borrados', life: 3000 });
                    } else {
                        toast.add({ severity: 'error', summary: 'Error', detail: 'Fallo al borrar datos.', life: 3000 });
                   }
                } else {
                    toast.add({ severity: 'error', summary: 'Error', detail: 'Contraseña incorrecta', life: 3000 });
                }
            }
        } else if (result.dismiss === Swal.DismissReason.cancel) {
            toast.add({ severity: 'success', summary: 'No te preocupes', detail: 'Datos seguros', life: 3000 });
        }
    });
}
/************************************************************************/
async function borrarSeleccionados() {
  const ids = obtenerIdsSeleccionados(selectedItems.value);
    Swal.fire({
        title: "¿Estas Seguro?",
        text: "Se Borraran los Datos!",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Sí, de acuerdo!",
        cancelButtonText: "No, cancelar!",
    }).then(async (result) => {
        if (result.isConfirmed) {
            const { value: password } = await Swal.fire({
                title: 'Introduce la contraseña',
                input: 'password',
                inputPlaceholder: 'Contraseña',
                showCancelButton: true,
                confirmButtonText: 'Confirmar',
                cancelButtonText: 'Cancelar'
            });
            if (password) {
                if (password === token.value || password === tokenCorto.value) {
                    let exitoTotal = true;
                    if (ids.length > 0) {
                        for (const id of ids) {
                            try {
                                const envioDatos = await peticionesFetchOffline('deleteEntry', 'conduce', id);
                            } catch (error) {
                                console.error(`Error al eliminar datos para ID: ${id}`, error);
                                exitoTotal = false;
                            }
                        }
                        if (exitoTotal) {
                            fetchAndSetupData();
                            toast.add({ severity: 'success', summary: 'Éxito', detail: 'Datos Borrados', life: 3000 });
                        } else {
                            toast.add({ severity: 'error', summary: 'Error', detail: 'Fallo al Borrar los datos.', life: 3000 });
                        }
                    } else {
                        toast.add({ severity: 'error', summary: 'Error', detail: 'No hay datos para borrar', life: 3000 });
                    }
                } else {
                    toast.add({ severity: 'error', summary: 'Error', detail: 'Contraseña incorrecta', life: 3000 });
                }
            }
        } else if (result.dismiss === Swal.DismissReason.cancel) {
            toast.add({ severity: 'success', summary: 'No te preocupes', detail: 'Datos Seguros', life: 3000 });
        }
    });
}
/************************************************************************/
const itemsConduce = ref([]);
const menu = ref(null);
const currentRowData = ref(null);
const toggleConduce = (event, rowData) => {
currentRowData.value = rowData;
itemsConduce.value = [
{ label: 'Editar', icon: 'pi pi-pencil', command: () => { 
router.push({ path: `/editarconduce/${currentRowData.value.id}` });
} },
{ label: 'Eliminar', icon: 'pi pi-trash', command: () => {
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
                    if (contrasenaIngresada === token.value || contrasenaIngresada === tokenCorto.value) {
                        const datosFactura = await peticionesFetchOffline('deleteEntry', 'conduce', rowData.id);
                        if (datosFactura[0] == 'ok') {
                            toast.add({ severity: 'success', summary: 'Éxito', detail: 'Datos eliminados correctamente', life: 3000 });
                            await fetchAndSetupData()
                        } else {
                            toast.add({ severity: 'error', summary: 'Error', detail: 'Error al eliminar los datos', life: 3000 });
                        }
                    } else {
                        toast.add({ severity: 'error', summary: 'Error', detail: 'Contraseña incorrecta', life: 3000 });
                    }
                }
            });
        } 
    },
];
menu.value.toggle(event);
};
/************************************************************************/
const filteredConduce = computed(() => {
if (!searchQuery.value) return data.value;
return data.value.filter(busqueda => {
  return Object.values(busqueda).some(value =>
    String(value).toLowerCase().includes(searchQuery.value.toLowerCase())
   );
  });
});
/************************************************************************/
const estadisticasConduce = computed(() => {
  const total = data.value.length;
  const entregados = data.value.filter(item => item.entrega === 'ENTREGADO' || item.entrega === 'SI').length;
  const pendientes = data.value.filter(item => item.entrega === 'PENDIENTE' || item.entrega === 'NO').length;
  const enTransito = data.value.filter(item => item.entrega === 'EN TRANSITO').length;
  const totalMonto = data.value.reduce((sum, item) => sum + (parseFloat(item.total) || 0), 0);
  return { total, entregados, pendientes, enTransito, totalMonto };
});

const formatCurrency = (value) => {
  if (value) {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    return num.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
  }
  return '$0.00';
};

const getSeverityEntrega = (entrega) => {
  if (entrega === 'ENTREGADO' || entrega === 'SI') return 'success';
  if (entrega === 'EN TRANSITO') return 'warning';
  if (entrega === 'PENDIENTE' || entrega === 'NO') return 'danger';
  return 'info';
};

const rowClass = (data) => {
  if (data.entrega === 'ENTREGADO' || data.entrega === 'SI') return 'row-entregado';
  if (data.entrega === 'EN TRANSITO') return 'row-transito';
  if (data.entrega === 'PENDIENTE' || data.entrega === 'NO') return 'row-pendiente';
  return '';
};
/************************************************************************/
const fnAwesomplete = ()=>{
}
const handleSelectComplete = async(selected)=>{
}
/************************************************************************/
const onRowSelect = (event) => {
 router.push({ path: `/editarconduce/${event.data.id}` });

};
/************************************************************************/
</script>
<template>
<main class="conduce-container">
  <div class="w-full">
    <!-- Header Profesional -->
    <div class="conduce-header mb-4">
      <div class="conduce-header-content">
        <div class="conduce-icon-wrapper">
          <i class="pi pi-truck conduce-icon"></i>
        </div>
        <div>
          <h1 class="conduce-title">Gestión de Conduces</h1>
          <p class="conduce-subtitle">Administración de documentos de entrega y envíos</p>
        </div>
      </div>
    </div>

    <!-- Dashboard de Estadísticas -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
      <div class="stats-card stats-total">
        <div class="stats-icon-wrapper">
          <i class="pi pi-list stats-icon"></i>
        </div>
        <div class="stats-content">
          <p class="stats-label">Total Conduces</p>
          <p class="stats-value">{{ estadisticasConduce.total }}</p>
        </div>
      </div>

      <div class="stats-card stats-entregados">
        <div class="stats-icon-wrapper">
          <i class="pi pi-check-circle stats-icon"></i>
        </div>
        <div class="stats-content">
          <p class="stats-label">Entregados</p>
          <p class="stats-value">{{ estadisticasConduce.entregados }}</p>
        </div>
      </div>

      <div class="stats-card stats-transito">
        <div class="stats-icon-wrapper">
          <i class="pi pi-send stats-icon"></i>
        </div>
        <div class="stats-content">
          <p class="stats-label">En Tránsito</p>
          <p class="stats-value">{{ estadisticasConduce.enTransito }}</p>
        </div>
      </div>

      <div class="stats-card stats-pendientes">
        <div class="stats-icon-wrapper">
          <i class="pi pi-clock stats-icon"></i>
        </div>
        <div class="stats-content">
          <p class="stats-label">Pendientes</p>
          <p class="stats-value">{{ estadisticasConduce.pendientes }}</p>
        </div>
      </div>

      <div class="stats-card stats-monto">
        <div class="stats-icon-wrapper">
          <i class="pi pi-dollar stats-icon"></i>
        </div>
        <div class="stats-content">
          <p class="stats-label">Total Monto</p>
          <p class="stats-value-money">{{ formatCurrency(estadisticasConduce.totalMonto) }}</p>
        </div>
      </div>
    </div>

    <!-- Toolbar de Acciones -->
    <Card class="mb-4 toolbar-card">
      <template #content>
        <div class="flex flex-wrap gap-3 items-center justify-between">
          <div class="flex flex-wrap gap-2">
            <Button
              icon="pi pi-refresh"
              label="Recargar"
              severity="secondary"
              @click="fetchAndSetupData"
              class="btn-action"
            />
            <router-link to="/crearconduce">
              <Button
                icon="pi pi-plus"
                label="Nuevo Conduce"
                severity="success"
                class="btn-action"
              />
            </router-link>
            <Button
              icon="pi pi-trash"
              label="Borrar Selección"
              severity="danger"
              @click="borrarSeleccionados"
              class="btn-action"
            />
          </div>

          <div v-if="usuarioLocal.usuario == 'Soporte'">
            <Button
              label="Borrar Todo"
              icon="pi pi-trash"
              severity="danger"
              @click="borrarTodo"
              outlined
              class="btn-action"
            />
          </div>
        </div>
      </template>
    </Card>

    <!-- Filtros -->
    <Card class="mb-4 filters-card">
      <template #content>
        <div class="filters-container">
          <div class="filter-item">
            <label class="filter-label">
              <i class="pi pi-search mr-2"></i>
              Buscar
            </label>
            <InputText
              v-model="searchQuery"
              placeholder="Buscar en todas las columnas..."
              class="w-full filter-input"
            />
          </div>
        </div>
      </template>
    </Card>

    <!-- DataTable Profesional -->
    <Card class="datatable-card">
      <template #content>
        <DataTable
          :value="filteredConduce"
          scrollable
          scrollHeight="600px"
          dataKey="id"
          paginator
          :rows="10"
          v-model:selection="selectedItems"
          @rowSelect="onRowSelect"
          selectionMode="single"
          :rowsPerPageOptions="[5, 10, 20, 50]"
          :rowClass="rowClass"
          class="conduce-table"
          tableStyle="min-width: 80rem">

          <Column selectionMode="multiple" frozen headerStyle="width: 3rem"></Column>

          <Column header="Acciones" frozen style="min-width: 100px">
            <template #body="slotProps">
              <Button
                icon="pi pi-ellipsis-v"
                text
                rounded
                @click="toggleConduce($event, slotProps.data)"
                aria-haspopup="true"
                aria-controls="overlay_menu_conduce"
                class="btn-options"
              />
              <Menu
                ref="menu"
                id="overlay_menu_Conduce"
                :model="itemsConduce"
                :popup="true"
              />
            </template>
          </Column>

          <Column field="no_conduce" header="No. Conduce" style="min-width: 140px">
            <template #body="slotProps">
              <span class="font-semibold text-green-600">#{{ slotProps.data.no_conduce }}</span>
            </template>
          </Column>

          <Column field="entrega" header="Estado Entrega" style="min-width: 150px">
            <template #body="slotProps">
              <Badge
                :value="slotProps.data.entrega || 'PENDIENTE'"
                :severity="getSeverityEntrega(slotProps.data.entrega)"
              />
            </template>
          </Column>

          <Column field="no_factura" header="No. Factura" style="min-width: 130px"></Column>
          <Column field="fecha" header="Fecha" style="min-width: 120px"></Column>
          <Column field="vencimiento" header="Vencimiento" style="min-width: 130px"></Column>
          <Column field="cliente" header="Cliente" style="min-width: 200px"></Column>
          <Column field="cod_cliente" header="Cód. Cliente" style="min-width: 130px"></Column>
          <Column field="telefono" header="Teléfono" style="min-width: 130px"></Column>
          <Column field="direccion" header="Dirección" style="min-width: 250px"></Column>
          <Column field="chofer" header="Chofer" style="min-width: 180px"></Column>
          <Column field="placa" header="Placa" style="min-width: 120px"></Column>

          <Column field="total" header="Total" style="min-width: 130px">
            <template #body="slotProps">
              <span class="font-semibold">{{ formatCurrency(slotProps.data.total) }}</span>
            </template>
          </Column>
        </DataTable>
      </template>
    </Card>
  </div>

  <Toast />
</main>
</template>
<style scoped>
/* ===== Container Principal ===== */
.conduce-container {
  padding: 1rem;
  background: linear-gradient(135deg, #f0fdf4 0%, #bbf7d0 100%);
  min-height: 100vh;
}

/* ===== Header Profesional ===== */
.conduce-header {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 8px 20px rgba(16, 185, 129, 0.3);
  animation: slideIn 0.5s ease-out;
}

.conduce-header-content {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.conduce-icon-wrapper {
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(10px);
  width: 60px;
  height: 60px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.conduce-icon {
  font-size: 1.75rem;
  color: white;
}

.conduce-title {
  font-size: 1.75rem;
  font-weight: 700;
  color: white;
  margin: 0;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.conduce-subtitle {
  font-size: 0.875rem;
  color: rgba(255, 255, 255, 0.9);
  margin: 0.25rem 0 0 0;
}

/* ===== Stats Cards ===== */
.stats-card {
  background: white;
  border-radius: 12px;
  padding: 1.25rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
  animation: fadeIn 0.5s ease-out;
  border-left: 4px solid;
}

.stats-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
}

.stats-total {
  border-left-color: #3b82f6;
}

.stats-entregados {
  border-left-color: #10b981;
}

.stats-transito {
  border-left-color: #f59e0b;
}

.stats-pendientes {
  border-left-color: #ef4444;
}

.stats-monto {
  border-left-color: #8b5cf6;
}

.stats-icon-wrapper {
  width: 50px;
  height: 50px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
}

.stats-total .stats-icon-wrapper {
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  color: white;
}

.stats-entregados .stats-icon-wrapper {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
}

.stats-transito .stats-icon-wrapper {
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  color: white;
}

.stats-pendientes .stats-icon-wrapper {
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
  color: white;
}

.stats-monto .stats-icon-wrapper {
  background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
  color: white;
}

.stats-content {
  flex: 1;
}

.stats-label {
  font-size: 0.75rem;
  font-weight: 600;
  color: #6b7280;
  text-transform: uppercase;
  margin: 0 0 0.25rem 0;
}

.stats-value {
  font-size: 1.75rem;
  font-weight: 700;
  color: #111827;
  margin: 0;
}

.stats-value-money {
  font-size: 1.25rem;
  font-weight: 700;
  color: #111827;
  margin: 0;
}

/* ===== Toolbar Card ===== */
.toolbar-card {
  border-radius: 10px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  border: none;
}

.toolbar-card :deep(.p-card-body) {
  padding: 1rem;
}

.toolbar-card :deep(.p-card-content) {
  padding: 0;
}

.btn-action {
  transition: all 0.3s ease;
  font-weight: 600;
}

.btn-action:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

/* ===== Filters Card ===== */
.filters-card {
  border-radius: 10px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  border: none;
}

.filters-card :deep(.p-card-body) {
  padding: 1rem;
}

.filters-card :deep(.p-card-content) {
  padding: 0;
}

.filters-container {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;
}

.filter-item {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.filter-label {
  display: flex;
  align-items: center;
  font-weight: 600;
  color: #374151;
  font-size: 0.875rem;
}

.filter-label i {
  color: #10b981;
}

.filter-input {
  transition: all 0.3s ease;
}

.filter-input:focus {
  border-color: #10b981;
  box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1);
}

/* ===== DataTable Card ===== */
.datatable-card {
  border-radius: 10px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  border: none;
}

.datatable-card :deep(.p-card-body) {
  padding: 0;
}

.datatable-card :deep(.p-card-content) {
  padding: 0;
}

/* ===== DataTable Styling ===== */
.conduce-table :deep(.p-datatable-header) {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
  border-radius: 10px 10px 0 0;
  padding: 1rem;
  border: none;
}

.conduce-table :deep(.p-datatable-thead > tr > th) {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
  font-weight: 600;
  padding: 1rem 0.75rem;
  border: none;
  font-size: 0.8125rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.conduce-table :deep(.p-datatable-tbody > tr) {
  transition: all 0.2s ease;
  cursor: pointer;
}

.conduce-table :deep(.p-datatable-tbody > tr:hover) {
  background-color: #f0fdf4 !important;
  transform: scale(1.001);
}

.conduce-table :deep(.p-datatable-tbody > tr > td) {
  padding: 0.875rem 0.75rem;
  border-bottom: 1px solid #e5e7eb;
  color: #374151;
  font-size: 0.8125rem;
}

.conduce-table :deep(.p-datatable-tbody > tr:last-child > td) {
  border-bottom: none;
}

/* Row Classes */
.conduce-table :deep(.row-entregado) {
  background-color: #f0fdf4;
  border-left: 3px solid #10b981;
}

.conduce-table :deep(.row-transito) {
  background-color: #fffbeb;
  border-left: 3px solid #f59e0b;
}

.conduce-table :deep(.row-pendiente) {
  background-color: #fef2f2;
  border-left: 3px solid #ef4444;
}

/* Frozen Column */
.conduce-table :deep(.p-frozen-column) {
  background-color: #fafafa;
  font-weight: 600;
}

/* Pagination */
.conduce-table :deep(.p-paginator) {
  background: #f9fafb;
  border-top: 2px solid #e5e7eb;
  padding: 0.75rem 1rem;
  border-radius: 0 0 10px 10px;
}

.conduce-table :deep(.p-paginator .p-paginator-pages .p-paginator-page.p-highlight) {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  border-color: #10b981;
  color: white;
}

/* Button Options */
.btn-options {
  color: #10b981;
  transition: all 0.3s ease;
}

.btn-options:hover {
  background-color: #f0fdf4;
  color: #059669;
}

/* Scrollbar Personalizado */
.conduce-table :deep(.p-datatable-wrapper)::-webkit-scrollbar {
  width: 10px;
  height: 10px;
}

.conduce-table :deep(.p-datatable-wrapper)::-webkit-scrollbar-track {
  background: #f3f4f6;
  border-radius: 5px;
}

.conduce-table :deep(.p-datatable-wrapper)::-webkit-scrollbar-thumb {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  border-radius: 5px;
}

.conduce-table :deep(.p-datatable-wrapper)::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(135deg, #059669 0%, #047857 100%);
}

/* ===== Animations ===== */
@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* ===== Responsive Design ===== */
@media (max-width: 1024px) {
  .conduce-container {
    padding: 0.75rem;
  }

  .conduce-header {
    padding: 1rem;
  }

  .conduce-title {
    font-size: 1.5rem;
  }

  .stats-card {
    padding: 1rem;
  }

  .stats-value {
    font-size: 1.5rem;
  }
}

@media (max-width: 640px) {
  .conduce-container {
    padding: 0.5rem;
  }

  .conduce-header {
    padding: 0.75rem;
  }

  .conduce-header-content {
    flex-direction: column;
    text-align: center;
  }

  .conduce-title {
    font-size: 1.25rem;
  }

  .conduce-subtitle {
    font-size: 0.75rem;
  }

  .stats-card {
    padding: 0.875rem;
  }

  .stats-icon-wrapper {
    width: 40px;
    height: 40px;
    font-size: 1.25rem;
  }

  .stats-value {
    font-size: 1.25rem;
  }

  .toolbar-card :deep(.p-card-body),
  .filters-card :deep(.p-card-body) {
    padding: 0.75rem;
  }
}
</style>

