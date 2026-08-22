const amount = (value) => {
  const parsed = Number.parseFloat(String(value ?? 0).replace(/,/g, ''))
  return Number.isFinite(parsed) ? parsed : 0
}
const issue = (codigo, severidad, modulo, titulo, detalle, referencia = '', ruta = '') => ({ codigo, severidad, modulo, titulo, detalle, referencia, ruta })
const parseArray = (value) => {
  if (Array.isArray(value)) return value
  try { const parsed = JSON.parse(value || '[]'); return Array.isArray(parsed) ? parsed : [] } catch { return null }
}

export function revisarInventario(productos = []) {
  return productos.flatMap((row) => amount(row.stock) < 0 ? [issue('STOCK_NEGATIVO', 'CRITICA', 'Inventario', 'Producto con existencia negativa', `${row.nombre || row.descripcion || 'Producto'} tiene ${row.stock} unidades.`, row.codigo || row.id, '/productos')] : [])
}

export function revisarBancos(bancos = []) {
  return bancos.flatMap((row) => amount(row.saldo ?? row.balance) < 0 ? [issue('BANCO_NEGATIVO', 'ALTA', 'Bancos', 'Cuenta bancaria con saldo negativo', `${row.nombre || row.cuenta || 'Cuenta'} tiene un saldo de ${amount(row.saldo ?? row.balance).toFixed(2)}.`, row.cuenta || row.id, '/banco')] : [])
}

export function revisarAsientos(asientos = []) {
  return asientos.flatMap((row) => {
    const items = parseArray(row.asiento)
    if (items === null) return [issue('ASIENTO_JSON', 'CRITICA', 'Contabilidad', 'Asiento con estructura inválida', 'No se puede interpretar el detalle JSON del asiento.', row.numero || row.id, '/asientodiario')]
    const debitos = items.reduce((sum, item) => sum + amount(item.cantidadDebito), 0)
    const creditos = items.reduce((sum, item) => sum + amount(item.cantidadCredito), 0)
    return Math.abs(debitos - creditos) > 0.009
      ? [issue('ASIENTO_DESCUADRADO', 'CRITICA', 'Contabilidad', 'Asiento contable descuadrado', `Débitos ${debitos.toFixed(2)} y créditos ${creditos.toFixed(2)}.`, row.numero || row.id, '/asientodiario')]
      : []
  })
}

export function revisarCartera(cxc = [], cxp = []) {
  const cobrar = cxc.flatMap((row) => {
    const saldo = amount(row.saldo)
    const original = amount(row.monto_credito) + amount(row.interes)
    if (saldo < -0.009 || (original > 0 && saldo - original > 0.009)) return [issue('CXC_SALDO_INVALIDO', 'ALTA', 'Cuentas por cobrar', 'Saldo de cliente inconsistente', `Saldo ${saldo.toFixed(2)} para un crédito de ${original.toFixed(2)}.`, row.no_factura || row.id, '/cuentas_cobrar')]
    return []
  })
  const pagar = cxp.flatMap((row) => {
    const saldo = amount(row.saldo); const total = amount(row.total)
    return saldo < -0.009 || (total > 0 && saldo - total > 0.009)
      ? [issue('CXP_SALDO_INVALIDO', 'ALTA', 'Cuentas por pagar', 'Saldo de proveedor inconsistente', `Saldo ${saldo.toFixed(2)} para una deuda de ${total.toFixed(2)}.`, row.no_factura || row.id, '/cuentasxpagar')]
      : []
  })
  return [...cobrar, ...pagar]
}

export function revisarDocumentosCredito(facturas = [], compras = [], cxc = [], cxp = []) {
  const cxcDocs = new Set(cxc.map((row) => String(row.no_factura || '').trim()).filter(Boolean))
  const cxpDocs = new Set(cxp.map((row) => String(row.no_factura || '').trim()).filter(Boolean))
  const ventas = facturas.flatMap((row) => {
    const esCredito = /credito|cr[eé]dito/i.test(`${row.tipo_factura || ''} ${row.metodo_pago || ''}`)
    const doc = String(row.no_factura || '').trim()
    return esCredito && doc && !/anulad/i.test(row.estado_factura || '') && !cxcDocs.has(doc)
      ? [issue('FACTURA_SIN_CXC', 'ALTA', 'Ventas', 'Factura a crédito sin cuenta por cobrar', 'La factura no tiene una cuenta por cobrar asociada.', doc, '/facturas')]
      : []
  })
  const purchases = compras.flatMap((row) => {
    const doc = String(row.no_factura || '').trim()
    const esCredito = amount(row.saldo) > 0 || /credito|pendiente|parcial/i.test(row.estado || '')
    return esCredito && doc && !cxpDocs.has(doc)
      ? [issue('COMPRA_SIN_CXP', 'ALTA', 'Compras', 'Compra a crédito sin cuenta por pagar', 'La compra no tiene una cuenta por pagar asociada.', doc, '/compras')]
      : []
  })
  return [...ventas, ...purchases]
}

export function revisarFacturacionElectronica(logs = []) {
  const seen = new Set()
  return logs.flatMap((row) => {
    const result = []
    const document = String(row.document_number || row.encf || '').trim()
    if (document && seen.has(document)) result.push(issue('ENCF_DUPLICADO', 'CRITICA', 'Facturación electrónica', 'e-NCF duplicado en el log', 'El mismo número electrónico aparece más de una vez.', document, '/facturacion-electronica-log'))
    if (document) seen.add(document)
    if (/reject|rechaz/i.test(`${row.status || ''} ${row.legal_status || ''}`)) result.push(issue('ECF_RECHAZADO', 'CRITICA', 'Facturación electrónica', 'Comprobante electrónico rechazado', `Estado: ${row.legal_status || row.status}.`, document || row.no_factura, '/facturacion-electronica-log'))
    const aceptado = /register|accept|acept/i.test(`${row.status || ''} ${row.legal_status || ''}`)
    if (aceptado && (!row.security_code || !row.document_stamp_url)) result.push(issue('ECF_INCOMPLETO', 'ALTA', 'Facturación electrónica', 'Respuesta electrónica incompleta', 'Falta el código de seguridad o la URL del sello DGII.', document || row.no_factura, '/facturacion-electronica-log'))
    return result
  })
}

export function ejecutarDiagnostico(data = {}) {
  return [
    ...revisarInventario(data.productos),
    ...revisarBancos(data.bancos),
    ...revisarAsientos(data.asientos),
    ...revisarCartera(data.cxc, data.cxp),
    ...revisarDocumentosCredito(data.facturas, data.compras, data.cxc, data.cxp),
    ...revisarFacturacionElectronica(data.logsElectronicos)
  ].map((row, index) => ({ id: `${row.codigo}-${index}`, ...row }))
}
