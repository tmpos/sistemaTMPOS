<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import Swal from 'sweetalert2'
import { useToast } from 'primevue/usetoast'
import {
  arrayToObjetoFromTablaOffline,
  crearTablaSiNoExisteOffline,
  nfecha,
  peticionesFetchOffline
} from '@/funciones/funciones.js'

const router = useRouter()
const toast = useToast()

const TABLA_DISTRIBUCION = 'distribucion_utilidades'
const TABLA_MOVIMIENTOS = 'distribucion_utilidades_movimientos'

const CAMPOS_DISTRIBUCION = [
  'id_cuenta',
  'codigo_cuenta',
  'nombre_cuenta',
  'porcentaje',
  'base_calculo',
  'estado',
  'descripcion',
  'usuario',
  'created_at',
  'updated_at'
]

const CAMPOS_MOVIMIENTOS = [
  'id_regla',
  'id_cuenta',
  'codigo_cuenta',
  'nombre_cuenta',
  'base_calculo',
  'base_monto',
  'porcentaje',
  'monto_asignado',
  'no_factura',
  'usuario',
  'created_at',
  'updated_at'
]

const loading = ref(false)
const guardando = ref(false)
const visibleDialog = ref(false)
const searchQuery = ref('')
const cuentas = ref([])
const reglas = ref([])
const modoEdicion = ref(false)

const baseCalculoOptions = [
  { label: 'Total venta', value: 'TOTAL' },
  { label: 'Subtotal', value: 'SUBTOTAL' },
  { label: 'Ganancia', value: 'GANANCIA' }
]

const estadoOptions = [
  { label: 'Activa', value: 'ACTIVA' },
  { label: 'Inactiva', value: 'INACTIVA' }
]

const form = ref({
  id: null,
  id_cuenta: null,
  codigo_cuenta: '',
  nombre_cuenta: '',
  porcentaje: 0,
  base_calculo: 'TOTAL',
  estado: 'ACTIVA',
  descripcion: ''
})

const toNumber = (value, fallback = 0) => {
  const n = Number(value)
  return Number.isFinite(n) ? n : fallback
}

const reglasFiltradas = computed(() => {
  const query = String(searchQuery.value || '').trim().toLowerCase()
  if (!query) return reglas.value

  return reglas.value.filter((item) => {
    const text = [
      item.codigo_cuenta,
      item.nombre_cuenta,
      item.base_calculo,
      item.estado,
      item.descripcion
    ]
      .map((v) => String(v || '').toLowerCase())
      .join(' ')

    return text.includes(query)
  })
})

const totalPorcentajeActivo = computed(() =>
  reglas.value
    .filter((r) => String(r.estado || '').toUpperCase() === 'ACTIVA')
    .reduce((sum, r) => sum + toNumber(r.porcentaje), 0)
)

const estadoPorcentaje = computed(() => {
  if (totalPorcentajeActivo.value > 100) return 'danger'
  if (totalPorcentajeActivo.value === 100) return 'success'
  return 'warn'
})

const cargarDatos = async () => {
  loading.value = true
  try {
    const [cuentasResp, reglasResp] = await Promise.all([
      peticionesFetchOffline('getDataAsArray', 'cuentas'),
      peticionesFetchOffline('getDataAsArray', TABLA_DISTRIBUCION)
    ])

    cuentas.value = Array.isArray(cuentasResp) ? cuentasResp : []
    reglas.value = (Array.isArray(reglasResp) ? reglasResp : []).sort(
      (a, b) => toNumber(b.id) - toNumber(a.id)
    )
  } catch (error) {
    console.error('Error cargando datos de distribucion:', error)
    toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo cargar la configuracion', life: 3000 })
  } finally {
    loading.value = false
  }
}

const seleccionarCuenta = () => {
  const cuenta = cuentas.value.find((c) => String(c.id) === String(form.value.id_cuenta))
  if (!cuenta) return

  form.value.codigo_cuenta = String(cuenta.id || '')
  form.value.nombre_cuenta = cuenta.nombre || ''
}

const abrirCrear = () => {
  modoEdicion.value = false
  form.value = {
    id: null,
    id_cuenta: null,
    codigo_cuenta: '',
    nombre_cuenta: '',
    porcentaje: 0,
    base_calculo: 'TOTAL',
    estado: 'ACTIVA',
    descripcion: ''
  }
  visibleDialog.value = true
}

const abrirEditar = (item) => {
  modoEdicion.value = true
  form.value = {
    id: item.id,
    id_cuenta: item.id_cuenta,
    codigo_cuenta: item.codigo_cuenta || '',
    nombre_cuenta: item.nombre_cuenta || '',
    porcentaje: toNumber(item.porcentaje),
    base_calculo: item.base_calculo || 'TOTAL',
    estado: item.estado || 'ACTIVA',
    descripcion: item.descripcion || ''
  }
  visibleDialog.value = true
}

const guardar = async () => {
  if (!form.value.id_cuenta) {
    toast.add({ severity: 'warn', summary: 'Validacion', detail: 'Debe seleccionar una cuenta', life: 2500 })
    return
  }

  const porcentaje = toNumber(form.value.porcentaje)
  if (porcentaje <= 0) {
    toast.add({ severity: 'warn', summary: 'Validacion', detail: 'El porcentaje debe ser mayor a cero', life: 2500 })
    return
  }

  guardando.value = true
  try {
    if (modoEdicion.value) {
      const existente = reglas.value.find((r) => String(r.id) === String(form.value.id))
      if (!existente) throw new Error('No se encontro la regla a editar')

      const actualizado = {
        ...existente,
        id_cuenta: form.value.id_cuenta,
        codigo_cuenta: form.value.codigo_cuenta,
        nombre_cuenta: form.value.nombre_cuenta,
        porcentaje,
        base_calculo: form.value.base_calculo,
        estado: form.value.estado,
        descripcion: String(form.value.descripcion || '').trim()
      }

      if (Object.prototype.hasOwnProperty.call(actualizado, 'updated_at')) {
        actualizado.updated_at = nfecha('timestamp')
      }

      const resp = await peticionesFetchOffline('updateData', TABLA_DISTRIBUCION, JSON.stringify(actualizado))
      if (resp?.[0] !== 'ok') throw new Error('No se pudo actualizar la regla')
    } else {
      const base = await arrayToObjetoFromTablaOffline(TABLA_DISTRIBUCION)
      base.id_cuenta = form.value.id_cuenta
      base.codigo_cuenta = form.value.codigo_cuenta
      base.nombre_cuenta = form.value.nombre_cuenta
      base.porcentaje = porcentaje
      base.base_calculo = form.value.base_calculo
      base.estado = form.value.estado
      base.descripcion = String(form.value.descripcion || '').trim()
      base.usuario = (JSON.parse(localStorage.getItem('usuarioLocal') || '[]')?.[0]?.usuario || 'SISTEMA')
      if (Object.prototype.hasOwnProperty.call(base, 'created_at')) {
        base.created_at = nfecha('timestamp')
      }
      if (Object.prototype.hasOwnProperty.call(base, 'updated_at')) {
        base.updated_at = nfecha('timestamp')
      }

      const resp = await peticionesFetchOffline('insertData', TABLA_DISTRIBUCION, JSON.stringify(base))
      if (resp?.[0] !== 'ok') throw new Error('No se pudo crear la regla')
    }

    visibleDialog.value = false
    await cargarDatos()
    toast.add({ severity: 'success', summary: 'Exito', detail: 'Configuracion guardada', life: 2400 })
  } catch (error) {
    console.error('Error guardando regla:', error)
    toast.add({ severity: 'error', summary: 'Error', detail: error.message || 'No se pudo guardar', life: 3000 })
  } finally {
    guardando.value = false
  }
}

const cambiarEstado = async (item) => {
  const actualizado = { ...item }
  actualizado.estado = String(item.estado || '').toUpperCase() === 'ACTIVA' ? 'INACTIVA' : 'ACTIVA'
  if (Object.prototype.hasOwnProperty.call(actualizado, 'updated_at')) {
    actualizado.updated_at = nfecha('timestamp')
  }

  const resp = await peticionesFetchOffline('updateData', TABLA_DISTRIBUCION, JSON.stringify(actualizado))
  if (resp?.[0] === 'ok') {
    await cargarDatos()
    toast.add({ severity: 'success', summary: 'Estado actualizado', detail: `Regla ${actualizado.estado.toLowerCase()}`, life: 2000 })
  }
}

const eliminarRegla = async (item) => {
  const result = await Swal.fire({
    title: 'Eliminar regla',
    text: `Se eliminara la configuracion de ${item.nombre_cuenta || 'la cuenta seleccionada'}`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Eliminar',
    cancelButtonText: 'Cancelar'
  })

  if (!result.isConfirmed) return

  const resp = await peticionesFetchOffline('deleteEntry', TABLA_DISTRIBUCION, item.id)
  if (resp?.[0] === 'ok') {
    await cargarDatos()
    toast.add({ severity: 'success', summary: 'Eliminado', detail: 'Regla eliminada correctamente', life: 2200 })
  }
}

onMounted(async () => {
  await crearTablaSiNoExisteOffline(TABLA_DISTRIBUCION, CAMPOS_DISTRIBUCION, toast)
  await crearTablaSiNoExisteOffline(TABLA_MOVIMIENTOS, CAMPOS_MOVIMIENTOS, toast)
  await cargarDatos()
})
</script>

<template>
  <main class="dist-page">
    <div class="dist-shell">
      <div class="dist-hero">
        <div>
          <h1>Distribucion de utilidades</h1>
          <p>Configure porcentajes por cuenta para distribuir automaticamente montos cuando se registra una venta.</p>
        </div>
        <div class="dist-hero-actions">
          <Button label="Volver a contabilidad" icon="pi pi-arrow-left" severity="secondary" outlined @click="router.push('/contabilidad')" />
          <Button label="Nueva regla" icon="pi pi-plus" @click="abrirCrear" />
        </div>
      </div>

      <div class="dist-kpis">
        <Card>
          <template #content>
            <p class="kpi-label">Reglas configuradas</p>
            <p class="kpi-value">{{ reglas.length }}</p>
          </template>
        </Card>
        <Card>
          <template #content>
            <p class="kpi-label">Reglas activas</p>
            <p class="kpi-value">{{ reglas.filter((r) => r.estado === 'ACTIVA').length }}</p>
          </template>
        </Card>
        <Card>
          <template #content>
            <p class="kpi-label">Porcentaje activo</p>
            <Tag :severity="estadoPorcentaje" :value="`${totalPorcentajeActivo.toFixed(2)}%`" />
          </template>
        </Card>
      </div>

      <Card>
        <template #content>
          <div class="dist-actions">
            <IconField iconPosition="left" class="w-full">
              <InputIcon class="pi pi-search" />
              <InputText v-model="searchQuery" placeholder="Buscar por cuenta, estado o base de calculo" class="w-full" />
            </IconField>
          </div>

          <DataTable :value="reglasFiltradas" :loading="loading" stripedRows size="small" dataKey="id" scrollable scrollHeight="540px">
            <Column field="codigo_cuenta" header="Cuenta" style="min-width: 7rem" />
            <Column field="nombre_cuenta" header="Nombre de cuenta" style="min-width: 18rem" />
            <Column field="porcentaje" header="%" style="min-width: 5rem">
              <template #body="slotProps">
                <strong>{{ toNumber(slotProps.data.porcentaje).toFixed(2) }}%</strong>
              </template>
            </Column>
            <Column field="base_calculo" header="Base" style="min-width: 8rem" />
            <Column field="estado" header="Estado" style="min-width: 7rem">
              <template #body="slotProps">
                <Tag :severity="slotProps.data.estado === 'ACTIVA' ? 'success' : 'secondary'" :value="slotProps.data.estado || 'INACTIVA'" />
              </template>
            </Column>
            <Column field="descripcion" header="Descripcion" style="min-width: 18rem" />
            <Column header="Acciones" style="min-width: 14rem">
              <template #body="slotProps">
                <div class="dist-row-actions">
                  <Button icon="pi pi-pencil" text rounded severity="info" @click="abrirEditar(slotProps.data)" />
                  <Button
                    :icon="slotProps.data.estado === 'ACTIVA' ? 'pi pi-pause' : 'pi pi-play'"
                    text
                    rounded
                    severity="contrast"
                    @click="cambiarEstado(slotProps.data)"
                  />
                  <Button icon="pi pi-trash" text rounded severity="danger" @click="eliminarRegla(slotProps.data)" />
                </div>
              </template>
            </Column>
            <template #empty>
              <div class="empty-state">No hay reglas creadas. Comience agregando una distribucion.</div>
            </template>
          </DataTable>
        </template>
      </Card>
    </div>

    <Dialog v-model:visible="visibleDialog" modal :header="modoEdicion ? 'Editar regla' : 'Nueva regla de distribucion'" :style="{ width: '38rem', maxWidth: '95vw' }">
      <div class="form-grid">
        <div>
          <label>Cuenta contable</label>
          <Select
            v-model="form.id_cuenta"
            :options="cuentas.map((c) => ({ label: `${c.id} - ${c.nombre}`, value: c.id }))"
            optionLabel="label"
            optionValue="value"
            placeholder="Seleccione una cuenta"
            class="w-full"
            @update:modelValue="seleccionarCuenta"
          />
        </div>

        <div>
          <label>Porcentaje</label>
          <InputNumber v-model="form.porcentaje" :min="0" :max="100" :minFractionDigits="2" :maxFractionDigits="2" fluid />
        </div>

        <div>
          <label>Base de calculo</label>
          <Select v-model="form.base_calculo" :options="baseCalculoOptions" optionLabel="label" optionValue="value" class="w-full" />
        </div>

        <div>
          <label>Estado</label>
          <Select v-model="form.estado" :options="estadoOptions" optionLabel="label" optionValue="value" class="w-full" />
        </div>

        <div class="full">
          <label>Descripcion</label>
          <Textarea v-model="form.descripcion" rows="3" autoResize />
        </div>
      </div>

      <template #footer>
        <Button label="Cancelar" severity="secondary" outlined @click="visibleDialog = false" />
        <Button label="Guardar" icon="pi pi-check" :loading="guardando" @click="guardar" />
      </template>
    </Dialog>
  </main>
</template>

<style scoped>
.dist-page {
  min-height: 100%;
  padding: 1rem;
  background: linear-gradient(135deg, #f8fafc 0%, #eff6ff 100%);
}

.dist-shell {
  display: grid;
  gap: 1rem;
}

.dist-hero {
  background: linear-gradient(135deg, #0b1f3a 0%, #1d4ed8 100%);
  color: #fff;
  border-radius: 14px;
  padding: 1rem 1.25rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.dist-hero h1 {
  margin: 0;
  font-size: 1.3rem;
}

.dist-hero p {
  margin: 0.35rem 0 0;
  color: rgba(255, 255, 255, 0.92);
}

.dist-hero-actions {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.dist-kpis {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 0.75rem;
}

.kpi-label {
  margin: 0;
  font-size: 0.85rem;
  color: #64748b;
}

.kpi-value {
  margin: 0.25rem 0 0;
  font-size: 1.45rem;
  font-weight: 700;
  color: #0f172a;
}

.dist-actions {
  margin-bottom: 0.75rem;
}

.dist-row-actions {
  display: flex;
  gap: 0.25rem;
}

.empty-state {
  text-align: center;
  color: #64748b;
  padding: 1rem;
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
}

.form-grid .full {
  grid-column: 1 / -1;
}

label {
  display: block;
  font-size: 0.85rem;
  margin-bottom: 0.35rem;
  font-weight: 600;
  color: #334155;
}

@media (max-width: 768px) {
  .form-grid {
    grid-template-columns: 1fr;
  }
}
</style>
