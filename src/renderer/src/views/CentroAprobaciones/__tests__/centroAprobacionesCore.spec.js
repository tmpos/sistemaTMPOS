import { describe, expect, it, vi } from 'vitest'
import { construirSolicitud, crearSolicitudAprobacion, filtrarSolicitudes, puedeCambiarEstado,
  resolverSolicitud, resolverSolicitudAprobacion, resumenSolicitudes, validarSolicitud } from '../centroAprobacionesCore.js'

const base = { tipo:'COMPRA', nivel:2, monto:12500, solicitante:'Ana', motivo:'Reposición', datos:{ ordenId:8 } }

describe('centroAprobacionesCore', () => {
  it('valida los siete tipos, niveles, monto, motivo y JSON', () => {
    expect(validarSolicitud(base).valido).toBe(true)
    const invalida = validarSolicitud({ tipo:'OTRO', nivel:8, monto:-1, solicitante:'', motivo:'', datos:'{' })
    expect(invalida.valido).toBe(false)
    expect(invalida.errores.length).toBeGreaterThanOrEqual(5)
  })
  it('crea una solicitud pendiente con datos e historial serializados', () => {
    const s = construirSolicitud(base, { codigo:'APR-1', ahora:'2026-08-22 10:00:00' })
    expect(s.estado).toBe('PENDIENTE')
    expect(JSON.parse(s.datos)).toEqual({ ordenId:8 })
    expect(JSON.parse(s.historial)).toHaveLength(1)
  })
  it('impide autoaprobar y transiciones desde estados finales', () => {
    const s = construirSolicitud(base)
    expect(() => resolverSolicitud(s, 'APROBADA', 'ana')).toThrow('propia solicitud')
    const aprobada = resolverSolicitud(s, 'APROBADA', 'Luis', 'Autorizado')
    expect(aprobada.estado).toBe('APROBADA')
    expect(puedeCambiarEstado('APROBADA', 'RECHAZADA')).toBe(false)
    expect(() => resolverSolicitud(aprobada, 'RECHAZADA', 'Marta', 'No')).toThrow('No se puede')
  })
  it('exige motivo al rechazar y conserva trazabilidad', () => {
    const s = construirSolicitud(base)
    expect(() => resolverSolicitud(s, 'RECHAZADA', 'Luis')).toThrow('motivo')
    const rechazada = resolverSolicitud(s, 'RECHAZADA', 'Luis', 'Fuera de presupuesto', '2026-08-22')
    expect(JSON.parse(rechazada.historial)).toHaveLength(2)
  })
  it('filtra, resume y ofrece API reutilizable de persistencia', async () => {
    const filas = [
      { codigo:'APR-1', tipo:'COMPRA', estado:'PENDIENTE', monto:100, solicitante:'Ana', motivo:'Stock' },
      { codigo:'APR-2', tipo:'GASTO', estado:'APROBADA', monto:40, solicitante:'Luis', motivo:'Taxi' }
    ]
    expect(filtrarSolicitudes(filas, { busqueda:'stock', estado:'PENDIENTE' })).toHaveLength(1)
    expect(resumenSolicitudes(filas)).toMatchObject({ total:2, pendiente:1, aprobada:1, montoPendiente:100 })
    const insertar = vi.fn().mockImplementation(async (operacion) => {
      if (operacion === 'tableExists') return ['ok']
      if (operacion === 'getTableColumns') return ['codigo','tipo','estado','nivel','monto','moneda','solicitante','solicitado_at','revisor','revisado_at','motivo','respuesta','datos','historial']
      if (operacion === 'insertData') return ['ok', { id:9 }]
      return ['ok']
    })
    expect((await crearSolicitudAprobacion(insertar, base, { codigo:'APR-9' })).id).toBe(9)
    const actualizar = vi.fn().mockImplementation(async (operacion) => {
      if (operacion === 'tableExists') return ['ok']
      if (operacion === 'getTableColumns') return ['codigo','tipo','estado','nivel','monto','moneda','solicitante','solicitado_at','revisor','revisado_at','motivo','respuesta','datos','historial']
      return ['ok']
    })
    const solicitud = { ...construirSolicitud(base), id:9 }
    expect((await resolverSolicitudAprobacion(actualizar, solicitud, 'APROBADA', 'Luis')).estado).toBe('APROBADA')
  })
})
