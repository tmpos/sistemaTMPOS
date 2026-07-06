<script setup>
import QRCode from 'qrcode'
import { envioElectron, encryptarPassword } from '@/funciones/funciones.js'

const DEFAULT_PRINTER_CONFIG = {
  fontSize: '10',
  fontFamily: 'arial',
  pageWidth: '300',
  bodyWidth: '250',
  ticketWidth: '240',
  logoWidth: '100',
  pageSizeWidth: '80000',
  pageSizeHeight: '295000',
  copies: '1'
}

const DEFAULT_DATOS_DEFAULT = {
  logo: true,
  direccion: true,
  telefono: true,
  email: true,
  legal: false,
  fecha: true,
  hora: true,
  rnc: true,
  nombre_cliente: true,
  vendedor: true,
  cajero: true,
  mesero: false,
  instalador: false,
  mesa: false,
  delivery: false,
  metodopago: true,
  comprobante: true,
  no_factura: true,
  subtotal: true,
  descuento: true,
  impuestos: true,
  total: true,
  cambio: true,
  barcode: true,
  firma: false,
  nota: true,
  empaque: true
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

const printHtml = async (htmlContent) => {
  if (window.electron?.ipcRenderer) {
    await window.electron.ipcRenderer.invoke('print-ticket', htmlContent)
    return
  }

  const printWindow = window.open('', '_blank')
  if (!printWindow) return

  printWindow.document.write(htmlContent)
  printWindow.document.close()
  printWindow.focus()
  printWindow.print()
}

const buildProductosHTML = (productos, datosDefault, datosConfiguracion) => {
  return productos
    .map((producto) => {
      const cantidad = toNumber(producto.cantidad || producto.quantity, 0)
      const precioVenta = toNumber(producto.precio_venta || producto.precio_unitario, 0)
      const precioFinal = toNumber(producto.precio_final || precioVenta, precioVenta)
      const descuento = toNumber(producto.descuento, 0)
      const impuesto = toNumber(producto.impuesto, 0)

      const totalProducto = precioFinal * cantidad
      const totalProd = toNumber(producto.total, 0) || totalProducto
      const totalImpuestos = impuesto * cantidad

      return `
      <tr>
        <td colspan="5" style="overflow-wrap: break-word; font-weight: bold; white-space: normal; word-break: break-word;">
          ${producto.nombre}
        </td>
      </tr>
      <tr>
        <td style="padding-left:20px;">${cantidad} x</td>
        ${datosDefault.empaque ? `<td class="precio centrado">${producto.empaque || ''}</td>` : ''}
        <td>${datosConfiguracion.simbolo || ''}${precioVenta.toFixed(2)}</td>
        ${datosDefault.impuestos ? `<td class="precio centrado">${datosConfiguracion.simbolo || ''}${totalImpuestos.toFixed(2)}</td>` : ''}
        ${datosDefault.descuento ? `<td class="precio centrado">${datosConfiguracion.simbolo || ''}${descuento.toFixed(2)}</td>` : ''}
        <td class="precio centrado" style="text-align:right;">
          <b>${datosConfiguracion.simbolo || ''}${totalProd.toFixed(2)}</b>
        </td>
      </tr>
    `
    })
    .join('')
}

const buildTicketHtml = ({
  cotizacion,
  cliente,
  datosLocalStorage,
  datosDefault,
  printerConfig,
  datosConfiguracion,
  qrCodeData,
  pagocon,
  sucambio,
  delivery,
  abonado,
  pendiente
}) => {
  const empresa = datosLocalStorage?.empresa || {}
  const subtotal = (
    toNumber(cotizacion.total) +
    toNumber(cotizacion.descuento) -
    toNumber(cotizacion.impuesto)
  ).toFixed(2)

  const productosHTML = buildProductosHTML(
    parseJson(cotizacion.productos, []),
    datosDefault,
    datosConfiguracion
  )

  return `
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            * { font-size: ${printerConfig.fontSize}px; font-family: '${printerConfig.fontFamily}'; }
            @page { size: ${printerConfig.pageWidth}px auto; margin: ${printerConfig.margin || 5}px; }
            body { width: ${printerConfig.bodyWidth}px; margin: 5px; padding: 5px; }
            th { text-align: left; padding: 5px; border-bottom: 1px solid #000; }
            th.centrado { text-align: center; }
            th.precio { text-align: right; }
            .ticket {
                width: ${printerConfig.ticketWidth}px;
                padding-top:10px;
                padding-bottom:10px;
              }
            thead { border-bottom: 2px solid #000; }
            table { width: 100%; border-collapse: separate; border-spacing: 0 ${printerConfig.espacio || 0}px !important; }
            td, th { width: ${printerConfig.ticketWidth}px;}
            .bordeado2 {border:1px solid #000000; border-radius:5px; padding:3px;max-width:150px;margin-top:5px;}
            .centrado { text-align: center; align-content: center; }
            .derecha { text-align: right; }
            .linea { width: 100%; border-top: 1px solid #000; padding-top: 5px; padding-bottom: 5px; margin-bottom: 5px; padding-right: 10px; }
            .bordeado { border:1px solid #000000; border-radius:5px; padding-left:5px; }

            #descuento { display: ${datosDefault.descuento ? 'block' : 'none'}; }
            #subtotal { display: ${datosDefault.subtotal ? 'block' : 'none'}; }
            #impuesto { display: ${datosDefault.impuestos ? 'block' : 'none'}; }
            #total { display: ${datosDefault.total ? 'block' : 'none'}; }
            #qrcode { display: ${datosDefault.barcode ? 'block' : 'none'}; }
            #firma { display: ${datosDefault.firma ? 'block' : 'none'}; }
            #nota { display: ${datosDefault.nota ? 'block' : 'none'}; }
            #sucambio { display: ${datosDefault.cambio ? 'block' : 'none'}; }
            #pagocon { display: ${datosDefault.cambio ? 'block' : 'none'}; }

            .info {
                display: flex;
                justify-content: space-between;
                align-items: flex-start;
            }

            .left-column {
                flex: 1;
                padding-right: 10px;
            }

            .right-column {
                text-align: left;
                flex: 0 0 auto;
            }
        </style>
    </head>
    <body>
        <div class="ticket">
            <center id="top">
                <div class="logos" style="text-align: center;">
                 ${
                   datosDefault.logo
                     ? `<img src="${empresa.logoprinter || ''}" alt="Logo" style="max-width: ${printerConfig.logoWidth}px">`
                     : `<div style="font-size:${Number(printerConfig.fontSize) + 8}px !important;font-weight:bold">${empresa.nombre || ''}</div>`
                 }
                </div>
                <div class="info">
                    <div class="left-column">
                        <div>${empresa.direccion || ''}</div>
                        <div>${empresa.telefono || ''}</div>
                        <div>${empresa.email || ''}</div>
                    </div>
                    <div class="right-column">
                        <div>RNC: ${empresa.rnc || ''}</div>
                        <div>FECHA: ${cotizacion.fecha_emision || ''}</div>
                        <div>HORA: ${cotizacion.hora || ''}</div>
                    </div>
                </div>
            </center>
            <div class="linea"></div>
            <div class="bordeado">
                ${datosDefault.nombre_cliente ? `<div>CLIENTE: ${cotizacion.nombre_cliente || cliente?.nombre || ''}</div>` : ''}
                ${datosDefault.rnc ? `<div>RNC/CEDULA: ${cliente?.rnc || cliente?.cedula || cotizacion.rnc_cliente || ''}</div>` : ''}
                ${datosDefault.telefono ? `<div>TELEFONO: ${cliente?.telefono || cotizacion.telefono_cliente || ''}</div>` : ''}
                ${datosDefault.direccion ? `<div>DIRECCION: ${cliente?.direccion || cotizacion.direccion_cliente || ''}</div>` : ''}
                ${datosDefault.metodopago ? `<div>METODO: ${cotizacion.metodo_pago || ''}</div>` : ''}
                ${datosDefault.comprobante ? `<div>NCF: ${cotizacion.comprobante || ''}</div>` : ''}
                <div>#COTIZACION: ${cotizacion.no_cotizacion || ''}</div>
                ${cotizacion.vencimiento ? `<div>VENCIMIENTO: ${cotizacion.vencimiento}</div>` : ''}
            </div>
            <div class="linea"></div>
            <table>
                <thead>
                    <tr>
                        <th class="centrado">CANT</th>
                        ${datosDefault.empaque ? `<th class="centrado">EMP.</th>` : ''}
                        <th class="centrado">PRECIO</th>
                        ${datosDefault.impuestos ? `<th class="centrado">ITBIS</th>` : ''}
                        ${datosDefault.descuento ? `<th class="centrado">DESC</th>` : ''}
                        <th class="precio">TOTAL</th>
                    </tr>
                </thead>
                <tbody>
                    ${productosHTML}
                </tbody>
            </table>
            <div class="linea"></div>
            <div class="derecha" id="subtotal">SUBTOTAL: ${datosConfiguracion.simbolo || ''}${subtotal}</div>
            <div class="derecha" id="descuento">DESCUENTO: ${datosConfiguracion.simbolo || ''}${toNumber(cotizacion.descuento).toFixed(2)}</div>
            <div class="derecha" id="impuesto">ITBIS: ${datosConfiguracion.simbolo || ''}${toNumber(cotizacion.impuesto).toFixed(2)}</div>
            <div class="derecha" id="total">TOTAL: ${datosConfiguracion.simbolo || ''}${toNumber(cotizacion.total).toFixed(2)}</div>
            <div class="linea"></div>
            ${datosDefault.nota ? `<div id="nota">NOTA: ${cotizacion.nota || ''}</div>` : ''}
            <div class="bordeado2" id="qrcode">
                ${qrCodeData ? `<img src="${qrCodeData}" alt="QR" style="width:100%;">` : ''}
            </div>
        </div>
    </body>
    </html>
  `
}

const printTicket = async ({ cotizacion, cliente, datosEmpresa }) => {
  const datosLocalStorage = datosEmpresa || {}
  const config = await envioElectron('datosarchivo')

  const printerConfig = {
    ...DEFAULT_PRINTER_CONFIG,
    ...parseJson(config?.impresora, {})
  }

  const datosDefault = {
    ...DEFAULT_DATOS_DEFAULT,
    ...parseJson(config?.datosDefault, {})
  }

  const datosConfiguracion = datosEmpresa?.configuracion || {}
  const cotizacionData = cotizacion || {}
  const clienteData = cliente || {}
  let abonado = 0
  let pendiente = 0

  let datosOtro = []
  try {
    datosOtro = parseJson(cotizacionData?.otro, [])
  } catch {
    datosOtro = []
  }

  const pagocon = datosOtro?.[0]?.pagocon || 0
  const sucambio = datosOtro?.[0]?.sucambio || 0
  const delivery = datosOtro?.[0]?.delivery || ''

  let qrCodeData = ''
  const link = config?.VITE_LINKURL || ''
  if (link && cotizacionData?.no_cotizacion) {
    try {
      qrCodeData = await QRCode.toDataURL(
        `${link}/receipt/ticket?cotizacion=${cotizacionData.no_cotizacion}`
      )
    } catch (error) {
      console.error('Error generando QR:', error?.message || error)
    }
  }

  const htmlContent = buildTicketHtml({
    cotizacion: cotizacionData,
    cliente: clienteData || {},
    datosLocalStorage: datosLocalStorage || {},
    datosDefault,
    printerConfig,
    datosConfiguracion,
    qrCodeData,
    pagocon,
    sucambio,
    delivery,
    abonado,
    pendiente
  })

  await printHtml(htmlContent)
}

defineExpose({ printTicket })
</script>

<template>
  <div style="display: none"></div>
</template>
