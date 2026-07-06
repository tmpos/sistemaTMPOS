import axios from 'axios'
import bcrypt from 'bcryptjs'
/*import CryptoJS from 'crypto-js';*/
import { useRouter, useRoute } from 'vue-router'
import {
  getCachedTable,
  getCachedByField,
  getCachedByCondition,
  insertOffline,
  addToSyncQueue,
  initOfflineDB,
  getDataAsArrayLazy
} from '../composables/useOfflineDB'
/*import semver from 'semver';*/
//import { useToast } from "primevue/usetoast";
//const toast = useToast();
/******************************************************/
export function datosLocalStorage(peticion) {
  const dLocalStorage = JSON.parse(window.localStorage.getItem(peticion)) || {
    error: 'No hay datos'
  }
  return dLocalStorage
}
/******************************************************/
export const TABLAS_LOCALSTORAGE = [
  'empresa',
  'usuarios',
  'configuracion',
  'configuracionfactura',
  'metodopago',
  'theme',
  'tabladefault',
  'barcode',
  'printerconfig',
  'datos_config',
  'configuracion_correo'
]

const PREFIJO_CACHE_TABLA = 'cache_tabla_estatica_'
const TABLAS_LOCALSTORAGE_SET = new Set(TABLAS_LOCALSTORAGE)

const normalizarNombreTabla = (tabla = '') => String(tabla || '').toLowerCase().trim()

export function esTablaLocalStorage(tabla) {
  return TABLAS_LOCALSTORAGE_SET.has(normalizarNombreTabla(tabla))
}

const keyTablaLocalStorage = (tabla) => `${PREFIJO_CACHE_TABLA}${normalizarNombreTabla(tabla)}`

export function guardarTablaLocalStorage(tabla, registros) {
  if (!esTablaLocalStorage(tabla) || !Array.isArray(registros)) return false
  try {
    window.localStorage.setItem(
      keyTablaLocalStorage(tabla),
      JSON.stringify({
        tabla: normalizarNombreTabla(tabla),
        updatedAt: new Date().toISOString(),
        registros
      })
    )
    return true
  } catch (error) {
    console.error(`Error guardando ${tabla} en localStorage:`, error)
    return false
  }
}

export function obtenerTablaLocalStorage(tabla) {
  if (!esTablaLocalStorage(tabla)) return null
  try {
    const raw = window.localStorage.getItem(keyTablaLocalStorage(tabla))
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed)) return parsed
    if (Array.isArray(parsed?.registros)) return parsed.registros
    return null
  } catch (error) {
    console.error(`Error leyendo ${tabla} desde localStorage:`, error)
    return null
  }
}

export function invalidarTablaLocalStorage(tabla) {
  if (!esTablaLocalStorage(tabla)) return
  try {
    window.localStorage.removeItem(keyTablaLocalStorage(tabla))
  } catch (error) {
    console.error(`Error invalidando cache local de ${tabla}:`, error)
  }
}

const coincideValorCache = (valorA, valorB) => String(valorA ?? '') === String(valorB ?? '')

const leerRespuestaLocalStorage = (peticion, tabla, datos = []) => {
  if (!esTablaLocalStorage(tabla)) return { disponible: false, valor: null }
  const registros = obtenerTablaLocalStorage(tabla)
  if (!Array.isArray(registros)) return { disponible: false, valor: null }

  switch (peticion) {
    case 'getDataAsArray':
    case 'getAllData':
      return { disponible: true, valor: registros }

    case 'getDataByField': {
      const [campo, valor] = datos
      if (!campo || valor == null) return { disponible: false, valor: null }
      const registro = registros.find((item) => coincideValorCache(item?.[campo], valor)) || null
      return { disponible: true, valor: registro }
    }

    case 'getDataArrayByCondition':
    case 'getDataByCondition': {
      const [campo, valor] = datos
      if (!campo || valor == null) return { disponible: false, valor: null }
      const filtrados = registros.filter((item) => coincideValorCache(item?.[campo], valor))
      return { disponible: true, valor: filtrados }
    }

    default:
      return { disponible: false, valor: null }
  }
}
/******************************************************/
export function permisosPagina(router, otro = '') {
  const usuarioLocalStorage = JSON.parse(localStorage.getItem('usuarioLocal'))[0]
  const permisosPagina = ['Administrador', 'Gerente', 'Soporte']
  const usuarioPermiso = usuarioLocalStorage.usuario

  if (otro != '') {
    permisosPagina.push(otro)
  }

  if (usuarioPermiso && permisosPagina.includes(usuarioPermiso)) {
  } else {
    router.push('/notpermission')
  }
}
/******************************************************/
export function datosUsuarioLocal() {
  const usuarioLocalStorage = JSON.parse(localStorage.getItem('usuarioLocal'))[0]
  return datos
}
/******************************************************/
// Codificar en Base64
export function codificarBase64(texto) {
  try {
    return btoa(unescape(encodeURIComponent(texto)))
  } catch (error) {
    console.error('Error al codificar en Base64:', error)
    return null
  }
}

/******************************************************/
// Decodificar desde Base64
export function decodificarBase64(base64) {
  try {
    return decodeURIComponent(escape(atob(base64)))
  } catch (error) {
    console.error('Error al decodificar Base64:', error)
    return null
  }
}

/******************************************************/
export function isBase64(str) {
  if (typeof str !== 'string' || str.trim() === '') {
    return false
  }
  try {
    const decoded = decodificarBase64(str)
    return decoded !== null
  } catch {
    return false
  }
}

/******************************************************/
export function generarCodigoUnicoN({
  longitud = 8,
  tipo = 'numerico' // 'alfanumerico' | 'alfabetico' | 'numerico'
} = {}) {
  let caracteres = ''

  switch (tipo) {
    case 'numerico':
      caracteres = '0123456789'
      break
    case 'alfabetico':
      caracteres = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'
      break
    default:
      caracteres = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
      break
  }

  let codigo = ''
  for (let i = 0; i < longitud; i++) {
    const randomIndex = Math.floor(Math.random() * caracteres.length)
    codigo += caracteres[randomIndex]
  }

  return codigo
}

/******************************************************/
export function verificaAutentificado(router = useRouter()) {
  // const router = useRouter();
  const verificaLocalStotage = window.localStorage.getItem('autenticacion')
  if (verificaLocalStotage) {
    const verificado = JSON.parse(verificaLocalStotage)
    if (!verificado.activo) {
      router.push('/login')
    }
  } else {
    localStorage.clear()
    router.push('/login')
  }
}
/******************************************************/
export async function cerrarSession() {
  localStorage.clear()
}
/******************************************************/
export async function enviarDatosPorPost(url, data, token = null) {
  try {
    const isLocalDev =
      !window.electron &&
      (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    const requestUrl = url.replace(
      /^https:\/\/demo\.tmposrd\.com\/api2\//,
      isLocalDev ? '/api2/' : 'https://demo.tmposrd.com/api2/'
    )
    const headers = {
      'Content-Type': 'application/json'
    }
    if (token) {
      headers['Accept'] = '*/*'
      headers['Authorization'] = token
    }

    console.log('📤 enviarDatosPorPost URL:', requestUrl, 'DATA:', JSON.stringify(data));

    if (window.electron?.ipcRenderer && /^https?:\/\//.test(requestUrl)) {
      const response = await window.electron.ipcRenderer.invoke('http-request', requestUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(data)
      })

      if (!response.ok) {
        console.error('❌ Error en la solicitud: Código de estado', response.status)
        console.error('⚠️ Respuesta completa:', response);
        return null
      }

      console.log('📥 Respuesta Electron IPC:', response.data);
      return response.data
    }

    const response = await fetch(requestUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(data)
    })

    if (!response.ok) {
      console.error('❌ Error en la solicitud: Código de estado', response.status)
      try {
        const errorText = await response.text();
        console.error('⚠️ Cuerpo del error:', errorText);
      } catch(e) {}
      return null
    }

    const responseData = await response.clone().json().catch(() => response.text());
    console.log('📥 Respuesta fetch:', responseData);
    return responseData;
  } catch (error) {
    console.error('❌ Error en enviarDatosPorPost:', error)
    return null
  }
}

/***************************************************************/
export function enviarSolicitudGet(url, token = null) {
  const isLocalDev =
    !window.electron &&
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
  const requestUrl = url.replace(
    /^https:\/\/demo\.tmposrd\.com\/api2\//,
    isLocalDev ? '/api2/' : 'https://demo.tmposrd.com/api2/'
  )

  if (window.electron?.ipcRenderer && /^https?:\/\//.test(requestUrl)) {
    const headers = {}
    if (token) {
      headers['Accept'] = '*/*'
      headers['Authorization'] = token
    }

    return window.electron.ipcRenderer
      .invoke('http-request', requestUrl, { method: 'GET', headers })
      .then((response) => {
        if (!response.ok) {
          throw new Error('Error ' + response.status)
        }

        return response.data
      })
  }

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('GET', requestUrl, true) // 👈 true = ASÍNCRONO

    if (token) {
      xhr.setRequestHeader('Accept', '*/*')
      xhr.setRequestHeader('Authorization', token)
    }

    xhr.onload = () => {
      if (xhr.status === 200) {
        try {
          const jsonResponse = JSON.parse(xhr.responseText)
          resolve(jsonResponse)
        } catch (error) {
          console.error('Error al analizar la respuesta JSON', error)
          reject(error)
        }
      } else {
        console.error('Error en la solicitud: Código de estado ' + xhr.status)
        reject(new Error('Error ' + xhr.status))
      }
    }

    xhr.onerror = () => {
      console.error('Error de red')
      reject(new Error('Error de red'))
    }

    xhr.send()
  })
}

/***************************************************************/
export function peticiones(url, datos, metodo = 'POST', jwt = null) {
  if (metodo == 'POST') {
    return enviarDatosPorPost(url, datos, jwt)
  } else {
    return enviarSolicitudGet(url, jwt)
  }
}
/***************************************************************/
export function downloadURI(uri, name) {
  var link = document.createElement('a')
  link.href = uri
  link.target = '_blank'
  link.download = name
  link.style.display = 'none'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}
/***************************************************************/
export function formatoMonedaRD(numero) {
  // Leer configuración de moneda desde localStorage
  let currency = 'DOP' // Valor por defecto
  let locale = 'es-DO' // Valor por defecto

  try {
    const configuracion = JSON.parse(window.localStorage.getItem('configuracion'))
    if (configuracion) {
      // Mapeo de países a locales
      const paisLocaleMap = {
        Argentina: 'es-AR',
        'República Dominicana': 'es-DO',
        Dominicana: 'es-DO',
        México: 'es-MX',
        Colombia: 'es-CO',
        Chile: 'es-CL',
        Perú: 'es-PE',
        Venezuela: 'es-VE',
        Ecuador: 'es-EC',
        España: 'es-ES',
        'Estados Unidos': 'en-US',
        USA: 'en-US'
      }

      // Mapeo de monedas a códigos ISO
      const monedaCodigoMap = {
        PESO: 'ARS', // Peso Argentino por defecto
        PESOS: 'ARS',
        'PESO ARGENTINO': 'ARS',
        'PESO DOMINICANO': 'DOP',
        'PESO MEXICANO': 'MXN',
        'PESO COLOMBIANO': 'COP',
        'PESO CHILENO': 'CLP',
        DÓLAR: 'USD',
        DOLAR: 'USD',
        EURO: 'EUR',
        SOL: 'PEN',
        BOLÍVAR: 'VES'
      }

      // Obtener locale del país
      if (configuracion.pais && paisLocaleMap[configuracion.pais]) {
        locale = paisLocaleMap[configuracion.pais]
      }

      // Obtener código de moneda
      if (configuracion.moneda) {
        const monedaUpper = configuracion.moneda.toUpperCase()

        // Si la moneda es PESO, usar el país para determinar el tipo específico
        if (monedaUpper === 'PESO' || monedaUpper === 'PESOS') {
          if (configuracion.pais === 'Argentina') currency = 'ARS'
          else if (
            configuracion.pais === 'República Dominicana' ||
            configuracion.pais === 'Dominicana'
          )
            currency = 'DOP'
          else if (configuracion.pais === 'México') currency = 'MXN'
          else if (configuracion.pais === 'Colombia') currency = 'COP'
          else if (configuracion.pais === 'Chile') currency = 'CLP'
          else currency = monedaCodigoMap[monedaUpper] || 'ARS'
        } else {
          currency = monedaCodigoMap[monedaUpper] || currency
        }
      }
    }
  } catch (error) {
    // Si hay error al leer localStorage, usar valores por defecto
    console.warn('Error al leer configuración de moneda, usando valores por defecto:', error)
  }

  const opciones = {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }
  return new Intl.NumberFormat(locale, opciones).format(numero)
}

/***************************************************************/
export async function peticionesFetch(link, peticion, datos, token, metodo = 'POST') {
  const validMethods = ['get', 'post', 'put', 'delete', 'patch']
  const method = metodo.toLowerCase()
  const isLocalDev =
    !window.electron &&
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
  const requestUrl = `${link}/${peticion}`.replace(
    /^https:\/\/demo\.tmposrd\.com\/api2\//,
    isLocalDev ? '/api2/' : 'https://demo.tmposrd.com/api2/'
  )

  if (!validMethods.includes(method)) {
    throw new Error('Método HTTP no válido')
  }

  const options = {
    method: method,
    headers: {
      Accept: '*/*',
      Authorization: `${token}`
    }
  }

  const bodyMethods = ['post', 'put', 'patch']
  if (bodyMethods.includes(method) && datos !== undefined) {
    options.body = JSON.stringify(datos)
    options.headers['Content-Type'] = 'application/json'
  }

  try {
    if (window.electron?.ipcRenderer && /^https?:\/\//.test(requestUrl)) {
      const response = await window.electron.ipcRenderer.invoke('http-request', requestUrl, options)

      if (!response.ok) {
        return { error: `HTTP ${response.status}: ${response.error || response.data || ''}` }
      }

      return response.data
    }

    const response = await fetch(requestUrl, options)

    if (!response.ok) {
      const errorText = await response.text()
      return { error: `HTTP ${response.status}: ${errorText}` }
    }

    const contentType = response.headers.get('content-type')
    if (contentType && contentType.includes('application/json')) {
      return await response.json()
    }
    return await response.text()
  } catch (error) {
    console.error('Error en la petición:', error)
    return { error: 'Ocurrió un error en la petición', details: error }
  }
}

/***************************************************************/
const datosServidorLocal = async (peticion, data) => {
  const datosJSON = await envioElectron('datosarchivo')

  const link = datosJSON.VITE_LINKURL
  const api = datosJSON.VITE_LINK_API
  const token = datosJSON.VITE_TOKEN
  const patronTelefono = datosJSON.VITE_PATRON_TELEFONO
  const linkImpresora = datosJSON.VITE_IMPRESORA_LOCAL
  const patroncedula = datosJSON.VITE_PATRON_CEDULA
  const tokenCorto = datosJSON.VITE_TOKEN_CORTO
  const linkServidorLocal = datosJSON.SERVIDORLOCAL

  const tokenCifrado = await encryptarPassword(token, 10)

  let envio
  let url = ''
  let opciones = {}

  // Elimina espacios innecesarios
  peticion = peticion.trim()

  if (peticion === 'getDataByField') {
    url = `${linkServidorLocal}/get/${peticion}?0=${encodeURIComponent(data.tabla)}&1=${encodeURIComponent(data.campo)}&2=${encodeURIComponent(data.valor)}`
    opciones = {
      method: 'GET',
      headers: {
        Authorization: `${tokenCifrado}`
      }
    }
  } else if (
    peticion === 'getDataAsArray' ||
    peticion === 'tableExists' ||
    peticion === 'getTableColumns'
  ) {
    url = `${linkServidorLocal}/get/${peticion}?0=${encodeURIComponent(data.tabla)}`
    opciones = {
      method: 'GET',
      headers: {
        Authorization: `${tokenCifrado}`
      }
    }
  } else if (peticion === 'updateData') {
    const tabla = data.tabla
    const dataString = JSON.stringify(data.data)
    url = `${linkServidorLocal}/pos`
    opciones = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `${tokenCifrado}`
      },
      body: JSON.stringify({
        funcion: peticion,
        argumentos: [tabla, dataString] // vigilante y vigilanteonline
      })
    }
    //datosArrayMultiples
  } else if (peticion === 'insertData') {
    const tabla = data.tabla
    const dataString = JSON.stringify(data.data)
    url = `${linkServidorLocal}/pos`
    opciones = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `${tokenCifrado}`
      },
      body: JSON.stringify({
        funcion: peticion,
        argumentos: [tabla, dataString] // vigilante y vigilanteonline
      })
    }
  } else if (peticion === 'datosArrayMultiples') {
    const dataString = JSON.stringify(data.tablas)
    url = `${linkServidorLocal}/pos`
    opciones = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `${tokenCifrado}`
      },
      body: JSON.stringify({
        funcion: peticion,
        argumentos: [dataString] // vigilante y vigilanteonline
      })
    }
  } else if (peticion === 'addColumnToTable') {
    url = `${linkServidorLocal}/get/${peticion}?0=${encodeURIComponent(data.tabla)}&1=${encodeURIComponent(data.campo)}`
    opciones = {
      method: 'GET',
      headers: {
        Authorization: `${tokenCifrado}`
      }
    }
  } else if (peticion === 'deleteColumnFromTable') {
    url = `${linkServidorLocal}/get/${peticion}?0=${encodeURIComponent(data.tabla)}&1=${encodeURIComponent(data.campo)}`
    opciones = {
      method: 'GET',
      headers: {
        Authorization: `${tokenCifrado}`
      }
    }
  } else if (peticion === 'getLastXRows') {
    url = `${linkServidorLocal}/get/${peticion}?0=${encodeURIComponent(data.tabla)}&1=${encodeURIComponent(data.data)}`
    opciones = {
      method: 'GET',
      headers: {
        Authorization: `${tokenCifrado}`
      }
    }
  } else if (peticion === 'crearTabla') {
    url = `${linkServidorLocal}/get/${peticion}?0=${encodeURIComponent(data.tabla)}&1=${encodeURIComponent(data.campos)}`
    opciones = {
      method: 'GET',
      headers: {
        Authorization: `${tokenCifrado}`
      }
    }
  } else if (peticion === 'deleteAll') {
    url = `${linkServidorLocal}/get/${peticion}?0=${encodeURIComponent(data.tabla)}`
    opciones = {
      method: 'GET',
      headers: {
        Authorization: `${tokenCifrado}`
      }
    }
  } else if (peticion === 'listarArchivosDeCarpeta') {
    url = `${linkServidorLocal}/get/${peticion}?0=${encodeURIComponent(data.tabla)}`
    opciones = {
      method: 'GET',
      headers: {
        Authorization: `${tokenCifrado}`
      }
    }
  } else if (peticion === 'deleteEntry') {
    url = `${linkServidorLocal}/get/${peticion}?0=${encodeURIComponent(data.tabla)}&1=${encodeURIComponent(data.id)}`
    opciones = {
      method: 'GET',
      headers: {
        Authorization: `${tokenCifrado}`
      }
    }
  }

  try {
    const respuesta = await fetch(url, opciones)
    const resultado = await respuesta.json()
    return resultado
  } catch (error) {
    console.error('Error en fetch:', error)
    return { success: false, error: error.message }
  }
}

/***************************************************************/
export async function peticionesFetchOffline(peticion, parametros, ...datos) {
  let envio
  const datosJSON = await envioElectron('datosarchivo')

  const link = datosJSON.VITE_LINKURL
  const api = datosJSON.VITE_LINK_API
  const token = datosJSON.VITE_TOKEN
  const patronTelefono = datosJSON.VITE_PATRON_TELEFONO
  const linkImpresora = datosJSON.VITE_IMPRESORA_LOCAL
  const patroncedula = datosJSON.VITE_PATRON_CEDULA
  const tokenCorto = datosJSON.VITE_TOKEN_CORTO
  //const offline = datosJSON.OFFLINE === 'true' ? true : false;
  const offline = !navigator.onLine

  const tokenCifrado = await encryptarPassword(token, 10)

  const tabla = typeof parametros === 'string' ? parametros : (parametros?.tabla ?? '')
  const BITACORA_TABLE = 'bitacora'
  const BITACORA_FIELDS = [
    'tabla',
    'accion',
    'registro_id',
    'referencia',
    'descripcion',
    'datos_anteriores',
    'datos_nuevos',
    'usuario',
    'fecha',
    'hora',
    'timestamp',
    'created_at',
    'updated_at'
  ]

  // Electron offline: pass through directly to IPC → servidor.js (SQLite)
  const ipcCall = () =>
    window.electron.ipcRenderer.invoke('consultaservidor', peticion, parametros, ...datos)
  const parseUsuarioBitacora = () => {
    try {
      const raw = JSON.parse(window.localStorage.getItem('usuarioLocal') || 'null')
      const usuario = Array.isArray(raw) ? raw[0] : raw
      return (
        usuario?.nombre ||
        usuario?.usuario ||
        usuario?.email ||
        usuario?.token ||
        'Sistema'
      )
    } catch (error) {
      return 'Sistema'
    }
  }

  const serializarBitacora = (valor) => {
    if (valor == null) return ''
    try {
      return JSON.stringify(valor)
    } catch (error) {
      return String(valor)
    }
  }

  const esRespuestaOK = (respuesta) => {
    if (Array.isArray(respuesta)) return respuesta[0] === 'ok'
    if (respuesta && typeof respuesta === 'object') {
      return respuesta.success === true || respuesta.ok === true || respuesta[0] === 'ok'
    }
    return false
  }

  const obtenerReferenciaRegistro = (registro = {}) => {
    return (
      registro?.no_factura ||
      registro?.no_cotizacion ||
      registro?.numero ||
      registro?.codigo ||
      registro?.imei ||
      registro?.nombre ||
      registro?.id ||
      ''
    )
  }

  const obtenerDescripcionBitacora = (tablaNombre, accion, registro = {}) => {
    const referencia = obtenerReferenciaRegistro(registro)
    return referencia
      ? `${accion} en ${tablaNombre} (${referencia})`
      : `${accion} en ${tablaNombre}`
  }

  const asegurarTablaBitacoraDirecta = async () => {
    try {
      if (window.electron) {
        const existe = await window.electron.ipcRenderer.invoke('consultaservidor', 'tableExists', BITACORA_TABLE)
        if (!Array.isArray(existe) || existe[0] !== 'ok') {
          await window.electron.ipcRenderer.invoke(
            'consultaservidor',
            'crearTabla',
            BITACORA_TABLE,
            BITACORA_FIELDS.join(',')
          )
        }

        const columnas = await window.electron.ipcRenderer.invoke('consultaservidor', 'getTableColumns', BITACORA_TABLE)
        const columnasActuales = Array.isArray(columnas) ? columnas : []
        for (const campo of BITACORA_FIELDS) {
          if (!columnasActuales.includes(campo)) {
            await window.electron.ipcRenderer.invoke('consultaservidor', 'addColumnToTable', BITACORA_TABLE, campo)
          }
        }
      }
    } catch (error) {
      console.error('Error asegurando tabla bitacora:', error)
    }
  }

  const obtenerRegistroPrevio = async (tablaNombre, registro = {}) => {
    try {
      if (!tablaNombre || !registro || Object.keys(registro).length === 0) return null

      const clavesPreferidas = ['id', 'no_factura', 'no_cotizacion', 'codigo', 'imei', 'numero']
      const clave = clavesPreferidas.find((campo) => registro[campo] != null && registro[campo] !== '')
      if (!clave) return null

      if (window.electron) {
        return await window.electron.ipcRenderer.invoke(
          'consultaservidor',
          'getDataByField',
          tablaNombre,
          clave,
          registro[clave]
        )
      }

      if (offline) {
        initOfflineDB()
        return await getCachedByField(tablaNombre, clave, registro[clave])
      }

      return await peticionesFetch(
        `${link}${api}`,
        `datoscampo/${tablaNombre}/${clave}/${registro[clave]}`,
        {},
        tokenCifrado,
        'GET'
      )
    } catch (error) {
      console.error('Error obteniendo registro previo para bitacora:', error)
      return null
    }
  }

  const obtenerTodosRegistros = async (tablaNombre) => {
    try {
      if (!tablaNombre) return []
      if (window.electron) {
        return await window.electron.ipcRenderer.invoke('consultaservidor', 'getDataAsArray', tablaNombre)
      }
      if (offline) {
        initOfflineDB()
        return await getCachedTable(tablaNombre)
      }
      return await peticionesFetch(
        `${link}${api}`,
        `datosarray/${tablaNombre}`,
        {},
        tokenCifrado,
        'GET'
      )
    } catch (error) {
      console.error('Error obteniendo registros para bitacora:', error)
      return []
    }
  }

  const insertarRegistroBitacora = async (payload) => {
    try {
      await asegurarTablaBitacoraDirecta()
      if (window.electron) {
        return await window.electron.ipcRenderer.invoke(
          'consultaservidor',
          'insertData',
          BITACORA_TABLE,
          JSON.stringify(payload)
        )
      }
      if (offline) {
        initOfflineDB()
        await insertOffline(BITACORA_TABLE, payload)
        return ['ok']
      }
      return await enviarDatosPorPost(`${link}${api}/insertar/${BITACORA_TABLE}`, payload, tokenCifrado)
    } catch (error) {
      console.error('Error insertando bitacora:', error)
      return ['error']
    }
  }

  const guardarCacheLocalSiAplica = (tablaNombre, respuesta) => {
    if (Array.isArray(respuesta)) {
      guardarTablaLocalStorage(tablaNombre, respuesta)
    }
  }

  const asegurarCacheLocalTabla = async (tablaNombre) => {
    if (!esTablaLocalStorage(tablaNombre) || Array.isArray(obtenerTablaLocalStorage(tablaNombre))) return
    const registros = await peticionesFetch(
      `${link}${api}`,
      `datosarray/${tablaNombre}`,
      {},
      tokenCifrado,
      'GET'
    )
    guardarCacheLocalSiAplica(tablaNombre, registros)
  }

  const registrarBitacora = async ({
    tablaNombre,
    accion,
    antes = null,
    despues = null,
    referencia = '',
    descripcion = ''
  }) => {
    try {
      if (!tablaNombre || tablaNombre === BITACORA_TABLE) return

      const ahora = Date.now()
      const payload = {
        tabla: tablaNombre,
        accion,
        registro_id: despues?.id || antes?.id || '',
        referencia: referencia || obtenerReferenciaRegistro(despues || antes || {}),
        descripcion: descripcion || obtenerDescripcionBitacora(tablaNombre, accion, despues || antes || {}),
        datos_anteriores: serializarBitacora(antes),
        datos_nuevos: serializarBitacora(despues),
        usuario: parseUsuarioBitacora(),
        fecha: nfecha('fecha'),
        hora: nfecha('hora'),
        timestamp: ahora,
        created_at: ahora,
        updated_at: ahora
      }

      await insertarRegistroBitacora(payload)
    } catch (error) {
      console.error('Error registrando bitacora:', error)
    }
  }

  const forzarApi = datos?.[0]?.forceApi === true
  const respuestaLocal = !offline && !forzarApi
    ? leerRespuestaLocalStorage(peticion, tabla, datos)
    : { disponible: false }

  if (respuestaLocal.disponible) {
    return respuestaLocal.valor
  }

  switch (peticion) {
    case 'descargarDatosServidor': {
      const tablas = Array.isArray(parametros) ? parametros : datos[0]
      const tablasDescarga = Array.isArray(tablas) ? tablas : []
      const resultados = {}

      for (const tablaDescarga of tablasDescarga) {
        const registros = await peticionesFetch(
          `${link}${api}`,
          `datosarray/${tablaDescarga}`,
          {},
          tokenCifrado,
          'GET'
        )

        const registrosArray = Array.isArray(registros) ? registros : []
        resultados[tablaDescarga] = await window.electron.ipcRenderer.invoke(
          'consultaservidor',
          'bulkUpsertData',
          tablaDescarga,
          JSON.stringify(registrosArray)
        )
      }

      envio = ['ok', resultados]
      break
    }

    case 'sincronizarCambiosPendientes': {
      const pendientes = await window.electron.ipcRenderer.invoke(
        'consultaservidor',
        'getSyncPendingChanges'
      )
      const resumen = { total: pendientes.length, sincronizados: 0, errores: 0 }

      for (const item of pendientes) {
        try {
          const payload = item.payload ? JSON.parse(item.payload) : {}
          let respuesta

          if (item.accion === 'insertData') {
            respuesta = await enviarDatosPorPost(`${link}${api}/insertar/${item.tabla}`, payload, tokenCifrado)
          } else if (item.accion === 'updateData') {
            respuesta = await enviarDatosPorPost(`${link}${api}/actualizarcampos/${item.tabla}`, payload, tokenCifrado)
          } else if (item.accion === 'deleteEntry') {
            respuesta = await peticionesFetch(`${link}${api}`, `borrar/${item.tabla}`, { id: payload.id }, tokenCifrado, 'POST')
          } else if (item.accion === 'deleteByField') {
            respuesta = await peticionesFetch(
              `${link}${api}`,
              `borrarporcampo/${item.tabla}`,
              { campo: payload.campo, valor: payload.valor },
              tokenCifrado,
              'POST'
            )
          } else if (item.accion === 'deleteAll') {
            respuesta = await peticionesFetch(`${link}${api}`, 'borrartodo', { tabla: item.tabla }, tokenCifrado, 'POST')
          } else {
            throw new Error(`Accion de sincronizacion no soportada: ${item.accion}`)
          }

          if (respuesta && (respuesta[0] === 'ok' || respuesta.success === true || respuesta.ok === true || !respuesta.error)) {
            await window.electron.ipcRenderer.invoke('consultaservidor', 'markSyncPendingChange', item.id, 'sincronizado', '')
            resumen.sincronizados++
          } else {
            throw new Error(respuesta?.error || respuesta?.message || 'El servidor no confirmo la operacion')
          }
        } catch (error) {
          await window.electron.ipcRenderer.invoke(
            'consultaservidor',
            'markSyncPendingChange',
            item.id,
            'pendiente',
            error.message || String(error)
          )
          resumen.errores++
        }
      }

      await window.electron.ipcRenderer.invoke('consultaservidor', 'clearSyncedPendingChanges')
      envio = ['ok', resumen]
      break
    }

    case 'getDataAsArray':
      if (offline) {
        if (window.electron) {
          envio = await ipcCall()
        } else {
          initOfflineDB()
          envio = await getCachedTable(tabla)
        }
      } else {
        envio = await peticionesFetch(
          `${link}${api}`,
          `datosarray/${tabla}`,
          {},
          tokenCifrado,
          'GET'
        )
        guardarCacheLocalSiAplica(tabla, envio)
      }
      break


case 'getDataAsArrayLazy': {
  const data = datos?.[0] ?? {}
  const opciones = {
    limit: data?.limit ?? 20,
    offset: data?.offset ?? 0,
    search: data?.search ?? '',
    searchFields: data?.searchFields ?? [],
    orderBy: data?.orderBy ?? 'id',
    orderDir: data?.orderDir ?? 'DESC',
    filtroCampo: data?.filtroCampo ?? '',
    filtroValor: data?.filtroValor ?? '',
    filtros: data?.filtros ?? [],
    stockMode: data?.stockMode ?? 'all'
  }


  if (offline) {
    if (window.electron) {
      console.log('[peticionesFetchOffline] Usando Electron IPC')
      envio = await ipcCall()
    } else {
      console.log('[peticionesFetchOffline] Usando IndexedDB')
      initOfflineDB()
      envio = await getDataAsArrayLazy(tabla, opciones)
      console.log('[peticionesFetchOffline] Respuesta de IndexedDB:', envio)
    }
  } else {
    console.log('[peticionesFetchOffline] Usando servidor online')
    const params = new URLSearchParams({
      limit: String(opciones.limit),
      offset: String(opciones.offset),
      search: opciones.search,
      searchFields: Array.isArray(opciones.searchFields)
        ? opciones.searchFields.join(',')
        : '',
      orderBy: opciones.orderBy,
      orderDir: opciones.orderDir,
      filtroCampo: opciones.filtroCampo,
      filtroValor: opciones.filtroValor,
      filtros: Array.isArray(opciones.filtros)
        ? JSON.stringify(opciones.filtros)
        : '[]',
      stockMode: opciones.stockMode
    })

    envio = await peticionesFetch(
      `${link}${api}`,
      `datoslazy/${tabla}?${params.toString()}`,
      {},
      tokenCifrado,
      'GET'
    )
  }
  break
}

    case 'getAllData':
      if (offline) {
        if (window.electron) {
          envio = await ipcCall()
        } else {
          initOfflineDB()
          envio = await getCachedTable(tabla)
        }
      } else {
        envio = await peticionesFetch(
          `${link}${api}`,
          `datosarray/${tabla}`,
          {},
          tokenCifrado,
          'GET'
        )
        guardarCacheLocalSiAplica(tabla, envio)
      }
      break

    case 'getDataProductosArray':
      if (offline) {
        if (window.electron) {
          envio = await ipcCall()
        } else {
          initOfflineDB()
          envio = await getCachedTable(tabla)
        }
      } else {
        // const link = datos[0]
        envio = await peticionesFetch(
          `${link}${api}`,
          `productos_stock`,
          { tabla: tabla, link: link },
          tokenCifrado,
          'POST'
        )
      }
      break

    case 'getAllTables':
      if (offline) {
        envio = await ipcCall()
      } else {
        envio = await peticionesFetch(`${link}${api}`, `tablas/${tabla}`, {}, tokenCifrado, 'GET')
      }
      break

    case 'dropTable':
      if (offline) {
        envio = await ipcCall()
      } else {
        envio = await peticionesFetch(
          `${link}${api}`,
          `borrartabla/${tabla}`,
          {},
          tokenCifrado,
          'GET'
        )
      }
      break

    case 'getMaxValue':
      if (offline) {
        envio = await ipcCall()
      } else {
        envio = await peticionesFetch(
          `${link}${api}`,
          `datosmax`,
          { tabla: tabla, campo: datos[0] },
          tokenCifrado,
          'POST'
        )
      }
      break

    case 'updateEntireColumn':
      if (offline) {
        envio = await ipcCall()
      } else {
        envio = await peticionesFetch(
          `${link}${api}`,
          `actualizarcolumnacompletadb`,
          { tabla: tabla, campo: datos[0], nuevovalor: datos[1] },
          tokenCifrado,
          'POST'
        )
      }
      break

    case 'getDataAsArrayWithIMG':
      if (offline) {
        if (window.electron) {
          envio = await ipcCall()
        } else {
          initOfflineDB()
          envio = await getCachedTable(tabla)
        }
      } else {
        // const link = datos[0]
        envio = await peticionesFetch(
          `${link}${api}`,
          `datosarraypostconimg`,
          { tabla: tabla, link: link },
          tokenCifrado,
          'POST'
        )
      }
      break


    case 'getDataProductosArray':
      if(offline){
         envio = await datosServidorLocal('getDataAsArrayWithIMG',{tablas:tabla})
      }else{
       // const link = datos[0]
      envio = await peticionesFetch(
        `${link}${api}`,
        `productos_stock`,
        {tabla:tabla,link:link},
        tokenCifrado,
        'POST'
      );}
      break;


    case 'datosArrayMultiples':
      if (offline) {
        envio = await ipcCall()
      } else {
        envio = await peticionesFetch(
          `${link}${api}`,
          `datosarray/${tabla}`,
          {},
          tokenCifrado,
          'GET'
        )
      }
      break
    //datosArrayMultiples

    case 'tableExists':
      if (offline) {
        envio = await ipcCall()
      } else {
        envio = await peticionesFetch(
          `${link}${api}`,
          `verificatabla/${tabla}`,
          {},
          tokenCifrado,
          'GET'
        )
      }
      break

    case 'crearTabla':
      const dataString = datos[0]
      if (offline) {
        envio = await ipcCall()
      } else {
        envio = await peticionesFetch(
          `${link}${api}`,
          `creartabla/${tabla}`,
          {},
          tokenCifrado,
          'GET'
        )
      }
      break

    case 'getDataLazy':
      if (offline) {
        envio = await ipcCall()
      } else {
        const datosEnvioLazy = datos[0]
        envio = await peticionesFetch(
          `${link}${api}`,
          `datosarraylazy/${tabla}`,
          datosEnvioLazy,
          tokenCifrado,
          'POST'
        )
      }
      break

    case 'peticionimagenesbase64': {
      if (!tabla) throw new Error('Faltan el nombre de la tabla')
      if (offline) {
        envio = await ipcCall()
      } else {
        envio = await peticiones(
          link + api + '/peticionimagenesbase64',
          { origen: `${tabla}` },
          'POST',
          tokenCifrado
        )
      }

      break
    }

    case 'listarImagenesBase64': {
      if (!tabla) throw new Error('Faltan el nombre de la tabla')
      if (offline) {
        envio = await ipcCall()
      } else {
        envio = await peticiones(
          link + api + '/peticionimagenesbase64',
          { origen: `${tabla}` },
          'POST',
          tokenCifrado
        )
      }

      break
    }

    case 'getTableColumns':
      if (offline) {
        envio = await ipcCall()
      } else {
        envio = await peticionesFetch(`${link}${api}`, `campos/${tabla}`, {}, tokenCifrado, 'GET')
      }
      break

    case 'addColumnToTable': {
      const campo = typeof parametros === 'object' && parametros !== null ? parametros.campo : datos[0]
      const tipo = typeof parametros === 'object' && parametros !== null ? parametros.tipo : datos[1]
      if (!tabla || !campo) throw new Error('Falta tabla o campo para agregar columna')
      if (offline) {
        envio = await ipcCall()
      } else {
        envio = await peticionesFetch(
          `${link}${api}`,
          `agregarcampodbalfinal`,
          { tabla, campo, tipo },
          tokenCifrado,
          'POST'
        )
      }
      break
    }

    case 'deleteColumnFromTable': {
      const campo = typeof parametros === 'object' && parametros !== null ? parametros.campo : datos[0]
      if (!tabla || !campo) throw new Error('Falta tabla o campo para borrar columna')
      if (offline) {
        envio = await ipcCall()
      } else {
        envio = await peticionesFetch(
          `${link}${api}`,
          `borrarcampodb`,
          { tabla, campo },
          tokenCifrado,
          'POST'
        )
      }
      break
    }

    case 'deleteColumnFromTable': {
      const campo = typeof parametros === 'object' && parametros !== null ? parametros.campo : datos[0]
      if (!tabla || !campo) throw new Error('Falta tabla o campo para borrar columna')

      try {
        const respuesta = await axios.post(
          `${link}${apiPos}`,
          {
            funcion: 'deleteColumnFromTable',
            argumentos: [tabla, campo]
          },
          {
            headers: {
              Authorization: tokenCifrado // AsegÃºrate de tener esta variable definida
            }
          }
        )
        envio = respuesta.data 
      } catch (err) {
        envio = { success: false, message: 'Error borrando la columna', error: err.message }
      }
      break
    }

    case 'updateData': {
      const dataString = datos[0]
      if (!tabla || !dataString)
        throw new Error('Faltan datos o nombre de la tabla para actualizar')

      let data
      try {
        data = JSON.parse(dataString)
      } catch (e) {
        throw new Error('El parámetro de datos no es un JSON válido')
      }

      for (const key in data) {
        if (typeof data[key] === 'string') {
          data[key] = data[key].replace(/'/g, "''")
        }
      }

      const registroAnterior = await obtenerRegistroPrevio(tabla, data)

      if (offline) {
        if (window.electron) {
          envio = await ipcCall()
        } else {
          initOfflineDB()
          await addToSyncQueue(tabla, 'updateData', dataString)
          envio = ['ok']
        }
      } else {
        envio = await enviarDatosPorPost(
          `${link}${api}/actualizarcampos/${tabla}`,
          data,
          tokenCifrado
        )
      }

      if (esRespuestaOK(envio)) {
        invalidarTablaLocalStorage(tabla)
        await registrarBitacora({
          tablaNombre: tabla,
          accion: 'ACTUALIZAR',
          antes: registroAnterior,
          despues: data
        })
      }
      break
    }

    case 'getLastXRows': {
      try {
        if (datos.length < 1) {
          throw new Error('Se requieren al menos 4 parámetros: campo1, valor1, campo2, valor2')
        }

        if (!tabla) {
          throw new Error('Nombre de tabla no especificado')
        }

        if (offline) {
          envio = await ipcCall()
        } else {
          envio = await peticionesFetch(
            `${link}${api}`,
            `ultimosx/${tabla}/${datos[0]}`,
            {},
            tokenCifrado,
            'GET'
          )
        }
      } catch (error) {
        console.error('❌ Error en getLastXRows:', error.message)
        envio = { ok: false, error: error.message }
      }
      break
    }

    case 'datosVentasPorRango': {
      try {
        if (datos.length < 1) {
          throw new Error('Se requieren al menos 4 parámetros: campo1, valor1, campo2, valor2')
        }

        const data = {
          fechainicio: parametros,
          fechafinal: datos[0]
        }
        console.log('data', data)

        if (!tabla) {
          throw new Error('Nombre de tabla no especificado')
        }

        envio = await enviarDatosPorPost(`${link}${api}/datosventasporrango`, data, tokenCifrado)
      } catch (error) {
        console.error('❌ Error en datosVentasPorRango:', error.message)
        envio = { ok: false, error: error.message }
      }
      break
    }

    case 'datosVentasPorRango2': {
      try {
        if (datos.length < 1) {
          throw new Error('Se requieren al menos 4 parámetros: campo1, valor1, campo2, valor2')
        }

        const data = {
          fechainicio: parametros,
          fechafinal: datos[0],
          tablas_created: datos[1],
          tablas_updated: datos[2]
        }

        if (!tabla) {
          throw new Error('Nombre de tabla no especificado')
        }

        envio = await enviarDatosPorPost(`${link}${api}/datosventasporrango2`, data, tokenCifrado)
        console.log('envio', envio)
      } catch (error) {
        console.error('❌ Error en datosVentasPorRango 2:', error.message)
        envio = { ok: false, error: error.message }
      }
      break
    }

    case 'datosventasporrango': {
      try {
        if (datos.length < 1) {
          throw new Error('Se requieren al menos 4 parámetros: campo1, valor1, campo2, valor2')
        }

        const data = {
          fechainicio: parametros,
          fechafinal: datos[0]
        }

        if (!tabla) {
          throw new Error('Nombre de tabla no especificado')
        }

        envio = await enviarDatosPorPost(`${link}${api}/datosventasporrango`, data, tokenCifrado)
      } catch (error) {
        console.error('❌ Error en datosventasporrango:', error.message)
        envio = { ok: false, error: error.message }
      }
      break
    }

    case 'getRowsByTimestampRange': {
      try {
        if (datos.length < 2) {
          throw new Error('Se requieren al menos 4 parámetros: campo1, valor1, campo2, valor2')
        }

        const data = {
          tabla: tabla,
          campo: datos[0],
          fechainicio: datos[1],
          fechafin: datos[2]
        }

        if (!tabla) {
          throw new Error('Nombre de tabla no especificado')
        }

        envio = await enviarDatosPorPost(`${link}${api}/datostimestamp`, data, tokenCifrado)
      } catch (error) {
        console.error('❌ Error en getRowsByTimestampRange:', error.message)
        envio = { ok: false, error: error.message }
      }
      break
    }

    case 'getDataArrayByCondition': {
      try {
        if (datos.length < 2) {
          throw new Error('Se requieren al menos 2 parámetros: campo, valor')
        }

        const campo = datos[0]
        const valor = datos[1]

        if (!tabla) {
          throw new Error('Nombre de tabla no especificado')
        }

        if (offline) {
          if (window.electron) {
            envio = await ipcCall()
          } else {
            initOfflineDB()
            envio = await getCachedByCondition(tabla, campo, valor)
          }
        } else {
          const data = {
            campo: campo,
            valor: valor
          }

          envio = await enviarDatosPorPost(
            `${link}${api}/datosarraycondicion/${tabla}`,
            data,
            tokenCifrado
          )
          await asegurarCacheLocalTabla(tabla)
        }
      } catch (error) {
        console.error('❌ Error en getDataArrayByCondition:', error.message)
        envio = { ok: false, error: error.message }
      }
      break
    }

    case 'getDataByCondition': {
      try {
        if (datos.length < 2) {
          throw new Error('Se requieren al menos 4 parámetros: campo1, valor1, campo2, valor2')
        }

        const data = {
          campo: datos[0],
          valor: datos[1]
        }

        if (!tabla) {
          throw new Error('Nombre de tabla no especificado')
        }

        envio = await enviarDatosPorPost(
          `${link}${api}/datosarraycondicion/${tabla}`,
          data,
          tokenCifrado
        )
        await asegurarCacheLocalTabla(tabla)
      } catch (error) {
        console.error('❌ Error en getDataByCondition:', error.message)
        envio = { ok: false, error: error.message }
      }
      break
    }

    case 'getDataArrayByTwoConditions': {
      try {
        if (datos.length < 4) {
          throw new Error('Se requieren al menos 4 parámetros: campo1, valor1, campo2, valor2')
        }

        const data = {
          campo1: datos[0],
          valor1: datos[1],
          campo2: datos[2],
          valor2: datos[3]
        }

        if (!tabla) {
          throw new Error('Nombre de tabla no especificado')
        }

        envio = await enviarDatosPorPost(
          `${link}${api}/datosarraydoblecondicion/${tabla}`,
          data,
          tokenCifrado
        )
      } catch (error) {
        console.error('❌ Error en getDataArrayByTwoConditions:', error.message)
        envio = { ok: false, error: error.message }
      }
      break
    }

    case 'getDataByDoubleCondition': {
      try {
        if (datos.length < 4) {
          throw new Error('Se requieren al menos 4 parámetros: campo1, valor1, campo2, valor2')
        }

        const data = {
          campo1: datos[0],
          valor1: datos[1],
          campo2: datos[2],
          valor2: datos[3]
        }

        if (!tabla) {
          throw new Error('Nombre de tabla no especificado')
        }

        if (offline && !window.electron) {
          initOfflineDB()
          const allRows = await getCachedTable(tabla)
          envio = allRows.filter(
            (row) =>
              String(row[data.campo1]) === String(data.valor1) &&
              String(row[data.campo2]) === String(data.valor2)
          )
        } else {
          envio = await enviarDatosPorPost(
            `${link}${api}/datosarraydoblecondicion/${tabla}`,
            data,
            tokenCifrado
          )
        }
      } catch (error) {
        console.error('❌ Error en getDataArrayByTwoConditions:', error.message)
        envio = { ok: false, error: error.message }
      }
      break
    }
    case 'insertData': {
      const dataString = datos[0]
      if (!tabla || !dataString) throw new Error('Faltan datos o nombre de la tabla para insertar')

      let data
      try {
        data = JSON.parse(dataString)
      } catch (e) {
        throw new Error('El parámetro de datos no es un JSON válido')
      }

      for (const key in data) {
        if (typeof data[key] === 'string') {
          data[key] = data[key].replace(/'/g, "''")
        }
      }

      if (offline) {
        if (window.electron) {
          envio = await ipcCall()
        } else {
          initOfflineDB()
          await addToSyncQueue(tabla, 'insertData', dataString)
          await insertOffline(tabla, data)
          envio = ['ok']
        }
      } else {
        envio = await enviarDatosPorPost(`${link}${api}/insertar/${tabla}`, data, tokenCifrado)
      }

      if (esRespuestaOK(envio)) {
        invalidarTablaLocalStorage(tabla)
        await registrarBitacora({
          tablaNombre: tabla,
          accion: 'INSERTAR',
          despues: data
        })
      }
      break
    }

    case 'deleteAll':{ 
      const registrosAntes = tabla && tabla !== BITACORA_TABLE ? await obtenerTodosRegistros(tabla) : []
      if (offline) {
        envio = await ipcCall()
      } else {
        envio = await peticionesFetch(
          `${link}${api}`,
          `borrartodo`,
          { tabla },
          tokenCifrado,
          'POST'
        )
      }

      if (esRespuestaOK(envio) && tabla !== BITACORA_TABLE) {
        invalidarTablaLocalStorage(tabla)
        await registrarBitacora({
          tablaNombre: tabla,
          accion: 'ELIMINAR_TODO',
          antes: registrosAntes,
          descripcion: `ELIMINAR_TODO en ${tabla} (${Array.isArray(registrosAntes) ? registrosAntes.length : 0} registros)`
        })
      }
      break
    }

    case 'ejecutarSQL':{ 
      if (offline) {
        envio = await ipcCall()
      } else {
        envio = await peticionesFetch(
          `${link}${api}`,
          `execsql`,
          { sql: tabla},
          tokenCifrado,
          'POST'
        )
      }
      break
    }

    case 'deleteEntry': {
      const id = datos[0]
      if (!tabla || id == null) throw new Error('Faltan el nombre de la tabla o el ID para borrar')
      const registroAnterior = tabla !== BITACORA_TABLE
        ? await obtenerRegistroPrevio(tabla, { id })
        : null
      if (offline) {
        envio = await ipcCall()
      } else {
        envio = await peticionesFetch(
          `${link}${api}`,
          `borrar/${tabla}`,
          { id },
          tokenCifrado,
          'POST'
        )
      }

      if (esRespuestaOK(envio)) {
        invalidarTablaLocalStorage(tabla)
        await registrarBitacora({
          tablaNombre: tabla,
          accion: 'ELIMINAR',
          antes: registroAnterior,
          referencia: registroAnterior?.id || id
        })
      }
      break
    }

    case 'deleteByField': {
      const campo = datos[0]
      const valor = datos[1]
      if (!tabla || campo == null)
        throw new Error('Faltan el nombre de la tabla o el ID para borrar')
      const registrosAntes = tabla !== BITACORA_TABLE
        ? await obtenerTodosRegistros(tabla).then((items) =>
            Array.isArray(items)
              ? items.filter((item) => String(item?.[campo]) === String(valor))
              : []
          )
        : []
      if (offline) {
        envio = await ipcCall()
      } else {
        envio = await peticionesFetch(
          `${link}${api}`,
          `borrarporcampo/${tabla}`,
          { campo, valor },
          tokenCifrado,
          'POST'
        )
      }

      if (esRespuestaOK(envio) && tabla !== BITACORA_TABLE) {
        invalidarTablaLocalStorage(tabla)
        await registrarBitacora({
          tablaNombre: tabla,
          accion: 'ELIMINAR',
          antes: registrosAntes,
          referencia: `${campo}:${valor}`,
          descripcion: `ELIMINAR por ${campo}=${valor} en ${tabla}`
        })
      }
      break
    }

    case 'listarDirectorio': {
      if (!tabla) throw new Error('Faltan el nombre de la tabla')
      if (offline) {
        envio = await ipcCall()
      } else {
        envio = await peticionesFetch(
          `${link}${api}`,
          `leerdirectorio`,
          { directorio: `${tabla}` },
          tokenCifrado,
          'POST'
        )
      }

      break
    }

    case 'listarArchivosDeCarpeta': {
      if (!tabla) throw new Error('Faltan el nombre de la tabla')
      if (offline) {
        envio = await ipcCall()
      } else {
        envio = await peticionesFetch(
          `${link}${api}`,
          `peticionimagenes`,
          { origen: `../vista/img/${tabla}` },
          tokenCifrado,
          'POST'
        )
      }

      break
    }

    case 'listarArchivosDeCarpetaUrl': {
      const directorio = tabla
      if (!tabla) throw new Error('Faltan el nombre de la tabla')
      const resp = await peticiones(
        link + api + '/peticionimagenes',
        { origen: `../vista/img/${directorio}` },
        'POST',
        tokenCifrado
      )
      if (resp) {
        envio = resp.map((imagen) => {
          // Quitar la extensión del nombre del archivo
          const nombreSinExtension = imagen.replace(/\.[^/.]+$/, '')
          return {
            url: `${link}/vista/img/${directorio}/${imagen}`,
            nombre: imagen,
            nombreSolo: nombreSinExtension
          }
        })
      } else {
        envio = []
      }

      break
    }

    case 'eliminarArchivo': {
      const directorio = tabla
      if (!tabla) throw new Error('Faltan el nombre de la tabla')
      try {
        const respuesta = await axios.post(
          `${link}${api}`,
          {
            funcion: 'eliminarArchivo',
            argumentos: [directorio, datos[0]]
          },
          {
            headers: {
              Authorization: tokenCifrado // Asegúrate de tener esta variable definida
            }
          }
        )

        envio = respuesta.data // aquí sí queda lo que devuelve la API
        console.log('✅ Respuesta:', envio)
      } catch (err) {
        console.error('❌ Error:', err)
        envio = [
          'error',
          { success: false, message: 'Error Actualizando la tabla', error: err.message }
        ]
      }

      break
    }

    case 'getDataByField': {
      const campo = datos[0]
      const valor = datos[1]

      if (!tabla || !campo || valor == null) {
        throw new Error('Faltan el nombre de la tabla, campo o valor para la consulta')
      }

      if (offline) {
        if (window.electron) {
          envio = await ipcCall()
        } else {
          initOfflineDB()
          envio = await getCachedByField(tabla, campo, valor)
        }
      } else {
        envio = await peticionesFetch(
          `${link}${api}`,
          `datoscampo/${tabla}/${campo}/${valor}`,
          {},
          tokenCifrado,
          'GET'
        )
        await asegurarCacheLocalTabla(tabla)
      }
      break
    }

    default:
      throw new Error(`❌ Petición desconocida: ${peticion}`)
  }

  return envio
}

/***************************************************************/
export async function peticionesFetchOfflineRED(peticion, parametros, ...datos) {
  let envio
  const datosJSON = await envioElectron('datosarchivo')

  const link = datosJSON.SERVIDORLOCAL || datosJSON.VITE_LINKURL
  const api = '/api/get'
  const apiPos = '/api/pos'
  const token = datosJSON.VITE_TOKEN
  const patronTelefono = datosJSON.VITE_PATRON_TELEFONO
  const linkImpresora = datosJSON.VITE_IMPRESORA_LOCAL
  const patroncedula = datosJSON.VITE_PATRON_CEDULA
  const tokenCorto = datosJSON.VITE_TOKEN_CORTO
  const tokenCifrado = await encryptarPassword(token, 10)

  const tabla = typeof parametros === 'string' ? parametros : (parametros?.tabla ?? '')

  switch (peticion) {
    case 'getDataAsArray':
      envio = await peticionesFetch(
        `${link}${api}`,
        `getDataAsArray?tabla=${tabla}`,
        {},
        tokenCifrado,
        'GET'
      )
      break

    case 'getAllData':
      envio = await peticionesFetch(
        `${link}${api}`,
        `getAllData?tabla=${tabla}`,
        {},
        tokenCifrado,
        'GET'
      )
      break

    case 'tableExists':
      envio = await peticionesFetch(
        `${link}${api}`,
        `tableExists?tabla=${tabla}`,
        {},
        tokenCifrado,
        'GET'
      )
      break

    case 'crearTabla':
      try {
        const respuesta = await axios.post(
          `${link}${apiPos}`,
          {
            funcion: 'crearTabla',
            argumentos: [tabla, datos[0]]
          },
          {
            headers: {
              Authorization: tokenCifrado // Asegúrate de tener esta variable definida
            }
          }
        )

        envio = respuesta.data // aquí sí queda lo que devuelve la API
        console.log('✅ Respuesta:', envio)
      } catch (err) {
        console.error('❌ Error:', err)
        envio = { success: false, message: 'Error creando la tabla', error: err.message }
      }

      break

    case 'getTableColumns':
      envio = await peticionesFetch(
        `${link}${api}`,
        `getTableColumns?tabla=${tabla}`,
        {},
        tokenCifrado,
        'GET'
      )
      break

    case 'addColumnToTable': {
      const campo = typeof parametros === 'object' && parametros !== null ? parametros.campo : datos[0]
      const tipo = typeof parametros === 'object' && parametros !== null ? parametros.tipo : datos[1]
      if (!tabla || !campo) throw new Error('Falta tabla o campo para agregar columna')

      try {
        const respuesta = await axios.post(
          `${link}${apiPos}`,
          {
            funcion: 'addColumnToTable',
            argumentos: tipo ? [tabla, campo, tipo] : [tabla, campo]
          },
          {
            headers: {
              Authorization: tokenCifrado // Asegúrate de tener esta variable definida
            }
          }
        )
        envio = respuesta.data // aquí sí queda lo que devuelve la API
        console.log('✅ Respuesta:', envio)
      } catch (err) {
        console.error('❌ Error:', err)
        envio = { success: false, message: 'Error creando la tabla', error: err.message }
      }
      break
    }

    case 'updateData': {
      let dataString = datos[0]
      if (!tabla || !dataString)
        throw new Error('Faltan datos o nombre de la tabla para actualizar')

      let dataObj
      try {
        dataObj = JSON.parse(dataString)
      } catch (e) {
        throw new Error('El parámetro de datos no es un JSON válido')
      }
      for (const key in dataObj) {
        if (typeof dataObj[key] === 'string') {
          dataObj[key] = dataObj[key].replace(/'/g, "''")
        }
      }
      dataString = JSON.stringify(dataObj)

      try {
        const respuesta = await axios.post(
          `${link}${apiPos}`,
          {
            funcion: 'updateData',
            argumentos: [tabla, dataString]
          },
          {
            headers: {
              Authorization: tokenCifrado // Asegúrate de tener esta variable definida
            }
          }
        )

        envio = respuesta.data // aquí sí queda lo que devuelve la API
        console.log('✅ Respuesta:', envio)
      } catch (err) {
        console.error('❌ Error:', err)
        envio = [
          'error',
          { success: false, message: 'Error Actualizando la tabla', error: err.message }
        ]
      }
      break
    }

    case 'getLastXRows': {
      try {
        if (datos.length < 1) {
          throw new Error('Se requieren al menos 4 parámetros: campo1, valor1, campo2, valor2')
        }

        if (!tabla) {
          throw new Error('Nombre de tabla no especificado')
        }

        envio = await peticionesFetch(
          `${link}${api}`,
          `getLastXRows?tabla=${tabla}&cantidad=${datos[0]}`, //ojo falta x
          {},
          tokenCifrado,
          'GET'
        )
      } catch (error) {
        console.error('❌ Error en getLastXRows:', error.message)
        envio = { ok: false, error: error.message }
      }
      break
    }

    case 'datosVentasPorRango': {
      try {
        if (datos.length < 1) {
          throw new Error('Se requieren al menos 4 parámetros: campo1, valor1, campo2, valor2')
        }

        const data = {
          fechainicio: parametros,
          fechafinal: datos[0]
        }
        console.log('data', data)

        if (!tabla) {
          throw new Error('Nombre de tabla no especificado')
        }

        envio = await enviarDatosPorPost(`${link}${api}/datosventasporrango`, data, tokenCifrado)
      } catch (error) {
        console.error('❌ Error en datosVentasPorRango:', error.message)
        envio = { ok: false, error: error.message }
      }
      break
    }

    case 'datosVentasPorRango2': {
      try {
        if (datos.length < 1) {
          throw new Error('Se requieren al menos 4 parámetros: campo1, valor1, campo2, valor2')
        }

        const data = {
          fechainicio: parametros,
          fechafinal: datos[0],
          tablas_created: datos[1],
          tablas_updated: datos[2]
        }
        console.log('data', data)

        if (!tabla) {
          throw new Error('Nombre de tabla no especificado')
        }

        envio = await enviarDatosPorPost(`${link}${api}/datosventasporrango2`, data, tokenCifrado)
        console.log('envio', envio)
      } catch (error) {
        console.error('❌ Error en datosVentasPorRango 2:', error.message)
        envio = { ok: false, error: error.message }
      }
      break
    }

    case 'datosventasporrango': {
      try {
        if (datos.length < 1) {
          throw new Error('Se requieren al menos 4 parámetros: campo1, valor1, campo2, valor2')
        }

        const data = {
          fechainicio: parametros,
          fechafinal: datos[0]
        }

        if (!tabla) {
          throw new Error('Nombre de tabla no especificado')
        }

        envio = await enviarDatosPorPost(`${link}${api}/datosventasporrango`, data, tokenCifrado)
      } catch (error) {
        console.error('❌ Error en datosventasporrango:', error.message)
        envio = { ok: false, error: error.message }
      }
      break
    }

    case 'getRowsByTimestampRange': {
      try {
        if (datos.length < 2) {
          throw new Error('Se requieren al menos 4 parámetros: campo1, valor1, campo2, valor2')
        }

        const data = {
          tabla: tabla,
          campo: datos[0],
          fechainicio: datos[1],
          fechafin: datos[2]
        }

        if (!tabla) {
          throw new Error('Nombre de tabla no especificado')
        }

        envio = await enviarDatosPorPost(`${link}${api}/datostimestamp`, data, tokenCifrado)
      } catch (error) {
        console.error('❌ Error en getRowsByTimestampRange:', error.message)
        envio = { ok: false, error: error.message }
      }
      break
    }

    case 'getDataArrayByCondition': {
      try {
        if (datos.length < 2) {
          throw new Error('Se requieren al menos 2 parámetros: campo, valor')
        }

        const campo = datos[0]
        const valor = datos[1]

        if (!tabla) {
          throw new Error('Nombre de tabla no especificado')
        }

        if (offline) {
          if (window.electron) {
            envio = await ipcCall()
          } else {
            initOfflineDB()
            envio = await getCachedByCondition(tabla, campo, valor)
          }
        } else {
          const data = {
            campo: campo,
            valor: valor
          }

          envio = await enviarDatosPorPost(
            `${link}${api}/datosarraycondicion/${tabla}`,
            data,
            tokenCifrado
          )
        }
      } catch (error) {
        console.error('❌ Error en getDataArrayByCondition:', error.message)
        envio = { ok: false, error: error.message }
      }
      break
    }

    case 'getDataByCondition': {
      try {
        if (datos.length < 2) {
          throw new Error('Se requieren al menos 4 parámetros: campo1, valor1, campo2, valor2')
        }

        const data = {
          campo: datos[0],
          valor: datos[1]
        }

        if (!tabla) {
          throw new Error('Nombre de tabla no especificado')
        }

        envio = await enviarDatosPorPost(
          `${link}${api}/datosarraycondicion/${tabla}`,
          data,
          tokenCifrado
        )
      } catch (error) {
        console.error('❌ Error en getDataByCondition:', error.message)
        envio = { ok: false, error: error.message }
      }
      break
    }

    case 'getDataArrayByTwoConditions': {
      try {
        if (datos.length < 4) {
          throw new Error('Se requieren al menos 4 parámetros: campo1, valor1, campo2, valor2')
        }

        const data = {
          campo1: datos[0],
          valor1: datos[1],
          campo2: datos[2],
          valor2: datos[3]
        }

        if (!tabla) {
          throw new Error('Nombre de tabla no especificado')
        }

        envio = await enviarDatosPorPost(
          `${link}${api}/datosarraydoblecondicion/${tabla}`,
          data,
          tokenCifrado
        )
      } catch (error) {
        console.error('❌ Error en getDataArrayByTwoConditions:', error.message)
        envio = { ok: false, error: error.message }
      }
      break
    }

    case 'insertData': {
      let dataString = datos[0]
      if (!tabla || !dataString) throw new Error('Faltan datos o nombre de la tabla para insertar')

      let dataObj
      try {
        dataObj = JSON.parse(dataString)
      } catch (e) {
        throw new Error('El parámetro de datos no es un JSON válido')
      }
      for (const key in dataObj) {
        if (typeof dataObj[key] === 'string') {
          dataObj[key] = dataObj[key].replace(/'/g, "''")
        }
      }
      dataString = JSON.stringify(dataObj)

      try {
        const respuesta = await axios.post(
          `${link}${apiPos}`,
          {
            funcion: 'insertData',
            argumentos: [tabla, dataString]
          },
          {
            headers: {
              Authorization: tokenCifrado // Asegúrate de tener esta variable definida
            }
          }
        )

        envio = respuesta.data // aquí sí queda lo que devuelve la API
        console.log('✅ Respuesta:', envio)
      } catch (err) {
        console.error('❌ Error:', err)
        envio = [
          'error',
          { success: false, message: 'Error Insertando la tabla', error: err.message }
        ]
      }
      break
    }

    case 'deleteAll':
      envio = await peticionesFetch(
        `${link}${api}`,
        `deleteAll?tabla=${tabla}`,
        {},
        tokenCifrado,
        'GET'
      )
      break

    case 'deleteEntry': {
      const id = datos[0]
      if (!tabla || id == null) throw new Error('Faltan el nombre de la tabla o el ID para borrar')

      envio = await peticionesFetch(
        `${link}${api}`,
        `deleteEntry?tabla=${tabla}&id=${id}`,
        {},
        tokenCifrado,
        'GET'
      )
      break
    }

    case 'listarArchivosDeCarpeta': {
      const directorio = tabla
      if (!tabla) throw new Error('Faltan el nombre de la tabla')
      try {
        const respuesta = await axios.post(
          `${link}${apiPos}`,
          {
            funcion: 'listarArchivosDeCarpeta',
            argumentos: [tabla, datos[0]]
          },
          {
            headers: {
              Authorization: tokenCifrado // Asegúrate de tener esta variable definida
            }
          }
        )

        envio = respuesta.data // aquí sí queda lo que devuelve la API
        console.log('✅ Respuesta:', envio)
      } catch (err) {
        console.error('❌ Error:', err)
        envio = [
          'error',
          { success: false, message: 'Error Actualizando la tabla', error: err.message }
        ]
      }

      break
    }

    case 'eliminarArchivo': {
      const directorio = tabla
      if (!tabla) throw new Error('Faltan el nombre de la tabla')
      try {
        const respuesta = await axios.post(
          `${link}${apiPos}`,
          {
            funcion: 'eliminarArchivo',
            argumentos: [directorio, datos[0]]
          },
          {
            headers: {
              Authorization: tokenCifrado // Asegúrate de tener esta variable definida
            }
          }
        )

        envio = respuesta.data // aquí sí queda lo que devuelve la API
        console.log('✅ Respuesta:', envio)
      } catch (err) {
        console.error('❌ Error:', err)
        envio = [
          'error',
          { success: false, message: 'Error Actualizando la tabla', error: err.message }
        ]
      }

      break
    }

    case 'listarArchivosDeCarpetaUrl': {
      const directorio = tabla
      if (!tabla) throw new Error('Faltan el nombre de la tabla')
      const resp = await peticiones(
        link + api + '/peticionimagenes',
        { origen: `../vista/img/${directorio}` },
        'POST',
        tokenCifrado
      )

      envio = resp.map((imagen) => `${link}/vista/img/${directorio}/${imagen}`)

      break
    }

    case 'getDataByField': {
      const campo = datos[0]
      const valor = datos[1]

      if (!tabla || !campo || valor == null) {
        throw new Error('Faltan el nombre de la tabla, campo o valor para la consulta')
      }

      envio = await peticionesFetch(
        `${link}${api}`,
        `getDataByField?tabla=${tabla}&campo=${campo}&valor=${valor}`,
        {},
        tokenCifrado,
        'GET'
      )
      break
    }

    default:
      throw new Error(`❌ Petición desconocida: ${peticion}`)
  }

  return envio
}
/***************************************************************/
export async function encryptarPassword(password, saltRounds = 10) {
  try {
    if (window.electron?.ipcRenderer) {
      return await window.electron.ipcRenderer.invoke('encrypt-password', password, saltRounds)
    }

    const hash = await bcrypt.hash(password, saltRounds)
    return hash
  } catch (error) {
    return ['error']
  }
}
/***************************************************************/
export async function comparePassword(plainPassword, hashedPassword) {
  try {
    if (window.electron?.ipcRenderer) {
      return await window.electron.ipcRenderer.invoke(
        'compare-password',
        plainPassword,
        hashedPassword
      )
    }

    const hash = await bcrypt.compare(plainPassword, hashedPassword)
    return hash
  } catch (error) {
    return ['error']
  }
}
/***************************************************************/
export async function generadorPassword(url, data, token) {
  return enviarDatosPorPost(url, data, token)
}
/***************************************************************/
export async function eliminarDatos(url, id, token) {
  const data = {
    id: id
  }
  return enviarDatosPorPost(url, data, token)
}
/***************************************************************/
export async function borrarTodoslosDatos(url, tabla, token) {
  const data = {
    tabla: tabla
  }
  return enviarDatosPorPost(url, data, token)
}
/***************************************************************/
export function obtenerIdsSeleccionados(primevueSelected = '') {
  let ids = []
  if (primevueSelected != '') {
    ids = primevueSelected.map((item) => item.id)
  } else {
    const checkboxes = document.querySelectorAll('.dt-checkbox:checked')
    ids = Array.from(checkboxes).map((checkbox) => checkbox.value)
  }

  return ids
}

/***************************************************************/
export function convertirAMayusculas(texto) {
  return texto.toUpperCase()
}
/***************************************************************/
export function lasMayusculas() {
  const elementos = document.querySelectorAll('.mayusc')
  elementos.forEach((elemento) => {
    elemento.addEventListener('blur', function () {
      let valor = this.value
      let mayuscula = valor.toUpperCase()
      this.value = mayuscula
    })
  })
}

/***************************************************************/
export function generarTablaFromStringJSON(
  string,
  indice = false,
  botones = false,
  onEditCallback,
  onDeleteCallback,
  tableId,
  customIcons = { edit: '<i class="pi pi-pencil"></i>', delete: '<i class="pi pi-trash"></i>' },
  rowColorCallback,
  checkboxField = null,
  checkboxHeader = 'Seleccionar',
  onCheckboxChangeCallback = null,
  onRowClickCallback = null // NUEVO callback para clic en filas
) {
  if (!string) return ''

  let isArray = false
  let parsedData

  try {
    parsedData = typeof string === 'string' ? JSON.parse(string) : string
    isArray = Array.isArray(parsedData)
  } catch (error) {
    console.error('Error al parsear el JSON en generarTablaFromStringJSON:', error)
    return ''
  }

  const data = isArray ? parsedData : [parsedData]
  if (data.length === 0) {
    return '<p>No hay datos para mostrar.</p>'
  }

  let tableContent

  if (isArray) {
    let headers = Object.keys(data[0])
    if (indice) headers = ['Índice', ...headers]
    if (checkboxField) headers.push(checkboxHeader)
    if (botones) headers.push('Acciones')

    const headerRow = headers
      .map((header) =>
        typeof header === 'string' ? `<th>${header.toUpperCase()}</th>` : '<th></th>'
      )
      .join('')

    const rows = data
      .map((producto, index) => {
        const stripedClass = index % 2 === 0 ? 'bg-white' : 'bg-gray-100'
        const rowColorClass = rowColorCallback ? rowColorCallback(producto, index) : ''

        const cells = headers
          .map((header) => {
            if (header === 'Índice') {
              return `<td>${index + 1}</td>`
            } else if (header === 'imagen') {
              return `<td><img src="${producto['imagen']}" alt="${producto['nombre']}" style="width: 50px; height: 50px;" /></td>`
            } else if (header === checkboxHeader && checkboxField) {
              return `
            <td>
              <input type="checkbox" class="row-checkbox" data-index="${index}" data-field="${checkboxField}" ${producto[checkboxField] ? 'checked' : ''}>
            </td>
          `
            } else if (header === 'Acciones') {
              let actionButtons = ''
              if (onEditCallback) {
                actionButtons += `
              <button type="button" class="text-success mr-2 btn-edit" data-index="${index}" data-table-id="${tableId}" data-action="edit">
                ${customIcons.edit}
              </button>
            `
              }
              if (onDeleteCallback) {
                actionButtons += `
              <button type="button" class="text-danger btn-delete" data-index="${index}" data-table-id="${tableId}" data-action="delete">
                ${customIcons.delete}
              </button>
            `
              }
              return `<td>${actionButtons}</td>`
            } else {
              return `<td data-key="${header}" data-index="${index}">${producto[header]}</td>`
            }
          })
          .join('')

        return `<tr data-index="${index}" class="cursor-pointer ${stripedClass} ${rowColorClass}">${cells}</tr>`
      })
      .join('')

    tableContent = `
      <thead class="bg-gray-50 dark:bg-gray-700 dark:text-white p-2">
        <tr>${headerRow}</tr>
      </thead>
      <tbody >
        ${rows}
      </tbody>
    `
  } else {
    const rows = Object.entries(parsedData)
      .map(([key, value]) => {
        if (key === 'imagen') {
          return `<tr class="hover:bg-gray-100 dark:hover:bg-gray-600"><td>${key}</td><td><img src="${value}" alt="${parsedData['nombre']}" style="width: 50px; height: 50px;" /></td></tr>`
        } else if (key === checkboxField) {
          return `<tr class="hover:bg-gray-100 dark:hover:bg-gray-600"><td>${key}</td><td><input type="checkbox" class="row-checkbox" ${value ? 'checked' : ''} data-field="${key}"></td></tr>`
        } else {
          return `<tr class="hover:bg-gray-100 dark:hover:bg-gray-600"><td>${key}</td><td>${value}</td></tr>`
        }
      })
      .join('')

    tableContent = `
      <thead>
        <tr><th>Propiedad</th><th>Valor</th></tr>
      </thead>
      <tbody>
        ${rows}
      </tbody>
    `
  }

  setTimeout(() => {
    const editButtons = document.querySelectorAll(
      `button[data-table-id="${tableId}"][data-action="edit"]`
    )
    const deleteButtons = document.querySelectorAll(
      `button[data-table-id="${tableId}"][data-action="delete"]`
    )
    const checkboxes = document.querySelectorAll(`#${tableId} .row-checkbox`)
    const rows = document.querySelectorAll(`#${tableId} tbody tr`)

    editButtons.forEach((button) => {
      button.removeEventListener('click', handleEditClick)
      button.addEventListener('click', handleEditClick)
    })

    deleteButtons.forEach((button) => {
      button.removeEventListener('click', handleDeleteClick)
      button.addEventListener('click', handleDeleteClick)
    })

    checkboxes.forEach((checkbox) => {
      checkbox.removeEventListener('change', handleCheckboxChange)
      checkbox.addEventListener('change', handleCheckboxChange)
    })

    rows.forEach((row) => {
      row.removeEventListener('click', handleRowClick)
      row.addEventListener('click', handleRowClick)
    })

    function handleEditClick(event) {
      event.stopImmediatePropagation()
      const index = event.target.closest('button').getAttribute('data-index')
      const tableId = event.target.closest('button').getAttribute('data-table-id')
      const item = data[parseInt(index, 10)]
      onEditCallback(parseInt(index, 10), item, tableId)
    }

    function handleDeleteClick(event) {
      event.stopImmediatePropagation()
      const index = event.target.closest('button').getAttribute('data-index')
      const tableId = event.target.closest('button').getAttribute('data-table-id')
      onDeleteCallback(parseInt(index, 10), tableId)
    }

    function handleCheckboxChange(event) {
      const index = event.target.getAttribute('data-index')
      const field = event.target.getAttribute('data-field')
      const isChecked = event.target.checked
      data[index][field] = isChecked

      if (onCheckboxChangeCallback) {
        onCheckboxChangeCallback(parseInt(index, 10), field, isChecked, data)
      }
    }

    function handleRowClick(event) {
      const index = event.currentTarget.getAttribute('data-index')
      const item = data[parseInt(index, 10)]
      if (onRowClickCallback) {
        onRowClickCallback(parseInt(index, 10), item, tableId)
      }
    }
  }, 0)

  return `
    <table class="table min-w-full border border-gray-300 dark:border-gray-600 shadow-md rounded-lg overflow-hidden bg-white dark:bg-gray-800" id="${tableId}">
      ${tableContent}
    </table>
  `
}

/***************************************************************/
export function convertirStringAArrayDeObjetos(input) {
  let elementos

  // Determinar si la entrada es un string o un array
  if (typeof input === 'string') {
    // Si es un string, dividirlo por comas
    elementos = input.split(',')
  } else if (Array.isArray(input)) {
    // Si es un array, usarlo directamente
    elementos = input
  } else {
    throw new Error('La entrada debe ser un string separado por comas o un array plano.')
  }

  // Crear un array de objetos
  const arrayDeObjetos = elementos.map((elemento) => {
    return { propiedad: elemento.trim() } // Usar trim() para eliminar espacios en blanco alrededor de los elementos
  })

  return arrayDeObjetos
}
/***************************************************************/
export async function arrayToObjetoFromTabla(
  link,
  token,
  tabla,
  quitarPrimero = true,
  verificarCampos = [],
  fieldOrder = 'usuario',
  toast = null
) {
  try {
    const argsLength = arguments.length

    const datosJSON = await envioElectron('datosarchivo')
    const link2 = datosJSON.VITE_LINKURL
    const api = datosJSON.VITE_LINK_API
    const token2 = datosJSON.VITE_TOKEN
    const tokenCifrado = await encryptarPassword(token2, 10)
    const linkURL = `${link2}${api}`

    if (argsLength === 1) {
      tabla = link
    }

    /*    const array = await peticionesFetch(
      `${linkURL}`,`campos/${tabla}`,
      {},
      tokenCifrado,
      "GET"
    );*/
    const array = await peticionesFetchOffline('getTableColumns', tabla)

    if (quitarPrimero) {
      array.shift()
    }

    var miObjeto = array.reduce(function (obj, elemento, index, array) {
      obj[elemento] = ''

      return obj
    }, {})

    return miObjeto
  } catch (error) {
    console.error('Error in arrayToObjetoFromTabla:', error)
    throw error // Rethrow the error after logging it
  }
}

/***************************************************************/
export function extraerCamposDeObjeto(array, quitarPrimero = true) {
  if (array.length === 0) {
    return {}
  }

  const primerObjeto = array[0]
  const nuevoObjeto = {}

  for (const key in primerObjeto) {
    if (primerObjeto.hasOwnProperty(key)) {
      nuevoObjeto[key] = ''
    }
  }

  if (quitarPrimero) {
    let firstKey = Object.keys(nuevoObjeto)[0]
    if (firstKey) {
      delete nuevoObjeto[firstKey]
    }
  }

  return nuevoObjeto
}

/***************************************************************/
export function arrayToObjeto(array, quitarprimero = true) {
  if (quitarprimero) {
    array.shift()
  }

  var miObjeto = array.reduce(function (obj, elemento, index, array) {
    if (index % 2 === 0) {
      obj[elemento] = ''
    }
    return obj
  }, {})

  return miObjeto
}
/***************************************************************/
export async function crearYDescargarExcel(link, api, tabla, tokenCifrado, Swal) {
  try {
    const response = await peticionesFetch(
      link + api,
      `crearexcel`,
      { tabla: tabla },
      tokenCifrado,
      'POST'
    )

    if (response[0] === 'ok') {
      const { value: isConfirmed } = await Swal.fire({
        title: 'Archivo Creado',
        text: '¿Deseas Descargarlo?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Descargar',
        cancelButtonText: 'Cerrar'
      })

      if (isConfirmed) {
        const downloadLink = document.createElement('a')
        downloadLink.href = `${link}/excel/${tabla}.xlsx`
        downloadLink.setAttribute('download', `${tabla}.xlsx`)
        document.body.appendChild(downloadLink)
        downloadLink.click()
        document.body.removeChild(downloadLink)
      }
    } else {
      Swal.fire({
        title: 'Error',
        text: 'Hubo un problema al crear el archivo.',
        icon: 'error',
        confirmButtonText: 'Cerrar'
      })
    }
  } catch (error) {
    console.error('Error:', error)
    Swal.fire({
      title: 'Error',
      text: 'Hubo un problema en la petición.',
      icon: 'error',
      confirmButtonText: 'Cerrar'
    })
  }
}

/***************************************************************/
export function extraerNumeros(cadena) {
  if (Array.isArray(cadena)) {
    return
  }
  var numeros = cadena.match(/\d+/g)
  var numerosConcatenados = numeros ? numeros.join('') : ''
  var numeroFinal = parseInt(numerosConcatenados, 10)
  return numeroFinal
}
/***************************************************************/
export function extraerString(cadena) {
  var subcadena = ''
  for (var i = 0; i < cadena.length; i++) {
    if (!isNaN(parseInt(cadena[i]))) {
      break
    }
    subcadena += cadena[i]
  }

  return subcadena
}
/***************************************************************/
export function buscadorObjeto(miArray, indice, datoBuscado) {
  var resultado = miArray.find((buscador) => buscador[indice] === datoBuscado)
  return resultado
}
/***************************************************************/
export function eliminarObjetoFromArray(miArray, indice, datoBuscado) {
  const posicion = miArray.findIndex((buscador) => buscador[indice] === datoBuscado)
  miArray.splice(posicion, 1)
}
/***************************************************************/
export function devuelveIndiceObjetoFromArray(miArray, indice, datoBuscado) {
  var posicion = miArray.findIndex((buscador) => buscador[indice] == datoBuscado)
  return posicion
}
/***************************************************************/
export function actualizadorObjetoArray(miArray, indiceArray, indiceObjeto, datos) {
  miArray[indiceArray][indiceObjeto] = datos
}
/***************************************************************/
export function objectToArray(objeto) {
  return Object.entries(objeto)
}
/***************************************************************/
export async function crearGasto(link, cantidad, concepto, toast, tokenCifrado) {
  const camposGastos = await arrayToObjetoFromTabla(link, tokenCifrado, 'gastos')

  const url = link + '/insertar/gastos'
  camposGastos.created_at = nfecha('timestamp')
  camposGastos.updated_at = nfecha('timestamp')
  camposGastos.fecha = nfecha('fecha')
  camposGastos.hora = nfecha('hora')
  camposGastos.mes = nfecha('mes')
  camposGastos.year = nfecha('year')
  camposGastos.descripcion = concepto
  camposGastos.cantidad = cantidad
  const envioDatos = await enviarDatosPorPost(url, camposGastos, tokenCifrado)

  if (envioDatos[0] == 'ok') {
    toast.add({
      severity: 'success',
      summary: 'Éxito',
      detail: 'Gasto Agregado con éxito.',
      life: 3000
    })
  } else {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Fallo al Agregar el Gasto.',
      life: 3000
    })
  }
}
/***************************************************************/
export async function crearNotaCredito(
  link,
  api,
  cod_cliente,
  cliente,
  cantidad,
  concepto,
  nota,
  toast,
  tokenCifrado
) {
  const camposNC = await arrayToObjetoFromTabla(link + api, tokenCifrado, 'notacredito')

  const ultimaNC = await peticiones(
    `${link}${api}/datosmax`,
    { tabla: 'notacredito', campo: 'no_credito' },
    'POST',
    tokenCifrado
  )

  const arrayConfiscal = await peticionesFetch(
    `${link + api}`,
    `datosarray/confiscal`,
    {},
    tokenCifrado,
    'GET'
  )

  const ultimaB04 = arrayConfiscal.find((tipo) => tipo.prefijo == 'B04')

  const url = link + api + '/insertar/notacredito'
  camposNC.no_credito = generadorCodigo(ultimaNC[0], '', 7)
  camposNC.b04 = generadorCodigo(ultimaB04.contador, 'B04', 8)

  if (camposNC.hasOwnProperty('created_at')) {
    camposNC.created_at = nfecha('timestamp')
    camposNC.updated_at = nfecha('timestamp')
  }

  camposNC.fecha = nfecha('fecha')
  camposNC.hora = nfecha('hora')
  camposNC.cod_cliente = cod_cliente
  camposNC.cliente = cliente
  camposNC.concepto = concepto
  camposNC.total = cantidad
  camposNC.nota = nota
  const envioDatos = await enviarDatosPorPost(url, camposNC, tokenCifrado)

  if (envioDatos[0] == 'ok') {
    await sumaFiscal(link, api, ultimaB04, 'B04', tokenCifrado)
    toast.add({
      severity: 'success',
      summary: 'Éxito',
      detail: 'Nota de Crédito Agregada con éxito.',
      life: 3000
    })
    return { success: true, no_credito: camposNC.no_credito }
  } else {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Fallo al Agregar la Nota de Crédito.',
      life: 3000
    })
    return { success: false }
  }
}
/***************************************************************/
export function eliminaDeArray(arr, items) {
  if (Array.isArray(items)) {
    for (item of items) {
      var i = arr.indexOf(item)

      if (i !== -1) {
        arr.splice(i, 1)
      }
    }
  } else {
    var i = arr.indexOf(items)

    if (i !== -1) {
      arr.splice(i, 1)
    }
  }
}
/***************************************************************/
export function stringParentesis(string) {
  // devuelve ARRAY con lo encontrado y sin ello, solo devuelve la primera coincidencia
  var regExp = /\(([^)]+)\)/g
  var ejecutar = string.match(regExp)
  if (ejecutar != null) {
    return string.match(/\((.*)\)/).pop()
  } else {
    return string
  }
}
/***************************************************************/
export function extraerNumerosEntreParentesis(cadena) {
  // Esta expresión regular busca dígitos dentro de paréntesis
  const regex = /\((\d+)\)/g
  let numeros = []
  let coincidencia

  while ((coincidencia = regex.exec(cadena)) !== null) {
    // La primera captura (\d+) está en el índice 1
    numeros.push(coincidencia[1])
  }

  return numeros
}
/***************************************************************/
export function extraerParentesis2(str) {
  const regex = /\(([^)]+)\)/
  const match = regex.exec(str)
  console.log('match', match)
  if (match) {
    return match[1]
  } else {
    return ''
  }
}
/***************************************************************/
export function extraerParentesis(texto) {
  const coincidencias = [...texto.matchAll(/\(([^)]+)\)/g)]
  const cantidadParentesis = coincidencias.length
  if (cantidadParentesis > 0) {
    const ultimoContenido = coincidencias[cantidadParentesis - 1][1]
    return ultimoContenido
  } else {
    return ''
  }
}
/***************************************************************/
export function rellenodecero(number, width) {
  // Si el número es vacío, asigna el valor cero
  if (number === '') {
    number = 0
  }

  var numberOutput = Math.abs(number) /* Valor absoluto del número */
  var length = numberOutput.toString().length /* Largo del número */
  var zero = '0' /* String de cero */

  if (width <= length) {
    if (number < 0) {
      return '-' + numberOutput.toString()
    } else {
      return numberOutput.toString()
    }
  } else {
    if (number < 0) {
      return '-' + zero.repeat(width - length) + numberOutput.toString()
    } else {
      return zero.repeat(width - length) + numberOutput.toString()
    }
  }
}
/***************************************************************/
export function generadorCodigo(codigo, prefijo, cantidadCeros) {
  if (prefijo != '') {
    if (Array.isArray(codigo)) {
      return prefijo + rellenodecero(1, cantidadCeros)
    } else {
      return prefijo + rellenodecero(Number(codigo.replace(/[^0-9]+/g, '')) + 1, cantidadCeros)
    }
  } else {
    if (Array.isArray(codigo)) {
      return rellenodecero(1, cantidadCeros)
    } else {
      return rellenodecero(Number(codigo.replace(/[^0-9]+/g, '')) + 1, cantidadCeros)
    }
  }
}
/***************************************************************/
export async function sumaFiscal(link, api, objeto, prefijo, tokenCifrado) {
  const numeracion = generadorCodigo(objeto['contador'], prefijo, 8)
  objeto['secuencia'] = numeracion
  objeto['contador'] = Number(objeto['contador']) + 1
  const envio = await peticionesFetch(
    `${link}${api}`,
    `actualizarcampos/confiscal`,
    objeto,
    tokenCifrado,
    'POST'
  )
}
/***************************************************************/
export function decimales(valor) {
  var operacion = Number(valor)
  return operacion.toFixed(2)
}
/***************************************************************/
export async function datosXcampo(link, dato, campo, tabla, token) {
  const url = link + '/api/datosarraycondicion/' + tabla + '/' + token
  const data = { campo: campo, valor: dato }
  const datosObtenidos = await enviarDatosPorPost(url, data)
  return datosObtenidos[0]
}
/***************************************************************/
export function nfecha(pedido) {
  const hoy = new Date()

  // Helpers
  const pad = (n) => String(n).padStart(2, '0')
  const restarDias = (dias) => {
    const f = new Date(hoy)
    f.setDate(f.getDate() - dias)
    return {
      fechaAmericana: `${f.getFullYear()}-${pad(f.getMonth() + 1)}-${pad(f.getDate())}`,
      fechaCompleta: `${pad(f.getDate())}/${pad(f.getMonth() + 1)}/${f.getFullYear()}`
    }
  }

  // Fechas básicas
  const manana = new Date(hoy)
  manana.setDate(hoy.getDate() + 1)
  const ayer = new Date(hoy)
  ayer.setDate(hoy.getDate() - 1)
  const anteayer = new Date(hoy)
  anteayer.setDate(hoy.getDate() - 2)
  const pasadomanana = new Date(hoy)
  pasadomanana.setDate(hoy.getDate() + 2)

  const dd = pad(hoy.getDate())
  const mm = pad(hoy.getMonth() + 1)
  const yyyy = hoy.getFullYear()

  const hora24 = hoy.getHours()
  const pmam = hora24 < 12 ? 'am' : 'pm'
  const horas = pad(hoy.getHours())
  const minutos = pad(hoy.getMinutes())
  const segundos = pad(hoy.getSeconds())
  const hor12 = hora24 % 12 || 12
  const mmSeg = pad(hoy.getMinutes())
  const ssSeg = pad(hoy.getSeconds())
  const hora = `${hor12}:${mmSeg}:${ssSeg} ${pmam}`
  const horaAmericana = `${horas}:${minutos}:${segundos}`

  const fecha = `${dd}/${mm}/${yyyy}`
  const fechaAmericana = `${yyyy}-${mm}-${dd}`
  const diasemana = hoy.getDay()
  const mes = hoy.getMonth()

  const ndiasemana = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
  const meses = [
    'Enero',
    'Febrero',
    'Marzo',
    'Abril',
    'Mayo',
    'Junio',
    'Julio',
    'Agosto',
    'Septiembre',
    'Octubre',
    'Noviembre',
    'Diciembre'
  ]

  const fechaHoraActual = `${yyyy}-${mm}-${dd} ${horas}:${minutos}:${segundos}`
  const fechaHoraFin = `${yyyy}-${mm}-${dd} 23:59:59`

  // Fechas relativas
  const fechaManana = `${pad(manana.getDate())}/${pad(manana.getMonth() + 1)}/${manana.getFullYear()}`
  const fechaAmericanaManana = `${manana.getFullYear()}-${pad(manana.getMonth() + 1)}-${pad(manana.getDate())}`

  const fechaAyer = `${pad(ayer.getDate())}/${pad(ayer.getMonth() + 1)}/${ayer.getFullYear()}`
  const fechaAmericanaAyer = `${ayer.getFullYear()}-${pad(ayer.getMonth() + 1)}-${pad(ayer.getDate())}`

  const fechaAnteayer = `${pad(anteayer.getDate())}/${pad(anteayer.getMonth() + 1)}/${anteayer.getFullYear()}`
  const fechaAmericanaAnteayer = `${anteayer.getFullYear()}-${pad(anteayer.getMonth() + 1)}-${pad(anteayer.getDate())}`

  const fechaPasadoManana = `${pad(pasadomanana.getDate())}/${pad(pasadomanana.getMonth() + 1)}/${pasadomanana.getFullYear()}`
  const fechaAmericanaPasadoManana = `${pasadomanana.getFullYear()}-${pad(pasadomanana.getMonth() + 1)}-${pad(pasadomanana.getDate())}`

  // Semana actual
  const inicioSemana = new Date(hoy)
  const diaActual = hoy.getDay()
  inicioSemana.setDate(hoy.getDate() - diaActual)
  const inicioSemana_dd = pad(inicioSemana.getDate())
  const inicioSemana_mm = pad(inicioSemana.getMonth() + 1)
  const inicioSemana_yyyy = inicioSemana.getFullYear()
  const inicioSemanaFechaAmericana = `${inicioSemana_yyyy}-${inicioSemana_mm}-${inicioSemana_dd} 00:00:00`

  // Semana anterior
  const inicioSemanaAnterior = new Date(inicioSemana)
  inicioSemanaAnterior.setDate(inicioSemanaAnterior.getDate() - 7)
  const finSemanaAnterior = new Date(inicioSemanaAnterior)
  finSemanaAnterior.setDate(inicioSemanaAnterior.getDate() + 6)
  const inicioSemanaAnteriorStr = `${inicioSemanaAnterior.getFullYear()}-${pad(inicioSemanaAnterior.getMonth() + 1)}-${pad(inicioSemanaAnterior.getDate())} 00:00:00`
  const finSemanaAnteriorStr = `${finSemanaAnterior.getFullYear()}-${pad(finSemanaAnterior.getMonth() + 1)}-${pad(finSemanaAnterior.getDate())} 23:59:59`

  // Mes actual
  const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1)
  const inicioMes_dd = pad(inicioMes.getDate())
  const inicioMes_mm = pad(inicioMes.getMonth() + 1)
  const inicioMes_yyyy = inicioMes.getFullYear()
  const inicioMesFechaAmericana = `${inicioMes_yyyy}-${inicioMes_mm}-${inicioMes_dd} 00:00:00`

  // Mes anterior
  const mesAnterior = new Date(hoy.getFullYear(), hoy.getMonth() - 1, 1)
  const inicioMesAnterior = `${mesAnterior.getFullYear()}-${pad(mesAnterior.getMonth() + 1)}-01 00:00:00`
  const finMesAnteriorDate = new Date(hoy.getFullYear(), hoy.getMonth(), 0)
  const finMesAnterior = `${finMesAnteriorDate.getFullYear()}-${pad(finMesAnteriorDate.getMonth() + 1)}-${pad(finMesAnteriorDate.getDate())} 23:59:59`

  // Hace X días
  const hace7 = restarDias(7)
  const hace15 = restarDias(15)
  const hace30 = restarDias(30)
  const hace60 = restarDias(60)
  const hace90 = restarDias(90)

  // Años
  const inicioAnioActual = `${yyyy}-01-01 00:00:00`
  const finAnioActual = `${yyyy}-12-31 23:59:59`
  const inicioAnioAnterior = `${yyyy - 1}-01-01 00:00:00`
  const finAnioAnterior = `${yyyy - 1}-12-31 23:59:59`

  // Retornos según pedido
  if (pedido == 'dia') return dd
  else if (pedido == 'diasemana') return ndiasemana[diasemana]
  else if (pedido == 'mesletra') return meses[mes]
  else if (pedido == 'mes') return mm
  else if (pedido == 'year') return yyyy
  else if (pedido == 'fecha') return fecha
  else if (pedido == 'fechaAmericana') return fechaAmericana
  else if (pedido == 'timestamp') return fechaHoraActual
  else if (pedido == 'hora') return hora
  else if (pedido == 'horaAmericana') return horaAmericana
  else if (pedido == 'fechaManana') return fechaManana
  else if (pedido == 'fechaAmericanaManana') return fechaAmericanaManana
  else if (pedido == 'fechaAyer') return fechaAyer
  else if (pedido == 'fechaAmericanaAyer') return fechaAmericanaAyer
  else if (pedido == 'fechaAnteayer') return fechaAnteayer
  else if (pedido == 'fechaAmericanaAnteayer') return fechaAmericanaAnteayer
  else if (pedido == 'fechaPasadoManana') return fechaPasadoManana
  else if (pedido == 'fechaAmericanaPasadoManana') return fechaAmericanaPasadoManana
  else if (pedido == 'timestampcompleta')
    return { fechainicio: fechaAmericana + ' 00:01:00', fechafin: fechaHoraFin }
  else if (pedido == 'semanatimestamp')
    return { fechainicio: inicioSemanaFechaAmericana, fechafin: fechaHoraActual }
  else if (pedido == 'mestimestamp')
    return { fechainicio: inicioMesFechaAmericana, fechafin: fechaHoraActual }
  else if (pedido == 'ultimos7dias')
    return { fechainicio: hace7.fechaAmericana + ' 00:00:00', fechafin: fechaHoraActual }
  else if (pedido == 'ultimos15dias')
    return { fechainicio: hace15.fechaAmericana + ' 00:00:00', fechafin: fechaHoraActual }
  else if (pedido == 'ultimos30dias')
    return { fechainicio: hace30.fechaAmericana + ' 00:00:00', fechafin: fechaHoraActual }
  else if (pedido == 'ultimos60dias')
    return { fechainicio: hace60.fechaAmericana + ' 00:00:00', fechafin: fechaHoraActual }
  else if (pedido == 'ultimos90dias')
    return { fechainicio: hace90.fechaAmericana + ' 00:00:00', fechafin: fechaHoraActual }
  else if (pedido == 'anioActual') return { fechainicio: inicioAnioActual, fechafin: finAnioActual }
  else if (pedido == 'anioAnterior')
    return { fechainicio: inicioAnioAnterior, fechafin: finAnioAnterior }
  else if (pedido == 'semanaAnterior')
    return { fechainicio: inicioSemanaAnteriorStr, fechafin: finSemanaAnteriorStr }
  else if (pedido == 'mesAnterior')
    return { fechainicio: inicioMesAnterior, fechafin: finMesAnterior }
  else if (pedido == 'rangosemana')
    return {
      fechainicio: `${inicioSemana_dd}/${inicioSemana_mm}/${inicioSemana_yyyy}`,
      fechafin: fecha
    }
  else if (pedido == 'rangomestimestamp')
    return {
      fechainicio: `${inicioMes_yyyy}-${inicioMes_mm}-${inicioMes_dd} 00:00:01`,
      fechafin: fechaHoraActual
    }
  else if (pedido == 'rangoayer') return { fechainicio: fechaAyer, fechafin: fechaAyer }
  else if (pedido == 'rangohoy') return { fechainicio: fecha, fechafin: fecha }
  else if (pedido == 'rango7dias') return { fechainicio: `${hace7.fechaCompleta}`, fechafin: fecha }

  return null
}

/***************************************************************/
/***************************************************************/
/**
 * Convierte un timestamp a formato largo en español
 * Ej: "sábado, 23 de agosto de 2025 1:00 p. m."
 *
 * @param {string|Date} fecha - Puede ser string tipo "2025-09-08 23:59:59" o un objeto Date
 * @returns {string}
 */
export function formatearFechaLarga(fecha) {
  // Si es string "YYYY-MM-DD HH:mm:ss", lo adaptamos a ISO para que Date lo entienda
  const date = typeof fecha === 'string' ? new Date(fecha.replace(' ', 'T')) : new Date(fecha)

  const opciones = {
    weekday: 'long', // sábado
    year: 'numeric', // 2025
    month: 'long', // septiembre
    day: 'numeric', // 8
    hour: 'numeric', // 11
    minute: 'numeric', // 59
    second: undefined, // si quieres incluir segundos cámbialo a 'numeric'
    hour12: true
  }

  return new Intl.DateTimeFormat('es-DO', opciones).format(date)
}
/***************************************************************/
export function generarCodigoUnico4Digitos() {
  const ahora = Date.now().toString() // milisegundos como base
  const numeros = new Set()

  // Recorremos los dígitos del timestamp de derecha a izquierda
  for (let i = ahora.length - 1; i >= 0 && numeros.size < 4; i--) {
    numeros.add(ahora[i])
  }

  // Si por alguna razón no hay suficientes dígitos únicos, agregamos aleatorios
  while (numeros.size < 4) {
    numeros.add(Math.floor(Math.random() * 10).toString())
  }

  return Array.from(numeros).join('')
}

/***************************************************************/
export function calcularDiferenciaEnDias(fecha1, fecha2) {
  // Dividir las fechas en partes
  const [dia1, mes1, anio1] = fecha1.split('/').map(Number)
  const [dia2, mes2, anio2] = fecha2.split('/').map(Number)

  // Crear objetos Date
  const date1 = new Date(anio1, mes1 - 1, dia1) // Restamos 1 al mes porque los meses en Date son 0-indexed
  const date2 = new Date(anio2, mes2 - 1, dia2)

  // Calcular la diferencia en milisegundos
  const diferenciaEnMilisegundos = Math.abs(date2 - date1)

  // Convertir la diferencia a días
  const diferenciaEnDias = Math.floor(diferenciaEnMilisegundos / (1000 * 60 * 60 * 24))

  return diferenciaEnDias
}
/***************************************************************/
export function transformarFecha(fecha, americana = true) {
  var separador = fecha.includes('-') ? '-' : '/'
  var partes = fecha.split(separador)

  if (partes.length !== 3 || partes.some((parte) => isNaN(parte))) {
    return 'Formato de fecha no válido'
  }

  if (americana) {
    // Convertir de dd/mm/YYYY a mm/dd/YYYY
    return `${partes[1]}/${partes[0]}/${partes[2]}`
  } else {
    // Convertir de mm/dd/YYYY a dd/mm/YYYY
    return `${partes[1]}-${partes[0]}-${partes[2]}`
  }
}
/***********************************************************************************************/
export function transformarFechaTimestamp(
  fecha,
  americana = true,
  horaInicio = false,
  horaFin = false
) {
  var separador = fecha.includes('-') ? '-' : '/'
  var partes = fecha.split(separador)

  if (partes.length !== 3 || partes.some((parte) => isNaN(parte))) {
    return 'Formato de fecha no válido'
  }

  if (americana) {
    // Convertir de dd/mm/YYYY a mm/dd/YYYY
    if (horaInicio) {
      return `${partes[2]}-${partes[0]}-${partes[1]} 00:00:00`
    } else if (horaFin) {
      return `${partes[2]}-${partes[0]}-${partes[1]} 23:59:59`
    } else {
      return `${partes[2]}-${partes[0]}-${partes[1]}`
    }
  } else {
    // Convertir de mm/dd/YYYY a dd/mm/YYYY
    if (horaInicio) {
      return `${partes[2]}-${partes[1]}-${partes[0]} 00:00:00`
    } else if (horaFin) {
      return `${partes[2]}-${partes[1]}-${partes[0]} 23:59:59`
    } else {
      return `${partes[2]}-${partes[1]}-${partes[0]}`
    }
  }
}
/***************************************************************/
export function convertirAFechaTimestamp(fecha, hora) {
  if (!fecha) {
    return ''
  }

  const fechaStr = String(fecha)
  const horaStr = hora ? String(hora).trim() : '00:00:00'

  // Detectar el separador: / o -
  const separador = fechaStr.includes('/') ? '/' : '-'

  let dia, mes, anio
  const partes = fechaStr.split(separador).map(Number)

  if (partes.length < 3 || partes.some((p) => Number.isNaN(p))) {
    return ''
  }

  // Determinar el formato según la posición del año
  if (partes[0] > 31) {
    // Formato: yyyy-mm-dd
    ;[anio, mes, dia] = partes
  } else {
    // Formato: dd/mm/yyyy
    ;[dia, mes, anio] = partes
  }

  // Descomponer hora
  let horas, minutos, segundos
  let meridiano = null

  if (horaStr.includes(' ')) {
    let [horaParte, m] = horaStr.split(' ')
    meridiano = m.toLowerCase()
    ;[horas, minutos, segundos] = horaParte.split(':').map(Number)
  } else {
    ;[horas, minutos, segundos] = horaStr.split(':').map(Number)
  }

  horas = Number.isFinite(horas) ? horas : 0
  minutos = Number.isFinite(minutos) ? minutos : 0
  segundos = Number.isFinite(segundos) ? segundos : 0

  // Convertir AM/PM → 24 horas
  if (meridiano) {
    if (meridiano === 'pm' && horas < 12) horas += 12
    if (meridiano === 'am' && horas === 12) horas = 0
  }

  // Asegurar formato con dos dígitos
  mes = mes.toString().padStart(2, '0')
  dia = dia.toString().padStart(2, '0')
  horas = horas.toString().padStart(2, '0')
  minutos = minutos.toString().padStart(2, '0')
  segundos = segundos.toString().padStart(2, '0')

  // Crear timestamp estándar SQL
  const timestamp = `${anio}-${mes}-${dia} ${horas}:${minutos}:${segundos}`

  return timestamp
}

/***************************************************************/
export function esFechaEnRango(fechaObjetivo, fechaInicio, fechaFin) {
  // Convertir las fechas de formato timestamp a objetos Date
  const fechaObj = new Date(fechaObjetivo)
  const inicio = new Date(fechaInicio)
  const fin = new Date(fechaFin)

  // Comprobar si la fecha objetivo está entre la fecha de inicio y fin
  return fechaObj >= inicio && fechaObj <= fin
}
/***************************************************************/
export function formatearFecha(fecha) {
  const regex = /^(\d{2})\/(\d{2})\/(\d{4})$/
  if (!regex.test(fecha)) {
    let nuevaFecha = new Date(fecha)
    let dia = nuevaFecha.getDate().toString().padStart(2, '0')
    let mes = (nuevaFecha.getMonth() + 1).toString().padStart(2, '0') // Los meses empiezan desde 0
    let anio = nuevaFecha.getFullYear()
    return `${dia}/${mes}/${anio}`
  } else {
    return fecha
  }
}

/***************************************************************/
export function agregarDiasalaFechaActual(dias) {
  //RETORNA FECHA TIPO "15/01/2023";
  const date = new Date()
  const next_date = new Date(date.setDate(date.getDate() + dias))
  var incrementedDate = next_date.toISOString().slice(0, 10)
  var arrayFecha = incrementedDate.split('-')
  return arrayFecha[2] + '/' + arrayFecha[1] + '/' + arrayFecha[0]
}
/***************************************************************/
export function agregarDiasLaborablesalaFechaActual(
  dias,
  omitirSabado = false,
  omitirDomingo = true
) {
  const date = new Date()
  let diasAgregados = 0

  while (diasAgregados < dias) {
    date.setDate(date.getDate() + 1)
    const diaSemana = date.getDay()
    if ((diaSemana !== 0 || !omitirDomingo) && (diaSemana !== 6 || !omitirSabado)) {
      diasAgregados++
    }
  }

  const incrementedDate = date.toISOString().slice(0, 10)
  const arrayFecha = incrementedDate.split('-')
  return arrayFecha[2] + '/' + arrayFecha[1] + '/' + arrayFecha[0]
}
/***************************************************************/
export function agregarDiasAFecha(fecha, dias) {
  // Convierte la fecha de entrada en un objeto Date
  const dateParts = fecha.split('/') // Se asume formato "DD/MM/YYYY"
  const date = new Date(`${dateParts[2]}-${dateParts[1]}-${dateParts[0]}`)

  // Sumar los días a la fecha
  date.setDate(date.getDate() + dias)

  // Formatear la nueva fecha en "DD/MM/YYYY"
  const nuevaFecha = date.toISOString().slice(0, 10).split('-')
  return `${nuevaFecha[2]}/${nuevaFecha[1]}/${nuevaFecha[0]}`
}
/***************************************************************/
export function generarCodigoUnico(limite = 14) {
  const ahora = new Date()

  // Fecha y hora compacta: YYYYMMDDHHMMSSmmm
  const fecha =
    ahora.getFullYear().toString() +
    (ahora.getMonth() + 1).toString().padStart(2, '0') +
    ahora.getDate().toString().padStart(2, '0') +
    ahora.getHours().toString().padStart(2, '0') +
    ahora.getMinutes().toString().padStart(2, '0') +
    ahora.getSeconds().toString().padStart(2, '0') +
    ahora.getMilliseconds().toString().padStart(3, '0')

  // Tomar los primeros caracteres según el límite
  let codigo = fecha.substring(0, limite - 4)

  // Agregar 4 caracteres aleatorios al final
  for (let i = 0; i < 4; i++) {
    codigo += Math.random().toString(36).charAt(2).toUpperCase()
  }

  return codigo
}
/***************************************************************/
export function lenguajeDataTable() {
  return {
    processing: 'Procesando...',
    lengthMenu: 'Mostrar _MENU_ registros',
    zeroRecords: 'No se encontraron resultados',
    emptyTable: 'Ningún dato disponible en esta tabla',
    infoEmpty: 'Mostrando registros del 0 al 0 de un total de 0 registros',
    infoFiltered: '(filtrado de un total de _MAX_ registros)',
    search: 'Buscar:',
    infoThousands: ',',
    loadingRecords: 'Cargando...',
    paginate: {
      first: 'Primero',
      last: 'Último',
      next: 'Siguiente',
      previous: 'Anterior'
    },
    aria: {
      sortAscending: ': Activar para ordenar la columna de manera ascendente',
      sortDescending: ': Activar para ordenar la columna de manera descendente'
    },
    buttons: {
      copy: 'Copiar',
      colvis: 'Visibilidad',
      collection: 'Colección',
      colvisRestore: 'Restaurar visibilidad',
      copyKeys:
        'Presione ctrl o u2318 + C para copiar los datos de la tabla al portapapeles del sistema. <br \/> <br \/> Para cancelar, haga clic en este mensaje o presione escape.',
      copySuccess: {
        1: 'Copiada 1 fila al portapapeles',
        _: 'Copiadas %ds fila al portapapeles'
      },
      copyTitle: 'Copiar al portapapeles',
      csv: 'CSV',
      excel: 'Excel',
      pageLength: {
        '-1': 'Mostrar todas las filas',
        _: 'Mostrar %d filas'
      },
      pdf: 'PDF',
      print: 'Imprimir',
      renameState: 'Cambiar nombre',
      updateState: 'Actualizar',
      createState: 'Crear Estado',
      removeAllStates: 'Remover Estados',
      removeState: 'Remover',
      savedStates: 'Estados Guardados',
      stateRestore: 'Estado %d'
    },
    autoFill: {
      cancel: 'Cancelar',
      fill: 'Rellene todas las celdas con <i>%d<\/i>',
      fillHorizontal: 'Rellenar celdas horizontalmente',
      fillVertical: 'Rellenar celdas verticalmentemente'
    },
    decimal: ',',
    searchBuilder: {
      add: 'Añadir condición',
      button: {
        0: 'Constructor de búsqueda',
        _: 'Constructor de búsqueda (%d)'
      },
      clearAll: 'Borrar todo',
      condition: 'Condición',
      conditions: {
        date: {
          after: 'Despues',
          before: 'Antes',
          between: 'Entre',
          empty: 'Vacío',
          equals: 'Igual a',
          notBetween: 'No entre',
          notEmpty: 'No Vacio',
          not: 'Diferente de'
        },
        number: {
          between: 'Entre',
          empty: 'Vacio',
          equals: 'Igual a',
          gt: 'Mayor a',
          gte: 'Mayor o igual a',
          lt: 'Menor que',
          lte: 'Menor o igual que',
          notBetween: 'No entre',
          notEmpty: 'No vacío',
          not: 'Diferente de'
        },
        string: {
          contains: 'Contiene',
          empty: 'Vacío',
          endsWith: 'Termina en',
          equals: 'Igual a',
          notEmpty: 'No Vacio',
          startsWith: 'Empieza con',
          not: 'Diferente de',
          notContains: 'No Contiene',
          notStartsWith: 'No empieza con',
          notEndsWith: 'No termina con'
        },
        array: {
          not: 'Diferente de',
          equals: 'Igual',
          empty: 'Vacío',
          contains: 'Contiene',
          notEmpty: 'No Vacío',
          without: 'Sin'
        }
      },
      data: 'Data',
      deleteTitle: 'Eliminar regla de filtrado',
      leftTitle: 'Criterios anulados',
      logicAnd: 'Y',
      logicOr: 'O',
      rightTitle: 'Criterios de sangría',
      title: {
        0: 'Constructor de búsqueda',
        _: 'Constructor de búsqueda (%d)'
      },
      value: 'Valor'
    },
    searchPanes: {
      clearMessage: 'Borrar todo',
      collapse: {
        0: 'Paneles de búsqueda',
        _: 'Paneles de búsqueda (%d)'
      },
      count: '{total}',
      countFiltered: '{shown} ({total})',
      emptyPanes: 'Sin paneles de búsqueda',
      loadMessage: 'Cargando paneles de búsqueda',
      title: 'Filtros Activos - %d',
      showMessage: 'Mostrar Todo',
      collapseMessage: 'Colapsar Todo'
    },
    select: {
      cells: {
        1: '1 celda seleccionada',
        _: '%d celdas seleccionadas'
      },
      columns: {
        1: '1 columna seleccionada',
        _: '%d columnas seleccionadas'
      },
      rows: {
        1: '1 fila seleccionada',
        _: '%d filas seleccionadas'
      }
    },
    thousands: '.',
    datetime: {
      previous: 'Anterior',
      next: 'Proximo',
      hours: 'Horas',
      minutes: 'Minutos',
      seconds: 'Segundos',
      unknown: '-',
      amPm: ['AM', 'PM'],
      months: {
        0: 'Enero',
        1: 'Febrero',
        10: 'Noviembre',
        11: 'Diciembre',
        2: 'Marzo',
        3: 'Abril',
        4: 'Mayo',
        5: 'Junio',
        6: 'Julio',
        7: 'Agosto',
        8: 'Septiembre',
        9: 'Octubre'
      },
      weekdays: ['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab']
    },
    editor: {
      close: 'Cerrar',
      create: {
        button: 'Nuevo',
        title: 'Crear Nuevo Registro',
        submit: 'Crear'
      },
      edit: {
        button: 'Editar',
        title: 'Editar Registro',
        submit: 'Actualizar'
      },
      remove: {
        button: 'Eliminar',
        title: 'Eliminar Registro',
        submit: 'Eliminar',
        confirm: {
          _: '¿Está seguro que desea eliminar %d filas?',
          1: '¿Está seguro que desea eliminar 1 fila?'
        }
      },
      error: {
        system:
          'Ha ocurrido un error en el sistema (<a target="\\" rel="\\ nofollow" href="\\">Más información&lt;\\\/a&gt;).<\/a>'
      },
      multi: {
        title: 'Múltiples Valores',
        info: 'Los elementos seleccionados contienen diferentes valores para este registro. Para editar y establecer todos los elementos de este registro con el mismo valor, hacer click o tap aquí, de lo contrario conservarán sus valores individuales.',
        restore: 'Deshacer Cambios',
        noMulti: 'Este registro puede ser editado individualmente, pero no como parte de un grupo.'
      }
    },
    info: 'Mostrando _START_ a _END_ de _TOTAL_ registros',
    stateRestore: {
      creationModal: {
        button: 'Crear',
        name: 'Nombre:',
        order: 'Clasificación',
        paging: 'Paginación',
        search: 'Busqueda',
        select: 'Seleccionar',
        columns: {
          search: 'Búsqueda de Columna',
          visible: 'Visibilidad de Columna'
        },
        title: 'Crear Nuevo Estado',
        toggleLabel: 'Incluir:'
      },
      emptyError: 'El nombre no puede estar vacio',
      removeConfirm: '¿Seguro que quiere eliminar este %s?',
      removeError: 'Error al eliminar el registro',
      removeJoiner: 'y',
      removeSubmit: 'Eliminar',
      renameButton: 'Cambiar Nombre',
      renameLabel: 'Nuevo nombre para %s',
      duplicateError: 'Ya existe un Estado con este nombre.',
      emptyStates: 'No hay Estados guardados',
      removeTitle: 'Remover Estado',
      renameTitle: 'Cambiar Nombre Estado'
    }
  }
}
/***************************************************************/
export function navegacionDatos(objetos, puntoPartida) {
  const resultado = {
    primero: null,
    anterior: null,
    siguiente: null,
    ultimo: null
  }

  const totalObjetos = objetos.length

  if (totalObjetos === 0) {
    return resultado
  }

  resultado.primero = objetos[0].id
  resultado.ultimo = objetos[totalObjetos - 1].id

  const posicionPuntoPartida = objetos.findIndex((objeto) => objeto.id == puntoPartida)

  if (posicionPuntoPartida !== -1) {
    resultado.anterior =
      posicionPuntoPartida > 0
        ? objetos[(posicionPuntoPartida - 1 + totalObjetos) % totalObjetos].id
        : resultado.ultimo
    resultado.siguiente =
      posicionPuntoPartida < totalObjetos - 1
        ? objetos[(posicionPuntoPartida + 1) % totalObjetos].id
        : resultado.primero
  } else {
    return resultado
  }

  return resultado
}
/***************************************************************/
export function navegacion(boton, tabla) {
  var datosStorage = window.localStorage.getItem('datosArray')
  var datosServidor = JSON.parse(datosStorage)
  var datosNavegacion = navegacionDatos(datosServidor, getQueryVariable('id'))
  var datosID = datosNavegacion[boton]
  var datosPeticion = datosServidor.find((prod) => prod.id == datosID)

  //////////////////////////////////////////////////////////////////////////
  let campos = Object.keys(datosPeticion)
  campos.forEach((campo) => {
    $('#' + campo + '-Actualizador').val(datosPeticion[campo])
  })
  ///////////////////////////////////////////////////////////////////////////
  history.pushState(
    { id: datosPeticion.id },
    datosPeticion.id,
    'datos_' + tabla + '?id=' + datosPeticion.id
  )
  ///////////////////////////////////////////////////////////////////////////
  mensajetoast('Datos Cargados', 'Los datos Han sido cargado Exitosamente', 'success')
}
/***************************************************************/
export function navegacionPorFlechas(tabla = 'productos') {
  document.addEventListener('keydown', function (event) {
    if (event.key === 'ArrowRight') {
      event.preventDefault()
      navegacion('siguiente', tabla)
    }

    if (event.key === 'ArrowLeft') {
      event.preventDefault()
      navegacion('anterior', tabla)
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault()
      navegacion('ultimo', tabla)
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault()
      navegacion('primero', tabla)
    }
  })
}

/***************************************************************/
export async function logout(link, api, tokenCifrado, toast) {
  const verifica = window.localStorage.getItem('usuarioLocal')
  if (!verifica) {
    const router = useRouter()
    localStorage.clear()
    //router.push('/login');
  }

  const usuarioLocal = JSON.parse(verifica)[0]

  const datosCaja = await peticiones(
    `${link}${api}/datoscampo/registrocaja/turno/${usuarioLocal.token}`,
    {},
    'GET',
    tokenCifrado
  )
  const url = link + api + '/actualizarcampos/registrocaja'

  if (!datosCaja) {
    localStorage.clear()
    return
  }

  datosCaja.estado = 'Cerrada'
  datosCaja.updated_at = nfecha('timestamp')

  const envio = await peticiones(url, datosCaja, 'POST', tokenCifrado)

  if (envio[0] == 'ok') {
    mensajetoast(toast, 'Ok', 'Salio de la aplicación', 'success')
    localStorage.clear()
    //window.location.href = '/login'
  } else {
    mensajetoast(toast, 'Upps', 'Tenemos un error al Salir', 'error')
  }
}

/***************************************************************/
function compararVersiones(version1, version2) {
  const v1 = version1.split('.').map(Number)
  const v2 = version2.split('.').map(Number)
  const maxLength = Math.max(v1.length, v2.length)

  for (let i = 0; i < maxLength; i++) {
    const num1 = v1[i] || 0
    const num2 = v2[i] || 0

    if (num1 < num2) {
      return -1
    }
    if (num1 > num2) {
      return 1
    }
  }

  return 0
}

export async function buscarActualizaciones(linkActualizaciones, tokenCifrado, Swal) {
  try {
    const ultimoDato = await peticiones(
      `${linkActualizaciones}/ultimosx/version/1`,
      {},
      'GET',
      tokenCifrado
    )
    const versionActual = JSON.parse(window.localStorage.getItem('actualizaciones')) || {
      version: '1.0.0',
      cuando: 'AHORA'
    }

    if (
      ultimoDato.length > 0 &&
      compararVersiones(ultimoDato[0].version, versionActual.version) > 0 &&
      versionActual.cuando === 'AHORA'
    ) {
      Swal.fire({
        title: 'Actualizaciones Nuevas',
        text: 'Tienes una Actualización disponible',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Actualizar Ahora',
        cancelButtonText: 'Luego'
      }).then(async (result) => {
        if (result.isConfirmed) {
          const respuesta = await window.electron.ipcRenderer.invoke(
            'actualizarSistema',
            ultimoDato[0].archivo
          )
          console.log('respuesta', respuesta)
        } else if (result.dismiss === Swal.DismissReason.cancel) {
          window.localStorage.setItem(
            'actualizaciones',
            JSON.stringify([{ version: versionActual[0].version, cuando: 'LUEGO' }])
          )
        }
      })
    }
  } catch (error) {
    console.error('Error fetching updates:', error)
  }
}
/***************************************************************/
export async function peticionImagenUsuarios(link, api, location, tokenCifrado) {
  //const envio = await peticiones(link+api+'/peticionimagenes',{"origen":`../vista/img/usuarios/${location}`},'POST',tokenCifrado);
  const envio = await peticionesFetchOffline(
    'listarArchivosDeCarpeta',
    `../vista/img/usuarios/${location}`
  )

  if (envio) {
    return link + '/vista/img/usuarios/' + location + '/' + envio[0]
  } else {
    return link + '/vista/img/usuario.png'
  }
}
/***************************************************************/
export async function peticionImagen(link, api, carpeta, location, tokenCifrado, cantidad = 1) {
  const envio = await peticiones(
    link + api + '/peticionimagenes',
    { origen: `../vista/img/${carpeta}/${location}` },
    'POST',
    tokenCifrado
  )
  if (envio) {
    if (cantidad === 1) {
      return link + '/vista/img/' + carpeta + '/' + location + '/' + envio[0]
    } else {
      return envio
    }
  } else {
    return link + '/assets/icons/icon-512x512.png'
  }
}
/***************************************************************/
export function mensajetoast(toast, cabecera, mensaje, tipo, tiempo = 3000) {
  if (toast) {
    toast.add({ severity: tipo, summary: cabecera, detail: mensaje, life: tiempo })
  } else {
    console.error('No PrimeVue Toast provided!')
  }
}
/***************************************************************/
export async function verificaLocalStorage(
  link,
  tabla,
  full = true,
  nombre = '',
  cantidad = 'total'
) {
  const datos = window.localStorage.getItem(nombre)
  if (datos) {
    return JSON.parse(datos)
  } else {
    return await actualizarLocalStorage(link, tabla, full, nombre, cantidad)
  }
}
/***************************************************************/
async function obtenerTokenCifrado() {
  const usuarioLocal = JSON.parse(window.localStorage.getItem('usuarioLocal'))[0] || {}
  return await encryptarPassword(usuarioLocal.tokenaplicacion, 10)
}

async function obtenerDatos(tabla, link, cantidad) {
  const tokenCifrado = await obtenerTokenCifrado()
  if (cantidad === 'total') {
    return datosTabla(tabla)
  } else {
    return await peticiones(`${link}/ultimosx/${tabla}/${cantidad}`, {}, 'GET', tokenCifrado)
  }
}

export async function actualizarLocalStorage(
  link,
  tabla,
  full = true,
  nombre = '',
  cantidad = 'total'
) {
  if (full) {
    const todoslosDatos = await obtenerDatos(tabla, link, cantidad)
    window.localStorage.setItem(tabla, JSON.stringify(todoslosDatos))
  } else {
    const tokenCifrado = await obtenerTokenCifrado()
    const datosJSON = await peticiones(`${link}/datoscampo/${tabla}/id/1`, {}, 'GET', tokenCifrado)
    window.localStorage.setItem(nombre, JSON.stringify(datosJSON))
    return datosJSON
  }
}

/***************************************************************/
export async function pedidoNoElectron(envio) {
  if (envio === 'datosarchivo') {
    // Define the URL for the config.json file in the public directory
    const url = '/config.json'

    try {
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const json = await response.json()
      const isLocalDev =
        window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'

      if (isLocalDev && json.VITE_LINKURL === 'https://demo.tmposrd.com') {
        json.VITE_LINKURL = ''
      }

      return json
    } catch (error) {
      console.error('Error fetching the JSON file:', error)
      throw error // Propagate the error so the calling function can handle it
    }
  }
}
/***************************************************************/
export async function envioElectron(envio) {
  if (window.electron) {
    return await window.electron.ipcRenderer.invoke(envio)
  } else {
    return pedidoNoElectron(envio)
  }
}
/***************************************************************/
export function formatTo24HourTime(dateString) {
  const date = new Date(dateString)

  // Extraer horas, minutos y segundos de la fecha
  let hours = date.getUTCHours() + date.getTimezoneOffset() / -60
  let minutes = date.getUTCMinutes()
  let seconds = date.getUTCSeconds()

  // Ajustar horas a la zona horaria de Santo Domingo (UTC-4 en horario estándar)
  hours = (hours + 24) % 24 // Asegurarse de que las horas estén en 24 horas

  // Formatear a dos dígitos cada componente
  const formattedHours = String(hours).padStart(2, '0')
  const formattedMinutes = String(minutes).padStart(2, '0')
  const formattedSeconds = String(seconds).padStart(2, '0')

  return `${formattedHours}:${formattedMinutes}:${formattedSeconds}`
}
/***************************************************************/
export function generarCodigoAlfaNumerico(cantidad, prefijo = '') {
  const caracteres = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let codigo = prefijo

  for (let i = 0; i < cantidad; i++) {
    const indiceAleatorio = Math.floor(Math.random() * caracteres.length)
    codigo += caracteres.charAt(indiceAleatorio)
  }

  return codigo
}
/***************************************************************/
export function enviarDatosLocalStorage() {
  const todasLasEntradas = {}

  for (let i = 0; i < localStorage.length; i++) {
    const clave = localStorage.key(i)
    const valor = localStorage.getItem(clave)

    if (valor === null) continue // Saltar valores nulos

    try {
      // Intentar parsear como JSON
      const parseado = JSON.parse(valor)

      // Solo incluir si es un objeto o array válido
      if (typeof parseado === 'object' && parseado !== null) {
        todasLasEntradas[clave] = parseado
      }
    } catch (error) {
      // ❌ Si no se puede parsear, simplemente ignorarlo
      // console.warn(`Clave ignorada: ${clave} (no es JSON válido)`);
      continue
    }
  }

  return todasLasEntradas
}

/***************************************************************/
export async function ultimoRegistro(link, tabla) {
  const usuarioLocal = JSON.parse(window.localStorage.getItem('usuarioLocal'))[0]
  const tokenCifrado = await encryptarPassword(usuarioLocal.tokenaplicacion, 10)
  var registro = await peticiones(link + '/ultimosx/' + tabla + '/1', {}, 'GET', tokenCifrado)
  return registro
}
/***************************************************************/
export async function cajeroACtivo(link) {
  const usuarioLocal = JSON.parse(window.localStorage.getItem('usuarioLocal'))[0]
  const tokenCifrado = await encryptarPassword(usuarioLocal.tokenaplicacion, 10)
  let datosObtenidos = await peticiones(
    link + '/datosarraydoblecondicion/registrocaja',
    { campo1: 'estado', valor1: 'Abierta', campo2: 'fecha', valor2: nfecha('fecha') },
    'POST',
    tokenCifrado
  )

  if (datosObtenidos) {
    for (let datos of datosObtenidos) {
      if (datos.username != '') {
        let datosRetornado = await peticiones(
          link + '/datoscampo/usuarios/email/' + datos.username,
          {},
          'GET',
          tokenCifrado
        )
        if (datosRetornado.nivel_seguridad === 'Cajero') {
          return datos
        }
      }
    }
  }

  // Si no se encontró Cajero en el bucle, realizar otra petición adicional
  let datosRetornadoAuxiliar = await peticiones(
    link + '/datoscampo/registrocaja/turno/' + usuarioLocal.token,
    {},
    'GET',
    tokenCifrado
  )

  // Verificar si se obtuvieron datos en la segunda petición
  if (datosRetornadoAuxiliar) {
    return datosRetornadoAuxiliar
  } else {
    // En caso de no encontrar Cajero, devolver un objeto indicando que no se encontró
    return { mensaje: 'Error: No se encontró Cajero.' }
  }
}
/***************************************************************/
export function variableEnString(str, data) {
  if (typeof str === 'string' && data instanceof Array) {
    return str.replace(/({\d})/g, function (i) {
      return data[i.replace(/{/, '').replace(/}/, '')]
    })
  } else if (typeof str === 'string' && data instanceof Object) {
    if (Object.keys(data).length === 0) {
      return str
    }

    for (let key in data) {
      return str.replace(/({([^}]+)})/g, function (i) {
        let key = i.replace(/{/, '').replace(/}/, '')
        if (!data[key]) {
          return i
        }

        return data[key]
      })
    }
  } else if (
    (typeof str === 'string' && data instanceof Array === false) ||
    (typeof str === 'string' && data instanceof Object === false)
  ) {
    return str
  } else {
    return false
  }
}
/***************************************************************/
export function esObjeto(variable) {
  return variable !== null && typeof variable === 'object' && !Array.isArray(variable)
}
/***************************************************************/
export async function buscarDatosIMEI(
  servicio,
  imeiConsulta,
  tokenCifrado,
  toast,
  Swal,
  mostrar = true
) {
  try {
    const imei = (imeiConsulta || '').trim()

    if (!imei) {
      toast?.add?.({
        severity: 'error',
        summary: 'Error',
        detail: 'Debe escribir un IMEI válido',
        life: 3000
      })
      return null
    }

    // ✅ Pegándole a TU backend (recomendado)
    const apiBase =
      window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
        ? '/api2'
        : 'https://demo.tmposrd.com/api2'
    const response = await fetch(`${apiBase}/consultaimei`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `${tokenCifrado}`
      },
      body: JSON.stringify({
        servicio: String(servicio ?? '0'),
        imei
      })
    })

    if (!response.ok) {
      throw new Error(`Error HTTP al consultar IMEI: ${response.status}`)
    }

    const res = await response.json()

    // ✅ Tu estructura real:
    // res.status === "success"
    // res.response.success === true
    const ok = res?.status === 'success' && res?.response?.success === true

    if (ok) {
      const obj = res.response.object || {}

      if (mostrar) {
        const formattedData = Object.entries(obj)
          .map(
            ([k, v]) => `
            <tr>
              <td style="padding:8px; text-align:left;"><strong>${k}:</strong></td>
              <td style="padding:8px; text-align:left;">${v ?? ''}</td>
            </tr>
          `
          )
          .join('')

        await Swal.fire({
          title: 'Datos del IMEI',
          html: `
            <table style="width:100%; border-collapse:collapse;">
              ${formattedData}
            </table>
          `,
          icon: 'success',
          confirmButtonText: 'Cerrar'
        })

        return obj // por si quieres usarlo luego
      } else {
        toast?.add?.({
          severity: 'success',
          summary: 'Ok',
          detail: 'Datos encontrados',
          life: 3000
        })
        return obj
      }
    }

    // ❌ No OK
    toast?.add?.({
      severity: 'error',
      summary: 'Error',
      detail: res?.response?.status || 'No se encuentran Datos o el IMEI no existe',
      life: 3000
    })

    return null
  } catch (error) {
    console.error('❌ Error en buscarDatosIMEI:', error)
    toast?.add?.({
      severity: 'error',
      summary: 'Error',
      detail: error?.message || 'Error de petición',
      life: 3000
    })
    return null
  }
}

/***************************************************************/
export function descifrar64(claveCifrada) {
  var ciphertext = atob(claveCifrada)

  return ciphertext
}
/***************************************************************/
export function generateMicrosoftStyleLicense(licenseLength = 25) {
  // Define characters that can appear in the license key
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  const blockSize = 5
  const separator = '-'

  let license = ''

  for (let i = 0; i < licenseLength; i++) {
    if (i > 0 && i % blockSize === 0) {
      license += separator
    }
    const randomIndex = Math.floor(Math.random() * chars.length)
    license += chars[randomIndex]
  }

  return license
}
/***************************************************************/
export async function crearTablaSiNoExiste(
  link,
  api,
  tabla,
  campos,
  tokenCifrado,
  toast = null // default value set to null
) {
  try {
    // Verify if the table exists
    const verificaTabla = await peticionesFetch(
      `${link}${api}`,
      `verificatabla/${tabla}`,
      {}, // No payload for GET request
      tokenCifrado,
      'GET'
    )

    if (verificaTabla[0] === 'error') {
      // Create the table if it doesn't exist
      const crearTabla = await peticionesFetch(
        `${link}${api}`,
        `creartabla/${tabla}`,
        {}, // No payload for GET request
        tokenCifrado,
        'GET'
      )

      if (crearTabla[0] === 'ok') {
        if (toast) {
          toast.add({
            severity: 'success',
            summary: 'Éxito',
            detail: 'Tabla creada correctamente',
            life: 3000
          })

          toast.add({
            severity: 'warn',
            summary: 'Advertencia',
            detail: 'Agregando campos faltantes...',
            life: 3000
          })
        }

        // Add missing fields to the new table
        if (Array.isArray(campos)) {
          campos.reverse() // Ensure fields are added in the correct order
          for (const campo of campos) {
            if (campo !== 'actions') {
              const envio = await peticionesFetch(
                `${link}${api}`,
                'agregarcampodb',
                { tabla: tabla, campo: campo, despuesde: 'id' },
                tokenCifrado,
                'POST'
              )
              if (envio[0] !== 'ok') {
                return envio
              }
            }
          }

          if (toast) {
            toast.add({
              severity: 'success',
              summary: 'Éxito',
              detail: 'Todos los campos fueron agregados exitosamente.',
              life: 3000
            })
          }
          return ['ok']
        } else {
          // If 'campos' is not an array, add the single field if it's not "actions"
          if (campos !== 'actions') {
            const envio = await peticionesFetch(
              `${link}${api}`,
              'agregarcampodb',
              { tabla: tabla, campo: campos, despuesde: 'id' },
              tokenCifrado,
              'POST'
            )
            if (toast) {
              toast.add({
                severity: 'success',
                summary: 'Éxito',
                detail: 'Campo agregado exitosamente.',
                life: 3000
              })
            }
            return envio
          }
        }
      }
    } else {
      // Table exists, check for missing fields
      const array = await peticionesFetch(
        `${link}${api}`,
        `campos/${tabla}`,
        {}, // No payload for GET request
        tokenCifrado,
        'GET'
      )

      if (Array.isArray(campos)) {
        const missingCampos = campos.filter(
          (campo) => !array.includes(campo) && campo !== 'actions' // Exclude "actions"
        )

        if (missingCampos.length > 0) {
          if (toast) {
            toast.add({
              severity: 'warn',
              summary: 'Advertencia',
              detail: 'Agregando campos faltantes...',
              life: 3000
            })
          }

          for (const campo of missingCampos) {
            const envio = await peticionesFetch(
              `${link}${api}`,
              'agregarcampodb',
              { tabla: tabla, campo: campo, despuesde: 'id' },
              tokenCifrado,
              'POST'
            )

            if (envio[0] !== 'ok') {
              return envio
            }
          }

          if (toast) {
            toast.add({
              severity: 'success',
              summary: 'Éxito',
              detail: 'Campos agregados correctamente',
              life: 3000
            })
          }
        }
      } else {
        if (!array.includes(campos) && campos !== 'actions') {
          const envio = await peticionesFetch(
            `${link}${api}`,
            'agregarcampodb',
            { tabla: tabla, campo: campos, despuesde: 'id' },
            tokenCifrado,
            'POST'
          )
          if (toast) {
            toast.add({
              severity: 'success',
              summary: 'Éxito',
              detail: 'Campo agregado exitosamente.',
              life: 3000
            })
          }
          return envio
        }
      }

      return ['ok']
    }
  } catch (error) {
    console.error('Error in crearTablaSiNoExiste:', error)
    throw error // Rethrow the error after logging it
  }
}

/***************************************************************/
export async function crearTransferencia(
  link,
  api,
  token,
  toast,
  numero,
  cantidad,
  banco,
  cliente,
  empresa
) {
  let ultimaTransaccion = 0
  const ultimaTransacciones = await peticionesFetch(
    `${link}${api}`,
    `datosarray/transaccionesbancarias`,
    {},
    token,
    'GET'
  )

  const datosBanco = await peticionesFetch(
    `${link}${api}`,
    `datoscampo/banco/id/${banco.id}`,
    {},
    token,
    'GET'
  )

  if (Array.isArray(ultimaTransacciones) && ultimaTransacciones.length > 0) {
    ultimaTransaccion = ultimaTransacciones[ultimaTransacciones.length - 1].balance_actual || 0
  } else {
    ultimaTransaccion = 0
  }

  const camposTransferencia = await arrayToObjetoFromTabla(
    link + api,
    token,
    'transaccionesbancarias'
  )

  const url = link + api + '/insertar/transaccionesbancarias'
  if (!camposTransferencia) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Datos incompletos, no se puede Enviar.',
      life: 3000
    })
    return
  }
  if (camposTransferencia.hasOwnProperty('created_at')) {
    camposTransferencia.created_at = nfecha('timestamp')
    camposTransferencia.updated_at = nfecha('timestamp')
  }

  //const balanceActual = (parseFloat(ultimaTransaccion) + parseFloat(cantidad)).toFixed(2);
  const balanceActual = (parseFloat(datosBanco.saldo) + parseFloat(cantidad)).toFixed(2)

  camposTransferencia.balance_anterior = datosBanco.saldo
  camposTransferencia.balance_actual = balanceActual
  camposTransferencia.monto = parseFloat(cantidad).toFixed(2)
  camposTransferencia.metodo = 'TRANSFERENCIA'
  camposTransferencia.tipo = 'TRANSFERENCIA'
  camposTransferencia.depositante = cliente
  camposTransferencia.estado = 'COMPLETADA'
  camposTransferencia.fecha = nfecha('fecha')
  camposTransferencia.hora = nfecha('hora')
  camposTransferencia.beneficiario = empresa
  camposTransferencia.descripcion = 'TRANSFERENCIA REALIZADA POR VENTA (' + numero + ')'
  camposTransferencia.cuenta_origen = 'VENTA (' + numero + ')-' + cliente
  camposTransferencia.cuenta_destino = banco.cuenta

  const envioDatos = await enviarDatosPorPost(url, camposTransferencia, token)
  if (envioDatos[0] == 'ok') {
    const urlBanco = link + api + '/actualizarcampos/banco'
    if (!banco) {
      console.error('Datos incompletos, no se puede actualizar.')
      return
    }
    if (banco.hasOwnProperty('created_at')) {
      banco.updated_at = nfecha('timestamp')
    }
    banco.saldo = parseFloat(datosBanco.saldo) + parseFloat(cantidad)
    const envioDatosBanco = await enviarDatosPorPost(urlBanco, banco, token)

    return ['ok']
  } else {
    return ['error']
  }
}
/***************************************************************/
export async function asientoDiario(
  link,
  api,
  token,
  toast,
  debito,
  credito,
  cantidad,
  descripcion
) {
  let ultimaTransaccion = '00000001'
  let camposAsientoDiario = {}
  const ultimaTransacciones = await peticionesFetch(
    `${link}${api}`,
    `datosarray/asientodiario`,
    {},
    token,
    'GET'
  )

  if (Array.isArray(ultimaTransacciones) && ultimaTransacciones.length > 0) {
    const lastNumber =
      parseFloat(ultimaTransacciones[ultimaTransacciones.length - 1].numero) + 1 || 1
    ultimaTransaccion = lastNumber.toString().padStart(8, '0')
    camposAsientoDiario = extraerCamposDeObjeto(ultimaTransacciones[ultimaTransacciones.length - 1])
  } else {
    camposAsientoDiario = await arrayToObjetoFromTabla(link + api, token, 'asientodiario')
  }

  const url = link + api + '/insertar/asientodiario'

  const asientoJSON = {
    debito: debito,
    cantidadDebito: cantidad,
    credito: credito,
    cantidadCredito: cantidad
  }

  camposAsientoDiario.numero = ultimaTransaccion
  camposAsientoDiario.fecha = nfecha('fecha')
  camposAsientoDiario.hora = nfecha('hora')
  camposAsientoDiario.asiento = JSON.stringify([asientoJSON])
  camposAsientoDiario.descripcion = descripcion
  camposAsientoDiario.usuario = ''

  const envioDatos = await enviarDatosPorPost(url, camposAsientoDiario, token)
  if (envioDatos[0] == 'ok') {
    return ['ok']
  } else {
    return ['error']
  }
}
/*************************************************************************/
/***************************************************************/
export async function verificaTablaOffline(tabla) {
  const response = await peticionesFetchOffline('tableExists', `${tabla}`)
  return response
}
/***************************************************************/
export async function verificaTablaOfflineRED(tabla) {
  const response = await peticionesFetchOfflineRED('tableExists', `${tabla}`)
  return response
}
/***************************************************************/
export async function agregarTabla(tabla, campos) {
  return await peticionesFetchOffline('crearTabla', tabla, campos)
}
/***************************************************************/
export async function agregarTablaRED(tabla, campos) {
  return await peticionesFetchOfflineRED('crearTabla', tabla, campos)
}
/***************************************************************/
export async function camposTabla(tabla) {
  const campos = await peticionesFetchOffline('getTableColumns', tabla)
  return campos
}
/***************************************************************/
export async function camposTablaRED(tabla) {
  const campos = await peticionesFetchOfflineRED('getTableColumns', tabla)
  return campos
}
/***************************************************************/
export async function agregarCamposTabla(tabla, campos) {
  let todosExitosos = true

  for (let campo of campos) {
    const res = await peticionesFetchOffline('addColumnToTable', {
      tabla,
      campo
    })

    if (!res || res[0] !== 'ok') {
      todosExitosos = false
      console.error(`❌ Error al agregar el campo "${campo}"`, res)
    }
  }

  return todosExitosos
}
/***************************************************************/
export async function agregarCamposTablaRED(tabla, campos) {
  let todosExitosos = true

  for (let campo of campos) {
    const res = await peticionesFetchOfflineRED('addColumnToTable', {
      tabla,
      campo
    })

    if (!res || res[0] !== 'ok') {
      todosExitosos = false
      console.error(`❌ Error al agregar el campo "${campo}"`, res)
    }
  }

  return todosExitosos
}
/***************************************************************/
export async function sincronizarStockProductoPorImeiDisponible(idProducto) {
  try {
    if (idProducto === null || idProducto === undefined || `${idProducto}`.trim() === '') {
      throw new Error('Debe enviar un id de producto valido')
    }

    const producto = await peticionesFetchOffline('getDataByField', 'productos', 'id', idProducto)
    if (!producto) {
      return {
        success: false,
        stock: 0,
        message: `No se encontro el producto con id ${idProducto}`
      }
    }

    const imeisDisponibles = await peticionesFetchOffline(
      'getDataByDoubleCondition',
      'imei',
      'id_equi',
      idProducto,
      'estado',
      'DISPONIBLE'
    )

    const nuevoStock = Array.isArray(imeisDisponibles) ? imeisDisponibles.length : 0

    producto.stock = nuevoStock
    if (producto.hasOwnProperty('updated_at')) {
      producto.updated_at = nfecha('timestamp')
    }

    const actualizado = await peticionesFetchOffline('updateData', 'productos', JSON.stringify(producto))
    const ok = Array.isArray(actualizado) ? actualizado[0] === 'ok' : !!actualizado

    return {
      success: ok,
      stock: nuevoStock,
      producto,
      response: actualizado
    }
  } catch (error) {
    console.error('Error sincronizando stock por IMEI disponible:', error)
    return {
      success: false,
      stock: 0,
      message: error.message || 'Error al sincronizar stock'
    }
  }
}
/***************************************************************/
export function buscadorArrayObjeto(campo, valor, array, retorno = null) {
  const datos = array.find((dato) => dato[campo] === valor)
  if (retorno) {
    return datos[retorno]
  } else {
    return datos
  }
}
/***************************************************************/
export async function crearTablaSiNoExisteOfflineRED(tabla, campos, toast) {
  const datos = await verificaTablaOfflineRED(tabla)
  if (datos[0] === 'ok') {
    const camposT = await camposTablaRED(tabla)
    if (typeof campos === 'string') {
      campos = campos.split(',').map((c) => c.trim())
    }
    if (campos) {
      const camposFaltantes = campos.filter((campo) => !camposT.includes(campo))
      if (camposFaltantes.length > 0) {
        if (toast) {
          toast.add({
            severity: 'warn',
            summary: 'Upps',
            detail: `Agregando Campos faltantes: ${camposFaltantes.join(', ')} ...`,
            life: 3000
          })
        }
        const agregarCampo = await agregarCamposTablaRED(tabla, camposFaltantes)
        if (agregarCampo) {
          toast.add({
            severity: 'success',
            summary: 'Genial',
            detail: 'Campos agregados con éxito',
            life: 3000
          })
        }
      } else {
        console.log('Todos los campos están presentes')
      }
    }
  } else {
    const createtable = await agregarTablaRED(tabla, campos)
    if (createtable.success) {
      toast.add({
        severity: 'success',
        summary: 'Genial',
        detail: 'Tabla creada con éxito',
        life: 3000
      })
    } else {
      toast.add({
        severity: 'error',
        summary: 'Upps',
        detail: 'Nos e pudo Crear la Tabla',
        life: 3000
      })
    }
  }
  return datos
}
/***************************************************************/
export async function crearTablaSiNoExisteOffline(tabla, campos, toast) {
  const datos = await verificaTablaOffline(tabla)
  if (datos[0] === 'ok') {
    const camposT = await camposTabla(tabla)
    if (typeof campos === 'string') {
      campos = campos.split(',').map((c) => c.trim())
    }
    if (campos) {
      const camposFaltantes = campos.filter((campo) => !camposT.includes(campo))
      if (camposFaltantes.length > 0) {
        if (toast) {
          toast.add({
            severity: 'warn',
            summary: 'Upps',
            detail: `Agregando Campos faltantes: ${camposFaltantes.join(', ')} ...`,
            life: 3000
          })
        }
        const agregarCampo = await agregarCamposTabla(tabla, camposFaltantes)
        if (agregarCampo) {
          toast.add({
            severity: 'success',
            summary: 'Genial',
            detail: 'Campos agregados con éxito',
            life: 3000
          })
        }
      } else {
        console.log('Todos los campos están presentes')
      }
    }
  } else {
    const createtable = await agregarTabla(tabla, campos)
    if (createtable.success) {
      toast.add({
        severity: 'success',
        summary: 'Genial',
        detail: 'Tabla creada con éxito',
        life: 3000
      })
    } else {
      toast.add({
        severity: 'error',
        summary: 'Upps',
        detail: 'Nos e pudo Crear la Tabla',
        life: 3000
      })
    }
  }
  return datos
}
/***************************************************************/
export async function arrayToObjetoFromTablaOffline(tabla, quitarPrimero = true) {
  try {
    // Obtener los datos de la tabla
    const array = await peticionesFetchOffline('getTableColumns', `${tabla}`)

    // Quitar el primer elemento si quitarPrimero es verdadero
    if (quitarPrimero) {
      array.shift()
    }

    // Convertir el array en un objeto
    const miObjeto = array.reduce((obj, elemento) => {
      obj[elemento] = ''
      return obj
    }, {})

    return miObjeto
  } catch (error) {
    console.error('Error in arrayToObjetoFromTabla:', error)
    if (toast) {
      toast.error(`Error: ${error.message}`)
    }
    throw error // Rethrow the error after logging it
  }
}
/*************************************************************************/
