<script setup>
import { ref, onMounted, watch, computed,nextTick } from 'vue';
import { useRouter,useRoute } from 'vue-router';
import { toRaw } from 'vue';
const router = useRouter();
import { Chart as ChartJS } from 'chart.js/auto'
import axios from 'axios';
/*import Ticket from '../../components/cuadre.vue';*/
import * as XLSX from 'xlsx';
//import * as XLSX from 'xlsx-lite';
import jsPDF from "jspdf";
import "jspdf-autotable";
import autoTable from 'jspdf-autotable'
import {
  enviarDatosPorPost,
  eliminarDatos, 
  obtenerIdsSeleccionados,
  borrarTodoslosDatos,
  lenguajeDataTable,
  nfecha,
  arrayToObjetoFromTabla,
  peticionesFetch,
  encryptarPassword,
  envioElectron,
  decimales,
  enviarDatosLocalStorage,
  mensajetoast,
  formatearFecha,
  convertirAFechaTimestamp,
  esFechaEnRango,
  transformarFechaTimestamp,
  peticionesFetchOffline,
  peticiones,
  formatTo24HourTime,
  lasMayusculas
} from '@/funciones/funciones.js';
import bcrypt from 'bcryptjs';
import Swal from 'sweetalert2'
import { useToast } from "primevue/usetoast";
import LoadingOverlay from '@/Loading/LoadingOverlay.vue';
const toast = useToast();

 import { FechaTools } from "@/utils/fechaTools.js"

//import config from '@/@/../resources/config.json';

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
const position = 'top';
const tokenSoloUso = ref(null)
const token24H = ref(null)
/**************************************************/
const almacenesOptions = ref([]);
const almacenSeleccionado = ref(null);

const obtenerNombreAlmacenSeleccionado = () => {
  return (
    almacenSeleccionado.value?.value ||
    almacenSeleccionado.value?.label ||
    datosEmpresa?.empresa?.nombre ||
    ''
  );
};

const actualizarOpcionesAlmacenesDesdeEmpresas = (items = []) => {
  const almacenActual = datosEmpresa?.empresa?.nombre;
  const almacenes = new Set();

  if (almacenActual) {
    almacenes.add(almacenActual);
  }

  (Array.isArray(items) ? items : []).forEach((item) => {
    const nombre = typeof item === 'string' ? item : item?.nombre;
    if (nombre) {
      almacenes.add(nombre);
    }
  });

  almacenesOptions.value = Array.from(almacenes).map((almacen) => ({
    label: almacen,
    value: almacen
  }));

  if (!almacenSeleccionado.value && almacenActual) {
    almacenSeleccionado.value =
      almacenesOptions.value.find((item) => item.value === almacenActual) || null;
  }
};

const filtrarPorAlmacenSeleccionado = (items = []) => {
  const almacen = obtenerNombreAlmacenSeleccionado();
  return (Array.isArray(items) ? items : []).filter((item) => item?.almacen === almacen);
};

const cargarListaCompletaAlmacenes = async () => {
  try {
    const response = await peticionesFetchOffline('getDataAsArray', 'empresa');
    const empresas = Array.isArray(response) ? response : [];
    actualizarOpcionesAlmacenesDesdeEmpresas(empresas);
  } catch (error) {
    console.error('Error cargando lista de almacenes:', error);
  }
};
/**************************************************/
const datosEnvio = ref([])
const metas = ref([])
const gastosFijos = ref([])
const nominaArray = ref([])
const totalGastosFijos = ref(0)
/**************************************************/
const visibleSeleccionarVendedor = ref(false);
const visibleSeleccionarCliente = ref(false);
const visibleHistorialCliente = ref(false);
const historialCliente = ref(false);
const facturasCliente = ref([]);
const clienteSeleccionado = ref(null);
const searchQueryCliente = ref('');
const searchQueryVendedores = ref('');
/**************************************************/
const showTicket = ref(false)
const imeiArray = ref([])
const dataProductos = ref([])
/**************************************************/
const diasSemana = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
const resultadosPorSemana = ref({ ventas: [], ganancias: [], impuestos: [], gastos: [], devoluciones: [], abonos: [], taller: [], cuentas_cobrar: [], dias: [] }); 
const resultadosPorSemanaVista = ref(null); 
const chartDataSemana = ref(null); 
const chartOptionsSemana = ref(null); 
/**************************************************/
const contidadInicioCaja = ref(0)
const productosCliente = ref([]);
/**************************************************/
const loading = ref(true)

const ticketComponent = ref(null);

const datosConfiguracion = ref({});
const datosFactCoti = ref({});
const datosDelDia = ref({
    "venta": 0.00,
    "cuadres": [],
    "data": [],
    "efectivo": 0.00,
    "transferencia": 0.00,
    "tarjeta": 0.00,
    "ganancia": 0.00,
    "gastos": 0.00,
    "entradas": 0.00,
    "devoluciones": 0.00,
    "inicioCaja": 0.00,
    "abono": 0.00,
    "cuentasXcobrar": 0.00,
    "impuestos": 0.00,
    "nomina": 0.00,
    "costos": 0.00,
    "taller": 0.00
});

/***************************************************************/
const obtenerProductosFactura = (factura) => {
  try {
    const productos = typeof factura?.productos === 'string'
      ? JSON.parse(factura.productos || '[]')
      : factura?.productos;

    return Array.isArray(productos) ? productos : [];
  } catch (error) {
    console.error('Error al parsear productos de factura:', error, factura);
    return [];
  }
};

const calcularTotalCostosFacturas = (facturas = []) => {
  return (Array.isArray(facturas) ? facturas : []).reduce((totalFacturas, factura) => {
    const productos = obtenerProductosFactura(factura);
    const totalFactura = productos.reduce((totalProductos, producto) => {
      const cantidad = Number(producto?.cantidad || 0);
      const costoBase = producto?.costo !== undefined && producto?.costo !== null && producto?.costo !== ''
        ? producto.costo
        : producto?.precio_compra;
      const costoUnitario = Number(costoBase || 0);
      return totalProductos + (costoUnitario * cantidad);
    }, 0);

    return totalFacturas + totalFactura;
  }, 0);
};

/***************************************************************/
const facturasCount = ref({
  EFECTIVO: 0,
  TRANSFERENCIA: 0,
  TARJETA: 0,
  CREDITO: 0,
  DEVOLUCION: 0,
});

const countFacturas = async (facturas) => {
  // Inicializar el objeto facturasCount con ceros para cada método de pago
  const metodosPago = ['EFECTIVO', 'TRANSFERENCIA', 'TARJETA', 'CREDITO','DEVOLUCION'];
  metodosPago.forEach(metodo => {
    if (!facturasCount.value[metodo]) {
      facturasCount.value[metodo] = 0;
    }
  });

  // Contar las facturas por método de pago
  facturas.forEach(factura => {
    if (facturasCount.value[factura.metodo_pago] !== undefined) {
      facturasCount.value[factura.metodo_pago]++;
    }
  });

  facturas.forEach(factura => {
    if (facturasCount.value[factura.estado_factura] !== undefined) {
      facturasCount.value[factura.estado_factura]++;
    }
  });

  console.log("facturasCount.value", facturasCount.value);
};

/***************************************************************/

const visibleProductos = ref(false)
const productosPorFacturas = ref(false)

const visibleProductosModal = ref(false)
const productosFactura = ref([])

const calcularSubtotal = (producto) => {
  return producto.cantidad * producto.precio;
};

const calcularTotal = computed(() => {
  return productosFactura.value.reduce((total, producto) => total + calcularSubtotal(producto), 0);
});

const visibleTop = ref(false)
const visibleGastos = ref(false)
const visibleCategorias = ref(false)

const facturasArray = ref([])
const productosVendidos = ref([])
const nombresProductosVendidos = ref([])
const cantidadProductosVendidos = ref([])
const gastosArray = ref([])
const tallerArray = ref([])
const cuentasXcobrarArray = ref([])

const fechaHoy = ref(nfecha('fecha'));
const fechaInicio = ref(nfecha('fecha'));
const fechaFin = ref(nfecha('fecha'));
const horaInicio = ref('00:00:01');
const horaFin = ref('23:59:59');
const selectedRange = ref('HOY');
//const horaFin = ref(nfecha('horaAmericana'));

const chartData = ref({});
const chartOptions = ref({});
const chartDataDelDia = ref({});
const chartOptionsDelDia = ref({});
const chartDataPro = ref({});
const datosConfigImpresora = ref({})
const datosDelDiaArray = ref({})


const fetchImpresoraConfig = async () => {
const fechaInicioN = transformarFechaTimestamp(formatearFecha(fechaInicio.value),false);
const fechaFinN = transformarFechaTimestamp(formatearFecha(fechaFin.value),false);

/*const response = await peticionesFetch(`${link.value}${api.value}`,`datoscampo/printerconfig/nombre/POS80`,{},tokenCifrado.value,'GET');*/
const response = await peticionesFetchOffline('getDataAsArray', 'printerconfig');

datosConfigImpresora.value = response[0];


}
/************************************************************************/
const cambioFecha = async(fechaB)=>{

   if(fechaB.value === 'HOY'){
     fechaInicio.value = nfecha('fecha') 
     fechaFin.value =  nfecha('fecha')
     chartDataSemana.value = null
   }else if (fechaB.value === 'AYER'){
     fechaInicio.value = nfecha('fechaAyer') 
     fechaFin.value =  nfecha('fechaAyer')
     chartDataSemana.value = null
   }else if (fechaB.value === 'ANTIER'){
     fechaInicio.value = nfecha('fechaAnteayer') 
     fechaFin.value =  nfecha('fechaAnteayer')
     chartDataSemana.value = null
   }else if (fechaB.value === 'ESTA SEMANA'){
     const datos = nfecha('rangosemana')
     fechaInicio.value = datos.fechainicio 
     fechaFin.value =  datos.fechafin


    const resultados = await procesarDatosSemanales();
    if (resultados) {
        resultadosPorSemana.value = resultados;
        resultadosPorSemanaVista.value = resultados; 
        chartDataSemana.value = setChartDataSemana(resultados); 
        chartOptionsSemana.value = setChartOptionsSemana();
    }


   }else if (fechaB.value === 'LOS ULTIMOS 7 DIAS'){
     const datos = nfecha('rango7dias')
     fechaInicio.value = datos.fechainicio 
     fechaFin.value =  datos.fechafin
     chartDataSemana.value = null
   }else if (fechaB.value === 'LOS ULTIMOS 15 DIAS'){
     const datos = nfecha('ultimos15dias')
     const datosInicio =  datos.fechainicio.split(' ')[0].split('-')
     const datosFin =  datos.fechafin.split(' ')[0].split('-')
     fechaInicio.value = datosInicio[2]+'/'+datosInicio[1]+'/'+datosInicio[0]
     fechaFin.value =  datosFin[2]+'/'+datosFin[1]+'/'+datosFin[0]
     chartDataSemana.value = null
   }else if (fechaB.value === 'LOS ULTIMOS 30 DIAS'){
     const datos = nfecha('ultimos30dias')
     const datosInicio =  datos.fechainicio.split(' ')[0].split('-')
     const datosFin =  datos.fechafin.split(' ')[0].split('-')
     fechaInicio.value = datosInicio[2]+'/'+datosInicio[1]+'/'+datosInicio[0]
     fechaFin.value =  datosFin[2]+'/'+datosFin[1]+'/'+datosFin[0]
     chartDataSemana.value = null
   }else if (fechaB.value === 'ESTE MES'){
     const datos = nfecha('rangomes')
     fechaInicio.value = datos.fechainicio 
     fechaFin.value =  datos.fechafin
     chartDataSemana.value = null
   }else if (fechaB.value === 'ESTE ANIO'){
     fechaInicio.value = '01/01/'+ nfecha('year')
     fechaFin.value =  nfecha('fecha')
   }

   await fetchTaller()
}
/************************************************************************/
const fetchAndSetupDatosdelDia = async () => {
const fechaInicioN = transformarFechaTimestamp(formatearFecha(fechaInicio.value),false);
const fechaFinN = transformarFechaTimestamp(formatearFecha(fechaFin.value),false);

const requestData = {
  peticion: 'datosVentasPorRango',
  fechainicio: fechaInicioN+' '+horaInicio.value,
  fechafinal: fechaFinN+' '+horaFin.value
};
console.log('🔵 REQUEST ENVIADO:', requestData);

const response = await peticionesFetchOffline('datosVentasPorRango', fechaInicioN+' '+horaInicio.value,fechaFinN+' '+horaFin.value);

console.log('🟢 RESPUESTA RECIBIDA:', response);

const laFechaInicio = fechaInicioN+' '+horaInicio.value;
const laFechaFin = fechaFinN+' '+horaFin.value;

    const jsonData = {
      ...(response || {}),
      facturas: filtrarPorAlmacenSeleccionado(response?.facturas),
      gastos: filtrarPorAlmacenSeleccionado(response?.gastos),
      devoluciones: filtrarPorAlmacenSeleccionado(response?.devoluciones),
      registrocaja: filtrarPorAlmacenSeleccionado(response?.registrocaja),
      cuentas_cobrar: filtrarPorAlmacenSeleccionado(response?.cuentas_cobrar),
      taller: filtrarPorAlmacenSeleccionado(response?.taller),
      nomina: filtrarPorAlmacenSeleccionado(response?.nomina)
    };
    datosDelDiaArray.value = response;
    datosDelDia.value.data = response

    datosEnvio.value = JSON.parse(JSON.stringify(response))

const totalVentas = jsonData['facturas']
  .map(factura => Number(factura.total)) 
  .reduce((acc, total) => acc + total, 0) || 0; 

const totalGanancias = jsonData['facturas']
  .map(factura => Number(factura.ganancia)) 
  .reduce((acc, total) => acc + total, 0) || 0; 

const totalCostos = calcularTotalCostosFacturas(jsonData['facturas']);

const totalImpuestos = jsonData['facturas']
  .map(factura => Number(factura.impuesto)) 
  .reduce((acc, total) => acc + total, 0) || 0; 

const totalGastos = jsonData['gastos']
  .map(factura => Number(factura.cantidad)) 
  .reduce((acc, total) => acc + total, 0) || 0; 

const totalDevoluciones = jsonData['devoluciones']
  .map(factura => Number(factura.cantidad)) 
  .reduce((acc, total) => acc + total, 0) || 0;

const totalNomina = Array.isArray(jsonData.nomina)
  ? jsonData.nomina
      .filter(item => item?.estado === 'ACTIVA')
      .reduce((sum, item) => sum + Number(item?.total_neto_pagar || 0), 0)
  : 0;



gastosArray.value = jsonData['gastos']
nominaArray.value = jsonData['nomina']
.filter(fact=>fact.estado === 'ACTIVA');


   datosDelDia.value.venta = totalVentas;
   datosDelDia.value.ganancia = totalGanancias;
   datosDelDia.value.costos = totalCostos;
   datosDelDia.value.impuestos = totalImpuestos;
   datosDelDia.value.gastos = totalGastos;
   datosDelDia.value.devoluciones = totalDevoluciones;
   datosDelDia.value.nomina = totalNomina;

   datosDelDia.value.efectivo = jsonData['facturas']
  .filter(factura => factura.metodo_pago !== 'CREDITO')
  .map(factura => Number(factura.efectivo))
  .reduce((acc, total) => acc + total, 0) || 0;

 await countFacturas(jsonData['facturas'])
/* const met_Pago = jsonData['facturas'].map(factura=>{
    console.log("factura", factura);
   facturasCount.value[factura.metodo_pago]++;
 })*/



datosDelDia.value.tarjeta = jsonData['facturas']
  .filter(factura => factura.metodo_pago !== 'CREDITO')
  .map(factura => Number(factura.tarjeta))
  .reduce((acc, total) => acc + total, 0) || 0;

datosDelDia.value.transferencia = jsonData['facturas']
  .filter(factura => factura.metodo_pago !== 'CREDITO')
  .map(factura => Number(factura.transferencia))
  .reduce((acc, total) => acc + total, 0) || 0;


datosDelDia.value.inicioCaja = Array.isArray(jsonData.registrocaja)
  ? jsonData.registrocaja
      .map(item => Number(item?.cant_inicio || 0))
      .reduce((acc, total) => acc + total, 0)
  : 0;


  contidadInicioCaja.value = datosDelDia.value.inicioCaja

  datosDelDia.value.cuadres = jsonData['registrocaja']

 datosDelDia.value.abono = jsonData['cuentas_cobrar']
  .map(factura => Number(factura.abonado)) 
  .reduce((acc, total) => acc + total, 0) || 0; 


/*************************************************************/
datosDelDia.value.taller = jsonData['taller']
  .map(factura => {
    let totalAbono = 0;
    let abonos = [];

    try {
        abonos = JSON.parse(factura.abono);
    } catch (error) {
        console.error('Error al parsear abonos:', error);
        return 0; 
    }

    for (let abono of abonos) {
        const fechaBuscar = convertirAFechaTimestamp(abono.fecha, abono.hora);
        const estaFecha = esFechaEnRango(fechaBuscar, laFechaInicio, laFechaFin);
        if (estaFecha) {
            totalAbono += Number(abono.abono); 
            if (abono.metodo_pago === 'EFECTIVO') {
               datosDelDia.value.efectivo += Number(abono.abono);

            }else if(abono.metodo_pago === 'TARJETA'){
              datosDelDia.value.tarjeta += Number(abono.abono);

            }else{
              datosDelDia.value.transferencia += Number(abono.abono);

            }

        }
    }

    return totalAbono; 
  })
  .reduce((acc, total) => acc + total, 0) || 0;  

/*************************************************************/
  datosDelDia.value.abono = jsonData['cuentas_cobrar']
  .map(factura => {
    let totalAbono = 0;
    let abonos = [];

    try {
        abonos = JSON.parse(factura.pagos);
    } catch (error) {
        console.error('Error al parsear abonos:', error);
        return 0; 
    }

    for (let pago of abonos) {
        const fechaBuscar = convertirAFechaTimestamp(pago.fecha, pago.hora);
        const estaFecha = esFechaEnRango(fechaBuscar, laFechaInicio, laFechaFin);
        if (estaFecha) {
            totalAbono += Number(pago.cantidad); 
            if (pago.metodo === 'EFECTIVO') {
               datosDelDia.value.efectivo += Number(pago.cantidad);

            }else if(pago.metodo === 'TARJETA'){
              datosDelDia.value.tarjeta += Number(pago.cantidad);

            }else if (pago.metodo === 'TRANSFERENCIA'){
              datosDelDia.value.transferencia += Number(pago.cantidad);

            }else{
               datosDelDia.value.efectivo += Number(pago.cantidad);
            }

        }
    }

    return totalAbono; 
  })
  .reduce((acc, total) => acc + total, 0) || 0; 
/*************************************************************/
facturasArray.value = jsonData['facturas']
productosVendidos.value = jsonData['facturas'].reduce((acc, factura) => {
    const productos = obtenerProductosFactura(factura);

    productos.forEach(producto => {
        const nombre = producto.nombre;
        const existente = acc.find(item => item.nombre === nombre);
        const cantidad = parseFloat(producto.cantidad) || 0;
        const precioVenta = parseFloat(producto.precio_venta || producto.precio) || 0;
        const precioFinal = parseFloat(producto.precio_final) || precioVenta;
        const costo = parseFloat(producto.costo) || 0;
        const totalProducto = parseFloat(producto.total) || (cantidad * precioFinal);
        const precioReal = parseFloat(producto.precio_real) || 0;
        const porcentaje = parseFloat(producto.porcentaje) || 0;
        const ganancia = precioReal > 0
            ? (precioReal - costo) * cantidad
            : (precioFinal - costo) * cantidad;
        const impuesto = parseFloat(producto.impuesto || producto.impuesto_venta) || 0;
        const descuento = parseFloat(producto.descuento) || 0;

        if (existente) {
            existente.cantidad += cantidad;
            existente.total += totalProducto;
            existente.costo += costo * cantidad;
            existente.ganancia += ganancia;
            existente.impuesto += impuesto * cantidad;
            existente.descuento += descuento;
            if (precioReal > 0) existente.precio_real = precioReal;
            if (porcentaje > 0) existente.porcentaje = porcentaje;

            if (!existente.categorias.includes(producto.categoria)) {
                existente.categorias.push(producto.categoria);
            }
        } else {
            acc.push({
                nombre,
                cantidad,
                precio_venta: precioVenta,
                precio_real: precioReal,
                porcentaje,
                costo: costo * cantidad,
                total: totalProducto,
                ganancia,
                impuesto: impuesto * cantidad,
                descuento,
                categorias: [producto.categoria]
            });
        }

    });


    return acc;
}, []);

/*************************************************************/
 nombresProductosVendidos.value = productosVendidos.value.map(prod=>prod.nombre)
 cantidadProductosVendidos.value = productosVendidos.value.map(prod=>prod.cantidad)

setChartDataProductos();

console.log('🔴 RESULTADO FINAL datosDelDia:', JSON.parse(JSON.stringify(datosDelDia.value)));

   // datosDelDia.value = jsonData;

/*

          datosDelDia.value.venta,
          datosDelDia.value.ganancia,
          datosDelDia.value.impuestos,
          datosDelDia.value.gastos,
          datosDelDia.value.taller,
          datosDelDia.value.devoluciones,
          datosDelDia.value.inicioCaja,
          datosDelDia.value.abono

 */


};
/***********************************************************/
const fetchGastos = async () => {
const fechaInicioN = transformarFechaTimestamp(formatearFecha(fechaInicio.value),false);
const fechaFinN = transformarFechaTimestamp(formatearFecha(fechaFin.value),false);

/*const response = await peticionesFetch(`${link.value}${api.value}`,`datostimestamp`,{"fechainicio":fechaInicioN+' '+horaInicio.value,"fechafin":fechaFinN+' '+horaFin.value,campo:'created_at',tabla:'gastos'},tokenCifrado.value,'POST');*/
const response = await peticionesFetchOffline('getRowsByTimestampRange', 'gastos','created_at',fechaInicioN+' '+horaInicio.value,fechaFinN+' '+horaFin.value);

    const jsonData = response;
    const datosFiltrados = filtrarPorAlmacenSeleccionado(response)
    gastosArray.value = datosFiltrados;

};
/***********************************************************/
const fetchMetas = async () => {
const fechas = nfecha('rangomestimestamp')
console.log("fechas", fechas);
const response = await peticionesFetchOffline('getRowsByTimestampRange', 'metas','created_at',fechas.fechainicio,fechas.fechafin);
    const jsonData = response;
    const datosFiltrados = filtrarPorAlmacenSeleccionado(response)
    metas.value = datosFiltrados;

};
/***********************************************************/
const fetchGastosFijos = async () => {
  const fechas = nfecha('rangomestimestamp');
  const response = await peticionesFetchOffline(
    'getRowsByTimestampRange',
    'gastosfijos',
    'created_at',
    fechas.fechainicio,
    fechas.fechafin
  );

  const datosFiltrados = filtrarPorAlmacenSeleccionado(response);

  gastosFijos.value = datosFiltrados;

  // 🔹 Calcular el total de los valores
  totalGastosFijos.value = datosFiltrados.reduce(
    (acc, item) => acc + (parseFloat(item.valor) || 0),
    0
  );

  
};

/***********************************************************/
const fetchTaller = async () => {
const fechaInicioN = transformarFechaTimestamp(formatearFecha(fechaInicio.value),false);
const fechaFinN = transformarFechaTimestamp(formatearFecha(fechaFin.value),false);

/*const response = await peticionesFetch(`${link.value}${api.value}`,`datostimestamp`,{"fechainicio":fechaInicioN+' '+horaInicio.value,"fechafin":fechaFinN+' '+horaFin.value,campo:'created_at',tabla:'taller'},tokenCifrado.value,'POST');*/
const response = await peticionesFetchOffline('getRowsByTimestampRange', 'taller','updated_at',fechaInicioN+' '+horaInicio.value,fechaFinN+' '+horaFin.value);

    const jsonData = response;
    const datosFiltrados = filtrarPorAlmacenSeleccionado(response)
    tallerArray.value = datosFiltrados;
const laFechaInicio = fechaInicioN+' '+horaInicio.value;
const laFechaFin = fechaFinN+' '+horaFin.value;
/*
datosDelDia.value.taller = jsonData
  .map(factura => {
    let totalAbono = 0;
    let abonos = [];

    try {
        abonos = JSON.parse(factura.abono);
    } catch (error) {
        console.error('Error al parsear abonos:', error);
        return 0; 
    }

    for (let abono of abonos) {
        const fechaBuscar = convertirAFechaTimestamp(abono.fecha, abono.hora);
        const estaFecha = esFechaEnRango(fechaBuscar, laFechaInicio, laFechaFin);
        if (estaFecha) {
            totalAbono += Number(abono.abono); 
            if (abono.metodo_pago === 'EFECTIVO') {
               datosDelDia.value.efectivo += Number(abono.abono);

            }else if(abono.metodo_pago === 'TARJETA'){
              datosDelDia.value.tarjeta += Number(abono.abono);

            }else{
              datosDelDia.value.transferencia += Number(abono.abono);

            }

        }
    }

    return totalAbono; 
  })
  .reduce((acc, total) => acc + total, 0) || 0;  */



};
/***********************************************************/
const fetchCxC = async () => {
  try {
    const fechaInicioN = transformarFechaTimestamp(formatearFecha(fechaInicio.value), false);
    const fechaFinN = transformarFechaTimestamp(formatearFecha(fechaFin.value), false);

/*    const response = await peticionesFetch(
      `${link.value}${api.value}`,
      'datostimestamp',
      {
        "fechainicio": `${fechaInicioN} ${horaInicio.value}`,
        "fechafin": `${fechaFinN} ${horaFin.value}`,
        "campo": 'created_at',
        "tabla": 'cuentas_cobrar'
      },
      tokenCifrado.value,
      'POST'
    );*/

     const response = await peticionesFetchOffline('getRowsByTimestampRange', 'cuentas_cobrar','updated_at',fechaInicioN+' '+horaInicio.value,fechaFinN+' '+horaFin.value);

    const jsonData = filtrarPorAlmacenSeleccionado(response);

    if (Array.isArray(jsonData)) {
      cuentasXcobrarArray.value = jsonData;

      datosDelDia.value.cuentasXcobrar = jsonData
        .map(factura => Number(factura.monto_credito))
        .reduce((acc, total) => acc + total, 0) || 0;
    } else {
      console.error('La respuesta no es un array válido:', jsonData);
    }

  } catch (error) {
    console.error('Error al obtener las cuentas por cobrar:', error);
  }
};

/***********************************************************/

const fetchFacturas = async () => {
const fechaInicioN = transformarFechaTimestamp(formatearFecha(fechaInicio.value),false);
const fechaFinN = transformarFechaTimestamp(formatearFecha(fechaFin.value),false);

/*const response = await peticionesFetch(`${link.value}${api.value}`,`datostimestamp`,{"fechainicio":fechaInicioN+' '+horaInicio.value,"fechafin":fechaFinN+' '+horaFin.value,campo:'created_at',tabla:'facturas'},tokenCifrado.value,'POST');*/
const response = await peticionesFetchOffline('getRowsByTimestampRange', 'facturas','created_at',fechaInicioN+' '+horaInicio.value,fechaFinN+' '+horaFin.value);


    const jsonData = filtrarPorAlmacenSeleccionado(response)
    facturasArray.value = jsonData;
  
productosVendidos.value = jsonData.reduce((acc, factura) => {
    const productos = obtenerProductosFactura(factura);

    productos.forEach(producto => {
        const nombre = producto.nombre;
        const existente = acc.find(item => item.nombre === nombre);
        const cantidad = parseFloat(producto.cantidad) || 0;
        const precioVenta = parseFloat(producto.precio_venta || producto.precio) || 0;
        const precioFinal = parseFloat(producto.precio_final) || precioVenta;
        const costo = parseFloat(producto.costo) || 0;
        const totalProducto = parseFloat(producto.total) || (cantidad * precioFinal);
        const precioReal = parseFloat(producto.precio_real) || 0;
        const porcentaje = parseFloat(producto.porcentaje) || 0;
        const ganancia = precioReal > 0
            ? (precioReal - costo) * cantidad
            : (precioFinal - costo) * cantidad;
        const impuesto = parseFloat(producto.impuesto || producto.impuesto_venta) || 0;
        const descuento = parseFloat(producto.descuento) || 0;

        if (existente) {
            existente.cantidad += cantidad;
            existente.total += totalProducto;
            existente.costo += costo * cantidad;
            existente.ganancia += ganancia;
            existente.impuesto += impuesto * cantidad;
            existente.descuento += descuento;
            if (precioReal > 0) existente.precio_real = precioReal;
            if (porcentaje > 0) existente.porcentaje = porcentaje;

            if (!existente.categorias.includes(producto.categoria)) {
                existente.categorias.push(producto.categoria);
            }
        } else {
            acc.push({
                nombre,
                cantidad,
                precio_venta: precioVenta,
                precio_real: precioReal,
                porcentaje,
                costo: costo * cantidad,
                total: totalProducto,
                ganancia,
                impuesto: impuesto * cantidad,
                descuento,
                categorias: [producto.categoria]
            });
        }
    });

    return acc;
}, []);

 nombresProductosVendidos.value = productosVendidos.value.map(prod=>prod.nombre)
 cantidadProductosVendidos.value = productosVendidos.value.map(prod=>prod.cantidad)

setChartDataProductos();

};
/**********************************************************************/
const handleKeyDown = (event) => {
  if (event.key === 'Escape') {
      event.preventDefault(); 
      loading.value = false

  }
};
/**********************************************************************/
const actualizarTokenSoloUso = async()=>{
    const soloUso = Math.floor(1000 + Math.random() * 9000).toString();
const datosJSON = await envioElectron('datosarchivo');
  datosJSON.TOKEN_SOLOUSO = soloUso;
  try {
    const envioDatosJSON = await window.electron.ipcRenderer.invoke('actualizarjson', datosJSON);
    toast.add({ severity: 'success', summary: 'OK', detail: 'Datos Actualizados', life: 3000 });
  } catch (error) {
    console.error("Error sending data to Electron:", error);
    toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to update data', life: 3000 });
  }

}
/**********************************************************************/
const fetchDataImei = async () => {
  try {
/*    const response = await peticionesFetch(`${link.value}${api.value}`,`datosarraycondicion/imei`,{campo:'estado',valor:'DISPONIBLE'},tokenCifrado.value,'POST');*/

    const response = await peticionesFetchOffline('getDataByCondition', 'imei','estado','DISPONIBLE');


    imeiArray.value = response;
  } catch (error) {
    console.error('Error fetching data', error);
    toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to fetch data Metodo Pago', life: 3000 });
  }
};
/**********************************************************************/
const fetchAndSetupDataProductos = async () => {
/*const response = await peticionesFetch(`${link.value}${api.value}`,`datosarray/productos`,{},tokenCifrado.value,'GET');*/
const response = await peticionesFetchOffline('getDataAsArray', 'productos');
    const jsonData = response;
    dataProductos.value = jsonData;
};
/**********************************************************************/

/**********************************************************************/
onMounted(async() => {

const datosJSON = await envioElectron('datosarchivo');
link.value = datosJSON.VITE_LINKURL;
api.value = datosJSON.VITE_LINK_API;
token.value = datosJSON.VITE_TOKEN;
patronTelefono.value = datosJSON.VITE_PATRON_TELEFONO;
linkImpresora.value = datosJSON.VITE_IMPRESORA_LOCAL;
tokenCorto.value = datosJSON.VITE_TOKEN_CORTO;
tokenSoloUso.value = datosJSON.VITE_TOKEN_SOLOUSO;
token24H.value = datosJSON.VITE_TOKEN_24H;

tokenCifrado.value = await encryptarPassword(token.value, 10);


window.addEventListener('keydown', handleKeyDown);

datosConfiguracion.value = JSON.parse(window.localStorage.getItem('configuracion'))
await cargarListaCompletaAlmacenes();

await fetchCxC();

await fetchAndSetupDatosdelDia();
await fetchClientes();
await fetchUsuarios();
//datosDelDia.value
//countFacturas();

//await fetchGastos();
await fetchTaller();
await setChartDataDelDia();
await setChartOptionsDelDia();
//await fetchFacturas();
await fetchImpresoraConfig();
await fetchDataImei();
await fetchAndSetupDataProductos();

await fetchMetas()
await fetchGastosFijos()

await nextTick();
    chartData.value = setChartData();
    chartOptions.value = setChartOptions();
    chartDataDelDia.value = setChartDataDelDia();
    chartOptionsDelDia.value = setChartOptionsDelDia();

loading.value = false

});

const setChartDataProductos = () => {
  const documentStyle = getComputedStyle(document.body);
    const defaultColors = [
        '#00bcd4', '#ff9800', '#9e9e9e', '#2196f3', '#f44336', '#4caf50', '#ffeb3b', '#9c27b0'
    ];
  chartDataPro.value = {
    labels: nombresProductosVendidos.value,
    datasets: [
           {
                data: cantidadProductosVendidos.value,
                backgroundColor: [
                    documentStyle.getPropertyValue('--cyan-500') || defaultColors[0],
                    documentStyle.getPropertyValue('--orange-500') || defaultColors[1],
                    documentStyle.getPropertyValue('--gray-500') || defaultColors[2],
                    documentStyle.getPropertyValue('--blue-500') || defaultColors[3],
                    documentStyle.getPropertyValue('--red-500') || defaultColors[4],
                    documentStyle.getPropertyValue('--green-500') || defaultColors[5],
                    documentStyle.getPropertyValue('--yellow-500') || defaultColors[6],
                    documentStyle.getPropertyValue('--purple-500') || defaultColors[7]
                ],
                hoverBackgroundColor: [
                    documentStyle.getPropertyValue('--cyan-400') || defaultColors[0],
                    documentStyle.getPropertyValue('--orange-400') || defaultColors[1],
                    documentStyle.getPropertyValue('--gray-400') || defaultColors[2],
                    documentStyle.getPropertyValue('--blue-400') || defaultColors[3],
                    documentStyle.getPropertyValue('--red-400') || defaultColors[4],
                    documentStyle.getPropertyValue('--green-400') || defaultColors[5],
                    documentStyle.getPropertyValue('--yellow-400') || defaultColors[6],
                    documentStyle.getPropertyValue('--purple-400') || defaultColors[7]
                ]
            }
    ]
  };
};

const setChartData = () => {
  const documentStyle = getComputedStyle(document.body);
    const defaultColors = [
        '#00bcd4', '#ff9800', '#9e9e9e', '#2196f3', '#f44336', '#4caf50', '#ffeb3b', '#9c27b0'
    ];
  return {
    labels: ['Total de Venta', 'Ganancia', 'Costos', 'Impuestos', 'Gastos', 'Taller', 'Devoluciones', 'Inicio de Caja', 'Abono'],
    datasets: [
      {
        data: [
          datosDelDia.value.venta,
          datosDelDia.value.ganancia,
          datosDelDia.value.costos,
          datosDelDia.value.impuestos,
          datosDelDia.value.gastos,
          datosDelDia.value.taller,
          datosDelDia.value.devoluciones,
          datosDelDia.value.inicioCaja,
          datosDelDia.value.abono
        ],
                backgroundColor: [
                    documentStyle.getPropertyValue('--cyan-500') || defaultColors[0],
                    documentStyle.getPropertyValue('--orange-500') || defaultColors[1],
                    documentStyle.getPropertyValue('--gray-500') || defaultColors[2],
                    documentStyle.getPropertyValue('--blue-500') || defaultColors[3],
                    documentStyle.getPropertyValue('--red-500') || defaultColors[4],
                    documentStyle.getPropertyValue('--green-500') || defaultColors[5],
                    documentStyle.getPropertyValue('--yellow-500') || defaultColors[6],
                    documentStyle.getPropertyValue('--purple-500') || defaultColors[7],
                    '#64748b'
                ],
                hoverBackgroundColor: [
                    documentStyle.getPropertyValue('--cyan-400') || defaultColors[0],
                    documentStyle.getPropertyValue('--orange-400') || defaultColors[1],
                    documentStyle.getPropertyValue('--gray-400') || defaultColors[2],
                    documentStyle.getPropertyValue('--blue-400') || defaultColors[3],
                    documentStyle.getPropertyValue('--red-400') || defaultColors[4],
                    documentStyle.getPropertyValue('--green-400') || defaultColors[5],
                    documentStyle.getPropertyValue('--yellow-400') || defaultColors[6],
                    documentStyle.getPropertyValue('--purple-400') || defaultColors[7],
                    '#94a3b8'
                ]
      }
    ]
  };
};

const setChartOptions = () => {
  const documentStyle = getComputedStyle(document.documentElement);
  const textColor = documentStyle.getPropertyValue('--text-color');

  return {
    plugins: {
      legend: {
        labels: {
          usePointStyle: true,
          color: textColor
        }
      }
    },
    scales: {
      x: {
        beginAtZero: true,
        ticks: {
          color: textColor
        },
        grid: {
          display: false
        }
      },
      y: {
        beginAtZero: true,
        ticks: {
          color: textColor
        },
        grid: {
          color: documentStyle.getPropertyValue('--gray-200')
        }
      }
    }
  };
};

const setChartDataDelDia = () => {
    const documentStyle = getComputedStyle(document.body);
    const defaultColors = ['#00bcd4', '#ff9800', '#9e9e9e'];

    return {
        labels: ['EFECTIVO', 'TARJETA', 'TRANSFERENCIA'],
        datasets: [
            {
                data: [datosDelDia.value.efectivo, datosDelDia.value.tarjeta, datosDelDia.value.transferencia],
                backgroundColor: [
                    documentStyle.getPropertyValue('--cyan-500') || defaultColors[0],
                    documentStyle.getPropertyValue('--orange-500') || defaultColors[1],
                    documentStyle.getPropertyValue('--gray-500') || defaultColors[2]
                ],
                hoverBackgroundColor: [
                    documentStyle.getPropertyValue('--cyan-400') || defaultColors[0],
                    documentStyle.getPropertyValue('--orange-400') || defaultColors[1],
                    documentStyle.getPropertyValue('--gray-400') || defaultColors[2]
                ]
            }
        ]
    };
};

const setChartOptionsDelDia = () => {
    const documentStyle = getComputedStyle(document.documentElement);
    const textColor = documentStyle.getPropertyValue('--text-color');

    return {
        plugins: {
            legend: {
                labels: {
                    usePointStyle: true,
                    color: textColor
                }
            }
        }
    };
};

const imprimirInforme = () => {
  const fechaInicioN = transformarFechaTimestamp(formatearFecha(fechaInicio.value), false);
  const fechaFinN = transformarFechaTimestamp(formatearFecha(fechaFin.value), false);
  const impresionpagina = `${link.value}/vista/impresorareporte.php?fecha=${fechaInicioN} ${horaInicio.value}AND${fechaFinN} ${horaFin.value}&admin`;
   // window.electron.ipcRenderer.invoke('open-new-window', impresionpagina, 'url', false);
   // window.electron.ipcRenderer.invoke('open-new-window', impresionpagina, 'url', true,false);

  //const datosEmpresa = JSON.stringify(enviarDatosLocalStorage() )
  const datosUsuarioLocal = JSON.parse(window.localStorage.getItem('usuarioLocal')) 


  const peticionDatos = {
    fechainicio:fechaInicioN,
    horainicio:horaInicio.value,
    horafin:horaFin.value,
    fechafin:fechaFinN,
    taller:datosDelDia.value.taller,
    fondoinicial:datosDelDia.value.inicioCaja,
    efectivo:datosDelDia.value.efectivo,
    transferencia:datosDelDia.value.transferencia,
    tarjeta:datosDelDia.value.tarjeta,
    gastos:datosDelDia.value.gastos,
    abono:datosDelDia.value.abono,
    token:datosUsuarioLocal[0].token,
    ganancia:datosDelDia.value.ganancia,
    totalvendido:datosDelDia.value.venta,
    devoluciones:datosDelDia.value.devoluciones,
    cuentasxcobrar:datosDelDia.value.cuentasXcobrar,
    totalcontado:0.00,
    impuestos:datosDelDia.value.impuestos,
    usuario:datosEmpresa.usuario
  }

  datosDelDiaArray.value.peticion = peticionDatos

   const fechaEnviada = {
    fechainicio: fechaInicioN+' '+horaInicio.value,
    fechafin: fechaFinN+' '+horaFin.value,
    cantidadInicio:contidadInicioCaja.value
   }

         const datosEmpresaA = JSON.stringify(enviarDatosLocalStorage() )

  const nDatosEmpresa = JSON.parse(datosEmpresaA)
 
  nDatosEmpresa.usuario = datosEmpresa.usuario
  nDatosEmpresa.datoscaja = datosEnvio.value

  //const impresion = window.electron.ipcRenderer.invoke('imprimircuadre',JSON.stringify(datosDelDiaArray.value),datosEmpresa,true,false,false);
  const impresion = window.electron.ipcRenderer.invoke('imprimirCuadreCompleto',0,JSON.stringify(nDatosEmpresa),true,false,false,JSON.stringify(fechaEnviada));
          
  
};

const fnInforme607 = ()=>{

      const fechaInicioN = transformarFechaTimestamp(formatearFecha(fechaInicio.value),false);
      const fechaFinN = transformarFechaTimestamp(formatearFecha(fechaFin.value),false);
     const fechaN = `${fechaInicioN} ${horaInicio.value}AND${fechaFinN} ${horaFin.value}`;
     router.push({ path: `/informe607/${fechaN}` });
}

const updateCharts = async () => {
  loading.value = true
  await fetchAndSetupDatosdelDia();
  await fetchGastos();
  chartData.value = setChartData();
  chartOptions.value = setChartOptions();
  chartDataDelDia.value = setChartDataDelDia();
  chartOptionsDelDia.value = setChartOptionsDelDia();
  loading.value = false
};

watch([fechaInicio, fechaFin, horaInicio, horaFin], async () => {
  await updateCharts();
 // await fetchFacturas();
});

watch(almacenSeleccionado, async () => {
  if (loading.value) {
    return;
  }

  await updateCharts();
  await fetchCxC();
  await fetchFacturas();
  await fetchTaller();
  await fetchMetas();
  await fetchGastosFijos();
});

watch([datosDelDia, datosConfiguracion], () => {
  cajaData.value = {
    'Fecha': formatearFecha(fechaInicio.value)+' - '+formatearFecha(fechaFin.value),
    'Hora de Inicio': horaInicio.value,
    'Hora de Cierre': horaFin.value
  };

/*  financialData.value = {
    'Fondo Inicial': `${datosConfiguracion.value.simbolo}${datosDelDia.value.inicioCaja.toFixed(2)}`,
    'Total Devoluciones': `${datosConfiguracion.value.simbolo}${datosDelDia.value.devoluciones.toFixed(2)}`,
    'Total CXC': '$0.00',
    'Total Efectivo': `${datosConfiguracion.value.simbolo}${datosDelDia.value.efectivo.toFixed(2)}`,
    'Total Transferencia': `${datosConfiguracion.value.simbolo}${datosDelDia.value.transferencia.toFixed(2)}`,
    'Total Tarjeta': `${datosConfiguracion.value.simbolo}${datosDelDia.value.tarjeta.toFixed(2)}`,
    'Total Abonado': `${datosConfiguracion.value.simbolo}${datosDelDia.value.abono.toFixed(2)}`,
    'Total Ganancias': `${datosConfiguracion.value.simbolo}${datosDelDia.value.ganancia.toFixed(2)}`,
    'Taller': `${datosConfiguracion.value.simbolo}${datosDelDia.value.taller.toFixed(2)}`,
    'Total Vendido': `${datosConfiguracion.value.simbolo}${datosDelDia.value.venta.toFixed(2)}`,
    'Total Gastos': `${datosConfiguracion.value.simbolo}${datosDelDia.value.gastos.toFixed(2)}`,
    'CUADRE': '$92,125.68',
    'Total en Caja': '$16,855.57'
  };*/
});

const searchQueryCategorias = ref('');
const searchQuery = ref('');
const selectedProduct = ref(null);
const cm = ref(null);
  const columns = [
    { field: 'no_factura', header: 'Factura' },
    { field: 'comprobante', header: 'Comprobante' },
    { field: 'nombre_cliente', header: 'Cliente' },
    { field: 'vendedor', header: 'Vendedor' },
    { field: 'fecha_emision', header: 'Fecha' },
    { field: 'hora', header: 'Hora' },
    { field: 'subtotal', header: 'Subtotal' },
    { field: 'impuesto', header: 'Impuestos' },
    { field: 'metodo_pago', header: 'Metodo_Pago' },
    { field: 'efectivo', header: 'Efectivo' },
    { field: 'tarjeta', header: 'Tarjeta' },
    { field: 'transferencia', header: 'Transferencia' },
    { field: 'cheque', header: 'Cheque' },
    { field: 'ganancia', header: 'Ganancia' },
    { field: 'total', header: 'Total' },
  ];
  const menuModel = ref([
    {label: 'Agregar a la Venta', icon: 'pi pi-fw pi-check', command: () => /*viewProduct(selectedProduct)*/console.log(selectedProduct)}
]);
/****************************************************************************/
  function extractIMEIs(text) {
    const regex = /\((\d{15}(,\d{15})*)\)/g;
    const matches = [];
    let match;

    while ((match = regex.exec(text)) !== null) {
        const imeis = match[1].split(',');
        matches.push(...imeis);
    }

    return matches;
}
/****************************************************************************/
  const eliminarFactura = (facturaObjet) =>{

const factura = facturaObjet.no_factura;

  Swal.fire({
    title: 'Introduce la contraseña',
    input: 'password',
    inputPlaceholder: 'Contraseña',
    showCancelButton: true,
    confirmButtonText: 'Eliminar',
    cancelButtonText: 'Cancelar'
  }).then(async(result) => {
    if (result.isConfirmed) {
      const contrasenaIngresada = result.value;
      if (contrasenaIngresada === token.value || contrasenaIngresada === tokenCorto.value || contrasenaIngresada === tokenSoloUso.value || contrasenaIngresada === token24H.value) {

       if(contrasenaIngresada === tokenSoloUso.value){
          await actualizarTokenSoloUso()
       }

      if (facturaObjet) {
      const productosFactura = JSON.parse(facturaObjet.productos)
         
         for(let prod of productosFactura){

              if (prod.categoria == 'CELULARES') {

                 let listaImei = [];
                
                  if(prod.lista_imei){
                     listaImei = prod.lista_imei.split(',')
                  }else{
                    listaImei = extractIMEIs(prod.nombre)
                  }

                 for(let imei of listaImei){

                    /*const datosImei = await peticionesFetch(`${link.value}${api.value}`,`datoscampo/imei/imei/${imei}`,{},tokenCifrado.value,'GET');*/
                    const datosImei = await peticionesFetchOffline('getDataByField', 'imei','imei',imei);

                    if(datosImei){
                      datosImei.estado = 'DISPONIBLE';
                      datosImei.comprador = '';
                      datosImei.fecha_venta = '';
                      datosImei.hora_venta = '';
                          const url = link.value+api.value+"/actualizarcampos/imei";
                            if (datosImei.hasOwnProperty('created_at')) {
                            datosImei.updated_at = nfecha('timestamp')
                          }
                         /*  const envioDatos = await enviarDatosPorPost(url, datosImei,tokenCifrado.value);*/
                           const envioDatos = await peticionesFetchOffline('updateData', 'imei',JSON.stringify(datosImei));
                           await fetchDataImei()
                           const stockProducto = imeiArray.value.filter(prod=>prod.id_equi == datosImei.id_equi)
                           
                           const datosProdArray = dataProductos.value.find(prod=>prod.id == datosImei.id_equi)

                           if (datosProdArray) {

                          const urlProd = link.value+api.value+"/actualizarcampos/productos";
                            if (datosProdArray.hasOwnProperty('created_at')) {
                              datosProdArray.updated_at = nfecha('timestamp')
                          }

                           datosProdArray.stock = stockProducto.length
                     /*     const envioDatosProd = await enviarDatosPorPost(urlProd, datosProdArray,tokenCifrado.value);*/
                          const envioDatosProd = await peticionesFetchOffline('updateData', 'productos',JSON.stringify(datosProdArray));
                           if (envioDatosProd[0] == 'ok') {
                            toast.add({ severity: 'success', summary: 'Éxito', detail: 'Producto Restaurado correctamente', life: 3000 });
                           }
                        }
                    }


                 }
              }else{
                
                const datosProdArray = dataProductos.value.find(producto=>producto.codigo == prod.codigo)
            
                if (datosProdArray) {

                        const urlProd = link.value+api.value+"/actualizarcampos/productos";
                          if (datosProdArray.hasOwnProperty('created_at')) {
                            datosProdArray.updated_at = nfecha('timestamp')
                        }

                          datosProdArray.stock = (Number(datosProdArray.stock) + Number(prod.cantidad))
                      /*  const envioDatosProd = await enviarDatosPorPost(urlProd, datosProdArray,tokenCifrado.value);*/
                        const envioDatosProd = await peticionesFetchOffline('updateData', 'productos',JSON.stringify(datosProdArray));

                         if (envioDatosProd[0] == 'ok') {
                          toast.add({ severity: 'success', summary: 'Éxito', detail: 'Producto Restaurado correctamente', life: 3000 });
                         }
                
                }



              }

              await fetchAndSetupDatosdelDia()
         }

                         if(facturaObjet.metodo_pago === 'CREDITO'){
                     /*       const datosCredito = await peticionesFetch(`${link.value}${api.value}`, `datoscampo/cuentas_cobrar/no_factura/${facturaObjet.no_factura}`, {}, tokenCifrado.value, 'GET');*/
                            const datosCredito = await peticionesFetchOffline('getDataByField', 'cuentas_cobrar','no_factura',facturaObjet.no_factura);
                            if(datosCredito){
                             /*   const datosFacturaCredito = await peticionesFetch(`${link.value}${api.value}`, `borrarporcampo/cuentas_cobrar`, { campo: 'id', valor: datosCredito.id }, tokenCifrado.value, 'POST');*/
                                const datosFacturaCredito = await peticionesFetchOffline('deleteEntry', 'cuentas_cobrar',datosCredito.id);

                             if (datosFacturaCredito[0] == 'ok') {
                                toast.add({ severity: 'success', summary: 'Éxito', detail: 'Datos CREDITO eliminados correctamente', life: 3000 });
                             }


                            }

                         }
      }


 /*     const datosFactura = await peticionesFetch(`${link.value}${api.value}`,`borrarporcampo/facturas`,{campo:'no_factura',valor:factura},tokenCifrado.value,'POST');*/
      const datosFactura = await peticionesFetchOffline('deleteByField', 'facturas','no_factura',factura);

      if (datosFactura[0]=='ok') {

           toast.add({ severity: 'success', summary: 'Éxito', detail: 'Factura eliminada correctamente', life: 3000 });
           await fetchAndSetupDatosdelDia()
      }else{
          toast.add({ severity: 'error', summary: 'Error', detail: 'Error al eliminar la Factura', life: 3000 });
      }

      } else {
        toast.add({ severity: 'error', summary: 'Error', detail: 'Contraseña incorrecta', life: 3000 });
      }
    }
  });
}
/****************************************************************************/
const onRowSelect = (event) => {
    const texto = `<div><h2>No: ${event.data.no_factura}</h2><p><b>${event.data.nombre_cliente}</b></p></div>`;
Swal.fire({
    title: 'Factura Seleccionada',
    html: texto,
    icon: 'info',
    showCancelButton: true,
    confirmButtonText: 'Imprimir',
    cancelButtonText: 'Productos',
    showDenyButton: true,  // Show another button
    denyButtonText: 'Eliminar', // Text for the "Eliminar" button
}).then((result) => {
    if (result.isConfirmed) {
        // Imprimir logic
        var impresionpagina = link.value + '/vista/impresoratermica.php?factura=' + event.data.no_factura;
       // window.electron.ipcRenderer.invoke('open-new-window', impresionpagina, 'url', true, false);
         const datosEmpresa = JSON.stringify(enviarDatosLocalStorage() )
         window.electron.ipcRenderer.invoke('ticket',event.data.no_factura,datosEmpresa);
    } else if (result.isDenied) {
        // Eliminar logic with password prompt
            Swal.fire({
                title: 'Introduce la contraseña',
                input: 'password',
                inputPlaceholder: 'Contraseña',
                showCancelButton: true,
                confirmButtonText: 'Eliminar',
                cancelButtonText: 'Cancelar'
            }).then(async (result) => {
               await eliminarFactura(event.data)
            });
    } else if (result.dismiss === Swal.DismissReason.cancel) {
       
          visibleProductosModal.value = true;
          productosFactura.value = JSON.parse(event.data.productos)
    }
});

};
/******************************************************************************/
const filteredProducts = computed(() => {
    if (!searchQuery.value) return productosVendidos.value;
    return productosVendidos.value.filter(product => {
      return Object.values(product).some(value =>
        String(value).toLowerCase().includes(searchQuery.value.toLowerCase())
      );
    });
});


const totalesProductosVendidos = computed(() => {
    const productos = filteredProducts.value;
    return {
        cantidad: productos.reduce((sum, p) => sum + (p.cantidad || 0), 0),
        costo: productos.reduce((sum, p) => sum + (parseFloat(p.costo) || 0), 0),
        total: productos.reduce((sum, p) => sum + (p.total || 0), 0),
        ganancia: productos.reduce((sum, p) => sum + (p.ganancia || 0), 0),
        impuesto: productos.reduce((sum, p) => sum + (p.impuesto || 0), 0),
        descuento: productos.reduce((sum, p) => sum + (p.descuento || 0), 0)
    };
});

const categoriasVendidas = computed(() => {
    const categoriasMap = {};

    productosVendidos.value.forEach(producto => {
        producto.categorias.forEach(categoria => {
            if (!categoriasMap[categoria]) {
                categoriasMap[categoria] = { cantidad: 0, total: 0 };
            }
            categoriasMap[categoria].cantidad += producto.cantidad;
            categoriasMap[categoria].total += producto.total; // Asegurando que el total se acumule correctamente
        });
    });

    return Object.entries(categoriasMap).map(([nombre, datos]) => ({
        nombre,
        cantidad: datos.cantidad,
        total: datos.total
    }));
});


const filteredCategorias = computed(() => {
    if (!searchQueryCategorias.value) return categoriasVendidas.value;
    return categoriasVendidas.value.filter(categoria => {
        return categoria.nombre.toLowerCase().includes(searchQueryCategorias.value.toLowerCase());
    });
});

const fnGastos = async()=>{
    visibleGastos.value = true
}

const rowClass = (data) => {
  switch(data.metodo_pago) {
    case 'EFECTIVO':
      return 'metodo-pago-efectivo';
    case 'TARJETA':
      return 'metodo-pago-tarjeta';
    case 'TRANSFERENCIA':
      return 'metodo-pago-transferencia';
    default:
      return '';
  }
};

const cajaData = ref({
  'Fecha': fechaInicio.value+' - '+fechaFin.value,
  'Hora de Inicio': horaInicio.value,
  'Hora de Cierre': horaFin.value
});

/*const financialData = ref({
  'Fondo Inicial': `${datosConfiguracion.value.simbolo}${datosDelDia.value.inicioCaja.toFixed(2)}`,
  'Total Devoluciones': `${datosConfiguracion.value.simbolo}${datosDelDia.value.devoluciones.toFixed(2)}`,
  'Total CXC': '$0.00',
  'Total Efectivo': `${datosConfiguracion.value.simbolo}${datosDelDia.value.efectivo.toFixed(2)}`,
  'Total Transferencia': `${datosConfiguracion.value.simbolo}${datosDelDia.value.transferencia.toFixed(2)}`,
  'Total Tarjeta': `${datosConfiguracion.value.simbolo}${datosDelDia.value.tarjeta.toFixed(2)}`,
  'Total Abonado': `${datosConfiguracion.value.simbolo}${datosDelDia.value.abono.toFixed(2)}`,
  'Total Ganancias': `${datosConfiguracion.value.simbolo}${datosDelDia.value.ganancia.toFixed(2)}`,
  'Taller': `${datosConfiguracion.value.simbolo}${datosDelDia.value.taller.toFixed(2)}`,
  'Total Vendido': `${datosConfiguracion.value.simbolo}${datosDelDia.value.venta.toFixed(2)}`,
  'Total Gastos': `${datosConfiguracion.value.simbolo}${datosDelDia.value.gastos.toFixed(2)}`,
  'CUADRE': '$92,125.68',
  'Total en Caja': '$16,855.57'
});*/

const qrSrc = 'temp/QR6175973930ca0e3415b486e8f732b507.png';

const ticketRef = ref(null);

const printChildTicket = () => {
  if (ticketComponent.value) {
    const ticketHTML = ticketComponent.value.$refs.ticketContent.innerHTML;
    ipcRenderer.send('print-ticket', ticketHTML);
  }
};

const imprimirCuadre = () => {
  //showTicket.value = true;
    imprimirInforme();
/*  nextTick(() => {
  });*/
};

/************************************************************/
/*const imprimirTaller = async()=>{
  await fetchTaller()
  const fechaInicioN = transformarFechaTimestamp(formatearFecha(fechaInicio.value), false);
  const fechaFinN = transformarFechaTimestamp(formatearFecha(fechaFin.value), false);

const datosEnviar = {
fechaInicio:`${fechaInicioN} ${horaInicio.value}`,
fechaFin:`${fechaFinN} ${horaFin.value}`,
solicitante:datosEmpresa.usuario.nombre
}

const datos = tallerArray.value
console.log("datos", datos);


}*/
/************************************************************/
const generarReporteTaller = async () => {
  await fetchTaller();

  const reporte = {
    totalOrdenes: 0,
    totalClientes: 0,
    totalOrdenesDinero: 0,
    totalAbonos: 0,
    totalSaldo: 0,
    estados: {},
    metodosPago: {},
    resumenEquipos: {},
    listadoEquipos: []   // 👈 nuevo array detallado
  };

  const clientesSet = new Set();

  tallerArray.value.forEach((orden) => {
    reporte.totalOrdenes++;
    clientesSet.add(orden.cedula || orden.nombre);

    reporte.totalOrdenesDinero += parseFloat(orden.total || 0);
    reporte.totalSaldo += parseFloat(orden.saldo || 0);

    // Parsear abonos
    if (orden.abono) {
      try {
        const abonos = JSON.parse(orden.abono);
        abonos.forEach((a) => {
          reporte.totalAbonos += parseFloat(a.abono || 0);
        });
      } catch (e) {
        console.warn("Error parseando abonos", e);
      }
    }

    // Estado
    const estado = orden.estado || "SIN ESTADO";
    reporte.estados[estado] = (reporte.estados[estado] || 0) + 1;

    // Método de pago
    const metodo = orden.metodopago || "SIN MÉTODO";
    reporte.metodosPago[metodo] =
      (reporte.metodosPago[metodo] || 0) + parseFloat(orden.total || 0);

    // Resumen de equipos
    const equipo = orden.equipo || "SIN EQUIPO";
    reporte.resumenEquipos[equipo] =
      (reporte.resumenEquipos[equipo] || 0) + 1;

    // Listado detallado
    reporte.listadoEquipos.push({
      equipo: orden.equipo || "N/A",
      marca: orden.marca || "N/A",
      modelo: orden.modelo || "N/A",
      imei: orden.imei || orden.serial || "N/A",
      estado: orden.estado || "N/A"
    });
  });

  reporte.totalClientes = clientesSet.size;
  return reporte;
};

 const imprimirTaller = async () => {
  const reporte = await generarReporteTaller();

  const doc = new jsPDF({
    orientation: "portrait",
    unit: "pt",
    format: [226.77, 1000],
  });

  const fechaGeneracion = new Date().toLocaleString();

  // Encabezado
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text(datosEmpresa.empresa.nombre, 113, 30, { align: "center" });
  doc.setFontSize(10);
  doc.text("REPORTE DE TALLER", 113, 40, { align: "center" });

  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text(`Generado: ${fechaGeneracion}`, 113, 50, { align: "center" });
  doc.line(10, 55, 216, 55);

  // Totales generales
  autoTable(doc, {
    startY: 65,
    theme: "plain",
    styles: { fontSize: 9 },
    head: [["Detalle", "Valor"]],
    body: [
      ["Órdenes", reporte.totalOrdenes],
      ["Clientes", reporte.totalClientes],
      ["Total en órdenes", reporte.totalOrdenesDinero.toFixed(2)],
      ["Total abonos", reporte.totalAbonos.toFixed(2)],
      ["Saldo pendiente", reporte.totalSaldo.toFixed(2)],
    ],
  });

  // Estados
  autoTable(doc, {
    startY: doc.lastAutoTable.finalY + 10,
    theme: "grid",
    head: [["Estado", "Cantidad"]],
    body: Object.entries(reporte.estados),
    styles: { fontSize: 8 },
  });

  // Métodos de pago
  autoTable(doc, {
    startY: doc.lastAutoTable.finalY + 10,
    theme: "grid",
    head: [["Método de pago", "Total"]],
    body: Object.entries(reporte.metodosPago).map(([met, total]) => [
      met,
      total.toFixed(2),
    ]),
    styles: { fontSize: 8 },
  });

  // Resumen de equipos
  autoTable(doc, {
    startY: doc.lastAutoTable.finalY + 10,
    theme: "grid",
    head: [["Equipo", "Cantidad"]],
    body: Object.entries(reporte.resumenEquipos),
    styles: { fontSize: 8 },
  });

  // Listado detallado de equipos
  autoTable(doc, {
    startY: doc.lastAutoTable.finalY + 15,
    theme: "grid",
    head: [["Equipo", "Marca", "Modelo", "IMEI/Serial", "Estado"]],
    body: reporte.listadoEquipos.map(eq => [
      eq.equipo,
      eq.marca,
      eq.modelo,
      eq.imei,
      eq.estado,
    ]),
    styles: { fontSize: 7 },
    headStyles: { fillColor: [40, 167, 69] } // verde tipo Bootstrap
  });

  const pdfDataUri = doc.output("datauristring");

  Swal.fire({
    title: "Reporte de Taller",
    width: 350,
    html: `
      <embed src="${pdfDataUri}" type="application/pdf" width="100%" height="400px" />
    `,
    showCloseButton: true,
    showCancelButton: true,
    focusConfirm: false,
    confirmButtonText: "Descargar PDF",
    cancelButtonText: "Cerrar",
  }).then((result) => {
    if (result.isConfirmed) {
      const link = document.createElement("a");
      link.href = pdfDataUri;
      link.download = "reporte_taller.pdf";
      link.click();
    }
  });
};
/************************************************************/
const fnVerCuadre = ()=>{

  const fechaInicioN = transformarFechaTimestamp(formatearFecha(fechaInicio.value), false);
  const fechaFinN = transformarFechaTimestamp(formatearFecha(fechaFin.value), false);
  const impresionpagina = `${link.value}/vista/impresorareporte.php?fecha=${fechaInicioN} ${horaInicio.value}AND${fechaFinN} ${horaFin.value}&admin`;

  const datosUsuarioLocal = JSON.parse(window.localStorage.getItem('usuarioLocal')) 


  const peticionDatos = {
    fechainicio:fechaInicioN,
    horainicio:horaInicio.value,
    horafin:horaFin.value,
    fechafin:fechaFinN,
    taller:datosDelDia.value.taller,
    cuentasxcobrar:datosDelDia.value.cuentasXcobrar,
    fondoinicial:datosDelDia.value.inicioCaja,
    efectivo:datosDelDia.value.efectivo,
    transferencia:datosDelDia.value.transferencia,
    tarjeta:datosDelDia.value.tarjeta,
    gastos:datosDelDia.value.gastos,
    abono:datosDelDia.value.abono,
    token:datosUsuarioLocal[0].token,
    ganancia:datosDelDia.value.ganancia,
    totalvendido:datosDelDia.value.venta,
    devoluciones:datosDelDia.value.devoluciones,
    totalcontado:0.00,
    impuestos:datosDelDia.value.impuestos,
    usuario:datosUsuarioLocal[0].nombre
  }

  datosDelDiaArray.value.peticion = peticionDatos

   const fechaEnviada = {
    fechainicio: fechaInicioN+' '+horaInicio.value,
    fechafin: fechaFinN+' '+horaFin.value,
    cantidadInicio:contidadInicioCaja.value
   }


      if(window.electron){
         const datosEmpresaA = JSON.stringify(enviarDatosLocalStorage() )

  const nDatosEmpresa = JSON.parse(datosEmpresaA)
  nDatosEmpresa.usuario = datosEmpresa.usuario
  nDatosEmpresa.datoscaja = datosEnvio.value

         const impresion = window.electron.ipcRenderer.invoke('imprimirCuadreCompleto',0,JSON.stringify(nDatosEmpresa),false,false,true,JSON.stringify(fechaEnviada));
       }else{
         generarPDFTicket()
    
     }


}
/************************************************************/
const clientesData = ref([]);
const fetchClientes = async () => {
  try {
    const response = await peticionesFetchOffline('getDataAsArray', 'clientes');

    clientesData.value = response;

  } catch (error) {
    toast.add({ 
      severity: 'error', 
      summary: 'Error', 
      detail: 'Failed to fetch data from clientes', 
      life: 3000 
    });
  }
};

/************************************************************/
const vendedoresData = ref([]);
const usuariosData = ref([]);
const fetchUsuarios = async () => {
  try {
    const response = await peticionesFetchOffline('getDataAsArray', 'usuarios');

    usuariosData.value = response;
    vendedoresData.value = response.filter(users=>users.nivel_seguridad === 'Vendedor');

  } catch (error) {
    toast.add({ 
      severity: 'error', 
      summary: 'Error', 
      detail: 'Failed to fetch data from clientes', 
      life: 3000 
    });
  }
};
/************************************************************/
const fnDescargarComprobantes = async (e) => {
    e.preventDefault();
    loading.value = true;

    const fechaInicioN = transformarFechaTimestamp(formatearFecha(fechaInicio.value), false);
    const fechaFinN = transformarFechaTimestamp(formatearFecha(fechaFin.value), false);
    
    await fetchClientes(); // Asegurarse de cargar los datos de los clientes
    
/*    const response = await peticionesFetch(
        `${link.value}${api.value}`,
        `datostimestamp`,
        {
            fechainicio: fechaInicioN + ' ' + horaInicio.value,
            fechafin: fechaFinN + ' ' + horaFin.value,
            campo: 'created_at',
            tabla: 'facturas'
        },
        tokenCifrado.value,
        'POST'
    );*/

    const response = await peticionesFetchOffline('getRowsByTimestampRange', 'facturas','created_at',fechaInicioN + ' ' + horaInicio.value,fechaFinN + ' ' + horaFin.value);

    if (response) {
      const jsonData = response.filter(ft=>ft.almacen === datosEmpresa.empresa.nombre)
        // Filtrar las facturas para excluir las que tienen "SIN COMPROBANTE"
        const facturasFiltradas = jsonData.filter(item => item.comprobante !== 'SIN COMPROBANTE');

        // Mapear los datos transformados
        const data = facturasFiltradas.map(item => {
            const clienteEncontrado = clientesData.value.find(dato => dato.codigo === item.cod_cliente);
            return {
                fecha: item.fecha_emision,
                cliente: item.nombre_cliente,
                rnc_cliente: clienteEncontrado ? clienteEncontrado.cedula : 'N/A', // Devolver solo el RNC
                comprobante: item.comprobante,
                forma_pago: item.metodo_pago,
                ganancia: item.ganancia,
                impuestos: item.impuesto,
                total: item.total
            };
        });

        loading.value = false;

        // Crear hoja de cálculo y descargar el archivo Excel
        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Facturas');

        const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
        const blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
        const link = document.createElement('a');
        link.href = window.URL.createObjectURL(blob);
        link.download = 'facturas.xlsx';
        link.click();
    } else {
        console.error('No data returned from API');
        loading.value = false;
    }
};

/************************************************************/
const fnDescargarFacturas = async (e) => {
    e.preventDefault();
    loading.value = true;
    const fechaInicioN = transformarFechaTimestamp(formatearFecha(fechaInicio.value), false);
    const fechaFinN = transformarFechaTimestamp(formatearFecha(fechaFin.value), false);

    const response = await peticionesFetchOffline('getRowsByTimestampRange', 'facturas','created_at',fechaInicioN + ' ' + horaInicio.value,fechaFinN + ' ' + horaFin.value);

    if (response.length > 0) {
       const datosFiltrados = response.filter(ft=>ft.almacen === datosEmpresa.empresa.nombre)
        const data = datosFiltrados.map(item => {
            // Parsear los productos si vienen como string JSON
            const productos = typeof item.productos === 'string' ? JSON.parse(item.productos) : item.productos;

            // Formatear los productos en una cadena de texto legible
            const productosTexto = productos.map(producto => (
                `Nombre: ${producto.nombre}, Cantidad: ${producto.cantidad}, Precio Venta: ${producto.precio_venta}, Costo: ${producto.costo}, Impuesto: ${producto.impuesto}, Ganancia: ${producto.ganancia}`
            )).join('\n');

            return {
                fecha: item.fecha_emision,
                no_factura: item.no_factura,
                cliente: item.nombre_cliente,
                productos: productosTexto,
                rnc_cliente: item.rnc_cliente, // Corregir el campo a rnc_cliente
                comprobante: item.comprobante,
                forma_pago: item.metodo_pago,
                ganancia: item.ganancia,
                financiera: item.financiera,
                impuestos: item.impuesto,
                total: parseFloat(item.total) // Asegurarse que es numérico
            };
        });

        // Calcular la suma total de los totales
        const totalGeneral = data.reduce((acc, item) => acc + (Number(item.total) || 0), 0);

        // Añadir una fila al final con el total general
        data.push({
            fecha: '',
            no_factura: '',
            cliente: '',
            productos: '',
            rnc_cliente: '',
            comprobante: '',
            forma_pago: '',
            ganancia: '',
            financiera: '',
            impuestos: '',
            total: `TOTAL GENERAL: ${totalGeneral.toFixed(2)}`
        });

        loading.value = false;

        // Create a worksheet and then an Excel workbook
        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Facturas');

        // Generate a binary Excel file
        const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });

        // Create a Blob from the binary data and download the file
        const blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
        const link = document.createElement('a');
        link.href = window.URL.createObjectURL(blob);
        link.download = 'facturas.xlsx';
        link.click();
    } else {
        console.error('No data returned from API');
        loading.value = false;
    }
};


/************************************************************/
const fnDescargarGastos = async (e) => {
    e.preventDefault()
    loading.value = true;
  const fechaInicioN = transformarFechaTimestamp(formatearFecha(fechaInicio.value), false);
  const fechaFinN = transformarFechaTimestamp(formatearFecha(fechaFin.value), false);

/*    const response = await peticionesFetch(
        `${link.value}${api.value}`,
        `datostimestamp`,
        {
            fechainicio: fechaInicioN + ' ' + horaInicio.value,
            fechafin: fechaFinN + ' ' + horaFin.value,
            campo: 'created_at',
            tabla: 'gastos'
        },
        tokenCifrado.value,
        'POST'
    );*/

     const response = await peticionesFetchOffline('getRowsByTimestampRange', 'gastos','created_at',fechaInicioN + ' ' + horaInicio.value,fechaFinN + ' ' + horaFin.value);

    if (response) {
      const datosFiltrados = response.filter(ft=>ft.almacen === datosEmpresa.empresa.nombre)
        const data = datosFiltrados.map(item => ({
            fecha: item.fecha,
            hora: item.hora,
            cantidad: item.cantidad,
            descripcion: item.descripcion,

        }));
       loading.value = false;
        // Create a worksheet and then an Excel workbook
        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Gastos');

        // Generate a binary Excel file
        const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });

        // Create a Blob from the binary data and download the file
        const blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
        const link = document.createElement('a');
        link.href = window.URL.createObjectURL(blob);
        link.download = 'gastos.xlsx';
        link.click();
    } else {
        console.error('No data returned from API');
          loading.value = false;
    }
};
/************************************************************/
//fnDescargarCompras
const fnDescargarCompras = async (e) => {
    e.preventDefault()
    loading.value = true;
  const fechaInicioN = transformarFechaTimestamp(formatearFecha(fechaInicio.value), false);
  const fechaFinN = transformarFechaTimestamp(formatearFecha(fechaFin.value), false);

/*    const response = await peticionesFetch(
        `${link.value}${api.value}`,
        `datostimestamp`,
        {
            fechainicio: fechaInicioN + ' ' + horaInicio.value,
            fechafin: fechaFinN + ' ' + horaFin.value,
            campo: 'created_at',
            tabla: 'compras'
        },
        tokenCifrado.value,
        'POST'
    );
*/
  const response = await peticionesFetchOffline('getRowsByTimestampRange', 'compras','created_at',fechaInicioN + ' ' + horaInicio.value,fechaFinN + ' ' + horaFin.value);

    if (response) {
      const datosFiltrados = response.filter(ft=>ft.almacen === datosEmpresa.empresa.nombre)
        const data = datosFiltrados.map(item => ({
            fecha: item.fecha,
            proveedor: item.proveedor,
            rnc_proveedor: item.rnc_proveedor,
            no_factura: item.no_factura,
            comprobante: item.ncf_proveedor,
            estado: item.estado,
            impuestos: item.impuesto,
            total: item.total
        }));
       loading.value = false;
        // Create a worksheet and then an Excel workbook
        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Compras');

        // Generate a binary Excel file
        const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });

        // Create a Blob from the binary data and download the file
        const blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
        const link = document.createElement('a');
        link.href = window.URL.createObjectURL(blob);
        link.download = 'compras.xlsx';
        link.click();
    } else {
        console.error('No data returned from API');
          loading.value = false;
    }
};
/***********************************************************************************/
const fnDescargarCXP = ()=>{

}
/***********************************************************************************/
//fnDescargarCXC
//fnDescargarCXP
//fnDescargarTaller

const fnDescargarCXC = async (e) => {
    if(e){
       e.preventDefault()
    }
    loading.value = true;
  const fechaInicioN = transformarFechaTimestamp(formatearFecha(fechaInicio.value), false);
  const fechaFinN = transformarFechaTimestamp(formatearFecha(fechaFin.value), false);

/*    const response = await peticionesFetch(
        `${link.value}${api.value}`,
        `datostimestamp`,
        {
            fechainicio: fechaInicioN + ' ' + horaInicio.value,
            fechafin: fechaFinN + ' ' + horaFin.value,
            campo: 'created_at',
            tabla: 'cuentas_cobrar'
        },
        tokenCifrado.value,
        'POST'
    );*/

 const response = await peticionesFetchOffline('getRowsByTimestampRange', 'cuentas_cobrar','updated_at',fechaInicioN + ' ' + horaInicio.value,fechaFinN + ' ' + horaFin.value);

    if (response) {
        const datosFiltrados = response.filter(ft=>ft.almacen === datosEmpresa.empresa.nombre)
        const data = datosFiltrados.map(item => ({
            fecha: item.fecha_emision,
            hora: item.hora,
            no_emision: item.no_emision,
            no_factura: item.no_factura,
            cliente: item.nombre_cliente,
            rnc_cliente: item.rnc_cliente,
            monto_credito: item.monto_credito,
            pagado: item.cuotas,
            pendiente: item.saldo,
            estado: item.estatus
        }));
       loading.value = false;
        // Create a worksheet and then an Excel workbook
        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'CXC');

        // Generate a binary Excel file
        const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });

        // Create a Blob from the binary data and download the file
        const blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
        const link = document.createElement('a');
        link.href = window.URL.createObjectURL(blob);
        link.download = 'cuentasxcobrar.xlsx';
        link.click();
    } else {
        console.error('No data returned from API');
          loading.value = false;
    }
};
/***********************************************************************************/
const fnDescargarTaller = async (e) => {
    e.preventDefault()
    loading.value = true;
  const fechaInicioN = transformarFechaTimestamp(formatearFecha(fechaInicio.value), false);
  const fechaFinN = transformarFechaTimestamp(formatearFecha(fechaFin.value), false);

/*    const response = await peticionesFetch(
        `${link.value}${api.value}`,
        `datostimestamp`,
        {
            fechainicio: fechaInicioN + ' ' + horaInicio.value,
            fechafin: fechaFinN + ' ' + horaFin.value,
            campo: 'created_at',
            tabla: 'taller'
        },
        tokenCifrado.value,
        'POST'
    );*/
 const response = await peticionesFetchOffline('getRowsByTimestampRange', 'taller','updated_at',fechaInicioN + ' ' + horaInicio.value,fechaFinN + ' ' + horaFin.value);

    if (response) {
        const datosFiltrados = response.filter(ft=>ft.almacen === datosEmpresa.empresa.nombre)
        const data = datosFiltrados.map(item => {
            const total = Number(item.total) || 0;
            const saldo = Number(item.saldo) || 0;
            const abono = total - saldo;
            const fallas = JSON.parse(item.fallas).map(falla=>falla.propiedad).join(',')

            return {
                fecha: item.fecha_entrada,
                fecha_entrega: item.fecha_entrega,
                no_orden: item.no_factura,
                cliente: item.nombre,
                equipo: item.equipo,
                marca: item.marca,
                modelo: item.modelo,
                serial: item.serial,
                fallas: fallas,
                imei: item.imei,
                precio_piezas: item.preciopiezas,
                beneficio_empresa: item.beneficio_empresa,
                beneficio_tecnico: item.beneficio_tecnico,
                tecnico: item.tecnico,
                pago_tecnico: item.pago_tecnico,
                observaciones: item.observaciones,
                abono: abono, // The calculated abono value
                saldo: item.saldo,
                total: item.total,
                estado: item.estado
            };
        });
       loading.value = false;


        // Create a worksheet and then an Excel workbook
        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Taller');

        // Generate a binary Excel file
        const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });

        // Create a Blob from the binary data and download the file
        const blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
        const link = document.createElement('a');
        link.href = window.URL.createObjectURL(blob);
        link.download = 'taller.xlsx';
        link.click();
    } else {
        console.error('No data returned from API');
          loading.value = false;
    }
};
/***********************************************************************************/
const fnPrueba = async()=>{
   // ticket

   //const datos = await window.electron.ipcRenderer.invoke('consultarRNC','133023539');
  // const datos = await window.electron.ipcRenderer.invoke('consultarPasaporte','22301507665');
   const pregunta = 'Generate a Javascript function that adds two numbers';
   const datos = await window.electron.ipcRenderer.invoke('chatGpt',pregunta);
   console.log("datos", datos);

}
/***********************************************************************************/
const onRowSelectFactura = (event) => {
  productosPorFacturas.value = false;
  const datosFactura = facturasArray.value.find(fact=>fact.no_factura == event.data.facturaNumero);
    event.data = datosFactura;
    const texto = `<div><h2>No: ${event.data.no_factura}</h2><p><b>${event.data.nombre_cliente}</b></p></div>`;
Swal.fire({
    title: 'Factura Seleccionada',
    html: texto,
    icon: 'info',
    showCancelButton: true,
    confirmButtonText: 'Imprimir',
    cancelButtonText: 'Productos',
    showDenyButton: true,  // Show another button
    denyButtonText: 'Eliminar', // Text for the "Eliminar" button
}).then((result) => {
    if (result.isConfirmed) {
        // Imprimir logic
        var impresionpagina = link.value + '/vista/impresoratermica.php?factura=' + event.data.no_factura;
       // window.electron.ipcRenderer.invoke('open-new-window', impresionpagina, 'url', true, false);
         const datosEmpresa = JSON.stringify(enviarDatosLocalStorage() )
         window.electron.ipcRenderer.invoke('ticket',event.data.no_factura,datosEmpresa);
    } else if (result.isDenied) {
        // Eliminar logic with password prompt
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
                        const datosFactura = await peticionesFetch(`${link.value}${api.value}`, `borrarporcampo/facturas`, { campo: 'id', valor: event.data.id }, tokenCifrado.value, 'POST');
                        if (datosFactura[0] == 'ok') {
                            toast.add({ severity: 'success', summary: 'Éxito', detail: 'Datos eliminados correctamente', life: 3000 });
                           await fetchAndSetupDatosdelDia();
                        } else {
                            toast.add({ severity: 'error', summary: 'Error', detail: 'Error al eliminar los datos', life: 3000 });
                        }
                    } else {
                        toast.add({ severity: 'error', summary: 'Error', detail: 'Contraseña incorrecta', life: 3000 });
                    }
                }
            });
    } else if (result.dismiss === Swal.DismissReason.cancel) {
       
          visibleProductosModal.value = true;
          productosFactura.value = JSON.parse(event.data.productos)
    }
});

};
/***********************************************************************************/
// Computed para procesar facturas (desglosando productos en filas individuales)
const searchQueryFactura = ref('')
// Computed para procesar facturas (desglosando productos en filas individuales)
// Computed para procesar facturas (desglosando productos en filas individuales)
const processedFacturas = computed(() => {
  return facturasArray.value.flatMap(factura => {
    let productos = JSON.parse(factura.productos); // Parsear productos desde el string
    return productos.map(producto => ({
      facturaNumero: factura.no_factura,
      fecha: factura.fecha_emision,
      hora: factura.hora,
      producto: producto.nombre,
      cantidad: producto.cantidad,
      precio: producto.precio_venta,
      impuesto: producto.impuesto,
      total: producto.total // Calcular total por producto
    }));
  });
});

// Filtro de búsqueda para productos
const filteredFacturas = computed(() => {
  if (!searchQueryFactura.value) {
    return processedFacturas.value;
  }
  return processedFacturas.value.filter(factura => 
    factura.producto.toLowerCase().includes(searchQueryFactura.value.toLowerCase())
  );
});

// Obtener la clase basada en el número de factura
const getFacturaClass = (facturaNumero) => {
  const colors = [
    'factura-color-0',
    'factura-color-1',
    'factura-color-2',
    'factura-color-3',
    'factura-color-4',
    'factura-color-5',
    'factura-color-6',
    'factura-color-7',
    'factura-color-8',
    'factura-color-9'
  ];
  const index = parseInt(facturaNumero.slice(-1));  // Usamos el último dígito para asignar color
  return colors[index % colors.length];
};
/***********************************************************************************/

const fnPrintProductos = ()=>{

  const fechaInicioN = transformarFechaTimestamp(formatearFecha(fechaInicio.value), false);
  const fechaFinN = transformarFechaTimestamp(formatearFecha(fechaFin.value), false);
  const impresionpagina = `${link.value}/vista/impresorareporte.php?fecha=${fechaInicioN} ${horaInicio.value}AND${fechaFinN} ${horaFin.value}&admin`;


  const datosUsuarioLocal = JSON.parse(window.localStorage.getItem('usuarioLocal')) 


  const peticionDatos = {
    fechainicio:fechaInicioN,
    horainicio:horaInicio.value,
    horafin:horaFin.value,
    fechafin:fechaFinN,
    taller:datosDelDia.value.taller,
    fondoinicial:datosDelDia.value.inicioCaja,
    efectivo:datosDelDia.value.efectivo,
    transferencia:datosDelDia.value.transferencia,
    tarjeta:datosDelDia.value.tarjeta,
    gastos:datosDelDia.value.gastos,
    abono:datosDelDia.value.abono,
    token:datosUsuarioLocal[0].token,
    ganancia:datosDelDia.value.ganancia,
    totalvendido:datosDelDia.value.venta,
    devoluciones:0.00,
    totalcontado:0.00,
    impuestos:datosDelDia.value.impuestos,
    usuario:datosUsuarioLocal[0].nombre
  }




const datos = filteredProducts.value


const losDatos = {
    datos:datos,
    peticion:peticionDatos
}


  const datosEmpresa = JSON.stringify(enviarDatosLocalStorage() )
const impresion = window.electron.ipcRenderer.invoke('ticketproductosvendidos',JSON.stringify(losDatos),datosEmpresa,false,false,true);


}
/***********************************************************************************/
const fnGenerarDocProductosPDF = () => {
  const simbolo = datosConfiguracion.value?.simbolo || 'RD$'
  const fechaInicioN = formatearFecha(fechaInicio.value)
  const fechaFinN    = formatearFecha(fechaFin.value)
  const empresa      = enviarDatosLocalStorage()?.empresa || {}
  const productos    = filteredProducts.value
  const totales      = totalesProductosVendidos.value

  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'letter' })

  // Encabezado
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text(empresa.nombre || 'Empresa', 14, 14)
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text(`Listado de Productos Vendidos`, 14, 21)
  doc.text(`Período: ${fechaInicioN}  →  ${fechaFinN}`, 14, 27)

  // Construir columnas y filas dinámicamente
  const tienePrecioReal = productos.some(p => p.precio_real > 0)
  const tienePorcentaje = productos.some(p => p.porcentaje > 0)

  const head = ['Producto', 'Cantidad', `Costo`, `Venta`, `Ganancia`]
  if (tienePrecioReal) head.splice(2, 0, 'Precio Real')
  if (tienePorcentaje) head.splice(tienePrecioReal ? 3 : 2, 0, '% Método')

  const body = productos.map(p => {
    const fila = [
      p.nombre,
      p.cantidad,
      `${simbolo} ${decimales(p.costo || 0)}`,
      `${simbolo} ${decimales(p.total || 0)}`,
      `${simbolo} ${decimales(p.ganancia || 0)}`,
    ]
    if (tienePrecioReal) fila.splice(2, 0, p.precio_real > 0 ? `${simbolo} ${decimales(p.precio_real)}` : '—')
    if (tienePorcentaje) fila.splice(tienePrecioReal ? 3 : 2, 0, p.porcentaje > 0 ? `${p.porcentaje}%` : '—')
    return fila
  })

  // Fila de totales
  const filaTotales = [
    'TOTALES',
    totales.cantidad,
    ...(tienePrecioReal ? [''] : []),
    ...(tienePorcentaje ? [''] : []),
    `${simbolo} ${decimales(totales.costo)}`,
    `${simbolo} ${decimales(totales.total)}`,
    `${simbolo} ${decimales(totales.ganancia)}`,
  ]

  autoTable(doc, {
    startY: 33,
    head: [head],
    body: [...body, filaTotales],
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [30, 58, 138], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [245, 247, 255] },
    didParseCell: (data) => {
      // Fila de totales en negrita
      if (data.row.index === body.length) {
        data.cell.styles.fontStyle = 'bold'
        data.cell.styles.fillColor = [219, 234, 254]
      }
      // Ganancia negativa en rojo
      if (data.column.index === head.length - 1 && data.row.index < body.length) {
        const val = parseFloat((productos[data.row.index]?.ganancia) || 0)
        if (val < 0) data.cell.styles.textColor = [220, 38, 38]
        else if (val > 0) data.cell.styles.textColor = [22, 163, 74]
      }
    }
  })

  return doc
}
/***********************************************************************************/
const fnGenerarPdfProductos = () => {
  visibleProductos.value = false
  const doc = fnGenerarDocProductosPDF()
  const blob = doc.output('blob')
  const url  = URL.createObjectURL(blob)

  Swal.fire({
    title: 'Listado de Productos Vendidos',
    html: `<iframe src="${url}" style="width:100%;height:65vh;border:1px solid #ddd;border-radius:6px;"></iframe>`,
    width: '90%',
    showCancelButton: true,
    cancelButtonText: 'Cerrar',
    confirmButtonText: '⬇️ Descargar',
    preConfirm: () => { doc.save('Productos_Vendidos.pdf') },
    didClose: () => { URL.revokeObjectURL(url) }
  })
}
/***********************************************************************************/
const fnDescargarPdfProductos = () => {
  const doc = fnGenerarDocProductosPDF()
  doc.save(`Productos_Vendidos_${formatearFecha(fechaInicio.value)}_${formatearFecha(fechaFin.value)}.pdf`)
}
/***********************************************************************************/
const fnGenerarPdfTopProductos = () => {
  const simbolo = datosConfiguracion.value?.simbolo || 'RD$'
  const fechaInicioN = formatearFecha(fechaInicio.value)
  const fechaFinN = formatearFecha(fechaFin.value)
  const empresa = enviarDatosLocalStorage()?.empresa || {}
  const productosTop = [...(productosVendidos.value || [])]
    .sort((a, b) => Number(b.cantidad || 0) - Number(a.cantidad || 0))
    .slice(0, 20)

  if (!productosTop.length) {
    Swal.fire({
      icon: 'info',
      title: 'Sin productos',
      text: 'No hay productos vendidos para generar el reporte.'
    })
    return
  }

  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'letter' })

  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text(empresa.nombre || 'Empresa', 14, 14)
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text('Top de Productos Vendidos', 14, 21)
  doc.text(`Periodo: ${fechaInicioN} - ${fechaFinN}`, 14, 27)

  const totales = productosTop.reduce((acc, producto) => {
    acc.cantidad += Number(producto.cantidad || 0)
    acc.costo += Number(producto.costo || 0)
    acc.total += Number(producto.total || 0)
    acc.ganancia += Number(producto.ganancia || 0)
    return acc
  }, { cantidad: 0, costo: 0, total: 0, ganancia: 0 })

  const body = productosTop.map((producto, index) => [
    index + 1,
    producto.nombre,
    Number(producto.cantidad || 0),
    `${simbolo} ${decimales(producto.costo || 0)}`,
    `${simbolo} ${decimales(producto.total || 0)}`,
    `${simbolo} ${decimales(producto.ganancia || 0)}`
  ])

  body.push([
    '',
    'TOTALES',
    totales.cantidad,
    `${simbolo} ${decimales(totales.costo)}`,
    `${simbolo} ${decimales(totales.total)}`,
    `${simbolo} ${decimales(totales.ganancia)}`
  ])

  autoTable(doc, {
    startY: 34,
    head: [['#', 'Producto', 'Cantidad', 'Costo', 'Venta', 'Ganancia']],
    body,
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [15, 118, 110], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [240, 253, 250] },
    columnStyles: {
      0: { halign: 'center', cellWidth: 12 },
      2: { halign: 'right' },
      3: { halign: 'right' },
      4: { halign: 'right' },
      5: { halign: 'right' }
    },
    didParseCell: (data) => {
      if (data.row.index === body.length - 1) {
        data.cell.styles.fontStyle = 'bold'
        data.cell.styles.fillColor = [204, 251, 241]
      }
    }
  })

  const blob = doc.output('blob')
  const url = URL.createObjectURL(blob)

  Swal.fire({
    title: 'Top de Productos Vendidos',
    html: `<embed src="${url}" type="application/pdf" width="100%" height="500px" style="border:1px solid #ddd;border-radius:6px;" />`,
    width: '90%',
    showCloseButton: true,
    showCancelButton: true,
    cancelButtonText: 'Cerrar',
    confirmButtonText: 'Descargar PDF',
    preConfirm: () => {
      doc.save(`Top_Productos_${fechaInicioN}_${fechaFinN}.pdf`)
    },
    didClose: () => {
      URL.revokeObjectURL(url)
    }
  })
}
/***********************************************************************************/
const fnProductosSinStock = async ()=>{

/*   const productosArray = await peticionesFetch(`${link.value}${api.value}`,'datosarraypost',{'tabla':'productos'},tokenCifrado.value,'POST');*/
   const productosArray = await peticionesFetchOffline('getDataAsArray', 'productos');

   const productosSinStock = productosArray.filter(prod=> Number(prod.stock) < 1)
  const datosEmpresa = JSON.stringify(enviarDatosLocalStorage() )

const impresion = window.electron.ipcRenderer.invoke('ticketproductossinstock',JSON.stringify(productosSinStock),datosEmpresa,false,false,true);


}
/***********************************************************************************/
const fnProductosInventario= async ()=>{
/*   const productosArray = await peticionesFetch(`${link.value}${api.value}`,'datosarraypost',{'tabla':'productos'},tokenCifrado.value,'POST');*/

   const productosArray = await peticionesFetchOffline('getDataAsArray', 'productos');

   const inventario = productosArray
  const datosEmpresa = JSON.stringify(enviarDatosLocalStorage() )

const impresion = window.electron.ipcRenderer.invoke('ticketinventario',JSON.stringify(inventario),datosEmpresa,false,false,true);
}
/***********************************************************************************/
const fnResumenVentas = ()=>{
const facturas = facturasArray.value;
const datosEmpresa = JSON.stringify(enviarDatosLocalStorage() )
const impresion = window.electron.ipcRenderer.invoke('resumenfacturas',JSON.stringify(facturas),datosEmpresa,false,false,true);
}
/***********************************************************************************/
const fnTodasLasFacturas = async () => {
    const facturas = facturasArray.value;
    const datosEmpresa = JSON.stringify(enviarDatosLocalStorage());

    // Crear un elemento de loading en la pantalla con Tailwind CSS
    const loadingElement = document.createElement('div');
    loadingElement.id = 'loading';
    loadingElement.className = 'fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white text-center p-6 rounded-lg shadow-lg border border-gray-200';
    loadingElement.innerHTML = `
        <div class="text-xl font-semibold text-gray-800 mb-2">Imprimiendo facturas...</div>
        <div id="loadingMessage" class="text-lg text-gray-600">Preparando...</div>
        <div class="mt-4">
            <div class="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                <div id="progressBar" class="bg-blue-500 h-2.5 rounded-full transition-all duration-300" style="width: 0%;"></div>
            </div>
        </div>
    `;
    document.body.appendChild(loadingElement);

    // Referencias a los elementos de progreso
    const loadingMessage = document.getElementById('loadingMessage');
    const progressBar = document.getElementById('progressBar');

    for (let i = 0; i < facturas.length; i++) {
        const factura = facturas[i];

        // Actualizar el mensaje y el progreso
        loadingMessage.innerText = `Imprimiendo factura #${factura.no_factura} (${i + 1} de ${facturas.length})`;
        const progressPercent = ((i + 1) / facturas.length) * 100;
        progressBar.style.width = `${progressPercent}%`;

        await window.electron.ipcRenderer.invoke('ticket', factura.no_factura, datosEmpresa);
    }

    // Cambiar mensaje al finalizar
    loadingMessage.innerText = 'Todas las facturas han sido impresas.';
    progressBar.style.width = '100%';
    progressBar.classList.add('bg-green-500');

    // Remover el mensaje después de unos segundos
    setTimeout(() => {
        document.body.removeChild(loadingElement);
    }, 3000);
};

/***********************************************************************************/
const fnResumenCotizaciones = async()=>{

const fechaInicioN = transformarFechaTimestamp(formatearFecha(fechaInicio.value),false);
const fechaFinN = transformarFechaTimestamp(formatearFecha(fechaFin.value),false);

/*const response = await peticionesFetch(`${link.value}${api.value}`,`datostimestamp`,{"fechainicio":fechaInicioN+' '+horaInicio.value,"fechafin":fechaFinN+' '+horaFin.value,campo:'created_at',tabla:'cotizacion'},tokenCifrado.value,'POST');
*/
const response =  await peticionesFetchOffline('getRowsByTimestampRange', 'cotizacion','created_at',fechaInicioN + ' ' + horaInicio.value,fechaFinN + ' ' + horaFin.value);

    const jsonData = response;
    const datosFiltrados = response.filter(ft=>ft.almacen === datosEmpresa.empresa.nombre)

const datosEmpresa = JSON.stringify(enviarDatosLocalStorage() )
const impresion = window.electron.ipcRenderer.invoke('reportecotizaciones',JSON.stringify(datosFiltrados),datosEmpresa,false,false,true);


}
/***********************************************************************************/
const fnResumenIMEI = async()=>{

const fechaInicioN = transformarFechaTimestamp(formatearFecha(fechaInicio.value),false);
const fechaFinN = transformarFechaTimestamp(formatearFecha(fechaFin.value),false);

/*const response = await peticionesFetch(`${link.value}${api.value}`,`datostimestamp`,{"fechainicio":fechaInicioN+' '+horaInicio.value,"fechafin":fechaFinN+' '+horaFin.value,campo:'created_at',tabla:'imei'},tokenCifrado.value,'POST');*/

const response =  await peticionesFetchOffline('getRowsByTimestampRange', 'imei','created_at',fechaInicioN + ' ' + horaInicio.value,fechaFinN + ' ' + horaFin.value);

    const jsonData = response;
const datosFiltrados = response.filter(ft=>ft.almacen === datosEmpresa.empresa.nombre)
const datosEmpresa = JSON.stringify(enviarDatosLocalStorage() )
const impresion = window.electron.ipcRenderer.invoke('reporteimei',JSON.stringify(datosFiltrados),datosEmpresa,false,false,true);

}
/***********************************************************************************/
const fnAbrirCaja = async()=>{
const datosEmpresa = JSON.stringify(enviarDatosLocalStorage() )
const impresion = window.electron.ipcRenderer.invoke('abrircaja','AbrirCaja',datosEmpresa,true,false,false);

}
/***********************************************************************************/
const fnFacturasPorComprobantes = ()=>{
    alert('EN Desarrollo')
}
const fnFacturasPorMetodoPago = ()=>{
    alert('EN Desarrollo')
}
/***********************************************************************************/
const facturasInfo = computed(() => {
  const info = {
    EFECTIVO: { count: 0, total: 0 },
    TARJETA: { count: 0, total: 0 },
    TRANSFERENCIA: { count: 0, total: 0 },
    CREDITO: { count: 0, total: 0 },
    CHEQUE: { count: 0, total: 0 },
    DEVOLUCION: { count: 0, total: 0 }
  };
  facturasArray.value.forEach(factura => {
    // Para EFECTIVO, TARJETA y TRANSFERENCIA: usamos el campo con el mismo nombre
    if (factura.metodo_pago === 'EFECTIVO') {
      info.EFECTIVO.count++;
      info.EFECTIVO.total += Number(factura.efectivo || 0);
    }
    if (factura.metodo_pago === 'TARJETA') {
      info.TARJETA.count++;
      info.TARJETA.total += Number(factura.tarjeta || 0);
    }
    if (factura.metodo_pago === 'TRANSFERENCIA') {
      info.TRANSFERENCIA.count++;
      info.TRANSFERENCIA.total += Number(factura.transferencia || 0);
    }
    // Para CREDITO: cuando el método de pago es "CREDITO" se suma el valor en factura.efectivo
    if (factura.metodo_pago === 'CREDITO') {
      info.CREDITO.count++;
      info.CREDITO.total += Number(factura.efectivo || 0);
    }
    if (factura.metodo_pago === 'CHEQUE') {
      info.CHEQUE.count++;
      info.CHEQUE.total += Number(factura.cheque || 0);
    }

    // Para DEVOLUCION: si el estado de la factura es "DEVOLUCION", se suma el valor en factura.efectivo
    if (factura.estado_factura === 'DEVOLUCION') {
      info.DEVOLUCION.count++;
      info.DEVOLUCION.total += Number(factura.efectivo || 0);
    }
  });
  return info;
});

// Definimos un arreglo reactivo para la tabla filtrada (inicialmente con todas las facturas)
const facturasFiltradas = ref(facturasArray.value);
watch(facturasArray, (newVal) => {
  facturasFiltradas.value = newVal;
}, { immediate: true });

// Función para filtrar la tabla según el método (o estado, en el caso de DEVOLUCION)
const filterFacturas = (tipo) => {
  if (tipo === 'DEVOLUCION') {
    facturasFiltradas.value = facturasArray.value.filter(factura => factura.estado_factura === 'DEVOLUCION');
  } else {
    facturasFiltradas.value = facturasArray.value.filter(factura => factura.metodo_pago === tipo);
  }
};

// Función para resetear el filtro (opcional)
const resetFilter = () => {
  facturasFiltradas.value = facturasArray.value;
};
/***********************************************************************************/
const fnPrintExcelCategorias = async () => {
    const categorias = categoriasVendidas.value;
    const datosEmpresa = JSON.stringify(enviarDatosLocalStorage());

    if (!categorias.length) {
        toast.add({ severity: 'warn', summary: 'Aviso', detail: 'No hay datos para imprimir.', life: 3000 });
        return;
    }

    const impresion = await window.electron.ipcRenderer.invoke('ticketcategoriasvendidas', JSON.stringify(categorias), datosEmpresa, false, false, true);
};

const fnDescargarExcelCategorias = async () => {
    if (!categoriasVendidas.value.length) {
        toast.add({ severity: 'warn', summary: 'Aviso', detail: 'No hay datos para exportar.', life: 3000 });
        return;
    }

    const data = categoriasVendidas.value.map(item => ({
        Categoria: item.nombre,
        Cantidad: item.cantidad,
        Total: item.total
    }));

    // Crear una hoja de cálculo y un libro de Excel
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Categorías Vendidas');

    // Generar un archivo Excel binario
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });

    // Crear un Blob desde los datos y descargar el archivo
    const blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.download = 'categorias_vendidas.xlsx';
    link.click();
};
/***********************************************************************************/
const generarPDFTicket = () => {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: [80, 210], // Ticket pequeño
  });

  // Establecer el título del ticket
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("Reporte Diario", 40, 10, { align: "center" });

  doc.setFontSize(10);
  doc.text("Fecha: " + new Date().toLocaleDateString(), 10, 20);

  // Datos
  const datos = [
    ["Total Ventas", `${datosConfiguracion.value.simbolo}${decimales(datosDelDia.value.venta)}`],
    ["Ganancias", `${datosConfiguracion.value.simbolo}${decimales(datosDelDia.value.ganancia)}`],
    ["Total Costos", `${datosConfiguracion.value.simbolo}${decimales(datosDelDia.value.costos)}`],
    ["Impuestos", `${datosConfiguracion.value.simbolo}${decimales(datosDelDia.value.impuestos)}`],
    ["Gastos", `${datosConfiguracion.value.simbolo}${decimales(datosDelDia.value.gastos)}`],
    ["Total en Efectivo", `${datosConfiguracion.value.simbolo}${decimales(datosDelDia.value.efectivo)}`],
    ["Total en Transferencia", `${datosConfiguracion.value.simbolo}${decimales(datosDelDia.value.transferencia)}`],
    ["Total en Tarjeta", `${datosConfiguracion.value.simbolo}${decimales(datosDelDia.value.tarjeta)}`],
    ["Cuentas por Cobrar", `${datosConfiguracion.value.simbolo}${decimales(datosDelDia.value.cuentasXcobrar)}`],
    ["Taller", `${datosConfiguracion.value.simbolo}${decimales(datosDelDia.value.taller)}`],
    ["Total en Caja", `${datosConfiguracion.value.simbolo}${decimales(datosDelDia.value.efectivo - datosDelDia.value.gastos)}`],
  ];

  // Agregar tabla con la información
  doc.autoTable({
    startY: 25,
    head: [["Descripción", "Monto"]],
    body: datos,
    theme: "striped",
    styles: { fontSize: 10 },
  });

  // Convertir a Blob y mostrar en Swal
  const pdfBlob = doc.output("blob");
  const pdfUrl = URL.createObjectURL(pdfBlob);

  Swal.fire({
    title: "Vista previa del Ticket 📄",
    html: `
      <iframe src="${pdfUrl}" width="100%" height="400px"></iframe>
    `,
    width: 600,
    showCancelButton: true,
    confirmButtonText: "Imprimir",
    cancelButtonText: "Descargar",
    didOpen: () => {
      const confirmButton = Swal.getConfirmButton();
      confirmButton.addEventListener("click", () => {
        doc.autoPrint();
        window.open(pdfUrl);
      });

      const cancelButton = Swal.getCancelButton();
      cancelButton.addEventListener("click", () => {
        const link = document.createElement("a");
        link.href = pdfUrl;
        link.download = "ticket_reporte.pdf";
        link.click();
      });
    },
  });
};
/***********************************************************************************/
/************************************************************************/
// Procesar datos semanales para generar ventas, ganancias, impuestos, etc.
const procesarDatosSemanales = async() => {
    const fechasSemana = nfecha('semanatimestamp');
    const response = await peticionesFetch(`${link.value}${api.value}`, `datosventasporrango`, {
        fechainicio: `${fechasSemana.fechainicio}`,
        fechafinal: `${fechasSemana.fechafin}`,
    }, tokenCifrado.value, 'POST');

  const datos = response
    const resultadosPorSemana = {
        ventas: Array(7).fill(0),
        ganancias: Array(7).fill(0),
        impuestos: Array(7).fill(0),
        gastos: Array(7).fill(0),
        devoluciones: Array(7).fill(0),
        abonos: Array(7).fill(0),
        taller: Array(7).fill(0), 
        cuentas_cobrar: Array(7).fill(0),
        dias: diasSemana, // Nombres de los días de la semana
    };

    // Procesar facturas por día
    if (datos.facturas && datos.facturas.length > 0) {
        datos.facturas.forEach((factura) => {
            const fecha = new Date(factura.updated_at);
            const dia = fecha.getDay(); // Obtener el día de la semana (0 es Domingo)
            resultadosPorSemana.ventas[dia] += parseFloat(factura.total) || 0;
            resultadosPorSemana.ganancias[dia] += parseFloat(factura.ganancia) || 0;
            resultadosPorSemana.impuestos[dia] += parseFloat(factura.impuesto) || 0;
        });
    }

    // Procesar gastos
    if (datos.gastos && datos.gastos.length > 0) {
        datos.gastos.forEach((gastos) => {
            const fecha = new Date(gastos.updated_at);
            const dia = fecha.getDay();
            resultadosPorSemana.gastos[dia] += parseFloat(gastos.cantidad) || 0;
        });
    }

    // Procesar datos de taller
    if (datos.taller && datos.taller.length > 0) {
        datos.taller.forEach((taller) => {
            const abonos = JSON.parse(taller.abono);

            abonos.forEach((ab) => {
                const partesFechaHora = ab.fecha.split(' ');
                const partesFecha = partesFechaHora[0].split('/');
                const fecha = new Date(`${partesFecha[2]}-${partesFecha[1]}-${partesFecha[0]}`);
                const dia = fecha.getDay();
                resultadosPorSemana.taller[dia] += parseFloat(ab.abono) || 0;
            });
        });
    }

    // Procesar cuentas por cobrar
    if (datos.cuentas_cobrar && datos.cuentas_cobrar.length > 0) {
        datos.cuentas_cobrar.forEach((cuentas_cobrar) => {
            const fecha = new Date(cuentas_cobrar.updated_at);
            const dia = fecha.getDay();
            resultadosPorSemana.cuentas_cobrar[dia] += parseFloat(cuentas_cobrar.monto_credito) || 0;
        });
    }

    // Procesar devoluciones
    if (datos.devoluciones && datos.devoluciones.length > 0) {
        datos.devoluciones.forEach((devoluciones) => {
            const fecha = new Date(devoluciones.updated_at);
            const dia = fecha.getDay();
            resultadosPorSemana.devoluciones[dia] += parseFloat(devoluciones.cantidad) || 0;
        });
    }

    return resultadosPorSemana;
};

/************************************************************************/
// Establecer datos del gráfico
const setChartDataSemana = (resultadosPorSemana) => {
    const documentStyle = getComputedStyle(document.documentElement);

    return {
        labels: resultadosPorSemana.dias,
        datasets: [
            {
                label: 'Ventas',
                backgroundColor: documentStyle.getPropertyValue('--p-cyan-500'),
                borderColor: documentStyle.getPropertyValue('--p-cyan-500'),
                data: resultadosPorSemana.ventas
            },
            {
                label: 'Ganancias',
                backgroundColor: documentStyle.getPropertyValue('--p-gray-500'),
                borderColor: documentStyle.getPropertyValue('--p-gray-500'),
                data: resultadosPorSemana.ganancias
            },
            {
                label: 'Gastos',
                backgroundColor: documentStyle.getPropertyValue('--p-red-500'),
                borderColor: documentStyle.getPropertyValue('--p-red-500'),
                data: resultadosPorSemana.gastos
            },
            {
                label: 'Impuestos',
                backgroundColor: documentStyle.getPropertyValue('--p-purple-500'),
                borderColor: documentStyle.getPropertyValue('--p-purple-500'),
                data: resultadosPorSemana.impuestos
            },
            {
                label: 'Devoluciones',
                backgroundColor: documentStyle.getPropertyValue('--p-green-500'),
                borderColor: documentStyle.getPropertyValue('--p-green-500'),
                data: resultadosPorSemana.devoluciones
            },
            {
                label: 'Abonos',
                backgroundColor: documentStyle.getPropertyValue('--p-blue-500'),
                borderColor: documentStyle.getPropertyValue('--p-blue-500'),
                data: resultadosPorSemana.abonos
            },
            {
                label: 'Taller', 
                backgroundColor: documentStyle.getPropertyValue('--p-orange-500'),
                borderColor: documentStyle.getPropertyValue('--p-orange-500'),
                data: resultadosPorSemana.taller
            },
            {
                label: 'Cuentas por Cobrar', 
                backgroundColor: documentStyle.getPropertyValue('--p-yellow-500'),
                borderColor: documentStyle.getPropertyValue('--p-yellow-500'),
                data: resultadosPorSemana.cuentas_cobrar
            }
        ]
    };
};

/************************************************************************/
// Establecer las opciones del gráfico
const setChartOptionsSemana = () => {
    const documentStyle = getComputedStyle(document.documentElement);
    const textColor = documentStyle.getPropertyValue('--p-text-color');
    const textColorSecondary = documentStyle.getPropertyValue('--p-text-muted-color');
    const surfaceBorder = documentStyle.getPropertyValue('--p-content-border-color');

    return {
        maintainAspectRatio: false,
        aspectRatio: 0.8,
        plugins: {
            legend: {
                labels: {
                    color: textColor
                }
            }
        },
        scales: {
            x: {
                ticks: {
                    color: textColorSecondary,
                    font: {
                        weight: 500
                    }
                },
                grid: {
                    display: false,
                    drawBorder: false
                }
            },
            y: {
                ticks: {
                    color: textColorSecondary
                },
                grid: {
                    color: surfaceBorder,
                    drawBorder: false
                }
            }
        }
    };
};
/***********************************************************************************/
const decimalesR = (val) => {
  const simbolo = datosConfiguracion?.value?.simbolo || 'RD$'
  const numero = Number(parseFloat(val || 0).toFixed(2))
  return `${simbolo} ${numero.toLocaleString('es-DO', { minimumFractionDigits: 2 })}`
}

  //  const productosVendidosA =  productosVendidos.value; // debe ser array [{nombre, cantidad};
/***********************************************************************************/


const generarInformeAnalitico = async () => {
  const totalVentas = Number(datosDelDia.value.venta)
  const totalGanancias = Number(datosDelDia.value.ganancia)
  const totalCostos = Number(datosDelDia.value.costos)
  const totalImpuestos = Number(datosDelDia.value.impuestos)
  const totalGastos = Number(datosDelDia.value.gastos)
  const totalAbonos = Number(datosDelDia.value.abono)
  const cuentasCobrar = Number(datosDelDia.value.cuentasXcobrar)
  const totalTaller = Number(datosDelDia.value.taller)
  const totalDevoluciones = Number(datosDelDia.value.devoluciones)
  const totalCheque = Number(datosDelDia.value.cheque || 0)
  const totalEfectivo = Number(datosDelDia.value.efectivo)
  const totalTransferencia = Number(datosDelDia.value.transferencia)
  const totalTarjeta = Number(datosDelDia.value.tarjeta)
  const efectivoMenosGastos = totalEfectivo - totalGastos
  const productosVendidosA = productosVendidos.value || []

const fechaInicioN = transformarFechaTimestamp(formatearFecha(fechaInicio.value),false);
const fechaFinN = transformarFechaTimestamp(formatearFecha(fechaFin.value),false);

  const fechasRango = `${fechaInicioN} - ${fechaFinN}`

  const balanceNeto = (totalVentas + totalTaller) - (totalGastos + totalImpuestos + totalDevoluciones)

  const pdf = new jsPDF()

  pdf.setFontSize(18)
  pdf.text('Informe Financiero de la Empresa', 105, 15, { align: 'center' })
  pdf.setFontSize(11)
  pdf.text(`Rango de Fecha: ${fechasRango}`, 14, 25)

  autoTable(pdf, {
    startY: 30,
    head: [['Categoría', 'Monto']],
    body: [
      ['Ventas', decimalesR(totalVentas)],
      ['Ganancias', decimalesR(totalGanancias)],
      ['Total de Costos', decimalesR(totalCostos)],
      ['Gastos', decimalesR(totalGastos)],
      ['Impuestos', decimalesR(totalImpuestos)],
      ['Devoluciones', decimalesR(totalDevoluciones)],
      ['Ingresos Taller', decimalesR(totalTaller)],
      ['Abonos', decimalesR(totalAbonos)],
      ['Cuentas por Cobrar', decimalesR(cuentasCobrar)],
      ['Balance Neto', decimalesR(balanceNeto)],
      ['Efectivo', decimalesR(totalEfectivo)],
      ['Transferencia', decimalesR(totalTransferencia)],
      ['Tarjeta', decimalesR(totalTarjeta)],
      ['Cheque', decimalesR(totalCheque)],
      ['Efectivo - Gastos', decimalesR(efectivoMenosGastos)]
    ]
  })

  if (productosVendidosA.length > 0) {
    autoTable(pdf, {
      startY: pdf.lastAutoTable.finalY + 10,
      head: [['Producto', 'Cantidad']],
      body: productosVendidosA.map(p => [p.nombre, p.cantidad.toString()]),
      theme: 'striped'
    })
  }

  const canvasTarta = document.getElementById('graficoTartaInforme')
  const canvasBarra = document.getElementById('graficoBarraProductos')

  if (canvasTarta && canvasBarra) {
    // Limpiar gráficos previos
    ChartJS.getChart(canvasTarta)?.destroy()
    ChartJS.getChart(canvasBarra)?.destroy()

    // Gráfico de tarta
    new ChartJS(canvasTarta, {
      type: 'pie',
      data: {
        labels: ['Ventas', 'Taller', 'Abonos', 'Cuentas por Cobrar'],
        datasets: [{
          data: [totalVentas, totalTaller, totalAbonos, cuentasCobrar],
          backgroundColor: ['#36A2EB', '#FF6384', '#FFCE56', '#4BC0C0']
        }]
      },
      options: {
        responsive: false,
        plugins: { legend: { position: 'bottom' } }
      }
    })

    // Gráfico de barras (productos más vendidos)
    new ChartJS(canvasBarra, {
      type: 'bar',
      data: {
        labels: productosVendidosA.map(p => p.nombre),
        datasets: [{
          label: 'Cantidad Vendida',
          data: productosVendidosA.map(p => p.cantidad),
          backgroundColor: '#42A5F5'
        }]
      },
      options: {
        responsive: false,
        indexAxis: 'y',
        plugins: {
          legend: { display: false },
          title: { display: true, text: 'Top Productos Vendidos' }
        },
        scales: {
          x: { ticks: { precision: 0 } }
        }
      }
    })

    // Esperar a que se rendericen ambos gráficos
    setTimeout(() => {
      // Agregar gráfico de tarta
      const chartImageTarta = canvasTarta.toDataURL('image/png')
      pdf.addPage()
      pdf.setFontSize(14)
      pdf.text('Distribución de Ingresos', 105, 15, { align: 'center' })
      pdf.addImage(chartImageTarta, 'PNG', 30, 30, 150, 150)

      // Agregar gráfico de barras
      const chartImageBarra = canvasBarra.toDataURL('image/png')
      pdf.addPage()
      pdf.setFontSize(14)
      pdf.text('Top Productos Vendidos', 105, 15, { align: 'center' })
      pdf.addImage(chartImageBarra, 'PNG', 10, 30, 190, 140)

      // Mostrar en SweetAlert2
      const pdfBlob = pdf.output('blob')
      const pdfUrl = URL.createObjectURL(pdfBlob)

      Swal.fire({
        title: 'Vista Previa del Informe',
        html: `<embed src="${pdfUrl}" type="application/pdf" width="100%" height="500px">`,
        width: '90%',
        showCancelButton: true,
        confirmButtonText: 'Descargar',
        cancelButtonText: 'Cerrar',
        didClose: () => URL.revokeObjectURL(pdfUrl),
        preConfirm: () => {
          const link = document.createElement('a')
          link.href = pdfUrl
          link.download = 'Informe-TMPOS.pdf'
          link.click()
        }
      })
    }, 600)
  }
}

/***********************************************************************************/
//filteredVendedores
const filteredVendedores = computed(() => {
if (!searchQueryVendedores.value) return vendedoresData.value;
return vendedoresData.value.filter(busqueda => {
  return Object.values(busqueda).some(value =>
    String(value).toLowerCase().includes(searchQueryVendedores.value.toLowerCase())
   );
  });
});
/***********************************************************************************/
const filteredClientes = computed(() => {
if (!searchQueryCliente.value) return clientesData.value;
return clientesData.value.filter(busqueda => {
  return Object.values(busqueda).some(value =>
    String(value).toLowerCase().includes(searchQueryCliente.value.toLowerCase())
   );
  });
});
/***********************************************************************************/
const getFacturasPorVendedor = (vendedor) => {
  const copiaFacturas = JSON.parse(JSON.stringify(facturasArray.value))
  const datosEncontrados = copiaFacturas.filter(factura => factura.vendedor === vendedor);
  return datosEncontrados;
};
/***********************************************************************************/
const getFacturasPorCliente = (clienteId) => {
  const copiaFacturas = JSON.parse(JSON.stringify(facturasArray.value))
  const datosEncontrados = copiaFacturas.filter(factura => factura.cod_cliente === clienteId);
  return datosEncontrados;
};
/***********************************************************************************/
const onRowSelectVendedor = (event) => {
  clienteSeleccionado.value = event.data;

  // Obtener las facturas del cliente
  const facturas = getFacturasPorVendedor(event.data.nombre);

  // Modificar la propiedad productos de cada factura para que sea un string
  const facturasModificadas = facturas.map(factura => {
    try {
      const productos = JSON.parse(factura.productos || '[]');
      const productosString = productos.map(prod => {
        return `${prod.nombre} (x${prod.cantidad}) @${parseFloat(prod.total).toFixed(2)}`;
      }).join(', ');
      factura.productos = productosString;
    } catch (e) {
      console.warn('Error al parsear productos:', factura.productos, e);
      factura.productos = ''; // Evitar errores en la interfaz
    }
    return factura;
  });

  facturasCliente.value = facturasModificadas;

  visibleSeleccionarCliente.value = false;
  visibleHistorialCliente.value = true;
  historialCliente.value = true;
};
/***********************************************************************************/

const onRowSelectCliente = (event) => {
  clienteSeleccionado.value = event.data;

  // Obtener las facturas del cliente
  const facturas = getFacturasPorCliente(clienteSeleccionado.value.codigo);

  // Modificar la propiedad productos de cada factura para que sea un string
  const facturasModificadas = facturas.map(factura => {
    try {
      const productos = JSON.parse(factura.productos || '[]');
      const productosString = productos.map(prod => {
        return `${prod.nombre} (x${prod.cantidad}) @${parseFloat(prod.total).toFixed(2)}`;
      }).join(', ');
      factura.productos = productosString;
    } catch (e) {
      console.warn('Error al parsear productos:', factura.productos, e);
      factura.productos = ''; // Evitar errores en la interfaz
    }
    return factura;
  });

  facturasCliente.value = facturasModificadas;

  visibleSeleccionarCliente.value = false;
  visibleHistorialCliente.value = true;
  historialCliente.value = true;
};


/***********************************************************************************/
const descargarPDFcliente = () => {
  const doc = new jsPDF();
  let esVendedor = false;

    const fechaInicioN = formatearFecha(fechaInicio.value)
    const fechaFinN = formatearFecha(fechaFin.value)

  if (visibleSeleccionarVendedor.value) {
    esVendedor = true;
    const datosVendedor = clienteSeleccionado.value;
    const porcentaje = parseFloat(datosVendedor.porcentaje) || 0;

    // Calcula el total ganado por el vendedor
    const ganado = facturasCliente.value.reduce((sum, factura) => {
      const totalFactura = parseFloat(factura.total) || 0;
      return sum + (totalFactura * porcentaje / 100);
    }, 0);

    // Añade la información del vendedor y lo ganado al PDF
    doc.setFontSize(14);
    doc.text(`Historial de Facturas - Cliente: ${clienteSeleccionado.value?.nombre || ''}`, 14, 20);
    doc.text(`Vendedor: ${datosVendedor.nombre || ''}`, 14, 30);
    doc.text(`Porcentaje de Comisión: ${porcentaje}%`, 14, 40);
    doc.text(`Total Ganado: ${ganado.toFixed(2)}`, 14, 50);
    doc.text(`Fechas: ${fechaInicioN} - ${fechaInicioN}`, 14, 60);
  } else {
  const totalVendido = facturasCliente.value.reduce((sum, factura) => {
      const totalFactura = parseFloat(factura.total) || 0;
      return sum + totalFactura ;
    }, 0);
    // Si no es vendedor, solo añade el título
    doc.setFontSize(14);
    doc.text(`Historial de Facturas - Cliente: ${clienteSeleccionado.value?.nombre || ''}`, 14, 20);
    doc.text(`Fechas: ${fechaInicioN} - ${fechaInicioN}`, 14, 30);
    doc.text(`Total Vendido: ${totalVendido.toFixed(2)}`, 14, 40);
  }

  // Tabla de facturas
  autoTable(doc, {
    startY: esVendedor ? 70 : 50, // Ajusta el inicio de la tabla si es vendedor
    head: [['Factura', 'Productos', 'Fecha', 'Hora', 'Total']],
    body: facturasCliente.value.map(factura => [
      factura.no_factura,
      factura.productos,
      factura.fecha_emision,
      factura.hora,
      parseFloat(factura.total).toFixed(2)
    ]),
    styles: {
      fontSize: 10,
      cellWidth: 'wrap',
    },
    columnStyles: {
      1: { cellWidth: 60 } // columna productos
    }
  });

  doc.save(`Historial_Facturas_${clienteSeleccionado.value?.nombre || 'cliente'}.pdf`);
};


/***********************************************************************************/
function mostrarPDF(titulo, generarContenido) {
  const doc = new jsPDF();
  doc.setFontSize(16);
  doc.text(titulo, 10, 15);

  generarContenido(doc);

  const pdfBlob = doc.output("blob");
  const url = URL.createObjectURL(pdfBlob);

  Swal.fire({
    title: titulo,
    html: `<embed src="${url}" width="100%" height="400px" type="application/pdf" />`,
    width: 700,
    showCloseButton: true,
    confirmButtonText: "⬇️ Descargar",
    preConfirm: () => {
      doc.save(`${titulo}.pdf`);
    }
  });
}

// Balance General / Estado de Situación
async function generarBalance() {
  // Traer inventario
  const productos = await peticionesFetchOffline('getDataAsArray', 'productos');

  let totalInventario = 0;
  productos.forEach(p => {
    const stock = parseFloat(p.stock || 0);
    const precioCompra = parseFloat(p.precio_compra || 0);
    totalInventario += stock * precioCompra;
  });

  // Activos: caja + cxc + inventario
  const activos = (datosDelDia.value.efectivo + datosDelDia.value.transferencia + datosDelDia.value.tarjeta + (datosDelDia.value.cheque || 0)) + 
                  (datosDelDia.value.cuentasXcobrar || 0) + totalInventario;

  const pasivos = 0; // aquí puedes sumar cuentas por pagar si quieres
  const patrimonio = activos - pasivos;

  mostrarPDF("Balance General", (doc) => {
    autoTable(doc, {
      startY: 25,
      head: [["Cuenta", "Monto"]],
      body: [
        ["Activos", `RD$ ${decimales(activos)}`],
        ["Pasivos", `RD$ ${decimales(pasivos)}`],
        ["Patrimonio", `RD$ ${decimales(patrimonio)}`],
        ["Inventario (al costo)", `RD$ ${decimales(totalInventario)}`],
      ]
    });
  });
}

// Estado de Resultados
function generarResultados() {
  mostrarPDF("Estado de Resultados", (doc) => {
    const ingresos = datosDelDia.value.venta + datosDelDia.value.taller;
    const gastos = datosDelDia.value.gastos + totalGastosFijos.value;
    const impuestos = datosDelDia.value.impuestos;
    const utilidad = ingresos - gastos - impuestos;

    autoTable(doc, {
      startY: 25,
      head: [["Concepto", "Monto"]],
      body: [
        ["Ingresos", `RD$ ${decimales(ingresos)}`],
        ["Gastos", `RD$ ${decimales(gastos)}`],
        ["Impuestos", `RD$ ${decimales(impuestos)}`],
        ["Utilidad", `RD$ ${decimales(utilidad)}`],
      ],
    });
  });
}

// Estado de Cambios en Patrimonio
function generarCambios() {
  mostrarPDF("Estado de Cambios en el Patrimonio", (doc) => {
    const ingresos = datosDelDia.value.venta + datosDelDia.value.taller;
    const gastos = datosDelDia.value.gastos + totalGastosFijos.value;
    const impuestos = datosDelDia.value.impuestos;
    const utilidad = ingresos - gastos - impuestos;

    autoTable(doc, {
      startY: 25,
      head: [["Concepto", "Monto"]],
      body: [
        ["Patrimonio Inicial", "RD$ 0.00"], // podrías jalar de histórico
        ["+ Utilidad del Período", `RD$ ${decimales(utilidad)}`],
        ["- Dividendos / Retiros", `RD$ ${decimales(datosDelDia.value.devoluciones)}`],
        ["Patrimonio Final", `RD$ ${decimales(utilidad - datosDelDia.value.devoluciones)}`],
      ],
    });
  });
}
/***********************************************************************************/
async function generarInformeInventario() {
  try {
    // Obtener productos
    const productos = await peticionesFetchOffline('getDataAsArray', 'productos');

    let totalStock = 0;
    let valorCompra = 0;
    let valorVenta = 0;

    // Procesar productos
    const rows = productos.map(p => {
      const stock = parseFloat(p.stock || 0);
      const precioCompra = parseFloat(p.precio_compra || 0);
      const precioVenta = parseFloat(p.precio_venta || 0);

      totalStock += stock;
      valorCompra += stock * precioCompra;
      valorVenta += stock * precioVenta;

      return [
        p.nombre || "Sin nombre",
        stock,
        `RD$ ${decimales(precioCompra)}`,
        `RD$ ${decimales(precioVenta)}`,
        `RD$ ${decimales(stock * precioCompra)}`,
        `RD$ ${decimales(stock * precioVenta)}`
      ];
    });

    // Crear PDF
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("Informe de Inventario", 10, 15);

    autoTable(doc, {
      startY: 25,
      head: [["Producto", "Stock", "Precio Compra", "Precio Venta", "Total Compra", "Total Venta"]],
      body: rows,
    });

    // Totales
    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 10,
      head: [["Resumen", "Valor"]],
      body: [
        ["Cantidad Total en Stock", totalStock],
        ["Valor Total al Costo", `RD$ ${decimales(valorCompra)}`],
        ["Valor Total a Precio de Venta", `RD$ ${decimales(valorVenta)}`],
      ],
    });

    // Mostrar en Swal
    const pdfBlob = doc.output("blob");
    const url = URL.createObjectURL(pdfBlob);

    Swal.fire({
      title: "Informe de Inventario",
      html: `<embed src="${url}" width="100%" height="400px" type="application/pdf" />`,
      width: 700,
      showCloseButton: true,
      confirmButtonText: "⬇️ Descargar",
      preConfirm: () => {
        doc.save("Informe_Inventario.pdf");
      }
    });
  } catch (error) {
    console.error("❌ Error al generar inventario:", error);
    Swal.fire("Error", "No se pudo generar el informe de inventario", "error");
  }
}
/***********************************************************************************/
async function fnInforme607_2() {
  const fechaInicioN = transformarFechaTimestamp(formatearFecha(fechaInicio.value),false);
  const fechaFinN = transformarFechaTimestamp(formatearFecha(fechaFin.value),false);

  const facturas = await peticionesFetchOffline(
    'getRowsByTimestampRange',
    'facturas',
    'created_at',
    fechaInicioN+' '+horaInicio.value,
    fechaFinN+' '+horaFin.value
  );

  const datos = facturas
    .filter(f => f.almacen === datosEmpresa.empresa.nombre)
    .map(f => {
      return {
        fecha: f.fecha_emision,
        ncf: f.comprobante,
        rncCedula: f.cod_cliente,
        cliente: f.nombre_cliente,
        monto: parseFloat(f.total || 0),
        itbis: parseFloat(f.impuesto || 0),
        metodo: f.metodo_pago
      };
    });

  // Generar PDF
  const doc = new jsPDF();
  doc.setFontSize(14);
  doc.text("Informe 607 - Ventas", 10, 15);

  autoTable(doc, {
    startY: 25,
    head: [["Fecha", "NCF", "Cliente", "RNC/Cédula", "Monto", "ITBIS", "Método Pago"]],
    body: datos.map(d => [d.fecha, d.ncf, d.cliente, d.rncCedula, d.monto, d.itbis, d.metodo])
  });

  const pdfBlob = doc.output("blob");
  const url = URL.createObjectURL(pdfBlob);

  Swal.fire({
    title: "Informe 607",
    html: `<embed src="${url}" width="100%" height="400px" type="application/pdf" />`,
    width: 700,
    showCloseButton: true,
    confirmButtonText: "⬇️ Descargar",
    preConfirm: () => {
      doc.save("Informe_607.pdf");
    }
  });
}

/***********************************************************************************/
const fnInformePorComprobantes = async () => {
  const { value: tipoComprobante } = await Swal.fire({
    title: "Selecciona el tipo de comprobante",
    input: "select",
    inputOptions: {
      "COMPROBANTE CON VALOR FISCAL": "Comprobante con Valor Fiscal",
      "CONSUMIDOR FINAL": "Consumidor Final",
      "NOTA DE DÉBITO": "Nota de Débito",
      "NOTA DE CRÉDITO": "Nota de Crédito",
      "COMPROBANTE GUBERNAMENTAL": "Comprobante Gubernamental",
      "COMPROBANTE REGÍMENES ESPECIALES": "Comprobante Regímenes Especiales"
    },
    inputPlaceholder: "Selecciona un comprobante",
    showCancelButton: true,
    confirmButtonText: "Generar",
    cancelButtonText: "Cancelar"
  });

  if (!tipoComprobante) return;

  // 🔹 Filtrar por nombre (ejemplo: "CONSUMIDOR FINAL")
  const facturas = facturasArray.value.filter(
    f => f.tipo_factura?.toUpperCase() === tipoComprobante.toUpperCase()
  );

  if (!facturas.length) {
    Swal.fire("Sin datos", "No se encontraron facturas para este comprobante", "info");
    return;
  }

  // 🔹 Preparar datos
  const datos = facturas.map(f => ({
    fecha: f.fecha_emision,
    cliente: f.nombre_cliente,
    rnc: f.rnc_cliente || f.cod_cliente,
    comprobante: f.tipo_factura,
    monto: parseFloat(f.total || 0),
    itbis: parseFloat(f.impuesto || 0),
    metodo: f.metodo_pago
  }));

  // 🔹 Calcular totales
  const totalMonto = datos.reduce((acc, d) => acc + d.monto, 0);
  const totalItbis = datos.reduce((acc, d) => acc + d.itbis, 0);

  // 🔹 PDF
  const doc = new jsPDF();
  doc.setFontSize(14);
  doc.text(`Informe por Comprobante: ${tipoComprobante}`, 10, 15);

  autoTable(doc, {
    startY: 25,
    head: [["Fecha", "Cliente", "RNC/Cédula", "Comprobante", "Monto", "ITBIS", "Método Pago"]],
    body: datos.map(d => [
      d.fecha,
      d.cliente,
      d.rnc,
      d.comprobante,
      d.monto.toFixed(2),
      d.itbis.toFixed(2),
      d.metodo
    ])
  });

  // 🔹 Totales al final
  autoTable(doc, {
    startY: doc.lastAutoTable.finalY + 10,
    head: [["Resumen", "Monto"]],
    body: [
      ["Total Monto", totalMonto.toFixed(2)],
      ["Total ITBIS", totalItbis.toFixed(2)],
      ["Total Facturas", facturas.length.toString()]
    ],
    theme: "grid"
  });

  const pdfBlob = doc.output("blob");
  const url = URL.createObjectURL(pdfBlob);

  Swal.fire({
    title: `Informe Comprobante: ${tipoComprobante}`,
    html: `<embed src="${url}" width="100%" height="400px" type="application/pdf" />`,
    width: 700,
    showCloseButton: true,
    confirmButtonText: "⬇️ Descargar",
    preConfirm: () => {
      doc.save(`Informe_Comprobante_${tipoComprobante}.pdf`);
    }
  });
};

/***********************************************************************************/
const fnInformePorMetodoPago = async () => {
  // 1️⃣ Traer métodos de pago desde la base
  const metodos = await peticionesFetchOffline('getDataAsArray', 'metodopago');

  if (!metodos || !metodos.length) {
    Swal.fire("Sin métodos", "No se encontraron métodos de pago configurados", "info");
    return;
  }

  // 2️⃣ Crear objeto para SweetAlert
  const inputOptions = {};
  metodos.forEach(m => {
    inputOptions[m.nombre.toUpperCase()] = m.nombre;
  });

  // 3️⃣ Preguntar al usuario
  const { value: metodoPago } = await Swal.fire({
    title: "Selecciona el método de pago",
    input: "select",
    inputOptions,
    inputPlaceholder: "Selecciona un método de pago",
    showCancelButton: true,
    confirmButtonText: "Generar",
    cancelButtonText: "Cancelar"
  });

  if (!metodoPago) return;

  // 4️⃣ Determinar el campo de la factura a usar según el método
  const campo = metodoPago.toLowerCase(); // ejemplo: "efectivo", "tarjeta", "transferencia"

  // 5️⃣ Filtrar facturas que tengan algún valor en ese campo
  const facturas = facturasArray.value.filter(
    f => parseFloat(f[campo] || 0) > 0
  );

  if (!facturas.length) {
    Swal.fire("Sin datos", `No se encontraron facturas con ${metodoPago}`, "info");
    return;
  }

  // 6️⃣ Preparar datos para tabla
  const datos = facturas.map(f => ({
    fecha: f.fecha_emision,
    cliente: f.nombre_cliente,
    rnc: f.rnc_cliente || f.cod_cliente,
    comprobante: f.tipo_factura,
    monto: parseFloat(f[campo] || 0),
    itbis: parseFloat(f.impuesto || 0),
    metodo: metodoPago
  }));

  const totalMonto = datos.reduce((acc, d) => acc + d.monto, 0);
  const totalItbis = datos.reduce((acc, d) => acc + d.itbis, 0);

  // 7️⃣ Generar PDF
  const doc = new jsPDF();
  doc.setFontSize(14);
  doc.text(`📑 Informe por Método de Pago: ${metodoPago}`, 10, 15);

  autoTable(doc, {
    startY: 25,
    head: [["Fecha", "Cliente", "RNC/Cédula", "Comprobante", "Monto", "ITBIS", "Método Pago"]],
    body: datos.map(d => [
      d.fecha,
      d.cliente,
      d.rnc,
      d.comprobante,
      d.monto.toFixed(2),
      d.itbis.toFixed(2),
      d.metodo
    ])
  });

  // 🔹 Resumen
  autoTable(doc, {
    startY: doc.lastAutoTable.finalY + 10,
    head: [["Resumen", "Monto"]],
    body: [
      ["Total en " + metodoPago, totalMonto.toFixed(2)],
      ["Total ITBIS", totalItbis.toFixed(2)],
      ["Total Facturas", facturas.length.toString()]
    ],
    theme: "grid"
  });

  const pdfBlob = doc.output("blob");
  const url = URL.createObjectURL(pdfBlob);

  Swal.fire({
    title: `Informe Método: ${metodoPago}`,
    html: `<embed src="${url}" width="100%" height="400px" type="application/pdf" />`,
    width: 700,
    showCloseButton: true,
    confirmButtonText: "⬇️ Descargar",
    preConfirm: () => {
      doc.save(`Informe_MetodoPago_${metodoPago}.pdf`);
    }
  });
};


/***********************************************************************************/
const generarInformeFinanciamientos = async () => {
  // 1️⃣ Obtener todos los financiamientos desde la base
  const financiamientos = await peticionesFetchOffline('getDataAsArray', 'financiamientos');

  if (!financiamientos || !financiamientos.length) {
    Swal.fire("Sin datos", "No se encontraron financiamientos registrados", "info");
    return;
  }

  // 2️⃣ Calcular totales y estadísticas
  const resumen = {
    totalRegistros: financiamientos.length,
    totalCapital: 0,
    totalInteres: 0,
    totalMonto: 0,
    totalAbonado: 0,
    totalPendiente: 0,
    porEstado: {}
  };

  financiamientos.forEach(f => {
    resumen.totalCapital += parseFloat(f.capital || 0);
    resumen.totalInteres += parseFloat(f.interes_total || 0);
    resumen.totalMonto += parseFloat(f.monto_total || 0);
    resumen.totalAbonado += parseFloat(f.total_abonado || 0);
    resumen.totalPendiente += parseFloat(f.total_pendiente || 0);

    const estado = f.estado_financiamiento || 'Sin estado';
    if (!resumen.porEstado[estado]) resumen.porEstado[estado] = 0;
    resumen.porEstado[estado]++;
  });

  // 3️⃣ Preparar datos de la tabla
  const datos = financiamientos.map(f => ({
    codigo: f.no_financiamiento,
    cliente: f.nombre_cliente,
    cedula: f.cedula_cliente,
    capital: parseFloat(f.capital || 0).toFixed(2),
    interes: parseFloat(f.interes_total || 0).toFixed(2),
    monto: parseFloat(f.monto_total || 0).toFixed(2),
    abonado: parseFloat(f.total_abonado || 0).toFixed(2),
    pendiente: parseFloat(f.total_pendiente || 0).toFixed(2),
    estado: f.estado_financiamiento || "Sin estado"
  }));

  // 4️⃣ Generar PDF
  const doc = new jsPDF("p", "mm", "letter");
  const fecha = nfecha("fecha");

  doc.setFontSize(16);
  doc.text("📊 Resumen General de Financiamientos", 10, 15);
  doc.setFontSize(10);
  doc.text(`Generado el ${fecha}`, 10, 22);

  autoTable(doc, {
    startY: 28,
    head: [["Código", "Cliente", "Cédula", "Capital", "Interés", "Monto Total", "Abonado", "Pendiente", "Estado"]],
    body: datos.map(d => [
      d.codigo,
      d.cliente,
      d.cedula,
      d.capital,
      d.interes,
      d.monto,
      d.abonado,
      d.pendiente,
      d.estado
    ]),
    styles: { fontSize: 8 },
    headStyles: { fillColor: [52, 152, 219], textColor: 255 }
  });

  // 5️⃣ Sección de resumen numérico
  const estadosResumen = Object.entries(resumen.porEstado).map(([estado, cantidad]) => [
    estado,
    cantidad
  ]);

  autoTable(doc, {
    startY: doc.lastAutoTable.finalY + 10,
    head: [["Resumen", "Valor"]],
    body: [
      ["Total Registros", resumen.totalRegistros],
      ["Total Capital", resumen.totalCapital.toFixed(2)],
      ["Total Interés", resumen.totalInteres.toFixed(2)],
      ["Total Monto Financiamientos", resumen.totalMonto.toFixed(2)],
      ["Total Abonado", resumen.totalAbonado.toFixed(2)],
      ["Total Pendiente", resumen.totalPendiente.toFixed(2)],
      ["---", "---"],
      ...estadosResumen
    ],
    theme: "grid",
    headStyles: { fillColor: [46, 204, 113], textColor: 255 },
    styles: { fontSize: 9 }
  });

  // 6️⃣ Mostrar en pantalla con opción a descargar
  const pdfBlob = doc.output("blob");
  const url = URL.createObjectURL(pdfBlob);

  Swal.fire({
    title: "Informe de Financiamientos",
    html: `<embed src="${url}" width="100%" height="400px" type="application/pdf" />`,
    width: 700,
    showCloseButton: true,
    confirmButtonText: "⬇️ Descargar",
    preConfirm: () => {
      doc.save(`Informe_Financiamientos_${fecha}.pdf`);
    }
  });
};

/***********************************************************************************/
const pesos = ref('0.00')
const cincopesos = ref('0.00')
const diezpesos = ref('0.00')
const veinticincopesos = ref('0.00')
const cincuentapesos = ref('0.00')
const cienpesos = ref('0.00')
const docientospesos = ref('0.00')
const quinientoscopesos = ref('0.00')
const milpesos = ref('0.00')
const dosmilpesos = ref('0.00')
const totalModal = ref('0.00')
/***********************************************************************************/
const fnVerCuadreDetalles = async () => {
  try {
    // Selección del formato
    const { value: formato } = await Swal.fire({
      title: "Seleccionar Formato de PDF",
      input: "select",
      inputOptions: {
        carta: "📄 Carta (A4)",
        ticket: "🧾 Ticket 80mm",
      },
      inputPlaceholder: "Elige un formato",
      inputValue: "carta",
      showCancelButton: true,
      confirmButtonText: "Continuar",
      cancelButtonText: "Cancelar",
    })
    if (!formato) return

    // 💰 Monedero
    const monedero = {
      "1": Number(pesos.value) || 0,
      "5": Number(cincopesos.value) || 0,
      "10": Number(diezpesos.value) || 0,
      "25": Number(veinticincopesos.value) || 0,
      "50": Number(cincuentapesos.value) || 0,
      "100": Number(cienpesos.value) || 0,
      "200": Number(docientospesos.value) || 0,
      "500": Number(quinientoscopesos.value) || 0,
      "1000": Number(milpesos.value) || 0,
      "2000": Number(dosmilpesos.value) || 0,
    }

    // Datos base
    const data = datosDelDia.value?.data || {}
    const facturas = data.facturas || []
    const gastos = data.gastos || []
    const cuadres = data.registrocaja || []
    const cuentas = data.cuentas_cobrar || []
    const taller = data.taller || []

    // ================= 🔹 FACTURAS =================
    const efectivoVentas = facturas
      .filter((f) => f.estado_factura === "Cobrado" && f.metodo_pago === "EFECTIVO")
      .reduce((a, f) => a + Number(f.efectivo || 0), 0)
    const tarjetaVentas = facturas
      .filter((f) => f.estado_factura === "Cobrado")
      .reduce((a, f) => a + Number(f.tarjeta || 0), 0)
    const transferenciaVentas = facturas
      .filter((f) => f.estado_factura === "Cobrado")
      .reduce((a, f) => a + Number(f.transferencia || 0), 0)
    const totalVenta = efectivoVentas + tarjetaVentas + transferenciaVentas

    // ================= 🔹 CUENTAS POR COBRAR =================
    let totalCxC = 0,
      abonado = 0,
      efectivoCxC = 0,
      tarjetaCxC = 0,
      transferenciaCxC = 0
    const resumenCxC = []

    cuentas.forEach((f) => {
      const montoCredito = Number(f.monto_credito || 0)
      totalCxC += montoCredito
      let totalPagos = 0

      try {
        const pagos = JSON.parse(f.pagos || "[]")
        pagos.forEach((p) => {
          const cantidad = Number(p.cantidad || 0)
          if (cantidad > 0) {
            totalPagos += cantidad
            abonado += cantidad
            switch (p.metodo) {
              case "EFECTIVO":
                efectivoCxC += cantidad
                break
              case "TARJETA":
                tarjetaCxC += cantidad
                break
              case "TRANSFERENCIA":
                transferenciaCxC += cantidad
                break
            }
          }
        })
      } catch {}

      const pendiente = montoCredito - totalPagos
      resumenCxC.push([
        f.nombre_cliente || "Sin nombre",
        montoCredito.toFixed(2),
        totalPagos.toFixed(2),
        pendiente.toFixed(2),
      ])
    })

    // ================= 🔹 TALLER (ABONOS REALES) =================
    let efectivoTaller = 0,
      tarjetaTaller = 0,
      transferenciaTaller = 0,
      totalTaller = 0
    const resumenTaller = []

    taller.forEach((t) => {
      let totalAbonos = 0
      let efectivo = 0,
        tarjeta = 0,
        transferencia = 0

      try {
        const abonos = JSON.parse(t.abono || "[]")
        abonos.forEach((ab) => {
          const monto = Number(ab.abono || 0)
          if (monto > 0) {
            totalAbonos += monto
            switch (ab.metodo_pago) {
              case "EFECTIVO":
                efectivo += monto
                efectivoTaller += monto
                break
              case "TARJETA":
                tarjeta += monto
                tarjetaTaller += monto
                break
              case "TRANSFERENCIA":
                transferencia += monto
                transferenciaTaller += monto
                break
            }
          }
        })
      } catch {}

      totalTaller += totalAbonos

      const fallas = (() => {
        try {
          const f = JSON.parse(t.fallas || "[]")
          return f.map((x) => x.propiedad).join(", ") || "N/A"
        } catch {
          return "N/A"
        }
      })()

      const pendiente = Number(t.total || 0) - totalAbonos

      resumenTaller.push([
        t.nombre || "Sin nombre",
        `${t.equipo || ""} ${t.modelo || ""}`,
        fallas,
        totalAbonos.toFixed(2),
        pendiente.toFixed(2),
      ])
    })

    // ================= 🔹 GASTOS =================
// --- Detalle de Gastos ---
const tablaGastos = gastos.map((g) => [
  g.descripcion || "Sin descripción",
  (g.metodo || "N/D").toUpperCase(),
  Number(g.cantidad || 0).toFixed(2),
  g.cajero || g.usuario || "Desconocido",
]);

// --- Calcular subtotales por método ---
const gastoEfectivo = gastos
  .filter((g) => (g.metodo || "").toUpperCase() === "EFECTIVO")
  .reduce((a, g) => a + Number(g.cantidad || 0), 0);

const gastoTarjeta = gastos
  .filter((g) => (g.metodo || "").toUpperCase() === "TARJETA")
  .reduce((a, g) => a + Number(g.cantidad || 0), 0);

const gastoTransferencia = gastos
  .filter((g) => (g.metodo || "").toUpperCase() === "TRANSFERENCIA")
  .reduce((a, g) => a + Number(g.cantidad || 0), 0);

const totalGastos = gastoEfectivo + gastoTarjeta + gastoTransferencia;

    // ================= 🔹 TOTALES =================
    const cantidadInicio = cuadres.reduce((acc, c) => acc + Number(c.cant_inicio || 0), 0)
   // const cantidadInicio = cuadres.reduce((acc, c) => acc + Number(c.cantidad_inicio || 0), 0)
    //const totalGastos = gastos.reduce((acc, g) => acc + Number(g.cantidad || 0), 0)
    const totalEfectivo = efectivoVentas + efectivoCxC + efectivoTaller
    const totalTarjeta = tarjetaVentas + tarjetaCxC + tarjetaTaller
    const totalTransferencia = transferenciaVentas + transferenciaCxC + transferenciaTaller
    const totalEnCaja = totalEfectivo + cantidadInicio - totalGastos
    const totalGeneral = totalEfectivo + totalTarjeta + totalTransferencia + cantidadInicio - totalGastos
    const diferencia = Number(totalModal.value) - totalEnCaja

    const nDatosEmpresa = JSON.parse(JSON.stringify(enviarDatosLocalStorage()))
    nDatosEmpresa.usuario = datosEmpresa.usuario

    const doc =
      formato === "ticket"
        ? new jsPDF({ orientation: "portrait", unit: "mm", format: [80, 1000] })
        : new jsPDF({ orientation: "portrait", unit: "mm", format: "A4" })

    // ========================================================
    // ==================== 📄 FORMATO CARTA ==================
    // ========================================================
    if (formato === "carta") {
      doc.setFontSize(14)
      doc.text(nDatosEmpresa.empresa?.nombre || "Empresa", 105, 15, { align: "center" })
      doc.setFontSize(11)
      doc.text("REPORTE DE CUADRE DE CAJA", 105, 22, { align: "center" })
      doc.line(10, 25, 200, 25)

      doc.setFontSize(10)
      doc.text(`Usuario: ${nDatosEmpresa.usuario.nombre}`, 10, 32)
      doc.text(`Fecha: ${nfecha("fecha")}`, 150, 32)

      // --- Totales Generales ---
autoTable(doc, {
  startY: 40,
  theme: "grid",
  head: [["Concepto", "Monto (RD$)"]],
  body: [
    [{ content: "VENTAS", colSpan: 2, styles: { halign: "center", fillColor: [33, 150, 243], textColor: 255 } }],
    ["Efectivo", efectivoVentas.toFixed(2)],
    ["Tarjeta", tarjetaVentas.toFixed(2)],
    ["Transferencia", transferenciaVentas.toFixed(2)],
    ["Total Ventas", (efectivoVentas + tarjetaVentas + transferenciaVentas).toFixed(2)],

    [{ content: "CUENTAS POR COBRAR", colSpan: 2, styles: { halign: "center", fillColor: [255, 152, 0], textColor: 255 } }],
    ["Efectivo", efectivoCxC.toFixed(2)],
    ["Tarjeta", tarjetaCxC.toFixed(2)],
    ["Transferencia", transferenciaCxC.toFixed(2)],
    ["Total CxC", (efectivoCxC + tarjetaCxC + transferenciaCxC).toFixed(2)],

    [{ content: "TALLER", colSpan: 2, styles: { halign: "center", fillColor: [76, 175, 80], textColor: 255 } }],
    ["Efectivo", efectivoTaller.toFixed(2)],
    ["Tarjeta", tarjetaTaller.toFixed(2)],
    ["Transferencia", transferenciaTaller.toFixed(2)],
    ["Total Taller", (efectivoTaller + tarjetaTaller + transferenciaTaller).toFixed(2)],

    [{ content: "GASTOS", colSpan: 2, styles: { halign: "center", fillColor: [244, 67, 54], textColor: 255 } }],
    ["Efectivo", gastoEfectivo.toFixed(2)],
    ["Tarjeta", gastoTarjeta.toFixed(2)],
    ["Transferencia", gastoTransferencia.toFixed(2)],
    ["Total Gastos", totalGastos.toFixed(2)],

    [{ content: "TOTALES FINALES", colSpan: 2, styles: { halign: "center", fillColor: [0, 188, 212], textColor: 255 } }],
    ["Inicio Caja", cantidadInicio.toFixed(2)],
    ["Total en Caja (Efectivo + Inicio - Gastos)", totalEnCaja.toFixed(2)],
    ["Diferencia", diferencia.toFixed(2)]
  ],
  styles: { fontSize: 9, cellPadding: 2 }
});

      // --- Detalle Facturas ---
      const ventasY = doc.lastAutoTable.finalY + 10
      doc.setFontSize(12)
      doc.text("Detalle de Facturas", 105, ventasY, { align: "center" })
      const detalleFacturas = facturas.map((f) => [
        f.no_factura,
        f.nombre_cliente || "CLIENTE",
        f.metodo_pago,
        Number(f.total).toFixed(2),
      ])
      autoTable(doc, {
        startY: ventasY + 5,
        theme: "striped",
        head: [["Factura", "Cliente", "Método", "Total RD$"]],
        body: detalleFacturas,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [33, 150, 243], textColor: 255 },
      })

      // --- Cuentas por Cobrar ---
      const cxcY = doc.lastAutoTable.finalY + 10
      doc.text("Resumen de Cuentas por Cobrar", 105, cxcY, { align: "center" })
      autoTable(doc, {
        startY: cxcY + 5,
        theme: "grid",
        head: [["Cliente", "Crédito", "Pagado", "Pendiente"]],
        body: resumenCxC,
        styles: { fontSize: 9 },
        headStyles: { fillColor: [255, 152, 0], textColor: 255 },
      })

      // --- Taller ---
      const tallerY = doc.lastAutoTable.finalY + 10
      doc.text("Resumen de Taller (Abonos)", 105, tallerY, { align: "center" })
      autoTable(doc, {
        startY: tallerY + 5,
        theme: "grid",
        head: [["Cliente", "Equipo", "Fallas", "Abonado", "Pendiente"]],
        body: resumenTaller,
        styles: { fontSize: 9 },
        headStyles: { fillColor: [76, 175, 80], textColor: 255 },
      })

      // --- Gastos ---
      const gastosY = doc.lastAutoTable.finalY + 10
      doc.text("Resumen de Gastos", 105, gastosY, { align: "center" })
      autoTable(doc, {
        startY: gastosY + 5,
        theme: "grid",
        head: [["Descripción", "Método", "Monto RD$", "Cajero"]],
        body: tablaGastos,
        styles: { fontSize: 9 },
        headStyles: { fillColor: [244, 67, 54], textColor: 255 },
      })
    }

    // ========================================================
    // ==================== 🧾 FORMATO 80MM ==================
    // ========================================================
    else {
      const ancho = 40
      let y = 10

      doc.setFontSize(10)
      doc.text(nDatosEmpresa.empresa?.nombre || "EMPRESA", ancho, y, { align: "center" })
      y += 5
      doc.text("CUADRE DE CAJA", ancho, y, { align: "center" })
      y += 5
      doc.text(`Usuario: ${nDatosEmpresa.usuario.nombre}`, 5, y)
      y += 4
      doc.text(`Fecha: ${nfecha("fecha")}`, 5, y)
      y += 4
      doc.line(5, y, 75, y)
      y += 5

      // --- Totales ---
      const line = (label, val) => {
        doc.text(`${label}: RD$${val.toFixed(2)}`, 5, y)
        y += 4
      }
      line("Ventas Efectivo", efectivoVentas)
      line("Ventas Tarjeta", tarjetaVentas)
      line("Ventas Transf.", transferenciaVentas)
      line("CxC Abonos", abonado)
      line("Taller Abonos", totalTaller)
      line("Gastos", totalGastos)
      line("Inicio Caja", cantidadInicio)
      line("Total en Caja", totalEnCaja)
      line("Diferencia", diferencia)
      doc.line(5, y, 75, y)
      y += 5

      // --- Facturas ---
      doc.text("FACTURAS", ancho, y, { align: "center" })
      y += 4
      facturas.forEach((f) => {
        doc.text(`${f.no_factura} - ${f.metodo_pago} - ${Number(f.total).toFixed(2)}`, 5, y)
        y += 4
      })
      doc.line(5, y, 75, y)
      y += 5

      // --- CxC ---
      doc.text("CUENTAS X COBRAR", ancho, y, { align: "center" })
      y += 4
      resumenCxC.forEach((c) => {
        doc.text(`${c[0]} Pag: ${c[2]} Pend: ${c[3]}`, 5, y)
        y += 4
      })
      doc.line(5, y, 75, y)
      y += 5

      // --- Taller ---
      doc.text("TALLER (Abonos)", ancho, y, { align: "center" })
      y += 4
      resumenTaller.forEach((t) => {
        doc.text(`${t[0]} Ab:${t[3]} Pend:${t[4]}`, 5, y)
        y += 4
      })
      doc.line(5, y, 75, y)
      y += 5

      // --- Gastos ---
      doc.text("GASTOS", ancho, y, { align: "center" })
      y += 4
      tablaGastos.forEach((g) => {
        doc.text(`${g[0]}: ${g[2]}`, 5, y)
        y += 4
      })
      doc.text(`Total Gastos: ${totalGastos.toFixed(2)}`, 5, y)
      y += 6

      doc.line(5, y, 75, y)
      y += 5
      doc.setFontSize(8)
      doc.text("Gracias por usar TM POS SRL", ancho, y, { align: "center" })
    }

    // Mostrar PDF
    const pdfBlob = doc.output("blob")
    const pdfUrl = URL.createObjectURL(pdfBlob)
    await Swal.fire({
      title: "Vista Previa del Cuadre",
      html: `<iframe src="${pdfUrl}" width="100%" height="${formato === "ticket" ? "600px" : "500px"}" style="border:none;"></iframe>`,
      width: formato === "ticket" ? "400px" : "80%",
      showCancelButton: true,
      confirmButtonText: "Descargar PDF",
      cancelButtonText: "Cerrar",
      preConfirm: () =>
        doc.save(`cuadre_${formato === "ticket" ? "80mm" : "carta"}_${nfecha("fecha")}.pdf`),
    })
  } catch (error) {
    console.error("❌ Error generando el PDF del cuadre:", error)
    toast.add({
      severity: "error",
      summary: "Error",
      detail: "No se pudo generar el PDF",
      life: 3000,
    })
  }
}

/***********************************************************************************/
const verDetalleCuadre = (cuadre) => {
  const formatoMoneda = (valor) => {
    const num = parseFloat(valor || 0);
    return num.toLocaleString("es-DO", { style: "currency", currency: "DOP" });
  };

  Swal.fire({
    title: `<div style="font-size:1.2rem;font-weight:bold;color:#2563eb;">🧾 Cuadre #${
      cuadre.id || "N/D"
    }</div>`,
    html: `
      <div style="
        text-align:left;
        font-family:Arial, sans-serif;
        border:1px solid #ddd;
        border-radius:8px;
        padding:15px;
        background:#f9fafb;
      ">
        <div style="margin-bottom:10px;border-bottom:1px solid #e5e7eb;padding-bottom:6px;">
          <p><b>📅 Fecha:</b> ${cuadre.fecha || "N/D"}</p>
          <p><b>⏰ Inicio:</b> ${cuadre.created_at || "N/D"}</p>
          <p><b>🏁 Fin:</b> ${cuadre.updated_at || "N/D"}</p>
          <p><b>👤 Cajero:</b> ${cuadre.turno || "N/D"}</p>
          <p><b>📦 Estado:</b>
            <span style="color:${
              cuadre.estado === "cerrado" ? "#16a34a" : "#f59e0b"
            };font-weight:bold;">
              ${cuadre.estado ? cuadre.estado.toUpperCase() : "ABIERTO"}
            </span>
          </p>
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
          <div style="background:#fff;padding:10px;border-radius:6px;border:1px solid #e5e7eb;">
            <p><b>💰 Total Ventas</b></p>
            <p style="color:#1e3a8a;font-weight:bold;">${formatoMoneda(
              cuadre.total_ventas
            )}</p>
          </div>

          <div style="background:#fff;padding:10px;border-radius:6px;border:1px solid #e5e7eb;">
            <p><b>💵 Cantidad Inicial</b></p>
            <p style="color:#0f766e;font-weight:bold;">${formatoMoneda(
              cuadre.cant_inicio
            )}</p>
          </div>

          <div style="background:#fff;padding:10px;border-radius:6px;border:1px solid #e5e7eb;">
            <p><b>💸 Efectivo</b></p>
            <p style="color:#15803d;font-weight:bold;">${formatoMoneda(
              cuadre.efectivo
            )}</p>
          </div>

          <div style="background:#fff;padding:10px;border-radius:6px;border:1px solid #e5e7eb;">
            <p><b>🏦 Crédito</b></p>
            <p style="color:#b91c1c;font-weight:bold;">${formatoMoneda(
              cuadre.credito
            )}</p>
          </div>
        </div>
      </div>
    `,
    showDenyButton: true,
    showCancelButton: true,
    confirmButtonText: "🔍 Ver datos",
    denyButtonText: "🧾 Ver PDF",
    cancelButtonText: "Cerrar",
    confirmButtonColor: "#2563eb", // azul
    denyButtonColor: "#16a34a", // verde
    cancelButtonColor: "#6b7280", // gris
    width: 600,
    background: "#f3f4f6",
  }).then(async(result) => {
    if (result.isConfirmed) {
      // 👇 Ejecuta tu función para ver datos
      //verDatosCuadre(cuadre);
      console.log("cuadre", cuadre);

  //const fechasCuadre = convertirAFechaTimestamp(cuadre.fecha,cuadre.hora_inicio)
  fechaInicio.value = cuadre.fecha
  //horaInicio.value = cuadre.fecha_inicio.split(' ')[1]
  horaInicio.value = cuadre.created_at?.split(' ')[1]


  fechaFin.value = cuadre.fecha
  //horaFin.value = cuadre.fecha_fin.split(' ')[1]
  horaFin.value = cuadre.updated_at?.split(' ')[1]
  await fetchAndSetupDatosdelDia()



    } else if (result.isDenied) {

  fechaInicio.value = cuadre.fecha
  //horaInicio.value = cuadre.fecha_inicio.split(' ')[1]
  horaInicio.value = cuadre.created_at?.split(' ')[1]
  fechaFin.value = cuadre.fecha
  //horaFin.value = cuadre.fecha_fin.split(' ')[1]
  horaFin.value = cuadre.updated_at?.split(' ')[1]
  await fetchAndSetupDatosdelDia()


      fnVerCuadreDetalles()
    }
  });
};


/***********************************************************************************/
const loadingReajuste = ref(false);
/***********************************************************************************/
const fnreajustarGanancias = async () => {
  if (loadingReajuste.value) return;

  loadingReajuste.value = true;

  try {
    const facturas = datosDelDia.value.data.facturas;

    for (const factura of facturas) {
      try {
        // 🧩 Parsear productos
        let productos = [];

        if (factura.productos) {
          productos = typeof factura.productos === 'string'
            ? JSON.parse(factura.productos)
            : factura.productos;
        }

        if (!Array.isArray(productos) || productos.length === 0) {
          console.warn(`Factura ${factura.id} sin productos`);
          continue;
        }

        let gananciaFactura = 0;

        // 🔁 Recalcular totales y ganancias por producto
        productos = productos.map(prod => {
          const cantidad = parseFloat(prod.cantidad) || 1;

          const precioFinal =
            parseFloat(prod.precio_final) ||
            parseFloat(prod.precio_venta) ||
            parseFloat(prod.precio) ||
            0;

          const descuento = parseFloat(prod.descuento) || 0;
          const costo = parseFloat(prod.costo) || 0;

          // 🧮 Total del producto
          const totalCalculado = (precioFinal * cantidad) - descuento;
          const totalRectificado = Number.isFinite(totalCalculado)
            ? totalCalculado
            : parseFloat(prod.total) || 0;

          // 💰 Ganancia del producto
          let gananciaRectificada = 0;

          // 🚫 Regla: DESCUENTO APLICADO nunca genera ganancia
          if (String(prod.nombre).toUpperCase() === 'DESCUENTO APLICADO') {
            gananciaRectificada = 0;
          } else {
            const gananciaProducto = (precioFinal - costo) * cantidad;
            gananciaRectificada = Number.isFinite(gananciaProducto)
              ? gananciaProducto
              : parseFloat(prod.ganancia) || 0;
          }

          gananciaFactura += gananciaRectificada;

          return {
            ...prod,
            total: totalRectificado.toFixed(2),
            ganancia: gananciaRectificada.toFixed(2),
            ganancia_pura: gananciaRectificada.toFixed(2)
          };
        });

        gananciaFactura = parseFloat(gananciaFactura.toFixed(2)) || 0;

        // ✍️ Actualizar factura en memoria
        factura.ganancia = gananciaFactura.toFixed(2);
        factura.productos = JSON.stringify(productos);

        // 📝 Actualizar factura en BD
        await peticionesFetchOffline(
          'updateData',
          'facturas',
          JSON.stringify(factura)
        );

        console.log(`✅ Factura ${factura.id} → Ganancia corregida: ${gananciaFactura}`);
      } catch (errFactura) {
        console.error(`❌ Error en factura ${factura.id}`, errFactura);
      }
    }

    // 🔄 Refrescar datos del día
    await fetchAndSetupDatosdelDia();

    // ✅ Toast final
    toast.add({
      severity: 'success',
      summary: 'Proceso completado',
      detail: 'Ganancias y totales reajustados correctamente',
      life: 4000
    });

    console.log('🔥 Reajuste de ganancias y totales finalizado');
  } catch (error) {
    console.error('❌ Error general en reajuste', error);

    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Ocurrió un problema al reajustar las ganancias',
      life: 5000
    });
  } finally {
    loadingReajuste.value = false;
  }
};




/***********************************************************************************/

</script>

<template>
<main class="content-wrapper">
  <div class="w-full px-4 mt-6">

    <!-- Page Header -->
    <Card class="mb-6">
      <template #content>
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-3xl font-bold text-gray-800 mb-1">Dashboard de Informes</h1>
            <p class="text-gray-600">Vista general de ventas, gastos y métricas</p>
          </div>
          <div class="hidden md:block">
            <i class="pi pi-chart-line text-5xl text-blue-500"></i>
          </div>
        </div>
      </template>
    </Card>

    <div class="grid grid-cols-12 gap-6">

      <!-- PRIMARY STATS DASHBOARD -->
      <div class="col-span-12">
        <Card>
          <template #header>
            <div class="px-6 py-4 border-b border-gray-200">
              <h2 class="text-xl font-semibold text-gray-800">Métricas Principales</h2>
            </div>
          </template>
          <template #content>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">

              <!-- Total de Ventas -->
              <div class="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200">
                <div class="flex justify-between items-start mb-3">
                  <div>
                    <p class="text-sm font-medium text-blue-600 mb-1">Total de Ventas</p>
                    <p class="text-2xl font-bold text-blue-900">{{datosConfiguracion.simbolo}}{{decimales(datosDelDia.venta)}}</p>
                  </div>
                  <div class="bg-blue-500 p-3 rounded-lg">
                    <i class="pi pi-shopping-cart text-white text-xl"></i>
                  </div>
                </div>
              </div>

              <!-- Ganancias -->
              <div v-if="datosEmpresa.usuario.nivel_seguridad === 'Soporte' || datosEmpresa.usuario.nivel_seguridad === 'Administrador'" class="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg border border-green-200">
                <div class="flex justify-between items-start mb-3">
                  <div>
                    <p class="text-sm font-medium text-green-600 mb-1">Ganancias</p>
                    <p class="text-2xl font-bold text-green-900">{{datosConfiguracion.simbolo}}{{decimales(datosDelDia.ganancia)}}</p>
                  </div>
                  <div class="bg-green-500 p-3 rounded-lg">
                    <i class="pi pi-wallet text-white text-xl"></i>
                  </div>
                </div>
              </div>

              <!-- Total de Costos -->
              <div v-if="datosEmpresa.usuario.nivel_seguridad === 'Soporte' || datosEmpresa.usuario.nivel_seguridad === 'Administrador'" class="bg-gradient-to-br from-slate-50 to-slate-100 p-4 rounded-lg border border-slate-200">
                <div class="flex justify-between items-start mb-3">
                  <div>
                    <p class="text-sm font-medium text-slate-600 mb-1">Total de Costos</p>
                    <p class="text-2xl font-bold text-slate-900">{{datosConfiguracion.simbolo}}{{decimales(datosDelDia.costos)}}</p>
                  </div>
                  <div class="bg-slate-600 p-3 rounded-lg">
                    <i class="pi pi-box text-white text-xl"></i>
                  </div>
                </div>
              </div>

              <!-- Impuestos -->
              <div class="bg-gradient-to-br from-cyan-50 to-cyan-100 p-4 rounded-lg border border-cyan-200">
                <div class="flex justify-between items-start mb-3">
                  <div>
                    <p class="text-sm font-medium text-cyan-600 mb-1">Impuestos</p>
                    <p class="text-2xl font-bold text-cyan-900">{{datosConfiguracion.simbolo}}{{decimales(datosDelDia.impuestos)}}</p>
                  </div>
                  <div class="bg-cyan-500 p-3 rounded-lg">
                    <i class="pi pi-receipt text-white text-xl"></i>
                  </div>
                </div>
              </div>

              <!-- Gastos -->
              <div class="bg-gradient-to-br from-orange-50 to-orange-100 p-4 rounded-lg border border-orange-200">
                <div class="flex justify-between items-start mb-3">
                  <div>
                    <p class="text-sm font-medium text-orange-600 mb-1">Gastos</p>
                    <p class="text-2xl font-bold text-orange-900">{{datosConfiguracion.simbolo}}{{decimales(datosDelDia.gastos)}}</p>
                  </div>
                  <div class="bg-orange-500 p-3 rounded-lg">
                    <i class="pi pi-minus-circle text-white text-xl"></i>
                  </div>
                </div>
              </div>

              <!-- Total Nómina ACTIVA -->
              <div class="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-lg border border-purple-200">
                <div class="flex justify-between items-start mb-3">
                  <div>
                    <p class="text-sm font-medium text-purple-600 mb-1">Nómina Activa</p>
                    <p class="text-2xl font-bold text-purple-900">{{datosConfiguracion.simbolo}}{{decimales(datosDelDia.nomina)}}</p>
                  </div>
                  <div class="bg-purple-500 p-3 rounded-lg">
                    <i class="pi pi-users text-white text-xl"></i>
                  </div>
                </div>
              </div>

              <!-- Gastos Fijos -->
              <div class="bg-gradient-to-br from-pink-50 to-pink-100 p-4 rounded-lg border border-pink-200">
                <div class="flex justify-between items-start mb-3">
                  <div>
                    <p class="text-sm font-medium text-pink-600 mb-1">Gastos Fijos</p>
                    <p class="text-2xl font-bold text-pink-900">{{datosConfiguracion.simbolo}}{{decimales(totalGastosFijos)}}</p>
                  </div>
                  <div class="bg-pink-500 p-3 rounded-lg">
                    <i class="pi pi-calendar text-white text-xl"></i>
                  </div>
                </div>
              </div>

              <!-- Abonos -->
              <div class="bg-gradient-to-br from-emerald-50 to-emerald-100 p-4 rounded-lg border border-emerald-200">
                <div class="flex justify-between items-start mb-3">
                  <div>
                    <p class="text-sm font-medium text-emerald-600 mb-1">Abonos</p>
                    <p class="text-2xl font-bold text-emerald-900">{{datosConfiguracion.simbolo}}{{decimales(datosDelDia.abono)}}</p>
                  </div>
                  <div class="bg-emerald-500 p-3 rounded-lg">
                    <i class="pi pi-arrow-down text-white text-xl"></i>
                  </div>
                </div>
              </div>

              <!-- Cuentas por Cobrar -->
              <div class="bg-gradient-to-br from-yellow-50 to-yellow-100 p-4 rounded-lg border border-yellow-200">
                <div class="flex justify-between items-start mb-3">
                  <div>
                    <p class="text-sm font-medium text-yellow-600 mb-1">Cuentas x Cobrar</p>
                    <p class="text-2xl font-bold text-yellow-900">{{datosConfiguracion.simbolo}}{{decimales(datosDelDia.cuentasXcobrar)}}</p>
                  </div>
                  <div class="bg-yellow-500 p-3 rounded-lg">
                    <i class="pi pi-clock text-white text-xl"></i>
                  </div>
                </div>
              </div>

              <!-- Taller -->
              <div class="bg-gradient-to-br from-indigo-50 to-indigo-100 p-4 rounded-lg border border-indigo-200">
                <div class="flex justify-between items-start mb-3">
                  <div>
                    <p class="text-sm font-medium text-indigo-600 mb-1">Taller</p>
                    <p class="text-2xl font-bold text-indigo-900">{{datosConfiguracion.simbolo}}{{decimales(datosDelDia.taller)}}</p>
                  </div>
                  <div class="bg-indigo-500 p-3 rounded-lg">
                    <i class="pi pi-wrench text-white text-xl"></i>
                  </div>
                </div>
              </div>

              <!-- Devoluciones -->
              <div class="bg-gradient-to-br from-red-50 to-red-100 p-4 rounded-lg border border-red-200">
                <div class="flex justify-between items-start mb-3">
                  <div>
                    <p class="text-sm font-medium text-red-600 mb-1">Devoluciones</p>
                    <p class="text-2xl font-bold text-red-900">{{datosConfiguracion.simbolo}}{{decimales(datosDelDia.devoluciones)}}</p>
                  </div>
                  <div class="bg-red-500 p-3 rounded-lg">
                    <i class="pi pi-replay text-white text-xl"></i>
                  </div>
                </div>
              </div>

              <!-- Total en Efectivo -->
              <div class="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg border border-green-200">
                <div class="flex justify-between items-start mb-3">
                  <div>
                    <p class="text-sm font-medium text-green-600 mb-1">Efectivo</p>
                    <p class="text-2xl font-bold text-green-900">{{datosConfiguracion.simbolo}}{{decimales(datosDelDia.efectivo)}}</p>
                  </div>
                  <div class="bg-green-600 p-3 rounded-lg">
                    <i class="pi pi-money-bill text-white text-xl"></i>
                  </div>
                </div>
              </div>

              <!-- Total en Transferencia -->
              <div class="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200">
                <div class="flex justify-between items-start mb-3">
                  <div>
                    <p class="text-sm font-medium text-blue-600 mb-1">Transferencia</p>
                    <p class="text-2xl font-bold text-blue-900">{{datosConfiguracion.simbolo}}{{decimales(datosDelDia.transferencia)}}</p>
                  </div>
                  <div class="bg-blue-600 p-3 rounded-lg">
                    <i class="pi pi-send text-white text-xl"></i>
                  </div>
                </div>
              </div>

              <!-- Total en Tarjeta -->
              <div class="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-lg border border-purple-200">
                <div class="flex justify-between items-start mb-3">
                  <div>
                    <p class="text-sm font-medium text-purple-600 mb-1">Tarjeta</p>
                    <p class="text-2xl font-bold text-purple-900">{{datosConfiguracion.simbolo}}{{decimales(datosDelDia.tarjeta)}}</p>
                  </div>
                  <div class="bg-purple-600 p-3 rounded-lg">
                    <i class="pi pi-credit-card text-white text-xl"></i>
                  </div>
                </div>
              </div>

              <!-- Total en Cheque -->
              <div class="bg-gradient-to-br from-gray-50 to-gray-100 p-4 rounded-lg border border-gray-200">
                <div class="flex justify-between items-start mb-3">
                  <div>
                    <p class="text-sm font-medium text-gray-600 mb-1">Cheque</p>
                    <p class="text-2xl font-bold text-gray-900">{{datosConfiguracion.simbolo}}{{decimales(datosDelDia.cheque || 0)}}</p>
                  </div>
                  <div class="bg-gray-600 p-3 rounded-lg">
                    <i class="pi pi-file text-white text-xl"></i>
                  </div>
                </div>
              </div>

              <!-- Total en Caja -->
              <div class="bg-gradient-to-br from-teal-50 to-teal-100 p-4 rounded-lg border-2 border-teal-300">
                <div class="flex justify-between items-start mb-3">
                  <div>
                    <p class="text-sm font-medium text-teal-600 mb-1">Total en Caja</p>
                    <p class="text-2xl font-bold text-teal-900">{{datosConfiguracion.simbolo}}{{decimales(datosDelDia.efectivo - datosDelDia.gastos)}}</p>
                  </div>
                  <div class="bg-teal-600 p-3 rounded-lg">
                    <i class="pi pi-briefcase text-white text-xl"></i>
                  </div>
                </div>
              </div>

            </div>
          </template>
        </Card>
      </div>

      <!-- DATE FILTERS SECTION -->
      <div class="col-span-12">
        <Card>
          <template #header>
            <div class="px-6 py-4 border-b border-gray-200">
              <h2 class="text-xl font-semibold text-gray-800">Filtros de Fecha y Hora</h2>
            </div>
          </template>
          <template #content>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">

              <div class="flex flex-col">
                <label for="dropdown" class="font-semibold text-gray-700 mb-2">Rango de Fecha</label>
                <Dropdown
                  id="dropdown"
                  v-model="selectedRange"
                  fluid
                  @change="cambioFecha"
                  :options="['HOY','AYER','ANTIER','ESTA SEMANA','LOS ULTIMOS 7 DIAS','LOS ULTIMOS 15 DIAS','LOS ULTIMOS 30 DIAS','ESTE MES','ESTE ANIO']"
                  placeholder="Selecciona un rango"
                />
              </div>

              <div class="flex flex-col">
                <label for="calendar-12h" class="font-semibold text-gray-700 mb-2">Fecha Inicio</label>
                <DatePicker
                  fluid
                  id="calendar-12h"
                  showButtonBar
                  dateFormat="dd/mm/yy"
                  v-model="fechaInicio"
                  showIcon
                />
              </div>

              <div class="flex flex-col">
                <label for="calendar-24h" class="font-semibold text-gray-700 mb-2">Hora Inicio (24H)</label>
                <InputMask v-model="horaInicio" fluid mask="99:99:99" placeholder="00:00:00" />
              </div>

              <div class="flex flex-col">
                <label for="calendar-timeonly-start" class="font-semibold text-gray-700 mb-2">Fecha Final</label>
                <DatePicker
                  fluid
                  id="calendar-timeonly-start"
                  showButtonBar
                  dateFormat="dd/mm/yy"
                  v-model="fechaFin"
                  showIcon
                />
              </div>

              <div class="flex flex-col">
                <label for="calendar-timeonly-end" class="font-semibold text-gray-700 mb-2">Hora Final (24H)</label>
                <InputMask v-model="horaFin" fluid mask="99:99:99" placeholder="00:00:00" />
              </div>

              <div class="flex flex-col">
                <label for="almacen-select" class="font-semibold text-gray-700 mb-2">Almacén</label>
                <Dropdown
                  id="almacen-select"
                  v-model="almacenSeleccionado"
                  :options="almacenesOptions"
                  optionLabel="label"
                  placeholder="Selecciona un almacén"
                  class="w-full"
                />
              </div>

            </div>
          </template>
        </Card>
      </div>
      <!-- CUADRES REGISTRADOS -->
      <div class="col-span-12">
        <Card>
          <template #header>
            <div class="px-6 py-4 border-b border-gray-200">
              <h2 class="text-xl font-semibold text-gray-800">Cuadres Registrados</h2>
            </div>
          </template>
          <template #content>
            <!-- Si hay cuadres -->
            <div v-if="datosDelDia.cuadres?.length > 0" class="flex flex-wrap gap-3">
              <Button
                v-for="(cuadre, index) in datosDelDia.cuadres"
                :key="cuadre.id || index"
                :label="`Cuadre #${cuadre.id || index + 1}`"
                :severity="cuadre.estado === 'cerrado' ? 'success' : 'warn'"
                :icon="cuadre.estado === 'cerrado' ? 'pi pi-lock' : 'pi pi-unlock'"
                outlined
                @click="verDetalleCuadre(cuadre)"
              />
            </div>

            <!-- Si no hay cuadres -->
            <div v-else class="text-gray-500 italic p-4 bg-gray-50 rounded-lg text-center">
              <i class="pi pi-info-circle mr-2"></i>
              No hay cuadres registrados hoy.
            </div>
          </template>
        </Card>
      </div>

      <!-- METAS Y MÉTRICAS -->
      <div class="col-span-12">
        <Card>
          <template #header>
            <div class="px-6 py-4 border-b border-gray-200">
              <h2 class="text-xl font-semibold text-gray-800">Metas y Métricas</h2>
            </div>
          </template>
          <template #content>
            <DataTable :value="metas" responsiveLayout="scroll" class="p-datatable-sm" stripedRows>
              <Column field="titulo" header="Meta"></Column>
              <Column field="tipo_meta" header="Tipo"></Column>
              <Column field="valor_objetivo" header="Objetivo"></Column>
              <Column field="valor_actual" header="Avance"></Column>
              <Column field="porcentaje_avance" header="%"></Column>
              <Column field="estado" header="Estado"></Column>
              <Column field="fecha_inicio" header="Inicio"></Column>
              <Column field="fecha_fin" header="Fin"></Column>
            </DataTable>
          </template>
        </Card>
      </div>

      <!-- GASTOS FIJOS -->
      <div class="col-span-12">
        <Card>
          <template #header>
            <div class="px-6 py-4 border-b border-gray-200">
              <h2 class="text-xl font-semibold text-gray-800">Gastos Fijos</h2>
            </div>
          </template>
          <template #content>
            <DataTable :value="gastosFijos" responsiveLayout="scroll" class="p-datatable-sm" stripedRows>
              <Column field="descripcion" header="Descripción"></Column>
              <Column field="valor" header="Valor"></Column>
              <Column field="fecha_pago" header="Fecha de Pago"></Column>
              <Column field="alerta" header="Alerta"></Column>
              <Column field="dias_alerta" header="Días Alerta"></Column>
              <Column field="tipo" header="Tipo"></Column>
              <Column field="cuentaporpagar" header="Cuenta por Pagar"></Column>
              <Column field="ultimo_pago" header="Último Pago"></Column>
            </DataTable>
          </template>
        </Card>
      </div>

      <!-- NÓMINAS ACTIVAS -->
      <div class="col-span-12">
        <Card>
          <template #header>
            <div class="px-6 py-4 border-b border-gray-200">
              <h2 class="text-xl font-semibold text-gray-800">Nóminas Activas</h2>
            </div>
          </template>
          <template #content>
            <DataTable :value="nominaArray" responsiveLayout="scroll" class="p-datatable-sm" stripedRows>
      <Column field="no_nomina" header="No. Nómina"></Column>
      <Column field="nombre" header="Empleado"></Column>
      <Column field="cedula" header="Cédula"></Column>
      <Column field="cargo" header="Cargo"></Column>
      <Column field="sueldo" header="Sueldo Base">
        <template #body="{ data }">
          RD$ {{ parseFloat(data.sueldo || 0).toLocaleString() }}
        </template>
      </Column>
      <Column field="total_deducciones" header="Deducciones">
        <template #body="{ data }">
          RD$ {{ parseFloat(data.total_deducciones || 0).toLocaleString() }}
        </template>
      </Column>
      <Column field="total_neto_pagar" header="Neto a Pagar">
        <template #body="{ data }">
          <span class="font-semibold text-green-600">
            RD$ {{ parseFloat(data.total_neto_pagar || 0).toLocaleString() }}
          </span>
        </template>
      </Column>
              <Column field="estado" header="Estado">
                <template #body="{ data }">
                  <span
                    :class="{
                      'text-green-600 font-semibold': data.estado === 'PAGADA',
                      'text-yellow-600 font-semibold': data.estado === 'ACTIVA',
                      'text-red-600 font-semibold': data.estado === 'CANCELADA'
                    }"
                  >
                    {{ data.estado }}
                  </span>
                </template>
              </Column>
            </DataTable>
          </template>
        </Card>
      </div>


      <!-- ACCIONES RÁPIDAS -->
      <div class="col-span-12">
        <Card>
          <template #header>
            <div class="px-6 py-4 border-b border-gray-200">
              <h2 class="text-xl font-semibold text-gray-800">Acciones Rápidas</h2>
            </div>
          </template>
          <template #content>

            <!-- Reportes de Productos -->
            <div class="mb-6">
              <h3 class="text-sm font-semibold text-gray-600 mb-3 uppercase tracking-wider">Reportes de Productos</h3>
              <div class="flex flex-wrap gap-2">
                <Button label="Productos Vendidos" @click="visibleProductos = true" icon="pi pi-shopping-cart" outlined severity="info" />
                <Button label="Productos por Facturas" @click="productosPorFacturas = true" icon="pi pi-file" outlined severity="info" />
                <Button label="Por Categorías" @click="visibleCategorias = true" icon="pi pi-tags" outlined severity="info" />
                <Button label="Top Productos" @click="visibleTop = true" icon="pi pi-chart-line" outlined severity="info" />
                <Button label="PDF Top Productos" @click="fnGenerarPdfTopProductos" icon="pi pi-file-pdf" outlined severity="danger" />
                <Button label="Reajustar Ganancias" :loading="loadingReajuste" @click="fnreajustarGanancias" icon="pi pi-sync" outlined severity="info" />
              </div>
            </div>

            <!-- Reportes Financieros -->
            <div class="mb-6">
              <h3 class="text-sm font-semibold text-gray-600 mb-3 uppercase tracking-wider">Reportes Financieros</h3>
              <div class="flex flex-wrap gap-2">
                <Button label="Informe 607" @click="fnInforme607_2" icon="pi pi-file-edit" outlined severity="warn" />
                <Button label="Gastos" @click="fnGastos" icon="pi pi-money-bill" outlined severity="warn" />
                <Button label="Por Comprobantes" @click="fnInformePorComprobantes" icon="pi pi-receipt" outlined severity="warn" />
                <Button label="Por Método de Pago" @click="fnInformePorMetodoPago" icon="pi pi-credit-card" outlined severity="warn" />
              </div>
            </div>

            <!-- Cuadres e Impresiones -->
            <div class="mb-6">
              <h3 class="text-sm font-semibold text-gray-600 mb-3 uppercase tracking-wider">Cuadres e Impresiones</h3>
              <div class="flex flex-wrap gap-2">
                <Button label="Ver Cuadre" icon="pi pi-eye" outlined severity="success" @click="fnVerCuadre" />
                <Button label="Imprimir Cuadre" icon="pi pi-print" outlined severity="success" @click="imprimirInforme" />
                <Button label="Imprimir Taller" icon="pi pi-wrench" outlined severity="success" @click="imprimirTaller" />
                <Button label="Todas las Facturas" icon="pi pi-file-pdf" outlined severity="success" @click="fnTodasLasFacturas" />
                <Button label="Abrir Caja" icon="pi pi-unlock" outlined severity="success" @click="fnAbrirCaja" />
              </div>
            </div>

            <!-- Resúmenes -->
            <div class="mb-6">
              <h3 class="text-sm font-semibold text-gray-600 mb-3 uppercase tracking-wider">Resúmenes</h3>
              <div class="flex flex-wrap gap-2">
                <Button label="Resumen de Ventas" icon="pi pi-chart-bar" outlined @click="fnResumenVentas" />
                <Button label="Resumen de Cotizaciones" icon="pi pi-list" outlined @click="fnResumenCotizaciones" />
                <Button label="Resumen de IMEI" icon="pi pi-mobile" outlined @click="fnResumenIMEI" />
              </div>
            </div>

            <!-- Historial -->
            <div class="mb-6">
              <h3 class="text-sm font-semibold text-gray-600 mb-3 uppercase tracking-wider">Historial</h3>
              <div class="flex flex-wrap gap-2">
                <Button label="Historial por Cliente" icon="pi pi-user" outlined severity="secondary" @click="visibleSeleccionarCliente = true" />
                <Button label="Historial por Vendedor" icon="pi pi-users" outlined severity="secondary" @click="visibleSeleccionarVendedor = true" />
              </div>
            </div>

            <!-- Estados Financieros -->
            <div class="mb-6">
              <h3 class="text-sm font-semibold text-gray-600 mb-3 uppercase tracking-wider">Estados Financieros</h3>
              <div class="flex flex-wrap gap-2">
                <Button label="Balance General" @click="generarBalance" icon="pi pi-dollar" severity="info" />
                <Button label="Estado de Resultados" @click="generarResultados" icon="pi pi-chart-pie" severity="success" />
                <Button label="Estado de Situación" @click="generarBalance" icon="pi pi-briefcase" severity="info" />
                <Button label="Estado de Cambios en el Patrimonio" @click="generarCambios" icon="pi pi-arrows-h" severity="warn" />
              </div>
            </div>

            <!-- Informes Especiales -->
            <div>
              <h3 class="text-sm font-semibold text-gray-600 mb-3 uppercase tracking-wider">Informes Especiales</h3>
              <div class="flex flex-wrap gap-2">
                <Button label="Informe de Inventario" @click="generarInformeInventario" icon="pi pi-box" severity="secondary" />
                <Button label="Informe de Financiamientos" @click="generarInformeFinanciamientos" icon="pi pi-percentage" severity="secondary" />
                <Button label="Generar Informe PDF" icon="pi pi-file-pdf" severity="danger" @click="generarInformeAnalitico" />
              </div>
            </div>

          </template>
        </Card>
      </div>

    </div>
    <!-- End of grid grid-cols-12 -->

    <!-- DIALOGS SECTION -->
    <Dialog v-model:visible="visibleSeleccionarCliente" modal header="Seleccionar Cliente" :style="{ width: '50rem' }">
  <template #header>
    <div class="inline-flex align-items-center justify-content-center gap-2">
      <span class="font-bold white-space-nowrap">Seleccionar Cliente</span>
    </div>
  </template>
  <div class="p-4">
    <h3 class="text-lg font-semibold text-gray-700 mb-4">LISTADO DE CLIENTES</h3>
    <div class="p-fluid mb-3">
      <InputText v-model="searchQueryCliente" placeholder="Buscar clientes..." />
    </div>
    <DataTable
      :value="filteredClientes"
      scrollable
      scrollHeight="400px"
      dataKey="id"
      paginator
      :rows="10"
      :rowsPerPageOptions="[5, 10, 20, 50]"
      selectionMode="single"
      tableStyle="min-width: 50rem"
      @rowSelect="onRowSelectCliente">
      <Column field="nombre" header="Nombre"></Column>
      <Column field="cedula" header="Cédula/RNC"></Column>
      <Column field="telefono" header="Teléfono"></Column>
    </DataTable>
  </div>
  <template #footer>
    <ButtonGroup>
      <Button label="Cerrar" icon="pi pi-times" severity="danger" @click="visibleSeleccionarCliente = false" outlined />
    </ButtonGroup>
  </template>
</Dialog>
<!-- /////////////////////////////////////////////////////////////////////////// -->
<Dialog v-model:visible="visibleSeleccionarVendedor" modal header="Seleccionar Vendedor" :style="{ width: '50rem' }">
  <template #header>
    <div class="inline-flex align-items-center justify-content-center gap-2">
      <span class="font-bold white-space-nowrap">Seleccionar Vendedor</span>
    </div>
  </template>
  <div class="p-4">
    <h3 class="text-lg font-semibold text-gray-700 mb-4">LISTADO DE VENDEDORES</h3>
    <div class="p-fluid mb-3">
      <InputText v-model="searchQueryVendedores" placeholder="Buscar vendedores..." />
    </div>
    <DataTable
      :value="filteredVendedores"
      scrollable
      scrollHeight="400px"
      dataKey="id"
      paginator
      :rows="10"
      :rowsPerPageOptions="[5, 10, 20, 50]"
      selectionMode="single"
      tableStyle="min-width: 50rem"
      @rowSelect="onRowSelectVendedor">
      <Column field="nombre" header="Nombre"></Column>
      <Column field="porcentaje" header="Porcentaje"></Column>
      <Column field="meta" header="Meta"></Column>
    </DataTable>
  </div>
  <template #footer>
    <ButtonGroup>
      <Button label="Cerrar" icon="pi pi-times" severity="danger" @click="visibleSeleccionarVendedor = false" outlined />
    </ButtonGroup>
  </template>
</Dialog>
<!-- /////////////////////////////////////////////////////////////////////////// -->
<Dialog v-model:visible="historialCliente" modal header="Historial de Facturas por Cliente" :style="{ width: '60rem' }">
  <template #header>
    <div class="inline-flex align-items-center justify-content-center gap-2">
      <span class="font-bold white-space-nowrap">Historial de Facturas por Cliente</span>
    </div>
  </template>
  <div class="p-4">
    <h3 class="text-lg font-semibold text-gray-700 mb-4">HISTORIAL DE FACTURAS</h3>
    <DataTable :value="facturasCliente" scrollable scrollHeight="600px" dataKey="id" paginator :rows="10" :rowsPerPageOptions="[5, 10, 20, 50]" tableStyle="min-width: 50rem">
      <Column field="no_factura" header="Factura"></Column>
      <Column field="productos" header="Productos"></Column>
      <Column field="fecha_emision" header="Fecha"></Column>
      <Column field="hora" header="Hora"></Column>
      <Column field="total" header="Total"></Column>
    </DataTable>
  </div>
  <template #footer>
    <ButtonGroup>
      <Button label="Descargar PDF" icon="pi pi-file-pdf" severity="info" @click="descargarPDFcliente()" />
      <Button label="Cerrar" icon="pi pi-times" severity="danger" @click="historialCliente = false" outlined />
    </ButtonGroup>
  </template>
</Dialog>

<!-- /////////////////////////////////////////////////////////////////////////// -->
<div class="grid grid-cols-2">
<div class="col-span-6 mt-2">
<canvas id="graficoTartaInforme" width="400" height="400" style="display: none;"></canvas>
</div>
<div class="col-span-6 mt-2">
<canvas id="graficoBarraProductos" width="600" height="400" style="display: none;"></canvas>
</div>
</div>

<!-- /////////////////////////////////////////////////////////////////////////// -->
<div class="col-span-12 mt-2">
 <Card class="mt-2">
              <template #content>
<Button label="Descargar Facturas" @click="fnDescargarFacturas" icon="pi pi-download" text   />
            <Button label="Descargar Comprobantes" @click="fnDescargarComprobantes" icon="pi pi-download" text   />
            <Button label="Descargar Compras" @click="fnDescargarCompras" icon="pi pi-download" text   />
            <Button label="Descargar Gastos" @click="fnDescargarGastos" icon="pi pi-download" text   />
            <Button label="Descargar CXC" @click="fnDescargarCXC" icon="pi pi-download" text   />
            <Button label="Descargar CXP" @click="fnDescargarCXP" icon="pi pi-download" text   />
            <Button label="Descargar Taller" @click="fnDescargarTaller" icon="pi pi-download" text   />
            <Button label="Imprimir Productos sin Stock" @click="fnProductosSinStock" icon="pi pi-print" text   />
            <Button label="Imprimir Inventario" @click="fnProductosInventario" icon="pi pi-print" text   />
               <Button label="Prueba" @click="fnPrueba" icon="pi pi-download" text   />
              </template>  

    
</Card>  
</div>

<div class="col-span-12">
 <Card class="mt-2">
        <template #content>
<Chart v-if="chartDataSemana && chartOptionsSemana" type="bar" :data="chartDataSemana" :options="chartOptionsSemana" class="h-[30rem]" />
        </template>
</Card>
  </div>

  <div class="col-span-12 md:col-span-6">
 <Card class="mt-2">
        <template #content>
<Chart type="bar" :data="chartData" :options="chartOptions" class="w-full md:w-30rem chart-size" />
        </template>
</Card>
  </div>
  <div class="col-span-12 md:col-span-6">
 <Card class="mt-2">
        <template #content>
<Chart type="pie" :data="chartDataDelDia" :options="chartOptionsDelDia" class="w-full md:w-30rem chart-size" />
        </template>
</Card>
  </div>




</div>



<div class="cards-container grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
  <div
    class="card p-4 shadow-md rounded-lg dark:bg-gray-800"
    v-for="(data, tipo) in facturasInfo"
    :key="tipo"
  >
    <div class="card-body dark:bg-gray-800">
      <h5 class="card-title text-xl font-bold">{{ tipo }}</h5>
      <p class="card-text text-gray-700 dark:text-gray-400">
        Cantidad: {{ data.count }}<br>
        Total: {{ datosConfiguracion.simbolo + decimales(data.total) + datosConfiguracion.plural }}
      </p>
      <Button
        label="Filtrar"
        class="mt-2"
        @click="filterFacturas(tipo)"
      />
    </div>
  </div>
  <div class="card p-4 dark:bg-gray-800 shadow-md rounded-lg">
    <div class="card-body">
      <Button label="Mostrar Todas" @click="resetFilter" />
    </div>
  </div>
</div>




          <div class="card">
<DataTable :value="facturasFiltradas" 
           scrollable 
           scrollHeight="600px" 
           @rowSelect="onRowSelect" 
           selectionMode="single" 
           dataKey="id" 
           paginator 
           :rows="10" 
           :rowsPerPageOptions="[5, 10, 20, 50]" 
           tableStyle="min-width: 50rem"
           :rowClass="rowClass">
  <Column sortable v-for="col of columns" :key="col.field" :field="col.field" :header="col.header"></Column>
</DataTable>


          </div>

<!-- /////////////////////////////////////////////////////////////////////////// -->
   <Dialog v-model:visible="productosPorFacturas" modal header="Listado de Productos" :style="{ width: '60rem' }">
        <div class="card">
          <input v-model="searchQueryFactura" placeholder="Buscar productos..." class="p-inputtext p-component" style="margin-bottom: 10px;" />
          
          <!-- DataTable con los productos desglosados por filas -->
          <DataTable :value="filteredFacturas" scrollable scrollHeight="600px" dataKey="facturaNumero" :rowClass="(data) => getFacturaClass(data.facturaNumero)" selectionMode="single"  paginator :rows="10" @rowSelect="onRowSelectFactura"  :rowsPerPageOptions="[5, 10, 20, 50]" tableStyle="min-width: 50rem">
            <Column field="facturaNumero" header="FACTURA #" />
            <Column field="fecha" header="FECHA" />
            <Column field="hora" header="HORA" />
            <Column field="producto" header="PRODUCTO" />
            <Column field="cantidad" header="CANT." />
            <Column field="precio" header="PRECIO" />
            <Column field="impuesto" header="ITBIS" />
            <Column field="total" header="TOTAL" />
          </DataTable>
        </div>
    
  </Dialog>
<!-- /////////////////////////////////////////////////////////////////////////// -->
 <Dialog v-model:visible="visibleProductos" modal :position="position" header="Listado de Productos" :style="{ width: '80rem' }">
    <template #header>
      <div class="inline-flex align-items-center justify-content-center gap-2">
        <span class="font-bold white-space-nowrap">Listado de Productos Vendidos</span>
      </div>
    </template>
    <div class="row">
      <fieldset class="border p-3 rounded mb-2">
        <legend class="float-none w-auto px-2">LISTADO DE PRODUCTOS</legend>
          <div class="card">
          <input v-model="searchQuery" placeholder="Buscar productos..." class="p-inputtext p-component" style="margin-bottom: 10px;" />
            <DataTable :value="filteredProducts" scrollable scrollHeight="600px" dataKey="id" paginator :rows="10" :rowsPerPageOptions="[5, 10, 20, 50]" tableStyle="min-width: 60rem">
              <Column field="nombre" header="Producto"></Column>
              <Column field="cantidad" header="Cantidad" style="text-align: center;"></Column>
              <Column header="Costo" style="text-align: right;">
                <template #body="slotProps">
                  RD$ {{ decimales(slotProps.data.costo || 0) }}
                </template>
              </Column>
              <Column header="Precio Real" style="text-align: right;">
                <template #body="slotProps">
                  <span v-if="slotProps.data.precio_real > 0" class="text-blue-600 font-medium">
                    RD$ {{ decimales(slotProps.data.precio_real) }}
                  </span>
                  <span v-else class="text-gray-400">—</span>
                </template>
              </Column>
              <Column header="% Método" style="text-align: center;">
                <template #body="slotProps">
                  <Tag
                    v-if="slotProps.data.porcentaje > 0"
                    :value="slotProps.data.porcentaje + '%'"
                    severity="warn"
                  />
                  <span v-else class="text-gray-400">—</span>
                </template>
              </Column>
              <Column header="Venta" style="text-align: right;">
                <template #body="slotProps">
                  RD$ {{ decimales(slotProps.data.total || 0) }}
                </template>
              </Column>
              <Column header="Ganancia" style="text-align: right;">
                <template #body="slotProps">
                  <div class="flex align-items-center justify-content-end gap-1">
                    <span :class="{ 'text-green-600 font-semibold': slotProps.data.ganancia > 0, 'text-red-600 font-semibold': slotProps.data.ganancia < 0 }">
                      RD$ {{ decimales(slotProps.data.ganancia || 0) }}
                    </span>
                    <i
                      v-if="slotProps.data.precio_real > 0"
                      class="pi pi-info-circle text-blue-400 text-xs"
                      v-tooltip.top="'Calculado con precio real (sin cargo de método de pago)'"
                    ></i>
                  </div>
                </template>
              </Column>
            </DataTable>

            <!-- Totales -->
            <div class="grid grid-cols-4 gap-4 mt-4 p-3 bg-gray-100 rounded-lg">
              <div class="text-center">
                <span class="block text-sm text-gray-600">Total Productos</span>
                <span class="block text-lg font-bold text-gray-800">{{ totalesProductosVendidos.cantidad }}</span>
              </div>
              <div class="text-center">
                <span class="block text-sm text-gray-600">Total Costo</span>
                <span class="block text-lg font-bold text-gray-800">RD$ {{ decimales(totalesProductosVendidos.costo) }}</span>
              </div>
              <div class="text-center">
                <span class="block text-sm text-gray-600">Total Venta</span>
                <span class="block text-lg font-bold text-blue-600">RD$ {{ decimales(totalesProductosVendidos.total) }}</span>
              </div>
              <div class="text-center">
                <span class="block text-sm text-gray-600">Total Ganancia</span>
                <span class="block text-lg font-bold" :class="totalesProductosVendidos.ganancia >= 0 ? 'text-green-600' : 'text-red-600'">
                  RD$ {{ decimales(totalesProductosVendidos.ganancia) }}
                </span>
              </div>
            </div>

          </div>
        </fieldset>
    </div>
    <template #footer>
      <ButtonGroup>
        <Button label="Ver PDF" icon="pi pi-file-pdf" severity="info" @click="fnGenerarPdfProductos" outlined />
        <Button label="Descargar PDF" icon="pi pi-download" severity="warning" @click="fnDescargarPdfProductos" outlined />
        <Button label="Imprimir" icon="pi pi-print" severity="success" @click="fnPrintProductos" outlined />
        <Button label="Cerrar" icon="pi pi-times" severity="danger" @click="visibleProductos = false" outlined />
      </ButtonGroup>
    </template>
  </Dialog>
<!-- /////////////////////////////////////////////////////////////////////////// -->
<Dialog v-model:visible="visibleCategorias" modal :position="position" header="Listado de Categorias" :style="{ width: '60rem' }">
    <template #header>
        <div class="inline-flex align-items-center justify-content-center gap-2">
            <span class="font-bold white-space-nowrap">Listado de Categorias</span>
        </div>
    </template>
            <div class="card">
                <input v-model="searchQueryCategorias" placeholder="Buscar categorías..." class="p-inputtext p-component" style="margin-bottom: 10px;" />
                <DataTable :value="filteredCategorias" scrollable scrollHeight="600px" dataKey="nombre" paginator :rows="10" :rowsPerPageOptions="[5, 10, 20, 50]" tableStyle="min-width: 50rem">
                    <Column field="nombre" header="Categoria"></Column>
                    <Column field="cantidad" header="Cantidad"></Column>
                    <Column field="total" header="Total"></Column>
                </DataTable>
            </div>
    
    <template #footer>
        <ButtonGroup>
            <Button label="Print" icon="pi pi-print" severity="success" @click="fnPrintExcelCategorias" outlined />
            <Button label="Descargar" icon="pi pi-file-excel" severity="success" @click="fnDescargarExcelCategorias" outlined />
            <Button label="Cerrar" icon="pi pi-times" severity="danger" @click="visibleCategorias = false" outlined />
        </ButtonGroup>
    </template>
</Dialog>

<!-- /////////////////////////////////////////////////////////////////////////// -->
  <Dialog v-model:visible="visibleGastos" modal :position="position" header="Listado de Gastos" :style="{ width: '50rem' }">
    <template #header>
      <div class="inline-flex align-items-center justify-content-center gap-2">
        <span class="font-bold white-space-nowrap">Listado de Gastos</span>
      </div>
    </template>
          <div class="card">
            <DataTable :value="gastosArray"  scrollable scrollHeight="600px"  dataKey="id" paginator :rows="10" :rowsPerPageOptions="[5, 10, 20, 50]" tableStyle="min-width: 50rem">
            <Column field="fecha" header="Fecha"></Column>
            <Column field="hora" header="Hora"></Column>
            <Column field="cantidad" header="Cantidad"></Column>
            <Column field="descripcion" header="Descripcion"></Column>
            </DataTable>

          </div>
    
    <template #footer>
      <ButtonGroup>
        <Button label="Cerrar" icon="pi pi-times" severity="danger" @click="visibleGastos = false" outlined />
      </ButtonGroup>
    </template>
  </Dialog>
<!-- /////////////////////////////////////////////////////////////////////////// -->
  <Dialog v-model:visible="visibleTop" modal :position="position" header="Listado de Productos" :style="{ width: '50rem' }">
    <template #header>
      <div class="inline-flex align-items-center justify-content-center gap-2">
        <span class="font-bold white-space-nowrap">Listado de Productos</span>
      </div>
    </template>
          <div class="card">
          <Chart type="bar" :data="chartDataPro" :options="chartOptions" class="w-full md:w-50rem chart-size" />
          </div>
    
    <template #footer>
      <ButtonGroup>
        <Button label="Cerrar" icon="pi pi-times" severity="danger" @click="visibleTop = false" outlined />
      </ButtonGroup>
    </template>
  </Dialog>
<!-- /////////////////////////////////////////////////////////////////////////// -->
<!-- ////////////////////////////////////////////////////////////////////////////////////////// -->
  <Dialog v-model:visible="visibleProductosModal" :position="position" modal header="Productos" :style="{ width: '50rem' }" :breakpoints="{ '1199px': '75vw', '575px': '90vw' }">
    <template #header>
      <div class="inline-flex align-items-center justify-content-center gap-2">
        <span class="font-bold white-space-nowrap">Modal Editar</span>
      </div>
    </template>

      <!-- Productos Factura Table -->
      <table class="table-auto w-full">
        <thead>
          <tr>
            <th>Cantidad</th>
            <th>Nombre</th>
            <th>Precio</th>
            <th>Subtotal</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="producto in productosFactura" :key="producto.codigo">
            <td>{{ producto.cantidad }}</td>
            <td>{{ producto.nombre }}</td>
            <td>{{ producto.precio }}</td>
            <td>{{ calcularSubtotal(producto) }}</td>
          </tr>
        </tbody>
      </table>
      <!-- Total -->
      <div class="flex justify-end mt-4">
        <strong>Total: {{ calcularTotal }}</strong>
      </div>

    <template #footer>
      <Button label="Cancel" text severity="secondary" @click="visibleProductosModal = false" />
    </template>
  </Dialog>
<!-- /////////////////////////////////////////////////////////////////////////// -->
<!--     <Ticket 
      v-if="showTicket"
      ref="ticketComponent"
      :logoSrc="logoSrc"
      :address="address"
      :phone="phone"
      :rnc="rnc"
      :cajaData="cajaData"
      :financialData="financialData"
      :qrSrc="qrSrc"
    /> -->
<!-- /////////////////////////////////////////////////////////////////////////// -->

<LoadingOverlay :visible="loading" />
<Toast />
  <!-- </div> -->
  <!-- </div> -->
</main>
</template>
<style >
  .chart-size {
  width: 100%;
  height: 400px; /* Ajusta esta altura según sea necesario */
}
/* Define colors corresponding to the pie chart */
.metodo-pago-efectivo {
  color: #00bcd4 !important;

}
.metodo-pago-tarjeta {
  color: #ff9800 !important;

}
.metodo-pago-transferencia {
  color: #9e9e9e !important;

}

.factura-color-0 {
  background-color: #ffcccc !important;
}

.factura-color-1 {
  background-color: #ccffcc !important;
}

.factura-color-2 {
  background-color: #ccccff !important;
}

.factura-color-3 {
  background-color: #ffb3e6 !important;
}

.factura-color-4 {
  background-color: #ffcc99 !important;
}

.factura-color-5 {
  background-color: #99ffcc !important;
}

.factura-color-6 {
  background-color: #99ccff !important;
}

.factura-color-7 {
  background-color: #ffff99 !important;
}

.factura-color-8 {
  background-color: #ff99ff !important;
}

.factura-color-9 {
  background-color: #b3b3cc !important;
}

/* Para que el color del texto sea visible sobre el fondo */
.factura-color-0 td, 
.factura-color-1 td, 
.factura-color-2 td, 
.factura-color-3 td, 
.factura-color-4 td, 
.factura-color-5 td, 
.factura-color-6 td, 
.factura-color-7 td, 
.factura-color-8 td, 
.factura-color-9 td {
  color: black !important;
}

</style>
