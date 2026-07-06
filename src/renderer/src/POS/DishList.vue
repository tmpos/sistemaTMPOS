<template>
  <div class="p-4">
    <!-- Estado vacío -->
    <div v-if="!dishes || dishes.length === 0" class="flex flex-col items-center justify-center h-64 text-gray-500">
      <svg class="w-16 h-16 mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"></path>
      </svg>
      <p class="text-lg font-medium">No hay productos disponibles</p>
      <p class="text-sm">Selecciona otra categoría o agrega productos</p>
    </div>

    <!-- Lista de productos -->
    <div v-else class="grid grid-cols-12 gap-4">
      <div
        v-for="dish in dishes"
        :key="dish.id"
        class="col-span-12 md:col-span-6 lg:col-span-4 xl:col-span-3"
      >
        <div
          class="bg-white shadow-md rounded-2xl overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer h-full flex flex-col"
          @click="viewDish(dish)"
        >
<!--           <img
            :src="dish.imagen"
            :alt="dish.nombre"
            class="w-full h-48 object-cover"
            @error="$event.target.src = 'https://placehold.co/600x400?text=Sin-Imagen'"
          /> -->

              <div v-if="!ocultarImagenProductos" class="pos-product-image-container">
                <img
                  :src="getProductImage(item.imagen)"
                  :alt="item.nombre"
                  class="pos-product-image"
                  @error="$event.target.src = getProductImage(null)"
                />
              </div>

          <div class="p-4 flex flex-col flex-1">
            <h5 class="text-lg font-semibold text-gray-800 mb-1">
              {{ dish.nombre }}
            </h5>
            <p class="text-base font-bold text-green-600 mt-2">
              RD$ {{ parseFloat(dish.precio_venta || 0).toFixed(2) }}
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>


<script setup>
  import { ref, onMounted, watch,computed,onUnmounted,nextTick,watchEffect } from 'vue';
const props = defineProps({
  dishes: {
    type: Array,
    required: true,
    default: () => []
  }
});

const ocultarImagenProductos = ref(true); // Por defecto ocultar imagenes de productos

const emit = defineEmits(['viewDish']);

// Computed function to determine which image to use
const getProductImage = (imageUrl) => {
  return computed(() => {
    return imageUrl;
  }).value; // Ensure to access the value of computed property
};

const viewDish = (dish) => {
  emit('viewDish', dish);
};
</script>

<style>
.dish-list-container {
  height: 80vh; /* Adjust height as needed */
  overflow-y: auto;
  overflow-x: hidden; /* Prevent horizontal scroll */
}

</style>
