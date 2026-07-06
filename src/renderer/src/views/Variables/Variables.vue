<script setup>
import { ref, onMounted } from 'vue';
import Swal from 'sweetalert2';
import InputSwitch from 'primevue/inputswitch';
import { useToast } from "primevue/usetoast";
import { useDatosEmpresa } from '@/stores';
import {
  peticionesFetchOffline,
  envioElectron,
  encryptarPassword
} from '@/funciones/funciones.js';

const toast = useToast();
const datosEmpresa = useDatosEmpresa();

const datosConfig = ref({});
const link = ref(null);
const api = ref(null);
const tokenCifrado = ref(null);

/************************************************************************/
const updateValue = (event, key) => {
  const current = datosConfig.value[key];
  if (typeof current === 'boolean' || current === 'true' || current === 'false') {
    datosConfig.value[key] = event ? 'true' : 'false';
  } else if (typeof current === 'object') {
    try {
      datosConfig.value[key] = JSON.parse(event.target.value);
    } catch (e) {
      console.error("Invalid JSON input");
    }
  } else {
    datosConfig.value[key] = event.target ? event.target.value : event;
  }
};

/************************************************************************/
onMounted(async () => {
  const datosJSON = await envioElectron('datosarchivo');
  datosConfig.value = datosJSON;
  link.value = datosJSON.VITE_LINKURL;
  api.value = datosJSON.VITE_LINK_API;

  const token = datosJSON.VITE_TOKEN;
  tokenCifrado.value = await encryptarPassword(token, 10);

  if (!datosEmpresa.empresa.nombre) {
    await datosEmpresa.inicializarDatosEmpresa(link.value + api.value);
  }
});

/************************************************************************/
const actualizarDatos = async () => {
  try {
/*    const clonedData = JSON.parse(JSON.stringify(datosConfig.value));
    const response = await peticionesFetchOffline('updateConfigIfChanged', clonedData);
*/

      const datos = datosConfig.value
      const clonedData = JSON.parse(JSON.stringify(datos))
      const envioDatosJSON = await window.electron.ipcRenderer.invoke('actualizarjson', clonedData);

    toast.add({ severity: 'success', summary: 'Éxito', detail: 'Datos Actualizados', life: 3000 });
  } catch (error) {
    console.error('Error actualizando configuración:', error);
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'No se pudieron guardar los cambios',
      life: 3000
    });
  }
};

/************************************************************************/
/* 🟢 Agregar nueva variable */
const agregarVariable = async () => {
  const { value: nueva } = await Swal.fire({
    title: 'Agregar Nueva Variable',
    html: `
      <input id="swal-nombre" class="swal2-input" placeholder="Nombre de la variable">
      <input id="swal-valor" class="swal2-input" placeholder="Valor inicial">
    `,
    focusConfirm: false,
    preConfirm: () => {
      const nombre = document.getElementById('swal-nombre').value.trim();
      const valor = document.getElementById('swal-valor').value;
      if (!nombre) {
        Swal.showValidationMessage('Debes escribir un nombre para la variable');
        return false;
      }
      return { nombre, valor };
    }
  });

  if (nueva) {
    if (datosConfig.value.hasOwnProperty(nueva.nombre)) {
      toast.add({ severity: 'warn', summary: 'Atención', detail: 'Esa variable ya existe', life: 3000 });
      return;
    }

    datosConfig.value[nueva.nombre] = nueva.valor;
    toast.add({ severity: 'success', summary: 'OK', detail: 'Variable agregada', life: 3000 });
  }
};

/************************************************************************/
/* 🔴 Eliminar variable existente */
const eliminarDato = async () => {
  const claves = Object.keys(datosConfig.value);
  if (claves.length === 0) {
    toast.add({ severity: 'info', summary: 'Sin datos', detail: 'No hay variables para eliminar', life: 3000 });
    return;
  }

  const { value: seleccion } = await Swal.fire({
    title: 'Eliminar Variable',
    input: 'select',
    inputOptions: claves.reduce((acc, key) => {
      acc[key] = key;
      return acc;
    }, {}),
    inputPlaceholder: 'Selecciona una variable',
    showCancelButton: true,
    confirmButtonText: 'Eliminar',
    cancelButtonText: 'Cancelar',
    inputValidator: (value) => {
      if (!value) return 'Debes seleccionar una variable';
    }
  });

  if (seleccion) {
    const confirm = await Swal.fire({
      title: '¿Eliminar variable?',
      text: `Se eliminará "${seleccion}" permanentemente.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    });

    if (confirm.isConfirmed) {
      delete datosConfig.value[seleccion];
      toast.add({ severity: 'success', summary: 'OK', detail: `Variable "${seleccion}" eliminada`, life: 3000 });
    }
  }
};

/************************************************************************/
/* 🧩 Editar objetos o arrays (ya implementado) */
const editarObjeto = async (key, value) => {
  try {
    const parsed = typeof value === 'string' ? JSON.parse(value) : value;
    if (Array.isArray(parsed)) {
      Swal.fire({
        title: `Editar arreglo (${key})`,
        html: generarHTMLArrayEditor(parsed),
        showCancelButton: true,
        confirmButtonText: 'Guardar',
        width: '60vw',
        preConfirm: () => {
          const inputs = document.querySelectorAll('.array-item-input');
          const result = [];
          for (const input of inputs) {
            try {
              result.push(JSON.parse(input.value));
            } catch {
              Swal.showValidationMessage('Uno de los elementos no es JSON válido');
              return false;
            }
          }
          return result;
        }
      }).then(result => {
        if (result.isConfirmed) {
          datosConfig.value[key] = result.value;
          toast.add({ severity: 'success', summary: 'OK', detail: 'Arreglo actualizado', life: 3000 });
        }
      });
    } else if (typeof parsed === 'object') {
      mostrarEditorObjeto(key, parsed);
    }
  } catch (err) {
    console.error('Error al editar objeto:', err);
    toast.add({ severity: 'error', summary: 'Error', detail: 'JSON inválido', life: 3000 });
  }
};

function mostrarEditorObjeto(key, objOriginal) {
  let objetoActual = { ...objOriginal };

  const render = () => {
    const html = `
      <div class="d-flex justify-content-between align-items-center mb-2">
        <h6 class="m-0">Propiedades del objeto</h6>
        <button id="btnAgregarProp" class="swal2-confirm swal2-styled" style="background:#3B82F6;padding:5px 10px;">➕ Agregar</button>
      </div>
      <div id="editorObjeto" style="max-height:50vh;overflow-y:auto;">
        ${generarHTMLObjetoEditor(objetoActual)}
      </div>
    `;

    Swal.fire({
      title: `Editar objeto (${key})`,
      html,
      showCancelButton: true,
      confirmButtonText: 'Guardar',
      width: '55vw',
      didOpen: () => {
        document.querySelectorAll('.btnEliminarProp').forEach(btn => {
          btn.addEventListener('click', e => {
            const prop = e.target.dataset.prop;
            delete objetoActual[prop];
            render();
          });
        });

        document.getElementById('btnAgregarProp').addEventListener('click', async () => {
          const { value: formValues } = await Swal.fire({
            title: 'Agregar propiedad',
            html: `
              <input id="swal-newkey" class="swal2-input" placeholder="Nombre de la propiedad">
              <input id="swal-newval" class="swal2-input" placeholder="Valor (texto)">
            `,
            focusConfirm: false,
            preConfirm: () => {
              const k = document.getElementById('swal-newkey').value.trim();
              const v = document.getElementById('swal-newval').value;
              if (!k) {
                Swal.showValidationMessage('Debe escribir una clave');
                return false;
              }
              return { k, v };
            }
          });

          if (formValues) {
            objetoActual[formValues.k] = formValues.v;
            render();
          }
        });
      },
      preConfirm: () => {
        const claves = document.querySelectorAll('.obj-key');
        const valores = document.querySelectorAll('.obj-value');
        const nuevo = {};
        claves.forEach((c, i) => {
          if (c.value.trim()) nuevo[c.value.trim()] = valores[i].value;
        });
        return nuevo;
      }
    }).then(result => {
      if (result.isConfirmed) {
        datosConfig.value[key] = result.value;
        toast.add({ severity: 'success', summary: 'OK', detail: 'Objeto actualizado', life: 3000 });
      }
    });
  };
  render();
}

function generarHTMLArrayEditor(arr) {
  return arr
    .map(
      (item, i) => `
      <label class="text-start d-block mt-2 mb-1">Elemento ${i + 1}</label>
      <textarea class="form-control array-item-input" rows="2">${JSON.stringify(item, null, 2)}</textarea>
    `
    )
    .join('');
}

function generarHTMLObjetoEditor(obj) {
  return Object.entries(obj)
    .map(
      ([k, v]) => `
      <div class="d-flex align-items-center gap-2 mb-2">
        <input type="text" class="form-control obj-key" value="${k}" style="width:40%">
        <input type="text" class="form-control obj-value" value="${v}" style="width:50%">
        <button class="btnEliminarProp swal2-cancel swal2-styled" data-prop="${k}" style="background:#EF4444;padding:5px 10px;">🗑️</button>
      </div>
    `
    )
    .join('');
}
</script>

<template>
<main class="content-wrapper">
  <div class="w-full px-4 mt-5">
    <div class="grid grid-cols-12 gap-4">
      <div class="md:col-span-12">
        <fieldset class="border p-3 rounded mb-2">
          <legend class="float-none w-auto px-2">Acciones</legend>
          <Card>
                <template #content>
<Button label="Actualizar Datos" @click="actualizarDatos" icon="pi pi-check" />
              <Button label="Agregar Nueva" @click="agregarVariable" icon="pi pi-plus" class="ml-2" />
              <Button label="Eliminar Variable" @click="eliminarDato" icon="pi pi-trash" class="ml-2 p-button-danger" />
                </template>
          </Card>
        </fieldset>
      </div>

      <div class="md:col-span-12">
        <fieldset class="border p-3 rounded mb-2">
          <legend class="float-none w-auto px-2">Variables</legend>
          <Card>
                <template #content>
<div class="grid grid-cols-12 gap-4">
                <div
                  class="sm:col-span-12 md:col-span-4 mb-3"
                  v-for="(value, key) in datosConfig"
                  :key="key"
                >
                  <label class="font-semibold mb-1 d-block">{{ key }}</label>

                  <!-- ✅ Booleanos -->
                  <div v-if="typeof value === 'boolean' || value === 'true' || value === 'false'" class="flex items-center gap-2">
                    <InputSwitch
                      :modelValue="value === 'true' || value === true"
                      @update:modelValue="val => updateValue(val, key)"
                    />
                    <span class="text-sm">{{ value === 'true' || value === true ? 'Activo' : 'Inactivo' }}</span>
                  </div>

                  <!-- ✅ Arrays u Objetos -->
                  <div v-else-if="typeof value === 'object' || (typeof value === 'string' && (value.startsWith('{') || value.startsWith('[')))">
                    <Button label="Editar estructura" icon="pi pi-pencil" @click="editarObjeto(key, value)" class="p-button-sm p-button-secondary w-full" />
                  </div>

                  <!-- ✅ Texto normal -->
                  <input
                    v-else
                    type="text"
                    class="form-control"
                    :value="value"
                    @input="event => updateValue(event, key)"
                  />
                </div>
              </div>
                </template>
          </Card>
        </fieldset>
      </div>
    </div>
  </div>
  <Toast />
</main>
</template>
