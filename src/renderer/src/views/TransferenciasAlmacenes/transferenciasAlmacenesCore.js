export const ESTADOS_TRANSFERENCIA = Object.freeze({
  BORRADOR: 'BORRADOR',
  SOLICITADA: 'SOLICITADA',
  DESPACHADA: 'DESPACHADA',
  RECIBIDA: 'RECIBIDA',
  CANCELADA: 'CANCELADA'
})

export const TRANSICIONES_TRANSFERENCIA = Object.freeze({
  BORRADOR: ['SOLICITADA', 'CANCELADA'],
  SOLICITADA: ['DESPACHADA', 'CANCELADA'],
  DESPACHADA: ['RECIBIDA'],
  RECIBIDA: [],
  CANCELADA: []
})

export function normalizarTexto(valor) {
  return String(valor ?? '').trim().toUpperCase()
}

export function numero(valor) {
  const convertido = Number(valor)
  return Number.isFinite(convertido) ? convertido : 0
}

export function puedeTransicionar(estadoActual, estadoSiguiente) {
  return (TRANSICIONES_TRANSFERENCIA[normalizarTexto(estadoActual)] || []).includes(
    normalizarTexto(estadoSiguiente)
  )
}

export function validarTransferencia(transferencia, productosOrigen = []) {
  const errores = []
  const origen = normalizarTexto(transferencia?.almacen_origen)
  const destino = normalizarTexto(transferencia?.almacen_destino)
  const items = Array.isArray(transferencia?.items) ? transferencia.items : []

  if (!origen) errores.push('Debe seleccionar el almacén de origen.')
  if (!destino) errores.push('Debe seleccionar el almacén de destino.')
  if (origen && destino && origen === destino) errores.push('El almacén de destino debe ser diferente al de origen.')
  if (items.length === 0) errores.push('Debe agregar al menos un producto.')

  const idsVistos = new Set()
  for (const item of items) {
    const productoId = String(item.producto_id_origen ?? item.id ?? '')
    const cantidad = numero(item.cantidad)
    const producto = productosOrigen.find((p) => String(p.id) === productoId)
    if (!productoId || !producto) {
      errores.push(`El producto ${item.nombre || item.codigo || ''} ya no existe en el almacén origen.`)
      continue
    }
    if (idsVistos.has(productoId)) errores.push(`El producto ${producto.nombre || producto.codigo} está repetido.`)
    idsVistos.add(productoId)
    if (cantidad <= 0) errores.push(`La cantidad de ${producto.nombre || producto.codigo} debe ser mayor que cero.`)
    if (cantidad > numero(producto.stock)) {
      errores.push(`Stock insuficiente para ${producto.nombre || producto.codigo}: disponible ${numero(producto.stock)}.`)
    }
  }
  return { valido: errores.length === 0, errores }
}

export function crearNumeroTransferencia(fecha = new Date(), consecutivo = 1) {
  const valor = fecha instanceof Date ? fecha : new Date(fecha)
  return `TRA-${valor.getFullYear()}${String(valor.getMonth() + 1).padStart(2, '0')}${String(valor.getDate()).padStart(2, '0')}-${String(numero(consecutivo)).padStart(4, '0')}`
}

export function agregarEventoHistorial(historial, evento) {
  let eventos = []
  try {
    eventos = Array.isArray(historial) ? historial : JSON.parse(historial || '[]')
  } catch {
    eventos = []
  }
  return [...eventos, { ...evento }]
}

export function calcularResumen(transferencias = []) {
  return transferencias.reduce((resumen, transferencia) => {
    const estado = normalizarTexto(transferencia.estado)
    resumen.total += 1
    resumen.unidades += numero(transferencia.total_unidades)
    if (estado === ESTADOS_TRANSFERENCIA.SOLICITADA) resumen.pendientes += 1
    if (estado === ESTADOS_TRANSFERENCIA.DESPACHADA) resumen.enTransito += 1
    if (estado === ESTADOS_TRANSFERENCIA.RECIBIDA) resumen.recibidas += 1
    return resumen
  }, { total: 0, pendientes: 0, enTransito: 0, recibidas: 0, unidades: 0 })
}

export function encontrarProductoDestino(productos, productoOrigen, almacenDestino) {
  const candidatos = (productos || []).filter((p) => normalizarTexto(p.almacen) === normalizarTexto(almacenDestino))
  const codigo = normalizarTexto(productoOrigen.codigo)
  const codigoBarra = normalizarTexto(productoOrigen.codigo_barra)
  const porCodigo = candidatos.find((p) =>
    (codigo && normalizarTexto(p.codigo) === codigo) ||
    (codigoBarra && normalizarTexto(p.codigo_barra) === codigoBarra)
  )
  if (porCodigo) return porCodigo
  return candidatos.find((p) =>
    normalizarTexto(p.nombre) === normalizarTexto(productoOrigen.nombre) &&
    normalizarTexto(p.categoria) === normalizarTexto(productoOrigen.categoria)
  )
}

export function filtrarTransferencias(transferencias, filtros = {}) {
  const busqueda = normalizarTexto(filtros.busqueda)
  const estado = normalizarTexto(filtros.estado)
  return (transferencias || []).filter((transferencia) => {
    if (estado && normalizarTexto(transferencia.estado) !== estado) return false
    if (!busqueda) return true
    return [transferencia.numero, transferencia.almacen_origen, transferencia.almacen_destino,
      transferencia.observacion, transferencia.solicitado_por, transferencia.despachado_por,
      transferencia.recibido_por].some((valor) => normalizarTexto(valor).includes(busqueda))
  })
}
