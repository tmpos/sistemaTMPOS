const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

let link = null
let api = null
let tokenCifrado = null
let intervaloId = null
let erroresConsecutivos = 0

const nfecha = () => {
  const hoy = new Date()
  const inicio = new Date(hoy)
  const fin = new Date(hoy)
  inicio.setHours(0, 0, 0, 0)
  fin.setHours(23, 59, 59, 999)
  return {
    fechainicio: inicio.toISOString().slice(0, 19).replace('T', ' '),
    fechafin: fin.toISOString().slice(0, 19).replace('T', ' ')
  }
}

const peticionesFetch = async (url, endpoint, data, token, metodo = 'POST') => {
  const res = await fetch(`${url}${endpoint}`, {
    method: metodo,
    headers: {
      'Content-Type': 'application/json',
      Authorization: token ? `${token}` : ''
    },
    body: JSON.stringify(data)
  })

  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return await res.json()
}

const ejecutarPolling = async () => {
  try {
    const fecha = nfecha()
    const resultado = await peticionesFetch(
      `${link}${api}`,
      '/datostimestamp',
      {
        campo: 'created_at',
        fechainicio: fecha.fechainicio,
        fechafin: fecha.fechafin,
        tabla: 'notificaciones'
      },
      tokenCifrado,
      'POST'
    )

    erroresConsecutivos = 0

    if (resultado && resultado.length > 0) {
      postMessage({ tipo: 'alerta', data: resultado })
    }
  } catch (err) {
    erroresConsecutivos++
    const tiempoBackoff = Math.min(erroresConsecutivos * 15000, 120000)
    postMessage({ tipo: 'error', mensaje: err.message })

    if (intervaloId) clearInterval(intervaloId)
    intervaloId = setInterval(ejecutarPolling, tiempoBackoff)
  }
}

onmessage = async (e) => {
  const config = e.data
  tokenCifrado = config.token
  link = config.link
  api = config.api

  if (intervaloId) clearInterval(intervaloId)

  ejecutarPolling()
  intervaloId = setInterval(ejecutarPolling, 60000)
}

onclose = () => {
  if (intervaloId) clearInterval(intervaloId)
}
