
<script setup>
import { ref, onMounted, nextTick, watchEffect,computed } from 'vue';
import axios from 'axios';
import { enviarDatosPorPost, eliminarDatos, obtenerIdsSeleccionados, borrarTodoslosDatos, lenguajeDataTable, nfecha, arrayToObjetoFromTabla, peticionesFetch, encryptarPassword, envioElectron, mensajetoast, crearTablaSiNoExiste, peticiones,arrayToObjetoFromTablaOffline,generarCodigoUnico, lasMayusculas,crearTablaSiNoExisteOffline,peticionesFetchOffline } from '../../funciones/funciones.js';
import Swal from 'sweetalert2'
import { useToast } from "primevue/usetoast";
const toast = useToast();
import { useRouter, useRoute } from 'vue-router';
const router = useRouter();
/************************************************************************/
/************************************************************************/
const usuarioLocal = ref({})
/************************************************************************/
const camposArray = ['proveedor', 'no_compra', 'fecha_de_compra', 'hora', 'equipo', 'marca', 'modelo', 'imei', 'serial', 'tecnico', 'costo', 'estado', 'desbloqueo_redes', 'grado', 'bateria', 'almacenamiento', 'color', 'carrier', 'test_3utool', 'icloud', 'base_id', 'status_caution', 'front_camera', 'rear_camera', 'telephoto_camera_quality', 'ultra_wide_camera_quality', 'volume_up_button', 'volume_down_button', 'primary_speaker', 'vibration', 'wifi', 'loud_speaker', 'lcd', 'touch_screen', 'proximity_sensor', 'face_id', 'display_quality', 'button_responsiveness', 'detalles'];
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
const estadoFiltro = ref('EN REVISION');
/************************************************************************/
const position = ref('top');
const openPosition = (pos) => {
    position.value = pos;
    visible.value = true;
}
/************************************************************************/
const datoscamposPhone_check = ref({})
/************************************************************************/
const visible = ref(false);
const visiblecrear = ref(false);
const value = ref(null);
const id = ref(null);
const datoscampos = ref({});
const data = ref([]);
const searchQuery = ref('');
const Phone_checkEditar = ref(null);
/************************************************************************/
async function limpiarCamposCrear() {
datoscamposPhone_check.value = {}
await campos();
}
/************************************************************************/
watchEffect(() => {
  if (visiblecrear.value) {
  }
});
/************************************************************************/
const fetchAndSetupData = async () => {
const response = await peticionesFetchOffline('getDataAsArray', 'phone_check');
    const jsonData = response.reverse();
    data.value = jsonData;
};
/************************************************************************/
async function campos() {
  const campos = await arrayToObjetoFromTablaOffline('phone_check');
  datoscamposPhone_check.value = campos;
}
/************************************************************************/
onMounted(async () => {
const datosJSON = await envioElectron('datosarchivo');
link.value = datosJSON.LINKURL;
api.value = datosJSON.LINK_API;
token.value = datosJSON.TOKEN;
patronTelefono.value = datosJSON.PATRON_TELEFONO;
linkImpresora.value = datosJSON.IMPRESORA_LOCAL;
patroncedula.value = datosJSON.PATRON_CEDULA;
tokenCorto.value = datosJSON.TOKEN_CORTO;

tokenCifrado.value = await encryptarPassword(token.value, 10);
await crearTablaSiNoExisteOffline('phone_check', camposArray.join(','), toast);
usuarioLocal.value = datosEmpresa.usuario
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
                    const envioDatos = await peticionesFetchOffline('deleteAll', 'phone_check');
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
                                const envioDatos = await peticionesFetchOffline('deleteEntry', 'phone_check',id);
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
const itemsPhone_check = ref([]);
const menu = ref(null);
const currentRowData = ref(null);
const togglePhone_check = (event, rowData) => {
currentRowData.value = rowData;
itemsPhone_check.value = [
{ label: 'Editar', icon: 'pi pi-pencil', command: () => {
router.push({ path: `/editarphone_check/${currentRowData.value.id}` });
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
                        const datosFactura = await peticionesFetchOffline('deleteEntry', 'phone_check',rowData.id);
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
const filteredPhone_check = computed(() => {
  let datos = data.value;
  if (estadoFiltro.value) {
    datos = datos.filter(item => item.estado === estadoFiltro.value);
  }
  if (!searchQuery.value) return datos;
  return datos.filter(busqueda => {
    return Object.values(busqueda).some(value =>
      String(value).toLowerCase().includes(searchQuery.value.toLowerCase())
    );
  });
});
/************************************************************************/
const statsData = computed(() => {
  const phones = filteredPhone_check.value;
  const total = phones.length;
  const enRevision = phones.filter(p => p.estado === 'EN REVISION').length;
  const revisados = phones.filter(p => p.estado === 'REVISADO').length;
  const paraPiezas = phones.filter(p => p.estado === 'PARA PIEZAS').length;
  const devueltos = phones.filter(p => p.estado === 'DEVUELTO').length;
  const costoTotal = phones.reduce((sum, p) => sum + Number(p.costo || 0), 0);

  return {
    total,
    enRevision,
    revisados,
    paraPiezas,
    devueltos,
    costoTotal: costoTotal.toFixed(2)
  };
});
/************************************************************************/
const fnAwesomplete = ()=>{
}
const handleSelectComplete = async(selected)=>{
}
/************************************************************************/
const onRowSelect = (event) => {
router.push({ path: `/editarphone_check/${event.data.id}` });
};
/************************************************************************/
const getRowClass = (data) => {
  if (data.estado === 'EN REVISION') {
    return 'row-yellow';
  } else if (data.estado === 'PARA PIEZAS') {
    return 'row-red';
  } else if (data.estado === 'DEVUELTO') {
    return 'row-blue';
  } else if (data.estado === 'REVISADO') {
    return 'row-green';
  }
  return '';
};
/************************************************************************/
const fnPasarVenta = async (seleccionado) => {
    const confirmacion = await Swal.fire({
        title: 'Confirmación',
        text: '¿Ha revisado todo y desea continuar?',
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Sí, continuar',
        cancelButtonText: 'Cancelar'
    });

    if (!confirmacion.isConfirmed) {
        return; // Si el usuario cancela, no ejecutamos la operación
    }

    const { value: precios } = await Swal.fire({
        title: 'Ingrese los precios',
        html: `
            <input type="number" id="precio_venta" class="swal2-input" placeholder="Precio de venta">
            <input type="number" id="precio_minimo" class="swal2-input" placeholder="Precio mínimo">
            <input type="number" id="precio_xmayor" class="swal2-input" placeholder="Precio por mayor">
        `,
        focusConfirm: false,
        preConfirm: () => {
            const precioVenta = document.getElementById('precio_venta').value;
            const precioXMayor = document.getElementById('precio_xmayor').value;
            const precioMinimo = document.getElementById('precio_minimo').value;

            if (!precioVenta || !precioXMayor || !precioMinimo) {
                Swal.showValidationMessage('Por favor, complete todos los campos');
            }

            return {
                precioVenta,
                precioXMayor,
                precioMinimo
            };
        }
    });

    if (precios) {
        const jsonData = await arrayToObjetoFromTablaOffline('productos');

        jsonData.nombre = seleccionado.equipo +' '+seleccionado.marca +' '+seleccionado.modelo+' '+seleccionado.color;
        jsonData.descripcion = seleccionado.equipo +' '+seleccionado.marca +' '+seleccionado.modelo+' '+seleccionado.color;
        jsonData.created_at = nfecha('timestamp');
        jsonData.updated_at = nfecha('timestamp');
        jsonData.codigo = generarCodigoUnico();
        jsonData.codigo_barra = generarCodigoUnico();
        jsonData.precio_compra = seleccionado.costo;
        jsonData.otro = seleccionado.imei;
        jsonData.proveedor = seleccionado.proveedor;
        jsonData.no_compra = seleccionado.no_compra;
        jsonData.impuestos = '18';
        jsonData.categoria = 'CELULARES';
        jsonData.tipo_impuesto = 'INCLUIDO';
        jsonData.stock = '1';
        jsonData.alerta = '1';
        jsonData.precio_venta = precios.precioVenta;
        jsonData.precio_xmayor = precios.precioXMayor;
        jsonData.precio_min = precios.precioMinimo;
        jsonData.caracteristicas = JSON.stringify({
            icloud: seleccionado.icloud,
            base_id: seleccionado.base_id,
            status_caution: seleccionado.status_caution,
            front_camera: seleccionado.front_camera,
            rear_camera: seleccionado.rear_camera,
            telephoto_camera_quality: seleccionado.telephoto_camera_quality,
            ultra_wide_camera_quality: seleccionado.ultra_wide_camera_quality,
            volume_up_button: seleccionado.volume_up_button,
            volume_down_button: seleccionado.volume_down_button,
            primary_speaker: seleccionado.primary_speaker,
            vibration: seleccionado.vibration,
            wifi: seleccionado.wifi,
            loud_speaker: seleccionado.loud_speaker,
            lcd: seleccionado.lcd,
            touch_screen: seleccionado.touch_screen,
            proximity_sensor: seleccionado.proximity_sensor,
            face_id: seleccionado.face_id,
            display_quality: seleccionado.display_quality,
            button_responsiveness: seleccionado.button_responsiveness
        });


  const url = link.value+api.value+"/insertar/productos";
  if (!jsonData) {
    toast.add({ severity: 'error', summary: 'Error', detail: 'Datos incompletos, no se puede Enviar.', life: 3000 });
    return;
  }
  if (jsonData.hasOwnProperty('created_at')) {
     jsonData.created_at = nfecha('timestamp')
     jsonData.updated_at = nfecha('timestamp')
    }


const verificaProducto = await peticionesFetchOffline('getDataByField', 'productos','nombre',jsonData.nombre);

if (verificaProducto) {
  toast.add({ severity: 'error', summary: 'Error', detail: 'Este producto ya existe', life: 3000 });
  return
}

   jsonData.almacen = datosEmpresa.empresa.nombre

  const envioDatos = await peticionesFetchOffline('insertData', 'productos', JSON.stringify(jsonData));
  if (envioDatos[0] == 'ok') {
     toast.add({ severity: 'success', summary: 'Éxito', detail: 'Datos Agregados con éxito.', life: 3000 });

  const camposImei = await arrayToObjetoFromTabla('imei');

/*const datosEquipo = await peticionesFetch(`${link.value}${api.value}`,`datoscampo/productos/nombre/${jsonData.nombre}`,{},tokenCifrado.value,'GET');*/


  camposImei.imei = seleccionado.imei
  camposImei.imei = seleccionado.imei

    camposImei.estado = 'DISPONIBLE'
    camposImei.no_compra = seleccionado.no_compra
    camposImei.fecha = nfecha('fecha')
    camposImei.equipo = seleccionado.equipo +' '+seleccionado.marca +' '+seleccionado.modelo;
    camposImei.proveedor = seleccionado.proveedor
    camposImei.id_equi = envioDatos[1].id
    camposImei.costo = seleccionado.costo
    camposImei.precio_venta = precios.precioVenta
    camposImei.detalles = JSON.stringify({
            icloud: seleccionado.icloud,
            base_id: seleccionado.base_id,
            status_caution: seleccionado.status_caution,
            front_camera: seleccionado.front_camera,
            rear_camera: seleccionado.rear_camera,
            telephoto_camera_quality: seleccionado.telephoto_camera_quality,
            ultra_wide_camera_quality: seleccionado.ultra_wide_camera_quality,
            volume_up_button: seleccionado.volume_up_button,
            volume_down_button: seleccionado.volume_down_button,
            primary_speaker: seleccionado.primary_speaker,
            vibration: seleccionado.vibration,
            wifi: seleccionado.wifi,
            loud_speaker: seleccionado.loud_speaker,
            lcd: seleccionado.lcd,
            touch_screen: seleccionado.touch_screen,
            proximity_sensor: seleccionado.proximity_sensor,
            face_id: seleccionado.face_id,
            display_quality: seleccionado.display_quality,
            button_responsiveness: seleccionado.button_responsiveness
        });
    camposImei.updated_at = nfecha('timestamp')
    camposImei.created_at = nfecha('timestamp')

  const urlImei = link.value+api.value+"/insertar/imei";
      const envioDatosN = await peticionesFetchOffline('insertData', 'imei', JSON.stringify(camposImei));
  if (envioDatosN[0] == 'ok') {
    toast.add({ severity: 'success', summary: 'Éxito', detail: 'Imei Agregado', life: 3000 });
  }

 }



    }
};
/************************************************************************/
const fnRevisado = async()=>{
      const seleccionados = selectedItems.value
}
/************************************************************************/
const fnInventario = async()=>{
    const seleccionados = selectedItems.value
    for(let selected of seleccionados){
        await fnPasarVenta(selected)
    }
}
/************************************************************************/
</script>
<template>
<main class="phone-check-wrapper">
  <div class="phone-check-container">

    <!-- Modern Header -->
    <div class="phone-check-header">
      <div class="phone-check-header-content">
        <div class="phone-check-icon-wrapper">
          <i class="pi pi-mobile phone-check-icon"></i>
        </div>
        <div>
          <h1 class="phone-check-title">Revisión de Teléfonos</h1>
          <p class="phone-check-subtitle">Gestión de inspecciones técnicas de dispositivos</p>
        </div>
      </div>
    </div>

    <!-- Stats Cards -->
    <div class="phone-check-stats-grid">
      <Card class="phone-check-stat-card phone-check-stat-total">
        <template #content>
          <div class="phone-check-stat-content">
            <div>
              <p class="phone-check-stat-label">Total Equipos</p>
              <p class="phone-check-stat-value">{{ statsData.total }}</p>
            </div>
            <div class="phone-check-stat-icon-circle phone-check-stat-icon-total">
              <i class="pi pi-mobile"></i>
            </div>
          </div>
        </template>
      </Card>

      <Card class="phone-check-stat-card phone-check-stat-revision">
        <template #content>
          <div class="phone-check-stat-content">
            <div>
              <p class="phone-check-stat-label">En Revisión</p>
              <p class="phone-check-stat-value">{{ statsData.enRevision }}</p>
            </div>
            <div class="phone-check-stat-icon-circle phone-check-stat-icon-revision">
              <i class="pi pi-clock"></i>
            </div>
          </div>
        </template>
      </Card>

      <Card class="phone-check-stat-card phone-check-stat-revisados">
        <template #content>
          <div class="phone-check-stat-content">
            <div>
              <p class="phone-check-stat-label">Revisados</p>
              <p class="phone-check-stat-value">{{ statsData.revisados }}</p>
            </div>
            <div class="phone-check-stat-icon-circle phone-check-stat-icon-revisados">
              <i class="pi pi-check-circle"></i>
            </div>
          </div>
        </template>
      </Card>

      <Card class="phone-check-stat-card phone-check-stat-piezas">
        <template #content>
          <div class="phone-check-stat-content">
            <div>
              <p class="phone-check-stat-label">Para Piezas</p>
              <p class="phone-check-stat-value">{{ statsData.paraPiezas }}</p>
            </div>
            <div class="phone-check-stat-icon-circle phone-check-stat-icon-piezas">
              <i class="pi pi-wrench"></i>
            </div>
          </div>
        </template>
      </Card>

      <Card class="phone-check-stat-card phone-check-stat-costo">
        <template #content>
          <div class="phone-check-stat-content">
            <div>
              <p class="phone-check-stat-label">Costo Total</p>
              <p class="phone-check-stat-value">${{ statsData.costoTotal }}</p>
            </div>
            <div class="phone-check-stat-icon-circle phone-check-stat-icon-costo">
              <i class="pi pi-dollar"></i>
            </div>
          </div>
        </template>
      </Card>
    </div>

    <!-- Section Divider -->
    <div class="phone-check-section-divider">
      <div class="phone-check-divider-line"></div>
      <span class="phone-check-divider-badge">Acciones y Filtros</span>
      <div class="phone-check-divider-line"></div>
    </div>

    <!-- Actions Card -->
    <Card class="phone-check-actions-card">
      <template #content>
        <div class="phone-check-actions-grid">
          <div class="phone-check-actions-group">
            <h3 class="phone-check-actions-title"><i class="pi pi-cog"></i> Acciones</h3>
            <div class="phone-check-actions-buttons">
              <Button
                icon="pi pi-refresh"
                label="Recargar"
                severity="info"
                @click="fetchAndSetupData"
                class="phone-check-action-btn"
              />
              <Button
                icon="pi pi-plus"
                label="Nueva Revisión"
                severity="success"
                @click="router.push('/crearphone_check')"
                class="phone-check-action-btn"
              />
              <Button
                icon="pi pi-trash"
                label="Borrar Selección"
                severity="danger"
                @click="borrarSeleccionados"
                class="phone-check-action-btn"
              />
              <Button
                icon="pi pi-shopping-cart"
                label="Pasar a Inventario"
                severity="warning"
                @click="fnInventario"
                class="phone-check-action-btn"
              />
              <Button
                v-if="usuarioLocal.usuario == 'Soporte'"
                icon="pi pi-times-circle"
                label="Borrar Todo"
                severity="danger"
                @click="borrarTodo"
                class="phone-check-action-btn"
              />
            </div>
          </div>
        </div>
      </template>
    </Card>

    <!-- Filters Card -->
    <Card class="phone-check-filters-card">
      <template #content>
        <div class="phone-check-filters-grid">
          <div class="phone-check-filter-group">
            <label class="phone-check-filter-label">
              <i class="pi pi-filter"></i> Filtrar por Estado
            </label>
            <Dropdown
              v-model="estadoFiltro"
              :options="['EN REVISION', 'REVISADO', 'DEVUELTO', 'PARA PIEZAS']"
              placeholder="Todos los estados"
              class="phone-check-filter-input"
            />
          </div>
          <div class="phone-check-filter-group phone-check-filter-group-span-2">
            <label class="phone-check-filter-label">
              <i class="pi pi-search"></i> Buscar
            </label>
            <InputText
              v-model="searchQuery"
              placeholder="Buscar por cualquier campo..."
              class="phone-check-filter-input"
            />
          </div>
        </div>
      </template>
    </Card>

    <!-- DataTable Card -->
    <Card class="phone-check-table-card">
      <template #content>
        <DataTable
          :value="filteredPhone_check"
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
          :rowClass="getRowClass"
          selectionMode="single"
          :rowsPerPageOptions="[5, 10, 20, 50]"
          tableStyle="min-width: 50rem"
          class="phone-check-datatable"
        >
          <Column selectionMode="multiple" headerStyle="width: 3rem">
            <template #body="{ data }">
              <div @click.stop>
                <Checkbox v-model="selectedItems" :value="data" />
              </div>
            </template>
          </Column>

          <Column header="Opciones" style="width: 100px">
            <template #body="slotProps">
              <Button
                icon="pi pi-cog"
                severity="secondary"
                @click="togglePhone_check($event, slotProps.data)"
                aria-haspopup="true"
                aria-controls="overlay_menu_phone_check"
                class="phone-check-options-btn"
              />
              <Menu
                ref="menu"
                id="overlay_menu_phone_check"
                :model="itemsPhone_check"
                :popup="true"
              />
            </template>
          </Column>

          <Column field="proveedor" header="Proveedor" style="min-width: 150px"></Column>
          <Column field="no_compra" header="No. Compra" style="min-width: 120px"></Column>
          <Column field="fecha_de_compra" header="Fecha Compra" style="min-width: 120px"></Column>
          <Column field="equipo" header="Equipo" style="min-width: 120px"></Column>
          <Column field="marca" header="Marca" style="min-width: 120px"></Column>
          <Column field="modelo" header="Modelo" style="min-width: 150px"></Column>
          <Column field="imei" header="IMEI" style="min-width: 180px"></Column>
          <Column field="serial" header="Serial" style="min-width: 150px"></Column>
          <Column field="tecnico" header="Técnico" style="min-width: 150px"></Column>
          <Column field="costo" header="Costo" style="min-width: 100px">
            <template #body="slotProps">
              ${{ Number(slotProps.data.costo || 0).toFixed(2) }}
            </template>
          </Column>
          <Column field="estado" header="Estado" style="min-width: 130px">
            <template #body="slotProps">
              <Badge
                :value="slotProps.data.estado"
                :severity="slotProps.data.estado === 'REVISADO' ? 'success' : slotProps.data.estado === 'EN REVISION' ? 'warn' : slotProps.data.estado === 'PARA PIEZAS' ? 'danger' : 'info'"
              />
            </template>
          </Column>
          <Column field="grado" header="Grado" style="min-width: 100px"></Column>
          <Column field="bateria" header="Batería" style="min-width: 100px">
            <template #body="slotProps">
              {{ slotProps.data.bateria }}%
            </template>
          </Column>
          <Column field="almacenamiento" header="Almacenamiento" style="min-width: 140px"></Column>
          <Column field="color" header="Color" style="min-width: 120px"></Column>
          <Column field="desbloqueo_redes" header="Desbloqueo" style="min-width: 140px"></Column>
        </DataTable>
      </template>
    </Card>

  </div>
</main>
<Toast />
</template>

<style scoped>
.phone-check-wrapper {
  min-height: 100vh;
  padding: 2rem;
  animation: fadeIn 0.3s ease-in;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.phone-check-container {
  max-width: 1600px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

/* Header Styles */
.phone-check-header {
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 50%, #1d4ed8 100%);
  border-radius: 20px;
  padding: 2rem;
  box-shadow: 0 8px 32px rgba(59, 130, 246, 0.3);
  border: 2px solid #bfdbfe;
  animation: slideIn 0.5s ease-out;
}

@keyframes slideIn {
  from { transform: translateX(-20px); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
}

.phone-check-header-content {
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.phone-check-icon-wrapper {
  width: 80px;
  height: 80px;
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid rgba(255, 255, 255, 0.3);
}

.phone-check-icon {
  font-size: 2.5rem;
  color: white;
}

.phone-check-title {
  font-size: 2rem;
  font-weight: 700;
  color: white;
  margin: 0;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.phone-check-subtitle {
  font-size: 1rem;
  color: rgba(255, 255, 255, 0.9);
  margin: 0.25rem 0 0 0;
}

/* Stats Cards */
.phone-check-stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 1.5rem;
}

.phone-check-stat-card {
  border: 2px solid #bfdbfe;
  border-radius: 16px;
  transition: all 0.3s ease;
}

.phone-check-stat-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(59, 130, 246, 0.2);
}

.phone-check-stat-total { background: linear-gradient(135deg, #dbeafe, #bfdbfe); }
.phone-check-stat-revision { background: linear-gradient(135deg, #fef3c7, #fde68a); }
.phone-check-stat-revisados { background: linear-gradient(135deg, #d1fae5, #a7f3d0); }
.phone-check-stat-piezas { background: linear-gradient(135deg, #fecaca, #fca5a5); }
.phone-check-stat-costo { background: linear-gradient(135deg, #ddd6fe, #c4b5fd); }

.phone-check-stat-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.phone-check-stat-label {
  font-size: 0.875rem;
  color: #64748b;
  font-weight: 600;
  margin: 0 0 0.5rem 0;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.phone-check-stat-value {
  font-size: 2rem;
  font-weight: 700;
  color: #1e293b;
  margin: 0;
}

.phone-check-stat-icon-circle {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  color: white;
}

.phone-check-stat-icon-total { background: linear-gradient(135deg, #3b82f6, #2563eb); }
.phone-check-stat-icon-revision { background: linear-gradient(135deg, #f59e0b, #d97706); }
.phone-check-stat-icon-revisados { background: linear-gradient(135deg, #10b981, #059669); }
.phone-check-stat-icon-piezas { background: linear-gradient(135deg, #ef4444, #dc2626); }
.phone-check-stat-icon-costo { background: linear-gradient(135deg, #8b5cf6, #7c3aed); }

/* Section Divider */
.phone-check-section-divider {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin: 1rem 0;
}

.phone-check-divider-line {
  flex: 1;
  height: 2px;
  background: linear-gradient(90deg, transparent, #f97316, transparent);
}

.phone-check-divider-badge {
  background: linear-gradient(135deg, #f97316, #ea580c);
  color: white;
  padding: 0.5rem 1.5rem;
  border-radius: 20px;
  font-weight: 600;
  font-size: 0.875rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  box-shadow: 0 4px 12px rgba(249, 115, 22, 0.3);
}

/* Actions Card */
.phone-check-actions-card {
  border: 2px solid #bfdbfe;
  border-radius: 16px;
  box-shadow: 0 4px 16px rgba(59, 130, 246, 0.1);
}

.phone-check-actions-grid {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.phone-check-actions-group {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.phone-check-actions-title {
  font-size: 1rem;
  font-weight: 600;
  color: #1e40af;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.phone-check-actions-buttons {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.phone-check-action-btn {
  transition: all 0.3s ease;
}

.phone-check-action-btn:hover {
  transform: translateY(-2px);
}

/* Filters Card */
.phone-check-filters-card {
  border: 2px solid #bfdbfe;
  border-radius: 16px;
  box-shadow: 0 4px 16px rgba(59, 130, 246, 0.1);
}

.phone-check-filters-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
}

.phone-check-filter-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.phone-check-filter-group-span-2 {
  grid-column: span 2;
}

.phone-check-filter-label {
  font-weight: 600;
  color: #1e40af;
  font-size: 0.875rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.phone-check-filter-input {
  border: 2px solid #bfdbfe;
  border-radius: 8px;
  transition: all 0.3s ease;
}

.phone-check-filter-input:focus {
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

/* Table Card */
.phone-check-table-card {
  border: 2px solid #bfdbfe;
  border-radius: 16px;
  box-shadow: 0 4px 16px rgba(59, 130, 246, 0.1);
}

.phone-check-datatable {
  font-size: 0.875rem;
}

.phone-check-options-btn {
  width: 100%;
}

/* Row Colors */
.row-red {
  color: red !important;
}
.row-yellow {
  color: #efb63f !important;
}
.row-green {
  color: green !important;
}
.row-blue {
  color: #3b82f6 !important;
}

/* Responsive */
@media (max-width: 1024px) {
  .phone-check-filter-group-span-2 {
    grid-column: span 1;
  }
}

@media (max-width: 768px) {
  .phone-check-wrapper {
    padding: 1rem;
  }

  .phone-check-header {
    padding: 1.5rem;
  }

  .phone-check-icon-wrapper {
    width: 60px;
    height: 60px;
  }

  .phone-check-icon {
    font-size: 2rem;
  }

  .phone-check-title {
    font-size: 1.5rem;
  }

  .phone-check-stats-grid {
    grid-template-columns: 1fr;
  }

  .phone-check-filters-grid {
    grid-template-columns: 1fr;
  }

  .phone-check-actions-buttons {
    flex-direction: column;
  }

  .phone-check-action-btn {
    width: 100%;
  }
}
</style>
