<script setup>
import { computed, onMounted, ref } from 'vue'
import Button from 'primevue/button'
import Calendar from 'primevue/calendar'
import Column from 'primevue/column'
import DataTable from 'primevue/datatable'
import Dialog from 'primevue/dialog'
import InputNumber from 'primevue/inputnumber'
import InputText from 'primevue/inputtext'
import Select from 'primevue/select'
import Tag from 'primevue/tag'
import Textarea from 'primevue/textarea'
import { useToast } from 'primevue/usetoast'
import Swal from 'sweetalert2'
import { crearTablaSiNoExisteOffline, peticionesFetchOffline } from '@/funciones/funciones.js'
import { useDatosEmpresa } from '@/stores'
import {
  ESTADOS_ACTIVO,
  METODO_LINEA_RECTA,
  crearCalendarioDepreciacion,
  fechaIso,
  numero,
  puedeRegistrarPeriodo,
  prepararAsientoDepreciacion,
  prepararBaja,
  resumenActivo,
  validarActivo,
  validarBaja
} from './activosFijosCore.js'

const toast = useToast()
const datosEmpresa = useDatosEmpresa()

const CAMPOS_ACTIVOS = [
  'codigo', 'nombre', 'descripcion', 'categoria', 'fecha_adquisicion', 'costo_adquisicion',
  'valor_residual', 'vida_util_meses', 'metodo', 'cuenta_contable',
  'cuenta_gasto_depreciacion', 'cuenta_depreciacion_acumulada', 'ubicacion', 'responsable',
  'estado', 'valor', 'depreciacion_acumulada', 'fecha_baja', 'tipo_baja', 'valor_venta',
  'motivo_baja', 'resultado_baja', 'asiento_baja', 'historial', 'usuario', 'created_at', 'updated_at'
]
const CAMPOS_DEPRECIACIONES = [
  'activo_id', 'activo_codigo', 'periodo', 'fecha_aplicacion', 'monto',
  'depreciacion_acumulada', 'valor_en_libros', 'asiento_preparado', 'asiento_numero',
  'estado_asiento', 'estado', 'usuario', 'created_at', 'updated_at'
]

const activos = ref([])
const depreciaciones = ref([])
const cuentas = ref([])
const cargando = ref(false)
const procesando = ref(false)
const busqueda = ref('')
const filtroEstado = ref(null)
const filtroCategoria = ref(null)
const modalActivo = ref(false)
const modalDetalle = ref(false)
const modalBaja = ref(false)
const modalAsiento = ref(false)
const activoSeleccionado = ref(null)
const asientoVisible = ref(null)
const usuarioLocal = ref({})

const formulario = ref(nuevoFormulario())
const formularioBaja = ref(nuevaBaja())

function nuevoFormulario() {
  return {
    codigo: '', nombre: '', descripcion: '', categoria: '', fecha_adquisicion: new Date(),
    costo_adquisicion: 0, valor_residual: 0, vida_util_anios: 5, metodo: METODO_LINEA_RECTA,
    cuenta_contable: '', cuenta_gasto_depreciacion: '', cuenta_depreciacion_acumulada: '',
    ubicacion: '', responsable: '', estado: ESTADOS_ACTIVO.ACTIVO
  }
}

function nuevaBaja() {
  return { tipo: ESTADOS_ACTIVO.BAJA, fecha: new Date(), valor_venta: 0, motivo: '', cuenta_cobro: '' }
}

const usuarioActual = computed(() =>
  usuarioLocal.value?.nombre || usuarioLocal.value?.usuario || datosEmpresa.usuario?.nombre || 'Sistema'
)
const categorias = computed(() => [...new Set(activos.value.map((activo) => activo.categoria).filter(Boolean))].sort())
const opcionesCategoria = computed(() => categorias.value.map((value) => ({ label: value, value })))
const opcionesCuenta = computed(() => cuentas.value.map((cuenta) => ({
  label: `${cuenta.nombre}${cuenta.categoria ? ` · ${cuenta.categoria}` : ''}`,
  value: cuenta.nombre
})))
const opcionesEstado = [
  { label: 'Activos', value: ESTADOS_ACTIVO.ACTIVO },
  { label: 'Dados de baja', value: ESTADOS_ACTIVO.BAJA },
  { label: 'Vendidos', value: ESTADOS_ACTIVO.VENDIDO }
]
const activosEnriquecidos = computed(() => activos.value.map((activo) => ({
  ...activo,
  resumen: resumenActivo(activo, depreciaciones.value)
})))
const activosFiltrados = computed(() => {
  const query = busqueda.value.trim().toLowerCase()
  return activosEnriquecidos.value.filter((activo) => {
    const pasaEstado = !filtroEstado.value || activo.estado === filtroEstado.value
    const pasaCategoria = !filtroCategoria.value || activo.categoria === filtroCategoria.value
    const pasaTexto = !query || [activo.codigo, activo.nombre, activo.categoria, activo.ubicacion, activo.responsable]
      .some((valor) => String(valor || '').toLowerCase().includes(query))
    return pasaEstado && pasaCategoria && pasaTexto
  })
})
const dashboard = computed(() => activosEnriquecidos.value.reduce((total, activo) => {
  total.registrados += 1
  if (activo.estado === ESTADOS_ACTIVO.ACTIVO) {
    total.activos += 1
    total.costo += activo.resumen.costo
    total.depreciacion += activo.resumen.depreciacionAcumulada
    total.valorLibros += activo.resumen.valorEnLibros
  }
  return total
}, { registrados: 0, activos: 0, costo: 0, depreciacion: 0, valorLibros: 0 }))
const calendarioSeleccionado = computed(() => activoSeleccionado.value
  ? crearCalendarioDepreciacion(activoSeleccionado.value, depreciaciones.value)
  : [])
const resumenSeleccionado = computed(() => activoSeleccionado.value
  ? resumenActivo(activoSeleccionado.value, depreciaciones.value)
  : { costo: 0, depreciacionAcumulada: 0, valorEnLibros: 0 })
const proyeccionBaja = computed(() => activoSeleccionado.value
  ? prepararBaja(activoSeleccionado.value, resumenSeleccionado.value, formularioBaja.value)
  : { resultado: 0, valor_en_libros: 0 })

const respuestaExitosa = (respuesta) => {
  if (respuesta === true || respuesta === 'ok') return true
  if (Array.isArray(respuesta)) return respuesta[0] === 'ok' || respuesta[0] === true
  return Boolean(respuesta && typeof respuesta === 'object' && respuesta.success !== false && !respuesta.error)
}
const moneda = (valor) => new Intl.NumberFormat('es-DO', {
  style: 'currency', currency: 'DOP', minimumFractionDigits: 2
}).format(numero(valor))
const parseJson = (valor, fallback = []) => {
  if (Array.isArray(valor) || (valor && typeof valor === 'object')) return valor
  try { return valor ? JSON.parse(valor) : fallback } catch { return fallback }
}
const estadoSeverity = (estado) => ({ ACTIVO: 'success', BAJA: 'danger', VENDIDO: 'warn' }[estado] || 'secondary')
const ahora = () => new Date().toISOString()

onMounted(async () => {
  try { usuarioLocal.value = JSON.parse(window.localStorage.getItem('usuarioLocal') || '[]')?.[0] || {} } catch { usuarioLocal.value = {} }
  await inicializar()
})

async function inicializar() {
  cargando.value = true
  try {
    await Promise.all([
      crearTablaSiNoExisteOffline('activos_fijos', CAMPOS_ACTIVOS, toast),
      crearTablaSiNoExisteOffline('depreciaciones_activos', CAMPOS_DEPRECIACIONES, toast)
    ])
    await cargarDatos()
  } catch (error) {
    console.error('Error inicializando activos fijos:', error)
    toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo cargar el módulo.', life: 3500 })
  } finally { cargando.value = false }
}

async function cargarDatos() {
  const [activosData, depreciacionesData, cuentasData] = await Promise.all([
    peticionesFetchOffline('getDataAsArray', 'activos_fijos'),
    peticionesFetchOffline('getDataAsArray', 'depreciaciones_activos'),
    peticionesFetchOffline('getDataAsArray', 'cuentas')
  ])
  activos.value = Array.isArray(activosData) ? activosData.map((a) => ({ ...a, estado: a.estado || ESTADOS_ACTIVO.ACTIVO })) : []
  depreciaciones.value = Array.isArray(depreciacionesData) ? depreciacionesData : []
  cuentas.value = Array.isArray(cuentasData) ? cuentasData : []
  if (activoSeleccionado.value) {
    activoSeleccionado.value = activos.value.find((a) => String(a.id) === String(activoSeleccionado.value.id)) || null
  }
}

function abrirNuevoActivo() {
  formulario.value = nuevoFormulario()
  formulario.value.codigo = `AF-${String(Date.now()).slice(-8)}`
  modalActivo.value = true
}

async function guardarActivo() {
  const payloadValidacion = {
    ...formulario.value,
    fecha_adquisicion: fechaIso(formulario.value.fecha_adquisicion),
    vida_util_meses: Math.round(numero(formulario.value.vida_util_anios) * 12)
  }
  const validacion = validarActivo(payloadValidacion)
  if (!validacion.valido) {
    await Swal.fire({ icon: 'warning', title: 'Revise el activo', html: validacion.errores.join('<br>') })
    return
  }
  const duplicado = activos.value.some((a) => String(a.codigo).toLowerCase() === String(payloadValidacion.codigo).toLowerCase())
  if (duplicado) {
    toast.add({ severity: 'warn', summary: 'Código duplicado', detail: 'Ya existe un activo con ese código.', life: 3000 })
    return
  }
  procesando.value = true
  try {
    const costo = numero(payloadValidacion.costo_adquisicion)
    const payload = {
      codigo: payloadValidacion.codigo.trim(), nombre: payloadValidacion.nombre.trim(),
      descripcion: payloadValidacion.descripcion || '', categoria: payloadValidacion.categoria,
      fecha_adquisicion: payloadValidacion.fecha_adquisicion, costo_adquisicion: costo,
      valor_residual: numero(payloadValidacion.valor_residual), vida_util_meses: payloadValidacion.vida_util_meses,
      metodo: METODO_LINEA_RECTA, cuenta_contable: payloadValidacion.cuenta_contable || '',
      cuenta_gasto_depreciacion: payloadValidacion.cuenta_gasto_depreciacion || '',
      cuenta_depreciacion_acumulada: payloadValidacion.cuenta_depreciacion_acumulada || '',
      ubicacion: payloadValidacion.ubicacion || '', responsable: payloadValidacion.responsable || '',
      estado: ESTADOS_ACTIVO.ACTIVO, valor: costo, depreciacion_acumulada: 0,
      historial: JSON.stringify([{ accion: 'ALTA', fecha: ahora(), usuario: usuarioActual.value, costo }]),
      usuario: usuarioActual.value, created_at: ahora(), updated_at: ahora()
    }
    const respuesta = await peticionesFetchOffline('insertData', 'activos_fijos', JSON.stringify(payload))
    if (!respuestaExitosa(respuesta)) throw new Error('No se pudo registrar el activo.')
    await cargarDatos()
    modalActivo.value = false
    toast.add({ severity: 'success', summary: 'Activo registrado', detail: payload.nombre, life: 2800 })
  } catch (error) {
    console.error(error)
    toast.add({ severity: 'error', summary: 'Error', detail: error.message, life: 3500 })
  } finally { procesando.value = false }
}

function abrirDetalle(activo) {
  activoSeleccionado.value = activos.value.find((a) => String(a.id) === String(activo.id)) || activo
  modalDetalle.value = true
}

async function registrarDepreciacion(periodo) {
  if (!activoSeleccionado.value || procesando.value) return
  const calendario = calendarioSeleccionado.value
  const permiso = puedeRegistrarPeriodo(periodo, calendario, new Date())
  if (!permiso.permitido) {
    toast.add({ severity: 'warn', summary: 'No disponible', detail: permiso.motivo, life: 3200 })
    return
  }
  const confirmacion = await Swal.fire({
    icon: 'question', title: `Registrar depreciación ${periodo.periodo}`,
    html: `Monto: <b>${moneda(periodo.monto)}</b><br>El asiento quedará preparado y pendiente de contabilizar.`,
    showCancelButton: true, confirmButtonText: 'Registrar', cancelButtonText: 'Cancelar', confirmButtonColor: '#2563eb'
  })
  if (!confirmacion.isConfirmed) return

  procesando.value = true
  try {
    const registrosActuales = await peticionesFetchOffline('getDataByField', 'depreciaciones_activos', 'activo_id', activoSeleccionado.value.id)
    const yaExiste = (Array.isArray(registrosActuales) ? registrosActuales : [])
      .some((registro) => registro.periodo === periodo.periodo && registro.estado !== 'ANULADA')
    if (yaExiste) throw new Error('Este período ya fue registrado por otro proceso.')

    const asiento = prepararAsientoDepreciacion(activoSeleccionado.value, periodo)
    const payload = {
      activo_id: activoSeleccionado.value.id, activo_codigo: activoSeleccionado.value.codigo,
      periodo: periodo.periodo, fecha_aplicacion: periodo.fecha_aplicacion, monto: periodo.monto,
      depreciacion_acumulada: periodo.depreciacion_acumulada, valor_en_libros: periodo.valor_en_libros,
      asiento_preparado: JSON.stringify(asiento), asiento_numero: '', estado_asiento: 'PENDIENTE',
      estado: 'REGISTRADA', usuario: usuarioActual.value, created_at: ahora(), updated_at: ahora()
    }
    const respuesta = await peticionesFetchOffline('insertData', 'depreciaciones_activos', JSON.stringify(payload))
    if (!respuestaExitosa(respuesta)) throw new Error('No se pudo registrar la depreciación.')

    const activoActualizado = {
      ...activoSeleccionado.value,
      depreciacion_acumulada: periodo.depreciacion_acumulada,
      valor: periodo.valor_en_libros,
      updated_at: ahora()
    }
    const actualizacion = await peticionesFetchOffline('updateData', 'activos_fijos', JSON.stringify(activoActualizado))
    if (!respuestaExitosa(actualizacion)) {
      toast.add({ severity: 'warn', summary: 'Registro guardado', detail: 'La depreciación se guardó; el valor del activo se recalculará desde el historial.', life: 4000 })
    }
    await cargarDatos()
    toast.add({ severity: 'success', summary: 'Depreciación registrada', detail: periodo.periodo, life: 2800 })
  } catch (error) {
    console.error(error)
    await Swal.fire({ icon: 'error', title: 'No se registró', text: error.message })
  } finally { procesando.value = false }
}

function verAsiento(periodo) {
  const registro = depreciaciones.value.find((d) => String(d.activo_id) === String(activoSeleccionado.value.id) && d.periodo === periodo.periodo)
  asientoVisible.value = registro?.asiento_preparado
    ? parseJson(registro.asiento_preparado, {})
    : prepararAsientoDepreciacion(activoSeleccionado.value, periodo)
  modalAsiento.value = true
}

async function copiarAsiento() {
  try {
    await navigator.clipboard.writeText(JSON.stringify(asientoVisible.value, null, 2))
    toast.add({ severity: 'success', summary: 'Copiado', detail: 'Asiento copiado al portapapeles.', life: 2200 })
  } catch {
    toast.add({ severity: 'warn', summary: 'No se pudo copiar', detail: 'Seleccione el contenido manualmente.', life: 2500 })
  }
}

function abrirBaja() {
  formularioBaja.value = nuevaBaja()
  modalBaja.value = true
}

async function confirmarBaja() {
  if (!activoSeleccionado.value || procesando.value) return
  const datos = { ...formularioBaja.value, fecha: fechaIso(formularioBaja.value.fecha) }
  const validacion = validarBaja(activoSeleccionado.value, datos)
  if (!validacion.valido) {
    await Swal.fire({ icon: 'warning', title: 'Revise la información', html: validacion.errores.join('<br>') })
    return
  }
  const baja = prepararBaja(activoSeleccionado.value, resumenSeleccionado.value, datos)
  const confirmacion = await Swal.fire({
    icon: 'warning', title: baja.tipo === ESTADOS_ACTIVO.VENDIDO ? '¿Registrar venta del activo?' : '¿Dar de baja el activo?',
    html: `Valor en libros: <b>${moneda(baja.valor_en_libros)}</b><br>Resultado: <b>${moneda(baja.resultado)}</b>`,
    showCancelButton: true, confirmButtonText: 'Confirmar', cancelButtonText: 'Cancelar', confirmButtonColor: '#dc2626'
  })
  if (!confirmacion.isConfirmed) return

  procesando.value = true
  try {
    const historial = parseJson(activoSeleccionado.value.historial, [])
    historial.push({ accion: baja.tipo, fecha: ahora(), usuario: usuarioActual.value, ...baja })
    const payload = {
      ...activoSeleccionado.value, estado: baja.tipo, valor: 0, fecha_baja: baja.fecha,
      tipo_baja: baja.tipo, valor_venta: baja.valor_venta, motivo_baja: baja.motivo,
      resultado_baja: baja.resultado, asiento_baja: JSON.stringify(baja.asiento),
      historial: JSON.stringify(historial), updated_at: ahora()
    }
    const respuesta = await peticionesFetchOffline('updateData', 'activos_fijos', JSON.stringify(payload))
    if (!respuestaExitosa(respuesta)) throw new Error('No se pudo completar la baja del activo.')
    await cargarDatos()
    modalBaja.value = false
    toast.add({ severity: 'success', summary: baja.tipo === ESTADOS_ACTIVO.VENDIDO ? 'Venta registrada' : 'Activo dado de baja', detail: activoSeleccionado.value?.nombre || '', life: 3000 })
  } catch (error) {
    console.error(error)
    await Swal.fire({ icon: 'error', title: 'Operación no completada', text: error.message })
  } finally { procesando.value = false }
}
</script>

<template>
  <section class="assets-page">
    <header class="page-header">
      <div><span class="eyebrow">CONTABILIDAD</span><h1>Activos fijos y depreciación</h1><p>Controle altas, valor en libros, depreciaciones mensuales y bajas.</p></div>
      <Button label="Nuevo activo" icon="pi pi-plus" @click="abrirNuevoActivo" />
    </header>

    <div class="stats-grid">
      <article><i class="pi pi-building"></i><div><span>Activos en uso</span><strong>{{ dashboard.activos }}</strong><small>{{ dashboard.registrados }} registrados</small></div></article>
      <article><i class="pi pi-wallet"></i><div><span>Costo histórico</span><strong>{{ moneda(dashboard.costo) }}</strong></div></article>
      <article class="orange"><i class="pi pi-chart-line"></i><div><span>Depreciación acumulada</span><strong>{{ moneda(dashboard.depreciacion) }}</strong></div></article>
      <article class="green"><i class="pi pi-dollar"></i><div><span>Valor neto en libros</span><strong>{{ moneda(dashboard.valorLibros) }}</strong></div></article>
    </div>

    <div class="list-card">
      <div class="toolbar">
        <span class="search"><i class="pi pi-search"></i><InputText v-model="busqueda" placeholder="Buscar código, activo, ubicación o responsable" /></span>
        <Select v-model="filtroCategoria" :options="opcionesCategoria" optionLabel="label" optionValue="value" showClear placeholder="Todas las categorías" />
        <Select v-model="filtroEstado" :options="opcionesEstado" optionLabel="label" optionValue="value" showClear placeholder="Todos los estados" />
      </div>
      <DataTable :value="activosFiltrados" dataKey="id" paginator :rows="15" :rowsPerPageOptions="[15,30,50]" stripedRows :loading="cargando">
        <template #empty>No hay activos registrados.</template>
        <Column field="codigo" header="Código" sortable />
        <Column field="nombre" header="Activo" sortable style="min-width:15rem"><template #body="{ data }"><strong>{{ data.nombre }}</strong><small class="meta">{{ data.categoria }} · {{ data.ubicacion || 'Sin ubicación' }}</small></template></Column>
        <Column field="fecha_adquisicion" header="Adquisición" sortable />
        <Column header="Costo" sortable sortField="costo_adquisicion"><template #body="{ data }">{{ moneda(data.resumen.costo) }}</template></Column>
        <Column header="Dep. acumulada" sortable sortField="depreciacion_acumulada"><template #body="{ data }"><span class="orange-text">{{ moneda(data.resumen.depreciacionAcumulada) }}</span></template></Column>
        <Column header="Valor en libros" sortable sortField="valor"><template #body="{ data }"><strong class="green-text">{{ moneda(data.estado === 'ACTIVO' ? data.resumen.valorEnLibros : 0) }}</strong></template></Column>
        <Column field="responsable" header="Responsable"><template #body="{ data }">{{ data.responsable || '—' }}</template></Column>
        <Column field="estado" header="Estado"><template #body="{ data }"><Tag :value="data.estado" :severity="estadoSeverity(data.estado)" /></template></Column>
        <Column header="Acciones"><template #body="{ data }"><Button icon="pi pi-eye" label="Detalle" size="small" text @click="abrirDetalle(data)" /></template></Column>
      </DataTable>
    </div>

    <Dialog v-model:visible="modalActivo" modal header="Registrar activo fijo" :style="{ width: 'min(900px, 96vw)' }">
      <div class="form-grid">
        <div><label>Código *</label><InputText v-model="formulario.codigo" fluid /></div>
        <div class="span-2"><label>Nombre del activo *</label><InputText v-model="formulario.nombre" fluid /></div>
        <div><label>Categoría *</label><Select v-model="formulario.categoria" :options="opcionesCategoria" optionLabel="label" optionValue="value" editable fluid placeholder="Ej. Equipos" /></div>
        <div><label>Fecha de adquisición *</label><Calendar v-model="formulario.fecha_adquisicion" dateFormat="yy-mm-dd" showIcon fluid /></div>
        <div><label>Costo de adquisición *</label><InputNumber v-model="formulario.costo_adquisicion" mode="currency" currency="DOP" locale="es-DO" :min="0" fluid /></div>
        <div><label>Valor residual</label><InputNumber v-model="formulario.valor_residual" mode="currency" currency="DOP" locale="es-DO" :min="0" fluid /></div>
        <div><label>Vida útil (años) *</label><InputNumber v-model="formulario.vida_util_anios" :min="0.08" :maxFractionDigits="2" suffix=" años" fluid /></div>
        <div><label>Método</label><InputText modelValue="Línea recta" disabled fluid /></div>
        <div><label>Cuenta del activo</label><Select v-model="formulario.cuenta_contable" :options="opcionesCuenta" optionLabel="label" optionValue="value" filter showClear fluid /></div>
        <div><label>Cuenta gasto depreciación</label><Select v-model="formulario.cuenta_gasto_depreciacion" :options="opcionesCuenta" optionLabel="label" optionValue="value" filter showClear fluid /></div>
        <div><label>Depreciación acumulada</label><Select v-model="formulario.cuenta_depreciacion_acumulada" :options="opcionesCuenta" optionLabel="label" optionValue="value" filter showClear fluid /></div>
        <div><label>Ubicación</label><InputText v-model="formulario.ubicacion" fluid /></div>
        <div><label>Responsable</label><InputText v-model="formulario.responsable" fluid /></div>
        <div class="span-all"><label>Descripción</label><Textarea v-model="formulario.descripcion" rows="2" fluid /></div>
      </div>
      <template #footer><Button label="Cancelar" severity="secondary" text @click="modalActivo=false" /><Button label="Registrar activo" icon="pi pi-save" :loading="procesando" @click="guardarActivo" /></template>
    </Dialog>

    <Dialog v-model:visible="modalDetalle" modal :header="activoSeleccionado ? `${activoSeleccionado.codigo} · ${activoSeleccionado.nombre}` : 'Detalle'" :style="{ width: 'min(1120px, 97vw)' }">
      <template v-if="activoSeleccionado">
        <div class="detail-head">
          <div><small>COSTO</small><strong>{{ moneda(resumenSeleccionado.costo) }}</strong></div>
          <div><small>DEPRECIACIÓN ACUMULADA</small><strong>{{ moneda(resumenSeleccionado.depreciacionAcumulada) }}</strong></div>
          <div><small>VALOR EN LIBROS</small><strong>{{ moneda(resumenSeleccionado.valorEnLibros) }}</strong></div>
          <div><small>RESPONSABLE / UBICACIÓN</small><strong>{{ activoSeleccionado.responsable || 'Sin responsable' }} · {{ activoSeleccionado.ubicacion || 'Sin ubicación' }}</strong></div>
          <Tag :value="activoSeleccionado.estado" :severity="estadoSeverity(activoSeleccionado.estado)" />
        </div>
        <h3>Calendario mensual de depreciación</h3>
        <DataTable :value="calendarioSeleccionado" dataKey="periodo" paginator :rows="12" scrollable scrollHeight="440px" stripedRows>
          <Column field="numero" header="#" />
          <Column field="periodo" header="Período" />
          <Column field="fecha_aplicacion" header="Fecha límite" />
          <Column field="monto" header="Cuota"><template #body="{ data }">{{ moneda(data.monto) }}</template></Column>
          <Column field="depreciacion_acumulada" header="Acumulada"><template #body="{ data }">{{ moneda(data.depreciacion_acumulada) }}</template></Column>
          <Column field="valor_en_libros" header="Valor en libros"><template #body="{ data }"><strong>{{ moneda(data.valor_en_libros) }}</strong></template></Column>
          <Column field="estado" header="Estado"><template #body="{ data }"><Tag :value="data.estado" :severity="data.estado === 'REGISTRADA' ? 'success' : 'secondary'" /></template></Column>
          <Column header="Acción" style="min-width:12rem"><template #body="{ data }"><div class="row-actions"><Button v-if="data.estado !== 'REGISTRADA' && activoSeleccionado.estado === 'ACTIVO'" icon="pi pi-check" label="Registrar" size="small" :loading="procesando" @click="registrarDepreciacion(data)" /><Button icon="pi pi-file" v-tooltip.top="'Ver asiento preparado'" size="small" severity="secondary" text @click="verAsiento(data)" /></div></template></Column>
        </DataTable>
      </template>
      <template #footer><Button v-if="activoSeleccionado?.estado === 'ACTIVO'" label="Baja / Venta" icon="pi pi-sign-out" severity="danger" outlined @click="abrirBaja" /><Button label="Cerrar" severity="secondary" @click="modalDetalle=false" /></template>
    </Dialog>

    <Dialog v-model:visible="modalAsiento" modal header="Asiento contable preparado" :style="{ width: 'min(720px, 95vw)' }">
      <p class="dialog-note">Este asiento no ha sido publicado automáticamente en el libro diario.</p>
      <pre class="json-box">{{ JSON.stringify(asientoVisible, null, 2) }}</pre>
      <template #footer><Button label="Copiar JSON" icon="pi pi-copy" @click="copiarAsiento" /><Button label="Cerrar" severity="secondary" @click="modalAsiento=false" /></template>
    </Dialog>

    <Dialog v-model:visible="modalBaja" modal header="Baja o venta del activo" :style="{ width: 'min(650px, 95vw)' }">
      <div class="form-grid two">
        <div><label>Tipo *</label><Select v-model="formularioBaja.tipo" :options="[{label:'Baja',value:'BAJA'},{label:'Venta',value:'VENDIDO'}]" optionLabel="label" optionValue="value" fluid /></div>
        <div><label>Fecha *</label><Calendar v-model="formularioBaja.fecha" dateFormat="yy-mm-dd" showIcon fluid /></div>
        <div v-if="formularioBaja.tipo === 'VENDIDO'"><label>Valor de venta *</label><InputNumber v-model="formularioBaja.valor_venta" mode="currency" currency="DOP" locale="es-DO" :min="0" fluid /></div>
        <div v-if="formularioBaja.tipo === 'VENDIDO'"><label>Cuenta de cobro</label><Select v-model="formularioBaja.cuenta_cobro" :options="opcionesCuenta" optionLabel="label" optionValue="value" filter showClear fluid /></div>
        <div class="span-all"><label>Motivo *</label><Textarea v-model="formularioBaja.motivo" rows="3" fluid /></div>
      </div>
      <div class="disposal-summary"><span>Valor en libros <strong>{{ moneda(proyeccionBaja.valor_en_libros) }}</strong></span><span>Resultado estimado <strong :class="proyeccionBaja.resultado < 0 ? 'red-text' : 'green-text'">{{ moneda(proyeccionBaja.resultado) }}</strong></span></div>
      <template #footer><Button label="Cancelar" severity="secondary" text @click="modalBaja=false" /><Button label="Confirmar operación" icon="pi pi-check" severity="danger" :loading="procesando" @click="confirmarBaja" /></template>
    </Dialog>
  </section>
</template>

<style scoped>
.assets-page{min-height:100%;padding:1.5rem;background:#f5f7fb;color:#24324a}.page-header{display:flex;justify-content:space-between;align-items:center;gap:1rem;margin-bottom:1.25rem}.eyebrow{font-size:.72rem;font-weight:800;letter-spacing:.08em;color:#2563eb}.page-header h1{margin:.2rem 0;font-size:1.75rem}.page-header p{margin:0;color:#64748b}.stats-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:1rem;margin-bottom:1rem}.stats-grid article,.list-card{background:#fff;border:1px solid #e2e8f0;border-radius:14px;box-shadow:0 3px 12px rgba(15,23,42,.06)}.stats-grid article{padding:1rem;display:flex;align-items:center;gap:.8rem}.stats-grid i{width:42px;height:42px;display:grid;place-items:center;border-radius:11px;background:#eff6ff;color:#2563eb;font-size:1.1rem}.stats-grid .orange i{background:#fff7ed;color:#ea580c}.stats-grid .green i{background:#f0fdf4;color:#16a34a}.stats-grid article div{display:flex;flex-direction:column}.stats-grid span,.stats-grid small{font-size:.76rem;color:#64748b}.stats-grid strong{font-size:1.12rem}.list-card{overflow:hidden}.toolbar{display:grid;grid-template-columns:1fr 230px 200px;gap:.75rem;padding:1rem;border-bottom:1px solid #e2e8f0}.search{position:relative;display:flex;align-items:center}.search i{position:absolute;left:.8rem;color:#94a3b8;z-index:1}.search input{width:100%;padding-left:2.4rem}.meta{display:block;color:#64748b;margin-top:.2rem}.orange-text{color:#ea580c;font-weight:600}.green-text{color:#15803d}.red-text{color:#dc2626}.form-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:1rem}.form-grid.two{grid-template-columns:repeat(2,1fr)}.form-grid label{display:block;font-size:.78rem;font-weight:700;margin-bottom:.35rem}.span-2{grid-column:span 2}.span-all{grid-column:1/-1}.detail-head{display:grid;grid-template-columns:repeat(4,1fr) auto;gap:1rem;align-items:center;padding:1rem;background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;margin-bottom:1rem}.detail-head div{display:flex;flex-direction:column}.detail-head small{font-size:.65rem;color:#64748b;font-weight:700}.detail-head strong{font-size:.93rem}.row-actions{display:flex;align-items:center;gap:.3rem}.dialog-note{padding:.75rem;background:#fff7ed;color:#9a3412;border-radius:8px}.json-box{max-height:420px;overflow:auto;background:#0f172a;color:#dbeafe;padding:1rem;border-radius:10px;font-size:.78rem}.disposal-summary{display:flex;justify-content:space-between;gap:1rem;margin-top:1rem;padding:1rem;background:#f8fafc;border-radius:10px}.disposal-summary span{display:flex;flex-direction:column;color:#64748b}.disposal-summary strong{font-size:1.15rem}@media(max-width:1000px){.stats-grid{grid-template-columns:repeat(2,1fr)}.toolbar{grid-template-columns:1fr 1fr}.search{grid-column:1/-1}.detail-head{grid-template-columns:repeat(2,1fr)}.form-grid{grid-template-columns:repeat(2,1fr)}}@media(max-width:600px){.assets-page{padding:.8rem}.page-header{align-items:flex-start;flex-direction:column}.stats-grid,.form-grid,.form-grid.two,.toolbar,.detail-head{grid-template-columns:1fr}.span-2{grid-column:auto}.disposal-summary{flex-direction:column}}
</style>
