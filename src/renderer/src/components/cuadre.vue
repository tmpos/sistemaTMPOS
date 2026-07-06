<template>
  <div class="ticket" ref="ticketContent">
    <center id="top">
      <div class="logos" style="text-align: center;">
		    <div v-if="datosDefault.logo != 'True'">
		      <span style="font-size: 2rem; font-weight: bold;">{{ datosEmpresa.empresa.nombre }}</span>
		    </div>
		    <div v-else>
		      <img :src="datosEmpresa.empresa.logoprinter" alt="" style="max-width: 300px; width: 100%;">
		    </div>
      </div>
      <div class="info">
        <div v-if="datosDefault.direccion == 'True'">{{ datosEmpresa.empresa.direccion }}</div>
        <div v-if="datosDefault.telefono == 'True'">{{ datosEmpresa.empresa.telefono }} <span v-if="datosDefault.email == 'True'"> | {{ datosEmpresa.empresa.email }}</span></div>
        <div v-if="datosDefault.legal == 'True'">{{ datosEmpresa.empresa.rnc }}</div>
      </div>
    </center>

    <div style="margin-bottom: 5px;">
      <center>
        <h1 style="width: 100%; background-color: black; color: white; padding: 5px 0;">DATOS DE LA CAJA</h1>
      </center>
      <div class="contenedor">
        <div class="fila" v-for="(value, key) in cajaData" :key="key">
          <div class="columna">{{ key }}</div>
          <div class="columna">{{ value }}</div>
        </div>
      </div>
    </div>

    <div class="contenedor">
      <table>
        <tr v-for="(value, key) in financialData" :key="key">
          <td class="cantidad" width="20">{{ key }}:</td>
          <td class="cantidad2" width="20">{{ value }}</td>
        </tr>
      </table>
    </div>

    <div class="contenedor" style="margin-top:20px;padding: 40px;">
      <div style="display: flex; justify-content: center;">
        <div style="min-width: 300px; border-top: 1px solid #000; text-align: center;">
          Administrador
        </div>
      </div>
      <div style="text-align: center;">
        <center>
          <img :src="qrSrc" alt="" style="width: 200px; position: relative;">
        </center>
      </div>
    </div>
  </div>
</template>

<script setup>
import { defineProps, ref, onMounted } from 'vue';

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
  decimales,
  mensajetoast,
  formatearFecha,
  transformarFechaTimestamp,
  peticiones,
  lasMayusculas} from '../funciones/funciones.js';
  import bcrypt from 'bcryptjs';

/*******************************************/
import {useDatosEmpresa} from '../stores'
const datosEmpresa = useDatosEmpresa();
const link = ref(null);
const api = ref(null);
const token = ref(null);
const patronTelefono = ref(null);
const linkImpresora = ref(null);
const patroncedula = ref(null);
const tokenCifrado = ref(null);
const datosConfiguracion = ref({});
const datosDefault = JSON.parse(window.localStorage.getItem('configuracionfactura'));
/*******************************************/
onMounted(async()=>{
const datosJSON = await envioElectron('datosarchivo');
link.value = datosJSON.VITE_LINKURL;
api.value = datosJSON.VITE_LINK_API;
token.value = datosJSON.VITE_TOKEN;
patronTelefono.value = datosJSON.VITE_PATRON_TELEFONO;
linkImpresora.value = datosJSON.VITE_IMPRESORA_LOCAL;

tokenCifrado.value = await encryptarPassword(token.value, 10);
    if (!datosEmpresa.empresa.nombre) {
    await datosEmpresa.inicializarDatosEmpresa(link.value+api.value);
  }

datosConfiguracion.value = JSON.parse(window.localStorage.getItem('configuracion'))


})
/*******************************************/


const props = defineProps({
  cajaData: Object,
  financialData: Object,
  qrSrc: String
});

const ticketContent = ref(null);

const printTicket = () => {
  const printContents = ticketContent.value.innerHTML;
  const originalContents = document.body.innerHTML;
  document.body.innerHTML = printContents;
  window.print();
  document.body.innerHTML = originalContents; // Restaurar el contenido original
};

defineExpose({ printTicket });

</script>

<style scoped>
* {
  font-size: 12px;
  font-family: 'Arial';
}

@page {
  size: 80mm 297mm;
  margin: 0;
  -webkit-print-color-adjust: exact;
}

body {
  width: 80mm;
  margin: 10px;
  padding: 10px;
}

td, table {
  width: 500px;
}

.centrado {
  text-align: center;
  align-content: center;
}

.ticket {
  width: 80mm;
}

img {
  max-width: inherit;
  width: inherit;
}

.derecha {
  text-align: right;
}

.linea {
  width: 100%;
  border-top: 1px dashed #000;
  border-bottom: 1px dashed #000;
  padding-top: 5px;
  padding-bottom: 5px;
  margin-bottom: 5px;
  padding-right: 10px;
}

.cantidad, .cantidad2 {
  font-size: 1.5em;
}

.cantidad2 {
  font-weight: bold;
}

@media print {
  .oculto-impresion, .oculto-impresion * {
    display: none !important;
  }
}

.contenedor {
  display: flex;
  flex-wrap: wrap;
  border: 2px solid #000;
  border-radius: 5px;
  box-sizing: border-box;
}

.fila {
  display: flex;
  width: 100%;
  box-sizing: border-box;
}

.columna {
  flex: 1;
  padding: 10px;
  border-right: 1px solid #000;
  box-sizing: border-box;
}

.fila .columna:last-child {
  border-right: none;
}
</style>
