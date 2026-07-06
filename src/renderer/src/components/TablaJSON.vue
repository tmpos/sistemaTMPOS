<template>
  <div class="table-responsive p-3 rounded mb-2 overflow-x-auto">
    <div ref="tablaContainer" class="border p-3 rounded overflow-x-auto"></div>
  </div>
</template>

<script setup>
import { onMounted, watch, ref } from 'vue';
import { generarTablaFromStringJSON } from '../funciones/funciones.js';

const props = defineProps({
  productos: {
    type: [Array, Object], // Acepta tanto arrays como objetos
    required: true,
    validator: (value) => {
      // Validación adicional para asegurarse de que el objeto o array no esté vacío
      if (Array.isArray(value)) {
        return value.length > 0;
      } else if (typeof value === 'object' && value !== null) {
        return Object.keys(value).length > 0;
      }
      return false;
    }
  },
  onEditar: {
    type: Function,
    required: true
  },
  onEliminar: {
    type: Function,
    required: true
  },
  onClickProducto: {
    type: Function,
    required: true
  },
  indice: {
    type: Boolean,
    default: false
  },
  botones: {
    type: Boolean,
    default: false
  },
  tableId: {
    type: String,
    required: true
  },
  customIcons: {
    type: Object,
    default: () => ({ edit: '<i class="pi pi-pencil"></i>', delete: '<i class="pi pi-trash"></i>' })
  },
  rowColorCallback: {
    type: Function,
    default: null
  },
  checkboxField: {
    type: String,
    default: null
  },
  checkboxHeader: {
    type: String,
    default: 'Seleccionar'
  },
  onCheckboxChangeCallback: {
    type: Function,
    default: null
  }
});

const tablaContainer = ref(null);

function renderTabla() {
  if (tablaContainer.value) {
    tablaContainer.value.innerHTML = generarTablaFromStringJSON(
      props.productos,
      props.indice,
      props.botones,
      props.onEditar,
      props.onEliminar,
      props.tableId,
      props.customIcons,
      props.rowColorCallback,
      props.checkboxField,
      props.checkboxHeader,
      props.onCheckboxChangeCallback,
      props.onClickProducto
    );
  }
}

onMounted(renderTabla);
watch(() => props.productos, renderTabla, { deep: true });
</script>
