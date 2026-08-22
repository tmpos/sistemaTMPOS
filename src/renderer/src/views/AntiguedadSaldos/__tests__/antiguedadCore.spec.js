import { describe, expect, it } from 'vitest'
import { calcularDiasVencidos, mapearCuentasCobrar, mapearCuentasPagar, obtenerTramo, resumirTramos } from '../antiguedadCore'

describe('antigüedad de saldos', () => {
  const corte = new Date(2026, 7, 22)

  it('calcula días vencidos con formatos locales', () => {
    expect(calcularDiasVencidos('21/08/2026', corte)).toBe(1)
    expect(calcularDiasVencidos('2026-09-01', corte)).toBe(-10)
  })

  it('clasifica los tramos', () => {
    expect(obtenerTramo(-2)).toBe('VIGENTE')
    expect(obtenerTramo(20)).toBe('1_30')
    expect(obtenerTramo(45)).toBe('31_60')
    expect(obtenerTramo(80)).toBe('61_90')
    expect(obtenerTramo(120)).toBe('MAS_90')
  })

  it('excluye saldos pagados y unifica CxC/CxP', () => {
    const cobrar = mapearCuentasCobrar([{ id: 1, saldo: 100, nombre_cliente: 'Ana', fecha_vencimiento: '2026-08-01' }, { id: 2, saldo: 0 }], corte)
    const pagar = mapearCuentasPagar([{ id: 3, saldo: 200, proveedor: 'Proveedor', fecha_vencimiento: '2026-06-01' }], corte)
    expect(cobrar).toHaveLength(1)
    expect(pagar[0]).toMatchObject({ tipo: 'PAGAR', tramo: '61_90' })
    expect(resumirTramos([...cobrar, ...pagar])['1_30'].saldo).toBe(100)
  })
})
