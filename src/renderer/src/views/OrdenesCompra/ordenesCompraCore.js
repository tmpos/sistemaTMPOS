export const numero = (value) => {
  const parsed = Number.parseFloat(String(value ?? 0).replace(/,/g, ''))
  return Number.isFinite(parsed) ? parsed : 0
}

export function normalizarItem(item = {}) {
  const cantidad = Math.max(0, numero(item.cantidad))
  const costo = Math.max(0, numero(item.costo ?? item.precio_compra))
  const impuestoPorcentaje = Math.max(0, numero(item.impuestoPorcentaje ?? item.impuestos))
  const recibida = Math.min(cantidad, Math.max(0, numero(item.cantidadRecibida)))
  const subtotal = cantidad * costo
  const impuesto = subtotal * (impuestoPorcentaje / 100)
  return {
    productoId: item.productoId ?? item.id ?? '',
    codigo: item.codigo || item.codigo_barra || '',
    nombre: item.nombre || item.descripcion || 'Producto sin nombre',
    cantidad,
    cantidadRecibida: recibida,
    costo,
    impuestoPorcentaje,
    subtotal,
    impuesto,
    total: subtotal + impuesto
  }
}

export function calcularTotales(items = []) {
  return items.map(normalizarItem).reduce((totales, item) => {
    totales.subtotal += item.subtotal
    totales.impuesto += item.impuesto
    totales.total += item.total
    totales.unidades += item.cantidad
    totales.recibidas += item.cantidadRecibida
    return totales
  }, { subtotal: 0, impuesto: 0, total: 0, unidades: 0, recibidas: 0 })
}

export function generarNumeroOrden(ordenes = [], now = new Date()) {
  const prefijo = `OC-${now.getFullYear()}-`
  const ultimo = ordenes.reduce((max, order) => {
    const value = String(order.numero || '')
    if (!value.startsWith(prefijo)) return max
    return Math.max(max, Number.parseInt(value.slice(prefijo.length), 10) || 0)
  }, 0)
  return `${prefijo}${String(ultimo + 1).padStart(6, '0')}`
}

export function validarOrden(order = {}) {
  const errors = []
  if (!String(order.proveedor || '').trim()) errors.push('Selecciona un proveedor.')
  if (!String(order.almacen || '').trim()) errors.push('Selecciona un almacén de recepción.')
  const items = Array.isArray(order.items) ? order.items.map(normalizarItem) : []
  if (!items.length) errors.push('Agrega al menos un producto.')
  if (items.some((item) => item.cantidad <= 0)) errors.push('Todas las cantidades deben ser mayores que cero.')
  return errors
}

export function aplicarRecepcion(items = [], cantidades = {}) {
  const actualizados = items.map(normalizarItem).map((item) => {
    const pendiente = Math.max(0, item.cantidad - item.cantidadRecibida)
    const solicitada = Math.max(0, numero(cantidades[item.productoId]))
    const recibidaAhora = Math.min(pendiente, solicitada)
    return {
      ...item,
      recibidaAhora,
      cantidadRecibida: item.cantidadRecibida + recibidaAhora
    }
  })
  const recibidasAhora = actualizados.reduce((sum, item) => sum + item.recibidaAhora, 0)
  const completa = actualizados.length > 0 && actualizados.every((item) => item.cantidadRecibida >= item.cantidad)
  return { items: actualizados, recibidasAhora, estado: completa ? 'RECIBIDA' : 'PARCIAL' }
}

export function parseItems(value) {
  if (Array.isArray(value)) return value.map(normalizarItem)
  try {
    const parsed = JSON.parse(value || '[]')
    return Array.isArray(parsed) ? parsed.map(normalizarItem) : []
  } catch {
    return []
  }
}
