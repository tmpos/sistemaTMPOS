import { describe, expect, it } from 'vitest'
import {
  construirTrazabilidad,
  filtrarTransacciones,
  normalizarFecha,
  obtenerRangoPeriodo
} from '../transaccionesCore'

describe('trazabilidad de transacciones', () => {
  it('normaliza los formatos de fecha usados por el sistema', () => {
    expect(normalizarFecha('22/08/2026')).toBe('2026-08-22')
    expect(normalizarFecha('21-08-2026 12:43:29')).toBe('2026-08-21')
    expect(normalizarFecha('2026-08-20')).toBe('2026-08-20')
  })

  it('calcula hoy, ayer, semana y mes', () => {
    const now = new Date(2026, 7, 22, 15, 0, 0)
    expect(obtenerRangoPeriodo('hoy', now)).toEqual({ desde: '2026-08-22', hasta: '2026-08-22' })
    expect(obtenerRangoPeriodo('ayer', now)).toEqual({ desde: '2026-08-21', hasta: '2026-08-21' })
    expect(obtenerRangoPeriodo('semana', now)).toEqual({ desde: '2026-08-17', hasta: '2026-08-22' })
    expect(obtenerRangoPeriodo('mes', now)).toEqual({ desde: '2026-08-01', hasta: '2026-08-22' })
  })

  it('convierte el crédito en origen y el débito en destino', () => {
    const rows = construirTrazabilidad([{
      id: 7,
      fecha: '22/08/2026',
      numero: '00000007',
      descripcion: 'Venta factura F001',
      asiento: JSON.stringify([{ credito: 'Ventas', debito: 'Caja', cantidadCredito: 200, cantidadDebito: 200 }])
    }], [])

    expect(rows[0]).toMatchObject({ cuentaOrigen: 'Ventas', cuentaDestino: 'Caja', monto: 200, modulo: 'Ventas' })
  })

  it('no duplica una transferencia presente en ambas fuentes', () => {
    const asientos = [{
      id: 1,
      fecha: '22/08/2026',
      descripcion: 'Transferencia bancaria',
      asiento: '[{"credito":"Banco A","debito":"Banco B","cantidadCredito":50,"cantidadDebito":50}]'
    }]
    const banco = [{ id: 2, fecha: '2026-08-22', tipo: 'TRANSFERENCIA', cuenta_origen: 'Banco A', cuenta_destino: 'Banco B', monto: 50 }]
    expect(construirTrazabilidad(asientos, banco)).toHaveLength(1)
  })

  it('filtra por rango, cuenta y búsqueda libre', () => {
    const rows = [
      { fecha: '2026-08-21', cuentaOrigen: 'Ventas', cuentaDestino: 'Caja', documento: 'F1', descripcion: 'Factura', modulo: 'Ventas' },
      { fecha: '2026-08-22', cuentaOrigen: 'Caja', cuentaDestino: 'Banco', documento: 'T2', descripcion: 'Depósito', modulo: 'Bancos' }
    ]
    expect(filtrarTransacciones(rows, { desde: '2026-08-22', hasta: '2026-08-22', cuenta: 'Caja', busqueda: 'banco' })).toHaveLength(1)
  })
})
