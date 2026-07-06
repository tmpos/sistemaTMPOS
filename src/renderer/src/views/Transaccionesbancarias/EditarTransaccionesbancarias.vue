<script setup>
import { ref, onMounted, nextTick, watchEffect } from 'vue';
import { useToast } from "primevue/usetoast";
import { useRouter, useRoute } from 'vue-router';
const router = useRouter();
const route = useRoute(); 
import { enviarDatosPorPost, eliminarDatos, obtenerIdsSeleccionados, borrarTodoslosDatos, lenguajeDataTable, nfecha, arrayToObjetoFromTabla, peticionesFetch, encryptarPassword, envioElectron, enviarSolicitudGet, generarCodigoUnico, peticiones, mensajetoast, lasMayusculas, peticionesFetchOffline, arrayToObjetoFromTablaOffline, crearTablaSiNoExisteOffline } from '../../funciones/funciones.js';
import Swal from 'sweetalert2'
const toast = useToast();
/************************************************************************/
/************************************************************************/
import {useDatosEmpresa} from '../../stores'
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
const position = "top";
/************************************************************************/
const datoscampos = ref({})
const codigoUnico = ref(generarCodigoUnico());
const fecha = ref(nfecha('fecha'));
const todosLosTransaccionesbancarias = ref([]);
/************************************************************************/
/************************************************************************/
const fetchAllData = async () => {
    const response = await peticionesFetchOffline('getDataAsArray', 'transaccionesbancarias');
    const jsonData = response;
    todosLosTransaccionesbancarias.value = jsonData;
    datoscampos.value = jsonData.find(datos=>datos.id == route.params.id)
};
/************************************************************************/
function navigate(action) {
    const currentIndex = todosLosTransaccionesbancarias.value.findIndex(transaccionesbancarias => transaccionesbancarias.id == route.params.id);
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
            newIndex = currentIndex + 1 < todosLosTransaccionesbancarias.value.length ? currentIndex + 1 : currentIndex;
            break;
        case 'ultimo':
            newIndex = todosLosTransaccionesbancarias.value.length - 1;
            break;
        default:
            return;
    }
    datoscampos.value = todosLosTransaccionesbancarias.value[newIndex];
    router.push({ path: `/editartransaccionesbancarias/${todosLosTransaccionesbancarias.value[newIndex].id}` });
}
/************************************************************************/
onMounted(async() => {
const datosJSON = await envioElectron('datosarchivo');
link.value = datosJSON.VITE_LINKURL;
api.value = datosJSON.VITE_LINK_API;
token.value = datosJSON.VITE_TOKEN;
patronTelefono.value = datosJSON.VITE_PATRON_TELEFONO;
linkImpresora.value = datosJSON.VITE_IMPRESORA_LOCAL;
patroncedula.value = datosJSON.VITE_PATRON_CEDULA;
tokenCifrado.value = await encryptarPassword(token.value, 10);
if (!datosEmpresa.empresa.nombre) {
    await datosEmpresa.inicializarDatosEmpresa(link.value+api.value);
  }
fetchAllData()
});
/************************************************************************/
async function funcionActualizar(e) {
  e.preventDefault();
  const url = link.value+api.value+"/actualizarcampos/transaccionesbancarias";
  if (!datoscampos.value) {
    console.error("Datos incompletos, no se puede actualizar.");
    return;
  }
  if (datoscampos.value.hasOwnProperty('created_at')) {
      datoscampos.value.updated_at = nfecha('timestamp')
    }
  const envioDatos = await peticionesFetchOffline('updateData', 'transaccionesbancarias', JSON.stringify(datoscampos.value));
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
          <legend class="float-none w-auto px-2">Datos de Transaccionesbancarias</legend>
    <div class="grid grid-cols-12 gap-4">
      <div class="sm:col-span-12">
       <router-link to="/transaccionesbancarias" class="btn btn-dark text-white "><i class="icon-home"></i></router-link>
<router-link to="/creartransaccionesbancarias" class="btn btn-success text-white ms-1"><i class="icon-plus"></i></router-link>
<a href="#" class="btn btn-danger btnaccion cartelito ms-1" data-toggle="tooltip" title="Borrar Entrada" id="borrador"><i class="icon-trash-4"></i></a>
<a href="#" @click="navigate('primero')" class="btn btn-dark text-white ms-1" title="Primero"><i class="icon-to-start-alt"></i></a>
<a href="#" @click="navigate('anterior')" class="btn btn-dark text-white ms-1" title="Anterior"><i class="icon-left-dir"></i></a>
<a href="#" @click="navigate('siguiente')" class="btn btn-dark text-white ms-1" title="Siguiente"><i class="icon-right-dir"></i></a>
<a href="#" @click="navigate('ultimo')" class="btn btn-dark text-white ms-1" title="Ultimo"><i class="icon-to-end-alt"></i></a>
      </div>
    </div>
</fieldset>
<section>
<fieldset class="border p-3 rounded mb-2">
  <legend class="float-none w-auto px-2">Campos</legend>
    <form id="formularioActualizar" action="" method="">
         <div class="box-body">
          <div class="grid grid-cols-12 gap-4" id="campos">
<div class="form-group col-span-12 sm:col-span-12 md:col-span-12 lg:col-span-12 xl:col-span-12" hidden>
<label for="id-Actualizador">ID</label>
<input type="input" v-model="datoscampos.id" name="id"  class="form-control" id="id-Actualizador"  placeholder="id"  maxlength="11">
</div>
<div class="form-group col-span-12 sm:col-span-12 md:col-span-12 lg:col-span-12 xl:col-span-12" hidden>
<label for="id-Actualizador">ID</label>
<input type="input" v-model="datoscampos.id" name="id"  class="form-control" id="id-Actualizador"  placeholder="id"  maxlength="11">
</div>
<div class="form-group col-span-12 sm:col-span-6 md:col-span-6 lg:col-span-6 xl:col-span-6" >
<label for="cuenta-Actualizador">CUENTA</label>
<input type="input" v-model="datoscampos.cuenta" name="cuenta"  class="form-control" id="cuenta-Actualizador"  placeholder="cuenta" v-solonumeros maxlength="250">
</div>
<div class="form-group col-span-12 sm:col-span-3 md:col-span-3 lg:col-span-3 xl:col-span-3" >
<label for="monto-Actualizador">MONTO</label>
<input type="input" v-model="datoscampos.monto" name="monto"  class="form-control" id="monto-Actualizador"  placeholder="monto" v-solonumeros maxlength="250">
</div>
<div class="form-group col-span-12 sm:col-span-3 md:col-span-3 lg:col-span-3 xl:col-span-3" >
<label for="tipo-Actualizador">TIPO</label>
<select class="form-control " id="tipo-Actualizador" v-model="datoscampos.tipo" name="tipo" >
  <option value="DEPOSITO">DEPOSITO</option>
<option value="RETIRO">RETIRO</option>
<option value="TRANSFERENCIA">TRANSFERENCIA</option>
<option value="OTRO">OTRO</option>
</select></div>
<div class="form-group col-span-12 sm:col-span-4 md:col-span-4 lg:col-span-4 xl:col-span-4" >
<label for="balance_anterior-Actualizador">BALANCE_ANTERIOR</label>
<input type="input" v-model="datoscampos.balance_anterior" name="balance_anterior"  class="form-control" id="balance_anterior-Actualizador"  placeholder="balance_anterior" v-solonumeros maxlength="250">
</div>
<div class="form-group col-span-12 sm:col-span-4 md:col-span-4 lg:col-span-4 xl:col-span-4" >
<label for="balance_actual-Actualizador">BALANCE_ACTUAL</label>
<input type="input" v-model="datoscampos.balance_actual" name="balance_actual"  class="form-control" id="balance_actual-Actualizador"  placeholder="balance_actual" v-solonumeros maxlength="250">
</div>
<div class="form-group col-span-12 sm:col-span-4 md:col-span-4 lg:col-span-4 xl:col-span-4" >
<label for="metodo-Actualizador">METODO</label>
<select class="form-control " id="metodo-Actualizador" v-model="datoscampos.metodo" name="metodo" >
  <option value="TRANSFERENCIA">TRANSFERENCIA</option>
<option value="EFECTIVO">EFECTIVO</option>
<option value="CHEQUE">CHEQUE</option>
<option value="OTRO">OTRO</option>
</select></div>
<div class="form-group col-span-12 sm:col-span-12 md:col-span-12 lg:col-span-12 xl:col-span-12" >
<label for="descripcion-Actualizador">DESCRIPCION</label>
<textarea class="form-control " id="descripcion-Actualizador" name="descripcion" v-model="datoscampos.descripcion" cols="30" rows="3" ></textarea>
</div>
<div class="form-group col-span-12 sm:col-span-12 md:col-span-12 lg:col-span-12 xl:col-span-12" >
<label for="persona-Actualizador">PERSONA</label>
<input type="input" v-model="datoscampos.persona" name="persona"  class="form-control" id="persona-Actualizador"  placeholder="persona" v-mayuscula maxlength="250">
</div>
<div class="form-group col-span-12 sm:col-span-4 md:col-span-4 lg:col-span-4 xl:col-span-4" >
<label for="fecha-Actualizador">FECHA</label>
<input type="input" v-model="datoscampos.fecha" name="fecha"  class="form-control" id="fecha-Actualizador"  placeholder="fecha"  maxlength="250">
</div>
<div class="form-group col-span-12 sm:col-span-4 md:col-span-4 lg:col-span-4 xl:col-span-4" >
<label for="hora-Actualizador">HORA</label>
<input type="input" v-model="datoscampos.hora" name="hora"  class="form-control" id="hora-Actualizador"  placeholder="hora"  maxlength="250">
</div>
<div class="form-group col-span-12 sm:col-span-4 md:col-span-4 lg:col-span-4 xl:col-span-4" >
<label for="estado-Actualizador">ESTADO</label>
<select class="form-control " id="estado-Actualizador" v-model="datoscampos.estado" name="estado" >
  <option value="COMPLETADA">COMPLETADA</option>
<option value="PENDIENTE">PENDIENTE</option>
<option value="FALLIDA">FALLIDA</option>
<option value="OTRO">OTRO</option>
</select></div>
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
</fieldset>
</section>
  </div>
   </main>
<Toast />
</template>
<style>
</style>
