
<script setup>
import { ref, onMounted, nextTick, watchEffect,computed } from 'vue';
import axios from 'axios';
import { nfecha, arrayToObjetoFromTabla,envioElectron, peticionesFetch,obtenerIdsSeleccionados, 
crearTablaSiNoExiste,encryptarPassword,buscadorArrayObjeto,peticionesFetchOffline } from '@/funciones/funciones.js';
import Swal from 'sweetalert2'
import { useToast } from "primevue/usetoast";
const toast = useToast();
/************************************************************************/
const usuarioLocal = ref({})
/************************************************************************/
import { useDatosEmpresa } from '@/stores'
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
const datosDefault = ref({
    "logo": true,
    "direccion": true,
    "telefono": true,
    "email": true,
    "legal": false,
    "fecha": true,
    "hora": true,
    "rnc": true,
    "nombre_cliente": true,
    "telefono_cliente": true,
    "direccion_cliente": true,
    "vendedor": true,
    "cajero": true,
    "mesero": false,
    "instalador": false,
    "mesa": false,
    "delivery": false,
    "metodopago": true,
    "comprobante": true,
    "no_factura": true,
    "subtotal": true,
    "descuento": true,
    "impuestos": true,
    "total": true,
    "cambio": true,
    "barcode": true,
    "firma": false,
    "nota": true,
    "empaque": true,
    "ver_switch_dock": true,
    "ver_switch_impresion_rapida": true,
    "ver_switch_facturacion_electronica": true,
    "ver_switch_x_mayor": true
  });
/************************************************************************/
const visible = ref(false);
const visiblecrear = ref(false);
/************************************************************************/
const crearDatosDefaultBase = () => ({
    "logo": true,
    "direccion": true,
    "telefono": true,
    "email": true,
    "legal": false,
    "fecha": true,
    "hora": true,
    "rnc": true,
    "nombre_cliente": true,
    "telefono_cliente": true,
    "direccion_cliente": true,
    "vendedor": true,
    "cajero": true,
    "mesero": false,
    "instalador": false,
    "mesa": false,
    "delivery": false,
    "metodopago": true,
    "comprobante": true,
    "no_factura": true,
    "subtotal": true,
    "descuento": true,
    "impuestos": true,
    "total": true,
    "cambio": true,
    "barcode": true,
    "firma": false,
    "nota": true,
    "empaque": true,
    "ver_switch_dock": true,
    "ver_switch_impresion_rapida": true,
    "ver_switch_facturacion_electronica": true,
    "ver_switch_x_mayor": true
});
/************************************************************************/
watchEffect(() => {
  /*if (visiblecrear.value) {
  }*/
});

/************************************************************************/
    const datosConfig = async()=>{
    const response = await envioElectron('datosarchivo');
    datosJSON.value = response;
    link.value = datosJSON.value.VITE_LINKURL;
    api.value = datosJSON.value.VITE_LINK_API;
    token.value = datosJSON.value.VITE_TOKEN;
    patronTelefono.value = datosJSON.value.VITE_PATRON_TELEFONO;
    tokenCorto.value = datosJSON.value.VITE_TOKEN_CORTO;
    patroncedula.value = datosJSON.value.VITE_PATRON_CEDULA;

if (datosJSON.value.datosDefault) {
  try {
    datosDefault.value = { ...crearDatosDefaultBase(), ...JSON.parse(datosJSON.value.datosDefault) }
  } catch (error) {
    console.warn('❗ Configuración Default:', error)
  }
} else {
  datosDefault.value = crearDatosDefaultBase()
}

}
/************************************************************************/
onMounted(async () => {
await datosConfig()
tokenCifrado.value = await encryptarPassword(token.value, 10);

});
/************************************************************************/
 const guardarConfiguracionFactura = async () => {
    try {

      const datos = datosJSON.value
      datos.datosDefault = JSON.stringify(datosDefault.value)
      const clonedData = JSON.parse(JSON.stringify(datos))
      const envioDatosJSON = await window.electron.ipcRenderer.invoke('actualizarjson', clonedData);
      window.localStorage.setItem('datosDefault', JSON.stringify(datosDefault.value));
      toast.add({ severity: 'success', summary: 'Éxito', detail: 'Datos Actualizados', life: 3000 });
    } catch (error) {
      toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo guardar la configuración', life: 3000 })
    }

}

/************************************************************************/
/**
 * 📦 Agregar una nueva propiedad al objeto datosDefault
 */
const agregarPropiedadFactura = async () => {
  const { value: formValues } = await Swal.fire({
    title: 'Agregar nueva propiedad',
    html: `
      <input id="propKey" class="swal2-input" placeholder="Nombre de la propiedad (ej: mostrar_logo)">
      <select id="propValue" class="swal2-input">
        <option value="true">Activado (true)</option>
        <option value="false">Desactivado (false)</option>
      </select>
    `,
    focusConfirm: false,
    showCancelButton: true,
    confirmButtonText: 'Agregar',
    cancelButtonText: 'Cancelar',
    preConfirm: () => {
      const key = document.getElementById('propKey').value.trim()
      const value = document.getElementById('propValue').value === 'true'
      if (!key) {
        Swal.showValidationMessage('⚠️ Debes escribir un nombre de propiedad')
        return false
      }
      return { key, value }
    }
  })

  if (formValues) {
    const { key, value } = formValues

    // ✅ Verificar si ya existe
    if (datosDefault.value.hasOwnProperty(key)) {
      await Swal.fire({
        icon: 'warning',
        title: 'Propiedad existente',
        text: `La propiedad "${key}" ya existe.`,
        confirmButtonText: 'Aceptar'
      })
      return
    }

    // ➕ Agregar nueva propiedad
    datosDefault.value[key] = value

    await Swal.fire({
      icon: 'success',
      title: 'Agregado',
      text: `La propiedad "${key}" fue añadida correctamente.`,
      confirmButtonText: 'OK'
    })

    // 💾 Guardar automáticamente
    await guardarConfiguracionFactura()
  }
}

/************************************************************************/
/**
 * 🗑️ Eliminar propiedad individual con confirmación
 */
const eliminarPropiedadFactura = async (key) => {
  const confirm = await Swal.fire({
    title: '¿Eliminar propiedad?',
    text: `¿Seguro que deseas eliminar "${key}" de la configuración?`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Sí, eliminar',
    cancelButtonText: 'Cancelar',
    confirmButtonColor: '#d33',
    cancelButtonColor: '#6c757d'
  })

  if (confirm.isConfirmed) {
    delete datosDefault.value[key]

    await Swal.fire({
      icon: 'success',
      title: 'Eliminado',
      text: `La propiedad "${key}" fue eliminada correctamente.`,
      timer: 2000,
      showConfirmButton: false
    })

    await guardarConfiguracionFactura()
  }
}



</script>
<template>
<main class="content-wrapper">
  <div class="mt-5">
<Card class="shadow-lg">
    <template #content>
<fieldset class="border-2 border-gray-200 dark:border-gray-700 p-6 rounded-xl mb-2 bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
  <legend class="float-none w-auto px-4 text-xl font-bold text-gray-700 dark:text-gray-200">
    📋 Configuración de Factura
  </legend>

<div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 mt-4">
  <div
    v-for="(valor, key) in datosDefault"
    :key="key"
    class="group relative bg-white dark:bg-gray-800 rounded-xl p-4 shadow-md hover:shadow-xl transition-all duration-300 border border-gray-200 dark:border-gray-700 hover:border-blue-400 dark:hover:border-blue-500"
  >
    <!-- Switch Container -->
    <div class="flex flex-col items-center justify-center space-y-3">

      <!-- Custom Toggle Switch -->
      <div class="relative">
        <input
          type="checkbox"
          :id="'switch-' + key"
          v-model="datosDefault[key]"
          class="sr-only peer"
        />
        <label
          :for="'switch-' + key"
          class="relative flex items-center cursor-pointer"
        >
          <!-- Toggle Background -->
          <div
            class="w-14 h-7 rounded-full shadow-inner transition-all duration-300"
            :class="datosDefault[key]
              ? 'bg-gradient-to-r from-blue-500 to-blue-600 ring-4 ring-blue-300 dark:ring-blue-800'
              : 'bg-gray-300 dark:bg-gray-600'"
          >
            <!-- Toggle Circle -->
            <div
              class="absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow-lg transition-transform duration-300 transform flex items-center justify-center"
              :class="datosDefault[key] ? 'translate-x-7' : 'translate-x-0'"
            >
              <!-- Icon inside circle -->
              <span v-if="datosDefault[key]" class="text-blue-600 text-xs">✓</span>
              <span v-else class="text-gray-400 text-xs">✕</span>
            </div>
          </div>
        </label>
      </div>

      <!-- Label Text -->
      <div class="text-center">
        <div class="text-sm font-semibold text-gray-700 dark:text-gray-200 capitalize leading-tight break-words">
          {{ key.replace(/_/g, ' ') }}
        </div>
        <div
          class="text-xs font-medium mt-1 transition-colors duration-300"
          :class="datosDefault[key] ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400'"
        >
          {{ datosDefault[key] ? 'Activado' : 'Desactivado' }}
        </div>
      </div>

      <!-- Status Indicator Dot -->
      <div class="absolute top-2 right-2">
        <div
          class="w-2 h-2 rounded-full transition-all duration-300"
          :class="datosDefault[key] ? 'bg-green-500 shadow-lg shadow-green-500/50' : 'bg-gray-400'"
        ></div>
      </div>

      <!-- Delete Button -->
      <Button
        icon="pi pi-trash"
        class="p-button-rounded p-button-text p-button-danger p-button-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300 absolute bottom-2"
        @click="eliminarPropiedadFactura(key)"
        v-tooltip.top="'Eliminar propiedad'"
      />

    </div>
  </div>
</div>


<div class="flex justify-end gap-3 mt-6">

  <Button
    label="Agregar propiedad"
    icon="pi pi-plus"
    severity="info"
    outlined
    @click="agregarPropiedadFactura"
  />
  <Button
    label="Guardar configuración"
    icon="pi pi-save"
    severity="success"
    raised
    size="large"
    @click="guardarConfiguracionFactura"
  />
</div>


</fieldset>
    </template>

</Card>

<!-- ////////////////////////////////////////////////////////////////////////////////////////// -->

<!-- ////////////////////////////////////////////////////////////////////////////////////////// -->
<Toast />
  </div>
</main>
</template>
<style scoped>
</style>
