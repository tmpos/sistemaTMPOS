<template>
  <Dialog v-model:visible="visiblecrear" :position="position" modal header="Crear Gastos" :style="{ width: '50rem' }" :breakpoints="{ '1199px': '75vw', '575px': '90vw' }">
    <template #header>
      <div class="inline-flex align-items-center justify-content-center gap-2">
        <span class="font-bold white-space-nowrap">Modal Crear</span>
      </div>
    </template>
    <fieldset class="border p-3 rounded mb-2">
      <legend class="float-none w-auto px-2">Gastos</legend>
      <form id="formularioActualizarGastos" action="" method="">
        <div style="margin-top: 15px;color: #34AAB2;" class="row">
          <div class="form-group col-12">
            <label for="cajeroAgregarDatos">CAJERO</label>
            <input type="input" v-model="datoscamposGastos.cajero" name="cajero" class="form-control" id="cajeroAgregarDatos" placeholder="cajero" maxlength="">
          </div>
          <div class="form-group col-12 col-sm-4 col-md-4 col-lg-4 col-xl-4">
            <label for="cantidadAgregarDatos">CANTIDAD</label>
            <input type="input" v-model="datoscamposGastos.cantidad" name="cantidad" class="form-control soloNumero" id="cantidadAgregarDatos" v-solonumeros v-numeroFocusinOut v-decimales placeholder="cantidad" maxlength="250">
          </div>
          <div class="form-group col-12 col-sm-4 col-md-4 col-lg-4 col-xl-4">
            <label for="fechaAgregarDatos">FECHA</label>
            <input type="input" v-model="datoscamposGastos.fecha" name="fecha" class="form-control" id="fechaAgregarDatos" placeholder="fecha" maxlength="250">
          </div>
          <div class="form-group col-12 col-sm-4 col-md-4 col-lg-4 col-xl-4">
            <label for="horaAgregarDatos">HORA</label>
            <input type="input" v-model="datoscamposGastos.hora" name="hora" class="form-control" id="horaAgregarDatos" placeholder="hora" maxlength="250">
          </div>
          <div class="form-group col-12 col-sm-12 col-md-12 col-lg-12 col-xl-12" hidden>
            <label for="turnoAgregarDatos">TURNO</label>
            <input type="input" v-model="datoscamposGastos.turno" name="turno" class="form-control" id="turnoAgregarDatos" placeholder="turno" maxlength="250">
          </div>
          <div class="form-group col-12 col-sm-12 col-md-12 col-lg-12 col-xl-12">
            <label for="descripcionAgregarDatos">DESCRIPCION</label>
            <textarea class="form-control" v-model="datoscamposGastos.descripcion" id="descripcionAgregarDatos" name="descripcion" cols="30" rows="3"></textarea>
          </div>
          <div class="form-group col-12 col-sm-6 col-md-6 col-lg-6 col-xl-6" hidden>
            <label for="mesAgregarDatos">MES</label>
            <input type="input" v-model="datoscamposGastos.mes" name="mes" class="form-control" id="mesAgregarDatos" placeholder="mes" maxlength="250">
          </div>
          <div class="form-group col-12 col-sm-6 col-md-6 col-lg-6 col-xl-6" hidden>
            <label for="yearAgregarDatos">YEAR</label>
            <input type="input" v-model="datoscamposGastos.year" name="year" class="form-control" id="yearAgregarDatos" placeholder="year" maxlength="250">
          </div>
          <div class="form-group col-12" hidden>
            <label for="usuarioAgregarDatos">USUARIO</label>
            <input type="input" v-model="datoscamposGastos.usuario" name="usuario" class="form-control" id="usuarioAgregarDatos" placeholder="usuario" maxlength="250">
          </div>
        </div>
      </form>
    </fieldset>
    <template #footer>
     <Button label="Ultimo" icon="pi pi-print" outlined severity="secondary" @click="imprimirUltimoGasto" autofocus />
      <Button label="Cancel" text severity="secondary" @click="visiblecrear = false" autofocus />
      <Button label="Crear" outlined severity="secondary" @click="funcionCrear" autofocus />
    </template>
  </Dialog>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';
import Swal from 'sweetalert2';
import { useToast } from "primevue/usetoast";
import { enviarDatosPorPost, arrayToObjetoFromTabla,enviarDatosLocalStorage, encryptarPassword, nfecha, peticiones, envioElectron } from '../funciones/funciones.js';
import config from '../../../../resources/config.json';
import { useDatosEmpresa } from '../stores';

/**************************************************/
const toast = useToast();
const datosEmpresa = useDatosEmpresa();

/**************************************************/
const visiblecrear = ref(false);
const position = ref('center');
const datoscamposGastos = ref({});
const production = 'false';
const link = ref('');
const api = ref('');
const token = ref('');
const tokenCifrado = ref(null);
/**************************************************/
const usuarioLocal = ref({})
/**************************************************/
async function campos() {
  const campos = await arrayToObjetoFromTabla(link.value + api.value, tokenCifrado.value, 'gastos', true);
  datoscamposGastos.value = campos;
}

/**************************************************/
async function funcionCrear() {
  const url = link.value + api.value + "/insertar/gastos";
  if (datoscamposGastos.value.hasOwnProperty('created_at')) {
    datoscamposGastos.value.created_at = nfecha('timestamp');
    datoscamposGastos.value.updated_at = nfecha('timestamp');
  }
  const envioDatos = await enviarDatosPorPost(url, datoscamposGastos.value, tokenCifrado.value);
  if (envioDatos[0] == 'ok') {
    toast.add({ severity: 'success', summary: 'Éxito', detail: 'Datos Agregados', life: 3000 });
    limpiarCamposCrear();
    visiblecrear.value = false;
  } else {
    toast.add({ severity: 'error', summary: 'Error', detail: 'Fallo al Agregar los datos.', life: 3000 });
  }
}
/**************************************************/

onMounted(async () => {
  if (production == 'false') {
    const datosJSON = await envioElectron('datosarchivo');
    link.value = datosJSON.VITE_LINKURL;
    api.value = datosJSON.VITE_LINK_API;
    token.value = datosJSON.VITE_TOKEN;
  }
  tokenCifrado.value = await encryptarPassword(token.value, 10);
  if (!datosEmpresa.empresa.nombre) {
    await datosEmpresa.inicializarDatosEmpresa(link.value + api.value);
  }
  await campos();
  usuarioLocal.value = JSON.parse(window.localStorage.getItem('usuarioLocal'))[0];
});

/***************************************************************/
watch(() => visiblecrear.value, (newVal) => {
  if (newVal) {
    datoscamposGastos.value.fecha = nfecha('fecha');
    datoscamposGastos.value.hora = nfecha('hora');
    datoscamposGastos.value.cantidad = '0.00';
    datoscamposGastos.value.mes = nfecha('mes');
    datoscamposGastos.value.year = nfecha('year');
    datoscamposGastos.value.turno = usuarioLocal.value.token;
  }
});
/***************************************************************/

/***************************************************************/
const imprimirUltimoGasto = async () => {
  const ultimoRegistro = await peticiones(link.value + api.value + '/ultimosx/gastos/1', {}, 'GET', tokenCifrado.value);
  if (ultimoRegistro) {
/*    const impresionpagina = `${link.value}/vista/gastosTermica.php?id=${ultimoRegistro[0].id}`;
    window.electron.ipcRenderer.invoke('open-new-window', impresionpagina, 'url');*/

        const datosEnviar = JSON.stringify(ultimoRegistro[0])
        const datosEmpresaLoL = JSON.stringify(enviarDatosLocalStorage() )
        window.electron.ipcRenderer.invoke('gasto',datosEnviar,datosEmpresaLoL);


  } else {
    toast.add({ severity: 'error', summary: 'Error', detail: 'Error de Peticion.', life: 3000 });
  }
}
/***************************************************************/
async function limpiarCamposCrear() {
  datoscamposGastos.value = {}
  await campos();
}
/***************************************************************/
</script>

<style scoped>
/* Your styles here */
</style>
