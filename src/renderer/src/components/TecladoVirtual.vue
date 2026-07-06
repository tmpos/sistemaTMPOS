<template>
  <Sidebar v-model:visible="showKeyboard" header="TECLADO VIRTUAL" position="bottom" style="height: 40vh">
    <div class="scroll-container">
      <div class="keyboard-row" v-for="(row, rowIndex) in keysToShow" :key="rowIndex">
        <button v-for="key in row" :key="key" @click="pressKey(key)" :class="['key-button', { 'key-space': key === ' ' }]">
          {{ key === ' ' ? 'Space' : key }}
        </button>
      </div>
      <div class="keyboard-row">
        <button @click="pressKey('BACKSPACE')" class="key-button key-backspace">⌫</button>
        <button @click="clearInput" class="key-button key-clear">CLEAR</button>
        <button @click="pressKey(' ')" class="key-button key-space">Space</button>
        <button @click="pressKey('.')" class="key-button">.</button>
        <button @click="pressKey(',')" class="key-button">,</button>
        <button @click="toggleKeyboardType" class="key-button key-toggle">{{ isNumeric ? 'ABC' : '123' }}</button>
      </div>
    </div>
  </Sidebar>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue';

const showKeyboard = ref(false);
const focusedInput = ref(null);

// Esta variable controla si el teclado virtual está habilitado o no
const isEnabled = ref(true);  // Por defecto, el teclado virtual está habilitado

const textKeyRows = [
  ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
  ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
  ['Z', 'X', 'C', 'V', 'B', 'N', 'M']
];

const numberKeyRows = [
  ['1', '2', '3','4', '5'],
  [ '6','7', '8', '9','0'],
];

const isNumeric = ref(false);
const keysToShow = ref(textKeyRows);

const toggleKeyboardType = () => {
  isNumeric.value = !isNumeric.value;
  keysToShow.value = isNumeric.value ? numberKeyRows : textKeyRows;
};

const show = (inputElement, keyboardType = 'text') => {
  if (!isEnabled.value) return;  // Si el teclado virtual está deshabilitado, no hacer nada

  focusedInput.value = inputElement;
  isNumeric.value = keyboardType === 'number';
  keysToShow.value = isNumeric.value ? numberKeyRows : textKeyRows;
  showKeyboard.value = true;

  // Asegurarse de que el foco permanezca en el input para el teclado físico
  setTimeout(() => {
    inputElement.focus();
  }, 100);
};

const hide = () => {
  showKeyboard.value = false;
  focusedInput.value = null;
};

const pressKey = (key) => {
  if (focusedInput.value) {
    if (key === 'BACKSPACE') {
      focusedInput.value.value = focusedInput.value.value.slice(0, -1);
    } else {
      const currentValue = focusedInput.value.value;
      focusedInput.value.value = currentValue + key;
    }
    focusedInput.value.dispatchEvent(new Event('input'));
    focusedInput.value.dispatchEvent(new CustomEvent('virtual-keyboard-input', {
      detail: { value: focusedInput.value.value }
    }));
    focusedInput.value.focus();
  }
};

const clearInput = () => {
  if (focusedInput.value) {
    focusedInput.value.value = '';
    focusedInput.value.dispatchEvent(new Event('input'));
    focusedInput.value.dispatchEvent(new CustomEvent('virtual-keyboard-input', {
      detail: { value: '' }
    }));
    focusedInput.value.focus();
  }
};

// Detectar la entrada del teclado físico y ocultar el teclado virtual
const handlePhysicalKeydown = () => {
  hide(); // Ocultar el teclado virtual cuando se usa el físico
};

// Actualizar el estado de `isEnabled` basado en `localStorage`
const updateKeyboardStatus = () => {
  const storedValue = window.localStorage.getItem('TecladoVirtual');
  
  if (storedValue) {
    const verificaTeclado = JSON.parse(storedValue).activado || false;
    isEnabled.value = verificaTeclado;
  } else {
    // Si no existe el ítem 'TecladoVirtual', desactivamos el teclado virtual por defecto
    isEnabled.value = false;
  }
};


onMounted(() => {
  // Inicializar el estado del teclado virtual desde `localStorage`
  updateKeyboardStatus();

  // Escuchar eventos de teclado físico
  document.addEventListener('keydown', handlePhysicalKeydown);

  // Escuchar cambios en `localStorage`
  window.addEventListener('storage', (event) => {
    if (event.key === 'TecladoVirtual') {
      updateKeyboardStatus();
    }
  });
});

onBeforeUnmount(() => {
  document.removeEventListener('keydown', handlePhysicalKeydown);
  window.removeEventListener('storage', updateKeyboardStatus);
});

defineExpose({ show, hide, isEnabled });
</script>

<style scoped>
.scroll-container {
  max-height: 30vh;
  overflow-y: auto;
}

.keyboard-row {
  display: flex;
  justify-content: center;
  margin-bottom: 10px;
}

.key-button {
  width: 100%;
  max-width: 60px;
  margin: 5px;
  padding: 10px;
  font-size: 1.2rem;
  text-align: center;
  cursor: pointer;
  border: none;
  background-color: #f0f0f0;
  border-radius: 5px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
}

.key-button:hover {
  background-color: #e0e0e0;
}

.key-button:active {
  background-color: #d0d0d0;
}

.key-space {
  flex: 2;
  max-width: none;
  text-align: center;
}

.key-backspace,
.key-clear,
.key-toggle {
  flex: 1;
  max-width: none;
  font-size: 1.2rem;
  font-weight: bold;
}

.key-clear {
  background-color: #ff5c5c;
  color: white;
}

.key-clear:hover {
  background-color: #ff4c4c;
}
</style>
