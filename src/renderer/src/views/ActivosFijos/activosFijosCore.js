export const ESTADOS_ACTIVO = Object.freeze({
  ACTIVO: 'ACTIVO',
  BAJA: 'BAJA',
  VENDIDO: 'VENDIDO'
})

export const METODO_LINEA_RECTA = 'LINEA_RECTA'

export const numero = (valor, fallback = 0) => {
  if (valor === null || valor === undefined || valor === '') return fallback
  const resultado = Number(String(valor).replace(',', '.'))
  return Number.isFinite(resultado) ? resultado : fallback
}

export const redondearMoneda = (valor) => Math.round((numero(valor) + Number.EPSILON) * 100) / 100

export function fechaIso(valor) {
  if (!valor) return ''
  if (valor instanceof Date && !Number.isNaN(valor.getTime())) {
    const year = valor.getFullYear()
    const month = String(valor.getMonth() + 1).padStart(2, '0')
    const day = String(valor.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }
  const texto = String(valor).trim()
  if (/^\d{4}-\d{2}-\d{2}$/.test(texto)) return texto
  const match = texto.match(/^(\d{2})[-/](\d{2})[-/](\d{4})$/)
  return match ? `${match[3]}-${match[2]}-${match[1]}` : ''
}

export function ultimoDiaMes(year, monthIndex) {
  const fecha = new Date(year, monthIndex + 1, 0)
  return fechaIso(fecha)
}

export function validarActivo(activo = {}) {
  const errores = []
  const costo = numero(activo.costo_adquisicion, -1)
  const residual = numero(activo.valor_residual, -1)
  const meses = Math.trunc(numero(activo.vida_util_meses, 0))

  if (!String(activo.codigo || '').trim()) errores.push('El código es requerido.')
  if (!String(activo.nombre || activo.descripcion || '').trim()) errores.push('El nombre es requerido.')
  if (!String(activo.categoria || '').trim()) errores.push('La categoría es requerida.')
  if (!fechaIso(activo.fecha_adquisicion)) errores.push('La fecha de adquisición no es válida.')
  if (costo <= 0) errores.push('El costo de adquisición debe ser mayor que cero.')
  if (residual < 0) errores.push('El valor residual no puede ser negativo.')
  if (residual >= costo && costo > 0) errores.push('El valor residual debe ser menor que el costo.')
  if (meses <= 0) errores.push('La vida útil debe ser mayor que cero meses.')
  if ((activo.metodo || METODO_LINEA_RECTA) !== METODO_LINEA_RECTA) {
    errores.push('El método de depreciación no está soportado.')
  }
  return { valido: errores.length === 0, errores }
}

export function crearCalendarioDepreciacion(activo = {}, depreciaciones = []) {
  const validacion = validarActivo(activo)
  if (!validacion.valido) return []

  const costo = redondearMoneda(activo.costo_adquisicion)
  const residual = redondearMoneda(activo.valor_residual)
  const base = redondearMoneda(costo - residual)
  const meses = Math.trunc(numero(activo.vida_util_meses))
  const cuotaBase = redondearMoneda(base / meses)
  const adquisicion = new Date(`${fechaIso(activo.fecha_adquisicion)}T12:00:00`)
  const aplicadas = new Map(
    (Array.isArray(depreciaciones) ? depreciaciones : [])
      .filter((item) => String(item.activo_id) === String(activo.id))
      .map((item) => [String(item.periodo), item])
  )

  let acumuladaProgramada = 0
  return Array.from({ length: meses }, (_, indice) => {
    const fechaPeriodo = new Date(adquisicion.getFullYear(), adquisicion.getMonth() + indice, 1)
    const periodo = `${fechaPeriodo.getFullYear()}-${String(fechaPeriodo.getMonth() + 1).padStart(2, '0')}`
    const monto = indice === meses - 1
      ? redondearMoneda(base - acumuladaProgramada)
      : cuotaBase
    acumuladaProgramada = redondearMoneda(acumuladaProgramada + monto)
    const aplicada = aplicadas.get(periodo)
    return {
      numero: indice + 1,
      periodo,
      fecha_aplicacion: ultimoDiaMes(fechaPeriodo.getFullYear(), fechaPeriodo.getMonth()),
      monto,
      depreciacion_acumulada: acumuladaProgramada,
      valor_en_libros: redondearMoneda(costo - acumuladaProgramada),
      estado: aplicada ? 'REGISTRADA' : 'PENDIENTE',
      registro_id: aplicada?.id || null,
      asiento_numero: aplicada?.asiento_numero || ''
    }
  })
}

export function resumenActivo(activo = {}, depreciaciones = []) {
  const costo = redondearMoneda(activo.costo_adquisicion ?? activo.valor_original ?? activo.valor)
  const residual = redondearMoneda(activo.valor_residual)
  const aplicadas = (Array.isArray(depreciaciones) ? depreciaciones : []).filter(
    (item) => String(item.activo_id) === String(activo.id) && item.estado !== 'ANULADA'
  )
  const depreciacionAcumulada = redondearMoneda(
    aplicadas.reduce((total, item) => total + numero(item.monto), 0)
  )
  const maximo = Math.max(0, costo - residual)
  const acumuladaLimitada = Math.min(maximo, depreciacionAcumulada)
  return {
    costo,
    valorResidual: residual,
    depreciacionAcumulada: acumuladaLimitada,
    valorEnLibros: redondearMoneda(costo - acumuladaLimitada),
    periodosRegistrados: aplicadas.length,
    totalmenteDepreciado: acumuladaLimitada >= maximo
  }
}

export function puedeRegistrarPeriodo(periodo = {}, calendario = [], fechaCorte = new Date()) {
  if (!periodo || periodo.estado === 'REGISTRADA') {
    return { permitido: false, motivo: 'El período ya fue registrado.' }
  }
  const anteriorPendiente = calendario.find(
    (item) => item.numero < periodo.numero && item.estado !== 'REGISTRADA'
  )
  if (anteriorPendiente) {
    return { permitido: false, motivo: `Primero debe registrar el período ${anteriorPendiente.periodo}.` }
  }
  const fecha = new Date(`${periodo.fecha_aplicacion}T23:59:59`)
  const corte = fechaCorte instanceof Date ? fechaCorte : new Date(fechaCorte)
  corte.setHours(23, 59, 59, 999)
  if (fecha > corte) return { permitido: false, motivo: 'El período todavía no ha vencido.' }
  return { permitido: true, motivo: '' }
}

export function prepararAsientoDepreciacion(activo = {}, periodo = {}) {
  const monto = redondearMoneda(periodo.monto)
  return {
    referencia: `DEP-${activo.codigo}-${periodo.periodo}`,
    descripcion: `Depreciación ${periodo.periodo} - ${activo.nombre || activo.descripcion}`,
    origen: 'ACTIVOS_FIJOS',
    origen_id: activo.id || '',
    periodo: periodo.periodo,
    movimientos: [
      {
        debito: activo.cuenta_gasto_depreciacion || 'GASTO DE DEPRECIACIÓN',
        cantidadDebito: monto,
        credito: activo.cuenta_depreciacion_acumulada || 'DEPRECIACIÓN ACUMULADA',
        cantidadCredito: monto
      }
    ],
    total_debito: monto,
    total_credito: monto
  }
}

export function prepararBaja(activo = {}, resumen = {}, datos = {}) {
  const tipo = datos.tipo === ESTADOS_ACTIVO.VENDIDO ? ESTADOS_ACTIVO.VENDIDO : ESTADOS_ACTIVO.BAJA
  const valorVenta = tipo === ESTADOS_ACTIVO.VENDIDO ? redondearMoneda(datos.valor_venta) : 0
  const valorLibros = redondearMoneda(resumen.valorEnLibros)
  const resultado = redondearMoneda(valorVenta - valorLibros)
  const acumulada = redondearMoneda(resumen.depreciacionAcumulada)
  const costo = redondearMoneda(resumen.costo)
  const movimientos = []

  if (valorVenta > 0) movimientos.push({ cuenta: datos.cuenta_cobro || 'CAJA/BANCO', tipo: 'DEBITO', monto: valorVenta })
  if (acumulada > 0) movimientos.push({ cuenta: activo.cuenta_depreciacion_acumulada || 'DEPRECIACIÓN ACUMULADA', tipo: 'DEBITO', monto: acumulada })
  if (resultado < 0) movimientos.push({ cuenta: datos.cuenta_perdida || 'PÉRDIDA EN BAJA DE ACTIVOS', tipo: 'DEBITO', monto: Math.abs(resultado) })
  movimientos.push({ cuenta: activo.cuenta_contable || 'ACTIVOS FIJOS', tipo: 'CREDITO', monto: costo })
  if (resultado > 0) movimientos.push({ cuenta: datos.cuenta_ganancia || 'GANANCIA EN VENTA DE ACTIVOS', tipo: 'CREDITO', monto: resultado })

  return {
    tipo,
    fecha: fechaIso(datos.fecha),
    motivo: String(datos.motivo || '').trim(),
    valor_venta: valorVenta,
    valor_en_libros: valorLibros,
    resultado,
    asiento: {
      referencia: `${tipo}-${activo.codigo}`,
      descripcion: `${tipo === ESTADOS_ACTIVO.VENDIDO ? 'Venta' : 'Baja'} de ${activo.nombre || activo.descripcion}`,
      origen: 'ACTIVOS_FIJOS',
      origen_id: activo.id || '',
      movimientos
    }
  }
}

export function validarBaja(activo = {}, datos = {}) {
  const errores = []
  if (activo.estado && activo.estado !== ESTADOS_ACTIVO.ACTIVO) errores.push('El activo ya no está activo.')
  if (!fechaIso(datos.fecha)) errores.push('La fecha de baja o venta no es válida.')
  if (!String(datos.motivo || '').trim()) errores.push('El motivo es requerido.')
  if (datos.tipo === ESTADOS_ACTIVO.VENDIDO && numero(datos.valor_venta, -1) < 0) {
    errores.push('El valor de venta no puede ser negativo.')
  }
  return { valido: errores.length === 0, errores }
}
