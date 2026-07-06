import { BrowserWindow, app } from 'electron'
import { readFileSync, writeFileSync } from 'fs'
import QRCode from 'qrcode'
import * as path from 'path'
import fs from 'fs/promises'
import bwipjs from 'bwip-js'
import {
  peticiones,
  generadorCodigo,
  generarCodigoUnico,
  arrayToObjetoFromTabla,
  mensajetoast,
  actualizarLocalStorage,
  nfecha,
  envioElectron,
  peticionesFetch,
  encryptarPassword
} from '../funciones/funciones.js'

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

/******************************************************************/
async function generateBarcode(data) {
  return new Promise((resolve, reject) => {
    bwipjs.toBuffer(
      {
        bcid: 'code128', // Barcode type
        text: data, // Text to encode
        scale: 3, // Scaling factor
        height: 10, // Bar height, in millimeters
        includetext: true, // Show human-readable text
        textxalign: 'center' // Always good to set this
      },
      (err, png) => {
        if (err) {
          reject(err)
        } else {
          resolve(`data:image/png;base64,${png.toString('base64')}`)
        }
      }
    )
  })
}
/******************************************************************/

export async function imprimirNC(factura, datosEmpresa) {
  const datosJSON = await loadConfig()
  const datosLocalStorage = JSON.parse(datosEmpresa)

  const link = datosJSON.VITE_LINKURL
  const api = datosJSON.VITE_LINK_API
  const token = datosJSON.VITE_TOKEN
  const patronTelefono = datosJSON.VITE_PATRON_TELEFONO
  const linkImpresora = datosJSON.VITE_IMPRESORA_LOCAL

  const tokenCifrado = await encryptarPassword(token, 10)

  const arrayPrinter = datosLocalStorage.printerconfig
  /**********************************************************************/
  /**********************************************************************/
  const datosFactura = await peticionesFetch(
    `${link}${api}`,
    `datoscampo/notacredito/no_credito/${factura}`,
    {},
    tokenCifrado,
    'GET'
  )
  /**********************************************************************/
  const barcodeData = await generateBarcode(datosFactura.no_credito)
  /**********************************************************************/
  const empresa = datosLocalStorage.empresa
  /**********************************************************************/

  const printerConfig = JSON.parse(arrayPrinter[0].configuraciones)
  /**********************************************************************/

  const datosConfiguracion = datosLocalStorage.configuracion
  const usuarioLocal = datosLocalStorage.usuarioLocal
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

  const printerName = arrayPrinter[0].nombre

  /*****************************************************************************/
  const tablaDefault = datosLocalStorage.tabladefault
  /*****************************************************************************/
  const cantidad = tablaDefault.copias
  /*****************************************************************************/

  // Generar la tabla de productos en formato HTML

  // Generar el contenido HTML para el ticket
  const htmlContent = `
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

            #descuento { display: ${configuracionfactura.descuento ? 'block' : 'none'}; }
            #subtotal { display: ${configuracionfactura.subtotal ? 'block' : 'none'}; }
            #impuesto { display: ${configuracionfactura.impuestos ? 'block' : 'none'}; }
            #total { display: ${configuracionfactura.total ? 'block' : 'none'}; }
            #qrcode { display: ${configuracionfactura.barcode ? 'block' : 'none'}; }
            #firma { display: ${configuracionfactura.firma ? 'block' : 'none'}; }
            #nota { display: ${configuracionfactura.nota ? 'block' : 'none'}; }
            #sucambio { display: ${configuracionfactura.cambio ? 'block' : 'none'}; }
            #pagocon { display: ${configuracionfactura.cambio ? 'block' : 'none'}; }


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
                   configuracionfactura.logo
                     ? `<img src="${empresa.logoprinter}" alt="Logo" style="max-width: ${printerConfig.logoWidth}px">`
                     : `<div style="font-size:${Number(printerConfig.fontSize) + 8}px !important;font-weight:bold">${empresa.nombre}</div>`
                 }
                </div>
                <div class="info">
                    <p>${configuracionfactura.direccion ? empresa.direccion : ''}<br>${configuracionfactura.telefono ? empresa.telefono : ''}  ${configuracionfactura.email ? '/ ' + empresa.email : ''}<br>${configuracionfactura.legal ? empresa.legal : ''}</p>
                </div>
            </center>

<div id="mid" class="bordeado">
    <div class="info">
        <div class="left-column">
            <p>
                ${configuracionfactura.no_factura ? `DOC: <b style="font-size:16px">#${datosFactura.no_credito}</b><br>` : ''}
                ${configuracionfactura.nombre_cliente ? `CLIENTE: ${datosFactura.nombre_cliente || 'SIN REGISTRO'}<br>` : ''}
                ${configuracionfactura.cajero ? `CAJERO: ${usuarioLocal[0].nombre}<br>` : ''}
            </p>
        </div>
        <div class="right-column">
            <p>
                ${configuracionfactura.fecha ? `Fecha: ${datosFactura.fecha}<br>` : ''}
                ${configuracionfactura.hora ? `Hora: ${datosFactura.hora}<br>` : ''}
            </p>
        </div>
    </div>
</div>

            <div  class="bordeado" style="text-align:center;padding:3px">
                 NOTA DE CREDITO
            </div>
            <table cellspacing="0" cellpadding="0">
                <thead class="linea">
                    <tr>
                      
                        <th class="precio" style="text-align:left;padding-top: 5px;padding-bottom: 5px;">CONCEPTO</th>
                        <th class="precio" style="text-align:left;padding-top: 5px;padding-bottom: 5px;">TOTAL</th>
                       
                    </tr>
                </thead>
                <tbody>
                <tr>
                <td class="precio " style="text-align:left;"><b>${datosFactura.concepto}</b></td>
                <td class="precio centrado" style="text-align:right;"><b>${datosConfiguracion.simbolo}${datosFactura.total}</b></td>
            </tr>
                </tbody>
            </table>

            <div class="linea" style="margin-top: 30px;"></div>

            <div id="total" style="font-weight: bold;">
                <table>
                    <tr>
                        <td>TOTAL:</td>
                        <td style="text-align:right;"><span style="font-size: 1.5em !important;margin-top: 5px;margin-bottom: 5px;">${datosConfiguracion.simbolo}${datosFactura.total}</span></td>
                    </tr>
                </table>
            </div>


            <div id="firma" class="firma bordeado" style="min-height:50px">
                <center style="margin-top:30px">
                  Firma:____________________________________
                 </center>
            </div>

            <div id="nota" class="bordeado" style="min-height:50px">
              <p>${datosFactura.nota ? datosFactura.nota.replace(/\n/g, '<br>') : ''}</p>
            </div>

            <div id="qrcode" class="qr-code ">
                <center>
                  <div class="bordeado2">
                     <img src="${barcodeData}" alt="Código QR" width="150" height="50"/>
                   <div>
                 </center>
            </div>

        </div>
    </body>
    </html>
    `

  const win = new BrowserWindow({ width: 300, height: 600, show: false })

  // Cargar el contenido HTML
  win.loadURL(`data:text/html;charset=UTF-8,${encodeURIComponent(htmlContent)}`)

  win.webContents.on('did-finish-load', () => {
    let copiesPrinted = 0

    const printNextCopy = () => {
      // Inicia la impresión de una copia
      win.webContents.print(
        {
          silent: true, // Impresión silenciosa
          printBackground: true, // Imprime con fondos
          deviceName: printerName, // Nombre de la impresora
          margins: { marginType: 'none' }, // Sin márgenes
          pageSize: { width: 80000, height: 295000 }, // Tamaño de página (80mm de ancho)
          preview: false // Evita mostrar el cuadro de diálogo de impresión
        },
        (success, errorType) => {
          if (!success) {
            console.error('Error en la impresión:', errorType)
          } else {
            // Incrementa el contador de copias impresas
            copiesPrinted++

            // Si aún faltan copias por imprimir, llama de nuevo a la función
            if (copiesPrinted < cantidad) {
              printNextCopy() // Imprime la siguiente copia
            }
          }
        }
      )
    }

    // Inicia el proceso de impresión en bucle
    printNextCopy()
  })
}
