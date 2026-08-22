<script setup>
import { computed, onMounted, ref } from 'vue'
import { useToast } from 'primevue/usetoast'
import { peticionesFetchOffline } from '../../funciones/funciones.js'
import { construirMovimientos, filtrarMovimientos, resumirMovimientos } from './kardexCore.js'

const toast = useToast()
const cargando = ref(false)
const movimientos = ref([])
const detalle = ref(null)
const mostrarDetalle = ref(false)
const preset = ref('mes')
const fechaDesde = ref('')
const fechaHasta = ref('')
const producto = ref('')
const almacen = ref('')
const tipo = ref('')
const buscar = ref('')

const presets = [
  { label: 'Hoy', value: 'hoy', icon: 'pi pi-calendar' },
  { label: 'Ayer', value: 'ayer', icon: 'pi pi-history' },
  { label: 'Esta semana', value: 'semana', icon: 'pi pi-calendar-times' },
  { label: 'Este mes', value: 'mes', icon: 'pi pi-calendar-plus' },
  { label: 'Personalizado', value: 'personalizado', icon: 'pi pi-sliders-h' },
  { label: 'Todo', value: 'todo', icon: 'pi pi-list' }
]

const opcionesProducto = computed(() => {
  const mapa = new Map()
  movimientos.value.forEach((mov) => mapa.set(mov.clave, {
    label: `${mov.codigo ? `${mov.codigo} · ` : ''}${mov.producto} · ${mov.almacen}`,
    value: mov.clave
  }))
  return [...mapa.values()].sort((a, b) => a.label.localeCompare(b.label))
})
const opcionesAlmacen = computed(() => [...new Set(movimientos.value.map((mov) => mov.almacen).filter(Boolean))].sort())
const filtrados = computed(() => filtrarMovimientos(movimientos.value, {
  preset: preset.value, desde: fechaDesde.value, hasta: fechaHasta.value,
  producto: producto.value, almacen: almacen.value, tipo: tipo.value, buscar: buscar.value
}))
const resumen = computed(() => resumirMovimientos(filtrados.value))

const obtenerTabla = async (tabla) => {
  try {
    const resultado = await peticionesFetchOffline('getDataAsArray', tabla, '')
    return Array.isArray(resultado) ? resultado : []
  } catch (error) {
    console.warn(`[Kardex] No se pudo leer ${tabla}:`, error)
    return []
  }
}

const cargar = async () => {
  cargando.value = true
  try {
    const [productos, facturas, compras, danados, usoInterno] = await Promise.all([
      obtenerTabla('productos'), obtenerTabla('facturas'), obtenerTabla('compras'),
      obtenerTabla('productos_danados'), obtenerTabla('productos_uso_interno')
    ])
    movimientos.value = construirMovimientos({ productos, facturas, compras, danados, usoInterno })
  } catch (error) {
    console.error('[Kardex] Error al construir movimientos:', error)
    toast.add({ severity: 'error', summary: 'No se pudo cargar el Kardex', detail: error.message, life: 4500 })
  } finally {
    cargando.value = false
  }
}

const abrirDetalle = (movimiento) => {
  detalle.value = movimiento
  mostrarDetalle.value = true
}
const limpiar = () => {
  preset.value = 'mes'; fechaDesde.value = ''; fechaHasta.value = ''
  producto.value = ''; almacen.value = ''; tipo.value = ''; buscar.value = ''
}
const cantidad = (valor) => new Intl.NumberFormat('es-DO', { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(Number(valor) || 0)
const fecha = (valor) => {
  if (!valor) return '—'
  const [year, month, day] = valor.split('-')
  return `${day}/${month}/${year}`
}

onMounted(cargar)
</script>

<template>
  <main class="kardex-page">
    <Toast />
    <section class="hero">
      <div>
        <span class="eyebrow">INVENTARIO</span>
        <h1>Kardex de inventario</h1>
        <p>Trazabilidad de cada entrada y salida, desde el documento de origen hasta la existencia resultante.</p>
      </div>
      <Button label="Actualizar" icon="pi pi-refresh" outlined :loading="cargando" @click="cargar" />
    </section>

    <section class="filter-panel">
      <div class="quick-dates" aria-label="Filtros rápidos de fecha">
        <Button v-for="opcion in presets" :key="opcion.value" :label="opcion.label" :icon="opcion.icon"
          size="small" :outlined="preset !== opcion.value" @click="preset = opcion.value" />
      </div>
      <div v-if="preset === 'personalizado'" class="custom-range">
        <label>Desde<InputText v-model="fechaDesde" type="date" /></label>
        <label>Hasta<InputText v-model="fechaHasta" type="date" /></label>
      </div>
      <div class="filter-grid">
        <IconField><InputIcon class="pi pi-search" /><InputText v-model="buscar" placeholder="Producto, código, documento, usuario..." /></IconField>
        <Dropdown v-model="producto" :options="opcionesProducto" optionLabel="label" optionValue="value" placeholder="Todos los productos" filter showClear />
        <Dropdown v-model="almacen" :options="opcionesAlmacen" placeholder="Todos los almacenes" showClear />
        <Dropdown v-model="tipo" :options="[{label:'Entradas',value:'ENTRADA'},{label:'Salidas',value:'SALIDA'}]" optionLabel="label" optionValue="value" placeholder="Entradas y salidas" showClear />
        <Button label="Limpiar" icon="pi pi-filter-slash" severity="secondary" text @click="limpiar" />
      </div>
    </section>

    <section class="summary-grid">
      <article class="summary-card neutral"><i class="pi pi-box" /><div><span>Saldo anterior</span><strong>{{ cantidad(resumen.saldoAnterior) }}</strong></div></article>
      <article class="summary-card entry"><i class="pi pi-arrow-down-left" /><div><span>Entradas</span><strong>+{{ cantidad(resumen.entradas) }}</strong></div></article>
      <article class="summary-card exit"><i class="pi pi-arrow-up-right" /><div><span>Salidas</span><strong>-{{ cantidad(resumen.salidas) }}</strong></div></article>
      <article class="summary-card balance"><i class="pi pi-chart-line" /><div><span>Existencia resultante</span><strong>{{ cantidad(resumen.existencia) }}</strong></div></article>
      <article class="summary-card movement"><i class="pi pi-list" /><div><span>Movimientos</span><strong>{{ resumen.movimientos }}</strong><small>{{ resumen.productos }} producto(s)</small></div></article>
    </section>

    <section class="table-card">
      <DataTable :value="filtrados" :loading="cargando" paginator :rows="20" :rowsPerPageOptions="[10,20,50,100]"
        stripedRows removableSort dataKey="id" responsiveLayout="scroll" sortField="fechaValor" :sortOrder="-1"
        paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink RowsPerPageDropdown CurrentPageReport"
        currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords}">
        <template #empty><div class="empty"><i class="pi pi-inbox" /><strong>Sin movimientos</strong><span>No hay datos que coincidan con los filtros.</span></div></template>
        <Column field="fechaValor" header="Fecha" sortable style="min-width: 135px"><template #body="{data}"><strong>{{ fecha(data.fecha) }}</strong><small class="block">{{ data.hora || 'Sin hora' }}</small></template></Column>
        <Column field="producto" header="Producto" sortable style="min-width: 230px"><template #body="{data}"><strong>{{ data.producto }}</strong><small class="block mono">{{ data.codigo || 'Sin código' }}</small></template></Column>
        <Column field="almacen" header="Almacén" sortable style="min-width: 150px" />
        <Column field="tipo" header="Tipo" sortable style="min-width: 115px"><template #body="{data}"><Tag :value="data.tipo === 'ENTRADA' ? 'Entrada' : 'Salida'" :severity="data.tipo === 'ENTRADA' ? 'success' : 'danger'" /></template></Column>
        <Column field="saldoAnterior" header="Saldo anterior" sortable style="min-width: 135px"><template #body="{data}">{{ cantidad(data.saldoAnterior) }}</template></Column>
        <Column field="entrada" header="Entrada" sortable style="min-width: 110px"><template #body="{data}"><span class="quantity-in">{{ data.entrada ? `+${cantidad(data.entrada)}` : '—' }}</span></template></Column>
        <Column field="salida" header="Salida" sortable style="min-width: 110px"><template #body="{data}"><span class="quantity-out">{{ data.salida ? `-${cantidad(data.salida)}` : '—' }}</span></template></Column>
        <Column field="existencia" header="Existencia" sortable style="min-width: 120px"><template #body="{data}"><strong>{{ cantidad(data.existencia) }}</strong></template></Column>
        <Column field="documento" header="Documento / origen" sortable style="min-width: 190px"><template #body="{data}"><strong class="mono">{{ data.documento }}</strong><small class="block">{{ data.origen }}</small></template></Column>
        <Column field="usuario" header="Usuario" sortable style="min-width: 140px" />
        <Column header="" frozen alignFrozen="right" style="width: 65px"><template #body="{data}"><Button icon="pi pi-eye" rounded text aria-label="Ver detalle" @click="abrirDetalle(data)" /></template></Column>
      </DataTable>
    </section>

    <Dialog v-model:visible="mostrarDetalle" modal header="Detalle del movimiento" :style="{ width: 'min(620px, 95vw)' }">
      <div v-if="detalle" class="detail">
        <div class="detail-flow"><div><small>Saldo anterior</small><strong>{{ cantidad(detalle.saldoAnterior) }}</strong></div><i :class="detalle.tipo === 'ENTRADA' ? 'pi pi-arrow-right entry-color' : 'pi pi-arrow-right exit-color'" /><div><small>Existencia</small><strong>{{ cantidad(detalle.existencia) }}</strong></div></div>
        <dl><div><dt>Producto</dt><dd>{{ detalle.producto }}</dd></div><div><dt>Código</dt><dd>{{ detalle.codigo || '—' }}</dd></div><div><dt>Movimiento</dt><dd><Tag :value="`${detalle.tipo === 'ENTRADA' ? '+' : '-'}${cantidad(detalle.entrada || detalle.salida)}`" :severity="detalle.tipo === 'ENTRADA' ? 'success' : 'danger'" /></dd></div><div><dt>Almacén</dt><dd>{{ detalle.almacen }}</dd></div><div><dt>Fecha y hora</dt><dd>{{ fecha(detalle.fecha) }} {{ detalle.hora }}</dd></div><div><dt>Documento</dt><dd class="mono">{{ detalle.documento }}</dd></div><div><dt>Origen</dt><dd>{{ detalle.origen }}</dd></div><div><dt>Usuario</dt><dd>{{ detalle.usuario }}</dd></div><div class="wide"><dt>Descripción</dt><dd>{{ detalle.descripcion || 'Sin descripción' }}</dd></div></dl>
      </div>
      <template #footer><Button label="Cerrar" severity="secondary" @click="mostrarDetalle = false" /></template>
    </Dialog>
  </main>
</template>

<style scoped>
.kardex-page{padding:1.6rem;background:#f5f7fb;min-height:100vh;color:#263349}.hero{display:flex;justify-content:space-between;gap:1rem;align-items:flex-start;margin-bottom:1.25rem}.eyebrow{font-size:.75rem;font-weight:800;color:#6366f1;letter-spacing:.08em}.hero h1{font-size:1.8rem;margin:.25rem 0}.hero p{margin:0;color:#68758c;max-width:780px}.filter-panel,.table-card{background:white;border:1px solid #e5e9f1;border-radius:14px;padding:1rem;box-shadow:0 4px 15px rgba(31,41,55,.05)}.quick-dates{display:flex;flex-wrap:wrap;gap:.5rem}.custom-range{display:flex;gap:1rem;padding-top:1rem}.custom-range label{display:grid;gap:.35rem;font-size:.78rem;font-weight:700;color:#526078}.filter-grid{display:grid;grid-template-columns:minmax(240px,1.8fr) minmax(230px,1.6fr) minmax(160px,1fr) minmax(160px,1fr) auto;gap:.75rem;margin-top:1rem}.filter-grid>*{width:100%}.summary-grid{display:grid;grid-template-columns:repeat(5,minmax(150px,1fr));gap:.85rem;margin:1rem 0}.summary-card{background:white;border:1px solid #e5e9f1;border-radius:13px;padding:1rem;display:flex;gap:.8rem;align-items:center}.summary-card>i{width:40px;height:40px;border-radius:11px;display:grid;place-items:center;background:#eef2ff;color:#4f46e5;font-size:1.1rem}.summary-card span,.summary-card small{display:block;color:#718096;font-size:.78rem}.summary-card strong{display:block;font-size:1.3rem;margin-top:.15rem}.summary-card.entry>i,.quantity-in{color:#059669}.summary-card.entry>i{background:#ecfdf5}.summary-card.exit>i,.quantity-out{color:#dc2626}.summary-card.exit>i{background:#fef2f2}.summary-card.balance>i{color:#0284c7;background:#f0f9ff}.table-card{padding:.4rem;overflow:hidden}.block{display:block;color:#748197;margin-top:.2rem}.mono{font-family:ui-monospace,SFMono-Regular,Menlo,monospace}.empty{padding:3rem;display:grid;justify-items:center;gap:.45rem;color:#718096}.empty i{font-size:2rem}.detail-flow{display:grid;grid-template-columns:1fr auto 1fr;align-items:center;gap:1rem;background:#f8fafc;border-radius:12px;padding:1rem;margin-bottom:1rem;text-align:center}.detail-flow small,.detail-flow strong{display:block}.detail-flow strong{font-size:1.5rem}.entry-color{color:#059669}.exit-color{color:#dc2626}.detail dl{display:grid;grid-template-columns:1fr 1fr;gap:.8rem;margin:0}.detail dl>div{padding:.7rem;border:1px solid #e7ebf2;border-radius:9px}.detail .wide{grid-column:1/-1}.detail dt{font-size:.72rem;text-transform:uppercase;color:#778399;font-weight:700}.detail dd{margin:.25rem 0 0;color:#263349;font-weight:600}@media(max-width:1150px){.summary-grid{grid-template-columns:repeat(3,1fr)}.filter-grid{grid-template-columns:repeat(2,1fr)}}@media(max-width:680px){.kardex-page{padding:.8rem}.hero{flex-direction:column}.summary-grid,.filter-grid{grid-template-columns:1fr}.custom-range{flex-direction:column}.detail dl{grid-template-columns:1fr}}
</style>
