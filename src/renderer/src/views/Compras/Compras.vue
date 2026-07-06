<script setup>
import { ref, onMounted, nextTick, watchEffect,computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
const router = useRouter();
import axios from 'axios';
import { enviarDatosPorPost, eliminarDatos, obtenerIdsSeleccionados, borrarTodoslosDatos, lenguajeDataTable, nfecha, arrayToObjetoFromTabla, peticionesFetch, encryptarPassword, envioElectron, mensajetoast, crearTablaSiNoExiste, peticiones, lasMayusculas, peticionesFetchOffline, arrayToObjetoFromTablaOffline, crearTablaSiNoExisteOffline, generarCodigoAlfaNumerico, generadorCodigo, cajeroACtivo } from '@/funciones/funciones.js';
import Swal from 'sweetalert2'
import { useToast } from "primevue/usetoast";
const toast = useToast();
/************************************************************************/
/************************************************************************/
const usuarioLocal = ref({})
/************************************************************************/
const camposArray = ["proveedor","rnc_proveedor","fecha","no_factura","ncf_proveedor","productos","estado","subtotal","descuento","impuesto","total","abono","saldo","nota","almacen","usuario"];
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
const selectedItems = ref([]);
/************************************************************************/
const position = ref('top');
const openPosition = (pos) => {
    position.value = pos;
    visible.value = true;
}
/************************************************************************/
/************************************************************************/
const visible = ref(false);
const visiblecrear = ref(false);
const value = ref(null);
const id = ref(null);
const datoscampos = ref({});
const data = ref([]);
const searchQuery = ref('');
const ComprasEditar = ref(null);
/************************************************************************/
// Gasto Personal
const visibleGastoPersonal = ref(false);
const loadingGasto = ref(false);
const bancosArray = ref([]);
const cuentasArray = ref([]);
const proveedores = ref([]);
const datosCajero = ref({});
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
const bancosParaGasto = computed(() => [
  ...bancosArray.value.map(b => ({ ...b, _source: 'banco' })),
  ...cuentasArray.value.map(c => ({ ...c, tipo: c.categoria || c.tipo, _source: 'cuentas' }))
]);
/************************************************************************/
async function limpiarCamposCrear() {
datoscamposCompras.value = {}
await campos();
}
/************************************************************************/
watchEffect(() => {
  if (visiblecrear.value) {
  }
});
/************************************************************************/
const fetchAndSetupData = async () => {
const response = await peticionesFetchOffline('getDataAsArray', 'compras');
    const jsonData = response.reverse();
    data.value = jsonData;
};
/************************************************************************/
async function campos() {
  const campos = await arrayToObjetoFromTablaOffline('compras');
  datoscamposCompras.value = campos;
}
/************************************************************************/
onMounted(async () => {
const datosJSON = await envioElectron('datosarchivo');
link.value = datosJSON.VITE_LINKURL;
api.value = datosJSON.VITE_LINK_API;
token.value = datosJSON.VITE_TOKEN;
patronTelefono.value = datosJSON.VITE_PATRON_TELEFONO;
linkImpresora.value = datosJSON.VITE_IMPRESORA_LOCAL;
patroncedula.value = datosJSON.VITE_PATRON_CEDULA;
tokenCorto.value = datosJSON.VITE_TOKEN_CORTO;

tokenCifrado.value = await encryptarPassword(token.value, 10);
await crearTablaSiNoExisteOffline('compras', camposArray, toast);
usuarioLocal.value = JSON.parse(window.localStorage.getItem('usuarioLocal'))[0] || {};
await fetchAndSetupData();
await cargarProveedores();
await cargarBancos();
await cargarCuentas();
datosCajero.value = await cajeroACtivo(link.value + api.value);
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
                    const envioDatos = await peticionesFetchOffline('deleteAll', 'compras');
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
  const url = link.value+api.value+"/actualizarcampos/compras";
  if (!datoscampos.value) {
    console.error("Datos incompletos, no se puede actualizar.");
    return;
  }
  if (datoscampos.value.hasOwnProperty('created_at')) {
    datoscampos.value.updated_at = nfecha('timestamp');
  }
  const envioDatos = await peticionesFetchOffline('updateData', 'compras', JSON.stringify(datoscampos.value));
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
  const url = link.value+api.value+"/insertar/compras";
  if (datoscamposCompras.value.hasOwnProperty('created_at')) {
    datoscamposCompras.value.created_at = nfecha('timestamp');
    datoscamposCompras.value.updated_at = nfecha('timestamp');
  }
  const envioDatos = await peticionesFetchOffline('insertData', 'compras', JSON.stringify(datoscamposCompras.value));
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
  const ids = obtenerIdsSeleccionados(selectedItems.value);
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
                                const compraAEliminar = data.value.find(c => c.id == id);
                                if (compraAEliminar) {
                                    await revertirStockCompra(compraAEliminar);
                                }
                                const envioDatos = await peticionesFetchOffline('deleteEntry', 'compras', id);
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
// Función auxiliar para agregar IMEIs
const agregarIMEIs = async (urlInsertarIMEI, producto, datosIMEI) => {
  try {
    const datosImei = await peticionesFetchOffline('getDataByField', 'productos', 'codigo', producto.codigo);

    if (datosImei) {
      const listImei = producto.otro.split(',').map((imei) => imei.trim()).filter((imei) => imei);

      const promisesIMEI = listImei.map(async (imei) => {
        const nuevoIMEI = {
          ...datosIMEI,
          imei,
          estado: 'DISPONIBLE',
          fecha: nfecha('fecha'),
          equipo: producto.nombre,
          proveedor: producto.proveedor,
          id_equi: datosImei.id,
          costo: producto.precio_compra,
          precio_venta: producto.precio_venta,
          no_compra: producto.no_compra,
          fecha_venta: '',
          hora_venta: '',
          comprador: '',
          detalles: '',
          usuario: '',
        };
        return enviarDatosPorPost(urlInsertarIMEI, nuevoIMEI, tokenCifrado.value);
      });

      await Promise.all(promisesIMEI);
    }
  } catch (imeiError) {
    console.error(`Error al agregar IMEIs para el producto ${producto.nombre}:`, imeiError);
  }
};
/************************************************************************/
const integrarProductos = async()=>{
    const productos = JSON.parse(currentRowData.value.productos)
    const datosIMEI = await arrayToObjetoFromTablaOffline('imei');
    const urlInsertarIMEI = `${link.value + api.value}/insertar/imei`;
    const urlInsertarProducto = `${link.value + api.value}/insertar/productos`;
    for(let prod of productos){
          const verificaExistenciaProducto = await peticionesFetchOffline('getDataByField', 'productos', 'codigo', prod.codigo);

          if (!verificaExistenciaProducto) {
            delete prod.id
            prod.almacen = datosEmpresa.empresa.nombre
            const envioDatos = await enviarDatosPorPost(urlInsertarProducto, prod, tokenCifrado.value);

         if (envioDatos[0] === 'ok' && prod.categoria === 'CELULARES' && prod.otro) {
            await agregarIMEIs(urlInsertarIMEI, prod, datosIMEI);
          }


          }


    }
}
/************************************************************************/
const revertirStockCompra = async (compra) => {
  let productos = [];
  try {
    productos = JSON.parse(compra.productos || '[]');
  } catch {
    return;
  }

  // Procesar productos de la compra
  for (const prod of productos) {
    const productoEnBD = await peticionesFetchOffline('getDataByField', 'productos', 'codigo', prod.codigo);
    if (!productoEnBD) continue;

    // Si el producto es de categoría CELULARES, eliminar IMEIs y actualizar stock
    if (prod.categoria === 'CELULARES') {
      await eliminarImeisYActualizarStock(compra.no_factura, productoEnBD.id);
    } else {
      // Para productos normales, revertir stock normalmente
      const stockActual = Number(productoEnBD.stock) || 0;
      const cantidadCompra = Number(prod.stock) || 0;
      productoEnBD.stock = Math.max(0, stockActual - cantidadCompra);
      await peticionesFetchOffline('updateData', 'productos', JSON.stringify(productoEnBD));
    }
  }
};

// Función para eliminar IMEIs de una compra y actualizar stock de celulares
const eliminarImeisYActualizarStock = async (no_factura, productoId) => {
  try {
    // 1. Buscar todos los IMEIs que tengan no_compra igual a no_factura
    const todosLosImeis = await peticionesFetchOffline('getDataAsArray', 'imei');
    const imeisDeCompra = todosLosImeis.filter(imei => imei.no_compra === no_factura);

    // Obtener los id_equi únicos antes de borrar
    const idsEquipos = [...new Set(imeisDeCompra.map(imei => imei.id_equi))];

    // 2. Borrar todos los IMEIs de esta compra
    for (const imei of imeisDeCompra) {
      await peticionesFetchOffline('deleteEntry', 'imei', imei.id);
    }

    // 3. Para cada producto (id_equi), actualizar el stock según IMEIs disponibles
    for (const idEquipo of idsEquipos) {
      if (!idEquipo) continue;

      // Buscar el producto por ID
      const producto = await peticionesFetchOffline('getDataByField', 'productos', 'id', idEquipo);
      if (!producto) continue;

      // Buscar todos los IMEIs DISPONIBLES con este id_equi
      const todosLosImeisActualizados = await peticionesFetchOffline('getDataAsArray', 'imei');
      const imeisDisponibles = todosLosImeisActualizados.filter(
        imei => imei.id_equi == idEquipo && imei.estado === 'DISPONIBLE'
      );

      // 4. Actualizar el stock del producto con el length de IMEIs disponibles
      producto.stock = imeisDisponibles.length;
      producto.updated_at = nfecha('timestamp');
      await peticionesFetchOffline('updateData', 'productos', JSON.stringify(producto));
    }

    toast.add({
      severity: 'info',
      summary: 'IMEIs Eliminados',
      detail: `Se eliminaron ${imeisDeCompra.length} IMEIs y se actualizó el stock`,
      life: 3000
    });
  } catch (error) {
    console.error('Error al eliminar IMEIs y actualizar stock:', error);
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Error al procesar IMEIs de la compra',
      life: 3000
    });
  }
};
/************************************************************************/
const itemsCompras = ref([]);
const menu = ref(null);
const currentRowData = ref(null);
const toggleCompras = (event, rowData) => {
currentRowData.value = rowData;
itemsCompras.value = [
{ label: 'Editar', icon: 'pi pi-pencil', command: () => { 
router.push({ path: `/editarcompras/${currentRowData.value.id}` });
} },
{ label: 'Integrar Productos', icon: 'pi pi-sync', command: async() => { 

  await integrarProductos()

} },
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
                        await revertirStockCompra(rowData);
                        const datosFactura = await peticionesFetchOffline('deleteEntry', 'compras', rowData.id);
                        if (datosFactura[0] == 'ok') {
                            toast.add({ severity: 'success', summary: 'Éxito', detail: 'Compra eliminada y stock revertido', life: 3000 });
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
menu.value.toggle(event);
};
/************************************************************************/
const filteredCompras = computed(() => {
if (!searchQuery.value) return data.value;
return data.value.filter(busqueda => {
  return Object.values(busqueda).some(value =>
    String(value).toLowerCase().includes(searchQuery.value.toLowerCase())
   );
  });
});
/************************************************************************/
const fnAwesomplete = ()=>{
}
const handleSelectComplete = async(selected)=>{
}
/************************************************************************/
const fnRouter = (ruta) => {
  router.push(ruta);
};
/************************************************************************/
const cargarProveedores = async () => {
  const response = await peticionesFetchOffline('getDataAsArray', 'proveedores');
  proveedores.value = response || [];
};
const cargarBancos = async () => {
  const response = await peticionesFetchOffline('getDataArrayByCondition', 'banco', 'almacen', datosEmpresa.empresa.nombre);
  bancosArray.value = response || [];
};
const cargarCuentas = async () => {
  const response = await peticionesFetchOffline('getDataAsArray', 'cuentas');
  cuentasArray.value = response || [];
};
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
    if (gastoPersonal.value.estado === 'PAGADO') {
      const sel = gastoPersonal.value.cuenta_seleccionada;
      const tablaCuenta = sel._source || 'banco';
      // Usar el registro original limpio para no enviar campos extra al updateData
      const srcArray = tablaCuenta === 'cuentas' ? cuentasArray.value : bancosArray.value;
      const banco = { ...(srcArray.find(r => r.id === sel.id) || sel) };
      const balanceAnterior = parseFloat(banco.saldo) || 0;
      const balanceActual = balanceAnterior - monto;
      banco.saldo = balanceActual.toFixed(2);
      banco.updated_at = nfecha('timestamp');
      await peticionesFetchOffline('updateData', tablaCuenta, JSON.stringify(banco));
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
      transaccion.depositante = datosEmpresa.empresa.nombre;
      transaccion.beneficiario = gastoPersonal.value.proveedor || 'GASTO PERSONAL';
      if (transaccion.hasOwnProperty('almacen')) transaccion.almacen = datosEmpresa.empresa.nombre;
      if (transaccion.hasOwnProperty('usuario')) transaccion.usuario = usuarioLocal.value?.usuario || '';
      if (transaccion.hasOwnProperty('created_at')) {
        transaccion.created_at = nfecha('timestamp');
        transaccion.updated_at = nfecha('timestamp');
      }
      await peticionesFetchOffline('insertData', 'transaccionesbancarias', JSON.stringify(transaccion));
    }
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
      if (jsonDataPagar.hasOwnProperty('almacen')) jsonDataPagar.almacen = datosEmpresa.empresa.nombre;
      if (jsonDataPagar.hasOwnProperty('usuario')) jsonDataPagar.usuario = usuarioLocal.value?.usuario || '';
      if (jsonDataPagar.hasOwnProperty('created_at')) {
        jsonDataPagar.created_at = nfecha('timestamp');
        jsonDataPagar.updated_at = nfecha('timestamp');
      }
      await peticionesFetchOffline('insertData', 'cuentasxpagar', JSON.stringify(jsonDataPagar));
    }
    await crearAsientoDiarioGasto(noFactura);
    toast.add({ severity: 'success', summary: 'Éxito', detail: 'Gasto Personal registrado correctamente', life: 3000 });
    visibleGastoPersonal.value = false;
    limpiarGastoPersonal();
    await fetchAndSetupData();
    await cargarBancos();
    await cargarCuentas();
  } catch (error) {
    console.error('Error al guardar gasto personal:', error);
    toast.add({ severity: 'error', summary: 'Error', detail: 'Error al registrar el gasto', life: 3000 });
  } finally {
    loadingGasto.value = false;
  }
};
/************************************************************************/
const formatCurrency = (value) => {
  if (!value || isNaN(value)) return '$0.00';
  return `$${Number(value).toFixed(2)}`;
};
/************************************************************************/
const calcularSaldoTotal = () => {
  const total = filteredCompras.value.reduce((acc, compra) => {
    return acc + Number(compra.saldo || 0);
  }, 0);
  return formatCurrency(total);
};
/************************************************************************/
</script>
<template>
<main class="compras-wrapper">
  <div class="container-compras mx-auto px-4 py-6">

    <!-- Header Section -->
    <div class="mb-6">
      <h1 class="text-3xl font-bold text-gray-800 mb-2">Gestión de Compras</h1>
      <p class="text-gray-600">Administra y monitorea las compras a proveedores</p>
    </div>

    <!-- Stats Cards -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">

      <!-- Total Compras Card -->
      <Card class="compras-stat-card">
        <template #content>
          <div class="stat-card-content">
            <div class="stat-icon-wrapper bg-gradient-blue">
              <i class="pi pi-shopping-bag text-white text-3xl"></i>
            </div>
            <div class="stat-info">
              <span class="stat-label">Total Compras</span>
              <div class="stat-value">{{ filteredCompras.length }}</div>
            </div>
          </div>
        </template>
      </Card>

      <!-- Pendientes Card -->
      <Card class="compras-stat-card">
        <template #content>
          <div class="stat-card-content">
            <div class="stat-icon-wrapper bg-gradient-orange">
              <i class="pi pi-clock text-white text-3xl"></i>
            </div>
            <div class="stat-info">
              <span class="stat-label">Pendientes</span>
              <div class="stat-value">{{ filteredCompras.filter(c => c.estado === 'PENDIENTE').length }}</div>
            </div>
          </div>
        </template>
      </Card>

      <!-- Pagadas Card -->
      <Card class="compras-stat-card">
        <template #content>
          <div class="stat-card-content">
            <div class="stat-icon-wrapper bg-gradient-green">
              <i class="pi pi-check-circle text-white text-3xl"></i>
            </div>
            <div class="stat-info">
              <span class="stat-label">Pagadas</span>
              <div class="stat-value">{{ filteredCompras.filter(c => c.estado === 'PAGADO').length }}</div>
            </div>
          </div>
        </template>
      </Card>

      <!-- Total Saldo Card -->
      <Card class="compras-stat-card">
        <template #content>
          <div class="stat-card-content">
            <div class="stat-icon-wrapper bg-gradient-purple">
              <i class="pi pi-dollar text-white text-3xl"></i>
            </div>
            <div class="stat-info">
              <span class="stat-label">Saldo Pendiente</span>
              <div class="stat-value">{{ calcularSaldoTotal() }}</div>
            </div>
          </div>
        </template>
      </Card>

    </div>

    <!-- Main Content Card -->
    <Card class="compras-main-card">
      <template #header>
        <div class="card-header-modern">
          <div class="flex items-center gap-3">
            <div class="icon-wrapper-modern bg-blue-600">
              <i class="pi pi-list text-white text-2xl"></i>
            </div>
            <div>
              <h2 class="text-xl font-bold text-gray-800">Lista de Compras</h2>
              <p class="text-sm text-gray-500">Gestiona tus compras y proveedores</p>
            </div>
          </div>
        </div>
      </template>

      <template #content>

        <!-- Actions and Search Section -->
        <div class="actions-section mb-6">

          <!-- Actions Row -->
          <div class="flex flex-wrap gap-3 justify-between items-center mb-4">
            <div class="flex gap-3">
              <Button
                @click="fetchAndSetupData"
                icon="pi pi-refresh"
                label="Recargar"
                severity="warning"
                class="action-btn"
              />
              <Button
                as="router-link"
                to="/crearcompras"
                icon="pi pi-plus"
                label="Nueva Compra"
                severity="success"
                class="action-btn"
              />
              <Button
                label="Gasto Personal"
                icon="pi pi-wallet"
                severity="warning"
                class="action-btn"
                @click="() => { limpiarGastoPersonal(); visibleGastoPersonal = true; }"
              />
              <Button
                @click="borrarSeleccionados"
                icon="pi pi-trash"
                label="Borrar Selección"
                severity="danger"
                class="action-btn"
              />
            </div>

            <div v-if="usuarioLocal.usuario === 'Soporte'">
              <Button
                @click="borrarTodo"
                icon="pi pi-trash"
                label="Borrar Todo"
                severity="danger"
                class="action-btn"
              />
            </div>
          </div>

          <!-- Search Row -->
          <div class="search-wrapper">
            <IconField iconPosition="left">
              <InputIcon class="pi pi-search" />
              <InputText
                v-model="searchQuery"
                placeholder="Buscar por proveedor, factura, RNC..."
                class="search-input w-full"
              />
            </IconField>
          </div>

        </div>

        <!-- DataTable Section -->
        <div class="datatable-wrapper">
          <DataTable
            :value="filteredCompras"
            scrollable
            scrollHeight="600px"
            dataKey="id"
            paginator
            :rows="10"
            v-model:selection="selectedItems"
            :rowsPerPageOptions="[5, 10, 20, 50]"
            tableStyle="min-width: 50rem"
            class="compras-datatable"
          >
            <Column selectionMode="multiple" headerStyle="width: 3rem"></Column>

            <Column header="Acciones" :style="{width: '120px'}">
              <template #body="slotProps">
                <Button
                  icon="pi pi-cog"
                  @click="toggleCompras($event, slotProps.data)"
                  severity="secondary"
                  rounded
                  outlined
                  aria-haspopup="true"
                  aria-controls="overlay_menu_compras"
                />
                <Menu
                  ref="menu"
                  id="overlay_menu_compras"
                  :model="itemsCompras"
                  :popup="true"
                />
              </template>
            </Column>

            <Column field="proveedor" header="Proveedor" :style="{minWidth: '200px'}">
              <template #body="slotProps">
                <div class="font-semibold text-gray-800">{{ slotProps.data.proveedor }}</div>
              </template>
            </Column>

            <Column field="rnc_proveedor" header="RNC" :style="{minWidth: '120px'}"></Column>

            <Column field="fecha" header="Fecha" :style="{minWidth: '120px'}">
              <template #body="slotProps">
                <Tag :value="slotProps.data.fecha" severity="info" />
              </template>
            </Column>

            <Column field="no_factura" header="No. Factura" :style="{minWidth: '140px'}">
              <template #body="slotProps">
                <div class="font-mono text-sm">{{ slotProps.data.no_factura }}</div>
              </template>
            </Column>

            <Column field="ncf_proveedor" header="NCF" :style="{minWidth: '150px'}"></Column>

            <Column field="estado" header="Estado" :style="{minWidth: '120px'}">
              <template #body="slotProps">
                <Tag
                  :value="slotProps.data.estado"
                  :severity="slotProps.data.estado === 'PAGADO' ? 'success' : slotProps.data.estado === 'PENDIENTE' ? 'warning' : 'secondary'"
                />
              </template>
            </Column>

            <Column field="subtotal" header="Subtotal" :style="{minWidth: '120px'}">
              <template #body="slotProps">
                <div class="font-semibold">{{ formatCurrency(slotProps.data.subtotal) }}</div>
              </template>
            </Column>

            <Column field="descuento" header="Descuento" :style="{minWidth: '120px'}">
              <template #body="slotProps">
                <div class="text-orange-600">{{ formatCurrency(slotProps.data.descuento) }}</div>
              </template>
            </Column>

            <Column field="impuesto" header="Impuesto" :style="{minWidth: '120px'}">
              <template #body="slotProps">
                <div>{{ formatCurrency(slotProps.data.impuesto) }}</div>
              </template>
            </Column>

            <Column field="total" header="Total" :style="{minWidth: '140px'}">
              <template #body="slotProps">
                <div class="font-bold text-blue-600 text-lg">{{ formatCurrency(slotProps.data.total) }}</div>
              </template>
            </Column>

            <Column field="abono" header="Abono" :style="{minWidth: '120px'}">
              <template #body="slotProps">
                <div class="text-green-600">{{ formatCurrency(slotProps.data.abono) }}</div>
              </template>
            </Column>

            <Column field="saldo" header="Saldo" :style="{minWidth: '120px'}">
              <template #body="slotProps">
                <div class="font-semibold" :class="Number(slotProps.data.saldo) > 0 ? 'text-red-600' : 'text-green-600'">
                  {{ formatCurrency(slotProps.data.saldo) }}
                </div>
              </template>
            </Column>

            <Column field="nota" header="Nota" :style="{minWidth: '200px'}">
              <template #body="slotProps">
                <div class="text-sm text-gray-600 truncate">{{ slotProps.data.nota || '-' }}</div>
              </template>
            </Column>

            <Column field="usuario" header="Usuario" :style="{minWidth: '140px'}"></Column>

          </DataTable>
        </div>

      </template>
    </Card>

    <!-- DIALOG: GASTO PERSONAL -->
    <Dialog
      v-model:visible="visibleGastoPersonal"
      header="Registrar Gasto Personal"
      :style="{ width: '600px' }"
      modal
      @hide="limpiarGastoPersonal"
    >
      <div class="gasto-form-grid">

        <div class="gasto-col-6">
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

        <div class="gasto-col-6">
          <label>RNC</label>
          <InputText v-model="gastoPersonal.rnc_proveedor" placeholder="RNC del proveedor" class="w-full" />
        </div>

        <div class="gasto-col-6">
          <label>No. Compra</label>
          <InputText v-model="gastoPersonal.no_factura" class="w-full" />
        </div>

        <div class="gasto-col-6">
          <label>NCF</label>
          <InputText v-model="gastoPersonal.ncf_proveedor" placeholder="NCF (opcional)" class="w-full" />
        </div>

        <div class="gasto-col-12">
          <label>Descripción del Gasto *</label>
          <InputText v-model="gastoPersonal.descripcion" placeholder="Ej: Alquiler, electricidad, servicio..." class="w-full" />
        </div>

        <div class="gasto-col-6">
          <label>Monto *</label>
          <InputNumber v-model="gastoPersonal.monto" mode="currency" currency="DOP" locale="es-DO" class="w-full" />
        </div>

        <div class="gasto-col-6">
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

        <div v-if="gastoPersonal.estado === 'PAGADO'" class="gasto-col-12">
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

        <div v-if="gastoPersonal.estado === 'PAGADO'" class="gasto-col-12">
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
              <div style="display:flex;justify-content:space-between;align-items:center;gap:0.5rem;">
                <div>
                  <strong>{{ slotProps.option.nombre }}</strong>
                  <small style="color:#888;margin-left:6px;">({{ slotProps.option.tipo }})</small>
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
          <small v-if="gastoPersonal.cuenta_seleccionada" style="color:#6b7280;margin-top:4px;display:block;">
            Saldo actual: {{ formatCurrency(gastoPersonal.cuenta_seleccionada.saldo) }}
            &rarr; Saldo tras gasto: {{ formatCurrency(parseFloat(gastoPersonal.cuenta_seleccionada.saldo) - parseFloat(gastoPersonal.monto || 0)) }}
          </small>
        </div>

        <div v-if="gastoPersonal.estado === 'CREDITO' || gastoPersonal.estado === 'PENDIENTE'" class="gasto-col-12">
          <div style="background:#fef3c7;border-radius:8px;padding:0.75rem 1rem;display:flex;gap:0.5rem;align-items:flex-start;">
            <i class="pi pi-info-circle" style="color:#d97706;margin-top:2px;"></i>
            <span style="color:#92400e;font-size:0.875rem;">
              Se creará una <strong>Cuenta por Pagar</strong> por el monto indicado. Podrás abonar desde el módulo de Cuentas por Pagar.
            </span>
          </div>
        </div>

      </div>

      <template #footer>
        <Button label="Cancelar" icon="pi pi-times" severity="secondary" text @click="visibleGastoPersonal = false" />
        <Button label="Registrar Gasto" icon="pi pi-check" severity="warning" :loading="loadingGasto" @click="guardarGastoPersonal" />
      </template>
    </Dialog>

    <Toast />
  </div>
</main>
</template>

<style scoped>
/* ===================================
   COMPRAS COMPONENT MODERN STYLES
   =================================== */

/* Main Wrapper */
.compras-wrapper {
  min-height: calc(100vh - 80px);
  background: linear-gradient(135deg, rgba(243, 244, 246, 0.5) 0%, rgba(229, 231, 235, 0.3) 100%);
}

/* Container */
.container-compras {
  max-width: 1400px;
}

/* Stats Cards */
.compras-stat-card {
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  border: 1px solid rgba(229, 231, 235, 0.8);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
  animation: slideIn 0.4s ease-out;
}

.compras-stat-card:hover {
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.15);
  transform: translateY(-4px);
}

.stat-card-content {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.5rem;
}

.stat-icon-wrapper {
  width: 64px;
  height: 64px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
  transition: all 0.3s ease;
}

.stat-icon-wrapper:hover {
  transform: scale(1.1) rotate(5deg);
}

.bg-gradient-blue {
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
}

.bg-gradient-orange {
  background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
}

.bg-gradient-green {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
}

.bg-gradient-purple {
  background: linear-gradient(135deg, #a855f7 0%, #9333ea 100%);
}

.stat-info {
  flex: 1;
}

.stat-label {
  display: block;
  font-size: 0.875rem;
  font-weight: 600;
  color: #6b7280;
  margin-bottom: 0.5rem;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: 800;
  color: #1f2937;
  line-height: 1.2;
}

/* Main Card */
.compras-main-card {
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  border: 1px solid rgba(229, 231, 235, 0.8);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
  animation: slideIn 0.5s ease-out;
}

/* Card Header */
.card-header-modern {
  padding: 1.5rem;
  background: linear-gradient(135deg, rgba(249, 250, 251, 0.8) 0%, rgba(243, 244, 246, 0.6) 100%);
  border-bottom: 1px solid rgba(229, 231, 235, 0.6);
}

.icon-wrapper-modern {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  transition: all 0.3s ease;
}

.icon-wrapper-modern:hover {
  transform: scale(1.1) rotate(5deg);
}

/* Actions Section */
.actions-section {
  padding: 0;
}

.action-btn {
  padding: 0.75rem 1.5rem;
  font-weight: 600;
  border-radius: 10px;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.action-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
}

/* Search Input */
.search-wrapper {
  width: 100%;
}

.search-input {
  padding: 0.75rem 1rem 0.75rem 2.5rem !important;
  border: 2px solid #e5e7eb;
  border-radius: 10px;
  font-size: 0.95rem;
  transition: all 0.3s ease;
  background: white;
}

.search-input:focus {
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  outline: none;
}

/* DataTable Wrapper */
.datatable-wrapper {
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid #e5e7eb;
}

.compras-datatable {
  font-size: 0.95rem;
}

/* DataTable Custom Styles */
:deep(.compras-datatable .p-datatable-thead > tr > th) {
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.05) 0%, rgba(37, 99, 235, 0.05) 100%);
  color: #374151;
  font-weight: 700;
  padding: 1rem;
  border-bottom: 2px solid #e5e7eb;
}

:deep(.compras-datatable .p-datatable-tbody > tr) {
  transition: all 0.2s ease;
}

:deep(.compras-datatable .p-datatable-tbody > tr:hover) {
  background: rgba(59, 130, 246, 0.05);
}

:deep(.compras-datatable .p-datatable-tbody > tr > td) {
  padding: 1rem;
  border-bottom: 1px solid #f3f4f6;
}

:deep(.compras-datatable .p-paginator) {
  background: #f9fafb;
  border-top: 1px solid #e5e7eb;
  padding: 1rem;
}

/* PrimeVue Card Override */
.compras-stat-card :deep(.p-card-content),
.compras-main-card :deep(.p-card-header) {
  padding: 0;
}

.compras-main-card :deep(.p-card-content) {
  padding: 1.5rem;
}

.compras-main-card :deep(.p-card-body) {
  padding: 0;
}

/* Animations */
@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Gasto Personal Dialog */
.gasto-form-grid {
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  gap: 1rem;
}
.gasto-col-6 {
  grid-column: span 6;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}
.gasto-col-12 {
  grid-column: span 12;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}
.gasto-col-6 label,
.gasto-col-12 label {
  font-size: 0.875rem;
  font-weight: 600;
  color: #374151;
}
@media (max-width: 600px) {
  .gasto-col-6 { grid-column: span 12; }
}

/* Responsive Adjustments */
@media (max-width: 768px) {
  .stat-card-content {
    padding: 1rem;
  }

  .stat-icon-wrapper {
    width: 56px;
    height: 56px;
  }

  .stat-value {
    font-size: 1.25rem;
  }

  .card-header-modern {
    padding: 1rem;
  }

  .action-btn {
    padding: 0.625rem 1rem;
    font-size: 0.875rem;
  }
}
</style>
