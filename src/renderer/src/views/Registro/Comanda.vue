<template>
  <div class="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
    <h2 class="text-3xl font-bold mb-8 text-gray-800">Comanda para la Cocina</h2>
    <Card class="w-full max-w-2xl shadow-lg rounded-lg p-6 bg-white">
      <template #title>
        <h3 class="text-xl font-bold text-gray-800">Detalles del Pedido</h3>
      </template>
      <template #content>
      
        <div class="space-y-4">
          <div v-for="(item, index) in comanda" :key="index" class="p-4 border rounded-lg bg-gray-50">
            <div class="flex justify-between items-center">
              <div>
                <h4 class="font-bold">{{ item.nombre }}</h4>
                <p class="text-gray-600">{{ item.descripcion }}</p>
                <p class="text-gray-800">Cantidad: {{ item.cantidad }}</p>
              </div>
              <Button label="Listo" class="bg-green-500 text-white py-1 px-3 rounded hover:bg-green-600" @click="marcarComoListo(index)" />
            </div>
          </div>
        </div>
      </template>
      <template #footer>
        <div class="flex justify-between">
          <Button label="Enviar a Cocina" class="bg-indigo-600 text-white py-2 px-4 rounded hover:bg-indigo-700" @click="enviarACocina" />
          <Button label="Cancelar Pedido" class="bg-red-500 text-white py-2 px-4 rounded hover:bg-red-600" @click="cancelarPedido" />
        </div>
      </template>
    </Card>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import Card from 'primevue/card';
import Button from 'primevue/button';

// Datos de ejemplo para la comanda
const comanda = ref([
  {
    nombre: 'Entrada Gourmet',
    descripcion: 'Una exquisita entrada con ingredientes frescos y de alta calidad.',
    cantidad: 2
  },
  {
    nombre: 'Plato Principal',
    descripcion: 'Un delicioso plato principal con una mezcla de sabores únicos.',
    cantidad: 1
  },
  {
    nombre: 'Postre Especial',
    descripcion: 'Un postre irresistible para terminar su comida con dulzura.',
    cantidad: 3
  }
]);

const marcarComoListo = (index) => {
  // Aquí puedes manejar la lógica para marcar un item como listo
  console.log(`Item ${index} marcado como listo`);
  comanda.value.splice(index, 1);
};

const enviarACocina = () => {
  // Aquí puedes manejar la lógica para enviar la comanda a la cocina
  console.log('Comanda enviada a la cocina:', comanda.value);
};

const cancelarPedido = () => {
  // Aquí puedes manejar la lógica para cancelar el pedido
  console.log('Pedido cancelado');
  comanda.value = [];
};
</script>
