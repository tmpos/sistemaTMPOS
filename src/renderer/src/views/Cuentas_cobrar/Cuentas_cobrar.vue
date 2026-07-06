<script setup>
import { ref, onMounted, computed, watch, watchEffect } from 'vue';
import { useRouter } from 'vue-router';
const router = useRouter();
import { peticionesFetchOffline, nfecha, obtenerIdsSeleccionados, encryptarPassword, envioElectron, crearTablaSiNoExisteOffline, formatearFecha, transformarFechaTimestamp, enviarDatosLocalStorage, generarTablaFromStringJSON, crearTransferencia, generarCodigoUnico } from '@/funciones/funciones.js';
import Swal from 'sweetalert2';
import { useToast } from "primevue/usetoast";
const toast = useToast();
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import EnviarWhatsApp from '@/components/WhatsappModal.vue';
import Awesomplete from '@/components/Awesomplete.vue';
import Dialog from 'primevue/dialog';
import Dropdown from 'primevue/dropdown';
import InputNumber from 'primevue/inputnumber';
import Textarea from 'primevue/textarea';
import FacturaPDFprint from '@/components/facturaPDFprint.vue';
import Ticketpdfprint from '@/components/ticketpdfprint.vue';
import CuentasCobrarPDFprint from '@/components/CuentasCobrarPDFprint.vue';
import CuentasCobrarTicketprint from '@/components/CuentasCobrarTicketprint.vue';
/************************************************************************/
import { useDatosEmpresa } from '@/stores';
const datosEmpresa = useDatosEmpresa();
const token = ref('');
const tokenCorto = ref('');
const tokenCifrado = ref('');
const link = ref('');
const api = ref('');
const usuarioLocal = ref({});
/************************************************************************/
const camposArray = ["almacen", "no_emision", "no_factura","comprobante", "cod_cliente", "nombre_cliente", "cedula_cliente", "telefono_cliente", "whatsapp_cliente", "email_cliente", "direccion_cliente", "rnc_cliente", "nombrecomercial_cliente", "fecha_emision", "monto_credito", "interes", "fecha_vencimiento", "cuotas", "saldo", "abonado", "fecha_pago", "pagos", "estatus", "hora", "vendedor", "delivery", "nota", "usuario", "valorcuotascredito", "tipocredito", "tiempocredito", "fechas_pago_credito", "institucion", "cliente", "quiencredito", "identificadordb"];
/************************************************************************/
const data = ref([]);
const searchQuery = ref('');
const estadoFilter = ref('PENDIENTE');
const institucionFilter = ref('TODAS');
const filtrarPorFecha = ref(null);
const buscadorFechaInteligente = ref(null);
const fechaInteligente = ref(false);
const menu = ref(null);
const menuInteligente = ref(null);
const currentRowData = ref(null);
const itemsCuentas = ref([]);
const institucionesArray = ref([]);
/************************************************************************/
const enviarWhatsAppRef = ref(null);
const datosWhatsApp = ref({
  nombre: '',
  numero: '',
  texto: ''
});
/************************************************************************/
// Variables para búsqueda de cliente y agrupación
const clienteSeleccionado = ref(null);
const clienteSeleccionadoModal = ref(null);
const clienteSeleccionadoCodigo = ref(null);
const clienteSeleccionadoCompleto = ref({});
const facturasPendientes = ref([]);
const clientesArray = ref([]);
const clientesArrayNombre = ref([]);
const totaAdeudado = ref(0);
const cantidadFacturas = ref(0);
const visibleDatosCliente = ref(false);
/************************************************************************/
// Variables para abonos
const visibleAbono = ref(false);
const visibleAbonoModal = ref(false);
const visibleAbonosInteligentes = ref(false);
const visiblePrint = ref(false);
const visiblePrint01 = ref(false);
const visiblePrintFactura = ref(false);
const visibleProductosFactura = ref(false);
const visibleCrearCxC = ref(false);
const nuevaCxC = ref({
  nombre_cliente: '',
  telefono_cliente: '',
  cedula_cliente: '',
  direccion_cliente: '',
  cod_cliente: '',
  monto_credito: 0,
  saldo: 0,
  fecha_emision: null,
  fecha_vencimiento: null,
  interes: 0,
  cuotas: 0,
  nota: '',
  monto_abono: 0,
  metodo_abono: 'EFECTIVO'
});
const fechaAbonoModal = ref(null);
const abonoAbonoModal = ref(null);
const metodoAbonoModal = ref(null);
const bancoAbonoModal = ref(null);
const btn1Abono = ref(null);
const btn2Abono = ref(null);
const btn3Abono = ref(null);
const datosAbonosInteligentes = ref([]);
const productosFactura = ref([]);
const facturaProductosInfo = ref({
  no_factura: '',
  nombre_cliente: ''
});
/************************************************************************/
// Nueva modal de pago con cuenta contable
const dialogPagoVisible = ref(false);
const cuentaEnPago = ref(null);
const loadingPago = ref(false);
const catalogoCuentas = ref([]);
const formPago = ref({
  cuentaContable: null,
  monto: 0,
  nota: '',
  formaPago: 'EFECTIVO',
  banco: null
});
const formasPago = ref(['EFECTIVO', 'TRANSFERENCIA', 'CHEQUE', 'TARJETA']);
const bancoArray = ref([]);
const cuentaBancaria = ref(null);
const dialogHistorialVisible = ref(false);
const historialPagos = ref([]);
const cuentaHistorial = ref(null);
/************************************************************************/
const facturaPdfPrintRef = ref(null);
const ticketPdfPrintRef = ref(null);
const cxcPdfPrintRef = ref(null);
const cxcTicketPrintRef = ref(null);
/************************************************************************/
watchEffect(() => {
  if (visibleAbono.value) {
    fechaAbonoModal.value = nfecha('fecha');
    metodoAbonoModal.value = 'EFECTIVO';
    bancoAbonoModal.value = cuentaBancaria.value;
    btn1Abono.value = (Number(currentRowData.value.saldo) / 4).toFixed(2);
    btn2Abono.value = (Number(currentRowData.value.saldo) / 2).toFixed(2);
    btn3Abono.value = (Number(currentRowData.value.saldo)).toFixed(2);
    abonoAbonoModal.value = currentRowData.value.saldo;
  }

  if (visibleAbonoModal.value) {
    fechaAbonoModal.value = nfecha('fecha');
    metodoAbonoModal.value = 'EFECTIVO';
    bancoAbonoModal.value = cuentaBancaria.value;
    btn1Abono.value = (Number(totaAdeudado.value) / 4).toFixed(2);
    btn2Abono.value = (Number(totaAdeudado.value) / 2).toFixed(2);
    btn3Abono.value = (Number(totaAdeudado.value)).toFixed(2);
    abonoAbonoModal.value = totaAdeudado.value;
  }
});
/************************************************************************/
const fetchAndSetupData = async () => {
  const response = await peticionesFetchOffline('getDataAsArray', 'cuentas_cobrar');
  const jsonData = response.filter(fact => fact.almacen === datosEmpresa.empresa.nombre).reverse();
  data.value = jsonData;
  clientesArrayNombre.value = [...new Set(response.map(cuenta => cuenta.nombre_cliente))];
};
/************************************************************************/
const fetchClientes = async () => {
  const response = await peticionesFetchOffline('getDataAsArray', 'clientes');
  const filteredClientes = response.filter(cliente => cliente.nombre && cliente.nombre.trim() !== '');
  clientesArray.value = filteredClientes;
};
/************************************************************************/
const fetchInstituciones = async () => {
  try {
    const response = await peticionesFetchOffline('getDataAsArray', 'instituciones');
    if (response && response.length > 0) {
      // Extraer solo los nombres de las instituciones
      const nombresInstituciones = response
        .map(inst => inst.nombre)
        .filter(nombre => nombre && nombre.trim() !== ''); // Filtrar nombres vacíos

      // Agregar opciones TODAS y NINGUNA al inicio
      institucionesArray.value = ['TODAS', 'NINGUNA', ...nombresInstituciones];
    } else {
      institucionesArray.value = ['TODAS', 'NINGUNA'];
    }
  } catch (error) {
    console.error('Error al cargar instituciones:', error);
    institucionesArray.value = ['TODAS', 'NINGUNA'];
  }
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
const fetchBanco = async () => {
  try {
    const bancosLocalStorage = JSON.parse(window.localStorage.getItem('bancos')) || [];

    if (bancosLocalStorage.length > 0) {
      bancoArray.value = bancosLocalStorage;
      cuentaBancaria.value = bancosLocalStorage[bancosLocalStorage.length - 1] || null;
      return;
    }

    const response = await peticionesFetchOffline('getDataAsArray', 'banco');
    const columnas = await peticionesFetchOffline('getTableColumns', 'banco');
    if (Array.isArray(columnas) && !columnas.includes('almacen')) {
      await peticionesFetchOffline('addColumnToTable', { tabla: 'banco', campo: 'almacen' });
      await peticionesFetchOffline('updateEntireColumn', 'banco', 'almacen', datosEmpresa.empresa.nombre);
    }

    bancoArray.value = response || [];
    cuentaBancaria.value = bancoArray.value[bancoArray.value.length - 1] || null;
    window.localStorage.setItem('bancos', JSON.stringify(bancoArray.value));
  } catch (error) {
    console.error('Error al cargar bancos:', error);
    toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar los bancos', life: 3000 });
  }
};
/************************************************************************/
const requiereBanco = (metodo) => ['TRANSFERENCIA', 'TARJETA'].includes(String(metodo || '').toUpperCase());
/************************************************************************/
const registrarMovimientoBanco = async (cuenta, pago) => {
  if (!requiereBanco(pago?.metodo)) {
    return true;
  }

  const bancoSeleccionado = pago?.banco || cuentaBancaria.value;
  if (!bancoSeleccionado?.id) {
    toast.add({ severity: 'error', summary: 'Error', detail: 'Debe seleccionar un banco', life: 3000 });
    return false;
  }

  const resultado = await crearTransferencia(
    link.value,
    api.value,
    tokenCifrado.value,
    toast,
    cuenta.no_factura || cuenta.no_emision,
    parseFloat(pago.cantidad).toFixed(2),
    bancoSeleccionado,
    cuenta.nombre_cliente,
    datosEmpresa.empresa.nombre
  );

  if (Array.isArray(resultado) && resultado[0] === 'ok') {
    await fetchBanco();
    return true;
  }

  toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo registrar la entrada en el banco', life: 3000 });
  return false;
};
/************************************************************************/
const showWhatsAppModal = async (datosFactura) => {
  if (enviarWhatsAppRef.value) {
    const mensajaeEnviar = `Hola *${datosFactura.nombre_cliente}* le escribimos de *${datosEmpresa.empresa.nombre}* para notificarle de un saldo pendiente de *$${datosFactura.saldo}* correspondiente a la factura *${datosFactura.no_factura}*`;

    datosWhatsApp.value.nombre = datosFactura.nombre_cliente;
    datosWhatsApp.value.numero = datosFactura.telefono_cliente;
    datosWhatsApp.value.texto = mensajaeEnviar;
    enviarWhatsAppRef.value.updateDatosWhatsApp(datosWhatsApp.value);
    enviarWhatsAppRef.value.visible = true;
  }
};
/************************************************************************/
// Búsqueda de cliente y agrupación de facturas
const handleSelectComplete = async (selected) => {
  let cliente = clientesArray.value.find(client => client.nombre === selected.value);

  if (!cliente) {
    toast.add({ severity: 'warn', summary: 'Aviso', detail: 'Cliente no encontrado', life: 3000 });
    return;
  }

  const datosArray = data.value.filter(fact => fact.cod_cliente === cliente.codigo).filter(fact => fact.estatus === 'PENDIENTE');
  clienteSeleccionadoModal.value = selected.value;
  clienteSeleccionadoCodigo.value = cliente.codigo;
  clienteSeleccionadoCompleto.value = cliente;
  facturasPendientes.value = datosArray;
  totaAdeudado.value = datosArray.map(factura => Number(factura.saldo)).reduce((total, saldo) => total + saldo, 0).toFixed(2);
  cantidadFacturas.value = datosArray.length;
  visibleDatosCliente.value = true;
  clienteSeleccionado.value = '';
};
/************************************************************************/
// Nueva función para abrir dialog de pago
const abrirDialogPago = (cuenta) => {
  cuentaEnPago.value = cuenta;
  loadingPago.value = false;

  // Buscar cuenta de Caja Chica y establecerla por defecto
  const cajaChica = catalogoCuentas.value.find(c =>
    c.nombre && c.nombre.toLowerCase().includes('caja chica')
  );

  formPago.value = {
    cuentaContable: cajaChica || null,
    monto: parseFloat(cuenta.saldo || 0),
    nota: '',
    formaPago: 'EFECTIVO',
    banco: cuentaBancaria.value
  };

  dialogPagoVisible.value = true;
};
/************************************************************************/
// Nueva función para procesar pago con cuenta contable
const procesarPago = async () => {
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

  if (requiereBanco(formPago.value.formaPago) && !formPago.value.banco?.id) {
    toast.add({
      severity: 'warn',
      summary: 'Validación',
      detail: 'Debes seleccionar el banco donde se registrara la entrada',
      life: 3000
    });
    return;
  }

  loadingPago.value = true;

  try {
    const pagosArray = JSON.parse(cuenta.pagos || '[]');
    const saldoNuevo = (Number(cuenta.saldo) - Number(formPago.value.monto)).toFixed(2);
    const estado = saldoNuevo <= 0 ? 'SALDADO' : 'PENDIENTE';

    const numeroPago = pagosArray.length + 1;
    const npago = {
      "nopago": numeroPago,
      "cantidad": parseFloat(formPago.value.monto).toFixed(2),
      "metodo": formPago.value.formaPago,
      "fecha": nfecha('fecha'),
      "hora": nfecha('hora'),
      "timestamp": nfecha('timestamp'),
      "turno": '',
      "cajero": usuarioLocal.value.usuario || 'SISTEMA',
      "saldo": saldoNuevo,
      "cuenta_contable": formPago.value.cuentaContable.nombre,
      "cuenta_contable_id": formPago.value.cuentaContable.id,
      "banco": requiereBanco(formPago.value.formaPago) ? (formPago.value.banco?.nombre || '') : '',
      "nota": formPago.value.nota || ''
    };

    pagosArray.push(npago);

    const sumaAbono = pagosArray.map(abono => parseFloat(abono.cantidad)).reduce((acc, curr) => acc + curr, 0).toFixed(2);

    cuenta.pagos = JSON.stringify(pagosArray);
    cuenta.estatus = estado;
    cuenta.abonado = sumaAbono;
    cuenta.saldo = saldoNuevo;
    cuenta.updated_at = nfecha('timestamp');

    // Actualizar cuenta contable
    const cuentaContable = formPago.value.cuentaContable;
    if (cuentaContable) {
      const nuevoSaldoCuenta = parseFloat(cuentaContable.saldo || 0) + parseFloat(formPago.value.monto);
      const cuentaContableActualizada = {
        ...cuentaContable,
        saldo: nuevoSaldoCuenta.toFixed(2)
      };
      await peticionesFetchOffline('updateData', 'cuentas', JSON.stringify(cuentaContableActualizada));
    }

    const peticion = await peticionesFetchOffline('updateData', 'cuentas_cobrar', JSON.stringify(cuenta));

    if (peticion[0] === 'ok') {
      const movimientoBancoOk = await registrarMovimientoBanco(cuenta, {
        metodo: formPago.value.formaPago,
        cantidad: formPago.value.monto,
        banco: formPago.value.banco
      });
      if (!movimientoBancoOk) {
        return;
      }

      toast.add({
        severity: 'success',
        summary: 'Pago Registrado',
        detail: `$${parseFloat(formPago.value.monto).toFixed(2)} abonado correctamente. Cuenta ${cuentaContable?.nombre || ''} afectada.`,
        life: 4000
      });

      // Imprimir recibo automáticamente
      if (window.electron) {
        const datosEmpresaA = JSON.stringify(enviarDatosLocalStorage());
        await window.electron.ipcRenderer.invoke('facturaCredito', cuenta.no_emision, datosEmpresaA);
      }

      await fetchAndSetupData();
      await fetchCatalogoCuentas();

      dialogPagoVisible.value = false;

      if (estado === 'SALDADO') {
        Swal.fire({
          title: '¡Cuenta Saldada!',
          text: 'La cuenta ha sido pagada completamente',
          icon: 'success',
          confirmButtonColor: '#10b981'
        });
      }
    } else {
      toast.add({ severity: 'error', summary: 'Error', detail: 'Error al registrar pago', life: 3000 });
    }
  } catch (error) {
    console.error('Error al procesar pago:', error);
    toast.add({ severity: 'error', summary: 'Error', detail: 'Error al procesar el pago', life: 3000 });
  } finally {
    loadingPago.value = false;
  }
};
/************************************************************************/
// Ver historial de pagos
const verHistorialPagos = (cuenta) => {
  cuentaHistorial.value = cuenta;

  try {
    historialPagos.value = cuenta.pagos
      ? (typeof cuenta.pagos === 'string' ? JSON.parse(cuenta.pagos) : cuenta.pagos)
      : [];
  } catch (e) {
    console.error('Error al parsear historial:', e);
    historialPagos.value = [];
  }

  dialogHistorialVisible.value = true;
};
/************************************************************************/
// Realizar abono a una factura individual (mantener para compatibilidad)
const realizarAbono = async (cuenta) => {
  const { value: formValues } = await Swal.fire({
    title: `Realizar Abono - ${cuenta.nombre_cliente}`,
    html: `
      <div class="grid grid-cols-1 gap-4">
        <div>
          <label class="block text-sm font-semibold mb-2">Saldo Actual: <span class="text-red-600">$${parseFloat(cuenta.saldo).toFixed(2)}</span></label>
        </div>
        <div>
          <label for="monto-abono" class="block text-sm font-semibold mb-2">Monto a Abonar</label>
          <input type="number" id="monto-abono" class="swal2-input" value="${cuenta.saldo}" step="0.01" max="${cuenta.saldo}">
        </div>
        <div>
          <label for="metodo-abono" class="block text-sm font-semibold mb-2">Método de Pago</label>
          <select id="metodo-abono" class="swal2-input">
            <option value="EFECTIVO">EFECTIVO</option>
            <option value="TRANSFERENCIA">TRANSFERENCIA</option>
            <option value="TARJETA">TARJETA</option>
            <option value="CHEQUE">CHEQUE</option>
          </select>
        </div>
      </div>
    `,
    showCancelButton: true,
    confirmButtonText: 'Registrar Abono',
    cancelButtonText: 'Cancelar',
    confirmButtonColor: '#10b981',
    preConfirm: () => {
      const monto = document.getElementById('monto-abono').value;
      const metodo = document.getElementById('metodo-abono').value;

      if (!monto || parseFloat(monto) <= 0) {
        Swal.showValidationMessage('El monto debe ser mayor a 0');
        return false;
      }

      if (parseFloat(monto) > parseFloat(cuenta.saldo)) {
        Swal.showValidationMessage('El monto no puede ser mayor al saldo');
        return false;
      }

      return { monto: parseFloat(monto), metodo };
    }
  });

  if (formValues) {
    const pagosArray = JSON.parse(cuenta.pagos || '[]');
    const saldoN = (Number(cuenta.saldo) - Number(formValues.monto)).toFixed(2);
    const estado = saldoN <= 0 ? 'SALDADO' : 'PENDIENTE';

    const numeroPago = pagosArray.length + 1;
    const npago = {
      "nopago": numeroPago,
      "cantidad": formValues.monto.toFixed(2),
      "metodo": formValues.metodo,
      "fecha": nfecha('fecha'),
      "hora": nfecha('hora'),
      "timestamp": nfecha('timestamp'),
      "turno": '',
      "cajero": usuarioLocal.value.usuario || 'SISTEMA',
      "saldo": saldoN
    };

    pagosArray.push(npago);

    const sumaAbono = pagosArray.map(abono => parseFloat(abono.cantidad)).reduce((acc, curr) => acc + curr, 0).toFixed(2);

    cuenta.pagos = JSON.stringify(pagosArray);
    cuenta.estatus = estado;
    cuenta.abonado = sumaAbono;
    cuenta.saldo = saldoN;
    cuenta.updated_at = nfecha('timestamp');

    const peticion = await peticionesFetchOffline('updateData', 'cuentas_cobrar', JSON.stringify(cuenta));

    if (peticion[0] === 'ok') {
      toast.add({ severity: 'success', summary: 'Abono Registrado', detail: `$${formValues.monto} abonado correctamente`, life: 4000 });

      // Imprimir recibo automáticamente
      if (window.electron) {
        const datosEmpresaA = JSON.stringify(enviarDatosLocalStorage());
        await window.electron.ipcRenderer.invoke('facturaCredito', cuenta.no_emision, datosEmpresaA);
      }

      await fetchAndSetupData();

      if (estado === 'SALDADO') {
        Swal.fire({
          title: '¡Cuenta Saldada!',
          text: 'La cuenta ha sido pagada completamente',
          icon: 'success',
          confirmButtonColor: '#10b981'
        });
      }
    } else {
      toast.add({ severity: 'error', summary: 'Error', detail: 'Error al registrar abono', life: 3000 });
    }
  }
};
/************************************************************************/
// Agregar abono desde modal (factura individual)
const fnbtnAgregArbono = (cantidad) => {
  abonoAbonoModal.value = Number(cantidad).toFixed(2);
};
/************************************************************************/
const fnAgregarAbono = async () => {
  const pagosArray = JSON.parse(currentRowData.value.pagos) || [];
  const saldoN = (Number(currentRowData.value.saldo) - Number(abonoAbonoModal.value)).toFixed(2);

  var estado = 'PENDIENTE';
  if (saldoN <= 0) {
    estado = 'SALDADO';
  }

  if (Number(abonoAbonoModal.value) > Number(currentRowData.value.saldo)) {
    toast.add({ severity: 'error', summary: 'Error', detail: 'El Abono no puede ser mayor que el Saldo Pendiente', life: 3000 });
    return;
  }

  if (requiereBanco(metodoAbonoModal.value) && !bancoAbonoModal.value?.id) {
    toast.add({ severity: 'error', summary: 'Error', detail: 'Debe seleccionar un banco', life: 3000 });
    return;
  }

  visibleAbono.value = false;

  const numeroPago = (pagosArray.length + 1);
  const npago = {
    "nopago": numeroPago,
    "cantidad": abonoAbonoModal.value,
    "metodo": metodoAbonoModal.value,
    "fecha": fechaAbonoModal.value,
    "timestamp": nfecha('timestamp'),
    "hora": nfecha('hora'),
    "turno": '',
    "cajero": usuarioLocal.value.usuario || 'SISTEMA',
    "banco": requiereBanco(metodoAbonoModal.value) ? (bancoAbonoModal.value?.nombre || '') : '',
    "saldo": saldoN
  };

  pagosArray.push(npago);

  const sumaAbono = pagosArray.map(abono => Number(abono.cantidad)).reduce((acc, curr) => acc + curr, 0).toFixed(2);

  currentRowData.value.pagos = JSON.stringify(pagosArray);
  currentRowData.value.estatus = estado;
  currentRowData.value.abonado = sumaAbono;
  currentRowData.value.saldo = saldoN;
  currentRowData.value.updated_at = nfecha('timestamp');

  const peticion = await peticionesFetchOffline('updateData', 'cuentas_cobrar', JSON.stringify(currentRowData.value));

  if (peticion[0] === 'ok') {
    const movimientoBancoOk = await registrarMovimientoBanco(currentRowData.value, {
      metodo: metodoAbonoModal.value,
      cantidad: abonoAbonoModal.value,
      banco: bancoAbonoModal.value
    });
    if (!movimientoBancoOk) {
      return;
    }

    toast.add({ severity: 'success', summary: 'Cuenta Actualizada', detail: 'Cuenta actualizada correctamente', life: 3000 });

    const datosEmpresa = JSON.stringify(enviarDatosLocalStorage());
    if (window.electron) {
      window.electron.ipcRenderer.invoke('facturaCredito', currentRowData.value.no_emision, datosEmpresa);
    }

    await fetchAndSetupData();
  } else {
    toast.add({ severity: 'error', summary: 'Error', detail: 'Error al actualizar cuenta', life: 3000 });
  }
};
/************************************************************************/
// Agregar abono a múltiples facturas (distribuido automáticamente)
const fnAgregarAbonoModal = async () => {
  let totalAbonado = Number(abonoAbonoModal.value);

  if (requiereBanco(metodoAbonoModal.value) && !bancoAbonoModal.value?.id) {
    toast.add({ severity: 'error', summary: 'Error', detail: 'Debe seleccionar un banco', life: 3000 });
    return;
  }

  visibleAbonoModal.value = false;

  for (let factura of facturasPendientes.value) {
    if (totalAbonado <= 0) break;

    const pagosArray = JSON.parse(factura.pagos) || [];
    const saldoFactura = Number(factura.saldo);

    let abonoActual = Math.min(totalAbonado, saldoFactura);
    let saldoN = (saldoFactura - abonoActual).toFixed(2);

    var estado = 'PENDIENTE';
    if (saldoN <= 0) {
      estado = 'SALDADO';
    }

    const numeroPago = pagosArray.length + 1;
    const npago = {
      "nopago": numeroPago,
      "cantidad": abonoActual.toFixed(2),
      "metodo": metodoAbonoModal.value,
      "fecha": fechaAbonoModal.value,
      "timestamp": nfecha('timestamp'),
      "hora": nfecha('hora'),
      "turno": '',
      "cajero": usuarioLocal.value.usuario || 'SISTEMA',
      "banco": requiereBanco(metodoAbonoModal.value) ? (bancoAbonoModal.value?.nombre || '') : '',
      "saldo": saldoN
    };

    pagosArray.push(npago);

    const sumaAbono = pagosArray.map(abono => Number(abono.cantidad)).reduce((acc, curr) => acc + curr, 0).toFixed(2);

    factura.pagos = JSON.stringify(pagosArray);
    factura.estatus = estado;
    factura.abonado = sumaAbono;
    factura.saldo = saldoN;
    factura.updated_at = nfecha('timestamp');

    const peticion = await peticionesFetchOffline('updateData', 'cuentas_cobrar', JSON.stringify(factura));
    if (peticion[0] === 'ok') {
      const movimientoBancoOk = await registrarMovimientoBanco(factura, {
        metodo: metodoAbonoModal.value,
        cantidad: abonoActual,
        banco: bancoAbonoModal.value
      });
      if (!movimientoBancoOk) {
        return;
      }
    }

    totalAbonado -= abonoActual;
  }

  if (totalAbonado > 0) {
    toast.add({ severity: 'warn', summary: 'Aviso', detail: `Quedó un sobrante de $${totalAbonado.toFixed(2)}`, life: 3000 });
  }

  await fetchAndSetupData();
  imprimirSaldo();
};
/************************************************************************/
// Pagar todas las facturas del cliente
const fnPagarTodo = () => {
  visibleDatosCliente.value = false;

  Swal.fire({
    title: 'Introduce la contraseña',
    input: 'password',
    inputPlaceholder: 'Contraseña',
    showCancelButton: true,
    confirmButtonText: 'Confirmar',
    cancelButtonText: 'Cancelar'
  }).then(async (result) => {
    if (result.isConfirmed) {
      const contrasenaIngresada = result.value;
      if (contrasenaIngresada === token.value || contrasenaIngresada === tokenCorto.value) {
        const promesas = facturasPendientes.value.map(async (factura) => {
          const saldo = Number(factura.saldo);
          const pagos = JSON.parse(factura.pagos);
          const nopago = (pagos.length + 1);

          pagos.push({
            "nopago": nopago.toString(),
            "cantidad": saldo.toFixed(2),
            "metodo": 'EFECTIVO',
            "fecha": nfecha('fecha'),
            "hora": nfecha('hora'),
            "saldo": '0.00',
            "turno": '',
            "cajero": usuarioLocal.value.usuario || 'SISTEMA'
          });

          factura.cuotas = saldo.toFixed(2);
          factura.fecha_pago = nfecha('fecha');
          factura.estatus = 'SALDADO';
          factura.saldo = '0.00';
          factura.pagos = JSON.stringify(pagos);
          factura.updated_at = nfecha('timestamp');

          const peticion = await peticionesFetchOffline('updateData', 'cuentas_cobrar', JSON.stringify(factura));

          if (peticion[0] === 'ok') {
            toast.add({ severity: 'success', summary: 'Cuenta Actualizada', detail: 'Cuenta actualizada correctamente', life: 3000 });
          } else {
            toast.add({ severity: 'error', summary: 'Error', detail: 'Error al actualizar cuenta', life: 3000 });
          }
        });

        await Promise.all(promesas);
        toast.add({ severity: 'success', summary: 'Proceso Completo', detail: 'Todas las facturas han sido pagadas', life: 3000 });
        await fetchAndSetupData();

        const fechas = nfecha('timestampcompleta');
        const impresionpagina = `/vista/reciboPagoCXC.php?idcliente=${clienteSeleccionadoCodigo.value}&fechainicio=${fechas.fechainicio}&fechafin=${fechas.fechafin}`;

        if (window.electron) {
          window.electron.ipcRenderer.invoke('open-new-window', impresionpagina, 'url', true, false);
        }
      } else {
        toast.add({ severity: 'error', summary: 'Error', detail: 'Contraseña incorrecta', life: 3000 });
      }
    }
  });
};
/************************************************************************/
// Imprimir saldo del cliente
const imprimirSaldo = () => {
  visibleDatosCliente.value = false;
  var hoy = new Date();
  var yyyy = hoy.getFullYear();
  var mm = (hoy.getMonth() + 1).toString().padStart(2, "0");
  var dd = hoy.getDate().toString().padStart(2, "0");
  var fechaHoy = `${yyyy}-${mm}-${dd}`;

  Swal.fire({
    title: 'Ingresar fechas',
    html:
      `<input type="date" id="fechaInicio" class="swal2-input" value="${fechaHoy}" placeholder="Fecha Inicio">` +
      `<input type="date" id="fechaFin" class="swal2-input" value="${fechaHoy}" placeholder="Fecha Fin">`,
    focusConfirm: false,
    showCancelButton: true,
    preConfirm: () => {
      const fechaInicio = document.getElementById('fechaInicio').value;
      const fechaFin = document.getElementById('fechaFin').value;

      if (!fechaInicio || !fechaFin) {
        Swal.showValidationMessage(`Por favor ingrese ambas fechas`);
        return false;
      }

      return { fechaInicio: fechaInicio, fechaFin: fechaFin };
    }
  }).then(async(result) => {
    if (result.isConfirmed) {
      const fechas = result.value;
      const impresionpagina = `/vista/reciboPagoCXC.php?idcliente=${clienteSeleccionadoCodigo.value}&fechainicio=${fechas.fechaInicio} 00:00:00&fechafin=${fechas.fechaFin} 23:59:00`;

/*      if (window.electron) {
        window.electron.ipcRenderer.invoke('open-new-window', impresionpagina, 'url', true, false);
      }*/

    const datosEmpresa1 = JSON.stringify(enviarDatosLocalStorage());
    const datosCliente = clientesArray.value.find(cl => cl.codigo === clienteSeleccionadoCodigo.value);
    await window.electron.ipcRenderer.invoke('ticketCXC', JSON.stringify(facturasPendientes.value), JSON.stringify(datosCliente), datosEmpresa1);



    }
  });
};
/************************************************************************/
// Imprimir todas las facturas del cliente
const fnImpresoraGrande00 = async () => {
  const datosCliente = clientesArray.value.find(cl => cl.codigo === clienteSeleccionadoCodigo.value);
  const datosEmpresaLocal = enviarDatosLocalStorage();

  if (cxcPdfPrintRef.value?.printCuentas) {
    await cxcPdfPrintRef.value.printCuentas({
      facturas: facturasPendientes.value,
      cliente: datosCliente,
      datosEmpresa: datosEmpresaLocal
    });
  } else {
    toast.add({ severity: 'warn', summary: 'Aviso', detail: 'Componente de impresión carta CxC no disponible', life: 3000 });
  }
};

const fnImpresoraChica00 = async () => {
  const datosCliente = clientesArray.value.find(cl => cl.codigo === clienteSeleccionadoCodigo.value);
  const datosEmpresaLocal = enviarDatosLocalStorage();

  if (cxcTicketPrintRef.value?.printCuentasTicket) {
    await cxcTicketPrintRef.value.printCuentasTicket({
      facturas: facturasPendientes.value,
      cliente: datosCliente,
      datosEmpresa: datosEmpresaLocal
    });
  } else {
    toast.add({ severity: 'warn', summary: 'Aviso', detail: 'Componente de impresión ticket CxC no disponible', life: 3000 });
  }
};
/************************************************************************/
// Exportar reportes del cliente
const fnReportePDF = () => {
  const datosFact = data.value.filter(fact => fact.cod_cliente === clienteSeleccionadoCodigo.value);
  const doc = new jsPDF('l', 'mm', 'a4');

  const columns = [
    { header: 'No_emision', dataKey: 'no_emision' },
    { header: 'No_factura', dataKey: 'no_factura' },
    { header: 'Fecha_emision', dataKey: 'fecha_emision' },
    { header: 'Monto_credito', dataKey: 'monto_credito' },
    { header: 'Abonado', dataKey: 'cuotas' },
    { header: 'Saldo', dataKey: 'saldo' },
    { header: 'Estatus', dataKey: 'estatus' }
  ];

  const rows = [];
  datosFact.forEach(factura => {
    const { no_emision, no_factura, fecha_emision, monto_credito, cuotas, saldo, estatus, pagos } = factura;

    const pagosArray = parseSeguro(pagos, []); 
    const pagosString = pagosArray
      .map(pago =>
        `Nopago: ${pago.nopago}, Cantidad: ${pago.cantidad}, Metodo: ${pago.metodo}, Fecha: ${pago.fecha}, Hora: ${pago.hora}, Saldo: ${pago.saldo}`
      )
      .join('\n');

    rows.push({ no_emision, no_factura, fecha_emision, monto_credito, cuotas, saldo, estatus });

    rows.push({
      pagos: pagosString
    });
  });

  // GENERAR TABLA
  doc.autoTable({
    head: [columns.map(col => col.header)],
    body: rows.map(row => {
      if (row.pagos) {
        return [{ content: row.pagos, colSpan: columns.length, styles: { halign: 'left' } }];
      }
      return columns.map(col => row[col.dataKey] || '');
    }),
    startY: 20,
    styles: {
      fontSize: 10,
      cellPadding: 4,
      overflow: 'linebreak',
      cellWidth: 'wrap'
    },
    headStyles: {
      fillColor: [225, 225, 225],
      textColor: [0, 0, 0],
      fontStyle: 'bold'
    },
    didDrawPage: function (data) {
      doc.setFontSize(18);
      doc.text('Reporte de Cuentas por Cobrar', data.settings.margin.left, 15);
    },
    margin: { top: 40 },
    theme: 'grid'
  });

  // =============================
  // 🔥 GENERAR PDF + MOSTRAR EN SWEETALERT
  // =============================
  const pdfBlob = doc.output('blob');
  const pdfUrl = URL.createObjectURL(pdfBlob);

  Swal.fire({
    title: "Reporte de Cuentas por Cobrar",
    html: `
      <iframe src="${pdfUrl}" style="width:100%; height:600px; border:none;"></iframe>
    `,
    width: "900px",
    showCloseButton: true,
    confirmButtonText: "Cerrar",
  });
};


// Función para evitar errores en JSON.parse
function parseSeguro(str, fallback = []) {
  try {
    if (!str) return fallback;
    if (typeof str !== "string") return str;
    return JSON.parse(str);
  } catch (e) {
    console.warn("JSON corrupto en pagos, usando fallback.");
    return fallback;
  }
}


const fnReporteEXCEL = () => {
  const datosFact = data.value.filter(fact => fact.cod_cliente === clienteSeleccionadoCodigo.value);
  const wb = XLSX.utils.book_new();

  const columns = [
    'No_emision',
    'No_factura',
    'Fecha_emision',
    'Monto_credito',
    'Abonado',
    'Saldo',
    'Estatus',
    'Pagos'
  ];

  const rows = [];
  datosFact.forEach(factura => {
    const { no_emision, no_factura, fecha_emision, monto_credito, cuotas, saldo, estatus, pagos } = factura;
    const pagosArray = JSON.parse(pagos);
    const pagosString = pagosArray.map(pago => `Nopago: ${pago.nopago}, Cantidad: ${pago.cantidad}, Metodo: ${pago.metodo}, Fecha: ${pago.fecha}, Hora: ${pago.hora}, Saldo: ${pago.saldo}`).join('\n');

    rows.push([
      no_emision,
      no_factura,
      fecha_emision,
      monto_credito,
      cuotas,
      saldo,
      estatus,
      pagosString
    ]);
  });

  const ws = XLSX.utils.aoa_to_sheet([columns, ...rows]);
  XLSX.utils.book_append_sheet(wb, ws, 'Reporte de Cuentas por Cobrar');

  const clienteNombre = datosFact.length > 0 ? datosFact[0].nombre_cliente : 'Desconocido';
  XLSX.writeFile(wb, `Reporte_Cuentas_cobrar_${clienteNombre}.xlsx`);
};
/************************************************************************/
// Menú contextual
const toggleCuentas = (event, rowData) => {
  currentRowData.value = rowData;
  itemsCuentas.value = [
    {
      label: 'WhatsApp',
      icon: 'pi pi-whatsapp',
      command: async () => {
        enviarWhatsAppRef.value.visible = true;
        await showWhatsAppModal(currentRowData.value);
      }
    },
    {
      label: 'Realizar Abono',
      icon: 'pi pi-money-bill',
      command: () => {
        clienteSeleccionadoModal.value = currentRowData.value.nombre_cliente;
        visibleAbono.value = true;
      }
    },
    {
      label: 'Editar',
      icon: 'pi pi-pencil',
      command: () => {
        router.push({ path: `/editarcuentas_cobrar/${currentRowData.value.id}` });
      }
    },
    {
      label: 'Balance',
      icon: 'pi pi-eye',
      command: () => {
        const selected = { value: currentRowData.value.nombre_cliente };
        handleSelectComplete(selected);
      }
    },
    {
      label: 'Abonos',
      icon: 'pi pi-money-bill',
      command: () => {
        if (!currentRowData.value || !currentRowData.value.pagos) {
          toast.add({ severity: 'warn', summary: 'Aviso', detail: 'No hay abonos disponibles', life: 3000 });
          return;
        }

        visibleAbonosInteligentes.value = true;

        const pagosArray = JSON.parse(currentRowData.value.pagos);
        const datospagos = pagosArray.map(p => ({
          cliente: currentRowData.value.nombre_cliente,
          no_emision: currentRowData.value.no_emision,
          no_factura: currentRowData.value.no_factura,
          fecha: p.fecha,
          hora: p.hora,
          cantidad: p.cantidad,
          pendiente: p.saldo,
          metodo: p.metodo
        }));

        datosAbonosInteligentes.value = datospagos;
      }
    },
    {
      label: 'Ver Productos',
      icon: 'pi pi-list',
      command: async () => {
        await fnVerProductosFactura(currentRowData.value);
      }
    },
{
  label: 'Imprimir',
  icon: 'pi pi-print',
  command: async () => {

    const { value: formato } = await Swal.fire({
      title: 'Seleccionar tipo de impresión',
      icon: 'question',
      showCancelButton: false,
      showDenyButton: true,
      confirmButtonText: 'Carta (Grande)',
      denyButtonText: '80mm (Chica)',
      cancelButtonText: 'Cancelar',
      reverseButtons: true,
      preConfirm: () => 'CARTA',
      preDeny: () => '80MM',
      customClass: {
        popup: 'rounded-xl'
      }
    });

    if (!formato) return;

    imprimirCuenta(formato);
  }
},

    {
      label: 'Imprimir Factura',
      icon: 'pi pi-print',
      command: () => {
        visiblePrintFactura.value = true;
      }
    },
    {
      label: 'Registrar Pago',
      icon: 'pi pi-money-bill',
      command: () => {
        abrirDialogPago(currentRowData.value);
      }
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
      command: () => {
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
              const datosFactura = await peticionesFetchOffline('deleteEntry', 'cuentas_cobrar', currentRowData.value.id);
              if (datosFactura[0] == 'ok') {
                toast.add({ severity: 'success', summary: 'Éxito', detail: 'Datos eliminados correctamente', life: 3000 });
                await fetchAndSetupData();
              } else {
                toast.add({ severity: 'error', summary: 'Error', detail: 'Error al eliminar los datos', life: 3000 });
              }
            } else {
              toast.add({ severity: 'error', summary: 'Error', detail: 'Contraseña incorrecta', life: 3000 });
            }
          }
        });
      }
    }
  ];
  menu.value.toggle(event);
};
/************************************************************************/
// Filtrado de datos
const filteredCuentas = computed(() => {
  let filteredData = data.value;

  if (searchQuery.value) {
    filteredData = filteredData.filter(busqueda => {
      return Object.values(busqueda).some(value =>
        String(value).toLowerCase().includes(searchQuery.value.toLowerCase())
      );
    });
  }

  if (estadoFilter.value !== 'TODOS') {
    filteredData = filteredData.filter(item => item.estatus === estadoFilter.value);
  }

  if (institucionFilter.value !== 'TODAS') {
    if (institucionFilter.value === 'NINGUNA') {
      // Mostrar cuentas sin institución o con institución vacía
      filteredData = filteredData.filter(item => {
        const inst = (item.institucion || '').trim();
        return inst === '' || inst === 'Ninguna' || inst === 'NINGUNA';
      });
    } else {
      // Mostrar cuentas de la institución seleccionada
      filteredData = filteredData.filter(item => {
        const inst = (item.institucion || '').trim();
        const filterValue = institucionFilter.value.trim();
        // Debug activo temporalmente
        console.log('Filtro Institución - Item:', item.nombre_cliente, '| institucion:', `"${inst}"`, '| Buscando:', `"${filterValue}"`, '| Match:', inst === filterValue);
        return inst === filterValue;
      });
    }
  }

  if (filtrarPorFecha.value) {
    const fechaFormateada = formatearFecha(filtrarPorFecha.value);
    filteredData = filteredData.filter(item => item.fecha_emision === fechaFormateada);
  }

  if (buscadorFechaInteligente.value) {
    let fechas;
    let fechaInicio;
    let fechaFin;

    if (typeof buscadorFechaInteligente.value === 'string') {
      fechas = buscadorFechaInteligente.value.split(' - ');
      fechaInicio = fechas[0];
      fechaFin = fechas[1];
    } else {
      fechas = buscadorFechaInteligente.value;
      fechaInicio = formatearFecha(fechas[0]);
      fechaFin = formatearFecha(fechas[1]);
    }

    if (fechaInicio && fechaFin) {
      const fechaAmericanaInicio = transformarFechaTimestamp(fechaInicio, false);
      const fechaAmericanaFin = transformarFechaTimestamp(fechaFin, false);
      const fechaInicioTimeStamp = new Date(fechaAmericanaInicio + ' 00:00:01');
      const fechaFinTimeStamp = new Date(fechaAmericanaFin + ' 23:59:59');

      filteredData = filteredData.filter(item => {
        const fechaUpdated = new Date(item.updated_at);
        if (fechaUpdated) {
          return fechaUpdated >= fechaInicioTimeStamp && fechaUpdated <= fechaFinTimeStamp;
        }
      });

      if (filteredData.length > 0) {
        fechaInteligente.value = true;

        const datospagos = filteredData.flatMap(pagos => {
          const losPagos = JSON.parse(pagos.pagos);
          return losPagos.map(p => ({
            cliente: pagos.nombre_cliente,
            no_emision: pagos.no_emision,
            no_factura: pagos.no_factura,
            fecha: p.fecha,
            hora: p.hora,
            cantidad: p.cantidad,
            pendiente: p.saldo,
            metodo: p.metodo
          }));
        });

        datosAbonosInteligentes.value = datospagos;
      }
    }
  }

  return filteredData;
});
/************************************************************************/
// Menú inteligente de fechas
const itemsInteligente = ref([
  { label: 'Hoy', command: handleInteligenteSelect, value: nfecha('rangohoy') },
  { label: 'Ayer', command: handleInteligenteSelect, value: nfecha('rangoayer') },
  { label: 'Esta Semana', command: handleInteligenteSelect, value: nfecha('rangosemana') },
  { label: 'Hace 7 dias', command: handleInteligenteSelect, value: nfecha('rango7dias') },
  { label: 'Este mes', command: handleInteligenteSelect, value: nfecha('rangomes') },
]);

function handleInteligenteSelect(event) {
  const selectedItem = event.item;
  buscadorFechaInteligente.value = selectedItem.value.fechainicio + ' - ' + selectedItem.value.fechafin;
}

const toggleInteligente = (event) => {
  menuInteligente.value.toggle(event);
};

const fnAbonosFechaInteligente = () => {
  visibleAbonosInteligentes.value = true;
};
/************************************************************************/
const fnVerProductosFactura = async (cuenta) => {
  if (!cuenta?.no_factura) {
    toast.add({ severity: 'warn', summary: 'Aviso', detail: 'No hay número de factura disponible', life: 3000 });
    return;
  }

  try {
    const facturaData = await peticionesFetchOffline('getDataByField', 'facturas', 'no_factura', cuenta.no_factura);

    if (!facturaData) {
      toast.add({ severity: 'warn', summary: 'Aviso', detail: 'No se encontró la factura', life: 3000 });
      return;
    }

    let productos = [];
    try {
      if (Array.isArray(facturaData.productos)) {
        productos = facturaData.productos;
      } else if (typeof facturaData.productos === 'string') {
        productos = JSON.parse(facturaData.productos || '[]');
      }
    } catch (error) {
      console.error('Error parseando productos de la factura:', error);
      productos = [];
    }

    if (!Array.isArray(productos)) productos = [];

    productosFactura.value = productos;
    facturaProductosInfo.value = {
      no_factura: cuenta.no_factura || '',
      nombre_cliente: cuenta.nombre_cliente || ''
    };
    visibleProductosFactura.value = true;
  } catch (error) {
    console.error('Error al obtener productos de la factura:', error);
    toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar los productos', life: 3000 });
  }
};
/************************************************************************/
// Exportar abonos
const fnCrearExcelAbonos = () => {
  if (!datosAbonosInteligentes.value || datosAbonosInteligentes.value.length === 0) {
    toast.add({ severity: 'warn', summary: 'Aviso', detail: 'No hay abonos para exportar', life: 3000 });
    return;
  }

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(datosAbonosInteligentes.value.map(abono => ({
    'Cliente': abono.cliente,
    'No Emisión': abono.no_emision,
    'No Factura': abono.no_factura,
    'Fecha': abono.fecha,
    'Hora': abono.hora,
    'Cantidad': abono.cantidad,
    'Pendiente': abono.pendiente,
    'Método': abono.metodo
  })));

  XLSX.utils.book_append_sheet(wb, ws, 'Abonos Inteligentes');
  XLSX.writeFile(wb, `Abonos_Inteligentes_${new Date().toISOString().slice(0, 10)}.xlsx`);
};

const fnCrearPdfAbonos = () => {
  if (!datosAbonosInteligentes.value || datosAbonosInteligentes.value.length === 0) {
    toast.add({ severity: 'warn', summary: 'Aviso', detail: 'No hay abonos para generar el PDF', life: 3000 });
    return;
  }

  const doc = new jsPDF('l', 'mm', 'a4');
  doc.setFontSize(16);
  doc.text('Reporte de Abonos Inteligentes', 10, 15);

  const columns = ['Cliente', 'No Emisión', 'No Factura', 'Fecha', 'Hora', 'Cantidad', 'Pendiente', 'Método'];
  const rows = datosAbonosInteligentes.value.map(abono => [
    abono.cliente,
    abono.no_emision,
    abono.no_factura,
    abono.fecha,
    abono.hora,
    abono.cantidad,
    abono.pendiente,
    abono.metodo
  ]);

  doc.autoTable({
    head: [columns],
    body: rows,
    startY: 25,
    styles: { fontSize: 10, cellPadding: 3, overflow: 'linebreak' },
    headStyles: { fillColor: [200, 200, 200], textColor: [0, 0, 0] },
    columnStyles: { 0: { cellWidth: 30 }, 1: { cellWidth: 30 }, 2: { cellWidth: 30 }, 3: { cellWidth: 30 }, 4: { cellWidth: 20 }, 5: { cellWidth: 25 }, 6: { cellWidth: 30 } }
  });

  doc.save(`Abonos_Inteligentes_${new Date().toISOString().slice(0, 10)}.pdf`);
};
/************************************************************************/
// Exportar Excel general
const fnExportarExcel = () => {
  const filteredData = filteredCuentas.value;
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(filteredData);
  XLSX.utils.book_append_sheet(wb, ws, 'Cuentas_cobrar');
  XLSX.writeFile(wb, 'Cuentas_cobrar.xlsx');
};
/************************************************************************/
const fnCrearCxC = async () => {
  if (!nuevaCxC.value.nombre_cliente) {
    toast.add({ severity: 'warn', summary: 'Validación', detail: 'El nombre del cliente es obligatorio', life: 3000 });
    return
  }
  if (!nuevaCxC.value.monto_credito || nuevaCxC.value.monto_credito <= 0) {
    toast.add({ severity: 'warn', summary: 'Validación', detail: 'El monto del crédito debe ser mayor a 0', life: 3000 });
    return
  }

  try {
    const data = {}
    const columnas = await peticionesFetchOffline('getTableColumns', 'cuentas_cobrar')
    columnas.forEach(col => { data[col] = '' })

    const noEmision = await peticionesFetchOffline('getMaxValue', 'cuentas_cobrar', 'no_emision')
    const ultimoValor = noEmision?.[0]
    const num = parseInt(ultimoValor, 10)
    data.no_emision = !isNaN(num) ? String(num + 1).padStart(7, '0') : '0000001'
    data.no_factura = 'MANUAL-' + data.no_emision
    data.nombre_cliente = nuevaCxC.value.nombre_cliente.toUpperCase()
    data.telefono_cliente = nuevaCxC.value.telefono_cliente || ''
    data.cedula_cliente = nuevaCxC.value.cedula_cliente || ''
    data.monto_credito = nuevaCxC.value.monto_credito
    data.saldo = nuevaCxC.value.saldo || nuevaCxC.value.monto_credito
    data.interes = nuevaCxC.value.interes || 0
    data.cuotas = nuevaCxC.value.cuotas || 0
    data.tipocredito = 'NORMAL'
    data.fecha_emision = nuevaCxC.value.fecha_emision ? formatearFecha(nuevaCxC.value.fecha_emision) : nfecha('fecha')
    data.fecha_vencimiento = nuevaCxC.value.fecha_vencimiento ? formatearFecha(nuevaCxC.value.fecha_vencimiento) : ''
    data.nota = nuevaCxC.value.nota || ''
    data.estatus = 'PENDIENTE'
    data.vendedor = usuarioLocal.value.nombre || ''
    data.hora = nfecha('hora')
    data.almacen = datosEmpresa.empresa.nombre || ''
    data.usuario = usuarioLocal.value.usuario || ''
    data.identificadordb = generarCodigoUnico()
    data.created_at = nfecha('timestamp')
    data.updated_at = nfecha('timestamp')

    data.cod_cliente = nuevaCxC.value.cod_cliente || ''
    data.direccion_cliente = nuevaCxC.value.direccion_cliente || ''

    const abonoInicial = Number(nuevaCxC.value.monto_abono) || 0
    if (abonoInicial > 0) {
      const pagosArray = [{
        nopago: 1,
        cantidad: abonoInicial.toFixed(2),
        metodo: nuevaCxC.value.metodo_abono || 'EFECTIVO',
        fecha: nfecha('fecha'),
        hora: nfecha('hora'),
        timestamp: nfecha('timestamp'),
        turno: '',
        cajero: usuarioLocal.value.usuario || 'SISTEMA',
        banco: '',
        saldo: (Number(data.monto_credito) - abonoInicial).toFixed(2)
      }]
      data.pagos = JSON.stringify(pagosArray)
      data.abonado = abonoInicial.toFixed(2)
      data.saldo = (Number(data.monto_credito) - abonoInicial).toFixed(2)
    } else {
      data.pagos = '[]'
      data.abonado = '0'
      data.saldo = Number(data.monto_credito).toFixed(2)
    }

    const envio = await peticionesFetchOffline('insertData', 'cuentas_cobrar', JSON.stringify(data))
    if (envio && envio[0] === 'ok') {
      toast.add({ severity: 'success', summary: 'Éxito', detail: 'Cuenta creada correctamente', life: 3000 })
      visibleCrearCxC.value = false
      nuevaCxC.value = { nombre_cliente: '', telefono_cliente: '', cedula_cliente: '', direccion_cliente: '', cod_cliente: '', monto_credito: 0, saldo: 0, fecha_emision: null, fecha_vencimiento: null, interes: 0, cuotas: 0, nota: '', monto_abono: 0, metodo_abono: 'EFECTIVO' }
      await fetchAndSetupData()
    } else {
      toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo crear la cuenta', life: 3000 })
    }
  } catch (error) {
    console.error('Error al crear CxC:', error)
    toast.add({ severity: 'error', summary: 'Error', detail: 'Error al crear la cuenta', life: 3000 })
  }
}
/************************************************************************/
const handleSelectClienteCrearCxC = (selected) => {
  const cliente = clientesArray.value.find(c => c.nombre === selected.value)
  if (cliente) {
    nuevaCxC.value.telefono_cliente = cliente.telefono || ''
    nuevaCxC.value.cedula_cliente = cliente.cedula || ''
    nuevaCxC.value.direccion_cliente = cliente.direccion || ''
    nuevaCxC.value.cod_cliente = cliente.codigo || ''
  }
}
/************************************************************************/
// Exportar PDF general con campos específicos - Diseño Profesional
const fnExportarPDFGeneral = async () => {
  const filteredData = filteredCuentas.value;

  if (!filteredData || filteredData.length === 0) {
    toast.add({ severity: 'warn', summary: 'Aviso', detail: 'No hay datos para generar el PDF', life: 3000 });
    return;
  }

  // Obtener todas las facturas para buscar productos
  const todasFacturas = await peticionesFetchOffline('getDataAsArray', 'facturas');

  // Crear mapa de facturas por no_factura para acceso rápido
  const facturasMap = {};
  todasFacturas.forEach(factura => {
    if (factura.no_factura) {
      facturasMap[factura.no_factura] = factura;
    }
  });

  const doc = new jsPDF('l', 'mm', 'a4'); // 297mm x 210mm
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Variables de diseño
  const margin = 15;
  const headerHeight = 40;
  const empresa = datosEmpresa.empresa || {};

  // ===================== ENCABEZADO PROFESIONAL =====================
  // Rectángulo superior con color corporativo
  doc.setFillColor(31, 41, 55); // Color gris oscuro profesional
  doc.rect(0, 0, pageWidth, headerHeight, 'F');

  // Logo o nombre de empresa (lado izquierdo)
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text(empresa.nombre || 'EMPRESA', margin, 15);

  // Información de empresa (lado izquierdo)
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  let yPos = 22;
  if (empresa.legal) {
    doc.text(empresa.legal, margin, yPos);
    yPos += 4;
  }
  if (empresa.direccion) {
    doc.text(empresa.direccion, margin, yPos);
    yPos += 4;
  }
  if (empresa.telefono) {
    doc.text(`Tel: ${empresa.telefono}`, margin, yPos);
    yPos += 4;
  }
  if (empresa.email) {
    doc.text(`Email: ${empresa.email}`, margin, yPos);
  }

  // Título del reporte (lado derecho)
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text('REPORTE DE CUENTAS POR COBRAR', pageWidth - margin, 15, { align: 'right' });

  // Fecha y hora de generación (lado derecho)
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  const fechaActual = new Date().toLocaleDateString('es-DO', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  const horaActual = new Date().toLocaleTimeString('es-DO', {
    hour: '2-digit',
    minute: '2-digit'
  });
  doc.text(`Fecha: ${fechaActual}`, pageWidth - margin, 25, { align: 'right' });
  doc.text(`Hora: ${horaActual}`, pageWidth - margin, 30, { align: 'right' });

  // Línea decorativa debajo del encabezado
  doc.setDrawColor(59, 130, 246); // Azul
  doc.setLineWidth(1);
  doc.line(margin, headerHeight + 2, pageWidth - margin, headerHeight + 2);

  // ===================== FILTROS APLICADOS =====================
  doc.setTextColor(60, 60, 60);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'italic');
  let filtrosTexto = 'Filtros aplicados: ';
  const filtrosArray = [];

  if (estadoFilter.value !== 'TODOS') {
    filtrosArray.push(`Estado: ${estadoFilter.value}`);
  }
  if (institucionFilter.value !== 'TODAS') {
    filtrosArray.push(`Institución: ${institucionFilter.value}`);
  }
  if (searchQuery.value) {
    filtrosArray.push(`Búsqueda: "${searchQuery.value}"`);
  }

  if (filtrosArray.length > 0) {
    filtrosTexto += filtrosArray.join(' | ');
  } else {
    filtrosTexto += 'Ninguno (Mostrando todos los registros)';
  }

  doc.text(filtrosTexto, margin, headerHeight + 8);

  // ===================== TABLA DE DATOS =====================
  const columns = ['SEC.', 'NCF', 'NOMBRE DEL CLIENTE', 'CÉDULA', 'ARTÍCULO', 'TOTAL', 'FECHA DE ENTREGA'];

  const rows = filteredData.map((item, index) => {
    // Buscar la factura original para obtener los productos
    let articulos = '';
    try {
      const facturaOriginal = facturasMap[item.no_factura];

      if (facturaOriginal && facturaOriginal.productos) {
        let productos = [];

        // Parsear productos de la factura original
        if (Array.isArray(facturaOriginal.productos)) {
          productos = facturaOriginal.productos;
        } else if (typeof facturaOriginal.productos === 'string' && facturaOriginal.productos) {
          productos = JSON.parse(facturaOriginal.productos);
        }

        // Extraer nombres de productos y agruparlos
        if (Array.isArray(productos) && productos.length > 0) {
          const nombres = productos
            .map(p => p.nombre || p.producto || '')
            .filter(n => n && n.trim() !== '')
            .join(', ');
          articulos = nombres;
        }
      }

      // Si no se encontró factura o productos, intentar desde cuentas_cobrar
      if (!articulos && item.productos) {
        let productos = [];
        if (Array.isArray(item.productos)) {
          productos = item.productos;
        } else if (typeof item.productos === 'string' && item.productos) {
          productos = JSON.parse(item.productos);
        }

        if (Array.isArray(productos) && productos.length > 0) {
          articulos = productos
            .map(p => p.nombre || p.producto || '')
            .filter(n => n && n.trim() !== '')
            .join(', ');
        }
      }
    } catch (error) {
      console.error('Error parseando productos para factura', item.no_factura, ':', error);
      articulos = '';
    }

    // Formatear fecha de entrega (created_at)
    let fechaEntrega = '';
    if (item.created_at) {
      try {
        fechaEntrega = formatearFecha(item.created_at);
      } catch (error) {
        fechaEntrega = item.created_at;
      }
    }

    return [
      index + 1, // SEC.
      item.comprobante || '', // NCF
      item.nombre_cliente || '', // NOMBRE DEL CLIENTE
      item.cedula_cliente || '', // CÉDULA
      articulos, // ARTÍCULO
      `$${parseFloat(item.monto_credito || 0).toFixed(2)}`, // TOTAL
      fechaEntrega // FECHA DE ENTREGA
    ];
  });

  doc.autoTable({
    head: [columns],
    body: rows,
    startY: headerHeight + 12,
    margin: { left: margin, right: margin },
    styles: {
      fontSize: 8,
      cellPadding: 3,
      overflow: 'linebreak',
      halign: 'left',
      valign: 'middle',
      lineColor: [200, 200, 200],
      lineWidth: 0.1
    },
    headStyles: {
      fillColor: [31, 41, 55], // Mismo color del encabezado
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      halign: 'center',
      fontSize: 9,
      cellPadding: 4
    },
    columnStyles: {
      0: { cellWidth: 18, halign: 'center', fontStyle: 'bold' }, // SEC.
      1: { cellWidth: 35 }, // NCF
      2: { cellWidth: 55 }, // NOMBRE
      3: { cellWidth: 30 }, // CÉDULA
      4: { cellWidth: 70 }, // ARTÍCULO
      5: { cellWidth: 28, halign: 'right', fontStyle: 'bold' }, // TOTAL
      6: { cellWidth: 32, halign: 'center' } // FECHA
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252]
    },
    didDrawPage: (data) => {
      // Pie de página en cada página
      const pageNumber = doc.internal.getNumberOfPages();
      doc.setFontSize(8);
      doc.setTextColor(128, 128, 128);
      doc.setFont('helvetica', 'italic');

      // Número de página
      doc.text(
        `Página ${data.pageNumber} de ${pageNumber}`,
        pageWidth / 2,
        pageHeight - 8,
        { align: 'center' }
      );

      // Generado por sistema
      doc.text(
        `Generado por Sistema AA - ${empresa.nombre || ''}`,
        margin,
        pageHeight - 8
      );
    }
  });

  // ===================== RESUMEN DE TOTALES =====================
  const totalGeneral = filteredData.reduce((sum, item) => sum + parseFloat(item.monto_credito || 0), 0);
  const totalPendiente = filteredData.filter(item => item.estatus === 'PENDIENTE')
    .reduce((sum, item) => sum + parseFloat(item.saldo || 0), 0);
  const totalPagado = filteredData.filter(item => item.estatus === 'PAGADO').length;
  const totalRegistros = filteredData.length;

  const finalY = doc.lastAutoTable.finalY || headerHeight + 12;

  // Cuadro de resumen con diseño profesional
  const boxY = finalY + 8;
  const boxHeight = 28;
  const boxWidth = 85;
  const boxX = pageWidth - margin - boxWidth;

  // Fondo del cuadro
  doc.setFillColor(31, 41, 55);
  doc.roundedRect(boxX, boxY, boxWidth, boxHeight, 3, 3, 'F');

  // Contenido del cuadro
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('RESUMEN GENERAL', boxX + boxWidth / 2, boxY + 5, { align: 'center' });

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  let summaryY = boxY + 11;

  doc.text(`Total de registros:`, boxX + 4, summaryY);
  doc.text(`${totalRegistros}`, boxX + boxWidth - 4, summaryY, { align: 'right' });

  summaryY += 5;
  doc.text(`Facturas pagadas:`, boxX + 4, summaryY);
  doc.text(`${totalPagado}`, boxX + boxWidth - 4, summaryY, { align: 'right' });

  summaryY += 5;
  doc.text(`Total pendiente:`, boxX + 4, summaryY);
  doc.text(`$${totalPendiente.toFixed(2)}`, boxX + boxWidth - 4, summaryY, { align: 'right' });

  // Línea separadora
  doc.setDrawColor(255, 255, 255);
  doc.setLineWidth(0.5);
  summaryY += 2;
  doc.line(boxX + 4, summaryY, boxX + boxWidth - 4, summaryY);

  // Total general destacado
  summaryY += 5;
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text(`TOTAL GENERAL:`, boxX + 4, summaryY);
  doc.text(`$${totalGeneral.toFixed(2)}`, boxX + boxWidth - 4, summaryY, { align: 'right' });

  // ===================== MOSTRAR PDF EMBEDIDO =====================
  const pdfDataUri = doc.output('dataurlstring');
  Swal.fire({
    title: 'Reporte de Cuentas por Cobrar',
    html: `<iframe src="${pdfDataUri}" width="100%" height="600px" style="border: 2px solid #e5e7eb; border-radius: 8px;"></iframe>`,
    width: '95%',
    showCancelButton: true,
    confirmButtonText: '<i class="pi pi-download"></i> Descargar PDF',
    cancelButtonText: '<i class="pi pi-times"></i> Cerrar',
    confirmButtonColor: '#10b981',
    cancelButtonColor: '#6b7280'
  }).then((result) => {
    if (result.isConfirmed) {
      doc.save(`Reporte_Cuentas_Cobrar_${new Date().toISOString().slice(0, 10)}.pdf`);
      toast.add({ severity: 'success', summary: 'Éxito', detail: 'PDF descargado correctamente', life: 3000 });
    }
  });
};
/************************************************************************/
// Estadísticas
const totalPendiente = computed(() => {
  return data.value
    .filter(c => c.estatus === 'PENDIENTE')
    .reduce((sum, c) => sum + parseFloat(c.saldo || 0), 0)
    .toFixed(2);
});

const totalCobrado = computed(() => {
  return data.value
    .reduce((sum, c) => sum + parseFloat(c.abonado || 0), 0)
    .toFixed(2);
});

const cuentasPendientes = computed(() => {
  return data.value.filter(c => c.estatus === 'PENDIENTE').length;
});

const cuentasSaldadas = computed(() => {
  return data.value.filter(c => c.estatus === 'SALDADO').length;
});
/************************************************************************/
const onRowSelect = (selected) => {
  router.push({ path: `/editarcuentas_cobrar/${selected.data.id}` });
};
/************************************************************************/
const getRowClass = (data) => {
  if (data.fecha_pago === nfecha('fecha')) {
    return 'row-yellow';
  } else if (data.estatus === 'PENDIENTE') {
    return 'row-red';
  } else if (data.estatus === 'SALDADO') {
    return 'row-green';
  }
  return '';
};
/************************************************************************/
const colorEstado = (data) => {
  if (data.tipocredito === 'NORMAL') {
    return 'success';
  } else if (data.tipocredito === 'CUOTAS') {
    return 'warn';
  } else {
    return 'secondary';
  }
};
/************************************************************************/
onMounted(async () => {
  const datosJSON = await envioElectron('datosarchivo');
  link.value = datosJSON.VITE_LINKURL;
  api.value = datosJSON.VITE_LINK_API;
  token.value = datosJSON.VITE_TOKEN;
  tokenCorto.value = datosJSON.VITE_TOKEN_CORTO;
  tokenCifrado.value = await encryptarPassword(datosJSON.VITE_TOKEN, 10);

  await crearTablaSiNoExisteOffline('cuentas_cobrar', camposArray, toast);
  await crearTablaSiNoExisteOffline('cuentas', ['nombre', 'categoria', 'saldo'], toast);
  usuarioLocal.value = JSON.parse(window.localStorage.getItem('usuarioLocal'))[0] || {};

  await fetchBanco();
  await fetchAndSetupData();
  await fetchClientes();
  await fetchCatalogoCuentas();
  await fetchInstituciones();
});
/************************************************************************/
watch(() => formPago.value.formaPago, (formaPago) => {
  if (requiereBanco(formaPago) && !formPago.value.banco) {
    formPago.value.banco = cuentaBancaria.value;
  }
});
/************************************************************************/
watch(metodoAbonoModal, (metodo) => {
  if (requiereBanco(metodo) && !bancoAbonoModal.value) {
    bancoAbonoModal.value = cuentaBancaria.value;
  }
});
/************************************************************************/
const imprimirCuenta = async (tipo) => {
  if (!currentRowData.value) return;

  try {
    const datosCliente = await peticionesFetchOffline('getDataByField', 'clientes', 'codigo', currentRowData.value.cod_cliente);
    const datosEmpresaLocal = enviarDatosLocalStorage();
    const facturas = [currentRowData.value];

    if (tipo === 'CARTA') {
      if (cxcPdfPrintRef.value?.printCuentas) {
        await cxcPdfPrintRef.value.printCuentas({
          facturas,
          cliente: datosCliente,
          datosEmpresa: datosEmpresaLocal
        });
      } else {
        toast.add({ severity: 'warn', summary: 'Aviso', detail: 'Componente carta CxC no disponible', life: 3000 });
      }
      return;
    }

    if (cxcTicketPrintRef.value?.printCuentasTicket) {
      await cxcTicketPrintRef.value.printCuentasTicket({
        facturas,
        cliente: datosCliente,
        datosEmpresa: datosEmpresaLocal
      });
    } else {
      toast.add({ severity: 'warn', summary: 'Aviso', detail: 'Componente ticket CxC no disponible', life: 3000 });
    }
  } catch (error) {
    console.error('Error al imprimir cuenta:', error);
    toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo generar la impresion', life: 3000 });
  }
};
/************************************************************************/
const fnImprimirFacturaCarta = async () => {
  if (!currentRowData.value) return;

  try {
    const datosFactura = await peticionesFetchOffline('getDataByField', 'facturas', 'no_factura', currentRowData.value.no_factura);
    const datosCliente = await peticionesFetchOffline('getDataByField', 'clientes', 'codigo', datosFactura.cod_cliente);
    const datosEmpresaLocal = enviarDatosLocalStorage();

    if (facturaPdfPrintRef.value?.printFactura) {
      await facturaPdfPrintRef.value.printFactura({
        factura: datosFactura,
        cliente: datosCliente,
        datosEmpresa: datosEmpresaLocal,
        creditoData: currentRowData.value
      });
    } else {
      toast.add({ severity: 'warn', summary: 'Aviso', detail: 'Componente de carta no disponible', life: 3000 });
    }
  } catch (error) {
    console.error('Error imprimiendo factura en formato carta:', error);
    toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo imprimir en formato carta', life: 3000 });
  } finally {
    visiblePrintFactura.value = false;
  }
};
/************************************************************************/
const fnImprimirFacturaTicket = async () => {
  if (!currentRowData.value) return;

  try {
    const datosFactura = await peticionesFetchOffline('getDataByField', 'facturas', 'no_factura', currentRowData.value.no_factura);
    const datosCliente = await peticionesFetchOffline('getDataByField', 'clientes', 'codigo', datosFactura.cod_cliente);
    const datosEmpresaLocal = enviarDatosLocalStorage();

    if (ticketPdfPrintRef.value?.printTicket) {
      await ticketPdfPrintRef.value.printTicket({
        factura: datosFactura,
        cliente: datosCliente,
        datosEmpresa: datosEmpresaLocal
      });
    } else {
      toast.add({ severity: 'warn', summary: 'Aviso', detail: 'Componente de ticket no disponible', life: 3000 });
    }
  } catch (error) {
    console.error('Error imprimiendo factura en formato ticket:', error);
    toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo imprimir en formato ticket', life: 3000 });
  } finally {
    visiblePrintFactura.value = false;
  }
};
/************************************************************************/
</script>

<template>
  <main class="cuentas-wrapper">
    <FacturaPDFprint ref="facturaPdfPrintRef" />
    <Ticketpdfprint ref="ticketPdfPrintRef" />
    <CuentasCobrarPDFprint ref="cxcPdfPrintRef" />
    <CuentasCobrarTicketprint ref="cxcTicketPrintRef" />

    <div class="container-cuentas mx-auto px-4 py-6">

      <!-- Stats Cards -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <div class="stat-card stat-pendiente">
          <div class="stat-icon">
            <i class="pi pi-exclamation-circle"></i>
          </div>
          <div class="stat-content">
            <div class="stat-label">Total Pendiente</div>
            <div class="stat-value">${{ totalPendiente }}</div>
            <div class="stat-sublabel">Por cobrar</div>
          </div>
        </div>

        <div class="stat-card stat-cobrado">
          <div class="stat-icon">
            <i class="pi pi-check-circle"></i>
          </div>
          <div class="stat-content">
            <div class="stat-label">Total Cobrado</div>
            <div class="stat-value">${{ totalCobrado }}</div>
            <div class="stat-sublabel">Abonos recibidos</div>
          </div>
        </div>

        <div class="stat-card stat-cuentas">
          <div class="stat-icon">
            <i class="pi pi-file"></i>
          </div>
          <div class="stat-content">
            <div class="stat-label">Cuentas Pendientes</div>
            <div class="stat-value">{{ cuentasPendientes }}</div>
            <div class="stat-sublabel">Por saldar</div>
          </div>
        </div>

        <div class="stat-card stat-saldadas">
          <div class="stat-icon">
            <i class="pi pi-verified"></i>
          </div>
          <div class="stat-content">
            <div class="stat-label">Cuentas Saldadas</div>
            <div class="stat-value">{{ cuentasSaldadas }}</div>
            <div class="stat-sublabel">Completadas</div>
          </div>
        </div>
      </div>

      <!-- Filters Section -->
      <Card class="filters-card mb-6">
        <template #content>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">

            <div class="filter-field">
              <label class="filter-label">
                <i class="pi pi-filter mr-2"></i>Filtrar por Estado
              </label>
              <Dropdown
                v-model="estadoFilter"
                :options="['TODOS', 'PENDIENTE', 'SALDADO']"
                placeholder="Seleccione estatus"
                class="w-full modern-dropdown"
              />
            </div>

            <div class="filter-field">
              <label class="filter-label">
                <i class="pi pi-building mr-2"></i>Filtrar por Institución
              </label>
              <Dropdown
                v-model="institucionFilter"
                :options="institucionesArray"
                placeholder="Seleccione institución"
                class="w-full modern-dropdown"
              />
            </div>

            <div class="filter-field">
              <label class="filter-label">
                <i class="pi pi-calendar mr-2"></i>Filtrar por Fecha
              </label>
              <Calendar
                v-model="filtrarPorFecha"
                dateFormat="dd/mm/yy"
                showIcon
                class="w-full modern-calendar"
              />
            </div>

            <div class="filter-field">
              <label class="filter-label">
                <i class="pi pi-user mr-2"></i>Buscar Cliente
              </label>
              <awesomplete
                class="awesomplete-modern"
                v-model="clienteSeleccionado"
                @selectComplete="handleSelectComplete"
                :list="clientesArrayNombre">
              </awesomplete>
            </div>

            <div class="filter-field col-span-2">
              <label class="filter-label">
                <i class="pi pi-calendar-plus mr-2"></i>Buscador Inteligente
              </label>
              <InputGroup>
                <DatePicker
                  dateFormat="dd/mm/yy"
                  selectionMode="range"
                  :showButtonBar="true"
                  v-model="buscadorFechaInteligente"
                  class="modern-datepicker"
                />
                <InputGroupAddon>
                  <Button
                    icon="pi pi-search"
                    severity="secondary"
                    @click="toggleInteligente"
                  />
                </InputGroupAddon>
              </InputGroup>
              <Menu ref="menuInteligente" :model="itemsInteligente" popup class="!min-w-fit" />
            </div>

          </div>

          <div class="flex justify-between items-center mt-4 pt-4 border-t">
            <div class="flex gap-2">
              <Button
                icon="pi pi-refresh"
                label="Recargar"
                @click="fetchAndSetupData"
                severity="warning"
                outlined
              />
              <Button
                icon="pi pi-plus"
                label="Nueva Venta"
                @click="router.push('/vender')"
                severity="success"
              />
              <Button
                icon="pi pi-plus-circle"
                label="Crear Cuenta Manual"
                @click="visibleCrearCxC = true"
                severity="info"
              />
              <Button
                v-if="fechaInteligente"
                icon="pi pi-money-bill"
                label="Ver Abonos"
                @click="fnAbonosFechaInteligente"
                severity="info"
              />
            </div>

            <div class="flex gap-2">
              <Button
                icon="pi pi-file-pdf"
                label="Exportar PDF"
                @click="fnExportarPDFGeneral"
                severity="danger"
                outlined
              />
              <Button
                icon="pi pi-file-excel"
                label="Exportar Excel"
                @click="fnExportarExcel"
                severity="success"
                outlined
              />
              <Button
                v-if="usuarioLocal.usuario == 'Soporte'"
                icon="pi pi-trash"
                label="Borrar Selección"
                severity="danger"
                outlined
              />
            </div>
          </div>
        </template>
      </Card>

      <!-- Data Table -->
      <Card class="table-card">
        <template #content>
          <div class="flex justify-end mb-4">
            <IconField iconPosition="left">
              <InputIcon class="pi pi-search" />
              <InputText
                v-model="searchQuery"
                placeholder="Buscar cuentas..."
                class="search-input"
              />
            </IconField>
          </div>

          <DataTable
            :value="filteredCuentas"
            scrollable
            scrollHeight="600px"
            dataKey="id"
            paginator
            :rows="10"
            @rowSelect="onRowSelect"
            selectionMode="single"
            size="small"
            resizableColumns
            columnResizeMode="fit"
            :rowClass="getRowClass"
            :rowsPerPageOptions="[5, 10, 20, 50]"
            class="modern-datatable"
          >
            <Column header="Opciones" frozen :style="{ width: '100px' }">
              <template #body="slotProps">
                <Button
                  icon="pi pi-cog"
                  @click="toggleCuentas($event, slotProps.data)"
                  severity="secondary"
                  size="small"
                  rounded
                />
                <Menu
                  ref="menu"
                  :model="itemsCuentas"
                  :popup="true"
                />
              </template>
            </Column>

            <Column field="id" header="ID" :style="{ minWidth: '80px' }"></Column>
            <Column field="tipocredito" header="Tipo Crédito" :style="{ minWidth: '120px' }">
              <template #body="slotProps">
                <Tag :value="slotProps.data.tipocredito" :severity="colorEstado(slotProps.data)" />
              </template>
            </Column>
            <Column field="no_emision" header="No. Emisión" :style="{ minWidth: '120px' }"></Column>
            <Column field="no_factura" header="No. Factura" :style="{ minWidth: '120px' }"></Column>
            <Column field="comprobante" header="Comprobante" :style="{ minWidth: '120px' }"></Column>
            <Column field="nombre_cliente" header="Cliente" :style="{ minWidth: '200px' }"></Column>
            <Column field="cedula_cliente" header="Cédula" :style="{ minWidth: '130px' }"></Column>
            <Column field="telefono_cliente" header="Teléfono" :style="{ minWidth: '130px' }"></Column>
            <Column field="saldo" header="Saldo" :style="{ minWidth: '120px' }">
              <template #body="slotProps">
                <div class="font-bold text-red-600 text-lg">
                  ${{ parseFloat(slotProps.data.saldo).toFixed(2) }}
                </div>
              </template>
            </Column>
            <Column field="fecha_emision" header="Fecha Emisión" :style="{ minWidth: '140px' }"></Column>
            <Column field="monto_credito" header="Monto Crédito" :style="{ minWidth: '140px' }">
              <template #body="slotProps">
                <div class="font-semibold text-blue-600">
                  ${{ parseFloat(slotProps.data.monto_credito).toFixed(2) }}
                </div>
              </template>
            </Column>
            <Column field="fecha_vencimiento" header="Vencimiento" :style="{ minWidth: '140px' }"></Column>
            <Column field="estatus" header="Estado" :style="{ minWidth: '120px' }">
              <template #body="slotProps">
                <Tag
                  :value="slotProps.data.estatus"
                  :severity="slotProps.data.estatus === 'SALDADO' ? 'success' : 'danger'"
                />
              </template>
            </Column>
                    <Column field="institucion" header="Institucion">
          <template #body="slotProps">
                <Tag
                  :value="slotProps.data.institucion"
                  severity="success"
                />
          </template>
        </Column>
            <Column field="vendedor" header="Vendedor" :style="{ minWidth: '150px' }"></Column>
          </DataTable>
        </template>
      </Card>

    </div>

    <!-- Modal: Datos del Cliente (Balance Agrupado) -->
    <Dialog v-model:visible="visibleDatosCliente" modal header="Datos del Cliente" :style="{ width: '50rem' }">
      <template #header>
        <div class="flex items-center gap-3">
          <i class="pi pi-user text-2xl text-green-600"></i>
          <div>
            <h3 class="text-xl font-bold">{{ clienteSeleccionadoModal }}</h3>
            <p class="text-sm text-gray-500">Resumen de cuentas pendientes</p>
          </div>
        </div>
      </template>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div class="info-box total-adeudado">
          <div class="info-icon">
            <i class="pi pi-dollar"></i>
          </div>
          <div>
            <div class="info-label">Total Adeudado</div>
            <div class="info-value">${{ totaAdeudado }}</div>
          </div>
        </div>

        <div class="info-box total-facturas">
          <div class="info-icon">
            <i class="pi pi-file"></i>
          </div>
          <div>
            <div class="info-label">Facturas Pendientes</div>
            <div class="info-value">{{ cantidadFacturas }}</div>
          </div>
        </div>
      </div>

      <DataTable
        :value="facturasPendientes"
        class="mini-datatable"
        size="small"
        stripedRows
      >
        <Column field="no_factura" header="Factura"></Column>
        <Column field="fecha_emision" header="Fecha"></Column>
        <Column field="monto_credito" header="Monto">
          <template #body="slotProps">
            ${{ parseFloat(slotProps.data.monto_credito).toFixed(2) }}
          </template>
        </Column>
        <Column field="saldo" header="Saldo">
          <template #body="slotProps">
            <span class="font-bold text-red-600">
              ${{ parseFloat(slotProps.data.saldo).toFixed(2) }}
            </span>
          </template>
        </Column>

      </DataTable>

      <template #footer>
        <Button label="Imprimir Saldo" icon="pi pi-print" @click="imprimirSaldo" severity="secondary" outlined />
        <Button label="Reporte PDF" icon="pi pi-file-pdf" @click="fnReportePDF" severity="danger" outlined />
        <Button label="Reporte Excel" icon="pi pi-file-excel" @click="fnReporteEXCEL" severity="success" outlined />
        <Button label="Imprimir" icon="pi pi-print" @click="visiblePrint01 = true" severity="info" outlined />
        <Button label="Abonar" icon="pi pi-money-bill" @click="visibleAbonoModal = true" severity="success" />
        <Button label="Pagar Todo" icon="pi pi-check-circle" @click="fnPagarTodo" severity="success" />
      </template>
    </Dialog>

    <!-- Modal: Elegir Tipo de Impresora (Cliente) -->
    <Dialog v-model:visible="visiblePrint01" modal header="Tipo de Impresión" :style="{ width: '30rem' }">
      <div class="flex flex-wrap gap-4 justify-center p-6">
        <Button
          label="Impresora Grande"
          icon="pi pi-print"
          @click="fnImpresoraGrande00"
          iconPos="bottom"
          severity="info"
          class="p-4"
        />
        <Button
          label="Impresora Térmica"
          icon="pi pi-print"
          @click="fnImpresoraChica00"
          iconPos="bottom"
          severity="success"
          class="p-4"
        />
      </div>

      <template #footer>
        <Button label="Cancelar" @click="visiblePrint01 = false" severity="secondary" outlined />
      </template>
    </Dialog>

    <!-- Modal: Elegir formato de factura -->
    <Dialog v-model:visible="visiblePrintFactura" modal header="Imprimir Factura" :style="{ width: '30rem' }">
      <div class="flex flex-wrap gap-4 justify-center p-6">
        <Button
          label="Carta"
          icon="pi pi-file"
          @click="fnImprimirFacturaCarta"
          iconPos="bottom"
          severity="info"
          class="p-4"
        />
        <Button
          label="Ticket"
          icon="pi pi-ticket"
          @click="fnImprimirFacturaTicket"
          iconPos="bottom"
          severity="success"
          class="p-4"
        />
      </div>

      <template #footer>
        <Button label="Cancelar" @click="visiblePrintFactura = false" severity="secondary" outlined />
      </template>
    </Dialog>

    <!-- Modal: Ver productos de factura -->
    <Dialog
      v-model:visible="visibleProductosFactura"
      modal
      :header="`Productos de Factura #${facturaProductosInfo.no_factura || ''}`"
      :style="{ width: '70rem' }"
    >
      <template #header>
        <div class="flex items-center gap-2">
          <i class="pi pi-list text-2xl text-blue-600"></i>
          <div>
            <h3 class="text-xl font-bold">Factura #{{ facturaProductosInfo.no_factura }}</h3>
            <p class="text-sm text-gray-500">{{ facturaProductosInfo.nombre_cliente }}</p>
          </div>
        </div>
      </template>

      <DataTable
        :value="productosFactura"
        class="mini-datatable"
        size="small"
        stripedRows
      >
        <Column field="codigo" header="Código"></Column>
        <Column field="nombre" header="Producto"></Column>
        <Column field="cantidad" header="Cant." :style="{ width: '90px' }">
          <template #body="slotProps">
            {{ Number(slotProps.data.cantidad || 0) }}
          </template>
        </Column>
        <Column field="precio_venta" header="Precio" :style="{ width: '120px' }">
          <template #body="slotProps">
            ${{ Number(slotProps.data.precio_venta || slotProps.data.precio || 0).toFixed(2) }}
          </template>
        </Column>
        <Column field="descuento" header="Desc." :style="{ width: '120px' }">
          <template #body="slotProps">
            ${{ Number(slotProps.data.descuento || 0).toFixed(2) }}
          </template>
        </Column>
        <Column field="impuesto" header="Imp." :style="{ width: '120px' }">
          <template #body="slotProps">
            ${{ Number(slotProps.data.impuesto || 0).toFixed(2) }}
          </template>
        </Column>
        <Column header="Total" :style="{ width: '130px' }">
          <template #body="slotProps">
            <span class="font-bold text-green-600">
              ${{
                Number(
                  slotProps.data.total ??
                  ((Number(slotProps.data.precio_final || slotProps.data.precio_venta || 0) * Number(slotProps.data.cantidad || 0)) - Number(slotProps.data.descuento || 0))
                ).toFixed(2)
              }}
            </span>
          </template>
        </Column>
      </DataTable>

      <template #footer>
        <Button label="Cerrar" @click="visibleProductosFactura = false" severity="secondary" outlined />
      </template>
    </Dialog>

    <!-- Modal: Abono Individual -->
    <Dialog v-model:visible="visibleAbono" modal header="Registrar Abono" :style="{ width: '40rem' }">
      <template #header>
        <div class="flex items-center gap-2">
          <i class="pi pi-money-bill text-2xl text-green-600"></i>
          <div>
            <h3 class="text-xl font-bold">Registrar Abono</h3>
            <p class="text-sm text-gray-500">{{ clienteSeleccionadoModal }}</p>
          </div>
        </div>
      </template>

      <div class="grid grid-cols-1 gap-4">
        <div class="flex gap-2 mb-3">
          <Button :label="`1/4: $${btn1Abono}`" @click="fnbtnAgregArbono(btn1Abono)" severity="secondary" outlined />
          <Button :label="`1/2: $${btn2Abono}`" @click="fnbtnAgregArbono(btn2Abono)" severity="secondary" outlined />
          <Button :label="`Todo: $${btn3Abono}`" @click="fnbtnAgregArbono(btn3Abono)" severity="success" outlined />
        </div>

        <div class="form-field">
          <label class="field-label">
            <i class="pi pi-calendar mr-2"></i>Fecha
          </label>
          <InputText
            v-model="fechaAbonoModal"
            class="modern-input w-full"
          />
        </div>

        <div class="form-field">
          <label class="field-label">
            <i class="pi pi-dollar mr-2"></i>Monto a Abonar
          </label>
          <InputText
            v-model="abonoAbonoModal"
            class="modern-input w-full"
          />
        </div>

        <div class="form-field">
          <label class="field-label">
            <i class="pi pi-credit-card mr-2"></i>Método de Pago
          </label>
          <Dropdown
            v-model="metodoAbonoModal"
            :options="['EFECTIVO', 'TRANSFERENCIA', 'TARJETA', 'CHEQUE']"
            placeholder="Seleccione método"
            class="w-full modern-dropdown"
          />
        </div>
      </div>

        <div v-if="requiereBanco(metodoAbonoModal)" class="form-field">
          <label class="field-label">
            <i class="pi pi-building-columns mr-2"></i>Banco donde se registrara la entrada
          </label>
          <Dropdown
            v-model="bancoAbonoModal"
            :options="bancoArray"
            optionLabel="nombre"
            placeholder="Seleccione banco"
            class="w-full modern-dropdown"
          />
        </div>

      <template #footer>
        <Button label="Cancelar" @click="visibleAbono = false" severity="secondary" outlined />
        <Button label="Registrar Abono" @click="fnAgregarAbono" severity="success" icon="pi pi-check" />
      </template>
    </Dialog>

    <!-- Modal: Abono a Múltiples Facturas -->
    <Dialog v-model:visible="visibleAbonoModal" modal header="Abonar a Todas las Facturas" :style="{ width: '40rem' }">
      <template #header>
        <div class="flex items-center gap-2">
          <i class="pi pi-money-bill text-2xl text-green-600"></i>
          <div>
            <h3 class="text-xl font-bold">Abonar a Múltiples Facturas</h3>
            <p class="text-sm text-gray-500">{{ clienteSeleccionadoModal }} - Total: ${{ totaAdeudado }}</p>
          </div>
        </div>
      </template>

      <div class="grid grid-cols-1 gap-4">
        <div class="flex gap-2 mb-3">
          <Button :label="`1/4: $${btn1Abono}`" @click="fnbtnAgregArbono(btn1Abono)" severity="secondary" outlined />
          <Button :label="`1/2: $${btn2Abono}`" @click="fnbtnAgregArbono(btn2Abono)" severity="secondary" outlined />
          <Button :label="`Todo: $${btn3Abono}`" @click="fnbtnAgregArbono(btn3Abono)" severity="success" outlined />
        </div>

        <div class="form-field">
          <label class="field-label">
            <i class="pi pi-calendar mr-2"></i>Fecha
          </label>
          <InputText
            v-model="fechaAbonoModal"
            class="modern-input w-full"
          />
        </div>

        <div class="form-field">
          <label class="field-label">
            <i class="pi pi-dollar mr-2"></i>Monto Total a Abonar
          </label>
          <InputText
            v-model="abonoAbonoModal"
            class="modern-input w-full"
          />
          <small class="text-gray-500 mt-1">El abono se distribuirá automáticamente entre las facturas pendientes</small>
        </div>

        <div class="form-field">
          <label class="field-label">
            <i class="pi pi-credit-card mr-2"></i>Método de Pago
          </label>
          <Dropdown
            v-model="metodoAbonoModal"
            :options="['EFECTIVO', 'TRANSFERENCIA', 'TARJETA', 'CHEQUE']"
            placeholder="Seleccione método"
            class="w-full modern-dropdown"
          />
        </div>
      </div>

        <div v-if="requiereBanco(metodoAbonoModal)" class="form-field">
          <label class="field-label">
            <i class="pi pi-building-columns mr-2"></i>Banco donde se registrara la entrada
          </label>
          <Dropdown
            v-model="bancoAbonoModal"
            :options="bancoArray"
            optionLabel="nombre"
            placeholder="Seleccione banco"
            class="w-full modern-dropdown"
          />
        </div>

      <template #footer>
        <Button label="Cancelar" @click="visibleAbonoModal = false" severity="secondary" outlined />
        <Button label="Distribuir Abono" @click="fnAgregarAbonoModal" severity="success" icon="pi pi-check" />
      </template>
    </Dialog>

    <!-- Modal: Abonos Inteligentes -->
    <Dialog v-model:visible="visibleAbonosInteligentes" position="top" modal :style="{ width: '75rem' }" header="Abonos Inteligentes">
      <template #header>
        <div class="flex items-center gap-2">
          <i class="pi pi-chart-bar text-2xl text-purple-600"></i>
          <h3 class="text-xl font-bold">Reporte de Abonos</h3>
        </div>
      </template>

      <div class="overflow-x-auto">
        <div v-html="generarTablaFromStringJSON(datosAbonosInteligentes, false, true, null, null, 'tablaCxC', undefined)" class="min-w-full"></div>
      </div>

      <template #footer>
        <Button label="Excel" icon="pi pi-file-excel" @click="fnCrearExcelAbonos" severity="success" outlined />
        <Button label="PDF" icon="pi pi-file-pdf" @click="fnCrearPdfAbonos" severity="danger" outlined />
        <Button label="Cerrar" @click="visibleAbonosInteligentes = false" severity="secondary" />
      </template>
    </Dialog>

    <!-- Dialog de Pago con Cuenta Contable -->
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
            <p class="text-sm text-gray-500" v-if="cuentaEnPago">{{ cuentaEnPago.nombre_cliente }}</p>
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
              <p class="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">Monto Crédito</p>
              <p class="text-base font-bold text-blue-600">${{ parseFloat(cuentaEnPago.monto_credito || 0).toFixed(2) }}</p>
            </div>
            <div>
              <p class="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">Abonado</p>
              <p class="text-base font-bold text-green-600">${{ parseFloat(cuentaEnPago.abonado || 0).toFixed(2) }}</p>
            </div>
            <div>
              <p class="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">Saldo Pendiente</p>
              <p class="text-lg font-black text-red-600">${{ parseFloat(cuentaEnPago.saldo || 0).toFixed(2) }}</p>
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
            >
              <template #value="slotProps">
                <div v-if="slotProps.value" class="flex items-center justify-between gap-2">
                  <div class="flex items-center gap-2">
                    <i class="pi pi-wallet text-green-600"></i>
                    <span class="font-semibold">{{ slotProps.value.nombre }}</span>
                  </div>
                  <span class="text-sm text-gray-600">
                    Saldo: ${{ parseFloat(slotProps.value.saldo || 0).toFixed(2) }}
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
                  <span class="text-sm font-bold text-green-600">
                    ${{ parseFloat(slotProps.option.saldo || 0).toFixed(2) }}
                  </span>
                </div>
              </template>
            </Dropdown>
            <p class="text-xs text-gray-500 mt-1">
              <i class="pi pi-info-circle mr-1"></i>
              El saldo de esta cuenta se incrementará según el monto del pago
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
              />
            </div>
            <div class="flex items-center justify-between mt-2">
              <p class="text-xs text-gray-500">
                <i class="pi pi-info-circle mr-1"></i>
                Máximo: ${{ parseFloat(cuentaEnPago.saldo || 0).toFixed(2) }}
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

          <div v-if="requiereBanco(formPago.formaPago)">
            <label class="block text-sm font-bold text-gray-700 mb-2">
              <i class="pi pi-building-columns mr-2 text-emerald-600"></i>
              Banco donde se registrara la entrada
            </label>
            <Dropdown
              v-model="formPago.banco"
              :options="bancoArray"
              optionLabel="nombre"
              placeholder="Seleccionar banco"
              class="w-full"
            >
              <template #value="slotProps">
                <div v-if="slotProps.value" class="flex items-center justify-between gap-2">
                  <div class="flex items-center gap-2">
                    <i class="pi pi-building-columns text-emerald-600"></i>
                    <span class="font-semibold">{{ slotProps.value.nombre }}</span>
                  </div>
                  <span class="text-sm text-gray-600">
                    Saldo: ${{ parseFloat(slotProps.value.saldo || 0).toFixed(2) }}
                  </span>
                </div>
                <span v-else class="text-gray-400">{{ slotProps.placeholder }}</span>
              </template>
              <template #option="slotProps">
                <div class="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
                  <div class="flex items-center gap-2">
                    <i class="pi pi-building-columns text-emerald-600"></i>
                    <span class="font-semibold">{{ slotProps.option.nombre }}</span>
                  </div>
                  <span class="text-sm font-bold text-emerald-600">
                    ${{ parseFloat(slotProps.option.saldo || 0).toFixed(2) }}
                  </span>
                </div>
              </template>
            </Dropdown>
            <p class="text-xs text-gray-500 mt-1">
              <i class="pi pi-info-circle mr-1"></i>
              Obligatorio para transferencia y tarjeta.
            </p>
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
              {{ cuentaHistorial.nombre_cliente }} - Factura: {{ cuentaHistorial.no_factura }}
            </p>
          </div>
        </div>
      </template>

      <div class="space-y-4" v-if="cuentaHistorial">
        <!-- Resumen -->
        <div class="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-xl border border-blue-200">
          <div class="grid grid-cols-3 gap-4 text-center">
            <div>
              <p class="text-xs font-semibold text-gray-600 uppercase mb-1">Monto Crédito</p>
              <p class="text-lg font-bold text-gray-800">${{ parseFloat(cuentaHistorial.monto_credito || 0).toFixed(2) }}</p>
            </div>
            <div>
              <p class="text-xs font-semibold text-gray-600 uppercase mb-1">Abonado</p>
              <p class="text-lg font-bold text-green-600">${{ parseFloat(cuentaHistorial.abonado || 0).toFixed(2) }}</p>
            </div>
            <div>
              <p class="text-xs font-semibold text-gray-600 uppercase mb-1">Saldo</p>
              <p class="text-lg font-bold text-red-600">${{ parseFloat(cuentaHistorial.saldo || 0).toFixed(2) }}</p>
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
            :key="pago.nopago"
            class="bg-white border-2 border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-all duration-200"
          >
            <div class="flex items-start justify-between">
              <div class="flex-1">
                <div class="flex items-center gap-2 mb-2">
                  <span class="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-bold">
                    #{{ pago.nopago }}
                  </span>
                  <span class="text-sm text-gray-600">
                    <i class="pi pi-calendar mr-1"></i>
                    {{ pago.fecha }}
                  </span>
                  <span class="text-sm text-gray-600">
                    <i class="pi pi-clock mr-1"></i>
                    {{ pago.hora }}
                  </span>
                  <span class="text-sm text-gray-600">
                    <i class="pi pi-user mr-1"></i>
                    {{ pago.cajero }}
                  </span>
                </div>

                <div class="grid grid-cols-2 gap-3 mb-2">
                  <div v-if="pago.cuenta_contable">
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
                          pago.metodo === 'EFECTIVO' ? 'pi pi-money-bill' : '',
                          pago.metodo === 'TRANSFERENCIA' ? 'pi pi-send' : '',
                          pago.metodo === 'CHEQUE' ? 'pi pi-book' : '',
                          pago.metodo === 'TARJETA' ? 'pi pi-credit-card' : '',
                          'text-indigo-600'
                        ]"
                      ></i>
                      {{ pago.metodo }}
                    </p>
                  </div>
                </div>

                <div v-if="pago.nota" class="bg-gray-50 p-2 rounded border border-gray-200 mt-2">
                  <p class="text-xs text-gray-500 mb-1">Nota</p>
                  <p class="text-sm text-gray-700">{{ pago.nota }}</p>
                </div>
              </div>

              <div class="ml-4 text-right">
                <p class="text-xs text-gray-500 mb-1">Monto</p>
                <p class="text-2xl font-black text-green-600">${{ parseFloat(pago.cantidad).toFixed(2) }}</p>
                <p class="text-xs text-gray-500 mt-1">Saldo: ${{ parseFloat(pago.saldo).toFixed(2) }}</p>
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
        <div class="flex justify-end">
          <Button
            label="Cerrar"
            severity="secondary"
            outlined
            @click="dialogHistorialVisible = false"
            icon="pi pi-times"
            class="px-6"
          />
        </div>
      </template>
    </Dialog>

    <Dialog v-model:visible="visibleCrearCxC" modal header="Crear Cuenta por Cobrar Manual" :style="{ width: '600px' }" :breakpoints="{ '960px': '90vw' }">
      <template #header>
        <div class="flex items-center gap-3">
          <div class="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
            <i class="pi pi-plus-circle text-blue-600 text-2xl"></i>
          </div>
          <div>
            <h2 class="text-xl font-bold text-gray-800">Nueva Cuenta por Cobrar</h2>
            <p class="text-sm text-gray-500">Registrar cuenta manualmente</p>
          </div>
        </div>
      </template>

      <div class="grid grid-cols-12 gap-4">
        <div class="col-span-12">
          <label class="block text-sm font-bold text-gray-700 mb-1">Cliente</label>
          <awesomplete
            v-model="nuevaCxC.nombre_cliente"
            @selectComplete="handleSelectClienteCrearCxC"
            :list="clientesArrayNombre"
            class="w-full"
            placeholder="Buscar cliente existente o escribir nombre nuevo"
          />
        </div>

        <div class="col-span-4">
          <label class="block text-sm font-bold text-gray-700 mb-1">Teléfono</label>
          <InputText v-model="nuevaCxC.telefono_cliente" class="w-full" placeholder="809-000-0000" />
        </div>

        <div class="col-span-4">
          <label class="block text-sm font-bold text-gray-700 mb-1">Cédula</label>
          <InputText v-model="nuevaCxC.cedula_cliente" class="w-full" placeholder="000-0000000-0" />
        </div>

        <div class="col-span-4">
          <label class="block text-sm font-bold text-gray-700 mb-1">Dirección</label>
          <InputText v-model="nuevaCxC.direccion_cliente" class="w-full" placeholder="Dirección" />
        </div>

        <div class="col-span-6">
          <label class="block text-sm font-bold text-gray-700 mb-1">Monto del Crédito</label>
          <InputNumber v-model="nuevaCxC.monto_credito" class="w-full" :min="0" :max="999999999" placeholder="0.00" />
        </div>

        <div class="col-span-6">
          <label class="block text-sm font-bold text-gray-700 mb-1">Saldo</label>
          <InputNumber v-model="nuevaCxC.saldo" class="w-full" :min="0" :max="999999999" placeholder="0.00" />
        </div>

        <div class="col-span-6">
          <label class="block text-sm font-bold text-gray-700 mb-1">Fecha de Emisión</label>
          <DatePicker v-model="nuevaCxC.fecha_emision" dateFormat="dd/mm/yy" class="w-full" />
        </div>

        <div class="col-span-6">
          <label class="block text-sm font-bold text-gray-700 mb-1">Fecha de Vencimiento</label>
          <DatePicker v-model="nuevaCxC.fecha_vencimiento" dateFormat="dd/mm/yy" class="w-full" />
        </div>

        <div class="col-span-6">
          <label class="block text-sm font-bold text-gray-700 mb-1">Interés (%)</label>
          <InputNumber v-model="nuevaCxC.interes" class="w-full" :min="0" :max="100" placeholder="0" />
        </div>

        <div class="col-span-6">
          <label class="block text-sm font-bold text-gray-700 mb-1">Cuotas</label>
          <InputNumber v-model="nuevaCxC.cuotas" class="w-full" :min="0" :max="999" placeholder="0" />
        </div>

        <div class="col-span-12">
          <label class="block text-sm font-bold text-gray-700 mb-1">Nota</label>
          <Textarea v-model="nuevaCxC.nota" class="w-full" rows="3" placeholder="Nota opcional" />
        </div>

        <div class="col-span-12">
          <div class="border-t pt-4 mt-2">
            <h3 class="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
              <i class="pi pi-money-bill text-green-600"></i>
              Abono Inicial (opcional)
            </h3>
          </div>
        </div>

        <div class="col-span-6">
          <label class="block text-sm font-bold text-gray-700 mb-1">Monto a Abonar</label>
          <InputNumber v-model="nuevaCxC.monto_abono" class="w-full" :min="0" placeholder="0.00" />
        </div>

        <div class="col-span-6">
          <label class="block text-sm font-bold text-gray-700 mb-1">Método de Pago</label>
          <Dropdown
            v-model="nuevaCxC.metodo_abono"
            :options="['EFECTIVO', 'TRANSFERENCIA', 'TARJETA', 'CHEQUE']"
            placeholder="Seleccione método"
            class="w-full modern-dropdown"
          />
        </div>
      </div>

      <template #footer>
        <div class="flex justify-end gap-2">
          <Button label="Cancelar" severity="secondary" outlined @click="visibleCrearCxC = false" icon="pi pi-times" />
          <Button label="Guardar Cuenta" severity="success" @click="fnCrearCxC" icon="pi pi-check" />
        </div>
      </template>
    </Dialog>

    <Toast />
    <EnviarWhatsApp ref="enviarWhatsAppRef" :initialDatosWhatsApp="datosWhatsApp" />
  </main>
</template>

<style scoped>
/* ===================================
   CUENTAS POR COBRAR STYLES
   =================================== */

.cuentas-wrapper {
  min-height: calc(100vh - 80px);
  background: linear-gradient(135deg, rgba(236, 253, 245, 0.3) 0%, rgba(209, 250, 229, 0.2) 100%);
}

.container-cuentas {
  max-width: 1600px;
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
  animation: slideIn 0.4s ease-out;
}

.stat-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.12);
}

.stat-pendiente {
  border-color: #ef4444;
  background: linear-gradient(135deg, rgba(239, 68, 68, 0.05) 0%, rgba(220, 38, 38, 0.02) 100%);
}

.stat-cobrado {
  border-color: #10b981;
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.05) 0%, rgba(5, 150, 105, 0.02) 100%);
}

.stat-cuentas {
  border-color: #f59e0b;
  background: linear-gradient(135deg, rgba(245, 158, 11, 0.05) 0%, rgba(217, 119, 6, 0.02) 100%);
}

.stat-saldadas {
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

.stat-pendiente .stat-icon {
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
  color: white;
}

.stat-cobrado .stat-icon {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
}

.stat-cuentas .stat-icon {
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  color: white;
}

.stat-saldadas .stat-icon {
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

/* Filters Card */
.filters-card {
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  border: 1px solid rgba(229, 231, 235, 0.8);
}

.filter-field {
  display: flex;
  flex-direction: column;
}

.filter-label {
  font-weight: 600;
  color: #374151;
  margin-bottom: 0.5rem;
  font-size: 0.875rem;
  display: flex;
  align-items: center;
}

.modern-dropdown :deep(.p-dropdown) {
  border: 2px solid #e5e7eb;
  border-radius: 10px;
  transition: all 0.3s ease;
}

.modern-dropdown :deep(.p-dropdown:focus) {
  border-color: #10b981;
  box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1);
}

.modern-calendar :deep(.p-inputtext) {
  border: 2px solid #e5e7eb;
  border-radius: 10px;
  padding: 0.75rem;
}

.modern-calendar :deep(.p-inputtext:focus) {
  border-color: #10b981;
  box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1);
}

.awesomplete-modern :deep(input) {
  border: 2px solid #e5e7eb;
  border-radius: 10px;
  padding: 0.75rem;
  width: 100%;
  font-size: 0.95rem;
  transition: all 0.3s ease;
}

.awesomplete-modern :deep(input:focus) {
  border-color: #10b981;
  box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1);
  outline: none;
}

.modern-datepicker :deep(.p-inputtext) {
  border: 2px solid #e5e7eb;
  border-radius: 10px 0 0 10px;
  padding: 0.75rem;
}

.modern-datepicker :deep(.p-inputtext:focus) {
  border-color: #10b981;
  box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1);
}

/* Table Card */
.table-card {
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  border: 1px solid rgba(229, 231, 235, 0.8);
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

.modern-datatable :deep(.p-datatable-thead > tr > th) {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
  font-weight: 700;
  padding: 1rem;
  border: none;
}

.modern-datatable :deep(.p-datatable-tbody > tr) {
  transition: all 0.2s ease;
}

.modern-datatable :deep(.p-datatable-tbody > tr:hover) {
  background: rgba(16, 185, 129, 0.05);
}

/* Row Colors */
:deep(.row-red) {
  background: rgba(239, 68, 68, 0.05) !important;
  border-left: 4px solid #ef4444;
}

:deep(.row-green) {
  background: rgba(16, 185, 129, 0.05) !important;
  border-left: 4px solid #10b981;
}

:deep(.row-yellow) {
  background: rgba(245, 158, 11, 0.05) !important;
  border-left: 4px solid #f59e0b;
}

/* Dialog Info Boxes */
.info-box {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.5rem;
  border-radius: 12px;
  border: 2px solid;
}

.total-adeudado {
  border-color: #ef4444;
  background: rgba(239, 68, 68, 0.05);
}

.total-facturas {
  border-color: #10b981;
  background: rgba(16, 185, 129, 0.05);
}

.info-icon {
  width: 60px;
  height: 60px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.75rem;
  flex-shrink: 0;
}

.total-adeudado .info-icon {
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
  color: white;
}

.total-facturas .info-icon {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
}

.info-label {
  font-size: 0.875rem;
  font-weight: 600;
  color: #6b7280;
  margin-bottom: 0.25rem;
}

.info-value {
  font-size: 2rem;
  font-weight: 800;
  color: #1f2937;
}

/* Mini DataTable */
.mini-datatable {
  font-size: 0.9rem;
}

.mini-datatable :deep(.p-datatable-thead > tr > th) {
  background: #f3f4f6;
  color: #374151;
  font-weight: 600;
  padding: 0.75rem;
}

/* Form Fields */
.form-field {
  display: flex;
  flex-direction: column;
}

.field-label {
  font-weight: 600;
  color: #374151;
  margin-bottom: 0.5rem;
  font-size: 0.95rem;
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
  border-color: #10b981;
  box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1);
  outline: none;
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
