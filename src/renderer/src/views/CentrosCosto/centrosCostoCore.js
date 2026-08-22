const texto = (valor) => String(valor ?? '').trim()
const normal = (valor) => texto(valor).toLocaleLowerCase('es').normalize('NFD').replace(/[\u0300-\u036f]/g, '')

export const aNumero = (valor) => {
  if (typeof valor === 'number') return Number.isFinite(valor) ? valor : 0
  const limpio = texto(valor).replace(/[^0-9,.-]/g, '')
  if (!limpio) return 0
  const convertido = Number(limpio.includes(',') && limpio.includes('.') ? limpio.replace(/,/g, '') : limpio.replace(',', '.'))
  return Number.isFinite(convertido) ? convertido : 0
}

export const parsearFecha = (valor) => {
  if (valor instanceof Date && !Number.isNaN(valor.getTime())) return new Date(valor)
  const dato = texto(valor).split(/[T\s]/)[0]
  let match = dato.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/)
  let year; let month; let day
  if (match) [, year, month, day] = match
  else {
    match = dato.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/)
    if (!match) return null
    ;[, day, month, year] = match
  }
  const fecha = new Date(Number(year), Number(month) - 1, Number(day))
  return fecha.getFullYear() === Number(year) && fecha.getMonth() === Number(month) - 1 && fecha.getDate() === Number(day) ? fecha : null
}

export const periodoDeFecha = (valor, tipo = 'MENSUAL') => {
  if (tipo === 'ANUAL' && /^\d{4}$/.test(texto(valor))) return texto(valor)
  if (tipo !== 'ANUAL' && /^\d{4}-(0[1-9]|1[0-2])$/.test(texto(valor))) return texto(valor)
  const fecha = parsearFecha(valor)
  if (!fecha) return ''
  const year = String(fecha.getFullYear())
  return tipo === 'ANUAL' ? year : `${year}-${String(fecha.getMonth() + 1).padStart(2, '0')}`
}

export const parsearLineas = (valor) => {
  if (Array.isArray(valor)) return valor
  if (valor && typeof valor === 'object') {
    if (Array.isArray(valor.asientos)) return valor.asientos
    if (Array.isArray(valor.detalle)) return valor.detalle
    return [valor]
  }
  if (!texto(valor)) return []
  try { return parsearLineas(JSON.parse(valor)) } catch { return [] }
}

export const normalizarCentro = (centro = {}) => ({
  ...centro,
  id: centro.id ?? '',
  codigo: texto(centro.codigo || centro.code),
  nombre: texto(centro.nombre || centro.name),
  tipo: texto(centro.tipo || 'DEPARTAMENTO').toUpperCase(),
  sucursal: texto(centro.sucursal || centro.almacen),
  responsable: texto(centro.responsable),
  estado: texto(centro.estado || 'ACTIVO').toUpperCase()
})

const identificadoresCentro = (centro) => [centro.id, centro.codigo, centro.nombre].map(normal).filter(Boolean)

export const buscarCentro = (valor, centros = []) => {
  const objetivo = normal(typeof valor === 'object' ? (valor.id || valor.codigo || valor.nombre) : valor)
  if (!objetivo) return null
  return centros.map(normalizarCentro).find((centro) => identificadoresCentro(centro).includes(objetivo)) || null
}

const centroLinea = (linea, asiento) => linea?.centro_costo_id || linea?.centroCostoId || linea?.centro_costo || linea?.centroCosto || asiento?.centro_costo_id || asiento?.centroCostoId || asiento?.centro_costo || asiento?.centroCosto
const categoriaLinea = (linea, asiento) => texto(linea?.categoria || linea?.tipo_cuenta || asiento?.categoria || asiento?.tipo_movimiento)

export const extraerEjecucion = (asientos = [], centros = []) => {
  const movimientos = []
  for (const asiento of asientos) {
    const fecha = parsearFecha(asiento?.fecha || asiento?.created_at)
    if (!fecha) continue
    parsearLineas(asiento?.asiento ?? asiento?.detalle).forEach((linea, indice) => {
      const centro = buscarCentro(centroLinea(linea, asiento), centros)
      if (!centro) return
      const base = {
        id: `${asiento.id || asiento.numero || 'asiento'}-${indice}`,
        asientoId: asiento.id, numero: texto(asiento.numero), fecha,
        fechaTexto: `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}-${String(fecha.getDate()).padStart(2, '0')}`,
        descripcion: texto(asiento.descripcion || linea.descripcion), usuario: texto(asiento.usuario) || 'Sistema',
        centroId: centro.id, centroCodigo: centro.codigo, centroNombre: centro.nombre,
        categoria: categoriaLinea(linea, asiento)
      }
      const debito = aNumero(linea?.cantidadDebito ?? linea?.debitoMonto ?? linea?.montoDebito ?? (texto(linea?.tipo).toUpperCase() === 'DEBITO' ? linea?.monto : 0))
      const credito = aNumero(linea?.cantidadCredito ?? linea?.creditoMonto ?? linea?.montoCredito ?? (texto(linea?.tipo).toUpperCase() === 'CREDITO' ? linea?.monto : 0))
      const cuentaUnica = texto(linea?.cuenta || linea?.nombre_cuenta)
      if (cuentaUnica) movimientos.push({ ...base, cuenta: cuentaUnica, debito, credito, real: debito - credito })
      else {
        const cuentaDebito = texto(linea?.debito || linea?.cuentaDebito)
        const cuentaCredito = texto(linea?.credito || linea?.cuentaCredito)
        if (cuentaDebito && debito) movimientos.push({ ...base, id: `${base.id}-d`, cuenta: cuentaDebito, debito, credito: 0, real: debito })
        if (cuentaCredito && credito) movimientos.push({ ...base, id: `${base.id}-c`, cuenta: cuentaCredito, debito: 0, credito, real: -credito })
      }
    })
  }
  return movimientos.sort((a, b) => a.fecha - b.fecha || a.id.localeCompare(b.id))
}

export const normalizarPresupuesto = (presupuesto = {}, centros = []) => {
  const centro = buscarCentro(presupuesto.centro_costo_id || presupuesto.centro_codigo || presupuesto.centro_costo, centros)
  const tipoPeriodo = texto(presupuesto.tipo_periodo || (texto(presupuesto.periodo).length === 4 ? 'ANUAL' : 'MENSUAL')).toUpperCase()
  return {
    ...presupuesto,
    centroId: centro?.id ?? presupuesto.centro_costo_id,
    centroCodigo: centro?.codigo || texto(presupuesto.centro_codigo),
    centroNombre: centro?.nombre || texto(presupuesto.centro_costo),
    tipoPeriodo: tipoPeriodo === 'ANUAL' ? 'ANUAL' : 'MENSUAL',
    periodo: periodoDeFecha(presupuesto.periodo, tipoPeriodo),
    cuenta: texto(presupuesto.cuenta), categoria: texto(presupuesto.categoria),
    monto: aNumero(presupuesto.monto)
  }
}

const coincideCentro = (movimiento, presupuesto) => {
  const idsMovimiento = [movimiento.centroId, movimiento.centroCodigo, movimiento.centroNombre].map(normal)
  return [presupuesto.centroId, presupuesto.centroCodigo, presupuesto.centroNombre].map(normal).filter(Boolean).some((id) => idsMovimiento.includes(id))
}

const coincideClasificacion = (movimiento, presupuesto) => presupuesto.cuenta
  ? normal(movimiento.cuenta) === normal(presupuesto.cuenta)
  : presupuesto.categoria ? normal(movimiento.categoria) === normal(presupuesto.categoria) : true

export const construirComparativo = ({ presupuestos = [], asientos = [], centros = [], tipoPeriodo = 'MENSUAL', periodo = '' } = {}) => {
  const tipo = texto(tipoPeriodo).toUpperCase() === 'ANUAL' ? 'ANUAL' : 'MENSUAL'
  const clavePeriodo = periodoDeFecha(periodo, tipo)
  const ejecucion = extraerEjecucion(asientos, centros)
  const agrupados = new Map()

  presupuestos.map((item) => normalizarPresupuesto(item, centros))
    .filter((item) => item.tipoPeriodo === tipo && item.periodo === clavePeriodo)
    .forEach((item) => {
      const clave = [normal(item.centroId || item.centroCodigo || item.centroNombre), normal(item.cuenta), normal(item.categoria)].join('@@')
      const actual = agrupados.get(clave) || { ...item, presupuesto: 0, idsPresupuesto: [] }
      actual.presupuesto += item.monto
      if (item.id != null) actual.idsPresupuesto.push(item.id)
      agrupados.set(clave, actual)
    })

  return [...agrupados.values()].map((item) => {
    const movimientos = ejecucion.filter((mov) => periodoDeFecha(mov.fecha, tipo) === clavePeriodo && coincideCentro(mov, item) && coincideClasificacion(mov, item))
    const real = Math.round(movimientos.reduce((total, mov) => total + mov.real, 0) * 100) / 100
    const presupuesto = Math.round(item.presupuesto * 100) / 100
    const variacion = Math.round((presupuesto - real) * 100) / 100
    const porcentaje = presupuesto > 0 ? Math.round((real / presupuesto) * 10000) / 100 : (real > 0 ? 100 : 0)
    return { ...item, presupuesto, real, variacion, porcentaje, sobreejecutado: real > presupuesto, movimientos }
  }).sort((a, b) => Number(b.sobreejecutado) - Number(a.sobreejecutado) || b.porcentaje - a.porcentaje)
}

export const filtrarComparativo = (filas = [], filtros = {}) => {
  const busqueda = normal(filtros.buscar)
  return filas.filter((fila) => {
    if (filtros.centro && ![fila.centroId, fila.centroCodigo, fila.centroNombre].map(normal).includes(normal(filtros.centro))) return false
    if (filtros.estado === 'SOBREEJECUTADO' && !fila.sobreejecutado) return false
    if (filtros.estado === 'DENTRO' && fila.sobreejecutado) return false
    if (busqueda && !normal([fila.centroNombre, fila.centroCodigo, fila.cuenta, fila.categoria].join(' ')).includes(busqueda)) return false
    return true
  })
}

export const resumirComparativo = (filas = []) => {
  const presupuesto = filas.reduce((total, fila) => total + aNumero(fila.presupuesto), 0)
  const real = filas.reduce((total, fila) => total + aNumero(fila.real), 0)
  return {
    partidas: filas.length, presupuesto, real, variacion: presupuesto - real,
    porcentaje: presupuesto > 0 ? (real / presupuesto) * 100 : (real > 0 ? 100 : 0),
    alertas: filas.filter((fila) => fila.sobreejecutado).length
  }
}

export const validarCentro = (centro, existentes = []) => {
  const errores = []
  if (texto(centro?.codigo).length < 2) errores.push('El código debe tener al menos 2 caracteres.')
  if (texto(centro?.nombre).length < 3) errores.push('El nombre debe tener al menos 3 caracteres.')
  if (!['SUCURSAL', 'DEPARTAMENTO', 'PROYECTO'].includes(texto(centro?.tipo).toUpperCase())) errores.push('Seleccione un tipo de centro válido.')
  if (existentes.some((item) => normal(item.codigo) === normal(centro?.codigo) && String(item.id) !== String(centro?.id || ''))) errores.push('Ya existe un centro con ese código.')
  return { valido: errores.length === 0, errores }
}

export const validarPresupuesto = (presupuesto) => {
  const errores = []
  if (!texto(presupuesto?.centro_costo_id || presupuesto?.centro_codigo)) errores.push('Seleccione un centro de costo.')
  if (!periodoDeFecha(presupuesto?.periodo, presupuesto?.tipo_periodo)) errores.push('El período no es válido.')
  if (!texto(presupuesto?.cuenta) && !texto(presupuesto?.categoria)) errores.push('Indique una cuenta o categoría.')
  if (aNumero(presupuesto?.monto) <= 0) errores.push('El presupuesto debe ser mayor que cero.')
  return { valido: errores.length === 0, errores }
}
