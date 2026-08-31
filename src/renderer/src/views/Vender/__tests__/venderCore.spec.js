import { describe, expect, it } from 'vitest'
import {
  attachAvailableImeis,
  buildProductCategories,
  calculateCardSurcharge,
  calculateShiftInvoiceNumber,
  calculateDiscountOptions,
  calculateProductDiscount,
  calculateProductProfit,
  calculateProductTax,
  calculateProductTotal,
  calculatePureProfit,
  calculateSaleSummary,
  calculateStoredProductsTotal,
  createTemporaryClient,
  distributeSurcharge,
  filterPosProducts,
  getAlanubeSecurityCode,
  getCartProductQuantity,
  getDgiiStampUrl,
  getElectronicReceiptPrefix,
  getInvoiceDocumentLabel,
  getProductSalePrice,
  getProductStock,
  isInvoiceStateLocked,
  mergeRecordsByCode,
  normalizeSearchText,
  normalizeTaxpayerLookupResponse,
  parseStoredProducts,
  productHasImei,
  roundDownToInterval,
  toFiniteNumber,
  unwrapAlanubeDocumentResponse
} from '../venderCore.js'

describe('Vender: cliente por defecto y comprobantes', () => {
  it.each(['NORMAL', 'SIN COMPROBANTE', '', null, undefined])(
    'no trata %s como crédito fiscal',
    (receiptType) => {
      expect(getElectronicReceiptPrefix(receiptType)).toBe('')
    }
  )

  it('mantiene la identificación de los comprobantes fiscales', () => {
    expect(getElectronicReceiptPrefix('FISCAL')).toBe('E31')
    expect(getElectronicReceiptPrefix('E31')).toBe('E31')
    expect(getElectronicReceiptPrefix('FINAL')).toBe('E32')
    expect(getElectronicReceiptPrefix('B02')).toBe('E32')
  })
})

describe('Vender: numeración correlativa de facturas por turno', () => {
  it('enumera por orden de registro sin depender del número fiscal', () => {
    const invoices = [
      { id: 32, no_factura: 'F-900', token: 'turno-caja-1' },
      { id: 30, no_factura: 'F-120', token: 'turno-caja-1' },
      { id: 31, no_factura: 'F-500', token: 'turno-caja-1' }
    ]

    expect(calculateShiftInvoiceNumber(invoices[0], invoices)).toBe(3)
    expect(calculateShiftInvoiceNumber(invoices[1], invoices)).toBe(1)
    expect(calculateShiftInvoiceNumber(invoices[2], invoices)).toBe(2)
  })

  it('ignora facturas pertenecientes a otros turnos', () => {
    const currentInvoice = { id: 12, no_factura: '12', token: 'turno-actual' }
    const invoices = [
      { id: 1, no_factura: '1', token: 'turno-anterior' },
      { id: 10, no_factura: '10', token: 'turno-actual' },
      currentInvoice
    ]

    expect(calculateShiftInvoiceNumber(currentInvoice, invoices)).toBe(2)
  })

  it('incluye la factura recién creada aunque aún no aparezca en la consulta', () => {
    const currentInvoice = { id: 22, no_factura: '22', token: 'turno-actual' }
    const invoices = [
      { id: 20, no_factura: '20', token: 'turno-actual' },
      { id: 21, no_factura: '21', token: 'turno-actual' }
    ]

    expect(calculateShiftInvoiceNumber(currentInvoice, invoices)).toBe(3)
  })

  it('no genera numeración si la factura no está vinculada a un turno', () => {
    expect(calculateShiftInvoiceNumber({ id: 1 }, [])).toBeNull()
  })
})

describe('Vender: URL oficial del timbre DGII', () => {
  const officialUrl =
    'https://ecf.dgii.gov.do/ecf/ConsultaTimbre?RncEmisor=131196901&ENCF=E310000000002'
  const consumerInvoiceUrl =
    'https://fc.dgii.gov.do/ecf/ConsultaTimbreFC?RncEmisor=131196901&ENCF=E320000000009&MontoTotal=200&CodigoSeguridad=X4T3vw'

  it.each(['documentStampUrl', 'document_stamp_url', 'qr_url'])(
    'acepta la URL oficial guardada en %s',
    (field) => {
      expect(getDgiiStampUrl({ [field]: officialUrl })).toBe(officialUrl)
    }
  )

  it('rechaza enlaces internos o dominios que no son de DGII', () => {
    expect(getDgiiStampUrl({ qr_url: 'https://tmposrd.com/receipt/factura?factura=1' })).toBe('')
    expect(getDgiiStampUrl({ documentStampUrl: 'https://example.com/ConsultaTimbre' })).toBe('')
  })

  it('acepta el enlace oficial de factura de consumo E32 menor de RD$250,000', () => {
    expect(getDgiiStampUrl({ documentStampUrl: consumerInvoiceUrl })).toBe(consumerInvoiceUrl)
  })

  it('extrae el timbre y el código desde respuestas anidadas o en arreglo', () => {
    const nestedResponse = {
      data: [
        {
          documentStampUrl: officialUrl,
          security_code: 'ABC123',
          documentNumber: 'E320000000001'
        }
      ]
    }

    expect(getDgiiStampUrl(nestedResponse)).toBe(officialUrl)
    expect(getAlanubeSecurityCode(nestedResponse)).toBe('ABC123')
    expect(unwrapAlanubeDocumentResponse(nestedResponse).documentNumber).toBe('E320000000001')
  })
})

describe('Vender: etiqueta de la representación impresa electrónica', () => {
  it('identifica una factura electrónica con valor fiscal E31', () => {
    expect(getInvoiceDocumentLabel({}, 'E310000000002')).toBe(
      'FACTURA ELECTRÓNICA CON VALOR FISCAL'
    )
  })

  it('identifica una factura electrónica de consumo E32', () => {
    expect(getInvoiceDocumentLabel({ comprobante: 'E320000000008' })).toBe(
      'FACTURA ELECTRÓNICA DE CONSUMO'
    )
  })

  it('conserva la etiqueta de las facturas no electrónicas', () => {
    expect(getInvoiceDocumentLabel({ metodo_pago: 'CREDITO' })).toBe('FACTURA A CRÉDITO')
    expect(getInvoiceDocumentLabel({ metodo_pago: 'EFECTIVO' })).toBe('FACTURA')
  })
})

describe('Vender: normalización y permisos', () => {
  it.each([
    ['12.50', 12.5],
    [0, 0],
    ['', 0],
    [null, 0],
    ['texto', 0]
  ])('convierte %j en un número seguro', (value, expected) => {
    expect(toFiniteNumber(value)).toBe(expected)
  })

  it('permite indicar un valor alternativo', () => {
    expect(toFiniteNumber('invalido', 25)).toBe(25)
  })

  it('normaliza espacios, mayúsculas y acentos al buscar', () => {
    expect(normalizeSearchText('  CAFÉ Ácido  ')).toBe('cafe acido')
  })

  it('normaliza la respuesta del servicio de RNC', () => {
    expect(
      normalizeTaxpayerLookupResponse(
        { rnc: '133-02353-9', razon_social: 'TM POS SRL', administracion_local: 'Santiago' },
        '133023539'
      )
    ).toMatchObject({
      rnc: '133023539',
      cedularnc: '133023539',
      nombrerazon_social: 'TM POS SRL'
    })
  })

  it('rechaza respuestas HTTP de error aunque sean objetos verdaderos', () => {
    expect(normalizeTaxpayerLookupResponse({ error: 'HTTP 500' }, '133023539')).toBeNull()
  })

  it.each(['CAJERO', 'cajero', ' VENDEDOR '])('bloquea el estado para %s', (role) => {
    expect(isInvoiceStateLocked(role)).toBe(true)
  })

  it.each(['ADMIN', 'SUPERVISOR', '', null])('no bloquea el estado para %s', (role) => {
    expect(isInvoiceStateLocked(role)).toBe(false)
  })
})

describe('Vender: catálogo POS, inventario y carrito', () => {
  const products = [
    {
      id: 1,
      codigo: 'CAF-01',
      codigo_barra: '1001',
      nombre: 'Café molido',
      categoria: 'Bebidas',
      ubicacion: 'Estante Norte',
      stock: 5,
      precio_venta: '125.50'
    },
    {
      id: 2,
      codigo: 'PAN-02',
      nombre: 'Pan integral',
      categoria: 'Alimentos',
      existencia: 0,
      precio_venta: 80
    },
    {
      id: 3,
      codigo: 'JUG-03',
      nombre: 'Jugo de limón',
      categoria: 'Bebidas',
      cantidad: 3,
      precio_venta: 95
    },
    { nombre: 'Registro sin código', stock: 10 }
  ]

  it('obtiene el stock desde los tres campos admitidos', () => {
    expect(getProductStock(products[0])).toBe(5)
    expect(getProductStock(products[1])).toBe(0)
    expect(getProductStock(products[2])).toBe(3)
  })

  it('obtiene un precio de venta numérico y seguro', () => {
    expect(getProductSalePrice(products[0])).toBe(125.5)
    expect(getProductSalePrice({ precio_venta: 'x' })).toBe(0)
  })

  it('construye categorías únicas y siempre incluye TODAS', () => {
    expect(buildProductCategories(products)).toEqual(['TODAS', 'Bebidas', 'Alimentos'])
  })

  it('oculta productos agotados y registros sin identificador por defecto', () => {
    expect(filterPosProducts(products).map((product) => product.codigo)).toEqual([
      'CAF-01',
      'JUG-03'
    ])
  })

  it('puede mostrar productos agotados', () => {
    expect(filterPosProducts(products, { showOutOfStock: true })).toHaveLength(3)
  })

  it.each([
    ['cafe', 'CAF-01'],
    ['1001', 'CAF-01'],
    ['norte', 'CAF-01'],
    ['limon', 'JUG-03'],
    ['jug-03', 'JUG-03']
  ])('busca "%s" por los campos visibles del producto', (search, code) => {
    expect(filterPosProducts(products, { search })[0].codigo).toBe(code)
  })

  it('filtra por categoría', () => {
    expect(
      filterPosProducts(products, { category: 'Alimentos', showOutOfStock: true })
    ).toEqual([products[1]])
  })

  it('respeta el límite configurado', () => {
    expect(filterPosProducts(products, { showOutOfStock: true, limit: 1 })).toHaveLength(1)
    expect(filterPosProducts(products, { limit: -1 })).toEqual([])
  })

  it('encuentra la cantidad ya agregada al carrito usando el código', () => {
    const cart = [{ codigo: 'CAF-01', cantidad: '2' }]
    expect(getCartProductQuantity(cart, products[0])).toBe(2)
    expect(getCartProductQuantity(cart, products[2])).toBe(0)
  })
})

describe('Vender: cálculos de productos y factura', () => {
  it('calcula descuento, impuesto por cantidad y total de la línea', () => {
    const product = {
      precio_final: 118,
      cantidad: 2,
      descuento: 10,
      impuestos: 18,
      impuesto_venta: 18
    }
    expect(calculateProductDiscount(product)).toBe(10)
    expect(calculateProductTax(product)).toBe(36)
    expect(calculateProductTotal(product)).toBe(226)
  })

  it('usa precio_venta cuando no existe precio_final', () => {
    expect(calculateProductTotal({ precio_venta: 50, cantidad: 3, descuento: 5 })).toBe(145)
  })

  it('no calcula impuesto si el producto no está marcado como gravado', () => {
    expect(calculateProductTax({ impuestos: 0, impuesto_venta: 18, cantidad: 2 })).toBe(0)
  })

  it('calcula la ganancia usando el costo incluido en la venta', () => {
    expect(
      calculateProductProfit({ codigo: 'A', precio_venta: 100, precio_compra: 70, cantidad: 3 })
    ).toBe(90)
  })

  it('recupera el costo desde inventario cuando falta en la venta', () => {
    expect(
      calculateProductProfit(
        { codigo: 'A', precio_venta: 100, cantidad: 2 },
        [{ codigo: 'A', precio_compra: 65 }]
      )
    ).toBe(70)
  })

  it('resume una factura manteniendo la identidad subtotal - descuento + impuesto = total', () => {
    const summary = calculateSaleSummary([
      {
        codigo: 'A',
        nombre: 'Producto gravado',
        precio_final: 118,
        precio_venta: 100,
        precio_compra: 60,
        cantidad: 1,
        descuento: 10,
        impuestos: 18,
        impuesto_venta: 18
      }
    ])
    expect(summary).toEqual({
      subtotal: 100,
      discount: 10,
      tax: 18,
      total: 108,
      profit: 40,
      quantity: 1
    })
    expect(summary.subtotal - summary.discount + summary.tax).toBe(summary.total)
  })

  it('acumula varias líneas y tolera valores numéricos como texto', () => {
    const summary = calculateSaleSummary([
      { codigo: 'A', precio_final: '50', precio_venta: '50', cantidad: '2', descuento: '5' },
      { codigo: 'B', precio_final: 25, precio_venta: 25, cantidad: 1 }
    ])
    expect(summary.total).toBe(120)
    expect(summary.discount).toBe(5)
    expect(summary.subtotal).toBe(125)
    expect(summary.quantity).toBe(3)
  })

  it('excluye la línea especial de descuento del impuesto resuelto externamente', () => {
    const taxResolver = () => 18
    const summary = calculateSaleSummary(
      [
        { nombre: 'Producto', precio_final: 118, cantidad: 1 },
        { nombre: 'DESCUENTO APLICADO', precio_final: -10, cantidad: 1 }
      ],
      [],
      taxResolver
    )
    expect(summary.tax).toBe(18)
  })

  it('devuelve un resumen en cero para un carrito vacío', () => {
    expect(calculateSaleSummary([])).toEqual({
      subtotal: 0,
      discount: 0,
      tax: 0,
      total: 0,
      profit: 0,
      quantity: 0
    })
  })

  it('calcula ganancia pura sin delivery ni descuentos artificiales', () => {
    expect(
      calculatePureProfit([
        { nombre: 'Producto', precio_venta: 100, precio_compra: 60, cantidad: 2 },
        { nombre: 'DELIVERY', precio_venta: 30, precio_compra: 0, cantidad: 1 },
        { nombre: 'DESCUENTO', precio_venta: -10, precio_compra: 0, cantidad: 1 }
      ])
    ).toBe(80)
  })
})

describe('Vender: descuentos rápidos', () => {
  it.each([
    [103, 5, 100],
    [99, 10, 90],
    [42, 0, 42]
  ])('redondea %s hacia abajo en intervalos de %s', (value, interval, expected) => {
    expect(roundDownToInterval(value, interval)).toBe(expected)
  })

  it('genera las opciones descendentes de descuento', () => {
    expect(calculateDiscountOptions(123, 5, 3)).toEqual([115, 110, 105])
  })

  it('acepta una cantidad cero de opciones', () => {
    expect(calculateDiscountOptions(100, 5, 0)).toEqual([])
  })
})

describe('Vender: documentos almacenados', () => {
  it('acepta productos que ya vienen como arreglo', () => {
    const products = [{ nombre: 'A', total: 25 }]
    expect(parseStoredProducts(products)).toBe(products)
  })

  it('convierte JSON de un arreglo y limpia campos auxiliares', () => {
    expect(
      parseStoredProducts(
        '[{"nombre":"A","total":25,"otro":"[dato]","caracteristicas":"[]"}]'
      )
    ).toEqual([{ nombre: 'A', total: 25 }])
  })

  it('convierte un objeto JSON individual en arreglo', () => {
    expect(parseStoredProducts('{"nombre":"A","total":25}')).toEqual([
      { nombre: 'A', total: 25 }
    ])
  })

  it.each([null, '', 'no es json'])('devuelve un arreglo vacío para %j', (value) => {
    expect(parseStoredProducts(value)).toEqual([])
  })

  it('suma y formatea el total de productos guardados', () => {
    expect(calculateStoredProductsTotal('[{"total":"10.25"},{"total":5},{"total":"x"}]')).toBe(
      '15.25'
    )
  })
})

describe('Vender: clientes temporales y caché', () => {
  it('crea un cliente temporal listo para una factura', () => {
    expect(createTemporaryClient('  juan pérez  ')).toMatchObject({
      codigo: 'TEMP-JUAN-PÉREZ',
      nombre: 'JUAN PÉREZ',
      n_comercial: 'JUAN PÉREZ',
      tipo_cliente: 'temporal',
      cliente_temporal: true,
      precio_fijado: 'Normal'
    })
  })

  it('rechaza nombres temporales vacíos', () => {
    expect(createTemporaryClient('   ')).toBeNull()
  })

  it('limita el segmento variable del código temporal', () => {
    expect(createTemporaryClient('un nombre extremadamente largo para cliente').codigo.length).toBe(25)
  })

  it('actualiza existentes y agrega nuevos registros sin duplicar códigos', () => {
    expect(
      mergeRecordsByCode(
        [
          { codigo: 'A', nombre: 'Anterior', telefono: '1' },
          { codigo: 'B', nombre: 'B' }
        ],
        [
          { codigo: 'A', nombre: 'Actual' },
          { codigo: 'C', nombre: 'C' },
          { nombre: 'Sin código' }
        ]
      )
    ).toEqual([
      { codigo: 'A', nombre: 'Actual', telefono: '1' },
      { codigo: 'B', nombre: 'B' },
      { codigo: 'C', nombre: 'C' }
    ])
  })
})

describe('Vender: IMEI', () => {
  const products = [{ id: 10, codigo: 'TEL-1' }, { id: 11, codigo: 'TEL-2' }]
  const imeis = [
    { id_equi: 10, imei: '111' },
    { id_equi: '10', imei: '222' },
    { id_equi: 11, imei: '333' },
    { id_equi: 11, imei: '' }
  ]

  it('anexa únicamente los IMEI disponibles de cada producto', () => {
    const result = attachAvailableImeis(products, imeis)
    expect(result[0]).toMatchObject({
      imeis_disponibles: ['111', '222'],
      imeis_disponibles_texto: '111,222'
    })
    expect(result[1].imeis_disponibles).toEqual(['333'])
  })

  it('no modifica los objetos originales al anexar IMEI', () => {
    attachAvailableImeis(products, imeis)
    expect(products[0]).not.toHaveProperty('imeis_disponibles')
  })

  it('encuentra un IMEI tanto en arreglo como en texto', () => {
    expect(productHasImei({ imeis_disponibles: ['111', '222'] }, ' 222 ')).toBe(true)
    expect(productHasImei({ imeis_disponibles_texto: '111, 222' }, '222')).toBe(true)
  })

  it('no acepta búsquedas vacías ni coincidencias parciales', () => {
    expect(productHasImei({ imeis_disponibles: ['111'] }, '')).toBe(false)
    expect(productHasImei({ imeis_disponibles: ['111'] }, '11')).toBe(false)
  })
})

describe('Vender: recargo de tarjeta', () => {
  it.each([
    [100, 5, 105],
    ['200', '2.5', 205],
    [100, -10, 100],
    ['x', 5, 0]
  ])('calcula el recargo de %s al %s%%', (amount, percentage, expected) => {
    expect(calculateCardSurcharge(amount, percentage)).toBe(expected)
  })

  it('distribuye el recargo proporcionalmente entre líneas seleccionadas', () => {
    const products = [
      { nombre: 'A', precio_final: 100, precio_venta: 100, cantidad: 1 },
      { nombre: 'B', precio_final: 50, precio_venta: 50, cantidad: 2 },
      { nombre: 'C', precio_final: 25, precio_venta: 25, cantidad: 1 }
    ]
    const result = distributeSurcharge(products, [0, 1], 10)
    expect(result[0]).toMatchObject({ precio_final: 105, precio_venta: 105, recargo_aplicado: 5 })
    expect(result[1]).toMatchObject({
      precio_final: 52.5,
      precio_venta: 52.5,
      recargo_aplicado: 2.5
    })
    expect(result[2]).toEqual(products[2])
  })

  it('ignora índices duplicados o inexistentes', () => {
    const result = distributeSurcharge([{ precio_final: 100, cantidad: 1 }], [0, 0, 9], 10)
    expect(result[0].precio_final).toBe(110)
  })

  it.each([
    [[], 10],
    [[0], 0],
    [[0], -5]
  ])('no distribuye con selección %j y recargo %s', (selection, surcharge) => {
    const products = [{ precio_final: 100, cantidad: 1 }]
    expect(distributeSurcharge(products, selection, surcharge)).toEqual(products)
  })

  it('no modifica el carrito original', () => {
    const products = [{ precio_final: 100, precio_venta: 100, cantidad: 1 }]
    distributeSurcharge(products, [0], 10)
    expect(products[0].precio_final).toBe(100)
  })
})
