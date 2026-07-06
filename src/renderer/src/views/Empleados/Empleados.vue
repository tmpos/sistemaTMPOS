
<script setup>
import { ref, onMounted, nextTick, watchEffect,computed } from 'vue';
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
buscadorArrayObjeto,
generarCodigoUnico } from '@/funciones/funciones.js';
import Swal from 'sweetalert2'
import { useToast } from "primevue/usetoast";
import Tag from 'primevue/tag';
import IconField from 'primevue/iconfield';
import InputIcon from 'primevue/inputicon';
import Dialog from 'primevue/dialog';
const toast = useToast();
import { useRouter, useRoute } from 'vue-router';
const router = useRouter();
/************************************************************************/

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
const camposArray = ['codigo_empleado', 'cedula', 'nombre', 'sexo', 'fecha_nacimiento','edad', 'telefono', 'email', 'direccion', 'cargo', 'departamento', 'fecha_ingreso', 'tipo_contrato', 'estado', 'turno', 'supervisor', 'banco', 'no_cuenta', 'sueldo_base', 'comision_porcentaje', 'retencion_afp', 'retencion_sfs', 'retencion_isr', 'bono_fijo', 'otros_descuentos', 'tipo_pago', 'monto_prestamos', 'monto_horas_extras', 'fecha_creacion', 'fecha_actualizacion', 'notas'];
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
const datosJSON = ref([]);
/************************************************************************/
const selectedItems = ref([]);
/************************************************************************/
const nominaDialogVisible = ref(false);
const nominaForm = ref({ fecha_inicio: nfecha('fecha'), fecha_final: '' });
/************************************************************************/
const position = ref('top');
const openPosition = (pos) => {
    position.value = pos;
    visible.value = true;
}
/************************************************************************/
const datoscamposEmpleados = ref({})
/************************************************************************/
const visible = ref(false);
const visiblecrear = ref(false);
const value = ref(null);
const id = ref(null);
const datoscampos = ref({});
const data = ref([]);
const searchQuery = ref('');
const EmpleadosEditar = ref(null);
/************************************************************************/
async function limpiarCamposCrear() {
datoscamposEmpleados.value = {}
await campos();
}
/************************************************************************/
watchEffect(() => {
  if (visiblecrear.value) {
  }
});
/************************************************************************/
const fetchAndSetupData = async () => {
const response = await peticionesFetchOffline('getDataAsArray', 'empleados');
    const jsonData = response.reverse();
    data.value = jsonData;
};
/************************************************************************/
async function campos() {
  const campos = await arrayToObjetoFromTabla('empleados');
  datoscamposEmpleados.value = campos;
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

   await crearTablaSiNoExisteOffline('empleados',camposArray.join(','),toast)
        
//usuarioLocal.value = JSON.parse(window.localStorage.getItem('usuarioLocal'))[0] || {};
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
                    const envioDatos = await peticionesFetchOffline('deleteAll', 'empleados');
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
                            const envioDatos = await peticionesFetchOffline('deleteEntry','empleados', id);
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
const crearNominaSeleccionados = () => {
  if (selectedItems.value.length === 0) {
    toast.add({ severity: 'error', summary: 'Error', detail: 'Seleccione al menos un empleado.', life: 3000 });
    return;
  }
  nominaForm.value = { fecha_inicio: nfecha('fecha'), fecha_final: '' };
  nominaDialogVisible.value = true;
};

const confirmarCrearNomina = async () => {
  if (!nominaForm.value.fecha_inicio || !nominaForm.value.fecha_final) {
    toast.add({ severity: 'error', summary: 'Error', detail: 'Ambas fechas son requeridas.', life: 3000 });
    return;
  }

  nominaDialogVisible.value = false;
  const noNomina = generarCodigoUnico();
  const almacen = datosEmpresa.empresa?.nombre || '';
  let exitoTotal = true;
  let errores = [];

  for (const empleado of selectedItems.value) {
    const sueldo = parseFloat(empleado.sueldo_base || 0);
    const afp = parseFloat(empleado.retencion_afp || (sueldo * 0.0287).toFixed(2));
    const sfs = parseFloat(empleado.retencion_sfs || (sueldo * 0.0304).toFixed(2));
    const isr = parseFloat(empleado.retencion_isr || 0);
    const prestamos = parseFloat(empleado.monto_prestamos || 0);
    const horasExtras = parseFloat(empleado.monto_horas_extras || 0);
    const bono = parseFloat(empleado.bono_fijo || 0);
    const otrosDesc = parseFloat(empleado.otros_descuentos || 0);

    const totalIngresos = horasExtras + bono;
    const totalDeducciones = sfs + afp + isr + prestamos + otrosDesc;
    const totalNetoLinea = totalIngresos - totalDeducciones;

    const nominaLinea = [{
      comision: 0,
      hora_extra: horasExtras,
      ingreso_sdss: bono,
      sf_salud: sfs,
      svejez_discap: afp,
      desc_percapita: otrosDesc,
      base_isr: isr,
      imp_sobre_renta: isr,
      prestamos: prestamos,
      total_ingresos: totalIngresos.toFixed(2),
      total_deducciones: totalDeducciones.toFixed(2),
      total_neto: totalNetoLinea.toFixed(2)
    }];

    const totalDeduccionesGeneral = nominaLinea.reduce((sum, n) => sum + parseFloat(n.total_deducciones || 0), 0);
    const totalNetoPagar = sueldo + nominaLinea.reduce((sum, n) => sum + parseFloat(n.total_ingresos || 0), 0) - totalDeduccionesGeneral;

    const nominaData = {
      no_nomina: noNomina,
      fecha_inicio: nominaForm.value.fecha_inicio,
      fecha_final: nominaForm.value.fecha_final,
      estado: 'ACTIVA',
      cedula: empleado.cedula || '',
      nombre: empleado.nombre || '',
      cargo: empleado.cargo || '',
      sueldo: sueldo.toFixed(2),
      total_deducciones: totalDeduccionesGeneral.toFixed(2),
      total_neto_pagar: totalNetoPagar.toFixed(2),
      nomina: JSON.stringify(nominaLinea),
      almacen: almacen
    };

    try {
      const envioDatos = await peticionesFetchOffline('insertData', 'nomina', JSON.stringify(nominaData));
      if (envioDatos[0] !== 'ok') {
        exitoTotal = false;
        errores.push(empleado.nombre || empleado.id);
      }
    } catch (error) {
      exitoTotal = false;
      errores.push(empleado.nombre || empleado.id);
    }
  }

  if (exitoTotal) {
    Swal.fire({
      title: 'Nómina creada',
      html: `Se cre&oacute; la n&oacute;mina <strong>No. ${noNomina}</strong> para <strong>${selectedItems.value.length} empleado(s)</strong>.`,
      icon: 'success',
      confirmButtonText: 'Ir a Nóminas',
      showCancelButton: true,
      cancelButtonText: 'Cerrar'
    }).then((result) => {
      if (result.isConfirmed) {
        router.push('/nomina');
      }
    });
  } else {
    toast.add({ severity: 'error', summary: 'Error', detail: `Fallo al crear nómina para: ${errores.join(', ')}`, life: 5000 });
  }
};
/************************************************************************/
const itemsEmpleados = ref([]);
const menu = ref(null);
const currentRowData = ref(null);
const toggleEmpleados = (event, rowData) => {
currentRowData.value = rowData;
itemsEmpleados.value = [
{ label: 'Editar', icon: 'pi pi-pencil', command: () => { 
router.push({ path: `/editarempleados/${currentRowData.value.id}` });
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
                        const datosFactura = await peticionesFetchOffline('deleteEntry','empleados', rowData.id);
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
const filteredEmpleados = computed(() => {
if (!searchQuery.value) return data.value;
return data.value.filter(busqueda => {
  return Object.values(busqueda).some(value =>
    String(value).toLowerCase().includes(searchQuery.value.toLowerCase())
   );
  });
});
/************************************************************************/
// Estadísticas computadas
const empleadosActivos = computed(() => {
  return data.value.filter(emp => emp.estado === 'ACTIVO' || emp.estado === 'Activo').length;
});

const empleadosInactivos = computed(() => {
  return data.value.filter(emp => emp.estado === 'INACTIVO' || emp.estado === 'Inactivo').length;
});

const empleadosPorDepartamento = computed(() => {
  const departamentos = {};
  data.value.forEach(emp => {
    const dept = emp.departamento || 'Sin Departamento';
    departamentos[dept] = (departamentos[dept] || 0) + 1;
  });
  return departamentos;
});

const departamentoMasEmpleados = computed(() => {
  const depts = empleadosPorDepartamento.value;
  if (Object.keys(depts).length === 0) return 'N/A';
  return Object.keys(depts).reduce((a, b) => depts[a] > depts[b] ? a : b);
});

const sueldoPromedio = computed(() => {
  if (data.value.length === 0) return 0;
  const suma = data.value.reduce((acc, emp) => acc + parseFloat(emp.sueldo_base || 0), 0);
  return (suma / data.value.length).toFixed(2);
});
/************************************************************************/
// Helper para estado del empleado
const getEstadoSeverity = (estado) => {
  const estadoUpper = (estado || '').toUpperCase();
  if (estadoUpper === 'ACTIVO') return 'success';
  if (estadoUpper === 'INACTIVO') return 'danger';
  if (estadoUpper === 'VACACIONES') return 'warning';
  if (estadoUpper === 'LICENCIA') return 'info';
  return 'secondary';
};

// Helper para formatear moneda
const formatearMoneda = (valor) => {
  const num = parseFloat(valor || 0);
  return `RD$${num.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
};

// Helper para formatear fecha
const formatearFechaTabla = (timestamp) => {
  if (!timestamp) return 'N/A';
  try {
    const fecha = new Date(timestamp);
    return fecha.toLocaleDateString('es-DO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  } catch (error) {
    return timestamp;
  }
};

// Funciones para editar y eliminar
const editarEmpleado = (rowData) => {
  router.push({ path: `/editarempleados/${rowData.id}` });
};

const eliminarEmpleado = async (rowData) => {
  const result = await Swal.fire({
    title: 'Introduce la contraseña',
    input: 'password',
    inputPlaceholder: 'Contraseña',
    showCancelButton: true,
    confirmButtonText: 'Eliminar',
    cancelButtonText: 'Cancelar',
    confirmButtonColor: '#ef4444'
  });

  if (result.isConfirmed) {
    const contrasenaIngresada = result.value;
    if (contrasenaIngresada === token.value || contrasenaIngresada === tokenCorto.value) {
      const datosFactura = await peticionesFetchOffline('deleteEntry', 'empleados', rowData.id);
      if (datosFactura[0] == 'ok') {
        toast.add({ severity: 'success', summary: 'Éxito', detail: 'Empleado eliminado correctamente', life: 3000 });
        await fetchAndSetupData();
      } else {
        toast.add({ severity: 'error', summary: 'Error', detail: 'Error al eliminar el empleado', life: 3000 });
      }
    } else {
      toast.add({ severity: 'error', summary: 'Error', detail: 'Contraseña incorrecta', life: 3000 });
    }
  }
};
/************************************************************************/
const fnAwesomplete = ()=>{
}
const handleSelectComplete = async(selected)=>{
}
/************************************************************************/
const onRowSelect = (event) => {
 router.push({ path: `/editarempleados/${event.data.id}` });

};
/************************************************************************/
</script>
<template>
<main class="content-wrapper">
  <div class="mt-5 px-4">

    <!-- Header con título y estadísticas -->
    <div class="mb-6">
      <div class="flex items-center justify-between mb-4">
        <div>
          <h1 class="text-3xl font-bold text-gray-800 flex items-center gap-3">
            <i class="pi pi-users text-teal-600"></i>
            Gestión de Empleados
          </h1>
          <p class="text-gray-500 mt-1">Administra el personal de la empresa</p>
        </div>
        <div class="flex gap-2">
          <Button
            icon="pi pi-refresh"
            severity="secondary"
            outlined
            @click="fetchAndSetupData"
            v-tooltip.bottom="'Actualizar datos'"
            class="hover:scale-105 transition-transform"
          />
          <Button
            icon="pi pi-user-plus"
            label="Nuevo Empleado"
            severity="success"
            @click="router.push('/crearempleados')"
            class="hover:scale-105 transition-transform"
          />
        </div>
      </div>

      <!-- Tarjetas de estadísticas -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <!-- Total Empleados -->
        <div class="bg-gradient-to-br from-teal-500 to-teal-600 rounded-xl shadow-lg p-6 text-white transform hover:scale-105 transition-all cursor-pointer">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-teal-100 text-sm font-medium uppercase tracking-wide">Total Empleados</p>
              <p class="text-4xl font-bold mt-2">{{ data.length }}</p>
            </div>
            <div class="bg-teal-700 bg-opacity-50 backdrop-blur-sm rounded-full p-4 flex items-center justify-center">
              <i class="pi pi-users text-3xl text-white"></i>
            </div>
          </div>
        </div>

        <!-- Empleados Activos -->
        <div class="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg p-6 text-white transform hover:scale-105 transition-all cursor-pointer">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-green-100 text-sm font-medium uppercase tracking-wide">Activos</p>
              <p class="text-4xl font-bold mt-2">{{ empleadosActivos }}</p>
            </div>
            <div class="bg-green-700 bg-opacity-50 backdrop-blur-sm rounded-full p-4 flex items-center justify-center">
              <i class="pi pi-check-circle text-3xl text-white"></i>
            </div>
          </div>
        </div>

        <!-- Departamento Principal -->
        <div class="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white transform hover:scale-105 transition-all cursor-pointer">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-blue-100 text-sm font-medium uppercase tracking-wide">Dept. Principal</p>
              <p class="text-2xl font-bold mt-2 truncate max-w-[150px]">{{ departamentoMasEmpleados }}</p>
              <p class="text-blue-100 text-xs mt-1">{{ empleadosPorDepartamento[departamentoMasEmpleados] || 0 }} empleados</p>
            </div>
            <div class="bg-blue-700 bg-opacity-50 backdrop-blur-sm rounded-full p-4 flex items-center justify-center">
              <i class="pi pi-sitemap text-3xl text-white"></i>
            </div>
          </div>
        </div>

        <!-- Sueldo Promedio -->
        <div class="bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl shadow-lg p-6 text-white transform hover:scale-105 transition-all cursor-pointer">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-amber-100 text-sm font-medium uppercase tracking-wide">Sueldo Promedio</p>
              <p class="text-3xl font-bold mt-2">{{ formatearMoneda(sueldoPromedio) }}</p>
            </div>
            <div class="bg-amber-700 bg-opacity-50 backdrop-blur-sm rounded-full p-4 flex items-center justify-center">
              <i class="pi pi-dollar text-3xl text-white"></i>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Sección principal con tabla -->
    <Card class="shadow-xl border-0">
      <template #content>

        <!-- Toolbar con búsqueda y acciones -->
        <div class="flex flex-col md:flex-row justify-between items-center gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
          <div class="flex-1 w-full md:w-auto">
            <IconField iconPosition="left" class="w-full">
              <InputIcon class="pi pi-search" />
              <InputText
                v-model="searchQuery"
                placeholder="Buscar por nombre, cédula, cargo, departamento..."
                class="w-full md:w-96"
              />
            </IconField>
          </div>

          <div class="flex gap-2">
            <Button
              icon="pi pi-file"
              label="Crear Nómina"
              severity="info"
              outlined
              @click="crearNominaSeleccionados"
              :disabled="selectedItems.length === 0"
              v-tooltip.bottom="'Crear nómina con empleados seleccionados'"
            />
            <Button
              icon="pi pi-trash"
              label="Eliminar Selección"
              severity="danger"
              outlined
              @click="borrarSeleccionados"
              :disabled="selectedItems.length === 0"
              v-tooltip.bottom="'Eliminar empleados seleccionados'"
            />
            <Button
              v-if="datosEmpresa.usuario.nivel_seguridad == 'Soporte'"
              label="Borrar Todo"
              icon="pi pi-exclamation-triangle"
              severity="danger"
              @click="borrarTodo"
            />
          </div>
        </div>

        <!-- Tabla de datos -->
        <DataTable
          :value="filteredEmpleados"
          v-model:selection="selectedItems"
          dataKey="id"
          paginator
          :rows="10"
          :rowsPerPageOptions="[5, 10, 20, 50]"
          scrollable
          scrollHeight="500px"
          class="modern-datatable"
          stripedRows
          :globalFilterFields="['nombre', 'cedula', 'cargo', 'departamento', 'codigo_empleado']"
          responsiveLayout="scroll"
        >
          <template #empty>
            <div class="text-center py-12">
              <i class="pi pi-inbox text-6xl text-gray-300 mb-4"></i>
              <p class="text-gray-500 text-lg">No se encontraron empleados</p>
              <Button
                label="Crear primer empleado"
                icon="pi pi-plus"
                class="mt-4"
                @click="router.push('/crearempleados')"
              />
            </div>
          </template>

          <Column selectionMode="multiple" headerStyle="width: 3rem" class="bg-gray-50"></Column>

          <Column field="nombre" header="Empleado" sortable frozen class="font-semibold" style="min-width: 250px">
            <template #body="slotProps">
              <div class="flex items-center gap-3">
                <div class="bg-teal-100 text-teal-600 rounded-full w-10 h-10 flex items-center justify-center font-bold">
                  {{ slotProps.data.nombre?.charAt(0) || 'E' }}
                </div>
                <div>
                  <p class="font-semibold text-gray-800">{{ slotProps.data.nombre || 'Sin nombre' }}</p>
                  <p class="text-xs text-gray-500">{{ slotProps.data.codigo_empleado || 'Sin código' }}</p>
                </div>
              </div>
            </template>
          </Column>

          <Column field="cedula" header="Cédula" sortable style="min-width: 130px">
            <template #body="slotProps">
              <span class="text-gray-700 font-mono">{{ slotProps.data.cedula || 'N/A' }}</span>
            </template>
          </Column>

          <Column field="cargo" header="Cargo" sortable style="min-width: 180px">
            <template #body="slotProps">
              <div class="flex items-center gap-2">
                <i class="pi pi-briefcase text-indigo-500"></i>
                <span class="text-gray-700">{{ slotProps.data.cargo || 'Sin cargo' }}</span>
              </div>
            </template>
          </Column>

          <Column field="departamento" header="Departamento" sortable style="min-width: 150px">
            <template #body="slotProps">
              <Tag
                :value="slotProps.data.departamento || 'Sin Dept.'"
                severity="info"
                class="font-semibold"
              />
            </template>
          </Column>

          <Column field="estado" header="Estado" sortable style="min-width: 120px">
            <template #body="slotProps">
              <Tag
                :value="slotProps.data.estado || 'N/A'"
                :severity="getEstadoSeverity(slotProps.data.estado)"
                class="font-bold"
              />
            </template>
          </Column>

          <Column field="sueldo_base" header="Sueldo Base" sortable style="min-width: 140px">
            <template #body="slotProps">
              <span class="font-semibold text-green-600">
                {{ formatearMoneda(slotProps.data.sueldo_base) }}
              </span>
            </template>
          </Column>

          <Column field="telefono" header="Teléfono" style="min-width: 130px">
            <template #body="slotProps">
              <div class="flex items-center gap-2 text-gray-600">
                <i class="pi pi-phone text-sm"></i>
                <span>{{ slotProps.data.telefono || 'N/A' }}</span>
              </div>
            </template>
          </Column>

          <Column header="Acciones" :exportable="false" frozen alignFrozen="right" style="min-width: 150px">
            <template #body="slotProps">
              <div class="flex gap-2">
                <Button
                  icon="pi pi-eye"
                  severity="info"
                  outlined
                  rounded
                  @click="editarEmpleado(slotProps.data)"
                  v-tooltip.bottom="'Ver detalles'"
                  class="hover:scale-110 transition-transform"
                />
                <Button
                  icon="pi pi-trash"
                  severity="danger"
                  outlined
                  rounded
                  @click="eliminarEmpleado(slotProps.data)"
                  v-tooltip.bottom="'Eliminar'"
                  class="hover:scale-110 transition-transform"
                />
              </div>
            </template>
          </Column>
        </DataTable>
      </template>
    </Card>

<!-- ////////////////////////////////////////////////////////////////////////////////////////// -->
<Toast />
  </div>
</main>

<!-- Dialog para crear nómina -->
<Dialog v-model:visible="nominaDialogVisible" modal :closable="true" :style="{ width: '500px' }" :breakpoints="{ '640px': '95vw' }">
  <template #header>
    <div class="flex items-center gap-3">
      <div class="w-12 h-12 rounded-full bg-teal-100 flex items-center justify-center">
        <i class="pi pi-file text-teal-600 text-2xl"></i>
      </div>
      <div>
        <h2 class="text-xl font-bold text-gray-800">Crear Nómina</h2>
        <p class="text-sm text-gray-500">{{ selectedItems.length }} empleado(s) seleccionado(s)</p>
      </div>
    </div>
  </template>

  <div class="space-y-4 p-2">
    <p class="text-gray-600">Todos los empleados seleccionados se agrupar&aacute;n bajo el mismo n&uacute;mero de n&oacute;mina.</p>

    <div>
      <label class="block text-sm font-medium text-gray-700 mb-1">Fecha Inicio</label>
      <flat-pickr v-model="nominaForm.fecha_inicio" class="form-input w-full p-inputtext p-component p-filled p-inputtext-fluid" :config="basic" />
    </div>

    <div>
      <label class="block text-sm font-medium text-gray-700 mb-1">Fecha Final</label>
      <flat-pickr v-model="nominaForm.fecha_final" class="form-input w-full p-inputtext p-component p-filled p-inputtext-fluid" :config="basic" />
    </div>
  </div>

  <template #footer>
    <div class="flex gap-2 justify-end">
      <Button label="Cancelar" severity="secondary" outlined @click="nominaDialogVisible = false" />
      <Button label="Crear Nómina" icon="pi pi-check" @click="confirmarCrearNomina" />
    </div>
  </template>
</Dialog>

</template>
<style scoped>
/* Transiciones y animaciones suaves */
.modern-datatable {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
}

/* Hover effects para las filas - Versión sutil */
:deep(.p-datatable-tbody > tr:hover) {
  background-color: #f1f5f9 !important;
  transition: background-color 0.15s ease;
}

/* Estilos para los botones de acción */
:deep(.p-button) {
  transition: all 0.3s ease;
}

:deep(.p-button:hover) {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

/* Estilo para las tarjetas de estadísticas */
.bg-gradient-to-br {
  position: relative;
  overflow: hidden;
}

.bg-gradient-to-br::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 100%);
  pointer-events: none;
}

/* Animación de entrada para las cards */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.bg-gradient-to-br {
  animation: fadeInUp 0.6s ease-out;
}

/* Mejorar la barra de búsqueda */
:deep(.p-iconfield) {
  width: 100%;
}

/* Estilos para inputs */
:deep(.p-inputtext) {
  border: 2px solid #e5e7eb;
  transition: all 0.3s ease;
}

:deep(.p-inputtext:hover) {
  border-color: #cbd5e1;
}

:deep(.p-inputtext:focus) {
  border-color: #14b8a6;
  box-shadow: 0 0 0 3px rgba(20, 184, 166, 0.1);
}

/* Estilos para tags con animación */
:deep(.p-tag) {
  transition: all 0.3s ease;
  font-weight: 600;
}

:deep(.p-tag:hover) {
  transform: scale(1.05);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

/* Mejorar el header de la tabla */
:deep(.p-datatable-thead > tr > th) {
  background: linear-gradient(135deg, #0d9488 0%, #14b8a6 100%) !important;
  color: white !important;
  font-weight: 600;
  text-transform: uppercase;
  font-size: 0.85rem;
  letter-spacing: 0.5px;
  border: none !important;
  padding: 1rem !important;
}

/* Estilos para filas alternas */
:deep(.p-datatable-tbody > tr:nth-child(even)) {
  background-color: #f9fafb;
}

/* Mejorar el paginador */
:deep(.p-paginator) {
  background: #f8fafc;
  border-top: 2px solid #e5e7eb;
  padding: 1rem;
}

/* Scroll suave */
:deep(.p-datatable-scrollable-body) {
  scrollbar-width: thin;
  scrollbar-color: #cbd5e1 #f1f5f9;
}

:deep(.p-datatable-scrollable-body::-webkit-scrollbar) {
  width: 8px;
  height: 8px;
}

:deep(.p-datatable-scrollable-body::-webkit-scrollbar-track) {
  background: #f1f5f9;
  border-radius: 4px;
}

:deep(.p-datatable-scrollable-body::-webkit-scrollbar-thumb) {
  background: #cbd5e1;
  border-radius: 4px;
}

:deep(.p-datatable-scrollable-body::-webkit-scrollbar-thumb:hover) {
  background: #94a3b8;
}

/* Mejorar los botones rounded */
:deep(.p-button-rounded) {
  width: 2.5rem;
  height: 2.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Card con sombra suave */
:deep(.p-card) {
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  border-radius: 1rem;
  border: 1px solid #e5e7eb;
}

/* Mejorar el estado vacío */
:deep(.p-datatable-emptymessage) {
  padding: 3rem 0;
}

/* Fuente monoespaciada para cédula */
.font-mono {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
}

/* Columnas frozen (congeladas) */
:deep(.p-datatable-frozen-column) {
  background-color: #ffffff !important;
}
</style>

