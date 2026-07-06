
<script setup>
import { ref, onMounted, nextTick, watchEffect,computed } from 'vue';
import axios from 'axios';
import { 
nfecha, 
arrayToObjetoFromTabla, 
peticionesFetch,
obtenerIdsSeleccionados, 
crearTablaSiNoExiste,
encryptarPassword,
peticionesFetchOffline,
envioElectron,
crearTablaSiNoExisteOffline,
buscadorArrayObjeto } from '../../funciones/funciones.js';
import Swal from 'sweetalert2'
import { useToast } from "primevue/usetoast";
const toast = useToast();
import { useRouter, useRoute } from 'vue-router';
const router = useRouter();
/************************************************************************/
const usuarioLocal = ref({})
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
const datosJSON = ref([]);
/************************************************************************/
const visible = ref(false);
const visiblecrear = ref(false);
/************************************************************************/
const info = ref({
  model: '',
  version: '',
  battery: '',
  imei: '',
  serial: ''
});

/************************************************************************/
watchEffect(() => {
  /*if (visiblecrear.value) {
  }*/
});

/************************************************************************/
const datosConfig = async()=>{
    const response = await envioElectron('datosarchivo');
    datosJSON.value = response;
    link.value = datosJSON.VITE_LINKURL;
    api.value = datosJSON.VITE_LINK_API;
    token.value = datosJSON.VITE_TOKEN;
    patronTelefono.value = datosJSON.VITE_PATRON_TELEFONO;
    linkImpresora.value = datosJSON.VITE_IMPRESORA_LOCAL;
    tokenCorto.value = datosJSON.VITE_TOKEN_CORTO;
    patroncedula.value = datosJSON.VITE_PATRON_CEDULA;
}
/************************************************************************/
onMounted(async () => {
await datosConfig()
tokenCifrado.value = await encryptarPassword(token.value, 10);
await obtenerInfo();
});
/************************************************************************/
 const obtenerInfo = async () => {
  try {
    const resultado = await window.electron.ipcRenderer.invoke('consultaandroid', 'getDeviceInfo');
    console.log("resultado", resultado);
    if (resultado.success) {
      info.value = resultado.data;
    } else {
      toast.add({ severity: 'error', summary: 'Error', detail: resultado.message || 'No se pudo obtener info', life: 3000 });
    }
  } catch (err) {
    console.error(err);
    toast.add({ severity: 'error', summary: 'Error', detail: 'Error interno', life: 3000 });
  }
};

const reboot = async () => {
  const resultado = await window.electron.ipcRenderer.invoke('consultaandroid', 'reiniciarDispositivo', info.value.serial)
};

const capturaPantalla = async () => {
  //await window.electron.ipcRenderer.invoke('consultaandroid', 'takeScreenshot');
  const datos = await window.electron.ipcRenderer.invoke('consultaandroid', 'capturarPantalla', info.value.serial)
  console.log("datos", datos);
};

const instalarAPK = async () => {
  const resultado = await window.electron.ipcRenderer.invoke('consultaandroid', 'installApk', '/ruta/a/archivo.apk');
  if (resultado.success) {
    toast.add({ severity: 'success', summary: 'Éxito', detail: 'APK instalado', life: 3000 });
  } else {
    toast.add({ severity: 'error', summary: 'Error', detail: resultado.message, life: 3000 });
  }
};

/************************************************************************/
</script>
<template>
<main class="content-wrapper">
  <div class="mt-5">
<Card>
  


<div class="p-4 grid grid-cols-1 md:grid-cols-2 gap-6">
    <Card>
      <template #title>
        <div class="text-lg font-bold">Dispositivo Conectado</div>
      </template>
      <template #content>
      
        <p><strong>Modelo:</strong> {{ info.model }}</p>
        <p><strong>Android:</strong> {{ info.version }}</p>
        <p><strong>Batería:</strong> {{ info.battery }}%</p>
        <p><strong>IMEI:</strong> {{ info.imei }}</p>
        <p><strong>Serial:</strong> {{ info.serial }}</p>
      </template>
    </Card>

    <div class="grid grid-cols-3 gap-4">
      <Button icon="pi pi-refresh" label="Reiniciar" @click="reboot" />
      <Button icon="pi pi-download" label="Instalar APK" @click="instalarAPK" />
      <Button icon="pi pi-camera" label="Captura" @click="capturaPantalla" />
      <!-- Agrega más botones -->
    </div>
  </div>


</Card>

<!-- ////////////////////////////////////////////////////////////////////////////////////////// -->

<!-- ////////////////////////////////////////////////////////////////////////////////////////// -->
<Toast />
  </div>
</main>
</template>
<style scoped>
</style>
