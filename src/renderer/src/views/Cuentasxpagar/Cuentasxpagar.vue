<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
const router = useRouter();
import { peticionesFetchOffline, nfecha, obtenerIdsSeleccionados, encryptarPassword, envioElectron, crearTablaSiNoExisteOffline } from '@/funciones/funciones.js';
import Swal from 'sweetalert2';
import { useToast } from "primevue/usetoast";
const toast = useToast();
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
/************************************************************************/
import SelectButton from 'primevue/selectbutton';
import Dialog from 'primevue/dialog';
import Dropdown from 'primevue/dropdown';
import InputNumber from 'primevue/inputnumber';
import Textarea from 'primevue/textarea';
/************************************************************************/
import { useDatosEmpresa } from '@/stores';
const datosEmpresa = useDatosEmpresa();
const token = ref('');
const tokenCorto = ref('');
/************************************************************************/
const camposArray = ["proveedor","rnc_proveedor","no_factura","ncf_proveedor","fecha_compra","fecha_vencimiento","total","abono","saldo","estado","recordatorio","nota","almacen","usuario","pagos"];
/************************************************************************/
const usuarioLocal = ref({});
const selectedItems = ref([]);
const searchQuery = ref('');
const data = ref([]);
const menu = ref(null);
const currentRowData = ref(null);
const itemsCuentas = ref([]);
const estadoFilter = ref('TODAS');
const catalogoCuentas = ref([]);
const dialogPagoVisible = ref(false);
const cuentaEnPago = ref(null);
const loadingPago = ref(false);
const formPago = ref({
  cuentaContable: null,
  monto: 0,
  nota: '',
  formaPago: 'EFECTIVO'
});
const formasPago = ref(['EFECTIVO', 'TRANSFERENCIA', 'CHEQUE', 'TARJETA']);
const dialogHistorialVisible = ref(false);
const historialPagos = ref([]);
const cuentaHistorial = ref(null);
/************************************************************************/
const fetchAndSetupData = async () => {
  const response = await peticionesFetchOffline('getDataAsArray', 'cuentasxpagar');
  const jsonData = response.reverse();
  data.value = jsonData.map(cuenta => {
    // Calcular si está vencida
    const fechaVencimiento = new Date(cuenta.fecha_vencimiento);
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    fechaVencimiento.setHours(0, 0, 0, 0);

    const diasVencidos = Math.floor((hoy - fechaVencimiento) / (1000 * 60 * 60 * 24));

    let estadoCalculado = cuenta.estado;
    if (parseFloat(cuenta.saldo) <= 0) {
      estadoCalculado = 'PAGADO';
    } else if (diasVencidos > 0 && cuenta.estado !== 'PAGADO') {
      estadoCalculado = 'VENCIDO';
    } else if (cuenta.estado !== 'PAGADO' && parseFloat(cuenta.abono) > 0) {
      estadoCalculado = 'PARCIAL';
    }

    return {
      ...cuenta,
      estado: estadoCalculado,
      diasVencidos: diasVencidos > 0 ? diasVencidos : 0
    };
  });
};
/************************************************************************/
const fetchCatalogoCuentas = async () => {
  try {
    const response = await peticionesFetchOffline('getDataAsArray', 'cuentas');
    catalogoCuentas.value = response || [];
  } catch (error) {
    console.error('Error al cargar catálogo de cuentas:', error);
    catalogoCuentas.value = [];
  }
};
/************************************************************************/
onMounted(async () => {
  const datosJSON = await envioElectron('datosarchivo');
  token.value = datosJSON.VITE_TOKEN;
  tokenCorto.value = datosJSON.VITE_TOKEN_CORTO;

  await crearTablaSiNoExisteOffline('cuentasxpagar', camposArray, toast);
  await crearTablaSiNoExisteOffline('cuentas', ['nombre', 'categoria', 'saldo'], toast);
  usuarioLocal.value = JSON.parse(window.localStorage.getItem('usuarioLocal'))[0] || {};
  await fetchAndSetupData();
  await fetchCatalogoCuentas();

  // Verificar recordatorios al cargar
  verificarRecordatorios();
});
/************************************************************************/
const verificarRecordatorios = () => {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  const proximasAVencer = data.value.filter(cuenta => {
    if (cuenta.estado === 'PAGADO' || !cuenta.recordatorio) return false;

    const fechaVencimiento = new Date(cuenta.fecha_vencimiento);
    fechaVencimiento.setHours(0, 0, 0, 0);

    const diasRestantes = Math.floor((fechaVencimiento - hoy) / (1000 * 60 * 60 * 24));

    return diasRestantes >= 0 && diasRestantes <= 3;
  });

  if (proximasAVencer.length > 0) {
    const mensaje = proximasAVencer.map(c =>
      `<div style="text-align: left; margin: 8px 0;">
        <strong>${c.proveedor}</strong><br>
        Factura: ${c.no_factura}<br>
        Saldo: $${parseFloat(c.saldo).toFixed(2)}<br>
        Vence: ${c.fecha_vencimiento}
      </div>`
    ).join('<hr style="margin: 12px 0;">');

    Swal.fire({
      title: '¡Recordatorio de Pagos!',
      html: `<div style="max-height: 300px; overflow-y: auto;">${mensaje}</div>`,
      icon: 'warning',
      confirmButtonText: 'Entendido',
      confirmButtonColor: '#f97316'
    });
  }
};
/************************************************************************/
const borrarSeleccionados = async () => {
  const ids = obtenerIdsSeleccionados(selectedItems.value);

  Swal.fire({
    title: "¿Estás Seguro?",
    text: "Se Borrarán las Cuentas Seleccionadas",
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Sí, Borrar",
    cancelButtonText: "Cancelar",
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
                await peticionesFetchOffline('deleteEntry', 'cuentasxpagar', id);
              } catch (error) {
                console.error(`Error al eliminar cuenta ID: ${id}`, error);
                exitoTotal = false;
              }
            }

            if (exitoTotal) {
              fetchAndSetupData();
              toast.add({ severity: 'success', summary: 'Éxito', detail: 'Cuentas Borradas', life: 3000 });
            } else {
              toast.add({ severity: 'error', summary: 'Error', detail: 'Fallo al Borrar', life: 3000 });
            }
          }
        } else {
          toast.add({ severity: 'error', summary: 'Error', detail: 'Contraseña incorrecta', life: 3000 });
        }
      }
    }
  });
};
/************************************************************************/
const borrarTodo = async () => {
  Swal.fire({
    title: "¿Estás seguro?",
    text: "¡Se borrarán TODAS las cuentas por pagar!",
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
          const envioDatos = await peticionesFetchOffline('deleteAll', 'cuentasxpagar');
          if (envioDatos[0] == 'ok') {
            fetchAndSetupData();
            toast.add({ severity: 'success', summary: 'Éxito', detail: 'Todos los datos borrados', life: 3000 });
          } else {
            toast.add({ severity: 'error', summary: 'Error', detail: 'Fallo al borrar', life: 3000 });
          }
        } else {
          toast.add({ severity: 'error', summary: 'Error', detail: 'Contraseña incorrecta', life: 3000 });
        }
      }
    }
  });
};
/************************************************************************/
const abrirDialogPago = (cuenta) => {
  cuentaEnPago.value = cuenta;
  loadingPago.value = false; // Reiniciar loading

  // Buscar cuenta de Caja Chica y establecerla por defecto
  const cajaChica = catalogoCuentas.value.find(c =>
    c.nombre && c.nombre.toLowerCase().includes('caja chica')
  );

  formPago.value = {
    cuentaContable: cajaChica || null,
    monto: 0,
    nota: '',
    formaPago: 'EFECTIVO'
  };

  dialogPagoVisible.value = true;
};
/************************************************************************/
const verHistorialPagos = (cuenta) => {
  cuentaHistorial.value = cuenta;

  console.log('=== VER HISTORIAL DE PAGOS ===');
  console.log('Cuenta seleccionada:', cuenta);
  console.log('Campo pagos (raw):', cuenta.pagos);
  console.log('Tipo de pagos:', typeof cuenta.pagos);

  // Obtener historial de pagos
  try {
    if (cuenta.pagos) {
      if (typeof cuenta.pagos === 'string') {
        historialPagos.value = JSON.parse(cuenta.pagos);
        console.log('Pagos parseados desde string:', historialPagos.value);
      } else if (Array.isArray(cuenta.pagos)) {
        historialPagos.value = cuenta.pagos;
        console.log('Pagos ya es array:', historialPagos.value);
      } else {
        historialPagos.value = [];
        console.log('Pagos no es string ni array, iniciando vacío');
      }
    } else {
      historialPagos.value = [];
      console.log('No hay campo pagos, iniciando vacío');
    }
  } catch (e) {
    console.error('Error al parsear historial de pagos:', e);
    historialPagos.value = [];
  }

  console.log('Historial final a mostrar:', historialPagos.value);
  console.log('Cantidad de pagos:', historialPagos.value.length);

  dialogHistorialVisible.value = true;
};
/************************************************************************/
// Generar PDF de un pago individual
const generarPDFPago = (pago) => {
  const doc = new jsPDF();
  const cuenta = cuentaHistorial.value;

  // Encabezado
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text(datosEmpresa.empresa.nombre || 'EMPRESA', 105, 20, { align: 'center' });

  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text('RECIBO DE PAGO', 105, 30, { align: 'center' });

  // Línea separadora
  doc.setLineWidth(0.5);
  doc.line(20, 35, 190, 35);

  // Información del recibo
  doc.setFontSize(10);
  let yPos = 45;

  doc.setFont('helvetica', 'bold');
  doc.text('INFORMACIÓN DEL PROVEEDOR', 20, yPos);
  yPos += 7;

  doc.setFont('helvetica', 'normal');
  doc.text(`Proveedor: ${cuenta.proveedor || 'N/A'}`, 20, yPos);
  yPos += 6;
  doc.text(`RNC: ${cuenta.rnc_proveedor || 'N/A'}`, 20, yPos);
  yPos += 6;
  doc.text(`No. Factura: ${cuenta.no_factura || 'N/A'}`, 20, yPos);
  yPos += 10;

  // Información del pago
  doc.setFont('helvetica', 'bold');
  doc.text('DETALLE DEL PAGO', 20, yPos);
  yPos += 7;

  doc.setFont('helvetica', 'normal');
  doc.text(`Fecha: ${pago.fecha || 'N/A'}`, 20, yPos);
  doc.text(`Hora: ${pago.hora || 'N/A'}`, 120, yPos);
  yPos += 6;
  doc.text(`Forma de Pago: ${pago.forma_pago || pago.metodo || 'N/A'}`, 20, yPos);
  yPos += 6;
  doc.text(`Usuario: ${pago.usuario || 'Sistema'}`, 20, yPos);
  yPos += 6;

  if (pago.cuenta_contable) {
    doc.text(`Cuenta Afectada: ${pago.cuenta_contable}`, 20, yPos);
    yPos += 6;
  }

  if (pago.nota) {
    doc.text(`Nota: ${pago.nota}`, 20, yPos);
    yPos += 6;
  }

  yPos += 5;

  // Monto del pago (destacado)
  doc.setFillColor(16, 185, 129);
  doc.rect(20, yPos, 170, 15, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(`MONTO PAGADO: $${parseFloat(pago.monto || pago.cantidad || 0).toFixed(2)}`, 105, yPos + 10, { align: 'center' });

  // Resetear color
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(10);
  yPos += 25;

  // Resumen de cuenta
  doc.setFont('helvetica', 'bold');
  doc.text('RESUMEN DE LA CUENTA', 20, yPos);
  yPos += 7;

  doc.setFont('helvetica', 'normal');
  doc.text(`Total de la Factura: $${parseFloat(cuenta.total || 0).toFixed(2)}`, 20, yPos);
  yPos += 6;
  doc.text(`Total Abonado: $${parseFloat(cuenta.abono || 0).toFixed(2)}`, 20, yPos);
  yPos += 6;
  doc.text(`Saldo Restante: $${parseFloat(cuenta.saldo || 0).toFixed(2)}`, 20, yPos);
  yPos += 15;

  // Pie de página
  doc.setFontSize(8);
  doc.setFont('helvetica', 'italic');
  doc.text(`Generado el ${new Date().toLocaleString()}`, 105, 280, { align: 'center' });

  // Mostrar PDF en SweetAlert
  const pdfDataUri = doc.output('dataurlstring');
  Swal.fire({
    title: 'Recibo de Pago',
    html: `<iframe src="${pdfDataUri}" width="100%" height="500px" style="border: none;"></iframe>`,
    width: '800px',
    showCancelButton: true,
    confirmButtonText: 'Descargar PDF',
    cancelButtonText: 'Cerrar',
    confirmButtonColor: '#10b981'
  }).then((result) => {
    if (result.isConfirmed) {
      doc.save(`Recibo_Pago_${cuenta.no_factura}_${pago.fecha}.pdf`);
    }
  });
};
/************************************************************************/
// Generar PDF de todos los pagos
const generarPDFTodosPagos = () => {
  const doc = new jsPDF();
  const cuenta = cuentaHistorial.value;

  // Encabezado
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text(datosEmpresa.empresa.nombre || 'EMPRESA', 105, 20, { align: 'center' });

  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text('HISTORIAL DE PAGOS', 105, 30, { align: 'center' });

  // Línea separadora
  doc.setLineWidth(0.5);
  doc.line(20, 35, 190, 35);

  // Información del proveedor
  doc.setFontSize(10);
  let yPos = 45;

  doc.setFont('helvetica', 'bold');
  doc.text('INFORMACIÓN DE LA CUENTA', 20, yPos);
  yPos += 7;

  doc.setFont('helvetica', 'normal');
  doc.text(`Proveedor: ${cuenta.proveedor || 'N/A'}`, 20, yPos);
  yPos += 6;
  doc.text(`RNC: ${cuenta.rnc_proveedor || 'N/A'}`, 20, yPos);
  yPos += 6;
  doc.text(`No. Factura: ${cuenta.no_factura || 'N/A'}`, 20, yPos);
  yPos += 10;

  // Resumen
  doc.setFont('helvetica', 'bold');
  doc.text('RESUMEN', 20, yPos);
  yPos += 7;

  doc.setFont('helvetica', 'normal');
  doc.text(`Total: $${parseFloat(cuenta.total || 0).toFixed(2)}`, 20, yPos);
  doc.text(`Abonado: $${parseFloat(cuenta.abono || 0).toFixed(2)}`, 80, yPos);
  doc.text(`Saldo: $${parseFloat(cuenta.saldo || 0).toFixed(2)}`, 140, yPos);
  yPos += 10;

  // Tabla de pagos
  const pagosData = historialPagos.value.map((pago, index) => [
    historialPagos.value.length - index,
    pago.fecha || 'N/A',
    pago.forma_pago || pago.metodo || 'N/A',
    `$${parseFloat(pago.monto || pago.cantidad || 0).toFixed(2)}`,
    pago.cuenta_contable || 'N/A',
    pago.usuario || 'Sistema'
  ]);

  doc.autoTable({
    startY: yPos,
    head: [['#', 'Fecha', 'Forma Pago', 'Monto', 'Cuenta', 'Usuario']],
    body: pagosData,
    theme: 'grid',
    headStyles: {
      fillColor: [16, 185, 129],
      textColor: [255, 255, 255],
      fontStyle: 'bold'
    },
    styles: {
      fontSize: 9,
      cellPadding: 3
    },
    columnStyles: {
      3: { halign: 'right', fontStyle: 'bold' }
    }
  });

  // Pie de página
  doc.setFontSize(8);
  doc.setFont('helvetica', 'italic');
  doc.text(`Generado el ${new Date().toLocaleString()}`, 105, doc.internal.pageSize.height - 10, { align: 'center' });

  // Mostrar PDF en SweetAlert
  const pdfDataUri = doc.output('dataurlstring');
  Swal.fire({
    title: 'Historial Completo de Pagos',
    html: `<iframe src="${pdfDataUri}" width="100%" height="500px" style="border: none;"></iframe>`,
    width: '800px',
    showCancelButton: true,
    confirmButtonText: 'Descargar PDF',
    cancelButtonText: 'Cerrar',
    confirmButtonColor: '#10b981'
  }).then((result) => {
    if (result.isConfirmed) {
      doc.save(`Historial_Pagos_${cuenta.no_factura}.pdf`);
    }
  });
};
/************************************************************************/
const procesarPago = async () => {
  // Evitar múltiples envíos
  if (loadingPago.value) return;

  const cuenta = cuentaEnPago.value;
  const saldoActual = parseFloat(cuenta.saldo);

  // Validaciones
  if (!formPago.value.cuentaContable) {
    toast.add({
      severity: 'warn',
      summary: 'Validación',
      detail: 'Debes seleccionar una cuenta contable',
      life: 3000
    });
    return;
  }

  if (!formPago.value.monto || parseFloat(formPago.value.monto) <= 0) {
    toast.add({
      severity: 'warn',
      summary: 'Validación',
      detail: 'Debes ingresar un monto válido',
      life: 3000
    });
    return;
  }

  if (parseFloat(formPago.value.monto) > saldoActual) {
    toast.add({
      severity: 'warn',
      summary: 'Validación',
      detail: 'El monto no puede ser mayor al saldo',
      life: 3000
    });
    return;
  }

  // Activar loading
  loadingPago.value = true;

  try {
    // Crear objeto del pago
    const fechaActual = new Date().toISOString().split('T')[0];
    const nuevoPago = {
      id: Date.now(), // ID único del pago
      monto: parseFloat(formPago.value.monto),
      fecha: fechaActual,
      cuenta_contable: formPago.value.cuentaContable.nombre,
      cuenta_contable_id: formPago.value.cuentaContable.id,
      forma_pago: formPago.value.formaPago,
      nota: formPago.value.nota || '',
      usuario: usuarioLocal.value.usuario || 'Sistema',
      fecha_registro: new Date().toISOString()
    };

    console.log('Nuevo pago creado:', nuevoPago);
    console.log('Cuenta actual:', cuenta);
    console.log('Pagos existentes (raw):', cuenta.pagos);

    // Obtener array de pagos existentes o crear uno nuevo
    let pagosArray = [];
    try {
      if (cuenta.pagos) {
        if (typeof cuenta.pagos === 'string') {
          pagosArray = JSON.parse(cuenta.pagos);
        } else if (Array.isArray(cuenta.pagos)) {
          pagosArray = cuenta.pagos;
        }
      }
    } catch (e) {
      console.error('Error al parsear pagos existentes:', e);
      pagosArray = [];
    }

    console.log('Pagos array antes de agregar:', pagosArray);

    // Agregar el nuevo pago al array
    pagosArray.push(nuevoPago);

    console.log('Pagos array después de agregar:', pagosArray);
    console.log('Pagos array stringified:', JSON.stringify(pagosArray));

    // Calcular nuevo abono y saldo
    const nuevoAbono = parseFloat(cuenta.abono || 0) + parseFloat(formPago.value.monto);
    const nuevoSaldo = parseFloat(cuenta.total) - nuevoAbono;

    const cuentaActualizada = {
      ...cuenta,
      abono: nuevoAbono.toFixed(2),
      saldo: nuevoSaldo.toFixed(2),
      estado: nuevoSaldo <= 0 ? 'PAGADO' : (nuevoAbono > 0 ? 'PARCIAL' : cuenta.estado),
      pagos: JSON.stringify(pagosArray) // Guardar como string JSON
    };

    console.log('Cuenta actualizada antes de eliminar diasVencidos:', cuentaActualizada);
    console.log('Campo pagos en cuenta actualizada:', cuentaActualizada.pagos);

    // Actualizar la cuenta contable seleccionada
    const cuentaContable = formPago.value.cuentaContable;
    if (cuentaContable) {
      const nuevoSaldoCuenta = parseFloat(cuentaContable.saldo || 0) - parseFloat(formPago.value.monto);
      const cuentaContableActualizada = {
        ...cuentaContable,
        saldo: nuevoSaldoCuenta.toFixed(2)
      };

      await peticionesFetchOffline('updateData', 'cuentas', JSON.stringify(cuentaContableActualizada));
    }

    delete cuentaActualizada.diasVencidos;

    console.log('Cuenta a guardar (después de eliminar diasVencidos):', cuentaActualizada);
    console.log('Cuenta stringified para guardar:', JSON.stringify(cuentaActualizada));

    const resultado = await peticionesFetchOffline('updateData', 'cuentasxpagar', JSON.stringify(cuentaActualizada));

    console.log('Resultado de guardar:', resultado);

    if (resultado[0] === 'ok') {
      // Actualizar la compra relacionada
      const compra = await peticionesFetchOffline('getDataByField', 'compras', 'no_factura', cuenta.no_factura);
      if (compra) {
        compra.abono = nuevoAbono.toFixed(2);
        compra.saldo = nuevoSaldo.toFixed(2);
        compra.estado = nuevoSaldo <= 0 ? 'PAGADO' : (nuevoAbono > 0 ? 'PARCIAL' : compra.estado);
        await peticionesFetchOffline('updateData', 'compras', JSON.stringify(compra));
      }

      await fetchAndSetupData();
      await fetchCatalogoCuentas();

      dialogPagoVisible.value = false;

      toast.add({
        severity: 'success',
        summary: 'Pago Registrado',
        detail: `$${parseFloat(formPago.value.monto).toFixed(2)} abonado correctamente. Cuenta ${cuentaContable?.nombre || ''} afectada.`,
        life: 4000
      });

      if (nuevoSaldo <= 0) {
        Swal.fire({
          title: '¡Cuenta Saldada!',
          text: `La cuenta con ${cuenta.proveedor} ha sido pagada completamente`,
          icon: 'success',
          confirmButtonColor: '#10b981'
        });
      }
    } else {
      toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo registrar el pago', life: 3000 });
    }
  } catch (error) {
    console.error('Error al procesar pago:', error);
    toast.add({ severity: 'error', summary: 'Error', detail: 'Error al procesar el pago', life: 3000 });
  } finally {
    // Desactivar loading
    loadingPago.value = false;
  }
};
/************************************************************************/
const toggleCuentas = (event, rowData) => {
  currentRowData.value = rowData;

  itemsCuentas.value = [
    {
      label: 'Ver/Editar',
      icon: 'pi pi-pencil',
      command: () => {
        router.push({ path: `/editarcuentasxpagar/${currentRowData.value.id}` });
      }
    },
    {
      label: 'Realizar Pago',
      icon: 'pi pi-money-bill',
      command: () => {
        abrirDialogPago(currentRowData.value);
      },
      disabled: currentRowData.value.estado === 'PAGADO'
    },
    {
      label: 'Ver Historial de Pagos',
      icon: 'pi pi-history',
      command: () => {
        verHistorialPagos(currentRowData.value);
      }
    },
    {
      label: 'Eliminar',
      icon: 'pi pi-trash',
      command: async() => {
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
              const resultado = await peticionesFetchOffline('deleteEntry', 'cuentasxpagar', currentRowData.value.id);
              if (resultado[0] == 'ok') {
                toast.add({ severity: 'success', summary: 'Éxito', detail: 'Cuenta eliminada', life: 3000 });
                await fetchAndSetupData();
              } else {
                toast.add({ severity: 'error', summary: 'Error', detail: 'Error al eliminar', life: 3000 });
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
  let filtered = data.value;

  // Filtrar por búsqueda
  if (searchQuery.value) {
    filtered = filtered.filter(cuenta => {
      return Object.values(cuenta).some(value =>
        String(value).toLowerCase().includes(searchQuery.value.toLowerCase())
      );
    });
  }

  // Filtrar por estado
  if (estadoFilter.value !== 'TODAS') {
    filtered = filtered.filter(cuenta => cuenta.estado === estadoFilter.value);
  }

  return filtered;
});
/************************************************************************/
const calcularTotalPorPagar = computed(() => {
  const total = filteredCuentas.value
    .filter(c => c.estado !== 'PAGADO')
    .reduce((acc, cuenta) => acc + parseFloat(cuenta.saldo || 0), 0);
  return formatCurrency(total);
});
/************************************************************************/
const calcularTotalVencido = computed(() => {
  const total = filteredCuentas.value
    .filter(c => c.estado === 'VENCIDO')
    .reduce((acc, cuenta) => acc + parseFloat(cuenta.saldo || 0), 0);
  return formatCurrency(total);
});
/************************************************************************/
const contarPendientes = computed(() => {
  return filteredCuentas.value.filter(c => c.estado === 'PENDIENTE').length;
});
/************************************************************************/
const contarVencidas = computed(() => {
  return filteredCuentas.value.filter(c => c.estado === 'VENCIDO').length;
});
/************************************************************************/
const contarPagadas = computed(() => {
  return filteredCuentas.value.filter(c => c.estado === 'PAGADO').length;
});
/************************************************************************/
const contarParciales = computed(() => {
  return filteredCuentas.value.filter(c => c.estado === 'PARCIAL').length;
});
/************************************************************************/
const formatCurrency = (value) => {
  if (!value || isNaN(value)) return '$0.00';
  return `$${Number(value).toFixed(2)}`;
};
/************************************************************************/
const formatDate = (dateString) => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleDateString('es-DO', { year: 'numeric', month: '2-digit', day: '2-digit' });
};
/************************************************************************/
const getSeverityEstado = (estado) => {
  switch(estado) {
    case 'PAGADO': return 'success';
    case 'VENCIDO': return 'danger';
    case 'PARCIAL': return 'warning';
    case 'PENDIENTE': return 'info';
    default: return 'secondary';
  }
};
/************************************************************************/
</script>

<template>
<main class="cuentas-wrapper">
  <div class="container-cuentas mx-auto px-4 py-6">

    <!-- Header Section -->
    <div class="mb-6">
      <h1 class="text-3xl font-bold text-gray-800 mb-2">Cuentas por Pagar</h1>
      <p class="text-gray-600">Administra y controla tus obligaciones con proveedores</p>
    </div>

    <!-- Stats Cards -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">

      <!-- Total Por Pagar Card -->
      <Card class="stat-card">
        <template #content>
          <div class="stat-card-content">
            <div class="stat-icon-wrapper bg-gradient-red">
              <i class="pi pi-exclamation-triangle text-white text-3xl"></i>
            </div>
            <div class="stat-info">
              <span class="stat-label">Total Por Pagar</span>
              <div class="stat-value">{{ calcularTotalPorPagar }}</div>
            </div>
          </div>
        </template>
      </Card>

      <!-- Vencidas Card -->
      <Card class="stat-card">
        <template #content>
          <div class="stat-card-content">
            <div class="stat-icon-wrapper bg-gradient-danger">
              <i class="pi pi-times-circle text-white text-3xl"></i>
            </div>
            <div class="stat-info">
              <span class="stat-label">Vencidas ({{ contarVencidas }})</span>
              <div class="stat-value">{{ calcularTotalVencido }}</div>
            </div>
          </div>
        </template>
      </Card>

      <!-- Pendientes Card -->
      <Card class="stat-card">
        <template #content>
          <div class="stat-card-content">
            <div class="stat-icon-wrapper bg-gradient-blue">
              <i class="pi pi-clock text-white text-3xl"></i>
            </div>
            <div class="stat-info">
              <span class="stat-label">Pendientes</span>
              <div class="stat-value">{{ contarPendientes }}</div>
            </div>
          </div>
        </template>
      </Card>

      <!-- Pagadas Card -->
      <Card class="stat-card">
        <template #content>
          <div class="stat-card-content">
            <div class="stat-icon-wrapper bg-gradient-green">
              <i class="pi pi-check-circle text-white text-3xl"></i>
            </div>
            <div class="stat-info">
              <span class="stat-label">Pagadas</span>
              <div class="stat-value">{{ contarPagadas }}</div>
            </div>
          </div>
        </template>
      </Card>

    </div>

    <!-- Main Content Card -->
    <Card class="main-card">
      <template #header>
        <div class="card-header-modern">
          <div class="flex items-center gap-3">
            <div class="icon-wrapper-modern bg-red-600">
              <i class="pi pi-wallet text-white text-2xl"></i>
            </div>
            <div>
              <h2 class="text-xl font-bold text-gray-800">Gestión de Cuentas por Pagar</h2>
              <p class="text-sm text-gray-500">Control completo de obligaciones pendientes</p>
            </div>
          </div>
        </div>
      </template>

      <template #content>

        <!-- Actions and Filters Section -->
        <div class="actions-section mb-6">

          <!-- Actions Row -->
          <div class="flex flex-wrap gap-3 justify-between items-center mb-4">
            <div class="flex gap-3">
              <Button
                @click="fetchAndSetupData"
                icon="pi pi-refresh"
                label="Recargar"
                severity="warning"
                class="action-btn"
              />
              <Button
                as="router-link"
                to="/crearcuentasxpagar"
                icon="pi pi-plus"
                label="Nueva Cuenta"
                severity="success"
                class="action-btn"
              />
              <Button
                @click="borrarSeleccionados"
                icon="pi pi-trash"
                label="Borrar Selección"
                severity="danger"
                class="action-btn"
              />
            </div>

            <div v-if="usuarioLocal.usuario === 'Soporte'">
              <Button
                @click="borrarTodo"
                icon="pi pi-trash"
                label="Borrar Todo"
                severity="danger"
                class="action-btn"
              />
            </div>
          </div>

          <!-- Filters Row -->
          <div class="filters-row mb-4">
            <div class="flex flex-wrap gap-3 items-center">
              <span class="filter-label">Filtrar por Estado:</span>
              <SelectButton
                :allowEmpty="false"
                v-model="estadoFilter"
                :options="['TODAS', 'PENDIENTE', 'PARCIAL', 'VENCIDO', 'PAGADO']"
                class="estado-filter"
              />
            </div>
          </div>

          <!-- Search Row -->
          <div class="search-wrapper">
            <IconField iconPosition="left">
              <InputIcon class="pi pi-search" />
              <InputText
                v-model="searchQuery"
                placeholder="Buscar por proveedor, factura, RNC..."
                class="search-input w-full"
              />
            </IconField>
          </div>

        </div>

        <!-- DataTable Section -->
        <div class="datatable-wrapper">
          <DataTable
            :value="filteredCuentas"
            scrollable
            scrollHeight="600px"
            dataKey="id"
            paginator
            :rows="10"
            v-model:selection="selectedItems"
            :rowsPerPageOptions="[5, 10, 20, 50]"
            tableStyle="min-width: 50rem"
            class="cuentas-datatable"
          >
            <Column selectionMode="multiple" headerStyle="width: 3rem"></Column>

            <Column header="Acciones" :style="{width: '120px'}">
              <template #body="slotProps">
                <Button
                  icon="pi pi-cog"
                  @click="toggleCuentas($event, slotProps.data)"
                  severity="secondary"
                  rounded
                  outlined
                  aria-haspopup="true"
                  aria-controls="overlay_menu_cuentas"
                />
                <Menu
                  ref="menu"
                  id="overlay_menu_cuentas"
                  :model="itemsCuentas"
                  :popup="true"
                />
              </template>
            </Column>

            <Column field="estado" header="Estado" :style="{minWidth: '140px'}">
              <template #body="slotProps">
                <div class="flex flex-col gap-1">
                  <Tag
                    :value="slotProps.data.estado"
                    :severity="getSeverityEstado(slotProps.data.estado)"
                  />
                  <Tag
                    v-if="slotProps.data.diasVencidos > 0 && slotProps.data.estado === 'VENCIDO'"
                    :value="`${slotProps.data.diasVencidos} días`"
                    severity="danger"
                    class="text-xs"
                  />
                </div>
              </template>
            </Column>

            <Column field="proveedor" header="Proveedor" :style="{minWidth: '200px'}">
              <template #body="slotProps">
                <div class="font-semibold text-gray-800">{{ slotProps.data.proveedor }}</div>
              </template>
            </Column>

            <Column field="rnc_proveedor" header="RNC" :style="{minWidth: '120px'}"></Column>

            <Column field="no_factura" header="No. Factura" :style="{minWidth: '140px'}">
              <template #body="slotProps">
                <div class="font-mono text-sm font-semibold">{{ slotProps.data.no_factura }}</div>
              </template>
            </Column>

            <Column field="fecha_compra" header="F. Compra" :style="{minWidth: '120px'}">
              <template #body="slotProps">
                <Tag :value="slotProps.data.fecha_compra" severity="info" />
              </template>
            </Column>

            <Column field="fecha_vencimiento" header="F. Vencimiento" :style="{minWidth: '140px'}">
              <template #body="slotProps">
                <Tag
                  :value="slotProps.data.fecha_vencimiento"
                  :severity="slotProps.data.estado === 'VENCIDO' ? 'danger' : 'secondary'"
                />
              </template>
            </Column>

            <Column field="total" header="Total" :style="{minWidth: '140px'}">
              <template #body="slotProps">
                <div class="font-bold text-blue-600 text-lg">{{ formatCurrency(slotProps.data.total) }}</div>
              </template>
            </Column>

            <Column field="abono" header="Abonado" :style="{minWidth: '120px'}">
              <template #body="slotProps">
                <div class="text-green-600 font-semibold">{{ formatCurrency(slotProps.data.abono) }}</div>
              </template>
            </Column>

            <Column field="saldo" header="Saldo" :style="{minWidth: '140px'}">
              <template #body="slotProps">
                <div
                  class="font-bold text-lg"
                  :class="Number(slotProps.data.saldo) > 0 ? 'text-red-600' : 'text-green-600'"
                >
                  {{ formatCurrency(slotProps.data.saldo) }}
                </div>
              </template>
            </Column>

            <Column field="recordatorio" header="Recordatorio" :style="{minWidth: '120px'}">
              <template #body="slotProps">
                <i
                  v-if="slotProps.data.recordatorio"
                  class="pi pi-bell text-orange-500 text-xl"
                  v-tooltip.top="'Recordatorio activo'"
                ></i>
                <i v-else class="pi pi-bell-slash text-gray-400"></i>
              </template>
            </Column>

            <Column field="nota" header="Nota" :style="{minWidth: '200px'}">
              <template #body="slotProps">
                <div class="text-sm text-gray-600 truncate">{{ slotProps.data.nota || '-' }}</div>
              </template>
            </Column>

            <Column field="usuario" header="Usuario" :style="{minWidth: '140px'}"></Column>

          </DataTable>
        </div>

      </template>
    </Card>

    <!-- Dialog de Pago con Tailwind -->
    <Dialog
      v-model:visible="dialogPagoVisible"
      modal
      :closable="true"
      :style="{ width: '650px' }"
      :breakpoints="{ '960px': '90vw', '640px': '95vw' }"
    >
      <template #header>
        <div class="flex items-center gap-3">
          <div class="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
            <i class="pi pi-money-bill text-green-600 text-2xl"></i>
          </div>
          <div>
            <h2 class="text-xl font-bold text-gray-800">Registrar Pago</h2>
            <p class="text-sm text-gray-500" v-if="cuentaEnPago">{{ cuentaEnPago.proveedor }}</p>
          </div>
        </div>
      </template>

      <div class="space-y-6" v-if="cuentaEnPago">
        <!-- Información de la Cuenta -->
        <div class="bg-gradient-to-r from-blue-50 to-indigo-50 p-5 rounded-xl border border-blue-200">
          <div class="grid grid-cols-2 gap-4">
            <div>
              <p class="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">Factura</p>
              <p class="text-base font-bold text-gray-800">{{ cuentaEnPago.no_factura }}</p>
            </div>
            <div>
              <p class="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">Total</p>
              <p class="text-base font-bold text-blue-600">{{ formatCurrency(cuentaEnPago.total) }}</p>
            </div>
            <div>
              <p class="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">Abonado</p>
              <p class="text-base font-bold text-green-600">{{ formatCurrency(cuentaEnPago.abono) }}</p>
            </div>
            <div>
              <p class="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">Saldo Pendiente</p>
              <p class="text-lg font-black text-red-600">{{ formatCurrency(cuentaEnPago.saldo) }}</p>
            </div>
          </div>
        </div>

        <!-- Formulario -->
        <div class="space-y-5">
          <!-- Cuenta Contable -->
          <div>
            <label class="block text-sm font-bold text-gray-700 mb-2">
              <i class="pi pi-wallet mr-2 text-green-600"></i>
              Cuenta Contable a Afectar
            </label>
            <Dropdown
              v-model="formPago.cuentaContable"
              :options="catalogoCuentas"
              optionLabel="nombre"
              placeholder="Seleccionar cuenta contable"
              class="w-full"
              :class="{ 'border-red-500': !formPago.cuentaContable }"
            >
              <template #value="slotProps">
                <div v-if="slotProps.value" class="flex items-center justify-between gap-2">
                  <div class="flex items-center gap-2">
                    <i class="pi pi-wallet text-green-600"></i>
                    <span class="font-semibold">{{ slotProps.value.nombre }}</span>
                  </div>
                  <span class="text-sm text-gray-600">
                    Saldo: {{ formatCurrency(slotProps.value.saldo) }}
                  </span>
                </div>
                <span v-else class="text-gray-400">{{ slotProps.placeholder }}</span>
              </template>
              <template #option="slotProps">
                <div class="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
                  <div class="flex items-center gap-2">
                    <i class="pi pi-wallet text-green-600"></i>
                    <span class="font-semibold">{{ slotProps.option.nombre }}</span>
                  </div>
                  <span class="text-sm font-bold" :class="parseFloat(slotProps.option.saldo || 0) > 0 ? 'text-green-600' : 'text-red-600'">
                    {{ formatCurrency(slotProps.option.saldo) }}
                  </span>
                </div>
              </template>
            </Dropdown>
            <p class="text-xs text-gray-500 mt-1">
              <i class="pi pi-info-circle mr-1"></i>
              El saldo de esta cuenta se reducirá según el monto del pago
            </p>
          </div>

          <!-- Monto -->
          <div>
            <label class="block text-sm font-bold text-gray-700 mb-2">
              <i class="pi pi-dollar mr-2 text-blue-600"></i>
              Monto a Pagar
            </label>
            <div class="relative">
              <span class="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 font-bold text-lg">$</span>
              <InputNumber
                v-model="formPago.monto"
                mode="decimal"
                :minFractionDigits="2"
                :maxFractionDigits="2"
                :min="0.01"
                :max="parseFloat(cuentaEnPago.saldo)"
                placeholder="0.00"
                class="w-full"
                inputClass="w-full pl-8 pr-4 py-3 text-lg font-semibold"
                :class="{ 'border-red-500': formPago.monto <= 0 }"
              />
            </div>
            <div class="flex items-center justify-between mt-2">
              <p class="text-xs text-gray-500">
                <i class="pi pi-info-circle mr-1"></i>
                Máximo: {{ formatCurrency(cuentaEnPago.saldo) }}
              </p>
              <Button
                @click="formPago.monto = parseFloat(cuentaEnPago.saldo)"
                label="Pagar todo"
                size="small"
                text
                severity="success"
                class="text-xs"
              />
            </div>
          </div>

          <!-- Forma de Pago -->
          <div>
            <label class="block text-sm font-bold text-gray-700 mb-2">
              <i class="pi pi-credit-card mr-2 text-indigo-600"></i>
              Forma de Pago
            </label>
            <div class="grid grid-cols-2 gap-3">
              <div
                v-for="forma in formasPago"
                :key="forma"
                @click="formPago.formaPago = forma"
                :class="[
                  'p-3 rounded-lg border-2 cursor-pointer transition-all duration-200',
                  formPago.formaPago === forma
                    ? 'border-indigo-500 bg-indigo-50 shadow-md'
                    : 'border-gray-200 bg-white hover:border-indigo-300'
                ]"
              >
                <div class="flex items-center gap-2">
                  <i
                    :class="[
                      'text-lg',
                      forma === 'EFECTIVO' ? 'pi pi-money-bill' : '',
                      forma === 'TRANSFERENCIA' ? 'pi pi-send' : '',
                      forma === 'CHEQUE' ? 'pi pi-book' : '',
                      forma === 'TARJETA' ? 'pi pi-credit-card' : '',
                      formPago.formaPago === forma ? 'text-indigo-600' : 'text-gray-500'
                    ]"
                  ></i>
                  <span
                    :class="[
                      'font-semibold text-sm',
                      formPago.formaPago === forma ? 'text-indigo-700' : 'text-gray-700'
                    ]"
                  >
                    {{ forma }}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- Nota -->
          <div>
            <label class="block text-sm font-bold text-gray-700 mb-2">
              <i class="pi pi-file-edit mr-2 text-purple-600"></i>
              Nota del Pago (Opcional)
            </label>
            <Textarea
              v-model="formPago.nota"
              rows="3"
              placeholder="Agregar comentarios sobre este pago..."
              class="w-full resize-none"
            />
          </div>
        </div>
      </div>

      <template #footer>
        <div class="flex justify-end gap-3">
          <Button
            label="Cancelar"
            severity="secondary"
            outlined
            @click="dialogPagoVisible = false"
            icon="pi pi-times"
            class="px-6"
            :disabled="loadingPago"
          />
          <Button
            :label="loadingPago ? 'Procesando...' : 'Registrar Pago'"
            severity="success"
            @click="procesarPago"
            :icon="loadingPago ? 'pi pi-spin pi-spinner' : 'pi pi-check'"
            class="px-6"
            :loading="loadingPago"
            :disabled="loadingPago"
          />
        </div>
      </template>
    </Dialog>

    <!-- Dialog de Historial de Pagos -->
    <Dialog
      v-model:visible="dialogHistorialVisible"
      modal
      :closable="true"
      :style="{ width: '800px' }"
      :breakpoints="{ '960px': '90vw' }"
    >
      <template #header>
        <div class="flex items-center gap-3">
          <div class="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
            <i class="pi pi-history text-blue-600 text-2xl"></i>
          </div>
          <div>
            <h2 class="text-xl font-bold text-gray-800">Historial de Pagos</h2>
            <p class="text-sm text-gray-500" v-if="cuentaHistorial">
              {{ cuentaHistorial.proveedor }} - Factura: {{ cuentaHistorial.no_factura }}
            </p>
          </div>
        </div>
      </template>

      <div class="space-y-4" v-if="cuentaHistorial">
        <!-- Resumen -->
        <div class="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-xl border border-blue-200">
          <div class="grid grid-cols-3 gap-4 text-center">
            <div>
              <p class="text-xs font-semibold text-gray-600 uppercase mb-1">Total</p>
              <p class="text-lg font-bold text-gray-800">{{ formatCurrency(cuentaHistorial.total) }}</p>
            </div>
            <div>
              <p class="text-xs font-semibold text-gray-600 uppercase mb-1">Abonado</p>
              <p class="text-lg font-bold text-green-600">{{ formatCurrency(cuentaHistorial.abono) }}</p>
            </div>
            <div>
              <p class="text-xs font-semibold text-gray-600 uppercase mb-1">Saldo</p>
              <p class="text-lg font-bold text-red-600">{{ formatCurrency(cuentaHistorial.saldo) }}</p>
            </div>
          </div>
        </div>

        <!-- Lista de Pagos -->
        <div v-if="historialPagos.length > 0" class="space-y-3">
          <h3 class="font-bold text-gray-700 flex items-center gap-2">
            <i class="pi pi-list text-blue-600"></i>
            Pagos Realizados ({{ historialPagos.length }})
          </h3>

          <div
            v-for="(pago, index) in historialPagos.slice().reverse()"
            :key="pago.id"
            class="bg-white border-2 border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-all duration-200"
          >
            <div class="flex items-start justify-between">
              <div class="flex-1">
                <div class="flex items-center gap-2 mb-2">
                  <span class="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-bold">
                    #{{ historialPagos.length - index }}
                  </span>
                  <span class="text-sm text-gray-600">
                    <i class="pi pi-calendar mr-1"></i>
                    {{ pago.fecha }}
                  </span>
                  <span class="text-sm text-gray-600">
                    <i class="pi pi-user mr-1"></i>
                    {{ pago.usuario }}
                  </span>
                </div>

                <div class="grid grid-cols-2 gap-3 mb-2">
                  <div>
                    <p class="text-xs text-gray-500 mb-1">Cuenta Afectada</p>
                    <p class="text-sm font-semibold text-gray-800 flex items-center gap-1">
                      <i class="pi pi-wallet text-green-600"></i>
                      {{ pago.cuenta_contable }}
                    </p>
                  </div>
                  <div>
                    <p class="text-xs text-gray-500 mb-1">Forma de Pago</p>
                    <p class="text-sm font-semibold text-gray-800 flex items-center gap-1">
                      <i
                        :class="[
                          pago.forma_pago === 'EFECTIVO' ? 'pi pi-money-bill' : '',
                          pago.forma_pago === 'TRANSFERENCIA' ? 'pi pi-send' : '',
                          pago.forma_pago === 'CHEQUE' ? 'pi pi-book' : '',
                          pago.forma_pago === 'TARJETA' ? 'pi pi-credit-card' : '',
                          'text-indigo-600'
                        ]"
                      ></i>
                      {{ pago.forma_pago }}
                    </p>
                  </div>
                </div>

                <div v-if="pago.nota" class="bg-gray-50 p-2 rounded border border-gray-200 mt-2">
                  <p class="text-xs text-gray-500 mb-1">Nota</p>
                  <p class="text-sm text-gray-700">{{ pago.nota }}</p>
                </div>
              </div>

              <div class="ml-4 text-right flex flex-col items-end gap-2">
                <div>
                  <p class="text-xs text-gray-500 mb-1">Monto</p>
                  <p class="text-2xl font-black text-green-600">{{ formatCurrency(pago.monto) }}</p>
                </div>
                <Button
                  @click="generarPDFPago(pago)"
                  icon="pi pi-file-pdf"
                  label="PDF"
                  size="small"
                  severity="danger"
                  outlined
                  class="text-xs"
                />
              </div>
            </div>
          </div>
        </div>

        <!-- Sin pagos -->
        <div v-else class="text-center py-8">
          <i class="pi pi-inbox text-gray-300 text-5xl mb-3"></i>
          <p class="text-gray-500 font-semibold">No hay pagos registrados</p>
          <p class="text-sm text-gray-400">Los pagos realizados aparecerán aquí</p>
        </div>
      </div>

      <template #footer>
        <div class="flex justify-between">
          <Button
            v-if="historialPagos.length > 0"
            label="PDF de Todos"
            severity="danger"
            @click="generarPDFTodosPagos"
            icon="pi pi-file-pdf"
            class="px-6"
          />
          <div class="ml-auto">
            <Button
              label="Cerrar"
              severity="secondary"
              outlined
              @click="dialogHistorialVisible = false"
              icon="pi pi-times"
              class="px-6"
            />
          </div>
        </div>
      </template>
    </Dialog>

    <Toast />
  </div>
</main>
</template>

<style scoped>
/* ===================================
   CUENTAS X PAGAR MODERN STYLES
   =================================== */

/* Main Wrapper */
.cuentas-wrapper {
  min-height: calc(100vh - 80px);
  background: linear-gradient(135deg, rgba(254, 242, 242, 0.5) 0%, rgba(254, 226, 226, 0.3) 100%);
}

/* Container */
.container-cuentas {
  max-width: 1400px;
}

/* Stats Cards */
.stat-card {
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  border: 1px solid rgba(229, 231, 235, 0.8);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
  animation: slideIn 0.4s ease-out;
}

.stat-card:hover {
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.15);
  transform: translateY(-4px);
}

.stat-card-content {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.5rem;
}

.stat-icon-wrapper {
  width: 64px;
  height: 64px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
  transition: all 0.3s ease;
}

.stat-icon-wrapper:hover {
  transform: scale(1.1) rotate(5deg);
}

.bg-gradient-red {
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
}

.bg-gradient-danger {
  background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%);
}

.bg-gradient-blue {
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
}

.bg-gradient-green {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
}

.stat-info {
  flex: 1;
}

.stat-label {
  display: block;
  font-size: 0.875rem;
  font-weight: 600;
  color: #6b7280;
  margin-bottom: 0.5rem;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: 800;
  color: #1f2937;
  line-height: 1.2;
}

/* Main Card */
.main-card {
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  border: 1px solid rgba(229, 231, 235, 0.8);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
  animation: slideIn 0.5s ease-out;
}

/* Card Header */
.card-header-modern {
  padding: 1.5rem;
  background: linear-gradient(135deg, rgba(254, 242, 242, 0.8) 0%, rgba(254, 226, 226, 0.6) 100%);
  border-bottom: 1px solid rgba(229, 231, 235, 0.6);
}

.icon-wrapper-modern {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  transition: all 0.3s ease;
}

.icon-wrapper-modern:hover {
  transform: scale(1.1) rotate(5deg);
}

/* Actions Section */
.actions-section {
  padding: 0;
}

.action-btn {
  padding: 0.75rem 1.5rem;
  font-weight: 600;
  border-radius: 10px;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.action-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
}

/* Filters Row */
.filters-row {
  background: rgba(249, 250, 251, 0.8);
  padding: 1rem;
  border-radius: 10px;
  border: 1px solid #e5e7eb;
}

.filter-label {
  font-weight: 600;
  color: #374151;
  font-size: 0.95rem;
}

.estado-filter :deep(.p-button) {
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  font-weight: 600;
}

/* Search Input */
.search-wrapper {
  width: 100%;
}

.search-input {
  padding: 0.75rem 1rem 0.75rem 2.5rem !important;
  border: 2px solid #e5e7eb;
  border-radius: 10px;
  font-size: 0.95rem;
  transition: all 0.3s ease;
  background: white;
}

.search-input:focus {
  border-color: #ef4444;
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
  outline: none;
}

/* DataTable Wrapper */
.datatable-wrapper {
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid #e5e7eb;
}

.cuentas-datatable {
  font-size: 0.95rem;
}

/* DataTable Custom Styles */
:deep(.cuentas-datatable .p-datatable-thead > tr > th) {
  background: linear-gradient(135deg, rgba(239, 68, 68, 0.05) 0%, rgba(220, 38, 38, 0.05) 100%);
  color: #374151;
  font-weight: 700;
  padding: 1rem;
  border-bottom: 2px solid #e5e7eb;
}

:deep(.cuentas-datatable .p-datatable-tbody > tr) {
  transition: all 0.2s ease;
}

:deep(.cuentas-datatable .p-datatable-tbody > tr:hover) {
  background: rgba(239, 68, 68, 0.05);
}

:deep(.cuentas-datatable .p-datatable-tbody > tr > td) {
  padding: 1rem;
  border-bottom: 1px solid #f3f4f6;
}

:deep(.cuentas-datatable .p-paginator) {
  background: #f9fafb;
  border-top: 1px solid #e5e7eb;
  padding: 1rem;
}

/* PrimeVue Card Override */
.stat-card :deep(.p-card-content),
.main-card :deep(.p-card-header) {
  padding: 0;
}

.main-card :deep(.p-card-content) {
  padding: 1.5rem;
}

.main-card :deep(.p-card-body) {
  padding: 0;
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

/* Responsive Adjustments */
@media (max-width: 768px) {
  .stat-card-content {
    padding: 1rem;
  }

  .stat-icon-wrapper {
    width: 56px;
    height: 56px;
  }

  .stat-value {
    font-size: 1.25rem;
  }

  .card-header-modern {
    padding: 1rem;
  }

  .action-btn {
    padding: 0.625rem 1rem;
    font-size: 0.875rem;
  }

  .filters-row {
    padding: 0.75rem;
  }

  .estado-filter :deep(.p-button) {
    padding: 0.4rem 0.75rem;
    font-size: 0.8rem;
  }
}

/* Dialog de Pago Styles */
:deep(.p-dialog .p-dialog-header) {
  padding: 1.5rem;
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.05) 0%, rgba(5, 150, 105, 0.05) 100%);
  border-bottom: 2px solid #e5e7eb;
}

:deep(.p-dialog .p-dialog-content) {
  padding: 1.5rem;
}

:deep(.p-dialog .p-dialog-footer) {
  padding: 1.25rem 1.5rem;
  background: #f9fafb;
  border-top: 2px solid #e5e7eb;
}

/* InputNumber custom styles */
:deep(.p-inputnumber-input) {
  border: 2px solid #e5e7eb !important;
  border-radius: 0.5rem !important;
  transition: all 0.3s ease !important;
}

:deep(.p-inputnumber-input:focus) {
  border-color: #10b981 !important;
  box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1) !important;
}

/* Dropdown custom styles */
:deep(.p-dropdown) {
  border: 2px solid #e5e7eb;
  border-radius: 0.5rem;
  transition: all 0.3s ease;
}

:deep(.p-dropdown:hover) {
  border-color: #10b981;
}

:deep(.p-dropdown.p-focus) {
  border-color: #10b981;
  box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1);
}

/* Textarea custom styles */
:deep(.p-inputtextarea) {
  border: 2px solid #e5e7eb !important;
  border-radius: 0.5rem !important;
  transition: all 0.3s ease !important;
}

:deep(.p-inputtextarea:focus) {
  border-color: #8b5cf6 !important;
  box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.1) !important;
}

/* Loading button animation */
:deep(.p-button.p-disabled) {
  opacity: 0.7;
  cursor: not-allowed;
}

/* Spinner animation */
@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.pi-spin {
  animation: spin 1s linear infinite;
}
</style>
