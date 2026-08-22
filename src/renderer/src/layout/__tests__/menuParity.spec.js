import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const leerFuente = (ruta) => readFileSync(new URL(ruta, import.meta.url), 'utf8')

const obtenerRutasLaterales = (fuente) => {
  const rutas = [...fuente.matchAll(/(?:["']to["']|\bto)\s*:\s*["']([^"']+)["']/g)].map(
    (match) => match[1]
  )

  // /pages pertenece al contenedor principal y no es una opcion navegable.
  return [...new Set(rutas.filter((ruta) => ruta !== '/pages'))].sort()
}

const obtenerRutasElectron = (fuente) => {
  const rutasDirectas = [
    ...fuente.matchAll(/crearItemMenu\(\s*["'][^"']+["']\s*,\s*["']([^"']+)["']\s*\)/g)
  ].map((match) => match[1])

  const inicioRegistro = fuente.indexOf('const gruposMenuLateral')
  const finRegistro = fuente.indexOf('const submenuSincronizado', inicioRegistro)
  const registro = fuente.slice(inicioRegistro, finRegistro)
  const rutasSincronizadas = [
    ...registro.matchAll(/\[\s*["'][^"']+["']\s*,\s*["'](\/[^"']+)["']\s*,\s*\[/g)
  ].map((match) => match[1])

  return new Set([...rutasDirectas, ...rutasSincronizadas])
}

describe('paridad entre menus', () => {
  it('mantiene todas las rutas navegables del lateral en el menu Electron', () => {
    const fuenteLateral = leerFuente('../AppMenu.vue')
    const fuenteElectron = leerFuente('../../../../main/index.js')
    const rutasLaterales = obtenerRutasLaterales(fuenteLateral)
    const rutasElectron = obtenerRutasElectron(fuenteElectron)

    expect(rutasLaterales.filter((ruta) => !ruta.startsWith('/'))).toEqual([])
    expect(rutasLaterales.filter((ruta) => !rutasElectron.has(ruta))).toEqual([])
  })
})
