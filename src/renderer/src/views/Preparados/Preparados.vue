<script setup>
import { ref, onMounted, nextTick, watchEffect } from 'vue';
import router from '../../router';
import axios from 'axios';
import {enviarDatosPorPost,
  eliminarDatos, 
  obtenerIdsSeleccionados,
  borrarTodoslosDatos,
  lenguajeDataTable,
  nfecha,
  arrayToObjetoFromTabla,
  peticionesFetch,
  encryptarPassword,
  envioElectron,
  mensajetoast,
  lasMayusculas} from '../../funciones/funciones.js';
  import bcrypt from 'bcryptjs';
import Swal from 'sweetalert2'
import { useToast } from "primevue/usetoast";
const toast = useToast();
/************************************************************************/
import config from '../../../../../resources/config.json';
/************************************************************************/
import {useDatosEmpresa} from '../../stores'
const datosEmpresa = useDatosEmpresa();
const production = config.VITE_PRODUCTION;
const link = ref(config.VITE_LINKURL);
const api = ref(config.VITE_LINK_API);
const token = ref(config.VITE_TOKEN);
const patronTelefono = ref(config.VITE_PATRON_TELEFONO);
const linkImpresora = ref(config.VITE_IMPRESORA_LOCAL);
const patroncedula = ref(config.VITE_PATRON_CEDULA);
const tokenCifrado = ref(null);
/************************************************************************/
document.body.classList.add('sidebar-close');
/************************************************************************/
watchEffect(() => {
    //Aqui para vigilar eventos
});
/************************************************************************/
/************************************************************************/
onMounted(async() => {
if (production == 'false') {
const datosJSON = await envioElectron('datosarchivo');
link.value = datosJSON.VITE_LINKURL;
api.value = datosJSON.VITE_LINK_API;
token.value = datosJSON.VITE_TOKEN;
patronTelefono.value = datosJSON.VITE_PATRON_TELEFONO;
linkImpresora.value = datosJSON.VITE_IMPRESORA_LOCAL;
}
    if (!datosEmpresa.empresa.nombre) {
    await datosEmpresa.inicializarDatosEmpresa(link.value+api.value);
  }

tokenCifrado.value = await encryptarPassword(token.value, 10);
});
/************************************************************************/
</script>
<template>
<main class="content-wrapper">
  <div class="w-full px-4 mt-5">
    <div class="grid grid-cols-12 gap-4">
      <div class="md:col-span-12">
        <fieldset class="border p-3 rounded mb-2">
          <legend class="float-none w-auto px-2">Datos de Preparados</legend>
            <div class="grid grid-cols-12 gap-4">
              <div class="sm:col-span-12">
              </div>
            </div>
        </fieldset>
      </div>
<Toast />
  </div>
  </div>
</main>
</template>
<style scoped>
</style>
