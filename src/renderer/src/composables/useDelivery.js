import { ref, computed } from 'vue'

const coloresDelivery = ref({})

export function useDelivery() {
  const getColorDelivery = (deliveryNombre) => {
    if (!deliveryNombre || deliveryNombre === 'Ninguno') {
      return '#94a3b8'
    }
    if (coloresDelivery.value[deliveryNombre]) {
      return coloresDelivery.value[deliveryNombre]
    }
    const coloresPaleta = [
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
    const deliveriesExistentes = Object.keys(coloresDelivery.value).length
    const colorIndex = deliveriesExistentes % coloresPaleta.length
    const color = coloresPaleta[colorIndex]
    coloresDelivery.value[deliveryNombre] = color
    return color
  }

  const getRowStyleClienteDelivery = (data) => {
    if (!data.delivery || data.delivery === 'Ninguno') {
      return {}
    }
    const color = getColorDelivery(data.delivery)
    return {
      backgroundColor: `${color}15`,
      borderLeft: `4px solid ${color}`
    }
  }

  const deliveriesEnUso = computed(() => {
    return []
  })

  const buildDeliveriesEnUso = (clientes) => {
    const deliveriesSet = new Set()
    clientes.forEach((cliente) => {
      if (cliente.delivery && cliente.delivery !== 'Ninguno') {
        deliveriesSet.add(cliente.delivery)
      }
    })
    return Array.from(deliveriesSet).sort()
  }

  return {
    coloresDelivery,
    getColorDelivery,
    getRowStyleClienteDelivery,
    deliveriesEnUso,
    buildDeliveriesEnUso
  }
}
