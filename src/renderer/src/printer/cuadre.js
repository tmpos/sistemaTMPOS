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

export async function imprimirCuadre(datos, datosEmpresa, silent, visible, show) {
  /************************************************************/
  const datosArray = JSON.parse(datos)
  /************************************************************/
  const peticionDatos = datosArray.peticion
  /************************************************************/
  const gastosArray = datosArray.gastos
  /************************************************************/
  const ventasArray = datosArray.facturas
  /************************************************************/
  const cxcArray = datosArray.cuentas_cobrar
  /************************************************************/
  const tallerArray = datosArray.taller
  /************************************************************/
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
  //const datosFactura = await peticionesFetch(`${link}${api}`,`datoscampo/cotizacion/no_cotizacion/${factura}`,{},tokenCifrado,'GET');
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

  //const datosOtro = JSON.parse(datosFactura.otro)

  /*****************************************************************************/
  const registroCaja = datosArray.registrocaja
  /*const fondoInicial = registroCaja.reduce((acumulador, fact) => {
    const cantInicio = Number(fact.cant_inicio) || 0;
    return acumulador + cantInicio;
}, 0);*/

  /*const fondoInicial = registroCaja.reduce((acumulador, fact) => {
    const cantInicio = Number(fact.cant_inicio) || 0;
    return acumulador + cantInicio;
}, 0);

const fondoInicialFormatted = fondoInicial !== undefined ? fondoInicial : '0.00';

*/
  /*****************************************************************************/
  //let efectivo = 0;
  //let transferencia = 0;
  //let tarjeta = 0;
  //let abonado = 0;
  //let taller = 0;
  //let entradas = 0;
  //let ganancia = 0;
  //let totalvendido = 0;
  //let devoluciones = 0;
  //let gastos = 0;
  //let cuentasporcobrar = 0;
  /*****************************************************************************/
  const tablaDefault = datosLocalStorage.tabladefault
  /*****************************************************************************/
  const cantidad = tablaDefault.copias
  /*****************************************************************************/

  /*****************************************************************************/

  /*****************************************************************************/
  const taller = tallerArray.reduce(
    (acumulador, factura) => {
      let totalAbono = 0
      let abonos = []

      try {
        abonos = JSON.parse(factura.abono) // Parsear el abono como JSON
      } catch (error) {
        console.error('Error al parsear abonos:', error)
        return acumulador // Devolver el acumulador actual si hay un error
      }

      // Iterar sobre los abonos y sumar según el método de pago y la fecha
      for (let abono of abonos) {
        const fechaBuscar = convertirAFechaTimestamp(abono.fecha, abono.hora)
        const estaFecha = esFechaEnRango(
          fechaBuscar,
          peticionDatos.fechainicio,
          peticionDatos.fechafin
        )

        if (estaFecha) {
          const abonoCantidad = Number(abono.abono)
          totalAbono += abonoCantidad

          // Sumar al método de pago correspondiente
          if (abono.metodo_pago === 'EFECTIVO') {
            acumulador.efectivo += abonoCantidad
          } else if (abono.metodo_pago === 'TARJETA') {
            acumulador.tarjeta += abonoCantidad
          } else if (abono.metodo_pago === 'TRANSFERENCIA') {
            acumulador.transferencia += abonoCantidad
          }

          // Sumar al total general de abonos
          acumulador.total += abonoCantidad
        }
      }

      return acumulador // Devolver el acumulador actualizado
    },
    {
      efectivo: 0,
      tarjeta: 0,
      transferencia: 0,
      total: 0 // Nueva propiedad para el total general
    }
  )
  /*****************************************************************************/

  /*****************************************************************************/

  //const qrCodeData = await QRCode.toDataURL(`${link}/receipt/ticket?cotizacion=${datosFactura.no_cotizacion}`);

  // Generar la tabla de productos en formato HTML
  /*    const productos = JSON.parse(datosFactura.productos);
    const productosHTML = productos.map(producto => {
        const totalProducto = (Number(producto.precio_venta) * Number(producto.cantidad));
        return `
            <tr>
                <td colspan="5" class="" style="overflow-wrap: break-word;font-weight:bold;">${producto.nombre}</td>
            </tr>
            <tr>
                <td style="padding-left:20px;">${producto.cantidad}</td>
                ${configuracionfactura.empaque ? `<td class="precio centrado">${producto.empaque}</td>` : ''}
                <td>${datosConfiguracion.simbolo}${Number(producto.precio_venta)}</td>
                ${configuracionfactura.impuestos ? `<td class="precio centrado">${datosConfiguracion.simbolo}${Number(producto.impuesto)}</td>` : ''}
                <td class="precio centrado" style="text-align:right;"><b>${datosConfiguracion.simbolo}${totalProducto}</b></td>
            </tr>
        `;
    }).join('');*/

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
            <table>
                <tr>
                 <div  class="bordeado" style="text-align:center;padding:3px">
                    INGRESOS
                 </div>
                </tr>
                <tr>
                    <td class="cantidad">Fondo Inicial:</td>
                    <td class="cantidad right-align">${datosConfiguracion.simbolo}${peticionDatos.fondoinicial || 0.0}</td>
                </tr>
                <tr>
                    <td class="cantidad">Total Efectivo:</td>
                    <td class="cantidad right-align">${datosConfiguracion.simbolo}${peticionDatos.efectivo || 0.0}</td>
                </tr>
                <tr>
                    <td class="cantidad">Total Transf:</td>
                    <td class="cantidad right-align">${datosConfiguracion.simbolo}${peticionDatos.transferencia || 0.0}</td>
                </tr>
                <tr>
                    <td class="cantidad">Total Tarjeta:</td>
                    <td class="cantidad right-align">${datosConfiguracion.simbolo}${peticionDatos.tarjeta || 0.0}</td>
                </tr>
                <tr>
                    <td class="cantidad">Total Taller:</td>
                    <td class="cantidad right-align">${datosConfiguracion.simbolo}${peticionDatos.taller || 0.0}</td>
                </tr>
                <tr>
                    <td class="cantidad">Total Entradas:</td>
                    <td class="cantidad right-align">0.00</td>
                </tr>


                <tr>
                    <td class="cantidad">Ganancias:</td>
                    <td class="cantidad right-align">${datosConfiguracion.simbolo}${peticionDatos.ganancia || 0.0}</td>
                </tr>


                <tr>
                    <td class="cantidad">Total Vendido:</td>
                    <td class="cantidad right-align">${datosConfiguracion.simbolo}${peticionDatos.totalvendido || 0.0}</td>
                </tr>
            </table>
            <div class="linea"></div>
            <table>
                <tr>
                 <div  class="bordeado" style="text-align:center;padding:3px">
                    GASTOS
                 </div>
                </tr>
                <tr>
                    <td class="cantidad">Devoluciones:</td>
                    <td class="cantidad right-align">${datosConfiguracion.simbolo}${peticionDatos.devoluciones || 0.0}</td>
                </tr>
                <tr>
                    <td class="cantidad">Total Gastos:</td>
                    <td class="cantidad right-align">${datosConfiguracion.simbolo}${peticionDatos.gastos || 0.0}</td>
                </tr>
                <tr>
                    <td class="cantidad">Total CXC:</td>
                    <td class="cantidad right-align">${datosConfiguracion.simbolo}${peticionDatos.cuentasxcobrar || 0.0}</td>
                </tr>
                <tr>
                    <td class="cantidad">Total Abonado:</td>
                    <td class="cantidad right-align">${datosConfiguracion.simbolo}${peticionDatos.abono || 0.0}</td>
                </tr>

            </table>
            <div class="linea"></div>
            <table>
                <tr>
                    <td class="cantidad2">Total en Caja:</td>
                    <td class="cantidad2 right-align">${Number(peticionDatos.efectivo) + Number(peticionDatos.fondoinicial) - peticionDatos.gastos || 0.0}</td>
                </tr>

                <tr>
                    <td class="cantidad2">Total Real Contado en Caja:</td>
                    <td class="cantidad2 right-align">${datosConfiguracion.simbolo}${peticionDatos.totalcontado || 0.0}</td>
                </tr>
    <tr>
        <td class="cantidad2">DIFERENCIA:</td>
        <td class="cantidad2 right-align">
            ${(() => {
              const totalCaja =
                Number(peticionDatos.efectivo) +
                Number(peticionDatos.fondoinicial) -
                peticionDatos.gastos
              const diferencia = peticionDatos.totalcontado - totalCaja

              if (diferencia > 0) {
                return `Sobrante de ${datosConfiguracion.simbolo}${diferencia || 0.0}`
              } else if (diferencia < 0) {
                return `Faltante de ${datosConfiguracion.simbolo}${Math.abs(diferencia) || 0.0}`
              } else {
                return 'Sin diferencias'
              }
            })()}
        </td>
    </tr>

            </table>
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
