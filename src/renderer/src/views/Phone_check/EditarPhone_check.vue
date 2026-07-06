
<script setup>
import { ref, onMounted, nextTick, watchEffect } from 'vue';
import { useToast } from "primevue/usetoast";
import { useRouter, useRoute } from 'vue-router';
const router = useRouter();
const route = useRoute();
import {enviarDatosPorPost,
  eliminarDatos,
  obtenerIdsSeleccionados,
  borrarTodoslosDatos,
  lenguajeDataTable,
  nfecha,
  arrayToObjetoFromTabla,
  peticionesFetch,
  encryptarPassword,
  envioElectron,
  generarCodigoUnico,
  peticiones,
  arrayToObjetoFromTablaOffline,
  peticionesFetchOffline,
  enviarSolicitudGet,
  mensajetoast,
  lasMayusculas} from '../../funciones/funciones.js';
import Swal from 'sweetalert2'
const toast = useToast();
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
/************************************************************************/
const datoscampos = ref({})
const codigoUnico = ref(generarCodigoUnico());
const fecha = ref(nfecha('fecha'));
const position = "top";
const todosLosphone_check = ref([]);
/************************************************************************/
const proveedoresData = ref([])
const proveedoresDataNames = ref([])
const marcasData = ref([])
const marcasDataNames = ref([])
const tecnicosData = ref([])
const tecnicosDataNames = ref([])
/************************************************************************/
const fetchAllData = async () => {
    const response = await peticionesFetchOffline('getDataAsArray', 'phone_check');
    const jsonData = response;
    todosLosphone_check.value = response;

    // Encontrar el objeto específico
    datoscampos.value = jsonData.find(datos => datos.id == route.params.id);
    // Convertir strings "true"/"false" a booleanos
    if (datoscampos.value) {
        Object.keys(datoscampos.value).forEach(key => {
            if (datoscampos.value[key] === "true") {
                datoscampos.value[key] = true;
            } else if (datoscampos.value[key] === "false") {
                datoscampos.value[key] = false;
            }
        });
    }

};

/************************************************************************/
function navigate(action) {
    const currentIndex = todosLosphone_check.value.findIndex(notacredito => notacredito.id == route.params.id);
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
            newIndex = currentIndex + 1 < todosLosphone_check.value.length ? currentIndex + 1 : currentIndex;
            break;
        case 'ultimo':
            newIndex = todosLosphone_check.value.length - 1;
            break;
        default:
            return;
    }
    datoscampos.value = todosLosphone_check.value[newIndex];
    router.push({ path: `/editarphone_check/${todosLosphone_check.value[newIndex].id}` });
}
/************************************************************************/
/************************************************************************/
const fetchProveedores = async () => {
  try {
    const response = await peticionesFetchOffline('getDataAsArray', 'proveedores');
    proveedoresData.value = response;
    proveedoresDataNames.value = response.map(proveedores=>proveedores.nombre);
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to fetch data from proveedores',
      life: 3000
    });
  }
};
/************************************************************************/
const fetchMarcas = async () => {
  try {
    const response = await peticionesFetchOffline('getDataAsArray', 'marcas');
    marcasData.value = response;
    marcasDataNames.value = response.map(marcas=>marcas.nombre);
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to fetch data from marcas',
      life: 3000
    });
  }
};
/************************************************************************/
const fetchTecnicos = async () => {
  try {
    const response = await peticionesFetchOffline('getDataAsArray', 'usuarios');
    const tecnicos = response.filter(resp=>resp.nivel_seguridad === 'Tecnico')
    tecnicosData.value = tecnicos;
    tecnicosDataNames.value = tecnicos.map(tecnicos=>tecnicos.nombre);
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to fetch data from tecnicos',
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
patroncedula.value = datosJSON.PATRON_CEDULA;
tokenCifrado.value = await encryptarPassword(token.value, 10);
await fetchAllData()
await fetchProveedores()
await fetchMarcas()
await fetchTecnicos()
});
/************************************************************************/
function convertirBooleanoAString(valor) {
  if (typeof valor === 'boolean') {
    return valor ? 'true' : 'false';
  }
  return valor;
}
/************************************************************************/
async function funcionActualizar(e) {
  e.preventDefault();
  const url = link.value+api.value+"/actualizarcampos/phone_check";
  if (!datoscampos.value) {
    console.error("Datos incompletos, no se puede actualizar.");
    return;
  }
  if (datoscampos.value.hasOwnProperty('created_at')) {
      datoscampos.value.updated_at = nfecha('timestamp')
    }

    for (let prop in datoscampos.value) {
      datoscampos.value[prop] = convertirBooleanoAString(datoscampos.value[prop]);
    }

  const envioDatos = await peticionesFetchOffline('updateData', 'phone_check', JSON.stringify(datoscampos.value));
  if (envioDatos[0] == 'ok') {
     toast.add({ severity: 'success', summary: 'Éxito', detail: 'Datos Actualizados', life: 3000 });
     await fetchAllData()
  }else{
    toast.add({ severity: 'error', summary: 'Error', detail: 'Fallo al actualizar los datos.', life: 3000 });
  }
}
/************************************************************************/
const fnPasarVenta = async () => {
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

        jsonData.nombre = datoscampos.value.equipo +' '+datoscampos.value.marca +' '+datoscampos.value.modelo+' '+datoscampos.value.color;
        jsonData.descripcion = datoscampos.value.equipo +' '+datoscampos.value.marca +' '+datoscampos.value.modelo+' '+datoscampos.value.color;
        jsonData.created_at = nfecha('timestamp');
        jsonData.updated_at = nfecha('timestamp');
        jsonData.codigo = generarCodigoUnico();
        jsonData.codigo_barra = generarCodigoUnico();
        jsonData.precio_compra = datoscampos.value.costo;
        jsonData.otro = datoscampos.value.imei;
        jsonData.proveedor = datoscampos.value.proveedor;
        jsonData.no_compra = datoscampos.value.no_compra;
        jsonData.impuestos = '18';
        jsonData.categoria = 'CELULARES';
        jsonData.tipo_impuesto = 'INCLUIDO';
        jsonData.stock = '1';
        jsonData.alerta = '1';
        jsonData.precio_venta = precios.precioVenta;
        jsonData.precio_xmayor = precios.precioXMayor;
        jsonData.almacen = datosEmpresa.empresa.nombre;
        jsonData.precio_min = precios.precioMinimo;
        jsonData.caracteristicas = JSON.stringify({
            icloud: datoscampos.value.icloud,
            base_id: datoscampos.value.base_id,
            status_caution: datoscampos.value.status_caution,
            front_camera: datoscampos.value.front_camera,
            rear_camera: datoscampos.value.rear_camera,
            telephoto_camera_quality: datoscampos.value.telephoto_camera_quality,
            ultra_wide_camera_quality: datoscampos.value.ultra_wide_camera_quality,
            volume_up_button: datoscampos.value.volume_up_button,
            volume_down_button: datoscampos.value.volume_down_button,
            primary_speaker: datoscampos.value.primary_speaker,
            vibration: datoscampos.value.vibration,
            wifi: datoscampos.value.wifi,
            loud_speaker: datoscampos.value.loud_speaker,
            lcd: datoscampos.value.lcd,
            touch_screen: datoscampos.value.touch_screen,
            proximity_sensor: datoscampos.value.proximity_sensor,
            face_id: datoscampos.value.face_id,
            display_quality: datoscampos.value.display_quality,
            button_responsiveness: datoscampos.value.button_responsiveness
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


  camposImei.imei = datoscampos.value.imei
  camposImei.imei = datoscampos.value.imei

    camposImei.estado = 'DISPONIBLE'
    camposImei.no_compra = datoscampos.value.no_compra
    camposImei.fecha = nfecha('fecha')
    camposImei.equipo = datoscampos.value.equipo +' '+datoscampos.value.marca +' '+datoscampos.value.modelo;
    camposImei.proveedor = datoscampos.value.proveedor
    camposImei.id_equi = envioDatos[1].id
    camposImei.costo = datoscampos.value.costo
    camposImei.precio_venta = precios.precioVenta
    camposImei.detalles = JSON.stringify({
            icloud: datoscampos.value.icloud,
            base_id: datoscampos.value.base_id,
            status_caution: datoscampos.value.status_caution,
            front_camera: datoscampos.value.front_camera,
            rear_camera: datoscampos.value.rear_camera,
            telephoto_camera_quality: datoscampos.value.telephoto_camera_quality,
            ultra_wide_camera_quality: datoscampos.value.ultra_wide_camera_quality,
            volume_up_button: datoscampos.value.volume_up_button,
            volume_down_button: datoscampos.value.volume_down_button,
            primary_speaker: datoscampos.value.primary_speaker,
            vibration: datoscampos.value.vibration,
            wifi: datoscampos.value.wifi,
            loud_speaker: datoscampos.value.loud_speaker,
            lcd: datoscampos.value.lcd,
            touch_screen: datoscampos.value.touch_screen,
            proximity_sensor: datoscampos.value.proximity_sensor,
            face_id: datoscampos.value.face_id,
            display_quality: datoscampos.value.display_quality,
            button_responsiveness: datoscampos.value.button_responsiveness
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
</script>
<template>
<main class="editar-phone-check-wrapper">
  <div class="editar-phone-check-container">

    <!-- Modern Header -->
    <div class="editar-phone-check-header">
      <div class="editar-phone-check-header-content">
        <div class="editar-phone-check-icon-wrapper">
          <i class="pi pi-pencil editar-phone-check-icon"></i>
        </div>
        <div>
          <h1 class="editar-phone-check-title">Editar Revisión de Teléfono</h1>
          <p class="editar-phone-check-subtitle">Actualiza los datos de la revisión técnica</p>
        </div>
      </div>
    </div>

    <!-- Navigation Card -->
    <Card class="editar-phone-check-nav-card">
      <template #content>
        <div class="editar-phone-check-nav-grid">
          <div class="editar-phone-check-nav-group">
            <h3 class="editar-phone-check-nav-title"><i class="pi pi-compass"></i> Navegación</h3>
            <div class="editar-phone-check-nav-buttons">
              <Button
                icon="pi pi-angle-double-left"
                label="Primero"
                severity="secondary"
                @click="navigate('primero')"
                class="editar-phone-check-nav-btn"
              />
              <Button
                icon="pi pi-chevron-left"
                label="Anterior"
                severity="secondary"
                @click="navigate('anterior')"
                class="editar-phone-check-nav-btn"
              />
              <Button
                icon="pi pi-chevron-right"
                label="Siguiente"
                severity="secondary"
                @click="navigate('siguiente')"
                class="editar-phone-check-nav-btn"
              />
              <Button
                icon="pi pi-angle-double-right"
                label="Último"
                severity="secondary"
                @click="navigate('ultimo')"
                class="editar-phone-check-nav-btn"
              />
            </div>
          </div>
          <div class="editar-phone-check-nav-group">
            <h3 class="editar-phone-check-nav-title"><i class="pi pi-cog"></i> Acciones</h3>
            <div class="editar-phone-check-nav-buttons">
              <Button
                icon="pi pi-home"
                label="Inicio"
                severity="info"
                @click="router.push('/phone_check')"
                class="editar-phone-check-nav-btn"
              />
              <Button
                icon="pi pi-shopping-cart"
                label="Pasar a Ventas"
                severity="warning"
                @click="fnPasarVenta"
                class="editar-phone-check-nav-btn"
              />
            </div>
          </div>
        </div>
      </template>
    </Card>

    <!-- Section Divider -->
    <div class="editar-phone-check-section-divider">
      <div class="editar-phone-check-divider-line"></div>
      <span class="editar-phone-check-divider-badge">Detalles de Revisión</span>
      <div class="editar-phone-check-divider-line"></div>
    </div>

    <!-- Form Card -->
    <Card class="editar-phone-check-form-card">
      <template #content>
        <form @submit.prevent="funcionActualizar">

          <!-- Section 1: Información de Compra -->
          <div class="editar-phone-check-form-section">
            <h3 class="editar-phone-check-section-title">
              <i class="pi pi-shopping-cart"></i>
              Información de Compra
            </h3>
            <div class="editar-phone-check-form-grid">
              <div class="editar-phone-check-form-group">
                <label class="editar-phone-check-label">Proveedor</label>
                <Dropdown
                  v-model="datoscampos.proveedor"
                  :options="proveedoresDataNames"
                  placeholder="Seleccione proveedor"
                  class="editar-phone-check-input"
                />
              </div>
              <div class="editar-phone-check-form-group">
                <label class="editar-phone-check-label">No. Compra</label>
                <InputText
                  v-model="datoscampos.no_compra"
                  placeholder="No compra"
                  class="editar-phone-check-input"
                />
              </div>
              <div class="editar-phone-check-form-group">
                <label class="editar-phone-check-label">Fecha de Compra</label>
                <DatePicker
                  v-model="datoscampos.fecha_de_compra"
                  showButtonBar
                  fluid
                  class="editar-phone-check-input"
                />
              </div>
              <div class="editar-phone-check-form-group">
                <label class="editar-phone-check-label">Hora</label>
                <DatePicker
                  v-model="datoscampos.hora"
                  timeOnly
                  fluid
                  class="editar-phone-check-input"
                />
              </div>
            </div>
          </div>

          <!-- Section 2: Datos del Dispositivo -->
          <div class="editar-phone-check-form-section">
            <h3 class="editar-phone-check-section-title">
              <i class="pi pi-mobile"></i>
              Datos del Dispositivo
            </h3>
            <div class="editar-phone-check-form-grid">
              <div class="editar-phone-check-form-group">
                <label class="editar-phone-check-label">Equipo</label>
                <InputText
                  v-model="datoscampos.equipo"
                  placeholder="Equipo"
                  class="editar-phone-check-input"
                />
              </div>
              <div class="editar-phone-check-form-group editar-phone-check-form-group-span-2">
                <label class="editar-phone-check-label">IMEI</label>
                <InputText
                  v-model="datoscampos.imei"
                  placeholder="IMEI"
                  class="editar-phone-check-input"
                />
              </div>
              <div class="editar-phone-check-form-group">
                <label class="editar-phone-check-label">Marca</label>
                <InputText
                  v-model="datoscampos.marca"
                  placeholder="Marca"
                  class="editar-phone-check-input"
                />
              </div>
              <div class="editar-phone-check-form-group">
                <label class="editar-phone-check-label">Modelo</label>
                <InputText
                  v-model="datoscampos.modelo"
                  placeholder="Modelo"
                  class="editar-phone-check-input"
                />
              </div>
              <div class="editar-phone-check-form-group">
                <label class="editar-phone-check-label">Serial</label>
                <InputText
                  v-model="datoscampos.serial"
                  placeholder="Serial"
                  class="editar-phone-check-input"
                />
              </div>
              <div class="editar-phone-check-form-group">
                <label class="editar-phone-check-label">Color</label>
                <Dropdown
                  v-model="datoscampos.color"
                  :options="['BLANCO','NEGRO','ROJO','AZUL','GOLD']"
                  placeholder="Seleccione color"
                  class="editar-phone-check-input"
                />
              </div>
              <div class="editar-phone-check-form-group">
                <label class="editar-phone-check-label">Carrier</label>
                <InputText
                  v-model="datoscampos.carrier"
                  placeholder="Carrier"
                  class="editar-phone-check-input"
                />
              </div>
            </div>
          </div>

          <!-- Section 3: Revisión Técnica -->
          <div class="editar-phone-check-form-section">
            <h3 class="editar-phone-check-section-title">
              <i class="pi pi-wrench"></i>
              Revisión Técnica
            </h3>
            <div class="editar-phone-check-form-grid">
              <div class="editar-phone-check-form-group">
                <label class="editar-phone-check-label">Técnico</label>
                <Dropdown
                  v-model="datoscampos.tecnico"
                  :options="tecnicosDataNames"
                  placeholder="Seleccione técnico"
                  class="editar-phone-check-input"
                />
              </div>
              <div class="editar-phone-check-form-group">
                <label class="editar-phone-check-label">Estado</label>
                <Dropdown
                  v-model="datoscampos.estado"
                  :options="['EN REVISION','REVISADO','PARA PIEZAS','DEVUELTO']"
                  placeholder="Seleccione estado"
                  class="editar-phone-check-input"
                />
              </div>
              <div class="editar-phone-check-form-group">
                <label class="editar-phone-check-label">Grado</label>
                <Dropdown
                  v-model="datoscampos.grado"
                  :options="['A','B','C','D','F']"
                  placeholder="Seleccione grado"
                  class="editar-phone-check-input"
                />
              </div>
              <div class="editar-phone-check-form-group">
                <label class="editar-phone-check-label">Batería (%)</label>
                <InputText
                  v-model="datoscampos.bateria"
                  placeholder="Batería"
                  class="editar-phone-check-input"
                />
              </div>
              <div class="editar-phone-check-form-group">
                <label class="editar-phone-check-label">Almacenamiento</label>
                <Dropdown
                  v-model="datoscampos.almacenamiento"
                  :options="['4GB','8GB','16GB','32GB','64GB','128GB','256GB','512GB','1TB','2TB','4TB']"
                  placeholder="Seleccione almacenamiento"
                  class="editar-phone-check-input"
                />
              </div>
              <div class="editar-phone-check-form-group">
                <label class="editar-phone-check-label">Desbloqueo de Redes</label>
                <Dropdown
                  v-model="datoscampos.desbloqueo_redes"
                  :options="['FACTORY','BLOQUEADO','TURBO SIM','SEMI FACTORY','BY PASS','OTRO']"
                  placeholder="Seleccione desbloqueo"
                  class="editar-phone-check-input"
                />
              </div>
              <div class="editar-phone-check-form-group">
                <label class="editar-phone-check-label">Test 3uTool</label>
                <Dropdown
                  v-model="datoscampos.test_3utool"
                  :options="['SI','NO']"
                  placeholder="Test 3uTool"
                  class="editar-phone-check-input"
                />
              </div>
              <div class="editar-phone-check-form-group">
                <label class="editar-phone-check-label">Costo</label>
                <InputText
                  v-model="datoscampos.costo"
                  placeholder="0.00"
                  class="editar-phone-check-input"
                />
              </div>
            </div>
          </div>

          <!-- Section 4: Características del Dispositivo -->
          <div class="editar-phone-check-form-section">
            <h3 class="editar-phone-check-section-title">
              <i class="pi pi-check-circle"></i>
              Características del Dispositivo
            </h3>
            <div class="editar-phone-check-checkboxes-grid">
              <div class="editar-phone-check-checkbox-item">
                <Checkbox v-model="datoscampos.icloud" inputId="icloud" binary indeterminate :invalid="!datoscampos.icloud" />
                <label for="icloud" class="editar-phone-check-checkbox-label">iCloud</label>
              </div>
              <div class="editar-phone-check-checkbox-item">
                <Checkbox v-model="datoscampos.base_id" inputId="base_id" binary :invalid="!datoscampos.base_id" />
                <label for="base_id" class="editar-phone-check-checkbox-label">Base ID</label>
              </div>
              <div class="editar-phone-check-checkbox-item">
                <Checkbox v-model="datoscampos.status_caution" inputId="status_caution" binary :invalid="!datoscampos.status_caution" />
                <label for="status_caution" class="editar-phone-check-checkbox-label">Status Caution</label>
              </div>
              <div class="editar-phone-check-checkbox-item">
                <Checkbox v-model="datoscampos.front_camera" inputId="front_camera" binary :invalid="!datoscampos.front_camera" />
                <label for="front_camera" class="editar-phone-check-checkbox-label">Cámara Frontal</label>
              </div>
              <div class="editar-phone-check-checkbox-item">
                <Checkbox v-model="datoscampos.rear_camera" inputId="rear_camera" binary :invalid="!datoscampos.rear_camera" />
                <label for="rear_camera" class="editar-phone-check-checkbox-label">Cámara Trasera</label>
              </div>
              <div class="editar-phone-check-checkbox-item">
                <Checkbox v-model="datoscampos.telephoto_camera_quality" inputId="telephoto" binary :invalid="!datoscampos.telephoto_camera_quality" />
                <label for="telephoto" class="editar-phone-check-checkbox-label">Teleobjetivo</label>
              </div>
              <div class="editar-phone-check-checkbox-item">
                <Checkbox v-model="datoscampos.ultra_wide_camera_quality" inputId="ultrawide" binary :invalid="!datoscampos.ultra_wide_camera_quality" />
                <label for="ultrawide" class="editar-phone-check-checkbox-label">Ultra Gran Angular</label>
              </div>
              <div class="editar-phone-check-checkbox-item">
                <Checkbox v-model="datoscampos.volume_up_button" inputId="vol_up" binary :invalid="!datoscampos.volume_up_button" />
                <label for="vol_up" class="editar-phone-check-checkbox-label">Botón Volumen +</label>
              </div>
              <div class="editar-phone-check-checkbox-item">
                <Checkbox v-model="datoscampos.volume_down_button" inputId="vol_down" binary :invalid="!datoscampos.volume_down_button" />
                <label for="vol_down" class="editar-phone-check-checkbox-label">Botón Volumen -</label>
              </div>
              <div class="editar-phone-check-checkbox-item">
                <Checkbox v-model="datoscampos.primary_speaker" inputId="speaker" binary :invalid="!datoscampos.primary_speaker" />
                <label for="speaker" class="editar-phone-check-checkbox-label">Altavoz Principal</label>
              </div>
              <div class="editar-phone-check-checkbox-item">
                <Checkbox v-model="datoscampos.vibration" inputId="vibration" binary :invalid="!datoscampos.vibration" />
                <label for="vibration" class="editar-phone-check-checkbox-label">Vibración</label>
              </div>
              <div class="editar-phone-check-checkbox-item">
                <Checkbox v-model="datoscampos.wifi" inputId="wifi" binary :invalid="!datoscampos.wifi" />
                <label for="wifi" class="editar-phone-check-checkbox-label">WiFi</label>
              </div>
              <div class="editar-phone-check-checkbox-item">
                <Checkbox v-model="datoscampos.loud_speaker" inputId="loud_speaker" binary :invalid="!datoscampos.loud_speaker" />
                <label for="loud_speaker" class="editar-phone-check-checkbox-label">Altavoz</label>
              </div>
              <div class="editar-phone-check-checkbox-item">
                <Checkbox v-model="datoscampos.lcd" inputId="lcd" binary :invalid="!datoscampos.lcd" />
                <label for="lcd" class="editar-phone-check-checkbox-label">LCD</label>
              </div>
              <div class="editar-phone-check-checkbox-item">
                <Checkbox v-model="datoscampos.touch_screen" inputId="touch" binary :invalid="!datoscampos.touch_screen" />
                <label for="touch" class="editar-phone-check-checkbox-label">Pantalla Táctil</label>
              </div>
              <div class="editar-phone-check-checkbox-item">
                <Checkbox v-model="datoscampos.proximity_sensor" inputId="proximity" binary :invalid="!datoscampos.proximity_sensor" />
                <label for="proximity" class="editar-phone-check-checkbox-label">Sensor Proximidad</label>
              </div>
              <div class="editar-phone-check-checkbox-item">
                <Checkbox v-model="datoscampos.face_id" inputId="faceid" binary :invalid="!datoscampos.face_id" />
                <label for="faceid" class="editar-phone-check-checkbox-label">Face ID</label>
              </div>
              <div class="editar-phone-check-checkbox-item">
                <Checkbox v-model="datoscampos.display_quality" inputId="display" binary :invalid="!datoscampos.display_quality" />
                <label for="display" class="editar-phone-check-checkbox-label">Calidad Pantalla</label>
              </div>
              <div class="editar-phone-check-checkbox-item">
                <Checkbox v-model="datoscampos.button_responsiveness" inputId="buttons" binary :invalid="!datoscampos.button_responsiveness" />
                <label for="buttons" class="editar-phone-check-checkbox-label">Respuesta Botones</label>
              </div>
            </div>
          </div>

          <!-- Section 5: Detalles -->
          <div class="editar-phone-check-form-section">
            <h3 class="editar-phone-check-section-title">
              <i class="pi pi-align-left"></i>
              Detalles Adicionales
            </h3>
            <div class="editar-phone-check-form-group">
              <label class="editar-phone-check-label">Detalles</label>
              <Textarea
                v-model="datoscampos.detalles"
                rows="4"
                placeholder="Detalles adicionales de la revisión..."
                class="editar-phone-check-textarea"
              />
            </div>
          </div>

          <!-- Submit Button -->
          <div class="editar-phone-check-submit-container">
            <Button
              type="submit"
              label="Actualizar Revisión"
              icon="pi pi-save"
              severity="success"
              class="editar-phone-check-submit-btn"
            />
          </div>

        </form>
      </template>
    </Card>

  </div>
</main>
<Toast />
</template>

<style scoped>
.editar-phone-check-wrapper {
  min-height: 100vh;
  padding: 2rem;
  animation: fadeIn 0.3s ease-in;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.editar-phone-check-container {
  max-width: 1400px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

/* Header Styles */
.editar-phone-check-header {
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

.editar-phone-check-header-content {
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.editar-phone-check-icon-wrapper {
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

.editar-phone-check-icon {
  font-size: 2.5rem;
  color: white;
}

.editar-phone-check-title {
  font-size: 2rem;
  font-weight: 700;
  color: white;
  margin: 0;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.editar-phone-check-subtitle {
  font-size: 1rem;
  color: rgba(255, 255, 255, 0.9);
  margin: 0.25rem 0 0 0;
}

/* Navigation Card */
.editar-phone-check-nav-card {
  border: 2px solid #bfdbfe;
  border-radius: 16px;
  box-shadow: 0 4px 16px rgba(59, 130, 246, 0.1);
}

.editar-phone-check-nav-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
}

.editar-phone-check-nav-group {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.editar-phone-check-nav-title {
  font-size: 1rem;
  font-weight: 600;
  color: #1e40af;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.editar-phone-check-nav-buttons {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.editar-phone-check-nav-btn {
  flex: 1;
  min-width: 120px;
  transition: all 0.3s ease;
}

.editar-phone-check-nav-btn:hover {
  transform: translateY(-2px);
}

/* Section Divider */
.editar-phone-check-section-divider {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin: 1rem 0;
}

.editar-phone-check-divider-line {
  flex: 1;
  height: 2px;
  background: linear-gradient(90deg, transparent, #f97316, transparent);
}

.editar-phone-check-divider-badge {
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

/* Form Card */
.editar-phone-check-form-card {
  border: 2px solid #bfdbfe;
  border-radius: 16px;
  box-shadow: 0 4px 16px rgba(59, 130, 246, 0.1);
}

/* Form Sections */
.editar-phone-check-form-section {
  margin-bottom: 2rem;
  padding-bottom: 2rem;
  border-bottom: 2px solid #eff6ff;
}

.editar-phone-check-form-section:last-of-type {
  border-bottom: none;
  margin-bottom: 0;
  padding-bottom: 0;
}

.editar-phone-check-section-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: #1e40af;
  margin-bottom: 1.5rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding-bottom: 0.75rem;
  border-bottom: 2px solid #bfdbfe;
}

.editar-phone-check-section-title i {
  font-size: 1.5rem;
  color: #3b82f6;
}

/* Form Grid */
.editar-phone-check-form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
}

.editar-phone-check-form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.editar-phone-check-form-group-span-2 {
  grid-column: span 2;
}

.editar-phone-check-label {
  font-weight: 600;
  color: #1e40af;
  font-size: 0.875rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.editar-phone-check-input {
  border: 2px solid #bfdbfe;
  border-radius: 8px;
  padding: 0.625rem;
  transition: all 0.3s ease;
}

.editar-phone-check-input:focus {
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.editar-phone-check-textarea {
  border: 2px solid #bfdbfe;
  border-radius: 8px;
  padding: 0.75rem;
  transition: all 0.3s ease;
  resize: vertical;
}

.editar-phone-check-textarea:focus {
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

/* Checkboxes Grid */
.editar-phone-check-checkboxes-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1rem;
}

.editar-phone-check-checkbox-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  border: 2px solid #bfdbfe;
  border-radius: 8px;
  background: #eff6ff;
  transition: all 0.3s ease;
}

.editar-phone-check-checkbox-item:hover {
  border-color: #3b82f6;
  background: #dbeafe;
  transform: translateX(4px);
}

.editar-phone-check-checkbox-label {
  font-weight: 500;
  color: #1e40af;
  font-size: 0.875rem;
  cursor: pointer;
}

/* Submit Button */
.editar-phone-check-submit-container {
  display: flex;
  justify-content: center;
  margin-top: 2rem;
}

.editar-phone-check-submit-btn {
  padding: 1rem 3rem;
  font-size: 1.125rem;
  font-weight: 600;
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(34, 197, 94, 0.3);
  transition: all 0.3s ease;
}

.editar-phone-check-submit-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 32px rgba(34, 197, 94, 0.4);
}

/* Responsive */
@media (max-width: 768px) {
  .editar-phone-check-wrapper {
    padding: 1rem;
  }

  .editar-phone-check-header {
    padding: 1.5rem;
  }

  .editar-phone-check-icon-wrapper {
    width: 60px;
    height: 60px;
  }

  .editar-phone-check-icon {
    font-size: 2rem;
  }

  .editar-phone-check-title {
    font-size: 1.5rem;
  }

  .editar-phone-check-nav-grid {
    grid-template-columns: 1fr;
  }

  .editar-phone-check-form-grid {
    grid-template-columns: 1fr;
  }

  .editar-phone-check-form-group-span-2 {
    grid-column: span 1;
  }

  .editar-phone-check-checkboxes-grid {
    grid-template-columns: 1fr;
  }
}
</style>
