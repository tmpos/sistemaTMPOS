<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
const router = useRouter();
import {
  envioElectron,
  encryptarPassword,
  nfecha,
  peticionesFetchOffline,
  crearTablaSiNoExisteOffline
} from '@/funciones/funciones.js';
import Swal from 'sweetalert2';
import { useToast } from "primevue/usetoast";
const toast = useToast();

/************************************************************************/
const usuarioLocal = ref({});
const clientes = ref([]);
const citas = ref([]);
const visible = ref(false);
const citaSeleccionada = ref(null);
const formData = ref({});
const searchQuery = ref('');
const filtroEstado = ref('todas');
const filtroFecha = ref('todas');

/************************************************************************/
// Opciones para los campos
const tiposCita = [
  { label: 'Reunión', value: 'reunion', icon: 'pi-users' },
  { label: 'Seguimiento', value: 'seguimiento', icon: 'pi-phone' },
  { label: 'Presentación', value: 'presentacion', icon: 'pi-chart-bar' },
  { label: 'Negociación', value: 'negociacion', icon: 'pi-comments' },
  { label: 'Cierre de venta', value: 'cierre', icon: 'pi-check-circle' },
  { label: 'Llamada', value: 'llamada', icon: 'pi-phone' },
  { label: 'Video llamada', value: 'videollamada', icon: 'pi-video' },
  { label: 'Otro', value: 'otro', icon: 'pi-ellipsis-h' }
];

const estadosCita = [
  { label: 'Pendiente', value: 'pendiente', severity: 'warning', icon: 'pi-clock' },
  { label: 'Confirmada', value: 'confirmada', severity: 'info', icon: 'pi-check' },
  { label: 'Completada', value: 'completada', severity: 'success', icon: 'pi-check-circle' },
  { label: 'Cancelada', value: 'cancelada', severity: 'danger', icon: 'pi-times-circle' },
  { label: 'Reagendada', value: 'reagendada', severity: 'secondary', icon: 'pi-refresh' }
];

const prioridades = [
  { label: 'Baja', value: 'baja', severity: 'info', icon: 'pi-arrow-down' },
  { label: 'Normal', value: 'normal', severity: 'secondary', icon: 'pi-minus' },
  { label: 'Alta', value: 'alta', severity: 'warning', icon: 'pi-arrow-up' },
  { label: 'Urgente', value: 'urgente', severity: 'danger', icon: 'pi-exclamation-circle' }
];

const recordatorios = [
  { label: 'Sin recordatorio', value: 0 },
  { label: '15 minutos antes', value: 15 },
  { label: '30 minutos antes', value: 30 },
  { label: '1 hora antes', value: 60 },
  { label: '1 día antes', value: 1440 }
];

/************************************************************************/
// Cargar datos
const cargarCitas = async () => {
  try {
    const response = await peticionesFetchOffline('getDataAsArray', 'citas_clientes');
    citas.value = (response || []).reverse();
  } catch (error) {
    console.error('Error al cargar citas:', error);
    toast.add({ severity: 'error', summary: 'Error', detail: 'Error al cargar citas', life: 3000 });
  }
};

const cargarClientes = async () => {
  try {
    const response = await peticionesFetchOffline('getDataAsArray', 'clientes');
    clientes.value = (response || []).filter(c => c.codigo != '0000000');
  } catch (error) {
    console.error('Error al cargar clientes:', error);
  }
};

/************************************************************************/
// Filtros
const citasFiltradas = computed(() => {
  let resultado = citas.value;

  // Filtro por búsqueda
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    resultado = resultado.filter(cita =>
      cita.titulo?.toLowerCase().includes(query) ||
      cita.nombre_cliente?.toLowerCase().includes(query) ||
      cita.descripcion?.toLowerCase().includes(query)
    );
  }

  // Filtro por estado
  if (filtroEstado.value && filtroEstado.value !== 'todas') {
    resultado = resultado.filter(cita => cita.estado === filtroEstado.value);
  }

  // Filtro por fecha
  if (filtroFecha.value && filtroFecha.value !== 'todas') {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    resultado = resultado.filter(cita => {
      const fechaCita = new Date(cita.fecha);
      fechaCita.setHours(0, 0, 0, 0);

      if (filtroFecha.value === 'hoy') {
        return fechaCita.getTime() === hoy.getTime();
      } else if (filtroFecha.value === 'semana') {
        const enUnaSemana = new Date(hoy);
        enUnaSemana.setDate(hoy.getDate() + 7);
        return fechaCita >= hoy && fechaCita <= enUnaSemana;
      } else if (filtroFecha.value === 'mes') {
        return fechaCita.getMonth() === hoy.getMonth() &&
               fechaCita.getFullYear() === hoy.getFullYear();
      }
      return true;
    });
  }

  return resultado;
});

// Estadísticas
const estadisticas = computed(() => {
  return {
    total: citas.value.length,
    pendientes: citas.value.filter(c => c.estado === 'pendiente').length,
    confirmadas: citas.value.filter(c => c.estado === 'confirmada').length,
    completadas: citas.value.filter(c => c.estado === 'completada').length,
    hoy: citas.value.filter(c => {
      const hoy = new Date();
      const fechaCita = new Date(c.fecha);
      return fechaCita.toDateString() === hoy.toDateString();
    }).length
  };
});

/************************************************************************/
// Crear/Editar cita
const abrirDialogoCrear = () => {
  citaSeleccionada.value = null;
  formData.value = {
    id_cliente: null,
    nombre_cliente: '',
    titulo: '',
    descripcion: '',
    fecha: new Date(),
    hora: '09:00',
    tipo: 'reunion',
    estado: 'pendiente',
    prioridad: 'normal',
    usuario_agendo: usuarioLocal.value.id,
    nombre_usuario: usuarioLocal.value.nombre,
    recordatorio: 0,
    duracion_minutos: 60,
    ubicacion: '',
    notas_internas: '',
    resultado: ''
  };
  visible.value = true;
};

const abrirDialogoEditar = (cita) => {
  citaSeleccionada.value = cita;
  formData.value = {
    ...cita,
    fecha: cita.fecha ? new Date(cita.fecha) : new Date()
  };
  visible.value = true;
};

const seleccionarCliente = (cliente) => {
  if (cliente) {
    formData.value.id_cliente = cliente.id;
    formData.value.nombre_cliente = cliente.nombre;
  }
};

const guardarCita = async () => {
  try {
    // Validaciones
    if (!formData.value.id_cliente) {
      toast.add({ severity: 'warn', summary: 'Advertencia', detail: 'Selecciona un cliente', life: 3000 });
      return;
    }
    if (!formData.value.titulo) {
      toast.add({ severity: 'warn', summary: 'Advertencia', detail: 'Ingresa un título', life: 3000 });
      return;
    }
    if (!formData.value.fecha || !formData.value.hora) {
      toast.add({ severity: 'warn', summary: 'Advertencia', detail: 'Ingresa fecha y hora', life: 3000 });
      return;
    }

    // Convertir fecha de Date a string YYYY-MM-DD
    const fechaString = formData.value.fecha instanceof Date
      ? formData.value.fecha.toISOString().split('T')[0]
      : formData.value.fecha;

    const datos = {
      id_cliente: formData.value.id_cliente,
      nombre_cliente: formData.value.nombre_cliente,
      titulo: formData.value.titulo,
      descripcion: formData.value.descripcion || '',
      fecha: fechaString,
      hora: formData.value.hora,
      tipo: formData.value.tipo,
      estado: formData.value.estado,
      prioridad: formData.value.prioridad,
      usuario_agendo: formData.value.usuario_agendo,
      nombre_usuario: formData.value.nombre_usuario,
      recordatorio: parseInt(formData.value.recordatorio) || 0,
      duracion_minutos: parseInt(formData.value.duracion_minutos) || 60,
      ubicacion: formData.value.ubicacion || '',
      notas_internas: formData.value.notas_internas || '',
      resultado: formData.value.resultado || '',
      updated_at: nfecha('fecha') + ' ' + nfecha('hora')
    };

    if (citaSeleccionada.value) {
      // Editar
      datos.id = citaSeleccionada.value.id;
      await peticionesFetchOffline('updateData', 'citas_clientes', datos);
      toast.add({ severity: 'success', summary: 'Éxito', detail: 'Cita actualizada correctamente', life: 3000 });
    } else {
      // Crear
      await peticionesFetchOffline('insertData', 'citas_clientes', JSON.stringify(datos));
      toast.add({ severity: 'success', summary: 'Éxito', detail: 'Cita creada correctamente', life: 3000 });
    }

    visible.value = false;
    await cargarCitas();
    citaSeleccionada.value = null;
  } catch (error) {
    console.error('Error al guardar cita:', error);
    toast.add({ severity: 'error', summary: 'Error', detail: 'Error al guardar cita: ' + error.message, life: 5000 });
  }
};

const eliminarCita = async (id) => {
  const result = await Swal.fire({
    title: '¿Estás seguro?',
    text: '¿Deseas eliminar esta cita?',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#dc3545',
    cancelButtonColor: '#6c757d',
    confirmButtonText: 'Sí, eliminar',
    cancelButtonText: 'Cancelar'
  });

  if (result.isConfirmed) {
    try {
      await peticionesFetchOffline('deleteEntry', 'citas_clientes', id);
      toast.add({ severity: 'success', summary: 'Éxito', detail: 'Cita eliminada correctamente', life: 3000 });
      await cargarCitas();
    } catch (error) {
      console.error('Error al eliminar cita:', error);
      toast.add({ severity: 'error', summary: 'Error', detail: 'Error al eliminar cita', life: 3000 });
    }
  }
};

const cambiarEstado = async (cita, nuevoEstado) => {
  try {
    await peticionesFetchOffline('updateData', 'citas_clientes', {
      id: cita.id,
      estado: nuevoEstado,
      updated_at: nfecha('fecha') + ' ' + nfecha('hora')
    });
    toast.add({ severity: 'success', summary: 'Éxito', detail: `Cita ${nuevoEstado}`, life: 3000 });
    await cargarCitas();
  } catch (error) {
    console.error('Error al cambiar estado:', error);
    toast.add({ severity: 'error', summary: 'Error', detail: 'Error al cambiar estado', life: 3000 });
  }
};

/************************************************************************/
// Helpers
const getSeverity = (tipo, valor) => {
  if (tipo === 'estado') {
    const item = estadosCita.find(e => e.value === valor);
    return item?.severity || 'secondary';
  } else if (tipo === 'prioridad') {
    const item = prioridades.find(p => p.value === valor);
    return item?.severity || 'secondary';
  }
  return 'secondary';
};

const getIcon = (tipo, valor) => {
  if (tipo === 'estado') {
    const item = estadosCita.find(e => e.value === valor);
    return item?.icon || 'pi-circle';
  } else if (tipo === 'prioridad') {
    const item = prioridades.find(p => p.value === valor);
    return item?.icon || 'pi-circle';
  } else if (tipo === 'tipo') {
    const item = tiposCita.find(t => t.value === valor);
    return item?.icon || 'pi-calendar';
  }
  return 'pi-circle';
};

const formatearFechaHora = (fecha, hora) => {
  if (!fecha) return '';
  const f = new Date(fecha);
  const opciones = { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' };
  return f.toLocaleDateString('es-ES', opciones) + ' • ' + (hora || '');
};

const esPasada = (fecha) => {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const fechaCita = new Date(fecha);
  fechaCita.setHours(0, 0, 0, 0);
  return fechaCita < hoy;
};

const esHoy = (fecha) => {
  const hoy = new Date();
  const fechaCita = new Date(fecha);
  return fechaCita.toDateString() === hoy.toDateString();
};

/************************************************************************/
onMounted(async () => {
  const datosJSON = await envioElectron('datosarchivo');
  usuarioLocal.value = JSON.parse(window.localStorage.getItem('usuarioLocal'))[0] || {};

  // Crear tabla si no existe
  const camposArray = [
    "id_cliente", "nombre_cliente", "titulo", "descripcion", "fecha", "hora",
    "tipo", "estado", "prioridad", "usuario_agendo", "nombre_usuario",
    "recordatorio", "notas_internas", "resultado", "duracion_minutos", "ubicacion"
  ];
  await crearTablaSiNoExisteOffline('citas_clientes', camposArray.join(','), toast);

  // Cargar datos
  await cargarClientes();
  await cargarCitas();
});
</script>

<template>
  <div class="w-full min-h-screen bg-gray-50 p-4 md:p-6 lg:p-8">
    <Toast />

    <!-- Container Principal - Max Width -->
    <div class="max-w-7xl mx-auto">

      <!-- Header Section -->
      <div class="grid grid-cols-12 gap-4 mb-6">
        <!-- Título - 12 cols en mobile, 8 en desktop -->
        <div class="col-span-12 lg:col-span-8">
          <h1 class="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-800 mb-2 flex items-center">
            <i class="pi pi-calendar mr-3 text-blue-600"></i>
            Citas con Clientes
          </h1>
          <p class="text-gray-600 text-sm md:text-base">Gestiona y organiza todas tus reuniones con clientes</p>
        </div>

        <!-- Botón Nueva Cita - 12 cols en mobile, 4 en desktop -->
        <div class="col-span-12 lg:col-span-4 flex items-center justify-start lg:justify-end">
          <Button
            label="Nueva Cita"
            icon="pi pi-plus"
            size="large"
            @click="abrirDialogoCrear"
            class="w-full lg:w-auto px-6 py-3"
          />
        </div>
      </div>

      <!-- Estadísticas Grid - 12 columnas -->
      <div class="grid grid-cols-12 gap-4 mb-6">
        <!-- Card Total - 6 cols mobile, 3 desktop -->
        <div class="col-span-12 sm:col-span-6 lg:col-span-3">
          <div class="bg-white rounded-lg shadow-lg p-5 hover:shadow-xl transition-shadow">
            <div class="flex justify-between items-start">
              <div>
                <p class="text-gray-500 text-sm font-medium mb-1">Total Citas</p>
                <p class="text-3xl font-bold text-gray-900">{{ estadisticas.total }}</p>
              </div>
              <div class="bg-blue-100 p-3 rounded-lg">
                <i class="pi pi-calendar text-blue-600 text-2xl"></i>
              </div>
            </div>
          </div>
        </div>

        <!-- Card Hoy -->
        <div class="col-span-12 sm:col-span-6 lg:col-span-3">
          <div class="bg-white rounded-lg shadow-lg p-5 hover:shadow-xl transition-shadow">
            <div class="flex justify-between items-start">
              <div>
                <p class="text-gray-500 text-sm font-medium mb-1">Hoy</p>
                <p class="text-3xl font-bold text-gray-900">{{ estadisticas.hoy }}</p>
              </div>
              <div class="bg-cyan-100 p-3 rounded-lg">
                <i class="pi pi-clock text-cyan-600 text-2xl"></i>
              </div>
            </div>
          </div>
        </div>

        <!-- Card Pendientes -->
        <div class="col-span-12 sm:col-span-6 lg:col-span-3">
          <div class="bg-white rounded-lg shadow-lg p-5 hover:shadow-xl transition-shadow">
            <div class="flex justify-between items-start">
              <div>
                <p class="text-gray-500 text-sm font-medium mb-1">Pendientes</p>
                <p class="text-3xl font-bold text-gray-900">{{ estadisticas.pendientes }}</p>
              </div>
              <div class="bg-orange-100 p-3 rounded-lg">
                <i class="pi pi-exclamation-circle text-orange-600 text-2xl"></i>
              </div>
            </div>
          </div>
        </div>

        <!-- Card Completadas -->
        <div class="col-span-12 sm:col-span-6 lg:col-span-3">
          <div class="bg-white rounded-lg shadow-lg p-5 hover:shadow-xl transition-shadow">
            <div class="flex justify-between items-start">
              <div>
                <p class="text-gray-500 text-sm font-medium mb-1">Completadas</p>
                <p class="text-3xl font-bold text-gray-900">{{ estadisticas.completadas }}</p>
              </div>
              <div class="bg-green-100 p-3 rounded-lg">
                <i class="pi pi-check-circle text-green-600 text-2xl"></i>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Filtros Section - Grid 12 cols -->
      <div class="bg-white rounded-lg shadow-lg p-4 md:p-5 mb-6">
        <div class="grid grid-cols-12 gap-4">
          <!-- Búsqueda - 12 cols mobile, 5 desktop -->
          <div class="col-span-12 md:col-span-5">
            <span class="p-input-icon-left w-full">
              <i class="pi pi-search" />
              <InputText
                v-model="searchQuery"
                placeholder="Buscar por título, cliente o descripción..."
                class="w-full"
              />
            </span>
          </div>

          <!-- Filtro Estado - 6 cols mobile, 3 desktop -->
          <div class="col-span-6 md:col-span-3">
            <Dropdown
              v-model="filtroEstado"
              :options="[{ label: 'Todos los estados', value: 'todas' }, ...estadosCita]"
              optionLabel="label"
              optionValue="value"
              placeholder="Estado"
              class="w-full"
            />
          </div>

          <!-- Filtro Fecha - 6 cols mobile, 4 desktop -->
          <div class="col-span-6 md:col-span-4">
            <Dropdown
              v-model="filtroFecha"
              :options="[
                { label: 'Todas las fechas', value: 'todas' },
                { label: 'Hoy', value: 'hoy' },
                { label: 'Esta semana', value: 'semana' },
                { label: 'Este mes', value: 'mes' }
              ]"
              optionLabel="label"
              optionValue="value"
              placeholder="Fecha"
              class="w-full"
            />
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div v-if="citasFiltradas.length === 0" class="bg-white rounded-lg shadow-lg p-8 text-center">
        <i class="pi pi-calendar text-gray-300" style="font-size: 5rem"></i>
        <p class="text-2xl font-semibold text-gray-700 mt-4 mb-2">No hay citas</p>
        <p class="text-gray-500 text-lg">
          {{ searchQuery || filtroEstado !== 'todas' || filtroFecha !== 'todas'
            ? 'No se encontraron citas con los filtros aplicados'
            : 'Comienza creando tu primera cita' }}
        </p>
      </div>

      <!-- Citas Grid - 12 columnas -->
      <div v-else class="grid grid-cols-12 gap-4 md:gap-5 lg:gap-6">
        <div
          v-for="cita in citasFiltradas"
          :key="cita.id"
          class="col-span-12 lg:col-span-6 xl:col-span-6"
        >
          <div class="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 h-full flex flex-col">

            <!-- Header de la Card -->
            <div
              class="p-4 md:p-5 border-b"
              :class="{
                'bg-gradient-to-r from-orange-50 to-orange-100': cita.estado === 'pendiente',
                'bg-gradient-to-r from-blue-50 to-blue-100': cita.estado === 'confirmada',
                'bg-gradient-to-r from-green-50 to-green-100': cita.estado === 'completada',
                'bg-gradient-to-r from-red-50 to-red-100': cita.estado === 'cancelada',
                'bg-gradient-to-r from-gray-50 to-gray-100': cita.estado === 'reagendada'
              }"
            >
              <div class="flex justify-between items-start gap-3">
                <div class="flex-1 min-w-0">
                  <h3 class="text-xl md:text-2xl font-bold text-gray-900 mb-3 truncate">
                    {{ cita.titulo }}
                  </h3>
                  <div class="flex flex-wrap gap-2">
                    <Tag
                      :value="cita.estado"
                      :severity="getSeverity('estado', cita.estado)"
                      :icon="`pi ${getIcon('estado', cita.estado)}`"
                    />
                    <Tag
                      :value="cita.prioridad"
                      :severity="getSeverity('prioridad', cita.prioridad)"
                      :icon="`pi ${getIcon('prioridad', cita.prioridad)}`"
                    />
                    <Tag
                      v-if="esHoy(cita.fecha)"
                      value="HOY"
                      severity="info"
                      icon="pi pi-calendar-plus"
                    />
                    <Tag
                      v-if="esPasada(cita.fecha) && cita.estado !== 'completada'"
                      value="Pasada"
                      severity="danger"
                      icon="pi pi-exclamation-triangle"
                    />
                  </div>
                </div>
                <div class="flex gap-2">
                  <Button
                    icon="pi pi-pencil"
                    rounded
                    text
                    severity="info"
                    @click="abrirDialogoEditar(cita)"
                    v-tooltip.top="'Editar'"
                  />
                  <Button
                    icon="pi pi-trash"
                    rounded
                    text
                    severity="danger"
                    @click="eliminarCita(cita.id)"
                    v-tooltip.top="'Eliminar'"
                  />
                </div>
              </div>
            </div>

            <!-- Body de la Card -->
            <div class="p-4 md:p-5 flex-1">
              <!-- Info Grid - 12 columnas internas -->
              <div class="grid grid-cols-12 gap-4 mb-4">
                <!-- Cliente - 12 cols mobile, 6 desktop -->
                <div class="col-span-12 sm:col-span-6">
                  <div class="flex items-start gap-3">
                    <div class="bg-gray-100 p-2 rounded-lg">
                      <i class="pi pi-user text-gray-700"></i>
                    </div>
                    <div class="flex-1 min-w-0">
                      <p class="text-xs text-gray-500 mb-1">Cliente</p>
                      <p class="text-sm font-semibold text-gray-900 truncate">{{ cita.nombre_cliente }}</p>
                    </div>
                  </div>
                </div>

                <!-- Fecha - 12 cols mobile, 6 desktop -->
                <div class="col-span-12 sm:col-span-6">
                  <div class="flex items-start gap-3">
                    <div class="bg-gray-100 p-2 rounded-lg">
                      <i class="pi pi-calendar text-gray-700"></i>
                    </div>
                    <div class="flex-1 min-w-0">
                      <p class="text-xs text-gray-500 mb-1">Fecha y hora</p>
                      <p class="text-sm font-semibold text-gray-900">{{ formatearFechaHora(cita.fecha, cita.hora) }}</p>
                    </div>
                  </div>
                </div>

                <!-- Tipo - 12 cols mobile, 6 desktop -->
                <div class="col-span-12 sm:col-span-6">
                  <div class="flex items-start gap-3">
                    <div class="bg-gray-100 p-2 rounded-lg">
                      <i :class="`pi ${getIcon('tipo', cita.tipo)} text-gray-700`"></i>
                    </div>
                    <div class="flex-1 min-w-0">
                      <p class="text-xs text-gray-500 mb-1">Tipo</p>
                      <p class="text-sm font-semibold text-gray-900">
                        {{ tiposCita.find(t => t.value === cita.tipo)?.label || cita.tipo }}
                      </p>
                    </div>
                  </div>
                </div>

                <!-- Duración - 12 cols mobile, 6 desktop -->
                <div class="col-span-12 sm:col-span-6">
                  <div class="flex items-start gap-3">
                    <div class="bg-gray-100 p-2 rounded-lg">
                      <i class="pi pi-clock text-gray-700"></i>
                    </div>
                    <div class="flex-1 min-w-0">
                      <p class="text-xs text-gray-500 mb-1">Duración</p>
                      <p class="text-sm font-semibold text-gray-900">{{ cita.duracion_minutos }} min</p>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Ubicación -->
              <div v-if="cita.ubicacion" class="mb-4 p-3 bg-gray-50 rounded-lg">
                <div class="flex items-center gap-2">
                  <i class="pi pi-map-marker text-gray-600"></i>
                  <span class="text-sm text-gray-700">{{ cita.ubicacion }}</span>
                </div>
              </div>

              <!-- Descripción -->
              <div v-if="cita.descripcion" class="mb-4">
                <Divider />
                <p class="text-sm text-gray-700 leading-relaxed line-clamp-3">{{ cita.descripcion }}</p>
              </div>

              <Divider />

              <!-- Footer con acciones -->
              <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mt-4">
                <div class="text-xs text-gray-500 flex items-center gap-2">
                  <i class="pi pi-user-edit"></i>
                  <span>{{ cita.nombre_usuario }}</span>
                </div>
                <div class="flex gap-2 w-full sm:w-auto">
                  <Button
                    v-if="cita.estado === 'pendiente'"
                    label="Confirmar"
                    icon="pi pi-check"
                    size="small"
                    severity="info"
                    @click="cambiarEstado(cita, 'confirmada')"
                    class="flex-1 sm:flex-none"
                  />
                  <Button
                    v-if="cita.estado === 'confirmada'"
                    label="Completar"
                    icon="pi pi-check-circle"
                    size="small"
                    severity="success"
                    @click="cambiarEstado(cita, 'completada')"
                    class="flex-1 sm:flex-none"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>

    <!-- Dialog Crear/Editar -->
    <Dialog
      v-model:visible="visible"
      modal
      :header="citaSeleccionada ? 'Editar Cita' : 'Nueva Cita'"
      :style="{ width: '800px' }"
      :breakpoints="{ '1024px': '90vw', '768px': '95vw' }"
    >
      <div class="grid p-fluid">
        <div class="col-12">
          <label class="block font-semibold mb-2 text-900">
            Cliente <span class="text-red-500">*</span>
          </label>
          <Dropdown
            v-model="formData.id_cliente"
            :options="clientes"
            optionLabel="nombre"
            optionValue="id"
            placeholder="Selecciona un cliente"
            filter
            showClear
            :disabled="!!citaSeleccionada"
            @change="seleccionarCliente(clientes.find(c => c.id === formData.id_cliente))"
            class="w-full"
          />
        </div>

        <div class="col-12">
          <label class="block font-semibold mb-2 text-900">
            Título de la cita <span class="text-red-500">*</span>
          </label>
          <InputText
            v-model="formData.titulo"
            placeholder="Ej: Reunión de seguimiento"
            class="w-full"
          />
        </div>

        <div class="col-12 md:col-6">
          <label class="block font-semibold mb-2 text-900">
            Fecha <span class="text-red-500">*</span>
          </label>
          <Calendar
            v-model="formData.fecha"
            dateFormat="dd/mm/yy"
            showIcon
            :minDate="new Date()"
            class="w-full"
          />
        </div>

        <div class="col-12 md:col-6">
          <label class="block font-semibold mb-2 text-900">
            Hora <span class="text-red-500">*</span>
          </label>
          <InputMask
            v-model="formData.hora"
            mask="99:99"
            placeholder="HH:MM"
            class="w-full"
          />
        </div>

        <div class="col-12 md:col-6">
          <label class="block font-semibold mb-2 text-900">Tipo de cita</label>
          <Dropdown
            v-model="formData.tipo"
            :options="tiposCita"
            optionLabel="label"
            optionValue="value"
            placeholder="Selecciona el tipo"
            class="w-full"
          >
            <template #value="slotProps">
              <div v-if="slotProps.value" class="flex align-items-center">
                <i :class="`pi ${getIcon('tipo', slotProps.value)} mr-2`"></i>
                <span>{{ tiposCita.find(t => t.value === slotProps.value)?.label }}</span>
              </div>
              <span v-else>{{ slotProps.placeholder }}</span>
            </template>
            <template #option="slotProps">
              <div class="flex align-items-center">
                <i :class="`pi ${slotProps.option.icon} mr-2`"></i>
                <span>{{ slotProps.option.label }}</span>
              </div>
            </template>
          </Dropdown>
        </div>

        <div class="col-12 md:col-6">
          <label class="block font-semibold mb-2 text-900">Prioridad</label>
          <Dropdown
            v-model="formData.prioridad"
            :options="prioridades"
            optionLabel="label"
            optionValue="value"
            placeholder="Selecciona la prioridad"
            class="w-full"
          >
            <template #value="slotProps">
              <div v-if="slotProps.value" class="flex align-items-center">
                <i :class="`pi ${getIcon('prioridad', slotProps.value)} mr-2`"></i>
                <span>{{ prioridades.find(p => p.value === slotProps.value)?.label }}</span>
              </div>
              <span v-else>{{ slotProps.placeholder }}</span>
            </template>
            <template #option="slotProps">
              <div class="flex align-items-center">
                <Tag :value="slotProps.option.label" :severity="slotProps.option.severity" :icon="`pi ${slotProps.option.icon}`" />
              </div>
            </template>
          </Dropdown>
        </div>

        <div class="col-12 md:col-6" v-if="citaSeleccionada">
          <label class="block font-semibold mb-2 text-900">Estado</label>
          <Dropdown
            v-model="formData.estado"
            :options="estadosCita"
            optionLabel="label"
            optionValue="value"
            placeholder="Estado de la cita"
            class="w-full"
          >
            <template #value="slotProps">
              <div v-if="slotProps.value">
                <Tag :value="slotProps.value" :severity="getSeverity('estado', slotProps.value)" />
              </div>
            </template>
            <template #option="slotProps">
              <Tag :value="slotProps.option.label" :severity="slotProps.option.severity" :icon="`pi ${slotProps.option.icon}`" />
            </template>
          </Dropdown>
        </div>

        <div class="col-12 md:col-6">
          <label class="block font-semibold mb-2 text-900">Duración (minutos)</label>
          <InputNumber
            v-model="formData.duracion_minutos"
            :min="15"
            :step="15"
            placeholder="60"
            class="w-full"
          />
        </div>

        <div class="col-12 md:col-6">
          <label class="block font-semibold mb-2 text-900">Recordatorio</label>
          <Dropdown
            v-model="formData.recordatorio"
            :options="recordatorios"
            optionLabel="label"
            optionValue="value"
            placeholder="Sin recordatorio"
            class="w-full"
          />
        </div>

        <div class="col-12">
          <label class="block font-semibold mb-2 text-900">Ubicación</label>
          <InputText
            v-model="formData.ubicacion"
            placeholder="Oficina, dirección, link de videollamada..."
            class="w-full"
          />
        </div>

        <div class="col-12">
          <label class="block font-semibold mb-2 text-900">Descripción</label>
          <Textarea
            v-model="formData.descripcion"
            rows="3"
            placeholder="Detalles de la cita..."
            class="w-full"
          />
        </div>

        <div class="col-12">
          <label class="block font-semibold mb-2 text-900">Notas internas</label>
          <Textarea
            v-model="formData.notas_internas"
            rows="2"
            placeholder="Notas privadas (no visibles para el cliente)..."
            class="w-full"
          />
        </div>

        <div class="col-12" v-if="citaSeleccionada && formData.estado === 'completada'">
          <label class="block font-semibold mb-2 text-900">Resultado</label>
          <Textarea
            v-model="formData.resultado"
            rows="3"
            placeholder="¿Qué se logró en esta cita?..."
            class="w-full"
          />
        </div>
      </div>

      <template #footer>
        <Button
          label="Cancelar"
          icon="pi pi-times"
          text
          @click="visible = false"
        />
        <Button
          :label="citaSeleccionada ? 'Actualizar' : 'Crear Cita'"
          icon="pi pi-check"
          @click="guardarCita"
        />
      </template>
    </Dialog>
  </div>
</template>

<style scoped>
/* Transiciones suaves */
.transition-all {
  transition: all 0.3s ease;
}

.transition-shadow {
  transition: box-shadow 0.3s ease;
}

/* Hover effects */
.hover\:shadow-xl:hover {
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
}

.hover\:shadow-2xl:hover {
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
}

/* Line clamp for description */
.line-clamp-3 {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* Gradientes personalizados */
.bg-gradient-to-r {
  background-image: linear-gradient(to right, var(--tw-gradient-stops));
}

/* Responsive utilities */
@media (max-width: 768px) {
  .grid {
    gap: 1rem;
  }
}

@media (min-width: 1024px) {
  .max-w-7xl {
    max-width: 80rem;
  }
}
</style>
