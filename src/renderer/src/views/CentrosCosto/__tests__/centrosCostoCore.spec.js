import { describe, expect, it } from 'vitest'
import { construirComparativo, extraerEjecucion, filtrarComparativo, periodoDeFecha, resumirComparativo, validarCentro, validarPresupuesto } from '../centrosCostoCore.js'

const centros = [{ id: 1, codigo: 'CC-VTA', nombre: 'Ventas', tipo: 'DEPARTAMENTO', estado: 'ACTIVO' }, { id: 2, codigo: 'CC-PRY', nombre: 'Proyecto Norte', tipo: 'PROYECTO' }]
const asientos = [
  { id: 10, numero: 'A-10', fecha: '10-08-2026', usuario: 'Ana', asiento: JSON.stringify([{ cuenta: 'Publicidad', centro_costo: 'CC-VTA', categoria: 'Mercadeo', cantidadDebito: 700, cantidadCredito: 0 }]) },
  { id: 11, numero: 'A-11', fecha: '2026-08-15', centro_costo_id: 1, asiento: [{ debito: 'Publicidad', credito: 'Banco', cantidadDebito: 500, cantidadCredito: 500 }] },
  { id: 12, numero: 'A-12', fecha: '2026-07-01', asiento: [{ cuenta: 'Publicidad', centro_costo: 'CC-VTA', cantidadDebito: 999, cantidadCredito: 0 }] }
]
const presupuestos = [{ id: 1, centro_costo_id: 1, centro_codigo: 'CC-VTA', tipo_periodo: 'MENSUAL', periodo: '2026-08', cuenta: 'Publicidad', monto: 1000 }]

describe('centrosCostoCore', () => {
  it('normaliza períodos mensuales y anuales', () => {
    expect(periodoDeFecha('22-08-2026', 'MENSUAL')).toBe('2026-08')
    expect(periodoDeFecha('2026-08-22', 'ANUAL')).toBe('2026')
  })

  it('extrae ejecución solo cuando el asiento o línea tiene centro de costo', () => {
    const movimientos = extraerEjecucion(asientos, centros)
    expect(movimientos).toHaveLength(4)
    expect(movimientos.filter((item) => item.cuenta === 'Publicidad').map((item) => item.real)).toEqual([999, 700, 500])
  })

  it('compara presupuesto con ejecución real y detecta sobreejecución', () => {
    const [fila] = construirComparativo({ presupuestos, asientos, centros, tipoPeriodo: 'MENSUAL', periodo: '2026-08' })
    expect(fila).toMatchObject({ presupuesto: 1000, real: 1200, variacion: -200, porcentaje: 120, sobreejecutado: true })
    expect(fila.movimientos).toHaveLength(2)
  })

  it('agrupa partidas repetidas del mismo centro y cuenta', () => {
    const duplicados = [...presupuestos, { ...presupuestos[0], id: 2, monto: 500 }]
    const [fila] = construirComparativo({ presupuestos: duplicados, asientos, centros, tipoPeriodo: 'MENSUAL', periodo: '2026-08' })
    expect(fila.presupuesto).toBe(1500)
    expect(fila.sobreejecutado).toBe(false)
  })

  it('filtra alertas, centros y texto', () => {
    const filas = construirComparativo({ presupuestos, asientos, centros, tipoPeriodo: 'MENSUAL', periodo: '2026-08' })
    expect(filtrarComparativo(filas, { centro: 'CC-VTA', estado: 'SOBREEJECUTADO', buscar: 'publicidad' })).toHaveLength(1)
    expect(filtrarComparativo(filas, { estado: 'DENTRO' })).toHaveLength(0)
  })

  it('resume presupuesto, real, variación y alertas', () => {
    const filas = construirComparativo({ presupuestos, asientos, centros, tipoPeriodo: 'MENSUAL', periodo: '2026-08' })
    expect(resumirComparativo(filas)).toMatchObject({ partidas: 1, presupuesto: 1000, real: 1200, variacion: -200, porcentaje: 120, alertas: 1 })
  })

  it('valida centros duplicados y presupuestos incompletos', () => {
    expect(validarCentro({ codigo: 'CC-VTA', nombre: 'Otro', tipo: 'PROYECTO' }, centros).valido).toBe(false)
    expect(validarCentro({ codigo: 'CC-ADM', nombre: 'Administración', tipo: 'DEPARTAMENTO' }, centros).valido).toBe(true)
    expect(validarPresupuesto({ centro_costo_id: 1, tipo_periodo: 'MENSUAL', periodo: '2026-08', cuenta: 'Gastos', monto: 100 }).valido).toBe(true)
    expect(validarPresupuesto({ periodo: '2026-08', monto: 0 }).valido).toBe(false)
  })
})
