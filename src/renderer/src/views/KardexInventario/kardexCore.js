const texto = (valor) => String(valor ?? '').trim()

export const numero = (valor) => {
  if (typeof valor === 'number') return Number.isFinite(valor) ? valor : 0
  const limpio = texto(valor).replace(/[^0-9,.-]/g, '')
  if (!limpio) return 0
  const normalizado = limpio.includes(',') && limpio.includes('.')
    ? limpio.replace(/,/g, '')
    : limpio.replace(',', '.')
  const resultado = Number(normalizado)
  return Number.isFinite(resultado) ? resultado : 0
}

export const parsearJSONLista = (valor) => {
  if (Array.isArray(valor)) return valor
  if (valor && typeof valor === 'object') return [valor]
  if (!texto(valor)) return []
  try {
    const parsed = JSON.parse(valor)
    return Array.isArray(parsed) ? parsed : (parsed && typeof parsed === 'object' ? [parsed] : [])
  } catch {
    return []
  }
}

const crearFechaLocal = (year, month, day, hora = 0, minuto = 0, segundo = 0) => {
  const fecha = new Date(year, month - 1, day, hora, minuto, segundo)
  if (
    fecha.getFullYear() !== year || fecha.getMonth() !== month - 1 || fecha.getDate() !== day
  ) return null
  return fecha
}

export const parsearFecha = (valor, hora = '') => {
  if (valor instanceof Date && !Number.isNaN(valor.getTime())) return new Date(valor)
  if (typeof valor === 'number' && Number.isFinite(valor)) {
    const fecha = new Date(valor)
    return Number.isNaN(fecha.getTime()) ? null : fecha
  }

  const dato = texto(valor)
  if (!dato) return null
  const horaTexto = texto(hora)
  const partesHora = horaTexto.match(/(\d{1,2}):(\d{2})(?::(\d{2}))?/) || dato.match(/[T\s](\d{1,2}):(\d{2})(?::(\d{2}))?/)
  const h = numero(partesHora?.[1])
  const m = numero(partesHora?.[2])
  const s = numero(partesHora?.[3])
  const fechaTexto = dato.split(/[T\s]/)[0]
  let match = fechaTexto.match(/^(\d{4})[-\/.](\d{1,2})[-\/.](\d{1,2})$/)
  if (match) return crearFechaLocal(numero(match[1]), numero(match[2]), numero(match[3]), h, m, s)
  match = fechaTexto.match(/^(\d{1,2})[-\/.](\d{1,2})[-\/.](\d{4})$/)
  if (match) return crearFechaLocal(numero(match[3]), numero(match[2]), numero(match[1]), h, m, s)

  const fecha = new Date(dato)
  return Number.isNaN(fecha.getTime()) ? null : fecha
}

export const fechaISO = (valor, hora = '') => {
  const fecha = parsearFecha(valor, hora)
  if (!fecha) return ''
  const y = fecha.getFullYear()
  const m = String(fecha.getMonth() + 1).padStart(2, '0')
  const d = String(fecha.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export const obtenerRango = (preset, ahora = new Date(), desde = null, hasta = null) => {
  const base = parsearFecha(ahora) || new Date()
  base.setHours(0, 0, 0, 0)
  let inicio = new Date(base)
  let fin = new Date(base)

  if (preset === 'ayer') {
    inicio.setDate(inicio.getDate() - 1)
    fin = new Date(inicio)
  } else if (preset === 'semana') {
    const dia = inicio.getDay() || 7
    inicio.setDate(inicio.getDate() - dia + 1)
  } else if (preset === 'mes') {
    inicio = new Date(inicio.getFullYear(), inicio.getMonth(), 1)
  } else if (preset === 'personalizado') {
    inicio = parsearFecha(desde)
    fin = parsearFecha(hasta)
    if (!inicio || !fin) return { inicio: null, fin: null }
  } else if (preset === 'todo') {
    return { inicio: null, fin: null }
  }

  inicio.setHours(0, 0, 0, 0)
  fin.setHours(23, 59, 59, 999)
  if (inicio > fin) [inicio, fin] = [new Date(fin.setHours(0, 0, 0, 0)), new Date(inicio.setHours(23, 59, 59, 999))]
  return { inicio, fin }
}

const normal = (valor) => texto(valor).toLocaleLowerCase('es').normalize('NFD').replace(/[\u0300-\u036f]/g, '')
const almacenDe = (objeto, respaldo = '') => texto(objeto?.almacen || objeto?.sucursal || objeto?.bodega || respaldo)
const codigoDe = (objeto) => texto(objeto?.codigo || objeto?.codigo_producto || objeto?.codigo_barra || objeto?.barcode || objeto?.cod_producto || objeto?.id_producto || objeto?.producto_id)
const nombreDe = (objeto) => texto(objeto?.nombre || objeto?.nombre_producto || objeto?.descripcion || objeto?.producto || objeto?.name)

export const crearIndiceProductos = (productos = []) => {
  const indice = { porId: new Map(), porCodigo: new Map(), porNombre: new Map(), productos: [] }
  for (const producto of productos) {
    const almacen = almacenDe(producto)
    const entrada = {
      ...producto,
      productoId: texto(producto.id),
      codigo: codigoDe(producto),
      nombre: nombreDe(producto) || 'Producto sin nombre',
      almacen,
      stockActual: numero(producto.stock)
    }
    entrada.clave = `${entrada.productoId || normal(entrada.codigo || entrada.nombre)}@@${normal(almacen)}`
    indice.productos.push(entrada)
    if (entrada.productoId) indice.porId.set(`${entrada.productoId}@@${normal(almacen)}`, entrada)
    if (entrada.codigo) indice.porCodigo.set(`${normal(entrada.codigo)}@@${normal(almacen)}`, entrada)
    indice.porNombre.set(`${normal(entrada.nombre)}@@${normal(almacen)}`, entrada)
  }
  return indice
}

const buscarProducto = (item, almacen, indice) => {
  const sufijo = `@@${normal(almacen)}`
  const id = texto(item?.id_producto || item?.producto_id || item?.id_equi)
  const codigo = codigoDe(item)
  const nombre = nombreDe(item)
  const buscarConOCualquierAlmacen = (mapa, llave) => {
    if (!llave) return null
    const exacto = mapa.get(`${normal(llave)}${sufijo}`) || mapa.get(`${llave}${sufijo}`)
    if (exacto) return exacto
    return [...mapa.entries()].find(([key]) => key.startsWith(`${normal(llave)}@@`) || key.startsWith(`${llave}@@`))?.[1] || null
  }
  return buscarConOCualquierAlmacen(indice.porId, id)
    || buscarConOCualquierAlmacen(indice.porCodigo, codigo)
    || buscarConOCualquierAlmacen(indice.porNombre, nombre)
}

const crearMovimiento = ({ item, documento, fuente, tipo, fecha, hora, almacen, usuario, descripcion, cantidad, indice, id }) => {
  const producto = buscarProducto(item, almacen, indice)
  const nombre = producto?.nombre || nombreDe(item) || 'Producto no identificado'
  const codigo = producto?.codigo || codigoDe(item)
  const almacenFinal = producto?.almacen || almacenDe(item, almacen) || 'Sin almacén'
  const clave = producto?.clave || `desconocido:${normal(codigo || nombre)}@@${normal(almacenFinal)}`
  const entrada = tipo === 'ENTRADA' ? Math.abs(numero(cantidad)) : 0
  const salida = tipo === 'SALIDA' ? Math.abs(numero(cantidad)) : 0
  return {
    id: texto(id), clave, productoId: producto?.productoId || '', codigo, producto: nombre,
    almacen: almacenFinal, fecha: fechaISO(fecha, hora), fechaValor: parsearFecha(fecha, hora),
    hora: texto(hora), tipo, entrada, salida, movimiento: entrada - salida,
    documento: texto(documento) || 'S/D', origen: fuente, usuario: texto(usuario) || 'Sistema',
    descripcion: texto(descripcion), costo: numero(item?.precio_compra ?? item?.costo ?? item?.precio),
    saldoAnterior: 0, existencia: 0, stockActual: producto?.stockActual
  }
}

const documentoValido = (documento) => !/(anulad|cancelad|eliminad)/i.test(texto(documento?.estado_factura || documento?.estado))

export const construirMovimientos = ({ productos = [], facturas = [], compras = [], danados = [], usoInterno = [] } = {}) => {
  const indice = crearIndiceProductos(productos)
  const movimientos = []

  for (const factura of facturas.filter(documentoValido)) {
    const almacen = almacenDe(factura)
    parsearJSONLista(factura.productos).forEach((item, posicion) => movimientos.push(crearMovimiento({
      item, documento: factura.no_factura || factura.comprobante, fuente: 'Venta', tipo: 'SALIDA',
      fecha: factura.fecha_emision || factura.fecha || factura.created_at, hora: factura.hora,
      almacen, usuario: factura.usuario || factura.cajero || factura.vendedor,
      descripcion: `Venta a ${texto(factura.nombre_cliente) || 'cliente'}`,
      cantidad: item.cantidad ?? item.quantity ?? item.stock,
      indice, id: `factura-${factura.id || factura.no_factura}-${posicion}`
    })))
  }

  for (const compra of compras.filter(documentoValido)) {
    const almacen = almacenDe(compra)
    parsearJSONLista(compra.productos).forEach((item, posicion) => movimientos.push(crearMovimiento({
      item, documento: compra.no_factura || compra.ncf_proveedor, fuente: 'Compra', tipo: 'ENTRADA',
      fecha: compra.fecha || compra.created_at, hora: compra.hora, almacen,
      usuario: compra.usuario, descripcion: `Compra a ${texto(compra.proveedor) || 'proveedor'}`,
      cantidad: item.stock ?? item.cantidad ?? item.quantity,
      indice, id: `compra-${compra.id || compra.no_factura}-${posicion}`
    })))
  }

  for (const item of danados) movimientos.push(crearMovimiento({
    item, documento: item.documento || `DAÑO-${item.id}`, fuente: 'Producto dañado', tipo: 'SALIDA',
    fecha: item.fecha || item.created_at, hora: item.hora, almacen: almacenDe(item), usuario: item.usuario,
    descripcion: item.descripcion_dano || item.motivo_baja || item.estado,
    cantidad: item.cantidad, indice, id: `danado-${item.id}`
  }))

  for (const item of usoInterno) {
    movimientos.push(crearMovimiento({
      item, documento: item.documento || `USO-${item.id}`, fuente: 'Uso interno', tipo: 'SALIDA',
      fecha: item.fecha || item.created_at, hora: item.hora, almacen: almacenDe(item), usuario: item.usuario,
      descripcion: [item.area_uso, item.motivo_retiro, item.descripcion].filter(Boolean).join(' · '),
      cantidad: item.cantidad, indice, id: `uso-${item.id}`
    }))
    if (/devuelto.*inventario/i.test(texto(item.estado))) movimientos.push(crearMovimiento({
      item, documento: item.documento || `USO-${item.id}`, fuente: 'Devolución uso interno', tipo: 'ENTRADA',
      fecha: item.updated_at || item.fecha, hora: item.hora, almacen: almacenDe(item), usuario: item.usuario,
      descripcion: 'Producto devuelto al inventario', cantidad: item.cantidad, indice, id: `uso-devuelto-${item.id}`
    }))
  }

  return calcularExistencias(movimientos, indice.productos)
}

export const calcularExistencias = (movimientos = [], productos = []) => {
  const stock = new Map(productos.map((producto) => [producto.clave, numero(producto.stockActual ?? producto.stock)]))
  const netos = new Map()
  for (const mov of movimientos) netos.set(mov.clave, (netos.get(mov.clave) || 0) + numero(mov.movimiento))
  const saldos = new Map([...netos.keys()].map((clave) => [clave, (stock.get(clave) || 0) - (netos.get(clave) || 0)]))
  return [...movimientos]
    .filter((mov) => mov.fechaValor)
    .sort((a, b) => a.fechaValor - b.fechaValor || a.id.localeCompare(b.id))
    .map((mov) => {
      const saldoAnterior = saldos.get(mov.clave) || 0
      const existencia = saldoAnterior + mov.movimiento
      saldos.set(mov.clave, existencia)
      return { ...mov, saldoAnterior, existencia }
    })
}

export const filtrarMovimientos = (movimientos = [], filtros = {}) => {
  const { inicio, fin } = obtenerRango(filtros.preset || 'todo', filtros.ahora || new Date(), filtros.desde, filtros.hasta)
  const buscar = normal(filtros.buscar)
  return movimientos.filter((mov) => {
    if (inicio && mov.fechaValor < inicio) return false
    if (fin && mov.fechaValor > fin) return false
    if (filtros.producto && mov.clave !== filtros.producto) return false
    if (filtros.almacen && normal(mov.almacen) !== normal(filtros.almacen)) return false
    if (filtros.tipo && mov.tipo !== filtros.tipo) return false
    if (buscar && !normal([mov.producto, mov.codigo, mov.documento, mov.origen, mov.usuario, mov.descripcion, mov.almacen].join(' ')).includes(buscar)) return false
    return true
  }).sort((a, b) => b.fechaValor - a.fechaValor || b.id.localeCompare(a.id))
}

export const resumirMovimientos = (movimientos = []) => {
  const ordenados = [...movimientos].sort((a, b) => a.fechaValor - b.fechaValor)
  const primeros = new Map()
  const ultimos = new Map()
  for (const movimiento of ordenados) {
    if (!primeros.has(movimiento.clave)) primeros.set(movimiento.clave, movimiento.saldoAnterior)
    ultimos.set(movimiento.clave, movimiento.existencia)
  }
  return {
    movimientos: movimientos.length,
    saldoAnterior: [...primeros.values()].reduce((total, saldo) => total + saldo, 0),
    entradas: movimientos.reduce((total, mov) => total + numero(mov.entrada), 0),
    salidas: movimientos.reduce((total, mov) => total + numero(mov.salida), 0),
    existencia: [...ultimos.values()].reduce((total, saldo) => total + saldo, 0),
    productos: new Set(movimientos.map((mov) => mov.clave)).size
  }
}
