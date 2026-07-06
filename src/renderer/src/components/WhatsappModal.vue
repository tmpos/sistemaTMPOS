<template>
  <Dialog
    v-model:visible="visible"
    :position="position"
    modal
    :style="{ width: '56rem' }"
    :breakpoints="{ '1199px': '75vw', '575px': '90vw' }"
    class="whatsapp-modal"
  >
    <template #header>
      <div class="whatsapp-header">
        <div class="whatsapp-icon-wrapper">
          <i class="pi pi-whatsapp whatsapp-icon"></i>
        </div>
        <div class="whatsapp-header-text">
          <h2 class="whatsapp-title">Enviar mensaje de WhatsApp</h2>
          <p class="whatsapp-subtitle">Complete los datos para enviar el mensaje</p>
        </div>
      </div>
    </template>

    <div class="whatsapp-content">
      <div class="whatsapp-layout">
        <section class="preview-column">
          <div class="whatsapp-preview-card">
            <div class="whatsapp-preview-header">
              <i class="pi pi-eye"></i>
              <span>Vista previa del mensaje</span>
            </div>
            <div class="whatsapp-chat-preview">
              <div class="whatsapp-message-bubble">
                <div class="message-sender">
                  <i class="pi pi-user"></i>
                  <span>{{ datosWhatsApp.nombre || 'Nombre del destinatario' }}</span>
                </div>
                <div class="message-number">
                  <i class="pi pi-phone"></i>
                  <span>{{ datosWhatsApp.numero || 'Número de teléfono' }}</span>
                </div>
                <div class="message-divider"></div>
                <div class="message-content">
                  {{ datosWhatsApp.texto || 'Tu mensaje aparecerá aquí...' }}
                </div>
                <div class="message-time">{{ currentTime }}</div>
              </div>
            </div>
          </div>
        </section>

        <section class="form-column">
          <form id="formularioEnviarWhatsApp" @submit.prevent="enviarWhatsApp" class="whatsapp-form">
            <div class="form-grid">
              <div class="form-field-whatsapp">
                <label class="whatsapp-label">
                  <i class="pi pi-user"></i>
                  <span>Nombre del Destinatario</span>
                  <span class="required-mark">*</span>
                </label>
                <InputText
                  v-model="datosWhatsApp.nombre"
                  placeholder="Ej: Juan Pérez"
                  fluid
                  class="whatsapp-input"
                  :class="{ 'input-filled': datosWhatsApp.nombre }"
                />
              </div>

              <div class="form-field-whatsapp">
                <label class="whatsapp-label">
                  <i class="pi pi-phone"></i>
                  <span>Número de Teléfono</span>
                  <span class="required-mark">*</span>
                </label>
                <InputText
                  v-model="datosWhatsApp.numero"
                  placeholder="Ej: 1 (809) 555-1234"
                  fluid
                  class="whatsapp-input"
                  :class="{ 'input-filled': datosWhatsApp.numero }"
                />
                <small class="input-help">
                  <i class="pi pi-info-circle"></i>
                  Incluya código de país (ej: 1 para Rep. Dom.)
                </small>
              </div>

              <div class="form-field-whatsapp full-width">
                <label class="whatsapp-label">
                  <i class="pi pi-comment"></i>
                  <span>Mensaje</span>
                  <span class="required-mark">*</span>
                </label>
                <Textarea
                  v-model="datosWhatsApp.texto"
                  rows="7"
                  placeholder="Escribe tu mensaje aquí..."
                  fluid
                  class="whatsapp-textarea"
                  :class="{ 'input-filled': datosWhatsApp.texto }"
                  :maxlength="1000"
                />
                <div class="textarea-footer">
                  <small class="input-help">
                    <i class="pi pi-info-circle"></i>
                    El mensaje se abrirá en WhatsApp Web
                  </small>
                  <small class="char-counter" :class="{ 'char-limit': (datosWhatsApp.texto?.length || 0) > 900 }">
                    {{ datosWhatsApp.texto?.length || 0 }} / 1000
                  </small>
                </div>
              </div>
            </div>
          </form>
        </section>
      </div>
    </div>

    <template #footer>
      <div class="whatsapp-footer">
        <Button
          label="Cancelar"
          icon="pi pi-times"
          outlined
          severity="secondary"
          @click="visible = false"
          class="footer-btn cancel-btn"
        />
        <Button
          v-if="puedeCopiarPdf"
          :label="copiandoPdf ? 'Copiando...' : 'Copiar PDF'"
          icon="pi pi-file-pdf"
          severity="info"
          outlined
          @click="copiarPdf"
          class="footer-btn pdf-btn"
          :disabled="copiandoPdf"
        />
        <Button
          label="Enviar por WhatsApp"
          icon="pi pi-send"
          severity="success"
          @click="enviarWhatsApp"
          class="footer-btn send-btn"
          :disabled="!isFormValid"
        />
      </div>
    </template>
  </Dialog>
</template>

<script setup>
import { ref, watch, onMounted, defineExpose, computed } from 'vue';
import { useToast } from "primevue/usetoast";
import QRCode from 'qrcode';
const qrCode = ref('');
const toast = useToast();
const props = defineProps({
  initialDatosWhatsApp: {
    type: Object,
    required: true
  }
});
/**********************************************************/
import {
  envioElectron
  } from '../funciones/funciones.js';
/**********************************************************/
const patronTelefono = ref('');
/**********************************************************/
const empaquesDefault = ref([])
/**********************************************************/
const visible = ref(false);
const position = ref('center');
const datosWhatsApp = ref({ ...props.initialDatosWhatsApp });
const currentTime = ref('');
const copiandoPdf = ref(false);

/**********************************************************/
// Computed property para validar el formulario
const isFormValid = computed(() => {
  return datosWhatsApp.value.nombre &&
         datosWhatsApp.value.numero &&
         datosWhatsApp.value.texto;
});

const puedeCopiarPdf = computed(() => typeof datosWhatsApp.value?.copiarPdf === 'function');

/**********************************************************/
// Función para actualizar el tiempo
function updateTime() {
  const now = new Date();
  const hours = now.getHours().toString().padStart(2, '0');
  const minutes = now.getMinutes().toString().padStart(2, '0');
  currentTime.value = `${hours}:${minutes}`;
}


/**********************************************************/

/**********************************************************/

/**********************************************************/
onMounted(async () => {
  //const datosJSON = await window.electron.ipcRenderer.invoke('datosarchivo');
  const datosJSON = await envioElectron('datosarchivo');
  patronTelefono.value = datosJSON.VITE_PATRON_TELEFONO;

  // Actualizar tiempo inicial
  updateTime();

  // Actualizar tiempo cada minuto
  setInterval(updateTime, 60000);
})
/**********************************************************/

/**********************************************************/
watch(() => props.initialDatosWhatsApp, (newVal) => {
  datosWhatsApp.value = { ...newVal };
}, { immediate: true });

function updateDatosWhatsApp(newDatosWhatsApp) {
  datosWhatsApp.value = { ...newDatosWhatsApp };
}

function limpiarNumeroTelefono(numero) {
    return numero.replace(/[\s()+-]/g, '');
}

async function enviarWhatsApp() {
 // const url = `https://api.whatsapp.com/send?phone=${datosWhatsApp.value.numero}&text=${encodeURIComponent(datosWhatsApp.value.texto)}`;
  if (datosWhatsApp.value.nombre && datosWhatsApp.value.numero && datosWhatsApp.value.texto) {
  const numeroEnviar = limpiarNumeroTelefono(datosWhatsApp.value.numero)

const mensaje = encodeURIComponent(datosWhatsApp.value.texto);
const url = `https://wa.me/${numeroEnviar}?text=${mensaje}`;

      window.open(url, '_blank');


    limpiarCamposEnviar();
    visible.value = false;
  } else {
    toast.add({ severity: 'error', summary: 'Error', detail: 'Todos los campos son obligatorios.', life: 3000 });
  }
}

async function copiarPdf() {
  if (!puedeCopiarPdf.value) return;

  copiandoPdf.value = true;
  try {
    const resultado = await datosWhatsApp.value.copiarPdf();
    const pdfBlob = resultado instanceof Blob ? resultado : resultado?.blob;
    const fileName = resultado?.fileName || `Factura_${datosWhatsApp.value?.facturaNumero || 'sin_numero'}.pdf`;

    if (!(pdfBlob instanceof Blob)) {
      throw new Error('No se pudo generar el PDF');
    }

    if (window.electron?.ipcRenderer) {
      const base64 = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result).split(',')[1] || '');
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(pdfBlob);
      });

      const resultado = await window.electron.ipcRenderer.invoke('copiar-pdf-archivo', {
        fileName,
        base64
      });

      if (!resultado?.success) {
        throw new Error(resultado?.error || 'No se pudo copiar el archivo PDF');
      }
    } else {
      if (!window.ClipboardItem || !navigator.clipboard?.write) {
        throw new Error('El portapapeles de archivos no esta disponible en este navegador');
      }

      const pdfFile = new File([pdfBlob], fileName, { type: 'application/pdf' });
      await navigator.clipboard.write([
        new ClipboardItem({
          [pdfFile.type]: pdfFile
        })
      ]);
    }

    toast.add({
      severity: 'success',
      summary: 'PDF copiado',
      detail: 'WhatsApp abierto. Presiona Ctrl+V en la conversación para pegar el PDF.',
      life: 5000
    });

    const numeroEnviar = limpiarNumeroTelefono(datosWhatsApp.value.numero);
    const mensaje = encodeURIComponent(datosWhatsApp.value.texto);
    const url = `https://wa.me/${numeroEnviar}?text=${mensaje}`;
    window.open(url, '_blank');
  } catch (error) {
    console.error('Error copiando PDF:', error);
    toast.add({
      severity: 'error',
      summary: 'No se pudo copiar',
      detail: error?.message || 'No se pudo copiar el PDF al portapapeles.',
      life: 4500
    });
  } finally {
    copiandoPdf.value = false;
  }
}

function limpiarCamposEnviar() {
  datosWhatsApp.value = {
    nombre: '',
    numero: '',
    texto: '',
    copiarPdf: null,
    facturaNumero: ''
  };
}

defineExpose({
  visible,
  updateDatosWhatsApp
});
</script>

<style scoped>
/* WhatsApp Modal Styles */
.whatsapp-modal :deep(.p-dialog) {
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 24px 48px rgba(15, 23, 42, 0.18);
}

.whatsapp-modal :deep(.p-dialog-header) {
  background: linear-gradient(135deg, #25D366 0%, #128C7E 100%);
  padding: 1.5rem;
  border-bottom: none;
}

.whatsapp-modal :deep(.p-dialog-content) {
  padding: 0;
  background: linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%);
}

.whatsapp-modal :deep(.p-dialog-footer) {
  padding: 1rem 1.5rem;
  background: #ffffff;
  border-top: 1px solid #e5e7eb;
}

/* Header */
.whatsapp-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  width: 100%;
}

.whatsapp-icon-wrapper {
  width: 56px;
  height: 56px;
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(10px);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.25);
}

.whatsapp-icon {
  font-size: 2rem;
  color: white;
}

.whatsapp-header-text {
  flex: 1;
}

.whatsapp-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: white;
  margin: 0;
  line-height: 1.2;
}

.whatsapp-subtitle {
  font-size: 0.875rem;
  color: rgba(255, 255, 255, 0.9);
  margin: 0.25rem 0 0 0;
}

/* Content */
.whatsapp-content {
  padding: 1.5rem;
}

.whatsapp-layout {
  display: grid;
  grid-template-columns: 0.95fr 1.2fr;
  gap: 1rem;
}

.preview-column,
.form-column {
  min-width: 0;
}

/* Preview Card */
.whatsapp-preview-card {
  background: white;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 10px 30px rgba(15, 23, 42, 0.08);
  border: 1px solid #e2e8f0;
}

.whatsapp-preview-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: linear-gradient(135deg, #25D366 0%, #128C7E 100%);
  color: white;
  font-weight: 600;
  font-size: 0.875rem;
}

.whatsapp-chat-preview {
  padding: 1.5rem;
  background: #ecfdf5;
  min-height: 200px;
  background-image:
    repeating-linear-gradient(
      45deg,
      transparent,
      transparent 10px,
      rgba(15, 118, 110, 0.03) 10px,
      rgba(15, 118, 110, 0.03) 20px
    );
}

.whatsapp-message-bubble {
  background: #dcf8c6;
  border-radius: 14px;
  padding: 1rem;
  max-width: 85%;
  margin-left: auto;
  box-shadow: 0 6px 16px rgba(15, 23, 42, 0.12);
  position: relative;
}

.whatsapp-message-bubble::before {
  content: '';
  position: absolute;
  right: -8px;
  bottom: 10px;
  width: 0;
  height: 0;
  border-left: 10px solid #dcf8c6;
  border-top: 5px solid transparent;
  border-bottom: 5px solid transparent;
}

.message-sender {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 600;
  color: #075E54;
  margin-bottom: 0.5rem;
  font-size: 0.95rem;
}

.message-number {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #667781;
  margin-bottom: 0.75rem;
  font-size: 0.875rem;
}

.message-divider {
  height: 1px;
  background: rgba(0, 0, 0, 0.1);
  margin: 0.75rem 0;
}

.message-content {
  color: #303030;
  line-height: 1.5;
  white-space: pre-wrap;
  word-wrap: break-word;
  margin-bottom: 0.5rem;
  font-size: 0.95rem;
}

.message-time {
  text-align: right;
  font-size: 0.75rem;
  color: #667781;
}

/* Form */
.whatsapp-form {
  background: white;
  border-radius: 16px;
  padding: 1.5rem;
  box-shadow: 0 10px 30px rgba(15, 23, 42, 0.08);
  border: 1px solid #e2e8f0;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1.25rem;
}

.form-field-whatsapp {
  display: flex;
  flex-direction: column;
}

.form-field-whatsapp.full-width {
  grid-column: span 2;
}

.whatsapp-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 600;
  color: #374151;
  margin-bottom: 0.5rem;
  font-size: 0.95rem;
  transition: all 0.3s ease;
}

.whatsapp-label i {
  color: #25D366;
  font-size: 1rem;
}

.required-mark {
  color: #ef4444;
  margin-left: 0.125rem;
}

.whatsapp-input,
.whatsapp-textarea {
  transition: all 0.3s ease;
}

.whatsapp-input:focus,
.whatsapp-textarea:focus {
  transform: translateY(-1px);
  box-shadow: 0 4px 6px -1px rgba(37, 211, 102, 0.2), 0 2px 4px -1px rgba(37, 211, 102, 0.1);
  border-color: #25D366 !important;
}

.input-filled {
  border-color: #25D366 !important;
  background: #f0fdf4;
}

.input-help {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  color: #6b7280;
  font-size: 0.8125rem;
  margin-top: 0.375rem;
}

.input-help i {
  font-size: 0.75rem;
  color: #9ca3af;
}

.textarea-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 0.5rem;
}

.char-counter {
  color: #6b7280;
  font-size: 0.8125rem;
  font-weight: 500;
}

.char-counter.char-limit {
  color: #ef4444;
  font-weight: 600;
}

/* Footer */
.whatsapp-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
}

.footer-btn {
  font-weight: 600;
  padding: 0.8rem 1.6rem;
  border-radius: 12px;
  transition: all 0.3s ease;
}

.footer-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
}

.send-btn {
  background: linear-gradient(135deg, #25D366 0%, #128C7E 100%);
  border: none;
}

.send-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.send-btn:disabled:hover {
  transform: none;
}

/* Responsive */
@media (max-width: 768px) {
  .whatsapp-layout {
    grid-template-columns: 1fr;
  }

  .form-grid {
    grid-template-columns: 1fr;
  }

  .form-field-whatsapp.full-width {
    grid-column: span 1;
  }

  .whatsapp-message-bubble {
    max-width: 95%;
  }

  .whatsapp-footer {
    flex-direction: column-reverse;
  }

  .footer-btn {
    width: 100%;
  }
}

/* Dark mode support */
:deep(.dark) .whatsapp-modal :deep(.p-dialog-content) {
  background: #1f2937;
}

:deep(.dark) .whatsapp-preview-card,
:deep(.dark) .whatsapp-form {
  background: #374151;
}

:deep(.dark) .whatsapp-label {
  color: #d1d5db;
}

:deep(.dark) .message-content {
  color: #1f2937;
}

:deep(.dark) .whatsapp-modal :deep(.p-dialog-footer) {
  background: #1f2937;
  border-top-color: #374151;
}
</style>
