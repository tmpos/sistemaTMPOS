import sqlite3 from 'sqlite3'
import path from 'path'
import { app } from 'electron'
import fs from 'fs'
import { execSync } from 'child_process'
import bcrypt from 'bcryptjs'
const axios = require('axios')
sqlite3.verbose()

// Ajustar la ruta de origen para apuntar correctamente al archivo database.db
const sourceDbPath = path.join(app.getAppPath(), 'resources', 'database.db')
const userDataPath = app.getPath('userData')
const destDbPath = path.join(userDataPath, 'database', 'database.db')

// Verificar si el directorio de destino existe
const databaseDir = path.join(userDataPath, 'database')
if (!fs.existsSync(databaseDir)) {
  fs.mkdirSync(databaseDir, { recursive: true })
}

function copyDatabaseIfNotExists() {
  try {
    console.log('Ruta de origen:', sourceDbPath)
    console.log('Ruta de destino:', destDbPath)

    // Verificar si el archivo de origen existe
    if (!fs.existsSync(sourceDbPath)) {
      console.error('El archivo de la base de datos no existe en la ruta de origen.')
      return
    }

    // Verificar si la base de datos ya existe en el destino
    if (!fs.existsSync(destDbPath)) {
      console.log('La base de datos no existe en el destino. Copiando...')
      fs.copyFileSync(sourceDbPath, destDbPath)
      console.log('Base de datos copiada exitosamente.')
    } else {
      console.log('La base de datos ya existe en el destino. No se copió.')
    }
  } catch (error) {
    console.error('Error al copiar la base de datos:', error)
  }
}

// Llamar a la función para copiar la base de datos
copyDatabaseIfNotExists()
// Configurar la conexión a la base de datos
const dbPath = path.join(app.getPath('userData'), 'databases', 'Databases.db')
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error al abrir la base de datos:', err.message)
  } else {
    console.log('Conectado a la base de datos SQLite en', dbPath)
  }
})

// Copiar la base de datos si no existe cuando la aplicación esté lista
app.whenReady().then(() => {
  //copyDatabaseIfNotExists();
})

// Configura el directorio de imágenes en userData

const imgDir = path.join(userDataPath, 'vista/img', 'productos')

// Crea el directorio si no existe
if (!fs.existsSync(imgDir)) {
  fs.mkdirSync(imgDir, { recursive: true })
}

export function crearDirectorio(nombre) {
  return new Promise((resolve, reject) => {
    try {
      // Obtener la ruta base `userDataPath`
      const userDataPath = app.getPath('userData')
      const dirPath = path.join(userDataPath, 'vista/img', nombre)

      // Verificar si el directorio ya existe; si no, crearlo recursivamente
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true })
        console.log(`Directorio creado: ${dirPath}`)
      } else {
        console.log(`El directorio ya existe: ${dirPath}`)
      }

      // Resolver con ['ok'] al finalizar exitosamente
      resolve(['ok'])
    } catch (error) {
      reject(['error', new Error(`No se pudo crear el directorio: ${error.message}`)])
    }
  })
}

export async function descargarImagen(imagenURL, nombreImagen) {
  try {
    // Obtiene la ruta de 'userData' y define el directorio de destino dentro de 'vista/img/productos'
    const userDataPath = app.getPath('userData')
    const imgDir = path.join(userDataPath, 'vista', 'img')
    const rutaDestino = path.join(imgDir, nombreImagen)

    // Crear el directorio si no existe
    if (!fs.existsSync(imgDir)) {
      fs.mkdirSync(imgDir, { recursive: true })
    }

    // Descarga de la imagen
    const response = await axios({
      url: imagenURL,
      method: 'GET',
      responseType: 'stream'
    })

    // Guardar la imagen en la ruta de destino
    const writer = fs.createWriteStream(rutaDestino)
    response.data.pipe(writer)

    return new Promise((resolve, reject) => {
      writer.on('finish', () => resolve(`Imagen descargada en ${rutaDestino}`))
      writer.on('error', reject)
    })
  } catch (error) {
    console.error('Error al descargar la imagen:', error)
    throw new Error('No se pudo descargar la imagen')
  }
}
// Función para crear una tabla
export async function creartabla(tabla, campos) {
  try {
    // Validación del nombre de la tabla
    if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(tabla)) {
      throw new Error('El nombre de la tabla contiene caracteres no válidos')
    }

    const fieldList = campos.split(',').map((field) => field.trim())
    let validFields = fieldList.filter((field) => /^[a-zA-Z_][a-zA-Z0-9_]* [a-zA-Z]+$/.test(field))

    if (validFields.length !== fieldList.length) {
      throw new Error('Uno o más campos contienen caracteres o formatos no válidos')
    }

    validFields = validFields.filter(
      (field) => !field.startsWith('created_at ') && !field.startsWith('updated_at ')
    )

    validFields.push('created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP')
    validFields.push('updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP')

    const query = `CREATE TABLE IF NOT EXISTS ${tabla} (
      id INTEGER PRIMARY KEY AUTOINCREMENT, 
      ${validFields.join(', ')}
    )`

    await createTable(query)

    console.log('Tabla creada o ya existe')
    return { success: true, message: `Tabla ${tabla} creada o ya existe.` }
  } catch (err) {
    console.error('Error creando la tabla:', err)
    return { success: false, message: 'Error creando la tabla', error: err.message }
  }
}

// Función para ejecutar una consulta de creación de tabla
export function createTable(query) {
  return new Promise((resolve, reject) => {
    db.run(query, (err) => {
      if (err) reject(['error'])
      else resolve()
    })
  })
}

// Función para traer todos los datos de una tabla
export function getAllRows(tabla) {
  return new Promise((resolve, reject) => {
    const query = `SELECT * FROM ${tabla}`
    db.all(query, [], (err, rows) => {
      if (err) {
        reject(['error'])
      } else {
        resolve(rows)
      }
    })
  })
}

// Función para consultar por un campo específico
export function getRowsByField(tabla, field, value) {
  return new Promise((resolve, reject) => {
    const query = `SELECT * FROM ${tabla} WHERE ${field} = ?`
    db.all(query, [value], (err, rows) => {
      if (err) {
        reject(['error'])
      } else {
        resolve(rows)
      }
    })
  })
}

// Función para traer las últimas X filas
export function getLastXRows(tabla, x) {
  return new Promise((resolve, reject) => {
    const query = `SELECT * FROM ${tabla} ORDER BY id DESC LIMIT ?`
    db.all(query, [x], (err, rows) => {
      if (err) {
        reject(['error'])
      } else {
        resolve(rows)
      }
    })
  })
}

// Función para obtener filas por fecha en un campo específico (created_at o updated_at)
export function getRowsByDate(tabla, campo, fecha) {
  return new Promise((resolve, reject) => {
    const query = `SELECT * FROM ${tabla} WHERE DATE(${campo}) = ?`
    db.all(query, [fecha], (err, rows) => {
      if (err) {
        reject(['error'])
      } else {
        resolve(rows)
      }
    })
  })
}

//esta funcion para restar stock
export function restarStock(id, diferencia) {
  console.log('id', id)
  console.log('diferencia', diferencia)
  return new Promise((resolve, reject) => {
    // Validar que `id` y `diferencia` sean números
    if (isNaN(id) || isNaN(diferencia)) {
      return reject(['error'])
    }

    // Convertir a números enteros
    id = parseInt(id)
    diferencia = parseInt(diferencia)

    // Iniciar una transacción
    db.serialize(() => {
      db.get('SELECT stock FROM productos WHERE id = ?', [id], (err, row) => {
        if (err) {
          return reject(['error'])
        }

        if (!row) {
          return reject(['error'])
        }

        const stockActual = row.stock
        const nuevoStock = Number(stockActual) - diferencia

        /*        if (nuevoStock < 0) {
          return reject(['error']);
        }*/

        // Actualizar el stock en la base de datos
        db.run('UPDATE productos SET stock = ? WHERE id = ?', [nuevoStock, id], (err) => {
          if (err) {
            return reject(['error'])
          }
          resolve(['ok'])
        })
      })
    })
  })
}

// Función para obtener filas en un rango de timestamp
export function getRowsByTimestampRange(tabla, campo, fechaInicio, fechaFin) {
  return new Promise((resolve, reject) => {
    const query = `SELECT * FROM ${tabla} WHERE ${campo} BETWEEN ? AND ?`
    db.all(query, [fechaInicio, fechaFin], (err, rows) => {
      if (err) {
        reject(['error'])
      } else {
        resolve(rows)
      }
    })
  })
}

// Función para obtener datos de ventas de múltiples tablas en un rango de fechas
export async function getSalesDataByRange(fechaInicio, fechaFin) {
  const tablas = ['gastos', 'entradas', 'devoluciones', 'registrocaja', 'facturas']
  const tablasUpdated = ['devoluciones', 'taller', 'cuentas_cobrar']
  const datos = {}

  try {
    // Obtener datos usando el campo 'created_at' en cada tabla del primer conjunto
    for (const tabla of tablas) {
      datos[tabla] = await getRowsByTimestampRange(tabla, 'created_at', fechaInicio, fechaFin)
    }

    // Obtener datos usando el campo 'updated_at' en cada tabla del segundo conjunto
    for (const tabla of tablasUpdated) {
      datos[tabla] = await getRowsByTimestampRange(tabla, 'updated_at', fechaInicio, fechaFin)
      console.log('datos[tabla]', datos[tabla])
    }

    return datos
  } catch (err) {
    console.error('Error obteniendo datos de ventas:', err)
    throw new Error('Error al obtener datos de ventas por rango.')
  }
}

// Función para obtener todos los datos de una tabla
export function getAllData(tabla) {
  return new Promise((resolve, reject) => {
    const query = `SELECT * FROM ${tabla}`
    db.all(query, [], (err, rows) => {
      if (err) {
        reject(['error'])
      } else {
        // Si solo hay un resultado, retorna ese registro
        if (rows.length === 1) {
          resolve(rows[0])
        } else {
          resolve(rows)
        }
      }
    })
  })
}

// Función para obtener el array de datos con enlaces a imágenes
export async function datosArrayPostConImg(tabla, baseUrl) {
  return new Promise((resolve, reject) => {
    const query = `SELECT * FROM ${tabla}`

    db.all(query, [], (err, rows) => {
      if (err) {
        reject(['error'])
      } else {
        const result = rows.map((row) => {
          const imagenDir = path.join(__dirname, '../vista/img/productos', row.imagen)
          const imagenLink = getImages(imagenDir)

          row.imagen =
            imagenLink && imagenLink.length > 0
              ? `${baseUrl}/vista/img/productos/${row.imagen}/${imagenLink[0]}`
              : `${baseUrl}/vista/img/box.png`

          return row
        })

        resolve(result)
      }
    })
  })
}

// Función auxiliar para obtener el nombre del primer archivo de imagen en el directorio
function getImages(dir) {
  try {
    const files = fs.readdirSync(dir)
    return files.filter((file) => /\.(jpg|jpeg|png|gif|webp)$/i.test(file))
  } catch (error) {
    console.error('Error leyendo el directorio de imágenes:', error)
    return null
  }
}

export function obtenerImagenesDeDirectorio(dir) {
  // Construir la ruta completa del directorio de imágenes
  const directorio = path.join(app.getPath('appData'), 'tm-pos', 'vista', 'img', dir)

  return new Promise((resolve, reject) => {
    fs.readdir(directorio, (err, archivos) => {
      if (err) {
        console.error('Error al leer el directorio:', err)
        reject(new Error(`No se pudo leer el directorio: ${err.message}`))
        return
      }

      // Filtrar solo archivos con extensiones de imagen y construir la ruta completa
      const imagenes = archivos
        .filter((archivo) => {
          const extension = path.extname(archivo).toLowerCase()
          return ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'].includes(extension)
        })
        .map((archivo) => `${path.join(directorio, archivo)}`) // Convertir a ruta completa accesible desde el frontend

      resolve(imagenes)
    })
  })
}

// Función para obtener todos los datos de una tabla como un array
export function getDataAsArray(tabla) {
  return new Promise((resolve, reject) => {
    const query = `SELECT * FROM ${tabla}`
    db.all(query, [], (err, rows) => {
      if (err) {
        reject(['error'])
      } else {
        resolve(rows) // Devuelve siempre como array
      }
    })
  })
}

// Función para obtener los nombres de los campos de una tabla en SQLite
export function getTableColumns(tabla) {
  return new Promise((resolve, reject) => {
    const query = `PRAGMA table_info(${tabla})`
    db.all(query, [], (err, rows) => {
      if (err) {
        reject(['error'])
      } else {
        const columns = rows.map((row) => row.name) // Extrae solo los nombres de las columnas
        resolve(columns)
      }
    })
  })
}

// Función para verificar si una tabla existe
export function tableExists(tabla) {
  return new Promise((resolve, reject) => {
    const query = `SELECT name FROM sqlite_master WHERE type='table' AND name=?`

    db.get(query, [tabla], (err, row) => {
      if (err) {
        reject(['error']) // Error en la consulta
      } else if (row) {
        resolve(['ok'])
      } else {
        resolve(['error'])
      }
    })
  })
}

export function clearTable(tabla) {
  return new Promise((resolve, reject) => {
    // Borrar el contenido de la tabla
    const deleteQuery = `DELETE FROM ${tabla}`
    db.run(deleteQuery, (err) => {
      if (err) {
        reject(['error al borrar contenido'])
      } else {
        // Reiniciar el contador de IDs (para una columna autoincremental)
        const resetIdQuery = `DELETE FROM sqlite_sequence WHERE name=?`
        db.run(resetIdQuery, [tabla], (err) => {
          if (err) {
            reject(['error al reiniciar el ID'])
          } else {
            resolve(['contenido borrado y ID reiniciado'])
          }
        })
      }
    })
  })
}

// Función para verificar si una tabla existe y eliminarla si es así
export function dropTable(tabla) {
  return new Promise((resolve, reject) => {
    // Verificar si la tabla existe
    const checkQuery = `SELECT name FROM sqlite_master WHERE type='table' AND name=?`
    db.get(checkQuery, [tabla], (err, row) => {
      if (err) {
        reject(['error'])
      } else if (!row) {
        // La tabla no existe
        resolve({ message: 'La tabla no existe.' })
      } else {
        // La tabla existe, proceder a eliminarla
        const dropQuery = `DROP TABLE ${tabla}`
        db.run(dropQuery, (err) => {
          if (err) {
            reject(['error'])
          } else {
            resolve(['ok'])
          }
        })
      }
    })
  })
}

export function findDuplicates(tabla, campo) {
  return new Promise((resolve, reject) => {
    const query = `SELECT ${campo}, COUNT(*) as count FROM ${tabla} GROUP BY ${campo} HAVING count > 1`
    db.all(query, [], (err, rows) => {
      if (err) {
        reject(['error'])
      } else {
        resolve(rows) // Devuelve las filas con valores duplicados
      }
    })
  })
}

export function getDataByField(tabla, campo, valor) {
  return new Promise((resolve, reject) => {
    const query = `SELECT * FROM ${tabla} WHERE ${campo} = ?`
    db.get(query, [valor], (err, row) => {
      if (err) {
        reject(['error'])
      } else {
        resolve(row || {}) // Devuelve el objeto de la fila o un objeto vacío si no hay resultados
      }
    })
  })
}

export function getDataByCondition(tabla, campo, valor) {
  return new Promise((resolve, reject) => {
    const query = `SELECT * FROM ${tabla} WHERE ${campo} = ?`
    db.all(query, [valor], (err, rows) => {
      if (err) {
        reject(['error'])
      } else {
        // Devuelve el primer objeto si hay solo uno, o un array de objetos si hay múltiples resultados
        resolve(rows.length === 1 ? rows[0] : rows)
      }
    })
  })
}

// Función para obtener el último registro que cumple una condición específica
export function getLastDataByCondition(tabla, campo, valor) {
  return new Promise((resolve, reject) => {
    const query = `SELECT * FROM ${tabla} WHERE ${campo} = ? ORDER BY id DESC LIMIT 1`
    db.get(query, [valor], (err, row) => {
      if (err) {
        reject(['error'])
      } else {
        resolve(row) // Devuelve el último registro que coincide
      }
    })
  })
}

// Función para obtener datos específicos de campos en una tabla
export function getDataByFields(tabla, campos) {
  return new Promise((resolve, reject) => {
    const query = `SELECT ${campos} FROM ${tabla}`
    db.all(query, [], (err, rows) => {
      if (err) {
        reject(['error'])
      } else {
        // Devuelve un solo objeto si solo hay un resultado, o un array de objetos si hay múltiples
        resolve(rows.length === 1 ? rows[0] : rows)
      }
    })
  })
}

export function authenticateUser(tabla, email, password) {
  return new Promise((resolve, reject) => {
    const query = `SELECT * FROM ${tabla} WHERE email = ?`
    db.get(query, [email], (err, userData) => {
      if (err) {
        reject(['error'])
      } else if (userData) {
        // Verifica la contraseña usando bcryptjs.compare
        bcrypt.compare(password, userData.password, (err, passwordMatch) => {
          if (err) {
            reject(['error'])
          } else if (passwordMatch) {
            //resolve(userData); // Credenciales válidas
            resolve([userData.nombre, userData.imagen, userData.nivel_seguridad]) // Credenciales válidas
          } else {
            resolve(null) // Contraseña incorrecta
          }
        })
      } else {
        resolve(null) // Usuario no encontrado
      }
    })
  })
}
// Función para desbloquear al usuario después de verificar la respuesta de seguridad
export function unlockUser(email, pregunta, respuesta) {
  return new Promise((resolve, reject) => {
    const selectQuery = `SELECT * FROM usuarios WHERE email = ?`
    db.get(selectQuery, [email], (err, user) => {
      if (err) {
        reject(['error'])
      } else if (user && user.respuesta === respuesta) {
        // Si la respuesta coincide, actualizar intentos_login y estado
        const updateQuery = `UPDATE usuarios SET intentos_login = 0, estado = 'Activado' WHERE id = ?`
        db.run(updateQuery, [user.id], (err) => {
          if (err) {
            reject(['error'])
          } else {
            resolve(user) // Devuelve el usuario desbloqueado
          }
        })
      } else {
        resolve(null) // La respuesta de seguridad es incorrecta
      }
    })
  })
}

// Función para reiniciar el campo de ID en una tabla SQLite
export function resetAutoIncrementField(tabla) {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // Crear una tabla temporal sin el campo ID
      db.run(`CREATE TABLE ${tabla}_temp AS SELECT * FROM ${tabla} WHERE 1=0`, (err) => {
        if (err) return reject(['error'])

        // Copiar datos sin el campo ID
        db.run(`INSERT INTO ${tabla}_temp SELECT * FROM ${tabla}`, (err) => {
          if (err) return reject(['error'])

          // Eliminar la tabla original
          db.run(`DROP TABLE ${tabla}`, (err) => {
            if (err) return reject(['error'])

            // Renombrar la tabla temporal al nombre original
            db.run(`ALTER TABLE ${tabla}_temp RENAME TO ${tabla}`, (err) => {
              if (err) return reject(['error'])

              // Reiniciar la secuencia de AUTOINCREMENT para el campo ID
              db.run(`DELETE FROM sqlite_sequence WHERE name='${tabla}'`, (err) => {
                if (err) return reject(['error'])

                resolve(['ok'])
              })
            })
          })
        })
      })
    })
  })
}

export function addColumnToTable(tabla, campo, tipo = 'TEXT') {
  return new Promise((resolve, reject) => {
    // Definimos el tipo de dato con un valor predeterminado explícito si es NOT NULL
    const fieldType =
      tipo === 'TIMESTAMP' ? 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP' : 'TEXT NOT NULL DEFAULT ""'

    const query = `ALTER TABLE "${tabla}" ADD COLUMN "${campo}" ${fieldType}`

    db.run(query, (err) => {
      if (err) {
        reject([err.message || 'Error desconocido'])
      } else {
        resolve(['ok'])
      }
    })
  })
}

// Función para agregar una columna antes de otra en SQLite
export function addColumnBefore(tabla, campoNuevo, campoAntesDe, tipoNuevoCampo = 'TEXT') {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // Obtener la estructura de la tabla actual
      db.all(`PRAGMA table_info(${tabla})`, [], (err, columns) => {
        if (err) return reject(['error'])

        // Construir la lista de columnas y definir el nuevo orden de columnas
        const columnNames = columns.map((col) => col.name)
        const newColumns = []

        columnNames.forEach((col) => {
          if (col === campoAntesDe) newColumns.push(`${campoNuevo} ${tipoNuevoCampo}`)
          newColumns.push(col)
        })

        const columnsForSelect = columnNames
          .map((col) => (col === campoAntesDe ? `${campoNuevo}, ${col}` : col))
          .join(', ')

        // Crear una tabla temporal con la nueva estructura
        const createTableSQL = `CREATE TABLE ${tabla}_temp (${newColumns.join(', ')})`
        db.run(createTableSQL, (err) => {
          if (err) return reject(['error'])

          // Insertar datos en la tabla temporal con las columnas en el nuevo orden
          const insertSQL = `INSERT INTO ${tabla}_temp SELECT ${columnsForSelect} FROM ${tabla}`
          db.run(insertSQL, (err) => {
            if (err) return reject(['error'])

            // Eliminar la tabla original y renombrar la temporal
            db.run(`DROP TABLE ${tabla}`, (err) => {
              if (err) return reject(['error'])

              db.run(`ALTER TABLE ${tabla}_temp RENAME TO ${tabla}`, (err) => {
                if (err) return reject(['error'])
                resolve(['ok'])
              })
            })
          })
        })
      })
    })
  })
}

export function addColumnAfter(tabla, campoNuevo, campoDespuesDe, tipoNuevoCampo = 'TEXT') {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // Obtener la estructura de la tabla actual
      db.all(`PRAGMA table_info("${tabla}")`, [], (err, columns) => {
        if (err) return reject(['Error al obtener la estructura de la tabla:', err.message])

        // Comprobar si la columna nueva ya existe
        const columnNames = columns.map((col) => col.name)
        if (columnNames.includes(campoNuevo)) {
          return reject([`La columna "${campoNuevo}" ya existe en la tabla "${tabla}"`])
        }

        // Verificar si la columna de referencia (campoDespuesDe) existe
        if (!columnNames.includes(campoDespuesDe)) {
          return reject([`La columna "${campoDespuesDe}" no existe en la tabla "${tabla}"`])
        }

        // Crear las definiciones de las columnas para la tabla temporal
        const newColumns = columns.map((col) => `"${col.name}" ${col.type}`)

        // Insertar la nueva columna en la posición deseada
        const position = columnNames.indexOf(campoDespuesDe) + 1
        newColumns.splice(position, 0, `"${campoNuevo}" ${tipoNuevoCampo} DEFAULT NULL`)

        // Crear una tabla temporal con la nueva estructura
        const createTableSQL = `CREATE TABLE "${tabla}_temp" (${newColumns.join(', ')})`
        db.run(createTableSQL, (err) => {
          if (err) return reject(['Error al crear la tabla temporal:', err.message])

          // Insertar datos en la tabla temporal, incluyendo la nueva columna con valor NULL
          const columnsForSelect =
            columnNames.map((name) => `"${name}"`).join(', ') + `, NULL AS "${campoNuevo}"`
          const insertSQL = `INSERT INTO "${tabla}_temp" SELECT ${columnsForSelect} FROM "${tabla}"`
          db.run(insertSQL, (err) => {
            if (err) return reject(['Error al copiar datos a la tabla temporal:', err.message])

            // Eliminar la tabla original y renombrar la temporal
            db.run(`DROP TABLE "${tabla}"`, (err) => {
              if (err) return reject(['Error al eliminar la tabla original:', err.message])

              db.run(`ALTER TABLE "${tabla}_temp" RENAME TO "${tabla}"`, (err) => {
                if (err) return reject(['Error al renombrar la tabla temporal:', err.message])
                resolve(['ok'])
              })
            })
          })
        })
      })
    })
  })
}

export function addColumnToEnd(tabla, campo, tipo = 'TEXT') {
  return new Promise((resolve, reject) => {
    const campos = campo.includes(',') ? campo.split(',').map((c) => c.trim()) : [campo]

    db.all(`PRAGMA table_info("${tabla}")`, [], (err, columns) => {
      if (err) return reject(['Error al obtener la estructura de la tabla:', err.message])

      const existingColumns = columns.map((col) => col.name)
      const camposParaAgregar = campos.filter((campo) => !existingColumns.includes(campo))

      // Si no hay columnas para agregar, resolver la promesa inmediatamente
      if (camposParaAgregar.length === 0) {
        return resolve(['No hay columnas nuevas para agregar'])
      }

      // Construir y ejecutar consultas para cada columna que no existe
      const queries = camposParaAgregar.map((campo) => {
        const fieldType =
          tipo === 'TIMESTAMP' ? 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP' : 'TEXT NOT NULL""'
        return `ALTER TABLE "${tabla}" ADD COLUMN "${campo}" ${fieldType}`
      })

      // Ejecutar cada consulta en serie
      db.serialize(() => {
        for (const query of queries) {
          db.run(query, (err) => {
            if (err) return reject(['Error al agregar columna:', err.message])
          })
        }
        resolve(['ok'])
      })
    })
  })
}

export function deleteColumnFromTable(tabla, campoAEliminar) {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // Obtener la estructura de la tabla actual
      db.all(`PRAGMA table_info(${tabla})`, [], (err, columns) => {
        if (err) return reject(['Error al obtener la estructura de la tabla:', err.message])

        // Filtrar para obtener todas las columnas excepto la que queremos eliminar
        const columnsToKeep = columns.filter((col) => col.name !== campoAEliminar)
        if (columnsToKeep.length === columns.length) {
          return reject([`La columna "${campoAEliminar}" no existe en la tabla "${tabla}"`])
        }

        const columnDefinitions = columnsToKeep.map((col) => `${col.name} ${col.type}`)
        const columnsForSelect = columnsToKeep.map((col) => col.name).join(', ')

        // Crear una tabla temporal sin la columna que queremos eliminar
        const createTableSQL = `CREATE TABLE "${tabla}_temp" (${columnDefinitions.join(', ')})`
        db.run(createTableSQL, (err) => {
          if (err) return reject(['Error al crear la tabla temporal:', err.message])

          // Copiar datos de la tabla original a la temporal, excluyendo la columna eliminada
          const insertSQL = `INSERT INTO "${tabla}_temp" SELECT ${columnsForSelect} FROM "${tabla}"`
          db.run(insertSQL, (err) => {
            if (err) return reject(['Error al copiar datos a la tabla temporal:', err.message])

            // Eliminar la tabla original
            db.run(`DROP TABLE "${tabla}"`, (err) => {
              if (err) return reject(['Error al eliminar la tabla original:', err.message])

              // Renombrar la tabla temporal a la original
              db.run(`ALTER TABLE "${tabla}_temp" RENAME TO "${tabla}"`, (err) => {
                if (err) return reject(['Error al renombrar la tabla temporal:', err.message])
                resolve(['ok'])
              })
            })
          })
        })
      })
    })
  })
}

export function dropColumnFromTable(tabla, campo) {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      db.all(`PRAGMA table_info(${tabla})`, [], (err, columns) => {
        if (err) return reject(['error'])

        const remainingColumns = columns
          .filter((col) => col.name !== campo)
          .map((col) => `${col.name} ${col.type}`)

        const columnsForInsert = columns
          .filter((col) => col.name !== campo)
          .map((col) => col.name)
          .join(', ')

        const createTableSQL = `CREATE TABLE ${tabla}_temp (${remainingColumns.join(', ')})`
        db.run(createTableSQL, (err) => {
          if (err) return reject(['error'])

          const insertSQL = `INSERT INTO ${tabla}_temp SELECT ${columnsForInsert} FROM ${tabla}`
          db.run(insertSQL, (err) => {
            if (err) return reject(['error'])

            db.run(`DROP TABLE ${tabla}`, (err) => {
              if (err) return reject(['error'])

              db.run(`ALTER TABLE ${tabla}_temp RENAME TO ${tabla}`, (err) => {
                if (err) return reject(['error'])

                resolve(['ok'])
              })
            })
          })
        })
      })
    })
  })
}

export function updateEntireColumn(tabla, campo, nuevoValor) {
  return new Promise((resolve, reject) => {
    const query = `UPDATE ${tabla} SET ${campo} = ?`
    db.run(query, [nuevoValor], (err) => {
      if (err) {
        reject(['error'])
      } else {
        resolve(['ok'])
      }
    })
  })
}

export function getDataByDoubleCondition(tabla, campo1, valor1, campo2, valor2) {
  return new Promise((resolve, reject) => {
    const query = `SELECT * FROM ${tabla} WHERE ${campo1} = ? AND ${campo2} = ?`
    db.all(query, [valor1, valor2], (err, rows) => {
      if (err) {
        reject(['error'])
      } else {
        resolve(rows) // Devuelve un array de objetos
      }
    })
  })
}

export function getDataByColumn(tabla, campo) {
  return new Promise((resolve, reject) => {
    const query = `SELECT ${campo} FROM ${tabla}`
    db.all(query, [], (err, rows) => {
      if (err) {
        reject(['error'])
      } else {
        resolve(rows) // Devuelve un array de objetos con el campo solicitado
      }
    })
  })
}

export function getAllTables() {
  return new Promise((resolve, reject) => {
    const query = `SELECT name FROM sqlite_master WHERE type='table'`
    db.all(query, [], (err, tables) => {
      if (err) {
        reject(['error'])
      } else {
        const tableNames = tables.map((table) => table.name)
        resolve(tableNames) // Devuelve un array con los nombres de las tablas
      }
    })
  })
}

export function insertData(tabla, data) {
  return new Promise((resolve, reject) => {
    const campos = Object.keys(data).join(', ')
    const placeholders = Object.keys(data)
      .map(() => '?')
      .join(', ')
    const valores = Object.values(data)

    const query = `INSERT INTO ${tabla} (${campos}) VALUES (${placeholders})`
    db.run(query, valores, function (err) {
      if (err) {
        reject(['error'])
      } else {
        resolve(['ok'])
      }
    })
  })
}

export function updateSingleField(tabla, campo, valor, id) {
  return new Promise((resolve, reject) => {
    const query = `UPDATE ${tabla} SET ${campo} = ? WHERE id = ?`
    db.run(query, [valor, id], function (err) {
      if (err) {
        reject(['error'])
      } else {
        resolve(['ok'])
      }
    })
  })
}

export function updateMultipleFields(tabla, data, id) {
  return new Promise((resolve, reject) => {
    const campos = Object.keys(data)
      .map((campo) => `${campo} = ?`)
      .join(', ')
    const valores = [...Object.values(data), id]

    const query = `UPDATE ${tabla} SET ${campos} WHERE id = ?`
    db.run(query, valores, function (err) {
      if (err) {
        reject(['error'])
      } else {
        resolve(['ok'])
      }
    })
  })
}

export function deleteEntry(tabla, id) {
  return new Promise((resolve, reject) => {
    const query = `DELETE FROM ${tabla} WHERE id = ?`
    db.run(query, [id], function (err) {
      if (err) {
        reject(['error'])
      } else {
        resolve(['ok'])
      }
    })
  })
}

export function deleteByField(tabla, campo, valor) {
  return new Promise((resolve, reject) => {
    const query = `DELETE FROM ${tabla} WHERE ${campo} = ?`
    db.run(query, [valor], function (err) {
      if (err) {
        reject(['error'])
      } else {
        resolve(['ok'])
      }
    })
  })
}

export function deleteAll(tabla) {
  return new Promise((resolve, reject) => {
    const query = `DELETE FROM ${tabla}`
    db.run(query, function (err) {
      if (err) {
        reject(['error'])
      } else {
        resolve(['ok'])
      }
    })
  })
}

export function countRecords(tabla) {
  return new Promise((resolve, reject) => {
    const query = `SELECT COUNT(*) AS total FROM ${tabla}`
    db.get(query, [], (err, row) => {
      if (err) {
        reject(['error'])
      } else {
        resolve({ total: row.total })
      }
    })
  })
}

export function getMaxValue(tabla, campo) {
  return new Promise((resolve, reject) => {
    const query = `SELECT ${campo} FROM ${tabla} ORDER BY id DESC LIMIT 1`
    db.get(query, [], (err, row) => {
      if (err) {
        reject(['error'])
      } else {
        resolve(row ? row[campo] : '0000')
      }
    })
  })
}

// Función para codificar una contraseña usando bcrypt
export function hashPassword(password) {
  return new Promise((resolve, reject) => {
    try {
      const hashedPassword = require('bcrypt').hashSync(password, 10) // 10 es el número de "salt rounds"
      resolve(hashedPassword)
    } catch (error) {
      reject('Error al codificar la contraseña')
    }
  })
}

// Función para obtener las imágenes de un directorio
export function getImagesFromDirectory(dir) {
  return new Promise((resolve, reject) => {
    try {
      const files = fs.readdirSync(dir)
      const images = files.filter(
        (file) =>
          fs.statSync(path.join(dir, file)).isFile() && /\.(jpg|jpeg|png|gif|webp)$/i.test(file)
      )

      // Si no hay imágenes, devuelve una imagen por defecto
      if (images.length === 0) {
        resolve(['box.png'])
      } else {
        resolve(images)
      }
    } catch (error) {
      reject(error)
    }
  })
}

// Función para subir una imagen a un directorio
export function uploadImage(ruta, tempFilePath, fileName) {
  return new Promise((resolve, reject) => {
    // Crear el directorio si no existe
    if (!fs.existsSync(ruta)) {
      fs.mkdirSync(ruta, { recursive: true })
    }

    const destination = path.join(ruta, fileName)

    // Mover el archivo al destino
    fs.rename(tempFilePath, destination, (err) => {
      if (err) {
        reject('Error al mover el archivo')
      } else {
        resolve({ message: 'Imagen subida correctamente' })
      }
    })
  })
}

// Función para eliminar un archivo de una ruta específica
export function deleteFile(rutaCompleta) {
  return new Promise((resolve, reject) => {
    if (fs.existsSync(rutaCompleta)) {
      fs.unlink(rutaCompleta, (err) => {
        if (err) {
          reject('Error al eliminar el archivo')
        } else {
          resolve({ message: 'Archivo eliminado correctamente' })
        }
      })
    } else {
      reject('El archivo no existe')
    }
  })
}

// Función para crear un directorio
export function createDirectory(ruta) {
  return new Promise((resolve, reject) => {
    if (!fs.existsSync(ruta)) {
      fs.mkdir(ruta, { recursive: true }, (err) => {
        if (err) {
          reject('Error al crear el directorio')
        } else {
          resolve(['ok'])
        }
      })
    } else {
      reject('El directorio ya existe')
    }
  })
}

// Función para eliminar un directorio
export function deleteDirectory(ruta) {
  return new Promise((resolve, reject) => {
    if (fs.existsSync(ruta)) {
      fs.rmdir(ruta, { recursive: true }, (err) => {
        if (err) {
          reject('Error al eliminar el directorio')
        } else {
          resolve(['ok'])
        }
      })
    } else {
      reject('El directorio no existe')
    }
  })
}

// Función para obtener el listado de impresoras según el sistema operativo
export function getPrinters() {
  return new Promise((resolve, reject) => {
    try {
      const impresoras = []
      const os = process.platform

      if (os === 'win32') {
        // Comando para Windows
        const output = execSync('wmic printer get name').toString()
        const lines = output.split('\n').slice(1) // Ignora la primera línea
        lines.forEach((line) => {
          const trimmedLine = line.trim()
          if (trimmedLine) impresoras.push(trimmedLine)
        })
      } else if (os === 'linux' || os === 'darwin') {
        // darwin es el nombre de plataforma para macOS
        // Comando para Linux y macOS
        const output = execSync('lpstat -p').toString()
        const lines = output.split('\n')
        lines.forEach((line) => {
          const printerName = line.split(' ')[1]
          if (printerName && !line.includes('paused')) {
            impresoras.push(printerName)
          }
        })
      } else {
        reject('Sistema operativo no compatible')
      }

      resolve(impresoras)
    } catch (error) {
      reject('Error al obtener el listado de impresoras: ' + error.message)
    }
  })
}

// Función para cerrar la conexión a la base de datos cuando se cierre la app
app.on('before-quit', () => {
  db.close((err) => {
    if (err) {
      console.error('Error al cerrar la base de datos:', err.message)
    } else {
      console.log('Conexión a la base de datos cerrada.')
    }
  })
})
