<script setup>
import { ref } from 'vue'
import { GridLayout, GridItem } from 'vue3-grid-layout'
import Swal from 'sweetalert2'

/* ================================
   📦 Componentes disponibles
================================ */
const availableComponents = ref([
  { type: 'InputText',   label: 'Input',       defaultProps: { placeholder: 'Escribe...' } },
  { type: 'Dropdown',    label: 'Select',      defaultProps: { options: [{ label: 'A', value: 'A' }, { label: 'B', value: 'B' }] } },
  { type: 'Checkbox',    label: 'Checkbox',    defaultProps: { binary: true } },
  { type: 'Textarea',    label: 'Textarea',    defaultProps: { rows: 3, placeholder: 'Escribe un texto largo...' } },
  { type: 'Calendar',    label: 'Date Picker', defaultProps: { showIcon: true } },
  { type: 'InputNumber', label: 'Número',      defaultProps: { placeholder: '0' } },
  { type: 'RadioButton', label: 'Radio',       defaultProps: { value: 'Opción', name: 'radioGroup' } },
  { type: 'InputSwitch', label: 'Switch',      defaultProps: { modelValue: false } },
])

/* ================================
   🧩 Estado principal
================================ */
const layout = ref([])
const selectedComponent = ref(null)

/* ================================
   🚀 Drag & Drop
================================ */
function onDragStart(e, item) {
  e.dataTransfer.effectAllowed = 'copy'
  e.dataTransfer.setData('component', JSON.stringify(item))
}

function onDrop(e) {
  const data = e.dataTransfer.getData('component')
  if (!data) return
  const item = JSON.parse(data)
  const id = Date.now().toString()

  const newItem = {
    x: 0,
    y: Infinity, // 👈 lo coloca al final, sin force reflow
    w: 6,
    h: 2,
    i: id,
    type: item.type,
    props: {
      ...item.defaultProps,
      // ids/names útiles si luego exportas y usas v-model por campo
      id: `${item.type.toLowerCase()}_${id}`,
      name: `${item.type.toLowerCase()}_${id}`,
      class: 'w-full',
    },
  }

  layout.value.push(newItem)
}

function selectComponent(comp) {
  selectedComponent.value = comp
}

function removeComponent(id) {
  layout.value = layout.value.filter(c => c.i !== id)
  if (selectedComponent.value?.i === id) selectedComponent.value = null
}

/* ================================
   💾 Exportar como JSON
================================ */
function exportForm() {
  const dataStr = JSON.stringify(layout.value, null, 2)
  const blob = new Blob([dataStr], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = 'formulario.json'
  link.click()
  URL.revokeObjectURL(url)
}

/* ================================
   📝 Generar código Vue (export)
   — escapamos <template> y <script> —
================================ */
function generateFormCode() {
  const formName = 'datoscamposGenerado'
  let formHTML = `&lt;template&gt;\n  <form id="formularioGenerado" action="" method="">\n    <div class="grid grid-cols-12 gap-4 mt-4 text-blue-600">\n`

  layout.value.forEach(comp => {
    const fieldId = comp.props.id || `${comp.type.toLowerCase()}_${comp.i}`
    const fieldName = comp.props.name || fieldId

    let field = ''
    switch (comp.type) {
      case 'InputText':
        field = `
          <label for="${fieldId}" class="block text-sm font-medium text-gray-700 dark:text-gray-400">${comp.props.placeholder || 'Campo'}</label>
          <InputText 
            id="${fieldId}" 
            name="${fieldName}" 
            v-model="${formName}.${comp.i}" 
            placeholder="${comp.props.placeholder || ''}" 
            class="${comp.props.class || 'w-full'}" 
          />`
        break

      case 'Dropdown':
        field = `
          <label for="${fieldId}" class="block text-sm font-medium text-gray-700">Selecciona</label>
          <Dropdown 
            id="${fieldId}"
            name="${fieldName}"
            v-model="${formName}.${comp.i}" 
            :options='${JSON.stringify(comp.props.options || [])}' 
            optionLabel="label" 
            optionValue="value" 
            placeholder="Selecciona" 
            class="${comp.props.class || 'w-full'}" 
          />`
        break

      case 'Checkbox':
        field = `
          <div class="flex items-center gap-2">
            <Checkbox 
              inputId="${fieldId}" 
              name="${fieldName}" 
              v-model="${formName}.${comp.i}" 
              :binary="true" 
            />
            <label for="${fieldId}" class="text-sm">Opción</label>
          </div>`
        break

      case 'Textarea':
        field = `
          <label for="${fieldId}" class="block text-sm font-medium text-gray-700">${comp.props.placeholder || 'Texto'}</label>
          <Textarea 
            id="${fieldId}" 
            name="${fieldName}" 
            v-model="${formName}.${comp.i}" 
            rows="${comp.props.rows || 3}" 
            placeholder="${comp.props.placeholder || ''}" 
            class="${comp.props.class || 'w-full'}" 
          />`
        break

      case 'Calendar':
        field = `
          <label for="${fieldId}" class="block text-sm font-medium text-gray-700">Fecha</label>
          <Calendar 
            id="${fieldId}" 
            name="${fieldName}" 
            v-model="${formName}.${comp.i}" 
            showIcon 
            class="${comp.props.class || 'w-full'}"
          />`
        break

      case 'InputNumber':
        field = `
          <label for="${fieldId}" class="block text-sm font-medium text-gray-700">Número</label>
          <InputNumber 
            inputId="${fieldId}" 
            name="${fieldName}" 
            v-model="${formName}.${comp.i}" 
            inputClass="${comp.props.class || 'w-full'}" 
          />`
        break

      case 'RadioButton':
        field = `
          <div class="flex items-center gap-2">
            <RadioButton 
              inputId="${fieldId}" 
              name="${fieldName}" 
              v-model="${formName}.${comp.i}" 
              :value="${JSON.stringify(comp.props.value ?? 'Opción')}" 
            />
            <label for="${fieldId}" class="text-sm">${comp.props.value ?? 'Opción'}</label>
          </div>`
        break

      case 'InputSwitch':
        field = `
          <div class="flex items-center gap-2">
            <InputSwitch v-model="${formName}.${comp.i}" />
            <label class="text-sm">Switch</label>
          </div>`
        break

      default:
        field = `<!-- Componente ${comp.type} aún no soportado -->`
    }

    // por simplicidad: cada campo ocupa 12 cols
    formHTML += `      <div class="col-span-12">\n${field}\n      </div>\n`
  })

  formHTML += `    </div>\n  </form>\n&lt;/template&gt;\n\n&lt;script setup&gt;\nimport { ref } from "vue"\n\nconst ${formName} = ref({})\n&lt;/script&gt;`

  Swal.fire({
    title: 'Código generado',
    html: `
      <textarea readonly style="width:100%;height:300px;font-family:monospace;">${formHTML}</textarea>
    `,
    width: '900px',
    showCloseButton: true,
    confirmButtonText: 'Copiar al portapapeles',
  }).then(result => {
    if (result.isConfirmed) {
      navigator.clipboard.writeText(
        formHTML.replace(/&lt;/g, '<').replace(/&gt;/g, '>')
      )
      Swal.fire('Copiado!', 'El formulario fue copiado al portapapeles', 'success')
    }
  })
}
</script>

<template>
  <main class="content-wrapper">
    <div class="mt-5">
      <!-- 🔘 Botones -->
      <div class="mb-4 text-right">
        <Button label="Exportar formulario" icon="pi pi-download" class="p-button-success" @click="exportForm" />
        <Button label="Generar Formulario" icon="pi pi-code" class="p-button-success mb-3" @click="generateFormCode" />
      </div>

      <div class="grid grid-cols-12 h-screen gap-2">
        <!-- Panel izquierdo -->
        <div class="col-span-2 bg-gray-100 p-2 border-r overflow-y-auto">
          <h3 class="font-bold mb-2">Componentes</h3>
          <ul class="space-y-2">
            <li v-for="item in availableComponents" :key="item.type">
              <div
                draggable="true"
                @dragstart="(e) => onDragStart(e, item)"
                class="p-2 bg-white border rounded cursor-move hover:bg-gray-50"
              >
                {{ item.label }}
              </div>
            </li>
          </ul>
        </div>

        <!-- Zona central -->
        <div
          class="col-span-7 bg-gray-50 p-4 border"
          @dragover.prevent
          @drop="onDrop"
        >
          <GridLayout
            v-model:layout="layout"
            :col-num="12"
            :row-height="80"
            :is-draggable="true"
            :is-resizable="true"
            :vertical-compact="true"
            :margin="[10, 10]"
            :auto-size="true"
          >
            <GridItem
              v-for="comp in layout"
              :key="comp.i"
              :x="comp.x"
              :y="comp.y"
              :w="comp.w"
              :h="comp.h"
              :i="comp.i"
              class="bg-white border shadow rounded cursor-pointer relative flex flex-col"
              @click="selectComponent(comp)"
            >
              <!-- Header -->
              <div class="flex justify-between items-center border-b px-2 py-1">
                <span class="text-xs text-gray-500">({{ comp.type }})</span>
                <button
                  class="text-red-500 hover:text-red-700 text-sm font-bold"
                  @click.stop="removeComponent(comp.i)"
                >
                  ✕
                </button>
              </div>

              <!-- Contenido -->
              <div class="p-2 flex-1 overflow-auto">
                <component :is="comp.type" v-bind="comp.props" class="w-full" />
              </div>
            </GridItem>
          </GridLayout>
        </div>

        <!-- Panel derecho -->
        <div class="col-span-3 bg-gray-100 p-4 border-l overflow-y-auto">
          <h3 class="font-bold mb-2">Propiedades</h3>
          <div v-if="selectedComponent">
            <!-- ID -->
            <div class="mb-3">
              <label class="block text-sm font-medium">ID</label>
              <InputText v-model="selectedComponent.props.id" class="w-full" />
            </div>

            <!-- NAME -->
            <div class="mb-3">
              <label class="block text-sm font-medium">Name</label>
              <InputText v-model="selectedComponent.props.name" class="w-full" />
            </div>

            <!-- CLASS -->
            <div class="mb-3">
              <label class="block text-sm font-medium">Clase CSS</label>
              <InputText v-model="selectedComponent.props.class" class="w-full" placeholder="w-full" />
            </div>

            <!-- Placeholder (InputText / Textarea) -->
            <div v-if="['InputText','Textarea'].includes(selectedComponent.type)" class="mb-3">
              <label class="block text-sm font-medium">Placeholder</label>
              <InputText v-model="selectedComponent.props.placeholder" class="w-full" />
            </div>

            <!-- Filas (Textarea) -->
            <div v-if="selectedComponent.type === 'Textarea'" class="mb-3">
              <label class="block text-sm font-medium">Filas</label>
              <InputNumber v-model="selectedComponent.props.rows" class="w-full" />
            </div>

            <!-- Options (Dropdown) -->
            <div v-if="selectedComponent.type === 'Dropdown'" class="mb-3">
              <label class="block text-sm font-medium">Options (coma separadas)</label>
              <InputText
                v-model="selectedComponent.props.optionsString"
                class="w-full"
                placeholder="A,B,C"
                @input="selectedComponent.props.options = (selectedComponent.props.optionsString || '')
                  .split(',')
                  .map(o => o.trim())
                  .filter(Boolean)
                  .map(o => ({ label:o, value:o }))"
              />
            </div>
          </div>

          <div v-else class="text-gray-400 text-sm">
            Selecciona un componente para editar sus propiedades
          </div>
        </div>
      </div>
    </div>
  </main>
</template>
