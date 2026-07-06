
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
const allproducto = ref([])
/************************************************************************/
const datoscamposInventario_accesorios = ref({})
const codigoUnico = ref(generarCodigoUnico());
const fecha = ref(nfecha('fecha'));
const position = "top";
/************************************************************************/
async function campos() {
  const campos = await arrayToObjetoFromTabla('inventario_accesorios');
  datoscamposInventario_accesorios.value = campos;
  datoscamposInventario_accesorios.value.fecha = nfecha('fecha');
  datoscamposInventario_accesorios.value.hora = nfecha('hora');
  datoscamposInventario_accesorios.value.total_inventario = 0;
  datoscamposInventario_accesorios.value.accesorios_iventariados = [];
   const datosFiltrados = allproducto.value.filter(ft=>ft.almacen === datosEmpresa.empresa.nombre)
   //const datosFiltrados = allproducto.value.filter(ft=>ft.estado === 'DISPONIBLE')
    // ✅ calcular total de stock de accesorios
    datoscamposInventario_accesorios.value.total_accesorios = datosFiltrados.reduce((acc, item) => {
      return acc + (parseFloat(item.stock) || 0);
    }, 0);

    datoscamposInventario_accesorios.value.total_accesorios_vendidos = 0

for (let cel of datosFiltrados) {
  const datosCell = {
    codigo: cel.codigo_barra,
    producto: cel.nombre,
    cantidad: cel.stock,
    precio: cel.precio_venta,
    cantidad_contada: 0,
    inventariado: "NO" // 👈 dibuja un cuadrito vacío
  };
  datoscamposInventario_accesorios.value.accesorios_iventariados.push(datosCell);
}

  


}
/************************************************************************/
const fetchAndSetupDataIMEI = async () => {
const response = await peticionesFetchOffline('getDataAsArray', 'productos');
    const jsonData = response.reverse();
    allproducto.value = jsonData.filter(pr=>pr.categoria !== 'CELULARES');
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
  if (event) event.preventDefault();

  const url = link.value + api.value + "/insertar/inventario_accesorios";

  if (!datoscamposInventario_accesorios.value) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Datos incompletos, no se puede enviar.',
      life: 3000
    });
    return;
  }

  // 🕒 Marcar timestamps
  if (datoscamposInventario_accesorios.value.hasOwnProperty('created_at')) {
    datoscamposInventario_accesorios.value.created_at = nfecha('timestamp');
    datoscamposInventario_accesorios.value.updated_at = nfecha('timestamp');
  }

  // 🧩 Convertir accesorios a string antes de guardar
  const copia = JSON.parse(JSON.stringify(datoscamposInventario_accesorios.value));
  copia.accesorios_iventariados = JSON.stringify(datoscamposInventario_accesorios.value.accesorios_iventariados);

  const envioDatos = await peticionesFetchOffline('insertData', 'inventario_accesorios', JSON.stringify(copia));

  if (envioDatos[0] === 'ok') {
    toast.add({
      severity: 'success',
      summary: 'Éxito',
      detail: 'Inventario generado con éxito.',
      life: 3000
    });

    // 🔄 Restaurar el array original
    datoscamposInventario_accesorios.value.accesorios_iventariados = JSON.parse(copia.accesorios_iventariados);

    // 🧭 Opciones después de generar
    const result = await Swal.fire({
      title: "Inventario generado correctamente",
      html: `
        <p>¿Qué deseas hacer ahora?</p>
      `,
      icon: "question",
      showCancelButton: true,
      showDenyButton: true,
      confirmButtonText: "➕ Agregar otro",
      denyButtonText: "🔁 Reajustar inventario real",
      cancelButtonText: "🏠 Regresar al inicio",
      confirmButtonColor: "#16a34a",
      denyButtonColor: "#2563eb",
      cancelButtonColor: "#6b7280"
    });

    // ➕ Agregar otro
    if (result.isConfirmed) {
      await fetchAndSetupDataIMEI(); // recarga productos
      await campos(); // reinicia formulario
    }
    // 🔁 Reajustar inventario real
    else if (result.isDenied) {
      const confirmar = await Swal.fire({
        title: '¿Deseas reajustar el inventario real?',
        html: `
          <p>Esto actualizará el <b>stock</b> de los productos con la cantidad contada.</p>
          <p style="color:red;font-weight:bold;">⚠️ Esta acción no se puede deshacer.</p>
        `,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Sí, reajustar ahora',
        cancelButtonText: 'Cancelar',
        confirmButtonColor: '#2563eb',
        cancelButtonColor: '#6b7280'
      });

      if (confirmar.isConfirmed) {
        await fnReajustarInventarioReal();
      } else {
        Swal.fire({
          icon: 'info',
          title: 'Reajuste cancelado',
          text: 'Puedes hacerlo más tarde desde el inventario generado.',
          timer: 1500,
          showConfirmButton: false
        });
      }
    }
    // 🏠 Regresar al inicio
    else if (result.dismiss === Swal.DismissReason.cancel) {
      router.push({ path: `/inventario_accesorios` });
    }

  } else {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Fallo al agregar los datos.',
      life: 3000
    });
  }
}

/************************************************************************/

const searchIMEI = (selected) => {
  if (selected) {
    const accesorios = datoscamposInventario_accesorios.value.accesorios_iventariados
      .find(cl => cl.codigo === selected.codigo_barra);

    if (accesorios) {
      // ✅ marcar como inventariado
      accesorios.inventariado = "SI";

      // ✅ sumar precio al total de inventario
      datoscamposInventario_accesorios.value.total_inventario += parseFloat(accesorios.precio) || 0;

      // ✅ manejar cantidad_contada (inicializar si no existe y luego sumar)
      const cantidadActual = parseFloat(accesorios.cantidad_contada) || 0;
      accesorios.cantidad_contada = cantidadActual + parseFloat(selected.cantidad || 1);

      datoscamposInventario_accesorios.value.total_accesorios_vendidos = parseFloat(datoscamposInventario_accesorios.value.total_accesorios_vendidos) + 1


      buscador.value = '';
      console.log(`✅ codigo_barra ${selected.codigo_barra} marcado como inventariado. Cantidad contada: ${accesorios.cantidad_contada}`);
    } else {
      console.warn(`❌ codigo_barra ${selected.codigo_barra} no encontrado en inventario.`);
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
const fnRestarCantidad = ()=>{
  const selected = buscador.value
      const accesorios = datoscamposInventario_accesorios.value.accesorios_iventariados
      .find(cl => cl.codigo === selected);

    if (accesorios) {

      // ✅ sumar precio al total de inventario
      datoscamposInventario_accesorios.value.total_inventario -= parseFloat(accesorios.precio) || 0;

      // ✅ manejar cantidad_contada (inicializar si no existe y luego sumar)
      const cantidadActual = parseFloat(accesorios.cantidad_contada) || 0;
      accesorios.cantidad_contada = cantidadActual - 1;
      datoscamposInventario_accesorios.value.total_accesorios_vendidos = parseFloat(datoscamposInventario_accesorios.value.total_accesorios_vendidos) - 1

      console.log(`✅ codigo_barra ${selected} marcado como inventariado. Cantidad contada: ${accesorios.cantidad_contada}`);
    } else {
      console.warn(`❌ codigo_barra ${selected} no encontrado en inventario.`);
    }
}
/************************************************************************/
const fnSumarCantidad = ()=>{
  const selected = buscador.value
      const accesorios = datoscamposInventario_accesorios.value.accesorios_iventariados
      .find(cl => cl.codigo === selected);

    if (accesorios) {
      // ✅ marcar como inventariado
      accesorios.inventariado = "SI";

      // ✅ sumar precio al total de inventario
      datoscamposInventario_accesorios.value.total_inventario += parseFloat(accesorios.precio) || 0;

      // ✅ manejar cantidad_contada (inicializar si no existe y luego sumar)
      const cantidadActual = parseFloat(accesorios.cantidad_contada) || 0;
      accesorios.cantidad_contada = cantidadActual + 1;

      datoscamposInventario_accesorios.value.total_accesorios_vendidos = parseFloat(datoscamposInventario_accesorios.value.total_accesorios_vendidos) + 1

      console.log(`✅ codigo_barra ${selected} marcado como inventariado. Cantidad contada: ${accesorios.cantidad_contada}`);
    } else {
      console.warn(`❌ codigo_barra ${selected} no encontrado en inventario.`);
    }
}
/************************************************************************/
/************************************************************************/
// 🔧 REAJUSTAR INVENTARIO REAL (actualiza tabla productos según conteo)
const fnReajustarInventarioReal = async () => {
  const inventario = datoscamposInventario_accesorios.value;

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
const fnEditarInventario = async (index, datos) => {
  if (!datos) return;

  const { value: accion } = await Swal.fire({
    title: `Inventario de accesorio`,
    html: `
      <div style="text-align:left; font-size:14px; line-height:1.6;">
        <p><b>Producto:</b> ${datos.equipo || datos.producto || "Sin nombre"}</p>
        <p><b>Código / IMEI:</b> ${datos.imei || datos.codigo || "-"}</p>
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
    showCancelButton: true,
    showDenyButton: true,
    showConfirmButton: true,
    confirmButtonText: '✅ Confirmar manual',
    denyButtonText: '📦 Completar',
    cancelButtonText: '❌ Cancelar',
    confirmButtonColor: '#16a34a',
    denyButtonColor: '#2563eb',
    cancelButtonColor: '#6b7280',
    showCloseButton: true,
    footer: `
      <button id="btnEliminar" class="swal2-styled" style="background:#dc2626;">🗑️ Eliminar producto</button>
    `,
    didOpen: () => {
      const btnEliminar = document.getElementById('btnEliminar');
      if (btnEliminar) {
        btnEliminar.addEventListener('click', async () => {
          Swal.close(); // Cierra el primer modal
          const confirmar = await Swal.fire({
            title: '¿Eliminar producto?',
            html: `
              <p>¿Deseas eliminar <b>${datos.producto}</b> del inventario y de la base de datos?</p>
              <p style="color:red;font-weight:bold;">⚠️ Esta acción no se puede deshacer.</p>
            `,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar',
            confirmButtonColor: '#dc2626',
            cancelButtonColor: '#6b7280'
          });

          if (confirmar.isConfirmed) {
            try {
              // 🔹 Eliminar de la base de datos
              const borrador = await peticionesFetchOffline('deleteByField', 'productos', 'codigo_barra', datos.codigo);

              // 🔹 Eliminar del array local
              datoscamposInventario_accesorios.value.accesorios_iventariados.splice(index, 1);

              toast.add({
                severity: 'success',
                summary: 'Producto eliminado',
                detail: `${datos.producto} eliminado correctamente.`,
                life: 2500
              });

              await Swal.fire({
                icon: 'success',
                title: 'Eliminado ✅',
                text: `${datos.producto} fue eliminado correctamente.`,
                timer: 1500,
                showConfirmButton: false
              });
            } catch (error) {
              console.error('Error al eliminar producto:', error);
              toast.add({
                severity: 'error',
                summary: 'Error',
                detail: 'No se pudo eliminar el producto.',
                life: 3000
              });
            }
          }
        });
      }
    }
  });

  // ✅ CONFIRMAR MANUAL
  if (accion === true) {
    const manualValue = parseFloat(document.getElementById('inputManual').value);
    if (isNaN(manualValue)) {
      await Swal.fire('❌', 'Debes ingresar un número válido', 'error');
      return;
    }

    const anterior = parseFloat(datos.cantidad_contada || 0);
    const diferencia = manualValue - anterior;
    const precio = parseFloat(datos.precio) || 0;

    datos.cantidad_contada = manualValue;
    datos.inventariado =
      manualValue === parseFloat(datos.cantidad || 0) ? "COMPLETO" : "INCOMPLETO";
    datoscamposInventario_accesorios.value.total_inventario += diferencia * precio;

    await Swal.fire({
      icon: 'success',
      title: 'Actualizado ✅',
      text: `${datos.nombre || "Producto"}: ${manualValue} de ${datos.cantidad} (${datos.inventariado})`,
      timer: 1500,
      showConfirmButton: false
    });
  }

  // 📦 MARCAR COMPLETO
  if (accion === false) {
    const cantidadReal = parseFloat(datos.cantidad || 0);
    const anterior = parseFloat(datos.cantidad_contada || 0);
    const diferencia = cantidadReal - anterior;
    const precio = parseFloat(datos.precio) || 0;

    datos.cantidad_contada = cantidadReal;
    datos.inventariado = "COMPLETO";
    datoscamposInventario_accesorios.value.total_inventario += diferencia * precio;

    await Swal.fire({
      icon: 'success',
      title: 'Completado ✅',
      text: `${datos.nombre || "Producto"} marcado como COMPLETO.`,
      timer: 1000,
      showConfirmButton: false
    });
  }
};


/************************************************************************/
</script>
<template>
<main class="content-wrapper">
  <div class="w-full px-4 mt-5 card">
<Fieldset legend="Datos de Inventario_accesorios">
      <div class="flex">
        <Button as="router-link" icon="pi pi-home" to="/inventario_accesorios" />
        <Button class="ml-2" label="Generar" icon="pi pi-check" @click="fnGenerar" />
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
                    <InputText type="text" fluid class=" "  v-model="datoscamposInventario_accesorios.fecha" placeholder="fecha" name="crearfecha" id="fecha" readonly />
                </div>
<div class="col-span-12 sm:col-span-12 md:col-span-2 lg:col-span-2 xl:col-span-2 2xl:col-span-2">
                    <label for="hora" class="block text-sm font-medium text-gray-700 dark:text-gray-400">HORA</label>
                    <InputText type="text" fluid class=" "  v-model="datoscamposInventario_accesorios.hora" placeholder="hora" name="crearhora" id="hora" readonly />
                </div>

<div class="col-span-12 sm:col-span-12 md:col-span-2 lg:col-span-2 xl:col-span-2 2xl:col-span-2">
                    <label for="total_accesorios" class="block text-sm font-medium text-gray-700 dark:text-gray-400">ACC. DISP.</label>
                    <InputText type="text" fluid class=" "  v-model="datoscamposInventario_accesorios.total_accesorios" placeholder="total_accesorios" name="creartotal_accesorios" id="total_accesorios" readonly />
                </div>

<div class="col-span-12 sm:col-span-12 md:col-span-2 lg:col-span-2 xl:col-span-2 2xl:col-span-2">
                    <label for="total_accesorios" class="block text-sm font-medium text-gray-700 dark:text-gray-400">ACC. CONTADOS</label>
                    <InputText type="text" fluid class=" "  v-model="datoscamposInventario_accesorios.total_accesorios_vendidos" placeholder="total_accesorios" name="creartotal_accesorios" id="total_accesorios" readonly />
                </div>

<div class="col-span-12 sm:col-span-12 md:col-span-2 lg:col-span-2 xl:col-span-2 2xl:col-span-2">
                    <label for="total_inventario" class="block text-sm font-medium text-gray-700 dark:text-gray-400">TOTAL_INVENTARIO</label>
                    <InputText type="text" fluid class=" "  v-model="datoscamposInventario_accesorios.total_inventario" placeholder="total_inventario" name="creartotal_inventario" id="total_inventario" readonly />
                </div>

<div class="col-span-12 sm:col-span-12 md:col-span-12 lg:col-span-12 xl:col-span-12 2xl:col-span-12">
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-400" for="accesorios_iventariados">ACCESORIOS_IVENTARIADOS</label>
<!--                      <div class="table-responsive rounded mb-2 overflow-x-auto">
                      <div v-html="generarTablaFromStringJSON(datoscamposInventario_accesorios.accesorios_iventariados)" class="border p-3 rounded mb-2">

                      </div>
                     </div> -->
<TablaJSON tableId="tablainventario"  :productos="datoscamposInventario_accesorios.accesorios_iventariados" :onClickProducto="fnEditarInventario" :botones="true" />

                   </div>

<div class="form-group col-span-6" hidden>
<label for="created_atAgregarDatos">CREATED_AT</label>
<input type="input" v-model="datoscamposInventario_accesorios.created_at" name="created_at"  class="form-control " id="created_atAgregarDatos"  placeholder="created_at" maxlength="">
</div>
<div class="form-group col-span-6" hidden>
<label for="updated_atAgregarDatos">UPDATED_AT</label>
<input type="input" v-model="datoscamposInventario_accesorios.updated_at" name="updated_at"  class="form-control " id="updated_atAgregarDatos"  placeholder="updated_at" maxlength="">
</div>

<div class="form-group col-span-12" hidden>
<label for="usuarioAgregarDatos">USUARIO</label>
<input type="input" v-model="datoscamposInventario_accesorios.usuario" name="usuario"  class="form-control " id="usuarioAgregarDatos"  placeholder="usuario" maxlength="250">
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

