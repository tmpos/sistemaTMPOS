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

export async function reciboTaller(datosLoL, datosEmpresa, silent, visible, show) {
  /************************************************************/
  /************************************************************/
  const datosJSON = await loadConfig()

  const datosArray = parseSeguro(datosLoL, {})
  const datosLocalStorage = parseSeguro(datosEmpresa, {
    empresa: {},
    configuracion: {},
    configuracionfactura: {}
  })

  const link = datosJSON.VITE_LINKURL
  const api = datosJSON.VITE_LINK_API
  const token = datosJSON.VITE_TOKEN
  const patronTelefono = datosJSON.VITE_PATRON_TELEFONO
  const linkImpresora = datosJSON.VITE_IMPRESORA_LOCAL
  const impresoraTermica = datosJSON.VITE_IMPRESORA_TERMICA
  const tokenCifrado = await encryptarPassword(token, 10)

  //const arrayPrinter = datosLocalStorage.printerconfig
  /**********************************************************************/
  //const datosFactura = await peticionesFetch(`${link}${api}`,`datoscampo/cotizacion/no_cotizacion/${factura}`,{},tokenCifrado,'GET');
  /**********************************************************************/
  const empresa = datosLocalStorage.empresa
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

  //const datosOtro = JSON.parse(datosFactura.otro)

  const printerName = impresoraTermica || 'POS80'
  /*****************************************************************************/
  const cantidadCopias = printerConfig.copies || 1
  /*****************************************************************************/

  /*****************************************************************************/
  //const tablaDefault = datosLocalStorage.tabladefault;
  /*****************************************************************************/
  //const cantidad = tablaDefault.copias;
  const cantidad = printerConfig.copies || 1
  /*****************************************************************************/

  /*****************************************************************************/

  /*****************************************************************************/
  //https://aasolutions.tmposrd.com/vista/tallertermica?factura=0000001
  const qrCodeData = await QRCode.toDataURL(
    `${link}/vista/tallertermica?factura=${datosArray.no_factura}`
  )
  /*****************************************************************************/
  //const datosAbono = JSON.parse(datosArray.abono);
  const datosAbono = parseSeguro(datosArray.abono, [])
  const primerDato = datosAbono[0] ?? { recibidopor: 'N/A' }
  //const primerDato = datosAbono[0]?datosAbono[0]:{recibidopor:'N/A'};
  const totalAbonos = datosAbono
    .map((ab) => ab.abono)
    .reduce((sum, abono) => sum + Number(abono), 0)

  const fallasArray = parseSeguro(datosArray.fallas, [])

  const fallas = Array.isArray(fallasArray) ? fallasArray.map((f) => f.propiedad).join(', ') : ''

  const accesoriosArray = parseSeguro(datosArray.accesorios, [])

  const accesorios = Array.isArray(accesoriosArray)
    ? accesoriosArray.map((f) => f.propiedad).join(', ')
    : ''

  /*****************************************************************************/
  //const fallas = JSON.parse(datosArray.fallas).map(fallas=>fallas.propiedad).join(',')
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
            .contenedor {
                border: 2px solid #000;
                border-radius: 5px;
                box-sizing: border-box;
                padding: 10px;
                width: 100%;
            }
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
        .fallas {
            word-wrap: break-word;
            white-space: pre-wrap;
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


        <div class="contenedorA">

    <div id="mid">
            <div class="info bordeado">
                <p> 
                    Fecha : ${datosArray.fecha_entrada}</br>
                    DOC   : ${datosArray.no_factura}</br>
                    CLIENTE   : ${datosArray.nombre}<br>
                    CEDULA   : ${datosArray.cedula}</br>
                </p>
            </div>
  
    </div>

            <div  class="bordeado" style="text-align:center;padding:3px;margin-bottom:5px;margin-top:5px">
                 RESUMEN DE LA ORDEN
            </div>

 <table style="margin-bottom: 10px;" class="contenedor">
        <tr>
            <td class="cantidad" width="20">EQUIPO:</td>
            <td class="cantidad2" width="20">${datosArray.equipo}</td>
        </tr>
        <tr>
            <td class="cantidad" width="20">MARCA:</td>
            <td class="cantidad2" width="20">${datosArray.marca}</td>
        </tr>
        <tr>
            <td class="cantidad" width="20">MODELO:</td>
            <td class="cantidad2" width="20">${datosArray.modelo}</td>
        </tr>
        <tr>
            <td class="cantidad" width="20">IMEI:</td>
            <td class="cantidad2" width="20">${datosArray.imei}</td>
        </tr>
        <tr>
            <td class="cantidad" width="20">SERIAL:</td>
            <td class="cantidad2" width="20">${datosArray.serial}</td>
        </tr>
        <tr>
            <td class="cantidad" width="20">CLAVE:</td>
            <td class="cantidad2" width="20">NO SE REVELA</td>
        </tr>
        <tr>
            <td class="cantidad" width="20">ACCESORIOS:</td>
            <td class="cantidad2" width="20">${accesorios}</td>
        </tr>
        <tr>
            <td class="cantidad" width="20">OBSERVACIONES:</td>
            <td class="cantidad2" width="20">${datosArray.observaciones}</td>
        </tr>
        <tr>
            <td class="cantidad" width="20">FALLAS:</td>
            <td class="cantidad2 fallas" width="20">${fallas}</td>
        </tr>
        <tr>
            <td class="cantidad" width="20">PIEZAS CAMBIADAS:</td>
            <td class="cantidad2" width="20">${datosArray.piezas}</td>
        </tr>
        <tr>
            <td class="cantidad" width="20">TECNICO ASIGNADO:</td>
            <td class="cantidad2" width="20">${datosArray.tecnico}</td>
        </tr>
        <tr>
            <td class="cantidad" width="20">RECIBIDO POR:</td>
            <td class="cantidad2" width="20">${primerDato.recibidopor}</td>
        </tr>

            <tr>
                <td class="cantidad" width="20">ENTREGADO POR:</td>
                <td class="cantidad2" width="20">ENTREGADOR POR</td>
            </tr>

        <tr>
            <td class="cantidad" width="20">FECHA ENTRADA:</td>
            <td class="cantidad2" width="20">${datosArray.fecha_entrada}</td>
        </tr>
        <tr>
            <td class="cantidad" width="20">FECHA ENTREGA:</td>
            <td class="cantidad2" width="20">${datosArray.fecha_entrega}</td>
        </tr>
        <tr>
            <td class="cantidad" width="20">ESTADO:</td>
            <td class="cantidad2" width="20"><b>${datosArray.estado}</b></td>
        </tr>
    </table>

    <div class="linea0" style="margin-bottom: 10px;">


        <div id="subtotal" style="text-align: right;font-weight: bold;padding-right: 10px;">
            <span>TOTAL: </span>
            <span>${datosArray.total}</span>
        </div>

            <div id="impuesto" style="text-align: right;font-weight: bold;padding-right: 10px;">
                <span>ABONADO: </span>

                <span>${totalAbonos}</span>
            </div>

        <div id="descuento" style="text-align: right;font-weight: bold;padding-right: 10px;">
            <span>PENDIENTE: </span>
            <span>${datosArray.saldo}</span>
        </div>
    </div>


        <div class="" style="text-align: center;">
            <img src="${qrCodeData}" alt="" style="width: 150px;position: relative;">
        </div>
 
        </div>
            </div>



        </div>
    </body>
    </html>
    `

  return new Promise((resolve) => {
    const win = new BrowserWindow({ width: 300, height: 600, show: show, autoHideMenuBar: true })
    let respuestaEnviada = false
    const finalizarImpresion = (resultado) => {
      if (respuestaEnviada) return
      respuestaEnviada = true
      if (!win.isDestroyed()) {
        win.close()
      }
      resolve(resultado)
    }
    win.loadURL(`data:text/html;charset=UTF-8,${encodeURIComponent(htmlContent)}`)
    win.webContents.on('did-finish-load', async () => {
      let copiesPrinted = 0

      try {
        const printers = await getInstalledPrinters()

        // Buscar si existe la impresora configurada
        const encontrada = printers.find((p) => p.toLowerCase() === printerName.toLowerCase())

        // Si no existe, usar la primera impresora de la lista como fallback
        const nombreImpresoraFinal = encontrada || printers[0]

        if (!nombreImpresoraFinal) {
          finalizarImpresion({ success: false, error: 'No hay impresoras instaladas disponibles' })
          return
        }

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
                width: Number(printerConfig.pageSizeWidth) || 80000,
                height: Number(printerConfig.pageSizeHeight) || 295000
              },
              preview: false
            },
            (success, errorType) => {
              if (!success) {
                console.error('❌ Error en la impresión:', errorType)
                finalizarImpresion({
                  success: false,
                  error: errorType || 'No se pudo imprimir el ticket'
                })
              } else {
                copiesPrinted++
                if (copiesPrinted < cantidadCopias) {
                  printNextCopy() // seguir imprimiendo
                } else {
                  console.log('✅ Impresión finalizada, cerrando ventana.')
                  finalizarImpresion({ success: true, printerName: nombreImpresoraFinal })
                }
              }
            }
          )
        }

        printNextCopy()
      } catch (err) {
        console.error('Error al obtener las impresoras instaladas:', err)
        finalizarImpresion({
          success: false,
          error: err.message || 'Error al obtener las impresoras instaladas'
        })
      }
    })
  })
}
