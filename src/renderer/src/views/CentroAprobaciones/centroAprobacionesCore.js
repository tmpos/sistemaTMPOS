export const TIPOS_APROBACION = Object.freeze([
  { value: 'DESCUENTO', label: 'Descuento' },
  { value: 'GASTO', label: 'Gasto' },
  { value: 'COMPRA', label: 'Compra' },
  { value: 'ANULACION', label: 'Anulación' },
  { value: 'AJUSTE_INVENTARIO', label: 'Ajuste de inventario' },
  { value: 'NOTA_CREDITO', label: 'Nota de crédito' },
  { value: 'TRANSFERENCIA', label: 'Transferencia' }
])

export const ESTADOS_APROBACION = Object.freeze({
  PENDIENTE: 'PENDIENTE', APROBADA: 'APROBADA', RECHAZADA: 'RECHAZADA', CANCELADA: 'CANCELADA'
})

export const TABLA_APROBACIONES = 'solicitudes_aprobacion'
export const CAMPOS_APROBACION = Object.freeze(['codigo','tipo','estado','nivel','monto','moneda','solicitante',
  'solicitado_at','revisor','revisado_at','motivo','respuesta','datos','historial'])

export const TRANSICIONES_APROBACION = Object.freeze({
  PENDIENTE: ['APROBADA', 'RECHAZADA', 'CANCELADA'], APROBADA: [], RECHAZADA: [], CANCELADA: []
})

export function normalizar(valor) { return String(valor ?? '').trim().toUpperCase() }
export function aNumero(valor) { const n = Number(valor); return Number.isFinite(n) ? n : 0 }
export function mismoUsuario(a, b) { return !!normalizar(a) && normalizar(a) === normalizar(b) }
export function puedeCambiarEstado(actual, siguiente) {
  return (TRANSICIONES_APROBACION[normalizar(actual)] || []).includes(normalizar(siguiente))
}

export function validarSolicitud(datos) {
  const errores = []
  if (!TIPOS_APROBACION.some((t) => t.value === normalizar(datos?.tipo))) errores.push('El tipo de solicitud no es válido.')
  if (!String(datos?.solicitante || '').trim()) errores.push('El solicitante es obligatorio.')
  if (!String(datos?.motivo || '').trim()) errores.push('El motivo es obligatorio.')
  const nivel = Number(datos?.nivel)
  if (![1, 2, 3].includes(nivel)) errores.push('El nivel debe ser 1, 2 o 3.')
  if (aNumero(datos?.monto) < 0) errores.push('El monto no puede ser negativo.')
  if (datos?.datos !== undefined && typeof datos.datos !== 'object') {
    try { JSON.parse(datos.datos) } catch { errores.push('Los datos adicionales deben ser un JSON válido.') }
  }
  return { valido: errores.length === 0, errores }
}

export function crearCodigoAprobacion(fecha = new Date(), consecutivo = 1) {
  const f = fecha instanceof Date ? fecha : new Date(fecha)
  return `APR-${f.getFullYear()}${String(f.getMonth() + 1).padStart(2, '0')}${String(f.getDate()).padStart(2, '0')}-${String(Number(consecutivo) || 1).padStart(4, '0')}`
}

export function leerJson(valor, defecto = {}) {
  if (valor && typeof valor === 'object') return valor
  try { return JSON.parse(valor || JSON.stringify(defecto)) } catch { return defecto }
}

export function agregarHistorial(historial, evento) {
  const eventos = leerJson(historial, [])
  return [...(Array.isArray(eventos) ? eventos : []), { ...evento }]
}

export function construirSolicitud(datos, contexto = {}) {
  const validacion = validarSolicitud(datos)
  if (!validacion.valido) throw new Error(validacion.errores.join(' '))
  const ahora = contexto.ahora || new Date().toISOString()
  return {
    codigo: datos.codigo || contexto.codigo || '', tipo: normalizar(datos.tipo), estado: ESTADOS_APROBACION.PENDIENTE,
    nivel: Number(datos.nivel), monto: aNumero(datos.monto), moneda: datos.moneda || 'DOP', solicitante: String(datos.solicitante).trim(),
    solicitado_at: ahora, revisor: '', revisado_at: '', motivo: String(datos.motivo).trim(), respuesta: '',
    datos: JSON.stringify(leerJson(datos.datos, {})),
    historial: JSON.stringify([{ estado:'PENDIENTE', usuario:String(datos.solicitante).trim(), fecha:ahora, comentario:'Solicitud creada' }]),
    created_at: ahora, updated_at: ahora
  }
}

export function resolverSolicitud(solicitud, decision, revisor, comentario = '', ahora = new Date().toISOString()) {
  const estado = normalizar(decision)
  if (!puedeCambiarEstado(solicitud?.estado, estado)) throw new Error(`No se puede cambiar de ${solicitud?.estado} a ${estado}.`)
  if (!String(revisor || '').trim()) throw new Error('Debe identificar al usuario que realiza la revisión.')
  if (estado === ESTADOS_APROBACION.APROBADA && mismoUsuario(solicitud.solicitante, revisor)) {
    throw new Error('El solicitante no puede aprobar su propia solicitud.')
  }
  if (estado === ESTADOS_APROBACION.RECHAZADA && !String(comentario || '').trim()) {
    throw new Error('Debe indicar el motivo del rechazo.')
  }
  return {
    ...solicitud, estado, revisor:String(revisor).trim(), revisado_at:ahora, respuesta:String(comentario || '').trim(), updated_at:ahora,
    historial: JSON.stringify(agregarHistorial(solicitud.historial, { estado, usuario:String(revisor).trim(), fecha:ahora, comentario:String(comentario || '').trim() }))
  }
}

export function filtrarSolicitudes(solicitudes, filtros = {}) {
  const texto = normalizar(filtros.busqueda)
  const estado = normalizar(filtros.estado)
  const tipo = normalizar(filtros.tipo)
  return (solicitudes || []).filter((s) => {
    if (estado && normalizar(s.estado) !== estado) return false
    if (tipo && normalizar(s.tipo) !== tipo) return false
    if (!texto) return true
    return [s.codigo, s.tipo, s.motivo, s.solicitante, s.revisor, s.respuesta].some((v) => normalizar(v).includes(texto))
  })
}

export function resumenSolicitudes(solicitudes = []) {
  return solicitudes.reduce((r, s) => { r.total += 1; r[normalizar(s.estado).toLowerCase()] += 1; r.montoPendiente += normalizar(s.estado) === 'PENDIENTE' ? aNumero(s.monto) : 0; return r },
    { total:0, pendiente:0, aprobada:0, rechazada:0, cancelada:0, montoPendiente:0 })
}

function esOk(respuesta) { return Array.isArray(respuesta) ? respuesta[0] === 'ok' : respuesta?.success === true }

export async function asegurarTablaAprobaciones(peticion) {
  let existe = await peticion('tableExists', TABLA_APROBACIONES)
  if (existe?.[0] !== 'ok') {
    const creada = await peticion('crearTabla', TABLA_APROBACIONES, CAMPOS_APROBACION.join(','))
    if (!creada?.success) throw new Error('No se pudo crear la tabla de aprobaciones.')
    existe = await peticion('tableExists', TABLA_APROBACIONES)
  }
  if (existe?.[0] !== 'ok') throw new Error('La tabla de aprobaciones no está disponible.')
  const respuestaColumnas = await peticion('getTableColumns', TABLA_APROBACIONES)
  const columnas = Array.isArray(respuestaColumnas) ? respuestaColumnas : []
  for (const campo of CAMPOS_APROBACION.filter((nombre) => !columnas.includes(nombre))) {
    if (!esOk(await peticion('addColumnToTable', { tabla:TABLA_APROBACIONES, campo }))) {
      throw new Error(`No se pudo agregar el campo ${campo}.`)
    }
  }
  return true
}

// API reutilizable: otros módulos pueden pasar peticionesFetchOffline como primer argumento.
export async function crearSolicitudAprobacion(peticion, datos, contexto = {}) {
  await asegurarTablaAprobaciones(peticion)
  const registro = construirSolicitud(datos, contexto)
  const respuesta = await peticion('insertData', TABLA_APROBACIONES, JSON.stringify(registro))
  if (!esOk(respuesta)) throw new Error(respuesta?.[1] || 'No se pudo crear la solicitud de aprobación.')
  return { ...registro, id: respuesta?.[1]?.id, respuestaDB: respuesta }
}

export async function consultarSolicitudAprobacion(peticion, id) {
  if (id === null || id === undefined || id === '') throw new Error('El ID de aprobación es obligatorio.')
  await asegurarTablaAprobaciones(peticion)
  return await peticion('getDataByField', TABLA_APROBACIONES, 'id', id)
}

export async function consultarAprobaciones(peticion, filtros = {}) {
  await asegurarTablaAprobaciones(peticion)
  const filas = await peticion('getDataAsArray', TABLA_APROBACIONES, '')
  return filtrarSolicitudes(Array.isArray(filas) ? filas : [], filtros)
}

export async function resolverSolicitudAprobacion(peticion, solicitud, decision, revisor, comentario = '', ahora) {
  await asegurarTablaAprobaciones(peticion)
  const actualizada = resolverSolicitud(solicitud, decision, revisor, comentario, ahora)
  const respuesta = await peticion('updateData', TABLA_APROBACIONES, JSON.stringify(actualizada))
  if (!esOk(respuesta)) throw new Error(respuesta?.[1] || 'No se pudo actualizar la aprobación.')
  return actualizada
}
