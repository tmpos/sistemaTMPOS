<script setup>
import { ref, onMounted,onUnmounted, watch,nextTick } from 'vue';
import { useDatosEmpresa } from '../../stores';
import { useToast } from "primevue/usetoast";
const toast = useToast();

const datosEmpresa = useDatosEmpresa();
const profilePic = ref(null);
const props = defineProps({
    user: {
        type: Object,
        required: true
    }
});

const emit = defineEmits(['send:message']);
const op = ref(null);
const textContent = ref('');

// Lista de emojis
const emojis = [
    '😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😇', '😉', '😊', '🙂', '🙃', '😋', 
    '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '🤪', '😜', '😝', '😛', '🤑', '😎', '🤓', 
    '🧐', '🤠', '🥳', '🤗', '🤡', '😏', '😶', '😐', '😑', '😒', '🙄', '🤨', '🤔', '🤫', 
    '🤭', '🤥', '😳', '😞', '😟', '😠', '😡', '🤬', '😔', '😕', '🙁', '😬', '🥺', '😣', 
    '😖', '😫', '😩', '🥱', '😤', '😮', '😱', '😨', '😰', '😯', '😦', '😧', '😢', '😥', '😪', '🤤'
];

// Obtener la imagen de perfil del usuario
async function fetchProfilePic() {
    if (!props.user?.id?.user) {
        console.warn("Usuario no disponible todavía. Esperando datos...");
        return;
    }

    try {
        const phoneNumber = props.user.id.user;
        profilePic.value = await window.electron.ipcRenderer.invoke('getProfilePic', phoneNumber);
    } catch (error) {
        console.error('Error obteniendo la imagen del perfil:', error);
    }
}

const messageContainer = ref(null);

const scrollToLastMessage = async () => {
    await nextTick(); // Esperar a que Vue renderice los nuevos mensajes
    if (messageContainer.value) {
        messageContainer.value.scrollTop = messageContainer.value.scrollHeight;
    }
};

// Escuchar mensajes nuevos desde el backend
onMounted(async () => {
    await fetchProfilePic();

    // Escuchar nuevos mensajes
    const handleNewMessage = (event, newMessage) => {
        //toast.add({ severity: 'success', summary: 'Mensaje Nuevo', detail: `${newMessage.from}: ${newMessage.text}`, life: 3000 });

        if (props.user.id._serialized === newMessage.from) {
            if (!Array.isArray(props.user.messages)) {
                props.user.messages = [];
            }
            props.user.messages.push(newMessage);
            scrollToLastMessage(); // 🔥 Scroll automático al recibir un mensaje
        }
    };




    //fetchMessages()
});

onUnmounted(() => {
   
});

// Si el usuario cambia, obtener su nueva imagen de perfil
watch(() => props.user, fetchProfilePic, { deep: true });

function addEmoji(emoji) {
    textContent.value += emoji;
    if (op.value) {
        op.value.hide(); // Solo cerrar si el popover está definido
    }
}

// Formatear fecha
function parseDate(timestamp) {
    return new Date(timestamp).toTimeString().split(':').slice(0, 2).join(':');
}

// Enviar mensaje
async function sendMessage() {
    if (textContent.value.trim() === '') {
        return;
    }

    try {
        const phoneNumber = props.user.id.user;

        let message = {
            text: textContent.value,
            ownerId: "me",
            createdAt: new Date().getTime()
        };

        // Enviar el mensaje a través de Electron y esperar confirmación
        const response = await window.electron.ipcRenderer.invoke('sendMessage', phoneNumber, textContent.value);

        if (!response || response.error) {
            console.error("Error al enviar el mensaje:", response?.error || "Error desconocido");
            return;
        }

        // Emitimos el evento al padre para actualizar el chat
        emit('send:message', message);

        textContent.value = ''; // Limpiar el input
    } catch (err) {
        console.error('Error enviando el mensaje:', err);
    }
}
</script>

<template>
    <div class="flex flex-col h-full">
        <!-- Información del usuario activo -->
        <div class="flex items-center border-b border-surface-200 dark:border-surface-700 p-4 lg:p-12">
            <div class="relative flex items-center mr-4">
                <img :src="profilePic || 'https://placehold.co/50x50'" alt="Foto de perfil" class="w-16 h-16 rounded-full shadow-lg" />
                <span class="w-4 h-4 rounded-full border-2 border-surface-200 dark:border-surface-700 absolute bottom-0 right-0"
                    :class="{ 'bg-green-400': user.status === 'active', 'bg-red-400': user.status === 'busy', 'bg-yellow-400': user.status === 'away' }">
                </span>
            </div>
            <div class="mr-2">
                <span class="text-surface-900 dark:text-surface-0 font-semibold block">{{ user.name }}</span>
                <span class="text-surface-700 dark:text-surface-100">Última actividad hace 1 hora</span>
            </div>
        </div>

        <!-- Mensajes -->
        <div ref="messageContainer" class="user-message-container p-4 md:px-6 lg:px-12 lg:py-6 mt-2 overflow-y-auto" style="max-height: 53vh">
            <div v-for="message in user.messages" :key="message.createdAt">
                <!-- Mensaje del otro usuario -->
                <div v-if="message.ownerId !== 'me'" class="grid gap-4 grid-nogutter mb-6">
                    <div class="mr-4 mt-1">
                        <img :src="profilePic || 'https://placehold.co/50x50'" alt="Foto de perfil" class="w-12 h-12 rounded-full shadow-lg" />
                    </div>
                    <div class="col-span-12 mt-4">
                        <p class="text-surface-900 dark:text-surface-0 font-semibold mb-4">{{ user.name }}</p>
                        <span class="text-surface-700 dark:text-surface-100 inline-block font-medium border border-surface-200 dark:border-surface-700 p-4 whitespace-normal rounded">{{ message.text }}</span>
                        <p class="text-surface-700 dark:text-surface-100 mt-4">{{ parseDate(message.createdAt) }}</p>
                    </div>
                </div>

                <!-- Mensaje propio -->
                <div v-if="message.ownerId === 'me'" class="grid gap-4 grid-nogutter mb-6">
                    <div class="col-span-12 mt-4 text-right">
                        <span class="inline-block text-left font-medium border border-surface-200 dark:border-surface-700 bg-primary-100 text-primary-900 p-4 whitespace-normal rounded">{{ message.text }}</span>
                        <p class="text-surface-700 dark:text-surface-100 mt-4">{{ parseDate(message.createdAt) }}</p>
                    </div>
                </div>
            </div>
        </div>

        <!-- Input de mensaje -->
        <div class="p-4 md:p-6 lg:p-12 flex flex-col sm:flex-row items-center mt-auto border-t border-surface-200 dark:border-surface-700 gap-4">
            <InputText id="message" type="text" placeholder="Escribe un mensaje..." class="flex-1 w-full sm:w-auto rounded" v-model="textContent" @keydown.enter="sendMessage()" />
             <Button class="w-full sm:w-auto justify-center text-xl" severity="secondary" @click="(event) => op.toggle(event)">😀</Button>
            <Button label="Enviar" icon="pi pi-send" @click="sendMessage()" />
        </div>
        <Popover ref="op" class="w-full sm:w-[30rem]">
            <Button v-for="emoji in emojis" :key="emoji" @click="addEmoji(emoji)" type="button" :label="emoji" class="p-2 text-2xl" text />
        </Popover>


    </div>
</template>
