import { describe, expect, it } from 'vitest'
import {
  ESTADOS_CONTEO,
  crearAjustes,
  crearLineasConteo,
  detectarCambiosConcurrentes,
  recalcularLinea,
  resumenConteo,
  siguienteEstado,
  validarConteoParaFinalizar
} from '../conteoFisicoCore.js'

const productos = [
  { id: 1, codigo: 'A-1', nombre: 'Arroz', almacen: 'Principal', stock: '10', precio_compra: '25' },
  { id: 2, codigo: 'H-1', nombre: 'Habichuela', almacen: 'Principal', stock: 4, precio_compra: 50 },
  { id: 3, codigo: 'O-1', nombre: 'Otro', almacen: 'Sucursal', stock: 2, precio_compra: 10 }
]

describe('conteoFisicoCore', () => {
  it('crea únicamente las líneas del almacén seleccionado', () => {
    const lineas = crearLineasConteo(productos, 'Principal')
    expect(lineas).toHaveLength(2)
    expect(lineas.map((linea) => linea.nombre)).toEqual(['Arroz', 'Habichuela'])
  })

  it('calcula diferencia y valoración con signo', () => {
    expect(recalcularLinea(crearLineasConteo(productos, 'Principal')[0], 8)).toMatchObject({
      cantidad_contada: 8,
      diferencia: -2,
      valor_ajuste: -50
    })
  })

  it('resume productos contados, diferencias y valor del ajuste', () => {
    const lineas = crearLineasConteo(productos, 'Principal').map((linea, indice) =>
      recalcularLinea(linea, indice === 0 ? 8 : 5)
    )
    expect(resumenConteo(lineas)).toMatchObject({
      productos: 2,
      contados: 2,
      conDiferencia: 2,
      diferenciaUnidades: -1,
      valorAjuste: 0
    })
  })

  it('impide finalizar incompleto y detecta cambios concurrentes', () => {
    const lineas = crearLineasConteo(productos, 'Principal')
    expect(validarConteoParaFinalizar({ almacen: 'Principal', estado: 'BORRADOR', lineas }).valido).toBe(false)
    expect(detectarCambiosConcurrentes(lineas, [{ ...productos[0], stock: 9 }, productos[1]])).toEqual(
      expect.arrayContaining([expect.objectContaining({ producto_id: 1, motivo: 'STOCK_MODIFICADO' })])
    )
  })

  it('genera ajustes solo para diferencias y controla los estados', () => {
    const lineas = crearLineasConteo(productos, 'Principal').map((linea, indice) =>
      recalcularLinea(linea, indice === 0 ? 10 : 6)
    )
    const ajustes = crearAjustes(lineas, { conteo_codigo: 'CF-1', usuario: 'Ana' })
    expect(ajustes).toHaveLength(1)
    expect(ajustes[0]).toMatchObject({ producto_id: 2, diferencia: 2, valor_ajuste: 100 })
    expect(siguienteEstado(ESTADOS_CONTEO.BORRADOR, 'procesar')).toBe(ESTADOS_CONTEO.EN_PROCESO)
    expect(siguienteEstado(ESTADOS_CONTEO.EN_PROCESO, 'finalizar')).toBe(ESTADOS_CONTEO.FINALIZADO)
  })
})
