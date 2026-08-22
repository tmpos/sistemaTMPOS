import { describe, expect, it } from 'vitest'
import { construirDias, proyectarMovimientos, saldoDisponible } from '../flujoCajaCore'

describe('proyección de flujo de caja', () => {
  it('suma saldos disponibles', () => {
    expect(saldoDisponible([{ balance: 100 }, { saldo: 50 }], [{ monto: 25 }])).toBe(175)
  })
  it('convierte cartera pendiente en entradas y salidas', () => {
    const rows = proyectarMovimientos(
      [{ id: 1, saldo: 200, fecha_vencimiento: '22/08/2026', nombre_cliente: 'Ana' }],
      [{ id: 2, saldo: 80, fecha_vencimiento: '2026-08-23', proveedor: 'P' }],
      { desde: '2026-08-22', hasta: '2026-08-23' }
    )
    expect(rows.map((row) => row.tipo)).toEqual(['INGRESO', 'EGRESO'])
  })
  it('calcula el balance diario acumulado', () => {
    const days = construirDias([{ fecha: '2026-08-22', tipo: 'INGRESO', monto: 100 }, { fecha: '2026-08-23', tipo: 'EGRESO', monto: 30 }], 50, '2026-08-22', '2026-08-23')
    expect(days.map((day) => day.balance)).toEqual([150, 120])
  })
})
