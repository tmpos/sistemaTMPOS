<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import axios from 'axios'
import { useDatosEmpresa } from '../../stores'
import {
  crearTablaSiNoExisteOffline,
  esRespuestaOperacionExitosa,
  nfecha,
  peticionesFetchOffline
} from '../../funciones/funciones.js'
import {
  buildElectronicCreditNotePayload,
  formatElectronicSequence,
  getElectronicCompanyId,
  getElectronicDocumentId,
  getElectronicInvoiceNumber,
  getElectronicSenderIdentification,
  isAcceptedElectronicInvoice,
  parseJsonValue
} from './notaCreditoElectronicaCore.js'
import {
  getAlanubeSecurityCode,
  getDgiiStampUrl,
  unwrapAlanubeDocumentResponse
} from '../Vender/venderCore.js'

const router = useRouter()
const toast = useToast()
const datosEmpresa = useDatosEmpresa()

const loading = ref(true)
const sending = ref(false)
const invoices = ref([])
const clients = ref([])
const existingNotes = ref([])
const alanubeConfigs = ref([])
const sequenceRecord = ref(null)
const selectedInvoiceNumber = ref('')
const selectedInvoice = ref(null)
const products = ref([])
const modificationCode = ref(3)
const reason = ref('DEVOLUCIÓN DE PRODUCTOS')
const responseData = ref(null)

const modificationOptions = [
  { value: 1, label: '1 - Anulación total' },
  { value: 2, label: '2 - Corrección de texto' },
  { value: 3, label: '3 - Corrección de montos' }
]

const noteFields = [
  'no_credito',
  'no_factura',
  'b04',
  'ncf',
  'cliente',
  'cod_cliente',
  'concepto',
  'total',
  'fecha',
  'hora',
  'nota',
  'estado',
  'fecha_uso',
  'hora_uso',
  'usuario',
  'tipo_ecf',
  'modification_code',
  'encf_referencia',
  'alanube_id',
  'legal_status',
  'sequence_consumed',
  'productos',
  'otro',
  'created_at',
  'updated_at'
]

const money = (value) =>
  Number(value || 0).toLocaleString('es-DO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

const invoiceOptions = computed(() =>
  invoices.value.map((invoice) => ({
    value: invoice.no_factura,
    label: `${invoice.no_factura} · ${getElectronicInvoiceNumber(invoice)} · ${invoice.nombre_cliente || 'Cliente'} · RD$${money(invoice.total)}`
  }))
)

const currentSequence = computed(() =>
  String(
    sequenceRecord.value?.secuencia_actual ||
      sequenceRecord.value?.secuencia ||
      sequenceRecord.value?.secuencia_inicial ||
      '1'
  )
)
const encfPreview = computed(() => formatElectronicSequence('E34', currentSequence.value))

const selectedCreditTotal = computed(() => {
  if (modificationCode.value === 2) return 0
  return products.value.reduce((sum, product) => {
    const quantity = Number(product.cantidadCredito || 0)
    const unitPrice = Number(product.precio_venta ?? product.precio ?? 0)
    const originalQuantity = Math.max(1, Number(product.cantidad || 1))
    const discountPerUnit = Number(product.descuento || 0) / originalQuantity
    return sum + Math.max(0, (unitPrice - discountPerUnit) * quantity)
  }, 0)
})

const alreadyCredited = computed(() =>
  existingNotes.value
    .filter((note) => {
      const sameInvoice =
        String(note.encf_referencia || note.ncf || '') ===
        getElectronicInvoiceNumber(selectedInvoice.value)
      const accepted = ['ACCEPTED', 'ACCEPTED_WITH_OBSERVATIONS'].includes(
        String(note.legal_status || '').toUpperCase()
      )
      return sameInvoice && accepted
    })
    .reduce((sum, note) => sum + Number(note.total || 0), 0)
)

const availableAmount = computed(() =>
  Math.max(0, Number(selectedInvoice.value?.total || 0) - alreadyCredited.value)
)

const cleanEmail = (value) => {
  const email = String(value || '').trim()
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : ''
}

const selectSequenceRecord = (records) =>
  records.find((record) => {
    const prefix = String(record.prefijo || record.tipo_ecf || '').toUpperCase()
    const active = !['NO', 'FALSE', '0', 'INACTIVO'].includes(
      String(record.activo ?? record.estado ?? 'SI').toUpperCase()
    )
    return (prefix === 'E34' || prefix === '34') && active
  }) || null

const loadData = async () => {
  loading.value = true
  try {
    await crearTablaSiNoExisteOffline('notacredito', noteFields, toast)
    const [invoiceRows, clientRows, noteRows, sequenceRows, electronicLogRows, configRows] = await Promise.all([
      peticionesFetchOffline('getDataAsArray', 'facturas'),
      peticionesFetchOffline('getDataAsArray', 'clientes'),
      peticionesFetchOffline('getDataAsArray', 'notacredito'),
      peticionesFetchOffline('getDataAsArray', 'comprobantes_electronicos'),
      peticionesFetchOffline('getDataAsArray', 'facturacion_electronica_log'),
      peticionesFetchOffline('getDataAsArray', 'configuracion_alanube')
    ])
    const electronicLogs = (Array.isArray(electronicLogRows) ? electronicLogRows : [])
      .filter((log) =>
        ['ACCEPTED', 'ACCEPTED_WITH_OBSERVATIONS'].includes(
          String(log.legal_status || '').toUpperCase()
        )
      )
      .reverse()
    invoices.value = (Array.isArray(invoiceRows) ? invoiceRows : [])
      .map((invoice) => {
        const localNumber = String(invoice.comprobante || '').trim().toUpperCase()
        const invoiceNumber = String(invoice.no_factura || '').trim()
        const log = electronicLogs.find((item) => {
          const logElectronicNumber = String(item.document_number || item.encf || '')
            .trim()
            .toUpperCase()
          return (
            (invoiceNumber && String(item.no_factura || '').trim() === invoiceNumber) ||
            (localNumber && logElectronicNumber === localNumber)
          )
        })
        if (!log) return invoice

        const rawResponse = parseJsonValue(log.raw_response, {})
        const electronicResponse = {
          ...(rawResponse && typeof rawResponse === 'object' ? rawResponse : {}),
          id: rawResponse?.id || log.alanube_id || '',
          documentNumber:
            rawResponse?.documentNumber || log.document_number || log.encf || localNumber,
          legalStatus: rawResponse?.legalStatus || log.legal_status || '',
          status: rawResponse?.status || log.status || '',
          signatureDate: rawResponse?.signatureDate || log.signature_date || '',
          securityCode: rawResponse?.securityCode || log.security_code || '',
          documentStampUrl: rawResponse?.documentStampUrl || log.document_stamp_url || '',
          xml: rawResponse?.xml || log.xml_url || '',
          resumeXml: rawResponse?.resumeXml || log.resume_xml_url || '',
          pdf: rawResponse?.pdf || log.pdf_url || '',
          governmentResponse:
            rawResponse?.governmentResponse || parseJsonValue(log.government_response, {})
        }
        return {
          ...invoice,
          comprobante: electronicResponse.documentNumber,
          otro: JSON.stringify([{ ...electronicResponse, alanubeResponse: electronicResponse }]),
          electronic_environment: log.ambiente || ''
        }
      })
      .filter(isAcceptedElectronicInvoice)
    clients.value = Array.isArray(clientRows) ? clientRows : []
    existingNotes.value = Array.isArray(noteRows) ? noteRows : []
    alanubeConfigs.value = Array.isArray(configRows) ? configRows : []
    sequenceRecord.value = selectSequenceRecord(Array.isArray(sequenceRows) ? sequenceRows : [])
  } catch (error) {
    toast.add({ severity: 'error', summary: 'Error', detail: error.message, life: 5000 })
  } finally {
    loading.value = false
  }
}

const applyModificationMode = () => {
  if (!selectedInvoice.value) return
  products.value = parseJsonValue(selectedInvoice.value.productos, []).map((product) => ({
    ...product,
    cantidadCredito:
      modificationCode.value === 1 ? Number(product.cantidad || 1) : 0
  }))
  if (modificationCode.value === 1) reason.value = 'ANULACIÓN TOTAL DE LA FACTURA'
  if (modificationCode.value === 2) reason.value = 'CORRECCIÓN DE TEXTO'
  if (modificationCode.value === 3) reason.value = 'DEVOLUCIÓN DE PRODUCTOS'
}

const useFullInvoiceAmount = () => {
  products.value.forEach((product) => {
    product.cantidadCredito = Number(product.cantidad || 0)
  })
}

watch(selectedInvoiceNumber, (invoiceNumber) => {
  selectedInvoice.value = invoices.value.find((invoice) => invoice.no_factura === invoiceNumber) || null
  responseData.value = null
  applyModificationMode()
})
watch(modificationCode, applyModificationMode)

const getAlanubeConfig = () => {
  const environment =
    String(window.localStorage.getItem('alanube_last_ambiente') || sequenceRecord.value?.ambiente || 'sandbox').toLowerCase() ===
    'production'
      ? 'production'
      : 'sandbox'
  const key = environment === 'production' ? 'alanube_config_production' : 'alanube_config_sandbox'
  let config = {}
  try {
    config = JSON.parse(window.localStorage.getItem(key) || '{}')
  } catch {}
  const databaseConfig = alanubeConfigs.value.find(
    (item) => String(item.ambiente || '').toLowerCase() === environment
  )
  if (databaseConfig) config = { ...config, ...databaseConfig }
  return { environment, config }
}

const updateSequence = async (usedSequence) => {
  const updated = {
    ...sequenceRecord.value,
    secuencia_actual: String(Number(usedSequence) + 1),
    secuencia: String(Number(usedSequence) + 1),
    contador: Number(sequenceRecord.value.contador || 0) + 1
  }
  if ('updated_at' in updated) updated.updated_at = nfecha('timestamp')
  const result = await peticionesFetchOffline(
    'updateData',
    'comprobantes_electronicos',
    JSON.stringify(updated)
  )
  if (!esRespuestaOperacionExitosa(result)) throw new Error('No se pudo actualizar la secuencia E34.')
  sequenceRecord.value = updated
}

const saveCreditNote = async (response, payload) => {
  const last = await peticionesFetchOffline('getMaxValue', 'notacredito', 'no_credito')
  const nextNumber = String(Number(Array.isArray(last) ? last[0] : last || 0) + 1).padStart(7, '0')
  const user = parseJsonValue(window.localStorage.getItem('usuarioLocal'), [])[0] || {}
  const record = {
    no_credito: nextNumber,
    no_factura: selectedInvoice.value.no_factura,
    b04: '',
    ncf: response.documentNumber || encfPreview.value,
    cliente: selectedInvoice.value.nombre_cliente || '',
    cod_cliente: selectedInvoice.value.cod_cliente || '',
    concepto: reason.value,
    total: Number(payload.totals.totalAmount || 0).toFixed(2),
    fecha: nfecha('fecha'),
    hora: nfecha('hora'),
    nota: reason.value,
    estado:
      String(response.legalStatus || response.legal_status || '').toUpperCase() === 'REJECTED'
        ? 'RECHAZADA'
        : 'EMITIDA',
    fecha_uso: nfecha('fecha'),
    hora_uso: nfecha('hora'),
    usuario: user.usuario || '',
    tipo_ecf: 'E34',
    modification_code: String(modificationCode.value),
    encf_referencia: getElectronicInvoiceNumber(selectedInvoice.value),
    alanube_id: response.id || '',
    legal_status: response.legalStatus || response.legal_status || '',
    sequence_consumed: response.sequenceConsumed === true ? 'SI' : 'NO',
    productos: JSON.stringify(payload.itemDetails),
    otro: JSON.stringify([{ ...response, payload }]),
    created_at: nfecha('timestamp'),
    updated_at: nfecha('timestamp')
  }
  const result = await peticionesFetchOffline('insertData', 'notacredito', JSON.stringify(record))
  if (!esRespuestaOperacionExitosa(result)) throw new Error('Alanube aceptó la nota, pero no pudo guardarse localmente.')
  existingNotes.value.push(record)
}

const issueCreditNote = async () => {
  if (sending.value) return
  try {
    if (!selectedInvoice.value) throw new Error('Seleccione una factura electrónica aceptada.')
    if (!sequenceRecord.value) throw new Error('No existe una secuencia E34 activa configurada.')
    if (modificationCode.value === 1 && alreadyCredited.value > 0) {
      throw new Error('La factura ya tiene notas aplicadas. Use corrección de montos para acreditar el saldo restante.')
    }
    if (modificationCode.value !== 2 && selectedCreditTotal.value > availableAmount.value + 0.01) {
      throw new Error('El monto de la nota excede el saldo disponible de la factura.')
    }

    const { environment, config } = getAlanubeConfig()
    const token = String(config.token_api || '').trim()
    if (!token) throw new Error(`Falta el token de Alanube para ${environment}.`)
    const baseUrl = environment === 'production' ? 'https://api.alanube.co/dom/v1' : 'https://sandbox.alanube.co/dom/v1'
    const invoiceCompanyId = getElectronicCompanyId(selectedInvoice.value)
    const configuredCompanyId = String(
      config.id_compania || sequenceRecord.value?.id_compania || ''
    ).trim()
    const invoiceSenderRnc = getElectronicSenderIdentification(selectedInvoice.value)
    const configuredSenderRnc = String(
      config.rnc_emisor || sequenceRecord.value?.rnc_emisor || datosEmpresa.empresa.rnc || ''
    ).replace(/\D/g, '')
    const useOriginalIssuer = Boolean(invoiceCompanyId && invoiceSenderRnc)
    const companyId = useOriginalIssuer ? invoiceCompanyId : configuredCompanyId
    const senderRnc = useOriginalIssuer ? invoiceSenderRnc : configuredSenderRnc
    if (!senderRnc) throw new Error('Falta el RNC del emisor.')
    if (!companyId) throw new Error('Falta el ID de la compania de Alanube que emitio la factura.')
    if (!useOriginalIssuer && invoiceSenderRnc && invoiceSenderRnc !== configuredSenderRnc) {
      throw new Error(
        `La factura fue emitida por el RNC ${invoiceSenderRnc}, pero la compania configurada usa ${configuredSenderRnc}. No se puede emitir una E34 con otro emisor.`
      )
    }

    const referenceDocumentId = getElectronicDocumentId(selectedInvoice.value)
    if (!referenceDocumentId) {
      throw new Error('La factura seleccionada no tiene el ID de Alanube necesario para verificarla.')
    }
    const storedReferenceNumber = getElectronicInvoiceNumber(selectedInvoice.value)
    const referenceEndpoint = storedReferenceNumber.startsWith('E31')
      ? 'fiscal-invoices'
      : 'invoices'
    const referenceResponse = await axios.get(
      `${baseUrl}/${referenceEndpoint}/${encodeURIComponent(referenceDocumentId)}/idCompany/${encodeURIComponent(companyId)}`,
      {
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${token}`
        }
      }
    )
    const verifiedReference = unwrapAlanubeDocumentResponse(referenceResponse.data || {})
    const verifiedReferenceNumber = String(
      verifiedReference.documentNumber || verifiedReference.encf || storedReferenceNumber
    )
      .trim()
      .toUpperCase()
    const verifiedLegalStatus = String(
      verifiedReference.legalStatus || verifiedReference.legal_status || ''
    ).toUpperCase()
    const verifiedSenderRnc = String(
      verifiedReference.companyIdentification || verifiedReference.company_identification || senderRnc
    ).replace(/\D/g, '')
    if (!['ACCEPTED', 'ACCEPTED_WITH_OBSERVATIONS'].includes(verifiedLegalStatus)) {
      throw new Error(
        `Alanube no confirma la factura ${verifiedReferenceNumber} como aceptada. Estado: ${verifiedLegalStatus || 'sin estado'}.`
      )
    }
    if (verifiedSenderRnc && verifiedSenderRnc !== senderRnc) {
      throw new Error(
        `La factura ${verifiedReferenceNumber} pertenece al RNC ${verifiedSenderRnc}, no al emisor ${senderRnc}.`
      )
    }

    const client = clients.value.find((item) => item.codigo === selectedInvoice.value.cod_cliente) || {}
    const buyerRnc = String(client.rnc || selectedInvoice.value.rnc_cliente || '').replace(/\D/g, '')
    const buyer = {}
    if (buyerRnc) buyer.rnc = buyerRnc
    if (selectedInvoice.value.nombre_cliente || client.nombre) {
      buyer.companyName = String(selectedInvoice.value.nombre_cliente || client.nombre).slice(0, 150)
    }
    const buyerEmail = cleanEmail(client.correo || client.email)
    if (buyerEmail) buyer.mail = buyerEmail
    if (client.direccion) buyer.address = String(client.direccion).slice(0, 100)

    const payload = buildElectronicCreditNotePayload({
      encf: encfPreview.value,
      company: companyId ? { id: companyId } : undefined,
      sender: {
        rnc: senderRnc,
        companyName: String(datosEmpresa.empresa.nombre || config.nombre_empresa || 'EMPRESA').slice(0, 150),
        address: String(datosEmpresa.empresa.direccion || config.direccion || 'Santo Domingo').slice(0, 100),
        stampDate: new Date().toISOString().slice(0, 10)
      },
      buyer,
      referencedInvoice: {
        ...selectedInvoice.value,
        comprobante: verifiedReferenceNumber
      },
      modificationCode: modificationCode.value,
      reason: reason.value,
      products: products.value
    })
    console.log('Identidad usada para nota de credito E34:', {
      environment,
      companyId: companyId || 'sin company.id',
      senderRnc,
      invoiceSenderRnc: invoiceSenderRnc || 'no disponible',
      invoiceCompanyId: invoiceCompanyId || 'no disponible'
    })
    const payloadTotal = Number(payload.totals.totalAmount || 0)
    if (modificationCode.value === 1 && Math.abs(payloadTotal - availableAmount.value) > 0.01) {
      throw new Error(
        `La anulación total debe ser exactamente RD$${money(availableAmount.value)}, pero los productos suman RD$${money(payloadTotal)}.`
      )
    }
    if (modificationCode.value === 3 && payloadTotal > availableAmount.value + 0.01) {
      throw new Error('El total fiscal calculado excede el saldo disponible de la factura.')
    }

    sending.value = true
    const apiResponse = await axios.post(`${baseUrl}/credit-notes`, payload, {
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })
    console.log('===== RESPUESTA RAW ALANUBE NOTA CREDITO E34 =====')
    console.log(apiResponse.data)
    console.log(JSON.stringify(apiResponse.data, null, 2))
    console.log('===== FIN RESPUESTA RAW ALANUBE NOTA CREDITO E34 =====')

    const response = unwrapAlanubeDocumentResponse(apiResponse.data || {})
    const status = String(response.status || '').toUpperCase()
    const legalStatus = String(response.legalStatus || response.legal_status || '').toUpperCase()
    responseData.value = {
      ...response,
      documentNumber: response.documentNumber || encfPreview.value,
      documentStampUrl: getDgiiStampUrl(response),
      securityCode: getAlanubeSecurityCode(response)
    }
    if (status === 'FAILED' || legalStatus === 'REJECTED') {
      await updateSequence(String(responseData.value.documentNumber).slice(3))
      await saveCreditNote(responseData.value, payload)
      throw new Error(response.error?.message || 'La nota de crédito fue rechazada por Alanube/DGII.')
    }

    await updateSequence(String(responseData.value.documentNumber).slice(3))
    await saveCreditNote(responseData.value, payload)
    toast.add({
      severity: legalStatus.startsWith('ACCEPTED') ? 'success' : 'info',
      summary: 'Nota de crédito electrónica',
      detail: `${responseData.value.documentNumber} emitida con estado ${legalStatus || status || 'REGISTRADA'}.`,
      life: 6000
    })
  } catch (error) {
    console.log('===== RESPUESTA RAW ALANUBE ERROR NOTA CREDITO E34 =====')
    console.log(error.response?.data)
    console.log(JSON.stringify(error.response?.data ?? null, null, 2))
    console.log('===== FIN RESPUESTA RAW ALANUBE ERROR NOTA CREDITO E34 =====')
    const errors = error.response?.data?.errors
    const usedSequenceError = Array.isArray(errors)
      ? errors.find((item) => String(item.code || '').toUpperCase() === 'AP3001')
      : null
    if (usedSequenceError) {
      await updateSequence(encfPreview.value.slice(3))
    }
    const detail = Array.isArray(errors)
      ? errors.map((item) => `${item.code || ''} ${item.message || ''}`.trim()).join(', ')
      : error.message
    toast.add({ severity: 'error', summary: 'No se pudo emitir E34', detail, life: 8000 })
  } finally {
    sending.value = false
  }
}

onMounted(loadData)
</script>

<template>
  <main class="ecn-page">
    <section class="ecn-hero">
      <div>
        <span class="ecn-kicker">Facturación electrónica</span>
        <h1>Nota de Crédito Electrónica E34</h1>
        <p>Emite anulaciones, correcciones de texto o ajustes de monto sobre facturas aceptadas por DGII.</p>
      </div>
      <div class="ecn-actions">
        <Button label="Volver" icon="pi pi-arrow-left" severity="secondary" outlined @click="router.push('/notacredito')" />
        <Button label="Recargar" icon="pi pi-refresh" severity="info" outlined :loading="loading" @click="loadData" />
      </div>
    </section>

    <section v-if="!sequenceRecord && !loading" class="ecn-alert danger">
      No existe una secuencia electrónica E34 activa. Configúrala antes de emitir notas de crédito.
    </section>

    <div class="ecn-grid">
      <section class="ecn-panel">
        <h2>1. Factura referenciada</h2>
        <label>Factura electrónica aceptada</label>
        <Select
          v-model="selectedInvoiceNumber"
          :options="invoiceOptions"
          option-label="label"
          option-value="value"
          filter
          filter-placeholder="Buscar por factura, e-NCF, cliente o monto"
          empty-filter-message="No se encontraron facturas"
          empty-message="No hay facturas electrónicas aceptadas"
          placeholder="Seleccione una factura"
          show-clear
          fluid
          :disabled="loading || sending"
          class="invoice-select"
        />

        <div v-if="selectedInvoice" class="invoice-summary">
          <div><span>e-NCF original</span><strong>{{ getElectronicInvoiceNumber(selectedInvoice) }}</strong></div>
          <div><span>Total factura</span><strong>RD$ {{ money(selectedInvoice.total) }}</strong></div>
          <div><span>Ya acreditado</span><strong>RD$ {{ money(alreadyCredited) }}</strong></div>
          <div><span>Disponible</span><strong class="green">RD$ {{ money(availableAmount) }}</strong></div>
        </div>
      </section>

      <section class="ecn-panel">
        <h2>2. Tipo y motivo</h2>
        <label>Tipo de modificación DGII</label>
        <select v-model.number="modificationCode" :disabled="sending">
          <option v-for="option in modificationOptions" :key="option.value" :value="option.value">
            {{ option.label }}
          </option>
        </select>
        <label>Motivo</label>
        <textarea v-model="reason" rows="3" maxlength="90" :disabled="sending" />
        <small v-if="modificationCode === 1">Debe anular exactamente el saldo completo disponible.</small>
        <small v-else-if="modificationCode === 2">La corrección de texto se emitirá con total RD$0.00.</small>
        <small v-else>Seleccione las cantidades que serán acreditadas.</small>
      </section>
    </div>

    <section v-if="selectedInvoice && modificationCode !== 2" class="ecn-panel products-panel">
      <div class="products-heading">
        <h2>3. Productos a acreditar</h2>
        <Button
          label="Usar total de la factura"
          icon="pi pi-check-square"
          severity="success"
          outlined
          :disabled="sending || products.length === 0 || alreadyCredited > 0"
          @click="useFullInvoiceAmount"
        />
      </div>
      <small v-if="alreadyCredited > 0" class="full-total-warning">
        La factura ya tiene notas aplicadas; el total completo no puede seleccionarse nuevamente.
      </small>
      <div class="table-wrap">
        <table>
          <thead><tr><th>Producto</th><th>Facturado</th><th>Precio</th><th>Cantidad crédito</th></tr></thead>
          <tbody>
            <tr v-for="(product, index) in products" :key="`${product.codigo || product.nombre}-${index}`">
              <td>{{ product.nombre || product.descripcion }}</td>
              <td>{{ product.cantidad }}</td>
              <td>RD$ {{ money(product.precio_venta ?? product.precio) }}</td>
              <td>
                <input
                  v-model.number="product.cantidadCredito"
                  type="number"
                  min="0"
                  :max="Number(product.cantidad || 0)"
                  step="0.01"
                  :readonly="modificationCode === 1"
                />
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <section class="ecn-panel issue-panel">
      <div>
        <span>Próximo e-NCF</span>
        <strong>{{ encfPreview }}</strong>
      </div>
      <div>
        <span>Total de la nota</span>
        <strong class="total">RD$ {{ money(selectedCreditTotal) }}</strong>
      </div>
      <Button
        label="Emitir Nota E34"
        icon="pi pi-send"
        severity="success"
        size="large"
        :loading="sending"
        :disabled="!selectedInvoice || !sequenceRecord"
        @click="issueCreditNote"
      />
    </section>

    <section v-if="responseData" class="ecn-panel response-panel">
      <h2>Nota emitida</h2>
      <div class="response-grid">
        <div><span>e-NCF</span><strong>{{ responseData.documentNumber }}</strong></div>
        <div><span>Estado</span><strong>{{ responseData.legalStatus || responseData.status }}</strong></div>
        <div><span>Código de seguridad</span><strong>{{ responseData.securityCode }}</strong></div>
      </div>
      <a v-if="responseData.documentStampUrl" :href="responseData.documentStampUrl" target="_blank" rel="noopener">
        Verificar en DGII
      </a>
      <a v-if="responseData.pdf" :href="responseData.pdf" target="_blank" rel="noopener">Abrir PDF de Alanube</a>
    </section>
  </main>
</template>

<style scoped>
.ecn-page { max-width: 1240px; margin: 0 auto; padding: 24px; color: #172033; }
.ecn-hero { display: flex; justify-content: space-between; gap: 20px; padding: 26px; border-radius: 20px; color: white; background: linear-gradient(135deg, #312e81, #2563eb); box-shadow: 0 18px 45px #1e3a8a33; }
.ecn-hero h1 { margin: 5px 0 8px; font-size: 28px; }
.ecn-hero p { margin: 0; opacity: .88; }
.ecn-kicker { text-transform: uppercase; letter-spacing: .12em; font-size: 12px; font-weight: 800; }
.ecn-actions { display: flex; align-items: flex-start; gap: 10px; }
.ecn-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; margin-top: 20px; }
.ecn-panel { margin-top: 18px; padding: 22px; border: 1px solid #dbe3ef; border-radius: 18px; background: white; box-shadow: 0 8px 26px #0f172a0d; }
.ecn-grid .ecn-panel { margin-top: 0; }
.ecn-panel h2 { margin: 0 0 18px; font-size: 18px; }
.products-heading { display: flex; align-items: center; justify-content: space-between; gap: 14px; margin-bottom: 18px; }
.products-heading h2 { margin: 0; }
.full-total-warning { margin: -8px 0 14px; color: #b45309; }
label { display: block; margin: 12px 0 7px; font-weight: 700; font-size: 13px; color: #475569; }
select, textarea, input { width: 100%; border: 1px solid #cbd5e1; border-radius: 10px; padding: 11px 12px; background: white; color: #172033; }
textarea { resize: vertical; }
small { display: block; margin-top: 9px; color: #64748b; }
.invoice-summary, .response-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 16px; }
.invoice-summary div, .response-grid div { padding: 13px; border-radius: 12px; background: #f8fafc; }
.invoice-summary span, .response-grid span, .issue-panel span { display: block; margin-bottom: 5px; color: #64748b; font-size: 12px; text-transform: uppercase; }
.green { color: #059669; }
.table-wrap { overflow-x: auto; }
table { width: 100%; border-collapse: collapse; }
th, td { padding: 12px; border-bottom: 1px solid #e2e8f0; text-align: left; }
th { color: #475569; font-size: 12px; text-transform: uppercase; background: #f8fafc; }
td input { max-width: 150px; }
.issue-panel { display: flex; align-items: center; justify-content: space-between; gap: 20px; }
.issue-panel strong { font-size: 22px; }
.issue-panel .total { color: #059669; font-size: 28px; }
.response-panel { border-color: #86efac; background: #f0fdf4; }
.response-panel a { display: inline-block; margin: 16px 14px 0 0; font-weight: 700; color: #1d4ed8; }
.ecn-alert { margin-top: 18px; padding: 14px 18px; border-radius: 12px; }
.ecn-alert.danger { color: #991b1b; background: #fef2f2; border: 1px solid #fecaca; }
@media (max-width: 800px) {
  .ecn-page { padding: 14px; }
  .ecn-hero, .issue-panel { flex-direction: column; }
  .ecn-grid { grid-template-columns: 1fr; }
  .ecn-actions { width: 100%; flex-wrap: wrap; }
}
</style>
