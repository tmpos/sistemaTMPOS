import { peticionesFetchOffline } from './funciones.js'

export const PAYMENT_EMAIL_FIELDS = {
  cxc: 'notificar_abonos_cxc',
  taller: 'notificar_abonos_taller'
}

export const parsePaymentEmailSetting = (value) =>
  value === true || value === 1 || ['1', 'true', 'si', 'sí', 'on'].includes(String(value || '').trim().toLowerCase())

export const isPaymentEmailEnabled = (configuration = {}, type = '') => {
  const field = PAYMENT_EMAIL_FIELDS[String(type || '').trim().toLowerCase()]
  return Boolean(field && parsePaymentEmailSetting(configuration?.[field]))
}

const escapeHtml = (value) =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')

const formatMoney = (value) => {
  const amount = Number(value)
  return Number.isFinite(amount)
    ? new Intl.NumberFormat('es-DO', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount)
    : '0.00'
}

export const buildPaymentEmail = ({
  type,
  reference,
  client,
  amount,
  balance,
  method,
  cashier,
  date,
  time,
  source,
  companyName
}) => {
  const isWorkshop = String(type || '').toLowerCase() === 'taller'
  const documentLabel = isWorkshop ? 'Orden de taller' : 'Factura'
  const areaLabel = isWorkshop ? 'Taller' : 'Cuenta por cobrar'
  const safeReference = escapeHtml(reference || 'Sin referencia')
  const safeCompany = escapeHtml(companyName || 'Empresa')

  return {
    subject: `Abono registrado - ${documentLabel} #${reference || 'S/N'}`,
    text: `Se registró un abono de RD$ ${formatMoney(amount)} a ${documentLabel.toLowerCase()} #${reference || 'S/N'}. Saldo pendiente: RD$ ${formatMoney(balance)}.`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:680px;margin:auto;color:#1f2937;">
        <div style="background:#0f766e;color:white;padding:18px 22px;border-radius:10px 10px 0 0;">
          <h2 style="margin:0;">Abono registrado</h2>
          <p style="margin:6px 0 0;">${safeCompany}</p>
        </div>
        <div style="border:1px solid #d1d5db;border-top:0;padding:22px;border-radius:0 0 10px 10px;">
          <p>Se registró un nuevo abono en <strong>${areaLabel}</strong>.</p>
          <table style="width:100%;border-collapse:collapse;">
            <tr><td style="padding:7px;border-bottom:1px solid #e5e7eb;"><strong>${documentLabel}</strong></td><td style="padding:7px;border-bottom:1px solid #e5e7eb;">#${safeReference}</td></tr>
            <tr><td style="padding:7px;border-bottom:1px solid #e5e7eb;"><strong>Cliente</strong></td><td style="padding:7px;border-bottom:1px solid #e5e7eb;">${escapeHtml(client || 'Sin registrar')}</td></tr>
            <tr><td style="padding:7px;border-bottom:1px solid #e5e7eb;"><strong>Monto abonado</strong></td><td style="padding:7px;border-bottom:1px solid #e5e7eb;"><strong>RD$ ${formatMoney(amount)}</strong></td></tr>
            <tr><td style="padding:7px;border-bottom:1px solid #e5e7eb;"><strong>Saldo pendiente</strong></td><td style="padding:7px;border-bottom:1px solid #e5e7eb;">RD$ ${formatMoney(balance)}</td></tr>
            <tr><td style="padding:7px;border-bottom:1px solid #e5e7eb;"><strong>Método</strong></td><td style="padding:7px;border-bottom:1px solid #e5e7eb;">${escapeHtml(method || 'No indicado')}</td></tr>
            <tr><td style="padding:7px;border-bottom:1px solid #e5e7eb;"><strong>Registrado por</strong></td><td style="padding:7px;border-bottom:1px solid #e5e7eb;">${escapeHtml(cashier || 'Sistema')}</td></tr>
            <tr><td style="padding:7px;border-bottom:1px solid #e5e7eb;"><strong>Origen</strong></td><td style="padding:7px;border-bottom:1px solid #e5e7eb;">${escapeHtml(source || areaLabel)}</td></tr>
            <tr><td style="padding:7px;"><strong>Fecha</strong></td><td style="padding:7px;">${escapeHtml(date || '')} ${escapeHtml(time || '')}</td></tr>
          </table>
        </div>
      </div>`
  }
}

export const notifyCompanyPayment = async (payment = {}) => {
  try {
    if (!window.electron?.ipcRenderer) return { ok: false, skipped: true, reason: 'electron-no-disponible' }

    const emailConfiguration = await peticionesFetchOffline(
      'getDataByField',
      'configuracion_correo',
      'id',
      1
    )
    if (!emailConfiguration || !isPaymentEmailEnabled(emailConfiguration, payment.type)) {
      return { ok: false, skipped: true, reason: 'notificacion-desactivada' }
    }

    const recipient = String(payment?.company?.email || emailConfiguration.email || '').trim()
    if (!recipient) return { ok: false, skipped: true, reason: 'empresa-sin-correo' }

    const content = buildPaymentEmail({
      ...payment,
      companyName: payment?.company?.nombre
    })
    const result = await window.electron.ipcRenderer.invoke('enviarCorreo', {
      mailto: recipient,
      subjet: content.subject,
      mensaje: content.text,
      albody: content.html,
      correo: emailConfiguration,
      empresa: payment?.company?.nombre || 'Sistema'
    })

    if (!result?.ok) console.error('No se pudo enviar el correo del abono:', result?.error)
    return result || { ok: false }
  } catch (error) {
    console.error('Error preparando el correo del abono:', error)
    return { ok: false, error: error?.message || String(error) }
  }
}
