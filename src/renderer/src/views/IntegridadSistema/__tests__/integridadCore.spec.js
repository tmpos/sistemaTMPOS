import { describe, expect, it } from 'vitest'
import { ejecutarDiagnostico, revisarAsientos, revisarFacturacionElectronica } from '../integridadCore'

describe('centro de integridad', () => {
  it('detecta asientos inválidos y descuadrados', () => {
    const rows = revisarAsientos([{ numero: '1', asiento: 'no-json' }, { numero: '2', asiento: '[{"cantidadDebito":100,"cantidadCredito":90}]' }])
    expect(rows.map((row) => row.codigo)).toEqual(['ASIENTO_JSON', 'ASIENTO_DESCUADRADO'])
  })
  it('detecta electrónicos duplicados, rechazados e incompletos', () => {
    const rows = revisarFacturacionElectronica([{ document_number: 'E1', status: 'REGISTERED' }, { document_number: 'E1', status: 'REJECTED' }])
    expect(rows.map((row) => row.codigo)).toEqual(expect.arrayContaining(['ECF_INCOMPLETO', 'ENCF_DUPLICADO', 'ECF_RECHAZADO']))
  })
  it('ejecuta todas las reglas sin modificar datos', () => {
    const input = { productos: [{ id: 1, stock: -2 }], bancos: [{ id: 2, saldo: -5 }], asientos: [], cxc: [], cxp: [], facturas: [], compras: [], logsElectronicos: [] }
    const snapshot = JSON.stringify(input)
    expect(ejecutarDiagnostico(input)).toHaveLength(2)
    expect(JSON.stringify(input)).toBe(snapshot)
  })
})
