<script setup>
import { ref, onMounted, computed, watch } from 'vue';
import { useToast } from 'primevue/usetoast';
import { nfecha, peticionesFetchOffline, crearTablaSiNoExisteOffline, envioElectron, encryptarPassword } from '@/funciones/funciones.js';
import { facturaNueva } from '@/funciones/funcionesVentas.js';
import { useDatosEmpresa } from '@/stores';
import Swal from 'sweetalert2';
import FacturaPdfPrint from '@/components/FacturaPdfPrint.vue';

const toast = useToast();
const datosEmpresa = useDatosEmpresa();

// Variables para generar factura
const link = ref('');
const api = ref('');
const token = ref('');
const tokenCifrado = ref('');

// Referencia al componente de impresión
const facturaPdfPrintRef = ref(null);

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
  motivo_retiro: '',
  area_uso: '',
  descripcion: '',
  estado: 'En uso',
  fecha: nfecha('fecha'),
  hora: nfecha('hora'),
  usuario: ''
});

// Lista de productos de uso interno
const productosUsoInterno = ref([]);
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
const motivosRetiro = [
  'Reparación',
  'Uso en tienda',
  'Demostración',
  'Uso administrativo',
  'Reemplazo temporal',
  'Prueba de calidad',
  'Otro'
];

const areasUso = [
  'Taller/Reparación',
  'Sala de ventas',
  'Oficina administrativa',
  'Área de exhibición',
  'Laboratorio',
  'Bodega',
  'Otro'
];

const estadosProducto = [
  'En uso',
  'Devuelto a inventario',
  'Consumido',
  'En proceso',
  'Finalizado'
];

// Computed para filtrar productos
const productosFiltrados = computed(() => {
  if (!searchQuery.value) return productosUsoInterno.value;

  const query = searchQuery.value.toLowerCase();
  return productosUsoInterno.value.filter(p =>
    p.nombre_producto?.toLowerCase().includes(query) ||
    p.codigo_producto?.toLowerCase().includes(query) ||
    p.motivo_retiro?.toLowerCase().includes(query) ||
    p.area_uso?.toLowerCase().includes(query) ||
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
  // Cargar configuración para facturación
  const datosJSON = await envioElectron('datosarchivo');
  link.value = datosJSON.VITE_LINKURL;
  api.value = datosJSON.VITE_LINK_API;
  token.value = datosJSON.VITE_TOKEN;
  tokenCifrado.value = await encryptarPassword(token.value, 10);

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
    'motivo_retiro',
    'area_uso',
    'descripcion',
    'estado',
    'fecha',
    'hora',
    'usuario'
  ];

  await crearTablaSiNoExisteOffline('productos_uso_interno', camposArray.join(','), toast);
};

// Cargar datos
const cargarDatos = async () => {
  try {
    const datos = await peticionesFetchOffline('getDataAsArray', 'productos_uso_interno', '');
    productosUsoInterno.value = datos.sort((a, b) => {
      return new Date(b.created_at) - new Date(a.created_at);
    });
  } catch (error) {
    console.error('Error al cargar productos de uso interno:', error);
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

// Registrar producto de uso interno
const registrarProductoUsoInterno = async () => {
  if (!formulario.value.codigo_producto || !formulario.value.nombre_producto) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Debe especificar el producto',
      life: 3000
    });
    return;
  }

  if (!formulario.value.motivo_retiro) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Debe especificar el motivo de retiro',
      life: 3000
    });
    return;
  }

  if (!formulario.value.area_uso) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Debe especificar el área de uso',
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
        // Registrar en productos_uso_interno
        const datos = {
          codigo_producto: formulario.value.codigo_producto,
          nombre_producto: formulario.value.nombre_producto,
          cantidad: 1,
          imei_serial: imeiData.imei,
          motivo_retiro: formulario.value.motivo_retiro,
          area_uso: formulario.value.area_uso,
          descripcion: formulario.value.descripcion,
          estado: formulario.value.estado,
          fecha: nfecha('fecha'),
          hora: nfecha('hora'),
          usuario: datosEmpresa.usuario.nombre,
          created_at: nfecha('timestamp'),
          updated_at: nfecha('timestamp')
        };

        await peticionesFetchOffline('insertData', 'productos_uso_interno', JSON.stringify(datos));

        // Actualizar estado del IMEI a 'USO_INTERNO'
        imeiData.estado = 'USO_INTERNO';
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
        detail: `${imeisSeleccionados.value.length} producto(s) retirado(s) para uso interno`,
        life: 3000
      });

      limpiarFormulario();
      await cargarDatos();
      vistaActual.value = 'historial';
      emit('refresh');

      // Cerrar modal antes de mostrar confirmación
      localVisible.value = false;

      // Preguntar si desea generar factura
      const { isConfirmed } = await Swal.fire({
        title: '¿Generar Factura?',
        html: `<p>¿Desea generar una factura para el producto de uso interno?</p>
               <p class="text-sm text-gray-600 mt-2">La factura se generará con precio en <strong>CERO</strong></p>`,
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Sí, Generar Factura',
        cancelButtonText: 'No',
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#6b7280'
      });

      if (isConfirmed && productoOriginal) {
        await generarFacturaUsoInterno(
          productoOriginal,
          imeisSeleccionados.value.length,
          imeisSeleccionados.value.map(i => i.imei)
        );
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

      const resultado = await peticionesFetchOffline('insertData', 'productos_uso_interno', JSON.stringify(datos));

      if (resultado[0] === 'ok') {
        // Actualizar stock del producto
        const productosData = await peticionesFetchOffline('getDataAsArray', 'productos', '');
        const productoOriginal = productosData.find(p =>
          (p.codigo === formulario.value.codigo_producto || p.codigo_barra === formulario.value.codigo_producto)
        );

        if (productoOriginal) {
          productoOriginal.stock = Number(productoOriginal.stock) - formulario.value.cantidad;
          productoOriginal.updated_at = nfecha('timestamp');
          await peticionesFetchOffline('updateData', 'productos', JSON.stringify(productoOriginal));
        }

        toast.add({
          severity: 'success',
          summary: 'Éxito',
          detail: 'Producto retirado para uso interno',
          life: 3000
        });

        limpiarFormulario();
        await cargarDatos();
        vistaActual.value = 'historial';
        emit('refresh');

        // Cerrar modal antes de mostrar confirmación
        localVisible.value = false;

        // Preguntar si desea generar factura
        const { isConfirmed } = await Swal.fire({
          title: '¿Generar Factura?',
          html: `<p>¿Desea generar una factura para el producto de uso interno?</p>
                 <p class="text-sm text-gray-600 mt-2">La factura se generará con precio en <strong>CERO</strong></p>`,
          icon: 'question',
          showCancelButton: true,
          confirmButtonText: 'Sí, Generar Factura',
          cancelButtonText: 'No',
          confirmButtonColor: '#3085d6',
          cancelButtonColor: '#6b7280'
        });

        if (isConfirmed && productoOriginal) {
          await generarFacturaUsoInterno(
            productoOriginal,
            formulario.value.cantidad,
            []
          );
        }
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

      const resultado = await peticionesFetchOffline('updateData', 'productos_uso_interno', JSON.stringify(datosActualizados));

      if (resultado[0] === 'ok') {
        // Si el producto se devuelve a inventario, actualizar el estado del IMEI y el stock
        if (nuevoEstado === 'Devuelto a inventario' && producto.imei_serial) {
          // Buscar el IMEI y actualizarlo
          const imeis = await peticionesFetchOffline('getDataAsArray', 'imei', '');
          const imeiData = imeis.find(i => i.imei === producto.imei_serial);

          if (imeiData) {
            imeiData.estado = 'DISPONIBLE';
            imeiData.updated_at = nfecha('timestamp');
            await peticionesFetchOffline('updateData', 'imei', JSON.stringify(imeiData));

            // Actualizar stock del producto
            const productos = await peticionesFetchOffline('getDataAsArray', 'productos', '');
            const productoOriginal = productos.find(p =>
              p.codigo === producto.codigo_producto ||
              p.codigo_barra === producto.codigo_producto
            );

            if (productoOriginal) {
              const responseImeiDisponibles = await peticionesFetchOffline('getDataArrayByTwoConditions', 'imei', 'id_equi', productoOriginal.id, 'estado', 'DISPONIBLE');
              productoOriginal.stock = responseImeiDisponibles.length;
              productoOriginal.updated_at = nfecha('timestamp');
              await peticionesFetchOffline('updateData', 'productos', JSON.stringify(productoOriginal));
            }
          }
        } else if (nuevoEstado === 'Devuelto a inventario' && !producto.imei_serial) {
          // Para productos sin IMEI, incrementar el stock
          const productos = await peticionesFetchOffline('getDataAsArray', 'productos', '');
          const productoOriginal = productos.find(p =>
            p.codigo === producto.codigo_producto ||
            p.codigo_barra === producto.codigo_producto
          );

          if (productoOriginal) {
            productoOriginal.stock = Number(productoOriginal.stock) + producto.cantidad;
            productoOriginal.updated_at = nfecha('timestamp');
            await peticionesFetchOffline('updateData', 'productos', JSON.stringify(productoOriginal));
          }
        }

        toast.add({
          severity: 'success',
          summary: 'Éxito',
          detail: 'Estado actualizado correctamente',
          life: 3000
        });
        await cargarDatos();
        emit('refresh');
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
      const resultado = await peticionesFetchOffline('deleteEntry', 'productos_uso_interno', producto.id);

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
    motivo_retiro: '',
    area_uso: '',
    descripcion: '',
    estado: 'En uso',
    fecha: nfecha('fecha'),
    hora: nfecha('hora'),
    usuario: ''
  };
};

// Generar factura para uso interno
const generarFacturaUsoInterno = async (productoOriginal, cantidad, imeisArray = []) => {
  try {
    loading.value = true;

    // Obtener último número de factura
    const facturas = await peticionesFetchOffline('getDataAsArray', 'facturas');
    const ultimaFactura = facturas.length > 0 ? Math.max(...facturas.map(f => parseInt(f.no_factura) || 0)) : 0;
    const noFactura = (ultimaFactura + 1).toString().padStart(8, '0');

    // Crear producto con precio en cero
    const productoParaFactura = {
      ...productoOriginal,
      cantidad: cantidad,
      precio_venta: 0,
      precio_final: 0,
      impuestos: 0,
      impuesto_venta: 0,
      descuento: 0,
      total: 0
    };

    // Si tiene IMEIs, agregarlos
    if (imeisArray.length > 0) {
      productoParaFactura.lista_imei = imeisArray;
    }

    // Cliente genérico para uso interno
    const clienteUsoInterno = {
      cedula: '000-0000000-0',
      nombre: 'USO INTERNO',
      telefono: '',
      direccion: '',
      email: ''
    };

    // Construir objeto de factura
    const datosFN = {
      nofactura: noFactura,
      cliente: clienteUsoInterno,
      canalventa: datosEmpresa.empresa.nombre,
      entidad_financiera: datosEmpresa.empresa.nombre,
      comprobanteFN: '',
      tipocomprobanteFN: 'FACTURA',
      estadoFN: 'Cobrado',
      metodoPagoFN: 'EFECTIVO',
      efectivoFN: 0,
      tarjetaFN: 0,
      transferenciaFN: 0,
      vendedorFN: datosEmpresa.usuario.nombre,
      cajeroFN: datosEmpresa.usuario.nombre,
      instaladorFN: '',
      meseroFN: '',
      mesaFN: '',
      pagaCon: 0,
      suCambio: 0,
      noCheque: '',
      bancoCheque: '',
      chequeFN: 0,
      deliveryFN: 0,
      subtotal: 0,
      total: 0,
      impuesto: 0,
      ganancia: 0,
      descuento: 0,
      nota: `USO INTERNO - ${formulario.value.motivo_retiro} - ${formulario.value.area_uso}${formulario.value.descripcion ? ' - ' + formulario.value.descripcion : ''}`,
      almacen: datosEmpresa.empresa.nombre,
      productosArray: [productoParaFactura]
    };

    const url = `${link.value}${api.value}/insertar/facturas`;
    const retorno = await facturaNueva(url, datosFN, 'POST', tokenCifrado.value);

    if (retorno[0] === 'ok') {
      await Swal.fire({
        icon: 'success',
        title: '¡Factura Generada!',
        html: `
          <p>Factura de uso interno generada exitosamente</p>
          <p class="text-lg font-bold mt-2">Factura #${noFactura}</p>
          <p class="text-sm text-gray-600 mt-2">Producto: ${productoOriginal.nombre}</p>
          <p class="text-sm text-gray-600">Cantidad: ${cantidad}</p>
          <p class="text-sm text-gray-600">Total: $0.00</p>
        `,
        confirmButtonText: 'Aceptar'
      });

      // Buscar la factura recién creada
      const datosFactura = await peticionesFetchOffline('getDataByField', 'facturas', 'no_factura', noFactura);

      if (datosFactura && facturaPdfPrintRef.value) {
        // Imprimir usando el componente FacturaPdfPrint
        await facturaPdfPrintRef.value.printFactura({
          factura: datosFactura,
          cliente: clienteUsoInterno,
          datosEmpresa: {
            empresa: datosEmpresa.empresa,
            usuario: datosEmpresa.usuario
          },
          creditoData: null
        });
      }
    } else {
      throw new Error('Error al generar factura');
    }
  } catch (error) {
    console.error('Error al generar factura:', error);
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: 'No se pudo generar la factura de uso interno',
      confirmButtonText: 'Aceptar'
    });
  } finally {
    loading.value = false;
  }
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
    'En uso': 'bg-blue-100 text-blue-700',
    'Devuelto a inventario': 'bg-green-100 text-green-700',
    'Consumido': 'bg-gray-100 text-gray-700',
    'En proceso': 'bg-yellow-100 text-yellow-700',
    'Finalizado': 'bg-purple-100 text-purple-700'
  };
  return clases[estado] || 'bg-gray-100 text-gray-700';
};
</script>

<template>
  <Dialog
    v-model:visible="localVisible"
    modal
    :header="'Productos de Uso Interno'"
    :style="{ width: '80rem' }"
    :dismissableMask="false"
  >
    <template #header>
      <div class="flex items-center gap-3">
        <div class="bg-blue-500 rounded-full p-2">
          <i class="pi pi-box text-white text-xl"></i>
        </div>
        <div>
          <h2 class="text-2xl font-bold text-gray-800 m-0">Productos de Uso Interno</h2>
          <p class="text-sm text-gray-500 m-0">Gestión de productos retirados para uso de la empresa</p>
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
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          ]"
        >
          <i class="pi pi-plus-circle mr-2"></i>Registrar Retiro
        </button>
        <button
          @click="vistaActual = 'historial'"
          :class="[
            'px-4 py-2 font-medium text-sm border-b-2 transition-colors',
            vistaActual === 'historial'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          ]"
        >
          <i class="pi pi-list mr-2"></i>Historial ({{ productosUsoInterno.length }})
        </button>
      </nav>
    </div>

    <!-- Vista de Registro -->
    <div v-if="vistaActual === 'registrar'" class="space-y-4">
      <div class="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-500">
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
        <div v-if="formulario.codigo_producto" class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 pt-4 border-t border-blue-200">
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
              Seleccione los IMEI/Seriales a retirar <span class="text-red-500">*</span>
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
            <label for="motivo_retiro" class="block text-sm font-medium text-gray-700 mb-2">
              Motivo de Retiro <span class="text-red-500">*</span>
            </label>
            <Select
              id="motivo_retiro"
              v-model="formulario.motivo_retiro"
              :options="motivosRetiro"
              placeholder="Seleccione motivo"
              class="w-full"
            />
          </div>

          <div>
            <label for="area_uso" class="block text-sm font-medium text-gray-700 mb-2">
              Área de Uso <span class="text-red-500">*</span>
            </label>
            <Select
              id="area_uso"
              v-model="formulario.area_uso"
              :options="areasUso"
              placeholder="Seleccione área"
              class="w-full"
            />
          </div>
        </div>
      </div>

      <div class="bg-indigo-50 p-4 rounded-lg border-l-4 border-indigo-500">
        <h3 class="text-lg font-semibold mb-3 text-gray-700">
          <i class="pi pi-file-edit mr-2"></i>Descripción Adicional
        </h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="md:col-span-2">
            <label for="descripcion" class="block text-sm font-medium text-gray-700 mb-2">
              Descripción
            </label>
            <Textarea
              id="descripcion"
              v-model="formulario.descripcion"
              rows="4"
              placeholder="Describa detalles adicionales sobre el uso del producto..."
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
            placeholder="Buscar por producto, código, motivo, área o estado..."
            class="w-full"
          />
        </span>
      </div>

      <!-- Tabla de productos de uso interno -->
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

        <Column field="motivo_retiro" header="Motivo" style="min-width: 150px">
          <template #body="{ data }">
            <div class="text-sm">{{ data.motivo_retiro }}</div>
          </template>
        </Column>

        <Column field="area_uso" header="Área" style="min-width: 150px">
          <template #body="{ data }">
            <div class="text-sm">{{ data.area_uso }}</div>
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
        <p class="text-gray-500">No hay registros de productos de uso interno</p>
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
          Total de registros: {{ productosUsoInterno.length }}
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
            label="Registrar Retiro"
            icon="pi pi-save"
            severity="primary"
            @click="registrarProductoUsoInterno"
            :loading="loading"
          />
        </div>
      </div>
    </template>
  </Dialog>

  <!-- Componente de impresión PDF -->
  <FacturaPdfPrint ref="facturaPdfPrintRef" />
</template>

<style scoped>
.truncate {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 200px;
}
</style>
