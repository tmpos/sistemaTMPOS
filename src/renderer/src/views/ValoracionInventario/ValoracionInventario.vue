<template>
  <main class="valuation-page">
    <header class="page-header"><div><span class="eyebrow">INVENTARIO Y CONTABILIDAD</span><h1>Valoración y costo de inventario</h1><p>Compara costo, valor de venta, margen y saldos contables.</p></div><Button label="Actualizar valoración" icon="pi pi-refresh" :loading="loading" @click="cargar" /></header>

    <section class="stats">
      <article><i class="pi pi-box blue"></i><div><span>Valor a costo</span><strong>{{ dinero(analisis.resumen.valorCosto) }}</strong><small>{{ numero(analisis.resumen.unidades) }} unidades</small></div></article>
      <article><i class="pi pi-shopping-cart purple"></i><div><span>Valor potencial de venta</span><strong>{{ dinero(analisis.resumen.valorVenta) }}</strong><small>{{ numero(analisis.resumen.productos) }} productos</small></div></article>
      <article><i class="pi pi-chart-line green"></i><div><span>Margen potencial</span><strong>{{ dinero(analisis.resumen.margen) }}</strong><small>{{ porcentajeMargen }}% sobre venta</small></div></article>
      <article class="alert-card"><i class="pi pi-exclamation-triangle orange"></i><div><span>Alertas de valoración</span><strong>{{ totalAlertas }}</strong><small>{{ analisis.resumen.stockNegativo }} negativos · {{ analisis.resumen.sinCosto }} sin costo</small></div></article>
    </section>

    <Card class="reconciliation-card">
      <template #title><div class="card-title"><i class="pi pi-calculator"></i>Reconciliación contable</div></template>
      <template #content>
        <div class="account-selectors">
          <label>Cuenta de inventario<Select v-model="cuentaInventario" :options="cuentas" optionLabel="nombre" optionValue="nombre" filter showClear placeholder="Seleccione la cuenta de activo" fluid /></label>
          <label>Cuenta de costo de venta<Select v-model="cuentaCostoVentas" :options="cuentas" optionLabel="nombre" optionValue="nombre" filter showClear placeholder="Seleccione la cuenta de gasto" fluid /></label>
        </div>
        <div class="reconciliation-grid">
          <div><span>Inventario calculado</span><strong>{{ dinero(reconciliacion.inventario.calculado) }}</strong></div><div><span>Saldo contable inventario</span><strong>{{ dinero(reconciliacion.inventario.saldo) }}</strong><small>{{ reconciliacion.inventario.movimientos }} movimientos</small></div><div :class="claseDiferencia(reconciliacion.inventario.diferencia)"><span>Diferencia inventario</span><strong>{{ dinero(reconciliacion.inventario.diferencia) }}</strong></div>
          <div><span>Costo vendido estimado</span><strong>{{ dinero(reconciliacion.costoVentas.calculado) }}</strong></div><div><span>Saldo contable costo venta</span><strong>{{ dinero(reconciliacion.costoVentas.saldo) }}</strong><small>{{ reconciliacion.costoVentas.movimientos }} movimientos</small></div><div :class="claseDiferencia(reconciliacion.costoVentas.diferencia)"><span>Diferencia costo venta</span><strong>{{ dinero(reconciliacion.costoVentas.diferencia) }}</strong></div>
        </div>
        <Message v-if="!cuentaInventario || !cuentaCostoVentas" severity="info" :closable="false">Selecciona ambas cuentas para completar la reconciliación. Los valores contables se calculan desde los asientos diarios.</Message>
      </template>
    </Card>

    <Card>
      <template #content>
        <div class="filters"><span class="search"><i class="pi pi-search"></i><InputText v-model="busqueda" placeholder="Código o producto..." /></span><Select v-model="categoria" :options="categorias" showClear placeholder="Todas las categorías" /><Select v-model="almacen" :options="almacenes" showClear placeholder="Todos los almacenes" /><Select v-model="alerta" :options="alertas" optionLabel="label" optionValue="value" showClear placeholder="Todas las condiciones" /></div>
        <DataTable :value="filas" :loading="loading" paginator :rows="15" :rowsPerPageOptions="[15,30,50]" dataKey="id" stripedRows responsiveLayout="scroll">
          <template #empty><div class="empty"><i class="pi pi-inbox"></i><p>No hay productos para los filtros seleccionados.</p></div></template>
          <Column field="codigo" header="Producto" sortable><template #body="{data}"><button class="product-link" @click="verDetalle(data)">{{ data.nombre }}</button><small>{{ data.codigo || data.codigo_barra || 'Sin código' }} · {{ data.almacen || 'Sin almacén' }}</small></template></Column>
          <Column field="categoria" header="Categoría" sortable />
          <Column field="stock" header="Stock" sortable><template #body="{data}"><span :class="{danger:data.stock<0}">{{ numero(data.stock) }}</span></template></Column>
          <Column field="costo_promedio" header="Costo promedio" sortable><template #body="{data}">{{ dinero(data.costo_promedio) }}<small v-if="data.historial_compras.length">{{ data.historial_compras.length }} compras</small></template></Column>
          <Column field="ultimo_costo" header="Último costo" sortable><template #body="{data}">{{ dinero(data.ultimo_costo) }}</template></Column>
          <Column field="valor_costo" header="Valor costo" sortable><template #body="{data}"><strong>{{ dinero(data.valor_costo) }}</strong></template></Column>
          <Column field="valor_venta" header="Valor venta" sortable><template #body="{data}">{{ dinero(data.valor_venta) }}</template></Column>
          <Column field="margen_porcentaje" header="Margen" sortable><template #body="{data}"><span :class="{danger:data.margen_unitario<0,success:data.margen_unitario>=0}">{{ data.margen_porcentaje.toFixed(1) }}%</span></template></Column>
          <Column header="Condición"><template #body="{data}"><div class="tags"><Tag v-if="!data.alertas.length" value="Correcto" severity="success" /><Tag v-for="a in data.alertas" :key="a" :value="etiquetaAlerta(a)" severity="danger" /></div></template></Column>
          <Column header=""><template #body="{data}"><Button icon="pi pi-eye" text rounded @click="verDetalle(data)" /></template></Column>
        </DataTable>
      </template>
    </Card>

    <section class="groups">
      <Card><template #title>Valor por categoría</template><template #content><DataTable :value="analisis.porCategoria" size="small" stripedRows><Column field="nombre" header="Categoría" /><Column field="productos" header="Productos" /><Column header="Valor a costo"><template #body="{data}">{{ dinero(data.valorCosto) }}</template></Column><Column header="Margen"><template #body="{data}">{{ dinero(data.margen) }}</template></Column></DataTable></template></Card>
      <Card><template #title>Valor por almacén</template><template #content><DataTable :value="analisis.porAlmacen" size="small" stripedRows><Column field="nombre" header="Almacén" /><Column field="productos" header="Productos" /><Column header="Valor a costo"><template #body="{data}">{{ dinero(data.valorCosto) }}</template></Column><Column header="Valor venta"><template #body="{data}">{{ dinero(data.valorVenta) }}</template></Column></DataTable></template></Card>
    </section>

    <Dialog v-model:visible="dialogoDetalle" modal header="Detalle de valoración" :style="{width:'850px',maxWidth:'96vw'}">
      <template v-if="seleccionado"><div class="detail-header"><div><small>PRODUCTO</small><strong>{{ seleccionado.nombre }}</strong><p>{{ seleccionado.codigo }} · {{ seleccionado.almacen }}</p></div><div class="tags"><Tag v-for="a in seleccionado.alertas" :key="a" :value="etiquetaAlerta(a)" severity="danger" /><Tag v-if="!seleccionado.alertas.length" value="Valoración correcta" severity="success" /></div></div>
        <div class="detail-values"><div><span>Stock</span><strong>{{ numero(seleccionado.stock) }}</strong></div><div><span>Costo actual</span><strong>{{ dinero(seleccionado.costo_actual) }}</strong></div><div><span>Costo promedio</span><strong>{{ dinero(seleccionado.costo_promedio) }}</strong></div><div><span>Último costo</span><strong>{{ dinero(seleccionado.ultimo_costo) }}</strong></div><div><span>Precio venta</span><strong>{{ dinero(seleccionado.precio_venta_valoracion) }}</strong></div><div><span>Margen unitario</span><strong>{{ dinero(seleccionado.margen_unitario) }}</strong></div></div>
        <h3>Historial de compras usado para el costo promedio</h3><DataTable :value="seleccionado.historial_compras" size="small" stripedRows><template #empty>Sin compras históricas; se utilizó el costo actual del producto.</template><Column field="fecha" header="Fecha" /><Column field="documento" header="Documento" /><Column field="proveedor" header="Proveedor" /><Column field="cantidad" header="Cantidad" /><Column header="Costo unitario"><template #body="{data}">{{ dinero(data.costo) }}</template></Column></DataTable>
        <h3>Resumen de ventas</h3><div class="sales-summary"><span>Unidades vendidas: <strong>{{ numero(seleccionado.unidades_vendidas) }}</strong></span><span>Ingresos: <strong>{{ dinero(seleccionado.ingreso_ventas) }}</strong></span><span>Costo estimado: <strong>{{ dinero(seleccionado.costo_ventas_estimado) }}</strong></span></div>
      </template><template #footer><Button label="Cerrar" severity="secondary" @click="dialogoDetalle=false" /></template>
    </Dialog>
  </main>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useToast } from 'primevue/usetoast'
import { peticionesFetchOffline } from '@/funciones/funciones.js'
import { analizarInventario, filtrarValoracion, reconciliarInventario } from './valoracionInventarioCore.js'

const toast=useToast(), loading=ref(false), productos=ref([]), compras=ref([]), facturas=ref([]), asientos=ref([]), cuentas=ref([])
const busqueda=ref(''),categoria=ref(null),almacen=ref(null),alerta=ref(null),cuentaInventario=ref(null),cuentaCostoVentas=ref(null)
const dialogoDetalle=ref(false),seleccionado=ref(null)
const vacio={filas:[],resumen:{productos:0,unidades:0,valorCosto:0,valorVenta:0,margen:0,costoVentasEstimado:0,stockNegativo:0,sinCosto:0,margenNegativo:0},porCategoria:[],porAlmacen:[]}
const analisis=computed(()=>analizarInventario(productos.value,compras.value,facturas.value))
const filas=computed(()=>filtrarValoracion(analisis.value.filas,{busqueda:busqueda.value,categoria:categoria.value,almacen:almacen.value,alerta:alerta.value}))
const categorias=computed(()=>[...new Set(analisis.value.filas.map(f=>f.categoria||'SIN CLASIFICAR'))].sort())
const almacenes=computed(()=>[...new Set(analisis.value.filas.map(f=>f.almacen||'SIN ALMACÉN'))].sort())
const totalAlertas=computed(()=>analisis.value.resumen.stockNegativo+analisis.value.resumen.sinCosto+analisis.value.resumen.margenNegativo)
const porcentajeMargen=computed(()=>analisis.value.resumen.valorVenta?((analisis.value.resumen.margen/analisis.value.resumen.valorVenta)*100).toFixed(1):'0.0')
const reconciliacion=computed(()=>reconciliarInventario(analisis.value,asientos.value,cuentaInventario.value,cuentaCostoVentas.value))
const alertas=[{label:'Stock negativo',value:'STOCK_NEGATIVO'},{label:'Sin costo',value:'SIN_COSTO'},{label:'Margen negativo',value:'MARGEN_NEGATIVO'}]

function dinero(v){return new Intl.NumberFormat('es-DO',{style:'currency',currency:'DOP'}).format(Number(v)||0)}
function numero(v){return new Intl.NumberFormat('es-DO',{maximumFractionDigits:2}).format(Number(v)||0)}
function etiquetaAlerta(a){return ({STOCK_NEGATIVO:'Stock negativo',SIN_COSTO:'Sin costo',MARGEN_NEGATIVO:'Margen negativo'})[a]||a}
function claseDiferencia(v){return Math.abs(Number(v)||0)<0.01?'difference ok':'difference bad'}
function verDetalle(f){seleccionado.value=f;dialogoDetalle.value=true}
async function leerTabla(tabla){try{const r=await peticionesFetchOffline('getDataAsArray',tabla,'');return Array.isArray(r)?r:[]}catch{return []}}
async function cargar(){loading.value=true;try{const r=await Promise.all(['productos','compras','facturas','asientodiario','cuentas'].map(leerTabla));[productos.value,compras.value,facturas.value,asientos.value,cuentas.value]=r;if(!cuentaInventario.value)cuentaInventario.value=cuentas.value.find(c=>/INVENTARIO|MERCANC/.test(String(c.nombre||'').toUpperCase()))?.nombre||null;if(!cuentaCostoVentas.value)cuentaCostoVentas.value=cuentas.value.find(c=>/COSTO.*VENT/.test(String(c.nombre||'').toUpperCase()))?.nombre||null}catch(e){console.error(e);toast.add({severity:'error',summary:'Error',detail:'No se pudo completar la valoración.',life:4000})}finally{loading.value=false}}
onMounted(cargar)
</script>

<style scoped>
.valuation-page{padding:1.5rem;background:#f5f7fb;min-height:100vh;color:#25324b}.page-header{display:flex;align-items:center;justify-content:space-between;gap:1rem;margin-bottom:1.2rem}.eyebrow{color:#0f766e;font-size:.75rem;letter-spacing:.08em;font-weight:700}.page-header h1{font-size:1.8rem;margin:.2rem 0}.page-header p{margin:0;color:#64748b}.stats{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:1rem;margin-bottom:1rem}.stats article{display:flex;align-items:center;gap:.8rem;padding:1rem;background:#fff;border:1px solid #e4e9f2;border-radius:14px;box-shadow:0 3px 14px #0f172a0b}.stats i{font-size:1.4rem;padding:.7rem;border-radius:11px;background:#f1f5f9}.stats span,.stats small{display:block;color:#64748b;font-size:.78rem}.stats strong{display:block;font-size:1.2rem;margin:.12rem 0}.blue{color:#2563eb}.purple{color:#7c3aed}.green{color:#16a34a}.orange{color:#ea580c}.card-title{display:flex;align-items:center;gap:.5rem}.reconciliation-card{margin-bottom:1rem}.account-selectors{display:grid;grid-template-columns:1fr 1fr;gap:1rem;margin-bottom:1rem}.account-selectors label{display:flex;flex-direction:column;gap:.4rem;font-weight:600}.reconciliation-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:.7rem;margin-bottom:1rem}.reconciliation-grid>div{background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:.8rem}.reconciliation-grid span,.reconciliation-grid small{display:block;color:#64748b;font-size:.77rem}.reconciliation-grid strong{display:block;margin-top:.2rem}.difference.ok{background:#f0fdf4;border-color:#bbf7d0}.difference.bad{background:#fff7ed;border-color:#fed7aa}.filters{display:flex;align-items:center;gap:.7rem;flex-wrap:wrap;margin-bottom:1rem}.search{position:relative;display:flex;align-items:center;flex:1}.search i{position:absolute;left:.8rem;color:#94a3b8;z-index:1}.search input{padding-left:2.3rem;width:100%;min-width:240px}.product-link{display:block;border:0;background:none;color:#0f766e;font-weight:700;padding:0;cursor:pointer}.product-link+small,.p-datatable td>small{display:block;color:#64748b;margin-top:.2rem}.danger{color:#dc2626;font-weight:700}.success{color:#15803d;font-weight:700}.tags{display:flex;gap:.3rem;flex-wrap:wrap}.empty{text-align:center;color:#64748b;padding:2.5rem}.empty i{font-size:2rem}.groups{display:grid;grid-template-columns:1fr 1fr;gap:1rem;margin-top:1rem}.detail-header{display:flex;justify-content:space-between;gap:1rem}.detail-header small,.detail-header strong{display:block}.detail-header strong{font-size:1.3rem}.detail-header p{color:#64748b;margin:.2rem 0}.detail-values{display:grid;grid-template-columns:repeat(3,1fr);gap:.7rem;margin:1rem 0}.detail-values div{background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:.8rem}.detail-values span{display:block;color:#64748b;font-size:.8rem}.detail-values strong{display:block;margin-top:.2rem}.sales-summary{display:flex;gap:1rem;flex-wrap:wrap;background:#ecfdf5;border-radius:10px;padding:1rem}h3{font-size:1rem;margin:1.2rem 0 .6rem}@media(max-width:1000px){.stats{grid-template-columns:repeat(2,1fr)}.reconciliation-grid{grid-template-columns:repeat(2,1fr)}}@media(max-width:700px){.valuation-page{padding:.8rem}.page-header{align-items:flex-start;flex-direction:column}.account-selectors,.groups,.detail-values{grid-template-columns:1fr}.reconciliation-grid{grid-template-columns:1fr}}@media(max-width:460px){.stats{grid-template-columns:1fr}}
</style>
