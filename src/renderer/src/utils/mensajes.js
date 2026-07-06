// utils/email-templates.js

/**
 * Genera HTML de bienvenida para un nuevo cliente del gym
 * Usa solo estilos inline (compatibles con clientes de correo).
 */
export function buildBienvenidaGymHTML({
  empresa = 'TU GYM',
  logoUrl, // opcional (URL pública)
  nombre = 'Cliente',
  codigo, // opcional: código/membresía
  plan = 'PLAN MENSUAL',
  frecuencia = 'Mensual',
  monto = 'RD$ 0.00',
  fechaInicio = 'dd/mm/yyyy',
  fechaVencimiento = 'dd/mm/yyyy',
  diasRestantes = null, // opcional: número
  beneficios = [], // array de strings
  enlacePerfil, // opcional
  enlacePago, // opcional
  enlaceSoporte, // opcional
  qrUrl, // opcional (si tienes QR de membresía)
  porcentaje = null, // opcional: 0..100 (barra de progreso)
  color = '#2E7D32' // color principal (verde bonito)
} = {}) {
  const maxWidth = '600px'
  const hasBeneficios = beneficios && beneficios.length > 0
  const barraProgreso =
    typeof porcentaje === 'number'
      ? `
      <div style="margin-top:12px;">
        <div style="height:10px;background:#e6e6e6;border-radius:999px;overflow:hidden;">
          <div style="height:10px;width:${Math.max(0, Math.min(100, porcentaje))}%;background:${color};"></div>
        </div>
        <div style="font-size:12px;color:#666;margin-top:6px;">Progreso del ciclo: ${Math.round(Math.max(0, Math.min(100, porcentaje)))}%</div>
      </div>
    `
      : ''

  const beneficiosHTML = hasBeneficios
    ? `
      <ul style="padding-left:18px;margin:8px 0 0 0;color:#333;line-height:1.5;">
        ${beneficios.map((b) => `<li>${escapeHtml(b)}</li>`).join('')}
      </ul>
    `
    : ''

  return `
<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>${escapeHtml(empresa)} - Bienvenida</title>
</head>
<body style="margin:0;background:#f6f7fb;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#f6f7fb;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:${maxWidth};margin:0 auto;">
          <!-- Header -->
          <tr>
            <td style="background:${color};padding:28px 20px;text-align:center;border-radius:0 0 18px 18px;">
              ${logoUrl ? `<img src="${logoUrl}" width="64" height="64" alt="${escapeHtml(empresa)}" style="border-radius:12px;display:block;margin:0 auto 10px;"/>` : ''}
              <div style="font:700 22px/1.2 system-ui,-apple-system,Segoe UI,Roboto,Ubuntu; color:#fff;">
                ¡Bienvenido(a) a ${escapeHtml(empresa)}!
              </div>
              <div style="font:400 14px/1.4 system-ui,-apple-system,Segoe UI,Roboto,Ubuntu; color:#e9ffe9; margin-top:6px;">
                Nos alegra tenerte con nosotros, ${escapeHtml(nombre)}.
              </div>
            </td>
          </tr>

          <!-- Card principal -->
          <tr>
            <td style="padding:20px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#fff;border-radius:16px;box-shadow:0 6px 20px rgba(0,0,0,0.06);">
                <tr>
                  <td style="padding:24px;">
                    <div style="font:700 18px system-ui,-apple-system,Segoe UI,Roboto,Ubuntu;color:#111;">Detalles de tu membresía</div>

                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-top:10px;">
                      ${codigo ? row('Código', codigo) : ''}
                      ${row('Plan adquirido', plan)}
                      ${row('Frecuencia', frecuencia)}
                      ${row('Monto', monto)}
                      ${row('Fecha de inicio', fechaInicio)}
                      ${row('Fecha de vencimiento', fechaVencimiento)}
                      ${diasRestantes !== null ? row('Días restantes', `${diasRestantes} día(s)`) : ''}
                    </table>

                    ${barraProgreso}

                    ${
                      hasBeneficios
                        ? `
                      <div style="font:700 16px system-ui,-apple-system,Segoe UI,Roboto,Ubuntu;color:#111;margin-top:18px;">Beneficios incluidos</div>
                      ${beneficiosHTML}
                    `
                        : ''
                    }

                    ${
                      qrUrl
                        ? `
                      <div style="text-align:center;margin-top:18px;">
                        <img src="${qrUrl}" alt="QR de membresía" width="120" height="120" style="display:inline-block;border-radius:12px;border:1px solid #eee;"/>
                        <div style="font:400 12px system-ui,-apple-system,Segoe UI,Roboto,Ubuntu;color:#666;margin-top:6px;">Presenta este QR en recepción</div>
                      </div>
                    `
                        : ''
                    }

                    <!-- CTAs -->
                    <div style="text-align:center;margin-top:24px;">
                      ${enlacePerfil ? btn('Ver mi perfil', enlacePerfil, color) : ''}
                      ${enlacePago ? btn('Pagar en línea', enlacePago, '#111') : ''}
                    </div>

                    ${
                      enlaceSoporte
                        ? `
                      <div style="text-align:center;margin-top:16px;">
                        <a href="${enlaceSoporte}" style="font:400 13px system-ui,-apple-system,Segoe UI,Roboto,Ubuntu;color:#666;text-decoration:underline;">¿Necesitas ayuda? Contáctanos</a>
                      </div>
                    `
                        : ''
                    }

                    <div style="margin-top:22px;border-top:1px solid #eee;padding-top:14px;font:400 12px system-ui,-apple-system,Segoe UI,Roboto,Ubuntu;color:#777;">
                      Recomendación: añade un recordatorio cerca de la fecha de vencimiento para mantener tus pagos al día y que no se te venza la membresía.
                    </div>
                  </td>
                </tr>
              </table>

              <!-- Footer -->
              <div style="text-align:center;color:#999;font:400 12px system-ui,-apple-system,Segoe UI,Roboto,Ubuntu;margin:16px 0 30px;">
                © ${new Date().getFullYear()} ${escapeHtml(empresa)}. Todos los derechos reservados.
              </div>
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

function row(label, value) {
  return `
  <tr>
    <td style="padding:6px 0;width:45%;font:600 14px system-ui,-apple-system,Segoe UI,Roboto,Ubuntu;color:#333;">${escapeHtml(label)}</td>
    <td style="padding:6px 0;width:55%;font:400 14px system-ui,-apple-system,Segoe UI,Roboto,Ubuntu;color:#333;">${escapeHtml(value)}</td>
  </tr>`
}

function btn(text, href, bg) {
  return `
  <a href="${href}" target="_blank"
     style="display:inline-block;margin:6px 6px 0 6px;padding:12px 18px;border-radius:12px;
            background:${bg};color:#fff;text-decoration:none;font:600 14px system-ui,-apple-system,Segoe UI,Roboto,Ubuntu;">
    ${escapeHtml(text)}
  </a>`
}

function escapeHtml(str = '') {
  return String(str)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}

// utils/email-templates.js (mismo archivo o aparte)

/**
 * Construye el contenido ICS para recordatorio de vencimiento.
 * startISO/endISO: '2025-09-08T09:00:00' (hora local del gym)
 */
export function buildIcsRecordatorio({
  title = 'Vencimiento de membresía',
  description = 'Recordatorio de pago de membresía del gym.',
  location = 'Recepción del gym',
  startISO, // ej: '2025-09-08T09:00:00'
  endISO // ej: '2025-09-08T09:15:00'
}) {
  const uid = `tmpos-${Date.now()}@gym`
  const dtStart = toIcsDateTime(startISO)
  const dtEnd = toIcsDateTime(endISO)

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//TM POS//GYM//ES',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${toIcsDateTime(new Date().toISOString())}`,
    `DTSTART:${dtStart}`,
    `DTEND:${dtEnd}`,
    `SUMMARY:${escapeIcs(title)}`,
    `DESCRIPTION:${escapeIcs(description)}`,
    `LOCATION:${escapeIcs(location)}`,
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n')
}

function toIcsDateTime(iso) {
  // Convierte 'YYYY-MM-DDTHH:mm:ss' a 'YYYYMMDDTHHMMSS'
  const d = new Date(iso)
  const pad = (n) => String(n).padStart(2, '0')
  return (
    [d.getFullYear(), pad(d.getMonth() + 1), pad(d.getDate())].join('') +
    'T' +
    [pad(d.getHours()), pad(d.getMinutes()), pad(d.getSeconds())].join('')
  )
}

function escapeIcs(str = '') {
  return String(str)
    .replaceAll('\\', '\\\\')
    .replaceAll('\n', '\\n')
    .replaceAll(',', '\\,')
    .replaceAll(';', '\\;')
}

export function buildRecordatorioPagoHTML({
  empresa = 'TM POS',
  logoUrl,
  nombre = 'Cliente',
  monto = 'RD$ 0.00',
  fechaVencimiento = 'dd/mm/yyyy',
  enlacePago,
  motivo = 'Recordatorio de Pago',
  cuerpo = '',
  enlaceSoporte,
  color = '#D32F2F' // rojo elegante
} = {}) {
  const maxWidth = '600px'
  return `
<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>${escapeHtml(empresa)} - ${motivo}</title>
</head>
<body style="margin:0;background:#f6f7fb;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#f6f7fb;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:${maxWidth};margin:0 auto;">
          <!-- Header -->
          <tr>
            <td style="background:${color};padding:24px;text-align:center;border-radius:0 0 18px 18px;">
              ${logoUrl ? `<img src="${logoUrl}" width="64" height="64" alt="${escapeHtml(empresa)}" style="border-radius:12px;display:block;margin:0 auto 10px;"/>` : ''}
              <div style="font:700 22px system-ui,-apple-system,Segoe UI,Roboto,Ubuntu; color:#fff;">
                Recordatorio de Pago
              </div>
              <div style="font:400 14px system-ui,-apple-system,Segoe UI,Roboto,Ubuntu; color:#ffeaea; margin-top:6px;">
                Hola ${escapeHtml(nombre)}, tienes un pago pendiente.
              </div>
            </td>
          </tr>

          <!-- Card -->
          <tr>
            <td style="padding:20px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#fff;border-radius:16px;box-shadow:0 6px 20px rgba(0,0,0,0.06);">
                <tr>
                  <td style="padding:24px;">
                    <div style="font:700 18px system-ui,-apple-system,Segoe UI,Roboto,Ubuntu;color:#111;">
                      Detalles del pago
                    </div>
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-top:10px;">
                      ${row('Cliente', nombre)}
                      ${row('Monto pendiente', monto)}
                      ${row('Fecha límite', fechaVencimiento)}
                      ${row('', cuerpo)}
                    </table>

                    <div style="text-align:center;margin-top:24px;">
                      ${enlacePago ? btn('Pagar ahora', enlacePago, color) : ''}
                    </div>

                    ${
                      enlaceSoporte
                        ? `
                      <div style="text-align:center;margin-top:16px;">
                        <a href="${enlaceSoporte}" style="font:400 13px system-ui,-apple-system,Segoe UI,Roboto,Ubuntu;color:#666;text-decoration:underline;">
                          ¿Necesitas ayuda? Contáctanos
                        </a>
                      </div>`
                        : ''
                    }
                  </td>
                </tr>
              </table>

              <div style="text-align:center;color:#999;font:400 12px system-ui,-apple-system,Segoe UI,Roboto,Ubuntu;margin:16px 0 30px;">
                © ${new Date().getFullYear()} ${escapeHtml(empresa)}. Todos los derechos reservados.
              </div>
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

export function buildReactivacionInactivoHTML({
  empresa = 'TU GYM',
  logoUrl,
  nombre = 'Cliente',
  ultimaVisita = '---',
  enlaceReactivacion,
  enlaceSoporte,
  color = '#1976D2' // azul motivador
} = {}) {
  const maxWidth = '600px'
  return `
<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>${escapeHtml(empresa)} - Te extrañamos</title>
</head>
<body style="margin:0;background:#f6f7fb;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#f6f7fb;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:${maxWidth};margin:0 auto;">
          <!-- Header -->
          <tr>
            <td style="background:${color};padding:24px;text-align:center;border-radius:0 0 18px 18px;">
              ${logoUrl ? `<img src="${logoUrl}" width="64" height="64" alt="${escapeHtml(empresa)}" style="border-radius:12px;display:block;margin:0 auto 10px;"/>` : ''}
              <div style="font:700 22px system-ui,-apple-system,Segoe UI,Roboto,Ubuntu; color:#fff;">
                ¡Te extrañamos en ${escapeHtml(empresa)}!
              </div>
              <div style="font:400 14px system-ui,-apple-system,Segoe UI,Roboto,Ubuntu; color:#e9f2ff; margin-top:6px;">
                Han pasado más de 3 meses desde tu última visita.
              </div>
            </td>
          </tr>

          <!-- Card -->
          <tr>
            <td style="padding:20px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#fff;border-radius:16px;box-shadow:0 6px 20px rgba(0,0,0,0.06);">
                <tr>
                  <td style="padding:24px;">
                    <div style="font:700 18px system-ui,-apple-system,Segoe UI,Roboto,Ubuntu;color:#111;">
                      Hola ${escapeHtml(nombre)},
                    </div>
                    <p style="margin-top:10px;font:400 14px system-ui,-apple-system,Segoe UI,Roboto,Ubuntu;color:#333;line-height:1.5;">
                      Notamos que tu última visita fue el <strong>${escapeHtml(ultimaVisita)}</strong>. 
                      Queremos motivarte a retomar tus entrenamientos y seguir avanzando hacia tus metas. 💪
                    </p>

                    <div style="text-align:center;margin-top:24px;">
                      ${enlaceReactivacion ? btn('Reactivar mi membresía', enlaceReactivacion, color) : ''}
                    </div>

                    ${
                      enlaceSoporte
                        ? `
                      <div style="text-align:center;margin-top:16px;">
                        <a href="${enlaceSoporte}" style="font:400 13px system-ui,-apple-system,Segoe UI,Roboto,Ubuntu;color:#666;text-decoration:underline;">
                          ¿Necesitas ayuda? Contáctanos
                        </a>
                      </div>`
                        : ''
                    }
                  </td>
                </tr>
              </table>

              <div style="text-align:center;color:#999;font:400 12px system-ui,-apple-system,Segoe UI,Roboto,Ubuntu;margin:16px 0 30px;">
                © ${new Date().getFullYear()} ${escapeHtml(empresa)}. Todos los derechos reservados.
              </div>
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
