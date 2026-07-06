<template>
<main class="min-h-screen bg-gray-50 dark:bg-gray-900">
  <!-- Gradient Header -->
  <div class="bg-gradient-to-r from-indigo-500 to-blue-600 dark:from-indigo-700 dark:to-blue-800 px-6 py-4">
    <div class="container mx-auto">
      <div class="flex justify-between items-center">
        <div>
          <h1 class="text-3xl font-bold text-white flex items-center gap-3">
            <i class="pi pi-plus-circle"></i>
            Crear PreFacturas
          </h1>
          <p class="text-indigo-100 mt-1">Complete el formulario para agregar un nuevo registro</p>
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

  <div class="container mx-auto px-6 py-6">
    <!-- Form Card -->
    <div class=" dark:bg-gray-800 rounded-xl shadow-lg p-6">
      <form @submit.prevent="enviarDatos" id="formularioCrearPreFacturas">

        <!-- INFORMACIÓN GENERAL -->
        <div class="mb-6">
          <div class="flex items-center mb-4 pb-2 border-b-2 border-indigo-500">
            <i class="pi pi-info-circle text-2xl text-indigo-600 dark:text-indigo-400 mr-3"></i>
            <h3 class="text-xl font-bold text-gray-800 dark:text-white">Información General</h3>
          </div>
          <div class="grid grid-cols-12 gap-4" id="campos">
            <!-- No_orden -->
            <div class="col-span-12 md:col-span-6 lg:col-span-3">
              <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2" for="crearno_orden">
                <i class="pi pi-pencil text-indigo-600 mr-1"></i>
                No_orden
              </label>
              <InputText
                type="text"
                fluid
                v-model="datoscampos.no_orden"
                placeholder="Ingrese no_orden"
                name="crearno_orden"
                id="crearno_orden"
              />
            </div>

            <!-- Fecha -->
            <div class="col-span-12 md:col-span-6 lg:col-span-2">
              <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2" for="crearfecha">
                <i class="pi pi-calendar text-indigo-600 mr-1"></i>
                Fecha
              </label>
              <InputText
                type="text"
                fluid
                v-model="datoscampos.fecha"
                placeholder="Ingrese fecha"
                name="crearfecha"
                id="crearfecha"
              />
            </div>

            <!-- Estado -->
            <div class="col-span-12 md:col-span-6 lg:col-span-2">
              <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2" for="crearestado">
                <i class="pi pi-info-circle text-indigo-600 mr-1"></i>
                Estado
              </label>
              <Dropdown
                v-model="datoscampos.estado"
                :options="estadoOptions"
                placeholder="Seleccione..."
                fluid
                id="crearestado"
              />
            </div>

            <!-- Total -->
            <div class="col-span-12 md:col-span-6 lg:col-span-2">
              <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2" for="creartotal">
                <i class="pi pi-pencil text-indigo-600 mr-1"></i>
                Total
              </label>
              <InputText
                type="text"
                fluid
                v-model="datoscampos.total"
                placeholder="Ingrese total"
                name="creartotal"
                id="creartotal"
              />
            </div>

            <!-- No_factura -->
            <div class="col-span-12 md:col-span-6 lg:col-span-3">
              <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2" for="crearno_factura">
                <i class="pi pi-pencil text-indigo-600 mr-1"></i>
                No_factura
              </label>
              <InputText
                type="text"
                fluid
                v-model="datoscampos.no_factura"
                placeholder="Ingrese no_factura"
                name="crearno_factura"
                id="crearno_factura"
              />
            </div>

            <!-- Cod_cliente -->
            <div class="col-span-12 md:col-span-6">
              <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2" for="crearcod_cliente">
                <i class="pi pi-pencil text-indigo-600 mr-1"></i>
                Cod_cliente
              </label>
              <InputText
                type="text"
                fluid
                v-model="datoscampos.cod_cliente"
                placeholder="Ingrese cod_cliente"
                name="crearcod_cliente"
                id="crearcod_cliente"
              />
            </div>

            <!-- Cliente -->
            <div class="col-span-12 md:col-span-6">
              <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2" for="crearcliente">
                <i class="pi pi-pencil text-indigo-600 mr-1"></i>
                Cliente
              </label>
              <InputText
                type="text"
                fluid
                v-model="datoscampos.cliente"
                placeholder="Ingrese cliente"
                name="crearcliente"
                id="crearcliente"
              />
            </div>

            <!-- Productos -->
            <div class="col-span-12">
              <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2" for="crearproductos">
                <i class="pi pi-align-left text-indigo-600 mr-1"></i>
                Productos
              </label>
              <Textarea
                id="crearproductos"
                rows="3"
                fluid
                v-model="datoscampos.productos"
                placeholder="Ingrese productos..."
                name="crearproductos"
              />
            </div>

            <!-- Nota -->
            <div class="col-span-12">
              <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2" for="crearnota">
                <i class="pi pi-align-left text-indigo-600 mr-1"></i>
                Nota
              </label>
              <Textarea
                id="crearnota"
                rows="3"
                fluid
                v-model="datoscampos.nota"
                placeholder="Ingrese nota..."
                name="crearnota"
              />
            </div>

            <!-- Created_at -->
            <div class="col-span-12">
              <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2" for="crearcreated_at">
                <i class="pi pi-pencil text-indigo-600 mr-1"></i>
                Created_at
              </label>
              <InputText
                type="text"
                fluid
                v-model="datoscampos.created_at"
                placeholder="Ingrese created_at"
                name="crearcreated_at"
                id="crearcreated_at"
              />
            </div>

            <!-- Updated_at -->
            <div class="col-span-12">
              <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2" for="crearupdated_at">
                <i class="pi pi-calendar text-indigo-600 mr-1"></i>
                Updated_at
              </label>
              <InputText
                type="text"
                fluid
                v-model="datoscampos.updated_at"
                placeholder="Ingrese updated_at"
                name="crearupdated_at"
                id="crearupdated_at"
              />
            </div>
          </div>
        </div>

        <!-- Hidden Fields -->
        <div hidden>
          <input type="input" v-model="datoscampos.created_at" name="created_at" id="created_atAgregarDatos">
          <input type="input" v-model="datoscampos.updated_at" name="updated_at" id="updated_atAgregarDatos">
          <input type="input" v-model="datoscampos.usuario" name="usuario" id="usuarioAgregarDatos">
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
            label="Guardar PreFacturas"
            icon="pi pi-save"
            @click="enviarDatos"
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
import { useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import Toast from 'primevue/toast'
import Dropdown from 'primevue/dropdown'
import Textarea from 'primevue/textarea'
import Swal from 'sweetalert2'
import { peticionesFetchOffline, nfecha, arrayToObjetoFromTabla } from '@/funciones/funciones.js'

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
const toast = useToast()

/************************************************************************/
// State
const saving = ref(false)

/************************************************************************/
// Form data
const datoscampos = reactive({
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
  created_at: nfecha('timestamp'),
  updated_at: nfecha('timestamp'),
  usuario: ''
})

/************************************************************************/
// Lifecycle
onMounted(async () => {
  await campos()
})

/************************************************************************/
// Get table structure
async function campos() {
  const camposTabla = await arrayToObjetoFromTabla('pre_facturas')
  Object.assign(datoscampos, camposTabla)
  datoscampos.created_at = nfecha('timestamp')
  datoscampos.updated_at = nfecha('timestamp')
}

/************************************************************************/
// Methods
async function enviarDatos(e) {
  if (e) e.preventDefault()
  saving.value = true

  try {
    delete datoscampos.usuario
    datoscampos.estado = datoscampos.estado.value
    const datosEnviar = JSON.parse(JSON.stringify(datoscampos))
    const envioDatos = await peticionesFetchOffline('insertData', 'pre_facturas', JSON.stringify(datosEnviar))

    if (envioDatos[0] == 'ok') {
      toast.add({
        severity: 'success',
        summary: 'Éxito',
        detail: 'Datos agregados correctamente',
        life: 3000
      })

      // SweetAlert dialog
      Swal.fire({
        title: "Datos Agregados",
        text: "¿Qué hacemos ahora?",
        icon: "success",
        showCancelButton: true,
        confirmButtonText: "Agregar Otro!",
        cancelButtonText: "No, Regresar al Inicio!",
      }).then((result) => {
        if (result.isConfirmed) {
          // Reset form
          Object.keys(datoscampos).forEach(key => {
            if (key !== 'created_at' && key !== 'updated_at' && key !== 'usuario') {
              datoscampos[key] = ''
            }
          })
          datoscampos.created_at = nfecha('timestamp')
          datoscampos.updated_at = nfecha('timestamp')
        } else {
          router.push({ path: '/pre_facturas' })
        }
      })
    } else {
      toast.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Error al guardar los datos',
        life: 3000
      })
    }
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: error.message || 'Error al crear el registro',
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
