import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const layoutSource = readFileSync(
  resolve(process.cwd(), 'src/renderer/src/layout/composables/layout.js'),
  'utf8'
)
const configSource = readFileSync(
  resolve(process.cwd(), 'src/renderer/src/views/Sistema/Configuracion.vue'),
  'utf8'
)
const glassCss = readFileSync(
  resolve(process.cwd(), 'src/renderer/src/assets/glass-theme.scss'),
  'utf8'
)
const stylesSource = readFileSync(
  resolve(process.cwd(), 'src/renderer/src/assets/styles.scss'),
  'utf8'
)

describe('Tema definido Glass', () => {
  it('ofrece y persiste el preset Glass desde Configuracion', () => {
    expect(configSource).toContain('Temas definidos')
    expect(configSource).toContain('aplicarTemaDefinido(\'glass\')')
    expect(configSource).toContain('GLASS_CUSTOM_THEME')
    expect(configSource).toContain("glass: GLASS_CUSTOM_THEME")
  })

  it('activa una clase global diferenciada al aplicar el tema', () => {
    expect(layoutSource).toContain("themeStyle: 'glass'")
    expect(layoutSource).toContain("root.classList.toggle('theme-glass', themeStyle === 'glass')")
    expect(layoutSource).toContain('root.dataset.appThemeStyle = themeStyle')
  })

  it('incluye superficies de vidrio y variantes clara y oscura', () => {
    expect(stylesSource).toContain("@use './glass-theme.scss';")
    expect(glassCss).toContain('html.theme-glass')
    expect(glassCss).toContain('backdrop-filter: var(--glass-blur)')
    expect(glassCss).toContain('html.theme-glass.app-dark')
    expect(glassCss).toContain('.p-dialog')
    expect(glassCss).toContain('.p-datatable')
    expect(glassCss).toContain('html.theme-glass .p-button')
    expect(glassCss).toContain('.p-button-outlined')
    expect(glassCss).toContain('.p-button-success')
    expect(glassCss).toContain('backdrop-filter: blur(14px) saturate(155%)')
  })
})
