<script setup>
import { ref, onMounted } from 'vue';
import { useToast } from "primevue/usetoast";
import { envioElectron } from '@/funciones/funciones.js';
import { useDatosEmpresa } from '@/stores';

const toast = useToast();
const datosEmpresa = useDatosEmpresa();

document.body.classList.add('sidebar-close');

onMounted(async() => {
  try {
    const datosJSON = await envioElectron('datosarchivo');
    if (!datosEmpresa.empresa.nombre) {
      await datosEmpresa.inicializarDatosEmpresa(datosJSON.VITE_LINKURL + datosJSON.VITE_LINK_API);
    }
  } catch (error) {
    console.error('Error al inicializar:', error);
  }
});
</script>

<template>
  <main class="content-wrapper bg-gray-50 min-h-screen">
    <div class="w-full px-4 py-6">
      <div class="mb-6">
        <h1 class="text-3xl font-bold text-gray-800">Libro Diario</h1>
        <p class="text-gray-600 mt-1">Registro cronolÃ³gico de transacciones</p>
      </div>

      <Card class="shadow-lg">
        <template #content>
          <div class="text-center py-12">
            <i class="pi-book text-gray-300 text-6xl mb-4"></i>
            <h2 class="text-xl font-semibold text-gray-700 mb-2">Reporte en Desarrollo</h2>
            <p class="text-gray-500 mb-6">Este reporte estarÃ¡ disponible prÃ³ximamente.</p>
            <router-link to="/reportes">
              <Button label="Volver a Reportes" icon="pi pi-arrow-left" severity="secondary" />
            </router-link>
          </div>
        </template>
      </Card>

      <Toast />
    </div>
  </main>
</template>

<style scoped>
.content-wrapper {
  min-height: calc(100vh - 60px);
}
</style>
