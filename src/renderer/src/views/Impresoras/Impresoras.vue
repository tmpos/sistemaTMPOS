
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
const linkImpresoraTermica = ref('')
const linkImpresoraTinta = ref('')
const datosJSON = ref([]);
const impresoras = ref({
  termica: '',
  tinta: '',
  label: ''
})
const configTermica = ref({
  fontSize: '10',
  fontFamily: 'Arial',
  pageWidth: '300',
  bodyWidth: '250',
  ticketWidth: '250',
  logoWidth: '200',
  pageSizeWidth: '80000',
  pageSizeHeight: '295000',
  copies: '1',
})
const configLabel = ref({
  preview: false,
  width: '50800',
  height: '76200',
  unit: 'mm',
  margin: '0 0 0 0',
  copies: 1,
  silent: true,
  printerName: '',
  timeOutPerLine: 1000
})
const tamanoLabel = ref({
  unit: 'mm',
  width: 50.8,
  height: 76.2
})

const micrasToMm = (micras) => Number(((Number(micras) || 0) / 1000).toFixed(1))
const mmToMicras = (mm) => String(Math.round((Number(mm) || 0) * 1000))
const mmToIn = (mm) => Number(((Number(mm) || 0) / 25.4).toFixed(2))
const inToMm = (pulgadas) => Number(((Number(pulgadas) || 0) * 25.4).toFixed(1))

const sincronizarTamanoLabelDesdeConfig = () => {
  const unidad = configLabel.value.unit === 'in' ? 'in' : 'mm'
  const anchoMm = micrasToMm(configLabel.value.width || 50800)
  const altoMm = micrasToMm(configLabel.value.height || 76200)
  tamanoLabel.value = {
    unit: unidad,
    width: unidad === 'in' ? mmToIn(anchoMm) : anchoMm,
    height: unidad === 'in' ? mmToIn(altoMm) : altoMm
  }
}

const aplicarTamanoLabelAConfig = () => {
  const anchoMm = tamanoLabel.value.unit === 'in' ? inToMm(tamanoLabel.value.width) : Number(tamanoLabel.value.width)
  const altoMm = tamanoLabel.value.unit === 'in' ? inToMm(tamanoLabel.value.height) : Number(tamanoLabel.value.height)
  configLabel.value.unit = tamanoLabel.value.unit
  configLabel.value.width = mmToMicras(anchoMm)
  configLabel.value.height = mmToMicras(altoMm)
}

const cambiarUnidadTamanoLabel = (unidad) => {
  if (tamanoLabel.value.unit === unidad) return
  if (unidad === 'in') {
    tamanoLabel.value.width = mmToIn(tamanoLabel.value.width)
    tamanoLabel.value.height = mmToIn(tamanoLabel.value.height)
  } else {
    tamanoLabel.value.width = inToMm(tamanoLabel.value.width)
    tamanoLabel.value.height = inToMm(tamanoLabel.value.height)
  }
  tamanoLabel.value.unit = unidad
}

/************************************************************************/
const visible = ref(false);
const visiblecrear = ref(false);
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
    linkImpresoraTermica.value = datosJSON.value.VITE_IMPRESORA_TERMICA;
    linkImpresoraTinta.value = datosJSON.value.VITE_IMPRESORA_TINTA;
    tokenCorto.value = datosJSON.value.VITE_TOKEN_CORTO;
    patroncedula.value = datosJSON.value.VITE_PATRON_CEDULA;

    impresoras.value.termica = linkImpresoraTermica.value
    impresoras.value.tinta = linkImpresoraTinta.value
    impresoras.value.label = datosJSON.value.impresoraLabel?.printerName || ''

if (datosJSON.value.impresora) {
  try {
    configTermica.value = JSON.parse(datosJSON.value.impresora)
  } catch (error) {
    console.warn('❗ Configuración de impresora mal formada:', error)
  }
}

if (datosJSON.value.impresoraLabel) {
  configLabel.value = {
    ...configLabel.value,
    ...datosJSON.value.impresoraLabel
  }
  impresoras.value.label = configLabel.value.printerName || impresoras.value.label
}
sincronizarTamanoLabelDesdeConfig()


}
/************************************************************************/
onMounted(async () => {
await datosConfig()
tokenCifrado.value = await encryptarPassword(token.value, 10);

});
/************************************************************************/

const dialogVisible = ref(false)
const listaImpresoras = ref([])
const tipoActual = ref('')

const mostrarDialogo = async (tipo) => {
  tipoActual.value = tipo
  dialogVisible.value = true

  try {
    const impresorasDisponibles = await window.electron.ipcRenderer.invoke('get-printers')
    listaImpresoras.value = impresorasDisponibles || []
  } catch (error) {
    toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo obtener la lista de impresoras.', life: 3000 })
    dialogVisible.value = false
  }
}

const seleccionarDesdeLista = async(nombre) => {
  impresoras.value[tipoActual.value] = nombre
  if (tipoActual.value === 'label') {
    configLabel.value.printerName = nombre
  }
  toast.add({ severity: 'success', summary: 'Impresora seleccionada', detail: `Impresora ${tipoActual.value} registrada.`, life: 2000 })
  dialogVisible.value = false

}

const guardarConfiguracion = async () => {


    try {
              const datos = datosJSON.value
              const clonedData = JSON.parse(JSON.stringify(datos));
              clonedData.VITE_IMPRESORA_TERMICA = impresoras.value.termica
              const envioDatosJSON = await window.electron.ipcRenderer.invoke('actualizarjson', clonedData);
             toast.add({ severity: 'success', summary: 'Éxito', detail: 'Datos Actualizados', life: 3000 });

    } catch (error) {
      toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo guardar la configuración', life: 3000 })
    }


    try {
              const datos = datosJSON.value
              const clonedData = JSON.parse(JSON.stringify(datos));
              clonedData.VITE_IMPRESORA_TINTA = impresoras.value.tinta
              const envioDatosJSON = await window.electron.ipcRenderer.invoke('actualizarjson', clonedData);
             toast.add({ severity: 'success', summary: 'Éxito', detail: 'Datos Actualizados', life: 3000 });


    } catch (error) {
      toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo guardar la configuración', life: 3000 })
    }

    try {
              const datos = datosJSON.value
              const clonedData = JSON.parse(JSON.stringify(datos));
              clonedData.impresora = JSON.stringify(configTermica.value)
              const envioDatosJSON = await window.electron.ipcRenderer.invoke('actualizarjson', clonedData);
             toast.add({ severity: 'success', summary: 'Éxito', detail: 'Datos Actualizados', life: 3000 });

    } catch (error) {
      toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo guardar la configuración', life: 3000 })
    }

}

const guardarConfiguracionImpresoras = async () => {
  try {
    aplicarTamanoLabelAConfig()
    const clonedData = JSON.parse(JSON.stringify(datosJSON.value));
    clonedData.VITE_IMPRESORA_TERMICA = impresoras.value.termica
    clonedData.VITE_IMPRESORA_TINTA = impresoras.value.tinta
    clonedData.impresora = JSON.stringify(configTermica.value)
    clonedData.impresoraLabel = {
      ...configLabel.value,
      printerName: impresoras.value.label
    }
    await window.electron.ipcRenderer.invoke('actualizarjson', clonedData);
    datosJSON.value = clonedData
    configLabel.value.printerName = impresoras.value.label
    toast.add({ severity: 'success', summary: 'Exito', detail: 'Datos Actualizados', life: 3000 });
  } catch (error) {
    toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo guardar la configuracion', life: 3000 })
  }
}

const termicaCampos = {
  fontSize:      { label: "Tamaño de fuente", type: "number", model: "fontSize" },
  fontFamily:    { label: "Fuente", type: "text", model: "fontFamily" },
  ticketWidth:   { label: "Ancho del ticket (ticketWidth)", type: "number", model: "ticketWidth" },
  logoWidth:     { label: "Ancho del logo (logoWidth)", type: "number", model: "logoWidth" },
  pageWidth:     { label: "Ancho de página (pageWidth)", type: "number", model: "pageWidth" },
  bodyWidth:     { label: "Ancho del cuerpo (bodyWidth)", type: "number", model: "bodyWidth" },
  pageSizeWidth: { label: "Ancho de impresora (pageSizeWidth)", type: "number", model: "pageSizeWidth" },
  pageSizeHeight:{ label: "Alto de impresora (pageSizeHeight)", type: "number", model: "pageSizeHeight" },
  copies:        { label: "Copias", type: "number", model: "copies" }
};

const labelCampos = {
  copies:         { label: "Copias", type: "number", model: "copies" },
  timeOutPerLine: { label: "Tiempo por linea", type: "number", model: "timeOutPerLine" }
};


/************************************************************************/
</script>
<template>
  <main class="content-wrapper animate-fadeIn">

    <!-- ===================================================== -->
    <!-- HEADER TECNOLÓGICO -->
    <!-- ===================================================== -->
    <div class="rounded-xl p-6 shadow-lg mb-6 bg-gradient-to-r from-indigo-600 via-blue-600 to-slate-600 text-white">
      <div class="flex items-center gap-4">
        <i class="pi pi-print text-5xl"></i>
        <div>
          <h1 class="text-3xl font-bold">Configuración de Impresoras</h1>
          <p class="opacity-90">Administración y ajustes de dispositivos de impresión</p>
        </div>
      </div>
    </div>



    <Card class="shadow-lg border border-indigo-200">
      <template #content>

        <div class="flex flex-col space-y-6">

          <!-- =================== IMPRESORA TÉRMICA =================== -->
          <div class="space-y-2">
            <div class="text-lg font-semibold text-indigo-600 dark:text-indigo-300">
              Impresora Térmica
            </div>

            <div class="flex items-center space-x-2">
              <InputText
                v-model="impresoras.termica"
                class="w-full"
                placeholder="Selecciona impresora térmica"
              />
              <Button
                label="Buscar"
                icon="pi pi-search"
                class="p-button-info"
                @click="mostrarDialogo('termica')"
              />
            </div>
          </div>


          <!-- =================== IMPRESORA LABEL / ETIQUETAS =================== -->
          <div class="space-y-2 pt-4">
            <div class="text-lg font-semibold text-indigo-600 dark:text-indigo-300">
              Impresora Label / Etiquetas
            </div>

            <div class="flex items-center space-x-2">
              <InputText
                v-model="impresoras.label"
                class="w-full"
                readonly
                placeholder="Selecciona impresora de etiquetas"
              />
              <Button
                label="Buscar"
                icon="pi pi-search"
                class="p-button-info"
                @click="mostrarDialogo('label')"
              />
            </div>
          </div>

          <div class="mt-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-indigo-200 shadow-inner">
            <div class="flex items-center justify-between gap-3 mb-3">
              <label class="block font-semibold text-sm text-slate-700 dark:text-slate-200">
                Tamano de etiqueta
              </label>
              <div class="flex gap-2">
                <Button
                  label="mm"
                  size="small"
                  :outlined="tamanoLabel.unit !== 'mm'"
                  @click="cambiarUnidadTamanoLabel('mm')"
                />
                <Button
                  label="in"
                  size="small"
                  :outlined="tamanoLabel.unit !== 'in'"
                  @click="cambiarUnidadTamanoLabel('in')"
                />
              </div>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block font-semibold text-sm mb-1 text-slate-700 dark:text-slate-200">
                  Ancho ({{ tamanoLabel.unit }})
                </label>
                <InputText
                  v-model="tamanoLabel.width"
                  type="number"
                  class="w-full"
                />
              </div>
              <div>
                <label class="block font-semibold text-sm mb-1 text-slate-700 dark:text-slate-200">
                  Alto ({{ tamanoLabel.unit }})
                </label>
                <InputText
                  v-model="tamanoLabel.height"
                  type="number"
                  class="w-full"
                />
              </div>
            </div>
          </div>

          <div class="grid grid-cols-4 gap-4 mt-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-indigo-200 shadow-inner">
            <div v-for="(field, key) in labelCampos" :key="key">
              <label class="block font-semibold text-sm mb-1 text-slate-700 dark:text-slate-200">
                {{ field.label }}
              </label>

              <InputText
                v-model="configLabel[field.model]"
                :type="field.type"
                class="w-full"
              />
            </div>
          </div>


          <!-- CONFIG TERMICA -->
          <div class="grid grid-cols-4 gap-4 mt-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-indigo-200 shadow-inner">

            <div v-for="(field, key) in termicaCampos" :key="key">
              <label class="block font-semibold text-sm mb-1 text-slate-700 dark:text-slate-200">
                {{ field.label }}
              </label>

              <InputText
                v-model="configTermica[field.model]"
                :type="field.type"
                class="w-full"
              />
            </div>

          </div>



          <!-- =================== IMPRESORA DE TINTA =================== -->
          <div class="space-y-2 pt-4">
            <div class="text-lg font-semibold text-indigo-600 dark:text-indigo-300">
              Impresora de Tinta / Láser
            </div>

            <div class="flex items-center space-x-2">
              <InputText
                v-model="impresoras.tinta"
                class="w-full"
                readonly
                placeholder="Selecciona impresora de tinta"
              />
              <Button
                label="Buscar"
                icon="pi pi-search"
                class="p-button-info"
                @click="mostrarDialogo('tinta')"
              />
            </div>
          </div>



          <!-- =================== BOTÓN GUARDAR =================== -->
          <div class="flex justify-end pt-4">
            <Button
              label="Guardar configuración"
              icon="pi pi-save"
              class="p-button-success"
              @click="guardarConfiguracionImpresoras"
            />
          </div>

        </div>

      </template>
    </Card>



    <!-- ===================================================== -->
    <!-- DIÁLOGO SELECCIÓN -->
    <!-- ===================================================== -->
    <Dialog
      v-model:visible="dialogVisible"
      modal
      header="Seleccionar Impresora"
      :style="{ width: '420px' }"
      class="animate-slideInDown"
    >
      <div v-if="listaImpresoras.length === 0" class="text-center py-3">
        Cargando impresoras...
      </div>

      <ul v-else class="space-y-2 max-h-80 overflow-auto custom-scroll">
        <li v-for="(impresora, index) in listaImpresoras" :key="index">
          <Button
            @click="seleccionarDesdeLista(impresora)"
            outlined
            class="w-full text-left justify-start"
            :label="impresora"
          />
        </li>
      </ul>
    </Dialog>

    <Toast />
  </main>
</template>

<style scoped>
/* Animaciones */
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
.animate-fadeIn { animation: fadeIn 0.6s ease-out; }

@keyframes slideInDown { from { transform: translateY(-20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
.animate-slideInDown { animation: slideInDown 0.4s ease-out; }

/* Scrollbar estilizada */
.custom-scroll::-webkit-scrollbar {
  width: 8px;
}
.custom-scroll::-webkit-scrollbar-thumb {
  background: #6366f1;
  border-radius: 10px;
}
.custom-scroll::-webkit-scrollbar-thumb:hover {
  background: #4338ca;
}
</style>
