<template>
  <div class="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
    <h2 class="text-2xl font-bold mb-6">Registro de Clientes</h2>
    <Card class="w-full max-w-md shadow-lg rounded-lg p-6 bg-white">
          <template #content>
<form @submit.prevent="handleSubmit" class="space-y-4">
          <div class="space-y-4">
            <div>
              <label for="nombre" class="block text-sm font-medium text-gray-700">Nombre</label>
              <InputText id="nombre" v-model="cliente.nombre" type="text" required class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" />
            </div>
            <div>
              <label for="telefono" class="block text-sm font-medium text-gray-700">Teléfono</label>
              <InputText id="telefono" v-model="cliente.telefono" type="text" required class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" />
            </div>
            <div>
              <label for="direccion" class="block text-sm font-medium text-gray-700">Dirección</label>
              <Textarea id="direccion" v-model="cliente.direccion" rows="3" required class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" />
            </div>

            <Button label="Registrar" type="submit" class="w-full bg-indigo-600 text-white py-2 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500" />

            <!-- Nuevo botón para ver catálogo -->
            <Button label="Ver Catálogo" type="button" @click="verCatalogo" class="w-full bg-green-600 text-white py-2 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500" />

          </div>
        </form>
          </template>
    </Card>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick, watchEffect } from 'vue';
import {useDatosEmpresa} from '../../stores'
const datosEmpresa = useDatosEmpresa();
import { useToast } from "primevue/usetoast";
import { useRouter, useRoute } from 'vue-router';
const router = useRouter();
const route = useRoute();
import {enviarDatosPorPost,
  nfecha,
  asientoDiario,
  decimales,
  transformarFechaTimestamp,
  peticiones,
  formatearFecha,
  generadorCodigo,
  arrayToObjetoFromTabla,
  peticionesFetch,
  encryptarPassword,
  permisosPagina,
  envioElectron,
  convertirAFechaTimestamp,
    esFechaEnRango,
  mensajetoast,
  generarCodigoUnico,
  enviarDatosLocalStorage,
  verificaAutentificado,
  lasMayusculas} from '../../funciones/funciones.js';
  import Swal from 'sweetalert2'
const toast = useToast();
/**********************************************************/
const link = ref('');
const api = ref('');
const token = ref('');
const patronTelefono = ref('');
const linkImpresora = ref('');
const patroncedula = ref('');
const tokenCifrado = ref('');
const tokenCorto = ref('');
/**********************************************************/
const cliente = ref({
  nombre: '',
  telefono: '',
  direccion: ''
});
/**********************************************************/
onMounted(async() => {
const datosJSON = await envioElectron('datosarchivo');
link.value = datosJSON.VITE_LINKURL;
api.value = datosJSON.VITE_LINK_API;
token.value = datosJSON.VITE_TOKEN;
patronTelefono.value = datosJSON.VITE_PATRON_TELEFONO;
linkImpresora.value = datosJSON.VITE_IMPRESORA_LOCAL;
patroncedula.value = datosJSON.VITE_PATRON_CEDULA;
tokenCifrado.value = await encryptarPassword(token.value, 10);

});
/**********************************************************/

const handleSubmit = async() => {
    const jsonData = await arrayToObjetoFromTabla(link.value+api.value,tokenCifrado.value,'clientes');
    jsonData.codigo = generarCodigoUnico();
    jsonData.activo = 'ON';
    jsonData.genero = 'HOMBRE';
    jsonData.estado_civil = 'SOLTERO';
    jsonData.precio_fijado = 'Normal';
    jsonData.limite_credito = '1';
    jsonData.nombre = cliente.value.nombre
    jsonData.telefono = cliente.value.telefono
    jsonData.direccion = cliente.value.direccion

  const url = link.value+api.value+"/insertar/clientes";
  if (!jsonData) {
    toast.add({ severity: 'error', summary: 'Error', detail: 'Datos incompletos, no se puede Enviar.', life: 3000 });
    return;
  }

  if (jsonData.hasOwnProperty('created_at')) {
     jsonData.created_at = nfecha('timestamp')
     jsonData.updated_at = nfecha('timestamp')
    }
  const envioDatos = await enviarDatosPorPost(url, jsonData,tokenCifrado.value);
  if (envioDatos[0] == 'ok') {
     toast.add({ severity: 'success', summary: 'Éxito', detail: 'Datos Agregados con éxito.', life: 3000 });
Swal.fire({
  title: "Datos Agregados",
  text: "Que hacemos ahora?",
  icon: "warning",
  showCancelButton: true,
  confirmButtonText: "Agregar Otro!",
  cancelButtonText: "No, Regresar al Inicio!",
 }).then(async(result) => {
  if (result.isConfirmed) {
} else if (result.dismiss === Swal.DismissReason.cancel) {
    router.push({ path: `/catalogo` });
  }
})
  }else{
    toast.add({ severity: 'error', summary: 'Error', detail: 'Fallo al Agregar los datos.', life: 3000 });
  }

  // Limpiar el formulario después del envío
  cliente.value = {
    nombre: '',
    telefono: '',
    direccion: ''
  };
};
</script>
