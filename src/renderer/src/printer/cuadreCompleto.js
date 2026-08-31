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
  envioElectron
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

const fechaYhora = (fecha) => {
  const array = fecha.split(' ')

  return array
}

/************************************************************/
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
/************************************************************/
export async function imprimirCuadreCompleto(
  totalContado,
  datosEmpresa,
  silent,
  visible,
  show,
  fechaR = false
) {
  /************************************************************/
  let fechas = nfecha('timestampcompleta')
  let horaInicial = '09:00 AM'
  let horaFinal = nfecha('hora')
  let inicioCaja = 0

  if (fechaR) {
    const lasFechas = JSON.parse(fechaR)
    const fechaHoraInicial = fechaYhora(lasFechas.fechainicio)
    horaInicial = fechaHoraInicial[1]
    const fechaHoraFinal = fechaYhora(lasFechas.fechafin)
    horaFinal = fechaHoraFinal[1]
    fechas = lasFechas
    inicioCaja = lasFechas.cantidadInicio
  }

  let monedas = false
  let monedasDD = {}

  const datosJSON = await loadConfig()
  const impresoraTermica = datosJSON.VITE_IMPRESORA_TERMICA
  const datosImpresoraLocal = datosJSON.impresora

  //const jsonData = await peticionesFetch(`${link}${api}`,`datosventasporrango`,
  //  {"fechainicio":fechas.fechainicio,"fechafinal":fechas.fechafin},tokenCifrado,'POST');
  /************************************************************/
  /************************************************************/
  const datosLocalStorage = typeof datosEmpresa === 'string' ? JSON.parse(datosEmpresa) : datosEmpresa || {}
  //const arrayPrinter = datosLocalStorage.printerconfig
  /**********************************************************************/
  if (datosLocalStorage.monedero) {
    monedas = true
    monedasDD = datosLocalStorage.monedero
  }

  /**********************************************************************/
  const datosCajaRecibidos = datosLocalStorage.datoscaja || {}
  const asArray = (value) => (Array.isArray(value) ? value : [])
  const jsonData = {
    facturas: asArray(datosCajaRecibidos.facturas),
    gastos: asArray(datosCajaRecibidos.gastos),
    entradas: asArray(datosCajaRecibidos.entradas),
    devoluciones: asArray(datosCajaRecibidos.devoluciones),
    cuentas_cobrar: asArray(datosCajaRecibidos.cuentas_cobrar),
    taller: asArray(datosCajaRecibidos.taller),
    registrocaja: asArray(datosCajaRecibidos.registrocaja),
    cuadres: asArray(datosCajaRecibidos.cuadres).length > 0
      ? asArray(datosCajaRecibidos.cuadres)
      : asArray(datosCajaRecibidos.registrocaja)
  }
  console.log('jsonData', jsonData)
  /**********************************************************************/
  //const datosFactura = await peticionesFetch(`${link}${api}`,`datoscampo/cotizacion/no_cotizacion/${factura}`,{},tokenCifrado,'GET');
  /**********************************************************************/
  const empresa = datosLocalStorage.empresa || {}
  const usuario = datosLocalStorage.usuario || {}
  /**********************************************************************/

  const printerConfigDefault = {
    fontSize: 10,
    fontFamily: 'Arial',
    pageWidth: 300,
    bodyWidth: 250,
    ticketWidth: 240,
    logoWidth: 100,
    pageSizeWidth: 80000,
    pageSizeHeight: 295000,
    copies: 1,
    margin: 5
  }
  let printerConfig = printerConfigDefault
  try {
    const configuracionImpresora = typeof datosImpresoraLocal === 'string'
      ? JSON.parse(datosImpresoraLocal)
      : datosImpresoraLocal
    printerConfig = { ...printerConfigDefault, ...(configuracionImpresora || {}) }
  } catch (error) {
    console.warn('Configuración de impresora inválida; se usarán valores predeterminados:', error)
  }
  /**********************************************************************/

  const datosConfiguracion = datosLocalStorage.configuracion || { simbolo: 'RD$' }
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
  //const configuracionfactura = convertToBoolean(datosLocalStorage.configuracionfactura)
  /**********************************************************************/

  const datosDefault =
    typeof datosJSON.datosDefault === 'string'
      ? JSON.parse(datosJSON.datosDefault)
      : datosJSON.datosDefault

  // Uso de la función para convertir el objeto
  //const configuracionfactura = convertToBoolean(datosLocalStorage.configuracionfactura)
  const configuracionfactura = datosDefault
  /**********************************************************************/

  //const printerName = arrayPrinter[0].nombre
  const printerName = impresoraTermica || 'POS80'
  const cantidadCopias = printerConfig.copies || 1

  /*****************************************************************************/
  //const registroCaja = datosArray.registrocaja
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
  let efectivo = 0
  let transferencia = 0
  let tarjeta = 0
  let abonado = 0
  let taller = 0
  let entradas = 0
  let ganancia = 0
  let totalvendido = 0
  let devoluciones = 0
  let gastos = 0
  let cuentasxcobrar = 0
  let efectivoCxC = 0
  let tarjetaCxC = 0
  let trasnferenciaCxC = 0
  let impuestos = 0
  let cantFacturas = 0
  let efectivoVentas = 0
  let propinas = 0
  let tarjetaVenta = 0
  let transferenciaVenta = 0
  let efectivoTaller = 0
  let tarjetaTaller = 0
  let transferenciaTaller = 0
  let chqueVentas = 0
  let cheque = 0
  const normalizar = (valor) => String(valor || '').trim().toUpperCase()
  const parseMovimientos = (valor) => {
    try {
      const movimientos = Array.isArray(valor) ? valor : JSON.parse(valor || '[]')
      return Array.isArray(movimientos) ? movimientos : []
    } catch (error) {
      return []
    }
  }
  const fechaMovimiento = (movimiento) =>
    movimiento?.timestamp ||
    movimiento?.created_at ||
    convertirAFechaTimestamp(movimiento?.fecha, movimiento?.hora)
  const movimientoEnRango = (movimiento) =>
    esFechaEnRango(fechaMovimiento(movimiento), fechas.fechainicio, fechas.fechafin)
  /*****************************************************************************/
  const tablaDefault = datosLocalStorage.tabladefault || {}
  /*****************************************************************************/
  const cantidad = tablaDefault.copias || 1
  /*****************************************************************************/
  const modoEmpresa = tablaDefault.modo
  /*****************************************************************************/
  /*****************************************************************************/

  cantFacturas = jsonData['facturas']
    .filter((fact) => fact.almacen === empresa.nombre)
    .filter((factura) => factura.estado_factura !== 'DEVOLUCION').length
  /******************************************************/
  totalvendido =
    jsonData['facturas']
      .filter((fact) => fact.almacen === empresa.nombre)
      .filter(
        (factura) => factura.metodo_pago !== 'CREDITO' && factura.estado_factura !== 'DEVOLUCION'
      )
      .map((factura) => Number(factura.total))
      .reduce((acc, total) => acc + total, 0) || 0
  /******************************************************/
  propinas = jsonData['facturas']
    .filter((fact) => fact.almacen === empresa.nombre)
    .filter(
      (factura) => factura.metodo_pago !== 'CREDITO' && factura.estado_factura !== 'DEVOLUCION'
    )
    .map((factura) => {
      try {
        const datosOtro = JSON.parse(factura.otro)
        if (datosOtro && datosOtro.length > 0) {
          return Number(datosOtro[0].propina) || 0
        } else {
          return 0
        }
      } catch (error) {
        console.error(`Error al parsear factura ${factura.no_factura}:`, error)
        // Devuelve 0 si ocurre un error
        return 0
      }
    })
    .reduce((acc, total) => acc + total, 0)
  /******************************************************/

  ganancia =
    jsonData['facturas']
      .filter((fact) => fact.almacen === empresa.nombre)
      .map((factura) => Number(factura.ganancia))
      .reduce((acc, total) => acc + total, 0) || 0
  /******************************************************/

  impuestos =
    jsonData['facturas']
      .filter((fact) => fact.almacen === empresa.nombre)
      .map((factura) => Number(factura.impuesto))
      .reduce((acc, total) => acc + total, 0) || 0

  /******************************************************/
  let cantidadGastosEfectivo = 0
  let cantidadGastosTransferencia = 0
  gastos =
    jsonData['gastos']
      .filter((fact) => fact.almacen === empresa.nombre)
      .map((gasto) => {
        if (gasto.metodo === 'TRANSFERENCIA') {
          cantidadGastosTransferencia += parseFloat(gasto.cantidad)
        } else {
          cantidadGastosEfectivo += parseFloat(gasto.cantidad)
        }
        return Number(gasto.cantidad)
      })
      .reduce((acc, total) => acc + total, 0) || 0

  /******************************************************/
  entradas =
    jsonData['entradas']
      .filter((entrada) => !entrada.almacen || entrada.almacen === empresa.nombre)
      .map((entrada) => Number(entrada.cantidad || 0))
      .reduce((acc, total) => acc + total, 0) || 0

  /******************************************************/
  devoluciones =
    jsonData['devoluciones']
      .filter((fact) => fact.almacen === empresa.nombre)
      .map((factura) => Number(factura.cantidad))
      .reduce((acc, total) => acc + total, 0) || 0
  /******************************************************/

  efectivoVentas =
    jsonData['facturas']
      .filter((fact) => fact.almacen === empresa.nombre)
      .filter(
        (factura) => factura.metodo_pago !== 'CREDITO' && factura.estado_factura !== 'DEVOLUCION'
      )
      .map((factura) => {
        const efectivoRegistrado = Number(factura.efectivo || 0)
        if (efectivoRegistrado > 0) return efectivoRegistrado
        return String(factura.metodo_pago || '').trim().toUpperCase() === 'EFECTIVO'
          ? Number(factura.total || 0)
          : 0
      })
      .reduce((acc, total) => acc + total, 0) || 0
  /******************************************************/

  efectivo += efectivoVentas

  chqueVentas =
    jsonData['facturas']
      .filter((fact) => fact.almacen === empresa.nombre)
      .filter((fact) => fact.estado_factura === 'Cobrado')
      .filter(
        (factura) => factura.metodo_pago !== 'CREDITO' && factura.estado_factura !== 'DEVOLUCION'
      )
      .map((factura) => Number(factura.cheque))
      .reduce((acc, total) => acc + total, 0) || 0

  cheque += chqueVentas
  /******************************************************/

  tarjetaVenta =
    jsonData['facturas']
      .filter((fact) => fact.almacen === empresa.nombre)
      .filter((fact) => fact.estado_factura === 'Cobrado')
      .filter((factura) => factura.metodo_pago !== 'CREDITO')
      .map((factura) => Number(factura.tarjeta))
      .reduce((acc, total) => acc + total, 0) || 0

  tarjeta += tarjetaVenta
  /******************************************************/

  transferenciaVenta =
    jsonData['facturas']
      .filter((fact) => fact.almacen === empresa.nombre)
      .filter((fact) => fact.estado_factura === 'Cobrado')
      .filter((factura) => factura.metodo_pago !== 'CREDITO')
      .map((factura) => Number(factura.transferencia))
      .reduce((acc, total) => acc + total, 0) || 0

  transferencia += transferenciaVenta
  /******************************************************/

  if (inicioCaja === 0) {
    inicioCaja =
      jsonData['cuadres']
        //.filter(fact=>fact.almacen === empresa.nombre)
        //.filter(fact=>fact.username === usuario.email)
        .map((factura) => Number(factura.cantidad_inicio))
        .reduce((acc, total) => acc + total, 0) || 0
  }

  //const horaInicialM = jsonData['cuadres']
  //.filter(fact=>fact.almacen === empresa.nombre);

  /*if(horaInicialM.length > 0){
      horaInicial = horaInicialM[0].hora_inicio

   }*/

  /******************************************************/

  //  .map(ini=>ini.hora_inicio)

  /*  cuentasxcobrar = jsonData['cuentas_cobrar']
  .map(factura => Number(factura.monto_credito)) 
  .reduce((acc, total) => acc + total, 0) || 0; */

  cuentasxcobrar =
    jsonData['cuentas_cobrar']
      .filter((fact) => fact.almacen === empresa.nombre)
      // Este renglón representa créditos creados en el turno, no el saldo
      // histórico de todas las cuentas por cobrar del almacén.
      .filter((factura) =>
        esFechaEnRango(factura.created_at, fechas.fechainicio, fechas.fechafin)
      )
      .map((factura) => Number(factura.monto_credito))
      .reduce((acc, total) => acc + total, 0) || 0

  abonado =
    jsonData['cuentas_cobrar']
      .filter((fact) => fact.almacen === empresa.nombre)
      .map((factura) => {
        let totalAbono = 0
        const abonos = parseMovimientos(factura.pagos)

        for (let pago of abonos) {
          if (movimientoEnRango(pago)) {
            totalAbono += Number(pago.cantidad)
            if (normalizar(pago.metodo) === 'EFECTIVO') {
              efectivo += Number(pago.cantidad)
              efectivoCxC += Number(pago.cantidad)
            } else if (normalizar(pago.metodo) === 'TARJETA') {
              tarjeta += Number(pago.cantidad)
              tarjetaCxC += Number(pago.cantidad)
            } else if (normalizar(pago.metodo) === 'TRANSFERENCIA') {
              transferencia += Number(pago.cantidad)
              trasnferenciaCxC += Number(pago.cantidad)
            } else {
              //efectivo += Number(pago.cantidad);
            }
          }
        }

        return totalAbono
      })
      .reduce((acc, total) => acc + total, 0) || 0

  /*****************************************************************************/
  taller =
    jsonData['taller']
      .filter((fact) => fact.almacen === empresa.nombre)
      .map((taller) => {
        let totalAbono = 0
        const abonos = parseMovimientos(taller.abono)

        for (let pago of abonos) {
          if (movimientoEnRango(pago)) {
            totalAbono += Number(pago.abono)
            if (normalizar(pago.metodo_pago) === 'EFECTIVO') {
              efectivo += Number(pago.abono)
              efectivoTaller += Number(pago.abono)
            } else if (normalizar(pago.metodo_pago) === 'TARJETA') {
              tarjeta += Number(pago.abono)
              tarjetaTaller += Number(pago.abono)
            } else if (normalizar(pago.metodo_pago) === 'TRANSFERENCIA') {
              transferencia += Number(pago.abono)
              transferenciaTaller += Number(pago.abono)
            } else {
              //efectivo += Number(pago.cantidad);
            }
          }
        }

        return totalAbono
      })
      .reduce((acc, total) => acc + total, 0) || 0
  /*****************************************************************************/

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



        <div class="contenedor">
            <table>
                <tr>
                 <div  class="bordeado" style="text-align:center;padding:3px">
                     DATOS DE LA CAJA
                 </div>
                </tr>
                <tr>
                    <td class="cantidad">Usuario:</td>
                    <td class="cantidad right-align">${usuario.nombre}</td>
                </tr>
                <tr>
                    <td class="cantidad">Fecha:</td>
                    <td class="cantidad right-align">${nfecha('fecha')}</td>
                </tr>

                <tr>
                    <td class="cantidad">Hora de Inicio:</td>
                    <td class="cantidad right-align">${horaInicial}</td>
                </tr>
                <tr>
                    <td class="cantidad">Hora de Cierre:</td>
                    <td class="cantidad right-align">${horaFinal}</td>
                </tr>
                <tr>
                    <td class="cantidad">Fondo Inicial:</td>
                    <td class="cantidad right-align">${datosConfiguracion.simbolo}${inicioCaja || 0.0}</td>
                </tr>

            </table>
            <div class="linea"></div>
            <table>
                <tr>
                 <div  class="bordeado" style="text-align:center;padding:3px">
                    VENTAS
                 </div>
                </tr>
                <tr>
                    <td class="cantidad">Cant. Facturas:</td>
                    <td class="cantidad right-align">${cantFacturas || 0.0}</td>
                </tr>
                <tr>
                    <td class="cantidad">Total Ventas:</td>
                    <td class="cantidad right-align">${datosConfiguracion.simbolo}${totalvendido || 0.0}</td>
                </tr>
                <tr>
                    <td class="cantidad">Efectivo Venta:</td>
                    <td class="cantidad right-align">${datosConfiguracion.simbolo}${efectivoVentas || 0.0}</td>
                </tr>
                <tr>
                    <td class="cantidad">Tarjeta Venta:</td>
                    <td class="cantidad right-align">${datosConfiguracion.simbolo}${tarjetaVenta || 0.0}</td>
                </tr>
                <tr>
                    <td class="cantidad">Transferencia Venta:</td>
                    <td class="cantidad right-align">${datosConfiguracion.simbolo}${transferenciaVenta || 0.0}</td>
                </tr>
                <tr>
                    <td class="cantidad">Cheque Venta:</td>
                    <td class="cantidad right-align">${datosConfiguracion.simbolo}${chqueVentas || 0.0}</td>
                </tr>

                <tr>
                    <td class="cantidad">Propinas:</td>
                    <td class="cantidad right-align">${datosConfiguracion.simbolo}${propinas || 0.0}</td>
                </tr>

            </table>
           ${
             modoEmpresa === 'CELULAR'
               ? `
            <table>
                <tr>
                 <div  class="bordeado" style="text-align:center;padding:3px">
                    OTROS INGRESOS
                 </div>
                </tr>
                <tr>
                    <td class="cantidad">Total Taller:</td>
                    <td class="cantidad right-align">${datosConfiguracion.simbolo}${taller || 0.0}</td>
                </tr>
                <tr>
                    <td class="cantidad">Efectivo Taller:</td>
                    <td class="cantidad right-align">${datosConfiguracion.simbolo}${efectivoTaller || 0.0}</td>
                </tr>
                <tr>
                    <td class="cantidad">Tarjeta Taller:</td>
                    <td class="cantidad right-align">${datosConfiguracion.simbolo}${tarjetaTaller || 0.0}</td>
                </tr> 
                <tr>
                    <td class="cantidad">Transferencia Taller:</td>
                    <td class="cantidad right-align">${datosConfiguracion.simbolo}${transferenciaTaller || 0.0}</td>
                </tr> 
                <tr>
                    <td class="cantidad">Total Entradas:</td>
                    <td class="cantidad right-align">${datosConfiguracion.simbolo}${entradas || 0.0}</td>
                </tr>
            </table>
            `
               : ''
           }
            <div class="linea"></div>
            <table>
                <tr>
                 <div  class="bordeado" style="text-align:center;padding:3px">
                    GASTOS & DEVOLUCIONES
                 </div>
                </tr>
                <tr>
                    <td class="cantidad">Devoluciones:</td>
                    <td class="cantidad right-align">${datosConfiguracion.simbolo}${devoluciones || 0.0}</td>
                </tr>
                <tr>
                    <td class="cantidad">Total Gastos:</td>
                    <td class="cantidad right-align">${datosConfiguracion.simbolo}${gastos || 0.0}</td>
                </tr>
                <tr>
                    <td class="cantidad">Total Gastos Efectivo:</td>
                    <td class="cantidad right-align">${datosConfiguracion.simbolo}${cantidadGastosEfectivo || 0.0}</td>
                </tr>
                <tr>
                    <td class="cantidad">Total Gastos Transferencia:</td>
                    <td class="cantidad right-align">${datosConfiguracion.simbolo}${cantidadGastosTransferencia || 0.0}</td>
                </tr>
            </table>
            <div class="linea"></div>
            <table>
                <tr>
                 <div  class="bordeado" style="text-align:center;padding:3px">
                    CUENTAS POR COBRAR
                 </div>
                </tr>
                <tr>
                    <td class="cantidad">Total Venta CXC:</td>
                    <td class="cantidad right-align">${datosConfiguracion.simbolo}${cuentasxcobrar || 0.0}</td>
                </tr>
                <tr>
                    <td class="cantidad">Total Abonado:</td>
                    <td class="cantidad right-align">${datosConfiguracion.simbolo}${abonado || 0.0}</td>
                </tr>
                <tr>
                    <td class="cantidad">Efectivo CxC:</td>
                    <td class="cantidad right-align">${datosConfiguracion.simbolo}${efectivoCxC || 0.0}</td>
                </tr>
                <tr>
                    <td class="cantidad">TARJETA CxC:</td>
                    <td class="cantidad right-align">${datosConfiguracion.simbolo}${tarjetaCxC || 0.0}</td>
                </tr>
                <tr>
                    <td class="cantidad">TRANSFERENCIA CxC:</td>
                    <td class="cantidad right-align">${datosConfiguracion.simbolo}${trasnferenciaCxC || 0.0}</td>
                </tr>
            </table>
             <div class="linea"></div>
            <table>
                <tr>
                 <div  class="bordeado" style="text-align:center;padding:3px">
                    TOTALES
                 </div>
                </tr>
                <tr>
                    <td class="cantidad">TOTAL EFECTIVO</td>
                    <td class="cantidad right-align">${datosConfiguracion.simbolo}${efectivo || 0.0}</td>
                </tr>
                <tr>
                    <td class="cantidad">TOTAL TARJETA:</td>
                    <td class="cantidad right-align">${datosConfiguracion.simbolo}${tarjeta || 0.0}</td>
                </tr>
                <tr>
                    <td class="cantidad">TOTAL TRANSFERENCIA:</td>
                    <td class="cantidad right-align">${datosConfiguracion.simbolo}${transferencia || 0.0}</td>
                </tr>

                <tr>
                    <td class="cantidad">TOTAL CHEQUE:</td>
                    <td class="cantidad right-align">${datosConfiguracion.simbolo}${cheque || 0.0}</td>
                </tr>
            ${
              usuario.nivel_seguridad == 'Administrador' || usuario.nivel_seguridad == 'Soporte'
                ? `<tr>
                    <td class="cantidad">GANANCIAS:</td>
                    <td class="cantidad right-align">${datosConfiguracion.simbolo}${ganancia || 0.0}</td>
                </tr>`
                : ''
            }

                

            </table>
${
  monedasDD
    ? `
  <table>
    <tr>
      <td colspan="2" class="bordeado" style="text-align:center;padding:3px">
        MONEDERO
      </td>
    </tr>

    ${Object.keys(monedasDD)
      .map(
        (denom) => `
      <tr>
        <td class="cantidad">RD$${denom} x ${monedasDD[denom]}</td>
        <td class="cantidad right-align">RD$${(Number(denom) * monedasDD[denom]).toFixed(2)}</td>
      </tr>
    `
      )
      .join('')}

    <tr>
      <td class="cantidad"><b>TOTAL EFECTIVO:</b></td>
      <td class="cantidad right-align"><b>RD$${Object.entries(monedasDD)
        .reduce((total, [den, cant]) => total + Number(den) * cant, 0)
        .toFixed(2)}</b></td>
    </tr>
  </table>
`
    : ''
}
        
             <div class="linea"></div>


                 <div  class="bordeado" style="text-align:center;padding:3px">
    
                
            <table style="font-size:20px;font-weight:bold">
                <tr>
                    <td class="cantidad" left-align style="font-size: 1.5em !important">Total en Caja:</td>
                    <td class="cantidad2 right-align" style="font-size: 1.5em !important">${datosConfiguracion.simbolo}${Number(efectivo) + Number(inicioCaja) + Number(entradas) - cantidadGastosEfectivo - Number(devoluciones) || 0.0}</td>
                </tr>
                <tr>
                    <td class="cantidad" left-align style="font-size: 1.5em !important">Total Contado:</td>
                    <td class="cantidad2 right-align" style="font-size: 1.5em !important">${datosConfiguracion.simbolo}${totalContado || 0.0}</td>
                </tr>
   ${
     monedas
       ? `<tr>
        <td class="cantidad" left-align style="font-size: 1.5em !important">DIFERENCIA:</td>
        <td class="cantidad2 right-align" style="font-size: 1.5em !important">
            ${(() => {
              const totalCaja = Number(efectivo) + Number(inicioCaja) + Number(entradas) - cantidadGastosEfectivo - Number(devoluciones)
              const diferencia = Number(totalContado) - totalCaja

              if (diferencia > 0) {
                return `Sobrante de ${datosConfiguracion.simbolo}${diferencia || 0.0}`
              } else if (diferencia < 0) {
                return `Faltante de ${datosConfiguracion.simbolo}${Math.abs(diferencia) || 0.0}`
              } else {
                return 'Sin diferencias'
              }
            })()}
        </td>
    </tr>`
       : ''
   }

    

            </table>
               </div>
        </div>
            </div>



        </div>
    </body>
    </html>
    `

  const win = new BrowserWindow({ width: 300, height: 600, show: show, autoHideMenuBar: true })
  return await new Promise((resolve, reject) => {
    win.webContents.once('did-finish-load', async () => {
      let copiesPrinted = 0

      try {
        const printers = await getInstalledPrinters()
        if (!printers.length) throw new Error('No se encontraron impresoras instaladas')

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
                width: Number(printerConfig.pageSizeWidth),
                height: Number(printerConfig.pageSizeHeight)
              },
              preview: false
            },
            (success, errorType) => {
              if (!success) {
                console.error('❌ Error en la impresión:', errorType)
                if (!win.isDestroyed()) win.close()
                reject(new Error(errorType || 'La impresora rechazó el trabajo'))
                return
              }

              copiesPrinted++
              if (copiesPrinted < cantidadCopias) {
                printNextCopy()
              } else {
                console.log('✅ Impresión finalizada, cerrando ventana.')
                if (!win.isDestroyed()) win.close()
                resolve({ printed: true, copies: copiesPrinted, printer: nombreImpresoraFinal })
              }
            }
          )
        }

        printNextCopy()
      } catch (err) {
        if (!win.isDestroyed()) win.close()
        reject(err)
      }
    })

    win.loadURL(`data:text/html;charset=UTF-8,${encodeURIComponent(htmlContent)}`).catch((error) => {
      if (!win.isDestroyed()) win.close()
      reject(error)
    })
  })
}
