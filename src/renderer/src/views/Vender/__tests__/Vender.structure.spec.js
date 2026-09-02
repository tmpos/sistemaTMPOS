import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { compileScript, compileTemplate, parse } from '@vue/compiler-sfc'
import { describe, expect, it } from 'vitest'

const venderPath = resolve(process.cwd(), 'src/renderer/src/views/Vender.vue')
const source = readFileSync(venderPath, 'utf8')
const parsed = parse(source, { filename: venderPath })

describe('Vender.vue: contrato estructural del componente completo', () => {
  it('es un componente Vue válido con template y script setup', () => {
    expect(parsed.errors).toEqual([])
    expect(parsed.descriptor.template).not.toBeNull()
    expect(parsed.descriptor.scriptSetup).not.toBeNull()
  })

  it('compila el script y el template sin errores de sintaxis', () => {
    const script = compileScript(parsed.descriptor, { id: 'vender-test' })
    const template = compileTemplate({
      id: 'vender-test',
      filename: venderPath,
      source: parsed.descriptor.template.content,
      scoped: parsed.descriptor.styles.some((style) => style.scoped)
    })
    expect(script.content.length).toBeGreaterThan(0)
    expect(template.errors).toEqual([])
    expect(template.code.length).toBeGreaterThan(0)
  })

  it.each([
    'venta',
    'pos',
    'pedidosPendientes',
    'documentos',
    'clientes',
    'delivery',
    'taller',
    'configuracion',
    'ai',
    'pruebas'
  ])('mantiene disponible la pestaña %s', (tab) => {
    expect(source).toContain(`tabVentaActiva === '${tab}'`)
  })

  it('integra el asistente AI dentro de Vender y conserva el acceso de menú', () => {
    expect(source).toContain("import AiAsistente from '@/views/AiAsistente/AiAsistente.vue'")
    expect(source).toContain('<AiAsistente />')
    expect(source).toContain("tabVentaActiva === 'ai'")
  })

  it('integra el ejecutor de pruebas dentro de Vender', () => {
    expect(source).toContain("import PruebasVender from '@/components/vender/PruebasVender.vue'")
    expect(source).toContain('<PruebasVender />')
    expect(source).toContain("tabVentaActiva === 'pruebas'")
  })

  it('usa las funciones reales y comprobables del núcleo de ventas', () => {
    expect(source).toContain("from '@/views/Vender/venderCore.js'")
    expect(source).toContain('calculateSaleSummary(')
    expect(source).toContain('filterPosProducts(')
    expect(source).toContain('distributeSurcharge(')
    expect(source).toContain('createTemporaryClient(')
  })

  it('conserva los flujos principales de venta, cobro, factura y cotización', () => {
    expect(source).toContain('productosVenta')
    expect(source).toContain('calcularTotalFactura')
    expect(source).toContain('metodoPago')
    expect(source).toContain('facturaNueva')
    expect(source).toContain('cotizacionNueva')
    expect(source).toContain('restarStock')
  })

  it('inicia Vender en modo normal cuando no existe una preferencia guardada', () => {
    expect(source).toContain('const modoSimple = ref(false)')
    expect(source).toContain("const MODO_SIMPLE_STORAGE_KEY = 'vender_modo_simple'")
  })

  it('avanza y persiste la secuencia después de registrar un e-NCF oficial', () => {
    expect(source).toContain('const secuenciaConsumida = numeroECFOficial.slice(prefijoECF.length)')
    expect(source).toContain('actualizarSecuenciaComprobanteElectronico(')
    expect(source).toContain('secuencia_actual: String(siguienteSecuencia)')
    expect(source).toContain('esRespuestaOperacionExitosa(resultado)')
    expect(source).toContain('obtenerSiguienteSecuenciaDisponibleECF(')
    expect(source).toContain('controlSecuenciaECFRef.value.reservarSecuencia({')
    expect(source).toContain('<ControlSecuenciaECF ref="controlSecuenciaECFRef" />')
    expect(source).not.toContain('if (respuesta.sequenceConsumed)')
  })

  it('no vincula a una factura un e-NCF utilizado por otra', () => {
    expect(source).toContain('controlSecuenciaECFRef.value.puedeRecuperarDocumento({')
    expect(source).toContain("'comprobante',\n      numeroECFOficial")
    expect(source).toContain("'COLISION_LOCAL'")
    expect(source).toContain('No se modificó la factura actual.')
  })

  it('lee la configuración de Alanube desde la tabla y no desde localStorage', () => {
    expect(source).toContain("'configuracion_alanube'")
    expect(source).not.toContain("localStorage.getItem('alanube_config_")
    expect(source).not.toContain("localStorage.getItem('alanube_last_ambiente')")
  })

  it('asigna la secuencia e-NCF desde las tablas centrales al confirmar', () => {
    expect(source).toContain("consultarTablaFiscalCompartida('comprobantes_electronicos')")
    expect(source).toContain("actualizarRegistroFiscalCompartido(\n    'comprobantes_electronicos'")
    expect(source).toContain("consultarTablaFiscalLazy('facturacion_electronica_log'")
    expect(source).toContain('const secuenciaVigente = await obtenerSiguienteSecuenciaDisponibleECF(registroECF)')
    expect(source).toContain('placeholder="Secuencia asignada por el servidor"')
    expect(source).not.toContain("consultarTablaFiscalCompartida('facturas')")
    expect(source).not.toContain("'updateData',\n    'comprobantes_electronicos'")
  })

  it('guarda la factura electrónica sin comprobante hasta que Alanube la acepte', () => {
    expect(source).toContain("errorCancelacion.code = 'DGII_ENVIO_CANCELADO'")
    expect(source).toContain("comprobanteFN.value = ''")
    expect(source).toContain('facturaGuardada.comprobante = numeroECFOficial')
    expect(source).toContain('ofrecerEliminarFacturaTrasCancelarECF()')
    expect(source).toContain('borrarFacturasSeleccionadas(')
    expect(source).toContain('requierePassword: false')
    expect(source).toContain("titulo: '¿Eliminar también la factura?'")
    expect(source).toContain("cancelButtonText: 'No, conservar factura'")
    expect(source).toContain('La factura fue conservada sin comprobante electrónico.')
    expect(source).toContain('if (facturaEliminada) {')
    expect(source).toContain('La venta continúa abierta para poder intentarla otra vez.')
    expect(source).toContain('if (shouldWaitDGII) {')
    expect(source).not.toContain('shouldWaitDGII && impresionRapida.value')
  })

  it('consulta los RNC en el servicio central y no en el servidor de cada empresa', () => {
    expect(source).toContain("const RNC_SERVICE_BASE_URL = 'https://demo.tmposrd.com/api2'")
    expect(source).toContain("RNC_SERVICE_BASE_URL,\n        `consultarrnc/${documento}`")
  })

  it('muestra el NCF o e-NCF en el listado de facturas', () => {
    expect(source).toContain('header="COMPROBANTE"')
    expect(source).toContain('obtenerComprobanteListado(slotProps.data)')
    expect(source).toContain("'SIN COMPROBANTE'")
    expect(source).toContain("'comprobante',\n        'fecha_emision'")
  })

  it('detiene la carga masiva si la API no puede conectarse con MySQL', () => {
    expect(source).toContain("'datoscampo/tabladefault/id/1'")
    expect(source).toContain('if (estadoServidor?.error)')
    expect(source).toContain("summary: 'Servidor de datos no disponible'")
    const fetchClientesSource = source.slice(
      source.indexOf('const fetchClientes = async () => {'),
      source.indexOf('const cambiarCliente = () => {')
    )
    expect(fetchClientesSource).not.toContain("'getTableColumns'")
    expect(fetchClientesSource).not.toContain("'addColumnToTable'")
  })

  it('permite reemplazar de forma auditada un E32 duplicado desde la modal de facturas', () => {
    expect(source).toContain('label="Cambiar comprobante E32"')
    expect(source).toContain('cambiarComprobanteE32DocumentoSeleccionado')
    expect(source).toContain('v-model:visible="visibleConfirmarCambioE32"')
    expect(source).toContain('label="Solicitar nuevo E32"')
    expect(source).toContain('Enviando factura a Alanube')
    expect(source).toContain('pi pi-spinner pi-spin')
    expect(source).toContain("motivo: 'REEMPLAZO_E32_DUPLICADO'")
    expect(source).toContain('confirmarYEnviarADGII({ reemplazarComprobante: true })')
    expect(source).toContain('conservarComprobanteAnterior: Boolean(contextoReemplazo)')
    expect(source).toContain('historialComprobantes')
    expect(source).toContain("accion: 'CAMBIAR_COMPROBANTE_E32'")
    expect(source).toContain('if (noFacturaRechazada && !contextoReemplazo)')
    const flujoCambioE32 = source.slice(
      source.indexOf('const cambiarComprobanteE32DocumentoSeleccionado'),
      source.indexOf('const ejecutarAccionDocumentoSeleccionado')
    )
    expect(flujoCambioE32).not.toContain('Swal.fire')
  })

  it('exige un cliente registrado con RNC antes de crear una factura E31', () => {
    expect(source).toContain('El crédito fiscal E31 requiere un cliente con RNC válido.')
    expect(source).toContain('const clienteValidoParaE31 =')
    expect(source).toContain("codigo !== '0000000'")
    expect(source).toContain(
      "tipoFactura.value === 'factura' && prefijoComprobanteSeleccionado === 'E31'"
    )
    expect(source).toContain('await abrirModalClienteFiscalE31(true)')
    expect(source).toContain('requiereRncClienteFiscalPendiente.value && !clienteValidoParaE31(cliente)')
  })

  it('permite facturas E32 con el cliente genérico sin abrir la selección fiscal E31', () => {
    const guardarFacturaSource = source.slice(
      source.indexOf('const guardarFactura = async () => {'),
      source.indexOf('const tipo = tipoFactura.value')
    )

    expect(guardarFacturaSource).not.toContain('Boolean(prefijoComprobanteSeleccionado)')
    expect(guardarFacturaSource).not.toContain('esClientePorDefecto')
    expect(guardarFacturaSource).toContain("prefijoComprobanteSeleccionado === 'E31'")
  })
})
