import { describe, it, expect } from 'vitest'

// Pure functions from funcionesVentas (non-exported helpers)
const normalizeComparable = (value) => {
  if (value === undefined || value === null) return null
  const text = String(value).trim()
  return text === '' ? null : text
}

const equalsIfPresent = (a, b) => {
  const na = normalizeComparable(a)
  const nb = normalizeComparable(b)
  return na !== null && nb !== null && na === nb
}

const buscarProductoInventario = (productosArray = [], productoVenta = {}) => {
  return productosArray.find(
    (product) =>
      equalsIfPresent(product.codigo, productoVenta.codigo) ||
      equalsIfPresent(product.codigo_interno, productoVenta.codigo) ||
      equalsIfPresent(product.codigo, productoVenta.codigo_interno) ||
      equalsIfPresent(product.codigo_interno, productoVenta.codigo_interno) ||
      equalsIfPresent(product.id, productoVenta.id)
  )
}

const quitarBarraFinal = (str) => {
  if (str.endsWith('/')) return str.slice(0, -1)
  return str
}

const toNumber = (value, fallback = 0) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

const obtenerRegistro = (value) => {
  if (Array.isArray(value)) return value[0] || null
  return value || null
}

const generarGanancias = (productos, productosArray = []) => {
  let gananciaPura = 0
  for (let prod of productos) {
    if (/descuento|delivery/i.test(prod.nombre || '')) continue
    const cantidad = parseFloat(prod.cantidad) || 1
    const precioVenta = parseFloat(prod.precio_venta) || parseFloat(prod.precio_final) || parseFloat(prod.precio) || 0
    let precioCompra = 0
    if (prod.costo != null && prod.costo !== '') {
      precioCompra = parseFloat(prod.costo) || 0
    } else if (prod.precio_compra != null && prod.precio_compra !== '') {
      precioCompra = parseFloat(prod.precio_compra) || 0
    } else {
      const datosProd = buscarProductoInventario(productosArray, prod)
      if (datosProd) precioCompra = parseFloat(datosProd.precio_compra) || 0
    }
    gananciaPura += (precioVenta - precioCompra) * cantidad
  }
  return gananciaPura.toFixed(2)
}

describe('normalizeComparable', () => {
  it('returns null for undefined', () => {
    expect(normalizeComparable(undefined)).toBeNull()
  })
  it('returns null for null', () => {
    expect(normalizeComparable(null)).toBeNull()
  })
  it('returns null for empty string', () => {
    expect(normalizeComparable('')).toBeNull()
  })
  it('returns null for whitespace string', () => {
    expect(normalizeComparable('  ')).toBeNull()
  })
  it('returns trimmed string for valid values', () => {
    expect(normalizeComparable(' ABC ')).toBe('ABC')
  })
  it('returns string for numbers', () => {
    expect(normalizeComparable(123)).toBe('123')
  })
})

describe('equalsIfPresent', () => {
  it('returns true for equal strings', () => {
    expect(equalsIfPresent('ABC', 'ABC')).toBe(true)
  })
  it('returns true for equal trimmed strings', () => {
    expect(equalsIfPresent(' ABC ', 'ABC')).toBe(true)
  })
  it('returns false for different strings', () => {
    expect(equalsIfPresent('ABC', 'XYZ')).toBe(false)
  })
  it('returns false when one is null', () => {
    expect(equalsIfPresent(null, 'ABC')).toBe(false)
  })
  it('returns false when both are null', () => {
    expect(equalsIfPresent(null, null)).toBe(false)
  })
  it('returns true for equal numbers', () => {
    expect(equalsIfPresent(123, '123')).toBe(true)
  })
})

describe('buscarProductoInventario', () => {
  const inventario = [
    { id: 1, codigo: 'A001', codigo_interno: 'INT-001' },
    { id: 2, codigo: 'A002', codigo_interno: 'INT-002' },
    { id: 3, codigo: 'B001', codigo_interno: 'INT-003' }
  ]

  it('finds by codigo', () => {
    expect(buscarProductoInventario(inventario, { codigo: 'A001' })).toEqual(inventario[0])
  })
  it('finds by codigo_interno', () => {
    expect(buscarProductoInventario(inventario, { codigo_interno: 'INT-002' })).toEqual(inventario[1])
  })
  it('finds by id', () => {
    expect(buscarProductoInventario(inventario, { id: 3 })).toEqual(inventario[2])
  })
  it('returns undefined when not found', () => {
    expect(buscarProductoInventario(inventario, { codigo: 'Z999' })).toBeUndefined()
  })
  it('returns undefined for empty array', () => {
    expect(buscarProductoInventario([], { codigo: 'A001' })).toBeUndefined()
  })
})

describe('quitarBarraFinal', () => {
  it('removes trailing slash', () => {
    expect(quitarBarraFinal('path/')).toBe('path')
  })
  it('returns original if no trailing slash', () => {
    expect(quitarBarraFinal('path')).toBe('path')
  })
  it('handles multiple slashes', () => {
    expect(quitarBarraFinal('path//')).toBe('path/')
  })
  it('handles empty string', () => {
    expect(quitarBarraFinal('')).toBe('')
  })
})

describe('toNumber', () => {
  it('converts valid numbers', () => {
    expect(toNumber('123')).toBe(123)
    expect(toNumber('45.67')).toBe(45.67)
  })
  it('returns fallback for invalid values', () => {
    expect(toNumber('abc', 0)).toBe(0)
    expect(toNumber(undefined, 10)).toBe(10)
    expect(toNumber(NaN, 5)).toBe(5)
  })
  it('default fallback is 0', () => {
    expect(toNumber('xyz')).toBe(0)
  })
})

describe('obtenerRegistro', () => {
  it('returns first element of array', () => {
    expect(obtenerRegistro([{ id: 1 }, { id: 2 }])).toEqual({ id: 1 })
  })
  it('returns null for empty array', () => {
    expect(obtenerRegistro([])).toBeNull()
  })
  it('returns the value if not array', () => {
    expect(obtenerRegistro({ id: 1 })).toEqual({ id: 1 })
  })
  it('returns null for null', () => {
    expect(obtenerRegistro(null)).toBeNull()
  })
})

describe('generarGanancias', () => {
  it('calculates simple profit', () => {
    const productos = [{ precio_venta: 100, costo: 60, cantidad: 1 }]
    expect(generarGanancias(productos)).toBe('40.00')
  })

  it('calculates profit with quantity', () => {
    const productos = [{ precio_venta: 100, costo: 60, cantidad: 3 }]
    expect(generarGanancias(productos)).toBe('120.00')
  })

  it('skips DESCUENTO products', () => {
    const productos = [
      { nombre: 'DESCUENTO', precio_venta: 100, costo: 0, cantidad: 1 },
      { precio_venta: 200, costo: 100, cantidad: 1 }
    ]
    expect(generarGanancias(productos)).toBe('100.00')
  })

  it('skips DELIVERY products', () => {
    const productos = [
      { nombre: 'DELIVERY', precio_venta: 100, costo: 0, cantidad: 1 },
      { precio_venta: 200, costo: 100, cantidad: 1 }
    ]
    expect(generarGanancias(productos)).toBe('100.00')
  })

  it('uses precio_final when precio_venta is missing', () => {
    const productos = [{ precio_final: 150, costo: 100, cantidad: 1 }]
    expect(generarGanancias(productos)).toBe('50.00')
  })

  it('looks up costo from inventory if not in product', () => {
    const inventario = [{ codigo: 'P001', precio_compra: 80 }]
    const productos = [{ codigo: 'P001', precio_venta: 200, cantidad: 1 }]
    expect(generarGanancias(productos, inventario)).toBe('120.00')
  })

  it('returns 0 for empty products', () => {
    expect(generarGanancias([])).toBe('0.00')
  })

  it('uses 0 price when no price fields exist', () => {
    const productos = [{ nombre: 'Gratis', cantidad: 1 }]
    expect(generarGanancias(productos)).toBe('0.00')
  })
})
