
<script  setup>
import { ref, onMounted, nextTick, watchEffect,computed } from 'vue';
import axios from 'axios';
import { enviarDatosPorPost, eliminarDatos, obtenerIdsSeleccionados, borrarTodoslosDatos, lenguajeDataTable, nfecha, arrayToObjetoFromTabla, peticionesFetch, encryptarPassword, envioElectron, mensajetoast, crearTablaSiNoExiste, peticiones, lasMayusculas } from '../../funciones/funciones.js';
import Swal from 'sweetalert2'
import { useToast } from "primevue/usetoast";
const toast = useToast();
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
/************************************************************************/
const visible = ref(false);
const visiblecrear = ref(false);
/************************************************************************/
watchEffect(() => {
  /*if (visiblecrear.value) {
  }*/
});

/************************************************************************/
const loading = ref(false);
const speed = ref(0); // Velocidad actual en Mbps
const maxSpeed = 100; // Velocidad máxima para el velocímetro
const error = ref(null);
const testFileUrl = `https://nbg1-speed.hetzner.com/100MB.bin`;

const startTest = async () => {
  loading.value = true;
  speed.value = 0;
  error.value = null;

  try {
    const startTime = performance.now();
    const response = await fetch(testFileUrl, { method: 'GET' });
    const contentLength = response.headers.get('content-length');

    if (!contentLength) {
      throw new Error('No se pudo obtener el tamaño del archivo.');
    }

    const fileSizeInBytes = parseInt(contentLength, 10);

    // Descargar un fragmento pequeño
    const reader = response.body.getReader();
    await reader.read(); // Solo leer un fragmento para calcular la velocidad

    const endTime = performance.now();

    const durationInSeconds = (endTime - startTime) / 1000;
    const fileSizeInBits = fileSizeInBytes * 8;

    // Mbps = bits / tiempo / 1,000,000
    speed.value = Math.min((fileSizeInBits / durationInSeconds / 1_000_000).toFixed(2), maxSpeed);
  } catch (e) {
    error.value = e.message || 'Error desconocido';
  } finally {
    loading.value = false;
  }
};
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


});
/************************************************************************/

/************************************************************************/
</script>
<template>
<main class="content-wrapper">
  <div class="mt-5">
<Card>
      <template #content>
<div class="flex flex-col space-y-4">

  <div class="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white">
    <h2 class="text-3xl font-bold mb-8">Medir Velocidad de Internet</h2>
    
   <iframe src="https://hctercom.speedtestcustom.com/" width="100%" height="600" frameborder="0" scrolling="no"></iframe>
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
.internet-speed-test {
  text-align: center;
}

.error {
  color: red;
}
</style>
