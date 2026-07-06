import { BrowserWindow, app } from 'electron'
import { readFileSync, writeFileSync } from 'fs'
import QRCode from 'qrcode'
import { exec } from 'child_process'
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

/*********************************************************/
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

/*********************************************************/

export async function imprimirTicketOrden(factura, datosEmpresa) {
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
  // Parsear los datos si vienen como string
  const datosOrden = typeof factura === 'string' ? JSON.parse(factura) : factura
  //const datosOrden = await peticionesFetch(`${link}${api}`,`datoscampo/ordenes/no_orden/${factura}`,{},tokenCifrado,'GET');
  /**********************************************************************/
  const empresa = datosLocalStorage.empresa
  /**********************************************************************/

  /*const printerConfig = JSON.parse(arrayPrinter[0].configuraciones);*/

  const printerConfig =
    typeof datosJSON.impresora === 'string' ? JSON.parse(datosJSON.impresora) : datosJSON.impresora

  /**********************************************************************/
  const cantidadCopias = printerConfig.copies || 1
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
  const impresoraTermica = datosJSON.VITE_IMPRESORA_TERMICA
  //const printerName = arrayPrinter[0].nombre;
  const printerName = impresoraTermica || 'POS80'
  //const datosOtro = JSON.parse(datosOrden.otro)

  /*****************************************************************************/
  /*const pagocon = datosOtro[0].pagocon;
const sucambio = datosOtro[0].sucambio;
const delivery = datosOtro[0].delivery;
const mesero = datosOtro[0].mesero;
const instalador = datosOtro[0].instalador;
const mesa = datosOtro[0].mesa;*/
  /*****************************************************************************/
  const tablaDefault = datosLocalStorage.tabladefault
  /*****************************************************************************/
  const cantidad = tablaDefault.copias
  /*****************************************************************************/

  const qrCodeData = await QRCode.toDataURL(`${link}/receipt/ticket?orden=${datosOrden.no_orden}`)

  // Generar la tabla de productos en formato HTML
  const productos = JSON.parse(datosOrden.productos)
  const productosHTML = productos
    .map((producto) => {
      const totalProducto = (
        Number(producto.precio_venta) * Number(producto.cantidad) -
        Number(producto.descuento)
      ).toFixed(2)
      return `
            <tr>
                <td colspan="5" class="" style="overflow-wrap: break-word;font-weight:bold;">${producto.nombre}</td>
            </tr>
            <tr>
                <td style="padding-left:20px;">${producto.cantidad}</td>
                ${configuracionfactura.empaque ? `<td class="precio centrado">${producto.empaque}</td>` : ''}
                <td>${datosConfiguracion.simbolo}${Number(producto.precio_venta).toFixed(2)}</td>
                ${configuracionfactura.impuestos ? `<td class="precio centrado">${datosConfiguracion.simbolo}${Number(producto.impuesto).toFixed(2)}</td>` : ''}
                ${configuracionfactura.descuento ? `<td class="precio centrado">${datosConfiguracion.simbolo}${Number(producto.descuento).toFixed(2)}</td>` : ''}
                <td class="precio centrado" style="text-align:right;"><b>${datosConfiguracion.simbolo}${totalProducto}</b></td>
            </tr>
        `
    })
    .join('')

  // Calcular subtotal, descuento, impuesto y total
  let subtotal = 0
  let descuentoTotal = 0
  let impuestoTotal = 0

  productos.forEach((producto) => {
    subtotal += Number(producto.precio_venta) * Number(producto.cantidad)
    descuentoTotal += Number(producto.descuento) || 0
    impuestoTotal += Number(producto.impuesto) * Number(producto.cantidad) || 0
  })

  const total = subtotal - descuentoTotal + impuestoTotal

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

            #descuento { display: ${configuracionfactura.descuento ? 'block' : 'none'}; }
            #subtotal { display: ${configuracionfactura.subtotal ? 'block' : 'none'}; }
            #impuesto { display: ${configuracionfactura.impuestos ? 'block' : 'none'}; }
            #total { display: ${configuracionfactura.total ? 'block' : 'none'}; }
            #qrcode { display: ${configuracionfactura.barcode ? 'block' : 'none'}; }
            #firma { display: ${configuracionfactura.firma ? 'block' : 'none'}; }
            #nota { display: ${configuracionfactura.nota ? 'block' : 'none'}; }
            #sucambio { display: ${configuracionfactura.cambio ? 'block' : 'none'}; }
            #pagocon { display: ${configuracionfactura.cambio ? 'block' : 'none'}; }

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
                <div class="info ">
               <p>
                    ${configuracionfactura.fecha ? `Fecha: ${datosOrden.fecha}<br>` : ''}
                    ${configuracionfactura.no_factura ? `DOC: <b>#${datosOrden.no_orden}</b><br>` : ''}
                    ${configuracionfactura.nombre_cliente ? `CLIENTE: ${datosOrden.cliente || 'SIN REGISTRO'}<br>` : ''}
                    ESTADO: ${datosOrden.estado}
                </p>
                </div>
            </div>
            <div  class="bordeado" style="text-align:center;padding:3px;background-color:#2196F3;color:white;font-weight:bold;">
                 ORDEN DE TRABAJO (NO DESCUENTA STOCK)
            </div>
            <table cellspacing="0" cellpadding="0">
                <thead class="linea">
                    <tr>
                        <th class="" style="text-align:left;padding-top: 5px;padding-bottom: 5px;">CANT.</th>
                        ${configuracionfactura.empaque ? `<th class="precio" style="text-align:left;padding-top: 5px;padding-bottom: 5px;">EMPAQ.</th>` : ''}
                        <th class="precio" style="text-align:left;padding-top: 5px;padding-bottom: 5px;">PRECIO</th>
                        ${configuracionfactura.impuestos ? `<th class="precio" style="text-align:left;padding-top: 5px;padding-bottom: 5px;">${datosConfiguracion.nombre_impuesto}</th>` : ''}
                        ${configuracionfactura.descuento ? `<th class="precio" style="text-align:left;padding-top: 5px;padding-bottom: 5px;">DESC</th>` : ''}
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
                        <td>SUBTOTAL:</td>
                        <td style="text-align:right;"><span style="font-size: 1.5em !important;margin-top: 5px;margin-bottom: 5px;">${datosConfiguracion.simbolo}${subtotal.toFixed(2)}</span></td>
                    </tr>
                </table>
            </div>

            <div id="descuento" style="font-weight: bold;">
                <table>
                    <tr>
                        <td>DESCUENTO:</td>
                        <td style="text-align:right;"><span style="font-size: 1.5em !important;margin-top: 5px;margin-bottom: 5px;">${datosConfiguracion.simbolo}${descuentoTotal.toFixed(2)}</span></td>
                    </tr>
                </table>
            </div>

            <div id="impuesto" style="font-weight: bold;">
                <table>
                    <tr>
                        <td>${datosConfiguracion.nombre_impuesto}:</td>
                        <td style="text-align:right;"><span style="font-size: 1.5em !important;margin-top: 5px;margin-bottom: 5px;">${datosConfiguracion.simbolo}${impuestoTotal.toFixed(2)}</span></td>
                    </tr>
                </table>
            </div>

            <div id="total" style="font-weight: bold;">
                <table>
                    <tr>
                        <td>TOTAL:</td>
                        <td style="text-align:right;"><span style="font-size: 1.5em !important;margin-top: 5px;margin-bottom: 5px;">${datosConfiguracion.simbolo}${datosOrden.total}</span></td>
                    </tr>
                </table>
            </div>


            <div id="firma" class="firma bordeado" style="min-height:50px">
                <center style="margin-top:30px">
                  Firma:____________________________________
                 </center>
            </div>

            <div id="nota" class="bordeado" style="min-height:50px">
              <p>${datosOrden.nota}</p>
            </div>

            <div id="qrcode" class="qr-code ">
                <center>
                  <div class="bordeado2">
                   <img src="${qrCodeData}" alt="Código QR" width="150" height="150"/>
                   <div>
                 </center>
            </div>

        </div>
    </body>
    </html>
    `

  /*    const win = new BrowserWindow({
      width: 900,
      height: 700,
      show: true,
      title: 'Orden - Ticket 80mm',
      webPreferences: {
        contextIsolation: true,
        enableRemoteModule: false
      }
    });*/

  const win = new BrowserWindow({ width: 300, height: 600, show: false })

  // Cargar el contenido HTML directamente en la ventana
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

  // La ventana ya está visible con el HTML, el usuario puede imprimir con Ctrl+P
  console.log('✅ Orden Ticket 80mm cargada en ventana')
}
