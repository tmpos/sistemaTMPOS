
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
import AutoCompletar from '@/components/AutoCompletar.vue'
/************************************************************************/
import flatPickr from 'vue-flatpickr-component';
import 'flatpickr/dist/flatpickr.css';
/************************************************************************/
  const basic = ref({
    dateFormat: 'd/m/Y',
  });
/************************************************************************/
const allproducto = ref([])
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
const todosLosinventario_accesorios = ref([]);
/************************************************************************/
const fetchAllData = async () => {
    const response = await peticionesFetchOffline('getDataAsArray', 'inventario_accesorios');
    const jsonData = response;
    todosLosinventario_accesorios.value = response;
    datoscampos.value = jsonData.find(datos=>datos.id == route.params.id)
    datoscampos.value.accesorios_iventariados = JSON.parse(datoscampos.value.accesorios_iventariados)

};
/************************************************************************/
async function navigate(action) {

    const currentIndex = todosLosinventario_accesorios.value.findIndex(notacredito => notacredito.id == route.params.id);
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
            newIndex = currentIndex + 1 < todosLosinventario_accesorios.value.length ? currentIndex + 1 : currentIndex;
            break;
        case 'ultimo':
            newIndex = todosLosinventario_accesorios.value.length - 1;
            break;
        default:
            return;
    }
    datoscampos.value = todosLosinventario_accesorios.value[newIndex];
    router.push({ path: `/editarinventario_accesorios/${todosLosinventario_accesorios.value[newIndex].id}` });
    datoscampos.value.accesorios_iventariados = JSON.parse(datoscampos.value.accesorios_iventariados)
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
const response = await peticionesFetchOffline('getDataAsArray', 'productos');
    const jsonData = response.reverse();
    allproducto.value = jsonData.filter(pr=>pr.categoria !== 'CELULARES');
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
  const url = link.value+api.value+"/actualizarcampos/inventario_accesorios";
  if (!datoscampos.value) {
    console.error("Datos incompletos, no se puede actualizar.");
    return;
  }
  if (datoscampos.value.hasOwnProperty('created_at')) {
      datoscampos.value.updated_at = nfecha('timestamp')
    }

    datoscampos.value.accesorios_iventariados = JSON.stringify(datoscampos.value.accesorios_iventariados)
  const datosEnviar = JSON.parse(JSON.stringify(datoscampos.value));
  const envioDatos = await peticionesFetchOffline('updateData','inventario_accesorios', JSON.stringify(datosEnviar));
  if (envioDatos[0] == 'ok') {
     toast.add({ severity: 'success', summary: 'Éxito', detail: 'Datos Actualizados', life: 3000 });
     datoscampos.value.accesorios_iventariados = JSON.parse(datoscampos.value.accesorios_iventariados)
  }else{
    toast.add({ severity: 'error', summary: 'Error', detail: 'Fallo al actualizar los datos.', life: 3000 });
  }
}
/************************************************************************/
const fnPrint = async () => {
  try {
    const doc = new jsPDF();

    // 🔹 Parsear accesorios_iventariados
    let accesorios = [];
    try {
      accesorios = datoscampos.value.accesorios_iventariados 
    } catch (e) {
      console.error("Error al parsear accesorios_iventariados", e);
    }

    // 🔹 Contar accesorios inventariados (SI)
    //const accesoriosContados = accesorios.filter(cel => cel.inventariado === "SI").length;
    const accesoriosContados = accesorios.reduce((acc, item) => {
      return acc + (parseFloat(item.cantidad_contada) || 0);
    }, 0);

    // 🔹 Total accesorios registrados en el inventario
    const totalaccesorios = parseInt(datoscampos.value.total_accesorioses) || accesorios.length || 0;

    // 🔹 Calcular faltantes
    const accesoriosFaltantes = totalaccesorios - accesoriosContados;

    // 🔹 Encabezado
    doc.setFontSize(16);
    doc.text("Reporte de Inventario Productos", 10, 20);

    doc.setFontSize(12);
    doc.text(`Fecha: ${datoscampos.value.fecha || ""}`, 10, 35);
    doc.text(`Hora: ${datoscampos.value.hora || ""}`, 10, 45);
    doc.text(`Total accesorios: ${totalaccesorios}`, 10, 55);
    doc.text(`Total Inventario: ${datoscampos.value.total_inventario || ""}`, 10, 65);
    doc.text(`accesorios Contados: ${accesoriosContados}`, 10, 75);
    doc.text(`accesorios Faltantes: ${accesoriosFaltantes}`, 10, 85);

    // 🔹 Crear tabla con los datos
    if (Array.isArray(accesorios) && accesorios.length > 0) {
      const tableData = accesorios.map((cel, i) => [
        i + 1,
        cel.codigo || "",
        cel.producto || "",
        cel.cantidad || "",
        cel.precio || "",
        cel.cantidad_contada,
        cel.inventariado || "☐"
      ]);

      autoTable(doc, {
        head: [["#", "Codigo", "Producto", "Cantidad", "Precio","Cantidad Contada", "Inventariado"]],
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
      doc.text("No hay accesorios inventariados", 10, 95);
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
      celulares = JSON.parse(datoscampos.value.accesorios_iventariados || "[]");
    } catch (e) {
      console.error("❌ Error al parsear accesorios_iventariados", e);
      return;
    }

    const celular = celulares.find(cl => cl.imei === selected.imei);

    if (celular) {
      // Marcar como inventariado
      celular.inventariado = "SI";

      // Reemplazar el array modificado
      datoscampos.value.accesorios_iventariados = JSON.stringify(celulares);

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
      title: `Inventario de accesorio`,
      html: `
        <div style="text-align:left; font-size:14px; line-height:1.6;">
          <p><b>Producto:</b> ${datos.equipo || datos.nombre || "Sin nombre"}</p>
          <p><b>Código / IMEI:</b> ${datos.imei || datos.codigo_barra || "-"}</p>
          <p><b>Precio:</b> RD$ ${(parseFloat(datos.precio) || 0).toFixed(2)}</p>
          <p><b>Cantidad registrada:</b> ${datos.cantidad || 0}</p>
          <p><b>Cantidad contada:</b> ${datos.cantidad_contada || 0}</p>
          <p><b>Estado actual:</b> 
            <span style="font-weight:bold;color:${
              datos.inventariado === "COMPLETO"
                ? "green"
                : datos.inventariado === "INCOMPLETO"
                ? "red"
                : "orange"
            }">${datos.inventariado || "SIN VERIFICAR"}</span>
          </p>
          <hr>
          <label for="inputManual">🧮 Cantidad manual:</label>
          <input id="inputManual" type="number" min="0" step="1"
                 class="swal2-input" value="${datos.cantidad_contada || 0}" placeholder="Ej: 1">
        </div>
      `,
      showDenyButton: true,
      showCancelButton: true,
      showConfirmButton: true,
      confirmButtonText: '✅ Confirmar manual',
      denyButtonText: '📦 Marcar completo',
      cancelButtonText: 'Cerrar',
      confirmButtonColor: '#16a34a',
      denyButtonColor: '#2563eb',
      cancelButtonColor: '#6b7280',
      allowOutsideClick: false,
      allowEscapeKey: false,
    });

    // ✅ CONFIRMAR MANUAL
    if (result.isConfirmed) {
      const manualValue = parseFloat(document.getElementById('inputManual').value);
      if (isNaN(manualValue)) {
        await Swal.fire('❌', 'Debes ingresar un número válido', 'error');
        continue;
      }

      const anterior = parseFloat(datos.cantidad_contada || 0);
      const diferencia = manualValue - anterior;
      const precio = parseFloat(datos.precio) || 0;

      // 🔹 Actualiza los campos
      datos.cantidad_contada = manualValue;

      // 🔹 Determina estado
      datos.inventariado =
        manualValue === parseFloat(datos.cantidad || 0) ? "COMPLETO" : "INCOMPLETO";

      // 🔹 Ajusta el total del inventario (solo la diferencia)
      datoscampos.value.total_inventario += diferencia * precio;

      await Swal.fire({
        icon: 'success',
        title: 'Actualizado ✅',
        text: `${datos.equipo || "Producto"}: ${manualValue} de ${datos.cantidad} (${datos.inventariado})`,
        timer: 1500,
        showConfirmButton: false,
      });
      continuar = false;
    }

    // 📦 MARCAR COMPLETO (cantidad contada = cantidad real)
    if (result.isDenied) {
      const cantidadReal = parseFloat(datos.cantidad || 0);
      const anterior = parseFloat(datos.cantidad_contada || 0);
      const diferencia = cantidadReal - anterior;
      const precio = parseFloat(datos.precio) || 0;

      datos.cantidad_contada = cantidadReal;
      datos.inventariado = "COMPLETO";

      datoscampos.value.total_inventario += diferencia * precio;

      await Swal.fire({
        icon: 'success',
        title: 'Completado ✅',
        text: `${datos.equipo || "Producto"} marcado como COMPLETO.`,
        timer: 1000,
        showConfirmButton: false
      });
      continuar = false;
    }

    // ❌ CERRAR SIN CAMBIOS
    if (result.dismiss === Swal.DismissReason.cancel) {
      await Swal.fire({
        icon: 'info',
        title: 'Cerrado',
        text: 'Sin cambios realizados.',
        timer: 800,
        showConfirmButton: false
      });
      continuar = false;
    }
  }
};

/************************************************************************/
const fnReajustarInventarioReal = async () => {
  const inventario = datoscampos.value;

  // 🧩 Verifica datos válidos
  if (!inventario || !inventario.accesorios_iventariados || !Array.isArray(inventario.accesorios_iventariados)) {
    await Swal.fire('❌', 'No hay datos válidos del inventario para reajustar.', 'error');
    return;
  }

  // 🔹 Confirmación
  const confirm = await Swal.fire({
    title: '¿Reajustar el inventario real?',
    html: `
      <b>Esto modificará el stock de todos los productos</b><br>
      según las cantidades contadas en este inventario.<br><br>
      <span style="color:red;">Esta acción no se puede deshacer.</span>
    `,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Sí, reajustar',
    cancelButtonText: 'Cancelar',
    confirmButtonColor: '#16a34a',
    cancelButtonColor: '#6b7280'
  });

  if (!confirm.isConfirmed) return;

  let cambios = [];
  let errores = [];

  // 🔁 Recorre cada producto inventariado
  for (const item of inventario.accesorios_iventariados) {
    try {
      const codigo = item.codigo;
      const nuevaCantidad = parseFloat(item.cantidad_contada) || 0;

      // 🔎 Busca producto en la tabla productos
      const producto = allproducto.value.find(p => p.codigo_barra === codigo);
      if (!producto) {
        errores.push(`No encontrado: ${item.producto || codigo}`);
        continue;
      }

      // 🔹 Si hay diferencia entre stock actual y contado
      const stockAnterior = parseFloat(producto.stock) || 0;
      if (stockAnterior !== nuevaCantidad) {
        producto.stock = nuevaCantidad;

        // 🔸 Actualiza en la base local
        const nuevoStock = await peticionesFetchOffline('updateData', 'productos', JSON.stringify(producto));

        // 🔹 Guarda resumen de cambio
        cambios.push({
          codigo: producto.codigo_barra,
          nombre: producto.nombre,
          anterior: stockAnterior,
          nuevo: nuevaCantidad
        });
      }
    } catch (err) {
      errores.push(`Error con ${item.producto || item.codigo}: ${err.message}`);
    }
  }

  // ✅ Resultado final
  if (cambios.length > 0) {
    let resumen = `
      <table style="width:100%;border-collapse:collapse;font-size:13px;">
        <tr style="background:#2563eb;color:#fff;">
          <th style="padding:4px;">Código</th>
          <th style="padding:4px;">Producto</th>
          <th style="padding:4px;">Anterior</th>
          <th style="padding:4px;">Nuevo</th>
        </tr>
        ${cambios.map(c => `
          <tr>
            <td style="border:1px solid #ccc;padding:4px;">${c.codigo}</td>
            <td style="border:1px solid #ccc;padding:4px;">${c.nombre}</td>
            <td style="border:1px solid #ccc;padding:4px;text-align:center;">${c.anterior}</td>
            <td style="border:1px solid #ccc;padding:4px;text-align:center;">${c.nuevo}</td>
          </tr>
        `).join('')}
      </table>
    `;

    await Swal.fire({
      title: 'Reajuste completado ✅',
      html: `
        <b>${cambios.length}</b> productos actualizados correctamente.<br><br>
        ${resumen}
      `,
      width: '80%',
      confirmButtonText: 'Aceptar',
      confirmButtonColor: '#2563eb'
    });

    toast.add({ severity: 'success', summary: 'Inventario reajustado', detail: `${cambios.length} productos actualizados.`, life: 5000 });
  } else {
    await Swal.fire('Sin cambios', 'No hubo diferencias de stock que ajustar.', 'info');
  }

  if (errores.length > 0) {
    console.warn('Errores en reajuste:', errores);
    toast.add({ severity: 'warn', summary: 'Advertencia', detail: `${errores.length} productos no se pudieron actualizar.`, life: 4000 });
  }
};
/************************************************************************/
</script>
<template>
<main class="content-wrapper">
  <div class="w-full px-4 mt-5 card">
<Fieldset legend="Datos de inventario_accesorios">


    <div class="flex space-x-2">
      
<Button as="router-link" icon="pi pi-home" to="/inventario_accesorios" />
<Button as="router-link" class="ms-1" icon="pi pi-plus-circle" to="/crearinventario_accesorios" />

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

    <Button 
      label="🔄 Reajustar Inventario Real" 
      severity="warning"
      class="ml-2"
      @click="fnReajustarInventarioReal"
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

<InputGroup>
    <InputGroupAddon>
        <Button icon="pi pi-minus" severity="secondary" @click="fnRestarCantidad" />
    </InputGroupAddon>
     <AutoCompletar
      v-model="buscador"
      :list="allproducto"
       placeholder="Producto"
       optionLabel="codigo_barra"
       :mostrarAlFocus="true"
       @selectComplete="searchIMEI"
    /> 
    <InputGroupAddon>
        <Button icon="pi pi-plus" severity="secondary" @click="fnSumarCantidad" />
    </InputGroupAddon>
</InputGroup>


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
                    <label for="total_accesorios" class="block text-sm font-medium text-gray-700 dark:text-gray-400">ACC. DISP.</label>
                    <InputText type="text" fluid class=" "  v-model="datoscampos.total_accesorios" placeholder="total_accesorios" name="creartotal_accesorios" id="total_accesorios" readonly />
                </div>

<div class="col-span-12 sm:col-span-12 md:col-span-2 lg:col-span-2 xl:col-span-2 2xl:col-span-2">
                    <label for="total_accesorios" class="block text-sm font-medium text-gray-700 dark:text-gray-400">ACC. CONTADOS</label>
                    <InputText type="text" fluid class=" "  v-model="datoscampos.total_accesorios_vendidos" placeholder="total_accesorios" name="creartotal_accesorios" id="total_accesorios" readonly />
                </div>

<div class="col-span-12 sm:col-span-12 md:col-span-2 lg:col-span-2 xl:col-span-2 2xl:col-span-2">
                    <label for="total_inventario" class="block text-sm font-medium text-gray-700 dark:text-gray-400">TOTAL_INVENTARIO</label>
                    <InputText type="text" fluid class=" "  v-model="datoscampos.total_inventario" placeholder="total_inventario" name="creartotal_inventario" id="total_inventario" readonly />
                </div>

<div class="col-span-12 sm:col-span-12 md:col-span-12 lg:col-span-12 xl:col-span-12 2xl:col-span-12">
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-400" for="accesorios_iventariados">accesorios_iventariados</label>
<TablaJSON tableId="tablainventario"  :productos="datoscampos.accesorios_iventariados" :onClickProducto="fnEditarInventario" :botones="true" />
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

