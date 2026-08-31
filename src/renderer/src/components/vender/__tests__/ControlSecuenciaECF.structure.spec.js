import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { compileScript, compileTemplate, parse } from '@vue/compiler-sfc'
import { describe, expect, it } from 'vitest'

const componentPath = resolve(
  process.cwd(),
  'src/renderer/src/components/vender/ControlSecuenciaECF.vue'
)
const source = readFileSync(componentPath, 'utf8')
const parsed = parse(source, { filename: componentPath })

describe('ControlSecuenciaECF.vue', () => {
  it('compila como componente Vue', () => {
    expect(parsed.errors).toEqual([])
    const script = compileScript(parsed.descriptor, { id: 'control-secuencia-ecf-test' })
    const template = compileTemplate({
      id: 'control-secuencia-ecf-test',
      filename: componentPath,
      source: parsed.descriptor.template.content
    })
    expect(script.content.length).toBeGreaterThan(0)
    expect(template.errors).toEqual([])
  })

  it('crea y administra la tabla central de reservas', () => {
    expect(source).toContain("const TABLA_RESERVAS_ECF = 'reservas_comprobantes_electronicos'")
    expect(source).toContain('crearTablaSiNoExisteOffline(')
    expect(source).toContain('reservarSecuencia')
    expect(source).toContain('obtenerSiguienteDisponible')
    expect(source).toContain('marcarEmitida')
    expect(source).toContain('puedeRecuperarDocumento')
  })
})
