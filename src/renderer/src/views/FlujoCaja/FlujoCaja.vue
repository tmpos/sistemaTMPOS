<script setup>
import { computed, onMounted, ref } from 'vue'
import { useToast } from 'primevue/usetoast'
import { peticionesFetchOffline } from '../../funciones/funciones.js'
import { construirDias, iso, proyectarMovimientos, saldoDisponible } from './flujoCajaCore.js'

const toast = useToast()
const loading = ref(false)
const bancos = ref([])
const cxc = ref([])
const cxp = ref([])
const horizonte = ref(30)
const saldoCaja = ref(0)
const diaSeleccionado = ref(null)
const detalleVisible = ref(false)

const desde = computed(() => iso(new Date()))
const hasta = computed(() => { const date = new Date(); date.setDate(date.getDate() + horizonte.value); return iso(date) })
const saldoBancos = computed(() => saldoDisponible(bancos.value))
const saldoInicial = computed(() => saldoBancos.value + Number(saldoCaja.value || 0))
const movimientos = computed(() => proyectarMovimientos(cxc.value, cxp.value, { desde: desde.value, hasta: hasta.value }))
const dias = computed(() => construirDias(movimientos.value, saldoInicial.value, desde.value, hasta.value))
const ingresos = computed(() => movimientos.value.filter((row) => row.tipo === 'INGRESO').reduce((sum, row) => sum + row.monto, 0))
const egresos = computed(() => movimientos.value.filter((row) => row.tipo === 'EGRESO').reduce((sum, row) => sum + row.monto, 0))
const saldoFinal = computed(() => dias.value.at(-1)?.balance ?? saldoInicial.value)

const cargar = async () => {
  loading.value = true
  try {
    const result = await Promise.allSettled(['banco', 'cuentas_cobrar', 'cuentasxpagar'].map((table) => peticionesFetchOffline('getDataAsArray', table)))
    const rows = (index) => result[index].status === 'fulfilled' && Array.isArray(result[index].value) ? result[index].value : []
    bancos.value = rows(0); cxc.value = rows(1); cxp.value = rows(2)
  } catch (error) {
    console.error('Error cargando flujo de caja:', error)
    toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo construir la proyección.', life: 3500 })
  } finally { loading.value = false }
}
const money = (value) => new Intl.NumberFormat('es-DO', { style: 'currency', currency: 'DOP' }).format(Number(value) || 0)
const date = (value) => value ? value.split('-').reverse().join('/') : '—'
const verDia = (row) => { diaSeleccionado.value = row; detalleVisible.value = true }
onMounted(cargar)
</script>

<template>
  <main class="cashflow-page"><div class="page-wrap">
    <header class="page-header"><div><span>TESORERÍA</span><h1>Flujo de Caja Proyectado</h1><p>Combina el efectivo disponible con los cobros y pagos programados.</p></div><Button label="Actualizar" icon="pi pi-refresh" outlined :loading="loading" @click="cargar"/></header>
    <section class="controls"><div class="horizons"><Button v-for="days in [7,30,60,90]" :key="days" :label="days + ' días'" size="small" :outlined="horizonte!==days" :severity="horizonte===days?'primary':'secondary'" @click="horizonte=days"/></div><label><span>Efectivo actual en caja</span><InputNumber v-model="saldoCaja" mode="currency" currency="DOP" locale="es-DO" :min="0"/></label><div class="range"><span>Proyección</span><strong>{{ date(desde) }} → {{ date(hasta) }}</strong></div></section>
    <section class="stats"><article class="blue"><i class="pi pi-wallet"></i><div><span>Disponible inicial</span><strong>{{ money(saldoInicial) }}</strong><small>Bancos + efectivo indicado</small></div></article><article class="green"><i class="pi pi-arrow-down-left"></i><div><span>Cobros previstos</span><strong>{{ money(ingresos) }}</strong><small>Cuentas por cobrar</small></div></article><article class="red"><i class="pi pi-arrow-up-right"></i><div><span>Pagos previstos</span><strong>{{ money(egresos) }}</strong><small>Cuentas por pagar</small></div></article><article :class="saldoFinal < 0 ? 'red' : 'purple'"><i class="pi pi-chart-line"></i><div><span>Disponible proyectado</span><strong>{{ money(saldoFinal) }}</strong><small>Al final del período</small></div></article></section>
    <Message v-if="dias.some(day=>day.balance<0)" severity="warn" :closable="false">La proyección presenta días con balance negativo. Revisa los pagos programados o acelera la gestión de cobros.</Message>
    <section class="table-card"><div class="table-title"><div><h2>Calendario de liquidez</h2><p>Haz clic en un día para ver los documentos que componen el flujo.</p></div></div><DataTable :value="dias" :loading="loading" paginator :rows="15" :rowsPerPageOptions="[10,15,30,60,90]" stripedRows scrollable scrollHeight="580px"><Column field="fecha" header="Fecha" sortable :style="{minWidth:'125px'}"><template #body="{data}"><strong>{{ date(data.fecha) }}</strong></template></Column><Column field="ingresos" header="Ingresos" sortable :style="{minWidth:'150px'}"><template #body="{data}"><span class="income">{{ data.ingresos ? money(data.ingresos) : '—' }}</span></template></Column><Column field="egresos" header="Egresos" sortable :style="{minWidth:'150px'}"><template #body="{data}"><span class="expense">{{ data.egresos ? money(data.egresos) : '—' }}</span></template></Column><Column field="neto" header="Flujo neto" sortable :style="{minWidth:'150px'}"><template #body="{data}"><strong :class="data.neto<0?'expense':'income'">{{ money(data.neto) }}</strong></template></Column><Column field="balance" header="Disponible acumulado" sortable :style="{minWidth:'185px'}"><template #body="{data}"><strong :class="data.balance<0?'negative-balance':'balance'">{{ money(data.balance) }}</strong></template></Column><Column header="Documentos" :style="{minWidth:'115px'}"><template #body="{data}"><Button :label="String(data.movimientos.length)" icon="pi pi-eye" severity="secondary" text rounded :disabled="!data.movimientos.length" @click="verDia(data)"/></template></Column></DataTable></section>
  </div>
  <Dialog v-model:visible="detalleVisible" modal :header="'Movimientos del ' + date(diaSeleccionado?.fecha)" :style="{width:'760px'}" :breakpoints="{'800px':'95vw'}"><DataTable :value="diaSeleccionado?.movimientos || []" size="small"><Column field="tipo" header="Tipo"><template #body="{data}"><Tag :value="data.tipo" :severity="data.tipo==='INGRESO'?'success':'danger'"/></template></Column><Column field="tercero" header="Cliente / proveedor"/><Column field="documento" header="Documento"/><Column field="origen" header="Origen"/><Column field="monto" header="Monto"><template #body="{data}"><strong>{{ money(data.monto) }}</strong></template></Column></DataTable></Dialog><Toast/></main>
</template>

<style scoped>
.cashflow-page{min-height:100vh;background:#f3f6fb;color:#24324a}.page-wrap{padding:28px 32px 50px}.page-header{display:flex;align-items:center;justify-content:space-between;gap:20px;margin-bottom:20px}.page-header span{font-size:.75rem;font-weight:800;letter-spacing:.08em;color:#2563eb}.page-header h1{font-size:2rem;margin:3px 0;color:#172238}.page-header p,.table-title p{margin:0;color:#69778d}.controls,.table-card{background:#fff;border:1px solid #dfe6f0;border-radius:14px;box-shadow:0 6px 20px rgba(30,50,80,.05)}.controls{display:grid;grid-template-columns:1fr 270px auto;gap:16px;align-items:end;padding:16px;margin-bottom:14px}.horizons{display:flex;gap:8px;flex-wrap:wrap}.controls label{display:flex;flex-direction:column;gap:5px}.controls label>span,.range span{font-size:.75rem;font-weight:700;color:#67758b}.range{display:flex;flex-direction:column;gap:4px}.stats{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin:14px 0}.stats article{background:#fff;border:1px solid #dfe6f0;border-radius:13px;padding:16px;display:flex;align-items:center;gap:12px}.stats article>i{width:42px;height:42px;display:grid;place-items:center;border-radius:11px;background:#edf2f8}.stats article div{display:flex;flex-direction:column}.stats span,.stats small{font-size:.73rem;color:#768399}.stats strong{font-size:1.18rem}.blue i,.blue strong{color:#2764c8}.green i,.green strong,.income{color:#087b50}.red i,.red strong,.expense{color:#bf4141}.purple i,.purple strong{color:#7544c5}.table-card{overflow:hidden;margin-top:14px}.table-title{padding:18px 20px;border-bottom:1px solid #e3e9f1}.table-title h2{font-size:1.08rem;margin:0 0 3px}.balance{color:#1c4c92}.negative-balance{color:#fff;background:#d74646;padding:5px 8px;border-radius:6px}@media(max-width:1050px){.controls{grid-template-columns:1fr 1fr}.stats{grid-template-columns:1fr 1fr}}@media(max-width:650px){.page-wrap{padding:18px 12px}.page-header{align-items:flex-start;flex-direction:column}.controls,.stats{grid-template-columns:1fr}}
</style>
