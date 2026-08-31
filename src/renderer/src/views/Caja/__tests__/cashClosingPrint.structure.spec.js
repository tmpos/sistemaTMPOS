import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const cajaSource = readFileSync(resolve(process.cwd(), 'src/renderer/src/views/Caja/Caja.vue'), 'utf8')
const printerSource = readFileSync(resolve(process.cwd(), 'src/renderer/src/printer/cuadreCompleto.js'), 'utf8')
const mainSource = readFileSync(resolve(process.cwd(), 'src/main/index.js'), 'utf8')

describe('Impresión del cuadre de caja', () => {
  it('muestra el número de facturas del turno en los datos del usuario', () => {
    expect(cajaSource).toContain('Facturas del turno')
    expect(cajaSource).toContain('{{ cantidadFacturasTurno }}')
    expect(cajaSource).toContain('const cantidadFacturasTurno = ref(0)')
    expect(cajaSource).toContain('cantidadFacturasTurno.value = facturasTurno.length')
    expect(cajaSource).toContain('await fetchAndSetupDatosdelDia();')
  })

  it('envía las colecciones recién consultadas y nunca valores undefined', () => {
    expect(cajaSource).toContain('const datosCajaImpresion = {')
    expect(cajaSource).toContain('facturas: facturasFiltradas')
    expect(cajaSource).toContain('nDatosEmpresa.datoscaja = datosCajaImpresion')
  })

  it('normaliza todas las tablas antes de ejecutar filter', () => {
    expect(printerSource).toContain('const datosCajaRecibidos = datosLocalStorage.datoscaja || {}')
    expect(printerSource).toContain('facturas: asArray(datosCajaRecibidos.facturas)')
    expect(printerSource).toContain('cuentas_cobrar: asArray(datosCajaRecibidos.cuentas_cobrar)')
    expect(printerSource).toContain("jsonData['cuentas_cobrar']")
    expect(printerSource).not.toContain('const responseCxC = await peticionesFetch')
  })

  it('espera el resultado real y propaga errores de impresión a Caja', () => {
    expect(printerSource).toContain('return await new Promise((resolve, reject) => {')
    expect(printerSource).toContain('resolve({ printed: true')
    expect(mainSource).toContain('return { ok: true, result }')
    expect(mainSource).toContain("return { ok: false, error: error?.message || String(error) }")
    expect(cajaSource).toContain('if (!resultadoImpresion?.ok)')
    expect(cajaSource).toContain("summary: 'No se pudo imprimir el cuadre'")
  })
})
