import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const loginSource = readFileSync(resolve(process.cwd(), 'src/renderer/src/views/pages/auth/Login.vue'), 'utf8')

describe('Login: selector de configuración inicial', () => {
  it('utiliza un Dialog normal para las tres opciones', () => {
    expect(loginSource).toContain('v-model:visible="visibleOpcionesEmpresa"')
    expect(loginSource).toContain('@click="seleccionarAgregarLicencia"')
    expect(loginSource).toContain('@click="seleccionarRegistrarEmpresa"')
    expect(loginSource).toContain('@click="seleccionarProbarDemo"')
    expect(loginSource).not.toContain("title: 'Elija una opción'")
  })

  it('conserva el destino de licencia, registro y demo', () => {
    expect(loginSource).toContain('visibleAgregarLicencia.value = true')
    expect(loginSource).toContain('registroEmpresa.value = true')
    expect(loginSource).toContain("console.log('Usuario eligió probar demo')")
  })

  it('solicita la cantidad inicial con un Dialog normal', () => {
    expect(loginSource).toContain('v-model:visible="visibleCantidadInicial"')
    expect(loginSource).toContain('id="cantidadInicialCaja"')
    expect(loginSource).toContain('@click="confirmarCantidadInicial"')
    expect(loginSource).toContain('const confirmarCantidadInicial = async () =>')
    expect(loginSource).not.toContain("title: 'Cantidad Inicial'")
  })
})
