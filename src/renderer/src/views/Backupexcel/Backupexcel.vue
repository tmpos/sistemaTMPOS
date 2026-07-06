<script setup>
import { ref, onMounted, nextTick, watchEffect } from 'vue';
import router from '../../router';
import * as XLSX from 'xlsx';
import axios from 'axios';
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
  mensajetoast,
  crearYDescargarExcel,
  peticionesFetchOffline,
  downloadURI,
  lasMayusculas} from '../../funciones/funciones.js';
  import bcrypt from 'bcryptjs';
import Swal from 'sweetalert2'
import { useToast } from "primevue/usetoast";
const toast = useToast();
/************************************************************************/
import Awesomplete from '../../components/Awesomplete.vue';
//import FileUploader from '../../components/FileUploader.vue';
import FileUploader from '../Componentes/FileUploader.vue';
/************************************************************************/
const fileUpload = ref(null);
const excelData = ref([]);
/************************************************************************/
import {useDatosEmpresa} from '../../stores'
const datosEmpresa = useDatosEmpresa();
const link = ref(null);
const api = ref(null);
const token = ref(null);
const patronTelefono = ref(null);
const linkImpresora = ref(null);
const patroncedula = ref(null);
const tokenCifrado = ref(null);
const tokenCorto = ref(null);
/************************************************************************/
const uploadPath = ref('')
const uploadUrl = ref(null)
const restaurar = ref(false);
const arrayIMG = ref([])
/************************************************************************/
const nombreTabla = ref(null)
const listaBuscador = ref([])
/************************************************************************/
document.body.classList.add('sidebar-close');
/************************************************************************/
watchEffect(() => {
    //Aqui para vigilar eventos
});
/************************************************************************/
const fetchTablas = async () => {
   const response = await peticionesFetchOffline('getAllTables');
   listaBuscador.value = response;

};
/************************************************************************/
onMounted(async() => {

const datosJSON = await envioElectron('datosarchivo');
link.value = datosJSON.VITE_LINKURL;
api.value = datosJSON.VITE_LINK_API;
token.value = datosJSON.VITE_TOKEN;
patronTelefono.value = datosJSON.VITE_PATRON_TELEFONO;
linkImpresora.value = datosJSON.VITE_IMPRESORA_LOCAL;
tokenCorto.value = datosJSON.VITE_TOKEN_CORTO;
tokenCifrado.value = await encryptarPassword(token.value, 10);


uploadPath.value = 'excel'
uploadUrl.value = link.value+api.value+'/subirExcel'
await fetchTablas();

});
/************************************************************************/
const fnAwesomplete = ()=>{

}
/************************************************************************/
/************************************************************************/
const handleSelectComplete = (selected)=>{
nombreTabla.value = selected.value
}
/************************************************************************/
const fnPlantilla = async () => {
  // Simulamos una respuesta exitosa
  const response = ['ok'];
 const camposTabla = await peticionesFetchOffline('getTableColumns', `${nombreTabla.value}`);
  if (response[0] === 'ok') {
    // Mostrar mensaje de éxito
    toast.add({
      severity: 'success',
      summary: 'Éxito',
      detail: 'Se ha creado la plantilla con éxito.',
      life: 3000
    });

    // Crear el archivo de Excel
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.aoa_to_sheet([camposTabla]);
    XLSX.utils.book_append_sheet(workbook, worksheet, "Plantilla");

    // Convertir el workbook a un archivo binario
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/octet-stream' });

    // Mostrar el diálogo para descargar el archivo
    Swal.fire({
      title: 'Archivo Creado',
      text: "¿Deseas descargarlo?",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Descargar',
      cancelButtonText: 'Cerrar'
    }).then((result) => {
      if (result.isConfirmed) {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'plantilla.xlsx';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }
    });
  } else {
    // Mostrar mensaje de error
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Error al crear la plantilla.',
      life: 3000
    });
  }
};

/************************************************************************/
const fnDownload = async () => {
  try {
    const response = ['ok'];
    const datosTabla = await peticionesFetchOffline('getDataAsArray', `${nombreTabla.value}`);
    if (response[0] === 'ok') {
      // Truncar datos largos
      const datosTablaTruncados = datosTabla.map(fila => {
        const nuevaFila = {};
        for (const clave in fila) {
          if (fila.hasOwnProperty(clave)) {
            nuevaFila[clave] = fila[clave] && fila[clave].toString().length > 32767
              ? fila[clave].toString().substring(0, 32767)
              : fila[clave];
          }
        }
        return nuevaFila;
      });

      // Crear el archivo de Excel usando los datos truncados
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(datosTablaTruncados);
      XLSX.utils.book_append_sheet(workbook, worksheet, nombreTabla.value);

      // Convertir el workbook a un archivo binario
      const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([excelBuffer], { type: 'application/octet-stream' });

      const { isConfirmed } = await Swal.fire({
        title: 'Archivo Creado',
        text: "¿Deseas Descargarlo?",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Descargar',
        cancelButtonText: 'Cerrar'
      });

      if (isConfirmed) {
        const url = window.URL.createObjectURL(blob);
        const downloadLink = document.createElement('a');
        downloadLink.href = url;
        downloadLink.setAttribute('download', `${nombreTabla.value}.xlsx`);
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
        window.URL.revokeObjectURL(url);
      }
    } else {
      Swal.fire({
        title: 'Error',
        text: 'Hubo un problema al crear el archivo.',
        icon: 'error',
        confirmButtonText: 'Cerrar'
      });
    }
  } catch (error) {
    console.error('Error:', error);
    Swal.fire({
      title: 'Error',
      text: 'Hubo un problema en la petición.',
      icon: 'error',
      confirmButtonText: 'Cerrar'
    });
  }
};

/************************************************************************/
const fnRestaurar = async()=>{
  if (!nombreTabla.value) {
     toast.add({ severity: 'error', summary: 'Éxito', detail: 'Debes agregar una Tabla Primero', life: 3000 });
    return
  }
  if (restaurar.value) {
      restaurar.value = false
  }else{
     restaurar.value = true
  }
}
/************************************************************************/
const fnLimpiar = async()=>{

  Swal.fire({
    title: 'Introduce la contraseña',
    input: 'password',
    inputPlaceholder: 'Contraseña',
    showCancelButton: true,
    confirmButtonText: 'Eliminar',
    cancelButtonText: 'Cancelar'
  }).then(async(result) => {
    if (result.isConfirmed) {
      const contrasenaIngresada = result.value;
      if (contrasenaIngresada === token.value || contrasenaIngresada === tokenCorto.value) {
           const response = await peticionesFetchOffline('deleteAll', nombreTabla.value);
           if (response[0] == 'ok') {
            toast.add({ severity: 'success', summary: 'Éxito', detail: 'Se ha Borrado con éxito.', life: 3000 });
             nombreTabla.value = null;
           }else{
            toast.add({ severity: 'success', summary: 'Éxito', detail: 'Error al borrar Datos.', life: 3000 });
           }

      } else {
        toast.add({ severity: 'error', summary: 'Error', detail: 'Contraseña incorrecta', life: 3000 });
      }
    }
  });


}
/************************************************************************/

/************************************************************************/
const uploadFiles = () => {
  fileUpload.value.uploadFiles();
};
/************************************************************************/
const excelToArray = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        resolve(jsonData);
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = (error) => {
      reject(error);
    };
    reader.readAsBinaryString(file);
  });
};

const handleFileUpload = async (event) => {
  const file = event.files[0];
  if (file) {
    try {
      // Mostrar un mensaje de carga
      Swal.fire({
        title: 'Cargando...',
        text: 'Por favor, espere mientras se procesan los datos.',
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });

      const data = await excelToArray(file);

      if(data.length > 0){
        await peticionesFetchOffline('deleteAll', nombreTabla.value);
      }else{
      toast.add({
        severity: 'error',
        summary: 'Error',
        detail: 'El Archivo Excel esta vacio',
        life: 3000
      });
        return
      }

      // Insertar datos en la base de datos
      for (let datos of data) {
        await peticionesFetchOffline('insertData', nombreTabla.value, JSON.stringify(datos));
      }

      // Cerrar el mensaje de carga y mostrar éxito
      Swal.close();
      toast.add({
        severity: 'success',
        summary: 'Éxito',
        detail: 'Archivo Excel cargado y convertido correctamente.',
        life: 3000
      });
    } catch (error) {
      console.error('Error al convertir el archivo Excel:', error);

      // Cerrar el mensaje de carga y mostrar error
      Swal.close();
      toast.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Error al convertir el archivo Excel.',
        life: 3000
      });
    }
  }
};
/************************************************************************/
</script>
<template>
  <main class="px-4 py-6">
    <section class="max-w-7xl mx-auto">

      <!-- Header Mejorado -->
      <Card class="mb-6 shadow-lg">
        <template #content>
          <div class="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl p-8 text-white">
            <div class="flex items-center gap-4">
              <div class="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                <span class="text-4xl">📊</span>
              </div>
              <div>
                <h1 class="text-2xl font-bold">Backup y Restauración (Excel)</h1>
                <p class="text-sm opacity-90 mt-1">Exporta datos a Excel o restaura una tabla desde un archivo .xlsx/.xls</p>
              </div>
            </div>
          </div>
        </template>
      </Card>

      <!-- Selector de Tabla -->
      <Card class="mb-6 shadow-lg">
        <template #content>
          <fieldset class="border-2 border-gray-200 dark:border-gray-700 p-6 rounded-xl bg-gradient-to-br from-purple-50 to-white dark:from-gray-900 dark:to-gray-800">
            <legend class="float-none w-auto px-4 text-lg font-bold text-gray-700 dark:text-gray-200">
              🗂️ Seleccionar Tabla
            </legend>

            <div class="mt-4">
              <div class="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-md border border-gray-200 dark:border-gray-700">
                <label class="block text-sm font-bold text-gray-700 dark:text-gray-200 mb-3">Tabla de Base de Datos</label>
                <awesomplete
                  class="w-full"
                  v-model="nombreTabla"
                  @change="fnAwesomplete"
                  @selectComplete="handleSelectComplete"
                  :list="listaBuscador"
                />
              </div>
            </div>
          </fieldset>
        </template>
      </Card>

      <!-- Acciones en Cards -->
      <Card class="shadow-lg">
        <template #content>
          <fieldset class="border-2 border-gray-200 dark:border-gray-700 p-6 rounded-xl bg-gradient-to-br from-blue-50 to-white dark:from-gray-900 dark:to-gray-800">
            <legend class="float-none w-auto px-4 text-lg font-bold text-gray-700 dark:text-gray-200">
              ⚡ Acciones Disponibles
            </legend>

            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">

              <!-- Plantilla -->
              <div
                @click="fnPlantilla"
                class="group cursor-pointer bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md hover:shadow-xl transition-all duration-300 border border-gray-200 dark:border-gray-700 hover:border-green-400 dark:hover:border-green-500"
              >
                <div class="flex flex-col items-center justify-center space-y-3">
                  <div class="w-16 h-16 bg-gradient-to-br from-green-100 to-green-200 dark:from-green-900 dark:to-green-800 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <span class="text-3xl">📄</span>
                  </div>
                  <div class="text-center">
                    <div class="text-sm font-bold text-gray-700 dark:text-gray-200">Descargar Plantilla</div>
                    <div class="text-xs text-gray-500 dark:text-gray-400 mt-1">Obtener estructura vacía</div>
                  </div>
                </div>
              </div>

              <!-- Descargar -->
              <div
                @click="fnDownload"
                class="group cursor-pointer bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md hover:shadow-xl transition-all duration-300 border border-gray-200 dark:border-gray-700 hover:border-blue-400 dark:hover:border-blue-500"
              >
                <div class="flex flex-col items-center justify-center space-y-3">
                  <div class="w-16 h-16 bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900 dark:to-blue-800 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <span class="text-3xl">💾</span>
                  </div>
                  <div class="text-center">
                    <div class="text-sm font-bold text-gray-700 dark:text-gray-200">Descargar Datos</div>
                    <div class="text-xs text-gray-500 dark:text-gray-400 mt-1">Exportar a Excel</div>
                  </div>
                </div>
              </div>

              <!-- Restaurar -->
              <div
                @click="fnRestaurar"
                :class="[
                  'group cursor-pointer rounded-xl p-6 shadow-md hover:shadow-xl transition-all duration-300 border',
                  restaurar
                    ? 'bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900 dark:to-orange-800 border-orange-400 dark:border-orange-500'
                    : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-purple-400 dark:hover:border-purple-500'
                ]"
              >
                <div class="flex flex-col items-center justify-center space-y-3">
                  <div
                    :class="[
                      'w-16 h-16 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300',
                      restaurar
                        ? 'bg-orange-200 dark:bg-orange-700'
                        : 'bg-gradient-to-br from-purple-100 to-purple-200 dark:from-purple-900 dark:to-purple-800'
                    ]"
                  >
                    <span class="text-3xl">{{ restaurar ? '❌' : '📤' }}</span>
                  </div>
                  <div class="text-center">
                    <div class="text-sm font-bold text-gray-700 dark:text-gray-200">
                      {{ restaurar ? 'Cancelar' : 'Restaurar Datos' }}
                    </div>
                    <div class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {{ restaurar ? 'Cerrar panel' : 'Importar desde Excel' }}
                    </div>
                  </div>
                </div>
              </div>

              <!-- Limpiar -->
              <div
                @click="fnLimpiar"
                class="group cursor-pointer bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md hover:shadow-xl transition-all duration-300 border border-gray-200 dark:border-gray-700 hover:border-red-400 dark:hover:border-red-500"
              >
                <div class="flex flex-col items-center justify-center space-y-3">
                  <div class="w-16 h-16 bg-gradient-to-br from-red-100 to-red-200 dark:from-red-900 dark:to-red-800 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <span class="text-3xl">🗑️</span>
                  </div>
                  <div class="text-center">
                    <div class="text-sm font-bold text-gray-700 dark:text-gray-200">Limpiar Tabla</div>
                    <div class="text-xs text-gray-500 dark:text-gray-400 mt-1">Borrar todos los datos</div>
                  </div>
                  <div class="absolute top-2 right-2">
                    <div class="w-2 h-2 rounded-full bg-red-500 shadow-lg shadow-red-500/50"></div>
                  </div>
                </div>
              </div>

            </div>
          </fieldset>
        </template>
      </Card>

      <!-- Panel de Restauración -->
      <transition name="fade-slide">
        <Card v-if="restaurar" class="mt-6 shadow-lg">
          <template #content>
            <fieldset class="border-2 border-dashed border-blue-300 dark:border-blue-700 p-6 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800">
              <legend class="float-none w-auto px-4 text-lg font-bold text-blue-700 dark:text-blue-300">
                📤 Subir Archivo Excel
              </legend>

              <div class="mt-4">
                <div class="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md border-2 border-blue-200 dark:border-blue-800">
                  <div class="flex items-start gap-4 mb-4">
                    <div class="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center text-2xl">
                      ⬆️
                    </div>
                    <div class="flex-1">
                      <h3 class="text-base font-bold text-gray-800 dark:text-gray-200">Cargar archivo Excel</h3>
                      <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        Acepta archivos <span class="font-semibold text-blue-600">.xlsx</span> y <span class="font-semibold text-blue-600">.xls</span>
                      </p>
                      <div class="mt-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-400 rounded">
                        <p class="text-xs text-yellow-800 dark:text-yellow-200">
                          ⚠️ <strong>Advertencia:</strong> Los datos cargados reemplazarán completamente el contenido actual de la tabla seleccionada.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div class="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-4 bg-gray-50 dark:bg-gray-900">
                    <FileUpload
                      name="excel[]"
                      :auto="true"
                      :customUpload="true"
                      @uploader="handleFileUpload"
                      accept=".xlsx, .xls"
                    />
                  </div>
                </div>
              </div>
            </fieldset>
          </template>
        </Card>
      </transition>

    </section>

    <Toast />
  </main>
</template>
<style scoped>
/* Animación mejorada para el panel de restauración */
.fade-slide-enter-active, .fade-slide-leave-active {
  transition: all 0.3s ease;
}

.fade-slide-enter-from {
  opacity: 0;
  transform: translateY(-20px);
}

.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>
