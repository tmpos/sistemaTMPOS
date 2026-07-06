
<script setup>
import { ref, onMounted, nextTick, watchEffect } from 'vue';
import { useToast } from "primevue/usetoast";
import { useRouter, useRoute } from 'vue-router';
const router = useRouter();
const route = useRoute(); 
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
  generarCodigoUnico,
  peticiones,
  arrayToObjetoFromTablaOffline,
peticionesFetchOffline,
  mensajetoast,
  lasMayusculas} from '../../funciones/funciones.js';
import Swal from 'sweetalert2'
const toast = useToast();
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
const datoscamposGarantia_global = ref({})
const codigoUnico = ref(generarCodigoUnico());
const fecha = ref(nfecha('fecha'));
const position = "top";
/************************************************************************/
const fetchAndSetupData = async () => {
    const jsonData = await arrayToObjetoFromTablaOffline('garantia_global');
    datoscamposGarantia_global.value = jsonData;
};
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
await fetchAndSetupData()
});
/************************************************************************/
async function enviarDatos(event) {
    event.preventDefault();
  const url = link.value+api.value+"/insertar/garantia_global";
  if (!datoscamposGarantia_global.value) {
    toast.add({ severity: 'error', summary: 'Error', detail: 'Datos incompletos, no se puede Enviar.', life: 3000 });
    return;
  }
  if (datoscamposGarantia_global.value.hasOwnProperty('created_at')) {
     datoscamposGarantia_global.value.created_at = nfecha('timestamp')
     datoscamposGarantia_global.value.updated_at = nfecha('timestamp')
    }
  const envioDatos = await peticionesFetchOffline('insertData', 'garantia_global',JSON.stringify(datoscamposGarantia_global.value));
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
    router.push({ path: `/garantia_global` });
  }
})
  }else{
    toast.add({ severity: 'error', summary: 'Error', detail: 'Fallo al Agregar los datos.', life: 3000 });
  }
}
/************************************************************************/
</script>
<template>
<main class="content-wrapper">
  <div class="w-full px-4 mt-5 card">
        <fieldset class="border p-3 rounded mb-2">
          <legend class="float-none w-auto px-2">Datos de Garantia_global</legend>
    <div class="grid grid-cols-12 gap-4">
      <div class="sm:col-span-12">
        <Button as="router-link" icon="pi pi-home" to="/garantia_global" />
      </div>
    </div>
</fieldset>
<section>
<fieldset class="border p-3 rounded mb-2">
  <legend class="float-none w-auto px-2">Campos</legend>
    <form id="formularioGenerar" action="" method="">
         <div class="box-body">
          <div class="grid grid-cols-12 gap-4 mt-4 text-blue-600" id="campos">

<div class="col-span-12 sm:col-span-12 md:col-span-4 lg:col-span-4 xl:col-span-4 2xl:col-span-4">
                    <label for="no_garantia" class="block text-sm font-medium text-gray-700 dark:text-gray-400">No garantia</label>
                    <InputText type="text" class="form-input w-full "  v-model="datoscamposGarantia_global.no_garantia" placeholder="no_garantia" name="crearno_garantia" id="no_garantia" />
                </div>
<div class="col-span-12 sm:col-span-12 md:col-span-8 lg:col-span-8 xl:col-span-8 2xl:col-span-8">
                    <label for="cliente" class="block text-sm font-medium text-gray-700 dark:text-gray-400">Cliente</label>
                    <InputText type="text" class="form-input w-full "  v-mayuscula v-model="datoscamposGarantia_global.cliente" placeholder="cliente" name="crearcliente" id="cliente" />
                </div>
<div class="col-span-12 sm:col-span-12 md:col-span-3 lg:col-span-3 xl:col-span-3 2xl:col-span-3">
                    <label for="equipo" class="block text-sm font-medium text-gray-700 dark:text-gray-400">Equipo</label>
                    <InputText type="text" class="form-input w-full "  v-mayuscula v-model="datoscamposGarantia_global.equipo" placeholder="equipo" name="crearequipo" id="equipo" />
                </div>
<div class="col-span-12 sm:col-span-12 md:col-span-3 lg:col-span-3 xl:col-span-3 2xl:col-span-3">
                    <label for="marca" class="block text-sm font-medium text-gray-700 dark:text-gray-400">Marca</label>
                    <InputText type="text" class="form-input w-full "  v-mayuscula v-model="datoscamposGarantia_global.marca" placeholder="marca" name="crearmarca" id="marca" />
                </div>
<div class="col-span-12 sm:col-span-12 md:col-span-3 lg:col-span-3 xl:col-span-3 2xl:col-span-3">
                    <label for="modelo" class="block text-sm font-medium text-gray-700 dark:text-gray-400">Modelo</label>
                    <InputText type="text" class="form-input w-full "  v-mayuscula v-model="datoscamposGarantia_global.modelo" placeholder="modelo" name="crearmodelo" id="modelo" />
                </div>
<div class="col-span-12 sm:col-span-12 md:col-span-3 lg:col-span-3 xl:col-span-3 2xl:col-span-3">
                    <label for="imei" class="block text-sm font-medium text-gray-700 dark:text-gray-400">Imei</label>
                    <InputText type="text" class="form-input w-full "  v-solonumeros v-model="datoscamposGarantia_global.imei" placeholder="imei" name="crearimei" id="imei" />
                </div>
<div class="col-span-12 sm:col-span-12 md:col-span-2 lg:col-span-2 xl:col-span-2 2xl:col-span-2">
                    <label for="tipo" class="block text-sm font-medium text-gray-700 dark:text-gray-400">Tipo</label>

              <Dropdown v-model="datoscamposGarantia_global.tipo" :options="['PROPIO','CONSIGNADO']" placeholder="Seleccione tipo" class="w-full" />
            </div>
<div class="col-span-12 sm:col-span-12 md:col-span-4 lg:col-span-4 xl:col-span-4 2xl:col-span-4">
                    <label for="proveedor" class="block text-sm font-medium text-gray-700 dark:text-gray-400">Proveedor</label>
                    <InputText type="text" class="form-input w-full "  v-mayuscula v-model="datoscamposGarantia_global.proveedor" placeholder="proveedor" name="crearproveedor" id="proveedor" />
                </div>
<div class="col-span-12 sm:col-span-12 md:col-span-2 lg:col-span-2 xl:col-span-2 2xl:col-span-2">
                    <label for="fecha_venta" class="block text-sm font-medium text-gray-700 dark:text-gray-400">Fecha venta</label>
                    <InputText type="text" class="form-input w-full "  v-model="datoscamposGarantia_global.fecha_venta" placeholder="fecha_venta" name="crearfecha_venta" id="fecha_venta" />
                </div>
<div class="col-span-12 sm:col-span-12 md:col-span-2 lg:col-span-2 xl:col-span-2 2xl:col-span-2">
                    <label for="fecha_ingreso" class="block text-sm font-medium text-gray-700 dark:text-gray-400">Fecha ingreso</label>
                    <InputText type="text" class="form-input w-full "  v-model="datoscamposGarantia_global.fecha_ingreso" placeholder="fecha_ingreso" name="crearfecha_ingreso" id="fecha_ingreso" />
                </div>
<div class="col-span-12 sm:col-span-12 md:col-span-2 lg:col-span-2 xl:col-span-2 2xl:col-span-2">
                    <label for="hora" class="block text-sm font-medium text-gray-700 dark:text-gray-400">Hora</label>
                    <InputText type="text" class="form-input w-full "  v-model="datoscamposGarantia_global.hora" placeholder="hora" name="crearhora" id="hora" />
                </div>
<div class="col-span-12 sm:col-span-12 md:col-span-12 lg:col-span-12 xl:col-span-12 2xl:col-span-12">
                    <label for="fallas" class="block text-sm font-medium text-gray-700 dark:text-gray-400">Fallas</label>
                   <Textarea id="crearfallas" rows="3" class="form-textarea w-full "  v-model="datoscamposGarantia_global.fallas" placeholder="Fallas"></textarea>
                </div>
<div class="col-span-12 sm:col-span-12 md:col-span-12 lg:col-span-12 xl:col-span-12 2xl:col-span-12">
                    <label for="solucion" class="block text-sm font-medium text-gray-700 dark:text-gray-400">Solucion</label>
                   <Textarea id="crearsolucion" rows="3" class="form-textarea w-full "  v-model="datoscamposGarantia_global.solucion" placeholder="Solucion"></textarea>
                </div>
<div class="col-span-12 sm:col-span-12 md:col-span-4 lg:col-span-4 xl:col-span-4 2xl:col-span-4">
                    <label for="tecnico" class="block text-sm font-medium text-gray-700 dark:text-gray-400">Tecnico</label>
                    <InputText type="text" class="form-input w-full "  v-mayuscula v-model="datoscamposGarantia_global.tecnico" placeholder="tecnico" name="creartecnico" id="tecnico" />
                </div>
<div class="col-span-12 sm:col-span-12 md:col-span-2 lg:col-span-2 xl:col-span-2 2xl:col-span-2">
                    <label for="estado" class="block text-sm font-medium text-gray-700 dark:text-gray-400">Estado</label>

              <Dropdown v-model="datoscamposGarantia_global.estado" :options="['PENDIENTE','REPARADO','ENTREGADO','A TALLER']" placeholder="Seleccione estado" class="w-full" />
            </div>
<div class="col-span-12 sm:col-span-12 md:col-span-2 lg:col-span-2 xl:col-span-2 2xl:col-span-2">
                    <label for="fecha_reparacion" class="block text-sm font-medium text-gray-700 dark:text-gray-400">Fecha reparacion</label>
                    <InputText type="text" class="form-input w-full "  v-model="datoscamposGarantia_global.fecha_reparacion" placeholder="fecha_reparacion" name="crearfecha_reparacion" id="fecha_reparacion" />
                </div>
<div class="col-span-12 sm:col-span-12 md:col-span-2 lg:col-span-2 xl:col-span-2 2xl:col-span-2">
                    <label for="fecha_entrega" class="block text-sm font-medium text-gray-700 dark:text-gray-400">Fecha entrega</label>
                    <InputText type="text" class="form-input w-full "  v-model="datoscamposGarantia_global.fecha_entrega" placeholder="fecha_entrega" name="crearfecha_entrega" id="fecha_entrega" />
                </div>
<div class="col-span-12 sm:col-span-12 md:col-span-2 lg:col-span-2 xl:col-span-2 2xl:col-span-2">
                    <label for="no_taller" class="block text-sm font-medium text-gray-700 dark:text-gray-400">No taller</label>
                    <InputText type="text" class="form-input w-full "  v-solonumeros v-model="datoscamposGarantia_global.no_taller" placeholder="no_taller" name="crearno_taller" id="no_taller" />
                </div>
<div class="col-span-12 sm:col-span-12 md:col-span-6 lg:col-span-6 xl:col-span-6 2xl:col-span-6">
                    <label for="recibido_por" class="block text-sm font-medium text-gray-700 dark:text-gray-400">Recibido por</label>
                    <InputText type="text" class="form-input w-full "  v-model="datoscamposGarantia_global.recibido_por" placeholder="recibido_por" name="crearrecibido_por" id="recibido_por" />
                </div>
<div class="col-span-12 sm:col-span-12 md:col-span-6 lg:col-span-6 xl:col-span-6 2xl:col-span-6">
                    <label for="entregado_por" class="block text-sm font-medium text-gray-700 dark:text-gray-400">Entregado por</label>
                    <InputText type="text" class="form-input w-full "  v-model="datoscamposGarantia_global.entregado_por" placeholder="entregado_por" name="crearentregado_por" id="entregado_por" />
                </div>
<div class="col-span-12 sm:col-span-12 md:col-span-12 lg:col-span-12 xl:col-span-12 2xl:col-span-12">
                    <label for="nota" class="block text-sm font-medium text-gray-700 dark:text-gray-400">Nota</label>
                   <Textarea id="crearnota" rows="3" class="form-textarea w-full "  v-model="datoscamposGarantia_global.nota" placeholder="Nota"></textarea>
                </div>

<div class="form-group col-span-6" hidden>
<label for="created_atAgregarDatos">CREATED_AT</label>
<input type="input" v-model="datoscamposGarantia_global.created_at" name="created_at"  class="form-control " id="created_atAgregarDatos"  placeholder="created_at" maxlength="">
</div>
<div class="form-group col-span-6" hidden>
<label for="updated_atAgregarDatos">UPDATED_AT</label>
<input type="input" v-model="datoscamposGarantia_global.updated_at" name="updated_at"  class="form-control " id="updated_atAgregarDatos"  placeholder="updated_at" maxlength="">
</div>

<div class="form-group col-span-12" hidden>
<label for="usuarioAgregarDatos">USUARIO</label>
<input type="input" v-model="datoscamposGarantia_global.usuario" name="usuario"  class="form-control " id="usuarioAgregarDatos"  placeholder="usuario" maxlength="250">
</div>

<div class="form-group col-span-12 mb-5 mt-5">
  <Button label="Enviar Datos" fluid  @click="enviarDatos" autofocus />
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
<style scoped>
</style>

