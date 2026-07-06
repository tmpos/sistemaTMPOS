<template>
  <div class="file-manager-container">
    <Toast />

    <!-- Header con información del directorio -->
    <div class="header-section">
      <h3 class="directory-title">
        <i class="pi pi-folder-open"></i>
        {{ directoryName || 'Gestor de Archivos' }}
      </h3>
      <Button
        icon="pi pi-refresh"
        label="Actualizar"
        @click="loadFiles"
        :loading="loading"
        class="p-button-sm"
      />
    </div>

    <!-- Área de subida de archivos -->
    <div class="upload-section" v-if="allowUpload">
      <FileUpload
        :customUpload="true"
        :auto="true"
        chooseLabel="Seleccionar archivos"
        @uploader="handleUpload"
        :multiple="multiple"
      />
    </div>

    <!-- Vista de archivos en cards -->
    <div class="files-section">
      <div v-if="loading" class="loading-message">
        <i class="pi pi-spin pi-spinner" style="font-size: 2rem"></i>
        <p>Cargando archivos...</p>
      </div>
      <div v-else-if="files.length === 0" class="empty-message">
        <i class="pi pi-folder-open" style="font-size: 3rem"></i>
        <p>{{ emptyMessage }}</p>
      </div>
      <div v-else class="files-grid">
        <div v-for="file in files" :key="file.nombre" class="file-card" @click="previewFile(file)">
          
<!--           <div class="file-card-icon" :style="{ background: getFileIconColor(file.nombre) }">
            <i :class="getFileIcon(file.nombre)"></i>
          </div> -->
<!-- Mostrar miniatura si es imagen -->
          <div
            v-if="isImage(file.nombre)"
            class="file-thumb"
          >
            <img :src="file.url" :alt="file.nombre" />
          </div>

          <!-- Mostrar ícono si NO es imagen -->
          <div
            v-else
            class="file-card-icon"
            :style="{ background: getFileIconColor(file.nombre) }"
          >
            <i :class="getFileIcon(file.nombre)"></i>
          </div>

          <div class="file-card-content">
            <h4 class="file-card-name" :title="file.nombre">{{ file.nombre }}</h4>
            <p class="file-card-size" v-if="file.size">{{ formatFileSize(file.size) }}</p>
          </div>
          <div class="file-card-actions">
            <Button
              icon="pi pi-eye"
              class="p-button-rounded p-button-text p-button-sm"
              @click="previewFile(file)"
              v-tooltip.top="'Vista previa'"
              v-if="canPreview(file.nombre)"
            />
            <Button
              icon="pi pi-download"
              class="p-button-rounded p-button-text p-button-sm p-button-success"
              @click="downloadFile(file)"
              v-tooltip.top="'Descargar'"
            />
            <Button
              icon="pi pi-trash"
              class="p-button-rounded p-button-text p-button-sm p-button-danger"
              @click="confirmDelete(file)"
              v-tooltip.top="'Eliminar'"
              v-if="allowDelete"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Dialog de confirmación de eliminación -->
    <Dialog
      v-model:visible="deleteDialog"
      :style="{ width: '450px' }"
      header="Confirmar eliminación"
      :modal="true"
    >
      <div class="confirmation-content">
        <i class="pi pi-exclamation-triangle" style="font-size: 2rem; color: var(--red-500)"></i>
        <span v-if="fileToDelete">¿Está seguro de eliminar el archivo <b>{{ fileToDelete.nombre }}</b>?</span>
      </div>
      <template #footer>
        <Button label="Cancelar" icon="pi pi-times" class="p-button-text" @click="deleteDialog = false"/>
        <Button label="Eliminar" icon="pi pi-check" class="p-button-danger" @click="deleteFile" :loading="deleting"/>
      </template>
    </Dialog>

    <!-- Dialog de vista previa -->
    <Dialog
      v-model:visible="previewDialog"
      :style="{ width: '70vw' }"
      header="Vista previa"
      :modal="true"
      maximizable
    >
      <div class="preview-content">
        <img
          v-if="previewType === 'image'"
          :src="previewUrl"
          alt="Preview"
          class="preview-image"
        />
        <iframe
          v-else-if="previewType === 'pdf'"
          :src="previewUrl"
          class="preview-iframe"
        ></iframe>
        <video
          v-else-if="previewType === 'video'"
          :src="previewUrl"
          controls
          class="preview-video"
        ></video>
        <audio
          v-else-if="previewType === 'audio'"
          :src="previewUrl"
          controls
          class="preview-audio"
        ></audio>
        <div v-else-if="previewType === 'excel'" class="preview-unavailable">
          <i class="pi pi-file-excel" style="font-size: 4rem; color: #1D6F42"></i>
          <p style="font-weight: 600; margin: 1rem 0">Archivo Excel</p>
          <p style="color: var(--text-color-secondary); margin-bottom: 1.5rem">
            Los archivos Excel no se pueden previsualizar directamente.<br>
            Haz clic en el botón de abajo para descargar o abrir el archivo.
          </p>
          <Button
            icon="pi pi-download"
            label="Descargar Archivo"
            @click="downloadFile({ url: previewUrl, nombre: 'archivo.xlsx' })"
            class="p-button-success"
          />
        </div>
        <div v-else-if="previewType === 'word'" class="preview-unavailable">
          <i class="pi pi-file-word" style="font-size: 4rem; color: #2B579A"></i>
          <p style="font-weight: 600; margin: 1rem 0">Documento Word</p>
          <p style="color: var(--text-color-secondary); margin-bottom: 1.5rem">
            Los archivos Word no se pueden previsualizar directamente.<br>
            Haz clic en el botón de abajo para descargar o abrir el archivo.
          </p>
          <Button
            icon="pi pi-download"
            label="Descargar Archivo"
            @click="downloadFile({ url: previewUrl, nombre: 'archivo.docx' })"
            class="p-button-info"
          />
        </div>
        <div v-else class="preview-unavailable">
          <i class="pi pi-file" style="font-size: 4rem"></i>
          <p>Vista previa no disponible para este tipo de archivo</p>
        </div>
      </div>
    </Dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useToast } from 'primevue/usetoast'
import FileUpload from 'primevue/fileupload'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import Toast from 'primevue/toast'
import { peticionesFetchOffline, envioElectron, encryptarPassword, enviarDatosPorPost, peticiones } from '@/funciones/funciones.js'

// Props
const props = defineProps({
  // Nombre del cliente
  cliente: {
    type: String,
    required: true
  },
  // Nombre del directorio (se crea en baseFolder/CLIENTE/)
  directoryName: {
    type: String,
    required: true
  },
  // Carpeta base (por defecto 'incidencias')
  baseFolder: {
    type: String,
    default: 'incidencias'
  },
  // Tipos de archivo aceptados
  accept: {
    type: String,
    default: '*/*'
  },
  // Permitir subida de archivos
  allowUpload: {
    type: Boolean,
    default: true
  },
  // Permitir eliminación de archivos
  allowDelete: {
    type: Boolean,
    default: true
  },
  // Subida múltiple
  multiple: {
    type: Boolean,
    default: true
  },
  // Mensaje cuando no hay archivos
  emptyMessage: {
    type: String,
    default: 'No hay archivos en este directorio'
  }
})

// Emits
const emit = defineEmits(['upload-success', 'upload-error', 'delete-success', 'delete-error', 'files-loaded'])

// Composables
const toast = useToast()

// State
const files = ref([])
const loading = ref(false)
const deleting = ref(false)
const deleteDialog = ref(false)
const previewDialog = ref(false)
const fileToDelete = ref(null)
const previewUrl = ref('')
const previewType = ref('')

// Config
const link = ref('')
const api = ref('')
const tokenCifrado = ref('')

// Lifecycle
onMounted(async () => {
  const datosJSON = await envioElectron('datosarchivo')
  link.value = datosJSON.VITE_LINKURL
  api.value = datosJSON.VITE_LINK_API
  const token = datosJSON.VITE_TOKEN
  tokenCifrado.value = await encryptarPassword(token, 10)

  await loadFiles()
})


const isImage = (fileName) => {
  const ext = fileName.split('.').pop().toLowerCase()
  return ['jpg','jpeg','png','gif','bmp','webp','svg'].includes(ext)
}



// Methods
const loadFiles = async () => {
  loading.value = true
  try {
    const rutaCompleta = `../vista/img/${props.baseFolder}/${props.cliente}/${props.directoryName}`

    // Verifica si el directorio existe
    const verificaDir = await peticiones(
      link.value + api.value + '/verificadirectorio',
      { "ruta": rutaCompleta },
      'POST',
      tokenCifrado.value
    )

    // Si no existe, créalo
    if (verificaDir[0] === 'error') {
      await peticiones(
        link.value + api.value + '/creardirectorio',
        { "ruta": rutaCompleta },
        'POST',
        tokenCifrado.value
      )
      files.value = []
    } else {
      // Lista archivos usando peticionimagenes (endpoint que funciona)
      const archivosNombres = await peticiones(
        link.value + api.value + '/peticionimagenes',
        { "origen": rutaCompleta },
        'POST',
        tokenCifrado.value
      )

      if (archivosNombres && archivosNombres[0] !== 'error') {
        // Convierte los nombres a objetos con url y nombre
        files.value = archivosNombres.map(nombre => ({
          nombre: nombre,
          url: `${link.value}/vista/img/${props.baseFolder}/${props.cliente}/${props.directoryName}/${nombre}`
        }))
      } else {
        files.value = []
      }
    }

    emit('files-loaded', files.value)
  } catch (error) {
    console.error('Error loading files:', error)
    files.value = []
  } finally {
    loading.value = false
  }
}

const handleUpload = async (event) => {
  const response = await envioElectron('datosarchivo');
  const link = response.VITE_LINKURL;
  const api = response.VITE_LINK_API;

  const archivos = event.files;
  const urlIMAGEN = link + api + '/subirunaimagen2';
  const rutaIMAGEN = `../vista/img/${props.baseFolder}/${props.cliente}/${props.directoryName}`;

  for (const archivo of archivos) {
    const formData = new FormData();
    formData.append('imagen[]', archivo);
    formData.append('ruta', rutaIMAGEN);
    try {
      const response = await fetch(urlIMAGEN, {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();
      if (result[0].status === 'ok') {
        console.log('✅ Imagen subida:', result);
        // Recarga la lista de archivos
        await loadFiles();
      } else {
        console.error('❌ Error en la subida:', result.message || result);
      }
    } catch (err) {
      console.error('❌ Error al subir imagen:', err);
    }
  }
}

const confirmDelete = (file) => {
  fileToDelete.value = file
  deleteDialog.value = true
}

const deleteFile = async () => {
  if (!fileToDelete.value) return

  deleting.value = true
  try {
    const url = link.value + api.value + '/borrararchivo'
    const datos = {
      ruta: `../vista/img/${props.baseFolder}/${props.cliente}/${props.directoryName}`,
      archivo: fileToDelete.value.nombre,
    }

    const envioDatos = await enviarDatosPorPost(url, datos, tokenCifrado.value)

    if (envioDatos[0] == 'ok') {
      // Recarga la lista de archivos
      await loadFiles();

      toast.add({
        severity: 'success',
        summary: 'Éxito',
        detail: 'Archivo eliminado correctamente',
        life: 3000
      })

      emit('delete-success', fileToDelete.value)
      deleteDialog.value = false
    } else {
      toast.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Error al eliminar el archivo',
        life: 3000
      })
    }
  } catch (error) {
    console.error('Error deleting file:', error)
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Error al eliminar el archivo',
      life: 3000
    })
    emit('delete-error', error)
  } finally {
    deleting.value = false
    fileToDelete.value = null
  }
}

const downloadFile = (file) => {
  try {
    const link = document.createElement('a')
    link.href = file.url
    link.download = file.nombre
    link.click()

    toast.add({
      severity: 'success',
      summary: 'Éxito',
      detail: 'Descarga iniciada',
      life: 3000
    })
  } catch (error) {
    console.error('Error downloading file:', error)
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Error al descargar el archivo',
      life: 3000
    })
  }
}

const previewFile = (file) => {
  const extension = file.nombre.split('.').pop().toLowerCase()
  previewUrl.value = file.url

  if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'].includes(extension)) {
    previewType.value = 'image'
  } else if (extension === 'pdf') {
    previewType.value = 'pdf'
  } else if (['mp4', 'webm', 'ogg', 'mov'].includes(extension)) {
    previewType.value = 'video'
  } else if (['mp3', 'wav', 'ogg', 'aac'].includes(extension)) {
    previewType.value = 'audio'
  } else if (['xls', 'xlsx', 'csv'].includes(extension)) {
    previewType.value = 'excel'
  } else if (['doc', 'docx'].includes(extension)) {
    previewType.value = 'word'
  } else {
    previewType.value = 'other'
  }

  previewDialog.value = true
}

const canPreview = (fileName) => {
  const extension = fileName.split('.').pop().toLowerCase()
  const previewableExtensions = [
    'jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg',
    'pdf',
    'mp4', 'webm', 'ogg', 'mov',
    'mp3', 'wav', 'aac',
    'xls', 'xlsx', 'csv',
    'doc', 'docx'
  ]
  return previewableExtensions.includes(extension)
}

const getFileIcon = (fileName) => {
  const extension = fileName.split('.').pop().toLowerCase()
  const iconMap = {
    // Imágenes
    jpg: 'pi pi-image',
    jpeg: 'pi pi-image',
    png: 'pi pi-image',
    gif: 'pi pi-image',
    bmp: 'pi pi-image',
    svg: 'pi pi-image',
    webp: 'pi pi-image',

    // Documentos
    pdf: 'pi pi-file-pdf',
    doc: 'pi pi-file-word',
    docx: 'pi pi-file-word',
    xls: 'pi pi-file-excel',
    xlsx: 'pi pi-file-excel',
    csv: 'pi pi-file-excel',
    ppt: 'pi pi-file',
    pptx: 'pi pi-file',
    txt: 'pi pi-file',

    // Archivos comprimidos
    zip: 'pi pi-file',
    rar: 'pi pi-file',
    '7z': 'pi pi-file',
    tar: 'pi pi-file',
    gz: 'pi pi-file',

    // Video
    mp4: 'pi pi-video',
    avi: 'pi pi-video',
    mov: 'pi pi-video',
    wmv: 'pi pi-video',
    webm: 'pi pi-video',

    // Audio
    mp3: 'pi pi-volume-up',
    wav: 'pi pi-volume-up',
    ogg: 'pi pi-volume-up',
    aac: 'pi pi-volume-up',

    // Código
    js: 'pi pi-code',
    html: 'pi pi-code',
    css: 'pi pi-code',
    json: 'pi pi-code',
    xml: 'pi pi-code',
    php: 'pi pi-code',
    py: 'pi pi-code',
    java: 'pi pi-code'
  }

  return iconMap[extension] || 'pi pi-file'
}

const getFileIconColor = (fileName) => {
  const extension = fileName.split('.').pop().toLowerCase()
  const colorMap = {
    // Imágenes - Morado/Púrpura
    jpg: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    jpeg: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    png: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    gif: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    bmp: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    svg: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    webp: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',

    // PDF - Rojo
    pdf: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',

    // Word - Azul
    doc: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    docx: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',

    // Excel - Verde
    xls: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
    xlsx: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
    csv: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',

    // PowerPoint - Naranja
    ppt: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
    pptx: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',

    // Texto - Gris
    txt: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',

    // Archivos comprimidos - Amarillo/Dorado
    zip: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
    rar: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
    '7z': 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
    tar: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
    gz: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',

    // Video - Rojo oscuro
    mp4: 'linear-gradient(135deg, #ff0844 0%, #ffb199 100%)',
    avi: 'linear-gradient(135deg, #ff0844 0%, #ffb199 100%)',
    mov: 'linear-gradient(135deg, #ff0844 0%, #ffb199 100%)',
    wmv: 'linear-gradient(135deg, #ff0844 0%, #ffb199 100%)',
    webm: 'linear-gradient(135deg, #ff0844 0%, #ffb199 100%)',

    // Audio - Verde azulado
    mp3: 'linear-gradient(135deg, #30cfd0 0%, #330867 100%)',
    wav: 'linear-gradient(135deg, #30cfd0 0%, #330867 100%)',
    ogg: 'linear-gradient(135deg, #30cfd0 0%, #330867 100%)',

    // Código - Azul oscuro
    js: 'linear-gradient(135deg, #2e3192 0%, #1bffff 100%)',
    php: 'linear-gradient(135deg, #2e3192 0%, #1bffff 100%)',
    html: 'linear-gradient(135deg, #2e3192 0%, #1bffff 100%)',
    css: 'linear-gradient(135deg, #2e3192 0%, #1bffff 100%)',
    json: 'linear-gradient(135deg, #2e3192 0%, #1bffff 100%)',
    xml: 'linear-gradient(135deg, #2e3192 0%, #1bffff 100%)',
  }

  // Default - Gris neutro
  return colorMap[extension] || 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
}

const formatFileSize = (bytes) => {
  if (!bytes || bytes === 0) return '0 Bytes'

  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
}

// Expose methods
defineExpose({
  loadFiles,
  refresh: loadFiles
})
</script>

<style scoped>
.file-manager-container {
  padding: 1rem;
  background: var(--surface-card);
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.header-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid var(--surface-border);
}

.directory-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--text-color);
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0;
}

.directory-title i {
  color: var(--primary-color);
}

.upload-section {
  margin-bottom: 1.5rem;
}

.files-section {
  margin-top: 1rem;
}

.loading-message,
.empty-message {
  text-align: center;
  padding: 3rem 1rem;
  color: var(--text-color-secondary);
}

.loading-message i,
.empty-message i {
  display: block;
  margin-bottom: 1rem;
  color: var(--primary-color);
}

/* Vista de Cards */
.files-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 1.5rem;
  margin-top: 1rem;
}

.file-card {
  background: var(--surface-card);
  border: 2px solid var(--surface-border);
  border-radius: 12px;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  transition: all 0.3s ease;
  cursor: pointer;
  min-height: 280px;
}

.file-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
  border-color: var(--primary-color);
}

.file-card-icon {
  width: 100px;
  height: 100px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 1rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  transition: transform 0.3s ease;
}

.file-card:hover .file-card-icon {
  transform: scale(1.05);
}

.file-card-icon i {
  font-size: 3.5rem;
  color: white;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2));
}

.file-card-content {
  flex: 1;
  width: 100%;
  margin-bottom: 0.75rem;
}

.file-card-name {
  font-size: 1rem;
  font-weight: 700;
  color: var(--text-color);
  margin: 0 0 0.5rem 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  width: 100%;
  letter-spacing: 0.3px;
}

.file-card-size {
  font-size: 0.85rem;
  font-weight: 500;
  color: var(--text-color-secondary);
  margin: 0.25rem 0;
}

.file-card-actions {
  display: flex;
  gap: 0.25rem;
  justify-content: center;
  padding-top: 0.75rem;
  border-top: 1px solid var(--surface-border);
  width: 100%;
}

.confirmation-content {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.preview-content {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400px;
}

.preview-image {
  max-width: 100%;
  max-height: 70vh;
  object-fit: contain;
}

.preview-iframe {
  width: 100%;
  height: 70vh;
  border: none;
}

.preview-video {
  max-width: 100%;
  max-height: 70vh;
}

.preview-audio {
  width: 100%;
}

.preview-unavailable {
  text-align: center;
  color: var(--text-color-secondary);
}

.preview-unavailable i {
  color: var(--text-color-secondary);
  margin-bottom: 1rem;
}

/* Responsive */
@media (max-width: 768px) {
  .header-section {
    flex-direction: column;
    gap: 1rem;
    align-items: stretch;
  }

  .files-grid {
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  }
}

/* Dark mode support */
:deep(.app-dark) .file-manager-container {
  background: var(--surface-ground);
}
</style>
