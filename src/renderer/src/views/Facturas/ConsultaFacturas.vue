<script setup>
import { computed, ref } from 'vue'
import Button from 'primevue/button'
import Column from 'primevue/column'
import DataTable from 'primevue/datatable'
import InputText from 'primevue/inputtext'
import Tag from 'primevue/tag'
import { useToast } from 'primevue/usetoast'
import FacturaPdfPrint from '@/components/FacturaPdfPrint.vue'
import {
  enviarDatosLocalStorage,
  formatoMonedaRD,
  peticionesFetchOffline
} from '@/funciones/funciones.js'

const toast = useToast()

const noFactura = ref('')
const buscando = ref(false)
const factura = ref(null)
const cliente = ref(null)
const creditoData = ref(null)
const facturaPdfPrintRef = ref(null)

const normalizarRespuesta = (respuesta) => {
  if (Array.isArray(respuesta)) return respuesta[0] || null
  if (Array.isArray(respuesta?.data)) return respuesta.data[0] || null
  return respuesta || null
}

const parseJson = (value, fallback = []) => {
  if (!value) return fallback
  if (Array.isArray(value)) return value

  try {
    return JSON.parse(value)
  } catch (error) {
    console.warn('[ConsultaFacturas] No se pudo parsear productos:', error)
    return fallback
  }
}

const toNumber = (value) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

const productosFactura = computed(() => parseJson(factura.value?.productos, []))

const estadoSeverity = computed(() => {
  const estado = String(factura.value?.estado_factura || '').toUpperCase()
  if (estado.includes('ANUL')) return 'danger'
  if (estado.includes('PEND')) return 'warning'
  if (estado.includes('PAG') || estado.includes('COMPLET')) return 'success'
  return 'info'
})

const totalProductos = computed(() => {
  return productosFactura.value.reduce((total, producto) => total + subtotalProducto(producto), 0)
})

const nombreProducto = (producto) => {
  return producto?.nombre || producto?.descripcion || producto?.nombre_producto || producto?.codigo || 'Producto'
}

const cantidadProducto = (producto) => toNumber(producto?.cantidad || producto?.qty || 1)

const precioProducto = (producto) => {
  return toNumber(producto?.precio_final || producto?.precio_venta || producto?.precio || producto?.precioVenta)
}

const moneda = (value) => formatoMonedaRD(toNumber(value))

const subtotalProducto = (producto) => {
  const total = toNumber(producto?.total || producto?.subtotal || producto?.importe)
  if (total > 0) return total
  return cantidadProducto(producto) * precioProducto(producto)
}

const buscarFactura = async () => {
  const numero = String(noFactura.value || '').trim()

  if (!numero) {
    toast.add({
      severity: 'warn',
      summary: 'Numero requerido',
      detail: 'Coloca el numero de factura para consultar.',
      life: 2500
    })
    return
  }

  buscando.value = true
  factura.value = null
  cliente.value = null
  creditoData.value = null

  try {
    const respuesta = await peticionesFetchOffline('getDataByField', 'facturas', 'no_factura', numero)
    const datosFactura = normalizarRespuesta(respuesta)

    if (!datosFactura?.no_factura) {
      toast.add({
        severity: 'info',
        summary: 'Sin resultados',
        detail: `No se encontro la factura ${numero}.`,
        life: 3000
      })
      return
    }

    factura.value = datosFactura

    if (datosFactura.cod_cliente) {
      const respuestaCliente = await peticionesFetchOffline('getDataByField', 'clientes', 'codigo', datosFactura.cod_cliente)
      cliente.value = normalizarRespuesta(respuestaCliente)
    }

    if (String(datosFactura.metodo_pago || '').toUpperCase() === 'CREDITO') {
      const respuestaCredito = await peticionesFetchOffline('getDataByField', 'cuentas_cobrar', 'no_factura', datosFactura.no_factura)
      creditoData.value = normalizarRespuesta(respuestaCredito)
    }
  } catch (error) {
    console.error('[ConsultaFacturas] Error al buscar factura:', error)
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'No se pudo consultar la factura.',
      life: 3500
    })
  } finally {
    buscando.value = false
  }
}

const imprimirFactura = async () => {
  if (!factura.value?.no_factura) return

  try {
    if (window.electron?.ipcRenderer) {
      const datosEmpresa = JSON.stringify(enviarDatosLocalStorage())
      await window.electron.ipcRenderer.invoke(
        'ticket',
        JSON.stringify(factura.value),
        JSON.stringify(cliente.value || {}),
        datosEmpresa
      )
      return
    }

    await verPdfFactura()
  } catch (error) {
    console.error('[ConsultaFacturas] Error al imprimir:', error)
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'No se pudo imprimir la factura.',
      life: 3500
    })
  }
}

const verPdfFactura = async () => {
  if (!factura.value?.no_factura) return

  if (!facturaPdfPrintRef.value?.printFactura) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'El visor PDF no esta disponible.',
      life: 3000
    })
    return
  }

  try {
    await facturaPdfPrintRef.value.printFactura({
      factura: factura.value,
      cliente: cliente.value,
      datosEmpresa: enviarDatosLocalStorage(),
      creditoData: creditoData.value
    })
  } catch (error) {
    console.error('[ConsultaFacturas] Error al generar PDF:', error)
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'No se pudo abrir el PDF de la factura.',
      life: 3500
    })
  }
}
</script>

<template>
  <div class="consulta-facturas-page">
    <main class="consulta-shell">
      <section class="consulta-header">
        <span class="header-kicker">Consulta publica</span>
        <h1>Consulta de Facturas</h1>
        <p>Ingresa el numero de factura para ver el detalle, imprimir o abrir el PDF.</p>
      </section>

      <section class="consulta-search-panel">
        <div class="search-field">
          <label for="consulta-no-factura">Numero de factura</label>
          <div class="search-control">
            <i class="pi pi-search"></i>
            <InputText
              id="consulta-no-factura"
              v-model="noFactura"
              placeholder="Ej: F000001"
              @keyup.enter="buscarFactura"
            />
          </div>
        </div>

        <Button
          label="Buscar"
          icon="pi pi-arrow-right"
          iconPos="right"
          :loading="buscando"
          @click="buscarFactura"
        />
      </section>

      <section v-if="factura" class="factura-layout">
        <div class="factura-summary">
          <div class="summary-title">
            <div>
              <span class="eyebrow">Factura encontrada</span>
              <h2>{{ factura.no_factura }}</h2>
            </div>
            <Tag :value="factura.estado_factura || 'SIN ESTADO'" :severity="estadoSeverity" />
          </div>

          <div class="summary-grid">
            <div class="summary-item wide">
              <span>Cliente</span>
              <strong>{{ factura.nombre_cliente || cliente?.nombre || 'Sin cliente' }}</strong>
            </div>
            <div class="summary-item">
              <span>Telefono</span>
              <strong>{{ factura.telefono_cliente || cliente?.telefono || '-' }}</strong>
            </div>
            <div class="summary-item">
              <span>Fecha</span>
              <strong>{{ factura.fecha_emision || '-' }} {{ factura.hora || '' }}</strong>
            </div>
            <div class="summary-item">
              <span>Tipo</span>
              <strong>{{ factura.tipo_factura || '-' }}</strong>
            </div>
            <div class="summary-item">
              <span>Metodo de pago</span>
              <strong>{{ factura.metodo_pago || '-' }}</strong>
            </div>
            <div class="summary-item">
              <span>Vendedor</span>
              <strong>{{ factura.vendedor || factura.cajero || '-' }}</strong>
            </div>
            <div class="summary-item">
              <span>Comprobante</span>
              <strong>{{ factura.comprobante || '-' }}</strong>
            </div>
            <div class="summary-item">
              <span>Almacen</span>
              <strong>{{ factura.almacen || '-' }}</strong>
            </div>
          </div>

          <div class="summary-actions">
            <Button
              label="Imprimir"
              icon="pi pi-print"
              severity="success"
              @click="imprimirFactura"
            />
            <Button
              label="Ver PDF"
              icon="pi pi-file-pdf"
              severity="danger"
              outlined
              @click="verPdfFactura"
            />
          </div>
        </div>

        <aside class="factura-totals">
          <div class="totals-title">
            <span>Resumen</span>
            <strong>{{ moneda(factura.total || totalProductos) }}</strong>
          </div>
          <div>
            <span>Subtotal</span>
            <strong>{{ moneda(factura.subtotal || totalProductos) }}</strong>
          </div>
          <div>
            <span>Descuento</span>
            <strong>{{ moneda(factura.descuento) }}</strong>
          </div>
          <div>
            <span>Impuesto</span>
            <strong>{{ moneda(factura.impuesto) }}</strong>
          </div>
          <div class="total-row">
            <span>Total factura</span>
            <strong>{{ moneda(factura.total || totalProductos) }}</strong>
          </div>
        </aside>

        <div class="productos-panel">
          <div class="productos-header">
            <div>
              <h3>Productos facturados</h3>
              <p>{{ productosFactura.length }} registros en esta factura</p>
            </div>
          </div>

          <DataTable
            :value="productosFactura"
            stripedRows
            responsiveLayout="scroll"
            class="consulta-productos-table"
          >
            <Column header="Codigo">
              <template #body="{ data }">
                {{ data.codigo || data.cod_producto || '-' }}
              </template>
            </Column>
            <Column header="Producto">
              <template #body="{ data }">
                {{ nombreProducto(data) }}
              </template>
            </Column>
            <Column header="Cant.">
              <template #body="{ data }">
                {{ cantidadProducto(data) }}
              </template>
            </Column>
            <Column header="Precio">
              <template #body="{ data }">
                {{ moneda(precioProducto(data)) }}
              </template>
            </Column>
            <Column header="Total">
              <template #body="{ data }">
                <strong>{{ moneda(subtotalProducto(data)) }}</strong>
              </template>
            </Column>
          </DataTable>
        </div>
      </section>

      <section v-else class="empty-state">
        <div class="empty-icon">
          <i class="pi pi-file-search"></i>
        </div>
        <h2>Busca una factura</h2>
        <p>El detalle aparecera aqui despues de consultar por numero.</p>
      </section>

      <FacturaPdfPrint ref="facturaPdfPrintRef" />
    </main>
  </div>
</template>

<style scoped>
.consulta-facturas-page {
  min-height: 100vh;
  padding: 2rem 1rem;
  background:
    radial-gradient(circle at top left, rgba(37, 99, 235, .12), transparent 32rem),
    linear-gradient(180deg, #f8fafc 0%, #eef2f7 100%);
  color: #172033;
}

.consulta-shell {
  width: min(1160px, 100%);
  margin: 0 auto;
}

.consulta-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  margin-bottom: 1.25rem;
}

.header-kicker,
.eyebrow {
  display: inline-flex;
  color: #2563eb;
  font-size: .78rem;
  font-weight: 800;
  letter-spacing: 0;
  text-transform: uppercase;
}

.consulta-header h1 {
  margin: .25rem 0;
  font-size: 3rem;
  line-height: 1.05;
  font-weight: 800;
}

.consulta-header p {
  max-width: 680px;
  margin: 0;
  color: #64748b;
}

.consulta-search-panel,
.factura-summary,
.factura-totals,
.productos-panel,
.empty-state {
  background: rgba(255, 255, 255, .94);
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  box-shadow: 0 18px 45px rgba(15, 23, 42, .08);
}

.consulta-search-panel {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: end;
  gap: .9rem;
  padding: 1rem;
  margin-bottom: 1rem;
}

.search-field {
  display: grid;
  gap: .45rem;
}

.search-field label,
.summary-grid span,
.factura-totals span,
.eyebrow {
  color: #64748b;
  font-size: .84rem;
  font-weight: 700;
}

.search-control {
  position: relative;
}

.search-control i {
  position: absolute;
  left: .9rem;
  top: 50%;
  z-index: 1;
  color: #64748b;
  transform: translateY(-50%);
}

.search-control :deep(.p-inputtext) {
  width: 100%;
  height: 3rem;
  padding-left: 2.6rem;
  font-size: 1rem;
}

.consulta-search-panel :deep(.p-button) {
  height: 3rem;
  min-width: 9.5rem;
}

.factura-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 320px;
  gap: 1rem;
}

.factura-summary,
.factura-totals,
.productos-panel {
  padding: 1.25rem;
}

.factura-summary {
  min-width: 0;
}

.summary-title {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #e2e8f0;
}

.summary-title h2 {
  margin: .15rem 0 0;
  font-size: 1.85rem;
  line-height: 1.1;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: .8rem;
  margin-top: 1rem;
}

.summary-item {
  display: grid;
  gap: .25rem;
  min-height: 70px;
  padding: .85rem;
  background: #f8fafc;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
}

.summary-item.wide {
  grid-column: span 2;
}

.summary-item strong {
  min-width: 0;
  overflow-wrap: anywhere;
}

.summary-actions {
  display: flex;
  justify-content: flex-end;
  gap: .75rem;
  margin-top: 1.25rem;
}

.factura-totals {
  align-self: start;
  display: grid;
  gap: .75rem;
}

.factura-totals div {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  padding-bottom: .75rem;
  border-bottom: 1px solid #e2e8f0;
}

.factura-totals div:last-child {
  padding-bottom: 0;
  border-bottom: 0;
}

.totals-title {
  display: grid !important;
  justify-content: stretch !important;
  gap: .3rem !important;
  padding: 1rem !important;
  color: #ffffff;
  background: #172033;
  border: 0 !important;
  border-radius: 8px;
}

.totals-title span {
  color: #cbd5e1;
}

.totals-title strong {
  font-size: 1.65rem;
}

.total-row strong {
  color: #16a34a;
  font-size: 1.25rem;
}

.productos-panel {
  grid-column: 1 / -1;
}

.productos-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: .9rem;
}

.productos-header h3,
.productos-header p,
.empty-state h2,
.empty-state p {
  margin: 0;
}

.productos-header p {
  color: #64748b;
  font-size: .9rem;
  margin-top: .2rem;
}

.consulta-productos-table :deep(.p-datatable-thead > tr > th) {
  background: #f1f5f9;
  color: #334155;
}

.empty-state {
  display: grid;
  place-items: center;
  gap: .5rem;
  padding: 3.5rem 1rem;
  text-align: center;
  color: #64748b;
}

.empty-icon {
  display: grid;
  place-items: center;
  width: 4.25rem;
  height: 4.25rem;
  color: #2563eb;
  background: #dbeafe;
  border-radius: 50%;
}

.empty-icon i {
  font-size: 2rem;
}

.empty-state h2 {
  color: #172033;
}

@media (max-width: 980px) {
  .factura-layout {
    grid-template-columns: 1fr;
  }

  .factura-totals {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .totals-title {
    grid-column: 1 / -1;
  }
}

@media (max-width: 700px) {
  .consulta-facturas-page {
    padding: 1rem;
  }

  .consulta-header h1 {
    font-size: 2.25rem;
  }

  .consulta-search-panel {
    grid-template-columns: 1fr;
  }

  .consulta-search-panel :deep(.p-button),
  .summary-actions :deep(.p-button) {
    width: 100%;
  }

  .summary-title,
  .summary-actions {
    flex-direction: column;
  }

  .summary-grid,
  .factura-totals {
    grid-template-columns: 1fr;
  }

  .summary-item.wide {
    grid-column: auto;
  }
}
</style>
