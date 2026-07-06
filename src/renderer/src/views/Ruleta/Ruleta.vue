<template>
  <div class="ruleta-page">
    <div class="container-fluid">
      <!-- Header -->
      <div class="page-header mb-4">
        <h2><i class="pi pi-gift mr-2"></i>Ruleta de Premios</h2>
        <div class="d-flex gap-2">
          <Button
            label="Ver Ganadores"
            icon="pi pi-trophy"
            @click="mostrarGanadores"
            class="p-button-info"
          />
          <Button
            label="Gestionar Premios"
            icon="pi pi-cog"
            @click="$router.push('/ruleta/premios')"
            class="p-button-secondary"
          />
        </div>
      </div>

      <!-- Card de Ingreso de Factura -->
      <div v-if="paso === 'ingreso'" class="card ingreso-card">
        <div class="card-body text-center p-5 ingreso-card-body">
          <div class="ingreso-icon">
            <i class="pi pi-ticket" style="font-size: 4rem; color: #667eea;"></i>
          </div>
          <h3 class="mb-4">Ingresa el Número de Factura</h3>

          <div class="ingreso-form">
            <div class="p-fluid">
              <div class="field factura-input-field">
                <InputText
                  v-model="noFactura"
                  placeholder="Número de factura"
                  class="text-center factura-input"
                  @keyup.enter="verificarFactura"
                  :disabled="verificando"
                />
              </div>

              <div class="factura-actions">
                <Button
                  label="Verificar y Girar"
                  icon="pi pi-check"
                  @click="verificarFactura"
                  class="p-button-lg p-button-success"
                  :loading="verificando"
                  :disabled="!noFactura"
                />
                <QrScanner
                  button-label="Escanear QR"
                  button-class="p-button-lg p-button-outlined p-button-secondary"
                  @scan="handleQrScan"
                />
              </div>
            </div>

            <!-- Información de la factura -->
            <div v-if="facturaInfo" class="factura-info mt-4 p-3 bg-light rounded">
              <h5 class="mb-3">Información de la Factura</h5>
              <div class="info-grid text-left">
                <div class="info-item">
                  <strong>Factura:</strong> {{ facturaInfo.no_factura }}
                </div>
                <div class="info-item">
                  <strong>Cliente:</strong> {{ facturaInfo.nombre_cliente }}
                </div>
                <div class="info-item">
                  <strong>Fecha:</strong> {{ formatearFecha(facturaInfo.fecha_emision) }}
                </div>
                <div class="info-item">
                  <strong>Total:</strong> ${{ Number(facturaInfo.total).toFixed(2) }}
                </div>
                <div v-if="facturaInfo.almacen" class="info-item">
                  <strong>Almacén:</strong> {{ facturaInfo.almacen }}
                </div>
              </div>

              <!-- Verificar si ya participó -->
              <div v-if="yaParticipo" class="alert alert-warning mt-3">
                <i class="pi pi-exclamation-triangle mr-2"></i>
                Esta factura ya participó anteriormente
                <div v-if="ganadorAnterior" class="mt-2">
                  <small>
                    <strong>Resultado anterior:</strong>
                    {{ ganadorAnterior.premio_ganado || 'Sin premio' }}
                    ({{ formatearFecha(ganadorAnterior.fecha_participacion) }})
                  </small>
                </div>
              </div>

              <!-- Botón para continuar -->
              <div class="mt-3">
                <Button
                  label="Continuar a la Ruleta"
                  icon="pi pi-arrow-right"
                  @click="irARuleta"
                  class="p-button-lg w-100"
                  :disabled="yaParticipo && !permitirReintento"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Card de la Ruleta -->
      <div v-else-if="paso === 'ruleta'" class="card ruleta-card">
        <div class="card-body ruleta-card-body">
          <div class="ruleta-participante">
            <h3>{{ facturaInfo?.nombre_cliente }}</h3>
            <p class="text-muted">Factura: {{ facturaInfo?.no_factura }}</p>
          </div>

          <div class="ruleta-main">
            <RuletaPremios
              ref="ruletaRef"
              :premios="premiosActivos"
              :puede-girar="!resultadoGuardado"
              @resultado="manejarResultado"
            />
          </div>

          <div class="ruleta-actions">
            <!-- Botón para girar de nuevo (comodín) -->
            <Button
              v-if="esComodin && !resultadoGuardado"
              label="Girar de Nuevo"
              icon="pi pi-refresh"
              @click="girarDeNuevo"
              class="p-button-lg p-button-info"
            />
            <!-- Botón para nueva participación -->
            <Button
              v-else-if="resultadoGuardado"
              label="Nueva Participación"
              icon="pi pi-refresh"
              @click="reiniciar"
              class="p-button-lg"
            />
          </div>
        </div>
      </div>

      <!-- Dialog de Ganadores -->
      <Dialog
        v-model:visible="dialogGanadores"
        header="Historial de Ganadores"
        :modal="true"
        :style="{ width: '90vw', maxWidth: '1200px' }"
        :maximizable="true"
      >
        <DataTable
          :value="ganadores"
          :paginator="true"
          :rows="10"
          :loading="loadingGanadores"
          responsiveLayout="scroll"
          class="p-datatable-sm"
          :globalFilterFields="['nombre_cliente', 'no_factura', 'premio_ganado']"
        >
          <template #header>
            <div class="d-flex justify-content-between align-items-center">
              <span class="p-input-icon-left" style="width: 300px;">
                <i class="pi pi-search" />
                <InputText
                  v-model="filtroGanadores"
                  placeholder="Buscar..."
                  style="width: 100%"
                />
              </span>
              <Button
                label="Exportar Excel"
                icon="pi pi-file-excel"
                @click="exportarGanadores"
                class="p-button-success p-button-sm"
              />
            </div>
          </template>

          <Column field="no_factura" header="No. Factura" sortable></Column>
          <Column field="nombre_cliente" header="Cliente" sortable></Column>
          <Column field="premio_ganado" header="Premio Ganado" sortable>
            <template #body="slotProps">
              <Tag
                v-if="slotProps.data.premio_ganado"
                :value="slotProps.data.premio_ganado"
                severity="success"
              />
              <Tag v-else value="Sin Premio" severity="warning" />
            </template>
          </Column>
          <Column field="almacen" header="Almacén" sortable></Column>
          <Column field="fecha_participacion" header="Fecha" sortable>
            <template #body="slotProps">
              {{ formatearFecha(slotProps.data.fecha_participacion) }}
            </template>
          </Column>
          <Column field="hora_participacion" header="Hora"></Column>
          <Column header="Acciones" style="width: 80px">
            <template #body="slotProps">
              <Button
                icon="pi pi-trash"
                class="p-button-rounded p-button-danger p-button-sm"
                @click.stop="eliminarGanador(slotProps.data)"
              />
            </template>
          </Column>
        </DataTable>
      </Dialog>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import Dialog from 'primevue/dialog'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Tag from 'primevue/tag'
import RuletaPremios from '@/components/RuletaPremios.vue'
import QrScanner from '@/components/QrScanner.vue'
import { peticionesFetchOffline, crearTablaSiNoExisteOffline } from '@/funciones/funciones.js'
import confetti from 'canvas-confetti'

const router = useRouter()
const toast = useToast()

// Definir campos de las tablas
const camposPremios = [
  'id',
  'nombre',
  'descripcion',
  'tipo',
  'imagen',
  'color',
  'probabilidad',
  'cantidad',
  'activo',
  'created_at',
  'updated_at'
]

const camposGanadores = [
  'id',
  'no_factura',
  'nombre_cliente',
  'almacen',
  'premio_ganado',
  'premio_id',
  'fecha_participacion',
  'hora_participacion',
  'created_at',
  'updated_at'
]

// Estados
const paso = ref('ingreso') // 'ingreso' | 'ruleta'
const noFactura = ref('')
const facturaInfo = ref(null)
const verificando = ref(false)
const yaParticipo = ref(false)
const ganadorAnterior = ref(null)
const permitirReintento = ref(false) // Configurar según reglas de negocio
const premios = ref([])
const ruletaRef = ref(null)
const resultadoGuardado = ref(false)
const esComodin = ref(false)
const dialogGanadores = ref(false)
const ganadores = ref([])
const loadingGanadores = ref(false)
const filtroGanadores = ref('')

// Computed
const premiosActivos = computed(() => {
  return premios.value.filter(p => p.activo)
})

// Cargar premios
const cargarPremios = async () => {
  try {
    // Formato correcto: tabla, campo, valor
    const response = await peticionesFetchOffline('getDataArrayByCondition', 'premios_ruleta', 'activo', 1)
    premios.value = Array.isArray(response) ? response : []

    if (premios.value.length === 0) {
      toast.add({
        severity: 'warn',
        summary: 'Advertencia',
        detail: 'No hay premios activos. Por favor configure premios primero.',
        life: 5000
      })
      return
    }

    // Verificar si hay premios sin tipo definido
    const premiosSinTipo = premios.value.filter(p => !p.tipo || p.tipo === null || p.tipo === '')
    if (premiosSinTipo.length > 0) {
      console.warn('⚠️ Premios sin tipo detectados:', premiosSinTipo)
      toast.add({
        severity: 'warn',
        summary: 'Actualización Requerida',
        detail: `Hay ${premiosSinTipo.length} premio(s) sin tipo definido. Ve a Configuración > "Actualizar Premios" para corregirlo.`,
        life: 10000
      })
    }
  } catch (error) {
    console.error('Error al cargar premios:', error)
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'No se pudieron cargar los premios',
      life: 3000
    })
  }
}

// Verificar factura
const verificarFactura = async () => {
  if (!noFactura.value) return

  verificando.value = true
  try {
    // Buscar factura - formato correcto: tabla, campo, valor
    const factura = await peticionesFetchOffline('getDataByField', 'facturas', 'no_factura', noFactura.value)

    if (!factura) {
      toast.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Factura no encontrada',
        life: 3000
      })
      return
    }

    facturaInfo.value = factura

    // Verificar si ya participó
    const participaciones = await peticionesFetchOffline('getDataArrayByCondition', 'ganadores_ruleta', 'no_factura', noFactura.value)

    if (participaciones && participaciones.length > 0) {
      yaParticipo.value = true
      ganadorAnterior.value = participaciones[0]
    } else {
      yaParticipo.value = false
      ganadorAnterior.value = null
    }

    toast.add({
      severity: 'success',
      summary: 'Éxito',
      detail: 'Factura verificada correctamente',
      life: 3000
    })
  } catch (error) {
    console.error('Error al verificar factura:', error)
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Error al verificar la factura: ' + error.message,
      life: 3000
    })
  } finally {
    verificando.value = false
  }
}

// Manejar escaneo de QR
const handleQrScan = (decodedText) => {
  console.log('QR escaneado:', decodedText)
  noFactura.value = decodedText
  verificarFactura()
}

// Ir a la ruleta
const irARuleta = () => {
  if (premiosActivos.value.length === 0) {
    toast.add({
      severity: 'warn',
      summary: 'Advertencia',
      detail: 'No hay premios activos disponibles',
      life: 3000
    })
    return
  }
  paso.value = 'ruleta'
}

// Reproducir sonido
const reproducirSonido = async (nombreArchivo) => {
  try {
    if (window.electron?.ipcRenderer) {
      await window.electron.ipcRenderer.invoke('play-sound', nombreArchivo)
      return
    }

    // En Electron, usar la ruta del proceso
    const rutaSonido = window.electron?.process?.resourcesPath
      ? `${window.electron.process.resourcesPath}/resources/sounds/${nombreArchivo}`
      : `./resources/sounds/${nombreArchivo}`

    const audio = new Audio(rutaSonido)
    audio.volume = 0.7
    audio.play().catch(err => {
      console.log('Error al reproducir sonido:', err)
      // Intento alternativo con ruta relativa
      const audioAlt = new Audio(`../../resources/sounds/${nombreArchivo}`)
      audioAlt.volume = 0.7
      audioAlt.play().catch(e => console.log('Error en intento alternativo:', e))
    })
  } catch (error) {
    console.error('Error al reproducir sonido:', error)
  }
}

// Lanzar confetti
const lanzarConfetti = () => {
  // Confetti desde la izquierda
  confetti({
    particleCount: 100,
    spread: 70,
    origin: { x: 0, y: 0.6 },
    colors: ['#667eea', '#764ba2', '#f093fb', '#f5576c']
  })

  // Confetti desde la derecha
  confetti({
    particleCount: 100,
    spread: 70,
    origin: { x: 1, y: 0.6 },
    colors: ['#667eea', '#764ba2', '#f093fb', '#f5576c']
  })

  // Confetti desde el centro
  setTimeout(() => {
    confetti({
      particleCount: 150,
      spread: 120,
      origin: { y: 0.6 },
      colors: ['#FFD700', '#FFA500', '#FF69B4']
    })
  }, 200)
}

// Confetti continuo para premios grandes
const confettiContinuo = () => {
  let count = 0
  const interval = setInterval(() => {
    confetti({
      particleCount: 50,
      angle: 60,
      spread: 55,
      origin: { x: 0 },
      colors: ['#667eea', '#764ba2', '#f093fb']
    })
    confetti({
      particleCount: 50,
      angle: 120,
      spread: 55,
      origin: { x: 1 },
      colors: ['#667eea', '#764ba2', '#f093fb']
    })

    count++
    if (count >= 5) {
      clearInterval(interval)
    }
  }, 300)
}

// Manejar resultado de la ruleta
const manejarResultado = async (winner) => {
  console.log('🎲 Resultado recibido:', winner)
  console.log('   - tipo:', winner.tipo)
  console.log('   - premioReal:', winner.premioReal)
  console.log('   - volverAGirar:', winner.volverAGirar)
  console.log('   - soloMensaje:', winner.soloMensaje)

  if (winner.volverAGirar) {
    console.log('✅ Es COMODÍN - permitir girar de nuevo')
    esComodin.value = true
    reproducirSonido('Subtle.mp3')
    toast.add({
      severity: 'info',
      summary: '¡Comodín!',
      detail: 'Puedes girar la ruleta de nuevo',
      life: 4000
    })
    return
  }

  if (winner.premioReal) {
    console.log('🎁 Es PREMIO REAL - lanzar confetti y sonido')
    reproducirSonido('success-1.mp3')
    lanzarConfetti()
    confettiContinuo()
  } else if (winner.soloMensaje) {
    console.log('💬 Es MENSAJE - sin confetti')
  }

  try {
    const ahora = new Date()
    const fecha = ahora.toISOString().split('T')[0]
    const hora = ahora.toTimeString().split(' ')[0]
    const timestamp = Date.now()

    let tipoResultado = 'sin_premio'
    let nombreResultado = null

    if (winner.premioReal || winner.soloMensaje) {
      tipoResultado = winner.premioReal ? 'premio' : 'mensaje'
      nombreResultado = winner.nombre
    }

    const datosGanador = {
      no_factura: facturaInfo.value.no_factura,
      nombre_cliente: facturaInfo.value.nombre_cliente,
      almacen: facturaInfo.value.almacen || '',
      premio_ganado: nombreResultado,
      premio_id: winner.id,
      fecha_participacion: fecha,
      hora_participacion: hora,
      created_at: timestamp,
      updated_at: timestamp
    }

    await peticionesFetchOffline('insertData', 'ganadores_ruleta', JSON.stringify(datosGanador))

    resultadoGuardado.value = true

    let mensajeToast = 'Resultado guardado correctamente'
    if (tipoResultado === 'premio') {
      mensajeToast = '¡Felicidades! Premio guardado correctamente'
    } else if (tipoResultado === 'mensaje') {
      mensajeToast = 'Participación registrada'
    }

    console.log('💾 Guardado en BD:', { tipoResultado, nombreResultado, premio_id: winner.id })

    toast.add({
      severity: 'success',
      summary: 'Guardado',
      detail: mensajeToast,
      life: 3000
    })
  } catch (error) {
    console.error('Error al guardar resultado:', error)
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Error al guardar el resultado',
      life: 3000
    })
  }
}

// Girar de nuevo (cuando sale comodín)
const girarDeNuevo = () => {
  if (ruletaRef.value) {
    esComodin.value = false
    ruletaRef.value.resetear()
    setTimeout(() => {
      ruletaRef.value.girar()
    }, 100)
  }
}

// Reiniciar para nueva participación
const reiniciar = () => {
  paso.value = 'ingreso'
  noFactura.value = ''
  facturaInfo.value = null
  yaParticipo.value = false
  ganadorAnterior.value = null
  resultadoGuardado.value = false
  esComodin.value = false
}

// Mostrar ganadores
const mostrarGanadores = async () => {
  dialogGanadores.value = true
  loadingGanadores.value = true
  try {
    const response = await peticionesFetchOffline('getDataAsArray', 'ganadores_ruleta')
    ganadores.value = Array.isArray(response) ? response : []
  } catch (error) {
    console.error('Error al cargar ganadores:', error)
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Error al cargar ganadores',
      life: 3000
    })
  } finally {
    loadingGanadores.value = false
  }
}

// Exportar ganadores a Excel
const exportarGanadores = () => {
  // Implementar exportación a Excel usando la librería XLSX que ya está en el proyecto
  toast.add({
    severity: 'info',
    summary: 'Próximamente',
    detail: 'Función de exportación en desarrollo',
    life: 3000
  })
}

// Eliminar ganador
const eliminarGanador = async (ganador) => {
  if (!confirm(`¿Está seguro que desea eliminar el registro de "${ganador.nombre_cliente}" (Factura: ${ganador.no_factura})?`)) return

  try {
    const resultado = await peticionesFetchOffline('deleteEntry', 'ganadores_ruleta', ganador.id)

    if (Array.isArray(resultado) && resultado[0] !== 'ok') {
      throw new Error(resultado[1] || 'No se pudo eliminar el registro')
    }

    toast.add({
      severity: 'success',
      summary: 'Eliminado',
      detail: 'Registro eliminado correctamente',
      life: 3000
    })
    ganadores.value = ganadores.value.filter(g => Number(g.id) !== Number(ganador.id))
  } catch (error) {
    console.error('Error al eliminar ganador:', error)
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'No se pudo eliminar el registro',
      life: 3000
    })
  }
}

// Formatear fecha
const formatearFecha = (fecha) => {
  if (!fecha) return ''
  const date = new Date(fecha)
  return date.toLocaleDateString('es-DO', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

// Lifecycle
onMounted(async () => {
  // Asegurar que las tablas existen y tienen todos los campos
  await crearTablaSiNoExisteOffline('premios_ruleta', camposPremios, toast)
  await crearTablaSiNoExisteOffline('ganadores_ruleta', camposGanadores, toast)
  // Cargar premios
  await cargarPremios()
})
</script>

<style scoped>
.ruleta-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 2rem;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: white;
  flex-wrap: wrap;
  gap: 1rem;
}

.page-header h2 {
  margin: 0;
  font-size: 2rem;
  font-weight: bold;
}

.ingreso-card,
.ruleta-card {
  border: none;
  border-radius: 20px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  max-width: 1200px;
  margin: 0 auto;
}

.ingreso-card {
  max-width: 1060px;
}

.ingreso-card-body {
  min-height: 390px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.ingreso-icon {
  margin-bottom: 1.75rem;
}

.ingreso-card h3 {
  margin-bottom: 1.75rem;
  font-size: 1.25rem;
  font-weight: 500;
  color: #334155;
}

.ingreso-form {
  width: min(100%, 620px);
  margin: 0 auto;
}

.factura-input-field {
  margin-bottom: 1.4rem;
}

.factura-input {
  width: 100%;
  font-size: 1.5rem;
  padding: 1rem;
}

.factura-actions {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 0.75rem;
  align-items: center;
}

.ruleta-card-body {
  padding: 2.5rem 2rem 3rem;
}

.ruleta-participante {
  text-align: center;
  margin-bottom: 2.25rem;
  padding-bottom: 1.5rem;
  border-bottom: 1px solid #e5e7eb;
}

.ruleta-participante h3 {
  margin: 0 0 0.5rem;
  font-size: 1.6rem;
  font-weight: 700;
  color: #111827;
}

.ruleta-participante p {
  margin: 0;
}

.ruleta-main {
  display: flex;
  justify-content: center;
  margin-bottom: 2.25rem;
}

.ruleta-actions {
  display: flex;
  justify-content: center;
  margin-top: 1rem;
}

.factura-info {
  border: 2px solid #667eea;
  animation: fadeIn 0.5s ease-out;
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

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.info-item {
  padding: 0.5rem;
  background: white;
  border-radius: 5px;
}

.d-flex {
  display: flex;
}

.gap-2 {
  gap: 0.5rem;
}

.justify-content-between {
  justify-content: space-between;
}

.align-items-center {
  align-items: center;
}

.text-center {
  text-align: center;
}

.text-left {
  text-align: left;
}

.w-100 {
  width: 100%;
}

.mb-3 {
  margin-bottom: 1rem;
}

.mb-4 {
  margin-bottom: 1.5rem;
}

.mt-2 {
  margin-top: 0.5rem;
}

.mt-3 {
  margin-top: 1rem;
}

.mt-4 {
  margin-top: 1.5rem;
}

.mr-2 {
  margin-right: 0.5rem;
}

.p-3 {
  padding: 1rem;
}

.p-5 {
  padding: 3rem;
}

.bg-light {
  background-color: #f8f9fa;
}

.rounded {
  border-radius: 0.25rem;
}

.text-muted {
  color: #6c757d;
}

@media (max-width: 640px) {
  .ruleta-page {
    padding: 1rem;
  }

  .ruleta-card-body {
    padding: 1.5rem 1rem 2rem;
  }

  .ruleta-participante {
    margin-bottom: 1.75rem;
    padding-bottom: 1rem;
  }

  .ruleta-main {
    margin-bottom: 1.75rem;
  }

  .ingreso-card-body {
    min-height: 360px;
    padding: 2rem 1.25rem !important;
  }

  .factura-actions {
    grid-template-columns: 1fr;
  }
}
</style>
