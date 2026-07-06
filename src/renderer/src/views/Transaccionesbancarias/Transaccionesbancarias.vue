<script setup>
import { ref, onMounted, nextTick, watchEffect, computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
const router = useRouter();
import axios from 'axios';
import { enviarDatosPorPost, eliminarDatos, obtenerIdsSeleccionados, borrarTodoslosDatos, lenguajeDataTable, nfecha, arrayToObjetoFromTabla, peticionesFetch, encryptarPassword, envioElectron, mensajetoast, crearTablaSiNoExiste, peticiones, lasMayusculas, enviarDatosLocalStorage, peticionesFetchOffline, arrayToObjetoFromTablaOffline, crearTablaSiNoExisteOffline } from '../../funciones/funciones.js';
import Swal from 'sweetalert2'
import { useToast } from "primevue/usetoast";
const toast = useToast();
/************************************************************************/
/************************************************************************/
const usuarioLocal = ref({})
/************************************************************************/
const camposArray = ["cuenta_origen", "cuenta_destino", "monto", "tipo", "balance_anterior", "balance_actual", "metodo", "descripcion", "depositante", "beneficiario", "fecha", "hora", "estado", "usuario"];
/************************************************************************/
import { useDatosEmpresa } from '../../stores'
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
const datoscamposTransaccionesbancarias = ref({})
/************************************************************************/
const visible = ref(false);
const visiblecrear = ref(false);
const value = ref(null);
const id = ref(null);
const datoscampos = ref({});
const data = ref([]);
const searchQuery = ref('');
const bancos = ref([]);
const bancoSeleccionado = ref(null);
const TransaccionesbancariasEditar = ref(null);
/************************************************************************/
async function limpiarCamposCrear() {
    datoscamposTransaccionesbancarias.value = {}
    await campos();
}
/************************************************************************/
watchEffect(() => {
    if (visiblecrear.value) {
    }
});
/************************************************************************/
const fetchAndSetupData = async () => {
    const response = await peticionesFetchOffline('getDataAsArray', 'transaccionesbancarias');
    const jsonData = response;
    data.value = jsonData.reverse();
};
/************************************************************************/
const fetchBancos = async () => {
    const response = await peticionesFetchOffline('getDataAsArray', 'banco');
    bancos.value = response || [];
};
/************************************************************************/
async function campos() {
    const campos = await arrayToObjetoFromTablaOffline('transaccionesbancarias');
    datoscamposTransaccionesbancarias.value = campos;
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
    await crearTablaSiNoExisteOffline('transaccionesbancarias', camposArray, toast);
    usuarioLocal.value = JSON.parse(window.localStorage.getItem('usuarioLocal'))[0] || {};
    await fetchAndSetupData();
    await fetchBancos();
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
                    const envioDatos = await peticionesFetchOffline('deleteAll', 'transaccionesbancarias');
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
    const url = link.value + api.value + "/actualizarcampos/transaccionesbancarias";
    if (!datoscampos.value) {
        console.error("Datos incompletos, no se puede actualizar.");
        return;
    }
    if (datoscampos.value.hasOwnProperty('created_at')) {
        datoscampos.value.updated_at = nfecha('timestamp');
    }
    const envioDatos = await peticionesFetchOffline('updateData', 'transaccionesbancarias', JSON.stringify(datoscampos.value));
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
    const url = link.value + api.value + "/insertar/transaccionesbancarias";
    if (datoscamposTransaccionesbancarias.value.hasOwnProperty('created_at')) {
        datoscamposTransaccionesbancarias.value.created_at = nfecha('timestamp');
        datoscamposTransaccionesbancarias.value.updated_at = nfecha('timestamp');
    }
    const envioDatos = await peticionesFetchOffline('insertData', 'transaccionesbancarias', JSON.stringify(datoscamposTransaccionesbancarias.value));
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
                                const envioDatos = await peticionesFetchOffline('deleteEntry', 'transaccionesbancarias', id);
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
const itemsTransaccionesbancarias = ref([]);
const menu = ref(null);
const currentRowData = ref(null);
const toggleTransaccionesbancarias = (event, rowData) => {
    currentRowData.value = rowData;
    itemsTransaccionesbancarias.value = [
        {
            label: 'Imprimir', icon: 'pi pi-print', command: () => {
                const datos = {
                    datos: currentRowData.value
                }

                const datosEmpresa = JSON.stringify(enviarDatosLocalStorage())
                window.electron.ipcRenderer.invoke('recibotransferencia', JSON.stringify(datos), datosEmpresa);
            }
        },
        {
            label: 'Eliminar', icon: 'pi pi-trash', command: () => {
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
                            const datosFactura = await peticionesFetchOffline('deleteEntry', 'transaccionesbancarias', rowData.id);
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
const filteredTransaccionesbancarias = computed(() => {
    let resultado = data.value;

    // Filtrar por banco seleccionado
    if (bancoSeleccionado.value) {
        const cuentaBanco = bancoSeleccionado.value.cuenta;
        resultado = resultado.filter(transaccion =>
            transaccion.cuenta_origen === cuentaBanco || transaccion.cuenta_destino === cuentaBanco
        );
    }

    // Filtrar por búsqueda de texto
    if (searchQuery.value) {
        resultado = resultado.filter(busqueda => {
            return Object.values(busqueda).some(value =>
                String(value).toLowerCase().includes(searchQuery.value.toLowerCase())
            );
        });
    }

    return resultado;
});
/************************************************************************/
const fnAwesomplete = () => {
}
const handleSelectComplete = async (selected) => {
}
/************************************************************************/
const getRowClass = (data) => {
    if (data.tipo === 'DEPOSITO') {
        return 'row-deposito';
    } else if (data.tipo === 'TRANSFERENCIA') {
        return 'row-transferencia';
    } else if (data.tipo === 'RETIRO') {
        return 'row-retiro';
    }
    return '';
};
/************************************************************************/
// Estadísticas (usando datos filtrados)
const totalDepositos = computed(() => {
    return filteredTransaccionesbancarias.value
        .filter(t => t.tipo === 'DEPOSITO')
        .reduce((sum, t) => sum + parseFloat(t.monto || 0), 0)
        .toFixed(2);
});

const totalRetiros = computed(() => {
    return filteredTransaccionesbancarias.value
        .filter(t => t.tipo === 'RETIRO')
        .reduce((sum, t) => sum + parseFloat(t.monto || 0), 0)
        .toFixed(2);
});

const totalTransferencias = computed(() => {
    return filteredTransaccionesbancarias.value
        .filter(t => t.tipo === 'TRANSFERENCIA')
        .reduce((sum, t) => sum + parseFloat(t.monto || 0), 0)
        .toFixed(2);
});

const cantidadTransacciones = computed(() => {
    return filteredTransaccionesbancarias.value.length;
});
/************************************************************************/
</script>
<template>
    <main class="transacciones-wrapper">
        <div class="container-transacciones mx-auto px-4 py-6">

            <!-- Header Section -->
            <div class="header-section mb-6">
                <div class="flex items-center justify-between">
                    <div class="flex items-center gap-4">
                        <div class="header-icon">
                            <i class="pi pi-arrows-h"></i>
                        </div>
                        <div>
                            <h1 class="text-3xl font-bold text-gray-800">Transacciones Bancarias</h1>
                            <p class="text-gray-600">Historial completo de depósitos, retiros y transferencias</p>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Stats Cards -->
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                <div class="stat-card stat-depositos">
                    <div class="stat-icon">
                        <i class="pi pi-arrow-down"></i>
                    </div>
                    <div class="stat-content">
                        <div class="stat-label">Total Depósitos</div>
                        <div class="stat-value">${{ totalDepositos }}</div>
                        <div class="stat-sublabel">Ingresos</div>
                    </div>
                </div>

                <div class="stat-card stat-retiros">
                    <div class="stat-icon">
                        <i class="pi pi-arrow-up"></i>
                    </div>
                    <div class="stat-content">
                        <div class="stat-label">Total Retiros</div>
                        <div class="stat-value">${{ totalRetiros }}</div>
                        <div class="stat-sublabel">Egresos</div>
                    </div>
                </div>

                <div class="stat-card stat-transferencias">
                    <div class="stat-icon">
                        <i class="pi pi-arrows-h"></i>
                    </div>
                    <div class="stat-content">
                        <div class="stat-label">Transferencias</div>
                        <div class="stat-value">${{ totalTransferencias }}</div>
                        <div class="stat-sublabel">Movimientos</div>
                    </div>
                </div>

                <div class="stat-card stat-total">
                    <div class="stat-icon">
                        <i class="pi pi-list"></i>
                    </div>
                    <div class="stat-content">
                        <div class="stat-label">Total Transacciones</div>
                        <div class="stat-value">{{ cantidadTransacciones }}</div>
                        <div class="stat-sublabel">Registros</div>
                    </div>
                </div>
            </div>

            <!-- Actions Card -->
            <Card class="actions-card mb-6">
                <template #content>
                    <div class="flex flex-wrap gap-3 justify-between items-center">
                        <div class="flex flex-wrap gap-2">
                            <Button icon="pi pi-refresh" label="Recargar" @click="fetchAndSetupData" severity="warning"
                                outlined class="action-btn" />
                            <Button icon="pi pi-plus" label="Nueva Transacción"
                                @click="router.push('/creartransaccionesbancarias')" severity="success"
                                class="action-btn" />
                            <Button icon="pi pi-trash" label="Borrar Selección" @click="borrarSeleccionados"
                                severity="danger" outlined class="action-btn" />
                        </div>

                        <div class="flex flex-wrap gap-2">
                            <Button icon="pi pi-building" label="Ver Bancos" @click="router.push('/banco')"
                                severity="info" class="action-btn" />
                            <Button v-if="usuarioLocal.usuario == 'Soporte'" icon="pi pi-trash" label="Borrar Todo"
                                @click="borrarTodo" severity="danger" class="action-btn" />
                        </div>
                    </div>
                </template>
            </Card>

            <!-- Table Card -->
            <Card class="table-card">
                <template #content>
                    <div class="flex flex-wrap justify-between items-center gap-4 mb-4">
                        <div class="flex items-center gap-2">
                            <i class="pi pi-building text-blue-600"></i>
                            <Select v-model="bancoSeleccionado" :options="bancos" optionLabel="nombre"
                                placeholder="Filtrar por banco" showClear class="banco-filter" />
                        </div>
                        <IconField iconPosition="left">
                            <InputIcon class="pi pi-search" />
                            <InputText v-model="searchQuery" placeholder="Buscar transacciones..."
                                class="search-input" />
                        </IconField>
                    </div>

                    <DataTable :value="filteredTransaccionesbancarias" scrollable scrollHeight="600px" dataKey="id"
                        paginator :rows="10" :rowClass="getRowClass" v-model:selection="selectedItems"
                        selectionMode="multiple" :rowsPerPageOptions="[5, 10, 20, 50]" class="modern-datatable">

                        <Column selectionMode="multiple" headerStyle="width: 3rem"></Column>

                        <Column header="Opciones" frozen :style="{ width: '100px' }">
                            <template #body="slotProps">
                                <Button icon="pi pi-cog" @click="toggleTransaccionesbancarias($event, slotProps.data)"
                                    severity="secondary" size="small" rounded />
                                <Menu ref="menu" :model="itemsTransaccionesbancarias" :popup="true" />
                            </template>
                        </Column>

                        <Column field="tipo" header="Tipo" :style="{ minWidth: '140px' }">
                            <template #body="slotProps">
                                <Tag v-if="slotProps.data.tipo === 'DEPOSITO'" :value="slotProps.data.tipo"
                                    severity="success" icon="pi pi-arrow-down" />
                                <Tag v-else-if="slotProps.data.tipo === 'RETIRO'" :value="slotProps.data.tipo"
                                    severity="danger" icon="pi pi-arrow-up" />
                                <Tag v-else :value="slotProps.data.tipo" severity="warning" icon="pi pi-arrows-h" />
                            </template>
                        </Column>

                        <Column field="monto" header="Monto" :style="{ minWidth: '150px' }">
                            <template #body="slotProps">
                                <div class="monto-badge"
                                    :class="{ 'monto-deposito': slotProps.data.tipo === 'DEPOSITO', 'monto-retiro': slotProps.data.tipo === 'RETIRO', 'monto-transferencia': slotProps.data.tipo === 'TRANSFERENCIA' }">
                                    <i class="pi pi-dollar mr-2"></i>
                                    ${{ parseFloat(slotProps.data.monto).toFixed(2) }}
                                </div>
                            </template>
                        </Column>

                        <Column field="cuenta_origen" header="Cuenta Origen" :style="{ minWidth: '180px' }">
                            <template #body="slotProps">
                                <div class="cuenta-cell">
                                    <i class="pi pi-wallet mr-2 text-blue-600"></i>
                                    {{ slotProps.data.cuenta_origen }}
                                </div>
                            </template>
                        </Column>

                        <Column field="cuenta_destino" header="Cuenta Destino" :style="{ minWidth: '180px' }">
                            <template #body="slotProps">
                                <div class="cuenta-cell" v-if="slotProps.data.cuenta_destino">
                                    <i class="pi pi-wallet mr-2 text-purple-600"></i>
                                    {{ slotProps.data.cuenta_destino }}
                                </div>
                                <span v-else class="text-gray-400">N/A</span>
                            </template>
                        </Column>

                        <Column field="metodo" header="Método" :style="{ minWidth: '140px' }">
                            <template #body="slotProps">
                                <Tag :value="slotProps.data.metodo" severity="info" />
                            </template>
                        </Column>

                        <Column field="balance_anterior" header="Balance Anterior" :style="{ minWidth: '160px' }">
                            <template #body="slotProps">
                                <span class="font-semibold text-gray-600">
                                    ${{ parseFloat(slotProps.data.balance_anterior).toFixed(2) }}
                                </span>
                            </template>
                        </Column>

                        <Column field="balance_actual" header="Balance Actual" :style="{ minWidth: '160px' }">
                            <template #body="slotProps">
                                <span class="font-bold text-green-600">
                                    ${{ parseFloat(slotProps.data.balance_actual).toFixed(2) }}
                                </span>
                            </template>
                        </Column>

                        <Column field="descripcion" header="Descripción" :style="{ minWidth: '200px' }">
                            <template #body="slotProps">
                                <div class="descripcion-cell">
                                    {{ slotProps.data.descripcion || 'Sin descripción' }}
                                </div>
                            </template>
                        </Column>

                        <Column field="depositante" header="Depositante" :style="{ minWidth: '180px' }">
                            <template #body="slotProps">
                                <div v-if="slotProps.data.depositante" class="persona-cell">
                                    <i class="pi pi-user mr-2 text-blue-600"></i>
                                    {{ slotProps.data.depositante }}
                                </div>
                                <span v-else class="text-gray-400">N/A</span>
                            </template>
                        </Column>

                        <Column field="beneficiario" header="Beneficiario" :style="{ minWidth: '180px' }">
                            <template #body="slotProps">
                                <div v-if="slotProps.data.beneficiario" class="persona-cell">
                                    <i class="pi pi-user mr-2 text-purple-600"></i>
                                    {{ slotProps.data.beneficiario }}
                                </div>
                                <span v-else class="text-gray-400">N/A</span>
                            </template>
                        </Column>

                        <Column field="fecha" header="Fecha" :style="{ minWidth: '120px' }">
                            <template #body="slotProps">
                                <div class="fecha-cell">
                                    <i class="pi pi-calendar mr-2"></i>
                                    {{ slotProps.data.fecha }}
                                </div>
                            </template>
                        </Column>

                        <Column field="hora" header="Hora" :style="{ minWidth: '100px' }">
                            <template #body="slotProps">
                                <div class="hora-cell">
                                    <i class="pi pi-clock mr-2"></i>
                                    {{ slotProps.data.hora }}
                                </div>
                            </template>
                        </Column>

                        <Column field="estado" header="Estado" :style="{ minWidth: '120px' }">
                            <template #body="slotProps">
                                <Tag :value="slotProps.data.estado" severity="success" />
                            </template>
                        </Column>

                    </DataTable>
                </template>
            </Card>

        </div>
        <Toast />
    </main>
</template>

<style scoped>
/* ===================================
   TRANSACCIONES BANCARIAS STYLES
   =================================== */

.transacciones-wrapper {
    min-height: calc(100vh - 80px);
    background: linear-gradient(135deg, rgba(243, 244, 246, 1) 0%, rgba(249, 250, 251, 1) 100%);
}

.container-transacciones {
    max-width: 1600px;
}

/* Header Section */
.header-section {
    background: white;
    border-radius: 16px;
    padding: 2rem;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
    border: 1px solid rgba(229, 231, 235, 0.8);
    animation: slideIn 0.4s ease-out;
}

.header-icon {
    width: 80px;
    height: 80px;
    border-radius: 16px;
    background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 2.5rem;
    color: white;
    box-shadow: 0 8px 20px rgba(99, 102, 241, 0.3);
}

/* Stats Cards */
.stat-card {
    background: white;
    border-radius: 16px;
    padding: 1.5rem;
    display: flex;
    align-items: center;
    gap: 1.5rem;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
    border: 2px solid;
    transition: all 0.3s ease;
    animation: slideIn 0.5s ease-out;
}

.stat-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.12);
}

.stat-depositos {
    border-color: #10b981;
    background: linear-gradient(135deg, rgba(16, 185, 129, 0.05) 0%, rgba(5, 150, 105, 0.02) 100%);
}

.stat-retiros {
    border-color: #ef4444;
    background: linear-gradient(135deg, rgba(239, 68, 68, 0.05) 0%, rgba(220, 38, 38, 0.02) 100%);
}

.stat-transferencias {
    border-color: #f59e0b;
    background: linear-gradient(135deg, rgba(245, 158, 11, 0.05) 0%, rgba(217, 119, 6, 0.02) 100%);
}

.stat-total {
    border-color: #3b82f6;
    background: linear-gradient(135deg, rgba(59, 130, 246, 0.05) 0%, rgba(37, 99, 235, 0.02) 100%);
}

.stat-icon {
    width: 70px;
    height: 70px;
    border-radius: 14px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 2rem;
    flex-shrink: 0;
}

.stat-depositos .stat-icon {
    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
    color: white;
}

.stat-retiros .stat-icon {
    background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
    color: white;
}

.stat-transferencias .stat-icon {
    background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
    color: white;
}

.stat-total .stat-icon {
    background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
    color: white;
}

.stat-content {
    flex: 1;
}

.stat-label {
    font-size: 0.875rem;
    font-weight: 600;
    color: #6b7280;
    margin-bottom: 0.375rem;
}

.stat-value {
    font-size: 2rem;
    font-weight: 800;
    color: #1f2937;
    line-height: 1;
    margin-bottom: 0.25rem;
}

.stat-sublabel {
    font-size: 0.75rem;
    color: #9ca3af;
    font-weight: 500;
}

/* Actions Card */
.actions-card {
    background: white;
    border-radius: 16px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
    border: 1px solid rgba(229, 231, 235, 0.8);
    animation: slideIn 0.6s ease-out;
}

.action-btn {
    font-weight: 600;
    border-radius: 10px;
    transition: all 0.3s ease;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.action-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
}

/* Table Card */
.table-card {
    background: white;
    border-radius: 16px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
    border: 1px solid rgba(229, 231, 235, 0.8);
    animation: slideIn 0.7s ease-out;
}

.search-input {
    border: 2px solid #e5e7eb;
    border-radius: 10px;
    padding: 0.75rem 1rem;
    padding-left: 2.5rem;
    min-width: 300px;
    transition: all 0.3s ease;
}

.search-input:focus {
    border-color: #6366f1;
    box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
}

.banco-filter {
    min-width: 220px;
    border: 2px solid #e5e7eb;
    border-radius: 10px;
    transition: all 0.3s ease;
}

.banco-filter:hover {
    border-color: #6366f1;
}

:deep(.banco-filter .p-select-label) {
    padding: 0.75rem 1rem;
}

.modern-datatable :deep(.p-datatable-thead>tr>th) {
    background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
    color: white;
    font-weight: 700;
    padding: 1rem;
    border: none;
}

.modern-datatable :deep(.p-datatable-tbody>tr) {
    transition: all 0.2s ease;
}

.modern-datatable :deep(.p-datatable-tbody>tr:hover) {
    background: rgba(99, 102, 241, 0.05);
}

/* Row Colors */
:deep(.row-deposito) {
    background: rgba(16, 185, 129, 0.03) !important;
    border-left: 4px solid #10b981;
}

:deep(.row-retiro) {
    background: rgba(239, 68, 68, 0.03) !important;
    border-left: 4px solid #ef4444;
}

:deep(.row-transferencia) {
    background: rgba(245, 158, 11, 0.03) !important;
    border-left: 4px solid #f59e0b;
}

/* Custom Badges */
.monto-badge {
    display: inline-flex;
    align-items: center;
    padding: 0.5rem 1rem;
    border-radius: 8px;
    font-weight: 700;
    font-size: 1.1rem;
    border: 2px solid;
}

.monto-deposito {
    background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
    border-color: #10b981;
    color: #065f46;
}

.monto-retiro {
    background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);
    border-color: #ef4444;
    color: #991b1b;
}

.monto-transferencia {
    background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
    border-color: #f59e0b;
    color: #92400e;
}

.cuenta-cell {
    display: flex;
    align-items: center;
    font-weight: 600;
    color: #374151;
}

.persona-cell {
    display: flex;
    align-items: center;
    font-weight: 500;
    color: #374151;
}

.descripcion-cell {
    font-size: 0.875rem;
    color: #6b7280;
    font-style: italic;
}

.fecha-cell,
.hora-cell {
    display: flex;
    align-items: center;
    font-weight: 500;
    color: #6b7280;
}

/* Animations */
@keyframes slideIn {
    from {
        opacity: 0;
        transform: translateY(20px);
    }

    to {
        opacity: 1;
        transform: translateY(0);
    }
}

/* Responsive */
@media (max-width: 768px) {
    .header-icon {
        width: 60px;
        height: 60px;
        font-size: 2rem;
    }

    .stat-card {
        padding: 1rem;
    }

    .stat-icon {
        width: 50px;
        height: 50px;
        font-size: 1.5rem;
    }

    .stat-value {
        font-size: 1.5rem;
    }

    .search-input {
        min-width: 100%;
    }
}
</style>
