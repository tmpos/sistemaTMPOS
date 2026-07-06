
<script setup>
import { ref, onMounted, nextTick, watchEffect } from 'vue';
import { useToast } from "primevue/usetoast";
import { useRouter, useRoute } from 'vue-router';
const router = useRouter();
const route = useRoute(); 
import { enviarDatosPorPost, eliminarDatos, obtenerIdsSeleccionados, borrarTodoslosDatos, lenguajeDataTable, nfecha, arrayToObjetoFromTabla, peticionesFetch, encryptarPassword, envioElectron, generarCodigoUnico, peticiones, mensajetoast, lasMayusculas, peticionesFetchOffline, arrayToObjetoFromTablaOffline, crearTablaSiNoExisteOffline } from '../../funciones/funciones.js';
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
const datoscamposApartados = ref({})
const codigoUnico = ref(generarCodigoUnico());
const fecha = ref(nfecha('fecha'));
const position = "top";
/************************************************************************/
const fetchAndSetupData = async () => {
    const jsonData = await arrayToObjetoFromTablaOffline('apartados');
    datoscamposApartados.value = jsonData;
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
  const url = link.value+api.value+"/insertar/apartados";
  if (!datoscamposApartados.value) {
    toast.add({ severity: 'error', summary: 'Error', detail: 'Datos incompletos, no se puede Enviar.', life: 3000 });
    return;
  }
  if (datoscamposApartados.value.hasOwnProperty('created_at')) {
     datoscamposApartados.value.created_at = nfecha('timestamp')
     datoscamposApartados.value.updated_at = nfecha('timestamp')
    }
  const envioDatos = await peticionesFetchOffline('insertData', 'apartados', JSON.stringify(datoscamposApartados.value));
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
    router.push({ path: `/apartados` });
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
          <legend class="float-none w-auto px-2">Datos de Apartados</legend>
    <div class="grid grid-cols-12 gap-4">
      <div class="sm:col-span-12">
        <Button as="router-link" icon="pi pi-home" to="/apartados" />
      </div>
    </div>
</fieldset>
<section>
<fieldset class="border p-3 rounded mb-2">
  <legend class="float-none w-auto px-2">Campos</legend>
    <form id="formularioGenerar" action="" method="">
         <div class="box-body">
          <div class="grid grid-cols-12 gap-4 mt-4 text-blue-600" id="campos">

<div class="col-span-12 sm:col-span-12 md:col-span-2 lg:col-span-2 xl:col-span-2 2xl:col-span-2">
                    <label for="no_emision" class="block text-sm font-medium text-gray-700 dark:text-gray-400">No emision</label>
                    <InputText type="text" class="form-input w-full "  v-solonumeros v-model="datoscamposApartados.no_emision" placeholder="no_emision" name="crearno_emision" id="no_emision" />
                </div>
<div class="col-span-12 sm:col-span-12 md:col-span-2 lg:col-span-2 xl:col-span-2 2xl:col-span-2">
                    <label for="no_factura" class="block text-sm font-medium text-gray-700 dark:text-gray-400">No factura</label>
                    <InputText type="text" class="form-input w-full "  v-solonumeros v-model="datoscamposApartados.no_factura" placeholder="no_factura" name="crearno_factura" id="no_factura" />
                </div>
<div class="col-span-12 sm:col-span-12 md:col-span-2 lg:col-span-2 xl:col-span-2 2xl:col-span-2">
                    <label for="cod_cliente" class="block text-sm font-medium text-gray-700 dark:text-gray-400">Cod cliente</label>
                    <InputText type="text" class="form-input w-full "  v-solonumeros v-model="datoscamposApartados.cod_cliente" placeholder="cod_cliente" name="crearcod_cliente" id="cod_cliente" />
                </div>
<div class="col-span-12 sm:col-span-12 md:col-span-4 lg:col-span-4 xl:col-span-4 2xl:col-span-4">
                    <label for="nombre_cliente" class="block text-sm font-medium text-gray-700 dark:text-gray-400">Nombre cliente</label>
                    <InputText type="text" class="form-input w-full "  v-mayuscula v-model="datoscamposApartados.nombre_cliente" placeholder="nombre_cliente" name="crearnombre_cliente" id="nombre_cliente" />
                </div>
<div class="col-span-12 sm:col-span-12 md:col-span-2 lg:col-span-2 xl:col-span-2 2xl:col-span-2">
                    <label for="cedula_cliente" class="block text-sm font-medium text-gray-700 dark:text-gray-400">Cedula cliente</label>
                    <InputText type="text" class="form-input w-full "  v-model="datoscamposApartados.cedula_cliente" placeholder="cedula_cliente" name="crearcedula_cliente" id="cedula_cliente" />
                </div>
<div class="col-span-12 sm:col-span-12 md:col-span-4 lg:col-span-4 xl:col-span-4 2xl:col-span-4">
                    <label for="telefono_cliente" class="block text-sm font-medium text-gray-700 dark:text-gray-400">Telefono cliente</label>
                    <InputText type="text" class="form-input w-full "  v-maska="patronTelefono" v-model="datoscamposApartados.telefono_cliente" placeholder="telefono_cliente" name="creartelefono_cliente" id="telefono_cliente" />
                </div>
<div class="col-span-12 sm:col-span-12 md:col-span-4 lg:col-span-4 xl:col-span-4 2xl:col-span-4">
                    <label for="whatsapp_cliente" class="block text-sm font-medium text-gray-700 dark:text-gray-400">Whatsapp cliente</label>
                    <InputText type="text" class="form-input w-full "  v-maska="patronTelefono" v-model="datoscamposApartados.whatsapp_cliente" placeholder="whatsapp_cliente" name="crearwhatsapp_cliente" id="whatsapp_cliente" />
                </div>
<div class="col-span-12 sm:col-span-12 md:col-span-4 lg:col-span-4 xl:col-span-4 2xl:col-span-4">
                    <label for="email_cliente" class="block text-sm font-medium text-gray-700 dark:text-gray-400">Email cliente</label>
                    <InputText type="text" class="form-input w-full "  v-model="datoscamposApartados.email_cliente" placeholder="email_cliente" name="crearemail_cliente" id="email_cliente" />
                </div>
<div class="col-span-12 sm:col-span-12 md:col-span-12 lg:col-span-12 xl:col-span-12 2xl:col-span-12">
                    <label for="direccion_cliente" class="block text-sm font-medium text-gray-700 dark:text-gray-400">Direccion cliente</label>
                   <Textarea id="creardireccion_cliente" rows="3" class="form-textarea w-full "  v-model="datoscamposApartados.direccion_cliente" placeholder="Direccion_cliente"></textarea>
                </div>
<div class="col-span-12 sm:col-span-12 md:col-span-12 lg:col-span-12 xl:col-span-12 2xl:col-span-12">
                    <label for="productos" class="block text-sm font-medium text-gray-700 dark:text-gray-400">Productos</label>
                   <Textarea id="crearproductos" rows="3" class="form-textarea w-full "  v-model="datoscamposApartados.productos" placeholder="Productos"></textarea>
                </div>
<div class="col-span-12 sm:col-span-12 md:col-span-2 lg:col-span-2 xl:col-span-2 2xl:col-span-2">
                    <label for="fecha_emision" class="block text-sm font-medium text-gray-700 dark:text-gray-400">Fecha emision</label>
                   <DatePicker  v-model="datoscamposApartados.fecha_emision" showButtonBar fluid />
            </div>
<div class="col-span-12 sm:col-span-12 md:col-span-2 lg:col-span-2 xl:col-span-2 2xl:col-span-2">
                   <label for="hora" class="block text-sm font-medium text-gray-700 dark:text-gray-400">Hora</label>
                   <DatePicker  v-model="datoscamposApartados.hora" timeOnly fluid />
            </div>
<div class="col-span-12 sm:col-span-12 md:col-span-2 lg:col-span-2 xl:col-span-2 2xl:col-span-2">
                    <label for="fecha_vencimiento" class="block text-sm font-medium text-gray-700 dark:text-gray-400">Fecha vencimiento</label>
                   <DatePicker  v-model="datoscamposApartados.fecha_vencimiento" showButtonBar fluid />
            </div>
<div class="col-span-12 sm:col-span-12 md:col-span-2 lg:col-span-2 xl:col-span-2 2xl:col-span-2">
                    <label for="monto_credito" class="block text-sm font-medium text-gray-700 dark:text-gray-400">Monto credito</label>
                    <InputText type="text" class="form-input w-full "   v-solonumeros v-decimales v-numeroFocusinOut v-model="datoscamposApartados.monto_credito" placeholder="monto_credito" name="crearmonto_credito" id="monto_credito" />
                </div>
<div class="col-span-12 sm:col-span-12 md:col-span-2 lg:col-span-2 xl:col-span-2 2xl:col-span-2">
                    <label for="cuotas" class="block text-sm font-medium text-gray-700 dark:text-gray-400">Cuotas</label>
                    <InputText type="text" class="form-input w-full "   v-solonumeros v-model="datoscamposApartados.cuotas" placeholder="cuotas" name="crearcuotas" id="cuotas" />
                </div>
<div class="col-span-12 sm:col-span-12 md:col-span-2 lg:col-span-2 xl:col-span-2 2xl:col-span-2">
                    <label for="tiempo" class="block text-sm font-medium text-gray-700 dark:text-gray-400">Tiempo</label>

              <Dropdown v-model="datoscamposApartados.tiempo" :options="['DIARIO','SEMANAL','QUINCENAL','MENSUAL','LOS 15','LOS 30']" placeholder="Seleccione tiempo" class="w-full" />
            </div>
<div class="col-span-12 sm:col-span-12 md:col-span-2 lg:col-span-2 xl:col-span-2 2xl:col-span-2">
                    <label for="fecha_ultimo_pago" class="block text-sm font-medium text-gray-700 dark:text-gray-400">Fecha ultimo pago</label>
                    <InputText type="text" class="form-input w-full "  v-model="datoscamposApartados.fecha_ultimo_pago" placeholder="fecha_ultimo_pago" name="crearfecha_ultimo_pago" id="fecha_ultimo_pago" />
                </div>
<div class="col-span-12 sm:col-span-12 md:col-span-2 lg:col-span-2 xl:col-span-2 2xl:col-span-2">
                    <label for="proxima_fecha_pago" class="block text-sm font-medium text-gray-700 dark:text-gray-400">Proxima fecha pago</label>
                    <InputText type="text" class="form-input w-full "  v-model="datoscamposApartados.proxima_fecha_pago" placeholder="proxima_fecha_pago" name="crearproxima_fecha_pago" id="proxima_fecha_pago" />
                </div>
<div class="col-span-12 sm:col-span-12 md:col-span-2 lg:col-span-2 xl:col-span-2 2xl:col-span-2">
                    <label for="abonado" class="block text-sm font-medium text-gray-700 dark:text-gray-400">Abonado</label>
                    <InputText type="text" class="form-input w-full "   v-solonumeros v-decimales v-numeroFocusinOut v-model="datoscamposApartados.abonado" placeholder="abonado" name="crearabonado" id="abonado" />
                </div>
<div class="col-span-12 sm:col-span-12 md:col-span-2 lg:col-span-2 xl:col-span-2 2xl:col-span-2">
                    <label for="saldo" class="block text-sm font-medium text-gray-700 dark:text-gray-400">Saldo</label>
                    <InputText type="text" class="form-input w-full "   v-solonumeros v-decimales v-numeroFocusinOut v-model="datoscamposApartados.saldo" placeholder="saldo" name="crearsaldo" id="saldo" />
                </div>
<div class="col-span-12 sm:col-span-12 md:col-span-2 lg:col-span-2 xl:col-span-2 2xl:col-span-2">
                    <label for="estatus" class="block text-sm font-medium text-gray-700 dark:text-gray-400">Estatus</label>

              <Dropdown v-model="datoscamposApartados.estatus" :options="['PENDIENTE','PAGADO','OTRO']" placeholder="Seleccione estatus" class="w-full" />
            </div>
<div class="col-span-12 sm:col-span-12 md:col-span-2 lg:col-span-2 xl:col-span-2 2xl:col-span-2">
                    <label for="vendedor" class="block text-sm font-medium text-gray-700 dark:text-gray-400">Vendedor</label>
                    <InputText type="text" class="form-input w-full "  v-mayuscula v-model="datoscamposApartados.vendedor" placeholder="vendedor" name="crearvendedor" id="vendedor" />
                </div>
<div class="col-span-12 sm:col-span-12 md:col-span-12 lg:col-span-12 xl:col-span-12 2xl:col-span-12">
                    <label for="pagos" class="block text-sm font-medium text-gray-700 dark:text-gray-400">Pagos</label>
                   <Textarea id="crearpagos" rows="3" class="form-textarea w-full "  v-model="datoscamposApartados.pagos" placeholder="Pagos"></textarea>
                </div>
<div class="col-span-12 sm:col-span-12 md:col-span-12 lg:col-span-12 xl:col-span-12 2xl:col-span-12">
                    <label for="nota" class="block text-sm font-medium text-gray-700 dark:text-gray-400">Nota</label>
                   <Textarea id="crearnota" rows="3" class="form-textarea w-full "  v-model="datoscamposApartados.nota" placeholder="Nota"></textarea>
                </div>

<div class="form-group col-span-6" hidden>
<label for="created_atAgregarDatos">CREATED_AT</label>
<input type="input" v-model="datoscamposApartados.created_at" name="created_at"  class="form-control " id="created_atAgregarDatos"  placeholder="created_at" maxlength="">
</div>
<div class="form-group col-span-6" hidden>
<label for="updated_atAgregarDatos">UPDATED_AT</label>
<input type="input" v-model="datoscamposApartados.updated_at" name="updated_at"  class="form-control " id="updated_atAgregarDatos"  placeholder="updated_at" maxlength="">
</div>

<div class="form-group col-span-12" hidden>
<label for="usuarioAgregarDatos">USUARIO</label>
<input type="input" v-model="datoscamposApartados.usuario" name="usuario"  class="form-control " id="usuarioAgregarDatos"  placeholder="usuario" maxlength="250">
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

