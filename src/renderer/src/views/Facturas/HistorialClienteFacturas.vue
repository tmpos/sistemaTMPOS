<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Button from 'primevue/button'
import Column from 'primevue/column'
import DataTable from 'primevue/datatable'
import InputText from 'primevue/inputtext'
import Tag from 'primevue/tag'
import { useToast } from 'primevue/usetoast'
import { jsPDF } from 'jspdf'
import 'jspdf-autotable'
import Swal from 'sweetalert2'
import FacturaPdfPrint from '@/components/FacturaPdfPrint.vue'
import {
  enviarDatosLocalStorage,
  formatoMonedaRD,
  peticionesFetchOffline
} from '@/funciones/funciones.js'

const toast = useToast()
const route = useRoute()
const router = useRouter()

const criterio = ref('')
const buscando = ref(false)
const cliente = ref(null)
const facturas = ref([])
const cuentasCobrar = ref([])
const facturaPdfPrintRef = ref(null)

const normalizarTexto = (value) => String(value || '').trim().toLowerCase()
const limpiarDocumento = (value) => String(value || '').replace(/\D/g, '')

const normalizarArray = (respuesta) => {
  if (Array.isArray(respuesta)) return respuesta
  if (Array.isArray(respuesta?.data)) return respuesta.data
  return []
}

const toNumber = (value) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

const moneda = (value) => formatoMonedaRD(toNumber(value))

const volverAtras = () => {
  if (window.history.length > 1) {
    router.back()
    return
  }

  router.push('/clientes')
}

const coincideDocumento = (value, query) => {
  const texto = normalizarTexto(value)
  const documento = limpiarDocumento(value)
  const queryTexto = normalizarTexto(query)
  const queryDocumento = limpiarDocumento(query)

  return texto === queryTexto || (queryDocumento && documento === queryDocumento)
}

const buscarCliente = (clientes, query) => {
  return clientes.find((item) => {
    return (
      normalizarTexto(item.codigo) === normalizarTexto(query) ||
      coincideDocumento(item.cedula, query) ||
      coincideDocumento(item.rnc, query)
    )
  }) || null
}

const facturaPertenece = (factura, clienteEncontrado, query) => {
  const codigo = clienteEncontrado?.codigo || query
  return normalizarTexto(factura.cod_cliente) === normalizarTexto(codigo)
}

const cuentaPertenece = (cuenta, clienteEncontrado, query) => {
  const codigo = clienteEncontrado?.codigo || query
  const cedula = clienteEncontrado?.cedula || query
  const rnc = clienteEncontrado?.rnc || query

  return (
    normalizarTexto(cuenta.cod_cliente) === normalizarTexto(codigo) ||
    coincideDocumento(cuenta.cedula_cliente, cedula) ||
    coincideDocumento(cuenta.rnc_cliente, rnc)
  )
}

const totalFacturado = computed(() => {
  return facturas.value.reduce((total, factura) => total + toNumber(factura.total), 0)
})

const totalCredito = computed(() => {
  return cuentasCobrar.value.reduce((total, cuenta) => total + toNumber(cuenta.monto_credito), 0)
})

const totalAbonado = computed(() => {
  return cuentasCobrar.value.reduce((total, cuenta) => total + toNumber(cuenta.abonado), 0)
})

const totalPendiente = computed(() => {
  return cuentasCobrar.value.reduce((total, cuenta) => total + toNumber(cuenta.saldo), 0)
})

const clienteNombre = computed(() => {
  return cliente.value?.nombre || facturas.value[0]?.nombre_cliente || cuentasCobrar.value[0]?.nombre_cliente || 'Cliente no registrado'
})

const clienteCodigo = computed(() => {
  return cliente.value?.codigo || facturas.value[0]?.cod_cliente || cuentasCobrar.value[0]?.cod_cliente || '-'
})

const estadoFacturaSeverity = (estado) => {
  const value = normalizarTexto(estado)
  if (value.includes('anul')) return 'danger'
  if (value.includes('pend')) return 'warning'
  if (value.includes('pag') || value.includes('complet')) return 'success'
  return 'info'
}

const estadoCuentaSeverity = (estado) => {
  const value = normalizarTexto(estado)
  if (value.includes('pend')) return 'warning'
  if (value.includes('sald') || value.includes('pag')) return 'success'
  if (value.includes('venc')) return 'danger'
  return 'info'
}

const mostrarPdfEnSwal = async (doc, titulo, nombreArchivo) => {
  const pdfBlob = doc.output('blob')
  const pdfUrl = URL.createObjectURL(pdfBlob)

  await Swal.fire({
    title: titulo,
    width: '90%',
    html: `<iframe id="swal-resumen-pdf" src="${pdfUrl}" style="width:100%; height:72vh; border:1px solid #ddd; border-radius:8px;"></iframe>`,
    showDenyButton: true,
    showCancelButton: true,
    confirmButtonText: 'Imprimir',
    denyButtonText: 'Descargar PDF',
    cancelButtonText: 'Cerrar',
    preConfirm: () => {
      const iframe = document.getElementById('swal-resumen-pdf')
      if (iframe?.contentWindow) {
        iframe.contentWindow.focus()
        iframe.contentWindow.print()
      }
    },
    preDeny: () => {
      const link = document.createElement('a')
      link.href = pdfUrl
      link.download = nombreArchivo
      link.click()
      return false
    },
    didClose: () => {
      URL.revokeObjectURL(pdfUrl)
    }
  })
}

const agregarEncabezadoPdf = (doc, titulo) => {
  doc.setFontSize(16)
  doc.text(titulo, 14, 16)
  doc.setFontSize(10)
  doc.text(`Cliente: ${clienteNombre.value}`, 14, 24)
  doc.text(`Codigo: ${clienteCodigo.value}`, 14, 30)
  doc.text(`Generado: ${new Date().toLocaleString()}`, 14, 36)
}

const generarResumenFacturasPdf = async () => {
  if (!facturas.value.length) {
    toast.add({
      severity: 'info',
      summary: 'Sin facturas',
      detail: 'No hay facturas para generar el resumen.',
      life: 2500
    })
    return
  }

  const doc = new jsPDF('l', 'mm', 'letter')
  agregarEncabezadoPdf(doc, 'Resumen de Facturas')

  doc.autoTable({
    startY: 44,
    head: [['Factura', 'Fecha', 'Tipo', 'Metodo', 'Estado', 'Subtotal', 'Impuesto', 'Total']],
    body: facturas.value.map((factura) => [
      factura.no_factura || '',
      factura.fecha_emision || '',
      factura.tipo_factura || '',
      factura.metodo_pago || '',
      factura.estado_factura || '',
      moneda(factura.subtotal),
      moneda(factura.impuesto),
      moneda(factura.total)
    ]),
    styles: { fontSize: 8 },
    headStyles: { fillColor: [23, 32, 51] }
  })

  const finalY = doc.lastAutoTable?.finalY || 44
  doc.setFontSize(11)
  doc.text(`Cantidad de facturas: ${facturas.value.length}`, 14, finalY + 10)
  doc.text(`Total facturado: ${moneda(totalFacturado.value)}`, 14, finalY + 17)

  await mostrarPdfEnSwal(doc, 'Resumen de Facturas', `Resumen_Facturas_${clienteCodigo.value}.pdf`)
}

const generarResumenCuentasPdf = async () => {
  if (!cuentasCobrar.value.length) {
    toast.add({
      severity: 'info',
      summary: 'Sin cuentas',
      detail: 'No hay cuentas por cobrar para generar el resumen.',
      life: 2500
    })
    return
  }

  const doc = new jsPDF('l', 'mm', 'letter')
  agregarEncabezadoPdf(doc, 'Resumen de Cuentas por Cobrar')

  doc.autoTable({
    startY: 44,
    head: [['Factura', 'Emision', 'Vence', 'Credito', 'Abonado', 'Saldo', 'Cuotas', 'Estatus']],
    body: cuentasCobrar.value.map((cuenta) => [
      cuenta.no_factura || '',
      cuenta.fecha_emision || '',
      cuenta.fecha_vencimiento || '',
      moneda(cuenta.monto_credito),
      moneda(cuenta.abonado),
      moneda(cuenta.saldo),
      cuenta.cuotas || '',
      cuenta.estatus || ''
    ]),
    styles: { fontSize: 8 },
    headStyles: { fillColor: [23, 32, 51] }
  })

  const finalY = doc.lastAutoTable?.finalY || 44
  doc.setFontSize(11)
  doc.text(`Cantidad de cuentas: ${cuentasCobrar.value.length}`, 14, finalY + 10)
  doc.text(`Total credito: ${moneda(totalCredito.value)}`, 14, finalY + 17)
  doc.text(`Total abonado: ${moneda(totalAbonado.value)}`, 14, finalY + 24)
  doc.text(`Saldo pendiente: ${moneda(totalPendiente.value)}`, 14, finalY + 31)

  await mostrarPdfEnSwal(doc, 'Resumen de Cuentas por Cobrar', `Resumen_Cuentas_Cobrar_${clienteCodigo.value}.pdf`)
}

const buscarHistorial = async () => {
  const query = String(criterio.value || '').trim()

  if (!query) {
    toast.add({
      severity: 'warn',
      summary: 'Dato requerido',
      detail: 'Coloca codigo, RNC o cedula del cliente.',
      life: 2500
    })
    return
  }

  buscando.value = true
  cliente.value = null
  facturas.value = []
  cuentasCobrar.value = []

  try {
    const [clientesResp, facturasResp, cuentasResp] = await Promise.all([
      peticionesFetchOffline('getDataAsArray', 'clientes'),
      peticionesFetchOffline('getDataAsArray', 'facturas'),
      peticionesFetchOffline('getDataAsArray', 'cuentas_cobrar')
    ])

    const clientes = normalizarArray(clientesResp)
    const todasFacturas = normalizarArray(facturasResp)
    const todasCuentas = normalizarArray(cuentasResp)
    const clienteEncontrado = buscarCliente(clientes, query)

    cliente.value = clienteEncontrado
    facturas.value = todasFacturas
      .filter((factura) => facturaPertenece(factura, clienteEncontrado, query))
      .sort((a, b) => String(b.fecha_emision || '').localeCompare(String(a.fecha_emision || '')))

    cuentasCobrar.value = todasCuentas
      .filter((cuenta) => cuentaPertenece(cuenta, clienteEncontrado, query))
      .sort((a, b) => String(b.fecha_emision || '').localeCompare(String(a.fecha_emision || '')))

    if (!clienteEncontrado && facturas.value.length === 0 && cuentasCobrar.value.length === 0) {
      toast.add({
        severity: 'info',
        summary: 'Sin resultados',
        detail: 'No se encontraron facturas ni cuentas para ese cliente.',
        life: 3000
      })
    }
  } catch (error) {
    console.error('[HistorialClienteFacturas] Error al consultar historial:', error)
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'No se pudo consultar el historial del cliente.',
      life: 3500
    })
  } finally {
    buscando.value = false
  }
}

onMounted(() => {
  const clienteQuery = route.query?.cliente
  const valor = Array.isArray(clienteQuery) ? clienteQuery[0] : clienteQuery

  if (valor) {
    criterio.value = String(valor)
    buscarHistorial()
  }
})

const buscarClienteFactura = async (factura) => {
  if (cliente.value) return cliente.value
  if (!factura?.cod_cliente) return null

  const respuesta = await peticionesFetchOffline('getDataByField', 'clientes', 'codigo', factura.cod_cliente)
  if (Array.isArray(respuesta)) return respuesta[0] || null
  if (Array.isArray(respuesta?.data)) return respuesta.data[0] || null
  return respuesta || null
}

const imprimirFactura = async (factura) => {
  if (!factura?.no_factura) return

  try {
    const datosCliente = await buscarClienteFactura(factura)

    if (window.electron?.ipcRenderer) {
      await window.electron.ipcRenderer.invoke(
        'ticket',
        JSON.stringify(factura),
        JSON.stringify(datosCliente || {}),
        JSON.stringify(enviarDatosLocalStorage())
      )
      return
    }

    await verPdfFactura(factura)
  } catch (error) {
    console.error('[HistorialClienteFacturas] Error al imprimir:', error)
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'No se pudo imprimir la factura.',
      life: 3500
    })
  }
}

const verPdfFactura = async (factura) => {
  if (!factura?.no_factura) return

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
    const datosCliente = await buscarClienteFactura(factura)

    await facturaPdfPrintRef.value.printFactura({
      factura,
      cliente: datosCliente,
      datosEmpresa: enviarDatosLocalStorage(),
      creditoData: cuentasCobrar.value.find((cuenta) => cuenta.no_factura === factura.no_factura) || null
    })
  } catch (error) {
    console.error('[HistorialClienteFacturas] Error al abrir PDF:', error)
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
  <div class="historial-cliente-page">
    <main class="historial-shell">
      <div class="top-actions">
        <Button
          label="Volver"
          icon="pi pi-arrow-left"
          severity="secondary"
          outlined
          @click="volverAtras"
        />
      </div>

      <section class="historial-header">
        <span class="header-kicker">Historial publico</span>
        <h1>Historial de Facturas</h1>
        <p>Consulta las facturas y cuentas por cobrar de un cliente por codigo, cedula o RNC.</p>
      </section>

      <section class="search-panel">
        <div class="search-field">
          <label for="historial-cliente-query">Codigo, cedula o RNC</label>
          <div class="search-control">
            <i class="pi pi-id-card"></i>
            <InputText
              id="historial-cliente-query"
              v-model="criterio"
              placeholder="Ej: 001, 000-0000000-0 o 000000000"
              @keyup.enter="buscarHistorial"
            />
          </div>
        </div>

        <Button
          label="Buscar"
          icon="pi pi-arrow-right"
          iconPos="right"
          :loading="buscando"
          @click="buscarHistorial"
        />
      </section>

      <section v-if="cliente || facturas.length || cuentasCobrar.length" class="cliente-panel">
        <div class="cliente-card">
          <span class="eyebrow">Cliente</span>
          <h2>{{ clienteNombre }}</h2>
          <div class="cliente-meta">
            <span>Codigo: {{ clienteCodigo }}</span>
            <span>Cedula: {{ cliente?.cedula || cuentasCobrar[0]?.cedula_cliente || '-' }}</span>
            <span>RNC: {{ cliente?.rnc || cuentasCobrar[0]?.rnc_cliente || '-' }}</span>
            <span>Telefono: {{ cliente?.telefono || facturas[0]?.telefono_cliente || cuentasCobrar[0]?.telefono_cliente || '-' }}</span>
          </div>
        </div>

        <div class="stats-grid">
          <div>
            <span>Facturas</span>
            <strong>{{ facturas.length }}</strong>
          </div>
          <div>
            <span>Total facturado</span>
            <strong>{{ moneda(totalFacturado) }}</strong>
          </div>
          <div>
            <span>Cuentas por cobrar</span>
            <strong>{{ cuentasCobrar.length }}</strong>
          </div>
          <div class="danger-stat">
            <span>Saldo pendiente</span>
            <strong>{{ moneda(totalPendiente) }}</strong>
          </div>
        </div>
      </section>

      <section v-if="cliente || facturas.length || cuentasCobrar.length" class="tables-layout">
        <div class="table-panel">
          <div class="table-header">
            <div>
              <h3>Facturas relacionadas</h3>
              <p>{{ facturas.length }} registros encontrados</p>
            </div>
            <Button
              label="Resumen PDF"
              icon="pi pi-file-pdf"
              severity="danger"
              outlined
              :disabled="!facturas.length"
              @click="generarResumenFacturasPdf"
            />
          </div>

          <DataTable
            :value="facturas"
            :paginator="facturas.length > 8"
            :rows="8"
            stripedRows
            responsiveLayout="scroll"
          >
            <Column field="no_factura" header="Factura" />
            <Column field="fecha_emision" header="Fecha" />
            <Column field="tipo_factura" header="Tipo" />
            <Column field="metodo_pago" header="Pago" />
            <Column header="Estado">
              <template #body="{ data }">
                <Tag :value="data.estado_factura || '-'" :severity="estadoFacturaSeverity(data.estado_factura)" />
              </template>
            </Column>
            <Column header="Total">
              <template #body="{ data }">
                <strong>{{ moneda(data.total) }}</strong>
              </template>
            </Column>
            <Column header="Acciones">
              <template #body="{ data }">
                <div class="row-actions">
                  <Button icon="pi pi-file-pdf" severity="danger" text rounded @click="verPdfFactura(data)" />
                  <Button icon="pi pi-print" severity="success" text rounded @click="imprimirFactura(data)" />
                </div>
              </template>
            </Column>
          </DataTable>
        </div>

        <div class="table-panel">
          <div class="table-header">
            <div>
              <h3>Cuentas por cobrar</h3>
              <p>{{ cuentasCobrar.length }} registros encontrados</p>
            </div>
            <div class="table-header-actions">
              <div class="debt-summary">
                <span>Abonado {{ moneda(totalAbonado) }}</span>
                <strong>Pendiente {{ moneda(totalPendiente) }}</strong>
              </div>
              <Button
                label="Resumen PDF"
                icon="pi pi-file-pdf"
                severity="danger"
                outlined
                :disabled="!cuentasCobrar.length"
                @click="generarResumenCuentasPdf"
              />
            </div>
          </div>

          <DataTable
            :value="cuentasCobrar"
            :paginator="cuentasCobrar.length > 8"
            :rows="8"
            stripedRows
            responsiveLayout="scroll"
          >
            <Column field="no_factura" header="Factura" />
            <Column field="fecha_emision" header="Emision" />
            <Column field="fecha_vencimiento" header="Vence" />
            <Column header="Credito">
              <template #body="{ data }">
                {{ moneda(data.monto_credito) }}
              </template>
            </Column>
            <Column header="Abonado">
              <template #body="{ data }">
                {{ moneda(data.abonado) }}
              </template>
            </Column>
            <Column header="Saldo">
              <template #body="{ data }">
                <strong>{{ moneda(data.saldo) }}</strong>
              </template>
            </Column>
            <Column header="Estatus">
              <template #body="{ data }">
                <Tag :value="data.estatus || '-'" :severity="estadoCuentaSeverity(data.estatus)" />
              </template>
            </Column>
          </DataTable>
        </div>
      </section>

      <section v-else class="empty-state">
        <div class="empty-icon">
          <i class="pi pi-history"></i>
        </div>
        <h2>Busca un cliente</h2>
        <p>El historial de facturas y cuentas por cobrar aparecera aqui.</p>
      </section>

      <FacturaPdfPrint ref="facturaPdfPrintRef" />
    </main>
  </div>
</template>

<style scoped>
.historial-cliente-page {
  min-height: 100vh;
  padding: 2rem 1rem;
  background:
    radial-gradient(circle at top right, rgba(22, 163, 74, .12), transparent 30rem),
    linear-gradient(180deg, #f8fafc 0%, #eef2f7 100%);
  color: #172033;
}

.historial-shell {
  width: min(1180px, 100%);
  margin: 0 auto;
}

.top-actions {
  display: flex;
  justify-content: flex-start;
  margin-bottom: 1rem;
}

.historial-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  margin-bottom: 1.25rem;
}

.header-kicker,
.eyebrow {
  color: #16a34a;
  font-size: .78rem;
  font-weight: 800;
  letter-spacing: 0;
  text-transform: uppercase;
}

.historial-header h1 {
  margin: .25rem 0;
  font-size: 3rem;
  line-height: 1.05;
  font-weight: 800;
}

.historial-header p {
  max-width: 720px;
  margin: 0;
  color: #64748b;
}

.search-panel,
.cliente-card,
.stats-grid > div,
.table-panel,
.empty-state {
  background: rgba(255, 255, 255, .94);
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  box-shadow: 0 18px 45px rgba(15, 23, 42, .08);
}

.search-panel {
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

.search-field label {
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

.search-panel :deep(.p-button) {
  height: 3rem;
  min-width: 9.5rem;
}

.cliente-panel,
.tables-layout {
  display: grid;
  gap: 1rem;
}

.cliente-panel {
  grid-template-columns: minmax(0, 1fr) 420px;
  margin-bottom: 1rem;
}

.cliente-card,
.table-panel {
  padding: 1.25rem;
}

.cliente-card h2 {
  margin: .2rem 0 .85rem;
  font-size: 1.7rem;
}

.cliente-meta {
  display: flex;
  flex-wrap: wrap;
  gap: .55rem;
}

.cliente-meta span {
  padding: .45rem .65rem;
  color: #475569;
  background: #f1f5f9;
  border-radius: 8px;
  font-size: .88rem;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: .75rem;
}

.stats-grid > div {
  display: grid;
  gap: .35rem;
  padding: 1rem;
}

.stats-grid span,
.table-header p,
.debt-summary span {
  color: #64748b;
  font-size: .86rem;
}

.stats-grid strong {
  font-size: 1.3rem;
}

.danger-stat strong,
.debt-summary strong {
  color: #dc2626;
}

.tables-layout {
  grid-template-columns: 1fr;
}

.table-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: .9rem;
}

.table-header h3,
.table-header p {
  margin: 0;
}

.debt-summary {
  display: grid;
  gap: .2rem;
  text-align: right;
}

.table-header-actions {
  display: flex;
  align-items: center;
  gap: .85rem;
}

.row-actions {
  display: flex;
  gap: .25rem;
}

.table-panel :deep(.p-datatable-thead > tr > th) {
  background: #f1f5f9;
  color: #334155;
}

.empty-state {
  display: grid;
  place-items: center;
  gap: .55rem;
  padding: 3.5rem 1rem;
  text-align: center;
  color: #64748b;
}

.empty-icon {
  display: grid;
  place-items: center;
  width: 4.25rem;
  height: 4.25rem;
  color: #16a34a;
  background: #dcfce7;
  border-radius: 50%;
}

.empty-icon i {
  font-size: 2rem;
}

.empty-state h2,
.empty-state p {
  margin: 0;
}

.empty-state h2 {
  color: #172033;
}

@media (max-width: 980px) {
  .cliente-panel {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 700px) {
  .historial-cliente-page {
    padding: 1rem;
  }

  .historial-header h1 {
    font-size: 2.25rem;
  }

  .search-panel,
  .stats-grid {
    grid-template-columns: 1fr;
  }

  .search-panel :deep(.p-button) {
    width: 100%;
  }

  .table-header {
    align-items: flex-start;
    flex-direction: column;
  }

  .table-header-actions {
    align-items: stretch;
    flex-direction: column;
    width: 100%;
  }

  .table-header-actions :deep(.p-button),
  .table-header > :deep(.p-button) {
    width: 100%;
  }

  .debt-summary {
    text-align: left;
  }
}
</style>
