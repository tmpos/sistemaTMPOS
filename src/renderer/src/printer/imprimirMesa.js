import { BrowserWindow, app } from 'electron'
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

export async function imprimirMesa(idMesa, datosEmpresa) {
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
  const datosFactura = await peticionesFetch(
    `${link}${api}`,
    `datoscampo/mesas/id/${idMesa}`,
    {},
    tokenCifrado,
    'GET'
  )
  /**********************************************************************/
  const datosCliente = await peticionesFetch(
    `${link}${api}`,
    `datoscampo/clientes/codigo/${datosFactura.cod_cliente}`,
    {},
    tokenCifrado,
    'GET'
  )
  /**********************************************************************/
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

  // Uso de la función para convertir el objeto
  const configuracionfactura = convertToBoolean(datosLocalStorage.configuracionfactura)
  /**********************************************************************/

  const printerName = arrayPrinter[0].nombre

  const datosOtro = JSON.parse(datosFactura.otro)

  /*****************************************************************************/
  const pagocon = datosOtro[0].pagocon
  const sucambio = datosOtro[0].sucambio
  const delivery = datosOtro[0].delivery
  const mesero = datosOtro[0].mesero
  const instalador = datosOtro[0].instalador
  const mesa = datosOtro[0].mesa
  /*****************************************************************************/
  const tablaDefault = datosLocalStorage.tabladefault
  /*****************************************************************************/
  const cantidadCopias = tablaDefault.copias
  /*****************************************************************************/
  let credito = null
  let abonado = null
  let pendiente = null
  /*****************************************************************************/
  if (datosFactura.metodo_pago === 'CREDITO') {
    credito = await peticionesFetch(
      `${link}${api}`,
      `datoscampo/cuentas_cobrar/no_factura/${datosFactura.no_factura}`,
      {},
      tokenCifrado,
      'GET'
    )

    if (credito) {
      abonado = Number(datosFactura.total) - Number(credito.saldo)
      pendiente = credito.saldo
    }
  }
  /*****************************************************************************/

  const qrCodeData = await QRCode.toDataURL(
    `${link}/receipt/ticket?factura=${datosFactura.no_factura}`
  )

  // Generar la tabla de productos en formato HTML
  const productos = JSON.parse(datosFactura.productos)
  const productosHTML = productos
    .map((producto) => {
      if (!producto.hasOwnProperty('precio_final')) {
        producto.precio_final = producto.precio_venta
      }

      const cantidad = Number(producto.cantidad) || 0
      const precioVenta = Number(producto.precio_venta) || 0
      const precioFinal = Number(producto.precio_final) || precioVenta
      const descuento = Number(producto.descuento) || 0
      const impuesto = Number(producto.impuesto) || 0

      const totalProducto = precioFinal * cantidad
      const totalImpuestos = impuesto * cantidad

      return `
      <tr>
        <td colspan="5" style="overflow-wrap: break-word; font-weight: bold; white-space: normal; word-break: break-word;">
          ${producto.nombre}
        </td>
      </tr>
      <tr>
        <td style="padding-left:20px;">${cantidad}</td>
        ${configuracionfactura.empaque ? `<td class="precio centrado">${producto.empaque || ''}</td>` : ''}
        <td>${datosConfiguracion.simbolo}${precioVenta.toFixed(2)}</td>
        ${configuracionfactura.impuestos ? `<td class="precio centrado">${datosConfiguracion.simbolo}${totalImpuestos.toFixed(2)}</td>` : ''}
        ${configuracionfactura.descuento ? `<td class="precio centrado">${datosConfiguracion.simbolo}${descuento.toFixed(2)}</td>` : ''}
        <td class="precio centrado" style="text-align:right;">
          <b>${datosConfiguracion.simbolo}${totalProducto.toFixed(2)}</b>
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
                ${configuracionfactura.no_factura ? `DOC: <b style="font-size:16px">#${datosFactura.no_factura}</b><br>` : ''}
                ${configuracionfactura.comprobante ? `NCF: ${datosFactura.comprobante}<br>` : ''}
                ${configuracionfactura.nombre_cliente ? `CLIENTE: ${datosFactura.nombre_cliente || 'SIN REGISTRO'}<br>` : ''}
                ${configuracionfactura.rnc ? `CEDULA/RNC: ${datosCliente.rnc || 'N/A'}<br>` : ''}
                ${configuracionfactura.telefono_cliente ? `TELEFONO: ${datosCliente.telefono || 'SIN REGISTRO'}<br>` : ''}
                ${configuracionfactura.direccion_cliente ? `DIRECCION: ${datosCliente.direccion || 'SIN REGISTRO'}<br>` : ''}
                ${configuracionfactura.vendedor ? `VENDEDOR: ${datosFactura.vendedor}<br>` : ''}
                ${configuracionfactura.cajero ? `CAJERO: ${datosFactura.cajero}<br>` : ''}
                ${configuracionfactura.mesero ? `MESERO: ${mesero}<br>` : ''}
                ${configuracionfactura.mesa ? `MESA: ${mesa}<br>` : ''}
                ${configuracionfactura.instalador ? `INSTALADOR: ${instalador}<br>` : ''}
                ${configuracionfactura.delivery ? `DELIVERY: ${delivery}<br>` : ''}
                ${configuracionfactura.metodopago ? `METODO DE PAGO: ${datosFactura.metodo_pago}` : ''}
            </p>
        </div>
        <div class="right-column">
            <p>
                ${configuracionfactura.fecha ? `Fecha: ${datosFactura.fecha_emision}<br>` : ''}
                ${configuracionfactura.hora ? `Hora: ${datosFactura.hora}<br>` : ''}
            </p>
        </div>
    </div>
</div>

            <div  class="bordeado" style="text-align:center;padding:3px">
                 ${datosFactura.tipo_factura}
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
                        <td style="text-align:right;"><span style="font-size: 1.5em !important;margin-top: 5px;margin-bottom: 5px;">${datosConfiguracion.simbolo}${(Number(datosFactura.total) + Number(datosFactura.descuento) - Number(datosFactura.impuesto)).toFixed(2)}</span></td>
                    </tr>
                </table>
            </div>

            <div id="descuento" style="font-weight: bold;">
                <table>
                    <tr>
                        <td>DESCUENTO:</td>
                        <td style="text-align:right;"><span style="font-size: 1.5em !important;margin-top: 5px;margin-bottom: 5px;">${datosConfiguracion.simbolo}${datosFactura.descuento}</span></td>
                    </tr>
                </table>
            </div>

            <div id="impuesto" style="font-weight: bold;">
                <table>
                    <tr>
                        <td>${datosConfiguracion.nombre_impuesto}:</td>
                        <td style="text-align:right;"><span style="font-size: 1.5em !important;margin-top: 5px;margin-bottom: 5px;">${datosConfiguracion.simbolo}${datosFactura.impuesto}</span></td>
                    </tr>
                </table>
            </div>

            <div id="total" style="font-weight: bold;">
                <table>
                    <tr>
                        <td>TOTAL:</td>
                        <td style="text-align:right;"><span style="font-size: 1.5em !important;margin-top: 5px;margin-bottom: 5px;">${datosConfiguracion.simbolo}${datosFactura.total}</span></td>
                    </tr>
                </table>
            </div>

             ${
               abonado
                 ? `<div id="abonado" style="font-weight: bold;">
                <table>
                    <tr>
                        <td>ABONADO:</td>
                        <td style="text-align:right;"><span style="font-size: 1.5em !important;margin-top: 5px;margin-bottom: 5px;">${datosConfiguracion.simbolo}${abonado}</span></td>
                    </tr>
                </table>
            </div>`
                 : ''
             }

             ${
               pendiente
                 ? `<div id="pendiente" style="font-weight: bold;">
                <table>
                    <tr>
                        <td>PENDIENTE:</td>
                        <td style="text-align:right;"><span style="font-size: 1.5em !important;margin-top: 5px;margin-bottom: 5px;">${datosConfiguracion.simbolo}${pendiente}</span></td>
                    </tr>
                </table>
            </div>`
                 : ''
             }
            ${
              abonado
                ? ''
                : `<div id="pagocon" style="font-weight: bold;">
                <table>
                    <tr>
                        <td>PAGO CON:</td>
                        <td style="text-align:right;"><span style="font-size: 1.5em !important;margin-top: 5px;margin-bottom: 5px;">${datosConfiguracion.simbolo}${pagocon}</span></td>
                    </tr>
                </table>
            </div>

            <div id="sucambio" style="font-weight: bold;">
                <table>
                    <tr>
                        <td>SU CAMBIO:</td>
                        <td style="text-align:right;"><span style="font-size: 1.5em !important;margin-top: 5px;margin-bottom: 5px;">${datosConfiguracion.simbolo}${sucambio}</span></td>
                    </tr>
                </table>
            </div>`
            }
            

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
                   <img src="${qrCodeData}" alt="Código QR" width="150" height="150"/>
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
            if (copiesPrinted < cantidadCopias) {
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
