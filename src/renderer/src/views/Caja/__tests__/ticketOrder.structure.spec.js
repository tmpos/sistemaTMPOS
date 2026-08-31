import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const cajaPath = resolve(process.cwd(), 'src/renderer/src/views/Caja/Caja.vue')
const ticketPath = resolve(process.cwd(), 'src/renderer/src/printer/ticket.js')
const venderPath = resolve(process.cwd(), 'src/renderer/src/views/Vender.vue')
const cajaSource = readFileSync(cajaPath, 'utf8')
const ticketSource = readFileSync(ticketPath, 'utf8')
const venderSource = readFileSync(venderPath, 'utf8')

describe('Caja: número de orden en el ticket', () => {
  it('usa la posición de la factura en el arreglo cronológico del turno', () => {
    expect(cajaSource).toContain('const prepararFacturaParaTicket = async (factura) =>')
    expect(cajaSource).toContain('numero_orden_turno: numeroOrdenTurno')
    expect(cajaSource).toContain("'getRowsByTimestampRange',\n        'facturas',\n        'created_at',")
    expect(cajaSource).toContain('const posicionFactura = facturasOrdenadas.findIndex')
    expect(cajaSource).toContain('numeroOrdenTurno = posicionFactura >= 0 ? posicionFactura + 1 : null')
    expect(cajaSource).toContain('fechaDeInicioHoy.value = cajaActual?.created_at')
  })

  it('las rutas rápidas envían el objeto completo y los tres argumentos IPC', () => {
    expect(cajaSource).not.toContain("invoke('ticket',datosFactura.no_factura,datosEmpresa)")
    expect(cajaSource).toContain("invoke('ticket',JSON.stringify(facturaTicket),null,datosEmpresa)")
  })

  it('el impresor calcula la posición por rango y muestra el número enviado por Caja', () => {
    expect(ticketSource).toContain('Number(facturaParseada?.numero_orden_turno)')
    expect(ticketSource).toContain("fetch(`${link}${api}/datostimestamp`")
    expect(ticketSource).toContain('const posicionFactura = facturasTurno.findIndex')
    expect(ticketSource).toContain('NÚMERO DE ORDEN:')
  })

  it('Vender envía los datos de empresa en el tercer argumento del ticket', () => {
    expect(venderSource).toContain("invoke('ticket', factura, null, datosEmpresaB)")
  })

  it('la modal ejecuta cada tipo de impresora con estado de carga y manejo de errores', () => {
    expect(cajaSource).toContain(':loading="imprimiendoFacturaSeleccionada"')
    expect(cajaSource).toContain("impresoraSeleccionada.value === 'Impresora Ticket'")
    expect(cajaSource).toContain("impresoraSeleccionada.value === 'Impresora Normal'")
    expect(cajaSource).not.toContain("datosFactCoti.value == 'Offline'")
    expect(cajaSource).toContain("datosLocal.empresa = datosEmpresa.empresa")
  })

  it('muestra únicamente botones Carta y Ticket en vez de un selector', () => {
    const inicio = cajaSource.indexOf('aria-label="Formato de impresión"')
    const fin = cajaSource.indexOf('<!-- Botón de Imprimir -->', inicio)
    const selectorFormato = cajaSource.slice(inicio, fin)

    expect(selectorFormato).toContain('label="Carta"')
    expect(selectorFormato).toContain('label="Ticket"')
    expect(selectorFormato).not.toContain('<Select')
    expect(selectorFormato).not.toContain('Offline')
  })

  it('mantiene las últimas 100 facturas y permite filtrar solo las del turno', () => {
    expect(cajaSource).toContain("'getLastXRows', 'facturas','100'")
    expect(cajaSource).toContain('v-model="soloFacturasTurno"')
    expect(cajaSource).toContain('Solo este turno')
    expect(cajaSource).toContain('const cargarFacturasTurnoImpresion = async () =>')
    expect(cajaSource).toContain("'getRowsByTimestampRange',\n      'facturas',\n      'created_at',\n      fechaInicioTurno")
    expect(cajaSource).toContain('? facturasFiltradasImprimir.value\n    : facturas.value')
  })

  it('reemplaza el selector SweetAlert sin perder las rutas de impresión', () => {
    expect(cajaSource).toContain('v-model:visible="visibleSeleccionTipoImpresion"')
    expect(cajaSource).toContain("confirmarSeleccionImpresion('carta')")
    expect(cajaSource).toContain("confirmarSeleccionImpresion('ticket')")
    expect(cajaSource).toContain('const solicitarTipoImpresion = () => new Promise')
    expect(cajaSource).not.toContain('¿Cómo deseas imprimir?')
    expect(cajaSource).toContain("ipcRenderer.invoke('ticketCXC'")
    expect(cajaSource).toContain("ipcRenderer.invoke('creditoPDF'")
    expect(cajaSource).toContain("ipcRenderer.invoke('ticket',JSON.stringify(datosFactura)")
    expect(cajaSource).toContain("ipcRenderer.invoke('facturaPDF'")
  })
})
