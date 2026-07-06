<script setup>
import { ref, computed, onMounted, nextTick, watch } from 'vue';
import { useToast } from "primevue/usetoast";
import {
  envioElectron,
  encryptarPassword,
  nfecha,
  formatearFecha,
  peticionesFetchOffline,
  crearTablaSiNoExisteOffline
} from '@/funciones/funciones.js';
import { useDatosEmpresa } from '@/stores';
import Swal from 'sweetalert2';

const toast = useToast();
const datosEmpresa = useDatosEmpresa();

const link = ref('');
const api = ref('');
const token = ref('');
const tokenCifrado = ref(null);
const loading = ref(false);
const usuarioLocal = ref({});

// Definición de campos para las tablas
const camposMensajes = ["conversacion_id", "remitente_id", "remitente_nombre", "destinatario_id", "destinatario_nombre", "mensaje", "tipo_mensaje", "archivo_url", "archivo_nombre", "leido", "fecha", "hora"];
const camposConversaciones = ["usuario1_id", "usuario1_nombre", "usuario2_id", "usuario2_nombre", "ultimo_mensaje", "fecha_ultimo_mensaje", "no_leidos_usuario1", "no_leidos_usuario2"];

// Datos
const usuarios = ref([]);
const conversaciones = ref([]);
const mensajes = ref([]);
const conversacionActiva = ref(null);
const usuarioSeleccionado = ref(null);

// UI
const busquedaUsuario = ref('');
const nuevoMensaje = ref('');
const messageContainer = ref(null);
const fileInput = ref(null);
const mostrarPanelUsuarios = ref(true);
const escribiendo = ref(false);

// Emojis
const mostrarEmojis = ref(false);
const emojis = [
  '😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍',
  '🥰', '😘', '😗', '😙', '😚', '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🤩',
  '🥳', '😏', '😒', '😞', '😔', '😟', '😕', '🙁', '😣', '😖', '😫', '😩', '🥺', '😢', '😭',
  '😤', '😠', '😡', '🤬', '🤯', '😳', '🥵', '🥶', '😱', '😨', '😰', '😥', '😓', '🤗', '🤔',
  '🤭', '🤫', '🤥', '😶', '😐', '😑', '😬', '🙄', '😯', '😦', '😧', '😮', '😲', '🥱', '😴',
  '👍', '👎', '👌', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆', '👇', '☝️', '✋', '🤚',
  '🖐', '🖖', '👋', '🤝', '💪', '🙏', '✍️', '💅', '🦾', '🦿', '🦵', '🦶', '👂', '🦻', '👃',
  '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕', '💞', '💓', '💗',
  '💖', '💘', '💝', '💟', '☮️', '✝️', '☪️', '🕉', '☸️', '✡️', '🔯', '🕎', '☯️', '☦️', '🛐'
];

// Polling para actualizar mensajes
let pollingInterval = null;

/************************************************************************/
document.body.classList.add('sidebar-close');

/************************************************************************/
onMounted(async() => {
  try {
    const datosJSON = await envioElectron('datosarchivo');
    link.value = datosJSON.VITE_LINKURL;
    api.value = datosJSON.VITE_LINK_API;
    token.value = datosJSON.VITE_TOKEN;

    tokenCifrado.value = await encryptarPassword(token.value, 10);

    if (!datosEmpresa.empresa.nombre) {
      await datosEmpresa.inicializarDatosEmpresa(link.value + api.value);
    }

    // Crear tablas si no existen
    await crearTablaSiNoExisteOffline('chat_mensajes', camposMensajes.join(','), toast);
    await crearTablaSiNoExisteOffline('chat_conversaciones', camposConversaciones.join(','), toast);

    // Obtener usuario local
    usuarioLocal.value = JSON.parse(window.localStorage.getItem('usuarioLocal'))?.[0] || {};

    if (!usuarioLocal.value.id) {
      toast.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Usuario no identificado. Por favor inicia sesión',
        life: 3000
      });
      return;
    }

    await cargarUsuarios();
    await cargarConversaciones();

    // Iniciar polling para nuevos mensajes cada 3 segundos
    pollingInterval = setInterval(async () => {
      if (conversacionActiva.value) {
        await cargarMensajes(conversacionActiva.value, false);
        await cargarConversaciones();
      }
    }, 10000);

  } catch (error) {
    console.error('Error al inicializar:', error);
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Error al cargar el chat',
      life: 3000
    });
  }
});

// Limpiar polling al desmontar
watch(() => conversacionActiva.value, () => {
  if (pollingInterval) {
    clearInterval(pollingInterval);
  }
  if (conversacionActiva.value) {
    pollingInterval = setInterval(async () => {
      await cargarMensajes(conversacionActiva.value, false);
      await cargarConversaciones();
    }, 10000);
  }
});

/************************************************************************/
const cargarUsuarios = async () => {
  try {
    const response = await peticionesFetchOffline('getDataAsArray', 'usuarios');
    // Filtrar usuario actual
    usuarios.value = (response || []).filter(u => u.id !== usuarioLocal.value.id);
  } catch (error) {
    console.error('Error al cargar usuarios:', error);
  }
};

/************************************************************************/
const cargarConversaciones = async () => {
  try {
    // Usar petición específica de chat que sincroniza con servidor
    const response = await peticionesFetchOffline('getChatConversaciones', usuarioLocal.value.id);
    conversaciones.value = (response || []).sort((a, b) => {
      const fechaA = new Date(a.fecha_ultimo_mensaje);
      const fechaB = new Date(b.fecha_ultimo_mensaje);
      return fechaB - fechaA;
    });
  } catch (error) {
    console.error('Error al cargar conversaciones:', error);
  }
};

/************************************************************************/
const cargarMensajes = async (conversacionId, scroll = true) => {
  loading.value = true;
  try {
    // Usar petición específica de chat que sincroniza con servidor
    const response = await peticionesFetchOffline('getChatMensajes', conversacionId);
    mensajes.value = (response || []).sort((a, b) => {
      const fechaA = new Date(a.fecha + ' ' + a.hora);
      const fechaB = new Date(b.fecha + ' ' + b.hora);
      return fechaA - fechaB;
    });

    // Marcar mensajes como leídos
    await marcarMensajesLeidos(conversacionId);

    if (scroll) {
      await nextTick();
      scrollToBottom();
    }
  } catch (error) {
    console.error('Error al cargar mensajes:', error);
  } finally {
    loading.value = false;
  }
};

/************************************************************************/
const marcarMensajesLeidos = async (conversacionId) => {
  try {
    // Marcar mensajes no leídos como leídos
    const mensajesNoLeidos = mensajes.value.filter(m =>
      !m.leido &&
      m.destinatario_id === usuarioLocal.value.id &&
      m.conversacion_id === conversacionId
    );

    if (mensajesNoLeidos.length === 0) return;

    // Usar petición específica que sincroniza con servidor
    await peticionesFetchOffline('marcarChatMensajesLeidos',  {
      mensaje_ids: mensajesNoLeidos.map(m => m.id),
      conversacion_id: conversacionId,
      usuario_id: usuarioLocal.value.id
    });

    // Actualizar contador en conversación
    const conversacion = conversaciones.value.find(c => c.id === conversacionId);
    if (conversacion) {
      const campo = conversacion.usuario1_id === usuarioLocal.value.id ? 'no_leidos_usuario1' : 'no_leidos_usuario2';
      await peticionesFetchOffline('actualizarChatConversacion',  {
        id: conversacionId,
        [campo]: 0
      });
    }

    await cargarConversaciones();
  } catch (error) {
    console.error('Error al marcar mensajes leídos:', error);
  }
};

/************************************************************************/
const iniciarConversacion = async (usuario) => {
  try {
    console.log('🔷 Iniciando conversación con:', usuario);

    // Establecer usuario seleccionado PRIMERO
    usuarioSeleccionado.value = usuario;

    // Buscar conversación existente
    let conversacion = conversaciones.value.find(c =>
      (c.usuario1_id === usuarioLocal.value.id && c.usuario2_id === usuario.id) ||
      (c.usuario2_id === usuarioLocal.value.id && c.usuario1_id === usuario.id)
    );

    console.log('🔷 Conversación existente:', conversacion);

    // Si no existe, crear nueva conversación
    if (!conversacion) {
      const nuevaConversacion = {
        usuario1_id: usuarioLocal.value.id,
        usuario1_nombre: usuarioLocal.value.nombre,
        usuario2_id: usuario.id,
        usuario2_nombre: usuario.nombre,
        ultimo_mensaje: '',
        fecha_ultimo_mensaje: nfecha('fecha') + ' ' + nfecha('hora'),
        no_leidos_usuario1: 0,
        no_leidos_usuario2: 0
      };

      console.log('🔷 Creando nueva conversación:', nuevaConversacion);

      // Crear conversación (sincroniza con servidor automáticamente)
      const resultado = await peticionesFetchOffline('crearChatConversacion',  nuevaConversacion);
      console.log('🔷 Resultado de crear conversación:', resultado);

      await cargarConversaciones();

      conversacion = conversaciones.value.find(c =>
        (Number(c.usuario1_id) === Number(usuarioLocal.value.id) && Number(c.usuario2_id) === Number(usuario.id)) ||
        (Number(c.usuario2_id) === Number(usuarioLocal.value.id) && Number(c.usuario1_id) === Number(usuario.id))
      );

      console.log('🔷 Conversación después de crear:', conversacion);
    }


    if (conversacion) {
      conversacionActiva.value = conversacion.id;
      console.log('🔷 Conversación activa establecida:', conversacionActiva.value);
      console.log('🔷 Usuario seleccionado:', usuarioSeleccionado.value);
      await cargarMensajes(conversacion.id);
    } else {
      console.error('❌ No se pudo crear o encontrar la conversación');
      toast.add({
        severity: 'error',
        summary: 'Error',
        detail: 'No se pudo iniciar la conversación',
        life: 3000
      });
    }

    mostrarPanelUsuarios.value = false;
  } catch (error) {
    console.error('❌ Error en iniciarConversacion:', error);
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Error al iniciar conversación: ' + error.message,
      life: 3000
    });
  }
};

/************************************************************************/
const enviarMensaje = async () => {
  if (!nuevoMensaje.value.trim() && !archivoSeleccionado.value) {
    return;
  }

  console.log('📤 Intentando enviar mensaje...');
  console.log('📤 conversacionActiva:', conversacionActiva.value);
  console.log('📤 usuarioSeleccionado:', usuarioSeleccionado.value);

  if (!conversacionActiva.value || !usuarioSeleccionado.value) {
    console.error('❌ Falta conversacionActiva o usuarioSeleccionado');
    toast.add({
      severity: 'warn',
      summary: 'Advertencia',
      detail: 'Selecciona un usuario para enviar mensajes',
      life: 3000
    });
    return;
  }

  try {
    const mensaje = {
      conversacion_id: conversacionActiva.value,
      remitente_id: usuarioLocal.value.id,
      remitente_nombre: usuarioLocal.value.nombre,
      destinatario_id: usuarioSeleccionado.value.id,
      destinatario_nombre: usuarioSeleccionado.value.nombre,
      mensaje: nuevoMensaje.value.trim(),
      tipo_mensaje: archivoSeleccionado.value ? 'archivo' : 'texto',
      archivo_url: archivoSeleccionado.value || '',
      archivo_nombre: nombreArchivoSeleccionado.value || '',
      leido: false,
      fecha: nfecha('fecha'),
      hora: nfecha('hora')
    };

    // Enviar mensaje (CRÍTICO - sincroniza con servidor automáticamente)
    await peticionesFetchOffline('enviarChatMensaje',  mensaje);

    // Actualizar conversación
    const conversacion = conversaciones.value.find(c => c.id === conversacionActiva.value);
    if (conversacion) {
      const campoNoLeidos = conversacion.usuario1_id === usuarioLocal.value.id ? 'no_leidos_usuario2' : 'no_leidos_usuario1';
      await peticionesFetchOffline('actualizarChatConversacion',  {
        id: conversacionActiva.value,
        ultimo_mensaje: nuevoMensaje.value.trim() || 'Archivo adjunto',
        fecha_ultimo_mensaje: nfecha('fecha') + ' ' + nfecha('hora'),
        [campoNoLeidos]: (conversacion[campoNoLeidos] || 0) + 1
      });
    }

    nuevoMensaje.value = '';
    archivoSeleccionado.value = null;
    nombreArchivoSeleccionado.value = '';

    await cargarMensajes(conversacionActiva.value);
    await cargarConversaciones();
  } catch (error) {
    console.error('Error al enviar mensaje:', error);
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Error al enviar el mensaje',
      life: 3000
    });
  }
};

/************************************************************************/
const scrollToBottom = () => {
  if (messageContainer.value) {
    messageContainer.value.scrollTop = messageContainer.value.scrollHeight;
  }
};

/************************************************************************/
const agregarEmoji = (emoji) => {
  nuevoMensaje.value += emoji;
  mostrarEmojis.value = false;
};

/************************************************************************/
// Manejo de archivos
const archivoSeleccionado = ref(null);
const nombreArchivoSeleccionado = ref('');

const seleccionarArchivo = () => {
  fileInput.value.click();
};

const manejarArchivo = async (event) => {
  const file = event.target.files[0];
  if (!file) return;

  // Validar tamaño (máx 10MB)
  if (file.size > 10 * 1024 * 1024) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'El archivo no puede superar los 10MB',
      life: 3000
    });
    return;
  }

  try {
    // Convertir a base64
    const reader = new FileReader();
    reader.onload = (e) => {
      archivoSeleccionado.value = e.target.result;
      nombreArchivoSeleccionado.value = file.name;
      toast.add({
        severity: 'success',
        summary: 'Archivo seleccionado',
        detail: file.name,
        life: 2000
      });
    };
    reader.readAsDataURL(file);
  } catch (error) {
    console.error('Error al procesar archivo:', error);
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Error al procesar el archivo',
      life: 3000
    });
  }
};

const cancelarArchivo = () => {
  archivoSeleccionado.value = null;
  nombreArchivoSeleccionado.value = '';
  fileInput.value.value = '';
};

/************************************************************************/
// Computed
const usuariosFiltrados = computed(() => {
  if (!busquedaUsuario.value.trim()) {
    return usuarios.value;
  }
  const query = busquedaUsuario.value.toLowerCase();
  return usuarios.value.filter(u =>
    u.nombre?.toLowerCase().includes(query) ||
    u.email?.toLowerCase().includes(query)
  );
});

const conversacionesFiltradas = computed(() => {
  return conversaciones.value;
});

const totalMensajesNoLeidos = computed(() => {
  return conversaciones.value.reduce((sum, c) => {
    const campo = c.usuario1_id === usuarioLocal.value.id ? 'no_leidos_usuario1' : 'no_leidos_usuario2';
    return sum + (c[campo] || 0);
  }, 0);
});

const obtenerContadorNoLeidos = (conversacion) => {
  const campo = conversacion.usuario1_id === usuarioLocal.value.id ? 'no_leidos_usuario1' : 'no_leidos_usuario2';
  return conversacion[campo] || 0;
};

const obtenerNombreOtroUsuario = (conversacion) => {
  return conversacion.usuario1_id === usuarioLocal.value.id
    ? conversacion.usuario2_nombre
    : conversacion.usuario1_nombre;
};

const obtenerUsuario = (conversacion) => {
  // Determina el ID del otro usuario en la conversación
  const iduser = conversacion.usuario1_id === usuarioLocal.value.id
    ? conversacion.usuario2_id
    : conversacion.usuario1_id;

  // Busca y retorna los datos completos de ese usuario
  const datos = usuarios.value.find(u => Number(u.id) === Number(iduser));
  console.log("datos", datos);
  return datos || { id: iduser, nombre: 'Usuario desconocido' };
};


const formatearHora = (hora) => {
  if (!hora) return '';
  return hora.substring(0, 5);
};

const esMiMensaje = (mensaje) => {
  return Number(mensaje.remitente_id) === usuarioLocal.value.id;
};
</script>

<template>
  <main class="content-wrapper bg-gray-50 min-h-screen">
    <div class="flex h-[calc(100vh-60px)]">
      <!-- Panel Izquierdo: Lista de Conversaciones y Usuarios -->
      <div
        :class="['bg-white border-r border-gray-200 flex flex-col transition-all duration-300', mostrarPanelUsuarios ? 'w-80' : 'w-80 md:flex hidden']"
      >
        <!-- Header del Panel -->
        <div class="p-4 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-blue-500">
          <div class="flex items-center justify-between mb-3">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-full bg-white flex items-center justify-center">
                <i class="pi pi-user text-blue-600 text-lg"></i>
              </div>
              <div>
                <h2 class="text-white font-semibold">{{ usuarioLocal.nombre }}</h2>
                <p class="text-blue-100 text-xs">En línea</p>
              </div>
            </div>
            <Badge v-if="totalMensajesNoLeidos > 0" :value="totalMensajesNoLeidos" severity="danger" />
          </div>

          <!-- Búsqueda -->
          <div class="relative">
            <i class="pi pi-search absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
            <InputText
              v-model="busquedaUsuario"
              placeholder="Buscar usuarios..."
              class="w-full pl-10"
            />
          </div>
        </div>

        <!-- Tabs: Conversaciones / Usuarios -->
        <TabView class="flex-1 overflow-hidden chat-tabs">
          <!-- Tab Conversaciones -->
          <TabPanel header="Conversaciones">
            <div class="overflow-y-auto h-[calc(100vh-280px)]">
              <div
                v-if="conversacionesFiltradas.length === 0"
                class="text-center py-12 text-gray-500"
              >
                <i class="pi pi-comments text-4xl mb-3 text-gray-300"></i>
                <p>No hay conversaciones</p>
                <p class="text-sm">Inicia una nueva conversación</p>
              </div>

              <div
                v-for="conversacion in conversacionesFiltradas"
                :key="conversacion.id"
                @click="iniciarConversacion(obtenerUsuario(conversacion))"
                :class="[
                  'p-4 border-b border-gray-100 cursor-pointer transition-all hover:bg-blue-50',
                  conversacionActiva === conversacion.id ? 'bg-blue-100' : ''
                ]"
              >
                <div class="flex items-start gap-3">
                  <div class="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center flex-shrink-0">
                    <span class="text-white font-semibold text-lg">
                      {{ obtenerNombreOtroUsuario(conversacion).charAt(0).toUpperCase() }}
                    </span>
                  </div>
                  <div class="flex-1 min-w-0">
                    <div class="flex items-center justify-between mb-1">
                      <h3 class="font-semibold text-gray-800 truncate">
                        {{ obtenerNombreOtroUsuario(conversacion) }}
                      </h3>
                      <span class="text-xs text-gray-500">
                        {{ formatearHora(conversacion.fecha_ultimo_mensaje?.split(' ')[1]) }}
                      </span>
                    </div>
                    <div class="flex items-center justify-between">
                      <p class="text-sm text-gray-600 truncate">
                        {{ conversacion.ultimo_mensaje || 'Sin mensajes' }}
                      </p>
                      <Badge
                        v-if="obtenerContadorNoLeidos(conversacion) > 0"
                        :value="obtenerContadorNoLeidos(conversacion)"
                        severity="danger"
                        class="ml-2"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </TabPanel>

          <!-- Tab Usuarios -->
          <TabPanel header="Usuarios">
            <div class="overflow-y-auto h-[calc(100vh-280px)]">
              <div
                v-if="usuariosFiltrados.length === 0"
                class="text-center py-12 text-gray-500"
              >
                <i class="pi pi-users text-4xl mb-3 text-gray-300"></i>
                <p>No se encontraron usuarios</p>
              </div>

              <div
                v-for="usuario in usuariosFiltrados"
                :key="usuario.id"
                @click="iniciarConversacion(usuario)"
                class="p-4 border-b border-gray-100 cursor-pointer transition-all hover:bg-blue-50"
              >
                <div class="flex items-center gap-3">
                  <div class="w-12 h-12 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center">
                    <span class="text-white font-semibold text-lg">
                      {{ usuario.nombre?.charAt(0).toUpperCase() }}
                    </span>
                  </div>
                  <div class="flex-1">
                    <h3 class="font-semibold text-gray-800">{{ usuario.nombre }}</h3>
                    <p class="text-sm text-gray-600">{{ usuario.email }}</p>
                  </div>
                  <i class="pi pi-chevron-right text-gray-400"></i>
                </div>
              </div>
            </div>
          </TabPanel>
        </TabView>
      </div>

      <!-- Panel Derecho: Chat -->
      <div class="flex-1 flex flex-col bg-gray-100">
        <!-- Header del Chat -->
        <div v-if="usuarioSeleccionado" class="bg-white border-b border-gray-200 p-4">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <Button
                icon="pi pi-arrow-left"
                text
                rounded
                class="md:hidden"
                @click="mostrarPanelUsuarios = true"
              />
              <div class="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
                <span class="text-white font-semibold">
                  {{ usuarioSeleccionado.nombre?.charAt(0).toUpperCase() }}
                </span>
              </div>
              <div>
                <h3 class="font-semibold text-gray-800">{{ usuarioSeleccionado.nombre }}</h3>
                <p class="text-xs text-green-600">En línea</p>
              </div>
            </div>
            <div class="flex gap-2">
              <Button icon="pi pi-ellipsis-v" text rounded />
            </div>
          </div>
        </div>

        <!-- Área de Mensajes -->
        <div
          v-if="!usuarioSeleccionado"
          class="flex-1 flex items-center justify-center text-gray-400"
        >
          <div class="text-center">
            <i class="pi pi-comments text-6xl mb-4"></i>
            <h3 class="text-xl font-semibold mb-2">Bienvenido al Chat</h3>
            <p>Selecciona una conversación o inicia una nueva</p>
          </div>
        </div>

        <div
          v-else
          ref="messageContainer"
          class="flex-1 overflow-y-auto p-4 space-y-4"
          style="background-image: url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDQwIDAgTCAwIDAgMCA0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjZTVlN2ViIiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=');"
        >
          <div v-if="loading" class="text-center py-8">
            <ProgressSpinner style="width:50px;height:50px" strokeWidth="4" />
          </div>


          <div class="chat-container">
<div
  v-for="mensaje in mensajes"
  :key="mensaje.id"
  class="w-full flex mb-2"
  :class="esMiMensaje(mensaje) ? 'justify-end pr-4' : 'justify-start pl-4'"
>

  <div
    :class="[
      'relative max-w-[70%] px-4 py-2 rounded-2xl shadow-md break-words',
      esMiMensaje(mensaje)
        ? 'bg-blue-500 text-white rounded-br-none'
        : 'bg-white text-gray-800 rounded-bl-none'
    ]"
  >
    <p v-if="mensaje.tipo_mensaje === 'texto'" class="whitespace-pre-line">{{ mensaje.mensaje }}</p>

    <div v-else-if="mensaje.tipo_mensaje === 'archivo'">
      <div class="flex items-center gap-2 mb-2">
        <i class="pi pi-file text-xl"></i>
        <span class="text-sm truncate">{{ mensaje.archivo_nombre }}</span>
      </div>
      <Button
        label="Descargar"
        icon="pi pi-download"
        text
        size="small"
        @click="() => {
          const link = document.createElement('a');
          link.href = mensaje.archivo_url;
          link.download = mensaje.archivo_nombre;
          link.click();
        }"
      />
    </div>

    <div
      :class="[
        'text-xs mt-1 flex items-center gap-1',
        esMiMensaje(mensaje) ? 'justify-end text-blue-100' : 'justify-start text-gray-500'
      ]"
    >
      <span>{{ formatearHora(mensaje.hora) }}</span>
      <i
        v-if="esMiMensaje(mensaje)"
        :class="[
          'pi',
          mensaje.leido ? 'pi-check-circle text-green-300' : 'pi-check text-blue-200'
        ]"
      ></i>
    </div>
  </div>
</div>
</div>



        </div>

        <!-- Input de Mensaje -->
        <div v-if="usuarioSeleccionado" class="bg-white border-t border-gray-200 p-4">
          <!-- Vista previa de archivo -->
          <div v-if="archivoSeleccionado" class="mb-3 p-3 bg-blue-50 rounded-lg flex items-center justify-between">
            <div class="flex items-center gap-2">
              <i class="pi pi-file text-blue-600"></i>
              <span class="text-sm text-blue-800">{{ nombreArchivoSeleccionado }}</span>
            </div>
            <Button icon="pi pi-times" text rounded size="small" @click="cancelarArchivo" />
          </div>

          <div class="flex items-end gap-2">
            <input
              ref="fileInput"
              type="file"
              class="hidden"
              @change="manejarArchivo"
              accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
            />

            <Button
              icon="pi pi-paperclip"
              text
              rounded
              @click="seleccionarArchivo"
            />

            <Button
              icon="pi pi-face-smile"
              text
              rounded
              @click="mostrarEmojis = !mostrarEmojis"
            />

            <div class="flex-1 relative">
              <Textarea
                v-model="nuevoMensaje"
                rows="1"
                autoResize
                placeholder="Escribe un mensaje..."
                class="w-full"
                @keydown.enter.prevent="enviarMensaje"
              />

              <!-- Panel de Emojis -->
              <div
                v-if="mostrarEmojis"
                class="absolute bottom-full left-0 mb-2 bg-white rounded-lg shadow-lg border border-gray-200 p-3 w-80 max-h-60 overflow-y-auto"
              >
                <div class="grid grid-cols-8 gap-2">
                  <button
                    v-for="emoji in emojis"
                    :key="emoji"
                    @click="agregarEmoji(emoji)"
                    class="text-2xl hover:bg-gray-100 rounded p-1 transition-colors"
                  >
                    {{ emoji }}
                  </button>
                </div>
              </div>
            </div>

            <Button
              icon="pi pi-send"
              rounded
              @click="enviarMensaje"
              :disabled="!nuevoMensaje.trim() && !archivoSeleccionado"
            />
          </div>
        </div>
      </div>
    </div>

    <Toast />
  </main>
</template>

<style scoped>
.content-wrapper {
  min-height: calc(100vh - 60px);
}

.chat-tabs :deep(.p-tabview-panels) {
  padding: 0;
  height: 100%;
  overflow: hidden;
}

.chat-tabs :deep(.p-tabview-nav) {
  background: white;
  border-bottom: 1px solid #e5e7eb;
}

.chat-tabs :deep(.p-tabview-panel) {
  height: 100%;
  overflow: hidden;
}

/* Scrollbar personalizado */
::-webkit-scrollbar {
  width: 8px;
}

::-webkit-scrollbar-track {
  background: #f1f1f1;
}

::-webkit-scrollbar-thumb {
  background: #888;
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: #555;
}




</style>
