const roundMoney = (value) => Math.round((Number(value || 0) + Number.EPSILON) * 100) / 100

export const parseJsonValue = (value, fallback = []) => {
  if (value === null || value === undefined || value === '') return fallback
  if (typeof value !== 'string') return value
  try {
    return JSON.parse(value)
  } catch {
    return fallback
  }
}

export const getStoredElectronicData = (invoice = {}) => {
  const stored = parseJsonValue(invoice.otro, [])
  return Array.isArray(stored) ? stored[0] || {} : stored || {}
}

export const getElectronicInvoiceNumber = (invoice = {}) => {
  const electronic = getStoredElectronicData(invoice)
  const original =
    electronic.alanubeResponse && typeof electronic.alanubeResponse === 'object'
      ? electronic.alanubeResponse
      : {}
  const candidates = [
    electronic.documentNumber,
    original.documentNumber,
    electronic.encf,
    electronic.ecf,
    original.encf,
    original.ecf,
    invoice.comprobante
  ]
  return (
    candidates
      .map((value) => String(value || '').trim().toUpperCase())
      .find((value) => /^E\d{12}$/.test(value)) || ''
  )
}

export const getElectronicDocumentId = (invoice = {}) => {
  const electronic = getStoredElectronicData(invoice)
  const original =
    electronic.alanubeResponse && typeof electronic.alanubeResponse === 'object'
      ? electronic.alanubeResponse
      : {}
  return String(
    electronic.internalTrackId ||
      electronic.id ||
      electronic.alanube_id ||
      original.internalTrackId ||
      original.id ||
      ''
  ).trim()
}

export const getElectronicSenderIdentification = (invoice = {}) => {
  const electronic = getStoredElectronicData(invoice)
  const original =
    electronic.alanubeResponse && typeof electronic.alanubeResponse === 'object'
      ? electronic.alanubeResponse
      : {}
  const candidates = [
    electronic.companyIdentification,
    electronic.company_identification,
    electronic.rnc,
    electronic.sender?.rnc,
    electronic.payload?.sender?.rnc,
    original.companyIdentification,
    original.company_identification,
    original.rnc,
    original.sender?.rnc
  ]
  const direct = candidates
    .map((value) => String(value || '').replace(/\D/g, ''))
    .find((value) => value.length === 9 || value.length === 11)
  if (direct) return direct

  const stampUrl = String(
    electronic.documentStampUrl ||
      electronic.document_stamp_url ||
      electronic.qr_url ||
      original.documentStampUrl ||
      original.document_stamp_url ||
      original.qr_url ||
      ''
  )
  const match = stampUrl.match(/[?&]RncEmisor=([^&#]+)/i)
  return match ? decodeURIComponent(match[1]).replace(/\D/g, '') : ''
}

export const getElectronicCompanyId = (invoice = {}) => {
  const electronic = getStoredElectronicData(invoice)
  const original =
    electronic.alanubeResponse && typeof electronic.alanubeResponse === 'object'
      ? electronic.alanubeResponse
      : {}
  const candidates = [
    electronic.company?.id,
    electronic.companyId,
    electronic.company_id,
    electronic.id_compania,
    electronic.payload?.company?.id,
    original.company?.id,
    original.companyId,
    original.company_id
  ]
  const direct = candidates.map((value) => String(value || '').trim()).find(Boolean)
  if (direct) return direct

  const documentUrls = [
    electronic.xml,
    electronic.resumeXml,
    electronic.resume_xml,
    electronic.pdf,
    original.xml,
    original.resumeXml,
    original.resume_xml,
    original.pdf
  ]
  for (const documentUrl of documentUrls) {
    const match = String(documentUrl || '').match(/\/companies\/([^/?#]+)\//i)
    if (match) return decodeURIComponent(match[1])
  }
  return ''
}

export const isAcceptedElectronicInvoice = (invoice = {}) => {
  const electronic = getStoredElectronicData(invoice)
  const original =
    electronic.alanubeResponse && typeof electronic.alanubeResponse === 'object'
      ? electronic.alanubeResponse
      : {}
  const legalStatus = String(
    electronic.legalStatus ||
      electronic.legal_status ||
      original.legalStatus ||
      original.legal_status ||
      ''
  ).toUpperCase()
  const governmentResponse =
    electronic.governmentResponse ||
    electronic.government_response ||
    original.governmentResponse ||
    original.government_response ||
    {}
  const governmentCodeRaw = governmentResponse?.code
  const hasGovernmentCode =
    governmentCodeRaw !== undefined &&
    governmentCodeRaw !== null &&
    String(governmentCodeRaw).trim() !== ''
  const governmentCode = hasGovernmentCode ? Number(governmentCodeRaw) : Number.NaN
  const registrationStatus = String(electronic.status || original.status || '').toUpperCase()
  const electronicNumber = getElectronicInvoiceNumber(invoice)
  const isCreditNoteSource = /^E(?:31|32)\d{10}$/.test(electronicNumber)
  const rejected =
    ['REJECTED', 'CANCELLED', 'VOIDED'].includes(legalStatus) ||
    ['REJECTED', 'CANCELLED', 'VOIDED'].includes(registrationStatus) ||
    (Number.isFinite(governmentCode) && governmentCode !== 1)
  const accepted =
    ['ACCEPTED', 'ACCEPTED_WITH_OBSERVATIONS'].includes(legalStatus) ||
    governmentCode === 1 ||
    registrationStatus === 'REGISTERED' ||
    (!legalStatus && !registrationStatus && !Number.isFinite(governmentCode))
  return isCreditNoteSource && !rejected && accepted
}

export const normalizeReferenceDate = (value) => {
  const raw = String(value || '').trim().split(/[ T]/)[0]
  let match = raw.match(/^(\d{4})[-/](\d{2})[-/](\d{2})$/)
  if (match) return `${match[1]}-${match[2]}-${match[3]}`
  match = raw.match(/^(\d{2})[-/](\d{2})[-/](\d{4})$/)
  if (match) return `${match[3]}-${match[2]}-${match[1]}`
  return ''
}

export const getInvoiceReferenceDate = (invoice = {}) => {
  const electronic = getStoredElectronicData(invoice)
  const original =
    electronic.alanubeResponse && typeof electronic.alanubeResponse === 'object'
      ? electronic.alanubeResponse
      : {}
  const candidates = [
    invoice.fecha_emision,
    invoice.fecha,
    invoice.emissionDate,
    invoice.stampDate,
    electronic.emissionDate,
    electronic.stampDate,
    electronic.signatureDate,
    original.emissionDate,
    original.stampDate,
    original.signatureDate,
    invoice.created_at
  ]

  return candidates.map(normalizeReferenceDate).find(Boolean) || ''
}

export const calculateCreditNoteIndicator = (referenceDate, issueDate) => {
  const reference = normalizeReferenceDate(referenceDate)
  const issue = normalizeReferenceDate(issueDate)
  if (!reference || !issue) return 0

  const toUtcTime = (value) => {
    const [year, month, day] = value.split('-').map(Number)
    return Date.UTC(year, month - 1, day)
  }
  const elapsedDays = Math.floor((toUtcTime(issue) - toUtcTime(reference)) / 86400000)
  return elapsedDays > 30 ? 1 : 0
}

export const formatElectronicSequence = (prefix = 'E34', sequence = 1) =>
  `${String(prefix).toUpperCase()}${String(Math.max(1, Number(sequence) || 1)).padStart(10, '0')}`

export const createCreditNoteLines = (products = [], modificationCode = 3) => {
  if (Number(modificationCode) === 2) {
    return [
      {
        lineNumber: 1,
        billingIndicator: 0,
        itemName: 'CORRECCION DE TEXTO',
        itemDescription: 'Corrección de texto del comprobante referenciado',
        goodServiceIndicator: 2,
        quantityItem: 1,
        unitMeasure: 43,
        unitPriceItem: 0,
        itemAmount: 0
      }
    ]
  }

  return products
    .map((product, index) => {
      const quantity = Number(product.cantidadCredito ?? product.cantidad ?? 0)
      if (!Number.isFinite(quantity) || quantity <= 0) return null

      const taxRate = Number(product.impuestos ?? product.itbis ?? 0)
      const billingIndicator = Math.abs(taxRate - 18) < 0.01 ? 1 : Math.abs(taxRate - 16) < 0.01 ? 2 : 4
      const grossUnitPrice = Number(product.precio_venta ?? product.precio ?? 0)
      const unitPriceItem = roundMoney(
        billingIndicator === 1 || billingIndicator === 2
          ? grossUnitPrice / (1 + taxRate / 100)
          : grossUnitPrice
      )
      const originalQuantity = Math.max(1, Number(product.cantidad || quantity))
      const originalDiscount = Math.max(0, Number(product.descuento || 0))
      const proportionalDiscount = roundMoney((originalDiscount / originalQuantity) * quantity)
      const discountAmount = roundMoney(
        billingIndicator === 1 || billingIndicator === 2
          ? proportionalDiscount / (1 + taxRate / 100)
          : proportionalDiscount
      )
      const itemAmount = roundMoney(unitPriceItem * quantity - discountAmount)

      const line = {
        lineNumber: index + 1,
        billingIndicator,
        itemName: String(product.nombre || product.descripcion || 'PRODUCTO').slice(0, 80),
        itemDescription: String(product.descripcion || product.nombre || '').slice(0, 1000),
        goodServiceIndicator: Number(product.tipo_bien_servicio || 1) === 2 ? 2 : 1,
        quantityItem: quantity,
        unitMeasure: Number(product.unidad_medida || 43),
        unitPriceItem,
        itemAmount
      }
      if (discountAmount > 0) line.discountAmount = discountAmount
      return line
    })
    .filter(Boolean)
    .map((line, index) => ({ ...line, lineNumber: index + 1 }))
}

export const calculateCreditNoteTotals = (lines = []) => {
  let taxed1 = 0
  let taxed2 = 0
  let exempt = 0

  for (const line of lines) {
    if (line.billingIndicator === 1) taxed1 += Number(line.itemAmount || 0)
    else if (line.billingIndicator === 2) taxed2 += Number(line.itemAmount || 0)
    else if (line.billingIndicator === 4) exempt += Number(line.itemAmount || 0)
  }

  taxed1 = roundMoney(taxed1)
  taxed2 = roundMoney(taxed2)
  exempt = roundMoney(exempt)
  const itbis1 = roundMoney(taxed1 * 0.18)
  const itbis2 = roundMoney(taxed2 * 0.16)
  const totalTaxedAmount = roundMoney(taxed1 + taxed2)
  const itbisTotal = roundMoney(itbis1 + itbis2)
  const totalAmount = roundMoney(totalTaxedAmount + exempt + itbisTotal)
  const totals = { totalAmount }

  if (totalTaxedAmount > 0) totals.totalTaxedAmount = totalTaxedAmount
  if (taxed1 > 0) {
    totals.i1AmountTaxed = taxed1
    totals.itbisS1 = 18
    totals.itbis1Total = itbis1
  }
  if (taxed2 > 0) {
    totals.i2AmountTaxed = taxed2
    totals.itbisS2 = 16
    totals.itbis2Total = itbis2
  }
  if (itbisTotal > 0) totals.itbisTotal = itbisTotal
  if (exempt > 0) totals.totalExemptAmount = exempt
  return totals
}

export const buildElectronicCreditNotePayload = ({
  encf,
  company,
  sender,
  buyer,
  referencedInvoice,
  modificationCode,
  reason,
  products
}) => {
  const referenceNumber = String(referencedInvoice?.comprobante || '').trim().toUpperCase()
  const referenceDate = getInvoiceReferenceDate(referencedInvoice)
  const issueDate = normalizeReferenceDate(sender?.stampDate) || new Date().toISOString().slice(0, 10)
  if (!/^E\d{12}$/.test(referenceNumber)) throw new Error('La factura no tiene un e-NCF válido.')
  if (!referenceDate) throw new Error('La fecha de la factura referenciada no es válida.')
  if (!String(reason || '').trim()) throw new Error('Debe indicar el motivo de la nota de crédito.')

  const itemDetails = createCreditNoteLines(products, modificationCode)
  if (itemDetails.length === 0) throw new Error('Seleccione al menos un producto para acreditar.')
  const totals = calculateCreditNoteTotals(itemDetails)

  return {
    ...(company?.id ? { company: { id: String(company.id).trim() } } : {}),
    idDoc: {
      encf,
      creditNoteIndicator: calculateCreditNoteIndicator(referenceDate, issueDate),
      incomeType: 1,
      paymentType: 1,
      taxAmountIndicator: Number(totals.itbisTotal || 0) > 0 ? 0 : undefined
    },
    sender,
    ...(buyer && Object.keys(buyer).length > 0 ? { buyer } : {}),
    totals,
    itemDetails,
    informationReference: {
      modificationCode: Number(modificationCode),
      ncfModified: referenceNumber,
      ncfModifiedDate: referenceDate,
      reasonForModification: String(reason).trim().slice(0, 90)
    },
    config: { pdf: { type: 'generic' } }
  }
}
