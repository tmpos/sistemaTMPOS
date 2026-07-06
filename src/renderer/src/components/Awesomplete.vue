<template>
  <span :class="{'awesomplete-dark': isDarkMode}" id="spanbuscador" class="block w-full">
    <input
      ref="awesompleteInput"
      v-model="model"
      :placeholder="placeholder"
      :class="['w-full border dark:border-primary rounded-lgAA p-2.5 focus:outline-none focus:ring-2 focus:ring-primary', classes]"
      type="text"
      autofocus
      @input="handleInput"
      @change="handleChange"
    />
  </span>
</template>

<script setup>
import { ref, onMounted, watch, defineEmits, defineProps } from 'vue';
import Awesomplete from 'awesomplete';
import 'awesomplete/awesomplete.css';

const props = defineProps({
  placeholder: {
    default: '',
    type: String,
    required: false
  },
  list: {
    default: () => [],
    type: Array,
    required: true
  },
  classes: {
    default: '',
    type: String,
    required: false
  },
  modelValue: {
    type: String,
    default: ''
  },
  isDarkMode: { // Nueva prop para el modo oscuro
    type: Boolean,
    default: true
  }
});

const emit = defineEmits(['update:modelValue', 'change', 'selectComplete']);
const model = ref(props.modelValue);
const awesompleteInput = ref(null);

// Sincroniza `modelValue` con el modelo local
watch(() => props.modelValue, (newVal) => {
  model.value = newVal;
});

// Maneja el evento `input` y actualiza `modelValue`
const handleInput = (event) => {
  emit('update:modelValue', event.target.value);
};

// Maneja el evento `change` y emite el valor actualizado
const handleChange = (event) => {
  emit('change', event.target.value);
};

// Inicializa `Awesomplete` y aplica la clase de modo oscuro si es necesario
onMounted(() => {
  const awesompleteInstance = new Awesomplete(awesompleteInput.value, {
    minChars: 3,
    autoFirst: true,
    list: props.list
  });

  // Función para aplicar la clase de modo oscuro al menú de `Awesomplete`
  const applyDarkModeClass = () => {
    const awesompleteMenu = document.querySelector('ul[role="listbox"]');
    if (awesompleteMenu) {
      if (props.isDarkMode) {
        awesompleteMenu.classList.add('awesomplete-dark');
      } else {
        awesompleteMenu.classList.remove('awesomplete-dark');
      }
    }
  };

  // Aplicar el modo oscuro inicial
  applyDarkModeClass();

  // Observa los cambios en la `prop` `isDarkMode` y aplica la clase de modo oscuro si cambia
  watch(() => props.isDarkMode, () => {
    applyDarkModeClass();
  });

  // Enfoca el input y configura el evento para `selectComplete`
  awesompleteInput.value.focus();
  awesompleteInput.value.addEventListener('awesomplete-selectcomplete', (event) => {
    emit('selectComplete', event.text);
  });

  // Observa cambios en la lista y actualiza la instancia de `Awesomplete`
  watch(() => props.list, (newList) => {
    awesompleteInstance.list = newList;
  });
});
</script>

<style>
/* Hacer que el input tenga un ancho del 100% */
.awesomplete {
  width: 100%;
}
#spanbuscador {
  padding: 0px;
}

/* Estilos para el menú de Awesomplete en modo oscuro */
.awesomplete > ul {
    background-color: #f9fafb; /* Fondo gris claro para el modo claro */
    color: #111827; /* Texto gris oscuro */
    border-radius: 0.375rem; /* Borde redondeado */
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1); /* Sombra suave */
    max-height: 200px; /* Altura máxima del menú */
    overflow-y: auto; /* Habilitar scroll vertical */
}

.awesomplete-dark > ul {
    background-color: #1f2937; /* Fondo gris oscuro para el modo oscuro */
    color: #d1d5db; /* Texto gris claro */
    border: 1px solid #4b5563; /* Borde gris medio */
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.7); /* Sombra más intensa */
    max-height: 200px; /* Altura máxima del menú */
    overflow-y: auto; /* Habilitar scroll vertical */
}

/* Triángulo de la lista */
.awesomplete > ul:before, .awesomplete-dark > ul:before {
    content: "";
    position: absolute;
    top: -0.5em;
    left: 1em;
    width: 0;
    height: 0;
    border-left: 0.5em solid transparent;
    border-right: 0.5em solid transparent;
    border-bottom: 0.5em solid #f9fafb; /* Triángulo en modo claro */
}

.awesomplete-dark > ul:before {
    border-bottom-color: #1f2937; /* Triángulo en modo oscuro */
}

/* Estilo de cada elemento del menú */
.awesomplete > ul > li, .awesomplete-dark > ul > li {
    padding: 0.5rem 1rem;
    cursor: pointer;
}

.awesomplete > ul > li:hover {
    background-color: #e5e7eb; /* Hover en gris claro para modo claro */
}

.awesomplete-dark > ul > li:hover {
    background-color: #374151; /* Hover gris oscuro en modo oscuro */
}

/* Estilo del elemento seleccionado */
.awesomplete > ul > li[aria-selected="true"], .awesomplete-dark > ul > li[aria-selected="true"] {
    background-color: #4b5563; /* Fondo para selección */
    color: #ffffff; /* Texto blanco */
}

/* Estilo del marcado (highlight) en el texto */
.awesomplete mark {
    background-color: #fde68a; /* Amarillo claro para marcar coincidencias */
    color: #111827;
}

.awesomplete-dark mark {
    background-color: #fbbf24; /* Amarillo oscuro para marcar coincidencias en modo oscuro */
    color: #111827;
}
</style>
