<script setup>
import { ref, onMounted, computed, watch } from 'vue';
import { useToast } from 'primevue/usetoast';
import { nfecha, peticionesFetchOffline, crearTablaSiNoExisteOffline, arrayToObjetoFromTablaOffline } from '@/funciones/funciones.js';
import { useDatosEmpresa } from '@/stores';
import Swal from 'sweetalert2';

const toast = useToast();
const datosEmpresa = useDatosEmpresa();

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  producto: {
    type: Object,
    default: null
  }
});

const emit = defineEmits(['update:visible', 'refresh']);

const loading = ref(false);
const vistaActual = ref('registrar'); // 'registrar' o 'historial'

// Computed para manejar el v-model correctamente
const localVisible = computed({
  get: () => props.visible,
  set: (value) => emit('update:visible', value)
});

// Formulario de registro
const formulario = ref({
  codigo_producto: '',
  nombre_producto: '',
  cantidad: 1,
  motivo_baja: '',
  descripcion_dano: '',
  estado: 'Dado de baja',
  fecha: nfecha('fecha'),
  hora: nfecha('hora'),
  usuario: ''
});

// Lista de productos dañados
const productosDanados = ref([]);
const searchQuery = ref('');

// Selector de productos
const productosDisponibles = ref([]);
const productoSeleccionado = ref(null);
const filteredProductos = ref([]);

// IMEIs para CELULARES y ELECTRODOMESTICOS
const categoriaProductoSeleccionado = ref('');
const imeiDisponibles = ref([]);
const imeisSeleccionados = ref([]);

// Opciones para los selects
const motivosBaja = [
  'Producto dañado',
  'Mal estado',
  'Vencido',
  'Defectuoso',
  'Deteriorado',
  'Otro'
];

const estadosProducto = [
  'Dado de baja',
  'En reparación',
  'Reparado',
  'Devuelto a inventario',
  'Desechado',
  'Vendido como defectuoso'
];

// Computed para filtrar productos
const productosFiltrados = computed(() => {
  if (!searchQuery.value) return productosDanados.value;

  const query = searchQuery.value.toLowerCase();
  return productosDanados.value.filter(p =>
    p.nombre_producto?.toLowerCase().includes(query) ||
    p.codigo_producto?.toLowerCase().includes(query) ||
    p.motivo_baja?.toLowerCase().includes(query) ||
    p.estado?.toLowerCase().includes(query)
  );
});

// Watch para cuando se abre el modal y hay un producto
watch(() => props.visible, (newVal) => {
  if (newVal && props.producto) {
    formulario.value.codigo_producto = props.producto.codigo || props.producto.codigo_barra || '';
    formulario.value.nombre_producto = props.producto.nombre || props.producto.descripcion || '';
  }
});

// Inicializar
onMounted(async () => {
  await inicializarTabla();
  await cargarDatos();
  await cargarProductos();
});

// Crear tabla si no existe
const inicializarTabla = async () => {
  const camposArray = [
    'codigo_producto',
    'nombre_producto',
    'cantidad',
    'imei_serial',
    'motivo_baja',
    'descripcion_dano',
    'estado',
    'fecha',
    'hora',
    'usuario'
  ];

  await crearTablaSiNoExisteOffline('productos_danados', camposArray.join(','), toast);
};

// Cargar datos
const cargarDatos = async () => {
  try {
    const datos = await peticionesFetchOffline('getDataAsArray', 'productos_danados', '');
    productosDanados.value = datos.sort((a, b) => {
      return new Date(b.created_at) - new Date(a.created_at);
    });
  } catch (error) {
    console.error('Error al cargar productos dañados:', error);
  }
};

// Cargar productos disponibles
const cargarProductos = async () => {
  try {
    const datos = await peticionesFetchOffline('getDataAsArray', 'productos', '');
    productosDisponibles.value = datos.map(p => ({
      ...p,
      label: `${p.codigo || p.codigo_barra} - ${p.nombre} (Stock: ${p.stock})`,
      value: p.id
    }));
  } catch (error) {
    console.error('Error al cargar productos:', error);
  }
};

// Buscar productos (para el autocomplete)
const buscarProducto = (event) => {
  if (!event.query.trim().length) {
    filteredProductos.value = [...productosDisponibles.value];
  } else {
    const query = event.query.toLowerCase();
    filteredProductos.value = productosDisponibles.value.filter(p =>
      p.nombre?.toLowerCase().includes(query) ||
      p.codigo?.toLowerCase().includes(query) ||
      p.codigo_barra?.toLowerCase().includes(query)
    );
  }
};

// Cuando se selecciona un producto
const onProductoSelect = async (event) => {
  if (event.value) {
    const producto = productosDisponibles.value.find(p => p.id === event.value.id);
    if (producto) {
      formulario.value.codigo_producto = producto.codigo || producto.codigo_barra;
      formulario.value.nombre_producto = producto.nombre;
      categoriaProductoSeleccionado.value = producto.categoria;

      // Si es CELULARES o ELECTRODOMESTICOS, cargar IMEIs disponibles
      imeisSeleccionados.value = [];
      if (producto.categoria === 'CELULARES' || producto.categoria === 'ELECTRODOMESTICOS') {
        try {
          const responseImei = await peticionesFetchOffline('getDataArrayByTwoConditions', 'imei', 'id_equi', producto.id, 'estado', 'DISPONIBLE');
          imeiDisponibles.value = responseImei;

          if (imeiDisponibles.value.length === 0) {
            toast.add({
              severity: 'warn',
              summary: 'Advertencia',
              detail: 'Este producto no tiene IMEI/Seriales disponibles',
              life: 4000
            });
          }
        } catch (error) {
          console.error('Error al cargar IMEIs:', error);
          imeiDisponibles.value = [];
        }
      } else {
        imeiDisponibles.value = [];
      }

      toast.add({
        severity: 'success',
        summary: 'Producto Seleccionado',
        detail: `${producto.nombre}`,
        life: 3000
      });
    }
  }
};

// Registrar producto dañado
const registrarProductoDanado = async () => {
  if (!formulario.value.codigo_producto || !formulario.value.nombre_producto) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Debe especificar el producto',
      life: 3000
    });
    return;
  }

  if (!formulario.value.motivo_baja) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Debe especificar el motivo de baja',
      life: 3000
    });
    return;
  }

  // Si es CELULARES o ELECTRODOMESTICOS, verificar que se hayan seleccionado IMEIs
  if (categoriaProductoSeleccionado.value === 'CELULARES' || categoriaProductoSeleccionado.value === 'ELECTRODOMESTICOS') {
    if (imeisSeleccionados.value.length === 0) {
      toast.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Debe seleccionar al menos un IMEI/Serial',
        life: 3000
      });
      return;
    }

    loading.value = true;

    try {
      // Procesar cada IMEI/Serial seleccionado
      for (const imeiData of imeisSeleccionados.value) {
        // Registrar en productos_danados
        const datos = {
          codigo_producto: formulario.value.codigo_producto,
          nombre_producto: formulario.value.nombre_producto,
          cantidad: 1,
          imei_serial: imeiData.imei,
          motivo_baja: formulario.value.motivo_baja,
          descripcion_dano: formulario.value.descripcion_dano,
          estado: formulario.value.estado,
          fecha: nfecha('fecha'),
          hora: nfecha('hora'),
          usuario: datosEmpresa.usuario.nombre,
          created_at: nfecha('timestamp'),
          updated_at: nfecha('timestamp')
        };

        await peticionesFetchOffline('insertData', 'productos_danados', JSON.stringify(datos));

        // Actualizar estado del IMEI a 'DANADO'
        imeiData.estado = 'DANADO';
        imeiData.updated_at = nfecha('timestamp');
        await peticionesFetchOffline('updateData', 'imei', JSON.stringify(imeiData));
      }

      // Buscar el producto original para actualizar su stock
      const productosData = await peticionesFetchOffline('getDataAsArray', 'productos', '');
      const productoOriginal = productosData.find(p =>
        (p.codigo === formulario.value.codigo_producto || p.codigo_barra === formulario.value.codigo_producto)
      );

      if (productoOriginal) {
        // Actualizar stock del producto basándose en IMEIs disponibles restantes
        const responseImeiDisponibles = await peticionesFetchOffline('getDataArrayByTwoConditions', 'imei', 'id_equi', productoOriginal.id, 'estado', 'DISPONIBLE');
        productoOriginal.stock = responseImeiDisponibles.length;
        productoOriginal.updated_at = nfecha('timestamp');
        await peticionesFetchOffline('updateData', 'productos', JSON.stringify(productoOriginal));
      }

      toast.add({
        severity: 'success',
        summary: 'Éxito',
        detail: `${imeisSeleccionados.value.length} producto(s) pasado(s) a dañados`,
        life: 3000
      });

      limpiarFormulario();
      await cargarDatos();
      vistaActual.value = 'historial';
      emit('refresh');

    } catch (error) {
      console.error('Error:', error);
      toast.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Error al procesar la solicitud',
        life: 3000
      });
    } finally {
      loading.value = false;
    }

  } else {
    // Productos regulares (sin IMEI)
    if (formulario.value.cantidad <= 0) {
      toast.add({
        severity: 'error',
        summary: 'Error',
        detail: 'La cantidad debe ser mayor a 0',
        life: 3000
      });
      return;
    }

    loading.value = true;

    try {
      const datos = {
        ...formulario.value,
        usuario: datosEmpresa.usuario.nombre,
        fecha: nfecha('fecha'),
        hora: nfecha('hora'),
        created_at: nfecha('timestamp'),
        updated_at: nfecha('timestamp')
      };

      const resultado = await peticionesFetchOffline('insertData', 'productos_danados', JSON.stringify(datos));

      if (resultado[0] === 'ok') {
        toast.add({
          severity: 'success',
          summary: 'Éxito',
          detail: 'Producto registrado como dañado',
          life: 3000
        });

        limpiarFormulario();
        await cargarDatos();
        vistaActual.value = 'historial';
        emit('refresh');
      } else {
        toast.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Error al registrar el producto',
          life: 3000
        });
      }
    } catch (error) {
      console.error('Error:', error);
      toast.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Error al procesar la solicitud',
        life: 3000
      });
    } finally {
      loading.value = false;
    }
  }
};

// Cambiar estado de producto
const cambiarEstado = async (producto) => {
  const { value: nuevoEstado } = await Swal.fire({
    title: 'Cambiar Estado',
    text: `Producto: ${producto.nombre_producto}`,
    input: 'select',
    inputOptions: estadosProducto.reduce((obj, estado) => {
      obj[estado] = estado;
      return obj;
    }, {}),
    inputValue: producto.estado,
    showCancelButton: true,
    confirmButtonText: 'Actualizar',
    cancelButtonText: 'Cancelar',
    inputValidator: (value) => {
      if (!value) {
        return 'Debe seleccionar un estado';
      }
    }
  });

  if (nuevoEstado) {
    loading.value = true;
    try {
      const datosActualizados = {
        ...producto,
        estado: nuevoEstado,
        updated_at: nfecha('timestamp')
      };

      const resultado = await peticionesFetchOffline('updateData', 'productos_danados', JSON.stringify(datosActualizados));

      if (resultado[0] === 'ok') {
        toast.add({
          severity: 'success',
          summary: 'Éxito',
          detail: 'Estado actualizado correctamente',
          life: 3000
        });
        await cargarDatos();
      }
    } catch (error) {
      console.error('Error:', error);
      toast.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Error al actualizar el estado',
        life: 3000
      });
    } finally {
      loading.value = false;
    }
  }
};

// Eliminar registro
const eliminarRegistro = async (producto) => {
  const result = await Swal.fire({
    title: '¿Está seguro?',
    text: `¿Desea eliminar el registro de "${producto.nombre_producto}"?`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Sí, eliminar',
    cancelButtonText: 'Cancelar',
    confirmButtonColor: '#d33',
    cancelButtonColor: '#3085d6'
  });

  if (result.isConfirmed) {
    loading.value = true;
    try {
      const resultado = await peticionesFetchOffline('deleteEntry', 'productos_danados', producto.id);

      if (resultado[0] === 'ok') {
        toast.add({
          severity: 'success',
          summary: 'Éxito',
          detail: 'Registro eliminado correctamente',
          life: 3000
        });
        await cargarDatos();
      }
    } catch (error) {
      console.error('Error:', error);
      toast.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Error al eliminar el registro',
        life: 3000
      });
    } finally {
      loading.value = false;
    }
  }
};

// Limpiar formulario
const limpiarFormulario = () => {
  productoSeleccionado.value = null;
  categoriaProductoSeleccionado.value = '';
  imeiDisponibles.value = [];
  imeisSeleccionados.value = [];
  formulario.value = {
    codigo_producto: props.producto?.codigo || props.producto?.codigo_barra || '',
    nombre_producto: props.producto?.nombre || props.producto?.descripcion || '',
    cantidad: 1,
    motivo_baja: '',
    descripcion_dano: '',
    estado: 'Dado de baja',
    fecha: nfecha('fecha'),
    hora: nfecha('hora'),
    usuario: ''
  };
};

// Cerrar modal
const cerrar = () => {
  localVisible.value = false;
  emit('update:visible', false);
  limpiarFormulario();
  vistaActual.value = 'registrar';
};

// Obtener clase de badge según estado
const getEstadoBadgeClass = (estado) => {
  const clases = {
    'Dado de baja': 'bg-red-100 text-red-700',
    'En reparación': 'bg-yellow-100 text-yellow-700',
    'Reparado': 'bg-green-100 text-green-700',
    'Devuelto a inventario': 'bg-blue-100 text-blue-700',
    'Desechado': 'bg-gray-100 text-gray-700',
    'Vendido como defectuoso': 'bg-purple-100 text-purple-700'
  };
  return clases[estado] || 'bg-gray-100 text-gray-700';
};
</script>

<template>
  <Dialog
    v-model:visible="localVisible"
    modal
    :header="'Productos Dañados / Mal Estado'"
    :style="{ width: '80rem' }"
    :dismissableMask="false"
  >
    <template #header>
      <div class="flex items-center gap-3">
        <div class="bg-red-500 rounded-full p-2">
          <i class="pi pi-exclamation-triangle text-white text-xl"></i>
        </div>
        <div>
          <h2 class="text-2xl font-bold text-gray-800 m-0">Gestión de Productos Dañados</h2>
          <p class="text-sm text-gray-500 m-0">Registro y seguimiento de productos dados de baja</p>
        </div>
      </div>
    </template>

    <!-- Pestañas de navegación -->
    <div class="mb-4 border-b border-gray-200">
      <nav class="flex gap-4">
        <button
          @click="vistaActual = 'registrar'"
          :class="[
            'px-4 py-2 font-medium text-sm border-b-2 transition-colors',
            vistaActual === 'registrar'
              ? 'border-red-500 text-red-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          ]"
        >
          <i class="pi pi-plus-circle mr-2"></i>Registrar Producto Dañado
        </button>
        <button
          @click="vistaActual = 'historial'"
          :class="[
            'px-4 py-2 font-medium text-sm border-b-2 transition-colors',
            vistaActual === 'historial'
              ? 'border-red-500 text-red-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          ]"
        >
          <i class="pi pi-list mr-2"></i>Historial ({{ productosDanados.length }})
        </button>
      </nav>
    </div>

    <!-- Vista de Registro -->
    <div v-if="vistaActual === 'registrar'" class="space-y-4">
      <div class="bg-orange-50 p-4 rounded-lg border-l-4 border-orange-500">
        <h3 class="text-lg font-semibold mb-3 text-gray-700">
          <i class="pi pi-info-circle mr-2"></i>Información del Producto
        </h3>
        <div class="grid grid-cols-1 gap-4">
          <!-- Selector de Producto -->
          <div class="md:col-span-2">
            <label for="producto_selector" class="block text-sm font-medium text-gray-700 mb-2">
              Buscar y Seleccionar Producto <span class="text-red-500">*</span>
            </label>
            <AutoComplete
              v-model="productoSeleccionado"
              :suggestions="filteredProductos"
              @complete="buscarProducto"
              @item-select="onProductoSelect"
              optionLabel="label"
              placeholder="Buscar por código, nombre o descripción..."
              class="w-full"
              dropdown
              forceSelection
            >
              <template #option="slotProps">
                <div class="flex items-center gap-2">
                  <div>
                    <div class="font-medium">{{ slotProps.option.nombre }}</div>
                    <div class="text-xs text-gray-500">
                      Código: {{ slotProps.option.codigo || slotProps.option.codigo_barra }} |
                      Stock: {{ slotProps.option.stock }} |
                      {{ slotProps.option.categoria }}
                    </div>
                  </div>
                </div>
              </template>
            </AutoComplete>
            <small class="text-gray-500">
              <i class="pi pi-info-circle mr-1"></i>
              Escribe para buscar o haz clic en la flecha para ver todos los productos
            </small>
          </div>
        </div>

        <!-- Información del Producto Seleccionado -->
        <div v-if="formulario.codigo_producto" class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 pt-4 border-t border-orange-200">
          <div>
            <label for="codigo_producto" class="block text-sm font-medium text-gray-700 mb-2">
              Código del Producto
            </label>
            <InputText
              id="codigo_producto"
              v-model="formulario.codigo_producto"
              placeholder="Código o código de barras"
              class="w-full"
              readonly
              disabled
            />
          </div>

          <div>
            <label for="nombre_producto" class="block text-sm font-medium text-gray-700 mb-2">
              Nombre del Producto
            </label>
            <InputText
              id="nombre_producto"
              v-model="formulario.nombre_producto"
              placeholder="Nombre o descripción"
              class="w-full"
              readonly
              disabled
            />
          </div>

          <!-- Selección de IMEI/Serial para CELULARES y ELECTRODOMESTICOS -->
          <div v-if="categoriaProductoSeleccionado === 'CELULARES' || categoriaProductoSeleccionado === 'ELECTRODOMESTICOS'" class="md:col-span-2">
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Seleccione los IMEI/Seriales a pasar como dañados <span class="text-red-500">*</span>
            </label>
            <div class="border rounded-lg p-3 max-h-64 overflow-y-auto bg-white">
              <div v-if="imeiDisponibles.length === 0" class="text-center text-gray-500 py-4">
                No hay IMEI/Seriales disponibles
              </div>
              <div v-else class="space-y-2">
                <div v-for="imeiData in imeiDisponibles" :key="imeiData.id" class="flex items-center p-2 hover:bg-gray-50 rounded">
                  <Checkbox
                    v-model="imeisSeleccionados"
                    :value="imeiData"
                    :inputId="`imei-modal-${imeiData.id}`"
                  />
                  <label :for="`imei-modal-${imeiData.id}`" class="ml-3 cursor-pointer flex-1">
                    <div class="font-medium text-gray-900">{{ imeiData.imei }}</div>
                    <div class="text-xs text-gray-500">Fecha: {{ imeiData.fecha }}</div>
                  </label>
                </div>
              </div>
            </div>
            <div class="flex items-center justify-between mt-2">
              <div class="text-sm text-gray-600">
                <i class="pi pi-info-circle mr-1"></i>
                Seleccionados: {{ imeisSeleccionados.length }} de {{ imeiDisponibles.length }}
              </div>
              <div class="flex gap-2">
                <Button
                  label="Todos"
                  icon="pi pi-check-square"
                  severity="secondary"
                  outlined
                  size="small"
                  @click="imeisSeleccionados = [...imeiDisponibles]"
                  :disabled="imeiDisponibles.length === 0"
                />
                <Button
                  label="Ninguno"
                  icon="pi pi-stop"
                  severity="secondary"
                  outlined
                  size="small"
                  @click="imeisSeleccionados = []"
                />
              </div>
            </div>
          </div>

          <!-- Cantidad para otros productos -->
          <div v-else>
            <label for="cantidad" class="block text-sm font-medium text-gray-700 mb-2">
              Cantidad <span class="text-red-500">*</span>
            </label>
            <InputNumber
              id="cantidad"
              v-model="formulario.cantidad"
              :min="1"
              showButtons
              class="w-full"
            />
          </div>

          <div>
            <label for="motivo_baja" class="block text-sm font-medium text-gray-700 mb-2">
              Motivo de Baja <span class="text-red-500">*</span>
            </label>
            <Select
              id="motivo_baja"
              v-model="formulario.motivo_baja"
              :options="motivosBaja"
              placeholder="Seleccione motivo"
              class="w-full"
            />
          </div>
        </div>
      </div>

      <div class="bg-red-50 p-4 rounded-lg border-l-4 border-red-500">
        <h3 class="text-lg font-semibold mb-3 text-gray-700">
          <i class="pi pi-file-edit mr-2"></i>Detalles del Daño
        </h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="md:col-span-2">
            <label for="descripcion_dano" class="block text-sm font-medium text-gray-700 mb-2">
              Descripción del Daño
            </label>
            <Textarea
              id="descripcion_dano"
              v-model="formulario.descripcion_dano"
              rows="4"
              placeholder="Describa detalladamente el daño o problema del producto..."
              class="w-full"
            />
          </div>

          <div>
            <label for="estado" class="block text-sm font-medium text-gray-700 mb-2">
              Estado Inicial
            </label>
            <Select
              id="estado"
              v-model="formulario.estado"
              :options="estadosProducto"
              placeholder="Seleccione estado"
              class="w-full"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Vista de Historial -->
    <div v-else class="space-y-4">
      <!-- Buscador -->
      <div class="flex items-center gap-2">
        <span class="p-input-icon-left w-full">
          <i class="pi pi-search" />
          <InputText
            v-model="searchQuery"
            placeholder="Buscar por producto, código, motivo o estado..."
            class="w-full"
          />
        </span>
      </div>

      <!-- Tabla de productos dañados -->
      <DataTable
        :value="productosFiltrados"
        paginator
        :rows="10"
        :rowsPerPageOptions="[5, 10, 20, 50]"
        scrollable
        scrollHeight="500px"
        class="mt-4"
      >
        <Column field="fecha" header="Fecha" style="min-width: 100px">
          <template #body="{ data }">
            <div class="text-sm">
              <div class="font-medium">{{ data.fecha }}</div>
              <div class="text-gray-500">{{ data.hora }}</div>
            </div>
          </template>
        </Column>

        <Column field="codigo_producto" header="Código" style="min-width: 120px">
          <template #body="{ data }">
            <span class="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
              {{ data.codigo_producto }}
            </span>
          </template>
        </Column>

        <Column field="nombre_producto" header="Producto" style="min-width: 200px">
          <template #body="{ data }">
            <div class="font-medium">{{ data.nombre_producto }}</div>
          </template>
        </Column>

        <Column field="cantidad" header="Cant." style="min-width: 80px" class="text-center">
          <template #body="{ data }">
            <span class="font-bold">{{ data.cantidad }}</span>
          </template>
        </Column>

        <Column field="imei_serial" header="IMEI/Serial" style="min-width: 150px">
          <template #body="{ data }">
            <span v-if="data.imei_serial" class="font-mono text-xs bg-blue-50 px-2 py-1 rounded">
              {{ data.imei_serial }}
            </span>
            <span v-else class="text-gray-400 text-xs">N/A</span>
          </template>
        </Column>

        <Column field="motivo_baja" header="Motivo" style="min-width: 150px">
          <template #body="{ data }">
            <div class="text-sm">{{ data.motivo_baja }}</div>
          </template>
        </Column>

        <Column field="descripcion_dano" header="Descripción" style="min-width: 200px">
          <template #body="{ data }">
            <div class="text-sm text-gray-600 truncate" :title="data.descripcion_dano">
              {{ data.descripcion_dano || 'Sin descripción' }}
            </div>
          </template>
        </Column>

        <Column field="estado" header="Estado" style="min-width: 180px">
          <template #body="{ data }">
            <span
              :class="[
                'px-3 py-1 rounded-full text-xs font-semibold',
                getEstadoBadgeClass(data.estado)
              ]"
            >
              {{ data.estado }}
            </span>
          </template>
        </Column>

        <Column field="usuario" header="Usuario" style="min-width: 120px">
          <template #body="{ data }">
            <div class="text-sm">{{ data.usuario }}</div>
          </template>
        </Column>

        <Column header="Acciones" style="min-width: 150px">
          <template #body="{ data }">
            <div class="flex gap-2">
              <Button
                icon="pi pi-sync"
                severity="info"
                size="small"
                @click="cambiarEstado(data)"
                v-tooltip.top="'Cambiar estado'"
              />
              <Button
                icon="pi pi-trash"
                severity="danger"
                size="small"
                @click="eliminarRegistro(data)"
                v-tooltip.top="'Eliminar'"
              />
            </div>
          </template>
        </Column>
      </DataTable>

      <!-- Mensaje si no hay datos -->
      <div v-if="productosFiltrados.length === 0" class="text-center py-8">
        <i class="pi pi-inbox text-6xl text-gray-300 mb-4"></i>
        <p class="text-gray-500">No hay registros de productos dañados</p>
      </div>
    </div>

    <template #footer>
      <div class="flex justify-between items-center">
        <div v-if="vistaActual === 'registrar'" class="text-sm text-gray-500">
          <i class="pi pi-info-circle mr-1"></i>
          Los campos marcados con <span class="text-red-500">*</span> son obligatorios
        </div>
        <div v-else class="text-sm text-gray-500">
          <i class="pi pi-database mr-1"></i>
          Total de registros: {{ productosDanados.length }}
        </div>

        <div class="flex gap-2">
          <Button
            label="Cerrar"
            icon="pi pi-times"
            severity="secondary"
            outlined
            @click="cerrar"
          />
          <Button
            v-if="vistaActual === 'registrar'"
            label="Registrar Producto Dañado"
            icon="pi pi-save"
            severity="danger"
            @click="registrarProductoDanado"
            :loading="loading"
          />
        </div>
      </div>
    </template>
  </Dialog>
</template>

<style scoped>
.truncate {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 200px;
}
</style>
