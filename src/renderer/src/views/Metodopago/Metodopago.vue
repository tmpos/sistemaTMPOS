<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
const router = useRouter();
import {
  nfecha, encryptarPassword, envioElectron, mensajetoast,
  crearTablaSiNoExisteOffline, peticionesFetchOffline,
  arrayToObjetoFromTablaOffline, obtenerIdsSeleccionados, lasMayusculas
} from '../../funciones/funciones.js';
import Swal from 'sweetalert2';
import { useToast } from 'primevue/usetoast';
const toast = useToast();

/************************************************************************/
const camposArray = ['nombre', 'porcentaje', 'usuario', 'created_at', 'updated_at'];
/************************************************************************/
import { useDatosEmpresa } from '../../stores';
const datosEmpresa = useDatosEmpresa();

const link      = ref('');
const token     = ref('');
const tokenCorto = ref('');
const usuarioLocal = ref({});

/************************************************************************/
// Estado
const data           = ref([]);
const searchQuery    = ref('');
const selectedItems  = ref([]);

// Modales
const visibleCrear   = ref(false);
const visibleEditar  = ref(false);

// Formularios
const formCrear  = ref({ nombre: '', porcentaje: 0 });
const formEditar = ref({});

const loadingCrear   = ref(false);
const loadingEditar  = ref(false);

/************************************************************************/
const fetchData = async () => {
  const response = await peticionesFetchOffline('getDataAsArray', 'metodopago');
  data.value = response || [];
};

/************************************************************************/
const filteredData = computed(() => {
  if (!searchQuery.value) return data.value;
  const q = searchQuery.value.toLowerCase();
  return data.value.filter(row =>
    Object.values(row).some(v => String(v).toLowerCase().includes(q))
  );
});

/************************************************************************/
const abrirCrear = () => {
  formCrear.value = { nombre: '', porcentaje: 0 };
  visibleCrear.value = true;
};

const abrirEditar = (row) => {
  formEditar.value = { ...row };
  visibleEditar.value = true;
};

/************************************************************************/
const funcionCrear = async () => {
  if (!formCrear.value.nombre?.trim()) {
    toast.add({ severity: 'warn', summary: 'Campo requerido', detail: 'El nombre es obligatorio', life: 3000 });
    return;
  }
  loadingCrear.value = true;
  try {
    const payload = {
      ...formCrear.value,
      nombre: String(formCrear.value.nombre).toUpperCase(),
      usuario: usuarioLocal.value?.usuario || '',
      created_at: nfecha('timestamp'),
      updated_at: nfecha('timestamp'),
    };
    const res = await peticionesFetchOffline('insertData', 'metodopago', JSON.stringify(payload));
    if (res[0] === 'ok') {
      toast.add({ severity: 'success', summary: 'Creado', detail: 'Método de pago agregado', life: 3000 });
      visibleCrear.value = false;
      await fetchData();
    } else {
      toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo crear el registro', life: 3000 });
    }
  } finally {
    loadingCrear.value = false;
  }
};

/************************************************************************/
const funcionActualizar = async () => {
  if (!formEditar.value.nombre?.trim()) {
    toast.add({ severity: 'warn', summary: 'Campo requerido', detail: 'El nombre es obligatorio', life: 3000 });
    return;
  }
  loadingEditar.value = true;
  try {
    const payload = {
      ...formEditar.value,
      nombre: String(formEditar.value.nombre).toUpperCase(),
      updated_at: nfecha('timestamp'),
    };
    const res = await peticionesFetchOffline('updateData', 'metodopago', JSON.stringify(payload));
    if (res[0] === 'ok') {
      toast.add({ severity: 'success', summary: 'Actualizado', detail: 'Cambios guardados correctamente', life: 3000 });
      visibleEditar.value = false;
      await fetchData();
    } else {
      toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo actualizar el registro', life: 3000 });
    }
  } finally {
    loadingEditar.value = false;
  }
};

/************************************************************************/
const eliminarFila = (row) => {
  Swal.fire({
    title: `¿Eliminar "${row.nombre}"?`,
    text: 'Esta acción no se puede deshacer.',
    icon: 'warning',
    input: 'password',
    inputPlaceholder: 'Ingresa tu contraseña',
    showCancelButton: true,
    confirmButtonText: 'Eliminar',
    cancelButtonText: 'Cancelar',
    confirmButtonColor: '#ef4444',
    inputAttributes: { autocomplete: 'current-password' },
  }).then(async (result) => {
    if (result.isConfirmed) {
      if (result.value === token.value || result.value === tokenCorto.value) {
        const res = await peticionesFetchOffline('deleteEntry', 'metodopago', row.id);
        if (res[0] === 'ok') {
          toast.add({ severity: 'success', summary: 'Eliminado', detail: 'Registro eliminado', life: 3000 });
          await fetchData();
        } else {
          toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo eliminar', life: 3000 });
        }
      } else {
        toast.add({ severity: 'error', summary: 'Contraseña incorrecta', detail: 'No autorizado', life: 3000 });
      }
    }
  });
};

/************************************************************************/
const eliminarSeleccionados = () => {
  const ids = obtenerIdsSeleccionados(selectedItems.value);
  if (!ids.length) {
    toast.add({ severity: 'warn', summary: 'Sin selección', detail: 'Selecciona al menos un registro', life: 3000 });
    return;
  }
  Swal.fire({
    title: `¿Eliminar ${ids.length} registro(s)?`,
    text: 'Esta acción no se puede deshacer.',
    icon: 'warning',
    input: 'password',
    inputPlaceholder: 'Ingresa tu contraseña',
    showCancelButton: true,
    confirmButtonText: 'Eliminar',
    cancelButtonText: 'Cancelar',
    confirmButtonColor: '#ef4444',
  }).then(async (result) => {
    if (result.isConfirmed) {
      if (result.value === token.value || result.value === tokenCorto.value) {
        let ok = true;
        for (const id of ids) {
          try { await peticionesFetchOffline('deleteEntry', 'metodopago', id); }
          catch { ok = false; }
        }
        selectedItems.value = [];
        await fetchData();
        toast.add({
          severity: ok ? 'success' : 'warn',
          summary: ok ? 'Eliminados' : 'Parcial',
          detail: ok ? 'Registros eliminados' : 'Algunos registros no pudieron eliminarse',
          life: 3000
        });
      } else {
        toast.add({ severity: 'error', summary: 'Contraseña incorrecta', detail: 'No autorizado', life: 3000 });
      }
    }
  });
};

/************************************************************************/
const borrarTodo = () => {
  Swal.fire({
    title: '¿Borrar TODOS los métodos de pago?',
    text: 'Esta acción eliminará todos los registros permanentemente.',
    icon: 'warning',
    input: 'password',
    inputPlaceholder: 'Contraseña de administrador',
    showCancelButton: true,
    confirmButtonText: 'Borrar todo',
    cancelButtonText: 'Cancelar',
    confirmButtonColor: '#ef4444',
  }).then(async (result) => {
    if (result.isConfirmed) {
      if (result.value === token.value || result.value === tokenCorto.value) {
        const res = await peticionesFetchOffline('deleteAll', 'metodopago');
        if (res[0] === 'ok') {
          toast.add({ severity: 'success', summary: 'Limpiado', detail: 'Todos los datos eliminados', life: 3000 });
          await fetchData();
        }
      } else {
        toast.add({ severity: 'error', summary: 'Contraseña incorrecta', detail: 'No autorizado', life: 3000 });
      }
    }
  });
};

/************************************************************************/
onMounted(async () => {
  const datosJSON = await envioElectron('datosarchivo');
  link.value        = datosJSON.VITE_LINKURL;
  token.value       = datosJSON.VITE_TOKEN;
  tokenCorto.value  = datosJSON.VITE_TOKEN_CORTO;
  usuarioLocal.value = JSON.parse(window.localStorage.getItem('usuarioLocal'))?.[0] || {};
  await crearTablaSiNoExisteOffline('metodopago', camposArray, toast);
  await fetchData();
});
</script>

<template>
<main class="content-wrapper">
  <div class="w-full px-4 mt-5">
    <Card>
      <template #content>

        <!-- Encabezado -->
        <div class="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div>
            <h2 class="text-xl font-bold text-gray-800 dark:text-white m-0">Métodos de Pago</h2>
            <p class="text-sm text-gray-500 dark:text-gray-400 m-0 mt-1">Administra los métodos de pago disponibles</p>
          </div>
          <div class="flex gap-2 flex-wrap">
            <Button
              label="Nuevo"
              icon="pi pi-plus"
              severity="success"
              @click="abrirCrear"
            />
            <Button
              icon="pi pi-refresh"
              severity="secondary"
              outlined
              v-tooltip.top="'Recargar'"
              @click="fetchData"
            />
            <Button
              icon="pi pi-trash"
              severity="danger"
              outlined
              v-tooltip.top="'Eliminar seleccionados'"
              @click="eliminarSeleccionados"
            />
            <Button
              v-if="usuarioLocal.usuario === 'Soporte'"
              label="Borrar Todo"
              icon="pi pi-ban"
              severity="danger"
              outlined
              @click="borrarTodo"
            />
          </div>
        </div>

        <!-- Buscador -->
        <div class="flex justify-end mb-3">
          <IconField>
            <InputIcon class="pi pi-search" />
            <InputText
              v-model="searchQuery"
              placeholder="Buscar método de pago..."
              style="width: 280px;"
            />
          </IconField>
        </div>

        <!-- Tabla -->
        <DataTable
          :value="filteredData"
          v-model:selection="selectedItems"
          dataKey="id"
          paginator
          :rows="10"
          :rowsPerPageOptions="[5, 10, 20, 50]"
          scrollable
          scrollHeight="500px"
          stripedRows
          tableStyle="min-width: 30rem"
          paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink RowsPerPageDropdown"
          currentPageReportTemplate="{first} - {last} de {totalRecords}"
        >
          <Column selectionMode="multiple" headerStyle="width: 3rem" />

          <Column header="" style="width: 5rem">
            <template #body="{ data: row }">
              <div class="flex gap-1">
                <Button
                  icon="pi pi-pencil"
                  severity="info"
                  size="small"
                  text
                  rounded
                  v-tooltip.top="'Editar'"
                  @click="abrirEditar(row)"
                />
                <Button
                  icon="pi pi-trash"
                  severity="danger"
                  size="small"
                  text
                  rounded
                  v-tooltip.top="'Eliminar'"
                  @click="eliminarFila(row)"
                />
              </div>
            </template>
          </Column>

          <Column field="nombre" header="Nombre" sortable>
            <template #body="{ data: row }">
              <span class="font-medium">{{ row.nombre }}</span>
            </template>
          </Column>

          <Column field="porcentaje" header="Porcentaje (%)" sortable style="width: 9rem">
            <template #body="{ data: row }">
              <Tag
                :value="(row.porcentaje ?? 0) + '%'"
                :severity="Number(row.porcentaje) > 0 ? 'warn' : 'secondary'"
              />
            </template>
          </Column>

          <Column field="usuario" header="Usuario" style="width: 10rem">
            <template #body="{ data: row }">
              <span class="text-sm text-gray-500">{{ row.usuario || '—' }}</span>
            </template>
          </Column>

          <template #empty>
            <div class="text-center py-8 text-gray-400">
              <i class="pi pi-inbox text-4xl mb-3 block"></i>
              <p>No hay métodos de pago registrados</p>
            </div>
          </template>
        </DataTable>

      </template>
    </Card>
  </div>

  <!-- ===== MODAL CREAR ===== -->
  <Dialog
    v-model:visible="visibleCrear"
    modal
    :style="{ width: '440px' }"
    :breakpoints="{ '640px': '95vw' }"
    :draggable="false"
  >
    <template #header>
      <div class="flex items-center gap-2">
        <div class="flex items-center justify-center w-8 h-8 rounded-full bg-green-100 dark:bg-green-900">
          <i class="pi pi-plus text-green-600 dark:text-green-300 text-sm"></i>
        </div>
        <div>
          <p class="font-bold text-gray-800 dark:text-white m-0">Nuevo Método de Pago</p>
          <p class="text-xs text-gray-500 m-0">Completa los campos para agregar</p>
        </div>
      </div>
    </template>

    <div class="flex flex-col gap-4 pt-2">
      <div class="flex flex-col gap-1">
        <label class="text-sm font-semibold text-gray-700 dark:text-gray-300">
          Nombre <span class="text-red-500">*</span>
        </label>
        <InputText
          v-model="formCrear.nombre"
          placeholder="Ej: EFECTIVO, TARJETA..."
          class="w-full uppercase"
          @input="formCrear.nombre = String(formCrear.nombre).toUpperCase()"
          autofocus
        />
      </div>

      <div class="flex flex-col gap-1">
        <label class="text-sm font-semibold text-gray-700 dark:text-gray-300">
          Porcentaje (%)
        </label>
        <InputNumber
          v-model="formCrear.porcentaje"
          :min="0"
          :max="100"
          :minFractionDigits="0"
          :maxFractionDigits="2"
          suffix="%"
          class="w-full"
          placeholder="0"
        />
        <small class="text-gray-400">Cargo adicional aplicado al usar este método</small>
      </div>
    </div>

    <template #footer>
      <div class="flex justify-end gap-2">
        <Button
          label="Cancelar"
          severity="secondary"
          text
          @click="visibleCrear = false"
          :disabled="loadingCrear"
        />
        <Button
          label="Guardar"
          icon="pi pi-check"
          severity="success"
          :loading="loadingCrear"
          @click="funcionCrear"
        />
      </div>
    </template>
  </Dialog>

  <!-- ===== MODAL EDITAR ===== -->
  <Dialog
    v-model:visible="visibleEditar"
    modal
    :style="{ width: '440px' }"
    :breakpoints="{ '640px': '95vw' }"
    :draggable="false"
  >
    <template #header>
      <div class="flex items-center gap-2">
        <div class="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900">
          <i class="pi pi-pencil text-blue-600 dark:text-blue-300 text-sm"></i>
        </div>
        <div>
          <p class="font-bold text-gray-800 dark:text-white m-0">Editar Método de Pago</p>
          <p class="text-xs text-gray-500 m-0">{{ formEditar.nombre }}</p>
        </div>
      </div>
    </template>

    <div class="flex flex-col gap-4 pt-2">
      <div class="flex flex-col gap-1">
        <label class="text-sm font-semibold text-gray-700 dark:text-gray-300">
          Nombre <span class="text-red-500">*</span>
        </label>
        <InputText
          v-model="formEditar.nombre"
          class="w-full uppercase"
          @input="formEditar.nombre = String(formEditar.nombre).toUpperCase()"
        />
      </div>

      <div class="flex flex-col gap-1">
        <label class="text-sm font-semibold text-gray-700 dark:text-gray-300">
          Porcentaje (%)
        </label>
        <InputNumber
          v-model="formEditar.porcentaje"
          :min="0"
          :max="100"
          :minFractionDigits="0"
          :maxFractionDigits="2"
          suffix="%"
          class="w-full"
        />
        <small class="text-gray-400">Cargo adicional aplicado al usar este método</small>
      </div>
    </div>

    <template #footer>
      <div class="flex justify-end gap-2">
        <Button
          label="Cancelar"
          severity="secondary"
          text
          @click="visibleEditar = false"
          :disabled="loadingEditar"
        />
        <Button
          label="Guardar cambios"
          icon="pi pi-check"
          severity="info"
          :loading="loadingEditar"
          @click="funcionActualizar"
        />
      </div>
    </template>
  </Dialog>

  <Toast />
</main>
</template>

<style scoped>
:deep(.p-datatable .p-datatable-thead > tr > th) {
  background: var(--p-surface-50);
  font-weight: 600;
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
</style>
