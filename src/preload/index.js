import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// Custom API for renderer process
const api = {
  invoke: (channel, ...args) => ipcRenderer.invoke(channel, ...args),
  send: (channel, ...args) => ipcRenderer.send(channel, ...args),
  on: (channel, callback) => ipcRenderer.on(channel, (event, ...args) => callback(...args)),
  removeListener: (channel, callback) => ipcRenderer.removeListener(channel, callback),

  // Función para enviar los datos de localStorage al proceso Main
  enviarDatosLocalStorage: () => {
    const todasLasEntradas = {}

    // Iterar a través de todas las claves del localStorage
    for (let i = 0; i < localStorage.length; i++) {
      const clave = localStorage.key(i) // Obtener el nombre de la clave
      let valor = localStorage.getItem(clave) // Obtener el valor de la clave

      // Intentar parsear JSON, si no es válido, mantener como string
      try {
        valor = JSON.parse(valor)
      } catch (e) {
        // No hacer nada, mantener como string si no es JSON
      }

      todasLasEntradas[clave] = valor
    }

    // Enviar datos a Electron con ipcRenderer.invoke
    return ipcRenderer.invoke('enviar-datos-localstorage', todasLasEntradas)
  }
}

// Exposición segura del API en `window.electron`
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', {
      ...electronAPI, // Incluir electronAPI de electron-toolkit
      ipcRenderer: api
    })

    // Exponer `api` también en `window.api` para facilitar el acceso en el renderer
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error('Error exponiendo APIs en preload.js:', error)
  }
} else {
  console.warn('Context Isolation no está habilitado. Esto es un riesgo de seguridad.')
  window.electron = {
    ...electronAPI,
    ipcRenderer: api
  }
  window.api = api
}
