<template>
  <div
    class="w-full md:w-56 bg-white shadow-md rounded-xl p-3 flex flex-col md:h-full"
  >
    <!-- Vista móvil y tablet (fila horizontal desplazable con scroll) -->
    <div
      class="flex md:hidden space-x-2 overflow-x-auto scrollbar-thin py-2 px-1 snap-x snap-mandatory scroll-smooth"
    >
      <button
        v-for="category in categories"
        :key="category.nombre"
        @click="selectCategory(category)"
        :class="[ 
          'flex items-center flex-shrink-0 whitespace-nowrap px-4 py-2 rounded-lg text-sm font-medium transition-all snap-start',
          selectedCategory === category.nombre
            ? 'bg-blue-600 text-white shadow'
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
        ]"
      >
        <i :class="category.icono" class="mr-2"></i>
        {{ category.nombre }}
      </button>
    </div>

    <!-- Vista escritorio (lista vertical) -->
    <div class="hidden md:flex flex-col space-y-2 mt-2 overflow-y-auto">
      <button
        v-for="category in categories"
        :key="category.nombre"
        @click="selectCategory(category)"
        :class="[ 
          'flex items-center w-full px-4 py-2 rounded-lg text-sm font-medium transition-all text-left',
          selectedCategory === category.nombre
            ? 'bg-blue-600 text-white shadow'
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
        ]"
      >
        <i :class="category.icono" class="mr-2"></i>
        {{ category.nombre }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  categories: {
    type: Array,
    required: true
  }
})
const emit = defineEmits(['selectCategory'])

const selectedCategory = ref(props.categories[0]?.nombre || '')

const selectCategory = (category) => {
  selectedCategory.value = category.nombre
  emit('selectCategory', category.nombre)
}

watch(
  () => props.categories,
  (val) => {
    if (val.length && !selectedCategory.value) {
      selectedCategory.value = val[0].nombre
    }
  },
  { immediate: true }
)
</script>

<style>
/* 👇 Scrollbar moderno y visible solo cuando se necesita */
.scrollbar-thin::-webkit-scrollbar {
  height: 6px;
}
.scrollbar-thin::-webkit-scrollbar-thumb {
  background-color: rgba(107, 114, 128, 0.5); /* gris medio */
  border-radius: 4px;
}
.scrollbar-thin::-webkit-scrollbar-track {
  background-color: transparent;
}
.scrollbar-thin {
  scrollbar-width: thin;
  scrollbar-color: rgba(107, 114, 128, 0.5) transparent;
}
</style>
