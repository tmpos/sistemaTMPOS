<script setup>
import { ref, onMounted, nextTick, watchEffect, computed, watch } from 'vue';
import axios from 'axios';
import { enviarDatosPorPost, eliminarDatos, obtenerIdsSeleccionados, borrarTodoslosDatos, lenguajeDataTable, nfecha, arrayToObjetoFromTabla, peticionesFetch, encryptarPassword, envioElectron, mensajetoast, crearTablaSiNoExiste, peticiones, lasMayusculas, peticionesFetchOffline, arrayToObjetoFromTablaOffline, crearTablaSiNoExisteOffline } from '../../funciones/funciones.js';
import Swal from 'sweetalert2'
import { useToast } from "primevue/usetoast";
const toast = useToast();
import { useRouter, useRoute } from 'vue-router';
const router = useRouter();
const route = useRoute();
/************************************************************************/
/************************************************************************/
const usuarioLocal = ref({})
/************************************************************************/
const camposArray = ["nombre", "saldo","tipo", "cuenta", "usuario"];
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
const datoscamposBanco = ref({})
/************************************************************************/
const visible = ref(false);
const visiblecrear = ref(false);
const value = ref(null);
const id = ref(null);
const datoscampos = ref({});
const data = ref([]);
const searchQuery = ref('');
const BancoEditar = ref(null);
/************************************************************************/
// Variables para modal de transacción
const visibleTransaccion = ref(false);
const bancoTransaccion = ref(null);
const clientes = ref([]);
const tiposTransaccion = ref([
    { label: 'Depósito a la cuenta', value: 'DEPOSITO', icon: 'pi pi-arrow-down' },
    { label: 'Retiro desde la cuenta', value: 'RETIRO', icon: 'pi pi-arrow-up' },
    { label: 'Transferencia hacia la cuenta', value: 'TRANSFERENCIA_ENTRADA', icon: 'pi pi-arrow-left' },
    { label: 'Transferencia desde la cuenta', value: 'TRANSFERENCIA_SALIDA', icon: 'pi pi-arrow-right' },
    { label: 'Transferencia a otro banco', value: 'TRANSFERENCIA_ENTRE_BANCOS', icon: 'pi pi-building' }
]);
const bancoDestino = ref(null);
const datosTransaccion = ref({
    tipo: null,
    monto: '',
    descripcion: '',
    cliente: null,
    metodo: 'EFECTIVO'
});
const metodosOptions = ref(['EFECTIVO', 'TRANSFERENCIA', 'CHEQUE', 'OTRO']);
const tiposMoneda = ref(['DOP', 'USD', 'EURO']);
// Variables para tasa de cambio
const tasaCambio = ref('');
// Variables para cuenta destino manual
const usarCuentaManual = ref(false);
const cuentaManual = ref({
    nombre: '',
    cuenta: ''
});
/************************************************************************/
async function limpiarCamposCrear() {
    datoscamposBanco.value = {}
    await campos();
}
/************************************************************************/
watchEffect(() => {
    if (visiblecrear.value) {
    }
});
/************************************************************************/
const fetchAndSetupData = async () => {
    const response = await peticionesFetchOffline('getDataAsArray', 'banco');
    const jsonData = response;
    data.value = jsonData;
};
/************************************************************************/
const fetchClientes = async () => {
    const response = await peticionesFetchOffline('getDataAsArray', 'clientes');
    // Agregar "Área de Venta" como primera opción
    clientes.value = [
        { nombre: 'ÁREA DE VENTA', id: 'area_venta' },
        ...(response || [])
    ];
};
/************************************************************************/
async function campos() {
    const campos = await arrayToObjetoFromTablaOffline('banco');
    datoscamposBanco.value = campos;
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
    await crearTablaSiNoExisteOffline('banco', camposArray.join(','), toast);
    usuarioLocal.value = JSON.parse(window.localStorage.getItem('usuarioLocal'))[0] || {};
    await campos();
    await fetchAndSetupData();
    await fetchClientes();
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
                    const envioDatos = await peticionesFetchOffline('deleteAll', 'banco');
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
    const url = link.value + api.value + "/actualizarcampos/banco";
    if (!datoscampos.value) {
        console.error("Datos incompletos, no se puede actualizar.");
        return;
    }
    if (datoscampos.value.hasOwnProperty('created_at')) {
        datoscampos.value.updated_at = nfecha('timestamp');
    }
    const envioDatos = await peticionesFetchOffline('updateData', 'banco', JSON.stringify(datoscampos.value));
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
    const url = link.value + api.value + "/insertar/banco";
    if (datoscamposBanco.value.hasOwnProperty('created_at')) {
        datoscamposBanco.value.created_at = nfecha('timestamp');
        datoscamposBanco.value.updated_at = nfecha('timestamp');
    }
    const envioDatos = await peticionesFetchOffline('insertData', 'banco', JSON.stringify(datoscamposBanco.value));
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
                                const envioDatos = await peticionesFetchOffline('deleteEntry', 'banco', id);
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
const itemsBanco = ref([]);
const menu = ref(null);
const currentRowData = ref(null);
const toggleBanco = (event, rowData) => {
    currentRowData.value = rowData;
    itemsBanco.value = [
        {
            label: 'Realizar Transacción', icon: 'pi pi-money-bill', command: () => {
                abrirModalTransaccion(currentRowData.value);
            }
        },
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
                            const datosFactura = await peticionesFetchOffline('deleteEntry', 'banco', rowData.id);
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
// Funciones para modal de transacción
const abrirModalTransaccion = (banco) => {
    bancoTransaccion.value = banco;
    datosTransaccion.value = {
        tipo: null,
        monto: '',
        descripcion: '',
        cliente: null,
        metodo: 'EFECTIVO'
    };
    visibleTransaccion.value = true;
};

const limpiarModalTransaccion = () => {
    datosTransaccion.value = {
        tipo: null,
        monto: '',
        descripcion: '',
        cliente: null,
        metodo: 'EFECTIVO'
    };
    usarCuentaManual.value = false;
    cuentaManual.value = { nombre: '', cuenta: '' };
    bancoDestino.value = null;
    tasaCambio.value = '';
    bancoTransaccion.value = null;
    visibleTransaccion.value = false;
};

const guardarTransaccion = async () => {
    // Validaciones
    if (!datosTransaccion.value.tipo) {
        toast.add({ severity: 'warn', summary: 'Atención', detail: 'Seleccione el tipo de transacción', life: 3000 });
        return;
    }
    if (!datosTransaccion.value.monto || parseFloat(datosTransaccion.value.monto) <= 0) {
        toast.add({ severity: 'warn', summary: 'Atención', detail: 'Ingrese un monto válido', life: 3000 });
        return;
    }
    // Validar cliente según tipo de transacción
    if (datosTransaccion.value.tipo.value === 'TRANSFERENCIA_ENTRADA' && !datosTransaccion.value.cliente) {
        toast.add({ severity: 'warn', summary: 'Atención', detail: 'Seleccione quién realiza la transferencia', life: 3000 });
        return;
    }
    if (datosTransaccion.value.tipo.value === 'TRANSFERENCIA_SALIDA') {
        if (usarCuentaManual.value) {
            if (!cuentaManual.value.nombre || !cuentaManual.value.cuenta) {
                toast.add({ severity: 'warn', summary: 'Atención', detail: 'Complete el nombre y número de cuenta destino', life: 3000 });
                return;
            }
        } else if (!datosTransaccion.value.cliente) {
            toast.add({ severity: 'warn', summary: 'Atención', detail: 'Seleccione a quién se transfiere o agregue una cuenta manual', life: 3000 });
            return;
        }
    }
    if (datosTransaccion.value.tipo.value === 'TRANSFERENCIA_ENTRE_BANCOS' && !bancoDestino.value) {
        toast.add({ severity: 'warn', summary: 'Atención', detail: 'Seleccione el banco destino', life: 3000 });
        return;
    }
    // Validar tasa de cambio si hay conversión de moneda
    if (necesitaConversion.value && (!tasaCambio.value || parseFloat(tasaCambio.value) <= 0)) {
        toast.add({ severity: 'warn', summary: 'Atención', detail: 'Ingrese la tasa de cambio', life: 3000 });
        return;
    }

    const monto = parseFloat(datosTransaccion.value.monto);
    const balanceAnterior = parseFloat(bancoTransaccion.value.saldo);
    let balanceActual = balanceAnterior;
    let tipoTransaccion = '';
    let depositante = '';
    let beneficiario = '';
    let cuentaOrigen = '';
    let cuentaDestino = '';

    // Calcular nuevo balance y asignar cuentas según tipo
    switch (datosTransaccion.value.tipo.value) {
        case 'DEPOSITO':
            balanceActual = balanceAnterior + monto;
            tipoTransaccion = 'DEPOSITO';
            depositante = datosTransaccion.value.cliente?.nombre || usuarioLocal.value.usuario || '';
            cuentaOrigen = depositante; // Quien deposita
            cuentaDestino = bancoTransaccion.value.cuenta; // Cuenta del banco
            break;
        case 'RETIRO':
            if (monto > balanceAnterior) {
                toast.add({ severity: 'error', summary: 'Error', detail: 'Saldo insuficiente para realizar el retiro', life: 3000 });
                return;
            }
            balanceActual = balanceAnterior - monto;
            tipoTransaccion = 'RETIRO';
            beneficiario = usuarioLocal.value.usuario || '';
            cuentaOrigen = bancoTransaccion.value.cuenta; // Cuenta del banco
            cuentaDestino = beneficiario; // Quien retira
            break;
        case 'TRANSFERENCIA_ENTRADA':
            // Transferencia hacia la cuenta del banco
            balanceActual = balanceAnterior + monto;
            tipoTransaccion = 'TRANSFERENCIA';
            depositante = datosTransaccion.value.cliente?.nombre || '';
            cuentaOrigen = depositante; // Cliente o área de venta que transfiere
            cuentaDestino = bancoTransaccion.value.cuenta; // Cuenta del banco recibe
            // Agregar comentario si es desde área de venta
            if (datosTransaccion.value.cliente?.id === 'area_venta') {
                const comentarioBase = datosTransaccion.value.descripcion?.trim() || '';
                datosTransaccion.value.descripcion = comentarioBase
                    ? `Transferencia desde el área de venta. ${comentarioBase}`
                    : 'Transferencia desde el área de venta';
            }
            break;
        case 'TRANSFERENCIA_SALIDA':
            // Transferencia desde la cuenta del banco
            if (monto > balanceAnterior) {
                toast.add({ severity: 'error', summary: 'Error', detail: 'Saldo insuficiente para realizar la transferencia', life: 3000 });
                return;
            }
            balanceActual = balanceAnterior - monto;
            tipoTransaccion = 'TRANSFERENCIA';
            // Usar cuenta manual o cliente seleccionado
            if (usarCuentaManual.value) {
                beneficiario = cuentaManual.value.nombre;
                cuentaDestino = `${cuentaManual.value.nombre} - ${cuentaManual.value.cuenta}`;
            } else {
                beneficiario = datosTransaccion.value.cliente?.nombre || '';
                cuentaDestino = beneficiario;
            }
            cuentaOrigen = bancoTransaccion.value.cuenta; // Cuenta del banco envía
            break;
        case 'TRANSFERENCIA_ENTRE_BANCOS':
            // Transferencia entre bancos propios
            if (monto > balanceAnterior) {
                toast.add({ severity: 'error', summary: 'Error', detail: 'Saldo insuficiente para realizar la transferencia', life: 3000 });
                return;
            }
            balanceActual = balanceAnterior - monto;
            tipoTransaccion = 'TRANSFERENCIA';
            cuentaOrigen = `${bancoTransaccion.value.nombre} - ${bancoTransaccion.value.cuenta}`;
            cuentaDestino = `${bancoDestino.value.nombre} - ${bancoDestino.value.cuenta}`;
            beneficiario = bancoDestino.value.nombre;
            // Agregar descripción automática con info de conversión si aplica
            const descBase = datosTransaccion.value.descripcion?.trim() || '';
            let descripcionAuto = `Transferencia de ${bancoTransaccion.value.nombre} a ${bancoDestino.value.nombre}`;
            if (necesitaConversion.value) {
                const montoRecibido = montoConvertido.value.toFixed(2);
                descripcionAuto += `. Tasa: ${tasaCambio.value}, Enviado: ${monto.toFixed(2)} ${bancoTransaccion.value.tipo}, Recibido: ${montoRecibido} ${bancoDestino.value.tipo}`;
            }
            datosTransaccion.value.descripcion = descBase
                ? `${descripcionAuto}. ${descBase}`
                : descripcionAuto;
            break;
    }

    // Crear objeto de transacción
    const nuevaTransaccion = {
        cuenta_origen: cuentaOrigen,
        cuenta_destino: cuentaDestino,
        monto: monto.toFixed(2),
        tipo: tipoTransaccion,
        balance_anterior: balanceAnterior.toFixed(2),
        balance_actual: balanceActual.toFixed(2),
        metodo: datosTransaccion.value.metodo,
        descripcion: datosTransaccion.value.descripcion || '',
        depositante: depositante,
        beneficiario: beneficiario,
        fecha: nfecha('fecha'),
        hora: nfecha('hora'),
        estado: 'COMPLETADA',
        usuario: usuarioLocal.value.usuario || ''
    };

    try {
        // Guardar transacción
        const envioTransaccion = await peticionesFetchOffline('insertData', 'transaccionesbancarias', JSON.stringify(nuevaTransaccion));

        if (envioTransaccion[0] === 'ok') {
            // Actualizar saldo del banco origen
            const bancoActualizado = { ...bancoTransaccion.value };
            bancoActualizado.saldo = balanceActual.toFixed(2);
            bancoActualizado.updated_at = nfecha('timestamp');

            const envioBanco = await peticionesFetchOffline('updateData', 'banco', JSON.stringify(bancoActualizado));

            if (envioBanco[0] === 'ok') {
                // Si es transferencia entre bancos, actualizar también el banco destino
                if (datosTransaccion.value.tipo.value === 'TRANSFERENCIA_ENTRE_BANCOS' && bancoDestino.value) {
                    const bancoDestinoActualizado = { ...bancoDestino.value };
                    // Usar monto convertido si hay conversión de moneda, sino usar monto original
                    const montoARecibir = necesitaConversion.value ? montoConvertido.value : monto;
                    const saldoDestinoActual = parseFloat(bancoDestino.value.saldo) + montoARecibir;
                    bancoDestinoActualizado.saldo = saldoDestinoActual.toFixed(2);
                    bancoDestinoActualizado.updated_at = nfecha('timestamp');

                    const envioBancoDestino = await peticionesFetchOffline('updateData', 'banco', JSON.stringify(bancoDestinoActualizado));

                    if (envioBancoDestino[0] === 'ok') {
                        const mensajeExito = necesitaConversion.value
                            ? `Transferencia realizada. ${monto.toFixed(2)} ${bancoTransaccion.value.tipo} → ${montoARecibir.toFixed(2)} ${bancoDestino.value.tipo}`
                            : 'Transferencia entre bancos realizada correctamente';
                        toast.add({ severity: 'success', summary: 'Éxito', detail: mensajeExito, life: 4000 });
                    } else {
                        toast.add({ severity: 'warn', summary: 'Advertencia', detail: 'Transacción guardada pero hubo un error al actualizar el banco destino', life: 5000 });
                    }
                } else {
                    toast.add({ severity: 'success', summary: 'Éxito', detail: 'Transacción realizada correctamente', life: 3000 });
                }
                await fetchAndSetupData();
                limpiarModalTransaccion();
            } else {
                toast.add({ severity: 'error', summary: 'Error', detail: 'Error al actualizar el saldo del banco', life: 3000 });
            }
        } else {
            toast.add({ severity: 'error', summary: 'Error', detail: 'Error al guardar la transacción', life: 3000 });
        }
    } catch (error) {
        console.error('Error al guardar transacción:', error);
        toast.add({ severity: 'error', summary: 'Error', detail: 'Error al procesar la transacción', life: 3000 });
    }
};

// Computed para mostrar/ocultar selector de cliente
const mostrarSelectorCliente = computed(() => {
    return datosTransaccion.value.tipo?.value === 'TRANSFERENCIA_ENTRADA' ||
           datosTransaccion.value.tipo?.value === 'TRANSFERENCIA_SALIDA' ||
           datosTransaccion.value.tipo?.value === 'DEPOSITO';
});

const labelCliente = computed(() => {
    switch (datosTransaccion.value.tipo?.value) {
        case 'TRANSFERENCIA_ENTRADA':
            return '¿Quién realiza la transferencia?';
        case 'TRANSFERENCIA_SALIDA':
            return '¿A quién se transfiere?';
        case 'DEPOSITO':
            return '¿Quién realiza el depósito?';
        default:
            return 'Seleccione';
    }
});

// Computed para bancos disponibles (excluyendo el banco actual)
const bancosDisponibles = computed(() => {
    if (!bancoTransaccion.value) return data.value;
    return data.value.filter(banco => banco.id !== bancoTransaccion.value.id);
});

// Computed para detectar si necesita conversión de moneda
const necesitaConversion = computed(() => {
    if (datosTransaccion.value.tipo?.value !== 'TRANSFERENCIA_ENTRE_BANCOS') return false;
    if (!bancoTransaccion.value || !bancoDestino.value) return false;
    return bancoTransaccion.value.tipo !== bancoDestino.value.tipo;
});

// Computed para calcular el monto convertido
const montoConvertido = computed(() => {
    if (!necesitaConversion.value || !tasaCambio.value || !datosTransaccion.value.monto) return 0;
    const monto = parseFloat(datosTransaccion.value.monto) || 0;
    const tasa = parseFloat(tasaCambio.value) || 0;

    const tipoOrigen = bancoTransaccion.value?.tipo;
    const tipoDestino = bancoDestino.value?.tipo;

    // Si origen es USD/EURO y destino es DOP, multiplicar
    if ((tipoOrigen === 'USD' || tipoOrigen === 'EURO') && tipoDestino === 'DOP') {
        return monto * tasa;
    }
    // Si origen es DOP y destino es USD/EURO, dividir
    if (tipoOrigen === 'DOP' && (tipoDestino === 'USD' || tipoDestino === 'EURO')) {
        return tasa > 0 ? monto / tasa : 0;
    }
    // Si es USD a EURO o viceversa, multiplicar por la tasa
    return monto * tasa;
});

// Texto descriptivo de la conversión
const textoConversion = computed(() => {
    if (!necesitaConversion.value) return '';
    const tipoOrigen = bancoTransaccion.value?.tipo;
    const tipoDestino = bancoDestino.value?.tipo;

    if ((tipoOrigen === 'USD' || tipoOrigen === 'EURO') && tipoDestino === 'DOP') {
        return `Tasa de cambio (1 ${tipoOrigen} = ? DOP)`;
    }
    if (tipoOrigen === 'DOP' && (tipoDestino === 'USD' || tipoDestino === 'EURO')) {
        return `Tasa de cambio (1 ${tipoDestino} = ? DOP)`;
    }
    return `Tasa de cambio (1 ${tipoOrigen} = ? ${tipoDestino})`;
});

// Watcher para cambiar método automáticamente según tipo de transacción
watch(() => datosTransaccion.value.tipo, (nuevoTipo) => {
    if (nuevoTipo?.value === 'TRANSFERENCIA_ENTRADA' || nuevoTipo?.value === 'TRANSFERENCIA_SALIDA' || nuevoTipo?.value === 'TRANSFERENCIA_ENTRE_BANCOS') {
        datosTransaccion.value.metodo = 'TRANSFERENCIA';
    }
    // Resetear cuenta manual, banco destino y tasa de cambio al cambiar tipo
    usarCuentaManual.value = false;
    cuentaManual.value = { nombre: '', cuenta: '' };
    datosTransaccion.value.cliente = null;
    bancoDestino.value = null;
    tasaCambio.value = '';
});

// Watcher para resetear tasa de cambio cuando cambie el banco destino
watch(() => bancoDestino.value, () => {
    tasaCambio.value = '';
});
/************************************************************************/
const filteredBanco = computed(() => {
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
const fnRouter = (ruta) => {
    router.push(ruta);
};
/************************************************************************/
// Calcular el saldo total
const totalSaldo = computed(() => {
    return data.value.reduce((sum, banco) => sum + parseFloat(banco.saldo || 0), 0).toFixed(2);
});

const totalCuentas = computed(() => {
    return data.value.length;
});
/************************************************************************/
</script>
<template>
    <main class="banco-wrapper">
        <div class="container-banco mx-auto px-4 py-6">

            <!-- Header Section -->
            <div class="header-section mb-6">
                <div class="flex items-center justify-between">
                    <div class="flex items-center gap-4">
                        <div class="header-icon">
                            <i class="pi pi-building"></i>
                        </div>
                        <div>
                            <h1 class="text-3xl font-bold text-gray-800">Gestión de Bancos</h1>
                            <p class="text-gray-600">Administra tus cuentas bancarias y transacciones</p>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Stats Cards -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div class="stat-card stat-saldo">
                    <div class="stat-icon">
                        <i class="pi pi-dollar"></i>
                    </div>
                    <div class="stat-content">
                        <div class="stat-label">Saldo Total</div>
                        <div class="stat-value">${{ totalSaldo }}</div>
                        <div class="stat-sublabel">En todas las cuentas</div>
                    </div>
                </div>

                <div class="stat-card stat-cuentas">
                    <div class="stat-icon">
                        <i class="pi pi-building"></i>
                    </div>
                    <div class="stat-content">
                        <div class="stat-label">Cuentas Bancarias</div>
                        <div class="stat-value">{{ totalCuentas }}</div>
                        <div class="stat-sublabel">Cuentas registradas</div>
                    </div>
                </div>
            </div>

            <!-- Actions Card -->
            <Card class="actions-card mb-6">
                <template #content>
                    <div class="flex flex-wrap gap-3 justify-between items-center">
                        <div class="flex flex-wrap gap-2">
                            <Button icon="pi pi-refresh" label="Recargar" @click="fetchAndSetupData"
                                severity="warning" outlined class="action-btn" />
                            <Button icon="pi pi-plus" label="Agregar Banco" @click="visiblecrear = true"
                                severity="success" class="action-btn" />
                            <Button icon="pi pi-trash" label="Borrar Selección" @click="borrarSeleccionados"
                                severity="danger" outlined class="action-btn" />
                        </div>

                        <div class="flex flex-wrap gap-2">
                            <Button icon="pi pi-list" label="Transacciones" @click="fnRouter('/transaccionesbancarias')"
                                severity="secondary" class="action-btn" />
                            <Button icon="pi pi-file-edit" label="Cheques" @click="fnRouter('/cheques')"
                                severity="help" class="action-btn" />
                            <Button icon="pi pi-calculator" label="Conciliaciones" @click="fnRouter('/conciliaciones')"
                                severity="contrast" class="action-btn" />
                            <Button icon="pi pi-money-bill" label="Comisiones" @click="fnRouter('/comisionesbancarias')"
                                severity="warn" class="action-btn" />
                            <Button icon="pi pi-plus-circle" label="Dep/Tran/Ret"
                                @click="fnRouter('/creartransaccionesbancarias')" severity="info" class="action-btn" />
                            <Button v-if="usuarioLocal.usuario == 'Soporte'" icon="pi pi-trash" label="Borrar Todo"
                                @click="borrarTodo" severity="danger" class="action-btn" />
                        </div>
                    </div>
                </template>
            </Card>

            <!-- Table Card -->
            <Card class="table-card">
                <template #content>
                    <div class="flex justify-end mb-4">
                        <IconField iconPosition="left">
                            <InputIcon class="pi pi-search" />
                            <InputText v-model="searchQuery" placeholder="Buscar bancos..." class="search-input" />
                        </IconField>
                    </div>

                    <DataTable :value="filteredBanco" scrollable scrollHeight="600px" dataKey="id" paginator :rows="10"
                        v-model:selection="selectedItems" selectionMode="single" :rowsPerPageOptions="[5, 10, 20, 50]"
                        class="modern-datatable">
                        <Column header="Opciones" frozen :style="{ width: '100px' }">
                            <template #body="slotProps">
                                <Button icon="pi pi-cog" @click="toggleBanco($event, slotProps.data)"
                                    severity="secondary" size="small" rounded />
                                <Menu ref="menu" :model="itemsBanco" :popup="true" />
                            </template>
                        </Column>
                        <Column selectionMode="multiple" headerStyle="width: 3rem"></Column>
                        <Column field="nombre" header="Nombre Banco" :style="{ minWidth: '250px' }">
                            <template #body="slotProps">
                                <div class="flex items-center gap-2">
                                    <i class="pi pi-building text-blue-600"></i>
                                    <span class="font-semibold">{{ slotProps.data.nombre }}</span>
                                </div>
                            </template>
                        </Column>
                       <Column field="tipo" header="Tipo" :style="{ minWidth: '250px' }">
                            <template #body="slotProps">
                                <div class="flex items-center gap-2">
                                    <i class="pi pi-building text-blue-600"></i>
                                    <span class="font-semibold">{{ slotProps.data.tipo }}</span>
                                </div>
                            </template>
                        </Column>
                        <Column field="cuenta" header="Número Cuenta" :style="{ minWidth: '200px' }">
                            <template #body="slotProps">
                                <div class="cuenta-badge">
                                    <i class="pi pi-credit-card mr-2"></i>
                                    {{ slotProps.data.cuenta }}
                                </div>
                            </template>
                        </Column>
                        <Column field="saldo" header="Saldo" :style="{ minWidth: '150px' }">
                            <template #body="slotProps">
                                <div class="saldo-badge">
                                    <i class="pi pi-dollar mr-2"></i>
                                    ${{ parseFloat(slotProps.data.saldo).toFixed(2) }}
                                </div>
                            </template>
                        </Column>
                    </DataTable>
                </template>
            </Card>

        </div>

        <!-- Modal: Editar Banco -->
        <Dialog v-model:visible="visible" modal header="Modificar Banco" :style="{ width: '40rem' }">
            <template #header>
                <div class="flex items-center gap-3">
                    <i class="pi pi-pencil text-2xl text-blue-600"></i>
                    <div>
                        <h3 class="text-xl font-bold">Editar Banco</h3>
                        <p class="text-sm text-gray-500">Modifica la información bancaria</p>
                    </div>
                </div>
            </template>

            <div class="space-y-4">
                <div class="form-field-modern">
                    <label class="field-label-modern">
                        <i class="pi pi-building mr-2"></i>
                        Nombre del Banco
                    </label>
                    <InputText v-model="datoscampos.nombre" v-mayuscula class="modern-input-banco w-full"
                        placeholder="Nombre del banco" maxlength="250" />
                </div>

                <div class="grid grid-cols-3 gap-4">
                    <div class="form-field-modern">
                        <label class="field-label-modern">
                            <i class="pi pi-credit-card mr-2"></i>
                            Número de Cuenta
                        </label>
                        <InputText v-model="datoscampos.cuenta" v-solonumeros class="modern-input-banco w-full"
                            placeholder="Número de cuenta" maxlength="250" />
                    </div>

                    <div class="form-field-modern">
                        <label class="field-label-modern">
                            <i class="pi pi-money-bill mr-2"></i>
                            Moneda
                        </label>
                        <Select v-model="datoscampos.tipo" :options="tiposMoneda"
                            placeholder="Seleccione" class="w-full modern-input-banco" />
                    </div>

                    <div class="form-field-modern">
                        <label class="field-label-modern">
                            <i class="pi pi-dollar mr-2"></i>
                            Saldo
                        </label>
                        <InputText v-model="datoscampos.saldo" v-solonumeros v-numeroFocusinOut v-decimales
                            class="modern-input-banco w-full saldo-input" placeholder="0.00" maxlength="250" />
                    </div>
                </div>
            </div>

            <template #footer>
                <Button label="Cancelar" severity="secondary" outlined @click="visible = false" />
                <Button label="Guardar Cambios" severity="primary" icon="pi pi-save" @click="funcionActualizar" />
            </template>
        </Dialog>

        <!-- Modal: Crear Banco -->
        <Dialog v-model:visible="visiblecrear" modal header="Agregar Banco" :style="{ width: '40rem' }">
            <template #header>
                <div class="flex items-center gap-3">
                    <i class="pi pi-plus-circle text-2xl text-green-600"></i>
                    <div>
                        <h3 class="text-xl font-bold">Nuevo Banco</h3>
                        <p class="text-sm text-gray-500">Registra una nueva cuenta bancaria</p>
                    </div>
                </div>
            </template>

            <div class="space-y-4">
                <div class="form-field-modern">
                    <label class="field-label-modern">
                        <i class="pi pi-building mr-2"></i>
                        Nombre del Banco
                    </label>
                    <InputText v-model="datoscamposBanco.nombre" v-mayuscula class="modern-input-banco w-full"
                        placeholder="Nombre del banco" maxlength="250" />
                </div>

                <div class="grid grid-cols-3 gap-4">
                    <div class="form-field-modern">
                        <label class="field-label-modern">
                            <i class="pi pi-credit-card mr-2"></i>
                            Número de Cuenta
                        </label>
                        <InputText v-model="datoscamposBanco.cuenta" v-solonumeros class="modern-input-banco w-full"
                            placeholder="Número de cuenta" maxlength="250" />
                    </div>

                    <div class="form-field-modern">
                        <label class="field-label-modern">
                            <i class="pi pi-money-bill mr-2"></i>
                            Moneda
                        </label>
                        <Select v-model="datoscamposBanco.tipo" :options="tiposMoneda"
                            placeholder="Seleccione" class="w-full modern-input-banco" />
                    </div>

                    <div class="form-field-modern">
                        <label class="field-label-modern">
                            <i class="pi pi-dollar mr-2"></i>
                            Saldo Inicial
                        </label>
                        <InputText v-model="datoscamposBanco.saldo" v-solonumeros v-decimales v-numeroFocusinOut
                            class="modern-input-banco w-full saldo-input" placeholder="0.00" maxlength="250" />
                    </div>
                </div>
            </div>

            <template #footer>
                <Button label="Cancelar" severity="secondary" outlined @click="visiblecrear = false" />
                <Button label="Crear Banco" severity="success" icon="pi pi-check" @click="funcionCrear" />
            </template>
        </Dialog>

        <!-- Modal: Realizar Transacción -->
        <Dialog v-model:visible="visibleTransaccion" modal header="Realizar Transacción" :style="{ width: '50rem' }">
            <template #header>
                <div class="flex items-center gap-3">
                    <i class="pi pi-money-bill text-2xl text-purple-600"></i>
                    <div>
                        <h3 class="text-xl font-bold">Nueva Transacción</h3>
                        <p class="text-sm text-gray-500" v-if="bancoTransaccion">
                            {{ bancoTransaccion.nombre }} - Saldo actual: ${{ parseFloat(bancoTransaccion.saldo).toFixed(2) }}
                        </p>
                    </div>
                </div>
            </template>

            <div class="space-y-5">
                <!-- Tipo de Transacción -->
                <div class="form-field-modern">
                    <label class="field-label-modern">
                        <i class="pi pi-tag mr-2"></i>
                        Tipo de Transacción
                    </label>
                    <Select v-model="datosTransaccion.tipo" :options="tiposTransaccion" optionLabel="label"
                        placeholder="Seleccione el tipo de transacción" class="w-full tipo-transaccion-select">
                        <template #value="slotProps">
                            <div v-if="slotProps.value" class="flex items-center gap-2">
                                <i :class="slotProps.value.icon"></i>
                                <span>{{ slotProps.value.label }}</span>
                            </div>
                            <span v-else>{{ slotProps.placeholder }}</span>
                        </template>
                        <template #option="slotProps">
                            <div class="flex items-center gap-2">
                                <i :class="slotProps.option.icon"></i>
                                <span>{{ slotProps.option.label }}</span>
                            </div>
                        </template>
                    </Select>
                </div>

                <!-- Monto y Método -->
                <div class="grid grid-cols-2 gap-4">
                    <div class="form-field-modern">
                        <label class="field-label-modern">
                            <i class="pi pi-dollar mr-2"></i>
                            Monto
                        </label>
                        <InputText v-model="datosTransaccion.monto" v-solonumeros v-decimales v-numeroFocusinOut
                            class="modern-input-banco w-full monto-input" placeholder="0.00" />
                    </div>

                    <div class="form-field-modern">
                        <label class="field-label-modern">
                            <i class="pi pi-credit-card mr-2"></i>
                            Método
                        </label>
                        <Select v-model="datosTransaccion.metodo" :options="metodosOptions"
                            placeholder="Seleccione método" class="w-full" />
                    </div>
                </div>

                <!-- Selector de Cliente (condicional) -->
                <div class="form-field-modern" v-if="mostrarSelectorCliente">
                    <div class="flex justify-between items-center mb-2">
                        <label class="field-label-modern">
                            <i class="pi pi-user mr-2"></i>
                            {{ labelCliente }}
                        </label>
                        <!-- Botón para agregar cuenta manual (solo transferencia salida) -->
                        <Button v-if="datosTransaccion.tipo?.value === 'TRANSFERENCIA_SALIDA'"
                            :label="usarCuentaManual ? 'Seleccionar de lista' : 'Agregar cuenta manual'"
                            :icon="usarCuentaManual ? 'pi pi-list' : 'pi pi-plus'"
                            size="small" text
                            @click="usarCuentaManual = !usarCuentaManual; datosTransaccion.cliente = null; cuentaManual = { nombre: '', cuenta: '' }" />
                    </div>

                    <!-- Selector de cliente existente -->
                    <Select v-if="!usarCuentaManual || datosTransaccion.tipo?.value !== 'TRANSFERENCIA_SALIDA'"
                        v-model="datosTransaccion.cliente" :options="clientes" optionLabel="nombre"
                        placeholder="Seleccione cliente o área" filter showClear class="w-full cliente-select">
                        <template #option="slotProps">
                            <div class="flex items-center gap-2">
                                <i :class="slotProps.option.id === 'area_venta' ? 'pi pi-shopping-cart' : 'pi pi-user'"></i>
                                <span :class="{ 'font-bold text-blue-600': slotProps.option.id === 'area_venta' }">
                                    {{ slotProps.option.nombre }}
                                </span>
                            </div>
                        </template>
                    </Select>

                    <!-- Campos de cuenta manual (solo transferencia salida) -->
                    <div v-if="usarCuentaManual && datosTransaccion.tipo?.value === 'TRANSFERENCIA_SALIDA'" class="cuenta-manual-container">
                        <div class="grid grid-cols-2 gap-3">
                            <div class="form-field-modern">
                                <label class="field-label-modern text-sm">
                                    <i class="pi pi-user mr-1"></i>
                                    Nombre beneficiario
                                </label>
                                <InputText v-model="cuentaManual.nombre" v-mayuscula class="modern-input-banco w-full"
                                    placeholder="Nombre del beneficiario" />
                            </div>
                            <div class="form-field-modern">
                                <label class="field-label-modern text-sm">
                                    <i class="pi pi-credit-card mr-1"></i>
                                    Número de cuenta
                                </label>
                                <InputText v-model="cuentaManual.cuenta" v-solonumeros class="modern-input-banco w-full"
                                    placeholder="Número de cuenta destino" />
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Selector de Banco Destino (solo transferencia entre bancos) -->
                <div class="form-field-modern" v-if="datosTransaccion.tipo?.value === 'TRANSFERENCIA_ENTRE_BANCOS'">
                    <label class="field-label-modern">
                        <i class="pi pi-building mr-2"></i>
                        Banco destino
                    </label>
                    <Select v-model="bancoDestino" :options="bancosDisponibles" optionLabel="nombre"
                        placeholder="Seleccione el banco destino" class="w-full banco-destino-select">
                        <template #value="slotProps">
                            <div v-if="slotProps.value" class="flex items-center gap-2">
                                <i class="pi pi-building text-green-600"></i>
                                <span>{{ slotProps.value.nombre }}</span>
                                <span class="text-gray-500">- ${{ parseFloat(slotProps.value.saldo).toFixed(2) }}</span>
                            </div>
                            <span v-else>{{ slotProps.placeholder }}</span>
                        </template>
                        <template #option="slotProps">
                            <div class="flex items-center justify-between w-full">
                                <div class="flex items-center gap-2">
                                    <i class="pi pi-building text-green-600"></i>
                                    <span class="font-semibold">{{ slotProps.option.nombre }}</span>
                                </div>
                                <span class="text-green-600 font-bold">${{ parseFloat(slotProps.option.saldo).toFixed(2) }}</span>
                            </div>
                        </template>
                    </Select>
                </div>

                <!-- Campo de Tasa de Cambio (solo si hay conversión de moneda) -->
                <div class="form-field-modern" v-if="necesitaConversion">
                    <div class="tasa-cambio-container">
                        <div class="tasa-cambio-header">
                            <i class="pi pi-sync mr-2"></i>
                            <span>Conversión de moneda: {{ bancoTransaccion?.tipo }} → {{ bancoDestino?.tipo }}</span>
                        </div>
                        <div class="tasa-cambio-body">
                            <div class="grid grid-cols-2 gap-4">
                                <div class="form-field-modern">
                                    <label class="field-label-modern text-sm">
                                        <i class="pi pi-percentage mr-1"></i>
                                        {{ textoConversion }}
                                    </label>
                                    <InputText v-model="tasaCambio" v-solonumeros v-decimales
                                        class="modern-input-banco w-full tasa-input" placeholder="Ej: 58.50" />
                                </div>
                                <div class="form-field-modern">
                                    <label class="field-label-modern text-sm">
                                        <i class="pi pi-calculator mr-1"></i>
                                        Monto a recibir ({{ bancoDestino?.tipo }})
                                    </label>
                                    <div class="monto-convertido-display">
                                        {{ montoConvertido.toFixed(2) }} {{ bancoDestino?.tipo }}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Descripción -->
                <div class="form-field-modern">
                    <label class="field-label-modern">
                        <i class="pi pi-align-left mr-2"></i>
                        Descripción (opcional)
                    </label>
                    <Textarea v-model="datosTransaccion.descripcion" rows="3" class="w-full modern-input-banco"
                        placeholder="Descripción de la transacción..." />
                </div>

                <!-- Resumen de la transacción -->
                <div v-if="datosTransaccion.tipo && datosTransaccion.monto" class="resumen-transaccion">
                    <div class="resumen-header">
                        <i class="pi pi-info-circle"></i>
                        <span>Resumen de la transacción</span>
                    </div>
                    <div class="resumen-body">
                        <!-- Info banco origen -->
                        <div class="resumen-item">
                            <span>{{ datosTransaccion.tipo.value === 'TRANSFERENCIA_ENTRE_BANCOS' ? 'Balance ' + bancoTransaccion?.nombre + ':' : 'Balance actual:' }}</span>
                            <span class="font-bold">${{ parseFloat(bancoTransaccion?.saldo || 0).toFixed(2) }}</span>
                        </div>
                        <div class="resumen-item">
                            <span>{{ ['RETIRO', 'TRANSFERENCIA_SALIDA', 'TRANSFERENCIA_ENTRE_BANCOS'].includes(datosTransaccion.tipo.value) ? 'Monto a restar:' : 'Monto a sumar:' }}</span>
                            <span :class="['RETIRO', 'TRANSFERENCIA_SALIDA', 'TRANSFERENCIA_ENTRE_BANCOS'].includes(datosTransaccion.tipo.value) ? 'text-red-600 font-bold' : 'text-green-600 font-bold'">
                                {{ ['RETIRO', 'TRANSFERENCIA_SALIDA', 'TRANSFERENCIA_ENTRE_BANCOS'].includes(datosTransaccion.tipo.value) ? '-' : '+' }}${{ parseFloat(datosTransaccion.monto || 0).toFixed(2) }}
                            </span>
                        </div>
                        <div class="resumen-item resumen-total">
                            <span>{{ datosTransaccion.tipo.value === 'TRANSFERENCIA_ENTRE_BANCOS' ? 'Nuevo balance ' + bancoTransaccion?.nombre + ':' : 'Nuevo balance:' }}</span>
                            <span class="font-bold text-lg">
                                ${{ (['RETIRO', 'TRANSFERENCIA_SALIDA', 'TRANSFERENCIA_ENTRE_BANCOS'].includes(datosTransaccion.tipo.value)
                                    ? parseFloat(bancoTransaccion?.saldo || 0) - parseFloat(datosTransaccion.monto || 0)
                                    : parseFloat(bancoTransaccion?.saldo || 0) + parseFloat(datosTransaccion.monto || 0)).toFixed(2) }}
                            </span>
                        </div>
                        <!-- Info banco destino (solo transferencia entre bancos) -->
                        <template v-if="datosTransaccion.tipo.value === 'TRANSFERENCIA_ENTRE_BANCOS' && bancoDestino">
                            <div class="resumen-divider"></div>
                            <div class="resumen-item">
                                <span>Balance {{ bancoDestino.nombre }} ({{ bancoDestino.tipo }}):</span>
                                <span class="font-bold">{{ bancoDestino.tipo === 'DOP' ? '$' : bancoDestino.tipo === 'USD' ? 'US$' : '€' }}{{ parseFloat(bancoDestino.saldo || 0).toFixed(2) }}</span>
                            </div>
                            <div class="resumen-item">
                                <span>Monto a recibir{{ necesitaConversion ? ' (convertido)' : '' }}:</span>
                                <span class="text-green-600 font-bold">
                                    +{{ bancoDestino.tipo === 'DOP' ? '$' : bancoDestino.tipo === 'USD' ? 'US$' : '€' }}{{ necesitaConversion ? montoConvertido.toFixed(2) : parseFloat(datosTransaccion.monto || 0).toFixed(2) }}
                                </span>
                            </div>
                            <div class="resumen-item resumen-total-destino">
                                <span>Nuevo balance {{ bancoDestino.nombre }}:</span>
                                <span class="font-bold text-lg text-green-600">
                                    {{ bancoDestino.tipo === 'DOP' ? '$' : bancoDestino.tipo === 'USD' ? 'US$' : '€' }}{{ (parseFloat(bancoDestino.saldo || 0) + (necesitaConversion ? montoConvertido : parseFloat(datosTransaccion.monto || 0))).toFixed(2) }}
                                </span>
                            </div>
                        </template>
                    </div>
                </div>
            </div>

            <template #footer>
                <Button label="Cancelar" severity="secondary" outlined @click="limpiarModalTransaccion" />
                <Button label="Realizar Transacción" severity="success" icon="pi pi-check" @click="guardarTransaccion" />
            </template>
        </Dialog>

        <Toast />
    </main>
</template>

<style scoped>
/* ===================================
   BANCO MANAGEMENT STYLES
   =================================== */

.banco-wrapper {
    min-height: calc(100vh - 80px);
    background: linear-gradient(135deg, rgba(236, 253, 245, 0.3) 0%, rgba(209, 250, 229, 0.2) 100%);
}

.container-banco {
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
    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 2.5rem;
    color: white;
    box-shadow: 0 8px 20px rgba(16, 185, 129, 0.3);
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

.stat-saldo {
    border-color: #10b981;
    background: linear-gradient(135deg, rgba(16, 185, 129, 0.05) 0%, rgba(5, 150, 105, 0.02) 100%);
}

.stat-cuentas {
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

.stat-saldo .stat-icon {
    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
    color: white;
}

.stat-cuentas .stat-icon {
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
    border-color: #10b981;
    box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1);
}

.modern-datatable :deep(.p-datatable-thead>tr>th) {
    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
    color: white;
    font-weight: 700;
    padding: 1rem;
    border: none;
}

.modern-datatable :deep(.p-datatable-tbody>tr) {
    transition: all 0.2s ease;
}

.modern-datatable :deep(.p-datatable-tbody>tr:hover) {
    background: rgba(16, 185, 129, 0.05);
}

/* Custom Badges */
.cuenta-badge {
    display: inline-flex;
    align-items: center;
    padding: 0.5rem 1rem;
    background: linear-gradient(135deg, #e0e7ff 0%, #dbeafe 100%);
    border: 2px solid #3b82f6;
    border-radius: 8px;
    font-weight: 600;
    color: #1e40af;
}

.saldo-badge {
    display: inline-flex;
    align-items: center;
    padding: 0.5rem 1rem;
    background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
    border: 2px solid #10b981;
    border-radius: 8px;
    font-weight: 700;
    color: #065f46;
    font-size: 1.1rem;
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

.modern-input-banco {
    border: 2px solid #e5e7eb;
    border-radius: 10px;
    padding: 0.75rem;
    font-size: 0.95rem;
    transition: all 0.3s ease;
}

.modern-input-banco:focus {
    border-color: #10b981;
    box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1);
    outline: none;
}

.saldo-input {
    font-weight: 700;
    font-size: 1.1rem;
    color: #10b981;
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

/* Modal Transacción Styles */
.tipo-transaccion-select :deep(.p-select-label) {
    padding: 0.75rem;
}

.monto-input {
    font-size: 1.25rem;
    font-weight: 700;
    color: #10b981;
}

.cliente-select :deep(.p-select-label) {
    padding: 0.75rem;
}

.resumen-transaccion {
    background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%);
    border-radius: 12px;
    overflow: hidden;
    border: 2px solid #d1d5db;
}

.resumen-header {
    background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
    color: white;
    padding: 0.75rem 1rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-weight: 600;
}

.resumen-body {
    padding: 1rem;
}

.resumen-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.5rem 0;
    border-bottom: 1px solid #e5e7eb;
}

.resumen-item:last-child {
    border-bottom: none;
}

.resumen-total {
    background: rgba(16, 185, 129, 0.1);
    margin: 0.5rem -1rem -1rem -1rem;
    padding: 1rem;
    border-radius: 0 0 10px 10px;
}

.cuenta-manual-container {
    background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
    border: 2px solid #0ea5e9;
    border-radius: 10px;
    padding: 1rem;
    margin-top: 0.5rem;
}

.banco-destino-select :deep(.p-select-label) {
    padding: 0.75rem;
}

.resumen-divider {
    height: 2px;
    background: linear-gradient(90deg, transparent, #d1d5db, transparent);
    margin: 0.75rem 0;
}

.resumen-total-destino {
    background: rgba(16, 185, 129, 0.15);
    margin: 0.5rem -1rem -1rem -1rem;
    padding: 1rem;
    border-radius: 0 0 10px 10px;
}

/* Estilos para tasa de cambio */
.tasa-cambio-container {
    background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
    border: 2px solid #f59e0b;
    border-radius: 12px;
    overflow: hidden;
}

.tasa-cambio-header {
    background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
    color: white;
    padding: 0.75rem 1rem;
    display: flex;
    align-items: center;
    font-weight: 600;
}

.tasa-cambio-body {
    padding: 1rem;
}

.tasa-input {
    font-size: 1.1rem;
    font-weight: 600;
    text-align: center;
}

.monto-convertido-display {
    background: white;
    border: 2px solid #10b981;
    border-radius: 8px;
    padding: 0.75rem 1rem;
    font-size: 1.25rem;
    font-weight: 700;
    color: #10b981;
    text-align: center;
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
