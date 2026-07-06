<template>
  <Dialog
    v-model:visible="visible"
    modal
    :style="{ width: '650px' }"
    :closable="!loading"
    :dismissableMask="!loading"
  >
    <!-- Header Personalizado -->
    <template #header>
      <div class="flex items-center gap-3">
        <div class="bg-blue-100 text-blue-700 rounded-full p-3">
          <i class="pi pi-envelope text-2xl"></i>
        </div>
        <div>
          <h3 class="text-xl font-bold text-gray-800 m-0">Enviar Correo Electrónico</h3>
          <p class="text-sm text-gray-500 m-0 mt-1">Complete los campos para enviar su mensaje</p>
        </div>
      </div>
    </template>

    <!-- Contenido con diseño profesional -->
    <div class="flex flex-col gap-4 py-2">

      <!-- Campo de destinatario con validación visual -->
      <div class="flex flex-col gap-2">
        <label class="font-semibold text-gray-700 flex items-center gap-2">
          <i class="pi pi-user text-blue-600"></i>
          Destinatario
          <span class="text-red-500">*</span>
        </label>
        <div class="p-inputgroup">
          <span class="p-inputgroup-addon bg-blue-50">
            <i class="pi pi-at text-blue-600"></i>
          </span>
          <InputText
            v-model="form.mailto"
            placeholder="correo@ejemplo.com"
            :class="['w-full', emailValido ? 'border-green-300' : '']"
            @blur="validarEmail"
          />
          <span v-if="emailValido" class="p-inputgroup-addon bg-green-50">
            <i class="pi pi-check text-green-600"></i>
          </span>
        </div>
        <small v-if="form.mailto && !emailValido" class="text-red-500 flex items-center gap-1">
          <i class="pi pi-exclamation-circle"></i>
          Ingrese un correo electrónico válido
        </small>
      </div>

      <!-- Campo de asunto -->
      <div class="flex flex-col gap-2">
        <label class="font-semibold text-gray-700 flex items-center gap-2">
          <i class="pi pi-bookmark text-purple-600"></i>
          Asunto
        </label>
        <div class="p-inputgroup">
          <span class="p-inputgroup-addon bg-purple-50">
            <i class="pi pi-tag text-purple-600"></i>
          </span>
          <InputText
            v-model="form.subjet"
            placeholder="Ej: Factura de servicios - Enero 2026"
            class="w-full"
          />
        </div>
      </div>

      <!-- Campo de mensaje -->
      <div class="flex flex-col gap-2">
        <label class="font-semibold text-gray-700 flex items-center gap-2">
          <i class="pi pi-align-left text-orange-600"></i>
          Mensaje
        </label>
        <Textarea
          v-model="form.mensaje"
          rows="6"
          class="w-full"
          placeholder="Escriba aquí el contenido de su mensaje..."
        />
        <small class="text-gray-500 text-right">{{ form.mensaje?.length || 0 }} caracteres</small>
      </div>

      <!-- Campo de archivo con FileUpload mejorado -->
      <div class="flex flex-col gap-2">
        <label class="font-semibold text-gray-700 flex items-center gap-2">
          <i class="pi pi-paperclip text-green-600"></i>
          Adjuntar Archivo
          <span class="text-xs text-gray-500 font-normal">(Opcional)</span>
        </label>

        <div class="border-2 border-dashed border-gray-300 rounded-lg p-4 bg-gray-50 hover:bg-gray-100 transition-colors">
          <div v-if="!file" class="text-center">
            <i class="pi pi-cloud-upload text-4xl text-gray-400 mb-3"></i>
            <p class="text-gray-600 mb-2">Arrastre un archivo aquí o haga clic para seleccionar</p>
            <input
              type="file"
              @change="handleFile"
              class="hidden"
              ref="fileInput"
            />
            <Button
              label="Seleccionar Archivo"
              icon="pi pi-upload"
              @click="$refs.fileInput.click()"
              severity="secondary"
              outlined
              size="small"
            />
          </div>

          <div v-else class="flex items-center justify-between bg-white p-3 rounded-lg border border-gray-200">
            <div class="flex items-center gap-3">
              <div class="bg-green-100 text-green-700 rounded-lg p-2">
                <i class="pi pi-file text-xl"></i>
              </div>
              <div>
                <p class="font-semibold text-gray-700 m-0">{{ file.name }}</p>
                <p class="text-sm text-gray-500 m-0">{{ formatFileSize(file.size) }}</p>
              </div>
            </div>
            <Button
              icon="pi pi-times"
              @click="removeFile"
              severity="danger"
              text
              rounded
              size="small"
            />
          </div>
        </div>
      </div>

    </div>

    <!-- Footer con botones profesionales -->
    <template #footer>
      <div class="flex justify-end gap-3">
        <Button
          label="Cancelar"
          icon="pi pi-times"
          @click="visible = false"
          severity="secondary"
          outlined
          :disabled="loading"
        />
        <Button
          :label="loading ? 'Enviando...' : 'Enviar Correo'"
          :icon="loading ? 'pi pi-spin pi-spinner' : 'pi pi-send'"
          @click="enviarCorreo"
          :disabled="loading || !emailValido || !form.mailto"
          severity="primary"
          class="px-6"
        />
      </div>
    </template>
  </Dialog>
</template>

<script setup>
import { ref, computed, defineExpose } from 'vue';
import { useToast } from 'primevue/usetoast';
import { peticionesFetchOffline, enviarDatosLocalStorage } from '@/funciones/funciones.js';

const toast = useToast();
const visible = ref(false);
const file = ref(null);
const fileInput = ref(null);
const loading = ref(false);

const form = ref({
  mailto: '',
  subjet: '',
  mensaje: '',
  albody: ''
});

// props opcionales que puedes pasar desde el padre
const props = defineProps({
  apiBase: String,
  token: String,
  filename: String // nombre del archivo por defecto si se lo pasas desde otro componente
});

// Validación de email
const emailValido = computed(() => {
  if (!form.value.mailto) return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(form.value.mailto);
});

const validarEmail = () => {
  // Validación visual al perder el foco
  if (form.value.mailto && !emailValido.value) {
    toast.add({
      severity: 'warn',
      summary: 'Email inválido',
      detail: 'Por favor ingrese un correo electrónico válido',
      life: 2000
    });
  }
};

// Formatear tamaño de archivo
const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
};

const show = (preFill = {}) => {
  form.value = {
    mailto: '',
    subjet: '',
    mensaje: '',
    albody: ''
  };
  form.value = { ...form.value, ...preFill };
  file.value = null;
  loading.value = false;
  visible.value = true;
};
defineExpose({ show });

const handleFile = (e) => {
  const selectedFile = e.target.files[0];
  if (selectedFile) {
    // Validar tamaño máximo (ejemplo: 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (selectedFile.size > maxSize) {
      toast.add({
        severity: 'warn',
        summary: 'Archivo muy grande',
        detail: 'El archivo no debe superar 10MB',
        life: 3000
      });
      return;
    }
    file.value = selectedFile;
    toast.add({
      severity: 'success',
      summary: 'Archivo adjuntado',
      detail: `${selectedFile.name} listo para enviar`,
      life: 2000
    });
  }
};

const removeFile = () => {
  file.value = null;
  if (fileInput.value) {
    fileInput.value.value = '';
  }
  toast.add({
    severity: 'info',
    summary: 'Archivo removido',
    detail: 'El adjunto ha sido eliminado',
    life: 2000
  });
};

// Convertir archivo a base64
const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      // El resultado es "data:tipo;base64,contenido" - extraer solo el contenido
      const base64 = reader.result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

const enviarCorreo = async () => {
  if (!form.value.mailto) {
    toast.add({
      severity: 'warn',
      summary: 'Falta el correo',
      detail: 'Debe ingresar un destinatario.',
      life: 3000
    });
    return;
  }

  if (!emailValido.value) {
    toast.add({
      severity: 'warn',
      summary: 'Email inválido',
      detail: 'Por favor ingrese un correo electrónico válido',
      life: 3000
    });
    return;
  }

  // Verificar si estamos en Electron
  if (!window.electron?.ipcRenderer) {
    toast.add({
      severity: 'error',
      summary: 'No disponible',
      detail: 'El envío de correo solo funciona en la aplicación de escritorio.',
      life: 5000
    });
    return;
  }

  loading.value = true;

  try {
    // Obtener configuración del correo desde la base de datos
    const datoscorreo = await peticionesFetchOffline('getDataByField', 'configuracion_correo', 'id', 1);

    if (!datoscorreo) {
      throw new Error('No se encontró configuración de correo. Por favor configure el correo en Ajustes.');
    }

    console.log('Configuración de correo obtenida:', { email: datoscorreo.email });

    // Preparar objeto para envío
    const datosEmpresa = enviarDatosLocalStorage();
    const envioCorreo = {
      mailto: form.value.mailto,
      subjet: form.value.subjet || 'Mensaje del sistema',
      mensaje: form.value.mensaje || 'Sin contenido',
      albody: form.value.albody || form.value.mensaje || '',
      correo: datoscorreo,
      empresa: datosEmpresa?.empresa?.nombre || 'Sistema AA'
    };

    // Si hay archivo adjunto, convertirlo a base64
    if (file.value) {
      const fileBase64 = await fileToBase64(file.value);
      envioCorreo.fileBase64 = fileBase64;
      envioCorreo.filename = file.value.name;
      console.log('Archivo adjunto:', { nombre: file.value.name, tamaño: formatFileSize(file.value.size) });
    }

    console.log('Enviando correo a:', envioCorreo.mailto);

    // Enviar correo usando IPC
    const resultado = await window.electron.ipcRenderer.invoke('enviarCorreo', envioCorreo);

    console.log('Resultado del envío:', resultado);

    if (resultado?.ok) {
      const adjuntosMsg = resultado.adjuntos > 0 ? ` con ${resultado.adjuntos} adjunto(s)` : '';
      toast.add({
        severity: 'success',
        summary: '✓ Correo enviado',
        detail: `El mensaje se envió exitosamente${adjuntosMsg}.`,
        life: 3000
      });

      visible.value = false;

      // Limpiar formulario
      form.value = {
        mailto: '',
        subjet: '',
        mensaje: '',
        albody: ''
      };
      file.value = null;
      if (fileInput.value) {
        fileInput.value.value = '';
      }
    } else {
      throw new Error(resultado?.error || 'Error desconocido al enviar correo');
    }
  } catch (error) {
    console.error('Error completo al enviar correo:', error);

    let mensajeError = 'No se pudo enviar el correo.';

    if (error.message?.includes('configuración')) {
      mensajeError = error.message;
    } else if (error.message?.includes('Configuración de correo incompleta')) {
      mensajeError = 'Configuración de correo incompleta. Verifique email y contraseña en Ajustes.';
    } else if (error.message?.includes('Invalid login')) {
      mensajeError = 'Error de autenticación. Verifique las credenciales del correo en Ajustes.';
    } else if (error.message) {
      mensajeError = error.message;
    }

    toast.add({
      severity: 'error',
      summary: 'Error al enviar',
      detail: mensajeError,
      life: 5000
    });
  } finally {
    loading.value = false;
  }
};
</script>
