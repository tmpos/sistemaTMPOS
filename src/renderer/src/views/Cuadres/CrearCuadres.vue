
<script setup>
import { ref, onMounted, nextTick, watchEffect } from 'vue';
import { useToast } from "primevue/usetoast";
import { useRouter, useRoute } from 'vue-router';
const router = useRouter();
const route = useRoute(); 
import { 
nfecha, 
arrayToObjetoFromTabla, 
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
import TablaJSON from '@/components/TablaJSON.vue'

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
const datoscamposCuadres = ref({})
const codigoUnico = ref(generarCodigoUnico());
const fecha = ref(nfecha('fecha'));
const position = "top";
/************************************************************************/
async function campos() {
  const campos = await arrayToObjetoFromTabla('cuadres');
  datoscamposCuadres.value = campos;
  datoscamposCuadres.value.estado = 'ABIERTO';
  datoscamposCuadres.value.turno = datosEmpresa.usuario.nombre
  datoscamposCuadres.value.token = generarCodigoUnico()
  datoscamposCuadres.value.fecha = nfecha('fecha')
  datoscamposCuadres.value.fecha_inicio = nfecha('timestamp')
  datoscamposCuadres.value.fecha_fin = nfecha('fechaAmericana')+' 23:59:59'
  datoscamposCuadres.value.cantidad_inicio = '0.00'
  datoscamposCuadres.value.efectivo = '0.00'
  datoscamposCuadres.value.tarjeta = '0.00'
  datoscamposCuadres.value.transferencia = '0.00'
  datoscamposCuadres.value.otro = '0.00'
  datoscamposCuadres.value.gastos = '0.00'
  datoscamposCuadres.value.total = '0.00'

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
await campos()
});
/************************************************************************/
async function enviarDatos(event) {
    event.preventDefault();
  const url = link.value+api.value+"/insertar/cuadres";
  if (!datoscamposCuadres.value) {
    toast.add({ severity: 'error', summary: 'Error', detail: 'Datos incompletos, no se puede Enviar.', life: 3000 });
    return;
  }
  if (datoscamposCuadres.value.hasOwnProperty('created_at')) {
     datoscamposCuadres.value.created_at = nfecha('timestamp')
     datoscamposCuadres.value.updated_at = nfecha('timestamp')
    }

  const datosEnviar = JSON.parse(JSON.stringify(datoscamposCuadres.value));
  const envioDatos = await peticionesFetchOffline('insertData','cuadres', JSON.stringify(datosEnviar));
  if (envioDatos[0] == 'ok') {
     toast.add({ severity: 'success', summary: 'Éxito', detail: 'Datos Agregados con éxito.', life: 3000 });




Swal.fire({
  title: "Datos Agregados",
  text: "Que hacemos ahora?",
  icon: "warning",
  showCancelButton: true,
  confirmButtonText: "Agregar Otro!",
  cancelButtonText: "No, Regresar al Inicio!",
 }).then(async(result) => {
  if (result.isConfirmed) {
      fetchAndSetupData()
} else if (result.dismiss === Swal.DismissReason.cancel) {
    router.push({ path: `/cuadres` });
  }
})
  }else{
    toast.add({ severity: 'error', summary: 'Error', detail: 'Fallo al Agregar los datos.', life: 3000 });
  }
}
/************************************************************************/





/************************************************************************/
</script>
<template>
<main class="content-wrapper">
  <div class="w-full px-4 mt-5 card">
<Fieldset legend="Datos de Cuadres">
      <div class="flex">
        <Button as="router-link" icon="pi pi-home" to="/cuadres" />
      </div>
</Fieldset>

<section>
<Fieldset legend="Campos">
    <form id="formularioGenerar" action="" method="">
         <div class="box-body">
          <div class="grid grid-cols-12 gap-4 mt-4 text-blue-600" id="campos">
<div class="col-span-12">
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-400" for="estado">ESTADO</label>
                <InputText fluid type="text"  class=" " v-model="datoscamposCuadres.estado" name="estado" placeholder="estado" id="actualizartoken" readonly />
            </div>


<div class="col-span-12 sm:col-span-12 md:col-span-2 lg:col-span-2 xl:col-span-2 2xl:col-span-2">
                    <label for="token" class="block text-sm font-medium text-gray-700 dark:text-gray-400">TOKEN</label>
                    <InputText type="text" fluid class=" "  v-model="datoscamposCuadres.token" placeholder="token" name="creartoken" id="token" readonly />
                </div>
<div class="col-span-12 sm:col-span-12 md:col-span-2 lg:col-span-2 xl:col-span-2 2xl:col-span-2">
                    <label for="fecha" class="block text-sm font-medium text-gray-700 dark:text-gray-400">FECHA</label>
                    <InputText type="text" fluid class=" "  v-model="datoscamposCuadres.fecha" placeholder="fecha" name="crearfecha" id="fecha" readonly />
                </div>
<div class="col-span-12 sm:col-span-12 md:col-span-2 lg:col-span-2 xl:col-span-2 2xl:col-span-2">
                    <label for="fecha_inicio" class="block text-sm font-medium text-gray-700 dark:text-gray-400">FECHA_INICIO</label>
                    <InputText type="text" fluid class=" "  v-model="datoscamposCuadres.fecha_inicio" placeholder="fecha_inicio" name="crearfecha_inicio" id="fecha_inicio" readonly />
                </div>
<div class="col-span-12 sm:col-span-12 md:col-span-2 lg:col-span-2 xl:col-span-2 2xl:col-span-2">
                    <label for="fecha_fin" class="block text-sm font-medium text-gray-700 dark:text-gray-400">FECHA_FIN</label>
                    <InputText type="text" fluid class=" "  v-model="datoscamposCuadres.fecha_fin" placeholder="fecha_fin" name="crearfecha_fin" id="fecha_fin" readonly />
                </div>
<div class="col-span-12 sm:col-span-12 md:col-span-2 lg:col-span-2 xl:col-span-2 2xl:col-span-2">
                    <label for="cantidad_inicio" class="block text-sm font-medium text-gray-700 dark:text-gray-400">CANTIDAD_INICIO</label>
                    <InputText type="text" fluid class=" "  v-decimales v-numeroFocusinOut v-solonumeros v-model="datoscamposCuadres.cantidad_inicio" placeholder="cantidad_inicio" name="crearcantidad_inicio" id="cantidad_inicio" />
                </div>
<div class="col-span-12 sm:col-span-12 md:col-span-2 lg:col-span-2 xl:col-span-2 2xl:col-span-2">
                    <label for="efectivo" class="block text-sm font-medium text-gray-700 dark:text-gray-400">EFECTIVO</label>
                    <InputText type="text" fluid class=" "  v-decimales v-numeroFocusinOut v-solonumeros v-model="datoscamposCuadres.efectivo" placeholder="efectivo" name="crearefectivo" id="efectivo" />
                </div>
<div class="col-span-12 sm:col-span-12 md:col-span-2 lg:col-span-2 xl:col-span-2 2xl:col-span-2">
                    <label for="tarjeta" class="block text-sm font-medium text-gray-700 dark:text-gray-400">TARJETA</label>
                    <InputText type="text" fluid class=" "  v-decimales v-numeroFocusinOut v-solonumeros v-model="datoscamposCuadres.tarjeta" placeholder="tarjeta" name="creartarjeta" id="tarjeta" />
                </div>
<div class="col-span-12 sm:col-span-12 md:col-span-2 lg:col-span-2 xl:col-span-2 2xl:col-span-2">
                    <label for="transferencia" class="block text-sm font-medium text-gray-700 dark:text-gray-400">TRANSFERENCIA</label>
                    <InputText type="text" fluid class=" "  v-decimales v-numeroFocusinOut v-solonumeros v-model="datoscamposCuadres.transferencia" placeholder="transferencia" name="creartransferencia" id="transferencia" />
                </div>
<div class="col-span-12 sm:col-span-12 md:col-span-2 lg:col-span-2 xl:col-span-2 2xl:col-span-2">
                    <label for="otro" class="block text-sm font-medium text-gray-700 dark:text-gray-400">OTRO</label>
                    <InputText type="text" fluid class=" "  v-decimales v-numeroFocusinOut v-solonumeros v-model="datoscamposCuadres.otro" placeholder="otro" name="crearotro" id="otro" />
                </div>
<div class="col-span-12 sm:col-span-12 md:col-span-2 lg:col-span-2 xl:col-span-2 2xl:col-span-2">
                    <label for="gastos" class="block text-sm font-medium text-gray-700 dark:text-gray-400">GASTOS</label>
                    <InputText type="text" fluid class=" "  v-decimales v-numeroFocusinOut v-solonumeros v-model="datoscamposCuadres.gastos" placeholder="gastos" name="creargastos" id="gastos" />
                </div>
<div class="col-span-12 sm:col-span-12 md:col-span-2 lg:col-span-2 xl:col-span-2 2xl:col-span-2">
                    <label for="total" class="block text-sm font-medium text-gray-700 dark:text-gray-400">TOTAL</label>
                    <InputText type="text" fluid class=" "  v-decimales v-numeroFocusinOut v-solonumeros v-model="datoscamposCuadres.total" placeholder="total" name="creartotal" id="total" />
                </div>
<div class="col-span-12 sm:col-span-12 md:col-span-2 lg:col-span-2 xl:col-span-2 2xl:col-span-2">
                    <label for="turno" class="block text-sm font-medium text-gray-700 dark:text-gray-400">TURNO</label>
                    <InputText type="text" fluid class=" " v-model="datoscamposCuadres.turno" placeholder="turno" name="crearturno" id="turno" readonly/>
                </div>
<div class="col-span-12 sm:col-span-12 md:col-span-12 lg:col-span-12 xl:col-span-12 2xl:col-span-12">
                    <label  class="block text-sm font-medium text-gray-700 dark:text-gray-400" for="nota">NOTA</label>
                   <Textarea id="crearnota" rows="3" fluid class="form-textarea w-full "  v-model="datoscamposCuadres.nota" placeholder="Nota" />
                </div>

<div class="form-group col-span-6" hidden>
<label for="created_atAgregarDatos">CREATED_AT</label>
<input type="input" v-model="datoscamposCuadres.created_at" name="created_at"  class="form-control " id="created_atAgregarDatos"  placeholder="created_at" maxlength="">
</div>
<div class="form-group col-span-6" hidden>
<label for="updated_atAgregarDatos">UPDATED_AT</label>
<input type="input" v-model="datoscamposCuadres.updated_at" name="updated_at"  class="form-control " id="updated_atAgregarDatos"  placeholder="updated_at" maxlength="">
</div>

<div class="form-group col-span-12" hidden>
<label for="usuarioAgregarDatos">USUARIO</label>
<input type="input" v-model="datoscamposCuadres.usuario" name="usuario"  class="form-control " id="usuarioAgregarDatos"  placeholder="usuario" maxlength="250">
</div>

<div class="form-group col-span-12 mb-5 mt-5">
  <Button label="Enviar Datos" fluid  @click="enviarDatos" />
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

