<template>
  <div>
    <div v-if="hasData" class="overflow-x-auto">
      <table class="min-w-full bg-white">
        <thead>
          <tr>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Clave</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Valor</th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-200">
          <tr v-for="(value, key) in filteredData" :key="key">
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{{ key }}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{{ value }}</td>
          </tr>
        </tbody>
      </table>
    </div>
    <div v-else class="text-center text-gray-500">
      <Message severity="warn">No hay datos disponibles.</Message>
    </div>
  </div>
</template>

<script setup>
import { defineProps, computed } from 'vue';

// Definir las propiedades que el componente espera recibir
const props = defineProps({
  data: {
    type: Object,
    required: true
  },
  omitKeys: {
    type: Array,
    default: () => []
  }
});

// Filtrar los datos para omitir las claves especificadas
const filteredData = computed(() => {
  const filtered = {};
  for (const key in props.data) {
    if (!props.omitKeys.includes(key)) {
      filtered[key] = props.data[key];
    }
  }
  return filtered;
});

// Verificar si hay datos disponibles
const hasData = computed(() => {
  return Object.keys(filteredData.value).length > 0;
});
</script>

<style scoped>
/* Estilos opcionales */
</style>
