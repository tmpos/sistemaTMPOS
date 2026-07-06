<script setup>
import { ref, onMounted } from 'vue'
import QRCode from 'qrcode'
import { formatoMonedaRD, envioElectron } from '@/funciones/funciones.js'
import { jsPDF } from 'jspdf'
import html2canvas from 'html2canvas'
import Dialog from 'primevue/dialog'
import Button from 'primevue/button'

const configData = ref({})
const showPreview = ref(false)
const htmlContent = ref('')
const noCotizacionActual = ref('')

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
  institucion: false,
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

const loadConfig = async () => {
  try {
    const config = await envioElectron('datosarchivo')
    configData.value = config || {}
    return config
  } catch (error) {
    console.error('Error cargando configuracion:', error)
    return {}
  }
}

const generateCotizacionHtml = async ({ cotizacion, cliente, datosEmpresa }) => {
  const datosJSON = configData.value
  const link = datosJSON?.VITE_LINKURL || ''
  const usuarioLocal = datosEmpresa?.usuarioLocal || [{ nombre: 'Usuario' }]
  const printerConfig = {
    ...DEFAULT_PRINTER_CONFIG,
    ...parseJson(datosJSON?.impresora, {})
  }

  const datosDefault = {
    ...DEFAULT_DATOS_DEFAULT,
    ...parseJson(datosJSON?.datosDefault, {})
  }

  const empresa = datosEmpresa?.empresa || {}
  const datosConfiguracion = datosEmpresa?.configuracion || {}

  let qrCodeData = ''
  try {
    qrCodeData = await QRCode.toDataURL(`${link}/receipt/factura?cotizacion=${cotizacion.no_cotizacion}`)
  } catch (e) {
    console.error('Error generando QR:', e)
  }

  const entidadRaw = String(cotizacion.entidad_financiera || '').trim()
  const tieneInstitucion = entidadRaw !== '' && entidadRaw !== 'N/A' && entidadRaw.toUpperCase() !== 'NINGUNA'
  const totalInstDB = Number(cotizacion.total_institucion || 0)
  const totalCliDB = Number(cotizacion.total_cliente || 0)
  const tieneSplit = totalInstDB > 0 || totalCliDB > 0
  const mostrarSplitTotales = tieneInstitucion || tieneSplit
  const displayTotalInstitucion = tieneSplit ? totalInstDB : (tieneInstitucion ? Number(cotizacion.total || 0) : 0)
  const displayTotalCliente = tieneSplit ? totalCliDB : 0

  const productos = typeof cotizacion.productos === 'string'
    ? JSON.parse(cotizacion.productos)
    : cotizacion.productos || []

  const productosHTML = productos.map((producto) => {
    const precioBase = parseFloat(producto.precio_venta || producto.precio_final || 0)
    const cantidad = parseFloat(producto.cantidad || 0)
    const impuestoLinea = parseFloat(producto.impuesto || 0) * cantidad
    const descuentoLinea = parseFloat(producto.descuento || 0)
    const totalProducto = (precioBase * cantidad) + impuestoLinea - descuentoLinea
    const totalImpuestos = parseFloat(producto.impuesto || 0) * parseFloat(producto.cantidad)
    return `
      <tr class="invoice_line">
        <td class="px-1" style="vertical-align: middle;">${producto.codigo || ''}</td>
        <td class="px-1" style="vertical-align: middle;">${producto.nombre || ''}</td>
        <td class="text-center" style="vertical-align: middle;">${producto.cantidad || 0}</td>
        <td class="text-right pr-2" style="vertical-align: middle;">${formatoMonedaRD(producto.precio_venta)}</td>
        ${datosDefault.impuestos ? `<td class="text-right pr-2" style="vertical-align: middle;">${formatoMonedaRD(totalImpuestos)}</td>` : ''}
        ${datosDefault.descuento ? `<td class="text-right pr-2" style="vertical-align: middle;">${formatoMonedaRD(Number(producto.descuento || 0))}</td>` : ''}
        <td class="text-right pr-2" style="vertical-align: middle;"><b>${formatoMonedaRD(totalProducto)}</b></td>
      </tr>
    `
  }).join('')

  const filasMinimas = 6
  const filasFaltantes = Math.max(0, filasMinimas - productos.length)
  let filasRelleno = ''
  for (let i = 0; i < filasFaltantes; i++) {
    filasRelleno += '<tr class="invoice_line">'
    filasRelleno += '<td style="border-left: 1px solid darkblue; vertical-align: middle;" class="px-1 py-1">&nbsp;</td>'
    filasRelleno += '<td style="border-left: 1px solid darkblue; vertical-align: middle;" class="px-1 py-1">&nbsp;</td>'
    filasRelleno += '<td style="border-left: 1px solid darkblue; vertical-align: middle;" class="px-1 py-1">&nbsp;</td>'
    filasRelleno += '<td style="border-left: 1px solid darkblue; vertical-align: middle;" class="px-1 py-1">&nbsp;</td>'
    if (datosDefault.impuestos) {
      filasRelleno += '<td style="border-left: 1px solid darkblue; vertical-align: middle;" class="px-1 py-1">&nbsp;</td>'
    }
    if (datosDefault.descuento) {
      filasRelleno += '<td style="border-left: 1px solid darkblue; vertical-align: middle;" class="px-1 py-1">&nbsp;</td>'
    }
    filasRelleno += '<td style="border-left: 1px solid darkblue; vertical-align: middle;" class="px-1 py-1">&nbsp;</td>'
    filasRelleno += '</tr>'
  }

  const htmlContent = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Cotizacion ${cotizacion.no_cotizacion}</title>
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
    #tabla th {
      border-bottom: 1px solid darkblue;
      vertical-align: middle;
      padding: 4px 2px;
    }
    #tabla td { vertical-align: middle; font-size: 10pt; }
    th { text-align: center; font-weight: normal; vertical-align: middle; }
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
    .bg-gray-8000 { background-color: #1f2937 }
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
        <table class="text-right text-sm w-full" style="border-collapse: collapse;">
          <tr><td class="px-1 text-left" style="vertical-align: middle; padding: 2px 4px;">Fecha</td><td class="px-1" style="vertical-align: middle; padding: 2px 4px;">${cotizacion.fecha_emision || ''}</td></tr>
          <tr><td class="px-1 text-left" style="vertical-align: middle; padding: 2px 4px;">Cotizacion #</td><td class="px-1" style="vertical-align: middle; padding: 2px 4px;">${cotizacion.no_cotizacion || ''}</td></tr>
          ${cotizacion.vencimiento ? `<tr><td class="px-1 text-left" style="vertical-align: middle; padding: 2px 4px;">Vencimiento</td><td class="px-1" style="vertical-align: middle; padding: 2px 4px;">${cotizacion.vencimiento}</td></tr>` : ''}
        </table>
        <h2 class="text-center font-bold mt-4 border-y border-black bg-gray-8000 text-white rounded-md" style="line-height: 32px; display: flex; align-items: center; justify-content: center; height: 32px; padding: 0; margin-top: 1rem;">
          COTIZACION
        </h2>
      </div>
    </div>

    <div class="border border-black flex justify-between items-start mt-4 rounded-md">
      <div class="p-2 w-full">
        ${datosDefault.nombre_cliente ? `<p><strong>CLIENTE:</strong> ${cotizacion.nombre_cliente || 'SIN REGISTRO'}</p>` : ''}
        ${datosDefault.telefono_cliente ? `<p><strong>TELEFONO:</strong> ${cliente?.telefono || cotizacion.telefono_cliente || 'N/A'}</p>` : ''}
        ${datosDefault.rnc ? `<p><strong>RNC/CEDULA:</strong> ${cliente?.rnc || cotizacion.rnc_cliente || 'N/A'}</p>` : ''}
        ${datosDefault.direccion_cliente ? `<p><strong>DIRECCION:</strong> ${cliente?.direccion || cotizacion.direccion_cliente || 'N/A'}</p>` : ''}
        <p><strong>INSTITUCION:</strong> ${cotizacion.entidad_financiera || 'N/A'}</p>
      </div>
      <div class="p-2">
        ${qrCodeData ? `<img src="${qrCodeData}" alt="QR" style="width: 110px;">` : ''}
      </div>
    </div>

    <table id="tabla" class="mt-4 text-xs">
      <thead class="border border-black bg-gray-8000 text-white">
        <tr style="height: 32px;">
          <th class="px-1" style="vertical-align: middle;">COD</th>
          <th class="px-1" style="vertical-align: middle;">PRODUCTO</th>
          <th class="px-1" style="vertical-align: middle;">CANT</th>
          <th class="px-1" style="vertical-align: middle;">PRECIO</th>
          ${datosDefault.impuestos ? '<th class="px-1" style="vertical-align: middle;">ITBIS</th>' : ''}
          ${datosDefault.descuento ? '<th class="px-1" style="vertical-align: middle;">DESC</th>' : ''}
          <th class="px-1" style="vertical-align: middle;">TOTAL</th>
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
          ${cotizacion.nombre_cliente || 'SIN REGISTRO'}
        </div>
      </div>

    <div class="mt-4 text-right space-y-1">
                <div class="border border-black p-2 rounded-lg">
      <div>Subtotal: ${formatoMonedaRD(cotizacion.subtotal || (Number(cotizacion.total || 0) + Number(cotizacion.descuento || 0) - Number(cotizacion.impuesto || 0)))}</div>
      ${datosDefault.descuento ? `<div>Descuento: ${formatoMonedaRD(cotizacion.descuento || 0)}</div>` : ''}
      ${datosDefault.impuestos ? `<div>Impuesto: ${formatoMonedaRD(cotizacion.impuesto || 0)}</div>` : ''}
      <div class="font-bold">Total: ${formatoMonedaRD(cotizacion.total || 0)}</div>
      ${mostrarSplitTotales ? `
        <div class="font-bold">Total Cliente: ${formatoMonedaRD(displayTotalCliente)}</div>
        <div class="font-bold">Total Institución: ${formatoMonedaRD(displayTotalInstitucion)}</div>
      ` : ''}
    </div>
    </div>
    </div>

    ${cotizacion.nota ? `<div class="mt-4 border p-2 rounded-md"><strong>Nota:</strong> ${cotizacion.nota}</div>` : ''}
  </div>
</body>
</html>
  `

  return htmlContent
}

const printCotizacion = async ({ cotizacion, cliente, datosEmpresa }) => {
  try {
    await loadConfig()
    noCotizacionActual.value = cotizacion.no_cotizacion || ''
    htmlContent.value = await generateCotizacionHtml({ cotizacion, cliente, datosEmpresa })
    showPreview.value = true
    return { success: true }
  } catch (error) {
    console.error('Error al generar cotizacion PDF:', error)
    throw error
  }
}

const imprimirCotizacion = () => {
  const iframe = document.getElementById('cotizacion-preview-iframe')
  if (iframe?.contentWindow) {
    iframe.contentWindow.focus()
    iframe.contentWindow.print()
  }
}

const generarPdfBlobCotizacion = async () => {
  const iframe = document.getElementById('cotizacion-preview-iframe')
  const iframeDoc = iframe?.contentWindow?.document
  const cotizacionRoot =
    iframeDoc?.querySelector('.max-w-3xl') ||
    iframeDoc?.querySelector('body')

  if (!cotizacionRoot) {
    throw new Error('No se pudo acceder al contenido de la vista previa')
  }

  const originalWidth = cotizacionRoot.style.width
  const originalMaxWidth = cotizacionRoot.style.maxWidth
  cotizacionRoot.style.width = '816px'
  cotizacionRoot.style.maxWidth = '816px'

  let canvas
  try {
    canvas = await html2canvas(cotizacionRoot, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
      logging: false,
      windowWidth: 816,
      windowHeight: cotizacionRoot.scrollHeight
    })
  } finally {
    cotizacionRoot.style.width = originalWidth
    cotizacionRoot.style.maxWidth = originalMaxWidth
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

const descargarPdfCotizacion = async () => {
  const pdfBlob = await generarPdfBlobCotizacion()
  const fileName = `Cotizacion_${noCotizacionActual.value || 'sin_numero'}.pdf`
  const pdfUrl = URL.createObjectURL(pdfBlob)
  const link = document.createElement('a')
  link.href = pdfUrl
  link.download = fileName
  link.click()
  setTimeout(() => URL.revokeObjectURL(pdfUrl), 2000)
}

const compartirPdfCotizacion = async () => {
  const pdfBlob = await generarPdfBlobCotizacion()
  const fileName = `Cotizacion_${noCotizacionActual.value || 'sin_numero'}.pdf`
  const file = new File([pdfBlob], fileName, { type: 'application/pdf' })

  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    await navigator.share({
      title: `Cotizacion #${noCotizacionActual.value || ''}`,
      text: 'Compartir cotizacion en PDF',
      files: [file]
    })
    return
  }

  await descargarPdfCotizacion()
}

const closePreview = () => {
  showPreview.value = false
  htmlContent.value = ''
}

const showServidor = ref(false)
const servidorUrl = ref('')

const verVersionServidor = () => {
  const link = configData.value?.VITE_LINKURL || ''
  servidorUrl.value = `${link}/receipt/factura?cotizacion=${noCotizacionActual.value}`
  showServidor.value = true
}

defineExpose({
  printCotizacion,
  generateCotizacionHtml,
  loadConfig
})

onMounted(async () => {
  await loadConfig()
})
</script>

<template>
  <Dialog
    v-model:visible="showPreview"
    modal
    header="Vista Previa de Cotizacion"
    :style="{ width: '80vw' }"
  >
    <div v-if="htmlContent" class="pdf-preview">
      <iframe
        id="cotizacion-preview-iframe"
        title="Cotizacion Preview"
        :srcdoc="htmlContent"
        style="width: 100%; height: 75vh; border: none;"
      ></iframe>
    </div>
    <template #footer>
      <div class="flex justify-between w-full">
        <Button label="Cerrar" text severity="secondary" @click="closePreview" />
        <div class="flex gap-2">
          <Button label="Versión Servidor" icon="pi pi-external-link" severity="secondary" @click="verVersionServidor" outlined />
          <Button label="Compartir PDF" icon="pi pi-share-alt" severity="help" @click="compartirPdfCotizacion" outlined />
          <Button label="Descargar PDF" icon="pi pi-download" severity="info" @click="descargarPdfCotizacion" outlined />
          <Button label="Imprimir" icon="pi pi-print" @click="imprimirCotizacion" />
        </div>
      </div>
    </template>
  </Dialog>

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
      title="Cotizacion Servidor"
    ></iframe>
    <template #footer>
      <Button label="Cerrar" text severity="secondary" @click="showServidor = false" />
    </template>
  </Dialog>
</template>
