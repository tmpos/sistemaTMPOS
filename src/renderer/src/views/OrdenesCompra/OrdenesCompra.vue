<script setup>
import { computed, onMounted, ref } from 'vue'
import { useToast } from 'primevue/usetoast'
import Swal from 'sweetalert2'
import { crearTablaSiNoExisteOffline, nfecha, peticionesFetchOffline } from '../../funciones/funciones.js'
import {
  aplicarRecepcion,
  calcularTotales,
  generarNumeroOrden,
  normalizarItem,
  parseItems,
  validarOrden
} from './ordenesCompraCore.js'

const toast = useToast()
const loading = ref(false)
const ordenes = ref([])
const proveedores = ref([])
const almacenes = ref([])
const productos = ref([])
const busqueda = ref('')
const estadoFiltro = ref('')
const crearVisible = ref(false)
const recibirVisible = ref(false)
const detalleVisible = ref(false)
const ordenSeleccionada = ref(null)
const recepcion = ref({})
const productoId = ref('')

const usuarioActual = () => {
  try { return JSON.parse(localStorage.getItem('usuarioLocal') || '[]')?.[0]?.usuario || 'Sistema' } catch { return 'Sistema' }
}
const hoy = () => nfecha('fechaAmericana') || new Date().toISOString().slice(0, 10)
const nuevaOrden = () => ({ numero: '', proveedor: '', almacen: '', fecha: hoy(), fecha_entrega: '', observacion: '', items: [] })
const formulario = ref(nuevaOrden())
const camposOrden = ['numero', 'proveedor', 'almacen', 'fecha', 'fecha_entrega', 'estado', 'items', 'subtotal', 'impuesto', 'total', 'observacion', 'usuario', 'fecha_recepcion', 'created_at', 'updated_at']
const camposRecepcion = ['orden_id', 'numero_orden', 'fecha', 'hora', 'items', 'unidades', 'usuario', 'created_at']

const cargarDatos = async () => {
  loading.value = true
  try {
    await Promise.all([
      crearTablaSiNoExisteOffline('ordenes_compra', camposOrden, toast),
      crearTablaSiNoExisteOffline('recepciones_orden_compra', camposRecepcion, toast)
    ])
    const results = await Promise.allSettled([
      peticionesFetchOffline('getDataAsArray', 'ordenes_compra'),
      peticionesFetchOffline('getDataAsArray', 'proveedores'),
      peticionesFetchOffline('getDataAsArray', 'empresa'),
      peticionesFetchOffline('getDataAsArray', 'productos')
    ])
    const value = (index) => results[index].status === 'fulfilled' && Array.isArray(results[index].value) ? results[index].value : []
    ordenes.value = value(0).map((order) => ({ ...order, itemsParsed: parseItems(order.items) })).reverse()
    proveedores.value = value(1)
    almacenes.value = value(2)
    productos.value = value(3)
  } catch (error) {
    console.error('Error cargando órdenes de compra:', error)
    toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar las órdenes de compra.', life: 4000 })
  } finally { loading.value = false }
}

const abrirNueva = () => {
  formulario.value = nuevaOrden()
  formulario.value.numero = generarNumeroOrden(ordenes.value)
  productoId.value = ''
  crearVisible.value = true
}

const productosDisponibles = computed(() => productos.value.filter((product) =>
  !formulario.value.almacen || !product.almacen || product.almacen === formulario.value.almacen
))
const totalesFormulario = computed(() => calcularTotales(formulario.value.items))

const agregarProducto = () => {
  const product = productos.value.find((row) => String(row.id) === String(productoId.value))
  if (!product) return
  if (formulario.value.items.some((row) => String(row.productoId) === String(product.id))) {
    toast.add({ severity: 'warn', summary: 'Producto repetido', detail: 'El producto ya está incluido.', life: 2500 })
    return
  }
  formulario.value.items.push(normalizarItem({
    productoId: product.id,
    codigo: product.codigo || product.codigo_barra,
    nombre: product.nombre || product.descripcion,
    cantidad: 1,
    costo: product.precio_compra,
    impuestoPorcentaje: product.impuestos
  }))
  productoId.value = ''
}

const guardarOrden = async () => {
  const errors = validarOrden(formulario.value)
  if (errors.length) {
    toast.add({ severity: 'warn', summary: 'Orden incompleta', detail: errors[0], life: 3500 })
    return
  }
  const totals = calcularTotales(formulario.value.items)
  const timestamp = nfecha('timestamp')
  const payload = {
    numero: formulario.value.numero,
    proveedor: formulario.value.proveedor,
    almacen: formulario.value.almacen,
    fecha: formulario.value.fecha,
    fecha_entrega: formulario.value.fecha_entrega,
    estado: 'BORRADOR',
    items: JSON.stringify(formulario.value.items.map(normalizarItem)),
    subtotal: totals.subtotal,
    impuesto: totals.impuesto,
    total: totals.total,
    observacion: formulario.value.observacion,
    usuario: usuarioActual(),
    fecha_recepcion: '',
    created_at: timestamp,
    updated_at: timestamp
  }
  const result = await peticionesFetchOffline('insertData', 'ordenes_compra', JSON.stringify(payload))
  if (result?.[0] === 'ok') {
    crearVisible.value = false
    await cargarDatos()
    toast.add({ severity: 'success', summary: 'Orden creada', detail: payload.numero, life: 3000 })
  } else toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo guardar la orden.', life: 3500 })
}

const actualizarEstado = async (order, estado) => {
  if (estado === 'CANCELADA') {
    const confirmacion = await Swal.fire({ title: '¿Cancelar la orden?', text: order.numero, icon: 'warning', showCancelButton: true, confirmButtonText: 'Cancelar orden', cancelButtonText: 'Volver' })
    if (!confirmacion.isConfirmed) return
  }
  const payload = { ...order, estado, updated_at: nfecha('timestamp') }
  delete payload.itemsParsed
  const result = await peticionesFetchOffline('updateData', 'ordenes_compra', JSON.stringify(payload))
  if (result?.[0] === 'ok') {
    await cargarDatos()
    toast.add({ severity: 'success', summary: 'Estado actualizado', detail: `${order.numero}: ${estado}`, life: 2800 })
  }
}

const abrirRecepcion = (order) => {
  ordenSeleccionada.value = order
  recepcion.value = Object.fromEntries(order.itemsParsed.map((item) => [item.productoId, Math.max(0, item.cantidad - item.cantidadRecibida)]))
  recibirVisible.value = true
}

const guardarRecepcion = async () => {
  const order = ordenSeleccionada.value
  const result = aplicarRecepcion(order.itemsParsed, recepcion.value)
  if (result.recibidasAhora <= 0) {
    toast.add({ severity: 'warn', summary: 'Sin cantidades', detail: 'Indica al menos una cantidad recibida.', life: 3000 })
    return
  }
  const confirmacion = await Swal.fire({ title: 'Confirmar recepción', text: `Se agregarán ${result.recibidasAhora} unidades al inventario.`, icon: 'question', showCancelButton: true, confirmButtonText: 'Recibir mercancía', cancelButtonText: 'Cancelar' })
  if (!confirmacion.isConfirmed) return

  loading.value = true
  try {
    for (const item of result.items.filter((row) => row.recibidaAhora > 0)) {
      const product = productos.value.find((row) => String(row.id) === String(item.productoId))
      if (!product) throw new Error(`No se encontró el producto ${item.nombre}.`)
      const updatedProduct = { ...product, stock: Number(product.stock || 0) + item.recibidaAhora, precio_compra: item.costo, updated_at: nfecha('timestamp') }
      const updated = await peticionesFetchOffline('updateData', 'productos', JSON.stringify(updatedProduct))
      if (updated?.[0] !== 'ok') throw new Error(`No se pudo actualizar el inventario de ${item.nombre}.`)
    }

    const itemsGuardados = result.items.map(({ recibidaAhora, ...item }) => item)
    const orderPayload = { ...order, estado: result.estado, items: JSON.stringify(itemsGuardados), fecha_recepcion: result.estado === 'RECIBIDA' ? hoy() : order.fecha_recepcion, updated_at: nfecha('timestamp') }
    delete orderPayload.itemsParsed
    const updatedOrder = await peticionesFetchOffline('updateData', 'ordenes_compra', JSON.stringify(orderPayload))
    if (updatedOrder?.[0] !== 'ok') throw new Error('El inventario cambió, pero no se pudo actualizar la orden.')

    await peticionesFetchOffline('insertData', 'recepciones_orden_compra', JSON.stringify({
      orden_id: order.id,
      numero_orden: order.numero,
      fecha: hoy(),
      hora: nfecha('hora'),
      items: JSON.stringify(result.items.filter((row) => row.recibidaAhora > 0)),
      unidades: result.recibidasAhora,
      usuario: usuarioActual(),
      created_at: nfecha('timestamp')
    }))
    recibirVisible.value = false
    await cargarDatos()
    toast.add({ severity: 'success', summary: 'Mercancía recibida', detail: `${result.recibidasAhora} unidades agregadas al inventario.`, life: 3500 })
  } catch (error) {
    console.error('Error recibiendo orden:', error)
    toast.add({ severity: 'error', summary: 'Recepción incompleta', detail: error.message, life: 5000 })
  } finally { loading.value = false }
}

const ordenesFiltradas = computed(() => {
  const query = busqueda.value.toLowerCase().trim()
  return ordenes.value.filter((order) => {
    if (estadoFiltro.value && order.estado !== estadoFiltro.value) return false
    if (!query) return true
    return [order.numero, order.proveedor, order.almacen, order.usuario, order.observacion].some((value) => String(value || '').toLowerCase().includes(query))
  })
})
const formatMoney = (value) => new Intl.NumberFormat('es-DO', { style: 'currency', currency: 'DOP' }).format(Number(value) || 0)
const severity = (estado) => ({ BORRADOR: 'secondary', ENVIADA: 'info', PARCIAL: 'warn', RECIBIDA: 'success', CANCELADA: 'danger' }[estado] || 'secondary')
const verDetalle = (order) => { ordenSeleccionada.value = order; detalleVisible.value = true }

onMounted(cargarDatos)
</script>

<template>
  <main class="purchase-orders-page">
    <div class="page-wrap">
      <header class="page-header">
        <div><span>COMPRAS</span><h1>Órdenes de Compra</h1><p>Controla lo solicitado, lo pendiente y la mercancía recibida de cada proveedor.</p></div>
        <div class="actions"><Button label="Actualizar" icon="pi pi-refresh" outlined :loading="loading" @click="cargarDatos"/><Button label="Nueva orden" icon="pi pi-plus" @click="abrirNueva"/></div>
      </header>

      <section class="filters">
        <div class="search"><i class="pi pi-search"></i><input v-model="busqueda" placeholder="Buscar número, proveedor, almacén..."/></div>
        <select v-model="estadoFiltro"><option value="">Todos los estados</option><option v-for="state in ['BORRADOR','ENVIADA','PARCIAL','RECIBIDA','CANCELADA']" :key="state">{{ state }}</option></select>
      </section>

      <section class="stats">
        <article><span>Órdenes</span><strong>{{ ordenesFiltradas.length }}</strong></article>
        <article><span>Pendientes</span><strong>{{ ordenesFiltradas.filter(o => ['ENVIADA','PARCIAL'].includes(o.estado)).length }}</strong></article>
        <article><span>Valor solicitado</span><strong>{{ formatMoney(ordenesFiltradas.reduce((s,o) => s + Number(o.total || 0), 0)) }}</strong></article>
      </section>

      <section class="table-card">
        <DataTable :value="ordenesFiltradas" :loading="loading" paginator :rows="15" :rowsPerPageOptions="[10,15,25,50]" stripedRows scrollable scrollHeight="580px" dataKey="id">
          <template #empty><div class="empty"><i class="pi pi-shopping-cart"></i><strong>No hay órdenes de compra</strong><span>Crea una orden para comenzar el seguimiento.</span></div></template>
          <Column field="numero" header="Orden" sortable :style="{minWidth:'155px'}"><template #body="{data}"><code>{{ data.numero }}</code></template></Column>
          <Column field="fecha" header="Fecha" sortable :style="{minWidth:'115px'}"/>
          <Column field="proveedor" header="Proveedor" sortable :style="{minWidth:'210px'}"/>
          <Column field="almacen" header="Recibir en" sortable :style="{minWidth:'170px'}"/>
          <Column header="Unidades" :style="{minWidth:'130px'}"><template #body="{data}">{{ calcularTotales(data.itemsParsed).recibidas }} / {{ calcularTotales(data.itemsParsed).unidades }}</template></Column>
          <Column field="total" header="Total" sortable :style="{minWidth:'140px'}"><template #body="{data}"><strong class="money">{{ formatMoney(data.total) }}</strong></template></Column>
          <Column field="estado" header="Estado" sortable :style="{minWidth:'120px'}"><template #body="{data}"><Tag :value="data.estado" :severity="severity(data.estado)" rounded/></template></Column>
          <Column header="Acciones" :style="{minWidth:'190px'}"><template #body="{data}"><div class="row-actions"><Button icon="pi pi-eye" text rounded @click="verDetalle(data)"/><Button v-if="data.estado === 'BORRADOR'" icon="pi pi-send" severity="info" text rounded v-tooltip.top="'Enviar orden'" @click="actualizarEstado(data,'ENVIADA')"/><Button v-if="['ENVIADA','PARCIAL'].includes(data.estado)" icon="pi pi-inbox" severity="success" text rounded v-tooltip.top="'Recibir mercancía'" @click="abrirRecepcion(data)"/><Button v-if="!['RECIBIDA','CANCELADA'].includes(data.estado)" icon="pi pi-times" severity="danger" text rounded v-tooltip.top="'Cancelar'" @click="actualizarEstado(data,'CANCELADA')"/></div></template></Column>
        </DataTable>
      </section>
    </div>

    <Dialog v-model:visible="crearVisible" modal header="Nueva orden de compra" :style="{width:'920px'}" :breakpoints="{'960px':'95vw'}">
      <div class="form-grid">
        <label><span>Número</span><input v-model="formulario.numero" readonly/></label>
        <label><span>Fecha</span><input v-model="formulario.fecha" type="date"/></label>
        <label><span>Entrega esperada</span><input v-model="formulario.fecha_entrega" type="date"/></label>
        <label><span>Proveedor *</span><select v-model="formulario.proveedor"><option value="">Seleccionar</option><option v-for="p in proveedores" :key="p.id" :value="p.nombre">{{ p.nombre }}</option></select></label>
        <label><span>Almacén receptor *</span><select v-model="formulario.almacen"><option value="">Seleccionar</option><option v-for="a in almacenes" :key="a.id" :value="a.nombre">{{ a.nombre }}</option></select></label>
        <label class="wide"><span>Observación</span><input v-model="formulario.observacion" placeholder="Condiciones o instrucciones..."/></label>
      </div>
      <div class="add-product"><select v-model="productoId"><option value="">Selecciona un producto</option><option v-for="p in productosDisponibles" :key="p.id" :value="p.id">{{ p.codigo }} · {{ p.nombre || p.descripcion }}</option></select><Button label="Agregar" icon="pi pi-plus" @click="agregarProducto"/></div>
      <DataTable :value="formulario.items" size="small" scrollable scrollHeight="300px">
        <Column field="codigo" header="Código"/><Column field="nombre" header="Producto" :style="{minWidth:'220px'}"/>
        <Column header="Cantidad"><template #body="{data}"><InputNumber v-model="data.cantidad" :min="1" :maxFractionDigits="2" inputStyle="width:85px"/></template></Column>
        <Column header="Costo"><template #body="{data}"><InputNumber v-model="data.costo" mode="currency" currency="DOP" locale="es-DO" :min="0" inputStyle="width:130px"/></template></Column>
        <Column header="ITBIS %"><template #body="{data}"><InputNumber v-model="data.impuestoPorcentaje" suffix="%" :min="0" inputStyle="width:85px"/></template></Column>
        <Column header="Total"><template #body="{data}">{{ formatMoney(normalizarItem(data).total) }}</template></Column>
        <Column><template #body="{index}"><Button icon="pi pi-trash" severity="danger" text rounded @click="formulario.items.splice(index,1)"/></template></Column>
      </DataTable>
      <div class="totals"><span>Subtotal: <strong>{{ formatMoney(totalesFormulario.subtotal) }}</strong></span><span>ITBIS: <strong>{{ formatMoney(totalesFormulario.impuesto) }}</strong></span><span>Total: <strong>{{ formatMoney(totalesFormulario.total) }}</strong></span></div>
      <template #footer><Button label="Cancelar" severity="secondary" text @click="crearVisible=false"/><Button label="Guardar borrador" icon="pi pi-save" @click="guardarOrden"/></template>
    </Dialog>

    <Dialog v-model:visible="recibirVisible" modal :header="'Recibir ' + (ordenSeleccionada?.numero || '')" :style="{width:'760px'}" :breakpoints="{'800px':'95vw'}">
      <Message severity="info" :closable="false">Solo las cantidades confirmadas se sumarán al inventario del almacén {{ ordenSeleccionada?.almacen }}.</Message>
      <DataTable :value="ordenSeleccionada?.itemsParsed || []" size="small">
        <Column field="nombre" header="Producto"/><Column field="cantidad" header="Solicitado"/><Column field="cantidadRecibida" header="Ya recibido"/>
        <Column header="Recibir ahora"><template #body="{data}"><InputNumber v-model="recepcion[data.productoId]" :min="0" :max="data.cantidad-data.cantidadRecibida" :maxFractionDigits="2" inputStyle="width:100px"/></template></Column>
      </DataTable>
      <template #footer><Button label="Cancelar" severity="secondary" text @click="recibirVisible=false"/><Button label="Confirmar recepción" icon="pi pi-check" severity="success" :loading="loading" @click="guardarRecepcion"/></template>
    </Dialog>

    <Dialog v-model:visible="detalleVisible" modal :header="'Detalle ' + (ordenSeleccionada?.numero || '')" :style="{width:'820px'}" :breakpoints="{'850px':'95vw'}">
      <div v-if="ordenSeleccionada" class="order-info"><div><span>Proveedor</span><strong>{{ ordenSeleccionada.proveedor }}</strong></div><div><span>Almacén</span><strong>{{ ordenSeleccionada.almacen }}</strong></div><div><span>Estado</span><Tag :value="ordenSeleccionada.estado" :severity="severity(ordenSeleccionada.estado)"/></div><div><span>Total</span><strong>{{ formatMoney(ordenSeleccionada.total) }}</strong></div></div>
      <DataTable :value="ordenSeleccionada?.itemsParsed || []" size="small"><Column field="codigo" header="Código"/><Column field="nombre" header="Producto"/><Column field="cantidad" header="Pedido"/><Column field="cantidadRecibida" header="Recibido"/><Column header="Pendiente"><template #body="{data}">{{ Math.max(0,data.cantidad-data.cantidadRecibida) }}</template></Column><Column header="Total"><template #body="{data}">{{ formatMoney(data.total) }}</template></Column></DataTable>
    </Dialog>
    <Toast/>
  </main>
</template>

<style scoped>
.purchase-orders-page{min-height:100vh;background:#f4f7fb;color:#24324a}.page-wrap{padding:28px 32px 50px}.page-header{display:flex;justify-content:space-between;align-items:center;gap:20px;margin-bottom:20px}.page-header span{font-size:.75rem;color:#2563eb;font-weight:800;letter-spacing:.08em}.page-header h1{font-size:2rem;margin:3px 0;color:#172238}.page-header p{margin:0;color:#68768c}.actions,.row-actions{display:flex;gap:8px}.filters,.stats,.table-card{background:#fff;border:1px solid #dfe6f0;border-radius:14px;box-shadow:0 6px 20px rgba(30,50,80,.05)}.filters{display:grid;grid-template-columns:1fr 240px;gap:12px;padding:16px;margin-bottom:14px}.search{height:42px;border:1px solid #cbd5e1;border-radius:9px;display:flex;align-items:center;gap:9px;padding:0 12px}.search input{border:0;outline:0;width:100%}.filters select,.form-grid input,.form-grid select,.add-product select{height:42px;border:1px solid #cbd5e1;border-radius:9px;padding:0 10px;background:#fff}.stats{display:grid;grid-template-columns:repeat(3,1fr);margin-bottom:14px;overflow:hidden}.stats article{padding:16px 20px;display:flex;flex-direction:column;border-right:1px solid #e5eaf2}.stats article:last-child{border:0}.stats span{font-size:.78rem;color:#748197}.stats strong{font-size:1.35rem;color:#1d2b42}.table-card{overflow:hidden}.empty{min-height:250px;display:flex;flex-direction:column;align-items:center;justify-content:center;color:#7a879b;gap:7px}.empty i{font-size:2.2rem}.money{color:#087c51}code{background:#eef3f9;padding:4px 7px;border-radius:5px;color:#3d587d}.form-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:16px}.form-grid label{display:flex;flex-direction:column;gap:5px}.form-grid label span{font-size:.76rem;font-weight:700;color:#637087}.form-grid .wide{grid-column:span 2}.add-product{display:grid;grid-template-columns:1fr auto;gap:8px;margin:12px 0}.totals{display:flex;justify-content:flex-end;gap:20px;background:#f5f8fc;padding:13px;margin-top:12px;border-radius:9px}.order-info{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:15px}.order-info>div{background:#f6f8fb;border:1px solid #e3e8f0;padding:12px;border-radius:9px;display:flex;flex-direction:column}.order-info span{font-size:.72rem;color:#748197;margin-bottom:4px}@media(max-width:800px){.page-wrap{padding:18px 12px}.page-header{align-items:flex-start;flex-direction:column}.filters,.stats,.form-grid,.order-info{grid-template-columns:1fr}.form-grid .wide{grid-column:auto}.totals{flex-direction:column;gap:5px}}
</style>
