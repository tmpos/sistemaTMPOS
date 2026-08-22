<script setup>
import { computed, onMounted, ref } from 'vue'
import { useToast } from 'primevue/usetoast'
import {
  crearTablaSiNoExisteOffline,
  peticionesFetchOffline
} from '../../funciones/funciones.js'
import {
  construirTrazabilidad,
  filtrarTransacciones,
  obtenerRangoPeriodo
} from './transaccionesCore.js'

const toast = useToast()
const loading = ref(false)
const transacciones = ref([])
const periodo = ref('hoy')
const fechaDesde = ref('')
const fechaHasta = ref('')
const cuentaSeleccionada = ref('')
const busqueda = ref('')
const detalleVisible = ref(false)
const transaccionSeleccionada = ref(null)

const periodos = [
  { key: 'hoy', label: 'Hoy', icon: 'pi pi-sun' },
  { key: 'ayer', label: 'Ayer', icon: 'pi pi-history' },
  { key: 'semana', label: 'Esta semana', icon: 'pi pi-calendar' },
  { key: 'mes', label: 'Este mes', icon: 'pi pi-calendar-plus' },
  { key: 'personalizado', label: 'Rango personalizado', icon: 'pi pi-sliders-h' }
]

const aplicarPeriodo = (key) => {
  periodo.value = key
  if (key === 'personalizado') return
  const rango = obtenerRangoPeriodo(key)
  fechaDesde.value = rango.desde
  fechaHasta.value = rango.hasta
}

const cargarTransacciones = async () => {
  loading.value = true
  try {
    await Promise.all([
      crearTablaSiNoExisteOffline(
        'asientodiario',
        ['numero', 'fecha', 'hora', 'asiento', 'descripcion', 'usuario'],
        toast
      ),
      crearTablaSiNoExisteOffline(
        'transaccionesbancarias',
        [
          'cuenta_origen', 'cuenta_destino', 'cuenta', 'monto', 'tipo',
          'balance_anterior', 'balance_actual', 'metodo', 'descripcion',
          'depositante', 'beneficiario', 'persona', 'fecha', 'hora', 'estado', 'usuario'
        ],
        toast
      )
    ])

    const [asientosResult, bancosResult] = await Promise.allSettled([
      peticionesFetchOffline('getDataAsArray', 'asientodiario'),
      peticionesFetchOffline('getDataAsArray', 'transaccionesbancarias')
    ])
    const asientos = asientosResult.status === 'fulfilled' && Array.isArray(asientosResult.value)
      ? asientosResult.value
      : []
    const bancos = bancosResult.status === 'fulfilled' && Array.isArray(bancosResult.value)
      ? bancosResult.value
      : []

    transacciones.value = construirTrazabilidad(asientos, bancos)
  } catch (error) {
    console.error('Error al cargar la trazabilidad de transacciones:', error)
    toast.add({
      severity: 'error',
      summary: 'No se pudieron cargar las transacciones',
      detail: error?.message || 'Verifica las tablas contables locales.',
      life: 4500
    })
  } finally {
    loading.value = false
  }
}

const cuentas = computed(() => {
  const result = new Set()
  transacciones.value.forEach((row) => {
    if (row.cuentaOrigen && !row.cuentaOrigen.includes('no especificad')) result.add(row.cuentaOrigen)
    if (row.cuentaDestino && !row.cuentaDestino.includes('no especificad')) result.add(row.cuentaDestino)
  })
  return [...result].sort((a, b) => a.localeCompare(b))
})

const transaccionesFiltradas = computed(() => filtrarTransacciones(transacciones.value, {
  desde: fechaDesde.value,
  hasta: fechaHasta.value,
  cuenta: cuentaSeleccionada.value,
  busqueda: busqueda.value
}))

const totalMovido = computed(() => transaccionesFiltradas.value.reduce((total, row) => total + row.monto, 0))
const totalCuentas = computed(() => {
  const result = new Set()
  transaccionesFiltradas.value.forEach((row) => {
    result.add(row.cuentaOrigen)
    result.add(row.cuentaDestino)
  })
  return result.size
})
const asientosContables = computed(() => transaccionesFiltradas.value.filter((row) => row.fuente === 'contable').length)

const formatCurrency = (value) => new Intl.NumberFormat('es-DO', {
  style: 'currency',
  currency: 'DOP',
  minimumFractionDigits: 2
}).format(Number(value) || 0)

const formatDate = (value) => {
  if (!value) return 'Sin fecha'
  const [year, month, day] = value.split('-')
  return `${day}/${month}/${year}`
}

const verDetalle = (row) => {
  transaccionSeleccionada.value = row
  detalleVisible.value = true
}

const limpiarFiltros = () => {
  cuentaSeleccionada.value = ''
  busqueda.value = ''
  aplicarPeriodo('hoy')
}

onMounted(async () => {
  aplicarPeriodo('hoy')
  await cargarTransacciones()
})
</script>

<template>
  <main class="transactions-page min-h-screen">
    <div class="page-container">
      <header class="page-header">
        <div>
          <div class="eyebrow">CONTABILIDAD</div>
          <h1>Trazabilidad de Transacciones</h1>
          <p>Consulta de qué cuenta salió el valor, a qué cuenta llegó y qué operación lo generó.</p>
        </div>
        <div class="header-actions">
          <Button
            label="Movimientos por cuenta"
            icon="pi pi-book"
            severity="secondary"
            outlined
            @click="$router.push('/movimientos-cuentas')"
          />
          <Button
            label="Actualizar"
            icon="pi pi-refresh"
            :loading="loading"
            @click="cargarTransacciones"
          />
        </div>
      </header>

      <section class="filter-panel">
        <div class="period-buttons" aria-label="Período de consulta">
          <Button
            v-for="option in periodos"
            :key="option.key"
            :label="option.label"
            :icon="option.icon"
            :outlined="periodo !== option.key"
            :severity="periodo === option.key ? 'primary' : 'secondary'"
            size="small"
            @click="aplicarPeriodo(option.key)"
          />
        </div>

        <div class="filter-grid">
          <label class="field">
            <span>Desde</span>
            <input v-model="fechaDesde" type="date" @change="periodo = 'personalizado'" />
          </label>
          <label class="field">
            <span>Hasta</span>
            <input v-model="fechaHasta" type="date" @change="periodo = 'personalizado'" />
          </label>
          <label class="field">
            <span>Cuenta contable</span>
            <select v-model="cuentaSeleccionada">
              <option value="">Todas las cuentas</option>
              <option v-for="cuenta in cuentas" :key="cuenta" :value="cuenta">{{ cuenta }}</option>
            </select>
          </label>
          <label class="field search-field">
            <span>Buscar</span>
            <div class="search-control">
              <i class="pi pi-search"></i>
              <input v-model.trim="busqueda" type="search" placeholder="Cuenta, documento, módulo, usuario..." />
            </div>
          </label>
          <Button label="Limpiar" icon="pi pi-filter-slash" severity="secondary" outlined @click="limpiarFiltros" />
        </div>
      </section>

      <section class="summary-grid">
        <article class="summary-card summary-blue">
          <i class="pi pi-arrow-right-arrow-left"></i>
          <div><span>Transacciones</span><strong>{{ transaccionesFiltradas.length }}</strong></div>
        </article>
        <article class="summary-card summary-green">
          <i class="pi pi-wallet"></i>
          <div><span>Total movido</span><strong>{{ formatCurrency(totalMovido) }}</strong></div>
        </article>
        <article class="summary-card summary-purple">
          <i class="pi pi-sitemap"></i>
          <div><span>Cuentas involucradas</span><strong>{{ totalCuentas }}</strong></div>
        </article>
        <article class="summary-card summary-orange">
          <i class="pi pi-book"></i>
          <div><span>Con asiento contable</span><strong>{{ asientosContables }}</strong></div>
        </article>
      </section>

      <section class="table-card">
        <div class="table-heading">
          <div>
            <h2>Recorrido de las transacciones</h2>
            <p>En contabilidad, la cuenta acreditada se presenta como origen y la debitada como destino.</p>
          </div>
          <span class="result-count">{{ transaccionesFiltradas.length }} resultados</span>
        </div>

        <DataTable
          :value="transaccionesFiltradas"
          :loading="loading"
          paginator
          :rows="15"
          :rowsPerPageOptions="[10, 15, 25, 50, 100]"
          stripedRows
          scrollable
          scrollHeight="560px"
          dataKey="id"
          class="trace-table"
          paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink RowsPerPageDropdown CurrentPageReport"
          currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords}"
        >
          <template #empty>
            <div class="empty-state">
              <i class="pi pi-inbox"></i>
              <strong>No hay transacciones en este período</strong>
              <span>Prueba otro rango de fechas o limpia los filtros.</span>
            </div>
          </template>
          <Column field="fecha" header="Fecha" sortable frozen :style="{ minWidth: '125px' }">
            <template #body="{ data }">
              <div class="date-cell"><strong>{{ formatDate(data.fecha) }}</strong><small>{{ data.hora || '—' }}</small></div>
            </template>
          </Column>
          <Column header="Origen" sortable sortField="cuentaOrigen" :style="{ minWidth: '210px' }">
            <template #body="{ data }">
              <div class="account-cell origin-account"><i class="pi pi-minus-circle"></i><span>{{ data.cuentaOrigen }}</span></div>
            </template>
          </Column>
          <Column header="" :style="{ width: '56px', minWidth: '56px' }">
            <template #body><span class="flow-arrow"><i class="pi pi-arrow-right"></i></span></template>
          </Column>
          <Column header="Destino" sortable sortField="cuentaDestino" :style="{ minWidth: '210px' }">
            <template #body="{ data }">
              <div class="account-cell destination-account"><i class="pi pi-plus-circle"></i><span>{{ data.cuentaDestino }}</span></div>
            </template>
          </Column>
          <Column field="monto" header="Monto" sortable :style="{ minWidth: '145px' }">
            <template #body="{ data }"><strong class="amount">{{ formatCurrency(data.monto) }}</strong></template>
          </Column>
          <Column field="documento" header="Documento" sortable :style="{ minWidth: '125px' }">
            <template #body="{ data }"><code>{{ data.documento || '—' }}</code></template>
          </Column>
          <Column field="modulo" header="Origen operativo" sortable :style="{ minWidth: '175px' }">
            <template #body="{ data }">
              <Tag :value="data.modulo" :severity="data.fuente === 'contable' ? 'info' : 'warn'" rounded />
            </template>
          </Column>
          <Column field="descripcion" header="Descripción" :style="{ minWidth: '260px' }" />
          <Column header="Detalle" :style="{ width: '85px', minWidth: '85px' }">
            <template #body="{ data }">
              <Button icon="pi pi-eye" severity="secondary" text rounded v-tooltip.top="'Ver trazabilidad'" @click="verDetalle(data)" />
            </template>
          </Column>
        </DataTable>
      </section>
    </div>

    <Dialog
      v-model:visible="detalleVisible"
      modal
      header="Detalle de la transacción"
      :style="{ width: '720px' }"
      :breakpoints="{ '760px': '94vw' }"
    >
      <div v-if="transaccionSeleccionada" class="detail-content">
        <div class="detail-route">
          <div class="route-account route-origin">
            <small>ORIGEN · CRÉDITO</small>
            <strong>{{ transaccionSeleccionada.cuentaOrigen }}</strong>
          </div>
          <div class="route-middle">
            <span>{{ formatCurrency(transaccionSeleccionada.monto) }}</span>
            <i class="pi pi-arrow-right"></i>
          </div>
          <div class="route-account route-destination">
            <small>DESTINO · DÉBITO</small>
            <strong>{{ transaccionSeleccionada.cuentaDestino }}</strong>
          </div>
        </div>
        <dl class="detail-grid">
          <div><dt>Fecha y hora</dt><dd>{{ formatDate(transaccionSeleccionada.fecha) }} {{ transaccionSeleccionada.hora }}</dd></div>
          <div><dt>Documento / asiento</dt><dd>{{ transaccionSeleccionada.documento || 'Sin referencia' }}</dd></div>
          <div><dt>Módulo de origen</dt><dd>{{ transaccionSeleccionada.modulo }}</dd></div>
          <div><dt>Fuente del registro</dt><dd>{{ transaccionSeleccionada.fuente === 'contable' ? 'Asiento diario' : 'Transacción bancaria' }}</dd></div>
          <div><dt>Usuario</dt><dd>{{ transaccionSeleccionada.usuario || 'No registrado' }}</dd></div>
          <div><dt>Estado</dt><dd>{{ transaccionSeleccionada.estado }}</dd></div>
          <div class="detail-description"><dt>Descripción</dt><dd>{{ transaccionSeleccionada.descripcion }}</dd></div>
        </dl>
      </div>
    </Dialog>
    <Toast />
  </main>
</template>

<style scoped>
.transactions-page { background: #f3f6fb; color: #24324a; }
.page-container { width: 100%; padding: 28px 32px 48px; }
.page-header { display: flex; align-items: center; justify-content: space-between; gap: 24px; margin-bottom: 22px; }
.eyebrow { color: #2563eb; font-size: .78rem; font-weight: 800; letter-spacing: .08em; }
.page-header h1 { margin: 4px 0; font-size: clamp(1.65rem, 2.5vw, 2.25rem); font-weight: 750; color: #172238; }
.page-header p, .table-heading p { margin: 0; color: #66758e; }
.header-actions { display: flex; gap: 10px; flex-wrap: wrap; }
.filter-panel, .table-card { background: #fff; border: 1px solid #dde5f1; border-radius: 16px; box-shadow: 0 8px 24px rgba(30, 51, 84, .06); }
.filter-panel { padding: 18px; margin-bottom: 18px; }
.period-buttons { display: flex; flex-wrap: wrap; gap: 8px; padding-bottom: 16px; margin-bottom: 16px; border-bottom: 1px solid #e7edf5; }
.filter-grid { display: grid; grid-template-columns: 150px 150px minmax(210px, 1fr) minmax(280px, 1.5fr) auto; gap: 12px; align-items: end; }
.field { display: flex; flex-direction: column; gap: 6px; min-width: 0; }
.field > span { font-size: .78rem; font-weight: 700; color: #526079; }
.field > input, .field > select, .search-control { width: 100%; height: 42px; border: 1px solid #ccd6e5; border-radius: 9px; background: #fff; color: #263550; }
.field > input, .field > select { padding: 0 11px; }
.field input:focus, .field select:focus, .search-control:focus-within { outline: none; border-color: #5b7cfa; box-shadow: 0 0 0 3px rgba(91, 124, 250, .13); }
.search-control { display: flex; align-items: center; padding: 0 12px; gap: 9px; }
.search-control i { color: #8290a7; }
.search-control input { border: 0; outline: 0; width: 100%; min-width: 0; }
.summary-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 14px; margin-bottom: 18px; }
.summary-card { display: flex; align-items: center; gap: 14px; background: #fff; border: 1px solid #e0e7f1; border-radius: 14px; padding: 17px; box-shadow: 0 5px 16px rgba(30, 51, 84, .05); }
.summary-card > i { width: 45px; height: 45px; display: grid; place-items: center; border-radius: 12px; font-size: 1.15rem; }
.summary-card div { display: flex; flex-direction: column; min-width: 0; }
.summary-card span { color: #6b7890; font-size: .78rem; }
.summary-card strong { color: #1b2940; font-size: 1.32rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.summary-blue > i { color: #2563eb; background: #eaf2ff; }
.summary-green > i { color: #079455; background: #e8f8f0; }
.summary-purple > i { color: #7c3aed; background: #f1eaff; }
.summary-orange > i { color: #d97706; background: #fff3df; }
.table-card { overflow: hidden; }
.table-heading { display: flex; align-items: center; justify-content: space-between; gap: 18px; padding: 19px 20px; border-bottom: 1px solid #e4eaf3; }
.table-heading h2 { margin: 0 0 4px; font-size: 1.1rem; }
.table-heading p { font-size: .82rem; }
.result-count { background: #edf3ff; color: #315fd3; padding: 6px 10px; border-radius: 999px; font-size: .78rem; font-weight: 700; white-space: nowrap; }
.date-cell { display: flex; flex-direction: column; gap: 2px; }
.date-cell small { color: #79869b; }
.account-cell { display: flex; align-items: center; gap: 8px; font-weight: 650; }
.origin-account i { color: #e25555; }
.destination-account i { color: #0ba46b; }
.flow-arrow { width: 32px; height: 32px; display: grid; place-items: center; border-radius: 50%; background: #edf2fa; color: #53709d; }
.amount { color: #087a50; font-size: .96rem; }
code { color: #4c5d78; background: #f1f4f8; border-radius: 5px; padding: 4px 6px; }
.empty-state { min-height: 240px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px; color: #78869b; }
.empty-state i { font-size: 2.3rem; color: #a8b4c5; }
.empty-state strong { color: #47566e; }
.detail-content { padding: 4px 0 10px; }
.detail-route { display: grid; grid-template-columns: minmax(0, 1fr) 145px minmax(0, 1fr); align-items: center; margin-bottom: 22px; }
.route-account { min-height: 110px; padding: 18px; display: flex; flex-direction: column; justify-content: center; gap: 7px; border: 1px solid; border-radius: 13px; }
.route-account small { font-size: .7rem; font-weight: 800; letter-spacing: .05em; }
.route-account strong { font-size: 1.05rem; overflow-wrap: anywhere; }
.route-origin { border-color: #f0c7c7; background: #fff6f6; color: #a93e3e; }
.route-destination { border-color: #bde5d3; background: #f0fbf6; color: #087b50; }
.route-middle { text-align: center; display: flex; flex-direction: column; gap: 8px; color: #42618d; font-weight: 750; }
.route-middle i { font-size: 1.4rem; }
.detail-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin: 0; }
.detail-grid > div { border: 1px solid #e1e7f0; background: #f8fafc; border-radius: 10px; padding: 12px; }
.detail-grid dt { color: #738198; font-size: .72rem; font-weight: 700; margin-bottom: 4px; }
.detail-grid dd { color: #2b3951; margin: 0; font-weight: 600; overflow-wrap: anywhere; }
.detail-description { grid-column: 1 / -1; }
@media (max-width: 1100px) { .filter-grid { grid-template-columns: 1fr 1fr; } .search-field { grid-column: 1 / -1; } .summary-grid { grid-template-columns: 1fr 1fr; } }
@media (max-width: 700px) { .page-container { padding: 18px 12px 32px; } .page-header { align-items: flex-start; flex-direction: column; } .header-actions { width: 100%; } .filter-grid, .summary-grid { grid-template-columns: 1fr; } .search-field { grid-column: auto; } .detail-route { grid-template-columns: 1fr; gap: 8px; } .route-middle { flex-direction: row; justify-content: center; } .route-middle i { transform: rotate(90deg); } .detail-grid { grid-template-columns: 1fr; } .detail-description { grid-column: auto; } }
</style>
