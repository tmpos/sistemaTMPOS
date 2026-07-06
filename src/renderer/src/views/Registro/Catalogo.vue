<script setup>
import { computed, onMounted, ref } from 'vue'
import Button from 'primevue/button'
import DataView from 'primevue/dataview'
import InputText from 'primevue/inputtext'
import SelectButton from 'primevue/selectbutton'
import Tag from 'primevue/tag'
import { useToast } from 'primevue/usetoast'
import Swal from 'sweetalert2'
import { encryptarPassword, envioElectron, formatoMonedaRD, peticionesFetch } from '../../funciones/funciones.js'

const toast = useToast()

const datosEmpresa = ref({})
const layout = ref('grid')
const options = ref(['grid', 'list'])
const link = ref('')
const api = ref('')
const token = ref('')
const tokenCifrado = ref('')
const productos = ref([])
const carrito = ref([])
const busqueda = ref('')
const categoriaSeleccionada = ref('TODAS')
const cargando = ref(false)

const categorias = computed(() => {
  const valores = productos.value
    .map((item) => String(item.categoria || '').trim())
    .filter(Boolean)
  return ['TODAS', ...Array.from(new Set(valores)).sort()]
})

const productosFiltrados = computed(() => {
  const query = busqueda.value.trim().toLowerCase()

  return productos.value.filter((item) => {
    const coincideCategoria = categoriaSeleccionada.value === 'TODAS' || item.categoria === categoriaSeleccionada.value
    const texto = [
      item.codigo,
      item.codigo_barra,
      item.nombre,
      item.descripcion,
      item.categoria,
      item.marca,
      item.modelo
    ].join(' ').toLowerCase()

    return coincideCategoria && (!query || texto.includes(query))
  })
})

const total = computed(() => {
  return carrito.value.reduce((sum, item) => sum + (Number(item.precio_venta || item.precio_final || 0) * item.cantidad), 0)
})

const cantidadCarrito = computed(() => carrito.value.reduce((sum, item) => sum + item.cantidad, 0))

const precioProducto = (producto) => formatoMonedaRD(Number(producto.precio_final || producto.precio_venta || 0))

const imagenProducto = (producto) => producto.imagen || 'https://placehold.co/600x450/f8fafc/64748b?text=Producto'

const getSeverity = (product) => {
  const stock = Number(product.stock || 0)
  if (stock <= 0) return 'danger'
  if (stock <= Number(product.alerta || 3)) return 'warning'
  return 'success'
}

const textoStock = (product) => {
  const stock = Number(product.stock || 0)
  if (stock <= 0) return 'Agotado'
  if (stock <= Number(product.alerta || 3)) return `Bajo stock (${stock})`
  return `Disponible (${stock})`
}

const agregarAlCarrito = (producto) => {
  if (Number(producto.stock || 0) <= 0) {
    toast.add({ severity: 'warn', summary: 'Sin stock', detail: 'Este producto no esta disponible.', life: 2500 })
    return
  }

  const index = carrito.value.findIndex((item) => item.id === producto.id || item.codigo === producto.codigo)
  if (index !== -1) {
    carrito.value[index].cantidad += 1
  } else {
    carrito.value.push({ ...producto, cantidad: 1 })
  }
  toast.add({ severity: 'success', summary: 'Agregado', detail: 'Producto agregado al carrito.', life: 2200 })
}

const eliminarDelCarrito = (index) => {
  carrito.value.splice(index, 1)
}

const limpiarCarrito = () => {
  carrito.value = []
}

const limpiarNumeroTelefono = (numero = '') => numero.replace(/[^\d+]/g, '')

const enviarPorWhatsApp = async () => {
  if (carrito.value.length === 0) {
    toast.add({ severity: 'warn', summary: 'Carrito vacio', detail: 'Agrega productos antes de enviar.', life: 2500 })
    return
  }

  const result = await Swal.fire({
    title: 'Datos del pedido',
    input: 'text',
    inputLabel: 'Nombre del cliente',
    inputPlaceholder: 'Escribe tu nombre',
    showCancelButton: true,
    confirmButtonText: 'Enviar por WhatsApp',
    cancelButtonText: 'Cancelar',
    inputValidator: (value) => {
      if (!String(value || '').trim()) {
        return 'El nombre es requerido'
      }
      return null
    }
  })

  if (!result.isConfirmed) return

  const nombreCliente = String(result.value || '').trim()

  const mensaje = carrito.value
    .map((item) => {
      const precio = Number(item.precio_venta || item.precio_final || 0)
      return `${item.nombre} - Cantidad: ${item.cantidad} - Precio: ${formatoMonedaRD(precio)}`
    })
    .join('\n')
  const mensajeFinal = `Hola, soy ${nombreCliente}. Me gustaria hacer el siguiente pedido:\n\n${mensaje}\n\nTotal: ${formatoMonedaRD(total.value)}`
  const numeroTelefono = limpiarNumeroTelefono(datosEmpresa.value?.telefono || '+18297842912')
  window.open(`https://wa.me/${numeroTelefono}?text=${encodeURIComponent(mensajeFinal)}`, '_blank')
}

const cargarProductos = async () => {
  cargando.value = true
  try {
    const response = await peticionesFetch(
      `${link.value}${api.value}`,
      'datosarraypostconimg',
      { tabla: 'productos', link: link.value },
      tokenCifrado.value,
      'POST'
    )
    productos.value = Array.isArray(response) ? response : []
  } catch (error) {
    console.error('[Catalogo] Error al cargar productos:', error)
    toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo cargar el catalogo.', life: 3500 })
  } finally {
    cargando.value = false
  }
}

const cargarEmpresa = async () => {
  try {
    const response = await peticionesFetch(`${link.value}${api.value}`, 'datoscampo/empresa/id/1', {}, tokenCifrado.value, 'GET')
    datosEmpresa.value = response || {}
  } catch (error) {
    console.warn('[Catalogo] No se pudo cargar empresa:', error)
  }
}

onMounted(async () => {
  const datosJSON = await envioElectron('datosarchivo')
  link.value = datosJSON.VITE_LINKURL
  api.value = datosJSON.VITE_LINK_API
  token.value = datosJSON.VITE_TOKEN
  tokenCifrado.value = await encryptarPassword(token.value, 10)
  await Promise.all([cargarProductos(), cargarEmpresa()])
})
</script>

<template>
  <main class="catalogo-page">
    <section class="catalogo-hero">
      <div>
        <span>Catalogo publico</span>
        <h1>{{ datosEmpresa.nombre || 'Catalogo de productos' }}</h1>
        <p>Explora productos disponibles, agrega al carrito y envia tu pedido por WhatsApp.</p>
      </div>
    </section>

    <section class="catalogo-toolbar">
      <div class="search-box">
        <i class="pi pi-search"></i>
        <InputText v-model="busqueda" placeholder="Buscar por nombre, codigo, marca o categoria" />
      </div>

      <select v-model="categoriaSeleccionada" class="category-select">
        <option v-for="categoria in categorias" :key="categoria" :value="categoria">{{ categoria }}</option>
      </select>

      <SelectButton v-model="layout" :options="options" :allowEmpty="false">
        <template #option="{ option }">
          <i :class="[option === 'list' ? 'pi pi-bars' : 'pi pi-th-large']" />
        </template>
      </SelectButton>
    </section>

    <section class="catalogo-summary">
      <div><span>Productos</span><strong>{{ productosFiltrados.length }}</strong></div>
      <div><span>Categoria</span><strong>{{ categoriaSeleccionada }}</strong></div>
      <div><span>Carrito</span><strong>{{ cantidadCarrito }} item(s)</strong></div>
    </section>

    <DataView :value="productosFiltrados" :layout="layout" :loading="cargando" class="catalogo-dataview">
      <template #empty>
        <div class="empty-state">
          <i class="pi pi-search"></i>
          <h2>Sin productos</h2>
          <p>No encontramos productos con esos filtros.</p>
        </div>
      </template>

      <template #list="{ items }">
        <div class="product-list">
          <article v-for="item in items" :key="item.id || item.codigo" class="product-list-card">
            <img :src="imagenProducto(item)" :alt="item.nombre" />
            <div class="product-info">
              <div class="product-meta">
                <span>{{ item.categoria || 'Sin categoria' }}</span>
                <Tag :value="textoStock(item)" :severity="getSeverity(item)" />
              </div>
              <h2>{{ item.nombre }}</h2>
              <p>{{ item.descripcion || item.marca || item.modelo || 'Producto disponible en catalogo.' }}</p>
              <strong>{{ precioProducto(item) }}</strong>
            </div>
            <Button icon="pi pi-shopping-cart" label="Agregar" severity="success" @click="agregarAlCarrito(item)" />
          </article>
        </div>
      </template>

      <template #grid="{ items }">
        <div class="product-grid">
          <article v-for="item in items" :key="item.id || item.codigo" class="product-card">
            <div class="product-image">
              <img :src="imagenProducto(item)" :alt="item.nombre" />
              <Tag :value="textoStock(item)" :severity="getSeverity(item)" />
            </div>
            <div class="product-card-body">
              <span>{{ item.categoria || 'Sin categoria' }}</span>
              <h2>{{ item.nombre }}</h2>
              <p>{{ item.marca || item.modelo || item.codigo || 'Producto disponible' }}</p>
              <div class="product-footer">
                <strong>{{ precioProducto(item) }}</strong>
                <Button icon="pi pi-shopping-cart" rounded severity="success" @click="agregarAlCarrito(item)" />
              </div>
            </div>
          </article>
        </div>
      </template>
    </DataView>

    <aside class="cart-panel">
      <div class="cart-header">
        <div>
          <span>Pedido</span>
          <h2>Carrito</h2>
        </div>
        <Button v-if="carrito.length" icon="pi pi-trash" text rounded severity="danger" @click="limpiarCarrito" />
      </div>

      <div v-if="carrito.length === 0" class="cart-empty">
        <i class="pi pi-shopping-cart"></i>
        <p>El carrito esta vacio</p>
      </div>

      <div v-else class="cart-items">
        <div v-for="(item, index) in carrito" :key="`${item.codigo || item.id}-${index}`" class="cart-item">
          <div>
            <strong>{{ item.nombre }}</strong>
            <span>{{ item.cantidad }} x {{ precioProducto(item) }}</span>
          </div>
          <Button icon="pi pi-times" text rounded severity="danger" @click="eliminarDelCarrito(index)" />
        </div>
      </div>

      <div class="cart-total">
        <span>Total</span>
        <strong>{{ formatoMonedaRD(total) }}</strong>
      </div>

      <Button label="Enviar por WhatsApp" icon="pi pi-whatsapp" severity="success" :disabled="!carrito.length" @click="enviarPorWhatsApp" />
    </aside>
  </main>
</template>

<style scoped>
.catalogo-page {
  min-height: 100vh;
  padding: 2rem calc(1rem + 340px) 2rem 1rem;
  background: linear-gradient(180deg, #f8fafc 0%, #eef2f7 100%);
  color: #172033;
}

.catalogo-hero,
.catalogo-toolbar,
.catalogo-summary,
.catalogo-dataview {
  width: min(1180px, 100%);
  margin: 0 auto 1rem;
}

.catalogo-hero {
  text-align: center;
}

.catalogo-hero span {
  color: #16a34a;
  font-size: .78rem;
  font-weight: 800;
  text-transform: uppercase;
}

.catalogo-hero h1 {
  margin: .25rem 0;
  font-size: 3rem;
  line-height: 1.05;
}

.catalogo-hero p {
  margin: 0;
  color: #64748b;
}

.catalogo-toolbar,
.catalogo-summary,
.cart-panel,
.product-card,
.product-list-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  box-shadow: 0 18px 45px rgba(15, 23, 42, .08);
}

.catalogo-toolbar {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 220px auto;
  gap: .8rem;
  padding: 1rem;
  align-items: center;
}

.search-box {
  position: relative;
}

.search-box i {
  position: absolute;
  left: .9rem;
  top: 50%;
  color: #64748b;
  transform: translateY(-50%);
}

.search-box :deep(.p-inputtext) {
  width: 100%;
  height: 3rem;
  padding-left: 2.6rem;
}

.category-select {
  height: 3rem;
  padding: 0 .75rem;
  background: #fff;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  color: #334155;
}

.catalogo-summary {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: .75rem;
}

.catalogo-summary div {
  display: grid;
  gap: .25rem;
  padding: 1rem;
}

.catalogo-summary span,
.product-card-body span,
.product-meta span,
.cart-header span {
  color: #64748b;
  font-size: .82rem;
  font-weight: 700;
}

.catalogo-summary strong {
  font-size: 1.2rem;
}

.product-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(230px, 1fr));
  gap: 1rem;
}

.product-card {
  overflow: hidden;
}

.product-image {
  position: relative;
  aspect-ratio: 4 / 3;
  background: #f1f5f9;
}

.product-image img,
.product-list-card img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.product-image :deep(.p-tag) {
  position: absolute;
  top: .75rem;
  left: .75rem;
}

.product-card-body {
  display: grid;
  gap: .4rem;
  padding: 1rem;
}

.product-card h2,
.product-list-card h2,
.cart-header h2 {
  margin: 0;
  font-size: 1.05rem;
}

.product-card p,
.product-list-card p {
  margin: 0;
  color: #64748b;
  min-height: 2.4rem;
}

.product-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: .75rem;
  margin-top: .4rem;
}

.product-footer strong,
.product-info strong,
.cart-total strong {
  color: #16a34a;
  font-size: 1.2rem;
}

.product-list {
  display: grid;
  gap: 1rem;
}

.product-list-card {
  display: grid;
  grid-template-columns: 180px minmax(0, 1fr) auto;
  gap: 1rem;
  padding: 1rem;
  align-items: center;
}

.product-list-card img {
  aspect-ratio: 1 / 1;
  border-radius: 8px;
  background: #f1f5f9;
}

.product-info {
  display: grid;
  gap: .45rem;
  min-width: 0;
}

.product-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: .75rem;
}

.cart-panel {
  position: fixed;
  top: 1rem;
  right: 1rem;
  bottom: 1rem;
  width: 320px;
  display: grid;
  grid-template-rows: auto minmax(0, 1fr) auto auto;
  gap: 1rem;
  padding: 1rem;
  z-index: 10;
}

.cart-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.cart-empty {
  display: grid;
  place-items: center;
  align-content: center;
  gap: .5rem;
  color: #64748b;
}

.cart-empty i {
  font-size: 2rem;
}

.cart-items {
  display: grid;
  align-content: start;
  gap: .75rem;
  min-height: 0;
  overflow: auto;
}

.cart-item {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: .5rem;
  padding: .75rem;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
}

.cart-item div {
  display: grid;
  gap: .25rem;
  min-width: 0;
}

.cart-item strong {
  overflow-wrap: anywhere;
}

.cart-item span,
.cart-total span {
  color: #64748b;
  font-size: .88rem;
}

.cart-total {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 1rem;
  border-top: 1px solid #e2e8f0;
}

.empty-state {
  display: grid;
  place-items: center;
  gap: .5rem;
  padding: 3rem 1rem;
  text-align: center;
  color: #64748b;
}

.empty-state h2,
.empty-state p {
  margin: 0;
}

@media (max-width: 1100px) {
  .catalogo-page {
    padding-right: 1rem;
    padding-bottom: 360px;
  }

  .cart-panel {
    top: auto;
    left: 1rem;
    width: auto;
    height: 320px;
  }
}

@media (max-width: 720px) {
  .catalogo-page {
    padding: 1rem 1rem 380px;
  }

  .catalogo-hero h1 {
    font-size: 2.2rem;
  }

  .catalogo-toolbar,
  .catalogo-summary,
  .product-list-card {
    grid-template-columns: 1fr;
  }

  .product-list-card img {
    width: 100%;
    height: auto;
  }
}
</style>
