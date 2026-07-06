
<script setup>
import { ref, onMounted, nextTick, watchEffect } from 'vue';
import { useToast } from "primevue/usetoast";
import { useRouter, useRoute } from 'vue-router';
const router = useRouter();
const route = useRoute(); 
import { 
nfecha, 
arrayToObjetoFromTabla, 
peticionesFetch,
obtenerIdsSeleccionados, 
crearTablaSiNoExiste,
encryptarPassword,
peticionesFetchOffline,
buscadorArrayObjeto,
envioElectron,
generarCodigoUnico } from '@/funciones/funciones.js';
import Swal from 'sweetalert2'
const toast = useToast();
/************************************************************************/
import TablaJSON from '@/components/TablaJSON.vue'

/************************************************************************/
import flatPickr from 'vue-flatpickr-component';
import 'flatpickr/dist/flatpickr.css';
/************************************************************************/
  const basic = ref({
    dateFormat: 'd/m/Y',
  });
/************************************************************************/
import {useDatosEmpresa} from '@/stores'
const datosEmpresa = useDatosEmpresa();
const link = ref('');
const api = ref('');
const token = ref('');
const patronTelefono = ref('');
const linkImpresora = ref('');
const patroncedula = ref('');
const tokenCifrado = ref('');
const tokenCorto = ref('');
const datosJSON = ref([]);
/************************************************************************/
const datoscamposPrueba = ref({})
const codigoUnico = ref(generarCodigoUnico());
const fecha = ref(nfecha('fecha'));
const position = "top";
/************************************************************************/
async function campos() {
  const campos = await arrayToObjetoFromTabla('prueba');
  datoscamposPrueba.value = campos;

}
/************************************************************************/
const datosConfig = async()=>{
    const response = await envioElectron('datosarchivo');
    datosJSON.value = response;
    link.value = datosJSON.value.VITE_LINKURL;
    api.value = datosJSON.value.VITE_LINK_API;
    token.value = datosJSON.value.VITE_TOKEN;
    patronTelefono.value = datosJSON.value.VITE_PATRON_TELEFONO;
    linkImpresora.value = datosJSON.value.VITE_IMPRESORA_LOCAL;
    tokenCorto.value = datosJSON.value.VITE_TOKEN_CORTO;
    patroncedula.value = datosJSON.value.VITE_PATRON_CEDULA;
}
/************************************************************************/
onMounted(async() => {
await datosConfig()
tokenCifrado.value = await encryptarPassword(token.value, 10);
await campos()
});
/************************************************************************/
async function enviarDatos(event) {
    event.preventDefault();
  const url = link.value+api.value+"/insertar/prueba";
  if (!datoscamposPrueba.value) {
    toast.add({ severity: 'error', summary: 'Error', detail: 'Datos incompletos, no se puede Enviar.', life: 3000 });
    return;
  }
  if (datoscamposPrueba.value.hasOwnProperty('created_at')) {
     datoscamposPrueba.value.created_at = nfecha('timestamp')
     datoscamposPrueba.value.updated_at = nfecha('timestamp')
    }

  const datosEnviar = JSON.parse(JSON.stringify(datoscamposPrueba.value));
  const envioDatos = await peticionesFetchOffline('insertData','prueba', JSON.stringify(datosEnviar));
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
      fetchAndSetupData()
} else if (result.dismiss === Swal.DismissReason.cancel) {
    router.push({ path: `/prueba` });
  }
})
  }else{
    toast.add({ severity: 'error', summary: 'Error', detail: 'Fallo al Agregar los datos.', life: 3000 });
  }
}
/************************************************************************/





/************************************************************************/
</script>
<template>
<main class="content-wrapper">
  <div class="w-full px-4 mt-5 card">
<Fieldset legend="Datos de Prueba">
      <div class="flex">
        <Button as="router-link" icon="pi pi-home" to="/prueba" />
      </div>
</Fieldset>

<section>
<Fieldset legend="Campos">
    <form id="formularioGenerar" action="" method="">
         <div class="box-body">
          <div class="grid grid-cols-12 gap-4 mt-4 text-blue-600" id="campos">

<div class="col-span-12 sm:col-span-12 md:col-span-12 lg:col-span-12 xl:col-span-12 2xl:col-span-12">
                    <label for="nombre" class="block text-sm font-medium text-gray-700 dark:text-gray-400">NOMBRE</label>
                    <InputText type="text" fluid class=" "  v-mayuscula v-model="datoscamposPrueba.nombre" placeholder="nombre" name="crearnombre" id="nombre" />
                </div>
<div class="col-span-12 sm:col-span-12 md:col-span-6 lg:col-span-6 xl:col-span-6 2xl:col-span-6">
                    <label for="telefono" class="block text-sm font-medium text-gray-700 dark:text-gray-400">TELEFONO</label>
                    <InputText type="text" fluid class=" "  v-model="datoscamposPrueba.telefono" placeholder="telefono" name="creartelefono" id="telefono" />
                </div>
<div class="col-span-12 sm:col-span-12 md:col-span-6 lg:col-span-6 xl:col-span-6 2xl:col-span-6">
                    <label for="email" class="block text-sm font-medium text-gray-700 dark:text-gray-400">EMAIL</label>
                    <InputText type="text" fluid class=" "  v-model="datoscamposPrueba.email" placeholder="email" name="crearemail" id="email" />
                </div>
<div class="col-span-12 sm:col-span-12 md:col-span-12 lg:col-span-12 xl:col-span-12 2xl:col-span-12">
                    <label  class="block text-sm font-medium text-gray-700 dark:text-gray-400" for="direccion">DIRECCION</label>
                   <Textarea id="creardireccion" rows="3" fluid class="form-textarea w-full "  v-model="datoscamposPrueba.direccion" placeholder="Direccion" />
                </div>

<div class="form-group col-span-6" hidden>
<label for="created_atAgregarDatos">CREATED_AT</label>
<input type="input" v-model="datoscamposPrueba.created_at" name="created_at"  class="form-control " id="created_atAgregarDatos"  placeholder="created_at" maxlength="">
</div>
<div class="form-group col-span-6" hidden>
<label for="updated_atAgregarDatos">UPDATED_AT</label>
<input type="input" v-model="datoscamposPrueba.updated_at" name="updated_at"  class="form-control " id="updated_atAgregarDatos"  placeholder="updated_at" maxlength="">
</div>

<div class="form-group col-span-12" hidden>
<label for="usuarioAgregarDatos">USUARIO</label>
<input type="input" v-model="datoscamposPrueba.usuario" name="usuario"  class="form-control " id="usuarioAgregarDatos"  placeholder="usuario" maxlength="250">
</div>

<div class="form-group col-span-12 mb-5 mt-5">
  <Button label="Enviar Datos" fluid  @click="enviarDatos" />
</div>

  </div>
  </div>
   </form>
</Fieldset>
</section>
  </div>
   </main>
<Toast />
</template>
<style scoped>
</style>

