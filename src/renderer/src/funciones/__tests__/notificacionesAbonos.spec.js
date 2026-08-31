import { describe, expect, it } from 'vitest'
import {
  buildPaymentEmail,
  isPaymentEmailEnabled,
  parsePaymentEmailSetting
} from '../notificacionesAbonos.js'

describe('notificaciones de abonos', () => {
  it('interpreta los valores guardados por los interruptores', () => {
    expect(parsePaymentEmailSetting(true)).toBe(true)
    expect(parsePaymentEmailSetting('true')).toBe(true)
    expect(parsePaymentEmailSetting('1')).toBe(true)
    expect(parsePaymentEmailSetting(false)).toBe(false)
    expect(parsePaymentEmailSetting('false')).toBe(false)
  })

  it('mantiene independientes las preferencias de CxC y Taller', () => {
    const configuration = {
      notificar_abonos_cxc: 'true',
      notificar_abonos_taller: 'false'
    }

    expect(isPaymentEmailEnabled(configuration, 'cxc')).toBe(true)
    expect(isPaymentEmailEnabled(configuration, 'taller')).toBe(false)
  })

  it('construye el correo con los datos del abono y escapa el cliente', () => {
    const email = buildPaymentEmail({
      type: 'taller',
      reference: 'OT-25',
      client: '<Cliente>',
      amount: 1250,
      balance: 300,
      method: 'EFECTIVO',
      cashier: 'Caja 1',
      date: '2026-08-26',
      time: '10:30',
      companyName: 'TM POS SRL'
    })

    expect(email.subject).toContain('OT-25')
    expect(email.html).toContain('1,250.00')
    expect(email.html).toContain('300.00')
    expect(email.html).toContain('&lt;Cliente&gt;')
    expect(email.html).not.toContain('<Cliente>')
  })
})
