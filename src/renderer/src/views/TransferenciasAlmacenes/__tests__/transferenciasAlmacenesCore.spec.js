import { describe, expect, it } from 'vitest'
import { agregarEventoHistorial, calcularResumen, crearNumeroTransferencia, encontrarProductoDestino,
  filtrarTransferencias, puedeTransicionar, validarTransferencia } from '../transferenciasAlmacenesCore.js'

describe('transferenciasAlmacenesCore', () => {
  const productos = [
    { id: 1, codigo: 'A-1', nombre: 'Arroz', categoria: 'Alimentos', almacen: 'Principal', stock: 8 },
    { id: 2, codigo: 'B-2', nombre: 'Café', categoria: 'Alimentos', almacen: 'Principal', stock: 2 }
  ]
  it('solo permite el flujo definido y no cancela mercancía en tránsito', () => {
    expect(puedeTransicionar('BORRADOR', 'SOLICITADA')).toBe(true)
    expect(puedeTransicionar('SOLICITADA', 'DESPACHADA')).toBe(true)
    expect(puedeTransicionar('DESPACHADA', 'RECIBIDA')).toBe(true)
    expect(puedeTransicionar('DESPACHADA', 'CANCELADA')).toBe(false)
  })
  it('valida almacenes, cantidades, duplicados y stock', () => {
    const r = validarTransferencia({ almacen_origen: 'Principal', almacen_destino: 'Principal', items: [
      { producto_id_origen: 1, cantidad: 9 }, { producto_id_origen: 1, cantidad: 1 }
    ] }, productos)
    expect(r.valido).toBe(false)
    expect(r.errores.join(' ')).toContain('diferente')
    expect(r.errores.join(' ')).toContain('Stock insuficiente')
    expect(r.errores.join(' ')).toContain('repetido')
  })
  it('acepta solicitudes válidas y genera numeración legible', () => {
    expect(validarTransferencia({ almacen_origen: 'Principal', almacen_destino: 'Sucursal', items: [
      { producto_id_origen: 1, cantidad: 3 }
    ] }, productos).valido).toBe(true)
    expect(crearNumeroTransferencia(new Date(2026, 7, 22), 7)).toBe('TRA-20260822-0007')
  })
  it('encuentra equivalentes en destino por código o identidad comercial', () => {
    const inventario = [...productos,
      { id: 10, codigo: 'A-1', nombre: 'Arroz', categoria: 'Alimentos', almacen: 'Sucursal' },
      { id: 11, codigo: 'OTRO', nombre: 'Café', categoria: 'Alimentos', almacen: 'Sucursal' }]
    expect(encontrarProductoDestino(inventario, productos[0], 'Sucursal').id).toBe(10)
    expect(encontrarProductoDestino(inventario, productos[1], 'Sucursal').id).toBe(11)
  })
  it('mantiene historial, filtra y calcula el tablero', () => {
    expect(agregarEventoHistorial('[]', { estado: 'SOLICITADA' })).toHaveLength(1)
    const filas = [
      { numero: 'TRA-1', estado: 'SOLICITADA', almacen_origen: 'Principal', almacen_destino: 'Norte', total_unidades: 3 },
      { numero: 'TRA-2', estado: 'DESPACHADA', almacen_origen: 'Norte', almacen_destino: 'Sur', total_unidades: 4 },
      { numero: 'TRA-3', estado: 'RECIBIDA', almacen_origen: 'Principal', almacen_destino: 'Sur', total_unidades: 2 }
    ]
    expect(filtrarTransferencias(filas, { busqueda: 'norte' })).toHaveLength(2)
    expect(calcularResumen(filas)).toEqual({ total: 3, pendientes: 1, enTransito: 1, recibidas: 1, unidades: 9 })
  })
})
