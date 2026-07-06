import { BrowserWindow, app, shell } from 'electron'
import { readFileSync, writeFileSync } from 'fs'
import QRCode from 'qrcode'
import * as path from 'path'
import fs from 'fs/promises'
import { readFile } from 'fs/promises'
/*******************************************************/
//import * as servidor from '../server/server.js'
/******************************************************/
/**
 * Ejecuta dinámicamente una función exportada desde server.js
 *
 * @param {string} consulta - Nombre de la función a ejecutar (debe existir en server.js)
 * @param  {...any} args - Argumentos que se le pasarán a la función
 * @returns {Promise<any>} - Resultado de la ejecución o un objeto de error
 */
export async function buscador(consulta, ...args) {
  try {
    if (servidor[consulta] && typeof servidor[consulta] === 'function') {
      const resultado = await servidor[consulta](...args)
      return resultado
    } else {
      throw new Error(`La consulta '${consulta}' no es válida o no es una función exportada`)
    }
  } catch (err) {
    console.error('❌ Error en la consulta:', err)
    return { success: false, message: 'Error en consulta', error: err.message }
  }
}

import {
  peticiones,
  generadorCodigo,
  generarCodigoUnico,
  arrayToObjetoFromTabla,
  mensajetoast,
  actualizarLocalStorage,
  nfecha,
  formatoMonedaRD,
  envioElectron,
  peticionesFetch,
  encryptarPassword
} from '../funciones/funciones.js'

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

// Función para imprimir el ticket en formato HTML

export async function imprimirCreditoPDF(facturas, cliente, datosEmpresa, impresora) {
  //const response = await buscador('getDataAsArray','datos_config');

  const datosLocalStorage = JSON.parse(datosEmpresa)
  /*
    const datosSS = response.find(conf=>conf.nombre === 'LINKURL')
    const link = datosSS.valor*/

  const datosJSON = await loadConfig()
  const link = datosJSON.VITE_LINKURL
  const api = datosJSON.VITE_LINK_API
  const token = datosJSON.VITE_TOKEN
  const linkImpresora = datosJSON.VITE_IMPRESORA_LOCAL
  const datosImpresoraLocal = datosJSON.impresora
  const datosDefault =
    typeof datosJSON.datosDefault === 'string'
      ? JSON.parse(datosJSON.datosDefault)
      : datosJSON.datosDefault

  const tokenCifrado = await encryptarPassword(token, 10)

  //const arrayPrinter = datosLocalStorage.printerconfig;
  /**********************************************************************/
  /*  const datosFactura = await peticionesFetch(
    `${link}${api}`,
    `datoscampo/facturas/no_factura/${factura}`,
    {},
    tokenCifrado,
    'GET'
  );*/
  // const datosFactura = await buscador('getDataByField', 'facturas','no_factura',factura);

  /**********************************************************************/
  /* const datosCliente = await peticionesFetch(
    `${link}${api}`,
    `datoscampo/clientes/codigo/${datosFactura.cod_cliente}`,
    {},
    tokenCifrado,
    'GET'
  );*/

  // const datosFactura = JSON.parse(factura)
  const facturasArray = JSON.parse(facturas)
  const datosCliente = JSON.parse(cliente)

  //const datosCliente = await buscador('getDataByField', 'clientes','codigo',datosFactura.cod_cliente);
  /**********************************************************************/
  const empresa = datosLocalStorage.empresa
  /**********************************************************************/
  const printerConfig = JSON.parse(datosImpresoraLocal)
  /**********************************************************************/
  /**********************************************************************/

  const datosConfiguracion = datosLocalStorage.configuracion
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
  const configuracionfactura = convertToBoolean(datosLocalStorage.configuracionfactura)
  /**********************************************************************/

  //const printerName = arrayPrinter[0].nombre

  /*****************************************************************************/
  /*****************************************************************************/
  const tablaDefault = datosLocalStorage.tabladefault
  /*****************************************************************************/
  const cantidad = tablaDefault.copias
  const usuarioLocal = datosLocalStorage.usuarioLocal
  /*****************************************************************************/
  async function getBase64FromLocalOrRemote(url) {
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
  let totalCredito = 0
  let totalAbonado = 0
  let totalPendiente = 0
  /*****************************************************************************/
  // Generar la tabla de productos en formato HTML
  const productosHTML = facturasArray
    .map((factura, index) => {
      totalCredito += parseFloat(factura.monto_credito)
      totalAbonado += parseFloat(factura.abonado)
      totalPendiente += parseFloat(factura.saldo)

      const pagosRealizados = JSON.parse(factura.pagos)

      const pagosRows = pagosRealizados
        .map(
          (pago, pagoIndex) => `
      <tr>
        <td colspan="4" class="text-center">FECHA: ${pago.fecha} ${pago.hora}</td>
      </tr>
      <tr>
        <td class="text-center">${pago.nopago}</td>
        <td class="text-center">${pago.cantidad}</td>
        <td class="text-center">${pago.metodo}</td>
        <td class="text-center">${pago.saldo}</td>
      </tr>
    `
        )
        .join('')

      return `
      <tr>
        <td>(${index + 1})</td>
        <td>${factura.no_factura}</td>
        <td>${factura.fecha_emision} ${factura.hora}</td>
        <td>${factura.monto_credito}</td>
      </tr>
      <tr>
        <td colspan="4"><p>ABONOS REALIZADOS</p></td>
      </tr>
      <tr>
        <td colspan="4" class="bordeado">
          <table style="width:100%; border-collapse: collapse;" border="0" cellspacing="0" cellpadding="0">
            <thead>
              <tr>
                <th class="text-left" style="width:25%;">No.</th>
                <th class="text-right" style="width:25%;">CANT.</th>
                <th class="text-right" style="width:25%;">MET.</th>
                <th class="text-right" style="width:25%;">SALDO</th>
              </tr>
            </thead>
            <tbody>
              ${pagosRows}
            </tbody>
          </table>
        </td>
      </tr>
    `
    })
    .join('')

  const filasMinimas = 6
  const columnasTotales = 4 + (datosDefault.impuestos ? 1 : 0) + (datosDefault.descuento ? 1 : 0)

  const filasFaltantes = filasMinimas - facturasArray.length

  let filasRelleno = ''
  for (let i = 0; i < filasFaltantes; i++) {
    filasRelleno += '<tr class="invoice_line">'
    filasRelleno += '<td  class="px-1 py-1">&nbsp;</td>' // COD
    filasRelleno += '<td  class="px-1 py-1">&nbsp;</td>' // DESCRIPCION
    filasRelleno += '<td  class="px-1 py-1">&nbsp;</td>' // CANT.
    filasRelleno += '<td  class="px-1 py-1">&nbsp;</td>' // P.U
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
      width: 100%;
    }
    .bordeado {
      border: 1px solid #000000;
      border-radius: 5px;
      padding-left: 5px;
      width: 100%;
    }
    .total {
    }

    #tabla th:first-child, td:first-child {
      border-left: none;
    }
    #tabla th {
      border-bottom: 1px solid darkblue;
    }
    #tabla td {
      vertical-align: top;
      font-size: 8pt;
    }
    th {
      text-align: center;
      font-weight: normal;
    }
    .amount {
      text-align: right;
    }
    .invoice_line {
      height: 6mm;
    }
    .invoice_line td, .invoice_line th {
      padding: 0.5mm 1mm;
    }
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
        ${datosDefault.logo ? `<img src="${base64}" alt="Logo" style="max-width: ${printerConfig.logoWidth}px">` : `<div style="font-size:${Number(printerConfig.fontSize) + 8}px !important;font-weight:bold">${empresa.nombre}</div>`}
        <p class="leading-4">
          ${datosDefault.legal ? empresa.legal + '<br>' : ''}
          ${datosDefault.telefono ? empresa.telefono + '<br>' : ''}
          ${datosDefault.email ? empresa.email + '<br>' : ''}
          ${datosDefault.direccion ? empresa.direccion : ''}
        </p>
      </div>
      <div class="text-right space-y-1 border px-2 py-1 rounded-md">
        <h2 class="text-center font-bold mt-4 border-y border-black py-1 px-2 bg-gray-800 text-white rounded-md">
          FACTURAS PENDIENTES
        </h2>
        <h3>
          FECHA ${nfecha('fecha')}
        </h3>
      </div>
    </div>
    <!-- Cliente y QR -->
    <div class="border border-black flex justify-between items-start mt-4 rounded-md">
      <div class="p-2 w-full">
        ${datosDefault.nombre_cliente ? `CLIENTE: ${datosCliente.nombre || 'SIN REGISTRO'}<br>` : ''}
        ${datosDefault.rnc ? `CEDULA/RNC: ${datosCliente.rnc || 'N/A'}<br>` : ''}
        ${datosDefault.telefono_cliente ? `TELEFONO: ${datosCliente.telefono || 'SIN REGISTRO'}<br>` : ''}
        ${datosDefault.direccion_cliente ? `DIRECCION: ${datosCliente.direccion || 'SIN REGISTRO'}<br>` : ''}
      </div>
    </div>
    <!-- Tabla de productos -->
    <table class="w-full text-left mt-2 border border-black" id="tabla">
      <thead class="border border-black bg-gray-800 text-white">
        <tr>
          <th class="" style="text-align:left;padding-top: 5px;padding-bottom: 5px;">#</th>
          <th class="" style="text-align:left;padding-top: 5px;padding-bottom: 5px;">FACT.</th>
          <th class="" style="text-align:left;padding-top: 5px;padding-bottom: 5px;">FECHA</th>
          <th class="precio centrado" style="text-align:right;padding-top: 5px;padding-bottom: 5px;">TOTAL</th>
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
        <div class="border border-black p-2 rounded-lg">
          ENTREGADO POR (${usuarioLocal[0].nombre})
        </div>
        <div class="border border-black p-2 mt-2 rounded-lg">
          RECIBIDO POR
        </div>
      </div>
      <div class="w-1/3 rounded-lg border shadow-sm">
        <table class="text-right text-sm w-full total">
          <tr><td class="px-1">CREDITO</td><td class="px-1">${formatoMonedaRD(totalCredito)}</td></tr>
          <tr><td class="px-1">ABONADO</td><td class="px-1">${formatoMonedaRD(totalAbonado)}</td></tr>
          <tr><td class="px-1">PENDIENTE</td><td class="px-1">${formatoMonedaRD(totalPendiente)}</td></tr>
        </table>
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

  // Cargar el contenido HTML
  win.loadURL(`data:text/html;charset=UTF-8,${encodeURIComponent(htmlContent)}`)

  // Generar PDF
  win.webContents.on('did-finish-load', async () => {
    const pdfPath = path.join(
      app.getPath('downloads'),
      `historialCredito_${datosCliente.nombre}.pdf`
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
