import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { compileScript, compileTemplate, parse } from '@vue/compiler-sfc'
import { describe, expect, it } from 'vitest'

const venderPath = resolve(process.cwd(), 'src/renderer/src/views/Vender.vue')
const source = readFileSync(venderPath, 'utf8')
const parsed = parse(source, { filename: venderPath })

describe('Vender.vue: contrato estructural del componente completo', () => {
  it('es un componente Vue válido con template y script setup', () => {
    expect(parsed.errors).toEqual([])
    expect(parsed.descriptor.template).not.toBeNull()
    expect(parsed.descriptor.scriptSetup).not.toBeNull()
  })

  it('compila el script y el template sin errores de sintaxis', () => {
    const script = compileScript(parsed.descriptor, { id: 'vender-test' })
    const template = compileTemplate({
      id: 'vender-test',
      filename: venderPath,
      source: parsed.descriptor.template.content,
      scoped: parsed.descriptor.styles.some((style) => style.scoped)
    })
    expect(script.content.length).toBeGreaterThan(0)
    expect(template.errors).toEqual([])
    expect(template.code.length).toBeGreaterThan(0)
  })

  it.each([
    'venta',
    'pos',
    'pedidosPendientes',
    'documentos',
    'clientes',
    'delivery',
    'taller',
    'configuracion',
    'ai',
    'pruebas'
  ])('mantiene disponible la pestaña %s', (tab) => {
    expect(source).toContain(`tabVentaActiva === '${tab}'`)
  })

  it('integra el asistente AI dentro de Vender y conserva el acceso de menú', () => {
    expect(source).toContain("import AiAsistente from '@/views/AiAsistente/AiAsistente.vue'")
    expect(source).toContain('<AiAsistente />')
    expect(source).toContain("tabVentaActiva === 'ai'")
  })

  it('integra el ejecutor de pruebas dentro de Vender', () => {
    expect(source).toContain("import PruebasVender from '@/components/vender/PruebasVender.vue'")
    expect(source).toContain('<PruebasVender />')
    expect(source).toContain("tabVentaActiva === 'pruebas'")
  })

  it('usa las funciones reales y comprobables del núcleo de ventas', () => {
    expect(source).toContain("from '@/views/Vender/venderCore.js'")
    expect(source).toContain('calculateSaleSummary(')
    expect(source).toContain('filterPosProducts(')
    expect(source).toContain('distributeSurcharge(')
    expect(source).toContain('createTemporaryClient(')
  })

  it('conserva los flujos principales de venta, cobro, factura y cotización', () => {
    expect(source).toContain('productosVenta')
    expect(source).toContain('calcularTotalFactura')
    expect(source).toContain('metodoPago')
    expect(source).toContain('facturaNueva')
    expect(source).toContain('cotizacionNueva')
    expect(source).toContain('restarStock')
  })
})
