<template>
  <div>
    <h3 class="font-bold mb-4">Propiedades</h3>

    <div class="mb-3">
      <label class="block">Label</label>
      <InputText v-model="localProps.label" class="w-full" />
    </div>

    <div class="mb-3">
      <label class="block">Placeholder</label>
      <InputText v-model="localProps.placeholder" class="w-full" />
    </div>

    <div class="mb-3">
      <label class="block">Columnas</label>
      <InputNumber v-model="localCols" :min="1" :max="12" class="w-full" />
    </div>

    <Button label="Actualizar" class="mt-2 w-full" @click="applyChanges" />
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'

const props = defineProps({ component: Object })
const emit = defineEmits(['update'])

const localProps = ref({ ...props.component.props })
const localCols = ref(props.component.cols)

watch(() => props.component, (newVal) => {
  localProps.value = { ...newVal.props }
  localCols.value = newVal.cols
})

function applyChanges() {
  emit('update', {
    ...props.component,
    props: { ...localProps.value },
    cols: localCols.value
  })
}
</script>
