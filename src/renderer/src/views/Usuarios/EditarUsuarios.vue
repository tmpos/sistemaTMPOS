<script setup>
import { ref, onMounted, nextTick, watchEffect } from 'vue';
import { useToast } from "primevue/usetoast";
import { useRouter, useRoute } from 'vue-router';
const router = useRouter();
const route = useRoute(); 
import {enviarDatosPorPost,
  eliminarDatos, 
  obtenerIdsSeleccionados,
  borrarTodoslosDatos,
  lenguajeDataTable,
  nfecha,
  arrayToObjetoFromTabla,
  peticionesFetch,
  encryptarPassword,
  envioElectron,
  enviarSolicitudGet,
  generarCodigoUnico,
  peticionesFetchOffline,
  mensajetoast,
  lasMayusculas} from '@/funciones/funciones.js';
import Swal from 'sweetalert2'
const toast = useToast();
/************************************************************************/
const personaId = ref('123');   // o lo que uses
const minEnroll = ref(70);
const visible = ref(false);
const imagenHuella = ref(null);
/************************************************************************/
import {useDatosEmpresa} from '@/stores'
const datosEmpresa = useDatosEmpresa();

const link = ref('');
const api = ref('');
const token = ref('');
const patronTelefono = ref('');
const linkImpresora = ref('');
const patroncedula = ref('');
const tokenCifrado = ref(null);
/************************************************************************/
document.body.classList.add('sidebar-close');
/************************************************************************/
const datoscampos = ref({})
const codigoUnico = ref(generarCodigoUnico());
const fecha = ref(nfecha('fecha'));
const todosLosUsuarios = ref([]);
/************************************************************************/
/************************************************************************/
const fetchAllData = async () => {
    const response = await peticionesFetchOffline('getDataAsArray', 'usuarios');
    const jsonData = response;
    todosLosUsuarios.value = jsonData;
    datoscampos.value = jsonData.find(datos=>datos.id == route.params.id)
    datoscampos.value.porcentaje = datoscampos.value.porcentaje || '0.00'
};
/************************************************************************/
function navigate(action) {
    const currentIndex = todosLosUsuarios.value.findIndex(usuarios => usuarios.id == route.params.id);
    if (currentIndex === -1) return;
    let newIndex;
    switch (action) {
        case 'primero':
            newIndex = 0;
            break;
        case 'anterior':
            newIndex = currentIndex > 0 ? currentIndex - 1 : 0;
            break;
        case 'siguiente':
            newIndex = currentIndex + 1 < todosLosUsuarios.value.length ? currentIndex + 1 : currentIndex;
            break;
        case 'ultimo':
            newIndex = todosLosUsuarios.value.length - 1;
            break;
        default:
            return;
    }

    // Skip users with 'Soporte' level of security
    while (todosLosUsuarios.value[newIndex] && todosLosUsuarios.value[newIndex].nivel_seguridad === 'Soporte') {
        switch (action) {
            case 'primero':
            case 'siguiente':
                newIndex = newIndex + 1 < todosLosUsuarios.value.length ? newIndex + 1 : currentIndex;
                break;
            case 'anterior':
                newIndex = currentIndex > 0 ? newIndex - 1 : 0;
                break;
            case 'ultimo':
                newIndex = todosLosUsuarios.value.length - 1;
                break;
            default:
                return;
        }
    }

    datoscampos.value = todosLosUsuarios.value[newIndex];
    router.push({ path: `/editarusuarios/${todosLosUsuarios.value[newIndex].id}` });
}

/************************************************************************/
onMounted(async() => {


const datosJSON = await envioElectron('datosarchivo');
link.value = datosJSON.VITE_LINKURL;
api.value = datosJSON.VITE_LINK_API;
token.value = datosJSON.VITE_TOKEN;
patronTelefono.value = datosJSON.VITE_PATRON_TELEFONO;
linkImpresora.value = datosJSON.VITE_IMPRESORA_LOCAL;
patroncedula.value = datosJSON.VITE_PATRON_CEDULA;

tokenCifrado.value = await encryptarPassword(token.value, 10);
fetchAllData()
});
/************************************************************************/
const encriptado = async(password)=>{
   const passwordEcriptada = await encryptarPassword(password, 10);
   datoscampos.value.password = passwordEcriptada
}
/************************************************************************/
async function funcionActualizar(e) {
  e.preventDefault();
  const url = link.value+api.value+"/actualizarcampos/usuarios";
  if (!datoscampos.value) {
    console.error("Datos incompletos, no se puede actualizar.");
    return;
  }
  if (datoscampos.value.hasOwnProperty('created_at')) {
      datoscampos.value.updated_at = nfecha('timestamp')
    }
  const envioDatos = await peticionesFetchOffline('updateData','usuarios', JSON.stringify(datoscampos.value));
  if (envioDatos[0] == 'ok') {
     toast.add({ severity: 'success', summary: 'Éxito', detail: 'Datos Actualizados', life: 3000 });
  }else{
    toast.add({ severity: 'error', summary: 'Error', detail: 'Fallo al actualizar los datos.', life: 3000 });
  }
}
/************************************************************************/

/************************************************************************/
async function registrarHuella() {
  if (!window.electron) {
    toast.add({ severity: 'error', summary: 'Solo Desktop', detail: 'Función disponible solo en app de escritorio', life: 2500 });
    return;
  }

  try {
    Swal.fire({ title: 'Enrolando...', html: 'Coloca el mismo dedo 3 veces', allowOutsideClick: false, didOpen: () => Swal.showLoading() });

    const res = await window.electron.ipcRenderer.invoke('registrarHuella', {
      id: personaId.value,
      min: minEnroll.value,
      debug: false
    });

    Swal.close();



      try{
          let resObject = res.template;
          datoscampos.value.huella = resObject
          await funcionActualizar()

      }catch(error){
        console.log("error", error);

      }

    if (res?.result === 'OK') {
      imagenHuella.value = res.png || ''; // "data:image/png;base64,...."
      toast.add({ severity: 'success', summary: 'OK', detail: `Scores: ${JSON.stringify(res.scores)}`, life: 3000 });
      // Guarda res.template en tu BD aquí
    } else {
      toast.add({ severity: 'warn', summary: 'Falló', detail: JSON.stringify(res), life: 4000 });
      registrarHuella()
    }
  } catch (err) {
    Swal.close();
    toast.add({ severity: 'error', summary: 'Error', detail: err.message || String(err), life: 4000 });
    //registrarHuella()
  } finally {
    //visible.value = false;
  }
}
/************************************************************************/
const preguntasSecretas = [
  '¿Dónde se conocieron sus padres?',
  '¿Cuál es tu país favorito?',
  'Nombre de tu amigo de infancia'
]

const nivelesSeguridad = [
  'Administrador',
  'Vendedor',
  'Cajero',
  'Gerente',
  'Soporte',
  'Técnico'
]
/************************************************************************/
</script>
<template>
  <main class="content-wrapper p-4">
    <!-- Navegación superior -->
    <div class="mb-6">
      <Card class="shadow-lg border-0 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-900">
        <template #content>
          <div class="flex flex-wrap gap-2 items-center justify-between">
            <!-- Botones de navegación -->
            <div class="flex flex-wrap gap-2">
              <Button
                icon="pi pi-home"
                label="Inicio"
                severity="secondary"
                class="font-semibold"
                @click="router.push('/usuarios')"
              />
              <Button
                icon="pi pi-plus"
                label="Nuevo"
                severity="success"
                class="font-semibold"
                @click="router.push('/crearusuarios')"
              />
              <Button
                icon="pi pi-trash"
                label="Borrar"
                severity="danger"
                class="font-semibold"
                @click="borrarEntrada"
              />
            </div>

            <!-- Navegación entre registros -->
            <div class="flex gap-2 items-center">
              <span class="text-sm font-semibold text-gray-600 dark:text-gray-300 mr-2">Navegar:</span>
              <Button
                icon="pi pi-angle-double-left"
                severity="secondary"
                rounded
                v-tooltip.bottom="'Primero'"
                @click="navigate('primero')"
              />
              <Button
                icon="pi pi-angle-left"
                severity="secondary"
                rounded
                v-tooltip.bottom="'Anterior'"
                @click="navigate('anterior')"
              />
              <Button
                icon="pi pi-angle-right"
                severity="secondary"
                rounded
                v-tooltip.bottom="'Siguiente'"
                @click="navigate('siguiente')"
              />
              <Button
                icon="pi pi-angle-double-right"
                severity="secondary"
                rounded
                v-tooltip.bottom="'Último'"
                @click="navigate('ultimo')"
              />
            </div>
          </div>
        </template>
      </Card>
    </div>

    <!-- Header del usuario -->
    <div class="mb-6">
      <Card class="shadow-xl border-0 overflow-hidden user-header-card">
        <template #content>
          <div class="relative">
            <!-- Fondo con gradiente -->
            <div class="absolute inset-0 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 opacity-90"></div>

            <div class="relative p-6 flex items-center gap-6">
              <!-- Avatar -->
              <div class="flex-shrink-0">
                <div class="relative">
                  <div class="w-24 h-24 rounded-full bg-white dark:bg-gray-800 p-1 shadow-2xl">
                    <div class="w-full h-full rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-3xl font-bold">
                      {{ datoscampos.nombre?.charAt(0)?.toUpperCase() || 'U' }}
                    </div>
                  </div>
                  <div
                    v-if="datoscampos.estado === 'Activado' || datoscampos.estado === '1'"
                    class="absolute bottom-1 right-1 w-6 h-6 bg-green-500 border-4 border-white dark:border-gray-800 rounded-full pulse-status"
                  ></div>
                </div>
              </div>

              <!-- Información del usuario -->
              <div class="flex-grow text-white">
                <h1 class="text-3xl font-bold mb-2">{{ datoscampos.nombre || 'Usuario' }}</h1>
                <div class="flex flex-wrap gap-4 items-center">
                  <div class="flex items-center gap-2">
                    <i class="pi pi-envelope"></i>
                    <span>{{ datoscampos.email || 'Sin email' }}</span>
                  </div>
                  <div class="flex items-center gap-2">
                    <i class="pi pi-shield"></i>
                    <span class="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full font-semibold">
                      {{ datoscampos.nivel_seguridad || 'Usuario' }}
                    </span>
                  </div>
                </div>
              </div>

              <!-- Huella digital -->
              <div class="flex-shrink-0">
                <Button
                  icon="pi pi-fingerprint"
                  label="Registrar Huella"
                  severity="contrast"
                  size="large"
                  class="font-semibold shadow-lg"
                  @click="registrarHuella"
                />
              </div>
            </div>
          </div>
        </template>
      </Card>
    </div>

    <!-- Formulario principal -->
    <form id="formularioActualizar" @submit.prevent="funcionActualizar">
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Sección: Información Personal -->
        <Card class="shadow-lg border-0">
          <template #header>
            <div class="bg-gradient-to-r from-blue-500 to-indigo-500 text-white p-4 flex items-center gap-3">
              <i class="pi pi-user text-2xl"></i>
              <h2 class="text-xl font-bold">Información Personal</h2>
            </div>
          </template>
          <template #content>
            <div class="space-y-4">
              <!-- Nombre -->
              <div class="form-field">
                <label class="form-label">
                  <i class="pi pi-user mr-2"></i>
                  Nombre Completo
                </label>
                <InputText
                  v-model="datoscampos.nombre"
                  placeholder="Ingrese el nombre completo"
                  fluid
                  class="form-input"
                />
              </div>

              <!-- Email -->
              <div class="form-field">
                <label class="form-label">
                  <i class="pi pi-envelope mr-2"></i>
                  Correo Electrónico
                </label>
                <InputText
                  v-model="datoscampos.email"
                  placeholder="correo@ejemplo.com"
                  type="text"
                  fluid
                  class="form-input"
                />
              </div>

              <!-- Nivel de seguridad -->
              <div class="form-field">
                <label class="form-label">
                  <i class="pi pi-shield mr-2"></i>
                  Nivel de Seguridad
                </label>
                <Dropdown
                  v-model="datoscampos.nivel_seguridad"
                  :options="nivelesSeguridad"
                  placeholder="Seleccione un nivel"
                  fluid
                  class="form-input"
                />
              </div>

              <!-- Fecha -->
              <div class="form-field">
                <label class="form-label">
                  <i class="pi pi-calendar mr-2"></i>
                  Fecha de Registro
                </label>
                <Calendar
                  v-model="datoscampos.fecha"
                  dateFormat="dd/mm/yy"
                  showIcon
                  fluid
                  class="form-input"
                />
              </div>

              <!-- Estado -->
              <div class="form-field">
                <label class="form-label">
                  <i class="pi pi-power-off mr-2"></i>
                  Estado
                </label>
                <Dropdown
                  v-model="datoscampos.estado"
                  :options="['Desactivado', 'Activado', 'Bloqueado']"
                  placeholder="Seleccione estado"
                  fluid
                  class="form-input"
                />
              </div>
            </div>
          </template>
        </Card>

        <!-- Sección: Seguridad -->
        <Card class="shadow-lg border-0">
          <template #header>
            <div class="bg-gradient-to-r from-purple-500 to-pink-500 text-white p-4 flex items-center gap-3">
              <i class="pi pi-lock text-2xl"></i>
              <h2 class="text-xl font-bold">Seguridad</h2>
            </div>
          </template>
          <template #content>
            <div class="space-y-4">
              <!-- Password -->
              <div class="form-field">
                <label class="form-label">
                  <i class="pi pi-lock mr-2"></i>
                  Contraseña
                </label>
                <InputText
                  type="password"
                  v-model="datoscampos.password"
                  :feedback="false"
                  toggleMask
                  @change="encriptado(datoscampos.password)"
                  placeholder="Ingrese nueva contraseña"
                  fluid
                  class="form-input"
                />
              </div>

              <!-- PIN -->
              <div class="form-field">
                <label class="form-label">
                  <i class="pi pi-key mr-2"></i>
                  PIN de Acceso
                </label>
                <InputText
                  v-model="datoscampos.pin"
                  type="password"
                  placeholder="PIN de 4-6 dígitos"
                  fluid
                  class="form-input"
                />
              </div>

              <!-- Pregunta secreta -->
              <div class="form-field">
                <label class="form-label">
                  <i class="pi pi-question-circle mr-2"></i>
                  Pregunta Secreta
                </label>
                <Dropdown
                  v-model="datoscampos.pregunta_secreta"
                  :options="preguntasSecretas"
                  placeholder="Seleccione una pregunta"
                  fluid
                  class="form-input"
                />
              </div>

              <!-- Respuesta -->
              <div class="form-field">
                <label class="form-label">
                  <i class="pi pi-comment mr-2"></i>
                  Respuesta Secreta
                </label>
                <InputText
                  v-model="datoscampos.respuesta"
                  placeholder="Respuesta a la pregunta"
                  fluid
                  class="form-input"
                />
              </div>

              <!-- Intentos login -->
              <div class="form-field">
                <label class="form-label">
                  <i class="pi pi-sign-in mr-2"></i>
                  Intentos de Login
                </label>
                <InputNumber
                  v-model="datoscampos.intentos_login"
                  fluid
                  class="form-input"
                  :min="0"
                  :max="10"
                />
              </div>
            </div>
          </template>
        </Card>

        <!-- Sección: Metas y Objetivos -->
        <Card class="shadow-lg border-0">
          <template #header>
            <div class="bg-gradient-to-r from-green-500 to-teal-500 text-white p-4 flex items-center gap-3">
              <i class="pi pi-chart-line text-2xl"></i>
              <h2 class="text-xl font-bold">Metas y Objetivos</h2>
            </div>
          </template>
          <template #content>
            <div class="space-y-4">
              <!-- Meta -->
              <div class="form-field">
                <label class="form-label">
                  <i class="pi pi-dollar mr-2"></i>
                  Meta de Ventas
                </label>
                <InputNumber
                  v-model="datoscampos.meta"
                  mode="currency"
                  currency="DOP"
                  locale="es-DO"
                  fluid
                  class="form-input"
                />
              </div>

              <!-- Porcentaje -->
              <div class="form-field">
                <label class="form-label">
                  <i class="pi pi-percentage mr-2"></i>
                  Porcentaje Alcanzado
                </label>
                <InputNumber
                  v-model="datoscampos.porcentaje"
                  suffix="%"
                  fluid
                  class="form-input"
                  :min="0"
                  :max="100"
                />
              </div>

              <!-- Visual de progreso -->
              <div class="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div class="flex justify-between mb-2">
                  <span class="text-sm font-semibold text-gray-700 dark:text-gray-300">Progreso</span>
                  <span class="text-sm font-bold text-blue-600 dark:text-blue-400">{{ datoscampos.porcentaje || 0 }}%</span>
                </div>
                <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
                  <div
                    class="h-full bg-gradient-to-r from-green-400 to-blue-500 transition-all duration-500 rounded-full"
                    :style="{ width: `${datoscampos.porcentaje || 0}%` }"
                  ></div>
                </div>
              </div>
            </div>
          </template>
        </Card>

        <!-- Sección: Permisos -->
        <Card class="shadow-lg border-0">
          <template #header>
            <div class="bg-gradient-to-r from-orange-500 to-red-500 text-white p-4 flex items-center gap-3">
              <i class="pi pi-verified text-2xl"></i>
              <h2 class="text-xl font-bold">Permisos y Restricciones</h2>
            </div>
          </template>
          <template #content>
            <div class="space-y-4">
              <!-- Permisos -->
              <div class="form-field">
                <label class="form-label">
                  <i class="pi pi-list mr-2"></i>
                  Permisos del Sistema
                </label>
                <Textarea
                  v-model="datoscampos.permisos"
                  rows="6"
                  placeholder="Defina los permisos del usuario..."
                  fluid
                  class="form-input"
                />
                <small class="text-gray-500 dark:text-gray-400 mt-1 block">
                  Separe cada permiso con comas o líneas nuevas
                </small>
              </div>
            </div>
          </template>
        </Card>
      </div>

      <!-- Botón de actualizar -->
      <div class="mt-6">
        <Card class="shadow-lg border-0">
          <template #content>
            <Button
              type="submit"
              label="Guardar Cambios"
              icon="pi pi-save"
              severity="primary"
              size="large"
              class="w-full font-bold text-lg py-4"
            />
          </template>
        </Card>
      </div>
    </form>

    <Toast />
  </main>
</template>

<style scoped>
/* Animación del header del usuario */
.user-header-card {
  animation: slideDown 0.5s ease-out;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Pulso del indicador de estado */
.pulse-status {
  animation: pulse-animation 2s infinite;
}

@keyframes pulse-animation {
  0%, 100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.7;
    transform: scale(1.1);
  }
}

/* Estilos de campos de formulario */
.form-field {
  position: relative;
  transition: all 0.3s ease;
}

.form-label {
  display: flex;
  align-items: center;
  font-weight: 600;
  color: #374151;
  margin-bottom: 0.5rem;
  font-size: 0.95rem;
}

:deep(.dark) .form-label {
  color: #d1d5db;
}

.form-input {
  transition: all 0.3s ease;
}

/* Hover en las cards */
.shadow-lg {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.shadow-lg:hover {
  transform: translateY(-2px);
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
}

/* Gradientes en los headers de las cards */
.bg-gradient-to-r {
  position: relative;
  overflow: hidden;
}

.bg-gradient-to-r::after {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  transition: left 0.5s ease;
}

.bg-gradient-to-r:hover::after {
  left: 100%;
}

/* Mejora de inputs y dropdowns */
:deep(.p-inputtext),
:deep(.p-dropdown),
:deep(.p-calendar),
:deep(.p-inputnumber) {
  transition: all 0.3s ease;
}

:deep(.p-inputtext:focus),
:deep(.p-dropdown:focus),
:deep(.p-calendar:focus),
:deep(.p-inputnumber:focus) {
  transform: translateY(-1px);
  box-shadow: 0 4px 6px -1px rgba(59, 130, 246, 0.2), 0 2px 4px -1px rgba(59, 130, 246, 0.1);
}

/* Barra de progreso animada */
.h-3 > div {
  animation: progressAnimation 1s ease-out;
}

@keyframes progressAnimation {
  from {
    width: 0%;
  }
}

/* Botones con efecto */
:deep(.p-button) {
  transition: all 0.3s ease;
}

:deep(.p-button:hover) {
  transform: translateY(-2px);
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
}

:deep(.p-button:active) {
  transform: translateY(0);
}

/* Avatar con sombra dinámica */
.w-24.h-24.rounded-full {
  transition: all 0.4s ease;
}

.user-header-card:hover .w-24.h-24.rounded-full {
  transform: scale(1.05);
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.3);
}

/* Animación de entrada para las cards */
.grid > .shadow-lg {
  animation: fadeInUp 0.6s ease-out backwards;
}

.grid > .shadow-lg:nth-child(1) {
  animation-delay: 0.1s;
}

.grid > .shadow-lg:nth-child(2) {
  animation-delay: 0.2s;
}

.grid > .shadow-lg:nth-child(3) {
  animation-delay: 0.3s;
}

.grid > .shadow-lg:nth-child(4) {
  animation-delay: 0.4s;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Textarea mejorado */
:deep(.p-textarea) {
  min-height: 120px;
  resize: vertical;
  transition: all 0.3s ease;
}

:deep(.p-textarea:focus) {
  transform: translateY(-1px);
  box-shadow: 0 4px 6px -1px rgba(59, 130, 246, 0.2), 0 2px 4px -1px rgba(59, 130, 246, 0.1);
}

/* Responsive adjustments */
@media (max-width: 1024px) {
  .user-header-card .flex {
    flex-direction: column;
    text-align: center;
  }

  .user-header-card .flex-shrink-0:last-child {
    width: 100%;
  }

  .user-header-card .flex-shrink-0:last-child button {
    width: 100%;
  }
}

/* Efecto de enfoque visual en secciones */
.form-field:focus-within .form-label {
  color: #3b82f6;
  transform: translateX(4px);
}

:deep(.dark) .form-field:focus-within .form-label {
  color: #60a5fa;
}

/* Botón de guardar mejorado */
.py-4 {
  position: relative;
  overflow: hidden;
}

.py-4::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  transform: translate(-50%, -50%);
  transition: width 0.6s, height 0.6s;
}

.py-4:hover::before {
  width: 300px;
  height: 300px;
}
</style>
