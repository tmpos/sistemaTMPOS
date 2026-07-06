
<script setup>
import { ref, onMounted, nextTick, watchEffect, watch } from 'vue';
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
/************************************************************************/
const datoscampos = ref({})
const codigoUnico = ref(generarCodigoUnico());
const fecha = ref(nfecha('fecha'));
const position = "top";
const todosLosempleados = ref([]);
const empleadosArray = ref([]);
const cargosArray = ref([]);
/************************************************************************/
const fetchAllData = async () => {
    const response = await peticionesFetchOffline('getDataAsArray', 'empleados');
    const jsonData = response;
    todosLosempleados.value = response;
    empleadosArray.value = response;
    datoscampos.value = jsonData.find(datos=>datos.id == route.params.id)


};
/************************************************************************/
const fetchCargos = async () => {
    const response = await peticionesFetchOffline('getDataAsArray', 'cargos');
    const jsonData = response.reverse();
    cargosArray.value = jsonData;
};
/************************************************************************/
async function navigate(action) {

    const currentIndex = todosLosempleados.value.findIndex(notacredito => notacredito.id == route.params.id);
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
            newIndex = currentIndex + 1 < todosLosempleados.value.length ? currentIndex + 1 : currentIndex;
            break;
        case 'ultimo':
            newIndex = todosLosempleados.value.length - 1;
            break;
        default:
            return;
    }
    datoscampos.value = todosLosempleados.value[newIndex];
    router.push({ path: `/editarempleados/${todosLosempleados.value[newIndex].id}` });
    
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
onMounted(async() => {
await datosConfig()
tokenCifrado.value = await encryptarPassword(token.value, 10);
await fetchAllData()
await fetchCargos()
});
/************************************************************************/
async function funcionActualizar(e) {
  e.preventDefault();
  const url = link.value+api.value+"/actualizarcampos/empleados";
  if (!datoscampos.value) {
    console.error("Datos incompletos, no se puede actualizar.");
    return;
  }
  if (datoscampos.value.hasOwnProperty('created_at')) {
      datoscampos.value.updated_at = nfecha('timestamp')
    }
  const datosEnviar = JSON.parse(JSON.stringify(datoscampos.value));
  const envioDatos = await peticionesFetchOffline('updateData','empleados', JSON.stringify(datosEnviar));
  if (envioDatos[0] == 'ok') {
     toast.add({ severity: 'success', summary: 'Éxito', detail: 'Datos Actualizados', life: 3000 });
  }else{
    toast.add({ severity: 'error', summary: 'Error', detail: 'Fallo al actualizar los datos.', life: 3000 });
  }
}
/************************************************************************/
watch(() => datoscampos.value.sueldo_base, (nuevoValor) => {
  const sueldo = parseFloat(nuevoValor) || 0;
  datoscampos.value.retencion_afp = (sueldo * 0.0287).toFixed(2);
  datoscampos.value.retencion_sfs = (sueldo * 0.0304).toFixed(2);
});
/************************************************************************/

/************************************************************************/



/************************************************************************/

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
            <i class="pi pi-user-edit text-teal-600"></i>
            Editar Empleado
          </h1>
          <p class="text-gray-500 mt-1">Actualiza la información del empleado en el sistema</p>
        </div>
      </div>

      <!-- Navigation toolbar -->
      <div class="flex flex-wrap gap-2 items-center bg-gray-50 p-4 rounded-lg border border-gray-200">
        <Button
          icon="pi pi-home"
          title="Inicio"
          severity="secondary"
          outlined
          @click="router.push('/empleados')"
        />
        <Button
          icon="pi pi-plus-circle"
          title="Crear Nuevo"
          severity="success"
          outlined
          @click="router.push('/crearempleados')"
        />

        <div class="h-8 w-px bg-gray-300 mx-2"></div>

        <Button
          icon="pi pi-step-backward"
          title="Primero"
          severity="secondary"
          outlined
          @click="navigate('primero')"
        />
        <Button
          icon="pi pi-chevron-left"
          title="Anterior"
          severity="secondary"
          outlined
          @click="navigate('anterior')"
        />
        <Button
          icon="pi pi-chevron-right"
          title="Siguiente"
          severity="secondary"
          outlined
          @click="navigate('siguiente')"
        />
        <Button
          icon="pi pi-step-forward"
          title="Último"
          severity="secondary"
          outlined
          @click="navigate('ultimo')"
        />

        <div class="flex-grow"></div>

        <Button
          icon="pi pi-save"
          label="Guardar Cambios"
          severity="contrast"
          @click="funcionActualizar"
          class="ml-auto"
        />
      </div>
    </div>

    <!-- Card principal -->
    <Card class="shadow-xl border-0">
      <template #content>
        <form id="formularioGenerar" @submit.prevent="funcionActualizar">

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
                    <InputText type="text" fluid readonly v-model="datoscampos.codigo_empleado" placeholder="Código" name="codigo_empleado" id="actualizarcodigo_empleado" />
                  </div>

                  <div class="col-span-12 sm:col-span-12 md:col-span-3 lg:col-span-3 xl:col-span-3 2xl:col-span-3">
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-400" for="cedula">Cédula</label>
                    <InputText placeholder="Cédula" fluid v-model="datoscampos.cedula" />
                  </div>

                  <div class="col-span-12 sm:col-span-12 md:col-span-7 lg:col-span-7 xl:col-span-7 2xl:col-span-7">
                    <label for="nombre" class="block text-sm font-medium text-gray-700 dark:text-gray-400">Nombre Completo</label>
                    <InputText type="text" fluid v-mayuscula v-model="datoscampos.nombre" placeholder="Nombre completo" name="nombre" id="actualizarnombre" />
                  </div>

                  <div class="col-span-12 sm:col-span-12 md:col-span-3 lg:col-span-3 xl:col-span-3 2xl:col-span-3">
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-400" for="sexo">Sexo</label>
                    <Dropdown v-model="datoscampos.sexo" :options="['HOMBRE','MUJER']" placeholder="Seleccione sexo" fluid editable />
                  </div>

                  <div class="col-span-12 sm:col-span-12 md:col-span-3 lg:col-span-3 xl:col-span-3 2xl:col-span-3">
                    <label for="fecha_nacimiento" class="block text-sm font-medium text-gray-700 dark:text-gray-400">Fecha Nacimiento</label>
                    <InputText type="text" fluid v-model="datoscampos.fecha_nacimiento" placeholder="dd/mm/aaaa" name="fecha_nacimiento" id="actualizarfecha_nacimiento" />
                  </div>

                  <div class="col-span-12 sm:col-span-12 md:col-span-2 lg:col-span-2 xl:col-span-2 2xl:col-span-2">
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-400" for="telefono">Teléfono</label>
                    <InputMask fluid :mask="patronTelefono" v-model="datoscampos.telefono" placeholder="Teléfono" name="actualizartelefono" id="telefono" />
                  </div>

                  <div class="col-span-12 sm:col-span-12 md:col-span-2 lg:col-span-2 xl:col-span-2 2xl:col-span-2">
                    <label for="email" class="block text-sm font-medium text-gray-700 dark:text-gray-400">Email</label>
                    <InputText type="text" fluid v-model="datoscampos.email" placeholder="correo@ejemplo.com" name="email" id="actualizaremail" />
                  </div>

                  <div class="col-span-12">
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-400" for="direccion">Dirección</label>
                    <Textarea id="actualizardireccion" rows="3" fluid v-model="datoscampos.direccion" placeholder="Dirección completa" name="direccion" />
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
                    <Dropdown v-model="datoscampos.cargo" :options="cargosArray" optionLabel="nombre" placeholder="Seleccione cargo" fluid editable />
                  </div>

                  <div class="col-span-12 sm:col-span-12 md:col-span-3 lg:col-span-3 xl:col-span-3 2xl:col-span-3">
                    <label for="departamento" class="block text-sm font-medium text-gray-700 dark:text-gray-400">Departamento</label>
                    <InputText type="text" fluid v-model="datoscampos.departamento" placeholder="Departamento" name="departamento" id="actualizardepartamento" />
                  </div>

                  <div class="col-span-12 sm:col-span-12 md:col-span-3 lg:col-span-3 xl:col-span-3 2xl:col-span-3">
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-400" for="fecha_ingreso">Fecha Ingreso</label>
                    <flat-pickr v-model="datoscampos.fecha_ingreso" class="form-input w-full p-inputtext p-component p-filled p-inputtext-fluid" :config="basic"></flat-pickr>
                  </div>

                  <div class="col-span-12 sm:col-span-12 md:col-span-3 lg:col-span-3 xl:col-span-3 2xl:col-span-3">
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-400" for="tipo_contrato">Tipo Contrato</label>
                    <Dropdown v-model="datoscampos.tipo_contrato" :options="['FIJO','TEMPORAl','POR COMISION','POR HONORARIOS']" placeholder="Tipo de contrato" fluid editable />
                  </div>

                  <div class="col-span-12 sm:col-span-12 md:col-span-3 lg:col-span-3 xl:col-span-3 2xl:col-span-3">
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-400" for="estado">Estado</label>
                    <Dropdown v-model="datoscampos.estado" :options="['ACTIVO','SUSPENDIDO','VACACIONES','DESPEDIDO']" placeholder="Estado" fluid editable />
                  </div>

                  <div class="col-span-12 sm:col-span-12 md:col-span-3 lg:col-span-3 xl:col-span-3 2xl:col-span-3">
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-400" for="turno">Turno</label>
                    <Dropdown v-model="datoscampos.turno" :options="['DIURNO','NOCTURNO','MIXTO']" placeholder="Turno" fluid editable />
                  </div>

                  <div class="col-span-12 sm:col-span-12 md:col-span-6 lg:col-span-6 xl:col-span-6 2xl:col-span-6">
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-400" for="supervisor">Supervisor</label>
                    <Dropdown v-model="datoscampos.supervisor" :options="empleadosArray" optionLabel="nombre" placeholder="Seleccione supervisor" fluid editable />
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
                    <InputText type="text" fluid v-model="datoscampos.banco" placeholder="Nombre del banco" name="banco" id="actualizarbanco" />
                  </div>

                  <div class="col-span-12 sm:col-span-12 md:col-span-4 lg:col-span-4 xl:col-span-4 2xl:col-span-4">
                    <label for="no_cuenta" class="block text-sm font-medium text-gray-700 dark:text-gray-400">No. Cuenta</label>
                    <InputText type="text" fluid v-model="datoscampos.no_cuenta" placeholder="Número de cuenta" name="no_cuenta" id="actualizarno_cuenta" />
                  </div>

                  <div class="col-span-12 sm:col-span-12 md:col-span-4 lg:col-span-4 xl:col-span-4 2xl:col-span-4">
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-400" for="tipo_pago">Tipo de Pago</label>
                    <Dropdown v-model="datoscampos.tipo_pago" :options="['EFECTIVO','TRANSFERENCIA','CHEQUE']" placeholder="Método de pago" fluid editable />
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
                    <InputText type="text" fluid v-decimales v-numeroFocusinOut v-solonumeros v-model="datoscampos.sueldo_base" placeholder="0.00" name="sueldo_base" id="actualizarsueldo_base" />
                  </div>

                  <div class="col-span-12 sm:col-span-12 md:col-span-3 lg:col-span-3 xl:col-span-3 2xl:col-span-3">
                    <label for="comision_porcentaje" class="block text-sm font-medium text-gray-700 dark:text-gray-400">Comisión %</label>
                    <InputText type="text" fluid v-decimales v-numeroFocusinOut v-solonumeros v-model="datoscampos.comision_porcentaje" placeholder="0.00" name="comision_porcentaje" id="actualizarcomision_porcentaje" />
                  </div>

                  <div class="col-span-12 sm:col-span-12 md:col-span-3 lg:col-span-3 xl:col-span-3 2xl:col-span-3">
                    <label for="bono_fijo" class="block text-sm font-medium text-gray-700 dark:text-gray-400">Bono Fijo</label>
                    <InputText type="text" fluid v-decimales v-numeroFocusinOut v-solonumeros v-model="datoscampos.bono_fijo" placeholder="0.00" name="bono_fijo" id="actualizarbono_fijo" />
                  </div>

                  <div class="col-span-12 sm:col-span-12 md:col-span-3 lg:col-span-3 xl:col-span-3 2xl:col-span-3">
                    <label for="monto_horas_extras" class="block text-sm font-medium text-gray-700 dark:text-gray-400">Horas Extras</label>
                    <InputText type="text" fluid v-decimales v-numeroFocusinOut v-solonumeros v-model="datoscampos.monto_horas_extras" placeholder="0.00" name="monto_horas_extras" id="actualizarmonto_horas_extras" />
                  </div>

                  <div class="col-span-12 sm:col-span-12 md:col-span-3 lg:col-span-3 xl:col-span-3 2xl:col-span-3">
                    <label for="monto_prestamos" class="block text-sm font-medium text-gray-700 dark:text-gray-400">Préstamos</label>
                    <InputText type="text" fluid v-decimales v-numeroFocusinOut v-solonumeros v-model="datoscampos.monto_prestamos" placeholder="0.00" name="monto_prestamos" id="actualizarmonto_prestamos" />
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
                    <InputText type="text" fluid v-decimales v-numeroFocusinOut v-solonumeros v-model="datoscampos.retencion_afp" placeholder="0.00" name="retencion_afp" id="actualizarretencion_afp" />
                  </div>

                  <div class="col-span-12 sm:col-span-12 md:col-span-3 lg:col-span-3 xl:col-span-3 2xl:col-span-3">
                    <label for="retencion_sfs" class="block text-sm font-medium text-gray-700 dark:text-gray-400">Retención SFS</label>
                    <InputText type="text" fluid v-decimales v-numeroFocusinOut v-solonumeros v-model="datoscampos.retencion_sfs" placeholder="0.00" name="retencion_sfs" id="actualizarretencion_sfs" />
                  </div>

                  <div class="col-span-12 sm:col-span-12 md:col-span-3 lg:col-span-3 xl:col-span-3 2xl:col-span-3">
                    <label for="retencion_isr" class="block text-sm font-medium text-gray-700 dark:text-gray-400">Retención ISR</label>
                    <InputText type="text" fluid v-decimales v-numeroFocusinOut v-solonumeros v-model="datoscampos.retencion_isr" placeholder="0.00" name="retencion_isr" id="actualizarretencion_isr" />
                  </div>

                  <div class="col-span-12 sm:col-span-12 md:col-span-3 lg:col-span-3 xl:col-span-3 2xl:col-span-3">
                    <label for="otros_descuentos" class="block text-sm font-medium text-gray-700 dark:text-gray-400">Otros Descuentos</label>
                    <InputText type="text" fluid v-decimales v-numeroFocusinOut v-solonumeros v-model="datoscampos.otros_descuentos" placeholder="0.00" name="otros_descuentos" id="actualizarotros_descuentos" />
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
                    <Textarea id="actualizarnotas" rows="4" fluid v-model="datoscampos.notas" placeholder="Escriba cualquier nota o comentario adicional sobre el empleado..." name="notas" />
                  </div>

                </div>
              </AccordionContent>
            </AccordionPanel>

          </Accordion>

          <!-- Hidden fields -->
          <div class="form-group col-span-6" hidden>
            <label for="created_at-Actualizador">CREATED_AT</label>
            <input type="input" v-model="datoscampos.created_at" name="created_at" class="form-control" id="created_at-Actualizador" placeholder="created_at" maxlength="">
          </div>
          <div class="form-group col-span-6" hidden>
            <label for="updated_at-Actualizador">UPDATED_AT</label>
            <input type="input" v-model="datoscampos.updated_at" name="updated_at" class="form-control" id="updated_at-Actualizador" placeholder="updated_at" maxlength="">
          </div>
          <div class="form-group col-span-12" hidden>
            <label for="usuario-Actualizador">USUARIO</label>
            <input type="input" v-model="datoscampos.usuario" name="usuario" class="form-control" id="usuario-Actualizador" placeholder="usuario" maxlength="250">
          </div>

          <!-- Submit button -->
          <div class="mt-6">
            <Button label="Actualizar Empleado" icon="pi pi-save" fluid size="large" @click="funcionActualizar" class="bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700" />
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

