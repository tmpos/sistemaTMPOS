<script setup>
import { ref, computed, onMounted, watchEffect, watch, nextTick } from 'vue';
import { useToast } from "primevue/usetoast";
import { useRouter } from 'vue-router';
import Swal from 'sweetalert2';
import {
  enviarDatosPorPost,
  nfecha,
  arrayToObjetoFromTabla,
  peticionesFetch,
  encryptarPassword,
  envioElectron,
  generadorCodigo,
  generarCodigoUnico,
  generarCodigoAlfaNumerico,
  cajeroACtivo,
  peticionesFetchOffline,
  arrayToObjetoFromTablaOffline
} from '@/funciones/funciones.js';
import { useDatosEmpresa } from '@/stores';

const router = useRouter();
const toast = useToast();
const datosEmpresa = useDatosEmpresa();

// Referencias de configuración
const link = ref('');
const api = ref('');
const token = ref('');
const tokenCifrado = ref('');
const tokenCorto = ref('');
const loading = ref(false);

// Gasto Personal
const visibleGastoPersonal = ref(false);
const loadingGasto = ref(false);
const bancosArray = ref([]);
const cuentasArray = ref([]);
const usuarioLocal = ref({});
const gastoPersonal = ref({
  descripcion: '',
  proveedor: '',
  rnc_proveedor: '',
  no_factura: '',
  ncf_proveedor: '',
  monto: 0,
  estado: 'PAGADO',
  metodo_pago: 'EFECTIVO',
  cuenta_seleccionada: null
});

const bancosParaGasto = computed(() => [
  ...bancosArray.value.map(b => ({ ...b, _source: 'banco' })),
  ...cuentasArray.value.map(c => ({ ...c, tipo: c.categoria || c.tipo, _source: 'cuentas' }))
]);

// Datos del formulario
const compra = ref({
  proveedor: '',
  rnc_proveedor: '',
  fecha: nfecha('fecha'),
  no_factura: '',
  ncf_proveedor: '',
  estado: 'PENDIENTE',
  metodo_pago: 'EFECTIVO',
  subtotal: '0.00',
  descuento: '0.00',
  impuesto: '0.00',
  total: '0.00',
  abono: '0.00',
  saldo: '0.00',
  nota: '',
  productos: '[]'
});

// Producto individual
const producto = ref({
  codigo: generarCodigoUnico(),
  codigo_barra: generarCodigoUnico(),
  nombre: '',
  categoria: '',
  marca: 'GENERICO',
  precio_compra: 0,
  precio_venta: 0,
  precio_final: 0,
  precio_min: 0,
  precio_xmayor: 0,
  ganancia: 0,
  impuestos: 0,
  impuesto_venta: 0,
  stock: 1,
  tipo_impuesto: 'Sin Imp',
  imeis: ''
});

// Listas
const proveedores = ref([]);
const categorias = ref([]);
const productosExistentes = ref([]);
const productosExistentesAlmacenActual = computed(() => {
  const almacenActual = almacenSeleccionado.value || datosEmpresa?.empresa?.nombre;
  if (!almacenActual) return productosExistentes.value;

  return productosExistentes.value.filter(
    (producto) => String(producto?.almacen || '').trim() === String(almacenActual).trim()
  );
});
const productosAgregados = computed(() => JSON.parse(compra.value.productos));
const datosCajero = ref({});
const datosConfiguracion = ref({});
const almacenesArray = ref([]);
const almacenSeleccionado = ref(null);

// Búsqueda de proveedor
const tipoBusquedaProveedor = ref('RNC');
const documentoBusqueda = ref('');

// Opciones
const estadosOptions = [
  { label: 'PENDIENTE', value: 'PENDIENTE', severity: 'warning' },
  { label: 'PAGADO', value: 'PAGADO', severity: 'success' },
  { label: 'CREDITO', value: 'CREDITO', severity: 'info' }
];

const metodoPagoOptions = [
  { label: 'EFECTIVO', value: 'EFECTIVO' },
  { label: 'TRANSFERENCIA', value: 'TRANSFERENCIA' },
  { label: 'TARJETA', value: 'TARJETA' },
  { label: 'CHEQUE', value: 'CHEQUE' }
];

const tipoImpuestoOptions = [
  { label: 'Sin Impuesto', value: 'Sin Imp' },
  { label: 'Incluido', value: 'Incluido' },
  { label: 'Agregado', value: 'Agregado' }
];

const tipoBusquedaOptions = [
  { label: 'Cédula', value: 'CEDULA' },
  { label: 'RNC', value: 'RNC' }
];

const tipoProductoOptions = ['Producto Normal', 'Celular'];
const tipoProducto = ref('Producto Normal');

const opcionesCapacidad = ref(['32GB', '64GB', '128GB', '256GB', '512GB', '1TB', '2TB']);

// IMEI Management (Celular)
const imeiInput = ref('');
const bateriaInput = ref(100);
const imeisList = ref([]);
const imeiInputRef = ref(null);

// =============== INICIALIZACIÓN ===============
onMounted(async () => {
  const datosJSON = await envioElectron('datosarchivo');
  link.value = datosJSON.VITE_LINKURL;
  api.value = datosJSON.VITE_LINK_API;
  token.value = datosJSON.VITE_TOKEN;
  tokenCorto.value = datosJSON.VITE_TOKEN_CORTO;
  tokenCifrado.value = await encryptarPassword(token.value, 10);

  datosConfiguracion.value = JSON.parse(window.localStorage.getItem('configuracion') || '{}');

  await cargarProveedores();
  await cargarCategorias();
  await cargarAlmacenes();

  // Inicializar almacén seleccionado con el actual
  almacenSeleccionado.value = datosEmpresa.empresa.nombre;

  await cargarProductos();
  await cargarBancos();
  await cargarCuentas();

  usuarioLocal.value = JSON.parse(window.localStorage.getItem('usuarioLocal') || '[]')[0] || {};
  datosCajero.value = await cajeroACtivo(link.value + api.value);
  compra.value.no_factura = generarCodigoAlfaNumerico(5, 'C');

  if (categorias.value.length > 0) {
    producto.value.categoria = categorias.value[0].nombre;
  }

});

// Sincronizar documentoBusqueda con rnc_proveedor
watch(() => compra.value.rnc_proveedor, (newVal) => {
  if (newVal && newVal !== documentoBusqueda.value) {
    documentoBusqueda.value = newVal;
  }
});

// =============== CARGAR DATOS ===============
const cargarProveedores = async () => {
  const response = await peticionesFetchOffline('getDataAsArray', 'proveedores');
  proveedores.value = response || [];
};

const cargarCategorias = async () => {
  const response = await peticionesFetchOffline('getDataAsArray', 'categorias');
  categorias.value = response || [];
};

const cargarProductos = async () => {
  const almacenFiltro = almacenSeleccionado.value || datosEmpresa.empresa.nombre;
  const response = await peticionesFetchOffline('getDataArrayByCondition', 'productos', 'almacen', almacenFiltro);
  productosExistentes.value = response || [];
};

const cargarAlmacenes = async () => {
  try {
    const response = await peticionesFetchOffline('getDataAsArray', 'empresa');
    if (response && response.length > 0) {
      almacenesArray.value = response.map(emp => emp.nombre).filter(Boolean);
    } else {
      // Si no hay empresas, agregar el actual por defecto
      almacenesArray.value = [datosEmpresa.empresa.nombre];
    }
  } catch (error) {
    console.error('Error cargando almacenes:', error);
    // Usar el almacén actual como fallback
    almacenesArray.value = [datosEmpresa.empresa.nombre];
  }
};

const cargarBancos = async () => {
  const response = await peticionesFetchOffline('getDataArrayByCondition', 'banco', 'almacen', almacenSeleccionado.value || datosEmpresa.empresa.nombre);
  bancosArray.value = response || [];
};

const cargarCuentas = async () => {
  const response = await peticionesFetchOffline('getDataAsArray', 'cuentas');
  cuentasArray.value = response || [];
};

watch(almacenSeleccionado, async (nuevoAlmacen) => {
  if (!nuevoAlmacen) return;
  await Promise.all([cargarProductos(), cargarBancos()]);
});

// =============== PROVEEDOR ===============
const buscarDocumentoProveedor = async () => {
  if (!documentoBusqueda.value) {
    const tipoDoc = tipoBusquedaProveedor.value === 'CEDULA' ? 'Cédula' : 'RNC';
    toast.add({ severity: 'warn', summary: 'Advertencia', detail: `Ingrese ${tipoDoc}`, life: 3000 });
    return;
  }

  loading.value = true;
  let response = null;

  try {
    if (tipoBusquedaProveedor.value === 'CEDULA') {
      // Búsqueda por cédula
      response = await peticionesFetch(
        'https://demo.tmposrd.com/api2',
        'buscarcedula',
        { cedula: documentoBusqueda.value },
        tokenCifrado.value,
        'POST'
      );

      if (response && response.datos) {
        compra.value.proveedor = response.datos.name;
        compra.value.rnc_proveedor = documentoBusqueda.value;
        toast.add({ severity: 'success', summary: 'OK', detail: 'Datos encontrados', life: 3000 });
      } else {
        toast.add({ severity: 'error', summary: 'Error', detail: 'Cédula no encontrada', life: 3000 });
      }
    } else {
      // Búsqueda por RNC
      response = await peticionesFetch(
        'https://demo.tmposrd.com/api2',
        `consultarrnc/${documentoBusqueda.value}`,
        {},
        tokenCifrado.value,
        'GET'
      );

      if (response) {
        compra.value.proveedor = response.razon_social;
        compra.value.rnc_proveedor = documentoBusqueda.value;
        const formattedData = Object.entries(response)
          .map(([key, value]) => `<li><strong>${key}:</strong> ${value}</li>`)
          .join('');

        Swal.fire({
          title: 'Datos del Proveedor',
          html: `<ul style="text-align: left;">${formattedData}</ul>`,
          icon: 'success',
          confirmButtonText: 'Cerrar'
        });
      } else {
        toast.add({ severity: 'error', summary: 'Error', detail: 'RNC no encontrado', life: 3000 });
      }
    }
  } catch (error) {
    const tipoDoc = tipoBusquedaProveedor.value === 'CEDULA' ? 'cédula' : 'RNC';
    toast.add({ severity: 'error', summary: 'Error', detail: `Error al consultar ${tipoDoc}`, life: 3000 });
  } finally {
    loading.value = false;
  }
};

const buscarRNC = buscarDocumentoProveedor;

const seleccionarProveedor = (nombreProveedor) => {
  const prov = proveedores.value.find(p => p.nombre === nombreProveedor);
  if (prov) {
    compra.value.proveedor = prov.nombre;
    compra.value.rnc_proveedor = prov.rnc;
  }
};

// =============== PRODUCTO ===============
const seleccionarProductoExistente = (nombreProducto) => {
  const prod = productosExistentesAlmacenActual.value.find(p => p.nombre === nombreProducto);
  if (prod) {
    producto.value.codigo = prod.codigo;
    producto.value.codigo_barra = prod.codigo_barra;
    producto.value.nombre = prod.nombre;
    producto.value.precio_compra = parseFloat(prod.precio_compra) || 0;
    producto.value.precio_venta = parseFloat(prod.precio_venta) || 0;
    producto.value.precio_final = parseFloat(prod.precio_final) || 0;
    producto.value.precio_min = parseFloat(prod.precio_min) || 0;
    producto.value.precio_xmayor = parseFloat(prod.precio_xmayor) || 0;
    producto.value.ganancia = parseFloat(prod.ganancia) || 0;
    producto.value.impuestos = parseFloat(prod.impuestos) || 0;
    producto.value.impuesto_venta = parseFloat(prod.impuesto_venta) || 0;
    producto.value.categoria = prod.categoria;
    producto.value.marca = prod.marca;
  }
};

const calcularPrecios = () => {
  const precioCompra = parseFloat(producto.value.precio_compra) || 0;
  const ganancia = parseFloat(producto.value.ganancia) || 0;
  const impuesto = parseFloat(producto.value.impuestos) || 0;

  const gananciaCalculada = precioCompra * (ganancia / 100);
  let precioVenta = precioCompra + gananciaCalculada;

  if (impuesto > 0) {
    const impuestoCalculado = precioVenta * (impuesto / 100);
    producto.value.precio_final = parseFloat((precioVenta + impuestoCalculado).toFixed(2));
    producto.value.impuesto_venta = parseFloat(impuestoCalculado.toFixed(2));
  } else {
    producto.value.precio_final = parseFloat(precioVenta.toFixed(2));
    producto.value.impuesto_venta = 0;
  }

  producto.value.precio_venta = parseFloat(precioVenta.toFixed(2));
  producto.value.precio_min = parseFloat((precioCompra + (gananciaCalculada * 0.8)).toFixed(2));
  producto.value.precio_xmayor = parseFloat((precioCompra + (gananciaCalculada * 0.6)).toFixed(2));
};

const calcularGananciaDesdeVenta = () => {
  const precioCompra = parseFloat(producto.value.precio_compra) || 0;
  const precioVenta = parseFloat(producto.value.precio_venta) || 0;

  if (precioCompra <= 0) return;

  const gananciaCalculada = precioVenta - precioCompra;
  const porcentaje = (gananciaCalculada / precioCompra) * 100;
  producto.value.ganancia = parseFloat(porcentaje.toFixed(2));

  const impuesto = parseFloat(producto.value.impuestos) || 0;
  if (impuesto > 0) {
    const impuestoCalculado = precioVenta * (impuesto / 100);
    producto.value.precio_final = parseFloat((precioVenta + impuestoCalculado).toFixed(2));
    producto.value.impuesto_venta = parseFloat(impuestoCalculado.toFixed(2));
  } else {
    producto.value.precio_final = parseFloat(precioVenta.toFixed(2));
    producto.value.impuesto_venta = 0;
  }

  producto.value.precio_min = parseFloat((precioCompra + (gananciaCalculada * 0.8)).toFixed(2));
  producto.value.precio_xmayor = parseFloat((precioCompra + (gananciaCalculada * 0.6)).toFixed(2));
};

// Watchers bidireccionales con flag + nextTick para evitar loops y decimales espurios
let _calcFlag = false;

watch(() => producto.value.ganancia, async () => {
  if (_calcFlag) return;
  _calcFlag = true;
  calcularPrecios();
  await nextTick();
  _calcFlag = false;
});

watch(() => producto.value.precio_venta, async () => {
  if (_calcFlag) return;
  _calcFlag = true;
  calcularGananciaDesdeVenta();
  await nextTick();
  _calcFlag = false;
});

const aplicarImpuesto = () => {
  if (producto.value.tipo_impuesto === 'Sin Imp') {
    producto.value.impuestos = 0;
  } else if (datosConfiguracion.value.impuesto) {
    producto.value.impuestos = parseFloat(datosConfiguracion.value.impuesto);
  }
  calcularPrecios();
};

const agregarImei = async () => {
  const imei = imeiInput.value.trim();
  if (!imei) {
    toast.add({ severity: 'warn', summary: 'Advertencia', detail: 'Ingrese un IMEI', life: 2000 });
    return;
  }
  if (imeisList.value.some(i => i.imei === imei)) {
    toast.add({ severity: 'warn', summary: 'Advertencia', detail: 'Este IMEI ya fue agregado', life: 2000 });
    imeiInput.value = '';
    return;
  }
  if (imei.length !== 15) {
    toast.add({ severity: 'warn', summary: 'Advertencia', detail: 'El IMEI debe tener exactamente 15 dígitos', life: 3000 });
    return;
  }
  if (!/^\d+$/.test(imei)) {
    toast.add({ severity: 'warn', summary: 'Advertencia', detail: 'El IMEI solo debe contener números', life: 3000 });
    return;
  }
  const verificaExiste = await peticionesFetchOffline('getDataByField', 'imei', 'imei', imei);
  if (verificaExiste) {
    toast.add({ severity: 'error', summary: 'Error', detail: 'Este IMEI ya está registrado en el sistema', life: 3000 });
    imeiInput.value = '';
    return;
  }
  const bateriaActual = bateriaInput.value;
  imeisList.value.push({
    imei,
    bateria: bateriaActual,
    capacidad: '64GB',
    precio_compra: parseFloat(producto.value.precio_compra) || 0,
    precio_venta: parseFloat(producto.value.precio_venta) || 0,
    precio_min: parseFloat(producto.value.precio_min) || 0,
    precio_xmayor: parseFloat(producto.value.precio_xmayor) || 0,
  });
  producto.value.stock = imeisList.value.length;
  imeiInput.value = '';
  bateriaInput.value = 100;
  if (imeiInputRef.value) {
    imeiInputRef.value.$el?.querySelector('input')?.focus();
  }
  toast.add({ severity: 'success', summary: 'IMEI Agregado', detail: `IMEI: ${imei} - Batería: ${bateriaActual}%`, life: 1500 });
};

const eliminarImei = (index) => {
  imeisList.value.splice(index, 1);
  producto.value.stock = imeisList.value.length || 1;
  toast.add({ severity: 'info', summary: 'IMEI Eliminado', life: 1500 });
};

const aplicarPreciosATodos = () => {
  imeisList.value.forEach(imei => {
    imei.precio_compra = parseFloat(producto.value.precio_compra) || 0;
    imei.precio_venta = parseFloat(producto.value.precio_venta) || 0;
    imei.precio_min = parseFloat(producto.value.precio_min) || 0;
    imei.precio_xmayor = parseFloat(producto.value.precio_xmayor) || 0;
  });
  toast.add({ severity: 'success', summary: 'Precios Actualizados', detail: 'Se aplicaron los precios a todos los IMEIs', life: 2000 });
};

const insertarImeiEnCompra = async (imeiData, productoId, productoNombre) => {
  try {
    console.log('--- Insertando IMEI en compra ---');
    console.log('IMEI Data:', imeiData);
    console.log('Producto ID:', productoId);
    console.log('Producto Nombre:', productoNombre);

    const datoscamposImei = await arrayToObjetoFromTablaOffline('imei');
    datoscamposImei.imei = imeiData.imei;
    datoscamposImei.bateria = imeiData.bateria || 100;
    datoscamposImei.capacidad = imeiData.capacidad || '64GB';
    datoscamposImei.equipo = productoNombre;
    datoscamposImei.id_equi = productoId;
    datoscamposImei.proveedor = compra.value.proveedor;
    datoscamposImei.precio_compra = imeiData.precio_compra;
    datoscamposImei.precio_venta = imeiData.precio_venta;
    datoscamposImei.precio_min = imeiData.precio_min;
    datoscamposImei.precio_xmayor = imeiData.precio_xmayor;
    datoscamposImei.no_compra = compra.value.no_factura;
    datoscamposImei.estado = 'DISPONIBLE';
    datoscamposImei.fecha = nfecha('fecha');
    datoscamposImei.almacen = almacenSeleccionado.value;
    datoscamposImei.detalles = '';
    if (datoscamposImei.hasOwnProperty('created_at')) {
      datoscamposImei.created_at = nfecha('timestamp');
      datoscamposImei.updated_at = nfecha('timestamp');
    }

    console.log('Datos IMEI a insertar:', datoscamposImei);

    const envioDatos = await peticionesFetchOffline('insertData', 'imei', JSON.stringify(datoscamposImei));

    console.log('Resultado de insertData:', envioDatos);

    const exito = envioDatos[0] === 'ok';
    console.log(exito ? '✅ IMEI insertado correctamente' : '❌ Error al insertar IMEI');

    return exito;
  } catch (error) {
    console.error('❌ Error insertando IMEI:', error);
    return false;
  }
};

const agregarProducto = async () => {
  if (!producto.value.nombre) {
    toast.add({ severity: 'warn', summary: 'Advertencia', detail: 'Ingrese nombre del producto', life: 3000 });
    return;
  }

  if (!compra.value.proveedor) {
    toast.add({ severity: 'warn', summary: 'Advertencia', detail: 'Seleccione un proveedor', life: 3000 });
    return;
  }

  if (tipoProducto.value === 'Celular' && imeisList.value.length === 0) {
    toast.add({ severity: 'warn', summary: 'Advertencia', detail: 'Agregue al menos un IMEI para el celular', life: 3000 });
    return;
  }

  // Verificar si el producto existe en inventario con otro proveedor
  const prodEnInventario = productosExistentes.value.find(
    p => p.codigo === producto.value.codigo && p.nombre.toUpperCase() === producto.value.nombre.toUpperCase()
  );
  if (prodEnInventario && prodEnInventario.proveedor !== compra.value.proveedor) {
    const result = await Swal.fire({
      title: 'Producto de otro proveedor',
      html: `
        <div style="text-align: left; padding: 0.5rem;">
          <p>El producto <strong>${prodEnInventario.nombre}</strong> ya existe en inventario.</p>
          <br>
          <p><strong>Proveedor actual:</strong> ${prodEnInventario.proveedor}</p>
          <p><strong>Proveedor de esta compra:</strong> ${compra.value.proveedor}</p>
          <br>
          <p>¿Cómo desea agregarlo?</p>
        </div>
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Crear como nuevo producto',
      cancelButtonText: 'Agregar al existente',
      confirmButtonColor: '#10b981',
      cancelButtonColor: '#6366f1'
    });

    if (result.isConfirmed) {
      // Nuevo producto: generar códigos nuevos
      producto.value.codigo = generarCodigoUnico();
      producto.value.codigo_barra = generarCodigoUnico();
    }
    // Si canceló (Agregar al existente): mantiene el código original → se actualizará stock al guardar
  }

  const esCelular = tipoProducto.value === 'Celular';

  const nuevoProducto = {
    codigo: producto.value.codigo,
    codigo_barra: producto.value.codigo_barra,
    nombre: producto.value.nombre.toUpperCase(),
    categoria: producto.value.categoria,
    marca: producto.value.marca,
    precio_compra: Number(producto.value.precio_compra).toFixed(2),
    precio_venta: Number(producto.value.precio_venta).toFixed(2),
    precio_final: Number(producto.value.precio_final).toFixed(2),
    precio_min: Number(producto.value.precio_min).toFixed(2),
    precio_xmayor: Number(producto.value.precio_xmayor).toFixed(2),
    oferta: Number(producto.value.precio_venta).toFixed(2),
    ganancia: Number(producto.value.ganancia).toFixed(2),
    impuestos: Number(producto.value.impuestos).toFixed(2),
    impuesto_venta: Number(producto.value.impuesto_venta).toFixed(2),
    tipo_impuesto: producto.value.tipo_impuesto,
    stock: esCelular ? String(imeisList.value.length) : String(producto.value.stock),
    proveedor: compra.value.proveedor,
    no_compra: compra.value.no_factura,
    empaque: 'UNIDAD',
    alerta: '3',
    otro: esCelular ? imeisList.value : [],
    created_at: nfecha('timestamp'),
    updated_at: nfecha('timestamp')
  };

  console.log('🔍 Producto agregado - Es celular:', esCelular);
  console.log('🔍 IMEIs en lista:', imeisList.value.length);
  console.log('🔍 Campo otro del producto:', nuevoProducto.otro);

  const productos = JSON.parse(compra.value.productos);
  productos.push(nuevoProducto);
  compra.value.productos = JSON.stringify(productos);

  if (esCelular) {
    imeisList.value = [];
  }

  calcularTotales();
  limpiarProducto();

  toast.add({ severity: 'success', summary: 'Éxito', detail: 'Producto agregado', life: 2000 });
};

const editarProducto = (index) => {
  const productos = JSON.parse(compra.value.productos);
  const prodEditar = productos[index];

  // Cargar datos del producto en el formulario
  producto.value.codigo = prodEditar.codigo;
  producto.value.codigo_barra = prodEditar.codigo_barra;
  producto.value.nombre = prodEditar.nombre;
  producto.value.categoria = prodEditar.categoria;
  producto.value.marca = prodEditar.marca;
  producto.value.precio_compra = parseFloat(prodEditar.precio_compra) || 0;
  producto.value.precio_venta = parseFloat(prodEditar.precio_venta) || 0;
  producto.value.precio_final = parseFloat(prodEditar.precio_final) || 0;
  producto.value.precio_min = parseFloat(prodEditar.precio_min) || 0;
  producto.value.precio_xmayor = parseFloat(prodEditar.precio_xmayor) || 0;
  producto.value.ganancia = parseFloat(prodEditar.ganancia) || 0;
  producto.value.impuestos = parseFloat(prodEditar.impuestos) || 0;
  producto.value.impuesto_venta = parseFloat(prodEditar.impuesto_venta) || 0;
  producto.value.tipo_impuesto = prodEditar.tipo_impuesto || 'Sin Imp';
  producto.value.stock = parseInt(prodEditar.stock) || 1;

  // Detectar si es celular y cargar IMEIs
  if (prodEditar.categoria === 'CELULARES' && prodEditar.otro) {
    tipoProducto.value = 'Celular';

    let imeisData = [];
    if (Array.isArray(prodEditar.otro)) {
      imeisData = prodEditar.otro;
    } else if (typeof prodEditar.otro === 'string') {
      try {
        imeisData = JSON.parse(prodEditar.otro);
      } catch (error) {
        console.error('Error al parsear IMEIs:', error);
      }
    }

    if (Array.isArray(imeisData)) {
      imeisList.value = [...imeisData];
    }
  } else {
    tipoProducto.value = 'Producto Normal';
    imeisList.value = [];
  }

  // Eliminar el producto de la lista temporal
  productos.splice(index, 1);
  compra.value.productos = JSON.stringify(productos);
  calcularTotales();

  toast.add({
    severity: 'info',
    summary: 'Modo Edición',
    detail: 'Modifique el producto y presione "Agregar Producto" nuevamente',
    life: 4000
  });

  // Hacer scroll al formulario del producto
  setTimeout(() => {
    const formElement = document.querySelector('.producto-form-card');
    if (formElement) {
      formElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, 100);
};

const eliminarProducto = async (index) => {
  const result = await Swal.fire({
    title: '¿Eliminar producto?',
    text: 'Esta acción no se puede deshacer',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Sí, eliminar',
    cancelButtonText: 'Cancelar',
    confirmButtonColor: '#dc3545'
  });

  if (result.isConfirmed) {
    const productos = JSON.parse(compra.value.productos);
    productos.splice(index, 1);
    compra.value.productos = JSON.stringify(productos);
    calcularTotales();
    toast.add({ severity: 'success', summary: 'Éxito', detail: 'Producto eliminado', life: 2000 });
  }
};

const limpiarProducto = () => {
  producto.value = {
    codigo: generarCodigoUnico(),
    codigo_barra: generarCodigoUnico(),
    nombre: '',
    categoria: categorias.value[0]?.nombre || '',
    marca: 'GENERICO',
    precio_compra: 0,
    precio_venta: 0,
    precio_final: 0,
    precio_min: 0,
    precio_xmayor: 0,
    ganancia: 0,
    impuestos: 0,
    impuesto_venta: 0,
    stock: 1,
    tipo_impuesto: 'Sin Imp',
    imeis: ''
  };
  imeisList.value = [];
};

// =============== TOTALES ===============
const calcularTotales = () => {
  const productos = JSON.parse(compra.value.productos);
  let subtotal = 0;
  let impuestoTotal = 0;

  productos.forEach(prod => {
    const precio = parseFloat(prod.precio_compra) || 0;
    const cantidad = parseFloat(prod.stock) || 0;
    subtotal += precio * cantidad;
  });

  const descuento = parseFloat(compra.value.descuento) || 0;
  compra.value.subtotal = subtotal.toFixed(2);
  compra.value.impuesto = impuestoTotal.toFixed(2);
  compra.value.total = (subtotal - descuento + impuestoTotal).toFixed(2);
};

watchEffect(() => {
  const total = parseFloat(compra.value.total) || 0;
  const abono = parseFloat(compra.value.abono) || 0;
  compra.value.saldo = (total - abono).toFixed(2);
});

// =============== GUARDAR COMPRA ===============
const procesarImeisDeProducto = async (prod) => {
  console.log('=== PROCESANDO IMEIs DE PRODUCTO ===');
  console.log('Producto:', prod.nombre);
  console.log('Campo otro:', prod.otro);

  if (!prod.otro) {
    console.log('❌ No hay campo otro');
    return;
  }

  let imeisData = [];

  // Manejar tanto array como string JSON
  if (Array.isArray(prod.otro)) {
    imeisData = prod.otro;
    console.log('✅ IMEIs como array directo:', imeisData);
  } else if (typeof prod.otro === 'string') {
    try {
      imeisData = JSON.parse(prod.otro);
      console.log('✅ IMEIs parseados de string:', imeisData);
    } catch (error) {
      console.log('❌ Error al parsear otro:', error);
      return;
    }
  }

  if (!Array.isArray(imeisData) || imeisData.length === 0) {
    console.log('❌ IMEIs no es array o está vacío');
    return;
  }

  console.log('Buscando producto en BD por código:', prod.codigo);
  const productoEnBD = await peticionesFetchOffline('getDataByField', 'productos', 'codigo', prod.codigo);

  if (!productoEnBD) {
    console.log('❌ Producto no encontrado en BD');
    return;
  }

  console.log('✅ Producto encontrado en BD, ID:', productoEnBD.id);
  console.log(`Insertando ${imeisData.length} IMEIs...`);

  for (const imeiData of imeisData) {
    console.log('Insertando IMEI:', imeiData.imei);
    const resultado = await insertarImeiEnCompra(imeiData, productoEnBD.id, prod.nombre);
    console.log('Resultado inserción:', resultado);
  }

  console.log('=== FIN PROCESAMIENTO IMEIs ===');
};

// Helper para convertir campo otro a string JSON antes de guardar
const prepararProductoParaGuardar = (prod) => {
  const productoParaGuardar = { ...prod };
  if (Array.isArray(productoParaGuardar.otro)) {
    productoParaGuardar.otro = JSON.stringify(productoParaGuardar.otro);
  }
  return productoParaGuardar;
};

const agregarProductosInventario = async () => {
  try {
    const productosArray = JSON.parse(compra.value.productos);
    console.log('📦 AGREGANDO PRODUCTOS AL INVENTARIO');
    console.log('Total productos:', productosArray.length);
    console.log('Productos:', productosArray);

    const baseURL = `${link.value}${api.value}`;

    for (const prod of productosArray) {
      console.log('\n--- Procesando producto:', prod.nombre);
      console.log('Tiene campo otro:', !!prod.otro);
      if (prod.otro) {
        console.log('Longitud del campo otro:', prod.otro.length);
      }

      const productoExistente = await peticionesFetchOffline('getDataByField', 'productos','codigo',prod.codigo);
      console.log('Producto existente:', !!productoExistente);

      if (productoExistente) {
        // Verificar proveedor
        if (productoExistente.proveedor !== prod.proveedor) {
          const result = await Swal.fire({
            title: 'Producto Existente',
            html: `
              <div style="text-align: left; padding: 1rem;">
                <p>El producto <strong>${prod.nombre}</strong> ya existe.</p>
                <br>
                <p><strong>Proveedor Actual:</strong> ${productoExistente.proveedor}</p>
                <p><strong>Proveedor Nuevo:</strong> ${prod.proveedor}</p>
                <br>
                <p>¿Qué desea hacer?</p>
              </div>
            `,
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Crear Nuevo Producto',
            cancelButtonText: 'Agregar Stock',
            confirmButtonColor: '#10b981',
            cancelButtonColor: '#6366f1'
          });

          if (result.isConfirmed) {
            // Crear nuevo producto
            prod.codigo = generarCodigoUnico();
            prod.codigo_barra = generarCodigoUnico();
            prod.almacen = almacenSeleccionado.value;
            const prodParaGuardar = prepararProductoParaGuardar(prod);
            await peticionesFetchOffline('insertData','productos', JSON.stringify(prodParaGuardar));
            await procesarImeisDeProducto(prod);
          } else {
            // Actualizar stock con costo promedio ponderado
            const stockAnterior = Number(productoExistente.stock);
            const stockNuevo = Number(prod.stock);
            const costoAnterior = parseFloat(productoExistente.precio_compra) || 0;
            const costoNuevo = parseFloat(prod.precio_compra) || 0;
            productoExistente.stock = stockAnterior + stockNuevo;
            productoExistente.precio_compra = parseFloat(
              ((stockAnterior * costoAnterior + stockNuevo * costoNuevo) / productoExistente.stock).toFixed(2)
            );
            await peticionesFetchOffline('updateData','productos', JSON.stringify(productoExistente));
            await procesarImeisDeProducto(prod);
          }
        } else {
          // Mismo proveedor - actualizar stock con costo promedio ponderado
          const stockAnterior = Number(productoExistente.stock);
          const stockNuevo = Number(prod.stock);
          const costoAnterior = parseFloat(productoExistente.precio_compra) || 0;
          const costoNuevo = parseFloat(prod.precio_compra) || 0;
          productoExistente.stock = stockAnterior + stockNuevo;
          productoExistente.precio_compra = parseFloat(
            ((stockAnterior * costoAnterior + stockNuevo * costoNuevo) / productoExistente.stock).toFixed(2)
          );
/*          await enviarDatosPorPost(`${baseURL}/actualizarcampos/productos`, productoExistente, tokenCifrado.value);*/
          await peticionesFetchOffline('updateData','productos', JSON.stringify(productoExistente));
          await procesarImeisDeProducto(prod);
        }
      } else {
        // Producto nuevo
        prod.almacen = almacenSeleccionado.value;
        const prodParaGuardar = prepararProductoParaGuardar(prod);
        await peticionesFetchOffline('insertData','productos', JSON.stringify(prodParaGuardar));
        await procesarImeisDeProducto(prod);
      }
    }
  } catch (error) {
    console.error('Error al agregar productos:', error);
    throw error;
  }
};

const guardarCompra = async () => {
  if (!compra.value.proveedor) {
    toast.add({ severity: 'warn', summary: 'Advertencia', detail: 'Seleccione un proveedor', life: 3000 });
    return;
  }

  if (productosAgregados.value.length === 0) {
    toast.add({ severity: 'warn', summary: 'Advertencia', detail: 'Agregue al menos un producto', life: 3000 });
    return;
  }

  loading.value = true;

  try {
    compra.value.created_at = nfecha('timestamp');
    compra.value.updated_at = nfecha('timestamp');
    compra.value.almacen = almacenSeleccionado.value;

    // Guardar compra
    const resultado = await peticionesFetchOffline('insertData', 'compras', JSON.stringify(compra.value));

    if (resultado[0] === 'ok') {
      toast.add({ severity: 'success', summary: 'Éxito', detail: 'Compra registrada', life: 3000 });

      // Crear cuenta por pagar si es necesario
      if ((compra.value.estado === 'PENDIENTE' || compra.value.estado === 'CREDITO') && parseFloat(compra.value.saldo) > 0) {
        await crearCuentaPorPagar();
      }

      // Agregar productos al inventario
      await agregarProductosInventario();

      // Preguntar qué hacer
      const result = await Swal.fire({
        title: 'Compra Registrada',
        text: '¿Qué desea hacer ahora?',
        icon: 'success',
        showCancelButton: true,
        confirmButtonText: 'Crear Otra Compra',
        cancelButtonText: 'Ver Compras'
      });

      if (result.isConfirmed) {
        limpiarFormulario();
      } else {
        router.push('/compras');
      }
    }
  } catch (error) {
    toast.add({ severity: 'error', summary: 'Error', detail: 'Error al guardar compra', life: 3000 });
    console.error(error);
  } finally {
    loading.value = false;
  }
};

const crearCuentaPorPagar = async () => {
  try {
    const jsonDataPagar = await arrayToObjetoFromTablaOffline('cuentasxpagar');
    const ultimaFactura = await peticionesFetchOffline('getMaxValue', 'cuentasxpagar', 'no_emision');

    jsonDataPagar.no_emision = generadorCodigo(ultimaFactura[0], 'CXP', 7);
    jsonDataPagar.proveedor = compra.value.proveedor;
    jsonDataPagar.rnc = compra.value.rnc_proveedor;
    jsonDataPagar.estado = compra.value.estado;
    jsonDataPagar.fecha = nfecha('fecha');
    jsonDataPagar.hora = nfecha('hora');
    jsonDataPagar.productos = compra.value.productos;
    jsonDataPagar.total = compra.value.total;
    jsonDataPagar.subtotal = compra.value.subtotal;
    jsonDataPagar.saldo = compra.value.saldo;
    jsonDataPagar.abono = compra.value.abono;
    jsonDataPagar.impuestos = compra.value.impuesto;
    jsonDataPagar.nota = compra.value.nota;
    jsonDataPagar.no_factura = compra.value.no_factura;

    const npago = [];
    if (parseFloat(compra.value.abono) > 0) {
      npago.push({
        nopago: 1,
        cantidad: compra.value.abono,
        metodo: compra.value.metodo_pago,
        fecha: nfecha('fecha'),
        hora: nfecha('hora'),
        turno: datosCajero.value.turno,
        cajero: datosCajero.value.username,
        saldo: compra.value.saldo
      });
    }

    jsonDataPagar.pagos = JSON.stringify(npago);
    jsonDataPagar.created_at = nfecha('timestamp');
    jsonDataPagar.updated_at = nfecha('timestamp');

/*    const urlPAGAR = `${link.value}${api.value}/insertar/cuentasxpagar`;
    await enviarDatosPorPost(urlPAGAR, jsonDataPagar, tokenCifrado.value);*/
   const cuentasPagar =  await peticionesFetchOffline('insertData', 'cuentasxpagar', JSON.stringify(jsonDataPagar));

    toast.add({
      severity: 'info',
      summary: 'Cuenta por Pagar',
      detail: `Saldo pendiente: $${compra.value.saldo}`,
      life: 4000
    });
  } catch (error) {
    console.error('Error al crear cuenta por pagar:', error);
  }
};

const limpiarFormulario = () => {
  compra.value = {
    proveedor: '',
    rnc_proveedor: '',
    fecha: nfecha('fecha'),
    no_factura: generarCodigoAlfaNumerico(5, 'C'),
    ncf_proveedor: '',
    estado: 'PENDIENTE',
    metodo_pago: 'EFECTIVO',
    subtotal: '0.00',
    descuento: '0.00',
    impuesto: '0.00',
    total: '0.00',
    abono: '0.00',
    saldo: '0.00',
    nota: '',
    productos: '[]'
  };
  limpiarProducto();
};

// =============== UTILIDADES ===============
const formatCurrency = (value) => {
  if (!value || isNaN(value)) return '$0.00';
  return `$${Number(value).toFixed(2)}`;
};

const obtenerCapacidades = (producto) => {
  if (!producto.otro) return '-';

  let imeis = [];
  if (Array.isArray(producto.otro)) {
    imeis = producto.otro;
  } else if (typeof producto.otro === 'string') {
    try {
      imeis = JSON.parse(producto.otro);
    } catch {
      return '-';
    }
  }

  if (!Array.isArray(imeis) || imeis.length === 0) return '-';

  // Contar capacidades
  const capacidadesCont = {};
  imeis.forEach(imei => {
    const cap = imei.capacidad || '64GB';
    capacidadesCont[cap] = (capacidadesCont[cap] || 0) + 1;
  });

  // Formatear como "64GB (x3), 128GB (x2)"
  return Object.entries(capacidadesCont)
    .map(([cap, count]) => count > 1 ? `${cap} (x${count})` : cap)
    .join(', ');
};

// =============== GASTO PERSONAL ===============
const limpiarGastoPersonal = () => {
  gastoPersonal.value = {
    descripcion: '',
    proveedor: '',
    rnc_proveedor: '',
    no_factura: generarCodigoAlfaNumerico(5, 'GP'),
    ncf_proveedor: '',
    monto: 0,
    estado: 'PAGADO',
    metodo_pago: 'EFECTIVO',
    cuenta_seleccionada: null
  };
};

const seleccionarProveedorGasto = (nombreProveedor) => {
  const prov = proveedores.value.find(p => p.nombre === nombreProveedor);
  if (prov) {
    gastoPersonal.value.proveedor = prov.nombre;
    gastoPersonal.value.rnc_proveedor = prov.rnc;
  }
};

const crearAsientoDiarioGasto = async (noFactura) => {
  try {
    const monto = parseFloat(gastoPersonal.value.monto);

    let cuentaCredito = 'Efectivo en Caja';
    if (gastoPersonal.value.estado === 'PAGADO' && gastoPersonal.value.cuenta_seleccionada) {
      cuentaCredito = gastoPersonal.value.cuenta_seleccionada.nombre;
    } else if (gastoPersonal.value.estado === 'CREDITO' || gastoPersonal.value.estado === 'PENDIENTE') {
      cuentaCredito = 'Cuentas por Pagar';
    }

    const movimientos = [
      { cuenta: 'Gastos Personales', cantidadDebito: monto.toFixed(2), cantidadCredito: 0 },
      { cuenta: cuentaCredito, cantidadDebito: 0, cantidadCredito: monto.toFixed(2) }
    ];

    const ultimoNumero = await peticionesFetchOffline('getMaxValue', 'asientodiario', 'numero');
    const nextNum = ultimoNumero[0] ? String(parseInt(ultimoNumero[0]) + 1).padStart(8, '0') : '00000001';

    const asientoData = {
      numero: nextNum,
      fecha: nfecha('fecha'),
      hora: nfecha('hora'),
      descripcion: `GASTO PERSONAL: ${gastoPersonal.value.descripcion} (Ref: ${noFactura})`,
      asiento: JSON.stringify(movimientos),
      usuario: usuarioLocal.value?.usuario || datosEmpresa.usuario?.nombre || '',
      created_at: nfecha('timestamp'),
      updated_at: nfecha('timestamp')
    };

    await peticionesFetchOffline('insertData', 'asientodiario', JSON.stringify(asientoData));
  } catch (error) {
    console.error('Error al crear asiento diario de gasto personal:', error);
  }
};

const guardarGastoPersonal = async () => {
  if (!gastoPersonal.value.descripcion.trim()) {
    toast.add({ severity: 'warn', summary: 'Advertencia', detail: 'Ingrese una descripción del gasto', life: 3000 });
    return;
  }
  if (!gastoPersonal.value.monto || parseFloat(gastoPersonal.value.monto) <= 0) {
    toast.add({ severity: 'warn', summary: 'Advertencia', detail: 'Ingrese un monto válido', life: 3000 });
    return;
  }
  if (gastoPersonal.value.estado === 'PAGADO' && !gastoPersonal.value.cuenta_seleccionada) {
    toast.add({ severity: 'warn', summary: 'Advertencia', detail: 'Seleccione la cuenta a afectar', life: 3000 });
    return;
  }

  loadingGasto.value = true;
  try {
    const noFactura = gastoPersonal.value.no_factura || generarCodigoAlfaNumerico(5, 'GP');
    const monto = parseFloat(gastoPersonal.value.monto);

    // 1. Guardar compra sin productos
    const compraGasto = {
      proveedor: gastoPersonal.value.proveedor || 'GASTO PERSONAL',
      rnc_proveedor: gastoPersonal.value.rnc_proveedor || '',
      fecha: nfecha('fecha'),
      no_factura: noFactura,
      ncf_proveedor: gastoPersonal.value.ncf_proveedor || '',
      estado: gastoPersonal.value.estado,
      metodo_pago: gastoPersonal.value.metodo_pago,
      subtotal: monto.toFixed(2),
      descuento: '0.00',
      impuesto: '0.00',
      total: monto.toFixed(2),
      abono: gastoPersonal.value.estado === 'PAGADO' ? monto.toFixed(2) : '0.00',
      saldo: gastoPersonal.value.estado === 'PAGADO' ? '0.00' : monto.toFixed(2),
      nota: `GASTO PERSONAL: ${gastoPersonal.value.descripcion}`,
      productos: '[]',
      created_at: nfecha('timestamp'),
      updated_at: nfecha('timestamp')
    };

    await peticionesFetchOffline('insertData', 'compras', JSON.stringify(compraGasto));

    // 2. PAGADO: afectar cuenta bancaria/caja
    if (gastoPersonal.value.estado === 'PAGADO') {
      const sel = gastoPersonal.value.cuenta_seleccionada;
      const tablaCuenta = sel._source || 'banco';
      // Usar el registro original limpio para no enviar campos extra al updateData
      const srcArray = tablaCuenta === 'cuentas' ? cuentasArray.value : bancosArray.value;
      const banco = { ...(srcArray.find(r => r.id === sel.id) || sel) };
      const balanceAnterior = parseFloat(banco.saldo) || 0;
      const balanceActual = balanceAnterior - monto;

      // Actualizar saldo de la cuenta
      banco.saldo = balanceActual.toFixed(2);
      banco.updated_at = nfecha('timestamp');
      await peticionesFetchOffline('updateData', tablaCuenta, JSON.stringify(banco));

      // Crear transacción bancaria
      const transaccion = await arrayToObjetoFromTablaOffline('transaccionesbancarias');
      transaccion.tipo = 'RETIRO';
      transaccion.fecha = nfecha('fecha');
      transaccion.hora = nfecha('hora');
      transaccion.estado = 'COMPLETADA';
      transaccion.cuenta_origen = banco.cuenta || banco.nombre;
      transaccion.cuenta_destino = 'GASTO PERSONAL';
      transaccion.monto = monto.toFixed(2);
      transaccion.metodo = gastoPersonal.value.metodo_pago;
      transaccion.balance_anterior = balanceAnterior.toFixed(2);
      transaccion.balance_actual = balanceActual.toFixed(2);
      transaccion.descripcion = gastoPersonal.value.descripcion;
      transaccion.depositante = almacenSeleccionado.value;
      transaccion.beneficiario = gastoPersonal.value.proveedor || 'GASTO PERSONAL';
      if (transaccion.hasOwnProperty('almacen')) transaccion.almacen = almacenSeleccionado.value;
      if (transaccion.hasOwnProperty('usuario')) transaccion.usuario = usuarioLocal.value?.usuario || '';
      if (transaccion.hasOwnProperty('created_at')) {
        transaccion.created_at = nfecha('timestamp');
        transaccion.updated_at = nfecha('timestamp');
      }
      await peticionesFetchOffline('insertData', 'transaccionesbancarias', JSON.stringify(transaccion));
    }

    // 3. CREDITO / PENDIENTE: crear cuenta por pagar
    if (gastoPersonal.value.estado === 'CREDITO' || gastoPersonal.value.estado === 'PENDIENTE') {
      const jsonDataPagar = await arrayToObjetoFromTablaOffline('cuentasxpagar');
      const ultimaFactura = await peticionesFetchOffline('getMaxValue', 'cuentasxpagar', 'no_emision');
      jsonDataPagar.no_emision = generadorCodigo(ultimaFactura[0], 'CXP', 7);
      jsonDataPagar.proveedor = gastoPersonal.value.proveedor || 'GASTO PERSONAL';
      jsonDataPagar.rnc = '';
      jsonDataPagar.estado = gastoPersonal.value.estado;
      jsonDataPagar.fecha = nfecha('fecha');
      jsonDataPagar.hora = nfecha('hora');
      jsonDataPagar.total = monto.toFixed(2);
      jsonDataPagar.subtotal = monto.toFixed(2);
      jsonDataPagar.saldo = monto.toFixed(2);
      jsonDataPagar.abono = '0.00';
      jsonDataPagar.impuestos = '0.00';
      jsonDataPagar.nota = `GASTO PERSONAL: ${gastoPersonal.value.descripcion}`;
      jsonDataPagar.no_factura = noFactura;
      jsonDataPagar.productos = '[]';
      jsonDataPagar.pagos = '[]';
      if (jsonDataPagar.hasOwnProperty('almacen')) jsonDataPagar.almacen = almacenSeleccionado.value;
      if (jsonDataPagar.hasOwnProperty('usuario')) jsonDataPagar.usuario = usuarioLocal.value?.usuario || '';
      if (jsonDataPagar.hasOwnProperty('created_at')) {
        jsonDataPagar.created_at = nfecha('timestamp');
        jsonDataPagar.updated_at = nfecha('timestamp');
      }
      await peticionesFetchOffline('insertData', 'cuentasxpagar', JSON.stringify(jsonDataPagar));
    }

    // 4. Siempre crear asiento diario
    await crearAsientoDiarioGasto(noFactura);

    toast.add({ severity: 'success', summary: 'Éxito', detail: 'Gasto Personal registrado correctamente', life: 3000 });
    visibleGastoPersonal.value = false;
    limpiarGastoPersonal();
    await cargarBancos();
    await cargarCuentas();
  } catch (error) {
    console.error('Error al guardar gasto personal:', error);
    toast.add({ severity: 'error', summary: 'Error', detail: 'Error al registrar el gasto', life: 3000 });
  } finally {
    loadingGasto.value = false;
  }
};
</script>

<template>
  <div class="nueva-compra-container">
    <!-- HEADER -->
    <div class="page-header">
      <div class="header-content">
        <div class="header-title">
          <i class="pi pi-shopping-cart"></i>
          <div>
            <h1>Nueva Compra</h1>
            <p>Registra una nueva compra de productos</p>
          </div>
        </div>
        <div class="header-actions">
          <Button
            label="Volver"
            icon="pi pi-arrow-left"
            severity="secondary"
            outlined
            @click="router.push('/compras')"
          />
          <Button
            label="Limpiar"
            icon="pi pi-refresh"
            severity="contrast"
            @click="limpiarFormulario"
          />
          <Button
            label="Gasto Personal"
            icon="pi pi-wallet"
            severity="warning"
            @click="() => { limpiarGastoPersonal(); visibleGastoPersonal = true; }"
          />
        </div>
      </div>
    </div>

    <div class="compra-content">
      <!-- SECCIÓN 1: PROVEEDOR -->
      <Card class="compra-section">
        <template #header>
          <div class="section-header proveedor-header">
            <i class="pi pi-building"></i>
            <span>Datos del Proveedor</span>
          </div>
        </template>
        <template #content>
          <div class="form-grid">
            <div class="form-field col-span-4">
              <label>Proveedor</label>
              <Dropdown
                v-model="compra.proveedor"
                :options="proveedores"
                optionLabel="nombre"
                optionValue="nombre"
                placeholder="Seleccione un proveedor"
                filter
                showClear
                @update:modelValue="seleccionarProveedor"
              >
                <template #value="slotProps">
                  <div v-if="slotProps.value" class="dropdown-value">
                    <i class="pi pi-building"></i>
                    <span>{{ slotProps.value }}</span>
                  </div>
                  <span v-else>{{ slotProps.placeholder }}</span>
                </template>
                <template #option="slotProps">
                  <div class="dropdown-option">
                    <i class="pi pi-building"></i>
                    <div>
                      <div class="option-name">{{ slotProps.option.nombre }}</div>
                      <div class="option-info">RNC: {{ slotProps.option.rnc }}</div>
                    </div>
                  </div>
                </template>
              </Dropdown>
            </div>

            <div class="form-field col-span-2">
              <label>
                <i class="pi pi-warehouse mr-2"></i>Almacén
              </label>
              <Dropdown
                v-model="almacenSeleccionado"
                :options="almacenesArray"
                placeholder="Seleccione almacén"
                showClear
              >
                <template #value="slotProps">
                  <div v-if="slotProps.value" class="dropdown-value">
                    <i class="pi pi-warehouse"></i>
                    <span>{{ slotProps.value }}</span>
                  </div>
                  <span v-else>{{ slotProps.placeholder }}</span>
                </template>
              </Dropdown>
            </div>

            <div class="form-field col-span-4">
              <label>
                <i class="pi pi-id-card mr-2"></i>Buscar Proveedor
              </label>
              <div class="flex gap-2">
                <SelectButton
                  v-model="tipoBusquedaProveedor"
                  :options="tipoBusquedaOptions"
                  optionLabel="label"
                  optionValue="value"
                />
                <div class="input-group flex-1">
                  <InputText
                    v-model="documentoBusqueda"
                    :placeholder="tipoBusquedaProveedor === 'CEDULA' ? 'Ingrese cédula' : 'Ingrese RNC'"
                    @keydown.enter="buscarDocumentoProveedor"
                  />
                  <Button
                    icon="pi pi-search"
                    severity="info"
                    @click="buscarDocumentoProveedor"
                  />
                </div>
              </div>
            </div>

            <div class="form-field col-span-2">
              <label>RNC/Cédula Proveedor</label>
              <InputText v-model="compra.rnc_proveedor" readonly placeholder="RNC o cédula del proveedor" />
            </div>

            <div class="form-field col-span-2">
              <label>Fecha</label>
              <InputText v-model="compra.fecha" readonly />
            </div>

            <div class="form-field col-span-2">
              <label>No. Factura</label>
              <InputText v-model="compra.no_factura" />
            </div>

            <div class="form-field col-span-2">
              <label>NCF</label>
              <InputText
                v-model="compra.ncf_proveedor"
                placeholder="NCF (opcional)"
              />
            </div>
          </div>
        </template>
      </Card>

      <!-- SECCIÓN 2: PRODUCTOS -->
      <Card class="compra-section">
        <template #header>
          <div class="section-header productos-header">
            <i class="pi pi-box"></i>
            <span>Productos</span>
            <div class="header-badge">
              <Tag :value="`${productosAgregados.length} productos`" severity="success" />
            </div>
          </div>
        </template>
        <template #content>
          <!-- Tipo de Producto -->
          <div class="producto-tipo-selector">
            <SelectButton
              v-model="tipoProducto"
              :options="tipoProductoOptions"
              :allowEmpty="false"
            />
          </div>

          <!-- Formulario de Producto -->
          <div class="form-grid producto-form">
            <div class="form-field col-span-3">
              <label>Nombre del Producto</label>
              <Dropdown
                v-model="producto.nombre"
                :options="productosExistentesAlmacenActual"
                optionLabel="nombre"
                optionValue="nombre"
                placeholder="Seleccione o escriba el nombre"
                filter
                showClear
                editable
                @update:modelValue="(value) => value && seleccionarProductoExistente(value)"
              />
            </div>

            <div class="form-field col-span-2">
              <label>Código</label>
              <InputText v-model="producto.codigo" />
            </div>

            <div class="form-field col-span-2">
              <label>Código de Barra</label>
              <div class="input-group">
                <InputText v-model="producto.codigo_barra" />
                <Button
                  icon="pi pi-refresh"
                  severity="secondary"
                  @click="producto.codigo_barra = generarCodigoUnico()"
                />
              </div>
            </div>

            <div class="form-field col-span-2">
              <label>Categoría</label>
              <Dropdown
                v-model="producto.categoria"
                :options="categorias"
                optionLabel="nombre"
                optionValue="nombre"
                placeholder="Categoría"
              />
            </div>

            <div class="form-field col-span-2">
              <label>Marca</label>
              <InputText v-model="producto.marca" placeholder="Marca" />
            </div>

            <div class="form-field col-span-1">
              <label>Cantidad</label>
              <InputNumber
                v-model="producto.stock"
                :min="1"
                showButtons
                buttonLayout="horizontal"
                decrementButtonClass="p-button-secondary"
                incrementButtonClass="p-button-secondary"
              />
            </div>

            <div class="form-field col-span-2">
              <label>Precio Compra</label>
              <InputNumber
                v-model="producto.precio_compra"
                mode="currency"
                currency="DOP"
                locale="es-DO"
                @input="calcularPrecios"
              />
            </div>

            <div class="form-field col-span-2">
              <label>Ganancia %</label>
              <InputNumber
                v-model="producto.ganancia"
                suffix="%"
                :min="0"
                :max="1000"
              />
            </div>

            <div class="form-field col-span-2">
              <label>Precio Venta</label>
              <InputNumber
                v-model="producto.precio_venta"
                mode="currency"
                currency="DOP"
                locale="es-DO"
              />
            </div>

<!--             <div class="form-field col-span-2">
              <label>Tipo Impuesto</label>
              <SelectButton
                v-model="producto.tipo_impuesto"
                :options="tipoImpuestoOptions"
                optionLabel="label"
                optionValue="value"
                @change="aplicarImpuesto"
              />
            </div> -->

            <div class="form-field col-span-2">
              <label>Precio Final</label>
              <InputNumber
                v-model="producto.precio_final"
                mode="currency"
                currency="DOP"
                locale="es-DO"
                readonly
                class="precio-final-input"
              />
            </div>

            <!-- Sección IMEI para Celulares -->
            <div v-if="tipoProducto === 'Celular'" class="form-field col-span-12">
              <div class="imei-section">
                <div class="imei-header">
                  <div class="imei-title">
                    <i class="pi pi-mobile"></i>
                    <span>Gestión de IMEIs</span>
                    <Tag :value="`${imeisList.length} IMEI(s)`" severity="info" />
                  </div>
                  <Button
                    v-if="imeisList.length > 0"
                    label="Aplicar precios a todos"
                    icon="pi pi-sync"
                    severity="secondary"
                    size="small"
                    @click="aplicarPreciosATodos"
                  />
                </div>

                <div class="imei-input-container">
                  <div class="imei-input-wrapper">
                    <InputText
                      ref="imeiInputRef"
                      v-model="imeiInput"
                      placeholder="Ingrese el IMEI (15 dígitos)"
                      class="imei-input"
                      maxlength="15"
                      @keydown.enter.prevent="agregarImei"
                    />
                    <div class="flex items-center gap-2">
                      <label class="text-sm font-semibold whitespace-nowrap">
                        <i class="pi pi-bolt mr-1"></i>Batería:
                      </label>
                      <InputNumber
                        v-model="bateriaInput"
                        :min="0"
                        :max="100"
                        suffix="%"
                        :step="5"
                        showButtons
                        buttonLayout="horizontal"
                        decrementButtonClass="p-button-secondary"
                        incrementButtonClass="p-button-secondary"
                        incrementButtonIcon="pi pi-plus"
                        decrementButtonIcon="pi pi-minus"
                        style="width: 150px"
                      />
                    </div>
                    <Button
                      label="Agregar IMEI"
                      icon="pi pi-plus"
                      severity="info"
                      @click="agregarImei"
                    />
                  </div>
                </div>

                <div v-if="imeisList.length > 0" class="imei-list">
                  <DataTable
                    :value="imeisList"
                    stripedRows
                    size="small"
                    class="imei-datatable"
                  >
                    <Column header="#" style="width: 50px">
                      <template #body="slotProps">
                        <Tag :value="slotProps.index + 1" severity="secondary" />
                      </template>
                    </Column>
                    <Column field="imei" header="IMEI" style="min-width: 180px">
                      <template #body="slotProps">
                        <div class="imei-cell">
                          <i class="pi pi-mobile"></i>
                          <code>{{ slotProps.data.imei }}</code>
                        </div>
                      </template>
                    </Column>
                    <Column header="Batería" style="width: 120px">
                      <template #body="slotProps">
                        <InputNumber
                          v-model="slotProps.data.bateria"
                          :min="0"
                          :max="100"
                          suffix="%"
                          :inputStyle="{ width: '80px' }"
                        />
                      </template>
                    </Column>
                    <Column header="Capacidad" style="width: 150px">
                      <template #body="slotProps">
                        <Dropdown
                          v-model="slotProps.data.capacidad"
                          :options="opcionesCapacidad"
                          placeholder="Seleccionar"
                          :style="{ width: '130px' }"
                        />
                      </template>
                    </Column>
                    <Column header="P. Compra" style="width: 130px">
                      <template #body="slotProps">
                        <InputNumber
                          v-model="slotProps.data.precio_compra"
                          mode="currency"
                          currency="DOP"
                          locale="es-DO"
                          :inputStyle="{ width: '100px' }"
                        />
                      </template>
                    </Column>
                    <Column header="P. Venta" style="width: 130px">
                      <template #body="slotProps">
                        <InputNumber
                          v-model="slotProps.data.precio_venta"
                          mode="currency"
                          currency="DOP"
                          locale="es-DO"
                          :inputStyle="{ width: '100px' }"
                        />
                      </template>
                    </Column>
                    <Column header="P. Mínimo" style="width: 130px">
                      <template #body="slotProps">
                        <InputNumber
                          v-model="slotProps.data.precio_min"
                          mode="currency"
                          currency="DOP"
                          locale="es-DO"
                          :inputStyle="{ width: '100px' }"
                        />
                      </template>
                    </Column>
                    <Column header="P. Mayor" style="width: 130px">
                      <template #body="slotProps">
                        <InputNumber
                          v-model="slotProps.data.precio_xmayor"
                          mode="currency"
                          currency="DOP"
                          locale="es-DO"
                          :inputStyle="{ width: '100px' }"
                        />
                      </template>
                    </Column>
                    <Column header="" style="width: 60px">
                      <template #body="slotProps">
                        <Button
                          icon="pi pi-trash"
                          severity="danger"
                          text
                          rounded
                          size="small"
                          @click="eliminarImei(slotProps.index)"
                        />
                      </template>
                    </Column>
                  </DataTable>
                </div>

                <div v-else class="no-imeis">
                  <i class="pi pi-mobile"></i>
                  <p>No hay IMEIs agregados. Escanee o escriba el IMEI para agregarlo.</p>
                </div>
              </div>
            </div>

            <div class="form-field col-span-12">
              <Button
                label="Agregar Producto"
                icon="pi pi-plus"
                severity="success"
                class="agregar-producto-btn"
                @click="agregarProducto"
              />
            </div>
          </div>

          <!-- Tabla de Productos Agregados -->
          <div v-if="productosAgregados.length > 0" class="productos-tabla">
            <DataTable
              :value="productosAgregados"
              stripedRows
              responsiveLayout="scroll"
              class="productos-datatable"
            >
              <Column field="nombre" header="Producto" style="min-width: 200px">
                <template #body="slotProps">
                  <div class="producto-cell">
                    <strong>{{ slotProps.data.nombre }}</strong>
                    <small>{{ slotProps.data.codigo }}</small>
                  </div>
                </template>
              </Column>
              <Column field="categoria" header="Categoría" />
              <Column header="Capacidad" style="width: 150px">
                <template #body="slotProps">
                  {{ obtenerCapacidades(slotProps.data) }}
                </template>
              </Column>
              <Column field="stock" header="Cant." style="width: 80px">
                <template #body="slotProps">
                  <Tag :value="slotProps.data.stock" severity="info" />
                </template>
              </Column>
              <Column field="precio_compra" header="P. Compra" style="width: 120px">
                <template #body="slotProps">
                  {{ formatCurrency(slotProps.data.precio_compra) }}
                </template>
              </Column>
              <Column field="precio_venta" header="P. Venta" style="width: 120px">
                <template #body="slotProps">
                  {{ formatCurrency(slotProps.data.precio_venta) }}
                </template>
              </Column>
              <Column header="Subtotal" style="width: 120px">
                <template #body="slotProps">
                  <strong>{{ formatCurrency(slotProps.data.precio_compra * slotProps.data.stock) }}</strong>
                </template>
              </Column>
              <Column header="Acciones" style="width: 120px">
                <template #body="slotProps">
                  <Button
                    icon="pi pi-pencil"
                    severity="info"
                    text
                    rounded
                    @click="editarProducto(slotProps.index)"
                    v-tooltip.top="'Editar'"
                  />
                  <Button
                    icon="pi pi-trash"
                    severity="danger"
                    text
                    rounded
                    @click="eliminarProducto(slotProps.index)"
                    v-tooltip.top="'Eliminar'"
                  />
                </template>
              </Column>
            </DataTable>
          </div>

          <div v-else class="no-productos">
            <i class="pi pi-inbox"></i>
            <p>No hay productos agregados</p>
          </div>
        </template>
      </Card>

      <!-- SECCIÓN 3: TOTALES Y ESTADO -->
      <Card class="compra-section">
        <template #header>
          <div class="section-header totales-header">
            <i class="pi pi-calculator"></i>
            <span>Totales y Estado de Compra</span>
          </div>
        </template>
        <template #content>
          <div class="form-grid">
            <div class="form-field col-span-3">
              <label>Estado</label>
              <SelectButton
                v-model="compra.estado"
                :options="estadosOptions"
                optionLabel="label"
                optionValue="value"
                :allowEmpty="false"
              >
                <template #option="slotProps">
                  <Tag :value="slotProps.option.label" :severity="slotProps.option.severity" />
                </template>
              </SelectButton>
            </div>

            <div class="form-field col-span-3">
              <label>Método de Pago</label>
              <Dropdown
                v-model="compra.metodo_pago"
                :options="metodoPagoOptions"
                optionLabel="label"
                optionValue="value"
                placeholder="Método de pago"
              />
            </div>

            <div class="form-field col-span-2">
              <label>Subtotal</label>
              <InputNumber
                v-model="compra.subtotal"
                mode="currency"
                currency="DOP"
                locale="es-DO"
                readonly
                class="total-input"
              />
            </div>

            <div class="form-field col-span-2">
              <label>Descuento</label>
              <InputNumber
                v-model="compra.descuento"
                mode="currency"
                currency="DOP"
                locale="es-DO"
                @input="calcularTotales"
              />
            </div>

            <div class="form-field col-span-2">
              <label>Total</label>
              <InputNumber
                v-model="compra.total"
                mode="currency"
                currency="DOP"
                locale="es-DO"
                readonly
                class="total-input total-final"
              />
            </div>

            <div class="form-field col-span-2">
              <label>Abono</label>
              <InputNumber
                v-model="compra.abono"
                mode="currency"
                currency="DOP"
                locale="es-DO"
                class="abono-input"
              />
            </div>

            <div class="form-field col-span-2">
              <label>Saldo</label>
              <InputNumber
                v-model="compra.saldo"
                mode="currency"
                currency="DOP"
                locale="es-DO"
                readonly
                class="saldo-input"
              />
            </div>

            <div class="form-field col-span-12">
              <label>Notas</label>
              <Textarea
                v-model="compra.nota"
                rows="3"
                placeholder="Observaciones adicionales..."
              />
            </div>

            <div class="form-field col-span-12">
              <Button
                label="Guardar Compra"
                icon="pi pi-check"
                severity="success"
                size="large"
                class="guardar-compra-btn"
                :loading="loading"
                @click="guardarCompra"
              />
            </div>
          </div>
        </template>
      </Card>
    </div>

    <!-- DIALOG: GASTO PERSONAL -->
    <Dialog
      v-model:visible="visibleGastoPersonal"
      header="Registrar Gasto Personal"
      :style="{ width: '600px' }"
      modal
      @hide="limpiarGastoPersonal"
    >
      <div class="form-grid" style="gap: 1rem;">

        <!-- Proveedor -->
        <div class="form-field col-span-6">
          <label>Proveedor</label>
          <Dropdown
            v-model="gastoPersonal.proveedor"
            :options="proveedores"
            optionLabel="nombre"
            optionValue="nombre"
            placeholder="Seleccione o escriba"
            filter
            showClear
            editable
            class="w-full"
            @update:modelValue="(v) => v && seleccionarProveedorGasto(v)"
          />
        </div>

        <!-- RNC -->
        <div class="form-field col-span-6">
          <label>RNC</label>
          <InputText
            v-model="gastoPersonal.rnc_proveedor"
            placeholder="RNC del proveedor"
            class="w-full"
          />
        </div>

        <!-- No. Compra -->
        <div class="form-field col-span-6">
          <label>No. Compra</label>
          <InputText
            v-model="gastoPersonal.no_factura"
            class="w-full"
          />
        </div>

        <!-- NCF -->
        <div class="form-field col-span-6">
          <label>NCF</label>
          <InputText
            v-model="gastoPersonal.ncf_proveedor"
            placeholder="NCF (opcional)"
            class="w-full"
          />
        </div>

        <!-- Descripción -->
        <div class="form-field col-span-12">
          <label>Descripción del Gasto *</label>
          <InputText
            v-model="gastoPersonal.descripcion"
            placeholder="Ej: Alquiler, electricidad, servicio..."
            class="w-full"
          />
        </div>

        <!-- Monto -->
        <div class="form-field col-span-6">
          <label>Monto *</label>
          <InputNumber
            v-model="gastoPersonal.monto"
            mode="currency"
            currency="DOP"
            locale="es-DO"
            class="w-full"
          />
        </div>

        <!-- Estado -->
        <div class="form-field col-span-6">
          <label>Estado *</label>
          <SelectButton
            v-model="gastoPersonal.estado"
            :options="estadosOptions"
            optionLabel="label"
            optionValue="value"
            :allowEmpty="false"
          >
            <template #option="slotProps">
              <Tag :value="slotProps.option.label" :severity="slotProps.option.severity" />
            </template>
          </SelectButton>
        </div>

        <!-- Método de Pago (solo cuando PAGADO) -->
        <div v-if="gastoPersonal.estado === 'PAGADO'" class="form-field col-span-12">
          <label>Método de Pago *</label>
          <Dropdown
            v-model="gastoPersonal.metodo_pago"
            :options="metodoPagoOptions"
            optionLabel="label"
            optionValue="value"
            placeholder="Método de pago"
            class="w-full"
          />
        </div>

        <!-- Cuenta a Afectar (solo cuando PAGADO) -->
        <div v-if="gastoPersonal.estado === 'PAGADO'" class="form-field col-span-12">
          <label>Cuenta a Afectar *</label>
          <Dropdown
            v-model="gastoPersonal.cuenta_seleccionada"
            :options="bancosParaGasto"
            optionLabel="nombre"
            placeholder="Seleccione la cuenta"
            filter
            class="w-full"
          >
            <template #option="slotProps">
              <div style="display: flex; justify-content: space-between; align-items: center; gap: 0.5rem;">
                <div>
                  <strong>{{ slotProps.option.nombre }}</strong>
                  <small style="color:#888; margin-left:6px;">({{ slotProps.option.tipo }})</small>
                </div>
                <Tag :value="formatCurrency(slotProps.option.saldo)" severity="info" />
              </div>
            </template>
            <template #value="slotProps">
              <span v-if="slotProps.value">
                {{ slotProps.value.nombre }}
                <small style="color:#888;">({{ slotProps.value.tipo }})</small>
                — Saldo: {{ formatCurrency(slotProps.value.saldo) }}
              </span>
              <span v-else>{{ slotProps.placeholder }}</span>
            </template>
          </Dropdown>
          <small v-if="gastoPersonal.cuenta_seleccionada" style="color: #6b7280; margin-top: 4px; display: block;">
            Saldo actual: {{ formatCurrency(gastoPersonal.cuenta_seleccionada.saldo) }}
            &rarr; Saldo tras gasto: {{ formatCurrency(parseFloat(gastoPersonal.cuenta_seleccionada.saldo) - parseFloat(gastoPersonal.monto || 0)) }}
          </small>
        </div>

        <!-- Info CREDITO / PENDIENTE -->
        <div v-if="gastoPersonal.estado === 'CREDITO' || gastoPersonal.estado === 'PENDIENTE'" class="form-field col-span-12">
          <div style="background: #fef3c7; border-radius: 8px; padding: 0.75rem 1rem; display: flex; gap: 0.5rem; align-items: flex-start;">
            <i class="pi pi-info-circle" style="color: #d97706; margin-top: 2px;"></i>
            <span style="color: #92400e; font-size: 0.875rem;">
              Se creará una <strong>Cuenta por Pagar</strong> por el monto indicado. Podrás abonar desde el módulo de Cuentas por Pagar.
            </span>
          </div>
        </div>

      </div>

      <template #footer>
        <Button
          label="Cancelar"
          icon="pi pi-times"
          severity="secondary"
          text
          @click="visibleGastoPersonal = false"
        />
        <Button
          label="Registrar Gasto"
          icon="pi pi-check"
          severity="warning"
          :loading="loadingGasto"
          @click="guardarGastoPersonal"
        />
      </template>
    </Dialog>

    <Toast />
  </div>
</template>

<style scoped>
.nueva-compra-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #e4e8ec 100%);
  padding: 2rem;
}

.page-header {
  background: white;
  border-radius: 16px;
  padding: 2rem;
  margin-bottom: 2rem;
  box-shadow: 0 2px 12px rgba(0,0,0,0.08);
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
}

.header-title {
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.header-title > i {
  font-size: 3rem;
  color: #6366f1;
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.header-title h1 {
  font-size: 2rem;
  font-weight: 700;
  color: #1f2937;
  margin: 0;
}

.header-title p {
  color: #6b7280;
  margin: 0.25rem 0 0 0;
}

.header-actions {
  display: flex;
  gap: 0.75rem;
}

.compra-content {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  max-width: 1400px;
  margin: 0 auto;
}

.compra-section {
  background: white;
  border-radius: 16px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.08);
  border: 1px solid rgba(0,0,0,0.05);
  overflow: hidden;
}

.section-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.5rem 2rem;
  font-size: 1.25rem;
  font-weight: 600;
  color: white;
}

.section-header i {
  font-size: 1.5rem;
}

.header-badge {
  margin-left: auto;
}

.proveedor-header {
  background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
}

.productos-header {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
}

.totales-header {
  background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  gap: 1.5rem;
  padding: 0;
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-field label {
  font-weight: 600;
  color: #374151;
  font-size: 0.875rem;
}

.col-span-1 { grid-column: span 1; }
.col-span-2 { grid-column: span 2; }
.col-span-3 { grid-column: span 3; }
.col-span-4 { grid-column: span 4; }
.col-span-6 { grid-column: span 6; }
.col-span-12 { grid-column: span 12; }

.input-group {
  display: flex;
  gap: 0.5rem;
  align-items: center;
  flex-wrap: nowrap;
}

.input-group input,
.input-group .p-inputtext {
  flex: 1;
  min-width: 0;
}

.input-group .p-button {
  flex-shrink: 0;
}

.dropdown-value,
.dropdown-option {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.option-name {
  font-weight: 600;
  color: #1f2937;
}

.option-info {
  font-size: 0.75rem;
  color: #6b7280;
}

.producto-tipo-selector {
  margin-bottom: 1.5rem;
}

.producto-form {
  background: #f9fafb;
  padding: 1.5rem;
  border-radius: 12px;
  margin-bottom: 1.5rem;
}

.agregar-producto-btn {
  width: 100%;
  padding: 0.75rem;
  font-size: 1rem;
  font-weight: 600;
}

.precio-final-input :deep(.p-inputnumber-input) {
  font-weight: 700;
  color: #10b981;
}

.productos-tabla {
  margin-top: 1.5rem;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  overflow: hidden;
}

.producto-cell {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.producto-cell strong {
  color: #1f2937;
}

.producto-cell small {
  color: #6b7280;
  font-size: 0.75rem;
}

.no-productos {
  text-align: center;
  padding: 3rem;
  color: #9ca3af;
}

.no-productos i {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.total-input :deep(.p-inputnumber-input) {
  font-weight: 600;
  color: #2563eb;
}

.total-final :deep(.p-inputnumber-input) {
  font-size: 1.25rem;
  font-weight: 700;
  color: #2563eb;
}

.abono-input :deep(.p-inputnumber-input) {
  font-weight: 600;
  color: #10b981;
}

.saldo-input :deep(.p-inputnumber-input) {
  font-weight: 600;
  color: #dc2626;
}

.guardar-compra-btn {
  width: 100%;
  padding: 1rem;
  font-size: 1.125rem;
  font-weight: 700;
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  border: none;
  box-shadow: 0 4px 16px rgba(16, 185, 129, 0.3);
  transition: all 0.3s ease;
}

.guardar-compra-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(16, 185, 129, 0.4);
}

@media (max-width: 768px) {
  .nueva-compra-container {
    padding: 1rem;
  }

  .form-grid {
    grid-template-columns: repeat(6, 1fr);
  }

  .col-span-1,
  .col-span-2,
  .col-span-3,
  .col-span-4,
  .col-span-6 {
    grid-column: span 6;
  }

  .header-content {
    flex-direction: column;
    align-items: flex-start;
  }

  .header-actions {
    width: 100%;
  }

  .header-actions button {
    flex: 1;
  }
}

/* IMEI Section */
.imei-section {
  background: white;
  border: 2px solid #e0e7ff;
  border-radius: 12px;
  padding: 1.5rem;
}

.imei-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #e0e7ff;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.imei-title {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-weight: 600;
  color: #4f46e5;
  font-size: 1.1rem;
}

.imei-title i {
  color: #4f46e5;
  font-size: 1.25rem;
}

.imei-input-container {
  margin-bottom: 1rem;
}

.imei-input-wrapper {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.imei-input {
  flex: 1;
  min-width: 200px;
}

.imei-list {
  border: 1px solid #e0e7ff;
  border-radius: 8px;
  overflow-x: auto;
}

.imei-datatable :deep(.p-datatable-thead > tr > th) {
  background: #f0f9ff;
  font-weight: 600;
  font-size: 0.8rem;
  padding: 0.75rem;
}

.imei-datatable :deep(.p-datatable-tbody > tr > td) {
  padding: 0.5rem 0.75rem;
}

.imei-cell {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.imei-cell i {
  color: #4f46e5;
}

.imei-cell code {
  font-family: 'Courier New', monospace;
  font-size: 0.9rem;
  background: #f0f9ff;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
}

.no-imeis {
  text-align: center;
  padding: 2rem;
  color: #6b7280;
  background: #f0f9ff;
  border-radius: 8px;
}

.no-imeis i {
  font-size: 2rem;
  margin-bottom: 0.5rem;
  color: #93c5fd;
  display: block;
}

.no-imeis p {
  margin: 0;
}

@media (max-width: 768px) {
  .imei-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .imei-input-wrapper {
    flex-direction: column;
  }

  .imei-input {
    min-width: 100%;
  }
}
</style>
