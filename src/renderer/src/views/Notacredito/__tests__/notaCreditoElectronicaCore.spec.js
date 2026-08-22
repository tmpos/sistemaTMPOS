import { describe, expect, it } from 'vitest'
import {
  buildElectronicCreditNotePayload,
  calculateCreditNoteIndicator,
  calculateCreditNoteTotals,
  createCreditNoteLines,
  formatElectronicSequence,
  getElectronicInvoiceNumber,
  getInvoiceReferenceDate,
  getElectronicCompanyId,
  getElectronicDocumentId,
  getElectronicSenderIdentification,
  isAcceptedElectronicInvoice,
  normalizeReferenceDate
} from '../notaCreditoElectronicaCore.js'

const invoice = {
  comprobante: 'E320000000009',
  fecha_emision: '21-08-2026',
  otro: JSON.stringify([{ legalStatus: 'ACCEPTED' }])
}

describe('Nota de Crédito Electrónica E34', () => {
  it('reconoce únicamente facturas electrónicas aceptadas', () => {
    expect(isAcceptedElectronicInvoice(invoice)).toBe(true)
    expect(isAcceptedElectronicInvoice({ ...invoice, comprobante: 'B0200000001' })).toBe(false)
    expect(
      isAcceptedElectronicInvoice({ ...invoice, otro: JSON.stringify([{ legalStatus: 'REJECTED' }]) })
    ).toBe(false)
  })

  it('genera el e-NCF E34 con diez dígitos de secuencia', () => {
    expect(formatElectronicSequence('E34', 9)).toBe('E340000000009')
  })

  it('recupera facturas E31 antiguas desde la respuesta de Alanube guardada', () => {
    const legacyE31 = {
      comprobante: 'B0100000001',
      otro: JSON.stringify([
        {
          alanubeResponse: {
            documentNumber: 'E310000000002',
            legalStatus: 'ACCEPTED',
            governmentResponse: { code: 1 }
          }
        }
      ])
    }

    expect(getElectronicInvoiceNumber(legacyE31)).toBe('E310000000002')
    expect(isAcceptedElectronicInvoice(legacyE31)).toBe(true)
  })

  it('incluye E31 emitidas antes de guardar el estado legal', () => {
    expect(isAcceptedElectronicInvoice({ comprobante: 'E310000000003', otro: '[]' })).toBe(true)
  })

  it('recupera el RNC emisor reconocido por Alanube en la factura original', () => {
    expect(
      getElectronicSenderIdentification({
        otro: JSON.stringify([{ companyIdentification: '131-19690-1' }])
      })
    ).toBe('131196901')
    expect(
      getElectronicSenderIdentification({
        otro: JSON.stringify([
          {
            documentStampUrl:
              'https://fc.dgii.gov.do/ecf/ConsultaTimbreFC?RncEmisor=131196901&ENCF=E320000000001'
          }
        ])
      })
    ).toBe('131196901')
  })

  it('recupera la compania Alanube desde las URLs del documento original', () => {
    expect(
      getElectronicCompanyId({
        otro: JSON.stringify([
          {
            pdf: 'https://files.example/users/u/companies/01KY2R8CB3D5SPMX0WZBP6TC70/invoice/doc.pdf'
          }
        ])
      })
    ).toBe('01KY2R8CB3D5SPMX0WZBP6TC70')
  })

  it('prioriza el numero oficial y recupera el ID de Alanube', () => {
    const storedInvoice = {
      comprobante: 'E320000000001',
      otro: JSON.stringify([
        {
          documentNumber: 'E320000000010',
          id: '01M0JKNV36S0K784TNZ6TG048J'
        }
      ])
    }
    expect(getElectronicInvoiceNumber(storedInvoice)).toBe('E320000000010')
    expect(getElectronicDocumentId(storedInvoice)).toBe('01M0JKNV36S0K784TNZ6TG048J')
  })

  it('normaliza la fecha de la factura referenciada', () => {
    expect(normalizeReferenceDate('21-08-2026')).toBe('2026-08-21')
    expect(normalizeReferenceDate('2026/08/21 12:00:00')).toBe('2026-08-21')
    expect(getInvoiceReferenceDate({ fecha_emision: '21/08/2026' })).toBe('2026-08-21')
  })

  it('calcula el indicador de nota de credito segun los 30 dias de DGII', () => {
    expect(calculateCreditNoteIndicator('2026-08-01', '2026-08-21')).toBe(0)
    expect(calculateCreditNoteIndicator('2026-07-22', '2026-08-21')).toBe(0)
    expect(calculateCreditNoteIndicator('2026-07-21', '2026-08-21')).toBe(1)
  })

  it('calcula líneas y totales gravados sin NaN', () => {
    const lines = createCreditNoteLines([
      { nombre: 'Producto', cantidad: 2, cantidadCredito: 1, precio_venta: 118, impuestos: 18 }
    ])
    expect(lines[0]).toMatchObject({ billingIndicator: 1, unitPriceItem: 100, itemAmount: 100 })
    expect(calculateCreditNoteTotals(lines)).toEqual({
      totalAmount: 118,
      totalTaxedAmount: 100,
      i1AmountTaxed: 100,
      itbisS1: 18,
      itbis1Total: 18,
      itbisTotal: 18
    })
  })

  it('construye informationReference conforme al contrato de Alanube', () => {
    const payload = buildElectronicCreditNotePayload({
      encf: 'E340000000001',
      company: { id: '01KY2R8CB3D5SPMX0WZBP6TC70' },
      sender: { rnc: '131196901', companyName: 'Empresa', stampDate: '2026-08-21' },
      buyer: { rnc: '133023539', companyName: 'Cliente' },
      referencedInvoice: invoice,
      modificationCode: 3,
      reason: 'Devolución parcial',
      products: [
        { nombre: 'Producto', cantidad: 1, cantidadCredito: 1, precio_venta: 118, impuestos: 18 }
      ]
    })

    expect(payload.idDoc.encf).toBe('E340000000001')
    expect(payload.company).toEqual({ id: '01KY2R8CB3D5SPMX0WZBP6TC70' })
    expect(payload.idDoc.creditNoteIndicator).toBe(0)
    expect(payload.informationReference).toEqual({
      modificationCode: 3,
      ncfModified: 'E320000000009',
      ncfModifiedDate: '2026-08-21',
      reasonForModification: 'Devolución parcial'
    })
    expect(payload.totals.totalAmount).toBe(118)
  })

  it('crea correcciones de texto con total cero', () => {
    const lines = createCreditNoteLines([], 2)
    expect(lines).toHaveLength(1)
    expect(calculateCreditNoteTotals(lines).totalAmount).toBe(0)
  })
})
