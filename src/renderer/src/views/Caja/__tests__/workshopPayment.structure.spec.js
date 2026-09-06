import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const cajaSource = readFileSync(resolve(process.cwd(), 'src/renderer/src/views/Caja/Caja.vue'), 'utf8')
const mainSource = readFileSync(resolve(process.cwd(), 'src/main/index.js'), 'utf8')

describe('Caja: abono de taller', () => {
  it('utiliza un Dialog normal con todas las acciones de pago', () => {
    expect(cajaSource).toContain('v-model:visible="visibleAbonoTaller"')
    expect(cajaSource).toContain('header="Registrar abono de taller"')
    expect(cajaSource).toContain('label="Pagar completo"')
    expect(cajaSource).toContain('label="Abonar"')
    expect(cajaSource).toContain('@click="cancelarAbonoTaller"')
    expect(cajaSource).not.toContain('id="swal-input-abono"')
    expect(cajaSource).not.toContain("title: 'Abonar'")
  })

  it('valida el monto, el saldo y el banco antes de guardar', () => {
    expect(cajaSource).toContain('const procesarAbonoTaller = async (pagarCompleto = false) =>')
    expect(cajaSource).toContain('cantidadAbono > saldoTotal')
    expect(cajaSource).toContain("metodoPago === 'TRANSFERENCIA' && !cuentaBancaria.value?.id")
    expect(cajaSource).toContain("await peticionesFetchOffline('updateData', 'taller', JSON.stringify(orden))")
  })

  it('genera el comprobante con el mismo flujo de ImpresoraTaller usado por Taller.vue', () => {
    expect(cajaSource).toContain('orden.saldo = nuevoAbono.saldo')
    expect(cajaSource).toContain('ordenParaImprimir.value = { ...orden }')
    expect(cajaSource).toContain("formatoImpresion.value = '80mm'")
    expect(cajaSource).toContain('visibleImpresoraTaller.value = true')
    expect(cajaSource).not.toContain('`${link.value}/vista/tallertermica?factura=${orden.no_factura}`')
  })

  it('solo envía pageSize a Electron cuando tiene ancho y alto válidos', () => {
    expect(mainSource).toContain("typeof impresoraConfig === 'string'")
    expect(mainSource).toContain('impresoraConfig.pageSizeWidth ?? impresoraConfig.width')
    expect(mainSource).toContain('impresoraConfig.pageSizeHeight ?? impresoraConfig.height')
    expect(mainSource).toContain('if (pageSizeWidth > 0 && pageSizeHeight > 0)')
    expect(mainSource).toContain("console.error('Error preparando la impresión de la ventana:', error)")
  })
})
