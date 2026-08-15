
<script setup>
import { ref, onMounted, nextTick, watchEffect, computed } from 'vue';
import { useToast } from "primevue/usetoast";
import { useRouter, useRoute } from 'vue-router';
const router = useRouter();
const route = useRoute(); 
import { 
nfecha, 
arrayToObjetoFromTabla,
generarTablaFromStringJSON, 
peticionesFetch,
obtenerIdsSeleccionados, 
crearTablaSiNoExiste,
encryptarPassword,
peticionesFetchOffline,
enviarDatosPorPost,
buscadorArrayObjeto,
envioElectron,
generarCodigoUnico } from '../../funciones/funciones.js';
import Swal from 'sweetalert2'
const toast = useToast();
/************************************************************************/
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
/************************************************************************/
import TablaJSON from '../../components/TablaJSON.vue'
/************************************************************************/
import flatPickr from 'vue-flatpickr-component';
import 'flatpickr/dist/flatpickr.css';
/************************************************************************/
const arrayIMG = ref([])
/************************************************************************/
  const basic = ref({
    dateFormat: 'd/m/Y',
  });
/************************************************************************/
import {useDatosEmpresa} from '../../stores'
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
const value = ref('0');
/************************************************************************/
const datoscampos = ref({})
const codigoUnico = ref(generarCodigoUnico());
const fecha = ref(nfecha('fecha'));
const position = "top";
const todosLosfinanciamientos = ref([]);
/************************************************************************/
const formatCurrency = (value) => {
  const number = parseFloat(value || 0);
  return new Intl.NumberFormat('es-DO', {
    style: 'currency',
    currency: 'DOP',
    maximumFractionDigits: 2
  }).format(Number.isNaN(number) ? 0 : number);
};
/************************************************************************/
const scoreAAVisual = computed(() => {
  const score = Math.min(Math.max(parseFloat(datoscampos.value?.score_aa || 0), 0), 100);

  if (score >= 70) {
    return {
      score,
      label: 'APTO',
      percentage: score,
      gradient: 'linear-gradient(90deg, #34d399 0%, #16a34a 100%)',
      glow: 'rgba(22, 163, 74, 0.25)',
      textClass: 'score-success',
      recommendation: 'Expediente con buena señal de aprobacion para continuar.'
    };
  }

  if (score >= 50) {
    return {
      score,
      label: 'RIESGO MEDIO',
      percentage: score,
      gradient: 'linear-gradient(90deg, #fcd34d 0%, #f59e0b 100%)',
      glow: 'rgba(245, 158, 11, 0.25)',
      textClass: 'score-warning',
      recommendation: 'Conviene revisar soportes y capacidad de pago antes de cerrar.'
    };
  }

  return {
    score,
    label: 'NO APTO',
    percentage: score,
    gradient: 'linear-gradient(90deg, #f87171 0%, #dc2626 100%)',
    glow: 'rgba(220, 38, 38, 0.25)',
    textClass: 'score-risk',
    recommendation: 'Perfil delicado. Se recomienda una revision adicional.'
  };
});
/************************************************************************/
const resumenFinanciamiento = computed(() => {
  const total = parseFloat(datoscampos.value?.monto_total || 0);
  const abonado = parseFloat(datoscampos.value?.total_abonado || 0);
  const pendiente = parseFloat(datoscampos.value?.total_pendiente || 0);
  const progresoPago = total > 0 ? Math.min(Math.round((abonado / total) * 100), 100) : 0;

  return [
    {
      label: 'Monto total',
      value: formatCurrency(total)
    },
    {
      label: 'Abonado',
      value: formatCurrency(abonado)
    },
    {
      label: 'Pendiente',
      value: formatCurrency(pendiente)
    },
    {
      label: 'Avance',
      value: `${progresoPago}%`
    }
  ];
});
/************************************************************************/
const fetchAllData = async () => {
    const response = await peticionesFetchOffline('getDataAsArray', 'financiamientos');
    const jsonData = response;
    todosLosfinanciamientos.value = response;
    datoscampos.value = jsonData.find(datos=>datos.id == route.params.id)
    datoscampos.value.fechas_pago = datoscampos.value.fechas_pago ? JSON.parse(datoscampos.value.fechas_pago) : []
    arrayIMG.value = await peticionesFetchOffline('listarArchivosDeCarpetaUrl', `financiamientos/${datoscampos.value.imagen}`);
};
/************************************************************************/
async function navigate(action) {
    const currentIndex = todosLosfinanciamientos.value.findIndex(notacredito => notacredito.id == route.params.id);
    if (currentIndex === -1) return;
    let newIndex;
    switch (action) {
        case 'primero':
            newIndex = 0;
            break;
        case 'anterior':
            newIndex = currentIndex > 0 ? currentIndex - 1 : 0;
            break;
        case 'siguiente':
            newIndex = currentIndex + 1 < todosLosfinanciamientos.value.length ? currentIndex + 1 : currentIndex;
            break;
        case 'ultimo':
            newIndex = todosLosfinanciamientos.value.length - 1;
            break;
        default:
            return;
    }
    datoscampos.value = todosLosfinanciamientos.value[newIndex];
    datoscampos.value.fechas_pago = JSON.parse(datoscampos.value.fechas_pago)
    router.push({ path: `/editarfinanciamientos/${todosLosfinanciamientos.value[newIndex].id}` });
    arrayIMG.value = await peticionesFetchOffline('listarArchivosDeCarpetaUrl', `financiamientos/${datoscampos.value.imagen}`);
}
/************************************************************************/
const datosConfig = async()=>{
    const response = await envioElectron('datosarchivo');
    datosJSON.value = response;
    link.value = response.VITE_LINKURL;
    api.value = response.VITE_LINK_API;
    token.value = response.VITE_TOKEN;
    patronTelefono.value = response.VITE_PATRON_TELEFONO;
    //linkImpresora.value = response.VITE_IMPRESORA_LOCAL;
    patroncedula.value = response.VITE_PATRON_CEDULA;
    tokenCorto.value = response.VITE_TOKEN_CORTO;
}
/************************************************************************/
onMounted(async() => {
await datosConfig()
tokenCifrado.value = await encryptarPassword(token.value, 10);
await fetchAllData()
});
/************************************************************************/
async function funcionActualizar(e) {
  if(e){
     e.preventDefault();
  }
  const url = link.value+api.value+"/actualizarcampos/financiamientos";
  if (!datoscampos.value) {
    console.error("Datos incompletos, no se puede actualizar.");
    return;
  }
  if (datoscampos.value.hasOwnProperty('created_at')) {
      datoscampos.value.updated_at = nfecha('timestamp')
    }

   datoscampos.value.fechas_pago = JSON.stringify(datoscampos.value.fechas_pago)

  const datosEnviar = JSON.parse(JSON.stringify(datoscampos.value));
  const envioDatos = await peticionesFetchOffline('updateData','financiamientos', JSON.stringify(datosEnviar));
  if (envioDatos[0] == 'ok') {
     toast.add({ severity: 'success', summary: 'Éxito', detail: 'Datos Actualizados', life: 3000 });
  }else{
    toast.add({ severity: 'error', summary: 'Error', detail: 'Fallo al actualizar los datos.', life: 3000 });
  }
}
/************************************************************************/
const fnAbonar = async () => {
  const { value: formValues } = await Swal.fire({
    title: '<span class="text-blue-600 dark:text-blue-400 text-lg font-semibold">Realizar Abono</span>',
    html: `
      <div class="grid grid-cols-1 gap-4 text-left text-gray-800 dark:text-gray-200">
        <div class="flex flex-col">
          <label for="swal-input-monto" class="text-sm font-medium mb-1">Monto a abonar</label>
          <input id="swal-input-monto" type="number" min="0" step="0.01"
            class="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white p-2 focus:ring-2 focus:ring-blue-500"
            placeholder="Ej: 2500.00" />
        </div>

        <div class="flex flex-col">
          <label for="swal-input-metodo" class="text-sm font-medium mb-1">Método de pago</label>
          <select id="swal-input-metodo"
            class="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white p-2 focus:ring-2 focus:ring-blue-500">
            <option value="EFECTIVO">EFECTIVO</option>
            <option value="TARJETA">TARJETA</option>
            <option value="TRANSFERENCIA">TRANSFERENCIA</option>
          </select>
        </div>
      </div>
    `,
    background: '#ffffff',
    customClass: {
      popup: 'rounded-xl p-6 dark:bg-gray-900',
      confirmButton: 'bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700',
      cancelButton: 'bg-gray-300 text-black px-4 py-2 rounded-md hover:bg-gray-400 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600',
    },
    showCancelButton: true,
    confirmButtonText: 'Abonar',
    cancelButtonText: 'Cancelar',
    focusConfirm: false,
    preConfirm: async() => {
      const monto = parseFloat(document.getElementById('swal-input-monto').value);
      const metodo = document.getElementById('swal-input-metodo').value;

      if (isNaN(monto) || monto <= 0) {
        Swal.showValidationMessage('Debes ingresar un monto válido mayor que 0');
        return false;
      }

      return { monto, metodo };
    }
  });

  if (formValues) {
    formValues.fecha = nfecha('fecha');
    formValues.hora = nfecha('hora');
    formValues.timestamp = nfecha('timestamp');

    const pagosRegistrados = JSON.parse(datoscampos.value.historial_pagos);
    pagosRegistrados.push(formValues);
    datoscampos.value.historial_pagos = JSON.stringify(pagosRegistrados);

    // Calcular el total de abonos sumando todos los abonos registrados
    const totalAbonado = pagosRegistrados.reduce((sum, pago) => sum + parseFloat(pago.monto), 0);
    datoscampos.value.total_abonado = totalAbonado.toFixed(2);

    // Restar el nuevo abono del total pendiente
    const totalPendienteActual = parseFloat(datoscampos.value.total_pendiente) || 0;
    datoscampos.value.total_pendiente = (totalPendienteActual - formValues.monto).toFixed(2);
    await funcionActualizar()
    Swal.fire({
      icon: 'success',
      title: 'Abono registrado',
      html: `
        <p class="text-lg font-semibold text-green-600 dark:text-green-400">Monto: RD$ ${formValues.monto.toFixed(2)}</p>
        <p class="text-sm text-gray-700 dark:text-gray-300">Método: ${formValues.metodo}</p>
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-2">${new Date().toLocaleString()}</p>
      `,
      background: '#ffffff',
      customClass: {
        popup: 'rounded-xl p-6 dark:bg-gray-900',
        title: 'text-lg font-semibold text-green-600 dark:text-green-400'
      }
    });
  }
};


/************************************************************************/
function getRowColor(item) {
  if (item.estado === 'PAGADO') return 'bg-green-100';
  if (item.estado === 'NO PAGADO') return 'bg-red-100';
  return ''; // Sin clase si no hay estado
}

/************************************************************************/
const fnFechaSeleccionada = async(selected)=>{
  console.log("selected", selected);

}
/************************************************************************/
function pedirContrasena() {
  return Swal.fire({
    title: 'Confirmación',
    input: 'password',
    inputLabel: 'Introduce la contraseña',
    inputPlaceholder: 'Contraseña...',
    inputAttributes: {
      maxlength: 20,
      autocapitalize: 'off',
      autocorrect: 'off'
    },
    showCancelButton: true,
    confirmButtonText: 'Confirmar',
    cancelButtonText: 'Cancelar'
  }).then((result) => {
    if (result.isConfirmed && result.value === tokenCorto.value || result.value === token.value) {
      return true
    } else if (result.isConfirmed) {
      Swal.fire('Error', 'Contraseña incorrecta', 'error')
      return false
    }
    return false
  })
}

// Función para editar
const editarFila = async (index, fila, tableId) => {
  const autorizado = await pedirContrasena()
  if (!autorizado) return

  const fechaOriginal = typeof fila === 'string' ? fila : fila.fecha
  const estadoOriginal = typeof fila === 'string' ? 'NO PAGADO' : (fila.estado || 'NO PAGADO')

  const { value: formValues } = await Swal.fire({
    title: 'Editar Fecha y Estado',
    html:
      `<label for="nueva-fecha">Fecha:</label><br>` +
      `<input id="nueva-fecha" type="date" class="swal2-input" value="${convertirADateInput(fechaOriginal)}"><br>` +
      `<label for="nuevo-estado">Estado:</label><br>` +
      `<select id="nuevo-estado" class="swal2-input">
        <option value="NO PAGADO" ${estadoOriginal === 'NO PAGADO' ? 'selected' : ''}>NO PAGADO</option>
        <option value="PAGADO" ${estadoOriginal === 'PAGADO' ? 'selected' : ''}>PAGADO</option>
      </select>`,
    focusConfirm: false,
    showCancelButton: true,
    confirmButtonText: 'Guardar cambios',
    preConfirm: () => {
      const nuevaFecha = document.getElementById('nueva-fecha').value
      const nuevoEstado = document.getElementById('nuevo-estado').value
      if (!nuevaFecha) {
        Swal.showValidationMessage('Debes seleccionar una fecha válida')
        return false
      }
      return {
        fecha: convertirADDMMYYYY(nuevaFecha),
        estado: nuevoEstado
      }
    }
  })

  if (formValues) {
    const targetArray =
      tableId === 'fechas_pago' ? datoscampos.value.fechas_pago
      : tableId === 'historial_pagos' ? (() => {
          const arr = typeof datoscampos.value.historial_pagos === 'string'
            ? JSON.parse(datoscampos.value.historial_pagos)
            : datoscampos.value.historial_pagos || [];
          return arr;
        })()
      : null;

    if (typeof fila === 'string' && targetArray) {
      targetArray[index] = {
        fecha: formValues.fecha,
        estado: formValues.estado
      }
    } else {
      fila.fecha = formValues.fecha
      fila.estado = formValues.estado
    }
    await funcionActualizar()
    Swal.fire('Actualizado', 'Los datos fueron modificados correctamente', 'success')
  }
}

function convertirADateInput(fechaDDMMYYYY) {
  const [dd, mm, yyyy] = fechaDDMMYYYY.split('/')
  return `${yyyy}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}`
}

function convertirADDMMYYYY(fechaInput) {
  const [yyyy, mm, dd] = fechaInput.split('-')
  return `${dd.padStart(2, '0')}/${mm.padStart(2, '0')}/${yyyy}`
}

// Función auxiliar para dar formato yyyy-mm-dd
function formateaFechaInput(fechaStr) {
  if (!fechaStr) return ''
  const [d, m, y] = fechaStr.split('/')
  if (!y) return fechaStr // Ya viene en formato yyyy-mm-dd
  return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`
}

const borrarEntrada = async () => {
  const autorizado = await pedirContrasena()
  if (!autorizado) return
  const envioDatos = await peticionesFetchOffline('deleteEntry', 'financiamientos', datoscampos.value.id);
  if (envioDatos[0] == 'ok') {
    toast.add({ severity: 'success', summary: 'Exito', detail: 'Financiamiento eliminado', life: 3000 });
    router.push('/financiamientos')
  } else {
    toast.add({ severity: 'error', summary: 'Error', detail: 'Fallo al eliminar', life: 3000 });
  }
};

const eliminarFila = async (index, tableId) => {
  const autorizado = await pedirContrasena()
  if (!autorizado) return
  const targetArray = tableId === 'fechas_pago' ? datoscampos.value.fechas_pago : null;
  if (targetArray) {
    targetArray.splice(index, 1)
    await funcionActualizar()
    Swal.fire('Eliminado', 'La fila fue eliminada correctamente', 'success')
  }
};
const eliminarPago = async (index) => {
  const confirm = await Swal.fire({ title: 'Eliminar pago?', text: 'Esta accion no se puede deshacer', icon: 'warning', showCancelButton: true, confirmButtonText: 'Si, eliminar', cancelButtonText: 'Cancelar' });
  if (!confirm.isConfirmed) return;
  const arr = typeof datoscampos.value.historial_pagos === 'string' ? JSON.parse(datoscampos.value.historial_pagos) : datoscampos.value.historial_pagos || [];
  arr.splice(index, 1);
  datoscampos.value.historial_pagos = JSON.stringify(arr);
  const totalAbonado = arr.reduce((sum, pago) => sum + parseFloat(pago.monto || 0), 0);
  datoscampos.value.total_abonado = totalAbonado.toFixed(2);
  datoscampos.value.total_pendiente = (parseFloat(datoscampos.value.monto_total || 0) - totalAbonado).toFixed(2);
  await funcionActualizar();
  Swal.fire('Eliminado', 'El pago fue eliminado correctamente', 'success');
};
const editarPago = async (index) => {
  const arr = typeof datoscampos.value.historial_pagos === 'string' ? JSON.parse(datoscampos.value.historial_pagos) : datoscampos.value.historial_pagos || [];
  const pago = arr[index];
  const { value: formValues } = await Swal.fire({
    title: 'Editar Pago',
    html: '<div class=\"grid grid-cols-1 gap-4 text-left\"><div><label class=\"text-sm font-medium\">Monto</label><input id=\"swal-monto\" type=\"number\" step=\"0.01\" class=\"w-full rounded-md border p-2\" value=\"' + pago.monto + '\"></div><div><label class=\"text-sm font-medium\">Metodo</label><select id=\"swal-metodo\" class=\"w-full rounded-md border p-2\"><option value=\"EFECTIVO\"' + (pago.metodo === 'EFECTIVO' ? ' selected' : '') + '>EFECTIVO</option><option value=\"TARJETA\"' + (pago.metodo === 'TARJETA' ? ' selected' : '') + '>TARJETA</option><option value=\"TRANSFERENCIA\"' + (pago.metodo === 'TRANSFERENCIA' ? ' selected' : '') + '>TRANSFERENCIA</option></select></div><div><label class=\"text-sm font-medium\">Fecha</label><input id=\"swal-fecha\" type=\"text\" class=\"w-full rounded-md border p-2\" value=\"' + (pago.fecha || '') + '\"></div></div>',
    showCancelButton: true, confirmButtonText: 'Guardar', cancelButtonText: 'Cancelar',
    preConfirm: () => ({ monto: document.getElementById('swal-monto').value, metodo: document.getElementById('swal-metodo').value, fecha: document.getElementById('swal-fecha').value })
  });
  if (formValues) {
    arr[index] = { ...arr[index], ...formValues };
    datoscampos.value.historial_pagos = JSON.stringify(arr);
    const totalAbonado = arr.reduce((sum, p) => sum + parseFloat(p.monto || 0), 0);
    datoscampos.value.total_abonado = totalAbonado.toFixed(2);
    datoscampos.value.total_pendiente = (parseFloat(datoscampos.value.monto_total || 0) - totalAbonado).toFixed(2);
    await funcionActualizar();
    Swal.fire('Actualizado', 'El pago fue actualizado correctamente', 'success');
  }
};
/************************************************************************/
const handleUpload = async (event) => {
  const archivos = event.files;

  if (!archivos || archivos.length === 0) {
    console.error('❌ No se seleccionaron archivos');
    return;
  }

  for (const archivo of archivos) {
    const formData = new FormData();
    formData.append('imagen[]', archivo); 
    formData.append('ruta', '../vista/img/financiamientos/'+datoscampos.value.imagen);
   // formData.append('nombre', archivo.name);

    try {


const response = fetch(link.value + api.value + '/subirunaimagen2', {
    method: 'POST',
    headers: {
        Authorization: tokenCifrado.value // ⚠️ No pongas Content-Type manual
    },
    body: formData
})
.then(response => response.json())
.then(async(resultado) => {
      if (resultado[0].status) {
        arrayIMG.value = await peticionesFetchOffline('listarArchivosDeCarpetaUrl', `financiamientos/${datoscampos.value.imagen}`);
          toast.add({ severity: 'success', summary: 'Éxito', detail: 'Imagen Subida', life: 3000 });
        console.log(`✅ Archivo ${archivo.name} subido en:`, resultado.path);
      } else {
        console.error(`❌ Error subiendo ${archivo.name}:`, resultado.message);
      }
})


    } catch (err) {
      console.error(`❌ Error de red con ${archivo.name}:`, err.message);
    }
  }
};
/************************************************************************/
/************************************************************************/
function obtenerNombreArchivo(rutaCompleta) {
  return rutaCompleta.split(/[\\/]/).pop();
}
/************************************************************************/
const deleteImage = async(imagen) => {
const nombreArchivo = imagen.split('/').pop();
  const url = link.value+api.value+"/borrararchivo";
  const datos = {
    ruta:'../vista/img/financiamientos/'+datoscampos.value.imagen,
    archivo:nombreArchivo,
  }


  if(navigator.onLine){
      const envioDatos = await enviarDatosPorPost(url, datos,tokenCifrado.value);

        if (envioDatos[0] == 'ok') {
         arrayIMG.value = await peticionesFetchOffline('listarArchivosDeCarpetaUrl', `financiamientos/${datoscampos.value.imagen}`);

           toast.add({ severity: 'success', summary: 'Éxito', detail: 'Imagen Borrada', life: 3000 });
        }else{
          toast.add({ severity: 'error', summary: 'Error', detail: 'Fallo al Borrar la Imagen.', life: 3000 });
        }

  }

}

/************************************************************************/
const esImagen = (imagen) => /.(jpg|jpeg|png|gif|webp)$/i.test(imagen);
const esPdf = (imagen) => /.(pdf)$/i.test(imagen);
const esWord = (imagen) => /.(doc|docx)$/i.test(imagen);
const downloadImage = (imagen) => {
  const url = imagen;
  const link = document.createElement('a');
  link.href = imagen;
  link.target = '_blank';
  link.setAttribute('download', imagen);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
/************************************************************************/
const loadImageAsBase64 = (url) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous'; // Para manejar CORS si es necesario
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      const dataURL = canvas.toDataURL('image/png');
      resolve(dataURL);
    };
    img.onerror = (error) => {
      reject(error);
    };
    img.src = url;
  });
};



/**********************************************/

const generarRecibo = async () => {
  // Preguntar al usuario si desea tamaño carta o 80mm
  const { value: tamano } = await Swal.fire({
    title: 'Seleccionar Tamaño del Recibo',
    input: 'select',
    inputOptions: {
      'carta': 'Tamaño Carta',
      '80mm': 'Tamaño 80mm'
    },
    inputPlaceholder: 'Seleccione un tamaño',
    showCancelButton: true,
    confirmButtonText: 'Confirmar',
    cancelButtonText: 'Cancelar',
    inputValidator: (value) => {
      return new Promise((resolve) => {
        if (value) {
          resolve();
        } else {
          resolve('Debes seleccionar un tamaño');
        }
      });
    }
  });

  if (!tamano) {
    return; // Si el usuario cancela o no selecciona un tamaño, salir de la función
  }

  // Configuración del tamaño del PDF
  let doc;
  let margin = 10;
  let fontSize = 10;
  let cellPadding = 2;

  if (tamano === '80mm') {
    doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: [80, 297] // Tamaño de 80mm de ancho
    });
    margin = 5;
    fontSize = 8;
    cellPadding = 1;
  } else {
    doc = new jsPDF(); // Tamaño carta por defecto
  }

  try {
    // Datos del cliente
    const datosCliente = {
      nombre: datoscampos.value.nombre_cliente,
      cedula: datoscampos.value.cedula_cliente,
      telefono: datoscampos.value.telefono_cliente,
      direccion: datoscampos.value.direccion_cliente,
    };

    // Datos del financiamiento
    const datosFinanciamiento = {
      noFinanciamiento: datoscampos.value.no_financiamiento,
      montoTotal: datoscampos.value.monto_total,
      inicial: datoscampos.value.inicial,
      tasaInteres: datoscampos.value.tasa_interes,
      cuotas: datoscampos.value.no_cuotas,
      valorCuota: datoscampos.value.valor_cuotas,
    };

    // Abonos realizados
    const abonosRealizados = JSON.parse(datoscampos.value.historial_pagos || '[]');

    // Calcular el total pagado
    const totalPagado = abonosRealizados.reduce((sum, abono) => sum + parseFloat(abono.monto), 0);

    // Saldo pendiente
    const saldoPendiente = datoscampos.value.total_pendiente;

    // Encabezado del recibo
    doc.setFontSize(fontSize + 4);
    doc.text('RECIBO DE PAGO', doc.internal.pageSize.getWidth() / 2, margin + 10, { align: 'center' });
    doc.setFontSize(fontSize);
    doc.text(`Fecha de Emisión: ${new Date().toLocaleDateString()}`, doc.internal.pageSize.getWidth() / 2, margin + 20, { align: 'center' });

    // Datos del cliente
    doc.setFontSize(fontSize + 2);
    doc.text('Datos del Cliente', margin, margin + 30);
    autoTable(doc, {
      startY: margin + 35,
      body: [
        ['Nombre:', datosCliente.nombre],
        ['Cédula:', datosCliente.cedula],
        ['Teléfono:', datosCliente.telefono],
        ['Dirección:', datosCliente.direccion],
      ],
      theme: 'grid',
      styles: { fontSize: fontSize, cellPadding: cellPadding, overflow: 'linebreak' }
    });

    // Datos del financiamiento
    doc.text('Datos del Financiamiento', margin, doc.lastAutoTable.finalY + margin);
    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + margin,
      body: [
        ['No. Financiamiento:', datosFinanciamiento.noFinanciamiento],
        ['Monto Total:', datosFinanciamiento.montoTotal],
        ['Inicial:', datosFinanciamiento.inicial],
        ['Tasa de Interés:', datosFinanciamiento.tasaInteres],
        ['No. Cuotas:', datosFinanciamiento.cuotas],
        ['Valor Cuota:', datosFinanciamiento.valorCuota],
      ],
      theme: 'grid',
      styles: { fontSize: fontSize, cellPadding: cellPadding, overflow: 'linebreak' }
    });

    // Abonos realizados
    doc.text('Abonos Realizados', margin, doc.lastAutoTable.finalY + margin);
    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + margin,
      head: [['Fecha', 'Monto', 'Método']],
      body: abonosRealizados.map(abono => [abono.fecha, abono.monto, abono.metodo]),
      theme: 'grid',
      styles: { fontSize: fontSize, cellPadding: cellPadding, overflow: 'linebreak' }
    });

    // Total pagado
    doc.text(`Total Pagado: ${totalPagado.toFixed(2)}`, margin, doc.lastAutoTable.finalY + margin);

    // Saldo pendiente
    doc.text(`Saldo Pendiente: ${saldoPendiente}`, margin, doc.lastAutoTable.finalY + margin + 10);

    // Pie de página con detalles de contacto
    doc.setFontSize(fontSize - 2);
    doc.text('Contacto: info@empresa.com | Teléfono: 809-000-0000', doc.internal.pageSize.getWidth() / 2, doc.internal.pageSize.height - margin, { align: 'center' });

    // Convertir el PDF a un formato que pueda ser mostrado en un embed
    const pdfData = doc.output('datauristring');

    // Mostrar el PDF en un modal de SweetAlert
    Swal.fire({
      title: 'Recibo de Pago',
      html: `<embed src="${pdfData}" type="application/pdf" width="100%" height="500px"/>`,
      width: '80%',
      showCloseButton: true,
      confirmButtonText: 'Cerrar'
    });
  } catch (error) {
    console.error('Error al generar el PDF:', error);
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: 'No se pudo generar el PDF.',
    });
  }
};

/************************************************************************/
function generarPlanPagoPDF() {
  try {
    const doc = new jsPDF();
    if (!datoscampos.value.fechas_pago || datoscampos.value.fechas_pago.length === 0) {
      toast.add({ severity: 'warn', summary: 'Advertencia', detail: 'No hay fechas de pago programadas.', life: 3000 });
      return;
    }
    const totalCuotas = datoscampos.value.no_cuotas;
    const montoPrincipal = parseFloat(datoscampos.value.monto_total || 0);
    const interesTotal = parseFloat(datoscampos.value.interes_total || 0);
    const tasaInteres = parseFloat(datoscampos.value.tasa_interes || 0);
    const montoSeguro = parseFloat(datoscampos.value.total_seguro || 0) / totalCuotas;
    const montoCuota = parseFloat((montoPrincipal + interesTotal) / totalCuotas);
    const interesPorCuota = interesTotal / totalCuotas;
    const montoPorCuota = montoPrincipal / totalCuotas;
    const totalInteresMensual = montoPorCuota + interesPorCuota;
    let balance = montoPrincipal;
    const fechaPago = datoscampos.value.fechas_pago;
    const planPagos = [];
    for (let fecha of fechaPago) {
      const laFecha = fecha.split('/');
      planPagos.push({ fecha, dia: laFecha[0], monto: montoPorCuota.toFixed(2), seguro: montoSeguro.toFixed(2), balance: balance.toFixed(2), tasaInteres: tasaInteres.toFixed(2), totalInteres: totalInteresMensual.toFixed(2), cuota: (totalInteresMensual + montoSeguro).toFixed(2) });
      balance -= montoPorCuota;
    }
    doc.setFontSize(12);
    doc.text(datosEmpresa.empresa.nombre, 105, 10, { align: 'center' });
    doc.setFontSize(10);
    doc.text(datosEmpresa.empresa.legal, 105, 15, { align: 'center' });
    doc.text('Tabla de Amortización', 105, 22, { align: 'center' });
    const info = [
      [`Número de Financiamiento:`, datoscampos.value.no_financiamiento, `Código del Cliente:`, datoscampos.value.cedula_cliente],
      [`Monto Principal:`, `$${montoPrincipal.toLocaleString()}`, `Nombre:`, datoscampos.value.nombre_cliente],
      [`Monto de intereses:`, `$${interesTotal.toLocaleString()}`, `Periodicidad:`, datoscampos.value.frecuencia_pago],
      [`Fecha de apertura:`, datoscampos.value.fecha_solicitud, `Fecha de vencimiento:`, datoscampos.value.fecha_vencimiento]
    ];
    let y = 30;
    info.forEach(row => { doc.text(`${row[0]} ${row[1]}`, 10, y); doc.text(`${row[2]} ${row[3]}`, 110, y); y += 6; });
    autoTable(doc, {
      head: [['Linea', 'Fecha', 'Estado', 'DIA', 'Monto', 'Seguro', 'Balance', 'Tasa de interes', 'Principal mas Interes', 'Cuota']],
      body: planPagos.map((p, index) => [index + 1, p.fecha, 'Pendiente', p.dia, `$${p.monto.toLocaleString()}`, `$${p.seguro.toLocaleString()}`, `$${p.balance.toLocaleString()}`, `${p.tasaInteres}%`, `$${p.totalInteres.toLocaleString()}`, `$${p.cuota.toLocaleString()}`]),
      startY: y + 5, theme: 'grid', styles: { fontSize: 8 }
    });
    const finalY = doc.lastAutoTable.finalY + 20;
    doc.text('_________________________', 30, finalY);
    doc.text('_________________________', 130, finalY);
    doc.text('FIRMA DEL CLIENTE', 40, finalY + 6);
    doc.text('FIRMA DEL GARANTE', 140, finalY + 6);
    const blob = doc.output('blob');
    const pdfObjectUrl = URL.createObjectURL(blob);
    Swal.fire({
      title: 'Vista previa de la Tabla de Amortizacion',
      html: '<iframe src="' + pdfObjectUrl + '" width="100%" height="500px" style="border: none;"></iframe>',
      width: '80%', showCloseButton: true, showCancelButton: true,
      confirmButtonText: 'Descargar PDF', cancelButtonText: 'Cerrar'
    }).then(result => {
      if (result.isConfirmed) {
        const a = document.createElement('a'); a.href = pdfObjectUrl; a.download = 'TablaAmortizacion-' + datoscampos.value.no_financiamiento + '.pdf'; a.click();
      }
      URL.revokeObjectURL(pdfObjectUrl);
    });
  } catch (error) {
    console.error('Error generando tabla de amortizacion:', error);
    toast.add({ severity: 'error', summary: 'Error', detail: 'Error al generar la tabla de amortizacion.', life: 5000 });
  }
}
/************************************************************************/
const getBase64ImageFromURLAutoSize = async (url, maxWidth, maxHeight) => {
  const response = await fetch(url);
  const blob = await response.blob();
  const img = await createImageBitmap(blob);
  let width = img.width, height = img.height;
  const scale = Math.min(maxWidth / width, maxHeight / height);
  width *= scale; height *= scale;
  const canvas = document.createElement('canvas');
  canvas.width = width; canvas.height = height;
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, 0, 0, width, height);
  return { base64: canvas.toDataURL(), width, height };
};
/************************************************************************/
async function generarAutorizacionPDF() {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'letter' });
  let startY = 10;
  const pageWidth = doc.internal.pageSize.getWidth();
  const { base64, width, height } = await getBase64ImageFromURLAutoSize(datosEmpresa.empresa.imagen, 150, 60);
  const logoWidth = 30;
  const logoX = (pageWidth - logoWidth) / 2;
  doc.addImage(base64, 'PNG', logoX, startY, width, height);
  doc.setFont('times', 'bold');
  doc.setFontSize(12);
  doc.text('AUTORIZACION PARA CONSULTA INFORMACION CREDITICIA,', 306, 100, { align: 'center' });
  doc.text('CAPTURA Y ALMACENAMIENTO DE DATOS BIOMETRICOS', 306, 115, { align: 'center' });
  doc.setFont('times', 'normal');
  doc.setFontSize(11);
  const text = 'Conforme a las leyes 172-13 sobre Proteccion Integral de Datos Personales y la Ley 4-23 sobre sobre registro civil, respecto de la captura y almacenamiento de datos biometricos, EL FIRMANTE otorga su consentimiento formal y expreso, para que, AA Solutions Comercial pueda: 1. Consultar su informacion personal reportada en las bases de datos de las Sociedades de Informacion Crediticia, y 2. Capturar y almacenar sus datos biometricos.';
  doc.text(text, 55, 140, { maxWidth: 500, lineHeightFactor: 1.5 });
  doc.text('El firmante da su autorizacion expresa para los fines de:', 55, 225);
  doc.setFont('times', 'bold');
  doc.text('Recoleccion y almacenamiento', 55, 245);
  doc.text('Validacion y consulta', 330, 245);
  doc.setFont('times', 'normal');
  doc.rect(55, 255, 10, 10); doc.text('X', 57, 263); doc.text('Fotografia de su rostro', 70, 263);
  doc.rect(55, 275, 10, 10); doc.text('X', 57, 283); doc.text('Huella dactilar', 70, 283);
  doc.rect(330, 255, 10, 10); doc.text('X', 332, 263); doc.text('Buro de credito', 345, 263);
  doc.rect(330, 275, 10, 10); doc.text('', 332, 283); doc.text('Otro (Especificar cual en observaciones)', 345, 283);
  doc.line(55, 330, 250, 330); doc.text('(Firmar igual que en su cedula)', 55, 340);
  doc.line(330, 330, 555, 330); doc.text('(Cedula escrita por el cliente)', 330, 340);
  doc.line(190, 370, 420, 370); doc.text('(Fecha escrita por el cliente)', 230, 380);
  doc.rect(55, 400, 120, 90); doc.text('Huella dactilar dedo INDICE DERECHO', 55, 500);
  doc.text('Observaciones:', 55, 530);
  doc.line(55, 540, 555, 540); doc.line(55, 560, 555, 560);
  doc.setFontSize(9);
  doc.text('Autorizacion para consulta informacion crediticia, captura y almacenamiento de datos biometricos', 555, 760, { align: 'right' });
  doc.text('Codigo: GA-DCC-03     Version 01, Abril 2025', 555, 770, { align: 'right' });
  const pdfData = doc.output('datauristring');
  Swal.fire({
    title: 'Autorizacion Generada',
    html: '<embed src="' + pdfData + '" type="application/pdf" width="100%" height="500px"/>',
    width: '80%', showCloseButton: true, confirmButtonText: 'Cerrar'
  });
}
/************************************************************************/
function formatearFechaTexto(fechaISO) {
  const date = new Date(fechaISO);
  return date.toLocaleDateString('es-DO', { day: '2-digit', month: 'long', year: 'numeric' });
}
/************************************************************************/
function formatearRD(valor) {
  return 'RD$' + parseFloat(valor).toLocaleString('es-DO', { minimumFractionDigits: 2 });
}
/************************************************************************/
async function generarPagarePDF() {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: [612, 1008] });
  const pageWidth = doc.internal.pageSize.getWidth();
  const data = datoscampos.value;
  const nombre = data.nombre_cliente;
  const cedula = data.cedula_cliente;
  const direccion = data.direccion_cliente;
  const estadoCivil = data.estado_civil || 'soltero(a)';
  const monto = formatearRD(data.monto_total);
  const cuotas = data.no_cuotas;
  const valorCuota = formatearRD(data.valor_cuotas);
  const interes = data.tasa_interes;
  const tiempoCobro = data.frecuencia_pago;
  const fechaInicio = formatearFechaTexto(data.fecha_solicitud);
  const ultimaFecha = data.fechas_pago[data.fechas_pago.length - 1];
  const fechaFin = formatearFechaTexto(ultimaFecha);
  const senorSenora = data.sexo === 'HOMBRE' ? 'el senor' : 'la senora';
  const deudor_a = data.sexo === 'HOMBRE' ? 'EL DEUDOR' : 'LA DEUDORA';
  const equipo = data.articulos.map(e => e.nombre).join(', ');
  const fechaHoy = new Date().toLocaleDateString('es-DO', { day: '2-digit', month: 'long', year: 'numeric' });
  doc.text('PAGARE NOTARIAL', pageWidth / 2, 40, { align: 'center' });
  const texto = 'ACTO NUMERO ________________. En la ciudad de Santiago, Santiago de los Caballeros, Republica Dominicana, a los ' + fechaHoy + ', Por ante mi, LIC. EDUARDO RAFAEL POLANCO RAMIREZ, Notario Publico Numero 5477, para el municipio de Santiago, con estudio Profesional abierto en la calle Buena Vista No. 147, La Gallera, Santiago, encontrandome en mi despacho y en el regular ejercicio de mis funciones, COMPARECIO libre y voluntariamente ' + senorSenora + ' ' + nombre.toUpperCase() + ' de nacionalidad dominicana, mayor de edad, estado civil ' + estadoCivil + ', provisto/a de la cedula de identidad y electoral No. ' + cedula + ', domiciliado/a y residente en ' + direccion + ', lugar donde hace formal eleccion de domicilio para todos los actos y consecuencias legales que se deriven del presente compromiso y ME HA DECLARADO bajo la fe del juramento lo siguiente: PRIMERO: Que reconoce, por medio del presente acto, ser ' + deudor_a + ', de la Razon Social AETM AA SOLUTIONS COMERCIAL, SRL, por la suma de ' + monto + ', por concepto de financiamiento de los siguientes articulos: ' + equipo + ', suma que se compromete a pagar en ' + cuotas + ' cuotas ' + tiempoCobro + ' y consecutivas, a razon de ' + valorCuota + ' cada una, iniciando en la fecha ' + fechaInicio + ' y finalizando el ' + fechaFin + '; SEGUNDO: ' + deudor_a + ' reconoce que la suma adeudada generara un interes de ' + interes + '% por ciento mensual en caso de no saldar este compromiso al termino de cinco (5) meses como se ha pactado.';
  const fontSize = 10, lineHeight = fontSize * 1.5, margin = 55, maxWidth = 502;
  let yM = 60;
  doc.setFontSize(fontSize);
  doc.setFont('times', 'normal');
  const bloques = texto.split('[[SALTO]]');
  bloques.forEach(p => {
    const limpio = p.trim();
    doc.text(limpio, margin, yM, { maxWidth, align: 'justify', lineHeightFactor: 1.5 });
    yM += doc.getTextDimensions(limpio, { maxWidth }).h + lineHeight + 10;
  });
  const lineY = doc.lastAutoTable ? doc.lastAutoTable.finalY : 620;
  doc.line(margin, lineY, pageWidth - margin, lineY);
  doc.line(margin, lineY + 15, pageWidth - margin, lineY + 15);
  doc.line(margin, lineY + 30, pageWidth - margin, lineY + 30);
  const yPos = doc.lastAutoTable ? doc.lastAutoTable.finalY + 60 : 730;
  doc.text('_______________________________________', pageWidth / 2, yPos + 40, { align: 'center' });
  doc.text(nombre.toUpperCase(), pageWidth / 2, yPos + 55, { align: 'center' });
  doc.text('DEUDOR(A)', pageWidth / 2, yPos + 70, { align: 'center' });
  doc.text('_______________________________________', pageWidth / 2, yPos + 100, { align: 'center' });
  doc.text('JENNIFFER MARLENY GOMEZ TORRES', pageWidth / 2, yPos + 115, { align: 'center' });
  doc.text('POR AETM AA SOLUTIONS COMERCIAL SRL', pageWidth / 2, yPos + 130, { align: 'center' });
  doc.text('ACREEDOR', pageWidth / 2, yPos + 145, { align: 'center' });
  doc.text('_______________________________________', pageWidth / 2, yPos + 175, { align: 'center' });
  doc.text('EDUARDO RAFAEL POLANCO RAMIREZ', pageWidth / 2, yPos + 190, { align: 'center' });
  doc.text('NOTARIO', pageWidth / 2, yPos + 205, { align: 'center' });
  const pdfData = doc.output('datauristring');
  Swal.fire({
    title: 'Pagaré Notarial Generado',
    html: '<embed src="' + pdfData + '" type="application/pdf" width="100%" height="500px"/>',
    width: '80%', showCloseButton: true, confirmButtonText: 'Cerrar'
  });
}
/************************************************************************/
const fnGenerarSolicitud = async () => {
  const doc = new jsPDF();
  const datosSolicitud = {
    articulos: datoscampos.value.articulos.map(art => art.nombre).join(', '),
    monto: datoscampos.value.monto_total,
    inicial: datoscampos.value.inicial,
    tasa: datoscampos.value.tasa_interes,
    no_cuotas: datoscampos.value.no_cuotas,
    seguro: datoscampos.value.porcentaje_seguro,
    cuotaTotal: datoscampos.value.valor_cuotas,
    frecuencia: datoscampos.value.frecuencia_pago,
  };
  const datosSolicitante = {
    nombres: datoscampos.value.nombre_cliente, apellidos: '', cedula: datoscampos.value.cedula_cliente,
    fechaNacimiento: datoscampos.value.fecha_nacimiento, sexo: datoscampos.value.sexo, estadoCivil: datoscampos.value.estado_civil,
    telefonoResidencial: datoscampos.value.telefono_cliente, telefonoMovil: datoscampos.value.whatsapp_cliente,
    email: datoscampos.value.email_cliente, nacionalidad: 'Dominicana', provincia: '', direccion: datoscampos.value.direccion_cliente,
    referencia: datoscampos.value.referencia_direccion_cliente, nombreEmpresa: datoscampos.value.empresa_labora,
    tiempoLaborando: datoscampos.value.tiempo_laborando, cargo: datoscampos.value.ocupcion,
    direccionTrabajo: datoscampos.value.direccion_cliente, telefonoTrabajo: datoscampos.value.contacto_empresa,
    salario: datoscampos.value.salario, nombreConyugue: datoscampos.value.nombre_conyugue, telefonoConyugue: datoscampos.value.telefono_conyugue,
  };
  const referenciasFamiliares = [
    { referencia: datoscampos.value.referencia_familiar1, contacto: datoscampos.value.contacto_familiar1, vinculo: datoscampos.value.vinculo_referencia_familiar1 },
    { referencia: datoscampos.value.referencia_familiar2, contacto: datoscampos.value.contacto_familiar2, vinculo: datoscampos.value.vinculo_referencia_familiar2 },
  ];
  const referenciasPersonales = [
    { referencia: datoscampos.value.referencia_personal1, contacto: datoscampos.value.contacto_personal1, vinculo: datoscampos.value.vinculo_contacto_personal1 },
    { referencia: datoscampos.value.referencia_personal2, contacto: datoscampos.value.contacto_personal2, vinculo: datoscampos.value.vinculo_contacto_personal2 },
  ];
  const datosGarante = {
    nombres: datoscampos.value.nombre_garante, apellidos: '', cedula: datoscampos.value.cedula_garante,
    fechaNacimiento: '', sexo: '', estadoCivil: '', telefonoResidencial: datoscampos.value.telefono_garante,
    telefonoMovil: datoscampos.value.whatsapp_garante, email: datoscampos.value.email_garante, nacionalidad: 'Dominicana',
    provincia: '', direccion: datoscampos.value.direccion_garante, referencia: datoscampos.value.referencia_direccion_garante,
    nombreEmpresa: '', tiempoLaborando: '', cargo: '', direccionTrabajo: '', telefonoTrabajo: '', salario: '', nombreConyugue: '', telefonoConyugue: '',
  };
  doc.setFontSize(16);
  doc.text('SOLICITUD DE FINANCIAMIENTO', 105, 15, { align: 'center' });
  doc.setFontSize(12);
  doc.text('DATOS DE LA SOLICITUD', 10, 25);
  autoTable(doc, { startY: 30, body: [['Articulos:', datosSolicitud.articulos, 'Monto:', datosSolicitud.monto], ['Frecuencia:', datosSolicitud.frecuencia, 'No. cuotas:', datosSolicitud.no_cuotas], ['Inicial:', datosSolicitud.inicial, 'Seguro:', datosSolicitud.seguro], ['Tasa:', datosSolicitud.tasa, 'Cuota total:', datosSolicitud.cuotaTotal]], theme: 'grid', styles: { fontSize: 10 } });
  doc.text('DATOS DEL SOLICITANTE', 10, doc.lastAutoTable.finalY + 10);
  autoTable(doc, { startY: doc.lastAutoTable.finalY + 15, body: [['Nombres:', datosSolicitante.nombres, 'Apellidos:', datosSolicitante.apellidos], ['Cedula:', datosSolicitante.cedula, 'Fecha Nacimiento:', datosSolicitante.fechaNacimiento], ['Sexo:', datosSolicitante.sexo, 'Estado Civil:', datosSolicitante.estadoCivil], ['Telefono Residencial:', datosSolicitante.telefonoResidencial, 'Telefono Movil:', datosSolicitante.telefonoMovil], ['E-mail:', datosSolicitante.email, 'Nacionalidad:', datosSolicitante.nacionalidad], ['Provincia:', datosSolicitante.provincia, 'Direccion:', datosSolicitante.direccion], ['Referencia:', datosSolicitante.referencia, 'Nombre Empresa:', datosSolicitante.nombreEmpresa], ['Tiempo Laborando:', datosSolicitante.tiempoLaborando, 'Cargo:', datosSolicitante.cargo], ['Direccion Trabajo:', datosSolicitante.direccionTrabajo, 'Telefono Trabajo:', datosSolicitante.telefonoTrabajo], ['Salario:', datosSolicitante.salario, 'Nombre Conyugue:', datosSolicitante.nombreConyugue], ['Telefono Conyugue:', datosSolicitante.telefonoConyugue, '']], theme: 'grid', styles: { fontSize: 10 } });
  doc.text('REFERENCIAS FAMILIARES', 10, doc.lastAutoTable.finalY + 10);
  autoTable(doc, { startY: doc.lastAutoTable.finalY + 15, body: referenciasFamiliares.map(r => [r.referencia, r.vinculo, r.contacto]), head: [['Referencia', 'Vinculo', 'Contacto']], theme: 'grid', styles: { fontSize: 10 } });
  doc.text('REFERENCIAS PERSONALES', 10, doc.lastAutoTable.finalY + 10);
  autoTable(doc, { startY: doc.lastAutoTable.finalY + 15, body: referenciasPersonales.map(r => [r.referencia, r.vinculo, r.contacto]), head: [['Referencia', 'Vinculo', 'Contacto']], theme: 'grid', styles: { fontSize: 10 } });
  doc.text('DATOS DEL GARANTE', 10, doc.lastAutoTable.finalY + 10);
  autoTable(doc, { startY: doc.lastAutoTable.finalY + 15, body: [['Nombres:', datosGarante.nombres, 'Apellidos:', datosGarante.apellidos], ['Cedula:', datosGarante.cedula, 'Fecha Nacimiento:', datosGarante.fechaNacimiento], ['Sexo:', datosGarante.sexo, 'Estado Civil:', datosGarante.estadoCivil], ['Telefono Residencial:', datosGarante.telefonoResidencial, 'Telefono Movil:', datosGarante.telefonoMovil], ['E-mail:', datosGarante.email, 'Nacionalidad:', datosGarante.nacionalidad], ['Provincia:', datosGarante.provincia, 'Direccion:', datosGarante.direccion], ['Referencia:', datosGarante.referencia, 'Nombre Empresa:', datosGarante.nombreEmpresa], ['Tiempo Laborando:', datosGarante.tiempoLaborando, 'Cargo:', datosGarante.cargo], ['Direccion Trabajo:', datosGarante.direccionTrabajo, 'Telefono Trabajo:', datosGarante.telefonoTrabajo], ['Salario:', datosGarante.salario, 'Nombre Conyugue:', datosGarante.nombreConyugue], ['Telefono Conyugue:', datosGarante.telefonoConyugue, '']], theme: 'grid', styles: { fontSize: 10 } });
  const finalY = doc.lastAutoTable.finalY + 20;
  doc.text('Firma del Solicitante', 30, finalY);
  doc.text('Firma del Garante', 140, finalY);
  const pdfData = doc.output('datauristring');
  Swal.fire({
    title: 'Solicitud de Financiamiento',
    html: '<embed src="' + pdfData + '" type="application/pdf" width="100%" height="500px"/>',
    width: '80%', showCloseButton: true, confirmButtonText: 'Cerrar'
  });
};
/************************************************************************/
</script>
<template>
<main class="content-wrapper">
  <div class="p-4 md:p-6">
    <div class="flex flex-col gap-6">

      <!-- HEADER -->
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div class="flex flex-wrap items-center gap-2">
          <Button as="router-link" icon="pi pi-home" severity="secondary" v-tooltip.top="'Listado'" to="/financiamientos" />
          <Button as="router-link" icon="pi pi-plus" severity="success" v-tooltip.top="'Nuevo'" to="/crearfinanciamientos" />
          <Button icon="pi pi-trash" severity="danger" v-tooltip.top="'Eliminar'" @click="borrarEntrada" />
          <span class="w-px h-6 bg-slate-300 dark:bg-slate-600 mx-1"></span>
          <Button icon="pi pi-step-backward" severity="secondary" v-tooltip.top="'Primero'" @click="navigate('primero')" />
          <Button icon="pi pi-chevron-left" severity="secondary" v-tooltip.top="'Anterior'" @click="navigate('anterior')" />
          <Button icon="pi pi-chevron-right" severity="secondary" v-tooltip.top="'Siguiente'" @click="navigate('siguiente')" />
          <Button icon="pi pi-step-forward" severity="secondary" v-tooltip.top="'Ultimo'" @click="navigate('ultimo')" />
          <span class="w-px h-6 bg-slate-300 dark:bg-slate-600 mx-1"></span>
          <Button icon="pi pi-save" label="Guardar" severity="contrast" @click="funcionActualizar" />
          <Button icon="pi pi-dollar" label="Abonar" severity="success" @click="fnAbonar" />
          <Button icon="pi pi-file-pdf" label="Recibo" severity="info" @click="generarRecibo" />
        </div>
      </div>

      <!-- TITLE + SUMMARY ROW -->
      <div class="flex flex-col lg:flex-row gap-6">
        <div class="flex-1">
          <h1 class="text-2xl font-bold text-slate-900 dark:text-slate-100">{{ datoscampos.nombre_cliente || 'Financiamiento' }}</h1>
          <p class="text-sm text-slate-500 dark:text-slate-400 mt-1">{{ datoscampos.no_financiamiento || 'Sin codigo' }} · {{ datoscampos.estado_financiamiento || 'Sin estado' }}</p>
        </div>
        <div class="flex flex-wrap gap-4">
          <div v-for="item in resumenFinanciamiento" :key="item.label" class="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 px-4 py-3 min-w-[120px] text-center">
            <span class="block text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">{{ item.label }}</span>
            <strong class="block text-lg mt-1 text-slate-900 dark:text-slate-100">{{ item.value }}</strong>
          </div>
        </div>
      </div>

      <!-- SCORE CARD -->
      <div class="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-5">
        <div class="flex flex-col lg:flex-row lg:items-center gap-6">
          <div class="flex-1">
            <span class="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Analisis actual</span>
            <h3 class="text-lg font-bold text-slate-900 dark:text-slate-100 mt-1">Score AA</h3>
          </div>
          <div class="flex items-center gap-4">
            <div class="text-center">
              <div class="text-4xl font-extrabold" :class="scoreAAVisual.textClass">{{ scoreAAVisual.score }}</div>
              <div class="text-xs text-slate-500 dark:text-slate-400">de 100 pts</div>
            </div>
            <div class="flex-1 min-w-[200px]">
              <div class="flex justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
                <span>0</span><span>50</span><span>100</span>
              </div>
              <div class="h-3 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden shadow-inner">
                <div class="h-full rounded-full transition-all duration-300" :style="{ width: `${scoreAAVisual.percentage}%`, background: scoreAAVisual.gradient, boxShadow: `0 0 12px ${scoreAAVisual.glow}` }"></div>
              </div>
              <div class="flex items-center gap-2 mt-2">
                <span :class="['text-sm font-bold', scoreAAVisual.textClass]">{{ scoreAAVisual.label }}</span>
                <span class="text-xs text-slate-400 dark:text-slate-500">{{ scoreAAVisual.percentage }}%</span>
                <span class="text-xs text-slate-500 dark:text-slate-400">{{ scoreAAVisual.recommendation }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- FORM TABS -->
      <div class="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div class="border-b border-slate-200 dark:border-slate-700 px-5 py-3 bg-slate-50 dark:bg-slate-800/50">
          <Tabs v-model:value="value" class="custom-tabs">
            <TabList>
              <Tab value="0"><i class="pi pi-user mr-2"></i>Cliente</Tab>
              <Tab value="1"><i class="pi pi-file-edit mr-2"></i>Solicitud</Tab>
              <Tab value="2"><i class="pi pi-users mr-2"></i>Garante</Tab>
              <Tab value="3"><i class="pi pi-box mr-2"></i>Articulos</Tab>
              <Tab value="4"><i class="pi pi-file mr-2"></i>Docs</Tab>
              <Tab value="5"><i class="pi pi-chart-line mr-2"></i>Condiciones</Tab>
              <Tab value="6"><i class="pi pi-truck mr-2"></i>Entrega</Tab>
              <Tab value="7"><i class="pi pi-dollar mr-2"></i>Pagos</Tab>
              <Tab value="8"><i class="pi pi-print mr-2"></i>Docs Generar</Tab>
              <Tab value="9"><i class="pi pi-check-circle mr-2"></i>Finalizar</Tab>
            </TabList>
          </Tabs>
        </div>
        <form id="formularioGenerar" action="" method="">
          <Tabs v-model:value="value" scrollable>
            <TabPanels>
              <TabPanel value="0">
                <div class="p-6 space-y-6" id="campos">
                    <div class="section-card">
                      <div class="section-card__header section-card__header--blue"><i class="pi pi-user text-2xl"></i><h3 class="text-lg font-bold">Información del Cliente</h3></div>
                      <div class="section-card__body"><div class="grid grid-cols-12 gap-4">
                        <div class="col-span-12 sm:col-span-6 md:col-span-4 lg:col-span-4 xl:col-span-4 2xl:col-span-4"><label class="block text-sm font-medium text-gray-700 dark:text-gray-400" for="cedula_cliente">CEDULA_CLIENTE</label><InputGroup><InputText placeholder="cedula_cliente" v-model="datoscampos.cedula_cliente" /><InputGroupAddon><Button icon="pi pi-search" severity="secondary" variant="text" /></InputGroupAddon></InputGroup></div>
                        <div class="col-span-12 sm:col-span-6 md:col-span-8 lg:col-span-8 xl:col-span-8 2xl:col-span-8"><label class="block text-sm font-medium text-gray-700 dark:text-gray-400" for="nombre_cliente">NOMBRE_CLIENTE</label><InputText fluid type="text" v-mayuscula v-model="datoscampos.nombre_cliente" name="nombre_cliente" placeholder="nombre_cliente" id="actualizarnombre_cliente" /></div>
                        <div class="col-span-12 sm:col-span-6 md:col-span-4 lg:col-span-4 xl:col-span-4 2xl:col-span-4"><label class="block text-sm font-medium text-gray-700 dark:text-gray-400" for="telefono_cliente">TELEFONO_CLIENTE</label><InputMask fluid :mask="patronTelefono" v-model="datoscampos.telefono_cliente" placeholder="telefono_cliente" name="actualizartelefono_cliente" id="telefono_cliente" /></div>
                        <div class="col-span-12 sm:col-span-6 md:col-span-4 lg:col-span-4 xl:col-span-4 2xl:col-span-4"><label class="block text-sm font-medium text-gray-700 dark:text-gray-400" for="whatsapp_cliente">WHATSAPP_CLIENTE</label><InputMask fluid :mask="patronTelefono" v-model="datoscampos.whatsapp_cliente" placeholder="whatsapp_cliente" name="actualizarwhatsapp_cliente" id="whatsapp_cliente" /></div>
                        <div class="col-span-12 sm:col-span-6 md:col-span-4 lg:col-span-4 xl:col-span-4 2xl:col-span-4"><label class="block text-sm font-medium text-gray-700 dark:text-gray-400" for="email_cliente">EMAIL_CLIENTE</label><InputText fluid type="text" v-model="datoscampos.email_cliente" name="email_cliente" placeholder="email_cliente" id="actualizaremail_cliente" /></div>
                        <div class="col-span-12"><label class="block text-sm font-medium text-gray-700 dark:text-gray-400" for="direccion_cliente">DIRECCION_CLIENTE</label><Textarea fluid id="actualizardireccion_cliente" v-model="datoscampos.direccion_cliente" name="direccion_cliente" rows="3" class="form-textarea w-full" placeholder="Enter Direccion_cliente"></Textarea></div>
                        <div class="col-span-12"><label class="block text-sm font-medium text-gray-700 dark:text-gray-400" for="referencia_direccion_cliente">REFERENCIA_DIRECCION_CLIENTE</label><Textarea fluid id="actualizarreferencia_direccion_cliente" v-model="datoscampos.referencia_direccion_cliente" name="referencia_direccion_cliente" rows="3" class="form-textarea w-full" placeholder="Enter Referencia_direccion_cliente"></Textarea></div>
                      </div></div>
                    </div>
                    <div class="section-card">
                      <div class="section-card__header section-card__header--purple"><i class="pi pi-calendar text-2xl"></i><h3 class="text-lg font-bold">Datos Personales</h3></div>
                      <div class="section-card__body"><div class="grid grid-cols-12 gap-4">
                        <div class="col-span-12 sm:col-span-6 md:col-span-2"><label class="block text-sm font-medium text-gray-700 dark:text-gray-400" for="fecha_nacimiento">FECHA_NACIMIENTO</label><flat-pickr v-model="datoscampos.fecha_nacimiento" class="form-input w-full p-inputtext p-component p-filled p-inputtext-fluid" :config="basic"></flat-pickr></div>
                        <div class="col-span-12 sm:col-span-6 md:col-span-2"><label class="block text-sm font-medium text-gray-700 dark:text-gray-400" for="edad_cliente">EDAD_CLIENTE</label><InputText fluid type="text" v-solonumeros v-model="datoscampos.edad_cliente" name="edad_cliente" placeholder="edad_cliente" id="actualizaredad_cliente" /></div>
                        <div class="col-span-12 sm:col-span-6 md:col-span-2"><label class="block text-sm font-medium text-gray-700 dark:text-gray-400" for="estado_civil">ESTADO_CIVIL</label><Dropdown fluid editable v-model="datoscampos.estado_civil" :options="['SOLTERO','CASADO','UNION_LIBRE','DIVORCIADO']" placeholder="Seleccione estado_civil" class="w-full" /></div>
                      </div></div>
                    </div>
                    <div class="section-card">
                      <div class="section-card__header section-card__header--pink"><i class="pi pi-heart-fill text-2xl"></i><h3 class="text-lg font-bold">Información del Cónyuge</h3></div>
                      <div class="section-card__body"><div class="grid grid-cols-12 gap-4">
                        <div class="col-span-12 sm:col-span-6 md:col-span-8"><label class="block text-sm font-medium text-gray-700 dark:text-gray-400" for="nombre_conyugue">NOMBRE_CONYUGUE</label><InputText fluid type="text" v-mayuscula v-model="datoscampos.nombre_conyugue" name="nombre_conyugue" placeholder="nombre_conyugue" id="actualizarnombre_conyugue" /></div>
                        <div class="col-span-12 sm:col-span-6 md:col-span-4"><label class="block text-sm font-medium text-gray-700 dark:text-gray-400" for="telefono_conyugue">TELEFONO_CONYUGUE</label><InputMask fluid :mask="patronTelefono" v-model="datoscampos.telefono_conyugue" placeholder="telefono_conyugue" name="actualizartelefono_conyugue" id="telefono_conyugue" /></div>
                      </div></div>
                    </div>
                    <div class="section-card">
                      <div class="section-card__header section-card__header--green"><i class="pi pi-briefcase text-2xl"></i><h3 class="text-lg font-bold">Información Laboral</h3></div>
                      <div class="section-card__body"><div class="grid grid-cols-12 gap-4">
                        <div class="col-span-12 sm:col-span-6 md:col-span-2"><label class="block text-sm font-medium text-gray-700 dark:text-gray-400" for="ocupcion">OCUPCION</label><InputText fluid type="text" v-mayuscula v-model="datoscampos.ocupcion" name="ocupcion" placeholder="ocupcion" id="actualizarocupcion" /></div>
                        <div class="col-span-12 sm:col-span-6 md:col-span-2"><label class="block text-sm font-medium text-gray-700 dark:text-gray-400" for="salario">SALARIO</label><InputText fluid type="text" v-solonumeros v-decimales v-numeroFocusinOut v-model="datoscampos.salario" name="salario" placeholder="salario" id="actualizarsalario" /></div>
                        <div class="col-span-12 sm:col-span-6 md:col-span-2"><label class="block text-sm font-medium text-gray-700 dark:text-gray-400" for="tiempo_laborando">TIEMPO_LABORANDO</label><InputText fluid type="text" v-solonumeros v-model="datoscampos.tiempo_laborando" name="tiempo_laborando" placeholder="tiempo_laborando" id="actualizartiempo_laborando" /></div>
                        <div class="col-span-12 sm:col-span-6 md:col-span-2"><label class="block text-sm font-medium text-gray-700 dark:text-gray-400" for="tipo_empresa">TIPO_EMPRESA</label><Dropdown fluid editable v-model="datoscampos.tipo_empresa" :options="['PUBLICA','PRIVADA']" placeholder="Seleccione tipo_empresa" class="w-full" /></div>
                        <div class="col-span-12 sm:col-span-6 md:col-span-2"><label class="block text-sm font-medium text-gray-700 dark:text-gray-400" for="empresa_labora">EMPRESA_LABORA</label><InputText fluid type="text" v-mayuscula v-model="datoscampos.empresa_labora" name="empresa_labora" placeholder="empresa_labora" id="actualizarempresa_labora" /></div>
                        <div class="col-span-12 sm:col-span-6 md:col-span-2"><label class="block text-sm font-medium text-gray-700 dark:text-gray-400" for="contacto_empresa">CONTACTO_EMPRESA</label><InputMask fluid :mask="patronTelefono" v-model="datoscampos.contacto_empresa" placeholder="contacto_empresa" name="actualizarcontacto_empresa" id="contacto_empresa" /></div>
                        <div class="col-span-12 sm:col-span-6 md:col-span-3"><label class="block text-sm font-medium text-gray-700 dark:text-gray-400" for="ingresos_adicionales">INGRESOS_ADICIONALES</label><InputText fluid type="text" v-solonumeros v-decimales v-numeroFocusinOut v-model="datoscampos.ingresos_adicionales" name="ingresos_adicionales" placeholder="ingresos_adicionales" id="actualizaringresos_adicionales" /></div>
                      </div></div>
                    </div>
                    <div class="section-card">
                      <div class="section-card__header section-card__header--orange"><i class="pi pi-home text-2xl"></i><h3 class="text-lg font-bold">Información Patrimonial</h3></div>
                      <div class="section-card__body"><div class="grid grid-cols-12 gap-4">
                        <div class="col-span-12 sm:col-span-6 md:col-span-3"><label class="block text-sm font-medium text-gray-700 dark:text-gray-400" for="tipo_vivienda">TIPO_VIVIENDA</label><Dropdown fluid editable v-model="datoscampos.tipo_vivienda" :options="['PROPIA','ALQUILADA']" placeholder="Seleccione tipo_vivienda" class="w-full" /></div>
                        <div class="col-span-12 sm:col-span-6 md:col-span-3"><label class="block text-sm font-medium text-gray-700 dark:text-gray-400" for="vehiculo">VEHICULO</label><Dropdown fluid editable v-model="datoscampos.vehiculo" :options="['PROPIO','OPOSICION']" placeholder="Seleccione vehiculo" class="w-full" /></div>
                        <div class="col-span-12 sm:col-span-6 md:col-span-3"><label class="block text-sm font-medium text-gray-700 dark:text-gray-400" for="cantidad_hijos">CANTIDAD_HIJOS</label><InputText fluid type="text" v-solonumeros v-model="datoscampos.cantidad_hijos" name="cantidad_hijos" placeholder="cantidad_hijos" id="actualizarcantidad_hijos" /></div>
                        <div class="col-span-12 sm:col-span-6 md:col-span-3"><label class="block text-sm font-medium text-gray-700 dark:text-gray-400" for="cantidad_dependientes">CANTIDAD_DEPENDIENTES</label><InputText fluid type="text" v-solonumeros v-model="datoscampos.cantidad_dependientes" name="cantidad_dependientes" placeholder="cantidad_dependientes" id="actualizarcantidad_dependientes" /></div>
                      </div></div>
                    </div>
                    <div class="section-card">
                      <div class="section-card__header section-card__header--indigo"><i class="pi pi-users text-2xl"></i><h3 class="text-lg font-bold">Referencias Familiares</h3></div>
                      <div class="section-card__body"><div class="grid grid-cols-12 gap-4">
                        <div class="col-span-12 sm:col-span-6 md:col-span-4"><label class="block text-sm font-medium text-gray-700 dark:text-gray-400" for="referencia_familiar1">REFERENCIA_FAMILIAR1</label><InputText fluid type="text" v-mayuscula v-model="datoscampos.referencia_familiar1" name="referencia_familiar1" placeholder="referencia_familiar1" id="actualizarreferencia_familiar1" /></div>
                        <div class="col-span-12 sm:col-span-6 md:col-span-2"><label class="block text-sm font-medium text-gray-700 dark:text-gray-400" for="contacto_familiar1">CONTACTO_FAMILIAR1</label><InputMask fluid :mask="patronTelefono" v-model="datoscampos.contacto_familiar1" placeholder="contacto_familiar1" name="actualizarcontacto_familiar1" id="contacto_familiar1" /></div>
                        <div class="col-span-12 sm:col-span-6 md:col-span-4"><label class="block text-sm font-medium text-gray-700 dark:text-gray-400" for="referencia_familiar2">REFERENCIA_FAMILIAR2</label><InputText fluid type="text" v-mayuscula v-model="datoscampos.referencia_familiar2" name="referencia_familiar2" placeholder="referencia_familiar2" id="actualizarreferencia_familiar2" /></div>
                        <div class="col-span-12 sm:col-span-6 md:col-span-2"><label class="block text-sm font-medium text-gray-700 dark:text-gray-400" for="contacto_familiar2">CONTACTO_FAMILIAR2</label><InputMask fluid :mask="patronTelefono" v-model="datoscampos.contacto_familiar2" placeholder="contacto_familiar2" name="actualizarcontacto_familiar2" id="contacto_familiar2" /></div>
                      </div></div>
                    </div>
                    <div class="section-card">
                      <div class="section-card__header section-card__header--cyan"><i class="pi pi-id-card text-2xl"></i><h3 class="text-lg font-bold">Referencias Personales</h3></div>
                      <div class="section-card__body"><div class="grid grid-cols-12 gap-4">
                        <div class="col-span-12 sm:col-span-6 md:col-span-4"><label class="block text-sm font-medium text-gray-700 dark:text-gray-400" for="referencia_personal1">REFERENCIA_PERSONAL1</label><InputText fluid type="text" v-mayuscula v-model="datoscampos.referencia_personal1" name="referencia_personal1" placeholder="referencia_personal1" id="actualizarreferencia_personal1" /></div>
                        <div class="col-span-12 sm:col-span-6 md:col-span-2"><label class="block text-sm font-medium text-gray-700 dark:text-gray-400" for="contacto_personal1">CONTACTO_PERSONAL1</label><InputMask fluid :mask="patronTelefono" v-model="datoscampos.contacto_personal1" placeholder="contacto_personal1" name="actualizarcontacto_personal1" id="contacto_personal1" /></div>
                        <div class="col-span-12 sm:col-span-6 md:col-span-4"><label class="block text-sm font-medium text-gray-700 dark:text-gray-400" for="referencia_personal2">REFERENCIA_PERSONAL2</label><InputText fluid type="text" v-mayuscula v-model="datoscampos.referencia_personal2" name="referencia_personal2" placeholder="referencia_personal2" id="actualizarreferencia_personal2" /></div>
                        <div class="col-span-12 sm:col-span-6 md:col-span-2"><label class="block text-sm font-medium text-gray-700 dark:text-gray-400" for="contacto_personal2">CONTACTO_PERSONAL2</label><InputMask fluid :mask="patronTelefono" v-model="datoscampos.contacto_personal2" placeholder="contacto_personal2" name="actualizarcontacto_personal2" id="contacto_personal2" /></div>
                      </div></div>
                    </div>
                    <div class="section-card">
                      <div class="section-card__header section-card__header--violet"><i class="pi pi-share-alt text-2xl"></i><h3 class="text-lg font-bold">Redes Sociales</h3></div>
                      <div class="section-card__body"><label class="block text-sm font-medium text-gray-700 dark:text-gray-400" for="redes_solciales">REDES_SOLCIALES</label><div class="table-responsive border p-3 rounded mb-2 overflow-x-auto"><div v-html="generarTablaFromStringJSON(datoscampos.redes_solciales)" class="border p-3 rounded mb-2"></div></div></div>
                    </div>
                  </div>
                </TabPanel>
                <TabPanel value="1">
                  <div class="p-4 space-y-6">
                    <div class="section-card">
                      <div class="section-card__header section-card__header--blue"><i class="pi pi-file-edit text-2xl"></i><h3 class="text-lg font-bold">Información General de Solicitud</h3></div>
                      <div class="section-card__body"><div class="grid grid-cols-12 gap-4">
                        <div class="col-span-12 sm:col-span-6 md:col-span-2"><label class="block text-sm font-medium text-gray-700 dark:text-gray-400" for="no_financiamiento">NO_FINANCIAMIENTO</label><InputText fluid type="text" v-model="datoscampos.no_financiamiento" name="no_financiamiento" placeholder="no_financiamiento" id="actualizarno_financiamiento" /></div>
                        <div class="col-span-12 sm:col-span-6 md:col-span-2"><label class="block text-sm font-medium text-gray-700 dark:text-gray-400" for="fecha_solicitud">FECHA_SOLICITUD</label><InputText fluid type="text" v-model="datoscampos.fecha_solicitud" name="fecha_solicitud" placeholder="fecha_solicitud" id="actualizarfecha_solicitud" /></div>
                        <div class="col-span-12 sm:col-span-6 md:col-span-2"><label class="block text-sm font-medium text-gray-700 dark:text-gray-400" for="hora_emision">HORA_EMISION</label><InputText fluid type="text" v-model="datoscampos.hora_emision" name="hora_emision" placeholder="hora_emision" id="actualizarhora_emision" /></div>
                        <div class="col-span-12 sm:col-span-6 md:col-span-2"><label class="block text-sm font-medium text-gray-700 dark:text-gray-400" for="etapa_solicitud">ETAPA_SOLICITUD</label><Dropdown fluid editable v-model="datoscampos.etapa_solicitud" :options="['PROSPECTO','VALIDACION','ANALISIS','FIRMA CLIENTE','ENTREGA','']" placeholder="Seleccione etapa_solicitud" class="w-full" /></div>
                        <div class="col-span-12 sm:col-span-6 md:col-span-2"><label class="block text-sm font-medium text-gray-700 dark:text-gray-400" for="agente">AGENTE</label><InputText fluid type="text" v-mayuscula v-model="datoscampos.agente" name="agente" placeholder="agente" id="actualizaragente" /></div>
                      </div></div>
                    </div>
                    <div class="section-card">
                      <div class="section-card__header section-card__header--purple"><i class="pi pi-chart-line text-2xl"></i><h3 class="text-lg font-bold">Estado y Evaluación</h3></div>
                      <div class="section-card__body"><div class="grid grid-cols-12 gap-4">
                        <div class="col-span-12 sm:col-span-6 md:col-span-3"><label class="block text-sm font-medium text-gray-700 dark:text-gray-400" for="score_aa">SCORE_AA</label><InputText fluid type="text" v-solonumeros v-model="datoscampos.score_aa" name="score_aa" placeholder="score_aa" id="actualizarscore_aa" /></div>
                        <div class="col-span-12 sm:col-span-6 md:col-span-3"><label class="block text-sm font-medium text-gray-700 dark:text-gray-400" for="resultados_prospecto">RESULTADOS_PROSPECTO</label><Dropdown fluid editable v-model="datoscampos.resultados_prospecto" :options="['PENDIENTE','APROBADO','APLAZADO','DECLINADO']" placeholder="Seleccione resultados_prospecto" class="w-full" /></div>
                        <div class="col-span-12 sm:col-span-6 md:col-span-3"><label class="block text-sm font-medium text-gray-700 dark:text-gray-400" for="resultado_analisis">RESULTADO_ANALISIS</label><Dropdown fluid editable v-model="datoscampos.resultado_analisis" :options="['PENDIENTE','APROBADO','APLAZADO','DECLINADO']" placeholder="Seleccione resultado_analisis" class="w-full" /></div>
                      </div></div>
                    </div>
                    <div class="section-card">
                      <div class="section-card__header section-card__header--orange"><i class="pi pi-comment text-2xl"></i><h3 class="text-lg font-bold">Motivo de Solicitud</h3></div>
                      <div class="section-card__body"><label class="block text-sm font-medium text-gray-700 dark:text-gray-400" for="motivo">MOTIVO</label><Textarea fluid id="actualizarmotivo" v-model="datoscampos.motivo" name="motivo" rows="3" class="form-textarea w-full" placeholder="Enter Motivo"></Textarea></div>
                    </div>
                  </div>
                </TabPanel>
                <TabPanel value="2">
                  <div class="p-4 space-y-6">
                    <div class="section-card">
                      <div class="section-card__header section-card__header--blue"><i class="pi pi-users text-2xl"></i><h3 class="text-lg font-bold">Información del Codeudor</h3></div>
                      <div class="section-card__body"><div class="grid grid-cols-12 gap-4">
                        <div class="col-span-12 sm:col-span-12 md:col-span-4"><label class="block text-sm font-medium text-gray-700 dark:text-gray-400" for="cedula_garante">CEDULA_GARANTE</label><InputMask fluid :mask="patronTelefono" v-model="datoscampos.cedula_garante" placeholder="cedula_garante" name="actualizarcedula_garante" id="cedula_garante" /></div>
                        <div class="col-span-12 sm:col-span-12 md:col-span-8"><label class="block text-sm font-medium text-gray-700 dark:text-gray-400" for="nombre_garante">NOMBRE_GARANTE</label><InputText fluid type="text" v-mayuscula v-model="datoscampos.nombre_garante" name="nombre_garante" placeholder="nombre_garante" id="actualizarnombre_garante" /></div>
                        <div class="col-span-12 sm:col-span-6 md:col-span-3"><label class="block text-sm font-medium text-gray-700 dark:text-gray-400" for="telefono_garante">TELEFONO_GARANTE</label><InputMask fluid :mask="patronTelefono" v-model="datoscampos.telefono_garante" placeholder="telefono_garante" name="actualizartelefono_garante" id="telefono_garante" /></div>
                        <div class="col-span-12 sm:col-span-6 md:col-span-3"><label class="block text-sm font-medium text-gray-700 dark:text-gray-400" for="whatsapp_garante">WHATSAPP_GARANTE</label><InputMask fluid :mask="patronTelefono" v-model="datoscampos.whatsapp_garante" placeholder="whatsapp_garante" name="actualizarwhatsapp_garante" id="whatsapp_garante" /></div>
                        <div class="col-span-12 sm:col-span-6 md:col-span-3"><label class="block text-sm font-medium text-gray-700 dark:text-gray-400" for="email_garante">EMAIL_GARANTE</label><InputText fluid type="text" v-model="datoscampos.email_garante" name="email_garante" placeholder="email_garante" id="actualizaremail_garante" /></div>
                        <div class="col-span-12 sm:col-span-6 md:col-span-3"><label class="block text-sm font-medium text-gray-700 dark:text-gray-400" for="vinculo_deudor">VINCULO_DEUDOR</label><Dropdown fluid editable v-model="datoscampos.vinculo_deudor" :options="['ESPOSO(A)','HERMANO(A)','MADRE','PADRE','FAMILIAR','AMIGO']" placeholder="Seleccione vinculo_deudor" class="w-full" /></div>
                      </div></div>
                    </div>
                    <div class="section-card">
                      <div class="section-card__header section-card__header--green"><i class="pi pi-map-marker text-2xl"></i><h3 class="text-lg font-bold">Dirección del Codeudor</h3></div>
                      <div class="section-card__body"><div class="grid grid-cols-12 gap-4">
                        <div class="col-span-12"><label class="block text-sm font-medium text-gray-700 dark:text-gray-400" for="direccion_garante">DIRECCION_GARANTE</label><Textarea fluid id="actualizardireccion_garante" v-model="datoscampos.direccion_garante" name="direccion_garante" rows="3" class="form-textarea w-full" placeholder="Enter Direccion_garante"></Textarea></div>
                        <div class="col-span-12"><label class="block text-sm font-medium text-gray-700 dark:text-gray-400" for="referencia_direccion_garante">REFERENCIA_DIRECCION_GARANTE</label><Textarea fluid id="actualizarreferencia_direccion_garante" v-model="datoscampos.referencia_direccion_garante" name="referencia_direccion_garante" rows="3" class="form-textarea w-full" placeholder="Enter Referencia_direccion_garante"></Textarea></div>
                      </div></div>
                    </div>
                  </div>
                </TabPanel>
                <TabPanel value="3">

<div class="grid grid-cols-12 gap-4 mt-4 text-blue-600" >
<div class="col-span-12 sm:col-span-12 md:col-span-12 lg:col-span-12 xl:col-span-12 2xl:col-span-12">
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-400" for="articulos">ARTICULOS</label>
                     <div class="table-responsive border p-3 rounded mb-2 overflow-x-auto">
                      <div v-html="generarTablaFromStringJSON(datoscampos.articulos)" class="border p-3 rounded mb-2">
                      </div>
                     </div>
                   </div>
                   </div>
                </TabPanel>
                <TabPanel value="4">

<div class="grid grid-cols-12 gap-4 mt-4 text-blue-600" >
<div class="form-group col-span-12">
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-400" for="imagen-Actualizador">IMAGEN</label>

                <FileUpload
                  :customUpload="true"
                  :auto="true"
                  :showUploadButton="false"
                  chooseLabel="Seleccionar Imagenes"
                  @uploader="handleUpload"
                  :multiple="true" 
                />
                <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-4 mt-2">
                  <div class="border rounded-lg shadow-md p-4" v-for="imagen in arrayIMG" :key="imagen">
                    <div class="mb-3">
                      <div class="relative mx-auto">

                         <Image v-if="esImagen(imagen.nombre)" :src="imagen.url" alt="Image" class="w-full border-round" width="250" preview />



<div v-else-if="esPdf(imagen.nombre)" class="flex flex-col items-center">
    <div class="flex justify-center items-center">
        <i class="pi pi-file-pdf text-red-600" style="font-size: 50px;"></i>
    </div>
    <div class="mt-2">{{imagen.nombreSolo}}</div> 
</div>
                        <div v-else-if="esWord(imagen.nombre)" class="flex flex-col items-center">
                          <div class="flex justify-center items-center">
                            <i class="pi pi-file-word text-blue-600 text-6xl" style="font-size: 50px;"></i>
                          </div>
                          <div class="mt-2">{{imagen.nombreSolo}}</div> 
                        </div>


                        <div v-else class="flex justify-center">
                          <i class="pi pi-file text-gray-600 text-6xl"></i>
                        </div>
                      </div>
                    </div>
<div class="grid grid-cols-1 gap-4 mt-2">
    <div class="flex justify-center space-x-2">
        <button
            class="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded flex items-center justify-center"
            @click.prevent="downloadImage(imagen.url)"
        >
            <i class="pi pi-download mr-2"></i> Descargar
        </button>
        <button
            class="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded flex items-center justify-center"
            @click.prevent="deleteImage(imagen.nombre)"
        >
            <i class="pi pi-trash mr-2"></i> Eliminar
        </button>
    </div>
</div>

                  </div>
                </div>
              </div>
              </div>

                </TabPanel>
                <TabPanel value="5">

<div class="grid grid-cols-12 gap-4 mt-4 text-blue-600" >
<div class="col-span-12 sm:col-span-6 md:col-span-2 lg:col-span-2 xl:col-span-2 2xl:col-span-2">
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-400" for="inicial">INICIAL</label>
                <InputText fluid type="text"  v-solonumeros v-decimales v-numeroFocusinOut class=" " v-model="datoscampos.inicial" name="inicial" placeholder="inicial" id="actualizarinicial" />
            </div>
<div class="col-span-12 sm:col-span-6 md:col-span-2 lg:col-span-2 xl:col-span-2 2xl:col-span-2">
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-400" for="capital">CAPITAL</label>
                <InputText fluid type="text"  v-solonumeros v-decimales v-numeroFocusinOut class=" " v-model="datoscampos.capital" name="capital" placeholder="capital" id="actualizarcapital" />
            </div>
<div class="col-span-12 sm:col-span-6 md:col-span-2 lg:col-span-2 xl:col-span-2 2xl:col-span-2">
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-400" for="tasa_interes">TASA_INTERES</label>
                <InputText fluid type="text"  v-solonumeros v-decimales v-numeroFocusinOut class=" " v-model="datoscampos.tasa_interes" name="tasa_interes" placeholder="tasa_interes" id="actualizartasa_interes" />
            </div>
<div class="col-span-12 sm:col-span-6 md:col-span-2 lg:col-span-2 xl:col-span-2 2xl:col-span-2">
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-400" for="interes_total">INTERES_TOTAL</label>
                <InputText fluid type="text"  v-solonumeros v-decimales v-numeroFocusinOut class=" " v-model="datoscampos.interes_total" name="interes_total" placeholder="interes_total" id="actualizarinteres_total" />
            </div>
<div class="col-span-12 sm:col-span-6 md:col-span-2 lg:col-span-2 xl:col-span-2 2xl:col-span-2">
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-400" for="no_cuotas">NO_CUOTAS</label>
                <InputText fluid type="text"  v-solonumeros v-decimales v-numeroFocusinOut class=" " v-model="datoscampos.no_cuotas" name="no_cuotas" placeholder="no_cuotas" id="actualizarno_cuotas" />
            </div>
<div class="col-span-12 sm:col-span-6 md:col-span-2 lg:col-span-2 xl:col-span-2 2xl:col-span-2">
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-400" for="valor_cuotas">VALOR_CUOTAS</label>
                <InputText fluid type="text"  v-solonumeros v-decimales v-numeroFocusinOut class=" " v-model="datoscampos.valor_cuotas" name="valor_cuotas" placeholder="valor_cuotas" id="actualizarvalor_cuotas" />
            </div>
<div class="col-span-12 sm:col-span-6 md:col-span-2 lg:col-span-2 xl:col-span-2 2xl:col-span-2">
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-400" for="gastos_legales">GASTOS_LEGALES</label>
                <InputText fluid type="text"  v-solonumeros v-decimales v-numeroFocusinOut class=" " v-model="datoscampos.gastos_legales" name="gastos_legales" placeholder="gastos_legales" id="actualizargastos_legales" />
            </div>
<div class="col-span-12 sm:col-span-6 md:col-span-2 lg:col-span-2 xl:col-span-2 2xl:col-span-2">
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-400" for="monto_total">MONTO_TOTAL</label>
                <InputText fluid type="text"  v-solonumeros v-decimales v-numeroFocusinOut class=" " v-model="datoscampos.monto_total" name="monto_total" placeholder="monto_total" id="actualizarmonto_total" />
            </div>
<div class="col-span-12 sm:col-span-6 md:col-span-2 lg:col-span-2 xl:col-span-2 2xl:col-span-2">
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-400" for="total_abonado">TOTAL_ABONADO</label>
                <InputText fluid type="text"  v-solonumeros v-decimales v-numeroFocusinOut class=" " v-model="datoscampos.total_abonado" name="total_abonado" placeholder="total_abonado" id="actualizartotal_abonado" />
            </div>
<div class="col-span-12 sm:col-span-6 md:col-span-2 lg:col-span-2 xl:col-span-2 2xl:col-span-2">
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-400" for="total_pendiente">TOTAL_PENDIENTE</label>
                <InputText fluid type="text"  v-solonumeros v-decimales v-numeroFocusinOut class=" " v-model="datoscampos.total_pendiente" name="total_pendiente" placeholder="total_pendiente" id="actualizartotal_pendiente" />
            </div>
<div class="col-span-12 sm:col-span-6 md:col-span-2 lg:col-span-2 xl:col-span-2 2xl:col-span-2">
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-400" for="frecuencia_pago">FRECUENCIA_PAGO</label>
                    <Dropdown fluid editable v-model="datoscampos.frecuencia_pago" :options="['SEMANAL','QUINCENAL','MENSUAL']" placeholder="Seleccione frecuencia_pago" class="w-full" />
            </div>
<div class="col-span-12 sm:col-span-12 md:col-span-12 lg:col-span-12 xl:col-span-12 2xl:col-span-12">
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-400" for="fechas_pago">FECHAS_PAGO</label>
                      <TablaJSON 
                      :productos="datoscampos.fechas_pago" 
                      tableId="tablaFechas"
                      :onEditar="editarFila"
                      :onEliminar="eliminarFila"
                      :onClickProducto="fnFechaSeleccionada"
                      :rowColorCallback="getRowColor"
                      :indice="true"
                      :botones="true"
                       />
                       <!-- Tailwind evitará purgar estas clases si las ve aquí -->
<div class="hidden bg-red-100 bg-green-100 bg-yellow-100">
</div>

                   </div>
<div class="col-span-12 sm:col-span-6 md:col-span-2 lg:col-span-2 xl:col-span-2 2xl:col-span-2">
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-400" for="proximo_pago">PROXIMO_PAGO</label>
                    <flat-pickr v-model="datoscampos.proximo_pago"  class="form-input w-full p-inputtext p-component p-filled p-inputtext-fluid" :config="basic"></flat-pickr>
            </div>
<div class="col-span-12 sm:col-span-6 md:col-span-2 lg:col-span-2 xl:col-span-2 2xl:col-span-2">
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-400" for="prorrateo">PRORRATEO</label>
                <InputText fluid type="text"  v-decimales v-numeroFocusinOut v-solonumeros class=" " v-model="datoscampos.prorrateo" name="prorrateo" placeholder="prorrateo" id="actualizarprorrateo" />
            </div>
<div class="col-span-12 sm:col-span-6 md:col-span-2 lg:col-span-2 xl:col-span-2 2xl:col-span-2">
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-400" for="proxima_cuota">PROXIMA_CUOTA</label>
                <InputText fluid type="text"  v-decimales v-numeroFocusinOut v-solonumeros class=" " v-model="datoscampos.proxima_cuota" name="proxima_cuota" placeholder="proxima_cuota" id="actualizarproxima_cuota" />
            </div>
            </div>

                </TabPanel>
                <TabPanel value="6">

                  
<div class="grid grid-cols-12 gap-4 mt-4 text-blue-600" >
<div class="col-span-12 sm:col-span-6 md:col-span-4 lg:col-span-4 xl:col-span-4 2xl:col-span-4">
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-400" for="fecha_entrega">FECHA_ENTREGA</label>
                    <flat-pickr v-model="datoscampos.fecha_entrega"  class="form-input w-full p-inputtext p-component p-filled p-inputtext-fluid" :config="basic"></flat-pickr>
            </div>
<div class="col-span-12 sm:col-span-6 md:col-span-6 lg:col-span-6 xl:col-span-6 2xl:col-span-6">
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-400" for="responsable_entrega">RESPONSABLE_ENTREGA</label>
                <InputText fluid type="text"  v-mayuscula class=" " v-model="datoscampos.responsable_entrega" name="responsable_entrega" placeholder="responsable_entrega" id="actualizarresponsable_entrega" />
            </div>
<div class="col-span-12 sm:col-span-6 md:col-span-2 lg:col-span-2 xl:col-span-2 2xl:col-span-2">
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-400" for="cobrador_asignado">COBRADOR_ASIGNADO</label>
                    <Dropdown fluid editable v-model="datoscampos.cobrador_asignado" :options="['']" placeholder="Seleccione cobrador_asignado" class="w-full" />
            </div>
<div class="col-span-12 sm:col-span-12 md:col-span-12 lg:col-span-12 xl:col-span-12 2xl:col-span-12">
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-400" for="geolocalizacion">GEOLOCALIZACION</label>
                   <Textarea fluid id="actualizargeolocalizacion"  v-model="datoscampos.geolocalizacion" name="geolocalizacion" rows="3" class="form-textarea w-full " placeholder="Enter Geolocalizacion"></textarea>
                </div>
                </div>

                </TabPanel>
                <TabPanel value="7">
                  <div class="p-4 space-y-6">
                    <!-- Resumen de Pagos -->
                    <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div class="bg-white dark:bg-gray-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4 text-center">
                        <span class="block text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Monto Total</span>
                        <strong class="block text-2xl mt-1 text-slate-900 dark:text-slate-100">RD$ {{ parseFloat(datoscampos.monto_total || 0).toLocaleString('es-DO', { minimumFractionDigits: 2 }) }}</strong>
                      </div>
                      <div class="bg-white dark:bg-gray-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4 text-center">
                        <span class="block text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Abonado</span>
                        <strong class="block text-2xl mt-1 text-green-600 dark:text-green-400">RD$ {{ parseFloat(datoscampos.total_abonado || 0).toLocaleString('es-DO', { minimumFractionDigits: 2 }) }}</strong>
                      </div>
                      <div class="bg-white dark:bg-gray-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4 text-center">
                        <span class="block text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Pendiente</span>
                        <strong class="block text-2xl mt-1 text-red-600 dark:text-red-400">RD$ {{ parseFloat(datoscampos.total_pendiente || 0).toLocaleString('es-DO', { minimumFractionDigits: 2 }) }}</strong>
                      </div>
                      <div class="bg-white dark:bg-gray-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4 text-center">
                        <span class="block text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Progreso</span>
                        <div class="mt-2">
                          <span class="block text-2xl font-bold text-blue-600 dark:text-blue-400">{{ datoscampos.monto_total > 0 ? Math.round((parseFloat(datoscampos.total_abonado || 0) / parseFloat(datoscampos.monto_total)) * 100) : 0 }}%</span>
                          <div class="h-2 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden mt-1">
                            <div class="h-full rounded-full bg-blue-500 transition-all" :style="{ width: (datoscampos.monto_total > 0 ? Math.min(Math.round((parseFloat(datoscampos.total_abonado || 0) / parseFloat(datoscampos.monto_total)) * 100), 100) : 0) + '%' }"></div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <!-- Estado y proximo pago -->
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-400 mb-1" for="estado_financiamiento">Estado del Financiamiento</label>
                        <Dropdown fluid editable v-model="datoscampos.estado_financiamiento" :options="['AL DIA','EN ATRASO','EN LEGAL','FINALIZADO']" placeholder="Seleccione estado" class="w-full" />
                      </div>
                      <div class="grid grid-cols-2 gap-4">
                        <div>
                          <label class="block text-sm font-medium text-gray-700 dark:text-gray-400 mb-1">Proxima Cuota</label>
                          <InputText fluid v-model="datoscampos.proxima_cuota" placeholder="Monto proxima cuota" />
                        </div>
                        <div>
                          <label class="block text-sm font-medium text-gray-700 dark:text-gray-400 mb-1">Proximo Pago</label>
                          <InputText fluid v-model="datoscampos.proximo_pago" placeholder="Fecha proximo pago" />
                        </div>
                      </div>
                    </div>

                    <!-- Historial de Pagos -->
                    <div>
                      <h3 class="text-lg font-bold text-gray-800 dark:text-gray-200 mb-3 flex items-center gap-2">
                        <i class="pi pi-history text-blue-500"></i> Historial de Pagos
                      </h3>
                      <div class="bg-white dark:bg-gray-800 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
                        <TablaJSON
                          :productos="datoscampos.historial_pagos"
                          :onEditar="editarPago"
                          :onEliminar="eliminarPago"
                          :onClickProducto="() => {}"
                          :indice="true"
                          :botones="true"
                          tableId="tablaHistorialPago"
                        />
                      </div>
                    </div>

                    <!-- Comentario -->
                    <div>
                      <label class="block text-sm font-medium text-gray-700 dark:text-gray-400 mb-1" for="comentario">Comentario</label>
                      <Textarea fluid id="actualizarcomentario" v-model="datoscampos.comentario" name="comentario" rows="3" class="w-full" placeholder="Agregar comentario..." />
                    </div>
                  </div>
                </TabPanel>

                <TabPanel value="8">
                  <div class="p-6">
                    <div class="text-center mb-6">
                      <h2 class="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-2">
                        <i class="pi pi-file-pdf text-red-500 mr-2"></i>
                        Documentos del Financiamiento
                      </h2>
                      <p class="text-gray-600 dark:text-gray-400">Genere los documentos legales y administrativos necesarios</p>
                    </div>
                    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden border-t-4 border-blue-500">
                        <div class="p-6">
                          <div class="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-blue-100 dark:bg-blue-900 rounded-full">
                            <i class="pi pi-file-edit text-3xl text-blue-600 dark:text-blue-300"></i>
                          </div>
                          <h3 class="text-lg font-bold text-center text-gray-800 dark:text-gray-200 mb-2">Pagare</h3>
                          <p class="text-sm text-center text-gray-600 dark:text-gray-400 mb-4">Documento de compromiso de pago</p>
                          <Button label="Generar PDF" @click="generarPagarePDF" severity="info" fluid icon="pi pi-download" class="mt-2" />
                        </div>
                      </div>
                      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden border-t-4 border-purple-500">
                        <div class="p-6">
                          <div class="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-purple-100 dark:bg-purple-900 rounded-full">
                            <i class="pi pi-book text-3xl text-purple-600 dark:text-purple-300"></i>
                          </div>
                          <h3 class="text-lg font-bold text-center text-gray-800 dark:text-gray-200 mb-2">Contrato</h3>
                          <p class="text-sm text-center text-gray-600 dark:text-gray-400 mb-4">Contrato de financiamiento</p>
                          <Button label="Generar PDF" severity="help" fluid icon="pi pi-download" class="mt-2" />
                        </div>
                      </div>
                      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden border-t-4 border-green-500">
                        <div class="p-6">
                          <div class="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-green-100 dark:bg-green-900 rounded-full">
                            <i class="pi pi-file-check text-3xl text-green-600 dark:text-green-300"></i>
                          </div>
                          <h3 class="text-lg font-bold text-center text-gray-800 dark:text-gray-200 mb-2">Solicitud</h3>
                          <p class="text-sm text-center text-gray-600 dark:text-gray-400 mb-4">Formulario de solicitud</p>
                          <Button label="Generar PDF" @click="fnGenerarSolicitud" severity="success" fluid icon="pi pi-download" class="mt-2" />
                        </div>
                      </div>
                      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden border-t-4 border-orange-500">
                        <div class="p-6">
                          <div class="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-orange-100 dark:bg-orange-900 rounded-full">
                            <i class="pi pi-verified text-3xl text-orange-600 dark:text-orange-300"></i>
                          </div>
                          <h3 class="text-lg font-bold text-center text-gray-800 dark:text-gray-200 mb-2">Autorizacion</h3>
                          <p class="text-sm text-center text-gray-600 dark:text-gray-400 mb-4">Documento de autorizacion</p>
                          <Button label="Generar PDF" @click="generarAutorizacionPDF" severity="warning" fluid icon="pi pi-download" class="mt-2" />
                        </div>
                      </div>
                      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden border-t-4 border-cyan-500">
                        <div class="p-6">
                          <div class="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-cyan-100 dark:bg-cyan-900 rounded-full">
                            <i class="pi pi-shield text-3xl text-cyan-600 dark:text-cyan-300"></i>
                          </div>
                          <h3 class="text-lg font-bold text-center text-gray-800 dark:text-gray-200 mb-2">Seguro</h3>
                          <p class="text-sm text-center text-gray-600 dark:text-gray-400 mb-4">Poliza de seguro</p>
                          <Button label="Generar PDF" severity="secondary" fluid icon="pi pi-download" class="mt-2" />
                        </div>
                      </div>
                      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden border-t-4 border-indigo-500">
                        <div class="p-6">
                          <div class="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-indigo-100 dark:bg-indigo-900 rounded-full">
                            <i class="pi pi-table text-3xl text-indigo-600 dark:text-indigo-300"></i>
                          </div>
                          <h3 class="text-lg font-bold text-center text-gray-800 dark:text-gray-200 mb-2">Tabla de Amortizacion</h3>
                          <p class="text-sm text-center text-gray-600 dark:text-gray-400 mb-4">Detalle de cuotas y pagos</p>
                          <Button label="Generar PDF" @click="generarPlanPagoPDF" severity="contrast" fluid icon="pi pi-download" class="mt-2" />
                        </div>
                      </div>
                    </div>
                  </div>
                </TabPanel>
                <TabPanel value="9">
<div class="grid grid-cols-12 gap-4 mt-4 text-blue-600" >

        <div class="hidden col-span-12">
          <label for="created_at-Actualizador" class="block text-sm font-medium text-gray-700">CREATED_AT</label>
          <InputText v-model="datoscampos.created_at" name="created_at" id="created_at-Actualizador" placeholder="created_at" class="w-full" />
        </div>
        <div class="hidden col-span-12">
          <label for="updated_at-Actualizador" class="block text-sm font-medium text-gray-700">UPDATED_AT</label>
          <InputText v-model="datoscampos.updated_at" name="updated_at" id="updated_at-Actualizador" placeholder="updated_at" class="w-full" />
        </div>
        <div class="hidden col-span-12">
          <label for="usuario-Actualizador" class="block text-sm font-medium text-gray-700">USUARIO</label>
          <InputText v-model="datoscampos.usuario" name="usuario" id="usuario-Actualizador" placeholder="usuario" maxlength="250" class="w-full" />
        </div>

<div class="form-group col-span-12 mb-5 mt-5">
  <Button label="Actualizar" fluid  @click="funcionActualizar" autofocus />
</div>


  </div>
                </TabPanel>
            </TabPanels>
        </Tabs>
        </form>
      </div>
    </div>
  </div>
  <Toast />
</main>
</template>
<style scoped>
.finance-header {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.tabs-shell {
  border-radius: 24px;
  padding: 1rem;
  background: linear-gradient(180deg, rgba(248, 250, 252, 0.85) 0%, rgba(255, 255, 255, 1) 100%);
  border: 1px solid rgba(226, 232, 240, 0.95);
}

.tabs-shell__top {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  align-items: flex-start;
  margin-bottom: 1rem;
}

.tabs-shell__eyebrow {
  display: inline-block;
  font-size: 0.72rem;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: #64748b;
  margin-bottom: 0.3rem;
}

.tabs-shell__title {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 700;
  color: #0f172a;
}

.tabs-shell__steps {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  justify-content: flex-end;
}

.section-card {
  border-radius: 18px;
  overflow: hidden;
  box-shadow: 0 18px 38px rgba(15, 23, 42, 0.08);
}

.section-card__header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  color: #fff;
  padding: 1rem 1.25rem;
}

.section-card__body {
  padding: 1.25rem;
  background: #fff;
  border: 1px solid rgba(226, 232, 240, 0.9);
  border-top: 0;
}

.section-card__header--blue {
  background: linear-gradient(to right, #3b82f6, #2563eb);
}

.section-card__header--purple {
  background: linear-gradient(to right, #a855f7, #9333ea);
}

.section-card__header--pink {
  background: linear-gradient(to right, #ec4899, #db2777);
}

.section-card__header--green {
  background: linear-gradient(to right, #22c55e, #16a34a);
}

.section-card__header--orange {
  background: linear-gradient(to right, #f97316, #ea580c);
}

.section-card__header--indigo {
  background: linear-gradient(to right, #6366f1, #4f46e5);
}

.section-card__header--cyan {
  background: linear-gradient(to right, #06b6d4, #0891b2);
}

.section-card__header--violet {
  background: linear-gradient(to right, #8b5cf6, #7c3aed);
}

.finance-header__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.finance-header__action,
.finance-header__icon {
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.08);
}

.finance-overview {
  display: grid;
  grid-template-columns: minmax(0, 1.5fr) minmax(320px, 0.9fr);
  gap: 1.25rem;
  align-items: stretch;
}

.finance-overview__content {
  border-radius: 24px;
  padding: 1.4rem;
  background:
    radial-gradient(circle at top right, rgba(59, 130, 246, 0.16), transparent 30%),
    linear-gradient(145deg, #ffffff 0%, #f8fafc 100%);
  border: 1px solid rgba(148, 163, 184, 0.2);
  box-shadow: 0 20px 40px rgba(15, 23, 42, 0.08);
}

.finance-overview__eyebrow,
.score-card__eyebrow {
  display: inline-block;
  font-size: 0.72rem;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: #64748b;
  margin-bottom: 0.3rem;
}

.finance-overview__title,
.score-card__title {
  margin: 0;
  font-size: 1.35rem;
  font-weight: 700;
  color: #0f172a;
}

.finance-overview__subtitle {
  margin: 0.4rem 0 0;
  color: #475569;
  font-size: 0.95rem;
}

.finance-overview__stats {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 0.9rem;
  margin-top: 1.2rem;
}

.finance-stat {
  padding: 1rem;
  border-radius: 18px;
  background: rgba(248, 250, 252, 0.95);
  border: 1px solid rgba(226, 232, 240, 0.95);
}

.finance-stat__label {
  display: block;
  font-size: 0.78rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #64748b;
}

.finance-stat__value {
  display: block;
  margin-top: 0.45rem;
  font-size: 1.1rem;
  color: #0f172a;
}

.score-card {
  --score-surface: linear-gradient(145deg, #ffffff 0%, #f8fafc 100%);
  background: var(--score-surface);
  border: 1px solid rgba(148, 163, 184, 0.22);
  border-radius: 24px;
  padding: 1.25rem;
  box-shadow: 0 20px 40px rgba(15, 23, 42, 0.08);
}

.score-card--compact {
  height: 100%;
}

.score-card__header,
.score-card__body,
.score-card__footer,
.score-card__scale {
  display: flex;
  align-items: center;
}

.score-card__header,
.score-card__footer {
  justify-content: space-between;
  gap: 1rem;
}

.score-card__body {
  gap: 1.25rem;
  margin-top: 1rem;
}

.score-card__badge {
  border-radius: 999px;
  padding: 0.45rem 0.85rem;
  font-size: 0.82rem;
  font-weight: 700;
  background: rgba(148, 163, 184, 0.14);
}

.score-card__value-wrap {
  min-width: 110px;
  text-align: center;
  padding: 1rem 1.1rem;
  border-radius: 18px;
  background: linear-gradient(180deg, rgba(241, 245, 249, 0.92) 0%, rgba(226, 232, 240, 0.65) 100%);
}

.score-card__value {
  font-size: 2.2rem;
  line-height: 1;
  font-weight: 800;
  color: #0f172a;
}

.score-card__meta,
.score-card__hint,
.score-card__scale {
  color: #64748b;
}

.score-card__meta {
  margin-top: 0.35rem;
  font-size: 0.82rem;
}

.score-card__progress-block {
  flex: 1;
}

.score-card__scale {
  justify-content: space-between;
  margin-bottom: 0.55rem;
  font-size: 0.8rem;
}

.score-card__track {
  position: relative;
  overflow: hidden;
  width: 100%;
  height: 16px;
  border-radius: 999px;
  background: linear-gradient(90deg, rgba(226, 232, 240, 0.95) 0%, rgba(241, 245, 249, 0.95) 100%);
  box-shadow: inset 0 1px 2px rgba(15, 23, 42, 0.12);
}

.score-card__fill {
  position: relative;
  height: 100%;
  border-radius: inherit;
  transition: width 0.35s ease, box-shadow 0.35s ease;
}

.score-card__fill::after {
  content: '';
  position: absolute;
  inset: 2px;
  border-radius: inherit;
  background: linear-gradient(90deg, rgba(255, 255, 255, 0.28), rgba(255, 255, 255, 0));
}

.score-card__footer {
  margin-top: 0.75rem;
}

.score-card__percent {
  font-size: 0.95rem;
  font-weight: 700;
  color: #0f172a;
}

.score-card__hint {
  font-size: 0.84rem;
}

.score-success {
  color: #166534;
  background: rgba(34, 197, 94, 0.12);
}

.score-warning {
  color: #b45309;
  background: rgba(245, 158, 11, 0.15);
}

.score-risk {
  color: #b91c1c;
  background: rgba(239, 68, 68, 0.12);
}

@media (max-width: 1100px) {
  .finance-overview {
    grid-template-columns: 1fr;
  }

  .finance-overview__stats {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .tabs-shell__top {
    flex-direction: column;
  }

  .tabs-shell__steps {
    justify-content: flex-start;
  }
}

@media (max-width: 768px) {
  .finance-overview__stats {
    grid-template-columns: 1fr;
  }

  .score-card__body,
  .score-card__header,
  .score-card__footer {
    flex-direction: column;
    align-items: flex-start;
  }

  .score-card__value-wrap,
  .score-card__progress-block {
    width: 100%;
  }

  .score-card__value-wrap {
    text-align: left;
  }
}
</style>
