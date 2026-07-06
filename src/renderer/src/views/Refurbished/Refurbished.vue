<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useToast } from 'primevue/usetoast';
import { nfecha, peticionesFetchOffline, crearTablaSiNoExisteOffline, enviarDatosPorPost, encryptarPassword, arrayToObjetoFromTablaOffline, generarCodigoUnico } from '@/funciones/funciones.js';
import { useDatosEmpresa } from '@/stores';
import Swal from 'sweetalert2';
import LoadingOverlay from '@/Loading/LoadingOverlay.vue';

const router = useRouter();
const toast = useToast();
const datosEmpresa = useDatosEmpresa();

const loading = ref(false);
const vistaActual = ref('historial'); // 'registrar' o 'historial'
const tokenCifrado = ref(null);

// PDF embebido
const visiblePDF = ref(false);
const pdfUrl = ref('');

const visibleModalEquipo = ref(false);

const equiposRefurbished = ref([]);
const equipoEditandoId = ref(null);
const selectedEquipos = ref([]);
const tecnicosOptions = ref([]);
const proveedoresOptions = ref([]);
const estadoEquipoOptions = ['Averiado', 'Diagnostico', 'Reparacion', 'Listo para venta'];
const gradoOptions = ['A+', 'A', 'B+', 'B', 'C', 'D'];
const capacidadOptions = ['16GB', '32GB', '64GB', '128GB', '256GB', '512GB', '1TB', '2TB'];
const averiasPorCategoria = [
  {
    categoria: 'Bateria',
    averias: [
      'Bateria descargandose muy rapido',
      'Bateria inflada',
      'Bateria no carga',
      'Porcentaje de bateria inestable',
      'Apagado repentino',
      'Salud de bateria baja'
    ]
  },
  {
    categoria: 'Carga',
    averias: [
      'No carga',
      'Carga intermitente',
      'Pin de carga danado',
      'Conector Lightning sucio',
      'Solo carga en cierta posicion',
      'No reconoce cargador'
    ]
  },
  {
    categoria: 'Pantalla',
    averias: [
      'Pantalla rota',
      'Pantalla rayada',
      'Pantalla negra',
      'Pantalla no enciende',
      'Pantalla con manchas',
      'Pantalla con lineas',
      'Pantalla tactil no funciona',
      'Pantalla tactil intermitente',
      'Pantalla se congela'
    ]
  },
  {
    categoria: 'Camara',
    averias: [
      'Camara trasera no funciona',
      'Camara frontal no funciona',
      'Camara borrosa',
      'Camara con manchas',
      'Camara no enfoca',
      'Flash no funciona'
    ]
  },
  {
    categoria: 'Audio',
    averias: [
      'No se escucha el auricular',
      'No se escucha el altavoz',
      'Volumen bajo',
      'Microfono no funciona',
      'Sonido distorsionado'
    ]
  },
  {
    categoria: 'Senal / Conectividad',
    averias: [
      'Sin senal',
      'Senal debil',
      'No detecta SIM',
      'WiFi no funciona',
      'Bluetooth no funciona',
      'Datos moviles no funcionan',
      'GPS no funciona'
    ]
  },
  {
    categoria: 'Botones',
    averias: [
      'Boton de encendido no funciona',
      'Botones de volumen no funcionan',
      'Boton home no funciona',
      'Boton power duro',
      'Botones hundidos'
    ]
  },
  {
    categoria: 'Sistema / Software',
    averias: [
      'iPhone bloqueado por iCloud',
      'iPhone bloqueado por contrasena',
      'iPhone desactivado',
      'iPhone en modo recuperacion',
      'iPhone en bootloop',
      'iPhone lento',
      'Problemas de actualizacion'
    ]
  },
  {
    categoria: 'Danos fisicos',
    averias: [
      'Mojado / dano por agua',
      'Carcasa rota',
      'Marco doblado',
      'Vidrio trasero roto',
      'Rayones severos'
    ]
  },
  {
    categoria: 'Otros',
    averias: [
      'Face ID no funciona',
      'Touch ID no funciona',
      'Linterna no funciona',
      'Vibrador no funciona',
      'Sensor de proximidad no funciona'
    ]
  }
];
const categoriasAveriaOptions = averiasPorCategoria.map((c) => c.categoria);
const rolesCostosPermitidos = ['ADMINISTRADOR', 'GERENTE', 'SOPORTE'];
const puedeVerSeccionCostos = computed(() => {
  const nivel = String(datosEmpresa.usuario?.nivel_seguridad || datosEmpresa.usuario?.usuario || '')
    .trim()
    .toUpperCase();
  return rolesCostosPermitidos.includes(nivel);
});
const fechaActualDDMMYYYY = () => {
  const hoy = new Date();
  const dd = String(hoy.getDate()).padStart(2, '0');
  const mm = String(hoy.getMonth() + 1).padStart(2, '0');
  const yyyy = hoy.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
};

const equipoForm = ref({
  imei: '',
  id_equi: '',
  modelo: '',
  marca: '',
  capacidad: '256GB',
  averia: '',
  proveedor: '',
  estado: 'Averiado',
  fecha_ingreso: fechaActualDDMMYYYY(),
  hora_ingreso: nfecha('hora'),
  piezas_colocar: '',
  fecha_reparado: '',
  grado: 'A',
  costo: '0.00',
  precio_venta: '0.00',
  precio_min: '0.00',
  precio_xmayor: '0.00',
  costo_reparacion: '0.00',
  tecnico: '',
  nota: ''
});

// Formulario de registro
const formulario = ref({
  codigo_producto: '',
  nombre_producto: '',
  cantidad: 1,
  imei_serial: '',
  motivo_refurbished: '',
  area_refurbished: '',
  descripcion: '',
  estado: 'PENDIENTE',
  fecha: nfecha('fecha'),
  hora: nfecha('hora'),
  usuario: ''
});

// Lista de productos en Refurbished
const productosRefurbished = ref([]);
const searchQuery = ref('');

// Filtros de fecha
const filtroFecha = ref('hoy');
const fechaDesde = ref(null);
const fechaHasta = ref(null);

const opcionesFecha = [
  { label: 'Hoy', value: 'hoy' },
  { label: 'Ayer', value: 'ayer' },
  { label: 'Ãšltimos 7 dÃ­as', value: 'ultimos7dias' },
  { label: 'Este mes', value: 'estemes' },
  { label: 'Rango personalizado', value: 'rango' }
];

// Selector de productos
const productosDisponibles = ref([]);
const productoSeleccionado = ref(null);
const filteredProductos = ref([]);

// Para productos con IMEI/Serial (CELULARES y ELECTRODOMESTICOS)
const tieneSeriales = ref(false);
const opcionCantidad = ref('uno'); // 'uno', 'varios', 'todos'
const imeiDisponibles = ref([]);
const imeiSeleccionados = ref([]);

const opcionesCantidad = [
  { label: 'Solo uno', value: 'uno' },
  { label: 'Varios', value: 'varios' },
  { label: 'Todos', value: 'todos' }
];

// Opciones para los selects
const motivosRefurbished = [
  'ReparaciÃ³n',
  'Uso en tienda',
  'DemostraciÃ³n',
  'Uso administrativo',
  'Reemplazo temporal',
  'Prueba de calidad',
  'Otro'
];

const areasRefurbished = [
  'Taller/ReparaciÃ³n',
  'Sala de ventas',
  'Oficina administrativa',
  'Ãrea de exhibiciÃ³n',
  'Laboratorio',
  'Bodega',
  'Otro'
];

const estadosProducto = [
  'PENDIENTE',
  'Devuelto a inventario',
  'Consumido',
  'En proceso',
  'Finalizado'
];

// Funciones helper para fechas
const obtenerFechaInicio = () => {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  switch (filtroFecha.value) {
    case 'hoy':
      return hoy;

    case 'ayer':
      const ayer = new Date(hoy);
      ayer.setDate(ayer.getDate() - 1);
      return ayer;

    case 'ultimos7dias':
      const hace7dias = new Date(hoy);
      hace7dias.setDate(hace7dias.getDate() - 7);
      return hace7dias;

    case 'estemes':
      const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
      return inicioMes;

    case 'rango':
      return fechaDesde.value ? new Date(fechaDesde.value) : null;

    default:
      return hoy;
  }
};

const obtenerFechaFin = () => {
  const hoy = new Date();
  hoy.setHours(23, 59, 59, 999);

  switch (filtroFecha.value) {
    case 'hoy':
      return hoy;

    case 'ayer':
      const ayer = new Date(hoy);
      ayer.setDate(ayer.getDate() - 1);
      ayer.setHours(23, 59, 59, 999);
      return ayer;

    case 'ultimos7dias':
    case 'estemes':
      return hoy;

    case 'rango':
      return fechaHasta.value ? new Date(fechaHasta.value) : hoy;

    default:
      return hoy;
  }
};

const compararSoloFecha = (timestamp) => {
  if (!timestamp) return false;

  try {
    const fechaProducto = new Date(timestamp);
    const hoy = new Date();

    const fechaProdStr = fechaProducto.toISOString().split('T')[0];
    const hoyStr = hoy.toISOString().split('T')[0];

    switch (filtroFecha.value) {
      case 'hoy':
        return fechaProdStr === hoyStr;

      case 'ayer': {
        const ayer = new Date(hoy);
        ayer.setDate(ayer.getDate() - 1);
        const ayerStr = ayer.toISOString().split('T')[0];
        return fechaProdStr === ayerStr;
      }

      case 'ultimos7dias': {
        const hace7dias = new Date();
        hace7dias.setDate(hace7dias.getDate() - 7);
        const hace7diasStr = hace7dias.toISOString().split('T')[0];
        return fechaProdStr >= hace7diasStr && fechaProdStr <= hoyStr;
      }

      case 'estemes': {
        const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
        const inicioMesStr = inicioMes.toISOString().split('T')[0];
        return fechaProdStr >= inicioMesStr && fechaProdStr <= hoyStr;
      }

      case 'rango': {
        if (!fechaDesde.value || !fechaHasta.value) return true;
        const desdeStr = new Date(fechaDesde.value).toISOString().split('T')[0];
        const hastaStr = new Date(fechaHasta.value).toISOString().split('T')[0];
        return fechaProdStr >= desdeStr && fechaProdStr <= hastaStr;
      }

      default:
        return true;
    }
  } catch (error) {
    console.error('Error al comparar:', error);
    return false;
  }
};

// Computed para filtrar productos
const productosFiltrados = computed(() => {
  const filtro = filtroFecha.value;
  const desde = fechaDesde.value;
  const hasta = fechaHasta.value;
  const busqueda = searchQuery.value;

  let resultado = [...productosRefurbished.value];

  // Filtrar por fecha usando created_at
  resultado = resultado.filter(p => compararSoloFecha(p.created_at));

  // Filtrar por bÃºsqueda de texto
  if (busqueda) {
    const query = busqueda.toLowerCase();
    resultado = resultado.filter(p =>
      String(p.id || '').toLowerCase().includes(query) ||
      p.imei?.toLowerCase().includes(query) ||
      p.modelo?.toLowerCase().includes(query) ||
      p.marca?.toLowerCase().includes(query) ||
      p.capacidad?.toLowerCase().includes(query) ||
      p.averia?.toLowerCase().includes(query) ||
      p.proveedor?.toLowerCase().includes(query) ||
      p.estado?.toLowerCase().includes(query) ||
      p.fecha_ingreso?.toLowerCase().includes(query) ||
      p.hora_ingreso?.toLowerCase().includes(query) ||
      p.piezas_colocar?.toLowerCase().includes(query) ||
      p.fecha_reparado?.toLowerCase().includes(query) ||
      p.grado?.toLowerCase().includes(query) ||
      String(p.costo || '').toLowerCase().includes(query) ||
      String(p.precio_venta || '').toLowerCase().includes(query) ||
      String(p.precio_min || '').toLowerCase().includes(query) ||
      String(p.precio_xmayor || '').toLowerCase().includes(query) ||
      String(p.costo_reparacion || '').toLowerCase().includes(query) ||
      p.tecnico?.toLowerCase().includes(query) ||
      p.nota?.toLowerCase().includes(query) ||
      p.usuario?.toLowerCase().includes(query)
    );
  }

  return resultado;
});

// EstadÃ­sticas (basadas en el filtro de fecha)
const estadisticas = computed(() => {
  const productosFiltradosPorFecha = productosRefurbished.value.filter(p =>
    compararSoloFecha(p.created_at)
  );

  const total = productosFiltradosPorFecha.length;
  const enUso = productosFiltradosPorFecha.filter(p => p.estado === 'Averiado').length;
  const devueltos = productosFiltradosPorFecha.filter(p => p.estado === 'Diagnostico').length;
  const consumidos = productosFiltradosPorFecha.filter(p => p.estado === 'Reparacion').length;

  return { total, enUso, devueltos, consumidos };
});

// Inicializar
onMounted(async () => {
  try {
    const datosJSON = await window.electron.ipcRenderer.invoke('datosarchivo');
    if (datosJSON?.VITE_TOKEN) {
      tokenCifrado.value = await encryptarPassword(datosJSON.VITE_TOKEN, 10);
    }
  } catch (error) {
    console.warn('No se pudo inicializar tokenCifrado para consulta IMEI:', error);
  }

  await inicializarTabla();
  await cargarTecnicos();
  await cargarProveedores();
  await cargarDatos();
  await cargarProductos();
  await cargarEquiposRefurbished();
});

const cargarTecnicos = async () => {
  try {
    const usuarios = await peticionesFetchOffline('getDataAsArray', 'usuarios', '');
    let tecnicos = (usuarios || [])
      .filter((u) => String(u?.nivel_seguridad || '').toLowerCase().includes('tecnico'))
      .map((u) => u?.nombre)
      .filter(Boolean);

    // Fallback a tabla tecnicos si no hay usuarios con rol tecnico
    if (!tecnicos.length) {
      const tablaTecnicos = await peticionesFetchOffline('getDataAsArray', 'tecnicos', '');
      tecnicos = (tablaTecnicos || []).map((t) => t?.nombre).filter(Boolean);
    }

    tecnicosOptions.value = [...new Set(tecnicos)];

    if (!equipoForm.value.tecnico && tecnicosOptions.value.length > 0) {
      equipoForm.value.tecnico = tecnicosOptions.value[0];
    }
  } catch (error) {
    console.error('Error al cargar tecnicos:', error);
    tecnicosOptions.value = [];
  }
};

const cargarProveedores = async () => {
  try {
    const proveedores = await peticionesFetchOffline('getDataAsArray', 'proveedores', '');
    let nombres = (proveedores || [])
      .map((p) => p?.nombre || p?.proveedor || '')
      .filter(Boolean);

    // Fallback: si existe otra tabla con suplidores
    if (!nombres.length) {
      const suplidores = await peticionesFetchOffline('getDataAsArray', 'suplidores', '');
      nombres = (suplidores || [])
        .map((s) => s?.nombre || s?.proveedor || '')
        .filter(Boolean);
    }

    proveedoresOptions.value = [...new Set(nombres)];

    if (!equipoForm.value.proveedor && proveedoresOptions.value.length > 0) {
      equipoForm.value.proveedor = proveedoresOptions.value[0];
    }
  } catch (error) {
    console.error('Error al cargar proveedores:', error);
    proveedoresOptions.value = [];
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

      // Si es CELULARES o ELECTRODOMESTICOS, cargar IMEI/Serial disponibles
      if (producto.categoria === 'CELULARES' || producto.categoria === 'ELECTRODOMESTICOS') {
        tieneSeriales.value = true;
        opcionCantidad.value = 'uno';
        imeiSeleccionados.value = [];

        // Cargar IMEI/Serial disponibles
        await cargarImeisDisponibles(producto.id);

        toast.add({
          severity: 'info',
          summary: 'Producto con Serial/IMEI',
          detail: `Se encontraron ${imeiDisponibles.value.length} unidades disponibles. Selecciona cuÃ¡ntas deseas Enviar.`,
          life: 5000
        });
      } else {
        tieneSeriales.value = false;
        imeiDisponibles.value = [];
        imeiSeleccionados.value = [];
      }
    }
  }
};

// Cargar IMEIs/Seriales disponibles de un producto
const cargarImeisDisponibles = async (productoId) => {
  try {
    loading.value = true;
    const response = await peticionesFetchOffline('getDataArrayByTwoConditions', 'imei', 'id_equi', productoId, 'estado', 'DISPONIBLE');
    imeiDisponibles.value = response;
  } catch (error) {
    console.error('Error al cargar IMEI/Serial:', error);
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Error al cargar los IMEI/Serial disponibles',
      life: 3000
    });
  } finally {
    loading.value = false;
  }
};

// Crear tabla si no existe
const inicializarTabla = async () => {
  const camposArray = [
    'codigo_producto',
    'nombre_producto',
    'cantidad',
    'imei_serial',
    'motivo_refurbished',
    'area_refurbished',
    'descripcion',
    'estado',
    'fecha',
    'hora',
    'usuario'
  ];

  await crearTablaSiNoExisteOffline('refurbished_productos', camposArray, toast);

  const camposEquipos = [
    'imei',
    'id_equi',
    'modelo',
    'marca',
    'capacidad',
    'averia',
    'proveedor',
    'estado',
    'fecha_ingreso',
    'hora_ingreso',
    'piezas_colocar',
    'fecha_reparado',
    'grado',
    'costo',
    'precio_venta',
    'precio_min',
    'precio_xmayor',
    'costo_reparacion',
    'tecnico',
    'nota',
    'usuario'
  ];

  await crearTablaSiNoExisteOffline('refurbished_equipos', camposEquipos, toast);
};

// Cargar datos
const recargarTodo = async () => {
  await cargarDatos();
  await cargarEquiposRefurbished();
};

const cargarDatos = async () => {
  loading.value = true;
  try {
    const datos = await peticionesFetchOffline('getDataAsArray', 'refurbished_equipos', '');
    productosRefurbished.value = datos.sort((a, b) => {
      return new Date(b.created_at) - new Date(a.created_at);
    });
  } catch (error) {
    console.error('Error al cargar equipos refurbished:', error);
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Error al cargar datos',
      life: 3000
    });
  } finally {
    loading.value = false;
  }
};

const cargarEquiposRefurbished = async () => {
  try {
    const datos = await peticionesFetchOffline('getDataAsArray', 'refurbished_equipos', '');
    equiposRefurbished.value = datos.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  } catch (error) {
    console.error('Error al cargar equipos refurbished:', error);
    equiposRefurbished.value = [];
  }
};

const limpiarEquipoForm = () => {
  equipoEditandoId.value = null;
  equipoForm.value = {
    imei: '',
    id_equi: '',
    modelo: '',
    marca: '',
    capacidad: '256GB',
    averia: '',
    proveedor: proveedoresOptions.value[0] || '',
    estado: 'Averiado',
    fecha_ingreso: fechaActualDDMMYYYY(),
    hora_ingreso: nfecha('hora'),
    piezas_colocar: '',
    fecha_reparado: '',
    grado: 'A',
    costo: '0.00',
    precio_venta: '0.00',
    precio_min: '0.00',
    precio_xmayor: '0.00',
    costo_reparacion: '0.00',
    tecnico: tecnicosOptions.value[0] || '',
    nota: ''
  };
};

const agregarAveriaPredeterminada = (averia) => {
  const actual = String(equipoForm.value.averia || '')
    .split(',')
    .map((a) => a.trim())
    .filter(Boolean);

  const existe = actual.some((a) => a.toLowerCase() === String(averia).toLowerCase());
  if (existe) return;

  equipoForm.value.averia = actual.length ? `${actual.join(', ')}, ${averia}` : averia;
};

const guardarEquipoRefurbished = async () => {
  if (!equipoForm.value.imei || !equipoForm.value.modelo || !equipoForm.value.marca) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'IMEI, modelo y marca son obligatorios',
      life: 3000
    });
    return;
  }

  loading.value = true;
  try {
    const payloadBase = {
      ...equipoForm.value,
      usuario: datosEmpresa.usuario?.nombre || 'No Registrado',
      updated_at: nfecha('timestamp')
    };

    let resultado = null;
    if (equipoEditandoId.value) {
      const existente = productosRefurbished.value.find((e) => String(e.id) === String(equipoEditandoId.value));
      const payloadUpdate = {
        ...(existente || {}),
        ...payloadBase,
        id: equipoEditandoId.value
      };
      resultado = await peticionesFetchOffline('updateData', 'refurbished_equipos', JSON.stringify(payloadUpdate));
    } else {
      const payloadInsert = {
        ...payloadBase,
        created_at: nfecha('timestamp')
      };
      resultado = await peticionesFetchOffline('insertData', 'refurbished_equipos', JSON.stringify(payloadInsert));
    }

    if (resultado && resultado[0] === 'ok') {
      toast.add({
        severity: 'success',
        summary: 'Exito',
        detail: equipoEditandoId.value ? 'Equipo actualizado correctamente' : 'Equipo agregado a refurbished',
        life: 3000
      });
      visibleModalEquipo.value = false;
      limpiarEquipoForm();
      await recargarTodo();
    } else {
      toast.add({
        severity: 'error',
        summary: 'Error',
        detail: 'No se pudo guardar el equipo',
        life: 3000
      });
    }
  } catch (error) {
    console.error('Error guardando equipo refurbished:', error);
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Error al guardar el equipo',
      life: 3000
    });
  } finally {
    loading.value = false;
  }
};

const abrirModalNuevoEquipo = () => {
  limpiarEquipoForm();
  visibleModalEquipo.value = true;
};

const editarEquipo = (equipo) => {
  equipoEditandoId.value = equipo.id;
  equipoForm.value = {
    imei: equipo.imei || '',
    id_equi: equipo.id_equi || '',
    modelo: equipo.modelo || '',
    marca: equipo.marca || '',
    capacidad: equipo.capacidad || '',
    averia: equipo.averia || '',
    proveedor: equipo.proveedor || '',
    estado: equipo.estado || 'Averiado',
    fecha_ingreso: equipo.fecha_ingreso || fechaActualDDMMYYYY(),
    hora_ingreso: equipo.hora_ingreso || nfecha('hora'),
    piezas_colocar: equipo.piezas_colocar || '',
    fecha_reparado: equipo.fecha_reparado || '',
    grado: equipo.grado || '',
    costo: equipo.costo || '0.00',
    precio_venta: equipo.precio_venta || '0.00',
    precio_min: equipo.precio_min || '0.00',
    precio_xmayor: equipo.precio_xmayor || '0.00',
    costo_reparacion: equipo.costo_reparacion || '0.00',
    tecnico: equipo.tecnico || (tecnicosOptions.value[0] || ''),
    nota: equipo.nota || ''
  };
  visibleModalEquipo.value = true;
};

const eliminarEquipoRefurbished = async (equipo) => {
  const result = await Swal.fire({
    title: '¿Eliminar equipo?',
    text: `Se eliminará el equipo IMEI ${equipo.imei || ''}`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Sí, eliminar',
    cancelButtonText: 'Cancelar',
    confirmButtonColor: '#d33'
  });

  if (!result.isConfirmed) return;

  loading.value = true;
  try {
    const resp = await peticionesFetchOffline('deleteEntry', 'refurbished_equipos', equipo.id);
    if (resp && resp[0] === 'ok') {
      toast.add({ severity: 'success', summary: 'Exito', detail: 'Equipo eliminado', life: 3000 });
      await recargarTodo();
    } else {
      toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo eliminar el equipo', life: 3000 });
    }
  } catch (error) {
    console.error('Error eliminando equipo refurbished:', error);
    toast.add({ severity: 'error', summary: 'Error', detail: 'Error al eliminar el equipo', life: 3000 });
  } finally {
    loading.value = false;
  }
};

const obtenerUltimoProductoAgregado = async () => {
  const productos = await peticionesFetchOffline('getDataAsArray', 'productos', '');
  if (!productos?.length) return null;

  const ordenados = [...productos].sort((a, b) => {
    const idA = Number(a?.id) || 0;
    const idB = Number(b?.id) || 0;
    if (idB !== idA) return idB - idA;
    return new Date(b?.created_at || 0) - new Date(a?.created_at || 0);
  });

  return ordenados[0] || null;
};

const toMoney = (valor) => {
  const num = Number(valor);
  if (Number.isNaN(num)) return '0.00';
  return num.toFixed(2);
};

const detalleRespuesta = (resp) => {
  if (Array.isArray(resp)) return resp.join(' | ');
  if (resp && typeof resp === 'object') return JSON.stringify(resp);
  return String(resp || '');
};

const agregarIndividualAInventario = async (equipo) => {
  const imeiTexto = String(equipo?.imei || '').trim();
  if (!imeiTexto) {
    toast.add({
      severity: 'warn',
      summary: 'Atencion',
      detail: 'El equipo no tiene IMEI',
      life: 3000
    });
    return;
  }

  if (String(equipo?.estado || '') !== 'Listo para venta') {
    toast.add({
      severity: 'warn',
      summary: 'Atencion',
      detail: 'Solo se puede agregar al inventario si el equipo esta en "Listo para venta"',
      life: 3500
    });
    return;
  }

  const confirmar = await Swal.fire({
    title: 'Agregar al inventario',
    text: `Se creara un producto y su IMEI para ${imeiTexto}`,
    icon: 'question',
    showCancelButton: true,
    confirmButtonText: 'Si, agregar',
    cancelButtonText: 'Cancelar'
  });

  if (!confirmar.isConfirmed) return;

  loading.value = true;
  try {
    const imeis = await peticionesFetchOffline('getDataAsArray', 'imei', '');
    const existeImei = (imeis || []).find((i) => String(i?.imei || '').trim() === imeiTexto);

    const marca = String(equipo?.marca || '').trim();
    const modelo = String(equipo?.modelo || '').trim();
    const capacidad = String(equipo?.capacidad || '').trim();
    const nombreEquipo = [marca, modelo, capacidad].filter(Boolean).join(' ').trim() || imeiTexto;
    const usuarioActual = datosEmpresa.usuario?.nombre || 'No Registrado';
    const almacenActual = datosEmpresa.empresa?.nombre || '';
    const now = nfecha('timestamp');
    const costo = toMoney(equipo?.costo);
    const precioVenta = toMoney(equipo?.precio_venta);
    const precioMin = toMoney(equipo?.precio_min);
    const precioMayor = toMoney(equipo?.precio_xmayor);
    const ganancia = toMoney(Number(precioVenta) - Number(costo));

    let productoDestino = null;
    const idEquiAnterior = existeImei?.id_equi ? String(existeImei.id_equi) : null;
    const idEquiSeleccionado = Number(equipo?.id_equi || 0);
    if (idEquiSeleccionado > 0) {
      productoDestino = await peticionesFetchOffline('getDataByField', 'productos', 'id', idEquiSeleccionado);
      if (!productoDestino) {
        toast.add({
          severity: 'warn',
          summary: 'Atencion',
          detail: `No se encontro el producto con ID ${idEquiSeleccionado}. Se creara uno nuevo.`,
          life: 3500
        });
      }
    }

    if (!productoDestino) {
      const codigoProd = generarCodigoUnico();
      const productoPayload = {
        t_garantia: '0',
        situacion: 'ACTIVO',
        condicion: 'NUEVO',
        codigo: codigoProd,
        codigo_barra: generarCodigoUnico(),
        nombre: nombreEquipo,
        categoria: 'CELULARES',
        proveedor: equipo?.proveedor || '',
        marca,
        modelo,
        precio_compra: costo,
        impuestos: '0.00',
        tipo_impuesto: 'Sin Imp.',
        ganancia,
        precio_venta: precioVenta,
        precio_min: precioMin,
        precio_xmayor: precioMayor,
        oferta: precioVenta,
        impuesto_venta: '0.00',
        precio_final: precioVenta,
        stock: 1,
        alerta: 1,
        empaque: 'UNIDAD',
        instalacion: '0.00',
        comision: '0.00',
        vencimiento: '',
        ubicacion: '',
        imagen: '',
        usuario: usuarioActual,
        otro: equipo?.costo_reparacion ? `Costo reparacion: ${toMoney(equipo.costo_reparacion)}` : '',
        no_compra: '',
        caracteristicas: capacidad || '',
        descripcion: equipo?.averia || nombreEquipo,
        updated_at: now,
        created_at: now,
        identificadordb: generarCodigoUnico(),
        almacen: almacenActual
      };

      const insProd = await peticionesFetchOffline('insertData', 'productos', JSON.stringify(productoPayload));
      if (!insProd || insProd[0] !== 'ok') {
        toast.add({
          severity: 'error',
          summary: 'Error',
          detail: `No se pudo crear el producto: ${detalleRespuesta(insProd)}`,
          life: 5000
        });
        return;
      }

      productoDestino = insProd?.[1] || null;
      if (!productoDestino?.id) {
        productoDestino = await peticionesFetchOffline('getDataByField', 'productos', 'codigo', codigoProd);
      }
      if (!productoDestino?.id) {
        productoDestino = await obtenerUltimoProductoAgregado();
      }
      if (!productoDestino?.id) {
        toast.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo obtener el ID del producto recien creado (codigo no localizado)',
          life: 3500
        });
        return;
      }
    }

    const imeiPayload = {
      almacen: almacenActual,
      imei: imeiTexto,
      estado: 'DISPONIBLE',
      fecha: nfecha('fecha'),
      equipo: String(productoDestino.nombre || nombreEquipo),
      proveedor: equipo?.proveedor || '',
      id_equi: productoDestino.id,
      costo,
      precio_venta: precioVenta,
      factura: '',
      no_compra: String(productoDestino.no_compra || ''),
      fecha_venta: '',
      hora_venta: '',
      comprador: '',
      detalles: equipo?.averia || '',
      usuario: usuarioActual,
      created_at: existeImei?.created_at || now,
      updated_at: now,
      identificadordb: existeImei?.identificadordb || generarCodigoUnico(),
      marca,
      modelo,
      preciocompra: costo,
      precioventa: precioVenta,
      vendedor: '',
      cedula: '',
      telefono: '',
      direccion: '',
      nota: equipo?.nota || '',
      precio_compra: costo,
      precio_min: precioMin,
      precio_xmayor: precioMayor,
      ganancia,
      no_factura: '',
      bateria: existeImei?.bateria || '',
      capacidad: capacidad || ''
    };

    const upsertImei = existeImei
      ? await peticionesFetchOffline('updateData', 'imei', JSON.stringify({ ...existeImei, ...imeiPayload, id: existeImei.id }))
      : await peticionesFetchOffline('insertData', 'imei', JSON.stringify(imeiPayload));
    if (!upsertImei || upsertImei[0] !== 'ok') {
      toast.add({
        severity: 'error',
        summary: 'Error',
        detail: `Producto creado/seleccionado, pero no se pudo guardar el IMEI: ${detalleRespuesta(upsertImei)}`,
        life: 5000
      });
      return;
    }

    const imeisFresh = await peticionesFetchOffline('getDataAsArray', 'imei', '');
    const disponibles = (imeisFresh || []).filter((i) => String(i.id_equi) === String(productoDestino.id) && String(i.estado) === 'DISPONIBLE');
    productoDestino.stock = disponibles.length;
    productoDestino.updated_at = nfecha('timestamp');
    await peticionesFetchOffline('updateData', 'productos', JSON.stringify(productoDestino));

    if (idEquiAnterior && idEquiAnterior !== String(productoDestino.id)) {
      const productoAnterior = await peticionesFetchOffline('getDataByField', 'productos', 'id', idEquiAnterior);
      if (productoAnterior) {
        const disponiblesAnterior = (imeisFresh || []).filter((i) => String(i.id_equi) === String(idEquiAnterior) && String(i.estado) === 'DISPONIBLE');
        productoAnterior.stock = disponiblesAnterior.length;
        productoAnterior.updated_at = nfecha('timestamp');
        await peticionesFetchOffline('updateData', 'productos', JSON.stringify(productoAnterior));
      }
    }

    toast.add({
      severity: 'success',
      summary: 'Exito',
      detail: `Equipo ${imeiTexto} agregado al inventario (IMEI ${existeImei ? 'actualizado' : 'insertado'})`,
      life: 3500
    });

    await recargarTodo();
  } catch (error) {
    console.error('Error agregando equipo individual a inventario:', error);
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'No se pudo agregar el equipo al inventario',
      life: 3500
    });
  } finally {
    loading.value = false;
  }
};

const pasarSeleccionadosAProductos = async () => {
  if (!selectedEquipos.value.length) {
    toast.add({
      severity: 'warn',
      summary: 'Atencion',
      detail: 'Seleccione uno o varios equipos',
      life: 3000
    });
    return;
  }

  const listos = selectedEquipos.value.filter((e) => String(e.estado || '') === 'Listo para venta');
  if (!listos.length) {
    toast.add({
      severity: 'warn',
      summary: 'Atencion',
      detail: 'Solo se pueden pasar equipos en estado "Listo para venta"',
      life: 3500
    });
    return;
  }

  const result = await Swal.fire({
    title: '¿Pasar a productos?',
    text: `Se pasarán ${listos.length} equipo(s) al inventario de productos`,
    icon: 'question',
    showCancelButton: true,
    confirmButtonText: 'Si, pasar',
    cancelButtonText: 'Cancelar'
  });

  if (!result.isConfirmed) return;

  loading.value = true;
  try {
    const productos = await peticionesFetchOffline('getDataAsArray', 'productos', '');
    let imeis = await peticionesFetchOffline('getDataAsArray', 'imei', '');
    const idsProductosAfectados = new Set();
    let procesados = 0;
    const errores = [];

    for (const equipo of listos) {
      const marca = String(equipo.marca || '').trim();
      const modelo = String(equipo.modelo || '').trim();
      const capacidad = String(equipo.capacidad || '').trim();
      const costo = toMoney(equipo.costo);
      const precioVenta = toMoney(equipo.precio_venta);
      const precioMin = toMoney(equipo.precio_min);
      const precioMayor = toMoney(equipo.precio_xmayor);
      const ganancia = toMoney(Number(precioVenta) - Number(costo));
      const nombreEquipo = [marca, modelo, capacidad].filter(Boolean).join(' ').trim() || String(equipo.imei || 'EQUIPO');

      const idEquiSeleccionado = Number(equipo.id_equi || 0);
      let producto = null;

      if (idEquiSeleccionado > 0) {
        producto = productos.find((p) => String(p.id) === String(idEquiSeleccionado));
        if (!producto) {
          const prodById = await peticionesFetchOffline('getDataByField', 'productos', 'id', idEquiSeleccionado);
          if (prodById?.id) {
            producto = prodById;
            productos.push(prodById);
          }
        }
      }

      if (!producto) {
        producto = productos.find((p) =>
          String(p.categoria || '').toUpperCase() === 'CELULARES' &&
          String(p.marca || '').trim().toUpperCase() === marca.toUpperCase() &&
          String(p.modelo || '').trim().toUpperCase() === modelo.toUpperCase() &&
          String(p.almacen || '').trim() === String(datosEmpresa.empresa.nombre || '').trim()
        );
      }

      if (!producto) {
        const nuevoProducto = await arrayToObjetoFromTablaOffline('productos');
        nuevoProducto.codigo = generarCodigoUnico();
        nuevoProducto.codigo_barra = generarCodigoUnico();
        nuevoProducto.nombre = nombreEquipo;
        nuevoProducto.descripcion = nombreEquipo;
        nuevoProducto.categoria = 'CELULARES';
        nuevoProducto.marca = marca;
        nuevoProducto.modelo = modelo;
        nuevoProducto.proveedor = equipo.proveedor || '';
        nuevoProducto.stock = 0;
        nuevoProducto.alerta = 1;
        nuevoProducto.precio_compra = costo;
        nuevoProducto.precio_venta = precioVenta;
        nuevoProducto.precio_final = precioVenta;
        nuevoProducto.precio_min = precioMin;
        nuevoProducto.precio_xmayor = precioMayor;
        nuevoProducto.ganancia = ganancia;
        nuevoProducto.oferta = precioVenta;
        nuevoProducto.impuestos = nuevoProducto.impuestos || '0.00';
        nuevoProducto.impuesto_venta = nuevoProducto.impuesto_venta || '0.00';
        nuevoProducto.empaque = nuevoProducto.empaque || 'UNIDAD';
        nuevoProducto.almacen = datosEmpresa.empresa.nombre;
        nuevoProducto.usuario = datosEmpresa.usuario?.nombre || 'No Registrado';
        nuevoProducto.created_at = nfecha('timestamp');
        nuevoProducto.updated_at = nfecha('timestamp');

        const insProd = await peticionesFetchOffline('insertData', 'productos', JSON.stringify(nuevoProducto));
        if (!insProd || insProd[0] !== 'ok') {
          errores.push(`Producto IMEI ${equipo.imei || ''}: ${detalleRespuesta(insProd)}`);
          continue;
        }
        producto = insProd[1] || nuevoProducto;
        if (!producto.id) {
          const refProd = await peticionesFetchOffline('getDataByField', 'productos', 'codigo', nuevoProducto.codigo);
          if (refProd?.id) producto = refProd;
        }
        productos.push(producto);
      }

      if (!producto?.id) {
        errores.push(`Producto sin ID para IMEI ${equipo.imei || ''}`);
        continue;
      }
      idsProductosAfectados.add(producto.id);

      const imeiTexto = String(equipo.imei || '').trim();
      if (!imeiTexto) continue;
      let imeiData = imeis.find((i) => String(i.imei || '').trim() === imeiTexto);

      if (imeiData) {
        imeiData.id_equi = producto.id;
        imeiData.estado = 'DISPONIBLE';
        imeiData.equipo = nombreEquipo;
        imeiData.proveedor = equipo.proveedor || imeiData.proveedor;
        imeiData.capacidad = capacidad || imeiData.capacidad;
        imeiData.marca = marca || imeiData.marca;
        imeiData.modelo = modelo || imeiData.modelo;
        imeiData.costo = costo;
        imeiData.precio_venta = precioVenta;
        imeiData.preciocompra = costo;
        imeiData.precioventa = precioVenta;
        imeiData.precio_compra = costo;
        imeiData.precio_min = precioMin;
        imeiData.precio_xmayor = precioMayor;
        imeiData.ganancia = ganancia;
        imeiData.fecha = nfecha('fecha');
        imeiData.updated_at = nfecha('timestamp');
        await peticionesFetchOffline('updateData', 'imei', JSON.stringify(imeiData));
      } else {
        imeiData = await arrayToObjetoFromTablaOffline('imei');
        imeiData.imei = imeiTexto;
        imeiData.id_equi = producto.id;
        imeiData.equipo = nombreEquipo;
        imeiData.proveedor = equipo.proveedor || '';
        imeiData.estado = 'DISPONIBLE';
        imeiData.fecha = nfecha('fecha');
        imeiData.capacidad = capacidad || '';
        imeiData.marca = marca || '';
        imeiData.modelo = modelo || '';
        imeiData.costo = costo;
        imeiData.precio_venta = precioVenta;
        imeiData.preciocompra = costo;
        imeiData.precioventa = precioVenta;
        imeiData.precio_compra = costo;
        imeiData.precio_min = precioMin;
        imeiData.precio_xmayor = precioMayor;
        imeiData.ganancia = ganancia;
        imeiData.usuario = datosEmpresa.usuario?.nombre || 'No Registrado';
        imeiData.almacen = datosEmpresa.empresa.nombre;
        imeiData.created_at = nfecha('timestamp');
        imeiData.updated_at = nfecha('timestamp');
        const insImei = await peticionesFetchOffline('insertData', 'imei', JSON.stringify(imeiData));
        if (insImei && insImei[0] === 'ok') {
          imeis.push(imeiData);
        } else {
          errores.push(`IMEI ${imeiTexto}: ${detalleRespuesta(insImei)}`);
          continue;
        }
      }

      procesados += 1;
    }

    // Recalcular stock por producto afectado (CELULARES: stock = imei DISPONIBLE)
    if (idsProductosAfectados.size > 0) {
      const imeisFresh = await peticionesFetchOffline('getDataAsArray', 'imei', '');
      for (const idProd of idsProductosAfectados) {
        const prod = await peticionesFetchOffline('getDataByField', 'productos', 'id', idProd);
        if (!prod) continue;
        const disponibles = imeisFresh.filter((i) => String(i.id_equi) === String(idProd) && String(i.estado) === 'DISPONIBLE');
        prod.stock = disponibles.length;
        prod.updated_at = nfecha('timestamp');
        await peticionesFetchOffline('updateData', 'productos', JSON.stringify(prod));
      }
    }

    toast.add({
      severity: 'success',
      summary: 'Exito',
      detail: `${procesados} equipo(s) pasados a productos`,
      life: 3500
    });

    if (errores.length) {
      toast.add({
        severity: 'warn',
        summary: 'Atencion',
        detail: `Hubo ${errores.length} error(es). Primer error: ${errores[0]}`,
        life: 7000
      });
      console.warn('Errores pasando equipos a productos:', errores);
    }

    selectedEquipos.value = [];
    await recargarTodo();
  } catch (error) {
    console.error('Error pasando equipos a productos:', error);
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'No se pudo pasar los equipos a productos',
      life: 3500
    });
  } finally {
    loading.value = false;
  }
};

const buscarImeiEnApi = async () => {
  const imei = String(equipoForm.value.imei || '').trim();

  if (!imei) {
    toast.add({
      severity: 'warn',
      summary: 'Atencion',
      detail: 'Debe escribir un IMEI valido',
      life: 3000
    });
    return;
  }

  loading.value = true;
  try {
    const consulta = await enviarDatosPorPost(
      'https://demo.tmposrd.com/api2/consultaimei',
      { servicio: '0', imei },
      tokenCifrado.value
    );

    const ok = consulta?.response?.success === true;
    if (!ok) {
      toast.add({
        severity: 'error',
        summary: 'Error',
        detail: consulta?.response?.status || 'No se encontraron datos para ese IMEI',
        life: 3500
      });
      return;
    }

    const obj = consulta.response.object || {};
    equipoForm.value.marca = obj.brand || equipoForm.value.marca;
    equipoForm.value.modelo = obj.modelName || obj.model || equipoForm.value.modelo;
    equipoForm.value.capacidad = obj.capacity || obj.memory || equipoForm.value.capacidad;

    toast.add({
      severity: 'success',
      summary: 'Exito',
      detail: `IMEI consultado: ${obj.modelName || obj.model || 'Equipo encontrado'}`,
      life: 3000
    });
  } catch (error) {
    console.error('consultaimei error:', error);
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Error de peticion consultando IMEI',
      life: 3000
    });
  } finally {
    loading.value = false;
  }
};

const seleccionarEquipoPorImei = async () => {
  const imeiTexto = String(equipoForm.value.imei || '').trim();
  if (!imeiTexto) {
    toast.add({
      severity: 'warn',
      summary: 'Atencion',
      detail: 'Debe escribir un IMEI para seleccionar su equipo',
      life: 3000
    });
    return;
  }

  loading.value = true;
  try {
    const imeiData = await peticionesFetchOffline('getDataByField', 'imei', 'imei', imeiTexto);
    const productos = await peticionesFetchOffline('getDataAsArray', 'productos', '');
    const productosCel = (productos || []).filter((p) => String(p?.categoria || '').toUpperCase() === 'CELULARES');

    if (!productosCel.length) {
      toast.add({
        severity: 'warn',
        summary: 'Atencion',
        detail: 'No hay productos disponibles para seleccionar',
        life: 3000
      });
      return;
    }

    const inputOptions = productosCel.reduce((acc, p) => {
      acc[p.id] = `${p.codigo || ''} - ${p.nombre || ''} (${p.marca || ''} ${p.modelo || ''})`;
      return acc;
    }, {});

    const seleccionadoPorImei = imeiData?.id_equi ? String(imeiData.id_equi) : '';

    const { value: productoId } = await Swal.fire({
      title: 'Seleccionar equipo',
      text: `IMEI: ${imeiTexto}`,
      input: 'select',
      inputOptions,
      inputValue: seleccionadoPorImei,
      inputPlaceholder: 'Seleccione el equipo al que pertenece',
      showCancelButton: true,
      confirmButtonText: 'Usar equipo',
      cancelButtonText: 'Cancelar',
      width: '42rem',
      zIndex: 999999,
      didOpen: () => {
        const contenedor = document.querySelector('.swal2-container');
        if (contenedor) contenedor.style.zIndex = '999999';
      }
    });

    if (!productoId) return;

    const producto = await peticionesFetchOffline('getDataByField', 'productos', 'id', productoId);
    if (!producto) {
      toast.add({
        severity: 'error',
        summary: 'Error',
        detail: 'No se encontró el producto seleccionado',
        life: 3000
      });
      return;
    }

    equipoForm.value.marca = producto.marca || equipoForm.value.marca;
    equipoForm.value.modelo = producto.nombre || producto.modelo || equipoForm.value.modelo;
    equipoForm.value.proveedor = producto.proveedor || equipoForm.value.proveedor;
    equipoForm.value.id_equi = String(producto.id || '');
    equipoForm.value.capacidad = imeiData?.capacidad || equipoForm.value.capacidad;
    equipoForm.value.costo = toMoney(producto.precio_compra ?? equipoForm.value.costo);
    equipoForm.value.precio_venta = toMoney(producto.precio_venta ?? equipoForm.value.precio_venta);
    equipoForm.value.precio_min = toMoney(producto.precio_min ?? equipoForm.value.precio_min);
    equipoForm.value.precio_xmayor = toMoney(producto.precio_xmayor ?? equipoForm.value.precio_xmayor);

    toast.add({
      severity: 'success',
      summary: 'Exito',
      detail: `Equipo seleccionado: ${producto.nombre || `${producto.marca || ''} ${producto.modelo || ''}`}`.trim(),
      life: 3000
    });
  } catch (error) {
    console.error('Error seleccionando equipo por IMEI:', error);
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'No se pudo seleccionar el equipo por IMEI',
      life: 3000
    });
  } finally {
    loading.value = false;
  }
};
// Registrar producto de Refurbished
const registrarProductoRefurbished = async () => {
  if (!formulario.value.codigo_producto || !formulario.value.nombre_producto) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Debe especificar el producto',
      life: 3000
    });
    return;
  }

  if (!formulario.value.motivo_refurbished) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Debe especificar el motivo',
      life: 3000
    });
    return;
  }

  if (!formulario.value.area_refurbished) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Debe especificar el Ã¡rea de uso',
      life: 3000
    });
    return;
  }

  // Validaciones para productos con seriales
  if (tieneSeriales.value) {
    if (opcionCantidad.value === 'uno' && imeiSeleccionados.value.length !== 1) {
      toast.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Debe seleccionar exactamente un IMEI/Serial',
        life: 3000
      });
      return;
    }

    if (opcionCantidad.value === 'varios' && imeiSeleccionados.value.length === 0) {
      toast.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Debe seleccionar al menos un IMEI/Serial',
        life: 3000
      });
      return;
    }

    if (opcionCantidad.value === 'todos') {
      imeiSeleccionados.value = [...imeiDisponibles.value];
    }
  } else {
    // ValidaciÃ³n para productos sin seriales
    if (formulario.value.cantidad <= 0) {
      toast.add({
        severity: 'error',
        summary: 'Error',
        detail: 'La cantidad debe ser mayor a 0',
        life: 3000
      });
      return;
    }
  }

  loading.value = true;

  try {
    if (tieneSeriales.value) {
      // Procesar productos con IMEI/Serial
      for (const imeiData of imeiSeleccionados.value) {
        // Registrar en refurbished_productos
        const datos = {
          codigo_producto: formulario.value.codigo_producto,
          nombre_producto: formulario.value.nombre_producto,
          cantidad: 1,
          imei_serial: imeiData.imei,
          motivo_refurbished: formulario.value.motivo_refurbished,
          area_refurbished: formulario.value.area_refurbished,
          descripcion: formulario.value.descripcion,
          estado: 'PENDIENTE',
          fecha: nfecha('fecha'),
          hora: nfecha('hora'),
          usuario: datosEmpresa.usuario.nombre,
          created_at: nfecha('timestamp'),
          updated_at: nfecha('timestamp')
        };

        await peticionesFetchOffline('insertData', 'refurbished_productos', JSON.stringify(datos));

        // Actualizar estado del IMEI a 'REFURBISHED'
        imeiData.estado = 'REFURBISHED';
        imeiData.updated_at = nfecha('timestamp');
        await peticionesFetchOffline('updateData', 'imei', JSON.stringify(imeiData));
      }

      // Actualizar stock del producto
      const producto = productosDisponibles.value.find(p =>
        p.codigo === formulario.value.codigo_producto ||
        p.codigo_barra === formulario.value.codigo_producto
      );

      if (producto) {
        const responseImeiDisponibles = await peticionesFetchOffline('getDataArrayByTwoConditions', 'imei', 'id_equi', producto.id, 'estado', 'DISPONIBLE');
        producto.stock = responseImeiDisponibles.length;
        producto.updated_at = nfecha('timestamp');
        await peticionesFetchOffline('updateData', 'productos', JSON.stringify(producto));
      }

      toast.add({
        severity: 'success',
        summary: 'Ã‰xito',
        detail: `${imeiSeleccionados.value.length} producto(s) Enviado(s) para Refurbished`,
        life: 3000
      });

    } else {
      // Procesar productos sin seriales
      const datos = {
        ...formulario.value,
        estado: 'PENDIENTE',
        usuario: datosEmpresa.usuario.nombre,
        fecha: nfecha('fecha'),
        hora: nfecha('hora'),
        created_at: nfecha('timestamp'),
        updated_at: nfecha('timestamp')
      };

      const resultado = await peticionesFetchOffline('insertData', 'refurbished_productos', JSON.stringify(datos));

      if (resultado[0] === 'ok') {
        // Actualizar stock del producto
        const producto = productosDisponibles.value.find(p =>
          p.codigo === formulario.value.codigo_producto ||
          p.codigo_barra === formulario.value.codigo_producto
        );

        if (producto) {
          producto.stock = Number(producto.stock) - formulario.value.cantidad;
          producto.updated_at = nfecha('timestamp');
          await peticionesFetchOffline('updateData', 'productos', JSON.stringify(producto));
        }

        toast.add({
          severity: 'success',
          summary: 'Ã‰xito',
          detail: 'Producto enviado a refurbished',
          life: 3000
        });
      }
    }

    limpiarFormulario();
    await cargarDatos();
    await cargarProductos(); // Recargar lista de productos
    vistaActual.value = 'historial';

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
};

// Devolver producto al inventario normal
const devolverInventario = async (producto) => {
  if (producto.estado === 'Devuelto a inventario') {
    toast.add({
      severity: 'info',
      summary: 'Info',
      detail: 'Este producto ya fue devuelto al inventario',
      life: 3000
    });
    return;
  }

  const result = await Swal.fire({
    title: 'Â¿Devolver al inventario?',
    text: `${producto.nombre_producto} volverÃ¡ al inventario normal`,
    icon: 'question',
    showCancelButton: true,
    confirmButtonText: 'SÃ­, devolver',
    cancelButtonText: 'Cancelar'
  });

  if (!result.isConfirmed) return;

  loading.value = true;
  try {
    const datosActualizados = {
      ...producto,
      estado: 'Devuelto a inventario',
      updated_at: nfecha('timestamp')
    };

    const resultado = await peticionesFetchOffline(
      'updateData',
      'refurbished_productos',
      JSON.stringify(datosActualizados)
    );

    if (resultado[0] !== 'ok') {
      throw new Error('No se pudo actualizar el estado');
    }

    if (producto.imei_serial) {
      const imeis = await peticionesFetchOffline('getDataAsArray', 'imei', '');
      const imeiData = imeis.find((i) => i.imei === producto.imei_serial);

      if (imeiData) {
        imeiData.estado = 'DISPONIBLE';
        imeiData.updated_at = nfecha('timestamp');
        await peticionesFetchOffline('updateData', 'imei', JSON.stringify(imeiData));
      }

      const productos = await peticionesFetchOffline('getDataAsArray', 'productos', '');
      const productoOriginal = productos.find(
        (p) => p.codigo === producto.codigo_producto || p.codigo_barra === producto.codigo_producto
      );

      if (productoOriginal) {
        const responseImeiDisponibles = await peticionesFetchOffline(
          'getDataArrayByTwoConditions',
          'imei',
          'id_equi',
          productoOriginal.id,
          'estado',
          'DISPONIBLE'
        );
        productoOriginal.stock = responseImeiDisponibles.length;
        productoOriginal.updated_at = nfecha('timestamp');
        await peticionesFetchOffline('updateData', 'productos', JSON.stringify(productoOriginal));
      }
    } else {
      const productos = await peticionesFetchOffline('getDataAsArray', 'productos', '');
      const productoOriginal = productos.find(
        (p) => p.codigo === producto.codigo_producto || p.codigo_barra === producto.codigo_producto
      );

      if (productoOriginal) {
        productoOriginal.stock = Number(productoOriginal.stock) + Number(producto.cantidad || 0);
        productoOriginal.updated_at = nfecha('timestamp');
        await peticionesFetchOffline('updateData', 'productos', JSON.stringify(productoOriginal));
      }
    }

    toast.add({
      severity: 'success',
      summary: 'Ã‰xito',
      detail: 'Producto devuelto al inventario normal',
      life: 3000
    });

    await cargarDatos();
    await cargarProductos();
  } catch (error) {
    console.error('Error devolviendo a inventario:', error);
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'No se pudo devolver el producto al inventario',
      life: 3000
    });
  } finally {
    loading.value = false;
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

      const resultado = await peticionesFetchOffline('updateData', 'refurbished_productos', JSON.stringify(datosActualizados));

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
          summary: 'Ã‰xito',
          detail: 'Estado actualizado correctamente',
          life: 3000
        });
        await cargarDatos();
        await cargarProductos();
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
    title: 'Â¿EstÃ¡ seguro?',
    text: `Â¿Desea eliminar el registro de "${producto.nombre_producto}"?`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'SÃ­, eliminar',
    cancelButtonText: 'Cancelar',
    confirmButtonColor: '#d33',
    cancelButtonColor: '#3085d6'
  });

  if (result.isConfirmed) {
    loading.value = true;
    try {
      const resultado = await peticionesFetchOffline('deleteEntry', 'refurbished_productos', producto.id);

      if (resultado[0] === 'ok') {
        toast.add({
          severity: 'success',
          summary: 'Ã‰xito',
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
  tieneSeriales.value = false;
  opcionCantidad.value = 'uno';
  imeiDisponibles.value = [];
  imeiSeleccionados.value = [];
  formulario.value = {
    codigo_producto: '',
    nombre_producto: '',
    cantidad: 1,
    imei_serial: '',
    motivo_refurbished: '',
    area_refurbished: '',
    descripcion: '',
    estado: 'PENDIENTE',
    fecha: nfecha('fecha'),
    hora: nfecha('hora'),
    usuario: ''
  };
};

// Obtener clase de badge segÃºn estado
const getEstadoBadgeClass = (estado) => {
  const clases = {
    'PENDIENTE': 'bg-blue-100 text-blue-700',
    'Devuelto a inventario': 'bg-green-100 text-green-700',
    'Consumido': 'bg-gray-100 text-gray-700',
    'En proceso': 'bg-yellow-100 text-yellow-700',
    'Finalizado': 'bg-purple-100 text-purple-700'
  };
  return clases[estado] || 'bg-gray-100 text-gray-700';
};

const getRowClassByGrado = (data) => {
  const grado = String(data?.grado || '').toUpperCase().trim();
  if (grado === 'A+' || grado === 'A') return 'row-grado-a';
  if (grado === 'B+' || grado === 'B') return 'row-grado-b';
  if (grado === 'C') return 'row-grado-c';
  if (grado === 'D') return 'row-grado-d';
  return '';
};

// Exportar a Excel
const exportarExcel = () => {
  toast.add({
    severity: 'info',
    summary: 'Exportar',
    detail: 'FunciÃ³n de exportaciÃ³n prÃ³ximamente',
    life: 3000
  });
};

// Generar PDF embebido (HTML convertido a PDF)
const generarPDF = async () => {
  try {
    loading.value = true;

    const productos = productosFiltrados.value;

    if (productos.length === 0) {
      toast.add({
        severity: 'warn',
        summary: 'Advertencia',
        detail: 'No hay productos para generar el PDF',
        life: 3000
      });
      loading.value = false;
      return;
    }

    // Obtener descripciÃ³n del filtro
    let tituloFiltro = 'Todos los registros';
    switch (filtroFecha.value) {
      case 'hoy':
        tituloFiltro = 'Registros de Hoy';
        break;
      case 'ayer':
        tituloFiltro = 'Registros de Ayer';
        break;
      case 'ultimos7dias':
        tituloFiltro = 'Ãšltimos 7 DÃ­as';
        break;
      case 'estemes':
        tituloFiltro = 'Este Mes';
        break;
      case 'rango':
        tituloFiltro = `Rango: ${fechaDesde.value || ''} - ${fechaHasta.value || ''}`;
        break;
    }

    // Generar HTML para el PDF
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Productos de Refurbished</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: Arial, sans-serif; padding: 20px; }
          .header { text-align: center; margin-bottom: 30px; border-bottom: 3px solid #3b82f6; padding-bottom: 15px; }
          .header h1 { color: #2563eb; font-size: 24px; margin-bottom: 5px; }
          .header h2 { color: #4b5563; font-size: 16px; margin-bottom: 5px; }
          .header .filtro { color: #059669; font-size: 14px; font-weight: bold; }
          .info { display: flex; justify-content: space-between; margin-bottom: 20px; font-size: 12px; color: #6b7280; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
          th { background-color: #3b82f6; color: white; padding: 10px; text-align: left; font-size: 11px; }
          td { padding: 8px; border-bottom: 1px solid #dbeafe; font-size: 10px; }
          tr:nth-child(even) { background-color: #eff6ff; }
          .footer { text-align: center; margin-top: 30px; padding-top: 15px; border-top: 2px solid #e5e7eb; font-size: 11px; color: #6b7280; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${datosEmpresa.empresa?.nombre || 'Empresa'}</h1>
          <h2>Reporte de Productos de Refurbished</h2>
          <div class="filtro">${tituloFiltro}</div>
        </div>

        <div class="info">
          <div>Fecha: ${nfecha('fecha')} | Hora: ${nfecha('hora')}</div>
          <div>Total de registros: ${productos.length}</div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Fecha</th>
              <th>CÃ³digo</th>
              <th>Producto</th>
              <th>Cant.</th>
              <th>IMEI/Serial</th>
              <th>Motivo</th>
              <th>Área Refurbish</th>
              <th>Estado</th>
              <th>Usuario</th>
            </tr>
          </thead>
          <tbody>
            ${productos.map(p => `
              <tr>
                <td>${p.fecha || ''}</td>
                <td>${p.codigo_producto || ''}</td>
                <td>${p.nombre_producto || ''}</td>
                <td style="text-align: center;">${p.cantidad || ''}</td>
                <td>${p.imei_serial || 'N/A'}</td>
                <td>${p.motivo_refurbished || ''}</td>
                <td>${p.area_refurbished || ''}</td>
                <td>${p.estado || ''}</td>
                <td>${p.usuario || ''}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="footer">
          Generado por Sistema AA
        </div>
      </body>
      </html>
    `;

    // Crear blob del HTML
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);

    pdfUrl.value = url;
    visiblePDF.value = true;
    loading.value = false;

    toast.add({
      severity: 'success',
      summary: 'Vista Generada',
      detail: 'Usa Ctrl+P para imprimir o guardar como PDF',
      life: 5000
    });

  } catch (error) {
    console.error('Error al generar vista:', error);
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Error al generar la vista',
      life: 3000
    });
    loading.value = false;
  }
};

// Cerrar PDF
const cerrarPDF = () => {
  if (pdfUrl.value) {
    URL.revokeObjectURL(pdfUrl.value);
    pdfUrl.value = '';
  }
  visiblePDF.value = false;
};

// Imprimir/Descargar PDF
const descargarPDF = () => {
  if (pdfUrl.value) {
    const iframe = document.querySelector('iframe');
    if (iframe) {
      iframe.contentWindow.print();
    }
  }
};
</script>

<template>
  <div class="productos-refurbished-page">
    <LoadingOverlay :visible="loading" />

    <!-- Header -->
    <div class="page-header">
      <div class="flex items-center gap-3 mb-4">
        <Button
          icon="pi pi-arrow-left"
          severity="secondary"
          text
          rounded
          @click="router.push('/')"
          v-tooltip.bottom="'Volver al inicio'"
        />
        <div class="bg-blue-500 rounded-full p-3">
          <i class="pi pi-box text-white text-2xl"></i>
        </div>
        <div>
          <h1 class="text-3xl font-bold text-gray-800 m-0">Productos de Refurbished</h1>
          <p class="text-sm text-gray-500 m-0">GestiÃ³n de productos enviados para uso de la empresa</p>
        </div>
      </div>
    </div>

    <!-- EstadÃ­sticas -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <Card class="stat-card">
        <template #content>
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-600 mb-1">Total</p>
              <p class="text-3xl font-bold text-gray-800">{{ estadisticas.total }}</p>
            </div>
            <div class="bg-blue-100 rounded-full p-3">
              <i class="pi pi-box text-blue-600 text-2xl"></i>
            </div>
          </div>
        </template>
      </Card>

      <Card class="stat-card">
        <template #content>
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-600 mb-1">PENDIENTE</p>
              <p class="text-3xl font-bold text-blue-600">{{ estadisticas.enUso }}</p>
            </div>
            <div class="bg-blue-100 rounded-full p-3">
              <i class="pi pi-bookmark text-blue-600 text-2xl"></i>
            </div>
          </div>
        </template>
      </Card>

      <Card class="stat-card">
        <template #content>
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-600 mb-1">Devueltos</p>
              <p class="text-3xl font-bold text-green-600">{{ estadisticas.devueltos }}</p>
            </div>
            <div class="bg-green-100 rounded-full p-3">
              <i class="pi pi-check-circle text-green-600 text-2xl"></i>
            </div>
          </div>
        </template>
      </Card>

      <Card class="stat-card">
        <template #content>
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-600 mb-1">Consumidos</p>
              <p class="text-3xl font-bold text-gray-600">{{ estadisticas.consumidos }}</p>
            </div>
            <div class="bg-gray-100 rounded-full p-3">
              <i class="pi pi-minus-circle text-gray-600 text-2xl"></i>
            </div>
          </div>
        </template>
      </Card>
    </div>

    <!-- Main Content Card -->
    <Card>
      <template #content>
        <!-- PestaÃ±as de navegaciÃ³n -->
        <div class="mb-4 border-b border-gray-200">
          <nav class="flex gap-4">
            <button
              @click="vistaActual = 'historial'"
              :class="[
                'px-4 py-2 font-medium text-sm border-b-2 transition-colors',
                vistaActual === 'historial'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              ]"
            >
              <i class="pi pi-list mr-2"></i>Historial ({{ productosRefurbished.length }})
            </button>
            <button
              @click="vistaActual = 'registrar'"
              :class="[
                'px-4 py-2 font-medium text-sm border-b-2 transition-colors',
                vistaActual === 'registrar'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              ]"
            >
              <i class="pi pi-plus-circle mr-2"></i>Registrar Refurbished
            </button>
          </nav>
        </div>

        <!-- Vista de Historial -->
        <div v-if="vistaActual === 'historial'" class="space-y-4">
          <!-- Filtros de Fecha -->
          <div class="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <div class="flex flex-wrap items-end gap-4">
              <div class="flex-1" style="min-width: 250px">
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  <i class="pi pi-calendar mr-1"></i>
                  Filtrar por fecha
                </label>
                <Select
                  v-model="filtroFecha"
                  :options="opcionesFecha"
                  optionLabel="label"
                  optionValue="value"
                  placeholder="Seleccione perÃ­odo"
                  class="w-full"
                />
              </div>

              <!-- Rango de fechas personalizado -->
              <div v-if="filtroFecha === 'rango'" class="flex gap-3 flex-wrap">
                <div style="min-width: 180px">
                  <label class="block text-sm font-medium text-gray-700 mb-2">
                    Desde
                  </label>
                  <DatePicker
                    v-model="fechaDesde"
                    placeholder="Fecha inicio"
                    dateFormat="yy-mm-dd"
                    showIcon
                    class="w-full"
                  />
                </div>
                <div style="min-width: 180px">
                  <label class="block text-sm font-medium text-gray-700 mb-2">
                    Hasta
                  </label>
                  <DatePicker
                    v-model="fechaHasta"
                    placeholder="Fecha fin"
                    dateFormat="yy-mm-dd"
                    showIcon
                    class="w-full"
                  />
                </div>
              </div>

              <!-- Resumen del filtro -->
              <div class="text-sm text-gray-600 bg-blue-50 px-3 py-2 rounded-lg">
                <i class="pi pi-info-circle mr-1"></i>
                <span v-if="filtroFecha === 'hoy'">Mostrando registros de <strong>hoy</strong></span>
                <span v-else-if="filtroFecha === 'ayer'">Mostrando registros de <strong>ayer</strong></span>
                <span v-else-if="filtroFecha === 'ultimos7dias'">Mostrando registros de los <strong>Ãºltimos 7 dÃ­as</strong></span>
                <span v-else-if="filtroFecha === 'estemes'">Mostrando registros de <strong>este mes</strong></span>
                <span v-else-if="filtroFecha === 'rango'">Mostrando rango <strong>personalizado</strong></span>
              </div>
            </div>
          </div>

          <!-- Barra de acciones -->
          <div class="flex flex-wrap items-center justify-between gap-3">
            <span class="p-input-icon-left flex-1" style="min-width: 300px">
              <i class="pi pi-search" />
              <InputText
                v-model="searchQuery"
                placeholder="Buscar por producto, cÃ³digo, motivo, Ã¡rea, estado o IMEI/Serial..."
                class="w-full"
              />
            </span>
            <div class="flex gap-2">
              <Button
                icon="pi pi-plus"
                :label="`Agregar equipo (${equiposRefurbished.length})`"
                severity="primary"
                @click="abrirModalNuevoEquipo"
              />
              <Button
                icon="pi pi-send"
                :label="`Pasar a productos (${selectedEquipos.length})`"
                severity="success"
                outlined
                :disabled="!selectedEquipos.length || loading"
                :loading="loading"
                @click="pasarSeleccionadosAProductos"
              />
              <Button
                icon="pi pi-refresh"
                label="Recargar"
                severity="secondary"
                outlined
                @click="recargarTodo"
              />
              <Button
                icon="pi pi-file-excel"
                label="Exportar"
                severity="success"
                outlined
                @click="exportarExcel"
              />
              <Button
                icon="pi pi-file-pdf"
                label="PDF"
                severity="danger"
                outlined
                @click="generarPDF"
                v-tooltip.bottom="'Generar PDF'"
              />
            </div>
          </div>

          <!-- Tabla de equipos refurbished -->
          <DataTable
            :value="productosFiltrados"
            v-model:selection="selectedEquipos"
            dataKey="id"
            :rowClass="getRowClassByGrado"
            paginator
            :rows="10"
            :rowsPerPageOptions="[5, 10, 20, 50, 100]"
            scrollable
            scrollHeight="600px"
            class="mt-4"
            :emptyMessage="'No hay registros de equipos refurbished'"
          >
            <Column selectionMode="multiple" headerStyle="width: 3rem" />
            <Column field="id" header="ID" style="min-width: 80px" sortable />

            <Column field="created_at" header="Creado" style="min-width: 150px" sortable>
              <template #body="{ data }">
                <span class="text-xs">{{ data.created_at }}</span>
              </template>
            </Column>

            <Column field="updated_at" header="Actualizado" style="min-width: 150px" sortable>
              <template #body="{ data }">
                <span class="text-xs">{{ data.updated_at }}</span>
              </template>
            </Column>

            <Column field="imei" header="IMEI" style="min-width: 150px" sortable />
            <Column field="modelo" header="Modelo" style="min-width: 150px" sortable />
            <Column field="marca" header="Marca" style="min-width: 130px" sortable />
            <Column field="capacidad" header="Capacidad" style="min-width: 120px" sortable />
            <Column field="averia" header="Averia" style="min-width: 180px" />
            <Column field="proveedor" header="Proveedor" style="min-width: 140px" sortable />
            <Column field="estado" header="Estado" style="min-width: 150px" sortable>
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
            <Column field="fecha_ingreso" header="Fecha ingreso" style="min-width: 120px" sortable />
            <Column field="hora_ingreso" header="Hora ingreso" style="min-width: 120px" sortable />
            <Column field="piezas_colocar" header="Piezas a colocar" style="min-width: 180px" />
            <Column field="fecha_reparado" header="Fecha reparado" style="min-width: 130px" sortable />
            <Column field="grado" header="Grado" style="min-width: 90px" sortable />
            <Column v-if="puedeVerSeccionCostos" field="costo" header="Costo" style="min-width: 110px" sortable />
            <Column v-if="puedeVerSeccionCostos" field="precio_venta" header="Precio venta" style="min-width: 120px" sortable />
            <Column v-if="puedeVerSeccionCostos" field="precio_min" header="Precio min" style="min-width: 110px" sortable />
            <Column v-if="puedeVerSeccionCostos" field="precio_xmayor" header="Precio mayor" style="min-width: 120px" sortable />
            <Column v-if="puedeVerSeccionCostos" field="costo_reparacion" header="Costo reparacion" style="min-width: 130px" sortable />
            <Column field="tecnico" header="Tecnico" style="min-width: 140px" sortable />
            <Column field="nota" header="Nota" style="min-width: 180px" />
            <Column field="usuario" header="Usuario" style="min-width: 130px" sortable />

            <Column header="Acciones" style="min-width: 210px" frozen alignFrozen="right">
              <template #body="{ data }">
                <div class="flex gap-2">
                  <Button
                    icon="pi pi-box"
                    severity="success"
                    size="small"
                    outlined
                    @click="agregarIndividualAInventario(data)"
                    v-tooltip.top="'Agregar al inventario'"
                  />
                  <Button
                    icon="pi pi-pencil"
                    severity="info"
                    size="small"
                    @click="editarEquipo(data)"
                    v-tooltip.top="'Editar equipo'"
                  />
                  <Button
                    icon="pi pi-trash"
                    severity="danger"
                    size="small"
                    @click="eliminarEquipoRefurbished(data)"
                    v-tooltip.top="'Eliminar'"
                  />
                </div>
              </template>
            </Column>
          </DataTable>
        </div>

        <!-- Vista de Registro -->
        <div v-else class="space-y-4">
          <div class="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-500">
            <h3 class="text-lg font-semibold mb-3 text-gray-700">
              <i class="pi pi-info-circle mr-2"></i>InformaciÃ³n del Producto
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
                  placeholder="Buscar por cÃ³digo, nombre o descripciÃ³n..."
                  class="w-full"
                  dropdown
                  forceSelection
                >
                  <template #option="slotProps">
                    <div class="flex items-center gap-2">
                      <div>
                        <div class="font-medium">{{ slotProps.option.nombre }}</div>
                        <div class="text-xs text-gray-500">
                          CÃ³digo: {{ slotProps.option.codigo || slotProps.option.codigo_barra }} |
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

            <!-- InformaciÃ³n del Producto Seleccionado -->
            <div v-if="formulario.codigo_producto" class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 pt-4 border-t border-blue-200">
              <div>
                <label for="codigo_producto" class="block text-sm font-medium text-gray-700 mb-2">
                  CÃ³digo del Producto
                </label>
                <InputText
                  id="codigo_producto"
                  v-model="formulario.codigo_producto"
                  placeholder="CÃ³digo o cÃ³digo de barras"
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
                  placeholder="Nombre o descripciÃ³n"
                  class="w-full"
                  readonly
                  disabled
                />
              </div>

              <!-- Si tiene seriales (CELULARES o ELECTRODOMESTICOS) -->
              <div v-if="tieneSeriales" class="md:col-span-2">
                <label class="block text-sm font-medium text-gray-700 mb-3">
                  Â¿CuÃ¡ntos deseas Enviar? <span class="text-red-500">*</span>
                </label>
                <SelectButton
                  v-model="opcionCantidad"
                  :options="opcionesCantidad"
                  optionLabel="label"
                  optionValue="value"
                  class="w-full"
                />

                <!-- Lista de IMEI/Serial disponibles -->
                <div v-if="opcionCantidad !== 'todos'" class="mt-4 border rounded-lg p-4 bg-white">
                  <div class="flex items-center justify-between mb-3">
                    <h4 class="font-semibold text-gray-700">
                      Selecciona {{ opcionCantidad === 'uno' ? 'un' : 'los' }} IMEI/Serial
                    </h4>
                    <span class="text-sm text-gray-500">
                      Disponibles: {{ imeiDisponibles.length }}
                    </span>
                  </div>

                  <div v-if="imeiDisponibles.length === 0" class="text-center text-gray-500 py-4">
                    No hay IMEI/Seriales disponibles
                  </div>

                  <div v-else class="space-y-2 max-h-60 overflow-y-auto">
                    <!-- Si es "uno", usar radio buttons -->
                    <div v-if="opcionCantidad === 'uno'" v-for="imeiData in imeiDisponibles" :key="imeiData.id" class="flex items-center p-2 hover:bg-gray-50 rounded">
                      <RadioButton
                        v-model="imeiSeleccionados"
                        :value="[imeiData]"
                        :inputId="`imei-${imeiData.id}`"
                        name="imei_seleccionado"
                      />
                      <label :for="`imei-${imeiData.id}`" class="ml-3 cursor-pointer flex-1">
                        <div class="font-medium text-gray-900">{{ imeiData.imei }}</div>
                        <div class="text-xs text-gray-500">Fecha: {{ imeiData.fecha }}</div>
                      </label>
                    </div>

                    <!-- Si es "varios", usar checkboxes -->
                    <div v-else v-for="imeiData in imeiDisponibles" :key="imeiData.id" class="flex items-center p-2 hover:bg-gray-50 rounded">
                      <Checkbox
                        v-model="imeiSeleccionados"
                        :value="imeiData"
                        :inputId="`imei-${imeiData.id}`"
                      />
                      <label :for="`imei-${imeiData.id}`" class="ml-3 cursor-pointer flex-1">
                        <div class="font-medium text-gray-900">{{ imeiData.imei }}</div>
                        <div class="text-xs text-gray-500">Fecha: {{ imeiData.fecha }}</div>
                      </label>
                    </div>
                  </div>

                  <div v-if="opcionCantidad === 'varios'" class="flex gap-2 mt-3 pt-3 border-t">
                    <Button
                      label="Seleccionar Todos"
                      icon="pi pi-check-square"
                      severity="secondary"
                      outlined
                      size="small"
                      @click="imeiSeleccionados = [...imeiDisponibles]"
                      :disabled="imeiDisponibles.length === 0"
                    />
                    <Button
                      label="Deseleccionar Todos"
                      icon="pi pi-stop"
                      severity="secondary"
                      outlined
                      size="small"
                      @click="imeiSeleccionados = []"
                    />
                  </div>

                  <div class="text-sm text-gray-600 mt-3 bg-blue-50 p-2 rounded">
                    <i class="pi pi-info-circle mr-1"></i>
                    Seleccionados: {{ imeiSeleccionados.length }}
                  </div>
                </div>

                <div v-else class="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div class="flex items-start gap-2">
                    <i class="pi pi-exclamation-triangle text-yellow-600 mt-1"></i>
                    <div>
                      <p class="font-semibold text-yellow-800">Todos los IMEI/Seriales serán enviados</p>
                      <p class="text-sm text-yellow-700 mt-1">
                        Se enviarán <strong>{{ imeiDisponibles.length }}</strong> unidades para Refurbished
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Si NO tiene seriales, mostrar campo de cantidad normal -->
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
                <label for="motivo_refurbished" class="block text-sm font-medium text-gray-700 mb-2">
                  Motivo Refurbish <span class="text-red-500">*</span>
                </label>
                <Select
                  id="motivo_refurbished"
                  v-model="formulario.motivo_refurbished"
                  :options="motivosRefurbished"
                  placeholder="Seleccione motivo"
                  class="w-full"
                />
              </div>

              <div>
                <label for="area_refurbished" class="block text-sm font-medium text-gray-700 mb-2">
                  Área Refurbish <span class="text-red-500">*</span>
                </label>
                <Select
                  id="area_refurbished"
                  v-model="formulario.area_refurbished"
                  :options="areasRefurbished"
                  placeholder="Seleccione Ã¡rea"
                  class="w-full"
                />
              </div>

            </div>
          </div>

          <div class="bg-indigo-50 p-4 rounded-lg border-l-4 border-indigo-500">
            <h3 class="text-lg font-semibold mb-3 text-gray-700">
              <i class="pi pi-file-edit mr-2"></i>DescripciÃ³n Adicional
            </h3>
            <div>
              <label for="descripcion" class="block text-sm font-medium text-gray-700 mb-2">
                DescripciÃ³n
              </label>
              <Textarea
                id="descripcion"
                v-model="formulario.descripcion"
                rows="4"
                placeholder="Describa detalles adicionales del proceso de refurbished..."
                class="w-full"
              />
            </div>
          </div>

          <div class="flex justify-end gap-2 pt-4">
            <Button
              label="Cancelar"
              icon="pi pi-times"
              severity="secondary"
              outlined
              @click="limpiarFormulario(); vistaActual = 'historial'"
            />
            <Button
              label="Registrar Refurbished"
              icon="pi pi-save"
              severity="primary"
              @click="registrarProductoRefurbished"
              :loading="loading"
            />
          </div>
        </div>
      </template>
    </Card>
  </div>

  <Dialog
    v-model:visible="visibleModalEquipo"
    modal
    :header="equipoEditandoId ? 'Editar Equipo Refurbished' : 'Agregar Equipo Refurbished'"
    :style="{ width: '70rem' }"
  >
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <label class="block text-sm font-medium mb-2">IMEI</label>
        <div class="flex gap-2">
          <InputText v-model="equipoForm.imei" class="w-full" />
          <Button
            icon="pi pi-search"
            label="Buscar IMEI"
            severity="secondary"
            outlined
            :loading="loading"
            @click="buscarImeiEnApi"
          />
          <Button
            icon="pi pi-list"
            label="Seleccionar equipo"
            severity="info"
            outlined
            :loading="loading"
            @click="seleccionarEquipoPorImei"
          />
        </div>
      </div>
      <div>
        <label class="block text-sm font-medium mb-2">Modelo</label>
        <InputText v-model="equipoForm.modelo" class="w-full" />
      </div>
      <div>
        <label class="block text-sm font-medium mb-2">Marca</label>
        <InputText v-model="equipoForm.marca" class="w-full" />
      </div>
      <div>
        <label class="block text-sm font-medium mb-2">Capacidad</label>
        <Select
          v-model="equipoForm.capacidad"
          :options="capacidadOptions"
          placeholder="Seleccione capacidad"
          class="w-full"
        />
      </div>
      <div class="md:col-span-2">
        <label class="block text-sm font-medium mb-2">Averia</label>
        <Textarea v-model="equipoForm.averia" rows="2" class="w-full" />
        <div class="mt-2">
          <p class="text-xs text-gray-600 mb-2">Categorias como opciones rapidas:</p>
          <div class="flex flex-wrap gap-2 mb-3">
            <Button
              v-for="categoria in categoriasAveriaOptions"
              :key="`categoria-${categoria}`"
              :label="categoria"
              size="small"
              severity="contrast"
              outlined
              @click="agregarAveriaPredeterminada(categoria)"
            />
          </div>
          <p class="text-xs text-gray-600 mb-2">Averias por categoria (click para desplegar):</p>
          <div class="space-y-2 max-h-72 overflow-y-auto pr-1">
            <details
              v-for="item in averiasPorCategoria"
              :key="item.categoria"
              class="border rounded-lg p-2 bg-gray-50"
            >
              <summary class="cursor-pointer font-semibold text-sm text-gray-700 select-none">
                {{ item.categoria }}
              </summary>
              <div class="flex flex-wrap gap-2 mt-2">
                <Button
                  v-for="averia in item.averias"
                  :key="`${item.categoria}-${averia}`"
                  :label="averia"
                  size="small"
                  severity="secondary"
                  outlined
                  @click="agregarAveriaPredeterminada(averia)"
                />
              </div>
            </details>
          </div>
        </div>
      </div>
      <div class="md:col-span-2 grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <label class="block text-sm font-medium mb-2">Proveedor</label>
          <Select
            v-model="equipoForm.proveedor"
            :options="proveedoresOptions"
            placeholder="Seleccione proveedor"
            editable
            filter
            class="w-full"
          />
        </div>
        <div>
          <label class="block text-sm font-medium mb-2">Estado</label>
          <Select v-model="equipoForm.estado" :options="estadoEquipoOptions" class="w-full" />
        </div>
        <div>
          <label class="block text-sm font-medium mb-2">Fecha ingreso</label>
          <InputText v-model="equipoForm.fecha_ingreso" placeholder="dd/mm/yyyy" class="w-full" />
        </div>
        <div>
          <label class="block text-sm font-medium mb-2">Hora ingreso</label>
          <InputText v-model="equipoForm.hora_ingreso" type="time" class="w-full" />
        </div>
      </div>
      <div class="md:col-span-2">
        <label class="block text-sm font-medium mb-2">Piezas a colocar</label>
        <Textarea v-model="equipoForm.piezas_colocar" rows="2" class="w-full" />
      </div>
      <div v-if="puedeVerSeccionCostos" class="md:col-span-2 border rounded-lg p-3 bg-slate-50">
        <p class="text-sm font-semibold mb-3">Costos y precios</p>
        <div class="grid grid-cols-1 md:grid-cols-5 gap-3">
          <div>
            <label class="block text-sm font-medium mb-2">Costo</label>
            <InputText v-model="equipoForm.costo" type="number" step="0.01" min="0" class="w-full" />
          </div>
          <div>
            <label class="block text-sm font-medium mb-2">Precio venta</label>
            <InputText v-model="equipoForm.precio_venta" type="number" step="0.01" min="0" class="w-full" />
          </div>
          <div>
            <label class="block text-sm font-medium mb-2">Precio min</label>
            <InputText v-model="equipoForm.precio_min" type="number" step="0.01" min="0" class="w-full" />
          </div>
          <div>
            <label class="block text-sm font-medium mb-2">Precio mayor</label>
            <InputText v-model="equipoForm.precio_xmayor" type="number" step="0.01" min="0" class="w-full" />
          </div>
          <div>
            <label class="block text-sm font-medium mb-2">Costo reparacion</label>
            <InputText v-model="equipoForm.costo_reparacion" type="number" step="0.01" min="0" class="w-full" />
          </div>
        </div>
      </div>
      <div class="md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label class="block text-sm font-medium mb-2">Fecha reparado</label>
          <InputText v-model="equipoForm.fecha_reparado" type="date" class="w-full" />
        </div>
        <div>
          <label class="block text-sm font-medium mb-2">Grado</label>
          <Select v-model="equipoForm.grado" :options="gradoOptions" class="w-full" />
        </div>
        <div>
          <label class="block text-sm font-medium mb-2">Tecnico</label>
          <Select
            v-model="equipoForm.tecnico"
            :options="tecnicosOptions"
            placeholder="Seleccione tecnico"
            class="w-full"
          />
        </div>
      </div>
      <div class="md:col-span-2">
        <label class="block text-sm font-medium mb-2">Nota</label>
        <Textarea v-model="equipoForm.nota" rows="3" class="w-full" />
      </div>
    </div>

    <template #footer>
      <div class="flex justify-end gap-2">
        <Button label="Cancelar" severity="secondary" outlined @click="visibleModalEquipo = false; limpiarEquipoForm()" />
        <Button :label="equipoEditandoId ? 'Actualizar equipo' : 'Guardar equipo'" severity="primary" :loading="loading" @click="guardarEquipoRefurbished" />
      </div>
    </template>
  </Dialog>
  <!-- Dialog PDF Embebido -->
  <Dialog
    v-model:visible="visiblePDF"
    modal
    :header="'Vista Previa del PDF'"
    :style="{ width: '90vw', height: '90vh' }"
    :maximizable="true"
    :dismissableMask="false"
  >
    <template #header>
      <div class="flex items-center gap-3">
        <div class="bg-blue-500 rounded-full p-2">
          <i class="pi pi-file-pdf text-white text-xl"></i>
        </div>
        <div>
          <h2 class="text-xl font-bold text-gray-800 m-0">Vista Previa del PDF</h2>
          <p class="text-sm text-gray-500 m-0">Reporte de Productos de Refurbished</p>
        </div>
      </div>
    </template>

    <div class="w-full h-full" style="min-height: 70vh;">
      <iframe
        v-if="pdfUrl"
        :src="pdfUrl"
        class="w-full h-full border-0"
        style="min-height: 70vh;"
      />
    </div>

    <template #footer>
      <div class="flex justify-between items-center">
        <div class="text-sm text-gray-500">
          <i class="pi pi-info-circle mr-1"></i>
          Usa Ctrl+P o el botÃ³n "Imprimir" para guardar como PDF
        </div>
        <div class="flex gap-2">
          <Button
            label="Imprimir/Guardar PDF"
            icon="pi pi-print"
            severity="success"
            @click="descargarPDF"
          />
          <Button
            label="Cerrar"
            icon="pi pi-times"
            severity="secondary"
            outlined
            @click="cerrarPDF"
          />
        </div>
      </div>
    </template>
  </Dialog>

  <Toast />
</template>

<style scoped>
.productos-refurbished-page {
  padding: 1.5rem;
  background-color: #f8f9fa;
  min-height: 100vh;
}

.page-header {
  margin-bottom: 2rem;
}

.stat-card {
  transition: transform 0.2s;
}

.stat-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.truncate {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 200px;
}

:deep(.p-datatable .p-datatable-thead > tr > th) {
  background-color: #f8f9fa;
  color: #495057;
  font-weight: 600;
}

:deep(.p-datatable .p-datatable-tbody > tr:hover) {
  background-color: #f8f9fa;
}

:deep(.p-datatable .p-datatable-tbody > tr.row-grado-a) {
  background-color: #86efac;
}

:deep(.p-datatable .p-datatable-tbody > tr.row-grado-b) {
  background-color: #93c5fd;
}

:deep(.p-datatable .p-datatable-tbody > tr.row-grado-c) {
  background-color: #fde047;
}

:deep(.p-datatable .p-datatable-tbody > tr.row-grado-d) {
  background-color: #f87171;
}

:deep(.p-datatable .p-datatable-tbody > tr.row-grado-a:hover) {
  background-color: #4ade80;
}

:deep(.p-datatable .p-datatable-tbody > tr.row-grado-b:hover) {
  background-color: #60a5fa;
}

:deep(.p-datatable .p-datatable-tbody > tr.row-grado-c:hover) {
  background-color: #facc15;
}

:deep(.p-datatable .p-datatable-tbody > tr.row-grado-d:hover) {
  background-color: #ef4444;
}

:deep(.swal2-container) {
  z-index: 3000 !important;
}
</style>
