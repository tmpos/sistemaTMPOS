import { BrowserWindow, app } from 'electron'
import { readFile } from 'fs/promises'
import * as path from 'path'
import fs from 'fs/promises'
import QRCode from 'qrcode'
import * as servidor from '../server/server.js'
import { formatoMonedaRD, encryptarPassword } from '../funciones/funciones.js'

export async function buscador(consulta, ...args) {
  try {
    if (servidor[consulta] && typeof servidor[consulta] === 'function') {
      return await servidor[consulta](...args)
    } else {
      throw new Error(`La consulta '${consulta}' no es válida o no es una función exportada`)
    }
  } catch (err) {
    console.error('❌ Error en la consulta:', err)
    return { success: false, message: 'Error en consulta', error: err.message }
  }
}

export async function imprimirFacturaCreditoCartaPDF(factura, cliente, datosEmpresa) {
  try {
    const datosLocalStorage = JSON.parse(datosEmpresa)
    const datosFactura = JSON.parse(factura)
    const datosFacturaOriginal = await buscador(
      'getDataByField',
      'facturas',
      'no_factura',
      datosFactura.no_factura
    )
    const datosCliente = JSON.parse(cliente)

    const datosJSON = await buscador('getAllConfig')
    const link = datosJSON.VITE_LINKURL
    const token = datosJSON.VITE_TOKEN
    await encryptarPassword(token, 10)

    const empresa = (await buscador('getDataAsArray', 'empresa'))[0]
    const datosConfiguracion = await buscador('getDataByField', 'configuracion', 'id', 1)
    const printerConfig = JSON.parse(datosJSON.impresora || '{}')
    const datosDefault = JSON.parse(datosJSON.datosDefault || '{}')
    const usuarioLocal = datosLocalStorage.usuarioLocal || []

    const productos = safeJSONParse(datosFacturaOriginal.productos)
    const pagos = safeJSONParse(datosFactura.pagos)

    async function getBase64FromLocalOrRemote(url) {
      try {
        if (!url) return ''
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
      } catch {
        return ''
      }
    }

    let base64 = ''
    try {
      const arrayIMG = await buscador('listarArchivosDeCarpeta', 'empresa/' + empresa.imagen)
      if (arrayIMG?.length > 0) {
        const ruta = arrayIMG.length > 1 ? arrayIMG[1] : arrayIMG[0]
        base64 = await getBase64FromLocalOrRemote(ruta)
      }
    } catch (err) {
      console.warn('⚠️ No se pudo cargar logo:', err.message)
    }

    const qrCodeData = await QRCode.toDataURL(
      `${link}/receipt/factura?factura=${datosFactura.no_factura}`
    )

    // Productos
    const productosHTML = productos
      .map((p) => {
        const totalProducto =
          parseFloat(p.precio_final) * parseFloat(p.cantidad) - parseFloat(p.descuento || 0)
        const totalImpuestos = parseFloat(p.impuesto || 0) * parseFloat(p.cantidad || 0)
        return `
        <tr>
          <td>${p.codigo || ''}</td>
          <td>${p.nombre || ''}</td>
          <td class="text-center">${p.cantidad || 0}</td>
          <td class="text-right">${formatoMonedaRD(p.precio_venta || 0)}</td>
          ${datosDefault.impuestos ? `<td class="text-right">${formatoMonedaRD(totalImpuestos)}</td>` : ''}
          ${datosDefault.descuento ? `<td class="text-right">${formatoMonedaRD(p.descuento || 0)}</td>` : ''}
          <td class="text-right"><b>${formatoMonedaRD(totalProducto)}</b></td>
        </tr>`
      })
      .join('')

    // Pagos
    const pagosHTML = pagos
      .map((p, i) => {
        const cantidad = parseFloat(p.cantidad || 0)
        const saldo = parseFloat(p.saldo || 0)
        return `
        <tr>
          <td class="text-center">${p.nopago || i + 1}</td>
          <td>${p.fecha || ''}</td>
          <td>${p.hora || ''}</td>
          <td>${p.metodo || ''}</td>
          <td class="text-right">${formatoMonedaRD(cantidad)}</td>
          <td class="text-right">${formatoMonedaRD(saldo)}</td>
        </tr>`
      })
      .join('')

    const pagosSection =
      pagos.length > 0
        ? `
      <h3 class="mt-4 font-bold border-b border-black">ABONOS REALIZADOS</h3>
      <table class="w-full border border-black mt-2 text-xs">
        <thead class="bg-gray-700 text-white">
          <tr><th>#</th><th>Fecha</th><th>Hora</th><th>Método</th><th>Monto</th><th>Saldo</th></tr>
        </thead>
        <tbody>${pagosHTML}</tbody>
      </table>`
        : `<div class="mt-4 border border-gray-300 bg-gray-50 p-2 text-center italic">
           No se registran abonos para esta factura.
         </div>`

    // HTML del documento
    const htmlContent = `
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <title>Factura a Crédito</title>
      <script src="https://cdn.tailwindcss.com"></script>
      <style>
        @page { size: A4; margin: 15mm; }
        body { font-family: sans-serif; font-size: 11px; color: #111; }
      </style>
    </head>
    <body class="p-6">
      <div class="max-w-3xl mx-auto border p-4">
        <div class="flex justify-between items-start">
          <div>
            ${
              datosDefault.logo
                ? `<img src="${base64}" style="max-width:${printerConfig.logoWidth || 120}px">`
                : `<h2 class="text-lg font-bold">${empresa.nombre}</h2>`
            }
            <p class="text-xs leading-4 mt-1">
              ${empresa.legal || ''}<br>${empresa.telefono || ''}<br>${empresa.email || ''}<br>${empresa.direccion || ''}
            </p>
          </div>
          <div class="text-right">
            <table class="text-xs">
              <tr><td><b>Fecha:</b></td><td>${datosFacturaOriginal.fecha_emision || ''}</td></tr>
              <tr><td><b>Factura #:</b></td><td>${datosFacturaOriginal.no_factura || ''}</td></tr>
            </table>
            <h3 class="mt-2 bg-gray-800 text-white p-1 rounded">FACTURA A CRÉDITO</h3>
          </div>
        </div>

        <div class="border mt-3 p-2 rounded">
          <b>Cliente:</b> ${datosFacturaOriginal.nombre_cliente || 'SIN REGISTRO'}<br>
          <b>Tel:</b> ${datosCliente.telefono || 'N/A'}<br>
          <b>Céd/RNC:</b> ${datosCliente.cedula || datosCliente.rnc || 'N/A'}<br>
          <b>Dirección:</b> ${datosCliente.direccion || 'N/A'}
        </div>

        <h4 class="mt-3 font-bold border-b">Productos</h4>
        <table class="w-full border mt-1 text-xs">
          <thead class="bg-gray-700 text-white">
            <tr>
              <th>COD</th><th>DESCRIPCIÓN</th><th>CANT</th><th>P.U</th>
              ${datosDefault.impuestos ? `<th>${datosConfiguracion.nombre_impuesto}</th>` : ''}
              ${datosDefault.descuento ? '<th>DESC</th>' : ''}
              <th>SUBTOTAL</th>
            </tr>
          </thead>
          <tbody>${productosHTML}</tbody>
        </table>

        ${pagosSection}

        <div class="flex justify-between mt-4">
          <div>
            <p><b>Entregado por:</b> ${usuarioLocal[0]?.nombre || ''}</p>
            <p><b>Recibido por:</b> ___________________</p>
          </div>
          <div>
            <table class="text-right text-xs">
              <tr><td>Subtotal</td><td>${formatoMonedaRD(datosFacturaOriginal.subtotal)}</td></tr>
              <tr><td>Impuesto</td><td>${formatoMonedaRD(datosFacturaOriginal.impuesto)}</td></tr>
              <tr><td>Total</td><td><b>${formatoMonedaRD(datosFacturaOriginal.total)}</b></td></tr>
              <tr><td>Abonado</td><td>${formatoMonedaRD(datosFactura.abonado || 0)}</td></tr>
              <tr><td>Pendiente</td><td>${formatoMonedaRD(datosFactura.pendiente || 0)}</td></tr>
            </table>
          </div>
        </div>
      </div>
    </body>
    </html>`

    // Crear PDF
    const win = new BrowserWindow({ show: false, width: 900, height: 1100 })
    win.loadURL(`data:text/html;charset=UTF-8,${encodeURIComponent(htmlContent)}`)

    win.webContents.on('did-finish-load', async () => {
      await new Promise((r) => setTimeout(r, 500)) // 🕒 Esperar render

      const pdfPath = path.join(
        app.getPath('downloads'),
        `factura_credito_${datosFactura.no_factura}.pdf`
      )
      const pdfData = await win.webContents.printToPDF({
        printBackground: true,
        pageSize: 'A4'
      })

      await fs.writeFile(pdfPath, pdfData)
      const viewerHtml = `
        <html>
          <body style="margin:0">
            <iframe src="file://${pdfPath.replace(/\\/g, '/')}" width="100%" height="100%" style="border:none"></iframe>
          </body>
        </html>`

      const tempViewerPath = path.join(app.getPath('temp'), `viewer_${Date.now()}.html`)
      await fs.writeFile(tempViewerPath, viewerHtml, 'utf8')

      const viewerWin = new BrowserWindow({
        width: 900,
        height: 700,
        title: 'Factura Crédito PDF',
        webPreferences: { sandbox: false, contextIsolation: true }
      })
      viewerWin.setMenu(null)
      await viewerWin.loadFile(tempViewerPath)
      win.close()
    })
  } catch (error) {
    console.error('❌ Error en imprimirFacturaCreditoCartaPDF:', error)
  }
}

function safeJSONParse(value) {
  try {
    if (!value) return []
    return JSON.parse(value)
  } catch {
    return []
  }
}
