<script setup>
import { ref, onMounted, computed } from 'vue'
import { peticionesFetchOffline, crearTablaSiNoExisteOffline } from '@/funciones/funciones.js'
import { useToast } from 'primevue/usetoast'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Calendar from 'primevue/calendar'
import Dropdown from 'primevue/dropdown'
import Button from 'primevue/button'
import Tag from 'primevue/tag'
import InputText from 'primevue/inputtext'
import Swal from 'sweetalert2'

const toast = useToast()

const camposArray = [
  'tabla',
  'accion',
  'registro_id',
  'referencia',
  'descripcion',
  'datos_anteriores',
  'datos_nuevos',
  'usuario',
  'fecha',
  'hora',
  'timestamp',
  'created_at',
  'updated_at'
]

const bitacora = ref([])
const filtroTabla = ref(null)
const filtroAccion = ref(null)
const rangoFechas = ref(null)
const busqueda = ref('')
const tablasDisponibles = ref([])
const cargando = ref(false)

const accionesDisponibles = ['INSERTAR', 'ACTUALIZAR', 'ELIMINAR', 'ELIMINAR_TODO', 'ABRIR_EDICION', 'ABRIR_CREACION', 'ABRIR_IMPRESION', 'IMPRIMIR', 'GENERAR_PDF']

const ordenarBitacora = (items = []) =>
  [...items].sort((a, b) => Number(b.timestamp || b.created_at || 0) - Number(a.timestamp || a.created_at || 0))

onMounted(async () => {
  await asegurarTablaBitacora()
  await cargarBitacora()
})

async function asegurarTablaBitacora() {
  if (!window.electron) {
    await crearTablaSiNoExisteOffline('bitacora', camposArray, toast)
    return
  }

  const existe = await window.electron.ipcRenderer.invoke('consultaservidor', 'tableExists', 'bitacora')
  if (!Array.isArray(existe) || existe[0] !== 'ok') {
    await window.electron.ipcRenderer.invoke('consultaservidor', 'crearTabla', 'bitacora', camposArray.join(','))
  }

  const columnas = await window.electron.ipcRenderer.invoke('consultaservidor', 'getTableColumns', 'bitacora')
  const columnasActuales = Array.isArray(columnas) ? columnas : []
  for (const campo of camposArray) {
    if (!columnasActuales.includes(campo)) {
      await window.electron.ipcRenderer.invoke('consultaservidor', 'addColumnToTable', 'bitacora', campo)
    }
  }
}

async function cargarBitacora() {
  try {
    cargando.value = true
    const data = window.electron
      ? await window.electron.ipcRenderer.invoke('consultaservidor', 'getDataAsArray', 'bitacora')
      : await peticionesFetchOffline('getDataAsArray', 'bitacora')
    bitacora.value = Array.isArray(data) ? ordenarBitacora(data) : []
    tablasDisponibles.value = [...new Set(bitacora.value.map((b) => b.tabla).filter(Boolean))].sort()
  } catch (err) {
    console.error('Error cargando bitacora:', err)
    toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo cargar la bitácora', life: 3000 })
  } finally {
    cargando.value = false
  }
}

const bitacoraFiltrada = computed(() => {
  const query = busqueda.value.trim().toLowerCase()

  return bitacora.value.filter((b) => {
    const pasaTabla = !filtroTabla.value || b.tabla === filtroTabla.value
    const pasaAccion = !filtroAccion.value || b.accion === filtroAccion.value

    let pasaFecha = true
    if (Array.isArray(rangoFechas.value) && rangoFechas.value[0] && rangoFechas.value[1]) {
      const desde = new Date(rangoFechas.value[0])
      const hasta = new Date(rangoFechas.value[1])
      desde.setHours(0, 0, 0, 0)
      hasta.setHours(23, 59, 59, 999)
      const fechaRegistro = new Date(Number(b.timestamp || b.created_at || 0))
      pasaFecha = !Number.isNaN(fechaRegistro.getTime()) && fechaRegistro >= desde && fechaRegistro <= hasta
    }

    if (!query) return pasaTabla && pasaAccion && pasaFecha

    const texto = [
      b.tabla,
      b.accion,
      b.referencia,
      b.descripcion,
      b.usuario,
      b.datos_anteriores,
      b.datos_nuevos
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()

    return pasaTabla && pasaAccion && pasaFecha && texto.includes(query)
  })
})

const formatearFechaHora = (data) => {
  const valor = Number(data?.timestamp || data?.created_at || 0)
  if (!valor) return `${data?.fecha || ''} ${data?.hora || ''}`.trim()

  const fecha = new Date(valor)
  if (Number.isNaN(fecha.getTime())) return `${data?.fecha || ''} ${data?.hora || ''}`.trim()
  return fecha.toLocaleString()
}

const prettyJson = (texto) => {
  if (!texto) return ''
  try {
    return JSON.stringify(JSON.parse(texto), null, 2)
  } catch (error) {
    return texto
  }
}

const accionSeverity = (accion) => {
  if (accion === 'ELIMINAR' || accion === 'ELIMINAR_TODO') return 'danger'
  if (accion === 'ACTUALIZAR') return 'info'
  if (accion === 'IMPRIMIR' || accion === 'GENERAR_PDF') return 'warning'
  if (accion === 'ABRIR_EDICION' || accion === 'ABRIR_CREACION' || accion === 'ABRIR_IMPRESION') return 'secondary'
  return 'success'
}

async function eliminarRegistro(id) {
  const confirm = await Swal.fire({
    title: 'Eliminar registro',
    text: 'Esta acción no se puede deshacer.',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Sí, eliminar',
    cancelButtonText: 'Cancelar'
  })

  if (!confirm.isConfirmed) return

  if (window.electron) {
    await window.electron.ipcRenderer.invoke('consultaservidor', 'deleteEntry', 'bitacora', id)
  } else {
    await peticionesFetchOffline('deleteEntry', 'bitacora', id)
  }
  toast.add({ severity: 'success', summary: 'OK', detail: 'Registro eliminado', life: 2500 })
  await cargarBitacora()
}

async function limpiarBitacora() {
  const confirm = await Swal.fire({
    title: '¿Borrar toda la bitácora?',
    text: 'Esto eliminará todos los registros de actividad.',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Sí, borrar todo',
    cancelButtonText: 'Cancelar'
  })

  if (!confirm.isConfirmed) return

  if (window.electron) {
    await window.electron.ipcRenderer.invoke('consultaservidor', 'deleteAll', 'bitacora')
  } else {
    await peticionesFetchOffline('deleteAll', 'bitacora')
  }
  toast.add({ severity: 'info', summary: 'Bitácora limpia', detail: 'Todos los registros fueron eliminados', life: 2500 })
  await cargarBitacora()
}
</script>

<template>
  <main class="content-wrapper p-4 bitacora-page">
    <div class="bitacora-header">
      <div>
        <h2>Bitácora del sistema</h2>
        <p>Registro de facturas, cotizaciones, eliminaciones y cambios realizados en el sistema.</p>
      </div>
      <div class="bitacora-header-actions">
        <Button label="Recargar" icon="pi pi-refresh" severity="secondary" outlined @click="cargarBitacora" />
        <Button label="Limpiar Bitácora" icon="pi pi-trash" severity="danger" @click="limpiarBitacora" />
      </div>
    </div>

    <div class="bitacora-filtros">
      <InputText v-model="busqueda" placeholder="Buscar por tabla, referencia, usuario o contenido..." />
      <Dropdown v-model="filtroTabla" :options="tablasDisponibles" placeholder="Filtrar por tabla" showClear />
      <Dropdown v-model="filtroAccion" :options="accionesDisponibles" placeholder="Filtrar por acción" showClear />
      <Calendar v-model="rangoFechas" selectionMode="range" dateFormat="dd/mm/yy" placeholder="Rango de fechas" showIcon />
    </div>

    <DataTable
      :value="bitacoraFiltrada"
      :loading="cargando"
      paginator
      :rows="10"
      responsiveLayout="scroll"
      stripedRows
      class="bitacora-table"
    >
      <Column field="tabla" header="Tabla" />
      <Column field="accion" header="Acción">
        <template #body="{ data }">
          <Tag :value="data.accion" :severity="accionSeverity(data.accion)" />
        </template>
      </Column>
      <Column field="referencia" header="Referencia" />
      <Column field="descripcion" header="Descripción" />
      <Column field="usuario" header="Usuario" />
      <Column header="Antes">
        <template #body="{ data }">
          <pre class="json-preview">{{ prettyJson(data.datos_anteriores) }}</pre>
        </template>
      </Column>
      <Column header="Después">
        <template #body="{ data }">
          <pre class="json-preview">{{ prettyJson(data.datos_nuevos) }}</pre>
        </template>
      </Column>
      <Column header="Fecha">
        <template #body="{ data }">
          {{ formatearFechaHora(data) }}
        </template>
      </Column>
      <Column header="Acciones" style="width: 90px">
        <template #body="{ data }">
          <Button icon="pi pi-trash" text severity="danger" @click="eliminarRegistro(data.id)" />
        </template>
      </Column>
      <template #empty>
        <div class="bitacora-empty">
          No hay movimientos registrados todavía.
        </div>
      </template>
    </DataTable>
  </main>
</template>

<style scoped>
.bitacora-page {
  display: grid;
  gap: 1rem;
}

.bitacora-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
}

.bitacora-header h2 {
  margin: 0;
}

.bitacora-header p {
  margin: 0.35rem 0 0;
  color: #64748b;
}

.bitacora-header-actions,
.bitacora-filtros {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.bitacora-filtros > * {
  min-width: 220px;
  flex: 1;
}

.json-preview {
  max-height: 140px;
  overflow-y: auto;
  background: #f8fafc;
  padding: 0.65rem;
  border-radius: 10px;
  font-size: 0.72rem;
  margin: 0;
  white-space: pre-wrap;
  word-break: break-word;
}

.bitacora-empty {
  padding: 1rem;
  text-align: center;
  color: #64748b;
}

@media (max-width: 768px) {
  .bitacora-header {
    flex-direction: column;
  }

  .bitacora-header-actions,
  .bitacora-filtros {
    width: 100%;
  }

  .bitacora-header-actions > *,
  .bitacora-filtros > * {
    width: 100%;
  }
}
</style>
