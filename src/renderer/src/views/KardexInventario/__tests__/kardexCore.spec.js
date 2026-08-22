import { describe, expect, it } from 'vitest'
import { construirMovimientos, filtrarMovimientos, obtenerRango, parsearFecha, resumirMovimientos } from '../kardexCore.js'

const datos = () => ({
  productos: [{ id: 1, codigo: 'A-1', nombre: 'Arroz', almacen: 'Principal', stock: '13' }],
  compras: [{ id: 10, no_factura: 'C-10', fecha: '01-08-2026', almacen: 'Principal', proveedor: 'Proveedor Uno', usuario: 'Ana', productos: JSON.stringify([{ codigo: 'A-1', nombre: 'Arroz', stock: '20' }]) }],
  facturas: [{ id: 20, no_factura: 'F-20', fecha_emision: '05/08/2026', hora: '10:30:00', almacen: 'Principal', nombre_cliente: 'Cliente Uno', cajero: 'Luis', productos: JSON.stringify([{ codigo: 'A-1', descripcion: 'Arroz', cantidad: 5 }]) }],
  danados: [{ id: 30, codigo_producto: 'A-1', nombre_producto: 'Arroz', cantidad: 2, fecha: '2026-08-06', almacen: 'Principal', usuario: 'Luis' }]
})

describe('kardexCore', () => {
  it('interpreta fechas locales sin intercambiar día y mes', () => {
    expect(parsearFecha('21-08-2026').getDate()).toBe(21)
    expect(parsearFecha('2026-08-09').getMonth()).toBe(7)
  })

  it('calcula los rangos rápidos de hoy, ayer, semana y mes', () => {
    const ahora = new Date(2026, 7, 22, 14)
    expect(obtenerRango('ayer', ahora).inicio.getDate()).toBe(21)
    expect(obtenerRango('semana', ahora).inicio.getDay()).toBe(1)
    expect(obtenerRango('mes', ahora).inicio.getDate()).toBe(1)
  })

  it('construye entradas y salidas y reconcilia la existencia con el stock actual', () => {
    const movimientos = construirMovimientos(datos())
    expect(movimientos).toHaveLength(3)
    expect(movimientos[0]).toMatchObject({ tipo: 'ENTRADA', entrada: 20, saldoAnterior: 0, existencia: 20, documento: 'C-10' })
    expect(movimientos[1]).toMatchObject({ tipo: 'SALIDA', salida: 5, saldoAnterior: 20, existencia: 15 })
    expect(movimientos[2]).toMatchObject({ tipo: 'SALIDA', salida: 2, saldoAnterior: 15, existencia: 13 })
  })

  it('omite documentos anulados y tolera JSON de productos inválido', () => {
    const base = datos()
    base.facturas.push({ id: 21, estado_factura: 'ANULADA', productos: '[{"cantidad":99}]' })
    base.compras.push({ id: 11, productos: 'no-es-json' })
    expect(construirMovimientos(base)).toHaveLength(3)
  })

  it('filtra por rango, producto, almacén, tipo y búsqueda', () => {
    const movimientos = construirMovimientos(datos())
    const resultado = filtrarMovimientos(movimientos, {
      preset: 'personalizado', desde: '2026-08-05', hasta: '2026-08-06',
      producto: movimientos[0].clave, almacen: 'principal', tipo: 'SALIDA', buscar: 'cliente'
    })
    expect(resultado).toHaveLength(1)
    expect(resultado[0].documento).toBe('F-20')
  })

  it('resume saldo anterior, entradas, salidas y existencia sin sumar dos veces el producto', () => {
    const movimientos = construirMovimientos(datos())
    expect(resumirMovimientos(movimientos)).toMatchObject({ movimientos: 3, saldoAnterior: 0, entradas: 20, salidas: 7, existencia: 13, productos: 1 })
  })
})
