<script setup>
import { ref, onMounted, nextTick, watchEffect, computed, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
const router = useRouter();
import axios from 'axios';
import { enviarDatosPorPost, eliminarDatos, obtenerIdsSeleccionados, borrarTodoslosDatos, lenguajeDataTable, nfecha, arrayToObjetoFromTabla, peticionesFetch, encryptarPassword, envioElectron, mensajetoast, crearTablaSiNoExiste, peticiones, lasMayusculas, enviarDatosLocalStorage, peticionesFetchOffline, arrayToObjetoFromTablaOffline, crearTablaSiNoExisteOffline } from '../../funciones/funciones.js';
import Swal from 'sweetalert2'
import { useToast } from "primevue/usetoast";
import SelectButton from 'primevue/selectbutton';
import jsPDF from 'jspdf';
const toast = useToast();
/************************************************************************/
/************************************************************************/
const usuarioLocal = ref({})
/************************************************************************/
const camposArray = ["numero_cheque", "banco", "cuenta_banco", "beneficiario", "monto", "fecha_emision", "fecha_cobro", "concepto", "estado", "usuario"];
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
const datoscamposCheques = ref({})
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
const estadoSeleccionado = ref(null);
const cuentasContables = ref([]);
const beneficiarioMode = ref('MANUAL');
const cuentaContableSeleccionada = ref(null);
const beneficiarioModeEdit = ref('MANUAL');
const cuentaContableSeleccionadaEdit = ref(null);
/************************************************************************/
const estadosOpciones = ref(['PENDIENTE', 'COBRADO', 'ANULADO', 'DEVUELTO']);
/************************************************************************/
async function limpiarCamposCrear() {
    datoscamposCheques.value = {}
    await campos();
    datoscamposCheques.value.estado = 'PENDIENTE';
    datoscamposCheques.value.fecha_emision = nfecha('fecha');
    datoscamposCheques.value.usuario = usuarioLocal.value.usuario || '';
    beneficiarioMode.value = 'MANUAL';
    cuentaContableSeleccionada.value = null;
}
/************************************************************************/
watchEffect(() => {
    if (visiblecrear.value) {
    }
});
/************************************************************************/
const fetchAndSetupData = async () => {
    const response = await peticionesFetchOffline('getDataAsArray', 'cheques');
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
    const campos = await arrayToObjetoFromTablaOffline('cheques');
    datoscamposCheques.value = campos;
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
    await crearTablaSiNoExisteOffline('cheques', camposArray.join(','), toast);
    usuarioLocal.value = JSON.parse(window.localStorage.getItem('usuarioLocal'))[0] || {};
    await fetchAndSetupData();
    await fetchBancos();
    await fetchCuentas();
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
                    const envioDatos = await peticionesFetchOffline('deleteAll', 'cheques');
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
    const envioDatos = await peticionesFetchOffline('updateData', 'cheques', JSON.stringify(datoscampos.value));
    if (envioDatos[0] == 'ok') {
        visible.value = false;
        fetchAndSetupData();
        toast.add({ severity: 'success', summary: 'Éxito', detail: 'Cheque Actualizado', life: 3000 });
    } else {
        toast.add({ severity: 'error', summary: 'Error', detail: 'Fallo al actualizar el cheque.', life: 3000 });
    }
}
/************************************************************************/
async function funcionCrear() {
    // Validaciones
    if (!datoscamposCheques.value.numero_cheque) {
        toast.add({ severity: 'warn', summary: 'Atención', detail: 'Ingrese el número de cheque', life: 3000 });
        return;
    }
    if (!datoscamposCheques.value.banco) {
        toast.add({ severity: 'warn', summary: 'Atención', detail: 'Seleccione el banco', life: 3000 });
        return;
    }
    if (!datoscamposCheques.value.monto || parseFloat(datoscamposCheques.value.monto) <= 0) {
        toast.add({ severity: 'warn', summary: 'Atención', detail: 'Ingrese un monto válido', life: 3000 });
        return;
    }
    if (!datoscamposCheques.value.beneficiario) {
        toast.add({ severity: 'warn', summary: 'Atención', detail: 'Ingrese el beneficiario', life: 3000 });
        return;
    }
    if (!datoscamposCheques.value.concepto) {
        toast.add({ severity: 'warn', summary: 'Atención', detail: 'Ingrese el concepto', life: 3000 });
        return;
    }

    if (datoscamposCheques.value.hasOwnProperty('created_at')) {
        datoscamposCheques.value.created_at = nfecha('timestamp');
        datoscamposCheques.value.updated_at = nfecha('timestamp');
    }
    datoscamposCheques.value.usuario = usuarioLocal.value.usuario || '';

    const envioDatos = await peticionesFetchOffline('insertData', 'cheques', JSON.stringify(datoscamposCheques.value));
    if (envioDatos[0] == 'ok') {
        fetchAndSetupData();
        toast.add({ severity: 'success', summary: 'Éxito', detail: 'Cheque Registrado', life: 3000 });
        limpiarCamposCrear();
        visiblecrear.value = false;
    } else {
        toast.add({ severity: 'error', summary: 'Error', detail: 'Fallo al registrar el cheque.', life: 3000 });
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
                                const envioDatos = await peticionesFetchOffline('deleteEntry', 'cheques', id);
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
/* LÓGICA DE CAMBIO DE ESTADO CON INTEGRACIÓN BANCARIA */
/************************************************************************/
async function cambiarEstadoCheque(cheque, nuevoEstado) {
    const estadoAnterior = cheque.estado;

    // Si se marca como COBRADO, restar saldo del banco y registrar transacción
    if (nuevoEstado === 'COBRADO') {
        const bancoEncontrado = bancos.value.find(b => b.nombre === cheque.banco);
        if (!bancoEncontrado) {
            toast.add({ severity: 'error', summary: 'Error', detail: 'No se encontró el banco asociado', life: 3000 });
            return;
        }

        const montoCheque = parseFloat(cheque.monto) || 0;
        const saldoAnterior = parseFloat(bancoEncontrado.saldo) || 0;
        const nuevoSaldo = (saldoAnterior - montoCheque).toFixed(2);

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
        camposTransaccion.metodo = 'CHEQUE';
        camposTransaccion.cuenta_origen = bancoEncontrado.cuenta;
        camposTransaccion.cuenta_destino = '';
        camposTransaccion.monto = montoCheque.toFixed(2);
        camposTransaccion.balance_anterior = saldoAnterior.toFixed(2);
        camposTransaccion.balance_actual = nuevoSaldo;
        camposTransaccion.descripcion = `Cheque #${cheque.numero_cheque} - ${cheque.beneficiario}`;
        camposTransaccion.depositante = '';
        camposTransaccion.beneficiario = cheque.beneficiario;
        camposTransaccion.fecha = nfecha('fecha');
        camposTransaccion.hora = nfecha('hora');
        camposTransaccion.estado = 'COMPLETADA';
        camposTransaccion.usuario = usuarioLocal.value.usuario || '';
        if (camposTransaccion.hasOwnProperty('created_at')) {
            camposTransaccion.created_at = nfecha('timestamp');
            camposTransaccion.updated_at = nfecha('timestamp');
        }
        await peticionesFetchOffline('insertData', 'transaccionesbancarias', JSON.stringify(camposTransaccion));

        // Si el beneficiario coincide con una cuenta contable, acreditar su saldo
        if (cheque.beneficiario) {
            const cuentas = await peticionesFetchOffline('getDataAsArray', 'cuentas');
            const cuentaEncontrada = (cuentas || []).find(c => c.nombre === cheque.beneficiario);
            if (cuentaEncontrada) {
                const saldoCuentaAnterior = parseFloat(cuentaEncontrada.saldo) || 0;
                const nuevoSaldoCuenta = (saldoCuentaAnterior + montoCheque).toFixed(2);
                const cuentaActualizada = { ...cuentaEncontrada };
                if (cuentaActualizada.hasOwnProperty('created_at')) {
                    cuentaActualizada.updated_at = nfecha('timestamp');
                }
                cuentaActualizada.saldo = nuevoSaldoCuenta;
                await peticionesFetchOffline('updateData', 'cuentas', JSON.stringify(cuentaActualizada));
            }
        }

        await fetchBancos();
        await fetchCuentas();
    }

    // Si se cambia a DEVUELTO y antes estaba COBRADO, revertir saldo
    if (nuevoEstado === 'DEVUELTO' && estadoAnterior === 'COBRADO') {
        const bancoEncontrado = bancos.value.find(b => b.nombre === cheque.banco);
        if (!bancoEncontrado) {
            toast.add({ severity: 'error', summary: 'Error', detail: 'No se encontró el banco asociado', life: 3000 });
            return;
        }

        const montoCheque = parseFloat(cheque.monto) || 0;
        const saldoAnterior = parseFloat(bancoEncontrado.saldo) || 0;
        const nuevoSaldo = (saldoAnterior + montoCheque).toFixed(2);

        // Actualizar saldo del banco (sumar de vuelta)
        const bancoActualizado = { ...bancoEncontrado };
        if (bancoActualizado.hasOwnProperty('created_at')) {
            bancoActualizado.updated_at = nfecha('timestamp');
        }
        bancoActualizado.saldo = nuevoSaldo;
        const envioBanco = await peticionesFetchOffline('updateData', 'banco', JSON.stringify(bancoActualizado));
        if (envioBanco[0] != 'ok') {
            toast.add({ severity: 'error', summary: 'Error', detail: 'Fallo al revertir saldo del banco', life: 3000 });
            return;
        }

        // Registrar transacción de reverso
        const camposTransaccion = await arrayToObjetoFromTablaOffline('transaccionesbancarias');
        camposTransaccion.tipo = 'DEPOSITO';
        camposTransaccion.metodo = 'CHEQUE';
        camposTransaccion.cuenta_origen = '';
        camposTransaccion.cuenta_destino = bancoEncontrado.cuenta;
        camposTransaccion.monto = montoCheque.toFixed(2);
        camposTransaccion.balance_anterior = saldoAnterior.toFixed(2);
        camposTransaccion.balance_actual = nuevoSaldo;
        camposTransaccion.descripcion = `Cheque Devuelto #${cheque.numero_cheque} - ${cheque.beneficiario}`;
        camposTransaccion.depositante = '';
        camposTransaccion.beneficiario = cheque.beneficiario;
        camposTransaccion.fecha = nfecha('fecha');
        camposTransaccion.hora = nfecha('hora');
        camposTransaccion.estado = 'COMPLETADA';
        camposTransaccion.usuario = usuarioLocal.value.usuario || '';
        if (camposTransaccion.hasOwnProperty('created_at')) {
            camposTransaccion.created_at = nfecha('timestamp');
            camposTransaccion.updated_at = nfecha('timestamp');
        }
        await peticionesFetchOffline('insertData', 'transaccionesbancarias', JSON.stringify(camposTransaccion));

        // Revertir saldo de la cuenta contable si aplica (devuelto → quitar el crédito)
        if (cheque.beneficiario) {
            const cuentas = await peticionesFetchOffline('getDataAsArray', 'cuentas');
            const cuentaEncontrada = (cuentas || []).find(c => c.nombre === cheque.beneficiario);
            if (cuentaEncontrada) {
                const saldoCuentaAnterior = parseFloat(cuentaEncontrada.saldo) || 0;
                const nuevoSaldoCuenta = (saldoCuentaAnterior - montoCheque).toFixed(2);
                const cuentaActualizada = { ...cuentaEncontrada };
                if (cuentaActualizada.hasOwnProperty('created_at')) {
                    cuentaActualizada.updated_at = nfecha('timestamp');
                }
                cuentaActualizada.saldo = nuevoSaldoCuenta;
                await peticionesFetchOffline('updateData', 'cuentas', JSON.stringify(cuentaActualizada));
            }
        }

        await fetchBancos();
        await fetchCuentas();
    }

    // Actualizar estado del cheque
    const chequeActualizado = { ...cheque };
    chequeActualizado.estado = nuevoEstado;
    if (nuevoEstado === 'COBRADO') {
        chequeActualizado.fecha_cobro = nfecha('fecha');
    }
    if (chequeActualizado.hasOwnProperty('created_at')) {
        chequeActualizado.updated_at = nfecha('timestamp');
    }

    const envioCheque = await peticionesFetchOffline('updateData', 'cheques', JSON.stringify(chequeActualizado));
    if (envioCheque[0] == 'ok') {
        fetchAndSetupData();
        toast.add({ severity: 'success', summary: 'Éxito', detail: `Estado cambiado a ${nuevoEstado}`, life: 3000 });
    } else {
        toast.add({ severity: 'error', summary: 'Error', detail: 'Fallo al cambiar estado.', life: 3000 });
    }
}
/************************************************************************/
/* GENERAR CONSTANCIA PDF DE COBRO */
/************************************************************************/
const generarConstanciaCobro = async (cheque) => {
    const empresa = datosEmpresa.empresa || {};
    const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
    });
    const pageWidth = doc.internal.pageSize.getWidth();
    const marginX = 14;
    const contentWidth = pageWidth - marginX * 2;

    // Header con fondo oscuro
    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, pageWidth, 32, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.text(empresa.nombre || 'CONSTANCIA DE COBRO DE CHEQUE', marginX, 16);
    doc.setFontSize(11);
    doc.text(empresa.direccion || '', marginX, 23);
    const contacto = [empresa.telefono, empresa.email].filter(Boolean).join(' - ');
    if (contacto) doc.text(contacto, marginX, 29);

    // Titulo
    doc.setTextColor(15, 23, 42);
    let y = 44;
    doc.setFontSize(16);
    doc.setFont(undefined, 'bold');
    doc.text('CONSTANCIA DE COBRO DE CHEQUE', pageWidth / 2, y, { align: 'center' });
    y += 12;

    // Linea decorativa
    doc.setDrawColor(14, 165, 233);
    doc.setLineWidth(1);
    doc.line(marginX, y, marginX + contentWidth, y);
    y += 10;

    // Helper funciones
    const label = (text, posY, posX = marginX) => {
        doc.setFontSize(10);
        doc.setFont(undefined, 'bold');
        doc.setTextColor(100, 116, 139);
        doc.text(text, posX, posY);
    };
    const value = (text, posY, posX = marginX) => {
        doc.setFontSize(12);
        doc.setFont(undefined, 'normal');
        doc.setTextColor(15, 23, 42);
        doc.text(text || '-', posX, posY);
    };

    const col2 = marginX + contentWidth / 2;

    // Datos del cheque
    label('Cheque No.', y); value(cheque.numero_cheque, y + 6);
    label('Fecha de Cobro', y, col2); value(cheque.fecha_cobro || nfecha('fecha'), y + 6, col2);
    y += 18;

    label('Banco Emisor', y); value(cheque.banco, y + 6);
    label('Cuenta Bancaria', y, col2); value(cheque.cuenta_banco, y + 6, col2);
    y += 18;

    label('Beneficiario', y); value(cheque.beneficiario, y + 6);
    label('Fecha de Emision', y, col2); value(cheque.fecha_emision, y + 6, col2);
    y += 18;

    // Monto destacado
    const boxHeight = 18;
    doc.setFillColor(14, 165, 233);
    doc.roundedRect(marginX, y, contentWidth, boxHeight, 3, 3, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text('MONTO DEL CHEQUE', marginX + 6, y + boxHeight - 6);
    doc.setFontSize(18);
    doc.text(`$${parseFloat(cheque.monto).toFixed(2)}`, marginX + contentWidth - 6, y + boxHeight - 6, { align: 'right' });
    y += boxHeight + 14;

    // Concepto
    doc.setTextColor(15, 23, 42);
    label('Concepto', y);
    doc.setFontSize(11);
    doc.setFont(undefined, 'normal');
    const concepto = doc.splitTextToSize(cheque.concepto || '-', contentWidth);
    doc.text(concepto, marginX, y + 7);
    y += 12 + concepto.length * 6;

    // Linea separadora
    y += 6;
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.5);
    doc.line(marginX, y, marginX + contentWidth, y);
    y += 14;

    // Declaracion
    doc.setFontSize(11);
    doc.setFont(undefined, 'normal');
    doc.setTextColor(55, 65, 81);
    const declaracion = `Yo, ${cheque.beneficiario}, declaro haber recibido el pago correspondiente al cheque No. ${cheque.numero_cheque} por un monto de $${parseFloat(cheque.monto).toFixed(2)}, emitido por el banco ${cheque.banco}, cuenta ${cheque.cuenta_banco}. Firmo la presente como constancia de recepcion conforme.`;
    const declaracionLines = doc.splitTextToSize(declaracion, contentWidth);
    doc.text(declaracionLines, marginX, y);
    y += declaracionLines.length * 7 + 20;

    // Lineas de firma
    const firmaWidth = 70;
    const firma1X = marginX + 10;
    const firma2X = marginX + contentWidth - firmaWidth - 10;

    doc.setDrawColor(15, 23, 42);
    doc.setLineWidth(0.5);
    doc.line(firma1X, y, firma1X + firmaWidth, y);
    doc.line(firma2X, y, firma2X + firmaWidth, y);
    y += 6;

    doc.setFontSize(10);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text('Firma del Beneficiario', firma1X + firmaWidth / 2, y, { align: 'center' });
    doc.text('Firma Autorizada', firma2X + firmaWidth / 2, y, { align: 'center' });
    y += 5;
    doc.setFontSize(9);
    doc.setFont(undefined, 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text(cheque.beneficiario, firma1X + firmaWidth / 2, y, { align: 'center' });
    doc.text(empresa.nombre || '', firma2X + firmaWidth / 2, y, { align: 'center' });

    // Cedula/ID
    y += 10;
    doc.setDrawColor(200, 200, 200);
    doc.line(firma1X, y, firma1X + firmaWidth, y);
    y += 5;
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text('Cedula / ID', firma1X + firmaWidth / 2, y, { align: 'center' });

    // Footer
    const footerY = 285;
    doc.setDrawColor(14, 165, 233);
    doc.setLineWidth(0.5);
    doc.line(marginX, footerY - 4, marginX + contentWidth, footerY - 4);
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text(`Fecha de impresion: ${nfecha('fecha')} ${nfecha('hora')}`, marginX, footerY);
    doc.text('Documento generado por el sistema', marginX + contentWidth, footerY, { align: 'right' });

    // Mostrar PDF en Swal
    const pdfData = doc.output('datauristring');
    await Swal.fire({
        title: 'Constancia de Cobro de Cheque',
        width: '80%',
        html: `<embed src="${pdfData}#toolbar=1" type="application/pdf" width="100%" height="500px" />`,
        showCancelButton: true,
        cancelButtonText: 'Cerrar',
        confirmButtonText: 'Imprimir',
        preConfirm: () => {
            const blobUrl = doc.output('bloburl');
            const printWindow = window.open(blobUrl, '_blank');
            printWindow?.print();
        }
    });
};
/************************************************************************/
const itemsCheques = ref([]);
const menu = ref(null);
const currentRowData = ref(null);
const toggleCheques = (event, rowData) => {
    currentRowData.value = rowData;
    itemsCheques.value = [
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
            label: 'Marcar Cobrado', icon: 'pi pi-check-circle',
            visible: currentRowData.value.estado !== 'COBRADO' && currentRowData.value.estado !== 'ANULADO',
            command: () => {
                Swal.fire({
                    title: '¿Marcar como COBRADO?',
                    text: `Se descontará $${parseFloat(currentRowData.value.monto).toFixed(2)} del banco ${currentRowData.value.banco}`,
                    icon: 'question',
                    showCancelButton: true,
                    confirmButtonText: 'Sí, cobrar',
                    cancelButtonText: 'Cancelar'
                }).then(async (result) => {
                    if (result.isConfirmed) {
                        await cambiarEstadoCheque(currentRowData.value, 'COBRADO');
                        // Generar constancia PDF para firma del beneficiario
                        await generarConstanciaCobro(currentRowData.value);
                    }
                });
            }
        },
        {
            label: 'Imprimir Constancia', icon: 'pi pi-print',
            visible: currentRowData.value.estado === 'COBRADO',
            command: () => {
                generarConstanciaCobro(currentRowData.value);
            }
        },
        {
            label: 'Marcar Devuelto', icon: 'pi pi-replay',
            visible: currentRowData.value.estado === 'COBRADO',
            command: () => {
                Swal.fire({
                    title: '¿Marcar como DEVUELTO?',
                    text: `Se revertirá el monto de $${parseFloat(currentRowData.value.monto).toFixed(2)} al banco ${currentRowData.value.banco}`,
                    icon: 'warning',
                    showCancelButton: true,
                    confirmButtonText: 'Sí, devolver',
                    cancelButtonText: 'Cancelar'
                }).then(async (result) => {
                    if (result.isConfirmed) {
                        await cambiarEstadoCheque(currentRowData.value, 'DEVUELTO');
                    }
                });
            }
        },
        {
            label: 'Anular Cheque', icon: 'pi pi-ban',
            visible: currentRowData.value.estado === 'PENDIENTE',
            command: () => {
                Swal.fire({
                    title: 'Anular Cheque',
                    html: `
                        <p style="margin-bottom:12px;color:#6b7280;">Cheque #<b>${currentRowData.value.numero_cheque}</b> - $${parseFloat(currentRowData.value.monto).toFixed(2)}</p>
                        <p style="margin-bottom:8px;font-weight:600;color:#374151;">Escriba la razón de la anulación:</p>
                    `,
                    input: 'textarea',
                    inputPlaceholder: 'Motivo de la anulación...',
                    inputAttributes: {
                        'aria-label': 'Motivo de anulación',
                        style: 'min-height:80px;'
                    },
                    icon: 'warning',
                    showCancelButton: true,
                    confirmButtonText: 'Anular Cheque',
                    confirmButtonColor: '#ef4444',
                    cancelButtonText: 'Cancelar',
                    inputValidator: (value) => {
                        if (!value || !value.trim()) {
                            return 'Debe escribir una razón para la anulación';
                        }
                    }
                }).then(async (result) => {
                    if (result.isConfirmed) {
                        const nota = result.value;
                        // Guardar la nota en el concepto del cheque
                        const chequeConNota = { ...currentRowData.value };
                        chequeConNota.concepto = `${chequeConNota.concepto} | ANULADO: ${nota}`;
                        chequeConNota.estado = 'ANULADO';
                        if (chequeConNota.hasOwnProperty('created_at')) {
                            chequeConNota.updated_at = nfecha('timestamp');
                        }
                        const envioCheque = await peticionesFetchOffline('updateData', 'cheques', JSON.stringify(chequeConNota));
                        if (envioCheque[0] == 'ok') {
                            fetchAndSetupData();
                            toast.add({ severity: 'success', summary: 'Éxito', detail: 'Cheque anulado correctamente', life: 3000 });
                        } else {
                            toast.add({ severity: 'error', summary: 'Error', detail: 'Fallo al anular el cheque', life: 3000 });
                        }
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
                            const datosFactura = await peticionesFetchOffline('deleteEntry', 'cheques', rowData.id);
                            if (datosFactura[0] == 'ok') {
                                toast.add({ severity: 'success', summary: 'Éxito', detail: 'Cheque eliminado correctamente', life: 3000 });
                                await fetchAndSetupData()
                            } else {
                                toast.add({ severity: 'error', summary: 'Error', detail: 'Error al eliminar el cheque', life: 3000 });
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
const filteredCheques = computed(() => {
    let resultado = data.value;

    // Filtrar por banco seleccionado
    if (bancoSeleccionado.value) {
        resultado = resultado.filter(cheque => cheque.banco === bancoSeleccionado.value.nombre);
    }

    // Filtrar por estado seleccionado
    if (estadoSeleccionado.value) {
        resultado = resultado.filter(cheque => cheque.estado === estadoSeleccionado.value);
    }

    // Filtrar por búsqueda de texto
    if (searchQuery.value) {
        resultado = resultado.filter(busqueda => {
            return Object.values(busqueda).some(value =>
                String(value).toLowerCase().includes(searchQuery.value.toLowerCase())
            );
        });
    }

    // Ordenar por número de cheque
    resultado = [...resultado].sort((a, b) => {
        const numA = parseInt(a.numero_cheque) || 0;
        const numB = parseInt(b.numero_cheque) || 0;
        return numB - numA;
    });

    return resultado;
});
/************************************************************************/
// Función para seleccionar banco en el formulario de crear
const onBancoSelect = (bancoNombre) => {
    const banco = bancos.value.find(b => b.nombre === bancoNombre);
    if (banco) {
        datoscamposCheques.value.cuenta_banco = banco.cuenta;
    }
};
/************************************************************************/
watch(visible, (newVal) => {
    if (newVal && datoscampos.value) {
        const nombreBeneficiario = datoscampos.value.beneficiario || '';
        const cuentaMatch = cuentasContables.value.find(c => c.nombre === nombreBeneficiario);
        if (cuentaMatch) {
            beneficiarioModeEdit.value = 'CUENTA';
            cuentaContableSeleccionadaEdit.value = cuentaMatch.id;
        } else {
            beneficiarioModeEdit.value = 'MANUAL';
            cuentaContableSeleccionadaEdit.value = null;
        }
    }
});
/************************************************************************/
watch(beneficiarioMode, (newVal) => {
    if (newVal === 'MANUAL') {
        cuentaContableSeleccionada.value = null;
    }
});
/************************************************************************/
watch(beneficiarioModeEdit, (newVal) => {
    if (newVal === 'MANUAL') {
        cuentaContableSeleccionadaEdit.value = null;
    }
});
/************************************************************************/
watch(cuentaContableSeleccionada, (newVal) => {
    if (newVal) {
        const cuenta = cuentasContables.value.find(c => c.id == newVal);
        if (cuenta) {
            datoscamposCheques.value.beneficiario = cuenta.nombre;
        }
    }
});
/************************************************************************/
watch(cuentaContableSeleccionadaEdit, (newVal) => {
    if (newVal) {
        const cuenta = cuentasContables.value.find(c => c.id == newVal);
        if (cuenta) {
            datoscampos.value.beneficiario = cuenta.nombre;
        }
    }
});
/************************************************************************/
const fetchCuentas = async () => {
    const response = await peticionesFetchOffline('getDataAsArray', 'cuentas');
    cuentasContables.value = response || [];
};
/************************************************************************/
const getRowClass = (data) => {
    if (data.estado === 'COBRADO') {
        return 'row-cobrado';
    } else if (data.estado === 'ANULADO') {
        return 'row-anulado';
    } else if (data.estado === 'DEVUELTO') {
        return 'row-devuelto';
    }
    return '';
};
/************************************************************************/
// Estadísticas
const totalEmitido = computed(() => {
    return filteredCheques.value
        .reduce((sum, c) => sum + parseFloat(c.monto || 0), 0)
        .toFixed(2);
});

const totalCobrado = computed(() => {
    return filteredCheques.value
        .filter(c => c.estado === 'COBRADO')
        .reduce((sum, c) => sum + parseFloat(c.monto || 0), 0)
        .toFixed(2);
});

const totalPendiente = computed(() => {
    return filteredCheques.value
        .filter(c => c.estado === 'PENDIENTE')
        .reduce((sum, c) => sum + parseFloat(c.monto || 0), 0)
        .toFixed(2);
});

const cantidadCheques = computed(() => {
    return filteredCheques.value.length;
});
/************************************************************************/
const getEstadoSeverity = (estado) => {
    switch (estado) {
        case 'PENDIENTE': return 'warn';
        case 'COBRADO': return 'success';
        case 'ANULADO': return 'secondary';
        case 'DEVUELTO': return 'danger';
        default: return 'info';
    }
};
/************************************************************************/
</script>
<template>
    <main class="cheques-wrapper">
        <div class="container-cheques mx-auto px-4 py-6">

            <!-- Header Section -->
            <div class="header-section mb-6">
                <div class="flex items-center justify-between">
                    <div class="flex items-center gap-4">
                        <div class="header-icon">
                            <i class="pi pi-file-edit"></i>
                        </div>
                        <div>
                            <h1 class="text-3xl font-bold text-gray-800">Cheques Bancarios</h1>
                            <p class="text-gray-600">Registro y control de cheques emitidos</p>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Stats Cards -->
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                <div class="stat-card stat-emitido">
                    <div class="stat-icon">
                        <i class="pi pi-file-edit"></i>
                    </div>
                    <div class="stat-content">
                        <div class="stat-label">Total Emitido</div>
                        <div class="stat-value">${{ totalEmitido }}</div>
                        <div class="stat-sublabel">Monto total</div>
                    </div>
                </div>

                <div class="stat-card stat-cobrado">
                    <div class="stat-icon">
                        <i class="pi pi-check-circle"></i>
                    </div>
                    <div class="stat-content">
                        <div class="stat-label">Total Cobrado</div>
                        <div class="stat-value">${{ totalCobrado }}</div>
                        <div class="stat-sublabel">Cheques cobrados</div>
                    </div>
                </div>

                <div class="stat-card stat-pendiente">
                    <div class="stat-icon">
                        <i class="pi pi-clock"></i>
                    </div>
                    <div class="stat-content">
                        <div class="stat-label">Total Pendiente</div>
                        <div class="stat-value">${{ totalPendiente }}</div>
                        <div class="stat-sublabel">Por cobrar</div>
                    </div>
                </div>

                <div class="stat-card stat-cantidad">
                    <div class="stat-icon">
                        <i class="pi pi-list"></i>
                    </div>
                    <div class="stat-content">
                        <div class="stat-label">Cantidad Cheques</div>
                        <div class="stat-value">{{ cantidadCheques }}</div>
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
                            <Button icon="pi pi-plus" label="Nuevo Cheque"
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
                            <Select v-model="estadoSeleccionado" :options="estadosOpciones"
                                placeholder="Filtrar por estado" showClear class="estado-filter" />
                        </div>
                        <IconField iconPosition="left">
                            <InputIcon class="pi pi-search" />
                            <InputText v-model="searchQuery" placeholder="Buscar cheques..."
                                class="search-input" />
                        </IconField>
                    </div>

                    <DataTable :value="filteredCheques" scrollable scrollHeight="600px" dataKey="id"
                        paginator :rows="10" :rowClass="getRowClass" v-model:selection="selectedItems"
                        selectionMode="multiple" :rowsPerPageOptions="[5, 10, 20, 50]" class="modern-datatable">

                        <Column selectionMode="multiple" headerStyle="width: 3rem"></Column>

                        <Column header="Opciones" frozen :style="{ width: '100px' }">
                            <template #body="slotProps">
                                <Button icon="pi pi-cog" @click="toggleCheques($event, slotProps.data)"
                                    severity="secondary" size="small" rounded />
                                <Menu ref="menu" :model="itemsCheques" :popup="true" />
                            </template>
                        </Column>

                        <Column field="numero_cheque" header="# Cheque" sortable :style="{ minWidth: '130px' }">
                            <template #body="slotProps">
                                <div class="flex items-center gap-2">
                                    <i class="pi pi-file-edit text-blue-600"></i>
                                    <span class="font-bold">{{ slotProps.data.numero_cheque }}</span>
                                </div>
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

                        <Column field="beneficiario" header="Beneficiario" :style="{ minWidth: '180px' }">
                            <template #body="slotProps">
                                <div class="persona-cell">
                                    <i class="pi pi-user mr-2 text-green-600"></i>
                                    {{ slotProps.data.beneficiario }}
                                </div>
                            </template>
                        </Column>

                        <Column field="monto" header="Monto" :style="{ minWidth: '150px' }">
                            <template #body="slotProps">
                                <div class="monto-badge">
                                    <i class="pi pi-dollar mr-2"></i>
                                    ${{ parseFloat(slotProps.data.monto).toFixed(2) }}
                                </div>
                            </template>
                        </Column>

                        <Column field="fecha_emision" header="Emisión" :style="{ minWidth: '120px' }">
                            <template #body="slotProps">
                                <div class="fecha-cell">
                                    <i class="pi pi-calendar mr-2"></i>
                                    {{ slotProps.data.fecha_emision }}
                                </div>
                            </template>
                        </Column>

                        <Column field="fecha_cobro" header="Cobro" :style="{ minWidth: '120px' }">
                            <template #body="slotProps">
                                <div class="fecha-cell" v-if="slotProps.data.fecha_cobro">
                                    <i class="pi pi-check mr-2 text-green-600"></i>
                                    {{ slotProps.data.fecha_cobro }}
                                </div>
                                <span v-else class="text-gray-400">---</span>
                            </template>
                        </Column>

                        <Column field="concepto" header="Concepto" :style="{ minWidth: '200px' }">
                            <template #body="slotProps">
                                <div class="descripcion-cell">
                                    {{ slotProps.data.concepto || 'Sin concepto' }}
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

        <!-- Dialog Crear Cheque -->
        <Dialog v-model:visible="visiblecrear" :style="{ width: '650px' }" header="Nuevo Cheque" :modal="true" class="p-fluid">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div class="form-field-modern">
                    <label class="field-label-modern"><i class="pi pi-hashtag mr-2"></i>Número de Cheque</label>
                    <InputText v-model="datoscamposCheques.numero_cheque" placeholder="Ej: 001234" />
                </div>
                <div class="form-field-modern">
                    <label class="field-label-modern"><i class="pi pi-building mr-2"></i>Banco</label>
                    <Select v-model="datoscamposCheques.banco" :options="bancos.map(b => b.nombre)"
                        placeholder="Seleccione banco" @change="onBancoSelect(datoscamposCheques.banco)" />
                </div>
                <div class="form-field-modern">
                    <label class="field-label-modern"><i class="pi pi-wallet mr-2"></i>Cuenta Banco</label>
                    <InputText v-model="datoscamposCheques.cuenta_banco" placeholder="Cuenta del banco" />
                </div>
                <div class="form-field-modern">
                    <label class="field-label-modern"><i class="pi pi-user mr-2"></i>Beneficiario</label>
                    <SelectButton v-model="beneficiarioMode" :options="['MANUAL', 'CUENTA']" :allowEmpty="false" class="mb-2" />
                    <div v-if="beneficiarioMode === 'MANUAL'">
                        <InputText v-model="datoscamposCheques.beneficiario" v-mayuscula placeholder="Nombre del beneficiario" class="w-full" />
                    </div>
                    <div v-else>
                        <Select v-model="cuentaContableSeleccionada" :options="cuentasContables" optionLabel="nombre" optionValue="id" placeholder="Seleccione una cuenta contable" filter class="w-full">
                            <template #option="slotProps">
                                <span>{{ slotProps.option.nombre }} - <span class="font-semibold">${{ parseFloat(slotProps.option.saldo || 0).toFixed(2) }}</span></span>
                            </template>
                        </Select>
                    </div>
                </div>
                <div class="form-field-modern">
                    <label class="field-label-modern"><i class="pi pi-dollar mr-2"></i>Monto</label>
                    <InputText v-model="datoscamposCheques.monto" v-solonumeros v-decimales v-numeroFocusinOut placeholder="0.00" />
                </div>
                <div class="form-field-modern">
                    <label class="field-label-modern"><i class="pi pi-calendar mr-2"></i>Fecha Emisión</label>
                    <InputText v-model="datoscamposCheques.fecha_emision" v-datepicker placeholder="Fecha de emisión" />
                </div>
                <div class="form-field-modern md:col-span-2">
                    <label class="field-label-modern"><i class="pi pi-align-left mr-2"></i>Concepto</label>
                    <Textarea v-model="datoscamposCheques.concepto" rows="2" placeholder="Concepto del cheque" />
                </div>
                <div class="form-field-modern">
                    <label class="field-label-modern"><i class="pi pi-tag mr-2"></i>Estado</label>
                    <Select v-model="datoscamposCheques.estado" :options="estadosOpciones" placeholder="Estado" />
                </div>
            </div>
            <template #footer>
                <Button label="Cancelar" icon="pi pi-times" @click="visiblecrear = false" severity="secondary" outlined />
                <Button label="Registrar Cheque" icon="pi pi-check" @click="funcionCrear" severity="success" />
            </template>
        </Dialog>

        <!-- Dialog Editar Cheque -->
        <Dialog v-model:visible="visible" :style="{ width: '650px' }" header="Editar Cheque" :modal="true" class="p-fluid">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div class="form-field-modern">
                    <label class="field-label-modern"><i class="pi pi-hashtag mr-2"></i>Número de Cheque</label>
                    <InputText v-model="datoscampos.numero_cheque" placeholder="Número de cheque" />
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
                    <label class="field-label-modern"><i class="pi pi-user mr-2"></i>Beneficiario</label>
                    <SelectButton v-model="beneficiarioModeEdit" :options="['MANUAL', 'CUENTA']" :allowEmpty="false" class="mb-2" />
                    <div v-if="beneficiarioModeEdit === 'MANUAL'">
                        <InputText v-model="datoscampos.beneficiario" v-mayuscula placeholder="Nombre del beneficiario" class="w-full" />
                    </div>
                    <div v-else>
                        <Select v-model="cuentaContableSeleccionadaEdit" :options="cuentasContables" optionLabel="nombre" optionValue="id" placeholder="Seleccione una cuenta contable" filter class="w-full">
                            <template #option="slotProps">
                                <span>{{ slotProps.option.nombre }} - <span class="font-semibold">${{ parseFloat(slotProps.option.saldo || 0).toFixed(2) }}</span></span>
                            </template>
                        </Select>
                    </div>
                </div>
                <div class="form-field-modern">
                    <label class="field-label-modern"><i class="pi pi-dollar mr-2"></i>Monto</label>
                    <InputText v-model="datoscampos.monto" v-solonumeros v-decimales v-numeroFocusinOut placeholder="0.00" />
                </div>
                <div class="form-field-modern">
                    <label class="field-label-modern"><i class="pi pi-calendar mr-2"></i>Fecha Emisión</label>
                    <InputText v-model="datoscampos.fecha_emision" v-datepicker placeholder="Fecha de emisión" />
                </div>
                <div class="form-field-modern">
                    <label class="field-label-modern"><i class="pi pi-calendar mr-2"></i>Fecha Cobro</label>
                    <InputText v-model="datoscampos.fecha_cobro" v-datepicker placeholder="Fecha de cobro" />
                </div>
                <div class="form-field-modern">
                    <label class="field-label-modern"><i class="pi pi-tag mr-2"></i>Estado</label>
                    <Select v-model="datoscampos.estado" :options="estadosOpciones" placeholder="Estado" />
                </div>
                <div class="form-field-modern md:col-span-2">
                    <label class="field-label-modern"><i class="pi pi-align-left mr-2"></i>Concepto</label>
                    <Textarea v-model="datoscampos.concepto" rows="2" placeholder="Concepto del cheque" />
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
   CHEQUES BANCARIOS STYLES
   =================================== */

.cheques-wrapper {
    min-height: calc(100vh - 80px);
    background: linear-gradient(135deg, rgba(243, 244, 246, 1) 0%, rgba(249, 250, 251, 1) 100%);
}

.container-cheques {
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

.stat-emitido {
    border-color: #3b82f6;
    background: linear-gradient(135deg, rgba(59, 130, 246, 0.05) 0%, rgba(37, 99, 235, 0.02) 100%);
}

.stat-cobrado {
    border-color: #10b981;
    background: linear-gradient(135deg, rgba(16, 185, 129, 0.05) 0%, rgba(5, 150, 105, 0.02) 100%);
}

.stat-pendiente {
    border-color: #f59e0b;
    background: linear-gradient(135deg, rgba(245, 158, 11, 0.05) 0%, rgba(217, 119, 6, 0.02) 100%);
}

.stat-cantidad {
    border-color: #8b5cf6;
    background: linear-gradient(135deg, rgba(139, 92, 246, 0.05) 0%, rgba(124, 58, 237, 0.02) 100%);
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

.stat-emitido .stat-icon {
    background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
    color: white;
}

.stat-cobrado .stat-icon {
    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
    color: white;
}

.stat-pendiente .stat-icon {
    background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
    color: white;
}

.stat-cantidad .stat-icon {
    background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
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

.banco-filter,
.estado-filter {
    min-width: 200px;
    border: 2px solid #e5e7eb;
    border-radius: 10px;
    transition: all 0.3s ease;
}

.banco-filter:hover,
.estado-filter:hover {
    border-color: #6366f1;
}

:deep(.banco-filter .p-select-label),
:deep(.estado-filter .p-select-label) {
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
:deep(.row-cobrado) {
    background: rgba(16, 185, 129, 0.03) !important;
    border-left: 4px solid #10b981;
}

:deep(.row-anulado) {
    background: rgba(107, 114, 128, 0.03) !important;
    border-left: 4px solid #6b7280;
    opacity: 0.7;
}

:deep(.row-devuelto) {
    background: rgba(239, 68, 68, 0.03) !important;
    border-left: 4px solid #ef4444;
}

/* Custom Badges */
.monto-badge {
    display: inline-flex;
    align-items: center;
    padding: 0.5rem 1rem;
    border-radius: 8px;
    font-weight: 700;
    font-size: 1.1rem;
    border: 2px solid #3b82f6;
    background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
    color: #1e40af;
}

.banco-cell,
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
