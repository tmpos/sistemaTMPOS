
<script setup>
import { ref, onMounted, nextTick, watchEffect } from 'vue';
import { useToast } from "primevue/usetoast";
import { useRouter, useRoute } from 'vue-router';
const router = useRouter();
const route = useRoute(); 
import { 
nfecha, 
arrayToObjetoFromTabla,
generarTablaFromStringJSON, 
peticionesFetch,
obtenerIdsSeleccionados, 
crearTablaSiNoExiste,
encryptarPassword,
peticionesFetchOffline,
buscadorArrayObjeto,
envioElectron,
generarCodigoUnico } from '@/funciones/funciones.js';
import Swal from 'sweetalert2'
const toast = useToast();
/************************************************************************/

/************************************************************************/
import flatPickr from 'vue-flatpickr-component';
import 'flatpickr/dist/flatpickr.css';
/************************************************************************/
  const basic = ref({
    dateFormat: 'd/m/Y',
  });
/************************************************************************/
import {useDatosEmpresa} from '@/stores'
const datosEmpresa = useDatosEmpresa();
const link = ref('');
const api = ref('');
const token = ref('');
const patronTelefono = ref('');
const linkImpresora = ref('');
const patroncedula = ref('');
const tokenCifrado = ref('');
const tokenCorto = ref('');
const datosJSON = ref([]);
/************************************************************************/
const datoscampos = ref({})
const codigoUnico = ref(generarCodigoUnico());
const fecha = ref(nfecha('fecha'));
const position = "top";
const todosLoscuadres = ref([]);
/************************************************************************/
const fetchAllData = async () => {
    const response = await peticionesFetchOffline('getDataAsArray', 'cuadres');
    const jsonData = response;
    todosLoscuadres.value = response;
    datoscampos.value = jsonData.find(datos=>datos.id == route.params.id)

};
/************************************************************************/
async function navigate(action) {

    const currentIndex = todosLoscuadres.value.findIndex(notacredito => notacredito.id == route.params.id);
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
            newIndex = currentIndex + 1 < todosLoscuadres.value.length ? currentIndex + 1 : currentIndex;
            break;
        case 'ultimo':
            newIndex = todosLoscuadres.value.length - 1;
            break;
        default:
            return;
    }
    datoscampos.value = todosLoscuadres.value[newIndex];
    router.push({ path: `/editarcuadres/${todosLoscuadres.value[newIndex].id}` });
    
}
/************************************************************************/
const datosConfig = async()=>{
    const response = await envioElectron('datosarchivo');
    datosJSON.value = response;
    link.value = datosJSON.value.VITE_LINKURL;
    api.value = datosJSON.value.VITE_LINK_API;
    token.value = datosJSON.value.VITE_TOKEN;
    patronTelefono.value = datosJSON.value.VITE_PATRON_TELEFONO;
    linkImpresora.value = datosJSON.value.VITE_IMPRESORA_LOCAL;
    tokenCorto.value = datosJSON.value.VITE_TOKEN_CORTO;
    patroncedula.value = datosJSON.value.VITE_PATRON_CEDULA;
}
/************************************************************************/
onMounted(async() => {
await datosConfig()
tokenCifrado.value = await encryptarPassword(token.value, 10);
await fetchAllData()
});
/************************************************************************/
async function funcionActualizar(e) {
  e.preventDefault();
  const url = link.value+api.value+"/actualizarcampos/cuadres";
  if (!datoscampos.value) {
    console.error("Datos incompletos, no se puede actualizar.");
    return;
  }
  if (datoscampos.value.hasOwnProperty('created_at')) {
      datoscampos.value.updated_at = nfecha('timestamp')
    }
  const datosEnviar = JSON.parse(JSON.stringify(datoscampos.value));
  const envioDatos = await peticionesFetchOffline('updateData','cuadres', JSON.stringify(datosEnviar));
  if (envioDatos[0] == 'ok') {
     toast.add({ severity: 'success', summary: 'Éxito', detail: 'Datos Actualizados', life: 3000 });
  }else{
    toast.add({ severity: 'error', summary: 'Error', detail: 'Fallo al actualizar los datos.', life: 3000 });
  }
}
/************************************************************************/
const fnCambiar = ()=>{
  if(datosEmpresa.usuario.nivel_seguridad === 'Soporte'){
      const estado = datoscampos.value.estado
      if(estado === 'CERRADO'){
        datoscampos.value.estado = 'ABIERTO'
      }else{
        datoscampos.value.estado = 'CERRADO'
      }

    }else{
       toast.add({ severity: 'error', summary: 'Error', detail: 'No tienes el Nivel de Seguridad para realizar el cambio', life: 3000 });
    }
}

/************************************************************************/
</script>
<template>
<main class="content-wrapper">
  <div class="w-full px-4 mt-5 card">
<Fieldset legend="Datos de Cuadres">


    <div class="flex space-x-2">
      
<Button as="router-link" icon="pi pi-home" to="/cuadres" />
<Button as="router-link" class="ms-1" icon="pi pi-plus-circle" to="/crearcuadres" />

    <Button
      icon="pi pi-trash"
      class="p-button-danger ms-1"
      title="Borrar Entrada"
      @click="borrarEntrada"
    />
    <Button
      icon="pi pi-step-backward"
      class="ms-1"
      title="Primero"
      @click="navigate('primero')"
    />
    <Button
      icon="pi pi-chevron-left"
      class="ms-1"
      title="Anterior"
      @click="navigate('anterior')"
    />
    <Button
      icon="pi pi-chevron-right"
      class="ms-1"
      title="Siguiente"
      @click="navigate('siguiente')"
    />
    <Button
      icon="pi pi-step-forward"
      class="ms-1"
      title="Ultimo"
      @click="navigate('ultimo')"
    />

    <Button
      icon="pi pi-save"
      class="ms-1"
      severity="contrast"
      @click="funcionActualizar"
    />

    <Button
      icon="pi pi-lock"
      class="ms-1"
      severity="contrast"
      @click="fnCambiar"
    />


    </div>


</Fieldset>
<section>
<Fieldset legend="Campos">
    <form id="formularioGenerar" action="" method="">
         <div class="box-body">
          <div class="grid grid-cols-12 gap-4 mt-4 text-blue-600" id="campos">

<div class="col-span-12">
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-400" for="estado">ESTADO</label>
                <InputText fluid type="text"  class=" " v-model="datoscampos.estado" name="estado" placeholder="estado" id="actualizartoken" readonly />
            </div>


<div class="col-span-12 sm:col-span-12 md:col-span-2 lg:col-span-2 xl:col-span-2 2xl:col-span-2">
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-400" for="token">TOKEN</label>
                <InputText fluid type="text"  class=" " v-model="datoscampos.token" name="token" placeholder="token" id="actualizartoken" />
            </div>

<div class="col-span-12 sm:col-span-12 md:col-span-2 lg:col-span-2 xl:col-span-2 2xl:col-span-2">
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-400" for="fecha">FECHA</label>
                <InputText fluid type="text"  class=" " v-model="datoscampos.fecha" name="fecha" placeholder="fecha" id="actualizarfecha" />
            </div>
<div class="col-span-12 sm:col-span-12 md:col-span-2 lg:col-span-2 xl:col-span-2 2xl:col-span-2">
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-400" for="fecha_inicio">FECHA_INICIO</label>
                <InputText fluid type="text"  class=" " v-model="datoscampos.fecha_inicio" name="fecha_inicio" placeholder="fecha_inicio" id="actualizarfecha_inicio" />
            </div>
<div class="col-span-12 sm:col-span-12 md:col-span-2 lg:col-span-2 xl:col-span-2 2xl:col-span-2">
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-400" for="fecha_fin">FECHA_FIN</label>
                <InputText fluid type="text"  class=" " v-model="datoscampos.fecha_fin" name="fecha_fin" placeholder="fecha_fin" id="actualizarfecha_fin" />
            </div>
<div class="col-span-12 sm:col-span-12 md:col-span-2 lg:col-span-2 xl:col-span-2 2xl:col-span-2">
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-400" for="cantidad_inicio">CANTIDAD_INICIO</label>
                <InputText fluid type="text"  v-decimales v-numeroFocusinOut v-solonumeros class=" " v-model="datoscampos.cantidad_inicio" name="cantidad_inicio" placeholder="cantidad_inicio" id="actualizarcantidad_inicio" />
            </div>
<div class="col-span-12 sm:col-span-12 md:col-span-2 lg:col-span-2 xl:col-span-2 2xl:col-span-2">
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-400" for="efectivo">EFECTIVO</label>
                <InputText fluid type="text"  v-decimales v-numeroFocusinOut v-solonumeros class=" " v-model="datoscampos.efectivo" name="efectivo" placeholder="efectivo" id="actualizarefectivo" />
            </div>
<div class="col-span-12 sm:col-span-12 md:col-span-2 lg:col-span-2 xl:col-span-2 2xl:col-span-2">
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-400" for="tarjeta">TARJETA</label>
                <InputText fluid type="text"  v-decimales v-numeroFocusinOut v-solonumeros class=" " v-model="datoscampos.tarjeta" name="tarjeta" placeholder="tarjeta" id="actualizartarjeta" />
            </div>
<div class="col-span-12 sm:col-span-12 md:col-span-2 lg:col-span-2 xl:col-span-2 2xl:col-span-2">
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-400" for="transferencia">TRANSFERENCIA</label>
                <InputText fluid type="text"  v-decimales v-numeroFocusinOut v-solonumeros class=" " v-model="datoscampos.transferencia" name="transferencia" placeholder="transferencia" id="actualizartransferencia" />
            </div>
<div class="col-span-12 sm:col-span-12 md:col-span-2 lg:col-span-2 xl:col-span-2 2xl:col-span-2">
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-400" for="otro">OTRO</label>
                <InputText fluid type="text"  v-decimales v-numeroFocusinOut v-solonumeros class=" " v-model="datoscampos.otro" name="otro" placeholder="otro" id="actualizarotro" />
            </div>
<div class="col-span-12 sm:col-span-12 md:col-span-2 lg:col-span-2 xl:col-span-2 2xl:col-span-2">
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-400" for="gastos">GASTOS</label>
                <InputText fluid type="text"  v-decimales v-numeroFocusinOut v-solonumeros class=" " v-model="datoscampos.gastos" name="gastos" placeholder="gastos" id="actualizargastos" />
            </div>
<div class="col-span-12 sm:col-span-12 md:col-span-2 lg:col-span-2 xl:col-span-2 2xl:col-span-2">
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-400" for="total">TOTAL</label>
                <InputText fluid type="text"  v-decimales v-numeroFocusinOut v-solonumeros class=" " v-model="datoscampos.total" name="total" placeholder="total" id="actualizartotal" />
            </div>
<div class="col-span-12 sm:col-span-12 md:col-span-2 lg:col-span-2 xl:col-span-2 2xl:col-span-2">
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-400" for="turno">TURNO</label>
                <InputText fluid type="text"  v-decimales v-numeroFocusinOut v-solonumeros class=" " v-model="datoscampos.turno" name="turno" placeholder="turno" id="actualizarturno" />
            </div>
<div class="col-span-12 sm:col-span-12 md:col-span-12 lg:col-span-12 xl:col-span-12 2xl:col-span-12">
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-400" for="nota">NOTA</label>
                   <Textarea fluid id="actualizarnota"  v-model="datoscampos.nota" name="nota" rows="3" class="form-textarea w-full " placeholder="Enter Nota"></textarea>
                </div>

        <div class="hidden col-span-12">
          <label for="created_at-Actualizador" class="block text-sm font-medium text-gray-700">CREATED_AT</label>
          <InputText v-model="datoscampos.created_at" name="created_at" id="created_at-Actualizador" placeholder="created_at" class="w-full" />
        </div>
        <div class="hidden col-span-12">
          <label for="updated_at-Actualizador" class="block text-sm font-medium text-gray-700">UPDATED_AT</label>
          <InputText v-model="datoscampos.updated_at" name="updated_at" id="updated_at-Actualizador" placeholder="updated_at" class="w-full" />
        </div>
        <div class="hidden col-span-12">
          <label for="usuario-Actualizador" class="block text-sm font-medium text-gray-700">USUARIO</label>
          <InputText v-model="datoscampos.usuario" name="usuario" id="usuario-Actualizador" placeholder="usuario" maxlength="250" class="w-full" />
        </div>

<div class="form-group col-span-12 mb-5 mt-5">
  <Button label="Actualizar" fluid  @click="funcionActualizar" autofocus />
</div>


  </div>
  </div>
   </form>
</Fieldset>
</section>
  </div>
   </main>
<Toast />
</template>
<style scoped>
</style>

