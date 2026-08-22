export function texto(valor) { return String(valor ?? '').trim() }
export function clave(valor) { return texto(valor).toUpperCase() }
export function numeroSeguro(valor) {
  if (typeof valor === 'number') return Number.isFinite(valor) ? valor : 0
  let limpio = texto(valor).replace(/[^0-9,.-]/g, '')
  if (limpio.includes(',') && limpio.includes('.')) limpio = limpio.lastIndexOf(',') > limpio.lastIndexOf('.') ? limpio.replace(/\./g, '').replace(',', '.') : limpio.replace(/,/g, '')
  else if (limpio.includes(',')) limpio = limpio.replace(',', '.')
  const n = Number(limpio)
  return Number.isFinite(n) ? n : 0
}
export function leerLista(valor) {
  if (Array.isArray(valor)) return valor
  try { const r = JSON.parse(valor || '[]'); return Array.isArray(r) ? r : [] } catch { return [] }
}
export function fechaComparable(valor) {
  const s = texto(valor)
  const latino = s.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})(.*)$/)
  if (latino) return `${latino[3]}-${latino[2].padStart(2,'0')}-${latino[1].padStart(2,'0')}${latino[4]}`
  return s
}
function estaAnulado(registro) { return /ANUL|CANCEL|BORRAD/.test(clave(registro?.estado || registro?.estatus || registro?.situacion)) }
function cantidadLinea(linea) { return numeroSeguro(linea.cantidad ?? linea.stock ?? linea.cant ?? linea.unidades ?? 0) }
function costoLinea(linea) { return numeroSeguro(linea.precio_compra ?? linea.costo ?? linea.costo_unitario ?? linea.ultimo_costo ?? 0) }
function ventaLinea(linea) { return numeroSeguro(linea.precio_final ?? linea.precio_venta ?? linea.precio ?? linea.total_unitario ?? 0) }
function claveProducto(producto, almacenAlterno = '') { return `${clave(producto.codigo ?? producto.codigo_barra ?? producto.nombre)}|${clave(producto.almacen || almacenAlterno)}` }
function claveSinAlmacen(producto) { return clave(producto.codigo ?? producto.codigo_barra ?? producto.nombre) }

export function construirHistorialCompras(compras = []) {
  const mapa = new Map()
  for (const compra of compras.filter((c) => !estaAnulado(c))) {
    for (const linea of leerLista(compra.productos)) {
      const cantidad = cantidadLinea(linea)
      const costo = costoLinea(linea)
      if (cantidad <= 0 || costo <= 0) continue
      const movimiento = { cantidad, costo, fecha:fechaComparable(compra.created_at || compra.fecha), documento:compra.no_factura || compra.numero || compra.id, proveedor:compra.proveedor || '', almacen:linea.almacen || compra.almacen || '' }
      for (const key of [claveProducto(linea, compra.almacen), `${claveSinAlmacen(linea)}|*`]) {
        if (!mapa.has(key)) mapa.set(key, [])
        mapa.get(key).push(movimiento)
      }
    }
  }
  for (const movimientos of mapa.values()) movimientos.sort((a,b) => String(a.fecha).localeCompare(String(b.fecha)))
  return mapa
}

export function construirHistorialVentas(facturas = []) {
  const mapa = new Map()
  for (const factura of facturas.filter((f) => !estaAnulado(f))) {
    for (const linea of leerLista(factura.productos)) {
      const cantidad = cantidadLinea(linea)
      if (cantidad <= 0) continue
      const movimiento = { cantidad, precio:ventaLinea(linea), costo:costoLinea(linea), fecha:fechaComparable(factura.created_at || factura.fecha), documento:factura.no_factura || factura.numero_factura || factura.numero || factura.id, almacen:linea.almacen || factura.almacen || '' }
      for (const key of [claveProducto(linea, factura.almacen), `${claveSinAlmacen(linea)}|*`]) {
        if (!mapa.has(key)) mapa.set(key, [])
        mapa.get(key).push(movimiento)
      }
    }
  }
  return mapa
}

export function valorarProducto(producto, historialCompras = [], historialVentas = []) {
  const stock = numeroSeguro(producto.stock)
  const costoActual = costoLinea(producto)
  const cantidadComprada = historialCompras.reduce((s,m) => s + m.cantidad, 0)
  const costoPromedioHistorico = cantidadComprada > 0 ? historialCompras.reduce((s,m) => s + m.cantidad * m.costo, 0) / cantidadComprada : 0
  const ultimo = historialCompras.at(-1)
  const ultimoCosto = ultimo?.costo || costoActual
  const costoPromedio = costoPromedioHistorico || costoActual
  const precioVenta = ventaLinea(producto)
  const valorCosto = stock * costoPromedio
  const valorVenta = stock * precioVenta
  const margenUnitario = precioVenta - costoPromedio
  const unidadesVendidas = historialVentas.reduce((s,m) => s + m.cantidad, 0)
  const ingresoVentas = historialVentas.reduce((s,m) => s + m.cantidad * m.precio, 0)
  const costoVentasEstimado = historialVentas.reduce((s,m) => s + m.cantidad * (m.costo || costoPromedio), 0)
  const alertas = []
  if (stock < 0) alertas.push('STOCK_NEGATIVO')
  if (costoPromedio <= 0) alertas.push('SIN_COSTO')
  if (margenUnitario < 0) alertas.push('MARGEN_NEGATIVO')
  return { ...producto, stock, costo_actual:costoActual, costo_promedio:costoPromedio, ultimo_costo:ultimoCosto,
    precio_venta_valoracion:precioVenta, valor_costo:valorCosto, valor_venta:valorVenta, margen_unitario:margenUnitario,
    margen_porcentaje:precioVenta > 0 ? margenUnitario / precioVenta * 100 : 0, unidades_vendidas:unidadesVendidas,
    ingreso_ventas:ingresoVentas, costo_ventas_estimado:costoVentasEstimado, alertas, ultima_compra:ultimo || null,
    historial_compras:historialCompras, historial_ventas:historialVentas }
}

export function agruparValoracion(filas, campo) {
  const mapa = new Map()
  for (const fila of filas) {
    const nombre = texto(fila[campo]) || 'SIN CLASIFICAR'
    if (!mapa.has(nombre)) mapa.set(nombre, { nombre, productos:0, unidades:0, valorCosto:0, valorVenta:0, margen:0 })
    const grupo = mapa.get(nombre); grupo.productos += 1; grupo.unidades += fila.stock; grupo.valorCosto += fila.valor_costo; grupo.valorVenta += fila.valor_venta; grupo.margen += fila.valor_venta - fila.valor_costo
  }
  return [...mapa.values()].sort((a,b) => b.valorCosto - a.valorCosto)
}

export function analizarInventario(productos = [], compras = [], facturas = []) {
  const comprasMapa = construirHistorialCompras(compras)
  const ventasMapa = construirHistorialVentas(facturas)
  const filas = productos.map((p) => {
    const exacta = comprasMapa.get(claveProducto(p)) || []
    const historialCompras = exacta.length ? exacta : comprasMapa.get(`${claveSinAlmacen(p)}|*`) || []
    const ventasExactas = ventasMapa.get(claveProducto(p)) || []
    const historialVentas = ventasExactas.length ? ventasExactas : ventasMapa.get(`${claveSinAlmacen(p)}|*`) || []
    return valorarProducto(p, historialCompras, historialVentas)
  })
  const resumen = filas.reduce((r,f) => { r.productos += 1; r.unidades += f.stock; r.valorCosto += f.valor_costo; r.valorVenta += f.valor_venta; r.margen += f.valor_venta-f.valor_costo; r.costoVentasEstimado += f.costo_ventas_estimado; if(f.alertas.includes('STOCK_NEGATIVO'))r.stockNegativo++; if(f.alertas.includes('SIN_COSTO'))r.sinCosto++; if(f.alertas.includes('MARGEN_NEGATIVO'))r.margenNegativo++; return r },
    { productos:0, unidades:0, valorCosto:0, valorVenta:0, margen:0, costoVentasEstimado:0, stockNegativo:0, sinCosto:0, margenNegativo:0 })
  return { filas, resumen, porCategoria:agruparValoracion(filas,'categoria'), porAlmacen:agruparValoracion(filas,'almacen') }
}

export function calcularSaldoCuenta(asientos = [], nombreCuenta = '') {
  const buscada = clave(nombreCuenta)
  if (!buscada) return { debitos:0, creditos:0, saldo:0, movimientos:0 }
  let debitos=0, creditos=0, movimientos=0
  for (const cabecera of asientos) for (const linea of leerLista(cabecera.asiento)) {
    const cuentaGenerica = clave(linea.cuenta)
    const cuentaDebito = clave(linea.debito || linea.cuentaDebito)
    const cuentaCredito = clave(linea.credito || linea.cuentaCredito)
    if (cuentaGenerica === buscada) { const d=numeroSeguro(linea.cantidadDebito ?? linea.debitoMonto); const c=numeroSeguro(linea.cantidadCredito ?? linea.creditoMonto); debitos+=d; creditos+=c; if(d||c)movimientos++ }
    else { if(cuentaDebito === buscada){debitos+=numeroSeguro(linea.cantidadDebito ?? linea.monto ?? linea.cantidad);movimientos++} if(cuentaCredito === buscada){creditos+=numeroSeguro(linea.cantidadCredito ?? linea.monto ?? linea.cantidad);movimientos++} }
  }
  return { debitos, creditos, saldo:debitos-creditos, movimientos }
}

export function reconciliarInventario(analisis, asientos, cuentaInventario, cuentaCostoVentas) {
  const inventario = calcularSaldoCuenta(asientos, cuentaInventario)
  const costoVentas = calcularSaldoCuenta(asientos, cuentaCostoVentas)
  return { inventario:{ ...inventario, calculado:analisis?.resumen?.valorCosto || 0, diferencia:inventario.saldo-(analisis?.resumen?.valorCosto || 0) },
    costoVentas:{ ...costoVentas, calculado:analisis?.resumen?.costoVentasEstimado || 0, diferencia:costoVentas.saldo-(analisis?.resumen?.costoVentasEstimado || 0) } }
}

export function filtrarValoracion(filas, filtros={}) {
  const q=clave(filtros.busqueda), categoria=clave(filtros.categoria), almacen=clave(filtros.almacen), alerta=clave(filtros.alerta)
  return (filas||[]).filter((f) => (!categoria||clave(f.categoria)===categoria)&&(!almacen||clave(f.almacen)===almacen)&&(!alerta||f.alertas.includes(alerta))&&(!q||[f.codigo,f.codigo_barra,f.nombre,f.categoria,f.almacen].some((v)=>clave(v).includes(q))))
}
