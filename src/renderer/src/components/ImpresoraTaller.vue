<script setup>
import { ref, computed, watch } from 'vue';
import { nfecha, enviarDatosLocalStorage } from '@/funciones/funciones.js';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

// Verificar si estamos en Electron
const isElectron = typeof window !== 'undefined' && window.electron;

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  ordenData: {
    type: Object,
    required: false,
    default: () => ({
      no_factura: '',
      nombre: '',
      cedula: '',
      telefono: '',
      email: '',
      equipo: '',
      marca: '',
      modelo: '',
      imei: '',
      serial: '',
      clave: '',
      fallas: [],
      accesorios: [],
      tecnico: '',
      estado: '',
      fecha_entrada: '',
      fecha_entrega: '',
      usuario: '',
      manodeobra: 0,
      preciopiezas: 0,
      total: 0,
      abono: [],
      saldo: 0,
      observaciones: ''
    })
  },
  empresaData: {
    type: Object,
    required: false,
    default: () => ({
      nombre: '',
      direccion: '',
      telefono: '',
      rnc: '',
      email: ''
    })
  },
  formatoImpresion: {
    type: String,
    default: '80mm',
    validator: (value) => ['80mm', 'carta'].includes(value)
  }
});

const emit = defineEmits(['close', 'update:visible']);

const localVisible = ref(false);
const formatoSeleccionado = ref(props.formatoImpresion);
const pdfUrl = ref('');
const pdfDialogVisible = ref(false);

watch(() => props.visible, (newVal) => {
  localVisible.value = newVal;
});

watch(localVisible, (newVal) => {
  if (!newVal) {
    emit('update:visible', false);
    emit('close');
  }
});

// Parsear fallas
const fallas = computed(() => {
  try {
    if (typeof props.ordenData?.fallas === 'string') {
      return JSON.parse(props.ordenData.fallas);
    }
    return props.ordenData?.fallas || [];
  } catch (error) {
    return [];
  }
});

// Parsear accesorios
const accesorios = computed(() => {
  try {
    if (typeof props.ordenData?.accesorios === 'string') {
      return JSON.parse(props.ordenData.accesorios);
    }
    return props.ordenData?.accesorios || [];
  } catch (error) {
    return [];
  }
});

// Parsear abonos
const abonos = computed(() => {
  try {
    if (typeof props.ordenData?.abono === 'string') {
      return JSON.parse(props.ordenData.abono);
    }
    return props.ordenData?.abono || [];
  } catch (error) {
    return [];
  }
});

const totalAbonos = computed(() => {
  return abonos.value.reduce((sum, abono) => sum + parseFloat(abono.abono || 0), 0);
});

const cerrar = () => {
  localVisible.value = false;
};

const cambiarFormato = (formato) => {
  formatoSeleccionado.value = formato;
};

const imprimirDirecto = async () => {
  // Validar que haya datos antes de imprimir
  if (!props.ordenData || !props.ordenData.no_factura) {
    console.error('No hay datos de orden para imprimir');
    return;
  }

  // Verificar si Electron está disponible
  if (!isElectron) {
    console.error('Electron no está disponible. Use "Generar PDF" en su lugar.');
    return;
  }

  try {
    // Obtener TODOS los datos del localStorage usando la función correcta
    const datosEmpresaCompleto = enviarDatosLocalStorage();
    const datosEmpresaJSON = JSON.stringify(datosEmpresaCompleto);

    // Convertir los datos de la orden a string
    const datosOrdenJSON = JSON.stringify(props.ordenData);

    // Llamar a la función de impresión térmica de Electron
    const respuesta = await window.electron.ipcRenderer.invoke(
      'recibotaller',
      datosOrdenJSON,
      datosEmpresaJSON,
      true,  // silent
      false, // visible
      false  // show
    );

    if (!respuesta?.success) {
      throw new Error(respuesta?.error || 'No se pudo imprimir el ticket');
    }

    console.log('✅ Impresión enviada correctamente a la impresora térmica');

    // Cerrar el modal después de enviar a imprimir
    localVisible.value = false;
  } catch (error) {
    console.error('❌ Error al imprimir con Electron:', error);
    alert('Error al imprimir: ' + error.message);
  }
};

const generarPDF = () => {
  // Validar que haya datos antes de generar
  if (!props.ordenData || !props.ordenData.no_factura) {
    console.error('No hay datos de orden para generar el PDF');
    return;
  }

  if (formatoSeleccionado.value === '80mm') {
    generarPDF80mm();
  } else {
    generarPDFCarta();
  }
};

// Generar PDF formato 80mm (Térmico)
const generarPDF80mm = () => {
  // Valores por defecto seguros
  const orden = props.ordenData || {};
  const empresa = props.empresaData || {};

  const doc = new jsPDF({
    unit: 'mm',
    format: [80, 297],
    orientation: 'portrait'
  });

  const pageWidth = 80;
  const margin = 5;
  const contentWidth = pageWidth - (margin * 2);
  let currentY = margin;

  // Función auxiliar para agregar texto centrado
  const addCenteredText = (text, y, fontSize = 10, isBold = false) => {
    doc.setFontSize(fontSize);
    doc.setFont('helvetica', isBold ? 'bold' : 'normal');
    const textWidth = doc.getTextWidth(text);
    const x = (pageWidth - textWidth) / 2;
    doc.text(text, x, y);
  };

  // Función para agregar línea separadora
  const addDivider = (y, isDashed = true) => {
    if (isDashed) {
      doc.setLineDash([2, 2]);
    } else {
      doc.setLineDash([]);
    }
    doc.line(margin, y, pageWidth - margin, y);
    doc.setLineDash([]);
  };

  // Encabezado - Nombre de la empresa
  addCenteredText((empresa.nombre || 'EMPRESA').toUpperCase(), currentY + 5, 14, true);
  currentY += 10;

  // Información de la empresa
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  const empresaInfo = [
    empresa.direccion || '',
    `Tel: ${empresa.telefono || ''}`,
    `RNC: ${empresa.rnc || ''}`
  ];
  empresaInfo.forEach(info => {
    addCenteredText(info, currentY, 9);
    currentY += 4;
  });

  currentY += 2;
  addDivider(currentY);
  currentY += 5;

  // Título del documento
  addCenteredText('ORDEN DE REPARACIÓN', currentY, 12, true);
  currentY += 6;
  addCenteredText(`No. ${orden.no_factura || ''}`, currentY, 11, true);
  currentY += 5;

  addDivider(currentY);
  currentY += 5;

  // Información del cliente - Con borde
  const clienteY = currentY;
  doc.setDrawColor(0);
  doc.rect(margin, clienteY, contentWidth, 25, 'S');
  currentY += 4;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('CLIENTE:', margin + 2, currentY);
  doc.setFont('helvetica', 'normal');
  const clienteTexto = doc.splitTextToSize(orden.nombre || 'N/A', contentWidth - 4);
  doc.text(clienteTexto, margin + 2, currentY + 4);
  currentY += 4 + (clienteTexto.length * 4);

  if (orden.cedula) {
    doc.setFont('helvetica', 'bold');
    doc.text('CÉDULA:', margin + 2, currentY);
    doc.setFont('helvetica', 'normal');
    doc.text(orden.cedula, margin + 2, currentY + 4);
    currentY += 4;
  }

  if (orden.telefono) {
    doc.setFont('helvetica', 'bold');
    doc.text('TELÉFONO:', margin + 2, currentY);
    doc.setFont('helvetica', 'normal');
    doc.text(orden.telefono, margin + 2, currentY + 4);
    currentY += 4;
  }

  currentY = clienteY + 28;
  addDivider(currentY);
  currentY += 5;

  // Datos del equipo
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('DATOS DEL EQUIPO', margin, currentY);
  currentY += 5;
  addDivider(currentY, false);
  currentY += 4;

  doc.setFontSize(9);
  const equipoInfo = [
    { label: 'Equipo:', value: orden.equipo },
    { label: 'Marca:', value: orden.marca },
    { label: 'Modelo:', value: orden.modelo }
  ];

  if (orden.imei) equipoInfo.push({ label: 'IMEI:', value: orden.imei });
  if (orden.serial) equipoInfo.push({ label: 'Serial:', value: orden.serial });
  if (orden.clave) equipoInfo.push({ label: 'Clave:', value: orden.clave });

  equipoInfo.forEach(info => {
    doc.setFont('helvetica', 'bold');
    doc.text(info.label, margin, currentY);
    doc.setFont('helvetica', 'normal');
    const valueText = doc.splitTextToSize(info.value, contentWidth - 20);
    doc.text(valueText, margin + 18, currentY);
    currentY += 4 * valueText.length;
  });

  currentY += 1;
  addDivider(currentY);
  currentY += 5;

  // Fallas reportadas
  if (fallas.value.length > 0) {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('FALLAS REPORTADAS', margin, currentY);
    currentY += 5;
    addDivider(currentY, false);
    currentY += 4;

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    fallas.value.forEach((falla, index) => {
      const fallaText = `• ${falla.propiedad || falla}`;
      const lines = doc.splitTextToSize(fallaText, contentWidth - 2);
      lines.forEach(line => {
        doc.text(line, margin + 1, currentY);
        currentY += 3.5;
      });
    });

    currentY += 1;
  }

  // Accesorios
  if (accesorios.value.length > 0) {
    addDivider(currentY);
    currentY += 5;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('ACCESORIOS ENTREGADOS', margin, currentY);
    currentY += 5;
    addDivider(currentY, false);
    currentY += 4;

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    accesorios.value.forEach(accesorio => {
      const accesorioText = `• ${accesorio.propiedad || accesorio}`;
      const lines = doc.splitTextToSize(accesorioText, contentWidth - 2);
      lines.forEach(line => {
        doc.text(line, margin + 1, currentY);
        currentY += 3.5;
      });
    });

    currentY += 1;
  }

  addDivider(currentY);
  currentY += 5;

  // Información de servicio
  doc.setFontSize(9);
  const servicioInfo = [
    { label: 'Técnico:', value: orden.tecnico },
    { label: 'Estado:', value: orden.estado },
    { label: 'Fecha Entrada:', value: orden.fecha_entrada },
    { label: 'Fecha Entrega:', value: orden.fecha_entrega }
  ];

  servicioInfo.forEach(info => {
    doc.setFont('helvetica', 'bold');
    doc.text(info.label, margin, currentY);
    doc.setFont('helvetica', 'normal');
    doc.text(info.value, margin + 25, currentY);
    currentY += 4;
  });

  currentY += 1;
  addDivider(currentY);
  currentY += 5;

  // Detalle de costos
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('DETALLE DE COSTOS', margin, currentY);
  currentY += 5;
  addDivider(currentY, false);
  currentY += 4;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('Mano de Obra:', margin, currentY);
  doc.text(`RD$${parseFloat(orden.manodeobra || 0).toFixed(2)}`, pageWidth - margin, currentY, { align: 'right' });
  currentY += 4;

  doc.text('Piezas:', margin, currentY);
  doc.text(`RD$${parseFloat(orden.preciopiezas || 0).toFixed(2)}`, pageWidth - margin, currentY, { align: 'right' });
  currentY += 5;

  addDivider(currentY, false);
  currentY += 4;

  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('TOTAL:', margin, currentY);
  doc.text(`RD$${parseFloat(orden.total || 0).toFixed(2)}`, pageWidth - margin, currentY, { align: 'right' });
  currentY += 5;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(22, 163, 74);
  doc.text('Abonado:', margin, currentY);
  doc.text(`RD$${totalAbonos.value.toFixed(2)}`, pageWidth - margin, currentY, { align: 'right' });
  currentY += 5;

  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(220, 38, 38);
  doc.text('SALDO:', margin, currentY);
  doc.text(`RD$${parseFloat(orden.saldo || 0).toFixed(2)}`, pageWidth - margin, currentY, { align: 'right' });
  doc.setTextColor(0);
  currentY += 5;

  // Observaciones
  if (orden.observaciones) {
    addDivider(currentY);
    currentY += 5;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('OBSERVACIONES', margin, currentY);
    currentY += 5;
    addDivider(currentY, false);
    currentY += 4;

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    const obsLines = doc.splitTextToSize(orden.observaciones, contentWidth);
    obsLines.forEach(line => {
      doc.text(line, margin, currentY);
      currentY += 3.5;
    });

    currentY += 2;
  }

  addDivider(currentY);
  currentY += 5;

  // Términos y condiciones
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('TÉRMINOS Y CONDICIONES', margin, currentY);
  currentY += 4;

  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  const terminos = [
    '• El cliente es responsable de retirar el equipo en la fecha acordada.',
    '• Después de 30 días, se cobrará almacenaje.',
    '• No nos hacemos responsables por equipos no reclamados en 90 días.',
    '• La garantía es de 30 días solo por la reparación realizada.',
    '• No se aceptan devoluciones de abonos.'
  ];

  terminos.forEach(termino => {
    const lines = doc.splitTextToSize(termino, contentWidth);
    lines.forEach(line => {
      doc.text(line, margin, currentY);
      currentY += 3;
    });
  });

  currentY += 3;
  addDivider(currentY);
  currentY += 8;

  // Firma
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.line(margin + 10, currentY, pageWidth - margin - 10, currentY);
  currentY += 4;
  addCenteredText('Firma del Cliente', currentY, 9, true);
  currentY += 8;
  addCenteredText(`${nfecha('fecha')} - ${nfecha('hora')}`, currentY, 8);
  currentY += 8;

  // Footer
  addCenteredText('¡Gracias por su preferencia!', currentY, 10, true);
  currentY += 4;
  addCenteredText('Conserve este recibo para retirar su equipo', currentY, 8);

  // Mostrar PDF
  const pdfBlob = doc.output('blob');
  const url = URL.createObjectURL(pdfBlob);
  pdfUrl.value = url;
  pdfDialogVisible.value = true;
  localVisible.value = false;
};

// Generar PDF formato Carta
const generarPDFCarta = () => {
  // Valores por defecto seguros
  const orden = props.ordenData || {};
  const empresa = props.empresaData || {};

  const doc = new jsPDF({
    unit: 'mm',
    format: 'letter',
    orientation: 'portrait'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - (margin * 2);
  let currentY = margin;

  // Encabezado con logo/nombre de empresa
  doc.setFillColor(52, 152, 219);
  doc.rect(0, 0, pageWidth, 50, 'F');

  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text(empresa.nombre, margin, 20);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(empresa.direccion, margin, 28);
  doc.text(`Tel: ${empresa.telefono} | RNC: ${empresa.rnc}`, margin, 34);
  if (empresa.email) {
    doc.text(`Email: ${empresa.email}`, margin, 40);
  }

  // Badge de ORDEN DE REPARACIÓN
  doc.setFillColor(41, 128, 185);
  doc.roundedRect(pageWidth - 70, 10, 50, 25, 3, 3, 'F');
  doc.setFontSize(8);
  doc.setTextColor(255, 255, 255);
  doc.text('ORDEN DE REPARACIÓN', pageWidth - 65, 18);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(`#${orden.no_factura}`, pageWidth - 65, 28);

  // Estado badge
  const estadoColors = {
    'EN REVISION': [255, 243, 205],
    'REPARADO': [209, 236, 241],
    'ENTREGADO': [212, 237, 218],
    'PENDIENTE': [248, 215, 218]
  };
  const estadoColor = estadoColors[orden.estado.toUpperCase()] || [236, 240, 241];

  doc.setFillColor(...estadoColor);
  doc.roundedRect(pageWidth - 70, 37, 50, 8, 2, 2, 'F');
  doc.setFontSize(9);
  doc.setTextColor(0);
  doc.setFont('helvetica', 'bold');
  doc.text(orden.estado, pageWidth - 67, 42);

  currentY = 60;
  doc.setTextColor(0);

  // Información del cliente y servicio en dos columnas
  const infoY = currentY;

  // Columna izquierda - Cliente
  doc.setFillColor(248, 249, 250);
  doc.rect(margin, infoY, (contentWidth / 2) - 5, 40, 'F');
  doc.setDrawColor(52, 152, 219);
  doc.setLineWidth(1);
  doc.line(margin, infoY, margin, infoY + 40);

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Información del Cliente', margin + 5, infoY + 7);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  let leftY = infoY + 14;

  const clienteInfo = [
    { label: 'Nombre:', value: orden.nombre },
    { label: 'Cédula:', value: orden.cedula },
    { label: 'Teléfono:', value: orden.telefono },
    { label: 'Email:', value: orden.email }
  ];

  clienteInfo.forEach(info => {
    if (info.value) {
      doc.setFont('helvetica', 'bold');
      doc.text(info.label, margin + 5, leftY);
      doc.setFont('helvetica', 'normal');
      doc.text(info.value, margin + 25, leftY);
      leftY += 6;
    }
  });

  // Columna derecha - Servicio
  doc.setFillColor(248, 249, 250);
  doc.rect(margin + (contentWidth / 2) + 5, infoY, (contentWidth / 2) - 5, 40, 'F');
  doc.setDrawColor(52, 152, 219);
  doc.line(margin + (contentWidth / 2) + 5, infoY, margin + (contentWidth / 2) + 5, infoY + 40);

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Información de Servicio', margin + (contentWidth / 2) + 10, infoY + 7);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  let rightY = infoY + 14;

  const servicioInfo = [
    { label: 'Fecha Entrada:', value: orden.fecha_entrada },
    { label: 'Fecha Entrega:', value: orden.fecha_entrega },
    { label: 'Técnico:', value: orden.tecnico },
    { label: 'Usuario:', value: orden.usuario }
  ];

  servicioInfo.forEach(info => {
    doc.setFont('helvetica', 'bold');
    doc.text(info.label, margin + (contentWidth / 2) + 10, rightY);
    doc.setFont('helvetica', 'normal');
    doc.text(info.value, margin + (contentWidth / 2) + 35, rightY);
    rightY += 6;
  });

  currentY = infoY + 50;

  // Datos del equipo
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Datos del Equipo', margin, currentY);
  currentY += 2;
  doc.setDrawColor(236, 240, 241);
  doc.setLineWidth(0.5);
  doc.line(margin, currentY, pageWidth - margin, currentY);
  currentY += 8;

  doc.setFillColor(248, 249, 250);
  doc.rect(margin, currentY, contentWidth, 25, 'F');

  const equipoData = [
    { label: 'Equipo:', value: orden.equipo },
    { label: 'Marca:', value: orden.marca },
    { label: 'Modelo:', value: orden.modelo },
    { label: 'IMEI:', value: orden.imei },
    { label: 'Serial:', value: orden.serial },
    { label: 'Clave:', value: orden.clave }
  ].filter(item => item.value);

  doc.setFontSize(9);
  let equipoX = margin + 5;
  let equipoY = currentY + 6;
  let colCount = 0;

  equipoData.forEach(item => {
    doc.setFont('helvetica', 'bold');
    doc.text(item.label, equipoX, equipoY);
    doc.setFont('helvetica', 'normal');
    doc.text(item.value, equipoX + 15, equipoY);

    colCount++;
    if (colCount === 3) {
      colCount = 0;
      equipoX = margin + 5;
      equipoY += 6;
    } else {
      equipoX += (contentWidth / 3);
    }
  });

  currentY += 35;

  // Fallas y Accesorios en dos columnas
  if (fallas.value.length > 0 || accesorios.value.length > 0) {
    const columnWidth = (contentWidth / 2) - 5;

    if (fallas.value.length > 0) {
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Fallas Reportadas', margin, currentY);
      currentY += 2;
      doc.line(margin, currentY, margin + columnWidth, currentY);
      currentY += 6;

      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      fallas.value.forEach(falla => {
        doc.setFillColor(248, 249, 250);
        doc.rect(margin, currentY - 4, columnWidth, 6, 'F');
        doc.setDrawColor(52, 152, 219);
        doc.line(margin, currentY - 4, margin, currentY + 2);
        doc.text(`${falla.propiedad || falla}`, margin + 3, currentY);
        currentY += 7;
      });
    }

    currentY = currentY - (fallas.value.length * 7) + 2;

    if (accesorios.value.length > 0) {
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Accesorios Entregados', margin + (contentWidth / 2) + 5, currentY);
      currentY += 2;
      doc.line(margin + (contentWidth / 2) + 5, currentY, pageWidth - margin, currentY);

      let accY = currentY + 6;
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      accesorios.value.forEach(accesorio => {
        doc.setFillColor(248, 249, 250);
        doc.rect(margin + (contentWidth / 2) + 5, accY - 4, columnWidth, 6, 'F');
        doc.setDrawColor(52, 152, 219);
        doc.line(margin + (contentWidth / 2) + 5, accY - 4, margin + (contentWidth / 2) + 5, accY + 2);
        doc.text(`${accesorio.propiedad || accesorio}`, margin + (contentWidth / 2) + 8, accY);
        accY += 7;
      });
    }

    currentY += Math.max(fallas.value.length, accesorios.value.length) * 7 + 10;
  }

  // Observaciones
  if (orden.observaciones) {
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Observaciones', margin, currentY);
    currentY += 2;
    doc.line(margin, currentY, pageWidth - margin, currentY);
    currentY += 6;

    doc.setFillColor(255, 251, 234);
    doc.setDrawColor(243, 156, 18);
    doc.setLineWidth(1);
    const obsHeight = 15;
    doc.rect(margin, currentY - 4, contentWidth, obsHeight, 'FD');

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    const obsLines = doc.splitTextToSize(orden.observaciones, contentWidth - 10);
    doc.text(obsLines, margin + 5, currentY);
    currentY += obsHeight + 10;
  }

  // Detalle de costos
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Detalle de Costos', margin, currentY);
  currentY += 2;
  doc.line(margin, currentY, pageWidth - margin, currentY);
  currentY += 8;

  // Tabla de costos
  const costosData = [
    ['Mano de Obra', `RD$${parseFloat(orden.manodeobra || 0).toFixed(2)}`],
    ['Costo de Piezas', `RD$${parseFloat(orden.preciopiezas || 0).toFixed(2)}`]
  ];

  doc.autoTable({
    startY: currentY,
    head: [['Concepto', 'Monto']],
    body: costosData,
    theme: 'grid',
    headStyles: { fillColor: [52, 73, 94], textColor: 255, fontSize: 10, fontStyle: 'bold' },
    bodyStyles: { fontSize: 9 },
    columnStyles: { 1: { halign: 'right' } },
    margin: { left: margin, right: margin }
  });

  currentY = doc.lastAutoTable.finalY + 5;

  // Total
  doc.setFillColor(236, 240, 241);
  doc.rect(margin, currentY, contentWidth, 10, 'F');
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('TOTAL', margin + 5, currentY + 7);
  doc.text(`RD$${parseFloat(orden.total || 0).toFixed(2)}`, pageWidth - margin - 5, currentY + 7, { align: 'right' });
  currentY += 12;

  // Abonado
  doc.setTextColor(22, 163, 74);
  doc.text('Abonado', margin + 5, currentY + 5);
  doc.text(`RD$${totalAbonos.value.toFixed(2)}`, pageWidth - margin - 5, currentY + 5, { align: 'right' });
  currentY += 8;

  // Saldo
  doc.setFillColor(255, 245, 245);
  doc.rect(margin, currentY, contentWidth, 10, 'F');
  doc.setFontSize(12);
  doc.setTextColor(220, 38, 38);
  doc.text('SALDO PENDIENTE', margin + 5, currentY + 7);
  doc.text(`RD$${parseFloat(orden.saldo || 0).toFixed(2)}`, pageWidth - margin - 5, currentY + 7, { align: 'right' });
  doc.setTextColor(0);
  currentY += 15;

  // Términos y condiciones
  doc.setFillColor(248, 249, 250);
  doc.rect(margin, currentY, contentWidth, 30, 'F');

  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Términos y Condiciones', margin + 5, currentY + 6);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  const terminos = [
    '• El cliente es responsable de retirar el equipo en la fecha acordada.',
    '• Después de 30 días, se cobrará almacenaje.',
    '• No nos hacemos responsables por equipos no reclamados en 90 días.',
    '• La garantía es de 30 días solo por la reparación realizada.',
    '• No se aceptan devoluciones de abonos.',
    '• Debe presentar este recibo y una identificación válida para retirar el equipo.'
  ];

  let terminosY = currentY + 12;
  const colWidth = contentWidth / 2;
  let col = 0;

  terminos.forEach((termino, index) => {
    const x = margin + 5 + (col * colWidth);
    doc.text(termino, x, terminosY);

    if (index % 3 === 2) {
      col++;
      terminosY = currentY + 12;
    } else {
      terminosY += 5;
    }
  });

  currentY += 40;

  // Firmas
  const firmaY = currentY;
  const firmaWidth = (contentWidth / 2) - 20;

  // Firma del cliente
  doc.line(margin + 10, firmaY, margin + 10 + firmaWidth, firmaY);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('Firma del Cliente', margin + 10, firmaY + 5);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(127, 140, 141);
  doc.text(nfecha('fecha'), margin + 10, firmaY + 10);

  // Firma del técnico
  doc.setTextColor(0);
  doc.line(pageWidth - margin - firmaWidth - 10, firmaY, pageWidth - margin - 10, firmaY);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('Firma del Técnico', pageWidth - margin - firmaWidth - 10, firmaY + 5);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(127, 140, 141);
  doc.text(nfecha('fecha'), pageWidth - margin - firmaWidth - 10, firmaY + 10);

  currentY = firmaY + 20;

  // Footer
  doc.setTextColor(0);
  doc.setDrawColor(236, 240, 241);
  doc.line(margin, currentY, pageWidth - margin, currentY);
  currentY += 6;

  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(52, 152, 219);
  const footerText = '¡Gracias por confiar en nosotros!';
  const footerWidth = doc.getTextWidth(footerText);
  doc.text(footerText, (pageWidth - footerWidth) / 2, currentY);
  currentY += 6;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(127, 140, 141);
  const subFooter = 'Conserve este recibo para retirar su equipo';
  const subFooterWidth = doc.getTextWidth(subFooter);
  doc.text(subFooter, (pageWidth - subFooterWidth) / 2, currentY);
  currentY += 5;

  doc.setFontSize(7);
  const timestamp = `Generado: ${nfecha('fecha')} ${nfecha('hora')}`;
  const timestampWidth = doc.getTextWidth(timestamp);
  doc.text(timestamp, (pageWidth - timestampWidth) / 2, currentY);

  // Mostrar PDF
  const pdfBlob = doc.output('blob');
  const url = URL.createObjectURL(pdfBlob);
  pdfUrl.value = url;
  pdfDialogVisible.value = true;
  localVisible.value = false;
};
</script>

<template>
  <Dialog
    v-model:visible="localVisible"
    modal
    :header="'Configurar Impresión - Orden #' + (ordenData?.no_factura || '')"
    :style="{ width: '500px', zIndex: 1100 }"
    :dismissableMask="false"
    :baseZIndex="1100"
  >
    <template #header>
      <div class="flex items-center gap-3">
        <div class="bg-blue-500 rounded-full p-2">
          <i class="pi pi-print text-white text-xl"></i>
        </div>
        <div>
          <h2 class="text-xl font-bold text-gray-800 m-0">Generar PDF de Impresión</h2>
          <p class="text-sm text-gray-500 m-0">Orden #{{ ordenData?.no_factura || '' }}</p>
        </div>
      </div>
    </template>

    <!-- Selector de formato -->
    <div class="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
      <label class="block text-sm font-medium text-gray-700 mb-3">
        <i class="pi pi-cog mr-2"></i>Seleccione el Formato de Impresión
      </label>
      <div class="flex gap-3">
        <Button
          :label="'Térmico 80mm'"
          :severity="formatoSeleccionado === '80mm' ? 'primary' : 'secondary'"
          @click="cambiarFormato('80mm')"
          icon="pi pi-receipt"
          class="flex-1"
        />
        <Button
          :label="'Carta (Letter)'"
          :severity="formatoSeleccionado === 'carta' ? 'primary' : 'secondary'"
          @click="cambiarFormato('carta')"
          icon="pi pi-file"
          class="flex-1"
        />
      </div>
      <p class="text-xs text-gray-500 mt-2">
        <i class="pi pi-info-circle mr-1"></i>
        {{ formatoSeleccionado === '80mm' ? 'Formato compacto para impresoras térmicas' : 'Formato estándar tamaño carta' }}
      </p>

      <!-- Mensaje cuando está disponible la impresión directa -->
      <div v-if="isElectron && formatoSeleccionado === '80mm'" class="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
        <div class="flex items-center gap-2">
          <i class="pi pi-check-circle text-green-600"></i>
          <span class="text-xs text-green-700 font-medium">
            Impresión directa disponible: Puede imprimir directamente en su impresora térmica configurada
          </span>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="flex justify-end gap-2">
        <Button label="Cancelar" icon="pi pi-times" severity="secondary" outlined @click="cerrar" />
        <Button
          v-if="isElectron && formatoSeleccionado === '80mm'"
          label="Imprimir Directo (Térmica)"
          icon="pi pi-print"
          severity="success"
          @click="imprimirDirecto"
          :title="'Imprimir directamente en impresora térmica configurada'"
        />
        <Button label="Generar PDF" icon="pi pi-file-pdf" severity="danger" @click="generarPDF" />
      </div>
    </template>
  </Dialog>

  <!-- Modal PDF Embedido -->
  <Dialog
    v-model:visible="pdfDialogVisible"
    :modal="true"
    :style="{ width: '90vw', height: '90vh', zIndex: 1100 }"
    :header="'PDF Orden de Taller - ' + (formatoSeleccionado === '80mm' ? 'Formato Térmico 80mm' : 'Formato Carta')"
    :baseZIndex="1100"
  >
    <div style="height: calc(90vh - 120px);">
      <iframe
        v-if="pdfUrl"
        :src="pdfUrl"
        style="width: 100%; height: 100%; border: none;"
        title="PDF Orden Taller"
      ></iframe>
    </div>
    <template #footer>
      <Button
        label="Descargar PDF"
        icon="pi pi-download"
        @click="() => {
          const link = document.createElement('a');
          link.href = pdfUrl;
          link.download = `Orden_Taller_${ordenData?.no_factura || 'SIN_NUMERO'}_${formatoSeleccionado}.pdf`;
          link.click();
        }"
        severity="success"
      />
      <Button
        label="Imprimir"
        icon="pi pi-print"
        @click="() => {
          const iframe = document.createElement('iframe');
          iframe.style.display = 'none';
          iframe.src = pdfUrl;
          document.body.appendChild(iframe);
          iframe.onload = () => {
            iframe.contentWindow.print();
          };
        }"
        severity="info"
      />
      <Button
        label="Cerrar"
        icon="pi pi-times"
        @click="pdfDialogVisible = false"
        severity="secondary"
        outlined
      />
    </template>
  </Dialog>
</template>

<style scoped>
/* Estilos mínimos - todo el formato está en el PDF */
</style>
