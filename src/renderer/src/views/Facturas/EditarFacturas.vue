<script setup>
import { ref, onMounted, nextTick, watchEffect,onBeforeUnmount } from 'vue';
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
  peticionesFetchOffline,
  enviarSolicitudGet,
  generarCodigoUnico,
  convertirAFechaTimestamp,
  peticiones,
  enviarDatosLocalStorage,
  generarTablaFromStringJSON,
  mensajetoast,
  lasMayusculas} from '@/funciones/funciones.js';
import Swal from 'sweetalert2'
const toast = useToast();
/************************************************************************/
import LoadingOverlay from '@/Loading/LoadingOverlay.vue';
const loading = ref(false)
/************************************************************************/
import TablaJSON from '@/components/TablaJSON.vue'
import FacturaPdfPrint from '@/components/FacturaPdfPrint.vue'
/************************************************************************/
const datosDefault = ref({})
/************************************************************************/
const visiblePrint = ref(false)
const facturaPdfPrintRef = ref(null)
/************************************************************************/
const visibleEditarRegistro = ref(false)
const editableFactura = ref({})
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
/************************************************************************/
const position = "top";
/************************************************************************/
const datoscampos = ref({})
const codigoUnico = ref(generarCodigoUnico());
const fecha = ref(nfecha('fecha'));
const todosLosFacturas = ref([]);
/************************************************************************/
const LONG_TEXT_KEYS = ['productos', 'otro', 'nota']

const abrirSidebarEditarRegistro = () => {
  editableFactura.value = JSON.parse(JSON.stringify(datoscampos.value || {}))
  visibleEditarRegistro.value = true
}

const esCampoLargo = (key, value) => {
  if (LONG_TEXT_KEYS.includes(String(key))) return true
  return typeof value === 'string' && value.length > 120
}

const normalizarValorEditado = (valorOriginal, valorEditado) => {
  if (typeof valorOriginal === 'number') {
    return valorEditado === '' ? 0 : Number(valorEditado)
  }

  if (typeof valorOriginal === 'boolean') {
    if (valorEditado === 'true') return true
    if (valorEditado === 'false') return false
  }

  return valorEditado
}

const fnGuardarRegistroSoporte = async () => {
  if (!editableFactura.value || !editableFactura.value.id) {
    toast.add({ severity: 'error', summary: 'Error', detail: 'No se encontró el registro a guardar.', life: 3000 });
    return;
  }

  const facturaActualizada = {}

  Object.keys(editableFactura.value).forEach((key) => {
    facturaActualizada[key] = normalizarValorEditado(datoscampos.value[key], editableFactura.value[key])
  })

  if (facturaActualizada.hasOwnProperty('created_at')) {
    facturaActualizada.updated_at = nfecha('timestamp')
  }

  const envioDatos = await peticionesFetchOffline('updateData', 'facturas', JSON.stringify(facturaActualizada));

  if (envioDatos[0] == 'ok') {
    datoscampos.value = facturaActualizada
    const index = todosLosFacturas.value.findIndex(factura => factura.id == facturaActualizada.id)
    if (index !== -1) {
      todosLosFacturas.value[index] = { ...facturaActualizada }
    }
    visibleEditarRegistro.value = false
    toast.add({ severity: 'success', summary: 'Éxito', detail: 'Registro actualizado correctamente.', life: 3000 });
  } else {
    toast.add({ severity: 'error', summary: 'Error', detail: 'Fallo al actualizar el registro.', life: 3000 });
  }
}
/************************************************************************/
/************************************************************************/
const fetchAllData = async () => {
/*    const response = await peticionesFetchOffline('getDataAsArray', 'facturas');*/
    const response =  await peticionesFetchOffline('getDataAsArray', 'facturas');

    const jsonData = response;
    todosLosFacturas.value = jsonData;
    datoscampos.value = jsonData.find(datos=>datos.id == route.params.id)
};
/************************************************************************/
const detectarProductosVendidos = ()=>{
  const productos = JSON.parse(datoscampos.value.productos)

}
/************************************************************************/
function navigate(action) {
    const currentIndex = todosLosFacturas.value.findIndex(facturas => facturas.id == route.params.id);
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
            newIndex = currentIndex + 1 < todosLosFacturas.value.length ? currentIndex + 1 : currentIndex;
            break;
        case 'ultimo':
            newIndex = todosLosFacturas.value.length - 1;
            break;
        default:
            return;
    }
    datoscampos.value = todosLosFacturas.value[newIndex];
    detectarProductosVendidos()
    router.push({ path: `/editarfacturas/${todosLosFacturas.value[newIndex].id}` });
}
/************************************************************************/
const agregarTimeStamp = async()=>{
  const fechaInicioN = convertirAFechaTimestamp(datoscampos.value.fecha_emision, datoscampos.value.hora);
  datoscampos.value.updated_at = fechaInicioN;
  datoscampos.value.created_at = fechaInicioN;

  const url = link.value+api.value+"/actualizarcampos/facturas";
  if (!datoscampos.value) {
    console.error("Datos incompletos, no se puede actualizar.");
    return;
  }

/*  const envioDatos = await peticionesFetchOffline('updateData', 'facturas', JSON.stringify(datoscampos.value));*/
    const envioDatos = await peticionesFetchOffline('updateData', 'facturas',JSON.stringify(datoscampos.value));
  if (envioDatos[0] == 'ok') {
     toast.add({ severity: 'success', summary: 'Éxito', detail: 'Datos Actualizados', life: 3000 });
  }else{
    toast.add({ severity: 'error', summary: 'Error', detail: 'Fallo al actualizar los datos.', life: 3000 });
  }


}
/************************************************************************/
const handleKeyDown = (event) => {
  switch (event.key) {
    case 'ArrowRight':
      //agregarTimeStamp()
      navigate('siguiente');
      break;
    case 'ArrowLeft':
      //agregarTimeStamp()
      navigate('anterior');
      break;
    case 'ArrowUp':
      navigate('primero');
      break;
    case 'ArrowDown':
      navigate('ultimo');
      break;
    default:
      break;
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

datosDefault.value = JSON.parse(window.localStorage.getItem('datosDefault')) || {};

await fetchAllData()
detectarProductosVendidos()

window.addEventListener('keydown', handleKeyDown);

});
/************************************************************************/
onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleKeyDown);
});
/************************************************************************/
async function funcionActualizar(e) {
  e.preventDefault();
  const url = link.value+api.value+"/actualizarcampos/facturas";
  if (!datoscampos.value) {
    console.error("Datos incompletos, no se puede actualizar.");
    return;
  }
  if (datoscampos.value.hasOwnProperty('created_at')) {
      datoscampos.value.updated_at = nfecha('timestamp')
    }


    const envioDatos = await peticionesFetchOffline('updateData', 'facturas',JSON.stringify(datoscampos.value));
  if (envioDatos[0] == 'ok') {
     toast.add({ severity: 'success', summary: 'Éxito', detail: 'Datos Actualizados', life: 3000 });
  }else{
    toast.add({ severity: 'error', summary: 'Error', detail: 'Fallo al actualizar los datos.', life: 3000 });
  }
}
/************************************************************************/

/************************************************************************/
const fnPrintReceipt = ()=>{
      const impresionpagina = link.value+'/vista/impresoratermica.php?factura='+datoscampos.value.no_factura;

    if(window.electron){
      window.electron.ipcRenderer.invoke('open-new-window', impresionpagina, 'url', true,false);
    }else{
      console.log("datoscampos.value", datoscampos.value);
      //router.push({ path: `/factura/${datoscampos.value.no_factura}` });
    }
}
/************************************************************************/
const fnPrint = ()=>{
  const impresionpagina = link.value+'/receipt/factura.php?factura='+datoscampos.value.no_factura;
  if(window.electron){
    window.electron.ipcRenderer.invoke('open-new-window', impresionpagina,'url',false,true,false)
  }else{
      router.push({ path: `/factura/${datoscampos.value.no_factura}` });
    }
}
/************************************************************************/
/************************************************************************/
const fnSincronizarImei = async () => {
  loading.value = true;

  try {
    const productos = JSON.parse(datoscampos.value.productos);

    for (let prod of productos) {
      if (prod.categoria === 'CELULARES') {
        const listaImei = prod.lista_imei.split(',');

        // Manejo de actualizaciones de IMEIs
        await Promise.all(listaImei.map(async imei => {
          const datosImei = await peticionesFetchOffline('getDataByField', 'imei','imei',imei);

          if (datosImei) {
            if (datosImei.hasOwnProperty('created_at')) {
              datosImei.updated_at = nfecha('timestamp');
            }
            datosImei.estado = 'VENDIDO';
            const url = `${link.value + api.value}/actualizarcampos/imei`;
            await peticionesFetchOffline('updateData', 'imei',JSON.stringify(datosImei));
          }
        }));

        // Actualización del producto relacionado
        const datosProducto = await peticionesFetchOffline('getDataByField', 'productos','codigo',prod.codigo);

        if (datosProducto) {

          const response = peticionesFetchOffline('getDataArrayByTwoConditions', 'imei','id_equi',datosProducto.id,'estado','DISPONIBLE');

          datosProducto.stock = response.length;
          const url = `${link.value + api.value}/actualizarcampos/productos`;
          await peticionesFetchOffline('updateData', 'productos',JSON.stringify(datosProducto));
        }
      }
    }
  } catch (error) {
    console.error('Error en la sincronización de IMEI:', error);
  } finally {
    loading.value = false;
  }
};

/************************************************************************/
const fnImpresoraGrande = async()=>{
  visiblePrint.value = false

  if (!datoscampos.value?.no_factura) {
    toast.add({ severity: 'error', summary: 'Error', detail: 'Debe seleccionar una factura para imprimir', life: 3000 });
    return
  }

  if (!facturaPdfPrintRef.value?.printFactura) {
    toast.add({ severity: 'error', summary: 'Error', detail: 'El componente FacturaPdfPrint no esta disponible', life: 3000 });
    return
  }

  const datosFactura = datoscampos.value
  let datosCliente = await peticionesFetchOffline('getDataByField', 'clientes', 'codigo', datosFactura.cod_cliente)
  if (Array.isArray(datosCliente)) datosCliente = datosCliente[0] || null

  let creditoData = null
  if (String(datosFactura?.metodo_pago || '').toUpperCase() === 'CREDITO') {
    const datosCxC = await peticionesFetchOffline('getDataByField', 'cuentas_cobrar', 'no_factura', datosFactura.no_factura)
    creditoData = Array.isArray(datosCxC) ? datosCxC[0] || null : datosCxC
  }

  await facturaPdfPrintRef.value.printFactura({
    factura: datosFactura,
    cliente: datosCliente,
    datosEmpresa: enviarDatosLocalStorage(),
    creditoData
  })

}
/**********************************************************************/
const fnImpresoraChica = async()=>{

  if(window.electron){

     const datosEmpresa1 = JSON.stringify(enviarDatosLocalStorage());
         const datosFactura = datoscampos.value
         const datosCliente = await peticionesFetchOffline('getDataByField', 'clientes','codigo',datoscampos.value.cod_cliente);

     const envio = await window.electron.ipcRenderer.invoke('ticket', JSON.stringify(datosFactura),JSON.stringify(datosCliente), datosEmpresa1);


  }else{
      router.push({ path: `/factura/${datoscampos.value.no_factura}` });
    }

}
/************************************************************************/
window.fnVerDetalleIMEI = async (imei) => {
  try {
    const data = await peticionesFetchOffline(
      'getDataByField',
      'imei',
      'imei',
      imei
    );

    if (!data) {
      return Swal.fire('❌', 'IMEI no encontrado', 'error');
    }

    const t = data;

    const html = `
      <div class="text-left text-sm space-y-4">

        <!-- 📱 DATOS DEL EQUIPO -->
        <div class="border rounded-lg p-3">
          <h3 class="font-bold text-base mb-2">📱 Equipo</h3>
          <p><b>IMEI:</b> ${t.imei}</p>
          <p><b>Equipo:</b> ${t.equipo || '-'}</p>
          <p><b>Marca:</b> ${t.marca || '-'}</p>
          <p><b>Modelo:</b> ${t.modelo || '-'}</p>
          <p><b>Estado:</b> 
            <span class="${t.estado === 'VENDIDO' ? 'text-red-600' : 'text-green-600'} font-bold">
              ${t.estado}
            </span>
          </p>
        </div>

        <!-- 💰 COSTOS Y PRECIOS -->
        <div class="border rounded-lg p-3">
          <h3 class="font-bold text-base mb-2">💰 Costos y precios</h3>
          <p><b>Costo:</b> RD$ ${parseFloat(t.costo || 0).toFixed(2)}</p>
          <p><b>Precio venta:</b> RD$ ${parseFloat(t.precio_venta || 0).toFixed(2)}</p>
          <p><b>No. Compra:</b> ${t.no_compra || '-'}</p>
        </div>

        <!-- 🧾 INFORMACIÓN DE VENTA -->
        <div class="border rounded-lg p-3">
          <h3 class="font-bold text-base mb-2">🧾 Venta</h3>
          <p><b>Factura:</b> ${t.factura || '-'}</p>
          <p><b>Fecha venta:</b> ${t.fecha_venta || '-'}</p>
          <p><b>Hora venta:</b> ${t.hora_venta || '-'}</p>
          <p><b>Vendedor:</b> ${t.vendedor || '-'}</p>
        </div>

        <!-- 👤 CLIENTE -->
        <div class="border rounded-lg p-3">
          <h3 class="font-bold text-base mb-2">👤 Cliente</h3>
          <p><b>Nombre:</b> ${t.comprador || '-'}</p>
          <p><b>Cédula:</b> ${t.cedula || '-'}</p>
          <p><b>Teléfono:</b> ${t.telefono || '-'}</p>
          <p><b>Dirección:</b> ${t.direccion || '-'}</p>
        </div>

        <!-- 🏪 PROVEEDOR -->
        <div class="border rounded-lg p-3">
          <h3 class="font-bold text-base mb-2">🏪 Proveedor</h3>
          <p><b>Proveedor:</b> ${t.proveedor || '-'}</p>
          <p><b>Fecha ingreso:</b> ${t.fecha || '-'}</p>
        </div>

        <!-- 📝 DETALLES TÉCNICOS -->
        <div class="border rounded-lg p-3">
          <h3 class="font-bold text-base mb-2">📝 Detalles técnicos</h3>
          <pre class="whitespace-pre-wrap text-xs bg-slate-100 dark:bg-slate-800 p-2 rounded">
${t.detalles || 'Sin detalles'}
          </pre>
        </div>

        <!-- 🕒 METADATOS -->
        <div class="border rounded-lg p-3 text-xs text-slate-500">
          <p><b>Creado:</b> ${t.created_at || '-'}</p>
          <p><b>Actualizado:</b> ${t.updated_at || '-'}</p>
          <p><b>Usuario:</b> ${t.usuario || '-'}</p>
        </div>

      </div>
    `;

    await Swal.fire({
      title: '📱 Detalle completo del teléfono',
      html,
      width: 650,
      confirmButtonText: 'Cerrar',
      customClass: {
        popup: '!rounded-xl dark:!bg-slate-900',
        confirmButton:
          '!bg-blue-600 hover:!bg-blue-700 !text-white !px-5 !py-2 !rounded-md'
      }
    });

  } catch (err) {
    console.error(err);
    Swal.fire('❌', 'Error consultando información del IMEI', 'error');
  }
};


/************************************************************************/
const fnVerTelefonosDesdeIMEI = async (producto) => {
  const imeis = (producto.lista_imei || '')
    .split(',')
    .map(i => i.trim())
    .filter(Boolean);

  if (imeis.length === 0) {
    return Swal.fire('⚠️', 'Este producto no tiene IMEI registrados', 'warning');
  }

  let html = `<div class="space-y-3 text-left text-sm">`;

  imeis.forEach((imei, index) => {
    html += `
      <div class="flex justify-between items-center border p-2 rounded">
        <span><b>${index + 1}.</b> ${imei}</span>
        <button 
          class="px-3 py-1 bg-blue-600 text-white rounded text-xs"
          onclick="window.fnVerDetalleIMEI('${imei}')"
        >
          Ver detalle
        </button>
      </div>
    `;
  });

  html += `</div>`;

  await Swal.fire({
    title: '📱 Teléfonos del producto',
    html,
    width: 500,
    confirmButtonText: 'Cerrar',
    customClass: {
      popup: '!rounded-xl dark:!bg-slate-900',
      confirmButton: '!bg-blue-600 !text-white !px-5 !py-2 !rounded-md'
    }
  });
};

/************************************************************************/
const fnModificarProductos = async (indice, datos) => {
  const campos = datos;

  let productos = [];
  try {
    productos = typeof datoscampos.value.productos === "string"
      ? JSON.parse(datoscampos.value.productos)
      : datoscampos.value.productos;
  } catch (err) {
    console.error("Error parseando productos:", err);
    return;
  }

  const esCelular = String(datos.categoria || '').toUpperCase() === 'CELULARES';

  // 👉 Construir inputs dinámicamente
  let htmlFields = `<div class="space-y-4 max-h-[60vh] overflow-y-auto px-1">`;

  Object.keys(campos).forEach((key) => {
    const value = campos[key] ?? "";
    const type = typeof value === "number" ? "number" : "text";

    htmlFields += `
      <div class="flex flex-col text-left">
        <label class="text-sm font-semibold text-slate-700 mb-1 dark:text-slate-200">${key}</label>
        <input 
          id="field_${key}" 
          type="${type}"
          value="${value}"
          class="swal2-input !mt-0 !w-full !text-sm
                 border border-slate-300 dark:border-slate-700 
                 rounded-md px-3 py-2
                 focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                 dark:bg-slate-800 dark:text-white"
        />
      </div>
    `;
  });

  htmlFields += `</div>`;

  const result = await Swal.fire({
    title: `<span class="text-lg font-bold">Editar Producto</span>`,
    html: htmlFields,
    width: "650px",
    showCancelButton: true,
    showDenyButton: esCelular,
    confirmButtonText: "Guardar",
    denyButtonText: esCelular
      ? `📱 Ver teléfonos (${(datos.lista_imei || '').split(',').filter(i => i.trim()).length})`
      : "",
    cancelButtonText: "Cancelar",
    focusConfirm: false,

    customClass: {
      popup: "!rounded-xl dark:!bg-slate-900",
      confirmButton: "!bg-blue-600 !text-white !px-5 !py-2 !rounded-md",
      denyButton: "!bg-emerald-600 !text-white !px-5 !py-2 !rounded-md",
      cancelButton: "!bg-slate-300 !text-black !px-5 !py-2 !rounded-md",
    },

    preConfirm: () => {
      const newValues = {};
      Object.keys(campos).forEach((key) => {
        let val = document.getElementById(`field_${key}`).value;
        if (typeof campos[key] === "number") val = Number(val);
        if (typeof campos[key] === "boolean") val = val === "true";
        newValues[key] = val;
      });
      return newValues;
    },
  });

  // 👉 Si presionó "Ver teléfonos"
  if (esCelular && result.isDenied) {
    await fnVerTelefonosDesdeIMEI(datos);
    return;
  }

  // 👉 Guardar cambios
  if (result.value) {
    productos[indice] = result.value;
    datoscampos.value.productos = JSON.stringify(productos);

    fnReajustarGanancias();

    toast.add({
      severity: "success",
      summary: "Actualizado",
      detail: "Producto modificado correctamente",
      life: 2000,
    });
  }
};

/************************************************************************/
const fnReajustarGanancias = async () => {
  try {
    // Verificar que existan productos
    if (!datoscampos.value.productos) {
      toast.add({
        severity: "warn",
        summary: "Advertencia",
        detail: "No hay productos en esta factura",
        life: 3000,
      });
      return;
    }

    // Parsear los productos
    let productos = [];
    try {
      productos = typeof datoscampos.value.productos === "string"
        ? JSON.parse(datoscampos.value.productos)
        : datoscampos.value.productos;
    } catch (err) {
      console.error("Error parseando productos:", err);
      toast.add({
        severity: "error",
        summary: "Error",
        detail: "Error al procesar los productos",
        life: 3000,
      });
      return;
    }

    // Calcular ganancia total
    let gananciaTotal = 0;

    productos.forEach(producto => {
      const precioVenta = Number(producto.precio_venta) || 0;
      const precioCompra = Number(producto.precio_compra) || Number(producto.costo) || 0;
      const cantidad = Number(producto.cantidad) || 0;
      const ganancia = Number(producto.ganancia) || 0;

      // Calcular ganancia del producto: (precio_venta - precio_compra) * cantidad
      const gananciaProducto = (precioVenta - precioCompra) * cantidad;
      gananciaTotal += ganancia;

      console.log(`Producto: ${producto.nombre}, Venta: ${precioVenta}, Compra: ${precioCompra}, Cant: ${cantidad}, Ganancia: ${gananciaProducto}`);
    });

    // Actualizar el campo de ganancia
    datoscampos.value.ganancia = gananciaTotal.toFixed(2);

    toast.add({
      severity: "success",
      summary: "Éxito",
      detail: `Ganancia reajustada: $${gananciaTotal.toFixed(2)}`,
      life: 3000,
    });

    console.log("Ganancia total calculada:", gananciaTotal.toFixed(2));
  } catch (error) {
    console.error("Error al reajustar ganancias:", error);
    toast.add({
      severity: "error",
      summary: "Error",
      detail: "Error al reajustar las ganancias",
      life: 3000,
    });
  }
};

/************************************************************************/
</script>
<template>
<main class="content-wrapper editar-factura-container">
  <div class="w-full px-4 mt-5">

    <!-- Modern Header -->
    <div class="editar-factura-header">
      <div class="editar-factura-header-content">
        <div class="editar-factura-icon-wrapper">
          <i class="pi pi-file-edit editar-factura-icon"></i>
        </div>
        <div>
          <h1 class="editar-factura-title">Editar Factura</h1>
          <p class="editar-factura-subtitle">Modifica los datos de la factura seleccionada</p>
        </div>
      </div>
    </div>

    <!-- Navigation Card -->
    <Card class="editar-factura-nav-card">
      <template #content>
        <div class="editar-factura-nav-grid">
          <div class="editar-factura-nav-group">
            <h3 class="editar-factura-nav-title"><i class="pi pi-compass"></i> Navegación</h3>
            <div class="editar-factura-nav-buttons">
              <Button icon="pi pi-angle-double-left" label="Primero" severity="secondary" @click="navigate('primero')" />
              <Button icon="pi pi-chevron-left" label="Anterior" severity="secondary" @click="navigate('anterior')" />
              <Button icon="pi pi-chevron-right" label="Siguiente" severity="secondary" @click="navigate('siguiente')" />
              <Button icon="pi pi-angle-double-right" label="Último" severity="secondary" @click="navigate('ultimo')" />
            </div>
          </div>

          <div class="editar-factura-nav-group">
            <h3 class="editar-factura-nav-title"><i class="pi pi-cog"></i> Acciones</h3>
            <div class="editar-factura-nav-buttons">
              <router-link to="/facturas">
                <Button icon="pi pi-home" label="Inicio" severity="info" outlined />
              </router-link>
              <router-link to="/vender">
                <Button icon="pi pi-plus" label="Vender" severity="success" outlined />
              </router-link>
              <Button
                v-if="datosEmpresa.usuario.nivel_seguridad === 'Soporte'"
                icon="pi pi-pencil"
                label="Editar Registro"
                severity="contrast"
                outlined
                @click="abrirSidebarEditarRegistro"
              />
              <Button icon="pi pi-print" severity="warning" @click="visiblePrint = true" />
              <Button v-if="datosDefault.modo == 'CELULAR'" icon="pi pi-mobile" label="IMEI" severity="info" @click="fnSincronizarImei" />
            </div>
          </div>
        </div>
      </template>
    </Card>

    <!-- Section Divider -->
    <div class="editar-factura-section-divider">
      <div class="editar-factura-divider-line"></div>
      <div class="editar-factura-divider-content">
        <i class="pi pi-file-edit"></i>
        <span>Detalles de Factura</span>
      </div>
      <div class="editar-factura-divider-line"></div>
    </div>

<section>
    <form id="formularioActualizar" @submit.prevent="funcionActualizar">
  <Card class="editar-factura-form-card">
    <template #content>

<!-- Información de Factura Section -->
<div class="editar-factura-form-section">
  <h3 class="editar-factura-section-title">
    <i class="pi pi-file"></i>
    Información de Factura
  </h3>
  <div class="editar-factura-form-grid">
    <div class="editar-factura-form-group" v-if="datosEmpresa.usuario.nivel_seguridad === 'Soporte'">
      <label class="editar-factura-label">ID</label>
      <InputText v-model="datoscampos.id" readonly class="editar-factura-input" />
    </div>

    <div class="editar-factura-form-group">
      <label class="editar-factura-label">No. Factura</label>
      <InputText v-model="datoscampos.no_factura" readonly class="editar-factura-input" />
    </div>

    <div class="editar-factura-form-group">
      <label class="editar-factura-label">Tipo Factura</label>
      <InputText v-model="datoscampos.tipo_factura" readonly class="editar-factura-input" />
    </div>

    <div class="editar-factura-form-group">
      <label class="editar-factura-label">Comprobante</label>
      <InputText v-model="datoscampos.comprobante" readonly class="editar-factura-input" />
    </div>

    <div class="editar-factura-form-group">
      <label class="editar-factura-label">Fecha Emisión</label>
      <InputText v-model="datoscampos.fecha_emision" readonly class="editar-factura-input" />
    </div>
  </div>
</div>

<!-- Datos del Cliente Section -->
<div class="editar-factura-form-section">
  <h3 class="editar-factura-section-title">
    <i class="pi pi-user"></i>
    Datos del Cliente
  </h3>
  <div class="editar-factura-form-grid">
    <div class="editar-factura-form-group">
      <label class="editar-factura-label">Código Cliente</label>
      <InputText v-model="datoscampos.cod_cliente" readonly class="editar-factura-input" />
    </div>

    <div class="editar-factura-form-group editar-factura-form-group-wide">
      <label class="editar-factura-label">Nombre Cliente</label>
      <InputText v-model="datoscampos.nombre_cliente" readonly class="editar-factura-input" />
    </div>

    <div class="editar-factura-form-group">
      <label class="editar-factura-label">Teléfono Cliente</label>
      <InputMask v-model="datoscampos.telefono_cliente" :mask="patronTelefono" :placeholder="patronTelefono" readonly class="editar-factura-input" />
    </div>
  </div>
</div>

<!-- Productos Section -->
<div class="editar-factura-form-section">
  <h3 class="editar-factura-section-title">
    <i class="pi pi-shopping-cart"></i>
    Productos
  </h3>
<!--   <div class="editar-factura-productos-table">
    <div v-html="generarTablaFromStringJSON(datoscampos.productos)" class="table-responsive"></div>
  </div> -->
  <TablaJSON :botones="true" :onClickProducto="fnModificarProductos" :productos="datoscampos.productos" />
</div>

<!-- Métodos de Pago Section -->
<div class="editar-factura-form-section">
  <h3 class="editar-factura-section-title">
    <i class="pi pi-money-bill"></i>
    Métodos de Pago
  </h3>
  <div class="editar-factura-form-grid">
    <div class="editar-factura-form-group">
      <label class="editar-factura-label">Vendedor</label>
      <InputText v-model="datoscampos.vendedor" readonly class="editar-factura-input" />
    </div>

    <div class="editar-factura-form-group">
      <label class="editar-factura-label">Método de Pago</label>
      <InputText v-model="datoscampos.metodo_pago" readonly class="editar-factura-input" />
    </div>

    <div class="editar-factura-form-group">
      <label class="editar-factura-label">Tarjeta</label>
      <InputText v-model="datoscampos.tarjeta" readonly class="editar-factura-input" />
    </div>

    <div class="editar-factura-form-group">
      <label class="editar-factura-label">Transferencia</label>
      <InputText v-model="datoscampos.transferencia" readonly class="editar-factura-input" />
    </div>

    <div class="editar-factura-form-group">
      <label class="editar-factura-label">Efectivo</label>
      <InputText v-model="datoscampos.efectivo" readonly class="editar-factura-input" />
    </div>

    <div class="editar-factura-form-group">
      <label class="editar-factura-label">Canal Venta</label>
      <InputText v-model="datoscampos.canal_venta" readonly class="editar-factura-input" />
    </div>
  </div>
</div>

<!-- Totales Section -->
<div class="editar-factura-form-section">
  <h3 class="editar-factura-section-title">
    <i class="pi pi-calculator"></i>
    Totales
  </h3>
  <div class="editar-factura-form-grid">
    <div class="editar-factura-form-group">
      <label class="editar-factura-label">Subtotal</label>
      <InputText v-model="datoscampos.subtotal" readonly class="editar-factura-input" />
    </div>

    <div class="editar-factura-form-group">
      <label class="editar-factura-label">Impuesto</label>
      <InputText v-model="datoscampos.impuesto" readonly class="editar-factura-input" />
    </div>

    <div class="editar-factura-form-group">
      <label class="editar-factura-label">Descuento</label>
      <InputText v-model="datoscampos.descuento" readonly class="editar-factura-input" />
    </div>

    <div class="editar-factura-form-group">
      <label class="editar-factura-label">Total</label>
      <InputText v-model="datoscampos.total" readonly class="editar-factura-input" />
    </div>

    <div class="editar-factura-form-group">
      <label class="editar-factura-label">Ganancia</label>
      <InputText v-model="datoscampos.ganancia" readonly class="editar-factura-input" />
    </div>

    <div class="editar-factura-form-group">
      <label class="editar-factura-label">Financiera</label>
      <InputText v-model="datoscampos.financiera" readonly class="editar-factura-input" />
    </div>
  </div>
</div>

<!-- Información Adicional Section -->
<div class="editar-factura-form-section">
  <h3 class="editar-factura-section-title">
    <i class="pi pi-info-circle"></i>
    Información Adicional
  </h3>
  <div class="editar-factura-form-grid">
    <div class="editar-factura-form-group">
      <label class="editar-factura-label">Estado Factura</label>
      <InputText v-model="datoscampos.estado_factura" readonly class="editar-factura-input" />
    </div>

    <div class="editar-factura-form-group">
      <label class="editar-factura-label">Fecha Estado</label>
      <InputText v-model="datoscampos.fecha_estado" readonly class="editar-factura-input" />
    </div>

    <div class="editar-factura-form-group">
      <label class="editar-factura-label">Mes</label>
      <InputText v-model="datoscampos.mes" readonly class="editar-factura-input" />
    </div>

    <div class="editar-factura-form-group">
      <label class="editar-factura-label">Año</label>
      <InputText v-model="datoscampos.year" readonly class="editar-factura-input" />
    </div>

    <div class="editar-factura-form-group">
      <label class="editar-factura-label">Hora</label>
      <InputText v-model="datoscampos.hora" readonly class="editar-factura-input" />
    </div>

    <div class="editar-factura-form-group">
      <label class="editar-factura-label">Cajero</label>
      <InputText v-model="datoscampos.cajero" readonly class="editar-factura-input" />
    </div>

    <div class="editar-factura-form-group">
      <label class="editar-factura-label">Token</label>
      <InputText v-model="datoscampos.token" readonly class="editar-factura-input" />
    </div>
  </div>

  <div class="editar-factura-form-grid" style="margin-top: 1.25rem;">
    <div class="editar-factura-form-group" style="grid-column: 1 / -1;" v-if="datoscampos.otro">
      <label class="editar-factura-label">Otro</label>
      <div class="editar-factura-productos-table">
        <div v-html="generarTablaFromStringJSON(datoscampos.otro)" class="table-responsive"></div>
      </div>
    </div>

    <div class="editar-factura-form-group" style="grid-column: 1 / -1;">
      <label class="editar-factura-label">Nota</label>
      <Textarea v-model="datoscampos.nota" rows="3" class="editar-factura-input" />
    </div>
  </div>
</div>

<!-- Submit Button -->
<div class="editar-factura-submit-container">
  <Button
    type="button"
    label="Reajustar Ganancias"
    icon="pi pi-calculator"
    severity="warning"
    size="large"
    @click="fnReajustarGanancias"
    class="editar-factura-submit-btn"
  />
  <Button type="submit" label="Actualizar Factura" icon="pi pi-save" size="large" class="editar-factura-submit-btn" />
</div>

    </template>
  </Card>
   </form>
</section>
  </div>

  <LoadingOverlay :visible="loading" />

  <Sidebar
    v-model:visible="visibleEditarRegistro"
    header="Editar registro"
    position="bottom"
    style="height: 100vh"
  >
    <div class="p-4">
      <div class="editar-factura-form-grid">
        <div
          v-for="(value, key) in editableFactura"
          :key="key"
          class="editar-factura-form-group"
          :style="esCampoLargo(key, value) ? 'grid-column: 1 / -1;' : ''"
        >
          <label class="editar-factura-label">{{ String(key).replaceAll('_', ' ') }}</label>

          <Textarea
            v-if="esCampoLargo(key, value)"
            v-model="editableFactura[key]"
            rows="5"
            class="editar-factura-input"
          />

          <InputText
            v-else
            v-model="editableFactura[key]"
            class="editar-factura-input"
          />
        </div>
      </div>

      <div class="editar-factura-submit-container">
        <Button
          type="button"
          label="Guardar Registro"
          icon="pi pi-save"
          size="large"
          class="editar-factura-submit-btn"
          @click="fnGuardarRegistroSoporte"
        />
      </div>
    </div>
  </Sidebar>

  <!-- Print Dialog -->
  <Dialog v-model:visible="visiblePrint" :position="position" modal header="Opciones de Impresión" :style="{ width: '30rem' }">
    <template #header>
      <div class="inline-flex align-items-center justify-content-center gap-2">
        <span class="font-bold white-space-nowrap">Elige la Impresora</span>
      </div>
    </template>

    <div class="flex flex-wrap gap-4 justify-center p-4">
      <Button label="Impresora Grande" icon="pi pi-print" @click="fnImpresoraGrande" iconPos="bottom" severity="info" />
      <Button label="Impresora Térmica" icon="pi pi-print" @click="fnImpresoraChica" iconPos="bottom" severity="success" />
    </div>

    <template #footer>
      <Button label="Cancelar" text severity="secondary" @click="visiblePrint = false" />
    </template>
  </Dialog>

  <FacturaPdfPrint ref="facturaPdfPrintRef" />

   </main>
<Toast />
</template>
<style scoped>
/* ===================================
   🎨 EDITAR FACTURA - MODERN STYLING
   =================================== */

/* Header */
.editar-factura-header {
  background: linear-gradient(135deg, #10b981 0%, #059669 50%, #047857 100%);
  border-radius: 20px;
  padding: 2rem;
  margin-bottom: 2rem;
  box-shadow: 0 8px 32px rgba(16, 185, 129, 0.3);
  animation: slideIn 0.6s ease-out;
}

.editar-factura-header-content {
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.editar-factura-icon-wrapper {
  width: 80px;
  height: 80px;
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(10px);
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid rgba(255, 255, 255, 0.3);
}

.editar-factura-icon {
  font-size: 2.5rem;
  color: white;
}

.editar-factura-title {
  font-size: 2rem;
  font-weight: 800;
  color: white;
  margin: 0;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.editar-factura-subtitle {
  font-size: 1rem;
  color: rgba(255, 255, 255, 0.95);
  margin: 0.25rem 0 0 0;
}

/* Navigation Card */
.editar-factura-nav-card {
  margin-bottom: 1.5rem;
  border-radius: 16px;
  border: 2px solid #d1fae5;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
}

.editar-factura-nav-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
}

@media (max-width: 768px) {
  .editar-factura-nav-grid {
    grid-template-columns: 1fr;
  }
}

.editar-factura-nav-group {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.editar-factura-nav-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1.125rem;
  font-weight: 700;
  color: #10b981;
  margin: 0;
}

.editar-factura-nav-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

/* Section Divider */
.editar-factura-section-divider {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin: 2rem 0 1.5rem 0;
}

.editar-factura-divider-line {
  flex: 1;
  height: 2px;
  background: linear-gradient(90deg, transparent, #10b981, transparent);
}

.editar-factura-divider-content {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1.5rem;
  background: linear-gradient(135deg, #10b981, #059669);
  color: white;
  border-radius: 20px;
  font-weight: 600;
  font-size: 0.875rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
}

/* Form Card */
.editar-factura-form-card {
  border-radius: 16px;
  border: 2px solid #d1fae5;
  margin-bottom: 2rem;
}

/* Form Sections */
.editar-factura-form-section {
  margin-bottom: 2rem;
  padding: 1.5rem;
  background: rgba(209, 250, 229, 0.3);
  border-radius: 12px;
  border: 1px solid #d1fae5;
}

.editar-factura-section-title {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 1.25rem;
  font-weight: 700;
  color: #10b981;
  margin: 0 0 1.5rem 0;
}

.editar-factura-form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.25rem;
}

.editar-factura-form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.editar-factura-form-group-wide {
  grid-column: span 2;
}

@media (max-width: 768px) {
  .editar-factura-form-group-wide {
    grid-column: span 1;
  }
}

.editar-factura-label {
  font-size: 0.875rem;
  font-weight: 600;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.editar-factura-input {
  border: 2px solid #e2e8f0;
  border-radius: 10px;
  padding: 0.75rem;
  font-size: 1rem;
  transition: all 0.3s ease;
  width: 100%;
}

.editar-factura-input:focus {
  outline: none;
  border-color: #10b981;
  box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1);
}

/* Products Table */
.editar-factura-productos-table {
  background: white;
  border-radius: 8px;
  padding: 1rem;
  border: 2px solid #e2e8f0;
}

.table-responsive {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

/* Submit Button */
.editar-factura-submit-container {
  display: flex;
  justify-content: center;
  gap: 1rem;
  flex-wrap: wrap;
  margin-top: 2rem;
  padding-top: 2rem;
  border-top: 2px solid #d1fae5;
}

.editar-factura-submit-btn {
  min-width: 300px;
  height: 3.5rem;
  font-size: 1.125rem;
  font-weight: 700;
  border-radius: 12px;
  background: linear-gradient(135deg, #10b981, #059669);
  border: none;
  box-shadow: 0 8px 24px rgba(16, 185, 129, 0.3);
  transition: all 0.3s ease;
}

.editar-factura-submit-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 32px rgba(16, 185, 129, 0.4);
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
