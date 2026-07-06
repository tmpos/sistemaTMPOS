<script setup>
import { ref, onMounted, nextTick, watchEffect, watch } from 'vue';
import { useToast } from "primevue/usetoast";
import Awesomplete from '@/components/Awesomplete.vue';
import Stepper from 'primevue/stepper';
//import StepPanels from 'primevue/steppanels';
import LoadingOverlay from '@/Loading/LoadingOverlay.vue';
import ImpresoraTaller from '@/components/ImpresoraTaller.vue';
import { useRouter, useRoute } from 'vue-router';
const router = useRouter();

import StepList from 'primevue/steplist';
import StepPanels from 'primevue/steppanels';
import StepItem from 'primevue/stepitem';
import Step from 'primevue/step';
import StepPanel from 'primevue/steppanel';
/*************************************************************/
import flatPickr from 'vue-flatpickr-component';
import 'flatpickr/dist/flatpickr.css';
/*************************************************************/
  const basic = ref({
    dateFormat: 'd/m/Y',
    // position: store.rtlClass === 'rtl' ? 'auto right' : 'auto left',
  });
/*************************************************************/

const route = useRoute();

import { enviarDatosPorPost, eliminarDatos, obtenerIdsSeleccionados, borrarTodoslosDatos, lenguajeDataTable, nfecha, peticiones, generadorCodigo, arrayToObjetoFromTabla, convertirStringAArrayDeObjetos, enviarDatosLocalStorage, peticionesFetch, encryptarPassword, envioElectron, ultimoRegistro, arrayToObjetoFromTablaOffline, peticionesFetchOffline, generarCodigoUnico, mensajetoast, lasMayusculas, crearTablaSiNoExisteOffline } from '@/funciones/funciones.js';
import Swal from 'sweetalert2'
const toast = useToast();
/************************************************************************/
/************************************************************************/
const clientes = ref([]);
const clientesNombre = ref([]);
const clientesCedula = ref([]);
const tecnicos = ref([]);
const abono = ref('0.00');
const prioridad = ref('3');
/************************************************************************/
import {useDatosEmpresa} from '@/stores'
const datosEmpresa = useDatosEmpresa();
const link = ref('');
const api = ref('');
const token = ref('');
const patronTelefono = ref('');
const linkImpresora = ref('');
const patroncedula = ref('');
const tokenCifrado = ref(null);
/************************************************************************/
const loading = ref(false)
const visibleImpresoraTaller = ref(false);
const ordenParaImprimir = ref({});
const formatoImpresion = ref('80mm');
/************************************************************************/
const visibleIMEI = ref(false);
const rowCount = ref(3);
const columnCount = ref(3);
const isDrawing = ref(false);
const pattern = ref([]);
const usuariosData = ref([]);
/************************************************************************/
const datoscamposTaller = ref({})
const codigoUnico = ref(generarCodigoUnico());
const fecha = ref(nfecha('fecha'));
const arrayIMGTaller = ref([]);
/************************************************************************/
const getRutaImagenTaller = () => `../vista/img/taller/${datoscamposTaller.value.imagen}`;

const asegurarImagenTaller = () => {
    if (!datoscamposTaller.value) return;
    if (!datoscamposTaller.value.imagen) {
        datoscamposTaller.value.imagen = generarCodigoUnico();
    }
};

const cargarImagenesTaller = async () => {
    asegurarImagenTaller();
    if (!datoscamposTaller.value?.imagen) {
        arrayIMGTaller.value = [];
        return;
    }

    try {
        const rutaCompleta = getRutaImagenTaller();
        const verificaDir = await peticiones(link.value + api.value + '/verificadirectorio', { ruta: rutaCompleta }, 'POST', tokenCifrado.value);

        if (verificaDir?.[0] === 'error') {
            await peticiones(link.value + api.value + '/creardirectorio', { ruta: rutaCompleta }, 'POST', tokenCifrado.value);
            arrayIMGTaller.value = [];
            return;
        }

        const archivosNombres = await peticiones(link.value + api.value + '/peticionimagenes', { origen: rutaCompleta }, 'POST', tokenCifrado.value);
        arrayIMGTaller.value = Array.isArray(archivosNombres) && archivosNombres[0] !== 'error' ? archivosNombres : [];
    } catch (error) {
        console.error('[TallerImagen] Error cargando imagenes:', error);
        arrayIMGTaller.value = [];
    }
};

const getImagenTallerSrc = (imagen) => {
    if (!imagen) return '';
    if (typeof imagen === 'object') {
        if (imagen.url && !String(imagen.url).startsWith('file:')) return imagen.url;
        if (imagen.nombre) return `${link.value}/vista/img/taller/${datoscamposTaller.value.imagen}/${imagen.nombre}`;
    }
    if (/^(https?:|data:|blob:)/.test(String(imagen))) return imagen;
    return `${link.value}/vista/img/taller/${datoscamposTaller.value.imagen}/${imagen}`;
};

const obtenerNombreImagenTaller = (imagen) => {
    if (!imagen) return '';
    if (typeof imagen === 'object') return imagen.nombre || imagen.name || '';
    return String(imagen).split(/[\\/]/).pop();
};

const handleUploadImagenTaller = async (event) => {
    asegurarImagenTaller();
    const archivos = event.files || [];
    const ruta = getRutaImagenTaller();

    for (const archivo of archivos) {
        const formData = new FormData();
        formData.append('imagen[]', archivo);
        formData.append('ruta', ruta);

        try {
            const response = await fetch(link.value + api.value + '/subirunaimagen2', {
                method: 'POST',
                headers: { Authorization: tokenCifrado.value },
                body: formData
            });
            const resultado = await response.json();

            if (resultado?.[0]?.status === 'ok' || resultado?.[0]?.status === true) {
                await cargarImagenesTaller();
                toast.add({ severity: 'success', summary: 'Exito', detail: 'Imagen subida', life: 3000 });
            } else {
                console.error('[TallerImagen] Error subiendo imagen:', resultado);
                toast.add({ severity: 'error', summary: 'Error', detail: 'Fallo al subir la imagen.', life: 3000 });
            }
        } catch (error) {
            console.error('[TallerImagen] Error subiendo imagen:', error);
            toast.add({ severity: 'error', summary: 'Error', detail: 'Fallo al subir la imagen.', life: 3000 });
        }
    }
};

const deleteImagenTaller = async (imagen) => {
    const nombreArchivo = obtenerNombreImagenTaller(imagen);
    if (!nombreArchivo || !datoscamposTaller.value?.imagen) return;

    const envioDatos = await enviarDatosPorPost(
        link.value + api.value + '/borrararchivo',
        { ruta: getRutaImagenTaller(), archivo: nombreArchivo },
        tokenCifrado.value
    );

    if (envioDatos?.success || envioDatos?.[0] === 'ok') {
        await cargarImagenesTaller();
        toast.add({ severity: 'success', summary: 'Exito', detail: 'Imagen borrada', life: 3000 });
    } else {
        toast.add({ severity: 'error', summary: 'Error', detail: 'Fallo al borrar la imagen.', life: 3000 });
    }
};
/************************************************************************/
const fetchAndSetupData = async () => {
    const jsonData = await arrayToObjetoFromTablaOffline('taller');
    datoscamposTaller.value = jsonData;
    asegurarImagenTaller();
    arrayIMGTaller.value = [];
    datoscamposTaller.value.equipo = datoscamposTaller.value.equipo || 'CELULAR';
    datoscamposTaller.value.marca = datoscamposTaller.value.marca || 'APPLE';
    datoscamposTaller.value.accesorios = datoscamposTaller.value.accesorios || [];
    datoscamposTaller.value.fallas = datoscamposTaller.value.fallas || [];
    datoscamposTaller.value.abono = datoscamposTaller.value.abono || [];
    datoscamposTaller.value.tecnico = datoscamposTaller.value.tecnico || tecnicos.value[0];
    datoscamposTaller.value.estado = datoscamposTaller.value.estado || 'En Revision';
    datoscamposTaller.value.metodopago = datoscamposTaller.value.metodopago || 'EFECTIVO';
    datoscamposTaller.value.metodopago = datoscamposTaller.value.metodopago || 'EFECTIVO';
    datoscamposTaller.value.total = datoscamposTaller.value.total || '0.00';
    datoscamposTaller.value.saldo = datoscamposTaller.value.saldo || '0.00';
    datoscamposTaller.value.manodeobra = datoscamposTaller.value.manodeobra || '0.00';
    datoscamposTaller.value.preciopiezas = datoscamposTaller.value.preciopiezas || '0.00';
    datoscamposTaller.value.fecha_entrega = datoscamposTaller.value.fecha_entrega || nfecha('fechaManana');
    datoscamposTaller.value.fecha_entrada = datoscamposTaller.value.fecha_entrada || nfecha('fecha');
};
/************************************************************************/
const fetchDataClientes = async () => {
const response = await peticionesFetchOffline('getDataAsArray', 'clientes');
    const jsonData = response;
    const cedulas = response;
    clientes.value = jsonData.reverse();
    clientesNombre.value = jsonData.map(cliente=>cliente.nombre);
    clientesCedula.value = cedulas
  .map(cliente => cliente.cedula)
  .filter(cedula => cedula !== "" && cedula !== null);


};
/************************************************************************/
const fetchDataTecnicos = async () => {
const response = await peticionesFetchOffline('getDataAsArray', 'tecnicos');
    const jsonData = response;
   // tecnicos.value = jsonData.reverse();
};
/************************************************************************/
const datosBarcode = ref({})
/************************************************************************/
const fetchDataBarcode = async () => {
const response = await peticionesFetchOffline('getDataAsArray', 'barcode');
    const jsonData = response[0];
    datosBarcode.value = jsonData;
};
/************************************************************************/
const fetchUsuariosDatosarraypost = async () => {
  try {
const response = await peticionesFetchOffline('getDataAsArray', 'usuarios');
    usuariosData.value = response;
    tecnicos.value = response.filter(user=>user.nivel_seguridad === 'Tecnico');
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
onMounted(async() => {

const datosJSON = await envioElectron('datosarchivo');
link.value = datosJSON.VITE_LINKURL;
api.value = datosJSON.VITE_LINK_API;
token.value = datosJSON.VITE_TOKEN;
patronTelefono.value = datosJSON.VITE_PATRON_TELEFONO;
linkImpresora.value = datosJSON.VITE_IMPRESORA_LOCAL;
patroncedula.value = datosJSON.VITE_PATRON_CEDULA;
tokenCifrado.value = await encryptarPassword(token.value, 10);

await crearTablaSiNoExisteOffline('taller', ['imagen'], toast);
await fetchDataTecnicos();
await fetchDataClientes();
await fetchAndSetupData();
await fetchDataBarcode()
await fetchUsuariosDatosarraypost()
    datoscamposTaller.value.tecnico = datoscamposTaller.value.tecnico || tecnicos.value[0];
});
/************************************************************************/
watchEffect(() => {
  if (visibleIMEI.value) {
    nextTick(() => {
       drawExistingPattern();
    });
  }
});
/************************************************************************/
async function imprimirUltimo() {
  const ultimoRegistro = await peticionesFetchOffline('getLastXRows', 'taller','1');

  // Preguntar formato de impresión
  const result = await Swal.fire({
    title: "Formato de Impresión",
    text: "Seleccione el formato para imprimir",
    icon: "question",
    showCancelButton: true,
    showDenyButton: true,
    confirmButtonText: "Térmico 80mm",
    denyButtonText: "Carta (Letter)",
    cancelButtonText: "Cancelar"
  });

  if (result.isConfirmed) {
    // Imprimir en formato térmico
    ordenParaImprimir.value = ultimoRegistro[0];
    formatoImpresion.value = '80mm';
    visibleImpresoraTaller.value = true;
  } else if (result.isDenied) {
    // Imprimir en formato carta
    ordenParaImprimir.value = ultimoRegistro[0];
    formatoImpresion.value = 'carta';
    visibleImpresoraTaller.value = true;
  }

  await printBarcode(ultimoRegistro[0].no_factura,ultimoRegistro[0].nombre);
}
/************************************************************************/
async function enviarDatos(event) {
    event.preventDefault();

var ultimoReg = await ultimoRegistro(link.value+api.value,'taller');

if (ultimoReg.length >0) {
  datoscamposTaller.value.no_factura = generadorCodigo(ultimoReg[0].no_factura,'',7);
}else{
  datoscamposTaller.value.no_factura = '0000001';
}

  const url = link.value+api.value+"/insertar/taller";
  if (!datoscamposTaller.value) {
    toast.add({ severity: 'error', summary: 'Error', detail: 'Datos incompletos, no se puede Enviar.', life: 3000 });
    return;
  }


//datoscamposTaller.value.nombre = datoscamposTaller.value.nombre.nombre;
datoscamposTaller.value.tecnico = datoscamposTaller.value.tecnico?.nombre;

datoscamposTaller.value.almacen = datosEmpresa.empresa.nombre;
asegurarImagenTaller();
sincronizarAbonoTaller();

  if (datoscamposTaller.value.hasOwnProperty('created_at')) {
     datoscamposTaller.value.created_at = nfecha('timestamp')
     datoscamposTaller.value.updated_at = nfecha('timestamp')
    }


   
  const fallas = convertirStringAArrayDeObjetos(datoscamposTaller.value.fallas)
  const accesorios = convertirStringAArrayDeObjetos(datoscamposTaller.value.accesorios)

  const datosTecnico = tecnicos.value.find(tecnico=>tecnico.nombre === datoscamposTaller.value.tecnico)

    datoscamposTaller.value.fallas = JSON.stringify(fallas)
    datoscamposTaller.value.accesorios = JSON.stringify(accesorios)

    //datoscamposTaller.value.pago_tecnico = JSON.stringify({no_orden:datoscamposTaller.value.no_factura,fecha:nfecha('fecha'),equipo:datoscamposTaller.value.equipo+' '+datoscamposTaller.value.marca+' '+datoscamposTaller.value.modelo,monto_cobrado:datoscamposTaller.value.total,costo_piezas:'0.00',porcentaje_tecnico:datosTecnico.porcentaje,beneficio_tecnico:'0.00',beneficio_empresa:'0.00',estado:datoscamposTaller.value.estado,pago_tecnico:'NO COBRADO'})
  datoscamposTaller.value.pago_tecnico = 'NO COBRADO';
  datoscamposTaller.value.beneficio_tecnico = '0.00';
  datoscamposTaller.value.porcentaje_tecnico = datosTecnico?.porcentaje || '0.00';
  datoscamposTaller.value.beneficio_empresa = '0.00';

  const envioDatos = await peticionesFetchOffline('insertData','taller', JSON.stringify(datoscamposTaller.value));
  console.log("envioDatos", envioDatos);
  if (envioDatos[0] == 'ok') {
     toast.add({ severity: 'success', summary: 'Éxito', detail: 'Datos Agregados con éxito.', life: 3000 });
Swal.fire({
  title: "Datos Agregados",
  text: "¿Qué hacemos ahora?",
  icon: "warning",
  showCancelButton: true,
  showDenyButton: true, 
  confirmButtonText: "Agregar Otro!",
  cancelButtonText: "No, Regresar al Inicio!",
  denyButtonText: "Imprimir y Salir!", // Texto del nuevo botón
}).then(async (result) => {
  if (result.isConfirmed) {
    fetchAndSetupData();
  } else if (result.dismiss === Swal.DismissReason.cancel) {
    router.push({ path: `/taller` });
  } else if (result.isDenied) {
    await imprimirUltimo(); 

    router.push({ path: `/taller` }); 
  }
});

  }else{
    toast.add({ severity: 'error', summary: 'Error', detail: 'Fallo al Agregar los datos.', life: 3000 });
  }
}
/************************************************************************/
const seleccionarCliente = async(datos)=>{
  const nombre = datos.value.nombre;
  datoscamposTaller.value.cedula = datos.value.cedula;
  datoscamposTaller.value.telefono = datos.value.telefono;
  datoscamposTaller.value.whatsapp = datos.value.whatsapp;
  datoscamposTaller.value.email = datos.value.email;
  datoscamposTaller.value.direccion = datos.value.direccion;
}
/************************************************************************/

/************************************************************************/
const actualizarCliente = async()=>{
  const datosCLiente = clientes.value.find(cliente=>cliente.cedula === datoscamposTaller.value.cedula)
  if (datosCLiente) {
    //datosCLiente.nombre = datoscamposTaller.value.nombre;
    datosCLiente.telefono = datoscamposTaller.value.telefono;
    datosCLiente.whatsapp = datoscamposTaller.value.whatsapp;
    datosCLiente.email = datoscamposTaller.value.email;
    datosCLiente.direccion = datoscamposTaller.value.direccion;

      const url = link.value+api.value+"/actualizarcampos/clientes";
  if (!datosCLiente) {
    console.error("Datos incompletos, no se puede actualizar.");
    return;
  }

  if (datosCLiente.hasOwnProperty('created_at')) {
      datosCLiente.updated_at = nfecha('timestamp')
    }
  const envioDatos = await peticionesFetchOffline('updateData','clientes', JSON.stringify(datosCLiente));
  if (envioDatos[0] == 'ok') {
     toast.add({ severity: 'success', summary: 'Éxito', detail: 'Datos del cliente Actualizados', life: 3000 });
  }else{
    toast.add({ severity: 'error', summary: 'Error', detail: 'Fallo al actualizar los datos.', life: 3000 });
  }

  }
}
/************************************************************************/
const verificaIMEI = async () => {
  const imei = (datoscamposTaller.value.imei || '').trim();

  if (!imei) {
    toast.add({ severity: 'error', summary: 'Error', detail: 'Debe escribir un IMEI válido', life: 3000 });
    return;
  }

  const datos = {
    servicio: "0",
    imei
  };

  try {
    const consulta = await enviarDatosPorPost(
      'https://demo.tmposrd.com/api2/consultaimei',
      datos,
      tokenCifrado.value
    );

    // ✅ tu respuesta real: consulta.response.success === true
    const ok = consulta?.response?.success === true;

    if (ok) {
      const obj = consulta.response.object || {};

      datoscamposTaller.value.marca  = obj.brand || '';
      datoscamposTaller.value.modelo = obj.modelName || '';

      toast.add({
        severity: 'success',
        summary: 'Éxito',
        detail: `Datos encontrados (${obj.modelName || 'N/A'})`,
        life: 3000
      });

    } else {
      toast.add({
        severity: 'error',
        summary: 'Error',
        detail: consulta?.response?.status || 'No se encuentran datos',
        life: 3000
      });
    }

  } catch (error) {
    console.error('consultaimei error:', error);
    toast.add({ severity: 'error', summary: 'Error', detail: 'Error de petición', life: 3000 });
  }
};

/************************************************************************/
const resetPattern = () => {
  const dots = document.querySelectorAll('.pattern-dot');
  dots.forEach(dot => {
    dot.style.backgroundColor = 'black';
  });
  pattern.value = [];
};

const startDrawing = (rowIndex, colIndex) => {
  isDrawing.value = true;
  pattern.value = [];
  drawPattern(rowIndex, colIndex);
};

const stopDrawing = () => {
  isDrawing.value = false;
  datoscamposTaller.value.clave = pattern.value.join('-');
};

/*const drawPattern = (rowIndex, colIndex) => {
  if (isDrawing.value) {
    event.target.style.backgroundColor = 'black';
        const position = `${rowIndex}-${colIndex}`;
      if (!pattern.value.includes(position)) {
        pattern.value.push(position);
      }
  }
};*/

const drawPattern = (rowIndex, colIndex) => {
  if (isDrawing.value) {
    event.target.style.backgroundColor = '#059669';
    const number = rowIndex * columnCount.value + colIndex + 1;
    if (!pattern.value.includes(number)) {
      pattern.value.push(number);
    }
  }
};

const drawExistingPattern = () => {
  resetPattern();
  if (datoscamposTaller.value.clave) {
    const positions = datoscamposTaller.value.clave.split('-');
    positions.forEach(position => {
      const number = parseInt(position, 10);
      const rowIndex = Math.floor((number - 1) / columnCount.value);
      const colIndex = (number - 1) % columnCount.value;
      nextTick(() => {
        const dot = document.querySelector(`.pattern-row:nth-child(${rowIndex + 2}) .pattern-dot:nth-child(${colIndex + 1})`);
        if (dot) {
          dot.style.backgroundColor = '#059669';
        }
      });
    });
  }
};

watch([rowCount, columnCount], () => {
  resetPattern();
});

const markPattern = () => {
  visibleIMEI.value = false;
  stopDrawing();
  datoscamposTaller.value.clave = pattern.value.join('-')
};

/************************************************************************/
const addAccesorios = (accesorio) => {
  if (datoscamposTaller.value.accesorios.length === 0) {
    datoscamposTaller.value.accesorios = [accesorio];
  } else {
    if (!datoscamposTaller.value.accesorios.includes(accesorio)) {
      datoscamposTaller.value.accesorios.push(accesorio);
    }
  }

};
/************************************************************************/
const addFallas = (accesorio) => {
  if (datoscamposTaller.value.fallas.length === 0) {
    datoscamposTaller.value.fallas = [accesorio];
  } else {
    if (!datoscamposTaller.value.fallas.includes(accesorio)) {
      datoscamposTaller.value.fallas.push(accesorio);
    }
  }

};
/************************************************************************/
const seleccionarTecnico = async(datos)=>{
  const nombre = datos.value.nombre;
}
/************************************************************************/
// Flag para controlar qué campo está siendo editado y evitar loops infinitos
const calculandoCrearTaller = ref(false);

// Watcher para calcular automáticamente cuando cambia el total
watch(() => datoscamposTaller.value.total, (nuevoTotal) => {
  if (calculandoCrearTaller.value) return;

  calculandoCrearTaller.value = true;

  const total = parseFloat(nuevoTotal) || 0;
  const preciopiezas = parseFloat(datoscamposTaller.value.preciopiezas) || 0;

  // Si se ingresa total y hay piezas, calcular mano de obra
  if (preciopiezas > 0) {
    datoscamposTaller.value.manodeobra = Math.max(0, total - preciopiezas).toFixed(2);
  } else {
    // Si no hay piezas, la mano de obra es igual al total
    datoscamposTaller.value.manodeobra = total.toFixed(2);
  }

  // Calcular saldo
  const abono2 = parseFloat(abono.value) || 0;
  datoscamposTaller.value.saldo = (total - abono2).toFixed(2);

  calculandoCrearTaller.value = false;
});

// Watcher para calcular el total cuando cambia la mano de obra
watch(() => datoscamposTaller.value.manodeobra, (nuevaManoDeObra) => {
  if (calculandoCrearTaller.value) return;

  calculandoCrearTaller.value = true;

  const manodeobra = parseFloat(nuevaManoDeObra) || 0;
  const preciopiezas = parseFloat(datoscamposTaller.value.preciopiezas) || 0;

  // Calcular total sumando mano de obra + piezas
  const total = manodeobra + preciopiezas;
  datoscamposTaller.value.total = total.toFixed(2);

  // Calcular saldo
  const abono2 = parseFloat(abono.value) || 0;
  datoscamposTaller.value.saldo = (total - abono2).toFixed(2);

  calculandoCrearTaller.value = false;
});

// Watcher para recalcular cuando cambia el costo de piezas
watch(() => datoscamposTaller.value.preciopiezas, (nuevoPrecioPiezas) => {
  if (calculandoCrearTaller.value) return;

  calculandoCrearTaller.value = true;

  const preciopiezas = parseFloat(nuevoPrecioPiezas) || 0;
  const total = parseFloat(datoscamposTaller.value.total) || 0;

  // Siempre calcular mano de obra restando pieza del total, SIN cambiar el total
  datoscamposTaller.value.manodeobra = Math.max(0, total - preciopiezas).toFixed(2);

  calculandoCrearTaller.value = false;
});

const sincronizarAbonoTaller = () => {
  const total = parseFloat(datoscamposTaller.value.total) || 0;
  const abono2 = parseFloat(abono.value) || 0;
  datoscamposTaller.value.saldo = (total - abono2).toFixed(2);

  const datos = {
    "abono": abono2.toFixed(2),
    "prioridad": prioridad.value,
    "recibidopor": "Soporte",
    "turno": "280420241514073",
    "cajero": "soporte@versatframework.com",
    "metodo_pago": datoscamposTaller.value.metodopago || 'EFECTIVO',
    "hora": nfecha('hora'),
    "fecha": nfecha('fecha')
  };
  datoscamposTaller.value.abono = JSON.stringify([datos]);
};

// Watcher para recalcular saldo cuando cambia el abono
watch(() => abono.value, () => {
  if (calculandoCrearTaller.value) return;
  sincronizarAbonoTaller();
});

/************************************************************************/
const fnAwesomplete = ()=>{

}
const handleSelectComplete = async(selected)=>{
 const datos = clientes.value.find(cliente=>cliente.nombre === selected.value)
 datoscamposTaller.value.nombre = datos.nombre
 datoscamposTaller.value.cedula = datos.cedula
 datoscamposTaller.value.telefono = datos.telefono
 datoscamposTaller.value.whatsapp = datos.whatsapp
 datoscamposTaller.value.email = datos.email
 datoscamposTaller.value.direccion = datos.direccion

}
/************************************************************************/
const fnAwesompleteCed = ()=>{

}
const handleSelectCompleteCed = (selected)=>{
   const datos = clientes.value.find(cliente=>cliente.cedula === selected.value)
 datoscamposTaller.value.nombre = datos.nombre
 datoscamposTaller.value.cedula = datos.cedula
 datoscamposTaller.value.telefono = datos.telefono
 datoscamposTaller.value.whatsapp = datos.whatsapp
 datoscamposTaller.value.email = datos.email
 datoscamposTaller.value.direccion = datos.direccion
}
/************************************************************************/
const fnBuscarCedula = async()=>{
  loading.value = true;
  let response = null;

  try{
    response = await peticionesFetch(
                'https://demo.tmposrd.com/api2',
                'buscarcedula',
                { cedula: datoscamposTaller.value.cedula },
                tokenCifrado.value,
                'POST'
              );

//clientesNombre.value

    if(response && response.datos){
      datoscamposTaller.value.nombre = response.datos.name 
    }
  loading.value = false;
  toast.add({ severity: 'success', summary: 'OK', detail: 'Datos encontrados', life: 3000 });
  }catch(error){
  loading.value = false;
    toast.add({ severity: 'error', summary: 'Error', detail: 'Ocurrió un error al consultar los datos.', life: 3000 });
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
</script>
<template>
<main class="crear-taller-wrapper">
  <div class="crear-taller-container">

    <!-- Modern Header -->
    <div class="crear-taller-header">
      <div class="crear-taller-header-content">
        <div class="crear-taller-icon-wrapper">
          <i class="pi pi-wrench crear-taller-icon"></i>
        </div>
        <div class="crear-taller-header-copy">
          <h1 class="crear-taller-title">Nueva Orden de Reparación</h1>
          <p class="crear-taller-subtitle">Registro completo de servicio técnico</p>
        </div>
      </div>
    </div>

    <!-- Actions Card -->
    <Card class="crear-taller-actions-card">
      <template #content>
        <div class="crear-taller-actions-grid">
          <router-link to="/taller">
            <Button icon="pi pi-home" label="Inicio" severity="secondary" outlined />
          </router-link>
        </div>
      </template>
    </Card>

    <!-- Section Divider -->
    <div class="crear-taller-section-divider">
      <div class="crear-taller-divider-line"></div>
      <div class="crear-taller-divider-content">
        <i class="pi pi-list"></i>
        <span>Formulario de Orden</span>
      </div>
      <div class="crear-taller-divider-line"></div>
    </div>

    <!-- Form Card -->
    <Card class="crear-taller-form-card">
      <template #content>
<Stepper value="1" class="crear-taller-stepper">
  <StepList>
        <Step value="1">CLIENTE</Step>
        <Step value="2">EQUIPO</Step>
        <Step v-if="false" value="3">ACCESORIOS</Step>
        <Step value="3">FALLAS</Step>
        <Step value="4">IMAGENES</Step>
        <Step value="5">GENERAR</Step>
    </StepList>
    <StepPanels>
    <StepPanel v-slot="{ activateCallback }" value="1">

            <div class="flex flex-column h-12remA">
              <div class="grid grid-cols-12 gap-4">
<div class="form-group col-span-12 sm:col-span-2 md:col-span-2 lg:col-span-2 xl:col-span-2" >
<label for="cedulaAgregarDatos">CEDULA</label>

<InputGroup>
            <Awesomplete
                    class="dropdown-input"
                    v-model="datoscamposTaller.cedula"
                    @change="actualizarCliente"
                    @selectComplete="handleSelectCompleteCed"
                    @keydown.enter="fnBuscarCedula"
                    :list="clientesCedula" />
          <!--   </awesomplete> -->
    <InputGroupAddon>
        <Button icon="pi pi-search" severity="secondary" variant="text" @click="fnBuscarCedula" />
    </InputGroupAddon>
</InputGroup>


</div>
<div class="form-group col-span-12 sm:col-span-4 md:col-span-4 lg:col-span-4 xl:col-span-4" >
<label for="nombreAgregarDatos">NOMBRE</label>

               <Awesomplete
                    class="dropdown-input"
                    v-model="datoscamposTaller.nombre"
                    @change="fnAwesomplete"
                    v-mayuscula
                    @selectComplete="handleSelectComplete"
                    :list="clientesNombre" />
         <!--    </awesomplete> -->

</div>
<div class="form-group col-span-12 sm:col-span-2 md:col-span-2 lg:col-span-2 xl:col-span-2" >
<label for="telefonoAgregarDatos">TELEFONO</label>
<InputMask id="telefonoAgregarDatos" class="form-control" @change="actualizarCliente" @focus="$event.target.select()" v-model="datoscamposTaller.telefono" :mask="patronTelefono" :placeholder="patronTelefono" />
</div>
<div class="form-group col-span-12 sm:col-span-2 md:col-span-2 lg:col-span-2 xl:col-span-2" >
<label for="whatsappAgregarDatos">WHATSAPP</label>
<InputMask id="whatsappAgregarDatos" class="form-control" @change="actualizarCliente" @focus="$event.target.select()" v-model="datoscamposTaller.whatsapp" :mask="patronTelefono" :placeholder="patronTelefono" />
</div>

<div class="form-group col-span-12 sm:col-span-2 md:col-span-2 lg:col-span-2 xl:col-span-2" >
<label for="emailAgregarDatos">EMAIL</label>
<!-- <Input type="input" v-model="datoscamposTaller.email" @change="actualizarCliente" name="email"  class="form-controlS " id="emailAgregarDatos"  placeholder="email" maxlength="250" /> -->
<InputText v-model="datoscamposTaller.email" @change="actualizarCliente" @focus="$event.target.select()" placeholder="email" />
</div>

<div class="form-group col-span-12 sm:col-span-12 md:col-span-12 lg:col-span-12 xl:col-span-12" >
<label for="direccionAgregarDatos">DIRECCION</label>
<textarea class="form-control " @change="actualizarCliente" v-model="datoscamposTaller.direccion" id="direccionAgregarDatos" name="direccion" cols="30" rows="3" ></textarea>
</div>
              </div>


        </div>
        <div class="flex pt-4 justify-content-end">
              <Button label="Next" icon="pi pi-arrow-right" iconPos="right" @click="activateCallback('2')" />
            </div>
    </StepPanel>
    <StepPanel  v-slot="{ activateCallback }" value="2">

            <div class="flex flex-column h-12rem">
              <div class="grid grid-cols-12 gap-4">
<div class="form-group col-span-12 sm:col-span-4 md:col-span-4 lg:col-span-4 xl:col-span-4 flex flex-col gap-1" >
<label for="equipoAgregarDatos">EQUIPO</label>
<!-- <input type="input" v-model="datoscamposTaller.equipo" name="equipo"  class="form-control mayusc" id="equipoAgregarDatos" v-mayuscula placeholder="equipo" maxlength="250"> -->
<InputText type="text" id="equipoAgregarDatos" v-model="datoscamposTaller.equipo" @focus="$event.target.select()" placeholder="Equipo" />
</div>
<div class="form-group col-span-12 sm:col-span-4 md:col-span-4 lg:col-span-4 xl:col-span-4 flex flex-col gap-1" >
<label for="imeiAgregarDatos">IMEI</label>
<InputGroup>
<InputMask id="imei" @blur="verificaIMEI" @focus="$event.target.select()" v-model="datoscamposTaller.imei" mask="999999999999999" placeholder="999999999999999" />
</InputGroup>
</div>
<div class="form-group col-span-12 sm:col-span-4 md:col-span-4 lg:col-span-4 xl:col-span-4 flex flex-col gap-1" >
<label for="modeloAgregarDatos">MODELO</label>
<!-- <input type="input" v-model="datoscamposTaller.modelo" name="modelo"  class="form-control " id="modeloAgregarDatos"  placeholder="modelo" maxlength="250"> -->
<InputText type="text" id="modeloAgregarDatos" v-model="datoscamposTaller.modelo" @focus="$event.target.select()" placeholder="Modelo" />
</div>
<div class="form-group col-span-12 sm:col-span-4 md:col-span-4 lg:col-span-4 xl:col-span-4 flex flex-col gap-1" >
<label for="marcaAgregarDatos">MARCA</label>
<!-- <input type="input" v-model="datoscamposTaller.marca" name="marca"  class="form-control mayusc" id="marcaAgregarDatos" v-mayuscula placeholder="marca" maxlength="250"> -->
<InputText type="text" id="marcaAgregarDatos" v-model="datoscamposTaller.marca" @focus="$event.target.select()" placeholder="Marca" />
</div>
<div class="form-group col-span-12 sm:col-span-4 md:col-span-4 lg:col-span-4 xl:col-span-4 flex flex-col gap-1" >
<label for="serialAgregarDatos">SERIAL</label>
<!-- <input type="input" v-model="datoscamposTaller.serial" name="serial"  class="form-control " id="serialAgregarDatos"  placeholder="serial" maxlength="250"> -->
<InputText type="text" id="serialAgregarDatos" v-model="datoscamposTaller.serial" @focus="$event.target.select()" placeholder="Serial" />
</div>
<div class="form-group col-span-12 sm:col-span-4 md:col-span-4 lg:col-span-4 xl:col-span-4" >
<label for="claveAgregarDatos">CLAVE</label>

<InputGroup>

<InputText v-model="datoscamposTaller.clave" @focus="$event.target.select()" placeholder="Clave" />
    <Button label="Patron" @click="visibleIMEI = true" icon="pi pi-ellipsis-v" severity="contrast" />
</InputGroup>


</div>
              </div>

            </div>
            <div class="flex pt-4 justify-content-between">
              <Button label="Back" severity="secondary" icon="pi pi-arrow-left" @click="activateCallback('1')" />
              <Button label="Next" icon="pi pi-arrow-right" iconPos="right" @click="activateCallback('3')" />
            </div>
    </StepPanel>
    <StepPanel v-if="false"  v-slot="{ activateCallback }" value="3">
         <div class="flex flex-column h-12rem">
              <div class="grid grid-cols-12 gap-4">

              <div class="col-span-12 mb-2 mt-2">
              <InputGroup>
                <div class="flex align-items-center">
                  <Checkbox id="simcard" @change="addAccesorios('Simcard')" value="Simcard" />
                  <label for="simcard" class="ms-2"> Simcard </label>
                </div>

                <div class="flex align-items-center ms-2">
                  <Checkbox id="sdcard" @change="addAccesorios('Memoria SD')" value="Memoria SD" />
                  <label for="sdcard" class="ms-2"> Memoria SD </label>
                </div>

                <div class="flex align-items-center ms-2">
                  <Checkbox id="cargador" @change="addAccesorios('Cargador')" value="Cargador" />
                  <label for="cargador" class="ms-2"> Cargador </label>
                </div>

                <div class="flex align-items-center ms-2">
                  <Checkbox id="bateria" @change="addAccesorios('Batería')" value="Batería" />
                  <label for="bateria" class="ms-2"> Batería </label>
                </div>

                <div class="flex align-items-center ms-2">
                  <Checkbox id="cover" @change="addAccesorios('Cover')" value="Cover" />
                  <label for="cover" class="ms-2"> Cover </label>
                </div>

                <div class="flex align-items-center ms-2">
                  <label for="cover" class="ms-2 text-danger">POR FAVOR NO RECIBIR LOS EQUIPOS CON ACCESORIOS </label>
                </div>

              </InputGroup>
              </div>
                <div class="col-span-12 mb-2 mt-2">
                <Button label="Garantía" severity="secondary" text raised />
              </div>
        </div>
        </div>
        <div class="flex pt-4 justify-content-between">
              <Button label="Back" severity="secondary" icon="pi pi-arrow-left" @click="activateCallback('2')" />
              <Button label="Next" icon="pi pi-arrow-right" iconPos="right" @click="activateCallback('4')" />
        </div>
    </StepPanel>
    <StepPanel v-slot="{ activateCallback }" value="3">
        <div class="flex flex-col h-48">
            <div class="flex flex-column h-12rem">
              <div class="grid grid-cols-12 gap-4">
              <div class="col-span-12 mb-2 mt-2">
              <InputGroup>
                <div class="flex align-items-center ">
                  <Checkbox id="noenciende" @change="addFallas('No Enciende')" value="No Enciende" />
                  <label for="noenciende" class="ms-2"> No Enciende </label>
                </div>
                <div class="flex align-items-center ms-2">
                  <Checkbox id="Pantalla" @change="addFallas('Pantalla')" value="Pantalla" />
                  <label for="Pantalla" class="ms-2"> Pantalla </label>
                </div>
                <div class="flex align-items-center ms-2">
                  <Checkbox id="Bateria" @change="addFallas('Bateria')" value="Bateria" />
                  <label for="Bateria" class="ms-2"> Bateria </label>
                </div>
                <div class="flex align-items-center ms-2">
                  <Checkbox id="FlexdeCarga" @change="addFallas('Flex de Carga')" value="Flex de Carga" />
                  <label for="FlexdeCarga" class="ms-2"> Flex de Carga </label>
                </div>

                <div class="flex align-items-center ms-2">
                  <Checkbox id="CamaraDelantera" @change="addFallas('Camara Delantera')" value="Camara Delantera" />
                  <label for="CamaraDelantera" class="ms-2"> Camara Delantera </label>
                </div>

                <div class="flex align-items-center ms-2">
                  <Checkbox id="MIcroSoldadura" @change="addFallas('Micro Soldadura')" value="MIcro Soldadura" />
                  <label for="MIcroSoldadura" class="ms-2"> Micro Soldadura </label>
                </div>

                <div class="flex align-items-center ms-2">
                  <Checkbox id="ChequeoGeneral" @change="addFallas('Chequeo General')" value="Chequeo General" />
                  <label for="ChequeoGeneral" class="ms-2"> Chequeo General </label>
                </div>

              </InputGroup>
              </div>
                <div class="form-group col-span-12 sm:col-span-12 md:col-span-12 lg:col-span-12 xl:col-span-12" >
                <label for="fallasAgregarDatos">FALLAS</label>
                <InputGroup>
                 <Chips v-model="datoscamposTaller.fallas" separator="," :allowDuplicate="false"  />
                  </InputGroup>
                </div>
              </div>
           </div>
           <div class="flex pt-4 justify-content-between">
              <Button label="Back" severity="secondary" icon="pi pi-arrow-left" @click="activateCallback('2')" />
              <Button label="Next" icon="pi pi-arrow-right" iconPos="right" @click="activateCallback('4')" />
            </div>
        </div>
    </StepPanel>
    <StepPanel v-slot="{ activateCallback }" value="4">
      <div class="flex flex-col gap-4">
        <div class="border rounded-lg p-4 bg-gray-50">
          <h3 class="text-lg font-semibold mb-3 flex items-center gap-2">
            <i class="pi pi-images text-teal-600"></i>
            Imagenes del dispositivo
          </h3>
          <FileUpload
            :customUpload="true"
            :auto="true"
            chooseLabel="Seleccionar Imagenes"
            @uploader="handleUploadImagenTaller"
            :multiple="true"
            accept="image/*"
          />

          <div v-if="arrayIMGTaller.length" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
            <div
              v-for="imagen in arrayIMGTaller"
              :key="obtenerNombreImagenTaller(imagen)"
              class="rounded-lg border border-slate-200 bg-white p-3 shadow-sm"
            >
              <Image :src="getImagenTallerSrc(imagen)" preview imageClass="h-44 w-full rounded-md object-cover" />
              <Button
                type="button"
                label="Eliminar"
                icon="pi pi-trash"
                severity="danger"
                class="mt-3 w-full"
                @click.prevent="deleteImagenTaller(imagen)"
              />
            </div>
          </div>

          <div v-else class="rounded-lg border border-dashed border-slate-300 bg-white p-5 mt-4 text-center text-sm text-slate-500">
            Esta orden no tiene imagenes registradas.
          </div>
        </div>
      </div>
      <div class="flex pt-4 justify-content-between">
        <Button label="Back" severity="secondary" icon="pi pi-arrow-left" @click="activateCallback('3')" />
        <Button label="Next" icon="pi pi-arrow-right" iconPos="right" @click="activateCallback('5')" />
      </div>
    </StepPanel>
    <StepPanel  v-slot="{ activateCallback }" value="5">
      <div class="flex flex-col">
            <div class="flex flex-column">
              <div class="grid grid-cols-12 gap-4">

        <div class="form-group col-span-12 sm:col-span-12 md:col-span-12 lg:col-span-12 xl:col-span-12" hidden>
        <label for="reparacionAgregarDatos">REPARACION</label>
        <textarea class="form-control " id="reparacionAgregarDatos" v-model="datoscamposTaller.reparacion" name="reparacion" cols="30" rows="3" ></textarea>
        </div>
        <div class="form-group col-span-12 sm:col-span-12 md:col-span-12 lg:col-span-12 xl:col-span-12" hidden>
        <label for="piezasAgregarDatos">PIEZAS</label>
        <textarea class="form-control " id="piezasAgregarDatos" v-model="datoscamposTaller.piezas" name="piezas" cols="30" rows="3" ></textarea>
        </div>

        <div class="form-group col-span-12 sm:col-span-2 md:col-span-2 lg:col-span-2 xl:col-span-2" >
        <label for="tecnicoAgregarDatos">TECNICO</label>

        <InputGroup>
        <Dropdown v-model="datoscamposTaller.tecnico" @change="seleccionarTecnico"  :options="tecnicos" optionLabel="nombre" placeholder="Seleccione un Técnico" class="w-full md:w-14rem" />
        </InputGroup>

      </div>
        <div class="form-group col-span-12 sm:col-span-2 md:col-span-2 lg:col-span-2 xl:col-span-2" >
        <label for="metodopagoAgregarDatos">METODOPAGO</label>

        <select v-model="datoscamposTaller.metodopago" name="metodopago"  class="form-control " id="metodopagoAgregarDatos">
          <option value="EFECTIVO">EFECTIVO</option>
          <option value="TRANSFERENCIA">TRANSFERENCIA</option>
          <option value="TARJETA">TARJETA</option>
        </select>
        </div>
        <div class="form-group col-span-12 sm:col-span-2 md:col-span-2 lg:col-span-2 xl:col-span-2" >
        <label for="fecha_entradaAgregarDatos">FECHA ENTRADA</label>
        <input type="input" v-model="datoscamposTaller.fecha_entrada" name="fecha_entrada"  class="form-control " id="fecha_entradaAgregarDatos"  placeholder="fecha_entrada" maxlength="250" readonly>
        </div>
        <div class="form-group col-span-12 sm:col-span-2 md:col-span-2 lg:col-span-2 xl:col-span-2" >
        <label for="fecha_entregaAgregarDatos">FECHA ENTREGA</label>
<!--         <input type="input" v-model="datoscamposTaller.fecha_entrega" name="fecha_entrega"  class="form-control " id="fecha_entregaAgregarDatos"  placeholder="fecha_entrega" maxlength="250"> -->
        <flat-pickr v-model="datoscamposTaller.fecha_entrega"  class="form-input " :config="basic"></flat-pickr>
        </div>
        <div class="form-group col-span-12 sm:col-span-2 md:col-span-2 lg:col-span-2 xl:col-span-2" >
        <label for="no_facturaAgregarDatos">NO ORDEN</label>
        <input type="input" v-model="datoscamposTaller.no_factura" name="no_factura"  class="form-control " id="no_facturaAgregarDatos"  placeholder="no_factura" maxlength="250" readonly>
        </div>
        <div class="form-group col-span-12 sm:col-span-2 md:col-span-2 lg:col-span-2 xl:col-span-2" >
        <label for="estadoAgregarDatos">ESTADO</label>
        <select class="form-control " v-model="datoscamposTaller.estado" id="estadoAgregarDatos" name="estado" >
          <option value="En Revision">En Revision</option>
        </select></div>
        <div class="form-group col-span-12 sm:col-span-2 md:col-span-2 lg:col-span-2 xl:col-span-2" >
        <label for="metodopagoAgregarDatos">PRIORIDAD</label>

        <select v-model="prioridad" name="metodopago"  class="form-control " id="prioridadAgregarDatos">
          <option value="1">1</option>
          <option value="2">2</option>
          <option value="3">3</option>
        </select>
        </div>

<!--         <div class="form-group col-span-12 sm:col-span-2 md:col-span-2 lg:col-span-2 xl:col-span-2" >
        <label for="preciopiezasAgregarDatos">PRECIO PIEZAS</label>
        <input type="input" v-model="datoscamposTaller.preciopiezas" name="preciopiezas"  class="form-control soloNumero" v-numeroFocusinOut v-decimales id="preciopiezasAgregarDatos" v-solonumeros placeholder="preciopiezas" maxlength="250">
        </div> -->
        <div class="form-group col-span-12 sm:col-span-2 md:col-span-2 lg:col-span-2 xl:col-span-2" >
        <label for="totalAgregarDatos">TOTAL A COBRAR AL CLIENTE</label>
        <InputNumber
          id="totalAgregarDatos"
          v-model="datoscamposTaller.total"
          mode="currency"
          currency="USD"
          locale="en-US"
          :minFractionDigits="2"
          :maxFractionDigits="2"
          placeholder="$0.00"
          fluid
          @focus="$event.target.select()"
        />
        </div>
        <div class="form-group col-span-12 sm:col-span-2 md:col-span-2 lg:col-span-2 xl:col-span-2" >
        <label for="manodeobraAgregarDatos">MANO DE OBRA</label>
        <InputNumber
          id="manodeobraAgregarDatos"
          v-model="datoscamposTaller.manodeobra"
          mode="currency"
          currency="USD"
          locale="en-US"
          :minFractionDigits="2"
          :maxFractionDigits="2"
          placeholder="$0.00"
          fluid
          @focus="$event.target.select()"
        />
        </div>
        <div class="form-group col-span-12 sm:col-span-2 md:col-span-2 lg:col-span-2 xl:col-span-2" >
        <label for="preciopiezasAgregarDatos">COSTO PIEZA</label>
        <InputNumber
          id="preciopiezasAgregarDatos"
          v-model="datoscamposTaller.preciopiezas"
          mode="currency"
          currency="USD"
          locale="en-US"
          :minFractionDigits="2"
          :maxFractionDigits="2"
          placeholder="$0.00"
          fluid
          @focus="$event.target.select()"
        />
        </div>
        <div class="form-group col-span-12 sm:col-span-2 md:col-span-2 lg:col-span-2 xl:col-span-2" >
        <label for="abonoAgregarDatos">ABONO</label>
        <InputNumber
          id="abonoAgregarDatos"
          v-model="abono"
          mode="currency"
          currency="USD"
          locale="en-US"
          :minFractionDigits="2"
          :maxFractionDigits="2"
          placeholder="$0.00"
          fluid
          @focus="$event.target.select()"
        />
        </div>
        <div class="form-group col-span-12 sm:col-span-2 md:col-span-2 lg:col-span-2 xl:col-span-2" >
        <label for="saldoAgregarDatos">SALDO</label>
        <InputNumber
          id="saldoAgregarDatos"
          v-model="datoscamposTaller.saldo"
          mode="currency"
          currency="USD"
          locale="en-US"
          :minFractionDigits="2"
          :maxFractionDigits="2"
          placeholder="$0.00"
          fluid
          readonly
          disabled
        />
        </div>
        <div class="form-group col-span-12 sm:col-span-12 md:col-span-12 lg:col-span-12 xl:col-span-12" >
        <label for="observacionesAgregarDatos">OBSERVACIONES</label>
        <textarea class="form-control " id="observacionesAgregarDatos" v-model="datoscamposTaller.observaciones" name="observaciones" cols="30" rows="3" ></textarea>
        </div>

        <div class="form-group col-span-12" hidden>
        <label for="usuarioAgregarDatos">USUARIO</label>
        <input type="input" v-model="datoscamposTaller.usuario" name="usuario"  class="form-control " id="usuarioAgregarDatos"  placeholder="usuario" maxlength="250">
        </div>
        <div class="form-group sm:col-span-12 mb-5 mt-5">
        <button type="submit" @click="enviarDatos" class="btn btn-primary elboton w-100">Enviar Datos</button>
          </div>
              </div>
            </div>
          </div>
            <div class="flex pt-4 justify-content-start mt-2">
              <Button label="Back" severity="secondary" icon="pi pi-arrow-left" @click="activateCallback('4')" />
            </div>
    </StepPanel>
    </StepPanels>
</Stepper>
      </template>
    </Card>

  </div>
</main>

<!-- ////////////////////////////////////////////////////////////////////////////////////////// -->
  <Dialog v-model:visible="visibleIMEI" modal header="Crear Patrón" :style="{ width: '30rem' }">
    <fieldset class="border p-3 rounded mb-2">
      <legend class="float-none w-auto px-2">PATRON</legend>
      <form id="formularioActualizarCuentas">
        <div class="grid grid-cols-12 gap-4">
          <div id="rowInput" class="form-group col-span-4">
            <label for="rowCount">Filas: </label>
            <input type="number" class="form-control" id="rowCount" v-model="rowCount">
          </div>
          <div id="columnInput" class="form-group col-span-4">
            <label for="columnCount">Columnas: </label>
            <input type="number" class="form-control" id="columnCount" v-model="columnCount">
          </div>
          <div id="reseteadorDiv" class="form-group col-span-4">
            <label>Reseteador: </label>
            <Button label="Resetear" @click.prevent="resetPattern" />
          </div>
        </div>
        <div v-for="(row, rowIndex) in rowCount" :key="rowIndex" class="pattern-row">
          <div v-for="(col, colIndex) in columnCount" :key="colIndex"
               class="pattern-dot"
               @mousedown="() => startDrawing(rowIndex, colIndex)"
               @mouseup="stopDrawing"
               @mouseover="drawPattern(rowIndex, colIndex)">
          </div>
        </div>
      </form>
    </fieldset>
    <template #footer>
      <Button label="Agregar Patrón" outlined severity="secondary" @click="markPattern" />
    </template>
  </Dialog>
 <!-- ////////////////////////////////////////////////////////////////////////////////////////// -->

 <LoadingOverlay :visible="loading" />

  <!-- Impresora de Taller -->
  <ImpresoraTaller
    v-model:visible="visibleImpresoraTaller"
    :ordenData="ordenParaImprimir"
    :empresaData="datosEmpresa.empresa"
    :formatoImpresion="formatoImpresion"
    @close="visibleImpresoraTaller = false"
  />

<Toast />
</template>

<style scoped>
@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Main Wrapper */
.crear-taller-wrapper {
  min-height: 100vh;
  background:
    radial-gradient(circle at top left, rgba(20, 184, 166, 0.18), transparent 28%),
    radial-gradient(circle at top right, rgba(249, 115, 22, 0.12), transparent 24%),
    linear-gradient(180deg, #f7fafc 0%, #eef6ff 52%, #f4f8fb 100%);
  padding: 2rem;
}

.crear-taller-container {
  max-width: 1480px;
  margin: 0 auto;
  animation: slideIn 0.5s ease-out;
}

/* Header */
.crear-taller-header {
  position: relative;
  overflow: hidden;
  background:
    radial-gradient(circle at 15% 20%, rgba(255, 255, 255, 0.18), transparent 20%),
    linear-gradient(135deg, #0f172a 0%, #0f766e 45%, #14b8a6 100%);
  border: 1px solid rgba(255, 255, 255, 0.16);
  border-radius: 28px;
  padding: 2.25rem;
  margin-bottom: 2rem;
  box-shadow: 0 24px 60px rgba(15, 23, 42, 0.18);
}

.crear-taller-header::after {
  content: '';
  position: absolute;
  inset: auto -8% -35% auto;
  width: 280px;
  height: 280px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.08);
  filter: blur(6px);
}

.crear-taller-header-content {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1.5rem;
  position: relative;
  z-index: 1;
  flex-wrap: wrap;
}

.crear-taller-icon-wrapper {
  width: 80px;
  height: 80px;
  background: rgba(255, 255, 255, 0.12);
  backdrop-filter: blur(14px);
  border-radius: 24px;
  border: 1px solid rgba(255, 255, 255, 0.22);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.2);
}

.crear-taller-icon {
  font-size: 2.5rem;
  color: white;
}

.crear-taller-header-copy {
  flex: 1;
  min-width: 280px;
}

.crear-taller-title {
  font-size: clamp(1.8rem, 3vw, 2.4rem);
  font-weight: 800;
  color: white;
  margin: 0;
  letter-spacing: -0.03em;
}

.crear-taller-subtitle {
  font-size: 1rem;
  color: rgba(255, 255, 255, 0.82);
  margin: 0.45rem 0 0 0;
  max-width: 680px;
}

.crear-taller-actions-card,
.crear-taller-form-card {
  background: rgba(255, 255, 255, 0.88);
  backdrop-filter: blur(18px);
}

.crear-taller-form-card {
  overflow: hidden;
}

.crear-taller-form-card :deep(.p-card-body) {
  padding: 1.35rem;
}

.crear-taller-form-card :deep(.p-card-content) {
  padding: 0;
}

.crear-taller-form-card :deep(.grid) {
  row-gap: 1rem;
}

.crear-taller-form-card :deep(.form-group > label) {
  display: block;
  margin-bottom: 0.45rem;
  color: #0f172a;
  font-size: 0.78rem;
  font-weight: 800;
  letter-spacing: 0.08em;
}

.crear-taller-form-card :deep(input:not([type='checkbox'])),
.crear-taller-form-card :deep(textarea),
.crear-taller-form-card :deep(select),
.crear-taller-form-card :deep(.p-inputtext),
.crear-taller-form-card :deep(.p-dropdown),
.crear-taller-form-card :deep(.p-inputmask),
.crear-taller-form-card :deep(.flatpickr-input),
.crear-taller-form-card :deep(.dropdown-input input) {
  width: 100%;
  border-radius: 16px;
  border: 1px solid #d8e3ee;
  background: #f8fbfd;
  color: #0f172a;
  min-height: 48px;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.75);
  transition: border-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease;
}

.crear-taller-form-card :deep(textarea) {
  min-height: 110px;
  padding: 0.85rem 1rem;
  resize: vertical;
}

.crear-taller-form-card :deep(input:focus),
.crear-taller-form-card :deep(textarea:focus),
.crear-taller-form-card :deep(select:focus),
.crear-taller-form-card :deep(.p-inputtext:focus),
.crear-taller-form-card :deep(.p-dropdown:focus-within),
.crear-taller-form-card :deep(.flatpickr-input:focus),
.crear-taller-form-card :deep(.dropdown-input input:focus) {
  border-color: #14b8a6;
  box-shadow: 0 0 0 4px rgba(20, 184, 166, 0.14);
  outline: none;
}

.crear-taller-form-card :deep(.p-inputgroup),
.crear-taller-form-card :deep(.dropdown-input) {
  width: 100%;
}

.crear-taller-form-card :deep(.p-inputgroupaddon),
.crear-taller-form-card :deep(.p-inputgroup > .p-button),
.crear-taller-form-card :deep(.p-inputgroup-addon) {
  border-radius: 14px;
}

.crear-taller-stepper {
  position: relative;
}

.crear-taller-stepper :deep(.p-stepper-nav) {
  gap: 0.75rem;
  margin-bottom: 1.5rem;
  padding: 0.75rem;
  border-radius: 24px;
  background: linear-gradient(180deg, #f9fbfc 0%, #edf4f7 100%);
  border: 1px solid #d8e3ee;
}

.crear-taller-stepper :deep(.p-stepper-separator) {
  background: linear-gradient(90deg, rgba(20, 184, 166, 0.1), rgba(15, 118, 110, 0.35), rgba(20, 184, 166, 0.1));
  height: 2px;
}

.crear-taller-stepper :deep(.p-stepper-header) {
  flex: 1 1 0;
}

.crear-taller-stepper :deep(.p-stepper-action) {
  width: 100%;
  justify-content: flex-start;
  gap: 0.75rem;
  padding: 0.9rem 1rem;
  border-radius: 18px;
  background: transparent;
  transition: background 0.2s ease, transform 0.2s ease;
}

.crear-taller-stepper :deep(.p-stepper-action:hover) {
  background: rgba(20, 184, 166, 0.08);
}

.crear-taller-stepper :deep(.p-stepper-number) {
  width: 2rem;
  height: 2rem;
  background: #dbeafe;
  color: #0f766e;
  border: none;
  font-weight: 800;
}

.crear-taller-stepper :deep(.p-stepper-title) {
  color: #334155;
  font-size: 0.82rem;
  font-weight: 800;
  letter-spacing: 0.08em;
}

.crear-taller-stepper :deep(.p-highlight .p-stepper-action) {
  background: linear-gradient(135deg, rgba(15, 118, 110, 0.12), rgba(20, 184, 166, 0.2));
}

.crear-taller-stepper :deep(.p-highlight .p-stepper-number) {
  background: linear-gradient(135deg, #0f766e, #14b8a6);
  color: white;
  box-shadow: 0 10px 20px rgba(15, 118, 110, 0.24);
}

.crear-taller-stepper :deep(.p-stepper-panels) {
  border-radius: 24px;
  background: linear-gradient(180deg, #ffffff 0%, #f8fbfd 100%);
  border: 1px solid #e2e8f0;
  padding: 1.4rem;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.7);
}

.crear-taller-badges {
  display: flex;
  flex-wrap: wrap;
  gap: 0.65rem;
  margin-top: 1rem;
}

.crear-taller-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  padding: 0.55rem 0.85rem;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.15);
  background: rgba(255, 255, 255, 0.08);
  color: #f8fafc;
  font-size: 0.82rem;
  font-weight: 700;
}

.crear-taller-badge--accent {
  background: rgba(249, 115, 22, 0.18);
  border-color: rgba(251, 146, 60, 0.24);
}

.crear-taller-header-panel {
  min-width: 220px;
  display: grid;
  gap: 0.85rem;
}

.crear-taller-stat {
  padding: 1rem 1.1rem;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.14);
  color: white;
  backdrop-filter: blur(12px);
}

.crear-taller-stat strong {
  display: block;
  margin-top: 0.2rem;
  font-size: 1rem;
  font-weight: 800;
}

.crear-taller-stat-label {
  display: block;
  font-size: 0.72rem;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: rgba(255, 255, 255, 0.72);
}

/* Actions Card */
.crear-taller-actions-card {
  margin-bottom: 2rem;
  border-radius: 22px;
  border: 1px solid #d9e7ef;
  box-shadow: 0 18px 34px rgba(15, 23, 42, 0.06);
}

.crear-taller-actions-grid {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 1rem;
}

.crear-taller-actions-grid::before {
  content: 'Captura r\00E1pida para recepci\00F3n t\00E9cnica';
  color: #0f172a;
  font-size: 0.95rem;
  font-weight: 700;
}

/* Section Divider */
.crear-taller-section-divider {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin: 2rem 0;
}

.crear-taller-divider-line {
  flex: 1;
  height: 2px;
  background: linear-gradient(90deg, transparent, #2196f3, transparent);
}

.crear-taller-divider-content {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.7rem 1.35rem;
  background: linear-gradient(135deg, #0f172a, #0f766e);
  border-radius: 999px;
  color: #f8fafc;
  font-weight: 600;
  font-size: 0.875rem;
  text-transform: uppercase;
  letter-spacing: 0.12em;
}

/* Form Card */
.crear-taller-form-card {
  border-radius: 28px;
  border: 1px solid #d9e7ef;
  box-shadow: 0 24px 48px rgba(15, 23, 42, 0.08);
}

.p-stepper {
  flex-basis: 50rem;
}

.crear-taller-form-card :deep(.p-button),
.crear-taller-form-card :deep(button.btn) {
  border-radius: 16px;
  font-weight: 700;
  letter-spacing: 0.01em;
}

.crear-taller-form-card :deep(.p-button.p-button-secondary),
.crear-taller-form-card :deep(.p-button[severity='secondary']) {
  background: #eef2f7;
  color: #0f172a;
  border-color: #d8e3ee;
}

.crear-taller-form-card :deep(.p-button:not(.p-button-secondary):not(.p-button-outlined)),
.crear-taller-form-card :deep(.elboton) {
  background: linear-gradient(135deg, #0f766e, #14b8a6);
  border: none;
  box-shadow: 0 18px 30px rgba(15, 118, 110, 0.2);
}

.crear-taller-form-card :deep(.p-checkbox-box) {
  border-radius: 10px;
}

.crear-taller-form-card :deep(.p-chips-multiple-container) {
  border-radius: 16px;
  border: 1px solid #d8e3ee;
  background: #f8fbfd;
  min-height: 48px;
}

.crear-taller-form-card :deep(.p-chip) {
  background: #dcfce7;
  color: #166534;
  border-radius: 999px;
}

.crear-taller-form-card :deep(.p-dropdown-label),
.crear-taller-form-card :deep(.p-inputtext),
.crear-taller-form-card :deep(.flatpickr-input) {
  padding: 0.8rem 1rem;
}

@media (max-width: 1200px) {
  .crear-taller-container {
    max-width: 100%;
  }

  .crear-taller-header-content {
    align-items: stretch;
  }

  .crear-taller-header-panel {
    width: 100%;
    min-width: 0;
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .crear-taller-stepper :deep(.p-stepper-nav) {
    gap: 0.55rem;
  }

  .crear-taller-stepper :deep(.p-stepper-action) {
    padding: 0.8rem;
  }

  .crear-taller-stepper :deep(.p-stepper-title) {
    font-size: 0.76rem;
    letter-spacing: 0.05em;
  }
}

@media (max-width: 992px) {
  .crear-taller-wrapper {
    padding: 1.25rem;
  }

  .crear-taller-header {
    padding: 1.6rem;
  }

  .crear-taller-actions-grid {
    align-items: flex-start;
  }

  .crear-taller-actions-grid::before {
    display: block;
    width: 100%;
  }

  .crear-taller-section-divider {
    margin: 1.35rem 0;
  }

  .crear-taller-stepper :deep(.p-stepper-nav) {
    overflow-x: auto;
    flex-wrap: nowrap;
    scrollbar-width: thin;
  }

  .crear-taller-stepper :deep(.p-stepper-header) {
    min-width: 165px;
  }

  .crear-taller-stepper :deep(.p-stepper-panels) {
    padding: 1.15rem;
  }

  .crear-taller-form-card :deep(.grid) {
    row-gap: 0.85rem;
  }
}

@media (min-width: 769px) and (max-width: 1024px) {
  .crear-taller-form-card :deep(.grid.grid-cols-12 > .form-group) {
    grid-column: span 6 / span 6 !important;
  }

  .crear-taller-form-card :deep(.grid.grid-cols-12 > .form-group.col-span-12),
  .crear-taller-form-card :deep(.grid.grid-cols-12 > .form-group.sm\:col-span-12),
  .crear-taller-form-card :deep(.grid.grid-cols-12 > .form-group.md\:col-span-12),
  .crear-taller-form-card :deep(.grid.grid-cols-12 > .form-group.lg\:col-span-12),
  .crear-taller-form-card :deep(.grid.grid-cols-12 > .form-group.xl\:col-span-12) {
    grid-column: 1 / -1 !important;
  }

  .crear-taller-form-card :deep(.grid.grid-cols-12 > .form-group textarea),
  .crear-taller-form-card :deep(.grid.grid-cols-12 > .form-group .p-chips),
  .crear-taller-form-card :deep(.grid.grid-cols-12 > .form-group .p-inputgroup),
  .crear-taller-form-card :deep(.grid.grid-cols-12 > .form-group .p-dropdown),
  .crear-taller-form-card :deep(.grid.grid-cols-12 > .form-group .dropdown-input) {
    width: 100%;
  }

  .crear-taller-form-card :deep(.grid.grid-cols-12 > .form-group > label) {
    font-size: 0.8rem;
  }

  .crear-taller-form-card :deep(.grid.grid-cols-12) {
    column-gap: 1rem;
    row-gap: 1rem;
  }

  .crear-taller-stepper :deep(.p-stepper-panels) {
    padding: 1.25rem;
  }
}

@media (max-width: 768px) {
  .crear-taller-wrapper {
    padding: 1rem;
  }

  .crear-taller-header {
    padding: 1.4rem;
    border-radius: 22px;
  }

  .crear-taller-header-content {
    flex-direction: column;
    gap: 1rem;
  }

  .crear-taller-icon-wrapper {
    width: 64px;
    height: 64px;
  }

  .crear-taller-stepper :deep(.p-stepper-nav) {
    padding: 0.55rem;
    border-radius: 18px;
  }

  .crear-taller-stepper :deep(.p-stepper-header) {
    min-width: 145px;
  }

  .crear-taller-stepper :deep(.p-stepper-action) {
    padding: 0.65rem 0.75rem;
  }

  .crear-taller-stepper :deep(.p-stepper-title) {
    font-size: 0.72rem;
  }

  .crear-taller-stepper :deep(.p-stepper-panels) {
    padding: 1rem;
  }

  .crear-taller-header-panel {
    grid-template-columns: 1fr;
  }

  .crear-taller-badges {
    gap: 0.5rem;
  }

  .crear-taller-badge {
    width: 100%;
    justify-content: center;
  }

  .crear-taller-divider-line {
    display: none;
  }

  .crear-taller-divider-content {
    width: 100%;
    justify-content: center;
    text-align: center;
  }

  .crear-taller-form-card :deep(.p-card-body) {
    padding: 0.85rem;
  }

  .crear-taller-form-card :deep(.form-group > label) {
    font-size: 0.74rem;
  }

  .crear-taller-form-card :deep(.grid.grid-cols-12 > .form-group) {
    grid-column: 1 / -1 !important;
  }

  .crear-taller-form-card :deep(input:not([type='checkbox'])),
  .crear-taller-form-card :deep(textarea),
  .crear-taller-form-card :deep(select),
  .crear-taller-form-card :deep(.p-inputtext),
  .crear-taller-form-card :deep(.p-dropdown),
  .crear-taller-form-card :deep(.p-inputmask),
  .crear-taller-form-card :deep(.flatpickr-input),
  .crear-taller-form-card :deep(.dropdown-input input) {
    min-height: 44px;
  }
}

@media (max-width: 560px) {
  .crear-taller-wrapper {
    padding: 0.75rem;
  }

  .crear-taller-header {
    padding: 1.2rem;
    border-radius: 18px;
  }

  .crear-taller-title {
    font-size: 1.5rem;
  }

  .crear-taller-subtitle {
    font-size: 0.9rem;
  }

  .crear-taller-actions-card,
  .crear-taller-form-card {
    border-radius: 18px;
  }

  .crear-taller-stepper :deep(.p-stepper-nav) {
    padding: 0.45rem;
  }

  .crear-taller-stepper :deep(.p-stepper-header) {
    min-width: 132px;
  }

  .crear-taller-stepper :deep(.p-stepper-action) {
    gap: 0.5rem;
    padding: 0.6rem;
  }

  .crear-taller-stepper :deep(.p-stepper-number) {
    width: 1.7rem;
    height: 1.7rem;
    font-size: 0.8rem;
  }

  .crear-taller-stepper :deep(.p-stepper-title) {
    font-size: 0.68rem;
  }

  .crear-taller-stepper :deep(.p-stepper-panels) {
    padding: 0.8rem;
    border-radius: 18px;
  }

  .crear-taller-form-card :deep(.p-button),
  .crear-taller-form-card :deep(button.btn) {
    width: 100%;
  }

  .crear-taller-form-card :deep(textarea) {
    min-height: 96px;
  }
}

/* Pattern Styles */
#pattern-container {
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
}

.pattern-row {
  display: flex;
  justify-content: center;
}

.pattern-dot {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background-color: #1976d2;
  margin: 5px;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 16px;
  color: white;
  transition: all 0.3s;
  cursor: pointer;
}

.pattern-dot:hover {
  background-color: #2196f3;
  transform: scale(1.1);
}
</style>
