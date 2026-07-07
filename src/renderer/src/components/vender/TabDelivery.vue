<template>
  <div v-show="tabVentaActiva === 'delivery'" class="space-y-6">
    <Card class="shadow-lg border border-slate-200 dark:border-slate-700">
      <template #content>
        <div class="space-y-4">
          <div class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p class="m-0 text-sm font-semibold text-slate-500">DELIVERY</p>
              <h3 class="m-0 text-lg font-bold text-slate-800 dark:text-slate-100">
                Control de entregas del día
                <Tag v-if="deliveryResumenDataFiltrado.length > 0" :value="deliveryResumenDataFiltrado.length" severity="info" class="ml-2" />
              </h3>
              <p class="m-0 text-sm text-slate-500">Resumen de facturas por delivery para calcular pagos.</p>
            </div>
            <div class="flex flex-col gap-2 md:flex-row md:items-center">
              <Button label="Actualizar" icon="pi pi-refresh" severity="success" outlined @click="cargarFacturasDelivery" />
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div class="flex items-center gap-2">
              <IconField iconPosition="left" class="flex-1">
                <InputIcon>
                  <i class="pi pi-search" />
                </InputIcon>
                <InputText
                  v-model="deliveryTabSearch"
                  placeholder="Buscar por nombre, cédula o teléfono..."
                  class="w-full"
                />
              </IconField>
              <Button
                v-if="deliveryTabSearch"
                icon="pi pi-times"
                severity="secondary"
                text
                rounded
                @click="deliveryTabSearch = ''"
                v-tooltip.top="'Limpiar búsqueda'"
              />
            </div>
            <div>
              <Select
                v-model="deliveryTabSearch"
                :options="deliverysNombre.filter(d => d !== 'Ninguno')"
                placeholder="Seleccionar delivery"
                showClear
                fluid
                class="w-full"
              />
            </div>
          </div>

          <DataTable
            :value="deliveryResumenDataFiltrado"
            dataKey="nombre"
            scrollable
            scrollHeight="520px"
            size="small"
            resizableColumns
            columnResizeMode="fit"
            tableClass="rounded-xl"
            :loading="deliveryTabLoading"
          >
            <Column field="nombre" header="DELIVERY" sortable>
              <template #body="slotProps">
                <div class="flex items-center gap-2">
                  <i class="pi pi-car text-blue-500"></i>
                  <span class="font-semibold">{{ slotProps.data.nombre }}</span>
                </div>
              </template>
            </Column>
            <Column field="cedula" header="CÉDULA" sortable />
            <Column field="telefono" header="TELÉFONO" />
            <Column field="cantidadFacturas" header="ENTREGAS HOY" sortable>
              <template #body="slotProps">
                <Tag :value="slotProps.data.cantidadFacturas" severity="info" />
              </template>
            </Column>
            <Column field="totalMonto" header="TOTAL FACTURAS" sortable>
              <template #body="slotProps">
                <span class="font-bold text-green-600">
                  {{ formatCurrency(slotProps.data.totalMonto) }}
                </span>
              </template>
            </Column>
            <Column field="porcentaje" header="%" sortable>
              <template #body="slotProps">
                <span>{{ slotProps.data.porcentaje }}%</span>
              </template>
            </Column>
            <Column field="montoAPagar" header="A PAGAR" sortable>
              <template #body="slotProps">
                <span class="font-bold text-blue-600">
                  {{ formatCurrency(slotProps.data.montoAPagar) }}
                </span>
              </template>
            </Column>
            <Column header="ACCIONES">
              <template #body="slotProps">
                <Button
                  icon="pi pi-list"
                  size="small"
                  text
                  rounded
                  severity="info"
                  @click="verDetalleDelivery(slotProps.data)"
                  v-tooltip.top="'Ver facturas'"
                />
              </template>
            </Column>
            <template #empty>
              <div class="py-8 text-center text-slate-500">
                <i class="pi pi-inbox text-4xl mb-3 block text-slate-300"></i>
                <p v-if="deliveryTabSearch" class="m-0 text-sm">
                  No se encontraron deliveries con "<strong>{{ deliveryTabSearch }}</strong>"
                </p>
                <p v-else class="m-0 text-sm">
                  No hay entregas registradas para el día de hoy
                </p>
              </div>
            </template>
          </DataTable>
        </div>
      </template>
    </Card>
  </div>

  <Dialog v-model:visible="visibleDetalleDelivery" modal header="Detalle de facturas" :style="{ width: '70rem', maxWidth: '95vw' }">
    <template #header>
      <div class="inline-flex align-items-center justify-content-center gap-2">
        <i class="pi pi-car text-blue-500"></i>
        <span class="font-bold white-space-nowrap">Facturas de {{ deliverySeleccionado?.nombre }}</span>
      </div>
    </template>

    <div class="space-y-4">
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <template #content>
            <div class="text-center">
              <p class="text-sm text-slate-500 mb-1">Total Entregas</p>
              <p class="text-2xl font-bold text-blue-600">{{ deliverySeleccionado?.cantidadFacturas || 0 }}</p>
            </div>
          </template>
        </Card>
        <Card>
          <template #content>
            <div class="text-center">
              <p class="text-sm text-slate-500 mb-1">Total Facturas</p>
              <p class="text-2xl font-bold text-green-600">{{ formatCurrency(deliverySeleccionado?.totalMonto || 0) }}</p>
            </div>
          </template>
        </Card>
        <Card>
          <template #content>
            <div class="text-center">
              <p class="text-sm text-slate-500 mb-1">Porcentaje</p>
              <p class="text-2xl font-bold text-purple-600">{{ deliverySeleccionado?.porcentaje || 0 }}%</p>
            </div>
          </template>
        </Card>
        <Card>
          <template #content>
            <div class="text-center">
              <p class="text-sm text-slate-500 mb-1">Total a Pagar</p>
              <p class="text-2xl font-bold text-orange-600">{{ formatCurrency(deliverySeleccionado?.montoAPagar || 0) }}</p>
            </div>
          </template>
        </Card>
      </div>

      <DataTable
        :value="deliveryFacturasDetalle"
        scrollable
        scrollHeight="400px"
        size="small"
        tableClass="rounded-xl"
      >
        <Column field="no_factura" header="FACTURA" sortable />
        <Column field="nombre_cliente" header="CLIENTE" sortable />
        <Column field="fecha_emision" header="FECHA" sortable />
        <Column field="hora" header="HORA" sortable />
        <Column field="total" header="TOTAL" sortable>
          <template #body="slotProps">
            <span class="font-semibold text-green-600">{{ formatCurrency(slotProps.data.total) }}</span>
          </template>
        </Column>
        <Column field="estado_factura" header="ESTADO">
          <template #body="slotProps">
            <Tag :value="slotProps.data.estado_factura" :severity="slotProps.data.estado_factura === 'Cobrado' ? 'success' : 'warning'" />
          </template>
        </Column>
      </DataTable>
    </div>

    <template #footer>
      <Button label="Cerrar" text severity="secondary" @click="visibleDetalleDelivery = false" />
    </template>
  </Dialog>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useToast } from 'primevue/usetoast'
import { nfecha } from '@/funciones/funciones.js'

const props = defineProps({
  tabVentaActiva: { type: String, default: '' },
  allFacturasFull: { type: Array, default: () => [] },
  deliveryArray: { type: Array, default: () => [] },
  deliverysNombre: { type: Array, default: () => ['Ninguno'] }
})

const toast = useToast()

const deliveryResumenData = ref([])
const deliveryTabLoading = ref(false)
const deliveryTabSearch = ref('')
const visibleDetalleDelivery = ref(false)
const deliverySeleccionado = ref(null)
const deliveryFacturasDetalle = ref([])

const cargarFacturasDelivery = async () => {
  try {
    deliveryTabLoading.value = true
    const fechaHoy = nfecha('fecha')
    const facturasHoy = props.allFacturasFull.filter(factura => {
      if (factura.fecha_emision !== fechaHoy) return false
      let deliveryNombre = null
      if (factura.delivery && factura.delivery.trim() !== '' && factura.delivery !== 'Ninguno') {
        deliveryNombre = factura.delivery
      } else if (factura.otro) {
        try {
          const otroData = JSON.parse(factura.otro)
          if (Array.isArray(otroData) && otroData.length > 0) {
            deliveryNombre = otroData[0].delivery
          }
        } catch (e) {}
      }
      return deliveryNombre && deliveryNombre.trim() !== '' && deliveryNombre !== 'Ninguno'
    })

    const deliveryMap = new Map()
    props.deliveryArray.forEach(delivery => {
      deliveryMap.set(delivery.nombre, {
        nombre: delivery.nombre,
        cedula: delivery.cedula || '',
        telefono: delivery.telefono || '',
        porcentaje: Number(delivery.porcentaje) || 0,
        cantidadFacturas: 0,
        totalMonto: 0,
        montoAPagar: 0,
        facturas: []
      })
    })

    facturasHoy.forEach(factura => {
      let deliveryNombre = null
      if (factura.delivery && factura.delivery.trim() !== '' && factura.delivery !== 'Ninguno') {
        deliveryNombre = factura.delivery
      } else if (factura.otro) {
        try {
          const otroData = JSON.parse(factura.otro)
          if (Array.isArray(otroData) && otroData.length > 0) {
            deliveryNombre = otroData[0].delivery
          }
        } catch (e) {}
      }
      if (deliveryNombre && deliveryMap.has(deliveryNombre)) {
        const delivery = deliveryMap.get(deliveryNombre)
        delivery.cantidadFacturas++
        delivery.totalMonto += Number(factura.total) || 0
        delivery.facturas.push(factura)
      }
    })

    deliveryMap.forEach(delivery => {
      delivery.montoAPagar = (delivery.totalMonto * delivery.porcentaje) / 100
    })

    deliveryResumenData.value = Array.from(deliveryMap.values())
      .filter(delivery => delivery.cantidadFacturas > 0)
      .sort((a, b) => b.cantidadFacturas - a.cantidadFacturas)
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'No se pudieron cargar las facturas de delivery',
      life: 3000
    })
  } finally {
    deliveryTabLoading.value = false
  }
}

const verDetalleDelivery = (delivery) => {
  deliverySeleccionado.value = delivery
  deliveryFacturasDetalle.value = delivery.facturas || []
  visibleDetalleDelivery.value = true
}

const deliveryResumenDataFiltrado = computed(() => {
  const termino = String(deliveryTabSearch.value || '').trim().toLowerCase()
  if (!termino) return deliveryResumenData.value
  return deliveryResumenData.value.filter(delivery => {
    const nombre = String(delivery.nombre || '').toLowerCase()
    const cedula = String(delivery.cedula || '').toLowerCase()
    const telefono = String(delivery.telefono || '').toLowerCase()
    return nombre.includes(termino) || cedula.includes(termino) || telefono.includes(termino)
  })
})

const formatCurrency = (value) => {
  return new Intl.NumberFormat('es-DO', { style: 'currency', currency: 'DOP' }).format(value || 0)
}

defineExpose({ cargarFacturasDelivery })
</script>
