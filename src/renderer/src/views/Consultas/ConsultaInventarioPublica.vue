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
const productos = ref([])
const imeis = ref([])

const texto = (value) => String(value || '').trim().toLowerCase()
const array = (value) => Array.isArray(value) ? value : Array.isArray(value?.data) ? value.data : []
const coincide = (value, query) => texto(value).includes(texto(query))
const numero = (value) => Number.isFinite(Number(value)) ? Number(value) : 0
const moneda = (value) => formatoMonedaRD(numero(value))
const stockTotal = computed(() => productos.value.reduce((acc, item) => acc + numero(item.stock), 0))

const severityStock = (stock) => numero(stock) > 0 ? 'success' : 'danger'
const severityImei = (estado) => texto(estado).includes('dispon') ? 'success' : texto(estado).includes('vend') ? 'danger' : 'info'

const buscar = async () => {
  const query = criterio.value.trim()
  if (!query) {
    toast.add({ severity: 'warn', summary: 'Dato requerido', detail: 'Coloca producto, codigo, barra, IMEI o serial.', life: 2500 })
    return
  }
  buscando.value = true
  productos.value = []
  imeis.value = []
  try {
    const [productosRaw, imeisRaw] = await Promise.all([
      peticionesFetchOffline('getDataAsArray', 'productos'),
      peticionesFetchOffline('getDataAsArray', 'imei')
    ])
    productos.value = array(productosRaw).filter((item) =>
      coincide(item.codigo, query) ||
      coincide(item.codigo_barra, query) ||
      coincide(item.nombre, query) ||
      coincide(item.descripcion, query) ||
      coincide(item.marca, query) ||
      coincide(item.modelo, query)
    )
    imeis.value = array(imeisRaw).filter((item) =>
      coincide(item.imei, query) ||
      coincide(item.equipo, query) ||
      coincide(item.marca, query) ||
      coincide(item.modelo, query) ||
      coincide(item.no_factura, query) ||
      coincide(item.comprador, query)
    )
    if (!productos.value.length && !imeis.value.length) toast.add({ severity: 'info', summary: 'Sin resultados', detail: 'No se encontraron productos ni seriales.', life: 3000 })
  } catch (error) {
    console.error('[ConsultaInventarioPublica] Error:', error)
    toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo consultar inventario.', life: 3500 })
  } finally {
    buscando.value = false
  }
}
onMounted(() => { const q = Array.isArray(route.query?.q) ? route.query.q[0] : route.query?.q; if (q) { criterio.value = String(q); buscar() } })
</script>

<template>
  <div class="consulta-page"><main class="consulta-shell">
    <div class="top-actions"><Button label="Volver" icon="pi pi-arrow-left" severity="secondary" outlined @click="router.back()" /></div>
    <section class="consulta-header"><span>Consulta publica</span><h1>Productos e IMEI</h1><p>Consulta productos, stock, precios publicos, IMEI o seriales.</p></section>
    <section class="search-panel"><div class="search-control"><i class="pi pi-search"></i><InputText v-model="criterio" placeholder="Producto, codigo, barra, IMEI o serial" @keyup.enter="buscar" /></div><Button label="Buscar" icon="pi pi-arrow-right" iconPos="right" :loading="buscando" @click="buscar" /></section>
    <section v-if="productos.length || imeis.length" class="summary-grid"><article><span>Productos</span><strong>{{ productos.length }}</strong></article><article><span>Stock total</span><strong>{{ stockTotal }}</strong></article><article><span>IMEI/Seriales</span><strong>{{ imeis.length }}</strong></article></section>
    <section class="table-panel"><div class="table-header"><h2>Productos</h2><span>{{ productos.length }} registro(s)</span></div>
      <DataTable :value="productos" :paginator="productos.length > 10" :rows="10" stripedRows responsiveLayout="scroll">
        <Column field="codigo" header="Codigo" /><Column field="nombre" header="Producto" /><Column field="categoria" header="Categoria" /><Column field="marca" header="Marca" /><Column field="modelo" header="Modelo" /><Column header="Precio"><template #body="{ data }">{{ moneda(data.precio_final || data.precio_venta) }}</template></Column><Column header="Stock"><template #body="{ data }"><Tag :value="String(data.stock || 0)" :severity="severityStock(data.stock)" /></template></Column>
      </DataTable>
    </section>
    <section class="table-panel second"><div class="table-header"><h2>IMEI / Seriales</h2><span>{{ imeis.length }} registro(s)</span></div>
      <DataTable :value="imeis" :paginator="imeis.length > 10" :rows="10" stripedRows responsiveLayout="scroll">
        <Column field="imei" header="IMEI/Serial" /><Column field="equipo" header="Equipo" /><Column field="marca" header="Marca" /><Column field="modelo" header="Modelo" /><Column field="comprador" header="Comprador" /><Column field="no_factura" header="Factura" /><Column header="Estado"><template #body="{ data }"><Tag :value="data.estado || '-'" :severity="severityImei(data.estado)" /></template></Column>
      </DataTable>
    </section>
  </main></div>
</template>

<style scoped>
.consulta-page{min-height:100vh;padding:2rem 1rem;background:linear-gradient(180deg,#f8fafc,#eef2f7);color:#172033}.consulta-shell{width:min(1160px,100%);margin:0 auto}.top-actions{margin-bottom:1rem}.consulta-header{text-align:center;margin-bottom:1rem}.consulta-header span{color:#0ea5e9;font-size:.78rem;font-weight:800;text-transform:uppercase}.consulta-header h1{margin:.25rem 0;font-size:3rem;line-height:1.05}.consulta-header p{margin:0;color:#64748b}.search-panel,.table-panel,.summary-grid article{background:#fff;border:1px solid #e2e8f0;border-radius:8px;box-shadow:0 18px 45px rgba(15,23,42,.08)}.search-panel{display:grid;grid-template-columns:1fr auto;gap:.9rem;padding:1rem;margin-bottom:1rem}.search-control{position:relative}.search-control i{position:absolute;left:.9rem;top:50%;transform:translateY(-50%);color:#64748b}.search-control :deep(.p-inputtext){width:100%;height:3rem;padding-left:2.6rem}.search-panel :deep(.p-button){height:3rem;min-width:9rem}.summary-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:1rem;margin-bottom:1rem}.summary-grid article{padding:1rem;display:grid;gap:.35rem}.summary-grid span,.table-header span{color:#64748b;font-size:.86rem;font-weight:700}.summary-grid strong{font-size:1.25rem}.table-panel{padding:1rem}.table-panel.second{margin-top:1rem}.table-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:.9rem}.table-header h2{margin:0;font-size:1.25rem}.table-panel :deep(.p-datatable-thead>tr>th){background:#f1f5f9;color:#334155}@media(max-width:760px){.consulta-header h1{font-size:2.25rem}.search-panel,.summary-grid{grid-template-columns:1fr}.search-panel :deep(.p-button){width:100%}}
</style>
