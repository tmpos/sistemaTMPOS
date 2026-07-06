<template>
  <div class="profile-page">
    <div class="card">
      <h2>Perfil de Usuario</h2>
      <div class="p-fluid">
        <!-- Imagen de Perfil -->
        <div class="p-field p-text-center">
          <img :src="profile.imagen" alt="Imagen de perfil" class="profile-image" />
          <Button label="Actualizar Imagen" icon="pi pi-upload" class="p-mt-2" @click="actualizarImagen" />
        </div>
        
        <!-- Nombre -->
        <div class="p-field">
          <label for="name">Nombre</label>
          <InputText v-model="profile.nombre" v-mayuscula id="name"  />
        </div>

        <!-- Teléfono -->
        <div class="p-field">
          <label for="phone">Teléfono</label>
          <InputText v-model="profile.telefono" id="phone"  />
        </div>

        <!-- Dirección -->
        <div class="p-field">
          <label for="address">Dirección</label>
          <InputText v-model="profile.direccion" id="address"  />
        </div>

        <!-- Email -->
        <div class="p-field">
          <label for="email">Email</label>
          <InputText v-model="profile.email" id="email" readonly />
        </div>

        <!-- Contraseña -->
        <div class="p-field">
          <label for="password">Contraseña</label>
          <InputText v-model="profile.password" @change="encriptado(profile.password)" id="password" type="password"  />
        </div>

        <!-- Botón para actualizar información -->
        <Button label="Actualizar Información" icon="pi pi-refresh" class="p-mt-3" @click="actualizarInformacion" />
      </div>
    </div>
  </div>
     <Toast />
</template>

<script setup>
import { ref, onMounted } from 'vue';
import InputText from 'primevue/inputtext';
import Button from 'primevue/button';
import { useToast } from 'primevue/usetoast';
const toast = useToast();
import { useRouter, useRoute } from 'vue-router';
import { peticiones, 
generarCodigoUnico, 
encryptarPassword,
envioElectron, 
enviarDatosPorPost,
nfecha,
generateMicrosoftStyleLicense,
arrayToObjetoFromTabla,
peticionesFetch } from '../../funciones/funciones.js';

const router = useRouter();
const route = useRoute();

const profileImage = ref('https://via.placeholder.com/150'); // URL de la imagen de perfil
const profile = ref({});

const link = ref(null);
const api = ref(null);
const token = ref(null);
const patronTelefono = ref(null);
const linkImpresora = ref(null);
const idImpresa = ref(null);
const tokenCifrado = ref(null);

onMounted(async () => {
  const datosJSON = await envioElectron('datosarchivo');
  link.value = datosJSON.VITE_LINKURL;
  api.value = datosJSON.VITE_LINK_API;
  token.value = datosJSON.VITE_TOKEN;
  idImpresa.value = datosJSON.VITE_ID_EMPRESA;
  patronTelefono.value = datosJSON.VITE_PATRON_TELEFONO;
  linkImpresora.value = datosJSON.VITE_IMPRESORA_LOCAL;
  tokenCifrado.value = await encryptarPassword(token.value, 10);
  
  const usuarioLocal = JSON.parse(window.localStorage.getItem('usuarioLocal')) || [];
  
  if (usuarioLocal.length > 0) {
    const datosUsuario = usuarioLocal[0];
    profile.value = await peticiones(`${link.value}${api.value}/datoscampo/usuarios/email/${datosUsuario.email}`, {}, 'GET', tokenCifrado.value);
    profile.value.imagen = datosUsuario.imagen;
  }
});

const actualizarImagen = () => {
  // Aquí se implementaría la lógica para actualizar la imagen
  console.log('Actualizar imagen');
};

const actualizarInformacion = async(e) => {
    e.preventDefault();
     const url = link.value+api.value+"/actualizarcampos/usuarios";
  if (!profile.value) {
    console.error("Datos incompletos, no se puede actualizar.");
    return;
  }
  if (profile.value.hasOwnProperty('created_at')) {
      profile.value.updated_at = nfecha('timestamp')
    }
  const envioDatos = await enviarDatosPorPost(url, profile.value,tokenCifrado.value);
  console.log("envioDatos", envioDatos);
  if (envioDatos[0] == 'ok') {
     toast.add({ severity: 'success', summary: 'Éxito', detail: 'Datos Actualizados', life: 3000 });
  }else{
    toast.add({ severity: 'error', summary: 'Error', detail: 'Fallo al actualizar los datos.', life: 3000 });
  }
};

const encriptado = async(password)=>{
   const passwordEcriptada = await encryptarPassword(password, 10);
   profile.value.password = passwordEcriptada
}

</script>

<style scoped>
.profile-page {
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f4f4f4;
}

.card {
  width: 400px;
  padding: 2rem;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.p-field {
  margin-bottom: 1rem;
}

.profile-image {
  width: 150px;
  height: 150px;
  border-radius: 50%;
  object-fit: cover;
  margin-bottom: 1rem;
  display: block;
  margin-left: auto;
  margin-right: auto;
}
</style>
