<script setup>
import { ref, onMounted, nextTick, watchEffect } from 'vue';
import router from '../../router';
import axios from 'axios';
import { useRoute} from 'vue-router';
import DataTable from 'datatables.net-vue3';
import 'datatables.net-responsive-bs5';
import DataTablesCore from 'datatables.net-bs5';
import 'datatables.net-select';
import 'datatables.net-responsive';
import 'datatables.net-buttons';
import 'datatables.net-buttons/js/buttons.html5';
import jszip from 'jszip';
import pdfmake from 'pdfmake';
/*********************************************************/
const route = useRoute(); 
/*********************************************************/
DataTable.use(DataTablesCore);
DataTablesCore.Buttons.jszip(jszip);
DataTablesCore.Buttons.pdfMake(pdfmake);
/*********************************************************/

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
  mensajetoast,
  peticiones,
  lasMayusculas} from '../../funciones/funciones.js';
  import bcrypt from 'bcryptjs';
import Swal from 'sweetalert2'
import { useToast } from "primevue/usetoast";
const toast = useToast();
/************************************************************************/
import config from '../../../../../resources/config.json';
/************************************************************************/
import {useDatosEmpresa} from '../../stores'
const datosEmpresa = useDatosEmpresa();
const production = config.VITE_PRODUCTION;
const link = ref(config.VITE_LINKURL);
const api = ref(config.VITE_LINK_API);
const token = ref(config.VITE_TOKEN);
const patronTelefono = ref(config.VITE_PATRON_TELEFONO);
const linkImpresora = ref(config.VITE_IMPRESORA_LOCAL);
const patroncedula = ref(config.VITE_PATRON_CEDULA);
const tokenCifrado = ref(null);
/************************************************************************/
const dataFacturas = ref([])
/************************************************************************/
const fechaInicio = ref(nfecha('timestamp'))
const fechaFin = ref(nfecha('timestamp'))
/************************************************************************/
document.body.classList.add('sidebar-close');
/************************************************************************/
watchEffect(() => {
    //Aqui para vigilar eventos
});
/************************************************************************/
const fetchAndSetupDataFacturas = async () => {
const response = await peticionesFetch(`${link.value}${api.value}`,`datostimestamp`,{'tabla':'facturas','campo':'created_at','fechainicio':fechaInicio.value,'fechafin':fechaFin.value},tokenCifrado.value,'POST');
    const jsonData = response.map(factura=>{
      return {"no_cliente":factura.cod_cliente,"nombre_cliente":factura.nombre_cliente,"fecha":factura.fecha_emision,"ncf":factura.comprobante,"forma_pago":factura.metodo_pago,"rnc_cedula":factura.nombre_cliente,"no_factura":factura.no_factura,"venta_exenta":"0.00","venta_grabado":"0.00","venta_grabado_18_sin_itbis":"0.00","venta_grabado_16_sin_itbis":"0.00","total_itbis_18":factura.impuesto,"total_itbis_16":"0.00","total_itbis":factura.impuesto,"venta_total":factura.total}
    });
    console.log("response", response);
    dataFacturas.value = jsonData.slice(-10).reverse();

};
/************************************************************************/
onMounted(async() => {
if (production == 'false') {
const datosJSON = await envioElectron('datosarchivo');
link.value = datosJSON.VITE_LINKURL;
api.value = datosJSON.VITE_LINK_API;
token.value = datosJSON.VITE_TOKEN;
patronTelefono.value = datosJSON.VITE_PATRON_TELEFONO;
linkImpresora.value = datosJSON.VITE_IMPRESORA_LOCAL;
}
tokenCifrado.value = await encryptarPassword(token.value, 10);
    if (!datosEmpresa.empresa.nombre) {
    await datosEmpresa.inicializarDatosEmpresa(link.value+api.value);
  }

const fechaArray = route.params.fecha.split('AND')
fechaInicio.value = fechaArray[0];
fechaFin.value = fechaArray[1];

await fetchAndSetupDataFacturas();

});
/************************************************************************/
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

{ data: "no_cliente", title:"no_cliente"},
{ data: "nombre_cliente", title:"nombre_cliente"},
{ data: "fecha", title:"fecha"},
{ data: "ncf", title:"ncf"},
{ data: "forma_pago", title:"forma_pago"},
{ data: "rnc_cedula", title:"rnc_cedula"},
{ data: "no_factura", title:"no_factura"},
{ data: "venta_exenta", title:"venta_exenta"},
{ data: "venta_grabado", title:"venta_grabado"},
{ data: "venta_grabado_18_sin_itbis", title:"venta_grabado_18_sin_itbis"},
{ data: "venta_grabado_16_sin_itbis", title:"venta_grabado_16_sin_itbis"},
{ data: "total_itbis_18", title:"total_itbis_18"},
{ data: "total_itbis_16", title:"total_itbis_16"},
{ data: "total_itbis", title:"total_itbis"},
{ data: "venta_total", title:"venta_total"}



]);
/************************************************************************/
const optionsFacturas = ref({
  responsive: true,
  "processing": true,
  dom: `
    <'row'<'col-sm-12 col-md-6'B><'col-sm-12 col-md-6'f>>
    <'row'<'col-sm-12'tr>>
    <'row'<'col-sm-12 col-md-5'i><'col-sm-12 col-md-7'p>>
  `,

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

/************************************************************************/

  }
});
/************************************************************************/
</script>
<template>
<main class="content-wrapper">
  <div class="w-full px-4 mt-5">
    <div class="grid grid-cols-12 gap-4">
      <div class="md:col-span-12">
        <fieldset class="border p-3 rounded mb-2">
          <legend class="float-none w-auto px-2">Datos de Informe607</legend>
            <div class="grid grid-cols-12 gap-4">
              <div class="sm:col-span-12">
              <Card class="mt-2">
                     <template #content>
<DataTable :options="optionsFacturas"  :data="dataFacturas" class="display table dt-responsive" id="tablaFactura" />
                     </template>
              </Card>
              </div>
            </div>
        </fieldset>
      </div>
<Toast />
  </div>
  </div>
</main>
</template>
<style scoped>
</style>
