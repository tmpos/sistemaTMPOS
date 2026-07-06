import { BrowserWindow, app } from 'electron'
import { readFileSync, writeFileSync } from 'fs'
import QRCode from 'qrcode'
import * as path from 'path'
import fs from 'fs/promises'
import { exec } from 'child_process'
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

export async function imprimirProductosVendidos(datosLoL, datosEmpresa, silent, visible, show) {
  /************************************************************/
  const datosDD = JSON.parse(datosLoL)
  const datosArray = datosDD.datos
  const peticionDatos = datosDD.peticion
  /************************************************************/

  /************************************************************/
  const datosJSON = await loadConfig()
  const datosLocalStorage = JSON.parse(datosEmpresa)

  const link = datosJSON.VITE_LINKURL
  const api = datosJSON.VITE_LINK_API
  const token = datosJSON.VITE_TOKEN
  const patronTelefono = datosJSON.VITE_PATRON_TELEFONO
  const linkImpresora = datosJSON.VITE_IMPRESORA_LOCAL
  const impresoraTermica = datosJSON.VITE_IMPRESORA_TERMICA
  const tokenCifrado = await encryptarPassword(token, 10)

  const arrayPrinter = datosLocalStorage.printerconfig
  /**********************************************************************/
  //const datosFactura = await peticionesFetch(`${link}${api}`,`datoscampo/cotizacion/no_cotizacion/${factura}`,{},tokenCifrado,'GET');
  /**********************************************************************/
  const empresa = datosLocalStorage.empresa
  /**********************************************************************/

  //const printerConfig = JSON.parse(arrayPrinter[0].configuraciones);
  /**********************************************************************/
  const printerConfig =
    typeof datosJSON.impresora === 'string' ? JSON.parse(datosJSON.impresora) : datosJSON.impresora

  /**********************************************************************/
  const datosDefault =
    typeof datosJSON.datosDefault === 'string'
      ? JSON.parse(datosJSON.datosDefault)
      : datosJSON.datosDefault
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

  //const printerName = arrayPrinter[0].nombre;
  const printerName = impresoraTermica || 'POS80'
  //const datosOtro = JSON.parse(datosFactura.otro)

  /*****************************************************************************/

  /*****************************************************************************/

  /*****************************************************************************/
  const tablaDefault = datosLocalStorage.tabladefault
  /*****************************************************************************/
  const cantidad = tablaDefault.copias
  /*****************************************************************************/
  const cantidadCopias = printerConfig.copies || 1
  /*****************************************************************************/

  /*****************************************************************************/

  /*****************************************************************************/

  /*****************************************************************************/

  const productosHTML = datosArray
    .map((producto) => {
      return `
        <tr>
            <td style="text-align:left; padding: 5px;">${producto.nombre}</td>
            <td style="text-align:right; padding: 5px;">${producto.cantidad}</td>
            <td style="text-align:right; padding: 5px;">${datosConfiguracion.simbolo}${producto.total.toFixed(2)}</td>
        </tr>
    `
    })
    .join('')

  const totalVendido = datosArray.reduce((acc, producto) => acc + producto.total, 0)
  const totalVendidoFormateado = totalVendido.toFixed(2) // Formateo a dos decimales

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
            table { width: 100%; border-collapse: collapse; border-spacing: 0 !important; }
            td, th { width: ${printerConfig.ticketWidth}px;}
            .bordeado2 {border:1px solid #000000; border-radius:5px; padding:3px;max-width:150px;margin-top:5px;}
            .centrado { text-align: center; align-content: center; }
            .derecha { text-align: right; }
            .linea { width: 100%; border-top: 1px solid #000; padding-top: 5px; padding-bottom: 5px; margin-bottom: 5px; padding-right: 10px; }
            .bordeado { border:1px solid #000000; border-radius:5px; padding-left:5px; }

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

            <div  class="bordeado" style="text-align:center;padding:3px">
                 DATOS DE LA CAJA
            </div>

            <div class="contenedor">
                <div class="fila">
                    <div class="columna">Rango de Fecha</div>
                    <div class="columna right-align">${peticionDatos.fechainicio} - ${peticionDatos.fechafin}</div>
                </div>
                <div class="fila">
                    <div class="columna">Hora de Inicio</div>
                    <div class="columna right-align">${peticionDatos.horainicio}</div>
                </div>
                <div class="fila">
                    <div class="columna">Hora de Cierre</div>
                    <div class="columna right-align">${peticionDatos.horafin}</div>
                </div>
            </div>
        </div>

        <div class="contenedor">

            <div  class="bordeado" style="text-align:center;padding:3px">
                 PRODUCTOS VENDIDOS
            </div>

            <table>
                <thead>
                    <tr>
                        <th>Producto</th>
                        <th>Cantidad</th>
                        <th>Total</th>
                    </tr>
                </thead>
                <tbody>
                    ${productosHTML}
                </tbody>
            </table>
            
        </div>
            </div>

<div class="bordeado" style="text-align:center; padding:5px; font-size:24px; font-weight: bold;">
    TOTAL: ${datosConfiguracion.simbolo}${totalVendidoFormateado}
</div>


        </div>
    </body>
    </html>
    `

  const win = new BrowserWindow({ width: 300, height: 600, show: show, autoHideMenuBar: true })
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
