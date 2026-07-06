const { BrowserWindow } = require('electron')
//const { PosPrinter } = require("electron-pos-printer");
const { PosPrinter } = require('@alvarosacari/electron-pos-printer')
const path = require('path')
import { encryptarPassword } from '../funciones/funciones.js'
import axios from 'axios'

export async function printToPOS80(config, data2) {
  try {
    const tokenCifrado = await encryptarPassword(config.VITE_TOKEN, 10)

    const link =
      config.VITE_LINKURL +
      config.VITE_LINK_API +
      '/datoscampo/facturas/no_factura/' +
      data2.factura
    const response = await axios({
      method: 'GET',
      url: `${link}`,
      data: {},
      headers: {
        Accept: '*/*',
        'User-Agent': 'Thunder Client (https://www.thunderclient.com)',
        Authorization: `${tokenCifrado}` // Usa el token proporcionado
      }
      // withCredentials: true // Añade esta línea si es necesario
    })

    const datosRegreso = response.data
    const productos = JSON.parse(response.data.productos)

    const proVenta = productos.map((pro) => {
      console.log('pro', pro)
      return {
        type: 'text',
        value: `<tr>
                   <td colspan="4">${pro.nombre}</td>
                </tr>
                <tr>
                   <td>${pro.cantidad}</td>
                   <td>${pro.empaque}</td>
                   <td>${pro.precio}</td>
                   <td>${pro.precio_venta}</td>
                </tr>`
      }
    })

    const impresora = config.impresora.printerName
    const copias = config.impresora.copies
    const silent = config.impresora.silent
    const width = config.impresora.width
    const margin = config.impresora.margin
    const preview = config.impresora.preview
    const timeOutPerLine = config.impresora.timeOutPerLine
    const columnas = ['Cant.', 'Unidad', 'Precio', 'Importe']

    const options = {
      preview: preview, // Preview in window or print
      width: width, // width of content body
      margin: margin, // margin of content body
      copies: copias, // Number of copies to print
      silent: silent,
      printerName: impresora, // printerName: string, check with webContent.getPrinters()
      timeOutPerLine: timeOutPerLine,
      pageSize: { height: 301000, width: 71000 } // page size
    }

    const data = [
      {
        type: 'text',
        value:
          "<div style='text-align: center; font-size: 24px; font-weight: 700;'>TM POS SRL</div>",
        style: {}
      },
      {
        type: 'text',
        value:
          "<div style='text-align: center; text-decoration: underline; font-size: 10px; color: red;'>Secondary text</div>",
        style: {}
      },
      {
        type: 'image',
        path: path.join(__dirname, '../assets/logo/logo.png'), // file path
        position: 'center',
        width: 'auto',
        height: '60px'
      },
      {
        type: 'table',
        style: { border: '1px solid #ddd' },
        tableHeader: columnas,
        tableBody: [proVenta],
        tableHeaderStyle: { backgroundColor: '#000', color: 'white' },
        tableBodyStyle: { border: '0.5px solid #ddd' },
        tableFooterStyle: { backgroundColor: '#000', color: 'white' }
      },
      {
        type: 'barCode',
        value: '023456789010',
        height: 40,
        width: 2,
        displayValue: true,
        fontsize: 12
      },
      {
        type: 'text',
        value:
          "<div style='text-align: center; font-size: 10px; margin-bottom: 10px;'>************************</div>",
        style: {}
      }
    ]

    await PosPrinter.print(data, options)
    // printWindow.close(); // Cierra la ventana después de imprimir si es necesario
  } catch (error) {
    console.error('Error al imprimir:', error)
  }
}
