<template>
  <div class="configuracion-ruleta p-4">
    <div class="card">
      <div class="card-header">
        <h3><i class="pi pi-cog mr-2"></i>Configuración de la Ruleta</h3>
      </div>

      <div class="card-body">
        <!-- Panel de Estado -->
        <div class="estado-panel mb-4">
          <h4 class="mb-3">Estado del Sistema</h4>
          <div class="row">
            <div class="col-md-4">
              <Card>
                <template #content>
                  <div class="text-center">
                    <i
                      class="pi pi-database"
                      :class="estadoTablas.premiosExiste ? 'text-success' : 'text-danger'"
                      style="font-size: 3rem;"
                    ></i>
                    <h5 class="mt-3">Tabla Premios</h5>
                    <Tag
                      :value="estadoTablas.premiosExiste ? 'Creada' : 'No Creada'"
                      :severity="estadoTablas.premiosExiste ? 'success' : 'danger'"
                    />
                    <p class="mt-2 text-muted">
                      {{ totalPremios }} premios registrados
                    </p>
                  </div>
                </template>
              </Card>
            </div>

            <div class="col-md-4">
              <Card>
                <template #content>
                  <div class="text-center">
                    <i
                      class="pi pi-database"
                      :class="estadoTablas.ganadoresExiste ? 'text-success' : 'text-danger'"
                      style="font-size: 3rem;"
                    ></i>
                    <h5 class="mt-3">Tabla Ganadores</h5>
                    <Tag
                      :value="estadoTablas.ganadoresExiste ? 'Creada' : 'No Creada'"
                      :severity="estadoTablas.ganadoresExiste ? 'success' : 'danger'"
                    />
                    <p class="mt-2 text-muted">
                      {{ totalGanadores }} participaciones
                    </p>
                  </div>
                </template>
              </Card>
            </div>

            <div class="col-md-4">
              <Card>
                <template #content>
                  <div class="text-center">
                    <i
                      class="pi pi-check-circle"
                      :class="sistemaListo ? 'text-success' : 'text-warning'"
                      style="font-size: 3rem;"
                    ></i>
                    <h5 class="mt-3">Estado General</h5>
                    <Tag
                      :value="sistemaListo ? 'Listo' : 'Necesita Configuración'"
                      :severity="sistemaListo ? 'success' : 'warning'"
                    />
                    <p class="mt-2 text-muted">
                      {{ sistemaListo ? 'Sistema operativo' : 'Requiere inicialización' }}
                    </p>
                  </div>
                </template>
              </Card>
            </div>
          </div>
        </div>

        <!-- Acciones -->
        <div class="acciones-panel mb-4">
          <h4 class="mb-3">Acciones</h4>
          <div class="d-flex flex-wrap gap-3">
            <Button
              label="Inicializar Tablas"
              icon="pi pi-database"
              @click="inicializarTablas"
              :loading="inicializando"
              :disabled="sistemaListo"
              class="p-button-success"
            />
            <Button
              label="Verificar Estado"
              icon="pi pi-refresh"
              @click="verificarEstado"
              :loading="verificando"
              class="p-button-info"
            />
            <Button
              label="Actualizar Premios"
              icon="pi pi-sync"
              @click="migrarPremios"
              :loading="migrando"
              :disabled="!estadoTablas.premiosExiste"
              class="p-button-warning"
              v-tooltip.top="'Actualiza premios sin tipo a tipo \'premio\''"
            />
            <Button
              label="Ver Premios"
              icon="pi pi-gift"
              @click="$router.push('/ruleta/premios')"
              :disabled="!estadoTablas.premiosExiste"
            />
            <Button
              label="Ir a Ruleta"
              icon="pi pi-play"
              @click="$router.push('/ruleta')"
              :disabled="!sistemaListo"
              class="p-button-primary"
            />
          </div>
        </div>

        <!-- Información -->
        <div class="info-panel">
          <h4 class="mb-3">Información</h4>
          <Accordion>
            <AccordionTab header="¿Cómo usar el sistema?">
              <ol>
                <li>Haz clic en "Inicializar Tablas" si es la primera vez que usas la ruleta</li>
                <li>Ve a "Ver Premios" para gestionar los premios disponibles</li>
                <li>Configura los premios con sus probabilidades</li>
                <li>Ve a "Ir a Ruleta" para empezar a usar el sistema</li>
                <li>Ingresa el número de factura de un cliente</li>
                <li>Gira la ruleta y guarda el resultado automáticamente</li>
              </ol>
            </AccordionTab>

            <AccordionTab header="Estructura de Premios">
              <p><strong>Campos configurables:</strong></p>
              <ul>
                <li><strong>Nombre:</strong> Texto que se muestra en la ruleta</li>
                <li><strong>Descripción:</strong> Detalles adicionales del premio</li>
                <li><strong>Imagen:</strong> URL de imagen (opcional)</li>
                <li><strong>Color:</strong> Color del segmento en la ruleta</li>
                <li><strong>Probabilidad:</strong> Porcentaje de probabilidad de ganar (0-100)</li>
                <li><strong>Activo:</strong> Si el premio está disponible o no</li>
              </ul>
              <p class="mt-2">
                <strong>Nota:</strong> La suma de todas las probabilidades debe ser menor a 100%.
                El porcentaje restante se asigna automáticamente a espacios "sin premio".
              </p>
            </AccordionTab>

            <AccordionTab header="Datos Guardados">
              <p>Para cada participación se guarda:</p>
              <ul>
                <li>Número de factura</li>
                <li>Nombre del cliente</li>
                <li>Almacén</li>
                <li>Premio ganado (o NULL si no ganó)</li>
                <li>Fecha y hora de participación</li>
                <li>Timestamps de creación y actualización</li>
              </ul>
            </AccordionTab>

            <AccordionTab header="Requisitos Técnicos">
              <ul>
                <li>Base de datos SQLite inicializada</li>
                <li>Tabla de facturas con datos</li>
                <li>Al menos un premio activo configurado</li>
                <li>Conexión con la base de datos funcionando</li>
              </ul>
            </AccordionTab>
          </Accordion>
        </div>

        <!-- Log de Operaciones -->
        <div v-if="logOperaciones.length > 0" class="log-panel mt-4">
          <h4 class="mb-3">Log de Operaciones</h4>
          <div class="log-container p-3 bg-light rounded" style="max-height: 300px; overflow-y: auto;">
            <div
              v-for="(log, index) in logOperaciones"
              :key="index"
              class="log-item mb-2"
              :class="log.tipo"
            >
              <small>
                <i :class="getLogIcon(log.tipo)"></i>
                <strong>[{{ log.hora }}]</strong> {{ log.mensaje }}
              </small>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import Button from 'primevue/button'
import Card from 'primevue/card'
import Tag from 'primevue/tag'
import Accordion from 'primevue/accordion'
import AccordionTab from 'primevue/accordiontab'
import { inicializarTablasRuleta, verificarTablasRuleta } from '@/utils/inicializarRuleta.js'
import { peticionesFetchOffline, crearTablaSiNoExisteOffline } from '@/funciones/funciones.js'

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
const estadoTablas = ref({
  premiosExiste: false,
  ganadoresExiste: false
})
const totalPremios = ref(0)
const totalGanadores = ref(0)
const inicializando = ref(false)
const verificando = ref(false)
const migrando = ref(false)
const logOperaciones = ref([])

// Computed
const sistemaListo = computed(() => {
  return estadoTablas.value.premiosExiste &&
         estadoTablas.value.ganadoresExiste &&
         totalPremios.value > 0
})

// Funciones
const agregarLog = (mensaje, tipo = 'info') => {
  const ahora = new Date()
  const hora = ahora.toLocaleTimeString()
  logOperaciones.value.unshift({ mensaje, tipo, hora })
  // Mantener solo los últimos 50 logs
  if (logOperaciones.value.length > 50) {
    logOperaciones.value = logOperaciones.value.slice(0, 50)
  }
}

const getLogIcon = (tipo) => {
  const icons = {
    success: 'pi pi-check-circle text-success',
    error: 'pi pi-times-circle text-danger',
    warning: 'pi pi-exclamation-triangle text-warning',
    info: 'pi pi-info-circle text-info'
  }
  return icons[tipo] || icons.info
}

const verificarEstado = async () => {
  verificando.value = true
  agregarLog('Verificando estado del sistema...', 'info')

  try {
    // Verificar tablas
    const tablas = await verificarTablasRuleta()
    estadoTablas.value = tablas

    // Contar premios
    if (tablas.premiosExiste) {
      try {
        const premios = await peticionesFetchOffline('getDataAsArray', 'premios_ruleta')
        totalPremios.value = Array.isArray(premios) ? premios.length : 0
      } catch (e) {
        totalPremios.value = 0
      }
    } else {
      totalPremios.value = 0
    }

    // Contar ganadores
    if (tablas.ganadoresExiste) {
      try {
        const ganadores = await peticionesFetchOffline('getDataAsArray', 'ganadores_ruleta')
        totalGanadores.value = Array.isArray(ganadores) ? ganadores.length : 0
      } catch (e) {
        totalGanadores.value = 0
      }
    } else {
      totalGanadores.value = 0
    }

    agregarLog('Estado verificado correctamente', 'success')

    toast.add({
      severity: 'success',
      summary: 'Verificación Completa',
      detail: 'Estado del sistema actualizado',
      life: 3000
    })
  } catch (error) {
    console.error('Error al verificar estado:', error)
    agregarLog(`Error al verificar estado: ${error.message}`, 'error')
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'No se pudo verificar el estado del sistema',
      life: 3000
    })
  } finally {
    verificando.value = false
  }
}

// Detectar tipo automáticamente basándose en el nombre
const detectarTipoPremio = (nombre, descripcion) => {
  const nombreLower = (nombre || '').toLowerCase()
  const descripcionLower = (descripcion || '').toLowerCase()
  const textoCompleto = nombreLower + ' ' + descripcionLower

  // Patrones para comodín
  const patronesComodin = [
    'gira', 'girar', 'nuevo', 'nueva', 'otro', 'otra', 'oportunidad',
    'intento', 'vuelta', 'chance', 'reintento'
  ]

  // Patrones para mensaje
  const patronesMensaje = [
    'sigue', 'participa', 'gracias', 'suerte', 'próxima', 'vez',
    'intentando', 'mejor', 'participando', 'ánimo', 'continua'
  ]

  // Verificar comodín
  if (patronesComodin.some(patron => textoCompleto.includes(patron))) {
    return 'comodin'
  }

  // Verificar mensaje
  if (patronesMensaje.some(patron => textoCompleto.includes(patron))) {
    return 'mensaje'
  }

  // Por defecto, premio
  return 'premio'
}

const migrarPremios = async () => {
  migrando.value = true
  agregarLog('🔄 Iniciando migración de premios...', 'info')

  try {
    // Obtener todos los premios
    const premios = await peticionesFetchOffline('getDataAsArray', 'premios_ruleta')

    if (!Array.isArray(premios) || premios.length === 0) {
      agregarLog('⚠️ No hay premios para migrar', 'warning')
      toast.add({
        severity: 'warn',
        summary: 'Advertencia',
        detail: 'No hay premios para migrar',
        life: 3000
      })
      return
    }

    let actualizados = 0
    let sinCambios = 0

    // Actualizar premios sin tipo
    for (const premio of premios) {
      if (!premio.tipo || premio.tipo === null || premio.tipo === '') {
        // Detectar tipo automáticamente
        const tipoDetectado = detectarTipoPremio(premio.nombre, premio.descripcion)

        // Actualizar premio con tipo detectado
        const premioActualizado = {
          ...premio,
          tipo: tipoDetectado,
          updated_at: Date.now()
        }

        await peticionesFetchOffline('updateData', 'premios_ruleta', JSON.stringify(premioActualizado))
        actualizados++

        const icono = tipoDetectado === 'premio' ? '🎁' : tipoDetectado === 'comodin' ? '🔄' : '💬'
        agregarLog(`${icono} "${premio.nombre}" → tipo: ${tipoDetectado}`, 'success')
      } else {
        sinCambios++
      }
    }

    agregarLog(`🎉 Migración completada: ${actualizados} actualizados, ${sinCambios} sin cambios`, 'success')

    toast.add({
      severity: 'success',
      summary: 'Migración Completada',
      detail: `${actualizados} premios actualizados correctamente`,
      life: 4000
    })

    // Verificar estado actualizado
    await verificarEstado()
  } catch (error) {
    console.error('Error al migrar premios:', error)
    agregarLog(`❌ Error: ${error.message}`, 'error')
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Error al migrar premios: ' + error.message,
      life: 5000
    })
  } finally {
    migrando.value = false
  }
}

const inicializarTablas = async () => {
  inicializando.value = true
  agregarLog('🎡 Iniciando proceso de inicialización...', 'info')

  try {
    // Paso 1: Crear tabla premios_ruleta
    agregarLog('📝 Creando tabla premios_ruleta...', 'info')
    try {
      await crearTablaSiNoExisteOffline('premios_ruleta', camposPremios, null) // Sin toast para no saturar
      agregarLog('✅ Tabla premios_ruleta creada exitosamente', 'success')
    } catch (e) {
      agregarLog(`⚠️ Error creando tabla premios: ${e.message}`, 'warning')
    }

    // Paso 2: Crear tabla ganadores_ruleta
    agregarLog('📝 Creando tabla ganadores_ruleta...', 'info')
    try {
      await crearTablaSiNoExisteOffline('ganadores_ruleta', camposGanadores, null)
      agregarLog('✅ Tabla ganadores_ruleta creada exitosamente', 'success')
    } catch (e) {
      agregarLog(`⚠️ Error creando tabla ganadores: ${e.message}`, 'warning')
    }

    // Pequeña pausa para asegurar que las tablas estén listas
    await new Promise(resolve => setTimeout(resolve, 500))

    // Paso 3: Verificar si hay premios
    agregarLog('🔍 Verificando premios existentes...', 'info')
    let premiosExistentes = []

    try {
      const resultado = await peticionesFetchOffline('getDataAsArray', 'premios_ruleta')
      premiosExistentes = Array.isArray(resultado) ? resultado : []
      agregarLog(`📊 Se encontraron ${premiosExistentes.length} premios`, 'info')
    } catch (e) {
      agregarLog('ℹ️ No se encontraron premios, se crearán ejemplos', 'info')
    }

    // Paso 4: Insertar premios de ejemplo si no existen
    if (premiosExistentes.length === 0) {
      agregarLog('🎁 Insertando premios de ejemplo...', 'info')

      const premiosEjemplo = [
        {
          nombre: 'Premio 1: Descuento 10%',
          descripcion: 'Obtén un 10% de descuento en tu próxima compra',
          color: '#FF6384',
          probabilidad: 15,
          activo: 1,
          created_at: Date.now(),
          updated_at: Date.now()
        },
        {
          nombre: 'Premio 2: Producto Gratis',
          descripcion: 'Un producto gratis de nuestra selección',
          color: '#36A2EB',
          probabilidad: 10,
          activo: 1,
          created_at: Date.now(),
          updated_at: Date.now()
        },
        {
          nombre: 'Premio 3: Descuento 20%',
          descripcion: 'Obtén un 20% de descuento en tu próxima compra',
          color: '#FFCE56',
          probabilidad: 8,
          activo: 1,
          created_at: Date.now(),
          updated_at: Date.now()
        },
        {
          nombre: 'Premio 4: Vale $100',
          descripcion: 'Vale de $100 para tu próxima compra',
          color: '#4BC0C0',
          probabilidad: 5,
          activo: 1,
          created_at: Date.now(),
          updated_at: Date.now()
        },
        {
          nombre: 'Premio Especial',
          descripcion: 'Premio sorpresa especial',
          color: '#9966FF',
          probabilidad: 3,
          activo: 1,
          created_at: Date.now(),
          updated_at: Date.now()
        }
      ]

      for (let i = 0; i < premiosEjemplo.length; i++) {
        try {
          await peticionesFetchOffline('insertData', 'premios_ruleta', JSON.stringify(premiosEjemplo[i]))
          agregarLog(`✅ Premio ${i + 1}/5 insertado`, 'success')
        } catch (e) {
          agregarLog(`⚠️ Error insertando premio ${i + 1}: ${e.message}`, 'warning')
        }
      }
      agregarLog('🎉 Todos los premios de ejemplo insertados', 'success')
    } else {
      agregarLog('ℹ️ Ya existen premios en la base de datos', 'info')
    }

    // Notificación final
    toast.add({
      severity: 'success',
      summary: '¡Éxito!',
      detail: 'Sistema de ruleta inicializado correctamente',
      life: 5000
    })

    agregarLog('🎊 Inicialización completada exitosamente', 'success')

    // Verificar estado actualizado
    await verificarEstado()
  } catch (error) {
    console.error('Error al inicializar:', error)
    agregarLog(`❌ Error en inicialización: ${error.message}`, 'error')

    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'No se pudo inicializar el sistema: ' + error.message,
      life: 5000
    })
  } finally {
    inicializando.value = false
  }
}

// Lifecycle
onMounted(() => {
  verificarEstado()
})
</script>

<style scoped>
.configuracion-ruleta {
  max-width: 1400px;
  margin: 0 auto;
}

.d-flex {
  display: flex;
}

.flex-wrap {
  flex-wrap: wrap;
}

.gap-3 {
  gap: 1rem;
}

.row {
  display: flex;
  flex-wrap: wrap;
  margin: -0.5rem;
}

.col-md-4 {
  flex: 0 0 33.333%;
  padding: 0.5rem;
}

@media (max-width: 768px) {
  .col-md-4 {
    flex: 0 0 100%;
  }
}

.text-center {
  text-align: center;
}

.text-success {
  color: #22c55e;
}

.text-danger {
  color: #ef4444;
}

.text-warning {
  color: #f59e0b;
}

.text-info {
  color: #3b82f6;
}

.text-muted {
  color: #6c757d;
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

.mb-2 {
  margin-bottom: 0.5rem;
}

.mb-3 {
  margin-bottom: 1rem;
}

.mb-4 {
  margin-bottom: 1.5rem;
}

.mr-2 {
  margin-right: 0.5rem;
}

.p-3 {
  padding: 1rem;
}

.bg-light {
  background-color: #f8f9fa;
}

.rounded {
  border-radius: 0.25rem;
}

.log-container {
  font-family: 'Courier New', monospace;
  font-size: 0.875rem;
}

.log-item {
  padding: 0.25rem 0;
  border-bottom: 1px solid #e5e7eb;
}

.log-item:last-child {
  border-bottom: none;
}
</style>
