<script setup>
import { ref, onMounted, nextTick, watchEffect, watch, computed,onBeforeUnmount } from 'vue';
import { useToast } from "primevue/usetoast";
import { useRouter,useRoute } from 'vue-router';
import { useI18n } from 'vue-i18n';
const { t } = useI18n();
const router = useRouter();
import OptionButtonTM from '@/components/OptionButtomTM.vue';
import Awesomplete from '@/components/Awesomplete.vue';
const route = useRoute();
import {enviarDatosPorPost,
  eliminarDatos,
  obtenerIdsSeleccionados,
  borrarTodoslosDatos,
  lenguajeDataTable,
  nfecha,
  arrayToObjetoFromTabla,
  peticionesFetch,
  encryptarPassword,
  envioElectron,
  peticiones,
  enviarSolicitudGet,
  generarCodigoUnico,
  generarTablaFromStringJSON,
  mensajetoast,
  buscadorArrayObjeto,
  peticionesFetchOffline,
  sincronizarStockProductoPorImeiDisponible,
  esObjeto,
  lasMayusculas} from '@/funciones/funciones.js';
import Swal from 'sweetalert2'
const toast = useToast();
/************************************************************************/
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
/************************************************************************/
import TablaJSON from '@/components/TablaJSON.vue'
import Button from 'primevue/button';
import FileManager from '@/components/FileManagerTM.vue';
/************************************************************************/
const incluirCabecera = ref(true);
const incluirTexto = ref(true);
const incluirCodigo = ref(true);
const incluirOtro = ref(false);
const incluirPrecio = ref(true);
/************************************************************************/
const position = 'top'
/************************************************************************/
import {useDatosEmpresa} from '../../stores'
const datosEmpresa = useDatosEmpresa();
const link = ref(null);
const api = ref(null);
const token = ref(null);
const patronTelefono = ref(null);
const linkImpresora = ref(null);
const patroncedula = ref(null);
const tokenCifrado = ref(null);
const tokenCorto = ref(null);
const datosJSON = ref([]);
/************************************************************************/
const rutaIMAGEN = ref('')
const urlIMAGEN = ref(null)
const fileUpload = ref(null);
const arrayIMG = ref([])
const datosDefault = ref({})
/************************************************************************/
const cantidadBarcode = ref(1)
/************************************************************************/
const datosConfiguracion = ref({});
const addImpuestos = ref('Sin Imp');
const optionsImpuestos = ref(['Sin Imp','Incluido','Agregado'])
/************************************************************************/
const datoscampos = ref({})
const codigoUnico = ref(generarCodigoUnico());
const fecha = ref(nfecha('fecha'));
const todosLosProductos = ref([]);
const agregarCategoria = ref('');
const agregarMarca = ref('');
/************************************************************************/
const categorias = ref([]);
const proveedores = ref([]);
const marcas = ref([]);
const visibleAgregarCategoria = ref(false)
const visibleProveedor = ref(false)
const visibleAgregarMarca = ref(false)
const esCelular = ref(false)
const activarArrows = ref(false)
/************************************************************************/
const proveedor = ref({});
const empresas = ref([]);
/************************************************************************/
const visibleBarcode = ref(false)
const visibleIMEI = ref(false)
const visibleCambiarPreciosIMEI = ref(false)
const nuevosPrecios = ref({ precio_compra: 0, precio_venta: 0, precio_min: 0, precio_xmayor: 0 })
const opcionesCapacidad = ref(['32GB', '64GB', '128GB', '256GB', '512GB', '1TB', '2TB'])
const opcionesBateria = ref(Array.from({ length: 21 }, (_, i) => i * 5))
/************************************************************************/
const tipoProducto = ref('PRODUCTO');
const seVendePor = ref('UNIDAD');
const empaques = ref([]);
const empaquesNombre = ref([]);
const datosBarcode = ref({});
const codigoBarcode = ref('');
const textoBarcode = ref('');
const nuevoIMEI = ref('');
const nuevoIMEIPrecios = ref({
  precio_compra: null,
  precio_venta: null,
  precio_min: null,
  precio_xmayor: null
});
const nuevoIMEIProveedor = ref('');
const nuevaCapacidadIMEI = ref('64GB');
const detallesIMEI = ref('');
const imeiList = ref([]);
const imeiProductoList = ref([]);
const imeiProductoLoading = ref(false);
const selectedIMEI = ref();
const listaBuscador = ref([]);
const awesompleteproductoprincipal = ref('');
const orientacion = ref('vertical');
/************************************************************************/
const esRespuestaOk = (respuesta) => {
  if (typeof respuesta === 'number') return respuesta >= 0;
  if (Array.isArray(respuesta)) return respuesta[0] === 'ok';
  if (typeof respuesta === 'string') return respuesta.toLowerCase() === 'ok';
  if (respuesta && typeof respuesta === 'object') {
    if (Object.prototype.hasOwnProperty.call(respuesta, 0) || Object.prototype.hasOwnProperty.call(respuesta, '0')) {
      return String(respuesta[0] || respuesta['0']).toLowerCase() === 'ok';
    }
    if (typeof respuesta.status === 'string' && ['ok', 'success'].includes(respuesta.status.toLowerCase())) return true;
    if (typeof respuesta.message === 'string' && ['ok', 'success'].includes(respuesta.message.toLowerCase())) return true;
    if (typeof respuesta.changes === 'number') return respuesta.changes >= 0;
    if (typeof respuesta.affectedRows === 'number') return respuesta.affectedRows >= 0;
  }
  return respuesta.ok === true || respuesta.success === true;
};
/************************************************************************/
const normalizarProveedor = (proveedor) => {
  if (esObjeto(proveedor)) return proveedor.nombre || '';
  return proveedor || '';
};
/************************************************************************/
const fetchAllData = async () => {
/*    const response = await enviarSolicitudGet(`${link.value+api.value}/datosarray/productos`,tokenCifrado.value);*/
    const response = await peticionesFetchOffline('getDataAsArray', 'productos');

    const jsonData = response;
    todosLosProductos.value = jsonData;
    datoscampos.value = jsonData.find(datos=>datos.id == route.params.id)
    if (datoscampos.value.imagen == '') {
        datoscampos.value.imagen = generarCodigoUnico();
        funcionActualizar()
    }

    const arraybuscador = response.flatMap(item => {
      return Object.keys(item)
        .filter(key => ['codigo', 'codigo_barra', 'nombre'].includes(key))
        .map(key => item[key]);
    });

    //arraybuscador.push(...combosArray.value.flatMap(combo => combo.nombre  [combo.nombre] : []));

    listaBuscador.value = arraybuscador;


    addImpuestos.value = datoscampos.value.tipo_impuesto;
    //rutaIMAGEN.value = 'productos/'+datoscampos.value.imagen;
    //arrayIMG.value = await peticiones(link.value+api.value+'/peticionimagenes',{"directorio":`${rutaIMAGEN.value}`},'POST',tokenCifrado.value)

    datoscampos.value.caracteristicas = JSON.parse(datoscampos.value.caracteristicas)
    rutaIMAGEN.value = `../vista/img/productos/${datoscampos.value.imagen}`;

   // arrayIMG.value = await peticionesFetchOffline('listarArchivosDeCarpeta', `productos/${datoscampos.value.imagen}`);
     //arrayIMG.value = await peticionesFetchOffline('listarArchivosDeCarpeta', `productos/${datoscampos.value.imagen}`);

};
/************************************************************************/
const verificaCodigo = async (producto) => {
    if (producto.codigo) {
        let codigoStr = producto.codigo.toString();
        if (codigoStr.length < 3) {
            codigoStr = codigoStr.padStart(3, '0');
            datoscampos.value.codigo = codigoStr
            datoscampos.value.codigo_barra = codigoStr
            await funcionActualizar();
        }
        //producto.codigo = codigoStr;
    }
};
/************************************************************************/
async function navigate(action) {
    // Limpiar imagenes
    arrayIMG.value = '';

    // Verificar que la lista de productos existe y no esta vacia
    if (!todosLosProductos.value || !Array.isArray(todosLosProductos.value) || todosLosProductos.value.length === 0) {
        console.error('La lista de productos no es valida o esta vacia.');
        return;
    }

    // Obtener el indice actual basado en el ID del producto
    const currentIndex = todosLosProductos.value.findIndex(producto => producto.id == route.params.id);
    if (currentIndex === -1) {
        console.error('No se encontro el producto actual en la lista.');
        return;
    }

    // Determinar el nuevo indice basado en la accion
    let newIndex;
    switch (action) {
        case 'primero':
            newIndex = 0;
            break;
        case 'anterior':
            newIndex = currentIndex > 0 ? currentIndex - 1 : 0;
            break;
        case 'siguiente':
            newIndex = currentIndex + 1 < todosLosProductos.value.length ? currentIndex + 1 : currentIndex;
            break;
        case 'ultimo':
            newIndex = todosLosProductos.value.length - 1;
            break;
        default:
            return;
    }


    // Obtener el producto seleccionado
    const productoSeleccionado = todosLosProductos.value[newIndex];
    if (!productoSeleccionado) {
        return;
    }

    // Actualizar el estado del producto seleccionado
    datoscampos.value = productoSeleccionado;

    // Determinar el tipo de producto
    if (productoSeleccionado.categoria === 'CELULARES') {
        tipoProducto.value = 'CELULARES';
        await fechDataIMEI();
        esCelular.value = true;
    } else if (productoSeleccionado.empaque === 'INFINITO') {
        tipoProducto.value = 'SERVICIO';
    } else if (productoSeleccionado.categoria === 'PREPARADO') {
        tipoProducto.value = 'PREPARADO';
    } else {
        esCelular.value = false;
    }

    // Actualizar impuestos
    addImpuestos.value = productoSeleccionado.tipo_impuesto;
    datoscampos.value.caracteristicas = JSON.parse(datoscampos.value.caracteristicas)
    // Manejar imagenes
    if (!productoSeleccionado.imagen) {
        productoSeleccionado.imagen = generarCodigoUnico();
        funcionActualizar();
    }
    rutaIMAGEN.value = `../vista/img/productos/${productoSeleccionado.imagen}`;

if (todosLosProductos.value.length < 1000) {

   // Verificar o crear directorio de imagenes
      //arrayIMG.value = await peticionesFetchOffline('listarArchivosDeCarpeta', `productos/${datoscampos.value.imagen}`);

   }

    router.push({ path: `/editarproductos/${productoSeleccionado.id}` });
    await verificaCodigo(productoSeleccionado)
}


/************************************************************************/
const fetchDataEmpresas = async () => {
  try {
/*   const response = await peticionesFetch(`${link.value}${api.value}`,'datosarraypost',{'tabla':'empaques'},tokenCifrado.value,'POST');*/
   const response = await peticionesFetchOffline('getDataAsArray', 'empresa');
    empresas.value = response.map(emp=>emp.nombre);
    /*********************************************/
  } catch (error) {
    console.error('Error fetching data', error);
    toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to fetch data', life: 3000 });
  }
};
/************************************************************************/
const fetchDataBarcode = async () => {
/*const response = await peticionesFetch(`${link.value}${api.value}`,`datoscampo/barcode/id/1`,{},tokenCifrado.value,'GET');*/
const response = await peticionesFetchOffline('getDataByField', 'barcode','id',1);
    const jsonData = response;
    datosBarcode.value = jsonData;
};
/************************************************************************/
const fetchDataEmpaques = async () => {
  try {
/*   const response = await peticionesFetch(`${link.value}${api.value}`,'datosarraypost',{'tabla':'empaques'},tokenCifrado.value,'POST');*/
   const response = await peticionesFetchOffline('getDataAsArray', 'empaques');
    empaques.value = response;
    empaquesNombre.value = response.map(empaque=>empaque.nombre);
    /*********************************************/
  } catch (error) {
    console.error('Error fetching data', error);
    toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to fetch data', life: 3000 });
  }
};
/************************************************************************/
const fetchDataCategorias = async () => {
  try {
/*   const response = await peticionesFetch(`${link.value}${api.value}`,'datosarraypost',{'tabla':'categorias'},tokenCifrado.value,'POST');*/
   const response = await peticionesFetchOffline('getDataAsArray', 'categorias');
    categorias.value = response;
    /*********************************************/
  } catch (error) {
    console.error('Error fetching data', error);
    toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to fetch data Categorias', life: 3000 });
  }
};
/************************************************************************/
const fetchDataProveedores = async () => {
  try {
/*   const response = await peticionesFetch(`${link.value}${api.value}`,'datosarraypost',{'tabla':'proveedores'},tokenCifrado.value,'POST');*/
   const response = await peticionesFetchOffline('getDataAsArray', 'proveedores');
    proveedores.value = response;
    /*********************************************/
  } catch (error) {
    console.error('Error fetching data', error);
    toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to fetch data Proveedores', life: 3000 });
  }
};
/************************************************************************/
const fetchDataMarcas = async () => {
  try {
/*   const response = await peticionesFetch(`${link.value}${api.value}`,'datosarraypost',{'tabla':'marcas'},tokenCifrado.value,'POST');*/
      const response = await peticionesFetchOffline('getDataAsArray', 'marcas');
    marcas.value = response;
    /*********************************************/
  } catch (error) {
    console.error('Error fetching data', error);
    toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to fetch data Marcas', life: 3000 });
  }
};
/************************************************************************/
const handleKeyDown = (event) => {
  // Guardar con Ctrl + S
  if (event.ctrlKey && event.key === 's') {
    event.preventDefault(); // Evita la accion predeterminada del navegador (guardar pagina)
    funcionActualizar(); // Llama a la funcion de guardar
    return;
  }

  // Verifica si `activarArrows` esta activado antes de procesar flechas
  if (activarArrows.value) {
    switch (event.key) {
      case 'ArrowRight': // Navegar a siguiente
        event.preventDefault();
        navigate('siguiente');
        break;
      case 'ArrowLeft': // Navegar a anterior
        event.preventDefault();
        navigate('anterior');
        break;
      case 'ArrowUp': // Navegar al primero
        event.preventDefault();
        navigate('primero');
        break;
      case 'ArrowDown': // Navegar al ultimo
        event.preventDefault();
        navigate('ultimo');
        break;
      default:
        break;
    }
  }
};


/************************************************************************/
const datosConfig = async()=>{
const response = await envioElectron('datosarchivo');
datosJSON.value = response;
link.value = datosJSON.value.VITE_LINKURL;
api.value = datosJSON.value.VITE_LINK_API;
token.value = datosJSON.value.VITE_TOKEN;
patronTelefono.value = datosJSON.value.VITE_PATRON_TELEFONO;
linkImpresora.value = datosJSON.value.VITE_IMPRESORA_LOCAL;
patroncedula.value = datosJSON.value.VITE_PATRON_CEDULA;
tokenCorto.value = datosJSON.value.VITE_TOKEN_CORTO;
}
/************************************************************************/
onMounted(async() => {

await datosConfig()

tokenCifrado.value = await encryptarPassword(token.value, 10);
datosConfiguracion.value = JSON.parse(window.localStorage.getItem('configuracion')) || {}
datosDefault.value = JSON.parse(window.localStorage.getItem('tabladefault')) || {}
await fetchDataEmpresas();
await fetchDataCategorias();
await fetchDataProveedores();
await fetchDataMarcas();
await fetchAllData();
await fetchDataBarcode();
await fetchDataEmpaques();

if (datoscampos.value.categoria === 'CELULARES') {
       await fetchIMEIByProductoId(datoscampos.value.id);
       esCelular.value = true
    }else{
       esCelular.value = false
    }

rutaIMAGEN.value = '../vista/img/productos/'+datoscampos.value.imagen;
urlIMAGEN.value = link.value+api.value+"/subirunaimagen2";

window.addEventListener('keydown', handleKeyDown);

});
/************************************************************************/
onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleKeyDown);
});
/************************************************************************/
// =============== FUNCIONES DE GESTION DE IMEI ===============
const fetchIMEIByProductoId = async (productoId) => {
  if (!productoId) {
    imeiProductoList.value = [];
    imeiList.value = [];
    return;
  }

  imeiProductoLoading.value = true;
  try {
    const response = await peticionesFetchOffline('getDataArrayByTwoConditions', 'imei', 'id_equi', productoId, 'estado', 'DISPONIBLE');
    imeiProductoList.value = Array.isArray(response) ? response : [];
    imeiList.value = [...imeiProductoList.value];
  } catch (error) {
    imeiProductoList.value = [];
    imeiList.value = [];
  } finally {
    imeiProductoLoading.value = false;
  }
};

const imeiEditableFields = new Set(['precio_compra', 'precio_venta', 'precio_min', 'precio_xmayor', 'bateria', 'capacidad']);

const onImeiCellEditComplete = async (event) => {
  const { data, newValue, field, value } = event;
  if (!imeiEditableFields.has(field)) {
    return;
  }

  if (newValue === value) {
    return;
  }

  data[field] = newValue || '';

  // Recalcular ganancia si se modifico algun precio relevante
  if (field === 'precio_venta' || field === 'precio_compra') {
    data.ganancia = Number(data.precio_venta || 0) - Number(data.precio_compra || 0);
  }

  if (data.hasOwnProperty('updated_at')) {
    data.updated_at = nfecha('timestamp');
  }

  const result = await peticionesFetchOffline('updateData', 'imei', JSON.stringify(data));
  if (esRespuestaOk(result)) {
    toast.add({ severity: 'success', summary: 'Éxito', detail: 'IMEI actualizado', life: 2000 });
    return;
  }

  data[field] = value;
  toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo actualizar el IMEI', life: 3000 });
};

const onProveedorImeiChange = async (imeiData, nombreProveedor) => {
  const anterior = imeiData.proveedor;
  imeiData.proveedor = nombreProveedor;
  if (imeiData.hasOwnProperty('updated_at')) {
    imeiData.updated_at = nfecha('timestamp');
  }
  const result = await peticionesFetchOffline('updateData', 'imei', JSON.stringify(imeiData));
  if (esRespuestaOk(result)) {
    toast.add({ severity: 'success', summary: 'Éxito', detail: 'Proveedor actualizado', life: 2000 });
  } else {
    imeiData.proveedor = anterior;
    toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo actualizar el proveedor', life: 3000 });
  }
};

const onCapacidadImeiChange = async (imeiData, nuevaCapacidad) => {
  const anterior = imeiData.capacidad;
  imeiData.capacidad = nuevaCapacidad;
  if (imeiData.hasOwnProperty('updated_at')) {
    imeiData.updated_at = nfecha('timestamp');
  }
  const result = await peticionesFetchOffline('updateData', 'imei', JSON.stringify(imeiData));
  if (esRespuestaOk(result)) {
    toast.add({ severity: 'success', summary: 'Éxito', detail: 'Capacidad actualizada', life: 2000 });
  } else {
    imeiData.capacidad = anterior;
    toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo actualizar la capacidad', life: 3000 });
  }
};

const onBateriaImeiChange = async (imeiData, nuevaBateria) => {
  const anterior = Number(imeiData.bateria || 100);
  const bateria = Math.max(0, Math.min(100, Number(nuevaBateria || anterior)));
  imeiData.bateria = bateria;
  if (imeiData.hasOwnProperty('updated_at')) {
    imeiData.updated_at = nfecha('timestamp');
  }
  const result = await peticionesFetchOffline('updateData', 'imei', JSON.stringify(imeiData));
  if (esRespuestaOk(result)) {
    toast.add({ severity: 'success', summary: 'Exito', detail: 'Bateria actualizada', life: 2000 });
  } else {
    imeiData.bateria = anterior;
    toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo actualizar la batería', life: 3000 });
  }
};

const onEstadoImeiChange = async (imeiData, nuevoEstado) => {
  const anterior = imeiData.estado;
  imeiData.estado = nuevoEstado;
  if (imeiData.hasOwnProperty('updated_at')) {
    imeiData.updated_at = nfecha('timestamp');
  }
  const result = await peticionesFetchOffline('updateData', 'imei', JSON.stringify(imeiData));
  if (esRespuestaOk(result)) {
    toast.add({ severity: 'success', summary: 'Éxito', detail: `Estado cambiado a ${nuevoEstado}`, life: 2000 });
  } else {
    imeiData.estado = anterior;
    toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo cambiar el estado', life: 3000 });
  }
};

const eliminarImeiDeProducto = async (imeiData, index) => {
  const { value: password } = await Swal.fire({
    title: `Eliminar IMEI`,
    html: `<p>IMEI: <strong>${imeiData.imei}</strong></p><p>Introduce la contrasena para confirmar.</p>`,
    input: 'password',
    inputPlaceholder: 'Contraseña',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Eliminar',
    cancelButtonText: 'Cancelar',
    confirmButtonColor: '#dc2626'
  });
  if (!password) return;
  if (password !== token.value && password !== tokenCorto.value) {
    toast.add({ severity: 'error', summary: 'Error', detail: 'Contraseña incorrecta', life: 3000 });
    return;
  }
  const result = await peticionesFetchOffline('deleteEntry', 'imei', imeiData.id);
  if (esRespuestaOk(result)) {
    imeiProductoList.value.splice(index, 1);
    datoscampos.value.stock = Math.max(0, (Number(datoscampos.value.stock) || 0) - 1);
    await funcionActualizar();
    toast.add({ severity: 'success', summary: 'Eliminado', detail: 'IMEI eliminado correctamente', life: 2000 });
  } else {
    toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo eliminar el IMEI', life: 3000 });
  }
};

const fnEliminarImeisPorProducto = async () => {
  if (!datoscampos.value.id) return;

  const decision = await Swal.fire({
    title: 'Eliminar IMEI del producto',
    text: 'Selecciona que IMEI deseas eliminar.',
    icon: 'warning',
    showCancelButton: true,
    showDenyButton: true,
    confirmButtonText: 'Todos',
    denyButtonText: 'Solo DISPONIBLE',
    cancelButtonText: 'Cancelar',
    confirmButtonColor: '#dc2626'
  });

  if (!decision.isConfirmed && !decision.isDenied) return;

  const soloDisponibles = decision.isDenied;
  const listaObjetivo = soloDisponibles
    ? await peticionesFetchOffline('getDataArrayByTwoConditions', 'imei', 'id_equi', datoscampos.value.id, 'estado', 'DISPONIBLE')
    : await peticionesFetchOffline('getDataArrayByCondition', 'imei', 'id_equi', datoscampos.value.id);

  const imeisObjetivo = Array.isArray(listaObjetivo) ? listaObjetivo : [];
  if (imeisObjetivo.length === 0) {
    toast.add({
      severity: 'info',
      summary: 'Sin IMEI',
      detail: soloDisponibles ? 'No hay IMEI DISPONIBLE para eliminar' : 'No hay IMEI relacionados a este producto',
      life: 2500
    });
    return;
  }

  const confirmacionFinal = await Swal.fire({
    title: 'Confirmar eliminacion',
    text: `Se eliminaran ${imeisObjetivo.length} IMEI(s) ${soloDisponibles ? 'DISPONIBLE' : 'relacionados al producto'}.`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Eliminar',
    cancelButtonText: 'Cancelar',
    confirmButtonColor: '#dc2626'
  });

  if (!confirmacionFinal.isConfirmed) return;

  let eliminados = 0;
  for (const imei of imeisObjetivo) {
    const borrado = await peticionesFetchOffline('deleteEntry', 'imei', imei.id);
    if (esRespuestaOk(borrado)) eliminados++;
  }

  await fechDataIMEI();
  await fetchIMEIByProductoId(datoscampos.value.id);
  await funcionActualizar();

  toast.add({
    severity: eliminados > 0 ? 'success' : 'warn',
    summary: eliminados > 0 ? 'Eliminado' : 'Sin cambios',
    detail: `${eliminados} IMEI(s) eliminados`,
    life: 3000
  });
};

const fnAbrirCambiarPreciosIMEI = async () => {
  const result = await Swal.fire({
    title: 'Introduce la contrasena',
    input: 'password',
    inputPlaceholder: 'Contraseña',
    showCancelButton: true,
    confirmButtonText: 'Continuar',
    cancelButtonText: 'Cancelar'
  });
  if (!result.isConfirmed) return;
  if (result.value !== token.value && result.value !== tokenCorto.value) {
    toast.add({ severity: 'error', summary: 'Error', detail: 'Contraseña incorrecta', life: 3000 });
    return;
  }
  nuevosPrecios.value = {
    precio_compra: parseFloat(datoscampos.value.precio_compra) || null,
    precio_venta: parseFloat(datoscampos.value.precio_venta) || null,
    precio_min: parseFloat(datoscampos.value.precio_min) || null,
    precio_xmayor: parseFloat(datoscampos.value.precio_xmayor) || null,
  };
  visibleCambiarPreciosIMEI.value = true;
};

const fnAplicarPreciosATodosIMEI = async () => {
  if (imeiProductoList.value.length === 0) {
    toast.add({ severity: 'warn', summary: 'Sin IMEIs', detail: 'No hay IMEIs cargados', life: 2000 });
    return;
  }
  let actualizados = 0;
  for (const imei of imeiProductoList.value) {
    if (nuevosPrecios.value.precio_compra != null) imei.precio_compra = nuevosPrecios.value.precio_compra;
    if (nuevosPrecios.value.precio_venta != null) imei.precio_venta = nuevosPrecios.value.precio_venta;
    if (nuevosPrecios.value.precio_min != null) imei.precio_min = nuevosPrecios.value.precio_min;
    if (nuevosPrecios.value.precio_xmayor != null) imei.precio_xmayor = nuevosPrecios.value.precio_xmayor;
    // Siempre recalcular ganancia con los precios actuales del IMEI
    imei.ganancia = Number(imei.precio_venta || 0) - Number(imei.precio_compra || 0);
    if (imei.hasOwnProperty('updated_at')) imei.updated_at = nfecha('timestamp');
    const result = await peticionesFetchOffline('updateData', 'imei', JSON.stringify(imei));
    if (esRespuestaOk(result)) actualizados++;
  }
  toast.add({ severity: 'success', summary: 'Éxito', detail: `${actualizados} IMEI(s) actualizados`, life: 3000 });
  visibleCambiarPreciosIMEI.value = false;
};

const mostrarDetallesImei = (data) => {
  if (!data) return;
  const orden = [
    'imei',
    'estado',
    'equipo',
    'id_equi',
    'proveedor',
    'precio_compra',
    'precio_venta',
    'precio_min',
    'precio_xmayor',
    'no_compra',
    'fecha',
    'detalles',
    'almacen'
  ];

  const formatoMoneda = (v) =>
    v === null || v === undefined || v === '' ? '' : `RD$ ${Number(v).toFixed(2)}`;

  const etiquetas = {
    imei: 'IMEI',
    estado: 'Estado',
    equipo: 'Equipo',
    id_equi: 'ID Producto',
    proveedor: 'Proveedor',
    precio_compra: 'Precio Compra',
    precio_venta: 'Precio Venta',
    precio_min: 'Precio Min',
    precio_xmayor: 'Precio x Mayor',
    no_compra: 'No. Compra',
    fecha: 'Fecha',
    detalles: 'Detalles',
    almacen: 'Almacen'
  };

  const filas = orden
    .filter((key) => key in data)
    .map((key) => {
      const valor =
        ['precio_compra', 'precio_venta', 'precio_min', 'precio_xmayor'].includes(key)
          ? formatoMoneda(data[key])
          : (data[key] || '');
      return `
        <div class="imei-row">
          <div class="imei-label">${etiquetas[key] || key}</div>
          <div class="imei-value">${valor}</div>
        </div>
      `;
    })
    .join('');

  Swal.fire({
    title: 'Detalles IMEI',
    html: `<div class="imei-details-container">${filas}</div>`,
    width: '600px',
    confirmButtonText: 'Cerrar',
    customClass: {
      popup: 'imei-details-popup',
      title: 'imei-details-title'
    }
  });
};

const fnAgregarIMEI = async () => {
  if (nuevoIMEI.value == '') {
    toast.add({ severity: 'error', summary: 'Error', detail: 'Debes agregar un IMEI', life: 3000 });
    return;
  }

  if (datoscampos.value.categoria != "CELULARES") {
    toast.add({ severity: 'error', summary: 'Error', detail: 'EL PRODUCTO NO TIENE LA CATEGORIA CELULARES', life: 3000 });
    return;
  }

  const verificaIMEI = await peticionesFetchOffline('getDataByField', 'imei', 'imei', nuevoIMEI.value);

  if (verificaIMEI && typeof verificaIMEI === 'object' && !Array.isArray(verificaIMEI)) {
    toast.add({ severity: 'error', summary: 'Error', detail: 'ESTE IMEI YA ESTA REGISTRADO', life: 3000 });
    nuevoIMEI.value = '';
    detallesIMEI.value = `ALMACENAMIENTO:
BATERIA TESTEADA: si
BATERIA QUE MARCA: original
DETALLES ESTETICOS: Ninguno
DETALLES INTERNOS: Ninguno
BATERIA MARCA: 100%`;
    return;
  }

  const datoscamposImei = await arrayToObjetoFromTabla('imei');
  const obtenerPrecioModal = (campo) => {
    const valorModal = Number(nuevoIMEIPrecios.value[campo]);
    if (Number.isFinite(valorModal)) return valorModal;
    const valorProducto = Number(datoscampos.value[campo]);
    return Number.isFinite(valorProducto) ? valorProducto : 0;
  };

  datoscamposImei.imei = nuevoIMEI.value;
  datoscamposImei.equipo = datoscampos.value.nombre;
  datoscamposImei.id_equi = datoscampos.value.id;
  datoscamposImei.proveedor = normalizarProveedor(nuevoIMEIProveedor.value) || normalizarProveedor(datoscampos.value.proveedor);
  datoscamposImei.precio_compra = obtenerPrecioModal('precio_compra');
  datoscamposImei.precio_venta = obtenerPrecioModal('precio_venta');
  datoscamposImei.precio_min = obtenerPrecioModal('precio_min');
  datoscamposImei.precio_xmayor = obtenerPrecioModal('precio_xmayor');
  datoscamposImei.bateria = 100;
  datoscamposImei.capacidad = nuevaCapacidadIMEI.value || '64GB';
  datoscamposImei.no_compra = datoscampos.value.no_compra;
  datoscamposImei.estado = 'DISPONIBLE';
  datoscamposImei.fecha = nfecha('fecha');
  datoscamposImei.detalles = detallesIMEI.value;
  datoscamposImei.almacen = datosEmpresa.empresa.nombre;

  if (datoscamposImei.hasOwnProperty('created_at')) {
    datoscamposImei.created_at = nfecha('timestamp');
    datoscamposImei.updated_at = nfecha('timestamp');
  }

  const envioDatos = await peticionesFetchOffline('insertData', 'imei', JSON.stringify(datoscamposImei));
  if (esRespuestaOk(envioDatos)) {
    const resultadoSync = await sincronizarStockProductoPorImeiDisponible(datoscampos.value.id);
    if (resultadoSync.success) {
      datoscampos.value.stock = Number(resultadoSync.stock || datoscampos.value.stock || 0);
    } else {
      datoscampos.value.stock = (Number(datoscampos.value.stock) || 0) + 1;
    }
    await funcionActualizar();
    toast.add({ severity: 'success', summary: t('Success'), detail: t('IMEI added'), life: 3000 });
    nuevoIMEI.value = '';
    detallesIMEI.value = `ALMACENAMIENTO:
BATERIA TESTEADA: si
BATERIA QUE MARCA: original
DETALLES ESTETICOS: Ninguno
DETALLES INTERNOS: Ninguno
BATERIA MARCA: 100%`;

    if (datoscamposImei.estado === 'DISPONIBLE') {
      imeiProductoList.value = [...imeiProductoList.value, { ...datoscamposImei }];
    }
    setTimeout(() => {
      fetchIMEIByProductoId(datoscampos.value.id);
    }, 300);
    visibleIMEI.value = false;
  } else {
    toast.add({ severity: 'error', summary: 'Error', detail: 'Fallo al Agregar el IMEI.', life: 3000 });
  }
};
/************************************************************************/
async function funcionActualizar(e) {
    if(e){
        e.preventDefault()
    }

  const url = link.value+api.value+"/actualizarcampos/productos";
  if (!datoscampos.value) {
    console.error("Datos incompletos, no se puede actualizar.");
    return;
  }

  const productoServidor = await peticionesFetchOffline('getDataByField', 'productos', 'id', datoscampos.value.id);
  const almacenServidor = `${productoServidor?.almacen ?? ''}`.trim().toUpperCase();
  const almacenEditado = `${datoscampos.value.almacen ?? ''}`.trim().toUpperCase();
  if (productoServidor && almacenServidor !== almacenEditado) {
    toast.add({
      severity: 'error',
      summary: 'Cambio de almacén bloqueado',
      detail: 'Use la opción Transferir almacén para mover el producto y sus IMEI de forma consistente.',
      life: 5000
    });
    datoscampos.value.almacen = productoServidor.almacen;
    return;
  }


  // Funcion para verificar si una fecha es valida
  function esFechaValida(fecha) {
    return !isNaN(new Date(fecha).getTime());
  }

  // Verificar y actualizar created_at si es necesario
  if (datoscampos.value.hasOwnProperty('created_at')) {
    if (!esFechaValida(datoscampos.value.created_at)) {
      datoscampos.value.created_at = nfecha('timestamp');
    }
  }

  if (datoscampos.value.hasOwnProperty('created_at')) {
      datoscampos.value.updated_at = nfecha('timestamp')
    }


   if (esObjeto(datoscampos.value.marca)) {
        datoscampos.value.marca = datoscampos.value.marca.nombre
    }

    if (esObjeto(datoscampos.value.categoria)) {
        datoscampos.value.categoria = datoscampos.value.categoria.nombre
    }

    if (esObjeto(datoscampos.value.proveedor)) {
        datoscampos.value.proveedor = datoscampos.value.proveedor.nombre
    }


   // datoscampos.value.tipo_impuesto = addImpuestos.value;
    if(datoscampos.value.otro !=''){
      datoscampos.value.otro = JSON.stringify(datoscampos.value.otro);
    }

    if(datoscampos.value.categoria != 'CELULARES'){
        datoscampos.value.otro = ''
    }

   datoscampos.value.caracteristicas = JSON.stringify(datoscampos.value.caracteristicas)


/*  const envioDatos = await enviarDatosPorPost(url, datoscampos.value,tokenCifrado.value);*/
  const envioDatos = await peticionesFetchOffline('updateData', 'productos',JSON.stringify(datoscampos.value));
  if (esRespuestaOk(envioDatos)) {
    datoscampos.value.caracteristicas = JSON.parse(datoscampos.value.caracteristicas)
    if (datoscampos.value.categoria === 'CELULARES') {
      fechDataIMEI()
    }

     toast.add({ severity: 'success', summary: 'Éxito', detail: 'Datos Actualizados', life: 3000 });
  }else{
    console.error('Respuesta updateData no reconocida como OK:', envioDatos);
    toast.add({ severity: 'error', summary: 'Error', detail: 'Fallo al actualizar los datos.', life: 3000 });
  }
}
/************************************************************************/
/************************************************************************/
const fechDataIMEI = async()=>{
    //imeiList
/*    const response = await enviarDatosPorPost(`${link.value+api.value}/datosarraydoblecondicion/imei`,{campo1:'id_equi',valor1:datoscampos.value.id,campo2:'estado',valor2:'DISPONIBLE'},tokenCifrado.value);*/
    const response = await peticionesFetchOffline('getDataArrayByTwoConditions', 'imei','id_equi',datoscampos.value.id,'estado','DISPONIBLE');
    const jsonData = response;
    imeiList.value = jsonData;
    if(response.length > 0){
      datoscampos.value.otro = response.map(cel => {
          return { imei: cel.imei,fecha:cel.fecha };
        });
    }
    datoscampos.value.stock = jsonData.length;
    //funcionActualizar()
}
/************************************************************************/
const sincronizarIMEI = async () => {
  if (datoscampos.value.categoria !== 'CELULARES') {
    toast.add({ severity: 'error', summary: 'Error', detail: 'El producto no es de categoria CELULARES', life: 3000 });
    return;
  }

  try {
    const resultado = await sincronizarStockProductoPorImeiDisponible(datoscampos.value.id);
    if (!resultado.success) {
      toast.add({
        severity: 'error',
        summary: 'Error',
        detail: resultado.message || 'Fallo al sincronizar IMEI',
        life: 3000
      });
      return;
    }

    await fechDataIMEI();
    toast.add({ severity: 'success', summary: 'Éxito', detail: `IMEI sincronizados. Nueva cantidad: ${resultado.stock}`, life: 3000 });
  } catch (error) {
    toast.add({ severity: 'error', summary: 'Error', detail: 'Fallo al sincronizar IMEI', life: 3000 });
  }
};
/************************************************************************/
watchEffect(async() => {
  if (visibleBarcode.value) {
     codigoBarcode.value = datoscampos.value.codigo_barra;
     textoBarcode.value = datoscampos.value.nombre;
  }
  if (visibleIMEI.value) {
      if (datoscampos.value.categoria !='CELULARES') {
          toast.add({ severity: 'error', summary: 'Error', detail: 'El Producto no es CELULAR', life: 3000 });
          visibleIMEI.value = false
      }
        nuevoIMEI.value = ''
     nuevoIMEIPrecios.value = {
      precio_compra: Number(datoscampos.value.precio_compra) || 0,
      precio_venta: Number(datoscampos.value.precio_venta) || 0,
      precio_min: Number(datoscampos.value.precio_min) || 0,
      precio_xmayor: Number(datoscampos.value.precio_xmayor) || 0
     }
     nuevoIMEIProveedor.value = normalizarProveedor(datoscampos.value.proveedor)
     nuevaCapacidadIMEI.value = '64GB'
     detallesIMEI.value = `ALMACENAMIENTO:
BATERIA TESTEADA: si
BATERIA QUE MARCA: original
DETALLES ESTETICOS: Ninguno
DETALLES INTERNOS: Ninguno
BATERIA MARCA: 100%`
   await fetchIMEIByProductoId(datoscampos.value.id);
   await fechDataIMEI();
  }
});
/************************************************************************/
const isReadonly = computed(() => {
  return datoscampos.value.categoria === 'CELULARES' || datoscampos.value.empaque === 'INFINITO';
});
/************************************************************************/
const fnTipoProducto = () => {
  if (tipoProducto.value === 'CELULARES') {
    datoscampos.value.empaque = 'UNIDAD';
    datoscampos.value.categoria = 'CELULARES';
    datoscampos.value.stock = '0';
  } else if (tipoProducto.value === 'PRODUCTO') {
    datoscampos.value.stock = '1';
    datoscampos.value.empaque = 'UNIDAD';
  } else if (tipoProducto.value === 'SERVICIO') {
    datoscampos.value.stock = '0';
    datoscampos.value.empaque = 'INFINITO';
  }
};
/************************************************************************/
const cambiarSeVendePor = ()=>{

}
/************************************************************************/
//const impresoraselected = ref('POS80')
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
        code: codigoBarcode.value,
        text: textoBarcode.value,
        headerText: datosEmpresa.empresa.nombre,
        precio: parseFloat(datoscampos.value.precio_venta).toFixed(2),
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
const fnVerDetalles = async () => {
  if (selectedIMEI.value) {
    // Preguntar al usuario si quiere ver los detalles o eliminar
        visibleIMEI.value = false;
    const result = await Swal.fire({
      title: 'Que accion deseas realizar',
      showDenyButton: true,
      showCancelButton: true,
      confirmButtonText: 'Ver Detalles',
      denyButtonText: 'Eliminar',
      cancelButtonText: 'Cancelar'
    });

/*      const verificaIMEI = await peticionesFetch(`${link.value}${api.value}`, `datoscampo/imei/imei/${selectedIMEI.value.imei}`, {}, tokenCifrado.value, 'GET');*/
      const verificaIMEI = await peticionesFetchOffline('getDataByField', 'imei','imei',selectedIMEI.value.imei);

    if (result.isConfirmed) {
      // Accion de ver detalles

      // Mostrar los detalles en un Swal
      Swal.fire({
        icon: 'success',
        title: 'Detalles del Telefono',
        html: `<p>${verificaIMEI.imei}</p>
        <p>DETALLES: ${verificaIMEI.detalles}</p>`,
        showConfirmButton: false,
        //timer: 3000
      });

    } else if (result.isDenied) {
/*    const envioDatos = await eliminarDatos(link.value+api.value+'/borrar/imei',verificaIMEI.id,tokenCifrado.value);*/
    const envioDatos = await peticionesFetchOffline('deleteEntry', 'imei',verificaIMEI.id);
        if (envioDatos[0] == 'ok') {
           await fechDataIMEI();
          datoscampos.value.stock --;
           await funcionActualizar();
           toast.add({ severity: 'success', summary: 'Éxito', detail: 'Imei Borrado', life: 3000 });
           visibleIMEI.value = true;
        }else{
          toast.add({ severity: 'error', summary: 'Error', detail: 'Fallo al Borrar el IMEI.', life: 3000 });
        }

      //detallesIMEI.value = '';
    }
  } else {
    detallesIMEI.value = `ALMACENAMIENTO:
BATERIA TESTEADA: si
BATERIA QUE MARCA: original
DETALLES ESTETICOS: Ninguno
DETALLES INTERNOS: Ninguno
BATERIA MARCA: 100%`;
  }
};
/************************************************************************/
const generarBarcodeCampo = ()=>{
  datoscampos.value.codigo_barra = generarCodigoUnico();
}
/************************************************************************/
/************************************************************************/
const fnAgregarCategoria = async ()=>{
  //agregarCategoria.value
  const datoscamposCategorias = await arrayToObjetoFromTabla(link.value+api.value,tokenCifrado.value,'categorias');
  datoscamposCategorias.nombre = agregarCategoria.value;
  const url = link.value+api.value+"/insertar/categorias";
  if (datoscamposCategorias.hasOwnProperty('created_at')) {
     datoscamposCategorias.created_at = nfecha('timestamp')
     datoscamposCategorias.updated_at = nfecha('timestamp')
    }
 /* const envioDatos = await enviarDatosPorPost(url, datoscamposCategorias,tokenCifrado.value);*/
  const envioDatos = await peticionesFetchOffline('insertData', 'categorias',JSON.stringify(datoscamposCategorias));
  if (envioDatos[0] == 'ok') {
     toast.add({ severity: 'success', summary: 'Éxito', detail: 'Categoria Agregada exitosamente', life: 3000 });
     visibleAgregarCategoria.value = false
      await fetchDataCategorias();
     datoscampos.value.categoria = categorias.value.find(categoria=>categoria.nombre ===agregarCategoria.value);
     await funcionActualizar();
  }else{
    toast.add({ severity: 'error', summary: 'Error', detail: 'Fallo al Agregar la categoria.', life: 3000 });
 }
}
/************************************************************************/
const fnAgregarMarca = async ()=>{
  //agregarCategoria.value
  const datoscamposMarca = await arrayToObjetoFromTabla(link.value+api.value,tokenCifrado.value,'marcas');
  datoscamposMarca.nombre = agregarMarca.value;
  const url = link.value+api.value+"/insertar/marcas";
  if (datoscamposMarca.hasOwnProperty('created_at')) {
     datoscamposMarca.created_at = nfecha('timestamp')
     datoscamposMarca.updated_at = nfecha('timestamp')
    }
/*  const envioDatos = await enviarDatosPorPost(url, datoscamposMarca,tokenCifrado.value);*/
 const envioDatos = await peticionesFetchOffline('insertData', 'marcas',JSON.stringify(datoscamposMarca));
  if (envioDatos[0] == 'ok') {
     toast.add({ severity: 'success', summary: 'Éxito', detail: 'Marca Agregada exitosamente', life: 3000 });
     visibleAgregarMarca.value = false
      await fetchDataMarcas();
     datoscampos.value.marca = marcas.value.find(marca=>marca.nombre === agregarMarca.value);
     await funcionActualizar();
  }else{
    toast.add({ severity: 'error', summary: 'Error', detail: 'Fallo al Agregar la categoria.', life: 3000 });
 }
}
/************************************************************************/
const buscarRNC = async()=>{
  if (!navigator.onLine) {
    toast.add({ severity: 'error', summary: 'Error', detail: 'No tienes Internet', life: 3000 });
    return;
  }

  const rncValue = (proveedor.value.rnc || '').replace(/(-)/gm, '').trim();
  if (!rncValue) {
    toast.add({ severity: 'warn', summary: 'Aviso', detail: 'Debes ingresar un RNC', life: 3000 });
    return;
  }

  try {
    const datosRNC = await peticionesFetch(
      'https://demo.tmposrd.com/api2',
      `consultarrnc/${rncValue}`,
      {},
      tokenCifrado.value,
      'GET'
    );

    if (!datosRNC || datosRNC.error) {
      toast.add({ severity: 'error', summary: 'Error', detail: 'No se encuentra este RNC', life: 3000 });
      return;
    }

    proveedor.value.nombre = datosRNC.razon_social || proveedor.value.nombre;
    proveedor.value.rnc = rncValue;
    proveedor.value.direccion = proveedor.value.direccion || datosRNC.administracion_local || '';
    toast.add({ severity: 'success', summary: 'OK', detail: 'Datos encontrados', life: 3000 });
  } catch (error) {
    console.error('Error consultando RNC:', error);
    toast.add({ severity: 'error', summary: 'Error', detail: 'Error al consultar RNC', life: 3000 });
  }
}
/************************************************************************/
watch(async()=>{
  if (visibleProveedor.value) {
       proveedor.value = await arrayToObjetoFromTabla(link.value+api.value,tokenCifrado.value,'proveedores');
  }
});
/************************************************************************/
const fnAgregarProveedor = async ()=>{
  const url = link.value+api.value+"/insertar/proveedores";
  if (proveedor.value.hasOwnProperty('created_at')) {
     proveedor.value.created_at = nfecha('timestamp')
     proveedor.value.updated_at = nfecha('timestamp')
    }

/*  const envioDatos = await enviarDatosPorPost(url, proveedor.value,tokenCifrado.value);*/
  const envioDatos = await peticionesFetchOffline('insertData', 'proveedores',JSON.stringify(proveedor.value));


  if (envioDatos[0] == 'ok') {
     toast.add({ severity: 'success', summary: 'Éxito', detail: 'Proveedor Agregado exitosamente', life: 3000 });
     visibleProveedor.value = false
      await fetchDataProveedores();
     datoscampos.value.proveedor = proveedores.value.find(proveed=>proveed.nombre === proveedor.value.nombre);
     await funcionActualizar();
  }else{
    toast.add({ severity: 'error', summary: 'Error', detail: 'Fallo al Agregar el Proveedor.', life: 3000 });
 }
}
/************************************************************************/
const verificaImpuestos = ()=>{
   if (addImpuestos.value === 'Incluido' || addImpuestos.value === 'Agregado') {
      datoscampos.value.impuestos = datosConfiguracion.value.impuesto;
   }else{
      datoscampos.value.impuestos = '0.00'
   }
   calcularPrecios()
}
/************************************************************************/
/************************************************************************/
const calcularPrecios = () => {
    return
  const impuesto = (Number(datosConfiguracion.value.impuesto) / 100);
  const gananciaMinima = Number(datoscampos.value.ganancia); // Mínimo 20% de ganancia
  const precioCompra = Number(datoscampos.value.precio_compra);
  const ganancia = Math.round(precioCompra * gananciaMinima / 100);
  let precioVenta = Math.round(ganancia + precioCompra);

  if (addImpuestos.value === 'Incluido') {
    const operacion = Math.round(precioVenta / (1 + impuesto));
    const impuestoCalculado = Math.round(precioVenta - operacion);
    datoscampos.value.impuesto_venta = impuestoCalculado.toFixed(2);
    datoscampos.value.precio_venta = precioVenta.toFixed(2);
    datoscampos.value.precio_final = precioVenta.toFixed(2);
  } else if (addImpuestos.value === 'Agregado') {
    const precioConImpuesto = Math.round(precioVenta * (1 + impuesto));
    const impuestoCalculado = Math.round(precioConImpuesto - precioVenta);
    datoscampos.value.precio_venta = precioVenta.toFixed(2);
    datoscampos.value.impuesto_venta = impuestoCalculado.toFixed(2);
    datoscampos.value.precio_final = precioConImpuesto.toFixed(2);
  } else {
    datoscampos.value.precio_venta = precioVenta.toFixed(2);
    datoscampos.value.impuesto_venta = '0.00';
    datoscampos.value.precio_final = precioVenta.toFixed(2);
  }

  const precioMinimo = Math.round(precioVenta - (ganancia * 0.20));
  const precioXMayor = Math.round(precioVenta - (ganancia * 0.40));
  datoscampos.value.precio_min = precioMinimo.toFixed(2);
  datoscampos.value.precio_xmayor = precioXMayor.toFixed(2);
};
/************************************************************************/


/************************************************************************/
watch([() => datoscampos.value.precio_compra,
 () => datoscampos.value.impuestos,
  () => addImpuestos.value], calcularPrecios);
/************************************************************************/
const recarcularPventa = () => {
    const precioCompra = Number(datoscampos.value.precio_compra);
    const precioVenta = Number(datoscampos.value.precio_venta);

    if (!isNaN(precioCompra) && !isNaN(precioVenta) && precioCompra !== 0) {
        const ganancia = ((precioVenta - precioCompra) / precioCompra) * 100;
        datoscampos.value.ganancia = ganancia.toFixed(2);
    } else {
        datoscampos.value.ganancia = '0.00';
    }
}

// Watchers bidireccionales ganancia <-> precio_venta con nextTick para evitar decimales espurios
let _calcFlag = false;

watch(() => datoscampos.value.ganancia, async () => {
  if (_calcFlag) return;
  _calcFlag = true;
  calcularPrecios();
  await nextTick();
  _calcFlag = false;
});

watch(() => datoscampos.value.precio_venta, async () => {
  if (_calcFlag) return;
  _calcFlag = true;
  recarcularPventa();
  await nextTick();
  _calcFlag = false;
});

/************************************************************************/
const imprimirProducto = async () => {
  if (!datoscampos.value) {
    Swal.fire("Error", "No hay datos del producto.", "error");
    return;
  }

  // 1) PREGUNTAR TIPO DE FORMATO
  const { value: formato } = await Swal.fire({
    title: "Seleccionar Formato",
    input: "select",
    inputOptions: {
      carta: "Carta (A4)",
      ticket: "Ticket 80mm"
    },
    inputPlaceholder: "Elige un formato",
    showCancelButton: true,
    confirmButtonText: "Continuar",
    cancelButtonText: "Cancelar"
  });

  if (!formato) return;

  // 2) CONFIGURACION SEGUN FORMATO
  let doc;

  if (formato === "carta") {
    // CARTA (A4)
    doc = new jsPDF({
      orientation: "portrait",
      unit: "pt",
      format: "letter" 
    });

  } else if (formato === "ticket") {
    // TICKET 80MM
    doc = new jsPDF({
      orientation: "portrait",
      unit: "pt",
      format: [226, 800] 
      // 226pt aprox. 80mm de ancho
      // altura luego se ajusta sola
    });
  }

  // 3) Construir tabla con los datos
  const filas = Object.entries(datoscampos.value).map(([key, value]) => ({
    propiedad: key.toUpperCase(),
    valor: value || ""
  }));

  // 4) PDF - Encabezado bonito
  doc.setFontSize(formato === "carta" ? 18 : 14);
  doc.text("Ficha del Producto", 40, 40);

  if (formato === "carta") {
    doc.setFontSize(12);
    doc.text("Generado automaticamente por TM POS", 40, 60);
  }

  // 5) TABLA (usa margenes distintos segun formato)
  autoTable(doc, {
    startY: formato === "carta" ? 90 : 60,
    margin: formato === "carta" ? { left: 40, right: 40 } : { left: 10, right: 10 },
    head: [
      [
        { content: "Propiedad", styles: { halign: "left", fillColor: [52, 170, 178] } },
        { content: "Valor", styles: { halign: "left", fillColor: [52, 170, 178] } }
      ]
    ],
    body: filas.map(r => [r.propiedad, r.valor]),
    styles: {
      fontSize: formato === "carta" ? 11 : 9,
      cellPadding: formato === "carta" ? 8 : 4
    },
    headStyles: {
      fontSize: formato === "carta" ? 12 : 10,
      textColor: "#fff",
      fontStyle: "bold"
    },
    alternateRowStyles: {
      fillColor: [245, 245, 245]
    }
  });

  // Ajustar altura real del ticket
  if (formato === "ticket") {
    let pageHeight = doc.internal.getNumberOfPages() * doc.internal.pageSize.getHeight();
    doc.internal.pageSize.height = pageHeight;
  }

  // 6) Convertir PDF a Blob para mostrarlo
  const pdfBlob = doc.output("blob");
  const pdfURL = URL.createObjectURL(pdfBlob);

  // 7) Mostrar en SweetAlert2
  Swal.fire({
    title: `Vista previa (${formato === "carta" ? "Carta" : "80mm"})`,
    width: formato === "carta" ? "60rem" : "30rem",
    padding: "0",
    showCancelButton: true,
    cancelButtonText: "Cerrar",
    confirmButtonText: "Descargar PDF",
    html: `
      <iframe 
        src="${pdfURL}" 
        style="width:100%; height:75vh; border:none;"
      ></iframe>
    `
  }).then(r => {
    if (r.isConfirmed) {
      doc.save(`producto_${formato}.pdf`);
    }
  });
};
    //const impresionpagina = `${link.value}/vista/imprimirproductoticketid=${datoscampos.value.id}`;
   // window.electron.ipcRenderer.invoke('open-new-window', impresionpagina,'url',true,false)
/************************************************************************/
const fnSubirIMG = async()=>{

}
/************************************************************************/
  const handleUploadSuccess = async(result) => {
    if(navigator.onLine){
       //arrayIMG.value = await peticionesFetchOffline('listarArchivosDeCarpeta', `productos/${datoscampos.value.imagen}`);
    }
};

/************************************************************************/
function obtenerNombreArchivo(rutaCompleta) {
    if(rutaCompleta){
 // return rutaCompleta.split(/[\\/]/).pop();
  return rutaCompleta.nombre;

    }
}
/************************************************************************/
const deleteImage = async(ruta,imagen) => {
  const archivo = obtenerNombreArchivo(imagen)
  const envioDatos = await peticionesFetchOffline('eliminarArchivo', 'productos/'+datoscampos.value.imagen,imagen);

    if (envioDatos.success) {
     //arrayIMG.value = await peticionesFetchOffline('listarArchivosDeCarpeta', `productos/${datoscampos.value.imagen}`);

       toast.add({ severity: 'success', summary: t('Success'), detail: t('Image deleted'), life: 3000 });
    }else{
      toast.add({ severity: 'error', summary: t('Error'), detail: t('Failed to delete image'), life: 3000 });
    }

};
/************************************************************************/
/************************************************************************/
const handleUploadError = ()=>{
    console.log('error de imagen')
}
/************************************************************************/
const fnClonar = ()=>{
    toast.add({ severity: 'success', summary: t('Success'), detail: t('Product cloned'), life: 3000 });
    localStorage.setItem('clonado',JSON.stringify(datoscampos.value))
    router.push({ path: `/crearproductos` });
}
/************************************************************************/
const visibleLOTE = ref(false)
const listaAgregarLOTE = ref('')

const agregarLOTE = async () => {
  const listadoIMEI = listaAgregarLOTE.value.split(',').map(imei => imei.trim()).filter(imei => imei !== '');

  for (let imei of listadoIMEI) {
    if (imei.length !== 15) {
      toast.add({ severity: 'error', summary: 'Error', detail: 'Error: El IMEI no contiene los 15 digitos.', life: 3000 });
      return; // Deten la ejecucion si algun IMEI no cumple con la condicion
    }
  }

  if (listadoIMEI.length > 0) {
    for (let imei of listadoIMEI) {
      nuevoIMEI.value = imei;
      await fnAgregarIMEI();
      nuevoIMEI.value = '';
    }
  }

  listaAgregarLOTE.value = '';
  visibleLOTE.value = false;
};


/************************************************************************/
const buscadorFerreteria = (selected)=>{

   const camposABuscar = ['codigo', 'codigo_barra', 'nombre'];
  let datosPro = null;
  // Buscar el producto y crear una copia si es encontrado
  for (const campo of camposABuscar) {
    datosPro = todosLosProductos.value.find((prod) => prod[campo] == selected.value);
    if (datosPro) {
      datoscampos.value = datosPro
  let elementos = document.getElementById('buscadorPrincipal');

let inputDentroDeAwesomplete = elementos.querySelector('input');
if (inputDentroDeAwesomplete) {
    inputDentroDeAwesomplete.value = '';
    inputDentroDeAwesomplete.focus();

} else {
    console.warn('No se encontro un input dentro del primer elemento con clase awesomplete.');
}
        break;

    }
  }


}
/************************************************************************/
const toggleOrientation = () => {
  orientacion.value = orientacion.value === 'horizontal' ? 'vertical' : 'horizontal';
};

/************************************************************************/
const handleUpload = async (event) => {
  const archivos = event.files;
  const ruta = 'imagenes/productos/'+datoscampos.value.imagen;
  for (const archivo of archivos) {
    const reader = new FileReader();
    reader.onload = async () => {
      const buffer = reader.result;
      const byteArray = Array.from(new Uint8Array(buffer));
      try {
        const respuesta = await window.electron.ipcRenderer.invoke(
          'consultaservidor',
          'subirArchivo', // este es el nombre de la funcion registrada en tu objeto `servidor`
          ruta,
          archivo.name,
          byteArray
        );
        if (respuesta.success) {
           // arrayIMG.value = await peticionesFetchOffline('listarArchivosDeCarpeta', `productos/${datoscampos.value.imagen}`);
          console.log('Archivo guardado:', respuesta.path);
          // Aqui puedes mostrar un toast o alerta de exito si usas PrimeVue o SweetAlert
        } else {
          console.error('Error al guardar:', respuesta.message);
          // Mostrar alerta de error aqui
        }
      } catch (err) {
        console.error('Error invocando consultaservidor:', err);
        // Mostrar alerta de error general
      }
    };
    reader.readAsArrayBuffer(archivo);
  }
};
/************************************************************************/
/* =====================================================
   // Agregar nueva caracteristica
===================================================== */
const agregarCaracteristica = async () => {
  const { value: formValues } = await Swal.fire({
    title: "Agregar caracteristica",
    html: `
      <input id="swal-key" class="swal2-input" placeholder="Nombre de la caracteristica (ej. Color)">
      <input id="swal-value" class="swal2-input" placeholder="Valor (ej. Negro)">
    `,
    focusConfirm: false,
    confirmButtonText: "Agregar",
    preConfirm: () => {
      const clave = document.getElementById("swal-key").value.trim();
      const valor = document.getElementById("swal-value").value.trim();
      if (!clave || !valor) {
        Swal.showValidationMessage("Debe completar ambos campos");
        return false;
      }
      return { clave, valor };
    },
  });

  if (formValues) {
    datoscampos.value.caracteristicas.push(formValues);
    toast.add({ severity: "success", summary: "Agregado", detail: "Caracteristica anadida", life: 2000 });
  }
};

/* =====================================================
   // Editar caracteristica
===================================================== */
const fnEditProd = async (index, datos) => {
  const { clave, valor } = datos;
  const { value: editValues } = await Swal.fire({
    title: "Editar caracteristica",
    html: `
      <input id="swal-key" class="swal2-input" value="${clave}" placeholder="Nombre de la caracteristica">
      <input id="swal-value" class="swal2-input" value="${valor}" placeholder="Valor">
    `,
    focusConfirm: false,
    confirmButtonText: "Guardar cambios",
    preConfirm: () => {
      const nuevaClave = document.getElementById("swal-key").value.trim();
      const nuevoValor = document.getElementById("swal-value").value.trim();
      if (!nuevaClave || !nuevoValor) {
        Swal.showValidationMessage("Debe completar ambos campos");
        return false;
      }
      return { clave: nuevaClave, valor: nuevoValor };
    },
  });

  if (editValues) {
    datoscampos.value.caracteristicas[index] = editValues;
    toast.add({ severity: "info", summary: "Editado", detail: "Caracteristica actualizada", life: 2000 });
  }
};

/* =====================================================
   // Eliminar caracteristica
===================================================== */
const fnEliminarProd = async (index) => {
  const confirm = await Swal.fire({
    title: "Eliminar caracteristica",
    text: "Esta accion no se puede deshacer.",
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Si, eliminar",
    cancelButtonText: "Cancelar",
  });

  if (confirm.isConfirmed) {
    datoscampos.value.caracteristicas.splice(index, 1);
    toast.add({ severity: "error", summary: "Eliminada", detail: "Caracteristica removida", life: 2000 });
  }
};
/************************************************************************/
// Estado para el FileManager
const showFileManager = ref(false);
const currentDirectory = ref('');

// Funcion para abrir el gestor de archivos
const openFileManager = (directoryName) => {
  currentDirectory.value = directoryName;
  showFileManager.value = true;
};
/************************************************************************/

</script>
<template>
<main class="content-wrapper editar-producto-container">
  <div class="w-full px-4 mt-5">

    <!-- Modern Header -->
    <div class="editar-producto-header">
      <div class="editar-producto-header-content">
        <div class="editar-producto-icon-wrapper">
          <i class="pi pi-pencil editar-producto-icon"></i>
        </div>
        <div>
          <h1 class="editar-producto-title">{{ $t('Edit Product') }}</h1>
          <p class="editar-producto-subtitle">{{ $t('Modify the selected product data') }}</p>
        </div>
      </div>
    </div>

    <!-- Navigation Card -->
    <Card class="editar-producto-nav-card">
      <template #content>
        <div class="editar-producto-nav-grid">
          <div class="editar-producto-nav-group">
            <h3 class="editar-producto-nav-title"><i class="pi pi-compass"></i> {{ $t('Navigation') }}</h3>
            <div class="editar-producto-nav-buttons">
              <Button icon="pi pi-angle-double-left" :label="$t('First')" severity="secondary" @click="navigate('primero')" />
              <Button icon="pi pi-chevron-left" :label="$t('Previous')" severity="secondary" @click="navigate('anterior')" />
              <Button icon="pi pi-chevron-right" :label="$t('Next')" severity="secondary" @click="navigate('siguiente')" />
              <Button icon="pi pi-angle-double-right" :label="$t('Last')" severity="secondary" @click="navigate('ultimo')" />
            </div>
          </div>

          <div class="editar-producto-nav-group">
            <h3 class="editar-producto-nav-title"><i class="pi pi-cog"></i> {{ $t('Actions') }}</h3>
            <div class="editar-producto-nav-buttons">
              <router-link to="/productos">
                <Button icon="pi pi-home" :label="$t('Home')" severity="info" outlined />
              </router-link>
              <router-link to="/crearproductos">
                <Button icon="pi pi-plus" :label="$t('Create')" severity="success" outlined />
              </router-link>
              <Button icon="pi pi-qrcode" severity="warning" @click="visibleBarcode = true" />
              <Button icon="pi pi-print" severity="help" @click="imprimirProducto" />
              <Button icon="pi pi-building" label="Agregar Proveedor" severity="success" outlined @click="visibleProveedor = true" />
              <Button v-if="esCelular" icon="pi pi-mobile" label="IMEI" severity="info" @click="visibleIMEI = true" />
              <Button v-if="esCelular" icon="pi pi-refresh" label="Sincronizar IMEI" severity="warning" @click="sincronizarIMEI" />
              <router-link v-if="esCelular" to="/imei">
                <Button icon="pi pi-list" label="Ver IMEIs" severity="contrast" outlined />
              </router-link>
              <Button icon="pi pi-clone" :label="$t('Clone')" severity="secondary" @click="fnClonar" />
              <Button icon="pi pi-image" :label="$t('Images')" severity="secondary" @click="openFileManager('productos')" />
            </div>
          </div>
        </div>
      </template>
    </Card>

    <!-- Keyboard Shortcuts Info -->
    <Card class="editar-producto-shortcuts-card">
      <template #content>
        <div class="editar-producto-shortcuts-content">
          <div class="editar-producto-shortcut-item">
            <span class="editar-producto-shortcut-key">Ctrl + S</span>
            <span class="editar-producto-shortcut-desc">{{ $t('Save changes') }}</span>
          </div>
          <div class="editar-producto-shortcut-item">
            <span class="editar-producto-shortcut-key">? ?</span>
            <span class="editar-producto-shortcut-desc">{{ $t('Navigate between products') }}</span>
          </div>
          <div class="editar-producto-shortcut-item">
            <span class="editar-producto-shortcut-key">↑ ↓</span>
            <span class="editar-producto-shortcut-desc">{{ $t('First / Last') }}</span>
          </div>
          <div class="editar-producto-shortcut-item">
            <ToggleButton v-model="activarArrows" :onLabel="$t('Arrows Active')" :offLabel="$t('Activate Arrows')" onIcon="pi pi-lock"
              offIcon="pi pi-lock-open" class="editar-producto-toggle" />
          </div>
        </div>
      </template>
    </Card>

    <!-- Search Card -->
    <Card class="editar-producto-search-card">
      <template #content>
        <div class="editar-producto-search-content">
          <label class="editar-producto-search-label">
            <i class="pi pi-search"></i>
            {{ $t('Search Product') }}
          </label>
          <awesomplete
            ref="nuevoInput"
            v-model="awesompleteproductoprincipal"
            @selectComplete="buscadorFerreteria"
            :list="listaBuscador"
            id="buscadorPrincipal"
            class="editar-producto-search-input"
            aria-describedby="basic-addon2"
          />
        </div>
      </template>
    </Card>

    <!-- Section Divider -->
    <div class="editar-producto-section-divider">
      <div class="editar-producto-divider-line"></div>
      <div class="editar-producto-divider-content">
        <i class="pi pi-pencil"></i>
        <span>{{ $t('Editing Form') }}</span>
      </div>
      <div class="editar-producto-divider-line"></div>
    </div>

<section>
    <form id="formularioActualizar" @submit.prevent="funcionActualizar">
  <Card class="editar-producto-form-card">
    <template #content>

<!-- Identificacion Section -->
<div class="editar-producto-form-section">
  <h3 class="editar-producto-section-title">
    <i class="pi pi-tag"></i>
    {{ $t('Identification') }}
  </h3>
  <div class="editar-producto-form-grid">
    <!-- Primera linea: ID, Tipo, Codigo, Codigo de Barra -->
    <div class="editar-producto-form-group" v-if="datosEmpresa.usuario.nivel_seguridad">
      <label class="editar-producto-label">ID</label>
      <InputText v-model="datoscampos.id" readonly class="w-full h-11 px-3 py-2 border-2 border-gray-300 rounded-lg text-base transition-all focus:border-orange-500 focus:ring-2 focus:ring-orange-200 focus:outline-none" />
    </div>

<!--     <div class="editar-producto-form-group">
      <label class="editar-producto-label">{{ $t('Type') }}</label>
      <Select v-model="tipoProducto" :options="['PRODUCTO', 'CELULARES', 'SERVICIO', 'PREPARADO']"
        @change="fnTipoProducto" class="w-full h-11 px-3 py-2 border-2 border-gray-300 rounded-lg text-base transition-all focus:border-orange-500 focus:ring-2 focus:ring-orange-200 focus:outline-none" />
    </div> -->

    <div class="editar-producto-form-group">
      <label class="editar-producto-label">{{ $t('Code') }}</label>
      <InputText v-model="datoscampos.codigo" class="w-full h-11 px-3 py-2 border-2 border-gray-300 rounded-lg text-base transition-all focus:border-orange-500 focus:ring-2 focus:ring-orange-200 focus:outline-none" />
    </div>

    <div class="editar-producto-form-group">
      <label class="editar-producto-label">{{ $t('Barcode') }}</label>
      <InputGroup>
        <InputText v-model="datoscampos.codigo_barra" class="w-full h-11 px-3 py-2 border-2 border-gray-300 rounded-lg text-base transition-all focus:border-orange-500 focus:ring-2 focus:ring-orange-200 focus:outline-none" />
        <Button icon="pi pi-qrcode" @click="generarBarcodeCampo" />
      </InputGroup>
    </div>

    <!-- Segunda linea: Nombre y Se vende por -->
    <div class="editar-producto-form-group" style="grid-column: span 3;">
      <label class="editar-producto-label">{{ $t('Name') }}</label>
      <InputText v-model="datoscampos.nombre" v-mayusculablur class="w-full h-11 px-3 py-2 border-2 border-gray-300 rounded-lg text-base transition-all focus:border-orange-500 focus:ring-2 focus:ring-orange-200 focus:outline-none" />
    </div>

<!--     <div class="editar-producto-form-group">
      <label class="editar-producto-label">{{ $t('Sold By') }}</label>
      <Select v-model="seVendePor" @change="cambiarSeVendePor" :options="['UNIDAD', 'DETALLADO']" class="w-full h-11 px-3 py-2 border-2 border-gray-300 rounded-lg text-base transition-all focus:border-orange-500 focus:ring-2 focus:ring-orange-200 focus:outline-none" />
    </div> -->
  </div>
</div>

<!-- Descripcion Section -->
<div v-if="false" class="editar-producto-form-section">
  <h3 class="editar-producto-section-title">
    <i class="pi pi-align-left"></i>
    {{ $t('Description') }}
  </h3>
  <div class="editar-producto-form-grid">
    <div class="editar-producto-form-group" style="grid-column: 1 / -1;">
      <label class="editar-producto-label">{{ $t('Description') }}</label>
      <Textarea v-model="datoscampos.descripcion" rows="3" class="w-full h-11 px-3 py-2 border-2 border-gray-300 rounded-lg text-base transition-all focus:border-orange-500 focus:ring-2 focus:ring-orange-200 focus:outline-none" />
    </div>
  </div>
</div>

<!-- Clasificacion Section -->
<div class="editar-producto-form-section">
  <h3 class="editar-producto-section-title">
    <i class="pi pi-folder"></i>
    {{ $t('Classification') }}
  </h3>
  <div class="editar-producto-form-grid">
    <div class="editar-producto-form-group">
      <label class="editar-producto-label">{{ $t('Category') }}</label>
      <InputGroup>
        <Select v-model="datoscampos.categoria" :options="categorias" optionLabel="nombre" editable class="w-full h-11 px-3 py-2 border-2 border-gray-300 rounded-lg text-base transition-all focus:border-orange-500 focus:ring-2 focus:ring-orange-200 focus:outline-none" />
        <Button icon="pi pi-plus" @click="visibleAgregarCategoria = true" />
      </InputGroup>
    </div>

    <div class="editar-producto-form-group">
      <label class="editar-producto-label">{{ $t('Supplier') }}</label>
      <InputGroup>
        <Dropdown v-model="datoscampos.proveedor" :options="proveedores" optionLabel="nombre" editable class="w-full h-11 px-3 py-2 border-2 border-gray-300 rounded-lg text-base transition-all focus:border-orange-500 focus:ring-2 focus:ring-orange-200 focus:outline-none" />
        <Button icon="pi pi-plus" @click="visibleProveedor = true" />
      </InputGroup>
    </div>

    <div class="editar-producto-form-group">
      <label class="editar-producto-label">{{ $t('Brand') }}</label>
      <InputGroup>
        <Dropdown v-model="datoscampos.marca" :options="marcas" optionLabel="nombre" editable class="w-full h-11 px-3 py-2 border-2 border-gray-300 rounded-lg text-base transition-all focus:border-orange-500 focus:ring-2 focus:ring-orange-200 focus:outline-none" />
        <Button icon="pi pi-plus" @click="visibleAgregarMarca = true" />
      </InputGroup>
    </div>

    <div v-if="false" class="editar-producto-form-group">
      <label class="editar-producto-label">{{ $t('Model') }}</label>
      <InputText v-model="datoscampos.modelo" class="w-full h-11 px-3 py-2 border-2 border-gray-300 rounded-lg text-base transition-all focus:border-orange-500 focus:ring-2 focus:ring-orange-200 focus:outline-none" />
    </div>
  </div>
</div>

<!-- Precios e Impuestos Section -->
<div v-if="!esCelular" class="editar-producto-form-section">
  <h3 class="editar-producto-section-title">
    <i class="pi pi-dollar"></i>
    {{ $t('Prices and Taxes') }}
  </h3>
  <div class="editar-producto-form-grid">
    <div class="editar-producto-form-group">
      <label class="editar-producto-label">{{ $t('Purchase Price') }}</label>
      <InputText v-model="datoscampos.precio_compra" v-solonumeros @value-change="calcularPrecios" class="w-full h-11 px-3 py-2 border-2 border-gray-300 rounded-lg text-base transition-all focus:border-orange-500 focus:ring-2 focus:ring-orange-200 focus:outline-none" />
    </div>

    <div class="editar-producto-form-group">
      <label class="editar-producto-label">{{ $t('Taxes (%)') }}</label>
      <InputText v-model="datoscampos.impuestos" @value-change="calcularPrecios" class="w-full h-11 px-3 py-2 border-2 border-gray-300 rounded-lg text-base transition-all focus:border-orange-500 focus:ring-2 focus:ring-orange-200 focus:outline-none" />
    </div>

<!--     <div class="editar-producto-form-group" style="grid-column: 1 / -1;">
      <OptionButtonTM v-model="addImpuestos" :label="$t('How does the Tax go')" @change="verificaImpuestos" :options="optionsImpuestos" />
    </div> -->

    <div class="editar-producto-form-group">
      <label class="editar-producto-label">{{ $t('Profit (%)') }}</label>
      <InputText v-model="datoscampos.ganancia" class="w-full h-11 px-3 py-2 border-2 border-gray-300 rounded-lg text-base transition-all focus:border-orange-500 focus:ring-2 focus:ring-orange-200 focus:outline-none" />
    </div>

    <div class="editar-producto-form-group">
      <label class="editar-producto-label">{{ $t('Sale Price') }}</label>
      <InputText v-model="datoscampos.precio_venta" class="w-full h-11 px-3 py-2 border-2 border-gray-300 rounded-lg text-base transition-all focus:border-orange-500 focus:ring-2 focus:ring-orange-200 focus:outline-none" />
    </div>

    <div class="editar-producto-form-group">
      <label class="editar-producto-label">{{ $t('Min. Price') }}</label>
      <InputText v-model="datoscampos.precio_min" class="w-full h-11 px-3 py-2 border-2 border-gray-300 rounded-lg text-base transition-all focus:border-orange-500 focus:ring-2 focus:ring-orange-200 focus:outline-none" />
    </div>

    <div class="editar-producto-form-group">
      <label class="editar-producto-label">{{ $t('Wholesale Price') }}</label>
      <InputText v-model="datoscampos.precio_xmayor" class="w-full h-11 px-3 py-2 border-2 border-gray-300 rounded-lg text-base transition-all focus:border-orange-500 focus:ring-2 focus:ring-orange-200 focus:outline-none" />
    </div>

<!--     <div class="editar-producto-form-group">
      <label class="editar-producto-label">{{ $t('Offer Price') }}</label>
      <InputText v-model="datoscampos.oferta" class="w-full h-11 px-3 py-2 border-2 border-gray-300 rounded-lg text-base transition-all focus:border-orange-500 focus:ring-2 focus:ring-orange-200 focus:outline-none" />
    </div> -->
  </div>
</div>

<!-- Inventario Section -->
<!-- Inventario normal (si NO es CELULARES) -->
<div v-if="!esCelular" class="editar-producto-form-section">
  <h3 class="editar-producto-section-title">
    <i class="pi pi-box"></i>
    {{ $t('Inventory') }}
  </h3>
  <div class="editar-producto-form-grid">
    <div class="editar-producto-form-group">
      <label class="editar-producto-label">{{ $t('Stock') }}</label>
      <InputText v-model="datoscampos.stock" :readonly="isReadonly" class="w-full h-11 px-3 py-2 border-2 border-gray-300 rounded-lg text-base transition-all focus:border-orange-500 focus:ring-2 focus:ring-orange-200 focus:outline-none" />
    </div>

    <div class="editar-producto-form-group">
      <label class="editar-producto-label">Alerta</label>
      <InputText v-model="datoscampos.alerta" v-solonumeros class="w-full h-11 px-3 py-2 border-2 border-gray-300 rounded-lg text-base transition-all focus:border-orange-500 focus:ring-2 focus:ring-orange-200 focus:outline-none" />
    </div>

    <div class="editar-producto-form-group">
      <label class="editar-producto-label">Empaque</label>
      <Select v-model="datoscampos.empaque" :options="empaquesNombre" class="w-full h-11 px-3 py-2 border-2 border-gray-300 rounded-lg text-base transition-all focus:border-orange-500 focus:ring-2 focus:ring-orange-200 focus:outline-none" />
    </div>

    <div class="editar-producto-form-group" style="grid-column: 1 / -1;">
      <label class="editar-producto-label">Ubicacion</label>
      <InputText v-model="datoscampos.ubicacion" class="w-full h-11 px-3 py-2 border-2 border-gray-300 rounded-lg text-base transition-all focus:border-orange-500 focus:ring-2 focus:ring-orange-200 focus:outline-none" />
    </div>
  </div>
</div>

<!-- IMEI Section (solo Celulares) -->
<div v-else class="editar-producto-form-section">
  <div class="flex items-center justify-between mb-4 gap-3">
    <h3 class="flex items-center gap-3 text-lg md:text-xl font-bold text-gray-700 m-0">
      <i class="pi pi-mobile"></i>
      Gestión de IMEI
      <Tag :value="`${imeiProductoList.length} IMEI`" severity="info" />
    </h3>
    <div class="flex gap-2">
      <Button
        label="Agregar IMEI"
        icon="pi pi-plus"
        size="small"
        severity="success"
        @click="visibleIMEI = true"
      />
      <Button
        label="Sincronizar IMEI"
        icon="pi pi-refresh"
        size="small"
        severity="info"
        @click="sincronizarIMEI"
      />
      <Button
        label="Cambiar Precios"
        icon="pi pi-dollar"
        size="small"
        severity="warning"
        @click="fnAbrirCambiarPreciosIMEI"
      />
      <Button
        label="Eliminar IMEIs"
        icon="pi pi-trash"
        size="small"
        severity="danger"
        @click="fnEliminarImeisPorProducto"
      />
    </div>
  </div>

  <DataTable
    v-if="imeiProductoList.length > 0"
    :value="imeiProductoList"
    :loading="imeiProductoLoading"
    :paginator="true"
    :rows="10"
    :rowsPerPageOptions="[5, 10, 20, 50]"
    stripedRows
    class="w-full imei-datatable-editar"
    paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink RowsPerPageDropdown"
    editMode="cell"
    @cell-edit-complete="onImeiCellEditComplete"
  >
    <Column header="IMEI" field="imei" sortable style="min-width: 180px">
      <template #body="slotProps">
        <Button
          class="p-0 text-blue-600"
          text
          @click="mostrarDetallesImei(slotProps.data)"
        >
          <code class="imei-code-edit">{{ slotProps.data.imei }}</code>
        </Button>
      </template>
    </Column>
    <Column header="Estado" field="estado" sortable style="min-width: 160px">
      <template #body="slotProps">
        <Dropdown
          :modelValue="slotProps.data.estado"
          :options="['DISPONIBLE', 'VENDIDO', 'DEVOLUCION']"
          class="w-full"
          @change="onEstadoImeiChange(slotProps.data, $event.value)"
        >
          <template #value="s">
            <Tag
              :value="s.value"
              :severity="s.value === 'DISPONIBLE' ? 'success' : s.value === 'DEVOLUCION' ? 'info' : 'warning'"
            />
          </template>
          <template #option="s">
            <Tag
              :value="s.option"
              :severity="s.option === 'DISPONIBLE' ? 'success' : s.option === 'DEVOLUCION' ? 'info' : 'warning'"
            />
          </template>
        </Dropdown>
      </template>
    </Column>
    <Column header="Fecha" field="fecha" sortable style="min-width: 140px" />
    <Column header="Precio Compra" field="precio_compra" sortable style="min-width: 140px">
      <template #editor="{ data, field }">
        <InputNumber v-model="data[field]" class="w-full" mode="currency" currency="DOP" locale="es-DO" />
      </template>
      <template #body="slotProps">
        <span class="font-semibold">RD$ {{ Number(slotProps.data.precio_compra || 0).toFixed(2) }}</span>
      </template>
    </Column>
    <Column header="Precio Venta" field="precio_venta" sortable style="min-width: 140px">
      <template #editor="{ data, field }">
        <InputNumber v-model="data[field]" class="w-full" mode="currency" currency="DOP" locale="es-DO" />
      </template>
      <template #body="slotProps">
        <span class="font-semibold text-green-600">RD$ {{ Number(slotProps.data.precio_venta || 0).toFixed(2) }}</span>
      </template>
    </Column>
    <Column header="Precio Min" field="precio_min" sortable style="min-width: 140px">
      <template #editor="{ data, field }">
        <InputNumber v-model="data[field]" class="w-full" mode="currency" currency="DOP" locale="es-DO" />
      </template>
      <template #body="slotProps">
        <span>RD$ {{ Number(slotProps.data.precio_min || 0).toFixed(2) }}</span>
      </template>
    </Column>
    <Column header="Precio x Mayor" field="precio_xmayor" sortable style="min-width: 160px">
      <template #editor="{ data, field }">
        <InputNumber v-model="data[field]" class="w-full" mode="currency" currency="DOP" locale="es-DO" />
      </template>
      <template #body="slotProps">
        <span>RD$ {{ Number(slotProps.data.precio_xmayor || 0).toFixed(2) }}</span>
      </template>
    </Column>
        <Column header="Bateria %" field="bateria" sortable style="min-width: 120px">
      <template #body="slotProps">
        <Select
          :modelValue="Number(slotProps.data.bateria || 100)"
          :options="opcionesBateria"
          class="w-full"
          @change="onBateriaImeiChange(slotProps.data, $event.value)"
        />
      </template>
    </Column>
    <Column header="Capacidad" field="capacidad" sortable style="min-width: 120px">
      <template #body="slotProps">
        <Select
          :modelValue="slotProps.data.capacidad || '64GB'"
          :options="opcionesCapacidad"
          class="w-full"
          @change="onCapacidadImeiChange(slotProps.data, $event.value)"
        />
      </template>
    </Column>
    <Column header="Proveedor" field="proveedor" sortable style="min-width: 200px">
      <template #body="slotProps">
        <Dropdown
          :modelValue="slotProps.data.proveedor"
          :options="proveedores"
          optionLabel="nombre"
          optionValue="nombre"
          placeholder="Seleccionar..."
          class="w-full"
          filter
          @change="onProveedorImeiChange(slotProps.data, $event.value)"
        />
      </template>
    </Column>
    <Column header="" style="width: 60px; text-align: center">
      <template #body="slotProps">
        <Button
          icon="pi pi-trash"
          severity="danger"
          text
          rounded
          size="small"
          v-tooltip.top="'Eliminar IMEI'"
          @click="eliminarImeiDeProducto(slotProps.data, slotProps.index)"
        />
      </template>
    </Column>
  </DataTable>

  <div v-else class="no-imeis-message">
    <i class="pi pi-inbox text-4xl text-gray-300 mb-3"></i>
    <p class="text-gray-500">No hay IMEI registrados para este producto.</p>
    <Button label="Agregar primer IMEI" icon="pi pi-plus" size="small" @click="visibleIMEI = true" />
  </div>
</div>

<!-- Caracteristicas Section -->
<!-- <div class="editar-producto-form-section">
  <div class="editar-producto-section-header">
    <h3 class="editar-producto-section-title">
      <i class="pi pi-list"></i>
      Caracteristicas
    </h3>
    <Button label="Agregar" icon="pi pi-plus" severity="success" size="small" @click="agregarCaracteristica" />
  </div>
  <TablaJSON :productos="datoscampos.caracteristicas" :onEditar="fnEditProd" :onEliminar="fnEliminarProd" :botones="true" tableId="tablacaracteristicas" />
</div> -->

<!-- Imagenes Section -->
<!-- <div class="editar-producto-form-section">
  <h3 class="editar-producto-section-title">
    <i class="pi pi-images"></i>
    Imagenes
  </h3>
  <FileUpload :customUpload="true" :auto="true" chooseLabel="Seleccionar Imagenes" @uploader="handleUpload" :multiple="true" accept="image/*" />
  <div class="editar-producto-images-grid">
    <div v-for="imagen in arrayIMG" :key="imagen" class="editar-producto-image-item">
      <Image :src="imagen" preview class="editar-producto-image" />
      <Button label="Eliminar" severity="danger" class="editar-producto-image-delete" @click.prevent="deleteImage(datoscampos.imagen, obtenerNombreArchivo(imagen))" />
    </div>
  </div>
</div> -->

<!-- Submit Button -->
<div class="editar-producto-submit-container">
  <Button type="submit" :label="$t('Update Product')" icon="pi pi-save" size="large" class="editar-producto-submit-btn" />
</div>

    </template>
  </Card>
   </form>
</section>
  </div>



<Dialog 
  v-model:visible="visibleBarcode" 
  modal 
  header="Generar Codigo de Barra"
  :style="{ width: '60rem' }"
>
  <div class="grid grid-cols-12 gap-4">

    <div class="col-span-12">
      <fieldset class="border p-4 rounded">
        <legend class="float-none w-auto px-2">BARCODE</legend>

        <div class="grid grid-cols-12 gap-4 mt-2">

          <!-- ============================= -->
          <!--        SWITCHES SUPERIORES    -->
          <!-- ============================= -->
          <div class="col-span-12 flex flex-wrap gap-6 p-2">

            <div>
              <label class="font-semibold">Incluir Cabecera</label><br>
              <ToggleSwitch v-model="incluirCabecera" />
            </div>

            <div>
              <label class="font-semibold">Incluir Texto</label><br>
              <ToggleSwitch v-model="incluirTexto" />
            </div>

            <div>
              <label class="font-semibold">Incluir Codigo</label><br>
              <ToggleSwitch v-model="incluirCodigo" />
            </div>

            <div>
              <label class="font-semibold">Incluir Precio</label><br>
              <ToggleSwitch v-model="incluirPrecio" />
            </div>

            <div>
              <label class="font-semibold">Orientacion</label><br>
              <ToggleSwitch 
                :checked="orientacion === 'vertical'"
                @change="toggleOrientation"
              />
            </div>

          </div>

          <!-- ============================= -->
          <!--  PARTE SUPERIOR: TAMANOS      -->
          <!-- ============================= -->
          <div class="col-span-12 md:col-span-4">
            <label class="font-semibold">LABEL WIDTH</label>
            <input v-model="datosBarcode.labelwidth" type="text" class="inputfield" />
          </div>

          <div class="col-span-12 md:col-span-4">
            <label class="font-semibold">LABEL HEIGHT</label>
            <input v-model="datosBarcode.labelheight" type="text" class="inputfield" />
          </div>

          <div class="col-span-12 md:col-span-4">
            <label class="font-semibold">FONT SIZE</label>
            <input v-model="datosBarcode.fontsize" type="text" class="inputfield" />
          </div>

          <!-- BARCODE TYPE -->
          <div class="col-span-12 md:col-span-4">
            <label class="font-semibold">Barcode Type</label>
            <select v-model="datosBarcode.barcodetype" class="inputselect">
              <option value="CODE128">Code 128</option>
              <option value="CODE128A">Code 128 A</option>
              <option value="CODE128B">Code 128 B</option>
              <option value="CODE39">Code 39</option>
              <option value="CODE93">Code 93</option>
              <option value="EAN8">EAN 8</option>
              <option value="EAN13">EAN 13</option>
            </select>
          </div>

          <!-- TAMANO DE BARRAS -->
          <div class="col-span-12 md:col-span-4">
            <label class="font-semibold">BARWIDTH</label>
            <input v-model="datosBarcode.barwidth" type="text" class="inputfield" />
          </div>

          <div class="col-span-12 md:col-span-4">
            <label class="font-semibold">BARHEIGHT</label>
            <input v-model="datosBarcode.barheight" type="text" class="inputfield" />
          </div>

          <!-- MARGENES -->
          <div class="col-span-6 md:col-span-3">
            <label class="font-semibold">M. Izq</label>
            <input v-model="datosBarcode.margen_izq" type="text" class="inputfield" />
          </div>

          <div class="col-span-6 md:col-span-3">
            <label class="font-semibold">M. Sup</label>
            <input v-model="datosBarcode.margen_sup" type="text" class="inputfield" />
          </div>

          <div class="col-span-6 md:col-span-3">
            <label class="font-semibold">M. Der</label>
            <input v-model="datosBarcode.margen_der" type="text" class="inputfield" />
          </div>

          <div class="col-span-6 md:col-span-3">
            <label class="font-semibold">M. Inf</label>
            <input v-model="datosBarcode.margen_inf" type="text" class="inputfield" />
          </div>

          <!-- CODIGO Y TEXTO -->
          <div class="col-span-12 md:col-span-4">
            <label class="font-semibold">Codigo</label>
            <input v-model="codigoBarcode" type="text" class="inputfield" />
          </div>

          <div class="col-span-12 md:col-span-6">
            <label class="font-semibold">Texto</label>
            <input v-model="textoBarcode" type="text" class="inputfield" />
          </div>

          <div class="col-span-12 md:col-span-2">
            <label class="font-semibold">Cant.</label>
            <input v-model="cantidadBarcode" type="text" class="inputfield" />
          </div>

          <!-- GENERAR -->
          <div class="col-span-12 md:col-span-4">
            <label class="font-semibold">GENERAR</label>
            <Button 
              class="w-full mt-1"
              label="Generar"
              icon="pi pi-barcode"
              @click="printBarcode"
            />
          </div>

          <!-- RESULTADOS -->
          <div class="col-span-12 p-3 border rounded bg-white flex flex-wrap gap-4" id="codigosgenerados"></div>

        </div>

      </fieldset>
    </div>

  </div>

  <template #footer>
    <Button 
      label="Cerrar" 
      icon="pi pi-times" 
      @click="visibleBarcode = false"
      severity="danger"
    />
  </template>
</Dialog>

 <!-- ////////////////////////////////////////////////////////////////////////////////////////// -->
   <Dialog 
  v-model:visible="visibleIMEI" 
  modal 
  header="Agregar IMEI" 
  :style="{ width: '60rem' }"
>
  <div class="grid grid-cols-12 gap-4">

    <!-- ======================== -->
    <!--        COLUMNA 1         -->
    <!-- ======================== -->
    <div class="col-span-6">
      <fieldset class="border p-3 rounded mb-2">
        <legend class="float-none w-auto px-2">IMEI</legend>

        <div class="grid grid-cols-12 gap-4 mt-1">

          <!-- IMEI -->
          <div class="col-span-12">
            <label class="font-semibold">IMEI</label>
            <InputGroup class="mt-1">
              <InputMask 
                v-model="nuevoIMEI"
                mask="999999999999999"
                placeholder="000000000000000"
                @keydown.enter="fnAgregarIMEI"
              />
              <InputGroupAddon>
                <Button 
                  icon="pi pi-check" 
                  @click="fnAgregarIMEI" 
                  label="Agregar" 
                  size="small" 
                />
              </InputGroupAddon>
              <InputGroupAddon>
                <Button 
                  icon="pi pi-plus" 
                  @click="visibleLOTE = true" 
                  label="Lote"
                  size="small"
                />
              </InputGroupAddon>
            </InputGroup>
          </div>

          <div class="col-span-12">
            <label class="font-semibold">PRECIOS DEL IMEI</label>
            <div class="grid grid-cols-12 gap-3 mt-1">
              <div class="col-span-12 md:col-span-6">
                <label class="text-sm">Precio Compra</label>
                <InputNumber
                  v-model="nuevoIMEIPrecios.precio_compra"
                  mode="currency"
                  currency="DOP"
                  locale="es-DO"
                  class="w-full"
                  :minFractionDigits="2"
                  :maxFractionDigits="2"
                />
              </div>
              <div class="col-span-12 md:col-span-6">
                <label class="text-sm">Precio Venta</label>
                <InputNumber
                  v-model="nuevoIMEIPrecios.precio_venta"
                  mode="currency"
                  currency="DOP"
                  locale="es-DO"
                  class="w-full"
                  :minFractionDigits="2"
                  :maxFractionDigits="2"
                />
              </div>
              <div class="col-span-12 md:col-span-6">
                <label class="text-sm">Precio Mínimo</label>
                <InputNumber
                  v-model="nuevoIMEIPrecios.precio_min"
                  mode="currency"
                  currency="DOP"
                  locale="es-DO"
                  class="w-full"
                  :minFractionDigits="2"
                  :maxFractionDigits="2"
                />
              </div>
              <div class="col-span-12 md:col-span-6">
                <label class="text-sm">Precio x Mayor</label>
                <InputNumber
                  v-model="nuevoIMEIPrecios.precio_xmayor"
                  mode="currency"
                  currency="DOP"
                  locale="es-DO"
                  class="w-full"
                  :minFractionDigits="2"
                  :maxFractionDigits="2"
                />
              </div>
            </div>
          </div>

          <div class="col-span-12">
            <label class="font-semibold">DATOS DEL IMEI</label>
            <div class="grid grid-cols-12 gap-3 mt-1">
              <div class="col-span-12 md:col-span-6">
                <label class="text-sm">Proveedor</label>
                <Dropdown
                  v-model="nuevoIMEIProveedor"
                  :options="proveedores"
                  optionLabel="nombre"
                  editable
                  class="w-full"
                />
              </div>
              <div class="col-span-12 md:col-span-6">
                <label class="text-sm">Capacidad</label>
                <Select
                  v-model="nuevaCapacidadIMEI"
                  :options="opcionesCapacidad"
                  class="w-full"
                />
              </div>
            </div>
          </div>

          <!-- Lote -->
          <div v-if="visibleLOTE" class="col-span-12">
            <label class="font-semibold">AGREGAR POR LOTE (Separados por coma)</label>
            <textarea 
              class="form-control mt-1 p-2 border rounded w-full"
              rows="5"
              v-model="listaAgregarLOTE"
            ></textarea>
            <Button 
              icon="pi pi-plus" 
              class="mt-2" 
              label="Agregar Lote"
              @click="agregarLOTE"
            />
          </div>

        </div>
      </fieldset>
    </div>

    <!-- ======================== -->
    <!--        COLUMNA 2         -->
    <!-- ======================== -->
    <div class="col-span-6">
      <fieldset class="border p-3 rounded mb-2 h-full">
        <legend class="float-none w-auto px-2">LISTA DE IMEI</legend>
        
        <Listbox
          v-model="selectedIMEI"
          :options="imeiProductoList"
          optionLabel="imei"
          class="w-full h-80"
          filter
          @change="fnVerDetalles"
        />
      </fieldset>
    </div>

  </div>

  <!-- Footer -->
  <template #footer>
    <ButtonGroup>
      <Button 
        label="Agregar" 
        icon="pi pi-check" 
        @click="fnAgregarIMEI"
      />
      <Button 
        label="Cancel" 
        icon="pi pi-times"
        severity="danger"
        @click="visibleIMEI = false"
      />
    </ButtonGroup>
  </template>
</Dialog>

 <!-- ////////////////////////////////////////////////////////////////////////////////////////// -->
<!-- ////////////////////////////////////////////////////////////////////////////////////////// -->

    <Dialog v-model:visible="visibleAgregarCategoria" modal :position="position" header="Buscar Imei" :style="{ width: '30rem' }">
    <template #header>
      <div class="inline-flex align-items-center justify-content-center gap-2">
        <span class="font-bold white-space-nowrap">Agregar Categoria</span>
      </div>
    </template>
    <div class="grid grid-cols-12 gap-4">

  <fieldset class="border p-3 rounded mb-2">
    <legend class="float-none w-auto px-2">CATEGORIA</legend>
     <form id="formularioAgregarClientes" action="" method="">
         <div  style="margin-top: 15px;color: #34AAB2;" class="grid grid-cols-12 gap-4">

            <div class="form-group col-span-12">
            <label for="ingresenumeroModifcarfactura">CATEGORIA</label>
             <input type="text" class="form-control" v-mayuscula v-model="agregarCategoria">
           </div>


        </div>
        </form>
</fieldset>

    </div>
    <template #footer>

<ButtonGroup >
    <Button label="Agregar" icon="pi pi-check" @click="fnAgregarCategoria" outlined />
    <Button label="Cancel" icon="pi pi-times" severity="danger" @click="visibleAgregarCategoria = false" outlined />
</ButtonGroup>


    </template>
  </Dialog>
 <!-- ////////////////////////////////////////////////////////////////////////////////////////// -->
    <Dialog v-model:visible="visibleAgregarMarca" modal :position="position" header="Buscar Imei" :style="{ width: '30rem' }">
    <template #header>
      <div class="inline-flex align-items-center justify-content-center gap-2">
        <span class="font-bold white-space-nowrap">Agregar Categoria</span>
      </div>
    </template>
    <div class="grid grid-cols-12 gap-4">

  <fieldset class="border p-3 rounded mb-2">
    <legend class="float-none w-auto px-2">MARCA</legend>
     <form id="formularioAgregarClientes" action="" method="">
         <div  style="margin-top: 15px;color: #34AAB2;" class="grid grid-cols-12 gap-4">

            <div class="form-group col-span-12">
            <label for="ingresenumeroModifcarfactura">MARCA</label>
             <input type="text" class="form-control" v-mayuscula v-model="agregarMarca">
           </div>


        </div>
        </form>
</fieldset>

    </div>
    <template #footer>

<ButtonGroup >
    <Button label="Agregar" icon="pi pi-check" @click="fnAgregarMarca" outlined />
    <Button label="Cancel" icon="pi pi-times" severity="danger" @click="visibleAgregarMarca = false" outlined />
</ButtonGroup>


    </template>
  </Dialog>
 <!-- ////////////////////////////////////////////////////////////////////////////////////////// -->
     <Dialog
      v-model:visible="visibleProveedor"
      modal
      :position="position"
      :style="{ width: '42rem' }"
      :breakpoints="{ '960px': '90vw', '640px': '95vw' }"
    >
    <template #header>
      <div class="flex items-center gap-2">
        <i class="pi pi-building text-green-600 text-lg"></i>
        <span class="font-bold text-lg">Agregar Proveedor</span>
      </div>
    </template>

    <div class="rounded-xl border border-slate-200 bg-slate-50 p-4">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div class="md:col-span-2">
          <label for="nombreAgregarDatos" class="block text-sm font-semibold text-slate-700 mb-1">Nombre</label>
          <InputText
            id="nombreAgregarDatos"
            v-model="proveedor.nombre"
            v-mayuscula
            placeholder="Nombre del proveedor"
            class="w-full"
            maxlength="250"
          />
        </div>

        <div class="md:col-span-2">
          <label for="rncAgregarDatos" class="block text-sm font-semibold text-slate-700 mb-1">RNC</label>
          <InputGroup>
            <InputText
              id="rncAgregarDatos"
              v-model="proveedor.rnc"
              placeholder="Buscar RNC"
              maxlength="250"
            />
            <Button icon="pi pi-search" label="Buscar" severity="secondary" @click="buscarRNC" />
          </InputGroup>
        </div>

        <div>
          <label for="telefonoAgregarDatos" class="block text-sm font-semibold text-slate-700 mb-1">Telefono</label>
          <InputMask
            id="telefonoAgregarDatos"
            v-model="proveedor.telefono"
            :mask="patronTelefono"
            :placeholder="patronTelefono"
            class="w-full"
          />
        </div>

        <div>
          <label for="emailAgregarDatos" class="block text-sm font-semibold text-slate-700 mb-1">Email</label>
          <InputText
            id="emailAgregarDatos"
            v-model="proveedor.email"
            placeholder="correo@proveedor.com"
            class="w-full"
            maxlength="250"
          />
        </div>

        <div>
          <label for="encargadoAgregarDatos" class="block text-sm font-semibold text-slate-700 mb-1">Encargado</label>
          <InputText
            id="encargadoAgregarDatos"
            v-model="proveedor.encargado"
            v-mayuscula
            placeholder="Nombre del encargado"
            class="w-full"
            maxlength="250"
          />
        </div>

        <div>
          <label for="cuenta_bancariaAgregarDatos" class="block text-sm font-semibold text-slate-700 mb-1">Cuenta Bancaria</label>
          <InputText
            id="cuenta_bancariaAgregarDatos"
            v-model="proveedor.cuenta_bancaria"
            placeholder="Cuenta bancaria"
            class="w-full"
            maxlength="250"
          />
        </div>

        <div class="md:col-span-2">
          <label for="direccionAgregarDatos" class="block text-sm font-semibold text-slate-700 mb-1">Direccion</label>
          <Textarea
            id="direccionAgregarDatos"
            v-model="proveedor.direccion"
            rows="3"
            placeholder="Direccion del proveedor"
            class="w-full"
          />
        </div>
      </div>
    </div>

    <template #footer>
      <div class="flex justify-end gap-2 w-full">
        <Button label="Cancelar" icon="pi pi-times" severity="secondary" outlined @click="visibleProveedor = false" />
        <Button label="Agregar" icon="pi pi-check" severity="success" @click="fnAgregarProveedor" />
      </div>
    </template>
  </Dialog>
 <!-- ////////////////////////////////////////////////////////////////////////////////////////// -->
     <!-- Dialog para el FileManager -->
    <Dialog
      v-model:visible="showFileManager"
      :header="`Gestor de Archivos - ${currentDirectory}`"
      :style="{ width: '90vw', maxWidth: '1200px' }"
      :modal="true"
      :dismissableMask="true"
      maximizable
    >
      <FileManager
        v-if="showFileManager"
        :cliente="datoscampos.imagen"
        baseFolder="productos"
        directory-name=""
        :allow-upload="true"
        :allow-delete="true"
        :multiple="true"
      />
    </Dialog>
 <!-- ////////////////////////////////////////////////////////////////////////////////////////// -->

<!-- Dialog para agregar IMEI -->

<!-- Dialog Cambiar Precios a todos los IMEIs -->
<Dialog v-model:visible="visibleCambiarPreciosIMEI" modal header="Cambiar precios a todos los IMEIs" :style="{ width: '26rem' }">
  <div class="flex flex-col gap-4 pt-2">
    <div class="flex flex-col gap-1">
      <label class="font-semibold text-sm">Precio Compra</label>
      <InputNumber v-model="nuevosPrecios.precio_compra" mode="currency" currency="DOP" locale="es-DO" class="w-full" placeholder="0.00" />
    </div>
    <div class="flex flex-col gap-1">
      <label class="font-semibold text-sm">Precio Venta</label>
      <InputNumber v-model="nuevosPrecios.precio_venta" mode="currency" currency="DOP" locale="es-DO" class="w-full" placeholder="0.00" />
    </div>
    <div class="flex flex-col gap-1">
      <label class="font-semibold text-sm">Precio Mínimo</label>
      <InputNumber v-model="nuevosPrecios.precio_min" mode="currency" currency="DOP" locale="es-DO" class="w-full" placeholder="0.00" />
    </div>
    <div class="flex flex-col gap-1">
      <label class="font-semibold text-sm">Precio x Mayor</label>
      <InputNumber v-model="nuevosPrecios.precio_xmayor" mode="currency" currency="DOP" locale="es-DO" class="w-full" placeholder="0.00" />
    </div>
    <small class="text-gray-500">Solo se actualizan los campos que rellenes. Los que dejes vacios no se modifican.</small>
  </div>
  <template #footer>
    <Button label="Cancelar" severity="secondary" @click="visibleCambiarPreciosIMEI = false" />
    <Button label="Aplicar a todos" icon="pi pi-check" @click="fnAplicarPreciosATodosIMEI" />
  </template>
</Dialog>

   </main>
<Toast />
</template>
<style scoped>
.form-group {
  margin-top: 10px;
}

.flex-between {
  justify-content: space-between;
  align-items: center;
}

/* ===================================
   // EDITAR PRODUCTO - MODERN STYLING
   =================================== */

/* Header */
.editar-producto-header {
  background: linear-gradient(135deg, #ff6b35 0%, #f7931e 50%, #ffb347 100%);
  border-radius: 20px;
  padding: 2rem;
  margin-bottom: 2rem;
  box-shadow: 0 8px 32px rgba(255, 107, 53, 0.3);
  animation: slideIn 0.6s ease-out;
}

.editar-producto-header-content {
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.editar-producto-icon-wrapper {
  width: 80px;
  height: 80px;
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(10px);
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid rgba(255, 255, 255, 0.3);
}

.editar-producto-icon {
  font-size: 2.5rem;
  color: white;
}

.editar-producto-title {
  font-size: 2rem;
  font-weight: 800;
  color: white;
  margin: 0;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.editar-producto-subtitle {
  font-size: 1rem;
  color: rgba(255, 255, 255, 0.95);
  margin: 0.25rem 0 0 0;
}

/* Navigation Card */
.editar-producto-nav-card {
  margin-bottom: 1.5rem;
  border-radius: 16px;
  border: 2px solid #ffedd5;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
}

.editar-producto-nav-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
}

@media (max-width: 768px) {
  .editar-producto-nav-grid {
    grid-template-columns: 1fr;
  }
}

.editar-producto-nav-group {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.editar-producto-nav-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1.125rem;
  font-weight: 700;
  color: #ff6b35;
  margin: 0;
}

.editar-producto-nav-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

/* Shortcuts Card */
.editar-producto-shortcuts-card {
  margin-bottom: 1.5rem;
  border-radius: 16px;
  border: 2px solid #e0f2fe;
  background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
}

.editar-producto-shortcuts-content {
  display: flex;
  flex-wrap: wrap;
  gap: 1.5rem;
  align-items: center;
}

.editar-producto-shortcut-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.editar-producto-shortcut-key {
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  font-weight: 600;
  font-size: 0.875rem;
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.3);
}

.editar-producto-shortcut-desc {
  font-size: 0.875rem;
  color: #475569;
  font-weight: 500;
}

.editar-producto-toggle {
  min-width: 200px;
}

/* Search Card */
.editar-producto-search-card {
  margin-bottom: 1.5rem;
  border-radius: 16px;
  border: 2px solid #ffedd5;
}

.editar-producto-search-content {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.editar-producto-search-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1rem;
  font-weight: 600;
  color: #ff6b35;
}

.editar-producto-search-input {
  width: 100%;
  border: 2px solid #ffedd5;
  border-radius: 10px;
  padding: 0.75rem;
  font-size: 1rem;
  transition: all 0.3s ease;
}

.editar-producto-search-input:focus {
  outline: none;
  border-color: #ff6b35;
  box-shadow: 0 0 0 3px rgba(255, 107, 53, 0.1);
}

/* Section Divider */
.editar-producto-section-divider {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin: 2rem 0 1.5rem 0;
}

.editar-producto-divider-line {
  flex: 1;
  height: 2px;
  background: linear-gradient(90deg, transparent, #ff6b35, transparent);
}

.editar-producto-divider-content {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1.5rem;
  background: linear-gradient(135deg, #ff6b35, #f7931e);
  color: white;
  border-radius: 20px;
  font-weight: 600;
  font-size: 0.875rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  box-shadow: 0 4px 12px rgba(255, 107, 53, 0.3);
}

/* Form Card */
.editar-producto-form-card {
  border-radius: 16px;
  border: 2px solid #ffedd5;
  margin-bottom: 2rem;
}

/* Form Sections */
.editar-producto-form-section {
  margin-bottom: 2rem;
  padding: 1.5rem;
  background: rgba(255, 237, 213, 0.3);
  border-radius: 12px;
  border: 1px solid #ffedd5;
}

.editar-producto-section-title {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 1.25rem;
  font-weight: 700;
  color: #ff6b35;
  margin: 0 0 1.5rem 0;
}

.editar-producto-section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.editar-producto-form-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
}

@media (max-width: 1024px) {
  .editar-producto-form-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .editar-producto-form-grid {
    grid-template-columns: 1fr;
  }
}

.editar-producto-form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.editar-producto-form-group-wide {
  grid-column: span 2;
}

.editar-producto-label {
  font-size: 0.875rem;
  font-weight: 600;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* Estilos base para inputs y selects usando Tailwind sera aplicado directamente en el template */

/* Images Grid */
.editar-producto-images-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1rem;
  margin-top: 1rem;
}

.editar-producto-image-item {
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  padding: 0.75rem;
  text-align: center;
  transition: all 0.3s ease;
}

.editar-producto-image-item:hover {
  border-color: #ff6b35;
  box-shadow: 0 4px 12px rgba(255, 107, 53, 0.15);
}

.editar-producto-image {
  width: 100%;
  border-radius: 8px;
  margin-bottom: 0.5rem;
}

.editar-producto-image-delete {
  width: 100%;
}

/* Submit Button */
.editar-producto-submit-container {
  display: flex;
  justify-content: center;
  margin-top: 2rem;
  padding-top: 2rem;
  border-top: 2px solid #ffedd5;
}

.editar-producto-submit-btn {
  min-width: 300px;
  height: 3.5rem;
  font-size: 1.125rem;
  font-weight: 700;
  border-radius: 12px;
  background: linear-gradient(135deg, #ff6b35, #ff8c42);
  border: none;
  box-shadow: 0 8px 24px rgba(255, 107, 53, 0.3);
  transition: all 0.3s ease;
}

.editar-producto-submit-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 32px rgba(255, 107, 53, 0.4);
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.inputfield {
  @apply w-full border p-2 rounded outline-none focus:ring-2 ring-blue-400;
}

.inputselect {
  @apply w-full border p-2 rounded bg-white outline-none focus:ring-2 ring-blue-400;
}

/* ===== ESTILOS PARA IMEI ===== */
.imei-datatable-editar :deep(.p-datatable-thead > tr > th) {
  background: linear-gradient(to bottom, #f9fafb, #f3f4f6);
  color: #374151;
  font-weight: 600;
  font-size: 0.875rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 1rem;
  border-bottom: 2px solid #e5e7eb;
}

.imei-datatable-editar :deep(.p-datatable-tbody > tr:hover) {
  background: #f0f9ff !important;
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
}

.imei-code-edit {
  font-family: 'Courier New', monospace;
  font-size: 0.95rem;
  font-weight: 600;
  background: linear-gradient(135deg, #e0e7ff 0%, #f0f9ff 100%);
  padding: 0.4rem 0.8rem;
  border-radius: 6px;
  color: #1e40af;
  border: 1px solid #bfdbfe;
  display: inline-block;
}

.no-imeis-message {
  text-align: center;
  padding: 3rem 1rem;
  background: #f9fafb;
  border-radius: 12px;
  border: 2px dashed #d1d5db;
}

.no-imeis-message i {
  display: block;
  margin-bottom: 0.75rem;
}

.imei-dialog-icon-add {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}

.imei-add-dialog :deep(.p-dialog-header) {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
  padding: 1.5rem;
  border-radius: 12px 12px 0 0;
}

.imei-add-dialog :deep(.p-dialog-content) {
  padding: 0;
}

.imei-add-dialog :deep(.p-dialog-footer) {
  background: white;
  border-top: 1px solid #e5e7eb;
  padding: 1rem 1.5rem;
}

/* Estilos para detalles de IMEI en Swal */
.imei-details-container {
  text-align: left;
  max-height: 400px;
  overflow-y: auto;
}

.imei-row {
  display: flex;
  justify-content: space-between;
  padding: 0.75rem;
  border-bottom: 1px solid #e5e7eb;
}

.imei-row:last-child {
  border-bottom: none;
}

.imei-label {
  font-weight: 600;
  color: #374151;
  min-width: 140px;
}

.imei-value {
  color: #6b7280;
  text-align: right;
  word-break: break-word;
}

.imei-details-popup {
  border-radius: 12px !important;
}

.imei-details-title {
  color: #1f2937 !important;
  font-weight: 700 !important;
}

</style>
