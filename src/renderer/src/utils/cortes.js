// utils/emailTemplates.js

/**
 * Genera el HTML para el reporte de caja con encabezado, totales y tablas de ventas, gastos,
 * cuentas por cobrar y taller.
 *
 * @param {Object} header - Datos del encabezado
 * @param {Object} totales - Totales de caja
 * @param {Array} ventas - Array con movimientos de ventas
 * @param {Array} gastos - Array con movimientos de gastos
 * @param {Array} cuentasCobrar - Array de cuentas por cobrar
 * @param {Array} taller - Array de ordenes de taller
 * @returns {string} HTML listo para enviar
 */
export function generarHTMLReporteCaja(
  header,
  totales,
  ventas = [],
  gastos = [],
  cuentasCobrar = [],
  taller = []
) {
  const {
    empresa = 'Mi Empresa',
    fecha_inicio = '',
    fecha_final = '',
    usuario = '',
    observacion = '',
    efectivo_inicial = 0,
    efectivo_final = 0
  } = header || {}

  const {
    ingreso_total = 0,
    egreso_total = 0,
    ingreso_efectivo = 0,
    ingreso_tarjeta = 0,
    ingreso_transferencia = 0
  } = totales || {}

  const escapeHtml = (value) => {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;')
  }

  const safe = (value, fallback = '-') => {
    const normalized = value === null || value === undefined || value === '' ? fallback : value
    return escapeHtml(normalized)
  }

  const badgeStyle = (tipo) => {
    const esIngreso = String(tipo || '').toLowerCase() === 'ingreso'
    return esIngreso
      ? 'background:#dcfce7;color:#166534;border:1px solid #bbf7d0;'
      : 'background:#fee2e2;color:#991b1b;border:1px solid #fecaca;'
  }

  const emptyRow = (cols, label) => `
    <tr>
      <td colspan="${cols}" style="padding:18px;text-align:center;color:#64748b;background:#f8fafc;border:1px solid #e2e8f0;">
        ${label}
      </td>
    </tr>
  `

  const generarFilasMovimientos = (array) =>
    array
      .map(
        (c) => `
          <tr>
            <td style="padding:10px;border-bottom:1px solid #e2e8f0;color:#0f172a;">${safe(c.concepto)}</td>
            <td style="padding:10px;border-bottom:1px solid #e2e8f0;color:#475569;white-space:nowrap;">${safe(c.fecha)}</td>
            <td style="padding:10px;border-bottom:1px solid #e2e8f0;color:#475569;white-space:nowrap;">${safe(c.hora)}</td>
            <td style="padding:10px;border-bottom:1px solid #e2e8f0;color:#475569;">${safe(c.usuario || c.cliente)}</td>
            <td style="padding:10px;border-bottom:1px solid #e2e8f0;">
              <span style="display:inline-block;padding:4px 8px;border-radius:999px;font-size:12px;font-weight:700;${badgeStyle(c.tipo)}">${safe(c.tipo)}</span>
            </td>
            <td style="padding:10px;border-bottom:1px solid #e2e8f0;color:#475569;">${safe(c.tipo_pago)}</td>
            <td style="padding:10px;border-bottom:1px solid #e2e8f0;text-align:right;font-weight:800;color:${String(c.tipo || '').toLowerCase() === 'ingreso' ? '#166534' : '#991b1b'};">
              ${safe(c.total, '0.00')}
            </td>
          </tr>
        `
      )
      .join('')

  const generarFilasCxc = (array) =>
    array
      .map(
        (c) => `
          <tr>
            <td style="padding:10px;border-bottom:1px solid #e2e8f0;color:#0f172a;">${safe(c.concepto)}</td>
            <td style="padding:10px;border-bottom:1px solid #e2e8f0;color:#475569;white-space:nowrap;">${safe(c.fecha)}</td>
            <td style="padding:10px;border-bottom:1px solid #e2e8f0;color:#475569;white-space:nowrap;">${safe(c.hora)}</td>
            <td style="padding:10px;border-bottom:1px solid #e2e8f0;text-align:right;color:#166534;font-weight:700;">${safe(c.total_pagado, '0.00')}</td>
            <td style="padding:10px;border-bottom:1px solid #e2e8f0;text-align:right;color:#991b1b;font-weight:700;">${safe(c.pendiente, '0.00')}</td>
          </tr>
        `
      )
      .join('')

  const generarFilasTaller = (array) =>
    array
      .map(
        (t) => `
          <tr>
            <td style="padding:10px;border-bottom:1px solid #e2e8f0;color:#0f172a;">${safe(t.nombre)}</td>
            <td style="padding:10px;border-bottom:1px solid #e2e8f0;color:#475569;">${safe(t.equipo)}</td>
            <td style="padding:10px;border-bottom:1px solid #e2e8f0;color:#475569;">${safe(t.fallas)}</td>
            <td style="padding:10px;border-bottom:1px solid #e2e8f0;text-align:right;color:#166534;font-weight:700;">${safe(t.abonado, '0.00')}</td>
            <td style="padding:10px;border-bottom:1px solid #e2e8f0;text-align:right;color:#991b1b;font-weight:700;">${safe(t.pendiente, '0.00')}</td>
          </tr>
        `
      )
      .join('')

  const sectionTitle = (title, subtitle = '') => `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:26px 0 10px;">
      <tr>
        <td>
          <h2 style="margin:0;color:#0f172a;font-size:18px;line-height:1.2;">${title}</h2>
          ${subtitle ? `<p style="margin:4px 0 0;color:#64748b;font-size:13px;">${subtitle}</p>` : ''}
        </td>
      </tr>
    </table>
  `

  const metricCard = (label, value, color = '#0f172a', bg = '#f8fafc') => `
    <td width="33.33%" style="padding:6px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${bg};border:1px solid #e2e8f0;border-radius:8px;">
        <tr>
          <td style="padding:14px;">
            <div style="font-size:12px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0;">${label}</div>
            <div style="margin-top:6px;font-size:19px;font-weight:800;color:${color};line-height:1.2;">${value}</div>
          </td>
        </tr>
      </table>
    </td>
  `

  const dataTable = (headers, rows, fallback) => `
    <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;background:#ffffff;border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;">
      <thead>
        <tr>
          ${headers.map((item) => `<th style="padding:11px 10px;background:#f1f5f9;border-bottom:1px solid #e2e8f0;color:#334155;font-size:12px;text-align:${item.align || 'left'};text-transform:uppercase;letter-spacing:0;">${item.label}</th>`).join('')}
        </tr>
      </thead>
      <tbody>
        ${rows || emptyRow(headers.length, fallback)}
      </tbody>
    </table>
  `

  return `
<!doctype html>
<html lang="es">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Corte de Caja</title>
  </head>
  <body style="margin:0;padding:0;background:#eef2f7;font-family:Arial,Helvetica,sans-serif;color:#0f172a;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#eef2f7;padding:24px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:980px;background:#ffffff;border-radius:8px;overflow:hidden;border:1px solid #dbe4ee;">
            <tr>
              <td style="padding:26px 28px;background:#172033;color:#ffffff;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="vertical-align:top;">
                      <div style="font-size:12px;font-weight:800;color:#93c5fd;text-transform:uppercase;letter-spacing:0;">Reporte operativo</div>
                      <h1 style="margin:6px 0 0;font-size:28px;line-height:1.1;color:#ffffff;">Corte de Caja</h1>
                      <p style="margin:8px 0 0;color:#cbd5e1;font-size:14px;">${safe(empresa)} - ${safe(usuario, 'Usuario no especificado')}</p>
                    </td>
                    <td align="right" style="vertical-align:top;">
                      <div style="display:inline-block;padding:8px 12px;background:#2563eb;color:#ffffff;border-radius:8px;font-size:13px;font-weight:800;">
                        ${safe(fecha_final)}
                      </div>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <tr>
              <td style="padding:22px 28px 6px;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    ${metricCard('Ingreso total', safe(ingreso_total), '#166534', '#f0fdf4')}
                    ${metricCard('Egreso total', safe(egreso_total), '#991b1b', '#fef2f2')}
                    ${metricCard('Efectivo final', safe(efectivo_final), '#1d4ed8', '#eff6ff')}
                  </tr>
                  <tr>
                    ${metricCard('Efectivo', safe(ingreso_efectivo), '#166534', '#f8fafc')}
                    ${metricCard('Tarjeta', safe(ingreso_tarjeta), '#0f172a', '#f8fafc')}
                    ${metricCard('Transferencia', safe(ingreso_transferencia), '#0f172a', '#f8fafc')}
                  </tr>
                </table>
              </td>
            </tr>

            <tr>
              <td style="padding:6px 28px 0;">
                ${sectionTitle('Informacion del corte')}
                <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;background:#ffffff;border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;">
                  <tbody>
                    <tr>
                      <td style="padding:11px 12px;background:#f8fafc;border-bottom:1px solid #e2e8f0;color:#64748b;font-weight:700;width:34%;">Fecha de inicio</td>
                      <td style="padding:11px 12px;border-bottom:1px solid #e2e8f0;color:#0f172a;">${safe(fecha_inicio)}</td>
                    </tr>
                    <tr>
                      <td style="padding:11px 12px;background:#f8fafc;border-bottom:1px solid #e2e8f0;color:#64748b;font-weight:700;">Fecha final</td>
                      <td style="padding:11px 12px;border-bottom:1px solid #e2e8f0;color:#0f172a;">${safe(fecha_final)}</td>
                    </tr>
                    <tr>
                      <td style="padding:11px 12px;background:#f8fafc;border-bottom:1px solid #e2e8f0;color:#64748b;font-weight:700;">Usuario</td>
                      <td style="padding:11px 12px;border-bottom:1px solid #e2e8f0;color:#0f172a;">${safe(usuario)}</td>
                    </tr>
                    <tr>
                      <td style="padding:11px 12px;background:#f8fafc;border-bottom:1px solid #e2e8f0;color:#64748b;font-weight:700;">Efectivo inicial</td>
                      <td style="padding:11px 12px;border-bottom:1px solid #e2e8f0;color:#1d4ed8;font-weight:800;">${safe(efectivo_inicial)}</td>
                    </tr>
                    <tr>
                      <td style="padding:11px 12px;background:#f8fafc;color:#64748b;font-weight:700;">Observacion</td>
                      <td style="padding:11px 12px;color:#0f172a;">${safe(observacion, 'Ninguna')}</td>
                    </tr>
                  </tbody>
                </table>
              </td>
            </tr>

            <tr>
              <td style="padding:0 28px;">
                ${sectionTitle('Ventas', `${ventas.length} movimiento(s) registrado(s)`)}
                ${dataTable(
                  [
                    { label: 'Concepto' },
                    { label: 'Fecha' },
                    { label: 'Hora' },
                    { label: 'Usuario' },
                    { label: 'Tipo' },
                    { label: 'Pago' },
                    { label: 'Total', align: 'right' }
                  ],
                  generarFilasMovimientos(ventas),
                  'Sin ventas registradas'
                )}

                ${sectionTitle('Gastos', `${gastos.length} movimiento(s) registrado(s)`)}
                ${dataTable(
                  [
                    { label: 'Concepto' },
                    { label: 'Fecha' },
                    { label: 'Hora' },
                    { label: 'Usuario' },
                    { label: 'Tipo' },
                    { label: 'Pago' },
                    { label: 'Total', align: 'right' }
                  ],
                  generarFilasMovimientos(gastos),
                  'Sin gastos registrados'
                )}

                ${sectionTitle('Cuentas por cobrar', `${cuentasCobrar.length} registro(s)`)}
                ${dataTable(
                  [
                    { label: 'Concepto' },
                    { label: 'Fecha' },
                    { label: 'Hora' },
                    { label: 'Pagado', align: 'right' },
                    { label: 'Pendiente', align: 'right' }
                  ],
                  generarFilasCxc(cuentasCobrar),
                  'Sin cuentas por cobrar'
                )}

                ${sectionTitle('Taller', `${taller.length} orden(es)`)}
                ${dataTable(
                  [
                    { label: 'Cliente' },
                    { label: 'Equipo' },
                    { label: 'Fallas' },
                    { label: 'Abonado', align: 'right' },
                    { label: 'Pendiente', align: 'right' }
                  ],
                  generarFilasTaller(taller),
                  'Sin movimientos de taller'
                )}
              </td>
            </tr>

            <tr>
              <td style="padding:26px 28px;background:#f8fafc;border-top:1px solid #e2e8f0;color:#64748b;font-size:12px;text-align:center;">
                Este reporte fue generado automaticamente por el sistema. No responda este correo.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
  `
}
