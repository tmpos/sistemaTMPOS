<script setup>
import { ref } from 'vue'
import QRCode from 'qrcode'
import { getDgiiStampUrl, getInvoiceDocumentLabel } from '@/views/Vender/venderCore.js'
import { formatoMonedaRD, peticionesFetch, peticionesFetchOffline, encryptarPassword,envioElectron } from '@/funciones/funciones.js'
import { jsPDF } from 'jspdf'
import html2canvas from 'html2canvas'
//import { initConfigDB, getAllConfig } from '@/server/verificaConfig.js'
import Swal from 'sweetalert2'
import Dialog from 'primevue/dialog'
import Button from 'primevue/button'

const configData = ref({})
const showServidor = ref(false)
const servidorUrl = ref('')

const DEFAULT_PRINTER_CONFIG = {
  fontSize: '10',
  fontFamily: 'arial',
  logoWidth: '150'
}

const DEFAULT_DATOS_DEFAULT = {
  logo: true,
  direccion: true,
  telefono: true,
  email: true,
  legal: false,
  rnc: true,
  nombre_cliente: true,
  telefono_cliente: true,
  direccion_cliente: true,
  impuestos: true,
  descuento: true
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

// Cargar configuracion
const loadConfig = async () => {
  try {
  //  await initConfigDB()
   // const config = await getAllConfig()
    const config = await envioElectron('datosarchivo');
    configData.value = config || {}
    return config
  } catch (error) {
    console.error('Error cargando configuracion:', error)
    return {}
  }
}

// Generar HTML de la factura
const generateFacturaHtml = async ({ factura, cliente, datosEmpresa, creditoData = null }) => {
  const datosJSON = configData.value
  const link = datosJSON?.VITE_LINKURL || ''

  const printerConfig = {
    ...DEFAULT_PRINTER_CONFIG,
    ...parseJson(datosJSON?.impresora, {})
  }

  const datosDefault = {
    ...DEFAULT_DATOS_DEFAULT,
    ...parseJson(datosJSON?.datosDefault, {})
  }

  const empresa =
    datosEmpresa?.empresa ||
    datosEmpresa?.datosEmpresa?.empresa ||
    {}
  const datosConfiguracion =
    datosEmpresa?.configuracion ||
    datosEmpresa?.datosConfiguracion ||
    datosEmpresa?.datosEmpresa?.configuracion ||
    {}
  const usuarioLocal =
    datosEmpresa?.usuarioLocal ||
    datosEmpresa?.datosEmpresa?.usuario ||
    [{ nombre: 'Usuario' }]
  const tablaDefault =
    datosEmpresa?.tabladefault ||
    datosEmpresa?.datosEmpresa?.tabladefault ||
    {}

  // Extraer datos de DGII del campo "otro"
  let datosDGII = null
  let qrCodeDGII = ''
  try {
    const otroData = typeof factura.otro === 'string' ? JSON.parse(factura.otro) : factura.otro
    const primerElemento = Array.isArray(otroData) ? otroData[0] : otroData
    if (primerElemento && typeof primerElemento === 'object') {
      const respuestaAlanube =
        primerElemento.alanubeResponse &&
        typeof primerElemento.alanubeResponse === 'object'
          ? primerElemento.alanubeResponse
          : {}
      const datosElectronicos = { ...respuestaAlanube, ...primerElemento }
      const qrUrlDGII = getDgiiStampUrl(datosElectronicos)
      const ecfDGII =
        datosElectronicos.documentNumber ||
        datosElectronicos.ecf ||
        datosElectronicos.encf
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
        console.log('✅ QR de DGII generado para factura:', factura.no_factura)
      }
    }
  } catch (e) {
    console.warn('No se pudieron extraer datos de DGII:', e)
  }
  const etiquetaDocumento = getInvoiceDocumentLabel(factura, datosDGII?.ecf)

  // Generar QR de la factura interna
  let qrCodeData = ''
  try {
    const empresaId = empresa?.id || ''
    qrCodeData = await QRCode.toDataURL(`${link}/receipt/factura?factura=${factura.no_factura}${empresaId ? `&empresa=${empresaId}` : ''}`)
  } catch (e) {
    console.error('Error generando QR:', e)
  }

  // Generar tabla de productos
  const productos = typeof factura.productos === 'string'
    ? JSON.parse(factura.productos)
    : factura.productos || []

  const productosProcesados = productos.map((producto) => {
    const cantidad = toNumber(producto.cantidad, 0)
    const precioUnidad = toNumber(producto.precio_final || producto.precio_venta, 0)
    const descuento = toNumber(producto.descuento, 0)
    const impuestoUnitario = toNumber(producto.impuesto_venta || producto.impuesto, 0)
    const totalProducto = (precioUnidad * cantidad) - descuento
    const totalImpuestos = impuestoUnitario * cantidad

    return {
      ...producto,
      cantidad,
      totalProducto,
      totalImpuestos
    }
  })

  const totalImpuestosCalculados = productosProcesados.reduce(
    (sum, producto) => sum + toNumber(producto.totalImpuestos, 0),
    0
  )

  const totalImpuestoMostrar =
    totalImpuestosCalculados > 0
      ? totalImpuestosCalculados
      : toNumber(factura.impuesto, 0)

  const productosHTML = productosProcesados.map((producto) => {
    return `
      <tr class="invoice_line">
        <td class="px-1">${producto.codigo || ''}</td>
        <td class="px-1">${producto.nombre || ''}</td>
        <td class="text-center">${producto.cantidad || 0}</td>
        <td class="text-right pr-2">${formatoMonedaRD(producto.precio_venta)}</td>
        ${datosDefault.impuestos ? `<td class="text-right pr-2">${formatoMonedaRD(producto.totalImpuestos)}</td>` : ''}
        ${datosDefault.descuento ? `<td class="text-right pr-2">${formatoMonedaRD(Number(producto.descuento || 0))}</td>` : ''}
        <td class="text-right pr-2"><b>${formatoMonedaRD(producto.totalProducto)}</b></td>
      </tr>
    `
  }).join('')

  // Filas de relleno
  const filasMinimas = 6
  const filasFaltantes = Math.max(0, filasMinimas - productos.length)
  let filasRelleno = ''
  for (let i = 0; i < filasFaltantes; i++) {
    filasRelleno += '<tr class="invoice_line">'
    filasRelleno += '<td style="border-left: 1px solid darkblue;" class="px-1 py-1">&nbsp;</td>'
    filasRelleno += '<td style="border-left: 1px solid darkblue;" class="px-1 py-1">&nbsp;</td>'
    filasRelleno += '<td style="border-left: 1px solid darkblue;" class="px-1 py-1">&nbsp;</td>'
    filasRelleno += '<td style="border-left: 1px solid darkblue;" class="px-1 py-1">&nbsp;</td>'
    if (datosDefault.impuestos) {
      filasRelleno += '<td style="border-left: 1px solid darkblue;" class="px-1 py-1">&nbsp;</td>'
    }
    if (datosDefault.descuento) {
      filasRelleno += '<td style="border-left: 1px solid darkblue;" class="px-1 py-1">&nbsp;</td>'
    }
    filasRelleno += '<td style="border-left: 1px solid darkblue;" class="px-1 py-1">&nbsp;</td>'
    filasRelleno += '</tr>'
  }

  const esCredito = String(factura?.metodo_pago || '').toUpperCase() === 'CREDITO'
  const credito = Array.isArray(creditoData) ? (creditoData[0] || {}) : (creditoData || {})
  const institucionFactura = String(
    factura?.financiera ||
    factura?.institucion ||
    factura?.entidad_financiera ||
    credito?.institucion ||
    ''
  ).trim()
  const tieneInstitucionCredito = esCredito &&
    institucionFactura &&
    !['NINGUNA', 'N/A', 'NA', 'SIN INSTITUCION'].includes(institucionFactura.toUpperCase())
  const totalFacturaNum = Number(factura?.total || 0)
  let totalClienteCredito = toNumber(factura?.total_cliente ?? credito?.total_cliente, 0)
  let totalInstitucionCredito = toNumber(factura?.total_institucion ?? credito?.total_institucion, 0)
  if (tieneInstitucionCredito && totalClienteCredito === 0 && totalInstitucionCredito === 0) {
    totalInstitucionCredito = totalFacturaNum
  }
  const pendienteNum = Number(credito?.saldo ?? factura?.saldo ?? 0)
  let abonadoNum = credito?.abonado ?? '0.00'
  if (abonadoNum == null || abonadoNum === '') {
    abonadoNum = Math.max(0, totalFacturaNum - pendienteNum)
  }
  abonadoNum = Number(abonadoNum || 0)

  const htmlContent = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Factura ${factura.no_factura}</title>
  <script src="https://cdn.tailwindcss.com"><\/script>
  <style>
    * { box-sizing: border-box; }
    body { font-family: Arial, sans-serif; font-size: 12px; }

    #tabla {
      border: 0.5pt solid darkblue;
      border-collapse: collapse;
      border-spacing: 0;
      width: 100%;
    }

    #tabla th, #tabla td { border-left: 1px solid darkblue; }
    #tabla th:first-child, #tabla td:first-child { border-left: none; }
    #tabla th { border-bottom: 1px solid darkblue; }
    #tabla td { vertical-align: top; font-size: 10pt; }
    th { text-align: center; font-weight: normal; }
    .invoice_line { height: 6mm; }
    .invoice_line td, .invoice_line th { padding: 0.5mm 1mm; }

    @media print {
      * {
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      @page {
        size: letter;
        margin: 10mm;
      }
    }

    .px-1 { padding-left: 0.25rem; padding-right: 0.25rem; }
    .px-2 { padding-left: 0.5rem; padding-right: 0.5rem; }
    .py-1 { padding-top: 0.25rem; padding-bottom: 0.25rem; }
    .py-2 { padding-top: 0.5rem; padding-bottom: 0.5rem; }
    .p-2 { padding: 0.5rem; }
    .p-4 { padding: 1rem; }
    .mt-2 { margin-top: 0.5rem; }
    .mt-4 { margin-top: 1rem; }
    .mb-2 { margin-bottom: 0.5rem; }
    .text-xs { font-size: 0.75rem; }
    .text-sm { font-size: 0.875rem; }
    .text-center { text-align: center; }
    .text-right { text-align: right; }
    .text-left { text-align: left; }
    .text-justify { text-align: justify; }
    .font-bold { font-weight: bold; }
    .border { border: 1px solid #000; }
    .border-black { border-color: #000; }
    .rounded-md { border-radius: 0.375rem; }
    .rounded-lg { border-radius: 0.5rem; }
    .bg-gray-8000 { background-color: #175C8A }
    .text-white { color: #fff; }
    .w-full { width: 100%; }
    .w-1\/3 { width: 33.333%; }
    .max-w-3xl { max-width: 48rem; }
    .mx-auto { margin-left: auto; margin-right: auto; }
    .flex { display: flex; }
    .justify-between { justify-content: space-between; }
    .items-start { align-items: flex-start; }
    .space-y-1 > * + * { margin-top: 0.25rem; }
    .leading-4 { line-height: 1rem; }
    .shadow-sm { box-shadow: 0 1px 2px rgba(0,0,0,0.05); }
    .border-y { border-top: 1px solid; border-bottom: 1px solid; }
    .pr-2 { padding-right: 0.5rem; }
  </style>
</head>
<body class="p-4 text-xs font-sans">
  <div class="max-w-3xl mx-auto p-4">
    <!-- Encabezado -->
    <div class="flex justify-between items-start">
      <div>
        ${datosDefault.logo && empresa.logoprinter
          ? `<img src="${empresa.logoprinter}" alt="Logo" style="max-width: ${printerConfig.logoWidth}px">`
          : `<div style="font-size:${Number(printerConfig.fontSize) + 8}px !important;font-weight:bold">${empresa.nombre || ''}</div>`
        }
        <p class="leading-4">
          ${datosDefault.legal && empresa.legal ? empresa.legal + '<br>' : ''}
          ${datosDefault.telefono && empresa.telefono ? empresa.telefono + '<br>' : ''}
          ${datosDefault.email && empresa.email ? empresa.email + '<br>' : ''}
          ${datosDefault.direccion && empresa.direccion ? empresa.direccion : ''}
        </p>
      </div>

      <div class="text-right space-y-1 border px-2 py-1 rounded-md">
        <table class="text-right text-sm w-full">
          <tr><td class="px-1 text-left">Fecha</td><td class="px-1">${factura.fecha_emision || ''}</td></tr>
          <tr><td class="px-1 text-left">Factura #</td><td class="px-1">${factura.no_factura || ''}</td></tr>
          ${datosDGII
            ? `<tr><td class="px-1 text-left font-bold text-blue-700">e-NCF</td><td class="px-1 font-mono font-bold text-blue-700">${datosDGII.ecf}</td></tr>`
            : `<tr><td class="px-1 text-left">NCF</td><td class="px-1">${factura.tipo_factura || ''}</td></tr>
               ${factura.comprobante && factura.comprobante !== 'SIN COMPROBANTE'
                 ? `<tr><td class="px-1 text-left">COMPROBANTE #</td><td class="px-1">${factura.comprobante}</td></tr>`
                 : ''
               }`
          }
        </table>
        <h2 class="text-center font-bold mt-4 border-y border-black py-1 bg-gray-8000 text-white rounded-md">
          ${etiquetaDocumento}
        </h2>

      </div>
    </div>

    <!-- Cliente y QR -->
    <div class="border border-black flex justify-between items-start mt-4 rounded-md">
      <div class="p-2 w-full">
        ${datosDefault.nombre_cliente ? `<p><strong>CLIENTE:</strong> ${factura.nombre_cliente || 'SIN REGISTRO'}</p>` : ''}
        ${datosDefault.telefono_cliente ? `<p><strong>TELEFONO:</strong> ${cliente?.telefono || 'N/A'}</p>` : ''}
        ${datosDefault.rnc ? `<p><strong>RNC/CEDULA:</strong> ${cliente?.rnc || 'N/A'}</p>` : ''}
        ${datosDefault.direccion_cliente ? `<p><strong>DIRECCION:</strong> ${cliente?.direccion || 'N/A'}</p>` : ''}
        <p><strong>METODO DE PAGO:</strong> ${factura.metodo_pago || 'N/A'}</p>
        ${tieneInstitucionCredito ? `<p><strong>INSTITUCION:</strong> ${institucionFactura}</p>` : ''}
      </div>
      <div class="text-center p-1 rounded-md" style="min-width: 140px;">
        ${datosDGII
          ? `<img src="${qrCodeDGII}" alt="QR DGII" style="width: 105px; height: 105px; margin: 0 auto;"/>
             <p style="font-size:10px;font-weight:bold;margin:2px 0 0;">CÓDIGO DE SEGURIDAD</p>
             <p style="font-size:14px;font-family:monospace;font-weight:bold;margin:0;">${datosDGII.securityCode || ''}</p>`
          : qrCodeData
            ? `<img src="${qrCodeData}" alt="QR interno" style="max-width: 100px; max-height: 100px;"/>`
            : ''}
      </div>
    </div>

    <!-- Tabla de productos -->
    <table class="w-full text-left mt-2 border border-black" id="tabla">
      <thead class="border border-black bg-gray-8000 text-white">
        <tr>
          <th class="border border-black px-1 py-1">COD</th>
          <th class="border border-black px-1 py-1">DESCRIPCION</th>
          <th class="border border-black px-1 py-1">CANT.</th>
          <th class="border border-black px-1 py-1">P.U</th>
          ${datosDefault.impuestos ? `<th class="border border-black px-1 py-1">${datosConfiguracion?.nombre_impuesto || 'ITBIS'}</th>` : ''}
          ${datosDefault.descuento ? `<th class="border border-black px-1 py-1">DESC</th>` : ''}
          <th class="border border-black px-1 py-1">SUBTOTAL</th>
        </tr>
      </thead>
      <tbody>
        ${productosHTML}
        ${filasRelleno}
      </tbody>
    </table>

    <!-- Totales -->
    <div class="flex justify-between mt-2">
      <!-- Firmas -->
      <div class="w-1/3">
        <div class="">
        <br>
          ___________________________________________
          <b> ENTREGADO POR:</b>  <br> 
          ${usuarioLocal[0]?.nombre || 'Usuario'}
        </div>
        <br>
        <div class="">
          ___________________________________________
          <b>RECIBIDO POR:</b><br>
          ${factura.nombre_cliente || 'SIN REGISTRO'}
        </div>
      </div>

      <div class="w-1/3 rounded-lg border shadow-sm">
        <table class="text-right text-sm w-full">
          <tr><td class="px-1">SUBTOTAL</td><td class="px-1">${formatoMonedaRD(factura.subtotal)}</td></tr>
          ${datosDefault.impuestos ? `<tr><td class="px-1">${datosConfiguracion?.nombre_impuesto || 'ITBIS'} (${datosConfiguracion?.impuesto || 18}%)</td><td class="px-1">${formatoMonedaRD(totalImpuestoMostrar)}</td></tr>` : ''}
          ${datosDefault.descuento ? `<tr><td class="px-1">DESC.</td><td class="px-1">${formatoMonedaRD(factura.descuento)}</td></tr>` : ''}
          <tr class="font-bold"><td class="px-1">TOTAL</td><td class="px-1">${formatoMonedaRD(factura.total)}</td></tr>
          ${
            // Si tiene institución (financiera diferente de vacío o Ninguna), mostrar Total Cliente y Total Institución
            tieneInstitucionCredito
              ? `<tr><td class="px-1 ">TOTAL CLIENTE</td><td class="px-1">${formatoMonedaRD(totalClienteCredito)}</td></tr>
              <tr><td class="px-1 font-bold">TOTAL INSTITUCION</td><td class="px-1 font-bold">${formatoMonedaRD(totalInstitucionCredito)}</td></tr>
            `
              // Si es crédito y NO tiene institución (o es Ninguna), mostrar ABONADO y PENDIENTE
              : esCredito
                ? `<tr><td class="px-1 font-bold">ABONADO</td><td class="px-1">${formatoMonedaRD(abonadoNum)}</td></tr>
                   <tr><td class="px-1 font-bold">PENDIENTE</td><td class="px-1">${formatoMonedaRD(pendienteNum)}</td></tr>`
                : ''
          }
        </table>
      </div>
    </div>

    <!-- Observaciones -->
    ${factura.nota ? `
    <div class="mt-4 text-justify">
      <p class="text-xs">
        <strong>OBSERVACION:</strong><br>
        ${factura.nota.replace(/\n/g, '<br>')}
      </p>
    </div>
    ` : ''}
  </div>
</body>
</html>
  `
  return htmlContent
}

const renderPdfBlobDesdeHtml = async (html, iframeId = 'factura-pdf-hidden-iframe') => {
  const htmlBlob = new Blob([html], { type: 'text/html' })
  const htmlUrl = URL.createObjectURL(htmlBlob)
  const iframe = document.createElement('iframe')
  iframe.id = iframeId
  iframe.src = htmlUrl
  iframe.style.position = 'fixed'
  iframe.style.left = '-10000px'
  iframe.style.top = '0'
  iframe.style.width = '816px'
  iframe.style.height = '1056px'
  iframe.style.opacity = '0'
  iframe.style.pointerEvents = 'none'
  document.body.appendChild(iframe)

  try {
    await new Promise((resolve, reject) => {
      iframe.onload = resolve
      iframe.onerror = reject
    })

    const iframeDoc = iframe?.contentWindow?.document
    const facturaRoot =
      iframeDoc?.querySelector('.max-w-3xl') ||
      iframeDoc?.querySelector('body')

    if (!facturaRoot) {
      throw new Error('No se pudo acceder al contenido de la factura')
    }

    const originalWidth = facturaRoot.style.width
    const originalMaxWidth = facturaRoot.style.maxWidth
    facturaRoot.style.width = '816px'
    facturaRoot.style.maxWidth = '816px'

    let canvas
    try {
      canvas = await html2canvas(facturaRoot, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff'
      })
    } finally {
      facturaRoot.style.width = originalWidth
      facturaRoot.style.maxWidth = originalMaxWidth
    }

    const imgData = canvas.toDataURL('image/png')
    const doc = new jsPDF('p', 'mm', 'letter')
    const pageWidth = doc.internal.pageSize.getWidth()
    const pageHeight = doc.internal.pageSize.getHeight()
    const margin = 8
    const renderWidth = pageWidth - (margin * 2)
    const renderHeight = (canvas.height * renderWidth) / canvas.width

    let heightLeft = renderHeight
    let position = margin
    doc.addImage(imgData, 'PNG', margin, position, renderWidth, renderHeight)
    heightLeft -= (pageHeight - (margin * 2))

    while (heightLeft > 0) {
      position = heightLeft - renderHeight + margin
      doc.addPage()
      doc.addImage(imgData, 'PNG', margin, position, renderWidth, renderHeight)
      heightLeft -= (pageHeight - (margin * 2))
    }

    return doc.output('blob')
  } finally {
    iframe.remove()
    URL.revokeObjectURL(htmlUrl)
  }
}

const generarPdfBlobFactura = async ({ factura, cliente, datosEmpresa, creditoData = null }) => {
  await loadConfig()

  if (String(factura?.metodo_pago || '').toUpperCase() === 'CREDITO' && !creditoData) {
    try {
      const datosCxC = await peticionesFetchOffline('getDataByField', 'cuentas_cobrar', 'no_factura', factura.no_factura)
      if (datosCxC) {
        creditoData = Array.isArray(datosCxC) ? datosCxC[0] : datosCxC
      }
    } catch (e) {
      console.warn('No se pudo obtener datos de cuentas_cobrar:', e)
    }
  }

  if (!cliente) {
    try {
      const datosCliente = await peticionesFetchOffline('getDataByField', 'clientes', 'codigo', factura.cod_cliente)
      if (datosCliente) {
        cliente = datosCliente
      }
    } catch (e) {
      console.warn('No se pudo obtener datos del cliente:', e)
    }
  }

  const html = await generateFacturaHtml({ factura, cliente, datosEmpresa, creditoData })
  return await renderPdfBlobDesdeHtml(html)
}

// Imprimir/mostrar PDF
const printFactura = async ({ factura, cliente, datosEmpresa, creditoData = null }) => {
  console.log("cliente", cliente);

  try {
    await loadConfig()

    // Si es CREDITO y no se pasó creditoData, buscarlo como fallback desde cuentas_cobrar
    if (String(factura?.metodo_pago || '').toUpperCase() === 'CREDITO' && !creditoData) {
      try {
        const datosCxC = await peticionesFetchOffline('getDataByField', 'cuentas_cobrar', 'no_factura', factura.no_factura)
         if (datosCxC) {
          creditoData = datosCxC
        }
      } catch (e) {
        console.warn('No se pudo obtener datos de cuentas_cobrar:', e)
      }
    }

    if (!cliente) {
      try {
        const datosCliente = await peticionesFetchOffline('getDataByField', 'clientes', 'codigo', factura.cod_cliente)
         if (datosCliente) {
          cliente = datosCliente
        }
      } catch (e) {
        console.warn('No se pudo obtener datos de cuentas_cobrar:', e)
      }
    }


    const html = await generateFacturaHtml({ factura, cliente, datosEmpresa, creditoData })
    const generarPdfBlobDesdeHtml = async () => {
      const iframe = document.getElementById('swal-factura-iframe')
      const iframeDoc = iframe?.contentWindow?.document
      const facturaRoot =
        iframeDoc?.querySelector('.max-w-3xl') ||
        iframeDoc?.querySelector('body')

      if (!facturaRoot) {
        throw new Error('No se pudo acceder al contenido de la vista previa')
      }

      const originalWidth = facturaRoot.style.width
      const originalMaxWidth = facturaRoot.style.maxWidth
      facturaRoot.style.width = '816px' // 8.5in * 96dpi
      facturaRoot.style.maxWidth = '816px'

      let canvas
      try {
        canvas = await html2canvas(facturaRoot, {
          scale: 2,
          useCORS: true,
          backgroundColor: '#ffffff'
        })
      } finally {
        facturaRoot.style.width = originalWidth
        facturaRoot.style.maxWidth = originalMaxWidth
      }

      const imgData = canvas.toDataURL('image/png')
      const doc = new jsPDF('p', 'mm', 'letter')
      const pageWidth = doc.internal.pageSize.getWidth()
      const pageHeight = doc.internal.pageSize.getHeight()
      const margin = 8
      const renderWidth = pageWidth - (margin * 2)
      const renderHeight = (canvas.height * renderWidth) / canvas.width

      let heightLeft = renderHeight
      let position = margin
      doc.addImage(imgData, 'PNG', margin, position, renderWidth, renderHeight)
      heightLeft -= (pageHeight - (margin * 2))

      while (heightLeft > 0) {
        position = heightLeft - renderHeight + margin
        doc.addPage()
        doc.addImage(imgData, 'PNG', margin, position, renderWidth, renderHeight)
        heightLeft -= (pageHeight - (margin * 2))
      }

      return doc.output('blob')
    }

    const descargarPdfDesdeHtml = async () => {
      const pdfBlob = await generarPdfBlobDesdeHtml()
      const fileName = `Factura_${factura?.no_factura || 'sin_numero'}.pdf`
      const pdfUrl = URL.createObjectURL(pdfBlob)
      const link = document.createElement('a')
      link.href = pdfUrl
      link.download = fileName
      link.click()
      setTimeout(() => URL.revokeObjectURL(pdfUrl), 2000)
    }

    const compartirPdfDesdeHtml = async () => {
      const pdfBlob = await generarPdfBlobDesdeHtml()
      const fileName = `Factura_${factura?.no_factura || 'sin_numero'}.pdf`
      const file = new File([pdfBlob], fileName, { type: 'application/pdf' })

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: `Factura #${factura?.no_factura || ''}`,
          text: 'Compartir factura en PDF',
          files: [file]
        })
        return
      }

      await descargarPdfDesdeHtml()
    }

    const htmlBlob = new Blob([html], { type: 'text/html' })
    const htmlUrl = URL.createObjectURL(htmlBlob)

    await Swal.fire({
      title: `Vista previa de factura #${factura?.no_factura || ''}`,
      width: '90%',
      html: `<iframe id="swal-factura-iframe" src="${htmlUrl}" style="width:100%; height:70vh; border:1px solid #ddd; border-radius:8px;"></iframe>`,
      showDenyButton: true,
      denyButtonText: 'Descargar PDF',
      showCancelButton: true,
      cancelButtonText: 'Cerrar',
      confirmButtonText: 'Imprimir',
      footer: '<div style="display:flex;gap:8px;justify-content:center;flex-wrap:wrap;"><button id="btn-compartir-pdf" style="background:#0ea5e9;color:white;border:none;padding:8px 14px;border-radius:8px;cursor:pointer;font-size:14px;">📤 Compartir PDF</button><button id="btn-version-servidor" style="background:#6c757d;color:white;border:none;padding:8px 14px;border-radius:8px;cursor:pointer;font-size:14px;">🌐 Versión Servidor</button></div>',
      preConfirm: () => {
        const iframe = document.getElementById('swal-factura-iframe')
        if (iframe?.contentWindow) {
          iframe.contentWindow.focus()
          iframe.contentWindow.print()
        }
      },
      preDeny: async () => {
        await descargarPdfDesdeHtml()
      },
      didOpen: () => {
        document.getElementById('btn-compartir-pdf')?.addEventListener('click', async () => {
          try {
            await compartirPdfDesdeHtml()
          } catch (error) {
            console.error('Error al compartir PDF:', error)
          }
        })

        document.getElementById('btn-version-servidor')?.addEventListener('click', () => {
          const link = configData.value?.VITE_LINKURL || ''
          const empresa = datosEmpresa?.empresa || datosEmpresa?.datosEmpresa?.empresa || {}
          const empresaId = empresa?.id || ''
          servidorUrl.value = `${link}/receipt/factura?factura=${factura?.no_factura}${empresaId ? `&empresa=${empresaId}` : ''}`
          showServidor.value = true
        })
      },
      didClose: () => {
        URL.revokeObjectURL(htmlUrl)
      }
    })

    return { success: true }
  } catch (error) {
    console.error('Error al generar factura PDF:', error)
    throw error
  }
}

// Exponer metodos
defineExpose({
  printFactura,
  generarPdfBlobFactura,
  generateFacturaHtml,
  loadConfig
})
</script>

<template>
  <div style="display:none"></div>

  <!-- Vista previa versión servidor -->
  <Dialog
    v-model:visible="showServidor"
    modal
    header="Vista Previa - Versión Servidor"
    :style="{ width: '80vw' }"
  >
    <iframe
      :src="servidorUrl"
      style="width: 100%; height: 75vh; border: none;"
      title="Factura Servidor"
    ></iframe>
    <template #footer>
      <Button label="Cerrar" text severity="secondary" @click="showServidor = false" />
    </template>
  </Dialog>
</template>
