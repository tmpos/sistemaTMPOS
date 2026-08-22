<script setup>
import { computed, onMounted, ref } from 'vue'
import Button from 'primevue/button'
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
import {
  crearTablaSiNoExisteOffline,
  nfecha,
  peticionesFetchOffline
} from '@/funciones/funciones.js'
import { useDatosEmpresa } from '@/stores'
import {
  ESTADOS_CONTEO,
  crearAjustes,
  crearLineasConteo,
  detectarCambiosConcurrentes,
  recalcularLinea,
  recalcularLineas,
  resumenConteo,
  validarConteoParaFinalizar
} from './conteoFisicoCore.js'

const toast = useToast()
const datosEmpresa = useDatosEmpresa()

const CAMPOS_CONTEOS = [
  'codigo', 'almacen', 'fecha', 'hora', 'estado', 'observacion', 'productos',
  'total_productos', 'total_contados', 'total_diferencias', 'valor_ajuste',
  'usuario', 'finalizado_en', 'created_at', 'updated_at'
]
const CAMPOS_AJUSTES = [
  'conteo_id', 'conteo_codigo', 'producto_id', 'codigo_producto', 'producto',
  'almacen', 'stock_anterior', 'cantidad_contada', 'diferencia', 'costo_unitario',
  'valor_ajuste', 'motivo', 'estado', 'usuario', 'fecha', 'hora', 'created_at', 'updated_at'
]

const productos = ref([])
const almacenes = ref([])
const sesiones = ref([])
const almacenSeleccionado = ref(null)
const sesion = ref(null)
const busqueda = ref('')
const observacion = ref('')
const cargando = ref(false)
const procesando = ref(false)
const historialVisible = ref(false)
const usuarioLocal = ref({})

const usuarioActual = computed(() =>
  usuarioLocal.value?.nombre ||
  usuarioLocal.value?.usuario ||
  datosEmpresa.usuario?.nombre ||
  'Sistema'
)

const resumen = computed(() => resumenConteo(sesion.value?.lineas || []))
const esFinalizada = computed(() => sesion.value?.estado === ESTADOS_CONTEO.FINALIZADO)
const lineasFiltradas = computed(() => {
  const consulta = busqueda.value.trim().toLowerCase()
  if (!consulta) return sesion.value?.lineas || []
  return (sesion.value?.lineas || []).filter((linea) =>
    [linea.codigo, linea.nombre, linea.categoria, linea.ubicacion]
      .some((valor) => String(valor || '').toLowerCase().includes(consulta))
  )
})

const respuestaExitosa = (respuesta) => {
  if (respuesta === true || respuesta === 'ok') return true
  if (Array.isArray(respuesta)) return respuesta[0] === 'ok' || respuesta[0] === true
  if (respuesta && typeof respuesta === 'object') {
    return respuesta.success !== false && respuesta.error === undefined
  }
  return false
}

const parsearJson = (valor, fallback = []) => {
  if (Array.isArray(valor)) return valor
  if (!valor) return fallback
  try {
    const resultado = JSON.parse(valor)
    return Array.isArray(resultado) ? resultado : fallback
  } catch {
    return fallback
  }
}

const ahoraIso = () => new Date().toISOString()
const codigoConteo = () => {
  const fecha = new Date()
  const partes = [
    fecha.getFullYear(),
    String(fecha.getMonth() + 1).padStart(2, '0'),
    String(fecha.getDate()).padStart(2, '0'),
    String(fecha.getHours()).padStart(2, '0'),
    String(fecha.getMinutes()).padStart(2, '0'),
    String(fecha.getSeconds()).padStart(2, '0')
  ]
  return `CF-${partes.join('')}`
}

onMounted(async () => {
  try {
    usuarioLocal.value = JSON.parse(window.localStorage.getItem('usuarioLocal') || '[]')?.[0] || {}
  } catch {
    usuarioLocal.value = {}
  }
  await inicializar()
})

async function inicializar() {
  cargando.value = true
  try {
    await Promise.all([
      crearTablaSiNoExisteOffline('conteos_fisicos', CAMPOS_CONTEOS, toast),
      crearTablaSiNoExisteOffline('ajustes_inventario', CAMPOS_AJUSTES, toast)
    ])
    await Promise.all([cargarCatalogos(), cargarSesiones()])
  } catch (error) {
    console.error('Error inicializando conteo físico:', error)
    toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo cargar el módulo de conteo.', life: 3500 })
  } finally {
    cargando.value = false
  }
}

async function cargarCatalogos() {
  const [productosRespuesta, empresasRespuesta] = await Promise.all([
    peticionesFetchOffline('getDataAsArray', 'productos'),
    peticionesFetchOffline('getDataAsArray', 'empresa')
  ])
  productos.value = Array.isArray(productosRespuesta) ? productosRespuesta : []
  const nombres = [
    ...productos.value.map((producto) => producto.almacen),
    ...(Array.isArray(empresasRespuesta) ? empresasRespuesta.map((empresa) => empresa.nombre) : [])
  ].filter(Boolean)
  almacenes.value = [...new Set(nombres.map((nombre) => String(nombre).trim()))]
    .sort((a, b) => a.localeCompare(b, 'es'))
    .map((nombre) => ({ label: nombre, value: nombre }))

  if (!almacenSeleccionado.value) {
    const actual = datosEmpresa.empresa?.nombre
    almacenSeleccionado.value = nombres.includes(actual) ? actual : almacenes.value[0]?.value || null
  }
}

async function cargarSesiones() {
  const respuesta = await peticionesFetchOffline('getDataAsArray', 'conteos_fisicos')
  sesiones.value = (Array.isArray(respuesta) ? respuesta : [])
    .map((registro) => ({ ...registro, lineas: recalcularLineas(parsearJson(registro.productos)) }))
    .sort((a, b) => Number(b.id || 0) - Number(a.id || 0))
}

function crearSesion() {
  if (!almacenSeleccionado.value) {
    toast.add({ severity: 'warn', summary: 'Almacén requerido', detail: 'Seleccione un almacén.', life: 2500 })
    return
  }
  const lineas = crearLineasConteo(productos.value, almacenSeleccionado.value)
  if (!lineas.length) {
    toast.add({ severity: 'warn', summary: 'Sin productos', detail: 'El almacén no tiene productos registrados.', life: 3000 })
    return
  }
  sesion.value = {
    id: null,
    codigo: codigoConteo(),
    almacen: almacenSeleccionado.value,
    fecha: nfecha('fecha'),
    hora: nfecha('hora'),
    estado: ESTADOS_CONTEO.BORRADOR,
    lineas
  }
  observacion.value = ''
  busqueda.value = ''
}

function actualizarCantidad(linea, valor) {
  Object.assign(linea, recalcularLinea(linea, valor))
}

function copiarStockSistema() {
  if (!sesion.value || esFinalizada.value) return
  sesion.value.lineas = sesion.value.lineas.map((linea) => recalcularLinea(linea, linea.stock_sistema))
}

function limpiarCantidades() {
  if (!sesion.value || esFinalizada.value) return
  sesion.value.lineas = sesion.value.lineas.map((linea) => recalcularLinea(linea, null))
}

function payloadSesion(estado = sesion.value?.estado || ESTADOS_CONTEO.BORRADOR) {
  const datosResumen = resumenConteo(sesion.value?.lineas || [])
  return {
    ...(sesion.value?.id ? { id: sesion.value.id } : {}),
    codigo: sesion.value.codigo,
    almacen: sesion.value.almacen,
    fecha: sesion.value.fecha,
    hora: sesion.value.hora,
    estado,
    observacion: observacion.value || '',
    productos: JSON.stringify(recalcularLineas(sesion.value.lineas)),
    total_productos: datosResumen.productos,
    total_contados: datosResumen.contados,
    total_diferencias: datosResumen.conDiferencia,
    valor_ajuste: datosResumen.valorAjuste,
    usuario: usuarioActual.value,
    finalizado_en: estado === ESTADOS_CONTEO.FINALIZADO ? ahoraIso() : '',
    updated_at: ahoraIso(),
    ...(!sesion.value?.id ? { created_at: ahoraIso() } : {})
  }
}

async function persistirSesion(estado = ESTADOS_CONTEO.BORRADOR, mostrarMensaje = true) {
  if (!sesion.value) return false
  const payload = payloadSesion(estado)
  const operacion = sesion.value.id ? 'updateData' : 'insertData'
  const respuesta = await peticionesFetchOffline(operacion, 'conteos_fisicos', JSON.stringify(payload))
  if (!respuestaExitosa(respuesta)) throw new Error('No se pudo guardar la sesión de conteo.')

  if (!sesion.value.id) {
    const registros = await peticionesFetchOffline('getDataByField', 'conteos_fisicos', 'codigo', sesion.value.codigo)
    const registro = Array.isArray(registros) ? registros[registros.length - 1] : null
    if (registro?.id) sesion.value.id = registro.id
  }
  sesion.value.estado = estado
  await cargarSesiones()
  if (mostrarMensaje) {
    toast.add({ severity: 'success', summary: 'Borrador guardado', detail: `Conteo ${sesion.value.codigo}`, life: 2500 })
  }
  return true
}

async function guardarBorrador() {
  if (esFinalizada.value || procesando.value) return
  procesando.value = true
  try {
    await persistirSesion(ESTADOS_CONTEO.BORRADOR)
  } catch (error) {
    console.error(error)
    toast.add({ severity: 'error', summary: 'Error', detail: error.message, life: 3500 })
  } finally {
    procesando.value = false
  }
}

async function finalizarConteo() {
  if (!sesion.value || procesando.value) return
  const validacion = validarConteoParaFinalizar(sesion.value)
  if (!validacion.valido) {
    await Swal.fire({ icon: 'warning', title: 'Conteo incompleto', html: validacion.errores.join('<br>') })
    return
  }

  const confirmacion = await Swal.fire({
    icon: 'warning',
    title: '¿Finalizar y ajustar inventario?',
    html: `Se modificarán <b>${resumen.value.conDiferencia}</b> producto(s). Esta acción quedará auditada y no podrá editarse.`,
    showCancelButton: true,
    confirmButtonText: 'Sí, finalizar',
    cancelButtonText: 'Cancelar',
    confirmButtonColor: '#16a34a'
  })
  if (!confirmacion.isConfirmed) return

  procesando.value = true
  const modificados = []
  try {
    await persistirSesion(ESTADOS_CONTEO.BORRADOR, false)
    const productosActuales = await peticionesFetchOffline('getDataAsArray', 'productos')
    const conflictos = detectarCambiosConcurrentes(sesion.value.lineas, productosActuales)
    if (conflictos.length) {
      const nombres = conflictos.slice(0, 5).map((linea) => linea.nombre).join(', ')
      throw new Error(`El stock cambió durante el conteo (${nombres}). Recargue la sesión antes de finalizar.`)
    }

    await persistirSesion(ESTADOS_CONTEO.EN_PROCESO, false)
    const actualesPorId = new Map(productosActuales.map((producto) => [String(producto.id), producto]))
    const ajustes = crearAjustes(sesion.value.lineas, {
      conteo_id: sesion.value.id,
      conteo_codigo: sesion.value.codigo,
      usuario: usuarioActual.value,
      fecha: nfecha('fecha'),
      hora: nfecha('hora'),
      estado: 'APLICADO'
    })

    for (const ajuste of ajustes) {
      const lecturaInmediata = await peticionesFetchOffline(
        'getDataByField',
        'productos',
        'id',
        ajuste.producto_id
      )
      const producto = Array.isArray(lecturaInmediata)
        ? lecturaInmediata[0]
        : actualesPorId.get(String(ajuste.producto_id))
      if (!producto || Number(producto.stock || 0) !== Number(ajuste.stock_anterior || 0)) {
        throw new Error(`El stock de ${ajuste.producto} cambió mientras se aplicaba el conteo.`)
      }
      const actualizado = { ...producto, stock: ajuste.cantidad_contada, updated_at: ahoraIso() }
      const respuesta = await peticionesFetchOffline('updateData', 'productos', JSON.stringify(actualizado))
      if (!respuestaExitosa(respuesta)) throw new Error(`No se pudo actualizar ${ajuste.producto}.`)
      modificados.push(producto)
    }

    for (const ajuste of ajustes) {
      const auditoria = { ...ajuste, created_at: ahoraIso(), updated_at: ahoraIso() }
      const respuesta = await peticionesFetchOffline('insertData', 'ajustes_inventario', JSON.stringify(auditoria))
      if (!respuestaExitosa(respuesta)) throw new Error(`No se pudo registrar la auditoría de ${ajuste.producto}.`)
    }

    await persistirSesion(ESTADOS_CONTEO.FINALIZADO, false)
    await cargarCatalogos()
    await Swal.fire({
      icon: 'success',
      title: 'Conteo finalizado',
      text: `${ajustes.length} ajuste(s) fueron aplicados y auditados.`
    })
  } catch (error) {
    console.error('Error finalizando conteo:', error)
    for (const productoAnterior of [...modificados].reverse()) {
      try {
        await peticionesFetchOffline('updateData', 'productos', JSON.stringify(productoAnterior))
      } catch (rollbackError) {
        console.error('Error restaurando producto:', productoAnterior.id, rollbackError)
      }
    }
    if (sesion.value?.estado === ESTADOS_CONTEO.EN_PROCESO) {
      try { await persistirSesion(ESTADOS_CONTEO.BORRADOR, false) } catch (e) { console.error(e) }
    }
    await Swal.fire({ icon: 'error', title: 'No se aplicó el conteo', text: error.message })
  } finally {
    procesando.value = false
  }
}

function abrirSesion(registro) {
  sesion.value = {
    id: registro.id,
    codigo: registro.codigo,
    almacen: registro.almacen,
    fecha: registro.fecha,
    hora: registro.hora,
    estado: registro.estado || ESTADOS_CONTEO.BORRADOR,
    lineas: recalcularLineas(registro.lineas || parsearJson(registro.productos))
  }
  almacenSeleccionado.value = registro.almacen
  observacion.value = registro.observacion || ''
  busqueda.value = ''
  historialVisible.value = false
}

function nuevaSesion() {
  if (sesion.value && !esFinalizada.value && resumen.value.contados > 0) {
    Swal.fire({
      icon: 'question', title: '¿Descartar la vista actual?',
      text: 'Guarde el borrador antes de iniciar otro conteo.', showCancelButton: true,
      confirmButtonText: 'Continuar', cancelButtonText: 'Cancelar'
    }).then((resultado) => { if (resultado.isConfirmed) sesion.value = null })
    return
  }
  sesion.value = null
}

const moneda = (valor) => new Intl.NumberFormat('es-DO', {
  style: 'currency', currency: 'DOP', minimumFractionDigits: 2
}).format(Number(valor) || 0)

const severidadEstado = (estado) => ({
  FINALIZADO: 'success', EN_PROCESO: 'warn', BORRADOR: 'secondary'
}[estado] || 'info')
</script>

<template>
  <section class="conteo-page">
    <header class="page-header">
      <div>
        <span class="eyebrow">INVENTARIO</span>
        <h1>Conteo físico y ajustes</h1>
        <p>Compare las existencias reales con el sistema y conserve la trazabilidad de cada ajuste.</p>
      </div>
      <div class="header-actions">
        <Button label="Historial" icon="pi pi-history" severity="secondary" outlined @click="historialVisible = true" />
        <Button v-if="sesion" label="Nuevo conteo" icon="pi pi-plus" @click="nuevaSesion" />
      </div>
    </header>

    <div v-if="!sesion" class="start-card">
      <div class="start-icon"><i class="pi pi-clipboard"></i></div>
      <div>
        <h2>Iniciar una sesión de conteo</h2>
        <p>El stock queda congelado como referencia. Al finalizar se validará que nadie lo haya modificado.</p>
      </div>
      <Select v-model="almacenSeleccionado" :options="almacenes" optionLabel="label" optionValue="value"
        placeholder="Seleccione un almacén" class="warehouse-select" :loading="cargando" />
      <Button label="Cargar productos" icon="pi pi-box" :disabled="!almacenSeleccionado || cargando" @click="crearSesion" />
    </div>

    <template v-else>
      <div class="session-bar">
        <div><small>SESIÓN</small><strong>{{ sesion.codigo }}</strong></div>
        <div><small>ALMACÉN</small><strong>{{ sesion.almacen }}</strong></div>
        <div><small>FECHA</small><strong>{{ sesion.fecha }} {{ sesion.hora }}</strong></div>
        <Tag :value="sesion.estado" :severity="severidadEstado(sesion.estado)" />
      </div>

      <div class="summary-grid">
        <article><i class="pi pi-box"></i><div><span>Productos</span><strong>{{ resumen.productos }}</strong></div></article>
        <article><i class="pi pi-check-circle"></i><div><span>Contados</span><strong>{{ resumen.contados }} / {{ resumen.productos }}</strong></div></article>
        <article :class="{ warning: resumen.conDiferencia }"><i class="pi pi-exclamation-triangle"></i><div><span>Con diferencia</span><strong>{{ resumen.conDiferencia }}</strong></div></article>
        <article :class="resumen.valorAjuste < 0 ? 'danger' : 'success'"><i class="pi pi-dollar"></i><div><span>Valor del ajuste</span><strong>{{ moneda(resumen.valorAjuste) }}</strong></div></article>
      </div>

      <div class="work-card">
        <div class="toolbar">
          <span class="search-box"><i class="pi pi-search"></i><InputText v-model="busqueda" placeholder="Buscar código, producto o ubicación" /></span>
          <div class="toolbar-actions">
            <Button label="Copiar stock" icon="pi pi-copy" severity="secondary" outlined :disabled="esFinalizada" @click="copiarStockSistema" />
            <Button label="Limpiar" icon="pi pi-eraser" severity="secondary" text :disabled="esFinalizada" @click="limpiarCantidades" />
          </div>
        </div>

        <DataTable :value="lineasFiltradas" dataKey="producto_id" paginator :rows="15" :rowsPerPageOptions="[15, 30, 50]"
          stripedRows scrollable scrollHeight="520px" :loading="cargando" class="count-table">
          <template #empty>No hay productos para mostrar.</template>
          <Column field="codigo" header="Código" style="min-width: 9rem" />
          <Column field="nombre" header="Producto" sortable style="min-width: 16rem">
            <template #body="{ data }"><strong>{{ data.nombre }}</strong><small class="product-meta">{{ data.categoria || 'Sin categoría' }} · {{ data.ubicacion || 'Sin ubicación' }}</small></template>
          </Column>
          <Column field="stock_sistema" header="Stock sistema" sortable style="min-width: 8rem"><template #body="{ data }"><span class="number-system">{{ data.stock_sistema }}</span></template></Column>
          <Column field="cantidad_contada" header="Cantidad contada" style="min-width: 11rem">
            <template #body="{ data }"><InputNumber :modelValue="data.cantidad_contada" :min="0" :maxFractionDigits="3" fluid :disabled="esFinalizada" placeholder="0" @update:modelValue="actualizarCantidad(data, $event)" /></template>
          </Column>
          <Column field="diferencia" header="Diferencia" sortable style="min-width: 8rem">
            <template #body="{ data }"><Tag :value="data.diferencia > 0 ? `+${data.diferencia}` : String(data.diferencia)" :severity="data.diferencia === 0 ? 'secondary' : data.diferencia > 0 ? 'success' : 'danger'" /></template>
          </Column>
          <Column field="costo_unitario" header="Costo" style="min-width: 8rem"><template #body="{ data }">{{ moneda(data.costo_unitario) }}</template></Column>
          <Column field="valor_ajuste" header="Valor ajuste" sortable style="min-width: 9rem"><template #body="{ data }"><span :class="data.valor_ajuste < 0 ? 'text-negative' : data.valor_ajuste > 0 ? 'text-positive' : ''">{{ moneda(data.valor_ajuste) }}</span></template></Column>
        </DataTable>

        <div class="footer-form">
          <div><label>Observación del conteo</label><Textarea v-model="observacion" rows="2" autoResize :disabled="esFinalizada" placeholder="Motivo, responsables o notas del conteo..." /></div>
          <div class="final-actions">
            <Button v-if="!esFinalizada" label="Guardar borrador" icon="pi pi-save" severity="secondary" outlined :loading="procesando" @click="guardarBorrador" />
            <Button v-if="!esFinalizada" label="Finalizar y ajustar" icon="pi pi-check" severity="success" :loading="procesando" :disabled="resumen.contados !== resumen.productos" @click="finalizarConteo" />
            <Tag v-else value="Inventario ajustado y auditado" severity="success" icon="pi pi-lock" />
          </div>
        </div>
      </div>
    </template>

    <Dialog v-model:visible="historialVisible" modal header="Historial de conteos físicos" :style="{ width: 'min(1050px, 95vw)' }">
      <DataTable :value="sesiones" paginator :rows="10" dataKey="id" stripedRows>
        <template #empty>No hay sesiones registradas.</template>
        <Column field="codigo" header="Código" sortable />
        <Column field="fecha" header="Fecha" sortable><template #body="{ data }">{{ data.fecha }} {{ data.hora }}</template></Column>
        <Column field="almacen" header="Almacén" sortable />
        <Column field="total_contados" header="Contados"><template #body="{ data }">{{ data.total_contados || 0 }} / {{ data.total_productos || 0 }}</template></Column>
        <Column field="total_diferencias" header="Diferencias" />
        <Column field="valor_ajuste" header="Valor"><template #body="{ data }">{{ moneda(data.valor_ajuste) }}</template></Column>
        <Column field="estado" header="Estado"><template #body="{ data }"><Tag :value="data.estado" :severity="severidadEstado(data.estado)" /></template></Column>
        <Column header="Acción"><template #body="{ data }"><Button :label="data.estado === 'FINALIZADO' ? 'Ver' : 'Continuar'" :icon="data.estado === 'FINALIZADO' ? 'pi pi-eye' : 'pi pi-pencil'" size="small" text @click="abrirSesion(data)" /></template></Column>
      </DataTable>
    </Dialog>
  </section>
</template>

<style scoped>
.conteo-page{padding:1.5rem;min-height:100%;background:#f5f7fb;color:#24324a}.page-header{display:flex;align-items:center;justify-content:space-between;gap:1rem;margin-bottom:1.25rem}.eyebrow{color:#2563eb;font-size:.75rem;font-weight:700;letter-spacing:.08em}.page-header h1{font-size:1.75rem;margin:.2rem 0}.page-header p{margin:0;color:#64748b}.header-actions,.toolbar-actions,.final-actions{display:flex;gap:.65rem;align-items:center;flex-wrap:wrap}.start-card,.work-card,.session-bar,.summary-grid article{background:#fff;border:1px solid #e2e8f0;border-radius:14px;box-shadow:0 3px 12px rgba(15,23,42,.06)}.start-card{min-height:220px;padding:2rem;display:grid;grid-template-columns:auto 1fr minmax(240px,340px) auto;gap:1.25rem;align-items:center}.start-icon{width:64px;height:64px;border-radius:16px;background:#eff6ff;color:#2563eb;display:grid;place-items:center;font-size:1.7rem}.start-card h2{margin:0 0 .4rem}.start-card p{margin:0;color:#64748b}.warehouse-select{width:100%}.session-bar{padding:1rem 1.25rem;display:flex;align-items:center;gap:2.5rem;margin-bottom:1rem}.session-bar div{display:flex;flex-direction:column;gap:.15rem}.session-bar small{font-size:.68rem;color:#64748b;font-weight:700}.session-bar .p-tag{margin-left:auto}.summary-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:1rem;margin-bottom:1rem}.summary-grid article{padding:1rem 1.15rem;display:flex;align-items:center;gap:.8rem}.summary-grid article>i{width:38px;height:38px;border-radius:10px;background:#eff6ff;color:#2563eb;display:grid;place-items:center}.summary-grid article div{display:flex;flex-direction:column}.summary-grid span{font-size:.78rem;color:#64748b}.summary-grid strong{font-size:1.25rem}.summary-grid .warning>i{background:#fff7ed;color:#ea580c}.summary-grid .success>i{background:#f0fdf4;color:#16a34a}.summary-grid .danger>i{background:#fef2f2;color:#dc2626}.work-card{overflow:hidden}.toolbar{padding:1rem;display:flex;justify-content:space-between;align-items:center;gap:1rem;border-bottom:1px solid #e2e8f0}.search-box{position:relative;display:flex;align-items:center;width:min(480px,100%)}.search-box>i{position:absolute;left:.8rem;color:#94a3b8;z-index:1}.search-box .p-inputtext{width:100%;padding-left:2.4rem}.product-meta{display:block;color:#64748b;margin-top:.2rem}.number-system{font-size:1.05rem;font-weight:700}.text-negative{color:#dc2626;font-weight:700}.text-positive{color:#16a34a;font-weight:700}.footer-form{border-top:1px solid #e2e8f0;padding:1rem;display:grid;grid-template-columns:1fr auto;gap:1rem;align-items:end}.footer-form label{display:block;font-size:.8rem;font-weight:700;margin-bottom:.35rem}.footer-form textarea{width:100%}.count-table :deep(.p-datatable-thead>tr>th){background:#f8fafc;color:#475569;font-size:.78rem;text-transform:uppercase}.count-table :deep(.p-inputnumber-input){text-align:center;font-weight:700}.count-table :deep(.p-datatable-tbody>tr){transition:background .15s}.count-table :deep(.p-datatable-tbody>tr:hover){background:#f8fafc}@media(max-width:900px){.start-card{grid-template-columns:auto 1fr}.warehouse-select,.start-card>.p-button{grid-column:1/-1}.summary-grid{grid-template-columns:repeat(2,1fr)}.session-bar{flex-wrap:wrap;gap:1rem}.session-bar .p-tag{margin-left:0}.footer-form{grid-template-columns:1fr}.page-header{align-items:flex-start;flex-direction:column}}@media(max-width:560px){.conteo-page{padding:.8rem}.summary-grid{grid-template-columns:1fr}.toolbar{align-items:stretch;flex-direction:column}.header-actions,.final-actions{width:100%}.header-actions .p-button,.final-actions .p-button{flex:1}}
</style>
