<script setup>
import { ref, watch, computed } from 'vue'
import { useToast } from 'primevue/usetoast'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  defaultDate: { type: [String, Date, Number], default: null }
})
const emit = defineEmits(['update:modelValue', 'save'])
const toast = useToast()

const visible = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v)
})

const form = ref({
  titulo: '',
  cliente: '',
  telefono: '',
  fecha: '',
  horaInicio: '',
  horaFin: '',
  notas: ''
})

watch(() => props.defaultDate, (d) => {
  if (!d) return
  const dateObj = new Date(d)
  const yyyy = dateObj.getFullYear()
  const mm = String(dateObj.getMonth() + 1).padStart(2, '0')
  const dd = String(dateObj.getDate()).padStart(2, '0')
  const hh = String(dateObj.getHours()).padStart(2, '0')
  const mi = String(dateObj.getMinutes()).padStart(2, '0')
  form.value.fecha = `${yyyy}-${mm}-${dd}`
  form.value.horaInicio = `${hh}:${mi}`
  form.value.horaFin = ''
})

const reset = () => {
  form.value = { titulo: '', cliente: '', telefono: '', fecha: '', horaInicio: '', horaFin: '', notas: '' }
}

const onHide = () => {
  reset()
}

const onSave = () => {
  if (!form.value.titulo || !form.value.fecha || !form.value.horaInicio) {
    toast.add({ severity: 'warn', summary: 'Campos requeridos', detail: 'Título, fecha y hora de inicio son obligatorios', life: 2500 })
    return
  }
  const start = new Date(`${form.value.fecha}T${form.value.horaInicio}:00`)
  const end = form.value.horaFin ? new Date(`${form.value.fecha}T${form.value.horaFin}:00`) : null
  const cita = {
    title: form.value.titulo,
    start: start.toISOString(),
    end: end ? end.toISOString() : undefined,
    extendedProps: {
      tipo: 'CITA',
      cliente: form.value.cliente,
      telefono: form.value.telefono,
      notas: form.value.notas
    },
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
    textColor: 'white'
  }
  emit('save', cita)
  visible.value = false
  reset()
}
</script>

<template>
  <Dialog
    v-model:visible="visible"
    modal
    class="cita-dialog"
    :style="{ width: '90vw', maxWidth: '600px' }"
    @hide="onHide"
  >
    <template #header>
      <div class="dialog-header">
        <i class="pi pi-calendar-plus header-icon"></i>
        <h3 class="header-title">Nueva Cita</h3>
      </div>
    </template>

    <div class="cita-form">
      <div class="form-section">
        <div class="form-group full-width">
          <label class="form-label">
            <i class="pi pi-bookmark"></i>
            Título
          </label>
          <InputText
            v-model="form.titulo"
            placeholder="Motivo o título de la cita"
            class="form-input"
          />
        </div>
      </div>

      <div class="form-section">
        <h4 class="section-title">Información del Cliente</h4>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">
              <i class="pi pi-user"></i>
              Cliente
            </label>
            <InputText
              v-model="form.cliente"
              placeholder="Nombre del cliente"
              class="form-input"
            />
          </div>
          <div class="form-group">
            <label class="form-label">
              <i class="pi pi-phone"></i>
              Teléfono
            </label>
            <InputText
              v-model="form.telefono"
              placeholder="Teléfono"
              class="form-input"
            />
          </div>
        </div>
      </div>

      <div class="form-section">
        <h4 class="section-title">Fecha y Hora</h4>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">
              <i class="pi pi-calendar"></i>
              Fecha
            </label>
            <InputText
              v-model="form.fecha"
              type="date"
              class="form-input"
            />
          </div>
          <div class="form-group">
            <label class="form-label">
              <i class="pi pi-clock"></i>
              Hora Inicio
            </label>
            <InputText
              v-model="form.horaInicio"
              type="time"
              class="form-input"
            />
          </div>
          <div class="form-group">
            <label class="form-label">
              <i class="pi pi-clock"></i>
              Hora Fin
              <span class="optional-badge">Opcional</span>
            </label>
            <InputText
              v-model="form.horaFin"
              type="time"
              class="form-input"
            />
          </div>
        </div>
      </div>

      <div class="form-section">
        <div class="form-group full-width">
          <label class="form-label">
            <i class="pi pi-align-left"></i>
            Notas
          </label>
          <Textarea
            v-model="form.notas"
            autoResize
            rows="3"
            placeholder="Notas adicionales sobre la cita"
            class="form-textarea"
          />
        </div>
      </div>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <Button
          label="Cancelar"
          icon="pi pi-times"
          class="btn-cancel"
          @click="visible=false"
        />
        <Button
          label="Guardar Cita"
          icon="pi pi-check"
          class="btn-save"
          @click="onSave"
        />
      </div>
    </template>
  </Dialog>
</template>

<style scoped>
.cita-dialog :deep(.p-dialog) {
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
}

.cita-dialog :deep(.p-dialog-header) {
  background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
  color: white;
  padding: 1.5rem 2rem;
  border-radius: 16px 16px 0 0;
}

.dialog-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  width: 100%;
}

.header-icon {
  font-size: 1.75rem;
  color: white;
}

.header-title {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 700;
  color: white;
}

.cita-dialog :deep(.p-dialog-content) {
  padding: 2rem;
  background: #f8fafc;
}

.cita-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.form-section {
  background: white;
  padding: 1.5rem;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
}

.form-section:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.section-title {
  margin: 0 0 1rem 0;
  font-size: 0.95rem;
  font-weight: 700;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  border-bottom: 2px solid #e8ecf1;
  padding-bottom: 0.5rem;
}

.form-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-group.full-width {
  width: 100%;
}

.form-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9rem;
  font-weight: 600;
  color: #475569;
}

.form-label i {
  color: #6366f1;
  font-size: 0.9rem;
}

.optional-badge {
  margin-left: auto;
  font-size: 0.75rem;
  padding: 0.15rem 0.5rem;
  background: #e0e7ff;
  color: #6366f1;
  border-radius: 12px;
  font-weight: 600;
}

.form-input,
.form-textarea {
  width: 100%;
  padding: 0.75rem 1rem;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  font-size: 0.95rem;
  transition: all 0.3s ease;
  background: white;
}

.form-input:focus,
.form-textarea:focus {
  border-color: #6366f1;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
  outline: none;
}

.form-input:hover,
.form-textarea:hover {
  border-color: #cbd5e1;
}

.form-textarea {
  min-height: 80px;
  resize: vertical;
  font-family: inherit;
}

.cita-dialog :deep(.p-dialog-footer) {
  padding: 1.5rem 2rem;
  background: white;
  border-top: 2px solid #e8ecf1;
  border-radius: 0 0 16px 16px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
}

.btn-cancel,
.btn-save {
  padding: 0.75rem 1.5rem;
  font-weight: 600;
  border-radius: 8px;
  transition: all 0.3s ease;
  border: none;
}

.btn-cancel {
  background: #f1f5f9;
  color: #64748b;
}

.btn-cancel:hover {
  background: #e2e8f0;
  transform: translateY(-2px);
}

.btn-save {
  background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
  color: white;
  box-shadow: 0 4px 15px rgba(79, 70, 229, 0.3);
}

.btn-save:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(79, 70, 229, 0.4);
}

/* Responsive */
@media (max-width: 640px) {
  .form-row {
    grid-template-columns: 1fr;
  }

  .cita-dialog :deep(.p-dialog-content) {
    padding: 1rem;
  }

  .form-section {
    padding: 1rem;
  }
}

/* Animación de entrada */
@keyframes slideInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.cita-dialog :deep(.p-dialog) {
  animation: slideInUp 0.3s ease;
}
</style>

