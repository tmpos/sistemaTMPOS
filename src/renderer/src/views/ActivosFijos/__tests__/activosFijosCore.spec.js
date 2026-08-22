import { describe, expect, it } from 'vitest'
import {
  ESTADOS_ACTIVO,
  crearCalendarioDepreciacion,
  puedeRegistrarPeriodo,
  prepararAsientoDepreciacion,
  prepararBaja,
  resumenActivo,
  validarActivo,
  validarBaja
} from '../activosFijosCore.js'

const activo = {
  id: 7,
  codigo: 'AF-007',
  nombre: 'Computadora',
  categoria: 'Equipos',
  fecha_adquisicion: '2026-01-15',
  costo_adquisicion: 1200,
  valor_residual: 120,
  vida_util_meses: 12,
  metodo: 'LINEA_RECTA',
  estado: 'ACTIVO',
  cuenta_contable: 'Equipos de cómputo',
  cuenta_gasto_depreciacion: 'Gasto depreciación',
  cuenta_depreciacion_acumulada: 'Depreciación acumulada'
}

describe('activosFijosCore', () => {
  it('valida costo, residual y vida útil', () => {
    expect(validarActivo(activo).valido).toBe(true)
    expect(validarActivo({ ...activo, valor_residual: 1200 }).valido).toBe(false)
  })

  it('crea un calendario mensual de línea recta que termina en el residual', () => {
    const calendario = crearCalendarioDepreciacion(activo)
    expect(calendario).toHaveLength(12)
    expect(calendario[0]).toMatchObject({ periodo: '2026-01', monto: 90, valor_en_libros: 1110 })
    expect(calendario[11].valor_en_libros).toBe(120)
    expect(calendario.reduce((total, fila) => total + fila.monto, 0)).toBe(1080)
  })

  it('marca períodos registrados y calcula el valor neto desde los registros', () => {
    const depreciaciones = [{ id: 1, activo_id: 7, periodo: '2026-01', monto: 90, estado: 'REGISTRADA' }]
    expect(crearCalendarioDepreciacion(activo, depreciaciones)[0].estado).toBe('REGISTRADA')
    expect(resumenActivo(activo, depreciaciones)).toMatchObject({ depreciacionAcumulada: 90, valorEnLibros: 1110 })
  })

  it('evita duplicados, períodos futuros y saltos en el calendario', () => {
    const calendario = crearCalendarioDepreciacion(activo)
    expect(puedeRegistrarPeriodo(calendario[0], calendario, new Date(2026, 0, 31)).permitido).toBe(true)
    expect(puedeRegistrarPeriodo(calendario[1], calendario, new Date(2026, 1, 28)).permitido).toBe(false)
    expect(puedeRegistrarPeriodo({ ...calendario[0], estado: 'REGISTRADA' }, calendario).permitido).toBe(false)
    expect(puedeRegistrarPeriodo(calendario[0], calendario, new Date(2025, 11, 31)).permitido).toBe(false)
  })

  it('prepara un asiento balanceado de depreciación', () => {
    const asiento = prepararAsientoDepreciacion(activo, crearCalendarioDepreciacion(activo)[0])
    expect(asiento.total_debito).toBe(90)
    expect(asiento.total_credito).toBe(90)
    expect(asiento.movimientos[0]).toMatchObject({ debito: 'Gasto depreciación', credito: 'Depreciación acumulada' })
  })

  it('calcula y deja trazabilidad de una venta o baja', () => {
    const resumen = resumenActivo(activo, [{ activo_id: 7, monto: 180, estado: 'REGISTRADA' }])
    const baja = prepararBaja(activo, resumen, { tipo: ESTADOS_ACTIVO.VENDIDO, fecha: '2026-08-22', valor_venta: 1100, motivo: 'Renovación' })
    expect(validarBaja(activo, baja).valido).toBe(true)
    expect(baja.resultado).toBe(80)
    expect(baja.asiento.movimientos.some((m) => m.cuenta === 'GANANCIA EN VENTA DE ACTIVOS')).toBe(true)
  })
})
