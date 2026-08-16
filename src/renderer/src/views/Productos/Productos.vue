<script setup>
import { ref, onMounted, nextTick, watchEffect, computed, watch, onBeforeUnmount, getCurrentInstance } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useI18n } from 'vue-i18n';
const router = useRouter();
const { t } = useI18n();
import axios from 'axios';
import { enviarDatosPorPost,transformarFechaTimestamp,formatearFecha, eliminarDatos, obtenerIdsSeleccionados, borrarTodoslosDatos, lenguajeDataTable, nfecha, arrayToObjetoFromTabla, peticionesFetch, encryptarPassword, envioElectron, mensajetoast, crearTablaSiNoExiste, peticiones, lasMayusculas,peticionesFetchOffline,arrayToObjetoFromTablaOffline,crearTablaSiNoExisteOffline, generarCodigoUnico, sincronizarStockProductoPorImeiDisponible } from '../../funciones/funciones.js';
import { facturaNueva } from '@/funciones/funcionesVentas.js';
import Swal from 'sweetalert2'
import { useToast } from "primevue/usetoast";
const toast = useToast();
/************************************************************************/
import * as XLSX from 'xlsx';
/************************************************************************/
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
/************************************************************************/
import JsBarcode from 'jsbarcode'
/************************************************************************/
import { useDatosEmpresa } from '@/stores'
const datosEmpresa = useDatosEmpresa();
const instance = getCurrentInstance()
const _uid = instance.uid
import Button from 'primevue/button';
/************************************************************************/
import LoadingOverlay from '@/Loading/LoadingOverlay.vue';
const loading = ref(false)
/************************************************************************/
import ProductosDanados from '@/components/ProductosDanados.vue';
const visibleProductosDanados = ref(false);
const productoSeleccionadoDanado = ref(null);
/************************************************************************/
import ProductosUsoInterno from '@/components/ProductosUsoInterno.vue';
const visibleProductosUsoInterno = ref(false);
const productoSeleccionadoUsoInterno = ref(null);
/************************************************************************/
import FacturaPdfPrint from '@/components/FacturaPdfPrint.vue';
const facturaPdfPrintRef = ref(null);
/************************************************************************/
const visiblePasarDanados = ref(false);
const imeisDanadosDisponibles = ref([]);
const imeisDanadosSeleccionados = ref([]);
const cantidadPasarDanados = ref(1);
const motivoDanado = ref('');
const descripcionDanado = ref('');
/************************************************************************/
const visibleImei = ref(false)
const visibleListadoImei = ref(false)
const imeiModal = ref('')
/************************************************************************/
const listadoImeiSelected = ref([])
/************************************************************************/
const almacenes = ref([])
const empresas = ref([])
/************************************************************************/
const empresaData = ref([])
const empresa1 = ref('')
const empresa2 = ref('')
/************************************************************************/
const usuarioLocal = ref({})
const datosDefault = ref({})
const cantidadInventario = ref(1)
/************************************************************************/
const nuevostock = ref(0)
/************************************************************************/
const camposArray = ["codigo","codigo_barra","condicion","situacion","t_garantia","descripcion","categoria","proveedor","marca","modelo","precio_compra","impuestos","ganancia","precio_venta","precio_min","precio_xmayor","impuesto_venta","precio_final","stock","alerta","empaque","ubicacion","otro","caracteristicas","nombre","usuario","almacen"];
/************************************************************************/


const link = ref('');
const api = ref('');
const token = ref('');
const patronTelefono = ref('');
const linkImpresora = ref('');
const patroncedula = ref('');
const tokenCifrado = ref('');
const tokenCorto = ref('');
/************************************************************************/
const selectedItems = ref([]);
/************************************************************************/
const fechaInicioInforme = ref(null)
const fechaFinalInforme = ref(null)
const cantidadInforme = ref(null)
/************************************************************************/
const position = ref('top');
const openPosition = (pos) => {
    position.value = pos;
    visible.value = true;
}
const datosConfiguracion = ref({});
/************************************************************************/
const productoSeleccionado = ref(null)
const stockproducto = ref(null)
const visiblePrecio = ref(false)
const visibleStock = ref(false)
const visibleInforme = ref(false)
const visibleCrearListaTelefonos = ref(false)
const visibleAgregarExpress = ref(false)
const procesandoListaTelefonos = ref(false)
/************************************************************************/
// Variables para cambio masivo de precios
const visibleCambioMasivoPrecios = ref(false)
const cambioMasivo = ref({
  tipoSeleccion: 'categoria', // 'categoria' o 'individual'
  categoriaSeleccionada: null,
  productosSeleccionados: [], // Array de productos seleccionados para cambio individual
  tipoAjuste: 'porcentaje', // 'porcentaje' o 'valor'
  valorAjuste: 0,
  aplicarA: ['precio_venta'], // puede incluir: precio_venta, precio_min, precio_xmayor
  direccion: 'aumentar' // 'aumentar' o 'disminuir'
})
/************************************************************************/
const marcasTelefonosDisponibles = ['APPLE', 'SAMSUNG', 'XIAOMI', 'HONOR', 'HUAWEI', 'MOTOROLA', 'GOOGLE']
const marcasTelefonosSeleccionadas = ref(['APPLE'])
const anioDesdeTelefonos = ref(2022)
const anioHastaTelefonos = ref(new Date().getFullYear())
const OPENAI_API_KEY = ref('')
/************************************************************************/
const incluirCabecera = ref(true);
const incluirTexto = ref(true);
const incluirCodigo = ref(true);
const incluirOtro = ref(false);
const incluirPrecio = ref(true);
/************************************************************************/
const visibleBarcode = ref(false)
const codigoBarcode = ref('')
const textoBarcode = ref('')
const cantidadBarcode = ref(1)
/************************************************************************/
const productosArray = ref([]);
const selectedFilter = ref('all');
const selectedCategory = ref('all');
const categoriasArray = ref([])
const proveedoresArray = ref([])
const orientacion = ref('vertical');
/************************************************************************/
const visible = ref(false);
const visiblecrear = ref(false);
const visibleSwitchInventario = ref(false);
const value = ref(null);
const id = ref(null);
const datoscampos = ref({});
const data = ref([]);
const searchQuery = ref('');
const ProductosEditar = ref(null);
/************************************************************************/
const PRODUCTOS_FILTROS_KEY = 'productos_filtros_estado';
const guardarFiltrosParaVolver = () => {
  const estadoFiltros = {
    searchQuery: searchQuery.value,
    selectedFilter: selectedFilter.value,
    selectedCategory: selectedCategory.value,
    almacenes: almacenes.value
  };

  window.sessionStorage.setItem(PRODUCTOS_FILTROS_KEY, JSON.stringify(estadoFiltros));
};

const restaurarFiltrosAlRegresar = () => {
  const estadoGuardado = window.sessionStorage.getItem(PRODUCTOS_FILTROS_KEY);
  if (!estadoGuardado) return;

  try {
    const filtros = JSON.parse(estadoGuardado);

    if (typeof filtros.searchQuery === 'string') searchQuery.value = filtros.searchQuery;
    if (typeof filtros.selectedFilter === 'string') selectedFilter.value = filtros.selectedFilter;
    if (typeof filtros.selectedCategory === 'string') selectedCategory.value = filtros.selectedCategory;
    if (typeof filtros.almacenes === 'string') almacenes.value = filtros.almacenes;
  } catch (error) {
    console.error('No se pudo restaurar filtros de productos:', error);
  } finally {
    window.sessionStorage.removeItem(PRODUCTOS_FILTROS_KEY);
  }
};
/************************************************************************/
const datosBarcode = ref({});
/************************************************************************/
const opcionesCapacidadImei = ref(['32GB', '64GB', '128GB', '256GB', '512GB', '1TB', '2TB'])
const imeiForm = ref({
  precio_compra: 0,
  precio_venta: 0,
  precio_min: 0,
  precio_xmayor: 0,
  proveedor: '',
  capacidad: '128GB',
  bateria: 100
})
/************************************************************************/
const modalPrecioCosto = ref(0)
const modalPrecioPVenta = ref(0)
const modalPrecioPMinimo = ref(0)
const modalPrecioXMayor = ref(0)
/************************************************************************/
const datoscamposProductos = ref({})
const productoExpress = ref({
  nombre: '',
  categoria: '',
  precio_compra: 0,
  precio_venta: 0
})
async function limpiarCamposCrear() {
datoscamposProductos.value = {}
await campos();
}
/************************************************************************/
const abrirAgregarExpress = () => {
  productoExpress.value = {
    nombre: '',
    categoria: (categoriasArray.value[0]?.nombre || categoriasArray.value[0] || ''),
    precio_compra: 0,
    precio_venta: 0
  }
  visibleAgregarExpress.value = true
}
/************************************************************************/
const crearProductoExpress = async () => {
  const nombre = String(productoExpress.value.nombre || '').trim().toUpperCase()
  const categoria = String(productoExpress.value.categoria || '').trim()
  const precioCompra = Number(productoExpress.value.precio_compra || 0)
  const precioVenta = Number(productoExpress.value.precio_venta || 0)

  if (!nombre) {
    toast.add({ severity: 'warn', summary: 'Validacion', detail: 'Debe escribir el nombre', life: 2500 })
    return
  }
  if (!categoria) {
    toast.add({ severity: 'warn', summary: 'Validacion', detail: 'Debe seleccionar categoria', life: 2500 })
    return
  }

  const nuevo = await arrayToObjetoFromTablaOffline('productos')
  const codigo = generarCodigoUnico()
  nuevo.codigo = codigo
  nuevo.codigo_barra = codigo
  nuevo.nombre = nombre
  nuevo.descripcion = nombre
  nuevo.categoria = categoria
  nuevo.precio_compra = precioCompra
  nuevo.precio_venta = precioVenta
  nuevo.precio_min = precioVenta
  nuevo.precio_xmayor = precioVenta
  nuevo.ganancia = precioVenta - precioCompra
  nuevo.stock = Number(nuevo.stock || 0)
  nuevo.usuario = usuarioLocal.value.usuario || 'SISTEMA'
  nuevo.almacen = almacenes.value || datosEmpresa.empresa.nombre || 'PRINCIPAL'
  if (nuevo.hasOwnProperty('created_at')) {
    nuevo.created_at = nfecha('timestamp')
    nuevo.updated_at = nfecha('timestamp')
  }

  const envioDatos = await peticionesFetchOffline('insertData', 'productos', JSON.stringify(nuevo))
  if (envioDatos[0] === 'ok') {
    visibleAgregarExpress.value = false
    await fetchAndSetupData()
    toast.add({ severity: 'success', summary: 'Éxito', detail: 'Producto agregado', life: 2500 })
  } else {
    toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo agregar el producto', life: 3000 })
  }
}
/************************************************************************/
watchEffect(() => {
  if (visiblePrecio.value) {
    modalPrecioCosto.value = productoSeleccionado.value.precio_compra
    modalPrecioPVenta.value = productoSeleccionado.value.precio_venta
    modalPrecioPMinimo.value = productoSeleccionado.value.precio_min
    modalPrecioXMayor.value = productoSeleccionado.value.precio_xmayor

  }
  if (visibleImei.value && currentRowData.value) {
    imeiForm.value = {
      precio_compra: Number(currentRowData.value.precio_compra || 0),
      precio_venta: Number(currentRowData.value.precio_venta || 0),
      precio_min: Number(currentRowData.value.precio_min || 0),
      precio_xmayor: Number(currentRowData.value.precio_xmayor || 0),
      proveedor: currentRowData.value.proveedor || '',
      capacidad: '128GB',
      bateria: 100
    }
  }
});
/************************************************************************/
const totalRecords = ref(0);
const first = ref(0);
const rows = ref(10);
let productosSearchToken = 0;
let productosSearchTimeout = null;


const fetchAndSetupData = async (event) => {
    loading.value = true
  if (event) {
    first.value = event.first;
    rows.value = event.rows;
  }
  const tokenBusqueda = ++productosSearchToken;

  try {
    const filtros = [];
    const almacenActual = almacenes.value && almacenes.value !== 'TODOS'
      ? almacenes.value
      : '';

    if (selectedCategory.value && selectedCategory.value !== 'all') {
      filtros.push({ campo: 'categoria', valor: selectedCategory.value, tipo: 'equals' });
    }

    const response = await peticionesFetchOffline('getDataAsArrayLazy', 'productos', {
      limit: rows.value,
      offset: first.value,
      search: String(searchQuery.value || '').trim(),
      searchFields: [
        'codigo',
        'codigo_barra',
        'nombre',
        'descripcion',
        'categoria',
        'marca',
        'modelo',
        'proveedor',
        'almacen'
      ],
      orderBy: 'id',
      orderDir: 'DESC',
      filtroCampo: almacenActual ? 'almacen' : '',
      filtroValor: almacenActual,
      filtros,
      stockMode: selectedFilter.value
    });

    if (tokenBusqueda === productosSearchToken) {
      const registros = Array.isArray(response?.data) ? response.data : [];
      data.value = registros;
      productosArray.value = registros;
      totalRecords.value = Number(response?.total || 0);
    }
  } finally {
    if (tokenBusqueda === productosSearchToken) {
      loading.value = false;
    }
  }
};

const onPage = async (event) => {
  await fetchAndSetupData(event);
};

watch([searchQuery, selectedFilter, selectedCategory, almacenes], () => {
  if (productosSearchTimeout) {
    clearTimeout(productosSearchTimeout);
  }

  productosSearchTimeout = setTimeout(async () => {
    first.value = 0;
    await fetchAndSetupData();
  }, 250);
});

// Resetear el nuevo stock cuando se abra la modal
watch(visibleStock, (newVal) => {
  if (newVal) {
    nuevostock.value = 0;
  }
});

// Watchers para regenerar el código de barras en tiempo real
watch(codigoBarcode, () => {
  if (visibleBarcode.value && codigoBarcode.value) {
    generarCodigoBarcode();
  }
});

watch(() => datosBarcode.value.barcodetype, () => {
  if (visibleBarcode.value && codigoBarcode.value) {
    generarCodigoBarcode();
  }
});

watch(() => [
  datosBarcode.value.barwidth,
  datosBarcode.value.barheight,
  datosBarcode.value.fontsize
], () => {
  if (visibleBarcode.value && codigoBarcode.value) {
    generarCodigoBarcode();
  }
});

watch(incluirCodigo, () => {
  if (visibleBarcode.value && codigoBarcode.value) {
    generarCodigoBarcode();
  }
});

watch(incluirTexto, () => {
  if (visibleBarcode.value && codigoBarcode.value) {
    generarCodigoBarcode();
  }
});

watch(incluirPrecio, () => {
  if (visibleBarcode.value && codigoBarcode.value) {
    generarCodigoBarcode();
  }
});

watch(incluirCabecera, () => {
  if (visibleBarcode.value && codigoBarcode.value) {
    generarCodigoBarcode();
  }
});

// Generar código cuando se abre la modal
watch(visibleBarcode, (newVal) => {
  if (newVal && codigoBarcode.value) {
    nextTick(() => {
      generarCodigoBarcode();
    });
  }
});

onBeforeUnmount(() => {
  if (productosSearchTimeout) {
    clearTimeout(productosSearchTimeout);
  }
});
/************************************************************************/
const fetchDataBarcode = async () => {
/*const response = await peticionesFetch(`${link.value}${api.value}`,`datoscampo/barcode/id/1`,{},tokenCifrado.value,'GET');*/
const response = await peticionesFetchOffline('getDataByField', 'barcode','id',1);
    const jsonData = response;
    datosBarcode.value = jsonData;
};
/************************************************************************/
const fetchCatergorias = async () => {
/*const response = await peticionesFetch(`${link.value}${api.value}`, `datosarray/categorias`, {}, tokenCifrado.value, 'GET');*/
const response = await peticionesFetchOffline('getDataAsArray', 'categorias');
    categoriasArray.value = response;
};
/************************************************************************/
const fetchProveedores = async () => {
  const response = await peticionesFetchOffline('getDataAsArray', 'proveedores');
  proveedoresArray.value = Array.isArray(response) ? response : [];
}
/************************************************************************/
const fetchDataEmpresas = async () => {
  try {
    const response = await peticionesFetchOffline('getDataAsArray', 'empresa');

    // Guarda los datos crudos
    empresaData.value = response;

    // Mapea a formato { label, value }
    const empresasFormateadas = response.map(emp => ({
      label: emp.nombre,
      value: emp.nombre
    }));

    // Agrega la opción "TODOS"
    empresasFormateadas.push({ label: 'TODOS', value: 'TODOS' });

    // Asigna al Dropdown
    empresas.value = empresasFormateadas;

    // Establece la selección inicial
    almacenes.value = datosEmpresa.empresa.nombre || 'TODOS';

  } catch (error) {
    console.error('Error fetching data', error);
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'No se pudieron obtener las empresas',
      life: 3000
    });
  }
};

/************************************************************************/
async function campos() {
  const campos = await arrayToObjetoFromTablaOffline('productos');
  datoscamposProductos.value = campos;
}
/************************************************************************/
const listadoImeiArray = ref([])
const imeiSeleccionados = ref([])
/************************************************************************/
const fechDataIMEI = async () => {
  try {
    let procesados = 0;
/*    const response = await enviarDatosPorPost(
      `${link.value + api.value}/datosarraycondicion/imei`,
      { campo: 'estado', valor: 'DISPONIBLE' },
      tokenCifrado.value
    );
*/
    const response = await peticionesFetchOffline('getDataByCondition', 'imei', 'estado', 'DISPONIBLE');

    const jsonData = response;
    listadoImeiArray.value = response;
    const productosCelulares = data.value.filter((producto) => producto.categoria === 'CELULARES');
    const total = productosCelulares.length;

    const actualizarProgreso = (valor, mensaje) => {
      const barra = document.getElementById('swal-sync-global-bar');
      const texto = document.getElementById('swal-sync-global-text');
      const porcentaje = document.getElementById('swal-sync-global-percent');

      if (barra) barra.style.width = `${valor}%`;
      if (texto) texto.textContent = mensaje;
      if (porcentaje) porcentaje.textContent = `${valor}%`;
    };

    Swal.fire({
      title: 'Sincronizando IMEI',
      html: `
        <div style="text-align:left;">
          <div id="swal-sync-global-text" style="font-size:13px; margin-bottom:8px;">Iniciando...</div>
          <div style="width:100%; height:10px; background:#e5e7eb; border-radius:9999px; overflow:hidden;">
            <div id="swal-sync-global-bar" style="height:100%; width:0%; background:#22c55e; transition:width .25s ease;"></div>
          </div>
          <div id="swal-sync-global-percent" style="margin-top:8px; font-size:12px; color:#64748b;">0%</div>
        </div>
      `,
      allowOutsideClick: false,
      allowEscapeKey: false,
      showConfirmButton: false
    });

    if (total === 0) {
      actualizarProgreso(100, 'No hay productos CELULARES para sincronizar');
      await new Promise((resolve) => setTimeout(resolve, 500));
      Swal.close();
      toast.add({
        severity: 'info',
        summary: 'Info',
        detail: 'No hay productos CELULARES para sincronizar',
        life: 3000
      });
      return;
    }

    for (const producto of productosCelulares) {
      const imeisDisponibles = jsonData.filter((imei) => imei.id_equi == producto.id);
      producto.stock = imeisDisponibles.length;
      if (producto.hasOwnProperty('created_at')) {
        producto.updated_at = nfecha('timestamp');
      }

      const envioDatos = await peticionesFetchOffline('updateData', 'productos', JSON.stringify(producto));

      procesados += 1;
      const porcentaje = Math.round((procesados / total) * 100);
      actualizarProgreso(porcentaje, `Sincronizando producto ${procesados} de ${total}`);

      if (!envioDatos || envioDatos[0] !== 'ok') {
        Swal.close();
        toast.add({
          severity: 'error',
          summary: 'Error',
          detail: `Error al sincronizar ${producto.nombre || 'producto'}`,
          life: 3000
        });
        return;
      }
    }

    actualizarProgreso(100, 'Sincronizacion completada');
    await new Promise((resolve) => setTimeout(resolve, 350));
    Swal.close();
    toast.add({ severity: 'success', summary: 'Éxito', detail: 'Datos sincronizados', life: 3000 });
    await fetchAndSetupData();
  } catch (error) {
    console.error('Error in fechDataIMEI:', error);
    Swal.close();
    toast.add({ severity: 'error', summary: 'Error', detail: 'Error al sincronizar IMEI', life: 3000 });
  }
};

/************************************************************************/
const fetchEmpresaDatosarraypost = async () => {
  try {
/*    const response = await peticionesFetch(
      `${link.value}${api.value}`,
      'datosarraypost',
      { tabla: 'empresa',  },
      tokenCifrado.value,
      'POST'
    );*/
    const response = await peticionesFetchOffline('getDataAsArray', 'empresa');
    empresaData.value = response;
    const nombres = response.map(empresa=>empresa.nombre);
     //optionsEmpresas.value = nombres
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to fetch data from empresa',
      life: 3000
    });
  }
};
/************************************************************************/
onMounted(async () => {
const datosJSON = await envioElectron('datosarchivo');

link.value = datosJSON.VITE_LINKURL;
api.value = datosJSON.VITE_LINK_API;
token.value = datosJSON.VITE_TOKEN;
patronTelefono.value = datosJSON.VITE_PATRON_TELEFONO;
linkImpresora.value = datosJSON.VITE_IMPRESORA_LOCAL;
tokenCorto.value = datosJSON.VITE_TOKEN_CORTO;
patroncedula.value = datosJSON.VITE_PATRON_CEDULA;
OPENAI_API_KEY.value = datosJSON.VITE_OPENAI_API_KEY || '';

tokenCifrado.value = await encryptarPassword(token.value, 10);


   await crearTablaSiNoExisteOffline('productos', camposArray.join(','),toast);


usuarioLocal.value = JSON.parse(window.localStorage.getItem('usuarioLocal'))[0] || {};
datosDefault.value = JSON.parse(window.localStorage.getItem('datosDefault')) || {};
datosConfiguracion.value = JSON.parse(window.localStorage.getItem('configuracion')) || {}


await fetchDataEmpresas();
restaurarFiltrosAlRegresar();
await fetchAndSetupData();
await fetchDataBarcode();
await fetchCatergorias();
await fetchProveedores();
empresa1.value = empresaData.value[0]
empresa2.value = empresaData.value[1]

});
/************************************************************************/
  async function borrarTodo() {
    Swal.fire({
        title: "¿Estás seguro?",
        text: "¡Se borrarán los datos!",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "S?, de acuerdo",
        cancelButtonText: "No, cancelar"
    }).then(async (result) => {
        if (result.isConfirmed) {
            const { value: password } = await Swal.fire({
                title: 'Introduce la contraseña',
                input: 'password',
                inputPlaceholder: 'Contraseña',
                showCancelButton: true,
                confirmButtonText: 'Confirmar',
                cancelButtonText: 'Cancelar'
            });
            if (password) {
               if (password === token.value || password === tokenCorto.value) {
                    /*const envioDatos = await borrarTodoslosDatos(link.value + api.value + '/borrartodo', 'productos', tokenCifrado.value);*/
                    const envioDatos = await peticionesFetchOffline('deleteAll', 'productos');

                    if (envioDatos[0] == 'ok') {
                        fetchAndSetupData();
                        toast.add({ severity: 'success', summary: 'Éxito', detail: 'Datos borrados', life: 3000 });
                    } else {
                        toast.add({ severity: 'error', summary: 'Error', detail: 'Fallo al borrar datos.', life: 3000 });
                   }
                } else {
                    toast.add({ severity: 'error', summary: 'Error', detail: 'Contraseña incorrecta', life: 3000 });
                }
            }
        } else if (result.dismiss === Swal.DismissReason.cancel) {
            toast.add({ severity: 'success', summary: 'No te preocupes', detail: 'Datos seguros', life: 3000 });
        }
    });
}
/************************************************************************/
async function funcionActualizar() {
  const url = link.value+api.value+"/actualizarcampos/productos";
  if (!datoscampos.value) {
    console.error("Datos incompletos, no se puede actualizar.");
    return;
  }
  if (datoscampos.value.hasOwnProperty('created_at')) {
    datoscampos.value.updated_at = nfecha('timestamp');
  }
/*  const envioDatos = await enviarDatosPorPost(url, datoscampos.value, tokenCifrado.value);*/
  const envioDatos = await peticionesFetchOffline('updateData', 'productos',JSON.stringify(datoscampos.value));
  if (envioDatos && envioDatos[0] == 'ok') {
    visible.value = false;
    fetchAndSetupData();
    toast.add({ severity: 'success', summary: 'Éxito', detail: 'Datos Actualizados', life: 3000 });
  } else {
    toast.add({ severity: 'error', summary: 'Error', detail: 'Fallo al actualizar los datos.', life: 3000 });
  }
}
/************************************************************************/
async function funcionCrear() {
  const url = link.value+api.value+"/insertar/productos";
  if (datoscamposProductos.value.hasOwnProperty('created_at')) {
    datoscamposProductos.value.created_at = nfecha('timestamp');
    datoscamposProductos.value.updated_at = nfecha('timestamp');
  }
 /* const envioDatos = await enviarDatosPorPost(url, datoscamposProductos.value, tokenCifrado.value);*/
  const envioDatos = await peticionesFetchOffline('insertData', 'productos',JSON.stringify(datoscamposProductos.value));
  if (envioDatos[0] == 'ok') {
    fetchAndSetupData();
    toast.add({ severity: 'success', summary: 'Éxito', detail: 'Datos Agregados', life: 3000 });
    limpiarCamposCrear();
    visiblecrear.value = false;
  } else {
    toast.add({ severity: 'error', summary: 'Error', detail: 'Fallo al Agregar los datos.', life: 3000 });
  }
}
/************************************************************************/

const abrirModalCrearListaTelefonos = () => {
  visibleCrearListaTelefonos.value = true;
};

const limpiarModeloTelefono = (modelo) => {
  return String(modelo || '')
    .replace(/\b\d+\s(GB|TB)\b/gi, '')
    .replace(/\((:\d+\s(GB|TB)|[^)]*RAM[^)]*)\)/gi, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
};

const normalizarAnioTelefono = (anio) => {
  const n = Number(anio);
  if (Number.isFinite(n) && n >= 2007 && n <= 2035) {
    return Math.trunc(n);
  }
  return new Date().getFullYear();
};

const obtenerFallbackApple = () => {
  return [
    { marca: 'APPLE', modelo: 'iPhone', anio: 2007 },
    { marca: 'APPLE', modelo: 'iPhone 3G', anio: 2008 },
    { marca: 'APPLE', modelo: 'iPhone 3GS', anio: 2009 },
    { marca: 'APPLE', modelo: 'iPhone 4', anio: 2010 },
    { marca: 'APPLE', modelo: 'iPhone 4S', anio: 2011 },
    { marca: 'APPLE', modelo: 'iPhone 5', anio: 2012 },
    { marca: 'APPLE', modelo: 'iPhone 5C', anio: 2013 },
    { marca: 'APPLE', modelo: 'iPhone 5S', anio: 2013 },
    { marca: 'APPLE', modelo: 'iPhone 6', anio: 2014 },
    { marca: 'APPLE', modelo: 'iPhone 6 Plus', anio: 2014 },
    { marca: 'APPLE', modelo: 'iPhone 6S', anio: 2015 },
    { marca: 'APPLE', modelo: 'iPhone 6S Plus', anio: 2015 },
    { marca: 'APPLE', modelo: 'iPhone SE (1st gen)', anio: 2016 },
    { marca: 'APPLE', modelo: 'iPhone 7', anio: 2016 },
    { marca: 'APPLE', modelo: 'iPhone 7 Plus', anio: 2016 },
    { marca: 'APPLE', modelo: 'iPhone 8', anio: 2017 },
    { marca: 'APPLE', modelo: 'iPhone 8 Plus', anio: 2017 },
    { marca: 'APPLE', modelo: 'iPhone X', anio: 2017 },
    { marca: 'APPLE', modelo: 'iPhone XR', anio: 2018 },
    { marca: 'APPLE', modelo: 'iPhone XS', anio: 2018 },
    { marca: 'APPLE', modelo: 'iPhone XS Max', anio: 2018 },
    { marca: 'APPLE', modelo: 'iPhone 11', anio: 2019 },
    { marca: 'APPLE', modelo: 'iPhone 11 Pro', anio: 2019 },
    { marca: 'APPLE', modelo: 'iPhone 11 Pro Max', anio: 2019 },
    { marca: 'APPLE', modelo: 'iPhone SE (2nd gen)', anio: 2020 },
    { marca: 'APPLE', modelo: 'iPhone 12 Mini', anio: 2020 },
    { marca: 'APPLE', modelo: 'iPhone 12', anio: 2020 },
    { marca: 'APPLE', modelo: 'iPhone 12 Pro', anio: 2020 },
    { marca: 'APPLE', modelo: 'iPhone 12 Pro Max', anio: 2020 },
    { marca: 'APPLE', modelo: 'iPhone 13 Mini', anio: 2021 },
    { marca: 'APPLE', modelo: 'iPhone 13', anio: 2021 },
    { marca: 'APPLE', modelo: 'iPhone 13 Pro', anio: 2021 },
    { marca: 'APPLE', modelo: 'iPhone 13 Pro Max', anio: 2021 },
    { marca: 'APPLE', modelo: 'iPhone SE (3rd gen)', anio: 2022 },
    { marca: 'APPLE', modelo: 'iPhone 14', anio: 2022 },
    { marca: 'APPLE', modelo: 'iPhone 14 Plus', anio: 2022 },
    { marca: 'APPLE', modelo: 'iPhone 14 Pro', anio: 2022 },
    { marca: 'APPLE', modelo: 'iPhone 14 Pro Max', anio: 2022 },
    { marca: 'APPLE', modelo: 'iPhone 15', anio: 2023 },
    { marca: 'APPLE', modelo: 'iPhone 15 Plus', anio: 2023 },
    { marca: 'APPLE', modelo: 'iPhone 15 Pro', anio: 2023 },
    { marca: 'APPLE', modelo: 'iPhone 15 Pro Max', anio: 2023 },
    { marca: 'APPLE', modelo: 'iPhone 16', anio: 2024 },
    { marca: 'APPLE', modelo: 'iPhone 16 Plus', anio: 2024 },
    { marca: 'APPLE', modelo: 'iPhone 16 Pro', anio: 2024 },
    { marca: 'APPLE', modelo: 'iPhone 16 Pro Max', anio: 2024 },
    { marca: 'APPLE', modelo: 'iPhone 17', anio: 2025 },
    { marca: 'APPLE', modelo: 'iPhone 17 Plus', anio: 2025 },
    { marca: 'APPLE', modelo: 'iPhone 17 Pro', anio: 2025 },
    { marca: 'APPLE', modelo: 'iPhone 17 Pro Max', anio: 2025 }
  ];
};

const extraerJsonDesdeTexto = (texto) => {
  let limpio = String(texto || '').trim();
  if (limpio.startsWith('```')) {
    limpio = limpio.replace(/^```(:json)/i, '').replace(/```$/i, '').trim();
  }

  try {
    return JSON.parse(limpio);
  } catch (e) {
    const match = limpio.match(/\[[\s\S]*\]/);
    if (match[0]) return JSON.parse(match[0]);
    throw e;
  }
};

const normalizarModelosIA = (respuestaIA, marcasSolicitadas = [], anioDesde = 2007, anioHasta = 2035) => {
  const marcasSet = new Set(marcasSolicitadas.map((m) => String(m).toUpperCase().trim()));
  const salida = [];

  if (!Array.isArray(respuestaIA)) {
    return salida;
  }

  for (const item of respuestaIA) {
    if (!item) continue;

    if (Array.isArray(item.modelos)) {
      const marca = String(item.marca || '').toUpperCase().trim();
      if (!marca || (marcasSet.size > 0 && !marcasSet.has(marca))) continue;

      for (const modeloItem of item.modelos) {
        const modeloLimpio = limpiarModeloTelefono(modeloItem.modelo);
        if (!modeloLimpio) continue;

        salida.push({
          marca,
          modelo: modeloLimpio,
          anio: normalizarAnioTelefono(modeloItem.anio)
        });
      }
      continue;
    }

    const marca = String(item.marca || '').toUpperCase().trim();
    const modeloLimpio = limpiarModeloTelefono(item.modelo);
    if (!marca || !modeloLimpio) continue;
    if (marcasSet.size > 0 && !marcasSet.has(marca)) continue;

    salida.push({
      marca,
      modelo: modeloLimpio,
      anio: normalizarAnioTelefono(item.anio)
    });
  }

  const mapaUnicos = new Map();
  for (const telefono of salida) {
    const key = `${telefono.marca}__${telefono.modelo}`.toUpperCase();
    if (!mapaUnicos.has(key)) mapaUnicos.set(key, telefono);
  }

  if (marcasSet.has('APPLE')) {
    const appleBase = Array.from(mapaUnicos.values()).filter((x) => x.marca === 'APPLE');
    const tieneIphone17 = appleBase.some((x) => /^IPHONE 17(\b| )/i.test(x.modelo));
    if (!tieneIphone17) {
      const extras17 = [
        { marca: 'APPLE', modelo: 'iPhone 17', anio: 2025 },
        { marca: 'APPLE', modelo: 'iPhone 17 Plus', anio: 2025 },
        { marca: 'APPLE', modelo: 'iPhone 17 Pro', anio: 2025 },
        { marca: 'APPLE', modelo: 'iPhone 17 Pro Max', anio: 2025 }
      ];
      for (const item of extras17) {
        mapaUnicos.set(`${item.marca}__${item.modelo}`.toUpperCase(), item);
      }
    }
  }

  return Array.from(mapaUnicos.values()).filter((x) => x.anio >= anioDesde && x.anio <= anioHasta);
};

const consultarModelosMarcaAnioConIA = async (apiKey, marca, anio) => {
  const response = await axios.post(
    'https://api.openai.com/v1/chat/completions',
    {
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'Eres un asistente experto en catalogos de telefonos. Responde solo JSON valido.'
        },
        {
          role: 'user',
          content: `Genera TODOS los modelos de telefonos de la marca ${marca} lanzados en el año ${anio}.
Reglas:
1) Devuelve exclusivamente un JSON valido (sin markdown) con esta estructura:
[
  {
    "marca": "${marca}",
    "modelos": [
      { "modelo": "Modelo X", "año": ${anio} }
    ]
  }
]
2) Incluye todos los modelos o variantes principales de ese año para esa marca.
3) No incluyas capacidades en el nombre del modelo (ejemplo: no "128GB", no "256GB").
4) No incluyas modelos de otros años ni de otras marcas.
5) Si no hay modelos en ese año, devuelve [].`
        }
      ],
      max_tokens: 2200,
      temperature: 0.1
    },
    {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    }
  );

  const contenido = response.data.choices[0]?.message?.content || '[]';
  return extraerJsonDesdeTexto(contenido);
};

const consultarModelosTelefonosConIA = async (marcasSolicitadas, anioDesde, anioHasta) => {
  const apiKey = OPENAI_API_KEY.value || datosConfiguracion.value.openai_api_key || '';
  if (!apiKey) {
    throw new Error('NO_OPENAI_KEY');
  }

  const respuestas = [];
  const marcas = marcasSolicitadas.map((m) => String(m).toUpperCase().trim());

  for (const marca of marcas) {
    for (let anio = anioDesde; anio <= anioHasta; anio += 1) {
      const parcial = await consultarModelosMarcaAnioConIA(apiKey, marca, anio);
      if (Array.isArray(parcial) && parcial.length) {
        respuestas.push(...parcial);
      }
    }
  }

  return normalizarModelosIA(respuestas, marcasSolicitadas, anioDesde, anioHasta);
};
async function crearListaTelefonosDesdeIA() {
  if (!marcasTelefonosSeleccionadas.value.length) {
    toast.add({
      severity: 'warn',
      summary: 'Aviso',
      detail: 'Selecciona al menos una marca',
      life: 3000
    });
    return;
  }
  if (Number(anioDesdeTelefonos.value) > Number(anioHastaTelefonos.value)) {
    toast.add({
      severity: 'warn',
      summary: 'Aviso',
      detail: 'El anio desde no puede ser mayor al anio hasta',
      life: 3000
    });
    return;
  }

  loading.value = true;
  procesandoListaTelefonos.value = true;

  let modelos = [];
  const anioDesde = Number(anioDesdeTelefonos.value) || 2007;
  const anioHasta = Number(anioHastaTelefonos.value) || new Date().getFullYear();

  try {
    modelos = await consultarModelosTelefonosConIA(marcasTelefonosSeleccionadas.value, anioDesde, anioHasta);
  } catch (error) {
    console.error('Error consultando modelos de telefonos con IA:', error);

    const marcasSet = new Set(marcasTelefonosSeleccionadas.value.map((m) => String(m).toUpperCase()));
    if (marcasSet.has('APPLE')) {
      modelos = obtenerFallbackApple().filter((x) => x.anio >= anioDesde && x.anio <= anioHasta);
    }

    if (error.message === 'NO_OPENAI_KEY') {
      toast.add({
        severity: 'warn',
        summary: 'OpenAI no configurado',
        detail: 'No hay API Key de OpenAI. Se usara lista local para APPLE si aplica.',
        life: 5000
      });
    }
  }

  if (!modelos.length) {
    loading.value = false;
    procesandoListaTelefonos.value = false;
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'No se obtuvieron modelos para crear',
      life: 3000
    });
    return;
  }

  let creados = 0;
  let errores = 0;

  for (const telefono of modelos) {
    const modeloLimpio = limpiarModeloTelefono(telefono.modelo);
    if (!modeloLimpio) continue;

    const marca = String(telefono.marca || 'SIN REGISTRO').toUpperCase().trim();
    const codigoGenerado = generarCodigoUnico();
    const producto = {
      codigo: codigoGenerado,
      codigo_barra: codigoGenerado,
      condicion: 'NUEVO',
      situacion: 'DISPONIBLE',
      t_garantia: '12 MESES',
      descripcion: modeloLimpio,
      categoria: 'CELULARES',
      proveedor: marca,
      marca,
      modelo: modeloLimpio,
      precio_compra: 0,
      impuestos: 0,
      ganancia: 0,
      precio_venta: 0,
      precio_min: 0,
      precio_xmayor: 0,
      impuesto_venta: 0,
      precio_final: 0,
      stock: 0,
      alerta: 1,
      empaque: '',
      ubicacion: '',
      otro: '',
      caracteristicas: `Smartphone ${modeloLimpio} fabricado por ${marca}`,
      nombre: modeloLimpio.toUpperCase(),
      usuario: usuarioLocal.value.usuario || 'SISTEMA',
      almacen: almacenes.value || datosEmpresa.empresa.nombre || 'PRINCIPAL',
      created_at: nfecha('timestamp'),
      updated_at: nfecha('timestamp')
    };

    try {
      const envioDatos = await peticionesFetchOffline('insertData', 'productos', JSON.stringify(producto));
      if (envioDatos[0] === 'ok') {
        creados++;
      } else {
        errores++;
      }
    } catch (error) {
      console.error(`Error al crear ${modeloLimpio}:`, error);
      errores++;
    }
  }

  loading.value = false;
  procesandoListaTelefonos.value = false;
  await fetchAndSetupData();

  if (creados > 0) {
    visibleCrearListaTelefonos.value = false;
    toast.add({
      severity: 'success',
      summary: 'Éxito',
      detail: `Se crearon ${creados} telefonos${errores > 0 ? ` (${errores} errores)` : ''}`,
      life: 5000
    });
  } else {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'No se pudo crear ningun telefono',
      life: 3000
    });
  }
}

/************************************************************************/
async function borrarSeleccionados() {
    Swal.fire({
        title: "Estas Seguro",
        text: "Se Borraran los Datos!",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "S?, de acuerdo!",
        cancelButtonText: "No, cancelar!",
    }).then(async (result) => {
        if (result.isConfirmed) {
            const { value: password } = await Swal.fire({
                title: 'Introduce la contraseña',
                input: 'password',
                inputPlaceholder: 'Contraseña',
                showCancelButton: true,
                confirmButtonText: 'Confirmar',
                cancelButtonText: 'Cancelar'
            });
            if (password) {
                if (password === token.value || password === tokenCorto.value) {
                    let exitoTotal = true;
                    if (selectedItems.value.length > 0) {
                        for (let prod of selectedItems.value) {
                            try {


                             if(prod.categoria === 'CELULARES'){
/*                                    const responseImei = await peticionesFetch(
                                      `${link.value}${api.value}`,
                                      'datosarraycondicion/imei',
                                      { campo: 'id_equi', valor: prod.id },
                                      tokenCifrado.value,
                                      'POST'
                                    );*/
                                    const responseImei = await peticionesFetchOffline('getDataArrayByCondition', 'imei','id_equi',prod.id);

                                    if(responseImei.length > 0){
                                        for(let imeiS of responseImei)
                               /*         await eliminarDatos(`${link.value}${api.value}/borrar/imei`, imeiS.id, tokenCifrado.value);*/
                                    await peticionesFetchOffline('deleteEntry', 'imei',imeiS.id);
                                    }
                             }

   /*                             const envioDatos = await eliminarDatos(`${link.value}${api.value}/borrar/productos`, prod.id, tokenCifrado.value);*/
                                const envioDatos = await peticionesFetchOffline('deleteEntry', 'productos',prod.id);

                            } catch (error) {
                                console.error(`Error al eliminar datos para ID: ${id}`, error);
                                exitoTotal = false;
                            }
                        }
                        if (exitoTotal) {
                            fetchAndSetupData();
                            toast.add({ severity: 'success', summary: 'Éxito', detail: 'Datos Borrados', life: 3000 });
                        } else {
                            toast.add({ severity: 'error', summary: 'Error', detail: 'Fallo al Borrar los datos.', life: 3000 });
                        }
                    } else {
                        toast.add({ severity: 'error', summary: 'Error', detail: 'No hay datos para borrar', life: 3000 });
                    }
                } else {
                    toast.add({ severity: 'error', summary: 'Error', detail: 'Contraseña incorrecta', life: 3000 });
                }
            }
        } else if (result.dismiss === Swal.DismissReason.cancel) {
            toast.add({ severity: 'success', summary: 'No te preocupes', detail: 'Datos Seguros', life: 3000 });
        }
    });
}
/************************************************************************/
const precio_ventaProd = ref(0);
/************************************************************************/

const fetchImeiDatosporcampocondicion = async (id) => {
  try {
/*    const response = await peticionesFetch(
      `${link.value}${api.value}`,
      'datosporcampocondicion',
      { tabla: 'imei', campos: '*', campo: 'id_equi', valor: id },
      tokenCifrado.value,
      'POST'
    );*/
    const response = await peticionesFetchOffline('getDataArrayByCondition', 'imei','id_equi',id);
    imeiSeleccionados.value = response;
    //imeiDataNames.value = response.map(imei=>imei.name);
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to fetch data from imei',
      life: 3000
    });
  }
};

/************************************************************************/
const fetchImeiDatosarraydoblecondicion = async (id) => {
  try {
/*    const response = await peticionesFetch(
      `${link.value}${api.value}`,
      'datosarraydoblecondicion/imei',
      { campo1: 'id_equi',
        valor1: id,
        campo2: 'estado',
        valor2: 'DISPONIBLE',
        },
      tokenCifrado.value,
      'POST'
    );*/
    const response = await peticionesFetchOffline('getDataArrayByTwoConditions', 'imei','id_equi',id,'estado','DISPONIBLE');
    console.log("response", response);
    //return response
    listadoImeiSelected.value = response;
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to fetch data from imei',
      life: 3000
    });
  }
};
/************************************************************************/
const itemsProductos = ref([]);
const menu = ref(null);
const currentRowData = ref(null);
const fnSincronizarImeiProducto = async (producto) => {
  if (!producto || producto.categoria !== 'CELULARES') return;

  let progreso = 10;
  let intervaloProgreso = null;

  const actualizarProgresoSwal = (valor, mensaje = 'Sincronizando IMEI...') => {
    const barra = document.getElementById('swal-sync-bar');
    const texto = document.getElementById('swal-sync-text');
    const porcentaje = document.getElementById('swal-sync-percent');

    if (barra) barra.style.width = `${valor}%`;
    if (texto) texto.textContent = mensaje;
    if (porcentaje) porcentaje.textContent = `${valor}%`;
  };

  Swal.fire({
    title: 'Sincronizar IMEI',
    html: `
      <div style="text-align:left;">
        <div id="swal-sync-text" style="font-size:13px; margin-bottom:8px;">Preparando sincronización...</div>
        <div style="width:100%; height:10px; background:#e5e7eb; border-radius:9999px; overflow:hidden;">
          <div id="swal-sync-bar" style="height:100%; width:10%; background:#22c55e; transition:width .25s ease;"></div>
        </div>
        <div id="swal-sync-percent" style="margin-top:8px; font-size:12px; color:#64748b;">10%</div>
      </div>
    `,
    allowOutsideClick: false,
    allowEscapeKey: false,
    showConfirmButton: false,
    didOpen: () => {
      actualizarProgresoSwal(10, 'Preparando sincronización...');
      intervaloProgreso = setInterval(() => {
        if (progreso < 90) {
          progreso += 7;
          actualizarProgresoSwal(progreso, 'Sincronizando IMEI...');
        }
      }, 250);
    }
  });

  try {
    actualizarProgresoSwal(95, 'Actualizando stock del producto...');
    const resultado = await sincronizarStockProductoPorImeiDisponible(producto.id);

    if (intervaloProgreso) {
      clearInterval(intervaloProgreso);
      intervaloProgreso = null;
    }

    if (resultado.success) {
      actualizarProgresoSwal(100, 'Sincronizacion completada');
      await new Promise(resolve => setTimeout(resolve, 250));
      Swal.close();
      toast.add({
        severity: 'success',
        summary: 'Éxito',
        detail: `Stock sincronizado con IMEI disponible: ${resultado.stock}`,
        life: 3000
      });
      await fetchAndSetupData();
    } else {
      Swal.close();
      toast.add({
        severity: 'error',
        summary: 'Error',
        detail: resultado.message || 'No se pudo sincronizar el stock por IMEI',
        life: 3000
      });
    }
  } catch (error) {
    if (intervaloProgreso) {
      clearInterval(intervaloProgreso);
      intervaloProgreso = null;
    }
    Swal.close();
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Error al sincronizar IMEI',
      life: 3000
    });
  } finally {
    if (intervaloProgreso) {
      clearInterval(intervaloProgreso);
    }
  }
};

const toggleProductos = (event, rowData) => {
currentRowData.value = rowData;
itemsProductos.value = [
{ label: 'Editar', icon: 'pi pi-pencil', command: () => {
guardarFiltrosParaVolver();
router.push({ path: `/editarproductos/${currentRowData.value.id}` });
} },
{ label: 'Inventario', icon: 'pi pi-sync', command: () => {
    visibleSwitchInventario.value = true
}},
{ label: 'Informe', icon: 'pi icon-chart-bar', command: () => {
       productoSeleccionado.value = currentRowData.value
       visibleInforme.value = true
}},
{ label: 'Stock', icon: 'pi icon-th', command: () => {
  productoSeleccionado.value = currentRowData.value
  stockproducto.value = rowData.stock
  visibleStock.value = true
}},
{ label: 'Precio', icon: 'pi icon-money', command: () => {
       productoSeleccionado.value = currentRowData.value
       visiblePrecio.value = true


}},


{ label: 'Barcode', icon: 'pi icon-barcode', command: () => {
    visibleBarcode.value = true
    codigoBarcode.value = currentRowData.value.codigo_barra
    textoBarcode.value = currentRowData.value.nombre
    precio_ventaProd.value = currentRowData.value.precio_venta
    datosBarcode.value.barcodetype = 'CODE128'
}},
{ label: 'Clonar', icon: 'pi icon-clone', command: () => {
    toast.add({ severity: 'success', summary: 'Éxito', detail: 'Producto Clonado', life: 3000 });
    localStorage.setItem('clonado',JSON.stringify(currentRowData.value))
    router.push({ path: `/crearproductos` });
}},
{ label: 'Pasar a Dañados', icon: 'pi pi-exclamation-triangle', command: () => {
    fnAbrirDialogoPasarDanados(currentRowData.value);
}},
{ label: 'Pasar a Uso Interno', icon: 'pi pi-box', command: () => {
    fnAbrirDialogoUsoInterno(currentRowData.value);
}},
{ label: 'Generar Venta en Cero', icon: 'pi pi-shopping-cart', command: () => {
    fnGenerarVentaCero(currentRowData.value);
}},
{ label: 'Pasar de Almacén', icon: 'pi pi-arrow-right-arrow-left', command: () => {
    fnPasarDeAlmacenIndividual(currentRowData.value);
}},
{ label: 'Eliminar', icon: 'pi pi-trash', command: () => {
            Swal.fire({
                title: 'Introduce la contraseña',
                input: 'password',
                inputPlaceholder: 'Contraseña',
                showCancelButton: true,
                confirmButtonText: 'Eliminar',
                cancelButtonText: 'Cancelar'
            }).then(async (result) => {
                if (result.isConfirmed) {
                    const contrasenaIngresada = result.value;
                    if (contrasenaIngresada === token.value || contrasenaIngresada === tokenCorto.value) {


                             if(currentRowData.value.categoria === 'CELULARES'){
/*                                    const responseImei = await peticionesFetch(
                                      `${link.value}${api.value}`,
                                      'datosarraycondicion/imei',
                                      { campo: 'id_equi', valor: currentRowData.value.id },
                                      tokenCifrado.value,
                                      'POST'
                                    );*/
                                    const responseImei = await peticionesFetchOffline('getDataArrayByCondition', 'imei','id_equi',currentRowData.value.id);

                                    if(responseImei.length > 0){
                                        for(let imeiS of responseImei)
                                 /*       await eliminarDatos(`${link.value}${api.value}/borrar/imei`, imeiS.id, tokenCifrado.value);*/
                                    await peticionesFetchOffline('deleteEntry', 'imei',imeiS.id);
                                    }
                             }

                    /*    const datosFactura = await peticionesFetch(`${link.value}${api.value}`, `borrarporcampo/productos`, { campo: 'id', valor: currentRowData.value.id }, tokenCifrado.value, 'POST');*/
                        const datosFactura = await peticionesFetchOffline('deleteEntry', 'productos',currentRowData.value.id);


                        if (datosFactura[0] == 'ok') {
                            toast.add({ severity: 'success', summary: 'Éxito', detail: 'Datos eliminados correctamente', life: 3000 });
                            await fetchAndSetupData()
                        } else {
                            toast.add({ severity: 'error', summary: 'Error', detail: 'Error al eliminar los datos', life: 3000 });
                        }
                    } else {
                        toast.add({ severity: 'error', summary: 'Error', detail: 'Contraseña incorrecta', life: 3000 });
                    }
                }
            });
        }
    },
];

  if (rowData.categoria === 'CELULARES') {
    const imeiItem = {
      label: 'Agregar Imei',
      icon: 'pi icon-barcode',
      command: () => {
        productoSeleccionado.value = currentRowData.value;
        visibleImei.value = true;
      },
    };

    const posicion = 5;
    itemsProductos.value.splice(posicion, 0, imeiItem);
  }


  if (rowData.categoria === 'CELULARES') {
    const imeiItem = {
      label: 'Sincronizar IMEI',
      icon: 'pi pi-sync',
      command: async() => {
        await fnSincronizarImeiProducto(currentRowData.value);
      },
    };

    const posicion = 6;
    itemsProductos.value.splice(posicion, 0, imeiItem);
  }

  if (rowData.categoria === 'CELULARES') {
    const imeiItem = {
      label: 'Listado Imei',
      icon: 'pi icon-barcode',
      command: async() => {
        productoSeleccionado.value = currentRowData.value;
        await fetchImeiDatosarraydoblecondicion(currentRowData.value.id)
        visibleListadoImei.value = true;
      },
    };

    const posicion = 7;
    itemsProductos.value.splice(posicion, 0, imeiItem);
  }

menu.value.toggle(event);
};
/************************************************************************/
const filteredProducts = computed(() => {
  return data.value;
});
/************************************************************************/
const uniqueCategories = computed(() => {
  const categories = productosArray.value.map(product => product.categoria);
  return [...new Set(categories)];
});
/************************************************************************/
const fnAwesomplete = ()=>{
}
const handleSelectComplete = async(selected)=>{
}
/************************************************************************/
const limpiarBuscador = () => {
  searchQuery.value = '';
};
/************************************************************************/
const fnRouter = (ruta) => {
  router.push(ruta);
};
/************************************************************************/
/******************************************************************/
const fnActualizarStock = async () => {
  const datosPro = productoSeleccionado.value;

  if (!datosPro) {
    console.error("Producto no seleccionado.");
    return;
  }

  if (datosPro.categoria === 'CELULARES') {
    toast.add({ severity: 'error', summary: 'Error', detail: 'CELULARES solo con IMEI', life: 3000 });
    return;
  }

  // Limpiar y convertir valores
  let stockActual = Number(String(datosPro.stock).trim());
  let nuevoStock = Number(String(nuevostock.value).trim());


  if (isNaN(stockActual)) stockActual = 0;
  //if (isNaN(nuevoStock)) nuevoStock = 1;

  // Sumar o restar
  const nuevoTotal = stockActual + nuevoStock;

  // Si no quieres permitir stock negativo final, puedes descomentar esto:
  // if (nuevoTotal < 0) {
  //   toast.add({ severity: 'warn', summary: 'Advertencia', detail: 'El stock no puede quedar negativo.', life: 3000 });
  //   return;
  // }

  datosPro.stock = nuevoTotal;

  if (!datosPro.id) {
    console.error("Datos incompletos, no se puede actualizar.");
    return;
  }

  if (datosPro.hasOwnProperty('created_at')) {
    datosPro.updated_at = nfecha('timestamp');
  }

  const url = link.value + api.value + "/actualizarcampos/productos";
/*  const envioDatos = await enviarDatosPorPost(url, datosPro, tokenCifrado.value);*/
  const envioDatos = await peticionesFetchOffline('updateData', 'productos',JSON.stringify(datosPro));

  if (envioDatos && envioDatos[0] === 'ok') {
    nuevostock.value = 0;
    await fetchAndSetupData();
    const nDatos = data.value.find(prod => prod.id === datosPro.id);
    stockproducto.value = nDatos.stock;
    toast.add({ severity: 'success', summary: 'Éxito', detail: 'Datos Actualizados', life: 3000 });
  } else {
    toast.add({ severity: 'error', summary: 'Error', detail: 'Fallo al actualizar los datos.', life: 3000 });
  }
};

/******************************************************************/
const fnVerInforme = async () => {
  const fInicio = transformarFechaTimestamp(formatearFecha(fechaInicioInforme.value), false, true, false);
  const fFin = transformarFechaTimestamp(formatearFecha(fechaFinalInforme.value), false, false, true);

/*  const response = await peticionesFetch(
    `${link.value}${api.value}`,
    'datostimestamp',
    { "fechainicio": fInicio, "fechafin": fFin, campo: 'created_at', tabla: 'facturas' },
    tokenCifrado.value,
    'POST'
  );*/

const response = await peticionesFetchOffline('getRowsByTimestampRange', 'facturas','created_at',fInicio,fFin);


  const productoSeleccionadoCodigo = productoSeleccionado.value.codigo;
  let cantidadTotal = 0;

  response.forEach(factura => {
    const productos = JSON.parse(factura.productos);  // Deserializar productos
    productos.forEach(producto => {
      if (producto.codigo === productoSeleccionadoCodigo) {
        cantidadTotal += producto.cantidad;  // Sumar la cantidad del producto
      }
    });
  });

  cantidadInforme.value = cantidadTotal;
}
/******************************************************************/
const fnCrearExcel = async()=>{
  await crearYDescargarExcel(link.value,api.value,'productos',tokenCifrado.value,Swal)
}
/******************************************************************/
const dt = ref();
const products = ref();
const exportCSV = () => {
    dt.value.exportCSV();
};
/************************************************************************/
//const impresoraselected = ref('4BARCODE')
const printBarcode = () => {
    const content = {
        barcodeData: {
            barcodetype: datosBarcode.value.barcodetype,
            barwidth: parseInt(datosBarcode.value.barwidth),
            barheight: parseInt(datosBarcode.value.barheight),
            labelwidth: parseInt(datosBarcode.value.labelwidth),
            labelheight: parseInt(datosBarcode.value.labelheight),
            fontsize: parseInt(datosBarcode.value.fontsize),
            margen_izq: parseInt(datosBarcode.value.margen_izq),
            margen_der: parseInt(datosBarcode.value.margen_der),
            margen_sup: parseInt(datosBarcode.value.margen_sup),
            margen_inf: parseInt(datosBarcode.value.margen_inf),
            codigo: codigoBarcode.value,
        },
        labelWidth: parseInt(datosBarcode.value.labelwidth),
        labelHeight: parseInt(datosBarcode.value.labelheight),
        margins: {
            top: parseInt(datosBarcode.value.margen_sup),
            right: parseInt(datosBarcode.value.margen_der),
            bottom: parseInt(datosBarcode.value.margen_inf),
            left: parseInt(datosBarcode.value.margen_izq)
        },
        incluirCabecera:incluirCabecera.value,
        incluirTexto:incluirTexto.value,
        incluirCodigo:incluirCodigo.value,
        incluirOtro:incluirOtro.value,
        incluirPrecio:incluirPrecio.value,
        headerText: datosEmpresa.empresa.nombre,
        code: codigoBarcode.value,
        text: textoBarcode.value,
        precio: parseFloat(precio_ventaProd.value).toFixed(2),
        width: parseInt(datosBarcode.value.barwidth),
        height: parseInt(datosBarcode.value.barheight),
        fontSize: parseInt(datosBarcode.value.fontsize),
        cantidad: parseInt(cantidadBarcode.value),
        tipo: datosBarcode.value.barcodetype,
        printerName: datosBarcode.value.impresora,
        orientacion: orientacion.value,
    };
    window.electron.ipcRenderer.invoke('print-barcode', content);

};
/************************************************************************/
// Generar código de barras en tiempo real para vista previa
const generarCodigoBarcode = async () => {
  await nextTick();

  if (!codigoBarcode.value) return;

  try {
    const canvas = document.getElementById(`barcode-preview-${_uid}`);
    if (canvas) {
      JsBarcode(canvas, codigoBarcode.value, {
        format: datosBarcode.value.barcodetype || 'CODE128',
        width: datosBarcode.value.barwidth ? parseInt(datosBarcode.value.barwidth) / 100 : 2,
        height: datosBarcode.value.barheight ? parseInt(datosBarcode.value.barheight) : 50,
        displayValue: incluirCodigo.value,
        fontSize: datosBarcode.value.fontsize ? parseInt(datosBarcode.value.fontsize) : 20,
        margin: 10,
        background: '#ffffff',
        lineColor: '#000000'
      });
    }
  } catch (error) {
    console.error('Error al generar código de barras:', error);
  }
};
/************************************************************************/
const getRowClass = (data) => {
  if (Number(data.stock) <= 0) {
    return 'row-red';
  } else if (Number(data.stock) > 0 && Number(data.stock) <= Number(data.alerta)) {
    return 'row-yellow';
  } else if (Number(data.stock) > Number(data.alerta)) {
    return 'row-green';
  }
  return '';
};

/************************************************************************/
const colorEstado = (data) => {
    const stock = Number(data.stock);
    const alerta = Number(data.alerta);

    if (stock > alerta) {
        return 'success'; // Suficiente stock
    } else if (stock > 0 && stock <= alerta) {
        return 'warn'; // Stock bajo
    } else if (stock <= 0) {
        return 'danger'; // Sin stock
    } else {
        return 'secondary'; // Por si acaso
    }
};

/************************************************************************/
const onRowSelect = (event) => {
           guardarFiltrosParaVolver();
           router.push({ path: `/editarproductos/${event.data.id}` });
};
/************************************************************************/
const fnAplicarPrecio = async()=>{
  const url = link.value+api.value+"/actualizarcampos/productos";
  if (productoSeleccionado.value.hasOwnProperty('created_at')) {
      productoSeleccionado.value.updated_at = nfecha('timestamp')
    }

/*  const envioDatos = await enviarDatosPorPost(url, productoSeleccionado.value,tokenCifrado.value);*/
  const envioDatos = await peticionesFetchOffline('updateData', 'productos',JSON.stringify(productoSeleccionado.value));
  if (envioDatos && envioDatos[0] == 'ok') {
     toast.add({ severity: 'success', summary: 'Éxito', detail: 'Datos Actualizados', life: 3000 });
  }else{
    toast.add({ severity: 'error', summary: 'Error', detail: 'Fallo al actualizar los datos.', life: 3000 });
  }

}
/************************************************************************/
// Función para abrir el modal de cambio masivo de precios
const abrirCambioMasivoPrecios = () => {
  cambioMasivo.value = {
    tipoSeleccion: 'categoria',
    categoriaSeleccionada: categoriasArray.value[0]?.nombre || categoriasArray.value[0] || null,
    productosSeleccionados: [],
    tipoAjuste: 'porcentaje',
    valorAjuste: 0,
    aplicarA: ['precio_venta'],
    direccion: 'aumentar'
  }
  visibleCambioMasivoPrecios.value = true
}
/************************************************************************/
// Función para aplicar cambio masivo de precios
const aplicarCambioMasivoPrecios = async () => {
  try {
    // Validaciones
    if (!cambioMasivo.value.valorAjuste || cambioMasivo.value.valorAjuste <= 0) {
      toast.add({ severity: 'warn', summary: 'Validación', detail: 'Debe ingresar un valor de ajuste válido', life: 2500 })
      return
    }

    if (cambioMasivo.value.aplicarA.length === 0) {
      toast.add({ severity: 'warn', summary: 'Validación', detail: 'Debe seleccionar al menos un tipo de precio', life: 2500 })
      return
    }

    // Obtener productos a actualizar
    let productosActualizar = []

    if (cambioMasivo.value.tipoSeleccion === 'categoria') {
      if (!cambioMasivo.value.categoriaSeleccionada) {
        toast.add({ severity: 'warn', summary: 'Validación', detail: 'Debe seleccionar una categoría', life: 2500 })
        return
      }
      productosActualizar = productosArray.value.filter(p => p.categoria === cambioMasivo.value.categoriaSeleccionada)
    } else {
      // Selección individual
      if (cambioMasivo.value.productosSeleccionados.length === 0) {
        toast.add({ severity: 'warn', summary: 'Validación', detail: 'Debe seleccionar al menos un producto', life: 2500 })
        return
      }
      productosActualizar = cambioMasivo.value.productosSeleccionados
    }

    if (productosActualizar.length === 0) {
      toast.add({ severity: 'warn', summary: 'Validación', detail: 'No hay productos para actualizar', life: 2500 })
      return
    }

    // Confirmar acción
    const resultado = await Swal.fire({
      title: '¿Confirmar cambio de precios?',
      html: `Se actualizarán <b>${productosActualizar.length}</b> productos.<br>
             Tipo de ajuste: <b>${cambioMasivo.value.tipoAjuste === 'porcentaje' ? cambioMasivo.value.valorAjuste + '%' : '$' + cambioMasivo.value.valorAjuste}</b><br>
             Dirección: <b>${cambioMasivo.value.direccion === 'aumentar' ? 'Aumentar' : 'Disminuir'}</b>`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, aplicar cambios',
      cancelButtonText: 'Cancelar',
      heightAuto: false,
      customClass: {
        container: 'swal-on-top'
      }
    })

    if (!resultado.isConfirmed) {
      return
    }

    loading.value = true
    let actualizados = 0
    let errores = 0
    let imeisActualizados = 0

    // Aplicar cambios a cada producto
    for (const producto of productosActualizar) {
      try {
        const productoActualizado = { ...producto }
        const esCelular = String(producto.categoria || '').toUpperCase().includes('CELULAR')

        // Aplicar cambios a cada tipo de precio seleccionado
        cambioMasivo.value.aplicarA.forEach(tipoPrecio => {
          const precioActual = Number(producto[tipoPrecio] || 0)
          let precioNuevo = precioActual

          if (cambioMasivo.value.tipoAjuste === 'porcentaje') {
            const ajuste = precioActual * (cambioMasivo.value.valorAjuste / 100)
            precioNuevo = cambioMasivo.value.direccion === 'aumentar'
              ? precioActual + ajuste
              : precioActual - ajuste
          } else {
            // Ajuste por valor fijo
            precioNuevo = cambioMasivo.value.direccion === 'aumentar'
              ? precioActual + Number(cambioMasivo.value.valorAjuste)
              : precioActual - Number(cambioMasivo.value.valorAjuste)
          }

          // Asegurar que el precio no sea negativo
          productoActualizado[tipoPrecio] = Math.max(0, precioNuevo).toFixed(2)
        })

        // Actualizar timestamp si existe
        if (productoActualizado.hasOwnProperty('updated_at')) {
          productoActualizado.updated_at = nfecha('timestamp')
        }

        // Si es CELULAR, actualizar IMEIs relacionados
        if (esCelular) {
          try {
            // Obtener IMEIs con id_equi igual al id del producto
            const responseImeis = await peticionesFetchOffline('getDataByCondition', 'imei', 'id_equi', String(producto.id))

            if (responseImeis && Array.isArray(responseImeis)) {
              // Actualizar cada IMEI
              for (const imei of responseImeis) {
                const imeiActualizado = { ...imei }

                // Aplicar cambios a cada tipo de precio seleccionado en el IMEI
                cambioMasivo.value.aplicarA.forEach(tipoPrecio => {
                  const precioActual = Number(imei[tipoPrecio] || 0)
                  let precioNuevo = precioActual

                  if (cambioMasivo.value.tipoAjuste === 'porcentaje') {
                    const ajuste = precioActual * (cambioMasivo.value.valorAjuste / 100)
                    precioNuevo = cambioMasivo.value.direccion === 'aumentar'
                      ? precioActual + ajuste
                      : precioActual - ajuste
                  } else {
                    precioNuevo = cambioMasivo.value.direccion === 'aumentar'
                      ? precioActual + Number(cambioMasivo.value.valorAjuste)
                      : precioActual - Number(cambioMasivo.value.valorAjuste)
                  }

                  imeiActualizado[tipoPrecio] = Math.max(0, precioNuevo).toFixed(2)
                })

                if (imeiActualizado.hasOwnProperty('updated_at')) {
                  imeiActualizado.updated_at = nfecha('timestamp')
                }

                // Guardar IMEI actualizado
                const envioImei = await peticionesFetchOffline('updateData', 'imei', JSON.stringify(imeiActualizado))
                if (envioImei[0] === 'ok') {
                  imeisActualizados++
                }
              }
            }
          } catch (errorImei) {
            console.error('Error actualizando IMEIs del producto:', producto.id, errorImei)
          }
        }

        // Guardar producto en base de datos
        const envioDatos = await peticionesFetchOffline('updateData', 'productos', JSON.stringify(productoActualizado))

  if (envioDatos && envioDatos[0] === 'ok') {
          actualizados++
          // Actualizar en el array local
          const index = productosArray.value.findIndex(p => p.id === producto.id)
          if (index !== -1) {
            productosArray.value[index] = productoActualizado
          }
        } else {
          errores++
        }
      } catch (error) {
        console.error('Error actualizando producto:', error)
        errores++
      }
    }

    loading.value = false

    // Mostrar resultado
    if (actualizados > 0) {
      let detalleMensaje = `${actualizados} productos actualizados correctamente`
      if (imeisActualizados > 0) {
        detalleMensaje += ` y ${imeisActualizados} IMEIs actualizados`
      }
      if (errores > 0) {
        detalleMensaje += `. ${errores} productos con errores.`
      }

      toast.add({
        severity: 'success',
        summary: 'Actualización Completada',
        detail: detalleMensaje,
        life: 4000
      })
      visibleCambioMasivoPrecios.value = false
      await fetchAndSetupData() // Recargar datos
    } else {
      toast.add({
        severity: 'error',
        summary: 'Error',
        detail: 'No se pudo actualizar ningún producto',
        life: 3000
      })
    }

  } catch (error) {
    loading.value = false
    console.error('Error en cambio masivo de precios:', error)
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Ocurrió un error al aplicar los cambios',
      life: 3000
    })
  }
}
/************************************************************************/
const calcularPrecios = () => {
  return
  const impuesto = (Number(datosConfiguracion.value.impuesto) / 100);
  const gananciaMinima = parseFloat(productoSeleccionado.value.ganancia);
  const precioCompra = parseFloat(productoSeleccionado.value.precio_compra);
  const ganancia = Math.round(precioCompra * gananciaMinima / 100);
  let precioVenta = Math.round(ganancia + precioCompra);

  if (productoSeleccionado.value.tipo_impuesto == 'Incluido') {
    const operacion = Math.round(precioVenta / (1 + impuesto));
    const impuestoCalculado = Math.round(precioVenta - operacion);
    productoSeleccionado.value.impuesto_venta = impuestoCalculado.toFixed(2);
    productoSeleccionado.value.precio_venta = precioVenta.toFixed(2);
    productoSeleccionado.value.precio_final = precioVenta.toFixed(2);
  } else if (productoSeleccionado.value.tipo_impuesto == 'Agregado') {
    const precioConImpuesto = Math.round(precioVenta * (1 + impuesto));
    const impuestoCalculado = Math.round(precioConImpuesto - precioVenta);
    productoSeleccionado.value.precio_venta = precioVenta.toFixed(2);
    productoSeleccionado.value.impuesto_venta = impuestoCalculado.toFixed(2);
    productoSeleccionado.value.precio_final = precioConImpuesto.toFixed(2);
  } else {
    productoSeleccionado.value.precio_venta = precioVenta.toFixed(2);
    productoSeleccionado.value.impuesto_venta = '0.00';
    productoSeleccionado.value.precio_final = precioVenta.toFixed(2);
  }

  const precioMinimo = Math.round(precioVenta - (ganancia * 0.20));
  const precioXMayor = Math.round(precioVenta - (ganancia * 0.40));
  productoSeleccionado.value.precio_min = precioMinimo.toFixed(2);
  productoSeleccionado.value.precio_xmayor = precioXMayor.toFixed(2);
};
/************************************************************************/
const recarcularPventa = () => {
    const precioCompra = Number(productoSeleccionado.value.precio_compra);
    const precioVenta = Number(productoSeleccionado.value.precio_venta);

    if (!isNaN(precioCompra) && !isNaN(precioVenta) && precioCompra !== 0) {
        const ganancia = ((precioVenta - precioCompra) / precioCompra) * 100;
        productoSeleccionado.value.ganancia = ganancia.toFixed(2);
    } else {
        productoSeleccionado.value.ganancia = '0.00';
    }
    calcularPrecios()
}

/************************************************************************/
const fnTraspasoInventario = (seleccion) => {
  if (seleccion === 'empresa1') {
    empresa2.value = empresaData.value.find(emp => emp.id !== empresa1.value.id) || null;
  } else {
    empresa1.value = empresaData.value.find(emp => emp.id !== empresa2.value.id) || null;
  }
};

/************************************************************************/

/************************************************************************/
const fnCambiarInventario = async () => {
    const producto = currentRowData.value;

    if (producto.categoria === 'CELULARES') {
        // Lógica para celulares si es necesario
    } else {
        let empresa = empresa2.value.link.replace(/\/$/, '');
        const cantidad = Number(cantidadInventario.value);

/*        const response = await peticionesFetch(
            `${empresa}${api.value}`,
            'datoscondicion/productos/nombre/' + producto.nombre,
            {},
            tokenCifrado.value,
            'GET'
        );*/
        const response = await peticionesFetchOffline('getDataByCondition', 'productos','nombre',producto.nombre);

        if (response) {
            // Crear una copia del producto y eliminar la propiedad 'id'
            const productoCopia = { ...producto }; // Crear copia del objeto
            delete productoCopia.id; // Eliminar la propiedad 'id' de la copia

            const url = empresa + api.value + "/insertar/productos";
            productoCopia.stock = cantidad;
/*            const envioDatos = await enviarDatosPorPost(url, productoCopia, tokenCifrado.value);*/
            const envioDatos = await peticionesFetchOffline('insertData', 'productos',JSON.stringify(productoCopia));

            if (envioDatos[0] == 'ok') {
                toast.add({ severity: 'success', summary: 'Éxito', detail: 'Datos agregados con éxito.', life: 3000 });
            } else {
                toast.add({ severity: 'error', summary: 'Error', detail: 'Fallo al Agregar los datos.', life: 3000 });
            }
        }

        console.log("response", response);
    }
};

/************************************************************************/
const toggleOrientation = () => {
  orientacion.value = orientacion.value === 'horizontal' ? 'vertical' : 'horizontal';
};

/************************************************************************/
async function fnAgregarImei() {
    const imei = imeiModal.value;
    const verificaIMEI = await peticionesFetchOffline('getDataByField', 'imei', 'imei', imeiModal.value);
    if (verificaIMEI) {
        toast.add({ severity: 'error', summary: 'Error', detail: 'ESTE IMEI YA ESTA REGISTRADO', life: 3000 });
        imeiModal.value = '';
        return;
    }

    const datoscamposImei = await arrayToObjetoFromTablaOffline('imei');
    datoscamposImei.imei = imeiModal.value;
    datoscamposImei.equipo = currentRowData.value.nombre;
    datoscamposImei.id_equi = currentRowData.value.id;
    datoscamposImei.proveedor = imeiForm.value.proveedor || currentRowData.value.proveedor;
    datoscamposImei.precio_compra = Number(imeiForm.value.precio_compra || currentRowData.value.precio_compra || 0);
    datoscamposImei.precio_venta = Number(imeiForm.value.precio_venta || currentRowData.value.precio_venta || 0);
    datoscamposImei.precio_min = Number(imeiForm.value.precio_min || currentRowData.value.precio_min || 0);
    datoscamposImei.precio_xmayor = Number(imeiForm.value.precio_xmayor || currentRowData.value.precio_xmayor || 0);
    datoscamposImei.capacidad = imeiForm.value.capacidad || '128GB';
    datoscamposImei.bateria = Number(imeiForm.value.bateria || 100);
    datoscamposImei.no_compra = currentRowData.value.no_compra;
    datoscamposImei.estado = 'DISPONIBLE';
    datoscamposImei.fecha = nfecha('fecha');
    datoscamposImei.detalles = '';
    datoscamposImei.almacen = datosEmpresa.empresa.nombre;

    const url = link.value + api.value + "/insertar/imei";
    if (datoscamposImei.hasOwnProperty('created_at')) {
        datoscamposImei.created_at = nfecha('timestamp');
        datoscamposImei.updated_at = nfecha('timestamp');
    }

    const envioDatos = await peticionesFetchOffline('insertData', 'imei', JSON.stringify(datoscamposImei));
    if (envioDatos[0] == 'ok') {
        const responseImei = await peticionesFetchOffline('getDataArrayByTwoConditions', 'imei', 'id_equi', currentRowData.value.id, 'estado', 'DISPONIBLE');
        currentRowData.value.stock = responseImei.length;
        toast.add({ severity: 'success', summary: 'Éxito', detail: 'IMEI Agregado', life: 3000 });

        await nextTick(); // Espera a que el DOM se actualice
        imeiModal.value = '';

        const urlImei = link.value + api.value + "/actualizarcampos/productos";
        if (!currentRowData.value) {
            console.error("Datos incompletos, no se puede actualizar.");
            return;
        }
        if (currentRowData.value.hasOwnProperty('created_at')) {
            currentRowData.value.updated_at = nfecha('timestamp');
        }

        const envioDatosUpdate = await peticionesFetchOffline('updateData', 'productos', JSON.stringify(currentRowData.value));
        if (envioDatosUpdate[0] == 'ok') {
            toast.add({ severity: 'success', summary: 'Éxito', detail: 'Datos Actualizados', life: 3000 });
        } else {
            toast.add({ severity: 'error', summary: 'Error', detail: 'Fallo al actualizar los datos.', life: 3000 });
        }
    } else {
        toast.add({ severity: 'error', summary: 'Error', detail: 'Fallo al Agregar el IMEI.', life: 3000 });
    }
}

/************************************************************************/
// Funciones para Pasar a Dañados
/************************************************************************/
const fnAbrirDialogoPasarDanados = async (producto) => {
    productoSeleccionado.value = producto;
    imeisDanadosSeleccionados.value = [];
    cantidadPasarDanados.value = 1;
    motivoDanado.value = '';
    descripcionDanado.value = '';

    // Si es CELULARES o ELECTRODOMESTICOS, cargar IMEIs/Seriales disponibles
    if (producto.categoria === 'CELULARES' || producto.categoria === 'ELECTRODOMESTICOS') {
        const responseImei = await peticionesFetchOffline('getDataArrayByTwoConditions', 'imei', 'id_equi', producto.id, 'estado', 'DISPONIBLE');
        imeisDanadosDisponibles.value = responseImei;
    }

    visiblePasarDanados.value = true;
};

const fnProcesarPasarDanados = async () => {
    if (!motivoDanado.value) {
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Debe especificar el motivo de baja',
            life: 3000
        });
        return;
    }

    const categoria = productoSeleccionado.value.categoria;

    // Verificar si es CELULARES o ELECTRODOMESTICOS
    if (categoria === 'CELULARES' || categoria === 'ELECTRODOMESTICOS') {
        if (imeisDanadosSeleccionados.value.length === 0) {
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
            for (const imeiData of imeisDanadosSeleccionados.value) {
                // Registrar en productos_danados
                const datos = {
                    codigo_producto: productoSeleccionado.value.codigo || productoSeleccionado.value.codigo_barra,
                    nombre_producto: productoSeleccionado.value.nombre,
                    cantidad: 1,
                    imei_serial: imeiData.imei,
                    motivo_baja: motivoDanado.value,
                    descripcion_dano: descripcionDanado.value,
                    estado: 'Dado de baja',
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

            // Actualizar stock del producto
            const responseImeiDisponibles = await peticionesFetchOffline('getDataArrayByTwoConditions', 'imei', 'id_equi', productoSeleccionado.value.id, 'estado', 'DISPONIBLE');
            productoSeleccionado.value.stock = responseImeiDisponibles.length;
            productoSeleccionado.value.updated_at = nfecha('timestamp');
            await peticionesFetchOffline('updateData', 'productos', JSON.stringify(productoSeleccionado.value));

            toast.add({
                severity: 'success',
                summary: 'Éxito',
                detail: `${imeisDanadosSeleccionados.value.length} producto(s) pasado(s) a dañados`,
                life: 3000
            });

            visiblePasarDanados.value = false;
            await fetchAndSetupData();

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
        // Para otros tipos de productos
        if (cantidadPasarDanados.value <= 0 || cantidadPasarDanados.value > productoSeleccionado.value.stock) {
            toast.add({
                severity: 'error',
                summary: 'Error',
                detail: `La cantidad debe ser entre 1 y ${productoSeleccionado.value.stock}`,
                life: 3000
            });
            return;
        }

        loading.value = true;

        try {
            // Registrar en productos_danados
            const datos = {
                codigo_producto: productoSeleccionado.value.codigo || productoSeleccionado.value.codigo_barra,
                nombre_producto: productoSeleccionado.value.nombre,
                cantidad: cantidadPasarDanados.value,
                motivo_baja: motivoDanado.value,
                descripcion_dano: descripcionDanado.value,
                estado: 'Dado de baja',
                fecha: nfecha('fecha'),
                hora: nfecha('hora'),
                usuario: datosEmpresa.usuario.nombre,
                created_at: nfecha('timestamp'),
                updated_at: nfecha('timestamp')
            };

            await peticionesFetchOffline('insertData', 'productos_danados', JSON.stringify(datos));

            // Reducir stock del producto
            productoSeleccionado.value.stock = Number(productoSeleccionado.value.stock) - cantidadPasarDanados.value;
            productoSeleccionado.value.updated_at = nfecha('timestamp');
            await peticionesFetchOffline('updateData', 'productos', JSON.stringify(productoSeleccionado.value));

            toast.add({
                severity: 'success',
                summary: 'Éxito',
                detail: `${cantidadPasarDanados.value} producto(s) pasado(s) a dañados`,
                life: 3000
            });

            visiblePasarDanados.value = false;
            await fetchAndSetupData();

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

/************************************************************************/
// Funciones para Pasar a Uso Interno
/************************************************************************/
const fnAbrirDialogoUsoInterno = (producto) => {
    productoSeleccionadoUsoInterno.value = producto;
    visibleProductosUsoInterno.value = true;
};

/************************************************************************/
// Función para generar venta en cero
/************************************************************************/
const fnGenerarVentaCero = async (producto) => {
  const tokensValidos = [token.value, tokenCorto.value];

  // Validar contraseña
  const { value: password } = await Swal.fire({
    title: 'Autenticación',
    input: 'password',
    inputLabel: 'Introduce la contraseña',
    inputPlaceholder: 'Contraseña',
    inputAttributes: {
      autocapitalize: 'off',
      autocorrect: 'off'
    },
    showCancelButton: true,
    confirmButtonText: 'Verificar',
    cancelButtonText: 'Cancelar'
  });

  if (!tokensValidos.includes(password)) {
    Swal.fire('Error', 'Contraseña incorrecta', 'error');
    return;
  }

  // Verificar si es CELULARES o ELECTRODOMESTICOS
  const tieneIMEI = producto.categoria === 'CELULARES' || producto.categoria === 'ELECTRODOMESTICOS';
  let imeisSeleccionados = [];

  if (tieneIMEI) {
    try {
      const imeisDisponibles = await peticionesFetchOffline('getDataArrayByTwoConditions', 'imei', 'id_equi', producto.id, 'estado', 'DISPONIBLE');

      if (imeisDisponibles.length === 0) {
        Swal.fire('Sin IMEI/Seriales', 'Este producto no tiene IMEI/Seriales disponibles', 'warning');
        return;
      }

      // Seleccionar IMEIs
      const imeisHTML = imeisDisponibles.map((imei, index) => `
        <div style="text-align: left; padding: 8px; border-bottom: 1px solid #e5e7eb;">
          <label style="cursor: pointer; display: flex; align-items: center; gap: 8px;">
            <input type="checkbox" value="${index}" class="imei-checkbox" style="width: 16px; height: 16px;">
            <span style="font-family: monospace; background: #f3f4f6; padding: 4px 8px; border-radius: 4px;">
              ${imei.imei}
            </span>
          </label>
        </div>
      `).join('');

      const { value: seleccion } = await Swal.fire({
        title: 'Seleccionar IMEI/Seriales para Venta',
        html: `
          <div style="margin-bottom: 16px;">
            <p class="text-sm text-gray-600">Seleccione los IMEI/Seriales para la venta en cero:</p>
          </div>
          <div style="max-height: 300px; overflow-y: auto; border: 1px solid #e5e7eb; border-radius: 8px; padding: 8px;">
            ${imeisHTML}
          </div>
          <div style="margin-top: 16px; display: flex; gap: 8px; justify-content: center;">
            <button id="selectAll" class="swal2-styled" style="background-color: #3b82f6;">Seleccionar Todos</button>
            <button id="deselectAll" class="swal2-styled" style="background-color: #6b7280;">Deseleccionar Todos</button>
          </div>
        `,
        showCancelButton: true,
        confirmButtonText: 'Continuar',
        cancelButtonText: 'Cancelar',
        didOpen: () => {
          document.getElementById('selectAll').addEventListener('click', (e) => {
            e.preventDefault();
            document.querySelectorAll('.imei-checkbox').forEach(cb => cb.checked = true);
          });
          document.getElementById('deselectAll').addEventListener('click', (e) => {
            e.preventDefault();
            document.querySelectorAll('.imei-checkbox').forEach(cb => cb.checked = false);
          });
        },
        preConfirm: () => {
          const checkboxes = document.querySelectorAll('.imei-checkbox:checked');
          if (checkboxes.length === 0) {
            Swal.showValidationMessage('Debe seleccionar al menos un IMEI/Serial');
            return false;
          }
          return Array.from(checkboxes).map(cb => parseInt(cb.value));
        }
      });

      if (!seleccion) return;

      imeisSeleccionados = seleccion.map(index => imeisDisponibles[index]);
    } catch (error) {
      console.error('Error al cargar IMEIs:', error);
      Swal.fire('Error', 'No se pudieron cargar los IMEI/Seriales', 'error');
      return;
    }
  } else {
    // Para productos sin IMEI, preguntar la cantidad
    const { value: cantidad } = await Swal.fire({
      title: `Generar Venta en Cero: ${producto.nombre}`,
      text: `Stock disponible: ${producto.stock}`,
      input: 'number',
      inputLabel: '¿Cuántas unidades?',
      inputPlaceholder: 'Cantidad',
      inputAttributes: {
        min: 1,
        max: producto.stock,
        step: 1
      },
      inputValue: 1,
      showCancelButton: true,
      confirmButtonText: 'Continuar',
      cancelButtonText: 'Cancelar',
      inputValidator: (value) => {
        const cant = Number(value);
        if (!value || cant <= 0) {
          return 'Debe ingresar una cantidad válida';
        }
        if (cant > producto.stock) {
          return `La cantidad no puede ser mayor al stock disponible (${producto.stock})`;
        }
      }
    });

    if (!cantidad) return;

    // Guardar la cantidad en un array para procesar después
    imeisSeleccionados = [{ cantidad: Number(cantidad) }];
  }

  // Pedir motivo
  const { value: motivo } = await Swal.fire({
    title: 'Motivo de la Venta en Cero',
    input: 'textarea',
    inputLabel: 'Describe el motivo de esta venta sin costo',
    inputPlaceholder: 'Ej: Garantía, Promoción, Donación, etc.',
    showCancelButton: true,
    confirmButtonText: 'Generar Factura',
    cancelButtonText: 'Cancelar',
    inputValidator: (value) => {
      if (!value) {
        return 'Debe ingresar un motivo';
      }
    }
  });

  if (!motivo) return;

  // Generar factura
  loading.value = true;

  try {
    // Obtener último número de factura
    const facturas = await peticionesFetchOffline('getDataAsArray', 'facturas');
    const ultimaFactura = facturas.length > 0 ? Math.max(...facturas.map(f => parseInt(f.no_factura) || 0)) : 0;
    const noFactura = (ultimaFactura + 1).toString().padStart(8, '0');

    const cantidad = tieneIMEI ? imeisSeleccionados.length : imeisSeleccionados[0].cantidad;

    // Crear producto con precio en cero
    const productoParaFactura = {
      ...producto,
      cantidad: cantidad,
      precio_venta: 0,
      precio_final: 0,
      impuestos: 0,
      impuesto_venta: 0,
      descuento: 0,
      total: 0
    };

    // Si tiene IMEIs, agregarlos
    if (tieneIMEI && imeisSeleccionados.length > 0) {
      productoParaFactura.lista_imei = imeisSeleccionados.map(i => i.imei);
    }

    // Cliente genérico
    const clienteGenerico = {
      cedula: '000-0000000-0',
      nombre: 'VENTA SIN COSTO',
      telefono: '',
      direccion: '',
      email: ''
    };

    // Construir objeto de factura
    const datosFN = {
      nofactura: noFactura,
      cliente: clienteGenerico,
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
      nota: `VENTA SIN COSTO - ${motivo}`,
      almacen: datosEmpresa.empresa.nombre,
      productosArray: [productoParaFactura]
    };

    const url = `${link.value}${api.value}/insertar/facturas`;
    const retorno = await facturaNueva(url, datosFN, 'POST', tokenCifrado.value);

    if (retorno[0] === 'ok') {
      // Si tiene IMEI, actualizar estado de los IMEI a En Taller y actualizar stock
      if (tieneIMEI && imeisSeleccionados.length > 0) {
        for (const imeiData of imeisSeleccionados) {
          imeiData.estado = 'En Taller';
          imeiData.updated_at = nfecha('timestamp');
          await peticionesFetchOffline('updateData', 'imei', JSON.stringify(imeiData));
        }

        // Actualizar stock del producto basándose en IMEIs disponibles restantes
        const imeisRestantes = await peticionesFetchOffline('getDataArrayByTwoConditions', 'imei', 'id_equi', producto.id, 'estado', 'DISPONIBLE');
        producto.stock = imeisRestantes.length;
        producto.updated_at = nfecha('timestamp');
        await peticionesFetchOffline('updateData', 'productos', JSON.stringify(producto));
      } else {
        // Para productos sin IMEI, reducir el stock
        producto.stock = Number(producto.stock) - cantidad;
        producto.updated_at = nfecha('timestamp');
        await peticionesFetchOffline('updateData', 'productos', JSON.stringify(producto));
      }

      await Swal.fire({
        icon: 'success',
        title: 'Factura Generada!',
        html: `
          <p>Venta en cero generada exitosamente</p>
          <p class="text-lg font-bold mt-2">Factura #${noFactura}</p>
          <p class="text-sm text-gray-600 mt-2">Producto: ${producto.nombre}</p>
          <p class="text-sm text-gray-600">Cantidad: ${cantidad}</p>
          <p class="text-sm text-gray-600">Total: $0.00</p>
          ${tieneIMEI ? `<p class="text-sm text-gray-600">IMEIs vendidos: ${imeisSeleccionados.length}</p>` : ''}
          <p class="text-sm text-gray-600">Stock restante: ${producto.stock}</p>
        `,
        confirmButtonText: 'Aceptar'
      });

      // Buscar la factura recién creada
      const datosFactura = await peticionesFetchOffline('getDataByField', 'facturas', 'no_factura', noFactura);

      if (datosFactura && facturaPdfPrintRef.value) {
        // Imprimir usando el componente FacturaPdfPrint
        await facturaPdfPrintRef.value.printFactura({
          factura: datosFactura,
          cliente: clienteGenerico,
          datosEmpresa: {
            empresa: datosEmpresa.empresa,
            usuario: datosEmpresa.usuario
          },
          creditoData: null
        });
      }

      // Recargar datos
      await fetchAndSetupData();
    } else {
      throw new Error('Error al generar factura');
    }
  } catch (error) {
    console.error('Error al generar venta en cero:', error);
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: 'No se pudo generar la venta en cero',
      confirmButtonText: 'Aceptar'
    });
  } finally {
    loading.value = false;
  }
};

/************************************************************************/
// Función para pasar UN producto individual de almacén (desde menú contextual)
/************************************************************************/
const fnPasarDeAlmacenIndividual = async (producto) => {
  const tokensValidos = [token.value, tokenCorto.value]

  // Validar contraseña
  const { value: password } = await Swal.fire({
    title: 'Autenticación',
    input: 'password',
    inputLabel: 'Introduce la contraseña',
    inputPlaceholder: 'Contraseña',
    inputAttributes: {
      autocapitalize: 'off',
      autocorrect: 'off'
    },
    showCancelButton: true,
    confirmButtonText: 'Verificar',
    cancelButtonText: 'Cancelar'
  })

  if (!tokensValidos.includes(password)) {
    Swal.fire('Error', 'Contraseña incorrecta', 'error')
    return
  }

  // Verificar si es CELULARES o ELECTRODOMESTICOS
  const tieneIMEI = producto.categoria === 'CELULARES' || producto.categoria === 'ELECTRODOMESTICOS'
  let imeisDisponibles = []

  if (tieneIMEI) {
    // Cargar IMEIs disponibles
    try {
      imeisDisponibles = await peticionesFetchOffline('getDataArrayByTwoConditions', 'imei', 'id_equi', producto.id, 'estado', 'DISPONIBLE')
      const almacenOrigen = `${producto.almacen ?? ''}`.trim().toUpperCase()
      imeisDisponibles = (Array.isArray(imeisDisponibles) ? imeisDisponibles : []).filter(
        imei => `${imei.almacen ?? ''}`.trim().toUpperCase() === almacenOrigen
      )

      if (imeisDisponibles.length === 0) {
        Swal.fire('Sin IMEI/Seriales', 'Este producto no tiene IMEI/Seriales disponibles para transferir', 'warning')
        return
      }
    } catch (error) {
      console.error('Error al cargar IMEIs:', error)
      Swal.fire('Error', 'No se pudieron cargar los IMEI/Seriales', 'error')
      return
    }
  }

  // Seleccionar empresa destino
  const empresasA = empresaData.value
  const { value: empresaSeleccionada } = await Swal.fire({
    title: 'Selecciona el almacén destino',
    input: 'select',
    inputOptions: empresasA.reduce((acc, emp) => {
      acc[emp.nombre] = emp.nombre
      return acc
    }, {}),
    inputPlaceholder: 'Seleccione un almacén',
    showCancelButton: true,
    confirmButtonText: 'Continuar',
    cancelButtonText: 'Cancelar'
  })

  if (!empresaSeleccionada) return

  // Preguntar si desea transferir todo o parcial
  const stockInfo = tieneIMEI
    ? `${imeisDisponibles.length} unidades (con IMEI/Serial)`
    : `${producto.stock} unidades`

  const { value: tipoTransferencia } = await Swal.fire({
    title: 'Tipo de transferencia',
    html: `
      <p><strong>${producto.nombre}</strong></p>
      <p class="text-sm text-gray-600">Stock disponible: ${stockInfo}</p>
      <p class="mt-3">Desea transferir todo el stock o solo una parte</p>
    `,
    icon: 'question',
    showCancelButton: true,
    showDenyButton: true,
    confirmButtonText: 'Transferencia Total',
    denyButtonText: 'Transferencia Parcial',
    cancelButtonText: 'Cancelar',
    confirmButtonColor: '#3085d6',
    denyButtonColor: '#f59e0b'
  })

  if (!tipoTransferencia && tipoTransferencia !== false) return // Usuario cancel?

  loading.value = true

  try {
    if (tieneIMEI) {
      // ============================================================
      // LÓGICA PARA PRODUCTOS CON IMEI (CELULARES/ELECTRODOMESTICOS)
      // ============================================================
      let imeisSeleccionados = []

      if (tipoTransferencia) {
        // TRANSFERENCIA TOTAL - Todos los IMEIs
        imeisSeleccionados = [...imeisDisponibles]
      } else {
        // TRANSFERENCIA PARCIAL - Seleccionar IMEIs específicos
        const imeisHTML = imeisDisponibles.map((imei, index) => `
          <div style="text-align: left; padding: 8px; border-bottom: 1px solid #e5e7eb;">
            <label style="cursor: pointer; display: flex; align-items: center; gap: 8px;">
              <input type="checkbox" value="${index}" class="imei-checkbox" style="width: 16px; height: 16px;">
              <span style="font-family: monospace; background: #f3f4f6; padding: 4px 8px; border-radius: 4px;">
                ${imei.imei}
              </span>
            </label>
          </div>
        `).join('')

        const { value: seleccion } = await Swal.fire({
          title: 'Seleccionar IMEI/Seriales',
          html: `
            <div style="margin-bottom: 16px;">
              <p class="text-sm text-gray-600">Seleccione los IMEI/Seriales que desea transferir:</p>
            </div>
            <div style="max-height: 300px; overflow-y: auto; border: 1px solid #e5e7eb; border-radius: 8px; padding: 8px;">
              ${imeisHTML}
            </div>
            <div style="margin-top: 16px; display: flex; gap: 8px; justify-content: center;">
              <button id="selectAll" class="swal2-styled" style="background-color: #3b82f6;">Seleccionar Todos</button>
              <button id="deselectAll" class="swal2-styled" style="background-color: #6b7280;">Deseleccionar Todos</button>
            </div>
          `,
          showCancelButton: true,
          confirmButtonText: 'Transferir Seleccionados',
          cancelButtonText: 'Cancelar',
          didOpen: () => {
            document.getElementById('selectAll').addEventListener('click', (e) => {
              e.preventDefault()
              document.querySelectorAll('.imei-checkbox').forEach(cb => cb.checked = true)
            })
            document.getElementById('deselectAll').addEventListener('click', (e) => {
              e.preventDefault()
              document.querySelectorAll('.imei-checkbox').forEach(cb => cb.checked = false)
            })
          },
          preConfirm: () => {
            const checkboxes = document.querySelectorAll('.imei-checkbox:checked')
            if (checkboxes.length === 0) {
              Swal.showValidationMessage('Debe seleccionar al menos un IMEI/Serial')
              return false
            }
            return Array.from(checkboxes).map(cb => parseInt(cb.value))
          }
        })

        if (!seleccion) {
          loading.value = false
          return
        }

        imeisSeleccionados = seleccion.map(index => imeisDisponibles[index])
      }

      // Generar nuevos códigos para el producto duplicado
      const timestampSufijo = Date.now().toString().slice(-6)
      const normalizar = valor => `${valor ?? ''}`.trim().toUpperCase()
      const productosYaEnDestino = await peticionesFetchOffline('getDataAsArray', 'productos', '')
      const equivalentesDestino = (Array.isArray(productosYaEnDestino) ? productosYaEnDestino : []).filter(
        p =>
          normalizar(p.almacen) === normalizar(empresaSeleccionada) &&
          normalizar(p.nombre) === normalizar(producto.nombre) &&
          normalizar(p.categoria) === normalizar(producto.categoria)
      )
      if (equivalentesDestino.length > 1) {
        throw new Error(`Hay ${equivalentesDestino.length} productos equivalentes en el almacén destino`)
      }
      const productoExistenteDestino = equivalentesDestino[0]
      const nuevoCodigo = productoExistenteDestino?.codigo || `${producto.codigo}-T${timestampSufijo}`
      const nuevoCodigoBarra = productoExistenteDestino?.codigo_barra || `${producto.codigo_barra || producto.codigo}-T${timestampSufijo}`

      // Crear producto duplicado en el almacén destino
      const productoDuplicado = {
        ...producto,
        codigo: nuevoCodigo,
        codigo_barra: nuevoCodigoBarra,
        stock: imeisSeleccionados.length,
        almacen: empresaSeleccionada,
        created_at: nfecha('timestamp'),
        updated_at: nfecha('timestamp')
      }

      delete productoDuplicado.id
      delete productoDuplicado.otro

      const resultadoInsercion = productoExistenteDestino
        ? ['ok']
        : await peticionesFetchOffline('insertData', 'productos', JSON.stringify(productoDuplicado))

      if (resultadoInsercion[0] === 'ok') {
        // Obtener el ID del nuevo producto
        const productosDestino = await peticionesFetchOffline('getDataAsArray', 'productos', '')
        const nuevoProducto = productosDestino.find(p => p.codigo === nuevoCodigo)

        if (nuevoProducto) {
          // Actualizar los IMEIs seleccionados
          for (const imeiData of imeisSeleccionados) {
            imeiData.id_equi = nuevoProducto.id
            imeiData.almacen = empresaSeleccionada  // Cambiar el almacén del IMEI
            imeiData.updated_at = nfecha('timestamp')
            await peticionesFetchOffline('updateData', 'imei', JSON.stringify(imeiData))
          }

          // Actualizar stock del producto original
          await sincronizarStockProductoPorImeiDisponible(producto.id)
          await sincronizarStockProductoPorImeiDisponible(nuevoProducto.id)
          const productoOrigenActualizado = await peticionesFetchOffline('getDataByField', 'productos', 'id', producto.id)
          producto.stock = Number(productoOrigenActualizado?.stock || 0)

          Swal.fire({
            icon: 'success',
            title: '¡Transferencia Exitosa!',
            html: `
              <p><strong>${imeisSeleccionados.length}</strong> unidad(es) con IMEI de</p>
              <p><strong>"${producto.nombre}"</strong> transferidas a <strong>${empresaSeleccionada}</strong></p>
              <div class="mt-3 p-3 bg-blue-50 rounded text-sm text-left">
                <p class="font-semibold mb-1">Detalles de la transferencia:</p>
                <p>? Código nuevo: <code class="bg-white px-2 py-1 rounded">${nuevoCodigo}</code></p>
                <p>? IMEIs transferidos: ${imeisSeleccionados.length}</p>
                <p>? Stock restante en origen: ${producto.stock} unidades</p>
                <div class="mt-2 max-h-32 overflow-y-auto bg-gray-50 p-2 rounded">
                  <p class="font-semibold text-xs mb-1">IMEIs transferidos:</p>
                  ${imeisSeleccionados.map(imei => `<p class="text-xs font-mono">â€¢ ${imei.imei}</p>`).join('')}
                </div>
              </div>
            `,
            confirmButtonText: 'Aceptar',
            width: '600px'
          })
        }
      }

    } else {
      // ============================================================
      // LÓGICA PARA PRODUCTOS SIN IMEI (PRODUCTOS REGULARES)
      // ============================================================
      if (tipoTransferencia) {
        // TRANSFERENCIA TOTAL
        producto.almacen = empresaSeleccionada
        producto.updated_at = nfecha('timestamp')
        delete producto.otro
        await peticionesFetchOffline('updateData', 'productos', JSON.stringify(producto))

        toast.add({
          severity: 'success',
          summary: 'Transferencia Completa',
          detail: `"${producto.nombre}" transferido completamente a ${empresaSeleccionada}`,
          life: 5000
        })

      } else {
        // TRANSFERENCIA PARCIAL
        if (producto.stock <= 0) {
          toast.add({
            severity: 'error',
            summary: 'Sin Stock',
            detail: `${producto.nombre} no tiene stock disponible`,
            life: 3000
          })
          loading.value = false
          return
        }

        const { value: cantidadTransferir } = await Swal.fire({
          title: `Transferir: ${producto.nombre}`,
          text: `Stock actual: ${producto.stock} unidades`,
          input: 'number',
          inputLabel: '¿Cuántas unidades desea transferir?',
          inputPlaceholder: 'Cantidad',
          inputAttributes: {
            min: 1,
            max: producto.stock,
            step: 1
          },
          inputValue: Math.min(1, producto.stock),
          showCancelButton: true,
          confirmButtonText: 'Transferir',
          cancelButtonText: 'Cancelar',
          inputValidator: (value) => {
            const cantidad = Number(value)
            if (!value || cantidad <= 0) {
              return 'Debe ingresar una cantidad válida'
            }
            if (cantidad > producto.stock) {
              return `La cantidad no puede ser mayor al stock disponible (${producto.stock})`
            }
          }
        })

        if (!cantidadTransferir) {
          loading.value = false
          return
        }

        const cantidad = Number(cantidadTransferir)
        const timestampSufijo = Date.now().toString().slice(-6)
        const nuevoCodigo = `${producto.codigo}-T${timestampSufijo}`
        const nuevoCodigoBarra = `${producto.codigo_barra || producto.codigo}-T${timestampSufijo}`

        const productoDuplicado = {
          ...producto,
          codigo: nuevoCodigo,
          codigo_barra: nuevoCodigoBarra,
          stock: cantidad,
          almacen: empresaSeleccionada,
          created_at: nfecha('timestamp'),
          updated_at: nfecha('timestamp')
        }

        delete productoDuplicado.id
        delete productoDuplicado.otro

        const resultadoInsercion = await peticionesFetchOffline('insertData', 'productos', JSON.stringify(productoDuplicado))

        if (resultadoInsercion[0] === 'ok') {
          producto.stock = Number(producto.stock) - cantidad
          producto.updated_at = nfecha('timestamp')
          delete producto.otro
          await peticionesFetchOffline('updateData', 'productos', JSON.stringify(producto))

          Swal.fire({
            icon: 'success',
            title: '¡Transferencia Exitosa!',
            html: `
              <p><strong>${cantidad}</strong> unidad(es) de <strong>"${producto.nombre}"</strong></p>
              <p>transferidas a <strong>${empresaSeleccionada}</strong></p>
              <div class="mt-3 p-3 bg-blue-50 rounded text-sm text-left">
                <p class="font-semibold mb-1">Detalles de la transferencia:</p>
                <p>? Código nuevo: <code class="bg-white px-2 py-1 rounded">${nuevoCodigo}</code></p>
                <p>? Stock transferido: ${cantidad} unidades</p>
                <p>? Stock restante en origen: ${producto.stock} unidades</p>
              </div>
            `,
            confirmButtonText: 'Aceptar'
          })
        }
      }
    }

    await fetchAndSetupData()

  } catch (error) {
    console.error('Error en transferencia:', error)
    Swal.fire('Error', 'Ocurri? un error durante la transferencia', 'error')
  } finally {
    loading.value = false
  }
}

/************************************************************************/
const fnPasarDeAlmacen = async () => {
  const productosSeleccionados = selectedItems.value
  const tokensValidos = [token.value, tokenCorto.value]

  if (!productosSeleccionados.length) {
    Swal.fire('Atención', 'No hay productos seleccionados', 'warning')
    return
  }

  // Validar contraseña
  const { value: password } = await Swal.fire({
    title: 'Autenticación',
    input: 'password',
    inputLabel: 'Introduce la contraseña',
    inputPlaceholder: 'Contraseña',
    inputAttributes: {
      autocapitalize: 'off',
      autocorrect: 'off'
    },
    showCancelButton: true,
    confirmButtonText: 'Verificar',
    cancelButtonText: 'Cancelar'
  })

  if (!tokensValidos.includes(password)) {
    Swal.fire('Error', 'Contraseña incorrecta', 'error')
    return
  }

  // Seleccionar empresa destino
  const empresasA = empresaData.value
  const { value: empresaSeleccionada } = await Swal.fire({
    title: 'Selecciona el almacén destino',
    input: 'select',
    inputOptions: empresasA.reduce((acc, emp) => {
      acc[emp.nombre] = emp.nombre
      return acc
    }, {}),
    inputPlaceholder: 'Seleccione un almacén',
    showCancelButton: true,
    confirmButtonText: 'Continuar',
    cancelButtonText: 'Cancelar'
  })

  if (!empresaSeleccionada) return

  // Preguntar si desea transferir todo o parcial
  const { value: tipoTransferencia } = await Swal.fire({
    title: 'Tipo de transferencia',
    text: `?Desea transferir todo el stock o solo una cantidad específica?`,
    icon: 'question',
    showCancelButton: true,
    showDenyButton: true,
    confirmButtonText: 'Transferencia Total',
    denyButtonText: 'Transferencia Parcial',
    cancelButtonText: 'Cancelar',
    confirmButtonColor: '#3085d6',
    denyButtonColor: '#f59e0b'
  })

  if (!tipoTransferencia && tipoTransferencia !== false) return // Usuario cancel?

  loading.value = true

  try {
    let productosTransferidos = 0

    if (tipoTransferencia) {
      // TRANSFERENCIA TOTAL - Mover todo el producto
      for (let producto of productosSeleccionados) {
        producto.almacen = empresaSeleccionada
        producto.updated_at = nfecha('timestamp')

        delete producto.otro

        await peticionesFetchOffline('updateData', 'productos', JSON.stringify(producto))

        // Si es CELULARES o ELECTRODOMESTICOS, actualizar también los IMEI
        const tieneIMEI = producto.categoria === 'CELULARES' || producto.categoria === 'ELECTRODOMESTICOS'
        if (tieneIMEI) {
          const imeisDelProducto = await peticionesFetchOffline('getDataArrayByCondition', 'imei', 'id_equi', producto.id)
          for (const imeiData of imeisDelProducto) {
            imeiData.almacen = empresaSeleccionada
            imeiData.updated_at = nfecha('timestamp')
            await peticionesFetchOffline('updateData', 'imei', JSON.stringify(imeiData))
          }
        }

        productosTransferidos++
      }

      toast.add({
        severity: 'success',
        summary: 'Transferencia Completa',
        detail: `${productosTransferidos} producto(s) transferido(s) completamente a ${empresaSeleccionada}`,
        life: 5000
      })

    } else {
      // TRANSFERENCIA PARCIAL - Duplicar productos
      for (let productoOriginal of productosSeleccionados) {
        // Verificar si tiene IMEI (no se permite transferencia parcial de productos con IMEI)
        const tieneIMEI = productoOriginal.categoria === 'CELULARES' || productoOriginal.categoria === 'ELECTRODOMESTICOS'
        if (tieneIMEI) {
          toast.add({
            severity: 'warn',
            summary: 'Producto con IMEI',
            detail: `${productoOriginal.nombre} tiene IMEI/Seriales. Use transferencia total o transferencia individual para seleccionar IMEI específicos`,
            life: 5000
          })
          continue
        }

        // Verificar que tenga stock disponible
        if (productoOriginal.stock <= 0) {
          toast.add({
            severity: 'warn',
            summary: 'Sin Stock',
            detail: `${productoOriginal.nombre} no tiene stock disponible`,
            life: 3000
          })
          continue
        }

        // Preguntar la cantidad a transferir
        const { value: cantidadTransferir } = await Swal.fire({
          title: `${productoOriginal.nombre}`,
          text: `Stock actual: ${productoOriginal.stock}`,
          input: 'number',
          inputLabel: '¿Cuántas unidades desea transferir?',
          inputPlaceholder: 'Cantidad',
          inputAttributes: {
            min: 1,
            max: productoOriginal.stock,
            step: 1
          },
          inputValue: 1,
          showCancelButton: true,
          confirmButtonText: 'Transferir',
          cancelButtonText: 'Omitir',
          inputValidator: (value) => {
            const cantidad = Number(value)
            if (!value || cantidad <= 0) {
              return 'Debe ingresar una cantidad válida'
            }
            if (cantidad > productoOriginal.stock) {
              return `La cantidad no puede ser mayor al stock disponible (${productoOriginal.stock})`
            }
          }
        })

        if (!cantidadTransferir) continue // Usuario omiti? este producto

        const cantidad = Number(cantidadTransferir)

        // Generar nuevos códigos para el producto duplicado
        const timestampSufijo = Date.now().toString().slice(-6)
        const nuevoCodigo = `${productoOriginal.codigo}-T${timestampSufijo}`
        const nuevoCodigoBarra = `${productoOriginal.codigo_barra || productoOriginal.codigo}-T${timestampSufijo}`

        // Crear producto duplicado para el almacén destino
        const productoDuplicado = {
          ...productoOriginal,
          codigo: nuevoCodigo,
          codigo_barra: nuevoCodigoBarra,
          stock: cantidad,
          almacen: empresaSeleccionada,
          created_at: nfecha('timestamp'),
          updated_at: nfecha('timestamp')
        }

        // Eliminar campos que no deben duplicarse
        delete productoDuplicado.id
        delete productoDuplicado.otro

        // Insertar producto duplicado en el almacén destino
        const resultadoInsercion = await peticionesFetchOffline('insertData', 'productos', JSON.stringify(productoDuplicado))

        if (resultadoInsercion[0] === 'ok') {
          // Reducir stock del producto original
          productoOriginal.stock = Number(productoOriginal.stock) - cantidad
          productoOriginal.updated_at = nfecha('timestamp')

          delete productoOriginal.otro

          await peticionesFetchOffline('updateData', 'productos', JSON.stringify(productoOriginal))

          productosTransferidos++

          toast.add({
            severity: 'success',
            summary: 'Transferido',
            detail: `${cantidad} unidad(es) de "${productoOriginal.nombre}" transferidas a ${empresaSeleccionada}`,
            life: 4000
          })
        }
      }

      if (productosTransferidos > 0) {
        Swal.fire({
          icon: 'success',
          title: '¡Transferencia Exitosa!',
          html: `
            <p><strong>${productosTransferidos}</strong> producto(s) transferido(s) a <strong>${empresaSeleccionada}</strong></p>
            <p class="text-sm text-gray-600 mt-2">Los productos se duplicaron con nuevos códigos y el stock original se redujo.</p>
          `,
          confirmButtonText: 'Aceptar'
        })
      }
    }

    // Recargar datos
    await fetchAndSetupData()
    selectedItems.value = []

  } catch (error) {
    console.error('Error en transferencia:', error)
    Swal.fire('Error', 'Ocurri? un error durante la transferencia', 'error')
  } finally {
    loading.value = false
  }
}

/************************************************************************/
const exportToExcel = async () => {
  let filteredData = [];

  const responseAll = await peticionesFetchOffline('getDataAsArray', 'productos');
  if (Array.isArray(responseAll) && responseAll.length > 0) {
    const searchLower = (searchQuery.value || '').toLowerCase().trim();
    const categoryFilter = selectedCategory.value && selectedCategory.value !== 'all' ? selectedCategory.value : '';
    const almacenFilter = almacenes.value && almacenes.value !== 'TODOS' ? almacenes.value : '';
    
    filteredData = responseAll.filter(p => {
      const matchSearch = !searchLower || 
        (p.nombre || '').toLowerCase().includes(searchLower) ||
        (p.codigo || '').toLowerCase().includes(searchLower) ||
        (p.codigo_barra || '').toLowerCase().includes(searchLower) ||
        (p.categoria || '').toLowerCase().includes(searchLower);
      
      const matchCategory = !categoryFilter || (p.categoria || '') === categoryFilter;
      const matchAlmacen = !almacenFilter || (p.almacen || '') === almacenFilter;
      
      if (selectedFilter.value === 'ConStock') {
        return matchSearch && matchCategory && matchAlmacen && Number(p.stock || 0) > 0;
      } else if (selectedFilter.value === 'SinStock') {
        return matchSearch && matchCategory && matchAlmacen && Number(p.stock || 0) <= 0;
      }
      return matchSearch && matchCategory && matchAlmacen;
    });
  }

  const worksheet = XLSX.utils.json_to_sheet(filteredData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Productos");
  XLSX.writeFile(workbook, "Productos.xlsx");
};
/************************************************************************/
const generarPdfInventarioEmbed = async () => {
  try {
    let data = [];

    const responseAll = await peticionesFetchOffline('getDataAsArray', 'productos');
    if (Array.isArray(responseAll) && responseAll.length > 0) {
      const searchLower = (searchQuery.value || '').toLowerCase().trim();
      const categoryFilter = selectedCategory.value && selectedCategory.value !== 'all' ? selectedCategory.value : '';
      const almacenFilter = almacenes.value && almacenes.value !== 'TODOS' ? almacenes.value : '';
      
      data = responseAll.filter(p => {
        const matchSearch = !searchLower || 
          (p.nombre || '').toLowerCase().includes(searchLower) ||
          (p.codigo || '').toLowerCase().includes(searchLower) ||
          (p.codigo_barra || '').toLowerCase().includes(searchLower) ||
          (p.categoria || '').toLowerCase().includes(searchLower);
        
        const matchCategory = !categoryFilter || (p.categoria || '') === categoryFilter;
        const matchAlmacen = !almacenFilter || (p.almacen || '') === almacenFilter;
        
        if (selectedFilter.value === 'ConStock') {
          return matchSearch && matchCategory && matchAlmacen && Number(p.stock || 0) > 0;
        } else if (selectedFilter.value === 'SinStock') {
          return matchSearch && matchCategory && matchAlmacen && Number(p.stock || 0) <= 0;
        }
        return matchSearch && matchCategory && matchAlmacen;
      });
    }

    if (!data.length) {
      await Swal.fire('Inventario vacio', 'No hay productos para generar el PDF.', 'info');
      return;
    }

    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    const fecha = new Date().toLocaleString('es-DO', { dateStyle: 'medium', timeStyle: 'short' });

    const totalItems = data.length;
    const totalStock = data.reduce((sum, p) => sum + Number(p.stock || 0), 0);
    const valorInventario = data.reduce((sum, p) => sum + (Number(p.stock || 0) * Number(p.precio_compra || 0)), 0);

    doc.setFillColor(17, 24, 39);
    doc.rect(0, 0, 297, 24, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(15);
    doc.text('Reporte Profesional de Inventario', 14, 10);
    doc.setFontSize(9);
    doc.text(`Generado: ${fecha}`, 14, 16);
    doc.text(`Total productos: ${totalItems} | Stock total: ${totalStock} | Valor: RD$ ${valorInventario.toFixed(2)}`, 14, 21);

    doc.setTextColor(17, 24, 39);

    autoTable(doc, {
      startY: 30,
      head: [['Codigo', 'Producto', 'Categoria', 'Stock', 'P. Compra', 'P. Venta', 'Valor Stock']],
      body: data.map((p) => {
        const stock = Number(p.stock || 0);
        const precioCompra = Number(p.precio_compra || 0);
        const precioVenta = Number(p.precio_venta || 0);
        return [
          p.codigo || p.codigo_barra || '',
          p.nombre || '',
          p.categoria || '',
          stock.toFixed(0),
          precioCompra.toFixed(2),
          precioVenta.toFixed(2),
          (stock * precioCompra).toFixed(2)
        ];
      }),
      theme: 'grid',
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [31, 41, 55], textColor: [255, 255, 255], fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      columnStyles: {
        0: { cellWidth: 28 },
        1: { cellWidth: 75 },
        2: { cellWidth: 35 },
        3: { halign: 'right', cellWidth: 18 },
        4: { halign: 'right', cellWidth: 26 },
        5: { halign: 'right', cellWidth: 26 },
        6: { halign: 'right', cellWidth: 30 }
      },
      didDrawPage: (hookData) => {
        const pageHeight = doc.internal.pageSize.getHeight();
        doc.setFontSize(8);
        doc.setTextColor(100);
        doc.text(
          `Pagina ${doc.getCurrentPageInfo().pageNumber}`,
          hookData.settings.margin.left,
          pageHeight - 6
        );
      }
    });

    const pdfBlob = doc.output('blob');
    const pdfUrl = URL.createObjectURL(pdfBlob);
    const nombreArchivo = `inventario_${new Date().toISOString().slice(0, 10)}.pdf`;

    const result = await Swal.fire({
      title: 'Vista previa de Inventario',
      width: '94vw',
      html: `
        <div style="text-align:left;margin-bottom:10px;padding:10px;border-radius:10px;background:linear-gradient(135deg,#0f172a,#1e293b);color:#fff;">
          <div style="font-size:14px;font-weight:700;">Reporte de inventario listo</div>
          <div style="font-size:12px;opacity:.9;">Visualice el PDF y descárguelo cuando confirme.</div>
        </div>
        <iframe src="${pdfUrl}" style="width:100%;height:72vh;border:1px solid #e5e7eb;border-radius:12px;background:#fff;"></iframe>
      `,
      showCancelButton: true,
      confirmButtonText: 'Descargar PDF',
      cancelButtonText: 'Cerrar',
      confirmButtonColor: '#0f766e',
      cancelButtonColor: '#475569'
    });

    if (result.isConfirmed) {
      const link = document.createElement('a');
      link.href = pdfUrl;
      link.download = nombreArchivo;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }

    setTimeout(() => URL.revokeObjectURL(pdfUrl), 15000);
  } catch (error) {
    console.error('Error generando PDF de inventario:', error);
    toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo generar el PDF de inventario', life: 3000 });
  }
};
/************************************************************************/
const generarPdfCelularesImeiDisponiblesEmbed = async () => {
  try {
    const almacenActual = datosEmpresa.empresa?.nombre || '';
    const imeisDisponibles = await peticionesFetchOffline('getDataByCondition', 'imei', 'estado', 'DISPONIBLE');
    const imeisFiltrados = (imeisDisponibles || []).filter((i) => {
      if (!almacenActual) return true;
      return String(i.almacen || '').trim() === String(almacenActual).trim();
    });

    const celularesMap = new Map(
      (productosArray.value || [])
        .filter((p) => String(p.categoria || '').toUpperCase().includes('CELULAR'))
        .map((p) => [Number(p.id), p])
    );

    const rows = imeisFiltrados
      .map((imei) => {
        const prod = celularesMap.get(Number(imei.id_equi));
        if (!prod) return null;
        return {
          codigo: prod.codigo || prod.codigo_barra || '',
          producto: prod.nombre || imei.equipo || '',
          imei: imei.imei || '',
          capacidad: imei.capacidad || '-',
          bateria: `${Number(imei.bateria || 0)}%`,
          proveedor: imei.proveedor || prod.proveedor || '-',
          precio_venta: Number(imei.precio_venta || prod.precio_venta || 0)
        };
      })
      .filter(Boolean);

    if (!rows.length) {
      await Swal.fire('Sin datos', 'No hay celulares con IMEI disponible para generar el PDF.', 'info');
      return;
    }

    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    const fecha = new Date().toLocaleString('es-DO', { dateStyle: 'medium', timeStyle: 'short' });
    const totalImei = rows.length;
    const valorTotal = rows.reduce((sum, r) => sum + Number(r.precio_venta || 0), 0);

    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, 297, 24, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(15);
    doc.text('Celulares con IMEI Disponible', 14, 10);
    doc.setFontSize(9);
    doc.text(`Generado: ${fecha}`, 14, 16);
    doc.text(`Almacen: ${almacenActual || 'General'} | IMEIs: ${totalImei} | Valor venta: RD$ ${valorTotal.toFixed(2)}`, 14, 21);
    doc.setTextColor(17, 24, 39);

    autoTable(doc, {
      startY: 30,
      head: [['Codigo', 'Producto', 'IMEI', 'Capacidad', 'Bateria', 'Proveedor', 'P. Venta']],
      body: rows.map((r) => [
        r.codigo,
        r.producto,
        r.imei,
        r.capacidad,
        r.bateria,
        r.proveedor,
        Number(r.precio_venta).toFixed(2)
      ]),
      theme: 'grid',
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      columnStyles: {
        0: { cellWidth: 24 },
        1: { cellWidth: 64 },
        2: { cellWidth: 50 },
        3: { cellWidth: 20 },
        4: { halign: 'right', cellWidth: 20 },
        5: { cellWidth: 45 },
        6: { halign: 'right', cellWidth: 26 }
      }
    });

    const pdfBlob = doc.output('blob');
    const pdfUrl = URL.createObjectURL(pdfBlob);
    const nombreArchivo = `celulares_imei_disponible_${new Date().toISOString().slice(0, 10)}.pdf`;

    const result = await Swal.fire({
      title: 'Vista previa: Celulares IMEI',
      width: '94vw',
      html: `
        <div style="text-align:left;margin-bottom:10px;padding:10px;border-radius:10px;background:linear-gradient(135deg,#111827,#1f2937);color:#fff;">
          <div style="font-size:14px;font-weight:700;">Reporte especializado de celulares</div>
          <div style="font-size:12px;opacity:.9;">IMEI disponibles listos para consulta o impresion.</div>
        </div>
        <iframe src="${pdfUrl}" style="width:100%;height:72vh;border:1px solid #e5e7eb;border-radius:12px;background:#fff;"></iframe>
      `,
      showCancelButton: true,
      confirmButtonText: 'Descargar PDF',
      cancelButtonText: 'Cerrar',
      confirmButtonColor: '#0f766e',
      cancelButtonColor: '#475569'
    });

    if (result.isConfirmed) {
      const link = document.createElement('a');
      link.href = pdfUrl;
      link.download = nombreArchivo;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }

    setTimeout(() => URL.revokeObjectURL(pdfUrl), 15000);
  } catch (error) {
    console.error('Error generando PDF de celulares IMEI:', error);
    toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo generar el PDF de celulares IMEI', life: 3000 });
  }
};
/************************************************************************/

// Computed stats
const statsData = computed(() => {
  const productos = productosArray.value;
  const total = productos.length;
  const enStock = productos.filter(p => p.stock > 0).length;
  const sinStock = productos.filter(p => p.stock <= 0).length;
  const enAlerta = productos.filter(p => p.stock > 0 && p.stock <= p.alerta).length;
  const valorTotal = productos.reduce((sum, p) => sum + (Number(p.precio_compra) * Number(p.stock)), 0);

  return {
    total,
    enStock,
    sinStock,
    enAlerta,
    valorTotal: valorTotal.toFixed(2)
  };
});
</script>
<template>
<main class="productos-wrapper">
  <div class="productos-container">

    <!-- Header con gradiente naranja/?mbar -->
    <div class="productos-header">
      <div class="productos-header-content">
        <div class="productos-icon-wrapper">
          <i class="pi pi-box productos-icon"></i>
        </div>
        <div>
          <h1 class="productos-title">{{ $t('Product Management') }}</h1>
          <p class="productos-subtitle">{{ $t('Manage your inventory and products') }}</p>
        </div>
      </div>
    </div>

    <!-- Stats Cards -->
    <div class="productos-stats-grid">
      <Card class="productos-stat-card productos-stat-total">
        <template #content>
          <div class="productos-stat-content">
            <div>
              <p class="productos-stat-label">{{ $t('Total Products') }}</p>
              <p class="productos-stat-value">{{ statsData.total }}</p>
            </div>
            <div class="productos-stat-icon-circle productos-stat-icon-total">
              <i class="pi pi-box"></i>
            </div>
          </div>
        </template>
      </Card>

      <Card class="productos-stat-card productos-stat-stock">
        <template #content>
          <div class="productos-stat-content">
            <div>
              <p class="productos-stat-label">{{ $t('In Stock') }}</p>
              <p class="productos-stat-value">{{ statsData.enStock }}</p>
            </div>
            <div class="productos-stat-icon-circle productos-stat-icon-stock">
              <i class="pi pi-check-circle"></i>
            </div>
          </div>
        </template>
      </Card>

      <Card class="productos-stat-card productos-stat-out">
        <template #content>
          <div class="productos-stat-content">
            <div>
              <p class="productos-stat-label">{{ $t('Out of Stock') }}</p>
              <p class="productos-stat-value">{{ statsData.sinStock }}</p>
            </div>
            <div class="productos-stat-icon-circle productos-stat-icon-out">
              <i class="pi pi-times-circle"></i>
            </div>
          </div>
        </template>
      </Card>

      <Card class="productos-stat-card productos-stat-alert">
        <template #content>
          <div class="productos-stat-content">
            <div>
              <p class="productos-stat-label">{{ $t('On Alert') }}</p>
              <p class="productos-stat-value">{{ statsData.enAlerta }}</p>
            </div>
            <div class="productos-stat-icon-circle productos-stat-icon-alert">
              <i class="pi pi-exclamation-triangle"></i>
            </div>
          </div>
        </template>
      </Card>

      <Card class="productos-stat-card productos-stat-value">
        <template #content>
          <div class="productos-stat-content">
            <div>
              <p class="productos-stat-label">{{ $t('Inventory Value') }}</p>
              <p class="productos-stat-value-money">${{ statsData.valorTotal }}</p>
            </div>
            <div class="productos-stat-icon-circle productos-stat-icon-value">
              <i class="pi pi-dollar"></i>
            </div>
          </div>
        </template>
      </Card>
    </div>

    <!-- Section Divider -->
    <div class="productos-section-divider">
      <div class="productos-divider-line"></div>
      <div class="productos-divider-content">
        <i class="pi pi-sliders-h"></i>
        <span>{{ $t('Actions and Filters') }}</span>
      </div>
      <div class="productos-divider-line"></div>
    </div>

    <!-- Actions Card -->
    <Card class="productos-actions-card">
      <template #content>
        <div class="productos-actions-grid">
          <!-- Reload -->
          <Button
            icon="pi pi-refresh"
            :label="$t('Reload')"
            severity="warning"
            class="productos-action-btn"
            @click="fetchAndSetupData"
            :v-tooltip.bottom="$t('Reload product list')"
          />

          <!-- Create -->
          <RouterLink to="/crearproductos" class="inline-flex">
            <Button
              icon="pi pi-plus"
              :label="$t('New Product')"
              severity="success"
              class="productos-action-btn"
              :v-tooltip.bottom="$t('Create new product')"
            />
          </RouterLink>

          <Button
            icon="pi pi-bell"
            :label="`Alertas de stock (${statsData.enAlerta})`"
            severity="danger"
            outlined
            class="productos-action-btn"
            @click="guardarFiltrosParaVolver(); fnRouter('/productos-poco-stock')"
            v-tooltip.bottom="'Ver productos en alerta y gestionar pedidos de reposicion'"
          />

          <Button
            icon="pi pi-bolt"
            label="Agregar Express"
            severity="help"
            class="productos-action-btn"
            @click="abrirAgregarExpress"
            v-tooltip.bottom="'Crear producto rapido con datos basicos'"
          />

          <!-- Cambio Masivo de Precios -->
          <Button
            icon="pi pi-dollar"
            label="Cambio Masivo Precios"
            severity="info"
            class="productos-action-btn"
            @click="abrirCambioMasivoPrecios"
            v-tooltip.bottom="'Cambiar precios masivamente por categoria o seleccion'"
          />

          <!-- Delete Selected -->
          <Button
            icon="pi pi-trash"
            :label="$t('Delete Selection')"
            severity="danger"
            class="productos-action-btn"
            @click="borrarSeleccionados"
            :v-tooltip.bottom="$t('Delete selected products')"
          />

          <!-- Export Excel -->
          <Button
            icon="pi pi-file-excel"
            :label="$t('Export Excel')"
            severity="success"
            outlined
            class="productos-action-btn"
            @click="exportToExcel"
            :v-tooltip.bottom="$t('Export to Excel')"
          />

          <Button
            icon="pi pi-file-pdf"
            label="Inventario PDF"
            severity="danger"
            outlined
            class="productos-action-btn"
            @click="generarPdfInventarioEmbed"
            v-tooltip.bottom="'Generar y visualizar PDF del inventario'"
          />
          
          <Button
            icon="pi pi-mobile"
            label="Celulares IMEI PDF"
            severity="contrast"
            outlined
            class="productos-action-btn"
            @click="generarPdfCelularesImeiDisponiblesEmbed"
            v-tooltip.bottom="'Generar PDF de celulares con IMEI disponibles'"
          />

          <!-- Productos Dañados -->
          <Button
            icon="pi pi-exclamation-triangle"
            label="Productos Dañados"
            severity="danger"
            outlined
            class="productos-action-btn"
            @click="visibleProductosDanados = true"
            v-tooltip.bottom="'Registrar productos dañados o en mal estado'"
          />

          <!-- Productos Uso Interno -->
          <Button
            icon="pi pi-box"
            label="Uso Interno"
            severity="info"
            outlined
            class="productos-action-btn"
            @click="visibleProductosUsoInterno = true"
            v-tooltip.bottom="'Sacar productos para uso interno de la empresa'"
          />

          <!-- Crear todos los iPhones -->
          <Button
            icon="pi pi-mobile"
            label="Crear lista de telefonos"
            severity="secondary"
            outlined
            class="productos-action-btn"
            @click="abrirModalCrearListaTelefonos"
            v-tooltip.bottom="'Crear lista de telefonos por marca usando IA'"
          />

          <!-- Ver IMEI -->
          <RouterLink to="/imei" class="inline-flex" v-if="datosDefault.modo === 'CELULAR' || datosDefault.modo === 'FULL'">
            <Button
              icon="pi pi-mobile"
              label="Ver IMEI"
              severity="secondary"
              outlined
              class="productos-action-btn"
              v-tooltip.bottom="'Ir a gestión de IMEI'"
            />
          </RouterLink>

          <!-- Sync IMEI (CELULAR mode) -->
          <Button
            v-if="datosDefault.modo === 'CELULAR'"
            icon="pi pi-sync"
            :label="$t('Sync IMEI')"
            severity="secondary"
            class="productos-action-btn"
            @click="fechDataIMEI"
            :v-tooltip.bottom="$t('Sync cell phone stock')"
          />

          <!-- Move Warehouse -->
          <Button
            v-if="selectedItems.length > 0"
            icon="pi pi-exchange"
            :label="`${$t('Transfer')} (${selectedItems.length}) ${$t('from Warehouse')}`"
            severity="info"
            outlined
            class="productos-action-btn"
            @click="fnPasarDeAlmacen"
            :v-tooltip.bottom="$t('Change product warehouse')"
          />

          <!-- Delete All (Support only) -->
          <Button
            v-if="usuarioLocal.usuario === 'Soporte'"
            icon="pi pi-times"
            :label="$t('Delete All')"
            severity="danger"
            raised
            class="productos-action-btn productos-delete-all"
            @click="borrarTodo"
            :v-tooltip.bottom="$t('Delete all products (Support)')"
          />
        </div>
      </template>
    </Card>

    <!-- Section Divider -->
    <div class="productos-section-divider">
      <div class="productos-divider-line"></div>
      <div class="productos-divider-content">
        <i class="pi pi-filter"></i>
        <span>{{ $t('Search Filters') }}</span>
      </div>
      <div class="productos-divider-line"></div>
    </div>

    <!-- Filters Card -->
    <Card class="productos-filters-card">
      <template #content>
        <div class="productos-filters-grid">
          <!-- Status Filter -->
          <div class="productos-filter-group">
            <label class="productos-filter-label">
              <i class="pi pi-filter"></i>
              {{ $t('Status') }}
            </label>
            <Select
              v-model="selectedFilter"
              :options="[
                { label: $t('All products'), value: 'all' },
                { label: $t('Products without stock'), value: 'outOfStock' },
                { label: $t('Products with stock'), value: 'inStock' },
                { label: $t('Products on alert'), value: 'alert' }
              ]"
              optionLabel="label"
              optionValue="value"
              :placeholder="$t('Filter by status')"
              class="productos-filter-select"
            />
          </div>

          <!-- Category Filter -->
          <div class="productos-filter-group">
            <label class="productos-filter-label">
              <i class="pi pi-tag"></i>
              {{ $t('Category') }}
            </label>
            <Select
              v-model="selectedCategory"
              :options="[
                { label: $t('All categories'), value: 'all' },
                ...categoriasArray.map(c => ({ label: c.nombre, value: c.nombre }))
              ]"
              optionLabel="label"
              optionValue="value"
              :placeholder="$t('Select category')"
              class="productos-filter-select"
            />
          </div>

          <!-- Warehouse Filter -->
          <div class="productos-filter-group">
            <label class="productos-filter-label">
              <i class="pi pi-building"></i>
              {{ $t('Warehouse / Company') }}
            </label>
            <Dropdown
              v-model="almacenes"
              :options="empresas"
              optionLabel="label"
              optionValue="value"
              :placeholder="$t('Select warehouse')"
              class="productos-filter-dropdown"
            />
          </div>

          <!-- Search -->
          <div class="productos-filter-group">
            <label class="productos-filter-label">
              <i class="pi pi-search"></i>
              {{ $t('Search') }}
            </label>
            <IconField iconPosition="left" class="w-full productos-search-field">
                <InputIcon class="pi pi-search" />
                <InputText
                  v-model="searchQuery"
                  fluid
                  :placeholder="$t('Search products...')"
                  class="productos-search-input"
                />
              <Button
                v-if="searchQuery"
                icon="pi pi-times"
                severity="secondary"
                text
                rounded
                type="button"
                :aria-label="$t('Clear search')"
                class="productos-clear-search-btn"
                @click="limpiarBuscador"
              />
            </IconField>
          </div>
        </div>
      </template>
    </Card>

    <!-- Section Divider -->
    <div class="productos-section-divider">
      <div class="productos-divider-line"></div>
      <div class="productos-divider-content">
        <i class="pi pi-list"></i>
        <span>{{ $t('Product List') }}</span>
      </div>
      <div class="productos-divider-line"></div>
    </div>

    <!-- DataTable Card -->
    <Card class="productos-table-card">
      <template #content>
        <DataTable
          :value="filteredProducts"
          lazy
          :loading="loading"
          :totalRecords="totalRecords"
          :first="first"
          scrollable
          scrollHeight="600px"
          dataKey="id"
          paginator
          stripedRows
          :rows="rows"
          :rowsPerPageOptions="[10, 25, 50, 100, 250]"
          paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink RowsPerPageDropdown CurrentPageReport"
          currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} productos"
          size="small"
          resizableColumns
          columnResizeMode="fit"
          @page="onPage"
          v-model:selection="selectedItems"
          selectionMode="multiple"
          :rowClass="getRowClass"
          class="productos-datatable"
        >
          <!-- Checkbox Column -->
          <Column selectionMode="multiple" headerStyle="width: 3rem">
            <template #body="{ data }">
              <div @click.stop>
                <Checkbox v-model="selectedItems" :value="data" />
              </div>
            </template>
          </Column>

          <!-- Options Menu -->
          <Column :header="$t('Options')" frozen style="min-width: 100px">
            <template #body="slotProps">
              <Button
                icon="pi pi-cog"
                rounded
                outlined
                severity="secondary"
                @click.stop="toggleProductos($event, slotProps.data)"
                :v-tooltip.bottom="$t('Options')"
              />
              <Menu
                ref="menu"
                id="overlay_menu_Productos"
                :model="itemsProductos"
                :popup="true"
              />
            </template>
          </Column>

          <!-- Product Columns -->
          <Column field="codigo" :header="$t('Code')" style="min-width: 120px"></Column>
          <Column field="codigo_barra" :header="$t('Barcode')" style="min-width: 150px"></Column>
          <Column field="nombre" :header="$t('Name')" style="min-width: 250px"></Column>

          <Column field="stock" :header="$t('Stock')" style="min-width: 100px">
            <template #body="slotProps">
              <Badge :value="slotProps.data.stock" :severity="colorEstado(slotProps.data)" />
            </template>
          </Column>

          <Column field="precio_compra" :header="$t('Purchase Price')" style="min-width: 130px">
            <template #body="slotProps">
              <span class="productos-price">${{ Number(slotProps.data.precio_compra).toFixed(2) }}</span>
            </template>
          </Column>

          <Column field="precio_venta" :header="$t('Sale Price')" style="min-width: 130px">
            <template #body="slotProps">
              <Badge :value="'$' + Number(slotProps.data.precio_venta).toFixed(2)" severity="success" />
            </template>
          </Column>

          <Column field="precio_min" :header="$t('Min. Price')" style="min-width: 130px">
            <template #body="slotProps">
              <span class="productos-price-min">${{ Number(slotProps.data.precio_min).toFixed(2) }}</span>
            </template>
          </Column>

          <Column field="precio_xmayor" :header="$t('Wholesale Price')" style="min-width: 140px">
            <template #body="slotProps">
              <span class="productos-price-mayor">${{ Number(slotProps.data.precio_xmayor).toFixed(2) }}</span>
            </template>
          </Column>

          <Column field="precio_final" :header="$t('Final Price')" style="min-width: 130px">
            <template #body="slotProps">
              <Badge :value="'$' + Number(slotProps.data.precio_final).toFixed(2)" severity="info" />
            </template>
          </Column>

          <Column field="categoria" :header="$t('Category')" style="min-width: 130px">
            <template #body="slotProps">
              <Tag :value="slotProps.data.categoria" severity="warning" />
            </template>
          </Column>

          <Column field="proveedor" :header="$t('Supplier')" style="min-width: 150px"></Column>
          <Column field="marca" :header="$t('Brand')" style="min-width: 130px"></Column>
          <Column field="modelo" :header="$t('Model')" style="min-width: 130px"></Column>
          <Column field="ganancia" :header="$t('Profit') + ' %'" style="min-width: 120px">
            <template #body="slotProps">
              <span class="productos-ganancia">{{ slotProps.data.ganancia }}%</span>
            </template>
          </Column>
          <Column field="alerta" :header="$t('Alert')" style="min-width: 100px"></Column>
          <Column field="empaque" :header="$t('Package')" style="min-width: 120px"></Column>
          <Column field="ubicacion" :header="$t('Location')" style="min-width: 130px"></Column>
          <Column field="almacen" :header="$t('Warehouse')" style="min-width: 150px">
            <template #body="slotProps">
              <Tag :value="slotProps.data.almacen" severity="secondary" />
            </template>
          </Column>
        </DataTable>
      </template>
    </Card>

  </div>

<!-- All Modals (unchanged) -->
<Dialog v-model:visible="visibleAgregarExpress" modal :position="position" header="Agregar Express" :style="{ width: '34rem' }">
  <template #header>
    <div class="inline-flex align-items-center justify-content-center gap-2">
      <span class="font-bold white-space-nowrap">Agregar Express</span>
    </div>
  </template>

  <div class="grid grid-cols-12 gap-4">
    <fieldset class="border p-3 rounded mb-2 col-span-12">
      <legend class="float-none w-auto px-2">Datos basicos</legend>
      <div class="grid grid-cols-12 gap-3">
        <div class="col-span-12">
          <label class="block mb-1">Nombre</label>
          <InputText v-model="productoExpress.nombre" v-mayuscula placeholder="Nombre del producto" fluid />
        </div>
        <div class="col-span-12 md:col-span-6">
          <label class="block mb-1">Categoria</label>
          <Select
            v-model="productoExpress.categoria"
            :options="categoriasArray"
            optionLabel="nombre"
            optionValue="nombre"
            placeholder="Seleccionar categoria"
            filter
            fluid
          />
        </div>
        <div class="col-span-12 md:col-span-6">
          <label class="block mb-1">Precio compra</label>
          <InputNumber v-model="productoExpress.precio_compra" :min="0" mode="currency" currency="DOP" locale="es-DO" fluid />
        </div>
        <div class="col-span-12 md:col-span-6">
          <label class="block mb-1">Precio venta</label>
          <InputNumber v-model="productoExpress.precio_venta" :min="0" mode="currency" currency="DOP" locale="es-DO" fluid />
        </div>
        <div class="col-span-12 md:col-span-6">
          <label class="block mb-1">Resumen</label>
          <Message :closable="false" severity="info">
            Precio Min y Precio x Mayor se guardaran igual al Precio Venta.
          </Message>
        </div>
      </div>
    </fieldset>
  </div>

  <template #footer>
    <ButtonGroup>
      <Button label="Crear" icon="pi pi-check" severity="success" outlined @click="crearProductoExpress" />
      <Button label="Cerrar" icon="pi pi-times" severity="danger" outlined @click="visibleAgregarExpress = false" />
    </ButtonGroup>
  </template>
</Dialog>

<!-- Modal Cambio Masivo de Precios -->
<Dialog v-model:visible="visibleCambioMasivoPrecios" modal :position="position" header="Cambio Masivo de Precios" :style="{ width: '40rem' }">
  <template #header>
    <div class="inline-flex align-items-center justify-content-center gap-2">
      <i class="pi pi-dollar"></i>
      <span class="font-bold white-space-nowrap">Cambio Masivo de Precios</span>
    </div>
  </template>

  <div class="grid grid-cols-12 gap-4">
    <!-- Tipo de Selección -->
    <fieldset class="border p-3 rounded mb-2 col-span-12">
      <legend class="float-none w-auto px-2">Tipo de Selección</legend>
      <div class="grid grid-cols-12 gap-3">
        <div class="col-span-12">
          <div class="flex gap-4">
            <div class="flex items-center">
              <RadioButton
                v-model="cambioMasivo.tipoSeleccion"
                inputId="seleccion-categoria"
                value="categoria"
              />
              <label for="seleccion-categoria" class="ml-2 cursor-pointer">Por Categoría</label>
            </div>
            <div class="flex items-center">
              <RadioButton
                v-model="cambioMasivo.tipoSeleccion"
                inputId="seleccion-individual"
                value="individual"
              />
              <label for="seleccion-individual" class="ml-2 cursor-pointer">Productos Seleccionados</label>
            </div>
          </div>
        </div>

        <!-- Selector de Categoría -->
        <div v-if="cambioMasivo.tipoSeleccion === 'categoria'" class="col-span-12">
          <label class="block mb-1">Categoría</label>
          <Select
            v-model="cambioMasivo.categoriaSeleccionada"
            :options="categoriasArray"
            optionLabel="nombre"
            optionValue="nombre"
            placeholder="Seleccionar categoría"
            filter
            fluid
          />
        </div>

        <!-- Selector de productos individuales -->
        <div v-else class="col-span-12">
          <label class="block mb-1">Seleccionar Productos</label>
          <MultiSelect
            v-model="cambioMasivo.productosSeleccionados"
            :options="productosArray"
            optionLabel="nombre"
            placeholder="Seleccionar productos"
            filter
            display="chip"
            :maxSelectedLabels="3"
            fluid
            class="w-full"
          >
            <template #option="slotProps">
              <div class="flex items-center gap-2">
                <span class="font-semibold">{{ slotProps.option.nombre }}</span>
                <span class="text-sm text-gray-500">- {{ slotProps.option.categoria }}</span>
                <span class="text-sm text-green-600 ml-auto">${{ Number(slotProps.option.precio_venta || 0).toFixed(2) }}</span>
              </div>
            </template>
            <template #value="slotProps">
              <div v-if="slotProps.value && slotProps.value.length > 0" class="flex items-center gap-1">
                <span>{{ slotProps.value.length }} producto(s) seleccionado(s)</span>
              </div>
              <span v-else>
                {{ slotProps.placeholder }}
              </span>
            </template>
          </MultiSelect>
          <small class="text-gray-500 mt-1 block">
            Seleccione uno o más productos para aplicar el cambio de precios
          </small>
        </div>
      </div>
    </fieldset>

    <!-- Tipo de Ajuste -->
    <fieldset class="border p-3 rounded mb-2 col-span-12">
      <legend class="float-none w-auto px-2">Configuración del Ajuste</legend>
      <div class="grid grid-cols-12 gap-3">
        <!-- Dirección del ajuste -->
        <div class="col-span-12">
          <label class="block mb-2">Dirección</label>
          <div class="flex gap-4">
            <div class="flex items-center">
              <RadioButton
                v-model="cambioMasivo.direccion"
                inputId="direccion-aumentar"
                value="aumentar"
              />
              <label for="direccion-aumentar" class="ml-2 cursor-pointer">Aumentar</label>
            </div>
            <div class="flex items-center">
              <RadioButton
                v-model="cambioMasivo.direccion"
                inputId="direccion-disminuir"
                value="disminuir"
              />
              <label for="direccion-disminuir" class="ml-2 cursor-pointer">Disminuir</label>
            </div>
          </div>
        </div>

        <!-- Tipo de ajuste -->
        <div class="col-span-12">
          <label class="block mb-2">Tipo de Ajuste</label>
          <div class="flex gap-4">
            <div class="flex items-center">
              <RadioButton
                v-model="cambioMasivo.tipoAjuste"
                inputId="ajuste-porcentaje"
                value="porcentaje"
              />
              <label for="ajuste-porcentaje" class="ml-2 cursor-pointer">Porcentaje (%)</label>
            </div>
            <div class="flex items-center">
              <RadioButton
                v-model="cambioMasivo.tipoAjuste"
                inputId="ajuste-valor"
                value="valor"
              />
              <label for="ajuste-valor" class="ml-2 cursor-pointer">Valor Fijo</label>
            </div>
          </div>
        </div>

        <!-- Valor del ajuste -->
        <div class="col-span-12">
          <label class="block mb-1">
            {{ cambioMasivo.tipoAjuste === 'porcentaje' ? 'Porcentaje (%)' : 'Valor ($)' }}
          </label>
          <InputNumber
            v-model="cambioMasivo.valorAjuste"
            :min="0"
            :minFractionDigits="2"
            :maxFractionDigits="2"
            :suffix="cambioMasivo.tipoAjuste === 'porcentaje' ? ' %' : ''"
            :mode="cambioMasivo.tipoAjuste === 'valor' ? 'currency' : 'decimal'"
            :currency="cambioMasivo.tipoAjuste === 'valor' ? 'DOP' : undefined"
            :locale="cambioMasivo.tipoAjuste === 'valor' ? 'es-DO' : undefined"
            placeholder="Ingrese el valor"
            fluid
          />
        </div>
      </div>
    </fieldset>

    <!-- Aplicar a qué precios -->
    <fieldset class="border p-3 rounded mb-2 col-span-12">
      <legend class="float-none w-auto px-2">Aplicar a</legend>
      <div class="grid grid-cols-12 gap-3">
        <div class="col-span-12">
          <div class="flex flex-col gap-2">
            <div class="flex items-center">
              <Checkbox
                v-model="cambioMasivo.aplicarA"
                inputId="aplicar-precio-venta"
                value="precio_venta"
              />
              <label for="aplicar-precio-venta" class="ml-2 cursor-pointer">Precio de Venta</label>
            </div>
            <div class="flex items-center">
              <Checkbox
                v-model="cambioMasivo.aplicarA"
                inputId="aplicar-precio-min"
                value="precio_min"
              />
              <label for="aplicar-precio-min" class="ml-2 cursor-pointer">Precio Mínimo</label>
            </div>
            <div class="flex items-center">
              <Checkbox
                v-model="cambioMasivo.aplicarA"
                inputId="aplicar-precio-xmayor"
                value="precio_xmayor"
              />
              <label for="aplicar-precio-xmayor" class="ml-2 cursor-pointer">Precio por Mayor</label>
            </div>
          </div>
        </div>
      </div>
    </fieldset>

    <!-- Resumen -->
    <div class="col-span-12">
      <Message severity="warn" :closable="false">
        <strong>Importante:</strong> Esta acción modificará los precios de múltiples productos. Asegúrese de revisar la configuración antes de aplicar.
      </Message>
    </div>
  </div>

  <template #footer>
    <ButtonGroup>
      <Button
        label="Aplicar Cambios"
        icon="pi pi-check"
        severity="success"
        outlined
        @click="aplicarCambioMasivoPrecios"
      />
      <Button
        label="Cancelar"
        icon="pi pi-times"
        severity="danger"
        outlined
        @click="visibleCambioMasivoPrecios = false"
      />
    </ButtonGroup>
  </template>
</Dialog>

<Dialog v-model:visible="visibleCrearListaTelefonos" modal :position="position" header="Crear lista de telefonos" :style="{ width: '36rem' }">
  <template #header>
    <div class="inline-flex align-items-center justify-content-center gap-2">
      <span class="font-bold white-space-nowrap">Crear lista de telefonos</span>
    </div>
  </template>

  <div class="grid grid-cols-12 gap-4">
    <fieldset class="border p-3 rounded mb-2 col-span-12">
      <legend class="float-none w-auto px-2">Marcas</legend>
      <div class="grid grid-cols-2 md:grid-cols-3 gap-3">
        <div v-for="marca in marcasTelefonosDisponibles" :key="marca" class="flex items-center gap-2">
          <Checkbox
            v-model="marcasTelefonosSeleccionadas"
            :inputId="`marca-${marca}`"
            :value="marca"
          />
          <label :for="`marca-${marca}`" class="cursor-pointer">{{ marca }}</label>
        </div>
      </div>
      <div class="grid grid-cols-2 gap-3 mt-4">
        <div>
          <label class="block text-sm mb-1">Ano desde</label>
          <InputNumber v-model="anioDesdeTelefonos" :min="2007" :max="anioHastaTelefonos" :useGrouping="false" fluid />
        </div>
        <div>
          <label class="block text-sm mb-1">Ano hasta</label>
          <InputNumber v-model="anioHastaTelefonos" :min="anioDesdeTelefonos" :max="new Date().getFullYear()" :useGrouping="false" fluid />
        </div>
      </div>
      <small class="text-gray-500 block mt-3">
        Se consultaran modelos por IA en el rango de anos indicado. Los nombres se guardan sin capacidad (GB/TB).
      </small>
    </fieldset>
  </div>

  <template #footer>
    <ButtonGroup>
      <Button
        label="Crear"
        icon="pi pi-check"
        severity="success"
        outlined
        :loading="procesandoListaTelefonos"
        @click="crearListaTelefonosDesdeIA"
      />
      <Button
        label="Cerrar"
        icon="pi pi-times"
        severity="danger"
        outlined
        @click="visibleCrearListaTelefonos = false"
      />
    </ButtonGroup>
  </template>
</Dialog>

<Dialog v-model:visible="visibleInforme" modal :position="position" header="Modal Informe" :style="{ width: '30rem' }">
    <template #header>
      <div class="inline-flex align-items-center justify-content-center gap-2">
        <span class="font-bold white-space-nowrap">Modal Informe</span>
      </div>
    </template>
    <div class="grid grid-cols-12 gap-4">
      <fieldset class="border p-3 rounded mb-2">
        <legend class="float-none w-auto px-2">Modal Informe</legend>
           <div class="grid grid-cols-12 gap-4">

             <div class="col-span-6 form-group">
                <label for="fechaInicioInforme">Fecha Inicio</label>
                <Calendar v-model="fechaInicioInforme" dateFormat="dd/mm/yy" />
             </div>


             <div class="col-span-6 form-group">
                <label for="fechaFinalInforme">Fecha Final</label>
                <Calendar v-model="fechaFinalInforme" dateFormat="dd/mm/yy" />
             </div>

             <div class="col-span-12 form-group">
              <Message :closable="false">Este producto se ha vendido ({{cantidadInforme}}) Veces</Message>

             </div>


      </div>
        </fieldset>
    </div>
    <template #footer>
      <ButtonGroup>
        <Button label="Ver Informe" icon="pi pi-check" severity="success" @click="fnVerInforme" outlined />
        <Button label="Cerrar" icon="pi pi-times" severity="danger" @click="visibleInforme = false" outlined />
      </ButtonGroup>
    </template>
  </Dialog>
 <!-- ////////////////////////////////////////////////////////////////////////////////////////// -->
 <Dialog
  v-model:visible="visiblePrecio"
  modal
  :style="{ width: '700px' }"
  :dismissableMask="false"
  :pt="{ root: { class: 'precio-dialog' } }"
>
    <template #header>
      <div class="flex items-center gap-3">
        <div class="flex items-center justify-center w-12 h-12 bg-emerald-100 rounded-lg">
          <i class="pi pi-dollar text-emerald-600 text-2xl"></i>
        </div>
        <div>
          <h2 class="text-xl font-bold text-gray-800 m-0">Gestión de Precios</h2>
          <p class="text-sm text-gray-500 m-0">{{ productoSeleccionado?.nombre || 'Producto' }}</p>
        </div>
      </div>
    </template>

    <!-- Información del Producto -->
    <div class="mb-4 p-4 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-lg border border-emerald-200">
      <div class="grid grid-cols-3 gap-4">
        <div>
          <p class="text-xs text-gray-500 mb-1">Código</p>
          <p class="text-sm font-semibold text-gray-800">{{ productoSeleccionado?.codigo || 'N/A' }}</p>
        </div>
        <div>
          <p class="text-xs text-gray-500 mb-1">Categoría</p>
          <p class="text-sm font-semibold text-gray-800">{{ productoSeleccionado?.categoria || 'N/A' }}</p>
        </div>
        <div>
          <p class="text-xs text-gray-500 mb-1">Stock</p>
          <p class="text-sm font-semibold text-gray-800">{{ productoSeleccionado?.stock || 0 }} unidades</p>
        </div>
      </div>
    </div>

    <!-- Costo de Compra -->
    <div class="mb-4">
      <div class="p-4 bg-gradient-to-br from-red-50 to-orange-50 rounded-xl border-2 border-red-200">
        <label class="flex items-center text-sm font-semibold text-gray-700 mb-3">
          <i class="pi pi-shopping-cart mr-2 text-red-600"></i>
          Costo de Compra
        </label>
        <InputNumber
          v-model="productoSeleccionado.precio_compra"
          :min="0"
          :useGrouping="false"
          locale="en-US"
          :minFractionDigits="2"
          :maxFractionDigits="2"
          highlightOnFocus
          inputId="costo"
          @blur="calcularPrecios"
          mode="currency"
          currency="DOP"
          fluid
          :inputStyle="{
            height: '65px',
            fontSize: '2rem',
            fontWeight: '700',
            textAlign: 'center',
            borderRadius: '10px',
            color: '#dc2626'
          }"
        />
        <p class="text-xs text-gray-500 mt-2 flex items-center">
          <i class="pi pi-info-circle mr-1"></i>
          Precio al que compras el producto
        </p>
      </div>
    </div>

    <!-- Precios de Venta -->
    <div class="grid grid-cols-1 gap-4 mb-4">
      <!-- Precio de Venta Principal -->
      <div class="p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border-2 border-green-200">
        <label class="flex items-center text-sm font-semibold text-gray-700 mb-3">
          <i class="pi pi-tag mr-2 text-green-600"></i>
          Precio de Venta Principal
        </label>
        <InputNumber
          v-model="productoSeleccionado.precio_venta"
          :min="0"
          :useGrouping="false"
          locale="en-US"
          :minFractionDigits="2"
          :maxFractionDigits="2"
          highlightOnFocus
          inputId="pventa"
          @blur="calcularPrecios"
          mode="currency"
          currency="DOP"
          fluid
          :inputStyle="{
            height: '65px',
            fontSize: '2rem',
            fontWeight: '700',
            textAlign: 'center',
            borderRadius: '10px',
            color: '#16a34a'
          }"
        />
        <div v-if="productoSeleccionado?.precio_compra && productoSeleccionado?.precio_venta" class="mt-3 p-2 bg-white rounded-lg">
          <div class="flex justify-between items-center">
            <span class="text-xs text-gray-600">Ganancia:</span>
            <span class="text-sm font-bold text-green-700">
              {{ (productoSeleccionado.precio_venta - productoSeleccionado.precio_compra).toFixed(2) }} DOP
            </span>
          </div>
          <div class="flex justify-between items-center mt-1">
            <span class="text-xs text-gray-600">Margen:</span>
            <span class="text-sm font-bold text-green-700">
              {{ productoSeleccionado.precio_compra > 0 ? (((productoSeleccionado.precio_venta - productoSeleccionado.precio_compra) / productoSeleccionado.precio_compra) * 100).toFixed(1) : 0 }}%
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Precios Adicionales en Grid -->
    <div class="grid grid-cols-2 gap-4 mb-4">
      <!-- Precio Mínimo -->
      <div class="p-4 bg-gradient-to-br from-amber-50 to-yellow-50 rounded-xl border-2 border-amber-200">
        <label class="flex items-center text-sm font-semibold text-gray-700 mb-3">
          <i class="pi pi-exclamation-triangle mr-2 text-amber-600"></i>
          Precio Mínimo
        </label>
        <InputNumber
          v-model="productoSeleccionado.precio_min"
          :min="0"
          :useGrouping="false"
          locale="en-US"
          :minFractionDigits="2"
          :maxFractionDigits="2"
          highlightOnFocus
          inputId="pminimo"
          @blur="calcularPrecios"
          mode="currency"
          currency="DOP"
          fluid
          :inputStyle="{
            height: '55px',
            fontSize: '1.5rem',
            fontWeight: '600',
            textAlign: 'center',
            borderRadius: '10px',
            color: '#d97706'
          }"
        />
        <p class="text-xs text-gray-500 mt-2">Precio límite inferior</p>
      </div>

      <!-- Precio Por Mayor -->
      <div class="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border-2 border-blue-200">
        <label class="flex items-center text-sm font-semibold text-gray-700 mb-3">
          <i class="pi pi-users mr-2 text-blue-600"></i>
          Precio X Mayor
        </label>
        <InputNumber
          v-model="productoSeleccionado.precio_xmayor"
          :min="0"
          :useGrouping="false"
          locale="en-US"
          :minFractionDigits="2"
          :maxFractionDigits="2"
          highlightOnFocus
          inputId="pxmayor"
          @blur="recarcularPventa"
          mode="currency"
          currency="DOP"
          fluid
          :inputStyle="{
            height: '55px',
            fontSize: '1.5rem',
            fontWeight: '600',
            textAlign: 'center',
            borderRadius: '10px',
            color: '#2563eb'
          }"
        />
        <p class="text-xs text-gray-500 mt-2">Precio para mayoristas</p>
      </div>
    </div>

    <!-- Resumen de Márgenes -->
    <div v-if="productoSeleccionado?.precio_compra > 0" class="p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200 mb-4">
      <p class="text-sm font-semibold text-gray-700 mb-3 flex items-center">
        <i class="pi pi-chart-line mr-2 text-purple-600"></i>
        Análisis de Márgenes
      </p>
      <div class="grid grid-cols-3 gap-3">
        <div class="bg-white p-3 rounded-lg text-center">
          <p class="text-xs text-gray-500 mb-1">Margen Venta</p>
          <p class="text-lg font-bold text-green-600">
            {{ productoSeleccionado.precio_venta > 0 ? (((productoSeleccionado.precio_venta - productoSeleccionado.precio_compra) / productoSeleccionado.precio_compra) * 100).toFixed(1) : 0 }}%
          </p>
        </div>
        <div class="bg-white p-3 rounded-lg text-center">
          <p class="text-xs text-gray-500 mb-1">Margen Mínimo</p>
          <p class="text-lg font-bold text-amber-600">
            {{ productoSeleccionado.precio_min > 0 ? (((productoSeleccionado.precio_min - productoSeleccionado.precio_compra) / productoSeleccionado.precio_compra) * 100).toFixed(1) : 0 }}%
          </p>
        </div>
        <div class="bg-white p-3 rounded-lg text-center">
          <p class="text-xs text-gray-500 mb-1">Margen X Mayor</p>
          <p class="text-lg font-bold text-blue-600">
            {{ productoSeleccionado.precio_xmayor > 0 ? (((productoSeleccionado.precio_xmayor - productoSeleccionado.precio_compra) / productoSeleccionado.precio_compra) * 100).toFixed(1) : 0 }}%
          </p>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="flex justify-end gap-2">
        <Button
          label="Cancelar"
          icon="pi pi-times"
          severity="secondary"
          outlined
          @click="visiblePrecio = false"
        />
        <Button
          label="Aplicar Precios"
          icon="pi pi-check"
          severity="success"
          @click="fnAplicarPrecio"
        />
      </div>
    </template>
  </Dialog>
<!-- ////////////////////////////////////////////////////////////////////////////////////////// -->
<Dialog
  v-model:visible="visibleStock"
  modal
  :style="{ width: '550px' }"
  :dismissableMask="false"
  :pt="{ root: { class: 'stock-dialog' } }"
>
    <template #header>
      <div class="flex items-center gap-3">
        <div class="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg">
          <i class="pi pi-box text-blue-600 text-2xl"></i>
        </div>
        <div>
          <h2 class="text-xl font-bold text-gray-800 m-0">Gestión de Stock</h2>
          <p class="text-sm text-gray-500 m-0">{{ productoSeleccionado?.nombre || 'Producto' }}</p>
        </div>
      </div>
    </template>

    <!-- Información del Producto -->
    <div class="mb-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
      <div class="grid grid-cols-2 gap-4">
        <div>
          <p class="text-xs text-gray-500 mb-1">Código</p>
          <p class="text-sm font-semibold text-gray-800">{{ productoSeleccionado?.codigo || 'N/A' }}</p>
        </div>
        <div>
          <p class="text-xs text-gray-500 mb-1">Categoría</p>
          <p class="text-sm font-semibold text-gray-800">{{ productoSeleccionado?.categoria || 'N/A' }}</p>
        </div>
      </div>
    </div>

    <!-- Stock Actual -->
    <div class="mb-4">
      <div class="p-5 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border-2 border-green-200 shadow-sm">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="flex items-center justify-center w-12 h-12 bg-green-500 rounded-full shadow-md">
              <i class="pi pi-database text-white text-xl"></i>
            </div>
            <div>
              <p class="text-sm text-gray-600 mb-1">Stock Actual</p>
              <p class="text-3xl font-bold text-green-700">{{ stockproducto || 0 }}</p>
            </div>
          </div>
          <div class="text-right">
            <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
              <i class="pi pi-check-circle mr-1"></i>
              Disponible
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Agregar Stock -->
    <div class="mb-4">
      <label class="block text-sm font-semibold text-gray-700 mb-3">
        <i class="pi pi-plus-circle mr-2 text-blue-600"></i>
        Cantidad a Agregar
      </label>
      <div class="relative">
        <InputNumber
          v-model="nuevostock"
          inputId="nuevostock"
          :min="0"
          :max="999999"
          showButtons
          buttonLayout="horizontal"
          incrementButtonIcon="pi pi-plus"
          decrementButtonIcon="pi pi-minus"
          class="w-full"
          fluid
          :inputStyle="{
            height: '60px',
            fontSize: '1.5rem',
            fontWeight: '600',
            textAlign: 'center',
            borderRadius: '12px'
          }"
          :pt="{
            incrementButton: {
              style: {
                height: '60px',
                width: '60px',
                borderRadius: '12px 0 0 12px'
              }
            },
            decrementButton: {
              style: {
                height: '60px',
                width: '60px',
                borderRadius: '0 12px 12px 0'
              }
            }
          }"
        />
      </div>
      <p class="text-xs text-gray-500 mt-2 flex items-center">
        <i class="pi pi-info-circle mr-1"></i>
        Use los botones + y - o escriba la cantidad directamente
      </p>
    </div>

    <!-- Preview del Nuevo Stock -->
    <div v-if="nuevostock > 0" class="mb-4 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          <i class="pi pi-arrow-right text-purple-600 text-xl"></i>
          <div>
            <p class="text-xs text-gray-600 mb-1">Nuevo Stock Total</p>
            <p class="text-2xl font-bold text-purple-700">{{ Number(stockproducto || 0) + Number(nuevostock || 0) }}</p>
          </div>
        </div>
        <div class="text-right">
          <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
            +{{ nuevostock }}
          </span>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="flex justify-end gap-2">
        <Button
          label="Cancelar"
          icon="pi pi-times"
          severity="secondary"
          outlined
          @click="visibleStock = false"
        />
        <Button
          label="Actualizar Stock"
          icon="pi pi-check"
          severity="success"
          @click="fnActualizarStock"
          :disabled="!nuevostock || nuevostock <= 0"
        />
      </div>
    </template>
  </Dialog>


<Toast />
<LoadingOverlay :visible="loading" />
 <!-- ////////////////////////////////////////////////////////////////////////////////////////// -->
<Dialog
  v-model:visible="visibleBarcode"
  modal
  :style="{ width: '1000px', maxHeight: '90vh' }"
  :dismissableMask="false"
>
  <template #header>
    <div class="flex items-center gap-3">
      <div class="flex items-center justify-center w-12 h-12 bg-indigo-100 rounded-lg">
        <i class="pi pi-barcode text-indigo-600 text-2xl"></i>
      </div>
      <div>
        <h2 class="text-xl font-bold text-gray-800 m-0">Generador de Etiquetas</h2>
        <p class="text-sm text-gray-500 m-0">{{ currentRowData?.nombre || 'Producto' }}</p>
      </div>
    </div>
  </template>

  <div class="grid grid-cols-12 gap-4">
    <!-- Panel Izquierdo: Configuración -->
    <div class="col-span-12 lg:col-span-7">
      <!-- Información del Producto -->
      <div class="mb-4 p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg border border-indigo-200">
        <div class="grid grid-cols-3 gap-3">
          <div>
            <p class="text-xs text-gray-500 mb-1">Código</p>
            <p class="text-sm font-semibold text-gray-800">{{ codigoBarcode || 'N/A' }}</p>
          </div>
          <div>
            <p class="text-xs text-gray-500 mb-1">Texto</p>
            <p class="text-sm font-semibold text-gray-800">{{ textoBarcode || 'N/A' }}</p>
          </div>
          <div>
            <p class="text-xs text-gray-500 mb-1">Precio</p>
            <p class="text-sm font-semibold text-gray-800">{{ Number(precio_ventaProd || 0).toFixed(2) }} DOP</p>
          </div>
        </div>
      </div>

      <!-- Opciones de Visualización -->
      <div class="mb-4 p-4 bg-white rounded-lg border border-gray-200">
        <h3 class="text-sm font-semibold text-gray-700 mb-3 flex items-center">
          <i class="pi pi-eye mr-2 text-indigo-600"></i>
          Opciones de Visualización
        </h3>
        <div class="grid grid-cols-3 gap-3">
          <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <label for="switch-cabecera" class="text-sm font-medium text-gray-700">Cabecera</label>
            <ToggleSwitch v-model="incluirCabecera" inputId="switch-cabecera" />
          </div>
          <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <label for="switch-texto" class="text-sm font-medium text-gray-700">Texto</label>
            <ToggleSwitch v-model="incluirTexto" inputId="switch-texto" />
          </div>
          <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <label for="switch-codigo" class="text-sm font-medium text-gray-700">Código</label>
            <ToggleSwitch v-model="incluirCodigo" inputId="switch-codigo" />
          </div>
          <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <label for="switch-precio" class="text-sm font-medium text-gray-700">Precio</label>
            <ToggleSwitch v-model="incluirPrecio" inputId="switch-precio" />
          </div>
          <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg col-span-2">
            <label for="switch-orientacion" class="text-sm font-medium text-gray-700">Orientación Vertical</label>
            <ToggleSwitch
              :modelValue="orientacion === 'vertical'"
              @update:modelValue="toggleOrientation"
              inputId="switch-orientacion"
            />
          </div>
        </div>
      </div>

      <!-- Dimensiones de Etiqueta -->
      <div class="mb-4 p-4 bg-white rounded-lg border border-gray-200">
        <h3 class="text-sm font-semibold text-gray-700 mb-3 flex items-center">
          <i class="pi pi-arrows-alt mr-2 text-indigo-600"></i>
          Dimensiones de Etiqueta
        </h3>
        <div class="grid grid-cols-3 gap-3">
          <div>
            <label for="labelwidth" class="block text-sm font-medium text-gray-700 mb-2">Ancho</label>
            <InputNumber
              v-model="datosBarcode.labelwidth"
              inputId="labelwidth"
              :min="50"
              :max="500"
              showButtons
              suffix=" mm"
              fluid
            />
          </div>
          <div>
            <label for="labelheight" class="block text-sm font-medium text-gray-700 mb-2">Alto</label>
            <InputNumber
              v-model="datosBarcode.labelheight"
              inputId="labelheight"
              :min="30"
              :max="300"
              showButtons
              suffix=" mm"
              fluid
            />
          </div>
          <div>
            <label for="fontsize" class="block text-sm font-medium text-gray-700 mb-2">Tamaño Fuente</label>
            <InputNumber
              v-model="datosBarcode.fontsize"
              inputId="fontsize"
              :min="8"
              :max="48"
              showButtons
              suffix=" px"
              fluid
            />
          </div>
        </div>
      </div>

      <!-- Configuración de Código de Barras -->
      <div class="mb-4 p-4 bg-white rounded-lg border border-gray-200">
        <h3 class="text-sm font-semibold text-gray-700 mb-3 flex items-center">
          <i class="pi pi-barcode mr-2 text-indigo-600"></i>
          Configuración de Código
        </h3>
        <div class="grid grid-cols-3 gap-3">
          <div class="col-span-3">
            <label for="barcodetype" class="block text-sm font-medium text-gray-700 mb-2">Tipo de Código</label>
            <Dropdown
              v-model="datosBarcode.barcodetype"
              :options="[
                { label: 'Code 128', value: 'CODE128' },
                { label: 'Code 128 A', value: 'CODE128A' },
                { label: 'Code 128 B', value: 'CODE128B' },
                { label: 'Code 39', value: 'CODE39' },
                { label: 'Code 39 E', value: 'CODE39E' },
                { label: 'Code 93', value: 'CODE93' },
                { label: 'EAN 8', value: 'EAN8' },
                { label: 'EAN 13', value: 'EAN13' }
              ]"
              optionLabel="label"
              optionValue="value"
              placeholder="Seleccione tipo de código"
              fluid
            />
          </div>
          <div>
            <label for="barwidth" class="block text-sm font-medium text-gray-700 mb-2">Ancho Barra</label>
            <InputNumber
              v-model="datosBarcode.barwidth"
              inputId="barwidth"
              :min="100"
              :max="500"
              showButtons
              suffix=" px"
              fluid
            />
          </div>
          <div>
            <label for="barheight" class="block text-sm font-medium text-gray-700 mb-2">Alto Barra</label>
            <InputNumber
              v-model="datosBarcode.barheight"
              inputId="barheight"
              :min="50"
              :max="200"
              showButtons
              suffix=" px"
              fluid
            />
          </div>
        </div>
      </div>

      <!-- Márgenes -->
      <div class="mb-4 p-4 bg-white rounded-lg border border-gray-200">
        <h3 class="text-sm font-semibold text-gray-700 mb-3 flex items-center">
          <i class="pi pi-pencil mr-2 text-indigo-600"></i>
          Márgenes
        </h3>
        <div class="grid grid-cols-4 gap-3">
          <div>
            <label for="margen_izq" class="block text-sm font-medium text-gray-700 mb-2">Izquierda</label>
            <InputNumber
              v-model="datosBarcode.margen_izq"
              inputId="margen_izq"
              :min="0"
              :max="50"
              showButtons
              suffix=" px"
              fluid
            />
          </div>
          <div>
            <label for="margen_sup" class="block text-sm font-medium text-gray-700 mb-2">Superior</label>
            <InputNumber
              v-model="datosBarcode.margen_sup"
              inputId="margen_sup"
              :min="0"
              :max="50"
              showButtons
              suffix=" px"
              fluid
            />
          </div>
          <div>
            <label for="margen_der" class="block text-sm font-medium text-gray-700 mb-2">Derecha</label>
            <InputNumber
              v-model="datosBarcode.margen_der"
              inputId="margen_der"
              :min="0"
              :max="50"
              showButtons
              suffix=" px"
              fluid
            />
          </div>
          <div>
            <label for="margen_inf" class="block text-sm font-medium text-gray-700 mb-2">Inferior</label>
            <InputNumber
              v-model="datosBarcode.margen_inf"
              inputId="margen_inf"
              :min="0"
              :max="50"
              showButtons
              suffix=" px"
              fluid
            />
          </div>
        </div>
      </div>

      <!-- Datos de Impresión -->
      <div class="p-4 bg-white rounded-lg border border-gray-200">
        <h3 class="text-sm font-semibold text-gray-700 mb-3 flex items-center">
          <i class="pi pi-pencil mr-2 text-indigo-600"></i>
          Datos de Impresión
        </h3>
        <div class="grid grid-cols-12 gap-3">
          <div class="col-span-5">
            <label for="codigobarcode" class="block text-sm font-medium text-gray-700 mb-2">Código</label>
            <InputText
              v-model="codigoBarcode"
              inputId="codigobarcode"
              placeholder="Ingrese código"
              fluid
            />
          </div>
          <div class="col-span-5">
            <label for="textobarcode" class="block text-sm font-medium text-gray-700 mb-2">Texto</label>
            <InputText
              v-model="textoBarcode"
              inputId="textobarcode"
              placeholder="Ingrese texto"
              fluid
            />
          </div>
          <div class="col-span-2">
            <label for="cantidadbarcode" class="block text-sm font-medium text-gray-700 mb-2">Cantidad</label>
            <InputNumber
              v-model="cantidadBarcode"
              inputId="cantidadbarcode"
              :min="1"
              :max="500"
              showButtons
              fluid
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Panel Derecho: Vista Previa -->
    <div class="col-span-12 lg:col-span-5">
      <div class="p-4 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg border border-gray-200 sticky top-4">
        <h3 class="text-sm font-semibold text-gray-700 mb-3 flex items-center">
          <i class="pi pi-eye mr-2 text-indigo-600"></i>
          Vista Previa en Tiempo Real
        </h3>

        <div class="bg-white p-6 rounded-lg border-2 border-dashed border-gray-300 min-h-[400px] flex flex-col items-center justify-center">
          <!-- Vista previa con el código generado -->
          <div v-if="codigoBarcode" class="flex flex-col items-center gap-4 w-full">
            <!-- Cabecera -->
            <div v-if="incluirCabecera" class="text-center font-bold" :style="{ fontSize: datosBarcode.fontsize + 'px' }">
              {{ datosEmpresa.empresa?.nombre || 'Empresa' }}
            </div>

            <!-- Canvas del código de barras -->
            <canvas
              :id="`barcode-preview-${_uid}`"
              class="max-w-full h-auto"
            ></canvas>

            <!-- Texto del producto -->
            <div v-if="incluirTexto && textoBarcode" class="text-center font-semibold" :style="{ fontSize: (datosBarcode.fontsize - 2) + 'px' }">
              {{ textoBarcode }}
            </div>

            <!-- Precio -->
            <div v-if="incluirPrecio && precio_ventaProd" class="text-center font-bold text-green-700" :style="{ fontSize: datosBarcode.fontsize + 'px' }">
              {{ Number(precio_ventaProd || 0).toFixed(2) }} DOP
            </div>
          </div>

          <!-- Mensaje cuando no hay código -->
          <div v-else class="text-center">
            <i class="pi pi-barcode text-gray-300 text-6xl mb-3"></i>
            <p class="text-gray-400 text-sm">Ingrese un código para ver la vista previa</p>
          </div>
        </div>

        <div class="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <p class="text-xs text-blue-700 flex items-center">
            <i class="pi pi-info-circle mr-2"></i>
            La vista previa se actualiza automáticamente
          </p>
        </div>

        <!-- Contenedor oculto para la generación real -->
        <div id="codigosgenerados" class="hidden"></div>
      </div>
    </div>
  </div>

  <template #footer>
    <div class="flex justify-end gap-2">
      <Button
        label="Cancelar"
        icon="pi pi-times"
        severity="secondary"
        outlined
        @click="visibleBarcode = false"
      />
      <Button
        label="Generar Etiqueta"
        icon="pi pi-check"
        severity="success"
        @click="printBarcode"
      />
    </div>
  </template>
</Dialog>




<Dialog v-model:visible="visibleSwitchInventario" position="top" modal :style="{ width: '50rem' }" header="SwitchInventario">
  <template #header>
    <div class="inline-flex align-items-center justify-content-center gap-2">
      <span class="font-bold white-space-nowrap">Switch Inventario</span>
    </div>
  </template>

  <fieldset class="border p-3 rounded mb-2">
    <legend class="float-none w-auto px-2">Pasar Inventario de una Empresa a Otra</legend>
    <div class="grid grid-cols-12 gap-4">

      <div class="col-span-12 md:col-span-8">
        <label>Producto</label><br>
        <InputText v-model="currentRowData.nombre"  fluid readonly />
      </div>

      <div class="col-span-12 md:col-span-4">
        <label>Cantidad</label><br>
        <InputText v-model="cantidadInventario"  fluid v-solonumeros />
      </div>

      <div class="col-span-12 md:col-span-6">
        <label>Empresa 1</label><br>
        <Select v-model="empresa1" @change="fnTraspasoInventario('empresa1')" fluid :options="empresaData" optionLabel="nombre" placeholder="Empresa 1" />
      </div>
      <div class="col-span-12 md:col-span-6">
        <label>Empresa 2</label><br>
        <Select v-model="empresa2" @change="fnTraspasoInventario('empresa2')" fluid :options="empresaData" optionLabel="nombre" placeholder="Empresa 2" />
      </div>
    </div>
  </fieldset>

  <template #footer>
      <Button label="Pasar Inventario" icon="pi pi-sync" outlined severity="secondary" @click="fnCambiarInventario" />
      <Button label="Cerrar" outlined severity="secondary" @click="visibleSwitchInventario = false" />
  </template>
</Dialog>

<!-- ///////////////////////////////////////////////////////////////////////////////////// -->

<Dialog v-model:visible="visibleImei" position="top" modal :style="{ width: '40rem' }" header="agregarImei">
  <template #header>
    <div class="inline-flex align-items-center justify-content-center gap-2">
      <span class="font-bold white-space-nowrap">Agregar Imei</span>
    </div>
  </template>

  <fieldset class="border p-3 rounded mb-2">
    <legend class="float-none w-auto px-2">Agregar Imei</legend>
    <div class="grid grid-cols-12 gap-4">
      <div class="col-span-12">
              <InputGroup>
                <InputMask id="basic" v-model="imeiModal" @keydown.enter="fnAgregarImei" mask="999999999999999" placeholder="00000000000000000" />
                    <InputGroupAddon>
                       <Button icon="pi pi-trash" severity="secondary" @click="imeiModal = ''" label="Limpiar" variant="text" />
                       <Button icon="pi pi-check" severity="secondary" @click="fnAgregarImei" label="Agregar" variant="text" />
                  </InputGroupAddon>
              </InputGroup>
      </div>

      <div class="col-span-12 md:col-span-6">
        <label class="block mb-1">Precio Compra</label>
        <InputNumber v-model="imeiForm.precio_compra" :min="0" mode="currency" currency="DOP" locale="es-DO" fluid />
      </div>
      <div class="col-span-12 md:col-span-6">
        <label class="block mb-1">Precio Venta</label>
        <InputNumber v-model="imeiForm.precio_venta" :min="0" mode="currency" currency="DOP" locale="es-DO" fluid />
      </div>
      <div class="col-span-12 md:col-span-6">
        <label class="block mb-1">Precio Min</label>
        <InputNumber v-model="imeiForm.precio_min" :min="0" mode="currency" currency="DOP" locale="es-DO" fluid />
      </div>
      <div class="col-span-12 md:col-span-6">
        <label class="block mb-1">Precio x Mayor</label>
        <InputNumber v-model="imeiForm.precio_xmayor" :min="0" mode="currency" currency="DOP" locale="es-DO" fluid />
      </div>

      <div class="col-span-12 md:col-span-6">
        <label class="block mb-1">Proveedor</label>
        <Select
          v-model="imeiForm.proveedor"
          :options="proveedoresArray"
          optionLabel="nombre"
          optionValue="nombre"
          placeholder="Seleccionar proveedor"
          filter
          fluid
        />
      </div>
      <div class="col-span-12 md:col-span-3">
        <label class="block mb-1">Capacidad</label>
        <Select v-model="imeiForm.capacidad" :options="opcionesCapacidadImei" fluid />
      </div>
      <div class="col-span-12 md:col-span-3">
        <label class="block mb-1">Bateria %</label>
        <InputNumber v-model="imeiForm.bateria" :min="0" :max="100" suffix="%" :step="5" fluid />
      </div>



    </div>
  </fieldset>

  <template #footer>
      <Button label="Cerrar" outlined severity="secondary" @click="visibleImei = false" />
  </template>
</Dialog>


<!-- ///////////////////////////////////////////////////////////////////////////////////// -->

<Dialog v-model:visible="visibleListadoImei" position="top" modal :style="{ width: '30rem' }" header="ListadoImei">
  <template #header>
    <div class="inline-flex align-items-center justify-content-center gap-2">
      <span class="font-bold white-space-nowrap">Listado Imei</span>
    </div>
  </template>

  <fieldset class="border p-3 rounded mb-2">
    <legend class="float-none w-auto px-2">Listado Imei</legend>
    <div class="grid grid-cols-1 gap-4">
      <div>
        <ul class="list-disc list-inside space-y-1">
          <li v-for="(imei, index) in listadoImeiSelected" :key="index">
            {{ imei.imei }}
          </li>
        </ul>
      </div>
    </div>
  </fieldset>

  <template #footer>
    <Button label="Cerrar" outlined severity="secondary" @click="visibleListadoImei = false" autofocus />
  </template>
</Dialog>



<!-- ///////////////////////////////////////////////////////////////////////////////////// -->

<!-- Componente de Productos Dañados -->
<ProductosDanados
  v-model:visible="visibleProductosDanados"
  :producto="productoSeleccionadoDanado"
  @refresh="fetchAndSetupData"
/>

<!-- Componente de Productos de Uso Interno -->
<ProductosUsoInterno
  v-model:visible="visibleProductosUsoInterno"
  :producto="productoSeleccionadoUsoInterno"
  @refresh="fetchAndSetupData"
/>

<!-- Componente de impresión PDF -->
<FacturaPdfPrint ref="facturaPdfPrintRef" />

<!-- Diálogo para Pasar Productos a Dañados -->
<Dialog
  v-model:visible="visiblePasarDanados"
  modal
  :header="'Pasar Producto a Dañados'"
  :style="{ width: '50rem' }"
  :dismissableMask="false"
>
  <template #header>
    <div class="flex items-center gap-3">
      <div class="bg-orange-500 rounded-full p-2">
        <i class="pi pi-exclamation-triangle text-white text-xl"></i>
      </div>
      <div>
        <h2 class="text-2xl font-bold text-gray-800 m-0">Pasar a Productos Dañados</h2>
        <p class="text-sm text-gray-500 m-0">{{ productoSeleccionado.nombre }}</p>
      </div>
    </div>
  </template>

  <div class="space-y-4">
    <!-- Información del Producto -->
    <div class="bg-gray-50 p-4 rounded-lg">
      <div class="grid grid-cols-2 gap-3 text-sm">
        <div>
          <span class="font-semibold">Código:</span> {{ productoSeleccionado.codigo || productoSeleccionado.codigo_barra }}
        </div>
        <div>
          <span class="font-semibold">Stock Actual:</span> {{ productoSeleccionado.stock }}
        </div>
        <div class="col-span-2">
          <span class="font-semibold">Categoría:</span> {{ productoSeleccionado.categoria }}
        </div>
      </div>
    </div>

    <!-- Selección de IMEI/Serial (solo para CELULARES y ELECTRODOMESTICOS) -->
    <div v-if="productoSeleccionado.categoria === 'CELULARES' || productoSeleccionado.categoria === 'ELECTRODOMESTICOS'" class="space-y-3">
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">
          Seleccione los IMEI/Seriales a pasar como dañados <span class="text-red-500">*</span>
        </label>
        <div class="border rounded-lg p-3 max-h-64 overflow-y-auto bg-white">
          <div v-if="imeisDanadosDisponibles.length === 0" class="text-center text-gray-500 py-4">
            No hay IMEI/Seriales disponibles
          </div>
          <div v-else class="space-y-2">
            <div v-for="imeiData in imeisDanadosDisponibles" :key="imeiData.id" class="flex items-center p-2 hover:bg-gray-50 rounded">
              <Checkbox
                v-model="imeisDanadosSeleccionados"
                :value="imeiData"
                :inputId="`imei-${imeiData.id}`"
              />
              <label :for="`imei-${imeiData.id}`" class="ml-3 cursor-pointer flex-1">
                <div class="font-medium text-gray-900">{{ imeiData.imei }}</div>
                <div class="text-xs text-gray-500">Fecha: {{ imeiData.fecha }}</div>
              </label>
            </div>
          </div>
        </div>
        <div class="text-sm text-gray-600 mt-2">
          <i class="pi pi-info-circle mr-1"></i>
          Seleccionados: {{ imeisDanadosSeleccionados.length }} de {{ imeisDanadosDisponibles.length }}
        </div>
      </div>

      <div class="flex gap-2">
        <Button
          label="Seleccionar Todos"
          icon="pi pi-check-square"
          severity="secondary"
          outlined
          size="small"
          @click="imeisDanadosSeleccionados = [...imeisDanadosDisponibles]"
          :disabled="imeisDanadosDisponibles.length === 0"
        />
        <Button
          label="Deseleccionar Todos"
          icon="pi pi-stop"
          severity="secondary"
          outlined
          size="small"
          @click="imeisDanadosSeleccionados = []"
        />
      </div>
    </div>

    <!-- Cantidad (solo para otros tipos de productos) -->
    <div v-else>
      <label for="cantidadDanados" class="block text-sm font-medium text-gray-700 mb-2">
        Cantidad a pasar como dañados <span class="text-red-500">*</span>
      </label>
      <InputNumber
        id="cantidadDanados"
        v-model="cantidadPasarDanados"
        :min="1"
        :max="productoSeleccionado.stock || 1"
        showButtons
        class="w-full"
      />
      <small class="text-gray-500">Máximo: {{ productoSeleccionado.stock }}</small>
    </div>

    <!-- Motivo de Baja -->
    <div>
      <label for="motivoDanado" class="block text-sm font-medium text-gray-700 mb-2">
        Motivo de Baja <span class="text-red-500">*</span>
      </label>
      <Select
        id="motivoDanado"
        v-model="motivoDanado"
        :options="['Producto dañado', 'Mal estado', 'Vencido', 'Defectuoso', 'Deteriorado', 'Otro']"
        placeholder="Seleccione motivo"
        class="w-full"
      />
    </div>

    <!-- Descripción del Danio -->
    <div>
      <label for="descripcionDanado" class="block text-sm font-medium text-gray-700 mb-2">
        Descripción del Danio
      </label>
      <Textarea
        id="descripcionDanado"
        v-model="descripcionDanado"
        rows="3"
        placeholder="Describa detalladamente el danio o problema..."
        class="w-full"
      />
    </div>
  </div>

  <template #footer>
    <div class="flex justify-end gap-2">
      <Button
        label="Cancelar"
        icon="pi pi-times"
        severity="secondary"
        outlined
        @click="visiblePasarDanados = false"
      />
      <Button
        label="Pasar a Dañados"
        icon="pi pi-check"
        severity="danger"
        @click="fnProcesarPasarDanados"
        :loading="loading"
      />
    </div>
  </template>
</Dialog>

</main>


</template>
<style>
/* SweetAlert2 z-index fix - debe estar fuera de scoped */
.swal-on-top {
  z-index: 10000 !important;
}
.swal-on-top .swal2-container {
  z-index: 10000 !important;
}
</style>

<style scoped>
@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Main Wrapper */
.productos-wrapper {
  min-height: 100vh;
  background: linear-gradient(135deg, #fff5f0 0%, #ffe8d9 100%);
  padding: 2rem;
}

.productos-container {
  max-width: 1400px;
  margin: 0 auto;
  animation: slideIn 0.5s ease-out;
}

/* Header Section - Orange/Amber Gradient */
.productos-header {
  background: linear-gradient(135deg, #ff6b35 0%, #f7931e 50%, #ffb347 100%);
  border-radius: 20px;
  padding: 2rem;
  margin-bottom: 2rem;
  box-shadow: 0 8px 32px rgba(255, 107, 53, 0.3);
  position: relative;
  overflow: hidden;
}

.productos-header::before {
  content: '';
  position: absolute;
  top: -50%;
  right: -50%;
  width: 200%;
  height: 200%;
  background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%);
  animation: rotate 20s linear infinite;
}

@keyframes rotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.productos-header-content {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.productos-icon-wrapper {
  width: 80px;
  height: 80px;
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
}

.productos-icon {
  font-size: 2.5rem;
  color: white;
}

.productos-title {
  font-size: 2rem;
  font-weight: 700;
  color: white;
  margin: 0;
  text-shadow: 2px 2px 4px rgba(0,0,0,0.1);
}

.productos-subtitle {
  font-size: 1rem;
  color: rgba(255, 255, 255, 0.9);
  margin: 0.25rem 0 0 0;
}

/* Stats Grid */
.productos-stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.productos-stat-card {
  border-radius: 16px;
  border: 2px solid transparent;
  transition: all 0.3s ease;
  overflow: hidden;
}

.productos-stat-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.15);
}

.productos-stat-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem;
}

.productos-stat-label {
  font-size: 0.875rem;
  font-weight: 600;
  color: #64748b;
  margin: 0 0 0.5rem 0;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.productos-stat-value {
  font-size: 2rem;
  font-weight: 700;
  margin: 0;
}

.productos-stat-value-money {
  font-size: 1.5rem;
  font-weight: 700;
  margin: 0;
  color: #059669;
}

.productos-stat-icon-circle {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.75rem;
  color: white;
}

/* Stat Card Variants */
.productos-stat-total {
  background: linear-gradient(135deg, #ff6b35 0%, #ff8c42 100%);
  border-color: #ff8c42;
}

.productos-stat-total .productos-stat-label,
.productos-stat-total .productos-stat-value {
  color: white;
}

.productos-stat-icon-total {
  background: rgba(255, 255, 255, 0.2);
}

.productos-stat-stock {
  background: linear-gradient(135deg, #10b981 0%, #34d399 100%);
  border-color: #34d399;
}

.productos-stat-stock .productos-stat-label,
.productos-stat-stock .productos-stat-value {
  color: white;
}

.productos-stat-icon-stock {
  background: rgba(255, 255, 255, 0.2);
}

.productos-stat-out {
  background: linear-gradient(135deg, #ef4444 0%, #f87171 100%);
  border-color: #f87171;
}

.productos-stat-out .productos-stat-label,
.productos-stat-out .productos-stat-value {
  color: white;
}

.productos-stat-icon-out {
  background: rgba(255, 255, 255, 0.2);
}

.productos-stat-alert {
  background: linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%);
  border-color: #fbbf24;
}

.productos-stat-alert .productos-stat-label,
.productos-stat-alert .productos-stat-value {
  color: white;
}

.productos-stat-icon-alert {
  background: rgba(255, 255, 255, 0.2);
}

.productos-stat-value {
  background: linear-gradient(135deg, #8b5cf6 0%, #a78bfa 100%);
  border-color: #a78bfa;
}

.productos-stat-value .productos-stat-label {
  color: white;
}

.productos-stat-icon-value {
  background: rgba(255, 255, 255, 0.2);
}

/* Section Divider */
.productos-section-divider {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin: 2rem 0;
}

.productos-divider-line {
  flex: 1;
  height: 2px;
  background: linear-gradient(90deg, transparent, #ff8c42, transparent);
}

.productos-divider-content {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1.5rem;
  background: linear-gradient(135deg, #ff6b35, #ff8c42);
  border-radius: 20px;
  color: white;
  font-weight: 600;
  font-size: 0.875rem;
  text-transform: uppercase;
  letter-spacing: 1px;
  box-shadow: 0 4px 12px rgba(255, 107, 53, 0.3);
}

/* Actions Card */
.productos-actions-card {
  margin-bottom: 2rem;
  border-radius: 16px;
  border: 2px solid #ffedd5;
  box-shadow: 0 4px 16px rgba(255, 107, 53, 0.1);
}

.productos-actions-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  padding: 0.5rem;
}

.productos-action-btn {
  border-radius: 10px;
  font-weight: 600;
  transition: all 0.3s ease;
  border-width: 2px;
}

.productos-action-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
}

.productos-delete-all {
  margin-left: auto;
}

/* Filters Card */
.productos-filters-card {
  margin-bottom: 2rem;
  border-radius: 16px;
  border: 2px solid #ffedd5;
  box-shadow: 0 4px 16px rgba(255, 107, 53, 0.1);
}

.productos-filters-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  padding: 0.5rem;
}

.productos-filter-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.productos-search-field {
  position: relative;
}

.productos-filter-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 600;
  color: #ff6b35;
  font-size: 0.875rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.productos-filter-select,
.productos-filter-dropdown,
.productos-search-input {
  border: 2px solid #ffedd5;
  border-radius: 10px;
  transition: all 0.3s ease;
}

.productos-filter-select:focus,
.productos-filter-dropdown:focus,
.productos-search-input:focus {
  border-color: #ff8c42;
  box-shadow: 0 0 0 3px rgba(255, 140, 66, 0.1);
}

.productos-clear-search-btn {
  position: absolute;
  right: 0.35rem;
  top: 50%;
  transform: translateY(-50%);
  z-index: 2;
  width: 1.9rem;
  height: 1.9rem;
}

.productos-search-input {
  padding-right: 2.2rem;
}

/* Table Card */
.productos-table-card {
  border-radius: 16px;
  border: 2px solid #ffedd5;
  box-shadow: 0 4px 16px rgba(255, 107, 53, 0.1);
}

.productos-datatable {
  border-radius: 12px;
  overflow: hidden;
}

/* Price Badges */
.productos-price {
  font-weight: 600;
  color: #059669;
}

.productos-price-min {
  font-weight: 600;
  color: #dc2626;
}

.productos-price-mayor {
  font-weight: 600;
  color: #7c3aed;
}

.productos-ganancia {
  font-weight: 600;
  color: #0891b2;
}

/* Row Colors */
.row-red {
  color: #dc2626 !important;
  font-weight: 600;
}

.row-yellow {
  color: #f59e0b !important;
  font-weight: 600;
}

.row-green {
  color: #059669 !important;
  font-weight: 600;
}

/* Responsive */
@media (max-width: 768px) {
  .productos-wrapper {
    padding: 1rem;
  }

  .productos-header {
    padding: 1.5rem;
  }

  .productos-title {
    font-size: 1.5rem;
  }

  .productos-icon-wrapper {
    width: 60px;
    height: 60px;
  }

  .productos-icon {
    font-size: 2rem;
  }

  .productos-stats-grid {
    grid-template-columns: 1fr;
  }

  .productos-actions-grid {
    flex-direction: column;
  }

  .productos-action-btn {
    width: 100%;
  }

  .productos-filters-grid {
    grid-template-columns: 1fr;
  }
}
</style>
