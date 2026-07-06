<script setup>
import { ref, onMounted, nextTick, watchEffect,computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
const router = useRouter();
import axios from 'axios';
import {enviarDatosPorPost,
  eliminarDatos,
  obtenerIdsSeleccionados,
  borrarTodoslosDatos,
  lenguajeDataTable,
  nfecha,
  arrayToObjetoFromTabla,
  peticionesFetch,
  generarTablaFromStringJSON,
  encryptarPassword,
  enviarDatosLocalStorage,
  envioElectron,
  crearTablaSiNoExisteOffline,
peticionesFetchOffline,
  mensajetoast,
  lasMayusculas,
  ultimoRegistro,
  generadorCodigo} from '@/funciones/funciones.js';
  import bcrypt from 'bcryptjs';
import Swal from 'sweetalert2'
import { useToast } from "primevue/usetoast";
const toast = useToast();
/************************************************************************/
/*import { Chart as ChartJS, Title, Tooltip, Legend, ArcElement } from "chart.js";*/
import { Chart as ChartJS, Title, Tooltip, Legend, ArcElement, BarElement, CategoryScale, LinearScale } from "chart.js";

import { Pie, Bar } from "vue-chartjs";
/************************************************************************/
const position = "top";
/************************************************************************/
import Patron from '../Patron/Patron.vue';
import LoadingOverlay from '@/Loading/LoadingOverlay.vue';
import DynamicTable from '@/components/DynamicTable.vue';
    //import flatPickr from 'vue-flatpickr-component';
    //import 'flatpickr/dist/flatpickr.css';
/************************************************************************/
const visibletaller = ref(false)
const loading = ref(false)
const imeiConsulta = ref('')
const visiblebuscarImei = ref(false)
const facturaTallerSeleccionada = ref({})
const facturasTaller = ref([])
const clienteTaller = ref('')
const showPatron = ref(false);
const clavePatron = ref('');
const usuarioLocal = ref({});
const datosBarcode = ref({})
const obtenerImpresoraLabelDefault = () =>
  datosBarcode.value?.impresoraLabel?.printerName || datosBarcode.value?.impresora || ''
const datosTallerN = ref([]);
const usuariosData = ref([]);
/************************************************************************/
import {useDatosEmpresa} from '@/stores'
const datosEmpresa = useDatosEmpresa();
const link = ref(null);
const api = ref(null);
const token = ref(null);
const patronTelefono = ref(null);
const linkImpresora = ref(null);
const patroncedula = ref(null);
const tokenCifrado = ref(null);
const visibleModificarTaller = ref(false);
const tipoConsulta = ref('apple');
/************************************************************************/
const reparacionesPorEstado = ref([]);
const reparacionesTotalesMes = ref(0);
const metaReparaciones = ref(100); // Meta mensual de reparaciones
const tallerData = ref([])
/************************************************************************/
const visibleEtiquetaModal = ref(false)
const etiquetaOrdenData = ref({})
const listaImpresorasEtiqueta = ref([])
const cargandoImpresorasEtiqueta = ref(false)
const etiquetaOpciones = ref({
  incluirCabecera: false,
  incluirCodigo: true,
  incluirTexto: true,
  incluirPrecio: true,
  cantidad: 1,
  printerName: ''
})
/************************************************************************/
watchEffect(() => {
    //Aqui para vigilar eventos
});
/************************************************************************/
const ordenesPendientes = ref([])
const ordenesReparadas = ref([])
const facturasArrayTaller = ref([])
const miNomina = ref({})
/************************************************************************/
const ordenSeleccionada = computed(() => facturaTallerSeleccionada.value?.orden || null)
const tecnicoActual = computed(() => usuarioLocal.value?.nombre || datosEmpresa.usuario?.nombre || 'Tecnico')
const totalOrdenesActivas = computed(() => facturasArrayTaller.value.length)
const ticketPromedioMes = computed(() => {
  if (!tallerData.value.length) return 0
  const total = tallerData.value.reduce((acc, item) => acc + Number(item.total || 0), 0)
  return Number((total / tallerData.value.length).toFixed(2))
})

const getEstadoUi = (estado = '') => {
  const catalogo = {
    'En Revision': { label: 'En revisión', chip: 'mitaller-chip mitaller-chip-warning', card: 'mitaller-state-card mitaller-state-card-warning' },
    Reparado: { label: 'Reparado', chip: 'mitaller-chip mitaller-chip-success', card: 'mitaller-state-card mitaller-state-card-success' },
    Entregado: { label: 'Entregado', chip: 'mitaller-chip mitaller-chip-info', card: 'mitaller-state-card mitaller-state-card-info' },
    Pendiente: { label: 'Pendiente', chip: 'mitaller-chip mitaller-chip-warning', card: 'mitaller-state-card mitaller-state-card-warning' },
    Garantia: { label: 'Garantía', chip: 'mitaller-chip mitaller-chip-primary', card: 'mitaller-state-card mitaller-state-card-primary' },
    Devolucion: { label: 'Devolución', chip: 'mitaller-chip mitaller-chip-danger', card: 'mitaller-state-card mitaller-state-card-danger' },
    'Sin Solucion': { label: 'Sin solución', chip: 'mitaller-chip mitaller-chip-danger', card: 'mitaller-state-card mitaller-state-card-danger' }
  }
  return catalogo[estado] || { label: estado || 'Sin estado', chip: 'mitaller-chip', card: 'mitaller-state-card' }
}

const fetchTallerDatosarraydoblecondicion = async () => {
  try {

    const response = await peticionesFetchOffline('getDataArrayByTwoConditions', 'taller','tecnico',datosEmpresa.usuario.nombre,'pago_tecnico','NO COBRADO');

    tallerData.value = response;
    //tallerDataNames.value = response.map(taller=>taller.name);
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to fetch data from taller',
      life: 3000
    });
  }
};

/************************************************************************/
const fetchDataTaller = async () => {
  // Obtener datos del taller del técnico actual
  const jsonData = await peticionesFetchOffline('getDataArrayByTwoConditions', 'taller','tecnico',datosEmpresa.usuario.nombre,'pago_tecnico','NO COBRADO');
  console.log("jsonData", jsonData);

  // Revertir el array UNA SOLA VEZ para tener las órdenes más recientes primero
  const jsonDataReversed = [...jsonData].reverse();

  // Asignar datos a las variables
  facturasArrayTaller.value = jsonDataReversed;
  ordenesPendientes.value = jsonDataReversed.filter(taller => taller.estado === 'En Revision');
  ordenesReparadas.value = jsonDataReversed.filter(taller => taller.estado === 'Reparado');
  facturasTaller.value = ordenesPendientes.value;

  // Obtener datos del técnico
  const datosTecnico = usuariosData.value.find(tecnico => tecnico.nombre === usuarioLocal.value.nombre);

  if (!datosTecnico) return;

  metaReparaciones.value = Number(datosTecnico.meta) || 100;

  if (!datosTecnico.porcentaje) {
    datosTecnico.porcentaje = 35;
  }

  // Limpiar array antes de llenarlo
  datosTallerN.value = [];

  // Procesar facturas no cobradas
  jsonDataReversed.forEach(factura => {
    if (factura.pago_tecnico !== 'COBRADO') {
      datosTallerN.value.push({
        no_orden: factura.no_factura,
        fecha: factura.fecha_entrada,
        equipo: `${factura.equipo} ${factura.marca} ${factura.modelo}`,
        monto_cobrado: factura.total,
        costo_piezas: factura.preciopiezas,
        porcentaje_tecnico: datosTecnico.porcentaje,
        beneficio_tecnico: factura.beneficio_tecnico,
        beneficio_empresa: factura.beneficio_empresa,
        estado: factura.estado,
        pago_tecnico: factura.pago_tecnico
      });
    }
  });

  // Seleccionar primera factura si existe
  if (facturasTaller.value[0]) {
    facturaTallerSeleccionada.value.orden = facturasTaller.value[0];
    clienteTaller.value = facturasTaller.value[0].nombre;
  }
};
/************************************************************************/
const nominaActiva = async()=>{
  const datos = await peticionesFetchOffline('getDataArrayByCondition','nomina','estado','ACTIVA');
  miNomina.value = datos.filter(nomina=>nomina.nombre === usuarioLocal.value.nombre)[0]

}
/************************************************************************/

const fetchUsuariosDatosarraypost = async () => {
  try {
    const response = await peticionesFetchOffline('getDataAsArray', 'usuarios');
    usuariosData.value = response;
    //usuariosDataNames.value = response.map(usuarios=>usuarios.name);
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to fetch data from usuarios',
      life: 3000
    });
  }
};

/************************************************************************/
const fetchDataBarcode = async () => {
const [response, configArchivo] = await Promise.all([
  peticionesFetchOffline('getDataAsArray', 'barcode'),
  envioElectron('datosarchivo')
]);
    const jsonData = response[0] || {};
    datosBarcode.value = {
      ...jsonData,
      impresoraLabel: configArchivo?.impresoraLabel
    };
};

/************************************************************************/
// Registrar los componentes de Chart.js
ChartJS.register(Title, Tooltip, Legend, ArcElement, BarElement, CategoryScale, LinearScale);


// Progreso calculado
// Progreso calculado con dos decimales
const progreso = computed(() => {
  const porcentaje = (reparacionesTotalesMes.value / metaReparaciones.value) * 100;
  return Number(porcentaje.toFixed(2)); // Limitar a dos decimales
});


// Obtener color dinámico para el Knob
const getKnobColor = computed(() => {
  if (progreso.value <= 35) return "#EF4444"; // Rojo
  if (progreso.value <= 65) return "#F59E0B"; // Amarillo
  return "#10B981"; // Verde
});

// Datos para el gráfico de distribución
const chartData = computed(() => {
  const estados = reparacionesPorEstado.value.reduce((acc, reparacion) => {
    acc[reparacion.estado] = (acc[reparacion.estado] || 0) + 1;
    return acc;
  }, {});

  const colores = {
    "Entregado": "#4CAF50", // Verde
    "Reparado": "#FFEB3B", // Amarillo
    "En Revision": "#FF9800", // Naranja
    "Otro": "#F44336", // Rojo
  };

  return {
    labels: Object.keys(estados),
    datasets: [
      {
        label: "Reparaciones",
        data: Object.values(estados),
        backgroundColor: Object.keys(estados).map(estado => colores[estado] || colores["Otro"]),
      },
    ],
  };
});



// Simulación de datos
const fetchReparaciones = async () => {
  reparacionesPorEstado.value = [
    { estado: "Reparado" },
    { estado: "En Revision" },
    { estado: "Reparado" },
    { estado: "Pendiente" },
    { estado: "Pendiente" },
  ];
  //reparacionesTotalesMes.value = reparacionesPorEstado.value.length; // Total reparaciones
};
/************************************************************************/

/************************************************************************/

const fetchTallerDatostimestamp = async () => {
  const fechas = nfecha('mestimestamp')
  try {
    const response = await peticionesFetchOffline('getRowsByTimestampRange','taller','created_at',fechas.fechainicio,fechas.fechafin);

     const jsonData = response.filter(taller=>taller.tecnico === usuarioLocal.value.nombre);

    tallerData.value = jsonData;
    //tallerDataNames.value = response.map(taller=>taller.name);
    
   reparacionesPorEstado.value = jsonData

const sumaTotal = jsonData
  .map(factura => Number(factura.total)) // Convertir cada total a número
  .reduce((acc, curr) => acc + curr, 0); // Sumar los valores


   //reparacionesTotalesMes.value = response.length
   reparacionesTotalesMes.value = sumaTotal
 

  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to fetch data from taller',
      life: 3000
    });
  }
};

/************************************************************************/
onMounted(async() => {


const datosJSON = await envioElectron('datosarchivo');
link.value = datosJSON.LINKURL;
api.value = datosJSON.LINK_API;
token.value = datosJSON.TOKEN;
patronTelefono.value = datosJSON.PATRON_TELEFONO;
linkImpresora.value = datosJSON.IMPRESORA_LOCAL;
usuarioLocal.value = datosEmpresa.usuario;
tokenCifrado.value = await encryptarPassword(token.value, 10);

await fetchUsuariosDatosarraypost()
await fetchDataBarcode()
await fetchDataTaller()
await nominaActiva()
await fetchTallerDatostimestamp()


});
/************************************************************************/


// Opciones del gráfico
const chartOptions = ref({
  responsive: true,
  plugins: {
    legend: {
      display: true,
      position: 'top',
    },
  },
});
/************************************************************************/
/*************************************************************/
const seleccionarTaller = async()=>{
  const facturaTaller = facturaTallerSeleccionada.value.orden;
  if (!facturaTaller) return;
  clienteTaller.value = facturaTaller.nombre;
}
/*************************************************************/
const abrirDetalleOrden = (orden) => {
  facturaTallerSeleccionada.value = { orden }
  clienteTaller.value = orden?.nombre || ''
  visibletaller.value = true
}
/*************************************************************/
const obtenerTextoEtiqueta = (ordenData) => {
 let fallasN = "";
 try {
    const fallasArray = JSON.parse(ordenData?.fallas || '[]');
    if (Array.isArray(fallasArray)) {
        fallasN = fallasArray.map(fl => fl.propiedad).join(',');
    }
 } catch (error) {
    console.error("Error al parsear fallas:", error);
 }
 return fallasN;
}
/*************************************************************/
const cargarImpresorasEtiqueta = async() => {
cargandoImpresorasEtiqueta.value = true;
try {
  const impresorasDisponibles = await window.electron.ipcRenderer.invoke('get-printers');
  listaImpresorasEtiqueta.value = impresorasDisponibles || [];
} catch (error) {
  toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo obtener la lista de impresoras.', life: 3000 });
  listaImpresorasEtiqueta.value = [];
} finally {
  cargandoImpresorasEtiqueta.value = false;
}
}
/*************************************************************/
const abrirModalEtiqueta = async(ordenData) => {
etiquetaOrdenData.value = ordenData || {};
await cargarImpresorasEtiqueta();
const impresoraDefault = obtenerImpresoraLabelDefault() || listaImpresorasEtiqueta.value[0] || '';
etiquetaOpciones.value = {
  incluirCabecera: false,
  incluirCodigo: true,
  incluirTexto: true,
  incluirPrecio: true,
  cantidad: 1,
  printerName: impresoraDefault
};
visibleEtiquetaModal.value = true;
}
/*************************************************************/
const printBarcode = async(ordenData,opciones = {}) => {
const barcode = ordenData?.no_factura;
if (!barcode) {
  toast.add({ severity: 'error', summary: 'Error', detail: 'La orden no tiene número para imprimir la etiqueta', life: 3000 });
  return;
}

const fallasN = obtenerTextoEtiqueta(ordenData);
const opcionesEtiqueta = {
  incluirCabecera: false,
  incluirTexto: true,
  incluirCodigo: true,
  incluirPrecio: true,
  cantidad: 1,
  printerName: obtenerImpresoraLabelDefault(),
  ...opciones
};

if (!opcionesEtiqueta.printerName) {
  toast.add({ severity: 'warn', summary: 'Impresora requerida', detail: 'Selecciona una impresora para continuar', life: 3000 });
  return;
}

    const content = {
        barcodeData: {
            barcodetype: datosBarcode.value.barcodetype,
            barwidth: parseInt(datosBarcode.value.barwidth),
            barheight: parseInt(datosBarcode.value.barheight),
            labelwidth: parseInt(datosBarcode.value.labelwidth),
            labelheight: parseInt(datosBarcode.value.labelheight),
            fontsize: parseInt(datosBarcode.value.fontsize),
            margen_izq: parseInt(datosBarcode.value.margen_izq),
            margen_der: parseInt(datosBarcode.value.margen_der),
            margen_sup: parseInt(datosBarcode.value.margen_sup),
            margen_inf: parseInt(datosBarcode.value.margen_inf),
            codigo: barcode,
        },
        labelWidth: 100,
        labelHeight: 65,
        margins: {
            top: parseInt(datosBarcode.value.margen_sup),
            right: parseInt(datosBarcode.value.margen_der),
            bottom: parseInt(datosBarcode.value.margen_inf),
            left: parseInt(datosBarcode.value.margen_izq)
        },
        incluirCabecera:opcionesEtiqueta.incluirCabecera,
        incluirTexto:opcionesEtiqueta.incluirTexto,
        incluirCodigo:opcionesEtiqueta.incluirCodigo,
        incluirOtro:false,
        incluirPrecio:opcionesEtiqueta.incluirPrecio,
        headerText: datosEmpresa.empresa.nombre + ' - '+barcode,
        code: barcode,
        precio: `${ordenData?.nombre || ''} - ${ordenData?.telefono || ''}`,
        text: fallasN,
        width: parseInt(datosBarcode.value.barwidth),
        height: 30,
        fontSize: 8,
        cantidad: parseInt(opcionesEtiqueta.cantidad) || 1,
        tipo: datosBarcode.value.barcodetype,
        printerName: opcionesEtiqueta.printerName
    };
    await window.electron.ipcRenderer.invoke('print-barcode', content);
}
/*************************************************************/
const confirmarImpresionEtiqueta = async() => {
await printBarcode(etiquetaOrdenData.value,etiquetaOpciones.value);
visibleEtiquetaModal.value = false;
}
/*************************************************************/
const imprimirTaller = async()=>{
  const facturaTaller = ordenSeleccionada.value
  if (!facturaTaller) return
 // window.electron.ipcRenderer.invoke('open-new-window', link.value+'/vista/tallertermica?factura='+facturaTaller.no_factura,'url', true,false)

 const datosEmpresa = JSON.stringify(enviarDatosLocalStorage())
 const datos = JSON.stringify(facturaTallerSeleccionada.value.orden)
 await window.electron.ipcRenderer.invoke('recibotaller',datos,datosEmpresa,true,false,false);


}
/*************************************************************/
const nuevoTaller = async()=>{
 router.push({ path: `/creartaller` });
}
/*************************************************************/
const imprimirEtiquetaTaller = async()=>{
  const facturaTaller = ordenSeleccionada.value
  if (!facturaTaller) return
  await abrirModalEtiqueta(facturaTaller)
}
/*************************************************************/
const closePatron = () => {
    showPatron.value = false;
};
/************************************************************************/
const verClaveTaller = async () => {
  const facturaTaller = ordenSeleccionada.value;
  if (!facturaTaller) return;
  
  if (facturaTaller.clave.includes('-')) {
    clavePatron.value = facturaTaller.clave;
    showPatron.value = true;
  } else {
    
    if(showPatron.value){
      showPatron.value = true;
      clavePatron.value = ''
    }

    visibletaller.value = false
    Swal.fire({
      title: 'Clave',
      text: facturaTaller.clave,
      icon: 'info',
      confirmButtonText: 'OK'
    }).then((result) => {
    if (result.isConfirmed) {
      // 👇 Aquí haces lo que quieras después de cerrar el Swal
      console.log('Swal cerrado correctamente ✅');

      // Por ejemplo, puedes volver a abrir algo:
      visibletaller.value = true;
    }
  });
  }
};
/************************************************************************/
const verFallasTaller = () => {
  const facturaTaller = ordenSeleccionada.value;
  if (!facturaTaller) return;
  visibletaller.value = false;
  let fallasArray = [];
  try {
    fallasArray = JSON.parse(facturaTaller.fallas || '[]');
  } catch (error) {
    fallasArray = [];
  }

  Swal.fire({
    title: 'Fallas del Equipo',
    html: `
      <ul style="list-style-type: decimal; text-align: left; padding-left: 20px;">
        ${fallasArray.map(falla => `<li>${falla.propiedad}</li>`).join('')}
      </ul>
    `,
    icon: 'info',
    confirmButtonText: 'Cerrar'
  }).then((result) => {
    if (result.isConfirmed) {
      // 👇 Aquí haces lo que quieras después de cerrar el Swal
      console.log('Swal cerrado correctamente ✅');

      // Por ejemplo, puedes volver a abrir algo:
      visibletaller.value = true;
    }
  });
};


/************************************************************************/
const fnCambiarAreparado = async () => {
  const facturaTaller = ordenSeleccionada.value;

  if (!facturaTaller) {
    console.error("Datos incompletos, no se puede actualizar.");
    return;
  }
  visibletaller.value = false
  // Pregunta de confirmación con SweetAlert
  const confirmacion = await Swal.fire({
    title: '¿Estás seguro?',
    text: "Estás a punto de entregar el equipo. Esta acción no se puede deshacer.",
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#3085d6',
    cancelButtonColor: '#d33',
    confirmButtonText: 'Sí, entregar equipo',
    cancelButtonText: 'Cancelar'
  });

  if (confirmacion.isConfirmed) {
    // Si confirma, actualizamos los datos
    facturaTaller.estado = 'Reparado';

    if (facturaTaller.hasOwnProperty('created_at')) {
      facturaTaller.updated_at = nfecha('timestamp');
    }

    const url = link.value + api.value + "/actualizarcampos/taller";
    const envioDatos = await peticionesFetchOffline('updateData', 'taller',JSON.stringify(facturaTaller));

    if (envioDatos[0] == 'ok') {
      toast.add({ severity: 'success', summary: 'Éxito', detail: 'Datos Actualizados', life: 3000 });
      await fetchDataTaller();
      visibletaller.value = true
    } else {
      toast.add({ severity: 'error', summary: 'Error', detail: 'Fallo al actualizar los datos.', life: 3000 });
    }
  } else {
    // Si cancela, puedes agregar un mensaje opcional (opcional)
    toast.add({ severity: 'info', summary: 'Cancelado', detail: 'Acción cancelada por el usuario.', life: 3000 });
    visibletaller.value = true
  }

await fetchUsuariosDatosarraypost()
await fetchDataTaller()
await nominaActiva()
await fetchTallerDatostimestamp()

};

/************************************************************************/
const buscarDatosIMEI = async () => {
    loading.value = true;
    const camposHistorialConsulta = await arrayToObjetoFromTabla('historial_consulta');
    const urlHistorialConsultas = link.value + api.value + "/insertar/historial_consulta";

   const tConsulta = {
    'apple':242,
    'samsung':11,
    'basico':0,
   }
        console.log("tipoConsulta.value", tipoConsulta.value);

    const datos = {
        "service": tConsulta[tipoConsulta.value],
        "imei": imeiConsulta.value,
        "key": "JKD-QC9-9L9-9C6-GT7-J2I-LIV-U3M"
    };

    try {
        let consultaServidor = null;
        let formattedData = null;

        consultaServidor = await peticionesFetchOffline('getDataByField', 'historial_consulta','imei',imeiConsulta.value);

             if (!imeiConsulta.value || imeiConsulta.value === '') {
              loading.value = false;
                    toast.add({ severity: 'error', summary: 'Error', detail: 'Escriba un IMEI valido', life: 3000 });
                    return;
                }

        if (consultaServidor) {
          const datosNN = JSON.parse(consultaServidor.datos_recibidos)
            formattedData = Object.entries(datosNN)
                .map(([key, value]) => `<li><strong>${key}:</strong> ${value}</li>`)
                .join('');

            visiblebuscarImei.value = false;
            consultaServidor.success = true
           loading.value = false;
        } else {
           // consultaServidor = await enviarDatosPorPost('https://api.ifreeicloud.co.uk', datos, tokenCifrado.value);


    // 🔹 3. Consultar API de iFreeiCloud
    consultaServidor = await fetch("https://api.ifreeicloud.co.uk", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: new URLSearchParams(datos).toString()
    });

    if (!consultaServidor.ok) {
      throw new Error(`Error HTTP al consultar IMEI: ${consultaServidor.status}`);
    }

    const datosObtenidos = await consultaServidor.json();



            if (datosObtenidos.success) {
                visiblebuscarImei.value = false;
                formattedData = Object.entries(datosObtenidos.object)
                    .map(([key, value]) => `<li><strong>${key}:</strong> ${value}</li>`)
                    .join('');

             }else{
              loading.value = false;
               toast.add({ severity: 'error', summary: 'Error', detail: datosObtenidos.error || 'Error de Servidor', life: 3000 });
              return
             }


                if (!camposHistorialConsulta) {
                    toast.add({ severity: 'error', summary: 'Error', detail: 'Datos incompletos, no se puede Enviar.', life: 3000 });
                    return;
                }

                if (camposHistorialConsulta.hasOwnProperty('created_at')) {
                    camposHistorialConsulta.created_at = nfecha('timestamp');
                    camposHistorialConsulta.updated_at = nfecha('timestamp');
                }

                camposHistorialConsulta.imei = imeiConsulta.value;
                camposHistorialConsulta.fecha = nfecha('fecha');
                camposHistorialConsulta.hora = nfecha('hora');
                camposHistorialConsulta.datos_recibidos = JSON.stringify(datosObtenidos.object);

                const envioDatos = await peticionesFetchOffline('insertData', 'historial_consulta',JSON.stringify(camposHistorialConsulta));

                loading.value = false;
                if (envioDatos[0] === 'ok') {
                    toast.add({ severity: 'success', summary: 'Éxito', detail: 'Informacion Guardada.', life: 3000 });
                }

       }


                // Mostrar prueba.object con SweetAlert2
Swal.fire({
    title: 'Datos del IMEI',
    html: `<ul style="text-align: left; margin: 0; padding: 0; list-style-position: inside;">${formattedData}</ul>`,
    icon: 'success',
    confirmButtonText: 'Cerrar'
});


     
        
    } catch (error) {
        loading.value = false;
        toast.add({ severity: 'error', summary: 'Error', detail: 'Error de peticion', life: 3000 });
    }
};

/************************************************************************/
const buscadorApple = async()=>{
  tipoConsulta.value = 'apple'
  visiblebuscarImei.value = true
}
/************************************************************************/
const buscadorBasico = async()=>{
  tipoConsulta.value = 'basico'
  visiblebuscarImei.value = true
}
/************************************************************************/
const buscadoSamsung = async()=>{
  tipoConsulta.value = 'samsung'
  visiblebuscarImei.value = true
}
/************************************************************************/
const getPrioridadClass = (orden) => {
  let abonos = [];
  try {
    abonos = JSON.parse(orden.abono || '[]');
  } catch (error) {
    abonos = [];
  }
  if (abonos.length > 0) {
    const prioridad = String(abonos[0].prioridad ?? '');
    switch (prioridad) {
      case '1':
        return 'row-green';
      case '2':
        return 'row-yellow';
      case '3':
        return 'row-red';
      default:
        return '';
    }
  }
  return '';
};
/************************************************************************/
// Función para editar la información de un taller
const edittaller = (index, data, idTable) => {

  // Extraer los valores necesarios
  const { monto_cobrado, costo_piezas, porcentaje_tecnico } = data;

  if(Number(costo_piezas)>0){
     toast.add({ severity: 'error', summary: 'Upps', detail: 'No se Puede Modificar esta Orden', life: 3000 });
    return
  }

  Swal.fire({
    title: 'Editar Información',
    html: `
      <div style="text-align: left;">
        <label for="costoPiezas">Precio de la pieza:</label>
        <input id="costoPiezas" type="number" v-numeroFocusinOut v-decimales v-solonumeros class="swal2-input" value="${costo_piezas}" step="0.01" min="0" />
      </div>
    `,
    focusConfirm: false,
    showCancelButton: true,
    confirmButtonText: 'Guardar',
    cancelButtonText: 'Cancelar',
    preConfirm: () => {
      // Obtener el nuevo precio de la pieza
      const nuevoCostoPiezas = parseFloat(document.getElementById('costoPiezas').value);

      if (isNaN(nuevoCostoPiezas) || nuevoCostoPiezas < 0) {
        Swal.showValidationMessage('Por favor, ingrese un precio válido para la pieza.');
        return;
      }

      // Calcular beneficios
      const beneficioTecnico = ((monto_cobrado - nuevoCostoPiezas) * (porcentaje_tecnico / 100)).toFixed(2);
      const beneficioEmpresa = (monto_cobrado - nuevoCostoPiezas - beneficioTecnico).toFixed(2);

      return { nuevoCostoPiezas, beneficioTecnico, beneficioEmpresa };
    },
  }).then(async(result) => {
    if (result.isConfirmed) {
      const { nuevoCostoPiezas, beneficioTecnico, beneficioEmpresa } = result.value;

      // Actualizar los valores en los datos originales
      data.costo_piezas = nuevoCostoPiezas;
      data.beneficio_tecnico = beneficioTecnico;
      data.beneficio_empresa = beneficioEmpresa;

      // Opcional: Realizar una petición para guardar los cambios en el backend
      // enviarDatosPorPost(url, data, tokenCifrado.value);

const datosTaller = facturasArrayTaller.value.find(taller=>taller.no_factura === data.no_orden)

 const url = link.value+api.value+"/actualizarcampos/taller";
  if (!datosTaller) {
    console.error("Datos incompletos, no se puede actualizar.");
    return;
  }
  if (datosTaller.hasOwnProperty('created_at')) {
      datosTaller.updated_at = nfecha('timestamp')
    }

      //datosTaller.pago_tecnico = JSON.stringify(data)


     datosTaller.preciopiezas = data.costo_piezas;
     datosTaller.beneficio_tecnico = data.beneficio_tecnico;
     datosTaller.beneficio_empresa = data.beneficio_empresa;

      const envioDatos = await peticionesFetchOffline('updateData', 'taller',JSON.stringify(datosTaller));

  if (envioDatos[0] == 'ok') {
     toast.add({ severity: 'success', summary: 'Éxito', detail: 'Datos Actualizados', life: 3000 });
      Swal.fire({
        icon: 'success',
        title: 'Datos actualizados',
        text: `Beneficio técnico: $${beneficioTecnico}, Beneficio empresa: $${beneficioEmpresa}`,
      });
  }else{
    toast.add({ severity: 'error', summary: 'Error', detail: 'Fallo al actualizar los datos.', life: 3000 });
  }

      // Mostrar un mensaje de éxito




    }
  });
};

const borrarTaller = (index,idTable)=>{
  console.log("idTable", idTable);
  console.log("index", index);

}
/************************************************************************/
const rowColorCallback = (factura)=>{
  if (factura.pago_tecnico === 'NO COBRADO') return 'colorRojo'; // Amarillo para Pendiente
  if (factura.pago_tecnico === 'COBRADO') return 'colorVerde'; // Verde para Completado
  return 'colorRojo'; 
}
/************************************************************************/
const comentarioTaller = ref('')
/************************************************************************/
const visibleOrdenRapida = ref(false)
const ordenRapida = ref({
  cedula: '',
  nombre: '',
  telefono: '',
  imei: '',
  marca: '',
  modelo: '',
  equipo: 'CELULAR',
  falla: '',
  clave: '',
  tecnico: null,
  manodeobra: '0.00',
  preciopiezas: '0.00',
  total: '0.00',
  fecha_entrega: nfecha('fechaManana')
})
/************************************************************************/
const buscarClientePorCedula = async() => {
  if (!ordenRapida.value.cedula || ordenRapida.value.cedula.trim() === '') {
    toast.add({ severity: 'error', summary: 'Error', detail: 'Ingrese una cédula válida', life: 3000 });
    return;
  }

  loading.value = true;

  try {
    // Primero buscar en la base de datos local
    const clienteLocal = await peticionesFetchOffline('getDataByField', 'clientes', 'cedula', ordenRapida.value.cedula);

    if (clienteLocal) {
      ordenRapida.value.nombre = clienteLocal.nombre;
      ordenRapida.value.telefono = clienteLocal.telefono || '';
      loading.value = false;
      toast.add({ severity: 'success', summary: 'Éxito', detail: 'Cliente encontrado', life: 3000 });
      return;
    }

    // Si no existe localmente, buscar en la API
    const response = await peticionesFetch(
      'https://demo.tmposrd.com/api2',
      'buscarcedula',
      { cedula: ordenRapida.value.cedula },
      tokenCifrado.value,
      'POST'
    );

    if (response && response.datos) {
      ordenRapida.value.nombre = response.datos.name;
      toast.add({ severity: 'success', summary: 'Éxito', detail: 'Cliente encontrado en API', life: 3000 });
    } else {
      toast.add({ severity: 'warning', summary: 'Aviso', detail: 'Cliente no encontrado, puede crear uno nuevo', life: 3000 });
    }

    loading.value = false;
  } catch (error) {
    loading.value = false;
    toast.add({ severity: 'error', summary: 'Error', detail: 'Error al buscar cliente', life: 3000 });
  }
}
/************************************************************************/
const buscarEquipoPorIMEI = async() => {
  if (!ordenRapida.value.imei || ordenRapida.value.imei.trim() === '') {
    toast.add({ severity: 'error', summary: 'Error', detail: 'Ingrese un IMEI válido', life: 3000 });
    return;
  }

  loading.value = true;

  const datos = {
    servicio: "0",
    imei: ordenRapida.value.imei.trim()
  };

  try {
    const consulta = await enviarDatosPorPost(
      'https://demo.tmposrd.com/api2/consultaimei',
      datos,
      tokenCifrado.value
    );

    const ok = consulta?.response?.success === true;

    if (ok) {
      const obj = consulta.response.object || {};
      ordenRapida.value.marca = obj.brand || '';
      ordenRapida.value.modelo = obj.modelName || '';
      toast.add({
        severity: 'success',
        summary: 'Éxito',
        detail: `Equipo encontrado: ${obj.modelName || 'N/A'}`,
        life: 3000
      });
    } else {
      toast.add({
        severity: 'error',
        summary: 'Error',
        detail: consulta?.response?.status || 'No se encuentran datos del IMEI',
        life: 3000
      });
    }

    loading.value = false;
  } catch (error) {
    loading.value = false;
    toast.add({ severity: 'error', summary: 'Error', detail: 'Error al consultar IMEI', life: 3000 });
  }
}
/************************************************************************/
const crearOrdenRapida = async() => {
  // Validaciones
  if (!ordenRapida.value.nombre || ordenRapida.value.nombre.trim() === '') {
    toast.add({ severity: 'error', summary: 'Error', detail: 'El nombre del cliente es obligatorio', life: 3000 });
    return;
  }

  if (!ordenRapida.value.falla || ordenRapida.value.falla.trim() === '') {
    toast.add({ severity: 'error', summary: 'Error', detail: 'Debe especificar la falla del equipo', life: 3000 });
    return;
  }

  if (!ordenRapida.value.manodeobra || parseFloat(ordenRapida.value.manodeobra) <= 0) {
    toast.add({ severity: 'error', summary: 'Error', detail: 'Debe especificar el costo de mano de obra', life: 3000 });
    return;
  }

  loading.value = true;

  try {
    // Obtener el último registro para generar el número de factura
    const ultimoReg = await ultimoRegistro(link.value + api.value, 'taller');
    let noFactura = '0000001';

    if (ultimoReg.length > 0) {
      noFactura = generadorCodigo(ultimoReg[0].no_factura, '', 7);
    }

    // Preparar datos de la orden
    const nuevaOrden = {
      no_factura: noFactura,
      nombre: ordenRapida.value.nombre,
      cedula: ordenRapida.value.cedula || '',
      telefono: ordenRapida.value.telefono || '',
      whatsapp: ordenRapida.value.telefono || '',
      email: '',
      direccion: '',
      equipo: ordenRapida.value.equipo,
      marca: ordenRapida.value.marca || 'N/A',
      modelo: ordenRapida.value.modelo || 'N/A',
      imei: ordenRapida.value.imei || '',
      clave: ordenRapida.value.clave || 'N/A',
      fallas: JSON.stringify([{ propiedad: ordenRapida.value.falla }]),
      accesorios: JSON.stringify([]),
      observaciones: '',
      tecnico: ordenRapida.value.tecnico?.nombre || usuarioLocal.value.nombre,
      estado: 'En Revision',
      metodopago: 'EFECTIVO',
      manodeobra: ordenRapida.value.manodeobra,
      preciopiezas: ordenRapida.value.preciopiezas,
      total: (parseFloat(ordenRapida.value.manodeobra) + parseFloat(ordenRapida.value.preciopiezas)).toFixed(2),
      saldo: (parseFloat(ordenRapida.value.manodeobra) + parseFloat(ordenRapida.value.preciopiezas)).toFixed(2),
      abono: JSON.stringify([]),
      fecha_entrada: nfecha('fecha'),
      fecha_entrega: ordenRapida.value.fecha_entrega,
      almacen: datosEmpresa.empresa.nombre,
      usuario: usuarioLocal.value.nombre,
      pago_tecnico: 'NO COBRADO',
      beneficio_tecnico: '0.00',
      beneficio_empresa: '0.00',
      created_at: nfecha('timestamp'),
      updated_at: nfecha('timestamp')
    };

    // Agregar porcentaje del técnico
    const datosTecnico = usuariosData.value.find(t => t.nombre === nuevaOrden.tecnico);
    nuevaOrden.porcentaje_tecnico = datosTecnico?.porcentaje || '0.00';

    // Guardar en la base de datos
    const envioDatos = await peticionesFetchOffline('insertData', 'taller', JSON.stringify(nuevaOrden));

    if (envioDatos[0] === 'ok') {
      toast.add({
        severity: 'success',
        summary: 'Éxito',
        detail: `Orden #${noFactura} creada exitosamente`,
        life: 3000
      });

      // Limpiar formulario
      ordenRapida.value = {
        cedula: '',
        nombre: '',
        telefono: '',
        imei: '',
        marca: '',
        modelo: '',
        equipo: 'CELULAR',
        falla: '',
        clave: '',
        tecnico: null,
        manodeobra: '0.00',
        preciopiezas: '0.00',
        total: '0.00',
        fecha_entrega: nfecha('fechaManana')
      };

      visibleOrdenRapida.value = false;

      // Actualizar datos
      await fetchUsuariosDatosarraypost();
      await fetchDataTaller();
      await nominaActiva();
      await fetchTallerDatostimestamp();

      // Preguntar si desea imprimir
      Swal.fire({
        title: "Orden Creada",
        text: "¿Desea imprimir el recibo?",
        icon: "success",
        showCancelButton: true,
        confirmButtonText: "Sí, Imprimir",
        cancelButtonText: "No"
      }).then(async (result) => {
        if (result.isConfirmed) {
          const datosEmpresaJSON = JSON.stringify(enviarDatosLocalStorage());
          const datosOrden = JSON.stringify(nuevaOrden);
          await window.electron.ipcRenderer.invoke('recibotaller', datosOrden, datosEmpresaJSON, true, false, false);
        }
      });

    } else {
      toast.add({ severity: 'error', summary: 'Error', detail: 'Error al crear la orden', life: 3000 });
    }

    loading.value = false;
  } catch (error) {
    loading.value = false;
    console.error('Error al crear orden:', error);
    toast.add({ severity: 'error', summary: 'Error', detail: 'Error al procesar la orden', life: 3000 });
  }
}
/************************************************************************/
const abrirOrdenRapida = () => {
  ordenRapida.value = {
    cedula: '',
    nombre: '',
    telefono: '',
    imei: '',
    marca: '',
    modelo: '',
    equipo: 'CELULAR',
    falla: '',
    clave: '',
    tecnico: usuariosData.value.find(u => u.nombre === usuarioLocal.value.nombre) || null,
    manodeobra: '0.00',
    preciopiezas: '0.00',
    total: '0.00',
    fecha_entrega: nfecha('fechaManana')
  };
  visibleOrdenRapida.value = true;
}
/************************************************************************/
const fnComentario = async()=>{
  const facturaTaller = facturaTallerSeleccionada.value.orden;
    if (!facturaTaller || !comentarioTaller.value.trim()) {
      toast.add({ severity: 'warn', summary: 'Aviso', detail: 'Escribe un comentario antes de guardar', life: 3000 });
      return;
    }
    const comentarioAnterior = facturaTaller.observaciones || '';
    facturaTaller.observaciones = comentarioAnterior ? `${comentarioAnterior}\n${comentarioTaller.value}` : comentarioTaller.value;

    if (facturaTaller.hasOwnProperty('created_at')) {
      facturaTaller.updated_at = nfecha('timestamp');
    }

    const url = link.value + api.value + "/actualizarcampos/taller";
    const envioDatos = await peticionesFetchOffline('updateData', 'taller',JSON.stringify(facturaTaller));

    if (envioDatos[0] == 'ok') {
      toast.add({ severity: 'success', summary: 'Éxito', detail: 'Datos Actualizados', life: 3000 });
      await fetchDataTaller();
      visibleModificarTaller.value = false
      comentarioTaller.value = ''
      visibletaller.value = true
    } else {
      toast.add({ severity: 'error', summary: 'Error', detail: 'Fallo al actualizar los datos.', life: 3000 });
    }
}
/************************************************************************/
/************************************************************************/
const chartDataBar = computed(() => {
  const fechas = {};

  // Inicializar los días del mes
  for (let dia = 1; dia <= 31; dia++) {
    fechas[dia] = {
      "En Revision": 0,
      "Reparado": 0,
      "Entregado": 0,
      "Garantia": 0,
      "Devolucion": 0,
      "Sin Solucion": 0,
    };
  }

  // Rellenar conteos
  reparacionesPorEstado.value.forEach(reparacion => {
    const fecha = new Date(reparacion.created_at || reparacion.fecha_entrada);
    const dia = fecha.getDate(); // Día del mes (1-31)

    const estado = reparacion.estado || 'Sin Solucion';
    if (fechas[dia]) {
      if (fechas[dia][estado] !== undefined) {
        fechas[dia][estado]++;
      } else {
        fechas[dia]['Sin Solucion']++;
      }
    }
  });

  const labels = Object.keys(fechas);

  return {
    labels,
    datasets: [
      {
        label: 'En Revisión',
        backgroundColor: '#FF9800',
        data: labels.map(dia => fechas[dia]['En Revision']),
      },
      {
        label: 'Reparado',
        backgroundColor: '#4CAF50',
        data: labels.map(dia => fechas[dia]['Reparado']),
      },
      {
        label: 'Entregado',
        backgroundColor: '#2196F3',
        data: labels.map(dia => fechas[dia]['Entregado']),
      },
      {
        label: 'Garantía',
        backgroundColor: '#9C27B0',
        data: labels.map(dia => fechas[dia]['Garantia']),
      },
      {
        label: 'Devolución',
        backgroundColor: '#FF5722',
        data: labels.map(dia => fechas[dia]['Devolucion']),
      },
      {
        label: 'Sin Solución',
        backgroundColor: '#F44336',
        data: labels.map(dia => fechas[dia]['Sin Solucion']),
      },
    ]
  };
});

const chartOptionsBar = ref({
  responsive: true,
  scales: {
    x: {
      stacked: true
    },
    y: {
      stacked: true,
      beginAtZero: true
    }
  },
  plugins: {
    legend: {
      position: 'top',
    },
  },
});

/************************************************************************/
// Computed properties para estadísticas
const totalOrdenesPendientes = computed(() => ordenesPendientes.value.length);
const totalOrdenesReparadas = computed(() => ordenesReparadas.value.length);
const ingresosMesActual = computed(() => {
  return reparacionesTotalesMes.value;
});
const comisionesPendientes = computed(() => {
  const suma = datosTallerN.value.reduce((acc, curr) => {
    if (curr.pago_tecnico === 'NO COBRADO') {
      return acc + Number(curr.beneficio_tecnico || 0);
    }
    return acc;
  }, 0);
  return suma.toFixed(2);
});
/************************************************************************/
</script>
<template>
<main class="mitaller-page">
  <section class="mitaller-hero">
    <div class="mitaller-hero-copy">
      <p class="mitaller-eyebrow">Panel Técnico</p>
      <h1 class="mitaller-title">Mi Taller</h1>
      <p class="mitaller-subtitle">Seguimiento de órdenes, productividad y acciones rápidas para {{ tecnicoActual }}.</p>
      <div class="mitaller-hero-chips">
        <span class="mitaller-chip mitaller-chip-neutral">Órdenes activas: {{ totalOrdenesActivas }}</span>
        <span class="mitaller-chip mitaller-chip-warning">Pendientes: {{ totalOrdenesPendientes }}</span>
        <span class="mitaller-chip mitaller-chip-success">Reparadas: {{ totalOrdenesReparadas }}</span>
      </div>
    </div>
    <div class="mitaller-highlight">
      <div class="mitaller-highlight-label">Comisiones pendientes</div>
      <div class="mitaller-highlight-value">RD$ {{ comisionesPendientes }}</div>
      <div class="mitaller-highlight-meta">Ticket promedio del mes: RD$ {{ ticketPromedioMes.toFixed(2) }}</div>
    </div>
  </section>

  <section class="mitaller-stats-grid">
    <article class="mitaller-stat-card mitaller-stat-card-warning">
      <div>
        <p class="mitaller-stat-label">Órdenes pendientes</p>
        <h3 class="mitaller-stat-value">{{ totalOrdenesPendientes }}</h3>
      </div>
      <i class="pi pi-clock mitaller-stat-icon"></i>
    </article>
    <article class="mitaller-stat-card mitaller-stat-card-success">
      <div>
        <p class="mitaller-stat-label">Reparadas</p>
        <h3 class="mitaller-stat-value">{{ totalOrdenesReparadas }}</h3>
      </div>
      <i class="pi pi-check-circle mitaller-stat-icon"></i>
    </article>
    <article class="mitaller-stat-card mitaller-stat-card-info">
      <div>
        <p class="mitaller-stat-label">Ingresos del mes</p>
        <h3 class="mitaller-stat-value">RD$ {{ ingresosMesActual.toFixed(2) }}</h3>
      </div>
      <i class="pi pi-chart-line mitaller-stat-icon"></i>
    </article>
    <article class="mitaller-stat-card mitaller-stat-card-primary">
      <div>
        <p class="mitaller-stat-label">Meta mensual</p>
        <h3 class="mitaller-stat-value">{{ progreso }}%</h3>
      </div>
      <i class="pi pi-flag mitaller-stat-icon"></i>
    </article>
  </section>

  <section class="mitaller-actions-panel">
    <div class="mitaller-actions-head">
      <div>
        <h2 class="mitaller-section-title">Acciones rápidas</h2>
        <p class="mitaller-section-copy">Atajos para consulta, captura y gestión diaria.</p>
      </div>
    </div>
    <div class="mitaller-actions-grid">
      <Button label="Gestionar orden" @click="visibletaller = true" icon="pi pi-wrench" severity="contrast" />
      <Button label="Nueva orden" @click="nuevoTaller" icon="pi pi-plus" severity="success" />
      <Button label="Orden rápida" @click="abrirOrdenRapida" icon="pi pi-bolt" severity="warning" />
      <Button label="Consulta Apple" @click="buscadorApple" icon="pi pi-qrcode" severity="help" />
      <Button label="Consulta Samsung" @click="buscadoSamsung" icon="pi pi-qrcode" severity="info" />
      <Button label="Consulta básica" @click="buscadorBasico" icon="pi pi-search" severity="secondary" />
    </div>
  </section>

  <section class="mitaller-content-card">
    <TabView>
            <TabPanel header="Pendientes">
              <div>
                <div class="mitaller-table-head">
                  <div>
                    <h2 class="mitaller-section-title">Reparaciones pendientes</h2>
                    <p class="mitaller-section-copy">Órdenes que todavía están en revisión y requieren seguimiento.</p>
                  </div>
                  <span class="mitaller-chip mitaller-chip-warning">
                    {{ ordenesPendientes.length }} órdenes
                  </span>
                </div>
                <DataTable
                  :value="ordenesPendientes"
                  :rowClass="getPrioridadClass"
                  :paginator="true"
                  :rows="10"
                  stripedRows
                  responsiveLayout="scroll"
                  paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                  :rowsPerPageOptions="[5,10,25,50]"
                  currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} órdenes"
                >
                  <Column field="no_factura" header="# Orden" :sortable="true" style="min-width: 100px">
                    <template #body="slotProps">
                      <span class="font-semibold text-blue-600">{{ slotProps.data.no_factura }}</span>
                    </template>
                  </Column>
                  <Column field="nombre" header="Cliente" :sortable="true" style="min-width: 150px"></Column>
                  <Column field="equipo" header="Equipo" :sortable="true" style="min-width: 120px"></Column>
                  <Column field="marca" header="Marca" :sortable="true" style="min-width: 100px"></Column>
                  <Column field="modelo" header="Modelo" :sortable="true" style="min-width: 120px"></Column>
                  <Column field="estado" header="Estado" :sortable="true" style="min-width: 120px">
                    <template #body="slotProps">
                      <span :class="getEstadoUi(slotProps.data.estado).chip">{{ getEstadoUi(slotProps.data.estado).label }}</span>
                    </template>
                  </Column>
                  <Column field="fecha_entrada" header="Fecha Entrada" :sortable="true" style="min-width: 120px"></Column>
                  <Column field="fecha_entrega" header="Fecha Entrega" :sortable="true" style="min-width: 120px"></Column>
                  <Column header="Acciones" style="min-width: 100px">
                    <template #body="slotProps">
                      <Button
                        icon="pi pi-eye"
                        severity="info"
                        size="small"
                        text
                        rounded
                        @click="abrirDetalleOrden(slotProps.data)"
                        v-tooltip.top="'Ver detalles'"
                      />
                    </template>
                  </Column>
                </DataTable>
              </div>
            </TabPanel>
      <TabPanel header="Reparadas">
        <div>
          <div class="mitaller-table-head">
            <div>
              <h2 class="mitaller-section-title">Reparaciones completadas</h2>
              <p class="mitaller-section-copy">Órdenes listas, validadas o ya marcadas como reparadas.</p>
            </div>
            <span class="mitaller-chip mitaller-chip-success">
              {{ ordenesReparadas.length }} órdenes
            </span>
          </div>
          <DataTable
            :value="ordenesReparadas"
            :paginator="true"
            :rows="10"
            stripedRows
            responsiveLayout="scroll"
            paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
            :rowsPerPageOptions="[5,10,25,50]"
            currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} órdenes"
          >
            <Column field="no_factura" header="# Orden" :sortable="true" style="min-width: 100px">
              <template #body="slotProps">
                <span class="font-semibold text-blue-600">{{ slotProps.data.no_factura }}</span>
              </template>
            </Column>
            <Column field="nombre" header="Cliente" :sortable="true" style="min-width: 150px"></Column>
            <Column field="equipo" header="Equipo" :sortable="true" style="min-width: 120px"></Column>
            <Column field="marca" header="Marca" :sortable="true" style="min-width: 100px"></Column>
            <Column field="modelo" header="Modelo" :sortable="true" style="min-width: 120px"></Column>
            <Column field="estado" header="Estado" :sortable="true" style="min-width: 120px">
              <template #body="slotProps">
                <span :class="getEstadoUi(slotProps.data.estado).chip">{{ getEstadoUi(slotProps.data.estado).label }}</span>
              </template>
            </Column>
            <Column field="fecha_entrada" header="Fecha Entrada" :sortable="true" style="min-width: 120px"></Column>
            <Column field="fecha_entrega" header="Fecha Entrega" :sortable="true" style="min-width: 120px"></Column>
            <Column header="Acciones" style="min-width: 100px">
              <template #body="slotProps">
                <Button
                  icon="pi pi-eye"
                  severity="success"
                  size="small"
                  text
                  rounded
                  @click="abrirDetalleOrden(slotProps.data)"
                  v-tooltip.top="'Ver detalles'"
                />
              </template>
            </Column>
          </DataTable>
        </div>
      </TabPanel>
      <TabPanel header="Taller">
        <div>
          <div class="mitaller-table-head">
            <div>
              <h2 class="mitaller-section-title">Comisiones y órdenes</h2>
              <p class="mitaller-section-copy">Vista técnica de cobros, piezas y beneficios por orden.</p>
            </div>
          </div>
          <div class="mitaller-inline-table">
            <div v-html="generarTablaFromStringJSON(datosTallerN, false, false,null,null,'tablaTaller',undefined,rowColorCallback)" class="overflow-x-auto"></div>
          </div>
        </div>
      </TabPanel>
      <TabPanel header="Garantía">
        <div>
          <h1 class="text-2xl font-bold mb-4">Garantías</h1>
          <p class="text-gray-600">Sección de garantías en desarrollo.</p>
        </div>
      </TabPanel>
      <TabPanel header="Nómina">
        <div>
          <h1 class="text-2xl font-bold mb-4">Nómina</h1>
            <DynamicTable :data="miNomina" :omitKeys="['id','created_at','updated_at']" />
        </div>
      </TabPanel>

<TabPanel header="Dashboard">
  <div class="grid grid-cols-12 gap-6">
    <div class="col-span-12 md:col-span-6 lg:col-span-3 mitaller-chart-card">
      <h2 class="mitaller-section-title text-center">Progreso mensual</h2>
      <Knob 
        :modelValue="progreso" 
        :value-color="getKnobColor" 
        :max="100" 
        :size="200" 
        show-value
        value-template="{value}%"
        class="mb-4"
      />
      <p class="text-center text-sm text-slate-500">
        RD$ {{ reparacionesTotalesMes }} facturados frente a meta de RD$ {{ metaReparaciones }}
      </p>
    </div>

    <div class="col-span-12 md:col-span-6 lg:col-span-3 mitaller-chart-card">
      <h2 class="mitaller-section-title text-center">Distribución de reparaciones</h2>
      <Pie :data="chartData" :options="chartOptions" />
    </div>


<div class="mitaller-chart-card col-span-12 md:col-span-6 lg:col-span-6">
  <h2 class="mitaller-section-title text-center">Reparaciones por día</h2>
  <Bar :data="chartDataBar" :options="chartOptionsBar" />
</div>

  </div>


          </TabPanel>

    </TabView>
  </section>
</main>

<!-- ////////////////////////////////////////////////////////////////////////////////////////// -->
<Dialog v-model:visible="visibletaller" modal :style="{ width: '68rem' }" :dismissableMask="false">
  <template #header>
    <div class="flex items-center gap-3">
      <div class="mitaller-modal-icon">
        <i class="pi pi-wrench text-white text-xl"></i>
      </div>
      <div>
        <h2 class="text-2xl font-bold text-slate-900 m-0">Gestión de orden</h2>
        <p class="text-sm text-slate-500 m-0">Consulta operativa y acciones rápidas sobre la orden seleccionada.</p>
      </div>
    </div>
  </template>

  <div class="space-y-5">
    <div class="mitaller-modal-card">
      <h3 class="mitaller-section-title mb-3">Seleccionar orden</h3>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label for="ingresenumeroModifcarfactura" class="block text-sm font-medium text-slate-700 mb-2">
            <i class="pi pi-hashtag mr-1"></i> Número de orden
          </label>
          <InputGroup>
            <Dropdown
              v-model="facturaTallerSeleccionada.orden"
              @change="seleccionarTaller"
              editable
              :options="facturasTaller"
              optionLabel="no_factura"
              placeholder="Seleccione una orden"
              class="w-full"
            />
            <Button label="Recargar" icon="pi pi-sync" severity="info" @click="fetchDataTaller" />
          </InputGroup>
        </div>

        <div>
          <label for="elegirclientetaller" class="block text-sm font-medium text-slate-700 mb-2">
            <i class="pi pi-user mr-1"></i> Cliente
          </label>
          <InputText
            type="text"
            v-model="clienteTaller"
            id="elegirclientetaller"
            class="w-full"
            disabled
          />
        </div>
      </div>
    </div>

    <div v-if="ordenSeleccionada" class="grid grid-cols-1 xl:grid-cols-3 gap-4">
      <div class="xl:col-span-2 mitaller-modal-card">
        <div class="flex items-start justify-between gap-4 mb-4">
          <div>
            <p class="text-sm uppercase tracking-[0.18em] text-slate-400">Orden activa</p>
            <h3 class="text-2xl font-semibold text-slate-900">#{{ ordenSeleccionada.no_factura }}</h3>
          </div>
          <span :class="getEstadoUi(ordenSeleccionada.estado).chip">{{ getEstadoUi(ordenSeleccionada.estado).label }}</span>
        </div>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
          <div :class="getEstadoUi(ordenSeleccionada.estado).card">
            <span class="font-semibold text-slate-500">Equipo</span>
            <p class="text-slate-900 mt-1">{{ ordenSeleccionada.equipo }}</p>
          </div>
          <div class="mitaller-state-card">
            <span class="font-semibold text-slate-500">Marca</span>
            <p class="text-slate-900 mt-1">{{ ordenSeleccionada.marca }}</p>
          </div>
          <div class="mitaller-state-card">
            <span class="font-semibold text-slate-500">Modelo</span>
            <p class="text-slate-900 mt-1">{{ ordenSeleccionada.modelo }}</p>
          </div>
          <div class="mitaller-state-card">
            <span class="font-semibold text-slate-500">IMEI</span>
            <p class="text-slate-900 mt-1">{{ ordenSeleccionada.imei || 'N/D' }}</p>
          </div>
          <div class="mitaller-state-card">
            <span class="font-semibold text-slate-500">Entrada</span>
            <p class="text-slate-900 mt-1">{{ ordenSeleccionada.fecha_entrada }}</p>
          </div>
          <div class="mitaller-state-card">
            <span class="font-semibold text-slate-500">Entrega</span>
            <p class="text-slate-900 mt-1">{{ ordenSeleccionada.fecha_entrega || 'Pendiente' }}</p>
          </div>
          <div class="mitaller-state-card">
            <span class="font-semibold text-slate-500">Total</span>
            <p class="text-slate-900 mt-1">RD$ {{ Number(ordenSeleccionada.total || 0).toFixed(2) }}</p>
          </div>
          <div class="mitaller-state-card">
            <span class="font-semibold text-slate-500">Saldo</span>
            <p class="text-slate-900 mt-1">RD$ {{ Number(ordenSeleccionada.saldo || 0).toFixed(2) }}</p>
          </div>
        </div>
      </div>

      <div class="mitaller-modal-card">
        <h3 class="mitaller-section-title mb-3">Acciones</h3>
        <div class="grid grid-cols-1 gap-3">
          <Button label="Ver clave" icon="pi pi-key" severity="info" class="w-full justify-start" @click="verClaveTaller" />
          <Button label="Ver fallas" icon="pi pi-list" severity="warning" class="w-full justify-start" @click="verFallasTaller" />
          <Button label="Agregar comentario" icon="pi pi-comment" severity="secondary" class="w-full justify-start" @click="visibleModificarTaller = true" />
          <Button label="Imprimir recibo" icon="pi pi-print" severity="success" class="w-full justify-start" @click="imprimirTaller" />
          <Button label="Imprimir etiqueta" icon="pi pi-tag" severity="help" class="w-full justify-start" @click="imprimirEtiquetaTaller" />
          <Button label="Marcar reparado" icon="pi pi-check-circle" severity="contrast" class="w-full justify-start" @click="fnCambiarAreparado" />
        </div>
      </div>
    </div>

    <div v-if="ordenSeleccionada" class="mitaller-modal-card">
      <h3 class="mitaller-section-title mb-3">Notas y observaciones</h3>
      <p class="text-sm text-slate-600 whitespace-pre-line">{{ ordenSeleccionada.observaciones || 'Sin comentarios registrados.' }}</p>
    </div>
  </div>

  <template #footer>
    <div class="flex justify-end gap-2">
      <Button label="Cerrar" icon="pi pi-times" severity="secondary" outlined @click="visibletaller = false" />
    </div>
  </template>
</Dialog>

<!-- ************************************************************************************* -->
<Dialog v-model:visible="visiblebuscarImei" modal :position="position" :style="{ width: '35rem' }">
  <template #header>
    <div class="flex items-center gap-3">
      <div class="bg-purple-500 rounded-full p-2">
        <i class="pi pi-qrcode text-white text-xl"></i>
      </div>
      <div>
        <h2 class="text-xl font-bold text-gray-800 m-0">Consultar IMEI</h2>
        <p class="text-sm text-gray-500 m-0">Verificar información del dispositivo</p>
      </div>
    </div>
  </template>

  <div class="space-y-4">
    <div>
      <label for="imeiInput" class="block text-sm font-medium text-gray-700 mb-2">
        <i class="pi pi-hashtag mr-1"></i> Número IMEI
      </label>
      <InputMask
        id="imeiInput"
        v-model="imeiConsulta"
        @keydown.enter="buscarDatosIMEI"
        mask="999999999999999"
        placeholder="000000000000000"
        class="w-full"
      />
      <p class="text-xs text-gray-500 mt-1">Ingrese el número IMEI de 15 dígitos</p>
    </div>
  </div>

  <template #footer>
    <div class="flex justify-end gap-2">
      <Button label="Cancelar" icon="pi pi-times" severity="secondary" outlined @click="visiblebuscarImei = false" />
      <Button label="Buscar" icon="pi pi-search" severity="info" @click="buscarDatosIMEI" />
    </div>
  </template>
</Dialog>

<!-- ************************************************************************************* -->
<Dialog v-model:visible="visibleEtiquetaModal" position="top" modal :style="{ width: '32rem' }">
  <template #header>
    <div class="flex items-center gap-3">
      <div class="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-lg">
        <i class="pi pi-ticket text-blue-600 text-xl"></i>
      </div>
      <div>
        <h3 class="text-lg font-semibold text-neutral-900">Configurar Etiqueta</h3>
        <p class="text-sm text-neutral-500">Selecciona qué datos quieres imprimir</p>
      </div>
    </div>
  </template>

  <div class="space-y-4">
    <div class="bg-neutral-50 rounded-lg p-4 border border-neutral-200">
      <div class="grid grid-cols-1 gap-3">
        <div class="flex items-center gap-3">
          <Checkbox v-model="etiquetaOpciones.incluirCabecera" inputId="etiquetaCabeceraMiTaller" binary />
          <label for="etiquetaCabeceraMiTaller" class="text-sm text-neutral-700 cursor-pointer">Mostrar cabecera del negocio</label>
        </div>
        <div class="flex items-center gap-3">
          <Checkbox v-model="etiquetaOpciones.incluirCodigo" inputId="etiquetaCodigoMiTaller" binary />
          <label for="etiquetaCodigoMiTaller" class="text-sm text-neutral-700 cursor-pointer">Mostrar código de la orden</label>
        </div>
        <div class="flex items-center gap-3">
          <Checkbox v-model="etiquetaOpciones.incluirTexto" inputId="etiquetaTextoMiTaller" binary />
          <label for="etiquetaTextoMiTaller" class="text-sm text-neutral-700 cursor-pointer">Mostrar fallas o descripción</label>
        </div>
        <div class="flex items-center gap-3">
          <Checkbox v-model="etiquetaOpciones.incluirPrecio" inputId="etiquetaClienteMiTaller" binary />
          <label for="etiquetaClienteMiTaller" class="text-sm text-neutral-700 cursor-pointer">Mostrar cliente y teléfono</label>
        </div>
      </div>
    </div>

    <div class="bg-white rounded-lg p-4 border border-neutral-200">
      <label class="block text-sm font-medium text-neutral-700 mb-2">Impresora</label>
      <Select
        v-model="etiquetaOpciones.printerName"
        :options="listaImpresorasEtiqueta"
        placeholder="Selecciona una impresora"
        class="w-full"
        :loading="cargandoImpresorasEtiqueta"
      />
      <small v-if="etiquetaOpciones.printerName" class="text-neutral-500 block mt-2">
        Impresora seleccionada: {{ etiquetaOpciones.printerName }}
      </small>
      <small v-else class="text-amber-600 block mt-2">
        Debes seleccionar una impresora para imprimir la etiqueta.
      </small>
    </div>

    <div class="bg-white rounded-lg p-4 border border-neutral-200">
      <label for="cantidadEtiquetasMiTaller" class="block text-sm font-medium text-neutral-700 mb-2">Cantidad de etiquetas</label>
      <InputNumber
        v-model="etiquetaOpciones.cantidad"
        inputId="cantidadEtiquetasMiTaller"
        :min="1"
        :max="20"
        showButtons
        fluid
      />
    </div>

    <div class="bg-blue-50 rounded-lg p-4 border border-blue-200">
      <h4 class="text-sm font-semibold text-blue-900 mb-3">Vista previa</h4>
      <div class="space-y-2 text-sm text-neutral-700">
        <p v-if="etiquetaOpciones.incluirCabecera">{{ datosEmpresa.empresa.nombre }} - {{ etiquetaOrdenData.no_factura }}</p>
        <p v-if="etiquetaOpciones.incluirCodigo"><span class="font-medium">Código:</span> {{ etiquetaOrdenData.no_factura }}</p>
        <p v-if="etiquetaOpciones.incluirPrecio"><span class="font-medium">Cliente:</span> {{ etiquetaOrdenData.nombre }} - {{ etiquetaOrdenData.telefono }}</p>
        <p v-if="etiquetaOpciones.incluirTexto"><span class="font-medium">Fallas:</span> {{ obtenerTextoEtiqueta(etiquetaOrdenData) || 'Sin descripción' }}</p>
      </div>
    </div>
  </div>

  <template #footer>
    <div class="flex justify-end gap-2">
      <Button
        label="Cancelar"
        icon="pi pi-times"
        severity="secondary"
        outlined
        @click="visibleEtiquetaModal = false"
      />
      <Button
        label="Imprimir"
        icon="pi pi-print"
        severity="success"
        @click="confirmarImpresionEtiqueta"
      />
    </div>
  </template>
</Dialog>

<!-- ************************************************************************************* -->
<Patron :visiblePatron="showPatron" :patron="clavePatron"
      @close="closePatron"  />
<!-- ************************************************************************************* -->
 <LoadingOverlay :visible="loading" />
<!-- ************************************************************************************* -->

<Dialog v-model:visible="visibleModificarTaller" position="top" modal :style="{ width: '45rem' }">
  <template #header>
    <div class="flex items-center gap-3">
      <div class="bg-indigo-500 rounded-full p-2">
        <i class="pi pi-comment text-white text-xl"></i>
      </div>
      <div>
        <h2 class="text-xl font-bold text-gray-800 m-0">Agregar Comentario</h2>
        <p class="text-sm text-gray-500 m-0">Orden #{{ facturaTallerSeleccionada.orden?.no_factura }}</p>
      </div>
    </div>
  </template>

  <div class="space-y-4">
    <div>
      <label for="comentarioInput" class="block text-sm font-medium text-gray-700 mb-2">
        <i class="pi pi-pencil mr-1"></i> Nuevo Comentario
      </label>
      <TextArea
        v-model="comentarioTaller"
        id="comentarioInput"
        rows="5"
        class="w-full"
        placeholder="Escriba su comentario aquí..."
      />
    </div>
  </div>

  <template #footer>
    <div class="flex justify-end gap-2">
      <Button label="Cancelar" icon="pi pi-times" severity="secondary" outlined @click="visibleModificarTaller = false" />
      <Button label="Guardar Comentario" icon="pi pi-check" severity="success" @click="fnComentario" />
    </div>
  </template>
</Dialog>


<!-- ************************************************************************************* -->
<Dialog v-model:visible="visibleOrdenRapida" modal :style="{ width: '50rem' }" :dismissableMask="false">
  <template #header>
    <div class="flex items-center gap-3">
      <div class="bg-orange-500 rounded-full p-2">
        <i class="pi pi-bolt text-white text-xl"></i>
      </div>
      <div>
        <h2 class="text-2xl font-bold text-gray-800 m-0">Orden Rápida</h2>
        <p class="text-sm text-gray-500 m-0">Crear orden de taller con campos mínimos</p>
      </div>
    </div>
  </template>

  <div class="space-y-4">
    <!-- Sección Cliente -->
    <div class="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-500">
      <h3 class="text-lg font-semibold mb-3 text-gray-700">
        <i class="pi pi-user mr-2"></i>Datos del Cliente
      </h3>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label for="cedulaRapida" class="block text-sm font-medium text-gray-700 mb-2">
            Cédula
          </label>
          <InputGroup>
            <InputMask
              id="cedulaRapida"
              v-model="ordenRapida.cedula"
              mask="999-9999999-9"
              placeholder="000-0000000-0"
              class="w-full"
            />
            <Button
              icon="pi pi-search"
              severity="info"
              @click="buscarClientePorCedula"
              v-tooltip.top="'Buscar cliente'"
            />
          </InputGroup>
        </div>

        <div>
          <label for="nombreRapida" class="block text-sm font-medium text-gray-700 mb-2">
            Nombre <span class="text-red-500">*</span>
          </label>
          <InputText
            id="nombreRapida"
            v-model="ordenRapida.nombre"
            placeholder="Nombre del cliente"
            class="w-full"
          />
        </div>

        <div>
          <label for="telefonoRapida" class="block text-sm font-medium text-gray-700 mb-2">
            Teléfono
          </label>
          <InputMask
            id="telefonoRapida"
            v-model="ordenRapida.telefono"
            mask="(999) 999-9999"
            placeholder="(000) 000-0000"
            class="w-full"
          />
        </div>
      </div>
    </div>

    <!-- Sección Equipo -->
    <div class="bg-purple-50 p-4 rounded-lg border-l-4 border-purple-500">
      <h3 class="text-lg font-semibold mb-3 text-gray-700">
        <i class="pi pi-mobile mr-2"></i>Datos del Equipo
      </h3>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label for="imeiRapida" class="block text-sm font-medium text-gray-700 mb-2">
            IMEI
          </label>
          <InputGroup>
            <InputMask
              id="imeiRapida"
              v-model="ordenRapida.imei"
              mask="999999999999999"
              placeholder="000000000000000"
              class="w-full"
            />
            <Button
              icon="pi pi-search"
              severity="help"
              @click="buscarEquipoPorIMEI"
              v-tooltip.top="'Consultar IMEI'"
            />
          </InputGroup>
        </div>

        <div>
          <label for="equipoRapida" class="block text-sm font-medium text-gray-700 mb-2">
            Tipo de Equipo
          </label>
          <Dropdown
            id="equipoRapida"
            v-model="ordenRapida.equipo"
            :options="['CELULAR', 'TABLET', 'LAPTOP', 'PC']"
            placeholder="Seleccione tipo"
            class="w-full"
          />
        </div>

        <div>
          <label for="marcaRapida" class="block text-sm font-medium text-gray-700 mb-2">
            Marca
          </label>
          <InputText
            id="marcaRapida"
            v-model="ordenRapida.marca"
            placeholder="Marca del equipo"
            class="w-full"
          />
        </div>

        <div>
          <label for="modeloRapida" class="block text-sm font-medium text-gray-700 mb-2">
            Modelo
          </label>
          <InputText
            id="modeloRapida"
            v-model="ordenRapida.modelo"
            placeholder="Modelo del equipo"
            class="w-full"
          />
        </div>

        <div>
          <label for="claveRapida" class="block text-sm font-medium text-gray-700 mb-2">
            Clave/PIN
          </label>
          <InputText
            id="claveRapida"
            v-model="ordenRapida.clave"
            placeholder="Clave del dispositivo"
            class="w-full"
          />
        </div>
      </div>
    </div>

    <!-- Sección Reparación -->
    <div class="bg-green-50 p-4 rounded-lg border-l-4 border-green-500">
      <h3 class="text-lg font-semibold mb-3 text-gray-700">
        <i class="pi pi-wrench mr-2"></i>Datos de la Reparación
      </h3>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div class="md:col-span-2">
          <label for="fallaRapida" class="block text-sm font-medium text-gray-700 mb-2">
            Falla Reportada <span class="text-red-500">*</span>
          </label>
          <TextArea
            id="fallaRapida"
            v-model="ordenRapida.falla"
            rows="3"
            placeholder="Describa la falla del equipo..."
            class="w-full"
          />
        </div>

        <div>
          <label for="tecnicoRapida" class="block text-sm font-medium text-gray-700 mb-2">
            Técnico Asignado
          </label>
          <Dropdown
            id="tecnicoRapida"
            v-model="ordenRapida.tecnico"
            :options="usuariosData.filter(u => u.nivel_seguridad === 'Tecnico')"
            optionLabel="nombre"
            placeholder="Seleccione técnico"
            class="w-full"
          />
        </div>

        <div>
          <label for="fechaEntregaRapida" class="block text-sm font-medium text-gray-700 mb-2">
            Fecha de Entrega
          </label>
          <InputText
            id="fechaEntregaRapida"
            v-model="ordenRapida.fecha_entrega"
            type="date"
            class="w-full"
          />
        </div>

        <div>
          <label for="manoobraRapida" class="block text-sm font-medium text-gray-700 mb-2">
            Mano de Obra <span class="text-red-500">*</span>
          </label>
          <InputNumber
            id="manoobraRapida"
            v-model="ordenRapida.manodeobra"
            mode="decimal"
            :minFractionDigits="2"
            :maxFractionDigits="2"
            placeholder="0.00"
            class="w-full"
          />
        </div>

        <div>
          <label for="piezasRapida" class="block text-sm font-medium text-gray-700 mb-2">
            Costo Piezas
          </label>
          <InputNumber
            id="piezasRapida"
            v-model="ordenRapida.preciopiezas"
            mode="decimal"
            :minFractionDigits="2"
            :maxFractionDigits="2"
            placeholder="0.00"
            class="w-full"
          />
        </div>
      </div>

      <!-- Total -->
      <div class="mt-4 p-3 bg-gray-100 rounded-lg">
        <div class="flex justify-between items-center">
          <span class="text-lg font-semibold text-gray-700">Total:</span>
          <span class="text-2xl font-bold text-green-600">
            ${{ (parseFloat(ordenRapida.manodeobra || 0) + parseFloat(ordenRapida.preciopiezas || 0)).toFixed(2) }}
          </span>
        </div>
      </div>
    </div>
  </div>

  <template #footer>
    <div class="flex justify-end gap-2">
      <Button
        label="Cancelar"
        icon="pi pi-times"
        severity="secondary"
        outlined
        @click="visibleOrdenRapida = false"
      />
      <Button
        label="Crear Orden"
        icon="pi pi-check"
        severity="success"
        @click="crearOrdenRapida"
      />
    </div>
  </template>
</Dialog>

<!-- ************************************************************************************* -->

<Toast />
</template>
<style scoped>
.mitaller-page {
  min-height: 100vh;
  padding: 2rem;
  background:
    radial-gradient(circle at top left, rgba(14, 165, 233, 0.16), transparent 30%),
    radial-gradient(circle at top right, rgba(16, 185, 129, 0.12), transparent 28%),
    linear-gradient(180deg, #f7fbff 0%, #eef4f8 100%);
}

.mitaller-hero {
  display: grid;
  grid-template-columns: 1.6fr 0.9fr;
  gap: 1.5rem;
  background: linear-gradient(135deg, #0f172a 0%, #1e293b 48%, #0f766e 100%);
  border-radius: 28px;
  padding: 2rem;
  color: #f8fafc;
  box-shadow: 0 24px 60px rgba(15, 23, 42, 0.18);
}

.mitaller-eyebrow {
  margin: 0 0 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.24em;
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.72);
}

.mitaller-title {
  margin: 0;
  font-size: clamp(2rem, 4vw, 3.6rem);
  line-height: 0.95;
  font-weight: 800;
}

.mitaller-subtitle {
  max-width: 44rem;
  margin: 1rem 0 0;
  font-size: 1rem;
  line-height: 1.7;
  color: rgba(248, 250, 252, 0.78);
}

.mitaller-hero-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin-top: 1.5rem;
}

.mitaller-highlight {
  border-radius: 24px;
  padding: 1.5rem;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.14);
  backdrop-filter: blur(10px);
  align-self: stretch;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.mitaller-highlight-label {
  font-size: 0.82rem;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.65);
}

.mitaller-highlight-value {
  margin-top: 0.65rem;
  font-size: clamp(2rem, 3vw, 2.9rem);
  font-weight: 800;
}

.mitaller-highlight-meta {
  margin-top: 0.85rem;
  color: rgba(255, 255, 255, 0.75);
  font-size: 0.95rem;
}

.mitaller-stats-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 1rem;
  margin-top: 1.5rem;
}

.mitaller-stat-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 1.3rem 1.4rem;
  border-radius: 22px;
  border: 1px solid rgba(148, 163, 184, 0.14);
  box-shadow: 0 14px 32px rgba(15, 23, 42, 0.08);
}

.mitaller-stat-card-warning { background: linear-gradient(180deg, #fff7ed 0%, #ffedd5 100%); }
.mitaller-stat-card-success { background: linear-gradient(180deg, #ecfdf5 0%, #d1fae5 100%); }
.mitaller-stat-card-info { background: linear-gradient(180deg, #eff6ff 0%, #dbeafe 100%); }
.mitaller-stat-card-primary { background: linear-gradient(180deg, #f5f3ff 0%, #ede9fe 100%); }

.mitaller-stat-label {
  margin: 0;
  font-size: 0.82rem;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: #64748b;
}

.mitaller-stat-value {
  margin: 0.5rem 0 0;
  font-size: 2rem;
  line-height: 1;
  color: #0f172a;
}

.mitaller-stat-icon {
  font-size: 1.5rem;
  color: #0f172a;
  opacity: 0.72;
}

.mitaller-actions-panel,
.mitaller-content-card,
.mitaller-chart-card,
.mitaller-modal-card {
  background: rgba(255, 255, 255, 0.88);
  border: 1px solid rgba(226, 232, 240, 0.9);
  box-shadow: 0 18px 36px rgba(15, 23, 42, 0.06);
  backdrop-filter: blur(6px);
}

.mitaller-actions-panel,
.mitaller-content-card {
  margin-top: 1.5rem;
  border-radius: 24px;
  padding: 1.35rem;
}

.mitaller-actions-head,
.mitaller-table-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1rem;
}

.mitaller-actions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 0.85rem;
}

.mitaller-section-title {
  margin: 0;
  color: #0f172a;
  font-size: 1.15rem;
  font-weight: 700;
}

.mitaller-section-copy {
  margin: 0.35rem 0 0;
  color: #64748b;
  font-size: 0.92rem;
}

.mitaller-chip {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.35rem;
  min-height: 2rem;
  padding: 0.4rem 0.8rem;
  border-radius: 999px;
  font-size: 0.78rem;
  font-weight: 700;
  border: 1px solid transparent;
  background: #e2e8f0;
  color: #334155;
}

.mitaller-chip-neutral { background: rgba(255,255,255,0.12); color: #f8fafc; border-color: rgba(255,255,255,0.18); }
.mitaller-chip-warning { background: #fff7ed; color: #c2410c; border-color: #fed7aa; }
.mitaller-chip-success { background: #ecfdf5; color: #047857; border-color: #a7f3d0; }
.mitaller-chip-info { background: #eff6ff; color: #1d4ed8; border-color: #bfdbfe; }
.mitaller-chip-primary { background: #f5f3ff; color: #6d28d9; border-color: #ddd6fe; }
.mitaller-chip-danger { background: #fef2f2; color: #b91c1c; border-color: #fecaca; }

.mitaller-inline-table {
  border-radius: 18px;
  overflow: hidden;
  border: 1px solid #e2e8f0;
  background: #fff;
}

.mitaller-chart-card {
  border-radius: 22px;
  padding: 1.25rem;
}

.mitaller-modal-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.8rem;
  height: 2.8rem;
  border-radius: 16px;
  background: linear-gradient(135deg, #0284c7 0%, #0f766e 100%);
}

.mitaller-state-card {
  border-radius: 18px;
  padding: 0.9rem;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
}

.mitaller-state-card-warning { background: #fff7ed; border-color: #fed7aa; }
.mitaller-state-card-success { background: #ecfdf5; border-color: #a7f3d0; }
.mitaller-state-card-info { background: #eff6ff; border-color: #bfdbfe; }
.mitaller-state-card-primary { background: #f5f3ff; border-color: #ddd6fe; }
.mitaller-state-card-danger { background: #fef2f2; border-color: #fecaca; }

:deep(.colorRojo) {
  background-color: #fff1f2 !important;
}

:deep(.colorVerde) {
  background-color: #ecfdf5 !important;
}

:deep(.row-green) {
  background-color: #ecfdf5 !important;
}

:deep(.row-yellow) {
  background-color: #fffbeb !important;
}

:deep(.row-red) {
  background-color: #fff1f2 !important;
}

:deep(.p-tabview-nav) {
  border: none;
  background: transparent;
}

:deep(.p-tabview-panels) {
  background: transparent;
  padding: 1.25rem 0 0;
}

:deep(.p-datatable .p-datatable-thead > tr > th) {
  background: #f8fafc;
  color: #334155;
}

@media (max-width: 1024px) {
  .mitaller-hero,
  .mitaller-stats-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px) {
  .mitaller-page {
    padding: 1rem;
  }

  .mitaller-hero,
  .mitaller-actions-panel,
  .mitaller-content-card {
    border-radius: 20px;
    padding: 1rem;
  }
}
</style>
