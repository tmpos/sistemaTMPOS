<script setup>
import { ref, onMounted, watch,nextTick, watchEffect } from 'vue';
import { useRouter,useRoute } from 'vue-router';
import Menu from 'primevue/menu';
import Button from 'primevue/button';
const router = useRouter();
import Swal from 'sweetalert2'
import Awesomplete from '../components/Awesomplete.vue';
import jszip from 'jszip';
import pdfmake from 'pdfmake';
import axios from 'axios';
import { useToast } from 'primevue/usetoast';
import LoadingOverlay from '../Loading/LoadingOverlay.vue';

import EnviarWhatsApp from '../components/WhatsappModal.vue';
onMounted(() => {

});
import {enviarDatosPorPost,
  eliminarDatos,
  obtenerIdsSeleccionados,
  borrarTodoslosDatos,
  lenguajeDataTable,
  nfecha,
  decimales,
  transformarFechaTimestamp,
  peticiones,
  formatearFecha,
  generadorCodigo,
  arrayToObjetoFromTabla,
  peticionesFetch,
  encryptarPassword,
  permisosPagina,
  envioElectron,
  mensajetoast,
  verificaAutentificado,
  lasMayusculas} from '../funciones/funciones.js';
import { facturaNueva } from '../funciones/funcionesVentas.js';

import config from '../../../../resources/config.json';
const toast = useToast();
/****************************************************/
const loading = ref(false)
const position = "top";
/****************************************************/
/*DataTable.use(DataTablesCore);
DataTablesCore.Buttons.jszip(jszip);
DataTablesCore.Buttons.pdfMake(pdfmake);*/
/****************************************************/
const productosSinStock = ref([])
const cotizacionesArray = ref([])
/****************************************************/
const menu = ref(null);
/****************************************************/
const link = ref(null);
const api = ref(null);
const token = ref(null);
const patronTelefono = ref(null);
const linkImpresora = ref(null);
const patroncedula = ref(null);
const tokenCifrado = ref(null);
const tokenCorto = ref(null);
/****************************************************/
/****************************************************/
import {useDatosEmpresa} from '../stores'
const datosEmpresa = useDatosEmpresa();
/****************************************************/
const dataFacturas = ref([]);
const dataIMEI = ref([]);
const cantidadFacturas = ref(0);
const dataCotizaciones = ref([]);
const dataProductosStock = ref([]);
const dataVencidos = ref([]);
const dataCompras = ref([]);
const dataProductos = ref([]);
const cantidadProductos = ref(0);
const dataCLientes = ref([])
const cantidadCLientes = ref(0)
const datosDelDia = ref({
    "venta": 0.00,
    "efectivo": 0.00,
    "transferencia": 0.00,
    "tarjeta": 0.00,
    "ganancia": 0.00,
    "gastos": 0.00,
    "entradas": 0.00,
    "devoluciones": 0.00,
    "inicioCaja": 0.00,
    "abono": 0.00,
    "taller": 0.00
});
/****************************************************/
const datosFactCoti = ref({'numero':'','tipo':'Factura','nombre':'','impresora':'Termica'});
const datosConfiguracion = ref({})
const datosDefault = ref({})
const usuarioLocalStorage = ref({})
/****************************************************/
const showWhatsapp = ref(false);
const visiblegastos = ref(false);
const visibleCuadre = ref(false);
const visibleIMEI = ref(false);
const camposGastos = ref({});
const fechaHoy = ref(nfecha('fecha'))
/****************************************************/
const imeiModal = ref(null)
/****************************************************/
const productoBuscado = ref({
stock:'',
precio_compra:'',
ganancia:'',
impuesto:'',
precio_venta:'',
precio_min:'',
precio_xmayor:'',
imeiLista:'',
impuesto_venta:'',
precio_final:'',
nStock:'0'
});
const listaBuscador = ref([]);
const imeiShow = ref(false)
const productoSelected = ref(null)
/****************************************************/

const enviarWhatsAppRef = ref(null);
const datosWhatsApp = ref({
  nombre: 'John Doe',
  numero: '123456789',
  texto: 'Hola, este es un mensaje predefinido.'
});
/****************************************************/
const showWhatsAppModal = async () => {
  if (enviarWhatsAppRef.value) {
          enviarWhatsAppRef.value.updateDatosWhatsApp(datosWhatsApp.value);
          enviarWhatsAppRef.value.visible = true;
  }
};
/****************************************************/
const abrirWhatsapp = ()=>{
     showWhatsAppModal()
}
/****************************************************/
const visibleModificarStock = ref(false)
/****************************************************/
const closeWhatsapp = ()=>{
showWhatsapp.value = false;
}
/****************************************************/
const visibleimprimirfactura = ref(false)
const campoNombreFactura = ref('')
const campoFactura = ref(null);
const impresoraSeleccionada = ref(null);
const usuarioHoy = ref(null)
const datosUsuarios = ref(null)
const usuarioTuno = ref(null);
const turnosXfecha = ref([]);
const turnoHoraInicio = ref(null)
const turnoHoraFin = ref(null)
const turnoUsuarioSelected = ref('COMPLETO')
/****************************************************/
const borrartablasdb = async ()=>{

}

//////////////////////////////////////////////////////
const fetchAndSetupDataFacturas = async () => {
const response = await peticionesFetch(`${link.value}${api.value}`,`datosarray/facturas`,{},tokenCifrado.value,'GET');
    const jsonData = response;
    dataFacturas.value = jsonData.slice(-10).reverse();
    cantidadFacturas.value = jsonData.length;

};
//////////////////////////////////////////////////////
//dataIMEI
const fetchIMEI = async () => {
const response = await peticionesFetch(`${link.value}${api.value}`,`datosarray/facturas`,{},tokenCifrado.value,'GET');
    const jsonData = response;
    dataIMEI.value = jsonData;

};
//////////////////////////////////////////////////////
const fetchAndSetupDataCotizaciones = async () => {
const response = await peticionesFetch(`${link.value}${api.value}`,`datosarray/cotizacion`,{},tokenCifrado.value,'GET');
    const jsonData = response;
    dataCotizaciones.value = jsonData.slice(-10).reverse();
};
//////////////////////////////////////////////////////
const fetchAndSetupDataCompras = async () => {
const response = await peticionesFetch(`${link.value}${api.value}`,`datosarray/compras`,{},tokenCifrado.value,'GET');
    const jsonData = response;
    dataCompras.value = jsonData;
};
//////////////////////////////////////////////////////
const fetchAndSetupDataProductos = async () => {
const response = await peticionesFetch(`${link.value}${api.value}`,`datosarray/productos`,{},tokenCifrado.value,'GET');
    const jsonData = response;
    dataProductos.value = jsonData;
    productosSinStock.value = jsonData.filter(prod => Number(prod.stock) <= Number(prod.alerta))

    cantidadProductos.value = jsonData.length;

          var arraybuscador = [];
      var arraybuscadorSoloProductos = [];
       response.forEach(function(index) {
        var keys = Object.keys(index);
        var values = Object.values(index);

        for (var i = 0; i < keys.length; i++) {
          if (keys[i] == 'codigo' || keys[i] == 'codigo_barra' || keys[i] == 'nombre') {
            arraybuscador.push(values[i])
            arraybuscadorSoloProductos.push(values[i])
          }
        }

      });

    listaBuscador.value = arraybuscador;

};
//////////////////////////////////////////////////////
const fetchAndSetupDataClientes = async () => {
const response = await peticionesFetch(`${link.value}${api.value}`,`datosarray/clientes`,{},tokenCifrado.value,'GET');
    const jsonData = response;
    dataCLientes.value = jsonData;
    cantidadCLientes.value = jsonData.length;
};
//////////////////////////////////////////////////////
const fetchAndSetupDatosdelDia = async () => {
const response = await peticionesFetch(`${link.value}${api.value}`,`datosventasdeldia`,{"fechainicio":nfecha('fechaAmericana')+' 07:00:00',"fechafinal":nfecha('timestamp')},tokenCifrado.value,'POST');
    const jsonData = response;
    datosDelDia.value = jsonData;

};
//////////////////////////////////////////////////////
const fetchDataUsuarios = async () => {
const response = await peticionesFetch(`${link.value}${api.value}`,`datosarray/usuarios`,{},tokenCifrado.value,'GET');
    const jsonData = response;
    datosUsuarios.value = jsonData;

};
//////////////////////////////////////////////////////
const cargaTurnos = async()=>{
   const nuevaFecha = formatearFecha(fechaHoy.value);
  const fechaTimeStamp =  transformarFechaTimestamp(nuevaFecha,false);
  const response = await peticionesFetch(`${link.value}${api.value}`,`datosporfecha`,{"campo":'created_at',"valor":fechaTimeStamp,'tabla':'registrocaja'},tokenCifrado.value,'POST');
    const jsonData = response;
    turnosXfecha.value = jsonData;
    usuarioTuno.value = jsonData[0].turno;
    const horaInicio = jsonData[0].created_at.split(' ');
    const horaFin = jsonData[0].updated_at.split(' ');
    turnoHoraInicio.value = horaInicio[1];
    turnoHoraFin.value = horaFin[1];
    turnoUsuarioSelected.value = 'COMPLETO'
}
//////////////////////////////////////////////////////
const cambioTuno = async()=>{
    const datos =  turnosXfecha.value.find(turno=>turno.turno === usuarioTuno.value)
    const horaInicio = datos.created_at.split(' ');
    const horaFin = datos.updated_at.split(' ');
    turnoHoraInicio.value = horaInicio[1];
    turnoHoraFin.value = horaFin[1];
}
//////////////////////////////////////////////////////
const cambioTurnoSelected = async()=>{
    const datos =  turnosXfecha.value.find(turno=>turno.turno === turnoUsuarioSelected.value)
    const horaInicio = datos.created_at.split(' ');
    const horaFin = datos.updated_at.split(' ');
    turnoHoraInicio.value = horaInicio[1];
    turnoHoraFin.value = horaFin[1];
}
//////////////////////////////////////////////////////


onMounted(async()=>{

verificaAutentificado(router)
permisosPagina(router)

const datosJSON = await envioElectron('datosarchivo');
link.value = datosJSON.VITE_LINKURL;
api.value = datosJSON.VITE_LINK_API;
token.value = datosJSON.VITE_TOKEN;
patronTelefono.value = datosJSON.VITE_PATRON_TELEFONO;
linkImpresora.value = datosJSON.VITE_IMPRESORA_LOCAL;
tokenCorto.value = datosJSON.VITE_TOKEN_CORTO;

tokenCifrado.value = await encryptarPassword(token.value, 10);
    if (!datosEmpresa.empresa.nombre) {
    await datosEmpresa.inicializarDatosEmpresa(link.value+api.value);
  }

 usuarioLocalStorage.value = JSON.parse(localStorage.getItem('usuarioLocal'))[0];
 datosDefault.value = JSON.parse(localStorage.getItem('datosDefault'));
 datosConfiguracion.value = JSON.parse(localStorage.getItem('configuracion'));


    const printer = {
      'Impresora Ticket':'Termica',
      'Offline':'Termica2',
      'Impresora Normal':'Tinta',
    }
    datosFactCoti.value.impresora = printer[datosConfiguracion.value.tipo_impresora];


await fetchAndSetupDataFacturas();
await fetchAndSetupDataCotizaciones();
await fetchAndSetupDataCompras();
await fetchIMEI();
await fetchAndSetupDataProductos();
await fetchAndSetupDataClientes();
await fetchAndSetupDatosdelDia();
await fetchDataUsuarios();
camposGastos.value = await arrayToObjetoFromTabla(link.value+api.value,tokenCifrado.value,'gastos');
loading.value = false

})
//////////////////////////////////////////////////////
watchEffect(async() => {
  if (visiblegastos.value) {
      camposGastos.value.fecha = nfecha('fecha');
      camposGastos.value.hora = nfecha('hora');
      camposGastos.value.cantidad = '0.00';
      camposGastos.value.mes = nfecha('mes');
      camposGastos.value.year = nfecha('year');
      camposGastos.value.cajero = usuarioLocalStorage.value.email;
      camposGastos.value.turno = usuarioLocalStorage.value.token;
  }

if (visibleimprimirfactura.value) {
   impresoraSeleccionada.value = datosConfiguracion.value.tipo_impresora
}

if (visibleCuadre) {
  usuarioHoy.value = usuarioLocalStorage.value.nombre;
  await cargaTurnos()
}

  });
//////////////////////////////////////////////////////
const turnoFechaCambio = async()=>{
  let fechaSeleccionada = new Date(fechaHoy.value);
   const nuevaFecha = fechaSeleccionada.toLocaleDateString('es-ES');
   console.log("nuevaFecha", nuevaFecha);
  // fechaHoy.value = fechaSeleccionada.toLocaleDateString('es-ES');
  //await cargaTurnos()
}
//////////////////////////////////////////////////////
const abrirventana = ()=>{
    window.electron.ipcRenderer.invoke('open-new-window', 'https://demo.tmposrd.com/receipt/ticket.php?factura=0000087','url')
    const data = {
      'factura':'0000087',
      'tipo':'Termica'
    }

    //window.electron.ipcRenderer.send('imprimir',data)
    //window.electron.ipcRenderer.send('datosarchivo');
    //window.electron.ipcRenderer.send('consulta','comisiones')
   // console.log("ipcHandle", ipcHandle);

}
//////////////////////////////////////////////////////
const botones = [{
  nombre:'editar',
  icono:'pencil',
  color:'success'
},
{
  nombre:'imprimir',
  icono:'print',
  color:'dark',
},
{
  nombre:'eliminar',
  icono:'trash',
  color:'danger',
}
];
let losBotones = "";
for (let boton of botones) {
  losBotones += `<li><a href="#" class="dropdown-item ${boton.nombre}" id="btn${boton.nombre}"><i class="icon-${boton.icono} text-${boton.color}"></i> ${boton.nombre}</a></li>`;
}
/************************************************************************/
const columnsFacturas = ref([
  {
    data: null,
    title: '<input type="checkbox" id="check-all" />',
    orderable: false,
    className: 'select-checkbox',
    render: function(data, type, row) {
        return '<input type="checkbox" class="dt-checkbox dt-checkboxes" value="' + row.id + '">';
    },
    width: "30px"
  },
  {
    title: 'Acción',
    orderable: false,
    data: null,
"defaultContent":`<div class="dropdown">
  <button class="btn btn-secondary dropdown-toggle" type="button" data-bs-toggle="dropdown" aria-expanded="false">
  <i class="icon-cog-alt"></i>
  </button>
  <ul class="dropdown-menu">
    ${losBotones}
  </ul>
</div>`},
{ data: 'no_factura', title: 'Numero' },
{ data: 'comprobante', title: 'Comprobante' },
{ data: 'nombre_cliente', title: 'Ciente' },
{ data: 'telefono_cliente', title: 'Telefono' },
{ data: 'fecha_emision', title: 'Fecha' },
{ data: 'vendedor', title: 'Vendedor' },
{ data: 'metodo_pago', title: 'Metodo de Pago' },
{ data: 'total', title: 'Total' },

]);
/****************************************************/
//////////////////////////////////////////////////////
const optionsFacturas = ref({
  responsive: true,
  "processing": true,
  dom: `
    <'row'<'col-sm-12 col-md-6'B><'col-sm-12 col-md-6'f>>
    <'row'<'col-sm-12'tr>>
    <'row'<'col-sm-12 col-md-5'i><'col-sm-12 col-md-7'p>>
  `,
   columnDefs:[ {
      targets:0, width:"30px", className:"", orderable:!1, render:function(e, a, t, n) {
          return `
           <div class="form-check-primary d-block new-control">
            <a class="btn"></a>
            </div>`
           }
        }],
  buttons: [
    'copy', 'excel', 'csv',
    {
      extend: 'pdfHtml5',
      text: 'PDF',
      titleAttr: 'Exportar a PDF',
      customize: function (doc) {}
    }
  ],
    language:lenguajeDataTable(),
  columns: columnsFacturas.value,
  drawCallback: function () {
    const apiDatatable = this.api();
     document.getElementById('check-all').addEventListener('click', function(e) {
      const checkboxes = apiDatatable.table().container().querySelectorAll('.dt-checkboxes');
      checkboxes.forEach(checkbox => {
        checkbox.checked = e.target.checked;
      });
    });
/************************************************************************/
   apiDatatable.table().container().querySelectorAll('.editar').forEach(button => {
    button.addEventListener('click', (e) => {
      e.preventDefault();
      const tr = e.target.closest('tr');
      const rowData = apiDatatable.row(tr).data();

    });
  });
/************************************************************************/
  apiDatatable.table().container().querySelectorAll('.imprimir').forEach(button => {
    button.addEventListener('click', async(e) => {
      e.preventDefault();
      const tr = e.target.closest('tr');
      const rowData = apiDatatable.row(tr).data();

    const factura  = rowData.no_factura;
    if (factura == '') {
      toast.add({ severity: 'error', summary: 'Error', detail: 'Debe seleccionar un documento para imprimir', life: 3000 });
      return
    }
      if (datosFactCoti.value.tipo == 'Factura') {
     if (datosFactCoti.value.impresora == 'Termica') {
         // var impresionpagina = link.value+'/receipt/ticket.php?factura='+factura;
          var impresionpagina = link.value+'/vista/impresoratermica.php?factura='+factura;
         //window.electron.ipcRenderer.invoke('open-new-window', impresionpagina,'url')
         window.electron.ipcRenderer.invoke('open-new-window', impresionpagina, 'url', true,false);
     }else if(datosFactCoti.value.impresora == 'Termica2'){
     const imprimir = await peticionesFetch(`${linkImpresora}/api`,`factura/${factura}/${token.value}`,{},null,'GET');
       if (imprimir[0] == 'ok') {
        toast.add({ severity: 'success', summary: 'OK', detail: 'Impresión Completa', life: 3000 });
       }else{
        toast.add({ severity: 'error', summary: 'Error', detail: 'Error de Impresión', life: 3000 });
       }
     } else{
      var impresionpagina = link.value+'/receipt/factura.php?factura='+factura;
      window.electron.ipcRenderer.invoke('open-new-window', impresionpagina,'url')
     }
    }else{

     if (datosFactCoti.value.impresora == 'Termica') {
          var impresionpagina = link.value+'/receipt/ticket.php?cotizacion='+factura;
          window.electron.ipcRenderer.invoke('open-new-window', impresionpagina,'url')
     }else{
         var impresionpagina = link.value+'/receipt/factura.php?cotizacion='+factura;
          window.electron.ipcRenderer.invoke('open-new-window', impresionpagina,'url')
     }


    }


    });
  });
/************************************************************************/
  apiDatatable.table().container().querySelectorAll('.eliminar').forEach(button => {
    button.addEventListener('click', async (e) => {
      e.preventDefault();
      const tr = e.target.closest('tr');
      const rowData = apiDatatable.row(tr).data();

    });
  });
  }
});
//////////////////////////////////////////////////////
const imprimirUltimoGasto = async ()=>{
  const ultimoRegistro = await peticiones(link.value+api.value+'/ultimosx/gastos/1',{},'GET',tokenCifrado.value);
  if (ultimoRegistro) {
    const impresionpagina = `${link.value}/vista/gastosTermica.php?id=${ultimoRegistro[0].id}`;
      window.electron.ipcRenderer.invoke('open-new-window', impresionpagina,'url',true,false)

  }else{
    toast.add({ severity: 'error', summary: 'Error', detail: 'Error de Peticion.', life: 3000 });
  }

}
//////////////////////////////////////////////////////
const agregarGasto = async()=>{

  const url = link.value+api.value+"/insertar/gastos";
  if (!camposGastos.value) {
    toast.add({ severity: 'error', summary: 'Error', detail: 'Datos incompletos, no se puede Enviar.', life: 3000 });
    return;
  }
  if (camposGastos.value.hasOwnProperty('created_at')) {
     camposGastos.value.created_at = nfecha('timestamp')
     camposGastos.value.updated_at = nfecha('timestamp')
    }
  const envioDatos = await enviarDatosPorPost(url, camposGastos.value,tokenCifrado.value);
  if (envioDatos[0] == 'ok') {
     toast.add({ severity: 'success', summary: 'Éxito', detail: 'Gasto Agregado con éxito.', life: 3000 });
   await imprimirUltimoGasto();
   await fetchAndSetupDatosdelDia();
   visiblegastos.value = false
   camposGastos.value = await arrayToObjetoFromTabla(link.value+api.value,tokenCifrado.value,'gastos');
  }else{
    toast.add({ severity: 'error', summary: 'Error', detail: 'Fallo al Agregar el Gasto.', life: 3000 });
  }

}
/////////////////////////////////////////////////////////////////////
const facturaSeleccionada = async(factura)=>{
  const datosFactura = dataFacturas.value.find(fact=>fact.no_factura === factura.value.no_factura);
  if (datosFactura) {
    toast.add({ severity: 'success', summary: 'Éxito', detail: 'Factura Seleccionada.', life: 3000 });
    campoNombreFactura.value = datosFactura.nombre_cliente
  }

}
/////////////////////////////////////////////////////////////////////
const recargarFacturas = async()=>{
  await fetchAndSetupDataFacturas();
  toast.add({ severity: 'success', summary: 'Éxito', detail: 'Facturas Recargadas.', life: 3000 });
}
/////////////////////////////////////////////////////////////////////
/******************************************************/
//impresoraSeleccionada
const imprimirFactura = async()=>{

  const datosFactura = dataFacturas.value.find(fact=>fact.no_factura === campoFactura.value.no_factura);
  if (datosFactura) {

     if (impresoraSeleccionada.value == 'Impresora Ticket') {
         // var impresionpagina = link.value+'/receipt/ticket.php?factura='+datosFactura.no_factura;
          var impresionpagina = link.value+'/vista/impresoratermica.php?factura='+datosFactura.no_factura;
        // window.electron.ipcRenderer.invoke('open-new-window', impresionpagina,'url')
          window.electron.ipcRenderer.invoke('open-new-window', impresionpagina, 'url', true,false);
     }else if(datosFactCoti.value == 'Offline'){
     const imprimir = await peticionesFetch(`${linkImpresora}/api`,`factura/${datosFactura.no_factura}/${token}`,{},null,'GET');
       if (imprimir[0] == 'ok') {
        toast.add({ severity: 'success', summary: 'OK', detail: 'Impresión Completa', life: 3000 });
       }else{
        toast.add({ severity: 'error', summary: 'Error', detail: 'Error de Impresión', life: 3000 });
       }
     } else{
      var impresionpagina = link.value+'/receipt/factura.php?factura='+datosFactura.no_factura;
      window.electron.ipcRenderer.invoke('open-new-window', impresionpagina,'url')
     }

  }else{
    toast.add({ severity: 'error', summary: 'Error', detail: 'Seleccione una Factura', life: 3000 });
  }

}
/******************************************************/
const usuarioSeleccionado = async()=>{
  //usuarioHoy
  console.log("usuarioHoy", usuarioHoy);
}
/******************************************************/
const imprimirCuadre = async()=>{

  if (turnoUsuarioSelected.value === 'COMPLETO') {
      const fecha = transformarFechaTimestamp(formatearFecha(fechaHoy.value),false);
      const impresionpagina = `${link.value}/vista/impresorareporte.php?fecha=${fecha} 00:00:00AND${fecha} 23:59:59`;
    window.electron.ipcRenderer.invoke('open-new-window', impresionpagina,'url',true,false)
  }else{
    const fecha = transformarFechaTimestamp(formatearFecha(fechaHoy.value),false);
    const impresionpagina = `${link.value}/vista/impresorareporte.php?fecha=${fecha} ${turnoHoraInicio.value}AND${fecha} ${turnoHoraFin.value}`;
    window.electron.ipcRenderer.invoke('open-new-window', impresionpagina,'url',false)
  }

}
/******************************************************/
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
/******************************************************/
const currentRowData = ref(null);
const currentRowId = ref(null);
const itemsCotizacion = ref([]);

const toggleCotizacion = (event, rowData) => {
    currentRowData.value = rowData;
    itemsCotizacion.value = [
        { label: 'Editar', icon: 'pi pi-pencil', command: () => { editRow(currentRowData.value) } },
        { label: 'Imprimir', icon: 'pi pi-print', command: async() => {

           if (datosConfiguracion.value.impresora == 'Termica') {
            var impresionpagina = link.value+'/vista/impresoratermica.php?cotizacion='+rowData.no_cotizacion;
            window.electron.ipcRenderer.invoke('open-new-window', impresionpagina, 'url', true,false);

           }else if(datosConfiguracion.value.impresora == 'Termica2'){
           const imprimir = await peticionesFetch(`${linkImpresora}/api`,`cotizacion/${rowData.no_cotizacion}/${token.value}`,{},null,'GET');
             if (imprimir[0] == 'ok') {
              toast.add({ severity: 'success', summary: 'OK', detail: 'Impresión Completa', life: 3000 });
             }else{
              toast.add({ severity: 'error', summary: 'Error', detail: 'Error de Impresión', life: 3000 });
             }
           } else{
            var impresionpagina = link.value+'/receipt/factura.php?cotizacion='+rowData.no_cotizacion;
            window.electron.ipcRenderer.invoke('open-new-window', impresionpagina,'url')
           }

         } },
        { label: 'Whatsapp', icon: 'pi pi-whatsapp', command: () => { editRow(currentRowData.value) } },
        { label: 'PDF', icon: 'pi pi-file-pdf', command: () => { editRow(currentRowData.value) } },
        { label: 'Eliminar', icon: 'pi pi-trash', command: () => { deleteRow(currentRowData.value) } },
    ];
    menu.value.toggle(event);
};

const editRow = (rowData) => {
    console.log("Editing row:", rowData);
    // Agrega tu lógica de edición aquí
};

const deleteRow = (rowData) => {
    console.log("Deleting row:", rowData);
    // Agrega tu lógica de eliminación aquí
};

/******************************************************/
const itemsFacturas = ref([]);

const toggleFacturas = (event, rowData) => {
    currentRowData.value = rowData;
    itemsFacturas.value = [
        { label: 'Editar', icon: 'pi pi-pencil', command: () => { editRow(currentRowData.value) } },
        { label: 'Imprimir', icon: 'pi pi-print', command: async() => {

           if (datosConfiguracion.value.impresora == 'Termica') {
                //var impresionpagina = link.value+'/receipt/ticket.php?factura='+rowData.no_factura;
                // var impresionpagina = link.value+'/vista/impresoratermica.php?factura='+rowData.no_factura;
               //window.electron.ipcRenderer.invoke('open-new-window', impresionpagina,'url')
            var impresionpagina = link.value+'/vista/impresoratermica.php?factura='+rowData.no_factura;
            window.electron.ipcRenderer.invoke('open-new-window', impresionpagina, 'url', true,false);

           }else if(datosConfiguracion.value.impresora == 'Termica2'){
           const imprimir = await peticionesFetch(`${linkImpresora}/api`,`factura/${rowData.no_factura}/${token.value}`,{},null,'GET');
             if (imprimir[0] == 'ok') {
              toast.add({ severity: 'success', summary: 'OK', detail: 'Impresión Completa', life: 3000 });
             }else{
              toast.add({ severity: 'error', summary: 'Error', detail: 'Error de Impresión', life: 3000 });
             }
           } else{
            var impresionpagina = link.value+'/receipt/factura.php?factura='+rowData.no_factura;
            window.electron.ipcRenderer.invoke('open-new-window', impresionpagina,'url')
           }


         } },
        { label: 'Whatsapp', icon: 'pi pi-whatsapp', command: () => {
          const mensajaeEnviar = `Hola *${rowData.nombre_cliente}* Aquí tiene un enlace para ver o descargar su *Factura* ${datosConfiguracion.value.urlsitio}receipt/factura?factura=${rowData.no_factura}`;
          datosWhatsApp.value.nombre = rowData.nombre_cliente
          datosWhatsApp.value.numero = rowData.telefono_cliente
          datosWhatsApp.value.texto = mensajaeEnviar
         showWhatsAppModal()

         } },
        { label: 'Estado', icon: 'pi pi-eye', command: () => { editRow(currentRowData.value) } },
        { label: 'PDF', icon: 'pi pi-file-pdf', command: () => {
            var impresionpagina = link.value+'/receipt/factura.php?factura='+rowData.no_factura;
            window.electron.ipcRenderer.invoke('open-new-window', impresionpagina,'url')
         } },
        { label: 'Eliminar', icon: 'pi pi-trash', command: () => {

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
      if (contrasenaIngresada === token.value || contrasenaIngresada === tokenCorto.value) {

      const datosFactura = await peticionesFetch(`${link.value}${api.value}`,`borrarporcampo/facturas`,{campo:'no_factura',valor:rowData.no_factura},tokenCifrado.value,'POST');

      if (datosFactura[0]=='ok') {

           toast.add({ severity: 'success', summary: 'Éxito', detail: 'Factura eliminada correctamente', life: 3000 });
           await fetchAndSetupDataFacturas()
      }else{
          toast.add({ severity: 'error', summary: 'Error', detail: 'Error al eliminar la Factura', life: 3000 });
      }

      } else {
        toast.add({ severity: 'error', summary: 'Error', detail: 'Contraseña incorrecta', life: 3000 });
      }
    }
  });


         } },
    ];
    menu.value.toggle(event);
};

/******************************************************/
async function funcionActualizarProducto(producto) {
  const url = link.value+api.value+"/actualizarcampos/productos";
  if (!producto.nombre) {
    console.error("Datos incompletos, no se puede actualizar.");
    return;
}
if (producto.hasOwnProperty('created_at')) {
      producto.updated_at = nfecha('timestamp')
}
const envioDatos = await enviarDatosPorPost(url, producto,tokenCifrado.value);
  if (envioDatos[0] == 'ok') {
     await fetchAndSetupDataProductos();
     toast.add({ severity: 'success', summary: 'Éxito', detail: 'Datos Actualizados', life: 3000 });
}else{
    toast.add({ severity: 'error', summary: 'Error', detail: 'Fallo al actualizar los datos.', life: 3000 });
  }
}
/******************************************************/
watch(visibleModificarStock,(evento)=>{
  if(evento){
   productoSelected.value = {};

      productoBuscado.value.nombre = ''
      productoBuscado.value.stock = '0'
      productoBuscado.value.precio_compra = ''
      productoBuscado.value.ganancia = ''
      productoBuscado.value.impuesto = ''
      productoBuscado.value.precio_venta = ''
      productoBuscado.value.precio_min = ''
      productoBuscado.value.precio_xmayor = ''
      productoBuscado.value.imeiLista = ''
      productoBuscado.value.impuesto_venta = ''
      productoBuscado.value.precio_final = ''
      productoBuscado.value.nStock = '0'


  }else{
   productoSelected.value = null;

  }
})
/******************************************************/
const fnAwesomplete = ()=>{

}
const handleSelectComplete = async(selected)=>{

   const producto = dataProductos.value.find(prod =>
    prod.nombre === selected.value ||
    prod.codigo === selected.value ||
    prod.codigoBarra === selected.value
  );


    if (producto) {
        productoSelected.value = producto

      if (producto.categoria =='CELULARES') {
          imeiShow.value = true;
          await fechDataIMEI()
        }else{
          imeiShow.value = false
        }

      productoBuscado.value.nombre = producto.nombre
      productoBuscado.value.stock = producto.stock
      productoBuscado.value.precio_compra = producto.precio_compra
      productoBuscado.value.ganancia = producto.ganancia
      productoBuscado.value.impuesto = producto.impuestos
      productoBuscado.value.precio_venta = producto.precio_venta
      productoBuscado.value.precio_min = producto.precio_min
      productoBuscado.value.precio_xmayor = producto.precio_xmayor
      productoBuscado.value.imei = ''
      productoBuscado.value.impuesto_venta = producto.impuesto_venta
      productoBuscado.value.precio_final = producto.precio_final
      productoBuscado.value.nStock = '0'

    }else{
       toast.add({ severity: 'error', summary: 'Error', detail: 'No se Encuentra el Producto', life: 3000 });
    }

}
/******************************************************/
const fnSumarStock = async()=>{
   const suma = (Number(productoBuscado.value.stock) + Number(productoBuscado.value.nStock));
   if (productoSelected.value) {
    productoSelected.value.stock = suma
     await funcionActualizarProducto(productoSelected.value);
     productoBuscado.value.stock = suma
     productoBuscado.value.nStock = '0'
   }
}
/******************************************************/
const fnAgregarIMEI = async()=>{

    const verificaIMEI = await peticionesFetch(`${link.value}${api.value}`,`datoscampo/imei/imei/${productoBuscado.value.imei}`,{},tokenCifrado.value,'GET');

  if (verificaIMEI) {
      toast.add({ severity: 'error', summary: 'Error', detail: 'ESTE IMEI YA ESTA REGISTRADO', life: 3000 });
      productoBuscado.value.imei = ''
      return
  }

   const datoscamposImei = await arrayToObjetoFromTabla(link.value+api.value,tokenCifrado.value,'imei',true);
   datoscamposImei.imei = productoBuscado.value.imei;
   datoscamposImei.equipo = productoSelected.value.nombre;
   datoscamposImei.id_equi = productoSelected.value.id;
   datoscamposImei.estado = 'DISPONIBLE';
   datoscamposImei.fecha = nfecha('fecha');
   datoscamposImei.detalles = `ALMACENAMIENTO:
BATERIA TESTEADA: si
BATERIA QUE MARCA: original
DETALLES ESTETICOS: Ninguno
DETALLES INTERNOS: Ninguno
BATERIA MARCA: 100%`;

  const url = link.value+api.value+"/insertar/imei";
  if (datoscamposImei.hasOwnProperty('created_at')) {
     datoscamposImei.created_at = nfecha('timestamp')
     datoscamposImei.updated_at = nfecha('timestamp')
    }
  const envioDatos = await enviarDatosPorPost(url, datoscamposImei,tokenCifrado.value);
  if (envioDatos[0] == 'ok') {
     productoBuscado.value.nStock = '1'
     await fnSumarStock();

     toast.add({ severity: 'success', summary: 'Éxito', detail: 'IMEI Agregado', life: 3000 });
     productoBuscado.value.imei = ''

    await fetchIMEI();
  }else{
    toast.add({ severity: 'error', summary: 'Error', detail: 'Fallo al Agregar el IMEI.', life: 3000 });
}



}
/******************************************************/
const fechDataIMEI = async()=>{
    //imeiList
    const response = await enviarDatosPorPost(`${link.value+api.value}/datosarraydoblecondicion/imei`,{campo1:'id_equi',valor1:productoSelected.value.id,campo2:'estado',valor2:'DISPONIBLE'},tokenCifrado.value);
    const jsonData = response;
    productoBuscado.value.stock = jsonData.length;
    await fnSumarStock();
}
/******************************************************/
const fnImprimirProducto = ()=>{
  if (productoSelected.value.id) {
      var impresionpagina = link.value+'/vista/imprimirproductoticket.php?id='+productoSelected.value.id;
      window.electron.ipcRenderer.invoke('open-new-window', impresionpagina, 'url', true,false);
  }else{
    toast.add({ severity: 'error', summary: 'Error', detail: 'Debes seleccionar un Producto', life: 3000 });
  }
}
/******************************************************/
const fnEditarProducto = ()=>{
  if (productoSelected.value.id) {
      router.push({ path: `/editarproductos/${productoSelected.value.id}` });
  }else{
    toast.add({ severity: 'error', summary: 'Error', detail: 'Debes seleccionar un Producto', life: 3000 });
  }
}
/******************************************************/
const fnBarcode = ()=>{

}
/******************************************************/
const fnvenderProducto = () => {
    // Obtener productos agregados del localStorage
    let productosAgregados = JSON.parse(window.localStorage.getItem('productosVenta')) || [];

    // Asegurar que productoSelected tiene un valor
    if (productoSelected.value) {
        // Buscar si el producto ya existe en la lista de productos agregados
        const productoExistente = productosAgregados.find(prod => prod.codigo === productoSelected.value.codigo);

        // Si el producto ya existe, incrementar la cantidad
        if (productoExistente) {
            productoExistente.cantidad += 1;
        } else {
            // Si el producto no existe, establecer cantidad y descuento, y agregarlo a la lista
            productoSelected.value.cantidad = 1;
            productoSelected.value.descuento = 0.00;
            productosAgregados.push(productoSelected.value);
        }

        // Mostrar notificación de éxito
        toast.add({ severity: 'success', summary: 'Éxito', detail: 'Producto Agregado', life: 3000 });

        // Actualizar el localStorage con la lista de productos actualizada
        window.localStorage.setItem('productosVenta', JSON.stringify(productosAgregados));

        // Redirigir al usuario a la ruta /vender
        router.push({ path: `/vender` });
    } else {
        // Manejar el caso donde productoSelected no tiene valor
        toast.add({ severity: 'error', summary: 'Error', detail: 'No hay producto seleccionado', life: 3000 });
    }
}

/******************************************************/
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

 const datosEquipo = await peticionesFetch(`${link.value}${api.value}`,`datoscampo/productos/id/${datosIMEI.value.id_equi}`,{},tokenCifrado.value,'GET');
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
/******************************************************/
const fnBuscarIMEIlocal = async () => {
  visibleIMEI.value = false;
  const imei = imeiModal.value;
  const response = await peticionesFetch(
    `${link.value}${api.value}`,
    `datoscampo/imei/imei/${imei}`,
    {},
    tokenCifrado.value,
    'GET'
  );

  if (response) {
    toast.add({
      severity: 'success',
      summary: 'OK',
      detail: 'Datos encontrados',
      life: 3000,
    });
     datosIMEI.value = response
    const responseProducto = dataProductos.value.find(
      (prod) => prod.id == response.id_equi
    );

    if (responseProducto) {
      const estado = response.estado; // Assuming 'estado' is the property name
      const estadoStyle = estado === 'DISPONIBLE' ? 'color: green;' : 'color: red;';
      const estadoText = `<span style="${estadoStyle}">${estado}</span>`;

      let additionalDetails = '';
      if (estado === 'VENDIDO') {
        additionalDetails = `
          <p><strong>Fecha de Venta:</strong> ${response.fecha_venta}</p>
          <p><strong>Comprador:</strong> ${response.comprador}</p>
        `;
      }

      Swal.fire({
        title: 'Detalles del Celular',
        html: `
          <p><strong>Estado:</strong> ${estadoText}</p>
          <p><strong>Precio Compra:</strong> ${responseProducto.precio_compra}</p>
          <p><strong>Precio Venta:</strong> ${responseProducto.precio_venta}</p>
          <p><strong>Precio Mínimo:</strong> ${responseProducto.precio_min}</p>
          <p><strong>Precio por Mayor:</strong> ${responseProducto.precio_xmayor}</p>
          ${additionalDetails}
        `,
        icon: 'info',
        showCancelButton: estado === 'DISPONIBLE',
        confirmButtonText: 'Cerrar',
        cancelButtonText: 'Vender'
      }).then(async(result) => {
        if (estado === 'DISPONIBLE' && result.dismiss === Swal.DismissReason.cancel) {
          await fnagregarImei()
        }
      });
    } else {
      toast.add({
        severity: 'error',
        summary: 'Error',
        detail: 'No se encontró el producto asociado',
        life: 3000,
      });
    }
  } else {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'No se encuentra el IMEI',
      life: 3000,
    });
  }
};


const fnBuscarIMEIgeneral = async()=>{
if (!imeiModal.value || imeiModal.value =='') {
  toast.add({ severity: 'error', summary: 'Error', detail: 'Escriba un IMEI valido', life: 3000 });
  return
}

  const datos =
{
  "service": '0',
  "imei": imeiModal.value,
  //"key": "WLZ-OJ2-7HJ-0XH-DJ6-AVZ-OXU-1XB"
  "key": "JKD-QC9-9L9-9C6-GT7-J2I-LIV-U3M"
}
    try {
        const prueba = await enviarDatosPorPost('https://api.ifreeicloud.co.uk', datos,tokenCifrado.value);

        if (prueba.success) {
          visibleIMEI.value = false
          const formattedData = Object.entries(prueba.object)
            .map(([key, value]) => `<li><strong>${key}:</strong> ${value}</li>`)
            .join('');

          // Mostrar prueba.object con SweetAlert2
          Swal.fire({
            title: 'Datos del IMEI',
            html: `<ul>${formattedData}</ul>`,
            icon: 'success',
            confirmButtonText: 'Cerrar'
          });

        } else {
            toast.add({ severity: 'error', summary: 'Error', detail: 'No se encuentran Datos', life: 3000 });
        }
    } catch (error) {
         toast.add({ severity: 'error', summary: 'Error', detail: 'Error de peticion', life: 3000 });
    }
}
/******************************************************/
/******************************************************************/
const tabs = ref([
    { title: 'Tab 1', content: 'Tab 1 Content', value: '0' },
    { title: 'Tab 2', content: 'Tab 2 Content', value: '1' },
    { title: 'Tab 3', content: 'Tab 3 Content', value: '2' }
]);
/******************************************************************/
</script>
<template>
    <div class="grid grid-cols-12 gap-8">
        <div class="col-span-12 lg:col-span-6 xl:col-span-3">
            <div class="card mb-0">
                <div class="flex justify-between mb-4">
                    <div>
                        <span class="block text-muted-color font-medium mb-4">Orders</span>
                        <div class="text-surface-900 dark:text-surface-0 font-medium text-xl">152</div>
                    </div>
                    <div class="flex items-center justify-center bg-blue-100 dark:bg-blue-400/10 rounded-border" style="width: 2.5rem; height: 2.5rem">
                        <i class="pi pi-shopping-cart text-blue-500 !text-xl"></i>
                    </div>
                </div>
                <span class="text-primary font-medium">24 new </span>
                <span class="text-muted-color">since last visit</span>
            </div>
        </div>
        <div class="col-span-12 lg:col-span-6 xl:col-span-3">
            <div class="card mb-0">
                <div class="flex justify-between mb-4">
                    <div>
                        <span class="block text-muted-color font-medium mb-4">Revenue</span>
                        <div class="text-surface-900 dark:text-surface-0 font-medium text-xl">$2.100</div>
                    </div>
                    <div class="flex items-center justify-center bg-orange-100 dark:bg-orange-400/10 rounded-border" style="width: 2.5rem; height: 2.5rem">
                        <i class="pi pi-dollar text-orange-500 !text-xl"></i>
                    </div>
                </div>
                <span class="text-primary font-medium">%52+ </span>
                <span class="text-muted-color">since last week</span>
            </div>
        </div>
        <div class="col-span-12 lg:col-span-6 xl:col-span-3">
            <div class="card mb-0">
                <div class="flex justify-between mb-4">
                    <div>
                        <span class="block text-muted-color font-medium mb-4">Customers</span>
                        <div class="text-surface-900 dark:text-surface-0 font-medium text-xl">28441</div>
                    </div>
                    <div class="flex items-center justify-center bg-cyan-100 dark:bg-cyan-400/10 rounded-border" style="width: 2.5rem; height: 2.5rem">
                        <i class="pi pi-users text-cyan-500 !text-xl"></i>
                    </div>
                </div>
                <span class="text-primary font-medium">520 </span>
                <span class="text-muted-color">newly registered</span>
            </div>
        </div>
        <div class="col-span-12 lg:col-span-6 xl:col-span-3">
            <div class="card mb-0">
                <div class="flex justify-between mb-4">
                    <div>
                        <span class="block text-muted-color font-medium mb-4">Comments</span>
                        <div class="text-surface-900 dark:text-surface-0 font-medium text-xl">152 Unread</div>
                    </div>
                    <div class="flex items-center justify-center bg-purple-100 dark:bg-purple-400/10 rounded-border" style="width: 2.5rem; height: 2.5rem">
                        <i class="pi pi-comment text-purple-500 !text-xl"></i>
                    </div>
                </div>
                <span class="text-primary font-medium">85 </span>
                <span class="text-muted-color">responded</span>
            </div>
        </div>
        <div class="col-span-12">
          <div class="card">
        <Tabs value="0">
            <TabList>
                <Tab v-for="tab in tabs" :key="tab.title" :value="tab.value">{{ tab.title }}</Tab>
            </TabList>
            <TabPanels>
                <TabPanel v-for="tab in tabs" :key="tab.content" :value="tab.value">
                    <p class="m-0">{{ tab.content }}</p>
                </TabPanel>
            </TabPanels>
        </Tabs>
    </div>
        </div>



    </div>
</template>
