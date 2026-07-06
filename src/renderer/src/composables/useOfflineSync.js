import { ref, computed } from 'vue'
import {
  hayInternet,
  getEstadoSincronizacion,
  sincronizarFacturas,
  limpiarFacturasSincronizadas,
  guardarFacturaOffline,
  getFacturasPendientesSincronizacion
} from './useOfflineDB'

// Estado reactivo global
const estadoConexion = ref(navigator.onLine)
const sincronizando = ref(false)
const ultimaSincronizacion = ref(null)

/**
 * Composable para gestionar operaciones offline y sincronización
 */
export function useOfflineSync() {
  /**
   * Actualiza el estado de conexión
   */
  const actualizarEstadoConexion = () => {
    estadoConexion.value = navigator.onLine
    return estadoConexion.value
  }

  /**
   * Verifica si hay conexión
   */
  const isOnline = computed(() => estadoConexion.value)
  const isOffline = computed(() => !estadoConexion.value)

  /**
   * Guarda una factura (online u offline automáticamente)
   * @param {Object} factura - Datos de la factura
   * @param {Function} peticionesFn - Función para hacer peticiones al servidor
   * @returns {Promise<Object>} Resultado de la operación
   */
  const guardarFactura = async (factura, peticionesFn) => {
    try {
      if (hayInternet()) {
        // Guardar online directamente
        const resultado = await peticionesFn('insertData', 'facturas', JSON.stringify(factura))

        if (resultado[0] === 'ok') {
          return {
            success: true,
            message: 'Factura guardada exitosamente',
            mode: 'online',
            id: resultado[1]
          }
        } else {
          // Si falla online, intentar guardar offline
          const idOffline = await guardarFacturaOffline(factura)
          return {
            success: true,
            message: 'Error en servidor. Factura guardada offline',
            mode: 'offline',
            id: idOffline,
            warning: true
          }
        }
      } else {
        // Guardar offline
        const idOffline = await guardarFacturaOffline(factura)
        return {
          success: true,
          message: 'Factura guardada offline. Se sincronizará cuando haya conexión.',
          mode: 'offline',
          id: idOffline
        }
      }
    } catch (error) {
      console.error('[OfflineSync] Error guardando factura:', error)

      // Último intento: guardar offline
      try {
        const idOffline = await guardarFacturaOffline(factura)
        return {
          success: true,
          message: 'Error guardando online. Guardada offline.',
          mode: 'offline',
          id: idOffline,
          error: error.message
        }
      } catch (offlineError) {
        return {
          success: false,
          message: 'Error guardando factura',
          error: offlineError.message
        }
      }
    }
  }

  /**
   * Sincroniza todas las operaciones pendientes
   * @param {Function} peticionesFn - Función para hacer peticiones
   * @returns {Promise<Object>} Resultado de la sincronización
   */
  const sincronizarTodo = async (peticionesFn) => {
    if (!hayInternet()) {
      return {
        success: false,
        message: 'No hay conexión a internet'
      }
    }

    if (sincronizando.value) {
      return {
        success: false,
        message: 'Ya hay una sincronización en proceso'
      }
    }

    try {
      sincronizando.value = true

      const facturasSincronizadas = await sincronizarFacturas(peticionesFn)

      // Limpiar facturas sincronizadas
      if (facturasSincronizadas > 0) {
        setTimeout(async () => {
          await limpiarFacturasSincronizadas()
        }, 2000)
      }

      ultimaSincronizacion.value = new Date()

      return {
        success: true,
        message: `Sincronización completada: ${facturasSincronizadas} factura(s)`,
        facturasSincronizadas
      }
    } catch (error) {
      console.error('[OfflineSync] Error en sincronización:', error)
      return {
        success: false,
        message: 'Error durante la sincronización',
        error: error.message
      }
    } finally {
      sincronizando.value = false
    }
  }

  /**
   * Obtiene el estado actual del sistema
   */
  const getEstado = async () => {
    const estado = await getEstadoSincronizacion()
    return {
      ...estado,
      sincronizando: sincronizando.value,
      ultimaSincronizacion: ultimaSincronizacion.value
    }
  }

  /**
   * Obtiene facturas pendientes de sincronización
   */
  const getFacturasPendientes = async () => {
    return await getFacturasPendientesSincronizacion()
  }

  /**
   * Inicializa los listeners de conexión
   */
  const inicializarListeners = (callbacks = {}) => {
    const handleOnline = async () => {
      actualizarEstadoConexion()
      if (callbacks.onOnline) {
        await callbacks.onOnline()
      }
    }

    const handleOffline = () => {
      actualizarEstadoConexion()
      if (callbacks.onOffline) {
        callbacks.onOffline()
      }
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Retornar función para limpiar listeners
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }

  return {
    // Estado
    isOnline,
    isOffline,
    sincronizando: computed(() => sincronizando.value),
    ultimaSincronizacion: computed(() => ultimaSincronizacion.value),

    // Métodos
    actualizarEstadoConexion,
    guardarFactura,
    sincronizarTodo,
    getEstado,
    getFacturasPendientes,
    inicializarListeners
  }
}
