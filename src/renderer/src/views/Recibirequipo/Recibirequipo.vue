<script setup>
import { ref, onMounted, nextTick, watchEffect,computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
const router = useRouter();
import axios from 'axios';
import { enviarDatosPorPost, eliminarDatos, obtenerIdsSeleccionados, borrarTodoslosDatos, lenguajeDataTable, nfecha, arrayToObjetoFromTabla, peticionesFetch, encryptarPassword, envioElectron, mensajetoast, crearTablaSiNoExiste, buscarDatosIMEI, crearGasto, crearNotaCredito, generarCodigoUnico, peticiones, lasMayusculas, peticionesFetchOffline, arrayToObjetoFromTablaOffline, crearTablaSiNoExisteOffline } from '@/funciones/funciones.js';
import Swal from 'sweetalert2'
import { useToast } from "primevue/usetoast";
const toast = useToast();
/************************************************************************/
import LoadingOverlay from '@/Loading/LoadingOverlay.vue';
import { useLoading } from 'vue-loading-overlay';
const $loading = useLoading();
let loader = null;
/************************************************************************/
const usuarioLocal = ref({})
/************************************************************************/
const camposArray = ["imei","estado","fecha","equipo","marca","modelo","preciocompra","precioventa","detalles","vendedor","cedula","telefono","direccion","nota","usuario"];
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
const codigoUnico = ref('')
/************************************************************************/
const selectedItems = ref([]);
/************************************************************************/
const position = ref('top');
const openPosition = (pos) => {
    position.value = pos;
    visible.value = true;
}
/************************************************************************/
const datoscamposRecibirequipo = ref({})
/************************************************************************/
const isLoading = ref(false)
/************************************************************************/
const visible = ref(false);
const visiblecrear = ref(false);
const value = ref(null);
const id = ref(null);
const datoscampos = ref({});
const data = ref([]);
const searchQuery = ref('');
const RecibirequipoEditar = ref(null);
/************************************************************************/
async function limpiarCamposCrear() {
datoscamposRecibirequipo.value = {}
await campos();
}
/************************************************************************/
watchEffect(() => {
  if (visiblecrear.value) {

    datoscamposRecibirequipo.value.estado = 'DISPONIBLE';
    datoscamposRecibirequipo.value.fecha = nfecha('fecha');
    datoscamposRecibirequipo.value.preciocompra = '0.00';
    datoscamposRecibirequipo.value.precioventa = '0.00';
       datoscamposRecibirequipo.value.detalles = `ALMACENAMIENTO: 
BATERIA TESTEADA: si
BATERIA QUE MARCA: original
DETALLES ESTETICOS: Ninguno
DETALLES INTERNOS: Ninguno
BATERIA MARCA: 100%`
  }
});
/************************************************************************/
const fetchAndSetupData = async () => {
const response = await peticionesFetchOffline('getDataAsArray', 'recibirequipo');
    const jsonData = response.reverse();
    data.value = jsonData;
};
/************************************************************************/
async function campos() {
  const campos = await arrayToObjetoFromTablaOffline('recibirequipo');
  datoscamposRecibirequipo.value = campos;
}
/************************************************************************/
onMounted(async () => {
const datosJSON = await envioElectron('datosarchivo');
link.value = datosJSON.VITE_LINKURL;
api.value = datosJSON.VITE_LINK_API;
token.value = datosJSON.VITE_TOKEN;
patronTelefono.value = datosJSON.VITE_PATRON_TELEFONO;
linkImpresora.value = datosJSON.VITE_IMPRESORA_LOCAL;
patroncedula.value = datosJSON.VITE_PATRON_CEDULA;
tokenCorto.value = datosJSON.VITE_TOKEN_CORTO;

tokenCifrado.value = await encryptarPassword(token.value, 10);
await crearTablaSiNoExisteOffline('recibirequipo', camposArray, toast);
usuarioLocal.value = JSON.parse(window.localStorage.getItem('usuarioLocal'))[0] || {};
await campos();
codigoUnico.value = generarCodigoUnico()
await fetchAndSetupData();
});
/************************************************************************/
const agregarImei = async()=>{
    const datosProducto = await peticionesFetchOffline('getDataByField', 'productos', 'codigo', codigoUnico.value);
    const camposImei = await arrayToObjetoFromTablaOffline('imei');
    const url = link.value+api.value+"/insertar/imei";
    camposImei.imei = datoscamposRecibirequipo.value.imei
    camposImei.equipo = datoscamposRecibirequipo.value.equipo
    camposImei.id_equi = datosProducto?.id
    camposImei.detalles = datoscamposRecibirequipo.value.detalles
    camposImei.fecha = datoscamposRecibirequipo.value.fecha
    camposImei.proveedor = datoscamposRecibirequipo.value.vendedor
    camposImei.estado = 'DISPONIBLE'
    camposImei.almacen = datosEmpresa.empresa.nombre
    camposImei.costo = datoscamposRecibirequipo.value.preciocompra
/*   const envioDatos = await enviarDatosPorPost(url, camposImei,tokenCifrado.value);*/
   const envioDatos = await peticionesFetchOffline('insertData', 'imei', JSON.stringify(camposImei));
}
/************************************************************************/
const agregarProducto = async()=>{
    const camposProductos = await arrayToObjetoFromTablaOffline('productos');
    const url = link.value+api.value+"/insertar/productos";
   camposProductos.codigo = codigoUnico.value
   camposProductos.codigo_barra = codigoUnico.value
   camposProductos.nombre = datoscamposRecibirequipo.value.equipo
   camposProductos.descripcion = datoscamposRecibirequipo.value.equipo
   camposProductos.categoria = 'CELULARES';
   camposProductos.stock = 1;
   camposProductos.alerta = 1;
   camposProductos.marca = datoscamposRecibirequipo.value.marca
   camposProductos.modelo = datoscamposRecibirequipo.value.modelo
   camposProductos.precio_compra = datoscamposRecibirequipo.value.preciocompra
   camposProductos.precio_venta = datoscamposRecibirequipo.value.precioventa
   camposProductos.precio_final = datoscamposRecibirequipo.value.precioventa
   camposProductos.precio_min = datoscamposRecibirequipo.value.precioventa
   camposProductos.precio_xmayor = datoscamposRecibirequipo.value.precioventa
   camposProductos.empaque = 'UNIDAD'
   camposProductos.impuestos = '0.00'
   camposProductos.impuesto_venta = '0.00'
   camposProductos.otro = datoscamposRecibirequipo.value.nota
   camposProductos.proveedor = datoscamposRecibirequipo.value.vendedor
   camposProductos.almacen = datosEmpresa.empresa.nombre
/*   const envioDatos = await enviarDatosPorPost(url, camposProductos,tokenCifrado.value);*/
   const envioDatos = await peticionesFetchOffline('insertData', 'productos', JSON.stringify(camposProductos));

}
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
                    const envioDatos = await peticionesFetchOffline('deleteAll', 'recibirequipo');
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
async function funcionActualizar() {
  const url = link.value+api.value+"/actualizarcampos/recibirequipo";
  if (!datoscampos.value) {
    console.error("Datos incompletos, no se puede actualizar.");
    return;
  }
  if (datoscampos.value.hasOwnProperty('created_at')) {
    datoscampos.value.updated_at = nfecha('timestamp');
  }
  const envioDatos = await peticionesFetchOffline('updateData', 'recibirequipo', JSON.stringify(datoscampos.value));
  if (envioDatos[0] == 'ok') {
    visible.value = false;
    fetchAndSetupData();
    toast.add({ severity: 'success', summary: 'Éxito', detail: 'Datos Actualizados', life: 3000 });
  } else {
    toast.add({ severity: 'error', summary: 'Error', detail: 'Fallo al actualizar los datos.', life: 3000 });
  }
}
/************************************************************************/
async function funcionCrear() {
  const url = link.value + api.value + "/insertar/recibirequipo";
  
  if (datoscamposRecibirequipo.value.hasOwnProperty('created_at')) {
    datoscamposRecibirequipo.value.created_at = nfecha('timestamp');
    datoscamposRecibirequipo.value.updated_at = nfecha('timestamp');
  }
    datoscamposRecibirequipo.value.almacen = datosEmpresa.empresa.nombre

  const envioDatos = await peticionesFetchOffline('insertData', 'recibirequipo', JSON.stringify(datoscamposRecibirequipo.value));

  if (envioDatos[0] == 'ok') {
    visiblecrear.value = false;
    
    while (true) { // Bucle hasta que el usuario elija una opción válida
      const result = await Swal.fire({
        title: "Selecciona una opción",
        text: "Debes elegir entre crear una Nota de Crédito o un Gasto.",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Nota de Crédito",
        cancelButtonText: "Gasto",
        allowOutsideClick: false, // Evita que se cierre haciendo clic fuera
        allowEscapeKey: false, // Evita que se cierre con la tecla Escape
        allowEnterKey: false // Evita que se cierre con Enter sin elegir
      });

      if (result.isConfirmed) {
        await crearNotaCredito(
          link.value, api.value, '', datoscamposRecibirequipo.value.vendedor,
          datoscamposRecibirequipo.value.preciocompra,
          `COMPRA DE EQUIPO (${datoscamposRecibirequipo.value.equipo}, ${datoscamposRecibirequipo.value.imei} a ${datoscamposRecibirequipo.value.vendedor} con cédula ${datoscamposRecibirequipo.value.cedula})`,
          '', toast, tokenCifrado.value
        );
        break; // Salir del bucle si elige "Nota de Crédito"

      } else if (result.dismiss === Swal.DismissReason.cancel) {
        const gasto = await crearGasto(
          link.value + api.value, datoscamposRecibirequipo.value.preciocompra,
          `COMPRA DE EQUIPO (${datoscamposRecibirequipo.value.equipo}, ${datoscamposRecibirequipo.value.imei} a ${datoscamposRecibirequipo.value.vendedor} con cédula ${datoscamposRecibirequipo.value.cedula})`,
          toast, tokenCifrado.value,datosEmpresa
        );
        break; // Salir del bucle si elige "Gasto"
      }
    }

    await agregarProducto();
    await agregarImei();
    await fetchAndSetupData();
    limpiarCamposCrear();

    toast.add({ severity: 'success', summary: 'Éxito', detail: 'Datos Agregados', life: 3000 });
  } else {
    toast.add({ severity: 'error', summary: 'Error', detail: 'Fallo al Agregar los datos.', life: 3000 });
  }
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
                                const envioDatos = await peticionesFetchOffline('deleteEntry', 'recibirequipo', id);
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
async function eliminarSoloDeAqui(rowData) {
    const { value: password } = await Swal.fire({
        title: 'Introduce la contraseña',
        input: 'password',
        inputPlaceholder: 'Contraseña',
        showCancelButton: true,
        confirmButtonText: 'Eliminar',
        cancelButtonText: 'Cancelar'
    });

    if (password && (password === token.value || password === tokenCorto.value)) {
        const datosFactura = await peticionesFetchOffline('deleteEntry','recibirequipo', rowData.id);
/*        const datosFactura = await peticionesFetch(
            `${link.value}${api.value}`,
            "borrarporcampo/recibirequipo", // Ajusta esto según tu API
            { campo: 'id', valor: rowData.id },
            tokenCifrado.value,
            'POST'
        );*/

        if (datosFactura[0] == 'ok') {
            toast.add({ severity: 'success', summary: 'Éxito', detail: 'Registro eliminado de la vista.', life: 3000 });
            await fetchAndSetupData();
        } else {
            toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo eliminar el registro.', life: 3000 });
        }
    } else if (password !== undefined) {
        toast.add({ severity: 'error', summary: 'Error', detail: 'Contraseña incorrecta', life: 3000 });
    }
}

/************************************************************************/
async function eliminarPorCompleto(rowData) {
    const { value: password } = await Swal.fire({
        title: 'Introduce la contraseña',
        input: 'password',
        inputPlaceholder: 'Contraseña',
        showCancelButton: true,
        confirmButtonText: 'Eliminar',
        cancelButtonText: 'Cancelar'
    });

    if (password && (password === token.value || password === tokenCorto.value)) {


        const datosProd = await peticionesFetchOffline('deleteByField','productos','nombre',rowData.equipo)

        if (datosProd[0] == 'ok') {
            toast.add({ severity: 'success', summary: 'Éxito', detail: 'Eliminado de Productos', life: 3000 });
        }else{
           toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo eliminar el Producto.', life: 3000 });
        }

        const datosImei = await peticionesFetchOffline('deleteByField','imei','imei',rowData.imei)

        if (datosImei[0] == 'ok') {
            toast.add({ severity: 'success', summary: 'Éxito', detail: 'Eliminado de IMEI', life: 3000 });
        }else{
           toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo eliminar el IMEI.', life: 3000 });
        }

        const datosFactura = await peticionesFetchOffline('deleteEntry','recibirequipo', rowData.id);

        if (datosFactura[0] == 'ok') {
            toast.add({ severity: 'success', summary: 'Éxito', detail: 'Registro eliminado completamente.', life: 3000 });
            await fetchAndSetupData();
        } else {
            toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo eliminar el registro.', life: 3000 });
        }
    } else if (password !== undefined) {
        toast.add({ severity: 'error', summary: 'Error', detail: 'Contraseña incorrecta', life: 3000 });
    }
}

/************************************************************************/
async function preguntarEliminar(rowData) {
    const choice = await Swal.fire({
        title: 'Eliminar registro',
        text: '¿Deseas eliminar este registro solo de aquí o completamente?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Eliminar por completo',
        cancelButtonText: 'Eliminar solo de aquí'
    });

    if (choice.isConfirmed) {
        eliminarPorCompleto(rowData);
    } else if (choice.dismiss === Swal.DismissReason.cancel) {
        eliminarSoloDeAqui(rowData);
    }
}

/************************************************************************/
const itemsRecibirequipo = ref([]);
const menu = ref(null);
const currentRowData = ref(null);
const toggleRecibirequipo = (event, rowData) => {
currentRowData.value = rowData;
itemsRecibirequipo.value = [
{ label: 'Editar', icon: 'pi pi-pencil', command: () => { 
visible.value = true;
datoscampos.value = currentRowData.value;
} },
{ label: 'Eliminar', icon: 'pi pi-trash', command: () => {

    preguntarEliminar(currentRowData.value)

        } 
    },
];
menu.value.toggle(event);
};
/************************************************************************/
const estadisticasRecibir = computed(() => {
  const total = data.value.length;

  // Equipos disponibles y vendidos
  const disponibles = data.value.filter(item => item.estado === 'DISPONIBLE').length;
  const vendidos = data.value.filter(item => item.estado === 'VENDIDO').length;

  // Valor total de compra y venta de equipos disponibles
  const valorCompraTotal = data.value
    .filter(item => item.estado === 'DISPONIBLE')
    .reduce((sum, item) => sum + (parseFloat(item.preciocompra) || 0), 0);

  const valorVentaTotal = data.value
    .filter(item => item.estado === 'DISPONIBLE')
    .reduce((sum, item) => sum + (parseFloat(item.precioventa) || 0), 0);

  // Último equipo recibido
  const ultimoEquipo = data.value.length > 0 ? data.value[0] : null;

  return {
    total,
    disponibles,
    vendidos,
    valorCompraTotal: valorCompraTotal.toFixed(2),
    valorVentaTotal: valorVentaTotal.toFixed(2),
    ultimoEquipo
  };
});
/************************************************************************/
const filteredRecibirequipo = computed(() => {
if (!searchQuery.value) return data.value;
return data.value.filter(busqueda => {
  return Object.values(busqueda).some(value =>
    String(value).toLowerCase().includes(searchQuery.value.toLowerCase())
   );
  });
});
/************************************************************************/
const fnAwesomplete = ()=>{
}
const handleSelectComplete = async(selected)=>{
}
/************************************************************************/
const fnRouter = (ruta) => {
  router.push(ruta);
};
/************************************************************************/
const fnBuscarImei = async()=>{
const imei = datoscamposRecibirequipo.value.imei;

const datos = await buscarDatosIMEI(0,imei,tokenCifrado.value,toast,Swal,false)

if (datos) {
   datoscamposRecibirequipo.value.equipo = datos.modelName
   datoscamposRecibirequipo.value.marca = datos.brand
   datoscamposRecibirequipo.value.modelo = datos.model
   datoscamposRecibirequipo.value.detalles = `ALMACENAMIENTO: 
BATERIA TESTEADA: si
BATERIA QUE MARCA: original
DETALLES ESTETICOS: Ninguno
DETALLES INTERNOS: Ninguno
BATERIA MARCA: 100%`
}


}
/************************************************************************/
  const handleEscape = (event) => {
    if (event.key === 'Escape') {
      loader.hide();
    }
  };
/************************************************************************/
const fnBuscarCedula = async () => {
    const cedula = datoscamposRecibirequipo.value.cedula;
    toast.add({ severity: 'info', summary: 'Loading', detail: 'Buscando datos...', life: 3000 });
    loader = $loading.show({
        canCancel: true,
        loader:'bars',
        onCancel: () => {
        loader.hide();
    },
    });

    try {
       /* const response = await window.electron.ipcRenderer.invoke('consultarPasaporte', cedula);*/
        const response = await peticionesFetch(
          'https://demo.tmposrd.com/api2',
          'buscarcedula',
          { cedula: cedula },
          tokenCifrado.value,
          'POST'
        );
         const datosCedula = response?.datos;
         console.log("datosCedula", datosCedula);
/*        response.nombrerazon_social = response.nombre + ' ' + response.apellido;*/
        response.nombrerazon_social = `${datosCedula?.name}`

        if (response) {
            toast.add({ severity: 'success', summary: 'Encontrado', detail: 'Datos Encontrados', life: 3000 });
            datoscamposRecibirequipo.value.vendedor = response.nombrerazon_social;
        } else {
            toast.add({ severity: 'error', summary: 'Error', detail: 'Error, No se encuentran los Datos.', life: 3000 });
        }
    } catch (error) {
        console.error('Error en la solicitud SOAP:', error);
        toast.add({ severity: 'error', summary: 'Error', detail: 'Error, No se encuentran los Datos.', life: 3000 });
    } finally {
        loader.hide();
        toast.add({ severity: 'info', summary: 'Complete', detail: 'Búsqueda completada', life: 3000 });
    }
}

/************************************************************************/
</script>
<template>
<main class="content-wrapper">
  <!-- Header Profesional -->
  <div class="header-recibirequipo">
    <div class="header-content">
      <div class="header-title">
        <i class="pi pi-mobile header-icon"></i>
        <div>
          <h1 class="title">Recepción de Equipos</h1>
          <p class="subtitle">Gestión y registro de equipos móviles</p>
        </div>
      </div>
    </div>
  </div>

  <div class="w-full px-4 mt-5">
    <!-- Dashboard de Estadísticas -->
    <div class="dashboard-grid">
      <Card class="dashboard-card card-amber">
        <template #content>
          <div class="card-stat-content">
            <div class="stat-icon-wrapper icon-amber">
              <i class="pi pi-mobile stat-icon"></i>
            </div>
            <div class="stat-details">
              <p class="stat-label">Total Equipos</p>
              <p class="stat-value">{{ estadisticasRecibir.total }}</p>
            </div>
          </div>
        </template>
      </Card>

      <Card class="dashboard-card card-orange">
        <template #content>
          <div class="card-stat-content">
            <div class="stat-icon-wrapper icon-orange">
              <i class="pi pi-check-circle stat-icon"></i>
            </div>
            <div class="stat-details">
              <p class="stat-label">Disponibles</p>
              <p class="stat-value">{{ estadisticasRecibir.disponibles }}</p>
              <p class="stat-sublabel">Vendidos: {{ estadisticasRecibir.vendidos }}</p>
            </div>
          </div>
        </template>
      </Card>

      <Card class="dashboard-card card-yellow">
        <template #content>
          <div class="card-stat-content">
            <div class="stat-icon-wrapper icon-yellow">
              <i class="pi pi-dollar stat-icon"></i>
            </div>
            <div class="stat-details">
              <p class="stat-label">Valor en Inventario</p>
              <p class="stat-value-small">RD$ {{ estadisticasRecibir.valorVentaTotal }}</p>
              <p class="stat-sublabel">Costo: RD$ {{ estadisticasRecibir.valorCompraTotal }}</p>
            </div>
          </div>
        </template>
      </Card>
    </div>

    <!-- Toolbar -->
    <Card class="mt-4">
      <template #content>
        <div class="toolbar-recibirequipo">
          <div class="toolbar-actions">
            <Button
              icon="pi pi-refresh"
              label="Recargar"
              @click="fetchAndSetupData"
              severity="warning"
              class="action-button"
            />
            <Button
              icon="pi pi-plus"
              label="Recibir Equipo"
              @click="visiblecrear = true"
              severity="success"
              class="action-button"
            />
            <Button
              icon="pi pi-trash"
              label="Borrar Selección"
              @click="borrarSeleccionados"
              severity="danger"
              class="action-button"
            />
            <Button
              v-if="usuarioLocal.usuario === 'Soporte'"
              icon="pi pi-trash"
              label="Borrar Todo"
              @click="borrarTodo"
              severity="danger"
              outlined
              class="action-button"
            />
          </div>
          <div class="search-wrapper">
            <InputText
              v-model="searchQuery"
              placeholder="Buscar por IMEI, modelo, cliente..."
              class="search-input"
            >
              <template #prepend>
                <i class="pi pi-search"></i>
              </template>
            </InputText>
          </div>
        </div>
      </template>
    </Card>

    <!-- Tabla de Equipos -->
    <Card class="mt-4">
      <template #content>
        <DataTable
          :value="filteredRecibirequipo"
          scrollable
          scrollHeight="600px"
          dataKey="id"
          paginator
          :rows="10"
          v-model:selection="selectedItems"
          :rowsPerPageOptions="[5, 10, 20, 50]"
          class="equipos-table"
        >
          <Column selectionMode="multiple" headerStyle="width: 3rem"></Column>
          <Column header="Opciones" frozen alignFrozen="right" style="min-width: 100px">
            <template #body="slotProps">
              <Button
                icon="pi pi-cog"
                @click="toggleRecibirequipo($event, slotProps.data)"
                severity="info"
                text
                rounded
              />
              <Menu
                ref="menu"
                id="overlay_menu_Recibirequipo"
                :model="itemsRecibirequipo"
                :popup="true"
              />
            </template>
          </Column>
          <Column field="imei" header="IMEI" style="min-width: 180px" sortable>
            <template #body="slotProps">
              <div class="flex items-center gap-2">
                <i class="pi pi-barcode text-amber-500"></i>
                <span class="font-semibold">{{ slotProps.data.imei }}</span>
              </div>
            </template>
          </Column>
          <Column field="estado" header="Estado" style="min-width: 130px" sortable>
            <template #body="slotProps">
              <span
                class="estado-badge"
                :class="{
                  'estado-disponible': slotProps.data.estado === 'DISPONIBLE',
                  'estado-vendido': slotProps.data.estado === 'VENDIDO'
                }"
              >
                {{ slotProps.data.estado }}
              </span>
            </template>
          </Column>
          <Column field="fecha" header="Fecha" style="min-width: 120px" sortable></Column>
          <Column field="equipo" header="Equipo" style="min-width: 200px" sortable></Column>
          <Column field="marca" header="Marca" style="min-width: 120px" sortable></Column>
          <Column field="modelo" header="Modelo" style="min-width: 150px" sortable></Column>
          <Column field="preciocompra" header="Precio Compra" style="min-width: 130px" sortable>
            <template #body="slotProps">
              RD$ {{ parseFloat(slotProps.data.preciocompra || 0).toFixed(2) }}
            </template>
          </Column>
          <Column field="precioventa" header="Precio Venta" style="min-width: 130px" sortable>
            <template #body="slotProps">
              RD$ {{ parseFloat(slotProps.data.precioventa || 0).toFixed(2) }}
            </template>
          </Column>
          <Column field="detalles" header="Detalles" style="min-width: 250px" sortable></Column>
          <Column field="vendedor" header="Vendedor" style="min-width: 200px" sortable></Column>
          <Column field="cedula" header="Cédula" style="min-width: 130px" sortable></Column>
          <Column field="telefono" header="Teléfono" style="min-width: 130px" sortable></Column>
          <Column field="direccion" header="Dirección" style="min-width: 200px" sortable></Column>
          <Column field="nota" header="Nota" style="min-width: 200px" sortable></Column>
          <Column field="usuario" header="Usuario" style="min-width: 150px" sortable></Column>
        </DataTable>
      </template>
    </Card>
<!-- Modal Editar -->
<Dialog v-model:visible="visible" modal :style="{ width: '60rem' }" :breakpoints="{ '1199px': '75vw', '575px': '90vw' }">
  <template #header>
    <div class="modal-header-custom">
      <i class="pi pi-pencil mr-3 text-amber-500"></i>
      <span class="modal-title-custom">Editar Equipo Recibido</span>
    </div>
  </template>

  <div class="dialog-content">
    <!-- Sección: Información del Equipo -->
    <Card class="section-card mb-4">
      <template #header>
        <div class="section-header">
          <i class="pi pi-mobile section-icon"></i>
          <span class="section-title">Información del Equipo</span>
        </div>
      </template>
      <template #content>
        <div class="grid grid-cols-12 gap-4">
          <div class="col-span-12 sm:col-span-6">
            <label class="field-label">
              <i class="pi pi-barcode mr-2"></i>
              IMEI
            </label>
            <InputText
              v-model="datoscampos.imei"
              v-solonumeros
              class="w-full"
              placeholder="IMEI del equipo"
            />
          </div>
          <div class="col-span-12 sm:col-span-3">
            <label class="field-label">
              <i class="pi pi-check-circle mr-2"></i>
              Estado
            </label>
            <Dropdown
              v-model="datoscampos.estado"
              :options="['DISPONIBLE', 'VENDIDO']"
              class="w-full"
              placeholder="Seleccione estado"
            />
          </div>
          <div class="col-span-12 sm:col-span-3">
            <label class="field-label">
              <i class="pi pi-calendar mr-2"></i>
              Fecha
            </label>
            <InputText
              v-model="datoscampos.fecha"
              v-datepicker
              class="w-full"
              placeholder="Fecha"
            />
          </div>
          <div class="col-span-12">
            <label class="field-label">
              <i class="pi pi-mobile mr-2"></i>
              Equipo
            </label>
            <InputText
              v-model="datoscampos.equipo"
              class="w-full"
              placeholder="Nombre del equipo"
            />
          </div>
          <div class="col-span-12 sm:col-span-6">
            <label class="field-label">
              <i class="pi pi-tag mr-2"></i>
              Marca
            </label>
            <InputText
              v-model="datoscampos.marca"
              v-mayuscula
              class="w-full"
              placeholder="Marca del equipo"
            />
          </div>
          <div class="col-span-12 sm:col-span-6">
            <label class="field-label">
              <i class="pi pi-tags mr-2"></i>
              Modelo
            </label>
            <InputText
              v-model="datoscampos.modelo"
              v-mayuscula
              class="w-full"
              placeholder="Modelo del equipo"
            />
          </div>
          <div class="col-span-12 sm:col-span-6">
            <label class="field-label">
              <i class="pi pi-dollar mr-2"></i>
              Precio Compra
            </label>
            <InputText
              v-model="datoscampos.preciocompra"
              v-solonumeros
              v-numeroFocusinOut
              v-decimales
              class="w-full"
              placeholder="0.00"
            />
          </div>
          <div class="col-span-12 sm:col-span-6">
            <label class="field-label">
              <i class="pi pi-money-bill mr-2"></i>
              Precio Venta
            </label>
            <InputText
              v-model="datoscampos.precioventa"
              v-solonumeros
              v-numeroFocusinOut
              v-decimales
              class="w-full"
              placeholder="0.00"
            />
          </div>
          <div class="col-span-12">
            <label class="field-label">
              <i class="pi pi-align-left mr-2"></i>
              Detalles
            </label>
            <Textarea
              v-model="datoscampos.detalles"
              rows="4"
              class="w-full"
              placeholder="Detalles técnicos del equipo"
            />
          </div>
        </div>
      </template>
    </Card>

    <!-- Sección: Información del Vendedor -->
    <Card class="section-card">
      <template #header>
        <div class="section-header">
          <i class="pi pi-user section-icon"></i>
          <span class="section-title">Información del Vendedor</span>
        </div>
      </template>
      <template #content>
        <div class="grid grid-cols-12 gap-4">
          <div class="col-span-12">
            <label class="field-label">
              <i class="pi pi-user mr-2"></i>
              Vendedor
            </label>
            <InputText
              v-model="datoscampos.vendedor"
              v-mayuscula
              class="w-full"
              placeholder="Nombre del vendedor"
            />
          </div>
          <div class="col-span-12 sm:col-span-6">
            <label class="field-label">
              <i class="pi pi-id-card mr-2"></i>
              Cédula
            </label>
            <InputText
              v-model="datoscampos.cedula"
              class="w-full"
              placeholder="Cédula"
            />
          </div>
          <div class="col-span-12 sm:col-span-6">
            <label class="field-label">
              <i class="pi pi-phone mr-2"></i>
              Teléfono
            </label>
            <InputMask
              v-model="datoscampos.telefono"
              :mask="patronTelefono"
              :placeholder="patronTelefono"
              class="w-full"
            />
          </div>
          <div class="col-span-12">
            <label class="field-label">
              <i class="pi pi-map-marker mr-2"></i>
              Dirección
            </label>
            <Textarea
              v-model="datoscampos.direccion"
              rows="2"
              class="w-full"
              placeholder="Dirección del vendedor"
            />
          </div>
          <div class="col-span-12">
            <label class="field-label">
              <i class="pi pi-comment mr-2"></i>
              Nota
            </label>
            <Textarea
              v-model="datoscampos.nota"
              rows="2"
              class="w-full"
              placeholder="Notas adicionales"
            />
          </div>
        </div>
      </template>
    </Card>
  </div>

  <template #footer>
    <div class="flex justify-end gap-2">
      <Button label="Cancelar" icon="pi pi-times" @click="visible = false" severity="secondary" text />
      <Button label="Actualizar" icon="pi pi-check" @click="funcionActualizar" severity="info" />
    </div>
  </template>
</Dialog>
<!-- Modal Crear -->
<Dialog v-model:visible="visiblecrear" modal :style="{ width: '60rem' }" :breakpoints="{ '1199px': '75vw', '575px': '90vw' }">
  <template #header>
    <div class="modal-header-custom">
      <i class="pi pi-plus-circle mr-3 text-amber-500"></i>
      <span class="modal-title-custom">Recibir Nuevo Equipo</span>
    </div>
  </template>

  <div class="dialog-content">
    <!-- Sección: Información del Equipo -->
    <Card class="section-card mb-4">
      <template #header>
        <div class="section-header">
          <i class="pi pi-mobile section-icon"></i>
          <span class="section-title">Información del Equipo</span>
        </div>
      </template>
      <template #content>
        <div class="grid grid-cols-12 gap-4">
          <div class="col-span-12 sm:col-span-6">
            <label class="field-label">
              <i class="pi pi-barcode mr-2"></i>
              IMEI
            </label>
            <InputGroup>
              <InputMask
                v-model="datoscamposRecibirequipo.imei"
                mask="999999999999999"
                placeholder="123456789012345"
                @keydown.enter="fnBuscarImei"
                class="w-full"
              />
              <Button
                icon="pi pi-search"
                severity="warning"
                @click="fnBuscarImei"
                label="Buscar"
              />
            </InputGroup>
          </div>
          <div class="col-span-12 sm:col-span-3">
            <label class="field-label">
              <i class="pi pi-check-circle mr-2"></i>
              Estado
            </label>
            <Dropdown
              v-model="datoscamposRecibirequipo.estado"
              :options="['DISPONIBLE', 'VENDIDO']"
              class="w-full"
              placeholder="Seleccione estado"
            />
          </div>
          <div class="col-span-12 sm:col-span-3">
            <label class="field-label">
              <i class="pi pi-calendar mr-2"></i>
              Fecha
            </label>
            <InputText
              v-model="datoscamposRecibirequipo.fecha"
              v-datepicker
              class="w-full"
              placeholder="Fecha"
            />
          </div>
          <div class="col-span-12">
            <label class="field-label">
              <i class="pi pi-mobile mr-2"></i>
              Equipo
            </label>
            <InputText
              v-model="datoscamposRecibirequipo.equipo"
              v-mayuscula
              class="w-full"
              placeholder="Nombre del equipo"
            />
          </div>
          <div class="col-span-12 sm:col-span-6">
            <label class="field-label">
              <i class="pi pi-tag mr-2"></i>
              Marca
            </label>
            <InputText
              v-model="datoscamposRecibirequipo.marca"
              v-mayuscula
              class="w-full"
              placeholder="Marca del equipo"
            />
          </div>
          <div class="col-span-12 sm:col-span-6">
            <label class="field-label">
              <i class="pi pi-tags mr-2"></i>
              Modelo
            </label>
            <InputText
              v-model="datoscamposRecibirequipo.modelo"
              v-mayuscula
              class="w-full"
              placeholder="Modelo del equipo"
            />
          </div>
          <div class="col-span-12 sm:col-span-6">
            <label class="field-label">
              <i class="pi pi-dollar mr-2"></i>
              Precio Compra
            </label>
            <InputText
              v-model="datoscamposRecibirequipo.preciocompra"
              v-solonumeros
              v-numeroFocusinOut
              v-decimales
              class="w-full"
              placeholder="0.00"
            />
          </div>
          <div class="col-span-12 sm:col-span-6">
            <label class="field-label">
              <i class="pi pi-money-bill mr-2"></i>
              Precio Venta
            </label>
            <InputText
              v-model="datoscamposRecibirequipo.precioventa"
              v-solonumeros
              v-numeroFocusinOut
              v-decimales
              class="w-full"
              placeholder="0.00"
            />
          </div>
          <div class="col-span-12">
            <label class="field-label">
              <i class="pi pi-align-left mr-2"></i>
              Detalles
            </label>
            <Textarea
              v-model="datoscamposRecibirequipo.detalles"
              rows="6"
              class="w-full"
              placeholder="Detalles técnicos del equipo (batería, almacenamiento, condición, etc.)"
            />
          </div>
        </div>
      </template>
    </Card>

    <!-- Sección: Información del Vendedor -->
    <Card class="section-card">
      <template #header>
        <div class="section-header">
          <i class="pi pi-user section-icon"></i>
          <span class="section-title">Información del Vendedor</span>
        </div>
      </template>
      <template #content>
        <div class="grid grid-cols-12 gap-4">
          <div class="col-span-12">
            <label class="field-label">
              <i class="pi pi-user mr-2"></i>
              Vendedor
            </label>
            <InputText
              v-model="datoscamposRecibirequipo.vendedor"
              v-mayuscula
              class="w-full"
              placeholder="Nombre del vendedor"
            />
          </div>
          <div class="col-span-12 sm:col-span-6">
            <label class="field-label">
              <i class="pi pi-id-card mr-2"></i>
              Cédula
            </label>
            <InputGroup>
              <InputText
                placeholder="Cédula"
                v-model="datoscamposRecibirequipo.cedula"
                @keydown.enter="fnBuscarCedula"
              />
              <Button
                icon="pi pi-search"
                severity="warning"
                @click="fnBuscarCedula"
                label="Buscar"
              />
            </InputGroup>
          </div>
          <div class="col-span-12 sm:col-span-6">
            <label class="field-label">
              <i class="pi pi-phone mr-2"></i>
              Teléfono
            </label>
            <InputMask
              v-model="datoscamposRecibirequipo.telefono"
              :mask="patronTelefono"
              :placeholder="patronTelefono"
              class="w-full"
            />
          </div>
          <div class="col-span-12">
            <label class="field-label">
              <i class="pi pi-map-marker mr-2"></i>
              Dirección
            </label>
            <Textarea
              v-model="datoscamposRecibirequipo.direccion"
              rows="2"
              class="w-full"
              placeholder="Dirección del vendedor"
            />
          </div>
          <div class="col-span-12">
            <label class="field-label">
              <i class="pi pi-comment mr-2"></i>
              Nota
            </label>
            <Textarea
              v-model="datoscamposRecibirequipo.nota"
              rows="2"
              class="w-full"
              placeholder="Notas adicionales"
            />
          </div>
        </div>
      </template>
    </Card>
  </div>

  <template #footer>
    <div class="flex justify-end gap-2">
      <Button label="Cancelar" icon="pi pi-times" @click="visiblecrear = false" severity="secondary" text />
      <Button label="Recibir Equipo" icon="pi pi-check" @click="funcionCrear" severity="success" />
    </div>
  </template>
</Dialog>
<!-- ////////////////////////////////////////////////////////////////////////////////////////// -->
<Toast />
  </div>
</main>

  <LoadingOverlay :visible="isLoading" />

</template>

<style scoped>
/* Header Profesional con tema amber */
.header-recibirequipo {
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  padding: 2rem;
  margin: -1rem -1rem 2rem -1rem;
  border-radius: 0 0 1rem 1rem;
  box-shadow: 0 4px 6px rgba(245, 158, 11, 0.1);
  animation: slideIn 0.5s ease-out;
}

.header-content {
  max-width: 1400px;
  margin: 0 auto;
}

.header-title {
  display: flex;
  align-items: center;
  gap: 1rem;
  color: white;
}

.header-icon {
  font-size: 2.5rem;
  opacity: 0.9;
}

.title {
  font-size: 2rem;
  font-weight: 700;
  margin: 0;
  color: white;
}

.subtitle {
  font-size: 1rem;
  margin: 0.25rem 0 0 0;
  opacity: 0.95;
  color: white;
}

/* Dashboard Grid */
.dashboard-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.5rem;
  margin-bottom: 1.5rem;
  animation: fadeIn 0.6s ease-out;
}

.dashboard-card {
  transition: all 0.3s ease;
  border: none;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.dashboard-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.12);
}

.card-amber { border-left: 4px solid #f59e0b; }
.card-orange { border-left: 4px solid #f97316; }
.card-yellow { border-left: 4px solid #eab308; }

.card-stat-content {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  padding: 0.5rem;
}

.stat-icon-wrapper {
  width: 60px;
  height: 60px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.icon-amber { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); }
.icon-orange { background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); }
.icon-yellow { background: linear-gradient(135deg, #eab308 0%, #ca8a04 100%); }

.stat-icon {
  font-size: 1.75rem;
  color: white;
}

.stat-details {
  flex: 1;
}

.stat-label {
  font-size: 0.875rem;
  color: #64748b;
  margin: 0 0 0.5rem 0;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.stat-value {
  font-size: 2rem;
  font-weight: 700;
  color: #1e293b;
  margin: 0;
  line-height: 1;
}

.stat-value-small {
  font-size: 1.25rem;
  font-weight: 600;
  color: #1e293b;
  margin: 0;
  line-height: 1.2;
}

.stat-sublabel {
  font-size: 0.75rem;
  color: #94a3b8;
  margin-top: 0.25rem;
}

/* Toolbar */
.toolbar-recibirequipo {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
}

.toolbar-actions {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.action-button {
  transition: all 0.2s ease;
}

.search-wrapper {
  flex: 1;
  min-width: 250px;
  max-width: 400px;
}

.search-input {
  width: 100%;
}

/* Tabla Profesional */
.equipos-table {
  font-size: 0.95rem;
}

.equipos-table :deep(.p-datatable-thead > tr > th) {
  background: linear-gradient(to bottom, #f59e0b, #d97706);
  color: white;
  font-weight: 600;
  padding: 1rem;
  border: none;
}

.equipos-table :deep(.p-datatable-tbody > tr) {
  transition: all 0.2s ease;
}

.equipos-table :deep(.p-datatable-tbody > tr:hover) {
  background-color: #fef3c7 !important;
  transform: scale(1.01);
}

/* Estado Badge */
.estado-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.375rem 0.875rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.estado-disponible {
  background-color: #d1fae5;
  color: #065f46;
}

.estado-vendido {
  background-color: #fee2e2;
  color: #991b1b;
}

/* Scrollbar amber personalizado */
.equipos-table :deep(.p-datatable-wrapper)::-webkit-scrollbar {
  width: 10px;
  height: 10px;
}

.equipos-table :deep(.p-datatable-wrapper)::-webkit-scrollbar-track {
  background: #f1f5f9;
  border-radius: 5px;
}

.equipos-table :deep(.p-datatable-wrapper)::-webkit-scrollbar-thumb {
  background: linear-gradient(to bottom, #f59e0b, #d97706);
  border-radius: 5px;
}

.equipos-table :deep(.p-datatable-wrapper)::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(to bottom, #d97706, #b45309);
}

/* Paginación amber */
.equipos-table :deep(.p-paginator) {
  background: #f8fafc;
  border-top: 2px solid #f59e0b;
}

.equipos-table :deep(.p-paginator .p-paginator-pages .p-paginator-page.p-highlight) {
  background: linear-gradient(135deg, #f59e0b, #d97706);
  border-color: #d97706;
  color: white;
}

/* Responsive Design */
@media (max-width: 1024px) {
  .header-recibirequipo {
    padding: 1.5rem;
  }

  .title {
    font-size: 1.75rem;
  }

  .dashboard-grid {
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1rem;
  }

  .toolbar-recibirequipo {
    flex-direction: column;
    align-items: stretch;
  }

  .toolbar-actions {
    justify-content: center;
  }

  .search-wrapper {
    max-width: 100%;
  }
}

@media (max-width: 640px) {
  .header-recibirequipo {
    padding: 1rem;
    margin: -0.5rem -0.5rem 1rem -0.5rem;
  }

  .header-icon {
    font-size: 2rem;
  }

  .title {
    font-size: 1.5rem;
  }

  .subtitle {
    font-size: 0.875rem;
  }

  .dashboard-grid {
    grid-template-columns: 1fr;
  }

  .stat-value {
    font-size: 1.75rem;
  }

  .stat-value-small {
    font-size: 1.1rem;
  }

  .toolbar-actions {
    flex-direction: column;
    width: 100%;
  }

  .action-button {
    width: 100%;
  }
}

/* Animaciones */
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

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

/* Focus states con tema amber */
.equipos-table :deep(.p-inputtext:focus),
.search-input:focus,
:deep(.p-inputtext:focus),
:deep(.p-dropdown:focus),
:deep(.p-textarea:focus),
:deep(.p-inputmask:focus) {
  border-color: #f59e0b;
  box-shadow: 0 0 0 0.2rem rgba(245, 158, 11, 0.25);
}

/* Modal personalizado */
.modal-header-custom {
  display: flex;
  align-items: center;
  font-size: 1.5rem;
  font-weight: 600;
  color: #1e293b;
}

.modal-title-custom {
  color: #1e293b;
}

.dialog-content {
  padding: 1rem;
  max-height: 70vh;
  overflow-y: auto;
}

/* Scrollbar para dialog content */
.dialog-content::-webkit-scrollbar {
  width: 8px;
}

.dialog-content::-webkit-scrollbar-track {
  background: #f1f5f9;
  border-radius: 4px;
}

.dialog-content::-webkit-scrollbar-thumb {
  background: linear-gradient(to bottom, #f59e0b, #d97706);
  border-radius: 4px;
}

.dialog-content::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(to bottom, #d97706, #b45309);
}

/* Cards de sección dentro del modal */
.section-card {
  border: 1px solid #e2e8f0;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.section-header {
  background: linear-gradient(to right, #f59e0b, #d97706);
  padding: 0.75rem 1.25rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  border-radius: 0.5rem 0.5rem 0 0;
  margin: -1px -1px 0 -1px;
}

.section-icon {
  font-size: 1.25rem;
  color: white;
}

.section-title {
  font-size: 1.1rem;
  font-weight: 600;
  color: white;
  margin: 0;
}

.field-label {
  display: flex;
  align-items: center;
  font-weight: 600;
  color: #f59e0b;
  margin-bottom: 0.5rem;
  font-size: 0.95rem;
}

.field-label i {
  color: #f59e0b;
  font-size: 1rem;
}

/* InputGroup con botones de búsqueda */
:deep(.p-inputgroup .p-button) {
  border-color: #f59e0b;
}

:deep(.p-inputgroup .p-button:hover) {
  background: #f59e0b;
  border-color: #d97706;
}
</style>
