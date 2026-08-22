export const toFiniteNumber = (value, fallback = 0) => {
  if (value === null || value === undefined || value === '') return fallback
  const number = Number(value)
  return Number.isFinite(number) ? number : fallback
}

export const unwrapAlanubeDocumentResponse = (payload = {}) => {
  if (Array.isArray(payload)) {
    return unwrapAlanubeDocumentResponse(payload[0] || {})
  }

  if (!payload || typeof payload !== 'object') return {}

  for (const key of ['data', 'result', 'document', 'invoice', 'response']) {
    const nested = payload[key]
    if (nested && typeof nested === 'object') {
      return { ...payload, ...unwrapAlanubeDocumentResponse(nested) }
    }
  }

  return payload
}

export const getAlanubeSecurityCode = (data = {}) => {
  const document = unwrapAlanubeDocumentResponse(data)
  return String(
    document.securityCode ||
      document.security_code ||
      document.codigoSeguridad ||
      document.codigo_seguridad ||
      ''
  ).trim()
}

export const getDgiiStampUrl = (data = {}) => {
  const document = unwrapAlanubeDocumentResponse(data)
  const candidate = String(
    document.documentStampUrl ||
      document.document_stamp_url ||
      document.documentStampURL ||
      document.stampUrl ||
      document.qr_url ||
      ''
  ).trim()
  if (!candidate) return ''

  try {
    const url = new URL(candidate)
    const hostname = url.hostname.toLowerCase()
    const pathname = url.pathname.toLowerCase()
    const isStandardStamp =
      hostname === 'ecf.dgii.gov.do' && /\/consultatimbre\/?$/.test(pathname)
    const isConsumerStamp =
      hostname === 'fc.dgii.gov.do' && /\/consultatimbrefc\/?$/.test(pathname)
    return url.protocol === 'https:' && (isStandardStamp || isConsumerStamp) ? candidate : ''
  } catch {
    return ''
  }
}

export const normalizeSearchText = (value) =>
  String(value ?? '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')

export const isInvoiceStateLocked = (role) =>
  ['CAJERO', 'VENDEDOR'].includes(String(role || '').trim().toUpperCase())

export const getProductStock = (product = {}) =>
  toFiniteNumber(product.stock ?? product.existencia ?? product.cantidad, 0)

export const getProductSalePrice = (product = {}) => toFiniteNumber(product.precio_venta, 0)

export const buildProductCategories = (products = []) => {
  const categories = new Set(['TODAS'])
  products.forEach((product) => {
    const category = String(product?.categoria || '').trim()
    if (category) categories.add(category)
  })
  return Array.from(categories)
}

export const filterPosProducts = (
  products = [],
  { search = '', category = 'TODAS', showOutOfStock = false, limit = 120 } = {}
) => {
  const term = normalizeSearchText(search)
  const selectedCategory = String(category || 'TODAS').trim()

  return products
    .filter((product) => {
      if (!product?.codigo && !product?.id) return false
      if (!showOutOfStock && getProductStock(product) <= 0) return false
      if (
        selectedCategory !== 'TODAS' &&
        String(product?.categoria || '').trim() !== selectedCategory
      ) {
        return false
      }
      if (!term) return true
      return [
        product?.nombre,
        product?.codigo,
        product?.codigo_barra,
        product?.categoria,
        product?.ubicacion
      ].some((value) => normalizeSearchText(value).includes(term))
    })
    .slice(0, Math.max(0, toFiniteNumber(limit, 120)))
}

export const getCartProductQuantity = (cart = [], product = {}) => {
  if (!product?.codigo) return 0
  const found = cart.find((item) => String(item?.codigo) === String(product.codigo))
  return toFiniteNumber(found?.cantidad, 0)
}

export const calculateProductDiscount = (product = {}) =>
  toFiniteNumber(product.descuento, 0)

export const calculateProductTax = (product = {}) => {
  const taxPercentage = toFiniteNumber(product.impuestos, 0)
  if (!taxPercentage) return 0
  const quantity = toFiniteNumber(product.cantidad, 1) || 1
  return Number((toFiniteNumber(product.impuesto_venta, 0) * quantity).toFixed(2))
}

export const calculateProductTotal = (product = {}) => {
  const quantity = toFiniteNumber(product.cantidad, 1) || 1
  const price = toFiniteNumber(product.precio_final, 0) || toFiniteNumber(product.precio_venta, 0)
  return Number((price * quantity - calculateProductDiscount(product)).toFixed(2))
}

export const calculateProductProfit = (product = {}, inventory = []) => {
  const inventoryProduct = inventory.find(
    (item) => String(item?.codigo ?? '') === String(product?.codigo ?? '')
  )
  const salePrice = toFiniteNumber(product.precio_venta, 0)
  const purchasePrice =
    toFiniteNumber(product.precio_compra, NaN) || toFiniteNumber(inventoryProduct?.precio_compra, 0)
  const quantity = toFiniteNumber(product.cantidad, 0)
  return Math.round((salePrice - purchasePrice) * quantity)
}

export const calculateSaleSummary = (products = [], inventory = [], taxResolver = calculateProductTax) => {
  let total = 0
  let tax = 0
  let discount = 0
  let profit = 0
  let quantity = 0

  products.forEach((product) => {
    total += calculateProductTotal(product)
    if (!['DESCUENTO', 'DESCUENTO APLICADO'].includes(String(product?.nombre || '').toUpperCase())) {
      tax += toFiniteNumber(taxResolver(product), 0)
    }
    discount += calculateProductDiscount(product)
    profit += calculateProductProfit(product, inventory)
    quantity += toFiniteNumber(product.cantidad, 0)
  })

  return {
    subtotal: Number((total - tax + discount).toFixed(2)),
    discount: Number(discount.toFixed(2)),
    tax: Number(tax.toFixed(2)),
    total: Number(total.toFixed(2)),
    profit: Number(profit.toFixed(2)),
    quantity: Number(quantity.toFixed(2))
  }
}

export const calculatePureProfit = (products = []) =>
  products.reduce((sum, product) => {
    const name = String(product?.nombre || '').toUpperCase()
    if (name.includes('DESCUENTO') || name.includes('DELIVERY')) return sum
    return (
      sum +
      (toFiniteNumber(product.precio_venta, 0) - toFiniteNumber(product.precio_compra, 0)) *
        toFiniteNumber(product.cantidad, 0)
    )
  }, 0)

export const roundDownToInterval = (value, interval) => {
  const safeInterval = toFiniteNumber(interval, 0)
  if (safeInterval <= 0) return toFiniteNumber(value, 0)
  return Math.floor(toFiniteNumber(value, 0) / safeInterval) * safeInterval
}

export const calculateDiscountOptions = (total, interval = 5, count = 3) =>
  Array.from({ length: Math.max(0, toFiniteNumber(count, 0)) }, (_, index) =>
    roundDownToInterval(toFiniteNumber(total, 0) - (index + 1) * interval, interval)
  )

export const parseStoredProducts = (products) => {
  if (Array.isArray(products)) return products
  if (typeof products !== 'string' || !products.trim()) return []

  let parsed
  try {
    parsed = JSON.parse(products.trim())
  } catch {
    try {
      parsed = JSON.parse(
        products
          .trim()
          .replace(/"otro":"\[[^\]]*?\]",?/g, '')
          .replace(/"caracteristicas":"\[\]",?/g, '')
      )
    } catch {
      return []
    }
  }

  const list = Array.isArray(parsed) ? parsed : parsed ? [parsed] : []
  return list.map((product) => {
    if (!product || typeof product !== 'object') return {}
    const cleanProduct = { ...product }
    delete cleanProduct.otro
    delete cleanProduct.caracteristicas
    return cleanProduct
  })
}

export const calculateStoredProductsTotal = (products) =>
  parseStoredProducts(products)
    .reduce((sum, product) => sum + toFiniteNumber(product?.total, 0), 0)
    .toFixed(2)

export const createTemporaryClient = (name) => {
  const normalizedName = String(name || '').trim().toUpperCase()
  if (!normalizedName) return null
  return {
    codigo: `TEMP-${normalizedName.replace(/\s+/g, '-').slice(0, 20)}`,
    nombre: normalizedName,
    n_comercial: normalizedName,
    cedula: '',
    rnc: '',
    telefono: '',
    whatsapp: '',
    email: '',
    direccion: '',
    precio_fijado: 'Normal',
    tipo_cliente: 'temporal',
    cliente_temporal: true
  }
}

export const mergeRecordsByCode = (current = [], incoming = []) => {
  const map = new Map(current.filter(Boolean).map((item) => [item.codigo, item]))
  incoming
    .filter((item) => item?.codigo)
    .forEach((item) => map.set(item.codigo, { ...(map.get(item.codigo) || {}), ...item }))
  return Array.from(map.values())
}

export const attachAvailableImeis = (products = [], imeis = []) => {
  const byProduct = new Map()
  imeis.forEach((item) => {
    const productId = String(item?.id_equi ?? '').trim()
    const imei = String(item?.imei ?? '').trim()
    if (!productId || !imei) return
    if (!byProduct.has(productId)) byProduct.set(productId, [])
    byProduct.get(productId).push(imei)
  })
  return products.map((product) => {
    const available = byProduct.get(String(product?.id ?? '').trim()) || []
    return { ...product, imeis_disponibles: available, imeis_disponibles_texto: available.join(',') }
  })
}

export const productHasImei = (product = {}, searchedImei = '') => {
  const target = String(searchedImei || '').trim()
  if (!target) return false
  const imeis = Array.isArray(product.imeis_disponibles)
    ? product.imeis_disponibles
    : String(product.imeis_disponibles_texto || '')
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean)
  return imeis.includes(target)
}

export const calculateCardSurcharge = (amount, percentage) => {
  const base = toFiniteNumber(amount, 0)
  const rate = toFiniteNumber(percentage, 0)
  return Number((base * (1 + Math.max(0, rate) / 100)).toFixed(2))
}

export const distributeSurcharge = (products = [], selectedIndexes = [], surcharge = 0) => {
  const result = products.map((product) => ({ ...product }))
  const indexes = [...new Set(selectedIndexes)].filter((index) => result[index])
  const amount = toFiniteNumber(surcharge, 0)
  if (!indexes.length || amount <= 0) return result

  const selectedTotal = indexes.reduce((sum, index) => {
    const product = result[index]
    return sum +
      (toFiniteNumber(product.precio_final, 0) || toFiniteNumber(product.precio_venta, 0)) *
        (toFiniteNumber(product.cantidad, 1) || 1)
  }, 0)
  if (selectedTotal <= 0) return result

  indexes.forEach((index) => {
    const product = result[index]
    const quantity = toFiniteNumber(product.cantidad, 1) || 1
    const price = toFiniteNumber(product.precio_final, 0) || toFiniteNumber(product.precio_venta, 0)
    const unitSurcharge = (amount * ((price * quantity) / selectedTotal)) / quantity
    const newPrice = Number((price + unitSurcharge).toFixed(2))
    product.precio_venta = newPrice
    product.precio_final = newPrice
    product.recargo_aplicado = unitSurcharge
  })
  return result
}
