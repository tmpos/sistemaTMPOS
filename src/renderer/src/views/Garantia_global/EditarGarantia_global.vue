
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
  generadorCodigo,
  ultimoRegistro,
  peticionesFetchOffline,
arrayToObjetoFromTablaOffline,
  enviarDatosLocalStorage,
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
const todosLosgarantia_global = ref([]);
/************************************************************************/
const fetchAllData = async () => {
    const response = await peticionesFetchOffline('getDataAsArray', 'garantia_global');
    const jsonData = response;
    todosLosgarantia_global.value = response;
    datoscampos.value = jsonData.find(datos=>datos.id == route.params.id)
};
/************************************************************************/
function navigate(action) {
    const currentIndex = todosLosgarantia_global.value.findIndex(notacredito => notacredito.id == route.params.id);
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
            newIndex = currentIndex + 1 < todosLosgarantia_global.value.length ? currentIndex + 1 : currentIndex;
            break;
        case 'ultimo':
            newIndex = todosLosgarantia_global.value.length - 1;
            break;
        default:
            return;
    }
    datoscampos.value = todosLosgarantia_global.value[newIndex];
    router.push({ path: `/editargarantia_global/${todosLosgarantia_global.value[newIndex].id}` });
}
/************************************************************************/
const datosBarcode = ref({})
/************************************************************************/
const fetchDataBarcode = async () => {
const response = await peticionesFetchOffline('getDataAsArray', 'barcode');
    const jsonData = response[0];
    datosBarcode.value = jsonData;
};
/************************************************************************/
onMounted(async() => {
const datosJSON = await envioElectron('datosarchivo');
link.value = datosJSON.VITE_LINKURL;
api.value = datosJSON.VITE_LINK_API;
token.value = datosJSON.VITE_TOKEN;
patronTelefono.value = datosJSON.VITE_PATRON_TELEFONO;
linkImpresora.value = datosJSON.VITE_IMPRESORA_LOCAL;
patroncedula.value = datosJSON.VITE_PATRON_CEDULA;
tokenCifrado.value = await encryptarPassword(token.value, 10);
await fetchAllData()
await fetchDataBarcode()
});
/************************************************************************/
async function funcionActualizar(e) {
  if(e){
    e.preventDefault();
  }

  const url = link.value+api.value+"/actualizarcampos/garantia_global";
  if (!datoscampos.value) {
    console.error("Datos incompletos, no se puede actualizar.");
    return;
  }
  if (datoscampos.value.hasOwnProperty('created_at')) {
      datoscampos.value.updated_at = nfecha('timestamp')
    }
  const envioDatos = await peticionesFetchOffline('updateData', 'garantia_global',JSON.stringify(datoscampos.value));
  if (envioDatos[0] == 'ok') {
     toast.add({ severity: 'success', summary: 'Éxito', detail: 'Datos Actualizados', life: 3000 });
  }else{
    toast.add({ severity: 'error', summary: 'Error', detail: 'Fallo al actualizar los datos.', life: 3000 });
  }
}
/************************************************************************/
const printBarcode = async(barcode,texto) => {
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
        labelWidth: parseInt(datosBarcode.value.labelwidth),
        labelHeight: parseInt(datosBarcode.value.labelheight),
        margins: {
            top: parseInt(datosBarcode.value.margen_sup),
            right: parseInt(datosBarcode.value.margen_der),
            bottom: parseInt(datosBarcode.value.margen_inf),
            left: parseInt(datosBarcode.value.margen_izq)
        },
        incluirCabecera:true,
        incluirTexto:true,
        incluirCodigo:true,
        incluirOtro:false,
        incluirPrecio:false,
        headerText: datosEmpresa.empresa.nombre,
        code: barcode,
        text: texto,
        precio: '',
        width: parseInt(datosBarcode.value.barwidth),
        height: parseInt(datosBarcode.value.barheight),
        fontSize: parseInt(datosBarcode.value.fontsize),
        cantidad: 1,
        tipo: datosBarcode.value.barcodetype,
        printerName: datosBarcode.value.impresora
    };
    await window.electron.ipcRenderer.invoke('print-barcode', content);

};
/************************************************************************/
async function imprimirUltimo() {
  try {
    // 📌 Obtener el último registro
    const ultimoRegistro = await peticionesFetchOffline('getLastXRows', 'taller','1');
    
    if (!ultimoRegistro || !ultimoRegistro[0]) {
      toast.add({ severity: 'warn', summary: 'Aviso', detail: 'No hay registros para imprimir.', life: 3000 });
      return;
    }

    // 📌 Extraer datos relevantes
    const datosEmpresaN = JSON.stringify(enviarDatosLocalStorage());
    const datos = JSON.stringify(ultimoRegistro[0]);

    // 📌 Mostrar mensaje de impresión con el número de factura y nombre del cliente
    toast.add({ 
      severity: 'info', 
      summary: 'Imprimiendo...', 
      detail: `Imprimiendo Factura No. ${ultimoRegistro[0].no_factura} para ${ultimoRegistro[0].nombre}`, 
      life: 3000 
    });

    // 📌 Enviar datos a Electron para impresión
    await window.electron.ipcRenderer.invoke('recibotaller', datos, datosEmpresaN, true, false, false);
    
    // 📌 Imprimir código de barras
    await printBarcode(ultimoRegistro[0].no_factura, ultimoRegistro[0].nombre);
  
  } catch (error) {
    console.error("Error al imprimir el último registro:", error);
    toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo imprimir el recibo.', life: 3000 });
  }
}

/************************************************************************/
const fnEnviarTaller = async () => {

  if(datoscampos.value.no_taller != ''){
     toast.add({ severity: 'error', summary: 'Error', detail: 'Ya existe en el Taller', life: 3000 });
    return
  }

  try {
    const jsonData = await arrayToObjetoFromTablaOffline('taller');
    var ultimoReg = await ultimoRegistro(link.value + api.value, 'taller');
    jsonData.no_factura = generadorCodigo(ultimoReg[0].no_factura, '', 7);
    jsonData.nombre = datoscampos.value.cliente;
    jsonData.imei = datoscampos.value.imei;
    jsonData.fecha_entrada = datoscampos.value.fecha_ingreso;
    jsonData.tecnico = datoscampos.value.tecnico;
    jsonData.pago_tecnico = 'NO COBRADO';
    jsonData.beneficio_tecnico = '0.00';
    jsonData.porcentaje_tecnico = 35;
    jsonData.beneficio_empresa = '0.00';
    jsonData.estado = 'En Revisión';
    jsonData.created_at = nfecha('timestamp');
    jsonData.updated_at = nfecha('timestamp');
    jsonData.observaciones = datoscampos.value.nota;
    jsonData.telefono = datoscampos.value.telefono_cliente;
    jsonData.whatsapp = datoscampos.value.telefono_cliente;
    jsonData.equipo = datoscampos.value.equipo;
    jsonData.marca = datoscampos.value.marca;
    jsonData.modelo = datoscampos.value.modelo;
    jsonData.fallas = JSON.stringify([{ "propiedad": datoscampos.value.fallas }]);

    // 📌 Preguntar si tendrá costo (Si cancela aquí, se detiene)
const { isConfirmed: tieneCosto, isDenied: esGratuito } = await Swal.fire({
  title: '¿Tendrá algún costo?',
  text: 'Si el servicio tiene un costo, ingrese el monto total.',
  icon: 'question',
  showCancelButton: true,  // 📌 Agrega el botón "Cancelar"
  showDenyButton: true,     // 📌 Agrega el botón "No, es gratuito"
  confirmButtonText: 'Sí, agregar costo',
  denyButtonText: 'No, es gratuito',
  cancelButtonText: 'Cancelar'
});

// 📌 Si el usuario cancela, detenemos la ejecución
if (!tieneCosto && !esGratuito) {
  return;
}


    if (tieneCosto) {
      // 📌 Pedir el monto total si tiene costo (Si cancela aquí, se detiene)
      const { value: totalCosto, isConfirmed } = await Swal.fire({
        title: 'Ingrese el monto total',
        input: 'number',
        inputPlaceholder: 'Monto total en RD$',
        showCancelButton: true,
        confirmButtonText: 'Confirmar',
        cancelButtonText: 'Cancelar',
        inputValidator: (value) => {
          if (!value || value <= 0) {
            return 'Debe ingresar un monto válido.';
          }
        }
      });

      if (!isConfirmed) return; // 📌 Si cancela, no sigue

      jsonData.total = parseFloat(totalCosto);
      jsonData.saldo = parseFloat(totalCosto);
    } else if (tieneCosto === false) {
      // 📌 Si el usuario elige "No, es gratuito"
      jsonData.total = 0;
      jsonData.saldo = 0;
    } else {
      return; // 📌 Si cierra la ventana sin elegir nada, se detiene
    }

    // 📌 Agregar abono con valores predeterminados
    const datos = {
      "abono": 0,
      "prioridad": 3,
      "recibidopor": datosEmpresa.usuario.usuario,
      "turno": datosEmpresa.usuario.token,
      "cajero": datosEmpresa.usuario.usuario,
      "metodo_pago": 'EFECTIVO',
      "hora": nfecha('hora'),
      "fecha": nfecha('fecha')
    };
    jsonData.abono = JSON.stringify([datos]);

    // 📌 Enviar los datos al servidor
    const url = link.value + api.value + "/insertar/taller";
    const envioDatos = await peticionesFetchOffline('insertData', 'taller',JSON.stringify(jsonData));
    
    if (envioDatos[0] === 'ok') {
      toast.add({ severity: 'success', summary: 'Éxito', detail: 'Datos Agregados con éxito.', life: 3000 });
      datoscampos.value.estado = 'A TALLER'
      datoscampos.value.no_taller = jsonData.no_factura;
      funcionActualizar()
    }

    // 📌 Llamar a la función para imprimir
    await imprimirUltimo();

    console.log("jsonData", jsonData);
  } catch (error) {
    console.error("Error en fnEnviarTaller:", error);
    toast.add({ severity: 'error', summary: 'Error', detail: 'Hubo un problema al registrar el servicio en el taller.', life: 3000 });
  }
};


/************************************************************************/
const fnSolucion = async()=>{
  datoscampos.value.estado = 'REPARADO'
}
/************************************************************************/
</script>
<template>
<main class="content-wrapper">
  <div class="w-full px-4 mt-5 card">
        <fieldset class="border p-3 rounded mb-2">
          <legend class="float-none w-auto px-2">Datos de Garantia_global</legend>

    <div class="flex space-x-2">
      
<Button as="router-link" icon="pi pi-home" to="/garantia_global" />
<Button as="router-link" class="ms-1" icon="pi pi-plus-circle" to="/creargarantia_global" />

    <Button
      icon="pi pi-trash"
      class="p-button-danger ms-1"
      title="Borrar Entrada"
      @click="borrarEntrada"
    />
    <Button
      icon="pi pi-step-backward"
      
      title="Primero"
      @click="navigate('primero')"
    />
    <Button
      icon="pi pi-chevron-left"
      
      title="Anterior"
      @click="navigate('anterior')"
    />
    <Button
      icon="pi pi-chevron-right"
      
      title="Siguiente"
      @click="navigate('siguiente')"
    />
    <Button
      icon="pi pi-step-forward"
      
      title="Ultimo"
      @click="navigate('ultimo')"
    />

    <Button
      icon="pi pi-save"
      class="ms-1"
      severity="contrast"
      @click="funcionActualizar"
    />


    <Button
      icon="pi pi-wrench"
      class="ms-1"
      label="Enviar a Taller"
      severity="contrast"
      @click="fnEnviarTaller"
    />

    <Button
      icon="pi pi-check"
      class="ms-1"
      label="Solución"
      @click="fnSolucion"
    />



    </div>


</fieldset>
<section>
<fieldset class="border p-3 rounded mb-2">
  <legend class="float-none w-auto px-2">Campos</legend>
    <form id="formularioGenerar" action="" method="">
         <div class="box-body">
          <div class="grid grid-cols-12 gap-4 mt-4 text-blue-600" id="campos">

<div class="col-span-12 sm:col-span-12 md:col-span-4 lg:col-span-4 xl:col-span-4 2xl:col-span-4">
                <label for="no_garantia" class="block text-sm font-medium text-gray-700 dark:text-gray-400">No garantia</label>
                <InputText type="text"  class="form-input w-full " v-model="datoscampos.no_garantia" name="no_garantia" placeholder="no_garantia" id="actualizarno_garantia" readonly />
            </div>

<div class="col-span-12 sm:col-span-12 md:col-span-6 lg:col-span-6 xl:col-span-6 2xl:col-span-6">
                <label for="cliente" class="block text-sm font-medium text-gray-700 dark:text-gray-400">Cliente</label>
                <InputText type="text"  v-mayuscula class="form-input w-full " v-model="datoscampos.cliente" name="cliente" placeholder="cliente" id="actualizarcliente" />
            </div>
<div class="col-span-12 sm:col-span-12 md:col-span-2 lg:col-span-2 xl:col-span-2 2xl:col-span-2">
                <label for="cliente" class="block text-sm font-medium text-gray-700 dark:text-gray-400">Telefono Cliente</label>
                <InputText type="text"  v-mayuscula class="form-input w-full " v-model="datoscampos.telefono_cliente" name="telefono_cliente" placeholder="telefono_cliente" id="actualizartelefono_cliente" />
            </div>

<div class="col-span-12 sm:col-span-12 md:col-span-3 lg:col-span-3 xl:col-span-3 2xl:col-span-3">
                <label for="equipo" class="block text-sm font-medium text-gray-700 dark:text-gray-400">Equipo</label>
                <InputText type="text"  v-mayuscula class="form-input w-full " v-model="datoscampos.equipo" name="equipo" placeholder="equipo" id="actualizarequipo" />
            </div>
<div class="col-span-12 sm:col-span-12 md:col-span-3 lg:col-span-3 xl:col-span-3 2xl:col-span-3">
                <label for="marca" class="block text-sm font-medium text-gray-700 dark:text-gray-400">Marca</label>
                <InputText type="text"  v-mayuscula class="form-input w-full " v-model="datoscampos.marca" name="marca" placeholder="marca" id="actualizarmarca" />
            </div>
<div class="col-span-12 sm:col-span-12 md:col-span-3 lg:col-span-3 xl:col-span-3 2xl:col-span-3">
                <label for="modelo" class="block text-sm font-medium text-gray-700 dark:text-gray-400">Modelo</label>
                <InputText type="text"  v-mayuscula class="form-input w-full " v-model="datoscampos.modelo" name="modelo" placeholder="modelo" id="actualizarmodelo" />
            </div>
<div class="col-span-12 sm:col-span-12 md:col-span-3 lg:col-span-3 xl:col-span-3 2xl:col-span-3">
                <label for="imei" class="block text-sm font-medium text-gray-700 dark:text-gray-400">Imei</label>
                <InputText type="text"  v-solonumeros class="form-input w-full " v-model="datoscampos.imei" name="imei" placeholder="imei" id="actualizarimei" />
            </div>
<div class="col-span-12 sm:col-span-12 md:col-span-2 lg:col-span-2 xl:col-span-2 2xl:col-span-2">
                    <label for="tipo" class="block text-sm font-medium text-gray-700 dark:text-gray-400">Tipo</label>
                    <Dropdown  v-model="datoscampos.tipo" :options="['PROPIO','CONSIGNADO']" placeholder="Seleccione tipo" class="w-full" />
            </div>
<div class="col-span-12 sm:col-span-12 md:col-span-4 lg:col-span-4 xl:col-span-4 2xl:col-span-4">
                <label for="proveedor" class="block text-sm font-medium text-gray-700 dark:text-gray-400">Proveedor</label>
                <InputText type="text"  v-mayuscula class="form-input w-full " v-model="datoscampos.proveedor" name="proveedor" placeholder="proveedor" id="actualizarproveedor" />
            </div>
<div class="col-span-12 sm:col-span-12 md:col-span-2 lg:col-span-2 xl:col-span-2 2xl:col-span-2">
                <label for="fecha_venta" class="block text-sm font-medium text-gray-700 dark:text-gray-400">Fecha venta</label>
                <InputText type="text"  class="form-input w-full " v-model="datoscampos.fecha_venta" name="fecha_venta" placeholder="fecha_venta" id="actualizarfecha_venta" />
            </div>
<div class="col-span-12 sm:col-span-12 md:col-span-2 lg:col-span-2 xl:col-span-2 2xl:col-span-2">
                <label for="fecha_ingreso" class="block text-sm font-medium text-gray-700 dark:text-gray-400">Fecha ingreso</label>
                <InputText type="text"  class="form-input w-full " v-model="datoscampos.fecha_ingreso" name="fecha_ingreso" placeholder="fecha_ingreso" id="actualizarfecha_ingreso" />
            </div>
<div class="col-span-12 sm:col-span-12 md:col-span-2 lg:col-span-2 xl:col-span-2 2xl:col-span-2">
                <label for="hora" class="block text-sm font-medium text-gray-700 dark:text-gray-400">Hora</label>
                <InputText type="text"  class="form-input w-full " v-model="datoscampos.hora" name="hora" placeholder="hora" id="actualizarhora" />
            </div>
<div class="col-span-12 sm:col-span-12 md:col-span-12 lg:col-span-12 xl:col-span-12 2xl:col-span-12">
                    <label for="fallas" class="block text-sm font-medium text-gray-700 dark:text-gray-400">Fallas</label>
                   <Textarea id="actualizarfallas"  v-model="datoscampos.fallas" name="fallas" rows="3" class="form-textarea w-full " placeholder="Enter Fallas"></textarea>
                </div>
<div class="col-span-12 sm:col-span-12 md:col-span-12 lg:col-span-12 xl:col-span-12 2xl:col-span-12">
                    <label for="solucion" class="block text-sm font-medium text-gray-700 dark:text-gray-400">Solucion</label>
                   <Textarea id="actualizarsolucion"  v-model="datoscampos.solucion" name="solucion" rows="3" class="form-textarea w-full " placeholder="Enter Solucion"></textarea>
                </div>
<div class="col-span-12 sm:col-span-12 md:col-span-2 lg:col-span-2 xl:col-span-2 2xl:col-span-2">
                <label for="tecnico" class="block text-sm font-medium text-gray-700 dark:text-gray-400">Tecnico</label>
                <InputText type="text"  v-mayuscula class="form-input w-full " v-model="datoscampos.tecnico" name="tecnico" placeholder="tecnico" id="actualizartecnico" />
            </div>
<div class="col-span-12 sm:col-span-12 md:col-span-2 lg:col-span-2 xl:col-span-2 2xl:col-span-2">
                    <label for="estado" class="block text-sm font-medium text-gray-700 dark:text-gray-400">Estado</label>
                    <Dropdown v-model="datoscampos.estado" :options="['PENDIENTE','REPARADO','ENTREGADO','A TALLER']" placeholder="Seleccione estado" class="w-full" />
            </div>
<div class="col-span-12 sm:col-span-12 md:col-span-2 lg:col-span-2 xl:col-span-2 2xl:col-span-2">
                <label for="fecha_reparacion" class="block text-sm font-medium text-gray-700 dark:text-gray-400">Fecha reparacion</label>
                <InputText type="text"  class="form-input w-full " v-model="datoscampos.fecha_reparacion" name="fecha_reparacion" placeholder="fecha_reparacion" id="actualizarfecha_reparacion" />
            </div>
<div class="col-span-12 sm:col-span-12 md:col-span-2 lg:col-span-2 xl:col-span-2 2xl:col-span-2">
                <label for="fecha_entrega" class="block text-sm font-medium text-gray-700 dark:text-gray-400">Fecha entrega</label>
                <InputText type="text"  class="form-input w-full " v-model="datoscampos.fecha_entrega" name="fecha_entrega" placeholder="fecha_entrega" id="actualizarfecha_entrega" />
            </div>
<div class="col-span-12 sm:col-span-12 md:col-span-2 lg:col-span-2 xl:col-span-2 2xl:col-span-2">
                <label for="no_taller" class="block text-sm font-medium text-gray-700 dark:text-gray-400">No Factura</label>
                <InputText type="text"  v-solonumeros class="form-input w-full " v-model="datoscampos.no_factura" name="no_factura" placeholder="no_factura" id="actualizarno_factura" readonly />
            </div>

<div class="col-span-12 sm:col-span-12 md:col-span-2 lg:col-span-2 xl:col-span-2 2xl:col-span-2">
                <label for="no_taller" class="block text-sm font-medium text-gray-700 dark:text-gray-400">No taller</label>
                <InputText type="text"  v-solonumeros class="form-input w-full " v-model="datoscampos.no_taller" name="no_taller" placeholder="no_taller" id="actualizarno_taller" readonly />
            </div>


<div class="col-span-12 sm:col-span-12 md:col-span-6 lg:col-span-6 xl:col-span-6 2xl:col-span-6">
                <label for="recibido_por" class="block text-sm font-medium text-gray-700 dark:text-gray-400">Recibido por</label>
                <InputText type="text"  class="form-input w-full " v-model="datoscampos.recibido_por" name="recibido_por" placeholder="recibido_por" id="actualizarrecibido_por" />
            </div>
<div class="col-span-12 sm:col-span-12 md:col-span-6 lg:col-span-6 xl:col-span-6 2xl:col-span-6">
                <label for="entregado_por" class="block text-sm font-medium text-gray-700 dark:text-gray-400">Entregado por</label>
                <InputText type="text"  class="form-input w-full " v-model="datoscampos.entregado_por" name="entregado_por" placeholder="entregado_por" id="actualizarentregado_por" />
            </div>
<div class="col-span-12 sm:col-span-12 md:col-span-12 lg:col-span-12 xl:col-span-12 2xl:col-span-12">
                    <label for="nota" class="block text-sm font-medium text-gray-700 dark:text-gray-400">Nota</label>
                   <Textarea id="actualizarnota"  v-model="datoscampos.nota" name="nota" rows="3" class="form-textarea w-full " placeholder="Enter Nota"></textarea>
                </div>

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
  </div>
   </form>
   </fieldset>
</section>
  </div>
   </main>
<Toast />
</template>
<style scoped>
</style>

