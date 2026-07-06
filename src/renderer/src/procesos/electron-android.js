import { exec } from 'child_process'
import path from 'path'
import fs from 'fs'
import util from 'util'

const execAsync = util.promisify(exec)

// Obtener información básica del dispositivo
export async function getDeviceInfo() {
  try {
    const { stdout: model } = await execAsync(`adb shell getprop ro.product.model`)
    const { stdout: version } = await execAsync(`adb shell getprop ro.build.version.release`)
    const { stdout: batteryRaw } = await execAsync(`adb shell dumpsys battery`)
    const batteryMatch = batteryRaw.match(/level: (\d+)/)
    const battery = batteryMatch ? batteryMatch[1] : 'Desconocido'

    const { stdout: imeiRaw } = await execAsync(`adb shell service call iphonesubinfo 1`)
    const imeiMatch = imeiRaw.match(/\d{15}/)
    const imei = imeiMatch ? imeiMatch[0] : 'No disponible'

    const { stdout: serial } = await execAsync(`adb get-serialno`)

    return {
      success: true,
      data: {
        model: model.trim(),
        version: version.trim(),
        battery: battery,
        imei: imei,
        serial: serial.trim()
      }
    }
  } catch (err) {
    return {
      success: false,
      message: 'No se pudo obtener información',
      error: err.message
    }
  }
}

// Detectar dispositivos conectados
export const detectarDispositivos = () => {
  return new Promise((resolve, reject) => {
    exec('adb devices', (err, stdout) => {
      if (err) return reject('Error al detectar dispositivos')
      const dispositivos = stdout
        .split('\n')
        .slice(1)
        .filter((line) => line.trim() !== '' && line.includes('\tdevice'))
        .map((line) => line.split('\t')[0])
      resolve(dispositivos)
    })
  })
}

// Obtener información adicional de un dispositivo específico
export const obtenerInformacionDispositivo = (serial) => {
  return new Promise((resolve, reject) => {
    exec(`adb -s ${serial} shell getprop`, (err, stdout) => {
      if (err) return reject('Error al obtener información')
      const info = {
        modelo: stdout.match(/\[ro.product.model\]: \[(.*?)\]/)?.[1] || 'Desconocido',
        fabricante: stdout.match(/\[ro.product.manufacturer\]: \[(.*?)\]/)?.[1] || 'Desconocido',
        android: stdout.match(/\[ro.build.version.release\]: \[(.*?)\]/)?.[1] || 'Desconocido',
        imei: 'No disponible (requiere root o app)'
      }
      resolve(info)
    })
  })
}

// Exportar fotos desde DCIM
export const exportarFotos = (serial, destino = './fotos') => {
  return new Promise((resolve, reject) => {
    if (!fs.existsSync(destino)) fs.mkdirSync(destino, { recursive: true })
    const comando = `adb -s ${serial} pull /sdcard/DCIM/Camera "${destino}"`
    exec(comando, (err, stdout, stderr) => {
      if (err) return reject(stderr || 'Error al exportar fotos')
      resolve(stdout)
    })
  })
}

// Instalar archivo APK
export const instalarAPK = (serial, rutaAPK) => {
  return new Promise((resolve, reject) => {
    const comando = `adb -s ${serial} install "${rutaAPK}"`
    exec(comando, (err, stdout, stderr) => {
      if (err) return reject(stderr || 'Error al instalar APK')
      resolve(stdout)
    })
  })
}

export const reiniciarDispositivo = (serial) => {
  return new Promise((resolve, reject) => {
    const comando = `adb -s ${serial} reboot`
    exec(comando, (err, stdout, stderr) => {
      if (err) return reject(stderr || 'Error al reiniciar el dispositivo')
      resolve('Dispositivo reiniciándose...')
    })
  })
}

// Capturar pantalla del dispositivo
export const capturarPantalla = (serial, output = 'captura.png') => {
  return new Promise((resolve, reject) => {
    const tempPath = `/sdcard/${output}`
    const comando = `
      adb -s ${serial} shell screencap -p ${tempPath} &&
      adb -s ${serial} pull ${tempPath} ./ &&
      adb -s ${serial} shell rm ${tempPath}
    `
    exec(comando, { shell: 'cmd.exe' }, (err, stdout, stderr) => {
      if (err) return reject(stderr || 'Error al capturar pantalla')
      resolve(`Captura guardada como ${output}`)
    })
  })
}
