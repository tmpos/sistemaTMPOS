<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import { peticionesFetchOffline } from '../../funciones/funciones.js'
import { ejecutarDiagnostico } from './integridadCore.js'

const router = useRouter(); const toast = useToast(); const loading = ref(false); const hallazgos = ref([])
const severidad = ref(''); const modulo = ref(''); const busqueda = ref(''); const ultimaRevision = ref('')
const tablas = { productos: 'productos', bancos: 'banco', asientos: 'asientodiario', cxc: 'cuentas_cobrar', cxp: 'cuentasxpagar', facturas: 'facturas', compras: 'compras', logsElectronicos: 'facturacion_electronica_log' }

const analizar = async () => {
  loading.value = true
  try {
    const keys = Object.keys(tablas)
    const results = await Promise.allSettled(keys.map((key) => peticionesFetchOffline('getDataAsArray', tablas[key])))
    const data = Object.fromEntries(keys.map((key, index) => [key, results[index].status === 'fulfilled' && Array.isArray(results[index].value) ? results[index].value : []]))
    hallazgos.value = ejecutarDiagnostico(data)
    ultimaRevision.value = new Intl.DateTimeFormat('es-DO', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date())
    toast.add({ severity: hallazgos.value.length ? 'warn' : 'success', summary: 'Revisión completada', detail: hallazgos.value.length ? `${hallazgos.value.length} situaciones requieren revisión.` : 'No se encontraron inconsistencias.', life: 3500 })
  } catch (error) {
    console.error('Error ejecutando diagnóstico:', error)
    toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo completar el diagnóstico.', life: 3500 })
  } finally { loading.value = false }
}
const modulos = computed(() => [...new Set(hallazgos.value.map((row) => row.modulo))].sort())
const filtrados = computed(() => { const q = busqueda.value.toLowerCase().trim(); return hallazgos.value.filter((row) => (!severidad.value || row.severidad === severidad.value) && (!modulo.value || row.modulo === modulo.value) && (!q || [row.titulo,row.detalle,row.referencia,row.codigo].some((v) => String(v || '').toLowerCase().includes(q)))) })
const count = (level) => hallazgos.value.filter((row) => row.severidad === level).length
const severity = (level) => ({ CRITICA: 'danger', ALTA: 'warn', MEDIA: 'info' }[level] || 'secondary')
const abrir = (row) => row.ruta && router.push(row.ruta)
onMounted(analizar)
</script>

<template><main class="integrity-page"><div class="page-wrap">
  <header class="page-header"><div><span>CONTROL INTERNO</span><h1>Centro de Integridad del Sistema</h1><p>Detecta diferencias entre inventario, contabilidad, cartera, bancos y facturación electrónica.</p></div><Button label="Ejecutar diagnóstico" icon="pi pi-shield" :loading="loading" @click="analizar"/></header>
  <section class="status" :class="hallazgos.length?'status-warn':'status-ok'"><i :class="hallazgos.length?'pi pi-exclamation-triangle':'pi pi-check-circle'"></i><div><strong>{{ hallazgos.length ? 'Se encontraron situaciones que requieren atención' : 'Los controles revisados están correctos' }}</strong><span>{{ ultimaRevision ? 'Última revisión: '+ultimaRevision : 'Preparando revisión...' }}</span></div></section>
  <section class="stats"><button :class="{active:severidad===''}" @click="severidad=''">Todos<strong>{{ hallazgos.length }}</strong></button><button :class="{active:severidad==='CRITICA'}" @click="severidad='CRITICA'">Críticos<strong>{{ count('CRITICA') }}</strong></button><button :class="{active:severidad==='ALTA'}" @click="severidad='ALTA'">Altos<strong>{{ count('ALTA') }}</strong></button><button :class="{active:severidad==='MEDIA'}" @click="severidad='MEDIA'">Medios<strong>{{ count('MEDIA') }}</strong></button></section>
  <section class="filters"><div><i class="pi pi-search"></i><input v-model="busqueda" placeholder="Buscar código, documento o descripción..."/></div><select v-model="modulo"><option value="">Todos los módulos</option><option v-for="item in modulos" :key="item">{{ item }}</option></select><Button label="Limpiar" icon="pi pi-filter-slash" severity="secondary" outlined @click="busqueda='';modulo='';severidad=''"/></section>
  <section class="table-card"><DataTable :value="filtrados" :loading="loading" paginator :rows="15" :rowsPerPageOptions="[10,15,25,50]" stripedRows scrollable scrollHeight="570px" dataKey="id"><template #empty><div class="empty"><i class="pi pi-check-circle"></i><strong>No hay situaciones en este filtro</strong><span>Los datos revisados no presentan inconsistencias conocidas.</span></div></template><Column field="severidad" header="Prioridad" sortable :style="{minWidth:'110px'}"><template #body="{data}"><Tag :value="data.severidad" :severity="severity(data.severidad)" rounded/></template></Column><Column field="modulo" header="Módulo" sortable :style="{minWidth:'180px'}"/><Column field="titulo" header="Situación" sortable :style="{minWidth:'240px'}"><template #body="{data}"><div class="finding"><strong>{{ data.titulo }}</strong><code>{{ data.codigo }}</code></div></template></Column><Column field="detalle" header="Detalle" :style="{minWidth:'330px'}"/><Column field="referencia" header="Referencia" :style="{minWidth:'145px'}"><template #body="{data}"><code>{{ data.referencia || '—' }}</code></template></Column><Column header="Revisar" :style="{minWidth:'90px'}"><template #body="{data}"><Button icon="pi pi-external-link" severity="secondary" text rounded :disabled="!data.ruta" @click="abrir(data)"/></template></Column></DataTable></section>
</div><Toast/></main></template>

<style scoped>
.integrity-page{min-height:100vh;background:#f3f6fb;color:#24324a}.page-wrap{padding:28px 32px 50px}.page-header{display:flex;align-items:center;justify-content:space-between;gap:20px;margin-bottom:20px}.page-header>div>span{font-size:.75rem;font-weight:800;letter-spacing:.08em;color:#2563eb}.page-header h1{font-size:2rem;margin:3px 0;color:#172238}.page-header p{margin:0;color:#68768d}.status{display:flex;align-items:center;gap:13px;border:1px solid;border-radius:13px;padding:15px 18px;margin-bottom:14px}.status>i{font-size:1.7rem}.status div{display:flex;flex-direction:column}.status span{font-size:.78rem;opacity:.8}.status-warn{background:#fff8e9;border-color:#efd397;color:#9a5d0a}.status-ok{background:#edfaf3;border-color:#b7e2ca;color:#08784e}.stats{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:14px}.stats button{background:#fff;border:1px solid #dfe6f0;border-radius:12px;padding:14px 17px;text-align:left;color:#68758b;display:flex;justify-content:space-between;align-items:center}.stats button strong{font-size:1.35rem;color:#24324a}.stats button.active{border-color:#5879eb;box-shadow:0 0 0 2px rgba(88,121,235,.12)}.filters,.table-card{background:#fff;border:1px solid #dfe6f0;border-radius:14px;box-shadow:0 6px 20px rgba(30,50,80,.05)}.filters{display:grid;grid-template-columns:1fr 250px auto;gap:10px;padding:15px;margin-bottom:14px}.filters>div{height:42px;border:1px solid #cad4e2;border-radius:9px;display:flex;align-items:center;gap:8px;padding:0 11px}.filters input{border:0;outline:0;width:100%}.filters select{border:1px solid #cad4e2;border-radius:9px;padding:0 10px;background:#fff}.table-card{overflow:hidden}.finding{display:flex;flex-direction:column;gap:4px}.finding code,td code{font-size:.7rem;color:#60708a;background:#eef2f7;padding:2px 5px;border-radius:4px;width:max-content}.empty{min-height:260px;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:7px;color:#728096}.empty i{font-size:2.4rem;color:#1b9a63}@media(max-width:750px){.page-wrap{padding:18px 12px}.page-header{align-items:flex-start;flex-direction:column}.stats,.filters{grid-template-columns:1fr}}
</style>
