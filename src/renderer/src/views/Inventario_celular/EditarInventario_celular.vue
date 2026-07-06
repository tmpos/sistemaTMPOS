
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
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
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
const buscador = ref('')
const allImei = ref([])
/************************************************************************/
const datoscampos = ref({})
const codigoUnico = ref(generarCodigoUnico());
const fecha = ref(nfecha('fecha'));
const position = "top";
const todosLosinventario_celular = ref([]);
/************************************************************************/
const fetchAllData = async () => {
    const response = await peticionesFetchOffline('getDataAsArray', 'inventario_celular');
    const jsonData = response;
    todosLosinventario_celular.value = response;
    datoscampos.value = jsonData.find(datos=>datos.id == route.params.id)
    datoscampos.value.celulares_iventariados = JSON.parse(datoscampos.value.celulares_iventariados)

};
/************************************************************************/
async function navigate(action) {

    const currentIndex = todosLosinventario_celular.value.findIndex(notacredito => notacredito.id == route.params.id);
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
            newIndex = currentIndex + 1 < todosLosinventario_celular.value.length ? currentIndex + 1 : currentIndex;
            break;
        case 'ultimo':
            newIndex = todosLosinventario_celular.value.length - 1;
            break;
        default:
            return;
    }
    datoscampos.value = todosLosinventario_celular.value[newIndex];
    router.push({ path: `/editarinventario_celular/${todosLosinventario_celular.value[newIndex].id}` });
    datoscampos.value.celulares_iventariados = JSON.parse(datoscampos.value.celulares_iventariados)
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
const fetchAndSetupDataIMEI = async () => {
const response = await peticionesFetchOffline('getDataAsArray', 'imei');
    const jsonData = response.reverse();
    allImei.value = jsonData;
};
/************************************************************************/
onMounted(async() => {
await datosConfig()
tokenCifrado.value = await encryptarPassword(token.value, 10);
await fetchAllData()
await fetchAndSetupDataIMEI()
});
/************************************************************************/
async function funcionActualizar(e) {
  e.preventDefault();
  const url = link.value+api.value+"/actualizarcampos/inventario_celular";
  if (!datoscampos.value) {
    console.error("Datos incompletos, no se puede actualizar.");
    return;
  }
  if (datoscampos.value.hasOwnProperty('created_at')) {
      datoscampos.value.updated_at = nfecha('timestamp')
    }

    datoscampos.value.celulares_iventariados = JSON.stringify(datoscampos.value.celulares_iventariados)
  const datosEnviar = JSON.parse(JSON.stringify(datoscampos.value));
  const envioDatos = await peticionesFetchOffline('updateData','inventario_celular', JSON.stringify(datosEnviar));
  if (envioDatos[0] == 'ok') {
     toast.add({ severity: 'success', summary: 'Éxito', detail: 'Datos Actualizados', life: 3000 });
     datoscampos.value.celulares_iventariados = JSON.parse(datoscampos.value.celulares_iventariados)
  }else{
    toast.add({ severity: 'error', summary: 'Error', detail: 'Fallo al actualizar los datos.', life: 3000 });
  }
}
/************************************************************************/
const fnPrint = async () => {
  try {
    const doc = new jsPDF();

    // 🔹 Parsear celulares_iventariados
    let celulares = [];
    try {
      celulares = datoscampos.value.celulares_iventariados
    } catch (e) {
      console.error("Error al parsear celulares_iventariados", e);
    }

    // 🔹 Contar celulares inventariados (SI)
    const celularesContados = celulares.filter(cel => cel.inventariado === "SI").length;

    // 🔹 Total celulares registrados en el inventario
    const totalCelulares = parseInt(datoscampos.value.total_celulares) || celulares.length || 0;

    // 🔹 Calcular faltantes
    const celularesFaltantes = totalCelulares - celularesContados;

    // 🔹 Encabezado
    doc.setFontSize(16);
    doc.text("Reporte de Inventario Celular", 10, 20);

    doc.setFontSize(12);
    doc.text(`Fecha: ${datoscampos.value.fecha || ""}`, 10, 35);
    doc.text(`Hora: ${datoscampos.value.hora || ""}`, 10, 45);
    doc.text(`Total Celulares: ${totalCelulares}`, 10, 55);
    doc.text(`Total Inventario: ${datoscampos.value.total_inventario || ""}`, 10, 65);
    doc.text(`Celulares Contados: ${celularesContados}`, 10, 75);
    doc.text(`Celulares Faltantes: ${celularesFaltantes}`, 10, 85);

    // 🔹 Crear tabla con los datos
    if (Array.isArray(celulares) && celulares.length > 0) {
      const tableData = celulares.map((cel, i) => [
        i + 1,
        cel.equipo || "",
        cel.imei || "",
        cel.precio || "",
        cel.estado || "",
        cel.inventariado || "☐"
      ]);

      autoTable(doc, {
        head: [["#", "Equipo", "IMEI", "Precio", "Estado", "Inventariado"]],
        body: tableData,
        startY: 95,
        styles: {
          fontSize: 10,
          halign: "center"
        },
        headStyles: {
          fillColor: [41, 128, 185],
          textColor: 255,
          halign: "center"
        }
      });
    } else {
      doc.text("No hay celulares inventariados", 10, 95);
    }

    // 🔹 Crear un Blob URL para incrustar el PDF
    const pdfBlob = doc.output("blob");
    const pdfUrl = URL.createObjectURL(pdfBlob);

    // 🔹 Mostrar en Swal
    Swal.fire({
      title: "Vista previa del PDF",
      html: `
        <iframe src="${pdfUrl}" width="100%" height="500px" style="border: none;"></iframe>
      `,
      width: "80%",
      heightAuto: true,
      showCancelButton: true,
      confirmButtonText: "Imprimir",
      cancelButtonText: "Cerrar"
    }).then((result) => {
      if (result.isConfirmed) {
        const printWindow = window.open(pdfUrl);
        printWindow.addEventListener("load", () => {
          printWindow.print();
        });
      }
    });
  } catch (error) {
    console.error("❌ Error al generar el PDF:", error);
    toast.add({
      severity: "error",
      summary: "Error",
      detail: "No se pudo generar el PDF",
      life: 4000
    });
  }
};

/************************************************************************/
const searchIMEI = (selected) => {
  if (selected) {
    let celulares = [];

    try {
      celulares = JSON.parse(datoscampos.value.celulares_iventariados || "[]");
    } catch (e) {
      console.error("❌ Error al parsear celulares_iventariados", e);
      return;
    }

    const celular = celulares.find(cl => cl.imei === selected.imei);

    if (celular) {
      // Marcar como inventariado
      celular.inventariado = "SI";

      // Reemplazar el array modificado
      datoscampos.value.celulares_iventariados = JSON.stringify(celulares);

      // Sumar correctamente al total inventario
      const datosTotal = parseFloat(datoscampos.value.total_inventario) || 0;
      const precio = parseFloat(celular.precio) || 0;
      datoscampos.value.total_inventario = datosTotal + precio;

      console.log(`✅ IMEI ${selected.imei} marcado como inventariado.`);
    } else {
      console.warn(`❌ IMEI ${selected.imei} no encontrado en inventario.`);
    }
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
        datoscampos.value.total_inventario += parseFloat(datos.precio) || 0;
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
        datoscampos.value.total_inventario -= parseFloat(datos.precio) || 0;
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


    <div class="flex space-x-2">
      
<Button as="router-link" icon="pi pi-home" to="/inventario_celular" />
<Button as="router-link" class="ms-1" icon="pi pi-plus-circle" to="/crearinventario_celular" />

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
      icon="pi pi-print"
      class="ms-1"
      severity="contrast"
      @click="fnPrint"
    />


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
                    <InputText type="text" fluid class=" "  v-model="datoscampos.fecha" placeholder="fecha" name="crearfecha" id="fecha" readonly />
                </div>
<div class="col-span-12 sm:col-span-12 md:col-span-2 lg:col-span-2 xl:col-span-2 2xl:col-span-2">
                    <label for="hora" class="block text-sm font-medium text-gray-700 dark:text-gray-400">HORA</label>
                    <InputText type="text" fluid class=" "  v-model="datoscampos.hora" placeholder="hora" name="crearhora" id="hora" readonly />
                </div>
<div class="col-span-12 sm:col-span-12 md:col-span-2 lg:col-span-2 xl:col-span-2 2xl:col-span-2">
                    <label for="total_celulares" class="block text-sm font-medium text-gray-700 dark:text-gray-400">TOTAL_CELULARES</label>
                    <InputText type="text" fluid class=" "  v-model="datoscampos.total_celulares" placeholder="total_celulares" name="creartotal_celulares" id="total_celulares" readonly />
                </div>
<div class="col-span-12 sm:col-span-12 md:col-span-2 lg:col-span-2 xl:col-span-2 2xl:col-span-2">
                    <label for="total_inventario" class="block text-sm font-medium text-gray-700 dark:text-gray-400">TOTAL_INVENTARIO</label>
                    <InputText type="text" fluid class=" "  v-model="datoscampos.total_inventario" placeholder="total_inventario" name="creartotal_inventario" id="total_inventario" readonly />
                </div>

<div class="col-span-12 sm:col-span-12 md:col-span-12 lg:col-span-12 xl:col-span-12 2xl:col-span-12">
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-400" for="celulares_iventariados">CELULARES_IVENTARIADOS</label>
<TablaJSON tableId="tablainventario"  :productos="datoscampos.celulares_iventariados" :onClickProducto="fnEditarInventario" :botones="true" />
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

