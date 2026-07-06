<template>
  <div class="lock-page">
    <div class="card">
      <h2>Ingrese su Contraseña</h2>
      <div class="p-fluid">
        <div class="p-field">
          <label for="password">Contraseña</label>
          <InputText v-model="password" id="password" @keydown.enter="handleLock" type="password" />
        </div>
        <Button label="Ingresar" icon="pi pi-lock" class="p-mt-3" @click="handleLock" />
      </div>
    </div>
  </div>
     <Toast />
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useToast } from 'primevue/usetoast';
import InputText from 'primevue/inputtext';
import Button from 'primevue/button';
import { useRouter,useRoute } from 'vue-router';

import { peticiones, 
generarCodigoUnico, 
encryptarPassword,
envioElectron, 
nfecha,
generateMicrosoftStyleLicense,
arrayToObjetoFromTabla,
peticionesFetch } from '../../funciones/funciones.js';

const router = useRouter();
const route = useRoute();


const password = ref('');
const tokenLocal = ref('');
const toast = useToast();

const link = ref(null);
const api = ref(null);
const token = ref(null);
const patronTelefono = ref(null);
const linkImpresora = ref(null);
const idImpresa = ref(null);
const tokenCifrado = ref(null);
const previousRoute = ref(null);
const bloqueado = ref(false);
const email = ref('');

if(window.electron){
  window.electron.ipcRenderer.send('toggle-menu',false, []);

}


onMounted(async()=>{
    const datosJSON = await envioElectron('datosarchivo');
  link.value = datosJSON.VITE_LINKURL;
  api.value = datosJSON.VITE_LINK_API;
  token.value = datosJSON.VITE_TOKEN;
  idImpresa.value = datosJSON.VITE_ID_EMPRESA;
  patronTelefono.value = datosJSON.VITE_PATRON_TELEFONO;
  linkImpresora.value = datosJSON.VITE_IMPRESORA_LOCAL;
  tokenCifrado.value = await encryptarPassword(token.value, 10);

})

const handleLogin = async () => {

  const datosLocalArray = JSON.parse(window.localStorage.getItem('usuarioLocal')) || []
   
   if (datosLocalArray.length < 1) {
     localStorage.clear();
     router.push('/login')
   }

   const datosLocal = datosLocalArray[0];

   tokenLocal.value = datosLocal.token;
  try {
    const envio =  await peticiones(`${link.value}${api.value}/loginapi/usuarios`,{
      username: datosLocal.email,
      password: password.value,
      token: tokenLocal.value,
    }, 'POST', tokenCifrado.value);

    if (Array.isArray(envio)) {
      if (envio.length > 1) {

    const storedRoute = localStorage.getItem('previousRoute');
    if (storedRoute) {
      previousRoute.value = JSON.parse(storedRoute);
      if (previousRoute.value.ruta != 'login') {
        router.push('/' + previousRoute.value.ruta);
      }
    }

      } else if (envio[0] === 'error') {
        toast.add({ severity: 'error', summary: 'Error', detail: 'Correo o contraseña incorrectos.', life: 3000 });
             email.value = ''
             password.value = ''
      } else if (envio[0] === 'bloqueo') {
        toast.add({ severity: 'error', summary: 'Cuenta Bloqueada', detail: 'Tu cuenta está bloqueada. Contacta al administrador.', life: 3000 });
           bloqueado.value = true
        window.localStorage.setItem('bloqueo', JSON.stringify({bloqueo:email.value}));
        localStorage.clear();
        router.push('/error');
      }


    } else {
      toast.add({ severity: 'error', summary: 'Error', detail: 'Correo o contraseña incorrectos.', life: 3000 });
    }
  } catch (error) {
    console.error('Error en el proceso de login:', error);
    toast.add({ severity: 'error', summary: 'Error', detail: 'Ocurrió un error durante el inicio de sesión. Inténtalo nuevamente.', life: 3000 });
  }
};

const handleLock = () => {
  if (password.value) {
     handleLogin()
    //toast.add({ severity: 'success', summary: 'Éxito', detail: 'Contraseña ingresada correctamente' });
  } else {
    toast.add({ severity: 'error', summary: 'Error', detail: 'La contraseña no puede estar vacía' });
  }
};

</script>

<style scoped>
.lock-page {
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f4f4f4;
}

.card {
  width: 300px;
  padding: 2rem;
  text-align: center;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.p-field {
  margin-bottom: 1rem;
}
</style>
