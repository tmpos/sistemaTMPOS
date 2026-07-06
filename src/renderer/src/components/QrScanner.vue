<template>
  <div class="qr-scanner-container">
    <!-- Botón para abrir/cerrar el escáner -->
    <Button
      v-if="!scanning"
      :label="buttonLabel"
      icon="pi pi-camera"
      @click="startScanner"
      :class="buttonClass"
      :disabled="!cameraAvailable"
    />

    <!-- Modal del escáner -->
    <Dialog
      v-model:visible="scanning"
      header="Escanear Código QR"
      :modal="true"
      :style="{ width: '90vw', maxWidth: '600px' }"
      @hide="stopScanner"
    >
      <div class="scanner-content">
        <!-- Video preview -->
        <div id="qr-reader" class="qr-reader"></div>

        <!-- Mensaje de ayuda -->
        <div class="scanner-help mt-3">
          <i class="pi pi-info-circle"></i>
          <span>Apunta la cámara hacia el código QR de la factura</span>
        </div>

        <!-- Resultado -->
        <div v-if="lastResult" class="scanner-result mt-3">
          <i class="pi pi-check-circle"></i>
          <span>Código detectado: {{ lastResult }}</span>
        </div>
      </div>

      <template #footer>
        <Button
          label="Cancelar"
          icon="pi pi-times"
          @click="stopScanner"
          class="p-button-text"
        />
      </template>
    </Dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import { useToast } from 'primevue/usetoast'

const props = defineProps({
  buttonLabel: {
    type: String,
    default: 'Escanear QR'
  },
  buttonClass: {
    type: String,
    default: 'p-button-outlined'
  }
})

const emit = defineEmits(['scan'])
const toast = useToast()

// Estados
const scanning = ref(false)
const cameraAvailable = ref(true)
const lastResult = ref('')
let html5QrCode = null

// Verificar disponibilidad de cámara
onMounted(() => {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    cameraAvailable.value = false
    console.warn('La cámara no está disponible en este dispositivo')
  }
})

// Iniciar escáner
const startScanner = async () => {
  scanning.value = true
  lastResult.value = ''

  // Esperar a que el DOM esté listo
  await new Promise(resolve => setTimeout(resolve, 100))

  try {
    // Importar librería dinámicamente
    const { Html5Qrcode } = await import('html5-qrcode')

    html5QrCode = new Html5Qrcode('qr-reader')

    const config = {
      fps: 10, // Frames por segundo
      qrbox: { width: 250, height: 250 }, // Área de escaneo
      aspectRatio: 1.0
    }

    // Iniciar escáner
    await html5QrCode.start(
      { facingMode: 'environment' }, // Cámara trasera
      config,
      onScanSuccess,
      onScanError
    )
  } catch (error) {
    console.error('Error al iniciar el escáner:', error)
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'No se pudo iniciar la cámara. Verifica los permisos.',
      life: 5000
    })
    scanning.value = false
  }
}

// Detener escáner
const stopScanner = async () => {
  if (html5QrCode) {
    try {
      await html5QrCode.stop()
      html5QrCode.clear()
      html5QrCode = null
    } catch (error) {
      console.error('Error al detener el escáner:', error)
    }
  }
  scanning.value = false
  lastResult.value = ''
}

// Callback cuando se escanea exitosamente
const onScanSuccess = (decodedText, decodedResult) => {
  console.log('QR escaneado:', decodedText)
  lastResult.value = decodedText

  // Emitir evento con el resultado
  emit('scan', decodedText)

  // Detener escáner después de un pequeño delay
  setTimeout(() => {
    stopScanner()
    toast.add({
      severity: 'success',
      summary: 'QR Escaneado',
      detail: 'Código detectado correctamente',
      life: 3000
    })
  }, 500)
}

// Callback de error (opcional, no mostrar errores continuos)
const onScanError = (errorMessage) => {
  // No hacer nada, los errores son normales mientras busca el QR
  // console.warn('Error escaneando:', errorMessage)
}

// Limpiar al desmontar
onBeforeUnmount(() => {
  stopScanner()
})

// Exponer método para uso externo
defineExpose({
  startScanner,
  stopScanner
})
</script>

<style scoped>
.qr-scanner-container {
  display: inline-block;
}

.scanner-content {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.qr-reader {
  width: 100%;
  max-width: 500px;
  border: 2px solid #667eea;
  border-radius: 8px;
  overflow: hidden;
}

.scanner-help {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem;
  background-color: #f0f4ff;
  border-radius: 8px;
  color: #4a5568;
  text-align: center;
}

.scanner-help i {
  color: #667eea;
  font-size: 1.2rem;
}

.scanner-result {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem;
  background-color: #f0fdf4;
  border-radius: 8px;
  color: #166534;
  animation: fadeIn 0.3s ease-in;
}

.scanner-result i {
  color: #22c55e;
  font-size: 1.2rem;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Ocultar el selector de cámara de html5-qrcode si no es necesario */
:deep(#qr-reader__dashboard_section_csr) {
  display: none;
}

:deep(#qr-reader__camera_permission_button) {
  background-color: #667eea !important;
  color: white !important;
  padding: 0.75rem 1.5rem !important;
  border-radius: 8px !important;
  border: none !important;
  font-size: 1rem !important;
  cursor: pointer !important;
}

:deep(video) {
  border-radius: 8px;
}
</style>
