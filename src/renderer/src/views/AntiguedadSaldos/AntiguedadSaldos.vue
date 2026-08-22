<script setup>
import { computed, onMounted, ref } from 'vue'
import { useToast } from 'primevue/usetoast'
import { peticionesFetchOffline } from '../../funciones/funciones.js'
import { etiquetasTramo, mapearCuentasCobrar, mapearCuentasPagar, resumirTramos } from './antiguedadCore.js'

const toast = useToast()
const loading = ref(false)
const cobrar = ref([])
const pagar = ref([])
const tipo = ref('COBRAR')
const tramo = ref('')
const busqueda = ref('')
const almacen = ref('')
const fechaCorte = ref(new Date().toISOString().slice(0, 10))

const cargar = async () => {
  loading.value = true
  try {
    const [cxc, cxp] = await Promise.allSettled([
      peticionesFetchOffline('getDataAsArray', 'cuentas_cobrar'),
      peticionesFetchOffline('getDataAsArray', 'cuentasxpagar')
    ])
    cobrar.value = cxc.status === 'fulfilled' && Array.isArray(cxc.value) ? cxc.value : []
    pagar.value = cxp.status === 'fulfilled' && Array.isArray(cxp.value) ? cxp.value : []
  } catch (error) {
    console.error('Error cargando antigüedad de saldos:', error)
    toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar los saldos.', life: 3500 })
  } finally { loading.value = false }
}

const filasBase = computed(() => tipo.value === 'COBRAR'
  ? mapearCuentasCobrar(cobrar.value, fechaCorte.value)
  : mapearCuentasPagar(pagar.value, fechaCorte.value))
const resumen = computed(() => resumirTramos(filasBase.value))
const almacenes = computed(() => [...new Set(filasBase.value.map((row) => row.almacen).filter(Boolean))].sort())
const filas = computed(() => {
  const query = busqueda.value.trim().toLowerCase()
  return filasBase.value.filter((row) => {
    if (tramo.value && row.tramo !== tramo.value) return false
    if (almacen.value && row.almacen !== almacen.value) return false
    return !query || [row.tercero, row.identificacion, row.documento, row.telefono].some((value) => String(value || '').toLowerCase().includes(query))
  }).sort((a, b) => (b.diasVencidos ?? -99999) - (a.diasVencidos ?? -99999))
})
const saldoTotal = computed(() => filas.value.reduce((sum, row) => sum + row.saldo, 0))
const money = (value) => new Intl.NumberFormat('es-DO', { style: 'currency', currency: 'DOP' }).format(Number(value) || 0)
const date = (value) => value ? value.split('-').reverse().join('/') : 'Sin fecha'
const severity = (bucket) => ({ VIGENTE: 'success', '1_30': 'info', '31_60': 'warn', '61_90': 'danger', MAS_90: 'danger', SIN_FECHA: 'secondary' }[bucket])
const seleccionarTramo = (key) => { tramo.value = tramo.value === key ? '' : key }
const cambiarTipo = (value) => { tipo.value = value; tramo.value = ''; almacen.value = '' }

onMounted(cargar)
</script>

<template>
  <main class="aging-page">
    <div class="page-wrap">
      <header class="page-header">
        <div><span>CARTERA</span><h1>Antigüedad de Saldos</h1><p>Identifica cuentas vigentes, vencidas y los saldos que requieren atención inmediata.</p></div>
        <Button label="Actualizar" icon="pi pi-refresh" outlined :loading="loading" @click="cargar"/>
      </header>

      <section class="toolbar">
        <div class="type-switch"><button :class="{active:tipo==='COBRAR'}" @click="cambiarTipo('COBRAR')"><i class="pi pi-arrow-down-left"></i> Por cobrar</button><button :class="{active:tipo==='PAGAR'}" @click="cambiarTipo('PAGAR')"><i class="pi pi-arrow-up-right"></i> Por pagar</button></div>
        <label><span>Fecha de corte</span><input v-model="fechaCorte" type="date"/></label>
        <label><span>Almacén</span><select v-model="almacen"><option value="">Todos</option><option v-for="item in almacenes" :key="item">{{ item }}</option></select></label>
        <label class="search"><span>Buscar</span><div><i class="pi pi-search"></i><input v-model="busqueda" placeholder="Cliente, proveedor o documento..."/></div></label>
      </section>

      <section class="buckets">
        <button v-for="(label,key) in etiquetasTramo" :key="key" :class="['bucket', {selected:tramo===key}]" @click="seleccionarTramo(key)">
          <span>{{ label }}</span><strong>{{ money(resumen[key].saldo) }}</strong><small>{{ resumen[key].cantidad }} documentos</small>
        </button>
      </section>

      <section class="table-card">
        <div class="table-title"><div><h2>{{ tipo === 'COBRAR' ? 'Cuentas por cobrar' : 'Cuentas por pagar' }}</h2><p>{{ filas.length }} documentos al {{ date(fechaCorte) }}</p></div><strong>{{ money(saldoTotal) }}</strong></div>
        <DataTable :value="filas" :loading="loading" paginator :rows="15" :rowsPerPageOptions="[10,15,25,50,100]" stripedRows scrollable scrollHeight="560px" dataKey="id">
          <template #empty><div class="empty"><i class="pi pi-check-circle"></i><strong>No hay saldos en este filtro</strong></div></template>
          <Column field="tercero" :header="tipo === 'COBRAR' ? 'Cliente' : 'Proveedor'" sortable :style="{minWidth:'220px'}"><template #body="{data}"><div class="third"><strong>{{ data.tercero }}</strong><small>{{ data.identificacion }}</small></div></template></Column>
          <Column field="documento" header="Documento" sortable :style="{minWidth:'145px'}"><template #body="{data}"><code>{{ data.documento || '—' }}</code></template></Column>
          <Column field="fechaEmision" header="Emisión" sortable :style="{minWidth:'115px'}"><template #body="{data}">{{ date(data.fechaEmision) }}</template></Column>
          <Column field="fechaVencimiento" header="Vencimiento" sortable :style="{minWidth:'125px'}"><template #body="{data}">{{ date(data.fechaVencimiento) }}</template></Column>
          <Column field="diasVencidos" header="Días vencidos" sortable :style="{minWidth:'125px'}"><template #body="{data}"><span :class="{'overdue':data.diasVencidos>0}">{{ data.diasVencidos === null ? '—' : data.diasVencidos > 0 ? data.diasVencidos : 'Vigente' }}</span></template></Column>
          <Column field="tramo" header="Tramo" sortable :style="{minWidth:'140px'}"><template #body="{data}"><Tag :value="etiquetasTramo[data.tramo]" :severity="severity(data.tramo)" rounded/></template></Column>
          <Column field="saldo" header="Saldo" sortable :style="{minWidth:'150px'}"><template #body="{data}"><strong class="amount">{{ money(data.saldo) }}</strong></template></Column>
          <Column field="almacen" header="Almacén" :style="{minWidth:'150px'}"/>
        </DataTable>
      </section>
    </div><Toast/>
  </main>
</template>

<style scoped>
.aging-page{min-height:100vh;background:#f3f6fb;color:#23314a}.page-wrap{padding:28px 32px 50px}.page-header{display:flex;justify-content:space-between;align-items:center;gap:20px;margin-bottom:20px}.page-header>div>span{font-size:.75rem;font-weight:800;color:#2563eb;letter-spacing:.08em}.page-header h1{font-size:2rem;margin:3px 0;color:#172238}.page-header p,.table-title p{margin:0;color:#68768e}.toolbar,.table-card{background:#fff;border:1px solid #dfe6f0;border-radius:14px;box-shadow:0 6px 20px rgba(30,50,80,.05)}.toolbar{padding:16px;display:grid;grid-template-columns:auto 170px 190px 1fr;gap:13px;align-items:end;margin-bottom:14px}.toolbar label{display:flex;flex-direction:column;gap:5px}.toolbar label>span{font-size:.75rem;font-weight:700;color:#637087}.toolbar input,.toolbar select,.search div{height:42px;border:1px solid #cad4e2;border-radius:9px;background:white;padding:0 10px}.search div{display:flex;align-items:center;gap:8px}.search div input{border:0;outline:0;width:100%;padding:0}.type-switch{display:flex;background:#eef2f7;border-radius:10px;padding:4px}.type-switch button{border:0;background:transparent;border-radius:8px;padding:9px 13px;color:#66748a;font-weight:700}.type-switch button.active{background:#fff;color:#245cc4;box-shadow:0 2px 8px rgba(20,40,70,.12)}.buckets{display:grid;grid-template-columns:repeat(6,1fr);gap:10px;margin-bottom:14px}.bucket{text-align:left;background:#fff;border:1px solid #dfe6f0;border-radius:12px;padding:14px;display:flex;flex-direction:column;cursor:pointer}.bucket:hover,.bucket.selected{border-color:#5d7df0;box-shadow:0 0 0 2px rgba(93,125,240,.12)}.bucket span{font-size:.74rem;color:#6d7990}.bucket strong{font-size:1.05rem;color:#26354e;margin:4px 0}.bucket small{color:#8995a7}.table-card{overflow:hidden}.table-title{display:flex;justify-content:space-between;align-items:center;padding:18px 20px;border-bottom:1px solid #e4eaf2}.table-title h2{margin:0 0 3px;font-size:1.08rem}.table-title>strong{font-size:1.35rem;color:#087b50}.third{display:flex;flex-direction:column}.third small{color:#7b8799}.amount{color:#b13c3c}.overdue{color:#c83d3d;font-weight:700}code{background:#eef2f7;padding:4px 6px;border-radius:5px}.empty{min-height:220px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:7px;color:#748198}.empty i{font-size:2.2rem;color:#27a36a}@media(max-width:1100px){.toolbar{grid-template-columns:1fr 1fr}.buckets{grid-template-columns:repeat(3,1fr)}}@media(max-width:700px){.page-wrap{padding:18px 12px}.page-header{align-items:flex-start;flex-direction:column}.toolbar,.buckets{grid-template-columns:1fr}.table-title{align-items:flex-start;flex-direction:column;gap:10px}}
</style>
