
<script setup>
import { ref, onMounted, nextTick, watchEffect, watch } from 'vue';
import { useToast } from "primevue/usetoast";
import { useRouter, useRoute } from 'vue-router';
const router = useRouter();
const route = useRoute();
import {
nfecha,
arrayToObjetoFromTabla,
peticionesFetch,
obtenerIdsSeleccionados,
crearTablaSiNoExiste,
encryptarPassword,
peticionesFetchOffline,
buscadorArrayObjeto,
envioElectron,
generarCodigoUnico } from '@/funciones/funciones.js';
import Swal from 'sweetalert2'
import Accordion from 'primevue/accordion';
import AccordionPanel from 'primevue/accordionpanel';
import AccordionHeader from 'primevue/accordionheader';
import AccordionContent from 'primevue/accordioncontent';
const toast = useToast();
/************************************************************************/
import TablaJSON from '@/components/TablaJSON.vue'

/************************************************************************/

import flatPickr from 'vue-flatpickr-component';
import 'flatpickr/dist/flatpickr.css';
/************************************************************************/
  const basic = ref({
    dateFormat: 'd/m/Y',
  });
/************************************************************************/
import {useDatosEmpresa} from '@/stores'
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
const empleadosArray = ref([]);
const cargosArray = ref([]);
/************************************************************************/
const datoscamposEmpleados = ref({})
const codigoUnico = ref(generarCodigoUnico());
const fecha = ref(nfecha('fecha'));
const position = "top";
/************************************************************************/
async function campos() {
  const campos = await arrayToObjetoFromTabla('empleados');
  datoscamposEmpleados.value = campos;
  datoscamposEmpleados.value.codigo_empleado = generarCodigoUnico();
  datoscamposEmpleados.value.sexo = 'HOMBRE';
  datoscamposEmpleados.value.fecha_ingreso = nfecha('fecha');
  datoscamposEmpleados.value.tipo_contrato = 'FIJO';
  datoscamposEmpleados.value.estado = 'ACTIVO';
  datoscamposEmpleados.value.turno = 'DIURNO';
  datoscamposEmpleados.value.sueldo_base = '0.00';
  datoscamposEmpleados.value.comision_porcentaje = '0.00';
  datoscamposEmpleados.value.retencion_afp = '0.00';
  datoscamposEmpleados.value.retencion_sfs = '0.00';
  datoscamposEmpleados.value.retencion_isr = '0.00';
  datoscamposEmpleados.value.bono_fijo = '0.00';
  datoscamposEmpleados.value.otros_descuentos = '0.00';
  datoscamposEmpleados.value.tipo_pago = 'EFECTIVO';
  datoscamposEmpleados.value.monto_prestamos = '0.00';
  datoscamposEmpleados.value.monto_horas_extras = '0.00';
  datoscamposEmpleados.value.fecha_creacion = nfecha('fecha');
  datoscamposEmpleados.value.fecha_actualizacion = nfecha('fecha');

}
/************************************************************************/
watch(() => datoscamposEmpleados.value.sueldo_base, (nuevoValor) => {
  const sueldo = parseFloat(nuevoValor) || 0;
  datoscamposEmpleados.value.retencion_afp = (sueldo * 0.0287).toFixed(2);
  datoscamposEmpleados.value.retencion_sfs = (sueldo * 0.0304).toFixed(2);
});
/************************************************************************/
const fetchAndSetupData = async () => {
const response = await peticionesFetchOffline('getDataAsArray', 'empleados');
    const jsonData = response.reverse();
    empleadosArray.value = jsonData;
};
/************************************************************************/
const fetchCargos = async () => {
const response = await peticionesFetchOffline('getDataAsArray', 'cargos');
    const jsonData = response.reverse();
    cargosArray.value = jsonData;
};
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
onMounted(async() => {
await datosConfig()
tokenCifrado.value = await encryptarPassword(token.value, 10);
await fetchAndSetupData()
await fetchCargos()
await campos()
});
/************************************************************************/
async function enviarDatos(event) {
    event.preventDefault();
  const url = link.value+api.value+"/insertar/empleados";
  if (!datoscamposEmpleados.value) {
    toast.add({ severity: 'error', summary: 'Error', detail: 'Datos incompletos, no se puede Enviar.', life: 3000 });
    return;
  }
  if (datoscamposEmpleados.value.hasOwnProperty('created_at')) {
     datoscamposEmpleados.value.created_at = nfecha('timestamp')
     datoscamposEmpleados.value.updated_at = nfecha('timestamp')
    }
     datoscamposEmpleados.value.supervisor = datoscamposEmpleados.value.supervisor?.nombre || ''
     datoscamposEmpleados.value.cargo = datoscamposEmpleados.value.cargo?.nombre || ''

  const datosEnviar = JSON.parse(JSON.stringify(datoscamposEmpleados.value));
  const envioDatos = await peticionesFetchOffline('insertData','empleados', JSON.stringify(datosEnviar));
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
    router.push({ path: `/empleados` });
  }
})
  }else{
    toast.add({ severity: 'error', summary: 'Error', detail: 'Fallo al Agregar los datos.', life: 3000 });
  }
}
/************************************************************************/
const buscarDatosCedula = async()=>{
  const consulta = await peticionesFetch(
                'https://demo.tmposrd.com/api2',
                'buscarcedula',
                { cedula: datoscamposEmpleados.value.cedula },
                tokenCifrado.value,
                'POST'
              );
  if(consulta.datos){
    const fechaN = consulta.datos.birth_day.split('-')
   // datoscamposEmpleados.value.rnc = consulta.datos.document
    datoscamposEmpleados.value.nombre = consulta.datos.name
    datoscamposEmpleados.value.sexo = consulta.datos.sex === 'M'?'HOMBRE':'MUJER'
    datoscamposEmpleados.value.edad = consulta.datos.age
    datoscamposEmpleados.value.fecha_nacimiento = fechaN[2]+'/'+fechaN[1]+'/'+fechaN[0]
  }else{
    toast.add({ severity: 'error', summary: 'Error', detail: 'Datos incompletos, o no se encuentra registro.', life: 3000 });
  }
}


/************************************************************************/
</script>
<template>
<main class="content-wrapper">
  <div class="w-full px-4 mt-5">

    <!-- Header profesional -->
    <div class="mb-6">
      <div class="flex items-center justify-between mb-4">
        <div>
          <h1 class="text-3xl font-bold text-gray-800 flex items-center gap-3">
            <i class="pi pi-user-plus text-teal-600"></i>
            Nuevo Empleado
          </h1>
          <p class="text-gray-500 mt-1">Registra un nuevo empleado en el sistema</p>
        </div>
        <Button
          icon="pi pi-arrow-left"
          label="Regresar"
          severity="secondary"
          outlined
          @click="router.push('/empleados')"
          class="hover:scale-105 transition-transform"
        />
      </div>
    </div>

    <!-- Card principal -->
    <Card class="shadow-xl border-0">
      <template #content>
        <form id="formularioGenerar" @submit.prevent="enviarDatos">

          <!-- Accordion con secciones -->
          <Accordion :value="['0', '1']" multiple class="modern-accordion">

            <!-- Sección 1: Información Personal -->
            <AccordionPanel value="0">
              <AccordionHeader>
                <div class="flex items-center gap-3">
                  <div class="bg-blue-100 text-blue-600 rounded-full w-10 h-10 flex items-center justify-center">
                    <i class="pi pi-user text-lg"></i>
                  </div>
                  <div>
                    <p class="font-bold text-gray-800">Información Personal</p>
                    <p class="text-xs text-gray-500">Datos personales y de contacto del empleado</p>
                  </div>
                </div>
              </AccordionHeader>
              <AccordionContent>
                <div class="grid grid-cols-12 gap-4 mt-4">

                  <div class="col-span-12 sm:col-span-12 md:col-span-2 lg:col-span-2 xl:col-span-2 2xl:col-span-2">
                    <label for="codigo_empleado" class="block text-sm font-medium text-gray-700 dark:text-gray-400">Código Empleado</label>
                    <InputText type="text" fluid readonly v-model="datoscamposEmpleados.codigo_empleado" placeholder="Código" name="crearcodigo_empleado" id="codigo_empleado" />
                  </div>

                  <div class="col-span-12 sm:col-span-12 md:col-span-3 lg:col-span-3 xl:col-span-3 2xl:col-span-3">
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-400" for="cedula">Cédula</label>
                    <InputGroup>
                      <InputText placeholder="Cédula" @keydown.enter="buscarDatosCedula" v-model="datoscamposEmpleados.cedula" />
                      <InputGroupAddon>
                        <Button icon="pi pi-search" @click="buscarDatosCedula" severity="secondary" variant="text" />
                      </InputGroupAddon>
                    </InputGroup>
                  </div>

                  <div class="col-span-12 sm:col-span-12 md:col-span-7 lg:col-span-7 xl:col-span-7 2xl:col-span-7">
                    <label for="nombre" class="block text-sm font-medium text-gray-700 dark:text-gray-400">Nombre Completo</label>
                    <InputText type="text" fluid v-mayuscula v-model="datoscamposEmpleados.nombre" placeholder="Nombre completo" name="crearnombre" id="nombre" />
                  </div>

                  <div class="col-span-12 sm:col-span-12 md:col-span-3 lg:col-span-3 xl:col-span-3 2xl:col-span-3">
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-400" for="sexo">Sexo</label>
                    <Dropdown v-model="datoscamposEmpleados.sexo" :options="['HOMBRE','MUJER']" placeholder="Seleccione sexo" fluid />
                  </div>

                  <div class="col-span-12 sm:col-span-12 md:col-span-3 lg:col-span-3 xl:col-span-3 2xl:col-span-3">
                    <label for="fecha_nacimiento" class="block text-sm font-medium text-gray-700 dark:text-gray-400">Fecha Nacimiento</label>
                    <InputText type="text" fluid v-model="datoscamposEmpleados.fecha_nacimiento" placeholder="dd/mm/aaaa" name="crearfecha_nacimiento" id="fecha_nacimiento" />
                  </div>

                  <div class="col-span-12 sm:col-span-12 md:col-span-2 lg:col-span-2 xl:col-span-2 2xl:col-span-2">
                    <label for="edad" class="block text-sm font-medium text-gray-700 dark:text-gray-400">Edad</label>
                    <InputText type="text" fluid v-model="datoscamposEmpleados.edad" placeholder="Edad" name="crearedad" id="edad" />
                  </div>

                  <div class="col-span-12 sm:col-span-12 md:col-span-2 lg:col-span-2 xl:col-span-2 2xl:col-span-2">
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-400" for="telefono">Teléfono</label>
                    <InputMask fluid :mask="patronTelefono" v-model="datoscamposEmpleados.telefono" placeholder="Teléfono" name="creartelefono" id="telefono" />
                  </div>

                  <div class="col-span-12 sm:col-span-12 md:col-span-2 lg:col-span-2 xl:col-span-2 2xl:col-span-2">
                    <label for="email" class="block text-sm font-medium text-gray-700 dark:text-gray-400">Email</label>
                    <InputText type="text" fluid v-model="datoscamposEmpleados.email" placeholder="correo@ejemplo.com" name="crearemail" id="email" />
                  </div>

                  <div class="col-span-12">
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-400" for="direccion">Dirección</label>
                    <Textarea id="creardireccion" rows="3" fluid v-model="datoscamposEmpleados.direccion" placeholder="Dirección completa" />
                  </div>

                </div>
              </AccordionContent>
            </AccordionPanel>

            <!-- Sección 2: Información Laboral -->
            <AccordionPanel value="1">
              <AccordionHeader>
                <div class="flex items-center gap-3">
                  <div class="bg-teal-100 text-teal-600 rounded-full w-10 h-10 flex items-center justify-center">
                    <i class="pi pi-briefcase text-lg"></i>
                  </div>
                  <div>
                    <p class="font-bold text-gray-800">Información Laboral</p>
                    <p class="text-xs text-gray-500">Cargo, departamento, contrato y horario</p>
                  </div>
                </div>
              </AccordionHeader>
              <AccordionContent>
                <div class="grid grid-cols-12 gap-4 mt-4">

                  <div class="col-span-12 sm:col-span-12 md:col-span-3 lg:col-span-3 xl:col-span-3 2xl:col-span-3">
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-400" for="cargo">Cargo</label>
                    <Dropdown v-model="datoscamposEmpleados.cargo" :options="cargosArray" optionLabel="nombre" placeholder="Seleccione cargo" fluid />
                  </div>

                  <div class="col-span-12 sm:col-span-12 md:col-span-3 lg:col-span-3 xl:col-span-3 2xl:col-span-3">
                    <label for="departamento" class="block text-sm font-medium text-gray-700 dark:text-gray-400">Departamento</label>
                    <InputText type="text" fluid v-model="datoscamposEmpleados.departamento" placeholder="Departamento" name="creardepartamento" id="departamento" />
                  </div>

                  <div class="col-span-12 sm:col-span-12 md:col-span-3 lg:col-span-3 xl:col-span-3 2xl:col-span-3">
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-400" for="fecha_ingreso">Fecha Ingreso</label>
                    <flat-pickr v-model="datoscamposEmpleados.fecha_ingreso" class="form-input w-full p-inputtext p-component p-filled p-inputtext-fluid" :config="basic"></flat-pickr>
                  </div>

                  <div class="col-span-12 sm:col-span-12 md:col-span-3 lg:col-span-3 xl:col-span-3 2xl:col-span-3">
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-400" for="tipo_contrato">Tipo Contrato</label>
                    <Dropdown v-model="datoscamposEmpleados.tipo_contrato" :options="['FIJO','TEMPORAl','POR COMISION','POR HONORARIOS']" placeholder="Tipo de contrato" fluid />
                  </div>

                  <div class="col-span-12 sm:col-span-12 md:col-span-3 lg:col-span-3 xl:col-span-3 2xl:col-span-3">
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-400" for="estado">Estado</label>
                    <Dropdown v-model="datoscamposEmpleados.estado" :options="['ACTIVO','SUSPENDIDO','VACACIONES','DESPEDIDO']" placeholder="Estado" fluid />
                  </div>

                  <div class="col-span-12 sm:col-span-12 md:col-span-3 lg:col-span-3 xl:col-span-3 2xl:col-span-3">
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-400" for="turno">Turno</label>
                    <Dropdown v-model="datoscamposEmpleados.turno" :options="['DIURNO','NOCTURNO','MIXTO']" placeholder="Turno" fluid />
                  </div>

                  <div class="col-span-12 sm:col-span-12 md:col-span-6 lg:col-span-6 xl:col-span-6 2xl:col-span-6">
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-400" for="supervisor">Supervisor</label>
                    <Dropdown v-model="datoscamposEmpleados.supervisor" :options="empleadosArray" optionLabel="nombre" placeholder="Seleccione supervisor" fluid />
                  </div>

                </div>
              </AccordionContent>
            </AccordionPanel>

            <!-- Sección 3: Información Bancaria -->
            <AccordionPanel value="2">
              <AccordionHeader>
                <div class="flex items-center gap-3">
                  <div class="bg-green-100 text-green-600 rounded-full w-10 h-10 flex items-center justify-center">
                    <i class="pi pi-building text-lg"></i>
                  </div>
                  <div>
                    <p class="font-bold text-gray-800">Información Bancaria</p>
                    <p class="text-xs text-gray-500">Datos bancarios para pagos</p>
                  </div>
                </div>
              </AccordionHeader>
              <AccordionContent>
                <div class="grid grid-cols-12 gap-4 mt-4">

                  <div class="col-span-12 sm:col-span-12 md:col-span-4 lg:col-span-4 xl:col-span-4 2xl:col-span-4">
                    <label for="banco" class="block text-sm font-medium text-gray-700 dark:text-gray-400">Banco</label>
                    <InputText type="text" fluid v-model="datoscamposEmpleados.banco" placeholder="Nombre del banco" name="crearbanco" id="banco" />
                  </div>

                  <div class="col-span-12 sm:col-span-12 md:col-span-4 lg:col-span-4 xl:col-span-4 2xl:col-span-4">
                    <label for="no_cuenta" class="block text-sm font-medium text-gray-700 dark:text-gray-400">No. Cuenta</label>
                    <InputText type="text" fluid v-model="datoscamposEmpleados.no_cuenta" placeholder="Número de cuenta" name="crearno_cuenta" id="no_cuenta" />
                  </div>

                  <div class="col-span-12 sm:col-span-12 md:col-span-4 lg:col-span-4 xl:col-span-4 2xl:col-span-4">
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-400" for="tipo_pago">Tipo de Pago</label>
                    <Dropdown v-model="datoscamposEmpleados.tipo_pago" :options="['EFECTIVO','TRANSFERENCIA','CHEQUE']" placeholder="Método de pago" fluid />
                  </div>

                </div>
              </AccordionContent>
            </AccordionPanel>

            <!-- Sección 4: Información Salarial -->
            <AccordionPanel value="3">
              <AccordionHeader>
                <div class="flex items-center gap-3">
                  <div class="bg-yellow-100 text-yellow-600 rounded-full w-10 h-10 flex items-center justify-center">
                    <i class="pi pi-dollar text-lg"></i>
                  </div>
                  <div>
                    <p class="font-bold text-gray-800">Información Salarial</p>
                    <p class="text-xs text-gray-500">Sueldo, comisiones, bonos y extras</p>
                  </div>
                </div>
              </AccordionHeader>
              <AccordionContent>
                <div class="grid grid-cols-12 gap-4 mt-4">

                  <div class="col-span-12 sm:col-span-12 md:col-span-3 lg:col-span-3 xl:col-span-3 2xl:col-span-3">
                    <label for="sueldo_base" class="block text-sm font-medium text-gray-700 dark:text-gray-400">Sueldo Base</label>
                    <InputText type="text" fluid v-decimales v-numeroFocusinOut v-solonumeros v-model="datoscamposEmpleados.sueldo_base" placeholder="0.00" name="crearsueldo_base" id="sueldo_base" />
                  </div>

                  <div class="col-span-12 sm:col-span-12 md:col-span-3 lg:col-span-3 xl:col-span-3 2xl:col-span-3">
                    <label for="comision_porcentaje" class="block text-sm font-medium text-gray-700 dark:text-gray-400">Comisión %</label>
                    <InputText type="text" fluid v-decimales v-numeroFocusinOut v-solonumeros v-model="datoscamposEmpleados.comision_porcentaje" placeholder="0.00" name="crearcomision_porcentaje" id="comision_porcentaje" />
                  </div>

                  <div class="col-span-12 sm:col-span-12 md:col-span-3 lg:col-span-3 xl:col-span-3 2xl:col-span-3">
                    <label for="bono_fijo" class="block text-sm font-medium text-gray-700 dark:text-gray-400">Bono Fijo</label>
                    <InputText type="text" fluid v-decimales v-numeroFocusinOut v-solonumeros v-model="datoscamposEmpleados.bono_fijo" placeholder="0.00" name="crearbono_fijo" id="bono_fijo" />
                  </div>

                  <div class="col-span-12 sm:col-span-12 md:col-span-3 lg:col-span-3 xl:col-span-3 2xl:col-span-3">
                    <label for="monto_horas_extras" class="block text-sm font-medium text-gray-700 dark:text-gray-400">Horas Extras</label>
                    <InputText type="text" fluid v-decimales v-numeroFocusinOut v-solonumeros v-model="datoscamposEmpleados.monto_horas_extras" placeholder="0.00" name="crearmonto_horas_extras" id="monto_horas_extras" />
                  </div>

                  <div class="col-span-12 sm:col-span-12 md:col-span-3 lg:col-span-3 xl:col-span-3 2xl:col-span-3">
                    <label for="monto_prestamos" class="block text-sm font-medium text-gray-700 dark:text-gray-400">Préstamos</label>
                    <InputText type="text" fluid v-decimales v-numeroFocusinOut v-solonumeros v-model="datoscamposEmpleados.monto_prestamos" placeholder="0.00" name="crearmonto_prestamos" id="monto_prestamos" />
                  </div>

                </div>
              </AccordionContent>
            </AccordionPanel>

            <!-- Sección 5: Retenciones y Descuentos -->
            <AccordionPanel value="4">
              <AccordionHeader>
                <div class="flex items-center gap-3">
                  <div class="bg-red-100 text-red-600 rounded-full w-10 h-10 flex items-center justify-center">
                    <i class="pi pi-minus-circle text-lg"></i>
                  </div>
                  <div>
                    <p class="font-bold text-gray-800">Retenciones y Descuentos</p>
                    <p class="text-xs text-gray-500">AFP, SFS, ISR y otros descuentos</p>
                  </div>
                </div>
              </AccordionHeader>
              <AccordionContent>
                <div class="grid grid-cols-12 gap-4 mt-4">

                  <div class="col-span-12 sm:col-span-12 md:col-span-3 lg:col-span-3 xl:col-span-3 2xl:col-span-3">
                    <label for="retencion_afp" class="block text-sm font-medium text-gray-700 dark:text-gray-400">Retención AFP</label>
                    <InputText type="text" fluid v-decimales v-numeroFocusinOut v-solonumeros v-model="datoscamposEmpleados.retencion_afp" placeholder="0.00" name="crearretencion_afp" id="retencion_afp" />
                  </div>

                  <div class="col-span-12 sm:col-span-12 md:col-span-3 lg:col-span-3 xl:col-span-3 2xl:col-span-3">
                    <label for="retencion_sfs" class="block text-sm font-medium text-gray-700 dark:text-gray-400">Retención SFS</label>
                    <InputText type="text" fluid v-decimales v-numeroFocusinOut v-solonumeros v-model="datoscamposEmpleados.retencion_sfs" placeholder="0.00" name="crearretencion_sfs" id="retencion_sfs" />
                  </div>

                  <div class="col-span-12 sm:col-span-12 md:col-span-3 lg:col-span-3 xl:col-span-3 2xl:col-span-3">
                    <label for="retencion_isr" class="block text-sm font-medium text-gray-700 dark:text-gray-400">Retención ISR</label>
                    <InputText type="text" fluid v-decimales v-numeroFocusinOut v-solonumeros v-model="datoscamposEmpleados.retencion_isr" placeholder="0.00" name="crearretencion_isr" id="retencion_isr" />
                  </div>

                  <div class="col-span-12 sm:col-span-12 md:col-span-3 lg:col-span-3 xl:col-span-3 2xl:col-span-3">
                    <label for="otros_descuentos" class="block text-sm font-medium text-gray-700 dark:text-gray-400">Otros Descuentos</label>
                    <InputText type="text" fluid v-decimales v-numeroFocusinOut v-solonumeros v-model="datoscamposEmpleados.otros_descuentos" placeholder="0.00" name="crearotros_descuentos" id="otros_descuentos" />
                  </div>

                </div>
              </AccordionContent>
            </AccordionPanel>

            <!-- Sección 6: Notas -->
            <AccordionPanel value="5">
              <AccordionHeader>
                <div class="flex items-center gap-3">
                  <div class="bg-purple-100 text-purple-600 rounded-full w-10 h-10 flex items-center justify-center">
                    <i class="pi pi-pencil text-lg"></i>
                  </div>
                  <div>
                    <p class="font-bold text-gray-800">Notas</p>
                    <p class="text-xs text-gray-500">Observaciones y comentarios adicionales</p>
                  </div>
                </div>
              </AccordionHeader>
              <AccordionContent>
                <div class="grid grid-cols-12 gap-4 mt-4">

                  <div class="col-span-12">
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-400" for="notas">Notas</label>
                    <Textarea id="crearnotas" rows="4" fluid v-model="datoscamposEmpleados.notas" placeholder="Escriba cualquier nota o comentario adicional sobre el empleado..." />
                  </div>

                </div>
              </AccordionContent>
            </AccordionPanel>

          </Accordion>

          <!-- Hidden fields -->
          <div class="form-group col-span-6" hidden>
            <label for="created_atAgregarDatos">CREATED_AT</label>
            <input type="input" v-model="datoscamposEmpleados.created_at" name="created_at" class="form-control" id="created_atAgregarDatos" placeholder="created_at" maxlength="">
          </div>
          <div class="form-group col-span-6" hidden>
            <label for="updated_atAgregarDatos">UPDATED_AT</label>
            <input type="input" v-model="datoscamposEmpleados.updated_at" name="updated_at" class="form-control" id="updated_atAgregarDatos" placeholder="updated_at" maxlength="">
          </div>
          <div class="form-group col-span-12" hidden>
            <label for="usuarioAgregarDatos">USUARIO</label>
            <input type="input" v-model="datoscamposEmpleados.usuario" name="usuario" class="form-control" id="usuarioAgregarDatos" placeholder="usuario" maxlength="250">
          </div>

          <!-- Submit button -->
          <div class="mt-6">
            <Button label="Guardar Empleado" icon="pi pi-check" fluid size="large" @click="enviarDatos" class="bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700" />
          </div>

        </form>
      </template>
    </Card>
  </div>
</main>
<Toast />
</template>
<style scoped>
/* Card profesional */
:deep(.p-card) {
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  border-radius: 1rem;
  border: 1px solid #e5e7eb;
}

/* Accordion profesional */
:deep(.modern-accordion .p-accordionpanel) {
  margin-bottom: 1rem;
  border: 1px solid #e5e7eb;
  border-radius: 0.75rem;
  overflow: hidden;
}

:deep(.modern-accordion .p-accordionheader-toggle) {
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
  border: none;
  padding: 1.25rem;
  transition: all 0.3s ease;
}

:deep(.modern-accordion .p-accordionheader-toggle:hover) {
  background: linear-gradient(135deg, #e2e8f0 0%, #cbd5e1 100%);
}

:deep(.modern-accordion .p-accordionpanel-content) {
  padding: 1.5rem;
  background: #ffffff;
}

/* Inputs profesionales */
:deep(.p-inputtext),
:deep(.p-inputmask),
:deep(.p-dropdown),
:deep(.p-textarea) {
  border: 2px solid #e5e7eb;
  transition: all 0.3s ease;
  border-radius: 0.5rem;
}

:deep(.p-inputtext:hover),
:deep(.p-inputmask:hover),
:deep(.p-dropdown:hover),
:deep(.p-textarea:hover) {
  border-color: #cbd5e1;
}

:deep(.p-inputtext:focus),
:deep(.p-inputmask:focus),
:deep(.p-dropdown:focus),
:deep(.p-textarea:focus) {
  border-color: #14b8a6;
  box-shadow: 0 0 0 3px rgba(20, 184, 166, 0.1);
}

/* Labels mejorados */
label {
  font-weight: 600;
  color: #374151;
  margin-bottom: 0.5rem;
  display: block;
}

/* Botones */
:deep(.p-button) {
  transition: all 0.3s ease;
  border-radius: 0.5rem;
}

:deep(.p-button:hover) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

/* InputGroup para búsqueda de cédula */
:deep(.p-inputgroup) {
  border-radius: 0.5rem;
  overflow: hidden;
}

/* Secciones con fondo */
.section-header {
  background: linear-gradient(135deg, #14b8a6 0%, #0d9488 100%);
  color: white;
  padding: 1rem 1.5rem;
  border-radius: 0.75rem 0.75rem 0 0;
  margin: -1.5rem -1.5rem 1.5rem -1.5rem;
}

/* Fieldsets mejorados */
:deep(.p-fieldset) {
  border: 2px solid #e5e7eb;
  border-radius: 0.75rem;
}

:deep(.p-fieldset-legend) {
  background: white;
  border: 2px solid #14b8a6;
  color: #0d9488;
  font-weight: 700;
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
}

/* Grid responsive mejorado */
@media (max-width: 768px) {
  .grid {
    gap: 1rem;
  }
}

/* Inputs de solo lectura */
:deep(.p-inputtext:read-only) {
  background-color: #f9fafb;
  color: #6b7280;
  cursor: not-allowed;
}

/* Animaciones suaves */
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

.content-wrapper {
  animation: fadeIn 0.4s ease-out;
}
</style>

