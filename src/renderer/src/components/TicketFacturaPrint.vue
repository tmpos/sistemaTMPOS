<script setup>
import QRCode from 'qrcode'
import { envioElectron, encryptarPassword } from '@/funciones/funciones.js'
import html2pdf from 'html2pdf.js'
import Swal from 'sweetalert2'

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

  // Generar PDF embebido con SweetAlert (formato ticket 80mm)
  try {
    // Mostrar loading
    Swal.fire({
      title: 'Generando ticket...',
      html: 'Por favor espere',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading()
      }
    })

    // Crear iframe oculto para cargar el HTML completo
    const iframe = document.createElement('iframe')
    iframe.style.position = 'fixed'
    iframe.style.left = '-9999px'
    iframe.style.top = '0'
    iframe.style.width = '300px' // Ancho de ticket 80mm
    iframe.style.height = '600px'
    iframe.style.border = 'none'
    document.body.appendChild(iframe)

    // Cargar el HTML en el iframe
    const iframeDoc = iframe.contentDocument || iframe.contentWindow.document
    iframeDoc.open()
    iframeDoc.write(htmlContent)
    iframeDoc.close()

    // Esperar a que las imágenes se carguen
    const images = iframeDoc.getElementsByTagName('img')
    const imagePromises = Array.from(images).map((img) => {
      if (img.complete) return Promise.resolve()
      return new Promise((resolveImg) => {
        img.onload = resolveImg
        img.onerror = resolveImg
        setTimeout(resolveImg, 3000)
      })
    })

    await Promise.all(imagePromises)
    await new Promise((resolve) => setTimeout(resolve, 1000))

    // Configuración para html2pdf - formato ticket 80mm
    const opt = {
      margin: 0,
      filename: `ticket_${Date.now()}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        letterRendering: true,
        logging: false,
        backgroundColor: null
      },
      jsPDF: {
        unit: 'mm',
        format: [80, 297], // 80mm ancho ticket
        orientation: 'portrait',
        compress: true
      }
    }

    // Generar PDF como blob desde el iframe
    const pdfBlob = await html2pdf().set(opt).from(iframeDoc.documentElement).outputPdf('blob')

    // Limpiar iframe temporal
    document.body.removeChild(iframe)

    // Verificar que el PDF no esté vacío
    if (pdfBlob.size < 1000) {
      throw new Error('El PDF generado está vacío')
    }

    // Crear URL del PDF
    const pdfUrl = URL.createObjectURL(pdfBlob)

    // Cerrar loading
    Swal.close()

    // Mostrar PDF en iframe con controles nativos del navegador
    await Swal.fire({
      title: `Vista previa de ticket (80mm)`,
      width: '90%',
      html: `<iframe id="swal-ticket-iframe" src="${pdfUrl}" style="width:100%; height:70vh; border:1px solid #ddd; border-radius:8px;"></iframe>`,
      showDenyButton: true,
      denyButtonText: 'Descargar PDF',
      showCancelButton: true,
      cancelButtonText: 'Cerrar',
      confirmButtonText: 'Imprimir',
      preConfirm: () => {
        const iframe = document.getElementById('swal-ticket-iframe')
        if (iframe?.contentWindow) {
          iframe.contentWindow.focus()
          iframe.contentWindow.print()
        }
      },
      preDeny: async () => {
        const link = document.createElement('a')
        link.href = pdfUrl
        link.download = opt.filename
        link.click()
      },
      didClose: () => {
        URL.revokeObjectURL(pdfUrl)
      }
    })
  } catch (error) {
    console.error('Error al generar el PDF:', error)
    Swal.fire({
      icon: 'error',
      title: 'Error al generar ticket',
      html: `
        <p style="margin-bottom: 10px;">No se pudo generar el PDF del ticket.</p>
        <div style="
          background: #f8f9fa;
          padding: 10px;
          border-radius: 8px;
          border-left: 4px solid #e74c3c;
        ">
          <small style="color: #666; font-family: monospace;">${error.message || 'Error desconocido'}</small>
        </div>
      `,
      confirmButtonColor: '#e74c3c',
      confirmButtonText: '<i class="fas fa-check"></i> Entendido'
    })
  }
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
      const totalProd = toNumber(producto.total, 0)
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
  factura,
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
  pendiente,
  datosDGII,
  qrCodeDGII
}) => {
  const empresa =
    datosLocalStorage?.empresa ||
    datosLocalStorage?.datosEmpresa?.empresa ||
    {}
  const subtotal = (
    toNumber(factura.total) +
    toNumber(factura.descuento) -
    toNumber(factura.impuesto)
  ).toFixed(2)

  const productosHTML = buildProductosHTML(
    parseJson(factura.productos, []),
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
            html, body { background-color: #ffffff; }
            body { width: ${printerConfig.bodyWidth}px; margin: 5px; padding: 5px; background-color: #ffffff; }
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

            .logos img {
                display: block;
                margin-left: auto;
                margin-right: auto;
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
                    <p>${datosDefault.direccion ? empresa.direccion || '' : ''}<br>${datosDefault.telefono ? empresa.telefono || '' : ''}  ${datosDefault.email && empresa.email ? '/ ' + empresa.email : ''}<br>${datosDefault.legal ? empresa.legal || '' : ''}</p>
                </div>
            </center>

<div id="mid" class="bordeado">
    <div class="info">
        <div class="left-column1">
            <p>
                ${datosDefault.fecha ? `Fecha: ${factura.fecha_emision || ''} ${factura.hora || ''}<br>` : ''}
                ${datosDefault.no_factura ? `DOC: <b style="font-size:16px">#${factura.no_factura || ''}</b><br>` : ''}
                ${datosDefault.comprobante
                  ? (datosDGII
                      ? `<b style="color: #1e40af;">e-NCF: ${datosDGII.ecf}</b><br>`
                      : `NCF: ${factura.comprobante || ''}<br>`)
                  : ''}
                ${datosDefault.nombre_cliente ? `CLIENTE: ${factura.nombre_cliente || 'SIN REGISTRO'}<br>` : ''}
                ${datosDefault.rnc ? `CEDULA/RNC: ${cliente.rnc || 'N/A'}<br>` : ''}
                ${datosDefault.telefono_cliente ? `TELEFONO: ${cliente.telefono || 'SIN REGISTRO'}<br>` : ''}
                ${datosDefault.direccion_cliente ? `DIRECCION: ${cliente.direccion || 'SIN REGISTRO'}<br>` : ''}
                ${datosDefault.vendedor ? `VENDEDOR: ${factura.vendedor || ''}<br>` : ''}
                ${datosDefault.cajero ? `CAJERO: ${factura.cajero || ''}<br>` : ''}
                ${datosDefault.delivery ? `DELIVERY: ${delivery || ''}<br>` : ''}
                ${datosDefault.metodopago ? `METODO DE PAGO: ${factura.metodo_pago || ''}` : ''}
            </p>
        </div>
    </div>
</div>

            <div  class="bordeado" style="text-align:center;padding:3px">
                 ${factura.tipo_factura || ''}
            </div>
            <table cellspacing="0" cellpadding="0">
                <thead class="linea">
                    <tr>
                        <th class="" style="text-align:left;padding-top: 5px;padding-bottom: 5px;">CANT.</th>
                        ${datosDefault.empaque ? `<th class="precio" style="text-align:left;padding-top: 5px;padding-bottom: 5px;">EMPAQ.</th>` : ''}
                        <th class="precio" style="text-align:left;padding-top: 5px;padding-bottom: 5px;">PRECIO</th>
                        ${datosDefault.impuestos ? `<th class="precio" style="text-align:left;padding-top: 5px;padding-bottom: 5px;">${datosConfiguracion.nombre_impuesto || ''}</th>` : ''}
                        ${datosDefault.descuento ? `<th class="precio" style="text-align:left;padding-top: 5px;padding-bottom: 5px;">DESC</th>` : ''}
                        <th class="precio centrado" style="text-align:right;padding-top: 5px;padding-bottom: 5px;">TOTAL</th>
                    </tr>
                </thead>
                <tbody>
                    ${productosHTML}
                </tbody>
            </table>

            <div class="linea" style="margin-top: 30px;"></div>

            <div id="subtotal" style="font-weight: bold;">
                <table>
                    <tr>
                        <td>SUBTOTAL:</td>
                        <td style="text-align:right;"><span style="font-size: 1.5em !important;margin-top: 5px;margin-bottom: 5px;">${datosConfiguracion.simbolo || ''}${subtotal}</span></td>
                    </tr>
                </table>
            </div>

            <div id="descuento" style="font-weight: bold;">
                <table>
                    <tr>
                        <td>DESCUENTO:</td>
                        <td style="text-align:right;"><span style="font-size: 1.5em !important;margin-top: 5px;margin-bottom: 5px;">${datosConfiguracion.simbolo || ''}${factura.descuento || 0}</span></td>
                    </tr>
                </table>
            </div>

            <div id="impuesto" style="font-weight: bold;">
                <table>
                    <tr>
                        <td>${datosConfiguracion.nombre_impuesto || ''}:</td>
                        <td style="text-align:right;"><span style="font-size: 1.5em !important;margin-top: 5px;margin-bottom: 5px;">${datosConfiguracion.simbolo || ''}${factura.impuesto || 0}</span></td>
                    </tr>
                </table>
            </div>

            <div id="total" style="font-weight: bold;">
                <table>
                    <tr>
                        <td>TOTAL:</td>
                        <td style="text-align:right;"><span style="font-size: 1.5em !important;margin-top: 5px;margin-bottom: 5px;">${datosConfiguracion.simbolo || ''}${factura.total || 0}</span></td>
                    </tr>
                </table>
            </div>

             ${abonado ? `<div id="abonado" style="font-weight: bold;">
                <table>
                    <tr>
                        <td>ABONADO:</td>
                        <td style="text-align:right;"><span style="font-size: 1.5em !important;margin-top: 5px;margin-bottom: 5px;">${datosConfiguracion.simbolo || ''}${abonado}</span></td>
                    </tr>
                </table>
            </div>` : ''}

             ${pendiente ? `<div id="pendiente" style="font-weight: bold;">
                <table>
                    <tr>
                        <td>PENDIENTE:</td>
                        <td style="text-align:right;"><span style="font-size: 1.5em !important;margin-top: 5px;margin-bottom: 5px;">${datosConfiguracion.simbolo || ''}${pendiente}</span></td>
                    </tr>
                </table>
            </div>` : ''}
            ${abonado ? '' : `<div id="pagocon" style="font-weight: bold;">
                <table>
                    <tr>
                        <td>PAGO CON:</td>
                        <td style="text-align:right;"><span style="font-size: 1.5em !important;margin-top: 5px;margin-bottom: 5px;">${datosConfiguracion.simbolo || ''}${pagocon}</span></td>
                    </tr>
                </table>
            </div>

            <div id="sucambio" style="font-weight: bold;">
                <table>
                    <tr>
                        <td>SU CAMBIO:</td>
                        <td style="text-align:right;"><span style="font-size: 1.5em !important;margin-top: 5px;margin-bottom: 5px;">${datosConfiguracion.simbolo || ''}${sucambio}</span></td>
                    </tr>
                </table>
            </div>`}
            

            <div id="firma" class="firma bordeado" style="min-height:50px">
                <center style="margin-top:30px">
                  Firma:____________________________________
                 </center>
            </div>

            <div id="nota" class="bordeado" style="min-height:50px">
              <p>${factura.nota ? String(factura.nota).replace(/\\n/g, '<br>') : ''}</p>
            </div>

            ${datosDGII ? `
            <!-- Comprobante Fiscal Electrónico (DGII) -->
            <div class="bordeado2" style="border:2px solid #1e40af; background: #eff6ff; padding:5px; margin-top:10px;">
                <center>
                  <p style="font-weight:bold; color:#1e40af; margin:5px 0;">COMPROBANTE FISCAL ELECTRÓNICO</p>
                  <div style="border:2px solid #1e40af; background:white; padding:3px; display:inline-block;">
                    <img src="${qrCodeDGII}" alt="QR DGII" width="120" height="120"/>
                  </div>
                  <p style="font-weight:bold; color:#1e3a8a; margin:8px 0 2px 0; font-size:${Number(printerConfig.fontSize) + 1}px;">CÓDIGO DE SEGURIDAD</p>
                  <p style="font-weight:bold; color:#1e3a8a; font-size:${Number(printerConfig.fontSize) + 6}px; letter-spacing: 2px; margin:5px 0;">${datosDGII.securityCode}</p>
                  <p style="color:#1e40af; font-size:${Number(printerConfig.fontSize) - 1}px; margin:5px 0;">Firma: ${datosDGII.signedDate}</p>
                </center>
            </div>
            ` : ''}

            ${!datosDGII && qrCodeData ? `
            <div id="qrcode" class="qr-code">
                <center>
                  <div class="bordeado2">
                   <img src="${qrCodeData}" alt="Codigo QR" width="150" height="150"/>
                   </div>
                 </center>
            </div>
            ` : ''}

        </div>
    </body>
    </html>
    `
}

const printTicket = async ({ factura, cliente, datosEmpresa }) => {
  const facturaData = parseJson(factura, {})
  const clienteData = parseJson(cliente, {})
  const datosLocalStorage = parseJson(datosEmpresa, {})

  const datosJSON = await envioElectron('datosarchivo')
  const printerConfig = {
    ...DEFAULT_PRINTER_CONFIG,
    ...(parseJson(datosJSON?.impresora, {}) || {})
  }
  const datosDefault = {
    ...DEFAULT_DATOS_DEFAULT,
    ...(parseJson(datosJSON?.datosDefault, {}) || {})
  }

  const datosConfiguracion =
    datosLocalStorage?.configuracion ||
    datosLocalStorage?.datosConfiguracion ||
    datosLocalStorage?.datosEmpresa?.configuracion ||
    {}
  const datosdeEmpresa =
    datosLocalStorage?.empresa ||
    datosLocalStorage?.datosEmpresa?.empresa ||
    {}
  const link = datosJSON?.VITE_LINKURL || ''
  const api = datosJSON?.VITE_LINK_API || ''
  const token = datosJSON?.VITE_TOKEN || ''

  let abonado = null
  let pendiente = null

  if (facturaData?.metodo_pago === 'CREDITO' && link && api && token) {
    try {
      const tokenCifrado = await encryptarPassword(token, 10)
      const response = await fetch(
        `${link}${api}/datoscampo/cuentas_cobrar/no_factura/${facturaData.no_factura}`,
        {
          method: 'GET',
          headers: {
            Authorization: `${tokenCifrado}`,
            'Content-Type': 'application/json'
          }
        }
      )

      if (response.ok) {
        const creditoData = await response.json()
        if (creditoData) {
          abonado = toNumber(facturaData.total) - toNumber(creditoData.saldo)
          pendiente = creditoData.saldo
        }
      }
    } catch (error) {
      console.error('Error al obtener los datos de credito:', error?.message || error)
    }
  }

  let datosOtro = []
  try {
    datosOtro = parseJson(facturaData?.otro, [])
  } catch {
    datosOtro = []
  }

  const pagocon = datosOtro?.[0]?.pagocon || 0
  const sucambio = datosOtro?.[0]?.sucambio || 0
  const delivery = datosOtro?.[0]?.delivery || ''

  let qrCodeData = ''
  if (link && facturaData?.no_factura) {
    try {
      const empresaId = datosdeEmpresa?.id || ''
      qrCodeData = await QRCode.toDataURL(
        `${link}/receipt/factura?factura=${facturaData.no_factura}${empresaId ? `&empresa=${empresaId}` : ''}`
      )
    } catch (error) {
      console.error('Error generando QR:', error?.message || error)
    }
  }

  // Extraer datos de DGII del campo "otro"
  let datosDGII = null
  let qrCodeDGII = ''
  try {
    const primerElemento = Array.isArray(datosOtro) ? datosOtro[0] : datosOtro
    if (primerElemento && typeof primerElemento === 'object') {
      const respuestaAlanube =
        primerElemento.alanubeResponse && typeof primerElemento.alanubeResponse === 'object'
          ? primerElemento.alanubeResponse
          : {}
      const datosElectronicos = {
        ...respuestaAlanube,
        ...primerElemento
      }
      const qrUrlDGII = datosElectronicos.documentStampUrl
      const ecfDGII =
        datosElectronicos.documentNumber || datosElectronicos.ecf || datosElectronicos.encf
      if (qrUrlDGII && ecfDGII) {
        datosDGII = {
          rnc: datosElectronicos.rnc || datosElectronicos.companyIdentification,
          ecf: ecfDGII,
          internalTrackId: datosElectronicos.internalTrackId || datosElectronicos.id,
          securityCode: datosElectronicos.securityCode,
          qr_url: qrUrlDGII,
          signedDate: datosElectronicos.signedDate || datosElectronicos.signatureDate
        }
        // Generar QR de DGII
        qrCodeDGII = await QRCode.toDataURL(datosDGII.qr_url)
        console.log('✅ QR de DGII generado para ticket:', facturaData.no_factura)
      }
    }
  } catch (e) {
    console.warn('No se pudieron extraer datos de DGII para ticket:', e)
  }

  const htmlContent = buildTicketHtml({
    factura: facturaData,
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
    pendiente,
    datosDGII,
    qrCodeDGII
  })

  await printHtml(htmlContent)
}

defineExpose({ printTicket })
</script>

<template>
  <div style="display: none"></div>
</template>
