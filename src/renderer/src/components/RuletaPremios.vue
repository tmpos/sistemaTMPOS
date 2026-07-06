<template>
  <div class="ruleta-container">
    <div class="ruleta-wrapper">
      <div class="ruleta-arrow">
        <i class="pi pi-caret-down"></i>
      </div>

      <canvas
        ref="ruletaCanvas"
        :width="canvasSize"
        :height="canvasSize"
        :style="{
          transform: `rotate(${rotacion}deg)`,
          transition: girando ? `transform ${duracionGiro}s cubic-bezier(0.17, 0.67, 0.12, 0.99)` : 'none'
        }"
      ></canvas>

      <div class="ruleta-center-button" @click="girar" :class="{ disabled: girando || !puedeGirar }">
        <i v-if="!girando" class="pi pi-play" style="font-size: 2rem;"></i>
        <i v-else class="pi pi-spin pi-spinner" style="font-size: 2rem;"></i>
      </div>
    </div>

    <div v-if="ganador" class="resultado-container mt-4">
      <div v-if="ganador.premioReal" class="result-card shine-card" :style="{ background: `linear-gradient(135deg, ${ganador.color} 0%, ${ganador.color}dd 100%)` }">
        <div class="shine-effect"></div>
        <img v-if="ganador.imagen" :src="ganador.imagen" :alt="ganador.nombre" class="result-img" />
        <i v-else :class="ganador.icono" class="result-icon trophy-icon"></i>
        <h3 class="winner-text">¡Felicidades!</h3>
        <h4 class="result-name">{{ ganador.nombre }}</h4>
        <p v-if="ganador.descripcion" class="result-desc">{{ ganador.descripcion }}</p>
      </div>

      <div v-else-if="ganador.volverAGirar" class="result-card" :style="{ background: `linear-gradient(135deg, ${ganador.color} 0%, ${ganador.color}dd 100%)` }">
        <i :class="ganador.icono" class="result-icon spin-icon"></i>
        <h3 class="result-title">VUELVE A GIRAR</h3>
        <p class="result-desc">{{ ganador.descripcion || '¡Tienes otra oportunidad! Gira la ruleta de nuevo.' }}</p>
      </div>

      <div v-else-if="ganador.soloMensaje" class="result-card" :style="{ background: `linear-gradient(135deg, ${ganador.color} 0%, ${ganador.color}dd 100%)` }">
        <i :class="ganador.icono" class="result-icon"></i>
        <h4 class="result-name">{{ ganador.nombre }}</h4>
        <p v-if="ganador.descripcion" class="result-desc">{{ ganador.descripcion }}</p>
      </div>

      <div v-else class="result-card sin-premio-card">
        <i class="pi pi-times-circle result-icon"></i>
        <h4>Lo sentimos</h4>
        <p>No ganaste esta vez. ¡Sigue intentando!</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, nextTick } from 'vue'

const props = defineProps({
  premios: { type: Array, required: true },
  puedeGirar: { type: Boolean, default: true }
})

const emit = defineEmits(['resultado'])

const ruletaCanvas = ref(null)
const rotacion = ref(0)
const girando = ref(false)
const ganador = ref(null)
const canvasSize = 500
const duracionGiro = 5
const segmentosActuales = ref([])

const obtenerIconoPorTipo = (tipo) => {
  switch (tipo) {
    case 'premio': return 'pi pi-gift'
    case 'comodin': return 'pi pi-refresh'
    case 'mensaje': return 'pi pi-comment'
    default: return 'pi pi-gift'
  }
}

const dibujarRuleta = () => {
  const canvas = ruletaCanvas.value
  if (!canvas) return

  const ctx = canvas.getContext('2d')
  const centerX = canvasSize / 2
  const centerY = canvasSize / 2
  const radius = canvasSize / 2 - 10

  ctx.clearRect(0, 0, canvasSize, canvasSize)

  const segmentos = prepararSegmentos()
  segmentosActuales.value = segmentos
  const totalSegmentos = segmentos.length
  const anglePerSegment = (2 * Math.PI) / totalSegmentos

  segmentos.forEach((segmento, index) => {
    const startAngle = index * anglePerSegment - Math.PI / 2
    const endAngle = startAngle + anglePerSegment

    ctx.beginPath()
    ctx.moveTo(centerX, centerY)
    ctx.arc(centerX, centerY, radius, startAngle, endAngle)
    ctx.closePath()
    ctx.fillStyle = segmento.color
    ctx.fill()
    ctx.strokeStyle = '#ffffff'
    ctx.lineWidth = 3
    ctx.stroke()

    ctx.save()
    ctx.translate(centerX, centerY)
    ctx.rotate(startAngle + anglePerSegment / 2)
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillStyle = '#ffffff'
    ctx.shadowColor = 'rgba(0, 0, 0, 0.5)'
    ctx.shadowBlur = 4
    ctx.shadowOffsetX = 2
    ctx.shadowOffsetY = 2

    // DEBUG: dibujar número de índice en cada sector
    if (segmento.esPremio) {
      let icono = '🎁'
      if (segmento.premio.tipo === 'comodin') icono = '🔄'
      else if (segmento.premio.tipo === 'mensaje') icono = '💬'

      ctx.font = 'bold 20px Arial'
      ctx.fillText(icono, radius / 1.5, -8)
      ctx.font = 'bold 12px Arial'
      const texto = segmento.nombre.length > 15
        ? segmento.nombre.substring(0, 12) + '...'
        : segmento.nombre
      ctx.fillText(texto, radius / 1.5, 12)
    } else {
      ctx.font = 'bold 24px Arial'
      ctx.fillText('✗', radius / 1.5, 0)
      ctx.font = 'bold 12px Arial'
      ctx.fillText('Sin Premio', radius / 1.5, 18)
    }
    ctx.restore()
  })

  ctx.beginPath()
  ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI)
  ctx.strokeStyle = '#333'
  ctx.lineWidth = 5
  ctx.stroke()

  ctx.beginPath()
  ctx.arc(centerX, centerY, 50, 0, 2 * Math.PI)
  ctx.fillStyle = '#ffffff'
  ctx.fill()
  ctx.strokeStyle = '#333'
  ctx.lineWidth = 3
  ctx.stroke()
}

const prepararSegmentos = () => {
  const segmentos = []
  let probabilidadTotal = 0

  props.premios.forEach(premio => {
    if (premio.activo) probabilidadTotal += premio.probabilidad
  })

  let totalSegmentosPremios = 0
  props.premios.forEach(premio => {
    if (premio.activo) {
      const numSegmentos = Math.max(1, Math.round(premio.probabilidad / 5))
      const pesoPorSegmento = premio.probabilidad / numSegmentos
      totalSegmentosPremios += numSegmentos
      for (let i = 0; i < numSegmentos; i++) {
        segmentos.push({
          nombre: premio.nombre,
          color: premio.color,
          premio: premio,
          esPremio: true,
          peso: pesoPorSegmento
        })
      }
    }
  })

  const probabilidadSinPremio = 100 - probabilidadTotal
  let numSegmentosSinPremio = 0

  if (probabilidadSinPremio > 0) {
    numSegmentosSinPremio = Math.max(1, Math.round(probabilidadSinPremio / 5))
    const pesoSinPremio = probabilidadSinPremio / numSegmentosSinPremio
    const coloresSinPremio = ['#95a5a6', '#7f8c8d', '#bdc3c7']

    for (let i = 0; i < numSegmentosSinPremio; i++) {
      segmentos.push({
        nombre: 'Sin Premio',
        color: coloresSinPremio[i % coloresSinPremio.length],
        premio: null,
        esPremio: false,
        peso: pesoSinPremio
      })
    }
  }

  return mezclarArray(segmentos)
}

const mezclarArray = (array) => {
  const newArray = [...array]
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]]
  }
  return newArray
}

const normalizarGrados = (grados) => {
  return ((grados % 360) + 360) % 360
}

const obtenerDireccionRotacionCss = () => {
  const canvas = ruletaCanvas.value
  return canvas && getComputedStyle(canvas).direction === 'rtl' ? -1 : 1
}

const construirGanador = (segmento) => {
  const premio = segmento.premio
  const tipo = segmento.esPremio ? String(premio?.tipo || 'premio').trim().toLowerCase() : 'sin_premio'

  return {
    id: premio?.id ?? null,
    nombre: segmento.esPremio ? segmento.nombre : 'Sin premio',
    descripcion: premio?.descripcion || '',
    tipo,
    color: segmento.color || '#6b7280',
    icono: segmento.esPremio ? obtenerIconoPorTipo(premio?.tipo) : 'pi pi-times-circle',
    imagen: premio?.imagen || '',
    probabilidad: premio?.probabilidad || 0,
    premioReal: segmento.esPremio && tipo === 'premio',
    volverAGirar: segmento.esPremio && tipo === 'comodin',
    soloMensaje: segmento.esPremio && tipo === 'mensaje',
    confetti: segmento.esPremio && tipo === 'premio'
  }
}

const seleccionarSegmentoGanador = (segmentos) => {
  const pesos = segmentos.map(seg => seg.peso)
  const totalPeso = pesos.reduce((sum, peso) => sum + peso, 0)
  let random = Math.random() * totalPeso

  for (let i = 0; i < segmentos.length; i++) {
    random -= pesos[i]
    if (random <= 0) return i
  }
  return segmentos.length - 1
}

const girar = () => {
  if (girando.value || !props.puedeGirar) return

  girando.value = true
  ganador.value = null

  let segmentos = segmentosActuales.value
  if (!segmentos.length) {
    segmentos = prepararSegmentos()
    segmentosActuales.value = segmentos
  }

  const totalSegmentos = segmentos.length
  const segmentoGanador = seleccionarSegmentoGanador(segmentos)
  const segmentoSeleccionado = segmentos[segmentoGanador]
  const anguloDelSegmento = 360 / totalSegmentos

  // Centro del segmento ganador en grados horarios desde el top
  const direccionRotacion = obtenerDireccionRotacionCss()
  const segmentCenter = segmentoGanador * anguloDelSegmento + (anguloDelSegmento / 2)
  // Rotación necesaria para que ese centro quede en el top (0°)
  const targetAngle = direccionRotacion === 1
    ? normalizarGrados(360 - segmentCenter)
    : normalizarGrados(segmentCenter)
  const vueltasCompletas = 5 + Math.floor(Math.random() * 3)
  const currentOffset = normalizarGrados(rotacion.value)
  const neededExtra = ((targetAngle - currentOffset) % 360 + 360) % 360
  const anguloFinal = vueltasCompletas * 360 + neededExtra

  console.table(segmentos.map((segmento, index) => ({
    index,
    nombre: segmento.nombre,
    esPremio: segmento.esPremio,
    tipoOriginal: segmento.premio?.tipo || null,
    peso: segmento.peso
  })))
  console.log('[Ruleta] segmento elegido', {
    index: segmentoGanador,
    nombre: segmentoSeleccionado.nombre,
    esPremio: segmentoSeleccionado.esPremio,
    tipoOriginal: segmentoSeleccionado.premio?.tipo || null,
    direccionRotacion,
    anguloPorSegmento: anguloDelSegmento,
    centroSegmento: segmentCenter,
    rotacionActual: rotacion.value,
    rotacionObjetivo: targetAngle,
    rotacionFinal: rotacion.value + anguloFinal
  })

  console.log('🎯 Giro:', { segmentoGanador, totalSegmentos, segmentCenter, targetAngle, currentOffset, neededExtra, anguloFinal })
  console.log('   Rotación actual:', rotacion.value)
  console.log('   Rotación final estimada:', rotacion.value + anguloFinal)
  console.log('   Ángulo normalizado final:', (rotacion.value + anguloFinal) % 360)
  console.log('   Sector (grados):', anguloDelSegmento)
  console.log('   Índice desde ángulo:', Math.floor(((rotacion.value + anguloFinal) % 360) / anguloDelSegmento))

  rotacion.value = rotacion.value + anguloFinal

  setTimeout(() => {
    const winner = construirGanador(segmentoSeleccionado)
    console.log('[Ruleta] ganador construido', {
      nombre: winner.nombre,
      tipo: winner.tipo,
      premioReal: winner.premioReal,
      volverAGirar: winner.volverAGirar,
      soloMensaje: winner.soloMensaje,
      id: winner.id
    })
    const anguloNormalizado = rotacion.value % 360
    const indiceDesdeAngulo = Math.round((((360 - anguloNormalizado - anguloDelSegmento / 2) % 360) + 360) % 360 / anguloDelSegmento) % totalSegmentos

    console.log('🏆 Rotación final total:', rotacion.value)
    console.log('🏆 Ángulo normalizado (0-360):', anguloNormalizado)
    console.log('🏆 Sector (grados por segmento):', anguloDelSegmento)
    console.log('🏆 targetAngle esperado:', targetAngle)
    console.log('🏆 Diferencia (error):', Math.abs(anguloNormalizado - targetAngle))
    console.log('🏆 Índice ganador (selección ponderada):', segmentoGanador)
    console.log('🏆 Índice desde ángulo (reverse):', indiceDesdeAngulo)
    console.log('🏆 Coinciden:', segmentoGanador === indiceDesdeAngulo ? '✅ SÍ' : '❌ NO')
    console.log('🏆 Objeto ganador:', winner)

    ganador.value = winner
    girando.value = false
    emit('resultado', winner)
  }, duracionGiro * 1000)
}

const resetear = () => {
  ganador.value = null
  girando.value = false
}

watch(() => props.premios, () => {
  nextTick(() => dibujarRuleta())
}, { deep: true })

onMounted(() => dibujarRuleta())

defineExpose({ girar, resetear })
</script>

<style scoped>
.ruleta-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2.5rem;
  padding: 1rem 1rem 0;
}

.ruleta-wrapper {
  position: relative;
  width: 500px;
  height: 500px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.ruleta-arrow {
  position: absolute;
  top: -20px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 10;
  font-size: 3rem;
  color: #e74c3c;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
}

canvas {
  border-radius: 50%;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
  cursor: pointer;
  direction: ltr;
}

.ruleta-center-button {
  position: absolute;
  width: 100px;
  height: 100px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
  transition: transform 0.2s, box-shadow 0.2s;
  color: white;
  z-index: 5;
}

.ruleta-center-button:hover:not(.disabled) {
  transform: scale(1.1);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.4);
}

.ruleta-center-button:active:not(.disabled) {
  transform: scale(0.95);
}

.ruleta-center-button.disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.resultado-container {
  width: 100%;
  max-width: 500px;
  margin-top: 0.5rem;
  animation: fadeInUp 0.5s ease-out;
}

@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

.result-card {
  padding: 2.25rem;
  border-radius: 12px;
  color: white;
  text-align: center;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
}

.result-card h3, .result-card h4 {
  margin: 0.5rem 0;
}

.result-card p {
  margin: 0.5rem 0 0;
  opacity: 0.9;
}

.result-icon {
  font-size: 3rem;
  margin-bottom: 0.5rem;
  display: block;
}

.result-img {
  width: 80px;
  height: 80px;
  object-fit: cover;
  border-radius: 50%;
  margin-bottom: 0.75rem;
  border: 3px solid rgba(255, 255, 255, 0.4);
}

.result-name {
  font-weight: bold;
}

.result-title {
  font-weight: 800;
  letter-spacing: 0.05em;
}

.result-desc {
  font-size: 0.9rem;
}

.sin-premio-card {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.shine-card {
  position: relative;
  overflow: hidden;
  animation: pulseGlow 2s ease-in-out infinite;
}

.shine-effect {
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: linear-gradient(
    to bottom right,
    rgba(255, 255, 255, 0) 0%,
    rgba(255, 255, 255, 0.2) 50%,
    rgba(255, 255, 255, 0) 100%
  );
  transform: rotate(45deg);
  animation: shine 3s ease-in-out infinite;
}

@keyframes shine {
  0% { transform: translateX(-100%) translateY(-100%) rotate(45deg); }
  100% { transform: translateX(100%) translateY(100%) rotate(45deg); }
}

@keyframes pulseGlow {
  0%, 100% { box-shadow: 0 0 30px rgba(102, 126, 234, 0.8), 0 0 60px rgba(118, 75, 162, 0.6); }
  50% { box-shadow: 0 0 40px rgba(102, 126, 234, 1), 0 0 80px rgba(118, 75, 162, 0.8); }
}

.trophy-icon {
  animation: bounce 1s ease-in-out infinite;
  color: #FFD700;
  filter: drop-shadow(0 0 10px rgba(255, 215, 0, 0.8));
}

@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

.winner-text {
  animation: scaleIn 0.5s ease-out;
  text-shadow: 0 0 20px rgba(255, 255, 255, 0.8);
}

@keyframes scaleIn {
  0% { transform: scale(0); opacity: 0; }
  50% { transform: scale(1.2); }
  100% { transform: scale(1); opacity: 1; }
}

.spin-icon {
  animation: spin 2s linear infinite;
  filter: drop-shadow(0 0 10px rgba(0, 242, 254, 0.6));
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

@media (max-width: 640px) {
  .ruleta-container {
    gap: 2rem;
    padding: 0.5rem 0 0;
  }

  .ruleta-wrapper {
    width: min(88vw, 500px);
    height: min(88vw, 500px);
  }

  canvas {
    width: 100%;
    height: 100%;
  }

  .ruleta-center-button {
    width: 76px;
    height: 76px;
  }

  .result-card {
    padding: 1.75rem 1.25rem;
  }
}
</style>
