import { describe, expect, it } from 'vitest'
import { aplicarRecepcion, calcularTotales, generarNumeroOrden, validarOrden } from '../ordenesCompraCore'

describe('órdenes de compra', () => {
  it('calcula subtotal, impuesto y total', () => {
    expect(calcularTotales([{ cantidad: 2, costo: 100, impuestoPorcentaje: 18 }])).toMatchObject({
      subtotal: 200,
      impuesto: 36,
      total: 236
    })
  })

  it('genera una secuencia anual', () => {
    const orders = [{ numero: 'OC-2026-000002' }, { numero: 'OC-2025-000090' }]
    expect(generarNumeroOrden(orders, new Date(2026, 7, 22))).toBe('OC-2026-000003')
  })

  it('valida proveedor, almacén e items', () => {
    expect(validarOrden({})).toHaveLength(3)
    expect(validarOrden({ proveedor: 'P', almacen: 'A', items: [{ cantidad: 1, costo: 5 }] })).toEqual([])
  })

  it('soporta recepciones parciales y limita el exceso', () => {
    const items = [{ productoId: 5, cantidad: 10, cantidadRecibida: 3, costo: 2 }]
    expect(aplicarRecepcion(items, { 5: 4 })).toMatchObject({ estado: 'PARCIAL', recibidasAhora: 4 })
    const final = aplicarRecepcion(items, { 5: 20 })
    expect(final.estado).toBe('RECIBIDA')
    expect(final.items[0].cantidadRecibida).toBe(10)
  })
})
