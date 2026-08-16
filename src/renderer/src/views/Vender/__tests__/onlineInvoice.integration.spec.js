import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import bcrypt from 'bcryptjs'
import {
  asientoDiario,
  encryptarPassword,
  peticionesFetchOffline
} from '@/funciones/funciones.js'
import { facturaNueva, restarStock } from '@/funciones/funcionesVentas.js'

const ejecutarIntegracion = process.env.RUN_ONLINE_INVOICE_TEST === '1'
const describeOnline = ejecutarIntegracion ? describe : describe.skip

describeOnline('Vender: factura real contra la API', () => {
  const config = JSON.parse(
    readFileSync(resolve(process.cwd(), 'resources/config.json'), 'utf8')
  )
  const almacen = process.env.ONLINE_TEST_WAREHOUSE || 'TM POS SRL'
  let electronAnterior

  beforeAll(() => {
    electronAnterior = window.electron
    window.electron = {
      ipcRenderer: {
        invoke: async (canal, ...argumentos) => {
          if (canal === 'datosarchivo') return { ...config, almacen, ONLINE: 'true', OFFLINE: 'false' }
          if (canal === 'encrypt-password') return bcrypt.hash(argumentos[0], argumentos[1] || 10)
          if (canal !== 'http-request') {
            throw new Error(`Canal Electron no permitido en la prueba: ${canal}`)
          }

          const [url, opciones = {}] = argumentos
          const respuesta = await fetch(url, opciones)
          const texto = await respuesta.text()
          let data = texto
          try {
            data = texto ? JSON.parse(texto) : null
          } catch (_error) {}
          return {
            ok: respuesta.ok,
            status: respuesta.status,
            data,
            error: respuesta.ok ? '' : texto
          }
        }
      }
    }
    window.localStorage.setItem(
      'usuarioLocal',
      JSON.stringify([{ nombre: 'CODEX TEST', email: 'codex-test', token: 'CODEX_TEST' }])
    )
  })

  afterAll(() => {
    window.electron = electronAnterior
  })

  it('crea la factura, descuenta una unidad y registra el asiento', async () => {
    const facturaExistente = process.env.ONLINE_TEST_EXISTING_INVOICE || ''
    const productos = await peticionesFetchOffline('getDataAsArray', 'productos')
    const clientes = await peticionesFetchOffline('getDataAsArray', 'clientes')
    expect(Array.isArray(productos), JSON.stringify(productos)).toBe(true)
    expect(Array.isArray(clientes), JSON.stringify(clientes)).toBe(true)
    const producto = productos.find(
      (item) =>
        String(item.almacen || '').trim().toUpperCase() === almacen.toUpperCase() &&
        Number(item.stock) >= 2 &&
        !['CELULARES', 'ELECTRODOMESTICOS'].includes(
          String(item.categoria || '').trim().toUpperCase()
        ) &&
        Number(item.precio_venta) > 0
    )
    const cliente = clientes.find(
      (item) =>
        item.codigo === '0000000' &&
        String(item.almacen || '').trim().toUpperCase() === almacen.toUpperCase()
    )

    expect(producto, 'Debe existir un producto seguro para la prueba').toBeTruthy()
    expect(cliente, 'Debe existir el cliente AL CONTADO').toBeTruthy()

    const stockAntes = facturaExistente ? Number(producto.stock) + 1 : Number(producto.stock)
    const precio = Number(producto.precio_venta)
    const impuesto = Number(producto.impuesto_venta || 0)
    const total = Number((precio + impuesto).toFixed(2))
    const ahora = new Date()
    const noFactura = facturaExistente || `TST${ahora.toISOString().replace(/\D/g, '').slice(2, 14)}`
    const tokenCifrado = await encryptarPassword(config.VITE_TOKEN, 10)
    const productoVenta = {
      ...producto,
      cantidad: 1,
      descuento: 0,
      impuesto_venta: impuesto,
      precio_final: total
    }
    const datosVenta = {
      nofactura: noFactura,
      tipocomprobanteFN: 'NORMAL',
      comprobanteFN: 'NORMAL',
      cliente,
      productosArray: [productoVenta],
      vendedorFN: 'CODEX TEST',
      cajeroFN: 'CODEX TEST',
      metodoPagoFN: 'EFECTIVO',
      impuesto,
      descuento: 0,
      subtotal: precio,
      total,
      total_institucion: 0,
      total_cliente: total,
      estadoFN: 'PAGADA',
      efectivoFN: total,
      canalventa: 'PRUEBA AUTOMATIZADA',
      transferenciaFN: 0,
      tarjetaFN: 0,
      chequeFN: 0,
      entidad_financiera: '',
      nota: 'FACTURA DE PRUEBA AUTOMATIZADA DESDE VENDER',
      almacen,
      deliveryFN: '',
      meseroFN: '',
      mesaFN: '',
      instaladorFN: '',
      pagaCon: total,
      suCambio: 0,
      noCheque: '',
      bancoCheque: ''
    }

    if (!facturaExistente) {
      const facturaResultado = await facturaNueva(
        `${config.VITE_LINKURL}${config.VITE_LINK_API}/insertar/facturas`,
        datosVenta,
        'POST',
        tokenCifrado
      )
      expect(facturaResultado?.[0]).toBe('ok')

      const stockResultado = await restarStock(
        `${config.VITE_LINKURL}${config.VITE_LINK_API}/restarStockN`,
        [productoVenta],
        'POST',
        tokenCifrado
      )
      expect(
        stockResultado?.[0] === 'ok' || stockResultado?.status === 'success'
      ).toBe(true)
    }

    const asientosAntes = await peticionesFetchOffline('getDataAsArray', 'asientodiario')
    const asientoYaExiste = asientosAntes.some((item) =>
      String(item.descripcion || '').includes(noFactura)
    )
    if (!asientoYaExiste) {
      const asientoResultado = await asientoDiario(
        config.VITE_LINKURL,
        config.VITE_LINK_API,
        tokenCifrado,
        { add: () => {} },
        'EFECTIVO EN CAJA',
        'VENTAS',
        total,
        `PRUEBA AUTOMATIZADA DE VENTA, FACTURA #${noFactura}`
      )
      expect(asientoResultado?.[0]).toBe('ok')
    }

    const [facturaGuardada, productoActualizado, asientos] = await Promise.all([
      peticionesFetchOffline('getDataByField', 'facturas', 'no_factura', noFactura),
      peticionesFetchOffline('getDataByField', 'productos', 'id', producto.id),
      peticionesFetchOffline('getDataAsArray', 'asientodiario')
    ])

    expect(facturaGuardada?.no_factura).toBe(noFactura)
    expect(facturaGuardada?.almacen).toBe(almacen)
    expect(Number(facturaGuardada?.total)).toBe(total)
    expect(Number(productoActualizado?.stock)).toBe(stockAntes - 1)
    expect(
      asientos.some((item) => String(item.descripcion || '').includes(noFactura))
    ).toBe(true)

    console.log(
      JSON.stringify({
        noFactura,
        productoId: producto.id,
        producto: producto.nombre,
        stockAntes,
        stockDespues: Number(productoActualizado.stock),
        total,
        asientoRegistrado: true
      })
    )
  }, 120000)
})
