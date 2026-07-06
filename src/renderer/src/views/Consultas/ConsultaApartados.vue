<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Button from 'primevue/button'
import Column from 'primevue/column'
import DataTable from 'primevue/datatable'
import InputText from 'primevue/inputtext'
import Tag from 'primevue/tag'
import { useToast } from 'primevue/usetoast'
import { formatoMonedaRD, peticionesFetchOffline } from '@/funciones/funciones.js'

const toast = useToast()
const route = useRoute()
const router = useRouter()
const criterio = ref('')
const buscando = ref(false)
const apartados = ref([])
const cliente = ref(null)

const texto = (value) => String(value || '').trim().toLowerCase()
const doc = (value) => String(value || '').replace(/\D/g, '')
const array = (value) => Array.isArray(value) ? value : Array.isArray(value?.data) ? value.data : []
const numero = (value) => Number.isFinite(Number(value)) ? Number(value) : 0
const moneda = (value) => formatoMonedaRD(numero(value))
const coincide = (value, query) => texto(value).includes(texto(query)) || (doc(query) && doc(value) === doc(query))

const totalApartado = computed(() => apartados.value.reduce((acc, item) => acc + numero(item.monto_credito), 0))
const totalAbonado = computed(() => apartados.value.reduce((acc, item) => acc + numero(item.abonado), 0))
const totalSaldo = computed(() => apartados.value.reduce((acc, item) => acc + numero(item.saldo), 0))

const estadoSeverity = (estado) => {
  const value = texto(estado)
  if (value.includes('pend')) return 'warning'
  if (value.includes('sald') || value.includes('retir') || value.includes('pag')) return 'success'
  if (value.includes('venc') || value.includes('cancel')) return 'danger'
  return 'info'
}

const buscar = async () => {
  const query = criterio.value.trim()
  if (!query) {
    toast.add({ severity: 'warn', summary: 'Dato requerido', detail: 'Coloca apartado, factura, codigo, cedula o cliente.', life: 2500 })
    return
  }

  buscando.value = true
  apartados.value = []
  cliente.value = null

  try {
    const [clientesRaw, apartadosRaw] = await Promise.all([
      peticionesFetchOffline('getDataAsArray', 'clientes'),
      peticionesFetchOffline('getDataAsArray', 'apartados')
    ])

    const clientes = array(clientesRaw)
    const todos = array(apartadosRaw)
    cliente.value = clientes.find((item) => coincide(item.codigo, query) || coincide(item.cedula, query) || coincide(item.rnc, query) || coincide(item.nombre, query)) || null

    apartados.value = todos.filter((item) => {
      return (
        coincide(item.no_emision, query) ||
        coincide(item.no_factura, query) ||
        coincide(item.cod_cliente, cliente.value?.codigo || query) ||
        coincide(item.cedula_cliente, cliente.value?.cedula || query) ||
        coincide(item.nombre_cliente, query) ||
        coincide(item.telefono_cliente, query)
      )
    }).sort((a, b) => String(b.fecha_emision || '').localeCompare(String(a.fecha_emision || '')))

    if (!apartados.value.length) {
      toast.add({ severity: 'info', summary: 'Sin resultados', detail: 'No se encontraron apartados.', life: 3000 })
    }
  } catch (error) {
    console.error('[ConsultaApartados] Error:', error)
    toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo consultar apartados.', life: 3500 })
  } finally {
    buscando.value = false
  }
}

onMounted(() => {
  const query = Array.isArray(route.query?.cliente) ? route.query.cliente[0] : route.query?.cliente
  if (query) {
    criterio.value = String(query)
    buscar()
  }
})
</script>

<template>
  <div class="consulta-page">
    <main class="consulta-shell">
      <div class="top-actions"><Button label="Volver" icon="pi pi-arrow-left" severity="secondary" outlined @click="router.back()" /></div>
      <section class="consulta-header">
        <span>Consulta publica</span>
        <h1>Apartados</h1>
        <p>Consulta estado, abonos, saldo pendiente y vencimiento de apartados.</p>
      </section>
      <section class="search-panel">
        <div class="search-control"><i class="pi pi-search"></i><InputText v-model="criterio" placeholder="Apartado, factura, codigo, cedula, telefono o cliente" @keyup.enter="buscar" /></div>
        <Button label="Buscar" icon="pi pi-arrow-right" iconPos="right" :loading="buscando" @click="buscar" />
      </section>
      <section v-if="apartados.length" class="summary-grid">
        <article><span>Cliente</span><strong>{{ cliente?.nombre || apartados[0]?.nombre_cliente || '-' }}</strong></article>
        <article><span>Total apartado</span><strong>{{ moneda(totalApartado) }}</strong></article>
        <article><span>Abonado</span><strong>{{ moneda(totalAbonado) }}</strong></article>
        <article class="danger"><span>Saldo</span><strong>{{ moneda(totalSaldo) }}</strong></article>
      </section>
      <section class="table-panel">
        <div class="table-header"><h2>Resultados</h2><span>{{ apartados.length }} apartado(s)</span></div>
        <DataTable :value="apartados" :paginator="apartados.length > 10" :rows="10" stripedRows responsiveLayout="scroll">
          <Column field="no_emision" header="Emision" />
          <Column field="no_factura" header="Factura" />
          <Column field="nombre_cliente" header="Cliente" />
          <Column field="fecha_emision" header="Fecha" />
          <Column field="fecha_vencimiento" header="Vence" />
          <Column header="Monto"><template #body="{ data }">{{ moneda(data.monto_credito) }}</template></Column>
          <Column header="Abonado"><template #body="{ data }">{{ moneda(data.abonado) }}</template></Column>
          <Column header="Saldo"><template #body="{ data }"><strong>{{ moneda(data.saldo) }}</strong></template></Column>
          <Column header="Estado"><template #body="{ data }"><Tag :value="data.estatus || '-'" :severity="estadoSeverity(data.estatus)" /></template></Column>
        </DataTable>
      </section>
    </main>
  </div>
</template>

<style scoped>
.consulta-page { min-height:100vh; padding:2rem 1rem; background:linear-gradient(180deg,#f8fafc,#eef2f7); color:#172033; }
.consulta-shell { width:min(1160px,100%); margin:0 auto; }
.top-actions { margin-bottom:1rem; }
.consulta-header { text-align:center; margin-bottom:1rem; }
.consulta-header span { color:#16a34a; font-size:.78rem; font-weight:800; text-transform:uppercase; }
.consulta-header h1 { margin:.25rem 0; font-size:3rem; line-height:1.05; }
.consulta-header p { margin:0; color:#64748b; }
.search-panel,.table-panel,.summary-grid article { background:#fff; border:1px solid #e2e8f0; border-radius:8px; box-shadow:0 18px 45px rgba(15,23,42,.08); }
.search-panel { display:grid; grid-template-columns:1fr auto; gap:.9rem; padding:1rem; margin-bottom:1rem; }
.search-control { position:relative; }
.search-control i { position:absolute; left:.9rem; top:50%; transform:translateY(-50%); color:#64748b; }
.search-control :deep(.p-inputtext) { width:100%; height:3rem; padding-left:2.6rem; }
.search-panel :deep(.p-button) { height:3rem; min-width:9rem; }
.summary-grid { display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); gap:1rem; margin-bottom:1rem; }
.summary-grid article { padding:1rem; display:grid; gap:.35rem; }
.summary-grid span,.table-header span { color:#64748b; font-size:.86rem; font-weight:700; }
.summary-grid strong { font-size:1.25rem; overflow-wrap:anywhere; }
.danger strong { color:#dc2626; }
.table-panel { padding:1rem; }
.table-header { display:flex; align-items:center; justify-content:space-between; margin-bottom:.9rem; }
.table-header h2 { margin:0; font-size:1.25rem; }
.table-panel :deep(.p-datatable-thead > tr > th) { background:#f1f5f9; color:#334155; }
@media (max-width:760px){ .consulta-header h1{font-size:2.25rem}.search-panel,.summary-grid{grid-template-columns:1fr}.search-panel :deep(.p-button){width:100%} }
</style>
