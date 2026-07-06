import { BrowserWindow, app } from 'electron'
import { readFileSync, writeFileSync } from 'fs'
import QRCode from 'qrcode'
import * as path from 'path'
import fs from 'fs/promises'

import {
  peticiones,
  generadorCodigo,
  generarCodigoUnico,
  arrayToObjetoFromTabla,
  mensajetoast,
  actualizarLocalStorage,
  nfecha,
  convertirAFechaTimestamp,
  esFechaEnRango,
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

export async function imprimirRecibo(datosLoL, datosEmpresa, silent, visible, show) {
  /************************************************************/
  // Ajustar los datos que recibimos de datosLoL
  const datosDD = JSON.parse(datosLoL)
  const pagoDatos = datosDD.datos
  /************************************************************/

  // Cargar la configuración
  const datosJSON = await loadConfig()
  const datosLocalStorage = JSON.parse(datosEmpresa)

  const link = datosJSON.VITE_LINKURL
  const api = datosJSON.VITE_LINK_API
  const token = datosJSON.VITE_TOKEN
  const linkImpresora = datosJSON.VITE_IMPRESORA_LOCAL

  const tokenCifrado = await encryptarPassword(token, 10)

  const arrayPrinter = datosLocalStorage.printerconfig
  const empresa = datosLocalStorage.empresa

  /**********************************************************************/
  const printerConfig = JSON.parse(arrayPrinter[0].configuraciones)
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

  const configuracionfactura = convertToBoolean(datosLocalStorage.configuracionfactura)

  /**********************************************************************/
  const printerName = arrayPrinter[0].nombre
  const cantidad = datosLocalStorage.tabladefault.copias

  /**********************************************************************/

  // Generar el contenido HTML para el recibo
  const htmlContent = `
  <!DOCTYPE html>
  <html>
  <head>
      <style>
          * { font-size: ${printerConfig.fontSize}px; font-family: '${printerConfig.fontFamily}'; }
          @page { size: ${printerConfig.pageWidth}px auto; margin: ${printerConfig.margin || 5}px; }
          body { width: ${printerConfig.bodyWidth}px; margin: 5px; padding: 5px; }
          .ticket {
              width: ${printerConfig.ticketWidth}px;
              padding-top:10px;
              padding-bottom:10px;
            }
          .bordeado { border:1px solid #000000; border-radius:5px; padding-left:5px; }
          .centrado { text-align: center; }
          .derecha { text-align: right; }
          .contenedor { margin-bottom: 10px; }
          .fila {
              display: flex;
              width: 100%;
              box-sizing: border-box;
          }
          .columna {
              flex: 1;
              padding: 10px;
              border-right: 1px solid #000;
              box-sizing: border-box;
          }
          .fila .columna:last-child {
              border-right: none;
          }
          .right-align {
              text-align: left;
          }
          #firma { display:'block'}; 
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

          <div style="margin-bottom: 5px;">
              <div class="bordeado" style="text-align:center;padding:3px">
                   DETALLE DEL PAGO
              </div>

              <div class="contenedor">
                  <div class="fila">
                      <div class="columna">Pagado por</div>
                      <div class="columna right-align">${pagoDatos.pagadopor}</div>
                  </div>
                  <div class="fila">
                      <div class="columna">Recibido por</div>
                      <div class="columna right-align">${pagoDatos.recibidopor}</div>
                  </div>
                  <div class="fila">
                      <div class="columna">Cantidad</div>
                      <div class="columna right-align">${datosConfiguracion.simbolo}${parseFloat(pagoDatos.cantidad).toFixed(2)}</div>
                  </div>
                  <div class="fila">
                      <div class="columna">Fecha</div>
                      <div class="columna right-align">${pagoDatos.fecha}</div>
                  </div>
                  <div class="fila">
                      <div class="columna">Hora</div>
                      <div class="columna right-align">${pagoDatos.hora}</div>
                  </div>
              <div class="bordeado" style="text-align:center;padding:3px;">
                   CONCEPTO
              </div>
              <div class="bordeado" style="text-align:center;padding:3px;min-height:50px">
                  ${pagoDatos.concepto}
              </div>

            <div id="firma" class="firma bordeado" style="min-height:50px">
                <center style="margin-top:30px">
                  Firma:____________________________________
                 </center>
            </div>

              </div>
          </div>
      </div>
  </body>
  </html>
`

  const win = new BrowserWindow({ width: 300, height: 600, show: show, autoHideMenuBar: true })
  win.loadURL(`data:text/html;charset=UTF-8,${encodeURIComponent(htmlContent)}`)
  win.webContents.on('did-finish-load', () => {
    win.webContents.print(
      {
        silent: silent, // Para impresión silenciosa
        printBackground: true, // Asegura que los fondos también se impriman
        deviceName: printerName, // Especifica la impresora
        margins: { marginType: 'none' }, // Sin márgenes
        pageSize: { width: 80000, height: 295000 }, // Tamaño de página (80mm de ancho)
        copies: cantidad, // Número de copias
        preview: visible // Evita mostrar el cuadro de diálogo de impresión
      },
      (success, errorType) => {
        if (!success) console.error('Error en la impresión:', errorType)
      }
    )
  })
}
