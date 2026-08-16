<template>
  <Card class="border border-slate-200 shadow-lg dark:border-slate-700">
    <template #content>
      <div class="space-y-5">
        <div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p class="text-xs font-semibold uppercase tracking-wide text-indigo-600">Diagnóstico</p>
            <h2 class="text-2xl font-bold text-slate-900 dark:text-slate-100">
              Pruebas automáticas de Vender
            </h2>
            <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Comprueba ventas, carrito, inventario, impuestos, descuentos, clientes, IMEI,
              recargos y la estructura del componente.
            </p>
          </div>

          <Button
            :label="ejecutando ? 'Ejecutando pruebas…' : 'Ejecutar todas las pruebas'"
            :icon="ejecutando ? 'pi pi-spin pi-spinner' : 'pi pi-play'"
            severity="success"
            size="large"
            :disabled="ejecutando"
            @click="ejecutarPruebas"
          />
        </div>

        <Message v-if="estado === 'success'" severity="success" :closable="false">
          Todas las pruebas finalizaron correctamente{{ resumen ? `: ${resumen}` : '.' }}
        </Message>
        <Message v-else-if="estado === 'error'" severity="error" :closable="false">
          {{ mensajeError }}
        </Message>
        <Message v-else-if="ejecutando" severity="info" :closable="false">
          La aplicación está ejecutando la suite completa. Puedes continuar cuando termine.
        </Message>

        <div class="grid gap-3 sm:grid-cols-3">
          <div class="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800">
            <p class="text-xs font-semibold uppercase text-slate-500">Estado</p>
            <p class="mt-1 text-lg font-bold" :class="colorEstado">{{ etiquetaEstado }}</p>
          </div>
          <div class="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800">
            <p class="text-xs font-semibold uppercase text-slate-500">Última ejecución</p>
            <p class="mt-1 text-lg font-bold text-slate-800 dark:text-slate-100">
              {{ ultimaEjecucion || 'Sin ejecutar' }}
            </p>
          </div>
          <div class="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800">
            <p class="text-xs font-semibold uppercase text-slate-500">Duración</p>
            <p class="mt-1 text-lg font-bold text-slate-800 dark:text-slate-100">
              {{ duracion }}
            </p>
          </div>
        </div>

        <div class="overflow-hidden rounded-xl border border-slate-800 bg-slate-950">
          <div class="flex items-center justify-between border-b border-slate-800 px-4 py-3">
            <span class="text-sm font-semibold text-slate-200">Resultado técnico</span>
            <Button
              v-if="salida"
              label="Limpiar"
              icon="pi pi-trash"
              severity="secondary"
              text
              size="small"
              @click="limpiarResultado"
            />
          </div>
          <pre class="min-h-48 max-h-[520px] overflow-auto whitespace-pre-wrap p-4 text-xs leading-5 text-emerald-300">{{ salida || 'Presiona “Ejecutar todas las pruebas” para comenzar.' }}</pre>
        </div>
      </div>
    </template>
  </Card>
</template>

<script setup>
import { computed, ref } from 'vue'
import { runVenderDiagnostics } from '@/views/Vender/venderDiagnostics.js'

const ejecutando = ref(false)
const estado = ref('idle')
const salida = ref('')
const mensajeError = ref('')
const ultimaEjecucion = ref('')
const duracionMs = ref(0)

const etiquetaEstado = computed(() => {
  if (ejecutando.value) return 'Ejecutando'
  if (estado.value === 'success') return 'Correcto'
  if (estado.value === 'error') return 'Con errores'
  return 'Pendiente'
})

const colorEstado = computed(() => {
  if (ejecutando.value) return 'text-blue-600'
  if (estado.value === 'success') return 'text-emerald-600'
  if (estado.value === 'error') return 'text-red-600'
  return 'text-slate-600'
})

const duracion = computed(() =>
  duracionMs.value > 0 ? `${(duracionMs.value / 1000).toFixed(1)} segundos` : '—'
)

const resumen = computed(() => {
  const coincidencia =
    salida.value.match(/Tests\s+(\d+)\s+passed/i) ||
    salida.value.match(/(\d+)\s+pruebas aprobadas/i)
  return coincidencia ? `${coincidencia[1]} pruebas aprobadas` : ''
})

const ejecutarPruebas = async () => {
  if (ejecutando.value) return
  ejecutando.value = true
  estado.value = 'running'
  salida.value = 'Iniciando la suite completa de pruebas…\n'
  mensajeError.value = ''
  duracionMs.value = 0

  try {
    const ipc = window.electron?.ipcRenderer || window.api
    let resultado = ipc?.invoke
      ? await ipc.invoke('ejecutar-pruebas-vender')
      : { unavailable: true }
    if (resultado?.unavailable) resultado = runVenderDiagnostics()
    salida.value = resultado?.output || resultado?.error || 'La ejecución no devolvió detalles.'
    duracionMs.value = Number(resultado?.durationMs || 0)
    ultimaEjecucion.value = new Date().toLocaleString('es-DO')

    if (resultado?.success) {
      estado.value = 'success'
    } else {
      estado.value = 'error'
      mensajeError.value = resultado?.error || 'Una o más pruebas no fueron aprobadas.'
    }
  } catch (error) {
    estado.value = 'error'
    mensajeError.value = error?.message || 'No fue posible ejecutar las pruebas.'
    salida.value = mensajeError.value
    ultimaEjecucion.value = new Date().toLocaleString('es-DO')
  } finally {
    ejecutando.value = false
  }
}

const limpiarResultado = () => {
  salida.value = ''
  estado.value = 'idle'
  mensajeError.value = ''
  duracionMs.value = 0
}
</script>
