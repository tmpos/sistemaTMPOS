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
const datoscamposCotizacion = ref({})
const codigoUnico = ref(generarCodigoUnico());
const fecha = ref(nfecha('fecha'));
const position = "top";
/************************************************************************/
const fetchAndSetupData = async () => {
    const jsonData = await arrayToObjetoFromTabla(link.value+api.value,tokenCifrado.value,'cotizacion');
    datoscamposCotizacion.value = jsonData;
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
if (!datosEmpresa.empresa.nombre) {
    await datosEmpresa.inicializarDatosEmpresa(link.value+api.value);
  }
fetchAndSetupData()
});
/************************************************************************/
async function enviarDatos(event) {
    event.preventDefault();
  const url = link.value+api.value+"/insertar/cotizacion";
  if (!datoscamposCotizacion.value) {
    toast.add({ severity: 'error', summary: 'Error', detail: 'Datos incompletos, no se puede Enviar.', life: 3000 });
    return;
  }
  if (datoscamposCotizacion.value.hasOwnProperty('created_at')) {
     datoscamposCotizacion.value.created_at = nfecha('timestamp')
     datoscamposCotizacion.value.updated_at = nfecha('timestamp')
    }
  const envioDatos = await enviarDatosPorPost(url, datoscamposCotizacion.value,tokenCifrado.value);
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
    router.push({ path: `/cotizacion` });
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
  <div class="w-full px-4 mt-5">
        <fieldset class="border p-3 rounded mb-2">
          <legend class="float-none w-auto px-2">Datos de Cotizacion</legend>
    <div class="grid grid-cols-12 gap-4">
      <div class="sm:col-span-12">
       <router-link to="/cotizacion" class="btn btn-dark text-white "><i class="icon-home"></i></router-link>
      </div>
    </div>
</fieldset>
<section>
<fieldset class="border p-3 rounded mb-2">
  <legend class="float-none w-auto px-2">Campos</legend>
    <form id="formularioActualizar" action="" method="">
         <div class="box-body">
          <div class="grid grid-cols-12 gap-4" id="campos">
<div class="form-group col-span-12 sm:col-span-4 md:col-span-4 lg:col-span-4 xl:col-span-4" >
<label for="no_cotizacionAgregarDatos">NO_COTIZACION</label>
<input type="input" v-model="datoscamposCotizacion.no_cotizacion" name="no_cotizacion"  class="form-control soloNumero" id="no_cotizacionAgregarDatos" v-solonumeros placeholder="no_cotizacion" maxlength="250">
</div>
<div class="form-group col-span-12 sm:col-span-4 md:col-span-4 lg:col-span-4 xl:col-span-4" >
<label for="cod_clienteAgregarDatos">COD_CLIENTE</label>
<input type="input" v-model="datoscamposCotizacion.cod_cliente" name="cod_cliente"  class="form-control soloNumero" id="cod_clienteAgregarDatos" v-solonumeros placeholder="cod_cliente" maxlength="250">
</div>
<div class="form-group col-span-12 sm:col-span-4 md:col-span-4 lg:col-span-4 xl:col-span-4" >
<label for="nombre_clienteAgregarDatos">NOMBRE_CLIENTE</label>
<input type="input" v-model="datoscamposCotizacion.nombre_cliente" name="nombre_cliente"  class="form-control mayusc" id="nombre_clienteAgregarDatos" v-mayuscula placeholder="nombre_cliente" maxlength="250">
</div>
<div class="form-group col-span-12 sm:col-span-4 md:col-span-4 lg:col-span-4 xl:col-span-4" >
<label for="telefono_clienteAgregarDatos">TELEFONO_CLIENTE</label>
<InputMask id="telefono_clienteAgregarDatos" class="form-control" v-model="datoscamposCotizacion.telefono_cliente" :mask="patronTelefono" :placeholder="patronTelefono" />
</div>
<div class="form-group col-span-12 sm:col-span-4 md:col-span-4 lg:col-span-4 xl:col-span-4" >
<label for="whatsapp_clienteAgregarDatos">WHATSAPP_CLIENTE</label>
<InputMask id="whatsapp_clienteAgregarDatos" class="form-control" v-model="datoscamposCotizacion.whatsapp_cliente" :mask="patronTelefono" :placeholder="patronTelefono" />
</div>
<div class="form-group col-span-12 sm:col-span-4 md:col-span-4 lg:col-span-4 xl:col-span-4" >
<label for="email_clienteAgregarDatos">EMAIL_CLIENTE</label>
<input type="input" v-model="datoscamposCotizacion.email_cliente" name="email_cliente"  class="form-control " id="email_clienteAgregarDatos"  placeholder="email_cliente" maxlength="250">
</div>
<div class="form-group col-span-12 sm:col-span-12 md:col-span-12 lg:col-span-12 xl:col-span-12" >
<label for="direccion_clienteAgregarDatos">DIRECCION_CLIENTE</label>
<textarea class="form-control " v-model="datoscamposCotizacion.direccion_cliente" id="direccion_clienteAgregarDatos" name="direccion_cliente" cols="30" rows="3" ></textarea>
</div>
<div class="form-group col-span-12 sm:col-span-4 md:col-span-4 lg:col-span-4 xl:col-span-4" >
<label for="rnc_clienteAgregarDatos">RNC_CLIENTE</label>
<input type="input" v-model="datoscamposCotizacion.rnc_cliente" name="rnc_cliente"  class="form-control " id="rnc_clienteAgregarDatos"  placeholder="rnc_cliente" maxlength="250">
</div>
<div class="form-group col-span-12 sm:col-span-8 md:col-span-8 lg:col-span-8 xl:col-span-8" >
<label for="nombre_comercialAgregarDatos">NOMBRE_COMERCIAL</label>
<input type="input" v-model="datoscamposCotizacion.nombre_comercial" name="nombre_comercial"  class="form-control mayusc" id="nombre_comercialAgregarDatos" v-mayuscula placeholder="nombre_comercial" maxlength="250">
</div>
<div class="form-group col-span-12 sm:col-span-12 md:col-span-12 lg:col-span-12 xl:col-span-12" >
<label for="productosAgregarDatos">PRODUCTOS</label>
<textarea class="form-control " v-model="datoscamposCotizacion.productos" id="productosAgregarDatos" name="productos" cols="30" rows="3" ></textarea>
</div>
<div class="form-group col-span-12 sm:col-span-4 md:col-span-4 lg:col-span-4 xl:col-span-4" >
<label for="vendedorAgregarDatos">VENDEDOR</label>
<input type="input" v-model="datoscamposCotizacion.vendedor" name="vendedor"  class="form-control " id="vendedorAgregarDatos"  placeholder="vendedor" maxlength="250">
</div>
<div class="form-group col-span-12 sm:col-span-4 md:col-span-4 lg:col-span-4 xl:col-span-4" >
<label for="metodo_pagoAgregarDatos">METODO_PAGO</label>
<input type="input" v-model="datoscamposCotizacion.metodo_pago" name="metodo_pago"  class="form-control " id="metodo_pagoAgregarDatos"  placeholder="metodo_pago" maxlength="250">
</div>
<div class="form-group col-span-12 sm:col-span-4 md:col-span-4 lg:col-span-4 xl:col-span-4" >
<label for="fecha_emisionAgregarDatos">FECHA_EMISION</label>
<input type="input" v-model="datoscamposCotizacion.fecha_emision" name="fecha_emision"  class="form-control " id="fecha_emisionAgregarDatos"  placeholder="fecha_emision" maxlength="250">
</div>
<div class="form-group col-span-12 sm:col-span-4 md:col-span-4 lg:col-span-4 xl:col-span-4" >
<label for="impuestoAgregarDatos">IMPUESTO</label>
<input type="input" v-model="datoscamposCotizacion.impuesto" name="impuesto"  class="form-control " id="impuestoAgregarDatos"  placeholder="impuesto" maxlength="250">
</div>
<div class="form-group col-span-12 sm:col-span-4 md:col-span-4 lg:col-span-4 xl:col-span-4" >
<label for="descuentoAgregarDatos">DESCUENTO</label>
<input type="input" v-model="datoscamposCotizacion.descuento" name="descuento"  class="form-control " id="descuentoAgregarDatos"  placeholder="descuento" maxlength="250">
</div>
<div class="form-group col-span-12 sm:col-span-4 md:col-span-4 lg:col-span-4 xl:col-span-4" >
<label for="subtotalAgregarDatos">SUBTOTAL</label>
<input type="input" v-model="datoscamposCotizacion.subtotal" name="subtotal"  class="form-control " id="subtotalAgregarDatos"  placeholder="subtotal" maxlength="250">
</div>
<div class="form-group col-span-12 sm:col-span-4 md:col-span-4 lg:col-span-4 xl:col-span-4" >
<label for="totalAgregarDatos">TOTAL</label>
<input type="input" v-model="datoscamposCotizacion.total" name="total"  class="form-control " id="totalAgregarDatos"  placeholder="total" maxlength="250">
</div>
<div class="form-group col-span-12 sm:col-span-4 md:col-span-4 lg:col-span-4 xl:col-span-4" >
<label for="estado_cotizacionAgregarDatos">ESTADO_COTIZACION</label>
<input type="input" v-model="datoscamposCotizacion.estado_cotizacion" name="estado_cotizacion"  class="form-control " id="estado_cotizacionAgregarDatos"  placeholder="estado_cotizacion" maxlength="250">
</div>
<div class="form-group col-span-12 sm:col-span-4 md:col-span-4 lg:col-span-4 xl:col-span-4" >
<label for="no_facturaAgregarDatos">NO_FACTURA</label>
<input type="input" v-model="datoscamposCotizacion.no_factura" name="no_factura"  class="form-control " id="no_facturaAgregarDatos"  placeholder="no_factura" maxlength="250">
</div>
<div class="form-group col-span-12 sm:col-span-4 md:col-span-4 lg:col-span-4 xl:col-span-4" >
<label for="fecha_cambioAgregarDatos">FECHA_CAMBIO</label>
<input type="input" v-model="datoscamposCotizacion.fecha_cambio" name="fecha_cambio"  class="form-control " id="fecha_cambioAgregarDatos"  placeholder="fecha_cambio" maxlength="250">
</div>
<div class="form-group col-span-12 sm:col-span-4 md:col-span-4 lg:col-span-4 xl:col-span-4" >
<label for="entidad_financieraAgregarDatos">ENTIDAD_FINANCIERA</label>
<input type="input" v-model="datoscamposCotizacion.entidad_financiera" name="entidad_financiera"  class="form-control " id="entidad_financieraAgregarDatos"  placeholder="entidad_financiera" maxlength="250">
</div>
<div class="form-group col-span-12 sm:col-span-4 md:col-span-4 lg:col-span-4 xl:col-span-4" >
<label for="vencimientoAgregarDatos">VENCIMIENTO</label>
<input type="input" v-model="datoscamposCotizacion.vencimiento" name="vencimiento"  class="form-control " id="vencimientoAgregarDatos"  placeholder="vencimiento" maxlength="250">
</div>
<div class="form-group col-span-12 sm:col-span-12 md:col-span-12 lg:col-span-12 xl:col-span-12" >
<label for="notaAgregarDatos">NOTA</label>
<textarea class="form-control " v-model="datoscamposCotizacion.nota" id="notaAgregarDatos" name="nota" cols="30" rows="3" ></textarea>
</div>
<div class="form-group col-span-12 sm:col-span-4 md:col-span-4 lg:col-span-4 xl:col-span-4" >
<label for="yearAgregarDatos">YEAR</label>
<input type="input" v-model="datoscamposCotizacion.year" name="year"  class="form-control " id="yearAgregarDatos"  placeholder="year" maxlength="250">
</div>
<div class="form-group col-span-12 sm:col-span-4 md:col-span-4 lg:col-span-4 xl:col-span-4" >
<label for="mesAgregarDatos">MES</label>
<input type="input" v-model="datoscamposCotizacion.mes" name="mes"  class="form-control " id="mesAgregarDatos"  placeholder="mes" maxlength="250">
</div>
<div class="form-group col-span-12 sm:col-span-4 md:col-span-4 lg:col-span-4 xl:col-span-4" >
<label for="horaAgregarDatos">HORA</label>
<input type="input" v-model="datoscamposCotizacion.hora" name="hora"  class="form-control " id="horaAgregarDatos"  placeholder="hora" maxlength="250">
</div>
<div class="form-group col-span-6" hidden>
<label for="created_atAgregarDatos">CREATED_AT</label>
<input type="input" v-model="datoscamposCotizacion.created_at" name="created_at"  class="form-control " id="created_atAgregarDatos"  placeholder="created_at" maxlength="">
</div>
<div class="form-group col-span-6" hidden>
<label for="updated_atAgregarDatos">UPDATED_AT</label>
<input type="input" v-model="datoscamposCotizacion.updated_at" name="updated_at"  class="form-control " id="updated_atAgregarDatos"  placeholder="updated_at" maxlength="">
</div>
<div class="form-group col-span-12" hidden>
<label for="usuarioAgregarDatos">USUARIO</label>
<input type="input" v-model="datoscamposCotizacion.usuario" name="usuario"  class="form-control " id="usuarioAgregarDatos"  placeholder="usuario" maxlength="250">
</div>
<div class="form-group sm:col-span-12 mb-5 mt-5">
<button type="submit" @click="enviarDatos" class="btn btn-primary elboton w-100">Enviar Datos</button>
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
