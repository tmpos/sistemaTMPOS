import {
  peticiones,
  nfecha,
  generarCodigoUnico,
  envioElectron,
  enviarDatosPorPost,
  peticionesFetch,
  peticionesFetchOffline,
  sincronizarStockProductoPorImeiDisponible
} from './funciones.js'

/********************************************************************/
const generarGanancias = (productos, productosArray = []) => {
  let gananciaPura = 0

  for (let prod of productos) {
    // Ignorar productos con nombre "DESCUENTO", "DELIVERY", etc.
    if (/descuento|delivery/i.test(prod.nombre || '')) continue

    const cantidad = parseFloat(prod.cantidad) || 1
    const precioVenta =
      parseFloat(prod.precio_venta) || parseFloat(prod.precio_final) || parseFloat(prod.precio) || 0

    let precioCompra = 0

    // Priorizar siempre el costo del item de venta si viene en el producto
    if (prod.costo != null && prod.costo !== '') {
      precioCompra = parseFloat(prod.costo) || 0
    } else if (prod.precio_compra != null && prod.precio_compra !== '') {
      precioCompra = parseFloat(prod.precio_compra) || 0
    } else {
      // Fallback al producto base en inventario
      const datosProd = buscarProductoInventario(productosArray, prod)
      if (datosProd) {
        precioCompra = parseFloat(datosProd.precio_compra) || 0
      }
    }

    gananciaPura += (precioVenta - precioCompra) * cantidad
  }

  return gananciaPura.toFixed(2)
}
/********************************************************************/
const normalizeComparable = (value) => {
  if (value === undefined || value === null) return null
  const text = String(value).trim()
  return text === '' ? null : text
}
/********************************************************************/
const equalsIfPresent = (a, b) => {
  const na = normalizeComparable(a)
  const nb = normalizeComparable(b)
  return na !== null && nb !== null && na === nb
}
/********************************************************************/
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
/********************************************************************/
function quitarBarraFinal(str) {
  // Verifica si el string termina con una barra diagonal
  if (str.endsWith('/')) {
    // Si termina con una barra, la elimina
    return str.slice(0, -1)
  }
  // Si no termina con una barra, devuelve el string original
  return str
}
/******************************************************************/
const sincronizarStockCelularesFactura = async (productosFactura = []) => {
  try {
    const idsCelulares = [
      ...new Set(
        (productosFactura || [])
          .filter((prod) => prod?.categoria === 'CELULARES' && prod?.id)
          .map((prod) => prod.id)
      )
    ]

    for (const idProducto of idsCelulares) {
      await sincronizarStockProductoPorImeiDisponible(idProducto)
    }
  } catch (error) {
    console.error('Error sincronizando stock de CELULARES al crear factura:', error)
  }
}
/******************************************************************/
const toNumber = (value, fallback = 0) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}
/******************************************************************/
const obtenerRegistro = (value) => {
  if (Array.isArray(value)) {
    return value[0] || null
  }
  return value || null
}
/******************************************************************/
const aplicarDistribucionUtilidadesVenta = async ({ data, ganancia, datosUsuarioLocal }) => {
  try {
    const reglasRaw = await peticionesFetchOffline('getDataAsArray', 'distribucion_utilidades')
    const reglas = Array.isArray(reglasRaw) ? reglasRaw : []

    if (!reglas.length) return

    const reglasActivas = reglas.filter(
      (regla) =>
        String(regla?.estado || 'ACTIVA').toUpperCase() === 'ACTIVA' &&
        toNumber(regla?.porcentaje, 0) > 0 &&
        regla?.id_cuenta
    )

    if (!reglasActivas.length) return

    for (const regla of reglasActivas) {
      try {
        const baseCalculo = String(regla.base_calculo || 'TOTAL').toUpperCase()
        const porcentaje = toNumber(regla.porcentaje, 0)

        let baseMonto = toNumber(data.total, 0)
        if (baseCalculo === 'SUBTOTAL') {
          baseMonto = toNumber(data.subtotal, 0)
        } else if (baseCalculo === 'GANANCIA') {
          baseMonto = toNumber(ganancia, 0)
        }

        const montoAsignado = Number(((baseMonto * porcentaje) / 100).toFixed(2))
        if (montoAsignado <= 0) continue

        const cuentaRaw = await peticionesFetchOffline(
          'getDataByField',
          'cuentas',
          'id',
          regla.id_cuenta
        )
        const cuenta = obtenerRegistro(cuentaRaw)
        if (!cuenta?.id) continue

        cuenta.saldo = Number((toNumber(cuenta.saldo, 0) + montoAsignado).toFixed(2))
        if (Object.prototype.hasOwnProperty.call(cuenta, 'updated_at')) {
          cuenta.updated_at = nfecha('timestamp')
        }

        await peticionesFetchOffline('updateData', 'cuentas', JSON.stringify(cuenta))

        try {
          const movimiento = {
            id_regla: regla.id,
            id_cuenta: cuenta.id,
            codigo_cuenta: regla.codigo_cuenta || cuenta.id,
            nombre_cuenta: regla.nombre_cuenta || cuenta.nombre || '',
            base_calculo: baseCalculo,
            base_monto: baseMonto,
            porcentaje,
            monto_asignado: montoAsignado,
            no_factura: data.nofactura,
            usuario:
              data.cajeroFN || data.vendedorFN || datosUsuarioLocal?.[0]?.usuario || 'SISTEMA',
            created_at: nfecha('timestamp'),
            updated_at: nfecha('timestamp')
          }
          await peticionesFetchOffline(
            'insertData',
            'distribucion_utilidades_movimientos',
            JSON.stringify(movimiento)
          )
        } catch (errorMovimiento) {
          console.warn('No se pudo registrar movimiento de distribucion:', errorMovimiento)
        }
      } catch (errorRegla) {
        console.error('Error aplicando regla de distribucion:', errorRegla)
      }
    }
  } catch (error) {
    console.warn('Distribucion de utilidades no aplicada:', error)
  }
}
/******************************************************************/
export async function facturaNueva(url, data, metodo, token) {
  const _productosArrayRaw = await peticionesFetchOffline('getDataAsArray', 'productos')
  const productosArray = Array.isArray(_productosArrayRaw)
    ? _productosArrayRaw
    : _productosArrayRaw?.data && Array.isArray(_productosArrayRaw.data)
      ? _productosArrayRaw.data
      : []
  const datosJSON = await envioElectron('datosarchivo')

  const datosUsuarioLocal = JSON.parse(window.localStorage.getItem('usuarioLocal')) || []
  if (!datosUsuarioLocal) {
    return ['error']
  }

  const copiaData = JSON.parse(JSON.stringify(data))

  const listadoImei = []
  const productos = await Promise.all(
    data.productosArray.map(async (prods) => {
      // Buscar el producto en el inventario de forma más completa
      let costoProdObj = buscarProductoInventario(productosArray, prods)

      // Obtener el costo con fallbacks apropiados, verificando que sea un valor válido
      let costoProd = 0
      const costoInventario = parseFloat(costoProdObj?.precio_compra)
      const costoProducto = parseFloat(prods.precio_compra || prods.costo)

      if (!isNaN(costoInventario) && costoInventario > 0) {
        costoProd = costoInventario
      } else if (!isNaN(costoProducto) && costoProducto > 0) {
        costoProd = costoProducto
      }

      // Si es CELULARES, obtener el costo desde el IMEI
      if (prods.categoria === 'CELULARES' && (prods.imei || prods.imei_seleccionado)) {
        const imeiValue = prods.imei || prods.imei_seleccionado
        const datosImei = await peticionesFetchOffline('getDataByField', 'imei', 'imei', imeiValue)
        if (datosImei && datosImei.precio_compra) {
          costoProd = parseFloat(datosImei.precio_compra) || costoProd
        }
      }

      // Recalcular precio_final correctamente: precio_venta + impuesto_venta
      const precioVenta = Number(prods.precio_venta) || 0
      const impuestoVenta = Number(prods.impuesto_venta) || 0
      const descuento = Number(prods.descuento) || 0
      const cantidad = Number(prods.cantidad) || 1

      // precio_final = precio_venta + impuesto_venta
      const precioFinal = Number((precioVenta + impuestoVenta).toFixed(2))

      // total = (precio_final * cantidad) - descuento
      const total = Number((precioFinal * cantidad - descuento).toFixed(2))

      const ganancia = (precioFinal - parseFloat(costoProd)) * cantidad

      const producto = {
        id: prods.id,
        codigo: prods.codigo_interno || prods.codigo,
        nombre: prods.nombre_comercial || prods.nombre || '',
        categoria: prods.categoria,
        cantidad: cantidad,
        precio: precioVenta,
        precio_venta: precioVenta,
        descuento: descuento,
        impuesto_venta: impuestoVenta,
        impuestos: prods.impuestos,
        precio_final: precioFinal,
        no_compra: prods.no_compra,
        precio_compra: prods.precio_compra,
        costo: costoProd,
        porcentaje: prods.porcentaje,
        precio_real: prods.precio_real,
        total: total,
        impuesto: impuestoVenta,
        ganancia: ganancia,
        ganancia_pura: ganancia
      }

      if (prods.categoria === 'CELULARES') {
        producto.imei = prods.imei || prods.imei_seleccionado || ''
      }

      return producto
    })
  )

  const ganancia = generarGanancias(productos, productosArray)

  var datos = {
    no_factura: data.nofactura,
    tipo_factura: data.tipocomprobanteFN,
    comprobante: data.comprobanteFN,
    cod_cliente: data.cliente.codigo,
    nombre_cliente: data.cliente.nombre,
    telefono_cliente: data.cliente.telefono,
    productos: JSON.stringify(productos),
    vendedor: data.vendedorFN,
    metodo_pago: data.metodoPagoFN,
    fecha_emision: nfecha('fecha'),
    impuesto: data.impuesto,
    descuento: data.descuento,
    subtotal: data.subtotal,
    total: data.total,
    total_institucion: data.total_institucion,
    total_cliente: data.total_cliente,
    ganancia: ganancia,
    estado_factura: data.estadoFN,
    efectivo: data.efectivoFN,
    canal_venta: data.canalventa,
    transferencia: data.transferenciaFN,
    tarjeta: data.tarjetaFN,
    cheque: data.chequeFN,
    fecha_estado: nfecha('fecha'),
    financiera: data.entidad_financiera, //cajero vendedor instalador
    nota: data.nota,
    almacen: data.almacen,
    otro: JSON.stringify([
      {
        delivery: data.deliveryFN,
        mesero: data.meseroFN,
        mesa: data.mesaFN,
        vendedor: data.vendedorFN,
        instalador: data.instaladorFN,
        pagocon: data.pagaCon,
        sucambio: data.suCambio,
        cajero: data.cajeroFN,
        noCheque: data.noCheque,
        bancoCheque: data.bancoCheque,
        token: datosUsuarioLocal[0].token
      }
    ]),
    mes: nfecha('mes'),
    cajero: data.cajeroFN,
    token: datosUsuarioLocal[0].token,
    year: nfecha('year'),
    hora: nfecha('hora'),
    created_at: nfecha('timestamp'),
    updated_at: nfecha('timestamp'),
    usuario: data.vendedorFN
  }

  // El sistema es exclusivamente online: nunca crear una factura local que
  // después pueda sobrescribir inventario o almacenes del servidor.
  if (!navigator.onLine) {
    return ['error', 'Se requiere conexión a Internet para registrar la factura.']
  }

  // ONLINE: verificar en servidor y guardar
  const verificaFactura = await peticionesFetch(
    `${datosJSON.VITE_LINKURL}${datosJSON.VITE_LINK_API}`,
    `datoscampo/facturas/no_factura/${data.nofactura}`,
    {},
    token,
    'GET'
  )

  if (verificaFactura) {
    const returno = ['ok', 'Ya Existe']
    return returno
  }

  const respuestaServer = await peticiones(url, datos, metodo, token)
  const facturaCreada =
    (Array.isArray(respuestaServer) && respuestaServer[0] === 'ok') ||
    (!!respuestaServer && !respuestaServer.error)

  if (facturaCreada) {
    await sincronizarStockCelularesFactura(productos)
    await aplicarDistribucionUtilidadesVenta({ data, ganancia, datosUsuarioLocal })
  }

  return respuestaServer
}

/*********************************************************/
export async function facturaActualizar(url, data, metodo, token) {
  const _prodRaw2 = await peticionesFetchOffline('getDataAsArray', 'productos')
  const productosArray = Array.isArray(_prodRaw2)
    ? _prodRaw2
    : _prodRaw2?.data && Array.isArray(_prodRaw2.data)
      ? _prodRaw2.data
      : []
  const datosJSON = await envioElectron('datosarchivo')
  //console.log("datosJSON", datosJSON);
  const listadoImei = []
  const productos = await Promise.all(
    data.productosArray.map(async (prods) => {
      // Buscar el producto en el inventario de forma más completa
      let costoProdObj = buscarProductoInventario(productosArray, prods)

      // Obtener el costo con fallbacks apropiados, verificando que sea un valor válido
      let costoProd = 0
      const costoInventario = parseFloat(costoProdObj?.precio_compra)
      const costoProducto = parseFloat(prods.precio_compra || prods.costo)

      if (!isNaN(costoInventario) && costoInventario > 0) {
        costoProd = costoInventario
      } else if (!isNaN(costoProducto) && costoProducto > 0) {
        costoProd = costoProducto
      }

      // Si es CELULARES, obtener el costo desde el IMEI
      if (prods.categoria === 'CELULARES' && (prods.imei || prods.imei_seleccionado)) {
        const imeiValue = prods.imei || prods.imei_seleccionado
        const datosImei = await peticionesFetchOffline('getDataByField', 'imei', 'imei', imeiValue)
        if (datosImei && datosImei.precio_compra) {
          costoProd = parseFloat(datosImei.precio_compra) || costoProd
        }
      }

      // Recalcular precio_final correctamente: precio_venta + impuesto_venta
      const precioVenta = Number(prods.precio_venta) || 0
      const impuestoVenta = Number(prods.impuesto_venta) || 0
      const descuento = Number(prods.descuento) || 0
      const cantidad = Number(prods.cantidad) || 1

      // precio_final = precio_venta + impuesto_venta
      const precioFinal = Number((precioVenta + impuestoVenta).toFixed(2))

      // total = (precio_final * cantidad) - descuento
      const total = Number((precioFinal * cantidad - descuento).toFixed(2))

      const ganancia = ((precioFinal - parseFloat(costoProd)) * cantidad).toFixed(2)

      const producto = {
        id: prods.id,
        codigo: prods.codigo_interno || prods.codigo,
        nombre: prods.nombre_comercial || prods.nombre || '',
        categoria: prods.categoria,
        empaque: prods.empaque,
        cantidad: cantidad,
        precio: precioVenta,
        precio_venta: precioVenta,
        descuento: descuento,
        impuesto_venta: impuestoVenta,
        impuestos: prods.impuestos,
        precio_final: precioFinal,
        no_compra: prods.no_compra,
        costo: costoProd,
        total: total,
        impuesto: impuestoVenta,
        ganancia: ganancia,
        ganancia_pura: ganancia,
        stock: prods.stock,
        imagen: prods.imagen
      }

      if (prods.categoria === 'CELULARES') {
        producto.imei = prods.imei || prods.imei_seleccionado || ''
      }

      return producto
    })
  )

  const ganancia = generarGanancias(productos, productosArray)

  var datos = {
    id: data.id,
    no_factura: data.nofactura,
    //'tipo_factura':data.tipocomprobanteFN,
    //'comprobante':data.comprobanteFN,
    /*'cod_cliente':data.cliente.codigo,
'nombre_cliente':data.cliente.nombre,
'telefono_cliente':data.cliente.telefono,*/
    productos: JSON.stringify(productos),
    vendedor: data.vendedorFN,
    //'metodo_pago':data.metodoPagoFN,
    fecha_emision: nfecha('fecha'),
    impuesto: data.impuesto,
    descuento: data.descuento,
    subtotal: data.subtotal,
    total: data.total,
    ganancia: ganancia,
    estado_factura: data.estadoFN,
    efectivo: data.efectivoFN,
    canal_venta: data.canalventa,
    transferencia: data.transferenciaFN,
    tarjeta: data.tarjetaFN,
    fecha_estado: nfecha('fecha'),
    //'financiera':data.entidad_financiera,//cajero vendedor instalador
    nota: data.nota,
    otro: JSON.stringify([
      {
        delivery: data.deliveryFN,
        mesero: data.meseroFN,
        mesa: data.mesaFN,
        vendedor: data.vendedorFN,
        instalador: data.instaladorFN,
        pagocon: data.total,
        sucambio: '0.00',
        cajero: data.cajeroFN,
        token: generarCodigoUnico()
      }
    ]),
    mes: nfecha('mes'),
    year: nfecha('year'),
    hora: nfecha('hora'),
    created_at: data.created_at,
    updated_at: nfecha('timestamp'),
    usuario: data.vendedorFN
  }
  const respuestaServer = await peticiones(url, datos, metodo, token)
  return respuestaServer
}

/*********************************************************/
export async function cotizacionNueva(url, data, metodo, token) {
  const _prodRaw3 = await peticionesFetchOffline('getDataAsArray', 'productos')
  const productosArray = Array.isArray(_prodRaw3)
    ? _prodRaw3
    : _prodRaw3?.data && Array.isArray(_prodRaw3.data)
      ? _prodRaw3.data
      : []
  const listadoImei = []
  const productos = data.productosArray.map((prods) => {
    // Recalcular precio_final correctamente: precio_venta + impuesto_venta
    const precioVenta = Number(prods.precio_venta) || 0
    const impuestoVenta = Number(prods.impuesto_venta) || 0
    const descuento = Number(prods.descuento) || 0
    const cantidad = Number(prods.cantidad) || 1

    // precio_final = precio_venta + impuesto_venta
    const precioFinal = Number((precioVenta + impuestoVenta).toFixed(2))

    // total = (precio_final * cantidad) - descuento
    const total = Number((precioFinal * cantidad - descuento).toFixed(2))

    const producto = {
      id: prods.id,
      codigo: prods.codigo_interno || prods.codigo,
      nombre: prods.nombre_comercial || prods.nombre || '',
      categoria: prods.categoria,
      empaque: prods.empaque,
      cantidad: cantidad,
      precio: precioVenta,
      precio_venta: precioVenta,
      descuento: descuento,
      impuesto_venta: impuestoVenta,
      impuestos: prods.impuestos,
      precio_final: precioFinal,
      no_compra: prods.no_compra,
      costo: prods.precio_compra,
      total: total,
      impuesto: impuestoVenta,
      ganancia: prods.ganancia,
      ganancia_pura: prods.ganancia_pura,
      stock: prods.stock,
      imagen: prods.imagen
    }

    return producto
  })

  var datos = {
    no_cotizacion: data.nofactura,
    cod_cliente: data.cliente.codigo,
    nombre_cliente: data.cliente.nombre,
    telefono_cliente: data.cliente.telefono,
    whatsapp_cliente: data.cliente.telefono,
    email_cliente: data.cliente.email,
    direccion_cliente: data.cliente.direccion,
    rnc_cliente: data.cliente.rnc,
    nombre_comercial: data.cliente.n_comercial,
    productos: JSON.stringify(productos),
    vendedor: data.vendedorFN,
    metodo_pago: data.metodoPagoFN,
    fecha_emision: nfecha('fecha'),
    impuesto: data.impuesto,
    descuento: data.descuento,
    subtotal: data.subtotal,
    total: data.total,
    estado_cotizacion: 'PENDIENTE',
    no_factura: '',
    fecha_cambio: '',
    entidad_financiera: data.entidad_financiera,
    vencimiento: data.vencimiento,
    nota: data.nota,
    mes: nfecha('mes'),
    year: nfecha('year'),
    hora: nfecha('hora'),
    usuario: data.vendedorFN,
    total_institucion: data.total_institucion,
    total_cliente: data.total_cliente,
    almacen: data.almacen
  }

  return peticiones(url, datos, metodo, token)
}
/*********************************************************/
export async function restarStock(url, prods, metodo, token) {
  // El servidor es la única autoridad del inventario.
  if (!navigator.onLine) {
    return ['error', 'Se requiere conexión a Internet para actualizar el inventario.']
  }

  try {
    // 🔹 Si ya es string lo usamos directo, si no lo convertimos
    const prodsString = typeof prods === 'string' ? prods : JSON.stringify(prods)

    const resp = await peticiones(url, { productos: prodsString }, metodo, token)
    if (resp?.status === 'success' || resp?.success === true) {
      return ['ok', resp]
    }
    return resp
  } catch (error) {
    console.error('Error al restar stock:', error)
    throw error
  }
}

/*********************************************************/
// Función para actualizar los IMEIs vendidos
export async function actualizarImeisVendidos(productosVendidos, datosVenta) {
  try {
    const resultados = []

    // Filtrar solo productos que tengan IMEI (celulares)
    const productosConImei = productosVendidos.filter(
      (prod) => prod.categoria === 'CELULARES' && (prod.imei || prod.imei_seleccionado)
    )

    // Actualizar cada IMEI uno por uno
    for (const producto of productosConImei) {
      const imeiValue = producto.imei || producto.imei_seleccionado
      const verificaIMEI = await peticionesFetchOffline('getDataByField', 'imei', 'imei', imeiValue)
      if (!verificaIMEI) {
        return
      }
      const precioVenta = parseFloat(producto.precio_final) || 0
      const precioCompra = parseFloat(producto.precio_compra || producto.costo) || 0
      const gananciaImei = precioVenta - precioCompra

      ;(verificaIMEI.estado = 'VENDIDO'),
        (verificaIMEI.comprador = datosVenta.cliente?.nombre || ''),
        (verificaIMEI.precio_venta = precioVenta),
        (verificaIMEI.updated_at = nfecha('timestamp')),
        (verificaIMEI.fecha_venta = nfecha('fecha')),
        (verificaIMEI.hora_venta = nfecha('hora')),
        (verificaIMEI.vendedor = datosVenta.vendedor || ''),
        (verificaIMEI.no_factura = datosVenta.no_factura || ''),
        (verificaIMEI.ganancia = gananciaImei.toFixed(2))

      const resultado = await peticionesFetchOffline(
        'updateData',
        'imei',
        JSON.stringify(verificaIMEI)
      )

      // Actualizar el IMEI en la base de datos
      /*      const resultado = await peticionesFetchOffline(
        'updateDataByField',
        'imei',
        'imei',
        imeiValue,
        JSON.stringify(datosActualizar)
      );*/

      resultados.push({
        imei: imeiValue,
        resultado: resultado
      })
    }

    // Obtener IDs únicos de productos para actualizar stock
    const idsProductos = [...new Set(productosConImei.map((p) => p.id))]

    // Actualizar stock de cada producto basándose en IMEIs disponibles
    for (const idProducto of idsProductos) {
      await actualizarStockPorImei(idProducto)
    }

    return resultados
  } catch (error) {
    console.error('Error al actualizar IMEIs vendidos:', error)
    throw error
  }
}

/*********************************************************/
// Función para actualizar el stock del producto basándose en IMEIs disponibles
export async function actualizarStockPorImei(idProducto) {
  try {
    if (!idProducto) return null

    const datosProd = await peticionesFetchOffline('getDataByField', 'productos', 'id', idProducto)

    if (!datosProd) return null

    // Buscar todos los IMEIs con estado DISPONIBLE y el id_equi igual al producto
    const imeisDisponibles = await peticionesFetchOffline(
      'getDataArrayByTwoConditions',
      'imei',
      'id_equi',
      idProducto,
      'estado',
      'DISPONIBLE'
    )

    // Un IMEI de otro almacén nunca puede aumentar el stock de este producto.
    const almacenProducto = `${datosProd.almacen ?? ''}`.trim().toUpperCase()
    const imeisDelProductoYAlmacen = Array.isArray(imeisDisponibles)
      ? imeisDisponibles.filter(
          (imei) => `${imei.almacen ?? ''}`.trim().toUpperCase() === almacenProducto
        )
      : []
    const nuevoStock = imeisDelProductoYAlmacen.length

    // Actualizar el stock del producto
    const datosActualizar = {
      stock: nuevoStock,
      updated_at: nfecha('timestamp')
    }

    datosProd.stock = nuevoStock
    datosProd.updated_at = nfecha('timestamp')

    const resultado = await peticionesFetchOffline(
      'updateData',
      'productos',
      JSON.stringify(datosProd)
    )

    console.log(`Stock actualizado para producto ${idProducto}: ${nuevoStock} unidades`)

    return {
      idProducto,
      nuevoStock,
      resultado
    }
  } catch (error) {
    console.error('Error al actualizar stock por IMEI:', error)
    throw error
  }
}

/*********************************************************/
// Función para actualizar los electrodomésticos vendidos
export async function actualizarElectrodomesticosVendidos(productosVendidos, datosVenta) {
  try {
    const resultados = []

    // Filtrar solo productos que tengan serial (electrodomésticos)
    const productosConSerial = productosVendidos.filter(
      (prod) => prod.categoria === 'ELECTRODOMESTICOS' && prod.lista_imei
    )

    // Actualizar cada serial uno por uno
    for (const producto of productosConSerial) {
      // Obtener los seriales (pueden venir en lista_imei como string separado por comas)
      const seriales = producto.lista_imei.split(',').map((s) => s.trim())

      for (const serialValue of seriales) {
        const verificaSerial = await peticionesFetchOffline(
          'getDataByField',
          'electrodomesticos',
          'serial',
          serialValue
        )

        if (!verificaSerial) {
          continue
        }

        const precioVenta = parseFloat(producto.precio_final) || 0
        const precioCompra = parseFloat(producto.precio_compra || producto.costo) || 0
        const gananciaSerial = precioVenta - precioCompra

        verificaSerial.estado = 'VENDIDO'
        verificaSerial.comprador = datosVenta.cliente?.nombre || ''
        verificaSerial.precio_venta = precioVenta
        verificaSerial.updated_at = nfecha('timestamp')
        verificaSerial.fecha_venta = nfecha('fecha')
        verificaSerial.hora_venta = nfecha('hora')
        verificaSerial.vendedor = datosVenta.vendedor || ''
        verificaSerial.no_factura = datosVenta.no_factura || ''
        verificaSerial.ganancia = gananciaSerial.toFixed(2)

        const resultado = await peticionesFetchOffline(
          'updateData',
          'electrodomesticos',
          JSON.stringify(verificaSerial)
        )

        resultados.push({
          serial: serialValue,
          resultado: resultado
        })
      }
    }

    // Obtener IDs únicos de productos para actualizar stock
    const idsProductos = [...new Set(productosConSerial.map((p) => p.id))]

    // Actualizar stock de cada producto basándose en seriales disponibles
    for (const idProducto of idsProductos) {
      await actualizarStockPorSerial(idProducto)
    }

    return resultados
  } catch (error) {
    console.error('Error al actualizar electrodomésticos vendidos:', error)
    throw error
  }
}

/*********************************************************/
// Función para actualizar el stock del producto basándose en seriales disponibles
export async function actualizarStockPorSerial(idProducto) {
  try {
    if (!idProducto) return null

    const datosProd = await peticionesFetchOffline('getDataByField', 'productos', 'id', idProducto)

    if (!datosProd) return null

    // Buscar todos los seriales con estado DISPONIBLE y el id_equi igual al producto
    const serialesDisponibles = await peticionesFetchOffline(
      'getDataArrayByTwoConditions',
      'electrodomesticos',
      'id_equi',
      idProducto,
      'estado',
      'DISPONIBLE'
    )

    // El nuevo stock es la cantidad de seriales disponibles
    const nuevoStock = serialesDisponibles ? serialesDisponibles.length : 0

    // Actualizar el stock del producto
    datosProd.stock = nuevoStock
    datosProd.updated_at = nfecha('timestamp')

    const resultado = await peticionesFetchOffline(
      'updateData',
      'productos',
      JSON.stringify(datosProd)
    )

    console.log(`Stock actualizado para producto ${idProducto}: ${nuevoStock} unidades`)

    return {
      idProducto,
      nuevoStock,
      resultado
    }
  } catch (error) {
    console.error('Error al actualizar stock por serial:', error)
    throw error
  }
}

/**********************************************************/
