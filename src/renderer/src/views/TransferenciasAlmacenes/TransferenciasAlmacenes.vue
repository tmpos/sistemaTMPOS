<template>
  <div class="transfer-page">
    <header class="page-header">
      <div>
        <span class="eyebrow">INVENTARIO</span>
        <h1>Transferencias entre almacenes</h1>
        <p>Solicita, despacha y recibe mercancía con trazabilidad completa.</p>
      </div>
      <div class="header-actions">
        <Button label="Actualizar" icon="pi pi-refresh" severity="secondary" outlined :loading="loading" @click="cargarTodo" />
        <Button label="Nueva transferencia" icon="pi pi-plus" @click="abrirNueva" />
      </div>
    </header>

    <section class="stats-grid">
      <article class="stat-card"><i class="pi pi-arrow-right-arrow-left blue"></i><div><span>Total</span><strong>{{ resumen.total }}</strong></div></article>
      <article class="stat-card"><i class="pi pi-clock orange"></i><div><span>Solicitadas</span><strong>{{ resumen.pendientes }}</strong></div></article>
      <article class="stat-card"><i class="pi pi-truck purple"></i><div><span>En tránsito</span><strong>{{ resumen.enTransito }}</strong></div></article>
      <article class="stat-card"><i class="pi pi-check-circle green"></i><div><span>Recibidas</span><strong>{{ resumen.recibidas }}</strong></div></article>
    </section>

    <Card>
      <template #content>
        <div class="filters">
          <span class="search-box"><i class="pi pi-search"></i><InputText v-model="busqueda" placeholder="Número, almacén, usuario..." /></span>
          <Select v-model="estadoFiltro" :options="opcionesEstadoFiltro" optionLabel="label" optionValue="value" placeholder="Todos los estados" showClear />
        </div>
        <DataTable :value="transferenciasFiltradas" :loading="loading" paginator :rows="10" :rowsPerPageOptions="[10, 25, 50]" dataKey="id" stripedRows responsiveLayout="scroll">
          <template #empty><div class="empty"><i class="pi pi-inbox"></i><p>No hay transferencias registradas.</p></div></template>
          <Column field="numero" header="Transferencia" sortable>
            <template #body="{ data }"><button class="number-link" @click="verDetalle(data)">{{ data.numero }}</button><small>{{ data.fecha }} {{ data.hora }}</small></template>
          </Column>
          <Column header="Ruta">
            <template #body="{ data }"><div class="route"><span>{{ data.almacen_origen }}</span><i class="pi pi-arrow-right"></i><span>{{ data.almacen_destino }}</span></div></template>
          </Column>
          <Column field="total_unidades" header="Unidades" sortable><template #body="{ data }">{{ formatearCantidad(data.total_unidades) }}</template></Column>
          <Column field="estado" header="Estado" sortable><template #body="{ data }"><Tag :value="etiquetaEstado(data.estado)" :severity="severidadEstado(data.estado)" /></template></Column>
          <Column header="Responsable"><template #body="{ data }">{{ responsableActual(data) }}</template></Column>
          <Column header="Acciones" :exportable="false">
            <template #body="{ data }">
              <div class="row-actions">
                <Button icon="pi pi-eye" text rounded v-tooltip.top="'Ver trazabilidad'" @click="verDetalle(data)" />
                <Button v-if="data.estado === 'BORRADOR'" icon="pi pi-send" severity="info" text rounded v-tooltip.top="'Solicitar'" @click="cambiarEstado(data, 'SOLICITADA')" />
                <Button v-if="data.estado === 'SOLICITADA'" icon="pi pi-truck" severity="warn" text rounded v-tooltip.top="'Despachar'" @click="despachar(data)" />
                <Button v-if="data.estado === 'DESPACHADA'" icon="pi pi-check" severity="success" text rounded v-tooltip.top="'Confirmar recepción'" @click="recibir(data)" />
                <Button v-if="['BORRADOR','SOLICITADA'].includes(data.estado)" icon="pi pi-times" severity="danger" text rounded v-tooltip.top="'Cancelar'" @click="cancelar(data)" />
              </div>
            </template>
          </Column>
        </DataTable>
      </template>
    </Card>

    <Dialog v-model:visible="dialogoNueva" modal header="Nueva transferencia" :style="{ width: '900px', maxWidth: '96vw' }">
      <div class="form-grid">
        <label>Almacén origen<Select v-model="form.almacen_origen" :options="nombresAlmacenes" filter placeholder="Seleccione" fluid @change="reiniciarItems" /></label>
        <label>Almacén destino<Select v-model="form.almacen_destino" :options="almacenesDestino" filter placeholder="Seleccione" fluid /></label>
        <label class="full">Observación<Textarea v-model="form.observacion" rows="2" fluid placeholder="Motivo o instrucciones para el traslado" /></label>
      </div>
      <div class="product-picker">
        <Select v-model="productoAAgregar" :options="productosSeleccionables" optionLabel="etiqueta" filter placeholder="Buscar producto del almacén origen" class="product-select" />
        <Button label="Agregar" icon="pi pi-plus" :disabled="!productoAAgregar" @click="agregarProducto" />
      </div>
      <DataTable :value="form.items" dataKey="producto_id_origen" size="small" class="items-table">
        <template #empty><div class="empty compact">Selecciona productos para transferir.</div></template>
        <Column field="codigo" header="Código" />
        <Column field="nombre" header="Producto" />
        <Column field="stock" header="Disponible" />
        <Column header="Cantidad"><template #body="{ data }"><InputNumber v-model="data.cantidad" :min="1" :max="Number(data.stock)" showButtons buttonLayout="horizontal" :step="1" /></template></Column>
        <Column header=""><template #body="{ data }"><Button icon="pi pi-trash" severity="danger" text rounded @click="quitarProducto(data)" /></template></Column>
      </DataTable>
      <Message v-if="erroresForm.length" severity="error" :closable="false"><ul><li v-for="error in erroresForm" :key="error">{{ error }}</li></ul></Message>
      <template #footer>
        <Button label="Cancelar" severity="secondary" text @click="dialogoNueva = false" />
        <Button label="Guardar borrador" icon="pi pi-save" :loading="guardando" @click="guardar('BORRADOR')" />
        <Button label="Guardar y solicitar" icon="pi pi-send" severity="success" :loading="guardando" @click="guardar('SOLICITADA')" />
      </template>
    </Dialog>

    <Dialog v-model:visible="dialogoDetalle" modal header="Trazabilidad de transferencia" :style="{ width: '820px', maxWidth: '96vw' }">
      <template v-if="seleccionada">
        <div class="detail-head">
          <div><small>TRANSFERENCIA</small><strong>{{ seleccionada.numero }}</strong></div>
          <Tag :value="etiquetaEstado(seleccionada.estado)" :severity="severidadEstado(seleccionada.estado)" />
        </div>
        <div class="route-large"><div><small>ORIGEN</small><strong>{{ seleccionada.almacen_origen }}</strong></div><i class="pi pi-arrow-right"></i><div><small>DESTINO</small><strong>{{ seleccionada.almacen_destino }}</strong></div></div>
        <DataTable :value="seleccionada.detalles || []" size="small" stripedRows>
          <Column field="codigo" header="Código" /><Column field="nombre" header="Producto" /><Column field="cantidad" header="Cantidad" />
          <Column header="Stock al despachar"><template #body="{ data }">{{ data.stock_origen_al_despachar || '—' }}</template></Column>
          <Column header="Stock al recibir"><template #body="{ data }">{{ data.stock_destino_al_recibir || '—' }}</template></Column>
        </DataTable>
        <h3 class="timeline-title">Historial</h3>
        <div class="timeline">
          <div v-for="(evento, index) in historialSeleccionada" :key="index" class="timeline-item">
            <span class="timeline-dot"></span><div><strong>{{ etiquetaEstado(evento.estado) }}</strong><p>{{ evento.usuario || 'Sistema' }} · {{ evento.fecha }}</p><small v-if="evento.nota">{{ evento.nota }}</small></div>
          </div>
        </div>
      </template>
      <template #footer><Button label="Cerrar" severity="secondary" @click="dialogoDetalle = false" /></template>
    </Dialog>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useToast } from 'primevue/usetoast'
import { nfecha, peticionesFetchOffline } from '@/funciones/funciones.js'
import { useDatosEmpresa } from '@/stores'
import { agregarEventoHistorial, calcularResumen, crearNumeroTransferencia, encontrarProductoDestino,
  filtrarTransferencias, numero, puedeTransicionar, validarTransferencia } from './transferenciasAlmacenesCore.js'

const TABLA = 'transferencias_almacenes'
const TABLA_DETALLE = 'transferencias_almacen_detalles'
const CAMPOS = ['numero','fecha','hora','estado','almacen_origen','almacen_destino','observacion','total_unidades',
  'solicitado_por','solicitado_at','despachado_por','despachado_at','recibido_por','recibido_at','cancelado_por','cancelado_at','historial']
const CAMPOS_DETALLE = ['transferencia_id','producto_id_origen','producto_id_destino','codigo','codigo_barra','nombre','categoria',
  'cantidad','stock_origen_al_solicitar','stock_origen_al_despachar','stock_destino_al_recibir','imeis']

const toast = useToast()
const datosEmpresa = useDatosEmpresa()
const loading = ref(false)
const guardando = ref(false)
const transferencias = ref([])
const productos = ref([])
const almacenes = ref([])
const busqueda = ref('')
const estadoFiltro = ref(null)
const dialogoNueva = ref(false)
const dialogoDetalle = ref(false)
const seleccionada = ref(null)
const productoAAgregar = ref(null)
const erroresForm = ref([])
const form = ref(nuevoFormulario())

const opcionesEstadoFiltro = [
  { label: 'Borrador', value: 'BORRADOR' }, { label: 'Solicitada', value: 'SOLICITADA' },
  { label: 'Despachada / En tránsito', value: 'DESPACHADA' }, { label: 'Recibida', value: 'RECIBIDA' },
  { label: 'Cancelada', value: 'CANCELADA' }
]
const nombresAlmacenes = computed(() => [...new Set(almacenes.value.map((a) => a.nombre).filter(Boolean))])
const almacenesDestino = computed(() => nombresAlmacenes.value.filter((nombre) => nombre !== form.value.almacen_origen))
const productosOrigen = computed(() => productos.value.filter((p) => String(p.almacen || '').trim().toUpperCase() === String(form.value.almacen_origen || '').trim().toUpperCase()))
const productosSeleccionables = computed(() => productosOrigen.value
  .filter((p) => numero(p.stock) > 0 && !form.value.items.some((item) => String(item.producto_id_origen) === String(p.id)))
  .map((p) => ({ ...p, etiqueta: `${p.codigo || p.codigo_barra || 'S/C'} · ${p.nombre} · Stock ${numero(p.stock)}` })))
const transferenciasFiltradas = computed(() => filtrarTransferencias(transferencias.value, { busqueda: busqueda.value, estado: estadoFiltro.value }))
const resumen = computed(() => calcularResumen(transferencias.value))
const historialSeleccionada = computed(() => {
  try { return JSON.parse(seleccionada.value?.historial || '[]') } catch { return [] }
})

function nuevoFormulario() { return { almacen_origen: '', almacen_destino: '', observacion: '', items: [] } }
function usuarioActual() { return datosEmpresa.usuario?.nombre || datosEmpresa.usuario?.usuario || 'Usuario' }
function ok(respuesta) { return Array.isArray(respuesta) ? respuesta[0] === 'ok' : respuesta?.success === true }
function formatearCantidad(valor) { return numero(valor).toLocaleString('es-DO') }
function etiquetaEstado(estado) { return ({ BORRADOR:'Borrador', SOLICITADA:'Solicitada', DESPACHADA:'En tránsito', RECIBIDA:'Recibida', CANCELADA:'Cancelada' })[estado] || estado }
function severidadEstado(estado) { return ({ BORRADOR:'secondary', SOLICITADA:'info', DESPACHADA:'warn', RECIBIDA:'success', CANCELADA:'danger' })[estado] || 'secondary' }
function responsableActual(t) { return t.recibido_por || t.despachado_por || t.solicitado_por || '—' }

async function asegurarEsquema() {
  await asegurarTabla(TABLA, CAMPOS)
  await asegurarTabla(TABLA_DETALLE, CAMPOS_DETALLE)
}

async function asegurarTabla(tabla, campos) {
  let existe = await peticionesFetchOffline('tableExists', tabla)
  if (existe?.[0] !== 'ok') {
    const creada = await peticionesFetchOffline('crearTabla', tabla, campos.join(','))
    if (!creada?.success) throw new Error(`No se pudo crear la tabla ${tabla}.`)
    existe = await peticionesFetchOffline('tableExists', tabla)
  }
  if (existe?.[0] !== 'ok') throw new Error(`La tabla ${tabla} no está disponible.`)
  const columnasRespuesta = await peticionesFetchOffline('getTableColumns', tabla)
  const columnas = Array.isArray(columnasRespuesta) ? columnasRespuesta : []
  for (const campo of campos.filter((nombre) => !columnas.includes(nombre))) {
    const agregada = await peticionesFetchOffline('addColumnToTable', { tabla, campo })
    if (!ok(agregada)) throw new Error(`No se pudo agregar ${campo} a ${tabla}.`)
  }
}

async function cargarTodo() {
  loading.value = true
  try {
    await asegurarEsquema()
    const [trs, prods, empresas] = await Promise.all([
      peticionesFetchOffline('getDataAsArray', TABLA, ''),
      peticionesFetchOffline('getDataAsArray', 'productos', ''),
      peticionesFetchOffline('getDataAsArray', 'empresa', '')
    ])
    productos.value = Array.isArray(prods) ? prods : []
    almacenes.value = Array.isArray(empresas) ? empresas : []
    const filas = Array.isArray(trs) ? trs : []
    transferencias.value = (await Promise.all(filas.map(async (t) => {
      const detalles = await peticionesFetchOffline('getDataArrayByCondition', TABLA_DETALLE, 'transferencia_id', t.id)
      return { ...t, detalles: Array.isArray(detalles) ? detalles : [] }
    }))).sort((a, b) => Number(b.id) - Number(a.id))
  } catch (error) {
    console.error('Error cargando transferencias:', error)
    toast.add({ severity:'error', summary:'Error', detail:'No se pudieron cargar las transferencias.', life:3500 })
  } finally { loading.value = false }
}

function abrirNueva() {
  form.value = nuevoFormulario()
  form.value.almacen_origen = datosEmpresa.empresa?.nombre || nombresAlmacenes.value[0] || ''
  erroresForm.value = []
  productoAAgregar.value = null
  dialogoNueva.value = true
}
function reiniciarItems() { form.value.items = []; form.value.almacen_destino = ''; productoAAgregar.value = null }
function agregarProducto() {
  const p = productoAAgregar.value
  if (!p) return
  form.value.items.push({ producto_id_origen:p.id, codigo:p.codigo, codigo_barra:p.codigo_barra, nombre:p.nombre,
    categoria:p.categoria, cantidad:1, stock:numero(p.stock) })
  productoAAgregar.value = null
}
function quitarProducto(item) { form.value.items = form.value.items.filter((i) => i !== item) }

async function guardar(estado) {
  const validacion = validarTransferencia(form.value, productosOrigen.value)
  erroresForm.value = validacion.errores
  if (!validacion.valido) return
  guardando.value = true
  const ahora = nfecha('timestamp')
  const usuario = usuarioActual()
  const consecutivo = transferencias.value.reduce((max, t) => Math.max(max, Number(String(t.numero || '').split('-').pop()) || 0), 0) + 1
  const historial = agregarEventoHistorial([], { estado, usuario, fecha: ahora, nota: estado === 'BORRADOR' ? 'Transferencia creada' : 'Transferencia creada y solicitada' })
  const cabecera = { numero:crearNumeroTransferencia(new Date(), consecutivo), fecha:nfecha('fecha'), hora:nfecha('hora'), estado,
    almacen_origen:form.value.almacen_origen, almacen_destino:form.value.almacen_destino, observacion:form.value.observacion,
    total_unidades:form.value.items.reduce((s, i) => s + numero(i.cantidad), 0), solicitado_por:usuario,
    solicitado_at:estado === 'SOLICITADA' ? ahora : '', despachado_por:'', despachado_at:'', recibido_por:'', recibido_at:'',
    cancelado_por:'', cancelado_at:'', historial:JSON.stringify(historial), created_at:ahora, updated_at:ahora }
  try {
    const insertada = await peticionesFetchOffline('insertData', TABLA, JSON.stringify(cabecera))
    if (!ok(insertada)) throw new Error(insertada?.[1] || 'No se pudo guardar la cabecera')
    const id = insertada?.[1]?.id
    if (!id) throw new Error('No se recibió el ID de la transferencia')
    for (const item of form.value.items) {
      const detalle = { transferencia_id:id, producto_id_origen:item.producto_id_origen, producto_id_destino:'', codigo:item.codigo,
        codigo_barra:item.codigo_barra, nombre:item.nombre, categoria:item.categoria, cantidad:numero(item.cantidad),
        stock_origen_al_solicitar:item.stock, stock_origen_al_despachar:'', stock_destino_al_recibir:'', imeis:'[]', created_at:ahora, updated_at:ahora }
      const respuesta = await peticionesFetchOffline('insertData', TABLA_DETALLE, JSON.stringify(detalle))
      if (!ok(respuesta)) throw new Error(`No se pudo guardar ${item.nombre}`)
    }
    toast.add({ severity:'success', summary:'Transferencia creada', detail:`${cabecera.numero} fue registrada correctamente.`, life:3500 })
    dialogoNueva.value = false
    await cargarTodo()
  } catch (error) {
    console.error('Error guardando transferencia:', error)
    toast.add({ severity:'error', summary:'Error', detail:error.message, life:4500 })
  } finally { guardando.value = false }
}

async function persistirEstado(t, estado, nota = '') {
  if (!puedeTransicionar(t.estado, estado)) throw new Error(`No se puede cambiar de ${t.estado} a ${estado}.`)
  const ahora = nfecha('timestamp')
  const usuario = usuarioActual()
  const actualizado = { ...t, estado, historial:JSON.stringify(agregarEventoHistorial(t.historial, { estado, usuario, fecha:ahora, nota })), updated_at:ahora }
  delete actualizado.detalles
  if (estado === 'SOLICITADA') { actualizado.solicitado_por = usuario; actualizado.solicitado_at = ahora }
  if (estado === 'DESPACHADA') { actualizado.despachado_por = usuario; actualizado.despachado_at = ahora }
  if (estado === 'RECIBIDA') { actualizado.recibido_por = usuario; actualizado.recibido_at = ahora }
  if (estado === 'CANCELADA') { actualizado.cancelado_por = usuario; actualizado.cancelado_at = ahora }
  const respuesta = await peticionesFetchOffline('updateData', TABLA, JSON.stringify(actualizado))
  if (!ok(respuesta)) throw new Error('No se pudo actualizar el estado de la transferencia.')
}

async function cambiarEstado(t, estado) {
  loading.value = true
  try { await persistirEstado(t, estado); await cargarTodo(); toast.add({ severity:'success', summary:'Estado actualizado', detail:`La transferencia está ${etiquetaEstado(estado).toLowerCase()}.`, life:3000 }) }
  catch (error) { toast.add({ severity:'error', summary:'Error', detail:error.message, life:4000 }) }
  finally { loading.value = false }
}
async function cancelar(t) {
  if (!window.confirm(`¿Cancelar la transferencia ${t.numero}?`)) return
  await cambiarEstado(t, 'CANCELADA')
}

async function despachar(t) {
  if (!window.confirm(`¿Confirmar el despacho de ${t.numero}? El stock saldrá del almacén ${t.almacen_origen}.`)) return
  loading.value = true
  const productosPrevios = []
  const imeisPrevios = []
  try {
    const inventario = await peticionesFetchOffline('getDataAsArray', 'productos', '')
    const origen = (Array.isArray(inventario) ? inventario : []).filter((p) => String(p.almacen || '').trim().toUpperCase() === String(t.almacen_origen).trim().toUpperCase())
    const validacion = validarTransferencia({ almacen_origen:t.almacen_origen, almacen_destino:t.almacen_destino,
      items:t.detalles.map((d) => ({ ...d, stock:origen.find((p) => String(p.id) === String(d.producto_id_origen))?.stock })) }, origen)
    if (!validacion.valido) throw new Error(validacion.errores.join(' '))
    for (const detalle of t.detalles) {
      const producto = origen.find((p) => String(p.id) === String(detalle.producto_id_origen))
      productosPrevios.push({ ...producto })
      let seriales = []
      if (['CELULARES','ELECTRODOMESTICOS'].includes(String(producto.categoria || '').toUpperCase())) {
        const disponibles = await peticionesFetchOffline('getDataArrayByTwoConditions', 'imei', 'id_equi', producto.id, 'estado', 'DISPONIBLE')
        seriales = (Array.isArray(disponibles) ? disponibles : []).filter((i) => String(i.almacen || '').trim().toUpperCase() === String(t.almacen_origen).trim().toUpperCase()).slice(0, numero(detalle.cantidad))
        if (seriales.length < numero(detalle.cantidad)) throw new Error(`No hay suficientes IMEI/seriales disponibles para ${producto.nombre}.`)
        for (const imei of seriales) { imeisPrevios.push({ ...imei }); await peticionesFetchOffline('updateData', 'imei', JSON.stringify({ ...imei, estado:'EN_TRANSFERENCIA', updated_at:nfecha('timestamp') })) }
      }
      const stockAnterior = numero(producto.stock)
      const respuesta = await peticionesFetchOffline('updateData', 'productos', JSON.stringify({ ...producto, stock:stockAnterior - numero(detalle.cantidad), updated_at:nfecha('timestamp') }))
      if (!ok(respuesta)) throw new Error(`No se pudo descontar el stock de ${producto.nombre}.`)
      const detalleActualizado = { ...detalle, stock_origen_al_despachar:stockAnterior, imeis:JSON.stringify(seriales.map((i) => i.id)), updated_at:nfecha('timestamp') }
      if (!ok(await peticionesFetchOffline('updateData', TABLA_DETALLE, JSON.stringify(detalleActualizado)))) throw new Error(`No se pudo actualizar la trazabilidad de ${producto.nombre}.`)
    }
    await persistirEstado(t, 'DESPACHADA', 'Stock descontado del almacén origen')
    toast.add({ severity:'success', summary:'Mercancía despachada', detail:'La transferencia está en tránsito.', life:3500 })
    await cargarTodo()
  } catch (error) {
    console.error('Error despachando:', error)
    for (const producto of productosPrevios.reverse()) await peticionesFetchOffline('updateData', 'productos', JSON.stringify(producto))
    for (const imei of imeisPrevios.reverse()) await peticionesFetchOffline('updateData', 'imei', JSON.stringify(imei))
    toast.add({ severity:'error', summary:'No se despachó', detail:error.message, life:5000 })
  } finally { loading.value = false }
}

async function recibir(t) {
  if (!window.confirm(`¿Confirmar la recepción de ${t.numero} en ${t.almacen_destino}?`)) return
  loading.value = true
  const productosRestaurar = []
  const productosCreados = []
  const imeisRestaurar = []
  try {
    let inventario = await peticionesFetchOffline('getDataAsArray', 'productos', '')
    inventario = Array.isArray(inventario) ? inventario : []
    for (const detalle of t.detalles) {
      const origen = inventario.find((p) => String(p.id) === String(detalle.producto_id_origen))
      if (!origen) throw new Error(`No se encontró el producto origen ${detalle.nombre}.`)
      let destino = encontrarProductoDestino(inventario, origen, t.almacen_destino)
      if (!destino) {
        const nuevo = { ...origen, almacen:t.almacen_destino, stock:0, created_at:nfecha('timestamp'), updated_at:nfecha('timestamp') }
        delete nuevo.id
        const insertado = await peticionesFetchOffline('insertData', 'productos', JSON.stringify(nuevo))
        if (!ok(insertado)) throw new Error(`No se pudo crear ${detalle.nombre} en el almacén destino.`)
        const nuevoId = insertado?.[1]?.id
        inventario = await peticionesFetchOffline('getDataAsArray', 'productos', '')
        destino = (Array.isArray(inventario) ? inventario : []).find((p) => String(p.id) === String(nuevoId)) || encontrarProductoDestino(inventario, origen, t.almacen_destino)
        if (!destino) throw new Error(`No se pudo localizar ${detalle.nombre} en el destino.`)
        productosCreados.push(destino.id)
      } else productosRestaurar.push({ ...destino })
      const stockAnterior = numero(destino.stock)
      if (!ok(await peticionesFetchOffline('updateData', 'productos', JSON.stringify({ ...destino, stock:stockAnterior + numero(detalle.cantidad), updated_at:nfecha('timestamp') })))) throw new Error(`No se pudo ingresar ${detalle.nombre}.`)
      let idsImeis = []
      try { idsImeis = JSON.parse(detalle.imeis || '[]') } catch { idsImeis = [] }
      if (idsImeis.length) {
        const todosImeis = await peticionesFetchOffline('getDataAsArray', 'imei', '')
        for (const id of idsImeis) {
          const imei = (todosImeis || []).find((i) => String(i.id) === String(id))
          if (!imei) throw new Error(`No se encontró un IMEI/serial de ${detalle.nombre}.`)
          imeisRestaurar.push({ ...imei })
          if (!ok(await peticionesFetchOffline('updateData', 'imei', JSON.stringify({ ...imei, id_equi:destino.id, almacen:t.almacen_destino, estado:'DISPONIBLE', updated_at:nfecha('timestamp') })))) throw new Error(`No se pudo recibir un IMEI/serial de ${detalle.nombre}.`)
        }
      }
      const detalleActualizado = { ...detalle, producto_id_destino:destino.id, stock_destino_al_recibir:stockAnterior, updated_at:nfecha('timestamp') }
      if (!ok(await peticionesFetchOffline('updateData', TABLA_DETALLE, JSON.stringify(detalleActualizado)))) throw new Error(`No se actualizó el detalle de ${detalle.nombre}.`)
    }
    await persistirEstado(t, 'RECIBIDA', 'Stock ingresado al almacén destino')
    toast.add({ severity:'success', summary:'Transferencia recibida', detail:'El stock fue ingresado al almacén destino.', life:4000 })
    await cargarTodo()
  } catch (error) {
    console.error('Error recibiendo:', error)
    for (const imei of imeisRestaurar.reverse()) await peticionesFetchOffline('updateData', 'imei', JSON.stringify(imei))
    for (const producto of productosRestaurar.reverse()) await peticionesFetchOffline('updateData', 'productos', JSON.stringify(producto))
    for (const id of productosCreados.reverse()) await peticionesFetchOffline('deleteEntry', 'productos', id)
    toast.add({ severity:'error', summary:'No se recibió', detail:error.message, life:5000 })
  } finally { loading.value = false }
}

function verDetalle(t) { seleccionada.value = t; dialogoDetalle.value = true }
onMounted(cargarTodo)
</script>

<style scoped>
.transfer-page{padding:1.5rem;background:#f5f7fb;min-height:100vh;color:#25324b}.page-header{display:flex;align-items:center;justify-content:space-between;gap:1rem;margin-bottom:1.25rem}.eyebrow{color:#2563eb;font-size:.75rem;font-weight:700;letter-spacing:.08em}.page-header h1{font-size:1.8rem;margin:.2rem 0}.page-header p{margin:0;color:#64748b}.header-actions,.row-actions,.filters,.product-picker{display:flex;align-items:center;gap:.75rem}.stats-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:1rem;margin-bottom:1rem}.stat-card{background:white;border:1px solid #e5eaf2;border-radius:14px;padding:1.1rem;display:flex;align-items:center;gap:1rem;box-shadow:0 3px 14px #0f172a0b}.stat-card i{font-size:1.55rem;padding:.75rem;border-radius:12px;background:#f1f5f9}.stat-card span{display:block;color:#64748b;font-size:.82rem}.stat-card strong{font-size:1.45rem}.blue{color:#2563eb}.orange{color:#ea580c}.purple{color:#7c3aed}.green{color:#16a34a}.filters{justify-content:space-between;margin-bottom:1rem;flex-wrap:wrap}.search-box{position:relative;display:flex;align-items:center}.search-box i{position:absolute;left:.8rem;color:#94a3b8;z-index:1}.search-box input{padding-left:2.3rem;min-width:310px}.number-link{display:block;border:0;background:none;color:#2563eb;font-weight:700;padding:0;cursor:pointer}.number-link+small{display:block;color:#64748b;margin-top:.2rem}.route{display:flex;gap:.55rem;align-items:center}.route i{color:#2563eb}.empty{text-align:center;padding:2.5rem;color:#64748b}.empty i{font-size:2rem}.empty.compact{padding:1rem}.form-grid{display:grid;grid-template-columns:1fr 1fr;gap:1rem}.form-grid label{display:flex;flex-direction:column;gap:.45rem;font-weight:600}.form-grid .full{grid-column:1/-1}.product-picker{margin:1.25rem 0}.product-select{flex:1}.items-table{margin-bottom:1rem}.detail-head{display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem}.detail-head small,.detail-head strong,.route-large small,.route-large strong{display:block}.detail-head strong{font-size:1.3rem}.route-large{display:grid;grid-template-columns:1fr auto 1fr;gap:1rem;align-items:center;background:#eff6ff;border:1px solid #bfdbfe;border-radius:12px;padding:1rem;margin-bottom:1rem}.route-large>div:last-child{text-align:right}.route-large i{color:#2563eb;font-size:1.4rem}.timeline-title{margin:1.2rem 0 .7rem}.timeline{border-left:2px solid #dbeafe;margin-left:.45rem;padding-left:1.2rem}.timeline-item{position:relative;padding:0 0 1rem}.timeline-dot{position:absolute;width:.7rem;height:.7rem;border-radius:50%;background:#2563eb;left:-1.62rem;top:.25rem}.timeline-item p{margin:.2rem 0;color:#64748b}.timeline-item small{color:#475569}@media(max-width:850px){.stats-grid{grid-template-columns:repeat(2,1fr)}.page-header{align-items:flex-start;flex-direction:column}.form-grid{grid-template-columns:1fr}.form-grid .full{grid-column:auto}}@media(max-width:520px){.transfer-page{padding:.8rem}.stats-grid{grid-template-columns:1fr}.header-actions,.product-picker{width:100%;flex-wrap:wrap}.search-box,.search-box input{width:100%;min-width:0}}
</style>
