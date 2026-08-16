import { describe, expect, it } from 'vitest'
import { runVenderDiagnostics } from '../venderDiagnostics.js'

describe('Vender: diagnóstico integrado para la aplicación instalada', () => {
  it('ejecuta todas las comprobaciones críticas correctamente', () => {
    const result = runVenderDiagnostics()
    expect(result.success).toBe(true)
    expect(result.failed).toBe(0)
    expect(result.passed).toBe(result.total)
    expect(result.total).toBeGreaterThanOrEqual(14)
    expect(result.output).toContain('pruebas aprobadas')
  })
})
