import { BrowserWindow, app, shell } from 'electron'
import { readFileSync, writeFileSync } from 'fs'
import QRCode from 'qrcode'
import * as path from 'path'
import fs from 'fs/promises'
import { readFile } from 'fs/promises'

import { peticionesFetch, encryptarPassword, formatoMonedaRD } from '../funciones/funciones.js'

async function loadConfig() {
  const userDataPath = app.getPath('userData')
  const configPath = path.join(userDataPath, 'config.json')

  try {
    const data = await fs.readFile(configPath, 'utf8')
    return JSON.parse(data)
  } catch (err) {
    console.error('Error al leer el archivo de configuración:', err)
  }
}

export async function pdfMaterialesOrden(factura, datosEmpresa) {
  const datosJSON = await loadConfig()
  const link = datosJSON.VITE_LINKURL
  const api = datosJSON.VITE_LINK_API
  const token = datosJSON.VITE_TOKEN

  const datosLocalStorage = JSON.parse(datosEmpresa)

  const printerConfig =
    typeof datosJSON.impresora === 'string' ? JSON.parse(datosJSON.impresora) : datosJSON.impresora

  const datosDefault =
    typeof datosJSON.datosDefault === 'string'
      ? JSON.parse(datosJSON.datosDefault)
      : datosJSON.datosDefault

  const tokenCifrado = await encryptarPassword(token, 10)

  // Parsear los datos si vienen como string
  const datosOrden = typeof factura === 'string' ? JSON.parse(factura) : factura

  const empresa = datosLocalStorage.empresa
  const datosConfiguracion = datosLocalStorage.configuracion
  const configuracionfactura = datosDefault
  const usuarioLocal = datosLocalStorage.usuarioLocal

  async function getBase64FromLocalOrRemote(url) {
    if (!url || typeof url !== 'string') {
      throw new Error('❌ URL no válida en getBase64FromLocalOrRemote')
    }

    if (url.startsWith('http')) {
      const res = await fetch(url)
      const buffer = Buffer.from(await res.arrayBuffer())
      const ext = path.extname(new URL(url).pathname).replace('.', '') || 'png'
      return `data:image/${ext};base64,${buffer.toString('base64')}`
    } else {
      const buffer = await readFile(url)
      const ext = path.extname(url).replace('.', '') || 'png'
      return `data:image/${ext};base64,${buffer.toString('base64')}`
    }
  }

  const base64 = await getBase64FromLocalOrRemote(empresa.logoprinter)

  const qrCodeData = await QRCode.toDataURL(`${link}/receipt/factura?orden=${datosOrden.no_orden}`)

  // Parsear materiales
  let materiales = []
  if (datosOrden.materiales) {
    try {
      materiales = JSON.parse(datosOrden.materiales)
    } catch (e) {
      console.error('Error al parsear materiales:', e)
      materiales = []
    }
  }

  // Generar HTML de materiales
  const materialesHTML =
    materiales.length > 0
      ? materiales
          .map((material, index) => {
            return `
          <tr>
            <td class="border border-black px-1 py-1 text-center">${index + 1}</td>
            <td class="border border-black px-1 py-1">${material.nombre || 'N/A'}</td>
            <td class="border border-black px-1 py-1 text-center">${material.cantidad || 'N/A'}</td>
            <td class="border border-black px-1 py-1 text-center">${material.unidad || 'N/A'}</td>
          </tr>
        `
          })
          .join('')
      : `
      <tr>
        <td colspan="4" class="border border-black px-1 py-1 text-center text-gray-500">
          No hay materiales registrados para esta orden
        </td>
      </tr>
    `

  // Generar filas de relleno si hay menos de 10 materiales
  const filasMinimas = 10
  const filasFaltantes = Math.max(0, filasMinimas - materiales.length)

  let filasRelleno = ''
  for (let i = 0; i < filasFaltantes; i++) {
    filasRelleno += `
      <tr>
        <td class="border border-black px-1 py-1">&nbsp;</td>
        <td class="border border-black px-1 py-1">&nbsp;</td>
        <td class="border border-black px-1 py-1">&nbsp;</td>
        <td class="border border-black px-1 py-1">&nbsp;</td>
      </tr>
    `
  }

  // Generar el contenido HTML
  const htmlContent = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Materiales - Orden ${datosOrden.no_orden}</title>
  <script src="https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4"></script>
  <style>
    #tabla {
      border: 0.5pt solid darkblue;
      border-collapse: collapse;
      border-spacing: 0;
      box-sizing: border-box;
      clear: both;
      margin: 2mm 0mm;
      width: 100%;
    }

    #tabla th, td { border-left: 1px solid darkblue; }
    #tabla th:first-child, td:first-child { border-left: none; }
    #tabla th { border-bottom: 1px solid darkblue; }
    #tabla td { vertical-align: top; font-size: 8pt; }
    th { text-align: center; font-weight: normal; }

    @media print {
      * {
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
    }
  </style>
</head>
<body class="p-4 text-xs font-sans">
  <div class="max-w-3xl mx-auto p-4">
    <!-- Encabezado -->
    <div class="flex justify-between items-start">
      <div>
        ${
          configuracionfactura.logo
            ? `<img src="${base64}" alt="Logo" style="max-width: ${printerConfig.logoWidth}px">`
            : `<div style="font-size:${Number(printerConfig.fontSize) + 8}px !important;font-weight:bold">${empresa.nombre}</div>`
        }
        <p class="leading-4">
          ${configuracionfactura.legal ? empresa.legal + '<br>' : ''}
          ${configuracionfactura.telefono ? empresa.telefono + '<br>' : ''}
          ${configuracionfactura.email ? empresa.email + '<br>' : ''}
          ${configuracionfactura.direccion ? empresa.direccion : ''}
        </p>
      </div>

      <div class="">
        <div class="text-right space-y-1 border px-2 py-1 rounded-md">
          <table class="text-right text-sm w-full">
            <tr><td class="px-1 text-left">Fecha</td><td class="px-1">${datosOrden.fecha}</td></tr>
            <tr><td class="px-1 text-left">Orden #</td><td class="px-1">${datosOrden.no_orden}</td></tr>
            <tr><td class="px-1 text-left">ESTADO</td><td class="px-1">${datosOrden.estado}</td></tr>
          </table>
          <h2 class="text-center font-bold mt-4 border-y border-black py-1 bg-green-600 text-white rounded-md">
            LISTADO DE MATERIALES
          </h2>
        </div>
      </div>
    </div>

    <!-- Cliente y QR -->
    <div class="border border-black flex justify-between items-start mt-4 rounded-md">
      <div class="p-2 w-full">
        ${configuracionfactura.nombre_cliente ? `<p><strong>CLIENTE:</strong> ${datosOrden.cliente || 'SIN REGISTRO'}</p>` : ''}
      </div>
      <div class="text-right p-1 rounded-md" style="max-width: 120px; max-height: 120px;">
        <img src="${qrCodeData}" class="" style="max-width: 100px; max-height: 100px;"/>
      </div>
    </div>

    <!-- Tabla de materiales -->
    <table class="w-full text-left mt-4 border border-black" id="tabla">
      <thead class="border border-black bg-green-700 text-white">
        <tr>
          <th class="border border-black px-1 py-1" style="width: 50px;">#</th>
          <th class="border border-black px-1 py-1">MATERIAL</th>
          <th class="border border-black px-1 py-1" style="width: 100px;">CANTIDAD</th>
          <th class="border border-black px-1 py-1" style="width: 100px;">UNIDAD</th>
        </tr>
      </thead>
      <tbody>
        ${materialesHTML}
        ${materiales.length > 0 ? filasRelleno : ''}
      </tbody>
    </table>

    <!-- Firmas -->
    <div class="flex justify-between mt-6 gap-4">
      <div class="w-1/2">
        <div class="border border-black p-2 rounded-lg">
          <p class="text-xs mb-8">ENTREGADO POR (${usuarioLocal[0].nombre})</p>
          <div class="border-t border-black pt-2 text-center text-xs">
            FIRMA
          </div>
        </div>
      </div>
      <div class="w-1/2">
        <div class="border border-black p-2 rounded-lg">
          <p class="text-xs mb-8">RECIBIDO POR</p>
          <div class="border-t border-black pt-2 text-center text-xs">
            FIRMA
          </div>
        </div>
      </div>
    </div>

    <!-- Observaciones -->
    <div class="mt-4 text-justify">
      ${
        datosOrden.nota
          ? `
        <p class="text-xs">
          <strong>OBSERVACION:</strong><br>
          ${datosOrden.nota.replace(/\n/g, '<br>')}
        </p>
      `
          : ''
      }

      <div class="bg-green-100 border-2 border-green-600 rounded-lg p-2 mt-4">
        <p class="font-bold text-center text-green-800">
          📋 LISTADO DE MATERIALES - ORDEN ${datosOrden.no_orden} 📋
        </p>
        <p class="text-xs text-center text-green-700 mt-1">
          Total de materiales: ${materiales.length}
        </p>
      </div>
    </div>
  </div>
</body>
</html>
  `

  const win = new BrowserWindow({
    width: 800,
    height: 600,
    show: false
  })

  // Cargar el contenido HTML directamente en la ventana
  win.loadURL(`data:text/html;charset=UTF-8,${encodeURIComponent(htmlContent)}`)

  win.webContents.on('did-finish-load', async () => {
    const pdfPath = path.join(
      app.getPath('downloads'),
      `materiales_orden_${datosOrden.no_orden}.pdf`
    )

    const pdfData = await win.webContents.printToPDF({
      printBackground: true,
      margins: { marginType: 'none' },
      pageSize: 'A4'
    })

    // Guardar el PDF en el sistema de archivos
    fs.writeFile(pdfPath, pdfData)
      .then(() => {
        console.log('✅ PDF de materiales guardado:', pdfPath)

        const fileURL = `file://${pdfPath.replace(/\\/g, '/')}`
        console.log('📂 URL del PDF:', fileURL)

        // Mostrar el PDF en una ventana
        const viewerWin = new BrowserWindow({
          width: 900,
          height: 700,
          title: 'Materiales - Orden ' + datosOrden.no_orden,
          webPreferences: {
            sandbox: false,
            contextIsolation: true,
            nodeIntegration: false
          }
        })
        viewerWin.setMenu(null)
        viewerWin.loadURL(`file://${pdfPath.replace(/\\/g, '/')}`)
        win.close()
      })
      .catch((error) => {
        console.error('❌ Error al guardar el PDF de materiales:', error)
      })
  })

  console.log('✅ PDF de Materiales de Orden cargado')
}
