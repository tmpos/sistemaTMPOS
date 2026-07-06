
<script setup>
import { ref, onMounted, nextTick, watchEffect,computed } from 'vue';
import axios from 'axios';
import { enviarDatosPorPost, eliminarDatos, obtenerIdsSeleccionados, borrarTodoslosDatos, lenguajeDataTable, nfecha, arrayToObjetoFromTabla, peticionesFetch, encryptarPassword, envioElectron, mensajetoast, crearTablaSiNoExiste, peticiones, lasMayusculas,enviarDatosLocalStorage,peticionesFetchOffline } from '@/funciones/funciones.js';
import Swal from 'sweetalert2'
import { useToast } from "primevue/usetoast";
const toast = useToast();
import EnviarWhatsApp from '@/components/WhatsappModal.vue';
import { useRouter } from 'vue-router';
const router = useRouter();
/************************************************************************/
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import FullCalendar from '@fullcalendar/vue3';
import dayGridPlugin from '@fullcalendar/daygrid';
import esLocale from '@fullcalendar/core/locales/es';
import interactionPlugin from '@fullcalendar/interaction';
import timeGridPlugin from '@fullcalendar/timegrid';
import Citas from '../Citas/Citas.vue'
/************************************************************************/
const usuarioLocal = ref({})
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
const facturasData = ref([]);
const tallerData = ref([]);
const citasData = ref([]);
/************************************************************************/
const enviarWhatsAppRef = ref(null);
const datosWhatsApp = ref({
  nombre: 'John Doe',
  numero: '123456789',
  texto: 'Hola, este es un mensaje predefinido.'
});
/****************************************************/
const mensaje = ref('')
const showWhatsapp = ref(false);
const closeWhatsapp = () => {
    showWhatsapp.value = false;
};
/****************************************************/
const showWhatsAppModal = async () => {
  if (enviarWhatsAppRef.value) {
          enviarWhatsAppRef.value.updateDatosWhatsApp(datosWhatsApp.value);
          enviarWhatsAppRef.value.visible = true;
  }
};

const abrirWhatsapp = ()=>{
     showWhatsAppModal()
}
/************************************************************************/
const calendarRef = ref(null); // Referencia al componente FullCalendar
const showCita = ref(false)
const selectedDateForCita = ref(null)
const CITAS_KEY = 'citasEventos'

const calendarOptions = ref({
  plugins: [interactionPlugin, dayGridPlugin, timeGridPlugin],
  initialView: 'dayGridMonth',
  headerToolbar: {
    left: 'prev,next today', // Incluye el botón personalizado
    center: 'title',
    right: 'dayGridMonth,timeGridWeek,timeGridDay',
  },
  customButtons: {
    customButton: {
      text: 'Volver a mensual',
      click: () => returnToMonthView(), 
    },
    resumenVenta: {
      text: 'Resumen de Ventas',
      click: () => returnToMonthView(), 
    },
    resumenTaller: {
      text: 'Resumen de Taller',
      click: () => returnToMonthView(), 
    },
  },
  weekends: true,
  selectable: true,
  firstDay: 0,
  eventTimeFormat: {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  },
  locale: esLocale,
  events: [],
  select: (selected) => {
    console.log('Evento seleccionado:', selected);
  },
  eventClick: (info) => handleEventClick(info.event),
  dateClick: (info) => handleDateClick(info.date),
  editable: true,
  eventDrop: async (info) => handleEventDrop(info),
});
/************************************************************************/
const visible = ref(false);
const visiblecrear = ref(false);
const originalEvents = ref([]);
const filteredEvents = ref([]);
const isFiltered = ref(false);
/************************************************************************/
watchEffect(() => {
  /*if (visiblecrear.value) {
  }*/
});

/************************************************************************/

const fetchFacturasDatostimestamp = async () => {
      const fechas = nfecha('mestimestamp')
  try {
/*    const response = await peticionesFetch(
      `${link.value}${api.value}`,
      'datostimestamp',
      { tabla: 'facturas', campo: 'created_at', fechainicio: fechas.fechainicio, fechafin: fechas.fechafin },
      tokenCifrado.value,
      'POST'
    );*/

const response = await peticionesFetchOffline('getRowsByTimestampRange', 'facturas','created_at',fechas.fechainicio,fechas.fechafin);

    facturasData.value = response.filter(fact=>fact.almacen === datosEmpresa.empresa.nombre);
    //facturasDataNames.value = response.map(facturas=>facturas.name);
    

    facturasData.value.forEach(factura => {
        const newEvent = {
          title: 'FACTURA - '+factura.no_factura,
          start: factura.created_at,
          extendedProps: {
            cantidad: factura.total,
            tipo:'FACTURAS',
            id_factura:factura.id,
          },
          backgroundColor: factura.estado === 'Pendiente' ? 'orange' : 'green',
          borderColor: factura.estado === 'Pendiente' ? 'orange' : 'green',
          textColor: 'white' 
        };
        calendarOptions.value.events.push(newEvent);
})

  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to fetch data from facturas',
      life: 3000
    });
  }
};

/************************************************************************/

const fetchCitasData = async () => {
  try {
    const response = await peticionesFetchOffline('getDataAsArray', 'citas_clientes');
    citasData.value = response || [];

    citasData.value.forEach(cita => {
      const colorEstado = {
        'pendiente': '#f59e0b',    // naranja
        'confirmada': '#3b82f6',   // azul
        'completada': '#10b981',   // verde
        'cancelada': '#ef4444',    // rojo
        'reagendada': '#6b7280'    // gris
      };

      const iconoPrioridad = {
        'urgente': '🔴',
        'alta': '🟠',
        'normal': '🟡',
        'baja': '🟢'
      };

      const startDateTime = `${cita.fecha}T${cita.hora}`;
      let endDateTime = undefined;

      if (cita.duracion_minutos) {
        const startDate = new Date(startDateTime);
        const endDate = new Date(startDate.getTime() + cita.duracion_minutos * 60000);
        endDateTime = endDate.toISOString();
      }

      const newEvent = {
        id: `cita-${cita.id}`,
        title: `${iconoPrioridad[cita.prioridad] || ''} ${cita.titulo}`,
        start: startDateTime,
        end: endDateTime,
        backgroundColor: colorEstado[cita.estado] || '#6b7280',
        borderColor: colorEstado[cita.estado] || '#6b7280',
        textColor: 'white',
        extendedProps: {
          tipo: 'CITA_DB',
          cliente: cita.nombre_cliente,
          descripcion: cita.descripcion,
          estado: cita.estado,
          prioridad: cita.prioridad,
          ubicacion: cita.ubicacion,
          tipo_cita: cita.tipo,
          notas_internas: cita.notas_internas,
          id_cita: cita.id
        }
      };

      calendarOptions.value.events.push(newEvent);
    });

  } catch (error) {
    console.error('Error al cargar citas:', error);
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Error al cargar citas',
      life: 3000
    });
  }
};

/************************************************************************/

const fetchTallerDatostimestamp = async () => {
        const fechas = nfecha('mestimestamp')
  try {
/*    const response = await peticionesFetch(
      `${link.value}${api.value}`,
      'datostimestamp',
      { tabla: 'taller', campo: 'updated_at', fechainicio: fechas.fechainicio, fechafin: fechas.fechafin  },
      tokenCifrado.value,
      'POST'
    );
*/
const response = await peticionesFetchOffline('getRowsByTimestampRange', 'taller','updated_at',fechas.fechainicio,fechas.fechafin);

    tallerData.value = response.filter(fact=>fact.almacen === datosEmpresa.empresa.nombre);
    //tallerDataNames.value = response.map(taller=>taller.name);
    
    tallerData.value.forEach(factura => {

    const estadoColores = {
        'En Revision': { bg: '#FFA500', border: '#FFA500', text: 'white' }, // Naranja
        'Devolucion': { bg: '#DC3545', border: '#DC3545', text: 'white' }, // Rojo
        'Entregado': { bg: '#28A745', border: '#28A745', text: 'white' }, // Verde
        'Reparado': { bg: '#007BFF', border: '#007BFF', text: 'white' }, // Azul
        'Pendiente': { bg: '#FFFFFF', border: '#000000', text: 'black' } // Blanco con borde negro
    };

    const colores = estadoColores[factura.estado] || { bg: '#6C757D', border: '#6C757D', text: 'white' }; // Gris por defecto


        const newEvent = {
          title: 'TALLER - '+factura.no_factura,
          start: factura.updated_at,
          extendedProps: {
            cantidad: factura.total,
            tipo:'TALLER',
            id_factura:factura.id,
          },
          backgroundColor: colores.bg,

          borderColor: factura.estado === 'En Revision' ? 'orange' : 'green',
          textColor: 'white' 
        };
        calendarOptions.value.events.push(newEvent);
})


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
usuarioLocal.value = JSON.parse(window.localStorage.getItem('usuarioLocal'))[0] || {};

  if(usuarioLocal.value.usuario === 'Tecnico'){
    router.push('/mitaller')
  }


await fetchFacturasDatostimestamp();
await fetchTallerDatostimestamp();
await fetchCitasData();
loadCitas();
});
/************************************************************************/
const currentView = ref('month'); // Estado del calendario: "month" o "day"
const selectedDate = ref(null); // Fecha seleccionada

const updateHeaderToolbar = () => {
  if (currentView.value === 'day') {
    calendarOptions.value.headerToolbar.left = 'prev,next today customButton resumenVenta resumenTaller';
  } else {
    calendarOptions.value.headerToolbar.left = 'prev,next today';
  }
};

const handleDateClick = (date) => {
  // Cambiar vista al día seleccionado
  const calendarApi = calendarRef.value.getApi();
  calendarApi.changeView('timeGridDay', date); // Cambiar vista a 'timeGridDay' y enfocarse en la fecha seleccionada
  currentView.value = 'day';
  selectedDate.value = date;
  updateHeaderToolbar();
  selectedDateForCita.value = date
  showCita.value = true
};

const returnToMonthView = () => {
  // Regresar a la vista mensual
  const calendarApi = calendarRef.value.getApi();
  calendarApi.changeView('dayGridMonth'); // Cambiar vista a 'dayGridMonth'
  currentView.value = 'month';
  selectedDate.value = null;
  updateHeaderToolbar();
};
/************************************************************************/
// Citas: persistencia local y carga al calendario
const loadCitas = () => {
  try {
    const raw = localStorage.getItem(CITAS_KEY)
    const lista = raw ? JSON.parse(raw) : []
    lista.forEach(evt => {
      calendarOptions.value.events.push(evt)
    })
  } catch {}
}

const saveCita = (evt) => {
  try {
    const raw = localStorage.getItem(CITAS_KEY)
    const lista = raw ? JSON.parse(raw) : []
    lista.push(evt)
    localStorage.setItem(CITAS_KEY, JSON.stringify(lista))
  } catch {}
}
const handleEventClick = async(event) => {
  // Manejar citas de la base de datos
  if (event.extendedProps && event.extendedProps.tipo === 'CITA_DB') {
    const { cliente, descripcion, estado, prioridad, ubicacion, tipo_cita, notas_internas } = event.extendedProps || {}

    const estadoEmoji = {
      'pendiente': '⏳',
      'confirmada': '✅',
      'completada': '✔️',
      'cancelada': '❌',
      'reagendada': '🔄'
    };

    Swal.fire({
      title: `${estadoEmoji[estado] || ''} ${event.title}`,
      html: `
        <div class="modal-content-professional">
          <div class="info-row">
            <span class="info-label">Cliente:</span>
            <span class="info-value">${cliente || ''}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Fecha/Hora:</span>
            <span class="info-value">${new Date(event.start).toLocaleString('es-DO')}</span>
          </div>
          ${event.end ? `<div class="info-row">
            <span class="info-label">Fin:</span>
            <span class="info-value">${new Date(event.end).toLocaleString('es-DO')}</span>
          </div>` : ''}
          <div class="info-row">
            <span class="info-label">Estado:</span>
            <span class="info-badge badge-${estado}">${estado}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Prioridad:</span>
            <span class="info-badge badge-${prioridad}">${prioridad}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Tipo:</span>
            <span class="info-value">${tipo_cita || 'reunion'}</span>
          </div>
          ${ubicacion ? `<div class="info-row">
            <span class="info-label">Ubicación:</span>
            <span class="info-value">${ubicacion}</span>
          </div>` : ''}
          ${descripcion ? `<div class="info-section">
            <span class="info-label">Descripción:</span>
            <p class="info-description">${descripcion}</p>
          </div>` : ''}
          ${notas_internas ? `<div class="info-section">
            <span class="info-label">Notas:</span>
            <p class="info-description">${notas_internas}</p>
          </div>` : ''}
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: 'Ir a Citas',
      cancelButtonText: 'Cerrar',
      customClass: {
        popup: 'swal-professional-popup',
        title: 'swal-professional-title',
        confirmButton: 'swal-professional-confirm',
        cancelButton: 'swal-professional-cancel'
      },
      allowOutsideClick: true,
      allowEscapeKey: true
    }).then((result) => {
      if (result.isConfirmed) {
        router.push('/citas');
      }
    });
    return;
  }

  // Manejar citas del localStorage (antiguas)
  if (event.extendedProps && event.extendedProps.tipo === 'CITA') {
    const { cliente, telefono, notas } = event.extendedProps || {}
    Swal.fire({
      title: `Cita: ${event.title}`,
      html: `
        <div class="modal-content-professional">
          <div class="info-row">
            <span class="info-label">Inicio:</span>
            <span class="info-value">${new Date(event.start).toLocaleString('es-DO')}</span>
          </div>
          ${event.end ? `<div class="info-row">
            <span class="info-label">Fin:</span>
            <span class="info-value">${new Date(event.end).toLocaleString('es-DO')}</span>
          </div>` : ''}
          <div class="info-row">
            <span class="info-label">Cliente:</span>
            <span class="info-value">${cliente || ''}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Teléfono:</span>
            <span class="info-value">${telefono || ''}</span>
          </div>
          ${notas ? `<div class="info-section">
            <span class="info-label">Notas:</span>
            <p class="info-description">${notas}</p>
          </div>` : ''}
        </div>
      `,
      confirmButtonText: 'Cerrar',
      customClass: {
        popup: 'swal-professional-popup',
        title: 'swal-professional-title',
        confirmButton: 'swal-professional-confirm'
      },
      allowOutsideClick: true,
      allowEscapeKey: true
    })
    return
  }
  if (event.extendedProps.tipo === 'TALLER') {
    //id_factura
    const datos = tallerData.value.find(factura => factura.id === event.extendedProps.id_factura);
    const { nombre, telefono, equipo, marca, modelo, fallas,total, estado,abono } =
      datos;
      const fallasN = JSON.parse(fallas).map(taller=>taller.propiedad)
     const abonosN = JSON.parse(abono)
  .map(ab => Number(ab.abono)) // Convertir cada abono a Number
  .reduce((total, current) => total + current, 0);


    Swal.fire({
      title: `Detalles del Taller`,
      html: `
        <div class="modal-content-professional">
          <div class="info-row">
            <span class="info-label">Cliente:</span>
            <span class="info-value">${nombre}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Teléfono:</span>
            <span class="info-value">${telefono}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Equipo:</span>
            <span class="info-value">${equipo}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Marca:</span>
            <span class="info-value">${marca}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Modelo:</span>
            <span class="info-value">${modelo}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Falla:</span>
            <span class="info-value">${fallasN}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Estado:</span>
            <span class="info-badge badge-${estado.toLowerCase().replace(' ', '-')}">${estado}</span>
          </div>
          <div class="info-row-highlight">
            <span class="info-label">Total:</span>
            <span class="info-value-amount">RD$ ${parseFloat(total).toLocaleString('es-DO', {minimumFractionDigits: 2})}</span>
          </div>
          <div class="info-row-highlight">
            <span class="info-label">Abonado:</span>
            <span class="info-value-amount success">RD$ ${parseFloat(abonosN).toLocaleString('es-DO', {minimumFractionDigits: 2})}</span>
          </div>
          <div class="info-row-highlight balance">
            <span class="info-label">Balance:</span>
            <span class="info-value-amount ${(total - abonosN) > 0 ? 'pending' : 'success'}">RD$ ${parseFloat(total - abonosN).toLocaleString('es-DO', {minimumFractionDigits: 2})}</span>
          </div>
        </div>
      `,
      showCancelButton: true,
      cancelButtonText: 'Cerrar',
      confirmButtonText: 'Imprimir',
      showDenyButton: true,
      denyButtonText: 'WhatsApp',
      customClass: {
        popup: 'swal-professional-popup',
        title: 'swal-professional-title',
        confirmButton: 'swal-professional-confirm',
        cancelButton: 'swal-professional-cancel',
        denyButton: 'swal-professional-whatsapp'
      },
      preConfirm: async() => {
        const datosEmpresa = JSON.stringify(enviarDatosLocalStorage())
        const datosN = JSON.stringify(datos)
        await window.electron.ipcRenderer.invoke('recibotaller',datosN,datosEmpresa,false,true,true);
      },
      preDeny: () => {
        datosWhatsApp.value.nombre = datos.nombre;
        datosWhatsApp.value.numero = datos.whatsapp || datos.telefono
        datosWhatsApp.value.texto = `Hola ${datos.nombre} le escribimos de  *${datosEmpresa.empresa.nombre}* para informarle que su equipo se encuentra *${datos.estado}*`;
        showWhatsAppModal()
        return false;
      },
      allowOutsideClick: true,
      allowEscapeKey: true
    });
  }


if (event.extendedProps.tipo === 'FACTURAS') {
    // Lógica para FACTURAS
    const datos = facturasData.value.find(factura => factura.id === event.extendedProps.id_factura);
    const { nombre_cliente, total, estado_factura, productos } = datos;

/*    const datosCliente = await peticionesFetch(
      `${link.value}${api.value}`,
      'datoscampo/clientes/codigo/'+datos.cod_cliente,
      {},
      tokenCifrado.value,
      'GET'
    );*/

    const datosCliente = await peticionesFetchOffline('getDataByField', 'clientes','codigo',datos.cod_cliente);


    const detallesN = JSON.parse(productos).map(item => `<li>${item.cantidad} x ${item.nombre} (${item.precio_venta})</li>`).join('');

Swal.fire({
  title: `Detalles de la Factura`,
  html: `
    <div class="modal-content-professional">
      <div class="info-row">
        <span class="info-label">Cliente:</span>
        <span class="info-value">${nombre_cliente}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Teléfono:</span>
        <span class="info-value">${datosCliente ? datosCliente.telefono : 'N/A'}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Estado:</span>
        <span class="info-badge badge-${estado_factura.toLowerCase()}">${estado_factura}</span>
      </div>
      <div class="info-row-highlight">
        <span class="info-label">Total:</span>
        <span class="info-value-amount">RD$ ${parseFloat(total).toLocaleString('es-DO', {minimumFractionDigits: 2})}</span>
      </div>
      <div class="info-section">
        <span class="info-label">Detalles de Productos:</span>
        <ul class="products-list">${detallesN}</ul>
      </div>
    </div>
  `,
  showCancelButton: true,
  cancelButtonText: 'Cerrar',
  confirmButtonText: 'Imprimir',
  showDenyButton: true,
  denyButtonText: 'WhatsApp',
  customClass: {
    popup: 'swal-professional-popup',
    title: 'swal-professional-title',
    confirmButton: 'swal-professional-confirm',
    cancelButton: 'swal-professional-cancel',
    denyButton: 'swal-professional-whatsapp'
  },
  preConfirm: async () => {
    const datosEmpresa1 = JSON.stringify(enviarDatosLocalStorage());
    let datosCliente = null;
try {
  datosCliente = await peticionesFetchOffline(
    'getDataByField',
    'clientes',
    'codigo',
    datos.cod_cliente
  );
} catch (e) {
  console.error("Error cargando cliente:", e);
}
    const envio = await window.electron.ipcRenderer.invoke('ticket', JSON.stringify(datos),JSON.stringify(datosCliente), datosEmpresa1);
  },
preDeny: () => {
    if (!datosCliente) {
      toast.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Este Cliente no tiene Teléfono',
        life: 3000
      });
      return; // ❗ Permite que se cierre normalmente
    }

    datosWhatsApp.value.nombre = datos.nombre_cliente;
    datosWhatsApp.value.numero = datosCliente.telefono;
    datosWhatsApp.value.texto = `Hola ${datos.nombre_cliente}, le escribimos de *${datosEmpresa.empresa.nombre}* para informarle sobre su factura. El total es de *${total}* y el saldo pendiente es de *${total}*.`;

    showWhatsAppModal();

    return false; // ❗ Mantiene el Swal abierto SOLO para WhatsApp
},

  allowOutsideClick: true,
  allowEscapeKey: true
});

  }

};

/************************************************************************/
const handleEventDrop = async (info) => {
  if (info.event.extendedProps.tipo === 'CITA_DB') {
    const nuevaFecha = info.event.start.toISOString().split('T')[0];
    const nuevaHora = info.event.start.toTimeString().slice(0, 5);

    try {
      const updateData = {
        id: info.event.extendedProps.id_cita,
        fecha: nuevaFecha,
        hora: nuevaHora,
        estado: 'reagendada',
        updated_at: new Date().toISOString()
      };

      await peticionesFetchOffline('updateData', 'citas_clientes', updateData);

      toast.add({
        severity: 'success',
        summary: 'Éxito',
        detail: 'Cita reagendada correctamente',
        life: 3000
      });

      // Actualizar el color del evento
      info.event.setProp('backgroundColor', '#6b7280');
      info.event.setProp('borderColor', '#6b7280');

    } catch (error) {
      info.revert();
      console.error('Error al reagendar cita:', error);
      toast.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Error al reagendar cita',
        life: 3000
      });
    }
  }
};

/************************************************************************/
</script>
<template>
<main class="content-wrapper">
  <div class="calendar-container">
    <Card class="calendar-card">
      <template #content>
        <div class="calendar-content">
          <div class="calendar-header">
            <div class="header-title">
              <i class="pi pi-calendar"></i>
              <h2>Calendario de Eventos</h2>
            </div>
            <Button
              label="Nueva Cita"
              icon="pi pi-calendar-plus"
              class="nueva-cita-btn"
              @click="() => { selectedDateForCita = new Date(); showCita = true }"
            />
          </div>
          <div class="calendar-wrapper">
            <FullCalendar ref="calendarRef" :options="calendarOptions" />
          </div>
          <Citas v-model="showCita" :defaultDate="selectedDateForCita" @save="(evt) => { calendarOptions.events.push(evt); saveCita(evt) }" />
        </div>
      </template>
    </Card>

    <!-- ////////////////////////////////////////////////////////////////////////////////////////// -->
    <EnviarWhatsApp ref="enviarWhatsAppRef" :initialDatosWhatsApp="datosWhatsApp" />
    <!-- ////////////////////////////////////////////////////////////////////////////////////////// -->
    <Toast />
  </div>
</main>
</template>

<style scoped>
.calendar-container {
  padding: 2rem;
  background: linear-gradient(135deg, #f5f7fa 0%, #e8ecf1 100%);
  min-height: 100vh;
}

.calendar-card {
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.08);
  border-radius: 16px;
  overflow: hidden;
  background: white;
  transition: all 0.3s ease;
}

.calendar-card:hover {
  box-shadow: 0 15px 50px rgba(0, 0, 0, 0.12);
  transform: translateY(-2px);
}

.calendar-content {
  padding: 2rem;
}

.calendar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  padding-bottom: 1.5rem;
  border-bottom: 2px solid #e8ecf1;
}

.header-title {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.header-title i {
  font-size: 2rem;
  color: #4f46e5;
}

.header-title h2 {
  margin: 0;
  font-size: 1.75rem;
  font-weight: 700;
  color: #1e293b;
  background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.nueva-cita-btn {
  background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
  border: none;
  padding: 0.75rem 1.5rem;
  font-weight: 600;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(79, 70, 229, 0.3);
}

.nueva-cita-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(79, 70, 229, 0.4);
}

.calendar-wrapper {
  background: white;
  border-radius: 12px;
  padding: 1rem;
}

/* FullCalendar Custom Styles */
:deep(.fc) {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

:deep(.fc-toolbar-title) {
  font-size: 1.75rem !important;
  font-weight: 700 !important;
  color: #1e293b !important;
  text-transform: capitalize;
}

:deep(.fc-button) {
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%) !important;
  border: none !important;
  padding: 0.6rem 1.2rem !important;
  font-weight: 600 !important;
  border-radius: 8px !important;
  transition: all 0.3s ease !important;
  box-shadow: 0 2px 8px rgba(99, 102, 241, 0.3) !important;
}

:deep(.fc-button:hover) {
  transform: translateY(-2px) !important;
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.4) !important;
  background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%) !important;
}

:deep(.fc-button:active) {
  transform: translateY(0) !important;
}

:deep(.fc-button-active) {
  background: linear-gradient(135deg, #4338ca 0%, #6d28d9 100%) !important;
  box-shadow: 0 2px 8px rgba(67, 56, 202, 0.4) !important;
}

:deep(.fc-daygrid-day) {
  transition: all 0.2s ease;
  cursor: pointer;
}

:deep(.fc-daygrid-day:hover) {
  background-color: #f8f9ff !important;
}

:deep(.fc-daygrid-day-number) {
  padding: 8px;
  font-weight: 600;
  color: #475569;
  font-size: 0.9rem;
}

:deep(.fc-col-header-cell) {
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  padding: 1rem 0.5rem;
  font-weight: 700;
  text-transform: uppercase;
  font-size: 0.75rem;
  letter-spacing: 0.05em;
  color: #64748b;
  border-color: #e2e8f0 !important;
}

:deep(.fc-day-today) {
  background-color: #eef2ff !important;
  border: 2px solid #6366f1 !important;
}

:deep(.fc-day-today .fc-daygrid-day-number) {
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  color: white;
  border-radius: 50%;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 4px;
}

:deep(.fc-event) {
  border-radius: 6px;
  padding: 4px 8px;
  font-weight: 600;
  font-size: 0.85rem;
  margin: 2px 0;
  border: none !important;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
  transition: all 0.2s ease;
  cursor: pointer;
}

:deep(.fc-event:hover) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  filter: brightness(1.1);
}

:deep(.fc-event-title) {
  font-weight: 600;
}

:deep(.fc-timegrid-slot) {
  height: 3rem;
}

:deep(.fc-timegrid-event) {
  border-radius: 6px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

:deep(.fc-scrollgrid) {
  border-color: #e2e8f0 !important;
  border-radius: 8px;
  overflow: hidden;
}

:deep(.fc-theme-standard td),
:deep(.fc-theme-standard th) {
  border-color: #e2e8f0 !important;
}

:deep(.fc-toolbar) {
  margin-bottom: 1.5rem !important;
  gap: 0.5rem;
}

:deep(.fc-toolbar-chunk) {
  display: flex;
  gap: 0.5rem;
}

/* Animaciones */
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

.calendar-card {
  animation: fadeIn 0.5s ease;
}

/* Estilos responsive */
@media (max-width: 768px) {
  .calendar-container {
    padding: 1rem;
  }

  .calendar-content {
    padding: 1rem;
  }

  .calendar-header {
    flex-direction: column;
    gap: 1rem;
    align-items: flex-start;
  }

  .header-title h2 {
    font-size: 1.5rem;
  }

  :deep(.fc-toolbar) {
    flex-direction: column;
    gap: 1rem;
  }

  :deep(.fc-toolbar-title) {
    font-size: 1.25rem !important;
  }
}

/* Leyenda de colores (opcional) */
.event-legend {
  display: flex;
  gap: 1.5rem;
  margin-top: 1rem;
  padding: 1rem;
  background: #f8fafc;
  border-radius: 8px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  font-weight: 600;
}

.legend-color {
  width: 16px;
  height: 16px;
  border-radius: 4px;
}
</style>

<style>
/* SweetAlert Professional Styles - Global */
.swal-professional-popup {
  border-radius: 16px !important;
  padding: 2rem !important;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15) !important;
}

.swal-professional-title {
  font-size: 1.75rem !important;
  font-weight: 700 !important;
  color: #1e293b !important;
  padding: 1rem 0 !important;
  border-bottom: 2px solid #e8ecf1 !important;
  margin-bottom: 1.5rem !important;
}

.swal-professional-confirm {
  background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%) !important;
  border: none !important;
  border-radius: 8px !important;
  padding: 0.75rem 2rem !important;
  font-weight: 600 !important;
  font-size: 1rem !important;
  transition: all 0.3s ease !important;
  box-shadow: 0 4px 15px rgba(79, 70, 229, 0.3) !important;
}

.swal-professional-confirm:hover {
  transform: translateY(-2px) !important;
  box-shadow: 0 6px 20px rgba(79, 70, 229, 0.4) !important;
}

.swal-professional-cancel {
  background: #f1f5f9 !important;
  color: #64748b !important;
  border: none !important;
  border-radius: 8px !important;
  padding: 0.75rem 2rem !important;
  font-weight: 600 !important;
  font-size: 1rem !important;
  transition: all 0.3s ease !important;
}

.swal-professional-cancel:hover {
  background: #e2e8f0 !important;
  transform: translateY(-2px) !important;
}

.swal-professional-whatsapp {
  background: linear-gradient(135deg, #25D366 0%, #128C7E 100%) !important;
  color: white !important;
  border: none !important;
  border-radius: 8px !important;
  padding: 0.75rem 2rem !important;
  font-weight: 600 !important;
  font-size: 1rem !important;
  transition: all 0.3s ease !important;
  box-shadow: 0 4px 15px rgba(37, 211, 102, 0.3) !important;
}

.swal-professional-whatsapp:hover {
  transform: translateY(-2px) !important;
  box-shadow: 0 6px 20px rgba(37, 211, 102, 0.4) !important;
}

/* Modal Content Styles */
.modal-content-professional {
  text-align: left;
  padding: 1rem 0;
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1rem;
  margin-bottom: 0.5rem;
  border-radius: 8px;
  background: #f8fafc;
  transition: all 0.2s ease;
}

.info-row:hover {
  background: #f1f5f9;
  transform: translateX(4px);
}

.info-row-highlight {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.25rem;
  margin: 0.75rem 0;
  border-radius: 8px;
  background: linear-gradient(135deg, #eef2ff 0%, #e0e7ff 100%);
  border-left: 4px solid #6366f1;
  font-weight: 600;
}

.info-row-highlight.balance {
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
  border-left-color: #f59e0b;
}

.info-label {
  font-weight: 600;
  color: #64748b;
  font-size: 0.9rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.info-value {
  color: #1e293b;
  font-weight: 500;
  font-size: 1rem;
}

.info-value-amount {
  color: #4f46e5;
  font-weight: 700;
  font-size: 1.25rem;
}

.info-value-amount.success {
  color: #10b981;
}

.info-value-amount.pending {
  color: #f59e0b;
}

.info-badge {
  padding: 0.4rem 1rem;
  border-radius: 20px;
  font-weight: 600;
  font-size: 0.85rem;
  text-transform: capitalize;
}

/* Estado badges - Citas */
.info-badge.badge-pendiente {
  background: #fef3c7;
  color: #f59e0b;
}

.info-badge.badge-confirmada {
  background: #dbeafe;
  color: #3b82f6;
}

.info-badge.badge-completada {
  background: #d1fae5;
  color: #10b981;
}

.info-badge.badge-cancelada {
  background: #fee2e2;
  color: #ef4444;
}

.info-badge.badge-reagendada {
  background: #e5e7eb;
  color: #6b7280;
}

/* Prioridad badges */
.info-badge.badge-urgente {
  background: #fee2e2;
  color: #dc2626;
  font-weight: 700;
}

.info-badge.badge-alta {
  background: #fed7aa;
  color: #ea580c;
}

.info-badge.badge-normal {
  background: #fef3c7;
  color: #f59e0b;
}

.info-badge.badge-baja {
  background: #d1fae5;
  color: #10b981;
}

/* Estado badges - Taller */
.info-badge.badge-en-revision {
  background: #fed7aa;
  color: #ea580c;
}

.info-badge.badge-devolucion {
  background: #fee2e2;
  color: #dc2626;
}

.info-badge.badge-entregado {
  background: #d1fae5;
  color: #10b981;
}

.info-badge.badge-reparado {
  background: #dbeafe;
  color: #3b82f6;
}

.info-badge.badge-pendiente {
  background: #f3f4f6;
  color: #4b5563;
  border: 2px solid #9ca3af;
}

.info-section {
  padding: 1rem;
  margin-top: 1rem;
  border-radius: 8px;
  background: #f8fafc;
}

.info-section .info-label {
  display: block;
  margin-bottom: 0.5rem;
}

.info-description {
  color: #475569;
  font-size: 0.95rem;
  line-height: 1.6;
  margin: 0.5rem 0 0 0;
  padding: 0.75rem;
  background: white;
  border-radius: 6px;
  border-left: 3px solid #6366f1;
}

.products-list {
  list-style: none;
  padding: 0;
  margin: 0.75rem 0 0 0;
}

.products-list li {
  padding: 0.75rem;
  margin-bottom: 0.5rem;
  background: white;
  border-radius: 6px;
  border-left: 3px solid #10b981;
  color: #1e293b;
  font-size: 0.95rem;
  transition: all 0.2s ease;
}

.products-list li:hover {
  transform: translateX(4px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

/* Animación de entrada para modales */
@keyframes modalFadeIn {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}






</style>
