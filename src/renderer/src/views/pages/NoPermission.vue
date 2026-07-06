<script setup>
import { defineComponent } from 'vue';
import AppConfig from '@/layout/AppConfig.vue';
import { useRouter,useRoute } from 'vue-router';
const router = useRouter();

const irAtras = ()=>{
 const previousRoute = JSON.parse(localStorage.getItem('previousRoute'));
  router.push('/'+previousRoute.ruta)

}

//irSalir
const irSalir = ()=>{
  router.push('/login')

}

// Example SVG for a police officer with a stop sign
const policeSvg = `
<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-shield">
  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
  <line x1="12" y1="7" x2="12" y2="12"></line>
  <line x1="12" y1="15" x2="12.01" y2="15"></line>
</svg>
`;
</script>

<template>
  <main class="content-wrapper">
    <div class="container mx-auto px-4 mt-5">
      <div class="grid grid-cols-12 gap-4">
        <div class="md:col-span-12">
          <div class="text-center">
            <div v-html="policeSvg" class="mb-4"></div>
            <h1 class="display-1">403</h1>
            <p class="lead">No tienes permisos para entrar aquí</p>
            <p>Lo sentimos, no tienes los permisos necesarios para acceder a esta página.</p>
            <button @click="irAtras" class="btn btn-primary">Volver atrás</button>
            <button @click="irSalir" class="btn btn-primary ml-2">Salir</button>
          </div>
        </div>
      </div>
    </div>
  </main>

</template>

<style scoped>
.content-wrapper {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
}

.container {
  text-align: center;
}

svg {
  width: 150px;
  height: 150px;
  margin-bottom: 20px;
}
</style>
