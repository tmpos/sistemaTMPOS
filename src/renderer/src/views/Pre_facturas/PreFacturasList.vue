<template>
<main class="min-h-screen bg-gray-50 dark:bg-gray-900">
  <!-- Gradient Header -->
  <div class="bg-gradient-to-r from-indigo-500 to-blue-600 dark:from-indigo-700 dark:to-blue-800 px-6 py-4">
    <div class="container mx-auto">
      <div class="flex justify-between items-center">
        <div>
          <h1 class="text-3xl font-bold text-white flex items-center gap-3">
            <i class="pi pi-table"></i>
            PreFacturass
          </h1>
          <p class="text-indigo-100 mt-1">Gestión completa de pre_facturas</p>
        </div>
        <Button
          label="Nuevo PreFacturas"
          icon="pi pi-plus"
          @click="navigateToCreate"
          class=" text-indigo-600 hover:bg-gray-100 border-0 shadow-lg hover:shadow-xl transition-all px-6 py-3 font-semibold"
        />
      </div>
    </div>
  </div>

  <div class="container mx-auto px-6 py-6">
    <!-- Stats Cards -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <div class=" dark:bg-gray-800 rounded-xl shadow-md px-4 py-3 border-l-4 border-blue-500">
        <p class="text-xs text-gray-500 dark:text-gray-400 uppercase">Total PreFacturass</p>
        <p class="text-2xl font-bold text-gray-800 dark:text-white">{{ data.length }}</p>
      </div>
      <div class=" dark:bg-gray-800 rounded-xl shadow-md px-4 py-3 border-l-4 border-green-500">
        <p class="text-xs text-gray-500 dark:text-gray-400 uppercase">Registros Activos</p>
        <p class="text-2xl font-bold text-gray-800 dark:text-white">{{ data.length }}</p>
      </div>
      <div class=" dark:bg-gray-800 rounded-xl shadow-md px-4 py-3 border-l-4 border-purple-500">
        <p class="text-xs text-gray-500 dark:text-gray-400 uppercase">Última Actualización</p>
        <p class="text-2xl font-bold text-gray-800 dark:text-white">{{ nfecha('fecha') }}</p>
      </div>
    </div>

    <!-- DataTable Card -->
    <div class=" dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
      <!-- Toolbar -->
      <div class="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <div class="flex justify-between items-center">
          <h2 class="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
            <i class="pi pi-list text-indigo-600"></i>
            Lista de PreFacturass
          </h2>
          <span class="p-input-icon-left">
            <i class="pi pi-search" />
            <InputText
              v-model="searchQuery"
              placeholder="Buscar..."
              class="w-80"
            />
          </span>
        </div>
      </div>

      <!-- Table -->
      <DataTable
        :value="filteredPreFacturass"
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

      
        <!-- Columns -->
        <Column
          field="no_orden"
          header="No_orden"
          sortable
          style="min-width: 10rem"
        />
        <Column
          field="fecha"
          header="Fecha"
          sortable
          style="min-width: 10rem"
        />
        <Column
          field="estado"
          header="Estado"
          sortable
          style="min-width: 10rem"
        />
        <Column
          field="total"
          header="Total"
          sortable
          style="min-width: 10rem"
        />
        <Column
          field="no_factura"
          header="No_factura"
          sortable
          style="min-width: 10rem"
        />
        <Column
          field="cod_cliente"
          header="Cod_cliente"
          sortable
          style="min-width: 10rem"
        />


        <template #empty>
          <div class="text-center py-8">
            <i class="pi pi-inbox text-6xl text-gray-400 mb-4"></i>
            <p class="text-gray-600 dark:text-gray-400">No hay registros disponibles</p>
            <Button
              label="Crear Primero"
              icon="pi pi-plus"
              @click="navigateToCreate"
              class="mt-4"
            />
          </div>
        </template>
      </DataTable>
    </div>
  </div>

  <!-- Context Menu -->
  <Menu ref="menuRef" :model="menuItems" :popup="true" />

  <!-- View Details Dialog -->
  <Dialog
    v-model:visible="detailsDialogVisible"
    :header="`Detalles de PreFacturas`"
    :modal="true"
    :style="{ width: '50vw' }"
    :breakpoints="{ '960px': '75vw', '640px': '95vw' }"
    class="rounded-2xl"
  >
    <template #header>
      <div class="flex items-center gap-3">
        <div class="p-3 bg-indigo-100 dark:bg-indigo-900 rounded-xl">
          <i class="pi pi-info-circle text-2xl text-indigo-600 dark:text-indigo-300"></i>
        </div>
        <div>
          <h3 class="text-xl font-bold text-gray-800 dark:text-white">Detalles de PreFacturas</h3>
          <p class="text-sm text-gray-600 dark:text-gray-400">Información completa del registro</p>
        </div>
      </div>
    </template>

    <div v-if="currentItem" class="grid grid-cols-1 gap-4 py-4">
      <div>
        <label class="font-semibold text-gray-700 dark:text-gray-300 text-sm uppercase tracking-wide">No_orden</label>
        <p class="text-gray-900 dark:text-gray-100 mt-1 text-lg">{{ currentItem.no_orden || '-' }}</p>
      </div>
      <div>
        <label class="font-semibold text-gray-700 dark:text-gray-300 text-sm uppercase tracking-wide">Fecha</label>
        <p class="text-gray-900 dark:text-gray-100 mt-1 text-lg">{{ currentItem.fecha || '-' }}</p>
      </div>
      <div>
        <label class="font-semibold text-gray-700 dark:text-gray-300 text-sm uppercase tracking-wide">Estado</label>
        <p class="text-gray-900 dark:text-gray-100 mt-1 text-lg">{{ currentItem.estado || '-' }}</p>
      </div>
      <div>
        <label class="font-semibold text-gray-700 dark:text-gray-300 text-sm uppercase tracking-wide">Total</label>
        <p class="text-gray-900 dark:text-gray-100 mt-1 text-lg">{{ currentItem.total || '-' }}</p>
      </div>
      <div>
        <label class="font-semibold text-gray-700 dark:text-gray-300 text-sm uppercase tracking-wide">No_factura</label>
        <p class="text-gray-900 dark:text-gray-100 mt-1 text-lg">{{ currentItem.no_factura || '-' }}</p>
      </div>
      <div>
        <label class="font-semibold text-gray-700 dark:text-gray-300 text-sm uppercase tracking-wide">Cod_cliente</label>
        <p class="text-gray-900 dark:text-gray-100 mt-1 text-lg">{{ currentItem.cod_cliente || '-' }}</p>
      </div>
      <div>
        <label class="font-semibold text-gray-700 dark:text-gray-300 text-sm uppercase tracking-wide">Cliente</label>
        <p class="text-gray-900 dark:text-gray-100 mt-1 text-lg">{{ currentItem.cliente || '-' }}</p>
      </div>
      <div>
        <label class="font-semibold text-gray-700 dark:text-gray-300 text-sm uppercase tracking-wide">Productos</label>
        <p class="text-gray-900 dark:text-gray-100 mt-1 text-lg">{{ currentItem.productos || '-' }}</p>
      </div>
      <div>
        <label class="font-semibold text-gray-700 dark:text-gray-300 text-sm uppercase tracking-wide">Nota</label>
        <p class="text-gray-900 dark:text-gray-100 mt-1 text-lg">{{ currentItem.nota || '-' }}</p>
      </div>
      <div>
        <label class="font-semibold text-gray-700 dark:text-gray-300 text-sm uppercase tracking-wide">Created_at</label>
        <p class="text-gray-900 dark:text-gray-100 mt-1 text-lg">{{ currentItem.created_at || '-' }}</p>
      </div>
      <div>
        <label class="font-semibold text-gray-700 dark:text-gray-300 text-sm uppercase tracking-wide">Updated_at</label>
        <p class="text-gray-900 dark:text-gray-100 mt-1 text-lg">{{ currentItem.updated_at || '-' }}</p>
      </div>
    </div>
  </Dialog>
</main>
<Toast />
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import Button from 'primevue/button'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import InputText from 'primevue/inputtext'
import Dialog from 'primevue/dialog'
import Menu from 'primevue/menu'
import Toast from 'primevue/toast'
import Swal from 'sweetalert2'
import {
  peticionesFetchOffline,
  nfecha,
  arrayToObjetoFromTabla,
  crearTablaSiNoExiste,
  encryptarPassword,
  envioElectron,
  enviarDatosLocalStorage,
  obtenerIdsSeleccionados
} from '@/funciones/funciones.js'

/************************************************************************/
// Fields Array - Nombres de los campos de la tabla
const camposArray = ['no_orden', 'fecha', 'estado', 'total', 'no_factura', 'cod_cliente', 'cliente', 'productos', 'nota', 'created_at', 'updated_at']

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

/************************************************************************/
// Composables
const router = useRouter()
const toast = useToast()

/************************************************************************/
// State
const data = ref([])
const currentItem = ref(null)
const currentRowData = ref(null)
const loading = ref(false)
const searchQuery = ref('')
const detailsDialogVisible = ref(false)
const selectedItems = ref([])
const menuRef = ref()
const datosEmpresaA = JSON.stringify(enviarDatosLocalStorage())
/************************************************************************/
// Menu Items
const menuItems = ref([
  {
    label: 'Ver Detalles',
    icon: 'pi pi-eye',
    command: () => {
      if (currentRowData.value) viewDetails(currentRowData.value)
    }
  },
  {
    label: 'Editar',
    icon: 'pi pi-pencil',
    command: () => {
      if (currentRowData.value) navigateToEdit(currentRowData.value)
    }
  },
  {
    label: 'Imprimir Ticket',
    icon: 'pi pi-print',
    command: async() => {
      if (currentRowData.value) await window.electron.ipcRenderer.invoke('ticketprefactura', JSON.stringify(currentRowData.value), datosEmpresaA);
    }
  },
  {
    label: 'PDF',
    icon: 'pi pi-print',
    command: async() => {
      if (currentRowData.value) {

            const datosCliente = await peticionesFetchOffline('getDataByField', 'clientes', 'codigo', currentRowData.value.cod_cliente);
            const clienteLimpio = {
              codigo: datosCliente?.codigo || '',
              nombre: datosCliente?.nombre || currentRowData.value.cliente,
              telefono: datosCliente?.telefono || '',
              direccion: datosCliente?.direccion || '',
              rnc: datosCliente?.rnc || '',
              email: datosCliente?.email || ''
            };
        
        await window.electron.ipcRenderer.invoke('prefacturaPDF', JSON.stringify(currentRowData.value), JSON.stringify(clienteLimpio), datosEmpresaA);
      }
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
// Computed
const filteredPreFacturass = computed(() => {
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
  await crearTablaSiNoExiste(link.value, api.value, 'pre_facturas', camposArray, tokenCifrado.value, toast)
  await fetchAndSetupData()
})

/************************************************************************/
// Methods
async function fetchAndSetupData() {
  loading.value = true
  try {
    const response = await peticionesFetchOffline('getDataAsArray', 'pre_facturas')
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

function navigateToCreate() {
  router.push({ path: '/crearPreFacturas' })
}

function navigateToEdit(data) {
  router.push({ path: `/editarPreFacturas/${data.id}` })
}

function viewDetails(data) {
  currentItem.value = data
  detailsDialogVisible.value = true
}

function onRowContextMenu(event) {
  currentRowData.value = event.data
  menuRef.value.show(event.originalEvent)
}

function onRowMenuClick(event, data) {
  currentRowData.value = data
  menuRef.value.show(event)
}

function confirmDelete(data) {
  Swal.fire({
    title: '¿Está seguro?',
    text: 'Esta acción no se puede deshacer',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#d33',
    cancelButtonColor: '#3085d6',
    confirmButtonText: 'Sí, eliminar',
    cancelButtonText: 'Cancelar'
  }).then((result) => {
    if (result.isConfirmed) {
      deleteItem(data.id)
    }
  })
}

async function deleteItem(id) {
  try {
    await peticionesFetchOffline('deleteData', 'pre_facturas', id)

    toast.add({
      severity: 'success',
      summary: 'Éxito',
      detail: 'PreFacturas eliminado correctamente',
      life: 3000
    })
    fetchAndSetupData()
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: error.message || 'Error al eliminar',
      life: 3000
    })
  }
}
</script>

<style scoped>
/* Estilos personalizados */
</style>
