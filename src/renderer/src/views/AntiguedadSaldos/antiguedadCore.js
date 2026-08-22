const pad = (value) => String(value).padStart(2, '0')

export function normalizarFecha(value) {
  if (!value) return ''
  const raw = String(value).trim().split(/[T ]/)[0]
  let match = raw.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/)
  if (match) return `${match[1]}-${pad(match[2])}-${pad(match[3])}`
  match = raw.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/)
  if (match) return `${match[3]}-${pad(match[2])}-${pad(match[1])}`
  return ''
}

const toDate = (value) => {
  const iso = normalizarFecha(value)
  if (!iso) return null
  const [year, month, day] = iso.split('-').map(Number)
  return new Date(year, month - 1, day)
}

const amount = (value) => {
  const parsed = Number.parseFloat(String(value ?? 0).replace(/,/g, ''))
  return Number.isFinite(parsed) ? parsed : 0
}

export function calcularDiasVencidos(fechaVencimiento, fechaCorte = new Date()) {
  const due = toDate(fechaVencimiento)
  const cut = toDate(fechaCorte instanceof Date
    ? `${fechaCorte.getFullYear()}-${pad(fechaCorte.getMonth() + 1)}-${pad(fechaCorte.getDate())}`
    : fechaCorte)
  if (!due || !cut) return null
  return Math.floor((cut.getTime() - due.getTime()) / 86400000)
}

export function obtenerTramo(dias) {
  if (dias === null) return 'SIN_FECHA'
  if (dias <= 0) return 'VIGENTE'
  if (dias <= 30) return '1_30'
  if (dias <= 60) return '31_60'
  if (dias <= 90) return '61_90'
  return 'MAS_90'
}

export const etiquetasTramo = {
  VIGENTE: 'Vigente',
  '1_30': '1–30 días',
  '31_60': '31–60 días',
  '61_90': '61–90 días',
  MAS_90: 'Más de 90 días',
  SIN_FECHA: 'Sin vencimiento'
}

export function mapearCuentasCobrar(rows = [], fechaCorte = new Date()) {
  return rows.flatMap((row, index) => {
    const saldo = amount(row.saldo)
    if (saldo <= 0) return []
    const diasVencidos = calcularDiasVencidos(row.fecha_vencimiento, fechaCorte)
    return [{
      id: `cxc-${row.id ?? index}`,
      tipo: 'COBRAR',
      tercero: row.nombre_cliente || row.cliente || 'Cliente no especificado',
      identificacion: row.rnc_cliente || row.cedula_cliente || '',
      documento: row.no_factura || row.no_emision || '',
      fechaEmision: normalizarFecha(row.fecha_emision || row.created_at),
      fechaVencimiento: normalizarFecha(row.fecha_vencimiento),
      diasVencidos,
      tramo: obtenerTramo(diasVencidos),
      saldo,
      montoOriginal: amount(row.monto_credito),
      abonado: amount(row.abonado),
      almacen: row.almacen || '',
      telefono: row.telefono_cliente || row.whatsapp_cliente || '',
      estado: row.estatus || '',
      original: row
    }]
  })
}

export function mapearCuentasPagar(rows = [], fechaCorte = new Date()) {
  return rows.flatMap((row, index) => {
    const saldo = amount(row.saldo)
    if (saldo <= 0) return []
    const diasVencidos = calcularDiasVencidos(row.fecha_vencimiento, fechaCorte)
    return [{
      id: `cxp-${row.id ?? index}`,
      tipo: 'PAGAR',
      tercero: row.proveedor || 'Proveedor no especificado',
      identificacion: row.rnc_proveedor || row.rnc || '',
      documento: row.no_factura || row.ncf_proveedor || '',
      fechaEmision: normalizarFecha(row.fecha_compra || row.fecha || row.created_at),
      fechaVencimiento: normalizarFecha(row.fecha_vencimiento),
      diasVencidos,
      tramo: obtenerTramo(diasVencidos),
      saldo,
      montoOriginal: amount(row.total),
      abonado: amount(row.abono),
      almacen: row.almacen || '',
      telefono: '',
      estado: row.estado || '',
      original: row
    }]
  })
}

export function resumirTramos(rows = []) {
  const result = Object.fromEntries(Object.keys(etiquetasTramo).map((key) => [key, { cantidad: 0, saldo: 0 }]))
  rows.forEach((row) => {
    const bucket = result[row.tramo] || result.SIN_FECHA
    bucket.cantidad += 1
    bucket.saldo += amount(row.saldo)
  })
  return result
}
