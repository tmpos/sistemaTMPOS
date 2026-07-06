<script setup>
import { ref, onMounted } from 'vue';
import Swal from 'sweetalert2';

import { enviarDatosPorPost, eliminarDatos, obtenerIdsSeleccionados, borrarTodoslosDatos, lenguajeDataTable, nfecha, arrayToObjetoFromTabla, peticionesFetch, encryptarPassword, envioElectron, mensajetoast, crearTablaSiNoExiste, peticiones,generarCodigoUnico, lasMayusculas } from '../funciones/funciones.js';

import { useToast } from "primevue/usetoast";
const toast = useToast();


const datosVersion = ref({});

// Initialize `updateInfo` with a safe default structure
const updateInfo = ref({
  available: false,
  version: null,
  error: null
});
const alertaActualizacionMostrada = ref(false);
const versionLocal = ref('0.0.0');


/*************************************************************************/

/*************************************************************************/
const link = ref('');
const api = ref('');
const token = ref('');
const patronTelefono = ref('');
const linkImpresora = ref('');
const patroncedula = ref('');
const tokenCifrado = ref('');
const tokenCorto = ref('');
/*************************************************************************/

const marquesinaActiva = ref(true);  // Controla si la marquesina se muestra


const mensajes = ref([
  'TMPOS SRL agradece tu preferencia',
]);

const normalizarVersion = (v = '0.0.0') => (v || '0.0.0').trim();
const compararVersiones = (a = '0.0.0', b = '0.0.0') => {
  const pa = normalizarVersion(a).split('.').map(Number);
  const pb = normalizarVersion(b).split('.').map(Number);
  const len = Math.max(pa.length, pb.length);
  for (let i = 0; i < len; i++) {
    const va = pa[i] || 0;
    const vb = pb[i] || 0;
    if (va !== vb) return va - vb;
  }
  return 0;
};

const notificarActualizacionDisponible = (versionNueva, versionActual) => {
  if (alertaActualizacionMostrada.value) return;
  alertaActualizacionMostrada.value = true;
  Swal.fire({
    icon: 'info',
    title: 'Actualizaci\u00f3n disponible',
    html: `
      <p>Hay una versi\u00f3n m\u00e1s reciente del sistema.</p>
      <p><strong>Actual:</strong> ${versionActual || 'No detectada'}</p>
      <p><strong>Nueva:</strong> ${versionNueva}</p>
    `,
    confirmButtonText: 'Entendido'
  });
};


// Async function to check for updates
const revisarActualizacion = async () => {
  try {

      if(window.electron){
    const result = await window.electron.ipcRenderer.invoke('revisarActualizacionDisponible');
    updateInfo.value = {
      available: result.available,
      version: result.version,
      error: null
    };

    if (result.available) {
      const versionDetectada = versionLocal.value;
      if (compararVersiones(result.version, versionDetectada) > 0) {
        notificarActualizacionDisponible(result.version, versionDetectada);
      }
    }
       }else{
        // toast.add({ severity: 'error', summary: 'Upps', detail: 'Esta funcion es solo para la aplicacion Desktop', life: 3000 });
     }


  } catch (error) {
    // Handle error and update `updateInfo` with the error message
    updateInfo.value.error = error.message;
  }
};


const fetchMensajes = async () => {
  try {
    const response = await peticionesFetch(`${link.value}${api.value}`, 'datosarraypost', { 'tabla': 'mensajes' }, tokenCifrado.value, 'POST');

    // Iteramos sobre los mensajes obtenidos de la respuesta
    for (let mensaje of response) {
      // Verificamos si el mensaje ya existe en el array de mensajes
      if (!mensajes.value.includes(mensaje.texto)) {
        // Si el mensaje no está en el array, lo añadimos
        mensajes.value.push(mensaje.texto);
      }
    }
    /*********************************************/
  } catch (error) {
    toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to fetch data MESAS', life: 3000 });
  }
};




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
versionLocal.value = datosJSON.VITE_VERSION || '0.0.0';

      if(window.electron){
         datosVersion.value = await window.electron.ipcRenderer.invoke('nombrePC');
       }else{
         //toast.add({ severity: 'error', summary: 'Upps', detail: 'Esta funcion es solo para la aplicacion Desktop', life: 3000 });
         datosVersion.value.version =  datosJSON.VITE_VERSION || '35.0.0';
     }

  if (datosVersion.value?.version) {
    versionLocal.value = datosVersion.value.version;
  }


  mensajes.value.push('Versión ' + datosVersion.value.version);

  const datosDefault = JSON.parse(window.localStorage.getItem('tabladefault'))
  if (datosDefault.actualizacion_automatica == 'true') {
      revisarActualizacion();
      setInterval(() => {
          revisarActualizacion();
          fetchMensajes();
      }, 300000); 
  }

await crearTablaSiNoExiste(link.value, api.value, 'mensajes', ["texto","usuario"], tokenCifrado.value,toast);




});







</script>

<template>


  <!-- Marquesina que aparece solo si 'marquesinaActiva' es true -->
  <div v-if="marquesinaActiva" class="marquesina-container">
    <div class="marquesina">
      <span v-for="(mensaje, index) in mensajes" :key="index" class="marquesina-mensaje">{{ mensaje }}</span>
    </div>
  </div>
</template>



<style scoped>
.layout-footer {
  /*margin-top: 20px;*/
  /*font-size: 14px;*/
}

.marquesina-container {
  /*position: fixed; /* Mantiene la marquesina fija en el footer */
  bottom: 0; /* Posiciona en la parte inferior */
  width: 100%; /* Ocupa todo el ancho de la pantalla */
  overflow: hidden;
  white-space: nowrap;
  background-color: #f0f0f0;
  padding: 10px;
  border: 1px solid #ddd;
  z-index: 1000; /* Asegura que esté por encima de otros elementos */
}

.marquesina {
  display: inline-block;
  animation: slide 30s linear infinite;
}

@keyframes slide {
  from {
    transform: translateX(100%);
  }
  to {
    transform: translateX(-100%);
  }
}

.marquesina-mensaje {
  display: inline-block;
  padding-right: 50px; /* Espacio entre los mensajes */
  font-weight: bold;
  color: #333;
}
</style>
