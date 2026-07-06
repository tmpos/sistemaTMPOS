<script setup>
import { nextTick, onMounted, ref, watch } from 'vue';
import ChatBox from './ChatBox.vue';
import ChatSidebar from './ChatSidebar.vue';
import QRCode from 'qrcode';
import { useToast } from "primevue/usetoast";

const toast = useToast();
const activeUserId = ref(1);
const users = ref([]);
const chats = ref([]);
const contacts = ref([]);
const pdfFile = ref(null);
const qrDialogVisible = ref(false)
const qrCode = ref('');
const phoneNumber = ref('');
const message = ref('');
const previousMessageCount = ref(0);
const notificationSound = ref(null);
/**************************************************/
// Crear sonido de notificación
const createNotificationSound = () => {
  // Crear un sonido simple usando Web Audio API
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  const audioContext = new AudioContext();

  return () => {
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.value = 800; // Frecuencia del sonido
    oscillator.type = 'sine';

    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.5);
  };
};
/**************************************************/
// Obtener imagen de perfil de WhatsApp o usar una por defecto
const fetchProfilePic = async (phoneNumber) => {
    try {
        const pic = await window.electron.ipcRenderer.invoke('getProfilePic', phoneNumber);
        return pic || 'https://placehold.co/50x50'; // Si no hay imagen, usar por defecto
    } catch (err) {
        console.error(`Error obteniendo imagen de perfil para ${phoneNumber}:`, err);
        return 'https://placehold.co/50x50'; // Imagen por defecto en caso de error
    }
};
/**************************************************/
const buscarIMG = async(phone)=>{
    return await fetchProfilePic(phone)
}
/**************************************************/
const loadChatMessages = async (user) => {
    try {
        const messages = await window.electron.ipcRenderer.invoke('getChatByPhoneNumber', user.id.user);

        // Buscamos el usuario en la lista de chats y actualizamos sus mensajes
        const chatIndex = users.value.findIndex(u => u.id.user === user.id.user);
        if (chatIndex !== -1) {
            users.value[chatIndex].messages = messages.messages;
        }

    } catch (err) {
        console.error(`Error obteniendo mensajes del chat con ${user.name}:`, err);
    }
};

/**************************************************/
const getChats = async (showNotification = false) => {
    try {
        const chatsData = await window.electron.ipcRenderer.invoke('getChats');

        // Guardamos los chats sin imagen
        const newUsers = chatsData.map((chat) => ({
            ...chat,
            messages: Array.isArray(chat.messages) ? chat.messages : [],
            image: 'https://placehold.co/50x50',
        }));

        // Contar mensajes totales
        const currentMessageCount = newUsers.reduce((total, user) =>
            total + (user.messages?.length || 0), 0
        );

        // Si hay nuevos mensajes y no es la primera carga
        if (showNotification && previousMessageCount.value > 0 && currentMessageCount > previousMessageCount.value) {
            const newMessagesCount = currentMessageCount - previousMessageCount.value;

            // Reproducir sonido
            if (notificationSound.value) {
                notificationSound.value();
            }

            // Mostrar notificación
            toast.add({
                severity: 'info',
                summary: 'Nuevo mensaje',
                detail: `Tienes ${newMessagesCount} mensaje${newMessagesCount > 1 ? 's' : ''} nuevo${newMessagesCount > 1 ? 's' : ''}`,
                life: 5000,
                group: 'br'
            });
        }

        previousMessageCount.value = currentMessageCount;
        users.value = newUsers;

    } catch (err) {
        console.error('❌ Error obteniendo chats:', err);
    }
};


/************************************************/
const revisaReady = async () => {
  try {
    const revisaRead = await window.electron.ipcRenderer.invoke('isClientReady');
    
    if(revisaRead.ready){
        await getChats()
    }else{
       qrDialogVisible.value = true;
    }

  } catch (err) {
    console.error('Error getting chats:', err);
  }
};
/************************************************/
onMounted(async () => {
    // Inicializar sonido de notificación
    notificationSound.value = createNotificationSound();

    await revisaReady()

    window.electron.ipcRenderer.on('ready', async() => {
        qrDialogVisible.value = false;
        await getChats(false) // Primera carga sin notificación
    });

    window.electron.ipcRenderer.on('qr', (qr) => {
        generateQR(qr);
    });

    // Listener para nuevos mensajes
    window.electron.ipcRenderer.on('message', async (messageData) => {
        console.log('📩 Nuevo mensaje recibido:', messageData);
        await getChats(true); // Recargar chats y notificar

        // Si el mensaje es del chat activo, actualizar vista
        const activeUser = findActiveUser();
        if (activeUser && messageData.from === activeUser.id.user) {
            await loadChatMessages(activeUser);
        }
    });

    // Polling cada 10 segundos para verificar nuevos mensajes
    setInterval(async () => {
        await getChats(true);
    }, 10000);

    scrollToLastMessage();

});

/************************************************/
const generateQR = async (text) => {
  try {
    if (text) {
      qrCode.value = await QRCode.toDataURL(text);
      qrDialogVisible.value = true;
    } else {
      console.error('QR code text is empty or invalid');
    }
  } catch (err) {
    console.error('Error generating QR code:', err);
  }
};
/************************************************/
const openQRModal = async() => {
    await window.electron.ipcRenderer.invoke('login');
    //qrDialogVisible.value = true;
};

const logout = async () => {
    try {
        await window.electron.ipcRenderer.invoke('logout');
        users.value = [];
        qrDialogVisible.value = true; // Muestra el QR nuevamente tras logout
    } catch (err) {
        console.error('Error cerrando sesión:', err);
    }
};
/************************************************/

/************************************************/
window.electron.ipcRenderer.on('ready', async(estado) => { 
  if(estado === 'ok'){ 
    qrDialogVisible.value = false; 
    await getChats()
  } 
})


const changeActiveUser = async (user) => {
    activeUserId.value = user.id.user;
    await loadChatMessages(user); // Cargar mensajes antes de activarlo
    scrollToLastMessage();
};


function sendMessage(message) {
    const activeUser = findActiveUser();
    activeUser.messages.push(message);
    scrollToLastMessage();
}

function findActiveUser() {
    return users.value.find((user) => user.id.user === activeUserId.value) || {};
}

async function scrollToLastMessage() {
    const element = document.querySelector('.user-message-container');

    await nextTick(() => {
        element.scroll({ top: element.scrollHeight });
    });
}
</script>

<template>
    <div class="flex flex-col md:flex-row gap-8" style="min-height: 81vh">
        <Toast position="bottom-right" group="br" />

        <div class="md:w-[25rem] card p-0">
            <ChatSidebar
                @change:active:user="changeActiveUser"
                :users="users"
                @login="openQRModal"
                @logout="logout"
            ></ChatSidebar>
        </div>

        <div class="flex-1 card p-0">
            <ChatBox @send:message="sendMessage" :user="findActiveUser()"></ChatBox>
        </div>
    </div>

    <Dialog v-model:visible="qrDialogVisible" :style="{ width: '50vw' }" :modal="true" :dismissableMask="true">
        <div class="flex flex-col items-center justify-center">
            <img :src="qrCode" alt="QR Code" class="mx-auto text-center w-64 h-64" />
            <p class="mt-4 text-center">Escanea este código QR con tu teléfono para iniciar sesión en WhatsApp Web.</p>
        </div>
    </Dialog>
</template>
