<script setup>
import { ref, onMounted, computed, watch } from 'vue';
import { useRouter } from 'vue-router';
const router = useRouter();
import { envioElectron, encryptarPassword, nfecha, peticionesFetchOffline, arrayToObjetoFromTablaOffline, crearTablaSiNoExisteOffline } from '../../funciones/funciones.js';
import Swal from 'sweetalert2';
import jsPDF from 'jspdf';
import { useToast } from "primevue/usetoast";
const toast = useToast();
import { useDatosEmpresa } from '../../stores';
const datosEmpresa = useDatosEmpresa();

/************************************************************************/
const usuarioLocal = ref({});
/************************************************************************/
// Campos para las tablas
const camposArrayConciliaciones = ["numero_conciliacion", "banco_id", "nombre_banco", "cuenta_banco", "fecha_inicio", "fecha_fin", "saldo_libro", "saldo_banco", "diferencia", "estado", "notas", "usuario"];
const camposArrayDetalles = ["conciliacion_id", "tipo_movimiento", "numero_referencia", "descripcion", "monto", "accion_tomada", "usuario"];
const camposArrayBanco = ["nombre", "saldo", "tipo", "cuenta", "usuario"];
const camposArrayCheques = ["numero_cheque", "banco", "cuenta_banco", "beneficiario", "monto", "fecha_emision", "fecha_cobro", "concepto", "estado", "usuario"];
const camposArrayTransacciones = ["cuenta_origen", "cuenta_destino", "monto", "tipo", "balance_anterior", "balance_actual", "metodo", "descripcion", "depositante", "beneficiario", "fecha", "hora", "estado", "usuario"];
/************************************************************************/
const link = ref('');
const api = ref('');
const token = ref('');
const tokenCorto = ref('');
/************************************************************************/
const data = ref([]);
const bancos = ref([]);
const searchQuery = ref('');
const selectedItems = ref([]);
const estadoSeleccionado = ref(null);
const bancoSeleccionado = ref(null);
/************************************************************************/
// Modales
const visibleCrear = ref(false);
const visibleGestionar = ref(false);
const conciliacionActual = ref(null);
/************************************************************************/
// Datos para crear conciliación
const nuevaConciliacion = ref({
    banco: null,
    fecha_inicio: nfecha('fecha'),
    fecha_fin: nfecha('fecha'),
    saldo_banco: '',
    notas: ''
});
/************************************************************************/
// Estados disponibles
const estadosOpciones = ref(['PENDIENTE', 'EN_PROCESO', 'CONCILIADA', 'AJUSTADA']);
/************************************************************************/
// Tipos de movimientos para ajustes (simplificados)
const tiposMovimientos = ref([
    {
        label: 'Aumentar saldo (Banco tiene más)',
        value: 'AUMENTAR_SALDO',
        icon: 'pi pi-plus-circle',
        descripcion: 'El banco registró un ingreso que no está en tus libros. Ej: interés ganado, depósito no registrado',
        efecto: 'SUMA'
    },
    {
        label: 'Disminuir saldo (Banco tiene menos)',
        value: 'DISMINUIR_SALDO',
        icon: 'pi pi-minus-circle',
        descripcion: 'El banco registró un egreso que no está en tus libros. Ej: comisión, cheque no registrado',
        efecto: 'RESTA'
    },
    {
        label: 'Cheque en tránsito (sin cobrar)',
        value: 'CHEQUE_EN_TRANSITO',
        icon: 'pi pi-clock',
        descripcion: 'Cheque emitido pero aún no cobrado. Ya está en tus libros pero NO en el banco',
        efecto: 'RESTA'
    },
    {
        label: 'Depósito en tránsito (no reflejado)',
        value: 'DEPOSITO_EN_TRANSITO',
        icon: 'pi pi-send',
        descripcion: 'Depósito hecho pero aún no reflejado por el banco. Ya está en tus libros pero NO en el banco',
        efecto: 'SUMA'
    }
]);
/************************************************************************/
// Para gestionar la conciliación
const chequesEnPeriodo = ref([]);
const transaccionesEnPeriodo = ref([]);
const detallesConciliacion = ref([]);
const nuevoDetalle = ref({
    tipo_movimiento: null,
    numero_referencia: '',
    descripcion: '',
    monto: '',
    accion_tomada: ''
});
/************************************************************************/
// Para menú contextual
const menu = ref(null);
const itemsConciliacion = ref([]);
const currentRowData = ref(null);
/************************************************************************/

const fetchAndSetupData = async () => {
    const response = await peticionesFetchOffline('getDataAsArray', 'conciliaciones');
    data.value = (response || []).reverse();
};

const fetchBancos = async () => {
    const response = await peticionesFetchOffline('getDataAsArray', 'banco');
    bancos.value = response || [];
};

const fetchCheques = async () => {
    const response = await peticionesFetchOffline('getDataAsArray', 'cheques');
    return response || [];
};

const fetchTransacciones = async () => {
    const response = await peticionesFetchOffline('getDataAsArray', 'transaccionesbancarias');
    return response || [];
};

const fetchDetallesConciliacion = async (conciliacionId) => {
    const response = await peticionesFetchOffline('getDataAsArray', 'detalles_conciliacion');
    const todos = response || [];
    return todos.filter(d => d.conciliacion_id == conciliacionId);
};

/************************************************************************/
onMounted(async () => {
    const datosJSON = await envioElectron('datosarchivo');
    link.value = datosJSON.VITE_LINKURL;
    api.value = datosJSON.VITE_LINK_API;
    token.value = datosJSON.VITE_TOKEN;
    tokenCorto.value = datosJSON.VITE_TOKEN_CORTO;

    // Crear tablas si no existen
    await crearTablaSiNoExisteOffline('conciliaciones', camposArrayConciliaciones.join(','), toast);
    await crearTablaSiNoExisteOffline('detalles_conciliacion', camposArrayDetalles.join(','), toast);
    await crearTablaSiNoExisteOffline('banco', camposArrayBanco.join(','), toast);
    await crearTablaSiNoExisteOffline('cheques', camposArrayCheques.join(','), toast);
    await crearTablaSiNoExisteOffline('transaccionesbancarias', camposArrayTransacciones.join(','), toast);

    usuarioLocal.value = JSON.parse(window.localStorage.getItem('usuarioLocal'))[0] || {};
    await fetchAndSetupData();
    await fetchBancos();
});
/************************************************************************/

const limpiarFormularioCrear = () => {
    nuevaConciliacion.value = {
        banco: null,
        fecha_inicio: nfecha('fecha'),
        fecha_fin: nfecha('fecha'),
        saldo_banco: '',
        notas: ''
    };
};

/************************************************************************/
// Generar número de conciliación automático
const generarNumeroConciliacion = () => {
    const year = new Date().getFullYear();
    const count = data.value.length + 1;
    return `CONC-${year}-${String(count).padStart(4, '0')}`;
};
/************************************************************************/

async function crearConciliacion() {
    // Validaciones
    if (!nuevaConciliacion.value.banco) {
        toast.add({ severity: 'warn', summary: 'Atención', detail: 'Seleccione un banco', life: 3000 });
        return;
    }
    if (!nuevaConciliacion.value.fecha_inicio || !nuevaConciliacion.value.fecha_fin) {
        toast.add({ severity: 'warn', summary: 'Atención', detail: 'Seleccione el periodo de conciliación', life: 3000 });
        return;
    }
    if (!nuevaConciliacion.value.saldo_banco || parseFloat(nuevaConciliacion.value.saldo_banco) < 0) {
        toast.add({ severity: 'warn', summary: 'Atención', detail: 'Ingrese el saldo según el banco', life: 3000 });
        return;
    }

    // Calcular saldo según libros (transacciones en el periodo)
    const todasTransacciones = await fetchTransacciones();
    const cuentaBanco = nuevaConciliacion.value.banco.cuenta;

    const transaccionesPeriodo = todasTransacciones.filter(t => {
        const fechaTrans = t.fecha;
        return fechaTrans >= nuevaConciliacion.value.fecha_inicio &&
               fechaTrans <= nuevaConciliacion.value.fecha_fin &&
               (t.cuenta_origen === cuentaBanco || t.cuenta_destino === cuentaBanco);
    });

    // Calcular saldo según libros basado en el balance_actual de la última transacción del periodo
    let saldoLibro = parseFloat(nuevaConciliacion.value.banco.saldo);
    if (transaccionesPeriodo.length > 0) {
        const ultimaTransaccion = transaccionesPeriodo[transaccionesPeriodo.length - 1];
        saldoLibro = parseFloat(ultimaTransaccion.balance_actual);
    }

    const saldoBanco = parseFloat(nuevaConciliacion.value.saldo_banco);
    const diferencia = saldoBanco - saldoLibro;

    // Crear objeto de conciliación
    const campos = await arrayToObjetoFromTablaOffline('conciliaciones');
    campos.numero_conciliacion = generarNumeroConciliacion();
    campos.banco_id = nuevaConciliacion.value.banco.id;
    campos.nombre_banco = nuevaConciliacion.value.banco.nombre;
    campos.cuenta_banco = nuevaConciliacion.value.banco.cuenta;
    campos.fecha_inicio = nuevaConciliacion.value.fecha_inicio;
    campos.fecha_fin = nuevaConciliacion.value.fecha_fin;
    campos.saldo_libro = saldoLibro.toFixed(2);
    campos.saldo_banco = saldoBanco.toFixed(2);
    campos.diferencia = diferencia.toFixed(2);
    campos.estado = 'PENDIENTE';
    campos.notas = nuevaConciliacion.value.notas || '';
    campos.usuario = usuarioLocal.value.usuario || '';
    if (campos.hasOwnProperty('created_at')) {
        campos.created_at = nfecha('timestamp');
        campos.updated_at = nfecha('timestamp');
    }

    const envioDatos = await peticionesFetchOffline('insertData', 'conciliaciones', JSON.stringify(campos));
    if (envioDatos[0] == 'ok') {
        await fetchAndSetupData();
        toast.add({ severity: 'success', summary: 'Éxito', detail: 'Conciliación creada correctamente', life: 3000 });
        limpiarFormularioCrear();
        visibleCrear.value = false;
    } else {
        toast.add({ severity: 'error', summary: 'Error', detail: 'Fallo al crear conciliación', life: 3000 });
    }
}

/************************************************************************/
// Abrir modal de gestión de conciliación
async function abrirGestionConciliacion(conciliacion) {
    conciliacionActual.value = { ...conciliacion };

    // Cargar transacciones en el periodo
    const todasTransacciones = await fetchTransacciones();
    transaccionesEnPeriodo.value = (Array.isArray(todasTransacciones) ? todasTransacciones : []).filter(t => {
        const fechaTrans = t.fecha;
        return fechaTrans >= conciliacion.fecha_inicio &&
               fechaTrans <= conciliacion.fecha_fin &&
               (t.cuenta_origen === conciliacion.cuenta_banco || t.cuenta_destino === conciliacion.cuenta_banco);
    });

    // RECALCULAR saldo según libros con las transacciones actuales del periodo
    let saldoLibroActualizado = 0;
    if (transaccionesEnPeriodo.value.length > 0) {
        // Ordenar transacciones por fecha y hora
        const transaccionesOrdenadas = [...transaccionesEnPeriodo.value].sort((a, b) => {
            if (a.fecha === b.fecha) {
                return a.hora.localeCompare(b.hora);
            }
            return a.fecha.localeCompare(b.fecha);
        });

        // Tomar el balance_actual de la última transacción del periodo
        const ultimaTransaccion = transaccionesOrdenadas[transaccionesOrdenadas.length - 1];
        saldoLibroActualizado = parseFloat(ultimaTransaccion.balance_actual || 0);
    } else {
        // Si no hay transacciones en el periodo, usar el saldo actual del banco
        const banco = bancos.value.find(b => b.id == conciliacion.banco_id);
        saldoLibroActualizado = banco ? parseFloat(banco.saldo || 0) : 0;
    }

    // Verificar si hubo cambios en el saldo según libros
    const saldoLibroAnterior = parseFloat(conciliacion.saldo_libro || 0);
    const hubocambios = Math.abs(saldoLibroActualizado - saldoLibroAnterior) >= 0.01;

    // Actualizar el saldo según libros y recalcular diferencia
    const saldoBanco = parseFloat(conciliacion.saldo_banco || 0);
    const diferenciaActualizada = saldoBanco - saldoLibroActualizado;

    // Preparar objeto actualizado para guardar
    const conciliacionParaGuardar = { ...conciliacion };
    conciliacionParaGuardar.saldo_libro = saldoLibroActualizado.toFixed(2);
    conciliacionParaGuardar.diferencia = diferenciaActualizada.toFixed(2);

    if (conciliacionParaGuardar.hasOwnProperty('created_at')) {
        conciliacionParaGuardar.updated_at = nfecha('timestamp');
    }

    // Actualizar en la base de datos
    await peticionesFetchOffline('updateData', 'conciliaciones', JSON.stringify(conciliacionParaGuardar));

    // Recargar la lista de conciliaciones para reflejar los cambios
    await fetchAndSetupData();

    // IMPORTANTE: Actualizar conciliacionActual con los datos recién guardados
    const conciliacionActualizadaFromDB = data.value.find(c => c.id == conciliacion.id);
    if (conciliacionActualizadaFromDB) {
        conciliacionActual.value = { ...conciliacionActualizadaFromDB };
    } else {
        // Fallback: usar los datos que acabamos de guardar
        conciliacionActual.value = { ...conciliacionParaGuardar };
    }

    // Notificar al usuario si hubo cambios
    if (hubocambios) {
        toast.add({
            severity: 'info',
            summary: 'Conciliación Actualizada',
            detail: `Saldo Libros: $${saldoLibroAnterior.toFixed(2)} → $${saldoLibroActualizado.toFixed(2)}`,
            life: 5000
        });
    }

    // Cargar cheques en el periodo
    const todosCheques = await fetchCheques();
    chequesEnPeriodo.value = (Array.isArray(todosCheques) ? todosCheques : []).filter(c => {
        const fechaEmision = c.fecha_emision;
        return fechaEmision >= conciliacion.fecha_inicio &&
               fechaEmision <= conciliacion.fecha_fin &&
               c.banco === conciliacion.nombre_banco &&
               c.estado === 'PENDIENTE';
    });

    // Cargar detalles de conciliación (ajustes previos)
    detallesConciliacion.value = await fetchDetallesConciliacion(conciliacion.id);

    visibleGestionar.value = true;
}
/************************************************************************/

async function marcarChequeEnTransito(cheque) {
    Swal.fire({
        title: '¿Marcar como en tránsito?',
        html: `
            <p style="margin-bottom:12px;">Cheque #<b>${cheque.numero_cheque}</b> - $${parseFloat(cheque.monto).toFixed(2)}</p>
            <p style="color:#6b7280;font-size:0.875rem;">Este cheque se excluirá del periodo de conciliación</p>
        `,
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Sí, marcar',
        cancelButtonText: 'Cancelar'
    }).then(async (result) => {
        if (result.isConfirmed) {
            // Agregar detalle a la conciliación
            const campos = await arrayToObjetoFromTablaOffline('detalles_conciliacion');
            campos.conciliacion_id = conciliacionActual.value.id;
            campos.tipo_movimiento = 'CHEQUE_EN_TRANSITO';
            campos.numero_referencia = cheque.numero_cheque;
            campos.descripcion = `Cheque en tránsito - ${cheque.beneficiario}`;
            campos.monto = parseFloat(cheque.monto).toFixed(2);
            campos.accion_tomada = 'Excluido del periodo de conciliación';
            campos.usuario = usuarioLocal.value.usuario || '';
            if (campos.hasOwnProperty('created_at')) {
                campos.created_at = nfecha('timestamp');
                campos.updated_at = nfecha('timestamp');
            }

            const envioDatos = await peticionesFetchOffline('insertData', 'detalles_conciliacion', JSON.stringify(campos));
            if (envioDatos[0] == 'ok') {
                // Recargar detalles
                detallesConciliacion.value = await fetchDetallesConciliacion(conciliacionActual.value.id);
                toast.add({ severity: 'success', summary: 'Éxito', detail: 'Cheque marcado como en tránsito', life: 3000 });

                // Recalcular diferencia
                await recalcularDiferencia();
            } else {
                toast.add({ severity: 'error', summary: 'Error', detail: 'Fallo al marcar cheque', life: 3000 });
            }
        }
    });
}

/************************************************************************/
async function agregarAjuste() {
    if (!nuevoDetalle.value.tipo_movimiento) {
        toast.add({ severity: 'warn', summary: 'Atención', detail: 'Seleccione el tipo de movimiento', life: 3000 });
        return;
    }
    if (!nuevoDetalle.value.descripcion) {
        toast.add({ severity: 'warn', summary: 'Atención', detail: 'Ingrese una descripción', life: 3000 });
        return;
    }
    if (!nuevoDetalle.value.monto || parseFloat(nuevoDetalle.value.monto) <= 0) {
        toast.add({ severity: 'warn', summary: 'Atención', detail: 'Ingrese un monto válido', life: 3000 });
        return;
    }

    const campos = await arrayToObjetoFromTablaOffline('detalles_conciliacion');
    campos.conciliacion_id = conciliacionActual.value.id;
    campos.tipo_movimiento = nuevoDetalle.value.tipo_movimiento.value;
    campos.numero_referencia = nuevoDetalle.value.numero_referencia || '';
    campos.descripcion = nuevoDetalle.value.descripcion;
    campos.monto = parseFloat(nuevoDetalle.value.monto).toFixed(2);
    campos.accion_tomada = nuevoDetalle.value.accion_tomada || '';
    campos.usuario = usuarioLocal.value.usuario || '';
    if (campos.hasOwnProperty('created_at')) {
        campos.created_at = nfecha('timestamp');
        campos.updated_at = nfecha('timestamp');
    }

    const envioDatos = await peticionesFetchOffline('insertData', 'detalles_conciliacion', JSON.stringify(campos));
    if (envioDatos[0] == 'ok') {
        // Recargar detalles
        detallesConciliacion.value = await fetchDetallesConciliacion(conciliacionActual.value.id);
        toast.add({ severity: 'success', summary: 'Éxito', detail: 'Ajuste agregado correctamente', life: 3000 });

        // Limpiar formulario
        nuevoDetalle.value = {
            tipo_movimiento: null,
            numero_referencia: '',
            descripcion: '',
            monto: '',
            accion_tomada: ''
        };

        // Recalcular diferencia
        await recalcularDiferencia();
    } else {
        toast.add({ severity: 'error', summary: 'Error', detail: 'Fallo al agregar ajuste', life: 3000 });
    }
}

/************************************************************************/
async function eliminarDetalle(detalle) {
    Swal.fire({
        title: '¿Eliminar este ajuste?',
        text: detalle.descripcion,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Sí, eliminar',
        confirmButtonColor: '#ef4444',
        cancelButtonText: 'Cancelar'
    }).then(async (result) => {
        if (result.isConfirmed) {
            const envioDatos = await peticionesFetchOffline('deleteEntry', 'detalles_conciliacion', detalle.id);
            if (envioDatos[0] == 'ok') {
                detallesConciliacion.value = await fetchDetallesConciliacion(conciliacionActual.value.id);
                toast.add({ severity: 'success', summary: 'Éxito', detail: 'Ajuste eliminado', life: 3000 });
                await recalcularDiferencia();
            } else {
                toast.add({ severity: 'error', summary: 'Error', detail: 'Fallo al eliminar ajuste', life: 3000 });
            }
        }
    });
}

/************************************************************************/
async function recalcularDiferencia() {
    // Calcular la diferencia inicial (antes de ajustes)
    const diferenciaInicial = parseFloat(conciliacionActual.value.saldo_banco) - parseFloat(conciliacionActual.value.saldo_libro);

    // Aplicar todos los ajustes
    const totalAjustes = detallesConciliacion.value.reduce((sum, d) => {
        const monto = parseFloat(d.monto) || 0;

        // Encontrar el tipo de movimiento para saber su efecto
        const tipoMovimiento = tiposMovimientos.value.find(t => t.value === d.tipo_movimiento);

        if (tipoMovimiento) {
            if (tipoMovimiento.efecto === 'SUMA') {
                // Este ajuste aumenta la diferencia (favorece al banco)
                return sum + monto;
            } else if (tipoMovimiento.efecto === 'RESTA') {
                // Este ajuste disminuye la diferencia (favorece a los libros)
                return sum - monto;
            }
        }

        return sum;
    }, 0);

    const nuevaDiferencia = diferenciaInicial - totalAjustes;

    // Actualizar conciliación
    const conciliacionActualizada = { ...conciliacionActual.value };
    conciliacionActualizada.diferencia = nuevaDiferencia.toFixed(2);

    // Si la diferencia es 0 o muy pequeña, marcar como conciliada
    if (Math.abs(nuevaDiferencia) < 0.01) {
        conciliacionActualizada.estado = 'CONCILIADA';
    } else {
        conciliacionActualizada.estado = 'EN_PROCESO';
    }

    if (conciliacionActualizada.hasOwnProperty('created_at')) {
        conciliacionActualizada.updated_at = nfecha('timestamp');
    }

    const envioDatos = await peticionesFetchOffline('updateData', 'conciliaciones', JSON.stringify(conciliacionActualizada));
    if (envioDatos[0] == 'ok') {
        conciliacionActual.value = conciliacionActualizada;
        await fetchAndSetupData();
    }
}

/************************************************************************/
async function finalizarConciliacion() {
    const diferencia = Math.abs(parseFloat(conciliacionActual.value.diferencia));

    if (diferencia >= 0.01) {
        toast.add({
            severity: 'warn',
            summary: 'Atención',
            detail: `Aún existe una diferencia de $${diferencia.toFixed(2)}. Agregue ajustes para conciliar.`,
            life: 5000
        });
        return;
    }

    Swal.fire({
        title: '¿Finalizar conciliación?',
        text: 'La conciliación se marcará como completada',
        icon: 'success',
        showCancelButton: true,
        confirmButtonText: 'Sí, finalizar',
        cancelButtonText: 'Cancelar'
    }).then(async (result) => {
        if (result.isConfirmed) {
            const conciliacionActualizada = { ...conciliacionActual.value };
            conciliacionActualizada.estado = 'CONCILIADA';
            if (conciliacionActualizada.hasOwnProperty('created_at')) {
                conciliacionActualizada.updated_at = nfecha('timestamp');
            }

            const envioDatos = await peticionesFetchOffline('updateData', 'conciliaciones', JSON.stringify(conciliacionActualizada));
            if (envioDatos[0] == 'ok') {
                await fetchAndSetupData();
                visibleGestionar.value = false;
                toast.add({ severity: 'success', summary: 'Éxito', detail: 'Conciliación finalizada correctamente', life: 3000 });
            } else {
                toast.add({ severity: 'error', summary: 'Error', detail: 'Fallo al finalizar conciliación', life: 3000 });
            }
        }
    });
}

/************************************************************************/
// Toggle menú de opciones
const toggleConciliacion = (event, rowData) => {
    currentRowData.value = rowData;
    itemsConciliacion.value = [
        {
            label: 'Gestionar',
            icon: 'pi pi-cog',
            command: () => {
                abrirGestionConciliacion(currentRowData.value);
            }
        },
        {
            label: 'Ver Reporte PDF',
            icon: 'pi pi-file-pdf',
            visible: rowData.estado === 'CONCILIADA',
            command: () => {
                generarPDFConciliacion(currentRowData.value);
            }
        },
        {
            separator: true
        },
        {
            label: 'Eliminar',
            icon: 'pi pi-trash',
            command: () => {
                eliminarConciliacion(currentRowData.value);
            }
        }
    ];
    menu.value.toggle(event);
};

/************************************************************************/
// Eliminar conciliación
async function eliminarConciliacion(conciliacion) {
    Swal.fire({
        title: '¿Eliminar esta conciliación?',
        html: `
            <p style="margin-bottom:12px;"><b>${conciliacion.numero_conciliacion}</b></p>
            <p style="color:#6b7280;font-size:0.875rem;">${conciliacion.nombre_banco} - ${conciliacion.fecha_inicio} al ${conciliacion.fecha_fin}</p>
            <p style="color:#ef4444;font-weight:600;margin-top:12px;">También se eliminarán todos los ajustes asociados</p>
        `,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Continuar',
        cancelButtonText: 'Cancelar'
    }).then(async (result) => {
        if (result.isConfirmed) {
            // Pedir contraseña
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
                    // Primero eliminar todos los detalles asociados
                    const detalles = await fetchDetallesConciliacion(conciliacion.id);
                    for (const detalle of detalles) {
                        await peticionesFetchOffline('deleteEntry', 'detalles_conciliacion', detalle.id);
                    }

                    // Luego eliminar la conciliación
                    const envioDatos = await peticionesFetchOffline('deleteEntry', 'conciliaciones', conciliacion.id);
                    if (envioDatos[0] == 'ok') {
                        await fetchAndSetupData();
                        toast.add({ severity: 'success', summary: 'Éxito', detail: 'Conciliación eliminada correctamente', life: 3000 });
                    } else {
                        toast.add({ severity: 'error', summary: 'Error', detail: 'Error al eliminar la conciliación', life: 3000 });
                    }
                } else {
                    toast.add({ severity: 'error', summary: 'Error', detail: 'Contraseña incorrecta', life: 3000 });
                }
            }
        }
    });
}

/************************************************************************/
// Generar PDF de conciliación
async function generarPDFConciliacion(conciliacion) {
    // Cargar detalles de la conciliación
    const detalles = await fetchDetallesConciliacion(conciliacion.id);

    const empresa = datosEmpresa.empresa || {};
    const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
    });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const marginX = 14;
    const contentWidth = pageWidth - marginX * 2;

    // Header con fondo oscuro
    doc.setFillColor(139, 92, 246);
    doc.rect(0, 0, pageWidth, 35, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.setFont(undefined, 'bold');
    doc.text('REPORTE DE CONCILIACIÓN BANCARIA', pageWidth / 2, 16, { align: 'center' });
    doc.setFontSize(11);
    doc.setFont(undefined, 'normal');
    doc.text(empresa.nombre || 'Sistema de Conciliación', pageWidth / 2, 24, { align: 'center' });
    doc.text(`Fecha de generación: ${nfecha('fecha')} ${nfecha('hora')}`, pageWidth / 2, 30, { align: 'center' });

    let y = 45;

    // Información de la conciliación
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text(conciliacion.numero_conciliacion, marginX, y);
    y += 8;

    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text(`Banco: ${conciliacion.nombre_banco} - Cuenta: ${conciliacion.cuenta_banco}`, marginX, y);
    y += 6;
    doc.text(`Periodo: ${conciliacion.fecha_inicio} al ${conciliacion.fecha_fin}`, marginX, y);
    y += 10;

    // Línea separadora
    doc.setDrawColor(139, 92, 246);
    doc.setLineWidth(1);
    doc.line(marginX, y, marginX + contentWidth, y);
    y += 10;

    // Resumen de saldos
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text('RESUMEN DE SALDOS', marginX, y);
    y += 8;

    const boxHeight = 20;
    const boxWidth = (contentWidth - 10) / 3;

    // Saldo Libros
    doc.setFillColor(219, 234, 254);
    doc.roundedRect(marginX, y, boxWidth, boxHeight, 3, 3, 'F');
    doc.setDrawColor(59, 130, 246);
    doc.setLineWidth(0.5);
    doc.roundedRect(marginX, y, boxWidth, boxHeight, 3, 3, 'S');
    doc.setFontSize(9);
    doc.setTextColor(30, 64, 175);
    doc.text('SALDO SEGÚN LIBROS', marginX + boxWidth / 2, y + 7, { align: 'center' });
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text(`$${parseFloat(conciliacion.saldo_libro).toFixed(2)}`, marginX + boxWidth / 2, y + 15, { align: 'center' });

    // Saldo Banco
    doc.setFillColor(209, 250, 229);
    doc.roundedRect(marginX + boxWidth + 5, y, boxWidth, boxHeight, 3, 3, 'F');
    doc.setDrawColor(16, 185, 129);
    doc.roundedRect(marginX + boxWidth + 5, y, boxWidth, boxHeight, 3, 3, 'S');
    doc.setTextColor(6, 95, 70);
    doc.setFontSize(9);
    doc.setFont(undefined, 'normal');
    doc.text('SALDO SEGÚN BANCO', marginX + boxWidth + 5 + boxWidth / 2, y + 7, { align: 'center' });
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text(`$${parseFloat(conciliacion.saldo_banco).toFixed(2)}`, marginX + boxWidth + 5 + boxWidth / 2, y + 15, { align: 'center' });

    // Diferencia
    const diferencia = Math.abs(parseFloat(conciliacion.diferencia));
    doc.setFillColor(209, 250, 229);
    doc.roundedRect(marginX + (boxWidth + 5) * 2, y, boxWidth, boxHeight, 3, 3, 'F');
    doc.setDrawColor(16, 185, 129);
    doc.roundedRect(marginX + (boxWidth + 5) * 2, y, boxWidth, boxHeight, 3, 3, 'S');
    doc.setTextColor(6, 95, 70);
    doc.setFontSize(9);
    doc.setFont(undefined, 'normal');
    doc.text('DIFERENCIA FINAL', marginX + (boxWidth + 5) * 2 + boxWidth / 2, y + 7, { align: 'center' });
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text(`$${diferencia.toFixed(2)}`, marginX + (boxWidth + 5) * 2 + boxWidth / 2, y + 15, { align: 'center' });
    y += boxHeight + 12;

    // Estado
    doc.setFontSize(10);
    doc.setFont(undefined, 'bold');
    doc.setFillColor(209, 250, 229);
    doc.setTextColor(6, 95, 70);
    doc.roundedRect(marginX, y, 50, 8, 2, 2, 'F');
    doc.text(`ESTADO: ${conciliacion.estado}`, marginX + 25, y + 5.5, { align: 'center' });
    y += 15;

    // Ajustes realizados
    if (detalles.length > 0) {
        doc.setFontSize(12);
        doc.setFont(undefined, 'bold');
        doc.setTextColor(15, 23, 42);
        doc.text('AJUSTES REALIZADOS', marginX, y);
        y += 8;

        doc.setFontSize(9);
        doc.setFont(undefined, 'normal');

        detalles.forEach((detalle, index) => {
            // Verificar si necesitamos nueva página
            if (y > pageHeight - 40) {
                doc.addPage();
                y = 20;
            }

            // Fondo del ajuste
            doc.setFillColor(249, 250, 251);
            doc.roundedRect(marginX, y, contentWidth, 18, 2, 2, 'F');
            doc.setDrawColor(229, 231, 235);
            doc.roundedRect(marginX, y, contentWidth, 18, 2, 2, 'S');

            // Tipo y monto
            const tipoMovimiento = tiposMovimientos.value.find(t => t.value === detalle.tipo_movimiento);
            doc.setTextColor(99, 102, 241);
            doc.setFont(undefined, 'bold');
            doc.text(`${index + 1}. ${tipoMovimiento ? tipoMovimiento.label : detalle.tipo_movimiento}`, marginX + 3, y + 5);

            // Monto (derecha)
            doc.setTextColor(16, 185, 129);
            doc.setFontSize(11);
            doc.text(`$${parseFloat(detalle.monto).toFixed(2)}`, marginX + contentWidth - 3, y + 5, { align: 'right' });

            // Descripción
            doc.setFontSize(8);
            doc.setTextColor(107, 114, 128);
            doc.setFont(undefined, 'normal');
            const descripcionLineas = doc.splitTextToSize(detalle.descripcion || 'Sin descripción', contentWidth - 10);
            doc.text(descripcionLineas[0], marginX + 3, y + 10);

            // Referencia (si existe)
            if (detalle.numero_referencia) {
                doc.setTextColor(156, 163, 175);
                doc.text(`Ref: ${detalle.numero_referencia}`, marginX + 3, y + 15);
            }

            y += 20;
        });

        y += 5;
    }

    // Notas (si existen)
    if (conciliacion.notas && conciliacion.notas.trim()) {
        if (y > pageHeight - 50) {
            doc.addPage();
            y = 20;
        }

        doc.setFontSize(12);
        doc.setFont(undefined, 'bold');
        doc.setTextColor(15, 23, 42);
        doc.text('NOTAS', marginX, y);
        y += 7;

        doc.setFontSize(9);
        doc.setFont(undefined, 'normal');
        doc.setTextColor(75, 85, 99);
        const notasLineas = doc.splitTextToSize(conciliacion.notas, contentWidth);
        doc.text(notasLineas, marginX, y);
        y += notasLineas.length * 5 + 5;
    }

    // Footer
    const footerY = pageHeight - 15;
    doc.setDrawColor(139, 92, 246);
    doc.setLineWidth(0.5);
    doc.line(marginX, footerY, marginX + contentWidth, footerY);
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text(`Documento generado automáticamente - ${empresa.nombre || 'Sistema'}`, marginX, footerY + 5);
    doc.text(`Usuario: ${conciliacion.usuario}`, marginX + contentWidth, footerY + 5, { align: 'right' });

    // Mostrar PDF en Swal
    const pdfData = doc.output('datauristring');
    await Swal.fire({
        title: `Reporte - ${conciliacion.numero_conciliacion}`,
        width: '85%',
        html: `<embed src="${pdfData}#toolbar=1" type="application/pdf" width="100%" height="600px" />`,
        showCancelButton: true,
        cancelButtonText: 'Cerrar',
        confirmButtonText: 'Descargar PDF',
        confirmButtonColor: '#8b5cf6',
        preConfirm: () => {
            doc.save(`Conciliacion_${conciliacion.numero_conciliacion}_${nfecha('fecha')}.pdf`);
        }
    });
}

/************************************************************************/
const filteredConciliaciones = computed(() => {
    let resultado = data.value;

    // Filtrar por banco
    if (bancoSeleccionado.value) {
        resultado = resultado.filter(c => c.nombre_banco === bancoSeleccionado.value.nombre);
    }

    // Filtrar por estado
    if (estadoSeleccionado.value) {
        resultado = resultado.filter(c => c.estado === estadoSeleccionado.value);
    }

    // Filtrar por búsqueda
    if (searchQuery.value) {
        resultado = resultado.filter(c => {
            return Object.values(c).some(value =>
                String(value).toLowerCase().includes(searchQuery.value.toLowerCase())
            );
        });
    }

    return resultado;
});

/************************************************************************/
const getEstadoSeverity = (estado) => {
    switch (estado) {
        case 'PENDIENTE': return 'warn';
        case 'EN_PROCESO': return 'info';
        case 'CONCILIADA': return 'success';
        case 'AJUSTADA': return 'secondary';
        default: return 'info';
    }
};

const getRowClass = (data) => {
    if (data.estado === 'CONCILIADA') {
        return 'row-conciliada';
    } else if (data.estado === 'EN_PROCESO') {
        return 'row-proceso';
    }
    return '';
};

/************************************************************************/
// Estadísticas
const totalConciliaciones = computed(() => filteredConciliaciones.value.length);
const conciliadasCount = computed(() => filteredConciliaciones.value.filter(c => c.estado === 'CONCILIADA').length);
const pendientesCount = computed(() => filteredConciliaciones.value.filter(c => c.estado === 'PENDIENTE').length);
const enProcesoCount = computed(() => filteredConciliaciones.value.filter(c => c.estado === 'EN_PROCESO').length);

/************************************************************************/
// Watch para actualizar cuenta del banco seleccionado
watch(() => nuevaConciliacion.value.banco, (nuevoBanco) => {
    if (nuevoBanco) {
        // Auto-cargar saldo actual del banco como sugerencia
        // El usuario puede modificarlo según el extracto bancario
    }
});

/************************************************************************/
// Computed para diferencia ajustada
const diferenciaAjustada = computed(() => {
    if (!conciliacionActual.value) return 0;

    const totalAjustes = detallesConciliacion.value.reduce((sum, d) => {
        const monto = parseFloat(d.monto) || 0;
        if (d.tipo_movimiento === 'CHEQUE_EN_TRANSITO' || d.tipo_movimiento === 'COMISION_BANCARIA') {
            return sum + monto;
        } else if (d.tipo_movimiento === 'DEPOSITO_EN_TRANSITO') {
            return sum - monto;
        }
        return sum;
    }, 0);

    return (parseFloat(conciliacionActual.value.diferencia) - totalAjustes).toFixed(2);
});

/************************************************************************/
</script>

<template>
    <main class="conciliaciones-wrapper">
        <div class="container-conciliaciones mx-auto px-4 py-6">

            <!-- Header Section -->
            <div class="header-section mb-6">
                <div class="flex items-center justify-between">
                    <div class="flex items-center gap-4">
                        <div class="header-icon">
                            <i class="pi pi-calculator"></i>
                        </div>
                        <div>
                            <h1 class="text-3xl font-bold text-gray-800">Conciliaciones Bancarias</h1>
                            <p class="text-gray-600">Concilia los saldos bancarios con los registros contables</p>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Stats Cards -->
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                <div class="stat-card stat-total">
                    <div class="stat-icon">
                        <i class="pi pi-list"></i>
                    </div>
                    <div class="stat-content">
                        <div class="stat-label">Total Conciliaciones</div>
                        <div class="stat-value">{{ totalConciliaciones }}</div>
                        <div class="stat-sublabel">Registros</div>
                    </div>
                </div>

                <div class="stat-card stat-conciliadas">
                    <div class="stat-icon">
                        <i class="pi pi-check-circle"></i>
                    </div>
                    <div class="stat-content">
                        <div class="stat-label">Conciliadas</div>
                        <div class="stat-value">{{ conciliadasCount }}</div>
                        <div class="stat-sublabel">Completadas</div>
                    </div>
                </div>

                <div class="stat-card stat-proceso">
                    <div class="stat-icon">
                        <i class="pi pi-spin pi-spinner"></i>
                    </div>
                    <div class="stat-content">
                        <div class="stat-label">En Proceso</div>
                        <div class="stat-value">{{ enProcesoCount }}</div>
                        <div class="stat-sublabel">En trabajo</div>
                    </div>
                </div>

                <div class="stat-card stat-pendientes">
                    <div class="stat-icon">
                        <i class="pi pi-clock"></i>
                    </div>
                    <div class="stat-content">
                        <div class="stat-label">Pendientes</div>
                        <div class="stat-value">{{ pendientesCount }}</div>
                        <div class="stat-sublabel">Por iniciar</div>
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
                            <Button icon="pi pi-plus" label="Nueva Conciliación"
                                @click="limpiarFormularioCrear(); visibleCrear = true" severity="success"
                                class="action-btn" />
                        </div>

                        <div class="flex flex-wrap gap-2">
                            <Button icon="pi pi-building" label="Ver Bancos" @click="router.push('/banco')"
                                severity="info" class="action-btn" />
                            <Button icon="pi pi-arrows-h" label="Transacciones"
                                @click="router.push('/transaccionesbancarias')" severity="secondary"
                                class="action-btn" />
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
                            <Select v-model="estadoSeleccionado" :options="estadosOpciones"
                                placeholder="Filtrar por estado" showClear class="estado-filter" />
                        </div>
                        <IconField iconPosition="left">
                            <InputIcon class="pi pi-search" />
                            <InputText v-model="searchQuery" placeholder="Buscar conciliaciones..."
                                class="search-input" />
                        </IconField>
                    </div>

                    <DataTable :value="filteredConciliaciones" scrollable scrollHeight="600px" dataKey="id"
                        paginator :rows="10" :rowClass="getRowClass" v-model:selection="selectedItems"
                        :rowsPerPageOptions="[5, 10, 20, 50]" class="modern-datatable">

                        <Column field="numero_conciliacion" header="# Conciliación" sortable :style="{ minWidth: '160px' }">
                            <template #body="slotProps">
                                <div class="flex items-center gap-2">
                                    <i class="pi pi-calculator text-blue-600"></i>
                                    <span class="font-bold">{{ slotProps.data.numero_conciliacion }}</span>
                                </div>
                            </template>
                        </Column>

                        <Column field="nombre_banco" header="Banco" :style="{ minWidth: '180px' }">
                            <template #body="slotProps">
                                <div class="banco-cell">
                                    <i class="pi pi-building mr-2 text-blue-600"></i>
                                    {{ slotProps.data.nombre_banco }}
                                </div>
                            </template>
                        </Column>

                        <Column field="fecha_inicio" header="Fecha Inicio" :style="{ minWidth: '130px' }">
                            <template #body="slotProps">
                                <div class="fecha-cell">
                                    <i class="pi pi-calendar mr-2"></i>
                                    {{ slotProps.data.fecha_inicio }}
                                </div>
                            </template>
                        </Column>

                        <Column field="fecha_fin" header="Fecha Fin" :style="{ minWidth: '130px' }">
                            <template #body="slotProps">
                                <div class="fecha-cell">
                                    <i class="pi pi-calendar mr-2"></i>
                                    {{ slotProps.data.fecha_fin }}
                                </div>
                            </template>
                        </Column>

                        <Column field="saldo_libro" header="Saldo Libro" :style="{ minWidth: '150px' }">
                            <template #body="slotProps">
                                <div class="saldo-badge saldo-libro">
                                    <i class="pi pi-book mr-2"></i>
                                    ${{ parseFloat(slotProps.data.saldo_libro).toFixed(2) }}
                                </div>
                            </template>
                        </Column>

                        <Column field="saldo_banco" header="Saldo Banco" :style="{ minWidth: '150px' }">
                            <template #body="slotProps">
                                <div class="saldo-badge saldo-banco">
                                    <i class="pi pi-building mr-2"></i>
                                    ${{ parseFloat(slotProps.data.saldo_banco).toFixed(2) }}
                                </div>
                            </template>
                        </Column>

                        <Column field="diferencia" header="Diferencia" :style="{ minWidth: '150px' }">
                            <template #body="slotProps">
                                <div class="diferencia-badge"
                                    :class="{
                                        'diferencia-positiva': parseFloat(slotProps.data.diferencia) > 0,
                                        'diferencia-negativa': parseFloat(slotProps.data.diferencia) < 0,
                                        'diferencia-cero': Math.abs(parseFloat(slotProps.data.diferencia)) < 0.01
                                    }">
                                    <i class="pi mr-2"
                                        :class="{
                                            'pi-exclamation-triangle': Math.abs(parseFloat(slotProps.data.diferencia)) >= 0.01,
                                            'pi-check-circle': Math.abs(parseFloat(slotProps.data.diferencia)) < 0.01
                                        }"></i>
                                    ${{ parseFloat(slotProps.data.diferencia).toFixed(2) }}
                                </div>
                            </template>
                        </Column>

                        <Column field="estado" header="Estado" :style="{ minWidth: '130px' }">
                            <template #body="slotProps">
                                <Tag :value="slotProps.data.estado"
                                    :severity="getEstadoSeverity(slotProps.data.estado)" />
                            </template>
                        </Column>

                        <Column header="Opciones" frozen :style="{ width: '120px' }">
                            <template #body="slotProps">
                                <Button icon="pi pi-ellipsis-v" @click="toggleConciliacion($event, slotProps.data)"
                                    severity="secondary" size="small" rounded />
                                <Menu ref="menu" :model="itemsConciliacion" :popup="true" />
                            </template>
                        </Column>

                    </DataTable>
                </template>
            </Card>

        </div>

        <!-- Modal: Crear Conciliación -->
        <Dialog v-model:visible="visibleCrear" modal header="Nueva Conciliación Bancaria"
            :style="{ width: '700px' }">
            <template #header>
                <div class="flex items-center gap-3">
                    <i class="pi pi-plus-circle text-2xl text-green-600"></i>
                    <div>
                        <h3 class="text-xl font-bold">Nueva Conciliación Bancaria</h3>
                        <p class="text-sm text-gray-500">Complete los datos para crear la conciliación</p>
                    </div>
                </div>
            </template>

            <div class="space-y-4 mt-4">
                <div class="form-field-modern">
                    <label class="field-label-modern">
                        <i class="pi pi-building mr-2"></i>
                        Banco
                    </label>
                    <Select v-model="nuevaConciliacion.banco" :options="bancos" optionLabel="nombre"
                        placeholder="Seleccione el banco" class="w-full">
                        <template #value="slotProps">
                            <div v-if="slotProps.value" class="flex items-center gap-2">
                                <i class="pi pi-building text-blue-600"></i>
                                <span>{{ slotProps.value.nombre }} - {{ slotProps.value.cuenta }}</span>
                            </div>
                            <span v-else>{{ slotProps.placeholder }}</span>
                        </template>
                        <template #option="slotProps">
                            <div class="flex items-center justify-between w-full">
                                <div class="flex items-center gap-2">
                                    <i class="pi pi-building text-blue-600"></i>
                                    <div>
                                        <div class="font-semibold">{{ slotProps.option.nombre }}</div>
                                        <div class="text-sm text-gray-500">{{ slotProps.option.cuenta }}</div>
                                    </div>
                                </div>
                                <span class="text-green-600 font-bold">${{
                                    parseFloat(slotProps.option.saldo).toFixed(2) }}</span>
                            </div>
                        </template>
                    </Select>
                </div>

                <div class="grid grid-cols-2 gap-4">
                    <div class="form-field-modern">
                        <label class="field-label-modern">
                            <i class="pi pi-calendar mr-2"></i>
                            Fecha Inicio del Periodo
                        </label>
                        <InputText v-model="nuevaConciliacion.fecha_inicio" v-datepicker
                            class="modern-input w-full" placeholder="DD/MM/AAAA" />
                    </div>

                    <div class="form-field-modern">
                        <label class="field-label-modern">
                            <i class="pi pi-calendar mr-2"></i>
                            Fecha Fin del Periodo
                        </label>
                        <InputText v-model="nuevaConciliacion.fecha_fin" v-datepicker class="modern-input w-full"
                            placeholder="DD/MM/AAAA" />
                    </div>
                </div>

                <div class="form-field-modern">
                    <label class="field-label-modern">
                        <i class="pi pi-dollar mr-2"></i>
                        Saldo Según el Banco (Extracto Bancario)
                    </label>
                    <InputText v-model="nuevaConciliacion.saldo_banco" v-solonumeros v-decimales
                        v-numeroFocusinOut class="modern-input w-full saldo-input" placeholder="0.00" />
                    <small class="text-gray-500">Ingrese el saldo que aparece en el extracto bancario al final
                        del periodo</small>
                </div>

                <div class="form-field-modern">
                    <label class="field-label-modern">
                        <i class="pi pi-align-left mr-2"></i>
                        Notas (opcional)
                    </label>
                    <Textarea v-model="nuevaConciliacion.notas" rows="3" class="w-full modern-input"
                        placeholder="Notas adicionales sobre esta conciliación..." />
                </div>
            </div>

            <template #footer>
                <Button label="Cancelar" severity="secondary" outlined @click="visibleCrear = false" />
                <Button label="Crear Conciliación" severity="success" icon="pi pi-check"
                    @click="crearConciliacion" />
            </template>
        </Dialog>

        <!-- Modal: Gestionar Conciliación -->
        <Dialog v-model:visible="visibleGestionar" modal header="Gestionar Conciliación"
            :style="{ width: '95vw', maxWidth: '1400px' }" :maximizable="true">
            <template #header>
                <div class="flex items-center justify-between w-full pr-12">
                    <div class="flex items-center gap-3">
                        <i class="pi pi-cog text-2xl text-blue-600"></i>
                        <div>
                            <h3 class="text-xl font-bold">{{ conciliacionActual?.numero_conciliacion }}</h3>
                            <p class="text-sm text-gray-500">{{ conciliacionActual?.nombre_banco }} - {{
                                conciliacionActual?.fecha_inicio }} al {{ conciliacionActual?.fecha_fin }}</p>
                        </div>
                    </div>
                    <Tag :value="conciliacionActual?.estado"
                        :severity="getEstadoSeverity(conciliacionActual?.estado)" />
                </div>
            </template>

            <div class="grid grid-cols-12 gap-6">
                <!-- Panel Izquierdo: Resumen y Ajustes -->
                <div class="col-span-12 lg:col-span-7">
                    <!-- Resumen de Conciliación -->
                    <Card class="mb-4">
                        <template #title>
                            <div class="flex items-center gap-2">
                                <i class="pi pi-chart-bar text-blue-600"></i>
                                <span>Resumen de Conciliación</span>
                            </div>
                        </template>
                        <template #content>
                            <div class="grid grid-cols-3 gap-4">
                                <div class="resumen-item">
                                    <div class="resumen-label">
                                        <i class="pi pi-book mr-2"></i>Saldo según Libros
                                    </div>
                                    <div class="resumen-value libro">${{
                                        parseFloat(conciliacionActual?.saldo_libro || 0).toFixed(2) }}</div>
                                </div>
                                <div class="resumen-item">
                                    <div class="resumen-label">
                                        <i class="pi pi-building mr-2"></i>Saldo según Banco
                                    </div>
                                    <div class="resumen-value banco">${{
                                        parseFloat(conciliacionActual?.saldo_banco || 0).toFixed(2) }}</div>
                                </div>
                                <div class="resumen-item">
                                    <div class="resumen-label">
                                        <i class="pi pi-exclamation-triangle mr-2"></i>Diferencia Ajustada
                                    </div>
                                    <div class="resumen-value diferencia"
                                        :class="{
                                            'positiva': parseFloat(diferenciaAjustada) > 0,
                                            'negativa': parseFloat(diferenciaAjustada) < 0,
                                            'cero': Math.abs(parseFloat(diferenciaAjustada)) < 0.01
                                        }">
                                        ${{ diferenciaAjustada }}
                                    </div>
                                </div>
                            </div>
                        </template>
                    </Card>

                    <!-- Guía de Ayuda -->
                    <Card class="mb-4 ayuda-card">
                        <template #title>
                            <div class="flex items-center gap-2">
                                <i class="pi pi-question-circle text-blue-600"></i>
                                <span>¿Cómo conciliar?</span>
                            </div>
                        </template>
                        <template #content>
                            <div class="text-sm space-y-2">
                                <p class="font-semibold text-gray-700">
                                    <i class="pi pi-info-circle mr-2 text-blue-600"></i>
                                    El objetivo es llevar la <strong class="text-red-600">Diferencia a $0.00</strong>
                                </p>
                                <div class="pl-6 space-y-1 text-gray-600">
                                    <p><strong class="text-green-600">• SUMA:</strong> Cuando el banco registró MÁS dinero (ingresos no registrados, intereses, etc.)</p>
                                    <p><strong class="text-red-600">• RESTA:</strong> Cuando el banco registró MENOS dinero (comisiones, cheques sin cobrar, etc.)</p>
                                </div>
                                <p class="text-xs text-gray-500 pt-2 border-t">
                                    💡 Tip: Lee la descripción de cada tipo de ajuste antes de agregarlo
                                </p>
                            </div>
                        </template>
                    </Card>

                    <!-- Agregar Nuevo Ajuste -->
                    <Card class="mb-4">
                        <template #title>
                            <div class="flex items-center gap-2">
                                <i class="pi pi-plus-circle text-green-600"></i>
                                <span>Agregar Ajuste</span>
                            </div>
                        </template>
                        <template #content>
                            <div class="grid grid-cols-1 gap-3">
                                <Select v-model="nuevoDetalle.tipo_movimiento" :options="tiposMovimientos"
                                    optionLabel="label" placeholder="Seleccione tipo de ajuste" class="w-full">
                                    <template #value="slotProps">
                                        <div v-if="slotProps.value" class="flex items-center gap-2">
                                            <i :class="slotProps.value.icon"></i>
                                            <span>{{ slotProps.value.label }}</span>
                                            <Tag :value="slotProps.value.efecto === 'SUMA' ? 'SUMA' : 'RESTA'"
                                                :severity="slotProps.value.efecto === 'SUMA' ? 'success' : 'danger'"
                                                class="ml-2" />
                                        </div>
                                        <span v-else>{{ slotProps.placeholder }}</span>
                                    </template>
                                    <template #option="slotProps">
                                        <div class="flex flex-col gap-1 py-2">
                                            <div class="flex items-center gap-2">
                                                <i :class="slotProps.option.icon"></i>
                                                <span class="font-semibold">{{ slotProps.option.label }}</span>
                                                <Tag :value="slotProps.option.efecto === 'SUMA' ? 'SUMA' : 'RESTA'"
                                                    :severity="slotProps.option.efecto === 'SUMA' ? 'success' : 'danger'"
                                                    size="small" />
                                            </div>
                                            <small class="text-gray-600 ml-6">{{ slotProps.option.descripcion }}</small>
                                        </div>
                                    </template>
                                </Select>

                                <!-- Ayuda visual sobre el tipo seleccionado -->
                                <div v-if="nuevoDetalle.tipo_movimiento" class="info-box"
                                    :class="nuevoDetalle.tipo_movimiento.efecto === 'SUMA' ? 'info-box-success' : 'info-box-danger'">
                                    <i class="pi mr-2"
                                        :class="nuevoDetalle.tipo_movimiento.efecto === 'SUMA' ? 'pi-arrow-up' : 'pi-arrow-down'"></i>
                                    <div class="flex-1">
                                        <strong>{{ nuevoDetalle.tipo_movimiento.efecto === 'SUMA' ? 'SUMA a la diferencia' : 'RESTA de la diferencia' }}</strong>
                                        <p class="text-sm mt-1">{{ nuevoDetalle.tipo_movimiento.descripcion }}</p>
                                    </div>
                                </div>

                                <div class="grid grid-cols-2 gap-3">
                                    <InputText v-model="nuevoDetalle.numero_referencia"
                                        placeholder="# Referencia (opcional)" />
                                    <InputText v-model="nuevoDetalle.monto" v-solonumeros v-decimales
                                        v-numeroFocusinOut placeholder="Monto" />
                                </div>

                                <Textarea v-model="nuevoDetalle.descripcion" rows="2"
                                    placeholder="Descripción del ajuste..." />

                                <Textarea v-model="nuevoDetalle.accion_tomada" rows="2"
                                    placeholder="Acción tomada (opcional)..." />

                                <Button label="Agregar Ajuste" icon="pi pi-plus" severity="success"
                                    @click="agregarAjuste" class="w-full" />
                            </div>
                        </template>
                    </Card>

                    <!-- Lista de Ajustes Realizados -->
                    <Card>
                        <template #title>
                            <div class="flex items-center justify-between">
                                <div class="flex items-center gap-2">
                                    <i class="pi pi-list text-purple-600"></i>
                                    <span>Ajustes Realizados ({{ detallesConciliacion.length }})</span>
                                </div>
                            </div>
                        </template>
                        <template #content>
                            <div v-if="detallesConciliacion.length === 0" class="text-center py-8 text-gray-500">
                                <i class="pi pi-inbox text-4xl mb-3"></i>
                                <p>No se han realizado ajustes aún</p>
                            </div>
                            <div v-else class="space-y-2">
                                <div v-for="detalle in detallesConciliacion" :key="detalle.id"
                                    class="ajuste-item">
                                    <div class="flex justify-between items-start">
                                        <div class="flex-1">
                                            <div class="flex items-center gap-2 mb-1">
                                                <Tag :value="detalle.tipo_movimiento" severity="info" />
                                                <span v-if="detalle.numero_referencia"
                                                    class="text-sm text-gray-600">#{{
                                                        detalle.numero_referencia }}</span>
                                            </div>
                                            <p class="font-semibold text-gray-800">{{ detalle.descripcion }}</p>
                                            <p v-if="detalle.accion_tomada" class="text-sm text-gray-600 mt-1">
                                                <i class="pi pi-check-circle mr-1"></i>{{ detalle.accion_tomada
                                                }}</p>
                                        </div>
                                        <div class="flex items-center gap-3">
                                            <div class="text-right">
                                                <div class="text-lg font-bold text-green-600">${{
                                                    parseFloat(detalle.monto).toFixed(2) }}</div>
                                                <div class="text-xs text-gray-500">{{ detalle.usuario }}</div>
                                            </div>
                                            <Button icon="pi pi-trash" severity="danger" text rounded
                                                @click="eliminarDetalle(detalle)" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </template>
                    </Card>
                </div>

                <!-- Panel Derecho: Cheques y Transacciones del Periodo -->
                <div class="col-span-12 lg:col-span-5">
                    <!-- Cheques Pendientes en el Periodo -->
                    <Card class="mb-4">
                        <template #title>
                            <div class="flex items-center gap-2">
                                <i class="pi pi-file-edit text-orange-600"></i>
                                <span>Cheques Pendientes ({{ chequesEnPeriodo.length }})</span>
                            </div>
                        </template>
                        <template #content>
                            <div v-if="chequesEnPeriodo.length === 0" class="text-center py-4 text-gray-500">
                                <i class="pi pi-inbox text-3xl mb-2"></i>
                                <p class="text-sm">No hay cheques pendientes en este periodo</p>
                            </div>
                            <div v-else class="space-y-2 max-h-80 overflow-y-auto">
                                <div v-for="cheque in chequesEnPeriodo" :key="cheque.id" class="cheque-item">
                                    <div class="flex justify-between items-center">
                                        <div class="flex-1">
                                            <div class="flex items-center gap-2 mb-1">
                                                <i class="pi pi-file-edit text-blue-600"></i>
                                                <span class="font-bold">{{ cheque.numero_cheque }}</span>
                                            </div>
                                            <p class="text-sm text-gray-700">{{ cheque.beneficiario }}</p>
                                            <p class="text-xs text-gray-500">{{ cheque.fecha_emision }}</p>
                                        </div>
                                        <div class="text-right">
                                            <div class="font-bold text-blue-600 mb-1">${{
                                                parseFloat(cheque.monto).toFixed(2) }}</div>
                                            <Button label="En Tránsito" icon="pi pi-arrow-right" size="small"
                                                severity="warning" @click="marcarChequeEnTransito(cheque)" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </template>
                    </Card>

                    <!-- Transacciones del Periodo -->
                    <Card>
                        <template #title>
                            <div class="flex items-center gap-2">
                                <i class="pi pi-arrows-h text-blue-600"></i>
                                <span>Transacciones ({{ transaccionesEnPeriodo.length }})</span>
                            </div>
                        </template>
                        <template #content>
                            <div v-if="transaccionesEnPeriodo.length === 0"
                                class="text-center py-4 text-gray-500">
                                <i class="pi pi-inbox text-3xl mb-2"></i>
                                <p class="text-sm">No hay transacciones en este periodo</p>
                            </div>
                            <div v-else class="space-y-2 max-h-96 overflow-y-auto">
                                <div v-for="trans in transaccionesEnPeriodo" :key="trans.id"
                                    class="transaccion-item">
                                    <div class="flex justify-between items-start">
                                        <div class="flex-1">
                                            <div class="flex items-center gap-2 mb-1">
                                                <Tag :value="trans.tipo" :severity="trans.tipo === 'DEPOSITO' ? 'success' : trans.tipo === 'RETIRO' ? 'danger' : 'warning'
                                                    " />
                                                <span class="text-xs text-gray-500">{{ trans.fecha }} {{
                                                    trans.hora }}</span>
                                            </div>
                                            <p class="text-sm text-gray-700">{{ trans.descripcion || 'Sin descripción' }}</p>
                                            <p class="text-xs text-gray-500">{{ trans.metodo }}</p>
                                        </div>
                                        <div class="text-right">
                                            <div class="font-bold" :class="{
                                                'text-green-600': trans.tipo === 'DEPOSITO',
                                                'text-red-600': trans.tipo === 'RETIRO',
                                                'text-orange-600': trans.tipo === 'TRANSFERENCIA'
                                            }">
                                                ${{ parseFloat(trans.monto).toFixed(2) }}
                                            </div>
                                            <div class="text-xs text-gray-500">Balance: ${{
                                                parseFloat(trans.balance_actual).toFixed(2) }}</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </template>
                    </Card>
                </div>
            </div>

            <template #footer>
                <div class="flex justify-between items-center w-full">
                    <div class="text-lg font-bold"
                        :class="{
                            'text-green-600': Math.abs(parseFloat(diferenciaAjustada)) < 0.01,
                            'text-red-600': Math.abs(parseFloat(diferenciaAjustada)) >= 0.01
                        }">
                        Diferencia: ${{ diferenciaAjustada }}
                        <i v-if="Math.abs(parseFloat(diferenciaAjustada)) < 0.01"
                            class="pi pi-check-circle ml-2"></i>
                    </div>
                    <div class="flex gap-2">
                        <Button label="Cerrar" severity="secondary" outlined @click="visibleGestionar = false" />
                        <Button label="Finalizar Conciliación" severity="success" icon="pi pi-check"
                            @click="finalizarConciliacion"
                            :disabled="Math.abs(parseFloat(diferenciaAjustada)) >= 0.01" />
                    </div>
                </div>
            </template>
        </Dialog>

        <Toast />
    </main>
</template>

<style scoped>
/* ===================================
   CONCILIACIONES BANCARIAS STYLES
   =================================== */

.conciliaciones-wrapper {
    min-height: calc(100vh - 80px);
    background: linear-gradient(135deg, rgba(243, 244, 246, 1) 0%, rgba(249, 250, 251, 1) 100%);
}

.container-conciliaciones {
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
    background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 2.5rem;
    color: white;
    box-shadow: 0 8px 20px rgba(139, 92, 246, 0.3);
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
    border-color: #3b82f6;
    background: linear-gradient(135deg, rgba(59, 130, 246, 0.05) 0%, rgba(37, 99, 235, 0.02) 100%);
}

.stat-conciliadas {
    border-color: #10b981;
    background: linear-gradient(135deg, rgba(16, 185, 129, 0.05) 0%, rgba(5, 150, 105, 0.02) 100%);
}

.stat-proceso {
    border-color: #0ea5e9;
    background: linear-gradient(135deg, rgba(14, 165, 233, 0.05) 0%, rgba(2, 132, 199, 0.02) 100%);
}

.stat-pendientes {
    border-color: #f59e0b;
    background: linear-gradient(135deg, rgba(245, 158, 11, 0.05) 0%, rgba(217, 119, 6, 0.02) 100%);
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
    background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
    color: white;
}

.stat-conciliadas .stat-icon {
    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
    color: white;
}

.stat-proceso .stat-icon {
    background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%);
    color: white;
}

.stat-pendientes .stat-icon {
    background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
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
    border-color: #8b5cf6;
    box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.1);
}

.banco-filter,
.estado-filter {
    min-width: 200px;
    border: 2px solid #e5e7eb;
    border-radius: 10px;
    transition: all 0.3s ease;
}

.banco-filter:hover,
.estado-filter:hover {
    border-color: #8b5cf6;
}

:deep(.banco-filter .p-select-label),
:deep(.estado-filter .p-select-label) {
    padding: 0.75rem 1rem;
}

.modern-datatable :deep(.p-datatable-thead>tr>th) {
    background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
    color: white;
    font-weight: 700;
    padding: 1rem;
    border: none;
}

.modern-datatable :deep(.p-datatable-tbody>tr) {
    transition: all 0.2s ease;
}

.modern-datatable :deep(.p-datatable-tbody>tr:hover) {
    background: rgba(139, 92, 246, 0.05);
}

/* Row Colors */
:deep(.row-conciliada) {
    background: rgba(16, 185, 129, 0.03) !important;
    border-left: 4px solid #10b981;
}

:deep(.row-proceso) {
    background: rgba(14, 165, 233, 0.03) !important;
    border-left: 4px solid #0ea5e9;
}

/* Custom Badges */
.banco-cell,
.fecha-cell {
    display: flex;
    align-items: center;
    font-weight: 600;
    color: #374151;
}

.saldo-badge {
    display: inline-flex;
    align-items: center;
    padding: 0.5rem 1rem;
    border-radius: 8px;
    font-weight: 700;
    font-size: 1.05rem;
    border: 2px solid;
}

.saldo-libro {
    background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
    border-color: #3b82f6;
    color: #1e40af;
}

.saldo-banco {
    background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
    border-color: #10b981;
    color: #065f46;
}

.diferencia-badge {
    display: inline-flex;
    align-items: center;
    padding: 0.5rem 1rem;
    border-radius: 8px;
    font-weight: 700;
    font-size: 1.05rem;
    border: 2px solid;
}

.diferencia-positiva {
    background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
    border-color: #f59e0b;
    color: #92400e;
}

.diferencia-negativa {
    background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);
    border-color: #ef4444;
    color: #991b1b;
}

.diferencia-cero {
    background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
    border-color: #10b981;
    color: #065f46;
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

.modern-input {
    border: 2px solid #e5e7eb;
    border-radius: 10px;
    padding: 0.75rem;
    font-size: 0.95rem;
    transition: all 0.3s ease;
}

.modern-input:focus {
    border-color: #8b5cf6;
    box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.1);
    outline: none;
}

.saldo-input {
    font-weight: 700;
    font-size: 1.1rem;
    color: #10b981;
}

/* Resumen Items */
.resumen-item {
    background: linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%);
    border-radius: 12px;
    padding: 1rem;
    text-align: center;
    border: 2px solid #e5e7eb;
}

.resumen-label {
    font-size: 0.875rem;
    font-weight: 600;
    color: #6b7280;
    margin-bottom: 0.5rem;
    display: flex;
    align-items: center;
    justify-content: center;
}

.resumen-value {
    font-size: 1.75rem;
    font-weight: 800;
    line-height: 1;
}

.resumen-value.libro {
    color: #3b82f6;
}

.resumen-value.banco {
    color: #10b981;
}

.resumen-value.diferencia.positiva {
    color: #f59e0b;
}

.resumen-value.diferencia.negativa {
    color: #ef4444;
}

.resumen-value.diferencia.cero {
    color: #10b981;
}

/* Ajustes y Cheques Items */
.ajuste-item,
.cheque-item,
.transaccion-item {
    background: white;
    border: 2px solid #e5e7eb;
    border-radius: 10px;
    padding: 1rem;
    transition: all 0.2s ease;
}

.ajuste-item:hover,
.cheque-item:hover,
.transaccion-item:hover {
    border-color: #8b5cf6;
    box-shadow: 0 2px 8px rgba(139, 92, 246, 0.1);
}

/* Ayuda Card */
.ayuda-card {
    background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
    border: 2px solid #3b82f6;
}

.ayuda-card :deep(.p-card-title) {
    color: #1e40af;
    font-size: 1rem;
}

.ayuda-card :deep(.p-card-body) {
    padding: 1rem;
}

/* Info Boxes para tipos de ajuste */
.info-box {
    display: flex;
    align-items: start;
    gap: 0.75rem;
    padding: 1rem;
    border-radius: 10px;
    border: 2px solid;
    font-size: 0.875rem;
}

.info-box-success {
    background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
    border-color: #10b981;
    color: #065f46;
}

.info-box-danger {
    background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);
    border-color: #ef4444;
    color: #991b1b;
}

.info-box i {
    font-size: 1.25rem;
    margin-top: 0.125rem;
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

    .resumen-value {
        font-size: 1.25rem;
    }
}
</style>
