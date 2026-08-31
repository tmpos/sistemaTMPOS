import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const loginPath = resolve(process.cwd(), 'src/renderer/src/views/pages/auth/Login.vue')
const loginSource = readFileSync(loginPath, 'utf8')

describe('Login: sesiones de caja abiertas', () => {
  it('usa un Dialog normal en lugar del selector SweetAlert', () => {
    expect(loginSource).toContain('v-model:visible="visibleSesionesAbiertas"')
    expect(loginSource).toContain('Sesiones abiertas')
    expect(loginSource).not.toContain("title: 'Sesiones abiertas detectadas'")
  })

  it('conserva continuar, cerrar sesiones y cancelar', () => {
    expect(loginSource).toContain('@click="continuarSesionAbierta"')
    expect(loginSource).toContain('@click="cerrarSesionesDesdeModal"')
    expect(loginSource).toContain('@click="cancelarSesionesAbiertas"')
    expect(loginSource).toContain("await navegarDesdeLogin('/caja')")
    expect(loginSource).toContain('await cerrarSesionesAbiertasCajero(sesionesAbiertasDetectadas.value)')
  })

  it('selecciona Continuar por defecto al abrir la modal', () => {
    expect(loginSource).toContain('ref="continuarSesionButton"')
    expect(loginSource).toContain('autofocus')
    expect(loginSource).toContain('botonContinuar?.focus?.()')
  })
})
