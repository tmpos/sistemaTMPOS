<script setup>
import { computed, onMounted, ref } from 'vue';
import Swal from 'sweetalert2';
import { useToast } from 'primevue/usetoast';
import {
  agregarDiasalaFechaActual,
  arrayToObjetoFromTablaOffline,
  crearTablaSiNoExisteOffline,
  encryptarPassword,
  envioElectron,
  nfecha,
  obtenerIdsSeleccionados,
  peticionesFetchOffline
} from '../../funciones/funciones.js';

const toast = useToast();
const tabla = 'comprobantes_electronicos';
const camposArray = [
  'nombre',
  'prefijo',
  'tipo_ecf',
  'descripcion',
  'secuencia_inicial',
  'secuencia_final',
  'secuencia_actual',
  'secuencia',
  'aprobados',
  'contador',
  'fecha',
  'fecha_autorizacion',
  'expiracion',
  'estado',
  'activo',
  'ambiente',
  'link',
  'id_compania',
  'rnc_emisor',
  'almacen',
  'usuario',
  'observaciones'
];
const tiposElectronicos = [
  { label: 'E31 - Crédito Fiscal', value: 'E31', nombre: 'Factura de Crédito Fiscal Electrónica' },
  { label: 'E32 - Consumo', value: 'E32', nombre: 'Factura de Consumo Electrónica' },
  { label: 'E33 - Débito', value: 'E33', nombre: 'Nota de Débito Electrónica' },
  { label: 'E34 - Crédito', value: 'E34', nombre: 'Nota de Crédito Electrónica' },
  { label: 'E41 - Compras', value: 'E41', nombre: 'Comprobante de Compras Electrónico' },
  { label: 'E43 - Gastos Menores', value: 'E43', nombre: 'Gastos Menores Electrónico' },
  { label: 'E44 - Regímenes Especiales', value: 'E44', nombre: 'Regímenes Especiales Electrónico' },
  { label: 'E45 - Gubernamental', value: 'E45', nombre: 'Comprobante Gubernamental Electrónico' }
];

const usuarioLocal = ref({});
const token = ref('');
const tokenCorto = ref('');
const tokenCifrado = ref('');
const data = ref([]);
const selectedItems = ref([]);
const searchQuery = ref('');
const visible = ref(false);
const visiblecrear = ref(false);
const datoscampos = ref({});
const datoscamposCrear = ref({});
const itemsMenu = ref([]);
const currentRowData = ref(null);
const menu = ref(null);

const registroBase = (registro = {}) => ({
  ...registro,
  nombre: registro.nombre || '',
  prefijo: String(registro.prefijo || '').toUpperCase(),
  tipo_ecf: registro.tipo_ecf || String(registro.prefijo || '').toUpperCase(),
  descripcion: registro.descripcion || '',
  secuencia_inicial: String(registro.secuencia_inicial || '1'),
  secuencia_final: String(registro.secuencia_final || ''),
  secuencia_actual: String(registro.secuencia_actual || registro.secuencia || registro.secuencia_inicial || '1'),
  secuencia: String(registro.secuencia || registro.secuencia_actual || registro.secuencia_inicial || '1'),
  aprobados: Number(registro.aprobados || 0),
  contador: Number(registro.contador || 0),
  fecha: registro.fecha || nfecha('fecha'),
  fecha_autorizacion: registro.fecha_autorizacion || registro.fecha || nfecha('fecha'),
  expiracion: registro.expiracion || agregarDiasalaFechaActual(365),
  estado: registro.estado || 'ACTIVO',
  activo: registro.activo || 'SI',
  ambiente: registro.ambiente || 'sandbox',
  link: registro.link || '',
  id_compania: registro.id_compania || '',
  rnc_emisor: registro.rnc_emisor || '',
  almacen: registro.almacen || '',
  usuario: registro.usuario || usuarioLocal.value.usuario || '',
  observaciones: registro.observaciones || ''
});

const filteredData = computed(() => {
  if (!searchQuery.value) return data.value;
  return data.value.filter((item) =>
    Object.values(item).some((value) =>
      String(value ?? '').toLowerCase().includes(searchQuery.value.toLowerCase())
    )
  );
});

const solicitarPassword = async (accion) => {
  const { value: password } = await Swal.fire({
    title: 'Introduce la contraseña',
    input: 'password',
    inputPlaceholder: 'Contraseña',
    showCancelButton: true,
    confirmButtonText: accion,
    cancelButtonText: 'Cancelar'
  });
  return password;
};

const passwordValida = (password) => password === token.value || password === tokenCorto.value;

const cargarCamposCrear = async () => {
  const base = await arrayToObjetoFromTablaOffline(tabla);
  datoscamposCrear.value = registroBase(base);
};

const fetchAndSetupData = async () => {
  const response = await peticionesFetchOffline('getDataAsArray', tabla);
  data.value = Array.isArray(response) ? response : [];
};

const aplicarTipo = (target, prefijo) => {
  const tipo = tiposElectronicos.find((item) => item.value === prefijo);
  if (!tipo) return;
  target.prefijo = tipo.value;
  target.tipo_ecf = tipo.value;
  if (!target.nombre) target.nombre = tipo.nombre;
};

const funcionCrear = async () => {
  datoscamposCrear.value = registroBase(datoscamposCrear.value);
  datoscamposCrear.value.secuencia = datoscamposCrear.value.secuencia_actual;
  if (datoscamposCrear.value.hasOwnProperty('created_at')) {
    datoscamposCrear.value.created_at = nfecha('timestamp');
    datoscamposCrear.value.updated_at = nfecha('timestamp');
  }
  const response = await peticionesFetchOffline('insertData', tabla, JSON.stringify(datoscamposCrear.value));
  if (response[0] === 'ok') {
    await fetchAndSetupData();
    await cargarCamposCrear();
    visiblecrear.value = false;
    toast.add({ severity: 'success', summary: 'Éxito', detail: 'Comprobante electrónico creado', life: 3000 });
    return;
  }
  toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo crear el registro', life: 3000 });
};

const funcionActualizar = async () => {
  datoscampos.value = registroBase(datoscampos.value);
  datoscampos.value.secuencia = datoscampos.value.secuencia_actual;
  if (datoscampos.value.hasOwnProperty('created_at')) {
    datoscampos.value.updated_at = nfecha('timestamp');
  }
  const response = await peticionesFetchOffline('updateData', tabla, JSON.stringify(datoscampos.value));
  if (response[0] === 'ok') {
    visible.value = false;
    await fetchAndSetupData();
    toast.add({ severity: 'success', summary: 'Éxito', detail: 'Comprobante electrónico actualizado', life: 3000 });
    return;
  }
  toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo actualizar el registro', life: 3000 });
};

const eliminarRegistro = async (rowData) => {
  const password = await solicitarPassword('Eliminar');
  if (!passwordValida(password)) {
    toast.add({ severity: 'error', summary: 'Error', detail: 'Contraseña incorrecta', life: 3000 });
    return;
  }
  const response = await peticionesFetchOffline('deleteEntry', tabla, rowData.id);
  if (response[0] === 'ok') {
    await fetchAndSetupData();
    toast.add({ severity: 'success', summary: 'Éxito', detail: 'Registro eliminado', life: 3000 });
    return;
  }
  toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo eliminar el registro', life: 3000 });
};

const borrarSeleccionados = async () => {
  const ids = obtenerIdsSeleccionados(selectedItems.value);
  if (!ids.length) {
    toast.add({ severity: 'warn', summary: 'Atención', detail: 'No hay registros seleccionados', life: 3000 });
    return;
  }
  const confirm = await Swal.fire({
    title: '¿Eliminar selección?',
    text: 'Se eliminarán los comprobantes electrónicos seleccionados.',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Sí, eliminar',
    cancelButtonText: 'Cancelar'
  });
  if (!confirm.isConfirmed) return;

  const password = await solicitarPassword('Eliminar');
  if (!passwordValida(password)) {
    toast.add({ severity: 'error', summary: 'Error', detail: 'Contraseña incorrecta', life: 3000 });
    return;
  }

  for (const id of ids) {
    await peticionesFetchOffline('deleteEntry', tabla, id);
  }
  selectedItems.value = [];
  await fetchAndSetupData();
  toast.add({ severity: 'success', summary: 'Éxito', detail: 'Registros eliminados', life: 3000 });
};

const borrarTodo = async () => {
  const confirm = await Swal.fire({
    title: '¿Borrar todo?',
    text: 'Esto eliminará toda la configuración de comprobantes electrónicos.',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Sí, borrar',
    cancelButtonText: 'Cancelar'
  });
  if (!confirm.isConfirmed) return;

  const password = await solicitarPassword('Confirmar');
  if (!passwordValida(password)) {
    toast.add({ severity: 'error', summary: 'Error', detail: 'Contraseña incorrecta', life: 3000 });
    return;
  }

  const response = await peticionesFetchOffline('deleteAll', tabla);
  if (response[0] === 'ok') {
    await fetchAndSetupData();
    toast.add({ severity: 'success', summary: 'Éxito', detail: 'Datos borrados', life: 3000 });
    return;
  }
  toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron borrar los datos', life: 3000 });
};

const fnOpenInlineEdit = (rowData) => {
  datoscampos.value = registroBase({ ...rowData });
  visible.value = true;
};

const toggleMenu = (event, rowData) => {
  currentRowData.value = rowData;
  itemsMenu.value = [
    { label: 'Editar', icon: 'pi pi-pencil', command: () => fnOpenInlineEdit(currentRowData.value) },
    { label: 'Eliminar', icon: 'pi pi-trash', command: () => eliminarRegistro(currentRowData.value) }
  ];
  menu.value.toggle(event);
};

onMounted(async () => {
  const datosJSON = await envioElectron('datosarchivo');
  token.value = datosJSON.VITE_TOKEN;
  tokenCorto.value = datosJSON.VITE_TOKEN_CORTO;
  tokenCifrado.value = await encryptarPassword(token.value, 10);
  await crearTablaSiNoExisteOffline(tabla, camposArray, toast);
  usuarioLocal.value = JSON.parse(window.localStorage.getItem('usuarioLocal'))?.[0] || {};
  await cargarCamposCrear();
  await fetchAndSetupData();
});
</script>

<template>
  <main class="confiscal-wrapper">
    <div class="max-w-7xl mx-auto px-4 py-6 space-y-6">
      <section class="confiscal-hero shadow-lg">
        <div class="confiscal-hero__text">
          <p class="eyebrow">Control e-CF</p>
          <h1>Comprobantes electrónicos</h1>
          <p>Administra secuencias autorizadas, rango disponible, vigencia y ambiente para tus e-CF.</p>
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
            <span class="label">Registros</span>
            <span class="value">{{ filteredData.length }}</span>
          </div>
          <div class="stat-card alt">
            <span class="label">Activos</span>
            <span class="value">{{ data.filter(item => item.estado === 'ACTIVO').length }}</span>
          </div>
        </div>
      </section>

      <section class="panel shadow-md">
        <div class="panel__header">
          <div>
            <p class="eyebrow">Acciones</p>
            <h2>Administrar e-CF</h2>
            <span class="helper-text">Configura aprobados, rango, secuencia actual y datos de autorización.</span>
          </div>
          <div class="actions-grid">
            <Button icon="pi pi-sync" label="Recargar" severity="info" outlined @click="fetchAndSetupData" />
            <Button icon="pi pi-plus" label="Nuevo" severity="success" @click="visiblecrear = true" />
            <Button icon="pi pi-trash" label="Borrar seleccion" severity="danger" outlined @click="borrarSeleccionados" />
            <Button v-if="usuarioLocal.usuario === 'Soporte'" icon="pi pi-times" label="Borrar todo" severity="danger" @click="borrarTodo" />
          </div>
        </div>

        <div class="panel__body">
          <div class="filter-bar">
            <div class="filter-bar__input">
              <i class="pi pi-search"></i>
              <input v-model="searchQuery" placeholder="Buscar comprobantes electrónicos..." type="text" />
            </div>
            <div class="filter-bar__info">
              <span class="pill">Resultados: {{ filteredData.length }}</span>
            </div>
          </div>

          <DataTable
            class="confiscal-table"
            :value="filteredData"
            paginator
            :rows="10"
            :rowsPerPageOptions="[5, 10, 20, 50]"
            scrollable
            scrollHeight="600px"
            v-model:selection="selectedItems"
            dataKey="id"
            rowHover
            tableStyle="min-width: 80rem"
          >
            <template #header>
              <div class="table-header">
                <div>
                  <h3>Listado de e-CF</h3>
                  <p class="helper-text">Cada fila representa una autorización electrónica utilizable.</p>
                </div>
              </div>
            </template>
            <Column selectionMode="multiple" headerStyle="width:3rem" />
            <Column header="Opciones">
              <template #body="slotProps">
                <Button icon="pi pi-cog" severity="secondary" text rounded @click="toggleMenu($event, slotProps.data)" />
                <Button icon="pi pi-pencil" severity="info" text rounded class="ml-1" @click="fnOpenInlineEdit(slotProps.data)" />
                <Menu ref="menu" :model="itemsMenu" popup />
              </template>
            </Column>
            <Column field="nombre" header="Nombre" />
            <Column field="prefijo" header="Prefijo" />
            <Column field="secuencia_inicial" header="Inicio" />
            <Column field="secuencia_final" header="Fin" />
            <Column field="secuencia_actual" header="Actual" />
            <Column field="aprobados" header="Aprobados" />
            <Column field="contador" header="Consumidos" />
            <Column field="fecha_autorizacion" header="Autorización" />
            <Column field="expiracion" header="Expiración" />
            <Column field="estado" header="Estado" />
            <Column field="ambiente" header="Ambiente" />
            <Column field="link" header="Link" />
            <Column field="usuario" header="Usuario" />
          </DataTable>
        </div>
      </section>

      <Dialog v-model:visible="visible" modal header="Editar comprobante electrónico" :style="{ width: '60rem' }">
        <div class="form-grid">
          <div class="field">
            <label>Nombre</label>
            <InputText v-model="datoscampos.nombre" fluid />
          </div>
          <div class="field">
            <label>Prefijo</label>
            <Dropdown
              v-model="datoscampos.prefijo"
              :options="tiposElectronicos"
              optionLabel="label"
              optionValue="value"
              fluid
              @change="aplicarTipo(datoscampos, $event.value)"
            />
          </div>
          <div class="field">
            <label>Secuencia inicial</label>
            <InputText v-model="datoscampos.secuencia_inicial" fluid />
          </div>
          <div class="field">
            <label>Secuencia final</label>
            <InputText v-model="datoscampos.secuencia_final" fluid />
          </div>
          <div class="field">
            <label>Secuencia actual</label>
            <InputText v-model="datoscampos.secuencia_actual" fluid />
          </div>
          <div class="field">
            <label>Aprobados</label>
            <InputNumber v-model="datoscampos.aprobados" fluid />
          </div>
          <div class="field">
            <label>Consumidos</label>
            <InputNumber v-model="datoscampos.contador" fluid />
          </div>
          <div class="field">
            <label>Fecha autorización</label>
            <Calendar v-model="datoscampos.fecha_autorizacion" fluid />
          </div>
          <div class="field">
            <label>Expiración</label>
            <Calendar v-model="datoscampos.expiracion" fluid />
          </div>
          <div class="field">
            <label>Estado</label>
            <Dropdown v-model="datoscampos.estado" :options="['ACTIVO', 'INACTIVO', 'VENCIDO']" fluid />
          </div>
          <div class="field">
            <label>Ambiente</label>
            <Dropdown v-model="datoscampos.ambiente" :options="['sandbox', 'production']" fluid />
          </div>
          <div class="field">
            <label>RNC emisor</label>
            <InputText v-model="datoscampos.rnc_emisor" fluid />
          </div>
          <div class="field">
            <label>Link</label>
            <InputText v-model="datoscampos.link" fluid />
          </div>
          <div class="field">
            <label>ID Compañía (Alanube)</label>
            <InputText v-model="datoscampos.id_compania" fluid />
          </div>
          <div class="field">
            <label>Almacén</label>
            <InputText v-model="datoscampos.almacen" fluid />
          </div>
          <div class="field full">
            <label>Observaciones</label>
            <Textarea v-model="datoscampos.observaciones" rows="3" fluid />
          </div>
        </div>

        <template #footer>
          <div class="flex justify-end gap-2">
            <Button label="Cancelar" text severity="secondary" @click="visible = false" />
            <Button label="Guardar" severity="success" @click="funcionActualizar" />
          </div>
        </template>
      </Dialog>

      <Dialog v-model:visible="visiblecrear" modal header="Nuevo comprobante electrónico" :style="{ width: '60rem' }">
        <div class="form-grid">
          <div class="field">
            <label>Nombre</label>
            <InputText v-model="datoscamposCrear.nombre" fluid />
          </div>
          <div class="field">
            <label>Prefijo</label>
            <Dropdown
              v-model="datoscamposCrear.prefijo"
              :options="tiposElectronicos"
              optionLabel="label"
              optionValue="value"
              fluid
              @change="aplicarTipo(datoscamposCrear, $event.value)"
            />
          </div>
          <div class="field">
            <label>Secuencia inicial</label>
            <InputText v-model="datoscamposCrear.secuencia_inicial" fluid />
          </div>
          <div class="field">
            <label>Secuencia final</label>
            <InputText v-model="datoscamposCrear.secuencia_final" fluid />
          </div>
          <div class="field">
            <label>Secuencia actual</label>
            <InputText v-model="datoscamposCrear.secuencia_actual" fluid />
          </div>
          <div class="field">
            <label>Aprobados</label>
            <InputNumber v-model="datoscamposCrear.aprobados" fluid />
          </div>
          <div class="field">
            <label>Consumidos</label>
            <InputNumber v-model="datoscamposCrear.contador" fluid />
          </div>
          <div class="field">
            <label>Fecha autorización</label>
            <Calendar v-model="datoscamposCrear.fecha_autorizacion" fluid />
          </div>
          <div class="field">
            <label>Expiración</label>
            <Calendar v-model="datoscamposCrear.expiracion" fluid />
          </div>
          <div class="field">
            <label>Estado</label>
            <Dropdown v-model="datoscamposCrear.estado" :options="['ACTIVO', 'INACTIVO', 'VENCIDO']" fluid />
          </div>
          <div class="field">
            <label>Ambiente</label>
            <Dropdown v-model="datoscamposCrear.ambiente" :options="['sandbox', 'production']" fluid />
          </div>
          <div class="field">
            <label>RNC emisor</label>
            <InputText v-model="datoscamposCrear.rnc_emisor" fluid />
          </div>
          <div class="field">
            <label>Link</label>
            <InputText v-model="datoscamposCrear.link" fluid />
          </div>
          <div class="field">
            <label>ID Compañía (Alanube)</label>
            <InputText v-model="datoscamposCrear.id_compania" fluid />
          </div>
          <div class="field">
            <label>Almacén</label>
            <InputText v-model="datoscamposCrear.almacen" fluid />
          </div>
          <div class="field full">
            <label>Observaciones</label>
            <Textarea v-model="datoscamposCrear.observaciones" rows="3" fluid />
          </div>
        </div>

        <template #footer>
          <div class="flex justify-end gap-2">
            <Button label="Cancelar" text severity="secondary" @click="visiblecrear = false" />
            <Button label="Crear" severity="success" @click="funcionCrear" />
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
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 1.5rem;
  padding: 2rem;
  border-radius: 24px;
  background: linear-gradient(135deg, #0f172a 0%, #1d4ed8 100%);
  color: #f8fafc;
}

.confiscal-hero__text h1 {
  font-size: clamp(2rem, 4vw, 3rem);
  font-weight: 800;
  margin: 0.35rem 0;
}

.confiscal-hero__text p {
  max-width: 42rem;
  color: rgba(248, 250, 252, 0.85);
}

.eyebrow {
  text-transform: uppercase;
  letter-spacing: 0.24em;
  font-size: 0.75rem;
  font-weight: 700;
  color: #93c5fd;
}

.confiscal-hero__meta {
  display: flex;
  gap: 0.75rem;
  margin-top: 1.25rem;
  flex-wrap: wrap;
}

.meta-pill {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.65rem 1rem;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.12);
}

.confiscal-hero__stats {
  display: grid;
  gap: 1rem;
}

.stat-card {
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 1.25rem;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.12);
}

.stat-card.alt {
  background: rgba(56, 189, 248, 0.2);
}

.stat-card .label {
  font-size: 0.85rem;
  color: rgba(248, 250, 252, 0.78);
}

.stat-card .value {
  font-size: 2rem;
  font-weight: 800;
}

.panel {
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.94);
  border: 1px solid rgba(148, 163, 184, 0.2);
}

.panel__header,
.panel__body {
  padding: 1.5rem;
}

.panel__header {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  align-items: flex-start;
  border-bottom: 1px solid rgba(148, 163, 184, 0.18);
}

.actions-grid {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.helper-text {
  color: #64748b;
}

.filter-bar {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  align-items: center;
  margin-bottom: 1rem;
  flex-wrap: wrap;
}

.filter-bar__input {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.85rem 1rem;
  border-radius: 16px;
  border: 1px solid #cbd5e1;
  min-width: min(100%, 26rem);
}

.filter-bar__input input {
  border: 0;
  outline: 0;
  width: 100%;
  background: transparent;
}

.pill {
  display: inline-flex;
  align-items: center;
  padding: 0.5rem 0.85rem;
  border-radius: 999px;
  background: #dbeafe;
  color: #1d4ed8;
  font-weight: 700;
}

.table-header h3 {
  margin: 0;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1rem;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
}

.field.full {
  grid-column: 1 / -1;
}

.field label {
  font-weight: 700;
  color: #334155;
}

:deep(.confiscal-table .p-datatable-thead > tr > th) {
  background: #eff6ff;
  color: #1e3a8a;
}

:deep(.confiscal-table .p-datatable-tbody > tr:hover) {
  background: #f8fafc;
}

@media (max-width: 900px) {
  .confiscal-hero {
    grid-template-columns: 1fr;
  }

  .panel__header {
    flex-direction: column;
  }

  .actions-grid {
    justify-content: flex-start;
  }

  .form-grid {
    grid-template-columns: 1fr;
  }
}
</style>
