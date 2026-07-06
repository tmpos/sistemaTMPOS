
<script setup>
import { ref, onMounted, nextTick, watchEffect,computed } from 'vue';
import axios from 'axios';
import { enviarDatosPorPost, eliminarDatos, obtenerIdsSeleccionados, borrarTodoslosDatos, lenguajeDataTable, nfecha, arrayToObjetoFromTabla, peticionesFetch, encryptarPassword, envioElectron, mensajetoast, crearTablaSiNoExiste, peticiones, lasMayusculas,cerrarSession,logout } from '../../funciones/funciones.js';
import Swal from 'sweetalert2'
import { useToast } from "primevue/usetoast";
const toast = useToast();
/************************************************************************/
import { useRouter,useRoute } from 'vue-router';
const router = useRouter();
const route = useRoute();
/************************************************************************/
const usuarioLocal = ref({})
/************************************************************************/
import { useAuthStore } from '@/stores/auth';
const authStore = useAuthStore();
/************************************************************************/
import { useDatosEmpresa } from '../../stores'
const datosEmpresa = useDatosEmpresa();
const link = ref('');
const api = ref('');
const token = ref('');
const patronTelefono = ref('');
const linkImpresora = ref('');
const patroncedula = ref('');
const tokenCifrado = ref('');
const tokenCorto = ref('');
/************************************************************************/
const visible = ref(false);
const visiblecrear = ref(false);
/************************************************************************/
const nombrePC = ref({})
/************************************************************************/
watchEffect(() => {
  /*if (visiblecrear.value) {
  }*/
});

/************************************************************************/
onMounted(async () => {
const datosJSON = await envioElectron('datosarchivo');
link.value = datosJSON.VITE_LINKURL;
api.value = datosJSON.VITE_LINK_API;
token.value = datosJSON.VITE_TOKEN;
patronTelefono.value = datosJSON.VITE_PATRON_TELEFONO;
linkImpresora.value = datosJSON.VITE_IMPRESORA_LOCAL;
patroncedula.value = datosJSON.VITE_PATRON_CEDULA;
tokenCorto.value = datosJSON.VITE_TOKEN_CORTO;
tokenCifrado.value = await encryptarPassword(token.value, 10);
usuarioLocal.value = JSON.parse(window.localStorage.getItem('usuarioLocal'))[0] || {};

      if(window.electron){
  try {
    nombrePC.value = await window.electron.ipcRenderer.invoke('nombrePC');
  } catch (error) {
    console.error('Error en el proceso de login:', error);
  }
       }else{
         toast.add({ severity: 'error', summary: 'Upps', detail: 'Esta funcion es solo para la aplicacion Desktop', life: 3000 });
     }


});
/************************************************************************/
const fnCrearBackup = async()=>{
const crearBackUp = await peticionesFetch(`${link.value}${api.value}`, 'backupdb', {}, tokenCifrado.value, 'GET', 'online');
if (crearBackUp && crearBackUp[0] === 'ok') {
  toast.add({
    severity: "success",
    summary: "Éxito",
    detail: "Se ha creado el Backup correctamente",
    life: 3000,
  });
 }
}
/************************************************************************/
 const cerrarSessiones = async()=>{

const sessiones = await peticiones(`${link.value+api.value}/datosarraydoblecondicion/registrocaja`,{campo1:'estado',valor1:'Abierta',campo2:'username',valor2:usuarioLocal.value.email},'POST',tokenCifrado.value);
    await fnCrearBackup();
  for(let session of sessiones){
      session.estado = 'Cerrada'
      session.updated_at = nfecha('timestamp');
      session.otro = JSON.stringify(nombrePC.value)
     const datosEnCaja = await peticiones(`${link.value}${api.value}/actualizarcampos/registrocaja`, session, 'POST', tokenCifrado.value);
  }

}
/************************************************************************/
const fnCerrarSession = async()=>{
  await cerrarSessiones()
  await logout(link.value,api.value,tokenCifrado.value,toast)
  cerrarSession()
   authStore.logout();
}
/************************************************************************/
const fnLock = ()=>{
    router.push('/lock')
}
/************************************************************************/
</script>
<template>
<main class="content-wrapper">
  <div class="mt-5">
<Card>
      <template #content>
<div class="card flex flex-col items-center gap-4">
        <div class="flex flex-wrap gap-4 justify-center">
            <Button label="Cerrar Sessión" @click="fnCerrarSession" icon="pi pi-sign-out" iconPos="top" />
            <Button label="Solo Salir" icon="pi pi-sign-out" @click="fnLock" iconPos="top" />
        </div>
    </div>
      </template>
</Card>

<!-- ////////////////////////////////////////////////////////////////////////////////////////// -->

<!-- ////////////////////////////////////////////////////////////////////////////////////////// -->
<Toast />
  </div>
</main>
</template>
<style scoped>
</style>
