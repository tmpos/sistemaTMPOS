<script setup>
import { ref, onMounted, watchEffect, computed } from 'vue';
import {
  obtenerIdsSeleccionados,
  nfecha,
  envioElectron,
  generarCodigoUnico,
  peticionesFetchOffline,
  arrayToObjetoFromTablaOffline,
  crearTablaSiNoExisteOffline
} from '../../funciones/funciones.js';
import Swal from 'sweetalert2';
import { useToast } from 'primevue/usetoast';

const toast = useToast();

const usuarioLocal = ref({});
const camposArray = ['nombre', 'cedula', 'telefono', 'direccion', 'codigo', 'porcentaje', 'activo', 'usuario'];

const token = ref('');
const patronTelefono = ref('');
const tokenCorto = ref('');

const selectedItems = ref([]);
const position = ref('top');
const datoscamposDelivery = ref({});
const visible = ref(false);
const visiblecrear = ref(false);
const datoscampos = ref({});
const data = ref([]);
const searchQuery = ref('');

async function limpiarCamposCrear() {
  datoscamposDelivery.value = {};
  await campos();
}

watchEffect(() => {
  if (visiblecrear.value) {
    datoscamposDelivery.value.codigo = generarCodigoUnico();
    datoscamposDelivery.value.porcentaje = 0.00;
    datoscamposDelivery.value.activo = 'ON';
  }
});

const fetchAndSetupData = async () => {
  const response = await peticionesFetchOffline('getDataAsArray', 'delivery');
  data.value = Array.isArray(response) ? response : [];
};

async function campos() {
  const campos = await arrayToObjetoFromTablaOffline('delivery');
  datoscamposDelivery.value = campos;
  datoscamposDelivery.value.codigo = generarCodigoUnico();
}

onMounted(async () => {
  const datosJSON = await envioElectron('datosarchivo');
  token.value = datosJSON.VITE_TOKEN;
  patronTelefono.value = datosJSON.VITE_PATRON_TELEFONO;
  tokenCorto.value = datosJSON.VITE_TOKEN_CORTO;

  await crearTablaSiNoExisteOffline('delivery', camposArray, toast);
  const usuarioGuardado = JSON.parse(window.localStorage.getItem('usuarioLocal') || '[]');
  usuarioLocal.value = usuarioGuardado[0] || {};
  await campos();
  await fetchAndSetupData();
});

async function borrarTodo() {
  Swal.fire({
    title: 'Estas seguro?',
    text: 'Se borraran los datos',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Si, de acuerdo',
    cancelButtonText: 'No, cancelar'
  }).then(async (result) => {
    if (result.isConfirmed) {
      const { value: password } = await Swal.fire({
        title: 'Introduce la contrasena',
        input: 'password',
        inputPlaceholder: 'Contrasena',
        showCancelButton: true,
        confirmButtonText: 'Confirmar',
        cancelButtonText: 'Cancelar'
      });
      if (password) {
        if (password === token.value || password === tokenCorto.value) {
          const envioDatos = await peticionesFetchOffline('deleteAll', 'delivery');
          if (envioDatos[0] == 'ok') {
            fetchAndSetupData();
            toast.add({ severity: 'success', summary: 'Exito', detail: 'Datos borrados', life: 3000 });
          } else {
            toast.add({ severity: 'error', summary: 'Error', detail: 'Fallo al borrar datos.', life: 3000 });
          }
        } else {
          toast.add({ severity: 'error', summary: 'Error', detail: 'Contrasena incorrecta', life: 3000 });
        }
      }
    } else if (result.dismiss === Swal.DismissReason.cancel) {
      toast.add({ severity: 'success', summary: 'No te preocupes', detail: 'Datos seguros', life: 3000 });
    }
  });
}

async function funcionActualizar() {
  if (!datoscampos.value) {
    console.error('Datos incompletos, no se puede actualizar.');
    return;
  }
  if (datoscampos.value.hasOwnProperty('created_at')) {
    datoscampos.value.updated_at = nfecha('timestamp');
  }
  const envioDatos = await peticionesFetchOffline('updateData', 'delivery', JSON.stringify(datoscampos.value));
  if (envioDatos[0] == 'ok') {
    visible.value = false;
    fetchAndSetupData();
    toast.add({ severity: 'success', summary: 'Exito', detail: 'Datos Actualizados', life: 3000 });
  } else {
    toast.add({ severity: 'error', summary: 'Error', detail: 'Fallo al actualizar los datos.', life: 3000 });
  }
}

async function funcionCrear() {
  if (datoscamposDelivery.value.hasOwnProperty('created_at')) {
    datoscamposDelivery.value.created_at = nfecha('timestamp');
    datoscamposDelivery.value.updated_at = nfecha('timestamp');
  }
  const envioDatos = await peticionesFetchOffline('insertData', 'delivery', JSON.stringify(datoscamposDelivery.value));
  if (envioDatos[0] == 'ok') {
    fetchAndSetupData();
    toast.add({ severity: 'success', summary: 'Exito', detail: 'Datos Agregados', life: 3000 });
    limpiarCamposCrear();
    visiblecrear.value = false;
  } else {
    toast.add({ severity: 'error', summary: 'Error', detail: 'Fallo al Agregar los datos.', life: 3000 });
  }
}

async function borrarSeleccionados() {
  const ids = obtenerIdsSeleccionados(selectedItems.value);
  Swal.fire({
    title: 'Estas seguro?',
    text: 'Se borraran los datos',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Si, de acuerdo',
    cancelButtonText: 'No, cancelar'
  }).then(async (result) => {
    if (result.isConfirmed) {
      const { value: password } = await Swal.fire({
        title: 'Introduce la contrasena',
        input: 'password',
        inputPlaceholder: 'Contrasena',
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
                await peticionesFetchOffline('deleteEntry', 'delivery', id);
              } catch (error) {
                console.error(`Error al eliminar datos para ID: ${id}`, error);
                exitoTotal = false;
              }
            }
            if (exitoTotal) {
              fetchAndSetupData();
              selectedItems.value = [];
              toast.add({ severity: 'success', summary: 'Exito', detail: 'Datos Borrados', life: 3000 });
            } else {
              toast.add({ severity: 'error', summary: 'Error', detail: 'Fallo al Borrar los datos.', life: 3000 });
            }
          } else {
            toast.add({ severity: 'error', summary: 'Error', detail: 'No hay datos para borrar', life: 3000 });
          }
        } else {
          toast.add({ severity: 'error', summary: 'Error', detail: 'Contrasena incorrecta', life: 3000 });
        }
      }
    } else if (result.dismiss === Swal.DismissReason.cancel) {
      toast.add({ severity: 'success', summary: 'No te preocupes', detail: 'Datos Seguros', life: 3000 });
    }
  });
}

const itemsDelivery = ref([]);
const menu = ref(null);
const currentRowData = ref(null);

const toggleDelivery = (event, rowData) => {
  currentRowData.value = rowData;
  itemsDelivery.value = [
    {
      label: 'Editar',
      icon: 'pi pi-pencil',
      command: () => {
        visible.value = true;
        datoscampos.value = currentRowData.value;
      }
    },
    {
      label: 'Eliminar',
      icon: 'pi pi-trash',
      command: () => {
        Swal.fire({
          title: 'Introduce la contrasena',
          input: 'password',
          inputPlaceholder: 'Contrasena',
          showCancelButton: true,
          confirmButtonText: 'Eliminar',
          cancelButtonText: 'Cancelar'
        }).then(async (result) => {
          if (result.isConfirmed) {
            const contrasenaIngresada = result.value;
            if (contrasenaIngresada === token.value || contrasenaIngresada === tokenCorto.value) {
              const datosFactura = await peticionesFetchOffline('deleteEntry', 'delivery', rowData.id);
              if (datosFactura[0] == 'ok') {
                toast.add({ severity: 'success', summary: 'Exito', detail: 'Datos eliminados correctamente', life: 3000 });
                await fetchAndSetupData();
              } else {
                toast.add({ severity: 'error', summary: 'Error', detail: 'Error al eliminar los datos', life: 3000 });
              }
            } else {
              toast.add({ severity: 'error', summary: 'Error', detail: 'Contrasena incorrecta', life: 3000 });
            }
          }
        });
      }
    }
  ];
  menu.value?.toggle(event);
};

const filteredDelivery = computed(() => {
  if (!searchQuery.value) return data.value;
  return data.value.filter((busqueda) => {
    return Object.values(busqueda).some((value) =>
      String(value).toLowerCase().includes(searchQuery.value.toLowerCase())
    );
  });
});

const deliveryActivos = computed(() => data.value.filter((item) => item.activo === 'ON').length);
const deliveryInactivos = computed(() => data.value.filter((item) => item.activo === 'OFF').length);
const promedioPorcentaje = computed(() => {
  if (!data.value.length) return '0.00';
  const total = data.value.reduce((sum, item) => sum + Number(item.porcentaje || 0), 0);
  return (total / data.value.length).toFixed(2);
});
const inicialesDelivery = (nombre = '') => {
  const partes = String(nombre).trim().split(/\s+/).filter(Boolean);
  return partes.slice(0, 2).map((parte) => parte[0]).join('').toUpperCase() || 'DL';
};
</script>

<template>
  <main class="delivery-page">
    <section class="delivery-hero">
      <div>
        <span class="eyebrow">Operaciones</span>
        <h1>Delivery</h1>
        <p>Gestiona mensajeros, comisiones y estado operativo.</p>
      </div>
      <div class="hero-actions">
        <Button icon="pi pi-refresh" label="Recargar" severity="secondary" outlined @click="fetchAndSetupData" />
        <Button icon="pi pi-plus" label="Nuevo delivery" @click="visiblecrear = true" />
      </div>
    </section>

    <section class="metrics-grid">
      <article class="metric-card">
        <span>Total</span>
        <strong>{{ data.length }}</strong>
        <small>registros</small>
      </article>
      <article class="metric-card">
        <span>Activos</span>
        <strong>{{ deliveryActivos }}</strong>
        <small>disponibles</small>
      </article>
      <article class="metric-card">
        <span>Inactivos</span>
        <strong>{{ deliveryInactivos }}</strong>
        <small>fuera de servicio</small>
      </article>
      <article class="metric-card">
        <span>Comision promedio</span>
        <strong>{{ promedioPorcentaje }}%</strong>
        <small>por delivery</small>
      </article>
    </section>

    <section class="delivery-panel">
      <div class="panel-toolbar">
        <div>
          <h2>Directorio de delivery</h2>
          <p>{{ filteredDelivery.length }} resultado(s) encontrados</p>
        </div>
        <div class="toolbar-actions">
          <span class="search-box">
            <i class="pi pi-search"></i>
            <input v-model="searchQuery" placeholder="Buscar por nombre, telefono, cedula..." />
          </span>
          <Button icon="pi pi-trash" label="Borrar seleccion" severity="danger" outlined :disabled="selectedItems.length === 0" @click="borrarSeleccionados" />
          <Button v-if="usuarioLocal.usuario == 'Soporte'" icon="pi pi-times" label="Borrar todo" severity="danger" @click="borrarTodo" />
        </div>
      </div>

      <DataTable
        :value="filteredDelivery"
        scrollable
        scrollHeight="560px"
        dataKey="id"
        paginator
        :rows="10"
        v-model:selection="selectedItems"
        :rowsPerPageOptions="[5, 10, 20, 50]"
        tableStyle="min-width: 62rem"
        class="delivery-table"
        stripedRows
      >
        <Column selectionMode="multiple" headerStyle="width: 3rem"></Column>
        <Column header="Delivery" style="min-width: 16rem">
          <template #body="slotProps">
            <div class="person-cell">
              <span class="avatar">{{ inicialesDelivery(slotProps.data.nombre) }}</span>
              <div>
                <strong>{{ slotProps.data.nombre || 'Sin nombre' }}</strong>
                <small>{{ slotProps.data.codigo || 'Sin codigo' }}</small>
              </div>
            </div>
          </template>
        </Column>
        <Column field="cedula" header="Cedula" style="min-width: 9rem"></Column>
        <Column field="telefono" header="Telefono" style="min-width: 10rem"></Column>
        <Column field="direccion" header="Direccion" style="min-width: 18rem"></Column>
        <Column header="Comision" style="min-width: 8rem">
          <template #body="slotProps">
            <span class="commission-pill">{{ slotProps.data.porcentaje || 0 }}%</span>
          </template>
        </Column>
        <Column header="Estado" style="min-width: 8rem">
          <template #body="slotProps">
            <span :class="['status-pill', slotProps.data.activo === 'ON' ? 'is-active' : 'is-inactive']">
              {{ slotProps.data.activo === 'ON' ? 'Activo' : 'Inactivo' }}
            </span>
          </template>
        </Column>
        <Column field="usuario" header="Usuario" style="min-width: 10rem"></Column>
        <Column header="Acciones" style="width: 7rem">
          <template #body="slotProps">
            <Button
              icon="pi pi-ellipsis-v"
              text
              rounded
              severity="secondary"
              @click="toggleDelivery($event, slotProps.data)"
              aria-haspopup="true"
              aria-controls="overlay_menu_Delivery"
            />
          </template>
        </Column>
      </DataTable>
      <Menu
        ref="menu"
        id="overlay_menu_Delivery"
        :model="itemsDelivery"
        :popup="true"
      />
    </section>

    <Dialog v-model:visible="visible" :position="position" modal :style="{ width: '52rem' }" :breakpoints="{ '1199px': '75vw', '575px': '92vw' }">
      <template #header>
        <div class="dialog-title">
          <i class="pi pi-user-edit"></i>
          <span>Editar delivery</span>
        </div>
      </template>
      <form class="delivery-form" id="formularioActualizarDelivery">
        <input type="hidden" v-model="datoscampos.id" name="id" id="id-Actualizador" readonly>
        <div class="field">
          <label for="nombre-Actualizador">Nombre</label>
          <input v-model="datoscampos.nombre" name="nombre" class="form-control" id="nombre-Actualizador" placeholder="Nombre completo" v-mayuscula maxlength="250">
        </div>
        <div class="field">
          <label for="cedula-Actualizador">Cedula</label>
          <input v-model="datoscampos.cedula" name="cedula" class="form-control" id="cedula-Actualizador" placeholder="Cedula" maxlength="250">
        </div>
        <div class="field">
          <label for="telefono-Actualizador">Telefono</label>
          <InputMask id="telefono-Actualizador" class="form-control" v-model="datoscampos.telefono" :mask="patronTelefono" :placeholder="patronTelefono" />
        </div>
        <div class="field field-full">
          <label for="direccion-Actualizador">Direccion</label>
          <textarea class="form-control" id="direccion-Actualizador" name="direccion" v-model="datoscampos.direccion" rows="3" placeholder="Direccion de referencia"></textarea>
        </div>
        <div class="field">
          <label for="codigo-Actualizador">Codigo</label>
          <input v-model="datoscampos.codigo" name="codigo" class="form-control" id="codigo-Actualizador" placeholder="Codigo" maxlength="250" readonly>
        </div>
        <div class="field">
          <label for="porcentaje-Actualizador">Porcentaje</label>
          <input v-model="datoscampos.porcentaje" name="porcentaje" class="form-control" id="porcentaje-Actualizador" placeholder="0.00" maxlength="250">
        </div>
        <div class="field">
          <label for="activo-Actualizador">Estado</label>
          <select class="form-control" id="activo-Actualizador" v-model="datoscampos.activo" name="activo">
            <option value="ON">Activo</option>
            <option value="OFF">Inactivo</option>
          </select>
        </div>
        <input type="hidden" v-model="datoscampos.created_at" name="created_at">
        <input type="hidden" v-model="datoscampos.updated_at" name="updated_at">
        <input type="hidden" v-model="datoscampos.usuario" name="usuario">
      </form>
      <template #footer>
        <Button label="Cancelar" text severity="secondary" @click="visible = false" />
        <Button label="Guardar cambios" icon="pi pi-check" @click="funcionActualizar" />
      </template>
    </Dialog>

    <Dialog v-model:visible="visiblecrear" :position="position" modal :style="{ width: '52rem' }" :breakpoints="{ '1199px': '75vw', '575px': '92vw' }">
      <template #header>
        <div class="dialog-title">
          <i class="pi pi-user-plus"></i>
          <span>Nuevo delivery</span>
        </div>
      </template>
      <form class="delivery-form" id="formularioCrearDelivery">
        <div class="field">
          <label for="nombreAgregarDatos">Nombre</label>
          <input v-model="datoscamposDelivery.nombre" name="nombre" class="form-control mayusc" id="nombreAgregarDatos" v-mayuscula placeholder="Nombre completo" maxlength="250">
        </div>
        <div class="field">
          <label for="cedulaAgregarDatos">Cedula</label>
          <input v-model="datoscamposDelivery.cedula" name="cedula" class="form-control" id="cedulaAgregarDatos" placeholder="Cedula" maxlength="250">
        </div>
        <div class="field">
          <label for="telefonoAgregarDatos">Telefono</label>
          <InputMask id="telefonoAgregarDatos" class="form-control" v-model="datoscamposDelivery.telefono" :mask="patronTelefono" :placeholder="patronTelefono" />
        </div>
        <div class="field field-full">
          <label for="direccionAgregarDatos">Direccion</label>
          <textarea class="form-control" v-model="datoscamposDelivery.direccion" id="direccionAgregarDatos" name="direccion" rows="3" placeholder="Direccion de referencia"></textarea>
        </div>
        <div class="field">
          <label for="codigoAgregarDatos">Codigo</label>
          <input v-model="datoscamposDelivery.codigo" name="codigo" class="form-control" id="codigoAgregarDatos" placeholder="Codigo" maxlength="250" readonly>
        </div>
        <div class="field">
          <label for="porcentajeAgregarDatos">Porcentaje</label>
          <input v-model="datoscamposDelivery.porcentaje" name="porcentaje" class="form-control" id="porcentajeAgregarDatos" v-solonumeros v-decimales v-numeroFocusinOut placeholder="0.00" maxlength="250">
        </div>
        <div class="field">
          <label for="activoAgregarDatos">Estado</label>
          <select class="form-control" v-model="datoscamposDelivery.activo" id="activoAgregarDatos" name="activo">
            <option value="ON">Activo</option>
            <option value="OFF">Inactivo</option>
          </select>
        </div>
        <input type="hidden" v-model="datoscamposDelivery.created_at" name="created_at">
        <input type="hidden" v-model="datoscamposDelivery.updated_at" name="updated_at">
        <input type="hidden" v-model="datoscamposDelivery.usuario" name="usuario">
      </form>
      <template #footer>
        <Button label="Cancelar" text severity="secondary" @click="visiblecrear = false" />
        <Button label="Crear delivery" icon="pi pi-check" @click="funcionCrear" />
      </template>
    </Dialog>

    <Toast />
  </main>
</template>

<style scoped>
.delivery-page {
  min-height: 100%;
  padding: 24px;
  background: #f5f7fb;
  color: #1f2937;
}

.delivery-hero {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  padding: 26px;
  border: 1px solid #d8e0ea;
  border-radius: 8px;
  background: linear-gradient(135deg, #ffffff 0%, #eef6f8 100%);
  box-shadow: 0 12px 30px rgba(31, 41, 55, 0.08);
}

.eyebrow {
  display: inline-flex;
  margin-bottom: 8px;
  color: #0f766e;
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0;
  text-transform: uppercase;
}

.delivery-hero h1 {
  margin: 0;
  color: #111827;
  font-size: 2rem;
  font-weight: 800;
}

.delivery-hero p,
.panel-toolbar p {
  margin: 6px 0 0;
  color: #64748b;
}

.hero-actions,
.toolbar-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14px;
  margin: 18px 0;
}

.metric-card {
  padding: 18px;
  border: 1px solid #d8e0ea;
  border-radius: 8px;
  background: #ffffff;
  box-shadow: 0 8px 22px rgba(31, 41, 55, 0.06);
}

.metric-card span,
.metric-card small {
  display: block;
  color: #64748b;
}

.metric-card strong {
  display: block;
  margin: 6px 0;
  color: #111827;
  font-size: 1.7rem;
}

.delivery-panel {
  overflow: hidden;
  border: 1px solid #d8e0ea;
  border-radius: 8px;
  background: #ffffff;
  box-shadow: 0 12px 30px rgba(31, 41, 55, 0.08);
}

.panel-toolbar {
  display: flex;
  justify-content: space-between;
  gap: 18px;
  padding: 18px;
  border-bottom: 1px solid #e5ebf2;
}

.panel-toolbar h2 {
  margin: 0;
  color: #111827;
  font-size: 1.2rem;
  font-weight: 800;
}

.search-box {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-width: 310px;
  height: 42px;
  padding: 0 12px;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  background: #ffffff;
  color: #64748b;
}

.search-box input {
  width: 100%;
  border: 0;
  outline: 0;
  background: transparent;
  color: #111827;
}

.person-cell {
  display: flex;
  align-items: center;
  gap: 12px;
}

.avatar {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 38px;
  height: 38px;
  border-radius: 8px;
  background: #0f766e;
  color: #ffffff;
  font-weight: 800;
}

.person-cell strong,
.person-cell small {
  display: block;
}

.person-cell small {
  margin-top: 2px;
  color: #64748b;
}

.commission-pill,
.status-pill {
  display: inline-flex;
  align-items: center;
  min-height: 28px;
  padding: 4px 10px;
  border-radius: 8px;
  font-size: 0.85rem;
  font-weight: 700;
}

.commission-pill {
  background: #eef2ff;
  color: #3730a3;
}

.status-pill.is-active {
  background: #dcfce7;
  color: #166534;
}

.status-pill.is-inactive {
  background: #fee2e2;
  color: #991b1b;
}

.dialog-title {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  color: #111827;
  font-weight: 800;
}

.delivery-form {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
  padding-top: 8px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.field-full {
  grid-column: 1 / -1;
}

.field label {
  color: #334155;
  font-size: 0.82rem;
  font-weight: 800;
}

.form-control {
  width: 100%;
  min-height: 42px;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  padding: 9px 11px;
  color: #111827;
  background: #ffffff;
}

textarea.form-control {
  resize: vertical;
}

:deep(.delivery-table .p-datatable-header),
:deep(.delivery-table .p-datatable-thead > tr > th) {
  background: #f8fafc;
  color: #334155;
  font-weight: 800;
}

:deep(.delivery-table .p-datatable-tbody > tr > td) {
  border-color: #edf2f7;
  vertical-align: middle;
}

@media (max-width: 960px) {
  .delivery-page {
    padding: 14px;
  }

  .delivery-hero,
  .panel-toolbar {
    align-items: flex-start;
    flex-direction: column;
  }

  .metrics-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .toolbar-actions,
  .search-box {
    width: 100%;
  }

  .delivery-form {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 560px) {
  .metrics-grid {
    grid-template-columns: 1fr;
  }

  .delivery-hero h1 {
    font-size: 1.55rem;
  }
}
</style>
