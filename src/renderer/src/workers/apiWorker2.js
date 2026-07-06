let link = ''
let api = ''
let token = ''

const peticionesFetch = async (endpoint, data = {}, metodo = 'POST') => {
  let url = `${link}${api}${endpoint}`
  const options = {
    method: metodo.toUpperCase(),
    headers: {
      'Content-Type': 'application/json',
      Authorization: token ? `${token}` : ''
    }
  }

  if (options.method === 'GET') {
    // Convertir data en query params si hay datos
    const query = new URLSearchParams(data).toString()
    if (query) {
      url += (url.includes('?') ? '&' : '?') + query
    }
  } else {
    // Para POST, PUT, etc.
    options.body = JSON.stringify(data)
  }

  const res = await fetch(url, options)
  if (!res.ok) throw new Error(`Error HTTP ${res.status}`)
  return await res.json()
}

onmessage = async (e) => {
  const { tipo, payload } = e.data

  try {
    if (tipo === 'configurar') {
      link = payload.link
      api = payload.api
      token = payload.token
      postMessage({ tipo: 'listo' })
    } else if (tipo === 'consultar') {
      const { endpoint, datos, metodo } = payload
      const respuesta = await peticionesFetch(endpoint, datos, metodo)
      postMessage({ tipo: 'resultado', respuesta })
    } else {
      postMessage({ tipo: 'error', mensaje: 'Tipo desconocido' })
    }
  } catch (err) {
    postMessage({ tipo: 'error', mensaje: err.message })
  }
}
