export const ESTADOS_CONTEO = Object.freeze({
  BORRADOR: 'BORRADOR',
  EN_PROCESO: 'EN_PROCESO',
  FINALIZADO: 'FINALIZADO'
})

export const numeroSeguro = (valor, fallback = 0) => {
  if (valor === null || valor === undefined || valor === '') return fallback
  const numero = Number(String(valor).replace(',', '.'))
  return Number.isFinite(numero) ? numero : fallback
}

export const normalizarAlmacen = (valor) => String(valor || 'GENERAL').trim() || 'GENERAL'

export function crearLineasConteo(productos = [], almacen = '') {
  const almacenNormalizado = normalizarAlmacen(almacen)

  return (Array.isArray(productos) ? productos : [])
    .filter((producto) => normalizarAlmacen(producto?.almacen) === almacenNormalizado)
    .map((producto) => {
      const stockSistema = numeroSeguro(producto.stock)
      const costoUnitario = numeroSeguro(producto.precio_compra)
      return {
        producto_id: producto.id,
        codigo: producto.codigo || producto.codigo_barra || '',
        nombre: producto.nombre || producto.descripcion || 'Producto sin nombre',
        categoria: producto.categoria || '',
        ubicacion: producto.ubicacion || '',
        almacen: almacenNormalizado,
        stock_sistema: stockSistema,
        cantidad_contada: null,
        diferencia: 0,
        costo_unitario: costoUnitario,
        valor_ajuste: 0
      }
    })
    .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es', { sensitivity: 'base' }))
}

export function recalcularLinea(linea = {}, cantidadContada = linea.cantidad_contada) {
  const tieneConteo = cantidadContada !== null && cantidadContada !== undefined && cantidadContada !== ''
  const cantidad = tieneConteo ? Math.max(0, numeroSeguro(cantidadContada)) : null
  const stockSistema = numeroSeguro(linea.stock_sistema)
  const costoUnitario = numeroSeguro(linea.costo_unitario)
  const diferencia = cantidad === null ? 0 : cantidad - stockSistema

  return {
    ...linea,
    cantidad_contada: cantidad,
    diferencia,
    valor_ajuste: diferencia * costoUnitario
  }
}

export function recalcularLineas(lineas = []) {
  return (Array.isArray(lineas) ? lineas : []).map((linea) =>
    recalcularLinea(linea, linea.cantidad_contada)
  )
}

export function resumenConteo(lineas = []) {
  const normalizadas = recalcularLineas(lineas)
  return normalizadas.reduce(
    (resumen, linea) => {
      resumen.productos += 1
      if (linea.cantidad_contada !== null) resumen.contados += 1
      if (linea.diferencia !== 0) resumen.conDiferencia += 1
      resumen.unidadesSistema += linea.stock_sistema
      resumen.unidadesContadas += linea.cantidad_contada ?? 0
      resumen.diferenciaUnidades += linea.diferencia
      resumen.valorAjuste += linea.valor_ajuste
      return resumen
    },
    {
      productos: 0,
      contados: 0,
      conDiferencia: 0,
      unidadesSistema: 0,
      unidadesContadas: 0,
      diferenciaUnidades: 0,
      valorAjuste: 0
    }
  )
}

export function validarConteoParaFinalizar(sesion = {}) {
  const errores = []
  const lineas = Array.isArray(sesion.lineas) ? sesion.lineas : []

  if (sesion.estado === ESTADOS_CONTEO.FINALIZADO) errores.push('El conteo ya fue finalizado.')
  if (!sesion.almacen) errores.push('Debe seleccionar un almacén.')
  if (!lineas.length) errores.push('El conteo no contiene productos.')

  const sinContar = lineas.filter(
    (linea) =>
      linea.cantidad_contada === null ||
      linea.cantidad_contada === undefined ||
      linea.cantidad_contada === ''
  )
  if (sinContar.length) errores.push(`Faltan ${sinContar.length} producto(s) por contar.`)

  if (lineas.some((linea) => numeroSeguro(linea.cantidad_contada, -1) < 0)) {
    errores.push('Las cantidades contadas no pueden ser negativas.')
  }

  return { valido: errores.length === 0, errores }
}

export function detectarCambiosConcurrentes(lineas = [], productosActuales = []) {
  const actualesPorId = new Map(
    (Array.isArray(productosActuales) ? productosActuales : []).map((producto) => [
      String(producto.id),
      producto
    ])
  )

  return (Array.isArray(lineas) ? lineas : []).flatMap((linea) => {
    const actual = actualesPorId.get(String(linea.producto_id))
    if (!actual) return [{ ...linea, motivo: 'PRODUCTO_NO_ENCONTRADO' }]
    const stockActual = numeroSeguro(actual.stock)
    if (stockActual !== numeroSeguro(linea.stock_sistema)) {
      return [{ ...linea, stock_actual: stockActual, motivo: 'STOCK_MODIFICADO' }]
    }
    return []
  })
}

export function crearAjustes(lineas = [], metadatos = {}) {
  return recalcularLineas(lineas)
    .filter((linea) => linea.diferencia !== 0)
    .map((linea) => ({
      conteo_id: metadatos.conteo_id || '',
      conteo_codigo: metadatos.conteo_codigo || '',
      producto_id: linea.producto_id,
      codigo_producto: linea.codigo,
      producto: linea.nombre,
      almacen: linea.almacen,
      stock_anterior: linea.stock_sistema,
      cantidad_contada: linea.cantidad_contada,
      diferencia: linea.diferencia,
      costo_unitario: linea.costo_unitario,
      valor_ajuste: linea.valor_ajuste,
      motivo: metadatos.motivo || 'Ajuste por conteo físico',
      estado: metadatos.estado || 'APLICADO',
      usuario: metadatos.usuario || 'Sistema',
      fecha: metadatos.fecha || '',
      hora: metadatos.hora || ''
    }))
}

export function siguienteEstado(estado, accion) {
  if (accion === 'guardar' && (!estado || estado === ESTADOS_CONTEO.BORRADOR)) {
    return ESTADOS_CONTEO.BORRADOR
  }
  if (accion === 'procesar' && estado === ESTADOS_CONTEO.BORRADOR) {
    return ESTADOS_CONTEO.EN_PROCESO
  }
  if (accion === 'finalizar' && estado === ESTADOS_CONTEO.EN_PROCESO) {
    return ESTADOS_CONTEO.FINALIZADO
  }
  if (accion === 'revertir' && estado === ESTADOS_CONTEO.EN_PROCESO) {
    return ESTADOS_CONTEO.BORRADOR
  }
  return estado
}
