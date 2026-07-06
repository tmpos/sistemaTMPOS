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
const cliente = ref(null)
const historial = ref([])
const facturas = ref([])

const niveles = [
  { nombre: 'BRONCE', min: 0, max: 99 },
  { nombre: 'PLATA', min: 100, max: 499 },
  { nombre: 'ORO', min: 500, max: 1499 },
  { nombre: 'PLATINO', min: 1500, max: 2999 },
  { nombre: 'DIAMANTE', min: 3000, max: 999999999 }
]
const texto = (value) => String(value || '').trim().toLowerCase()
const doc = (value) => String(value || '').replace(/\D/g, '')
const array = (value) => Array.isArray(value) ? value : Array.isArray(value?.data) ? value.data : []
const coincide = (value, query) => texto(value).includes(texto(query)) || (doc(query) && doc(value) === doc(query))
const numero = (value) => Number.isFinite(Number(value)) ? Number(value) : 0
const moneda = (value) => formatoMonedaRD(numero(value))
const puntos = computed(() => numero(cliente.value?.puntos || cliente.value?.puntos_actuales))
const nivel = computed(() => niveles.find((item) => puntos.value >= item.min && puntos.value <= item.max)?.nombre || 'BRONCE')
const totalComprado = computed(() => facturas.value.reduce((acc, item) => acc + numero(item.total), 0))

const buscar = async () => {
  const query = criterio.value.trim()
  if (!query) {
    toast.add({ severity: 'warn', summary: 'Dato requerido', detail: 'Coloca codigo, cedula, RNC, telefono o nombre.', life: 2500 })
    return
  }
  buscando.value = true
  cliente.value = null
  historial.value = []
  facturas.value = []
  try {
    const [clientesRaw, historialRaw, facturasRaw] = await Promise.all([
      peticionesFetchOffline('getDataAsArray', 'clientes'),
      peticionesFetchOffline('getDataAsArray', 'historial_puntos'),
      peticionesFetchOffline('getDataAsArray', 'facturas')
    ])
    const clientes = array(clientesRaw)
    cliente.value = clientes.find((item) => coincide(item.codigo, query) || coincide(item.cedula, query) || coincide(item.rnc, query) || coincide(item.telefono, query) || coincide(item.nombre, query)) || null
    if (!cliente.value) {
      toast.add({ severity: 'info', summary: 'Sin resultados', detail: 'No se encontro el cliente.', life: 3000 })
      return
    }
    historial.value = array(historialRaw).filter((item) => texto(item.codigo_cliente) === texto(cliente.value.codigo)).reverse()
    facturas.value = array(facturasRaw).filter((item) => texto(item.cod_cliente) === texto(cliente.value.codigo))
  } catch (error) {
    console.error('[ConsultaFidelizacion] Error:', error)
    toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo consultar fidelizacion.', life: 3500 })
  } finally {
    buscando.value = false
  }
}
onMounted(() => { const q = Array.isArray(route.query?.cliente) ? route.query.cliente[0] : route.query?.cliente; if (q) { criterio.value = String(q); buscar() } })
</script>

<template>
  <div class="consulta-page"><main class="consulta-shell">
    <div class="top-actions"><Button label="Volver" icon="pi pi-arrow-left" severity="secondary" outlined @click="router.back()" /></div>
    <section class="consulta-header"><span>Consulta publica</span><h1>Fidelizacion</h1><p>Consulta puntos, nivel e historial de movimientos del cliente.</p></section>
    <section class="search-panel"><div class="search-control"><i class="pi pi-search"></i><InputText v-model="criterio" placeholder="Codigo, cedula, RNC, telefono o nombre" @keyup.enter="buscar" /></div><Button label="Buscar" icon="pi pi-arrow-right" iconPos="right" :loading="buscando" @click="buscar" /></section>
    <section v-if="cliente" class="summary-grid"><article><span>Cliente</span><strong>{{ cliente.nombre }}</strong></article><article><span>Puntos</span><strong>{{ puntos.toLocaleString() }}</strong></article><article><span>Nivel</span><strong><Tag :value="nivel" severity="warning" /></strong></article><article><span>Total comprado</span><strong>{{ moneda(totalComprado) }}</strong></article></section>
    <section class="table-panel"><div class="table-header"><h2>Historial de puntos</h2><span>{{ historial.length }} movimiento(s)</span></div>
      <DataTable :value="historial" :paginator="historial.length > 10" :rows="10" stripedRows responsiveLayout="scroll">
        <Column field="fecha" header="Fecha" /><Column field="hora" header="Hora" /><Column field="tipo_movimiento" header="Tipo" /><Column field="descripcion" header="Descripcion" /><Column field="no_factura" header="Factura" /><Column field="puntos" header="Puntos" />
      </DataTable>
    </section>
  </main></div>
</template>

<style scoped>
.consulta-page{min-height:100vh;padding:2rem 1rem;background:linear-gradient(180deg,#f8fafc,#eef2f7);color:#172033}.consulta-shell{width:min(1160px,100%);margin:0 auto}.top-actions{margin-bottom:1rem}.consulta-header{text-align:center;margin-bottom:1rem}.consulta-header span{color:#f59e0b;font-size:.78rem;font-weight:800;text-transform:uppercase}.consulta-header h1{margin:.25rem 0;font-size:3rem;line-height:1.05}.consulta-header p{margin:0;color:#64748b}.search-panel,.table-panel,.summary-grid article{background:#fff;border:1px solid #e2e8f0;border-radius:8px;box-shadow:0 18px 45px rgba(15,23,42,.08)}.search-panel{display:grid;grid-template-columns:1fr auto;gap:.9rem;padding:1rem;margin-bottom:1rem}.search-control{position:relative}.search-control i{position:absolute;left:.9rem;top:50%;transform:translateY(-50%);color:#64748b}.search-control :deep(.p-inputtext){width:100%;height:3rem;padding-left:2.6rem}.search-panel :deep(.p-button){height:3rem;min-width:9rem}.summary-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:1rem;margin-bottom:1rem}.summary-grid article{padding:1rem;display:grid;gap:.35rem}.summary-grid span,.table-header span{color:#64748b;font-size:.86rem;font-weight:700}.summary-grid strong{font-size:1.25rem;overflow-wrap:anywhere}.table-panel{padding:1rem}.table-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:.9rem}.table-header h2{margin:0;font-size:1.25rem}.table-panel :deep(.p-datatable-thead>tr>th){background:#f1f5f9;color:#334155}@media(max-width:760px){.consulta-header h1{font-size:2.25rem}.search-panel,.summary-grid{grid-template-columns:1fr}.search-panel :deep(.p-button){width:100%}}
</style>
