<template>
  <div class="relative w-full">
    <input
      ref="awesompleteInput"
      v-model="model"
      :placeholder="placeholder"
      type="text"
      class="w-full border rounded p-2 pr-10"
      @input="emitUpdate"
      @keyup.enter="emitEnterPress"
      @focus="onFocusMostrar"
      @blur="onBlurRestaurar"
    />

    <button
      v-if="props.mostrarBoton"
      type="button"
      @click="emit('onBotonClick')"
      class="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-primary"
    >
      <i :class="iconoBoton"></i>
    </button>
  </div>
</template>

<script setup>
import { onMounted, ref, watch, onBeforeUnmount } from 'vue'
import Awesomplete from 'awesomplete'

// Props
const props = defineProps({
  modelValue: {
    type: [String, Object, null],
    default: ''
  },
  list: {
    type: Array,
    default: () => []
  },
  placeholder: String,
  mostrarAlFocus: {
    type: Boolean,
    default: false
  },
  mostrarBoton: {
    type: Boolean,
    default: false
  },
  iconoBoton: {
    type: String,
    default: 'pi pi-search'
  },
  optionLabel: {
    type: String,
    default: '' // Si está vacío, se asume array de strings
  }
})

// Emits
const emit = defineEmits([
  'update:modelValue',
  'selectComplete',
  'onBotonClick',
  'inputChange',
  'enterPress',
  'focus',
  'blur'
])

// Refs
const getDisplayValue = (value) => {
  if (props.optionLabel && value && typeof value === 'object') {
    return value?.[props.optionLabel] || ''
  }

  return typeof value === 'string' ? value : ''
}

const model = ref(getDisplayValue(props.modelValue))
const awesompleteInput = ref(null)
const valorTemporal = ref('')
let awesompleteInstance = null
let selectCompleteHandler = null

// Utilidad: convertir lista según optionLabel
const getListaFormateada = () => {
  if (!props.optionLabel) return props.list

  return props.list
    .map(item => {
      const label = item?.[props.optionLabel]
      return typeof label === 'string' ? { label, value: label } : null
    })
    .filter(Boolean)
}


// Inicialización
onMounted(() => {
  awesompleteInstance = new Awesomplete(awesompleteInput.value, {
    list: [], // se asigna luego
    autoFirst: true,
    minChars: props.mostrarAlFocus ? 0 : 1,
    sort: false
  })

  actualizarLista()

  selectCompleteHandler = (e) => {
    const valor = e.text.value || e.text.label || e.text

    // Si es lista de objetos, emite el objeto completo
    if (props.optionLabel) {
      const objeto = props.list.find(
        item => item?.[props.optionLabel] === valor
      )
      emit('update:modelValue', objeto || null)
      emit('selectComplete', objeto)
    } else {
      emit('update:modelValue', valor)
      emit('selectComplete', valor)
    }

    setTimeout(() => {
      awesompleteInstance?.close()
    }, 0)
  }

  awesompleteInput.value.addEventListener('awesomplete-selectcomplete', selectCompleteHandler)
})

// Limpieza
onBeforeUnmount(() => {
  if (selectCompleteHandler) {
    awesompleteInput.value?.removeEventListener('awesomplete-selectcomplete', selectCompleteHandler)
  }
})

// Actualizar lista al cambiar
watch(() => props.list, () => {
  actualizarLista()
})

// Actualiza la lista interna
const actualizarLista = () => {
  if (awesompleteInstance) {
    awesompleteInstance.list = getListaFormateada()
  }
}

// Sincronizar con modelValue externo
watch(() => props.modelValue, (val) => {
  model.value = getDisplayValue(val)

  if (!model.value?.trim()) {
    awesompleteInstance?.close()
  }
})

// Emitir al escribir
const emitUpdate = (e) => {
  const value = e.target.value
  model.value = value
  emit('inputChange', value)

  if (!props.optionLabel) {
    emit('update:modelValue', value)
  }
}

const emitEnterPress = () => {
  const value = String(model.value || '').trim()
  if (!value) return
  emit('enterPress', value)
}

// Focus: limpiar y mostrar sugerencias
const onFocusMostrar = () => {
  emit('focus')

  if (!awesompleteInstance) {
    return
  }

  if (!props.mostrarAlFocus) {
    awesompleteInstance.close()
    return
  }

  valorTemporal.value = awesompleteInput.value.value
  awesompleteInput.value.value = ' '
  awesompleteInstance.evaluate()

  setTimeout(() => {
    awesompleteInput.value.value = ''
    if (!props.optionLabel) {
      emit('update:modelValue', '')
    }
    emit('inputChange', '')
  }, 20)
}

// Blur: restaurar si quedó vacío
const onBlurRestaurar = () => {
  awesompleteInstance?.close()
  emit('blur', awesompleteInput.value?.value || '')

  if (!awesompleteInput.value.value.trim()) {
    awesompleteInput.value.value = valorTemporal.value
    model.value = valorTemporal.value
    if (!props.optionLabel) {
      emit('update:modelValue', valorTemporal.value)
    }
  }
}
</script>

<style scoped>
/* Personaliza estilos si deseas */
</style>
