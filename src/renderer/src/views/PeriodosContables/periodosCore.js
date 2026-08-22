const texto = (valor) => String(valor ?? '').trim()

export const aNumero = (valor) => {
  if (typeof valor === 'number') return Number.isFinite(valor) ? valor : 0
  const limpio = texto(valor).replace(/[^0-9,.-]/g, '')
  if (!limpio) return 0
  const normalizado = limpio.includes(',') && limpio.includes('.')
    ? limpio.replace(/,/g, '')
    : limpio.replace(',', '.')
  const resultado = Number(normalizado)
  return Number.isFinite(resultado) ? resultado : 0
}

export const parsearFechaContable = (valor) => {
  if (valor instanceof Date && !Number.isNaN(valor.getTime())) return new Date(valor)
  const dato = texto(valor)
  if (!dato) return null
  const fecha = dato.split(/[T\s]/)[0]
  let match = fecha.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/)
  let year; let month; let day
  if (match) [, year, month, day] = match
  else {
    match = fecha.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/)
    if (!match) return null
    ;[, day, month, year] = match
  }
  const resultado = new Date(Number(year), Number(month) - 1, Number(day))
  if (resultado.getFullYear() !== Number(year) || resultado.getMonth() !== Number(month) - 1 || resultado.getDate() !== Number(day)) return null
  return resultado
}

export const periodoDeFecha = (fecha) => {
  if (/^\d{4}-(0[1-9]|1[0-2])$/.test(texto(fecha))) return texto(fecha)
  const valor = parsearFechaContable(fecha)
  if (!valor) return ''
  return `${valor.getFullYear()}-${String(valor.getMonth() + 1).padStart(2, '0')}`
}

export const etiquetaPeriodo = (periodo) => {
  const match = texto(periodo).match(/^(\d{4})-(\d{2})$/)
  if (!match) return texto(periodo) || 'Período inválido'
  const fecha = new Date(Number(match[1]), Number(match[2]) - 1, 1)
  const nombre = new Intl.DateTimeFormat('es-DO', { month: 'long', year: 'numeric' }).format(fecha)
  return nombre.charAt(0).toUpperCase() + nombre.slice(1)
}

export const parsearAsiento = (valor) => {
  if (Array.isArray(valor)) return valor
  if (valor && typeof valor === 'object') {
    if (Array.isArray(valor.asientos)) return valor.asientos
    if (Array.isArray(valor.detalle)) return valor.detalle
    return [valor]
  }
  if (!texto(valor)) return []
  try {
    const parsed = JSON.parse(valor)
    return parsearAsiento(parsed)
  } catch {
    return []
  }
}

const importeDebito = (linea) => aNumero(linea?.cantidadDebito ?? linea?.debitoMonto ?? linea?.montoDebito ?? (linea?.tipo === 'DEBITO' ? linea?.monto : 0))
const importeCredito = (linea) => aNumero(linea?.cantidadCredito ?? linea?.creditoMonto ?? linea?.montoCredito ?? (linea?.tipo === 'CREDITO' ? linea?.monto : 0))

export const calcularBalancePeriodo = (asientos = [], periodo) => {
  const clave = periodoDeFecha(periodo)
  const incluidos = asientos.filter((asiento) => periodoDeFecha(asiento?.fecha || asiento?.created_at) === clave)
  let totalDebito = 0
  let totalCredito = 0
  let lineas = 0
  let asientosInvalidos = 0
  for (const asiento of incluidos) {
    const detalle = parsearAsiento(asiento?.asiento ?? asiento?.detalle)
    if (!detalle.length) asientosInvalidos += 1
    lineas += detalle.length
    for (const linea of detalle) {
      totalDebito += importeDebito(linea)
      totalCredito += importeCredito(linea)
    }
  }
  totalDebito = Math.round(totalDebito * 100) / 100
  totalCredito = Math.round(totalCredito * 100) / 100
  const diferencia = Math.round((totalDebito - totalCredito) * 100) / 100
  return { periodo: clave, asientos: incluidos.length, lineas, asientosInvalidos, totalDebito, totalCredito, diferencia }
}

export const validarCierrePeriodo = (asientos = [], periodo, tolerancia = 0.01) => {
  const balance = calcularBalancePeriodo(asientos, periodo)
  const motivos = []
  if (!balance.periodo) motivos.push('El período seleccionado no es válido.')
  if (!balance.asientos) motivos.push('El período no contiene asientos contables.')
  if (balance.asientosInvalidos) motivos.push(`${balance.asientosInvalidos} asiento(s) no tienen un detalle válido.`)
  if (Math.abs(balance.diferencia) >= Math.abs(aNumero(tolerancia))) motivos.push(`Los débitos y créditos tienen una diferencia de ${balance.diferencia.toFixed(2)}.`)
  return { ...balance, balanceado: Math.abs(balance.diferencia) < Math.abs(aNumero(tolerancia)), valido: motivos.length === 0, motivos }
}

const marcaTiempo = (registro) => {
  const actualizacion = new Date(registro?.updated_at || registro?.fecha_reapertura || registro?.fecha_cierre || 0).getTime()
  return Number.isFinite(actualizacion) ? actualizacion : aNumero(registro?.id)
}

export const periodosVigentes = (registros = []) => {
  const mapa = new Map()
  for (const registro of registros) {
    const periodo = periodoDeFecha(registro?.periodo)
    if (!periodo) continue
    const anterior = mapa.get(periodo)
    if (!anterior || marcaTiempo(registro) >= marcaTiempo(anterior)) mapa.set(periodo, { ...registro, periodo, estado: texto(registro.estado).toUpperCase() === 'CERRADO' ? 'CERRADO' : 'ABIERTO' })
  }
  return [...mapa.values()].sort((a, b) => b.periodo.localeCompare(a.periodo))
}

export const obtenerPeriodo = (periodos = [], fecha) => {
  const clave = periodoDeFecha(fecha)
  return periodosVigentes(periodos).find((periodo) => periodo.periodo === clave) || { periodo: clave, estado: 'ABIERTO' }
}

export const comprobarFechaContable = (fecha, periodos = []) => {
  const clave = periodoDeFecha(fecha)
  if (!clave) return { valida: false, bloqueada: false, periodo: '', estado: 'INVALIDO', mensaje: 'La fecha contable no es válida.' }
  const registro = obtenerPeriodo(periodos, fecha)
  const bloqueada = registro.estado === 'CERRADO'
  return {
    valida: true, bloqueada, periodo: clave, estado: registro.estado, registro,
    mensaje: bloqueada ? `El período ${etiquetaPeriodo(clave)} está cerrado y no admite movimientos.` : ''
  }
}

export const estaFechaBloqueada = (fecha, periodos = []) => comprobarFechaContable(fecha, periodos).bloqueada

export const asegurarPeriodoAbierto = (fecha, periodos = []) => {
  const resultado = comprobarFechaContable(fecha, periodos)
  if (!resultado.valida || resultado.bloqueada) {
    const error = new Error(resultado.mensaje)
    error.code = resultado.bloqueada ? 'PERIODO_CONTABLE_CERRADO' : 'FECHA_CONTABLE_INVALIDA'
    error.periodo = resultado.periodo
    throw error
  }
  return resultado
}

export const crearRegistroCierre = ({ periodo, balance, usuario, autorizador, ahora = new Date(), registroAnterior = {} }) => ({
  ...registroAnterior,
  periodo: periodoDeFecha(periodo), estado: 'CERRADO',
  fecha_cierre: ahora instanceof Date ? ahora.toISOString() : texto(ahora),
  usuario_cierre: texto(usuario) || 'Sistema', autorizador: texto(autorizador) || texto(usuario) || 'Sistema',
  total_debito: aNumero(balance?.totalDebito).toFixed(2), total_credito: aNumero(balance?.totalCredito).toFixed(2),
  diferencia: aNumero(balance?.diferencia).toFixed(2), cantidad_asientos: aNumero(balance?.asientos),
  motivo_reapertura: '', fecha_reapertura: '', usuario_reapertura: '',
  updated_at: ahora instanceof Date ? ahora.toISOString() : texto(ahora),
  created_at: registroAnterior?.created_at || (ahora instanceof Date ? ahora.toISOString() : texto(ahora))
})

export const crearRegistroReapertura = ({ registro, motivo, usuario, ahora = new Date() }) => {
  if (texto(motivo).length < 10) throw new Error('El motivo de reapertura debe tener al menos 10 caracteres.')
  return {
    ...registro, estado: 'ABIERTO', motivo_reapertura: texto(motivo), usuario_reapertura: texto(usuario) || 'Sistema',
    fecha_reapertura: ahora instanceof Date ? ahora.toISOString() : texto(ahora),
    updated_at: ahora instanceof Date ? ahora.toISOString() : texto(ahora)
  }
}

export const generarPeriodos = (asientos = [], registros = [], ahora = new Date(), cantidad = 12) => {
  const claves = new Set(periodosVigentes(registros).map((item) => item.periodo))
  asientos.forEach((asiento) => { const clave = periodoDeFecha(asiento?.fecha || asiento?.created_at); if (clave) claves.add(clave) })
  const base = parsearFechaContable(ahora) || new Date()
  for (let i = 0; i < cantidad; i += 1) claves.add(periodoDeFecha(new Date(base.getFullYear(), base.getMonth() - i, 1)))
  return [...claves].sort((a, b) => b.localeCompare(a))
}
