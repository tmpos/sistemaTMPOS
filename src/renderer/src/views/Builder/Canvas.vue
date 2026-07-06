<template>
  <div class="grid grid-cols-12 gap-2 border border-dashed p-4 min-h-[500px]">
    <div 
      v-for="comp in components" 
      :key="comp.id"
      :class="`col-span-${comp.cols} border p-2 bg-white shadow cursor-pointer`"
      @click="$emit('select', comp)"
    >
      <component :is="comp.type" v-bind="comp.props" class="w-full" />
    </div>
  </div>
</template>

<script setup>
defineProps({
  components: Array
})
</script>
