<script setup>
import { computed, onMounted, ref } from 'vue'
import { useToast } from 'primevue/usetoast'
import { crearTablaSiNoExisteOffline, peticionesFetchOffline } from '../../funciones/funciones.js'
import { useDatosEmpresa } from '../../stores'
import {
  calcularBalancePeriodo, crearRegistroCierre, crearRegistroReapertura, etiquetaPeriodo,
  generarPeriodos, obtenerPeriodo, periodosVigentes, validarCierrePeriodo
} from './periodosCore.js'

const toast = useToast()
const datosEmpresa = useDatosEmpresa()
const cargando = ref(false)
const guardando = ref(false)
const asientos = ref([])
const registros = ref([])
const periodoSeleccionado = ref('')
const mostrarCierre = ref(false)
const mostrarReapertura = ref(false)
const autorizador = ref('')
const confirmacionCierre = ref('')
const motivoReapertura = ref('')
const confirmacionReapertura = ref('')

const campos = [
  'periodo', 'estado', 'fecha_cierre', 'usuario_cierre', 'autorizador', 'total_debito',
  'total_credito', 'diferencia', 'cantidad_asientos', 'motivo_reapertura',
  'fecha_reapertura', 'usuario_reapertura'
]

const usuarioActual = computed(() => {
  if (datosEmpresa.usuario?.nombre || datosEmpresa.usuario?.usuario) return datosEmpresa.usuario.nombre || datosEmpresa.usuario.usuario
  try {
    const usuario = JSON.parse(localStorage.getItem('usuarioLocal') || '[]')?.[0] || {}
    return usuario.nombre || usuario.usuario || 'Sistema'
  } catch { return 'Sistema' }
})
const vigentes = computed(() => periodosVigentes(registros.value))
const clavesPeriodos = computed(() => generarPeriodos(asientos.value, registros.value))
const filas = computed(() => clavesPeriodos.value.map((periodo) => {
  const registro = obtenerPeriodo(registros.value, periodo)
  return { ...registro, ...calcularBalancePeriodo(asientos.value, periodo), etiqueta: etiquetaPeriodo(periodo) }
}))
const filaSeleccionada = computed(() => filas.value.find((fila) => fila.periodo === periodoSeleccionado.value) || null)
const validacion = computed(() => validarCierrePeriodo(asientos.value, periodoSeleccionado.value))
const formatoNumero = (valor) => new Intl.NumberFormat('es-DO', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(valor) || 0)
const formatoFecha = (valor) => {
  if (!valor) return '—'
  const fecha = new Date(valor)
  return Number.isNaN(fecha.getTime()) ? String(valor) : new Intl.DateTimeFormat('es-DO', { dateStyle: 'medium', timeStyle: 'short' }).format(fecha)
}

const cargar = async () => {
  cargando.value = true
  try {
    await crearTablaSiNoExisteOffline('periodos_contables', campos, toast)
    const [datosAsientos, datosPeriodos] = await Promise.all([
      peticionesFetchOffline('getDataAsArray', 'asientodiario', ''),
      peticionesFetchOffline('getDataAsArray', 'periodos_contables', '')
    ])
    asientos.value = Array.isArray(datosAsientos) ? datosAsientos : []
    registros.value = Array.isArray(datosPeriodos) ? datosPeriodos : []
    if (!periodoSeleccionado.value) periodoSeleccionado.value = clavesPeriodos.value[0] || ''
  } catch (error) {
    console.error('[Períodos contables] Error:', error)
    toast.add({ severity: 'error', summary: 'No se pudieron cargar los períodos', detail: error.message, life: 4500 })
  } finally { cargando.value = false }
}

const seleccionar = (fila) => { periodoSeleccionado.value = fila.periodo }
const solicitarCierre = (fila) => {
  seleccionar(fila)
  autorizador.value = usuarioActual.value
  confirmacionCierre.value = ''
  mostrarCierre.value = true
}
const solicitarReapertura = (fila) => {
  seleccionar(fila)
  motivoReapertura.value = ''
  confirmacionReapertura.value = ''
  mostrarReapertura.value = true
}

const guardarRegistro = async (registro) => {
  const operacion = registro.id ? 'updateData' : 'insertData'
  await peticionesFetchOffline(operacion, 'periodos_contables', JSON.stringify(registro))
}

const cerrarPeriodo = async () => {
  if (!validacion.value.valido || confirmacionCierre.value.trim().toUpperCase() !== 'CERRAR' || autorizador.value.trim().length < 3) return
  guardando.value = true
  try {
    const anterior = vigentes.value.find((registro) => registro.periodo === periodoSeleccionado.value) || {}
    await guardarRegistro(crearRegistroCierre({ periodo: periodoSeleccionado.value, balance: validacion.value, usuario: usuarioActual.value, autorizador: autorizador.value, registroAnterior: anterior }))
    mostrarCierre.value = false
    await cargar()
    toast.add({ severity: 'success', summary: 'Período cerrado', detail: `${etiquetaPeriodo(periodoSeleccionado.value)} quedó bloqueado.`, life: 3500 })
  } catch (error) {
    toast.add({ severity: 'error', summary: 'No se pudo cerrar', detail: error.message, life: 4500 })
  } finally { guardando.value = false }
}

const reabrirPeriodo = async () => {
  if (confirmacionReapertura.value.trim().toUpperCase() !== 'REABRIR' || motivoReapertura.value.trim().length < 10) return
  guardando.value = true
  try {
    const anterior = vigentes.value.find((registro) => registro.periodo === periodoSeleccionado.value)
    if (!anterior?.id) throw new Error('No se encontró el registro cerrado del período.')
    await guardarRegistro(crearRegistroReapertura({ registro: anterior, motivo: motivoReapertura.value, usuario: usuarioActual.value }))
    mostrarReapertura.value = false
    await cargar()
    toast.add({ severity: 'success', summary: 'Período reabierto', detail: 'El motivo y el usuario quedaron registrados.', life: 3500 })
  } catch (error) {
    toast.add({ severity: 'error', summary: 'No se pudo reabrir', detail: error.message, life: 4500 })
  } finally { guardando.value = false }
}

onMounted(cargar)
</script>

<template>
  <main class="periodos-page">
    <Toast />
    <section class="header">
      <div><span class="eyebrow">CONTABILIDAD</span><h1>Cierre y bloqueo de períodos</h1><p>Protege los meses conciliados y evita que se alteren sus movimientos contables.</p></div>
      <Button label="Actualizar" icon="pi pi-refresh" outlined :loading="cargando" @click="cargar" />
    </section>

    <section class="notice"><i class="pi pi-shield" /><div><strong>Control de integridad contable</strong><p>Antes de cerrar se comprueba que débitos y créditos estén cuadrados. Una reapertura siempre exige usuario y motivo.</p></div></section>

    <section v-if="filaSeleccionada" class="summary">
      <article><span>Período seleccionado</span><strong>{{ filaSeleccionada.etiqueta }}</strong><Tag :value="filaSeleccionada.estado" :severity="filaSeleccionada.estado === 'CERRADO' ? 'danger' : 'success'" /></article>
      <article><span>Asientos</span><strong>{{ filaSeleccionada.asientos }}</strong><small>{{ filaSeleccionada.lineas }} líneas contables</small></article>
      <article><span>Total débitos</span><strong>{{ formatoNumero(filaSeleccionada.totalDebito) }}</strong></article>
      <article><span>Total créditos</span><strong>{{ formatoNumero(filaSeleccionada.totalCredito) }}</strong></article>
      <article :class="{ danger: Math.abs(filaSeleccionada.diferencia) >= .01 }"><span>Diferencia</span><strong>{{ formatoNumero(filaSeleccionada.diferencia) }}</strong><small>{{ Math.abs(filaSeleccionada.diferencia) < .01 ? 'Cuadrado' : 'Requiere revisión' }}</small></article>
    </section>

    <section class="table-card">
      <DataTable :value="filas" :loading="cargando" paginator :rows="12" dataKey="periodo" stripedRows selectionMode="single" :selection="filaSeleccionada" @rowSelect="seleccionar($event.data)">
        <template #empty><div class="empty">No hay períodos disponibles.</div></template>
        <Column field="periodo" header="Período" sortable><template #body="{data}"><strong>{{ data.etiqueta }}</strong><small class="block code">{{ data.periodo }}</small></template></Column>
        <Column field="estado" header="Estado" sortable><template #body="{data}"><Tag :value="data.estado" :severity="data.estado === 'CERRADO' ? 'danger' : 'success'" :icon="data.estado === 'CERRADO' ? 'pi pi-lock' : 'pi pi-lock-open'" /></template></Column>
        <Column field="asientos" header="Asientos" sortable />
        <Column field="totalDebito" header="Débitos" sortable><template #body="{data}">{{ formatoNumero(data.totalDebito) }}</template></Column>
        <Column field="totalCredito" header="Créditos" sortable><template #body="{data}">{{ formatoNumero(data.totalCredito) }}</template></Column>
        <Column field="diferencia" header="Diferencia" sortable><template #body="{data}"><span :class="Math.abs(data.diferencia) < .01 ? 'balanced' : 'unbalanced'">{{ formatoNumero(data.diferencia) }}</span></template></Column>
        <Column field="fecha_cierre" header="Último cierre"><template #body="{data}"><span>{{ formatoFecha(data.fecha_cierre) }}</span><small v-if="data.usuario_cierre" class="block">{{ data.usuario_cierre }} · Autorizó: {{ data.autorizador || '—' }}</small></template></Column>
        <Column header="Última reapertura" style="min-width:220px"><template #body="{data}"><template v-if="data.fecha_reapertura"><span>{{ formatoFecha(data.fecha_reapertura) }}</span><small class="block">{{ data.usuario_reapertura }}</small><small class="block reason" :title="data.motivo_reapertura">{{ data.motivo_reapertura }}</small></template><span v-else>—</span></template></Column>
        <Column header="Acciones" style="min-width:150px"><template #body="{data}"><Button v-if="data.estado !== 'CERRADO'" label="Cerrar" icon="pi pi-lock" size="small" severity="danger" outlined @click.stop="solicitarCierre(data)" /><Button v-else label="Reabrir" icon="pi pi-lock-open" size="small" severity="warning" outlined @click.stop="solicitarReapertura(data)" /></template></Column>
      </DataTable>
    </section>

    <Dialog v-model:visible="mostrarCierre" modal header="Autorizar cierre contable" :style="{width:'min(580px,95vw)'}">
      <div class="dialog-content"><div class="period-title"><i class="pi pi-lock" /><div><small>Período que será bloqueado</small><strong>{{ etiquetaPeriodo(periodoSeleccionado) }}</strong></div></div><Message v-if="!validacion.valido" severity="error" :closable="false"><ul><li v-for="motivo in validacion.motivos" :key="motivo">{{ motivo }}</li></ul></Message><Message v-else severity="success" :closable="false">Débitos y créditos están cuadrados. Diferencia: {{ formatoNumero(validacion.diferencia) }}</Message><label>Usuario que autoriza<InputText v-model="autorizador" autocomplete="off" /></label><label>Escriba <strong>CERRAR</strong> para confirmar<InputText v-model="confirmacionCierre" autocomplete="off" /></label><p class="warning"><i class="pi pi-exclamation-triangle" /> Los módulos contables deben consultar este período antes de guardar, editar o eliminar movimientos.</p></div>
      <template #footer><Button label="Cancelar" severity="secondary" text @click="mostrarCierre=false" /><Button label="Cerrar y bloquear" icon="pi pi-lock" severity="danger" :loading="guardando" :disabled="!validacion.valido || confirmacionCierre.trim().toUpperCase() !== 'CERRAR' || autorizador.trim().length < 3" @click="cerrarPeriodo" /></template>
    </Dialog>

    <Dialog v-model:visible="mostrarReapertura" modal header="Reabrir período contable" :style="{width:'min(580px,95vw)'}">
      <div class="dialog-content"><Message severity="warn" :closable="false">Esta acción quedará auditada con el usuario, la fecha y el motivo.</Message><label>Usuario responsable<InputText :modelValue="usuarioActual" disabled /></label><label>Motivo de reapertura (mínimo 10 caracteres)<Textarea v-model="motivoReapertura" rows="4" autoResize /></label><label>Escriba <strong>REABRIR</strong> para confirmar<InputText v-model="confirmacionReapertura" autocomplete="off" /></label></div>
      <template #footer><Button label="Cancelar" severity="secondary" text @click="mostrarReapertura=false" /><Button label="Reabrir período" icon="pi pi-lock-open" severity="warning" :loading="guardando" :disabled="motivoReapertura.trim().length < 10 || confirmacionReapertura.trim().toUpperCase() !== 'REABRIR'" @click="reabrirPeriodo" /></template>
    </Dialog>
  </main>
</template>

<style scoped>
.periodos-page{padding:1.6rem;min-height:100vh;background:#f5f7fb;color:#29364d}.header{display:flex;justify-content:space-between;gap:1rem;align-items:flex-start}.eyebrow{font-size:.74rem;font-weight:800;letter-spacing:.08em;color:#4f46e5}.header h1{font-size:1.8rem;margin:.25rem 0}.header p{margin:0;color:#6b778e}.notice{display:flex;align-items:center;gap:1rem;background:#eef6ff;border:1px solid #cfe4ff;border-radius:13px;padding:1rem;margin:1.2rem 0}.notice>i{font-size:1.6rem;color:#2563eb}.notice p{margin:.2rem 0 0;color:#5c6b82}.summary{display:grid;grid-template-columns:1.5fr repeat(4,1fr);gap:.8rem;margin-bottom:1rem}.summary article{background:#fff;border:1px solid #e5e9f1;border-radius:12px;padding:1rem}.summary span,.summary small{display:block;color:#758197;font-size:.78rem}.summary strong{font-size:1.23rem;display:block;margin:.25rem 0}.summary article:first-child{display:grid;grid-template-columns:1fr auto;align-items:center}.summary article:first-child span{grid-column:1/-1}.summary .danger strong{color:#dc2626}.table-card{background:#fff;border:1px solid #e5e9f1;border-radius:14px;padding:.4rem;overflow:hidden;box-shadow:0 4px 14px rgba(30,41,59,.05)}.block{display:block;color:#78859a;margin-top:.2rem}.reason{max-width:240px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.code{font-family:ui-monospace,SFMono-Regular,Menlo,monospace}.balanced{color:#059669;font-weight:700}.unbalanced{color:#dc2626;font-weight:800}.empty{text-align:center;padding:3rem;color:#7a879b}.dialog-content{display:grid;gap:1rem}.dialog-content label{display:grid;gap:.4rem;font-size:.82rem;color:#536179;font-weight:700}.period-title{display:flex;gap:.8rem;align-items:center;background:#f8fafc;border-radius:10px;padding:1rem}.period-title i{font-size:1.5rem;color:#dc2626}.period-title small,.period-title strong{display:block}.period-title strong{font-size:1.15rem}.warning{font-size:.82rem;color:#92400e;background:#fffbeb;padding:.7rem;border-radius:8px;margin:0}.dialog-content ul{margin:.3rem 0;padding-left:1.2rem}@media(max-width:1050px){.summary{grid-template-columns:repeat(3,1fr)}}@media(max-width:650px){.periodos-page{padding:.8rem}.header{flex-direction:column}.summary{grid-template-columns:1fr}}
</style>
