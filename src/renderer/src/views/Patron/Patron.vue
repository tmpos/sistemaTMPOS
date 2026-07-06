<script setup>
import { ref, onMounted, nextTick, watch, defineEmits, defineProps } from 'vue';
import { encryptarPassword, envioElectron } from '../../funciones/funciones.js';
import { useDatosEmpresa } from '../../stores';
import config from '../../../../../resources/config.json';
import { useToast } from "primevue/usetoast";

const toast = useToast();
const datosEmpresa = useDatosEmpresa();
const production = config.VITE_PRODUCTION;
const link = ref(config.VITE_LINKURL);
const api = ref(config.VITE_LINK_API);
const token = ref(config.VITE_TOKEN);
const patronTelefono = ref(config.VITE_PATRON_TELEFONO);
const linkImpresora = ref(config.VITE_IMPRESORA_LOCAL);
const patroncedula = ref(config.VITE_PATRON_CEDULA);
const tokenCifrado = ref(null);

document.body.classList.add('sidebar-close');

onMounted(async () => {
  if (production == 'false') {
    const datosJSON = await envioElectron('datosarchivo');
    link.value = datosJSON.VITE_LINKURL;
    api.value = datosJSON.VITE_LINK_API;
    token.value = datosJSON.VITE_TOKEN;
    patronTelefono.value = datosJSON.VITE_PATRON_TELEFONO;
    linkImpresora.value = datosJSON.VITE_IMPRESORA_LOCAL;
  }
  tokenCifrado.value = await encryptarPassword(token.value, 10);
  if (!datosEmpresa.empresa.nombre) {
    await datosEmpresa.inicializarDatosEmpresa(link.value + api.value);
  }
});

const props = defineProps({
  visiblePatron: {
    type: Boolean,
    required: true
  },
  patron: {
    type: String,
    default: ''
  }
});
const emit = defineEmits(['close']);
const rowCount = ref(3);
const columnCount = ref(3);
const isDrawing = ref(false);
const pattern = ref([]);

const drawExistingPattern = () => {
  resetPattern();
  if (props.patron) {
    const positions = props.patron.split('-');
    positions.forEach((position, index) => {
      const number = parseInt(position, 10);
      const rowIndex = Math.floor((number - 1) / columnCount.value);
      const colIndex = (number - 1) % columnCount.value;
      nextTick(() => {
        const dot = document.querySelector(`.pattern-row:nth-child(${rowIndex + 2}) .pattern-dot:nth-child(${colIndex + 1})`);
        if (dot) {
          dot.style.backgroundColor = '#059669';
          if (index > 0) {
            const prevNumber = parseInt(positions[index - 1], 10);
            const prevRowIndex = Math.floor((prevNumber - 1) / columnCount.value);
            const prevColIndex = (prevNumber - 1) % columnCount.value;
            addArrow(prevRowIndex, prevColIndex, rowIndex, colIndex);
          }
        }
      });
    });
  }
};

const resetPattern = () => {
  pattern.value = [];
  document.querySelectorAll('.pattern-dot').forEach(dot => {
    dot.style.backgroundColor = 'black';
    dot.className = 'pattern-dot';
  });
};

const addArrow = (prevRowIndex, prevColIndex, rowIndex, colIndex) => {
  const direction = getDirection(prevRowIndex, prevColIndex, rowIndex, colIndex);
  const dot = document.querySelector(`.pattern-row:nth-child(${prevRowIndex + 2}) .pattern-dot:nth-child(${prevColIndex + 1})`);
  if (dot) {
    const arrow = document.createElement('i');
    arrow.className = `fas ${direction}`;
    dot.appendChild(arrow);
  }
};

const getDirection = (prevRowIndex, prevColIndex, rowIndex, colIndex) => {
  const rowDiff = rowIndex - prevRowIndex;
  const colDiff = colIndex - prevColIndex;
  if (rowDiff === 0 && colDiff === 1) return 'fa-arrow-right';
  if (rowDiff === 0 && colDiff === -1) return 'fa-arrow-left';
  if (rowDiff === 1 && colDiff === 0) return 'fa-arrow-down';
  if (rowDiff === -1 && colDiff === 0) return 'fa-arrow-up';
  if (rowDiff === 1 && colDiff === 1) return 'fa-arrow-down-right';
  if (rowDiff === 1 && colDiff === -1) return 'fa-arrow-down-left';
  if (rowDiff === -1 && colDiff === 1) return 'fa-arrow-up-right';
  if (rowDiff === -1 && colDiff === -1) return 'fa-arrow-up-left';
  return '';
};

/*watch(() => props.visiblePatron, (newVal) => {
  if (newVal) {
    nextTick(() => {
      drawExistingPattern();
    });
  }
});*/

watch(() => props.patron, () => {
  if (props.visiblePatron) {
    nextTick(() => {
      drawExistingPattern();
    });
  }
});
</script>

<template>
  <Dialog v-model:visible="props.visiblePatron" modal header="Ver Patrón" :style="{ width: '30rem' }" @hide="emit('close')">
    <fieldset class="border p-3 rounded mb-2">
      <legend class="float-none w-auto px-2">PATRON</legend>
        <div v-for="(row, rowIndex) in rowCount" :key="rowIndex" class="pattern-row">
          <div v-for="(col, colIndex) in columnCount" :key="colIndex" class="pattern-dot"></div>
        </div>
    </fieldset>
    <template #footer>
      <Button label="Cerrar" outlined severity="secondary" @click="emit('close')" />
    </template>
  </Dialog>
  <Toast />
</template>

<style scoped>
#pattern-container {
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
}

.pattern-row {
  display: flex;
  justify-content: center;
}

.pattern-dot {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background-color: black;
  margin: 5px;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 16px;
  color: white;
  position: relative;
  transition: background-color 0.3s;
}

.pattern-dot i {
  position: absolute;
  color: white;
  font-size: 1.5rem;
}

.pattern-dot:hover {
  cursor: pointer;
}
</style>
