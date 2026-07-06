<template>
  <div class="button-container">
    <Card>
          <template #content>
<div class="button-group">
          <Button label="Registrarse" class="p-button-lg" @click="goToRegister" />
          <Button label="Entrar como Cliente" class="p-button-lg" @click="goToLogin" />
        </div>
          </template>
    </Card>
  </div>
</template>

<script setup>
import Card from 'primevue/card';
import Button from 'primevue/button';
import { useRouter } from 'vue-router';

const router = useRouter();

const goToRegister = () => {
  // Navegar a la página de registro
  router.push('/registro');
};

const goToLogin = () => {
  // Navegar a la página de inicio de sesión
  router.push('/login');
};
</script>

<style scoped>
.button-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh; /* Ajusta la altura según sea necesario */
}

.button-group {
  display: flex;
  flex-direction: column;
  gap: 1rem; /* Espacio entre los botones */
  align-items: center;
}

.p-button-lg {
  width: 200px; /* Ajusta el ancho de los botones según sea necesario */
}
</style>
