<script setup>
import { ref, onMounted, nextTick, watchEffect,computed } from 'vue';
import axios from 'axios';
import { enviarDatosPorPost, eliminarDatos, obtenerIdsSeleccionados, borrarTodoslosDatos, lenguajeDataTable, nfecha, arrayToObjetoFromTabla,generarTablaFromStringJSON, peticionesFetch, encryptarPassword, envioElectron, mensajetoast,formatearFecha,transformarFechaTimestamp, 
crearTablaSiNoExiste, 
peticiones, 
crearTablaSiNoExisteOffline,
  peticionesFetchOffline,
  buscadorArrayObjeto,
lasMayusculas } from '@/funciones/funciones.js';
import Swal from 'sweetalert2'
import { useRouter,useRoute } from 'vue-router';
const router = useRouter();
import { useToast } from "primevue/usetoast";
const toast = useToast();
import Awesomplete from '@/components/Awesomplete.vue';
import LoadingOverlay from '@/Loading/LoadingOverlay.vue';
import * as XLSX from 'xlsx';
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
const camposArray = ["serial, estado, fecha, equipo, proveedor, id_equi,precio_compra,precio_venta,precio_min,precio_xmayor,ganancia,no_compra,no_factura,fecha_venta, hora_venta, comprador, detalles, usuario","almacen","marca","modelo","vendedor","cedula","telefono","direccion","nota"];
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
const datoscamposElectrodomestico = ref({})
const listaBuscador = ref([])
const productosArray = ref([])
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
/************************************************************************/
const selectedElectrodomestico = ref([]);
/************************************************************************/
const estadoFiltro = ref('DISPONIBLE')
/************************************************************************/
async function limpiarCamposCrear() {
datoscamposElectrodomestico.value = {}
await campos();
}
/************************************************************************/
const saberSiesJSON = ref(false)
/************************************************************************/
/************************************************************************/
watchEffect(() => {
  if (visiblecrear.value) {
    lasMayusculas();
    datoscamposElectrodomestico.value.fecha = nfecha('fecha')
    datoscamposElectrodomestico.value.estado = datoscamposElectrodomestico.value.estado || 'DISPONIBLE'

    datoscamposElectrodomestico.value.detalles = datoscamposElectrodomestico.value.detalles || `ALMACENAMIENTO: 
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
const response = await peticionesFetchOffline('getDataByCondition', 'electrodomesticos','almacen',datosEmpresa.empresa.nombre);

    const jsonData = response.reverse();
    data.value = jsonData;
};
/************************************************************************/
const abrirModalEdicion = (registro) => {
  saberSiesJSON.value = isValidJSON(registro?.detalles);
  datoscampos.value = { ...registro };
  visible.value = true;
};
/************************************************************************/
const obtenerValorSeleccionado = (selected) => {
  if (typeof selected === 'string') return selected;
  if (selected?.value) return selected.value;
  if (selected?.label) return selected.label;
  if (selected?.text?.value) return selected.text.value;
  return '';
};
/************************************************************************/
const sincronizarProductoSeleccionado = (valorSeleccionado) => {
  const valorNormalizado = String(valorSeleccionado || '').trim();
  if (!valorNormalizado) return false;

  const producto = productosArray.value.find(
    (prod) => String(prod.id) === valorNormalizado || prod.nombre === valorNormalizado
  );

  if (!producto) return false;

  datoscamposElectrodomestico.value.equipo = producto.nombre;
  datoscampos.value.equipo = producto.nombre;
  datoscamposElectrodomestico.value.proveedor = producto.proveedor;
  datoscampos.value.proveedor = producto.proveedor;
  datoscamposElectrodomestico.value.id_equi = producto.id;
  datoscampos.value.id_equi = producto.id;

  return true;
};
/************************************************************************/
async function campos() {
  const campos = await arrayToObjetoFromTabla(link.value+api.value, tokenCifrado.value, 'electrodomesticos', true,camposArray,'usuario');
  datoscamposElectrodomestico.value = campos;
}
/************************************************************************/
const arrayProductos = async()=>{
  const response = await peticionesFetchOffline('getDataArrayByCondition','productos','categoria','ELECTRODOMESTICOS');
  const productos = Array.isArray(response) ? response : [];
  productosArray.value = productos;
  listaBuscador.value = productos.map(producto=>producto.nombre);
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
await crearTablaSiNoExisteOffline('electrodomesticos',camposArray.join(','),toast)
usuarioLocal.value = datosEmpresa.usuario;
await campos();
await fetchAndSetupData();
await fetchDataBarcode();
await arrayProductos();
loading.value = false
});
/************************************************************************/
  async function borrarTodo() {
    Swal.fire({
        title: "¿Estás seguro?",
        text: "¡Se borrarán los datos!",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Sí, de acuerdo",
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
                    const envioDatos = await peticionesFetchOffline('deleteAll', 'electrodomesticos');
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
  const url = link.value+api.value+"/actualizarcampos/imei";
  if (!datoscampos.value) {
    console.error("Datos incompletos, no se puede actualizar.");
    return;
  }

  sincronizarProductoSeleccionado(datoscampos.value.id_equi || datoscampos.value.equipo);
  datoscampos.value.ganancia =
    (parseFloat(datoscampos.value.precio_venta) || 0) -
    (parseFloat(datoscampos.value.precio_compra) || 0);

  if (datoscampos.value.hasOwnProperty('created_at')) {
    datoscampos.value.updated_at = nfecha('timestamp');
  }
  const envioDatos = await peticionesFetchOffline('updateData','electrodomesticos',JSON.stringify(datoscampos.value));
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
  if (datoscamposElectrodomestico.value.hasOwnProperty('created_at')) {
    datoscamposElectrodomestico.value.created_at = nfecha('timestamp');
    datoscamposElectrodomestico.value.updated_at = nfecha('timestamp');
  }
   datoscamposElectrodomestico.value.almacen = datosEmpresa.empresa.nombre;
  const envioDatos = await peticionesFetchOffline('insertData','electrodomesticos',JSON.stringify(datoscamposElectrodomestico.value));
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
async function borrarSeleccionados() {
  const ids = obtenerIdsSeleccionados(selectedElectrodomestico.value);
    Swal.fire({
        title: "¿Estas Seguro?",
        text: "Se Borraran los Datos!",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Sí, de acuerdo!",
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
                    if (ids.length > 0) {
                        for (const id of ids) {
                            try {
                                const envioDatos = await peticionesFetchOffline('deleteEntry','electrodomesticos', id);
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



  const disponiblesSerial = data.value.filter(datos=>datos.estado === 'DISPONIBLE')
 


 /* // Calcular nuevo stock basado en la operación
  if (operacion === 'sumar') {
  } else {
    datosProducto.stock = Math.max(0, cantidadProductosArray.length - 1); // Asegurarse de que el stock no sea negativo
  }*/

    datosProducto.stock = disponiblesSerial.length;
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
const datosElectrodomestico = ref({})
/******************************************************/
const fnagregarElectrodomestico = async()=>{
  //event.stopImmediatePropagation()
  const imeiArrayLocalStorage = JSON.parse(window.localStorage.getItem('arraySerial')) || [];
 let productosVenta = ref(JSON.parse(window.localStorage.getItem('productosVenta')) || []);

 const verifica = imeiArrayLocalStorage.find(equipo=>equipo.serial == datosElectrodomestico.value.serial)
 if (verifica) {
  toast.add({ severity: 'error', summary: 'Upps', detail: `Equipo ${datosElectrodomestico.value.equipo} Encontrado en la Lista, No se puede agregar 2 veces`, life: 3000 });
  return
 }


 const datosEquipo = await peticionesFetchOffline('getDataByField', 'productos','id',datosElectrodomestico.value.id_equi);
 //const datosEquipo = productosArray.value.find(prod=>prod.id == datosElectrodomestico.value.id_equi)
 if (datosEquipo) {
  toast.add({ severity: 'success', summary: 'Encontrado', detail: `Equipo ${datosEquipo.nombre} agregado`, life: 3000 });
      imeiArrayLocalStorage.push({imei:datosElectrodomestico.value.serial,id_equi:datosElectrodomestico.value.id_equi});

    const productoExistente = productosVenta.value.find(prod => prod.codigo === datosEquipo.codigo);
    if (productoExistente) {

      if (!datosEquipo.lista_imei) {
       const imeiLista = stringParentesis(productoExistente.nombre);
       productoExistente.lista_imei = imeiLista;
      }
       const listaImei = productoExistente.lista_imei.split(',')
       listaImei.push(datosElectrodomestico.value.serial)

      datosEquipo.nombre = datosEquipo.nombre + ` (${listaImei.join(',')})`
      datosEquipo.lista_imei = listaImei.join(',')

      productoExistente.nombre = datosEquipo.nombre
      productoExistente.lista_imei = datosEquipo.lista_imei
      productoExistente.cantidad += 1;
    } else {
      datosEquipo.cantidad = 1
      datosEquipo.descuento = 0.00
      datosEquipo.nombre = datosEquipo.nombre + ` (${datosElectrodomestico.value.serial})`
      datosEquipo.lista_imei = datosElectrodomestico.value.serial

      productosVenta.value.push(datosEquipo);
    }
    window.localStorage.setItem('productosVenta',JSON.stringify(productosVenta.value))
    window.localStorage.setItem('arraySerial',JSON.stringify(imeiArrayLocalStorage))
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
const itemsElectrodomestico = ref([]);
const menu = ref(null);
const currentRowData = ref(null);


const toggleElectrodomestico = async (event, rowData) => {
  currentRowData.value = rowData;
  itemsElectrodomestico.value = [
    { label: 'Editar', icon: 'pi pi-pencil', command: () => { 
        abrirModalEdicion(currentRowData.value);

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

        const envioDatos = await peticionesFetchOffline('updateData','electrodomesticos',JSON.stringify(rowData));
        if (envioDatos[0] == 'ok') {
          toast.add({ severity: 'success', summary: 'Éxito', detail: 'Estado Cambiado', life: 3000 });
        } else {
          toast.add({ severity: 'error', summary: 'Error', detail: 'Error al Cambiar el Estado', life: 3000 });
        }
      } 
    },
    { label: 'Barcode', icon: 'pi pi-qrcode', command: async () => {
    codigoBarcode.value = currentRowData.value.serial
    textoBarcode.value = currentRowData.value.equipo
    precioBarcode.value = parseFloat(currentRowData.value.precio_venta || 0).toFixed(2)
    datosBarcode.value.barcodetype = 'CODE128'
    qr.value = false
    visibleBarcodeConfig.value = true
      }
    },
    { label: 'QR', icon: 'pi pi-qrcode', command: async () => { 
//https://demo.tmposrd.com/vista/imprimirdatosproducto?id=36
    codigoBarcode.value = `https://demo.tmposrd.com/vista/imprimirdatosproducto?id=${currentRowData.value.id_equi}`
    textoBarcode.value = currentRowData.value.equipo
    //precio_ventaProd.value = currentRowData.value.precio_venta
    datosBarcode.value.barcodetype = 'QR'
    qr.value = true
    await printBarcode()



      } 
    },
    { label: 'Vender', icon: 'pi pi-pencil', command: async() => { 
        datosElectrodomestico.value = currentRowData.value;
        if (currentRowData.value.estado === 'DISPONIBLE') {
           await fnagregarElectrodomestico();
        }else{
          toast.add({ severity: 'error', summary: 'Error', detail: 'No esta Disponible', life: 3000 });
        }

      } 
    },

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
              const datosFactura = await peticionesFetchOffline('deleteEntry','electrodomesticos', rowData.id);
              if (datosFactura[0] == 'ok') {
                toast.add({ severity: 'success', summary: 'Éxito', detail: 'Datos eliminados correctamente', life: 3000 });
                await fetchAndSetupData();
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
  menu.value.toggle(event);
};

/************************************************************************/
const filteredElectrodomestico = computed(() => {
    let datosFiltrados = [...data.value]; // Clonar los datos originales para evitar mutaciones directas

    // Filtrar por estado si está definido
    if (estadoFiltro.value) {
        datosFiltrados = datosFiltrados.filter(item => item.estado === estadoFiltro.value);
    }

    // Filtrar por búsqueda de texto si hay un término ingresado
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
    const ids = obtenerIdsSeleccionados(selectedElectrodomestico.value);
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

     const envioDatos = await peticionesFetchOffline('updateData','electrodomesticos',JSON.stringify(rowData));
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
        default:
            return 'secondary'; // Gris por defecto
    }
};
/************************************************************************/
const metaKey = ref(true);
/************************************************************************/
const fnAwesomplete = (selected)=>{
  sincronizarProductoSeleccionado(obtenerValorSeleccionado(selected));
}
const handleSelectComplete = async(selected)=>{
     sincronizarProductoSeleccionado(obtenerValorSeleccionado(selected));
}
/************************************************************************/
const onRowSelect = (event) => {
        abrirModalEdicion(event.data);
};
/************************************************************************/
const fnVerFactura = async()=>{
    if (datoscampos.value.factura !='') {
        const response = await peticionesFetchOffline('getDataByField', 'facturas','no_factura',datoscampos.value.factura);

        router.push({ path: `/editarfacturas/${response.id}` });
    }else{
       toast.add({ severity: 'error', summary: 'Error', detail: 'No hay Factura Asignada', life: 3000 }); 
    }
}
/************************************************************************/
const fnVerCompra = async()=>{
    if (datoscampos.value.no_compra !='') {

        const response = await peticionesFetchOffline('getDataByField', 'compras','no_factura',datoscampos.value.no_compra);
          if (response) {
           router.push({ path: `/editarcompras/${response.id}` });
         }else{
            toast.add({ severity: 'error', summary: 'Error', detail: 'No hay Existe la Compra', life: 3000 }); 
         }
    }else{
       toast.add({ severity: 'error', summary: 'Error', detail: 'No hay Factura de Comrpa Asignada', life: 3000 }); 
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

  const envioDatos = await peticionesFetchOffline('updateData','electrodomesticos',JSON.stringify(datoscampos.value));
  if (envioDatos[0] == 'ok') {
    toast.add({ severity: 'success', summary: 'Éxito', detail: 'Datos Actualizados', life: 3000 });
  } else {
    toast.add({ severity: 'error', summary: 'Error', detail: 'Fallo al actualizar los datos.', life: 3000 });
  }

}
/************************************************************************/
const fnSicronizarProductos = async () => {
  const facturasArray = await peticionesFetchOffline('getDataAsArray','facturas');
  const productosArrayN = await peticionesFetchOffline('getDataByCondition','productos','categoria','ELECTRODOMESTICOS');

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

      // Llamada a la función de actualización
      await actualizarN();
    } else {
      console.warn(`Producto no encontrado para el equipo: ${telefono.equipo}`);
    }
  }
};

/************************************************************************/
// Función para exportar datos visibles a Excel
const fnExcel = () => {
  // Convierte los datos de la tabla (filteredElectrodomestico) a un array de objetos
  const datos = filteredElectrodomestico.value.map(item => ({
    Serial: item.serial,
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
  XLSX.utils.book_append_sheet(wb, ws, 'DatosElectrodomesticos');

  // Guarda el archivo
  XLSX.writeFile(wb, 'DatosElectrodomesticos.xlsx');
};
/************************************************************************/
const fnVerProducto = ()=>{
    sincronizarProductoSeleccionado(datoscampos.value.id_equi || datoscampos.value.equipo);
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
  // Aquí puedes agregar cualquier lógica adicional que necesites
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
// Estadísticas de Serial
const estadisticasElectrodomestico = computed(() => {
    const disponibles = data.value.filter(item => item.estado === 'DISPONIBLE').length;
    const vendidos = data.value.filter(item => item.estado === 'VENDIDO').length;
    const total = data.value.length;

    const valorInventario = data.value
        .filter(item => item.estado === 'DISPONIBLE')
        .reduce((sum, item) => sum + (parseFloat(item.costo) || 0), 0);

    const ventasTotales = data.value
        .filter(item => item.estado === 'VENDIDO')
        .reduce((sum, item) => sum + (parseFloat(item.precio_venta) || 0), 0);

    return {
        disponibles,
        vendidos,
        total,
        valorInventario,
        ventasTotales
    };
});

const formatCurrencyElectrodomestico = (value) => {
    if (value) {
        return value.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
    }
    return '$0.00';
};
/************************************************************************/

</script>
<template>
<main class="content-wrapper electrodomestico-wrapper">
  <div class="w-full px-4 mt-5">
    <LoadingOverlay :loading="loading" />

    <!-- Header Profesional -->
    <div class="electrodomestico-header mb-5">
      <div class="electrodomestico-header-content">
        <div class="electrodomestico-icon-wrapper">
          <i class="pi pi-box electrodomestico-icon"></i>
        </div>
        <div>
          <h1 class="electrodomestico-title">Control de Electrodomésticos</h1>
          <p class="electrodomestico-subtitle">Gestión de inventario de electrodomésticos</p>
        </div>
      </div>
    </div>

    <!-- Tarjetas de Estadísticas -->
    <div class="grid grid-cols-12 gap-4 mb-5">
      <div class="col-span-12 md:col-span-6 lg:col-span-3">
        <Card class="summary-card disponibles-card">
          <template #content>
            <div class="flex items-center justify-between">
              <div>
                <p class="summary-label">DISPONIBLES</p>
                <p class="summary-value">{{ estadisticasElectrodomestico.disponibles }}</p>
                <p class="summary-count">en inventario</p>
              </div>
              <div class="summary-icon-wrapper disponibles">
                <i class="pi pi-check-circle text-3xl"></i>
              </div>
            </div>
          </template>
        </Card>
      </div>

      <div class="col-span-12 md:col-span-6 lg:col-span-3">
        <Card class="summary-card vendidos-card">
          <template #content>
            <div class="flex items-center justify-between">
              <div>
                <p class="summary-label">VENDIDOS</p>
                <p class="summary-value">{{ estadisticasElectrodomestico.vendidos }}</p>
                <p class="summary-count">dispositivos</p>
              </div>
              <div class="summary-icon-wrapper vendidos">
                <i class="pi pi-shopping-cart text-3xl"></i>
              </div>
            </div>
          </template>
        </Card>
      </div>

      <div class="col-span-12 md:col-span-6 lg:col-span-3">
        <Card class="summary-card inventario-card">
          <template #content>
            <div class="flex items-center justify-between">
              <div>
                <p class="summary-label">VALOR INVENTARIO</p>
                <p class="summary-value-currency">{{ formatCurrencyElectrodomestico(estadisticasElectrodomestico.valorInventario) }}</p>
                <p class="summary-count">en stock</p>
              </div>
              <div class="summary-icon-wrapper inventario">
                <i class="pi pi-dollar text-3xl"></i>
              </div>
            </div>
          </template>
        </Card>
      </div>

      <div class="col-span-12 md:col-span-6 lg:col-span-3">
        <Card class="summary-card total-card">
          <template #content>
            <div class="flex items-center justify-between">
              <div>
                <p class="summary-label">TOTAL REGISTROS</p>
                <p class="summary-value">{{ estadisticasElectrodomestico.total }}</p>
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

    <!-- Tabla de Serial -->
    <Card class="electrodomestico-table-card shadow-lg">
      <template #content>
        <!-- Toolbar -->
        <div class="electrodomestico-toolbar">
          <div class="flex flex-wrap gap-2">
            <Button icon="pi pi-refresh" severity="secondary" text rounded @click="fetchAndSetupData" v-tooltip="'Recargar datos'" />
            <Button label="Nuevo Serial" icon="pi pi-plus" severity="success" @click="visiblecrear = true" />
            <Button icon="pi pi-trash" severity="danger" outlined @click="borrarSeleccionados" :disabled="!selectedElectrodomestico || !selectedElectrodomestico.length" v-tooltip="'Borrar seleccionados'" />
            <Button icon="pi pi-file-excel" severity="success" outlined @click="fnExcel" v-tooltip="'Exportar Excel'" />
            <Button icon="pi pi-sync" severity="info" outlined @click="fnSicronizarProductos" v-tooltip="'Sincronizar productos'" />
            <Button label="Estado" icon="pi pi-check" severity="success" outlined @click="fnDisponibles" />
            <Button v-if="usuarioLocal.usuario =='Soporte'" label="Borrar Todo" icon="pi pi-trash" severity="danger" text @click="borrarTodo" />
          </div>
        </div>

        <Divider />

        <!-- Filtros y búsqueda -->
        <div class="electrodomestico-filters">
          <div class="flex flex-wrap gap-3 items-end">
            <div class="flex-1 min-w-[200px]">
              <label class="block text-sm font-medium text-gray-700 mb-2">Estado</label>
              <Select v-model="estadoFiltro" :options="[
                { label: 'Todos los estados', value: '' },
                { label: 'Disponible', value: 'DISPONIBLE' },
                { label: 'Vendido', value: 'VENDIDO' }
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
              <InputText v-model="searchQuery" placeholder="Buscar Serial, equipo, proveedor..." fluid />
            </div>
          </div>
        </div>

        <Divider />

        <!-- DataTable -->
        <DataTable
          :value="filteredElectrodomestico"
          scrollable
          scrollHeight="500px"
          dataKey="id"
          v-model:selection="selectedElectrodomestico"
          paginator
          :rows="10"
          size="small"
          resizableColumns
          columnResizeMode="fit"
          :rowClass="getRowClass"
          @rowSelect="onRowSelect"
          selectionMode="multiple"
          :rowsPerPageOptions="[10, 20, 50]"
          tableStyle="min-width: 50rem"
          stripedRows
          class="electrodomestico-datatable">

          <Column selectionMode="multiple" headerStyle="width: 3rem"></Column>

          <Column header="Acciones" style="width: 5rem; text-align: center">
            <template #body="slotProps">
              <Button icon="pi pi-ellipsis-v" text rounded severity="secondary" @click="toggleElectrodomestico($event, slotProps.data)" aria-haspopup="true" aria-controls="overlay_menu_Electrodomestico" />
              <Menu ref="menu" id="overlay_menu_Electrodomestico" :model="itemsElectrodomestico" :popup="true" />
            </template>
          </Column>

          <Column field="estado" header="Estado" sortable style="width: 10%">
            <template #body="slotProps">
              <Badge :value="slotProps.data.estado" :severity="colorEstado(slotProps.data)" class="font-semibold" />
            </template>
          </Column>

          <Column field="serial" header="Serial" sortable>
            <template #body="slotProps">
              <span class="font-mono font-medium text-gray-800">{{ slotProps.data.serial }}</span>
            </template>
          </Column>

          <Column field="equipo" header="Equipo" sortable>
            <template #body="slotProps">
              <div class="flex items-center gap-2">
                <i class="pi pi-box text-blue-600"></i>
                <span class="font-medium">{{ slotProps.data.equipo }}</span>
              </div>
            </template>
          </Column>

          <Column field="fecha" header="Fecha Ingreso" sortable style="width: 10%"></Column>
          <Column field="proveedor" header="Proveedor" sortable></Column>
          <Column field="no_compra" header="No. Compra" sortable style="width: 10%"></Column>

          <Column field="costo" header="Costo" sortable style="width: 10%; text-align: right">
            <template #body="slotProps">
              <span class="font-mono font-bold text-blue-700">{{ formatCurrencyElectrodomestico(slotProps.data.precio_compra) }}</span>
            </template>
          </Column>

          <Column field="precio_venta" header="Precio Venta" sortable style="width: 10%; text-align: right">
            <template #body="slotProps">
              <span class="font-mono font-bold text-green-700">{{ formatCurrencyElectrodomestico(slotProps.data.precio_venta) }}</span>
            </template>
          </Column>

          <Column field="fecha_venta" header="Fecha Venta" sortable style="width: 10%"></Column>
          <Column field="comprador" header="Comprador" sortable></Column>
          <Column field="usuario" header="Usuario" sortable style="width: 10%"></Column>
        </DataTable>
      </template>
    </Card>
<!-- ////////////////////////////////////////////////////////////////////////////////////////// -->
<!-- Modal Editar Serial -->
<Dialog v-model:visible="visible" modal :style="{ width: '60rem' }" class="electrodomestico-dialog">
  <template #header>
    <div class="flex items-center gap-3">
      <div class="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg">
        <i class="pi pi-pencil text-blue-600 text-2xl"></i>
      </div>
      <div>
        <h3 class="text-xl font-bold text-gray-800 m-0">Editar Electrodoméstico</h3>
        <p class="text-sm text-gray-500 m-0">Actualizar información del electrodoméstico</p>
      </div>
    </div>
  </template>

  <div class="p-4">
    <form id="formularioActualizarImei">
      <div class="grid grid-cols-12 gap-4">
        <div class="col-span-12" hidden>
          <InputText v-model="datoscampos.id" />
        </div>

        <!-- Información Básica -->
        <div class="col-span-12">
          <h4 class="text-sm font-bold text-blue-700 mb-3 flex items-center gap-2">
            <i class="pi pi-info-circle"></i>
            Información Básica
          </h4>
        </div>

        <div class="col-span-12 md:col-span-4">
          <label class="block text-sm font-semibold text-gray-700 mb-2">
            <i class="pi pi-box mr-1 text-blue-600"></i>
            Serial
          </label>
          <InputText v-model="datoscampos.serial" placeholder="Ingrese Serial" fluid />
        </div>

        <div class="col-span-12 md:col-span-3">
          <label class="block text-sm font-semibold text-gray-700 mb-2">
            <i class="pi pi-check-circle mr-1 text-blue-600"></i>
            Estado
          </label>
          <Select v-model="datoscampos.estado" :options="['DISPONIBLE','VENDIDO']" placeholder="Seleccione estado" fluid />
        </div>

        <div class="col-span-12 md:col-span-2">
          <label class="block text-sm font-semibold text-gray-700 mb-2">
            <i class="pi pi-hashtag mr-1 text-blue-600"></i>
            No. Compra
          </label>
          <InputText v-model="datoscampos.no_compra" placeholder="No. Compra" fluid readonly />
        </div>

        <div class="col-span-12 md:col-span-3">
          <label class="block text-sm font-semibold text-gray-700 mb-2">
            <i class="pi pi-calendar mr-1 text-blue-600"></i>
            Fecha
          </label>
          <InputText v-model="datoscampos.fecha" v-datepicker placeholder="DD/MM/AAAA" fluid />
        </div>

        <div class="col-span-12">
          <label class="block text-sm font-semibold text-gray-700 mb-2">
            <i class="pi pi-box mr-1 text-blue-600"></i>
            Equipo
          </label>
          <awesomplete
            class="dropdown-input"
            v-model="datoscampos.equipo"
            @change="fnAwesomplete"
            @selectComplete="handleSelectComplete"
            :list="listaBuscador">
          </awesomplete>
        </div>

        <div class="col-span-12 md:col-span-6">
          <label class="block text-sm font-semibold text-gray-700 mb-2">
            <i class="pi pi-building mr-1 text-blue-600"></i>
            Proveedor
          </label>
          <InputText v-model="datoscampos.proveedor" v-mayuscula placeholder="Proveedor" fluid readonly />
        </div>

        <div class="col-span-12 md:col-span-2">
          <label class="block text-sm font-semibold text-gray-700 mb-2">ID Equipo</label>
          <InputText v-model="datoscampos.id_equi" v-solonumeros v-numeroFocusinOut v-decimales placeholder="ID" fluid readonly />
        </div>

        <div class="col-span-12 md:col-span-2">
          <label class="block text-sm font-semibold text-gray-700 mb-2">
            <i class="pi pi-calendar mr-1 text-blue-600"></i>
            Fecha Venta
          </label>
          <InputText v-model="datoscampos.fecha_venta" v-datepicker placeholder="DD/MM/AAAA" fluid />
        </div>

        <div class="col-span-12 md:col-span-2">
          <label class="block text-sm font-semibold text-gray-700 mb-2">
            <i class="pi pi-clock mr-1 text-blue-600"></i>
            Hora Venta
          </label>
          <InputText v-model="datoscampos.hora_venta" placeholder="HH:MM" fluid />
        </div>

        <!-- Información de Venta -->
        <div class="col-span-12 mt-3">
          <h4 class="text-sm font-bold text-green-700 mb-3 flex items-center gap-2">
            <i class="pi pi-shopping-cart"></i>
            Información de Venta
          </h4>
        </div>

        <div class="col-span-12 md:col-span-6">
          <label class="block text-sm font-semibold text-gray-700 mb-2">
            <i class="pi pi-user mr-1 text-green-600"></i>
            Comprador
          </label>
          <InputText v-model="datoscampos.comprador" v-mayuscula placeholder="Nombre del comprador" fluid />
        </div>

        <div class="col-span-12 md:col-span-2">
          <label class="block text-sm font-semibold text-gray-700 mb-2">
            <i class="pi pi-file mr-1 text-green-600"></i>
            Factura
          </label>
          <InputText v-model="datoscampos.no_factura" v-mayuscula placeholder="No. Factura" fluid readonly />
        </div>

        <div class="col-span-12 md:col-span-2">
          <label class="block text-sm font-semibold text-gray-700 mb-2">
            <i class="pi pi-dollar mr-1 text-green-600"></i>
            Costo
          </label>
          <InputText v-model="datoscampos.precio_compra" v-mayuscula placeholder="Costo" fluid  />
        </div>

        <div class="col-span-12 md:col-span-2">
          <label class="block text-sm font-semibold text-gray-700 mb-2">
            <i class="pi pi-dollar mr-1 text-green-600"></i>
            P. Venta
          </label>
          <InputText v-model="datoscampos.precio_venta" v-mayuscula placeholder="Precio" fluid  />
        </div>

        <div class="col-span-12 md:col-span-2">
          <label class="block text-sm font-semibold text-gray-700 mb-2">
            <i class="pi pi-dollar mr-1 text-green-600"></i>
            P. Minimo
          </label>
          <InputText v-model="datoscampos.precio_min" v-mayuscula placeholder="Precio" fluid  />
        </div>


        <div class="col-span-12 md:col-span-2">
          <label class="block text-sm font-semibold text-gray-700 mb-2">
            <i class="pi pi-dollar mr-1 text-green-600"></i>
            P. X Mayor
          </label>
          <InputText v-model="datoscampos.precio_xmayor" v-mayuscula placeholder="Precio" fluid  />
        </div>

        <div class="col-span-12 md:col-span-2">
          <label class="block text-sm font-semibold text-gray-700 mb-2">
            <i class="pi pi-dollar mr-1 text-green-600"></i>
            Ganancia
          </label>
          <InputText v-model="datoscampos.ganancia" v-mayuscula placeholder="Ganancia" fluid readonly />
        </div>

        <!-- Detalles -->
        <div class="col-span-12 mt-3">
          <h4 class="text-sm font-bold text-purple-700 mb-3 flex items-center gap-2">
            <i class="pi pi-list"></i>
            Detalles del Dispositivo
          </h4>
        </div>

        <div class="col-span-12">
          <div v-if="saberSiesJSON" class="flex flex-wrap justify-center gap-2">
            <Tag
              v-for="(item, index) in parsedDetails"
              :key="index"
              :value="`${item.key}`"
              :severity="item.value ? 'success' : 'danger'"
            ></Tag>
          </div>
          <Textarea v-else v-model="datoscampos.detalles" rows="4" placeholder="Detalles adicionales..." fluid />
        </div>

        <div class="col-span-6" hidden>
          <InputText v-model="datoscampos.updated_at" readonly />
        </div>
        <div class="col-span-6" hidden>
          <InputText v-model="datoscampos.created_at" readonly />
        </div>
        <div class="col-span-12" hidden>
          <InputText v-model="datoscampos.usuario" />
        </div>

      </div>
    </form>
  </div>

  <template #footer>
    <div class="flex flex-wrap gap-2 justify-between">
      <div class="flex gap-2">
        <Button label="Ver Producto" icon="pi pi-box" text severity="secondary" @click="fnVerProducto" />
        <Button label="Ver Compra" icon="pi pi-shopping-bag" text severity="secondary" @click="fnVerCompra" />
        <Button label="Ver Factura" icon="pi pi-file" text severity="secondary" @click="fnVerFactura" />
      </div>
      <div class="flex gap-2">
        <Button label="Cancelar" icon="pi pi-times" outlined severity="secondary" @click="visible = false" />
        <Button label="Guardar Cambios" icon="pi pi-check" severity="success" @click="funcionActualizar" />
      </div>
    </div>
  </template>
</Dialog>
<!-- ////////////////////////////////////////////////////////////////////////////////////////// -->
<!-- Modal Crear Serial -->
<Dialog v-model:visible="visiblecrear" modal :style="{ width: '60rem' }" class="electrodomestico-dialog">
  <template #header>
    <div class="flex items-center gap-3">
      <div class="flex items-center justify-center w-12 h-12 bg-green-100 rounded-lg">
        <i class="pi pi-plus-circle text-green-600 text-2xl"></i>
      </div>
      <div>
        <h3 class="text-xl font-bold text-gray-800 m-0">Nuevo Electrodoméstico</h3>
        <p class="text-sm text-gray-500 m-0">Registrar electrodoméstico en el inventario</p>
      </div>
    </div>
  </template>

  <div class="p-4">
    <form id="formularioCrearImei">
      <div class="grid grid-cols-12 gap-4">
        <!-- Información Básica -->
        <div class="col-span-12">
          <h4 class="text-sm font-bold text-blue-700 mb-3 flex items-center gap-2">
            <i class="pi pi-info-circle"></i>
            Información Básica
          </h4>
        </div>

        <div class="col-span-12 md:col-span-4">
          <label class="block text-sm font-semibold text-gray-700 mb-2">
            <i class="pi pi-box mr-1 text-blue-600"></i>
            Serial
          </label>
          <InputText v-model="datoscamposElectrodomestico.serial" placeholder="Número de serie" fluid />
        </div>

        <div class="col-span-12 md:col-span-3">
          <label class="block text-sm font-semibold text-gray-700 mb-2">
            <i class="pi pi-check-circle mr-1 text-blue-600"></i>
            Estado
          </label>
          <Select v-model="datoscamposElectrodomestico.estado" :options="['DISPONIBLE','VENDIDO']" placeholder="Seleccione estado" fluid />
        </div>

        <div class="col-span-12 md:col-span-2">
          <label class="block text-sm font-semibold text-gray-700 mb-2">
            <i class="pi pi-hashtag mr-1 text-blue-600"></i>
            No. Compra
          </label>
          <InputText v-model="datoscamposElectrodomestico.no_compra" placeholder="No. Compra" fluid />
        </div>

        <div class="col-span-12 md:col-span-3">
          <label class="block text-sm font-semibold text-gray-700 mb-2">
            <i class="pi pi-calendar mr-1 text-blue-600"></i>
            Fecha
          </label>
          <InputText v-model="datoscamposElectrodomestico.fecha" v-datepicker placeholder="DD/MM/AAAA" fluid />
        </div>

        <div class="col-span-12 md:col-span-7">
          <label class="block text-sm font-semibold text-gray-700 mb-2">
            <i class="pi pi-box mr-1 text-blue-600"></i>
            Equipo
          </label>
          <awesomplete
            class="dropdown-input"
            v-model="datoscamposElectrodomestico.equipo"
            @change="fnAwesomplete"
            @selectComplete="handleSelectComplete"
            :list="listaBuscador">
          </awesomplete>
        </div>

        <div class="col-span-12 md:col-span-5">
          <label class="block text-sm font-semibold text-gray-700 mb-2">
            <i class="pi pi-building mr-1 text-blue-600"></i>
            Proveedor
          </label>
          <InputText v-model="datoscamposElectrodomestico.proveedor" v-mayuscula placeholder="Proveedor" fluid readonly />
        </div>

        <div class="col-span-12 md:col-span-3">
          <label class="block text-sm font-semibold text-gray-700 mb-2">ID Equipo</label>
          <InputText v-model="datoscamposElectrodomestico.id_equi" placeholder="ID" fluid readonly />
        </div>

        <div class="col-span-12 md:col-span-3">
          <label class="block text-sm font-semibold text-gray-700 mb-2">
            <i class="pi pi-calendar mr-1 text-blue-600"></i>
            Fecha Venta
          </label>
          <InputText v-model="datoscamposElectrodomestico.fecha_venta" placeholder="DD/MM/AAAA" fluid />
        </div>

        <div class="col-span-12 md:col-span-3">
          <label class="block text-sm font-semibold text-gray-700 mb-2">
            <i class="pi pi-clock mr-1 text-blue-600"></i>
            Hora Venta
          </label>
          <InputText v-model="datoscamposElectrodomestico.hora_venta" placeholder="HH:MM" fluid />
        </div>

        <div class="col-span-12 md:col-span-6">
          <label class="block text-sm font-semibold text-gray-700 mb-2">
            <i class="pi pi-user mr-1 text-blue-600"></i>
            Comprador
          </label>
          <InputText v-model="datoscamposElectrodomestico.comprador" v-mayuscula placeholder="Nombre del comprador" fluid />
        </div>

        <!-- Detalles -->
        <div class="col-span-12 mt-3">
          <h4 class="text-sm font-bold text-purple-700 mb-3 flex items-center gap-2">
            <i class="pi pi-list"></i>
            Detalles del Dispositivo
          </h4>
        </div>

        <div class="col-span-12">
          <Textarea v-model="datoscamposElectrodomestico.detalles" rows="6" placeholder="Detalles adicionales del dispositivo..." fluid />
        </div>

        <div class="col-span-6" hidden>
          <InputText v-model="datoscamposElectrodomestico.updated_at" />
        </div>
        <div class="col-span-6" hidden>
          <InputText v-model="datoscamposElectrodomestico.created_at" />
        </div>
        <div class="col-span-12" hidden>
          <InputText v-model="datoscamposElectrodomestico.usuario" />
        </div>
      </div>
    </form>
  </div>

  <template #footer>
    <div class="flex gap-2 justify-end">
      <Button label="Cancelar" icon="pi pi-times" outlined severity="secondary" @click="visiblecrear = false" />
      <Button label="Crear Serial" icon="pi pi-check" severity="success" @click="funcionCrear" />
    </div>
  </template>
</Dialog>
<!-- ////////////////////////////////////////////////////////////////////////////////////////// -->
<!-- Modal Configuración Barcode -->
<Dialog v-model:visible="visibleBarcodeConfig" modal :style="{ width: '600px' }" class="barcode-config-dialog">
  <template #header>
    <div class="flex items-center gap-3">
      <div class="flex items-center justify-center w-12 h-12 bg-purple-100 rounded-lg">
        <i class="pi pi-qrcode text-purple-600 text-2xl"></i>
      </div>
      <div>
        <h3 class="text-xl font-bold text-gray-800 m-0">Configurar Código de Barras</h3>
        <p class="text-sm text-gray-500 m-0">Personaliza las opciones antes de imprimir</p>
      </div>
    </div>
  </template>

  <div class="p-4">
    <div class="grid grid-cols-12 gap-4">
      <!-- Información Básica -->
      <div class="col-span-12">
        <h4 class="text-sm font-bold text-purple-700 mb-2">Información del Código</h4>
      </div>

      <div class="col-span-12 md:col-span-6">
        <label class="block text-sm font-semibold text-gray-700 mb-2">
          <i class="pi pi-tag mr-1 text-purple-600"></i>
          Código/Serial
        </label>
        <InputText v-model="codigoBarcode" placeholder="Código" fluid />
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

      <!-- Márgenes -->
      <div class="col-span-12 mt-3">
        <h4 class="text-sm font-bold text-purple-700 mb-2">Márgenes (mm)</h4>
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
        <label class="block text-sm font-semibold text-gray-700 mb-2">Tamaño Fuente</label>
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
              Incluir Código de Barras
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
<Toast />
<LoadingOverlay :visible="loading" />
  </div>
</main>
</template>
<style scoped>
/* Header Profesional de Serial */
.serial-header {
  background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%);
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
}

.serial-header-content {
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.serial-icon-wrapper {
  width: 4rem;
  height: 4rem;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(10px);
}

.serial-icon {
  font-size: 2rem;
  color: white;
}

.serial-title {
  font-size: 1.875rem;
  font-weight: 700;
  color: white;
  margin: 0;
  letter-spacing: -0.025em;
}

.serial-subtitle {
  font-size: 1rem;
  color: rgba(255, 255, 255, 0.9);
  margin: 0.25rem 0 0 0;
}

.serial-header-text {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.serial-title {
  font-size: 1.2rem;
  font-weight: 600;
  letter-spacing: 0.03em;
  color: #111827;
}

@media (min-width: 768px) {
  .serial-title {
    font-size: 1.45rem;
  }
}

.serial-subtitle {
  font-size: 0.8rem;
  color: #6b7280;
}

.serial-header-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  justify-content: flex-start;
}

@media (min-width: 640px) {
  .serial-header-actions {
    justify-content: flex-end;
  }
}

.serial-btn {
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

.serial-btn i {
  font-size: 0.8rem;
}

.serial-btn-primary {
  background: linear-gradient(135deg, #22c55e, #16a34a);
  border-color: rgba(22, 163, 74, 0.9);
  color: #ecfdf5;
}

.serial-btn-primary:hover {
  background: linear-gradient(135deg, #4ade80, #22c55e);
}

.serial-btn-secondary {
  background: #ffffff;
  border-color: #d1d5db;
}

.serial-btn-secondary:hover {
  background: #eff6ff;
  border-color: #93c5fd;
}

.serial-btn-danger {
  background: #fee2e2;
  border-color: #fecaca;
  color: #b91c1c;
}

.serial-btn-danger:hover {
  background: #fecaca;
}

.serial-btn-success {
  background: #dcfce7;
  border-color: #bbf7d0;
  color: #15803d;
}

.serial-btn-success:hover {
  background: #bbf7d0;
}

.serial-btn-outline {
  background: #ffffff;
}

.serial-filters {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  align-items: flex-end;
  margin: 0.75rem 0 0.75rem;
}

.serial-filter-group {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.serial-filter-label {
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: #6b7280;
}

.serial-select {
  min-width: 160px;
}

.serial-search-wrapper {
  position: relative;
}

.serial-search-input {
  padding-left: 2rem;
  min-width: 220px;
}

.serial-search-icon {
  position: absolute;
  left: 0.6rem;
  top: 50%;
  transform: translateY(-50%);
  font-size: 0.85rem;
  color: #9ca3af;
}

.serial-table {
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

/* Tabla de Serial */
.serial-table-card {
  border-radius: 12px;
  border: 1px solid #e5e7eb;
}

.serial-table-card .p-card-content {
  padding: 1.5rem;
}

.serial-toolbar {
  padding-bottom: 1rem;
}

.serial-filters {
  padding: 1rem 0;
}

.serial-datatable :deep(.p-datatable-thead > tr > th) {
  background: linear-gradient(to bottom, #f9fafb, #f3f4f6);
  color: #374151;
  font-weight: 600;
  text-transform: uppercase;
  font-size: 0.75rem;
  letter-spacing: 0.05em;
  border-bottom: 2px solid #0ea5e9;
}

.serial-datatable :deep(.p-datatable-tbody > tr:hover) {
  background-color: #eff6ff !important;
  cursor: pointer;
}

.serial-datatable :deep(.p-datatable-tbody > tr) {
  transition: all 0.2s ease;
}

/* Estilos de estado */
.vendido {
  color: #b91c1c !important;
}

.disponible {
  color: #15803d !important;
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

/* Modales de Serial */
.serial-dialog :deep(.p-dialog-header) {
  border-bottom: 1px solid #e5e7eb;
  padding: 1.5rem;
}

.serial-dialog :deep(.p-dialog-content) {
  padding: 0;
}

.serial-dialog :deep(.p-dialog-footer) {
  border-top: 1px solid #e5e7eb;
  padding: 1rem 1.5rem;
}

.serial-dialog h4 {
  position: relative;
  padding-bottom: 0.5rem;
}

.serial-dialog h4::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  width: 3rem;
  height: 2px;
  background: currentColor;
  opacity: 0.5;
}

.serial-dialog .dropdown-input {
  width: 100%;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  padding: 0.625rem 0.75rem;
  font-size: 1rem;
  transition: all 0.2s;
}

.serial-dialog .dropdown-input:focus {
  border-color: #0ea5e9;
  box-shadow: 0 0 0 3px rgba(14, 165, 233, 0.1);
  outline: none;
}

/* Responsive */
@media (max-width: 768px) {
  .serial-header {
    padding: 1.5rem;
  }

  .serial-title {
    font-size: 1.5rem;
  }

  .serial-subtitle {
    font-size: 0.875rem;
  }

  .summary-value {
    font-size: 1.5rem;
  }

  .summary-value-currency {
    font-size: 1.25rem;
  }

  .serial-toolbar {
    flex-direction: column;
    align-items: stretch;
  }

  .serial-filters .flex {
    flex-direction: column;
  }

  .serial-dialog :deep(.p-dialog) {
    width: 95vw !important;
  }

  .serial-dialog h4 {
    font-size: 0.875rem;
  }
}
</style>
