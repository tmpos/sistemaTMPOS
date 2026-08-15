import { describe, it, expect } from 'vitest'
import { useDelivery } from '@/composables/useDelivery.js'

describe('useDelivery', () => {
  it('getColorDelivery returns slate for Ninguno', () => {
    const { getColorDelivery } = useDelivery()
    expect(getColorDelivery('Ninguno')).toBe('#94a3b8')
  })

  it('getColorDelivery returns slate for empty', () => {
    const { getColorDelivery } = useDelivery()
    expect(getColorDelivery('')).toBe('#94a3b8')
  })

  it('getColorDelivery returns consistent color for same name', () => {
    const { getColorDelivery } = useDelivery()
    const color = getColorDelivery('Juan')
    expect(getColorDelivery('Juan')).toBe(color)
  })

  it('getColorDelivery returns colors from the palette', () => {
    const { getColorDelivery } = useDelivery()
    const color = getColorDelivery('Pedro')
    const palette = [
      '#3b82f6',
      '#10b981',
      '#f59e0b',
      '#ef4444',
      '#8b5cf6',
      '#ec4899',
      '#14b8a6',
      '#f97316',
      '#06b6d4',
      '#6366f1',
      '#84cc16',
      '#eab308',
      '#a855f7',
      '#22c55e',
      '#0ea5e9',
      '#f43f5e'
    ]
    expect(palette).toContain(color)
  })

  it('getColorDelivery returns different colors for different names', () => {
    const { getColorDelivery } = useDelivery()
    const color1 = getColorDelivery('Delivery1')
    const color2 = getColorDelivery('Delivery2')
    expect(color1).not.toBe(color2)
  })

  it('getRowStyleClienteDelivery returns empty object for no delivery', () => {
    const { getRowStyleClienteDelivery } = useDelivery()
    expect(getRowStyleClienteDelivery({})).toEqual({})
    expect(getRowStyleClienteDelivery({ delivery: 'Ninguno' })).toEqual({})
  })

  it('getRowStyleClienteDelivery returns style for delivery', () => {
    const { getRowStyleClienteDelivery, getColorDelivery } = useDelivery()
    const color = getColorDelivery('Maria')
    const style = getRowStyleClienteDelivery({ delivery: 'Maria' })
    expect(style).toHaveProperty('backgroundColor')
    expect(style).toHaveProperty('borderLeft')
    expect(style.borderLeft).toContain(color)
  })

  it('buildDeliveriesEnUso returns sorted unique deliveries', () => {
    const { buildDeliveriesEnUso } = useDelivery()
    const clientes = [
      { delivery: 'Zara' },
      { delivery: 'Ninguno' },
      { delivery: 'Alpha' },
      { delivery: 'Zara' },
      {}
    ]
    const result = buildDeliveriesEnUso(clientes)
    expect(result).toEqual(['Alpha', 'Zara'])
  })

  it('buildDeliveriesEnUso returns empty array for no deliveries', () => {
    const { buildDeliveriesEnUso } = useDelivery()
    expect(buildDeliveriesEnUso([])).toEqual([])
    expect(buildDeliveriesEnUso([{ delivery: 'Ninguno' }])).toEqual([])
  })
})
