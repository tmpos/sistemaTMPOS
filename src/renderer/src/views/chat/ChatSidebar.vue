<script setup>
import { ref, watch,onMounted,computed  } from 'vue';
import UserCard from './UserCard.vue';
import { useDatosEmpresa } from '../../stores';
import Button from 'primevue/button';
import InputText from 'primevue/inputtext';
import Dialog from 'primevue/dialog';
import IconField from 'primevue/iconfield';
import InputIcon from 'primevue/inputicon';

const showAddClientDialog = ref(false);
const newClientPhone = ref('');
const datosEmpresa = useDatosEmpresa();

const emit = defineEmits(['change:active:user', 'logout', 'startChat','login']);

const props = defineProps({
    users: {
        type: Array,
        default: () => []
    }
});

const filteredUsers = ref([]);
const searchedUser = ref('');

watch(
    () => props.users,
    (newUsers) => {
        filteredUsers.value = newUsers;
    },
    { immediate: true }
);

/*********************************************************/
const isReady = ref(false)
/*********************************************************/
onMounted(async()=>{

window.electron.ipcRenderer.on('ready', (ready) => {
    if(ready.success){
       isReady.value = true
    }

})


})
/*********************************************************/


function onChangeActiveUser(user) {
    emit('change:active:user', user);
}

function filter() {

    if (!searchedUser.value.trim()) {
        filteredUsers.value = props.users;
        return;
    }

    filteredUsers.value = props.users.filter((user) =>
        user.name.toLowerCase().includes(searchedUser.value.toLowerCase())
    );
}

  
// Agregar nuevo cliente a la lista y emitir evento de chat
const startChat = async() => {
    let phone = newClientPhone.value.trim().replace(/\D/g, ''); // Limpia caracteres no numéricos
    const imagenNueva = await window.electron.ipcRenderer.invoke('getProfilePic', phone);

    if (!phone.endsWith('@c.us')) {
        phone = `${phone}@c.us`; // Asegura el formato correcto
    }

    if (!phone) return;

    const exists = filteredUsers.value.some(user => user.id._serialized === phone);
    if (exists) {
        alert('Este cliente ya está en la lista.');
        return;
    }


    const newUser = {
        id: { _serialized: phone, user: phone.split('@')[0], server: 'c.us' },
        name: `Cliente ${phone.split('@')[0]}`,
        messages: [],
        avatar: imagenNueva || 'https://placehold.co/50x50'
    };

    filteredUsers.value.unshift(newUser);
    emit('startChat', phone);

    showAddClientDialog.value = false;
    newClientPhone.value = '';
};


const openAddClientDialog = () => {
    showAddClientDialog.value = true;
};


</script>

<template>
    <!-- Perfil de usuario -->
    <div class="flex flex-col items-center border-b border-surface-200 dark:border-surface-700 p-12">
        <img :src="datosEmpresa.usuario.imagen" class="w-24 h-24 rounded-full shadow-lg" alt="User Image" />
        <span class="text-surface-900 dark:text-surface-0 text-xl font-semibold mt-6">
            {{ datosEmpresa.usuario.nombre }}
        </span>
    </div>

    <!-- Buscador y lista de usuarios -->
    <div class="w-full flex flex-col gap-6 border-surface-200 dark:border-surface-700 p-6">
        <IconField class="w-full">
            <InputIcon class="pi pi-search" />
            <InputText 
                id="search" 
                type="text" 
                placeholder="Buscar usuario" 
                class="w-full" 
                v-model="searchedUser" 
                @input="filter" 
            />
        </IconField>

        <!-- Lista de usuarios -->
        <div class="flex flex-col gap-2 overflow-y-auto" style="max-height: 50vh">
            <div v-if="filteredUsers.length === 0" class="text-center p-4 text-gray-500">
                <i class="pi pi-inbox text-4xl mb-2 block"></i>
                <p class="text-sm">No hay chats activos</p>
                <p class="text-xs mt-1">Inicia una conversación con un cliente</p>
            </div>
            <UserCard
                v-for="user in filteredUsers"
                :key="user.id"
                :user="user"
                @click.stop="onChangeActiveUser(user)"
                class="w-full cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-all rounded-lg"
            />
        </div>

        <!-- Contador de chats activos -->
        <div class="mt-4 p-3 bg-blue-50 dark:bg-blue-900 rounded-lg">
            <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                    <i class="pi pi-comments text-blue-600 dark:text-blue-400"></i>
                    <span class="text-sm font-semibold text-blue-900 dark:text-blue-100">Chats Activos</span>
                </div>
                <span class="text-lg font-bold text-blue-600 dark:text-blue-400">{{ filteredUsers.length }}</span>
            </div>
        </div>

        <!-- Controles inferiores -->
        <div class="flex justify-between items-center space-x-4 mt-4">
            <Button 
                v-if="isReady"
                label="Cerrar sesión" 
                icon="pi pi-sign-out" 
                class="w-1/2 p-button-danger p-button-outlined"
                @click="$emit('logout')" 
            />
            <Button 
                v-if="!isReady"
                label="Iniciar sesión" 
                icon="pi pi-sign-in" 
                class="w-1/2 p-button-success p-button-outlined"
                @click="$emit('login')" 
            />
            <Button 
                label="Cliente" 
                icon="pi pi-user-plus" 
                class="w-1/2 p-button-primary"
                @click="openAddClientDialog" 
            />
        </div>

        <!-- Modal para agregar cliente -->
        <Dialog v-model:visible="showAddClientDialog" modal header="Agregar Cliente" :style="{ width: '25rem' }">
            <div class="flex flex-col gap-4">
                <InputText v-model="newClientPhone" placeholder="Número de teléfono" class="w-full" />
                <Button label="Iniciar Chat" icon="pi pi-comments" class="p-button-success w-full" @click="startChat" />
            </div>
        </Dialog>
    </div>
</template>
