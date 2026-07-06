<template>
<main class="min-h-screen bg-gray-50 dark:bg-gray-900">
  <!-- Gradient Header -->
  <div class="bg-gradient-to-r from-indigo-500 to-blue-600 dark:from-indigo-700 dark:to-blue-800 px-6 py-4">
    <div class="container mx-auto">
      <div class="flex justify-between items-center">
        <div>
          <h1 class="text-3xl font-bold text-white flex items-center gap-3">
            <i class="pi pi-table"></i>
            Menus
          </h1>
          <p class="text-indigo-100 mt-1">Gestión completa de menu</p>
        </div>
        <Button
          label="Nuevo Menu"
          icon="pi pi-plus"
          @click="openCreateDialog"
          class="text-indigo-600 hover:bg-gray-100 border-0 shadow-lg hover:shadow-xl transition-all px-6 py-3 font-semibold"
        />
      </div>
    </div>
  </div>

  <div class="container mx-auto px-6 py-6">
    <!-- Stats Cards -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <div class="dark:bg-gray-800 rounded-xl shadow-md px-4 py-3 border-l-4 border-blue-500">
        <p class="text-xs text-gray-500 dark:text-gray-400 uppercase">Total Menus</p>
        <p class="text-2xl font-bold text-gray-800 dark:text-white">{{ data.length }}</p>
      </div>
      <div class="dark:bg-gray-800 rounded-xl shadow-md px-4 py-3 border-l-4 border-green-500">
        <p class="text-xs text-gray-500 dark:text-gray-400 uppercase">Registros Activos</p>
        <p class="text-2xl font-bold text-gray-800 dark:text-white">{{ data.length }}</p>
      </div>
      <div class="dark:bg-gray-800 rounded-xl shadow-md px-4 py-3 border-l-4 border-purple-500">
        <p class="text-xs text-gray-500 dark:text-gray-400 uppercase">Última Actualización</p>
        <p class="text-2xl font-bold text-gray-800 dark:text-white">{{ nfecha('fecha') }}</p>
      </div>
    </div>

    <!-- DataTable Card -->
    <div class="dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
      <!-- Toolbar -->
      <div class="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <div class="flex justify-between items-center">
          <h2 class="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
            <i class="pi pi-list text-indigo-600"></i>
            Lista de Menus
          </h2>
          <span class="p-input-icon-left">
          <IconField>
            <InputIcon class="pi pi-search" />
          <InputText
              v-model="searchQuery"
              placeholder="Buscar..."
              class="w-80"
            />
          </IconField>
          </span>
        </div>
      </div>

      <!-- Table -->
      <DataTable
        :value="filteredMenus"
        :loading="loading"
        :paginator="true"
        :rows="10"
        :rowsPerPageOptions="[5, 10, 20, 50]"
        dataKey="id"
        class="p-datatable-sm"
        :rowHover="true"
        stripedRows
        v-model:selection="selectedItems"
        @row-contextmenu="onRowContextMenu"
      >
        <!-- Columns -->
      <Column
        field="nombre"
        header="Nombre"
        sortable
        style="min-width: 10rem"
      />
      <Column
        field="tipo"
        header="Tipo"
        sortable
        style="min-width: 10rem"
      />

        <!-- Actions Column -->
        <Column header="Acciones" :exportable="false" style="min-width: 8rem">
          <template #body="slotProps">
            <Button
              icon="pi pi-ellipsis-v"
              text
              rounded
              @click="onRowMenuClick($event, slotProps.data)"
              class="text-gray-600 hover:text-indigo-600"
            />
          </template>
        </Column>

        <template #empty>
          <div class="text-center py-8">
            <i class="pi pi-inbox text-6xl text-gray-400 mb-4"></i>
            <p class="text-gray-600 dark:text-gray-400">No hay registros disponibles</p>
            <Button
              label="Crear Primero"
              icon="pi pi-plus"
              @click="openCreateDialog"
              class="mt-4"
            />
          </div>
        </template>
      </DataTable>
    </div>
  </div>

  <!-- Context Menu -->
  <Menu ref="menuRef" :model="menuItems" :popup="true" />

  <!-- Create/Edit Dialog -->
  <Dialog
    v-model:visible="dialogVisible"
    :header="dialogTitle"
    :modal="true"
    :style="{ width: '60vw' }"
    :breakpoints="{ '960px': '75vw', '640px': '95vw' }"
    class="rounded-2xl"
  >
    <template #header>
      <div class="flex items-center gap-3">
        <div class="p-3 bg-indigo-100 dark:bg-indigo-900 rounded-xl">
          <i :class="isEditMode ? 'pi pi-pencil' : 'pi pi-plus-circle'" class="text-2xl text-indigo-600 dark:text-indigo-300"></i>
        </div>
        <div>
          <h3 class="text-xl font-bold text-gray-800 dark:text-white">{{ dialogTitle }}</h3>
          <p class="text-sm text-gray-600 dark:text-gray-400">{{ isEditMode ? 'Modifique los datos necesarios' : 'Complete el formulario' }}</p>
        </div>
      </div>
    </template>

    <form @submit.prevent="submitForm" id="formularioMenu">
      <!-- INFORMACIÓN GENERAL -->
      <div class="mb-6">
        <div class="flex items-center mb-4 pb-2 border-b-2 border-indigo-500">
          <i class="pi pi-info-circle text-2xl text-indigo-600 dark:text-indigo-400 mr-3"></i>
          <h3 class="text-xl font-bold text-gray-800 dark:text-white">Información General</h3>
        </div>
        <div class="grid grid-cols-12 gap-4">
          <div class="col-span-12">
            <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              <i class="pi pi-user text-indigo-600 mr-1"></i>
              Nombre
            </label>
            <InputText
              id="nombre"
              v-model="datoscampos.nombre"
              type="text"
              class="w-full"
              
            />
          </div>

          <div class="col-span-12">
            <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              <i class="pi pi-list text-indigo-600 mr-1"></i>
              Tipo
            </label>
            <Dropdown
              id="tipo"
              v-model="datoscampos.tipo"
              :options="tipoOptions"
              optionLabel="label"
              optionValue="value"
              placeholder="Seleccione..."
              class="w-full"
              
            />
          </div>
        </div>
      </div>

      <!-- Hidden Fields -->
      <div hidden>
        <input type="input" v-model="datoscampos.created_at" name="created_at" id="created_at">
        <input type="input" v-model="datoscampos.updated_at" name="updated_at" id="updated_at">
        <input type="input" v-model="datoscampos.usuario" name="usuario" id="usuario">
      </div>
    </form>

    <template #footer>
      <div class="flex justify-end gap-3">
        <Button
          label="Cancelar"
          icon="pi pi-times"
          severity="secondary"
          text
          @click="closeDialog"
          class="hover:bg-gray-100 dark:hover:bg-gray-700"
        />
        <Button
          :label="isEditMode ? 'Actualizar' : 'Guardar'"
          icon="pi pi-check"
          @click="submitForm"
          :loading="saving"
          class="bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-indigo-600 hover:to-blue-700 border-0 shadow-md hover:shadow-lg transition-all px-6"
        />
      </div>
    </template>
  </Dialog>
</main>
<Toast />
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useToast } from 'primevue/usetoast'
import Button from 'primevue/button'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import Menu from 'primevue/menu'
import Toast from 'primevue/toast'
import Dropdown from 'primevue/dropdown'
import Swal from 'sweetalert2'
import {
  peticionesFetchOffline,
  nfecha,
  arrayToObjetoFromTabla,
  crearTablaSiNoExiste,
  encryptarPassword,
  envioElectron,
  obtenerIdsSeleccionados
} from '@/funciones/funciones.js'

/************************************************************************/
// Fields Array - Nombres de los campos de la tabla
const camposArray = ['nombre', 'tipo','created_at','updated_at']

/************************************************************************/
// Configuration Variables
const link = ref('')
const api = ref('')
const token = ref('')
const patronTelefono = ref('')
const linkImpresora = ref('')
const patroncedula = ref('')
const tokenCifrado = ref('')
const tokenCorto = ref('')
const datosJSON = ref([])

// Options for Tipo
const tipoOptions = [
    {
      "label": "Menu",
      "value": "menu"
    },
    {
      "label": "Submenu",
      "value": "submenu"
    }
  ]


/************************************************************************/
// Composables
const toast = useToast()

/************************************************************************/
// State
const data = ref([])
const currentRowData = ref(null)
const searchQuery = ref('')
const dialogVisible = ref(false)
const isEditMode = ref(false)
const loading = ref(false)
const saving = ref(false)
const selectedItems = ref([])
const menuRef = ref()

/************************************************************************/
// Menu Items
const menuItems = ref([
  {
    label: 'Editar',
    icon: 'pi pi-pencil',
    command: () => {
      if (currentRowData.value) openEditDialog(currentRowData.value)
    }
  },
  {
    separator: true
  },
  {
    label: 'Eliminar',
    icon: 'pi pi-trash',
    class: 'text-red-500',
    command: () => {
      if (currentRowData.value) confirmDelete(currentRowData.value)
    }
  }
])

/************************************************************************/
// Form data
const datoscampos = reactive({
  nombre: '',
  tipo: '',
  created_at: nfecha('timestamp'),
  updated_at: nfecha('timestamp'),
  usuario: ''
})

/************************************************************************/
// Computed
const dialogTitle = computed(() =>
  isEditMode.value ? 'Editar Menu' : 'Nuevo Menu'
)

const filteredMenus = computed(() => {
  if (!searchQuery.value) {
    return data.value
  }

  const query = searchQuery.value.toLowerCase()
  return data.value.filter((item) => {
    return Object.values(item).some((val) =>
      String(val).toLowerCase().includes(query)
    )
  })
})

/************************************************************************/
// Configuration Function
const datosConfig = async () => {
  const response = await envioElectron('datosarchivo')
  datosJSON.value = response
  link.value = datosJSON.value.VITE_LINKURL
  api.value = datosJSON.value.VITE_LINK_API
  token.value = datosJSON.value.VITE_TOKEN
  patronTelefono.value = datosJSON.value.VITE_PATRON_TELEFONO
  linkImpresora.value = datosJSON.value.VITE_IMPRESORA_LOCAL
  tokenCorto.value = datosJSON.value.VITE_TOKEN_CORTO
  patroncedula.value = datosJSON.value.VITE_PATRON_CEDULA
}

/************************************************************************/
// Lifecycle
onMounted(async () => {
  await datosConfig()
  tokenCifrado.value = await encryptarPassword(token.value, 10)
  await crearTablaSiNoExiste(link.value, api.value, 'menu', camposArray, tokenCifrado.value, toast)
  await campos()
  await fetchAndSetupData()
})

/************************************************************************/
// Get table structure
async function campos() {
  const camposTabla = await arrayToObjetoFromTabla('menu')
  Object.assign(datoscampos, camposTabla)
  datoscampos.created_at = nfecha('timestamp')
  datoscampos.updated_at = nfecha('timestamp')
}

/************************************************************************/
// Methods
async function fetchAndSetupData() {
  loading.value = true
  try {
    const response = await peticionesFetchOffline('getDataAsArray', 'menu')
    const jsonData = response.reverse()
    data.value = jsonData
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: error.message || 'Error al cargar datos',
      life: 3000
    })
  } finally {
    loading.value = false
  }
}

async function openCreateDialog() {
  isEditMode.value = false
  await resetForm()
  dialogVisible.value = true
}

function openEditDialog(data) {
  isEditMode.value = true
  Object.assign(datoscampos, data)
  datoscampos.updated_at = nfecha('timestamp')
  dialogVisible.value = true
}

function closeDialog() {
  dialogVisible.value = false
  resetForm()
}

async function submitForm() {
  saving.value = true
  try {
    if (isEditMode.value) {
      // Update existing record
      datoscampos.updated_at = nfecha('timestamp')
      delete datoscampos.usuario
      const resultado = await peticionesFetchOffline('updateData', 'menu', JSON.stringify(datoscampos))

      if (resultado[0] === 'ok') {
        toast.add({
          severity: 'success',
          summary: 'Éxito',
          detail: 'Menu actualizado correctamente',
          life: 3000
        })
        closeDialog()
        await fetchAndSetupData()
      } else {
        toast.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Error al actualizar Menu',
          life: 3000
        })
      }
    } else {
      // Create new record
      datoscampos.created_at = nfecha('timestamp')
      datoscampos.updated_at = nfecha('timestamp')
      delete datoscampos.usuario

      const resultado = await peticionesFetchOffline('insertData', 'menu', JSON.stringify(datoscampos))

      if (resultado[0] === 'ok') {
          closeDialog()
        Swal.fire({
          title: 'Datos Agregados',
          text: '¿Qué hacemos ahora?',
          icon: 'success',
          showCancelButton: true,
          confirmButtonColor: '#3085d6',
          cancelButtonColor: '#d33',
          confirmButtonText: 'Agregar Otro!',
          cancelButtonText: 'No, Cerrar!'
        }).then(async (result) => {
          if (result.isConfirmed) {
            await resetForm()
            await fetchAndSetupData()
          } else if (result.dismiss === Swal.DismissReason.cancel) {
            closeDialog()
            await fetchAndSetupData()
          }
        })
      } else {
        toast.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Error al crear Menu',
          life: 3000
        })
      }
    }
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: error.message || 'Error en la operación',
      life: 3000
    })
  } finally {
    saving.value = false
  }
}

function confirmDelete(data) {
  Swal.fire({
    title: 'Introduce la contraseña',
    input: 'password',
    inputPlaceholder: 'Contraseña',
    showCancelButton: true,
    confirmButtonText: 'Eliminar',
    cancelButtonText: 'Cancelar',
    confirmButtonColor: '#d33',
    cancelButtonColor: '#3085d6'
  }).then(async (result) => {
    if (result.isConfirmed) {
      const contrasenaIngresada = result.value
      if (contrasenaIngresada === token.value || contrasenaIngresada === tokenCorto.value) {
        await deleteItem(data.id)
      } else {
        toast.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Contraseña incorrecta',
          life: 3000
        })
      }
    } else if (result.dismiss === Swal.DismissReason.cancel) {
      toast.add({
        severity: 'info',
        summary: 'Cancelado',
        detail: 'Datos Seguros',
        life: 3000
      })
    }
  })
}

async function deleteItem(id) {
  try {
    const resultado = await peticionesFetchOffline('deleteEntry', 'menu', id)

    if (resultado[0] === 'ok') {
      toast.add({
        severity: 'success',
        summary: 'Éxito',
        detail: 'Menu eliminado correctamente',
        life: 3000
      })
      await fetchAndSetupData()
    } else {
      toast.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Error al eliminar Menu',
        life: 3000
      })
    }
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: error.message || 'Error al eliminar',
      life: 3000
    })
  }
}

async function resetForm() {
  await campos()
}

function onRowContextMenu(event) {
  currentRowData.value = event.data
  menuRef.value.show(event.originalEvent)
}

function onRowMenuClick(event, data) {
  currentRowData.value = data
  menuRef.value.toggle(event)
}
</script>

<style scoped>
.crud-container {
  max-width: 100%;
}
</style>
