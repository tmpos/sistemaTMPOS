<template>
  <div>
    <h3 class="font-bold mb-2">Componentes</h3>
    <ul class="space-y-2">
      <li>
        <button class="p-2 w-full bg-white border rounded shadow"
          @click="$emit('addComponent', { 
            type: 'InputText', 
            defaultProps: { label: 'Nuevo input', placeholder: 'Escribe aquí' } 
          })">
          Input
        </button>
      </li>
      <li>
        <button class="p-2 w-full bg-white border rounded shadow"
          @click="$emit('addComponent', { 
            type: 'Dropdown', 
            defaultProps: { label: 'Selecciona', options: ['A','B','C'] } 
          })">
          Select
        </button>
      </li>
    </ul>
  </div>
</template>
