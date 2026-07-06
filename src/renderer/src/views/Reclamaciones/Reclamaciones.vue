
<script setup>
import { ref, onMounted, nextTick, watchEffect,computed } from 'vue';
import axios from 'axios';
import { enviarDatosPorPost, eliminarDatos, obtenerIdsSeleccionados, borrarTodoslosDatos, lenguajeDataTable, nfecha, arrayToObjetoFromTabla, peticionesFetch, encryptarPassword, envioElectron, mensajetoast, crearTablaSiNoExiste, peticiones, lasMayusculas, peticionesFetchOffline, arrayToObjetoFromTablaOffline, crearTablaSiNoExisteOffline, formatearFecha, esFechaEnRango } from '../../funciones/funciones.js';
import Swal from 'sweetalert2'
import { useToast } from "primevue/usetoast";
import { jsPDF } from 'jspdf';
const toast = useToast();
import { useRouter, useRoute } from 'vue-router';
const router = useRouter();
/************************************************************************/
/************************************************************************/
const usuarioLocal = ref({})
/************************************************************************/
const camposArray = ['nombre', 'telefono', 'whatsapp', 'email', 'institucion', 'no_reclamacion', 'fecha_emision', 'fecha_respuesta', 'fecha_vencimiento', 'descripcion_reclamo', 'articulo_reclamado', 'fecha_compra','no_factura', 'estado_reclamacion', 'resultado_reclamacion', 'respuesta_reclamo', 'fecha_cierre', 'representante'];
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
const datoscamposReclamaciones = ref({})
/************************************************************************/
const visible = ref(false);
const visiblecrear = ref(false);
const value = ref(null);
const id = ref(null);
const datoscampos = ref({});
const data = ref([]);
const searchQuery = ref('');
const ReclamacionesEditar = ref(null);
/************************************************************************/
// Filtros de fecha
const fechaInicio = ref(null);
const fechaFin = ref(null);

// Función para obtener el primer y último día del mes actual
const obtenerRangoMesActual = () => {
  const hoy = new Date();
  const primerDia = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
  const ultimoDia = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0);

  return {
    inicio: primerDia,
    fin: ultimoDia
  };
};
/************************************************************************/
async function limpiarCamposCrear() {
datoscamposReclamaciones.value = {}
await campos();
}
/************************************************************************/
watchEffect(() => {
  if (visiblecrear.value) {
  }
});
/************************************************************************/
const fetchAndSetupData = async () => {
const response = await peticionesFetchOffline('getDataAsArray', 'reclamaciones');
    const jsonData = response.reverse();
    data.value = jsonData;
};
/************************************************************************/
async function campos() {
  const campos = await arrayToObjetoFromTablaOffline('reclamaciones');
  datoscamposReclamaciones.value = campos;
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
await crearTablaSiNoExisteOffline('reclamaciones', camposArray.join(','), toast);
usuarioLocal.value = JSON.parse(window.localStorage.getItem('usuarioLocal'))[0] || {};

// Inicializar fechas con el mes actual
const rangoMesActual = obtenerRangoMesActual();
fechaInicio.value = rangoMesActual.inicio;
fechaFin.value = rangoMesActual.fin;

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
                    const envioDatos = await peticionesFetchOffline('deleteAll', 'reclamaciones');
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
                                const envioDatos = await peticionesFetchOffline('deleteEntry', 'reclamaciones', id);
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
const itemsReclamaciones = ref([]);
const menu = ref(null);
const currentRowData = ref(null);
const toggleReclamaciones = (event, rowData) => {
currentRowData.value = rowData;
itemsReclamaciones.value = [
{ label: 'Editar', icon: 'pi pi-pencil', command: () => {
router.push({ path: `/editarreclamaciones/${currentRowData.value.id}` });
} },
{ label: 'Ver PDF', icon: 'pi pi-file-pdf', command: () => {
  generarPDFReclamacion(currentRowData.value);
} },
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
                        const datosFactura = await peticionesFetchOffline('deleteEntry', 'reclamaciones', rowData.id);
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
// Función auxiliar para convertir DD/MM/YYYY a YYYY-MM-DD
const convertirFechaAComparable = (fechaStr) => {
  if (!fechaStr) return null;

  // Si ya está en formato YYYY-MM-DD o es un timestamp, extraer la fecha
  if (fechaStr.includes('-')) {
    return String(fechaStr).substring(0, 10);
  }

  // Convertir DD/MM/YYYY a YYYY-MM-DD
  const partes = fechaStr.split('/');
  if (partes.length === 3) {
    const dia = partes[0].padStart(2, '0');
    const mes = partes[1].padStart(2, '0');
    const año = partes[2];
    return `${año}-${mes}-${dia}`;
  }

  return null;
};

const filteredReclamaciones = computed(() => {
  let filtered = data.value;

  // Filtrar por rango de fechas
  if (fechaInicio.value || fechaFin.value) {
    filtered = filtered.filter(reclamacion => {
      // Si no hay fecha de emisión, no mostrar la reclamación
      if (!reclamacion.fecha_emision) return false;

      // Convertir fecha de emisión (DD/MM/YYYY) a formato comparable (YYYY-MM-DD)
      const fechaEmision = convertirFechaAComparable(reclamacion.fecha_emision);
      if (!fechaEmision) return false;

      // Convertir las fechas del DatePicker a formato YYYY-MM-DD
      let fechaInicioStr = null;
      let fechaFinStr = null;

      if (fechaInicio.value) {
        const fi = new Date(fechaInicio.value);
        const year = fi.getFullYear();
        const month = String(fi.getMonth() + 1).padStart(2, '0');
        const day = String(fi.getDate()).padStart(2, '0');
        fechaInicioStr = `${year}-${month}-${day}`;
      }

      if (fechaFin.value) {
        const ff = new Date(fechaFin.value);
        const year = ff.getFullYear();
        const month = String(ff.getMonth() + 1).padStart(2, '0');
        const day = String(ff.getDate()).padStart(2, '0');
        fechaFinStr = `${year}-${month}-${day}`;
      }

      // Comparar fechas como strings (YYYY-MM-DD se puede comparar lexicográficamente)
      if (fechaInicioStr && fechaFinStr) {
        // Ambas fechas: verificar que esté en el rango
        return fechaEmision >= fechaInicioStr && fechaEmision <= fechaFinStr;
      } else if (fechaInicioStr) {
        // Solo fecha inicio: >= fecha inicio
        return fechaEmision >= fechaInicioStr;
      } else if (fechaFinStr) {
        // Solo fecha fin: <= fecha fin
        return fechaEmision <= fechaFinStr;
      }

      return true;
    });
  }

  // Filtrar por búsqueda de texto
  if (searchQuery.value) {
    filtered = filtered.filter(busqueda => {
      return Object.values(busqueda).some(value =>
        String(value).toLowerCase().includes(searchQuery.value.toLowerCase())
      );
    });
  }

  return filtered;
});
/************************************************************************/
const estadisticasReclamaciones = computed(() => {
  const total = filteredReclamaciones.value.length;
  const pendientes = filteredReclamaciones.value.filter(item => item.estado_reclamacion === 'PENDIENTE').length;
  const enProceso = filteredReclamaciones.value.filter(item => item.estado_reclamacion === 'EN PROCESO').length;
  const resueltas = filteredReclamaciones.value.filter(item => item.estado_reclamacion === 'RESUELTA').length;
  const cerradas = filteredReclamaciones.value.filter(item => item.estado_reclamacion === 'CERRADA').length;
  return { total, pendientes, enProceso, resueltas, cerradas };
});

const getSeverityEstado = (estado) => {
  switch (estado) {
    case 'PENDIENTE': return 'danger';
    case 'EN PROCESO': return 'warning';
    case 'RESUELTA': return 'success';
    case 'CERRADA': return 'info';
    default: return 'secondary';
  }
};

const rowClass = (data) => {
  if (data.estado_reclamacion === 'PENDIENTE') return 'row-pendiente';
  if (data.estado_reclamacion === 'EN PROCESO') return 'row-proceso';
  if (data.estado_reclamacion === 'RESUELTA') return 'row-resuelta';
  return '';
};
/************************************************************************/
const fnAwesomplete = ()=>{
}
const handleSelectComplete = async(selected)=>{
}
/************************************************************************/
const onRowSelect = (event) => {
 router.push({ path: `/editarreclamaciones/${event.data.id}` });

};
/************************************************************************/
const generarPDFResumenGeneral = async () => {
  try {
    const doc = new jsPDF('landscape'); // Horizontal para mejor vista de tabla
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    let yPos = 20;

    // ============ ENCABEZADO ============
    doc.setFillColor(220, 38, 38);
    doc.rect(0, 0, pageWidth, 35, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text('RESUMEN GENERAL DE RECLAMACIONES', pageWidth / 2, 15, { align: 'center' });

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Generado: ${new Date().toLocaleDateString('es-ES')} ${new Date().toLocaleTimeString('es-ES')}`, pageWidth / 2, 25, { align: 'center' });

    yPos = 45;

    // ============ ESTADÍSTICAS ============
    const stats = estadisticasReclamaciones.value;

    doc.setFillColor(248, 250, 252);
    doc.rect(15, yPos, pageWidth - 30, 25, 'F');

    doc.setTextColor(51, 51, 51);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('📊 ESTADÍSTICAS', 20, yPos + 7);

    yPos += 14;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');

    const statsX = 20;
    doc.setTextColor(75, 85, 99);
    doc.setFont('helvetica', 'bold');
    doc.text('Total:', statsX, yPos);
    doc.setTextColor(59, 130, 246);
    doc.text(`${stats.total}`, statsX + 20, yPos);

    doc.setTextColor(75, 85, 99);
    doc.setFont('helvetica', 'bold');
    doc.text('Pendientes:', statsX + 50, yPos);
    doc.setTextColor(220, 38, 38);
    doc.text(`${stats.pendientes}`, statsX + 80, yPos);

    doc.setTextColor(75, 85, 99);
    doc.setFont('helvetica', 'bold');
    doc.text('En Proceso:', statsX + 100, yPos);
    doc.setTextColor(245, 158, 11);
    doc.text(`${stats.enProceso}`, statsX + 135, yPos);

    doc.setTextColor(75, 85, 99);
    doc.setFont('helvetica', 'bold');
    doc.text('Resueltas:', statsX + 155, yPos);
    doc.setTextColor(16, 185, 129);
    doc.text(`${stats.resueltas}`, statsX + 185, yPos);

    doc.setTextColor(75, 85, 99);
    doc.setFont('helvetica', 'bold');
    doc.text('Cerradas:', statsX + 205, yPos);
    doc.setTextColor(107, 114, 128);
    doc.text(`${stats.cerradas}`, statsX + 235, yPos);

    yPos += 15;

    // ============ TABLA DE RECLAMACIONES ============
    const reclamaciones = filteredReclamaciones.value;

    if (reclamaciones.length === 0) {
      doc.setTextColor(220, 38, 38);
      doc.setFontSize(14);
      doc.text('No hay reclamaciones para mostrar', pageWidth / 2, yPos + 30, { align: 'center' });
    } else {
      // Encabezados de la tabla
      doc.setFillColor(220, 38, 38);
      doc.rect(15, yPos, pageWidth - 30, 8, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');

      const colX = {
        no: 20,
        fecha: 50,
        cliente: 85,
        articulo: 145,
        estado: 210,
        resultado: 240,
        representante: 270
      };

      doc.text('No. Reclamo', colX.no, yPos + 5);
      doc.text('Fecha', colX.fecha, yPos + 5);
      doc.text('Cliente', colX.cliente, yPos + 5);
      doc.text('Artículo', colX.articulo, yPos + 5);
      doc.text('Estado', colX.estado, yPos + 5);
      doc.text('Resultado', colX.resultado, yPos + 5);
      doc.text('Representante', colX.representante, yPos + 5);

      yPos += 10;

      // Filas de datos
      doc.setFont('helvetica', 'normal');
      let rowCount = 0;

      reclamaciones.forEach((rec, index) => {
        // Alternar color de fila
        if (index % 2 === 0) {
          doc.setFillColor(248, 250, 252);
          doc.rect(15, yPos - 2, pageWidth - 30, 7, 'F');
        }

        doc.setFontSize(7);
        doc.setTextColor(31, 41, 55);

        // No. Reclamación
        doc.setFont('helvetica', 'bold');
        doc.text((rec.no_reclamacion || 'N/A').substring(0, 12), colX.no, yPos + 3);

        doc.setFont('helvetica', 'normal');
        // Fecha
        doc.text((rec.fecha_emision || 'N/A').substring(0, 10), colX.fecha, yPos + 3);

        // Cliente (truncado)
        const cliente = (rec.nombre || 'N/A').substring(0, 25);
        doc.text(cliente, colX.cliente, yPos + 3);

        // Artículo (truncado)
        const articulo = (rec.articulo_reclamado || 'N/A').substring(0, 30);
        doc.text(articulo, colX.articulo, yPos + 3);

        // Estado con color
        const estadoColors = {
          'PENDIENTE': [220, 38, 38],
          'EN PROCESO': [245, 158, 11],
          'RESUELTA': [16, 185, 129],
          'CERRADA': [107, 114, 128],
          'ABIERTO': [59, 130, 246]
        };
        const estadoColor = estadoColors[rec.estado_reclamacion] || [107, 114, 128];
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...estadoColor);
        doc.text((rec.estado_reclamacion || 'N/A').substring(0, 12), colX.estado, yPos + 3);

        // Resultado
        doc.setTextColor(31, 41, 55);
        doc.setFont('helvetica', 'normal');
        doc.text((rec.resultado_reclamacion || 'N/A').substring(0, 15), colX.resultado, yPos + 3);

        // Representante
        doc.text((rec.representante || 'N/A').substring(0, 12), colX.representante, yPos + 3);

        yPos += 7;
        rowCount++;

        // Nueva página si es necesario
        if (yPos > pageHeight - 30) {
          doc.addPage();
          yPos = 20;

          // Re-dibujar encabezados
          doc.setFillColor(220, 38, 38);
          doc.rect(15, yPos, pageWidth - 30, 8, 'F');
          doc.setTextColor(255, 255, 255);
          doc.setFontSize(8);
          doc.setFont('helvetica', 'bold');

          doc.text('No. Reclamo', colX.no, yPos + 5);
          doc.text('Fecha', colX.fecha, yPos + 5);
          doc.text('Cliente', colX.cliente, yPos + 5);
          doc.text('Artículo', colX.articulo, yPos + 5);
          doc.text('Estado', colX.estado, yPos + 5);
          doc.text('Resultado', colX.resultado, yPos + 5);
          doc.text('Representante', colX.representante, yPos + 5);

          yPos += 10;
        }
      });
    }

    // ============ FOOTER ============
    const totalPages = doc.internal.pages.length - 1;
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      const footerY = pageHeight - 15;
      doc.setFillColor(248, 250, 252);
      doc.rect(0, footerY - 5, pageWidth, 20, 'F');
      doc.setTextColor(107, 114, 128);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'italic');
      doc.text(`${datosEmpresa.empresa?.nombre || 'Sistema AA'} - Página ${i} de ${totalPages}`, pageWidth / 2, footerY, { align: 'center' });
    }

    // Convertir PDF a base64
    const pdfData = doc.output('datauristring');

    // Mostrar en SweetAlert2
    await Swal.fire({
      title: '<span style="color: #dc2626;">📊 Resumen General de Reclamaciones</span>',
      html: `
        <div style="margin-bottom: 1rem; padding: 1rem; background: #fef2f2; border-radius: 8px; border-left: 4px solid #dc2626;">
          <p style="margin: 0; color: #991b1b; font-weight: 600;">
            📋 Total de reclamaciones: ${reclamaciones.length}
          </p>
          <p style="margin: 0.5rem 0 0 0; color: #7f1d1d; font-size: 0.9rem;">
            Rango de fechas: ${fechaInicio.value ? new Date(fechaInicio.value).toLocaleDateString('es-ES') : 'Todas'}
            - ${fechaFin.value ? new Date(fechaFin.value).toLocaleDateString('es-ES') : 'Todas'}
          </p>
        </div>
        <iframe
          src="${pdfData}"
          style="width: 100%; height: 500px; border: none; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);"
          frameborder="0"
        ></iframe>
      `,
      width: '95%',
      showCloseButton: true,
      showCancelButton: true,
      confirmButtonText: '<i class="pi pi-download"></i> Descargar PDF',
      confirmButtonColor: '#dc2626',
      cancelButtonText: '<i class="pi pi-times"></i> Cerrar',
      cancelButtonColor: '#6b7280',
      customClass: {
        popup: 'pdf-modal-popup',
        title: 'pdf-modal-title'
      }
    }).then((result) => {
      if (result.isConfirmed) {
        const fecha = new Date().toISOString().split('T')[0];
        doc.save(`Resumen_Reclamaciones_${fecha}.pdf`);
        toast.add({
          severity: 'success',
          summary: 'PDF Descargado',
          detail: 'Resumen de reclamaciones descargado correctamente',
          life: 3000
        });
      }
    });

  } catch (error) {
    console.error('Error al generar PDF resumen:', error);
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'No se pudo generar el PDF resumen',
      life: 3000
    });
  }
};
/************************************************************************/
const generarPDFReclamacion = async (reclamacion) => {
  try {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    let yPos = 20;

    // ============ ENCABEZADO ============
    // Fondo del encabezado
    doc.setFillColor(220, 38, 38); // Rojo
    doc.rect(0, 0, pageWidth, 45, 'F');

    // Logo o icono (simulado con un círculo)
    doc.setFillColor(255, 255, 255);
    doc.circle(20, 22, 8, 'F');
    doc.setTextColor(220, 38, 38);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('!', 19.5, 25);

    // Título
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('REPORTE DE RECLAMACIÓN', pageWidth / 2, 22, { align: 'center' });

    // Subtítulo
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Sistema de Gestión de Reclamaciones', pageWidth / 2, 32, { align: 'center' });

    // Número de reclamación destacado
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(`${reclamacion.no_reclamacion || 'N/A'}`, pageWidth / 2, 40, { align: 'center' });

    yPos = 55;

    // ============ INFORMACIÓN DEL CLIENTE ============
    // Sección header
    doc.setFillColor(248, 250, 252);
    doc.rect(15, yPos, pageWidth - 30, 10, 'F');
    doc.setTextColor(51, 51, 51);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('📋 INFORMACIÓN DEL CLIENTE', 20, yPos + 7);

    yPos += 15;

    // Datos del cliente en dos columnas
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(75, 85, 99);

    // Columna izquierda
    doc.text('Nombre:', 20, yPos);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(31, 41, 55);
    doc.text(reclamacion.nombre || 'N/A', 45, yPos);

    yPos += 6;
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(75, 85, 99);
    doc.text('Teléfono:', 20, yPos);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(31, 41, 55);
    doc.text(reclamacion.telefono || 'N/A', 45, yPos);

    yPos += 6;
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(75, 85, 99);
    doc.text('WhatsApp:', 20, yPos);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(31, 41, 55);
    doc.text(reclamacion.whatsapp || 'N/A', 45, yPos);

    // Columna derecha
    yPos = 70;
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(75, 85, 99);
    doc.text('Email:', 110, yPos);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(31, 41, 55);
    doc.text(reclamacion.email || 'N/A', 130, yPos);

    yPos += 6;
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(75, 85, 99);
    doc.text('Institución:', 110, yPos);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(31, 41, 55);
    doc.text(reclamacion.institucion || 'N/A', 130, yPos);

    yPos = 88;

    // ============ DETALLES DE LA RECLAMACIÓN ============
    doc.setFillColor(248, 250, 252);
    doc.rect(15, yPos, pageWidth - 30, 10, 'F');
    doc.setTextColor(51, 51, 51);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('📦 DETALLES DE LA RECLAMACIÓN', 20, yPos + 7);

    yPos += 15;

    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(75, 85, 99);
    doc.text('Artículo Reclamado:', 20, yPos);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(31, 41, 55);
    doc.text(reclamacion.articulo_reclamado || 'N/A', 60, yPos);

    yPos += 6;
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(75, 85, 99);
    doc.text('No. Factura:', 20, yPos);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(31, 41, 55);
    doc.text(reclamacion.no_factura || 'N/A', 60, yPos);

    yPos += 6;
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(75, 85, 99);
    doc.text('Fecha de Compra:', 20, yPos);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(31, 41, 55);
    doc.text(reclamacion.fecha_compra || 'N/A', 60, yPos);

    yPos += 10;

    // ============ FECHAS IMPORTANTES ============
    doc.setFillColor(248, 250, 252);
    doc.rect(15, yPos, pageWidth - 30, 10, 'F');
    doc.setTextColor(51, 51, 51);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('📅 FECHAS IMPORTANTES', 20, yPos + 7);

    yPos += 15;

    doc.setFontSize(9);
    // Primera fila
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(75, 85, 99);
    doc.text('Emisión:', 20, yPos);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(31, 41, 55);
    doc.text(reclamacion.fecha_emision || 'N/A', 45, yPos);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(75, 85, 99);
    doc.text('Respuesta:', 85, yPos);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(31, 41, 55);
    doc.text(reclamacion.fecha_respuesta || 'N/A', 110, yPos);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(75, 85, 99);
    doc.text('Vencimiento:', 145, yPos);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(31, 41, 55);
    doc.text(reclamacion.fecha_vencimiento || 'N/A', 175, yPos);

    yPos += 6;
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(75, 85, 99);
    doc.text('Cierre:', 20, yPos);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(31, 41, 55);
    doc.text(reclamacion.fecha_cierre || 'N/A', 45, yPos);

    yPos += 10;

    // ============ ESTADO Y RESULTADO ============
    doc.setFillColor(248, 250, 252);
    doc.rect(15, yPos, pageWidth - 30, 10, 'F');
    doc.setTextColor(51, 51, 51);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('🏷️ ESTADO Y RESULTADO', 20, yPos + 7);

    yPos += 15;

    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(75, 85, 99);
    doc.text('Estado:', 20, yPos);

    // Color del estado
    const estadoColors = {
      'PENDIENTE': [220, 38, 38],
      'EN PROCESO': [245, 158, 11],
      'RESUELTA': [16, 185, 129],
      'CERRADA': [107, 114, 128],
      'ABIERTO': [59, 130, 246]
    };
    const estadoColor = estadoColors[reclamacion.estado_reclamacion] || [107, 114, 128];
    doc.setTextColor(...estadoColor);
    doc.setFont('helvetica', 'bold');
    doc.text(reclamacion.estado_reclamacion || 'N/A', 45, yPos);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(75, 85, 99);
    doc.text('Resultado:', 110, yPos);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(31, 41, 55);
    doc.text(reclamacion.resultado_reclamacion || 'N/A', 135, yPos);

    yPos += 6;
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(75, 85, 99);
    doc.text('Representante:', 20, yPos);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(31, 41, 55);
    doc.text(reclamacion.representante || 'N/A', 55, yPos);

    yPos += 10;

    // ============ DESCRIPCIÓN DEL RECLAMO ============
    doc.setFillColor(248, 250, 252);
    doc.rect(15, yPos, pageWidth - 30, 10, 'F');
    doc.setTextColor(51, 51, 51);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('📝 DESCRIPCIÓN DEL RECLAMO', 20, yPos + 7);

    yPos += 12;

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(31, 41, 55);
    const descripcion = doc.splitTextToSize(reclamacion.descripcion_reclamo || 'Sin descripción', pageWidth - 40);
    doc.text(descripcion, 20, yPos);
    yPos += (descripcion.length * 5) + 8;

    // ============ RESPUESTA AL RECLAMO ============
    if (yPos > pageHeight - 60) {
      doc.addPage();
      yPos = 20;
    }

    doc.setFillColor(248, 250, 252);
    doc.rect(15, yPos, pageWidth - 30, 10, 'F');
    doc.setTextColor(51, 51, 51);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('💬 RESPUESTA AL RECLAMO', 20, yPos + 7);

    yPos += 12;

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(31, 41, 55);
    const respuesta = doc.splitTextToSize(reclamacion.respuesta_reclamo || 'Sin respuesta aún', pageWidth - 40);
    doc.text(respuesta, 20, yPos);

    // ============ FOOTER ============
    const footerY = pageHeight - 20;
    doc.setFillColor(248, 250, 252);
    doc.rect(0, footerY - 5, pageWidth, 25, 'F');
    doc.setTextColor(107, 114, 128);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    doc.text('Documento generado automáticamente - Sistema de Gestión de Reclamaciones', pageWidth / 2, footerY, { align: 'center' });
    doc.text(`Fecha de generación: ${new Date().toLocaleDateString('es-ES')} ${new Date().toLocaleTimeString('es-ES')}`, pageWidth / 2, footerY + 5, { align: 'center' });
    doc.setFont('helvetica', 'bold');
    doc.text(datosEmpresa.empresa?.nombre || 'AA Solutions', pageWidth / 2, footerY + 10, { align: 'center' });

    // Convertir PDF a base64 para mostrarlo en iframe
    const pdfData = doc.output('datauristring');

    // Mostrar en SweetAlert2
    await Swal.fire({
      title: `<span style="color: #dc2626;">📄 Reclamación ${reclamacion.no_reclamacion}</span>`,
      html: `
        <iframe
          src="${pdfData}"
          style="width: 100%; height: 500px; border: none; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);"
          frameborder="0"
        ></iframe>
      `,
      width: '90%',
      showCloseButton: true,
      showCancelButton: true,
      confirmButtonText: '<i class="pi pi-download"></i> Descargar PDF',
      confirmButtonColor: '#dc2626',
      cancelButtonText: '<i class="pi pi-times"></i> Cerrar',
      cancelButtonColor: '#6b7280',
      customClass: {
        popup: 'pdf-modal-popup',
        title: 'pdf-modal-title'
      }
    }).then((result) => {
      if (result.isConfirmed) {
        // Descargar el PDF
        doc.save(`Reclamacion_${reclamacion.no_reclamacion}.pdf`);
        toast.add({
          severity: 'success',
          summary: 'PDF Descargado',
          detail: `Reclamación ${reclamacion.no_reclamacion} descargada correctamente`,
          life: 3000
        });
      }
    });

  } catch (error) {
    console.error('Error al generar PDF:', error);
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'No se pudo generar el PDF',
      life: 3000
    });
  }
};
/************************************************************************/
</script>
<template>
<main class="reclamaciones-container">
  <div class="w-full">
    <!-- Header Profesional -->
    <div class="reclamaciones-header mb-4">
      <div class="reclamaciones-header-content">
        <div class="reclamaciones-icon-wrapper">
          <i class="pi pi-exclamation-triangle reclamaciones-icon"></i>
        </div>
        <div>
          <h1 class="reclamaciones-title">Gestión de Reclamaciones</h1>
          <p class="reclamaciones-subtitle">Sistema de seguimiento y resolución de reclamaciones de clientes</p>
        </div>
      </div>
    </div>

    <!-- Dashboard de Estadísticas -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
      <div class="stats-card stats-total">
        <div class="stats-icon-wrapper">
          <i class="pi pi-list stats-icon"></i>
        </div>
        <div class="stats-content">
          <p class="stats-label">Total Reclamaciones</p>
          <p class="stats-value">{{ estadisticasReclamaciones.total }}</p>
        </div>
      </div>

      <div class="stats-card stats-pendientes">
        <div class="stats-icon-wrapper">
          <i class="pi pi-clock stats-icon"></i>
        </div>
        <div class="stats-content">
          <p class="stats-label">Pendientes</p>
          <p class="stats-value">{{ estadisticasReclamaciones.pendientes }}</p>
        </div>
      </div>

      <div class="stats-card stats-proceso">
        <div class="stats-icon-wrapper">
          <i class="pi pi-refresh stats-icon"></i>
        </div>
        <div class="stats-content">
          <p class="stats-label">En Proceso</p>
          <p class="stats-value">{{ estadisticasReclamaciones.enProceso }}</p>
        </div>
      </div>

      <div class="stats-card stats-resueltas">
        <div class="stats-icon-wrapper">
          <i class="pi pi-check-circle stats-icon"></i>
        </div>
        <div class="stats-content">
          <p class="stats-label">Resueltas</p>
          <p class="stats-value">{{ estadisticasReclamaciones.resueltas }}</p>
        </div>
      </div>

      <div class="stats-card stats-cerradas">
        <div class="stats-icon-wrapper">
          <i class="pi pi-lock stats-icon"></i>
        </div>
        <div class="stats-content">
          <p class="stats-label">Cerradas</p>
          <p class="stats-value">{{ estadisticasReclamaciones.cerradas }}</p>
        </div>
      </div>
    </div>

    <!-- Toolbar de Acciones -->
    <Card class="mb-4 toolbar-card">
      <template #content>
        <div class="flex flex-wrap gap-3 items-center justify-between">
          <div class="flex flex-wrap gap-2">
            <Button
              icon="pi pi-refresh"
              label="Recargar"
              severity="secondary"
              @click="fetchAndSetupData"
              class="btn-action"
            />
            <router-link to="/crearreclamaciones">
              <Button
                icon="pi pi-plus"
                label="Nueva Reclamación"
                severity="success"
                class="btn-action"
              />
            </router-link>
            <Button
              icon="pi pi-file-pdf"
              label="PDF Resumen"
              severity="danger"
              @click="generarPDFResumenGeneral"
              class="btn-action"
            />
            <Button
              icon="pi pi-trash"
              label="Borrar Selección"
              severity="danger"
              @click="borrarSeleccionados"
              outlined
              class="btn-action"
            />
          </div>

          <div v-if="usuarioLocal.usuario == 'Soporte'">
            <Button
              label="Borrar Todo"
              icon="pi pi-trash"
              severity="danger"
              @click="borrarTodo"
              outlined
              class="btn-action"
            />
          </div>
        </div>
      </template>
    </Card>

    <!-- Filtros -->
    <Card class="mb-4 filters-card">
      <template #content>
        <div class="filters-container-grid">
          <div class="filter-item">
            <label class="filter-label">
              <i class="pi pi-calendar mr-2"></i>
              Fecha Inicio
            </label>
            <DatePicker
              v-model="fechaInicio"
              dateFormat="yy-mm-dd"
              placeholder="Seleccione fecha inicial"
              showIcon
              class="w-full filter-input"
            />
          </div>

          <div class="filter-item">
            <label class="filter-label">
              <i class="pi pi-calendar mr-2"></i>
              Fecha Fin
            </label>
            <DatePicker
              v-model="fechaFin"
              dateFormat="yy-mm-dd"
              placeholder="Seleccione fecha final"
              showIcon
              class="w-full filter-input"
            />
          </div>

          <div class="filter-item filter-item-full">
            <label class="filter-label">
              <i class="pi pi-search mr-2"></i>
              Buscar
            </label>
            <InputText
              v-model="searchQuery"
              placeholder="Buscar en todas las columnas..."
              class="w-full filter-input"
            />
          </div>
        </div>
      </template>
    </Card>

    <!-- DataTable Profesional -->
    <Card class="datatable-card">
      <template #content>
        <DataTable
          :value="filteredReclamaciones"
          scrollable
          scrollHeight="600px"
          dataKey="id"
          paginator
          :rows="10"
          v-model:selection="selectedItems"
          @rowSelect="onRowSelect"
          selectionMode="single"
          :rowsPerPageOptions="[5, 10, 20, 50]"
          :rowClass="rowClass"
          class="reclamaciones-table"
          tableStyle="min-width: 80rem">

          <Column selectionMode="multiple" frozen headerStyle="width: 3rem"></Column>

          <Column header="Acciones" frozen style="min-width: 120px">
            <template #body="slotProps">
              <div class="flex gap-1 items-center justify-center">
                <Button
                  icon="pi pi-file-pdf"
                  severity="danger"
                  size="small"
                  outlined
                  rounded
                  @click="generarPDFReclamacion(slotProps.data)"
                  v-tooltip.top="'Ver PDF'"
                  class="btn-pdf-action"
                />
                <Button
                  icon="pi pi-ellipsis-v"
                  severity="secondary"
                  size="small"
                  text
                  rounded
                  @click="toggleReclamaciones($event, slotProps.data)"
                  aria-haspopup="true"
                  aria-controls="overlay_menu_reclamaciones"
                  v-tooltip.top="'Más opciones'"
                  class="btn-options"
                />
              </div>
              <Menu
                ref="menu"
                id="overlay_menu_Reclamaciones"
                :model="itemsReclamaciones"
                :popup="true"
              />
            </template>
          </Column>

          <Column field="no_reclamacion" header="No. Reclamación" style="min-width: 150px">
            <template #body="slotProps">
              <span class="font-semibold text-red-600">#{{ slotProps.data.no_reclamacion }}</span>
            </template>
          </Column>

          <Column field="estado_reclamacion" header="Estado" style="min-width: 140px">
            <template #body="slotProps">
              <Badge
                :value="slotProps.data.estado_reclamacion || 'PENDIENTE'"
                :severity="getSeverityEstado(slotProps.data.estado_reclamacion)"
              />
            </template>
          </Column>

          <Column field="nombre" header="Nombre Cliente" style="min-width: 200px"></Column>
          <Column field="telefono" header="Teléfono" style="min-width: 130px"></Column>
          <Column field="whatsapp" header="WhatsApp" style="min-width: 130px"></Column>
          <Column field="email" header="Email" style="min-width: 200px"></Column>
          <Column field="institucion" header="Institución" style="min-width: 180px"></Column>
          <Column field="fecha_emision" header="Fecha Emisión" style="min-width: 130px"></Column>
          <Column field="fecha_respuesta" header="Fecha Respuesta" style="min-width: 140px"></Column>
          <Column field="fecha_vencimiento" header="Fecha Vencimiento" style="min-width: 160px"></Column>
          <Column field="articulo_reclamado" header="Artículo" style="min-width: 200px"></Column>
          <Column field="fecha_compra" header="Fecha Compra" style="min-width: 130px"></Column>
          <Column field="no_factura" header="No. Factura" style="min-width: 130px"></Column>
          <Column field="descripcion_reclamo" header="Descripción" style="min-width: 300px"></Column>
          <Column field="resultado_reclamacion" header="Resultado" style="min-width: 180px"></Column>
          <Column field="respuesta_reclamo" header="Respuesta" style="min-width: 300px"></Column>
          <Column field="fecha_cierre" header="Fecha Cierre" style="min-width: 130px"></Column>
          <Column field="representante" header="Representante" style="min-width: 180px"></Column>
        </DataTable>
      </template>
    </Card>
  </div>

  <Toast />
</main>
</template>
<style scoped>
/* ===== Container Principal ===== */
.reclamaciones-container {
  padding: 1rem;
  background: linear-gradient(135deg, #fef2f2 0%, #fecaca 100%);
  min-height: 100vh;
}

/* ===== Header Profesional ===== */
.reclamaciones-header {
  background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%);
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 8px 20px rgba(220, 38, 38, 0.3);
  animation: slideIn 0.5s ease-out;
}

.reclamaciones-header-content {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.reclamaciones-icon-wrapper {
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(10px);
  width: 60px;
  height: 60px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.reclamaciones-icon {
  font-size: 1.75rem;
  color: white;
}

.reclamaciones-title {
  font-size: 1.75rem;
  font-weight: 700;
  color: white;
  margin: 0;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.reclamaciones-subtitle {
  font-size: 0.875rem;
  color: rgba(255, 255, 255, 0.9);
  margin: 0.25rem 0 0 0;
}

/* ===== Stats Cards ===== */
.stats-card {
  background: white;
  border-radius: 12px;
  padding: 1.25rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
  animation: fadeIn 0.5s ease-out;
  border-left: 4px solid;
}

.stats-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
}

.stats-total {
  border-left-color: #3b82f6;
}

.stats-pendientes {
  border-left-color: #dc2626;
}

.stats-proceso {
  border-left-color: #f59e0b;
}

.stats-resueltas {
  border-left-color: #10b981;
}

.stats-cerradas {
  border-left-color: #6b7280;
}

.stats-icon-wrapper {
  width: 50px;
  height: 50px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
}

.stats-total .stats-icon-wrapper {
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  color: white;
}

.stats-pendientes .stats-icon-wrapper {
  background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%);
  color: white;
}

.stats-proceso .stats-icon-wrapper {
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  color: white;
}

.stats-resueltas .stats-icon-wrapper {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
}

.stats-cerradas .stats-icon-wrapper {
  background: linear-gradient(135deg, #6b7280 0%, #4b5563 100%);
  color: white;
}

.stats-content {
  flex: 1;
}

.stats-label {
  font-size: 0.75rem;
  font-weight: 600;
  color: #6b7280;
  text-transform: uppercase;
  margin: 0 0 0.25rem 0;
}

.stats-value {
  font-size: 1.75rem;
  font-weight: 700;
  color: #111827;
  margin: 0;
}

/* ===== Toolbar Card ===== */
.toolbar-card {
  border-radius: 10px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  border: none;
}

.toolbar-card :deep(.p-card-body) {
  padding: 1rem;
}

.toolbar-card :deep(.p-card-content) {
  padding: 0;
}

.btn-action {
  transition: all 0.3s ease;
  font-weight: 600;
}

.btn-action:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

/* ===== Filters Card ===== */
.filters-card {
  border-radius: 10px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  border: none;
}

.filters-card :deep(.p-card-body) {
  padding: 1rem;
}

.filters-card :deep(.p-card-content) {
  padding: 0;
}

.filters-container-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
}

.filter-item {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.filter-item-full {
  grid-column: 1 / -1;
}

.filter-label {
  display: flex;
  align-items: center;
  font-weight: 600;
  color: #374151;
  font-size: 0.875rem;
}

.filter-label i {
  color: #dc2626;
}

.filter-input {
  transition: all 0.3s ease;
}

.filter-input:focus {
  border-color: #dc2626;
  box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.1);
}

/* ===== DataTable Card ===== */
.datatable-card {
  border-radius: 10px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  border: none;
}

.datatable-card :deep(.p-card-body) {
  padding: 0;
}

.datatable-card :deep(.p-card-content) {
  padding: 0;
}

/* ===== DataTable Styling ===== */
.reclamaciones-table :deep(.p-datatable-header) {
  background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%);
  color: white;
  border-radius: 10px 10px 0 0;
  padding: 1rem;
  border: none;
}

.reclamaciones-table :deep(.p-datatable-thead > tr > th) {
  background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%);
  color: white;
  font-weight: 600;
  padding: 1rem 0.75rem;
  border: none;
  font-size: 0.8125rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.reclamaciones-table :deep(.p-datatable-tbody > tr) {
  transition: all 0.2s ease;
  cursor: pointer;
}

.reclamaciones-table :deep(.p-datatable-tbody > tr:hover) {
  background-color: #fef2f2 !important;
  transform: scale(1.001);
}

.reclamaciones-table :deep(.p-datatable-tbody > tr > td) {
  padding: 0.875rem 0.75rem;
  border-bottom: 1px solid #e5e7eb;
  color: #374151;
  font-size: 0.8125rem;
}

.reclamaciones-table :deep(.p-datatable-tbody > tr:last-child > td) {
  border-bottom: none;
}

/* Row Classes */
.reclamaciones-table :deep(.row-pendiente) {
  background-color: #fef2f2;
  border-left: 3px solid #dc2626;
}

.reclamaciones-table :deep(.row-proceso) {
  background-color: #fffbeb;
  border-left: 3px solid #f59e0b;
}

.reclamaciones-table :deep(.row-resuelta) {
  background-color: #f0fdf4;
  border-left: 3px solid #10b981;
}

/* Frozen Column */
.reclamaciones-table :deep(.p-frozen-column) {
  background-color: #fafafa;
  font-weight: 600;
}

/* Pagination */
.reclamaciones-table :deep(.p-paginator) {
  background: #f9fafb;
  border-top: 2px solid #e5e7eb;
  padding: 0.75rem 1rem;
  border-radius: 0 0 10px 10px;
}

.reclamaciones-table :deep(.p-paginator .p-paginator-pages .p-paginator-page.p-highlight) {
  background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%);
  border-color: #dc2626;
  color: white;
}

/* Button Options */
.btn-options {
  color: #6b7280;
  transition: all 0.3s ease;
}

.btn-options:hover {
  background-color: #f3f4f6;
  color: #374151;
  transform: scale(1.05);
}

.btn-pdf-action {
  transition: all 0.3s ease;
  border-width: 2px;
}

.btn-pdf-action:hover {
  transform: scale(1.1);
  box-shadow: 0 4px 12px rgba(220, 38, 38, 0.3);
}

/* Scrollbar Personalizado */
.reclamaciones-table :deep(.p-datatable-wrapper)::-webkit-scrollbar {
  width: 10px;
  height: 10px;
}

.reclamaciones-table :deep(.p-datatable-wrapper)::-webkit-scrollbar-track {
  background: #f3f4f6;
  border-radius: 5px;
}

.reclamaciones-table :deep(.p-datatable-wrapper)::-webkit-scrollbar-thumb {
  background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%);
  border-radius: 5px;
}

.reclamaciones-table :deep(.p-datatable-wrapper)::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(135deg, #991b1b 0%, #7f1d1d 100%);
}

/* ===== Animations ===== */
@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* ===== Responsive Design ===== */
@media (max-width: 1024px) {
  .reclamaciones-container {
    padding: 0.75rem;
  }

  .reclamaciones-header {
    padding: 1rem;
  }

  .reclamaciones-title {
    font-size: 1.5rem;
  }

  .stats-card {
    padding: 1rem;
  }

  .stats-value {
    font-size: 1.5rem;
  }

  .filters-container-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 640px) {
  .reclamaciones-container {
    padding: 0.5rem;
  }

  .reclamaciones-header {
    padding: 0.75rem;
  }

  .reclamaciones-header-content {
    flex-direction: column;
    text-align: center;
  }

  .reclamaciones-title {
    font-size: 1.25rem;
  }

  .reclamaciones-subtitle {
    font-size: 0.75rem;
  }

  .stats-card {
    padding: 0.875rem;
  }

  .stats-icon-wrapper {
    width: 40px;
    height: 40px;
    font-size: 1.25rem;
  }

  .stats-value {
    font-size: 1.25rem;
  }

  .toolbar-card :deep(.p-card-body),
  .filters-card :deep(.p-card-body) {
    padding: 0.75rem;
  }

  .filters-container-grid {
    grid-template-columns: 1fr;
  }

  .filter-item-full {
    grid-column: 1;
  }
}

/* ===== Estilos para modal de PDF ===== */
:deep(.pdf-modal-popup) {
  border-radius: 12px !important;
  padding: 0 !important;
}

:deep(.pdf-modal-title) {
  font-size: 1.5rem !important;
  font-weight: 700 !important;
  padding: 1.5rem !important;
  background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%) !important;
  color: white !important;
  border-radius: 12px 12px 0 0 !important;
  margin: 0 !important;
}

:deep(.swal2-html-container) {
  padding: 1rem !important;
  margin: 0 !important;
}

:deep(.swal2-actions) {
  padding: 1rem !important;
  border-top: 1px solid #e5e7eb !important;
  margin: 0 !important;
}

:deep(.swal2-confirm),
:deep(.swal2-cancel) {
  font-weight: 600 !important;
  padding: 0.75rem 1.5rem !important;
  border-radius: 8px !important;
  font-size: 0.9rem !important;
  transition: all 0.3s ease !important;
}

:deep(.swal2-confirm:hover) {
  transform: translateY(-2px) !important;
  box-shadow: 0 4px 12px rgba(220, 38, 38, 0.3) !important;
}

:deep(.swal2-cancel:hover) {
  transform: translateY(-2px) !important;
  box-shadow: 0 4px 12px rgba(107, 114, 128, 0.3) !important;
}
</style>

