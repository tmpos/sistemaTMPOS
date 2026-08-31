import { BrowserWindow, app } from 'electron'
import { readFileSync, writeFileSync } from 'fs'
import QRCode from 'qrcode'
import { exec } from 'child_process'
import JsBarcode from 'jsbarcode'
import bwipjs from 'bwip-js'
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

async function loadConfig() {
  const userDataPath = app.getPath('userData')
  const configPath = path.join(userDataPath, 'config.json')

  try {
    const data = await fs.readFile(configPath, 'utf8')
    return JSON.parse(data)
  } catch (err) {
    console.error('Error al leer el archivo de configuración:', err)
    return {}
  }
}

/************************************************************************/
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
/************************************************************************/
/*async function getInstalledPrinters() {
  const win = new BrowserWindow({ show: false });

  // 1. Intentar con Electron
  let printers = win.webContents.getPrinters();
  if (printers && printers.length > 0) {
    return printers.map(p => p.name);
  }

  // 2. Si no funciona, intentar con PowerShell (Windows moderno)
  return new Promise((resolve, reject) => {
    exec(
      'powershell.exe -Command "Get-Printer | Select-Object -ExpandProperty Name"',
      (error, stdout, stderr) => {
        if (error) {
          reject("❌ No se pudo obtener impresoras: " + stderr);
          return;
        }
        const list = stdout
          .split("\n")
          .map(l => l.trim())
          .filter(l => l.length > 0);
        resolve(list);
      }
    );
  });
}
*/
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

/************************************************************************/

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

/************************************************************************/
async function generateQRCode(data) {
  try {
    return await QRCode.toDataURL(data)
  } catch (err) {
    console.error('Error al generar el código QR:', err)
    return ''
  }
}

/************************************************************************/
function generateProductsHTML(products, config) {
  return products
    .map((product) => {
      // Asignar valores seguros
      const nombre = product.nombre || 'Producto sin nombre'
      const cantidad = Number(product.cantidad) || 1
      const precioVenta = Number(product.precio_venta) || 0
      const descuento = Number(product.descuento) || 0
      const impuesto = Number(product.impuesto) || 0

      // Calcular total si no existe
      if (!product.hasOwnProperty('total')) {
        product.total = (precioVenta * cantidad - descuento).toFixed(2)
      }

      return `
      <tr>
        <td colspan="5" style="overflow-wrap: break-word; font-weight: bold;">${nombre}</td>
      </tr>
      <tr>
        <td style="padding-left:20px;">${cantidad}</td>
        <td class="">${config.simbolo}${precioVenta.toFixed(2)}</td>
        <td class="" ><b>${config.simbolo}${product.total}</b></td>
      </tr>
    `
    })
    .join('')
}

/************************************************************************/

function generatePaymentsHTML(payments, config) {
  return payments
    .map(
      (payment, index) => `
    <tr>
      <td style="padding-left:20px;">${index}</td>
      <td class="precio centrado">${payment.fecha}</td>
      <td class="precio centrado">${payment.hora}</td>
      <td>${config.simbolo}${payment.cantidad}</td>
      <td>${config.simbolo}${payment.saldo}</td>
    </tr>
  `
    )
    .join('')
}
/************************************************************************/
function parseSeguro(str, fallback = {}) {
  try {
    if (!str) return fallback // vacío → fallback
    if (typeof str !== 'string') return str // ya es objeto → devolverlo
    return JSON.parse(str)
  } catch (e) {
    console.warn('⚠️ JSON corrupto detectado. Retornando fallback.', e)
    return fallback // JSON roto → fallback
  }
}

/************************************************************************/

export async function imprimirFacturaCredito(credito, factura, datosEmpresa) {
  try {
    const datosJSON = await loadConfig()
    // const datosLocalStorage = JSON.parse(datosEmpresa);

    const { VITE_LINKURL, VITE_LINK_API, VITE_TOKEN, VITE_IMPRESORA_LOCAL } = datosJSON
    const tokenCifrado = await encryptarPassword(VITE_TOKEN, 10)

    //const datosFactura = await peticionesFetch(`${VITE_LINKURL}${VITE_LINK_API}`, `datoscampo/cuentas_cobrar/no_emision/${factura}`, {}, tokenCifrado, 'GET');

    /*    const datosFactura = JSON.parse(credito)

    const datosFacturaoriginal = JSON.parse(factura)
*/

    const datosFactura = parseSeguro(credito, {})
    const datosFacturaoriginal = parseSeguro(factura, {})
    //  const datosFactura = JSON.parse(factura)
    const datosLocalStorage = parseSeguro(datosEmpresa, {
      empresa: {},
      configuracion: {},
      configuracionfactura: {},
      tabladefault: {}
    })

    // const arrayPrinter = datosLocalStorage.printerconfig;

    const printerConfig =
      typeof datosJSON.impresora === 'string'
        ? parseSeguro(datosJSON.impresora, {})
        : (datosJSON.impresora || {})

    const datosDefault =
      typeof datosJSON.datosDefault === 'string'
        ? parseSeguro(datosJSON.datosDefault, {})
        : (datosJSON.datosDefault || {})

    const cantidadCopias = printerConfig.copies || 1

    // const datosFacturaoriginal = await peticionesFetch(`${VITE_LINKURL}${VITE_LINK_API}`, `datoscampo/facturas/no_factura/${datosFactura.no_factura}`, {}, tokenCifrado, 'GET');

    const empresa = datosLocalStorage.empresa
    const configuracionfactura = convertToBoolean(datosLocalStorage.configuracionfactura)
    const datosConfiguracion = datosLocalStorage.configuracion
    // const printerName = arrayPrinter[0].nombre;

    const impresoraTermica = datosJSON.VITE_IMPRESORA_TERMICA

    const printerName = impresoraTermica || 'POS80'

    const tablaDefault = datosLocalStorage.tabladefault
    const cantidad = tablaDefault.copias

    const qrCodeData = await generateQRCode(
      `${VITE_LINKURL}/receipt/ticket?cotizacion=${datosFactura.no_cotizacion}`
    )

    const barcodeData = await generateBarcode(datosFactura.no_factura)
    const productosHTML = generateProductsHTML(
      parseSeguro(datosFacturaoriginal.productos, []),
      datosConfiguracion
    )
    const pagosHTML = generatePaymentsHTML(parseSeguro(datosFactura.pagos, []), datosConfiguracion)

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
          .ticket { width: ${printerConfig.ticketWidth}px; padding-top:10px; padding-bottom:10px; }
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
            <div class="info">
              <p>
                Fecha: ${datosFactura.fecha_emision}<br>
                DOC: <b>#${datosFactura.no_emision}</b><br>
                FACT#: <b>#${datosFactura.no_factura}</b><br>
                CLIENTE: ${datosFactura.nombre_cliente || 'N/A'}<br>
                CODIGO: ${datosFactura.cod_cliente || 'N/A'}<br>
                DIRECCION: ${datosFactura.direccion_cliente || 'N/A'}<br>
              </p>
            </div>
          </div>

          <div class="bordeado" style="text-align:center;padding:3px;margin-top: 5px;">
            FACTURA A CREDITO <br>
            DETALLES
          </div>
          <table cellspacing="0" cellpadding="0">
            <thead class="linea">
              <tr>
                <th class="" style="text-align:left;padding-top: 5px;padding-bottom: 5px;">CANT.</th>
                <th class="" style="text-align:left;padding-top: 5px;padding-bottom: 5px;">PRECIO</th>
                <th class="" style="padding-top: 5px;padding-bottom: 5px;">TOTAL</th>
              </tr>
            </thead>
            <tbody>
              ${productosHTML}
            </tbody>
          </table>
          <div class="linea" style="margin-top: 10px;"></div>

          <div class="bordeado" style="text-align:center;padding:3px">
            ABONOS
          </div>
          <table cellspacing="0" cellpadding="0">
            <thead class="linea">
              <tr>
                <th class="" style="text-align:left;padding-top: 5px;padding-bottom: 5px;">#</th>
                <th class="" style="text-align:left;padding-top: 5px;padding-bottom: 5px;">FECHA</th>
                <th class="" style="text-align:left;padding-top: 5px;padding-bottom: 5px;">HORA</th>
                <th class="" style="text-align:left;padding-top: 5px;padding-bottom: 5px;">CANT.</th>
                <th class="" style="text-align:left;padding-top: 5px;padding-bottom: 5px;">SALDO</th>
              </tr>
            </thead>
            <tbody>
              ${pagosHTML}
            </tbody>
          </table>
          <div class="linea" style="margin-top: 30px;"></div>
          <div id="subtotal" style="font-weight: bold;">
            <table>
              <tr>
                <td>CREDITO:</td>
                <td style="text-align:right;"><span style="font-size: 1.5em !important;margin-top: 5px;margin-bottom: 5px;">${datosConfiguracion.simbolo}${datosFactura.monto_credito}</span></td>
              </tr>
            </table>
          </div>
          <div id="descuentoS" style="font-weight: bold;">
            <table>
              <tr>
                <td>ABONADO:</td>
                <td style="text-align:right;"><span style="font-size: 1.5em !important;margin-top: 5px;margin-bottom: 5px;">${datosConfiguracion.simbolo}${(Number(datosFactura.monto_credito) - Number(datosFactura.saldo)).toFixed(2)}</span></td>
              </tr>
            </table>
          </div>
          <div id="total" style="font-weight: bold;">
            <table>
              <tr>
                <td>PENDIENTE:</td>
                <td style="text-align:right;"><span style="font-size: 1.5em !important;margin-top: 5px;margin-bottom: 5px;">${datosConfiguracion.simbolo}${datosFactura.saldo}</span></td>
              </tr>
            </table>
          </div>
          <div id="firmaS" class="firmaS bordeadoS" style="min-height:50px">
            <center style="margin-top:30px">
              Firma:____________________________________
            </center>
          </div>
                ${
                  datosFactura.nota
                    ? `<div id="nota" class="bordeadoS" style="min-height:50px">
            <p>${datosFactura.nota}</p>
          </div>`
                    : ''
                }

          <div id="qrcode" class="qr-code">
            <center>
              <div class="bordeado2">
                <img src="${barcodeData}" alt="Código QR" width="150" height="50"/>
              </div>
            </center>
          </div>
        </div>
      </body>
      </html>
    `

    const win = new BrowserWindow({ width: 300, height: 600, show: false })
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
              pageSize: {
                width: printerConfig.pageSizeWidth,
                height: printerConfig.pageSizeHeight
              },
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
  } catch (error) {
    console.error('Error en la función imprimirFacturaCredito:', error)
  }
}
