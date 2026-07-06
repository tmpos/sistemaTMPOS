
<script setup>
import { ref, onMounted, nextTick, watchEffect, computed } from 'vue';
import axios from 'axios';
import { enviarDatosPorPost, eliminarDatos, obtenerIdsSeleccionados, borrarTodoslosDatos, lenguajeDataTable, nfecha, arrayToObjetoFromTabla, peticionesFetch, encryptarPassword, envioElectron, mensajetoast, crearTablaSiNoExiste, peticiones, lasMayusculas, peticionesFetchOffline, arrayToObjetoFromTablaOffline, crearTablaSiNoExisteOffline } from '../../funciones/funciones.js';
import Swal from 'sweetalert2'
import { useToast } from "primevue/usetoast";

const toast = useToast();
/************************************************************************/
/************************************************************************/
const usuarioLocal = ref({})
/************************************************************************/
const camposArray = ['nombre', 'categoria', 'saldo'];
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
const datoscamposCuentas = ref({})
/************************************************************************/
const visible = ref(false);
const visiblecrear = ref(false);
const value = ref(null);
const id = ref(null);
const datoscampos = ref({});
const data = ref([]);
const searchQuery = ref('');
const CuentasEditar = ref(null);
/************************************************************************/
async function limpiarCamposCrear() {
    datoscamposCuentas.value = {}
    await campos();
}
/************************************************************************/
watchEffect(() => {
    if (visiblecrear.value) {
    }
});
/************************************************************************/
const fetchAndSetupData = async () => {
    const response = await peticionesFetchOffline('getDataAsArray', 'cuentas');
    const jsonData = response.reverse();
    data.value = jsonData;
};
/************************************************************************/
async function campos() {
    const campos = await arrayToObjetoFromTablaOffline('cuentas');
    datoscamposCuentas.value = campos;
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
    await crearTablaSiNoExisteOffline('cuentas', camposArray, toast);
    usuarioLocal.value = JSON.parse(window.localStorage.getItem('usuarioLocal'))[0] || {};
    await campos();
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
                    const envioDatos = await peticionesFetchOffline('deleteAll', 'cuentas');
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
    const url = link.value + api.value + "/actualizarcampos/cuentas";
    if (!datoscampos.value) {
        console.error("Datos incompletos, no se puede actualizar.");
        return;
    }
    if (datoscampos.value.hasOwnProperty('created_at')) {
        datoscampos.value.updated_at = nfecha('timestamp');
    }
    const envioDatos = await peticionesFetchOffline('updateData', 'cuentas', JSON.stringify(datoscampos.value));
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
    const url = link.value + api.value + "/insertar/cuentas";
    if (datoscamposCuentas.value.hasOwnProperty('created_at')) {
        datoscamposCuentas.value.created_at = nfecha('timestamp');
        datoscamposCuentas.value.updated_at = nfecha('timestamp');
    }
    const envioDatos = await peticionesFetchOffline('insertData', 'cuentas', JSON.stringify(datoscamposCuentas.value));
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
                                const envioDatos = await peticionesFetchOffline('deleteEntry', 'cuentas', id);
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
const itemsCuentas = ref([]);
const menu = ref(null);
const currentRowData = ref(null);
const toggleCuentas = (event, rowData) => {
    currentRowData.value = rowData;
    itemsCuentas.value = [
        {
            label: 'Editar', icon: 'pi pi-pencil', command: () => {
                visible.value = true;
                datoscampos.value = currentRowData.value;
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
                            const datosFactura = await peticionesFetchOffline('deleteEntry', 'cuentas', rowData.id);
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
const filteredCuentas = computed(() => {
    if (!searchQuery.value) return data.value;
    return data.value.filter(busqueda => {
        return Object.values(busqueda).some(value =>
            String(value).toLowerCase().includes(searchQuery.value.toLowerCase())
        );
    });
});
/************************************************************************/
const fnAwesomplete = () => {
}
const handleSelectComplete = async (selected) => {
}
/************************************************************************/
const onRowSelect = (event) => {

    datoscampos.value = event.data;
    visible.value = true;


};

const formatCurrency = (value) => {
    if (value) {
        return value.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
    }
    return '';
};

const getSeverity = (categoria) => {
    switch (categoria) {
        case 'ACTIVOS':
            return 'success';
        case 'PASIVOS':
            return 'warning';
        case 'PATRIMONIOS':
            return 'info';
        case 'INGRESOS':
            return 'success';
        case 'GASTOS':
            return 'danger';
        case 'COSTOS':
            return 'danger';
        default:
            return null;
    }
};
/************************************************************************/
// Resumen de cuentas por categoría
const resumenCuentas = computed(() => {
    const resumen = {
        ACTIVOS: { total: 0, cantidad: 0 },
        PASIVOS: { total: 0, cantidad: 0 },
        PATRIMONIOS: { total: 0, cantidad: 0 },
        INGRESOS: { total: 0, cantidad: 0 },
        GASTOS: { total: 0, cantidad: 0 },
        COSTOS: { total: 0, cantidad: 0 }
    };

    data.value.forEach(cuenta => {
        const categoria = cuenta.categoria?.toUpperCase();
        if (resumen[categoria]) {
            resumen[categoria].total += parseFloat(cuenta.saldo || 0);
            resumen[categoria].cantidad += 1;
        }
    });

    return resumen;
});

const totalCuentas = computed(() => data.value.length);
const totalActivos = computed(() => resumenCuentas.value.ACTIVOS.total);
const totalPasivos = computed(() => resumenCuentas.value.PASIVOS.total);
const totalPatrimonio = computed(() => resumenCuentas.value.PATRIMONIOS.total);

const getCategoriaColor = (categoria) => {
    switch (categoria) {
        case 'ACTIVOS':
            return 'text-green-600';
        case 'PASIVOS':
            return 'text-orange-600';
        case 'PATRIMONIOS':
            return 'text-blue-600';
        case 'INGRESOS':
            return 'text-green-500';
        case 'GASTOS':
            return 'text-red-600';
        case 'COSTOS':
            return 'text-red-700';
        default:
            return 'text-gray-400';
    }
};

const getSaldoClass = (saldo) => {
    const valor = parseFloat(saldo || 0);
    if (valor > 0) return 'text-green-700';
    if (valor < 0) return 'text-red-700';
    return 'text-gray-500';
};
</script>
<template>
    <main class="content-wrapper cuentas-wrapper">
        <div class="mt-5">
            <!-- Header Profesional -->
            <div class="cuentas-header mb-5">
                <div class="cuentas-header-content">
                    <div class="cuentas-icon-wrapper">
                        <i class="pi pi-calculator cuentas-icon"></i>
                    </div>
                    <div>
                        <h1 class="cuentas-title">Plan de Cuentas Contables</h1>
                        <p class="cuentas-subtitle">Gestión y control del catálogo contable</p>
                    </div>
                </div>
            </div>

            <!-- Tarjetas de Resumen -->
            <div class="grid grid-cols-12 gap-4 mb-5">
                <div class="col-span-12 md:col-span-6 lg:col-span-3">
                    <Card class="summary-card activos-card">
                        <template #content>
                            <div class="flex items-center justify-between">
                                <div>
                                    <p class="summary-label">ACTIVOS</p>
                                    <p class="summary-value">{{ formatCurrency(totalActivos) }}</p>
                                    <p class="summary-count">{{ resumenCuentas.ACTIVOS.cantidad }} cuentas</p>
                                </div>
                                <div class="summary-icon-wrapper activos">
                                    <i class="pi pi-wallet text-3xl"></i>
                                </div>
                            </div>
                        </template>
                    </Card>
                </div>

                <div class="col-span-12 md:col-span-6 lg:col-span-3">
                    <Card class="summary-card pasivos-card">
                        <template #content>
                            <div class="flex items-center justify-between">
                                <div>
                                    <p class="summary-label">PASIVOS</p>
                                    <p class="summary-value">{{ formatCurrency(totalPasivos) }}</p>
                                    <p class="summary-count">{{ resumenCuentas.PASIVOS.cantidad }} cuentas</p>
                                </div>
                                <div class="summary-icon-wrapper pasivos">
                                    <i class="pi pi-credit-card text-3xl"></i>
                                </div>
                            </div>
                        </template>
                    </Card>
                </div>

                <div class="col-span-12 md:col-span-6 lg:col-span-3">
                    <Card class="summary-card patrimonio-card">
                        <template #content>
                            <div class="flex items-center justify-between">
                                <div>
                                    <p class="summary-label">PATRIMONIO</p>
                                    <p class="summary-value">{{ formatCurrency(totalPatrimonio) }}</p>
                                    <p class="summary-count">{{ resumenCuentas.PATRIMONIOS.cantidad }} cuentas</p>
                                </div>
                                <div class="summary-icon-wrapper patrimonio">
                                    <i class="pi pi-briefcase text-3xl"></i>
                                </div>
                            </div>
                        </template>
                    </Card>
                </div>

                <div class="col-span-12 md:col-span-6 lg:col-span-3">
                    <Card class="summary-card total-card">
                        <template #content>
                            <div class="flex items-center justify-between">
                                <div>
                                    <p class="summary-label">TOTAL CUENTAS</p>
                                    <p class="summary-value">{{ totalCuentas }}</p>
                                    <p class="summary-count">registros activos</p>
                                </div>
                                <div class="summary-icon-wrapper total">
                                    <i class="pi pi-database text-3xl"></i>
                                </div>
                            </div>
                        </template>
                    </Card>
                </div>
            </div>

            <!-- Tabla de Cuentas -->
            <Card class="cuentas-table-card shadow-lg">
                <template #content>
                    <!-- Toolbar -->
                    <div class="cuentas-toolbar">
                        <div class="flex gap-2">
                            <Button icon="pi pi-refresh" severity="secondary" text rounded @click="fetchAndSetupData" v-tooltip="'Recargar datos'" />
                            <Button label="Nueva Cuenta" icon="pi pi-plus" severity="info" @click="visiblecrear = true" />
                            <Button icon="pi pi-trash" severity="danger" outlined @click="borrarSeleccionados" :disabled="!selectedItems || !selectedItems.length" v-tooltip="'Borrar seleccionados'" />
                        </div>
                        <div class="flex gap-2 items-center">
                            <span class="p-input-icon-left">
                                <i class="pi pi-search" />
                                <InputText v-model="searchQuery" placeholder="Buscar cuenta..." class="p-inputtext-sm" />
                            </span>
                            <Button v-if="usuarioLocal.usuario == 'Soporte'" label="Borrar Todo" icon="pi pi-trash" severity="danger" text @click="borrarTodo" />
                        </div>
                    </div>

                    <Divider />

                    <!-- Data Table -->
                    <DataTable
                        :value="filteredCuentas"
                        scrollable
                        scrollHeight="500px"
                        dataKey="id"
                        paginator
                        :rows="10"
                        v-model:selection="selectedItems"
                        @rowSelect="onRowSelect"
                        selectionMode="single"
                        :rowsPerPageOptions="[10, 20, 50]"
                        tableStyle="min-width: 50rem"
                        stripedRows
                        class="cuentas-datatable">

                        <Column selectionMode="multiple" headerStyle="width: 3rem"></Column>

                        <Column header="Acciones" style="width: 5rem; text-align: center">
                            <template #body="slotProps">
                                <Button icon="pi pi-ellipsis-v" text rounded severity="secondary" @click="toggleCuentas($event, slotProps.data)" aria-haspopup="true" aria-controls="overlay_menu_Cuentas" />
                                <Menu ref="menu" id="overlay_menu_Cuentas" :model="itemsCuentas" :popup="true" />
                            </template>
                        </Column>

                        <Column field="nombre" header="Nombre de la Cuenta" sortable>
                            <template #body="slotProps">
                                <div class="flex items-center gap-2">
                                    <i class="pi pi-circle-fill text-xs" :class="getCategoriaColor(slotProps.data.categoria)"></i>
                                    <span class="font-medium text-gray-800">{{ slotProps.data.nombre }}</span>
                                </div>
                            </template>
                        </Column>

                        <Column field="categoria" header="Categoría" sortable style="width: 18%">
                            <template #body="slotProps">
                                <Tag :value="slotProps.data.categoria" :severity="getSeverity(slotProps.data.categoria)" class="font-semibold" />
                            </template>
                        </Column>

                        <Column field="saldo" header="Saldo" sortable style="width: 18%; text-align: right">
                            <template #body="slotProps">
                                <span class="font-mono font-bold text-lg" :class="getSaldoClass(slotProps.data.saldo)">
                                    {{ formatCurrency(slotProps.data.saldo) }}
                                </span>
                            </template>
                        </Column>
                    </DataTable>
                </template>
            </Card>

            <!-- Modal Editar -->
            <Dialog v-model:visible="visible" modal :style="{ width: '35rem' }" class="cuentas-dialog">
                <template #header>
                    <div class="flex items-center gap-3">
                        <div class="flex items-center justify-center w-12 h-12 bg-indigo-100 rounded-lg">
                            <i class="pi pi-pencil text-indigo-600 text-2xl"></i>
                        </div>
                        <div>
                            <h3 class="text-xl font-bold text-gray-800 m-0">Editar Cuenta</h3>
                            <p class="text-sm text-gray-500 m-0">Actualizar información de la cuenta contable</p>
                        </div>
                    </div>
                </template>

                <div class="p-4">
                    <form id="formularioActualizarCuentas">
                        <div class="flex flex-col gap-4">
                            <div class="hidden">
                                <InputText v-model="datoscampos.id" readonly />
                            </div>

                            <Card class="bg-gray-50">
                                <template #content>
                                    <div class="flex flex-col gap-4">
                                        <div>
                                            <label for="nombre" class="block text-sm font-semibold text-gray-700 mb-2">
                                                <i class="pi pi-bookmark mr-1 text-indigo-600"></i>
                                                Nombre de la Cuenta
                                            </label>
                                            <InputText id="nombre" v-model="datoscampos.nombre" v-mayuscula placeholder="Ej: Caja General" fluid autofocus />
                                        </div>

                                        <div>
                                            <label for="categoria" class="block text-sm font-semibold text-gray-700 mb-2">
                                                <i class="pi pi-tag mr-1 text-indigo-600"></i>
                                                Categoría Contable
                                            </label>
                                            <Dropdown id="categoria" v-model="datoscampos.categoria" :options="['ACTIVOS','PASIVOS','PATRIMONIOS','INGRESOS','GASTOS','COSTOS']" placeholder="Seleccione una categoría" fluid />
                                        </div>

                                        <div>
                                            <label for="saldo" class="block text-sm font-semibold text-gray-700 mb-2">
                                                <i class="pi pi-dollar mr-1 text-indigo-600"></i>
                                                Saldo de la Cuenta
                                            </label>
                                            <InputNumber id="saldo" v-model="datoscampos.saldo" mode="currency" currency="USD" locale="en-US" placeholder="0.00" fluid />
                                        </div>
                                    </div>
                                </template>
                            </Card>
                        </div>
                    </form>
                </div>

                <template #footer>
                    <div class="flex gap-2 justify-end">
                        <Button label="Cancelar" icon="pi pi-times" outlined severity="secondary" @click="visible = false" />
                        <Button label="Guardar Cambios" icon="pi pi-check" severity="info" @click="funcionActualizar" />
                    </div>
                </template>
            </Dialog>


            <!-- Modal Crear -->
            <Dialog v-model:visible="visiblecrear" modal :style="{ width: '35rem' }" class="cuentas-dialog">
                <template #header>
                    <div class="flex items-center gap-3">
                        <div class="flex items-center justify-center w-12 h-12 bg-green-100 rounded-lg">
                            <i class="pi pi-plus-circle text-green-600 text-2xl"></i>
                        </div>
                        <div>
                            <h3 class="text-xl font-bold text-gray-800 m-0">Nueva Cuenta Contable</h3>
                            <p class="text-sm text-gray-500 m-0">Agregar cuenta al catálogo</p>
                        </div>
                    </div>
                </template>

                <div class="p-4">
                    <form id="formularioCrearCuentas">
                        <div class="flex flex-col gap-4">
                            <Card class="bg-gray-50">
                                <template #content>
                                    <div class="flex flex-col gap-4">
                                        <div>
                                            <label for="crearnombre" class="block text-sm font-semibold text-gray-700 mb-2">
                                                <i class="pi pi-bookmark mr-1 text-green-600"></i>
                                                Nombre de la Cuenta
                                            </label>
                                            <InputText id="crearnombre" v-model="datoscamposCuentas.nombre" v-mayuscula placeholder="Ej: Banco Popular" fluid autofocus />
                                        </div>

                                        <div>
                                            <label for="crearcategoria" class="block text-sm font-semibold text-gray-700 mb-2">
                                                <i class="pi pi-tag mr-1 text-green-600"></i>
                                                Categoría Contable
                                            </label>
                                            <Dropdown id="crearcategoria" v-model="datoscamposCuentas.categoria" :options="['ACTIVOS','PASIVOS','PATRIMONIOS','INGRESOS','GASTOS','COSTOS']" placeholder="Seleccione una categoría" fluid />
                                        </div>

                                        <div>
                                            <label for="crearsaldo" class="block text-sm font-semibold text-gray-700 mb-2">
                                                <i class="pi pi-dollar mr-1 text-green-600"></i>
                                                Saldo Inicial
                                            </label>
                                            <InputNumber id="crearsaldo" v-model="datoscamposCuentas.saldo" mode="currency" currency="USD" locale="en-US" placeholder="0.00" fluid />
                                        </div>
                                    </div>
                                </template>
                            </Card>
                        </div>
                    </form>
                </div>

                <template #footer>
                    <div class="flex gap-2 justify-end">
                        <Button label="Cancelar" icon="pi pi-times" outlined severity="secondary" @click="visiblecrear = false" />
                        <Button label="Crear Cuenta" icon="pi pi-check" severity="success" @click="funcionCrear" />
                    </div>
                </template>
            </Dialog>

            <Toast />
        </div>
    </main>
</template>

<style scoped>
/* Header Profesional de Cuentas */
.cuentas-header {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border-radius: 12px;
    padding: 2rem;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
}

.cuentas-header-content {
    display: flex;
    align-items: center;
    gap: 1.5rem;
}

.cuentas-icon-wrapper {
    width: 4rem;
    height: 4rem;
    background: rgba(255, 255, 255, 0.2);
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    backdrop-filter: blur(10px);
}

.cuentas-icon {
    font-size: 2rem;
    color: white;
}

.cuentas-title {
    font-size: 1.875rem;
    font-weight: 700;
    color: white;
    margin: 0;
    letter-spacing: -0.025em;
}

.cuentas-subtitle {
    font-size: 1rem;
    color: rgba(255, 255, 255, 0.9);
    margin: 0.25rem 0 0 0;
}

/* Tarjetas de Resumen */
.summary-card {
    border-radius: 12px;
    border: none;
    transition: all 0.3s ease;
    overflow: hidden;
    position: relative;
}

.summary-card::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
}

.activos-card::before {
    background: linear-gradient(90deg, #10b981, #059669);
}

.pasivos-card::before {
    background: linear-gradient(90deg, #f97316, #ea580c);
}

.patrimonio-card::before {
    background: linear-gradient(90deg, #3b82f6, #2563eb);
}

.total-card::before {
    background: linear-gradient(90deg, #8b5cf6, #7c3aed);
}

.summary-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 24px -10px rgba(0, 0, 0, 0.15);
}

.summary-card .p-card-content {
    padding: 1.5rem;
}

.summary-label {
    font-size: 0.75rem;
    font-weight: 600;
    color: #6b7280;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin: 0 0 0.5rem 0;
}

.summary-value {
    font-size: 1.875rem;
    font-weight: 700;
    color: #111827;
    margin: 0 0 0.25rem 0;
    font-family: 'Courier New', monospace;
}

.summary-count {
    font-size: 0.875rem;
    color: #9ca3af;
    margin: 0;
}

.summary-icon-wrapper {
    width: 3.5rem;
    height: 3.5rem;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
}

.summary-icon-wrapper.activos {
    background: linear-gradient(135deg, #d1fae5, #a7f3d0);
    color: #059669;
}

.summary-icon-wrapper.pasivos {
    background: linear-gradient(135deg, #fed7aa, #fdba74);
    color: #ea580c;
}

.summary-icon-wrapper.patrimonio {
    background: linear-gradient(135deg, #dbeafe, #bfdbfe);
    color: #2563eb;
}

.summary-icon-wrapper.total {
    background: linear-gradient(135deg, #e9d5ff, #d8b4fe);
    color: #7c3aed;
}

/* Tabla de Cuentas */
.cuentas-table-card {
    border-radius: 12px;
    border: 1px solid #e5e7eb;
}

.cuentas-table-card .p-card-content {
    padding: 1.5rem;
}

.cuentas-toolbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 1rem;
    padding-bottom: 1rem;
}

.cuentas-datatable :deep(.p-datatable-thead > tr > th) {
    background: linear-gradient(to bottom, #f9fafb, #f3f4f6);
    color: #374151;
    font-weight: 600;
    text-transform: uppercase;
    font-size: 0.75rem;
    letter-spacing: 0.05em;
    border-bottom: 2px solid #667eea;
}

.cuentas-datatable :deep(.p-datatable-tbody > tr:hover) {
    background-color: #f0f4ff !important;
    cursor: pointer;
}

.cuentas-datatable :deep(.p-datatable-tbody > tr) {
    transition: all 0.2s ease;
}

/* Modales */
.cuentas-dialog :deep(.p-dialog-header) {
    border-bottom: 1px solid #e5e7eb;
    padding: 1.5rem;
}

.cuentas-dialog :deep(.p-dialog-content) {
    padding: 0;
}

.cuentas-dialog :deep(.p-dialog-footer) {
    border-top: 1px solid #e5e7eb;
    padding: 1rem 1.5rem;
}

/* Animaciones */
@keyframes slideIn {
    from {
        opacity: 0;
        transform: translateY(10px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

.summary-card {
    animation: slideIn 0.3s ease-out;
}

/* Responsive */
@media (max-width: 768px) {
    .cuentas-header {
        padding: 1.5rem;
    }

    .cuentas-title {
        font-size: 1.5rem;
    }

    .cuentas-subtitle {
        font-size: 0.875rem;
    }

    .summary-value {
        font-size: 1.5rem;
    }

    .cuentas-toolbar {
        flex-direction: column;
        align-items: stretch;
    }
}
</style>

