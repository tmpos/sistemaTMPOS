<script setup>
import { ref, onMounted, nextTick, watch, watchEffect, computed } from 'vue';
import axios from 'axios';
import { 
nfecha, 
arrayToObjetoFromTabla, 
peticionesFetch,
obtenerIdsSeleccionados, 
crearTablaSiNoExiste,
encryptarPassword,
envioElectron,
peticionesFetchOffline,
crearTablaSiNoExisteOffline,
buscadorArrayObjeto } from '@/funciones/funciones.js';
import Swal from 'sweetalert2'
import { useToast } from "primevue/usetoast";
const toast = useToast();
import { useRouter, useRoute } from 'vue-router';
const router = useRouter();
/************************************************************************/
const filtroEstado = ref('ACTIVA');
const filtroTipo = ref('');
const estadosDisponibles = ['ACTIVA', 'PAGADA', 'CANCELADA'];
/************************************************************************/
import flatPickr from 'vue-flatpickr-component';
import 'flatpickr/dist/flatpickr.css';
/************************************************************************/
  const basic = ref({
    dateFormat: 'd/m/Y',
  });
/************************************************************************/
const usuarioLocal = ref({})
/************************************************************************/
const camposArray = ['no_nomina', 'fecha_inicio', 'fecha_final', 'estado', 'cedula', 'nombre', 'cargo', 'sueldo', 'total_deducciones', 'total_neto_pagar', 'nomina', 'almacen', 'asiento_id', 'tipo_nomina'];
const tiposNomina = ['SEMANAL', 'QUINCENAL', 'MENSUAL', 'QUINCENA_15_30'];
/************************************************************************/
import Dialog from 'primevue/dialog';
import { useDatosEmpresa } from '@/stores'
const datosEmpresa = useDatosEmpresa();
const link = ref('');
const api = ref('');
const token = ref('');
const patronTelefono = ref('');
const linkImpresora = ref('');
const patroncedula = ref('');
const tokenCifrado = ref('');
const tokenCorto = ref('');
const datosJSON = ref([]);
/************************************************************************/
const selectedItems = ref([]);
/************************************************************************/
const ajusteGlobalDialogVisible = ref(false);
const ajusteGlobalForm = ref({ tipo: 'DEDUCCION', concepto: '', monto: '' });
const pagarSeleccionDialogVisible = ref(false);
const cuentasList = ref([]);
const cuentaGastoSeleccionada = ref(null);
const cuentasCredito = ref([{ cuenta: null, monto: 0 }]);
const metodoPagoSeleccion = ref('EFECTIVO');

const totalNetoSeleccion = computed(() =>
  selectedItems.value.reduce((s, r) => s + parseFloat(r.total_neto_pagar || 0), 0)
);

const totalCredito = computed(() =>
  cuentasCredito.value.reduce((s, l) => s + parseFloat(l.monto || 0), 0)
);

const creditosValidos = computed(() =>
  cuentasCredito.value.filter(l => l.cuenta && parseFloat(l.monto || 0) > 0)
);

const creditoValido = computed(() => {
  const total = totalNetoSeleccion.value;
  return total > 0 && Math.abs(totalCredito.value - total) < 0.01;
});

const agregarLineaCredito = () => {
  cuentasCredito.value.push({ cuenta: null, monto: 0 });
};

const eliminarLineaCredito = (index) => {
  if (cuentasCredito.value.length > 1) {
    cuentasCredito.value.splice(index, 1);
  }
};

const distribuirMonto = () => {
  const total = totalNetoSeleccion.value;
  const count = cuentasCredito.value.length;
  const monto = count > 0 ? total / count : 0;
  cuentasCredito.value.forEach(l => { l.monto = parseFloat(monto.toFixed(2)); });
  // ajustar último para compensar redondeo
  if (count > 0) {
    const suma = cuentasCredito.value.reduce((s, l) => s + parseFloat(l.monto || 0), 0);
    cuentasCredito.value[count - 1].monto = parseFloat((total - (suma - (cuentasCredito.value[count - 1].monto || 0))).toFixed(2));
  }
};
/************************************************************************/
const position = ref('top');
const openPosition = (pos) => {
    position.value = pos;
    visible.value = true;
}
/************************************************************************/
const datoscamposNomina = ref({})
/************************************************************************/
const visible = ref(false);
const visiblecrear = ref(false);
const value = ref(null);
const id = ref(null);
const datoscampos = ref({});
const data = ref([]);
const searchQuery = ref('');
const NominaEditar = ref(null);
/************************************************************************/
async function limpiarCamposCrear() {
datoscamposNomina.value = {}
await campos();
}
/************************************************************************/
watchEffect(() => {
  if (visiblecrear.value) {
  }
});
/************************************************************************/
const fetchAndSetupData = async () => {
const response = await peticionesFetchOffline('getDataAsArray', 'nomina');
    const jsonData = response.reverse();
    data.value = jsonData;
};
/************************************************************************/
async function campos() {
  const campos = await arrayToObjetoFromTabla('nomina');
  datoscamposNomina.value = campos;
}
/************************************************************************/
const datosConfig = async()=>{
    const response = await envioElectron('datosarchivo');
    datosJSON.value = response;
    link.value = datosJSON.value.VITE_LINKURL;
    api.value = datosJSON.value.VITE_LINK_API;
    token.value = datosJSON.value.VITE_TOKEN;
    patronTelefono.value = datosJSON.value.VITE_PATRON_TELEFONO;
    linkImpresora.value = datosJSON.value.VITE_IMPRESORA_LOCAL;
    tokenCorto.value = datosJSON.value.VITE_TOKEN_CORTO;
    patroncedula.value = datosJSON.value.VITE_PATRON_CEDULA;
}
/************************************************************************/
onMounted(async () => {
await datosConfig()
tokenCifrado.value = await encryptarPassword(token.value, 10);

const offline = datosJSON.value.OFFLINE === 'true' ? true : false;

if(offline){
   await crearTablaSiNoExisteOffline('nomina',camposArray.join(','),toast)
}else{
    if(navigator.onLine){
       await crearTablaSiNoExiste(link.value, api.value, 'nomina', camposArray, tokenCifrado.value,toast);
    }
}
        
//usuarioLocal.value = JSON.parse(window.localStorage.getItem('usuarioLocal'))[0] || {};
await campos();
await fetchAndSetupData();
});
/************************************************************************/
  async function borrarTodo() {
    Swal.fire({
        title: "¿Estás seguro?",
        text: "Se borrarán los datos!",
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
                    const envioDatos = await peticionesFetchOffline('deleteAll', 'nomina');
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
                            const envioDatos = await peticionesFetchOffline('deleteEntry','nomina', id);
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
const generarPdfSeleccionados = async () => {
  if (selectedItems.value.length === 0) {
    toast.add({ severity: 'error', summary: 'Error', detail: 'Seleccione al menos un registro.', life: 3000 });
    return;
  }

  try {
    const { jsPDF } = await import("jspdf");
    const { default: autoTable } = await import("jspdf-autotable");

    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    const marginX = 12;
    const primaryColor = [15, 118, 110];
    const darkColor = [15, 23, 42];
    const mutedColor = [100, 116, 139];
    const borderColor = [226, 232, 240];
    const lightBgColor = [248, 250, 252];
    const formatMoney = (value) => `RD$ ${Number(value || 0).toLocaleString('es-DO', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
    const now = new Date().toLocaleDateString('es-DO', { year: 'numeric', month: 'long', day: 'numeric' });
    const empresa = datosEmpresa.empresa?.nombre || 'EMPRESA';
    const rnc = datosEmpresa.empresa?.rnc || '';

    const records = [...selectedItems.value];
    const noNomina = records[0]?.no_nomina || '';
    const fecInicio = records[0]?.fecha_inicio || '';
    const fecFinal = records[0]?.fecha_final || '';

    let totalGeneralSueldo = 0;
    let totalGeneralARS = 0;
    let totalGeneralAFP = 0;
    let totalGeneralBruto = 0;
    let totalGeneralISR = 0;
    let totalGeneralOtros = 0;
    let totalGeneralDesc = 0;
    let totalGeneralNeto = 0;

    const rows = records.map(r => {
      let nominaArray = [];
      try { nominaArray = JSON.parse(r.nomina || '[]'); } catch (e) { nominaArray = []; }

      const sueldo = parseFloat(r.sueldo || 0);
      let totalARS = 0;
      let totalAFP = 0;
      let totalISR = 0;
      let totalOtros = 0;
      let totalBruto = sueldo;

      for (const item of nominaArray) {
        totalBruto += parseFloat(item.hora_extra || 0) + parseFloat(item.comision || 0) + parseFloat(item.ingreso_sdss || 0);
        totalARS += parseFloat(item.sf_salud || 0);
        totalAFP += parseFloat(item.svejez_discap || 0);
        totalISR += parseFloat(item.base_isr || 0) + parseFloat(item.imp_sobre_renta || 0);
        totalOtros += parseFloat(item.desc_percapita || 0) + parseFloat(item.prestamos || 0);
      }

      const totalDesc = totalARS + totalAFP + totalISR + totalOtros;
      const totalNeto = totalBruto - totalDesc;

      totalGeneralSueldo += sueldo;
      totalGeneralARS += totalARS;
      totalGeneralAFP += totalAFP;
      totalGeneralBruto += totalBruto;
      totalGeneralISR += totalISR;
      totalGeneralOtros += totalOtros;
      totalGeneralDesc += totalDesc;
      totalGeneralNeto += totalNeto;

      return [
        r.nombre || 'Sin nombre',
        formatMoney(sueldo),
        formatMoney(totalARS),
        formatMoney(totalAFP),
        formatMoney(totalBruto),
        formatMoney(totalISR),
        formatMoney(totalOtros),
        formatMoney(totalDesc),
        formatMoney(totalNeto)
      ];
    });

    rows.push([
      { content: 'TOTALES', styles: { fontStyle: 'bold', fillColor: darkColor, textColor: 255, fontSize: 8.5 } },
      { content: formatMoney(totalGeneralSueldo), styles: { fontStyle: 'bold', fillColor: darkColor, textColor: 255, fontSize: 8.5 } },
      { content: formatMoney(totalGeneralARS), styles: { fontStyle: 'bold', fillColor: darkColor, textColor: 255, fontSize: 8.5 } },
      { content: formatMoney(totalGeneralAFP), styles: { fontStyle: 'bold', fillColor: darkColor, textColor: 255, fontSize: 8.5 } },
      { content: formatMoney(totalGeneralBruto), styles: { fontStyle: 'bold', fillColor: darkColor, textColor: 255, fontSize: 8.5 } },
      { content: formatMoney(totalGeneralISR), styles: { fontStyle: 'bold', fillColor: darkColor, textColor: 255, fontSize: 8.5 } },
      { content: formatMoney(totalGeneralOtros), styles: { fontStyle: 'bold', fillColor: darkColor, textColor: 255, fontSize: 8.5 } },
      { content: formatMoney(totalGeneralDesc), styles: { fontStyle: 'bold', fillColor: darkColor, textColor: 255, fontSize: 8.5 } },
      { content: formatMoney(totalGeneralNeto), styles: { fontStyle: 'bold', fillColor: primaryColor, textColor: 255, fontSize: 8.5 } }
    ]);

    const drawHeader = () => {
      doc.setFillColor(...darkColor);
      doc.rect(0, 0, pageW, 28, 'F');
      doc.setFillColor(...primaryColor);
      doc.rect(0, 28, pageW, 2.2, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.text(empresa.toUpperCase(), marginX, 11);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.text(rnc ? `RNC: ${rnc}` : 'Reporte de nomina', marginX, 17);
      doc.text(`No. ${noNomina || '-'}  |  Periodo: ${fecInicio || '-'} al ${fecFinal || '-'}`, pageW - marginX, 21, { align: 'right' });
      doc.text(`Generado: ${now}`, marginX, 22);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(22);
      doc.text('NOMINA', pageW - marginX, 13, { align: 'right' });
    };

    const drawFooter = () => {
      const pageNumber = doc.internal.getNumberOfPages();
      doc.setDrawColor(...borderColor);
      doc.line(marginX, pageH - 12, pageW - marginX, pageH - 12);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(...mutedColor);
      doc.text('Documento generado por TM-POS', marginX, pageH - 7);
      doc.text(`Pagina ${pageNumber}`, pageW - marginX, pageH - 7, { align: 'right' });
    };

    drawHeader();

    const summaryY = 36;
    const summaryCards = [
      { label: 'Empleados', value: String(records.length) },
      { label: 'Sueldo bruto', value: formatMoney(totalGeneralBruto) },
      { label: 'Deducciones', value: formatMoney(totalGeneralDesc) },
      { label: 'Neto a pagar', value: formatMoney(totalGeneralNeto), accent: true }
    ];
    const cardGap = 4;
    const cardW = (pageW - marginX * 2 - cardGap * (summaryCards.length - 1)) / summaryCards.length;

    summaryCards.forEach((card, index) => {
      const x = marginX + index * (cardW + cardGap);
      doc.setFillColor(...(card.accent ? primaryColor : lightBgColor));
      doc.roundedRect(x, summaryY, cardW, 17, 2, 2, 'F');
      doc.setDrawColor(...(card.accent ? primaryColor : borderColor));
      doc.roundedRect(x, summaryY, cardW, 17, 2, 2, 'S');
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(...(card.accent ? [220, 252, 231] : mutedColor));
      doc.text(card.label.toUpperCase(), x + 4, summaryY + 6);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(...(card.accent ? [255, 255, 255] : darkColor));
      doc.text(card.value, x + 4, summaryY + 13);
    });

    autoTable(doc, {
      startY: 60,
      margin: { left: marginX, right: marginX, bottom: 18 },
      head: [['Empleado', 'Sueldo', 'ARS (3.04%)', 'AFP (2.87%)', 'Sueldo Bruto', 'ISR', 'Otros Desc.', 'Total Desc.', 'Neto a Pagar']],
      body: rows,
      theme: 'grid',
      styles: {
        font: 'helvetica',
        fontSize: 7.2,
        cellPadding: { top: 2.2, right: 2, bottom: 2.2, left: 2 },
        lineColor: borderColor,
        lineWidth: 0.15,
        textColor: [30, 41, 59],
        valign: 'middle'
      },
      headStyles: {
        fillColor: darkColor,
        textColor: 255,
        fontStyle: 'bold',
        fontSize: 7.4,
        halign: 'center',
        cellPadding: { top: 3, right: 2, bottom: 3, left: 2 }
      },
      columnStyles: {
        0: { cellWidth: 52, fontStyle: 'bold' },
        1: { halign: 'right', cellWidth: 25 },
        2: { halign: 'right', cellWidth: 24 },
        3: { halign: 'right', cellWidth: 24 },
        4: { halign: 'right', cellWidth: 26 },
        5: { halign: 'right', cellWidth: 23 },
        6: { halign: 'right', cellWidth: 24 },
        7: { halign: 'right', cellWidth: 26 },
        8: { halign: 'right', cellWidth: 27, fontStyle: 'bold', textColor: primaryColor }
      },
      bodyStyles: {
        fillColor: [255, 255, 255]
      },
      alternateRowStyles: {
        fillColor: lightBgColor
      },
      didDrawPage: () => {
        drawFooter();
      }
    });

    const finalY = doc.lastAutoTable.finalY + 7;
    if (finalY + 24 < pageH - 16) {
      doc.setFillColor(...lightBgColor);
      doc.roundedRect(marginX, finalY, pageW - marginX * 2, 18, 2, 2, 'F');
      doc.setDrawColor(...borderColor);
      doc.roundedRect(marginX, finalY, pageW - marginX * 2, 18, 2, 2, 'S');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(...darkColor);
      doc.text('RESUMEN FINAL', marginX + 4, finalY + 6);
      doc.setFontSize(9);
      doc.text(`Total deducciones: ${formatMoney(totalGeneralDesc)}`, marginX + 4, finalY + 13);
      doc.setTextColor(...primaryColor);
      doc.text(`Total neto a pagar: ${formatMoney(totalGeneralNeto)}`, pageW - marginX - 4, finalY + 13, { align: 'right' });
    }

    const pdfBlob = doc.output('blob');
    const pdfUrl = URL.createObjectURL(pdfBlob);

    Swal.fire({
      title: `Nómina No. ${noNomina}`,
      html: `
        <div style="display:flex;flex-direction:column;gap:12px;">
          <div style="display:flex;justify-content:center;gap:12px;flex-wrap:wrap;">
            <a href="${pdfUrl}" download="Nomina_${noNomina}.pdf" style="text-decoration:none;">
              <button class="swal2-confirm swal2-styled" style="background:#0d9488;">Descargar PDF</button>
            </a>
            <button id="btn-imprimir-pdf" class="swal2-confirm swal2-styled" style="background:#2563eb;">Imprimir</button>
          </div>
          <iframe src="${pdfUrl}" style="width:100%;height:500px;border:1px solid #e2e8f0;border-radius:8px;"></iframe>
        </div>
      `,
      width: '900px',
      showConfirmButton: false,
      showCancelButton: true,
      cancelButtonText: 'Cerrar',
      didOpen: () => {
        document.getElementById('btn-imprimir-pdf')?.addEventListener('click', () => {
          const iframe = document.querySelector('.swal2-html-container iframe');
          if (iframe) iframe.contentWindow.print();
        });
      },
      didClose: () => URL.revokeObjectURL(pdfUrl)
    });
  } catch (error) {
    console.error('Error al generar PDF:', error);
    toast.add({ severity: 'error', summary: 'Error', detail: 'Error al generar el PDF.', life: 5000 });
  }
};
/************************************************************************/
const abrirAjusteGlobal = () => {
  if (selectedItems.value.length === 0) {
    toast.add({ severity: 'error', summary: 'Error', detail: 'Seleccione al menos una nómina.', life: 3000 });
    return;
  }
  ajusteGlobalForm.value = { tipo: 'DEDUCCION', concepto: '', monto: '' };
  ajusteGlobalDialogVisible.value = true;
};

const confirmarAjusteGlobal = async () => {
  if (!ajusteGlobalForm.value.concepto || !ajusteGlobalForm.value.monto) {
    toast.add({ severity: 'error', summary: 'Error', detail: 'Concepto y monto son requeridos.', life: 3000 });
    return;
  }

  ajusteGlobalDialogVisible.value = false;
  const allRecords = [...selectedItems.value];
  let exitoTotal = true;

  for (const record of allRecords) {
    let nominaArray = [];
    try {
      nominaArray = JSON.parse(record.nomina || '[]');
    } catch (e) {
      nominaArray = [];
    }

    const monto = parseFloat(ajusteGlobalForm.value.monto) || 0;
    const esIngreso = ajusteGlobalForm.value.tipo === 'INGRESO';

    const newEntry = {
      comision: 0,
      hora_extra: 0,
      ingreso_sdss: esIngreso ? monto : 0,
      sf_salud: 0,
      svejez_discap: 0,
      desc_percapita: esIngreso ? 0 : monto,
      base_isr: 0,
      imp_sobre_renta: 0,
      prestamos: 0,
      descripcion: ajusteGlobalForm.value.concepto,
      total_ingresos: esIngreso ? monto.toFixed(2) : '0.00',
      total_deducciones: esIngreso ? '0.00' : monto.toFixed(2),
      total_neto: esIngreso ? monto.toFixed(2) : (-monto).toFixed(2)
    };

    nominaArray.push(newEntry);

    const sueldo = parseFloat(record.sueldo || 0);
    const sumIngresos = nominaArray.reduce((sum, n) => sum + parseFloat(n.total_ingresos || 0), 0);
    const sumDeducciones = nominaArray.reduce((sum, n) => sum + parseFloat(n.total_deducciones || 0), 0);

    const updateData = {
      ...record,
      nomina: JSON.stringify(nominaArray),
      total_deducciones: sumDeducciones.toFixed(2),
      total_neto_pagar: (sueldo + sumIngresos - sumDeducciones).toFixed(2)
    };

    try {
      const result = await peticionesFetchOffline('updateData', 'nomina', JSON.stringify(updateData));
      if (result[0] !== 'ok') {
        exitoTotal = false;
      }
    } catch (error) {
      exitoTotal = false;
    }
  }

  if (exitoTotal) {
    toast.add({ severity: 'success', summary: 'Éxito', detail: `Ajuste aplicado a ${allRecords.length} empleado(s) seleccionados.`, life: 4000 });
    await fetchAndSetupData();
  } else {
    toast.add({ severity: 'error', summary: 'Error', detail: 'Fallo al aplicar ajuste en algunos registros.', life: 5000 });
  }
};
/************************************************************************/
const generarAsientoContableNomina = async (records, cuentasCreditoArray, cuentaDebito, metodoPago) => {
  let totalBruto = 0;
  let totalNeto = 0;
  let totalAFP = 0;
  let totalSFS = 0;
  let totalISR = 0;

  for (const r of records) {
    const sueldo = parseFloat(r.sueldo || 0);
    let nominaArray = [];
    try { nominaArray = JSON.parse(r.nomina || '[]'); } catch (e) { nominaArray = []; }

    let ingresosExtra = 0;
    let afp = 0, sfs = 0, isr = 0;

    for (const item of nominaArray) {
      ingresosExtra += parseFloat(item.comision || 0) + parseFloat(item.hora_extra || 0) + parseFloat(item.ingreso_sdss || 0);
      afp += parseFloat(item.svejez_discap || 0);
      sfs += parseFloat(item.sf_salud || 0);
      isr += parseFloat(item.imp_sobre_renta || 0) + parseFloat(item.base_isr || 0);
    }

    totalBruto += sueldo + ingresosExtra;
    totalNeto += parseFloat(r.total_neto_pagar || 0);
    totalAFP += afp;
    totalSFS += sfs;
    totalISR += isr;
  }

  const lineas = [
    { cuenta: cuentaDebito.nombre, debe: totalBruto, haber: 0 }
  ];
  for (const l of cuentasCreditoArray) {
    if (l.cuenta && parseFloat(l.monto || 0) > 0) {
      lineas.push({ cuenta: l.cuenta.nombre, debe: 0, haber: parseFloat(l.monto) });
    }
  }
  if (totalAFP > 0) lineas.push({ cuenta: 'RETENCIONES AFP POR PAGAR', debe: 0, haber: totalAFP });
  if (totalSFS > 0) lineas.push({ cuenta: 'RETENCIONES SFS POR PAGAR', debe: 0, haber: totalSFS });
  if (totalISR > 0) lineas.push({ cuenta: 'ISR POR PAGAR', debe: 0, haber: totalISR });

  const asiento = {
    numero: `NOM-${Date.now()}`,
    fecha: nfecha('fecha'),
    hora: nfecha('hora'),
    asiento: JSON.stringify({
      descripcion: `Pago de nómina - ${records.length} empleado(s) - No. ${records[0]?.no_nomina || ''}`,
      lineas,
      metodo_pago: metodoPago,
      origen: 'NOMINA',
      origen_id: records[0]?.no_nomina || ''
    }),
    usuario: datosEmpresa.usuario?.nombre || 'SISTEMA'
  };

  await peticionesFetchOffline('insertData', 'asientodiario', JSON.stringify(asiento));
  return asiento.numero;
};

const abrirPagarSeleccion = async () => {
  if (selectedItems.value.length === 0) {
    toast.add({ severity: 'error', summary: 'Error', detail: 'Seleccione al menos una nómina.', life: 3000 });
    return;
  }
  const response = await peticionesFetchOffline('getDataAsArray', 'cuentas');
  cuentasList.value = Array.isArray(response) ? response : [];
  cuentaGastoSeleccionada.value = null;
  cuentasCredito.value = [{ cuenta: null, monto: 0 }];
  metodoPagoSeleccion.value = 'EFECTIVO';
  pagarSeleccionDialogVisible.value = true;
};

const confirmarPagarSeleccion = async () => {
  if (!cuentaGastoSeleccionada.value) {
    toast.add({ severity: 'error', summary: 'Error', detail: 'Seleccione la cuenta de gasto (débito).', life: 3000 });
    return;
  }
  const creditosValidos = cuentasCredito.value.filter(l => l.cuenta && parseFloat(l.monto || 0) > 0);
  if (creditosValidos.length === 0) {
    toast.add({ severity: 'error', summary: 'Error', detail: 'Agregue al menos una cuenta de crédito con monto mayor a 0.', life: 3000 });
    return;
  }
  if (!creditoValido.value) {
    toast.add({ severity: 'error', summary: 'Error', detail: `La suma de créditos (RD$ ${totalCredito.value.toFixed(2)}) no coincide con el total neto (RD$ ${totalNetoSeleccion.value.toFixed(2)}).`, life: 5000 });
    return;
  }

  pagarSeleccionDialogVisible.value = false;
  const records = [...selectedItems.value];
  const usuario = datosEmpresa.usuario?.email || datosEmpresa.usuario?.nombre || 'SISTEMA';
  const almacen = datosEmpresa.empresa?.nombre || '';
  let pagadas = 0;
  let errores = 0;

  // Generar asiento contable con débito/crédito
  let asientoNumero = '';
  try {
    asientoNumero = await generarAsientoContableNomina(
      records,
      creditosValidos.value,
      cuentaGastoSeleccionada.value,
      metodoPagoSeleccion.value
    );
    toast.add({ severity: 'info', summary: 'Asiento contable', detail: `Asiento No. ${asientoNumero} generado`, life: 3000 });
  } catch (error) {
    console.error('Error generando asiento contable:', error);
    toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo generar el asiento contable', life: 4000 });
    return;
  }

  for (const record of records) {
    const monto = parseFloat(record.total_neto_pagar || 0);

    const gasto = {
      cajero: usuario,
      cantidad: monto.toFixed(2),
      fecha: nfecha('fecha'),
      hora: nfecha('hora'),
      turno: 'DIA',
      metodo: metodoPagoSeleccion.value,
      descripcion: `PAGO NÓMINA No. ${record.no_nomina} - ${record.nombre || ''}`,
      mes: nfecha('mes'),
      year: nfecha('year'),
      usuario: usuario,
      almacen: almacen,
      created_at: nfecha('timestamp'),
      updated_at: nfecha('timestamp')
    };

    try {
      const envioGasto = await peticionesFetchOffline('insertData', 'gastos', JSON.stringify(gasto));
      if (envioGasto[0] === 'ok') {
        const updateData = { ...record, estado: 'PAGADA', asiento_id: asientoNumero };
        const envioUpdate = await peticionesFetchOffline('updateData', 'nomina', JSON.stringify(updateData));
        if (envioUpdate[0] === 'ok') {
          pagadas++;
        } else {
          errores++;
        }
      } else {
        errores++;
      }
    } catch (error) {
      errores++;
    }
  }

  await fetchAndSetupData();
  if (errores === 0) {
    toast.add({ severity: 'success', summary: 'Pagadas', detail: `${pagadas} nómina(s) pagada(s) — Asiento No. ${asientoNumero}`, life: 6000 });
  } else {
    toast.add({ severity: 'warn', summary: 'Pago parcial', detail: `${pagadas} pagada(s), ${errores} con error — Asiento No. ${asientoNumero}`, life: 6000 });
  }
};
/************************************************************************/
const itemsNomina = ref([]);
const menu = ref(null);
const currentRowData = ref(null);
const toggleNomina = (event, rowData) => {
currentRowData.value = rowData;
itemsNomina.value = [
{ label: 'Editar', icon: 'pi pi-pencil', command: () => { 
router.push({ path: `/editarnomina/${currentRowData.value.id}` });
} },
{ label: 'Pagar', icon: 'pi pi-dollar', command: () => {
  if (currentRowData.value.estado === 'ACTIVA') {
    selectedItems.value = [currentRowData.value];
    abrirPagarSeleccion();
  } else {
    toast.add({ severity: 'warn', summary: 'Atención', detail: 'Solo nóminas en estado ACTIVA pueden pagarse', life: 3000 });
  }
} },
{ separator: true },
{ label: 'Eliminar', icon: 'pi pi-trash', command: () => {
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
                        const datosFactura = await peticionesFetchOffline('deleteEntry','nomina', rowData.id);
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
// Filtrado combinado: texto + estado
const filteredNomina = computed(() => {
  let lista = data.value;

  if (searchQuery.value) {
    lista = lista.filter((item) =>
      Object.values(item).some((v) =>
        String(v).toLowerCase().includes(searchQuery.value.toLowerCase())
      )
    );
  }

  if (filtroEstado.value) {
    lista = lista.filter(
      (item) => String(item.estado).toLowerCase() === filtroEstado.value.toLowerCase()
    );
  }

  if (filtroTipo.value) {
    lista = lista.filter(
      (item) => String(item.tipo_nomina).toUpperCase() === filtroTipo.value.toUpperCase()
    );
  }

  return lista;
});
/************************************************************************/
const grupoSeleccionado = ref('');
const gruposNominaActivas = computed(() => {
  const activas = data.value.filter(n => n.estado === 'ACTIVA');
  const grupos = {};
  activas.forEach(n => {
    if (!grupos[n.no_nomina]) {
      grupos[n.no_nomina] = { no_nomina: n.no_nomina, empleados: [], total_sueldo: 0 };
    }
    grupos[n.no_nomina].empleados.push(n);
    grupos[n.no_nomina].total_sueldo += parseFloat(n.sueldo || 0);
  });
  return Object.values(grupos).sort((a, b) => b.empleados.length - a.empleados.length);
});

const seleccionarGrupo = (noNomina) => {
  if (grupoSeleccionado.value === noNomina) {
    grupoSeleccionado.value = '';
    selectedItems.value = [];
  } else {
    grupoSeleccionado.value = noNomina;
    selectedItems.value = gruposNominaActivas.value.find(g => g.no_nomina === noNomina)?.empleados || [];
  }
};
/************************************************************************/
const fnAwesomplete = ()=>{
}
const handleSelectComplete = async(selected)=>{
}
/************************************************************************/
const onRowSelect = (event) => {
 router.push({ path: `/editarnomina/${event.data.id}` });

};
/************************************************************************/
const colorEstado = (data) => {
    const estado = data.estado;

    if (estado === 'ACTIVA') {
        return 'success'; 
    } else if (estado === 'PAGADA') {
        return 'warn'; 
    } else {
        return 'secondary'; 
    }
};

const colorTipo = (tipo) => {
  const colores = { SEMANAL: '#3b82f6', QUINCENAL: '#f59e0b', MENSUAL: '#10b981', QUINCENA_15_30: '#8b5cf6' };
  return colores[tipo] || '#64748b';
};
/************************************************************************/
// Express create
const crearExpressDialogVisible = ref(false);
const empleadosList = ref([]);
const empleadosSeleccionados = ref([]);
const expressFechaI = ref('');
const expressFechaF = ref('');
const expressTipo = ref('SEMANAL');

const calcularFechaFinal = (fechaInicio, tipo) => {
  if (!fechaInicio) return nfecha('fecha');
  const parts = fechaInicio.split('/');
  const date = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
  switch (tipo) {
    case 'SEMANAL': date.setDate(date.getDate() + 7); break;
    case 'QUINCENAL': date.setDate(date.getDate() + 15); break;
    case 'MENSUAL': date.setMonth(date.getMonth() + 1); break;
    case 'QUINCENA_15_30':
      if (date.getDate() <= 15) { date.setDate(15); }
      else { date.setMonth(date.getMonth() + 1); date.setDate(0); }
      break;
  }
  return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
};

watch([() => expressTipo.value, () => expressFechaI.value], () => {
  if (expressFechaI.value) expressFechaF.value = calcularFechaFinal(expressFechaI.value, expressTipo.value);
});

const abrirCrearExpress = async () => {
  const response = await peticionesFetchOffline('getDataAsArray', 'empleados');
  empleadosList.value = Array.isArray(response) ? response.filter(e => e.estado === 'ACTIVO') : [];
  empleadosSeleccionados.value = [];
  expressFechaI.value = nfecha('fecha');
  expressFechaF.value = nfecha('fecha');
  expressTipo.value = 'SEMANAL';
  crearExpressDialogVisible.value = true;
};

const confirmarCrearExpress = async () => {
  if (empleadosSeleccionados.value.length === 0) {
    toast.add({ severity: 'error', summary: 'Error', detail: 'Seleccione al menos un empleado.', life: 3000 });
    return;
  }
  if (!expressFechaI.value || !expressFechaF.value) {
    toast.add({ severity: 'error', summary: 'Error', detail: 'Complete las fechas de inicio y final.', life: 3000 });
    return;
  }
  crearExpressDialogVisible.value = false;
  const noNomina = `NOM-${Date.now()}`;
  const almacen = datosEmpresa.empresa?.nombre || '';
  let creadas = 0;
  let errores = 0;

  for (const emp of empleadosSeleccionados.value) {
    const sueldo = parseFloat(emp.sueldo_base || 0);
    const record = {
      no_nomina: noNomina,
      fecha_inicio: expressFechaI.value,
      fecha_final: expressFechaF.value,
      estado: 'ACTIVA',
      cedula: emp.cedula || '',
      nombre: emp.nombre || '',
      cargo: emp.cargo || '',
      sueldo: sueldo.toFixed(2),
      total_deducciones: '0.00',
      total_neto_pagar: sueldo.toFixed(2),
      nomina: '[]',
      almacen,
      asiento_id: '',
      tipo_nomina: expressTipo.value
    };
    try {
      const result = await peticionesFetchOffline('insertData', 'nomina', JSON.stringify(record));
      if (result[0] === 'ok') creadas++;
      else errores++;
    } catch (e) {
      errores++;
    }
  }
  await fetchAndSetupData();
  if (errores === 0) {
    toast.add({ severity: 'success', summary: 'Nóminas creadas', detail: `${creadas} nómina(s) creadas — No. ${noNomina}`, life: 5000 });
  } else {
    toast.add({ severity: 'warn', summary: 'Parcial', detail: `${creadas} creada(s), ${errores} con error — No. ${noNomina}`, life: 5000 });
  }
};
/************************************************************************/
</script>
<template>
  <main class="nomina-wrapper">
    <div class="w-full px-4 py-6 space-y-6">
      <section class="nomina-hero shadow-lg">
        <div class="nomina-hero__text">
          <p class="eyebrow">Nómina</p>
          <h1>Gestión de nóminas</h1>
          <p>Administra periodos, estados y pagos con filtros claros y acciones rápidas.</p>
          <div class="nomina-hero__meta">
            <span class="meta-pill">
              <i class="pi pi-database"></i>
              Registros: {{ filteredNomina.length }}
            </span>
            <span class="meta-pill">
              <i class="pi pi-filter"></i>
              Estado: {{ filtroEstado || 'Todos' }}
            </span>
          </div>
        </div>
        <div class="nomina-hero__stats">
          <div class="stat-card">
            <span class="label">Activas</span>
            <span class="value">{{ filteredNomina.filter(n => n.estado === 'ACTIVA').length }}</span>
          </div>
          <div class="stat-card alt">
            <span class="label">Pagadas</span>
            <span class="value">{{ filteredNomina.filter(n => n.estado === 'PAGADA').length }}</span>
          </div>
          <div class="stat-card">
            <span class="label">Canceladas</span>
            <span class="value">{{ filteredNomina.filter(n => n.estado === 'CANCELADA').length }}</span>
          </div>
        </div>
      </section>

      <section class="panel shadow-md">
        <div class="panel__header">
          <div>
            <p class="eyebrow">Acciones</p>
            <h2>Administrar nóminas</h2>
            <span class="helper-text">Recarga, crea, elimina o filtra tus nóminas.</span>
          </div>
          <div class="actions-grid">
            <Button icon="pi pi-sync" label="Recargar" severity="info" outlined @click="fetchAndSetupData" />
            <router-link to="/crearnomina">
              <Button icon="pi pi-plus" label="Nueva nómina" severity="success" />
            </router-link>
            <Button icon="pi pi-bolt" label="Crear Express" severity="warning" @click="abrirCrearExpress" />
            <Button icon="pi pi-dollar" label="Pagar" severity="success" @click="abrirPagarSeleccion" />
            <Button icon="pi pi-file-pdf" label="PDF" severity="danger" outlined @click="generarPdfSeleccionados" />
            <Button icon="pi pi-sliders-v" label="Ajuste Global" severity="info" outlined @click="abrirAjusteGlobal" />
            <Button icon="pi pi-trash" label="Borrar seleccion" severity="danger" outlined @click="borrarSeleccionados" />
            <Button
              v-if="datosEmpresa.usuario.nivel_seguridad == 'Soporte'"
              icon="pi pi-times"
              label="Borrar todo"
              severity="danger"
              @click="borrarTodo"
            />
          </div>
        </div>

        <div class="panel__body">
          <div class="filter-bar">
            <div class="filter-bar__group">
              <label class="filter-label">Estado</label>
              <Dropdown
                v-model="filtroEstado"
                :options="estadosDisponibles"
                placeholder="Todos"
                showClear
                class="w-40"
              />
            </div>
            <div class="filter-bar__group">
              <label class="filter-label">Tipo</label>
              <Dropdown
                v-model="filtroTipo"
                :options="tiposNomina"
                placeholder="Todos"
                showClear
                class="w-44"
              />
            </div>
            <div class="filter-bar__input">
              <i class="pi pi-search"></i>
              <input v-model="searchQuery" placeholder="Buscar nómina..." type="text" />
            </div>
          </div>

          <!-- Grupos de nóminas activas -->
          <div class="grupos-panel" v-if="gruposNominaActivas.length > 0">
            <div class="grupos-header">
              <i class="pi pi-objects-column"></i>
              <span>N&oacute;minas Activas por Grupo</span>
            </div>
            <div class="grupos-list">
              <div
                v-for="grupo in gruposNominaActivas"
                :key="grupo.no_nomina"
                class="grupo-chip"
                :class="{ 'grupo-chip--activo': grupoSeleccionado === grupo.no_nomina }"
                @click="seleccionarGrupo(grupo.no_nomina)"
              >
                <span class="grupo-chip__numero">{{ grupo.no_nomina }}</span>
                <span class="grupo-chip__count">{{ grupo.empleados.length }} emp.</span>
                <span class="grupo-chip__total">RD$ {{ grupo.total_sueldo.toFixed(2) }}</span>
                <i v-if="grupoSeleccionado === grupo.no_nomina" class="pi pi-check-circle grupo-chip__check"></i>
              </div>
            </div>
          </div>

          <DataTable
            class="nomina-table"
            :value="filteredNomina"
            scrollable
            scrollHeight="600px"
            dataKey="id"
            paginator
            :rows="10"
            size="small"
            resizableColumns
            columnResizeMode="fit"
            v-model:selection="selectedItems"
            @rowSelect="onRowSelect"
            selectionMode="multiple"
            :rowsPerPageOptions="[5, 10, 20, 50]"
            rowHover
            tableStyle="min-width: 50rem"
          >
            <template #header>
              <div class="table-header">
                <div>
                  <h3>Listado de nóminas</h3>
                  <p class="helper-text">Selecciona filas para acciones múltiples.</p>
                </div>
              </div>
            </template>
            <Column selectionMode="multiple" headerStyle="width: 3rem">
              <template #body="{ data }">
                <div @click.stop>
                  <Checkbox v-model="selectedItems" :value="data" />
                </div>
              </template>
            </Column>

            <Column header="Opciones">
              <template #body="slotProps">
                <Button
                  icon="pi pi-cog"
                  severity="secondary"
                  text
                  rounded
                  @click="toggleNomina($event, slotProps.data)"
                  aria-haspopup="true"
                  aria-controls="overlay_menu_nomina"
                />
                <Menu
                  ref="menu"
                  id="overlay_menu_nomina"
                  :model="itemsNomina"
                  :popup="true"
                />
              </template>
            </Column>
            <Column field="no_nomina" header="No nómina"></Column>
            <Column field="fecha_inicio" header="Fecha inicio"></Column>
            <Column field="fecha_final" header="Fecha final"></Column>
            <Column field="estado" header="Estado">
              <template #body="slotProps">
                <Badge :value="slotProps.data.estado" :severity="colorEstado(slotProps.data)" />
              </template>
            </Column>
            <Column field="cedula" header="Cédula"></Column>
            <Column field="tipo_nomina" header="Tipo" :style="{ minWidth: '100px' }">
              <template #body="slotProps">
                <Tag v-if="slotProps.data.tipo_nomina" :value="slotProps.data.tipo_nomina" :style="{ background: colorTipo(slotProps.data.tipo_nomina) + '20', color: colorTipo(slotProps.data.tipo_nomina), borderColor: colorTipo(slotProps.data.tipo_nomina) + '40', fontWeight: '600' }" style="font-size:0.7rem" />
                <span v-else class="text-gray-400 text-sm">—</span>
              </template>
            </Column>
            <Column field="nombre" header="Nombre"></Column>
            <Column field="cargo" header="Cargo"></Column>
            <Column field="sueldo" header="Sueldo">
              <template #body="slotProps">RD$ {{ parseFloat(slotProps.data.sueldo || 0).toLocaleString('es-DO', { minimumFractionDigits: 2 }) }}</template>
            </Column>
            <Column field="total_deducciones" header="Deducciones">
              <template #body="slotProps"><span class="text-red-600">RD$ {{ parseFloat(slotProps.data.total_deducciones || 0).toLocaleString('es-DO', { minimumFractionDigits: 2 }) }}</span></template>
            </Column>
            <Column field="total_neto_pagar" header="Neto a Pagar">
              <template #body="slotProps"><span class="font-bold text-green-700">RD$ {{ parseFloat(slotProps.data.total_neto_pagar || 0).toLocaleString('es-DO', { minimumFractionDigits: 2 }) }}</span></template>
            </Column>
            <Column field="asiento_id" header="Asiento" :style="{ minWidth: '120px' }">
              <template #body="slotProps">
                <Tag v-if="slotProps.data.asiento_id" :value="slotProps.data.asiento_id" severity="info" style="font-size:0.75rem" />
                <span v-else class="text-gray-400 text-sm">—</span>
              </template>
            </Column>
          </DataTable>
        </div>
      </section>

      <Toast />
    </div>
  </main>

  <Dialog v-model:visible="ajusteGlobalDialogVisible" modal :closable="true" :style="{ width: '500px' }" :breakpoints="{ '640px': '95vw' }">
    <template #header>
      <div class="flex items-center gap-3">
        <div class="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center">
          <i class="pi pi-sliders-v text-indigo-600 text-2xl"></i>
        </div>
        <div>
          <h2 class="text-xl font-bold text-gray-800">Ajuste Global</h2>
          <p class="text-sm text-gray-500">Aplica un ingreso o deducci&oacute;n a toda la n&oacute;mina</p>
        </div>
      </div>
    </template>

    <div class="space-y-4 p-2">
      <p class="text-gray-600">El ajuste se aplicar&aacute; &uacute;nicamente a los <strong>{{ selectedItems.length }} registro(s)</strong> seleccionados.</p>

      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
        <SelectButton v-model="ajusteGlobalForm.tipo" :options="['INGRESO', 'DEDUCCION']" fluid />
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Concepto</label>
        <InputText v-model="ajusteGlobalForm.concepto" placeholder="Ej: Bono extra, Descuento global" fluid />
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Monto (RD$)</label>
        <InputText type="number" v-model="ajusteGlobalForm.monto" placeholder="0.00" fluid />
      </div>
    </div>

    <template #footer>
      <div class="flex gap-2 justify-end">
        <Button label="Cancelar" severity="secondary" outlined @click="ajusteGlobalDialogVisible = false" />
        <Button label="Aplicar Ajuste" icon="pi pi-check" @click="confirmarAjusteGlobal" />
      </div>
    </template>
  </Dialog>

  <Dialog v-model:visible="pagarSeleccionDialogVisible" modal :closable="true" :style="{ width: '560px' }" :breakpoints="{ '640px': '95vw' }">
    <template #header>
      <div class="flex items-center gap-3">
        <div class="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
          <i class="pi pi-dollar text-green-600 text-2xl"></i>
        </div>
        <div>
          <h2 class="text-xl font-bold text-gray-800">Pagar N&oacute;minas Seleccionadas</h2>
          <p class="text-sm text-gray-500">{{ selectedItems.length }} registro(s) ser&aacute;n pagados</p>
        </div>
      </div>
    </template>

    <div class="space-y-4 p-2">
      <div class="bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-800">
        <p><strong>Registros a pagar:</strong> {{ selectedItems.length }}</p>
        <p><strong>Total neto:</strong> RD$ {{ totalNetoSeleccion.toFixed(2) }}</p>
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Cuenta de Gasto (Débito) *</label>
        <small class="text-gray-500 block mb-1">Cuenta donde se registrará el gasto por sueldos</small>
        <Select v-model="cuentaGastoSeleccionada" :options="cuentasList" optionLabel="nombre" placeholder="Seleccione cuenta de gasto..." filter fluid>
          <template #option="slotProps">
            <div class="flex items-center gap-2">
              <span>{{ slotProps.option.nombre }}</span>
              <Tag :value="slotProps.option.categoria" severity="info" />
            </div>
          </template>
        </Select>
      </div>

      <div>
        <div class="flex items-center justify-between mb-1">
          <label class="block text-sm font-medium text-gray-700">Cuentas de Pago (Crédito) *</label>
          <div class="flex gap-1">
            <Button icon="pi pi-equals" severity="secondary" text rounded @click="distribuirMonto" v-tooltip.top="'Distribuir monto equitativamente'" />
            <Button icon="pi pi-plus" severity="info" text rounded @click="agregarLineaCredito" v-tooltip.top="'Agregar otra cuenta de crédito'" />
          </div>
        </div>
        <small class="text-gray-500 block mb-1">Banco(s) o caja(s) de donde saldrá el dinero</small>

        <div v-for="(linea, index) in cuentasCredito" :key="index" class="flex items-center gap-2 mb-2">
          <Select v-model="linea.cuenta" :options="cuentasList" optionLabel="nombre" placeholder="Seleccione cuenta..." filter class="flex-1">
            <template #option="slotProps">
              <div class="flex items-center gap-2">
                <span>{{ slotProps.option.nombre }}</span>
                <Tag :value="slotProps.option.categoria" severity="info" />
              </div>
            </template>
          </Select>
          <InputNumber v-model="linea.monto" mode="currency" currency="DOP" locale="es-DO" placeholder="Monto" class="w-36" :min="0" :max="totalNetoSeleccion" />
          <Button v-if="cuentasCredito.length > 1" icon="pi pi-trash" severity="danger" text rounded @click="eliminarLineaCredito(index)" />
        </div>

        <div class="flex items-center justify-between text-sm px-1">
          <span class="text-gray-500">Total asignado:</span>
          <span class="font-bold" :class="creditoValido ? 'text-green-600' : 'text-red-600'">RD$ {{ totalCredito.toFixed(2) }} / RD$ {{ totalNetoSeleccion.toFixed(2) }}</span>
        </div>
      </div>

      <div class="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
        <p class="font-semibold mb-1"><i class="pi pi-info-circle mr-1"></i>Asiento contable que se generará:</p>
        <p v-if="cuentaGastoSeleccionada && creditosValidos.length > 0">
          Débito: <strong>{{ cuentaGastoSeleccionada.nombre }}</strong> por el total bruto<br/>
          <template v-for="(l, i) in creditosValidos" :key="i">
            Crédito: <strong>{{ l.cuenta.nombre }}</strong> por RD$ {{ parseFloat(l.monto).toFixed(2) }}<br/>
          </template>
          <span class="text-blue-600">+ Retenciones (AFP, SFS, ISR) a cuentas de pasivo</span>
        </p>
        <p v-else class="text-blue-400">Seleccione las cuentas para ver el detalle</p>
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">M&eacute;todo de Pago</label>
        <SelectButton v-model="metodoPagoSeleccion" :options="['EFECTIVO', 'TRANSFERENCIA', 'TARJETA']" fluid />
      </div>
    </div>

    <template #footer>
      <div class="flex gap-2 justify-end">
        <Button label="Cancelar" severity="secondary" outlined @click="pagarSeleccionDialogVisible = false" />
        <Button label="Confirmar Pago y Contabilizar" icon="pi pi-check" severity="success" @click="confirmarPagarSeleccion" :disabled="!cuentaGastoSeleccionada || !creditoValido" />
      </div>
    </template>
  </Dialog>

  <Dialog v-model:visible="crearExpressDialogVisible" modal :closable="true" :style="{ width: '600px' }" :breakpoints="{ '640px': '95vw' }">
    <template #header>
      <div class="flex items-center gap-3">
        <div class="w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center">
          <i class="pi pi-bolt text-yellow-600 text-2xl"></i>
        </div>
        <div>
          <h2 class="text-xl font-bold text-gray-800">Crear N&oacute;minas Express</h2>
          <p class="text-sm text-gray-500">Selecciona empleados activos y define el periodo.</p>
        </div>
      </div>
    </template>

    <div class="space-y-4 p-2">
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Tipo de Nómina</label>
        <SelectButton v-model="expressTipo" :options="tiposNomina" fluid :allowEmpty="false" />
      </div>
      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Fecha inicio</label>
          <flat-pickr v-model="expressFechaI" class="form-input w-full p-inputtext p-component p-filled p-inputtext-fluid" :config="basic" />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Fecha final</label>
          <flat-pickr v-model="expressFechaF" class="form-input w-full p-inputtext p-component p-filled p-inputtext-fluid" :config="basic" />
        </div>
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Empleados</label>
        <small class="text-gray-500 block mb-1">Selecciona uno o varios empleados activos. Se usar&aacute; su sueldo base como salario de n&oacute;mina.</small>
        <MultiSelect
          v-model="empleadosSeleccionados"
          :options="empleadosList"
          optionLabel="nombre"
          filter
          display="chip"
          placeholder="Buscar y seleccionar empleados..."
          class="w-full"
        >
          <template #option="slotProps">
            <div class="flex items-center gap-3 p-1">
              <i class="pi pi-user text-gray-400"></i>
              <div class="flex flex-col">
                <span class="font-semibold">{{ slotProps.option.nombre }}</span>
                <span class="text-xs text-gray-500">{{ slotProps.option.cargo || 'Sin cargo' }} — RD$ {{ parseFloat(slotProps.option.sueldo_base || 0).toFixed(2) }}</span>
              </div>
            </div>
          </template>
          <template #chip="slotProps">
            <div class="flex items-center gap-1">
              <span>{{ slotProps.value.nombre }}</span>
              <span class="text-xs text-gray-400">(RD$ {{ parseFloat(slotProps.value.sueldo_base || 0).toFixed(2) }})</span>
            </div>
          </template>
        </MultiSelect>
      </div>

      <div class="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
        <p><strong>Resumen:</strong> Se crear&aacute;n <strong>{{ empleadosSeleccionados.length }}</strong> n&oacute;mina(s) con un No. de grupo &uacute;nico. Sueldo total del grupo: RD$ {{ empleadosSeleccionados.reduce((s, e) => s + parseFloat(e.sueldo_base || 0), 0).toFixed(2) }}</p>
      </div>
    </div>

    <template #footer>
      <div class="flex gap-2 justify-end">
        <Button label="Cancelar" severity="secondary" outlined @click="crearExpressDialogVisible = false" />
        <Button label="Crear Nóminas" icon="pi pi-check" severity="warning" @click="confirmarCrearExpress" :disabled="empleadosSeleccionados.length === 0" />
      </div>
    </template>
  </Dialog>
</template>
<style scoped>
.nomina-wrapper {
  min-height: 100vh;
  background: linear-gradient(180deg, #f8fafc 0%, #eef2ff 45%, #ffffff 100%);
  color: #0f172a;
}

.nomina-hero {
  background: linear-gradient(135deg, #0f172a, #1e293b 45%, #0ea5e9);
  color: #e2e8f0;
  border-radius: 18px;
  padding: 24px;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 20px;
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.nomina-hero__text h1 {
  margin: 4px 0 8px;
  font-size: 1.8rem;
  font-weight: 800;
}

.nomina-hero__text p {
  margin: 0;
  color: #cbd5e1;
}

.nomina-hero__meta {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  margin-top: 12px;
}

.meta-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: rgba(226, 232, 240, 0.12);
  color: #e2e8f0;
  padding: 8px 12px;
  border-radius: 9999px;
  font-size: 0.9rem;
  border: 1px solid rgba(226, 232, 240, 0.2);
}

.nomina-hero__stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 12px;
  align-items: center;
}

.stat-card {
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 14px;
  padding: 14px;
  color: #e2e8f0;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.18);
}

.stat-card.alt {
  background: rgba(14, 165, 233, 0.16);
}

.stat-card .label {
  display: block;
  font-size: 0.85rem;
  color: #cbd5e1;
}

.stat-card .value {
  font-size: 1.6rem;
  font-weight: 800;
}

.panel {
  background: #ffffff;
  border-radius: 14px;
  border: 1px solid #e2e8f0;
  padding: 20px;
}

.panel__header {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: flex-start;
  flex-wrap: wrap;
  border-bottom: 1px solid #e2e8f0;
  padding-bottom: 14px;
}

.panel__header h2 {
  margin: 2px 0 4px;
  font-size: 1.4rem;
  color: #0f172a;
}

.helper-text {
  color: #64748b;
  font-size: 0.95rem;
}

.eyebrow {
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-weight: 700;
  color: #0ea5e9;
  margin: 0;
  font-size: 0.85rem;
}

.actions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(170px, 1fr));
  gap: 10px;
  width: 100%;
  max-width: 840px;
}

:deep(.actions-grid .p-button) {
  width: 100%;
}

.panel__body {
  margin-top: 18px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.filter-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.filter-bar__group {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.filter-label {
  font-size: 0.9rem;
  color: #475569;
  font-weight: 600;
}

.filter-bar__input {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  background: #f8fafc;
  min-width: 260px;
}

.filter-bar__input input {
  border: none;
  outline: none;
  background: transparent;
  width: 100%;
  color: #0f172a;
}

.filter-bar__input input::placeholder {
  color: #94a3b8;
}

.nomina-table {
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 12px 30px rgba(15, 23, 42, 0.06);
}

:deep(.nomina-table .p-datatable-header) {
  background: #f8fafc;
  border: 0;
  padding: 16px;
}

.table-header h3 {
  margin: 0;
  color: #0f172a;
}

:deep(.nomina-table .p-datatable-thead > tr > th) {
  background: #e2e8f0;
  color: #0f172a;
  font-weight: 700;
  border: 0;
  padding: 14px 12px;
}

:deep(.nomina-table .p-datatable-tbody > tr > td) {
  padding: 12px 12px;
  border: 0;
  color: #1f2937;
  font-size: 0.95rem;
}

:deep(.nomina-table .p-datatable-tbody > tr:hover) {
  background: #ecfeff;
}

:deep(.nomina-table .p-paginator) {
  border-top: 1px solid #e2e8f0;
  padding: 10px;
}

@media (max-width: 768px) {
  .nomina-hero {
    padding: 18px;
  }

  .panel {
    padding: 16px;
  }

  .actions-grid {
    grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  }

  .grupos-list {
    flex-wrap: wrap;
  }
}

/* Grupos panel */
.grupos-panel {
  background: #f1f5f9;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 12px 14px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.grupos-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.85rem;
  font-weight: 700;
  color: #0f172a;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.grupos-list {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  padding-bottom: 4px;
}

.grupo-chip {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #ffffff;
  border: 1.5px solid #cbd5e1;
  border-radius: 9999px;
  padding: 6px 14px;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
  font-size: 0.85rem;
}

.grupo-chip:hover {
  border-color: #14b8a6;
  background: #ecfeff;
}

.grupo-chip--activo {
  border-color: #0d9488;
  background: #ccfbf1;
  box-shadow: 0 0 0 2px rgba(13, 148, 136, 0.2);
}

.grupo-chip__numero {
  font-weight: 700;
  color: #0f172a;
}

.grupo-chip__count {
  color: #64748b;
  font-size: 0.8rem;
}

.grupo-chip__total {
  color: #059669;
  font-weight: 600;
  font-size: 0.8rem;
}

.grupo-chip__check {
  color: #0d9488;
  font-size: 1rem;
}
</style>
