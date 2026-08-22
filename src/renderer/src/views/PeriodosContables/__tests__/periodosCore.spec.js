import { describe, expect, it } from 'vitest'
import {
  asegurarPeriodoAbierto, calcularBalancePeriodo, comprobarFechaContable, crearRegistroCierre,
  crearRegistroReapertura, estaFechaBloqueada, generarPeriodos, periodoDeFecha,
  periodosVigentes, validarCierrePeriodo
} from '../periodosCore.js'

const asientos = [
  { id: 1, fecha: '05-08-2026', asiento: JSON.stringify([{ cuenta: 'Caja', cantidadDebito: '1,000.00', cantidadCredito: 0 }, { cuenta: 'Ventas', cantidadDebito: 0, cantidadCredito: 1000 }]) },
  { id: 2, fecha: '2026-08-10', asiento: [{ debito: 'Banco', credito: 'Caja', cantidadDebito: 250, cantidadCredito: 250 }] },
  { id: 3, fecha: '2026-07-31', asiento: [{ cantidadDebito: 99, cantidadCredito: 99 }] }
]

describe('periodosCore', () => {
  it('normaliza fechas dominicanas e ISO al período mensual', () => {
    expect(periodoDeFecha('21-08-2026')).toBe('2026-08')
    expect(periodoDeFecha('2026-07-01')).toBe('2026-07')
    expect(periodoDeFecha('fecha mala')).toBe('')
  })

  it('suma débitos y créditos del período sin incluir otros meses', () => {
    expect(calcularBalancePeriodo(asientos, '2026-08')).toMatchObject({ asientos: 2, lineas: 3, totalDebito: 1250, totalCredito: 1250, diferencia: 0 })
  })

  it('impide cerrar períodos vacíos, inválidos o descuadrados', () => {
    expect(validarCierrePeriodo([], '2026-08').valido).toBe(false)
    const descuadrado = [{ fecha: '2026-08-01', asiento: [{ cantidadDebito: 100, cantidadCredito: 90 }] }]
    expect(validarCierrePeriodo(descuadrado, '2026-08')).toMatchObject({ valido: false, diferencia: 10 })
    expect(validarCierrePeriodo(asientos, '2026-08').valido).toBe(true)
  })

  it('conserva el registro vigente más reciente por período', () => {
    const registros = [
      { id: 1, periodo: '2026-08', estado: 'CERRADO', updated_at: '2026-08-20T10:00:00Z' },
      { id: 2, periodo: '2026-08', estado: 'ABIERTO', updated_at: '2026-08-21T10:00:00Z' }
    ]
    expect(periodosVigentes(registros)).toHaveLength(1)
    expect(periodosVigentes(registros)[0].estado).toBe('ABIERTO')
  })

  it('expone comprobación reutilizable y lanza un error identificable al bloquear', () => {
    const registros = [{ periodo: '2026-08', estado: 'CERRADO' }]
    expect(estaFechaBloqueada('2026-08-22', registros)).toBe(true)
    expect(comprobarFechaContable('2026-07-31', registros).bloqueada).toBe(false)
    expect(() => asegurarPeriodoAbierto('2026-08-01', registros)).toThrowError(expect.objectContaining({ code: 'PERIODO_CONTABLE_CERRADO' }))
  })

  it('crea auditoría de cierre y exige motivo para reapertura', () => {
    const ahora = new Date('2026-08-22T12:00:00Z')
    const cerrado = crearRegistroCierre({ periodo: '2026-08', balance: { totalDebito: 50, totalCredito: 50, diferencia: 0, asientos: 1 }, usuario: 'Ana', autorizador: 'Supervisor', ahora })
    expect(cerrado).toMatchObject({ estado: 'CERRADO', usuario_cierre: 'Ana', autorizador: 'Supervisor', total_debito: '50.00' })
    expect(() => crearRegistroReapertura({ registro: cerrado, motivo: 'corto', usuario: 'Luis' })).toThrow()
    expect(crearRegistroReapertura({ registro: cerrado, motivo: 'Corrección de asiento 25', usuario: 'Luis', ahora })).toMatchObject({ estado: 'ABIERTO', usuario_reapertura: 'Luis', motivo_reapertura: 'Corrección de asiento 25' })
  })

  it('genera meses recientes y también períodos existentes en los asientos', () => {
    const periodos = generarPeriodos(asientos, [], new Date(2026, 7, 22), 2)
    expect(periodos).toEqual(expect.arrayContaining(['2026-08', '2026-07']))
  })
})
