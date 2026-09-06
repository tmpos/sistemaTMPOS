import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const cajaPath = resolve(process.cwd(), 'src/renderer/src/views/Caja/Caja.vue')
const cajaSource = readFileSync(cajaPath, 'utf8')

describe('Caja: monitor de facturas pendientes', () => {
  it('arranca antes de las consultas de inicializacion que pueden fallar', () => {
    const inicioInicializacion = cajaSource.indexOf('async function inicializarCaja()')
    const inicioMonitor = cajaSource.indexOf(
      'iniciarMonitoreoFacturasPendientes();',
      inicioInicializacion
    )
    const primeraEsperaConfiguracion = cajaSource.indexOf(
      "await envioElectron('datosarchivo')",
      inicioInicializacion
    )

    expect(inicioInicializacion).toBeGreaterThan(-1)
    expect(inicioMonitor).toBeGreaterThan(inicioInicializacion)
    expect(inicioMonitor).toBeLessThan(primeraEsperaConfiguracion)
    expect(cajaSource).toContain('intervalId = setInterval(fetchAndSetupData, 5000)')
    expect(cajaSource).toContain("window.addEventListener('focus', fetchAndSetupData)")
  })

  it('consulta las pendientes al recargar sin vaciar el estado actual', () => {
    const inicio = cajaSource.indexOf('const recargarFacturasFull = async()=>')
    const fin = cajaSource.indexOf('/************************************************************/', inicio)
    const bloqueRecarga = cajaSource.slice(inicio, fin)

    expect(bloqueRecarga).toContain('await fetchAndSetupData();')
    expect(bloqueRecarga).not.toContain('facturasSinCobrar.value = []')
  })

  it('solicita el sonido y deja que Electron valide VITE_SOUND', () => {
    expect(cajaSource).toContain("ipcRenderer.invoke('play-sound', 'Subtle.mp3')")
    expect(cajaSource).not.toContain('const { SOUND: sonidoR }')
  })
})
