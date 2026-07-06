<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
const router = useRouter();
import { enviarDatosPorPost, eliminarDatos, obtenerIdsSeleccionados, borrarTodoslosDatos, lenguajeDataTable, nfecha, arrayToObjetoFromTabla, peticionesFetch, encryptarPassword, envioElectron, mensajetoast, crearTablaSiNoExiste, peticiones, lasMayusculas,peticionesFetchOffline,arrayToObjetoFromTablaOffline,
crearTablaSiNoExisteOffline, formatoMonedaRD } from '@/funciones/funciones.js';
import Swal from 'sweetalert2'
import { useToast } from "primevue/usetoast";
import html2pdf from 'html2pdf.js';
const toast = useToast();
/************************************************************************/
const usuarioLocal = ref({})
/************************************************************************/
const camposArray = ["nombre","cedula","telefono","email","password","direccion","whatsapp","genero","estado_civil","apodo","fecha_nacimiento","edad","empresa","cargo","telefono_empresa","direccion_empresa","codigo","n_comercial","rnc","imagen","activo","limite_credito","ruta","usuario","puntos","updated_at","created_at","zona","delivery"];
/************************************************************************/
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
/************************************************************************/
const selectedItems = ref([]);
/************************************************************************/
const visible = ref(false);
const visiblecrear = ref(false);
const value = ref(null);
const id = ref(null);
const datoscampos = ref({});
const data = ref([]);
const searchQuery = ref('');
const ClientesEditar = ref(null);
const datoscamposClientes = ref({});
/************************************************************************/
async function limpiarCamposCrear() {
datoscamposClientes.value = {}
await campos();
}
/************************************************************************/
const fetchAndSetupData = async () => {
const response = await peticionesFetchOffline('getDataAsArray', 'clientes');
    const jsonData = response.filter(cliente=>cliente.codigo != '0000000');
    data.value = jsonData.reverse();
};
/************************************************************************/
async function campos() {
  const campos = await arrayToObjetoFromTablaOffline('clientes');
  datoscamposClientes.value = campos;
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
await crearTablaSiNoExisteOffline('clientes', camposArray,toast);
usuarioLocal.value = datosEmpresa.usuario;
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
                    const envioDatos = await peticionesFetchOffline('deleteAll', 'clientes');
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
                                const envioDatos = await peticionesFetchOffline('deleteEntry','clientes', id);
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
const itemsClientes = ref([]);
const menu = ref(null);
const currentRowData = ref(null);

// ✅ Variables para el historial de facturas
const visibleHistorialFacturas = ref(false);
const fechasFacturas = ref(null);
const clienteSeleccionado = ref(null);

// ✅ Variables para el historial de cotizaciones
const visibleHistorialCotizaciones = ref(false);
const fechasCotizaciones = ref(null);

// ✅ Función para abrir modal de historial de facturas
const abrirHistorialFacturas = () => {
  clienteSeleccionado.value = currentRowData.value;

  // Establecer fechas por defecto (último mes)
  const hoy = new Date();
  const haceUnMes = new Date(hoy.getFullYear(), hoy.getMonth() - 1, hoy.getDate());
  fechasFacturas.value = [haceUnMes, hoy];

  visibleHistorialFacturas.value = true;
};

// ✅ Función para abrir modal de historial de cotizaciones
const abrirHistorialCotizaciones = () => {
  clienteSeleccionado.value = currentRowData.value;

  // Establecer fechas por defecto (último mes)
  const hoy = new Date();
  const haceUnMes = new Date(hoy.getFullYear(), hoy.getMonth() - 1, hoy.getDate());
  fechasCotizaciones.value = [haceUnMes, hoy];

  visibleHistorialCotizaciones.value = true;
};

const abrirHistorialCuentasCobrar = () => {
  const cliente = currentRowData.value;
  const criterio = cliente?.codigo || cliente?.cedula || cliente?.rnc || '';

  router.push({
    path: '/historial-facturas-cliente',
    query: { cliente: criterio }
  });
};

// ✅ Función para generar PDF de facturas
const generarPDFFacturas = async () => {
  if (!fechasFacturas.value || !fechasFacturas.value[0] || !fechasFacturas.value[1]) {
    toast.add({ severity: 'warn', summary: 'Advertencia', detail: 'Selecciona un rango de fechas válido', life: 3000 });
    return;
  }

  const fechaDesde = fechasFacturas.value[0].toISOString().split('T')[0];
  const fechaHasta = fechasFacturas.value[1].toISOString().split('T')[0];

  visibleHistorialFacturas.value = false;
  await generarPDFHistorialFacturas(fechaDesde, fechaHasta);
};

// ✅ Función para generar PDF de cotizaciones
const generarPDFCotizaciones = async () => {
  if (!fechasCotizaciones.value || !fechasCotizaciones.value[0] || !fechasCotizaciones.value[1]) {
    toast.add({ severity: 'warn', summary: 'Advertencia', detail: 'Selecciona un rango de fechas válido', life: 3000 });
    return;
  }

  const fechaDesde = fechasCotizaciones.value[0].toISOString().split('T')[0];
  const fechaHasta = fechasCotizaciones.value[1].toISOString().split('T')[0];

  visibleHistorialCotizaciones.value = false;
  await generarPDFHistorialCotizaciones(fechaDesde, fechaHasta);
};

// ✅ Función para generar PDF del historial de facturas
const generarPDFHistorialFacturas = async (fechaDesde, fechaHasta) => {
  try {
    // Mostrar loading
    Swal.fire({
      title: 'Generando PDF...',
      html: 'Por favor espera',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    // Obtener facturas usando getRowsByTimestampRange
    let facturas = await peticionesFetchOffline(
      'getRowsByTimestampRange',
      'facturas',
      'created_at',
      `${fechaDesde} 00:00:00`,
      `${fechaHasta} 23:59:59`
    );

    // Filtrar por código o nombre del cliente
    facturas = facturas.filter(factura =>
      factura.cod_cliente === clienteSeleccionado.value.codigo ||
      factura.nombre_cliente === clienteSeleccionado.value.nombre
    );

    if (facturas.length === 0) {
      Swal.fire({
        icon: 'info',
        title: 'Sin Resultados',
        text: 'No se encontraron facturas en el rango de fechas seleccionado',
      });
      return;
    }

    // Calcular totales
    const totales = facturas.reduce((acc, factura) => {
      acc.subtotal += parseFloat(factura.subtotal || 0);
      acc.impuesto += parseFloat(factura.impuesto || 0);
      acc.descuento += parseFloat(factura.descuento || 0);
      acc.total += parseFloat(factura.total || 0);
      acc.ganancia += parseFloat(factura.ganancia || 0);
      return acc;
    }, { subtotal: 0, impuesto: 0, descuento: 0, total: 0, ganancia: 0 });

    // Generar HTML del PDF
    const htmlPDF = await generarHTMLHistorialFacturas(facturas, totales, fechaDesde, fechaHasta);

    // Convertir a PDF y obtener blob
    const opt = {
      margin: 10,
      filename: `historial_facturas_${clienteSeleccionado.value.codigo}_${fechaDesde}_${fechaHasta}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'mm', format: 'letter', orientation: 'portrait' }
    };

    const pdfBlob = await html2pdf().set(opt).from(htmlPDF).output('blob');
    const pdfUrl = URL.createObjectURL(pdfBlob);

    // Mostrar PDF embebido en SweetAlert
    Swal.fire({
      title: `Historial de Facturas - ${clienteSeleccionado.value.nombre}`,
      html: `
        <div style="width: 100%; height: 600px;">
          <iframe src="${pdfUrl}" style="width: 100%; height: 100%; border: none;"></iframe>
        </div>
      `,
      width: '90%',
      showCloseButton: true,
      showCancelButton: true,
      confirmButtonText: 'Descargar PDF',
      cancelButtonText: 'Cerrar',
      didOpen: () => {
        // Cleanup URL on close
        const modal = Swal.getPopup();
        modal.addEventListener('hidden.bs.modal', () => {
          URL.revokeObjectURL(pdfUrl);
        });
      }
    }).then((result) => {
      if (result.isConfirmed) {
        // Descargar el PDF
        const link = document.createElement('a');
        link.href = pdfUrl;
        link.download = opt.filename;
        link.click();
      }
      URL.revokeObjectURL(pdfUrl);
    });

  } catch (error) {
    console.error('Error al generar PDF:', error);
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: 'Hubo un error al generar el PDF del historial',
    });
  }
};

// ✅ Función para generar PDF del historial de cotizaciones
const generarPDFHistorialCotizaciones = async (fechaDesde, fechaHasta) => {
  try {
    // Mostrar loading
    Swal.fire({
      title: 'Generando PDF...',
      html: 'Por favor espera',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    // Obtener cotizaciones usando getRowsByTimestampRange
    let cotizaciones = await peticionesFetchOffline(
      'getRowsByTimestampRange',
      'cotizacion',
      'created_at',
      `${fechaDesde} 00:00:00`,
      `${fechaHasta} 23:59:59`
    );

    // Filtrar por código o nombre del cliente
    cotizaciones = cotizaciones.filter(cotizacion =>
      cotizacion.cod_cliente === clienteSeleccionado.value.codigo ||
      cotizacion.nombre_cliente === clienteSeleccionado.value.nombre
    );

    if (cotizaciones.length === 0) {
      Swal.fire({
        icon: 'info',
        title: 'Sin Resultados',
        text: 'No se encontraron cotizaciones en el rango de fechas seleccionado',
      });
      return;
    }

    // Calcular totales
    const totales = cotizaciones.reduce((acc, cotizacion) => {
      acc.subtotal += parseFloat(cotizacion.subtotal || 0);
      acc.impuesto += parseFloat(cotizacion.impuesto || 0);
      acc.descuento += parseFloat(cotizacion.descuento || 0);
      acc.total += parseFloat(cotizacion.total || 0);
      return acc;
    }, { subtotal: 0, impuesto: 0, descuento: 0, total: 0 });

    // Generar HTML del PDF
    const htmlPDF = await generarHTMLHistorialCotizaciones(cotizaciones, totales, fechaDesde, fechaHasta);

    // Convertir a PDF y obtener blob
    const opt = {
      margin: 10,
      filename: `historial_cotizaciones_${clienteSeleccionado.value.codigo}_${fechaDesde}_${fechaHasta}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'mm', format: 'letter', orientation: 'portrait' }
    };

    const pdfBlob = await html2pdf().set(opt).from(htmlPDF).output('blob');
    const pdfUrl = URL.createObjectURL(pdfBlob);

    // Mostrar PDF embebido en SweetAlert
    Swal.fire({
      title: `Historial de Cotizaciones - ${clienteSeleccionado.value.nombre}`,
      html: `
        <div style="width: 100%; height: 600px;">
          <iframe src="${pdfUrl}" style="width: 100%; height: 100%; border: none;"></iframe>
        </div>
      `,
      width: '90%',
      showCloseButton: true,
      showCancelButton: true,
      confirmButtonText: 'Descargar PDF',
      cancelButtonText: 'Cerrar',
      didOpen: () => {
        // Cleanup URL on close
        const modal = Swal.getPopup();
        modal.addEventListener('hidden.bs.modal', () => {
          URL.revokeObjectURL(pdfUrl);
        });
      }
    }).then((result) => {
      if (result.isConfirmed) {
        // Descargar el PDF
        const link = document.createElement('a');
        link.href = pdfUrl;
        link.download = opt.filename;
        link.click();
      }
      URL.revokeObjectURL(pdfUrl);
    });

  } catch (error) {
    console.error('Error al generar PDF:', error);
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: 'Hubo un error al generar el PDF del historial',
    });
  }
};

// ✅ Función para generar HTML del historial de facturas
const generarHTMLHistorialFacturas = async (facturas, totales, fechaDesde, fechaHasta) => {
  const empresa = datosEmpresa.empresa;

  // Generar filas de facturas
  const filasFacturas = facturas.map((factura, index) => `
    <tr style="border-bottom: 1px solid #e2e8f0;">
      <td style="padding: 8px; text-align: center;">${index + 1}</td>
      <td style="padding: 8px; text-align: center;">${factura.no_factura}</td>
      <td style="padding: 8px; text-align: center;">${factura.fecha_emision?.split('T')[0] || factura.fecha_emision}</td>
      <td style="padding: 8px;">${factura.tipo_factura}</td>
      <td style="padding: 8px; text-align: center;">${factura.metodo_pago}</td>
      <td style="padding: 8px; text-align: right;">${formatoMonedaRD ? formatoMonedaRD(factura.subtotal) : '$' + parseFloat(factura.subtotal || 0).toFixed(2)}</td>
      <td style="padding: 8px; text-align: right;">${formatoMonedaRD ? formatoMonedaRD(factura.impuesto) : '$' + parseFloat(factura.impuesto || 0).toFixed(2)}</td>
      <td style="padding: 8px; text-align: right;">${formatoMonedaRD ? formatoMonedaRD(factura.descuento) : '$' + parseFloat(factura.descuento || 0).toFixed(2)}</td>
      <td style="padding: 8px; text-align: right; font-weight: bold;">${formatoMonedaRD ? formatoMonedaRD(factura.total) : '$' + parseFloat(factura.total || 0).toFixed(2)}</td>
    </tr>
  `).join('');

  return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Historial de Facturas</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        body {
          font-family: Arial, sans-serif;
          padding: 20px;
          font-size: 12px;
        }
        .header {
          text-align: center;
          margin-bottom: 30px;
          border-bottom: 3px solid #667eea;
          padding-bottom: 20px;
        }
        .header h1 {
          color: #667eea;
          font-size: 24px;
          margin-bottom: 5px;
        }
        .header p {
          color: #64748b;
          margin: 3px 0;
        }
        .info-section {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          margin-bottom: 30px;
          background: #f8fafc;
          padding: 15px;
          border-radius: 8px;
          border: 1px solid #e2e8f0;
        }
        .info-box h3 {
          color: #667eea;
          font-size: 14px;
          margin-bottom: 10px;
          border-bottom: 2px solid #667eea;
          padding-bottom: 5px;
        }
        .info-box p {
          margin: 5px 0;
          color: #475569;
        }
        .info-box strong {
          color: #1e293b;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 20px;
          background: white;
        }
        thead {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
        }
        th {
          padding: 12px 8px;
          text-align: left;
          font-weight: 600;
          font-size: 11px;
          text-transform: uppercase;
        }
        td {
          padding: 8px;
          font-size: 11px;
        }
        tbody tr:nth-child(even) {
          background-color: #f8fafc;
        }
        .totales {
          background: #f8fafc;
          padding: 20px;
          border-radius: 8px;
          border: 2px solid #667eea;
          margin-top: 20px;
        }
        .totales h3 {
          color: #667eea;
          margin-bottom: 15px;
          font-size: 16px;
        }
        .totales-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
        }
        .total-item {
          display: flex;
          justify-content: space-between;
          padding: 8px;
          background: white;
          border-radius: 4px;
          border: 1px solid #e2e8f0;
        }
        .total-item.grand-total {
          grid-column: 1 / -1;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          font-size: 16px;
          font-weight: bold;
          padding: 12px;
        }
        .total-label {
          font-weight: 600;
          color: #475569;
        }
        .total-value {
          font-weight: bold;
          color: #1e293b;
        }
        .footer {
          margin-top: 30px;
          text-align: center;
          color: #64748b;
          font-size: 10px;
          padding-top: 20px;
          border-top: 1px solid #e2e8f0;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>${empresa?.nombre || 'EMPRESA'}</h1>
        <p>${empresa?.legal || ''}</p>
        <p>${empresa?.telefono || ''} | ${empresa?.email || ''}</p>
        <p>${empresa?.direccion || ''}</p>
      </div>

      <div style="text-align: center; margin-bottom: 20px;">
        <h2 style="color: #1e293b; font-size: 20px; margin-bottom: 5px;">HISTORIAL DE FACTURAS</h2>
        <p style="color: #64748b;">Período: ${fechaDesde} - ${fechaHasta}</p>
      </div>

      <div class="info-section">
        <div class="info-box">
          <h3>Información del Cliente</h3>
          <p><strong>Código:</strong> ${clienteSeleccionado.value.codigo}</p>
          <p><strong>Nombre:</strong> ${clienteSeleccionado.value.nombre}</p>
          <p><strong>Cédula/RNC:</strong> ${clienteSeleccionado.value.cedula || clienteSeleccionado.value.rnc || 'N/A'}</p>
          <p><strong>Teléfono:</strong> ${clienteSeleccionado.value.telefono || 'N/A'}</p>
        </div>
        <div class="info-box">
          <h3>Resumen del Período</h3>
          <p><strong>Total de Facturas:</strong> ${facturas.length}</p>
          <p><strong>Fecha de Generación:</strong> ${new Date().toLocaleDateString()}</p>
          <p><strong>Generado por:</strong> ${usuarioLocal.value?.nombre || 'Sistema'}</p>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th style="text-align: center;">#</th>
            <th style="text-align: center;">No. Factura</th>
            <th style="text-align: center;">Fecha</th>
            <th>Tipo/NCF</th>
            <th style="text-align: center;">Método Pago</th>
            <th style="text-align: right;">Subtotal</th>
            <th style="text-align: right;">Impuesto</th>
            <th style="text-align: right;">Descuento</th>
            <th style="text-align: right;">Total</th>
          </tr>
        </thead>
        <tbody>
          ${filasFacturas}
        </tbody>
      </table>

      <div class="totales">
        <h3>TOTALES DEL PERÍODO</h3>
        <div class="totales-grid">
          <div class="total-item">
            <span class="total-label">Subtotal:</span>
            <span class="total-value">${formatoMonedaRD ? formatoMonedaRD(totales.subtotal) : '$' + totales.subtotal.toFixed(2)}</span>
          </div>
          <div class="total-item">
            <span class="total-label">Impuestos:</span>
            <span class="total-value">${formatoMonedaRD ? formatoMonedaRD(totales.impuesto) : '$' + totales.impuesto.toFixed(2)}</span>
          </div>
          <div class="total-item">
            <span class="total-label">Descuentos:</span>
            <span class="total-value">${formatoMonedaRD ? formatoMonedaRD(totales.descuento) : '$' + totales.descuento.toFixed(2)}</span>
          </div>
          <div class="total-item">
            <span class="total-label">Ganancia:</span>
            <span class="total-value">${formatoMonedaRD ? formatoMonedaRD(totales.ganancia) : '$' + totales.ganancia.toFixed(2)}</span>
          </div>
          <div class="total-item grand-total">
            <span>TOTAL GENERAL:</span>
            <span>${formatoMonedaRD ? formatoMonedaRD(totales.total) : '$' + totales.total.toFixed(2)}</span>
          </div>
        </div>
      </div>

      <div class="footer">
        <p>Documento generado automáticamente - ${new Date().toLocaleString()}</p>
        <p>${empresa?.nombre || 'Sistema de Gestión'}</p>
      </div>
    </body>
    </html>
  `;
};

// ✅ Función para generar HTML del historial de cotizaciones
const generarHTMLHistorialCotizaciones = async (cotizaciones, totales, fechaDesde, fechaHasta) => {
  const empresa = datosEmpresa.empresa;

  // Generar filas de cotizaciones
  const filasCotizaciones = cotizaciones.map((cotizacion, index) => `
    <tr style="border-bottom: 1px solid #e2e8f0;">
      <td style="padding: 8px; text-align: center;">${index + 1}</td>
      <td style="padding: 8px; text-align: center;">${cotizacion.no_cotizacion}</td>
      <td style="padding: 8px; text-align: center;">${cotizacion.fecha_emision?.split('T')[0] || cotizacion.fecha_emision}</td>
      <td style="padding: 8px; text-align: center;">
        <span style="padding: 4px 8px; border-radius: 4px; font-size: 10px; font-weight: 600;
          ${cotizacion.estado_cotizacion === 'PENDIENTE' ? 'background: #fef3c7; color: #92400e;' :
            cotizacion.estado_cotizacion === 'APROBADA' ? 'background: #d1fae5; color: #065f46;' :
            cotizacion.estado_cotizacion === 'FACTURADA' ? 'background: #dbeafe; color: #1e40af;' :
            'background: #fee2e2; color: #991b1b;'}">
          ${cotizacion.estado_cotizacion}
        </span>
      </td>
      <td style="padding: 8px; text-align: center;">${cotizacion.metodo_pago}</td>
      <td style="padding: 8px; text-align: right;">${formatoMonedaRD ? formatoMonedaRD(cotizacion.subtotal) : '$' + parseFloat(cotizacion.subtotal || 0).toFixed(2)}</td>
      <td style="padding: 8px; text-align: right;">${formatoMonedaRD ? formatoMonedaRD(cotizacion.impuesto) : '$' + parseFloat(cotizacion.impuesto || 0).toFixed(2)}</td>
      <td style="padding: 8px; text-align: right;">${formatoMonedaRD ? formatoMonedaRD(cotizacion.descuento) : '$' + parseFloat(cotizacion.descuento || 0).toFixed(2)}</td>
      <td style="padding: 8px; text-align: right; font-weight: bold;">${formatoMonedaRD ? formatoMonedaRD(cotizacion.total) : '$' + parseFloat(cotizacion.total || 0).toFixed(2)}</td>
    </tr>
  `).join('');

  return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Historial de Cotizaciones</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        body {
          font-family: Arial, sans-serif;
          padding: 20px;
          font-size: 12px;
        }
        .header {
          text-align: center;
          margin-bottom: 30px;
          border-bottom: 3px solid #f59e0b;
          padding-bottom: 20px;
        }
        .header h1 {
          color: #f59e0b;
          font-size: 24px;
          margin-bottom: 5px;
        }
        .header p {
          color: #64748b;
          margin: 3px 0;
        }
        .info-section {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          margin-bottom: 30px;
          background: #fffbeb;
          padding: 15px;
          border-radius: 8px;
          border: 1px solid #fde68a;
        }
        .info-box h3 {
          color: #f59e0b;
          font-size: 14px;
          margin-bottom: 10px;
          border-bottom: 2px solid #f59e0b;
          padding-bottom: 5px;
        }
        .info-box p {
          margin: 5px 0;
          color: #475569;
        }
        .info-box strong {
          color: #1e293b;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 20px;
          background: white;
        }
        thead {
          background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
          color: white;
        }
        th {
          padding: 12px 8px;
          text-align: left;
          font-weight: 600;
          font-size: 11px;
          text-transform: uppercase;
        }
        td {
          padding: 8px;
          font-size: 11px;
        }
        tbody tr:nth-child(even) {
          background-color: #fffbeb;
        }
        .totales {
          background: #fffbeb;
          padding: 20px;
          border-radius: 8px;
          border: 2px solid #f59e0b;
          margin-top: 20px;
        }
        .totales h3 {
          color: #f59e0b;
          margin-bottom: 15px;
          font-size: 16px;
        }
        .totales-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
        }
        .total-item {
          display: flex;
          justify-content: space-between;
          padding: 8px;
          background: white;
          border-radius: 4px;
          border: 1px solid #fde68a;
        }
        .total-item.grand-total {
          grid-column: 1 / -1;
          background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
          color: white;
          font-size: 16px;
          font-weight: bold;
          padding: 12px;
        }
        .total-label {
          font-weight: 600;
          color: #92400e;
        }
        .total-value {
          font-weight: bold;
          color: #78350f;
        }
        .footer {
          margin-top: 30px;
          text-align: center;
          color: #64748b;
          font-size: 10px;
          padding-top: 20px;
          border-top: 1px solid #fde68a;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>${empresa?.nombre || 'EMPRESA'}</h1>
        <p>${empresa?.legal || ''}</p>
        <p>${empresa?.telefono || ''} | ${empresa?.email || ''}</p>
        <p>${empresa?.direccion || ''}</p>
      </div>

      <div style="text-align: center; margin-bottom: 20px;">
        <h2 style="color: #1e293b; font-size: 20px; margin-bottom: 5px;">HISTORIAL DE COTIZACIONES</h2>
        <p style="color: #64748b;">Período: ${fechaDesde} - ${fechaHasta}</p>
      </div>

      <div class="info-section">
        <div class="info-box">
          <h3>Información del Cliente</h3>
          <p><strong>Código:</strong> ${clienteSeleccionado.value.codigo}</p>
          <p><strong>Nombre:</strong> ${clienteSeleccionado.value.nombre}</p>
          <p><strong>Cédula/RNC:</strong> ${clienteSeleccionado.value.cedula || clienteSeleccionado.value.rnc || 'N/A'}</p>
          <p><strong>Teléfono:</strong> ${clienteSeleccionado.value.telefono || 'N/A'}</p>
        </div>
        <div class="info-box">
          <h3>Resumen del Período</h3>
          <p><strong>Total de Cotizaciones:</strong> ${cotizaciones.length}</p>
          <p><strong>Fecha de Generación:</strong> ${new Date().toLocaleDateString()}</p>
          <p><strong>Generado por:</strong> ${usuarioLocal.value?.nombre || 'Sistema'}</p>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th style="text-align: center;">#</th>
            <th style="text-align: center;">No. Cotización</th>
            <th style="text-align: center;">Fecha</th>
            <th style="text-align: center;">Estado</th>
            <th style="text-align: center;">Método Pago</th>
            <th style="text-align: right;">Subtotal</th>
            <th style="text-align: right;">Impuesto</th>
            <th style="text-align: right;">Descuento</th>
            <th style="text-align: right;">Total</th>
          </tr>
        </thead>
        <tbody>
          ${filasCotizaciones}
        </tbody>
      </table>

      <div class="totales">
        <h3>TOTALES DEL PERÍODO</h3>
        <div class="totales-grid">
          <div class="total-item">
            <span class="total-label">Subtotal:</span>
            <span class="total-value">${formatoMonedaRD ? formatoMonedaRD(totales.subtotal) : '$' + totales.subtotal.toFixed(2)}</span>
          </div>
          <div class="total-item">
            <span class="total-label">Impuestos:</span>
            <span class="total-value">${formatoMonedaRD ? formatoMonedaRD(totales.impuesto) : '$' + totales.impuesto.toFixed(2)}</span>
          </div>
          <div class="total-item">
            <span class="total-label">Descuentos:</span>
            <span class="total-value">${formatoMonedaRD ? formatoMonedaRD(totales.descuento) : '$' + totales.descuento.toFixed(2)}</span>
          </div>
          <div class="total-item grand-total">
            <span>TOTAL GENERAL:</span>
            <span>${formatoMonedaRD ? formatoMonedaRD(totales.total) : '$' + totales.total.toFixed(2)}</span>
          </div>
        </div>
      </div>

      <div class="footer">
        <p>Documento generado automáticamente - ${new Date().toLocaleString()}</p>
        <p>${empresa?.nombre || 'Sistema de Gestión'}</p>
      </div>
    </body>
    </html>
  `;
};

const toggleClientes = (event, rowData) => {
currentRowData.value = rowData;
itemsClientes.value = [
{ label: 'Editar', icon: 'pi pi-pencil', command: () => {
router.push({ path: `/editarclientes/${currentRowData.value.id}` });
} },
{ label: 'Historial Facturas', icon: 'pi pi-file', command: () => {
  abrirHistorialFacturas();
} },
{ label: 'Historial Cotizaciones', icon: 'pi pi-file-edit', command: () => {
  abrirHistorialCotizaciones();
} },
{ label: 'Historial CxC', icon: 'pi pi-wallet', command: () => {
  abrirHistorialCuentasCobrar();
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
                        const datosFactura = await peticionesFetchOffline('deleteEntry','clientes', currentRowData.value.id);
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
const filteredClientes = computed(() => {
if (!searchQuery.value) return data.value;
return data.value.filter(busqueda => {
  return Object.values(busqueda).some(value =>
    String(value).toLowerCase().includes(searchQuery.value.toLowerCase())
   );
  });
});
/************************************************************************/
const editUser = (user) => {
    toast.add({ severity: 'info', summary: 'Editar', detail: `Editando cliente: ${user.nombre}`, life: 3000 });
   router.push({ path: `/editarclientes/${user.id}` });
};

const deleteUser = (user) => {
    toast.add({ severity: 'warn', summary: 'Eliminar', detail: `Eliminando Cliente: ${user.nombre}`, life: 3000 });

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
                        const datosFactura = await peticionesFetchOffline('deleteEntry','clientes', user.id);
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

};
/************************************************************************/
// Computed statistics
const totalClientes = computed(() => data.value.length);
const clientesActivos = computed(() => data.value.filter(c => c.activo === 'ON').length);
const clientesInactivos = computed(() => data.value.filter(c => c.activo === 'OFF').length);
const totalLimiteCredito = computed(() => {
  return data.value.reduce((sum, cliente) => sum + parseFloat(cliente.limite_credito || 0), 0).toFixed(2);
});
/************************************************************************/
</script>
<template>
  <main class="clientes-wrapper">
    <div class="w-full px-4 py-6">
      <!-- Header Section -->
      <div class="header-section">
        <div class="header-content">
          <div class="header-icon">
            <i class="pi pi-users"></i>
          </div>
          <div class="header-text">
            <h1 class="header-title">Gestión de Clientes</h1>
            <p class="header-description">Administra tu cartera de clientes, información de contacto y límites de crédito</p>
          </div>
        </div>
      </div>

      <!-- Stats Cards -->
      <div class="stats-grid">
        <div class="stat-card stat-total">
          <div class="stat-icon">
            <i class="pi pi-users"></i>
          </div>
          <div class="stat-content">
            <div class="stat-label">Total Clientes</div>
            <div class="stat-value">{{ totalClientes }}</div>
          </div>
        </div>

        <div class="stat-card stat-active">
          <div class="stat-icon">
            <i class="pi pi-check-circle"></i>
          </div>
          <div class="stat-content">
            <div class="stat-label">Clientes Activos</div>
            <div class="stat-value">{{ clientesActivos }}</div>
          </div>
        </div>

        <div class="stat-card stat-inactive">
          <div class="stat-icon">
            <i class="pi pi-times-circle"></i>
          </div>
          <div class="stat-content">
            <div class="stat-label">Clientes Inactivos</div>
            <div class="stat-value">{{ clientesInactivos }}</div>
          </div>
        </div>

        <div class="stat-card stat-credit">
          <div class="stat-icon">
            <i class="pi pi-dollar"></i>
          </div>
          <div class="stat-content">
            <div class="stat-label">Límite Crédito Total</div>
            <div class="stat-value">${{ totalLimiteCredito }}</div>
          </div>
        </div>
      </div>

      <!-- Actions Card -->
      <Card class="actions-card">
        <template #content>
          <div class="actions-grid">
            <Button
              icon="pi pi-refresh"
              label="Recargar"
              severity="warning"
              @click="fetchAndSetupData"
              class="action-btn"
            />
            <router-link to="/crearclientes">
              <Button
                icon="pi pi-plus"
                label="Nuevo Cliente"
                severity="success"
                class="action-btn"
              />
            </router-link>
            <Button
              icon="pi pi-trash"
              label="Borrar Selección"
              severity="danger"
              class="action-btn"
              @click="borrarSeleccionados"
            />
            <Button
              v-if="usuarioLocal.usuario === 'Soporte'"
              icon="pi pi-times"
              label="Borrar Todo"
              severity="danger"
              class="action-btn"
              @click="borrarTodo"
            />
          </div>
        </template>
      </Card>

      <!-- Main Content Card -->
      <Card class="content-card">
        <template #content>
          <div class="search-section">
            <IconField iconPosition="left" class="search-field">
              <InputIcon class="pi pi-search" />
              <InputText
                v-model="searchQuery"
                placeholder="Buscar clientes por nombre, cédula, teléfono, email..."
                class="search-input"
              />
            </IconField>
          </div>

          <DataTable
            :value="filteredClientes"
            scrollable
            scrollHeight="600px"
            dataKey="id"
            paginator
            :rows="10"
            v-model:selection="selectedItems"
            size="small"
            resizableColumns
            columnResizeMode="fit"
            :rowsPerPageOptions="[5, 10, 20, 50]"
            class="modern-datatable"
          >
            <Column selectionMode="multiple" headerStyle="width: 3rem" />
            <Column header="Opciones" frozen style="min-width: 100px">
              <template #body="slotProps">
                <Button
                  icon="pi pi-cog"
                  size="small"
                  severity="secondary"
                  @click="toggleClientes($event, slotProps.data)"
                  aria-haspopup="true"
                  aria-controls="overlay_menu_factura"
                />
                <Menu
                  ref="menu"
                  id="overlay_menu_Clientes"
                  :model="itemsClientes"
                  :popup="true"
                />
              </template>
            </Column>

            <Column field="codigo" header="Código" style="min-width: 120px">
              <template #body="slotProps">
                <div class="codigo-badge">
                  <i class="pi pi-hashtag mr-2"></i>
                  {{ slotProps.data.codigo }}
                </div>
              </template>
            </Column>

            <Column field="nombre" header="Nombre" style="min-width: 200px">
              <template #body="slotProps">
                <div class="nombre-cell">
                  <i class="pi pi-user mr-2 text-blue-500"></i>
                  <span class="font-semibold">{{ slotProps.data.nombre }}</span>
                </div>
              </template>
            </Column>

            <Column field="cedula" header="Cédula" style="min-width: 150px">
              <template #body="slotProps">
                <div class="info-cell">
                  <i class="pi pi-id-card mr-2 text-purple-500"></i>
                  {{ slotProps.data.cedula }}
                </div>
              </template>
            </Column>

            <Column field="telefono" header="Teléfono" style="min-width: 150px">
              <template #body="slotProps">
                <div class="info-cell">
                  <i class="pi pi-phone mr-2 text-green-500"></i>
                  {{ slotProps.data.telefono }}
                </div>
              </template>
            </Column>

            <Column field="email" header="Email" style="min-width: 200px">
              <template #body="slotProps">
                <div class="info-cell">
                  <i class="pi pi-envelope mr-2 text-orange-500"></i>
                  {{ slotProps.data.email }}
                </div>
              </template>
            </Column>

            <Column field="direccion" header="Dirección" style="min-width: 250px" />

            <Column field="whatsapp" header="WhatsApp" style="min-width: 150px">
              <template #body="slotProps">
                <div class="info-cell">
                  <i class="pi pi-whatsapp mr-2 text-green-600"></i>
                  {{ slotProps.data.whatsapp }}
                </div>
              </template>
            </Column>

            <Column field="genero" header="Género" style="min-width: 100px">
              <template #body="slotProps">
                <Tag
                  :value="slotProps.data.genero"
                  :severity="slotProps.data.genero === 'HOMBRE' ? 'info' : slotProps.data.genero === 'MUJER' ? 'success' : 'secondary'"
                />
              </template>
            </Column>

            <Column field="estado_civil" header="Estado Civil" style="min-width: 130px">
              <template #body="slotProps">
                <Tag :value="slotProps.data.estado_civil" severity="secondary" />
              </template>
            </Column>

            <Column field="limite_credito" header="Límite Crédito" style="min-width: 150px">
              <template #body="slotProps">
                <div class="credito-badge">
                  <i class="pi pi-dollar mr-2"></i>
                  ${{ parseFloat(slotProps.data.limite_credito || 0).toFixed(2) }}
                </div>
              </template>
            </Column>

            <Column field="activo" header="Estado" style="min-width: 100px">
              <template #body="slotProps">
                <Tag
                  :value="slotProps.data.activo"
                  :severity="slotProps.data.activo === 'ON' ? 'success' : 'danger'"
                  :icon="slotProps.data.activo === 'ON' ? 'pi pi-check' : 'pi pi-times'"
                />
              </template>
            </Column>

            <Column field="apodo" header="Apodo" style="min-width: 120px" />
            <Column field="fecha_nacimiento" header="Fecha Nacimiento" style="min-width: 150px" />
            <Column field="edad" header="Edad" style="min-width: 80px" />
            <Column field="empresa" header="Empresa" style="min-width: 200px" />
            <Column field="cargo" header="Cargo" style="min-width: 150px" />
            <Column field="telefono_empresa" header="Teléfono Empresa" style="min-width: 150px" />
            <Column field="direccion_empresa" header="Dirección Empresa" style="min-width: 250px" />
            <Column field="n_comercial" header="Nombre Comercial" style="min-width: 200px" />
            <Column field="rnc" header="RNC" style="min-width: 150px" />
          </DataTable>
        </template>
      </Card>

      <!-- Modal para Historial de Facturas -->
      <Dialog
        v-model:visible="visibleHistorialFacturas"
        modal
        header="Historial de Facturas"
        :style="{ width: '500px' }"
        :draggable="false"
      >
        <div class="flex flex-column gap-3 py-4">
          <div class="flex flex-column gap-2">
            <label for="fechas-facturas" class="font-semibold">Selecciona el rango de fechas:</label>
            <Calendar
              id="fechas-facturas"
              v-model="fechasFacturas"
              selectionMode="range"
              :manualInput="false"
              dateFormat="yy-mm-dd"
              showIcon
              showButtonBar
              :showOnFocus="false"
            />
          </div>
          <div class="text-sm text-gray-600" v-if="fechasFacturas && fechasFacturas[0] && fechasFacturas[1]">
            <i class="pi pi-info-circle mr-2"></i>
            Se generará el PDF con facturas desde <strong>{{ fechasFacturas[0].toLocaleDateString() }}</strong> hasta <strong>{{ fechasFacturas[1].toLocaleDateString() }}</strong>
          </div>
        </div>
        <template #footer>
          <Button label="Cancelar" icon="pi pi-times" @click="visibleHistorialFacturas = false" text />
          <Button label="Generar PDF" icon="pi pi-file-pdf" @click="generarPDFFacturas" severity="success" />
        </template>
      </Dialog>

      <!-- Modal para Historial de Cotizaciones -->
      <Dialog
        v-model:visible="visibleHistorialCotizaciones"
        modal
        header="Historial de Cotizaciones"
        :style="{ width: '500px' }"
        :draggable="false"
      >
        <div class="flex flex-column gap-3 py-4">
          <div class="flex flex-column gap-2">
            <label for="fechas-cotizaciones" class="font-semibold">Selecciona el rango de fechas:</label>
            <Calendar
              id="fechas-cotizaciones"
              v-model="fechasCotizaciones"
              selectionMode="range"
              :manualInput="false"
              dateFormat="yy-mm-dd"
              showIcon
              showButtonBar
              :showOnFocus="false"
            />
          </div>
          <div class="text-sm text-gray-600" v-if="fechasCotizaciones && fechasCotizaciones[0] && fechasCotizaciones[1]">
            <i class="pi pi-info-circle mr-2"></i>
            Se generará el PDF con cotizaciones desde <strong>{{ fechasCotizaciones[0].toLocaleDateString() }}</strong> hasta <strong>{{ fechasCotizaciones[1].toLocaleDateString() }}</strong>
          </div>
        </div>
        <template #footer>
          <Button label="Cancelar" icon="pi pi-times" @click="visibleHistorialCotizaciones = false" text />
          <Button label="Generar PDF" icon="pi pi-file-pdf" @click="generarPDFCotizaciones" severity="warning" />
        </template>
      </Dialog>

      <Toast />
    </div>
  </main>
</template>

<style scoped>
@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.clientes-wrapper {
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  animation: slideIn 0.5s ease-out;
}

/* Header Section */
.header-section {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 16px;
  padding: 2rem;
  margin-bottom: 2rem;
  box-shadow: 0 8px 32px rgba(102, 126, 234, 0.3);
  animation: slideIn 0.5s ease-out;
}

.header-content {
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.header-icon {
  width: 80px;
  height: 80px;
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(10px);
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2.5rem;
  color: white;
  flex-shrink: 0;
}

.header-text {
  flex: 1;
}

.header-title {
  font-size: 2rem;
  font-weight: 700;
  color: white;
  margin: 0 0 0.5rem 0;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.header-description {
  font-size: 1rem;
  color: rgba(255, 255, 255, 0.9);
  margin: 0;
}

/* Stats Grid */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.stat-card {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.07);
  display: flex;
  align-items: center;
  gap: 1rem;
  transition: all 0.3s ease;
  animation: slideIn 0.5s ease-out;
}

.stat-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.12);
}

.stat-icon {
  width: 60px;
  height: 60px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.75rem;
  color: white;
  flex-shrink: 0;
}

.stat-total .stat-icon {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.stat-active .stat-icon {
  background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
}

.stat-inactive .stat-icon {
  background: linear-gradient(135deg, #eb3349 0%, #f45c43 100%);
}

.stat-credit .stat-icon {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.stat-content {
  flex: 1;
}

.stat-label {
  font-size: 0.875rem;
  color: #64748b;
  font-weight: 500;
  margin-bottom: 0.25rem;
}

.stat-value {
  font-size: 1.75rem;
  font-weight: 700;
  color: #1e293b;
  line-height: 1;
}

/* Actions Card */
.actions-card {
  margin-bottom: 2rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.07);
  border-radius: 12px;
  animation: slideIn 0.5s ease-out 0.1s backwards;
}

.actions-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
}

.action-btn {
  font-weight: 600;
}

/* Content Card */
.content-card {
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.07);
  border-radius: 12px;
  animation: slideIn 0.5s ease-out 0.2s backwards;
}

/* Search Section */
.search-section {
  margin-bottom: 1.5rem;
}

.search-field {
  width: 100%;
}

.search-input {
  width: 100%;
  border: 2px solid #e2e8f0;
  border-radius: 10px;
  padding: 0.75rem 1rem 0.75rem 2.5rem;
  font-size: 1rem;
  transition: all 0.3s ease;
}

.search-input:focus {
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

/* DataTable Styles */
.modern-datatable {
  border-radius: 8px;
  overflow: hidden;
}

.modern-datatable :deep(.p-datatable-header) {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  padding: 1rem;
}

.modern-datatable :deep(.p-datatable-thead > tr > th) {
  background: #f8fafc;
  color: #475569;
  font-weight: 600;
  border-bottom: 2px solid #e2e8f0;
  padding: 1rem;
}

.modern-datatable :deep(.p-datatable-tbody > tr) {
  transition: all 0.2s ease;
}

.modern-datatable :deep(.p-datatable-tbody > tr:hover) {
  background: #f8fafc;
}

/* Custom Cell Styles */
.codigo-badge {
  display: inline-flex;
  align-items: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  font-weight: 600;
  font-size: 0.875rem;
}

.nombre-cell {
  display: flex;
  align-items: center;
  font-size: 1rem;
}

.info-cell {
  display: flex;
  align-items: center;
}

.credito-badge {
  display: inline-flex;
  align-items: center;
  background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  font-weight: 700;
  font-size: 1rem;
}

/* Responsive Design */
@media (max-width: 768px) {
  .header-content {
    flex-direction: column;
    text-align: center;
  }

  .header-icon {
    width: 60px;
    height: 60px;
    font-size: 2rem;
  }

  .header-title {
    font-size: 1.5rem;
  }

  .stats-grid {
    grid-template-columns: 1fr;
  }

  .actions-grid {
    flex-direction: column;
  }

  .action-btn {
    width: 100%;
  }
}
</style>
