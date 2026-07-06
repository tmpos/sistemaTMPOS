<template>
<main class="min-h-screen bg-gray-50 dark:bg-gray-900">
  <!-- Gradient Header -->
  <div class="bg-gradient-to-r from-indigo-500 to-blue-600 dark:from-indigo-700 dark:to-blue-800 px-6 py-4">
    <div class="container mx-auto">
      <div class="flex justify-between items-center">
        <div>
          <h1 class="text-3xl font-bold text-white flex items-center gap-3">
            <i class="pi pi-pencil"></i>
            Editar PreFacturas
          </h1>
          <p class="text-indigo-100 mt-1">Modifique los campos que desee actualizar</p>
        </div>
        <div class="flex gap-2">
          <!-- Navigation Toolbar -->
          <div class="flex gap-1 /20 rounded-lg p-1">
            <Button
              icon="pi pi-step-backward"
              @click="navigate('primero')"
              title="Primero"
              class="/30 hover:/50 text-white border-0 shadow-md hover:shadow-lg transition-all"
              size="small"
            />
            <Button
              icon="pi pi-chevron-left"
              @click="navigate('anterior')"
              title="Anterior"
              class="/30 hover:/50 text-white border-0 shadow-md hover:shadow-lg transition-all"
              size="small"
            />
            <Button
              icon="pi pi-chevron-right"
              @click="navigate('siguiente')"
              title="Siguiente"
              class="/30 hover:/50 text-white border-0 shadow-md hover:shadow-lg transition-all"
              size="small"
            />
            <Button
              icon="pi pi-step-forward"
              @click="navigate('ultimo')"
              title="Último"
              class="/30 hover:/50 text-white border-0 shadow-md hover:shadow-lg transition-all"
              size="small"
            />
          </div>
          <Button
            label="Volver"
            icon="pi pi-arrow-left"
            as="router-link"
            to="/pre_facturas"
            class=" text-indigo-600 hover:bg-gray-100 border-0 shadow-lg hover:shadow-xl transition-all px-6 py-3 font-semibold"
          />
        </div>
      </div>
    </div>
  </div>

  <div class="container mx-auto px-6 py-6">
    <!-- Loading State -->
    <div v-if="loading" class=" dark:bg-gray-800 rounded-xl shadow-lg p-8">
      <div class="text-center py-8">
        <i class="pi pi-spin pi-spinner text-6xl text-indigo-600 mb-4"></i>
        <p class="text-xl text-gray-600 dark:text-gray-400">Cargando datos...</p>
      </div>
    </div>

    <!-- Form Card -->
    <div v-else class=" dark:bg-gray-800 rounded-xl shadow-lg p-6">
      <form @submit.prevent="funcionActualizar" id="formularioActualizarPreFacturas">

        <!-- INFORMACIÓN GENERAL -->
        <div class="mb-6">
          <div class="flex items-center mb-4 pb-2 border-b-2 border-indigo-500">
            <i class="pi pi-info-circle text-2xl text-indigo-600 dark:text-indigo-400 mr-3"></i>
            <h3 class="text-xl font-bold text-gray-800 dark:text-white">Información General</h3>
          </div>
          <div class="grid grid-cols-12 gap-4">
            <!-- No_orden -->
            <div class="col-span-12 md:col-span-6">
              <label for="no_orden" class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                <i class="pi pi-pencil text-indigo-600 mr-1"></i>
                No_orden
              </label>
              <InputText
                fluid
                type="text"
                v-model="datoscampos.no_orden"
                name="no_orden"
                placeholder="No_orden"
                id="actualizarno_orden"
              />
            </div>

            <!-- Fecha -->
            <div class="col-span-12 md:col-span-6">
              <label for="fecha" class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                <i class="pi pi-calendar text-indigo-600 mr-1"></i>
                Fecha
              </label>
              <InputText
                fluid
                type="text"
                v-model="datoscampos.fecha"
                name="fecha"
                placeholder="Fecha"
                id="actualizarfecha"
              />
            </div>

            <!-- Estado -->
            <div class="col-span-12 md:col-span-6">
              <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2" for="actualizarestado">
                <i class="pi pi-info-circle text-indigo-600 mr-1"></i>
                Estado
              </label>
              <Dropdown
                fluid
                editable
                v-model="datoscampos.estado"
                :options="estadoOptions"
                placeholder="Seleccione..."
                id="actualizarestado"
              />
            </div>

            <!-- Total -->
            <div class="col-span-12 md:col-span-6">
              <label for="total" class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                <i class="pi pi-pencil text-indigo-600 mr-1"></i>
                Total
              </label>
              <InputText
                fluid
                type="text"
                v-model="datoscampos.total"
                name="total"
                placeholder="Total"
                id="actualizartotal"
              />
            </div>

            <!-- No_factura -->
            <div class="col-span-12 md:col-span-6">
              <label for="no_factura" class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                <i class="pi pi-pencil text-indigo-600 mr-1"></i>
                No_factura
              </label>
              <InputText
                fluid
                type="text"
                v-model="datoscampos.no_factura"
                name="no_factura"
                placeholder="No_factura"
                id="actualizarno_factura"
              />
            </div>

            <!-- Cod_cliente -->
            <div class="col-span-12 md:col-span-6">
              <label for="cod_cliente" class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                <i class="pi pi-pencil text-indigo-600 mr-1"></i>
                Cod_cliente
              </label>
              <InputText
                fluid
                type="text"
                v-model="datoscampos.cod_cliente"
                name="cod_cliente"
                placeholder="Cod_cliente"
                id="actualizarcod_cliente"
              />
            </div>

            <!-- Cliente -->
            <div class="col-span-12 md:col-span-6">
              <label for="cliente" class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                <i class="pi pi-pencil text-indigo-600 mr-1"></i>
                Cliente
              </label>
              <InputText
                fluid
                type="text"
                v-model="datoscampos.cliente"
                name="cliente"
                placeholder="Cliente"
                id="actualizarcliente"
              />
            </div>

            <!-- Productos -->
            <div class="col-span-12">
              <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2" for="actualizarproductos">
                <i class="pi pi-align-left text-indigo-600 mr-1"></i>
                Productos
              </label>
              <Textarea
                fluid
                id="actualizarproductos"
                v-model="datoscampos.productos"
                name="productos"
                rows="3"
                placeholder="Productos"
              />
            </div>

            <!-- Nota -->
            <div class="col-span-12">
              <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2" for="actualizarnota">
                <i class="pi pi-align-left text-indigo-600 mr-1"></i>
                Nota
              </label>
              <Textarea
                fluid
                id="actualizarnota"
                v-model="datoscampos.nota"
                name="nota"
                rows="3"
                placeholder="Nota"
              />
            </div>

            <!-- Created_at -->
            <div class="col-span-12">
              <label for="created_at" class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                <i class="pi pi-pencil text-indigo-600 mr-1"></i>
                Created_at
              </label>
              <InputText
                fluid
                type="text"
                v-model="datoscampos.created_at"
                name="created_at"
                placeholder="Created_at"
                id="actualizarcreated_at"
              />
            </div>

            <!-- Updated_at -->
            <div class="col-span-12">
              <label for="updated_at" class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                <i class="pi pi-calendar text-indigo-600 mr-1"></i>
                Updated_at
              </label>
              <InputText
                fluid
                type="text"
                v-model="datoscampos.updated_at"
                name="updated_at"
                placeholder="Updated_at"
                id="actualizarupdated_at"
              />
            </div>
          </div>
        </div>

        <!-- Hidden Fields -->
        <div hidden>
          <InputText v-model="datoscampos.created_at" name="created_at" id="created_at-Actualizador" />
          <InputText v-model="datoscampos.updated_at" name="updated_at" id="updated_at-Actualizador" />
          <InputText v-model="datoscampos.usuario" name="usuario" id="usuario-Actualizador" />
        </div>

        <!-- SUBMIT BUTTON -->
        <div class="flex justify-end gap-3 pt-6 border-t-2 border-gray-200 dark:border-gray-700">
          <Button
            label="Cancelar"
            icon="pi pi-times"
            as="router-link"
            to="/PreFacturass"
            severity="secondary"
            class="bg-gray-500 hover:bg-gray-600 border-0 shadow-md hover:shadow-lg transition-all"
          />
          <Button
            label="Actualizar PreFacturas"
            icon="pi pi-save"
            @click="funcionActualizar"
            class="bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-indigo-600 hover:to-blue-700 border-0 shadow-md hover:shadow-lg transition-all px-8"
          />
        </div>

      </form>
    </div>
  </div>
</main>
<Toast />
</template>

<script setup>
import { reactive, ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import Toast from 'primevue/toast'
import Dropdown from 'primevue/dropdown'
import Textarea from 'primevue/textarea'
import { peticionesFetchOffline, nfecha } from '@/funciones/funciones.js'

/************************************************************************/
// Fields Array
const camposArray = ['no_orden', 'fecha', 'estado', 'total', 'no_factura', 'cod_cliente', 'cliente', 'productos', 'nota', 'created_at', 'updated_at']

// Options for Estado
const estadoOptions = [
    {
      "label": "Creacion",
      "value": "creacion"
    },
    {
      "label": "Despacho",
      "value": "despacho"
    },
    {
      "label": "Produccion",
      "value": "produccion"
    },
    {
      "label": "Facturada",
      "value": "facturada"
    }
  ]


/************************************************************************/
// Composables
const router = useRouter()
const route = useRoute()
const toast = useToast()

/************************************************************************/
// State
const loading = ref(false)
const saving = ref(false)
const todosPreFacturass = ref([])

/************************************************************************/
// Form data
const datoscampos = reactive({
  id: null,
  no_orden: '',
  fecha: '',
  estado: '',
  total: '',
  no_factura: '',
  cod_cliente: '',
  cliente: '',
  productos: '',
  nota: '',
  created_at: '',
  updated_at: '',
  created_at: '',
  updated_at: '',
  usuario: ''
})

/************************************************************************/
// Lifecycle
onMounted(async () => {
  const id = route.params.id
  if (id) {
    await fetchAllData()
    await fetchData(id)
  }
})

/************************************************************************/
// Methods
async function fetchAllData() {
  try {
    const response = await peticionesFetchOffline('getDataAsArray', 'pre_facturas')
    todosPreFacturass.value = response.reverse()
  } catch (error) {
    console.error('Error loading all records:', error)
  }
}

async function fetchData(id) {
  loading.value = true
  try {
    const response = await peticionesFetchOffline('getDataAsArray', 'pre_facturas')
    const jsonData = response.reverse()
    const item = jsonData.find((record) => record.id == id)

    if (item) {
      Object.assign(datoscampos, item)
    } else {
      toast.add({
        severity: 'error',
        summary: 'Error',
        detail: 'No se encontró el registro',
        life: 3000
      })
      router.push({ path: '/PreFacturass' })
    }
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

async function navigate(action) {
  const currentIndex = todosPreFacturass.value.findIndex((item) => item.id == route.params.id)
  if (currentIndex === -1) return

  let newIndex = currentIndex
  switch (action) {
    case 'primero':
      newIndex = 0
      break
    case 'anterior':
      newIndex = currentIndex > 0 ? currentIndex - 1 : 0
      break
    case 'siguiente':
      newIndex = currentIndex + 1 < todosPreFacturass.value.length ? currentIndex + 1 : currentIndex
      break
    case 'ultimo':
      newIndex = todosPreFacturass.value.length - 1
      break
  }

  if (newIndex !== currentIndex) {
    Object.assign(datoscampos, todosPreFacturass.value[newIndex])
    router.push({ path: `/editarPreFacturas/${todosPreFacturass.value[newIndex].id}` })
  }
}

async function funcionActualizar(e) {
  if (e) e.preventDefault()
  saving.value = true

  try {
    // Update timestamp
    datoscampos.updated_at = nfecha('timestamp')

    const datosEnviar = JSON.parse(JSON.stringify(datoscampos))
    const envioDatos = await peticionesFetchOffline('updateData', 'pre_facturas', JSON.stringify(datosEnviar))

    if (envioDatos[0] == 'ok') {
      toast.add({
        severity: 'success',
        summary: 'Éxito',
        detail: 'Datos actualizados correctamente',
        life: 3000
      })

      // Refresh all records for navigation
      await fetchAllData()
    } else {
      toast.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Error al actualizar los datos',
        life: 3000
      })
    }
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: error.message || 'Error al actualizar el registro',
      life: 3000
    })
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
/* Estilos personalizados */
</style>
