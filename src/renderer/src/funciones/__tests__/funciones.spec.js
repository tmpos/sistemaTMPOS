import { describe, it, expect } from 'vitest'

// Pure functions from funciones.js

const rellenodecero = (number, width) => {
  if (number === '') number = 0
  var numberOutput = Math.abs(number)
  var length = numberOutput.toString().length
  var zero = '0'
  if (width <= length) {
    if (number < 0) return '-' + numberOutput.toString()
    return numberOutput.toString()
  } else {
    if (number < 0) return '-' + zero.repeat(width - length) + numberOutput.toString()
    return zero.repeat(width - length) + numberOutput.toString()
  }
}

const generadorCodigo = (codigo, prefijo, cantidadCeros) => {
  if (prefijo != '') {
    if (Array.isArray(codigo)) return prefijo + rellenodecero(1, cantidadCeros)
    return prefijo + rellenodecero(Number(codigo.replace(/[^0-9]+/g, '')) + 1, cantidadCeros)
  } else {
    if (Array.isArray(codigo)) return rellenodecero(1, cantidadCeros)
    return rellenodecero(Number(codigo.replace(/[^0-9]+/g, '')) + 1, cantidadCeros)
  }
}

const decimales = (valor) => Number(valor).toFixed(2)

const extraerNumeros = (cadena) => {
  if (Array.isArray(cadena)) return
  var numeros = cadena.match(/\d+/g)
  var numerosConcatenados = numeros ? numeros.join('') : ''
  var numeroFinal = parseInt(numerosConcatenados, 10)
  return numeroFinal
}

const extraerString = (cadena) => {
  var subcadena = ''
  for (var i = 0; i < cadena.length; i++) {
    if (!isNaN(parseInt(cadena[i]))) break
    subcadena += cadena[i]
  }
  return subcadena
}

const buscadorObjeto = (miArray, indice, datoBuscado) => {
  return miArray.find((buscador) => buscador[indice] === datoBuscado)
}

const devuelveIndiceObjetoFromArray = (miArray, indice, datoBuscado) => {
  return miArray.findIndex((buscador) => buscador[indice] == datoBuscado)
}

const objectToArray = (objeto) => Object.entries(objeto)

const stringParentesis = (string) => {
  var regExp = /\(([^)]+)\)/g
  var ejecutar = string.match(regExp)
  if (ejecutar != null) {
    return string.match(/\((.*)\)/).pop()
  } else {
    return string
  }
}

const extraerNumerosEntreParentesis = (cadena) => {
  const regex = /\((\d+)\)/g
  let numeros = []
  let coincidencia
  while ((coincidencia = regex.exec(cadena)) !== null) {
    numeros.push(coincidencia[1])
  }
  return numeros
}

const extraerParentesis = (texto) => {
  const coincidencias = [...texto.matchAll(/\(([^)]+)\)/g)]
  const cantidadParentesis = coincidencias.length
  if (cantidadParentesis > 0) {
    return coincidencias[cantidadParentesis - 1][1]
  } else {
    return ''
  }
}

const calcularDiferenciaEnDias = (fecha1, fecha2) => {
  const [dia1, mes1, anio1] = fecha1.split('/').map(Number)
  const [dia2, mes2, anio2] = fecha2.split('/').map(Number)
  const date1 = new Date(anio1, mes1 - 1, dia1)
  const date2 = new Date(anio2, mes2 - 1, dia2)
  const diferenciaEnMilisegundos = Math.abs(date2 - date1)
  const diferenciaEnDias = Math.floor(diferenciaEnMilisegundos / (1000 * 60 * 60 * 24))
  return diferenciaEnDias
}

const esObjeto = (variable) => {
  return variable !== null && typeof variable === 'object' && !Array.isArray(variable)
}

const convertirStringAArrayDeObjetos = (str) => {
  if (str === undefined || str === '' || str === null) return []
  const strArray = str.split(',')
  var resultado = []
  for (var i = 0; i < strArray.length; i++) {
    resultado.push({
      id: strArray[i].trim()
    })
  }
  return resultado
}

const normalizarNombreTabla = (tabla = '') => String(tabla || '').toLowerCase().trim()

const coincideValorCache = (valorA, valorB) => String(valorA ?? '') === String(valorB ?? '')

const isBase64 = (str) => {
  if (typeof str !== 'string' || str.trim() === '') return false
  try {
    const decoded = decodeURIComponent(escape(atob(str)))
    return decoded !== null
  } catch {
    return false
  }
}

const convertirAMayusculas = (texto) => {
  if (!texto || typeof texto !== 'string') return texto
  return texto.toUpperCase()
}

describe('rellenodecero', () => {
  it('pads number with zeros', () => {
    expect(rellenodecero(5, 4)).toBe('0005')
  })
  it('returns number as-is if width <= length', () => {
    expect(rellenodecero(123, 2)).toBe('123')
  })
  it('handles empty string as 0', () => {
    expect(rellenodecero('', 3)).toBe('000')
  })
  it('handles negative numbers', () => {
    expect(rellenodecero(-5, 4)).toBe('-0005')
  })
  it('handles zero', () => {
    expect(rellenodecero(0, 3)).toBe('000')
  })
})

describe('generadorCodigo', () => {
  it('generates code with prefix', () => {
    expect(generadorCodigo('FAC-001', 'FAC-', 5)).toBe('FAC-00002')
  })
  it('generates code without prefix', () => {
    expect(generadorCodigo('001', '', 5)).toBe('00002')
  })
  it('starts at 1 for array input with prefix', () => {
    expect(generadorCodigo([], 'PROD-', 4)).toBe('PROD-0001')
  })
  it('starts at 1 for array input without prefix', () => {
    expect(generadorCodigo([], '', 4)).toBe('0001')
  })
  it('handles non-numeric prefix', () => {
    expect(generadorCodigo('CONSECUTIVO', 'PRE-', 3)).toBe('PRE-001')
  })
})

describe('decimales', () => {
  it('formats integer to 2 decimals', () => {
    expect(decimales(5)).toBe('5.00')
  })
  it('formats float to 2 decimals', () => {
    expect(decimales(5.678)).toBe('5.68')
  })
  it('handles string numbers', () => {
    expect(decimales('10.5')).toBe('10.50')
  })
  it('handles zero', () => {
    expect(decimales(0)).toBe('0.00')
  })
})

describe('extraerNumeros', () => {
  it('extracts digits from string', () => {
    expect(extraerNumeros('ABC123XYZ')).toBe(123)
  })
  it('returns NaN for no digits', () => {
    expect(extraerNumeros('ABC')).toBeNaN()
  })
  it('returns undefined for array input', () => {
    expect(extraerNumeros([1, 2, 3])).toBeUndefined()
  })
  it('extracts multiple number groups', () => {
    expect(extraerNumeros('AB12CD34')).toBe(1234)
  })
})

describe('extraerString', () => {
  it('extracts leading non-numeric chars', () => {
    expect(extraerString('ABC123')).toBe('ABC')
  })
  it('returns empty if starts with number', () => {
    expect(extraerString('123ABC')).toBe('')
  })
  it('returns full string if no numbers', () => {
    expect(extraerString('HELLO')).toBe('HELLO')
  })
})

describe('buscadorObjeto', () => {
  const arr = [{ id: 1, name: 'A' }, { id: 2, name: 'B' }]
  it('finds object by field value', () => {
    expect(buscadorObjeto(arr, 'id', 2)).toEqual({ id: 2, name: 'B' })
  })
  it('returns undefined when not found', () => {
    expect(buscadorObjeto(arr, 'id', 99)).toBeUndefined()
  })
})

describe('devuelveIndiceObjetoFromArray', () => {
  const arr = [{ id: 1 }, { id: 2 }, { id: 3 }]
  it('returns index of matching object', () => {
    expect(devuelveIndiceObjetoFromArray(arr, 'id', 2)).toBe(1)
  })
  it('returns -1 when not found', () => {
    expect(devuelveIndiceObjetoFromArray(arr, 'id', 99)).toBe(-1)
  })
})

describe('objectToArray', () => {
  it('converts object to entries', () => {
    expect(objectToArray({ a: 1, b: 2 })).toEqual([['a', 1], ['b', 2]])
  })
  it('returns empty array for empty object', () => {
    expect(objectToArray({})).toEqual([])
  })
})

describe('stringParentesis', () => {
  it('extracts content inside parentheses', () => {
    expect(stringParentesis('Hola (mundo)')).toBe('mundo')
  })
  it('returns original string if no parentheses', () => {
    expect(stringParentesis('Hola mundo')).toBe('Hola mundo')
  })
  it('handles multiple parentheses (returns last due to greedy match)', () => {
    const result = stringParentesis('A (B) C (D)')
    expect(result).toBe('B) C (D')
  })
})

describe('extraerNumerosEntreParentesis', () => {
  it('extracts numbers inside parentheses', () => {
    expect(extraerNumerosEntreParentesis('(123) y (456)')).toEqual(['123', '456'])
  })
  it('returns empty array for no matches', () => {
    expect(extraerNumerosEntreParentesis('sin numeros')).toEqual([])
  })
})

describe('extraerParentesis', () => {
  it('extracts last parenthesized content', () => {
    expect(extraerParentesis('A (primero) B (segundo)')).toBe('segundo')
  })
  it('returns empty string for no parentheses', () => {
    expect(extraerParentesis('sin parentesis')).toBe('')
  })
})

describe('calcularDiferenciaEnDias', () => {
  it('calculates difference between two dates', () => {
    expect(calcularDiferenciaEnDias('01/01/2024', '10/01/2024')).toBe(9)
  })
  it('returns 0 for same date', () => {
    expect(calcularDiferenciaEnDias('15/06/2024', '15/06/2024')).toBe(0)
  })
  it('handles month boundaries', () => {
    expect(calcularDiferenciaEnDias('31/01/2024', '01/02/2024')).toBe(1)
  })
})

describe('esObjeto', () => {
  it('returns true for plain object', () => {
    expect(esObjeto({})).toBe(true)
    expect(esObjeto({ a: 1 })).toBe(true)
  })
  it('returns false for null', () => {
    expect(esObjeto(null)).toBe(false)
  })
  it('returns false for array', () => {
    expect(esObjeto([1, 2])).toBe(false)
  })
  it('returns false for primitives', () => {
    expect(esObjeto('string')).toBe(false)
    expect(esObjeto(42)).toBe(false)
    expect(esObjeto(true)).toBe(false)
  })
})

describe('convertirStringAArrayDeObjetos', () => {
  it('converts comma-separated string to array of objects', () => {
    expect(convertirStringAArrayDeObjetos('A, B, C')).toEqual([
      { id: 'A' }, { id: 'B' }, { id: 'C' }
    ])
  })
  it('returns empty array for empty input', () => {
    expect(convertirStringAArrayDeObjetos('')).toEqual([])
    expect(convertirStringAArrayDeObjetos(null)).toEqual([])
    expect(convertirStringAArrayDeObjetos(undefined)).toEqual([])
  })
})

describe('normalizarNombreTabla', () => {
  it('lowercases and trims table name', () => {
    expect(normalizarNombreTabla('  FACTURAS ')).toBe('facturas')
  })
  it('returns empty string for empty input', () => {
    expect(normalizarNombreTabla('')).toBe('')
  })
})

describe('coincideValorCache', () => {
  it('returns true for equal values', () => {
    expect(coincideValorCache('abc', 'abc')).toBe(true)
    expect(coincideValorCache(123, '123')).toBe(true)
  })
  it('returns false for different values', () => {
    expect(coincideValorCache('abc', 'xyz')).toBe(false)
  })
  it('handles null/undefined', () => {
    expect(coincideValorCache(null, undefined)).toBe(true)
    expect(coincideValorCache('a', null)).toBe(false)
  })
})

describe('isBase64', () => {
  it('returns true for valid base64', () => {
    expect(isBase64(btoa('test'))).toBe(true)
  })
  it('returns false for invalid base64', () => {
    expect(isBase64('not-base64!!!')).toBe(false)
  })
  it('returns false for empty string', () => {
    expect(isBase64('')).toBe(false)
  })
})

describe('convertirAMayusculas', () => {
  it('converts string to uppercase', () => {
    expect(convertirAMayusculas('hola')).toBe('HOLA')
  })
  it('returns original for non-string', () => {
    expect(convertirAMayusculas(null)).toBeNull()
    expect(convertirAMayusculas(undefined)).toBeUndefined()
  })
  it('handles already uppercase', () => {
    expect(convertirAMayusculas('HOLA')).toBe('HOLA')
  })
})
