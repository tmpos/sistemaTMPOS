<script setup>
import { ref, onMounted, nextTick, watchEffect, computed, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
const router = useRouter();
import axios from 'axios';
import { enviarDatosPorPost, eliminarDatos, obtenerIdsSeleccionados, borrarTodoslosDatos, lenguajeDataTable, nfecha, arrayToObjetoFromTabla, peticionesFetch, encryptarPassword, envioElectron, mensajetoast, crearTablaSiNoExiste, peticiones,formatearFecha,peticionesFetchOffline,arrayToObjetoFromTablaOffline, lasMayusculas,enviarDatosLocalStorage,crearTablaSiNoExisteOffline, transformarFechaTimestamp, formatoMonedaRD } from '../../funciones/funciones.js';
import Swal from 'sweetalert2'
import { useToast } from "primevue/usetoast";
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
const toast = useToast();
/************************************************************************/
/************************************************************************/
const usuarioLocal = ref({})
/************************************************************************/
const camposArray = ["no_cotizacion","cod_cliente","nombre_cliente","telefono_cliente","whatsapp_cliente","email_cliente","direccion_cliente","rnc_cliente","nombre_comercial","productos","vendedor","metodo_pago","fecha_emision","impuesto","descuento","subtotal","total","estado_cotizacion","no_factura","fecha_cambio","entidad_financiera","vencimiento","nota","year","mes","hora","almacen","usuario","total_institucion","total_cliente"];
/************************************************************************/
import { useDatosEmpresa } from '../../stores'
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
const productosCotizacion = ref([]);
const visibleProductos = ref(false);
const visiblePrint = ref(false);
const selectedRangoFecha = ref({ label: 'TODAS', value: 'todas' });
const buscadorFechaInteligente = ref(null);
const rangoFechaOptions = [
  { label: 'TODAS', value: 'todas' },
  { label: 'Esta Semana', value: 'esta_semana' },
  { label: 'Este Mes', value: 'este_mes' },
  { label: 'Mes Pasado', value: 'mes_pasado' },
  { label: 'Ultimos 7 Dias', value: 'ultimos_7_dias' },
  { label: 'Ultimos 30 Dias', value: 'ultimos_30_dias' }
];
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
const CotizacionEditar = ref(null);
/************************************************************************/
async function limpiarCamposCrear() {
datoscamposCotizacion.value = {}
await campos();
}
/************************************************************************/
watchEffect(() => {
  if (visiblecrear.value) {
  }
});
/************************************************************************/
const fetchAndSetupData = async () => {
const response = await peticionesFetchOffline('getDataAsArray', 'cotizacion');
    const jsonData = response;
    data.value = response.filter(fact=>fact.almacen === datosEmpresa.empresa.nombre).reverse();
};
/************************************************************************/
async function campos() {
  const campos = await arrayToObjetoFromTablaOffline('cotizacion');
  datoscamposCotizacion.value = campos;
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
await crearTablaSiNoExisteOffline('cotizacion', camposArray,toast);
usuarioLocal.value = JSON.parse(window.localStorage.getItem('usuarioLocal'))[0] || {};
await fetchAndSetupData();
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
                    const envioDatos = await peticionesFetchOffline('deleteAll', 'cotizacion');
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
  const url = link.value+api.value+"/actualizarcampos/cotizacion";
  if (!datoscampos.value) {
    console.error("Datos incompletos, no se puede actualizar.");
    return;
  }
  if (datoscampos.value.hasOwnProperty('created_at')) {
    datoscampos.value.updated_at = nfecha('timestamp');
  }
/*  const envioDatos = await enviarDatosPorPost(url, datoscampos.value, tokenCifrado.value);*/
  const envioDatos = await peticionesFetchOffline('updateData','cotizacion', JSON.stringify(datoscampos.value));
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
  const url = link.value+api.value+"/insertar/cotizacion";
  if (datoscamposCotizacion.value.hasOwnProperty('created_at')) {
    datoscamposCotizacion.value.created_at = nfecha('timestamp');
    datoscamposCotizacion.value.updated_at = nfecha('timestamp');
  }
/*  const envioDatos = await enviarDatosPorPost(url, datoscamposCotizacion.value, tokenCifrado.value);*/
  const envioDatos = await peticionesFetchOffline('insertData','cotizacion', JSON.stringify(datoscamposCotizacion.value));
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
                                const envioDatos = await peticionesFetchOffline('deleteEntry','cotizacion', id);
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
const itemsCotizacion = ref([]);
const menu = ref(null);
const currentRowData = ref(null);
const toggleCotizacion = (event, rowData) => {
currentRowData.value = rowData;
itemsCotizacion.value = [
{ label: 'Editar', icon: 'pi pi-pencil', command: () => { 
router.push({ path: `/editarcotizacion/${currentRowData.value.id}` });
} },
{ label: 'Productos', icon: 'pi pi-th-large', command: () => { 
  visibleProductos.value = true;
  productosCotizacion.value = JSON.parse(currentRowData.value.productos)
} },
{ label: 'Imprimir', icon: 'pi pi-print', command: () => { 
  visiblePrint.value = true;

} },
{ label: 'Convertir en Factura', icon: 'pi pi-sync', command: () => { 
    localStorage.setItem('productosVenta', currentRowData.value.productos);
    router.push('/vender')

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
/*                        const datosFactura = await peticionesFetch(`${link.value}${api.value}`, `borrarporcampo/cotizacion`, { campo: 'id', valor: rowData.id }, tokenCifrado.value, 'POST');*/
                        const datosFactura = await peticionesFetchOffline('deleteEntry','cotizacion', rowData.id);

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
menu.value.toggle(event);
};
/************************************************************************/
const filteredCotizacion = computed(() => filtrarCotizaciones(data.value));
/* const filteredCotizacionLegacy = computed(() => {
  // Si no hay búsqueda ni fecha, retorna todos los datos
  if (!searchQuery.value && !date.value) return data.value;

  return data.value.filter(busqueda => {
    // Obtener la fecha de emisión del objeto actual
    const fechaEmision = busqueda.fecha_emision;
    // Formatear la fecha seleccionada si existe
    const fechaFiltrada = date.value ? formatearFecha(date.value) : null;
    
    // Verificar si la fecha cumple con el filtro, o si no hay fecha seleccionada
    const cumpleFecha = fechaFiltrada ? fechaEmision === fechaFiltrada : true;

    // Verificar si el término de búsqueda cumple con el filtro
    const cumpleBusqueda = searchQuery.value
      ? Object.values(busqueda).some(value =>
          // Convertir el valor a string, pasarlo a minúsculas, y buscar coincidencia
          String(value).toLowerCase().includes(searchQuery.value.toLowerCase())
        )
      : true; // Si no hay búsqueda, no filtra por este criterio

    // Solo retorna los elementos que cumplan con ambos criterios (fecha y búsqueda)
    return cumpleFecha && cumpleBusqueda;
  });
}); */

/************************************************************************/
const obtenerCotizacionesParaExportar = async () => {
  const response = await peticionesFetchOffline('getDataAsArray', 'cotizacion');
  const cotizaciones = Array.isArray(response)
    ? response.filter(item => item.almacen === datosEmpresa.empresa.nombre).reverse()
    : [];

  return filtrarCotizaciones(cotizaciones);
};
/************************************************************************/
const fnExportarExcel = async () => {
  const cotizacionesExportar = await obtenerCotizacionesParaExportar();

  if (!cotizacionesExportar.length) {
    toast.add({
      severity: 'warn',
      summary: 'Aviso',
      detail: 'No hay cotizaciones para exportar',
      life: 3000
    });
    return;
  }

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(cotizacionesExportar);
  XLSX.utils.book_append_sheet(wb, ws, 'Cotizaciones');
  XLSX.writeFile(wb, 'Cotizaciones.xlsx');
};
/************************************************************************/
const fnExportarPDF = async () => {
  const cotizacionesExportar = await obtenerCotizacionesParaExportar();

  if (!cotizacionesExportar.length) {
    toast.add({
      severity: 'warn',
      summary: 'Aviso',
      detail: 'No hay cotizaciones para exportar',
      life: 3000
    });
    return;
  }

  const doc = new jsPDF('l', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();

  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('Reporte de Cotizaciones', pageWidth / 2, 15, { align: 'center' });

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Fecha de generacion: ${nfecha('fecha')}`, 14, 25);
  doc.text(`Total de cotizaciones: ${cotizacionesExportar.length}`, 14, 30);

  const totalGeneral = cotizacionesExportar.reduce((sum, item) => sum + Number(item.total || 0), 0);
  doc.text(`Total general: ${formatoMonedaRD(totalGeneral)}`, 14, 35);

  const tableData = cotizacionesExportar.map(cotizacion => [
    cotizacion.no_cotizacion || '',
    cotizacion.fecha_emision || '',
    cotizacion.nombre_cliente || '',
    cotizacion.estado_cotizacion || '',
    cotizacion.vendedor || '',
    cotizacion.no_factura || '',
    formatoMonedaRD(cotizacion.total || 0)
  ]);

  doc.autoTable({
    startY: 45,
    head: [['No. Cotizacion', 'Fecha', 'Cliente', 'Estado', 'Vendedor', 'No. Factura', 'Total']],
    body: tableData,
    styles: { fontSize: 8 },
    headStyles: { fillColor: [41, 128, 185] }
  });

  doc.save('Cotizaciones.pdf');
};
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
const onRowSelect = (event) => {
router.push({ path: `/editarcotizacion/${event.data.id}` });
};
/************************************************************************/
const date = ref(null);
/************************************************************************/
const clearDate = () => {
  date.value = null;
};
/************************************************************************/
const limpiarFiltros = () => {
  date.value = null;
  buscadorFechaInteligente.value = null;
  selectedRangoFecha.value = { label: 'TODAS', value: 'todas' };
  searchQuery.value = '';
};
/************************************************************************/
const calcularRangoFechas = (tipoRango) => {
  const hoy = new Date();
  let fechaInicio = null;
  let fechaFin = null;

  switch (tipoRango) {
    case 'esta_semana': {
      const primerDiaSemana = new Date(hoy);
      primerDiaSemana.setDate(hoy.getDate() - hoy.getDay());
      fechaInicio = formatearFecha(primerDiaSemana);
      fechaFin = formatearFecha(hoy);
      break;
    }
    case 'este_mes': {
      const primerDiaMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
      fechaInicio = formatearFecha(primerDiaMes);
      fechaFin = formatearFecha(hoy);
      break;
    }
    case 'mes_pasado': {
      const primerDiaMesPasado = new Date(hoy.getFullYear(), hoy.getMonth() - 1, 1);
      const ultimoDiaMesPasado = new Date(hoy.getFullYear(), hoy.getMonth(), 0);
      fechaInicio = formatearFecha(primerDiaMesPasado);
      fechaFin = formatearFecha(ultimoDiaMesPasado);
      break;
    }
    case 'ultimos_7_dias': {
      const hace7Dias = new Date(hoy);
      hace7Dias.setDate(hoy.getDate() - 7);
      fechaInicio = formatearFecha(hace7Dias);
      fechaFin = formatearFecha(hoy);
      break;
    }
    case 'ultimos_30_dias': {
      const hace30Dias = new Date(hoy);
      hace30Dias.setDate(hoy.getDate() - 30);
      fechaInicio = formatearFecha(hace30Dias);
      fechaFin = formatearFecha(hoy);
      break;
    }
    default:
      return null;
  }

  return { fechaInicio, fechaFin };
};
/************************************************************************/
const filtrarCotizaciones = (cotizaciones = []) => {
  let filteredData = cotizaciones.filter(busqueda => {
    const fechaEmision = busqueda.fecha_emision;
    const fechaFiltrada = date.value ? formatearFecha(date.value) : null;
    const cumpleFecha = fechaFiltrada ? fechaEmision === fechaFiltrada : true;
    const cumpleBusqueda = searchQuery.value
      ? Object.values(busqueda).some(value =>
          String(value).toLowerCase().includes(searchQuery.value.toLowerCase())
        )
      : true;

    return cumpleFecha && cumpleBusqueda;
  });

  if (selectedRangoFecha.value.value !== 'todas') {
    const rango = calcularRangoFechas(selectedRangoFecha.value.value);
    if (rango) {
      const fechaInicioTimeStamp = new Date(transformarFechaTimestamp(rango.fechaInicio, false) + ' 00:00:01');
      const fechaFinTimeStamp = new Date(transformarFechaTimestamp(rango.fechaFin, false) + ' 23:59:59');

      filteredData = filteredData.filter(item => {
        const fechaCreacion = new Date(item.created_at);
        return fechaCreacion >= fechaInicioTimeStamp && fechaCreacion <= fechaFinTimeStamp;
      });
    }
  }

  if (buscadorFechaInteligente.value) {
    let fechaInicio;
    let fechaFin;

    if (typeof buscadorFechaInteligente.value === 'string') {
      const fechas = buscadorFechaInteligente.value.split(' - ');
      fechaInicio = fechas[0] ? formatearFecha(fechas[0]) : null;
      fechaFin = fechas[1] ? formatearFecha(fechas[1]) : null;
    } else {
      fechaInicio = formatearFecha(buscadorFechaInteligente.value[0]);
      fechaFin = buscadorFechaInteligente.value[1]
        ? formatearFecha(buscadorFechaInteligente.value[1])
        : formatearFecha(buscadorFechaInteligente.value[0]);
    }

    if (fechaInicio && fechaFin) {
      const fechaInicioTimeStamp = new Date(transformarFechaTimestamp(fechaInicio, false) + ' 00:00:01');
      const fechaFinTimeStamp = new Date(transformarFechaTimestamp(fechaFin, false) + ' 23:59:59');

      filteredData = filteredData.filter(item => {
        const fechaCreacion = new Date(item.created_at);
        return fechaCreacion >= fechaInicioTimeStamp && fechaCreacion <= fechaFinTimeStamp;
      });
    }
  }

  return filteredData;
};
/************************************************************************/
watch(selectedRangoFecha, (newVal) => {
  if (newVal.value !== 'todas') {
    buscadorFechaInteligente.value = null;
  }
});
/************************************************************************/
watch(buscadorFechaInteligente, (newVal) => {
  if (newVal) {
    selectedRangoFecha.value = { label: 'TODAS', value: 'todas' };
  }
});
/************************************************************************/
const calcularSubtotal = (producto) => {
  return producto.cantidad * producto.precio;
};

const calcularTotal = computed(() => {
  return productosCotizacion.value.reduce((total, producto) => total + calcularSubtotal(producto), 0);
});
/************************************************************************/
const fnImpresoraGrande = async()=>{
            const impresionpagina = link.value+'/receipt/factura.php?cotizacion='+currentRowData.value.no_cotizacion;
         // window.electron.ipcRenderer.invoke('open-new-window', impresionpagina,'url',false,true,false)


//router.push({ path: `/factura/${currentRowData.value.no_cotizacion}/cotizacion` });

    if (window.electron) {
         //window.electron.ipcRenderer.invoke('open-new-window', impresionpagina,'url',false,true,false)


     const datosEmpresa1 = JSON.stringify(enviarDatosLocalStorage());
     const datosFactura = currentRowData.value
     const datosCliente = await peticionesFetchOffline('getDataByField', 'clientes','codigo',datosFactura.cod_cliente);

     const envio = await window.electron.ipcRenderer.invoke('cotizacionPDF', JSON.stringify(datosFactura),JSON.stringify(datosCliente), datosEmpresa1,null);

/*     const datosEmpresa1 = JSON.stringify(enviarDatosLocalStorage());
     const envio = await window.electron.ipcRenderer.invoke('cotizacionPDF', currentRowData.value.no_cotizacion, datosEmpresa1,null);*/

        visiblePrint.value = false;
    } else {
    router.push({ path: `/factura/${currentRowData.value.no_cotizacion}/cotizacion` });  
/*        Swal.fire({
            title: "Factura Preview",
            html: `<iframe src="${impresionpagina}" width="100%" height="400px"></iframe>`,
            width: 800,
            showCancelButton: true,
            confirmButtonText: "Download",
            cancelButtonText: "Close",
        }).then((result) => {
            if (result.isConfirmed) {
                // Assuming `doc` is a jsPDF instance or similar
                doc.save(`Cotizacion_${datosFactCoti.value.numero}.pdf`);
            }
        });*/
    }




}

const fnImpresoraChica = async()=>{
     const datosEmpresa1 = JSON.stringify(enviarDatosLocalStorage());
     const datosFactura = currentRowData.value
     const datosCliente = await peticionesFetchOffline('getDataByField', 'clientes','codigo',datosFactura.cod_cliente);

     const envio = await window.electron.ipcRenderer.invoke('ticketcotizacion', JSON.stringify(datosFactura),JSON.stringify(datosCliente), datosEmpresa1,null);
}
/************************************************************************/
const getRowClass = (data) => {
  if (data.estado_cotizacion === 'CONVERTIDA') {
    return 'convertida';
  } else if (data.estado_cotizacion === 'PENDIENTE') {
    return 'pendiente';
  }else{
    return 'otroestado'
  }
  return '';
};
/************************************************************************/
// Estadísticas de Cotizaciones
const estadisticasCotizacion = computed(() => {
  const pendientes = data.value.filter(cot => cot.estado_cotizacion === 'PENDIENTE').length;
  const convertidas = data.value.filter(cot => cot.estado_cotizacion === 'CONVERTIDA').length;
  const total = data.value.length;

  const totalMonto = data.value.reduce((sum, cot) => sum + (parseFloat(cot.total) || 0), 0);
  const montoPendiente = data.value
    .filter(cot => cot.estado_cotizacion === 'PENDIENTE')
    .reduce((sum, cot) => sum + (parseFloat(cot.total) || 0), 0);
  const montoConvertido = data.value
    .filter(cot => cot.estado_cotizacion === 'CONVERTIDA')
    .reduce((sum, cot) => sum + (parseFloat(cot.total) || 0), 0);

  return {
    pendientes,
    convertidas,
    total,
    totalMonto,
    montoPendiente,
    montoConvertido
  };
});

const formatCurrency = (value) => {
  if (value) {
    return value.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
  }
  return '$0.00';
};

const getSeverityEstado = (estado) => {
  switch (estado) {
    case 'PENDIENTE':
      return 'warning';
    case 'CONVERTIDA':
      return 'success';
    default:
      return 'danger';
  }
};
/************************************************************************/
</script>
<template>
<main class="content-wrapper cotizacion-wrapper">
  <div class="w-full px-4 mt-5">
    <!-- Header Profesional -->
    <div class="cotizacion-header mb-5">
      <div class="cotizacion-header-content">
        <div class="cotizacion-icon-wrapper">
          <i class="pi pi-file-edit cotizacion-icon"></i>
        </div>
        <div>
          <h1 class="cotizacion-title">Gestión de Cotizaciones</h1>
          <p class="cotizacion-subtitle">Administración de presupuestos y propuestas comerciales</p>
        </div>
      </div>
    </div>

    <!-- Tarjetas de Estadísticas -->
    <div class="grid grid-cols-12 gap-4 mb-5">
      <div class="col-span-12 md:col-span-6 lg:col-span-3">
        <Card class="summary-card pendientes-card">
          <template #content>
            <div class="flex items-center justify-between">
              <div>
                <p class="summary-label">PENDIENTES</p>
                <p class="summary-value">{{ estadisticasCotizacion.pendientes }}</p>
                <p class="summary-count">{{ formatCurrency(estadisticasCotizacion.montoPendiente) }}</p>
              </div>
              <div class="summary-icon-wrapper pendientes">
                <i class="pi pi-clock text-3xl"></i>
              </div>
            </div>
          </template>
        </Card>
      </div>

      <div class="col-span-12 md:col-span-6 lg:col-span-3">
        <Card class="summary-card convertidas-card">
          <template #content>
            <div class="flex items-center justify-between">
              <div>
                <p class="summary-label">CONVERTIDAS</p>
                <p class="summary-value">{{ estadisticasCotizacion.convertidas }}</p>
                <p class="summary-count">{{ formatCurrency(estadisticasCotizacion.montoConvertido) }}</p>
              </div>
              <div class="summary-icon-wrapper convertidas">
                <i class="pi pi-check-circle text-3xl"></i>
              </div>
            </div>
          </template>
        </Card>
      </div>

      <div class="col-span-12 md:col-span-6 lg:col-span-3">
        <Card class="summary-card monto-card">
          <template #content>
            <div class="flex items-center justify-between">
              <div>
                <p class="summary-label">MONTO TOTAL</p>
                <p class="summary-value-currency">{{ formatCurrency(estadisticasCotizacion.totalMonto) }}</p>
                <p class="summary-count">en cotizaciones</p>
              </div>
              <div class="summary-icon-wrapper monto">
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
                <p class="summary-value">{{ estadisticasCotizacion.total }}</p>
                <p class="summary-count">cotizaciones</p>
              </div>
              <div class="summary-icon-wrapper total">
                <i class="pi pi-database text-3xl"></i>
              </div>
            </div>
          </template>
        </Card>
      </div>
    </div>

    <!-- Tabla de Cotizaciones -->
    <Card class="cotizacion-table-card shadow-lg">
      <template #content>
        <!-- Toolbar -->
        <div class="cotizacion-toolbar">
          <div class="flex gap-2">
            <Button icon="pi pi-refresh" severity="secondary" text rounded @click="fetchAndSetupData" v-tooltip="'Recargar datos'" />
            <Button label="Nueva Cotización" icon="pi pi-plus" severity="success" @click="fnRouter('/vender')" />
            <Button icon="pi pi-file-excel" label="Excel" severity="success" @click="fnExportarExcel" />
            <Button icon="pi pi-file-pdf" label="PDF" severity="danger" @click="fnExportarPDF" />
            <Button icon="pi pi-trash" severity="danger" outlined @click="borrarSeleccionados" :disabled="!selectedItems || !selectedItems.length" v-tooltip="'Borrar seleccionados'" />
            <Button v-if="usuarioLocal.usuario =='Soporte'" label="Borrar Todo" icon="pi pi-trash" severity="danger" text @click="borrarTodo" />
          </div>
        </div>

        <Divider />

        <!-- Filtros -->
        <div class="cotizacion-filters">
          <div class="flex flex-wrap gap-3 items-end">
            <div class="flex-1 min-w-[250px]">
              <label class="block text-sm font-medium text-gray-700 mb-2">Fecha</label>
              <div class="flex gap-2">
                <Calendar v-model="date" dateFormat="dd/mm/yy" showButtonBar placeholder="Seleccionar fecha" fluid />
                <Button icon="pi pi-times" severity="secondary" outlined @click="clearDate" v-tooltip="'Limpiar fecha'" />
              </div>
            </div>

            <div class="flex-1 min-w-[250px]">
              <label class="block text-sm font-medium text-gray-700 mb-2">Buscar</label>
              <InputText v-model="searchQuery" placeholder="Buscar cotización..." fluid />
            </div>

            <div class="flex-1 min-w-[250px]">
              <label class="block text-sm font-medium text-gray-700 mb-2">Rango Rapido</label>
              <Dropdown v-model="selectedRangoFecha" :options="rangoFechaOptions" optionLabel="label" placeholder="Seleccionar rango" class="w-full" />
            </div>

            <div class="flex-1 min-w-[250px]">
              <label class="block text-sm font-medium text-gray-700 mb-2">Rango Personalizado</label>
              <DatePicker v-model="buscadorFechaInteligente" dateFormat="yy-mm-dd" selectionMode="range" :showButtonBar="true" class="w-full" />
            </div>

            <div class="min-w-[180px]">
              <Button label="Limpiar filtros" icon="pi pi-filter-slash" severity="secondary" outlined @click="limpiarFiltros" class="w-full" />
            </div>
          </div>
        </div>

        <Divider />
        <!-- DataTable -->
        <DataTable
          :value="filteredCotizacion"
          scrollable
          scrollHeight="500px"
          dataKey="id"
          paginator
          :rows="10"
          @rowSelect="onRowSelect"
          v-model:selection="selectedItems"
          selectionMode="single"
          size="small"
          resizableColumns
          columnResizeMode="fit"
          :rowClass="getRowClass"
          :rowsPerPageOptions="[10, 20, 50]"
          tableStyle="min-width: 50rem"
          stripedRows
          class="cotizacion-datatable">

          <Column selectionMode="multiple" headerStyle="width: 3rem"></Column>

          <Column header="Acciones" style="width: 5rem; text-align: center">
            <template #body="slotProps">
              <Button icon="pi pi-ellipsis-v" text rounded severity="secondary" @click="toggleCotizacion($event, slotProps.data)" aria-haspopup="true" aria-controls="overlay_menu_Cotizacion" />
              <Menu ref="menu" id="overlay_menu_Cotizacion" :model="itemsCotizacion" :popup="true" />
            </template>
          </Column>

          <Column field="no_cotizacion" header="No. Cotización" sortable style="width: 10%">
            <template #body="slotProps">
              <div class="flex items-center gap-2">
                <i class="pi pi-file text-purple-600"></i>
                <span class="font-bold text-purple-700">#{{ slotProps.data.no_cotizacion }}</span>
              </div>
            </template>
          </Column>

          <Column field="nombre_cliente" header="Cliente" sortable>
            <template #body="slotProps">
              <div>
                <div class="font-medium text-gray-800">{{ slotProps.data.nombre_cliente }}</div>
                <div class="text-xs text-gray-500">{{ slotProps.data.telefono_cliente }}</div>
              </div>
            </template>
          </Column>

          <Column field="fecha_emision" header="Fecha Emisión" sortable style="width: 10%"></Column>

          <Column field="estado_cotizacion" header="Estado" sortable style="width: 10%">
            <template #body="slotProps">
              <Badge :value="slotProps.data.estado_cotizacion" :severity="getSeverityEstado(slotProps.data.estado_cotizacion)" class="font-semibold" />
            </template>
          </Column>

          <Column field="total" header="Total" sortable style="width: 12%; text-align: right">
            <template #body="slotProps">
              <span class="font-mono font-bold text-lg text-green-700">{{ formatCurrency(slotProps.data.total) }}</span>
            </template>
          </Column>

          <Column field="vendedor" header="Vendedor" sortable style="width: 12%"></Column>
          <Column field="no_factura" header="No. Factura" sortable style="width: 10%">
            <template #body="slotProps">
              <span v-if="slotProps.data.no_factura" class="text-blue-600 font-medium">#{{ slotProps.data.no_factura }}</span>
              <span v-else class="text-gray-400">-</span>
            </template>
          </Column>
        </DataTable>
      </template>
    </Card>
<Toast />


<!-- ////////////////////////////////////////////////////////////////////////////////////////// -->
  <Dialog v-model:visible="visibleProductos" :position="position" modal header="Productos" :style="{ width: '50rem' }" :breakpoints="{ '1199px': '75vw', '575px': '90vw' }">
    <template #header>
      <div class="inline-flex align-items-center justify-content-center gap-2">
        <span class="font-bold white-space-nowrap">Modal Editar</span>
      </div>
    </template>

    <fieldset class="border p-3 rounded mb-2">
      <legend class="float-none w-auto px-2">Productos</legend>
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
          <tr v-for="producto in productosCotizacion" :key="producto.codigo">
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
    </fieldset>

    <template #footer>
      <Button icon="pi pi-print" text severity="secondary" @click="visibleProductos = false" />
      <Button label="Cancel" text severity="secondary" @click="visibleProductos = false" />
    </template>
  </Dialog>
<!-- ////////////////////////////////////////////////////////////////////////////////////////// -->

  <Dialog v-model:visible="visiblePrint" :position="position" modal header="Productos" :style="{ width: '30rem' }" :breakpoints="{ '1199px': '75vw', '575px': '90vw' }">
    <template #header>
      <div class="inline-flex align-items-center justify-content-center gap-2">
        <span class="font-bold white-space-nowrap">Modal Editar</span>
      </div>
    </template>

    <fieldset class="border p-3 rounded mb-2">
      <legend class="float-none w-auto px-2">Elige la Impresora</legend>
      <div class="flex flex-wrap gap-4 justify-center">
         <Button label="Impresora Grande" icon="pi pi-print" @click="fnImpresoraGrande" iconPos="bottom" />
         <Button label="Impresora Térmica" icon="pi pi-print" @click="fnImpresoraChica" iconPos="bottom" />
     </div >
    </fieldset>

    <template #footer>
      <Button label="Cancel" text severity="secondary" @click="visiblePrint = false" />
    </template>
  </Dialog>
<!-- ////////////////////////////////////////////////////////////////////////////////////////// -->

  </div>
</main>
</template>
<style scoped>
/* Header Profesional de Cotización */
.cotizacion-header {
  background: linear-gradient(135deg, #9333ea 0%, #7e22ce 100%);
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
}

.cotizacion-header-content {
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.cotizacion-icon-wrapper {
  width: 4rem;
  height: 4rem;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(10px);
}

.cotizacion-icon {
  font-size: 2rem;
  color: white;
}

.cotizacion-title {
  font-size: 1.875rem;
  font-weight: 700;
  color: white;
  margin: 0;
  letter-spacing: -0.025em;
}

.cotizacion-subtitle {
  font-size: 1rem;
  color: rgba(255, 255, 255, 0.9);
  margin: 0.25rem 0 0 0;
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

.pendientes-card::before {
  background: linear-gradient(90deg, #f59e0b, #d97706);
}

.convertidas-card::before {
  background: linear-gradient(90deg, #10b981, #059669);
}

.monto-card::before {
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

.summary-icon-wrapper.pendientes {
  background: linear-gradient(135deg, #fef3c7, #fde68a);
  color: #d97706;
}

.summary-icon-wrapper.convertidas {
  background: linear-gradient(135deg, #d1fae5, #a7f3d0);
  color: #059669;
}

.summary-icon-wrapper.monto {
  background: linear-gradient(135deg, #dbeafe, #bfdbfe);
  color: #2563eb;
}

.summary-icon-wrapper.total {
  background: linear-gradient(135deg, #e9d5ff, #d8b4fe);
  color: #7c3aed;
}

/* Tabla de Cotizaciones */
.cotizacion-table-card {
  border-radius: 12px;
  border: 1px solid #e5e7eb;
}

.cotizacion-table-card .p-card-content {
  padding: 1.5rem;
}

.cotizacion-toolbar {
  padding-bottom: 1rem;
}

.cotizacion-filters {
  padding: 1rem 0;
}

.cotizacion-datatable :deep(.p-datatable-thead > tr > th) {
  background: linear-gradient(to bottom, #f9fafb, #f3f4f6);
  color: #374151;
  font-weight: 600;
  text-transform: uppercase;
  font-size: 0.75rem;
  letter-spacing: 0.05em;
  border-bottom: 2px solid #9333ea;
}

.cotizacion-datatable :deep(.p-datatable-tbody > tr:hover) {
  background-color: #faf5ff !important;
  cursor: pointer;
}

.cotizacion-datatable :deep(.p-datatable-tbody > tr) {
  transition: all 0.2s ease;
}

/* Estilos de estado en filas */
.pendiente {
  background-color: #fffbeb !important;
  border-left: 4px solid #f59e0b;
}

.convertida {
  background-color: #f0fdf4 !important;
  border-left: 4px solid #10b981;
}

.otroestado {
  background-color: #fef2f2 !important;
  border-left: 4px solid #ef4444;
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

/* Responsive */
@media (max-width: 768px) {
  .cotizacion-header {
    padding: 1.5rem;
  }

  .cotizacion-title {
    font-size: 1.5rem;
  }

  .cotizacion-subtitle {
    font-size: 0.875rem;
  }

  .summary-value {
    font-size: 1.5rem;
  }

  .summary-value-currency {
    font-size: 1.25rem;
  }

  .cotizacion-toolbar {
    flex-direction: column;
    align-items: stretch;
  }

  .cotizacion-filters .flex {
    flex-direction: column;
  }
}
</style>
