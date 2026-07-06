<script setup>
import { ref, onMounted, nextTick, watchEffect, watch } from 'vue';
import { useToast } from "primevue/usetoast";
import { useRouter, useRoute } from 'vue-router';
const router = useRouter();
const route = useRoute();
import { enviarDatosPorPost, eliminarDatos, obtenerIdsSeleccionados, borrarTodoslosDatos, lenguajeDataTable, nfecha, arrayToObjetoFromTabla, peticionesFetch, encryptarPassword, envioElectron, generarCodigoUnico, peticiones, enviarDatosLocalStorage, mensajetoast, lasMayusculas, peticionesFetchOffline, arrayToObjetoFromTablaOffline, crearTablaSiNoExisteOffline } from '../../funciones/funciones.js';
import Swal from 'sweetalert2'
const toast = useToast();
import SelectButton from 'primevue/selectbutton';
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
const cuentasBanco = ref([]);
const cuentaLocal = ref('');
const transaccionesArray = ref([]);
const ultimaTransaccion = ref({});
/************************************************************************/
const datoscamposTransaccionesbancarias = ref({})
const codigoUnico = ref(generarCodigoUnico());
const fecha = ref(nfecha('fecha'));
const position = "top";
/************************************************************************/
const fetchAndSetupData = async () => {
    const jsonData = await arrayToObjetoFromTablaOffline('transaccionesbancarias');
    datoscamposTransaccionesbancarias.value = jsonData;
    datoscamposTransaccionesbancarias.value.tipo = 'DEPOSITO'
    datoscamposTransaccionesbancarias.value.fecha = nfecha('fecha')
    datoscamposTransaccionesbancarias.value.hora = nfecha('hora')
    datoscamposTransaccionesbancarias.value.estado = 'COMPLETADA'
    datoscamposTransaccionesbancarias.value.cuenta_origen = 'DEPOSITO'
    datoscamposTransaccionesbancarias.value.cuenta_destino = cuentasBanco.value[0].cuenta
    datoscamposTransaccionesbancarias.value.monto = '0.00'
    datoscamposTransaccionesbancarias.value.metodo = 'EFECTIVO'
    datoscamposTransaccionesbancarias.value.balance_anterior = parseFloat(ultimaTransaccion.value).toFixed(2)
    datoscamposTransaccionesbancarias.value.descripcion = 'DEPOSITO'
};
/************************************************************************/
const fetchCuentas = async () => {
    const response = await peticionesFetchOffline('getDataAsArray', 'banco');
    const jsonData = response;
    cuentasBanco.value = jsonData;
    cuentaLocal.value = jsonData[0].cuenta
};
/************************************************************************/
const fetchTransacciones = async () => {
    try {
        const response = await peticionesFetchOffline('getDataAsArray', 'transaccionesbancarias');

        const jsonData = response;

        // Check if jsonData is an array and has elements
        if (Array.isArray(jsonData) && jsonData.length > 0) {
            transaccionesArray.value = jsonData;
            ultimaTransaccion.value = jsonData[jsonData.length - 1].balance_actual || 0;
        } else {
            transaccionesArray.value = [];
            ultimaTransaccion.value = 0; // Handle the case where jsonData is empty
        }
    } catch (error) {
        console.error('Error fetching transactions:', error);
        transaccionesArray.value = [];
        ultimaTransaccion.value = 0; // Handle the error case
    }
};

/************************************************************************/
const usuarioLocal = ref({})
/************************************************************************/
onMounted(async () => {
    const datosJSON = await envioElectron('datosarchivo');
    link.value = datosJSON.VITE_LINKURL;
    api.value = datosJSON.VITE_LINK_API;
    token.value = datosJSON.VITE_TOKEN;
    patronTelefono.value = datosJSON.VITE_PATRON_TELEFONO;
    linkImpresora.value = datosJSON.VITE_IMPRESORA_LOCAL;
    patroncedula.value = datosJSON.VITE_PATRON_CEDULA;
    tokenCifrado.value = await encryptarPassword(token.value, 10);
    if (!datosEmpresa.empresa.nombre) {
        await datosEmpresa.inicializarDatosEmpresa(link.value + api.value);
    }
    usuarioLocal.value = JSON.parse(window.localStorage.getItem('usuarioLocal'))[0] || {}

    await fetchCuentas()
    await fetchTransacciones()
    await fetchAndSetupData()
    datoscamposTransaccionesbancarias.value.beneficiario = datosEmpresa.empresa.nombre
    datoscamposTransaccionesbancarias.value.depositante = usuarioLocal.value.nombre
});
/************************************************************************/
watch(() => datoscamposTransaccionesbancarias.value.monto, (newMonto) => {
    // const balanceAnterior = parseFloat(ultimaTransaccion.value) || 0;
    const balanceAnterior = parseFloat(datoscamposTransaccionesbancarias.value.balance_anterior) || 0;
    const monto = parseFloat(newMonto) || 0;

    if (datoscamposTransaccionesbancarias.value.tipo === 'RETIRO') {
        datoscamposTransaccionesbancarias.value.balance_actual = (balanceAnterior - monto).toFixed(2);
    } else {
        datoscamposTransaccionesbancarias.value.balance_actual = (balanceAnterior + monto).toFixed(2);
    }
});

/************************************************************************/
async function enviarDatos(event) {
    event.preventDefault();
    const url = link.value + api.value + "/insertar/transaccionesbancarias";
    if (!datoscamposTransaccionesbancarias.value) {
        toast.add({ severity: 'error', summary: 'Error', detail: 'Datos incompletos, no se puede Enviar.', life: 3000 });
        return;
    }
    if (datoscamposTransaccionesbancarias.value.hasOwnProperty('created_at')) {
        datoscamposTransaccionesbancarias.value.created_at = nfecha('timestamp')
        datoscamposTransaccionesbancarias.value.updated_at = nfecha('timestamp')
    }

    const datosBanco = cuentasBanco.value.find(cuenta => cuenta.cuenta === cuentaLocal.value);


    const envioDatos = await peticionesFetchOffline('insertData', 'transaccionesbancarias', JSON.stringify(datoscamposTransaccionesbancarias.value));
    if (envioDatos[0] == 'ok') {
        toast.add({ severity: 'success', summary: 'Éxito', detail: 'Datos Agregados con éxito.', life: 3000 });


        const datos = {
            datos: datoscamposTransaccionesbancarias.value
        }


        const datosEmpresa = JSON.stringify(enviarDatosLocalStorage())
        window.electron.ipcRenderer.invoke('recibotransferencia', JSON.stringify(datos), datosEmpresa);


        const urlBanco = link.value + api.value + "/actualizarcampos/banco";
        if (!datosBanco) {
            console.error("Datos incompletos, no se puede actualizar.");
            return;
        }
        if (datosBanco.hasOwnProperty('created_at')) {
            datosBanco.updated_at = nfecha('timestamp');

            datosBanco.saldo = datoscamposTransaccionesbancarias.value.balance_actual
        }
        const envioDatosBanco = await enviarDatosPorPost(urlBanco, datosBanco, tokenCifrado.value);

        await fetchCuentas()
        await fetchTransacciones()
        await fetchAndSetupData()

        Swal.fire({
            title: "Datos Agregados",
            text: "Que hacemos ahora?",
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Agregar Otro!",
            cancelButtonText: "No, Regresar al Inicio!",
        }).then(async (result) => {
            if (result.isConfirmed) {
                fetchAndSetupData()
            } else if (result.dismiss === Swal.DismissReason.cancel) {
                router.push({ path: `/transaccionesbancarias` });
            }
        })
    } else {
        toast.add({ severity: 'error', summary: 'Error', detail: 'Fallo al Agregar los datos.', life: 3000 });
    }
}
/************************************************************************/
const options = ref(['DEPOSITO',
    'RETIRO',
    'TRANSFERENCIA',
    'OTRO']);
/************************************************************************/
const fnTipoTransaccion = () => {
    if (datoscamposTransaccionesbancarias.value.tipo === 'DEPOSITO') {
        datoscamposTransaccionesbancarias.value.metodo = 'EFECTIVO'
        datoscamposTransaccionesbancarias.value.cuenta_origen = 'DEPOSITO'
        datoscamposTransaccionesbancarias.value.depositante = usuarioLocal.value.usuario
        datoscamposTransaccionesbancarias.value.beneficiario = datosEmpresa.empresa.nombre
        datoscamposTransaccionesbancarias.value.cuenta_destino = cuentaLocal.value
        datoscamposTransaccionesbancarias.value.descripcion = 'DEPOSITO'

        const balanceAnterior = parseFloat(datoscamposTransaccionesbancarias.value.balance_anterior) || 0;
        const monto = parseFloat(datoscamposTransaccionesbancarias.value.monto) || 0;
        datoscamposTransaccionesbancarias.value.balance_actual = (balanceAnterior + monto).toFixed(2);

    } else if (datoscamposTransaccionesbancarias.value.tipo === 'TRANSFERENCIA') {
        datoscamposTransaccionesbancarias.value.metodo = 'TRANSFERENCIA'
        datoscamposTransaccionesbancarias.value.cuenta_origen = cuentaLocal.value
        datoscamposTransaccionesbancarias.value.cuenta_destino = 'CUENTA DESTINO'
        datoscamposTransaccionesbancarias.value.descripcion = 'TRANSFERENCIA'
        const balanceAnterior = parseFloat(datoscamposTransaccionesbancarias.value.balance_anterior) || 0;
        const monto = parseFloat(datoscamposTransaccionesbancarias.value.monto) || 0;
        datoscamposTransaccionesbancarias.value.balance_actual = (balanceAnterior + monto).toFixed(2);


    } else if (datoscamposTransaccionesbancarias.value.tipo === 'RETIRO') {
        datoscamposTransaccionesbancarias.value.metodo = 'TRANSFERENCIA'
        datoscamposTransaccionesbancarias.value.cuenta_origen = cuentaLocal.value
        datoscamposTransaccionesbancarias.value.cuenta_destino = 'CUENTA DESTINO'
        datoscamposTransaccionesbancarias.value.depositante = datosEmpresa.empresa.nombre
        datoscamposTransaccionesbancarias.value.beneficiario = 'BENEFICIARIO'
        datoscamposTransaccionesbancarias.value.descripcion = 'RETIRO'
        const balanceAnterior = parseFloat(datoscamposTransaccionesbancarias.value.balance_anterior) || 0;
        const monto = parseFloat(datoscamposTransaccionesbancarias.value.monto) || 0;
        datoscamposTransaccionesbancarias.value.balance_actual = (balanceAnterior - monto).toFixed(2);
    }


}
/************************************************************************/
const fnRouter = (ruta) => {
    router.push(ruta);
};
/************************************************************************/
const fnCambiarBanco = () => {

    const datosBanco = cuentasBanco.value.find(cuenta => cuenta.cuenta === cuentaLocal.value);

    if (datoscamposTransaccionesbancarias.value.tipo === 'RETIRO') {
        datoscamposTransaccionesbancarias.value.cuenta_origen = datosBanco.cuenta
        datoscamposTransaccionesbancarias.value.balance_anterior = datosBanco.saldo
        datoscamposTransaccionesbancarias.value.balance_actual = datosBanco.saldo
        datoscamposTransaccionesbancarias.value.cuenta_destino = 'DESTINO'

    } else {
        datoscamposTransaccionesbancarias.value.cuenta_origen = 'ORIGEN'
        datoscamposTransaccionesbancarias.value.cuenta_destino = datosBanco.cuenta
        datoscamposTransaccionesbancarias.value.balance_anterior = datosBanco.saldo
        datoscamposTransaccionesbancarias.value.balance_actual = datosBanco.saldo

    }
}
/************************************************************************/
</script>
<template>
    <main class="crear-transaccion-wrapper">
        <div class="container-crear-transaccion mx-auto px-4 py-6">

            <!-- Header Section -->
            <div class="header-section mb-6">
                <div class="flex items-center justify-between">
                    <div class="flex items-center gap-4">
                        <div class="header-icon">
                            <i class="pi pi-plus-circle"></i>
                        </div>
                        <div>
                            <h1 class="text-3xl font-bold text-gray-800">Nueva Transacción Bancaria</h1>
                            <p class="text-gray-600">Registra depósitos, retiros y transferencias</p>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Navigation Card -->
            <Card class="nav-card mb-6">
                <template #content>
                    <div class="flex flex-wrap gap-3">
                        <Button icon="pi pi-list" label="Ver Transacciones" @click="router.push('/transaccionesbancarias')"
                            severity="secondary" class="nav-btn" />
                        <Button icon="pi pi-building" label="Ver Bancos" @click="router.push('/banco')" severity="info"
                            class="nav-btn" />
                    </div>
                </template>
            </Card>

            <!-- Main Form Card -->
            <Card class="form-card">
                <template #header>
                    <div class="card-header-custom">
                        <i class="pi pi-cog text-xl mr-3"></i>
                        <h2 class="text-xl font-bold">Configuración de Transacción</h2>
                    </div>
                </template>

                <template #content>
                    <form @submit="enviarDatos">
                        <div class="space-y-6">

                            <!-- Tipo de Transacción y Cuenta -->
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div class="form-field-modern">
                                    <label class="field-label-modern">
                                        <i class="pi pi-tag mr-2"></i>
                                        Tipo de Transacción
                                    </label>
                                    <SelectButton v-model="datoscamposTransaccionesbancarias.tipo"
                                        @change="fnTipoTransaccion" :options="options" :allowEmpty="false"
                                        class="select-button-modern" />
                                </div>

                                <div class="form-field-modern">
                                    <label class="field-label-modern">
                                        <i class="pi pi-building mr-2"></i>
                                        Cuenta Local
                                    </label>
                                    <Dropdown v-model="cuentaLocal" @change="fnCambiarBanco" :options="cuentasBanco"
                                        optionLabel="nombre" optionValue="cuenta" placeholder="Seleccione cuenta"
                                        class="modern-dropdown-trans w-full" />
                                </div>
                            </div>

                            <!-- Cuentas Origen y Destino -->
                            <div class="section-divider">
                                <i class="pi pi-wallet mr-2"></i>
                                Cuentas
                            </div>

                            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                <div class="form-field-modern md:col-span-1">
                                    <label class="field-label-modern">
                                        <i class="pi pi-sign-out mr-2 text-blue-600"></i>
                                        Cuenta Origen
                                    </label>
                                    <InputText v-model="datoscamposTransaccionesbancarias.cuenta_origen" v-solonumeros
                                        class="modern-input-trans w-full" placeholder="Cuenta origen" />
                                </div>

                                <div class="form-field-modern md:col-span-1">
                                    <label class="field-label-modern">
                                        <i class="pi pi-sign-in mr-2 text-purple-600"></i>
                                        Cuenta Destino
                                    </label>
                                    <InputText v-model="datoscamposTransaccionesbancarias.cuenta_destino" v-solonumeros
                                        class="modern-input-trans w-full" placeholder="Cuenta destino" />
                                </div>

                                <div class="form-field-modern">
                                    <label class="field-label-modern">
                                        <i class="pi pi-dollar mr-2 text-green-600"></i>
                                        Monto
                                    </label>
                                    <InputText v-model="datoscamposTransaccionesbancarias.monto" v-solonumeros
                                        v-numeroFocusinOut v-decimales class="modern-input-trans w-full monto-input"
                                        placeholder="0.00" />
                                </div>
                            </div>

                            <!-- Balances -->
                            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div class="balance-card balance-anterior">
                                    <div class="balance-icon">
                                        <i class="pi pi-chart-line"></i>
                                    </div>
                                    <div>
                                        <div class="balance-label">Balance Anterior</div>
                                        <div class="balance-value">${{
                                            parseFloat(datoscamposTransaccionesbancarias.balance_anterior ||
                                                0).toFixed(2) }}</div>
                                    </div>
                                </div>

                                <div class="balance-card balance-actual">
                                    <div class="balance-icon">
                                        <i class="pi pi-chart-bar"></i>
                                    </div>
                                    <div>
                                        <div class="balance-label">Balance Actual</div>
                                        <div class="balance-value">${{
                                            parseFloat(datoscamposTransaccionesbancarias.balance_actual ||
                                                0).toFixed(2) }}</div>
                                    </div>
                                </div>

                                <div class="form-field-modern">
                                    <label class="field-label-modern">
                                        <i class="pi pi-credit-card mr-2"></i>
                                        Método de Pago
                                    </label>
                                    <Dropdown v-model="datoscamposTransaccionesbancarias.metodo"
                                        :options="['TRANSFERENCIA', 'EFECTIVO', 'CHEQUE', 'OTRO']"
                                        placeholder="Seleccione método" class="modern-dropdown-trans w-full" />
                                </div>
                            </div>

                            <!-- Descripción -->
                            <div class="form-field-modern">
                                <label class="field-label-modern">
                                    <i class="pi pi-align-left mr-2"></i>
                                    Descripción
                                </label>
                                <Textarea v-model="datoscamposTransaccionesbancarias.descripcion" rows="3"
                                    class="modern-textarea-trans w-full" placeholder="Descripción de la transacción" />
                            </div>

                            <!-- Personas -->
                            <div class="section-divider">
                                <i class="pi pi-users mr-2"></i>
                                Personas Involucradas
                            </div>

                            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div class="form-field-modern">
                                    <label class="field-label-modern">
                                        <i class="pi pi-user mr-2 text-blue-600"></i>
                                        Depositante
                                    </label>
                                    <InputText v-model="datoscamposTransaccionesbancarias.depositante" v-mayuscula
                                        class="modern-input-trans w-full" placeholder="Persona depositante" />
                                </div>

                                <div class="form-field-modern">
                                    <label class="field-label-modern">
                                        <i class="pi pi-user mr-2 text-purple-600"></i>
                                        Beneficiario
                                    </label>
                                    <InputText v-model="datoscamposTransaccionesbancarias.beneficiario" v-mayuscula
                                        class="modern-input-trans w-full" placeholder="Persona beneficiaria" />
                                </div>
                            </div>

                            <!-- Fecha, Hora y Estado -->
                            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div class="form-field-modern">
                                    <label class="field-label-modern">
                                        <i class="pi pi-calendar mr-2"></i>
                                        Fecha
                                    </label>
                                    <InputText v-model="datoscamposTransaccionesbancarias.fecha" v-datepicker
                                        class="modern-input-trans w-full" placeholder="Fecha" />
                                </div>

                                <div class="form-field-modern">
                                    <label class="field-label-modern">
                                        <i class="pi pi-clock mr-2"></i>
                                        Hora
                                    </label>
                                    <InputText v-model="datoscamposTransaccionesbancarias.hora"
                                        class="modern-input-trans w-full" placeholder="Hora" readonly />
                                </div>

                                <div class="form-field-modern">
                                    <label class="field-label-modern">
                                        <i class="pi pi-info-circle mr-2"></i>
                                        Estado
                                    </label>
                                    <Dropdown v-model="datoscamposTransaccionesbancarias.estado"
                                        :options="['COMPLETADA', 'PENDIENTE', 'FALLIDA', 'OTRO']"
                                        placeholder="Seleccione estado" class="modern-dropdown-trans w-full" />
                                </div>
                            </div>

                            <!-- Submit Button -->
                            <div class="flex justify-center pt-6">
                                <Button type="submit" label="Registrar Transacción" icon="pi pi-check" size="large"
                                    class="submit-btn" />
                            </div>

                        </div>
                    </form>
                </template>
            </Card>

        </div>
        <Toast />
    </main>
</template>

<style scoped>
/* ===================================
   CREAR TRANSACCION STYLES
   =================================== */

.crear-transaccion-wrapper {
    min-height: calc(100vh - 80px);
    background: linear-gradient(135deg, rgba(243, 244, 246, 1) 0%, rgba(249, 250, 251, 1) 100%);
}

.container-crear-transaccion {
    max-width: 1400px;
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
    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 2.5rem;
    color: white;
    box-shadow: 0 8px 20px rgba(16, 185, 129, 0.3);
}

/* Navigation Card */
.nav-card {
    background: white;
    border-radius: 16px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
    border: 1px solid rgba(229, 231, 235, 0.8);
    animation: slideIn 0.5s ease-out;
}

.nav-btn {
    font-weight: 600;
    border-radius: 10px;
    transition: all 0.3s ease;
}

.nav-btn:hover {
    transform: translateY(-2px);
}

/* Form Card */
.form-card {
    background: white;
    border-radius: 16px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
    border: 1px solid rgba(229, 231, 235, 0.8);
    animation: slideIn 0.6s ease-out;
}

.form-card :deep(.p-card-body) {
    padding: 0;
}

.form-card :deep(.p-card-content) {
    padding: 2rem;
}

.card-header-custom {
    padding: 1.5rem 2rem;
    background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%);
    border-radius: 16px 16px 0 0;
    display: flex;
    align-items: center;
    color: #374151;
    font-weight: 600;
}

/* Form Fields */
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

.modern-input-trans {
    border: 2px solid #e5e7eb;
    border-radius: 10px;
    padding: 0.75rem;
    font-size: 0.95rem;
    transition: all 0.3s ease;
}

.modern-input-trans:focus {
    border-color: #10b981;
    box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1);
    outline: none;
}

.monto-input {
    font-weight: 700;
    font-size: 1.2rem;
    color: #10b981;
}

.modern-dropdown-trans :deep(.p-dropdown) {
    border: 2px solid #e5e7eb;
    border-radius: 10px;
    transition: all 0.3s ease;
}

.modern-dropdown-trans :deep(.p-dropdown:focus) {
    border-color: #10b981;
    box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1);
}

.modern-textarea-trans {
    border: 2px solid #e5e7eb;
    border-radius: 10px;
    padding: 0.75rem;
    font-size: 0.95rem;
    transition: all 0.3s ease;
    resize: vertical;
}

.modern-textarea-trans:focus {
    border-color: #10b981;
    box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1);
    outline: none;
}

/* Select Button */
.select-button-modern :deep(.p-selectbutton) {
    display: flex;
    gap: 0.5rem;
}

.select-button-modern :deep(.p-button) {
    border-radius: 8px;
    font-weight: 600;
    transition: all 0.3s ease;
}

.select-button-modern :deep(.p-highlight) {
    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
    border-color: #10b981;
}

/* Section Divider */
.section-divider {
    font-weight: 700;
    font-size: 1.1rem;
    color: #374151;
    padding: 1rem 0 0.5rem 0;
    border-bottom: 2px solid #e5e7eb;
    margin-top: 1rem;
    display: flex;
    align-items: center;
}

/* Balance Cards */
.balance-card {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1.25rem;
    border-radius: 12px;
    border: 2px solid;
    transition: all 0.3s ease;
}

.balance-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.balance-anterior {
    border-color: #6b7280;
    background: linear-gradient(135deg, rgba(107, 114, 128, 0.05) 0%, rgba(75, 85, 99, 0.02) 100%);
}

.balance-actual {
    border-color: #10b981;
    background: linear-gradient(135deg, rgba(16, 185, 129, 0.05) 0%, rgba(5, 150, 105, 0.02) 100%);
}

.balance-icon {
    width: 50px;
    height: 50px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.5rem;
    flex-shrink: 0;
}

.balance-anterior .balance-icon {
    background: linear-gradient(135deg, #6b7280 0%, #4b5563 100%);
    color: white;
}

.balance-actual .balance-icon {
    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
    color: white;
}

.balance-label {
    font-size: 0.75rem;
    font-weight: 600;
    color: #6b7280;
    margin-bottom: 0.25rem;
}

.balance-value {
    font-size: 1.5rem;
    font-weight: 800;
    color: #1f2937;
}

/* Submit Button */
.submit-btn {
    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
    border: none;
    padding: 1rem 3rem;
    font-weight: 700;
    font-size: 1.1rem;
    border-radius: 12px;
    box-shadow: 0 4px 16px rgba(16, 185, 129, 0.3);
    transition: all 0.3s ease;
}

.submit-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(16, 185, 129, 0.4);
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

    .balance-value {
        font-size: 1.25rem;
    }

    .submit-btn {
        width: 100%;
    }
}
</style>
