<script setup>
import { ref, onMounted, nextTick, watchEffect, computed, watch } from 'vue';
import axios from 'axios';
import { enviarDatosPorPost, eliminarDatos, obtenerIdsSeleccionados, borrarTodoslosDatos, lenguajeDataTable, nfecha, arrayToObjetoFromTabla,generarTablaFromStringJSON, peticionesFetch, encryptarPassword, envioElectron, mensajetoast,formatearFecha,transformarFechaTimestamp, 
crearTablaSiNoExiste, 
peticiones, 
crearTablaSiNoExisteOffline,
 peticionesFetchOffline,
 buscadorArrayObjeto,
 sincronizarStockProductoPorImeiDisponible,
lasMayusculas } from '@/funciones/funciones.js';
import Swal from 'sweetalert2'
import { useRouter,useRoute } from 'vue-router';
const router = useRouter();
import { useToast } from "primevue/usetoast";
const toast = useToast();
import Awesomplete from '@/components/Awesomplete.vue';
import LoadingOverlay from '@/Loading/LoadingOverlay.vue';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
/************************************************************************/
const visibleAbonosInteligentes = ref(false)
const datosAbonosInteligentes = ref([])
const visibleBarcodeConfig = ref(false)
/************************************************************************/
const datosJSON = ref([])
/************************************************************************/
const menuInteligente = ref();
const buscadorFechaInteligente = ref()
const fechaInteligente = ref(false)
/************************************************************************/
const datosBarcode = ref({});
const codigoBarcode = ref('');
const textoBarcode = ref('');
/************************************************************************/
const usuarioLocal = ref({})
const loading = ref(true)
/************************************************************************/
const camposArray = ["imei, estado,bateria, fecha, equipo, proveedor, id_equi,precio_compra,precio_venta,precio_min,precio_xmayor,ganancia,no_compra,no_factura,fecha_venta, hora_venta, comprador, detalles, usuario","almacen","marca","modelo","vendedor","cedula","telefono","direccion","nota","capacidad"];
/************************************************************************/
import { useDatosEmpresa } from '@/stores'
const datosEmpresa = useDatosEmpresa();
const link = ref('');
const api = ref('');
const token = ref('');
const patronTelefono = ref('');
const linkImpresora = ref('');
const patroncedula = ref('');
const tokenCifrado = ref('');
const tokenCorto = ref('');
/************************************************************************/
const position = ref('top');
const openPosition = (pos) => {
 position.value = pos;
 visible.value = true;
}
/************************************************************************/
const datoscamposImei = ref({})
const listaBuscador = ref([])
const productosArray = ref([])
const proveedoresLista = ref([])
const equipoSuggestionsCrear = ref([])
const qr = ref(false)
/************************************************************************/
const visible = ref(false);
const visiblecrear = ref(false);
const value = ref(null);
const id = ref(null);
const datoscampos = ref({});
const data = ref([]);
const searchQuery = ref('');
const ImeiEditar = ref(null);
const opcionesCapacidad = ref(['32GB', '64GB', '128GB', '256GB', '512GB', '1TB', '2TB']);
/************************************************************************/
const selectedImei = ref([]);
/************************************************************************/
const estadoFiltro = ref('DISPONIBLE')
const almacenFiltro = ref('')
const almacenesDisponibles = ref([])
watch(almacenFiltro, () => fetchAndSetupData())
/************************************************************************/
const visibleCambiarEquipo = ref(false)
const imeisCambioEquipo = ref([])
const equipoBuscador = ref('')
const equipoSeleccionado = ref(null)
const cambioEquipoPrecios = ref({
 precio_compra: 0,
 precio_venta: 0,
 precio_min: 0,
 precio_xmayor: 0
})
const productosFiltradosEquipo = computed(() => {
 if (!equipoBuscador.value) return productosArray.value;
 const q = equipoBuscador.value.toLowerCase();
 return productosArray.value.filter(p =>
 p.nombre.toLowerCase().includes(q) ||
 p.codigo.toLowerCase().includes(q) ||
 p.marca.toLowerCase().includes(q)
 );
})
/************************************************************************/
watch(equipoSeleccionado, (producto) => {
 if (!producto) {
  cambioEquipoPrecios.value = {
   precio_compra: 0,
   precio_venta: 0,
   precio_min: 0,
   precio_xmayor: 0
  }
  return
 }

 cambioEquipoPrecios.value = {
  precio_compra: Number(producto.precio_compra || 0),
  precio_venta: Number(producto.precio_venta || 0),
  precio_min: Number(producto.precio_min || 0),
  precio_xmayor: Number(producto.precio_xmayor || 0)
 }
})
/************************************************************************/
// Variables para cambio masivo de precios
const visibleCambioMasivoPrecios = ref(false)
const cambioMasivo = ref({
  tipoSeleccion: 'equipo', // 'equipo', 'estado' o 'individual'
  equipoSeleccionado: null,
  estadoSeleccionado: 'DISPONIBLE',
  imeisSeleccionados: [], // Array de IMEIs seleccionados para cambio individual
  tipoAjuste: 'porcentaje', // 'porcentaje' o 'valor'
  valorAjuste: 0,
  aplicarA: ['precio_venta'], // puede incluir: precio_venta, precio_min, precio_xmayor
  direccion: 'aumentar' // 'aumentar' o 'disminuir'
})
// Computed para obtener lista única de equipos
const equiposDisponibles = computed(() => {
  const equipos = [...new Set(data.value.map(item => item.equipo).filter(Boolean))]
  return equipos.sort()
})
/************************************************************************/
async function limpiarCamposCrear() {
datoscamposImei.value = {}
await campos();
datoscamposImei.value.bateria = 100
datoscamposImei.value.capacidad = '128GB'
}
/************************************************************************/
const saberSiesJSON = ref(false)
/************************************************************************/
/************************************************************************/
watchEffect(() => {
 if (visiblecrear.value) {
 lasMayusculas();
 datoscamposImei.value.fecha = nfecha('fecha')
 datoscamposImei.value.estado = datoscamposImei.value.estado || 'DISPONIBLE'
 datoscamposImei.value.bateria = 100
 datoscamposImei.value.capacidad = datoscamposImei.value.capacidad || '128GB'
 datoscamposImei.value.precio_compra = datoscamposImei.value.precio_compra || 0
 datoscamposImei.value.precio_venta = datoscamposImei.value.precio_venta || 0
 datoscamposImei.value.precio_min = datoscamposImei.value.precio_min || 0
 datoscamposImei.value.precio_xmayor = datoscamposImei.value.precio_xmayor || 0

 datoscamposImei.value.detalles = datoscamposImei.value.detalles || `ALMACENAMIENTO: 
BATERIA TESTEADA: si
BATERIA QUE MARCA: original
DETALLES ESTETICOS: Ninguno
DETALLES INTERNOS: Ninguno
BATERIA MARCA: 100%`

 }
});
/************************************************************************/
const parsedDetails = computed(() => {
 if (saberSiesJSON.value && datoscampos.value.detalles) {
 try {
 const parsed = JSON.parse(datoscampos.value.detalles);
 return Object.entries(parsed).map(([key, value]) => ({ key, value }));
 } catch (e) {
 console.error("Error al parsear JSON:", e);
 return [];
 }
 }
 return [];
});
/************************************************************************/
const sincronizarStockPorImeis = async (idsEqui = []) => {
 const idsUnicos = [...new Set((idsEqui || []).filter((id) => id!== null && id!== undefined && id!== ''))];
 for (const idEqui of idsUnicos) {
 try {
 await sincronizarStockProductoPorImeiDisponible(idEqui);
 } catch (error) {
 console.error(`Error sincronizando stock para id_equi ${idEqui}:`, error);
 }
 }
}
/************************************************************************/
function isValidJSON(str) {
 try {
 JSON.parse(str);
 return true;
 } catch (e) {
 return false;
 }
}
/************************************************************************/
const fetchAndSetupData = async () => {
 let response;
 if (almacenFiltro.value) {
 response = await peticionesFetchOffline('getDataByCondition', 'imei', 'almacen', almacenFiltro.value);
 } else {
 response = await peticionesFetchOffline('getDataAsArray', 'imei');
 }
 data.value = response.reverse();
};
/************************************************************************/
async function campos() {
 const campos = await arrayToObjetoFromTabla(link.value+api.value, tokenCifrado.value, 'imei', true,camposArray,'usuario');
 datoscamposImei.value = campos;
}
/************************************************************************/
const arrayProductos = async()=>{
 const response = await peticionesFetchOffline('getDataArrayByCondition','productos','categoria','CELULARES');
 productosArray.value = response;
 listaBuscador.value = response.map(producto=>producto.nombre);
}
/************************************************************************/
const fetchProveedores = async () => {
 const response = await peticionesFetchOffline('getDataAsArray', 'proveedores');
 proveedoresLista.value = Array.isArray(response) ? response : [];
}

/************************************************************************/
const fetchDataBarcode = async () => {
const response = await peticionesFetchOffline('getDataByField', 'barcode','id',1);
 const jsonData = response;
 datosBarcode.value = jsonData;
};
/************************************************************************/
const datosConfig = async()=>{
const response = await envioElectron('datosarchivo');
 datosJSON.value = response;
link.value = datosJSON.value.VITE_LINKURL;
api.value = datosJSON.value.VITE_LINK_API;
token.value = datosJSON.value.VITE_TOKEN;
tokenCorto.value = datosJSON.value.VITE_TOKEN_CORTO;
patronTelefono.value = datosJSON.value.VITE_PATRON_TELEFONO;
patroncedula.value = datosJSON.value.VITE_PATRON_CEDULA;
}
/************************************************************************/
onMounted(async () => {
await datosConfig()

tokenCifrado.value = await encryptarPassword(token.value, 10);
await crearTablaSiNoExisteOffline('imei',camposArray.join(','),toast)
usuarioLocal.value = datosEmpresa.usuario;
await campos();

const empresasResp = await peticionesFetchOffline('getDataAsArray', 'empresa');
almacenesDisponibles.value = empresasResp.map(e => e.nombre);
almacenFiltro.value = datosEmpresa.empresa.nombre;

await fetchAndSetupData();
await fetchDataBarcode();
await arrayProductos();
await fetchProveedores();
loading.value = false
});
/************************************************************************/
 async function borrarTodo() {
 Swal.fire({
        title: "Estas seguro",
        text: "Se borraran los datos!",
 icon: "warning",
 showCancelButton: true,
        confirmButtonText: "Si, de acuerdo",
 cancelButtonText: "No, cancelar"
 }).then(async (result) => {
 if (result.isConfirmed) {
 const { value: password } = await Swal.fire({
                title: 'Introduce la contrasena',
 input: 'password',
                inputPlaceholder: 'Contrasena',
 showCancelButton: true,
 confirmButtonText: 'Confirmar',
 cancelButtonText: 'Cancelar'
 });
 if (password) {
 if (password === token.value || password === tokenCorto.value) {
 const envioDatos = await peticionesFetchOffline('deleteAll', 'imei');
 if (envioDatos[0] == 'ok') {
 await sincronizarStockPorImeis(data.value.map((i) => i.id_equi));
 fetchAndSetupData();
 toast.add({ severity: 'success', summary: 'Éxito', detail: 'Datos borrados', life: 3000 });
 } else {
 toast.add({ severity: 'error', summary: 'Error', detail: 'Fallo al borrar datos.', life: 3000 });
 }
 } else {
                    toast.add({ severity: 'error', summary: 'Error', detail: 'Contrasena incorrecta', life: 3000 });
 }
 }
 } else if (result.dismiss === Swal.DismissReason.cancel) {
 toast.add({ severity: 'success', summary: 'No te preocupes', detail: 'Datos seguros', life: 3000 });
 }
 });
}
/************************************************************************/
async function funcionActualizar() {
 const url = link.value+api.value+"/actualizarcampos/imei";
 if (!datoscampos.value) {
 console.error("Datos incompletos, no se puede actualizar.");
 return;
 }
 if (datoscampos.value.hasOwnProperty('created_at')) {
 datoscampos.value.updated_at = nfecha('timestamp');
 }
 const envioDatos = await peticionesFetchOffline('updateData','imei',JSON.stringify(datoscampos.value));
 if (envioDatos[0] == 'ok') {
 visible.value = false;
 fetchAndSetupData();
 toast.add({ severity: 'success', summary: 'Éxito', detail: 'Datos Actualizados', life: 3000 });
 } else {
 toast.add({ severity: 'error', summary: 'Error', detail: 'Fallo al actualizar los datos.', life: 3000 });
 }
}
/************************************************************************/
async function funcionCrear() {
 const url = link.value+api.value+"/insertar/imei";
 if (datoscamposImei.value.hasOwnProperty('created_at')) {
 datoscamposImei.value.created_at = nfecha('timestamp');
 datoscamposImei.value.updated_at = nfecha('timestamp');
 }
 datoscamposImei.value.almacen = datosEmpresa.empresa.nombre;
 const envioDatos = await peticionesFetchOffline('insertData','imei',JSON.stringify(datoscamposImei.value));
 if (envioDatos[0] == 'ok') {
 await sincronizarStockPorImeis([datoscamposImei.value.id_equi]);
 fetchAndSetupData();
 toast.add({ severity: 'success', summary: 'Éxito', detail: 'Datos Agregados', life: 3000 });
 limpiarCamposCrear();
 visiblecrear.value = false;
 } else {
 toast.add({ severity: 'error', summary: 'Error', detail: 'Fallo al Agregar los datos.', life: 3000 });
 }
}
/************************************************************************/
async function borrarSeleccionados() {
 const ids = obtenerIdsSeleccionados(selectedImei.value);
 Swal.fire({
        title: "Estas Seguro",
 text: "Se Borraran los Datos!",
 icon: "warning",
 showCancelButton: true,
        confirmButtonText: "Si, de acuerdo!",
 cancelButtonText: "No, cancelar!",
 }).then(async (result) => {
 if (result.isConfirmed) {
 const { value: password } = await Swal.fire({
                title: 'Introduce la contrasena',
 input: 'password',
                inputPlaceholder: 'Contrasena',
 showCancelButton: true,
 confirmButtonText: 'Confirmar',
 cancelButtonText: 'Cancelar'
 });
 if (password) {
 if (password === token.value || password === tokenCorto.value) {
 let exitoTotal = true;
 const idsEquiAfectados = [];
 if (ids.length > 0) {
 for (const id of ids) {
 try {
 const rowData = data.value.find(item => item.id == id);
 const envioDatos = await peticionesFetchOffline('deleteEntry','imei', id);
 if (envioDatos[0] == 'ok' && rowData.id_equi) {
 idsEquiAfectados.push(rowData.id_equi);
 } else if (envioDatos[0] != 'ok') {
 exitoTotal = false;
 }
 } catch (error) {
 console.error(`Error al eliminar datos para ID: ${id}`, error);
 exitoTotal = false;
 }
 }
 await sincronizarStockPorImeis(idsEquiAfectados);
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
                    toast.add({ severity: 'error', summary: 'Error', detail: 'Contrasena incorrecta', life: 3000 });
 }
 }
 } else if (result.dismiss === Swal.DismissReason.cancel) {
 toast.add({ severity: 'success', summary: 'No te preocupes', detail: 'Datos Seguros', life: 3000 });
 }
 });
}

/************************************************************************/
async function actualizarStockProducto(id, operacion = 'restar') {
 // Filtrar productos con el mismo id_equi
 const cantidadProductosArray = data.value.filter(prod => prod.id_equi == id);

 // Encontrar el producto en productosArray
 const datosProducto = productosArray.value.find(prod => prod.id == id);

 // Validar si datosProducto existe
 if (!datosProducto) {
 console.error(`Producto con ID ${id} no encontrado en productosArray`);
 return;
 }



 const disponiblesIMEI = data.value.filter(datos=>datos.estado === 'DISPONIBLE')
 


 /* // Calcular nuevo stock basado en la operacion
 if (operacion === 'sumar') {
 } else {
 datosProducto.stock = Math.max(0, cantidadProductosArray.length - 1); // Asegurarse de que el stock no sea negativo
 }*/

 datosProducto.stock = disponiblesIMEI.length;
 // Preparar URL y actualizar timestamp
 const url = `${link.value}${api.value}/actualizarcampos/productos`;
 if (datosProducto.hasOwnProperty('created_at')) {
 datosProducto.updated_at = nfecha('timestamp');
 }

 // Enviar datos a la API
 const envioDatos = await peticionesFetchOffline('updateData','productos',JSON.stringify(datosProducto));
 if (envioDatos[0] == 'ok') {
 toast.add({ severity: 'success', summary: 'Éxito', detail: 'Stock Actualizado', life: 3000 });
 } else {
 toast.add({ severity: 'error', summary: 'Error', detail: 'Fallo al actualizar el stock.', life: 3000 });
 }
}

/************************************************************************/
const datosIMEI = ref({})
/******************************************************/
const fnagregarImei = async()=>{
 //event.stopImmediatePropagation()
 const imeiArrayLocalStorage = JSON.parse(window.localStorage.getItem('arrayIMEI')) || [];
 let productosVenta = ref(JSON.parse(window.localStorage.getItem('productosVenta')) || []);

 const verifica = imeiArrayLocalStorage.find(equipo=>equipo.imei == datosIMEI.value.imei)
 if (verifica) {
 toast.add({ severity: 'error', summary: 'Upps', detail: `Equipo ${datosIMEI.value.equipo} Encontrado en la Lista, No se puede agregar 2 veces`, life: 3000 });
 return
 }


 const datosEquipo = await peticionesFetchOffline('getDataByField', 'productos','id',datosIMEI.value.id_equi);
 //const datosEquipo = productosArray.value.find(prod=>prod.id == datosIMEI.value.id_equi)
 if (datosEquipo) {
 toast.add({ severity: 'success', summary: 'Encontrado', detail: `Equipo ${datosEquipo.nombre} agregado`, life: 3000 });
 imeiArrayLocalStorage.push({imei:datosIMEI.value.imei,id_equi:datosIMEI.value.id_equi});

 const productoExistente = productosVenta.value.find(prod => prod.codigo === datosEquipo.codigo);
 if (productoExistente) {

 if (!datosEquipo.lista_imei) {
 const imeiLista = stringParentesis(productoExistente.nombre);
 productoExistente.lista_imei = imeiLista;
 }
 const listaImei = productoExistente.lista_imei.split(',')
 listaImei.push(datosIMEI.value.imei)

 datosEquipo.nombre = datosEquipo.nombre + ` (${listaImei.join(',')})`
 datosEquipo.lista_imei = listaImei.join(',')

 productoExistente.nombre = datosEquipo.nombre
 productoExistente.lista_imei = datosEquipo.lista_imei
 productoExistente.cantidad += 1;
 } else {
 datosEquipo.cantidad = 1
 datosEquipo.descuento = 0.00
 datosEquipo.nombre = datosEquipo.nombre + ` (${datosIMEI.value.imei})`
 datosEquipo.lista_imei = datosIMEI.value.imei

 productosVenta.value.push(datosEquipo);
 }
 window.localStorage.setItem('productosVenta',JSON.stringify(productosVenta.value))
 window.localStorage.setItem('arrayIMEI',JSON.stringify(imeiArrayLocalStorage))
 router.push({ path: `/vender` });

 }


}
/************************************************************************/
const impresoraselected = ref('4BARCODE')
const cantidadBarcode = ref(1)
const incluirCabecera = ref(true)
const incluirTexto = ref(false)
const incluirCodigo = ref(true)
const incluirPrecio = ref(false)
const precioBarcode = ref('0.00')

const printBarcode = () => {
 const content = {
 barcodeData: {
 barcodetype: datosBarcode.value.barcodetype || 'CODE128',
 barwidth: parseInt(datosBarcode.value.barwidth) || 2,
 barheight: parseInt(datosBarcode.value.barheight) || 50,
 labelwidth: parseInt(datosBarcode.value.labelwidth) || 80,
 labelheight: parseInt(datosBarcode.value.labelheight) || 40,
 fontsize: parseInt(datosBarcode.value.fontsize) || 12,
 margen_izq: parseInt(datosBarcode.value.margen_izq) || 0,
 margen_der: parseInt(datosBarcode.value.margen_der) || 0,
 margen_sup: parseInt(datosBarcode.value.margen_sup) || 0,
 margen_inf: parseInt(datosBarcode.value.margen_inf) || 0,
 codigo: codigoBarcode.value,
 },
 labelWidth: parseInt(datosBarcode.value.labelwidth) || 80,
 labelHeight: parseInt(datosBarcode.value.labelheight) || 40,
 margins: {
 top: parseInt(datosBarcode.value.margen_sup) || 0,
 right: parseInt(datosBarcode.value.margen_der) || 0,
 bottom: parseInt(datosBarcode.value.margen_inf) || 0,
 left: parseInt(datosBarcode.value.margen_izq) || 0
 },
 incluirCabecera: incluirCabecera.value,
 incluirTexto: incluirTexto.value,
 incluirCodigo: incluirCodigo.value,
 incluirOtro: false,
 incluirPrecio: incluirPrecio.value,
 headerText: datosEmpresa.empresa.nombre,
 code: codigoBarcode.value,
 text: textoBarcode.value,
 precio: precioBarcode.value,
 width: parseInt(datosBarcode.value.barwidth) || 2,
 height: parseInt(datosBarcode.value.barheight) || 50,
 fontSize: parseInt(datosBarcode.value.fontsize) || 12,
 cantidad: cantidadBarcode.value || 1,
 tipo: datosBarcode.value.barcodetype || 'CODE128',
 printerName: datosBarcode.value.impresora,
 qr: qr.value,
 orientacion: 'vertical'
 };
 window.electron.ipcRenderer.invoke('print-barcode', content);

};
/************************************************************************/
const itemsImei = ref([]);
const menu = ref(null);
const currentRowData = ref(null);


const toggleImei = async (event, rowData) => {
 currentRowData.value = rowData;
 itemsImei.value = [
 { label: 'Editar', icon: 'pi pi-pencil', command: () => { 
 visible.value = true;
 saberSiesJSON.value = isValidJSON(currentRowData.value.detalles)
 datoscampos.value = currentRowData.value;

 } 
 },
 { label: 'Estado', icon: 'pi icon-exchange', command: async () => { 
 if (rowData.estado === 'DISPONIBLE') {
 rowData.estado = 'VENDIDO';
 await actualizarStockProducto(rowData.id_equi, 'restar');
 } else if (rowData.estado === 'VENDIDO') {
 rowData.estado = 'DISPONIBLE';
 await actualizarStockProducto(rowData.id_equi, 'sumar');
 }

 const url = `${link.value}${api.value}/actualizarcampos/imei`;
 if (rowData.hasOwnProperty('created_at')) {
 rowData.updated_at = nfecha('timestamp');
 }

 const envioDatos = await peticionesFetchOffline('updateData','imei',JSON.stringify(rowData));
 if (envioDatos[0] == 'ok') {
 toast.add({ severity: 'success', summary: 'Éxito', detail: 'Estado Cambiado', life: 3000 });
 } else {
 toast.add({ severity: 'error', summary: 'Error', detail: 'Error al Cambiar el Estado', life: 3000 });
 }
 }
 },
 { label: 'Cambiar Equipo', icon: 'pi pi-mobile', command: () => {
 abrirModalCambioEquipo([rowData])
 }
 },
 { label: 'Barcode', icon: 'pi pi-qrcode', command: async () => {
 codigoBarcode.value = currentRowData.value.imei
 textoBarcode.value = currentRowData.value.equipo
 precioBarcode.value = parseFloat(currentRowData.value.precio_venta || 0).toFixed(2)
 datosBarcode.value.barcodetype = 'CODE128'
 qr.value = false
 visibleBarcodeConfig.value = true
 }
 },
 { label: 'QR', icon: 'pi pi-qrcode', command: async () => { 
//https://demo.tmposrd.com/vista/imprimirdatosproductoid=36
 codigoBarcode.value = `https://demo.tmposrd.com/vista/imprimirdatosproductoid=${currentRowData.value.id_equi}`
 textoBarcode.value = currentRowData.value.equipo
 //precio_ventaProd.value = currentRowData.value.precio_venta
 datosBarcode.value.barcodetype = 'QR'
 qr.value = true
 await printBarcode()



 } 
 },
 { label: 'Vender', icon: 'pi pi-pencil', command: async() => {
 datosIMEI.value = currentRowData.value;
 if (currentRowData.value.estado === 'DISPONIBLE') {
 await fnagregarImei();
 }else{
 toast.add({ severity: 'error', summary: 'Error', detail: 'No esta Disponible', life: 3000 });
 }

 }
 },

    { label: 'Pasar de Almacen', icon: 'pi pi-arrow-right-arrow-left', command: async() => {
 if (currentRowData.value.estado === 'DISPONIBLE') {
 await fnPasarImeiDeAlmacen(currentRowData.value);
 }else{
 toast.add({ severity: 'error', summary: 'Error', detail: 'Solo se pueden transferir IMEIs disponibles', life: 3000 });
 }
 }
 },

 { label: 'Eliminar', icon: 'pi pi-trash', command: () => {
 Swal.fire({
          title: 'Introduce la contrasena',
 input: 'password',
          inputPlaceholder: 'Contrasena',
 showCancelButton: true,
 confirmButtonText: 'Eliminar',
 cancelButtonText: 'Cancelar'
 }).then(async (result) => {
 if (result.isConfirmed) {
 const contrasenaIngresada = result.value;
 if (contrasenaIngresada === token.value || contrasenaIngresada === tokenCorto.value) {
 const datosFactura = await peticionesFetchOffline('deleteEntry','imei', rowData.id);
 if (datosFactura[0] == 'ok') {
 await sincronizarStockPorImeis([rowData.id_equi]);
 toast.add({ severity: 'success', summary: 'Éxito', detail: 'Datos eliminados correctamente', life: 3000 });
 await fetchAndSetupData();
 } else {
 toast.add({ severity: 'error', summary: 'Error', detail: 'Error al eliminar los datos', life: 3000 });
 }
 } else {
              toast.add({ severity: 'error', summary: 'Error', detail: 'Contrasena incorrecta', life: 3000 });
 }
 }
 });
 } 
 },
 ];
 menu.value.toggle(event);
};

/************************************************************************/
// Variables para modales de transferencia de IMEI
/************************************************************************/
const visibleTransferenciaAlmacen = ref(false);
const visibleSeleccionProducto = ref(false);
const imeiTransferencia = ref(null);
const almacenDestinoSeleccionado = ref('');
const productosDestinoArray = ref([]);
const productoDestinoSeleccionado = ref(null);
const busquedaProductoDestino = ref('');
const productoOriginalTransferencia = ref(null);
const cambiarProductoEnTransferencia = ref(false);

const productosFiltradosDestino = computed(() => {
  if (!busquedaProductoDestino.value) return productosDestinoArray.value;
  const q = busquedaProductoDestino.value.toLowerCase();
  return productosDestinoArray.value.filter(p =>
    p.nombre.toLowerCase().includes(q) ||
    p.codigo.toLowerCase().includes(q) ||
    (p.marca && p.marca.toLowerCase().includes(q)) ||
    (p.modelo && p.modelo.toLowerCase().includes(q))
  );
});

/************************************************************************/
// Funciones auxiliares para modales de transferencia
/************************************************************************/
let resolveTransferenciaAlmacen = null;
let resolveSeleccionProducto = null;

const abrirModalTransferenciaAlmacen = async (imeiData, productoOriginal) => {
  return new Promise((resolve) => {
    imeiTransferencia.value = imeiData;
    productoOriginalTransferencia.value = productoOriginal;
    almacenDestinoSeleccionado.value = '';
    visibleTransferenciaAlmacen.value = true;
    resolveTransferenciaAlmacen = resolve;
  });
};

const confirmarTransferenciaAlmacen = () => {
  if (!almacenDestinoSeleccionado.value) {
    toast.add({ severity: 'warn', summary: 'Advertencia', detail: 'Debe seleccionar un almacen', life: 3000 });
    return;
  }
  visibleTransferenciaAlmacen.value = false;
  if (resolveTransferenciaAlmacen) {
    resolveTransferenciaAlmacen(almacenDestinoSeleccionado.value);
    resolveTransferenciaAlmacen = null;
  }
};

const cancelarTransferenciaAlmacen = () => {
  visibleTransferenciaAlmacen.value = false;
  if (resolveTransferenciaAlmacen) {
    resolveTransferenciaAlmacen(null);
    resolveTransferenciaAlmacen = null;
  }
};

const abrirModalSeleccionProducto = async (productosDestino, almacenDestino, esCambio = false) => {
  return new Promise((resolve) => {
    productosDestinoArray.value = productosDestino;
    productoDestinoSeleccionado.value = null;
    busquedaProductoDestino.value = '';
    cambiarProductoEnTransferencia.value = esCambio;
    visibleSeleccionProducto.value = true;
    resolveSeleccionProducto = resolve;
  });
};

const confirmarSeleccionProducto = () => {
  if (!productoDestinoSeleccionado.value) {
    toast.add({ severity: 'warn', summary: 'Advertencia', detail: 'Debe seleccionar un producto', life: 3000 });
    return;
  }
  visibleSeleccionProducto.value = false;
  if (resolveSeleccionProducto) {
    resolveSeleccionProducto(productoDestinoSeleccionado.value);
    resolveSeleccionProducto = null;
  }
};

const cancelarSeleccionProducto = () => {
  visibleSeleccionProducto.value = false;
  if (resolveSeleccionProducto) {
    resolveSeleccionProducto(null);
    resolveSeleccionProducto = null;
  }
};

/************************************************************************/
// Funcion para pasar IMEI de un almacen a otro
/************************************************************************/
const fnPasarImeiDeAlmacen = async (imeiData) => {
 const tokensValidos = [token.value, tokenCorto.value]

  // Validar contrasena
 const { value: password } = await Swal.fire({
    title: 'Autenticacion',
 input: 'password',
    inputLabel: 'Introduce la contrasena para transferir',
    inputPlaceholder: 'Contrasena',
 inputAttributes: {
 autocapitalize: 'off',
 autocorrect: 'off'
 },
 showCancelButton: true,
 confirmButtonText: 'Verificar',
 cancelButtonText: 'Cancelar'
 })

 if (!tokensValidos.includes(password)) {
    Swal.fire('Error', 'Contrasena incorrecta', 'error')
 return
 }

 // Cargar todos los productos
 let productosData
 let productoOriginal
 try {
 productosData = await peticionesFetchOffline('getDataAsArray', 'productos', '')
 productoOriginal = productosData.find(p => p.id === imeiData.id_equi)
 } catch (error) {
 console.error('Error al cargar productos:', error)
    Swal.fire('Error', 'Error al cargar informacion de productos', 'error')
 return
 }

  // Seleccionar almacen destino con modal
 const almacenesDisponiblesFiltrados = almacenesDisponibles.value.filter(alm => alm !== imeiData.almacen);

 if (almacenesDisponiblesFiltrados.length === 0) {
 Swal.fire('Sin almacenes', 'No hay otros almacenes disponibles para transferir', 'warning')
 return
 }

 const almacenDestino = await abrirModalTransferenciaAlmacen(imeiData, productoOriginal)

 if (!almacenDestino) return

 // Si no hay producto asociado o el usuario quiere cambiarlo, seleccionar producto del almacen destino
 let productoDestino

 if (!productoOriginal) {
 // No hay producto asociado - DEBE seleccionar uno del almacen destino con modal DataTable
 const productosDestino = productosData.filter(p => p.almacen === almacenDestino)

 if (productosDestino.length === 0) {
      Swal.fire('Sin productos', 'No hay productos disponibles en el almacen destino', 'warning')
 return
 }

 productoDestino = await abrirModalSeleccionProducto(productosDestino, almacenDestino, false)

 if (!productoDestino) return
 } else {
 // Preguntar si desea cambiar de producto o usar el mismo
 const { value: cambiarProducto } = await Swal.fire({
      title: 'Cambiar de producto',
 html: `
 <p class="text-sm text-gray-600 mb-3">Producto actual: <strong>${productoOriginal.nombre}</strong></p>
        <p class="text-sm text-gray-600">Desea asignar este IMEI a un producto diferente en el almacen destino</p>
 `,
 icon: 'question',
 showCancelButton: true,
 showDenyButton: true,
 confirmButtonText: 'Mantener mismo producto',
 denyButtonText: 'Cambiar producto',
 cancelButtonText: 'Cancelar'
 })

    if (cambiarProducto === undefined) return // Usuario cancelo

 if (cambiarProducto === false) {
 // Usuario eligio cambiar de producto - mostrar modal DataTable
 const productosDestino = productosData.filter(p => p.almacen === almacenDestino)

 if (productosDestino.length === 0) {
        Swal.fire('Sin productos', 'No hay productos disponibles en el almacen destino', 'warning')
 return
 }

 productoDestino = await abrirModalSeleccionProducto(productosDestino, almacenDestino, true)

 if (!productoDestino) return
 }
 // Si cambiarProducto === true, productoDestino quedara undefined y se buscara/creara el producto mas abajo
 }

 loading.value = true

 try {
 // Si no se selecciono un producto destino manualmente, buscar o crear uno
 if (!productoDestino && productoOriginal) {
 // Buscar si ya existe el producto en el almacen destino
 productoDestino = productosData.find(p =>
 p.codigo === productoOriginal.codigo &&
 p.almacen === almacenDestino
 )

 // Si no existe el producto en el almacen destino, crearlo
 if (!productoDestino) {
 const timestampSufijo = Date.now().toString().slice(-6)
 const nuevoCodigo = `${productoOriginal.codigo}-T${timestampSufijo}`
 const nuevoCodigoBarra = `${productoOriginal.codigo_barra || productoOriginal.codigo}-T${timestampSufijo}`

 const productoDuplicado = {
 ...productoOriginal,
 codigo: nuevoCodigo,
 codigo_barra: nuevoCodigoBarra,
          stock: 0, // Se actualizara despues de asignar el IMEI
 almacen: almacenDestino,
 created_at: nfecha('timestamp'),
 updated_at: nfecha('timestamp')
 }

 delete productoDuplicado.id
 delete productoDuplicado.otro

 const resultadoInsercion = await peticionesFetchOffline('insertData', 'productos', JSON.stringify(productoDuplicado))

 if (resultadoInsercion[0] === 'ok') {
 // Obtener el producto recien creado
 const productosActualizados = await peticionesFetchOffline('getDataAsArray', 'productos', '')
 productoDestino = productosActualizados.find(p => p.codigo === nuevoCodigo)
 } else {
          throw new Error('Error al crear producto en almacen destino')
 }
 }
 }

 if (!productoDestino) {
 throw new Error('No se pudo obtener el producto destino')
 }

 // Actualizar el IMEI con el nuevo producto y almacen
 imeiData.id_equi = productoDestino.id
 imeiData.almacen = almacenDestino
 imeiData.updated_at = nfecha('timestamp')

 const resultadoUpdateImei = await peticionesFetchOffline('updateData', 'imei', JSON.stringify(imeiData))

 if (resultadoUpdateImei[0] === 'ok') {
 // Actualizar stock del producto original (reducir) - solo si existe
 if (productoOriginal) {
 const imeisOriginales = await peticionesFetchOffline('getDataArrayByTwoConditions', 'imei', 'id_equi', productoOriginal.id, 'estado', 'DISPONIBLE')
 productoOriginal.stock = imeisOriginales.length
 productoOriginal.updated_at = nfecha('timestamp')
 delete productoOriginal.otro
 await peticionesFetchOffline('updateData', 'productos', JSON.stringify(productoOriginal))
 }

 // Actualizar stock del producto destino (aumentar)
 const imeisDestino = await peticionesFetchOffline('getDataArrayByTwoConditions', 'imei', 'id_equi', productoDestino.id, 'estado', 'DISPONIBLE')
 productoDestino.stock = imeisDestino.length
 productoDestino.updated_at = nfecha('timestamp')
 delete productoDestino.otro
 await peticionesFetchOffline('updateData', 'productos', JSON.stringify(productoDestino))

 await fetchAndSetupData()

 const origenHTML = productoOriginal
   ? `
<div class="bg-gray-50 p-3 rounded mb-2">
<p class="font-semibold text-sm mb-1">Origen:</p>
            <p class="text-sm">${productoOriginal.nombre}</p>
            <p class="text-sm">${productoOriginal.almacen}</p>
            <p class="text-sm">Stock restante: ${productoOriginal.stock} unidades</p>
</div>
`
   : `
<div class="bg-yellow-50 p-3 rounded mb-2">
<p class="font-semibold text-sm mb-1">Origen:</p>
            <p class="text-sm">IMEI sin producto asociado previamente</p>
            <p class="text-sm">${imeiData.almacen || 'Sin almacen previo'}</p>
</div>
`

 Swal.fire({
 icon: 'success',
        title: 'Transferencia Exitosa!',
 html: `
 <div class="text-left">
 <p class="mb-2"><strong>IMEI transferido:</strong></p>
 <p class="font-mono bg-blue-50 px-3 py-2 rounded mb-3">${imeiData.imei}</p>

 ${origenHTML}

 <div class="bg-green-50 p-3 rounded">
 <p class="font-semibold text-sm mb-1">Destino:</p>
              <p class="text-sm">${productoDestino.nombre}</p>
              <p class="text-sm">${almacenDestino}</p>
              <p class="text-sm">Stock actual: ${productoDestino.stock} unidades</p>
 </div>
 </div>
 `,
 confirmButtonText: 'Aceptar',
 width: '600px'
 })

 toast.add({
 severity: 'success',
 summary: 'IMEI Transferido',
 detail: `IMEI ${imeiData.imei} transferido a ${almacenDestino}`,
 life: 4000
 })
 }

 } catch (error) {
 console.error('Error en transferencia:', error)
    Swal.fire('Error', `Ocurrio un error durante la transferencia: ${error.message}`, 'error')
 } finally {
 loading.value = false
 }
}

/************************************************************************/
const filteredImei = computed(() => {
 let datosFiltrados = [...data.value]; // Clonar los datos originales para evitar mutaciones directas

 // Filtrar por estado si esta definido
 if (estadoFiltro.value) {
 datosFiltrados = datosFiltrados.filter(item => item.estado === estadoFiltro.value);
 }

 // Filtrar por busqueda de texto si hay un termino ingresado
 if (searchQuery.value) {
 const query = searchQuery.value.toLowerCase();
 datosFiltrados = datosFiltrados.filter(item => 
 Object.values(item).some(value => 
 String(value).toLowerCase().includes(query)
 )
 );
 }

 // Filtrar por rango de fechas si `buscadorFechaInteligente` tiene valores
 if (buscadorFechaInteligente.value) {



/*
 let fechaInicio = formatearFecha(buscadorFechaInteligente.value.fechainicio);
 let fechaFin = formatearFecha(buscadorFechaInteligente.value.fechafin);*/
 console.log("buscadorFechaInteligente.value", buscadorFechaInteligente.value);

 let fechaInicio, fechaFin;

 if (typeof buscadorFechaInteligente.value === 'string') {
 const fechas = buscadorFechaInteligente.value.split(' - ');
 fechaInicio = fechas[0] ? formatearFecha(fechas[0]) : null;
 fechaFin = fechas[1] ? formatearFecha(fechas[1]) : null;
 } else {
 fechaInicio = formatearFecha(buscadorFechaInteligente.value.fechainicio);
 fechaFin = formatearFecha(buscadorFechaInteligente.value.fechafin);
 }




 if (fechaInicio && fechaFin) {
 const fechaInicioTimeStamp = new Date(transformarFechaTimestamp(fechaInicio, false) + ' 00:00:01');
 const fechaFinTimeStamp = new Date(transformarFechaTimestamp(fechaFin, false) + ' 23:59:59');

 datosFiltrados = datosFiltrados.filter(item => {
 const fechaUpdated = new Date(item.updated_at);
 return fechaUpdated >= fechaInicioTimeStamp && fechaUpdated <= fechaFinTimeStamp;
 });

 fechaInteligente.value = datosFiltrados.length > 0;
 }

 }

 return datosFiltrados;
});

/************************************************************************/
/*************************************************************/
const fnDisponibles = async()=>{
 const ids = obtenerIdsSeleccionados(selectedImei.value);
 if (ids.length > 0) {
 for (const id of ids) {
 try {

 const rowData = data.value.find(equipo =>equipo.id == id)

 if (rowData.estado === 'DISPONIBLE') {
 rowData.estado = 'VENDIDO';
 await actualizarStockProducto(rowData.id_equi,'restar')
 } else if (rowData.estado === 'VENDIDO') {
 rowData.estado = 'DISPONIBLE';
 await actualizarStockProducto(rowData.id_equi,'sumar')
 }


 const url = link.value+api.value+"/actualizarcampos/imei";
 if (rowData.hasOwnProperty('created_at')) {
 rowData.updated_at = nfecha('timestamp')
 }

 const envioDatos = await peticionesFetchOffline('updateData','imei',JSON.stringify(rowData));
 if (envioDatos[0] == 'ok') {
 toast.add({ severity: 'success', summary: 'Éxito', detail: 'Estado Cambiado', life: 3000 });
 }else{
 toast.add({ severity: 'success', summary: 'Éxito', detail: 'Error al Cambiar el Estado', life: 3000 });
 }



 } catch (error) {
 console.error(`Error al eliminar datos para ID: ${id}`, error);
 exitoTotal = false;
 }
 }

 } else {
 toast.add({ severity: 'error', summary: 'Error', detail: 'No hay datos para Actualizar', life: 3000 });
 }

}

/************************************************************************/
const getRowClass = (data) => {
 if (data.estado === 'DISPONIBLE') {
 return 'disponible';
 } else if (data.estado === 'VENDIDO') {
 return 'vendido';
 } else if (data.estado === 'En Taller') {
 return 'en-taller';
 }
 return '';
};
/************************************************************************/
const colorEstado = (data) => {
 switch (data.estado) {
 case 'DISPONIBLE':
 return 'success';
 case 'VENDIDO':
 return 'warn'; // Amarillo
 case 'DEVOLUCION':
 return 'contrast';
 case 'En Taller':
 return 'info'; // Azul para En Taller
 default:
 return 'secondary'; // Gris por defecto
 }
};
/************************************************************************/
const metaKey = ref(true);
/************************************************************************/
const equipoSuggestions = ref([])

const searchEquipo = (event) => {
 const q = (event.query || '').toLowerCase()
 equipoSuggestions.value = listaBuscador.value.filter(nombre =>
 nombre.toLowerCase().includes(q)
 )
}

const onEquipoSelect = (event) => {
 const valor = event.value;
 const nombre = typeof valor === 'string' ? valor : valor.nombre || '';
 const producto = (typeof valor === 'object' && valor.id)
   ? productosArray.value.find(prod => prod.id === valor.id)
   : productosArray.value.find(prod => prod.nombre === nombre);

 if (producto) {
 datoscamposImei.value.equipo = producto.nombre
 datoscampos.value.equipo = producto.nombre
 datoscamposImei.value.proveedor = producto.proveedor
 datoscampos.value.proveedor = producto.proveedor
 datoscamposImei.value.id_equi = producto.id
 datoscampos.value.id_equi = producto.id
 datoscamposImei.value.precio_compra = producto.precio_compra || 0
 datoscamposImei.value.precio_venta = producto.precio_venta || 0
 datoscamposImei.value.precio_min = producto.precio_min || 0
 datoscamposImei.value.precio_xmayor = producto.precio_xmayor || 0
 datoscamposImei.value.capacidad = datoscamposImei.value.capacidad || '128GB'
 }
}

const searchEquipoCrear = (event) => {
 const query = (event.query || '').toLowerCase().trim();
 const lista = query
   ? productosArray.value.filter(prod =>
 String(prod.nombre || '').toLowerCase().includes(query) ||
 String(prod.codigo || '').toLowerCase().includes(query) ||
 String(prod.marca || '').toLowerCase().includes(query)
 )
   : productosArray.value.slice(0, 20);
 equipoSuggestionsCrear.value = lista.slice(0, 30);
}

const fnAwesomplete = ()=>{}
const handleSelectComplete = async(selected)=>{}
/************************************************************************/
const onRowSelect = (event) => {
 visible.value = true;
 saberSiesJSON.value = isValidJSON(event.data.detalles)
 datoscampos.value = event.data;
};
/************************************************************************/
const fnAgregarOtroImeiMismoEquipo = async () => {
 const base = datoscampos.value || {};
 await limpiarCamposCrear();

 datoscamposImei.value.equipo = base.equipo || '';
 datoscamposImei.value.id_equi = base.id_equi || '';
 datoscamposImei.value.proveedor = base.proveedor || '';
 datoscamposImei.value.precio_compra = Number(base.precio_compra || 0);
 datoscamposImei.value.precio_venta = Number(base.precio_venta || 0);
 datoscamposImei.value.precio_min = Number(base.precio_min || 0);
 datoscamposImei.value.precio_xmayor = Number(base.precio_xmayor || 0);
 datoscamposImei.value.capacidad = base.capacidad || '128GB';
 datoscamposImei.value.bateria = 100;
 datoscamposImei.value.imei = '';
 datoscamposImei.value.estado = 'DISPONIBLE';
 datoscamposImei.value.fecha = nfecha('fecha');

 visible.value = false;
 visiblecrear.value = true;
};
/************************************************************************/
const fnVerFactura = async()=>{
 if (datoscampos.value.factura!='') {
 const response = await peticionesFetchOffline('getDataByField', 'facturas','no_factura',datoscampos.value.factura);

 router.push({ path: `/editarfacturas/${response.id}` });
 }else{
 toast.add({ severity: 'error', summary: 'Error', detail: 'No hay Factura Asignada', life: 3000 }); 
 }
}
/************************************************************************/
const fnVerCompra = async()=>{
 if (datoscampos.value.no_compra!='') {

 const response = await peticionesFetchOffline('getDataByField', 'compras','no_factura',datoscampos.value.no_compra);
 if (response) {
 router.push({ path: `/editarcompras/${response.id}` });
 }else{
 toast.add({ severity: 'error', summary: 'Error', detail: 'No hay Existe la Compra', life: 3000 }); 
 }
 }else{
 toast.add({ severity: 'error', summary: 'Error', detail: 'No hay Factura de Compra Asignada', life: 3000 }); 
 }
}
/************************************************************************/
const actualizarN = async()=>{

 const url = link.value+api.value+"/actualizarcampos/imei";
 if (!datoscampos.value) {
 console.error("Datos incompletos, no se puede actualizar.");
 return;
 }
 if (datoscampos.value.hasOwnProperty('created_at')) {
 datoscampos.value.updated_at = nfecha('timestamp');
 }

 const envioDatos = await peticionesFetchOffline('updateData','imei',JSON.stringify(datoscampos.value));
 if (envioDatos[0] == 'ok') {
 toast.add({ severity: 'success', summary: 'Éxito', detail: 'Datos Actualizados', life: 3000 });
 } else {
 toast.add({ severity: 'error', summary: 'Error', detail: 'Fallo al actualizar los datos.', life: 3000 });
 }

}
/************************************************************************/
const fnSicronizarProductos = async () => {
 const facturasArray = await peticionesFetchOffline('getDataAsArray','facturas');
 const productosArrayN = await peticionesFetchOffline('getDataByCondition','productos','categoria','CELULARES');

 for (let telefono of data.value) {
 datoscampos.value = {};
 
 // Buscar el producto por id_equi
 let productoDatos = productosArrayN.find(prod => prod.id === telefono.id_equi);
 
 if (!productoDatos) {
 // Si no se encuentra por id_equi, buscar por nombre
 productoDatos = productosArrayN.find(prod => prod.nombre === telefono.equipo);
 }

 if (productoDatos) {
 // Actualizar el campo `costo` con el `precio_compra` del producto encontrado
 telefono.costo = productoDatos.precio_compra;
 datoscampos.value = telefono;

 // Llamada a la funcion de actualizacion
 await actualizarN();
 } else {
 console.warn(`Producto no encontrado para el equipo: ${telefono.equipo}`);
 }
 }
};

/************************************************************************/
// Funcion para actualizar precios desde productos
const fnActualizarPrecios = async () => {
 // Pedir contrasena
 const { value: password } = await Swal.fire({
    title: 'Introduce la contrasena',
 input: 'password',
    inputPlaceholder: 'Contrasena',
 showCancelButton: true,
 confirmButtonText: 'Confirmar',
 cancelButtonText: 'Cancelar'
 });

 if (!password) {
 return;
 }

 // Validar contrasena
 if (password!== token.value && password!== tokenCorto.value) {
    toast.add({ severity: 'error', summary: 'Error', detail: 'Contrasena incorrecta', life: 3000 });
 return;
 }

 // Mostrar mensaje de carga
 toast.add({ severity: 'info', summary: 'Procesando', detail: 'Actualizando precios...', life: 3000 });

 try {
 // Obtener todos los productos de celulares
 const productosArrayN = await peticionesFetchOffline('getDataByCondition', 'productos', 'categoria', 'CELULARES');

 let actualizados = 0;
 let noEncontrados = 0;

 // Iterar sobre todos los IMEIs
 for (let imei of data.value) {
 // Buscar el producto por id_equi
 let productoDatos = productosArrayN.find(prod => prod.id === imei.id_equi);

 if (!productoDatos) {
 // Si no se encuentra por id_equi, buscar por nombre
 productoDatos = productosArrayN.find(prod => prod.nombre === imei.equipo);
 }

 if (productoDatos) {
 // Actualizar los precios del IMEI con los del producto
 imei.precio_compra = productoDatos.precio_compra;
 imei.precio_venta = productoDatos.precio_venta;
 imei.precio_min = productoDatos.precio_min;
 imei.precio_xmayor = productoDatos.precio_xmayor;

 if (imei.hasOwnProperty('updated_at')) {
 imei.updated_at = nfecha('timestamp');
 }

 // Actualizar en la base de datos
 const result = await peticionesFetchOffline('updateData', 'imei', JSON.stringify(imei));
 if (result[0] === 'ok') {
 actualizados++;
 }
 } else {
 noEncontrados++;
 console.warn(`Producto no encontrado para el equipo: ${imei.equipo} (ID: ${imei.id_equi})`);
 }
 }

 // Recargar datos
 await fetchAndSetupData();

 // Mostrar resultado
 toast.add({
 severity: 'success',
      summary: 'Actualizacion completa',
 detail: `${actualizados} IMEIs actualizados. ${noEncontrados > 0 ? noEncontrados + ' sin producto asociado.' : ''}`,
 life: 5000
 });

 } catch (error) {
 console.error('Error al actualizar precios:', error);
 toast.add({ severity: 'error', summary: 'Error', detail: 'Error al actualizar precios', life: 3000 });
 }
};

/************************************************************************/
// Función para abrir el modal de cambio masivo de precios
const abrirCambioMasivoPrecios = () => {
  cambioMasivo.value = {
    tipoSeleccion: 'equipo',
    equipoSeleccionado: equiposDisponibles.value[0] || null,
    estadoSeleccionado: 'DISPONIBLE',
    imeisSeleccionados: [],
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

    // Obtener IMEIs a actualizar
    let imeisActualizar = []

    if (cambioMasivo.value.tipoSeleccion === 'equipo') {
      if (!cambioMasivo.value.equipoSeleccionado) {
        toast.add({ severity: 'warn', summary: 'Validación', detail: 'Debe seleccionar un equipo', life: 2500 })
        return
      }
      imeisActualizar = data.value.filter(i => i.equipo === cambioMasivo.value.equipoSeleccionado)
    } else if (cambioMasivo.value.tipoSeleccion === 'estado') {
      if (!cambioMasivo.value.estadoSeleccionado) {
        toast.add({ severity: 'warn', summary: 'Validación', detail: 'Debe seleccionar un estado', life: 2500 })
        return
      }
      imeisActualizar = data.value.filter(i => i.estado === cambioMasivo.value.estadoSeleccionado)
    } else {
      // Selección individual
      if (cambioMasivo.value.imeisSeleccionados.length === 0) {
        toast.add({ severity: 'warn', summary: 'Validación', detail: 'Debe seleccionar al menos un IMEI', life: 2500 })
        return
      }
      imeisActualizar = cambioMasivo.value.imeisSeleccionados
    }

    if (imeisActualizar.length === 0) {
      toast.add({ severity: 'warn', summary: 'Validación', detail: 'No hay IMEIs para actualizar', life: 2500 })
      return
    }

    // Confirmar acción
    const resultado = await Swal.fire({
      title: '¿Confirmar cambio de precios?',
      html: `Se actualizarán <b>${imeisActualizar.length}</b> IMEIs.<br>
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

    // Aplicar cambios a cada IMEI
    for (const imei of imeisActualizar) {
      try {
        const imeiActualizado = { ...imei }

        // Aplicar cambios a cada tipo de precio seleccionado
        cambioMasivo.value.aplicarA.forEach(tipoPrecio => {
          const precioActual = Number(imei[tipoPrecio] || 0)
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
          imeiActualizado[tipoPrecio] = Math.max(0, precioNuevo).toFixed(2)
        })

        // Actualizar timestamp si existe
        if (imeiActualizado.hasOwnProperty('updated_at')) {
          imeiActualizado.updated_at = nfecha('timestamp')
        }

        // Guardar en base de datos
        const envioDatos = await peticionesFetchOffline('updateData', 'imei', JSON.stringify(imeiActualizado))

        if (envioDatos[0] === 'ok') {
          actualizados++
          // Actualizar en el array local
          const index = data.value.findIndex(p => p.id === imei.id)
          if (index !== -1) {
            data.value[index] = imeiActualizado
          }
        } else {
          errores++
        }
      } catch (error) {
        console.error('Error actualizando IMEI:', error)
        errores++
      }
    }

    loading.value = false

    // Mostrar resultado
    if (actualizados > 0) {
      let detalleMensaje = `${actualizados} IMEIs actualizados correctamente`
      if (errores > 0) {
        detalleMensaje += `. ${errores} IMEIs con errores.`
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
        detail: 'No se pudo actualizar ningún IMEI',
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
// Funcion para exportar datos visibles a Excel
const fnExcel = () => {
 // Convierte los datos de la tabla (filteredImei) a un array de objetos
 const datos = filteredImei.value.map(item => ({
 IMEI: item.imei,
 Estado: item.estado,
 Fecha: item.fecha,
 Equipo: item.equipo,
 Proveedor: item.proveedor,
 "ID Equipo": item.id_equi,
 "No Compra": item.no_compra,
 Costo: item.costo,
 "Precio Compra": item.precio_compra,
 "Fecha Venta": item.fecha_venta,
 "Hora Venta": item.hora_venta,
 Comprador: item.comprador,
 Factura: item.factura,
 Detalles: item.detalles,
 Usuario: item.usuario,
 }));

 // Crea una hoja de trabajo (workbook) y agrega la hoja de datos
 const ws = XLSX.utils.json_to_sheet(datos);
 const wb = XLSX.utils.book_new();
 XLSX.utils.book_append_sheet(wb, ws, 'DatosIMEI');

 // Guarda el archivo
 XLSX.writeFile(wb, 'DatosIMEI.xlsx');
};
/************************************************************************/
const fnPdfImeiDisponiblesAgrupado = async () => {
 try {
 const disponibles = data.value
 .filter(item => item.estado === 'DISPONIBLE')
 .sort((a, b) => {
 const equipoA = String(a.equipo || '').toLowerCase();
 const equipoB = String(b.equipo || '').toLowerCase();
 if (equipoA !== equipoB) return equipoA.localeCompare(equipoB, 'es');
 return String(a.imei || '').localeCompare(String(b.imei || ''), 'es');
 });

 if (!disponibles.length) {
 toast.add({ severity: 'warn', summary: 'Sin datos', detail: 'No hay IMEI disponibles para generar el PDF.', life: 3000 });
 return;
 }

 const grupos = disponibles.reduce((acc, item) => {
 const equipo = String(item.equipo || 'SIN EQUIPO');
 if (!acc[equipo]) acc[equipo] = [];
 acc[equipo].push(item);
 return acc;
 }, {});

 const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
 const fechaGeneracion = new Date().toLocaleString('es-DO');
 const totalEquipos = Object.keys(grupos).length;

 doc.setFontSize(16);
 doc.setTextColor(17, 24, 39);
 doc.text('Listado de IMEI Disponibles', 14, 14);
 doc.setFontSize(10);
 doc.setTextColor(75, 85, 99);
 doc.text(`Generado: ${fechaGeneracion}`, 14, 20);
 doc.text(`Total IMEI: ${disponibles.length} | Equipos agrupados: ${totalEquipos}`, 14, 25);

 const body = [];
 Object.keys(grupos).sort((a, b) => a.localeCompare(b, 'es')).forEach((equipo) => {
 const items = grupos[equipo] || [];
 body.push([
 { content: `${equipo} (${items.length})`, colSpan: 7, styles: { fillColor: [30, 64, 175], textColor: 255, fontStyle: 'bold' } }
 ]);
 items.forEach((item, index) => {
 const costo = Number(item.costo ?? item.precio_compra ?? 0);
 const precioVenta = Number(item.precio_venta ?? item.precio ?? 0);
 body.push([
 String(index + 1),
 String(item.imei || ''),
 String(item.capacidad || ''),
 costo.toLocaleString('es-DO', { style: 'currency', currency: 'DOP' }),
 precioVenta.toLocaleString('es-DO', { style: 'currency', currency: 'DOP' }),
 String(item.proveedor || ''),
 String(item.fecha || '')
 ]);
 });
 });

 autoTable(doc, {
 startY: 30,
 head: [['#', 'IMEI', 'Capacidad', 'Costo', 'Precio de venta', 'Proveedor', 'Fecha']],
 body,
 theme: 'grid',
 styles: { fontSize: 8, cellPadding: 2, textColor: [17, 24, 39] },
 headStyles: { fillColor: [17, 24, 39], textColor: 255, fontStyle: 'bold' },
 alternateRowStyles: { fillColor: [248, 250, 252] },
 margin: { top: 30, right: 10, bottom: 14, left: 10 }
 });

 const pdfBlob = doc.output('blob');
 const pdfUrl = URL.createObjectURL(pdfBlob);

 const result = await Swal.fire({
 title: 'PDF IMEI DISPONIBLE',
 width: '95vw',
 html: `<iframe src="${pdfUrl}" style="width:100%;height:75vh;border:1px solid #e5e7eb;border-radius:8px;"></iframe>`,
 showCancelButton: true,
 showDenyButton: true,
 confirmButtonText: 'Cerrar',
 cancelButtonText: 'Descargar',
 denyButtonText: 'Abrir en nueva pestaña',
 focusConfirm: false
 });

 if (result.dismiss === Swal.DismissReason.cancel) {
 const a = document.createElement('a');
 a.href = pdfUrl;
 a.download = `imei_disponibles_${new Date().toISOString().slice(0, 10)}.pdf`;
 document.body.appendChild(a);
 a.click();
 document.body.removeChild(a);
 }

 if (result.isDenied) {
 window.open(pdfUrl, '_blank');
 setTimeout(() => URL.revokeObjectURL(pdfUrl), 1500);
 } else {
 URL.revokeObjectURL(pdfUrl);
 }
 } catch (error) {
 console.error('Error al generar PDF de IMEI disponibles:', error);
 toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo generar el PDF de IMEI disponibles.', life: 3000 });
 }
};
/************************************************************************/
const fnVerProducto = ()=>{
 router.push({ path: `/editarproductos/${datoscampos.value.id_equi}` });
}
/************************************************************************/
const retornaJSON = (string)=>{
 return JSON.parse(string)
}
/************************************************************************/
const handleInteligenteSelect = (event) => {
 const selectedItem = event.item;
 buscadorFechaInteligente.value = selectedItem.value.fechainicio+' - '+selectedItem.value.fechafin
 console.log("Selected item:", selectedItem.value);
 // Aqui puedes agregar cualquier logica adicional que necesites
};
/************************************************************************/
const itemsInteligente = ref([ 
 { label: 'Hoy', command: handleInteligenteSelect,value:nfecha('rangohoy') },
 { label: 'Ayer', command: handleInteligenteSelect,value:nfecha('rangoayer') },
 { label: 'Esta Semana', command: handleInteligenteSelect,value:nfecha('rangosemana')},
 { label: 'Hace 7 dias', command: handleInteligenteSelect,value:nfecha('rango7dias')},
 { label: 'Este mes', command: handleInteligenteSelect,value:nfecha('rangomes')},
])

const toggleInteligente = (event)=>{
 menuInteligente.value.toggle(event);

}
/************************************************************************/
const fechaInteligenteSeleccionada = (fechas)=>{
 if(fechas){
 const fechainicio = formatearFecha(fechas[0])
 const fechafin = formatearFecha(fechas[1])
 if(fechainicio === null || fechafin === null || fechainicio ==='31/12/1969' || fechafin ==='31/12/1969'){
 toast.add({ severity: 'warn', summary: 'Error', detail: 'Seleccione ambas fechas', life: 3000 });
 return
 }

 const retorno = {fechainicio,fechafin}
 return retorno

 }

}
/************************************************************************/
// Estadisticas de IMEI
const estadisticasImei = computed(() => {
 const disponibles = data.value.filter(item => item.estado === 'DISPONIBLE').length;
 const vendidos = data.value.filter(item => item.estado === 'VENDIDO').length;
 const total = data.value.length;

 const valorInventario = data.value
 .filter(item => item.estado === 'DISPONIBLE')
 .reduce((sum, item) => sum + (parseFloat(item.precio_compra) || 0), 0);

 const gananciaProyectada = data.value
 .filter(item => item.estado === 'DISPONIBLE')
 .reduce((sum, item) => {
 const precioVenta = parseFloat(item.precio_venta) || 0;
 const precioCompra = parseFloat(item.precio_compra) || 0;
 return sum + (precioVenta - precioCompra);
 }, 0);

 const ventasTotales = data.value
 .filter(item => item.estado === 'VENDIDO')
 .reduce((sum, item) => sum + (parseFloat(item.precio_venta) || 0), 0);

 return {
 disponibles,
 vendidos,
 total,
 valorInventario,
 gananciaProyectada,
 ventasTotales
 };
});

const formatCurrencyImei = (value) => {
 if (value) {
 return value.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
 }
 return '$0.00';
};
/************************************************************************/
const fnCambiarProveedor = async () => {
 if (!selectedImei.value || selectedImei.value.length === 0) {
 toast.add({ severity: 'warn', summary: 'Advertencia', detail: 'Seleccione al menos un IMEI', life: 3000 });
 return;
 }

 const sugerencias = (Array.isArray(proveedoresLista.value) ? proveedoresLista.value : [])
 .map((p) => p?.nombre)
 .filter(Boolean)
 .slice(0, 8)

 const proveedorActual = selectedImei.value.length === 1
 ? String(selectedImei.value[0]?.proveedor || '')
 : ''

 const { value: nuevoProveedor } = await Swal.fire({
 title: 'Cambiar Proveedor',
 html: `
      <p style="margin-bottom:10px;">Se actualizara el proveedor de ${selectedImei.value.length} IMEI(s) seleccionado(s).</p>
      ${sugerencias.length ? `<p style="font-size:12px;color:#64748b;margin:0;">Sugeridos: ${sugerencias.join(', ')}</p>` : ''}
    `,
 input: 'text',
 inputValue: proveedorActual,
 inputPlaceholder: 'Escriba el proveedor',
 showCancelButton: true,
 confirmButtonText: 'Cambiar',
 cancelButtonText: 'Cancelar',
 inputValidator: (value) => {
 if (!String(value || '').trim()) return 'Debe escribir un proveedor';
 }
 });

 if (!nuevoProveedor) return;
 const proveedorNormalizado = String(nuevoProveedor).trim()

 const ids = obtenerIdsSeleccionados(selectedImei.value);
 let exito = 0;

 for (const id of ids) {
 const rowData = data.value.find(item => item.id == id);
 if (rowData) {
 rowData.proveedor = proveedorNormalizado;
 if (rowData.hasOwnProperty('updated_at')) {
 rowData.updated_at = nfecha('timestamp');
 }
 const result = await peticionesFetchOffline('updateData', 'imei', JSON.stringify(rowData));
 if (result[0] === 'ok') exito++;
 }
 }

 toast.add({ severity: exito ? 'success' : 'warn', summary: exito ? 'Éxito' : 'Advertencia', detail: `Proveedor actualizado en ${exito} IMEI(s)`, life: 3000 });
 selectedImei.value = [];
 await fetchAndSetupData();
};
/************************************************************************/
const fnCambiarAlmacen = async () => {
 if (!selectedImei.value || selectedImei.value.length === 0) {
 toast.add({ severity: 'warn', summary: 'Advertencia', detail: 'Seleccione al menos un IMEI', life: 3000 });
 return;
 }

 const empresasDB = await peticionesFetchOffline('getDataAsArray', 'empresa');
 const opciones = empresasDB.reduce((acc, e) => {
 acc[e.nombre] = e.nombre;
 return acc;
 }, {});

 const { value: nuevoAlmacen } = await Swal.fire({
    title: 'Cambiar Almacen',
    text: `Se actualizara el almacen de ${selectedImei.value.length} IMEI(s) seleccionado(s)`,
 input: 'select',
 inputOptions: opciones,
    inputPlaceholder: 'Seleccione un almacen',
 showCancelButton: true,
 confirmButtonText: 'Cambiar',
 cancelButtonText: 'Cancelar',
 inputValidator: (value) => {
      if (!value) return 'Debe seleccionar un almacen';
 }
 });

 if (!nuevoAlmacen) return;

 const ids = obtenerIdsSeleccionados(selectedImei.value);
 let exito = 0;

 for (const id of ids) {
 const rowData = data.value.find(item => item.id == id);
 if (rowData) {
 rowData.almacen = nuevoAlmacen;
 if (rowData.hasOwnProperty('updated_at')) {
 rowData.updated_at = nfecha('timestamp');
 }
 const result = await peticionesFetchOffline('updateData', 'imei', JSON.stringify(rowData));
 if (result[0] === 'ok') exito++;
 }
 }

  toast.add({ severity: 'success', summary: 'Exito', detail: `Almacen actualizado en ${exito} IMEI(s)`, life: 3000 });
 selectedImei.value = [];
 await fetchAndSetupData();
};
/************************************************************************/
const abrirModalCambioEquipo = (imeiList = []) => {
 if (!Array.isArray(imeiList) || imeiList.length === 0) {
 toast.add({ severity: 'warn', summary: 'Advertencia', detail: 'Seleccione al menos un IMEI', life: 3000 });
 return;
 }

 imeisCambioEquipo.value = imeiList;
 equipoBuscador.value = '';
 equipoSeleccionado.value = null;
 visibleCambiarEquipo.value = true;
}

const fnCambiarEquipo = () => {
 abrirModalCambioEquipo([...(selectedImei.value || [])]);
};

const cerrarModalCambioEquipo = () => {
 visibleCambiarEquipo.value = false
 imeisCambioEquipo.value = []
 equipoSeleccionado.value = null
 equipoBuscador.value = ''
 cambioEquipoPrecios.value = {
  precio_compra: 0,
  precio_venta: 0,
  precio_min: 0,
  precio_xmayor: 0
 }
}

const fnConfirmarCambioEquipo = async () => {
 if (!equipoSeleccionado.value) {
 toast.add({ severity: 'warn', summary: 'Advertencia', detail: 'Seleccione un equipo', life: 3000 });
 return;
 }

 const imeisObjetivo = [...(imeisCambioEquipo.value || [])]
 if (!imeisObjetivo.length) {
 toast.add({ severity: 'warn', summary: 'Advertencia', detail: 'No hay IMEI para actualizar', life: 3000 });
 return;
 }

 const productoDestino = productosArray.value.find(prod => prod.id == equipoSeleccionado.value.id) || equipoSeleccionado.value
 const idsEquiAfectados = new Set([productoDestino.id])
 let exito = 0;

 for (const item of imeisObjetivo) {
 const rowData = data.value.find(imei => imei.id == item.id)
 if (!rowData) continue

 if (rowData.id_equi) {
 idsEquiAfectados.add(rowData.id_equi)
 }

 rowData.equipo = productoDestino.nombre
 rowData.id_equi = productoDestino.id
 rowData.proveedor = productoDestino.proveedor || rowData.proveedor || ''
 rowData.precio_compra = Number(cambioEquipoPrecios.value.precio_compra || 0)
 rowData.precio_venta = Number(cambioEquipoPrecios.value.precio_venta || 0)
 rowData.precio_min = Number(cambioEquipoPrecios.value.precio_min || 0)
 rowData.precio_xmayor = Number(cambioEquipoPrecios.value.precio_xmayor || 0)

 if (rowData.hasOwnProperty('updated_at')) {
 rowData.updated_at = nfecha('timestamp');
 }

 const result = await peticionesFetchOffline('updateData', 'imei', JSON.stringify(rowData));
 if (result[0] === 'ok') exito++;
 }

 await sincronizarStockPorImeis([...idsEquiAfectados])
 toast.add({ severity: 'success', summary: 'Éxito', detail: `Equipo actualizado en ${exito} IMEI(s)`, life: 3000 });
 cerrarModalCambioEquipo();
 selectedImei.value = [];
 await fetchAndSetupData();
};
/************************************************************************/

</script>
<template>
<main class="content-wrapper imei-wrapper">
 <div class="w-full px-4 mt-5">
 <LoadingOverlay :loading="loading" />

 <!-- Header Profesional -->
 <div class="imei-header mb-5">
 <div class="imei-header-content">
 <div class="imei-icon-wrapper">
 <i class="pi pi-mobile imei-icon"></i>
 </div>
 <div>
 <h1 class="imei-title">Control de IMEI</h1>
          <p class="imei-subtitle">Gestion de inventario de dispositivos moviles</p>
 </div>
 </div>
 </div>

 <!-- Tarjetas de Estadisticas -->
 <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-5 items-stretch">
 <div class="h-full">
 <Card class="summary-card disponibles-card h-full">
 <template #content>
 <div class="flex items-center justify-between">
 <div>
 <p class="summary-label">DISPONIBLES</p>
 <p class="summary-value">{{ estadisticasImei.disponibles }}</p>
 <p class="summary-count">en inventario</p>
 </div>
 <div class="summary-icon-wrapper disponibles">
 <i class="pi pi-check-circle text-3xl"></i>
 </div>
 </div>
 </template>
 </Card>
 </div>

 <div class="h-full">
 <Card class="summary-card vendidos-card h-full">
 <template #content>
 <div class="flex items-center justify-between">
 <div>
 <p class="summary-label">VENDIDOS</p>
 <p class="summary-value">{{ estadisticasImei.vendidos }}</p>
 <p class="summary-count">dispositivos</p>
 </div>
 <div class="summary-icon-wrapper vendidos">
 <i class="pi pi-shopping-cart text-3xl"></i>
 </div>
 </div>
 </template>
 </Card>
 </div>

 <div class="h-full">
 <Card class="summary-card inventario-card h-full">
 <template #content>
 <div class="flex items-center justify-between">
 <div>
 <p class="summary-label">VALOR INVENTARIO</p>
 <p class="summary-value-currency">{{ formatCurrencyImei(estadisticasImei.valorInventario) }}</p>
 <p class="summary-count">en stock</p>
 </div>
 <div class="summary-icon-wrapper inventario">
 <i class="pi pi-dollar text-3xl"></i>
 </div>
 </div>
 </template>
 </Card>
 </div>

 <div class="h-full">
 <Card class="summary-card vendidos-card h-full">
 <template #content>
 <div class="flex items-center justify-between">
 <div>
 <p class="summary-label">GANANCIA PROYECTADA</p>
 <p class="summary-value-currency">{{ formatCurrencyImei(estadisticasImei.gananciaProyectada) }}</p>
 <p class="summary-count">precio venta estimado</p>
 </div>
 <div class="summary-icon-wrapper vendidos">
 <i class="pi pi-chart-line text-3xl"></i>
 </div>
 </div>
 </template>
 </Card>
 </div>

 <div class="h-full">
 <Card class="summary-card total-card h-full">
 <template #content>
 <div class="flex items-center justify-between">
 <div>
 <p class="summary-label">TOTAL REGISTROS</p>
 <p class="summary-value">{{ estadisticasImei.total }}</p>
 <p class="summary-count">dispositivos</p>
 </div>
 <div class="summary-icon-wrapper total">
 <i class="pi pi-database text-3xl"></i>
 </div>
 </div>
 </template>
 </Card>
 </div>
 </div>

 <!-- Tabla de IMEI -->
 <Card class="imei-table-card shadow-lg">
 <template #content>
 <!-- Toolbar -->
 <div class="imei-toolbar">
 <div class="flex flex-wrap gap-2">
 <Button icon="pi pi-refresh" severity="secondary" text rounded @click="fetchAndSetupData" v-tooltip="'Recargar datos'" />
 <Button label="Nuevo IMEI" icon="pi pi-plus" severity="success" @click="visiblecrear = true" />
 <Button icon="pi pi-trash" severity="danger" outlined @click="borrarSeleccionados" :disabled="!selectedImei ||!selectedImei.length" v-tooltip="'Borrar seleccionados'" />
 <Button icon="pi pi-file-excel" severity="success" outlined @click="fnExcel" v-tooltip="'Exportar Excel'" />
 <Button label="PDF Disponibles" icon="pi pi-file-pdf" severity="danger" outlined @click="fnPdfImeiDisponiblesAgrupado" v-tooltip="'PDF IMEI disponibles agrupados por equipo'" />
 <Button icon="pi pi-sync" severity="info" outlined @click="fnSicronizarProductos" v-tooltip="'Sincronizar productos'" />
 <Button label="Estado" icon="pi pi-check" severity="success" outlined @click="fnDisponibles" />
 <Button label="Proveedor" icon="pi pi-building" severity="warning" outlined @click="fnCambiarProveedor" :disabled="!selectedImei ||!selectedImei.length" v-tooltip="'Cambiar proveedor a seleccionados'" />
            <Button label="Almacen" icon="pi pi-warehouse" severity="info" outlined @click="fnCambiarAlmacen" :disabled="!selectedImei || !selectedImei.length" v-tooltip="'Cambiar almacen a seleccionados'" />
 <Button label="Equipo" icon="pi pi-mobile" severity="secondary" outlined @click="fnCambiarEquipo" :disabled="!selectedImei ||!selectedImei.length" v-tooltip="'Cambiar equipo a seleccionados'" />
 <Button label="Actualizar Precios" icon="pi pi-dollar" severity="warning" outlined @click="fnActualizarPrecios" v-tooltip="'Actualizar precios desde productos'" />
 <Button label="Cambio Masivo Precios" icon="pi pi-money-bill" severity="info" outlined @click="abrirCambioMasivoPrecios" v-tooltip="'Cambiar precios masivamente por equipo, estado o seleccion'" />
 <Button v-if="usuarioLocal.usuario =='Soporte'" label="Borrar Todo" icon="pi pi-trash" severity="danger" text @click="borrarTodo" />
 </div>
 </div>

 <Divider />

 <!-- Filtros y busqueda -->
 <div class="imei-filters">
 <div class="flex flex-wrap gap-3 items-end">
 <div class="flex-1 min-w-[200px]">
              <label class="block text-sm font-medium text-gray-700 mb-2">Almacen</label>
 <Select
 v-model="almacenFiltro"
 :options="[{ label: 'Todos los almacenes', value: '' }, ...almacenesDisponibles.map(a => ({ label: a, value: a }))]"
 optionLabel="label"
 optionValue="value"
                placeholder="Filtrar por almacen"
 fluid
 />
 </div>

 <div class="flex-1 min-w-[200px]">
 <label class="block text-sm font-medium text-gray-700 mb-2">Estado</label>
 <Select v-model="estadoFiltro" :options="[
 { label: 'Todos los estados', value: '' },
 { label: 'Disponible', value: 'DISPONIBLE' },
 { label: 'Vendido', value: 'VENDIDO' },
 { label: 'En Taller', value: 'En Taller' }
 ]" optionLabel="label" optionValue="value" placeholder="Filtrar por estado" fluid />
 </div>

 <div class="flex-1 min-w-[250px]">
 <label class="block text-sm font-medium text-gray-700 mb-2">Buscador Inteligente</label>
 <InputGroup>
 <DatePicker dateFormat="dd/mm/yy" selectionMode="range" :showButtonBar="true" @value-change="fechaInteligenteSeleccionada" v-model="buscadorFechaInteligente" fluid />
 <InputGroupAddon>
 <Button icon="pi pi-search" severity="secondary" @click="toggleInteligente" />
 </InputGroupAddon>
 </InputGroup>
 <Menu ref="menuInteligente" :model="itemsInteligente" popup class="!min-w-fit" />
 </div>

 <div class="flex-1 min-w-[200px]">
 <label class="block text-sm font-medium text-gray-700 mb-2">Buscar</label>
 <InputText v-model="searchQuery" placeholder="Buscar IMEI, equipo, proveedor..." fluid />
 </div>
 </div>
 </div>

 <Divider />

 <!-- DataTable -->
 <DataTable
 :value="filteredImei"
 scrollable
 scrollHeight="500px"
 dataKey="id"
 v-model:selection="selectedImei"
 paginator
 :rows="10"
 size="small"
 resizableColumns
 columnResizeMode="fit"
 :rowClass="getRowClass"
 selectionMode="multiple"
 :rowsPerPageOptions="[10, 20, 50]"
 tableStyle="min-width: 50rem"
 stripedRows
 class="imei-datatable">

 <Column selectionMode="multiple" headerStyle="width: 3rem"></Column>

 <Column header="Acciones" style="width: 5rem; text-align: center">
 <template #body="slotProps">
 <Button icon="pi pi-ellipsis-v" text rounded severity="secondary" @click="toggleImei($event, slotProps.data)" aria-haspopup="true" aria-controls="overlay_menu_Imei" />
 <Menu ref="menu" id="overlay_menu_Imei" :model="itemsImei" :popup="true" />
 </template>
 </Column>

 <Column field="estado" header="Estado" sortable style="width: 10%">
 <template #body="slotProps">
 <Badge :value="slotProps.data.estado" :severity="colorEstado(slotProps.data)" class="font-semibold" />
 </template>
 </Column>

 <Column field="imei" header="IMEI" sortable>
 <template #body="slotProps">
 <span
 class="font-mono font-medium text-blue-700 underline cursor-pointer hover:text-blue-900"
 @click="onRowSelect({ data: slotProps.data })"
 >{{ slotProps.data.imei }}</span>
 </template>
 </Column>

 <Column field="equipo" header="Equipo" sortable>
 <template #body="slotProps">
 <div
 class="flex items-center gap-2 cursor-pointer hover:text-blue-700"
 @click="onRowSelect({ data: slotProps.data })"
 >
 <i class="pi pi-mobile text-blue-600"></i>
 <span class="font-medium">{{ slotProps.data.equipo }}</span>
 </div>
 </template>
 </Column>

 <Column field="capacidad" header="Capacidad" sortable style="width: 10%">
 <template #body="slotProps">
 <Badge :value="slotProps.data.capacidad" severity="warn" class="font-semibold" />
 </template>
 </Column>
 <Column field="almacen" header="Almacen" sortable style="width: 10%"></Column>
 
 <Column field="fecha" header="Fecha Ingreso" sortable style="width: 10%"></Column>
 <Column field="proveedor" header="Proveedor" sortable></Column>
 <Column field="no_compra" header="No. Compra" sortable style="width: 10%"></Column>

 <Column field="costo" header="Costo" sortable style="width: 10%; text-align: right">
 <template #body="slotProps">
 <span class="font-mono font-bold text-blue-700">{{ formatCurrencyImei(slotProps.data.precio_compra) }}</span>
 </template>
 </Column>

 <Column field="precio_venta" header="Precio Venta" sortable style="width: 10%; text-align: right">
 <template #body="slotProps">
 <span class="font-mono font-bold text-green-700">{{ formatCurrencyImei(slotProps.data.precio_venta) }}</span>
 </template>
 </Column>

 <Column field="fecha_venta" header="Fecha Venta" sortable style="width: 10%"></Column>
 <Column field="comprador" header="Comprador" sortable></Column>
 <Column field="usuario" header="Usuario" sortable style="width: 10%"></Column>
 </DataTable>
 </template>
 </Card>
<!-- ////////////////////////////////////////////////////////////////////////////////////////// -->
<!-- Modal Editar IMEI -->
<Dialog v-model:visible="visible" modal :style="{ width: '65rem' }" class="imei-dialog">
 <template #header>
 <div class="imei-edit-header">
 <div class="imei-edit-header-icon">
 <i class="pi pi-mobile"></i>
 </div>
 <div class="imei-edit-header-info">
 <h3 class="imei-edit-title">{{ datoscampos.equipo || 'Editar IMEI' }}</h3>
 <div class="flex items-center gap-2 mt-1">
 <code class="imei-edit-code">{{ datoscampos.imei }}</code>
 <Tag :value="datoscampos.estado" :severity="datoscampos.estado === 'DISPONIBLE' ? 'success' : 'warning'" />
 </div>
 </div>
 </div>
 </template>

 <div class="imei-edit-body">
 <form id="formularioActualizarImei">
 <div class="col-span-12" hidden>
 <InputText v-model="datoscampos.id" />
 <InputText v-model="datoscampos.updated_at" readonly />
 <InputText v-model="datoscampos.created_at" readonly />
 <InputText v-model="datoscampos.usuario" />
 </div>

 <!-- SECCION 1: Dispositivo -->
 <div class="imei-edit-section">
 <div class="imei-edit-section-title">
 <i class="pi pi-mobile"></i>
 <span>Dispositivo</span>
 </div>
 <div class="imei-edit-grid">

 <div class="imei-edit-field col-span-5">
 <label><i class="pi pi-mobile"></i> IMEI</label>
 <InputText v-model="datoscampos.imei" v-solonumeros placeholder="Ingrese IMEI" fluid />
 </div>

 <div class="imei-edit-field col-span-4">
 <label><i class="pi pi-check-circle"></i> Estado</label>
 <Select v-model="datoscampos.estado" :options="['DISPONIBLE','VENDIDO','DEVOLUCION','En Taller']" fluid />
 </div>

 <div class="imei-edit-field col-span-3">
 <label><i class="pi pi-calendar"></i> Fecha Ingreso</label>
 <InputText v-model="datoscampos.fecha" v-datepicker placeholder="DD/MM/AAAA" fluid />
 </div>

 <div class="imei-edit-field col-span-4">
 <label><i class="pi pi-tag"></i> Equipo</label>
 <AutoComplete
 v-model="datoscampos.equipo"
 :suggestions="equipoSuggestions"
 @complete="searchEquipo"
 @item-select="onEquipoSelect"
 placeholder="Buscar equipo..."
 fluid
 forceSelection
 />
 </div>

 <div class="imei-edit-field col-span-1">
 <label><i class="pi pi-building"></i> ID_EQUI</label>
 <InputText v-model="datoscampos.id_equi" placeholder="Proveedor" fluid  />
 </div>

 <div class="imei-edit-field col-span-4">
 <label><i class="pi pi-building"></i> Proveedor</label>
 <InputText v-model="datoscampos.proveedor" placeholder="Proveedor" fluid  />
 </div>

 <div class="imei-edit-field col-span-3">
 <label><i class="pi pi-database"></i> Capacidad</label>
 <Select v-model="datoscampos.capacidad" :options="opcionesCapacidad" fluid />
 </div>

 <!-- BATERIA -->
 <div class="imei-edit-field col-span-12">
            <label><i class="pi pi-bolt"></i> Bateria</label>
 <div class="imei-battery-wrapper">
 <InputNumber
 v-model="datoscampos.bateria"
 :min="0"
 :max="100"
 suffix="%"
 showButtons
 buttonLayout="horizontal"
 :step="5"
 decrementButtonClass="p-button-secondary"
 incrementButtonClass="p-button-secondary"
 class="imei-battery-input"
 />
 <div class="imei-battery-bar-container">
 <div
 class="imei-battery-bar"
 :style="{ width: (datoscampos.bateria || 100) + '%' }"
 :class="{
 'battery-green': (datoscampos.bateria || 100) > 60,
 'battery-yellow': (datoscampos.bateria || 100) > 30 && (datoscampos.bateria || 100) <= 60,
 'battery-red': (datoscampos.bateria || 100) <= 30
 }"
 ></div>
 <span class="imei-battery-label">{{ datoscampos.bateria || 100 }}%</span>
 </div>
 </div>
 </div>

 <div class="imei-edit-field col-span-4">
 <label><i class="pi pi-hashtag"></i> No. Compra</label>
 <InputText v-model="datoscampos.no_compra" fluid readonly />
 </div>

 <div class="imei-edit-field col-span-4">
 <label><i class="pi pi-calendar"></i> Fecha Venta</label>
 <InputText v-model="datoscampos.fecha_venta" v-datepicker placeholder="DD/MM/AAAA" fluid />
 </div>

 <div class="imei-edit-field col-span-4">
 <label><i class="pi pi-clock"></i> Hora Venta</label>
 <InputText v-model="datoscampos.hora_venta" placeholder="HH:MM" fluid />
 </div>
 </div>
 </div>

 <!-- SECCION 2: Precios -->
 <div class="imei-edit-section">
 <div class="imei-edit-section-title green">
 <i class="pi pi-dollar"></i>
 <span>Precios</span>
 </div>
 <div class="imei-edit-grid">
 <div class="imei-edit-field col-span-3">
 <label>Costo</label>
 <InputText v-model="datoscampos.precio_compra" placeholder="0.00" fluid />
 </div>
 <div class="imei-edit-field col-span-3">
 <label>P. Venta</label>
 <InputText v-model="datoscampos.precio_venta" placeholder="0.00" fluid />
 </div>
 <div class="imei-edit-field col-span-3">
            <label>P. Minimo</label>
 <InputText v-model="datoscampos.precio_min" placeholder="0.00" fluid />
 </div>
 <div class="imei-edit-field col-span-3">
 <label>P. X Mayor</label>
 <InputText v-model="datoscampos.precio_xmayor" placeholder="0.00" fluid />
 </div>
 </div>
 </div>

 <!-- SECCION 3: Venta -->
 <div class="imei-edit-section">
 <div class="imei-edit-section-title purple">
 <i class="pi pi-shopping-cart"></i>
          <span>Informacion de Venta</span>
 </div>
 <div class="imei-edit-grid">
 <div class="imei-edit-field col-span-6">
 <label><i class="pi pi-user"></i> Comprador</label>
 <InputText v-model="datoscampos.comprador" v-mayuscula placeholder="Nombre del comprador" fluid />
 </div>
 <div class="imei-edit-field col-span-6">
 <label><i class="pi pi-file"></i> No. Factura</label>
 <InputText v-model="datoscampos.no_factura" placeholder="No. Factura" fluid readonly />
 </div>
 </div>
 </div>

 <!-- SECCION 4: Detalles -->
 <div class="imei-edit-section">
 <div class="imei-edit-section-title orange">
 <i class="pi pi-list"></i>
 <span>Detalles del Dispositivo</span>
 </div>
 <div v-if="saberSiesJSON" class="flex flex-wrap gap-2 p-2">
 <Tag
 v-for="(item, index) in parsedDetails"
 :key="index"
 :value="`${item.key}`"
 :severity="item.value ? 'success' : 'danger'"
 />
 </div>
 <Textarea v-else v-model="datoscampos.detalles" rows="4" placeholder="Detalles adicionales..." fluid />
 </div>

 </form>
 </div>

 <template #footer>
 <div class="imei-edit-footer">
 <div class="flex gap-2">
 <Button label="Ver Producto" icon="pi pi-box" text severity="secondary" @click="fnVerProducto" />
 <Button label="Ver Compra" icon="pi pi-shopping-bag" text severity="secondary" @click="fnVerCompra" />
 <Button label="Ver Factura" icon="pi pi-file" text severity="secondary" @click="fnVerFactura" />
 <Button label="Agregar otro IMEI" icon="pi pi-plus" text severity="success" @click="fnAgregarOtroImeiMismoEquipo" />
 </div>
 <div class="flex gap-2">
 <Button label="Cancelar" icon="pi pi-times" outlined severity="secondary" @click="visible = false" />
 <Button label="Guardar Cambios" icon="pi pi-check" severity="success" @click="funcionActualizar" />
 </div>
 </div>
 </template>
</Dialog>
<!-- ////////////////////////////////////////////////////////////////////////////////////////// -->
<!-- Modal Crear IMEI -->
<Dialog v-model:visible="visiblecrear" modal :style="{ width: '60rem' }" class="imei-dialog">
 <template #header>
 <div class="flex items-center gap-3">
 <div class="flex items-center justify-center w-12 h-12 bg-green-100 rounded-lg">
 <i class="pi pi-plus-circle text-green-600 text-2xl"></i>
 </div>
 <div>
 <h3 class="text-xl font-bold text-gray-800 m-0">Nuevo IMEI</h3>
 <p class="text-sm text-gray-500 m-0">Registrar dispositivo en el inventario</p>
 </div>
 </div>
 </template>

 <div class="p-4">
 <form id="formularioCrearImei">
 <div class="grid grid-cols-12 gap-4">
 <!-- Informacion Basica -->
 <div class="col-span-12">
 <h4 class="text-sm font-bold text-blue-700 mb-3 flex items-center gap-2">
 <i class="pi pi-info-circle"></i>
            Informacion Basica
 </h4>
 </div>

 <div class="col-span-12 md:col-span-4">
 <label class="block text-sm font-semibold text-gray-700 mb-2">
 <i class="pi pi-mobile mr-1 text-blue-600"></i>
 IMEI
 </label>
 <InputMask v-model="datoscamposImei.imei" mask="999999999999999" placeholder="123456789012345" fluid />
 </div>

 <div class="col-span-12 md:col-span-3">
 <label class="block text-sm font-semibold text-gray-700 mb-2">
 <i class="pi pi-check-circle mr-1 text-blue-600"></i>
 Estado
 </label>
 <Select v-model="datoscamposImei.estado" :options="['DISPONIBLE','VENDIDO','En Taller']" placeholder="Seleccione estado" fluid />
 </div>

 <div class="col-span-12 md:col-span-2">
 <label class="block text-sm font-semibold text-gray-700 mb-2">
 <i class="pi pi-hashtag mr-1 text-blue-600"></i>
 No. Compra
 </label>
 <InputText v-model="datoscamposImei.no_compra" placeholder="No. Compra" fluid />
 </div>

 <div class="col-span-12 md:col-span-3">
 <label class="block text-sm font-semibold text-gray-700 mb-2">
 <i class="pi pi-calendar mr-1 text-blue-600"></i>
 Fecha
 </label>
 <InputText v-model="datoscamposImei.fecha" v-datepicker placeholder="DD/MM/AAAA" fluid />
 </div>

 <div class="col-span-12 md:col-span-5">
 <label class="block text-sm font-semibold text-gray-700 mb-2">
 <i class="pi pi-mobile mr-1 text-blue-600"></i>
 Equipo
 </label>
 <AutoComplete
 v-model="datoscamposImei.equipo"
 :suggestions="equipoSuggestionsCrear"
 optionLabel="nombre"
 @complete="searchEquipoCrear"
 @item-select="onEquipoSelect"
 placeholder="Buscar por nombre, codigo o marca..."
 fluid
 dropdown
 forceSelection
 >
 <template #option="slotProps">
 <div class="flex flex-col">
 <span class="font-semibold">{{ slotProps.option.nombre }}</span>
 <small class="text-gray-500">
 {{ slotProps.option.marca || 'Sin marca' }} | {{ slotProps.option.codigo || 'Sin codigo' }}
 </small>
 </div>
 </template>
 </AutoComplete>
 </div>

 <div class="col-span-12 md:col-span-4">
 <label class="block text-sm font-semibold text-gray-700 mb-2">ID Equipo</label>
 <InputText v-model="datoscamposImei.id_equi" placeholder="ID" fluid readonly />
 </div>

 <div class="col-span-12 md:col-span-3">
 <label class="block text-sm font-semibold text-gray-700 mb-2">
 <i class="pi pi-building mr-1 text-blue-600"></i>
 Proveedor
 </label>
 <Select
 v-model="datoscamposImei.proveedor"
 :options="proveedoresLista"
 optionLabel="nombre"
 optionValue="nombre"
 placeholder="Seleccionar proveedor"
 filter
 fluid
 />
 </div>

 <div class="col-span-12 mt-3">
 <h4 class="text-sm font-bold text-green-700 mb-3 flex items-center gap-2">
 <i class="pi pi-dollar"></i>
 Precios y Condicion
 </h4>
 </div>

 <div class="col-span-12 md:col-span-3">
 <label class="block text-sm font-semibold text-gray-700 mb-2">Precio Compra</label>
 <InputNumber v-model="datoscamposImei.precio_compra" :min="0" mode="currency" currency="DOP" locale="es-DO" fluid />
 </div>

 <div class="col-span-12 md:col-span-3">
 <label class="block text-sm font-semibold text-gray-700 mb-2">Precio Venta</label>
 <InputNumber v-model="datoscamposImei.precio_venta" :min="0" mode="currency" currency="DOP" locale="es-DO" fluid />
 </div>

 <div class="col-span-12 md:col-span-3">
 <label class="block text-sm font-semibold text-gray-700 mb-2">Precio Min</label>
 <InputNumber v-model="datoscamposImei.precio_min" :min="0" mode="currency" currency="DOP" locale="es-DO" fluid />
 </div>

 <div class="col-span-12 md:col-span-3">
 <label class="block text-sm font-semibold text-gray-700 mb-2">Precio x Mayor</label>
 <InputNumber v-model="datoscamposImei.precio_xmayor" :min="0" mode="currency" currency="DOP" locale="es-DO" fluid />
 </div>

 <div class="col-span-12 md:col-span-6">
 <label class="block text-sm font-semibold text-gray-700 mb-2">Bateria %</label>
 <InputNumber
 v-model="datoscamposImei.bateria"
 :min="0"
 :max="100"
 suffix="%"
 :step="5"
 showButtons
 fluid
 />
 </div>

 <div class="col-span-12 md:col-span-6">
 <label class="block text-sm font-semibold text-gray-700 mb-2">Capacidad</label>
 <Select
 v-model="datoscamposImei.capacidad"
 :options="opcionesCapacidad"
 fluid
 />
 </div>

 <div class="col-span-6" hidden>
 <InputText v-model="datoscamposImei.updated_at" />
 </div>
 <div class="col-span-6" hidden>
 <InputText v-model="datoscamposImei.created_at" />
 </div>
 <div class="col-span-12" hidden>
 <InputText v-model="datoscamposImei.usuario" />
 </div>
 </div>
 </form>
 </div>

 <template #footer>
 <div class="flex gap-2 justify-end">
 <Button label="Cancelar" icon="pi pi-times" outlined severity="secondary" @click="visiblecrear = false" />
 <Button label="Crear IMEI" icon="pi pi-check" severity="success" @click="funcionCrear" />
 </div>
 </template>
</Dialog>
<!-- ////////////////////////////////////////////////////////////////////////////////////////// -->
<!-- Modal Configuracion Barcode -->
<Dialog v-model:visible="visibleBarcodeConfig" modal :style="{ width: '600px' }" class="barcode-config-dialog">
 <template #header>
 <div class="flex items-center gap-3">
 <div class="flex items-center justify-center w-12 h-12 bg-purple-100 rounded-lg">
 <i class="pi pi-qrcode text-purple-600 text-2xl"></i>
 </div>
 <div>
        <h3 class="text-xl font-bold text-gray-800 m-0">Configurar Codigo de Barras</h3>
 <p class="text-sm text-gray-500 m-0">Personaliza las opciones antes de imprimir</p>
 </div>
 </div>
 </template>

 <div class="p-4">
 <div class="grid grid-cols-12 gap-4">
 <!-- Informacion Basica -->
 <div class="col-span-12">
        <h4 class="text-sm font-bold text-purple-700 mb-2">Informacion del Codigo</h4>
 </div>

 <div class="col-span-12 md:col-span-6">
 <label class="block text-sm font-semibold text-gray-700 mb-2">
 <i class="pi pi-tag mr-1 text-purple-600"></i>
          Codigo/IMEI
 </label>
        <InputText v-model="codigoBarcode" placeholder="Codigo" fluid />
 </div>

 <div class="col-span-12 md:col-span-6">
 <label class="block text-sm font-semibold text-gray-700 mb-2">
 <i class="pi pi-hashtag mr-1 text-purple-600"></i>
 Cantidad
 </label>
 <InputNumber v-model="cantidadBarcode" placeholder="Cantidad" :min="1" fluid />
 </div>

 <div class="col-span-12">
 <label class="block text-sm font-semibold text-gray-700 mb-2">
 <i class="pi pi-align-left mr-1 text-purple-600"></i>
 Texto a Mostrar
 </label>
 <InputText v-model="textoBarcode" placeholder="Texto a mostrar" fluid />
 </div>

 <!-- Dimensiones de Etiqueta -->
 <div class="col-span-12 mt-3">
 <h4 class="text-sm font-bold text-purple-700 mb-2">Dimensiones de Etiqueta (mm)</h4>
 </div>

 <div class="col-span-6 md:col-span-3">
 <label class="block text-sm font-semibold text-gray-700 mb-2">Ancho</label>
 <InputNumber v-model="datosBarcode.labelwidth" placeholder="80" fluid />
 </div>

 <div class="col-span-6 md:col-span-3">
 <label class="block text-sm font-semibold text-gray-700 mb-2">Alto</label>
 <InputNumber v-model="datosBarcode.labelheight" placeholder="40" fluid />
 </div>

 <div class="col-span-6 md:col-span-3">
 <label class="block text-sm font-semibold text-gray-700 mb-2">Ancho Barra</label>
 <InputNumber v-model="datosBarcode.barwidth" placeholder="2" fluid />
 </div>

 <div class="col-span-6 md:col-span-3">
 <label class="block text-sm font-semibold text-gray-700 mb-2">Alto Barra</label>
 <InputNumber v-model="datosBarcode.barheight" placeholder="50" fluid />
 </div>

 <!-- Margenes -->
 <div class="col-span-12 mt-3">
        <h4 class="text-sm font-bold text-purple-700 mb-2">Margenes (mm)</h4>
 </div>

 <div class="col-span-6 md:col-span-3">
 <label class="block text-sm font-semibold text-gray-700 mb-2">Superior</label>
 <InputNumber v-model="datosBarcode.margen_sup" placeholder="0" fluid />
 </div>

 <div class="col-span-6 md:col-span-3">
 <label class="block text-sm font-semibold text-gray-700 mb-2">Inferior</label>
 <InputNumber v-model="datosBarcode.margen_inf" placeholder="0" fluid />
 </div>

 <div class="col-span-6 md:col-span-3">
 <label class="block text-sm font-semibold text-gray-700 mb-2">Izquierdo</label>
 <InputNumber v-model="datosBarcode.margen_izq" placeholder="0" fluid />
 </div>

 <div class="col-span-6 md:col-span-3">
 <label class="block text-sm font-semibold text-gray-700 mb-2">Derecho</label>
 <InputNumber v-model="datosBarcode.margen_der" placeholder="0" fluid />
 </div>

 <!-- Otras Opciones -->
 <div class="col-span-12 mt-3">
 <h4 class="text-sm font-bold text-purple-700 mb-2">Opciones</h4>
 </div>

 <div class="col-span-12 md:col-span-6">
        <label class="block text-sm font-semibold text-gray-700 mb-2">Tamano Fuente</label>
 <InputNumber v-model="datosBarcode.fontsize" placeholder="12" fluid />
 </div>

 <div class="col-span-12 md:col-span-6">
 <label class="block text-sm font-semibold text-gray-700 mb-2">
 <i class="pi pi-dollar mr-1 text-purple-600"></i>
 Precio
 </label>
 <InputNumber v-model="precioBarcode" mode="currency" currency="USD" locale="en-US" fluid />
 </div>

 <div class="col-span-12">
 <div class="flex flex-col gap-2">
 <div class="flex items-center gap-3 p-2 bg-purple-50 rounded-lg">
 <Checkbox v-model="incluirCabecera" :binary="true" inputId="incluirCabecera" />
 <label for="incluirCabecera" class="text-sm font-semibold text-gray-700 cursor-pointer">
 Incluir Cabecera (Nombre Empresa)
 </label>
 </div>

 <div class="flex items-center gap-3 p-2 bg-purple-50 rounded-lg">
 <Checkbox v-model="incluirTexto" :binary="true" inputId="incluirTexto" />
 <label for="incluirTexto" class="text-sm font-semibold text-gray-700 cursor-pointer">
 Incluir Texto
 </label>
 </div>

 <div class="flex items-center gap-3 p-2 bg-purple-50 rounded-lg">
 <Checkbox v-model="incluirCodigo" :binary="true" inputId="incluirCodigo" />
 <label for="incluirCodigo" class="text-sm font-semibold text-gray-700 cursor-pointer">
              Incluir Codigo de Barras
 </label>
 </div>

 <div class="flex items-center gap-3 p-2 bg-purple-50 rounded-lg">
 <Checkbox v-model="incluirPrecio" :binary="true" inputId="incluirPrecio" />
 <label for="incluirPrecio" class="text-sm font-semibold text-gray-700 cursor-pointer">
 Incluir Precio
 </label>
 </div>
 </div>
 </div>
 </div>
 </div>

 <template #footer>
 <div class="flex gap-2 justify-end">
 <Button label="Cancelar" icon="pi pi-times" outlined severity="secondary" @click="visibleBarcodeConfig = false" />
 <Button label="Imprimir" icon="pi pi-print" severity="success" @click="printBarcode(); visibleBarcodeConfig = false" />
 </div>
 </template>
</Dialog>
<!-- ////////////////////////////////////////////////////////////////////////////////////////// -->
<!-- Modal Cambiar Equipo -->
<Dialog v-model:visible="visibleCambiarEquipo" modal header="Cambiar Equipo" :style="{ width: '52rem' }" @hide="cerrarModalCambioEquipo">
 <template #header>
 <div class="flex items-center gap-3">
 <div class="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg">
 <i class="pi pi-mobile text-blue-600 text-2xl"></i>
 </div>
 <div>
 <h3 class="text-xl font-bold text-gray-800 m-0">Cambiar Equipo</h3>
 <p class="text-sm text-gray-500 m-0">{{ imeisCambioEquipo.length }} IMEI(s) seleccionado(s)</p>
 </div>
 </div>
 </template>

 <div class="p-4 flex flex-col gap-3">
 <InputText
 v-model="equipoBuscador"
      placeholder="Buscar por nombre, codigo o marca..."
 fluid
 autofocus
 >
 <template #prefix><i class="pi pi-search" /></template>
 </InputText>

 <div v-if="equipoSeleccionado" class="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
 <i class="pi pi-check-circle text-blue-600"></i>
 <span class="font-semibold text-blue-800">{{ equipoSeleccionado.nombre }}</span>
 <Tag :value="`ID: ${equipoSeleccionado.id}`" severity="info" class="ml-auto" />
 </div>

 <div v-if="equipoSeleccionado" class="grid grid-cols-1 md:grid-cols-2 gap-3 p-4 border border-slate-200 rounded-xl bg-slate-50">
 <div>
 <label class="block text-sm font-medium text-slate-700 mb-2">Precio compra</label>
 <InputNumber v-model="cambioEquipoPrecios.precio_compra" mode="decimal" :min="0" :minFractionDigits="2" :maxFractionDigits="2" fluid />
 </div>
 <div>
 <label class="block text-sm font-medium text-slate-700 mb-2">Precio venta</label>
 <InputNumber v-model="cambioEquipoPrecios.precio_venta" mode="decimal" :min="0" :minFractionDigits="2" :maxFractionDigits="2" fluid />
 </div>
 <div>
 <label class="block text-sm font-medium text-slate-700 mb-2">Precio min</label>
 <InputNumber v-model="cambioEquipoPrecios.precio_min" mode="decimal" :min="0" :minFractionDigits="2" :maxFractionDigits="2" fluid />
 </div>
 <div>
 <label class="block text-sm font-medium text-slate-700 mb-2">Precio x mayor</label>
 <InputNumber v-model="cambioEquipoPrecios.precio_xmayor" mode="decimal" :min="0" :minFractionDigits="2" :maxFractionDigits="2" fluid />
 </div>
 </div>

 <DataTable
 :value="productosFiltradosEquipo"
 selectionMode="single"
 v-model:selection="equipoSeleccionado"
 dataKey="id"
 scrollable
 scrollHeight="350px"
 stripedRows
 size="small"
 :rowClass="(row) => row.id === equipoSeleccionado?.id ? 'bg-blue-50' : ''"
 >
 <Column field="nombre" header="Nombre" sortable>
 <template #body="slotProps">
 <div class="flex items-center gap-2">
 <i class="pi pi-mobile text-blue-500"></i>
 <span class="font-medium">{{ slotProps.data.nombre }}</span>
 </div>
 </template>
 </Column>
      <Column field="codigo" header="Codigo" sortable style="width: 130px" />
 <Column field="marca" header="Marca" sortable style="width: 120px" />
 <Column field="stock" header="Stock" sortable style="width: 80px; text-align:center">
 <template #body="slotProps">
 <Tag :value="slotProps.data.stock" severity="success" />
 </template>
 </Column>
 </DataTable>
 </div>

 <template #footer>
 <div class="flex gap-2 justify-end">
 <Button label="Cancelar" icon="pi pi-times" outlined severity="secondary" @click="cerrarModalCambioEquipo" />
 <Button label="Aplicar" icon="pi pi-check" severity="success" :disabled="!equipoSeleccionado" @click="fnConfirmarCambioEquipo" />
 </div>
 </template>
</Dialog>
<!-- ////////////////////////////////////////////////////////////////////////////////////////// -->
<!-- Modal Cambio Masivo de Precios -->
<Dialog v-model:visible="visibleCambioMasivoPrecios" modal :position="position" header="Cambio Masivo de Precios IMEI" :style="{ width: '40rem' }">
  <template #header>
    <div class="inline-flex align-items-center justify-content-center gap-2">
      <i class="pi pi-money-bill"></i>
      <span class="font-bold white-space-nowrap">Cambio Masivo de Precios IMEI</span>
    </div>
  </template>

  <div class="grid grid-cols-12 gap-4">
    <!-- Tipo de Selección -->
    <fieldset class="border p-3 rounded mb-2 col-span-12">
      <legend class="float-none w-auto px-2">Tipo de Selección</legend>
      <div class="grid grid-cols-12 gap-3">
        <div class="col-span-12">
          <div class="flex flex-col gap-3">
            <div class="flex items-center">
              <RadioButton
                v-model="cambioMasivo.tipoSeleccion"
                inputId="seleccion-equipo"
                value="equipo"
              />
              <label for="seleccion-equipo" class="ml-2 cursor-pointer">Por Equipo</label>
            </div>
            <div class="flex items-center">
              <RadioButton
                v-model="cambioMasivo.tipoSeleccion"
                inputId="seleccion-estado"
                value="estado"
              />
              <label for="seleccion-estado" class="ml-2 cursor-pointer">Por Estado</label>
            </div>
            <div class="flex items-center">
              <RadioButton
                v-model="cambioMasivo.tipoSeleccion"
                inputId="seleccion-individual"
                value="individual"
              />
              <label for="seleccion-individual" class="ml-2 cursor-pointer">IMEIs Seleccionados</label>
            </div>
          </div>
        </div>

        <!-- Selector de Equipo -->
        <div v-if="cambioMasivo.tipoSeleccion === 'equipo'" class="col-span-12">
          <label class="block mb-1">Equipo</label>
          <Select
            v-model="cambioMasivo.equipoSeleccionado"
            :options="equiposDisponibles"
            placeholder="Seleccionar equipo"
            filter
            fluid
          />
        </div>

        <!-- Selector de Estado -->
        <div v-else-if="cambioMasivo.tipoSeleccion === 'estado'" class="col-span-12">
          <label class="block mb-1">Estado</label>
          <Select
            v-model="cambioMasivo.estadoSeleccionado"
            :options="['DISPONIBLE', 'VENDIDO', 'APARTADO', 'GARANTIA', 'REPARACION']"
            placeholder="Seleccionar estado"
            fluid
          />
        </div>

        <!-- Selector de IMEIs individuales -->
        <div v-else class="col-span-12">
          <label class="block mb-1">Seleccionar IMEIs</label>
          <MultiSelect
            v-model="cambioMasivo.imeisSeleccionados"
            :options="data"
            optionLabel="imei"
            placeholder="Seleccionar IMEIs"
            filter
            display="chip"
            :maxSelectedLabels="3"
            fluid
            class="w-full"
          >
            <template #option="slotProps">
              <div class="flex items-center gap-2">
                <span class="font-semibold">{{ slotProps.option.imei }}</span>
                <span class="text-sm text-gray-500">- {{ slotProps.option.equipo }}</span>
                <span class="text-sm text-green-600 ml-auto">${{ Number(slotProps.option.precio_venta || 0).toFixed(2) }}</span>
              </div>
            </template>
            <template #value="slotProps">
              <div v-if="slotProps.value && slotProps.value.length > 0" class="flex items-center gap-1">
                <span>{{ slotProps.value.length }} IMEI(s) seleccionado(s)</span>
              </div>
              <span v-else>
                {{ slotProps.placeholder }}
              </span>
            </template>
          </MultiSelect>
          <small class="text-gray-500 mt-1 block">
            Seleccione uno o más IMEIs para aplicar el cambio de precios
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
        <strong>Importante:</strong> Esta acción modificará los precios de múltiples IMEIs. Asegúrese de revisar la configuración antes de aplicar.
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
<!-- ////////////////////////////////////////////////////////////////////////////////////////// -->
<!-- Modal para Transferencia de Almacen -->
<Dialog
  v-model:visible="visibleTransferenciaAlmacen"
  modal
  header="Transferir IMEI a otro Almacen"
  :style="{ width: '600px' }"
  :draggable="false"
>
  <div class="space-y-4">
    <!-- Información del IMEI -->
    <div class="bg-blue-50 p-4 rounded-lg border border-blue-200">
      <p class="text-sm font-semibold text-gray-700 mb-2">IMEI a Transferir:</p>
      <p class="font-mono text-lg font-bold text-blue-600">{{ imeiTransferencia?.imei }}</p>
    </div>

    <!-- Información del Producto Actual -->
    <div v-if="productoOriginalTransferencia" class="bg-gray-50 p-4 rounded-lg border border-gray-200">
      <p class="text-sm font-semibold text-gray-700 mb-2">Producto Actual:</p>
      <p class="text-sm">{{ productoOriginalTransferencia.nombre }}</p>
      <p class="text-xs text-gray-600 mt-1">Código: {{ productoOriginalTransferencia.codigo }}</p>
    </div>
    <div v-else class="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
      <p class="text-sm font-semibold text-yellow-700">Este IMEI no tiene producto asociado</p>
    </div>

    <!-- Almacén Actual -->
    <div class="flex items-center gap-2 p-3 bg-gray-100 rounded">
      <i class="pi pi-warehouse text-gray-600"></i>
      <div>
        <p class="text-xs text-gray-600">Almacén Actual:</p>
        <p class="font-semibold">{{ imeiTransferencia?.almacen || 'Sin almacén' }}</p>
      </div>
    </div>

    <!-- Selector de Almacén Destino -->
    <div class="space-y-2">
      <label class="block text-sm font-semibold text-gray-700">
        <i class="pi pi-arrow-right mr-2"></i>Almacén Destino:
      </label>
      <Dropdown
        v-model="almacenDestinoSeleccionado"
        :options="almacenesDisponibles.filter(alm => alm !== imeiTransferencia?.almacen)"
        placeholder="Seleccione un almacén"
        class="w-full"
        showClear
      />
    </div>
  </div>

  <template #footer>
    <Button label="Cancelar" icon="pi pi-times" @click="cancelarTransferenciaAlmacen" text />
    <Button
      label="Continuar"
      icon="pi pi-arrow-right"
      @click="confirmarTransferenciaAlmacen"
      severity="success"
      :disabled="!almacenDestinoSeleccionado"
    />
  </template>
</Dialog>

<!-- Modal para Selección de Producto con DataTable -->
<Dialog
  v-model:visible="visibleSeleccionProducto"
  modal
  :header="cambiarProductoEnTransferencia ? 'Seleccionar Nuevo Producto' : 'Seleccionar Producto Destino'"
  :style="{ width: '900px' }"
  :draggable="false"
>
  <div class="space-y-4">
    <!-- Información -->
    <div v-if="!productoOriginalTransferencia" class="bg-yellow-50 p-3 rounded border border-yellow-200">
      <p class="text-sm text-yellow-800">
        <i class="pi pi-info-circle mr-2"></i>
        Este IMEI no tiene producto asociado. Seleccione a qué producto del almacén desea asignarlo.
      </p>
    </div>
    <div v-else class="bg-blue-50 p-3 rounded border border-blue-200">
      <p class="text-sm text-blue-800">
        <i class="pi pi-info-circle mr-2"></i>
        Seleccione el producto del almacén destino
      </p>
    </div>

    <!-- Buscador -->
    <div class="flex items-center gap-2">
      <span class="p-input-icon-left flex-1">
        <i class="pi pi-search" />
        <InputText
          v-model="busquedaProductoDestino"
          placeholder="Buscar por nombre, código, marca o modelo..."
          class="w-full"
        />
      </span>
      <Tag :value="`${productosFiltradosDestino.length} productos`" severity="info" />
    </div>

    <!-- DataTable -->
    <DataTable
      :value="productosFiltradosDestino"
      v-model:selection="productoDestinoSeleccionado"
      selectionMode="single"
      dataKey="id"
      :rows="10"
      :paginator="true"
      :rowsPerPageOptions="[10, 25, 50]"
      scrollable
      scrollHeight="400px"
      class="p-datatable-sm"
      @row-dblclick="confirmarSeleccionProducto"
    >
      <Column field="codigo" header="Código" style="min-width: 120px">
        <template #body="slotProps">
          <Tag :value="slotProps.data.codigo" severity="secondary" />
        </template>
      </Column>
      <Column field="nombre" header="Nombre" style="min-width: 200px">
        <template #body="slotProps">
          <div class="font-semibold">{{ slotProps.data.nombre }}</div>
        </template>
      </Column>
      <Column field="marca" header="Marca" style="min-width: 120px" />
      <Column field="modelo" header="Modelo" style="min-width: 120px" />
      <Column field="stock" header="Stock" style="min-width: 80px">
        <template #body="slotProps">
          <Tag :value="slotProps.data.stock" :severity="slotProps.data.stock > 0 ? 'success' : 'danger'" />
        </template>
      </Column>
      <Column field="precio_venta" header="Precio Venta" style="min-width: 120px">
        <template #body="slotProps">
          <span class="font-semibold text-green-600">
            {{ formatCurrencyImei(slotProps.data.precio_venta) }}
          </span>
        </template>
      </Column>
    </DataTable>
  </div>

  <template #footer>
    <Button label="Cancelar" icon="pi pi-times" @click="cancelarSeleccionProducto" text />
    <Button
      label="Seleccionar Producto"
      icon="pi pi-check"
      @click="confirmarSeleccionProducto"
      severity="success"
      :disabled="!productoDestinoSeleccionado"
    />
  </template>
</Dialog>

<!-- ////////////////////////////////////////////////////////////////////////////////////////// -->
<Toast />
<LoadingOverlay :visible="loading" />
 </div>
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
/* Header Profesional de IMEI */
.imei-header {
 background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%);
 border-radius: 12px;
 padding: 2rem;
 box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
}

.imei-header-content {
 display: flex;
 align-items: center;
 gap: 1.5rem;
}

.imei-icon-wrapper {
 width: 4rem;
 height: 4rem;
 background: rgba(255, 255, 255, 0.2);
 border-radius: 12px;
 display: flex;
 align-items: center;
 justify-content: center;
 backdrop-filter: blur(10px);
}

.imei-icon {
 font-size: 2rem;
 color: white;
}

.imei-title {
 font-size: 1.875rem;
 font-weight: 700;
 color: white;
 margin: 0;
 letter-spacing: -0.025em;
}

.imei-subtitle {
 font-size: 1rem;
 color: rgba(255, 255, 255, 0.9);
 margin: 0.25rem 0 0 0;
}

.imei-header-text {
 display: flex;
 flex-direction: column;
 gap: 0.25rem;
}

.imei-title {
 font-size: 1.2rem;
 font-weight: 600;
 letter-spacing: 0.03em;
 color: #111827;
}

@media (min-width: 768px) {
 .imei-title {
 font-size: 1.45rem;
 }
}

.imei-subtitle {
 font-size: 0.8rem;
 color: #6b7280;
}

.imei-header-actions {
 display: flex;
 flex-wrap: wrap;
 gap: 0.5rem;
 justify-content: flex-start;
}

@media (min-width: 640px) {
 .imei-header-actions {
 justify-content: flex-end;
 }
}

.imei-btn {
 display: inline-flex;
 align-items: center;
 gap: 0.4rem;
 padding: 0.4rem 0.85rem;
 border-radius: 999px;
 border: 1px solid transparent;
 font-size: 0.75rem;
 font-weight: 500;
 text-transform: uppercase;
 letter-spacing: 0.08em;
 background: #f9fafb;
 color: #111827;
 cursor: pointer;
 transition: all 0.15s ease;
}

.imei-btn i {
 font-size: 0.8rem;
}

.imei-btn-primary {
 background: linear-gradient(135deg, #22c55e, #16a34a);
 border-color: rgba(22, 163, 74, 0.9);
 color: #ecfdf5;
}

.imei-btn-primary:hover {
 background: linear-gradient(135deg, #4ade80, #22c55e);
}

.imei-btn-secondary {
 background: #ffffff;
 border-color: #d1d5db;
}

.imei-btn-secondary:hover {
 background: #eff6ff;
 border-color: #93c5fd;
}

.imei-btn-danger {
 background: #fee2e2;
 border-color: #fecaca;
 color: #b91c1c;
}

.imei-btn-danger:hover {
 background: #fecaca;
}

.imei-btn-success {
 background: #dcfce7;
 border-color: #bbf7d0;
 color: #15803d;
}

.imei-btn-success:hover {
 background: #bbf7d0;
}

.imei-btn-outline {
 background: #ffffff;
}

.imei-filters {
 display: flex;
 flex-wrap: wrap;
 gap: 1rem;
 align-items: flex-end;
 margin: 0.75rem 0 0.75rem;
}

.imei-filter-group {
 display: flex;
 flex-direction: column;
 gap: 0.25rem;
}

.imei-filter-label {
 font-size: 0.7rem;
 text-transform: uppercase;
 letter-spacing: 0.12em;
 color: #6b7280;
}

.imei-select {
 min-width: 160px;
}

.imei-search-wrapper {
 position: relative;
}

.imei-search-input {
 padding-left: 2rem;
 min-width: 220px;
}

.imei-search-icon {
 position: absolute;
 left: 0.6rem;
 top: 50%;
 transform: translateY(-50%);
 font-size: 0.85rem;
 color: #9ca3af;
}

.imei-table {
 border-radius: 0.75rem;
 border: 1px solid #e5e7eb;
 overflow: hidden;
}

/* Tarjetas de Resumen */
.summary-card {
 border-radius: 12px;
 border: none;
 transition: all 0.3s ease;
 overflow: hidden;
 position: relative;
}

.summary-card::before {
 content: '';
 position: absolute;
 top: 0;
 left: 0;
 right: 0;
 height: 4px;
}

.disponibles-card::before {
 background: linear-gradient(90deg, #10b981, #059669);
}

.vendidos-card::before {
 background: linear-gradient(90deg, #ef4444, #dc2626);
}

.inventario-card::before {
 background: linear-gradient(90deg, #3b82f6, #2563eb);
}

.total-card::before {
 background: linear-gradient(90deg, #8b5cf6, #7c3aed);
}

.summary-card:hover {
 transform: translateY(-4px);
 box-shadow: 0 12px 24px -10px rgba(0, 0, 0, 0.15);
}

.summary-card .p-card-content {
 padding: 1.5rem;
}

.summary-label {
 font-size: 0.75rem;
 font-weight: 600;
 color: #6b7280;
 text-transform: uppercase;
 letter-spacing: 0.05em;
 margin: 0 0 0.5rem 0;
}

.summary-value {
 font-size: 2rem;
 font-weight: 700;
 color: #111827;
 margin: 0 0 0.25rem 0;
}

.summary-value-currency {
 font-size: 1.5rem;
 font-weight: 700;
 color: #111827;
 margin: 0 0 0.25rem 0;
 font-family: 'Courier New', monospace;
}

.summary-count {
 font-size: 0.875rem;
 color: #9ca3af;
 margin: 0;
}

.summary-icon-wrapper {
 width: 3.5rem;
 height: 3.5rem;
 border-radius: 12px;
 display: flex;
 align-items: center;
 justify-content: center;
}

.summary-icon-wrapper.disponibles {
 background: linear-gradient(135deg, #d1fae5, #a7f3d0);
 color: #059669;
}

.summary-icon-wrapper.vendidos {
 background: linear-gradient(135deg, #fecaca, #fca5a5);
 color: #dc2626;
}

.summary-icon-wrapper.inventario {
 background: linear-gradient(135deg, #dbeafe, #bfdbfe);
 color: #2563eb;
}

.summary-icon-wrapper.total {
 background: linear-gradient(135deg, #e9d5ff, #d8b4fe);
 color: #7c3aed;
}

/* Tabla de IMEI */
.imei-table-card {
 border-radius: 12px;
 border: 1px solid #e5e7eb;
}

.imei-table-card .p-card-content {
 padding: 1.5rem;
}

.imei-toolbar {
 padding-bottom: 1rem;
}

.imei-filters {
 padding: 1rem 0;
}

.imei-datatable :deep(.p-datatable-thead > tr > th) {
 background: linear-gradient(to bottom, #f9fafb, #f3f4f6);
 color: #374151;
 font-weight: 600;
 text-transform: uppercase;
 font-size: 0.75rem;
 letter-spacing: 0.05em;
 border-bottom: 2px solid #0ea5e9;
}

.imei-datatable :deep(.p-datatable-tbody > tr:hover) {
 background-color: #eff6ff!important;
 cursor: pointer;
}

.imei-datatable :deep(.p-datatable-tbody > tr) {
 transition: all 0.2s ease;
}

/* Estilos de estado */
.vendido {
 color: #b91c1c!important;
}

.disponible {
 color: #15803d!important;
}

/* Animaciones */
@keyframes slideIn {
 from {
 opacity: 0;
 transform: translateY(10px);
 }
 to {
 opacity: 1;
 transform: translateY(0);
 }
}

.summary-card {
 animation: slideIn 0.3s ease-out;
}

/* Modales de IMEI */
.imei-dialog :deep(.p-dialog-header) {
 border-bottom: 1px solid #e5e7eb;
 padding: 1.5rem;
}

.imei-dialog :deep(.p-dialog-content) {
 padding: 0;
}

.imei-dialog :deep(.p-dialog-footer) {
 border-top: 1px solid #e5e7eb;
 padding: 1rem 1.5rem;
}

.imei-dialog h4 {
 position: relative;
 padding-bottom: 0.5rem;
}

.imei-dialog h4::after {
 content: '';
 position: absolute;
 bottom: 0;
 left: 0;
 width: 3rem;
 height: 2px;
 background: currentColor;
 opacity: 0.5;
}

.imei-dialog .dropdown-input {
 width: 100%;
 border: 1px solid #d1d5db;
 border-radius: 6px;
 padding: 0.625rem 0.75rem;
 font-size: 1rem;
 transition: all 0.2s;
}

.imei-dialog .dropdown-input:focus {
 border-color: #0ea5e9;
 box-shadow: 0 0 0 3px rgba(14, 165, 233, 0.1);
 outline: none;
}

/* Responsive */
@media (max-width: 768px) {
 .imei-header {
 padding: 1.5rem;
 }

 .imei-title {
 font-size: 1.5rem;
 }

 .imei-subtitle {
 font-size: 0.875rem;
 }

 .summary-value {
 font-size: 1.5rem;
 }

 .summary-value-currency {
 font-size: 1.25rem;
 }

 .imei-toolbar {
 flex-direction: column;
 align-items: stretch;
 }

 .imei-filters .flex {
 flex-direction: column;
 }

 .imei-dialog :deep(.p-dialog) {
 width: 95vw!important;
 }

 .imei-dialog h4 {
 font-size: 0.875rem;
 }
}

/* ===== MODAL EDITAR IMEI - REDISENO ===== */
.imei-edit-header {
 display: flex;
 align-items: center;
 gap: 1rem;
}

.imei-edit-header-icon {
 width: 52px;
 height: 52px;
 background: linear-gradient(135deg, #3b82f6, #6366f1);
 border-radius: 14px;
 display: flex;
 align-items: center;
 justify-content: center;
 flex-shrink: 0;
 box-shadow: 0 4px 12px rgba(99, 102, 241, 0.35);
}

.imei-edit-header-icon i {
 font-size: 1.5rem;
 color: white;
}

.imei-edit-title {
 font-size: 1.15rem;
 font-weight: 700;
 color: #1e293b;
 margin: 0;
}

.imei-edit-code {
 font-family: 'Courier New', monospace;
 font-size: 0.8rem;
 background: #f1f5f9;
 color: #475569;
 padding: 2px 8px;
 border-radius: 6px;
 letter-spacing: 1px;
}

.imei-edit-body {
 padding: 0.5rem 0.25rem;
 display: flex;
 flex-direction: column;
 gap: 0;
}

.imei-edit-section {
 border: 1px solid #e2e8f0;
 border-radius: 12px;
 margin-bottom: 1rem;
 overflow: hidden;
}

.imei-edit-section-title {
 display: flex;
 align-items: center;
 gap: 0.6rem;
 padding: 0.65rem 1rem;
 font-size: 0.8rem;
 font-weight: 700;
 text-transform: uppercase;
 letter-spacing: 0.5px;
 background: linear-gradient(90deg, #eff6ff, #f8fafc);
 color: #3b82f6;
 border-bottom: 1px solid #e2e8f0;
}

.imei-edit-section-title.green {
 background: linear-gradient(90deg, #f0fdf4, #f8fafc);
 color: #16a34a;
}

.imei-edit-section-title.purple {
 background: linear-gradient(90deg, #faf5ff, #f8fafc);
 color: #7c3aed;
}

.imei-edit-section-title.orange {
 background: linear-gradient(90deg, #fff7ed, #f8fafc);
 color: #ea580c;
}

.imei-edit-grid {
 display: grid;
 grid-template-columns: repeat(12, 1fr);
 gap: 0.85rem;
 padding: 1rem;
}

.imei-edit-field {
 display: flex;
 flex-direction: column;
 gap: 0.35rem;
}

.imei-edit-field label {
 font-size: 0.78rem;
 font-weight: 600;
 color: #64748b;
 display: flex;
 align-items: center;
 gap: 0.3rem;
}

.imei-edit-field label i {
 font-size: 0.75rem;
 color: #94a3b8;
}

/* Bateria */
.imei-battery-wrapper {
 display: flex;
 align-items: center;
 gap: 1rem;
}

.imei-battery-input {
 flex-shrink: 0;
}

.imei-battery-bar-container {
 flex: 1;
 height: 22px;
 background: #f1f5f9;
 border-radius: 99px;
 border: 1px solid #e2e8f0;
 overflow: hidden;
 position: relative;
 display: flex;
 align-items: center;
}

.imei-battery-bar {
 height: 100%;
 border-radius: 99px;
 transition: width 0.4s ease, background-color 0.4s ease;
}

.battery-green { background: linear-gradient(90deg, #22c55e, #16a34a); }
.battery-yellow { background: linear-gradient(90deg, #facc15, #eab308); }
.battery-red { background: linear-gradient(90deg, #f87171, #dc2626); }

.imei-battery-label {
 position: absolute;
 right: 10px;
 font-size: 0.75rem;
 font-weight: 700;
 color: #1e293b;
}

.imei-edit-footer {
 display: flex;
 justify-content: space-between;
 align-items: center;
 flex-wrap: wrap;
 gap: 0.5rem;
 width: 100%;
}
</style>
