<template>
  <div class="flex flex-col items-center justify-center min-h-screen bg-white text-center px-4">
    
    <!-- Título de alerta -->
    <h1 class="text-3xl font-bold text-red-600 mb-4">
      ⚠️ SISTEMA BLOQUEADO ⚠️
    </h1>

    <p class="text-gray-700 text-base mb-6">
      Contacta al soporte o usa el token para desbloquear el sistema.
    </p>

    <!-- Imagen ilustrativa -->
    <img
      src="@/assets/img/sistemaBloqueado.webp"
      alt="Sistema Bloqueado"
      class="w-full max-w-xs mb-6"
    />

    <!-- Botones de acción -->
    <div class="space-x-3 mt-4">
      <button @click="whatsappSoporte" class="btn btn-success">
        Soporte por WhatsApp
      </button>
      <button @click="visibleTOKEN" class="btn btn-dark">
        Desbloqueo por TOKEN
      </button>
    </div>

    <Toast />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useToast } from 'primevue/usetoast';
import Swal from 'sweetalert2';
import { useRouter } from 'vue-router';

import {
  envioElectron,
  encryptarPassword,
  decodificarBase64,
  peticiones,
  peticionesFetchOffline 
} from '@/funciones/funciones.js';

import { useDatosEmpresa } from '@/stores';

const toast = useToast();
const router = useRouter();
const datosEmpresa = useDatosEmpresa();

const link = ref('');
const api = ref('');
const token = ref('');
const patronTelefono = ref('');
const linkImpresora = ref('');
const tokenCifrado = ref(null);
const tokenDesbloqueo = ref('')


if (window.electron) {
  window.electron.ipcRenderer.send('toggle-menu', false, []);
}

const traerCodigoDesbloqueo = async()=>{
  try{

const verificaTokens = await peticiones(`${link.value}${api.value}/datoscampo/tokens/nombre/desbloqueo`, {}, 'GET', tokenCifrado.value);

    if(verificaTokens){
       tokenDesbloqueo.value = decodificarBase64(verificaTokens.token)
    }

  }catch(error){
    console.log("error", error);

  }
}

onMounted(async () => {
  const datosJSON = await envioElectron('datosarchivo');
  link.value = datosJSON.VITE_LINKURL;
  api.value = datosJSON.VITE_LINK_API;
  token.value = datosJSON.VITE_TOKEN;
  patronTelefono.value = datosJSON.VITE_PATRON_TELEFONO;
  linkImpresora.value = datosJSON.VITE_IMPRESORA_LOCAL;
  tokenCifrado.value = await encryptarPassword(token.value, 10);

await traerCodigoDesbloqueo()

});

// Función de desbloqueo por TOKEN
const visibleTOKEN = async () => {
  Swal.fire({
    title: 'Introduce la contraseña',
    input: 'password',
    inputPlaceholder: 'Contraseña',
    showCancelButton: true,
    confirmButtonText: 'Enviar',
    cancelButtonText: 'Cancelar'
  }).then(async (result) => {
    if (result.isConfirmed) {
      const contrasenaIngresada = result.value;
      if (contrasenaIngresada === tokenDesbloqueo.value) {

    const response = await peticiones(`${link.value}${api.value}/datoscampo/empresa/id/${datosEmpresa.empresa.id}`, {}, 'GET', tokenCifrado.value);

    response.bloqueo = 'OFF'

  const url = link.value+api.value+"/actualizarcampos/empresa";
  if (!response) {
    console.error("Datos incompletos, no se puede actualizar.");
    return;
  }

  if (response.hasOwnProperty('created_at')) {
    response.updated_at = nfecha('timestamp');
  }
  const datosEnviar = JSON.parse(JSON.stringify(response));
  const envioDatos = await peticionesFetchOffline('updateData','empresa', JSON.stringify(datosEnviar));
  if (envioDatos[0] == 'ok') {
        localStorage.clear();
        router.push('/login');
}


      } else {
        toast.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Contraseña incorrecta',
          life: 3000
        });
      }
    }
  });
};

// Soporte por WhatsApp
const whatsappSoporte = () => {
  const pagina = 'https://api.whatsapp.com/send/?phone=+18297842912&text=Necesito Ayuda Tengo el sistema bloqueado&app_absent=';
  window.open(pagina, "Soporte", "width=600,height=800");
};
</script>

<style scoped>
.btn {
  @apply px-4 py-2 rounded text-white font-semibold shadow;
}
.btn-success {
  @apply bg-green-600 hover:bg-green-700;
}
.btn-dark {
  @apply bg-gray-800 hover:bg-gray-900;
}
</style>
