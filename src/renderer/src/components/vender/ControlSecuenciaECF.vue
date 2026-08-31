<template>
  <span class="hidden" aria-hidden="true"></span>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import {
  crearTablaSiNoExisteOffline,
  esRespuestaOperacionExitosa,
  nfecha,
  peticionesFetchOffline
} from '@/funciones/funciones.js'

const TABLA_RESERVAS_ECF = 'reservas_comprobantes_electronicos'
const CAMPOS_RESERVAS_ECF = [
  'token_reserva',
  'prefijo',
  'secuencia',
  'encf',
  'no_factura',
  'ambiente',
  'rnc_emisor',
  'estado',
  'alanube_id',
  'usuario',
  'almacen',
  'motivo',
  'fecha_reserva',
  'fecha_emision'
]

const inicializado = ref(false)
let promesaInicializacion = null

const normalizarPrefijo = (valor) =>
  String(valor || '')
    .trim()
    .toUpperCase()
const normalizarAmbiente = (valor) =>
  String(valor || 'sandbox')
    .trim()
    .toLowerCase()
const normalizarRnc = (valor) => String(valor || '').replace(/\D/g, '')
const numeroSecuencia = (valor) => {
  const numero = Number(valor)
  return Number.isFinite(numero) && numero > 0 ? Math.trunc(numero) : 0
}

const crearTokenReserva = () => {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID()
  return `${Date.now()}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`
}

const inicializar = async () => {
  if (inicializado.value) return true
  if (promesaInicializacion) return await promesaInicializacion

  promesaInicializacion = (async () => {
    const resultado = await crearTablaSiNoExisteOffline(TABLA_RESERVAS_ECF, CAMPOS_RESERVAS_ECF)
    const disponible = resultado?.[0] === 'ok' || resultado?.success === true
    if (!disponible) {
      throw new Error('No se pudo preparar la tabla central de reservas e-CF.')
    }
    inicializado.value = true
    return true
  })()

  try {
    return await promesaInicializacion
  } finally {
    promesaInicializacion = null
  }
}

const cargarReservas = async () => {
  await inicializar()
  const filas = await peticionesFetchOffline('getDataAsArray', TABLA_RESERVAS_ECF)
  if (!Array.isArray(filas)) {
    throw new Error('No se pudo consultar la tabla central de reservas e-CF.')
  }
  return filas
}

const perteneceAlMismoRango = (reserva, { prefijo, ambiente, rncEmisor }) =>
  normalizarPrefijo(reserva?.prefijo) === normalizarPrefijo(prefijo) &&
  normalizarAmbiente(reserva?.ambiente) === normalizarAmbiente(ambiente) &&
  normalizarRnc(reserva?.rnc_emisor) === normalizarRnc(rncEmisor)

const obtenerSiguienteDisponible = async ({
  prefijo,
  ambiente,
  rncEmisor,
  secuenciaMinima = 1
}) => {
  const reservas = await cargarReservas()
  const mayorReservada = reservas
    .filter((reserva) => perteneceAlMismoRango(reserva, { prefijo, ambiente, rncEmisor }))
    .reduce((mayor, reserva) => Math.max(mayor, numeroSecuencia(reserva.secuencia)), 0)

  return Math.max(numeroSecuencia(secuenciaMinima) || 1, mayorReservada + 1)
}

const reservarSecuencia = async ({
  prefijo,
  ambiente,
  rncEmisor,
  secuenciaMinima,
  secuenciaFinal,
  noFactura,
  usuario,
  almacen
}) => {
  const prefijoNormalizado = normalizarPrefijo(prefijo)
  const secuencia = await obtenerSiguienteDisponible({
    prefijo: prefijoNormalizado,
    ambiente,
    rncEmisor,
    secuenciaMinima
  })
  const limite = numeroSecuencia(secuenciaFinal)
  if (limite > 0 && secuencia > limite) {
    throw new Error(
      `No quedan secuencias ${prefijoNormalizado} disponibles en el rango autorizado.`
    )
  }

  const tokenReserva = crearTokenReserva()
  const payload = {
    token_reserva: tokenReserva,
    prefijo: prefijoNormalizado,
    secuencia: String(secuencia),
    encf: `${prefijoNormalizado}${String(secuencia).padStart(10, '0')}`,
    no_factura: String(noFactura || ''),
    ambiente: normalizarAmbiente(ambiente),
    rnc_emisor: normalizarRnc(rncEmisor),
    estado: 'RESERVADA',
    alanube_id: '',
    usuario: String(usuario || ''),
    almacen: String(almacen || ''),
    motivo: '',
    fecha_reserva: nfecha('timestamp'),
    fecha_emision: ''
  }

  const resultado = await peticionesFetchOffline(
    'insertData',
    TABLA_RESERVAS_ECF,
    JSON.stringify(payload)
  )
  if (!esRespuestaOperacionExitosa(resultado)) {
    throw new Error(`No se pudo reservar ${payload.encf} en la tabla central.`)
  }

  return payload
}

const actualizarReserva = async (reserva, cambios = {}) => {
  if (!reserva?.token_reserva) return false
  await inicializar()
  const registro = await peticionesFetchOffline(
    'getDataByField',
    TABLA_RESERVAS_ECF,
    'token_reserva',
    reserva.token_reserva
  )
  if (!registro?.id) return false

  const actualizado = { ...registro, ...cambios }
  if (Object.prototype.hasOwnProperty.call(actualizado, 'updated_at')) {
    actualizado.updated_at = nfecha('timestamp')
  }

  const resultado = await peticionesFetchOffline(
    'updateData',
    TABLA_RESERVAS_ECF,
    JSON.stringify(actualizado)
  )
  return esRespuestaOperacionExitosa(resultado)
}

const marcarEmitida = async (reserva, { encf, alanubeId } = {}) =>
  await actualizarReserva(reserva, {
    estado: 'EMITIDA',
    encf: String(encf || reserva?.encf || '').toUpperCase(),
    alanube_id: String(alanubeId || ''),
    motivo: '',
    fecha_emision: nfecha('timestamp')
  })

const marcarIncidencia = async (reserva, estado, motivo = '') =>
  await actualizarReserva(reserva, {
    estado: String(estado || 'ERROR').toUpperCase(),
    motivo: String(motivo || '').slice(0, 1000)
  })

const puedeRecuperarDocumento = async ({ encf, noFactura }) => {
  const reservas = await cargarReservas()
  const numero = String(encf || '')
    .trim()
    .toUpperCase()
  const coincidencias = reservas.filter(
    (reserva) =>
      String(reserva?.encf || '')
        .trim()
        .toUpperCase() === numero
  )
  if (!coincidencias.length) return false

  const facturaActual = String(noFactura || '')
  return coincidencias.every((reserva) => String(reserva?.no_factura || '') === facturaActual)
}

onMounted(() => {
  inicializar().catch((error) => {
    console.error('No se pudo inicializar el control central de secuencias e-CF:', error)
  })
})

defineExpose({
  inicializar,
  reservarSecuencia,
  obtenerSiguienteDisponible,
  marcarEmitida,
  marcarIncidencia,
  puedeRecuperarDocumento
})
</script>
