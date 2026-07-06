import { BrowserWindow, app, webContents } from 'electron'
import { exec } from 'child_process'
import { readFileSync, writeFileSync } from 'fs'
import QRCode from 'qrcode'
import * as path from 'path'
import fs from 'fs/promises'
import { readFile } from 'fs/promises'

import {
  peticiones,
  generadorCodigo,
  generarCodigoUnico,
  arrayToObjetoFromTabla,
  mensajetoast,
  actualizarLocalStorage,
  nfecha,
  envioElectron,
  peticionesFetchOffline,
  peticionesFetch,
  encryptarPassword
} from '../funciones/funciones.js'

// Función para imprimir el ticket en formato HTML

const parsePrinters = (stdout) => {
  return stdout
    .split(/\r?\n/) // cortar por saltos de línea
    .map((line) => line.trim()) // quitar espacios
    .filter((line) => line.length > 0) // quitar líneas vacías
}

/************************************************************************/
// 👉 Función para listar impresoras
const getInstalledPrinters = async () => {
  return new Promise((resolve, reject) => {
    exec(
      'powershell.exe -NoProfile -ExecutionPolicy Bypass -Command "Get-Printer | Select-Object -ExpandProperty Name"',
      (error, stdout, stderr) => {
        if (error) {
          console.error('❌ Error listando impresoras:', stderr || error.message)
          reject(new Error('No se pudieron listar las impresoras'))
          return
        }

        console.log('📄 Raw result:', stdout)
        const lista = parsePrinters(stdout)
        console.log('🖨️ Impresoras disponibles:', lista)

        resolve(lista)
      }
    )
  })
}

async function updateConfig(newData) {
  const userDataPath = app.getPath('userData')
  const configPath = path.join(userDataPath, 'config.json')

  try {
    const data = JSON.stringify(newData, null, 2) // Formatea el JSON con espaciado de 2
    await fs.writeFile(configPath, data, 'utf8')
    return newData
  } catch (err) {
    console.error('Error al escribir en el archivo de configuración:', err)
    return null
  }
}

/****************************************/
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
/****************************************/

export async function imprimirTicketCXC(facturas, cliente, datosEmpresa) {
  const datosJSON = await loadConfig()
  const datosLocalStorage = JSON.parse(datosEmpresa)

  const link = datosJSON.VITE_LINKURL
  const api = datosJSON.VITE_LINK_API
  const token = datosJSON.VITE_TOKEN
  const patronTelefono = datosJSON.VITE_PATRON_TELEFONO
  const linkImpresora = datosJSON.VITE_IMPRESORA_LOCAL
  const impresoraTermica = datosJSON.VITE_IMPRESORA_TERMICA

  if (!impresoraTermica) {
    const clonedData = JSON.parse(JSON.stringify(datosJSON))
    clonedData.VITE_IMPRESORA_TINTA = ''
    clonedData.VITE_IMPRESORA_TERMICA = ''
    await updateConfig(clonedData)
  }

  const datosImpresoraLocal = datosJSON.impresora
  const datosImpresora = {
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

  if (datosImpresoraLocal.printerName) {
    const clonedData = JSON.parse(JSON.stringify(datosJSON))
    clonedData.impresora = JSON.stringify(datosImpresora)
    await updateConfig(clonedData)
  }

  const datosDefault =
    typeof datosJSON.datosDefault === 'string'
      ? JSON.parse(datosJSON.datosDefault)
      : datosJSON.datosDefault

  const printerConfig =
    typeof datosJSON.impresora === 'string' ? JSON.parse(datosJSON.impresora) : datosJSON.impresora

  const datosDefaultDATA = {
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

  if (!datosDefault) {
    const clonedData = JSON.parse(JSON.stringify(datosJSON))
    clonedData.datosDefault = JSON.stringify(datosDefaultDATA)
    await updateConfig(clonedData)
    //await window.electron.ipcRenderer.invoke('actualizarjson', clonedData)
  }

  const tokenCifrado = await encryptarPassword(token, 10)

  // const arrayPrinter = datosLocalStorage.printerconfig
  /**********************************************************************/
  /*  const datosFactura = await peticionesFetch(
    `${link}${api}`,
    `datoscampo/facturas/no_factura/${factura}`,
    {},
    tokenCifrado,
    'GET'
  )
*/
  const facturasArray = JSON.parse(facturas)

  /**********************************************************************/
  /*  const datosCliente = await peticionesFetch(
    `${link}${api}`,
    `datoscampo/clientes/codigo/${datosFactura.cod_cliente}`,
    {},
    tokenCifrado,
    'GET'
  )*/
  const datosCliente = JSON.parse(cliente)
  /**********************************************************************/
  const empresa = datosLocalStorage.empresa
  /**********************************************************************/

  /**********************************************************************/

  const datosConfiguracion = datosLocalStorage.configuracion
  /**********************************************************************/
  let totalCredito = 0
  let totalAbonado = 0
  let totalPendiente = 0
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
  const printerName = impresoraTermica || 'POS80'
  /*****************************************************************************/
  const tablaDefault = datosLocalStorage.tabladefault
  /*****************************************************************************/
  const cantidadCopias = printerConfig.copies || 1
  /*****************************************************************************/

  /*  const qrCodeData = await QRCode.toDataURL(
    `${link}/receipt/ticket?factura=${datosFactura.no_factura}`
  )*/

  // Generar la tabla de productos en formato HTML
  // const productos = JSON.parse(datosFactura.productos)
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
        <td class="text-left">${pago.nopago}</td>
        <td class="text-right">${pago.cantidad}</td>
        <td class="text-right">${pago.metodo}</td>
        <td class="text-right">${pago.saldo}</td>
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
        <td colspan="5"><p>ABONOS REALIZADOS</p></td>
      </tr>
      <tr>
        <td colspan="5" class="bordeado">
          <table border="0" cellspacing="0" cellpadding="0" class="table table-hover">
            <thead>
              <tr>
                <th class="text-left">No.</th>
                <th class="text-right">CANT.</th>
                <th class="text-right">MET.</th>
                <th class="text-right">SALDO</th>
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

        </style>
    </head>
    <body>
        <div class="ticket">
            <center id="top">
                <div class="logos" style="text-align: center;">
                 ${
                   datosDefault.logo
                     ? `<img src="${empresa.logoprinter}" alt="Logo" style="max-width: ${printerConfig.logoWidth}px">`
                     : `<div style="font-size:${Number(printerConfig.fontSize) + 8}px !important;font-weight:bold">${empresa.nombre}</div>`
                 }
                </div>
                <div class="info">
                    <p>${datosDefault.direccion ? empresa.direccion : ''}<br>${datosDefault.telefono ? empresa.telefono : ''}  ${datosDefault.email ? '/ ' + empresa.email : ''}<br>${datosDefault.legal ? empresa.legal : ''}</p>
                </div>
            </center>

<div id="mid" class="bordeado">
    <div class="infoAA">
        <div class="left-columnAA">
            <p>
                ${datosDefault.nombre_cliente ? `CLIENTE: ${datosCliente.nombre || 'SIN REGISTRO'}<br>` : ''}
                ${datosDefault.rnc ? `CEDULA/RNC: ${datosCliente.rnc || 'N/A'}<br>` : ''}
                ${datosDefault.telefono_cliente ? `TELEFONO: ${datosCliente.telefono || 'SIN REGISTRO'}<br>` : ''}
                ${datosDefault.direccion_cliente ? `DIRECCION: ${datosCliente.direccion || 'SIN REGISTRO'}<br>` : ''}

            </p>
        </div>
    </div>
</div>

            <div  class="bordeado" style="text-align:center;padding:3px">
                 FACTURAS PENDIENTE
            </div>
            <table cellspacing="0" cellpadding="0">
                <thead class="linea">
                    <tr>
                        <th class="" style="text-align:left;padding-top: 5px;padding-bottom: 5px;">#</th>
                        <th class="" style="text-align:left;padding-top: 5px;padding-bottom: 5px;">FACT.</th>
                        <th class="" style="text-align:left;padding-top: 5px;padding-bottom: 5px;">FECHA</th>
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
                        <td>CREDITO:</td>
                        <td style="text-align:right;"><span style="font-size: 1.5em !important;margin-top: 5px;margin-bottom: 5px;">${datosConfiguracion.simbolo}${parseFloat(totalCredito).toFixed(2)}</span></td>
                    </tr>
                </table>
            </div>

            <div id="descuento" style="font-weight: bold;">
                <table>
                    <tr>
                        <td>ABONADO:</td>
                        <td style="text-align:right;"><span style="font-size: 1.5em !important;margin-top: 5px;margin-bottom: 5px;">${datosConfiguracion.simbolo}${parseFloat(totalAbonado).toFixed(2)}</span></td>
                    </tr>
                </table>
            </div>

            <div id="total" style="font-weight: bold;">
                <table>
                    <tr>
                        <td>PENDIENTE:</td>
                        <td style="text-align:right;"><span style="font-size: 1.5em !important;margin-top: 5px;margin-bottom: 5px;">${datosConfiguracion.simbolo}${parseFloat(totalPendiente).toFixed(2)}</span></td>
                    </tr>
                </table>
            </div>


            

            <div id="firma" class="firma bordeado" style="min-height:50px">
                <center style="margin-top:30px">
                  Firma:____________________________________
                 </center>
            </div>

        </div>
    </body>
    </html>
    `

  const win = new BrowserWindow({ width: 300, height: 600, show: false })

  // Cargar el contenido HTML
  win.loadURL(`data:text/html;charset=UTF-8,${encodeURIComponent(htmlContent)}`)

  win.webContents.on('did-finish-load', async () => {
    let copiesPrinted = 0

    try {
      const printers = await getInstalledPrinters()

      // Buscar si existe la impresora configurada
      const encontrada = printers.find((p) => p.toLowerCase() === printerName.toLowerCase())

      // Si no existe, usar la primera impresora de la lista como fallback
      const nombreImpresoraFinal = encontrada || printers[0]

      if (!encontrada) {
        console.warn(
          `⚠️ La impresora "${printerName}" no fue encontrada. Usando predeterminada: "${nombreImpresoraFinal}"`
        )
      }

      const printNextCopy = () => {
        win.webContents.print(
          {
            silent: true,
            printBackground: true,
            deviceName: nombreImpresoraFinal,
            margins: { marginType: 'none' },
            pageSize: { width: printerConfig.pageSizeWidth, height: printerConfig.pageSizeHeight },
            preview: false
          },
          (success, errorType) => {
            if (!success) {
              console.error('❌ Error en la impresión:', errorType)
              win.close() // cerrar si falla
            } else {
              copiesPrinted++
              if (copiesPrinted < cantidadCopias) {
                printNextCopy() // seguir imprimiendo
              } else {
                console.log('✅ Impresión finalizada, cerrando ventana.')
                win.close() // cerrar al terminar todas las copias
              }
            }
          }
        )
      }

      printNextCopy()
    } catch (err) {
      console.error('Error al obtener las impresoras instaladas:', err)
    }
  })
}
