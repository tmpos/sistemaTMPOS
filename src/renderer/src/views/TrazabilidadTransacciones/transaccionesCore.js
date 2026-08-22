const pad = (value) => String(value).padStart(2, '0')

export function normalizarFecha(value) {
  if (!value) return ''

  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}`
  }

  const raw = String(value).trim().split(/[T ]/)[0]
  let match = raw.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/)
  if (match) return `${match[1]}-${pad(match[2])}-${pad(match[3])}`

  match = raw.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/)
  if (match) return `${match[3]}-${pad(match[2])}-${pad(match[1])}`

  return ''
}

function fechaLocal(isoDate) {
  if (!isoDate) return null
  const [year, month, day] = isoDate.split('-').map(Number)
  const date = new Date(year, month - 1, day)
  return Number.isNaN(date.getTime()) ? null : date
}

export function obtenerRangoPeriodo(periodo, now = new Date()) {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const end = new Date(today)
  const start = new Date(today)

  if (periodo === 'ayer') {
    start.setDate(start.getDate() - 1)
    end.setDate(end.getDate() - 1)
  } else if (periodo === 'semana') {
    const day = start.getDay()
    start.setDate(start.getDate() - (day === 0 ? 6 : day - 1))
  } else if (periodo === 'mes') {
    start.setDate(1)
  }

  return { desde: normalizarFecha(start), hasta: normalizarFecha(end) }
}

export function inferirModulo(descripcion = '', tipo = '') {
  const text = `${descripcion} ${tipo}`.toLowerCase()
  if (/transfer/.test(text)) return 'Transferencia bancaria'
  if (/venta|factura|ticket|cotizaci/.test(text)) return 'Ventas'
  if (/compra|proveedor/.test(text)) return 'Compras'
  if (/n[oó]mina|empleado|sueldo/.test(text)) return 'Nómina'
  if (/gasto|egreso/.test(text)) return 'Gastos'
  if (/recibo|cobro|abono cliente|cuenta.*cobrar/.test(text)) return 'Cuentas por cobrar'
  if (/pago|cuenta.*pagar/.test(text)) return 'Cuentas por pagar'
  if (/dep[oó]sito|retiro|banco|cheque/.test(text)) return 'Bancos'
  return 'Asiento diario'
}

const safeNumber = (value) => {
  const number = Number.parseFloat(String(value ?? 0).replace(/,/g, ''))
  return Number.isFinite(number) ? number : 0
}

const safeJsonArray = (value) => {
  if (Array.isArray(value)) return value
  try {
    const parsed = JSON.parse(value || '[]')
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

const signature = (row) => [
  row.fecha,
  row.cuentaOrigen.toLowerCase(),
  row.cuentaDestino.toLowerCase(),
  row.monto.toFixed(2)
].join('|')

export function mapearAsientos(asientos = []) {
  return asientos.flatMap((entrada, entryIndex) => {
    const items = safeJsonArray(entrada.asiento)
    return items.flatMap((item, itemIndex) => {
      const cuentaOrigen = String(item.credito || item.cuentaCredito || '').trim()
      const cuentaDestino = String(item.debito || item.cuentaDebito || '').trim()
      if (!cuentaOrigen && !cuentaDestino) return []

      const debito = safeNumber(item.cantidadDebito ?? item.debitoMonto)
      const credito = safeNumber(item.cantidadCredito ?? item.creditoMonto)
      const monto = Math.max(debito, credito)
      const fecha = normalizarFecha(entrada.fecha || entrada.created_at)

      return [{
        id: `asiento-${entrada.id ?? entryIndex}-${itemIndex}`,
        fuente: 'contable',
        fecha,
        fechaOriginal: entrada.fecha || '',
        hora: entrada.hora || '',
        cuentaOrigen: cuentaOrigen || 'Origen no especificado',
        cuentaDestino: cuentaDestino || 'Destino no especificado',
        monto,
        debito,
        credito,
        documento: entrada.numero || item.documento || '',
        descripcion: entrada.descripcion || item.descripcion || 'Movimiento contable',
        modulo: inferirModulo(entrada.descripcion),
        usuario: entrada.usuario || '',
        estado: entrada.estado || 'REGISTRADO',
        original: entrada
      }]
    })
  })
}

export function mapearTransaccionesBancarias(transacciones = [], firmasContables = new Set()) {
  return transacciones.flatMap((item, index) => {
    const tipo = String(item.tipo || '').trim()
    const tipoLower = tipo.toLowerCase()
    const cuenta = String(item.cuenta || '').trim()
    const persona = String(item.beneficiario || item.depositante || item.persona || '').trim()
    let cuentaOrigen = String(item.cuenta_origen || '').trim()
    let cuentaDestino = String(item.cuenta_destino || '').trim()

    if (!cuentaOrigen && !cuentaDestino) {
      if (/dep[oó]sito|ingreso|cobro/.test(tipoLower)) {
        cuentaOrigen = persona || 'Origen externo'
        cuentaDestino = cuenta || 'Cuenta no especificada'
      } else {
        cuentaOrigen = cuenta || 'Cuenta no especificada'
        cuentaDestino = persona || 'Destino externo'
      }
    }

    const row = {
      id: `banco-${item.id ?? index}`,
      fuente: 'operativa',
      fecha: normalizarFecha(item.fecha || item.created_at),
      fechaOriginal: item.fecha || '',
      hora: item.hora || '',
      cuentaOrigen: cuentaOrigen || 'Origen no especificado',
      cuentaDestino: cuentaDestino || 'Destino no especificado',
      monto: safeNumber(item.monto),
      debito: 0,
      credito: 0,
      documento: item.numero || item.referencia || item.id || '',
      descripcion: item.descripcion || tipo || 'Transacción bancaria',
      modulo: inferirModulo(item.descripcion, tipo) === 'Asiento diario' ? 'Bancos' : inferirModulo(item.descripcion, tipo),
      usuario: item.usuario || '',
      estado: item.estado || 'REGISTRADO',
      original: item
    }

    return firmasContables.has(signature(row)) ? [] : [row]
  })
}

export function construirTrazabilidad(asientos = [], transacciones = []) {
  const contables = mapearAsientos(asientos)
  const firmas = new Set(contables.map(signature))
  return [...contables, ...mapearTransaccionesBancarias(transacciones, firmas)]
    .sort((a, b) => `${b.fecha} ${b.hora}`.localeCompare(`${a.fecha} ${a.hora}`))
}

export function filtrarTransacciones(rows = [], filtros = {}) {
  const { desde = '', hasta = '', cuenta = '', busqueda = '' } = filtros
  const query = busqueda.trim().toLowerCase()
  return rows.filter((row) => {
    const date = fechaLocal(row.fecha)
    if (!date) return !desde && !hasta
    if (desde && row.fecha < desde) return false
    if (hasta && row.fecha > hasta) return false
    if (cuenta && row.cuentaOrigen !== cuenta && row.cuentaDestino !== cuenta) return false
    if (!query) return true
    return [row.cuentaOrigen, row.cuentaDestino, row.documento, row.descripcion, row.modulo, row.usuario, row.estado]
      .some((value) => String(value || '').toLowerCase().includes(query))
  })
}
