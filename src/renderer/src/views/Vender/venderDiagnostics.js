import {
  attachAvailableImeis,
  calculateCardSurcharge,
  calculateProductTotal,
  calculateSaleSummary,
  createTemporaryClient,
  distributeSurcharge,
  filterPosProducts,
  isInvoiceStateLocked,
  mergeRecordsByCode,
  normalizeSearchText,
  parseStoredProducts
} from './venderCore.js'

const same = (actual, expected) => JSON.stringify(actual) === JSON.stringify(expected)

const cases = [
  ['normaliza búsquedas con acentos', () => normalizeSearchText(' CAFÉ ') === 'cafe'],
  ['bloquea el estado para cajeros', () => isInvoiceStateLocked('cajero')],
  ['permite el estado para administradores', () => !isInvoiceStateLocked('ADMIN')],
  [
    'oculta productos agotados en el POS',
    () =>
      filterPosProducts([
        { codigo: 'A', nombre: 'Disponible', stock: 2 },
        { codigo: 'B', nombre: 'Agotado', stock: 0 }
      ]).length === 1
  ],
  [
    'busca productos por nombre sin distinguir acentos',
    () =>
      filterPosProducts([{ codigo: 'A', nombre: 'Café', stock: 2 }], { search: 'cafe' })
        .length === 1
  ],
  [
    'calcula el total de una línea con descuento',
    () => calculateProductTotal({ precio_final: 100, cantidad: 2, descuento: 15 }) === 185
  ],
  [
    'mantiene la ecuación contable de la factura',
    () => {
      const result = calculateSaleSummary([
        {
          codigo: 'A',
          nombre: 'Producto',
          precio_final: 118,
          precio_venta: 100,
          cantidad: 1,
          descuento: 10,
          impuestos: 18,
          impuesto_venta: 18
        }
      ])
      return result.subtotal - result.discount + result.tax === result.total
    }
  ],
  ['calcula correctamente un recargo de tarjeta', () => calculateCardSurcharge(100, 5) === 105],
  [
    'distribuye el recargo entre productos',
    () => {
      const result = distributeSurcharge(
        [
          { precio_final: 100, precio_venta: 100, cantidad: 1 },
          { precio_final: 50, precio_venta: 50, cantidad: 2 }
        ],
        [0, 1],
        10
      )
      return result[0].precio_final === 105 && result[1].precio_final === 52.5
    }
  ],
  [
    'crea clientes temporales válidos',
    () => createTemporaryClient('Juan Pérez')?.codigo === 'TEMP-JUAN-PÉREZ'
  ],
  [
    'actualiza caché sin duplicar códigos',
    () =>
      same(
        mergeRecordsByCode([{ codigo: 'A', nombre: 'Viejo' }], [
          { codigo: 'A', nombre: 'Nuevo' }
        ]),
        [{ codigo: 'A', nombre: 'Nuevo' }]
      )
  ],
  [
    'relaciona los IMEI con el producto correcto',
    () =>
      same(attachAvailableImeis([{ id: 1 }], [{ id_equi: 1, imei: '111' }])[0].imeis_disponibles, [
        '111'
      ])
  ],
  [
    'recupera productos guardados como JSON',
    () => parseStoredProducts('[{"nombre":"A","total":10}]').length === 1
  ],
  ['tolera documentos con JSON inválido', () => parseStoredProducts('inválido').length === 0]
]

export const runVenderDiagnostics = () => {
  const startedAt = Date.now()
  const results = cases.map(([name, execute]) => {
    try {
      return { name, success: execute() === true }
    } catch (error) {
      return { name, success: false, error: error?.message || String(error) }
    }
  })
  const passed = results.filter((result) => result.success).length
  const failed = results.length - passed
  const lines = [
    'Diagnóstico integrado de Vender',
    ...results.map(
      (result) => `${result.success ? '✓' : '✗'} ${result.name}${result.error ? `: ${result.error}` : ''}`
    ),
    '',
    `${passed} pruebas aprobadas, ${failed} con errores.`
  ]

  return {
    success: failed === 0,
    integrated: true,
    passed,
    failed,
    total: results.length,
    output: lines.join('\n'),
    durationMs: Date.now() - startedAt,
    error: failed ? `${failed} comprobaciones integradas presentaron errores.` : ''
  }
}
