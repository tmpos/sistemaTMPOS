<template>
  <main class="firma-page">
    <section class="firma-card">
      <header class="firma-header">
        <span>Entrega de taller</span>
        <h1>Firma de conformidad</h1>
        <p>Revise la informacion de la orden y firme para confirmar la entrega del equipo.</p>
      </header>

      <div v-if="cargando" class="estado">
        <i class="pi pi-spin pi-spinner"></i>
        <span>Cargando orden...</span>
      </div>

      <div v-else-if="error" class="estado error">
        <i class="pi pi-exclamation-triangle"></i>
        <span>{{ error }}</span>
      </div>

      <section v-else-if="orden" class="contenido">
        <div class="orden-box">
          <div>
            <small>Orden</small>
            <strong>#{{ orden.no_factura }}</strong>
          </div>
          <div>
            <small>Cliente</small>
            <strong>{{ orden.nombre || 'No registrado' }}</strong>
          </div>
          <div>
            <small>Equipo</small>
            <strong>{{ equipo }}</strong>
          </div>
          <div>
            <small>Total</small>
            <strong>{{ money(orden.total) }}</strong>
          </div>
        </div>

        <div v-if="orden.firma_entrega" class="firmado">
          <i class="pi pi-check-circle"></i>
          <div>
            <strong>Esta orden ya fue firmada.</strong>
            <span>{{ orden.firma_entrega_nombre || orden.nombre }} - {{ orden.firma_entrega_fecha || '' }}</span>
          </div>
        </div>

        <div class="form-grid">
          <label>
            Nombre de quien recibe
            <input v-model="nombreFirma" type="text" placeholder="Nombre completo" />
          </label>
          <label>
            Cedula / documento
            <input v-model="documentoFirma" type="text" placeholder="Documento de identidad" />
          </label>
        </div>

        <div class="firma-wrap">
          <div class="firma-title">
            <strong>Firma</strong>
            <button type="button" @click="limpiarFirma">Limpiar</button>
          </div>
          <canvas
            ref="canvasRef"
            class="firma-canvas"
            @pointerdown="iniciarFirma"
            @pointermove="dibujarFirma"
            @pointerup="terminarFirma"
            @pointerleave="terminarFirma"
          ></canvas>
        </div>

        <label class="aceptacion">
          <input v-model="acepta" type="checkbox" />
          Confirmo que recibi el equipo indicado y acepto la entrega en las condiciones informadas.
        </label>

        <button class="btn-firmar" type="button" :disabled="guardando" @click="guardarFirma">
          <i :class="guardando ? 'pi pi-spin pi-spinner' : 'pi pi-check'"></i>
          {{ guardando ? 'Guardando...' : 'Guardar firma' }}
        </button>
      </section>
    </section>
  </main>
</template>

<script setup>
import { computed, nextTick, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import Swal from 'sweetalert2'
import { nfecha, peticionesFetchOffline } from '@/funciones/funciones.js'

const route = useRoute()
const canvasRef = ref(null)
const orden = ref(null)
const cargando = ref(true)
const guardando = ref(false)
const error = ref('')
const nombreFirma = ref('')
const documentoFirma = ref('')
const acepta = ref(false)
const firmando = ref(false)
const firmo = ref(false)

const camposFirma = ['firma_entrega', 'firma_entrega_nombre', 'firma_entrega_fecha', 'firma_entrega_documento', 'firma_entrega_token', 'piezas_usadas']

const equipo = computed(() => [orden.value?.equipo, orden.value?.marca, orden.value?.modelo].filter(Boolean).join(' ') || 'Equipo')

const money = (value) =>
  new Intl.NumberFormat('es-DO', { style: 'currency', currency: 'DOP' }).format(Number(value) || 0)

const asegurarCampos = async () => {
  try {
    const columnas = await peticionesFetchOffline('getTableColumns', 'taller')
    const actuales = Array.isArray(columnas) ? columnas : []
    for (const campo of camposFirma) {
      if (!actuales.includes(campo)) {
        await peticionesFetchOffline('addColumnToTable', { tabla: 'taller', campo })
      }
    }
  } catch {}
}

const buscarOrden = async () => {
  cargando.value = true
  error.value = ''
  try {
    await asegurarCampos()
    const noFactura = String(route.params.no_factura || route.query.orden || '').trim()
    if (!noFactura) {
      error.value = 'No se recibio el numero de orden.'
      return
    }

    const rows = await peticionesFetchOffline('getDataAsArray', 'taller')
    const encontrada = (Array.isArray(rows) ? rows : []).find((item) => String(item.no_factura || '').trim() === noFactura)
    if (!encontrada) {
      error.value = 'No encontramos esa orden de taller.'
      return
    }

    orden.value = encontrada
    nombreFirma.value = encontrada.firma_entrega_nombre || encontrada.nombre || ''
    documentoFirma.value = encontrada.firma_entrega_documento || encontrada.cedula || ''
    await nextTick()
    prepararCanvas()
  } catch {
    error.value = 'No se pudo cargar la orden.'
  } finally {
    cargando.value = false
  }
}

const prepararCanvas = () => {
  const canvas = canvasRef.value
  if (!canvas) return
  const rect = canvas.getBoundingClientRect()
  const ratio = window.devicePixelRatio || 1
  canvas.width = rect.width * ratio
  canvas.height = rect.height * ratio
  const ctx = canvas.getContext('2d')
  ctx.scale(ratio, ratio)
  ctx.lineWidth = 2.4
  ctx.lineCap = 'round'
  ctx.strokeStyle = '#111827'
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, rect.width, rect.height)
}

const punto = (event) => {
  const rect = canvasRef.value.getBoundingClientRect()
  return { x: event.clientX - rect.left, y: event.clientY - rect.top }
}

const iniciarFirma = (event) => {
  firmando.value = true
  firmo.value = true
  canvasRef.value.setPointerCapture?.(event.pointerId)
  const ctx = canvasRef.value.getContext('2d')
  const p = punto(event)
  ctx.beginPath()
  ctx.moveTo(p.x, p.y)
}

const dibujarFirma = (event) => {
  if (!firmando.value) return
  const ctx = canvasRef.value.getContext('2d')
  const p = punto(event)
  ctx.lineTo(p.x, p.y)
  ctx.stroke()
}

const terminarFirma = () => {
  firmando.value = false
}

const limpiarFirma = () => {
  firmo.value = false
  prepararCanvas()
}

const guardarFirma = async () => {
  if (!nombreFirma.value.trim()) {
    Swal.fire('Falta el nombre', 'Escribe el nombre de quien recibe.', 'warning')
    return
  }
  if (!firmo.value) {
    Swal.fire('Falta la firma', 'Debe firmar antes de guardar.', 'warning')
    return
  }
  if (!acepta.value) {
    Swal.fire('Confirmacion requerida', 'Debe aceptar la conformidad de entrega.', 'warning')
    return
  }

  guardando.value = true
  try {
    const firma = canvasRef.value.toDataURL('image/png')
    const actualizada = {
      ...orden.value,
      firma_entrega: firma,
      firma_entrega_nombre: nombreFirma.value.trim(),
      firma_entrega_documento: documentoFirma.value.trim(),
      firma_entrega_fecha: `${nfecha('fecha')} ${nfecha('hora')}`,
      firma_entrega_token: orden.value.firma_entrega_token || `${orden.value.no_factura}-${Date.now()}`,
      updated_at: nfecha('timestamp')
    }
    const resp = await peticionesFetchOffline('updateData', 'taller', JSON.stringify(actualizada))
    if (resp?.[0] !== 'ok') throw new Error('No guardo')
    orden.value = actualizada
    await Swal.fire('Firma guardada', 'La entrega fue firmada correctamente.', 'success')
  } catch {
    Swal.fire('Error', 'No se pudo guardar la firma.', 'error')
  } finally {
    guardando.value = false
  }
}

onMounted(buscarOrden)
</script>

<style scoped>
.firma-page {
  min-height: 100vh;
  padding: 24px;
  background: #0f172a;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #111827;
}
.firma-card {
  width: min(760px, 100%);
  background: #fff;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 24px 70px rgba(0, 0, 0, 0.28);
}
.firma-header {
  padding: 28px;
  background: #111827;
  color: #fff;
}
.firma-header span {
  display: block;
  color: #38bdf8;
  font-weight: 800;
  text-transform: uppercase;
  font-size: 12px;
  margin-bottom: 8px;
}
.firma-header h1 {
  margin: 0;
  font-size: 30px;
  font-weight: 900;
}
.firma-header p {
  margin: 8px 0 0;
  color: #cbd5e1;
}
.contenido {
  padding: 24px;
}
.estado {
  padding: 32px;
  display: flex;
  align-items: center;
  gap: 10px;
  justify-content: center;
  color: #475569;
  font-weight: 700;
}
.estado.error {
  color: #dc2626;
}
.orden-box {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
  margin-bottom: 16px;
}
.orden-box div {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 12px;
  background: #f8fafc;
}
.orden-box small {
  display: block;
  color: #64748b;
  font-weight: 800;
  text-transform: uppercase;
  font-size: 11px;
  margin-bottom: 5px;
}
.firmado {
  display: flex;
  gap: 10px;
  padding: 12px;
  border-radius: 8px;
  background: #ecfdf5;
  color: #166534;
  margin-bottom: 16px;
}
.firmado span {
  display: block;
  color: #15803d;
}
.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}
label {
  display: block;
  font-weight: 800;
  color: #334155;
}
input[type='text'] {
  width: 100%;
  margin-top: 6px;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  padding: 12px;
  outline: none;
}
.firma-wrap {
  margin-top: 16px;
}
.firma-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}
.firma-title button {
  border: 0;
  background: #e2e8f0;
  border-radius: 7px;
  padding: 8px 12px;
  cursor: pointer;
  font-weight: 800;
}
.firma-canvas {
  width: 100%;
  height: 230px;
  display: block;
  border: 2px dashed #cbd5e1;
  border-radius: 10px;
  background: #fff;
  touch-action: none;
}
.aceptacion {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  margin: 16px 0;
  font-weight: 700;
  color: #475569;
}
.btn-firmar {
  width: 100%;
  border: 0;
  border-radius: 8px;
  padding: 14px;
  background: #16a34a;
  color: #fff;
  font-weight: 900;
  cursor: pointer;
}
.btn-firmar:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}
@media (max-width: 640px) {
  .firma-page {
    padding: 0;
    align-items: stretch;
  }
  .firma-card {
    border-radius: 0;
  }
  .orden-box,
  .form-grid {
    grid-template-columns: 1fr;
  }
}
</style>
