<script setup>
import { ref, onMounted, nextTick, watchEffect,computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
const router = useRouter();
import axios from 'axios';
import { enviarDatosPorPost, eliminarDatos, obtenerIdsSeleccionados, borrarTodoslosDatos, lenguajeDataTable, nfecha, arrayToObjetoFromTabla, peticionesFetch, encryptarPassword, envioElectron, mensajetoast, crearTablaSiNoExiste, peticiones, lasMayusculas,peticionesFetchOffline,
arrayToObjetoFromTablaOffline,crearTablaSiNoExisteOffline } from '@/funciones/funciones.js';
import Swal from 'sweetalert2'
import { useToast } from "primevue/usetoast";
const toast = useToast();
/************************************************************************/
/************************************************************************/
const usuarioLocal = ref({})
/************************************************************************/
const camposArray = ["nombre","email","password","pregunta_secreta","respuesta","fecha","nivel_seguridad","intentos_login","estado","permisos","porcentaje","meta","pin","restrinciones","usuario","huella"];
/************************************************************************/
import { useDatosEmpresa } from '@/stores'
const datosEmpresa = useDatosEmpresa();
const link = ref('');
const api = ref('');
const token = ref('');
const patronTelefono = ref('');
const linkImpresora = ref('');
const patroncedula = ref('');
const tokenCifrado = ref('');
const tokenCorto = ref('');
/************************************************************************/
const selectedItems = ref([]);
/************************************************************************/
const position = ref('top');
const openPosition = (pos) => {
    position.value = pos;
    visible.value = true;
}
/************************************************************************/
/************************************************************************/
const visible = ref(false);
const visiblecrear = ref(false);
const value = ref(null);
const id = ref(null);
const datoscampos = ref({});
const data = ref([]);
const searchQuery = ref('');
const UsuariosEditar = ref(null);
/************************************************************************/
async function limpiarCamposCrear() {
datoscamposUsuarios.value = {}
await campos();
}
/************************************************************************/
watchEffect(() => {
  if (visiblecrear.value) {
  }
});
/************************************************************************/
const fetchAndSetupData = async () => {
const response = await peticionesFetchOffline('getDataAsArray', 'usuarios');
    const jsonData = response.filter(user=>user.nombre != 'Soporte');
    data.value = jsonData;
};
/************************************************************************/
async function campos() {
  const campos = await arrayToObjetoFromTablaOffline('usuarios');
  datoscamposUsuarios.value = campos;
}
/************************************************************************/
onMounted(async () => {
const datosJSON = await envioElectron('datosarchivo');
link.value = datosJSON.VITE_LINKURL;
api.value = datosJSON.VITE_LINK_API;
token.value = datosJSON.VITE_TOKEN;
patronTelefono.value = datosJSON.VITE_PATRON_TELEFONO;
linkImpresora.value = datosJSON.VITE_IMPRESORA_LOCAL;
patroncedula.value = datosJSON.VITE_PATRON_CEDULA;
tokenCorto.value = datosJSON.VITE_TOKEN_CORTO;

tokenCifrado.value = await encryptarPassword(token.value, 10);
await crearTablaSiNoExisteOffline('usuarios', camposArray, toast);
usuarioLocal.value = datosEmpresa.usuario
await fetchAndSetupData();
});
/************************************************************************/
  async function borrarTodo() {
    Swal.fire({
        title: "¿Estás seguro?",
        text: "¡Se borrarán los datos!",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Sí, de acuerdo",
        cancelButtonText: "No, cancelar"
    }).then(async (result) => {
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
                    const envioDatos = await peticionesFetchOffline('deleteAll', 'usuarios');
                    if (envioDatos[0] == 'ok') {
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
    });
}
/************************************************************************/
async function funcionActualizar() {
  const url = link.value+api.value+"/actualizarcampos/usuarios";
  if (!datoscampos.value) {
    console.error("Datos incompletos, no se puede actualizar.");
    return;
  }
  if (datoscampos.value.hasOwnProperty('created_at')) {
    datoscampos.value.updated_at = nfecha('timestamp');
  }
  const envioDatos = await peticionesFetchOffline('updateData','usuarios', JSON.stringify(datoscampos.value));
  if (envioDatos[0] == 'ok') {
    visible.value = false;
    fetchAndSetupData();
    toast.add({ severity: 'success', summary: 'Éxito', detail: 'Datos Actualizados', life: 3000 });
  } else {
    toast.add({ severity: 'error', summary: 'Error', detail: 'Fallo al actualizar los datos.', life: 3000 });
  }
}
/************************************************************************/
async function funcionCrear() {
  const url = link.value+api.value+"/insertar/usuarios";
  if (datoscamposUsuarios.value.hasOwnProperty('created_at')) {
    datoscamposUsuarios.value.created_at = nfecha('timestamp');
    datoscamposUsuarios.value.updated_at = nfecha('timestamp');
  }
  const envioDatos = await peticionesFetchOffline('insertData','usuarios', JSON.stringify(datoscamposUsuarios.value));
  if (envioDatos[0] == 'ok') {
    fetchAndSetupData();
    toast.add({ severity: 'success', summary: 'Éxito', detail: 'Datos Agregados', life: 3000 });
    limpiarCamposCrear();
    visiblecrear.value = false;
  } else {
    toast.add({ severity: 'error', summary: 'Error', detail: 'Fallo al Agregar los datos.', life: 3000 });
  }
}
/************************************************************************/
async function borrarSeleccionados() {
  const ids = obtenerIdsSeleccionados(selectedItems.value);
    Swal.fire({
        title: "¿Estas Seguro?",
        text: "Se Borraran los Datos!",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Sí, de acuerdo!",
        cancelButtonText: "No, cancelar!",
    }).then(async (result) => {
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
                                const envioDatos = await peticionesFetchOffline('deleteEntry','usuarios', id);
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
    });
}
/************************************************************************/
const itemsUsuarios = ref([]);
const menu = ref(null);
const currentRowData = ref(null);
const toggleUsuarios = (event, rowData) => {
currentRowData.value = rowData;
itemsUsuarios.value = [
{ label: 'Editar', icon: 'pi pi-pencil', command: () => {
router.push({ path: `/editarusuarios/${currentRowData.value.id}` });
} },
{ label: 'Eliminar', icon: 'pi pi-trash', command: () => {
            Swal.fire({
                title: 'Introduce la contraseña',
                input: 'password',
                inputPlaceholder: 'Contraseña',
                showCancelButton: true,
                confirmButtonText: 'Eliminar',
                cancelButtonText: 'Cancelar'
            }).then(async (result) => {
                if (result.isConfirmed) {
                    const contrasenaIngresada = result.value;
                    if (contrasenaIngresada === token.value || contrasenaIngresada === tokenCorto.value) {
                        const datosFactura = await peticionesFetchOffline('deleteEntry','usuarios', rowData.id);
                        if (datosFactura[0] == 'ok') {
                            toast.add({ severity: 'success', summary: 'Éxito', detail: 'Datos eliminados correctamente', life: 3000 });
                            await fetchAndSetupData()
                        } else {
                            toast.add({ severity: 'error', summary: 'Error', detail: 'Error al eliminar los datos', life: 3000 });
                        }
                    } else {
                        toast.add({ severity: 'error', summary: 'Error', detail: 'Contraseña incorrecta', life: 3000 });
                    }
                }
            });
        }
    },
];
menu.value.toggle(event);
};
/************************************************************************/
const filteredUsuarios = computed(() => {
if (!searchQuery.value) return data.value;
return data.value.filter(busqueda => {
  return Object.values(busqueda).some(value =>
    String(value).toLowerCase().includes(searchQuery.value.toLowerCase())
   );
  });
});
/************************************************************************/
const fnAwesomplete = ()=>{
}
const handleSelectComplete = async(selected)=>{
}

/************************************************************************/
import imgReemplazo from '@/assets/img/avatar.png'
/************************************************************************/
const editUser = (user) => {
    toast.add({ severity: 'info', summary: 'Editar', detail: `Editando usuario: ${user.nombre}`, life: 3000 });
   router.push({ path: `/editarusuarios/${user.id}` });
};

const deleteUser = (user) => {
    toast.add({ severity: 'warn', summary: 'Eliminar', detail: `Eliminando usuario: ${user.nombre}`, life: 3000 });

            Swal.fire({
                title: 'Introduce la contraseña',
                input: 'password',
                inputPlaceholder: 'Contraseña',
                showCancelButton: true,
                confirmButtonText: 'Eliminar',
                cancelButtonText: 'Cancelar'
            }).then(async (result) => {
                if (result.isConfirmed) {
                    const contrasenaIngresada = result.value;
                    if (contrasenaIngresada === token.value || contrasenaIngresada === tokenCorto.value) {
                        const datosFactura = await peticionesFetchOffline('deleteEntry','usuarios', user.id);
                        if (datosFactura[0] == 'ok') {
                            toast.add({ severity: 'success', summary: 'Éxito', detail: 'Datos eliminados correctamente', life: 3000 });
                            await fetchAndSetupData()
                        } else {
                            toast.add({ severity: 'error', summary: 'Error', detail: 'Error al eliminar los datos', life: 3000 });
                        }
                    } else {
                        toast.add({ severity: 'error', summary: 'Error', detail: 'Contraseña incorrecta', life: 3000 });
                    }
                }
            });

};
/************************************************************************/
</script>
<template>
  <main class="content-wrapper p-4">
    <Card class="shadow-md">
      <template #content>
        <!-- 🔹 Encabezado -->
        <div class="grid grid-cols-12 gap-4">
          <div class="md:col-span-12">
            <fieldset class="border p-3 rounded mb-4">
              <legend class="float-none w-auto px-2 text-gray-700 dark:text-gray-200">
                Datos de Usuarios
              </legend>

              <!-- 🔹 Botones de acción -->
              <div class="flex flex-wrap gap-2 items-center">
                <Button
                  icon="pi pi-refresh"
                  label="Recargar"
                  severity="warning"
                  class="font-semibold text-white"
                  @click="fetchAndSetupData"
                />

                <Button
                  icon="pi pi-plus"
                  label="Nuevo Usuario"
                  severity="success"
                  class="font-semibold text-white"
                  @click="router.push('/crearusuarios')"
                />

                <Button
                  icon="pi pi-trash"
                  label="Borrar Selección"
                  severity="danger"
                  class="font-semibold"
                  @click="borrarSeleccionados"
                />

                <Button
                  v-if="usuarioLocal.usuario === 'Soporte'"
                  icon="pi pi-times"
                  label="Borrar Todo"
                  severity="danger"
                  class="ml-auto font-semibold"
                  @click="borrarTodo"
                />
              </div>
            </fieldset>
          </div>
        </div>

        <!-- 🔹 Buscador -->
        <div class="flex justify-center mb-6">
          <div class="w-full max-w-md">
            <span class="p-input-icon-left w-full block">
              <i class="pi pi-search text-gray-400"></i>
              <InputText
                v-model="searchQuery"
                placeholder="Buscar usuario..."
                class="w-full p-inputtext-sm"
              />
            </span>
          </div>
        </div>

        <!-- 🔹 Cards de usuarios -->
        <div
          class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6 w-full"
        >
          <div
            v-for="user in filteredUsuarios"
            :key="user.id"
            class="user-card bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 border-2 border-gray-200 dark:border-gray-700 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden group hover:-translate-y-1"
          >
            <!-- Header con gradiente -->
            <div class="relative h-24 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 dark:from-blue-600 dark:via-purple-600 dark:to-pink-600">
              <div class="absolute inset-0 bg-black opacity-10"></div>

              <!-- Imagen de perfil centrada sobre el header -->
              <div class="absolute -bottom-12 left-1/2 transform -translate-x-1/2">
                <div class="relative">
                  <img
                    :src="user.image || imgReemplazo"
                    :alt="user.nombre"
                    class="w-24 h-24 rounded-full object-cover border-4 border-white dark:border-gray-800 shadow-xl ring-4 ring-blue-400 dark:ring-blue-600"
                  />
                  <div
                    v-if="user.estado === 'activo' || user.estado === '1'"
                    class="absolute bottom-1 right-1 w-5 h-5 bg-green-500 border-3 border-white dark:border-gray-800 rounded-full"
                  ></div>
                  <div
                    v-else
                    class="absolute bottom-1 right-1 w-5 h-5 bg-gray-400 border-3 border-white dark:border-gray-800 rounded-full"
                  ></div>
                </div>
              </div>
            </div>

            <!-- Contenido de la card -->
            <div class="pt-16 pb-4 px-5 text-center">
              <!-- Nombre del usuario -->
              <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-1 truncate">
                {{ user.nombre }}
              </h3>

              <!-- Usuario/Email -->
              <p class="text-sm text-gray-600 dark:text-gray-400 mb-3 truncate">
                {{ user.email || user.usuario || 'Sin email' }}
              </p>

              <!-- Badge de nivel de seguridad -->
              <div class="flex justify-center mb-4">
                <span
                  class="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold"
                  :class="{
                    'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200': user.nivel_seguridad === 'Administrador' || user.nivel_seguridad === 'admin',
                    'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200': user.nivel_seguridad === 'Gerente',
                    'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200': user.nivel_seguridad === 'Empleado' || user.nivel_seguridad === 'empleado',
                    'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200': user.nivel_seguridad === 'Vendedor',
                    'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200': !user.nivel_seguridad || (user.nivel_seguridad !== 'Administrador' && user.nivel_seguridad !== 'admin' && user.nivel_seguridad !== 'Gerente' && user.nivel_seguridad !== 'Empleado' && user.nivel_seguridad !== 'empleado' && user.nivel_seguridad !== 'Vendedor')
                  }"
                >
                  <i class="pi pi-shield mr-1"></i>
                  {{ user.nivel_seguridad || 'Usuario' }}
                </span>
              </div>

              <!-- Información adicional -->
              <div class="grid grid-cols-2 gap-3 mb-4 text-sm">
                <div class="bg-gray-100 dark:bg-gray-700 rounded-lg p-2">
                  <p class="text-gray-500 dark:text-gray-400 text-xs mb-1">Meta</p>
                  <p class="font-semibold text-gray-800 dark:text-white">
                    {{ user.porcentaje || '0' }}%
                  </p>
                </div>
                <div class="bg-gray-100 dark:bg-gray-700 rounded-lg p-2">
                  <p class="text-gray-500 dark:text-gray-400 text-xs mb-1">Estado</p>
                  <p class="font-semibold" :class="user.estado === 'activo' || user.estado === '1' ? 'text-green-600 dark:text-green-400' : 'text-gray-600 dark:text-gray-400'">
                    {{ user.estado === 'activo' || user.estado === '1' ? 'Activo' : 'Inactivo' }}
                  </p>
                </div>
              </div>

              <!-- Divisor -->
              <div class="border-t border-gray-200 dark:border-gray-700 my-3"></div>

              <!-- Botones de acción -->
              <div class="flex gap-2 justify-center">
                <Button
                  icon="pi pi-pencil"
                  label="Editar"
                  severity="info"
                  size="small"
                  class="flex-1 font-semibold"
                  @click="editUser(user)"
                />
                <Button
                  icon="pi pi-trash"
                  label="Eliminar"
                  severity="danger"
                  size="small"
                  outlined
                  class="flex-1 font-semibold"
                  @click="deleteUser(user)"
                />
              </div>
            </div>
          </div>
        </div>
      </template>
    </Card>

    <Toast />
  </main>
</template>

<style scoped>
.user-card {
  position: relative;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.user-card::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  padding: 2px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.user-card:hover::before {
  opacity: 0.6;
}

.user-card:hover {
  transform: translateY(-4px) scale(1.02);
}

/* Animación suave para los botones */
.user-card .p-button {
  transition: all 0.2s ease;
}

.user-card .p-button:hover {
  transform: scale(1.05);
}

/* Mejora del indicador de estado */
.user-card .absolute.bottom-1.right-1 {
  animation: pulse-status 2s infinite;
}

@keyframes pulse-status {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.7;
  }
}

/* Efecto de brillo en el header */
.user-card .relative.h-24::after {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
  transition: left 0.5s ease;
}

.user-card:hover .relative.h-24::after {
  left: 100%;
}

/* Mejora de la sombra del avatar */
.user-card img {
  transition: all 0.3s ease;
}

.user-card:hover img {
  transform: scale(1.05);
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3);
}

/* Animación de entrada */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.user-card {
  animation: fadeInUp 0.5s ease;
}
</style>
