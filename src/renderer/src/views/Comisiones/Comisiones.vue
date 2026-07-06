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
const camposArray = ["numero_comprobante", "banco", "cuenta_banco", "tipo_comision", "monto", "fecha", "periodo", "descripcion", "estado", "usuario"];
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
const datoscamposComisiones = ref({})
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
const tipoSeleccionado = ref(null);
/************************************************************************/
const tiposComision = ref(['CHEQUE', 'TRANSFERENCIA', 'MANTENIMIENTO', 'CERTIFICACION', 'CHEQUERA', 'ESTADO DE CUENTA', 'OTRO']);
const estadosOpciones = ref(['PENDIENTE', 'REGISTRADA']);
/************************************************************************/
async function limpiarCamposCrear() {
    datoscamposComisiones.value = {}
    await campos();
    datoscamposComisiones.value.estado = 'PENDIENTE';
    datoscamposComisiones.value.fecha = nfecha('fecha');
    datoscamposComisiones.value.usuario = usuarioLocal.value.usuario || '';
}
/************************************************************************/
watchEffect(() => {
    if (visiblecrear.value) {
    }
});
/************************************************************************/
const fetchAndSetupData = async () => {
    const response = await peticionesFetchOffline('getDataAsArray', 'comisionesbancarias');
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
    const campos = await arrayToObjetoFromTablaOffline('comisionesbancarias');
    datoscamposComisiones.value = campos;
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
    await crearTablaSiNoExisteOffline('comisionesbancarias', camposArray.join(','), toast);
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
                    const envioDatos = await peticionesFetchOffline('deleteAll', 'comisionesbancarias');
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
    if (!datoscampos.value) {
        console.error("Datos incompletos, no se puede actualizar.");
        return;
    }
    if (datoscampos.value.hasOwnProperty('created_at')) {
        datoscampos.value.updated_at = nfecha('timestamp');
    }
    const envioDatos = await peticionesFetchOffline('updateData', 'comisionesbancarias', JSON.stringify(datoscampos.value));
    if (envioDatos[0] == 'ok') {
        visible.value = false;
        fetchAndSetupData();
        toast.add({ severity: 'success', summary: 'Éxito', detail: 'Comisión Actualizada', life: 3000 });
    } else {
        toast.add({ severity: 'error', summary: 'Error', detail: 'Fallo al actualizar la comisión.', life: 3000 });
    }
}
/************************************************************************/
async function funcionCrear() {
    // Validaciones
    if (!datoscamposComisiones.value.banco) {
        toast.add({ severity: 'warn', summary: 'Atención', detail: 'Seleccione el banco', life: 3000 });
        return;
    }
    if (!datoscamposComisiones.value.tipo_comision) {
        toast.add({ severity: 'warn', summary: 'Atención', detail: 'Seleccione el tipo de comisión', life: 3000 });
        return;
    }
    if (!datoscamposComisiones.value.monto || parseFloat(datoscamposComisiones.value.monto) <= 0) {
        toast.add({ severity: 'warn', summary: 'Atención', detail: 'Ingrese un monto válido', life: 3000 });
        return;
    }
    if (!datoscamposComisiones.value.descripcion) {
        toast.add({ severity: 'warn', summary: 'Atención', detail: 'Ingrese una descripción', life: 3000 });
        return;
    }

    if (datoscamposComisiones.value.hasOwnProperty('created_at')) {
        datoscamposComisiones.value.created_at = nfecha('timestamp');
        datoscamposComisiones.value.updated_at = nfecha('timestamp');
    }
    datoscamposComisiones.value.usuario = usuarioLocal.value.usuario || '';

    const envioDatos = await peticionesFetchOffline('insertData', 'comisionesbancarias', JSON.stringify(datoscamposComisiones.value));
    if (envioDatos[0] == 'ok') {
        fetchAndSetupData();
        toast.add({ severity: 'success', summary: 'Éxito', detail: 'Comisión Registrada', life: 3000 });
        limpiarCamposCrear();
        visiblecrear.value = false;
    } else {
        toast.add({ severity: 'error', summary: 'Error', detail: 'Fallo al registrar la comisión.', life: 3000 });
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
                                const envioDatos = await peticionesFetchOffline('deleteEntry', 'comisionesbancarias', id);
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
/* REGISTRAR COMISIÓN: DEBITA DEL BANCO Y CREA TRANSACCIÓN */
/************************************************************************/
async function registrarComision(comision) {
    const bancoEncontrado = bancos.value.find(b => b.nombre === comision.banco);
    if (!bancoEncontrado) {
        toast.add({ severity: 'error', summary: 'Error', detail: 'No se encontró el banco asociado', life: 3000 });
        return;
    }

    const montoComision = parseFloat(comision.monto) || 0;
    const saldoAnterior = parseFloat(bancoEncontrado.saldo) || 0;
    const nuevoSaldo = (saldoAnterior - montoComision).toFixed(2);

    // Actualizar saldo del banco
    const bancoActualizado = { ...bancoEncontrado };
    if (bancoActualizado.hasOwnProperty('created_at')) {
        bancoActualizado.updated_at = nfecha('timestamp');
    }
    bancoActualizado.saldo = nuevoSaldo;
    const envioBanco = await peticionesFetchOffline('updateData', 'banco', JSON.stringify(bancoActualizado));
    if (envioBanco[0] != 'ok') {
        toast.add({ severity: 'error', summary: 'Error', detail: 'Fallo al actualizar saldo del banco', life: 3000 });
        return;
    }

    // Registrar transacción bancaria
    const camposTransaccion = await arrayToObjetoFromTablaOffline('transaccionesbancarias');
    camposTransaccion.tipo = 'RETIRO';
    camposTransaccion.metodo = 'COMISION';
    camposTransaccion.cuenta_origen = bancoEncontrado.cuenta;
    camposTransaccion.cuenta_destino = '';
    camposTransaccion.monto = montoComision.toFixed(2);
    camposTransaccion.balance_anterior = saldoAnterior.toFixed(2);
    camposTransaccion.balance_actual = nuevoSaldo;
    camposTransaccion.descripcion = `Comisión bancaria ${comision.tipo_comision} - ${comision.descripcion}${comision.numero_comprobante ? ' | Comp. #' + comision.numero_comprobante : ''}`;
    camposTransaccion.depositante = '';
    camposTransaccion.beneficiario = comision.banco;
    camposTransaccion.fecha = nfecha('fecha');
    camposTransaccion.hora = nfecha('hora');
    camposTransaccion.estado = 'COMPLETADA';
    camposTransaccion.usuario = usuarioLocal.value.usuario || '';
    if (camposTransaccion.hasOwnProperty('created_at')) {
        camposTransaccion.created_at = nfecha('timestamp');
        camposTransaccion.updated_at = nfecha('timestamp');
    }
    await peticionesFetchOffline('insertData', 'transaccionesbancarias', JSON.stringify(camposTransaccion));

    // Actualizar estado de la comisión a REGISTRADA
    const comisionActualizada = { ...comision };
    comisionActualizada.estado = 'REGISTRADA';
    if (comisionActualizada.hasOwnProperty('created_at')) {
        comisionActualizada.updated_at = nfecha('timestamp');
    }
    const envioComision = await peticionesFetchOffline('updateData', 'comisionesbancarias', JSON.stringify(comisionActualizada));
    if (envioComision[0] == 'ok') {
        await fetchAndSetupData();
        await fetchBancos();
        toast.add({ severity: 'success', summary: 'Éxito', detail: `Comisión registrada. Se debitaron $${montoComision.toFixed(2)} del banco ${comision.banco}`, life: 4000 });
    } else {
        toast.add({ severity: 'error', summary: 'Error', detail: 'Fallo al actualizar estado de la comisión', life: 3000 });
    }
}
/************************************************************************/
const itemsComisiones = ref([]);
const menu = ref(null);
const currentRowData = ref(null);
const toggleComisiones = (event, rowData) => {
    currentRowData.value = rowData;
    itemsComisiones.value = [
        {
            label: 'Editar', icon: 'pi pi-pencil', command: () => {
                datoscampos.value = { ...currentRowData.value };
                visible.value = true;
            }
        },
        {
            separator: true
        },
        {
            label: 'Registrar (Debitar del banco)', icon: 'pi pi-check-circle',
            visible: currentRowData.value.estado === 'PENDIENTE',
            command: () => {
                Swal.fire({
                    title: '¿Registrar comisión?',
                    html: `
                        <p style="margin-bottom:8px;">Se debitarán <b>$${parseFloat(currentRowData.value.monto).toFixed(2)}</b> del banco <b>${currentRowData.value.banco}</b></p>
                        <p style="color:#6b7280;font-size:0.9em;">${currentRowData.value.tipo_comision} - ${currentRowData.value.descripcion}</p>
                    `,
                    icon: 'question',
                    showCancelButton: true,
                    confirmButtonText: 'Sí, registrar',
                    cancelButtonText: 'Cancelar',
                    confirmButtonColor: '#10b981'
                }).then(async (result) => {
                    if (result.isConfirmed) {
                        await registrarComision(currentRowData.value);
                    }
                });
            }
        },
        {
            separator: true
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
                            const datosEliminar = await peticionesFetchOffline('deleteEntry', 'comisionesbancarias', rowData.id);
                            if (datosEliminar[0] == 'ok') {
                                toast.add({ severity: 'success', summary: 'Éxito', detail: 'Comisión eliminada correctamente', life: 3000 });
                                await fetchAndSetupData()
                            } else {
                                toast.add({ severity: 'error', summary: 'Error', detail: 'Error al eliminar la comisión', life: 3000 });
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
const filteredComisiones = computed(() => {
    let resultado = data.value;

    // Filtrar por banco seleccionado
    if (bancoSeleccionado.value) {
        resultado = resultado.filter(c => c.banco === bancoSeleccionado.value.nombre);
    }

    // Filtrar por tipo de comisión
    if (tipoSeleccionado.value) {
        resultado = resultado.filter(c => c.tipo_comision === tipoSeleccionado.value);
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
// Función para auto-rellenar cuenta al seleccionar banco
const onBancoSelect = (bancoNombre) => {
    const banco = bancos.value.find(b => b.nombre === bancoNombre);
    if (banco) {
        datoscamposComisiones.value.cuenta_banco = banco.cuenta;
    }
};
/************************************************************************/
const getRowClass = (data) => {
    if (data.estado === 'REGISTRADA') return 'row-registrada';
    return '';
};
/************************************************************************/
// Estadísticas
const totalComisiones = computed(() => {
    return filteredComisiones.value
        .reduce((sum, c) => sum + parseFloat(c.monto || 0), 0)
        .toFixed(2);
});

const totalRegistradas = computed(() => {
    return filteredComisiones.value
        .filter(c => c.estado === 'REGISTRADA')
        .reduce((sum, c) => sum + parseFloat(c.monto || 0), 0)
        .toFixed(2);
});

const totalPendientes = computed(() => {
    return filteredComisiones.value
        .filter(c => c.estado === 'PENDIENTE')
        .reduce((sum, c) => sum + parseFloat(c.monto || 0), 0)
        .toFixed(2);
});

const cantidadComisiones = computed(() => {
    return filteredComisiones.value.length;
});
/************************************************************************/
const getEstadoSeverity = (estado) => {
    switch (estado) {
        case 'PENDIENTE': return 'warn';
        case 'REGISTRADA': return 'success';
        default: return 'info';
    }
};
/************************************************************************/
const getTipoIcon = (tipo) => {
    switch (tipo) {
        case 'CHEQUE': return 'pi pi-file-edit';
        case 'TRANSFERENCIA': return 'pi pi-arrows-h';
        case 'MANTENIMIENTO': return 'pi pi-cog';
        case 'CERTIFICACION': return 'pi pi-verified';
        case 'CHEQUERA': return 'pi pi-book';
        case 'ESTADO DE CUENTA': return 'pi pi-list';
        default: return 'pi pi-circle';
    }
};
/************************************************************************/
</script>
<template>
    <main class="comisiones-wrapper">
        <div class="container-comisiones mx-auto px-4 py-6">

            <!-- Header Section -->
            <div class="header-section mb-6">
                <div class="flex items-center justify-between">
                    <div class="flex items-center gap-4">
                        <div class="header-icon">
                            <i class="pi pi-percentage"></i>
                        </div>
                        <div>
                            <h1 class="text-3xl font-bold text-gray-800">Comisiones Bancarias</h1>
                            <p class="text-gray-600">Registro de comisiones cobradas por los bancos</p>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Stats Cards -->
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                <div class="stat-card stat-total">
                    <div class="stat-icon">
                        <i class="pi pi-percentage"></i>
                    </div>
                    <div class="stat-content">
                        <div class="stat-label">Total Comisiones</div>
                        <div class="stat-value">${{ totalComisiones }}</div>
                        <div class="stat-sublabel">Monto total</div>
                    </div>
                </div>

                <div class="stat-card stat-registradas">
                    <div class="stat-icon">
                        <i class="pi pi-check-circle"></i>
                    </div>
                    <div class="stat-content">
                        <div class="stat-label">Registradas</div>
                        <div class="stat-value">${{ totalRegistradas }}</div>
                        <div class="stat-sublabel">Debitadas del banco</div>
                    </div>
                </div>

                <div class="stat-card stat-pendientes">
                    <div class="stat-icon">
                        <i class="pi pi-clock"></i>
                    </div>
                    <div class="stat-content">
                        <div class="stat-label">Pendientes</div>
                        <div class="stat-value">${{ totalPendientes }}</div>
                        <div class="stat-sublabel">Por registrar</div>
                    </div>
                </div>

                <div class="stat-card stat-cantidad">
                    <div class="stat-icon">
                        <i class="pi pi-list"></i>
                    </div>
                    <div class="stat-content">
                        <div class="stat-label">Cantidad</div>
                        <div class="stat-value">{{ cantidadComisiones }}</div>
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
                            <Button icon="pi pi-plus" label="Nueva Comisión"
                                @click="limpiarCamposCrear(); visiblecrear = true" severity="success"
                                class="action-btn" />
                            <Button icon="pi pi-trash" label="Borrar Selección" @click="borrarSeleccionados"
                                severity="danger" outlined class="action-btn" />
                        </div>

                        <div class="flex flex-wrap gap-2">
                            <Button icon="pi pi-building" label="Ver Bancos" @click="router.push('/banco')"
                                severity="info" class="action-btn" />
                            <Button icon="pi pi-arrows-h" label="Transacciones" @click="router.push('/transaccionesbancarias')"
                                severity="secondary" class="action-btn" />
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
                            <Select v-model="tipoSeleccionado" :options="tiposComision"
                                placeholder="Filtrar por tipo" showClear class="tipo-filter" />
                        </div>
                        <IconField iconPosition="left">
                            <InputIcon class="pi pi-search" />
                            <InputText v-model="searchQuery" placeholder="Buscar comisiones..."
                                class="search-input" />
                        </IconField>
                    </div>

                    <DataTable :value="filteredComisiones" scrollable scrollHeight="600px" dataKey="id"
                        paginator :rows="10" :rowClass="getRowClass" v-model:selection="selectedItems"
                        selectionMode="multiple" :rowsPerPageOptions="[5, 10, 20, 50]" class="modern-datatable">

                        <Column selectionMode="multiple" headerStyle="width: 3rem"></Column>

                        <Column header="Opciones" frozen :style="{ width: '100px' }">
                            <template #body="slotProps">
                                <Button icon="pi pi-cog" @click="toggleComisiones($event, slotProps.data)"
                                    severity="secondary" size="small" rounded />
                                <Menu ref="menu" :model="itemsComisiones" :popup="true" />
                            </template>
                        </Column>

                        <Column field="numero_comprobante" header="Comprobante" :style="{ minWidth: '140px' }">
                            <template #body="slotProps">
                                <div class="flex items-center gap-2" v-if="slotProps.data.numero_comprobante">
                                    <i class="pi pi-file text-orange-600"></i>
                                    <span class="font-bold">{{ slotProps.data.numero_comprobante }}</span>
                                </div>
                                <span v-else class="text-gray-400">Sin comprobante</span>
                            </template>
                        </Column>

                        <Column field="banco" header="Banco" :style="{ minWidth: '160px' }">
                            <template #body="slotProps">
                                <div class="banco-cell">
                                    <i class="pi pi-building mr-2 text-blue-600"></i>
                                    {{ slotProps.data.banco }}
                                </div>
                            </template>
                        </Column>

                        <Column field="cuenta_banco" header="Cuenta" :style="{ minWidth: '150px' }">
                            <template #body="slotProps">
                                <div class="cuenta-cell">
                                    <i class="pi pi-wallet mr-2 text-purple-600"></i>
                                    {{ slotProps.data.cuenta_banco }}
                                </div>
                            </template>
                        </Column>

                        <Column field="tipo_comision" header="Tipo" :style="{ minWidth: '160px' }">
                            <template #body="slotProps">
                                <Tag :value="slotProps.data.tipo_comision" severity="info" :icon="getTipoIcon(slotProps.data.tipo_comision)" />
                            </template>
                        </Column>

                        <Column field="monto" header="Monto" :style="{ minWidth: '140px' }">
                            <template #body="slotProps">
                                <div class="monto-badge">
                                    <i class="pi pi-dollar mr-2"></i>
                                    ${{ parseFloat(slotProps.data.monto).toFixed(2) }}
                                </div>
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

                        <Column field="periodo" header="Periodo" :style="{ minWidth: '130px' }">
                            <template #body="slotProps">
                                <span v-if="slotProps.data.periodo" class="font-semibold text-gray-700">{{ slotProps.data.periodo }}</span>
                                <span v-else class="text-gray-400">---</span>
                            </template>
                        </Column>

                        <Column field="descripcion" header="Descripción" :style="{ minWidth: '200px' }">
                            <template #body="slotProps">
                                <div class="descripcion-cell">
                                    {{ slotProps.data.descripcion || 'Sin descripción' }}
                                </div>
                            </template>
                        </Column>

                        <Column field="estado" header="Estado" :style="{ minWidth: '130px' }">
                            <template #body="slotProps">
                                <Tag :value="slotProps.data.estado" :severity="getEstadoSeverity(slotProps.data.estado)" />
                            </template>
                        </Column>

                        <Column field="usuario" header="Usuario" :style="{ minWidth: '120px' }">
                            <template #body="slotProps">
                                <span class="text-gray-600">{{ slotProps.data.usuario }}</span>
                            </template>
                        </Column>

                    </DataTable>
                </template>
            </Card>

        </div>

        <!-- Dialog Crear Comisión -->
        <Dialog v-model:visible="visiblecrear" :style="{ width: '650px' }" header="Nueva Comisión Bancaria" :modal="true" class="p-fluid">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div class="form-field-modern">
                    <label class="field-label-modern"><i class="pi pi-file mr-2"></i>No. Comprobante</label>
                    <InputText v-model="datoscamposComisiones.numero_comprobante" placeholder="Número del comprobante bancario" />
                </div>
                <div class="form-field-modern">
                    <label class="field-label-modern"><i class="pi pi-building mr-2"></i>Banco</label>
                    <Select v-model="datoscamposComisiones.banco" :options="bancos.map(b => b.nombre)"
                        placeholder="Seleccione banco" @change="onBancoSelect(datoscamposComisiones.banco)" />
                </div>
                <div class="form-field-modern">
                    <label class="field-label-modern"><i class="pi pi-wallet mr-2"></i>Cuenta Banco</label>
                    <InputText v-model="datoscamposComisiones.cuenta_banco" placeholder="Cuenta del banco" />
                </div>
                <div class="form-field-modern">
                    <label class="field-label-modern"><i class="pi pi-tag mr-2"></i>Tipo de Comisión</label>
                    <Select v-model="datoscamposComisiones.tipo_comision" :options="tiposComision" placeholder="Tipo de comisión" />
                </div>
                <div class="form-field-modern">
                    <label class="field-label-modern"><i class="pi pi-dollar mr-2"></i>Monto</label>
                    <InputText v-model="datoscamposComisiones.monto" v-solonumeros v-decimales v-numeroFocusinOut placeholder="0.00" />
                </div>
                <div class="form-field-modern">
                    <label class="field-label-modern"><i class="pi pi-calendar mr-2"></i>Fecha</label>
                    <InputText v-model="datoscamposComisiones.fecha" v-datepicker placeholder="Fecha de la comisión" />
                </div>
                <div class="form-field-modern">
                    <label class="field-label-modern"><i class="pi pi-calendar-plus mr-2"></i>Periodo</label>
                    <InputText v-model="datoscamposComisiones.periodo" placeholder="Ej: Enero 2026, Q1 2026" />
                </div>
                <div class="form-field-modern">
                    <label class="field-label-modern"><i class="pi pi-info-circle mr-2"></i>Estado</label>
                    <Select v-model="datoscamposComisiones.estado" :options="estadosOpciones" placeholder="Estado" />
                </div>
                <div class="form-field-modern md:col-span-2">
                    <label class="field-label-modern"><i class="pi pi-align-left mr-2"></i>Descripción</label>
                    <Textarea v-model="datoscamposComisiones.descripcion" rows="2" placeholder="Descripción de la comisión cobrada por el banco" />
                </div>
            </div>
            <template #footer>
                <Button label="Cancelar" icon="pi pi-times" @click="visiblecrear = false" severity="secondary" outlined />
                <Button label="Registrar Comisión" icon="pi pi-check" @click="funcionCrear" severity="success" />
            </template>
        </Dialog>

        <!-- Dialog Editar Comisión -->
        <Dialog v-model:visible="visible" :style="{ width: '650px' }" header="Editar Comisión" :modal="true" class="p-fluid">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div class="form-field-modern">
                    <label class="field-label-modern"><i class="pi pi-file mr-2"></i>No. Comprobante</label>
                    <InputText v-model="datoscampos.numero_comprobante" placeholder="Número del comprobante" />
                </div>
                <div class="form-field-modern">
                    <label class="field-label-modern"><i class="pi pi-building mr-2"></i>Banco</label>
                    <Select v-model="datoscampos.banco" :options="bancos.map(b => b.nombre)" placeholder="Seleccione banco" />
                </div>
                <div class="form-field-modern">
                    <label class="field-label-modern"><i class="pi pi-wallet mr-2"></i>Cuenta Banco</label>
                    <InputText v-model="datoscampos.cuenta_banco" placeholder="Cuenta del banco" />
                </div>
                <div class="form-field-modern">
                    <label class="field-label-modern"><i class="pi pi-tag mr-2"></i>Tipo de Comisión</label>
                    <Select v-model="datoscampos.tipo_comision" :options="tiposComision" placeholder="Tipo de comisión" />
                </div>
                <div class="form-field-modern">
                    <label class="field-label-modern"><i class="pi pi-dollar mr-2"></i>Monto</label>
                    <InputText v-model="datoscampos.monto" v-solonumeros v-decimales v-numeroFocusinOut placeholder="0.00" />
                </div>
                <div class="form-field-modern">
                    <label class="field-label-modern"><i class="pi pi-calendar mr-2"></i>Fecha</label>
                    <InputText v-model="datoscampos.fecha" v-datepicker placeholder="Fecha" />
                </div>
                <div class="form-field-modern">
                    <label class="field-label-modern"><i class="pi pi-calendar-plus mr-2"></i>Periodo</label>
                    <InputText v-model="datoscampos.periodo" placeholder="Ej: Enero 2026" />
                </div>
                <div class="form-field-modern">
                    <label class="field-label-modern"><i class="pi pi-info-circle mr-2"></i>Estado</label>
                    <Select v-model="datoscampos.estado" :options="estadosOpciones" placeholder="Estado" />
                </div>
                <div class="form-field-modern md:col-span-2">
                    <label class="field-label-modern"><i class="pi pi-align-left mr-2"></i>Descripción</label>
                    <Textarea v-model="datoscampos.descripcion" rows="2" placeholder="Descripción de la comisión" />
                </div>
            </div>
            <template #footer>
                <Button label="Cancelar" icon="pi pi-times" @click="visible = false" severity="secondary" outlined />
                <Button label="Guardar Cambios" icon="pi pi-save" @click="funcionActualizar" severity="primary" />
            </template>
        </Dialog>

        <Toast />
    </main>
</template>

<style scoped>
/* ===================================
   COMISIONES BANCARIAS STYLES
   =================================== */

.comisiones-wrapper {
    min-height: calc(100vh - 80px);
    background: linear-gradient(135deg, rgba(243, 244, 246, 1) 0%, rgba(249, 250, 251, 1) 100%);
}

.container-comisiones {
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
    background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 2.5rem;
    color: white;
    box-shadow: 0 8px 20px rgba(245, 158, 11, 0.3);
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

.stat-total {
    border-color: #f59e0b;
    background: linear-gradient(135deg, rgba(245, 158, 11, 0.05) 0%, rgba(217, 119, 6, 0.02) 100%);
}

.stat-registradas {
    border-color: #10b981;
    background: linear-gradient(135deg, rgba(16, 185, 129, 0.05) 0%, rgba(5, 150, 105, 0.02) 100%);
}

.stat-pendientes {
    border-color: #ef4444;
    background: linear-gradient(135deg, rgba(239, 68, 68, 0.05) 0%, rgba(220, 38, 38, 0.02) 100%);
}

.stat-cantidad {
    border-color: #6366f1;
    background: linear-gradient(135deg, rgba(99, 102, 241, 0.05) 0%, rgba(79, 70, 229, 0.02) 100%);
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

.stat-total .stat-icon {
    background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
    color: white;
}

.stat-registradas .stat-icon {
    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
    color: white;
}

.stat-pendientes .stat-icon {
    background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
    color: white;
}

.stat-cantidad .stat-icon {
    background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
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
    border-color: #f59e0b;
    box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.1);
}

.banco-filter,
.tipo-filter {
    min-width: 200px;
    border: 2px solid #e5e7eb;
    border-radius: 10px;
    transition: all 0.3s ease;
}

.banco-filter:hover,
.tipo-filter:hover {
    border-color: #f59e0b;
}

:deep(.banco-filter .p-select-label),
:deep(.tipo-filter .p-select-label) {
    padding: 0.75rem 1rem;
}

.modern-datatable :deep(.p-datatable-thead>tr>th) {
    background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
    color: white;
    font-weight: 700;
    padding: 1rem;
    border: none;
}

.modern-datatable :deep(.p-datatable-tbody>tr) {
    transition: all 0.2s ease;
}

.modern-datatable :deep(.p-datatable-tbody>tr:hover) {
    background: rgba(245, 158, 11, 0.05);
}

/* Row Colors */
:deep(.row-registrada) {
    background: rgba(16, 185, 129, 0.03) !important;
    border-left: 4px solid #10b981;
}

/* Custom Badges */
.monto-badge {
    display: inline-flex;
    align-items: center;
    padding: 0.5rem 1rem;
    border-radius: 8px;
    font-weight: 700;
    font-size: 1.1rem;
    border: 2px solid #ef4444;
    background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);
    color: #991b1b;
}

.banco-cell,
.cuenta-cell {
    display: flex;
    align-items: center;
    font-weight: 600;
    color: #374151;
}

.descripcion-cell {
    font-size: 0.875rem;
    color: #6b7280;
    font-style: italic;
}

.fecha-cell {
    display: flex;
    align-items: center;
    font-weight: 500;
    color: #6b7280;
}

/* Form fields */
.form-field-modern {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.field-label-modern {
    font-weight: 600;
    color: #374151;
    font-size: 0.875rem;
    display: flex;
    align-items: center;
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
