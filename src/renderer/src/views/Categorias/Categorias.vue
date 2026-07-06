
<script setup>
import { ref, onMounted, nextTick, watchEffect,computed } from 'vue';
import axios from 'axios';
import { 
nfecha, 
arrayToObjetoFromTabla, 
peticionesFetch,
obtenerIdsSeleccionados, 
crearTablaSiNoExiste,
encryptarPassword,
envioElectron,
arrayToObjetoFromTablaOffline,
crearTablaSiNoExisteOffline,
peticionesFetchOffline,
buscadorArrayObjeto } from '@/funciones/funciones.js';
import Swal from 'sweetalert2'
import { useToast } from "primevue/usetoast";
const toast = useToast();
/************************************************************************/
import flatPickr from 'vue-flatpickr-component';
import 'flatpickr/dist/flatpickr.css';
/************************************************************************/
  const basic = ref({
    dateFormat: 'd/m/Y',
  });
/************************************************************************/
const usuarioLocal = ref({})
/************************************************************************/
const camposArray = ['nombre'];
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
const datosJSON = ref([]);
/************************************************************************/
const selectedItems = ref([]);
/************************************************************************/
const position = ref('top');
const openPosition = (pos) => {
    position.value = pos;
    visible.value = true;
}
/************************************************************************/
const datoscamposCategorias = ref({})
/************************************************************************/
const visible = ref(false);
const visiblecrear = ref(false);
const value = ref(null);
const id = ref(null);
const datoscampos = ref({});
const data = ref([]);
const searchQuery = ref('');
const CategoriasEditar = ref(null);
/************************************************************************/
async function limpiarCamposCrear() {
datoscamposCategorias.value = {}
await campos();
}
/************************************************************************/
watchEffect(() => {
  if (visiblecrear.value) {
  }
});
/************************************************************************/
const fetchAndSetupData = async () => {
const response = await peticionesFetchOffline('getDataAsArray', 'categorias');
    const jsonData = response.reverse();
    data.value = jsonData;
};
/************************************************************************/
async function campos() {
  const campos = await arrayToObjetoFromTablaOffline('categorias');
  datoscamposCategorias.value = campos;
}
/************************************************************************/
const datosConfig = async()=>{
    const response = await envioElectron('datosarchivo');
    datosJSON.value = response;
    link.value = datosJSON.value.VITE_LINKURL;
    api.value = datosJSON.value.VITE_LINK_API;
    token.value = datosJSON.value.VITE_TOKEN;
    patronTelefono.value = datosJSON.value.VITE_PATRON_TELEFONO;
    linkImpresora.value = datosJSON.value.VITE_IMPRESORA_LOCAL;
    tokenCorto.value = datosJSON.value.VITE_TOKEN_CORTO;
    patroncedula.value = datosJSON.value.VITE_PATRON_CEDULA;
}
/************************************************************************/
onMounted(async () => {
await datosConfig()
tokenCifrado.value = await encryptarPassword(token.value, 10);

if(navigator.onLine){
   await crearTablaSiNoExiste(link.value, api.value, 'categorias', camposArray, tokenCifrado.value,toast);
}else{
  if(window.electron){
     await crearTablaSiNoExisteOffline('categorias',camposArray.join(','),toast)
  }   
}
//usuarioLocal.value = JSON.parse(window.localStorage.getItem('usuarioLocal'))[0] || {};
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
                    const envioDatos = await peticionesFetchOffline('deleteAll', 'categorias');
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
async function funcionActualizar() {
  const url = link.value+api.value+"/actualizarcampos/categorias";
  if (!datoscampos.value) {
    console.error("Datos incompletos, no se puede actualizar.");
    return;
  }
  if (datoscampos.value.hasOwnProperty('created_at')) {
    datoscampos.value.updated_at = nfecha('timestamp');
  }
  const datosEnviar = JSON.parse(JSON.stringify(datoscampos.value));
  const envioDatos = await peticionesFetchOffline('updateData','categorias', JSON.stringify(datosEnviar));
  if (envioDatos[0] == 'ok') {
    visible.value = false;
    fetchAndSetupData();
    toast.add({ severity: 'success', summary: 'Éxito', detail: 'Datos Actualizados', life: 3000 });
  } else {
    toast.add({ severity: 'error', summary: 'Error', detail: 'Fallo al actualizar los datos.', life: 3000 });
  }
}
/************************************************************************/
async function funcionCrear() {
  const url = link.value+api.value+"/insertar/categorias";
  if (datoscamposCategorias.value.hasOwnProperty('created_at')) {
    datoscamposCategorias.value.created_at = nfecha('timestamp');
    datoscamposCategorias.value.updated_at = nfecha('timestamp');
  }
  const datosEnviar = JSON.parse(JSON.stringify(datoscamposCategorias.value));
  const envioDatos = await peticionesFetchOffline('insertData','categorias', JSON.stringify(datosEnviar));
  if (envioDatos[0] == 'ok') {
    fetchAndSetupData();
    toast.add({ severity: 'success', summary: 'Éxito', detail: 'Datos Agregados', life: 3000 });
    limpiarCamposCrear();
    visiblecrear.value = false;
  } else {
    toast.add({ severity: 'error', summary: 'Error', detail: 'Fallo al Agregar los datos.', life: 3000 });
  }
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
                              const envioDatos = await peticionesFetchOffline('deleteEntry','categorias', id);
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
const itemsCategorias = ref([]);
const menu = ref(null);
const currentRowData = ref(null);
const toggleCategorias = (event, rowData) => {
currentRowData.value = rowData;
itemsCategorias.value = [
{ label: 'Editar', icon: 'pi pi-pencil', command: () => { 
visible.value = true;
datoscampos.value = currentRowData.value;
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
                        const datosFactura = await peticionesFetchOffline('deleteEntry','categorias', rowData.id);
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
const estadisticasCategorias = computed(() => {
  const total = data.value.length;

  // Categorías ordenadas alfabéticamente
  const categoriasOrdenadas = [...data.value].sort((a, b) =>
    (a.nombre || '').localeCompare(b.nombre || '')
  );

  // Primera y última categoría alfabéticamente
  const primeraCategoria = categoriasOrdenadas.length > 0 ? categoriasOrdenadas[0].nombre : 'N/A';
  const ultimaCategoria = categoriasOrdenadas.length > 0 ? categoriasOrdenadas[categoriasOrdenadas.length - 1].nombre : 'N/A';

  // Categorías más recientes (últimas 3)
  const categoriasRecientes = data.value.slice(0, 3).map(c => c.nombre || 'Sin nombre');

  return {
    total,
    primeraCategoria,
    ultimaCategoria,
    categoriasRecientes
  };
});
/************************************************************************/
const filteredCategorias = computed(() => {
if (!searchQuery.value) return data.value;
return data.value.filter(busqueda => {
  return Object.values(busqueda).some(value =>
    String(value).toLowerCase().includes(searchQuery.value.toLowerCase())
   );
  });
});
/************************************************************************/
const fnAwesomplete = ()=>{
}
const handleSelectComplete = async(selected)=>{
}
/************************************************************************/
const onRowSelect = (event) => {
 
datoscampos.value = event.data;
visible.value = true;


};
/************************************************************************/
</script>
<template>
<main class="content-wrapper">
  <!-- Header Profesional -->
  <div class="header-categorias">
    <div class="header-content">
      <div class="header-title">
        <i class="pi pi-tags header-icon"></i>
        <div>
          <h1 class="title">Categorías</h1>
          <p class="subtitle">Gestión y organización de categorías de productos</p>
        </div>
      </div>
    </div>
  </div>

  <div class="w-full px-4 mt-5">
    <!-- Dashboard de Estadísticas -->
    <div class="dashboard-grid">
      <Card class="dashboard-card card-purple">
        <template #content>
          <div class="card-stat-content">
            <div class="stat-icon-wrapper icon-purple">
              <i class="pi pi-tags stat-icon"></i>
            </div>
            <div class="stat-details">
              <p class="stat-label">Total Categorías</p>
              <p class="stat-value">{{ estadisticasCategorias.total }}</p>
            </div>
          </div>
        </template>
      </Card>

      <Card class="dashboard-card card-info">
        <template #content>
          <div class="card-stat-content">
            <div class="stat-icon-wrapper icon-info">
              <i class="pi pi-sort-alpha-down stat-icon"></i>
            </div>
            <div class="stat-details">
              <p class="stat-label">Primera (A-Z)</p>
              <p class="stat-value-small">{{ estadisticasCategorias.primeraCategoria }}</p>
            </div>
          </div>
        </template>
      </Card>

      <Card class="dashboard-card card-success">
        <template #content>
          <div class="card-stat-content">
            <div class="stat-icon-wrapper icon-success">
              <i class="pi pi-sort-alpha-up stat-icon"></i>
            </div>
            <div class="stat-details">
              <p class="stat-label">Última (A-Z)</p>
              <p class="stat-value-small">{{ estadisticasCategorias.ultimaCategoria }}</p>
            </div>
          </div>
        </template>
      </Card>
    </div>

    <!-- Toolbar -->
    <Card class="mt-4">
      <template #content>
        <div class="toolbar-categorias">
          <div class="toolbar-actions">
            <Button
              icon="pi pi-refresh"
              label="Recargar"
              @click="fetchAndSetupData"
              severity="warning"
              class="action-button"
            />
            <Button
              icon="pi pi-plus"
              label="Nueva Categoría"
              @click="visiblecrear = true"
              severity="success"
              class="action-button"
            />
            <Button
              icon="pi pi-trash"
              label="Borrar Selección"
              @click="borrarSeleccionados"
              severity="danger"
              class="action-button"
            />
            <Button
              v-if="datosEmpresa.usuario.nivel_seguridad === 'Soporte'"
              icon="pi pi-trash"
              label="Borrar Todo"
              @click="borrarTodo"
              severity="danger"
              outlined
              class="action-button"
            />
          </div>
          <div class="search-wrapper">
            <InputText
              v-model="searchQuery"
              placeholder="Buscar categorías..."
              class="search-input"
            >
              <template #prepend>
                <i class="pi pi-search"></i>
              </template>
            </InputText>
          </div>
        </div>
      </template>
    </Card>

    <!-- Tabla de Categorías -->
    <Card class="mt-4">
      <template #content>
        <DataTable
          :value="filteredCategorias"
          scrollable
          scrollHeight="600px"
          dataKey="id"
          paginator
          :rows="10"
          v-model:selection="selectedItems"
          @rowSelect="onRowSelect"
          :rowsPerPageOptions="[5, 10, 20, 50]"
          class="categorias-table"
        >
          <Column selectionMode="multiple" headerStyle="width: 3rem"></Column>
          <Column header="Opciones" frozen alignFrozen="right" style="min-width: 100px">
            <template #body="slotProps">
              <Button
                icon="pi pi-cog"
                @click="toggleCategorias($event, slotProps.data)"
                severity="info"
                text
                rounded
              />
              <Menu
                ref="menu"
                id="overlay_menu_Categorias"
                :model="itemsCategorias"
                :popup="true"
              />
            </template>
          </Column>
          <Column field="nombre" header="Nombre de Categoría" style="min-width: 300px" sortable>
            <template #body="slotProps">
              <div class="flex items-center gap-2">
                <i class="pi pi-tag text-purple-500"></i>
                <span class="font-semibold">{{ slotProps.data.nombre }}</span>
              </div>
            </template>
          </Column>
        </DataTable>
      </template>
    </Card>

<!-- Modal Editar -->
<Dialog v-model:visible="visible" modal :style="{ width: '40rem' }" :breakpoints="{ '1199px': '60vw', '575px': '90vw' }">
  <template #header>
    <div class="modal-header-custom">
      <i class="pi pi-pencil mr-3 text-purple-500"></i>
      <span class="modal-title-custom">Editar Categoría</span>
    </div>
  </template>

  <div class="dialog-content">
    <Card class="section-card">
      <template #header>
        <div class="section-header">
          <i class="pi pi-tag section-icon"></i>
          <span class="section-title">Información de la Categoría</span>
        </div>
      </template>
      <template #content>
        <div>
          <label class="field-label">
            <i class="pi pi-tags mr-2"></i>
            Nombre de Categoría
          </label>
          <InputText
            v-model="datoscampos.nombre"
            v-mayuscula
            class="w-full"
            placeholder="Ingrese el nombre de la categoría"
          />
        </div>
      </template>
    </Card>
  </div>

  <template #footer>
    <div class="flex justify-end gap-2">
      <Button label="Cancelar" icon="pi pi-times" @click="visible = false" severity="secondary" text />
      <Button label="Actualizar" icon="pi pi-check" @click="funcionActualizar" severity="info" />
    </div>
  </template>
</Dialog>


<!-- Modal Crear -->
<Dialog v-model:visible="visiblecrear" modal :style="{ width: '40rem' }" :breakpoints="{ '1199px': '60vw', '575px': '90vw' }">
  <template #header>
    <div class="modal-header-custom">
      <i class="pi pi-plus-circle mr-3 text-purple-500"></i>
      <span class="modal-title-custom">Nueva Categoría</span>
    </div>
  </template>

  <div class="dialog-content">
    <Card class="section-card">
      <template #header>
        <div class="section-header">
          <i class="pi pi-tag section-icon"></i>
          <span class="section-title">Información de la Categoría</span>
        </div>
      </template>
      <template #content>
        <div>
          <label class="field-label">
            <i class="pi pi-tags mr-2"></i>
            Nombre de Categoría
          </label>
          <InputText
            v-model="datoscamposCategorias.nombre"
            v-mayuscula
            class="w-full"
            placeholder="Ingrese el nombre de la categoría"
          />
        </div>
      </template>
    </Card>
  </div>

  <template #footer>
    <div class="flex justify-end gap-2">
      <Button label="Cancelar" icon="pi pi-times" @click="visiblecrear = false" severity="secondary" text />
      <Button label="Crear Categoría" icon="pi pi-check" @click="funcionCrear" severity="success" />
    </div>
  </template>
</Dialog>

<!-- ////////////////////////////////////////////////////////////////////////////////////////// -->
<Toast />
  </div>
</main>
</template>

<style scoped>
/* Header Profesional con tema púrpura */
.header-categorias {
  background: linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%);
  padding: 2rem;
  margin: -1rem -1rem 2rem -1rem;
  border-radius: 0 0 1rem 1rem;
  box-shadow: 0 4px 6px rgba(139, 92, 246, 0.1);
  animation: slideIn 0.5s ease-out;
}

.header-content {
  max-width: 1400px;
  margin: 0 auto;
}

.header-title {
  display: flex;
  align-items: center;
  gap: 1rem;
  color: white;
}

.header-icon {
  font-size: 2.5rem;
  opacity: 0.9;
}

.title {
  font-size: 2rem;
  font-weight: 700;
  margin: 0;
  color: white;
}

.subtitle {
  font-size: 1rem;
  margin: 0.25rem 0 0 0;
  opacity: 0.95;
  color: white;
}

/* Dashboard Grid */
.dashboard-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.5rem;
  margin-bottom: 1.5rem;
  animation: fadeIn 0.6s ease-out;
}

.dashboard-card {
  transition: all 0.3s ease;
  border: none;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.dashboard-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.12);
}

.card-purple { border-left: 4px solid #8b5cf6; }
.card-info { border-left: 4px solid #06b6d4; }
.card-success { border-left: 4px solid #10b981; }

.card-stat-content {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  padding: 0.5rem;
}

.stat-icon-wrapper {
  width: 60px;
  height: 60px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.icon-purple { background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); }
.icon-info { background: linear-gradient(135deg, #06b6d4 0%, #0891b2 100%); }
.icon-success { background: linear-gradient(135deg, #10b981 0%, #059669 100%); }

.stat-icon {
  font-size: 1.75rem;
  color: white;
}

.stat-details {
  flex: 1;
}

.stat-label {
  font-size: 0.875rem;
  color: #64748b;
  margin: 0 0 0.5rem 0;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.stat-value {
  font-size: 2rem;
  font-weight: 700;
  color: #1e293b;
  margin: 0;
  line-height: 1;
}

.stat-value-small {
  font-size: 1.25rem;
  font-weight: 600;
  color: #1e293b;
  margin: 0;
  line-height: 1.2;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Toolbar */
.toolbar-categorias {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
}

.toolbar-actions {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.action-button {
  transition: all 0.2s ease;
}

.search-wrapper {
  flex: 1;
  min-width: 250px;
  max-width: 400px;
}

.search-input {
  width: 100%;
}

/* Tabla Profesional */
.categorias-table {
  font-size: 0.95rem;
}

.categorias-table :deep(.p-datatable-thead > tr > th) {
  background: linear-gradient(to bottom, #8b5cf6, #7c3aed);
  color: white;
  font-weight: 600;
  padding: 1rem;
  border: none;
}

.categorias-table :deep(.p-datatable-tbody > tr) {
  transition: all 0.2s ease;
}

.categorias-table :deep(.p-datatable-tbody > tr:hover) {
  background-color: #f3e8ff !important;
  transform: scale(1.01);
}

/* Scrollbar púrpura personalizado */
.categorias-table :deep(.p-datatable-wrapper)::-webkit-scrollbar {
  width: 10px;
  height: 10px;
}

.categorias-table :deep(.p-datatable-wrapper)::-webkit-scrollbar-track {
  background: #f1f5f9;
  border-radius: 5px;
}

.categorias-table :deep(.p-datatable-wrapper)::-webkit-scrollbar-thumb {
  background: linear-gradient(to bottom, #8b5cf6, #7c3aed);
  border-radius: 5px;
}

.categorias-table :deep(.p-datatable-wrapper)::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(to bottom, #7c3aed, #6d28d9);
}

/* Paginación púrpura */
.categorias-table :deep(.p-paginator) {
  background: #f8fafc;
  border-top: 2px solid #8b5cf6;
}

.categorias-table :deep(.p-paginator .p-paginator-pages .p-paginator-page.p-highlight) {
  background: linear-gradient(135deg, #8b5cf6, #7c3aed);
  border-color: #7c3aed;
  color: white;
}

/* Modal personalizado */
.modal-header-custom {
  display: flex;
  align-items: center;
  font-size: 1.5rem;
  font-weight: 600;
  color: #1e293b;
}

.modal-title-custom {
  color: #1e293b;
}

.dialog-content {
  padding: 1rem;
}

/* Cards de sección dentro del modal */
.section-card {
  border: 1px solid #e2e8f0;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.section-header {
  background: linear-gradient(to right, #8b5cf6, #7c3aed);
  padding: 0.75rem 1.25rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  border-radius: 0.5rem 0.5rem 0 0;
  margin: -1px -1px 0 -1px;
}

.section-icon {
  font-size: 1.25rem;
  color: white;
}

.section-title {
  font-size: 1.1rem;
  font-weight: 600;
  color: white;
  margin: 0;
}

.field-label {
  display: flex;
  align-items: center;
  font-weight: 600;
  color: #8b5cf6;
  margin-bottom: 0.5rem;
  font-size: 0.95rem;
}

.field-label i {
  color: #8b5cf6;
  font-size: 1rem;
}

/* Responsive Design */
@media (max-width: 1024px) {
  .header-categorias {
    padding: 1.5rem;
  }

  .title {
    font-size: 1.75rem;
  }

  .dashboard-grid {
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1rem;
  }

  .toolbar-categorias {
    flex-direction: column;
    align-items: stretch;
  }

  .toolbar-actions {
    justify-content: center;
  }

  .search-wrapper {
    max-width: 100%;
  }
}

@media (max-width: 640px) {
  .header-categorias {
    padding: 1rem;
    margin: -0.5rem -0.5rem 1rem -0.5rem;
  }

  .header-icon {
    font-size: 2rem;
  }

  .title {
    font-size: 1.5rem;
  }

  .subtitle {
    font-size: 0.875rem;
  }

  .dashboard-grid {
    grid-template-columns: 1fr;
  }

  .stat-value {
    font-size: 1.75rem;
  }

  .stat-value-small {
    font-size: 1.1rem;
  }

  .toolbar-actions {
    flex-direction: column;
    width: 100%;
  }

  .action-button {
    width: 100%;
  }
}

/* Animaciones */
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
  }
  to {
    opacity: 1;
  }
}

/* Focus states con tema púrpura */
.categorias-table :deep(.p-inputtext:focus),
.search-input:focus,
:deep(.p-inputtext:focus),
:deep(.p-dropdown:focus),
:deep(.p-textarea:focus) {
  border-color: #8b5cf6;
  box-shadow: 0 0 0 0.2rem rgba(139, 92, 246, 0.25);
}
</style>

