import { BrowserWindow, app, shell } from 'electron'
import { readFileSync, writeFileSync } from 'fs'
import QRCode from 'qrcode'
import * as path from 'path'
import fs from 'fs/promises'
import { readFile } from 'fs/promises'
/*******************************************************/
//import * as servidor from '../server/server.js'
/******************************************************/

/******************************************************/

import { peticionesFetch, encryptarPassword, formatoMonedaRD } from '../funciones/funciones.js'

// Función para imprimir el ticket en formato HTML

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

export async function pdfCotizacionCarta(factura, cliente, datosEmpresa, impresora) {
  const datosJSON = await loadConfig()
  const link = datosJSON.VITE_LINKURL
  const api = datosJSON.VITE_LINK_API
  const token = datosJSON.VITE_TOKEN
  const linkImpresora = datosJSON.VITE_IMPRESORA_LOCAL

  const datosLocalStorage = JSON.parse(datosEmpresa)

  const printerConfig =
    typeof datosJSON.impresora === 'string' ? JSON.parse(datosJSON.impresora) : datosJSON.impresora

  const datosDefault =
    typeof datosJSON.datosDefault === 'string'
      ? JSON.parse(datosJSON.datosDefault)
      : datosJSON.datosDefault

  // const datosSS = response.find(conf=>conf.nombre === 'LINKURL')
  //const link = datosSS.valor

  const tokenCifrado = await encryptarPassword(token, 10)

  //const arrayPrinter = datosLocalStorage.printerconfig;
  /**********************************************************************/
  /*  const datosFactura = await peticionesFetch(
    `${link}${api}`,
    `datoscampo/cotizacion/no_cotizacion/${factura}`,
    {},
    tokenCifrado,
    'GET'
  );*/
  const datosFactura = JSON.parse(factura)
  // const datosFactura = await buscador('getDataByField', 'cotizacion','no_cotizacion',factura);
  /**********************************************************************/
  /* const datosCliente = await peticionesFetch(
    `${link}${api}`,
    `datoscampo/clientes/codigo/${datosFactura.cod_cliente}`,
    {},
    tokenCifrado,
    'GET'
  );*/

  const datosCliente = JSON.parse(cliente)

  //const datosCliente = await buscador('getDataByField', 'clientes','codigo',datosFactura.cod_cliente);
  /**********************************************************************/
  const empresa = datosLocalStorage?.empresa
  /**********************************************************************/
  /*    const printerConfig = {
     logoWidth:250,
     fontSize:10
  }*/
  //const printerCarta = arrayPrinter.find(print => print.tipo === 'Carta');

  //const printer = impresora ? impresora : printerCarta.nombre;

  //const printerName = 'printer';
  /**********************************************************************/
  /**********************************************************************/

  const datosConfiguracion = datosLocalStorage?.configuracion
  /**********************************************************************/
  const convertToBoolean = (obj) => {
    const newObj = {}
    for (let key in obj) {
      if (typeof obj[key] === 'string') {
        newObj[key] = obj[key] === 'True' // Convertir a true si es "True", de lo contrario será false
      } else {
        newObj[key] = obj[key] // Si no es string, mantener el valor original
      }
    }
    return newObj
  }

  // Uso de la función para convertir el objeto
  const configuracionfactura = datosDefault
  /**********************************************************************/

  //const printerName = arrayPrinter[0].nombre

  /*****************************************************************************/
  /*****************************************************************************/
  const tablaDefault = datosLocalStorage?.tabladefault
  /*****************************************************************************/
  const cantidad = tablaDefault.copias
  const usuarioLocal = datosLocalStorage?.usuarioLocal
  /*****************************************************************************/
  let credito = null
  let abonado = null
  let pendiente = null
  /*****************************************************************************/
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
  /*****************************************************************************/
  const base64 = await getBase64FromLocalOrRemote(empresa.logoprinter)

  /*****************************************************************************/

  const qrCodeData = await QRCode.toDataURL(
    `${link}/receipt/factura?cotizacion=${datosFactura.no_cotizacion}`
  )

  // Generar la tabla de productos en formato HTML
  const productos = JSON.parse(datosFactura.productos)
  const productosHTML = productos
    .map((producto) => {
      //const totalProducto = (Number(producto.precio_venta) * Number(producto.cantidad)).toFixed(2);
      const totalProducto = Number(producto.precio_final) * Number(producto.cantidad)
      const totalImpuestos = Number(producto.impuesto) * Number(producto.cantidad)
      return `
        <tr>
          <td class=" px-1">${producto.codigo}</td>
          <td class=" px-1">${producto.nombre}</td>
          <td class=" text-center">${producto.cantidad}</td>
          <td class=" text-right pr-2">${datosConfiguracion.simbolo}${Number(producto.precio_venta)}</td>
          ${configuracionfactura.impuestos ? `<td class=" text-right pr-2">${datosConfiguracion.simbolo}${totalImpuestos.toFixed(2)}</td>` : ''}
        ${configuracionfactura.descuento ? `<td class=" text-right pr-2">${datosConfiguracion.simbolo}${Number(producto.descuento).toFixed(2)}</td>` : ''}
        <td class=" text-right pr-2"><b>${datosConfiguracion.simbolo}${parseFloat(producto.total).toFixed(2)}</b></td>
        </tr>

        `
    })
    .join('')

  const filasMinimas = 6
  const columnasTotales =
    4 + (configuracionfactura.impuestos ? 1 : 0) + (configuracionfactura.descuento ? 1 : 0)

  const filasFaltantes = filasMinimas - productos.length

  let filasRelleno = ''
  for (let i = 0; i < filasFaltantes; i++) {
    filasRelleno += '<tr class="invoice_line">'
    filasRelleno += '<td style="border-left: 1px solid darkblue;" class="px-1 py-1">&nbsp;</td>' // COD
    filasRelleno += '<td style="border-left: 1px solid darkblue;" class="px-1 py-1">&nbsp;</td>' // DESCRIPCION
    filasRelleno += '<td style="border-left: 1px solid darkblue;" class="px-1 py-1">&nbsp;</td>' // CANT.
    filasRelleno += '<td style="border-left: 1px solid darkblue;" class="px-1 py-1">&nbsp;</td>' // P.U
    if (configuracionfactura.impuestos) {
      filasRelleno += '<td style="border-left: 1px solid darkblue;" class="px-1 py-1">&nbsp;</td>' // IMPUESTO
    }
    if (configuracionfactura.descuento) {
      filasRelleno += '<td style="border-left: 1px solid darkblue;" class="px-1 py-1">&nbsp;</td>' // DESC
    }
    filasRelleno += '<td style="border-left: 1px solid darkblue;" class="px-1 py-1">&nbsp;</td>' // SUBTOTAL
    filasRelleno += '</tr>'
  }

  // Generar el contenido HTML para el ticket
  const htmlContent = `
 <!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Factura</title>
  <script src="https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4"></script>
  <style>

    #tabla {
            border: 0.5pt solid darkblue;
            border-collapse: collapse;
            border-spacing: 0;
            box-sizing: border-box;
            clear: both;
            margin: 2mm 0mm;
            /*min-height: 70mm;*/
            width: 100%;

        }

        .total {
}

        #tabla th, td { border-left: 1px solid darkblue; }
        #tabla th:first-child, td:first-child { border-left: none; }
        #tabla th { border-bottom: 1px solid darkblue; }
        #tabla td { vertical-align: top; font-size: 8pt; }
        th { text-align: center; font-weight: normal; }
        .amount { text-align: right; }
        .invoice_line { height: 6mm; }
        .invoice_line td, .invoice_line th { padding: 0.5mm 1mm; }

        @media print {
      * {
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
    }

  </style>
</head>
<body class="p-4 text-xs font-sans">
  <div class="max-w-3xl mx-auto  p-4">
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
      <div class="text-right space-y-1 border  px-2 py-1  rounded-md">
        <table class="text-right text-sm w-full total"  >
            <tr><td class=" px-1 text-left">Fecha</td><td class=" px-1">${datosFactura.fecha_emision}</td></tr>
            <tr><td class=" px-1 text-left">Cotización #</td><td class=" px-1">${datosFactura.no_cotizacion}</td></tr>
            <tr><td class=" px-1 text-left">VENCIMIENTO</td><td class=" px-1">${datosFactura.vencimiento}</td></tr>
          </table>
          <h2 class="text-center font-bold mt-4 border-y border-black py-1 bg-gray-800 text-white rounded-md">
           COTIZACION
           </h2>
      </div>
      </div>

    </div>

    <!-- Cliente y QR -->
    <div class="border border-black flex justify-between items-start mt-4 rounded-md">
      <div class=" p-2 w-full ">
     ${configuracionfactura.nombre_cliente ? `<p><strong>CLIENTE:</strong>  ${datosFactura.nombre_cliente || 'SIN REGISTRO'}</p>` : ''}
     ${configuracionfactura.telefono_cliente ? `<p><strong>TELEFONO:</strong>  ${datosCliente.telefono || 'N/A'}</p>` : ''}
     ${configuracionfactura.rnc ? `<p><strong>RNC/CEDULA:</strong>  ${datosCliente.rnc || 'N/A'}</p>` : ''}
     ${configuracionfactura.direccion_cliente ? `<p><strong>DIRECCIÓN:</strong>  ${datosCliente.direccion || 'N/A'}</p>` : ''}
     ${datosFactura.entidad_financiera && datosFactura.entidad_financiera !== 'Ninguna' ? `<p><strong>INSTITUCION:</strong> ${datosFactura.entidad_financiera}</p>` : ''}

      </div>
      <div class="text-right p-1 rounded-md" style="max-width: 120px; max-height: 120px;">
       <img src="${qrCodeData}" class="" style="max-width: 100px; max-height: 100px;"/>
      </div>
    </div>

    <!-- Título de factura -->

    <!-- Tabla de productos -->
    <table class="w-full text-left mt-2 border border-black" id="tabla">
      <thead class="border border-black bg-gray-800 text-white">
        <tr>
          <th class="border border-black px-1 py-1">COD</th>
          <th class="border border-black px-1 py-1">DESCRIPCION</th>
          <th class="border border-black px-1 py-1">CANT.</th>
          <th class="border border-black px-1 py-1">P.U</th>
           ${configuracionfactura.impuestos ? `<th class="border border-black px-1 py-1" >${datosConfiguracion.nombre_impuesto}</th>` : ''}
           ${configuracionfactura.descuento ? `<th class="border border-black px-1 py-1" >DESC</th>` : ''}
          <th class="border border-black px-1 py-1">SUBTOTAL</th>
        </tr>
      </thead>
      <tbody>
        ${productosHTML}
        ${filasRelleno}
      </tbody>
    </table>

    <!-- Totales -->
    <div class="flex justify-between mt-2 ">

    <!-- Firmas -->
    <div class=" w-1/3">
        <div class="border border-black p-2  rounded-lg">
          ENTREGADO POR (${usuarioLocal[0].nombre})
        </div>
        <div class="border border-black p-2  mt-2 rounded-lg">
          RECIBIDO POR
        </div>
      </div>

        <div class=" w-1/3 rounded-lg border shadow-sm">
          <table class="text-right text-sm w-full total"  >
            <tr><td class=" px-1">SUBTOTAL</td><td class=" px-1">${formatoMonedaRD(datosFactura.subtotal)}</td></tr>
            ${configuracionfactura.impuestos ? `<tr><td class=" px-1">${datosConfiguracion.nombre_impuesto} (${datosConfiguracion.impuesto}%)</td><td class=" px-1">${formatoMonedaRD(datosFactura.impuesto)}</td></tr>` : ''}
            ${configuracionfactura.descuento ? `<tr><td class=" px-1">DESC.</td><td class=" px-1">${formatoMonedaRD(datosFactura.descuento)}</td></tr>` : ''}
            <tr class="font-bold"><td class=" px-1">TOTAL</td><td class=" px-1">${formatoMonedaRD(datosFactura.total)}</td></tr>
            ${abonado ? `<tr class="font-bold"><td class=" px-1">ABONADO</td><td class=" px-1">${formatoMonedaRD(abonado)}</td></tr>` : ''}
            ${pendiente ? `<tr class="font-bold"><td class=" px-1">PENDIENTE</td><td class=" px-1">${formatoMonedaRD(pendiente)}</td></tr>` : ''}
          </table>
        </div>
      </div>

    <!-- Observaciones -->
    <div class="mt-4 text-justify">
            ${
              datosFactura.nota
                ? `<p class="text-xs">
        <strong>OBSERVACION:</strong><br>
        ${datosFactura.nota.replace(/\n/g, '<br>')}
      </p>`
                : ''
            }

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

  // Cargar el contenido HTML
  win.loadURL(`data:text/html;charset=UTF-8,${encodeURIComponent(htmlContent)}`)

  // Generar PDF
  win.webContents.on('did-finish-load', async () => {
    const pdfPath = path.join(
      app.getPath('downloads'),
      `cotizacion_${datosFactura.no_cotizacion}.pdf`
    )

    const pdfData = await win.webContents.printToPDF({
      printBackground: true,
      margins: { marginType: 'none' },
      pageSize: 'A4'
    })

    // Guardar el PDF en el sistema de archivos
    fs.writeFile(pdfPath, pdfData)
      .then(() => {
        console.log('✅ PDF guardado:', pdfPath)

        // Mostrar el path en consola como URL
        const fileURL = `file://${pdfPath.replace(/\\/g, '/')}`
        console.log('📂 URL del PDF:', fileURL)

        // Intentamos abrirlo con shell
        /*    shell.openPath(pdfPath)
      .then((res) => {
        if (res) console.error("❌ shell.openPath error:", res)
        else console.log("✅ PDF abierto con shell")
      })*/

        // También lo mostramos con iframe
        const viewerHtml = `
      <html>
        <body style="margin:0;padding:0">
          <iframe src="file://${pdfPath.replace(/\\/g, '/')}" width="100%" height="100%" style="border:none"></iframe>
        </body>
      </html>`

        const viewerWin = new BrowserWindow({
          width: 900,
          height: 700,
          title: 'Factura PDF',
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
        console.error('❌ Error al guardar el PDF:', error)
      })
  })
}
