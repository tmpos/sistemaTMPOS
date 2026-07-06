<template>
  <div class="relative w-full">
    <label v-if="label" :for="selectId" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
      {{ label }}
    </label>
    <select
      :id="selectId"
      v-model="selectedValue"
      @change="handleChange"
      class="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:focus:ring-gray-500 dark:text-gray-300"
    >
      <option disabled value="">{{ placeholder }}</option>
      <option
        v-for="option in formattedOptions"
        :key="option.value"
        :value="option.value"
        :selected="option.value === selectedValue"
        class="px-4 py-2 dark:bg-gray-700 bg-gray-100 hover:bg-indigo-100 dark:hover:bg-indigo-600"
      >
        {{ option.label }}
      </option>
    </select>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { v4 as uuidv4 } from 'uuid';

const props = defineProps({
  options: {
    type: Array,
    required: true,
    default: () => [],
  },
  modelValue: {
    type: [String, Number],
    default: '',
  },
  label: {
    type: String,
    default: '',
  },
  placeholder: {
    type: String,
    default: 'Select an option',
  },
  valueField: {
    type: String,
    default: 'value',
  },
  labelField: {
    type: String,
    default: 'label',
  },
});

const emit = defineEmits(['update:modelValue']);

const selectedValue = ref(props.modelValue);
const selectId = ref(`select-${uuidv4()}`);

// Format options based on whether they are an array of objects or strings
const formattedOptions = computed(() => {
  if (props.options.length === 0) return [];
  const isPlainArray = typeof props.options[0] === 'string' || typeof props.options[0] === 'number';
  return isPlainArray
    ? props.options.map(opt => ({ value: opt, label: opt }))
    : props.options.map(opt => ({
        value: opt[props.valueField],
        label: opt[props.labelField],
      }));
});

// Update selectedValue when modelValue changes externally
watch(() => props.modelValue, (newValue) => {
  selectedValue.value = newValue;
});

// Emit selected value change
const handleChange = () => {
  emit('update:modelValue', selectedValue.value);
};
</script>
