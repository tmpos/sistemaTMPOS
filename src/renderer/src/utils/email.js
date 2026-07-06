// utils/email.js
import axios from 'axios'

/**
 * Envía un correo vía tu endpoint /email.
 * @param {Object} opts
 * @param {string|string[]} opts.mailto              Destinatario(s)
 * @param {string} [opts.subjet='Mensaje del sistema']
 * @param {string} [opts.mensaje='Sin contenido']
 * @param {string} [opts.albody]                     HTML alternativo (fallback al mensaje)
 * @param {File|Blob} [opts.file]                    Un adjunto
 * @param {Array<File|Blob>} [opts.files]            Adjuntos múltiples (opcional)
 * @param {string} [opts.filename]                   Nombre del adjunto si usas Blob
 * @param {string} opts.apiBase                      Base de tu API, ej: 'http://localhost:3050/api'
 * @param {string} opts.token                        Token de autorización
 * @param {(p:number)=>void} [opts.onProgress]       Callback de progreso (0-100)
 * @returns {Promise<{ok:boolean, data:any}>}
 */
export async function enviarCorreoAPI(opts) {
  const {
    mailto,
    subjet = 'Mensaje del sistema',
    mensaje = 'Sin contenido',
    albody,
    file,
    files,
    filename,
    apiBase,
    token,
    onProgress,
    empresa
  } = opts || {}

  if (!apiBase) throw new Error('Falta apiBase')
  if (!token) throw new Error('Falta token')
  if (!mailto || (Array.isArray(mailto) && mailto.length === 0)) {
    throw new Error('Falta el destinatario (mailto)')
  }

  const formData = new FormData()
  formData.append('mailto', Array.isArray(mailto) ? mailto.join(',') : mailto)
  formData.append('subjet', subjet)
  formData.append('mensaje', mensaje)
  formData.append('albody', albody ?? mensaje)
  if (empresa) {
    formData.append('empresa', empresa)
  }
  // Un archivo
  if (file) {
    const f = toFileIfNeeded(file, filename)
    formData.append('file', f, f.name ?? filename ?? 'adjunto')
  }

  // Múltiples archivos (si tu backend acepta múltiples campos "file")
  if (Array.isArray(files) && files.length) {
    for (const [i, fRaw] of files.entries()) {
      const f = toFileIfNeeded(fRaw, filename ?? `adjunto-${i + 1}`)
      formData.append('file', f, f.name ?? `adjunto-${i + 1}`)
    }
  }

  // const url = `${apiBase}/email`;
  const url =
    window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
      ? `/api2/email`
      : `https://demo.tmposrd.com/api2/email`

  const { data } = await axios.post(url, formData, {
    headers: {
      Authorization: token,
      'Content-Type': 'multipart/form-data'
    },
    onUploadProgress: (evt) => {
      if (onProgress && evt.total) {
        onProgress(Math.round((evt.loaded * 100) / evt.total))
      }
    }
  })

  const ok = Array.isArray(data) ? data[0] === 'ok' : data?.ok === true
  if (!ok) throw new Error('Respuesta no esperada del servidor')

  return { ok: true, data }
}

/**
 * Azúcar: crea un "sender" ya configurado con apiBase y token.
 * Uso: const sendEmail = createEmailSender({ apiBase, token }); await sendEmail({ mailto, ...})
 */
export function createEmailSender({ apiBase, token }) {
  return (payload) => enviarCorreoAPI({ apiBase, token, ...payload })
}

/** Convierte Blob a File si hace falta (para poner nombre). */
function toFileIfNeeded(blobOrFile, nameFallback = 'adjunto') {
  if (blobOrFile instanceof File) return blobOrFile
  if (blobOrFile instanceof Blob) {
    try {
      return new File([blobOrFile], nameFallback, {
        type: blobOrFile.type || 'application/octet-stream'
      })
    } catch {
      // Safari viejito u otros: devolvemos el Blob tal cual
      return blobOrFile
    }
  }
  throw new Error('El adjunto debe ser File o Blob en el renderer')
}
