<script setup>
import { ref } from 'vue'
import { jsPDF } from 'jspdf'
import html2canvas from 'html2canvas'
import QRCode from 'qrcode'
import Swal from 'sweetalert2'
import { envioElectron } from '@/funciones/funciones.js'

const configData = ref({})

const DEFAULT_PRINTER_CONFIG = {
  fontSize: '10',
  fontFamily: 'arial',
  logoWidth: '150'
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

const toNumber = (value) => {
  const n = Number(value)
  return Number.isFinite(n) ? n : 0
}

const toMoney = (value) =>
  new Intl.NumberFormat('es-DO', { style: 'currency', currency: 'DOP' }).format(toNumber(value))

const loadConfig = async () => {
  try {
    const config = await envioElectron('datosarchivo')
    configData.value = config || {}
    return config
  } catch (error) {
    console.error('Error cargando configuracion:', error)
    configData.value = {}
    return {}
  }
}

const generateCxcHtml = async ({ facturas, cliente, datosEmpresa }) => {
  const datosJSON = configData.value || {}
  const link = datosJSON?.VITE_LINKURL || ''
  const empresa = datosEmpresa?.empresa || {}
  const listado = Array.isArray(facturas) ? facturas : []

  const printerConfig = {
    ...DEFAULT_PRINTER_CONFIG,
    ...parseJson(datosJSON?.impresora, {})
  }

  let qrCodeData = ''
  try {
    if (link) {
      const tokenCliente = encodeURIComponent(cliente?.codigo || cliente?.id || '')
      qrCodeData = await QRCode.toDataURL(`${link}/cxc?cliente=${tokenCliente}`)
    }
  } catch {
    qrCodeData = ''
  }

  const rowsHtml = listado.map((f) => `
    <tr>
      <td>${f.no_emision || ''}</td>
      <td>${f.no_factura || ''}</td>
      <td>${f.fecha_emision || ''}</td>
      <td class="right">${toMoney(f.monto_credito)}</td>
      <td class="right">${toMoney(f.abonado)}</td>
      <td class="right"><b>${toMoney(f.saldo)}</b></td>
      <td class="center">${f.estatus || ''}</td>
    </tr>
  `).join('')

  const abonosRowsHtml = listado.flatMap((f) => {
    let pagos = []
    try {
      pagos = parseJson(f?.pagos, [])
      if (!Array.isArray(pagos)) pagos = []
    } catch {
      pagos = []
    }

    return pagos.map((p) => `
      <tr>
        <td>${f.no_factura || ''}</td>
        <td class="center">${p.nopago || ''}</td>
        <td>${p.fecha || ''}</td>
        <td>${p.hora || ''}</td>
        <td>${p.metodo || ''}</td>
        <td class="right">${toMoney(p.cantidad)}</td>
        <td class="right">${toMoney(p.saldo)}</td>
      </tr>
    `)
  }).join('')

  const totalCredito = listado.reduce((acc, f) => acc + toNumber(f.monto_credito), 0)
  const totalAbonado = listado.reduce((acc, f) => acc + toNumber(f.abonado), 0)
  const totalPendiente = listado.reduce((acc, f) => acc + toNumber(f.saldo), 0)

  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Estado de Cuenta CxC</title>
  <script src="https://cdn.tailwindcss.com"><\/script>
  <style>
    * { box-sizing: border-box; }
    body { font-family: Arial, sans-serif; font-size: 12px; color: #111827; }
    @media print {
      * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
      @page { size: letter; margin: 10mm; }
    }
    .wrap { max-width: 920px; margin: 0 auto; padding: 12px; }
    .box { border: 1px solid #111827; border-radius: 8px; }
    .title { background: #111827; color: #fff; font-weight: 700; border-radius: 8px; padding: 6px 10px; text-align: center; }
    table { width: 100%; border-collapse: collapse; }
    th, td { border: 1px solid #1f2937; padding: 6px; font-size: 11px; }
    th { background: #1f2937; color: #fff; font-weight: 600; }
    .right { text-align: right; }
    .center { text-align: center; }
    .grid2 { display: grid; grid-template-columns: 1fr 140px; gap: 10px; align-items: start; }
    .meta td { border: 0; padding: 2px 0; }
    .totals td { border: 0; padding: 3px 0; }
  </style>
</head>
<body>
  <div class="wrap">
    <div class="grid2">
      <div class="box" style="padding:10px;">
        ${empresa.logoprinter
          ? `<img src="${empresa.logoprinter}" alt="logo" style="max-width:${printerConfig.logoWidth}px;max-height:80px;" />`
          : `<div style="font-size:${Number(printerConfig.fontSize) + 8}px;font-weight:700;">${empresa.nombre || ''}</div>`
        }
        <div style="margin-top:6px;line-height:1.4;">
          ${empresa.legal ? `${empresa.legal}<br>` : ''}
          ${empresa.direccion ? `${empresa.direccion}<br>` : ''}
          ${(empresa.telefono || '') + (empresa.email ? ` / ${empresa.email}` : '')}
        </div>
      </div>
      <div class="box" style="padding:8px;text-align:center;">
        ${qrCodeData ? `<img src="${qrCodeData}" style="max-width:110px;max-height:110px;" />` : ''}
      </div>
    </div>

    <div style="margin-top:10px;" class="title">ESTADO DE CUENTA - CUENTAS POR COBRAR</div>

    <div class="box" style="margin-top:10px;padding:10px;">
      <table class="meta">
        <tr><td><b>Cliente:</b> ${cliente?.nombre || cliente?.nombre_cliente || 'SIN REGISTRO'}</td><td><b>Fecha:</b> ${new Date().toLocaleDateString('es-DO')}</td></tr>
        <tr><td><b>RNC/Cedula:</b> ${cliente?.rnc || cliente?.cedula || 'N/A'}</td><td><b>Telefono:</b> ${cliente?.telefono || 'N/A'}</td></tr>
      </table>
    </div>

    <div class="box" style="margin-top:10px;overflow:hidden;">
      <table>
        <thead>
          <tr>
            <th>No. Emision</th>
            <th>No. Factura</th>
            <th>Fecha</th>
            <th>Monto</th>
            <th>Abonado</th>
            <th>Pendiente</th>
            <th>Estado</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml || `<tr><td colspan="7" class="center">Sin facturas pendientes</td></tr>`}
        </tbody>
      </table>
    </div>

    <div style="margin-top:10px;" class="title">ABONOS REGISTRADOS</div>
    <div class="box" style="margin-top:10px;overflow:hidden;">
      <table>
        <thead>
          <tr>
            <th>Factura</th>
            <th>No. Pago</th>
            <th>Fecha</th>
            <th>Hora</th>
            <th>Metodo</th>
            <th>Monto</th>
            <th>Saldo</th>
          </tr>
        </thead>
        <tbody>
          ${abonosRowsHtml || `<tr><td colspan="7" class="center">Sin abonos registrados</td></tr>`}
        </tbody>
      </table>
    </div>

    <div style="display:flex;justify-content:flex-end;margin-top:10px;">
      <div class="box" style="width:340px;padding:8px 12px;">
        <table class="totals">
          <tr><td>Total Credito</td><td class="right">${toMoney(totalCredito)}</td></tr>
          <tr><td>Total Abonado</td><td class="right">${toMoney(totalAbonado)}</td></tr>
          <tr><td><b>Total Pendiente</b></td><td class="right"><b>${toMoney(totalPendiente)}</b></td></tr>
        </table>
      </div>
    </div>
  </div>
</body>
</html>
  `
}

const downloadPdfFromIframe = async ({ iframeId, filename }) => {
  const iframe = document.getElementById(iframeId)
  const iframeDoc = iframe?.contentWindow?.document
  const root = iframeDoc?.querySelector('.wrap') || iframeDoc?.body
  if (!root) throw new Error('No se pudo capturar el documento')

  const originalWidth = root.style.width
  const originalMaxWidth = root.style.maxWidth
  root.style.width = '816px'
  root.style.maxWidth = '816px'

  let canvas
  try {
    canvas = await html2canvas(root, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff'
    })
  } finally {
    root.style.width = originalWidth
    root.style.maxWidth = originalMaxWidth
  }

  const imgData = canvas.toDataURL('image/png')
  const pdf = new jsPDF('p', 'mm', 'letter')
  const pageWidth = pdf.internal.pageSize.getWidth()
  const pageHeight = pdf.internal.pageSize.getHeight()
  const margin = 8
  const renderWidth = pageWidth - margin * 2
  const renderHeight = (canvas.height * renderWidth) / canvas.width

  let heightLeft = renderHeight
  let position = margin
  pdf.addImage(imgData, 'PNG', margin, position, renderWidth, renderHeight)
  heightLeft -= (pageHeight - margin * 2)

  while (heightLeft > 0) {
    position = heightLeft - renderHeight + margin
    pdf.addPage()
    pdf.addImage(imgData, 'PNG', margin, position, renderWidth, renderHeight)
    heightLeft -= (pageHeight - margin * 2)
  }

  pdf.save(filename)
}

const printCuentas = async ({ facturas, cliente, datosEmpresa }) => {
  await loadConfig()
  const html = await generateCxcHtml({ facturas, cliente, datosEmpresa })
  const blob = new Blob([html], { type: 'text/html' })
  const url = URL.createObjectURL(blob)
  const fileName = `Estado_CxC_${cliente?.codigo || 'cliente'}.pdf`

  await Swal.fire({
    title: 'Vista previa Cuentas por Cobrar',
    width: '90%',
    html: `<iframe id="swal-cxc-pdf" src="${url}" style="width:100%;height:70vh;border:1px solid #ddd;border-radius:8px;"></iframe>`,
    showDenyButton: true,
    denyButtonText: 'Descargar PDF',
    showCancelButton: true,
    cancelButtonText: 'Cerrar',
    confirmButtonText: 'Imprimir',
    preConfirm: () => {
      const iframe = document.getElementById('swal-cxc-pdf')
      if (iframe?.contentWindow) {
        iframe.contentWindow.focus()
        iframe.contentWindow.print()
      }
    },
    preDeny: async () => {
      await downloadPdfFromIframe({ iframeId: 'swal-cxc-pdf', filename: fileName })
    },
    didClose: () => {
      URL.revokeObjectURL(url)
    }
  })
}

defineExpose({ printCuentas, generateCxcHtml, loadConfig })
</script>

<template>
  <div style="display:none"></div>
</template>
