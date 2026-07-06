<template>
  <div class="premios-container p-4">
    <div class="card">
      <div class="card-header d-flex justify-content-between align-items-center">
        <h3><i class="pi pi-gift mr-2"></i>Gestión de Premios</h3>
        <Button
          label="Nuevo Premio"
          icon="pi pi-plus"
          @click="abrirDialogPremio()"
          class="p-button-success"
        />
      </div>

      <div class="card-body">
        <DataTable
          :value="premios"
          :paginator="true"
          :rows="10"
          :loading="loading"
          responsiveLayout="scroll"
          class="p-datatable-sm"
        >
          <Column field="nombre" header="Nombre" sortable></Column>
          <Column field="tipo" header="Tipo" sortable>
            <template #body="slotProps">
              <Tag
                :value="obtenerEtiquetaTipo(slotProps.data.tipo)"
                :severity="obtenerSeveridadTipo(slotProps.data.tipo)"
                :icon="obtenerIconoTipo(slotProps.data.tipo)"
              />
            </template>
          </Column>
          <Column field="descripcion" header="Descripción"></Column>
          <Column field="imagen" header="Imagen">
            <template #body="slotProps">
              <img
                v-if="slotProps.data.imagen"
                :src="slotProps.data.imagen"
                :alt="slotProps.data.nombre"
                style="width: 50px; height: 50px; object-fit: cover; border-radius: 4px;"
              />
              <span v-else class="text-muted">Sin imagen</span>
            </template>
          </Column>
          <Column field="color" header="Color">
            <template #body="slotProps">
              <div class="d-flex align-items-center">
                <div
                  :style="{
                    width: '30px',
                    height: '30px',
                    backgroundColor: slotProps.data.color,
                    borderRadius: '4px',
                    border: '1px solid #ccc'
                  }"
                ></div>
                <span class="ml-2">{{ slotProps.data.color }}</span>
              </div>
            </template>
          </Column>
          <Column field="probabilidad" header="Probabilidad (%)" sortable>
            <template #body="slotProps">
              {{ slotProps.data.probabilidad }}%
            </template>
          </Column>
          <Column field="cantidad" header="Cantidad" sortable>
            <template #body="slotProps">
              <span v-if="slotProps.data.cantidad > 0">{{ slotProps.data.cantidad }}</span>
              <span v-else class="text-muted">∞</span>
            </template>
          </Column>
          <Column field="activo" header="Estado">
            <template #body="slotProps">
              <Tag
                :value="slotProps.data.activo ? 'Activo' : 'Inactivo'"
                :severity="slotProps.data.activo ? 'success' : 'danger'"
              />
            </template>
          </Column>
          <Column header="Acciones">
            <template #body="slotProps">
              <Button
                icon="pi pi-pencil"
                class="p-button-rounded p-button-info p-button-sm mr-2"
                @click="editarPremio(slotProps.data)"
              />
              <Button
                icon="pi pi-trash"
                class="p-button-rounded p-button-danger p-button-sm"
                @click="eliminarPremio(slotProps.data)"
              />
            </template>
          </Column>
        </DataTable>
      </div>
    </div>

    <!-- Dialog para crear/editar premio -->
    <Dialog
      v-model:visible="dialogPremio"
      :modal="true"
      :style="{ width: '820px' }"
      :breakpoints="{ '960px': '92vw', '640px': '100vw' }"
    >
      <template #header>
        <div class="dialog-header">
          <div class="dialog-header-icon" :style="{ background: premioForm.color || '#6366f1' }">
            <i class="pi pi-gift"></i>
          </div>
          <div>
            <h4 class="dialog-title">{{ premioEditando ? 'Editar Premio' : 'Nuevo Premio' }}</h4>
            <p class="dialog-subtitle">Configura los detalles del premio para la ruleta</p>
          </div>
        </div>
      </template>

      <div class="dialog-body">
        <div class="dialog-grid">
          <!-- Columna izquierda: Formulario -->
          <div class="form-column">
            <div class="field-group">
              <label class="field-label" for="nombre">Nombre del premio <span class="req">*</span></label>
              <InputText
                id="nombre"
                v-model="premioForm.nombre"
                :class="{ 'p-invalid': submitted && !premioForm.nombre }"
                placeholder="Ej: Descuento 10%, Vale $100"
              />
              <small v-if="submitted && !premioForm.nombre" class="p-error">El nombre es requerido</small>
            </div>

            <div class="field-group">
              <label class="field-label">Tipo de premio <span class="req">*</span></label>
              <div class="chip-group">
                <button
                  v-for="opt in tiposDisponibles"
                  :key="opt.value"
                  type="button"
                  :class="['chip-btn', { active: premioForm.tipo === opt.value }]"
                  @click="premioForm.tipo = opt.value"
                >{{ opt.label }}</button>
              </div>
              <small v-if="submitted && !premioForm.tipo" class="p-error">El tipo es requerido</small>
            </div>

            <div class="field-group">
              <label class="field-label" for="descripcion">Descripción</label>
              <Textarea
                id="descripcion"
                v-model="premioForm.descripcion"
                rows="3"
                fluid
                :placeholder="obtenerPlaceholderDescripcion()"
              />
            </div>

            <div class="field-group">
              <label class="field-label" for="imagen">URL de imagen</label>
              <InputText
                id="imagen"
                v-model="premioForm.imagen"
                placeholder="https://..."
              />
              <small class="field-hint">Opcional. Deja en blanco para usar ícono por defecto.</small>
            </div>

            <div class="field-row">
              <div class="field-group flex-1">
                <label class="field-label">Color <span class="req">*</span></label>
                <div class="color-group">
                  <input
                    type="color"
                    v-model="premioForm.color"
                    class="color-swatch"
                  />
                  <InputText
                    v-model="premioForm.color"
                    :class="{ 'p-invalid': submitted && !premioForm.color }"
                    placeholder="#FF6384"
                  />
                </div>
                <small v-if="submitted && !premioForm.color" class="p-error">El color es requerido</small>
              </div>

              <div class="field-group flex-1">
                <label class="field-label">Probabilidad <span class="req">*</span></label>
                <InputNumber
                  v-model="premioForm.probabilidad"
                  :min="0"
                  :max="100"
                  :class="{ 'p-invalid': submitted && !premioForm.probabilidad }"
                  suffix="%"
                  :showButtons="true"
                  :step="1"
                />
                <small v-if="submitted && !premioForm.probabilidad" class="p-error">La probabilidad es requerida</small>
                <small class="field-hint">El resto se asigna a "sin premio"</small>
              </div>

              <div class="field-group flex-1">
                <label class="field-label">Cantidad</label>
                <InputNumber
                  v-model="premioForm.cantidad"
                  :min="0"
                  :max="999999"
                  :step="1"
                  placeholder="0"
                />
                <small class="field-hint">Stock disponible de este premio. 0 = ilimitado</small>
              </div>

            </div>

            <div class="field-group switch-group">
              <div class="switch-row">
                <label class="field-label" for="activo">Premio activo</label>
                <InputSwitch inputId="activo" v-model="premioForm.activo" />
              </div>
              <small class="field-hint">Los premios inactivos no aparecerán en la ruleta</small>
            </div>
          </div>

          <!-- Columna derecha: Vista previa -->
          <div class="preview-column">
            <div class="preview-card">
              <div class="preview-head">Vista previa</div>
              <div class="preview-body">
                <div class="preview-icon" :style="{ background: premioForm.color || '#6366f1' }">
                  <i :class="obtenerIconoTipo(premioForm.tipo)"></i>
                </div>
                <h5 class="preview-name">{{ premioForm.nombre || 'Nombre del premio' }}</h5>
                <span class="preview-tag" :style="{ background: premioForm.color || '#6366f1' }">{{ obtenerEtiquetaTipo(premioForm.tipo) }}</span>
                <p class="preview-desc">{{ premioForm.descripcion || 'Sin descripción' }}</p>
                <div class="preview-bar">
                  <div class="preview-bar-track">
                    <div class="preview-bar-fill" :style="{ width: (premioForm.probabilidad || 0) + '%', background: premioForm.color || '#6366f1' }"></div>
                  </div>
                  <span class="preview-bar-value">{{ premioForm.probabilidad || 0 }}%</span>
                </div>
                <div class="preview-stock">
                  <i class="pi pi-box"></i>
                  <span v-if="premioForm.cantidad > 0">{{ premioForm.cantidad }} disponibles</span>
                  <span v-else>Stock ilimitado</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <template #footer>
        <div class="dialog-actions">
          <Button
            label="Cancelar"
            icon="pi pi-times"
            @click="dialogPremio = false"
            class="p-button-outlined"
          />
          <Button
            label="Guardar Premio"
            icon="pi pi-check"
            @click="guardarPremio"
            :loading="guardando"
          />
        </div>
      </template>
    </Dialog>

    <!-- Dialog de confirmación para eliminar -->
    <Dialog
      v-model:visible="dialogEliminar"
      header="Confirmar Eliminación"
      :modal="true"
      :style="{ width: '450px' }"
    >
      <div class="confirmation-content">
        <i class="pi pi-exclamation-triangle mr-3" style="font-size: 2rem; color: #f59e0b;"></i>
        <span>¿Está seguro que desea eliminar el premio <b>{{ premioAEliminar?.nombre }}</b>?</span>
      </div>
      <template #footer>
        <Button
          label="No"
          icon="pi pi-times"
          @click="dialogEliminar = false"
          class="p-button-text"
        />
        <Button
          label="Sí"
          icon="pi pi-check"
          @click="confirmarEliminar"
          class="p-button-danger"
          :loading="eliminando"
        />
      </template>
    </Dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useToast } from 'primevue/usetoast'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import Textarea from 'primevue/textarea'
import InputNumber from 'primevue/inputnumber'
import Tag from 'primevue/tag'
import InputSwitch from 'primevue/inputswitch'
import { peticionesFetchOffline, crearTablaSiNoExisteOffline } from '@/funciones/funciones.js'

const toast = useToast()

// Definir campos de la tabla premios_ruleta
const camposArray = [
  'id',
  'nombre',
  'descripcion',
  'tipo',
  'imagen',
  'color',
  'probabilidad',
  'cantidad',
  'activo',
  'created_at',
  'updated_at'
]

// Estados
const premios = ref([])
const loading = ref(false)
const dialogPremio = ref(false)
const dialogEliminar = ref(false)
const premioEditando = ref(null)
const premioAEliminar = ref(null)
const submitted = ref(false)
const guardando = ref(false)
const eliminando = ref(false)

// Tipos disponibles
const tiposDisponibles = [
  { label: '🎁 Premio', value: 'premio' },
  { label: '🔄 Comodín (Girar de Nuevo)', value: 'comodin' },
  { label: '💬 Mensaje de Participación', value: 'mensaje' }
]

// Formulario de premio
const premioForm = ref({
  id: null,
  nombre: '',
  descripcion: '',
  tipo: 'premio',
  imagen: '',
  color: '#FF6384',
  probabilidad: 10,
  cantidad: 0,
  activo: true
})

// Colores predefinidos para premios
const coloresPredefinidos = [
  '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF',
  '#FF9F40', '#FF6384', '#C9CBCF', '#4BC0C0', '#FF6384'
]

// Cargar premios
const cargarPremios = async () => {
  loading.value = true
  try {
    const response = await peticionesFetchOffline('getDataAsArray', 'premios_ruleta')
    premios.value = Array.isArray(response) ? response : []
    if (premios.value.length > 0) {
      console.log('📦 Primer premio cargado:', JSON.stringify(premios.value[0]))
    }
  } catch (error) {
    console.error('Error al cargar premios:', error)
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'No se pudieron cargar los premios',
      life: 3000
    })
  } finally {
    loading.value = false
  }
}

// Abrir dialog para crear/editar premio
const abrirDialogPremio = (premio = null) => {
  submitted.value = false
  if (premio) {
    premioEditando.value = premio
    premioForm.value = {
      id: premio.id ?? null,
      nombre: premio.nombre || '',
      descripcion: premio.descripcion || '',
      tipo: premio.tipo || 'premio',
      imagen: premio.imagen || '',
      color: premio.color || '#FF6384',
      probabilidad: premio.probabilidad ?? 10,
      cantidad: premio.cantidad ?? 0,
      activo: premio.activo ?? true
    }
  } else {
    premioEditando.value = null
    const colorRandom = coloresPredefinidos[Math.floor(Math.random() * coloresPredefinidos.length)]
    premioForm.value = {
      id: null,
      nombre: '',
      descripcion: '',
      tipo: 'premio',
      imagen: '',
      color: colorRandom,
      probabilidad: 10,
      cantidad: 0,
      activo: true
    }
  }
  dialogPremio.value = true
}

// Obtener placeholder de descripción según tipo
const obtenerPlaceholderDescripcion = () => {
  switch (premioForm.value.tipo) {
    case 'premio':
      return 'Ej: Obtén un 10% de descuento en tu próxima compra'
    case 'comodin':
      return 'Ej: ¡Tienes otra oportunidad! Gira de nuevo la ruleta'
    case 'mensaje':
      return 'Ej: Gracias por participar. ¡Sigue intentando!'
    default:
      return ''
  }
}

// Obtener etiqueta del tipo
const obtenerEtiquetaTipo = (tipo) => {
  switch (tipo) {
    case 'premio': return 'Premio'
    case 'comodin': return 'Comodín'
    case 'mensaje': return 'Mensaje'
    default: return tipo || 'Premio'
  }
}

// Obtener severidad para el Tag
const obtenerSeveridadTipo = (tipo) => {
  switch (tipo) {
    case 'premio': return 'success'
    case 'comodin': return 'info'
    case 'mensaje': return 'warning'
    default: return 'success'
  }
}

// Obtener ícono para el Tag
const obtenerIconoTipo = (tipo) => {
  switch (tipo) {
    case 'premio': return 'pi pi-gift'
    case 'comodin': return 'pi pi-refresh'
    case 'mensaje': return 'pi pi-comment'
    default: return 'pi pi-gift'
  }
}

// Editar premio
const editarPremio = (premio) => {
  abrirDialogPremio(premio)
}

// Guardar premio
const guardarPremio = async () => {
  submitted.value = true

  if (!premioForm.value.nombre || !premioForm.value.tipo || !premioForm.value.color || premioForm.value.probabilidad === null) {
    return
  }

  guardando.value = true
  try {
    const ahora = Date.now()

    const datosForm = {
      nombre: premioForm.value.nombre,
      descripcion: premioForm.value.descripcion || '',
      tipo: premioForm.value.tipo,
      imagen: premioForm.value.imagen || '',
      color: premioForm.value.color,
      probabilidad: premioForm.value.probabilidad,
      cantidad: premioForm.value.cantidad || 0,
      activo: premioForm.value.activo ? 1 : 0,
      updated_at: ahora
    }
    console.log('📦 datosForm a guardar:', JSON.stringify(datosForm))

    if (premioEditando.value) {
      // Actualizar premio existente - formato: tabla, datos
      datosForm.id = premioEditando.value.id
      await peticionesFetchOffline('updateData', 'premios_ruleta', JSON.stringify(datosForm))
      toast.add({
        severity: 'success',
        summary: 'Éxito',
        detail: 'Premio actualizado correctamente',
        life: 3000
      })
    } else {
      // Crear nuevo premio - formato: tabla, datos
      datosForm.created_at = ahora
      await peticionesFetchOffline('insertData', 'premios_ruleta', JSON.stringify(datosForm))
      toast.add({
        severity: 'success',
        summary: 'Éxito',
        detail: 'Premio creado correctamente',
        life: 3000
      })
    }

    dialogPremio.value = false
    await cargarPremios()
  } catch (error) {
    console.error('Error al guardar premio:', error)
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'No se pudo guardar el premio',
      life: 3000
    })
  } finally {
    guardando.value = false
  }
}

// Eliminar premio
const eliminarPremio = (premio) => {
  premioAEliminar.value = premio
  dialogEliminar.value = true
}

// Confirmar eliminación
const confirmarEliminar = async () => {
  eliminando.value = true
  try {
    // Formato correcto: tabla, id
    await peticionesFetchOffline('deleteData', 'premios_ruleta', premioAEliminar.value.id)

    toast.add({
      severity: 'success',
      summary: 'Éxito',
      detail: 'Premio eliminado correctamente',
      life: 3000
    })

    dialogEliminar.value = false
    await cargarPremios()
  } catch (error) {
    console.error('Error al eliminar premio:', error)
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'No se pudo eliminar el premio',
      life: 3000
    })
  } finally {
    eliminando.value = false
  }
}

// Lifecycle
onMounted(async () => {
  // Asegurar que la tabla existe y tiene todos los campos
  await crearTablaSiNoExisteOffline('premios_ruleta', camposArray, toast)
  // Cargar premios
  await cargarPremios()
})
</script>

<style scoped>
.premios-container {
  max-width: 1400px;
  margin: 0 auto;
}

.confirmation-content {
  display: flex;
  align-items: center;
  padding: 1rem;
}

/* ============ DIALOG HEADER ============ */
.dialog-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 4px 0;
}

.dialog-header-icon {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 1.15rem;
  flex-shrink: 0;
  transition: background 0.3s;
}

.dialog-title {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 700;
  color: #0f172a;
  line-height: 1.3;
}

.dialog-subtitle {
  margin: 2px 0 0;
  font-size: 0.78rem;
  color: #94a3b8;
  line-height: 1.2;
}

/* ============ DIALOG BODY / GRID ============ */
.dialog-body {
  padding: 4px 0;
}

.dialog-grid {
  display: grid;
  grid-template-columns: 1.8fr 1fr;
  gap: 28px;
  align-items: start;
}

/* ============ FORM COLUMN ============ */
.form-column {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.field-group {
  margin-bottom: 14px;
}

.field-group:last-child {
  margin-bottom: 0;
}

.field-label {
  display: block;
  font-size: 0.8rem;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 5px;
  letter-spacing: 0.01em;
}

.field-label .req {
  color: #ef4444;
}

.field-hint {
  display: block;
  font-size: 0.72rem;
  color: #94a3b8;
  margin-top: 4px;
  line-height: 1.3;
}

.field-row {
  display: flex;
  gap: 12px;
}

.flex-1 {
  flex: 1;
  min-width: 0;
}

/* ============ INPUT OVERRIDES ============ */
.dialog-body :deep(.p-inputtext) {
  width: 100%;
  border-radius: 8px;
  border: 1.5px solid #e2e8f0;
  padding: 0.55rem 0.75rem;
  font-size: 0.85rem;
  background: #fff;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.02);
  transition: border-color 0.2s, box-shadow 0.2s;
  font-family: inherit;
  color: #0f172a;
}

.dialog-body :deep(.p-inputtext:hover) {
  border-color: #cbd5e1;
}

.dialog-body :deep(.p-inputtext:focus),
.dialog-body :deep(.p-inputtext.p-focus) {
  border-color: #6366f1;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
  outline: none;
}

.dialog-body :deep(.p-inputtext.p-invalid) {
  border-color: #ef4444;
}

.dialog-body :deep(.p-inputtext.p-invalid:focus) {
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
}

.dialog-body :deep(.p-inputnumber) {
  width: 100%;
}

.dialog-body :deep(.p-inputnumber .p-inputtext) {
  border-radius: 8px 0 0 8px;
}

.dialog-body :deep(.p-inputnumber-button-group) {
  border-radius: 0 8px 8px 0;
}

.dialog-body :deep(.p-inputnumber-button) {
  width: 2.2rem;
}

.dialog-body :deep(textarea.p-inputtext) {
  resize: vertical;
  min-height: 82px;
  line-height: 1.5;
}

/* ============ CHIP GROUP ============ */
.chip-group {
  display: flex;
  gap: 8px;
}

.chip-btn {
  flex: 1;
  padding: 9px 8px;
  border: 1.5px solid #e2e8f0;
  border-radius: 8px;
  background: #f8fafc;
  color: #64748b;
  font-size: 0.76rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  text-align: center;
  font-family: inherit;
  line-height: 1.3;
  white-space: nowrap;
}

.chip-btn:hover {
  border-color: #cbd5e1;
  background: #f1f5f9;
  color: #334155;
}

.chip-btn.active {
  border-color: #6366f1;
  background: #eef2ff;
  color: #4f46e5;
  font-weight: 600;
  box-shadow: 0 0 0 1px #6366f1;
}

/* ============ COLOR GROUP ============ */
.color-group {
  display: flex;
  align-items: stretch;
}

.color-swatch {
  width: 42px;
  min-height: 42px;
  border: 1.5px solid #e2e8f0;
  border-right: none;
  border-radius: 8px 0 0 8px;
  cursor: pointer;
  padding: 3px;
  background: #fff;
  flex-shrink: 0;
  box-sizing: border-box;
}

.color-swatch::-webkit-color-swatch-wrapper {
  padding: 0;
}

.color-swatch::-webkit-color-swatch {
  border: none;
  border-radius: 5px;
}

.dialog-body .color-group :deep(.p-inputtext) {
  border-radius: 0 8px 8px 0 !important;
}

/* ============ SWITCH GROUP ============ */
.switch-group {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 12px 14px;
  margin-top: 4px;
}

.switch-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.switch-row .field-label {
  margin-bottom: 0;
}

.dialog-body :deep(.p-inputswitch.p-inputswitch-checked .p-inputswitch-slider) {
  background: #6366f1;
}

.dialog-body :deep(.p-inputswitch:not(.p-disabled):hover .p-inputswitch-slider) {
  background: #e2e8f0;
}

.dialog-body :deep(.p-inputswitch.p-inputswitch-checked:not(.p-disabled):hover .p-inputswitch-slider) {
  background: #4f46e5;
}

.dialog-body :deep(.p-inputswitch .p-inputswitch-slider) {
  border-radius: 20px;
}

/* ============ PREVIEW COLUMN ============ */
.preview-column {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100%;
}

.preview-card {
  width: 100%;
  background: linear-gradient(145deg, #f8fafc 0%, #f1f5f9 100%);
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.04);
}

.preview-head {
  background: #1e293b;
  color: #fff;
  font-size: 0.68rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  padding: 8px 16px;
  text-align: center;
}

.preview-body {
  padding: 28px 20px 24px;
  text-align: center;
}

.preview-icon {
  width: 58px;
  height: 58px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 12px;
  color: #fff;
  font-size: 1.4rem;
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.12);
  transition: background 0.3s;
}

.preview-name {
  font-size: 0.95rem;
  font-weight: 700;
  color: #0f172a;
  margin: 0 0 6px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.preview-tag {
  display: inline-block;
  font-size: 0.63rem;
  font-weight: 600;
  color: #fff;
  padding: 3px 12px;
  border-radius: 20px;
  margin-bottom: 8px;
  letter-spacing: 0.02em;
  transition: background 0.3s;
}

.preview-desc {
  font-size: 0.75rem;
  color: #64748b;
  margin: 0 0 18px;
  line-height: 1.45;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  min-height: 1.45em;
}

.preview-bar {
  display: flex;
  align-items: center;
  gap: 10px;
}

.preview-bar-track {
  flex: 1;
  height: 6px;
  background: #e2e8f0;
  border-radius: 3px;
  overflow: hidden;
}

.preview-bar-fill {
  height: 100%;
  border-radius: 3px;
  transition: width 0.3s, background 0.3s;
}

.preview-bar-value {
  font-size: 0.8rem;
  font-weight: 700;
  color: #475569;
  min-width: 36px;
  text-align: right;
}

.preview-stock {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  margin-top: 12px;
  font-size: 0.72rem;
  color: #94a3b8;
}

/* ============ FOOTER ============ */
.dialog-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;
}

.dialog-actions :deep(.p-button) {
  border-radius: 8px;
  font-size: 0.85rem;
  padding: 0.55rem 1.2rem;
  font-weight: 600;
}

.dialog-actions :deep(.p-button.p-button-outlined) {
  border: 1.5px solid #e2e8f0;
  color: #475569;
}

.dialog-actions :deep(.p-button.p-button-outlined:hover) {
  background: #f8fafc;
  border-color: #cbd5e1;
  color: #1e293b;
}

.dialog-actions :deep(.p-button:not(.p-button-outlined)) {
  background: #6366f1;
  border-color: #6366f1;
}

.dialog-actions :deep(.p-button:not(.p-button-outlined):hover) {
  background: #4f46e5;
  border-color: #4f46e5;
}

/* ============ RESPONSIVE ============ */
@media (max-width: 960px) {
  .dialog-grid {
    grid-template-columns: 1fr;
    gap: 20px;
  }

  .preview-column {
    position: static;
  }

  .preview-card {
    max-width: 320px;
    margin: 0 auto;
  }
}

@media (max-width: 640px) {
  .field-row {
    flex-direction: column;
    gap: 14px;
  }

  .chip-group {
    flex-direction: column;
  }
}

.dialog-body :deep(.p-error) {
  font-size: 0.72rem;
  margin-top: 4px;
  display: block;
}
</style>
