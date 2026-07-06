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
      <p>Drag and drop files here or click to upload.</p>
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
        <img :src="preview.src" alt="Image Preview">
        <button @click="removeImage(index)">Remove</button>
      </div>
    </div>
    <button class="btnimagen" v-if="previews.length && showButton" @click.prevent="fnSubirIMG">Upload Images</button>
  </div>
</template>

<script setup>
import { ref, defineEmits, defineProps, defineExpose } from 'vue';

const props = defineProps({
  urlIMAGEN: {
    type: String,
    required: true
  },
  rutaIMAGEN: {
    type: String,
    required: true
  },
  accept: {
    type: String,
    default: 'image/*'
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
    const reader = new FileReader();
    reader.onload = (e) => {
      previews.value.push({ file, src: e.target.result });
      if (props.autoUpload) {
        fnSubirIMG();
      }
    };
    reader.readAsDataURL(file);
  }
};

const removeImage = (index) => {
  previews.value.splice(index, 1);
};

const fnSubirIMG = async () => {
  const formData = new FormData();

  for (const preview of previews.value) {
    formData.append('imagen[]', preview.file);
  }
  
  formData.append('ruta', props.rutaIMAGEN);

  try {
    const response = await fetch(props.urlIMAGEN, {
      method: 'POST',
      body: formData,
    });
    const result = await response.json();
    if (result[0].status == 'ok') {
      emit('uploadSuccess', result);
      previews.value = [];
      emit('afterUpload');
    } else {
      console.error('Error al subir la imagen');
      emit('uploadError', result);
    }
  } catch (error) {
    console.error('Error en la solicitud:', error);
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

defineExpose({ fnSubirIMG });
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
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.preview img {
  max-width: 100%;
  max-height: 100%;
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

.btnimagen {
  margin-top: 20px;
  padding: 10px 20px;
  background-color: #28a745;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
}

.btnimagen:hover {
  background-color: #218838;
}
</style>
