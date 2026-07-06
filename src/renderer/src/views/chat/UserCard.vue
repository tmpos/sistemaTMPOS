<script setup>
import { ref, watch, onMounted, computed } from 'vue';

const props = defineProps({
    user: {
        type: Object,
        required: true
    }
});

const lastMessage = computed(() => {
    return props.user?.lastMessage?.body || 'No hay mensajes...';
});

const messageCount = computed(() => {
    return props.user?.messages?.length || 0;
});

const hasUnreadMessages = computed(() => {
    // Puedes implementar lógica de mensajes no leídos aquí
    return messageCount.value > 0 && props.user?.unreadCount > 0;
});

const lastMessageTime = computed(() => {
    if (props.user?.lastMessage?.timestamp) {
        const date = new Date(props.user.lastMessage.timestamp * 1000);
        const now = new Date();
        const diff = now - date;

        // Menos de 1 minuto
        if (diff < 60000) return 'Ahora';
        // Menos de 1 hora
        if (diff < 3600000) return `${Math.floor(diff / 60000)}m`;
        // Menos de 24 horas
        if (diff < 86400000) return `${Math.floor(diff / 3600000)}h`;
        // Más de 24 horas
        return date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
    }
    return '';
});

const fetchProfilePicLazy = async (phoneNumber) => {
    try {
        return await window.electron.ipcRenderer.invoke('getProfilePic', phoneNumber);
    } catch (err) {
        console.error(`Error obteniendo imagen de perfil para ${phoneNumber}:`, err);
        return 'https://placehold.co/50x50'; // Imagen por defecto
    }
};

const getUserImage = async(user) => {
    const imageRef = ref('https://placehold.co/50x50');

    await fetchProfilePicLazy(user.id.user).then((img) => {
        if (img) imageRef.value = img;
    });

    return imageRef.value;
};

</script>

<template>
    <div class="flex flex-nowrap justify-between items-center border border-surface-200 dark:border-surface-700 rounded-lg p-3 cursor-pointer select-none hover:bg-blue-50 dark:hover:bg-surface-800 hover:border-blue-300 dark:hover:border-blue-600 transition-all duration-200 shadow-sm hover:shadow-md" tabindex="0">
        <div class="flex items-center flex-1 min-w-0">
            <div class="relative mr-3">
                <img :src="getUserImage(user)" alt="user" class="w-12 h-12 rounded-full shadow-md object-cover" />
                <span
                    class="w-3 h-3 rounded-full border-2 border-white dark:border-gray-800 absolute bg-green-500"
                    style="bottom: 0px; right: 0px"
                    title="Activo"
                ></span>
            </div>

            <div class="flex-1 min-w-0 hidden md:block">
                <div class="flex items-center justify-between mb-1">
                    <span class="text-surface-900 dark:text-surface-0 font-semibold text-sm truncate">
                        {{ user.name }}
                    </span>
                    <span v-if="lastMessageTime" class="text-xs text-gray-500 dark:text-gray-400 ml-2 flex-shrink-0">
                        {{ lastMessageTime }}
                    </span>
                </div>

                <div class="flex items-center justify-between gap-2">
                    <span class="block text-surface-600 dark:text-surface-400 text-xs truncate flex-1">
                        {{ lastMessage }}
                    </span>

                    <!-- Badge de mensajes -->
                    <span v-if="messageCount > 0" class="flex-shrink-0 bg-blue-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                        {{ messageCount }}
                    </span>
                </div>
            </div>

            <!-- Mobile view -->
            <div class="flex-1 md:hidden">
                <span class="text-surface-900 dark:text-surface-0 font-semibold text-sm block">
                    {{ user.name }}
                </span>
                <span v-if="messageCount > 0" class="inline-block bg-blue-500 text-white text-xs font-bold px-2 py-0.5 rounded-full mt-1">
                    {{ messageCount }}
                </span>
            </div>
        </div>

        <!-- Indicador de nuevos mensajes -->
        <div v-if="hasUnreadMessages" class="w-2 h-2 bg-blue-500 rounded-full ml-2 flex-shrink-0 animate-pulse"></div>
    </div>
</template>

<style scoped>
@keyframes pulse {
    0%, 100% {
        opacity: 1;
    }
    50% {
        opacity: 0.5;
    }
}

.animate-pulse {
    animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}
</style>
