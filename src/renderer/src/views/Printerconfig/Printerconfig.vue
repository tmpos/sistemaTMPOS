<script setup>
import { ref, onMounted, computed, watchEffect } from 'vue';
import { useRouter } from 'vue-router';
import { useToast } from "primevue/usetoast";
import TablaJSON from '../../components/TablaJSON.vue';
import { useDatosEmpresa } from '../../stores';
import {
  peticionesFetchOffline,
  crearTablaSiNoExisteOffline,
  buscadorArrayObjeto,
  arrayToObjetoFromTabla,
  encryptarPassword,
  envioElectron,
  nfecha,
  lasMayusculas
} from '../../funciones/funciones.js';
import Swal from 'sweetalert2';

const router = useRouter();
const toast = useToast();
const datosEmpresa = useDatosEmpresa();

const usuarioLocal = ref({});
const camposArray = ["nombre", "configuraciones", "tipo", "usuario"];
const link = ref('');
const api = ref('');
const token = ref('');
const patronTelefono = ref('');
const linkImpresora = ref('');
const patroncedula = ref('');
const tokenCifrado = ref('');
const tokenCorto = ref('');
const tipo = ref('');
const datosJSON = ref([]);
const selectedItems = ref([]);
const position = ref('top');
const visible = ref(false);
const visiblecrear = ref(false);
const value = ref(null);
const id = ref(null);
const datoscampos = ref({});
const data = ref([]);
const searchQuery = ref('');
const PrinterconfigEditar = ref(null);
const datoscamposPrinterconfig = ref({});
const itemsPrinterconfig = ref([]);
const menu = ref(null);
const currentRowData = ref(null);
const propiedad = ref('');
const valor = ref('');

const openPosition = (pos) => {
  position.value = pos;
  visible.value = true;
};

const limpiarCamposCrear = async () => {
  datoscamposPrinterconfig.value = {};
  await campos();
};

watchEffect(() => {
  if (visiblecrear.value) {
    datoscamposPrinterconfig.value.configuraciones = '[]';
  }
});

const fetchAndSetupData = async () => {
  const response = await peticionesFetchOffline('getDataAsArray', 'printerconfig');
  data.value = response;
};

const campos = async () => {
  const campos = await arrayToObjetoFromTabla('printerconfig');
  datoscamposPrinterconfig.value = campos;
};

const datosConfig = async () => {
  const response = await envioElectron('datosarchivo');
  datosJSON.value = response;
  link.value = response.VITE_LINKURL;
  api.value = response.VITE_LINK_API;
  token.value = response.VITE_TOKEN;
  patronTelefono.value = response.VITE_PATRON_TELEFONO;
  linkImpresora.value = response.VITE_IMPRESORA_LOCAL;
  patroncedula.value = response.VITE_PATRON_CEDULA;
  tokenCorto.value = response.VITE_TOKEN_CORTO;
};

onMounted(async () => {
  await datosConfig();
  tokenCifrado.value = await encryptarPassword(token.value, 10);
  await crearTablaSiNoExisteOffline('printerconfig', camposArray.join(','), toast);
  usuarioLocal.value = JSON.parse(window.localStorage.getItem('usuarioLocal'))[0] || {};
  await campos();
  await fetchAndSetupData();
  datoscamposPrinterconfig.value.tipo = '80mm';
});

const borrarTodo = async () => {
  const result = await Swal.fire({
    title: "¿Estás seguro?",
    text: "¡Se borrarán los datos!",
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Sí, de acuerdo",
    cancelButtonText: "No, cancelar"
  });

  if (result.isConfirmed) {
    const { value: password } = await Swal.fire({
      title: 'Introduce la contraseña',
      input: 'password',
      inputPlaceholder: 'Contraseña',
      showCancelButton: true,
      confirmButtonText: 'Confirmar',
      cancelButtonText: 'Cancelar'
    });

    if (password) {
      if (password === token.value || password === tokenCorto.value) {
        const envioDatos = await peticionesFetchOffline('deleteAll', 'printerconfig');
        if (envioDatos[0] === 'ok') {
          fetchAndSetupData();
          toast.add({ severity: 'success', summary: 'Éxito', detail: 'Datos borrados', life: 3000 });
        } else {
          toast.add({ severity: 'error', summary: 'Error', detail: 'Fallo al borrar datos.', life: 3000 });
        }
      } else {
        toast.add({ severity: 'error', summary: 'Error', detail: 'Contraseña incorrecta', life: 3000 });
      }
    }
  } else if (result.dismiss === Swal.DismissReason.cancel) {
    toast.add({ severity: 'success', summary: 'No te preocupes', detail: 'Datos seguros', life: 3000 });
  }
};

const funcionActualizar = async () => {
  const url = `${link.value}${api.value}/actualizarcampos/printerconfig`;
  if (!datoscampos.value) {
    console.error("Datos incompletos, no se puede actualizar.");
    return;
  }

  if (datoscampos.value.hasOwnProperty('created_at')) {
    datoscampos.value.updated_at = nfecha('timestamp');
  }

  const envioDatos = await peticionesFetchOffline('updateData', 'printerconfig', JSON.stringify(datoscampos.value));
  if (envioDatos[0] === 'ok') {
    visible.value = false;
    fetchAndSetupData();
    toast.add({ severity: 'success', summary: 'Éxito', detail: 'Datos Actualizados', life: 3000 });
  } else {
    toast.add({ severity: 'error', summary: 'Error', detail: 'Fallo al actualizar los datos.', life: 3000 });
  }
};

const funcionCrear = async () => {
  const url = `${link.value}${api.value}/insertar/printerconfig`;
  if (datoscamposPrinterconfig.value.hasOwnProperty('created_at')) {
    datoscamposPrinterconfig.value.created_at = nfecha('timestamp');
    datoscamposPrinterconfig.value.updated_at = nfecha('timestamp');
  }

  const envioDatos = await peticionesFetchOffline('insertData', 'printerconfig', JSON.stringify(datoscamposPrinterconfig.value));
  if (envioDatos[0] === 'ok') {
    fetchAndSetupData();
    toast.add({ severity: 'success', summary: 'Éxito', detail: 'Datos Agregados', life: 3000 });
    limpiarCamposCrear();
    visiblecrear.value = false;
  } else {
    toast.add({ severity: 'error', summary: 'Error', detail: 'Fallo al Agregar los datos.', life: 3000 });
  }
};

const borrarSeleccionados = async () => {
  const ids = obtenerIdsSeleccionados(selectedItems.value);
  const result = await Swal.fire({
    title: "¿Estas Seguro?",
    text: "Se Borraran los Datos!",
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Sí, de acuerdo!",
    cancelButtonText: "No, cancelar!",
  });

  if (result.isConfirmed) {
    const { value: password } = await Swal.fire({
      title: 'Introduce la contraseña',
      input: 'password',
      inputPlaceholder: 'Contraseña',
      showCancelButton: true,
      confirmButtonText: 'Confirmar',
      cancelButtonText: 'Cancelar'
    });

    if (password) {
      if (password === token.value || password === tokenCorto.value) {
        let exitoTotal = true;
        if (ids.length > 0) {
          for (const id of ids) {
            try {
              const envioDatos = await peticionesFetchOffline('deleteEntry', 'printerconfig', id);
            } catch (error) {
              console.error(`Error al eliminar datos para ID: ${id}`, error);
              exitoTotal = false;
            }
          }
          if (exitoTotal) {
            fetchAndSetupData();
            toast.add({ severity: 'success', summary: 'Éxito', detail: 'Datos Borrados', life: 3000 });
          } else {
            toast.add({ severity: 'error', summary: 'Error', detail: 'Fallo al Borrar los datos.', life: 3000 });
          }
        } else {
          toast.add({ severity: 'error', summary: 'Error', detail: 'No hay datos para borrar', life: 3000 });
        }
      } else {
        toast.add({ severity: 'error', summary: 'Error', detail: 'Contraseña incorrecta', life: 3000 });
      }
    }
  } else if (result.dismiss === Swal.DismissReason.cancel) {
    toast.add({ severity: 'success', summary: 'No te preocupes', detail: 'Datos Seguros', life: 3000 });
  }
};

const togglePrinterconfig = (event, rowData) => {
  currentRowData.value = rowData;
  itemsPrinterconfig.value = [
    {
      label: 'Editar',
      icon: 'pi pi-pencil',
      command: () => {
        visible.value = true;
        datoscampos.value = currentRowData.value;
      }
    },
    {
      label: 'Eliminar',
      icon: 'pi pi-trash',
      command: async () => {
        const { value: password } = await Swal.fire({
          title: 'Introduce la contraseña',
          input: 'password',
          inputPlaceholder: 'Contraseña',
          showCancelButton: true,
          confirmButtonText: 'Eliminar',
          cancelButtonText: 'Cancelar'
        });

        if (password) {
          if (password === token.value || password === tokenCorto.value) {
            const datosFactura = await peticionesFetchOffline('deleteEntry', 'printerconfig', rowData.id);
            if (datosFactura[0] === 'ok') {
              toast.add({ severity: 'success', summary: 'Éxito', detail: 'Datos eliminados correctamente', life: 3000 });
              await fetchAndSetupData();
            } else {
              toast.add({ severity: 'error', summary: 'Error', detail: 'Error al eliminar los datos', life: 3000 });
            }
          } else {
            toast.add({ severity: 'error', summary: 'Error', detail: 'Contraseña incorrecta', life: 3000 });
          }
        }
      }
    },
  ];
  menu.value.toggle(event);
};

const filteredPrinterconfig = computed(() => {
  if (!searchQuery.value) return data.value;
  return data.value.filter(busqueda => {
    return Object.values(busqueda).some(value =>
      String(value).toLowerCase().includes(searchQuery.value.toLowerCase())
    );
  });
});

const fnAgregarPropiedad = () => {
  let configuraciones = datoscamposPrinterconfig.value.configuraciones;
  let propJSON;

  try {
    propJSON = JSON.parse(configuraciones);
  } catch (error) {
    console.error("Error al parsear configuraciones:", error);
    propJSON = [];
  }

  if (propiedad.value.trim() && valor.value.trim()) {
    const nProp = {};
    nProp[propiedad.value] = valor.value;
    propJSON.push(nProp);
    datoscamposPrinterconfig.value.configuraciones = JSON.stringify(propJSON);
    propiedad.value = '';
    valor.value = '';
  } else {
    console.error("Propiedad o valor están vacíos");
  }
};

const buscarPrinter = async () => {
  visiblecrear.value = false;
  try {
    const printers = await window.electron.ipcRenderer.invoke("get-printers");
    if (printers.length > 0) {
      const options = printers.map(printer => ({
        value: printer.Location,
        text: printer.Location
      }));

      const { value: selectedPrinter } = await Swal.fire({
        title: 'Selecciona una impresora',
        input: 'select',
        inputOptions: Object.fromEntries(options.map(option => [option.value, option.text])),
        inputPlaceholder: 'Selecciona una impresora',
        showCancelButton: true,
        confirmButtonText: 'Seleccionar',
        cancelButtonText: 'Cancelar'
      });

      if (selectedPrinter) {
        datoscamposPrinterconfig.value.nombre = selectedPrinter;
      }
    } else {
      Swal.fire('No se encontraron impresoras instaladas.', '', 'warning');
    }
  } catch (error) {
    console.error("Error:", error);
    Swal.fire('Error al obtener las impresoras.', '', 'error');
  }
  visiblecrear.value = true;
};

const handleEditClick = (selected) => {
  // Implementar lógica para editar
};

const handleDeleteClick = (selected) => {
  // Implementar lógica para eliminar
};

const handleClickConfigEdit = (uno, dos, tres) => {
  console.log("tres", tres);
  console.log("dos", dos);
  console.log("uno", uno);
};

const handleClickConfig = (index, item, tableId) => {
  console.log("tableId", tableId);
  console.log("item", item);
  console.log("index", index);
};
</script>

<template>
  <main class="content-wrapper">
    <div class="w-full px-4 mx-auto py-8 max-w-7xl">

      <!-- Header Mejorado -->
      <Card class="mb-6 shadow-lg">
        <template #content>
          <div class="bg-gradient-to-r from-purple-500 to-indigo-600 rounded-2xl p-8 text-white">
            <div class="flex items-center gap-4">
              <div class="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                <span class="text-4xl">🖨️</span>
              </div>
              <div>
                <h1 class="text-2xl font-bold">Configuración de Impresoras</h1>
                <p class="text-sm opacity-90 mt-1">Administra las impresoras y sus configuraciones del sistema</p>
              </div>
            </div>
          </div>
        </template>
      </Card>

      <!-- Acciones Rápidas -->
      <Card class="mb-6 shadow-lg">
        <template #content>
          <fieldset class="border-2 border-gray-200 dark:border-gray-700 p-6 rounded-xl bg-gradient-to-br from-blue-50 to-white dark:from-gray-900 dark:to-gray-800">
            <legend class="float-none w-auto px-4 text-lg font-bold text-gray-700 dark:text-gray-200">
              ⚡ Acciones Rápidas
            </legend>

            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">

              <!-- Recargar -->
              <div
                @click="fetchAndSetupData"
                class="group cursor-pointer bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md hover:shadow-xl transition-all duration-300 border border-gray-200 dark:border-gray-700 hover:border-blue-400 dark:hover:border-blue-500"
              >
                <div class="flex flex-col items-center justify-center space-y-3">
                  <div class="w-16 h-16 bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900 dark:to-blue-800 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <span class="text-3xl">🔄</span>
                  </div>
                  <div class="text-center">
                    <div class="text-sm font-bold text-gray-700 dark:text-gray-200">Recargar</div>
                    <div class="text-xs text-gray-500 dark:text-gray-400 mt-1">Actualizar datos</div>
                  </div>
                </div>
              </div>

              <!-- Agregar Nuevo -->
              <div
                @click="visiblecrear = true"
                class="group cursor-pointer bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md hover:shadow-xl transition-all duration-300 border border-gray-200 dark:border-gray-700 hover:border-green-400 dark:hover:border-green-500"
              >
                <div class="flex flex-col items-center justify-center space-y-3">
                  <div class="w-16 h-16 bg-gradient-to-br from-green-100 to-green-200 dark:from-green-900 dark:to-green-800 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <span class="text-3xl">➕</span>
                  </div>
                  <div class="text-center">
                    <div class="text-sm font-bold text-gray-700 dark:text-gray-200">Agregar Nueva</div>
                    <div class="text-xs text-gray-500 dark:text-gray-400 mt-1">Configurar impresora</div>
                  </div>
                </div>
              </div>

              <!-- Borrar Selección -->
              <div
                @click="borrarSeleccionados"
                class="group cursor-pointer bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md hover:shadow-xl transition-all duration-300 border border-gray-200 dark:border-gray-700 hover:border-orange-400 dark:hover:border-orange-500"
              >
                <div class="flex flex-col items-center justify-center space-y-3">
                  <div class="w-16 h-16 bg-gradient-to-br from-orange-100 to-orange-200 dark:from-orange-900 dark:to-orange-800 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <span class="text-3xl">🗑️</span>
                  </div>
                  <div class="text-center">
                    <div class="text-sm font-bold text-gray-700 dark:text-gray-200">Borrar Selección</div>
                    <div class="text-xs text-gray-500 dark:text-gray-400 mt-1">Eliminar seleccionados</div>
                  </div>
                </div>
              </div>

              <!-- Borrar Todo (Solo Soporte) -->
              <div
                v-if="usuarioLocal.usuario == 'Soporte'"
                @click="borrarTodo"
                class="group cursor-pointer bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md hover:shadow-xl transition-all duration-300 border border-gray-200 dark:border-gray-700 hover:border-red-400 dark:hover:border-red-500"
              >
                <div class="flex flex-col items-center justify-center space-y-3">
                  <div class="w-16 h-16 bg-gradient-to-br from-red-100 to-red-200 dark:from-red-900 dark:to-red-800 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <span class="text-3xl">⚠️</span>
                  </div>
                  <div class="text-center">
                    <div class="text-sm font-bold text-gray-700 dark:text-gray-200">Borrar Todo</div>
                    <div class="text-xs text-gray-500 dark:text-gray-400 mt-1">Eliminar todas</div>
                  </div>
                  <div class="absolute top-2 right-2">
                    <div class="w-2 h-2 rounded-full bg-red-500 shadow-lg shadow-red-500/50"></div>
                  </div>
                </div>
              </div>

            </div>
          </fieldset>
        </template>
      </Card>

      <!-- Tabla de Impresoras -->
      <Card class="shadow-lg">
        <template #content>
          <fieldset class="border-2 border-gray-200 dark:border-gray-700 p-6 rounded-xl bg-gradient-to-br from-purple-50 to-white dark:from-gray-900 dark:to-gray-800">
            <legend class="float-none w-auto px-4 text-lg font-bold text-gray-700 dark:text-gray-200">
              📋 Listado de Impresoras
            </legend>

            <!-- Buscador -->
            <div class="flex justify-end mb-4 mt-4">
              <div class="w-full md:w-1/3">
                <IconField iconPosition="left">
                  <InputIcon class="pi pi-search" />
                  <InputText
                    v-model="searchQuery"
                    placeholder="Buscar impresora..."
                    class="w-full"
                  />
                </IconField>
              </div>
            </div>

            <!-- DataTable -->
            <div class="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 overflow-hidden">
              <DataTable
                :value="filteredPrinterconfig"
                scrollable
                scrollHeight="600px"
                dataKey="id"
                paginator
                :rows="10"
                v-model:selection="selectedItems"
                selectionMode="single"
                :rowsPerPageOptions="[5, 10, 20, 50]"
                class="p-datatable-sm">
                <Column selectionMode="multiple" headerStyle="width: 3rem"></Column>
                <Column header="Opciones" headerStyle="width: 5rem">
                  <template #body="slotProps">
                    <Button
                      icon="pi pi-cog"
                      rounded
                      text
                      severity="secondary"
                      @click="togglePrinterconfig($event, slotProps.data)"
                      aria-haspopup="true"
                      aria-controls="overlay_menu_factura"
                    />
                    <Menu
                      ref="menu"
                      id="overlay_menu_Printerconfig"
                      :model="itemsPrinterconfig"
                      :popup="true"
                    />
                  </template>
                </Column>
                <Column field="nombre" header="Nombre de Impresora">
                  <template #body="slotProps">
                    <div class="flex items-center gap-2">
                      <span class="text-lg">🖨️</span>
                      <span class="font-semibold">{{ slotProps.data.nombre }}</span>
                    </div>
                  </template>
                </Column>
                <Column field="tipo" header="Tipo de Papel">
                  <template #body="slotProps">
                    <Tag :value="slotProps.data.tipo" :severity="slotProps.data.tipo === '80mm' ? 'info' : 'success'" />
                  </template>
                </Column>
                <Column field="configuraciones" header="Configuraciones"></Column>
                <Column field="usuario" header="Usuario"></Column>
              </DataTable>
            </div>
          </fieldset>
        </template>
      </Card>

      <Dialog v-model:visible="visible" :position="position" modal header="Modificar Printerconfig" class="w-11/12 md:w-3/4 lg:w-1/2">
        <template #header>
          <div class="flex items-center justify-center gap-2">
            <span class="font-bold">Modal Editar</span>
          </div>
        </template>
        <fieldset class="border p-4 rounded-lg">
          <legend class="px-2">Printerconfig</legend>
          <form id="formularioActualizarPrinterconfig" action="" method="">
            <div class="space-y-4">
              <div class="hidden">
                <label for="id-Actualizador">ID</label>
                <InputText v-model="datoscampos.id" name="id" id="id-Actualizador" placeholder="id" maxlength="11" />
              </div>
              <div>
                <label for="nombre-Actualizador">NOMBRE</label>
                <InputText v-model="datoscampos.nombre" name="nombre" id="nombre-Actualizador" placeholder="nombre" class="w-full" maxlength="250" />
              </div>
              <div>
                <label for="tipo">TIPO</label>
                <Dropdown v-model="datoscampos.tipo" :options="['80mm','Carta']" class="w-full" />
              </div>
              <div>
                <label for="configuraciones-Actualizador">CONFIGURACIONES</label>
                <Textarea v-model="datoscampos.configuraciones" id="configuraciones-Actualizador" name="configuraciones-Actualizador" rows="3" class="w-full" />
                <TablaJSON
                  :productos="datoscampos.configuraciones"
                  :onEditar="handleEditClick"
                  :onEliminar="handleDeleteClick"
                  :onClickProducto="handleClickConfigEdit"
                  :indice="false"
                  :botones="true"
                  tableId="tablaConfigEdit"
                />
              </div>
              <div class="hidden">
                <label for="created_at-Actualizador">CREATED_AT</label>
                <InputText v-model="datoscampos.created_at" name="created_at" id="created_at-Actualizador" placeholder="created_at" />
              </div>
              <div class="hidden">
                <label for="updated_at-Actualizador">UPDATED_AT</label>
                <InputText v-model="datoscampos.updated_at" name="updated_at" id="updated_at-Actualizador" placeholder="updated_at" />
              </div>
              <div class="hidden">
                <label for="usuario-Actualizador">USUARIO</label>
                <InputText v-model="datoscampos.usuario" name="usuario" id="usuario-Actualizador" placeholder="usuario" maxlength="250" />
              </div>
            </div>
          </form>
        </fieldset>
        <template #footer>
          <Button label="Cancel" severity="secondary" @click="visible = false" class="p-button-text" />
          <Button label="Save" severity="secondary" @click="funcionActualizar" class="p-button-outlined" />
        </template>
      </Dialog>

      <Dialog v-model:visible="visiblecrear" :position="position" modal header="Crear Printerconfig" class="w-11/12 md:w-3/4 lg:w-1/2">
        <template #header>
          <div class="flex items-center justify-center gap-2">
            <span class="font-bold">Modal Crear</span>
          </div>
        </template>
        <fieldset class="border p-4 rounded-lg">
          <legend class="px-2">Printerconfig</legend>
          <form id="formularioActualizarPrinterconfig" action="" method="">
            <div class="space-y-4">
              <div>
                <label for="nombreAgregarDatos">NOMBRE</label>
                <InputGroup>
                  <InputText v-model="datoscamposPrinterconfig.nombre" class="w-full" />
                  <Button icon="pi pi-search" severity="secondary" @click="buscarPrinter" />
                </InputGroup>
              </div>
              <div>
                <label for="tipo">TIPO</label>
                <Dropdown v-model="datoscamposPrinterconfig.tipo" :options="['80mm','Carta']" class="w-full" />
              </div>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label for="propiedad">PROPIEDAD</label>
                  <InputText v-model="propiedad" name="propiedad" id="propiedadAgregarDatos" placeholder="propiedad" class="w-full" maxlength="250" />
                </div>
                <div>
                  <label for="valor">VALOR</label>
                  <InputText v-model="valor" name="valor" id="valorAgregarDatos" placeholder="valor" class="w-full" maxlength="250" />
                </div>
              </div>
              <div>
                <Button label="Agregar" @click="fnAgregarPropiedad" severity="info" class="w-full" />
              </div>
              <div>
                <label for="configuracionesAgregarDatos">CONFIGURACIONES</label>
                <TablaJSON
                  :productos="datoscamposPrinterconfig.configuraciones"
                  :onEditar="editarConfig"
                  :onEliminar="eliminarConfig"
                  :onClickProducto="handleClickConfig"
                  :indice="true"
                  :botones="true"
                  tableId="tablaConfig"
                />
              </div>
              <div class="hidden">
                <label for="created_atAgregarDatos">CREATED_AT</label>
                <InputText v-model="datoscamposPrinterconfig.created_at" name="created_at" id="created_atAgregarDatos" placeholder="created_at" />
              </div>
              <div class="hidden">
                <label for="updated_atAgregarDatos">UPDATED_AT</label>
                <InputText v-model="datoscamposPrinterconfig.updated_at" name="updated_at" id="updated_atAgregarDatos" placeholder="updated_at" />
              </div>
              <div class="hidden">
                <label for="usuarioAgregarDatos">USUARIO</label>
                <InputText v-model="datoscamposPrinterconfig.usuario" name="usuario" id="usuarioAgregarDatos" placeholder="usuario" maxlength="250" />
              </div>
            </div>
          </form>
        </fieldset>
        <template #footer>
          <Button label="Cancel" severity="secondary" @click="visiblecrear = false" class="p-button-text" />
          <Button label="Crear" severity="secondary" @click="funcionCrear" class="p-button-outlined" />
        </template>
      </Dialog>
      <Toast />
    </div>
  </main>
</template>

<style scoped>
/* Añade estilos personalizados si es necesario */
</style>
