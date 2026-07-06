<script setup>
import { ref, onMounted, nextTick, watchEffect, watch, computed } from 'vue';
import { useToast } from "primevue/usetoast";
import { useRouter,useRoute } from 'vue-router';
import { useI18n } from 'vue-i18n';
const { t } = useI18n();
const router = useRouter();
import FileUploader from '../Componentes/FileUploader.vue';
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
  generarCodigoUnico,
  generarTablaFromStringJSON,
  peticionesFetchOffline,
  esObjeto,
  mensajetoast,
  lasMayusculas} from '@/funciones/funciones.js';
import Swal from 'sweetalert2'
const toast = useToast();
import OptionButtonTM from '@/components/OptionButtomTM.vue';
/************************************************************************/
const archivosParaSubir = ref([])
import Button from 'primevue/button';
import ProgressSpinner from 'primevue/progressspinner';
/************************************************************************/
import {useDatosEmpresa} from '@/stores'
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
const datosConfiguracion = ref({});
/************************************************************************/
const position = ref('top');
/************************************************************************/
const nousaStockCheck = ref('Usa Stock');
const optionsStock = ref(['Usa Stock', 'No Usa Stock']);
const obtenerTipoProductoInicial = () => {
  const datosDefault = JSON.parse(window.localStorage.getItem('datosDefault')) || {};
  return datosDefault.modo === 'CELULAR' ? 'CELULARES' : 'PRODUCTO';
};
const tipoProducto = ref(obtenerTipoProductoInicial());
const seVendePor = ref('UNIDAD');
const empaques = ref([]);
const addImpuestos = ref('Sin Imp')
const optionsImpuestos = ref(['Sin Imp','Incluido','Agregado'])
const categorias = ref([])
const proveedores = ref([])
const empresas = ref([])
const marcas = ref([])
const rutaIMAGEN = ref('')
const urlIMAGEN = ref(null)
const opcionesCapacidad = ref(['32GB', '64GB', '128GB', '256GB', '512GB', '1TB', '2TB'])
/************************************************************************/
const proveedor = ref({});
/************************************************************************/
const visibleAgregarCategoria = ref(false)
const visibleAgregarMarca = ref(false)
const visibleProveedor = ref(false)
const agregarCategoria = ref('')
const agregarMarca = ref('')
/************************************************************************/
const datoscamposProductos = ref({})
const codigoUnico = ref(generarCodigoUnico());
const fecha = ref(nfecha('fecha'));
/************************************************************************/
// IMEI Management
const imeiInput = ref('');
const imeisList = ref([]);
const imeiInputRef = ref(null);
const imeiInsertLoading = ref(false);

// Computed para verificar si es CELULARES
const esCelular = computed(() => {
  const categoria = datoscamposProductos.value.categoria;
  if (typeof categoria === 'object' && categoria !== null) {
    return categoria.nombre === 'CELULARES';
  }
  return categoria === 'CELULARES';
});

// Computed para verificar si es ELECTRODOMESTICOS
const esElectrodomestico = computed(() => {
  const categoria = datoscamposProductos.value.categoria;
  if (typeof categoria === 'object' && categoria !== null) {
    return categoria.nombre === 'ELECTRODOMESTICOS';
  }
  return categoria === 'ELECTRODOMESTICOS';
});

// Computed para verificar si tiene seriales (CELULARES o ELECTRODOMESTICOS)
const tieneSeriales = computed(() => {
  return esCelular.value || esElectrodomestico.value;
});

// Computed para el label del campo (IMEI o Serial)
const labelSerial = computed(() => {
  if (esCelular.value) return 'IMEI';
  if (esElectrodomestico.value) return 'Serial';
  return 'Serial';
});

// Computed para la tabla destino
const tablaSeriales = computed(() => {
  if (esCelular.value) return 'imei';
  if (esElectrodomestico.value) return 'electrodomesticos';
  return 'imei';
});
/************************************************************************/

/************************************************************************/
const fetchAndSetupData = async () => {
    const jsonData = await arrayToObjetoFromTabla(link.value+api.value,tokenCifrado.value,'productos');
    datoscamposProductos.value = jsonData;
    datoscamposProductos.value.stock = datoscamposProductos.value.stock || 1;
    datoscamposProductos.value.codigo = datoscamposProductos.value.codigo || generarCodigoUnico();
    datoscamposProductos.value.imagen = datoscamposProductos.value.imagen || generarCodigoUnico();
    rutaIMAGEN.value = '../vista/img/productos/'+datoscamposProductos.value.imagen;
    datoscamposProductos.value.codigo_barra = datoscamposProductos.value.codigo_barra || generarCodigoUnico();
    datoscamposProductos.value.empaque = datoscamposProductos.value.empaque || seVendePor.value;
    datoscamposProductos.value.precio_compra = datoscamposProductos.value.precio_compra || '0.00';
    datoscamposProductos.value.ganancia = datoscamposProductos.value.ganancia || '20';
    datoscamposProductos.value.precio_venta = datoscamposProductos.value.precio_venta || '0.00';
    datoscamposProductos.value.precio_min = datoscamposProductos.value.precio_min || '0.00';
    datoscamposProductos.value.precio_xmayor = datoscamposProductos.value.precio_xmayor || '0.00';
    datoscamposProductos.value.impuesto_venta = datoscamposProductos.value.impuesto_venta || '0.00';
    datoscamposProductos.value.precio_final = datoscamposProductos.value.precio_final || '0.00';
    datoscamposProductos.value.alerta = datoscamposProductos.value.alerta || '1';
    datoscamposProductos.value.impuestos = datoscamposProductos.value.impuestos || '0.00';
    datoscamposProductos.value.oferta = datoscamposProductos.value.oferta || '0.00';
    datoscamposProductos.value.comision = datoscamposProductos.value.comision || '0.00';
    datoscamposProductos.value.instalacion = datoscamposProductos.value.instalacion || '0.00';
    const categoriaInicial = tipoProducto.value === 'CELULARES' ? 'CELULARES' : 'OTRO';
    datoscamposProductos.value.categoria = datoscamposProductos.value.categoria || categorias.value.find(c => c.nombre === categoriaInicial) || categoriaInicial;
    datoscamposProductos.value.proveedor = datoscamposProductos.value.proveedor || proveedores.value[0].nombre;
    datoscamposProductos.value.marca = datoscamposProductos.value.marca || marcas.value[0].nombre;

    datoscamposProductos.value.condicion = 'NUEVO'
    datoscamposProductos.value.situacion = 'PROPIO'
    datoscamposProductos.value.t_garantia = 30
    datoscamposProductos.value.caracteristicas = '[]'
    datoscamposProductos.value.otro = [];
    datoscamposProductos.value.almacen = datosEmpresa.empresa.nombre;

};
/************************************************************************/
const fetchDataEmpaques = async () => {
  try {
   const response = await peticionesFetchOffline('getDataAsArray', 'empaques');
    empaques.value = response;
    /*********************************************/
  } catch (error) {
    console.error('Error fetching data', error);
    toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to fetch data', life: 3000 });
  }
};
/************************************************************************/
const fetchDataEmpresas = async () => {
  try {
   const response = await peticionesFetchOffline('getDataAsArray', 'empresa');
    empresas.value = response.map(emp=>emp.nombre);
    /*********************************************/
  } catch (error) {
    console.error('Error fetching data', error);
    toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to fetch data', life: 3000 });
  }
};
/************************************************************************/
const fetchDataCategorias = async () => {
  try {
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
    const response = await peticionesFetchOffline('getDataAsArray', 'marcas');
    marcas.value = response;
    /*********************************************/
  } catch (error) {
    console.error('Error fetching data', error);
    toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to fetch data Marcas', life: 3000 });
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

const datosJSON = await envioElectron('datosarchivo');

tokenCifrado.value = await encryptarPassword(token.value, 10);

datosConfiguracion.value = JSON.parse(window.localStorage.getItem('configuracion'))
await fetchDataEmpresas();
await fetchDataCategorias();
await fetchDataProveedores();
await fetchDataMarcas();
await fetchAndSetupData();
await fetchDataEmpaques();

const clonadoP = JSON.parse(window.localStorage.getItem('clonado'));

if (clonadoP) {
  delete clonadoP.id;
  datoscamposProductos.value = clonadoP;
  datoscamposProductos.value.codigo = generarCodigoUnico();
  datoscamposProductos.value.stock = '0.00';
  datoscamposProductos.value.codigo_barra = generarCodigoUnico();
}


urlIMAGEN.value = link.value+api.value+"/subirunaimagen2";

});
/************************************************************************/
const clonarDatos = ()=>{
  const codigoN = generarCodigoUnico();
  datoscamposProductos.value.codigo = codigoN;
  datoscamposProductos.value.codigo = codigoN;
  datoscamposProductos.value.imagen = codigoN;
}
/************************************************************************/
// =============== IMEI/SERIAL MANAGEMENT ===============
const agregarImei = async () => {
  const imei = imeiInput.value.trim();

  if (!imei) {
    toast.add({ severity: 'warn', summary: 'Advertencia', detail: `Ingrese un ${labelSerial.value}`, life: 2000 });
    return;
  }

  // Verificar si ya existe en la lista local
  if (imeisList.value.some(i => i.imei === imei)) {
    toast.add({ severity: 'warn', summary: 'Advertencia', detail: `Este ${labelSerial.value} ya fue agregado`, life: 2000 });
    imeiInput.value = '';
    return;
  }

  // Validar longitud del IMEI solo para CELULARES (debe ser exactamente 15 dígitos)
  if (esCelular.value && imei.length !== 15) {
    toast.add({ severity: 'warn', summary: 'Advertencia', detail: 'El IMEI debe tener exactamente 15 dígitos', life: 3000 });
    return;
  }

  // Validar que solo contenga números solo para CELULARES
  if (esCelular.value && !/^\d+$/.test(imei)) {
    toast.add({ severity: 'warn', summary: 'Advertencia', detail: 'El IMEI solo debe contener números', life: 3000 });
    return;
  }

  // Verificar si ya existe en la base de datos
  const campoSerial = esCelular.value ? 'imei' : 'serial';
  const verificaExiste = await peticionesFetchOffline('getDataByField', tablaSeriales.value, campoSerial, imei);
  if (verificaExiste) {
    toast.add({ severity: 'error', summary: 'Error', detail: `Este ${labelSerial.value} ya está registrado en el sistema`, life: 3000 });
    imeiInput.value = '';
    return;
  }

  // Agregar IMEI con precios por defecto
  const proveedorActual = typeof datoscamposProductos.value.proveedor === 'object'
    ? datoscamposProductos.value.proveedor?.nombre || ''
    : datoscamposProductos.value.proveedor || '';
  imeisList.value.push({
    imei: imei,
    precio_compra: parseFloat(datoscamposProductos.value.precio_compra) || 0,
    precio_venta: parseFloat(datoscamposProductos.value.precio_venta) || 0,
    precio_min: parseFloat(datoscamposProductos.value.precio_min) || 0,
    precio_xmayor: parseFloat(datoscamposProductos.value.precio_xmayor) || 0,
    ganancia: (parseFloat(datoscamposProductos.value.precio_venta) || 0) - (parseFloat(datoscamposProductos.value.precio_compra) || 0),
    proveedor: proveedorActual,
    bateria: 100,
    capacidad: '64GB',
    preciosModificados: false
  });

  // Actualizar stock según cantidad de IMEIs
  datoscamposProductos.value.stock = imeisList.value.length;

  // Limpiar input y enfocar
  imeiInput.value = '';
  if (imeiInputRef.value) {
    imeiInputRef.value.$el?.querySelector('input')?.focus();
  }

  toast.add({ severity: 'success', summary: `${labelSerial.value} Agregado`, detail: `${labelSerial.value}: ${imei}`, life: 1500 });
};

const eliminarImei = (index) => {
  imeisList.value.splice(index, 1);
  datoscamposProductos.value.stock = imeisList.value.length || 0;
  toast.add({ severity: 'info', summary: `${labelSerial.value} Eliminado`, life: 1500 });
};

const marcarPrecioModificado = (imei) => {
  imei.preciosModificados = true;
  // Recalcular ganancia
  imei.ganancia = parseFloat(imei.precio_venta) - parseFloat(imei.precio_compra);
};

const aplicarPreciosATodos = () => {
  imeisList.value.forEach(imei => {
    imei.precio_compra = parseFloat(datoscamposProductos.value.precio_compra) || 0;
    imei.precio_venta = parseFloat(datoscamposProductos.value.precio_venta) || 0;
    imei.precio_min = parseFloat(datoscamposProductos.value.precio_min) || 0;
    imei.precio_xmayor = parseFloat(datoscamposProductos.value.precio_xmayor) || 0;
    imei.ganancia = (parseFloat(datoscamposProductos.value.precio_venta) || 0) - (parseFloat(datoscamposProductos.value.precio_compra) || 0);
    imei.preciosModificados = false;
  });
  toast.add({ severity: 'success', summary: 'Precios Actualizados', detail: `Se aplicaron los precios a todos los ${labelSerial.value}s`, life: 2000 });
};

// Función para insertar IMEI en la base de datos después de crear el producto
const insertarImeiEnBD = async (imeiData, productoId) => {
  try {
    const tabla = tablaSeriales.value;
    const datoscamposImei = await arrayToObjetoFromTabla(tabla);

    // Asignar el valor del serial/imei según la tabla
    if (esCelular.value) {
      datoscamposImei.imei = imeiData.imei;
    } else if (esElectrodomestico.value) {
      datoscamposImei.serial = imeiData.imei; // usamos .imei del objeto pero lo guardamos como serial
    }

    datoscamposImei.equipo = datoscamposProductos.value.nombre;
    datoscamposImei.id_equi = productoId;
    datoscamposImei.proveedor = imeiData.proveedor || (typeof datoscamposProductos.value.proveedor === 'object'
      ? datoscamposProductos.value.proveedor.nombre
      : datoscamposProductos.value.proveedor);
    datoscamposImei.precio_compra = imeiData.precio_compra;
    datoscamposImei.precio_venta = imeiData.precio_venta;
    datoscamposImei.precio_min = imeiData.precio_min;
    datoscamposImei.precio_xmayor = imeiData.precio_xmayor;
    datoscamposImei.bateria = imeiData.bateria ?? 100;
    datoscamposImei.capacidad = imeiData.capacidad || '64GB';
    datoscamposImei.estado = 'DISPONIBLE';
    datoscamposImei.fecha = nfecha('fecha');
    datoscamposImei.almacen = datosEmpresa.empresa.nombre;
    datoscamposImei.detalles = '';

    if (datoscamposImei.hasOwnProperty('created_at')) {
      datoscamposImei.created_at = nfecha('timestamp');
      datoscamposImei.updated_at = nfecha('timestamp');
    }

    const envioDatos = await peticionesFetchOffline('insertData', tabla, JSON.stringify(datoscamposImei));
    return envioDatos[0] === 'ok';
  } catch (error) {
    console.error(`Error insertando ${labelSerial.value}:`, error);
    return false;
  }
};
/************************************************************************/
async function enviarDatos(event) {
    event.preventDefault();
  const url = link.value+api.value+"/insertar/productos";
  if (!datoscamposProductos.value) {
    toast.add({ severity: 'error', summary: t('Error'), detail: t('Incomplete data, cannot send'), life: 3000 });
    return;
  }
  if (datoscamposProductos.value.hasOwnProperty('created_at')) {
     datoscamposProductos.value.created_at = nfecha('timestamp')
     datoscamposProductos.value.updated_at = nfecha('timestamp')
    }

    if (esObjeto(datoscamposProductos.value.marca)) {
        datoscamposProductos.value.marca = datoscamposProductos.value.marca.nombre
    }

    if (esObjeto(datoscamposProductos.value.categoria)) {
        datoscamposProductos.value.categoria = datoscamposProductos.value.categoria.nombre
    }

    if (esObjeto(datoscamposProductos.value.proveedor)) {
        datoscamposProductos.value.proveedor = datoscamposProductos.value.proveedor.nombre
    }


// Limpiar campos no necesarios
  datoscamposProductos.value.almacen = datosEmpresa.empresa.nombre
  delete datoscamposProductos.value.otro
  delete datoscamposProductos.value.empaque
  delete datoscamposProductos.value.impuesto_venta
  delete datoscamposProductos.value.precio_final
  delete datoscamposProductos.value.oferta



/*    const verificaProducto = await peticionesFetchOffline('getDataByField', 'productos','nombre',datoscamposProductos.value.nombre);

if (verificaProducto) {
  toast.add({ severity: 'error', summary: t('Error'), detail: t('This product already exists'), life: 3000 });
  return
}*/

if(navigator.onLine){
const imagen = await peticionesFetch(`${link.value}${api.value}`,'creardirectorio',{'ruta':rutaIMAGEN.value},tokenCifrado.value,'POST');

}

   datoscamposProductos.value.tipo_impuesto = addImpuestos.value;

  const envioDatos = await peticionesFetchOffline('insertData', 'productos',JSON.stringify(datoscamposProductos.value));

  if (envioDatos[0] == 'ok') {

     toast.add({ severity: 'success', summary: t('Success'), detail: t('Data added successfully'), life: 3000 });

    // Obtener el producto recién creado para conseguir su ID
    const productoCreado = await peticionesFetchOffline('getDataByField', 'productos', 'codigo', datoscamposProductos.value.codigo);

    // Si tiene seriales (CELULARES o ELECTRODOMESTICOS) y hay IMEIs/Seriales, insertarlos en la BD
    if (tieneSeriales.value && imeisList.value.length > 0 && productoCreado) {
      let imeisInsertados = 0;
      imeiInsertLoading.value = true;
      try {
        for (const imeiData of imeisList.value) {
          const resultado = await insertarImeiEnBD(imeiData, productoCreado.id);
          if (resultado) imeisInsertados++;
        }
      } finally {
        imeiInsertLoading.value = false;
      }
      toast.add({
        severity: 'success',
        summary: `${labelSerial.value}s Registrados`,
        detail: `Se registraron ${imeisInsertados} de ${imeisList.value.length} ${labelSerial.value}s`,
        life: 3000
      });
      // Limpiar lista de IMEIs
      imeisList.value = [];
    }


if (archivosParaSubir.value.length > 0) {
      for (const archivo of archivosParaSubir.value) {
        const nombreFinal = archivo.name;
        const carpeta = datoscamposProductos.value.imagen;
        await subirImagenDespuesDeInsertar(archivo, carpeta, nombreFinal);
      }
      }



     localStorage.removeItem('clonado');


Swal.fire({
  title: t('Data Added'),
  text: t('What do we do now?'),
  icon: "warning",
  showCancelButton: true,
  showDenyButton: true,
  confirmButtonText: t('Add Another!'),
  cancelButtonText: t('No, Return to Home!'),
  denyButtonText: t('Clone'),
}).then(async(result) => {
  if (result.isConfirmed) {
    fetchAndSetupData();
    imeisList.value = [];
  } else if (result.isDenied) {
    clonarDatos();
    imeisList.value = [];
  } else if (result.dismiss === Swal.DismissReason.cancel) {
    router.push({ path: `/productos` });
  }
});



  }else{
    toast.add({ severity: 'error', summary: 'Error', detail: 'Fallo al Agregar los datos.', life: 3000 });
  }



}
/************************************************************************/

/************************************************************************/
const noUsaStock = ()=>{
      if (nousaStockCheck.value === 'No Usa Stock') {
       datoscamposProductos.value.stock = '1.00';
     }
}
/************************************************************************/
const generarBarcode = ()=>{
  datoscamposProductos.value.codigo_barra = generarCodigoUnico();
}
/************************************************************************/
const clonarProducto = ()=>{

}
/************************************************************************/
const cambiarSeVendePor = ()=>{
     datoscamposProductos.value.empaque = seVendePor.value

}
/************************************************************************/
const verificaImpuestos = ()=>{
   if (addImpuestos.value === 'Incluido' || addImpuestos.value === 'Agregado') {
      datoscamposProductos.value.impuestos = datosConfiguracion.value.impuesto;
   }else{
      datoscamposProductos.value.impuestos = '0.00'
   }
}
/************************************************************************/
/************************************************************************/
const calcularPrecios = () => {
  const impuesto = Number(datosConfiguracion.value.impuesto) / 100;
  const gananciaMinima = Number(datoscamposProductos.value.ganancia);
  const precioCompra = Number(datoscamposProductos.value.precio_compra);
  const ganancia = (precioCompra * gananciaMinima / 100);
  let precioVenta = datoscamposProductos.value.precio_venta_manual
                      ? Number(datoscamposProductos.value.precio_venta_manual)
                      : (ganancia + precioCompra);

  if (addImpuestos.value === 'Incluido') {
    const operacion = (precioVenta / (1 + impuesto));
    const impuestoCalculado = (precioVenta - operacion);
    datoscamposProductos.value.impuesto_venta = impuestoCalculado.toFixed(2);
    datoscamposProductos.value.precio_venta = precioVenta.toFixed(2);
    datoscamposProductos.value.precio_final = precioVenta.toFixed(2);
  } else if (addImpuestos.value === 'Agregado') {
    const precioConImpuesto = (precioVenta * (1 + impuesto));
    const impuestoCalculado = (precioConImpuesto - precioVenta);
    datoscamposProductos.value.precio_venta = precioVenta.toFixed(2);
    datoscamposProductos.value.impuesto_venta = impuestoCalculado.toFixed(2);
    datoscamposProductos.value.precio_final = precioConImpuesto.toFixed(2);
  } else {
    datoscamposProductos.value.precio_venta = precioVenta.toFixed(2);
    datoscamposProductos.value.impuesto_venta = '0.00';
    datoscamposProductos.value.precio_final = precioVenta.toFixed(2);
  }

  const precioMinimo = (precioVenta - (ganancia * 0.20));
  const precioXMayor = (precioVenta - (ganancia * 0.40));
  datoscamposProductos.value.precio_min = precioMinimo.toFixed(2);
  datoscamposProductos.value.precio_xmayor = precioXMayor.toFixed(2);
  datoscamposProductos.value.oferta = precioXMayor.toFixed(2);
};

/************************************************************************/

/************************************************************************/
watch([() => datoscamposProductos.value.precio_compra,
 () => datoscamposProductos.value.impuestos,
  () => addImpuestos.value], calcularPrecios);

// Watchers bidireccionales ganancia â†” precio_venta con nextTick para evitar decimales espurios
let _calcFlag = false;

watch(() => datoscamposProductos.value.ganancia, async () => {
  if (_calcFlag) return;
  _calcFlag = true;
  calcularPrecios();
  await nextTick();
  _calcFlag = false;
});

watch(() => datoscamposProductos.value.precio_venta, async () => {
  if (_calcFlag) return;
  _calcFlag = true;
  recarcularPventa();
  await nextTick();
  _calcFlag = false;
});

/************************************************************************/
watch(async()=>{
  if (visibleProveedor.value) {
       proveedor.value = await arrayToObjetoFromTabla(link.value+api.value,tokenCifrado.value,'proveedores');
  }
});
/************************************************************************/
const recarcularPventa = () => {
    const precioCompra = Number(datoscamposProductos.value.precio_compra);
    const precioVenta = Number(datoscamposProductos.value.precio_venta);

    if (!isNaN(precioCompra) && !isNaN(precioVenta) && precioCompra !== 0) {
        const ganancia = ((precioVenta - precioCompra) / precioCompra) * 100;
        datoscamposProductos.value.ganancia = ganancia.toFixed(2);
    } else {
        datoscamposProductos.value.ganancia = '0.00';
    }
}

/************************************************************************/
const fnTipoProducto = () => {
  if (tipoProducto.value === 'CELULARES') {
    datoscamposProductos.value.empaque = 'UNIDAD';
    datoscamposProductos.value.categoria = 'CELULARES';
    datoscamposProductos.value.stock = '0';
  } else if (tipoProducto.value === 'PRODUCTO') {
    datoscamposProductos.value.stock = '1';
    datoscamposProductos.value.empaque = 'UNIDAD';
    datoscamposProductos.value.categoria = 'OTRO';
  } else if (tipoProducto.value === 'SERVICIO') {
    datoscamposProductos.value.stock = '0';
    datoscamposProductos.value.empaque = 'INFINITO';
  } else if (tipoProducto.value === 'ELECTRODOMESTICOS') {
    datoscamposProductos.value.stock = '1';
    datoscamposProductos.value.empaque = 'UNIDAD';
    datoscamposProductos.value.categoria = 'ELECTRODOMESTICOS';
  }
};
/************************************************************************/
const isReadonly = computed(() => {
  return tipoProducto.value === 'CELULARES' || tipoProducto.value === 'SERVICIO';
});

/************************************************************************/
const fnAgregarCategoria = async ()=>{
  const datoscamposCategorias = await arrayToObjetoFromTabla(link.value+api.value,tokenCifrado.value,'categorias');
  datoscamposCategorias.nombre = agregarCategoria.value;
  const url = link.value+api.value+"/insertar/categorias";
  if (datoscamposCategorias.hasOwnProperty('created_at')) {
     datoscamposCategorias.created_at = nfecha('timestamp')
     datoscamposCategorias.updated_at = nfecha('timestamp')
    }
  const envioDatos = await peticionesFetchOffline('insertData', 'categorias',JSON.stringify(datoscamposCategorias));
  if (envioDatos[0] == 'ok') {
     toast.add({ severity: 'success', summary: 'Éxito', detail: 'Categoria Agregada exitosamente', life: 3000 });
     visibleAgregarCategoria.value = false
      await fetchDataCategorias();
     datoscamposProductos.value.categoria = categorias.value.find(categoria=>categoria.nombre ===agregarCategoria.value);
  }else{
    toast.add({ severity: 'error', summary: 'Error', detail: 'Fallo al Agregar la categoria.', life: 3000 });
 }
}
/************************************************************************/
const fnAgregarMarca = async ()=>{
  const datoscamposMarca = await arrayToObjetoFromTabla(link.value+api.value,tokenCifrado.value,'marcas');
  datoscamposMarca.nombre = agregarMarca.value;
  const url = link.value+api.value+"/insertar/marcas";
  if (datoscamposMarca.hasOwnProperty('created_at')) {
     datoscamposMarca.created_at = nfecha('timestamp')
     datoscamposMarca.updated_at = nfecha('timestamp')
    }
    const envioDatos = await peticionesFetchOffline('insertData', 'marcas',JSON.stringify(datoscamposMarca));
  if (envioDatos[0] == 'ok') {
     toast.add({ severity: 'success', summary: 'Éxito', detail: 'Marca Agregada exitosamente', life: 3000 });
     visibleAgregarMarca.value = false
      await fetchDataMarcas();
     datoscamposProductos.value.marca = marcas.value.find(marca=>marca.nombre === agregarMarca.value);
  }else{
    toast.add({ severity: 'error', summary: 'Error', detail: 'Fallo al Agregar la categoria.', life: 3000 });
 }
}
/************************************************************************/
const buscarRNC = async()=>{
  if(navigator.onLine){
    const rnc = proveedor.value.rnc.replace(/(-)/gm,"");
/*    const envio = await enviarDatosPorPost(link.value+'/vista/buscadorRNCdgii.php', {'rnc':rnc},tokenCifrado.value);*/
const envio = await peticionesFetch(
          'https://demo.tmposrd.com/api2',
          `consultarrnc/${rnc}`,
          {},
          tokenCifrado.value,
          'GET'
        );
    
    if (envio) {
        proveedor.value.nombre = envio.razon_social;
    }

  }
}
/************************************************************************/
const fnAgregarProveedor = async ()=>{
  const url = link.value+api.value+"/insertar/proveedores";
  if (proveedor.value.hasOwnProperty('created_at')) {
     proveedor.value.created_at = nfecha('timestamp')
     proveedor.value.updated_at = nfecha('timestamp')
    }
    const envioDatos = await peticionesFetchOffline('insertData', 'proveedores',JSON.stringify(proveedor.value));

  if (envioDatos[0] == 'ok') {
     toast.add({ severity: 'success', summary: 'Éxito', detail: 'Proveedor Agregado exitosamente', life: 3000 });
     visibleProveedor.value = false
      await fetchDataProveedores();
     datoscamposProductos.value.proveedor = proveedores.value.find(proveed=>proveed.nombre === proveedor.value.nombre);
  }else{
    toast.add({ severity: 'error', summary: 'Error', detail: 'Fallo al Agregar el Proveedor.', life: 3000 });
 }
}
/************************************************************************/
const preventEnterSubmit = (event)=> {
      if (event.key === 'Enter') {
        event.preventDefault();
      }
    }
/************************************************************************/
  const handleUploadSuccess = (result) => {
  console.log('Upload successful:', result);
};

const handleUploadError = (error) => {
  console.error('Upload failed:', error);
};
/************************************************************************/
const fileUpload = ref(null)
/************************************************************************/
const uploadImages = async() => {
  if (fileUpload.value) {
    fileUpload.value.fnSubirIMG();
  }
};
/************************************************************************/
const fnclonarPrecio = ()=>{
  datoscamposProductos.value.precio_min = datoscamposProductos.value.precio_venta
  datoscamposProductos.value.precio_xmayor = datoscamposProductos.value.precio_venta
  datoscamposProductos.value.oferta = datoscamposProductos.value.precio_venta
}
/************************************************************************/
const abrirModalAgregarCaracteristica = () => {
  Swal.fire({
    title: t('Add Feature'),
    html: `
      <input id="nombrecaracteristica" class="swal2-input" placeholder="${t('Name')}">
      <input id="caracteristica" class="swal2-input" placeholder="${t('Feature')}">
    `,
    focusConfirm: false,
    showCancelButton: true,
    confirmButtonText: t('Add'),
    cancelButtonText: t('Cancel'),
    preConfirm: () => {
      const nombre = document.getElementById('nombrecaracteristica').value.trim();
      const caracteristica = document.getElementById('caracteristica').value.trim();

      return { nombre, caracteristica };
    }
  }).then((result) => {
    if (result.isConfirmed && datoscamposProductos.value) {
      const { nombre, caracteristica } = result.value;

      let caracteristicas = [];
      try {
        caracteristicas = datoscamposProductos.value.caracteristicas
          ? JSON.parse(datoscamposProductos.value.caracteristicas)
          : [];

        if (!Array.isArray(caracteristicas)) {
          caracteristicas = [];
        }
      } catch (e) {
        console.error('Error al parsear características:', e);
        caracteristicas = [];
      }

      caracteristicas.push({ nombre, caracteristica });

      datoscamposProductos.value.caracteristicas = JSON.stringify(caracteristicas);

    }
  });
};


/************************************************************************/
const imeis = ref([]);

const handlePaste = (event) => {
  event.preventDefault();

  const pastedData = (event.clipboardData || window.clipboardData).getData('text');

  const cleanData = pastedData.replace(/[^0-9,]/g, '');

  const newImeis = cleanData
    .split(',')
    .map(item => item.trim())
    .filter(item => item.length > 0);

  datoscamposProductos.value.otro = Array.from(new Set([...imeis.value, ...newImeis]));
};
/************************************************************************/
const handleUpload = async (event) => {
  const archivos = event.files;
  archivosParaSubir.value = archivos;
};

async function subirImagenDespuesDeInsertar(archivo, subcarpeta, nombreFinal) {
  if (!archivo) {
    console.error('âŒ No se seleccionaron archivos');
    return;
  }

  const urlIMAGEN = link.value + api.value + '/subirunaimagen2';
  const rutaIMAGEN = '../vista/img/productos/'+datoscamposProductos.value.imagen

    const formData = new FormData();
    formData.append('imagen[]', archivo);
    formData.append('ruta', rutaIMAGEN);
    try {
      const response = await fetch(urlIMAGEN, {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();
      if (result[0].status === 'ok') {
        console.log('âœ… Imagen subida:', result);
        arrayIMG.value = await peticionesFetchOffline('listarArchivosDeCarpetaUrl', `productos/${datoscamposProductos.value.imagen}`);
      } else {
        console.error('âŒ Error en la subida:', result.message || result);
      }
    } catch (err) {
      console.error('âŒ Error al subir imagen:', err);
    }



}
/************************************************************************/
const nombresBase = ['Cargador', 'Celular', 'Audífono', 'Tablet', 'Cámara', 'Power Bank', 'Bocina', 'Memoria', 'Pantalla'];
const adjetivos = ['Nuevo', 'Económico', 'Premium', 'Compacto', 'Duradero', 'Digital', 'Moderno'];
const modelos = ['X1', 'A20', 'ZPro', 'Mini', 'Plus', 'Ultra', 'Lite'];

const generarProductoRandom = () => {
  const nombre = `${adjetivos[Math.floor(Math.random() * adjetivos.length)]} ${nombresBase[Math.floor(Math.random() * nombresBase.length)]}`;
  const codigo = generarCodigoUnico();
  const precioCompra = (Math.random() * 500 + 100).toFixed(2);
  const ganancia = Math.floor(Math.random() * 50) + 10;
  const proveedor = proveedores.value.length ? proveedores.value[Math.floor(Math.random() * proveedores.value.length)].nombre : 'Proveedor';
  const categoria = categorias.value.length ? categorias.value[Math.floor(Math.random() * categorias.value.length)].nombre : 'OTRO';
  const marca = marcas.value.length ? marcas.value[Math.floor(Math.random() * marcas.value.length)].nombre : 'GENÃ‰RICO';
  const empresa = empresas.value.length ? empresas.value[Math.floor(Math.random() * empresas.value.length)] : 'ALMACÃ‰N';

  datoscamposProductos.value = {
    codigo,
    codigo_barra: generarCodigoUnico(),
    imagen: codigo,
    nombre,
    modelo: modelos[Math.floor(Math.random() * modelos.length)],
    descripcion: `Producto ${nombre} de calidad garantizada.`,
    empaque: 'UNIDAD',
    categoria,
    proveedor,
    marca,
    precio_compra: precioCompra,
    ganancia,
    impuesto_venta: '0.00',
    precio_venta: '',
    precio_venta: '0.00',
    precio_min: '0.00',
    precio_xmayor: '0.00',
    precio_final: '0.00',
    impuestos: datosConfiguracion.value?.impuesto || '0.00',
    tipo_impuesto: 'Sin Imp',
    oferta: '0.00',
    stock: '5',
    alerta: '1',
    instalacion: '0.00',
    comision: '0.00',
    vencimiento: null,
    condicion: 'NUEVO',
    situacion: 'PROPIO',
    t_garantia: 30,
    ubicacion: 'Almacén principal',
    caracteristicas: JSON.stringify([
      { nombre: 'Color', caracteristica: 'Negro' },
      { nombre: 'Peso', caracteristica: '150g' },
    ]),
    otro: []
  };

  calcularPrecios();
};

/************************************************************************/
const verificaCodigo = async (e,campo = 'codigo') => {
    if(e){
    e.preventDefault()

    }
  const valor = datoscamposProductos.value[campo];

  const verificaExiste = await peticionesFetchOffline('getDataByField', 'productos', campo, valor);

  if (verificaExiste) {
    const resultado = await Swal.fire({
      title: `${campo.toUpperCase()} ${t('already exists')}`,
      text: `${t('There is already a product with the')} ${campo} "${valor}". ${t('What do you want to do?')}`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: t('Generate new'),
      cancelButtonText: t('View product'),
      reverseButtons: true
    });

    if (resultado.isConfirmed) {
      datoscamposProductos.value[campo] = generarCodigoUnico();
    } else if (resultado.dismiss === Swal.DismissReason.cancel) {
      await Swal.fire({
        title: t('Product found'),
        html: `
          <strong>${verificaExiste.nombre || t('No name')}</strong><br/>
          ${t('Code')}: ${verificaExiste.codigo}<br/>
          ${t('Price')}: $${verificaExiste.precio_venta}
        `,
        icon: 'info'
      });
    }

    return true;
  }

  return false;
};

/************************************************************************/


</script>
<template>
<main class="crear-producto-wrapper">
  <div class="crear-producto-container">

    <!-- Header con gradiente naranja -->
    <div class="crear-producto-header">
      <div class="crear-producto-header-content">
        <div class="crear-producto-icon-wrapper">
          <i class="pi pi-plus-circle crear-producto-icon"></i>
        </div>
        <div>
          <h1 class="crear-producto-title">{{ $t('Create New Product') }}</h1>
          <p class="crear-producto-subtitle">{{ $t('Complete product details') }}</p>
        </div>
      </div>
    </div>

    <!-- Actions Card -->
    <Card class="crear-producto-actions-card">
      <template #content>
        <div class="crear-producto-actions-grid">
          <router-link to="/productos">
            <Button icon="pi pi-home" :label="$t('Home')" severity="secondary" outlined />
          </router-link>

          <Button icon="pi pi-clone" :label="$t('Clone Product')" severity="info" @click="clonarProducto" />

          <OptionButtonTM
            v-model="nousaStockCheck"
            :options="optionsStock"
            @change="noUsaStock"
          />

          <Button icon="pi pi-sparkles" :label="$t('Generate Random')" severity="success" @click="generarProductoRandom" />
        </div>
      </template>
    </Card>

    <!-- Section Divider -->
    <div class="crear-producto-section-divider">
      <div class="crear-producto-divider-line"></div>
      <div class="crear-producto-divider-content">
        <i class="pi pi-pencil"></i>
        <span>{{ $t('Product Form') }}</span>
      </div>
      <div class="crear-producto-divider-line"></div>
    </div>

    <!-- Form Card -->
    <Card class="crear-producto-form-card">
      <template #content>
        <form @submit.prevent="enviarDatos" class="crear-producto-form">

          <!-- Tipo y Códigos -->
          <div class="crear-producto-form-section">
            <h3 class="crear-producto-section-title">
              <i class="pi pi-tag"></i>
              {{ $t('Identification') }}
            </h3>
            <div class="crear-producto-form-grid">
              <div class="crear-producto-form-group">
                <label class="crear-producto-label">{{ $t('Type') }}</label>
                <Dropdown
                  v-model="tipoProducto"
                  :options="['PRODUCTO','CELULARES','SERVICIO','ELECTRODOMESTICOS']"
                  @change="fnTipoProducto"
                  class="crear-producto-input"
                />
              </div>

              <div class="crear-producto-form-group">
                <label class="crear-producto-label">{{ $t('Code') }}</label>
                <InputText
                  v-model="datoscamposProductos.codigo"
                  @keydown="preventEnterSubmit"
                  maxlength="250"
                  class="crear-producto-input"
                />
              </div>

              <div class="crear-producto-form-group">
                <label class="crear-producto-label">{{ $t('Barcode') }}</label>
                <div class="p-inputgroup">
                  <InputText
                    v-model="datoscamposProductos.codigo_barra"
                    @keydown="preventEnterSubmit"
                    maxlength="250"
                    class="crear-producto-input"
                  />
                  <Button icon="pi pi-qrcode" @click="generarBarcode" />
                </div>
              </div>

              <div class="crear-producto-form-group crear-producto-form-group-wide">
                <label class="crear-producto-label">{{ $t('Name') }}</label>
                <InputText
                  v-model="datoscamposProductos.nombre"
                  v-mayusculablur
                  @keydown="preventEnterSubmit"
                  maxlength="250"
                  class="crear-producto-input"
                />
              </div>

              <div class="crear-producto-form-group">
                <label class="crear-producto-label">{{ $t('Sold By') }}</label>
                <Dropdown
                  v-model="seVendePor"
                  :options="['UNIDAD','DETALLADO']"
                  @change="cambiarSeVendePor"
                  class="crear-producto-input"
                />
              </div>
            </div>
          </div>

          <!-- Descripción -->
          <div v-if="false" class="crear-producto-form-section">
            <div class="crear-producto-form-group crear-producto-form-group-full">
              <label class="crear-producto-label">{{ $t('Description') }}</label>
              <Textarea
                v-model="datoscamposProductos.descripcion"
                rows="3"
                class="crear-producto-textarea"
              />
            </div>
          </div>

          <!-- Categoría, Proveedor, Marca -->
          <div class="crear-producto-form-section">
            <h3 class="crear-producto-section-title">
              <i class="pi pi-sitemap"></i>
              {{ $t('Classification') }}
            </h3>
            <div class="crear-producto-form-grid">
              <div class="crear-producto-form-group">
                <label class="crear-producto-label">{{ $t('Category') }}</label>
                <div class="p-inputgroup">
                  <Dropdown
                    v-model="datoscamposProductos.categoria"
                    :options="categorias"
                    optionLabel="nombre"
                    editable
                    class="crear-producto-input"
                  />
                  <Button icon="pi pi-plus" @click="visibleAgregarCategoria = true" />
                </div>
              </div>

              <div class="crear-producto-form-group">
                <label class="crear-producto-label">{{ $t('Supplier') }}</label>
                <div class="p-inputgroup">
                  <Dropdown
                    v-model="datoscamposProductos.proveedor"
                    :options="proveedores"
                    optionLabel="nombre"
                    editable
                    class="crear-producto-input"
                  />
                  <Button icon="pi pi-plus" @click="visibleProveedor = true" />
                </div>
              </div>

              <div class="crear-producto-form-group">
                <label class="crear-producto-label">{{ $t('Brand') }}</label>
                <div class="p-inputgroup">
                  <Dropdown
                    v-model="datoscamposProductos.marca"
                    :options="marcas"
                    editable
                    optionLabel="nombre"
                    class="crear-producto-input"
                  />
                  <Button icon="pi pi-plus" @click="visibleAgregarMarca = true" />
                </div>
              </div>

              <div v-if="false" class="crear-producto-form-group">
                <label class="crear-producto-label">{{ $t('Model') }}</label>
                <InputText
                  v-model="datoscamposProductos.modelo"
                  maxlength="250"
                  class="crear-producto-input"
                />
              </div>
            </div>
          </div>

          <!-- Precios -->
          <div v-if="!esCelular" class="crear-producto-form-section">
            <h3 class="crear-producto-section-title">
              <i class="pi pi-dollar"></i>
              {{ $t('Prices and Taxes') }}
            </h3>
            <div class="crear-producto-form-grid">
              <div class="crear-producto-form-group">
                <label class="crear-producto-label">{{ $t('Purchase Price') }}</label>
                <InputText
                  v-model="datoscamposProductos.precio_compra"
                  maxlength="250"
                  class="crear-producto-input"
                  v-solonumeros
                  v-focus-in-focus-out
                />
              </div>

              <div class="crear-producto-form-group">
                <label class="crear-producto-label">{{ $t('Taxes (%)') }}</label>
                <InputText
                  v-model="datoscamposProductos.impuestos"
                  maxlength="250"
                  class="crear-producto-input"
                  v-solonumeros
                  v-focus-in-focus-out
                />
              </div>

              <div v-if="false" class="crear-producto-form-group">
                <label class="crear-producto-label">{{ $t('Tax Type') }}</label>
                <OptionButtonTM
                  v-model="addImpuestos"
                  @change="verificaImpuestos"
                  :options="optionsImpuestos"
                />
              </div>

              <div class="crear-producto-form-group">
                <label class="crear-producto-label">{{ $t('Profit (%)') }}</label>
                <InputText
                  v-model="datoscamposProductos.ganancia"
                  maxlength="250"
                  class="crear-producto-input"
                  v-solonumeros
                  v-focus-in-focus-out
                />
              </div>

              <div class="crear-producto-form-group">
                <label class="crear-producto-label">{{ $t('Sale Price') }}</label>
                <div class="p-inputgroup">
                  <InputText
                    v-model="datoscamposProductos.precio_venta"
                    maxlength="250"
                    class="crear-producto-input"
                    v-solonumeros
                    v-focus-in-focus-out
                  />
                  <Button icon="pi pi-clone" @click="fnclonarPrecio" />
                </div>
              </div>

              <div class="crear-producto-form-group">
                <label class="crear-producto-label">{{ $t('Min. Price') }}</label>
                <InputText
                  v-model="datoscamposProductos.precio_min"
                  maxlength="250"
                  class="crear-producto-input"
                  v-solonumeros
                  v-focus-in-focus-out
                />
              </div>

              <div class="crear-producto-form-group">
                <label class="crear-producto-label">{{ $t('Wholesale Price') }}</label>
                <InputText
                  v-model="datoscamposProductos.precio_xmayor"
                  maxlength="250"
                  class="crear-producto-input"
                  v-solonumeros
                  v-focus-in-focus-out
                />
              </div>

              <div v-if="false" class="crear-producto-form-group">
                <label class="crear-producto-label">{{ $t('Offer Price') }}</label>
                <InputText
                  v-model="datoscamposProductos.oferta"
                  maxlength="250"
                  class="crear-producto-input"
                  v-solonumeros
                  v-focus-in-focus-out
                />
              </div>

              <div v-if="false" class="crear-producto-form-group">
                <label class="crear-producto-label">{{ $t('Sales Tax') }}</label>
                <InputText
                  v-model="datoscamposProductos.impuesto_venta"
                  maxlength="250"
                  class="crear-producto-input"
                  v-solonumeros
                  v-focus-in-focus-out
                  readonly
                />
              </div>

              <div v-if="false" class="crear-producto-form-group">
                <label class="crear-producto-label">{{ $t('Final Price') }}</label>
                <InputText
                  v-model="datoscamposProductos.precio_final"
                  maxlength="250"
                  class="crear-producto-input"
                  v-solonumeros
                  v-focus-in-focus-out
                  readonly
                />
              </div>
            </div>
          </div>

          <!-- Stock -->
          <div v-if="!esCelular" class="crear-producto-form-section">
            <h3 class="crear-producto-section-title">
              <i class="pi pi-box"></i>
              {{ $t('Inventory') }}
            </h3>
            <div class="crear-producto-form-grid">
              <div class="crear-producto-form-group">
                <label class="crear-producto-label">{{ $t('Stock') }}</label>
                <InputText
                  v-model="datoscamposProductos.stock"
                  maxlength="250"
                  :readonly="isReadonly"
                  class="crear-producto-input"
                  v-solonumeros
                  v-focus-in-focus-out
                />
              </div>

              <div class="crear-producto-form-group">
                <label class="crear-producto-label">{{ $t('Alert') }}</label>
                <InputText
                  v-model="datoscamposProductos.alerta"
                  maxlength="250"
                  class="crear-producto-input"
                  v-solonumeros
                  v-focus-in-focus-out
                />
              </div>

              <div class="crear-producto-form-group">
                <label class="crear-producto-label">{{ $t('Package') }}</label>
                <Dropdown
                  v-model="datoscamposProductos.empaque"
                  :options="empaques"
                  optionLabel="nombre"
                  editable
                  class="crear-producto-input"
                />
              </div>

              <div class="crear-producto-form-group">
                <label class="crear-producto-label">{{ $t('Warehouse') }}</label>
                <Dropdown
                  v-model="datoscamposProductos.almacen"
                  :options="empresas"
                  class="crear-producto-input"
                />
              </div>

              <div class="crear-producto-form-group">
                <label class="crear-producto-label">{{ $t('Installation') }}</label>
                <InputNumber
                  v-model="datoscamposProductos.instalacion"
                  maxlength="250"
                  class="crear-producto-input"
                />
              </div>

              <div class="crear-producto-form-group">
                <label class="crear-producto-label">{{ $t('Commission') }}</label>
                <InputNumber
                  v-model="datoscamposProductos.comision"
                  maxlength="250"
                  class="crear-producto-input"
                />
              </div>

              <div class="crear-producto-form-group">
                <label class="crear-producto-label">{{ $t('Expiration') }}</label>
                <Calendar
                  v-model="datoscamposProductos.vencimiento"
                  dateFormat="dd/mm/yy"
                  showIcon
                  class="crear-producto-input"
                />
              </div>

              <div class="crear-producto-form-group">
                <label class="crear-producto-label">{{ $t('Condition') }}</label>
                <Dropdown
                  v-model="datoscamposProductos.condicion"
                  :options="['NUEVO', 'USADO']"
                  class="crear-producto-input"
                />
              </div>

              <div class="crear-producto-form-group">
                <label class="crear-producto-label">{{ $t('Situation') }}</label>
                <Dropdown
                  v-model="datoscamposProductos.situacion"
                  :options="['PROPIO', 'CONSIGNADO']"
                  class="crear-producto-input"
                />
              </div>

              <div class="crear-producto-form-group">
                <label class="crear-producto-label">{{ $t('Warranty (Days)') }}</label>
                <InputNumber
                  v-model="datoscamposProductos.t_garantia"
                  class="crear-producto-input"
                />
              </div>

              <div class="crear-producto-form-group crear-producto-form-group-full">
                <label class="crear-producto-label">{{ $t('Location') }}</label>
                <InputText
                  v-model="datoscamposProductos.ubicacion"
                  maxlength="250"
                  class="crear-producto-input"
                />
              </div>
            </div>
          </div>

          <!-- SECCIÃ“N IMEI/SERIAL PARA CELULARES/ELECTRODOMESTICOS -->
          <div v-if="tieneSeriales" class="crear-producto-form-section">
            <div class="imei-section">
              <div v-if="imeiInsertLoading" class="imei-loading">
                <ProgressSpinner style="width: 50px; height: 50px" strokeWidth="4" />
                <div class="imei-loading-text">Registrando {{ labelSerial }}s...</div>
              </div>
              <div class="imei-header">
                <div class="imei-title">
                  <i class="pi pi-mobile"></i>
                  <span>Gestión de {{ labelSerial }}s</span>
                  <Tag :value="`${imeisList.length} ${labelSerial}(s)`" severity="info" />
                </div>
                <Button
                  v-if="imeisList.length > 0"
                  label="Aplicar precios a todos"
                  icon="pi pi-sync"
                  severity="secondary"
                  size="small"
                  :disabled="imeiInsertLoading"
                  @click="aplicarPreciosATodos"
                />
              </div>

              <!-- Input para agregar IMEI -->
              <div class="imei-input-container">
                <div class="imei-input-wrapper">
                  <InputText
                    ref="imeiInputRef"
                    v-model="imeiInput"
                    :placeholder="`Ingrese el ${labelSerial}${esCelular ? ' (15 dígitos)' : ''}`"
                    class="imei-input"
                    maxlength="15"
                    :disabled="imeiInsertLoading"
                    @keydown.enter.prevent="agregarImei"
                  />
                  <Button
                    :label="`Agregar ${labelSerial}`"
                    icon="pi pi-plus"
                    severity="info"
                    :disabled="imeiInsertLoading"
                    @click="agregarImei"
                  />
                </div>
              </div>

              <!-- Lista de IMEIs -->
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
                  <Column field="imei" :header="labelSerial" style="min-width: 180px">
                    <template #body="slotProps">
                      <div class="imei-cell">
                        <i class="pi pi-mobile"></i>
                        <code>{{ slotProps.data.imei }}</code>
                      </div>
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
                        @input="marcarPrecioModificado(slotProps.data)"
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
                        @input="marcarPrecioModificado(slotProps.data)"
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
                        @input="marcarPrecioModificado(slotProps.data)"
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
                        @input="marcarPrecioModificado(slotProps.data)"
                      />
                    </template>
                  </Column>
                  <Column header="Batería %" style="width: 110px">
                    <template #body="slotProps">
                      <InputNumber
                        v-model="slotProps.data.bateria"
                        :min="0"
                        :max="100"
                        suffix="%"
                        :inputStyle="{ width: '70px' }"
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
                  <Column header="Proveedor" style="min-width: 180px">
                    <template #body="slotProps">
                      <Dropdown
                        :modelValue="slotProps.data.proveedor"
                        :options="proveedores"
                        optionLabel="nombre"
                        optionValue="nombre"
                        placeholder="Seleccionar..."
                        class="w-full"
                        filter
                        @change="slotProps.data.proveedor = $event.value"
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

              <!-- Mensaje cuando no hay IMEIs -->
              <div v-else class="no-imeis">
                <i class="pi pi-mobile"></i>
                <p>No hay {{ labelSerial }}s agregados. Escanee o escriba el {{ labelSerial }} para agregarlo.</p>
              </div>
            </div>
          </div>

          <!-- Características -->
          <div class="crear-producto-form-section">
            <h3 class="crear-producto-section-title">
              <i class="pi pi-list"></i>
              {{ $t('Features') }}
            </h3>
            <Button
              :label="$t('Add Feature')"
              icon="pi pi-plus"
              class="mb-3"
              @click="abrirModalAgregarCaracteristica"
            />
            <div v-html="generarTablaFromStringJSON(
              datoscamposProductos.caracteristicas,
              true, false, null, null, 'productos', null, null, false, null, null
            )" class="crear-producto-table">
            </div>
          </div>

          <!-- Imágenes -->
          <div class="crear-producto-form-section">
            <h3 class="crear-producto-section-title">
              <i class="pi pi-images"></i>
              {{ $t('Images') }}
            </h3>
            <FileUpload
              :customUpload="true"
              :auto="false"
              :showUploadButton="false"
              :chooseLabel="$t('Select Images')"
              @select="handleUpload"
              :multiple="true"
              accept="image/*"
              class="crear-producto-file-upload"
            />
          </div>

          <!-- Submit Button -->
          <div class="crear-producto-submit-container">
            <Button
              type="submit"
              :label="$t('Create Product')"
              icon="pi pi-check"
              size="large"
              class="crear-producto-submit-btn"
            />
          </div>

        </form>
      </template>
    </Card>

  </div>

<!-- Modals (unchanged) -->
<Dialog v-model:visible="visibleAgregarCategoria" modal :header="$t('Add Category')" :style="{ width: '30rem' }">
  <div class="p-4">
    <label class="block mb-2 font-semibold">{{ $t('Category') }}</label>
    <InputText v-model="agregarCategoria" v-mayuscula class="w-full" />
  </div>
  <template #footer>
    <Button :label="$t('Add')" icon="pi pi-check" @click="fnAgregarCategoria" />
    <Button :label="$t('Cancel')" icon="pi pi-times" severity="danger" @click="visibleAgregarCategoria = false" />
  </template>
</Dialog>

<Dialog v-model:visible="visibleAgregarMarca" modal :header="$t('Add Brand')" :style="{ width: '30rem' }">
  <div class="p-4">
    <label class="block mb-2 font-semibold">{{ $t('Brand') }}</label>
    <InputText v-model="agregarMarca" v-mayuscula class="w-full" />
  </div>
  <template #footer>
    <Button :label="$t('Add')" icon="pi pi-check" @click="fnAgregarMarca" />
    <Button :label="$t('Cancel')" icon="pi pi-times" severity="danger" @click="visibleAgregarMarca = false" />
  </template>
</Dialog>

<Dialog v-model:visible="visibleProveedor" modal :header="$t('Add Supplier')" :style="{ width: '40rem' }">
  <div class="grid grid-cols-12 gap-4 p-4">
    <div class="col-span-12">
      <label class="block mb-2 font-semibold">{{ $t('Name') }}</label>
      <InputText v-model="proveedor.nombre" v-mayuscula class="w-full" />
    </div>
    <div class="col-span-12">
      <label class="block mb-2 font-semibold">{{ $t('RNC') }}</label>
      <div class="p-inputgroup">
        <InputText v-model="proveedor.rnc" class="w-full" />
        <Button :label="$t('Search')" @click="buscarRNC" />
      </div>
    </div>
    <div class="col-span-6">
      <label class="block mb-2 font-semibold">{{ $t('Phone') }}</label>
      <InputMask v-model="proveedor.telefono" :mask="patronTelefono" class="w-full" />
    </div>
    <div class="col-span-6">
      <label class="block mb-2 font-semibold">{{ $t('Email') }}</label>
      <InputText v-model="proveedor.email" class="w-full" />
    </div>
    <div class="col-span-6">
      <label class="block mb-2 font-semibold">{{ $t('Manager') }}</label>
      <InputText v-model="proveedor.encargado" v-mayuscula class="w-full" />
    </div>
    <div class="col-span-6">
      <label class="block mb-2 font-semibold">{{ $t('Bank Account') }}</label>
      <InputText v-model="proveedor.cuenta_bancaria" class="w-full" />
    </div>
    <div class="col-span-12">
      <label class="block mb-2 font-semibold">{{ $t('Address') }}</label>
      <Textarea v-model="proveedor.direccion" rows="3" class="w-full" />
    </div>
  </div>
  <template #footer>
    <Button :label="$t('Add')" icon="pi pi-check" @click="fnAgregarProveedor" />
    <Button :label="$t('Cancel')" icon="pi pi-times" severity="danger" @click="visibleProveedor = false" />
  </template>
</Dialog>

<Toast />
</main>
</template>

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
.crear-producto-wrapper {
  min-height: 100vh;
  background: linear-gradient(135deg, #fff5f0 0%, #ffe8d9 100%);
  padding: 2rem;
}

.crear-producto-container {
  max-width: 1400px;
  margin: 0 auto;
  animation: slideIn 0.5s ease-out;
}

/* Header */
.crear-producto-header {
  background: linear-gradient(135deg, #ff6b35 0%, #f7931e 50%, #ffb347 100%);
  border-radius: 20px;
  padding: 2rem;
  margin-bottom: 2rem;
  box-shadow: 0 8px 32px rgba(255, 107, 53, 0.3);
}

.crear-producto-header-content {
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.crear-producto-icon-wrapper {
  width: 80px;
  height: 80px;
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.crear-producto-icon {
  font-size: 2.5rem;
  color: white;
}

.crear-producto-title {
  font-size: 2rem;
  font-weight: 700;
  color: white;
  margin: 0;
}

.crear-producto-subtitle {
  font-size: 1rem;
  color: rgba(255, 255, 255, 0.9);
  margin: 0.25rem 0 0 0;
}

/* Actions Card */
.crear-producto-actions-card {
  margin-bottom: 2rem;
  border-radius: 16px;
  border: 2px solid #ffedd5;
  box-shadow: 0 4px 16px rgba(255, 107, 53, 0.1);
}

.crear-producto-actions-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
}

/* Section Divider */
.crear-producto-section-divider {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin: 2rem 0;
}

.crear-producto-divider-line {
  flex: 1;
  height: 2px;
  background: linear-gradient(90deg, transparent, #ff8c42, transparent);
}

.crear-producto-divider-content {
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
}

/* Form Card */
.crear-producto-form-card {
  border-radius: 16px;
  border: 2px solid #ffedd5;
  box-shadow: 0 4px 16px rgba(255, 107, 53, 0.1);
}

.crear-producto-form {
  padding: 1rem;
}

.crear-producto-form-section {
  margin-bottom: 2rem;
  padding: 1.5rem;
  background: rgba(255, 237, 213, 0.3);
  border-radius: 12px;
  border: 1px solid #ffedd5;
}

.crear-producto-section-title {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 1.25rem;
  font-weight: 700;
  color: #ff6b35;
  margin: 0 0 1.5rem 0;
}

.crear-producto-form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
}

.crear-producto-form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.crear-producto-form-group-wide {
  grid-column: span 2;
}

.crear-producto-form-group-full {
  grid-column: 1 / -1;
}

.crear-producto-label {
  font-weight: 600;
  color: #64748b;
  font-size: 0.875rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.crear-producto-input {
  border: 2px solid #ffedd5;
  border-radius: 10px;
  transition: all 0.3s ease;
}

.crear-producto-input:focus {
  border-color: #ff8c42;
  box-shadow: 0 0 0 3px rgba(255, 140, 66, 0.1);
}

.crear-producto-textarea {
  border: 2px solid #ffedd5;
  border-radius: 10px;
  transition: all 0.3s ease;
}

.crear-producto-textarea:focus {
  border-color: #ff8c42;
  box-shadow: 0 0 0 3px rgba(255, 140, 66, 0.1);
}

.crear-producto-submit-container {
  margin-top: 2rem;
  display: flex;
  justify-content: center;
}

.crear-producto-submit-btn {
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

.crear-producto-submit-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 32px rgba(255, 107, 53, 0.4);
}

.crear-producto-table {
  border-radius: 12px;
  overflow: hidden;
}

.crear-producto-file-upload {
  width: 100%;
}

/* Responsive */
@media (max-width: 768px) {
  .crear-producto-wrapper {
    padding: 1rem;
  }

  .crear-producto-form-grid {
    grid-template-columns: 1fr;
  }

  .crear-producto-form-group-wide {
    grid-column: span 1;
  }

  .crear-producto-submit-btn {
    width: 100%;
  }
}

/* IMEI Section Styles */
.imei-section {
  background: white;
  border: 2px solid #e0e7ff;
  border-radius: 12px;
  padding: 1.5rem;
  position: relative;
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

.imei-loading {
  position: absolute;
  inset: 0;
  background: rgba(240, 249, 255, 0.85);
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  z-index: 2;
}

.imei-loading-text {
  font-weight: 600;
  color: #3730a3;
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
