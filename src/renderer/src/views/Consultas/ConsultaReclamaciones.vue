<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Button from 'primevue/button'
import Column from 'primevue/column'
import DataTable from 'primevue/datatable'
import InputText from 'primevue/inputtext'
import Tag from 'primevue/tag'
import { useToast } from 'primevue/usetoast'
import { peticionesFetchOffline } from '@/funciones/funciones.js'

const toast = useToast()
const route = useRoute()
const router = useRouter()
const criterio = ref('')
const buscando = ref(false)
const reclamos = ref([])

const texto = (value) => String(value || '').trim().toLowerCase()
const array = (value) => Array.isArray(value) ? value : Array.isArray(value?.data) ? value.data : []
const coincide = (value, query) => texto(value).includes(texto(query))
const abiertos = computed(() => reclamos.value.filter((r) => !texto(r.estado_reclamacion).includes('cerr')).length)

const severity = (estado) => {
  const value = texto(estado)
  if (value.includes('cerr') || value.includes('resuelt')) return 'success'
  if (value.includes('rech')) return 'danger'
  if (value.includes('pend') || value.includes('proceso')) return 'warning'
  return 'info'
}

const buscar = async () => {
  const query = criterio.value.trim()
  if (!query) {
    toast.add({ severity: 'warn', summary: 'Dato requerido', detail: 'Coloca reclamacion, factura, cliente o telefono.', life: 2500 })
    return
  }
  buscando.value = true
  reclamos.value = []
  try {
    const rows = array(await peticionesFetchOffline('getDataAsArray', 'reclamaciones'))
    reclamos.value = rows.filter((item) =>
      coincide(item.no_reclamacion, query) ||
      coincide(item.no_factura, query) ||
      coincide(item.nombre, query) ||
      coincide(item.telefono, query) ||
      coincide(item.articulo_reclamado, query)
    ).sort((a, b) => String(b.fecha_emision || '').localeCompare(String(a.fecha_emision || '')))
    if (!reclamos.value.length) toast.add({ severity: 'info', summary: 'Sin resultados', detail: 'No se encontraron reclamaciones.', life: 3000 })
  } catch (error) {
    console.error('[ConsultaReclamaciones] Error:', error)
    toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo consultar reclamaciones.', life: 3500 })
  } finally {
    buscando.value = false
  }
}

onMounted(() => {
  const query = Array.isArray(route.query?.q) ? route.query.q[0] : route.query?.q
  if (query) { criterio.value = String(query); buscar() }
})
</script>

<template>
  <div class="consulta-page">
    <main class="consulta-shell">
      <div class="top-actions"><Button label="Volver" icon="pi pi-arrow-left" severity="secondary" outlined @click="router.back()" /></div>
      <section class="consulta-header"><span>Consulta publica</span><h1>Reclamaciones</h1><p>Consulta garantias o reclamaciones por numero, factura, cliente, telefono o articulo.</p></section>
      <section class="search-panel"><div class="search-control"><i class="pi pi-search"></i><InputText v-model="criterio" placeholder="Reclamacion, factura, cliente, telefono o articulo" @keyup.enter="buscar" /></div><Button label="Buscar" icon="pi pi-arrow-right" iconPos="right" :loading="buscando" @click="buscar" /></section>
      <section v-if="reclamos.length" class="summary-grid"><article><span>Reclamaciones</span><strong>{{ reclamos.length }}</strong></article><article><span>Abiertas</span><strong>{{ abiertos }}</strong></article></section>
      <section class="table-panel">
        <div class="table-header"><h2>Resultados</h2><span>{{ reclamos.length }} registro(s)</span></div>
        <DataTable :value="reclamos" :paginator="reclamos.length > 10" :rows="10" stripedRows responsiveLayout="scroll">
          <Column field="no_reclamacion" header="Reclamacion" />
          <Column field="no_factura" header="Factura" />
          <Column field="nombre" header="Cliente" />
          <Column field="telefono" header="Telefono" />
          <Column field="articulo_reclamado" header="Articulo" />
          <Column field="fecha_emision" header="Fecha" />
          <Column header="Estado"><template #body="{ data }"><Tag :value="data.estado_reclamacion || '-'" :severity="severity(data.estado_reclamacion)" /></template></Column>
          <Column field="resultado_reclamacion" header="Resultado" />
        </DataTable>
      </section>
    </main>
  </div>
</template>

<style scoped>
.consulta-page{min-height:100vh;padding:2rem 1rem;background:linear-gradient(180deg,#f8fafc,#eef2f7);color:#172033}.consulta-shell{width:min(1160px,100%);margin:0 auto}.top-actions{margin-bottom:1rem}.consulta-header{text-align:center;margin-bottom:1rem}.consulta-header span{color:#dc2626;font-size:.78rem;font-weight:800;text-transform:uppercase}.consulta-header h1{margin:.25rem 0;font-size:3rem;line-height:1.05}.consulta-header p{margin:0;color:#64748b}.search-panel,.table-panel,.summary-grid article{background:#fff;border:1px solid #e2e8f0;border-radius:8px;box-shadow:0 18px 45px rgba(15,23,42,.08)}.search-panel{display:grid;grid-template-columns:1fr auto;gap:.9rem;padding:1rem;margin-bottom:1rem}.search-control{position:relative}.search-control i{position:absolute;left:.9rem;top:50%;transform:translateY(-50%);color:#64748b}.search-control :deep(.p-inputtext){width:100%;height:3rem;padding-left:2.6rem}.search-panel :deep(.p-button){height:3rem;min-width:9rem}.summary-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:1rem;margin-bottom:1rem}.summary-grid article{padding:1rem;display:grid;gap:.35rem}.summary-grid span,.table-header span{color:#64748b;font-size:.86rem;font-weight:700}.summary-grid strong{font-size:1.25rem}.table-panel{padding:1rem}.table-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:.9rem}.table-header h2{margin:0;font-size:1.25rem}.table-panel :deep(.p-datatable-thead>tr>th){background:#f1f5f9;color:#334155}@media(max-width:760px){.consulta-header h1{font-size:2.25rem}.search-panel,.summary-grid{grid-template-columns:1fr}.search-panel :deep(.p-button){width:100%}}
</style>
