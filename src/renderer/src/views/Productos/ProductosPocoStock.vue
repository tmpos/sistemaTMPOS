<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import Swal from 'sweetalert2'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import {
  arrayToObjetoFromTablaOffline,
  crearTablaSiNoExisteOffline,
  nfecha,
  peticionesFetchOffline
} from '@/funciones/funciones.js'

const router = useRouter()
const toast = useToast()

const loading = ref(false)
const guardandoPedido = ref(false)
const searchQuery = ref('')
const criticidadFiltro = ref('todas')
const productosAlerta = ref([])
const pedidosRecientes = ref([])

const visibleDialogPedido = ref(false)
const productoSeleccionado = ref(null)

const PEDIDOS_TABLE = 'pedidos_stock'
const PEDIDOS_FIELDS = [
  'codigo_pedido',
  'id_producto',
  'codigo_producto',
  'nombre_producto',
  'proveedor',
  'stock_actual',
  'stock_alerta',
  'cantidad_pedida',
  'prioridad',
  'fecha_estimada',
  'estado',
  'observaciones',
  'usuario',
  'created_at',
  'updated_at'
]

const pedidoForm = ref({
  cantidad_pedida: 1,
  prioridad: 'ALTA',
  fecha_estimada: '',
  observaciones: ''
})

const prioridadOptions = [
  { label: 'Alta', value: 'ALTA' },
  { label: 'Media', value: 'MEDIA' },
  { label: 'Baja', value: 'BAJA' }
]

const toNumber = (value, fallback = 0) => {
  const n = Number(value)
  return Number.isFinite(n) ? n : fallback
}

const calcularCriticidad = (producto) => {
  const stock = toNumber(producto.stock)
  const alerta = Math.max(toNumber(producto.alerta, 1), 1)

  if (stock <= 0) return 'critica'
  if (stock <= alerta * 0.5) return 'alta'
  return 'media'
}

const criticidadLabel = (criticidad) => {
  if (criticidad === 'critica') return 'Critica'
  if (criticidad === 'alta') return 'Alta'
  return 'Media'
}

const criticidadSeverity = (criticidad) => {
  if (criticidad === 'critica') return 'danger'
  if (criticidad === 'alta') return 'warn'
  return 'info'
}

const productosFiltrados = computed(() => {
  const query = String(searchQuery.value || '').trim().toLowerCase()

  return productosAlerta.value.filter((producto) => {
    const criticidad = calcularCriticidad(producto)
    const cumpleCriticidad = criticidadFiltro.value === 'todas' || criticidad === criticidadFiltro.value

    const textoBusqueda = [
      producto.codigo,
      producto.nombre,
      producto.descripcion,
      producto.categoria,
      producto.marca,
      producto.modelo,
      producto.proveedor
    ]
      .map((v) => String(v || '').toLowerCase())
      .join(' ')

    const cumpleBusqueda = !query || textoBusqueda.includes(query)
    return cumpleCriticidad && cumpleBusqueda
  })
})

const kpis = computed(() => {
  const total = productosAlerta.value.length
  const criticos = productosAlerta.value.filter((p) => calcularCriticidad(p) === 'critica').length
  const altaPrioridad = productosAlerta.value.filter((p) => calcularCriticidad(p) === 'alta').length
  const unidadesFaltantes = productosAlerta.value.reduce((sum, p) => {
    const stock = toNumber(p.stock)
    const alerta = toNumber(p.alerta)
    return sum + Math.max(alerta - stock, 0)
  }, 0)

  return {
    total,
    criticos,
    altaPrioridad,
    unidadesFaltantes
  }
})

const cargarProductosEnAlerta = async () => {
  loading.value = true
  try {
    const productos = await peticionesFetchOffline('getDataAsArray', 'productos')
    const lista = Array.isArray(productos) ? productos : []

    productosAlerta.value = lista
      .filter((p) => {
        const stock = toNumber(p.stock)
        const alerta = toNumber(p.alerta)
        return stock <= alerta
      })
      .sort((a, b) => {
        const criticidadA = calcularCriticidad(a)
        const criticidadB = calcularCriticidad(b)
        const orden = { critica: 3, alta: 2, media: 1 }
        return (orden[criticidadB] || 0) - (orden[criticidadA] || 0)
      })
  } catch (error) {
    console.error('Error al cargar productos en alerta:', error)
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'No se pudo cargar el panel de stock bajo',
      life: 3000
    })
  } finally {
    loading.value = false
  }
}

const cargarPedidosRecientes = async () => {
  try {
    const pedidos = await peticionesFetchOffline('getDataAsArray', PEDIDOS_TABLE)
    pedidosRecientes.value = (Array.isArray(pedidos) ? pedidos : []).sort(
      (a, b) => toNumber(b.created_at) - toNumber(a.created_at)
    )
  } catch (error) {
    pedidosRecientes.value = []
  }
}

const abrirDialogPedido = (producto) => {
  productoSeleccionado.value = producto

  const stock = toNumber(producto.stock)
  const alerta = Math.max(toNumber(producto.alerta, 1), 1)
  const sugerido = Math.max(alerta * 2 - stock, 1)

  pedidoForm.value = {
    cantidad_pedida: sugerido,
    prioridad: calcularCriticidad(producto) === 'critica' ? 'ALTA' : 'MEDIA',
    fecha_estimada: '',
    observaciones: `Reposicion por stock bajo. Stock actual ${stock}, alerta ${alerta}.`
  }

  visibleDialogPedido.value = true
}

const guardarPedido = async () => {
  if (!productoSeleccionado.value) return

  const cantidad = toNumber(pedidoForm.value.cantidad_pedida)
  if (cantidad <= 0) {
    toast.add({
      severity: 'warn',
      summary: 'Validacion',
      detail: 'La cantidad pedida debe ser mayor a cero',
      life: 2500
    })
    return
  }

  guardandoPedido.value = true

  try {
    const basePedido = await arrayToObjetoFromTablaOffline(PEDIDOS_TABLE)
    const now = nfecha('timestamp')
    const producto = productoSeleccionado.value

    basePedido.codigo_pedido = `PS-${now}`
    basePedido.id_producto = producto.id
    basePedido.codigo_producto = producto.codigo || ''
    basePedido.nombre_producto = producto.nombre || ''
    basePedido.proveedor = producto.proveedor || 'SIN DEFINIR'
    basePedido.stock_actual = toNumber(producto.stock)
    basePedido.stock_alerta = toNumber(producto.alerta)
    basePedido.cantidad_pedida = cantidad
    basePedido.prioridad = pedidoForm.value.prioridad
    basePedido.fecha_estimada = pedidoForm.value.fecha_estimada || ''
    basePedido.estado = 'SOLICITADO'
    basePedido.observaciones = String(pedidoForm.value.observaciones || '').trim()
    basePedido.usuario = localStorage.getItem('usuario') || 'SISTEMA'
    if (Object.prototype.hasOwnProperty.call(basePedido, 'created_at')) {
      basePedido.created_at = now
    }
    if (Object.prototype.hasOwnProperty.call(basePedido, 'updated_at')) {
      basePedido.updated_at = now
    }

    const response = await peticionesFetchOffline('insertData', PEDIDOS_TABLE, JSON.stringify(basePedido))
    if (response?.[0] !== 'ok') {
      throw new Error('No se pudo registrar el pedido de reposicion')
    }

    visibleDialogPedido.value = false
    await cargarPedidosRecientes()

    toast.add({
      severity: 'success',
      summary: 'Pedido generado',
      detail: `Se genero ${basePedido.codigo_pedido} para ${basePedido.nombre_producto}`,
      life: 2800
    })

    await Swal.fire({
      icon: 'success',
      title: 'Pedido creado',
      text: `El pedido ${basePedido.codigo_pedido} fue registrado correctamente.`
    })
  } catch (error) {
    console.error('Error al guardar pedido:', error)
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: error.message || 'No se pudo guardar el pedido',
      life: 3000
    })
  } finally {
    guardandoPedido.value = false
  }
}

const copiarResumenPedido = async (pedido) => {
  const texto = [
    `Pedido: ${pedido.codigo_pedido}`,
    `Producto: ${pedido.nombre_producto}`,
    `Codigo: ${pedido.codigo_producto}`,
    `Cantidad: ${pedido.cantidad_pedida}`,
    `Proveedor: ${pedido.proveedor}`,
    `Prioridad: ${pedido.prioridad}`,
    `Estado: ${pedido.estado}`
  ].join('\n')

  try {
    await navigator.clipboard.writeText(texto)
    toast.add({ severity: 'success', summary: 'Copiado', detail: 'Resumen copiado al portapapeles', life: 2200 })
  } catch (error) {
    toast.add({ severity: 'warn', summary: 'Aviso', detail: 'No se pudo copiar el resumen', life: 2200 })
  }
}

const generarPdfFueraStockEmbed = async () => {
  try {
    const fueraStock = productosAlerta.value.filter((p) => toNumber(p.stock) <= 0)

    if (!fueraStock.length) {
      await Swal.fire('Sin productos fuera de stock', 'No hay productos agotados para generar el reporte.', 'info')
      return
    }

    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
    const fecha = new Date().toLocaleString('es-DO', { dateStyle: 'medium', timeStyle: 'short' })

    doc.setFillColor(15, 23, 42)
    doc.rect(0, 0, 297, 24, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(15)
    doc.text('Productos fuera de stock', 14, 10)
    doc.setFontSize(9)
    doc.text(`Generado: ${fecha}`, 14, 16)
    doc.text(`Total agotados: ${fueraStock.length}`, 14, 21)
    doc.setTextColor(17, 24, 39)

    autoTable(doc, {
      startY: 30,
      head: [['Codigo', 'Producto', 'Categoria', 'Proveedor', 'Alerta', 'Stock', 'Criticidad']],
      body: fueraStock.map((p) => [
        p.codigo || p.codigo_barra || '',
        p.nombre || '',
        p.categoria || '-',
        p.proveedor || 'SIN DEFINIR',
        toNumber(p.alerta),
        toNumber(p.stock),
        criticidadLabel(calcularCriticidad(p))
      ]),
      theme: 'grid',
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      columnStyles: {
        0: { cellWidth: 26 },
        1: { cellWidth: 78 },
        2: { cellWidth: 35 },
        3: { cellWidth: 58 },
        4: { halign: 'right', cellWidth: 20 },
        5: { halign: 'right', cellWidth: 18 },
        6: { cellWidth: 26 }
      }
    })

    const pdfBlob = doc.output('blob')
    const pdfUrl = URL.createObjectURL(pdfBlob)
    const nombreArchivo = `productos_fuera_stock_${new Date().toISOString().slice(0, 10)}.pdf`

    const result = await Swal.fire({
      title: 'Vista previa: fuera de stock',
      width: '94vw',
      html: `
        <div style="text-align:left;margin-bottom:10px;padding:10px;border-radius:10px;background:linear-gradient(135deg,#111827,#1f2937);color:#fff;">
          <div style="font-size:14px;font-weight:700;">Reporte ejecutivo de agotados</div>
          <div style="font-size:12px;opacity:.9;">Lista de productos fuera de stock con nivel de criticidad.</div>
        </div>
        <iframe src="${pdfUrl}" style="width:100%;height:72vh;border:1px solid #e5e7eb;border-radius:12px;background:#fff;"></iframe>
      `,
      showCancelButton: true,
      confirmButtonText: 'Descargar PDF',
      cancelButtonText: 'Cerrar',
      confirmButtonColor: '#0f766e',
      cancelButtonColor: '#475569'
    })

    if (result.isConfirmed) {
      const link = document.createElement('a')
      link.href = pdfUrl
      link.download = nombreArchivo
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }

    setTimeout(() => URL.revokeObjectURL(pdfUrl), 15000)
  } catch (error) {
    console.error('Error generando PDF de fuera de stock:', error)
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'No se pudo generar el PDF de productos fuera de stock',
      life: 3000
    })
  }
}

onMounted(async () => {
  await crearTablaSiNoExisteOffline(PEDIDOS_TABLE, PEDIDOS_FIELDS, toast)
  await Promise.all([cargarProductosEnAlerta(), cargarPedidosRecientes()])
})
</script>

<template>
  <main class="stock-alerta-page">
    <div class="stock-alerta-shell">
      <div class="stock-alerta-hero">
        <div>
          <h1>Panel de productos con poco stock</h1>
          <p>Supervisa alertas de inventario y ejecuta pedidos de reposicion desde un solo lugar.</p>
        </div>
        <div class="stock-alerta-hero-actions">
          <Button label="Actualizar" icon="pi pi-refresh" severity="secondary" outlined @click="cargarProductosEnAlerta" />
          <Button label="PDF fuera de stock" icon="pi pi-file-pdf" severity="danger" outlined @click="generarPdfFueraStockEmbed" />
          <Button label="Volver a productos" icon="pi pi-arrow-left" @click="router.push('/productos')" />
        </div>
      </div>

      <div class="stock-alerta-kpis">
        <Card>
          <template #content>
            <p class="kpi-label">Items en alerta</p>
            <p class="kpi-value">{{ kpis.total }}</p>
          </template>
        </Card>
        <Card>
          <template #content>
            <p class="kpi-label">Criticos</p>
            <p class="kpi-value kpi-danger">{{ kpis.criticos }}</p>
          </template>
        </Card>
        <Card>
          <template #content>
            <p class="kpi-label">Alta prioridad</p>
            <p class="kpi-value kpi-warn">{{ kpis.altaPrioridad }}</p>
          </template>
        </Card>
        <Card>
          <template #content>
            <p class="kpi-label">Unidades a reponer</p>
            <p class="kpi-value">{{ kpis.unidadesFaltantes }}</p>
          </template>
        </Card>
      </div>

      <Card>
        <template #content>
          <div class="stock-alerta-filtros">
            <IconField iconPosition="left" class="filtro-search">
              <InputIcon class="pi pi-search" />
              <InputText v-model="searchQuery" placeholder="Buscar por codigo, nombre, proveedor o categoria" />
            </IconField>

            <Select
              v-model="criticidadFiltro"
              :options="[
                { label: 'Todas las criticidades', value: 'todas' },
                { label: 'Critica', value: 'critica' },
                { label: 'Alta', value: 'alta' },
                { label: 'Media', value: 'media' }
              ]"
              optionLabel="label"
              optionValue="value"
              class="filtro-criticidad"
            />
          </div>

          <DataTable :value="productosFiltrados" :loading="loading" dataKey="id" stripedRows size="small" scrollable scrollHeight="460px">
            <Column field="codigo" header="Codigo" style="min-width: 9rem" />
            <Column field="nombre" header="Producto" style="min-width: 16rem" />
            <Column header="Stock / Alerta" style="min-width: 9rem">
              <template #body="slotProps">
                <span>{{ slotProps.data.stock }} / {{ slotProps.data.alerta }}</span>
              </template>
            </Column>
            <Column header="Faltante" style="min-width: 8rem">
              <template #body="slotProps">
                <strong>{{ Math.max(toNumber(slotProps.data.alerta) - toNumber(slotProps.data.stock), 0) }}</strong>
              </template>
            </Column>
            <Column field="proveedor" header="Proveedor" style="min-width: 12rem" />
            <Column header="Criticidad" style="min-width: 8rem">
              <template #body="slotProps">
                <Tag :severity="criticidadSeverity(calcularCriticidad(slotProps.data))" :value="criticidadLabel(calcularCriticidad(slotProps.data))" />
              </template>
            </Column>
            <Column header="Acciones" style="min-width: 9rem">
              <template #body="slotProps">
                <Button label="Realizar pedido" size="small" icon="pi pi-send" @click="abrirDialogPedido(slotProps.data)" />
              </template>
            </Column>
            <template #empty>
              <div class="empty-state">No hay productos en alerta con los filtros actuales.</div>
            </template>
          </DataTable>
        </template>
      </Card>

      <Card>
        <template #title>Pedidos recientes de reposicion</template>
        <template #content>
          <DataTable :value="pedidosRecientes.slice(0, 8)" dataKey="codigo_pedido" stripedRows size="small">
            <Column field="codigo_pedido" header="Pedido" />
            <Column field="nombre_producto" header="Producto" />
            <Column field="cantidad_pedida" header="Cantidad" />
            <Column field="prioridad" header="Prioridad" />
            <Column field="estado" header="Estado" />
            <Column header="Accion">
              <template #body="slotProps">
                <Button label="Copiar" icon="pi pi-copy" text size="small" @click="copiarResumenPedido(slotProps.data)" />
              </template>
            </Column>
          </DataTable>
        </template>
      </Card>
    </div>

    <Dialog v-model:visible="visibleDialogPedido" modal header="Realizar pedido de reposicion" :style="{ width: '40rem', maxWidth: '95vw' }">
      <div class="pedido-form">
        <div class="pedido-contexto" v-if="productoSeleccionado">
          <p><strong>Producto:</strong> {{ productoSeleccionado.nombre }}</p>
          <p><strong>Codigo:</strong> {{ productoSeleccionado.codigo }}</p>
          <p><strong>Stock actual:</strong> {{ productoSeleccionado.stock }} / Alerta {{ productoSeleccionado.alerta }}</p>
          <p><strong>Proveedor sugerido:</strong> {{ productoSeleccionado.proveedor || 'SIN DEFINIR' }}</p>
        </div>

        <div class="pedido-grid">
          <div>
            <label>Cantidad a pedir</label>
            <InputText v-model="pedidoForm.cantidad_pedida" type="number" min="1" />
          </div>
          <div>
            <label>Prioridad</label>
            <Select v-model="pedidoForm.prioridad" :options="prioridadOptions" optionLabel="label" optionValue="value" />
          </div>
        </div>

        <div>
          <label>Fecha estimada de entrega</label>
          <InputText v-model="pedidoForm.fecha_estimada" placeholder="YYYY-MM-DD" />
        </div>

        <div>
          <label>Observaciones</label>
          <Textarea v-model="pedidoForm.observaciones" rows="4" autoResize />
        </div>

        <div class="pedido-actions">
          <Button label="Cancelar" severity="secondary" outlined @click="visibleDialogPedido = false" />
          <Button label="Guardar pedido" icon="pi pi-check" :loading="guardandoPedido" @click="guardarPedido" />
        </div>
      </div>
    </Dialog>
  </main>
</template>

<style scoped>
.stock-alerta-page {
  min-height: 100%;
  background: linear-gradient(145deg, #f5f7fb 0%, #eef6ff 100%);
  padding: 1rem;
}

.stock-alerta-shell {
  display: grid;
  gap: 1rem;
}

.stock-alerta-hero {
  background: linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%);
  color: #fff;
  border-radius: 14px;
  padding: 1.1rem 1.25rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.stock-alerta-hero h1 {
  margin: 0;
  font-size: 1.3rem;
}

.stock-alerta-hero p {
  margin: 0.4rem 0 0;
  color: rgba(255, 255, 255, 0.9);
}

.stock-alerta-hero-actions {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.stock-alerta-kpis {
  display: grid;
  gap: 0.8rem;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
}

.kpi-label {
  margin: 0;
  color: #64748b;
  font-size: 0.84rem;
}

.kpi-value {
  margin: 0.25rem 0 0;
  font-size: 1.5rem;
  font-weight: 700;
  color: #0f172a;
}

.kpi-danger {
  color: #b91c1c;
}

.kpi-warn {
  color: #b45309;
}

.stock-alerta-filtros {
  display: grid;
  gap: 0.8rem;
  grid-template-columns: 1fr minmax(220px, 280px);
  margin-bottom: 0.9rem;
}

.filtro-search,
.filtro-criticidad {
  width: 100%;
}

.empty-state {
  text-align: center;
  color: #64748b;
  padding: 1rem;
}

.pedido-form {
  display: grid;
  gap: 0.9rem;
}

.pedido-grid {
  display: grid;
  gap: 0.8rem;
  grid-template-columns: 1fr 1fr;
}

.pedido-contexto {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 0.8rem;
}

.pedido-contexto p {
  margin: 0.25rem 0;
}

.pedido-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.6rem;
}

label {
  display: block;
  margin-bottom: 0.35rem;
  font-size: 0.85rem;
  font-weight: 600;
  color: #334155;
}

@media (max-width: 768px) {
  .stock-alerta-filtros,
  .pedido-grid {
    grid-template-columns: 1fr;
  }
}
</style>
