import { describe, expect, it } from 'vitest'
import { analizarInventario, calcularSaldoCuenta, filtrarValoracion, numeroSeguro, reconciliarInventario } from '../valoracionInventarioCore.js'

const productos = [
  { id:1,codigo:'A',nombre:'Arroz',categoria:'Comida',almacen:'Principal',stock:10,precio_compra:80,precio_venta:120 },
  { id:2,codigo:'B',nombre:'Café',categoria:'Comida',almacen:'Norte',stock:-2,precio_compra:150,precio_venta:140 },
  { id:3,codigo:'C',nombre:'Vacío',categoria:'Otros',almacen:'Principal',stock:4,precio_compra:0,precio_venta:20 }
]
const compras = [
  { fecha:'01-08-2026',almacen:'Principal',productos:JSON.stringify([{codigo:'A',stock:5,precio_compra:60}]) },
  { fecha:'10-08-2026',almacen:'Principal',productos:JSON.stringify([{codigo:'A',stock:15,precio_compra:100}]) }
]
const facturas = [{ fecha:'12-08-2026',almacen:'Principal',productos:JSON.stringify([{codigo:'A',cantidad:2,precio_venta:120}]) }]

describe('valoracionInventarioCore', () => {
  it('convierte números locales de forma robusta', () => { expect(numeroSeguro('RD$ 1.234,50')).toBe(1234.5); expect(numeroSeguro(null)).toBe(0) })
  it('calcula promedio ponderado, último costo, valores y ventas', () => {
    const a=analizarInventario(productos,compras,facturas).filas[0]
    expect(a.costo_promedio).toBe(90); expect(a.ultimo_costo).toBe(100); expect(a.valor_costo).toBe(900); expect(a.unidades_vendidas).toBe(2); expect(a.costo_ventas_estimado).toBe(180)
  })
  it('detecta inventario negativo, sin costo y margen negativo y agrupa', () => {
    const r=analizarInventario(productos,compras,facturas)
    expect(r.resumen).toMatchObject({stockNegativo:1,sinCosto:1,margenNegativo:1})
    expect(r.porCategoria.find((g)=>g.nombre==='Comida').productos).toBe(2)
    expect(r.porAlmacen).toHaveLength(2)
  })
  it('calcula saldos contables con ambos formatos de asiento', () => {
    const asientos=[{asiento:JSON.stringify([{cuenta:'Inventario',cantidadDebito:1000,cantidadCredito:100}])},{asiento:JSON.stringify([{debito:'Inventario',credito:'Caja',cantidadDebito:50,cantidadCredito:50}])}]
    expect(calcularSaldoCuenta(asientos,'inventario')).toEqual({debitos:1050,creditos:100,saldo:950,movimientos:2})
  })
  it('reconcilia diferencias y filtra alertas', () => {
    const analisis=analizarInventario(productos,compras,facturas)
    const rec=reconciliarInventario(analisis,[{asiento:JSON.stringify([{cuenta:'Inventario',cantidadDebito:1000,cantidadCredito:0}])}],'Inventario','Costo de ventas')
    expect(rec.inventario.diferencia).toBe(1000-analisis.resumen.valorCosto)
    expect(filtrarValoracion(analisis.filas,{alerta:'MARGEN_NEGATIVO'}).map((p)=>p.codigo)).toEqual(['B'])
  })
})
