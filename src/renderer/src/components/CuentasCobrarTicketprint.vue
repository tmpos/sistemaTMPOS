<script setup>
import Swal from 'sweetalert2'
import { envioElectron } from '@/funciones/funciones.js'

const DEFAULT_PRINTER_CONFIG = {
  fontSize: '10',
  fontFamily: 'arial',
  pageWidth: '300',
  bodyWidth: '250',
  ticketWidth: '240',
  logoWidth: '100'
}

const parseJson = (value, fallback) => {
  if (value == null) return fallback
  if (typeof value === 'string') {
    try {
      return JSON.parse(value)
    } catch {
      return fallback
    }
  }
  return value
}

const toNumber = (value, fallback = 0) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

const money = (value, symbol = 'RD$ ') => `${symbol}${toNumber(value).toFixed(2)}`

const buildRows = (facturas, symbol) => {
  return facturas
    .map((f) => `
      <tr>
        <td colspan="3" style="overflow-wrap: break-word; font-weight: bold; white-space: normal; word-break: break-word;">
          FACTURA #${f.no_factura || ''} - ${f.fecha_emision || ''}
        </td>
      </tr>
      <tr>
        <td style="padding-left:10px;">Abonado:</td>
        <td class="precio" colspan="2" style="text-align:right;">${money(f.abonado, symbol)}</td>
      </tr>
      <tr>
        <td style="padding-left:10px;">Pendiente:</td>
        <td class="precio" colspan="2" style="text-align:right;"><b>${money(f.saldo, symbol)}</b></td>
      </tr>
    `)
    .join('')
}

const buildAbonosRows = (facturas, symbol) => {
  const rows = []

  facturas.forEach((f) => {
    let pagos = []
    try {
      pagos = parseJson(f?.pagos, [])
      if (!Array.isArray(pagos)) pagos = []
    } catch {
      pagos = []
    }

    pagos.forEach((p) => {
      rows.push(`
        <tr>
          <td colspan="3" style="overflow-wrap: break-word; font-weight: bold; white-space: normal; word-break: break-word;">
            FAC #${f.no_factura || ''} - Pago #${p.nopago || ''}
          </td>
        </tr>
        <tr>
          <td style="padding-left:10px;">${p.fecha || ''} ${p.hora || ''}</td>
          <td style="padding-left:10px;">${p.metodo || 'N/A'}</td>
          <td class="precio">${money(p.cantidad, symbol)}</td>
        </tr>
      `)
    })
  })

  return rows.join('')
}

const buildTicketHtml = async ({ facturas, cliente, datosEmpresa }) => {
  const datosJSON = (await envioElectron('datosarchivo').catch(() => ({}))) || {}
  const printerConfig = {
    ...DEFAULT_PRINTER_CONFIG,
    ...(parseJson(datosJSON?.impresora, {}) || {})
  }

  const empresa = datosEmpresa?.empresa || {}
  const datosConfiguracion = datosEmpresa?.configuracion || {}
  const symbol = datosConfiguracion?.simbolo || 'RD$ '
  const listado = Array.isArray(facturas) ? facturas : []
  const totalAbonado = listado.reduce((acc, f) => acc + toNumber(f.abonado), 0)
  const totalPendiente = listado.reduce((acc, f) => acc + toNumber(f.saldo), 0)
  const cantidadFacturas = listado.length

  const detalleHtml = buildRows(listado, symbol)
  const abonosHtml = buildAbonosRows(listado, symbol)

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        * { font-size: ${printerConfig.fontSize}px; font-family: '${printerConfig.fontFamily}'; }
        @page { size: ${printerConfig.pageWidth}px auto; margin: ${printerConfig.margin || 5}px; }
        body { width: ${printerConfig.bodyWidth}px; margin: 5px; padding: 5px; color: #111; }
        .ticket { width: ${printerConfig.ticketWidth}px; padding-top: 10px; padding-bottom: 10px; }
        .bordeado { border: 1px solid #000; border-radius: 5px; padding: 5px; }
        .linea { width: 100%; border-top: 1px solid #000; margin: 6px 0; }
        table { width: 100%; border-collapse: separate; border-spacing: 0 ${printerConfig.espacio || 0}px; }
        th { text-align: left; padding: 5px 0; border-bottom: 1px solid #000; }
        .precio { text-align: right; }
        .centrado { text-align: center; }
        .big { font-size: 1.35em !important; font-weight: bold; }
      </style>
    </head>
    <body>
      <div class="ticket">
        <center>
          <div class="logos">
            ${
              empresa.logoprinter
                ? `<img src="${empresa.logoprinter}" alt="Logo" style="max-width:${printerConfig.logoWidth}px">`
                : `<div style="font-size:${Number(printerConfig.fontSize) + 8}px !important;font-weight:bold">${empresa.nombre || ''}</div>`
            }
          </div>
          <p>
            ${empresa.direccion || ''}<br>
            ${empresa.telefono || ''}${empresa.email ? ` / ${empresa.email}` : ''}<br>
            ${empresa.legal || ''}
          </p>
        </center>

        <div class="bordeado">
          <p>
            <b>ESTADO DE CUENTA CxC</b><br>
            Fecha: ${new Date().toLocaleDateString('es-DO')}<br>
            Cliente: ${cliente?.nombre || cliente?.nombre_cliente || 'SIN REGISTRO'}<br>
            Cedula/RNC: ${cliente?.rnc || cliente?.cedula || 'N/A'}<br>
            Telefono: ${cliente?.telefono || 'N/A'}<br>
            Facturas: ${cantidadFacturas}
          </p>
        </div>

        <div class="bordeado" style="text-align:center;padding:4px;margin-top:6px;">
          DETALLE DE FACTURAS
        </div>

        <table>
          <thead class="linea">
            <tr>
              <th>Concepto</th>
              <th class="precio" colspan="2">Monto</th>
            </tr>
          </thead>
          <tbody>
            ${detalleHtml || '<tr><td colspan="3">Sin facturas pendientes</td></tr>'}
          </tbody>
        </table>

        <div class="bordeado" style="text-align:center;padding:4px;margin-top:8px;">
          ABONOS REALIZADOS
        </div>

        <table>
          <thead class="linea">
            <tr>
              <th>Fecha</th>
              <th>Metodo</th>
              <th class="precio">Monto</th>
            </tr>
          </thead>
          <tbody>
            ${abonosHtml || '<tr><td colspan="3">Sin abonos registrados</td></tr>'}
          </tbody>
        </table>

        <div class="linea" style="margin-top: 12px;"></div>

        <div style="font-weight:bold;">
          <table>
            <tr>
              <td>TOTAL ABONADO:</td>
              <td class="precio"><span class="big">${money(totalAbonado, symbol)}</span></td>
            </tr>
          </table>
        </div>

        <div style="font-weight:bold;">
          <table>
            <tr>
              <td>TOTAL PENDIENTE:</td>
              <td class="precio"><span class="big">${money(totalPendiente, symbol)}</span></td>
            </tr>
          </table>
        </div>
      </div>
    </body>
    </html>
  `
}

const printCuentasTicket = async ({ facturas, cliente, datosEmpresa }) => {
  const html = await buildTicketHtml({ facturas, cliente, datosEmpresa })
  const blob = new Blob([html], { type: 'text/html' })
  const url = URL.createObjectURL(blob)

  await Swal.fire({
    title: 'Vista previa Ticket CxC',
    width: '430px',
    html: `<iframe id="swal-cxc-ticket" src="${url}" style="width:100%;height:65vh;border:1px solid #ddd;border-radius:8px;"></iframe>`,
    showCancelButton: true,
    cancelButtonText: 'Cerrar',
    confirmButtonText: 'Imprimir',
    preConfirm: () => {
      const iframe = document.getElementById('swal-cxc-ticket')
      if (iframe?.contentWindow) {
        iframe.contentWindow.focus()
        iframe.contentWindow.print()
      }
    },
    didClose: () => {
      URL.revokeObjectURL(url)
    }
  })
}

defineExpose({ printCuentasTicket, buildTicketHtml })
</script>

<template>
  <div style="display:none"></div>
</template>
