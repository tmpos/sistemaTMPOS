import path from 'path'
import fs from 'fs'

export async function loadConfig() {
  const configPath = path.join(__dirname, '../../../../resources/config.json')

  fs.readFile(configPath, 'utf8', (err, data) => {
    if (err) {
      console.error('Error al leer el archivo de configuración:', err)
      return
    }
    const config = data

    return config
  })
}
