const pad = (value) => String(value).padStart(2, '0')
export const iso = (date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`

export function parseFecha(value) {
  if (!value) return ''
  const raw = String(value).trim().split(/[T ]/)[0]
  let match = raw.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/)
  if (match) return `${match[1]}-${pad(match[2])}-${pad(match[3])}`
  match = raw.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/)
  return match ? `${match[3]}-${pad(match[2])}-${pad(match[1])}` : ''
}

const amount = (value) => {
  const parsed = Number.parseFloat(String(value ?? 0).replace(/,/g, ''))
  return Number.isFinite(parsed) ? parsed : 0
}

export function saldoDisponible(bancos = [], caja = []) {
  const bank = bancos.reduce((sum, row) => sum + amount(row.balance ?? row.saldo ?? row.balance_actual), 0)
  const cash = caja.reduce((sum, row) => sum + amount(row.balance ?? row.saldo ?? row.monto), 0)
  return bank + cash
}

export function proyectarMovimientos(cxc = [], cxp = [], opciones = {}) {
  const desde = opciones.desde || iso(new Date())
  const hasta = opciones.hasta || desde
  const ingresos = cxc.flatMap((row, index) => {
    const saldo = amount(row.saldo)
    const fecha = parseFecha(row.fecha_vencimiento)
    if (saldo <= 0 || !fecha || fecha < desde || fecha > hasta) return []
    return [{ id: `cxc-${row.id ?? index}`, fecha, tipo: 'INGRESO', monto: saldo, tercero: row.nombre_cliente || row.cliente || 'Cliente', documento: row.no_factura || '', origen: 'Cuenta por cobrar' }]
  })
  const egresos = cxp.flatMap((row, index) => {
    const saldo = amount(row.saldo)
    const fecha = parseFecha(row.fecha_vencimiento)
    if (saldo <= 0 || !fecha || fecha < desde || fecha > hasta) return []
    return [{ id: `cxp-${row.id ?? index}`, fecha, tipo: 'EGRESO', monto: saldo, tercero: row.proveedor || 'Proveedor', documento: row.no_factura || '', origen: 'Cuenta por pagar' }]
  })
  return [...ingresos, ...egresos].sort((a, b) => a.fecha.localeCompare(b.fecha))
}

export function construirDias(movimientos = [], saldoInicial = 0, desde, hasta) {
  const start = new Date(`${desde}T00:00:00`)
  const end = new Date(`${hasta}T00:00:00`)
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || start > end) return []
  let balance = amount(saldoInicial)
  const result = []
  for (const cursor = new Date(start); cursor <= end; cursor.setDate(cursor.getDate() + 1)) {
    const fecha = iso(cursor)
    const rows = movimientos.filter((row) => row.fecha === fecha)
    const ingresos = rows.filter((row) => row.tipo === 'INGRESO').reduce((sum, row) => sum + amount(row.monto), 0)
    const egresos = rows.filter((row) => row.tipo === 'EGRESO').reduce((sum, row) => sum + amount(row.monto), 0)
    balance += ingresos - egresos
    result.push({ fecha, ingresos, egresos, neto: ingresos - egresos, balance, movimientos: rows })
  }
  return result
}
