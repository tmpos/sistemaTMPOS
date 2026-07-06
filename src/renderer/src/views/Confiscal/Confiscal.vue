<script setup>
import { ref, onMounted, nextTick, watchEffect,computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
const router = useRouter();
import axios from 'axios';
import { enviarDatosPorPost, eliminarDatos, obtenerIdsSeleccionados, borrarTodoslosDatos, lenguajeDataTable, nfecha, arrayToObjetoFromTabla, peticionesFetch, encryptarPassword, envioElectron, mensajetoast, crearTablaSiNoExiste, peticiones, agregarDiasalaFechaActual, lasMayusculas, peticionesFetchOffline, arrayToObjetoFromTablaOffline, crearTablaSiNoExisteOffline } from '../../funciones/funciones.js';
import Swal from 'sweetalert2'
import { useToast } from "primevue/usetoast";
const toast = useToast();
/************************************************************************/
/************************************************************************/
const usuarioLocal = ref({})
/************************************************************************/
const camposArray = ["nombre","prefijo","secuencia","aprobados","fecha","expiracion","contador","usuario"];
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
const datoscamposConfiscal = ref({})
/************************************************************************/
const visible = ref(false);
const visibleComprobantes = ref(false);
const visiblecrear = ref(false);
const value = ref(null);
const id = ref(null);
const datoscampos = ref({});
const data = ref([]);
const searchQuery = ref('');
const ConfiscalEditar = ref(null);
/************************************************************************/
const tipoComprobante = ref('B01')
const cantidadComprobante = ref('1')
const fechaExpiracion = ref(agregarDiasalaFechaActual(90))
/************************************************************************/
async function limpiarCamposCrear() {
datoscamposConfiscal.value = {}
await campos();
}
/************************************************************************/
watchEffect(() => {
  if (visiblecrear.value) {
  }
});
/************************************************************************/
const fetchAndSetupData = async () => {
const response = await peticionesFetchOffline('getDataAsArray', 'confiscal');
    const jsonData = response;
    data.value = jsonData;
};
/************************************************************************/
async function campos() {
  const campos = await arrayToObjetoFromTablaOffline('confiscal');
  datoscamposConfiscal.value = campos;
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
await crearTablaSiNoExisteOffline('confiscal', camposArray, toast);
usuarioLocal.value = JSON.parse(window.localStorage.getItem('usuarioLocal'))[0] || {};
await campos();
await fetchAndSetupData();
});
/************************************************************************/
  async function borrarTodo() {
    Swal.fire({
        title: "¿Estás seguro?",
        text: "Se borrarán los datos!",
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
                    const envioDatos = await peticionesFetchOffline('deleteAll', 'confiscal');
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
  const url = link.value+api.value+"/actualizarcampos/confiscal";
  if (!datoscampos.value) {
    console.error("Datos incompletos, no se puede actualizar.");
    return;
  }
  if (datoscampos.value.hasOwnProperty('created_at')) {
    datoscampos.value.updated_at = nfecha('timestamp');
  }
  const envioDatos = await peticionesFetchOffline('updateData', 'confiscal', JSON.stringify(datoscampos.value));
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
  const url = link.value+api.value+"/insertar/confiscal";
  if (datoscamposConfiscal.value.hasOwnProperty('created_at')) {
    datoscamposConfiscal.value.created_at = nfecha('timestamp');
    datoscamposConfiscal.value.updated_at = nfecha('timestamp');
  }
  const envioDatos = await peticionesFetchOffline('insertData', 'confiscal', JSON.stringify(datoscamposConfiscal.value));
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
                                const envioDatos = await peticionesFetchOffline('deleteEntry', 'confiscal', id);
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
const itemsConfiscal = ref([]);
const menu = ref(null);
const currentRowData = ref(null);
const fnOpenInlineEdit = (rowData) => {
  datoscampos.value = { ...rowData };
  visible.value = true;
};
const toggleConfiscal = (event, rowData) => {
currentRowData.value = rowData;
itemsConfiscal.value = [

{ label: 'Editar', icon: 'pi pi-pencil', command: () => fnOpenInlineEdit(currentRowData.value) },
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
                        const datosFactura = await peticionesFetchOffline('deleteEntry', 'confiscal', rowData.id);
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
const filteredConfiscal = computed(() => {
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
  <main class="confiscal-wrapper">
    <div class="max-w-7xl mx-auto px-4 py-6 space-y-6">
      <section class="confiscal-hero shadow-lg">
        <div class="confiscal-hero__text">
          <p class="eyebrow">Control fiscal</p>
          <h1>Comprobantes fiscales</h1>
          <p>Administra secuencias, aprobaciones y vencimientos de comprobantes con visibilidad total.</p>
          <div class="confiscal-hero__meta">
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
        <div class="confiscal-hero__stats">
          <div class="stat-card">
            <span class="label">Comprobantes</span>
            <span class="value">{{ filteredConfiscal.length }}</span>
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
            <h2>Administrar comprobantes</h2>
            <span class="helper-text">Recarga, crea, edita o elimina secuencias fiscales.</span>
          </div>
          <div class="actions-grid">
            <Button icon="pi pi-sync" label="Recargar" severity="info" outlined @click="fetchAndSetupData" />
            <Button icon="pi pi-plus" label="Nuevo" severity="success" @click="visiblecrear = true" />
            <Button icon="pi pi-file-import" label="Agregar comprobantes" severity="primary" outlined @click="visibleComprobantes = true" />
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
              <input v-model="searchQuery" placeholder="Buscar comprobantes..." type="text" />
            </div>
            <div class="filter-bar__info">
              <span class="pill">Resultados: {{ filteredConfiscal.length }}</span>
            </div>
          </div>

          <DataTable
            class="confiscal-table"
            :value="filteredConfiscal"
            paginator
            :rows="10"
            :rowsPerPageOptions="[5, 10, 20, 50]"
            scrollable
            scrollHeight="600px"
            selectionMode="single"
            v-model:selection="selectedItems"
            dataKey="id"
            rowHover
            tableStyle="min-width: 50rem"
          >
            <template #header>
              <div class="table-header">
                <div>
                  <h3>Listado de comprobantes</h3>
                  <p class="helper-text">Selecciona una fila para ver acciones rápidas.</p>
                </div>
              </div>
            </template>
            <Column selectionMode="multiple" headerStyle="width:3rem" />
            <Column header="Opciones">
              <template #body="slotProps">
                <Button
                  icon="pi pi-cog"
                  severity="secondary"
                  text
                  rounded
                  @click="toggleConfiscal($event, slotProps.data)"
                />
                <Button
                  icon="pi pi-pencil"
                  severity="info"
                  text
                  rounded
                  class="ml-1"
                  @click="fnOpenInlineEdit(slotProps.data)"
                  v-tooltip.top="'Editar en modal'"
                />
                <Menu ref="menu" :model="itemsConfiscal" popup />
              </template>
            </Column>
            <Column field="nombre" header="Nombre" />
            <Column field="prefijo" header="Prefijo" />
            <Column field="secuencia" header="Secuencia" />
            <Column field="aprobados" header="Aprobados" />
            <Column field="fecha" header="Fecha" />
            <Column field="expiracion" header="Expiración" />
            <Column field="contador" header="Contador" />
            <Column field="usuario" header="Usuario" />
          </DataTable>
        </div>
      </section>

      <Dialog v-model:visible="visible" modal header="Modificar Confiscal" :style="{ width: '50rem' }">
        <template #header>
          <div class="inline-flex align-items-center justify-content-center gap-2">
            <span class="font-bold white-space-nowrap">Editar Confiscal</span>
          </div>
        </template>

        <div class="form-grid">
          <div class="field">
            <label>Nombre</label>
            <InputText v-model="datoscampos.nombre" fluid />
          </div>
          <div class="field">
            <label>Prefijo</label>
            <InputText v-model="datoscampos.prefijo" fluid class="uppercase" />
          </div>
          <div class="field">
            <label>Secuencia</label>
            <InputText v-model="datoscampos.secuencia" fluid />
          </div>
          <div class="field">
            <label>Aprobados</label>
            <InputNumber v-model="datoscampos.aprobados" fluid />
          </div>
          <div class="field">
            <label>Fecha</label>
            <Calendar v-model="datoscampos.fecha" fluid />
          </div>
          <div class="field">
            <label>Expiración</label>
            <Calendar v-model="datoscampos.expiracion" fluid />
          </div>
          <div class="field">
            <label>Contador</label>
            <InputNumber v-model="datoscampos.contador" fluid />
          </div>
        </div>

        <template #footer>
          <div class="flex justify-end gap-2">
            <Button label="Cancelar" text severity="secondary" @click="visible = false" />
            <Button label="Guardar" severity="success" @click="funcionActualizar" />
          </div>
        </template>
      </Dialog>

      <Dialog v-model:visible="visiblecrear" modal header="Crear Confiscal" :style="{ width: '50rem' }">
        <template #header>
          <div class="inline-flex align-items-center justify-content-center gap-2">
            <span class="font-bold white-space-nowrap">Nuevo Confiscal</span>
          </div>
        </template>

        <div class="form-grid">
          <div class="field">
            <label>Nombre</label>
            <InputText v-model="datoscamposConfiscal.nombre" fluid />
          </div>
          <div class="field">
            <label>Prefijo</label>
            <InputText v-model="datoscamposConfiscal.prefijo" fluid class="uppercase" />
          </div>
          <div class="field">
            <label>Secuencia</label>
            <InputText v-model="datoscamposConfiscal.secuencia" fluid />
          </div>
          <div class="field">
            <label>Aprobados</label>
            <InputNumber v-model="datoscamposConfiscal.aprobados" fluid />
          </div>
          <div class="field">
            <label>Fecha</label>
            <Calendar v-model="datoscamposConfiscal.fecha" fluid />
          </div>
          <div class="field">
            <label>Expiración</label>
            <Calendar v-model="datoscamposConfiscal.expiracion" fluid />
          </div>
          <div class="field">
            <label>Contador</label>
            <InputNumber v-model="datoscamposConfiscal.contador" fluid />
          </div>
        </div>

        <template #footer>
          <div class="flex justify-end gap-2">
            <Button label="Cancelar" text severity="secondary" @click="visiblecrear = false" />
            <Button label="Crear" severity="success" @click="funcionCrear" />
          </div>
        </template>
      </Dialog>

      <Dialog v-model:visible="visibleComprobantes" modal header="Agregar Comprobante" :style="{ width: '40rem' }">
        <div class="form-grid">
          <div class="field">
            <label>Tipo de Comprobante</label>
            <Dropdown
              v-model="tipoComprobante"
              :options="['B01','B02','B03','B04','B11','B13','B14','B15']"
              fluid
            />
          </div>
          <div class="field">
            <label>Cantidad Aprobada</label>
            <InputNumber v-model="cantidadComprobante" fluid min="1" />
          </div>
          <div class="field full">
            <label>Fecha de Expiración</label>
            <Calendar v-model="fechaExpiracion" fluid />
          </div>
        </div>

        <template #footer>
          <div class="flex justify-end gap-2">
            <Button label="Cancelar" text severity="secondary" @click="visibleComprobantes = false" />
            <Button label="Actualizar" severity="success" @click="fnAgregarComprobantes" />
          </div>
        </template>
      </Dialog>

      <Toast />
    </div>
  </main>
</template>

<style scoped>
.confiscal-wrapper {
  min-height: 100vh;
  background: linear-gradient(180deg, #f8fafc 0%, #eef2ff 45%, #ffffff 100%);
  color: #0f172a;
}

.confiscal-hero {
  background: linear-gradient(135deg, #0f172a, #1e293b 45%, #0ea5e9);
  color: #e2e8f0;
  border-radius: 18px;
  padding: 24px;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 20px;
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.confiscal-hero__text h1 {
  margin: 4px 0 8px;
  font-size: 1.8rem;
  font-weight: 800;
}

.confiscal-hero__text p {
  margin: 0;
  color: #cbd5e1;
}

.confiscal-hero__meta {
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

.confiscal-hero__stats {
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
  max-width: 840px;
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

.confiscal-table {
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 12px 30px rgba(15, 23, 42, 0.06);
}

:deep(.confiscal-table .p-datatable-header) {
  background: #f8fafc;
  border: 0;
  padding: 16px;
}

.table-header h3 {
  margin: 0;
  color: #0f172a;
}

:deep(.confiscal-table .p-datatable-thead > tr > th) {
  background: #e2e8f0;
  color: #0f172a;
  font-weight: 700;
  border: 0;
  padding: 14px 12px;
}

:deep(.confiscal-table .p-datatable-tbody > tr > td) {
  padding: 12px 12px;
  border: 0;
  color: #1f2937;
  font-size: 0.95rem;
}

:deep(.confiscal-table .p-datatable-tbody > tr:hover) {
  background: #ecfeff;
}

:deep(.confiscal-table .p-paginator) {
  border-top: 1px solid #e2e8f0;
  padding: 10px;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 12px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.field label {
  font-weight: 700;
  color: #0f172a;
  font-size: 0.95rem;
}

:deep(.p-dialog .p-dialog-content) {
  padding-top: 0;
}

.form-grid .p-inputtext,
.form-grid .p-inputnumber,
.form-grid .p-calendar,
.form-grid .p-dropdown {
  width: 100%;
}

@media (max-width: 768px) {
  .confiscal-hero {
    padding: 18px;
  }

  .panel {
    padding: 16px;
  }
}
</style>
