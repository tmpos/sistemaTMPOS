import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { compileTemplate, parse } from '@vue/compiler-sfc'
import { describe, expect, it } from 'vitest'

const filePath = resolve(process.cwd(), 'src/renderer/src/views/CajaChica/CajaChica.vue')
const source = readFileSync(filePath, 'utf8')
const parsed = parse(source, { filename: filePath })
const modalCompra = source.slice(
  source.indexOf('<!-- Dialog: Nueva Compra -->'),
  source.indexOf('<!-- Dialog: Pago Gasto Fijo -->')
)

describe('CajaChica: modal Nueva Compra Menor', () => {
  it('mantiene un template Vue válido', () => {
    expect(parsed.errors).toEqual([])
    const template = compileTemplate({
      id: 'caja-chica-test',
      filename: filePath,
      source: parsed.descriptor.template.content,
      scoped: true
    })
    expect(template.errors).toEqual([])
  })

  it('selecciona el proveedor desde la tabla de proveedores', () => {
    expect(modalCompra).toContain('v-model="nuevaCompra.proveedor"')
    expect(modalCompra).toContain(':options="proveedores"')
    expect(modalCompra).toContain('optionLabel="nombre"')
    expect(modalCompra).toContain('optionValue="nombre"')
    expect(modalCompra).toContain('placeholder="Seleccione un proveedor"')
    expect(modalCompra).toContain('filter')
  })

  it('permite crear un proveedor sin salir de la compra', () => {
    expect(modalCompra).toContain('label="Agregar proveedor"')
    expect(modalCompra).toContain('@click="abrirNuevoProveedorCompra"')
    expect(modalCompra).toContain('v-model:visible="visibleNuevoProveedorCompra"')
    expect(modalCompra).toContain('label="Guardar proveedor"')
    expect(source).toContain("peticionesFetchOffline('insertData', 'proveedores'")
    expect(source).toContain('nuevaCompra.value.proveedor = nombre')
  })

  it('declara fluid en todos los campos de la modal', () => {
    const controles = [...modalCompra.matchAll(/<(InputText|InputNumber|Dropdown|Textarea)\b[^>]*>/gs)]
    expect(controles.length).toBeGreaterThanOrEqual(8)
    controles.forEach(([control]) => expect(control).toMatch(/\sfluid(?:\s|\/|>)/))
  })
})
