import { BrowserWindow, app } from 'electron'
import * as path from 'path'
import fs from 'fs/promises'

import {
  peticionesFetch,
  encryptarPassword,
  nfecha,
  convertirAFechaTimestamp,
  esFechaEnRango
} from '../funciones/funciones.js'

// 1. Carga de configuración local
async function loadConfig() {
  const configPath = path.join(app.getPath('userData'), 'config.json')
  try {
    const raw = await fs.readFile(configPath, 'utf8')
    return JSON.parse(raw)
  } catch (err) {
    console.error('Error al leer config:', err)
    return {}
  }
}

// 2. Helpers
const fechaYhora = (f) => String(f).split(' ')
const parseSafe = (s, d) => {
  try {
    return JSON.parse(s)
  } catch {
    return d
  }
}

/**
 * 3. imprimirCuadreCompleto: genera e imprime el cuadre diario
 */
export async function imprimirCuadreCompleto(
  totalContado,
  datosEmpresa,
  silent,
  visible,
  show,
  fechaR = false
) {
  // 4. Rango de fechas
  let fechas = nfecha('timestampcompleta')
  let horaInicial = '09:00 AM'
  let horaFinal = nfecha('hora')
  if (fechaR) {
    const f = parseSafe(fechaR, {})
    const [, hIni] = fechaYhora(f.fechainicio)
    const [, hFin] = fechaYhora(f.fechafin)
    fechas = f
    horaInicial = hIni
    horaFinal = hFin
  }

  // 5. Config remota y fetch datos ventas
  const {
    VITE_LINKURL: link = '',
    VITE_LINK_API: api = '',
    VITE_TOKEN: token = ''
  } = await loadConfig()
  const tokenC = await encryptarPassword(token, 10)
  const jsonData = await peticionesFetch(
    `${link}${api}`,
    'datosventasporrango',
    { fechainicio: fechas.fechainicio, fechafinal: fechas.fechafin },
    tokenC,
    'POST'
  )

  // 6. Datos locales
  const local = parseSafe(datosEmpresa, {})
  const printers = local.printerconfig || []
  if (!printers.length) throw new Error('No hay impresoras configuradas')
  const printerConfig = parseSafe(printers[0].configuraciones, {})

  const datosConfiguracion = local.configuracion || {}
  const configuracionfactura = Object.fromEntries(
    Object.entries(local.configuracionfactura || {}).map(([k, v]) => [k, String(v) === 'True'])
  )
  const { empresa = {}, usuario = {}, tabladefault = {}, monedero } = local
  const simbolo = datosConfiguracion.simbolo || ''

  // 7. Helpers de filtro y suma
  const filt = (arr) => (Array.isArray(arr) ? arr.filter((x) => x.almacen === empresa.nombre) : [])
  const sumField = (arr, field) => arr.reduce((a, x) => a + Number(x[field] || 0), 0)

  // 8. Facturas
  const facturas = filt(jsonData.facturas)
  const cantFacturas = facturas.filter((f) => f.estado_factura !== 'DEVOLUCION').length
  const totalvendido = sumField(
    facturas.filter((f) => f.metodo_pago !== 'CREDITO' && f.estado_factura !== 'DEVOLUCION'),
    'total'
  )
  const propinas = facturas.reduce(
    (sum, f) => sum + (Number(parseSafe(f.otro || '[]', [])[0]?.propina) || 0),
    0
  )
  const ganancia = sumField(facturas, 'ganancia')
  const impuestos = sumField(facturas, 'impuesto')

  // 9. Pagos de ventas
  const pagosVentas = facturas.filter(
    (f) => f.estado_factura === 'Cobrado' && f.metodo_pago !== 'CREDITO'
  )
  let efectivo = sumField(pagosVentas, 'efectivo')
  let tarjeta = sumField(pagosVentas, 'tarjeta')
  let transferencia = sumField(pagosVentas, 'transferencia')
  let cheque = sumField(pagosVentas, 'cheque')

  // 10. Devoluciones y gastos
  const devoluciones = sumField(filt(jsonData.devoluciones), 'cantidad')
  const gastos = sumField(filt(jsonData.gastos), 'cantidad')

  // 11. Registro de caja
  const inicioCaja = sumField(filt(jsonData.registrocaja), 'cant_inicio')
  const regCaja = filt(jsonData.registrocaja)
  if (regCaja[0]?.hora_inicio) horaInicial = regCaja[0].hora_inicio

  // 12. Cuentas por cobrar
  const resCxC = await peticionesFetch(
    `${link}${api}`,
    'datostimestamp',
    {
      fechainicio: fechas.fechainicio,
      fechafin: fechas.fechafin,
      campo: 'created_at',
      tabla: 'cuentas_cobrar'
    },
    tokenC,
    'POST'
  )
  const cuentasxcobrar = sumField(filt(resCxC), 'monto_credito')
  const abonado = filt(jsonData.cuentas_cobrar).reduce((sum, f) => {
    return (
      sum +
      parseSafe(f.pagos || '[]', []).reduce((a, p) => {
        const ts = convertirAFechaTimestamp(p.fecha, p.hora)
        if (esFechaEnRango(ts, fechas.fechainicio, fechas.fechafin)) {
          const v = Number(p.cantidad) || 0
          if (p.metodo === 'EFECTIVO') efectivo += v
          else if (p.metodo === 'TARJETA') tarjeta += v
          else if (p.metodo === 'TRANSFERENCIA') transferencia += v
          return a + v
        }
        return a
      }, 0)
    )
  }, 0)

  // 13. Taller
  let efectivoTaller = 0,
    tarjetaTaller = 0,
    transferenciaTaller = 0
  const taller = filt(jsonData.taller).reduce((sum, t) => {
    return (
      sum +
      parseSafe(t.abono || '[]', []).reduce((a, p) => {
        const ts = convertirAFechaTimestamp(p.fecha, p.hora)
        if (esFechaEnRango(ts, fechas.fechainicio, fechas.fechafin)) {
          const v = Number(p.abono) || 0
          if (p.metodo_pago === 'EFECTIVO') (efectivo += v), (efectivoTaller += v)
          else if (p.metodo_pago === 'TARJETA') (tarjeta += v), (tarjetaTaller += v)
          else (transferencia += v), (transferenciaTaller += v)
          return a + v
        }
        return a
      }, 0)
    )
  }, 0)

  // 14. Generar HTML
  const htmlContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    * { font-size:${parseInt(printerConfig.fontSize) + 4}px; font-family:'${printerConfig.fontFamily}'; }
    @page { size:${printerConfig.pageWidth}px auto; margin:${printerConfig.margin}px; }
    body { width:${printerConfig.bodyWidth}px; margin:0; padding:5px; }
    table { width:100%; border-collapse:collapse; margin-bottom:10px; }
    th, td { padding:5px; }
    .center { text-align:center; }
    .right { text-align:right; }
  .bordeado { 
  border:1px solid #000000; 
  border-radius:5px; 
  text-align: center;
  padding: 5px; 
  margin: 0 auto; 
  width: 100%;}
    .line { border-top:1px solid #000; margin:5px 0; }
  </style>
</head>
<body>
  <div class="center">
    ${
      configuracionfactura.logo
        ? `<img src="${empresa.logoprinter}" style="max-width:${printerConfig.logoWidth}px;">`
        : `<div style="font-size:${printerConfig.fontSize + 6}px;font-weight:bold;">${empresa.nombre}</div>`
    }
  </div>
  <table>
    <tr class="center"><th colspan="2" ><div class="bordeado">DATOS DE CAJA</div></th></tr>
    <tr><td>Usuario:</td><td class="right">${usuario.nombre}</td></tr>
    <tr><td>Fecha:</td><td class="right">${nfecha('fecha')}</td></tr>
    <tr><td>Hora Inicio:</td><td class="right">${horaInicial}</td></tr>
    <tr><td>Hora Cierre:</td><td class="right">${horaFinal}</td></tr>
    <tr><td>Fondo Inicial:</td><td class="right">${simbolo}${inicioCaja.toFixed(2)}</td></tr>
  </table>
  <table>
    <tr class="center"><th colspan="2" ><div class="bordeado">VENTAS</div></th></tr>
    <tr><td>Facturas:</td><td class="right">${cantFacturas}</td></tr>
    <tr><td>Total Venta:</td><td class="right">${simbolo}${totalvendido.toFixed(2)}</td></tr>
    <tr><td>Efectivo:</td><td class="right">${simbolo}${efectivo.toFixed(2)}</td></tr>
    <tr><td>Tarjeta:</td><td class="right">${simbolo}${tarjeta.toFixed(2)}</td></tr>
    <tr><td>Transferencia:</td><td class="right">${simbolo}${transferencia.toFixed(2)}</td></tr>
    <tr><td>Cheque:</td><td class="right">${simbolo}${cheque.toFixed(2)}</td></tr>
    <tr><td>Propinas:</td><td class="right">${simbolo}${propinas.toFixed(2)}</td></tr>
  </table>
  ${
    tabladefault.modo === 'CELULAR'
      ? `
  <table>
    <tr class="center"><th colspan="2" ><div class="bordeado">OTROS INGRESOS - TALLER</div></th></tr>
    <tr><td>Total Taller:</td><td class="right">${simbolo}${taller.toFixed(2)}</td></tr>
    <tr><td>Efectivo Taller:</td><td class="right">${simbolo}${efectivoTaller.toFixed(2)}</td></tr>
    <tr><td>Tarjeta Taller:</td><td class="right">${simbolo}${tarjetaTaller.toFixed(2)}</td></tr>
    <tr><td>Transferencia Taller:</td><td class="right">${simbolo}${transferenciaTaller.toFixed(2)}</td></tr>
  </table>`
      : ''
  }
  <table>
    <tr class="center"><th colspan="2" ><div class="bordeado">GASTOS</div></th></tr>
    <tr><td>Devoluciones:</td><td class="right">${simbolo}${devoluciones.toFixed(2)}</td></tr>
    <tr><td>Total Gastos:</td><td class="right">${simbolo}${gastos.toFixed(2)}</td></tr>
  </table>
  <table>
    <tr class="center"><th colspan="2" ><div class="bordeado">CUENTAS POR COBRAR</div></th></tr>
    <tr><td>Total CxC:</td><td class="right">${simbolo}${cuentasxcobrar.toFixed(2)}</td></tr>
    <tr><td>Abonado:</td><td class="right">${simbolo}${abonado.toFixed(2)}</td></tr>
  </table>
  <table>
    <tr class="center"><th colspan="2" ><div class="bordeado">TOTALES</div></th></tr>
    <tr><td>Total Efectivo:</td><td class="right">${simbolo}${efectivo.toFixed(2)}</td></tr>
    <tr><td>Total Tarjeta:</td><td class="right">${simbolo}${tarjeta.toFixed(2)}</td></tr>
    <tr><td>Total Transferencia:</td><td class="right">${simbolo}${transferencia.toFixed(2)}</td></tr>
    <tr><td>Total Cheque:</td><td class="right">${simbolo}${cheque.toFixed(2)}</td></tr>
    ${/Administrador|Soporte/.test(usuario.nivel_seguridad) ? `<tr><td>Ganancias:</td><td class="right">${simbolo}${ganancia.toFixed(2)}</td></tr>` : ''}
  </table>
  <div class="line"></div>
  <div class="center" style="font-weight:bold;">
    Total en Caja: ${simbolo}${(efectivo + inicioCaja - gastos).toFixed(2)}<br>
    Total Contado: ${simbolo}${Number(totalContado).toFixed(2)}
  </div>
  ${
    monedero
      ? `
  <table>
    <tr class="center"><th colspan="2"><div class="bordeado">MONEDERO</div></th></tr>
    ${Object.entries(monedero)
      .map(
        ([d, c]) =>
          `<tr><td>RD$${d} x ${c}</td><td class="right">${simbolo}${(Number(d) * c).toFixed(2)}</td></tr>`
      )
      .join('')}
    <tr style="border-top:1px black solid"><td>Total Monedero:</td><td class="right">${simbolo}${Object.entries(
      monedero
    )
      .reduce((t, [d, c]) => t + Number(d) * c, 0)
      .toFixed(2)}</td></tr>
  </table>`
      : ''
  }
</body>
</html>`

  // 15. Crear ventana e imprimir
  const win = new BrowserWindow({ width: 300, height: 600, show, autoHideMenuBar: true })
  win.loadURL(`data:text/html;charset=UTF-8,${encodeURIComponent(htmlContent)}`)
  win.webContents.on('did-finish-load', () => {
    win.webContents.print(
      {
        silent,
        printBackground: true,
        deviceName: printers[0].nombre,
        margins: { marginType: 'none' },
        pageSize: { width: printerConfig.pageWidth * 1000, height: printerConfig.bodyWidth * 1000 },
        copies: tabladefault.copias,
        preview: visible
      },
      (success, err) => {
        if (!success) console.error('Error imprimir:', err)
        win.close()
      }
    )
  })
}
