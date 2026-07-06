<script setup>
import { ref, onMounted, nextTick, watchEffect } from 'vue';
import { useRoute} from 'vue-router';
import { useToast } from "primevue/usetoast";
import router from '../../router';
const route = useRoute(); 
import { enviarDatosPorPost, eliminarDatos, obtenerIdsSeleccionados, borrarTodoslosDatos, lenguajeDataTable, nfecha, arrayToObjetoFromTabla, peticionesFetch, encryptarPassword, envioElectron, enviarSolicitudGet, generarCodigoUnico, mensajetoast, lasMayusculas, peticionesFetchOffline, arrayToObjetoFromTablaOffline, crearTablaSiNoExisteOffline } from '../../funciones/funciones.js';
import Swal from 'sweetalert2'
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
const tokenCifrado = ref(null);
/************************************************************************/
document.body.classList.add('sidebar-close');
/************************************************************************/
const datoscampos = ref({})
const codigoUnico = ref(generarCodigoUnico());
const fecha = ref(nfecha('fecha'));
const todosLosDevoluciones = ref([]);
/************************************************************************/
/************************************************************************/
const fetchAllData = async () => {
    const response = await peticionesFetchOffline('getDataAsArray', 'devoluciones');
    const jsonData = response;
    todosLosDevoluciones.value = jsonData;
    datoscampos.value = jsonData.find(datos=>datos.id == route.params.id)
};
/************************************************************************/
function navigate(action) {
    const currentIndex = todosLosDevoluciones.value.findIndex(devoluciones => devoluciones.id == route.params.id);
    if (currentIndex === -1) return;
    let newIndex;
    switch (action) {
        case 'primero':
            newIndex = 0;
            break;
        case 'anterior':
            newIndex = currentIndex > 0 ? currentIndex - 1 : 0;
            break;
        case 'siguiente':
            newIndex = currentIndex + 1 < todosLosDevoluciones.value.length ? currentIndex + 1 : currentIndex;
            break;
        case 'ultimo':
            newIndex = todosLosDevoluciones.value.length - 1;
            break;
        default:
            return;
    }
    datoscampos.value = todosLosDevoluciones.value[newIndex];
    router.push({ path: `/editardevoluciones/${todosLosDevoluciones.value[newIndex].id}` });
}
/************************************************************************/
onMounted(async() => {
if (!datosEmpresa.empresa.nombre) {
    await datosEmpresa.inicializarDatosEmpresa(link.value+api.value);
  }
if (production == 'false') {
const datosJSON = await envioElectron('datosarchivo');
link.value = datosJSON.VITE_LINKURL;
api.value = datosJSON.VITE_LINK_API;
token.value = datosJSON.VITE_TOKEN;
patronTelefono.value = datosJSON.VITE_PATRON_TELEFONO;
linkImpresora.value = datosJSON.VITE_IMPRESORA_LOCAL;
patroncedula.value = datosJSON.VITE_PATRON_CEDULA;
}
tokenCifrado.value = await encryptarPassword(token.value, 10);
fetchAllData()
});
/************************************************************************/
async function funcionActualizar(e) {
  e.preventDefault();
  const url = link.value+api.value+"/actualizarcampos/devoluciones";
  if (!datoscampos.value) {
    console.error("Datos incompletos, no se puede actualizar.");
    return;
  }
  if (datoscampos.value.hasOwnProperty('created_at')) {
      datoscampos.value.updated_at = nfecha('timestamp')
    }
  const envioDatos = await peticionesFetchOffline('updateData', 'devoluciones', JSON.stringify(datoscampos.value));
  if (envioDatos[0] == 'ok') {
     toast.add({ severity: 'success', summary: 'Éxito', detail: 'Datos Actualizados', life: 3000 });
  }else{
    toast.add({ severity: 'error', summary: 'Error', detail: 'Fallo al actualizar los datos.', life: 3000 });
  }
}
/************************************************************************/
</script>
<template>
<main class="content-wrapper">
  <div class="w-full px-4 mt-5">
        <fieldset class="border p-3 rounded mb-2">
          <legend class="float-none w-auto px-2">Datos de Devoluciones</legend>
    <div class="grid grid-cols-12 gap-4">
      <div class="sm:col-span-12">
       <router-link to="/devoluciones" class="btn btn-dark text-white "><i class="icon-home"></i></router-link>
<router-link to="/creardevoluciones" class="btn btn-success text-white ms-1"><i class="icon-plus"></i></router-link>
<a href="#" class="btn btn-danger btnaccion cartelito ms-1" data-toggle="tooltip" title="Borrar Entrada" id="borrador"><i class="icon-trash-4"></i></a>
<a href="#" @click="navigate('primero')" class="btn btn-dark text-white ms-1" title="Primero"><i class="icon-to-start-alt"></i></a>
<a href="#" @click="navigate('anterior')" class="btn btn-dark text-white ms-1" title="Anterior"><i class="icon-left-dir"></i></a>
<a href="#" @click="navigate('siguiente')" class="btn btn-dark text-white ms-1" title="Siguiente"><i class="icon-right-dir"></i></a>
<a href="#" @click="navigate('ultimo')" class="btn btn-dark text-white ms-1" title="Ultimo"><i class="icon-to-end-alt"></i></a>
      </div>
    </div>
</fieldset>
<section>
    <form id="formularioActualizar" action="" method="">
         <div class="box-body">
          <div class="grid grid-cols-12 gap-4" id="campos">
<div class="form-group col-span-12" hidden>
<label for="id-Actualizador">ID</label>
<input type="input" v-model="datoscampos.id" name="id"  class="form-control" id="id-Actualizador" readonly placeholder="id"  maxlength="11">
</div>
<div class="form-group col-span-12 sm:col-span-3 md:col-span-3 lg:col-span-3 xl:col-span-3" >
<label for="no_emision-Actualizador">NO_EMISION</label>
<input type="input" v-model="datoscampos.no_emision" name="no_emision"  class="form-control" id="no_emision-Actualizador"  placeholder="no_emision"  maxlength="250">
</div>
<div class="form-group col-span-12 sm:col-span-3 md:col-span-3 lg:col-span-3 xl:col-span-3" >
<label for="no_factura-Actualizador">NO_FACTURA</label>
<input type="input" v-model="datoscampos.no_factura" name="no_factura"  class="form-control" id="no_factura-Actualizador"  placeholder="no_factura"  maxlength="250">
</div>
<div class="form-group col-span-12 sm:col-span-3 md:col-span-3 lg:col-span-3 xl:col-span-3" >
<label for="fecha-Actualizador">FECHA</label>
<input type="input" v-model="datoscampos.fecha" name="fecha"  class="form-control" id="fecha-Actualizador"  placeholder="fecha"  maxlength="250">
</div>
<div class="form-group col-span-12 sm:col-span-3 md:col-span-3 lg:col-span-3 xl:col-span-3" >
<label for="hora-Actualizador">HORA</label>
<input type="input" v-model="datoscampos.hora" name="hora"  class="form-control" id="hora-Actualizador"  placeholder="hora"  maxlength="250">
</div>
<div class="form-group col-span-12 sm:col-span-8 md:col-span-8 lg:col-span-8 xl:col-span-8" >
<label for="nombre_cliente-Actualizador">NOMBRE_CLIENTE</label>
<input type="input" v-model="datoscampos.nombre_cliente" name="nombre_cliente"  class="form-control" id="nombre_cliente-Actualizador"  placeholder="nombre_cliente"  maxlength="250">
</div>
<div class="form-group col-span-12 sm:col-span-4 md:col-span-4 lg:col-span-4 xl:col-span-4" >
<label for="cedula_cliente-Actualizador">CEDULA_CLIENTE</label>
<input type="input" v-model="datoscampos.cedula_cliente" name="cedula_cliente"  class="form-control" id="cedula_cliente-Actualizador"  placeholder="cedula_cliente"  maxlength="250">
</div>
<div class="form-group col-span-12 sm:col-span-12 md:col-span-12 lg:col-span-12 xl:col-span-12" >
<label for="productos-Actualizador">PRODUCTOS</label>
<textarea class="form-control " id="productos-Actualizador" name="productos" v-model="datoscampos.productos" cols="30" rows="3" ></textarea>
</div>
<div class="form-group col-span-12 sm:col-span-4 md:col-span-4 lg:col-span-4 xl:col-span-4" >
<label for="subtotal-Actualizador">SUBTOTAL</label>
<input type="input" v-model="datoscampos.subtotal" name="subtotal"  class="form-control" id="subtotal-Actualizador"  placeholder="subtotal"  maxlength="250">
</div>
<div class="form-group col-span-12 sm:col-span-4 md:col-span-4 lg:col-span-4 xl:col-span-4" >
<label for="impuestos-Actualizador">IMPUESTOS</label>
<input type="input" v-model="datoscampos.impuestos" name="impuestos"  class="form-control" id="impuestos-Actualizador"  placeholder="impuestos"  maxlength="250">
</div>
<div class="form-group col-span-12 sm:col-span-4 md:col-span-4 lg:col-span-4 xl:col-span-4" >
<label for="total-Actualizador">TOTAL</label>
<input type="input" v-model="datoscampos.total" name="total"  class="form-control" id="total-Actualizador"  placeholder="total"  maxlength="250">
</div>
<div class="form-group col-span-12 sm:col-span-12 md:col-span-12 lg:col-span-12 xl:col-span-12" >
<label for="nota-Actualizador">NOTA</label>
<textarea class="form-control " id="nota-Actualizador" name="nota" v-model="datoscampos.nota" cols="30" rows="3" ></textarea>
</div>
<div class="form-group col-span-12 sm:col-span-4 md:col-span-4 lg:col-span-4 xl:col-span-4" >
<label for="cantidad-Actualizador">CANTIDAD</label>
<input type="input" v-model="datoscampos.cantidad" name="cantidad"  class="form-control" id="cantidad-Actualizador"  placeholder="cantidad" v-solonumeros maxlength="250">
</div>
<div class="form-group col-span-12 sm:col-span-4 md:col-span-4 lg:col-span-4 xl:col-span-4" >
<label for="turno-Actualizador">TURNO</label>
<input type="input" v-model="datoscampos.turno" name="turno"  class="form-control" id="turno-Actualizador"  placeholder="turno"  maxlength="250">
</div>
<div class="form-group col-span-12 sm:col-span-4 md:col-span-4 lg:col-span-4 xl:col-span-4" >
<label for="cajero-Actualizador">CAJERO</label>
<input type="input" v-model="datoscampos.cajero" name="cajero"  class="form-control" id="cajero-Actualizador"  placeholder="cajero"  maxlength="250">
</div>
<div class="form-group col-span-12 sm:col-span-12 md:col-span-12 lg:col-span-12 xl:col-span-12" >
<label for="descripcion-Actualizador">DESCRIPCION</label>
<textarea class="form-control " id="descripcion-Actualizador" name="descripcion" v-model="datoscampos.descripcion" cols="30" rows="3" ></textarea>
</div>
<div class="form-group col-span-12 sm:col-span-6 md:col-span-6 lg:col-span-6 xl:col-span-6" >
<label for="mes-Actualizador">MES</label>
<input type="input" v-model="datoscampos.mes" name="mes"  class="form-control" id="mes-Actualizador"  placeholder="mes"  maxlength="250">
</div>
<div class="form-group col-span-12 sm:col-span-6 md:col-span-6 lg:col-span-6 xl:col-span-6" >
<label for="year-Actualizador">YEAR</label>
<input type="input" v-model="datoscampos.year" name="year"  class="form-control" id="year-Actualizador"  placeholder="year"  maxlength="250">
</div>
<div class="form-group col-span-6" hidden>
<label for="created_at-Actualizador">CREATED_AT</label>
<input type="input" v-model="datoscampos.created_at" name="created_at"  class="form-control" id="created_at-Actualizador"  placeholder="created_at"  maxlength="">
</div>
<div class="form-group col-span-6" hidden>
<label for="updated_at-Actualizador">UPDATED_AT</label>
<input type="input" v-model="datoscampos.updated_at" name="updated_at"  class="form-control" id="updated_at-Actualizador"  placeholder="updated_at"  maxlength="">
</div>
<div class="form-group col-span-12" hidden>
<label for="usuario-Actualizador">USUARIO</label>
<input type="input" v-model="datoscampos.usuario" name="usuario"  class="form-control" id="usuario-Actualizador"  placeholder="usuario"  maxlength="250">
</div>
<div class="form-group sm:col-span-12 mb-5 mt-5">
<button type="submit" @click="funcionActualizar" class="btn btn-primary elboton w-100">Actualizar Datos</button>
  </div>
  </div>
  </div>
   </form>
</section>
  </div>
   </main>
<Toast />
</template>
<style>
</style>
