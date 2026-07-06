
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
  mensajetoast,
  lasMayusculas} from '../../funciones/funciones.js';
import Swal from 'sweetalert2'
const toast = useToast();
/************************************************************************/
const proveedoresData = ref([])
const proveedoresDataNames = ref([])
/************************************************************************/
const marcasData = ref([])
const marcasDataNames = ref([])
/************************************************************************/
const tecnicosData = ref([])
const tecnicosDataNames = ref([])
/************************************************************************/
const equiposData = ref([])
const equiposDataNames = ref([])
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
const datoscamposPhone_check = ref({})
const codigoUnico = ref(generarCodigoUnico());
const fecha = ref(nfecha('fecha'));
const position = "top";
/************************************************************************/
const fetchAndSetupData = async () => {
    const jsonData = await arrayToObjetoFromTablaOffline('phone_check');
    datoscamposPhone_check.value = jsonData;
    datoscamposPhone_check.value.fecha_de_compra = nfecha('fecha')
    datoscamposPhone_check.value.hora = nfecha('hora')
    datoscamposPhone_check.value.almacenamiento = '64GB'
    datoscamposPhone_check.value.test_3utool = 'NO'
    datoscamposPhone_check.value.grado = 'A'
    datoscamposPhone_check.value.bateria = '100'
    datoscamposPhone_check.value.desbloqueo_redes = 'FACTORY'
    datoscamposPhone_check.value.estado = 'EN REVISION'
    datoscamposPhone_check.value.costo = '0.00'
    datoscamposPhone_check.value.marca = 'Apple'
    datoscamposPhone_check.value.equipo = 'CELULAR'
    datoscamposPhone_check.value.color = 'NEGRO'
    datoscamposPhone_check.value.carrier = 'N/A'
    datoscamposPhone_check.value.almacen = datosEmpresa.empresa.nombre
};
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
const fnRevisaCheck = ()=>{
datoscamposPhone_check.value.icloud = false
datoscamposPhone_check.value.base_id = true
datoscamposPhone_check.value.status_caution = true
datoscamposPhone_check.value.front_camera = true
datoscamposPhone_check.value.rear_camera = true
datoscamposPhone_check.value.telephoto_camera_quality = true
datoscamposPhone_check.value.ultra_wide_camera_quality = true
datoscamposPhone_check.value.volume_up_button = true
datoscamposPhone_check.value.volume_down_button = true
datoscamposPhone_check.value.primary_speaker = true
datoscamposPhone_check.value.vibration = true
datoscamposPhone_check.value.wifi = true
datoscamposPhone_check.value.loud_speaker = true
datoscamposPhone_check.value.lcd = true
datoscamposPhone_check.value.touch_screen = true
datoscamposPhone_check.value.proximity_sensor = true
datoscamposPhone_check.value.face_id = true
datoscamposPhone_check.value.display_quality = true
datoscamposPhone_check.value.button_responsiveness = true
}
/************************************************************************/

const fetchEquipos = async () => {
  try {
    const response = await peticionesFetchOffline('getDataAsArray', 'equipo');
    equiposData.value = response;
    equiposDataNames.value = response.map(equipos=>equipos.nombre);
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to fetch data from equipos',
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
await fetchAndSetupData()
await fetchProveedores()
await fetchMarcas()
await fetchTecnicos()
await fetchEquipos()
  datoscamposPhone_check.value.icloud = false
datoscamposPhone_check.value.tecnico = tecnicosDataNames.value[0]
fnRevisaCheck()
});
/************************************************************************/
function convertirBooleanoAString(valor) {
  if (typeof valor === 'boolean') {
    return valor ? 'true' : 'false';
  }
  return valor;
}
/************************************************************************/
async function enviarDatos(event) {
    event.preventDefault();
  const url = link.value+api.value+"/insertar/phone_check";
  if (!datoscamposPhone_check.value) {
    toast.add({ severity: 'error', summary: 'Error', detail: 'Datos incompletos, no se puede Enviar.', life: 3000 });
    return;
  }
  if (datoscamposPhone_check.value.hasOwnProperty('created_at')) {
     datoscamposPhone_check.value.created_at = nfecha('timestamp')
     datoscamposPhone_check.value.updated_at = nfecha('timestamp')
    }



    for (let prop in datoscamposPhone_check.value) {
      datoscamposPhone_check.value[prop] = convertirBooleanoAString(datoscamposPhone_check.value[prop]);
    }

  const envioDatos = await peticionesFetchOffline('insertData', 'phone_check', JSON.stringify(datoscamposPhone_check.value));
  if (envioDatos[0] == 'ok') {
     toast.add({ severity: 'success', summary: 'Éxito', detail: 'Datos Agregados con éxito.', life: 3000 });
Swal.fire({
  title: "Datos Agregados",
  text: "Que hacemos ahora?",
  icon: "warning",
  showCancelButton: true,
  confirmButtonText: "Agregar Otro!",
  cancelButtonText: "No, Regresar al Inicio!",
 }).then(async(result) => {
  if (result.isConfirmed) {
      fetchAndSetupData()
} else if (result.dismiss === Swal.DismissReason.cancel) {
    router.push({ path: `/phone_check` });
  }
})
  }else{
    toast.add({ severity: 'error', summary: 'Error', detail: 'Fallo al Agregar los datos.', life: 3000 });
  }
}
/************************************************************************/
const verificaIMEI = async ()=>{
  if (datoscamposPhone_check.value.imei == '') {
    toast.add({ severity: 'error', summary: 'Error', detail: 'Debe escribir un IMEI válido', life: 3000 });
    return
  }
  const datos =
{
  "service": "0",
  "imei": datoscamposPhone_check.value.imei,
  "imei2": "",
  "serial": "",
  "key": "WLZ-OJ2-7HJ-0XH-DJ6-AVZ-OXU-1XB"
}
    try {
        const prueba = await enviarDatosPorPost('https://api.ifreeicloud.co.uk', datos,tokenCifrado.value);

        if (prueba.success) {
            toast.add({ severity: 'success', summary: 'Éxito', detail: 'Datos encontrados ('+prueba.object.modelName+')', life: 3000 });
               datoscamposPhone_check.value.marca = prueba.object.brand;
               datoscamposPhone_check.value.modelo = prueba.object.modelName;
        } else {
            toast.add({ severity: 'error', summary: 'Error', detail: 'No se encuentran Datos', life: 3000 });
        }
    } catch (error) {
         toast.add({ severity: 'error', summary: 'Error', detail: 'Error de peticion', life: 3000 });
    }

}
/************************************************************************/
const fnBuscarPorImei = async () => {
    try {
        const confirmacion = await Swal.fire({
            title: 'Confirmación',
            text: 'Esta operación consume créditos, ¿desea continuar?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Sí, continuar',
            cancelButtonText: 'Cancelar'
        });

        if (!confirmacion.isConfirmed) {
            return; // Si el usuario cancela, no ejecutamos la operación
        }

        const datos = {
            "service": 225,
            "imei": datoscamposPhone_check.value.imei,
            "key": "JKD-QC9-9L9-9C6-GT7-J2I-LIV-U3M"
        };

        const consultaServidor = await enviarDatosPorPost('https://api.ifreeicloud.co.uk', datos, tokenCifrado.value);

        if (consultaServidor.object && consultaServidor.object.capacity && consultaServidor.object.color) {
            datoscamposPhone_check.value.almacenamiento = consultaServidor.object.capacity;
            datoscamposPhone_check.value.color = consultaServidor.object.color;
            toast.add({ severity: 'success', summary: 'Éxito', detail: 'Datos En.', life: 3000 });
        } else {
            toast.add({ severity: 'error', summary: 'Error', detail: 'No se encuentran Datos', life: 3000 });
        }
    } catch (error) {
        toast.add({ severity: 'error', summary: 'Error', detail: 'Error de peticion', life: 3000 });
    }
};


/************************************************************************/
</script>
<template>
<main class="crear-phone-check-wrapper">
  <div class="crear-phone-check-container">

    <!-- Modern Header -->
    <div class="crear-phone-check-header">
      <div class="crear-phone-check-header-content">
        <div class="crear-phone-check-icon-wrapper">
          <i class="pi pi-mobile crear-phone-check-icon"></i>
        </div>
        <div>
          <h1 class="crear-phone-check-title">Crear Revisión de Teléfono</h1>
          <p class="crear-phone-check-subtitle">Registra la revisión técnica del dispositivo</p>
        </div>
      </div>
    </div>

    <!-- Actions Card -->
    <Card class="crear-phone-check-actions-card">
      <template #content>
        <div class="crear-phone-check-actions">
          <Button
            icon="pi pi-home"
            label="Inicio"
            severity="secondary"
            @click="router.push('/phone_check')"
            class="crear-phone-check-action-btn"
          />
        </div>
      </template>
    </Card>

    <!-- Form Card -->
    <Card class="crear-phone-check-form-card">
      <template #content>
        <form @submit.prevent="enviarDatos">

          <!-- Section 1: Información de Compra -->
          <div class="crear-phone-check-form-section">
            <h3 class="crear-phone-check-section-title">
              <i class="pi pi-shopping-cart"></i>
              Información de Compra
            </h3>
            <div class="crear-phone-check-form-grid">
              <div class="crear-phone-check-form-group">
                <label class="crear-phone-check-label">Proveedor</label>
                <Dropdown
                  v-model="datoscamposPhone_check.proveedor"
                  :options="proveedoresDataNames"
                  placeholder="Seleccione proveedor"
                  class="crear-phone-check-input"
                />
              </div>
              <div class="crear-phone-check-form-group">
                <label class="crear-phone-check-label">No. Compra</label>
                <InputText
                  v-model="datoscamposPhone_check.no_compra"
                  placeholder="No compra"
                  class="crear-phone-check-input"
                />
              </div>
              <div class="crear-phone-check-form-group">
                <label class="crear-phone-check-label">Fecha de Compra</label>
                <DatePicker
                  v-model="datoscamposPhone_check.fecha_de_compra"
                  showButtonBar
                  fluid
                  class="crear-phone-check-input"
                />
              </div>
              <div class="crear-phone-check-form-group">
                <label class="crear-phone-check-label">Hora</label>
                <DatePicker
                  v-model="datoscamposPhone_check.hora"
                  timeOnly
                  fluid
                  class="crear-phone-check-input"
                />
              </div>
            </div>
          </div>

          <!-- Section 2: Datos del Dispositivo -->
          <div class="crear-phone-check-form-section">
            <h3 class="crear-phone-check-section-title">
              <i class="pi pi-mobile"></i>
              Datos del Dispositivo
            </h3>
            <div class="crear-phone-check-form-grid">
              <div class="crear-phone-check-form-group">
                <label class="crear-phone-check-label">Equipo</label>
                <Dropdown
                  v-model="datoscamposPhone_check.equipo"
                  :options="equiposDataNames"
                  editable
                  placeholder="Seleccione equipo"
                  class="crear-phone-check-input"
                />
              </div>
              <div class="crear-phone-check-form-group crear-phone-check-form-group-span-2">
                <label class="crear-phone-check-label">IMEI</label>
                <InputGroup>
                  <InputMask
                    v-model="datoscamposPhone_check.imei"
                    mask="999999999999999"
                    placeholder="IMEI"
                    @blur="verificaIMEI"
                    class="crear-phone-check-input"
                  />
                  <InputGroupAddon>
                    <Button
                      icon="pi pi-search"
                      severity="secondary"
                      variant="text"
                      @click="fnBuscarPorImei"
                    />
                  </InputGroupAddon>
                </InputGroup>
              </div>
              <div class="crear-phone-check-form-group">
                <label class="crear-phone-check-label">Marca</label>
                <Dropdown
                  v-model="datoscamposPhone_check.marca"
                  :options="marcasDataNames"
                  editable
                  placeholder="Seleccione marca"
                  class="crear-phone-check-input"
                />
              </div>
              <div class="crear-phone-check-form-group">
                <label class="crear-phone-check-label">Modelo</label>
                <InputText
                  v-model="datoscamposPhone_check.modelo"
                  placeholder="Modelo"
                  class="crear-phone-check-input"
                />
              </div>
              <div class="crear-phone-check-form-group">
                <label class="crear-phone-check-label">Serial</label>
                <InputText
                  v-model="datoscamposPhone_check.serial"
                  placeholder="Serial"
                  class="crear-phone-check-input"
                />
              </div>
              <div class="crear-phone-check-form-group">
                <label class="crear-phone-check-label">Color</label>
                <InputText
                  v-model="datoscamposPhone_check.color"
                  placeholder="Color"
                  class="crear-phone-check-input"
                />
              </div>
              <div class="crear-phone-check-form-group">
                <label class="crear-phone-check-label">Carrier</label>
                <InputText
                  v-model="datoscamposPhone_check.carrier"
                  placeholder="Carrier"
                  class="crear-phone-check-input"
                />
              </div>
            </div>
          </div>

          <!-- Section 3: Revisión Técnica -->
          <div class="crear-phone-check-form-section">
            <h3 class="crear-phone-check-section-title">
              <i class="pi pi-wrench"></i>
              Revisión Técnica
            </h3>
            <div class="crear-phone-check-form-grid">
              <div class="crear-phone-check-form-group">
                <label class="crear-phone-check-label">Técnico</label>
                <Dropdown
                  v-model="datoscamposPhone_check.tecnico"
                  :options="tecnicosDataNames"
                  editable
                  placeholder="Seleccione técnico"
                  class="crear-phone-check-input"
                />
              </div>
              <div class="crear-phone-check-form-group">
                <label class="crear-phone-check-label">Estado</label>
                <Dropdown
                  v-model="datoscamposPhone_check.estado"
                  :options="['EN REVISION','REVISADO','PARA PIEZAS','DEVUELTO']"
                  placeholder="Seleccione estado"
                  class="crear-phone-check-input"
                />
              </div>
              <div class="crear-phone-check-form-group">
                <label class="crear-phone-check-label">Grado</label>
                <Dropdown
                  v-model="datoscamposPhone_check.grado"
                  :options="['A','B','C','D','F']"
                  placeholder="Seleccione grado"
                  class="crear-phone-check-input"
                />
              </div>
              <div class="crear-phone-check-form-group">
                <label class="crear-phone-check-label">Batería (%)</label>
                <InputText
                  v-model="datoscamposPhone_check.bateria"
                  placeholder="Batería"
                  class="crear-phone-check-input"
                />
              </div>
              <div class="crear-phone-check-form-group">
                <label class="crear-phone-check-label">Almacenamiento</label>
                <Dropdown
                  v-model="datoscamposPhone_check.almacenamiento"
                  :options="['4GB','8GB','16GB','32GB','64GB','128GB','256GB','512GB','1TB','2TB','4TB']"
                  placeholder="Seleccione almacenamiento"
                  class="crear-phone-check-input"
                />
              </div>
              <div class="crear-phone-check-form-group">
                <label class="crear-phone-check-label">Desbloqueo de Redes</label>
                <Dropdown
                  v-model="datoscamposPhone_check.desbloqueo_redes"
                  :options="['FACTORY','BLOQUEADO','TURBO SIM','SEMI FACTORY','BY PASS','OTRO']"
                  placeholder="Seleccione desbloqueo"
                  class="crear-phone-check-input"
                />
              </div>
              <div class="crear-phone-check-form-group">
                <label class="crear-phone-check-label">Test 3uTool</label>
                <Dropdown
                  v-model="datoscamposPhone_check.test_3utool"
                  :options="['SI','NO']"
                  placeholder="Test 3uTool"
                  class="crear-phone-check-input"
                />
              </div>
              <div class="crear-phone-check-form-group">
                <label class="crear-phone-check-label">Costo</label>
                <InputText
                  v-model="datoscamposPhone_check.costo"
                  placeholder="0.00"
                  class="crear-phone-check-input"
                />
              </div>
            </div>
          </div>

          <!-- Section 4: Características del Dispositivo -->
          <div class="crear-phone-check-form-section">
            <h3 class="crear-phone-check-section-title">
              <i class="pi pi-check-circle"></i>
              Características del Dispositivo
            </h3>
            <div class="crear-phone-check-checkboxes-grid">
              <div class="crear-phone-check-checkbox-item">
                <Checkbox v-model="datoscamposPhone_check.icloud" inputId="icloud" binary indeterminate :invalid="!datoscamposPhone_check.icloud" />
                <label for="icloud" class="crear-phone-check-checkbox-label">iCloud</label>
              </div>
              <div class="crear-phone-check-checkbox-item">
                <Checkbox v-model="datoscamposPhone_check.base_id" inputId="base_id" binary :invalid="!datoscamposPhone_check.base_id" />
                <label for="base_id" class="crear-phone-check-checkbox-label">Base ID</label>
              </div>
              <div class="crear-phone-check-checkbox-item">
                <Checkbox v-model="datoscamposPhone_check.status_caution" inputId="status_caution" binary :invalid="!datoscamposPhone_check.status_caution" />
                <label for="status_caution" class="crear-phone-check-checkbox-label">Status Caution</label>
              </div>
              <div class="crear-phone-check-checkbox-item">
                <Checkbox v-model="datoscamposPhone_check.front_camera" inputId="front_camera" binary :invalid="!datoscamposPhone_check.front_camera" />
                <label for="front_camera" class="crear-phone-check-checkbox-label">Cámara Frontal</label>
              </div>
              <div class="crear-phone-check-checkbox-item">
                <Checkbox v-model="datoscamposPhone_check.rear_camera" inputId="rear_camera" binary :invalid="!datoscamposPhone_check.rear_camera" />
                <label for="rear_camera" class="crear-phone-check-checkbox-label">Cámara Trasera</label>
              </div>
              <div class="crear-phone-check-checkbox-item">
                <Checkbox v-model="datoscamposPhone_check.telephoto_camera_quality" inputId="telephoto" binary :invalid="!datoscamposPhone_check.telephoto_camera_quality" />
                <label for="telephoto" class="crear-phone-check-checkbox-label">Teleobjetivo</label>
              </div>
              <div class="crear-phone-check-checkbox-item">
                <Checkbox v-model="datoscamposPhone_check.ultra_wide_camera_quality" inputId="ultrawide" binary :invalid="!datoscamposPhone_check.ultra_wide_camera_quality" />
                <label for="ultrawide" class="crear-phone-check-checkbox-label">Ultra Gran Angular</label>
              </div>
              <div class="crear-phone-check-checkbox-item">
                <Checkbox v-model="datoscamposPhone_check.volume_up_button" inputId="vol_up" binary :invalid="!datoscamposPhone_check.volume_up_button" />
                <label for="vol_up" class="crear-phone-check-checkbox-label">Botón Volumen +</label>
              </div>
              <div class="crear-phone-check-checkbox-item">
                <Checkbox v-model="datoscamposPhone_check.volume_down_button" inputId="vol_down" binary :invalid="!datoscamposPhone_check.volume_down_button" />
                <label for="vol_down" class="crear-phone-check-checkbox-label">Botón Volumen -</label>
              </div>
              <div class="crear-phone-check-checkbox-item">
                <Checkbox v-model="datoscamposPhone_check.primary_speaker" inputId="speaker" binary :invalid="!datoscamposPhone_check.primary_speaker" />
                <label for="speaker" class="crear-phone-check-checkbox-label">Altavoz Principal</label>
              </div>
              <div class="crear-phone-check-checkbox-item">
                <Checkbox v-model="datoscamposPhone_check.vibration" inputId="vibration" binary :invalid="!datoscamposPhone_check.vibration" />
                <label for="vibration" class="crear-phone-check-checkbox-label">Vibración</label>
              </div>
              <div class="crear-phone-check-checkbox-item">
                <Checkbox v-model="datoscamposPhone_check.wifi" inputId="wifi" binary :invalid="!datoscamposPhone_check.wifi" />
                <label for="wifi" class="crear-phone-check-checkbox-label">WiFi</label>
              </div>
              <div class="crear-phone-check-checkbox-item">
                <Checkbox v-model="datoscamposPhone_check.loud_speaker" inputId="loud_speaker" binary :invalid="!datoscamposPhone_check.loud_speaker" />
                <label for="loud_speaker" class="crear-phone-check-checkbox-label">Altavoz</label>
              </div>
              <div class="crear-phone-check-checkbox-item">
                <Checkbox v-model="datoscamposPhone_check.lcd" inputId="lcd" binary :invalid="!datoscamposPhone_check.lcd" />
                <label for="lcd" class="crear-phone-check-checkbox-label">LCD</label>
              </div>
              <div class="crear-phone-check-checkbox-item">
                <Checkbox v-model="datoscamposPhone_check.touch_screen" inputId="touch" binary :invalid="!datoscamposPhone_check.touch_screen" />
                <label for="touch" class="crear-phone-check-checkbox-label">Pantalla Táctil</label>
              </div>
              <div class="crear-phone-check-checkbox-item">
                <Checkbox v-model="datoscamposPhone_check.proximity_sensor" inputId="proximity" binary :invalid="!datoscamposPhone_check.proximity_sensor" />
                <label for="proximity" class="crear-phone-check-checkbox-label">Sensor Proximidad</label>
              </div>
              <div class="crear-phone-check-checkbox-item">
                <Checkbox v-model="datoscamposPhone_check.face_id" inputId="faceid" binary :invalid="!datoscamposPhone_check.face_id" />
                <label for="faceid" class="crear-phone-check-checkbox-label">Face ID</label>
              </div>
              <div class="crear-phone-check-checkbox-item">
                <Checkbox v-model="datoscamposPhone_check.display_quality" inputId="display" binary :invalid="!datoscamposPhone_check.display_quality" />
                <label for="display" class="crear-phone-check-checkbox-label">Calidad Pantalla</label>
              </div>
              <div class="crear-phone-check-checkbox-item">
                <Checkbox v-model="datoscamposPhone_check.button_responsiveness" inputId="buttons" binary :invalid="!datoscamposPhone_check.button_responsiveness" />
                <label for="buttons" class="crear-phone-check-checkbox-label">Respuesta Botones</label>
              </div>
            </div>
          </div>

          <!-- Section 5: Detalles -->
          <div class="crear-phone-check-form-section">
            <h3 class="crear-phone-check-section-title">
              <i class="pi pi-align-left"></i>
              Detalles Adicionales
            </h3>
            <div class="crear-phone-check-form-group">
              <label class="crear-phone-check-label">Detalles</label>
              <Textarea
                v-model="datoscamposPhone_check.detalles"
                rows="4"
                placeholder="Detalles adicionales de la revisión..."
                class="crear-phone-check-textarea"
              />
            </div>
          </div>

          <!-- Submit Button -->
          <div class="crear-phone-check-submit-container">
            <Button
              type="submit"
              label="Crear Revisión"
              icon="pi pi-check"
              class="crear-phone-check-submit-btn"
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
.crear-phone-check-wrapper {
  min-height: 100vh;
  padding: 2rem;
  animation: fadeIn 0.3s ease-in;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.crear-phone-check-container {
  max-width: 1400px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

/* Header Styles */
.crear-phone-check-header {
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

.crear-phone-check-header-content {
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.crear-phone-check-icon-wrapper {
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

.crear-phone-check-icon {
  font-size: 2.5rem;
  color: white;
}

.crear-phone-check-title {
  font-size: 2rem;
  font-weight: 700;
  color: white;
  margin: 0;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.crear-phone-check-subtitle {
  font-size: 1rem;
  color: rgba(255, 255, 255, 0.9);
  margin: 0.25rem 0 0 0;
}

/* Actions Card */
.crear-phone-check-actions-card {
  border: 2px solid #bfdbfe;
  border-radius: 16px;
  box-shadow: 0 4px 16px rgba(59, 130, 246, 0.1);
}

.crear-phone-check-actions {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.crear-phone-check-action-btn {
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  border: none;
  transition: all 0.3s ease;
}

.crear-phone-check-action-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 16px rgba(59, 130, 246, 0.3);
}

/* Form Card */
.crear-phone-check-form-card {
  border: 2px solid #bfdbfe;
  border-radius: 16px;
  box-shadow: 0 4px 16px rgba(59, 130, 246, 0.1);
}

/* Form Sections */
.crear-phone-check-form-section {
  margin-bottom: 2rem;
  padding-bottom: 2rem;
  border-bottom: 2px solid #eff6ff;
}

.crear-phone-check-form-section:last-of-type {
  border-bottom: none;
  margin-bottom: 0;
  padding-bottom: 0;
}

.crear-phone-check-section-title {
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

.crear-phone-check-section-title i {
  font-size: 1.5rem;
  color: #3b82f6;
}

/* Form Grid */
.crear-phone-check-form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
}

.crear-phone-check-form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.crear-phone-check-form-group-span-2 {
  grid-column: span 2;
}

.crear-phone-check-label {
  font-weight: 600;
  color: #1e40af;
  font-size: 0.875rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.crear-phone-check-input {
  border: 2px solid #bfdbfe;
  border-radius: 8px;
  padding: 0.625rem;
  transition: all 0.3s ease;
}

.crear-phone-check-input:focus {
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.crear-phone-check-textarea {
  border: 2px solid #bfdbfe;
  border-radius: 8px;
  padding: 0.75rem;
  transition: all 0.3s ease;
  resize: vertical;
}

.crear-phone-check-textarea:focus {
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

/* Checkboxes Grid */
.crear-phone-check-checkboxes-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1rem;
}

.crear-phone-check-checkbox-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  border: 2px solid #bfdbfe;
  border-radius: 8px;
  background: #eff6ff;
  transition: all 0.3s ease;
}

.crear-phone-check-checkbox-item:hover {
  border-color: #3b82f6;
  background: #dbeafe;
  transform: translateX(4px);
}

.crear-phone-check-checkbox-label {
  font-weight: 500;
  color: #1e40af;
  font-size: 0.875rem;
  cursor: pointer;
}

/* Submit Button */
.crear-phone-check-submit-container {
  display: flex;
  justify-content: center;
  margin-top: 2rem;
}

.crear-phone-check-submit-btn {
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  border: none;
  padding: 1rem 3rem;
  font-size: 1.125rem;
  font-weight: 600;
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(59, 130, 246, 0.3);
  transition: all 0.3s ease;
}

.crear-phone-check-submit-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 32px rgba(59, 130, 246, 0.4);
}

/* Responsive */
@media (max-width: 768px) {
  .crear-phone-check-wrapper {
    padding: 1rem;
  }

  .crear-phone-check-header {
    padding: 1.5rem;
  }

  .crear-phone-check-icon-wrapper {
    width: 60px;
    height: 60px;
  }

  .crear-phone-check-icon {
    font-size: 2rem;
  }

  .crear-phone-check-title {
    font-size: 1.5rem;
  }

  .crear-phone-check-form-grid {
    grid-template-columns: 1fr;
  }

  .crear-phone-check-form-group-span-2 {
    grid-column: span 1;
  }

  .crear-phone-check-checkboxes-grid {
    grid-template-columns: 1fr;
  }
}
</style>
