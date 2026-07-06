<script setup>
import { ref, onMounted, nextTick, watchEffect,computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
const router = useRouter();
import axios from 'axios';
import { enviarDatosPorPost, eliminarDatos, obtenerIdsSeleccionados, borrarTodoslosDatos, lenguajeDataTable, nfecha, arrayToObjetoFromTabla, peticionesFetch, encryptarPassword, envioElectron, mensajetoast, crearTablaSiNoExiste, peticiones, lasMayusculas, peticionesFetchOffline, arrayToObjetoFromTablaOffline, crearTablaSiNoExisteOffline } from '../../funciones/funciones.js';
import Swal from 'sweetalert2'
import { useToast } from "primevue/usetoast";
const toast = useToast();
/************************************************************************/
/************************************************************************/
const usuarioLocal = ref({})
/************************************************************************/
const camposArray = ["no_credito","no_factura","b04","ncf","cliente","cod_cliente","concepto","total","fecha","hora","nota","estado","fecha_uso","hora_uso","usuario","created_at","updated_at"];
/************************************************************************/
import { useDatosEmpresa } from '../../stores'
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
/************************************************************************/
const visible = ref(false);
const visiblecrear = ref(false);
const value = ref(null);
const id = ref(null);
const datoscampos = ref({});
const datoscamposNotacredito = ref({});
const data = ref([]);
const searchQuery = ref('');
const NotacreditoEditar = ref(null);
/************************************************************************/
async function limpiarCamposCrear() {
datoscamposNotacredito.value = {}
await campos();
}
/************************************************************************/
watchEffect(() => {
  if (visiblecrear.value) {
  }
});
/************************************************************************/
const fetchAndSetupData = async () => {
const columnas = await peticionesFetchOffline('getTableColumns', 'notacredito');
if (!columnas.includes('estado')) {
  await peticionesFetchOffline('addColumnToTable', { tabla: 'notacredito', campo: 'estado' });
  await peticionesFetchOffline('updateEntireColumn', 'notacredito', 'estado', 'DISPONIBLE');
}
if (!columnas.includes('fecha_uso')) {
  await peticionesFetchOffline('addColumnToTable', { tabla: 'notacredito', campo: 'fecha_uso' });
}
if (!columnas.includes('hora_uso')) {
  await peticionesFetchOffline('addColumnToTable', { tabla: 'notacredito', campo: 'hora_uso' });
}
const response = await peticionesFetchOffline('getDataAsArray', 'notacredito');
    const jsonData = response.reverse();
    data.value = jsonData;
};
/************************************************************************/
async function campos() {
  const campos = await arrayToObjetoFromTablaOffline('notacredito');
  campos.estado = campos.estado || 'DISPONIBLE';
  datoscamposNotacredito.value = campos;
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
await crearTablaSiNoExisteOffline('notacredito', camposArray, toast);
usuarioLocal.value = JSON.parse(window.localStorage.getItem('usuarioLocal'))[0] || {};
await fetchAndSetupData();
});
/************************************************************************/
  async function borrarTodo() {
    Swal.fire({
        title: "¶¨EstÇ­s seguro?",
        text: "¶­Se borrarÇ­n los datos!",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "SÇð, de acuerdo",
        cancelButtonText: "No, cancelar"
    }).then(async (result) => {
        if (result.isConfirmed) {
            const { value: password } = await Swal.fire({
                title: 'Introduce la contraseÇña',
                input: 'password',
                inputPlaceholder: 'ContraseÇña',
                showCancelButton: true,
                confirmButtonText: 'Confirmar',
                cancelButtonText: 'Cancelar'
            });
            if (password) {
               if (password === token.value || password === tokenCorto.value) {
                    const envioDatos = await peticionesFetchOffline('deleteAll', 'notacredito');
                    if (envioDatos[0] == 'ok') {
                        fetchAndSetupData();
                        toast.add({ severity: 'success', summary: 'Ç%xito', detail: 'Datos borrados', life: 3000 });
                    } else {
                        toast.add({ severity: 'error', summary: 'Error', detail: 'Fallo al borrar datos.', life: 3000 });
                   }
                } else {
                    toast.add({ severity: 'error', summary: 'Error', detail: 'ContraseÇña incorrecta', life: 3000 });
                }
            }
        } else if (result.dismiss === Swal.DismissReason.cancel) {
            toast.add({ severity: 'success', summary: 'No te preocupes', detail: 'Datos seguros', life: 3000 });
        }
    });
}
/************************************************************************/
async function funcionActualizar() {
  const url = link.value+api.value+"/actualizarcampos/notacredito";
  if (!datoscampos.value) {
    console.error("Datos incompletos, no se puede actualizar.");
    return;
  }
  if (datoscampos.value.hasOwnProperty('created_at')) {
    datoscampos.value.updated_at = nfecha('timestamp');
  }
  const envioDatos = await peticionesFetchOffline('updateData', 'notacredito', JSON.stringify(datoscampos.value));
  if (envioDatos[0] == 'ok') {
    visible.value = false;
    fetchAndSetupData();
    toast.add({ severity: 'success', summary: 'Ç%xito', detail: 'Datos Actualizados', life: 3000 });
  } else {
    toast.add({ severity: 'error', summary: 'Error', detail: 'Fallo al actualizar los datos.', life: 3000 });
  }
}
/************************************************************************/
async function funcionCrear() {
  const url = link.value+api.value+"/insertar/notacredito";
  if (datoscamposNotacredito.value.hasOwnProperty('created_at')) {
    datoscamposNotacredito.value.created_at = nfecha('timestamp');
    datoscamposNotacredito.value.updated_at = nfecha('timestamp');
  }
  datoscamposNotacredito.value.estado = datoscamposNotacredito.value.estado || 'DISPONIBLE';
  const envioDatos = await peticionesFetchOffline('insertData', 'notacredito', JSON.stringify(datoscamposNotacredito.value));
  if (envioDatos[0] == 'ok') {
    fetchAndSetupData();
    toast.add({ severity: 'success', summary: 'Ç%xito', detail: 'Datos Agregados', life: 3000 });
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
        title: "¶¨Estas Seguro?",
        text: "Se Borraran los Datos!",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "SÇð, de acuerdo!",
        cancelButtonText: "No, cancelar!",
    }).then(async (result) => {
        if (result.isConfirmed) {
            const { value: password } = await Swal.fire({
                title: 'Introduce la contraseÇña',
                input: 'password',
                inputPlaceholder: 'ContraseÇña',
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
                                const envioDatos = await peticionesFetchOffline('deleteEntry', 'notacredito', id);
                            } catch (error) {
                                console.error(`Error al eliminar datos para ID: ${id}`, error);
                                exitoTotal = false;
                            }
                        }
                        if (exitoTotal) {
                            fetchAndSetupData();
                            toast.add({ severity: 'success', summary: 'Ç%xito', detail: 'Datos Borrados', life: 3000 });
                        } else {
                            toast.add({ severity: 'error', summary: 'Error', detail: 'Fallo al Borrar los datos.', life: 3000 });
                        }
                    } else {
                        toast.add({ severity: 'error', summary: 'Error', detail: 'No hay datos para borrar', life: 3000 });
                    }
                } else {
                    toast.add({ severity: 'error', summary: 'Error', detail: 'ContraseÇña incorrecta', life: 3000 });
                }
            }
        } else if (result.dismiss === Swal.DismissReason.cancel) {
            toast.add({ severity: 'success', summary: 'No te preocupes', detail: 'Datos Seguros', life: 3000 });
        }
    });
}
/************************************************************************/
const itemsNotacredito = ref([]);
const menu = ref(null);
const currentRowData = ref(null);
const toggleNotacredito = (event, rowData) => {
currentRowData.value = rowData;
itemsNotacredito.value = [
{ label: 'Editar', icon: 'pi pi-pencil', command: () => {
router.push({ path: `/editarnotacredito/${currentRowData.value.id}` });
} },
{ label: 'Eliminar', icon: 'pi pi-trash', command: () => {
            Swal.fire({
                title: 'Introduce la contraseÇña',
                input: 'password',
                inputPlaceholder: 'ContraseÇña',
                showCancelButton: true,
                confirmButtonText: 'Eliminar',
                cancelButtonText: 'Cancelar'
            }).then(async (result) => {
                if (result.isConfirmed) {
                    const contrasenaIngresada = result.value;
                    if (contrasenaIngresada === token.value || contrasenaIngresada === tokenCorto.value) {
                        const datosFactura = await peticionesFetchOffline('deleteEntry', 'notacredito', rowData.id);
                        if (datosFactura[0] == 'ok') {
                            toast.add({ severity: 'success', summary: 'Ç%xito', detail: 'Datos eliminados correctamente', life: 3000 });
                            await fetchAndSetupData()
                        } else {
                            toast.add({ severity: 'error', summary: 'Error', detail: 'Error al eliminar los datos', life: 3000 });
                        }
                    } else {
                        toast.add({ severity: 'error', summary: 'Error', detail: 'ContraseÇña incorrecta', life: 3000 });
                    }
                }
            });
        }
    },
];
menu.value.toggle(event);
};
/************************************************************************/
const filteredNotacredito = computed(() => {
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
</script>
<template>
<main class="credit-wrapper">
  <div class="max-w-7xl mx-auto px-4 py-6 space-y-6">
    <section class="credit-hero shadow-lg">
      <div class="credit-hero__text">
        <p class="eyebrow">Notas de credito</p>
        <h1>Gestion de notas de credito</h1>
        <p>Controla ajustes, devoluciones y correcciones de facturacion con una vista clara y ordenada.</p>
        <div class="credit-hero__meta">
          <span class="meta-pill">
            <i class="pi pi-user"></i>
            {{ usuarioLocal.usuario || 'Usuario' }}
          </span>
          <span class="meta-pill">
            <i class="pi pi-calendar"></i>
            {{ new Date().toLocaleDateString() }}
          </span>
        </div>
      </div>
      <div class="credit-hero__stats">
        <div class="stat-card">
          <span class="label">Notas registradas</span>
          <span class="value">{{ filteredNotacredito.length }}</span>
        </div>
        <div class="stat-card alt">
          <span class="label">Filtro activo</span>
          <span class="value">{{ searchQuery ? 'Si' : 'No' }}</span>
        </div>
      </div>
    </section>

    <section class="panel shadow-md">
      <div class="panel__header">
        <div>
          <p class="eyebrow">Acciones</p>
          <h2>Administrar notas</h2>
          <span class="helper-text">Recarga, crea o elimina registros con controles claros.</span>
        </div>
        <div class="actions-grid">
          <Button icon="pi pi-refresh" label="Recargar" severity="info" outlined @click="fetchAndSetupData" />
          <Button icon="pi pi-plus" label="Nueva nota" severity="success" @click="router.push('/crearnotacredito')" />
          <Button icon="pi pi-trash" label="Borrar seleccion" severity="danger" outlined @click="borrarSeleccionados" />
          <Button
            v-if="usuarioLocal.usuario =='Soporte'"
            icon="pi pi-times"
            label="Borrar todo"
            severity="danger"
            @click="borrarTodo"
          />
        </div>
      </div>

      <div class="panel__body">
        <div class="filter-bar">
          <div class="filter-bar__input">
            <i class="pi pi-search"></i>
            <input v-model="searchQuery" placeholder="Buscar nota de credito..." type="text" />
          </div>
          <div class="filter-bar__info">
            <span class="pill">Resultados: {{ filteredNotacredito.length }}</span>
          </div>
        </div>

        <DataTable
          class="credit-table"
          :value="filteredNotacredito"
          scrollable
          scrollHeight="600px"
          dataKey="id"
          paginator
          :rows="10"
          size="small"
          resizableColumns
          columnResizeMode="fit"
          v-model:selection="selectedItems"
          selectionMode="single"
          :rowsPerPageOptions="[5, 10, 20, 50]"
          rowHover
          tableStyle="min-width: 50rem"
        >
          <template #header>
            <div class="table-header">
              <div>
                <h3>Listado de notas</h3>
                <p class="helper-text">Selecciona una fila para ver opciones rapidas.</p>
              </div>
            </div>
          </template>

          <Column selectionMode="multiple" headerStyle="width: 3rem"></Column>
          <Column header="Opciones">
            <template #body="slotProps">
              <Button
                icon="pi pi-cog"
                severity="secondary"
                text
                rounded
                @click="toggleNotacredito($event, slotProps.data)"
                aria-haspopup="true"
                aria-controls="overlay_menu_factura"
              />
              <Menu
                ref="menu"
                id="overlay_menu_Notacredito"
                :model="itemsNotacredito"
                :popup="true"
              />
            </template>
          </Column>
          <Column field="no_credito" header="No credito"></Column>
          <Column field="no_factura" header="No factura"></Column>
          <Column field="b04" header="B04"></Column>
          <Column field="ncf" header="NCF"></Column>
          <Column field="cliente" header="Cliente"></Column>
          <Column field="cod_cliente" header="Codigo cliente"></Column>
          <Column field="concepto" header="Concepto"></Column>
          <Column field="total" header="Total"></Column>
          <Column field="estado" header="Estado"></Column>
          <Column field="fecha_uso" header="Fecha uso"></Column>
          <Column field="hora_uso" header="Hora uso"></Column>
          <Column field="fecha" header="Fecha"></Column>
          <Column field="hora" header="Hora"></Column>
          <Column field="nota" header="Nota"></Column>
          <Column field="usuario" header="Usuario"></Column>
        </DataTable>
      </div>
    </section>
    <Toast />
  </div>
</main>
</template>
<style scoped>
.credit-wrapper {
  min-height: 100vh;
  background: linear-gradient(180deg, #f8fafc 0%, #eef2ff 45%, #ffffff 100%);
  color: #0f172a;
}

.credit-hero {
  background: linear-gradient(135deg, #0f172a, #1e293b 45%, #0ea5e9);
  color: #e2e8f0;
  border-radius: 18px;
  padding: 24px;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 20px;
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.credit-hero__text h1 {
  margin: 4px 0 8px;
  font-size: 1.8rem;
  font-weight: 800;
}

.credit-hero__text p {
  margin: 0;
  color: #cbd5e1;
}

.credit-hero__meta {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  margin-top: 12px;
}

.meta-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: rgba(226, 232, 240, 0.12);
  color: #e2e8f0;
  padding: 8px 12px;
  border-radius: 9999px;
  font-size: 0.9rem;
  border: 1px solid rgba(226, 232, 240, 0.2);
}

.credit-hero__stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 12px;
  align-items: center;
}

.stat-card {
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 14px;
  padding: 14px;
  color: #e2e8f0;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.18);
}

.stat-card.alt {
  background: rgba(14, 165, 233, 0.16);
}

.stat-card .label {
  display: block;
  font-size: 0.85rem;
  color: #cbd5e1;
}

.stat-card .value {
  font-size: 1.6rem;
  font-weight: 800;
}

.panel {
  background: #ffffff;
  border-radius: 14px;
  border: 1px solid #e2e8f0;
  padding: 20px;
}

.panel__header {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: flex-start;
  flex-wrap: wrap;
  border-bottom: 1px solid #e2e8f0;
  padding-bottom: 14px;
}

.panel__header h2 {
  margin: 2px 0 4px;
  font-size: 1.4rem;
  color: #0f172a;
}

.helper-text {
  color: #64748b;
  font-size: 0.95rem;
}

.eyebrow {
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-weight: 700;
  color: #0ea5e9;
  margin: 0;
  font-size: 0.85rem;
}

.actions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(170px, 1fr));
  gap: 10px;
  width: 100%;
  max-width: 640px;
}

:deep(.actions-grid .p-button) {
  width: 100%;
}

.panel__body {
  margin-top: 18px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.filter-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.filter-bar__input {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  background: #f8fafc;
  min-width: 260px;
}

.filter-bar__input input {
  border: none;
  outline: none;
  background: transparent;
  width: 100%;
  color: #0f172a;
}

.filter-bar__input input::placeholder {
  color: #94a3b8;
}

.filter-bar__info {
  display: flex;
  gap: 8px;
  align-items: center;
}

.pill {
  background: #0ea5e9;
  color: #ffffff;
  padding: 8px 12px;
  border-radius: 9999px;
  font-weight: 600;
}

.credit-table {
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 12px 30px rgba(15, 23, 42, 0.06);
}

:deep(.credit-table .p-datatable-header) {
  background: #f8fafc;
  border: 0;
  padding: 16px;
}

.table-header h3 {
  margin: 0;
  color: #0f172a;
}

:deep(.credit-table .p-datatable-thead > tr > th) {
  background: #e2e8f0;
  color: #0f172a;
  font-weight: 700;
  border: 0;
  padding: 14px 12px;
}

:deep(.credit-table .p-datatable-tbody > tr > td) {
  padding: 12px 12px;
  border: 0;
  color: #1f2937;
  font-size: 0.95rem;
}

:deep(.credit-table .p-datatable-tbody > tr:hover) {
  background: #ecfeff;
}

:deep(.credit-table .p-paginator) {
  border-top: 1px solid #e2e8f0;
  padding: 10px;
}

:deep(.credit-table .p-button.p-button-text) {
  color: #0f172a;
}

@media (max-width: 768px) {
  .credit-hero {
    padding: 18px;
  }

  .panel {
    padding: 16px;
  }

  .filter-bar {
    flex-direction: column;
    align-items: stretch;
  }

  .filter-bar__info {
    justify-content: flex-start;
  }
}
</style>
