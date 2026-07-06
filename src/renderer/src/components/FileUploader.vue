<template>
  <div 
    class="file-upload-container" 
    @dragover.prevent 
    @drop.prevent="handleDrop"
    @dragenter="dragging = true"
    @dragleave="dragging = false"
  >
    <div 
      :class="{'file-upload-area': true, dragging: dragging}" 
      @click="triggerFileInput"
    >
      <p>Arrastra y suelta archivos aquí o haz clic para subirlos.</p>
      <input 
        type="file" 
        ref="fileInput" 
        multiple 
        @change="handleFiles" 
        :accept="accept" 
        style="display: none;"
      >
    </div>
    <div v-if="previews.length" class="previews">
      <div v-for="(preview, index) in previews" :key="index" class="preview">
        <i :class="getFileIcon(preview.name)" class="file-icon"></i>
        <p>{{ preview.name }}</p>
        <button @click="removeFile(index)">Remove</button>
      </div>
    </div>
    <button class="btn-upload" v-if="previews.length && showButton" @click.prevent="uploadFiles">Upload Files</button>
  </div>
  <Toast />
</template>

<script setup>
import { ref, defineEmits, defineProps, defineExpose } from 'vue';
import { useToast } from "primevue/usetoast";

const toast = useToast();
const props = defineProps({
  uploadUrl: {
    type: String,
    required: true
  },
  uploadPath: {
    type: String,
    required: true
  },
  accept: {
    type: String,
    default: '*/*'
  },
  showButton: {
    type: Boolean,
    default: false
  },
  autoUpload: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['uploadSuccess', 'uploadError', 'afterUpload']);

const fileInput = ref(null);
const dragging = ref(false);
const previews = ref([]);

const handleFiles = (event) => {
  const files = event.target.files || event.dataTransfer.files;

  for (const file of files) {
    previews.value.push({ file, name: file.name });
    if (props.autoUpload) {
      uploadFiles();
    }
  }
};

const removeFile = (index) => {
  previews.value.splice(index, 1);
};

const uploadFiles = async () => {
  const formData = new FormData();

  for (const preview of previews.value) {
    formData.append('imagen[]', preview.file);
  }
  
  formData.append('ruta', props.uploadPath);

  try {
    const response = await fetch(props.uploadUrl, {
      method: 'POST',
      body: formData,
    });
    const result = await response.json();
    if (result[0] === 'ok') {
      emit('uploadSuccess', result);
      previews.value = [];
      emit('afterUpload');
      toast.add({ severity: 'success', summary: 'Éxito', detail: 'Archivos subidos con éxito.', life: 3000 });
    } else {
      toast.add({ severity: 'error', summary: 'Error', detail: 'Error al subir los archivos', life: 3000 });
      emit('uploadError', result);
    }
  } catch (error) {
    toast.add({ severity: 'error', summary: 'Error', detail: 'Error de servidor', life: 3000 });
    emit('uploadError', error);
  }
};

const handleDrop = (event) => {
  dragging.value = false;
  handleFiles(event);
};

const triggerFileInput = () => {
  fileInput.value.click();
};

const getFileIcon = (filename) => {
  const extension = filename.split('.').pop().toLowerCase();
  switch (extension) {
    case 'pdf':
      return 'pi pi-file-pdf';
    case 'doc':
    case 'docx':
      return 'pi pi-file-word';
    case 'xls':
    case 'xlsx':
      return 'pi pi-file-excel';
    case 'jpg':
    case 'jpeg':
    case 'png':
    case 'gif':
      return 'pi pi-file-image';
    case 'zip':
    case 'rar':
      return 'pi pi-file-archive';
    default:
      return 'pi pi-file';
  }
};

defineExpose({ uploadFiles });
</script>

<style scoped>
.file-upload-container {
  border: 2px dashed #ccc;
  border-radius: 4px;
  width: 100%;
  margin: 0 auto;
  padding: 20px;
  text-align: center;
  cursor: pointer;
}

.file-upload-area {
  display: flex;
  align-items: center;
  justify-content: center;
  transition: border-color 0.3s;
}

.file-upload-area.dragging {
  border-color: #333;
}

.file-upload-area p {
  font-size: 16px;
  color: #777;
}

.previews {
  display: flex;
  flex-wrap: wrap;
  margin-top: 20px;
}

.preview {
  position: relative;
  width: 100px;
  height: 100px;
  margin: 10px;
  border: 1px solid #ccc;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.file-icon {
  font-size: 24px;
  margin-bottom: 5px;
}

.preview p {
  font-size: 14px;
  word-break: break-all;
  text-align: center;
}

.preview button {
  position: absolute;
  top: 5px;
  right: 5px;
  background: rgba(255, 0, 0, 0.7);
  color: white;
  border: none;
  border-radius: 3px;
  cursor: pointer;
}

.btn-upload {
  margin-top: 20px;
  padding: 10px 20px;
  background-color: #28a745;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
}

.btn-upload:hover {
  background-color: #218838;
}
</style>
