
<script setup>
import { ref, onMounted, nextTick, watchEffect,computed } from 'vue';
import axios from 'axios';
import { nfecha, arrayToObjetoFromTabla,envioElectron, peticionesFetch,obtenerIdsSeleccionados, 
crearTablaSiNoExiste,encryptarPassword,buscadorArrayObjeto } from '@/funciones/funciones.js';
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
/************************************************************************/
const personaId = ref('123');   // o lo que uses
const minEnroll = ref(70);
const mensaje = ref('');
const imagenHuella = ref('');   // para mostrar el PNG

/************************************************************************/
const visible = ref(false);
const visiblecrear = ref(false);
/************************************************************************/
watchEffect(async() => {
  if (visible.value) {
  }
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

}
/************************************************************************/
onMounted(async () => {
await datosConfig()
tokenCifrado.value = await encryptarPassword(token.value, 10);

/*const respuesta = await window.electron.ipcRenderer.on('registrarHuella:resp', (_evt, resp) => {
  if (resp.ok) {
    // resp.data => JSON del exe: { result, template, png?, scores, ... }
    console.log('Enroll OK:', resp.data);
  } else {
    console.error('Enroll error:', resp.error);
  }
});
  console.log("respuesta", respuesta);*/


});
/************************************************************************/
 const guardarConfiguracionFactura = async () => {
  if (window.electron) {
    try {
      const clonedData = JSON.parse(JSON.stringify(datosJSON.value))
      clonedData.datosDefault = JSON.stringify(datosDefault.value)

      await window.electron.ipcRenderer.invoke('actualizarjson', clonedData)

      toast.add({ severity: 'success', summary: 'Guardado', detail: 'Configuración de factura guardada.', life: 2000 })
    } catch (error) {
      toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo guardar la configuración', life: 3000 })
    }
  } else {
    toast.add({ severity: 'error', summary: 'Error', detail: 'Solo disponible en aplicación Desktop', life: 3000 })
  }
}

/************************************************************************/
async function registrarHuella() {
  if (!window.electron) {
    toast.add({ severity: 'error', summary: 'Solo Desktop', detail: 'Función disponible solo en app de escritorio', life: 2500 });
    return;
  }

  try {
    Swal.fire({ title: 'Enrolando...', html: 'Coloca el mismo dedo 3 veces', allowOutsideClick: false, didOpen: () => Swal.showLoading() });

    const res = await window.electron.ipcRenderer.invoke('registrarHuella', {
      id: personaId.value,
      min: minEnroll.value,
      debug: false
    });

    Swal.close();
      console.log("res", res);
      try{
          let resObject = res.template;
          console.log("resObject", resObject);

      }catch(error){
        console.log("error", error);

      }

    if (res?.result === 'OK') {
      mensaje.value = 'Huella registrada correctamente';
      imagenHuella.value = res.png || ''; // "data:image/png;base64,...."
      toast.add({ severity: 'success', summary: 'OK', detail: `Scores: ${JSON.stringify(res.scores)}`, life: 3000 });
      // Guarda res.template en tu BD aquí
    } else {
      mensaje.value = 'No se pudo registrar (estabilidad baja)';
      toast.add({ severity: 'warn', summary: 'Falló', detail: JSON.stringify(res), life: 4000 });
    }
  } catch (err) {
    Swal.close();
    toast.add({ severity: 'error', summary: 'Error', detail: err.message || String(err), life: 4000 });
  } finally {
    visible.value = false;
  }
}
/************************************************************************/
</script>
<template>
<main class="content-wrapper">
  <div class="mt-5">
<Card>
  
  <div class="flex flex-col space-y-4">
            <div class="text-lg font-bold text-center">Configuración de Huellas</div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium">ID Persona</label>
                <InputText v-model="personaId" />
              </div>
              <div>
                <label class="block text-sm font-medium">Umbral (0–100)</label>
                <InputNumber v-model="minEnroll" :min="0" :max="100" />
              </div>
            </div>

            <div>
              <Button label="Registrar Huella" icon="pi pi-fingerprint" class="p-button-primary" @click="registrarHuella" />
              <p v-if="mensaje" class="mt-2">{{ mensaje }}</p>
              <img v-if="imagenHuella" :src="imagenHuella" alt="Huella" class="mt-2 border rounded max-w-xs" />
            </div>

            <Dialog v-model:visible="visible" header="Registro de Huella" :modal="true" class="p-dialog-sm">
              <div class="flex flex-column align-items-center gap-3 py-5">
                <i class="pi pi-fingerprint" style="font-size: 4rem;"></i>
                <p>Coloca tu dedo en el lector y no lo muevas hasta que termine.</p>
              </div>
              <template #footer>
              </template>
  <template #content>
                <Button label="Cancelar" icon="pi pi-times" class="p-button-text" @click="visible = false" />
                <Button label="Registrar Huella" icon="pi pi-check" @click="registrarHuella" autofocus />
            </Dialog>
          </div>
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
