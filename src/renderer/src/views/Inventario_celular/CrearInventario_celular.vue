
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
generarTablaFromStringJSON,
envioElectron,
generarCodigoUnico } from '@/funciones/funciones.js';
import Swal from 'sweetalert2'
const toast = useToast();
/************************************************************************/
import TablaJSON from '@/components/TablaJSON.vue'
import AutoCompletar from '@/components/AutoCompletar.vue'
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
const buscador = ref('')
const allImei = ref([])
/************************************************************************/
const datoscamposInventario_celular = ref({})
const codigoUnico = ref(generarCodigoUnico());
const fecha = ref(nfecha('fecha'));
const position = "top";
/************************************************************************/
async function campos() {
  const campos = await arrayToObjetoFromTabla('inventario_celular');
  datoscamposInventario_celular.value = campos;
  datoscamposInventario_celular.value.fecha = nfecha('fecha');
  datoscamposInventario_celular.value.hora = nfecha('hora');
  datoscamposInventario_celular.value.total_inventario = 0;
  datoscamposInventario_celular.value.celulares_iventariados = [];
   const datosFiltrados = allImei.value.filter(ft=>ft.almacen === datosEmpresa.empresa.nombre)
   //const datosFiltrados = allImei.value.filter(ft=>ft.estado === 'DISPONIBLE')
    datoscamposInventario_celular.value.total_celulares = datosFiltrados.filter(ft=>ft.estado === 'DISPONIBLE').length
    datoscamposInventario_celular.value.total_celulares_vendidos = datosFiltrados.filter(ft=>ft.estado === 'VENDIDO').length

for (let cel of datosFiltrados) {
  const datosCell = {
    equipo: cel.equipo,
    imei: cel.imei,
    precio: cel.precio_venta,
    estado: cel.estado,
    inventariado: "☐" // 👈 dibuja un cuadrito vacío
  };
  datoscamposInventario_celular.value.celulares_iventariados.push(datosCell);
}

  


}
/************************************************************************/
const fetchAndSetupDataIMEI = async () => {
const response = await peticionesFetchOffline('getDataAsArray', 'imei');
    const jsonData = response.reverse();
    allImei.value = jsonData;
};
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
await fetchAndSetupDataIMEI()
await campos()
});
/************************************************************************/
async function enviarDatos(event) {
  if(event){

    event.preventDefault();
  }
  const url = link.value+api.value+"/insertar/inventario_celular";
  if (!datoscamposInventario_celular.value) {
    toast.add({ severity: 'error', summary: 'Error', detail: 'Datos incompletos, no se puede Enviar.', life: 3000 });
    return;
  }
  if (datoscamposInventario_celular.value.hasOwnProperty('created_at')) {
     datoscamposInventario_celular.value.created_at = nfecha('timestamp')
     datoscamposInventario_celular.value.updated_at = nfecha('timestamp')
    }

  datoscamposInventario_celular.value.celulares_iventariados = JSON.stringify(datoscamposInventario_celular.value.celulares_iventariados)
  const datosEnviar = JSON.parse(JSON.stringify(datoscamposInventario_celular.value));
  const envioDatos = await peticionesFetchOffline('insertData','inventario_celular', JSON.stringify(datosEnviar));
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
    router.push({ path: `/inventario_celular` });
  }
})
  }else{
    toast.add({ severity: 'error', summary: 'Error', detail: 'Fallo al Agregar los datos.', life: 3000 });
  }
}
/************************************************************************/

const searchIMEI = (selected) => {
  if (selected) {
    const celular = datoscamposInventario_celular.value.celulares_iventariados
      .find(cl => cl.imei === selected.imei);
    console.log("celular", celular);

    if (celular) {
      celular.inventariado = "SI";
      datoscamposInventario_celular.value.total_inventario += parseFloat(celular.precio) || 0
      console.log(`✅ IMEI ${selected.imei} marcado como inventariado.`);
    } else {
      console.warn(`❌ IMEI ${selected.imei} no encontrado en inventario.`);
    }
  }
};




/************************************************************************/
const fnGenerar = async () => {
  const result = await Swal.fire({
    title: '¿Estás seguro?',
    text: "Esta acción no se puede deshacer",
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Sí, continuar',
    cancelButtonText: 'Cancelar'
  });

  if (result.isConfirmed) {
    await enviarDatos()
    // 👉 Aquí pones la lógica cuando confirme
    //Swal.fire('¡Hecho!', 'El proceso se generó correctamente.', 'success');
  } else {
    Swal.fire('Cancelado', 'No se realizó ninguna acción.', 'info');
  }
};

/************************************************************************/
const fnEditarInventario = async (index, datos) => {
  if (!datos) return;

  let continuar = true;

  while (continuar) {
    const result = await Swal.fire({
      title: `Inventario de celular`,
      html: `
        <div style="text-align:left; font-size:14px; line-height:1.6;">
          <p><b>Equipo:</b> ${datos.equipo || "Sin nombre"}</p>
          <p><b>IMEI:</b> ${datos.imei || "-"}</p>
          <p><b>Precio:</b> RD$ ${(parseFloat(datos.precio) || 0).toFixed(2)}</p>
          <p><b>Estado actual:</b> ${datos.estado}</p>
          <p><b>Inventariado:</b>
            <span style="font-weight:bold;color:${
              datos.inventariado === "SI"
                ? "green"
                : datos.inventariado === "NO"
                ? "red"
                : "orange"
            }">
              ${datos.inventariado}
            </span>
          </p>
          <hr style="margin:8px 0;">
          <p style="text-align:center;">¿El celular está físicamente en el inventario?</p>
        </div>
      `,
      showCancelButton: true,
      showDenyButton: true,
      showConfirmButton: true,
      confirmButtonText: '✅ Está',
      denyButtonText: '❌ No está',
      cancelButtonText: 'Cerrar',
      confirmButtonColor: '#16a34a',
      denyButtonColor: '#dc2626',
      cancelButtonColor: '#6b7280',
      allowOutsideClick: false,
      allowEscapeKey: false,
    });

    // ✅ Está (marca como inventariado)
    if (result.isConfirmed) {
      if (datos.inventariado !== "SI") {
        datos.inventariado = "SI";
        datoscamposInventario_celular.value.total_inventario += parseFloat(datos.precio) || 0;
      }

      await Swal.fire({
        icon: 'success',
        title: 'Inventariado',
        text: `${datos.equipo} con IMEI ${datos.imei} está confirmado.`,
        timer: 1000,
        showConfirmButton: false
      });
      continuar = false;
    }

    // ❌ No está (marca como faltante)
    if (result.isDenied) {
      if (datos.inventariado === "SI") {
        datoscamposInventario_celular.value.total_inventario -= parseFloat(datos.precio) || 0;
      }
      datos.inventariado = "NO";

      await Swal.fire({
        icon: 'warning',
        title: 'No encontrado',
        text: `${datos.equipo} con IMEI ${datos.imei} marcado como faltante.`,
        timer: 1000,
        showConfirmButton: false
      });
      continuar = false;
    }

    // 🚪 Cerrar
    if (result.dismiss === Swal.DismissReason.cancel) {
      continuar = false;
      await Swal.fire({
        icon: 'info',
        title: 'Cerrado',
        text: 'Sin cambios realizados.',
        timer: 800,
        showConfirmButton: false
      });
    }
  }
};


/************************************************************************/
</script>
<template>
<main class="content-wrapper">
  <div class="w-full px-4 mt-5 card">
<Fieldset legend="Datos de Inventario_celular">
      <div class="flex">
        <Button as="router-link" icon="pi pi-home" to="/inventario_celular" />
        <Button class="ml-2" label="Generar" icon="pi pi-check" @click="fnGenerar" />
      </div>
</Fieldset>

<section>
<Fieldset legend="Campos">
    <form id="formularioGenerar" action="" method="">
         <div class="box-body">
          <div class="grid grid-cols-12 gap-4 mt-4 text-blue-600" id="campos">

<div class="col-span-12 sm:col-span-12 md:col-span-2 lg:col-span-2 xl:col-span-2 2xl:col-span-2">
                    <label for="fecha" class="block text-sm font-medium text-gray-700 dark:text-gray-400">BUSCADOR</label>
     <AutoCompletar
      v-model="buscador"
      :list="allImei"
       placeholder="IMEI"
       optionLabel="imei"
       :mostrarAlFocus="true"
       @selectComplete="searchIMEI"
    /> 
                </div>

<div class="col-span-12 sm:col-span-12 md:col-span-2 lg:col-span-2 xl:col-span-2 2xl:col-span-2">
                    <label for="fecha" class="block text-sm font-medium text-gray-700 dark:text-gray-400">FECHA</label>
                    <InputText type="text" fluid class=" "  v-model="datoscamposInventario_celular.fecha" placeholder="fecha" name="crearfecha" id="fecha" readonly />
                </div>
<div class="col-span-12 sm:col-span-12 md:col-span-2 lg:col-span-2 xl:col-span-2 2xl:col-span-2">
                    <label for="hora" class="block text-sm font-medium text-gray-700 dark:text-gray-400">HORA</label>
                    <InputText type="text" fluid class=" "  v-model="datoscamposInventario_celular.hora" placeholder="hora" name="crearhora" id="hora" readonly />
                </div>

<div class="col-span-12 sm:col-span-12 md:col-span-2 lg:col-span-2 xl:col-span-2 2xl:col-span-2">
                    <label for="total_celulares" class="block text-sm font-medium text-gray-700 dark:text-gray-400">CELULARES DISPONIBLES</label>
                    <InputText type="text" fluid class=" "  v-model="datoscamposInventario_celular.total_celulares" placeholder="total_celulares" name="creartotal_celulares" id="total_celulares" readonly />
                </div>

<div class="col-span-12 sm:col-span-12 md:col-span-2 lg:col-span-2 xl:col-span-2 2xl:col-span-2">
                    <label for="total_celulares" class="block text-sm font-medium text-gray-700 dark:text-gray-400">CELULARES VENDIDOS</label>
                    <InputText type="text" fluid class=" "  v-model="datoscamposInventario_celular.total_celulares_vendidos" placeholder="total_celulares" name="creartotal_celulares" id="total_celulares" readonly />
                </div>

<div class="col-span-12 sm:col-span-12 md:col-span-2 lg:col-span-2 xl:col-span-2 2xl:col-span-2">
                    <label for="total_inventario" class="block text-sm font-medium text-gray-700 dark:text-gray-400">TOTAL_INVENTARIO</label>
                    <InputText type="text" fluid class=" "  v-model="datoscamposInventario_celular.total_inventario" placeholder="total_inventario" name="creartotal_inventario" id="total_inventario" readonly />
                </div>

<div class="col-span-12 sm:col-span-12 md:col-span-12 lg:col-span-12 xl:col-span-12 2xl:col-span-12">
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-400" for="celulares_iventariados">CELULARES_IVENTARIADOS</label>
<!--                      <div class="table-responsive rounded mb-2 overflow-x-auto">
                      <div v-html="generarTablaFromStringJSON(datoscamposInventario_celular.celulares_iventariados)" class="border p-3 rounded mb-2">
                      </div>
                     </div> -->
<TablaJSON tableId="tablainventario"  :productos="datoscamposInventario_celular.celulares_iventariados" :onClickProducto="fnEditarInventario" :botones="true" />

                   </div>

<div class="form-group col-span-6" hidden>
<label for="created_atAgregarDatos">CREATED_AT</label>
<input type="input" v-model="datoscamposInventario_celular.created_at" name="created_at"  class="form-control " id="created_atAgregarDatos"  placeholder="created_at" maxlength="">
</div>
<div class="form-group col-span-6" hidden>
<label for="updated_atAgregarDatos">UPDATED_AT</label>
<input type="input" v-model="datoscamposInventario_celular.updated_at" name="updated_at"  class="form-control " id="updated_atAgregarDatos"  placeholder="updated_at" maxlength="">
</div>

<div class="form-group col-span-12" hidden>
<label for="usuarioAgregarDatos">USUARIO</label>
<input type="input" v-model="datoscamposInventario_celular.usuario" name="usuario"  class="form-control " id="usuarioAgregarDatos"  placeholder="usuario" maxlength="250">
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

