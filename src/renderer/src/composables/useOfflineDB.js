import Dexie from 'dexie'

let db = null

export function initOfflineDB() {
  if (db) return db

  db = new Dexie('sistemaAA_offline')

  db.version(1).stores({
    productos: '++id, codigo, nombre',
    clientes: '++id, codigo, nombre',
    empresa: '++id, nombre',
    usuarios: '++id, email, password',
    configuracion: '++id',
    configuracionfactura: '++id',
    metodopago: '++id',
    theme: '++id',
    facturas_offline: '++id, numero_factura, fecha, cliente, estado',
    cotizaciones_offline: '++id, numero_cotizacion, fecha, cliente, estado',
    sync_queue: '++id, tabla, action, createdAt, synced'
  })

  return db
}

function getDB() {
  if (!db) initOfflineDB()
  return db
}

/**
 * Devuelve todos los registros de una tabla cacheada.
 */
export async function getCachedTable(tabla) {
  try {
    const database = getDB()
    if (!database[tabla]) return []
    return await database[tabla].toArray()
  } catch (e) {
    console.error(`[OfflineDB] getCachedTable(${tabla}):`, e)
    return []
  }
}

/**
 * Busca registros por campo=valor en una tabla cacheada.
 * Devuelve el primer resultado (comportamiento igual que getDataByField).
 * Intenta usar índice Dexie primero; si el campo no está indexado, filtra en memoria.
 */
export async function getCachedByField(tabla, campo, valor) {
  try {
    const database = getDB()
    if (!database[tabla]) return null
    try {
      const results = await database[tabla].where(campo).equals(valor).toArray()
      return results.length > 0 ? results[0] : null
    } catch {
      // Campo no indexado — filtrar en memoria
      const all = await database[tabla].toArray()
      const found = all.find((row) => String(row[campo]) === String(valor))
      return found || null
    }
  } catch (e) {
    console.error(`[OfflineDB] getCachedByField(${tabla}, ${campo}):`, e)
    return null
  }
}

/**
 * Reemplaza todos los registros de una tabla con el array dado.
 */
export async function saveCacheTable(tabla, records) {
  try {
    const database = getDB()
    if (!database[tabla]) return
    if (!Array.isArray(records)) return
    await database[tabla].clear()
    if (records.length > 0) {
      await database[tabla].bulkAdd(records)
    }
  } catch (e) {
    console.error(`[OfflineDB] saveCacheTable(${tabla}):`, e)
  }
}

/**
 * Inserta un registro en una tabla local.
 */
export async function insertOffline(tabla, data) {
  try {
    const database = getDB()
    if (!database[tabla]) return null
    return await database[tabla].add(data)
  } catch (e) {
    console.error(`[OfflineDB] insertOffline(${tabla}):`, e)
    return null
  }
}

/**
 * Encola una operación para sincronizar cuando vuelva el internet.
 */
export async function addToSyncQueue(tabla, action, data) {
  try {
    const database = getDB()
    return await database.sync_queue.add({
      tabla,
      action,
      data: typeof data === 'string' ? data : JSON.stringify(data),
      createdAt: Date.now()
    })
  } catch (e) {
    console.error('[OfflineDB] addToSyncQueue:', e)
    return null
  }
}

/**
 * Devuelve todas las operaciones pendientes de sincronizar.
 */
export async function getSyncQueue() {
  try {
    const database = getDB()
    return await database.sync_queue.toArray()
  } catch (e) {
    console.error('[OfflineDB] getSyncQueue:', e)
    return []
  }
}

/**
 * Elimina una entrada del sync_queue tras sincronizar exitosamente.
 */
export async function deleteSyncQueueItem(id) {
  try {
    const database = getDB()
    await database.sync_queue.delete(id)
  } catch (e) {
    console.error('[OfflineDB] deleteSyncQueueItem:', e)
  }
}

/**
 * Guarda un usuario completo con su contraseña hasheada en IndexedDB.
 * Útil para login offline.
 */
export async function guardarUsuarioOffline(usuario) {
  try {
    const database = getDB()
    if (!database.usuarios) return null

    // Verificar si ya existe
    const existente = await database.usuarios.where('email').equals(usuario.email).first()

    if (existente) {
      // Actualizar usuario existente
      await database.usuarios.update(existente.id, usuario)
      console.log('[OfflineDB] Usuario actualizado:', usuario.email)
      return existente.id
    } else {
      // Insertar nuevo usuario
      const id = await database.usuarios.add(usuario)
      console.log('[OfflineDB] Usuario guardado:', usuario.email)
      return id
    }
  } catch (e) {
    console.error('[OfflineDB] guardarUsuarioOffline:', e)
    return null
  }
}

/**
 * Guarda una factura offline cuando no hay internet.
 */
export async function guardarFacturaOffline(factura) {
  try {
    const database = getDB()
    if (!database.facturas_offline) return null

    factura.estado = 'pendiente_sincronizacion'
    factura.fecha_creacion_offline = Date.now()

    const id = await database.facturas_offline.add(factura)
    console.log('[OfflineDB] Factura guardada offline:', id)

    // Agregar a cola de sincronización
    await addToSyncQueue('facturas', 'insert', factura)

    return id
  } catch (e) {
    console.error('[OfflineDB] guardarFacturaOffline:', e)
    return null
  }
}

/**
 * Obtiene todas las facturas pendientes de sincronizar.
 */
export async function getFacturasPendientesSincronizacion() {
  try {
    const database = getDB()
    if (!database.facturas_offline) return []

    return await database.facturas_offline
      .where('estado')
      .equals('pendiente_sincronizacion')
      .toArray()
  } catch (e) {
    console.error('[OfflineDB] getFacturasPendientesSincronizacion:', e)
    return []
  }
}

/**
 * Sincroniza todas las facturas pendientes con el servidor.
 * Retorna el número de facturas sincronizadas exitosamente.
 */
export async function sincronizarFacturas(peticionesFn) {
  try {
    const facturas = await getFacturasPendientesSincronizacion()
    let sincronizadas = 0

    for (const factura of facturas) {
      try {
        // Usar la función de peticiones que pases
        const resultado = await peticionesFn('insertData', 'facturas', JSON.stringify(factura))

        if (resultado[0] === 'ok') {
          // Marcar como sincronizada
          const database = getDB()
          await database.facturas_offline.update(factura.id, {
            estado: 'sincronizada',
            fecha_sincronizacion: Date.now()
          })
          sincronizadas++
        }
      } catch (error) {
        console.error('[OfflineDB] Error sincronizando factura:', factura.id, error)
      }
    }

    console.log(`[OfflineDB] Sincronizadas ${sincronizadas}/${facturas.length} facturas`)
    return sincronizadas
  } catch (e) {
    console.error('[OfflineDB] sincronizarFacturas:', e)
    return 0
  }
}

/**
 * Limpia facturas ya sincronizadas.
 */
export async function limpiarFacturasSincronizadas() {
  try {
    const database = getDB()
    if (!database.facturas_offline) return 0

    const count = await database.facturas_offline
      .where('estado')
      .equals('sincronizada')
      .delete()

    console.log(`[OfflineDB] ${count} facturas sincronizadas eliminadas`)
    return count
  } catch (e) {
    console.error('[OfflineDB] limpiarFacturasSincronizadas:', e)
    return 0
  }
}

/**
 * Verifica si hay conexión a internet.
 */
export function hayInternet() {
  return navigator.onLine
}

/**
 * Obtiene el estado de sincronización del sistema.
 */
export async function getEstadoSincronizacion() {
  try {
    const database = getDB()
    const [pendientesSync, facturasPendientes, usuariosCached, productosCached] = await Promise.all([
      database.sync_queue.count(),
      database.facturas_offline ? database.facturas_offline.where('estado').equals('pendiente_sincronizacion').count() : 0,
      database.usuarios.count(),
      database.productos.count()
    ])

    return {
      online: hayInternet(),
      operacionesPendientes: pendientesSync,
      facturasPendientes: facturasPendientes,
      usuariosCached: usuariosCached,
      productosCached: productosCached,
      ultimoCache: localStorage.getItem('offline_cache_timestamp')
    }
  } catch (e) {
    console.error('[OfflineDB] getEstadoSincronizacion:', e)
    return {
      online: hayInternet(),
      operacionesPendientes: 0,
      facturasPendientes: 0,
      usuariosCached: 0,
      productosCached: 0,
      ultimoCache: null
    }
  }
}

/**
 * Busca productos en caché offline por diferentes criterios.
 */
export async function buscarProductosOffline(criterio, valor) {
  try {
    const database = getDB()
    if (!database.productos) return []

    // Si no hay criterio, devolver todos
    if (!criterio) {
      return await database.productos.toArray()
    }

    // Buscar por campo específico
    try {
      const results = await database.productos.where(criterio).equals(valor).toArray()
      return results
    } catch {
      // Si el campo no está indexado, buscar en memoria
      const all = await database.productos.toArray()
      return all.filter((prod) => String(prod[criterio]).toLowerCase().includes(String(valor).toLowerCase()))
    }
  } catch (e) {
    console.error('[OfflineDB] buscarProductosOffline:', e)
    return []
  }
}

/**
 * Obtiene un producto por código o nombre (búsqueda flexible).
 */
export async function getProductoOffline(busqueda) {
  try {
    const database = getDB()
    if (!database.productos) return null

    // Intentar buscar por código exacto
    let producto = await database.productos.where('codigo').equals(busqueda).first()
    if (producto) return producto

    // Intentar buscar por nombre (case insensitive)
    const todos = await database.productos.toArray()
    producto = todos.find(p =>
      p.nombre?.toLowerCase() === busqueda.toLowerCase() ||
      p.codigo?.toLowerCase() === busqueda.toLowerCase()
    )

    return producto || null
  } catch (e) {
    console.error('[OfflineDB] getProductoOffline:', e)
    return null
  }
}

/**
 * Carga masiva de datos en las tablas de caché.
 * Útil para sincronización inicial.
 */
export async function cargarDatosIniciales(datos) {
  try {
    const database = getDB()
    const resultados = {}

    for (const [tabla, registros] of Object.entries(datos)) {
      if (!database[tabla]) {
        console.warn(`[OfflineDB] Tabla ${tabla} no existe en IndexedDB`)
        continue
      }

      if (!Array.isArray(registros)) {
        console.warn(`[OfflineDB] Datos de ${tabla} no son un array`)
        continue
      }

      // Limpiar y recargar
      await database[tabla].clear()
      if (registros.length > 0) {
        await database[tabla].bulkAdd(registros)
      }

      resultados[tabla] = registros.length
      console.log(`[OfflineDB] ${tabla}: ${registros.length} registros cargados`)
    }

    // Actualizar timestamp de último caché
    localStorage.setItem('offline_cache_timestamp', Date.now())
    localStorage.setItem('offline_cache_tables', JSON.stringify(Object.keys(resultados)))

    return resultados
  } catch (e) {
    console.error('[OfflineDB] cargarDatosIniciales:', e)
    throw e
  }
}

/**
 * Obtiene registros de una tabla que cumplan con una condición.
 * Equivalente a WHERE campo = valor
 */
export async function getCachedByCondition(tabla, campo, valor) {
  try {
    const database = getDB()
    if (!database[tabla]) return []

    const all = await database[tabla].toArray()
    const valorNormalizado = String(valor).trim().toLowerCase()

    return all.filter((reg) => {
      const valorReg = String(reg[campo] || '').trim().toLowerCase()
      return valorReg === valorNormalizado
    })
  } catch (e) {
    console.error(`[OfflineDB] getCachedByCondition(${tabla}, ${campo}):`, e)
    return []
  }
}

/**
 * Obtiene datos de una tabla con opciones de búsqueda, filtrado y paginación.
 * Simula el comportamiento de getDataAsArrayLazy del servidor.
 */
export async function getDataAsArrayLazy(tabla, opciones = {}) {
  try {
    const database = getDB()
    if (!database[tabla]) {
      console.warn(`[OfflineDB] Tabla ${tabla} no existe en IndexedDB`)
      console.warn('[OfflineDB] Tablas disponibles:', Object.keys(database))
      return { data: [], total: 0 }
    }

    console.log(`[OfflineDB] getDataAsArrayLazy tabla: ${tabla}, opciones:`, opciones)

    const {
      limit = 20,
      offset = 0,
      search = '',
      searchFields = [],
      orderBy = 'id',
      orderDir = 'ASC',
      filtroCampo = '',
      filtroValor = '',
      filtros = [],
      stockMode = 'all'
    } = opciones

    // Obtener todos los registros de la tabla
    let registros = await database[tabla].toArray()

    // Aplicar filtro de campo simple
    if (filtroCampo && filtroValor) {
      registros = registros.filter((reg) => {
        const valorReg = String(reg[filtroCampo] || '').trim().toLowerCase()
        const valorBuscar = String(filtroValor).trim().toLowerCase()
        return valorReg === valorBuscar
      })
    }

    // Aplicar filtros múltiples
    if (Array.isArray(filtros) && filtros.length > 0) {
      filtros.forEach((filtro) => {
        if (filtro.campo && filtro.valor !== undefined) {
          registros = registros.filter((reg) => {
            const valorReg = String(reg[filtro.campo] || '').trim().toLowerCase()
            const valorBuscar = String(filtro.valor).trim().toLowerCase()
            return valorReg === valorBuscar || valorReg.includes(valorBuscar)
          })
        }
      })
    }

    // Aplicar filtro de stock
    if (stockMode !== 'all' && registros.length > 0 && 'cantidad' in registros[0]) {
      if (stockMode === 'with_stock') {
        registros = registros.filter((reg) => Number(reg.cantidad || 0) > 0)
      } else if (stockMode === 'no_stock') {
        registros = registros.filter((reg) => Number(reg.cantidad || 0) <= 0)
      }
    }

    // Aplicar búsqueda en múltiples campos
    if (search && searchFields.length > 0) {
      const termino = search.trim().toLowerCase()
      registros = registros.filter((reg) => {
        return searchFields.some((campo) => {
          const valor = String(reg[campo] || '').trim().toLowerCase()
          return valor.includes(termino)
        })
      })
    }

    // Total antes de paginación
    const total = registros.length

    // Ordenar
    if (orderBy) {
      registros.sort((a, b) => {
        const valorA = a[orderBy]
        const valorB = b[orderBy]

        // Manejo de diferentes tipos de datos
        let comparacion = 0
        if (typeof valorA === 'number' && typeof valorB === 'number') {
          comparacion = valorA - valorB
        } else {
          const strA = String(valorA || '').toLowerCase()
          const strB = String(valorB || '').toLowerCase()
          comparacion = strA.localeCompare(strB)
        }

        return orderDir.toUpperCase() === 'DESC' ? -comparacion : comparacion
      })
    }

    // Paginación
    const registrosPaginados = registros.slice(offset, offset + limit)

    const resultado = {
      data: registrosPaginados,
      total: total,
      limit: limit,
      offset: offset
    }

    console.log(
      `[OfflineDB] ✅ getDataAsArrayLazy ${tabla}: ${registrosPaginados.length}/${total} registros retornados`
    )
    console.log('[OfflineDB] Resultado:', resultado)

    return resultado
  } catch (e) {
    console.error(`[OfflineDB] ❌ Error en getDataAsArrayLazy(${tabla}):`, e)
    return { data: [], total: 0 }
  }
}
