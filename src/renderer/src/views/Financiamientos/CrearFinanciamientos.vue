
<script setup>
import { ref, onMounted, nextTick, watchEffect,computed,watch } from 'vue';
import { useToast } from "primevue/usetoast";
import { useRouter, useRoute } from 'vue-router';
import Vue3TagsInput from 'vue3-tags-input';
import { faker } from '@faker-js/faker';
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
calcularDiferenciaEnDias,
agregarDiasalaFechaActual,
generarCodigoUnico,
crearTablaSiNoExisteOffline } from '../../funciones/funciones.js';
import Swal from 'sweetalert2'
const toast = useToast();
/************************************************************************/
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
/************************************************************************/
const archivosParaSubir = ref([])
/************************************************************************/
import TablaJSON from '../../components/TablaJSON.vue'
/************************************************************************/
import { useLoading } from 'vue-loading-overlay';
const $loading = useLoading();
let loader = null;
/************************************************************************/
const camposArray = ['cedula_cliente', 'nombre_cliente', 'telefono_cliente', 'whatsapp_cliente', 'email_cliente', 'direccion_cliente', 'referencia_direccion_cliente', 'fecha_nacimiento', 'edad_cliente', 'estado_civil', 'nombre_conyugue', 'telefono_conyugue', 'ocupcion', 'salario','sexo', 'tiempo_laborando', 'tipo_empresa', 'empresa_labora', 'contacto_empresa', 'ingresos_adicionales', 'tipo_vivienda', 'vehiculo', 'cantidad_hijos', 'cantidad_dependientes', 'referencia_familiar1', 'contacto_familiar1', 'referencia_familiar2', 'contacto_familiar2', 'referencia_personal1', 'contacto_personal1', 'referencia_personal2', 'contacto_personal2', 'redes_solciales', 'no_financiamiento', 'fecha_solicitud', 'hora_emision', 'etapa_solicitud', 'score_aa', 'agente', 'resultados_prospecto', 'resultado_analisis', 'motivo', 'cedula_garante', 'nombre_garante', 'telefono_garante', 'whatsapp_garante', 'email_garante', 'vinculo_deudor', 'direccion_garante', 'referencia_direccion_garante', 'articulos', 'inicial', 'capital','total_capital', 'tasa_interes', 'interes_total', 'no_cuotas', 'valor_cuotas', 'gastos_legales','porcentaje_seguro', 'total_seguro', 'monto_total', 'total_abonado', 'total_pendiente', 'frecuencia_pago', 'fechas_pago', 'proximo_pago', 'prorrateo', 'proxima_cuota','fecha_vencimiento', 'fecha_entrega', 'responsable_entrega', 'cobrador_asignado', 'geolocalizacion', 'estado_financiamiento', 'historial_pagos', 'comentario', 'imagen','vinculo_referencia_familiar1', 'vinculo_referencia_familiar2', 'vinculo_contacto_personal1', 'vinculo_contacto_personal2','almacen'];
/************************************************************************/
import flatPickr from 'vue-flatpickr-component';
import 'flatpickr/dist/flatpickr.css';
/************************************************************************/
const uploadUrl = ref('')
const additionalData = ref('')
const value = ref('0');
/************************************************************************/
  const basic = ref({
    dateFormat: 'd/m/Y',
  });
/************************************************************************/
  const basicMultiple = ref({
    mode: "multiple",
    dateFormat: 'd/m/Y',
  })
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
const datosJSON = ref([]);
/************************************************************************/
const totalImpuestos = ref(0)
const subtotalFactura = ref(0)
const totalFactura = ref(0)
const totalGanancias = ref(0)
/************************************************************************/
const visibleProductos = ref(false)
const productosArray = ref([]);
const productosVentaArray = ref([]);
const searchQuery = ref('')
const menuModel = ref('')
const selectedProduct = ref(null);
/************************************************************************/
const fechas_pago = ref('')
/************************************************************************/
const datoscamposFinanciamientos = ref({})
const codigoUnico = ref(generarCodigoUnico());
const fecha = ref(nfecha('fecha'));
const position = "top";
/************************************************************************/
async function campos() {
  const campos = await arrayToObjetoFromTabla('financiamientos');

    datoscamposFinanciamientos.value.imagen = datoscamposFinanciamientos.value.imagen || generarCodigoUnico();
    additionalData.value = '../vista/img/productos/'+datoscamposFinanciamientos.value.imagen;


  datoscamposFinanciamientos.value = campos;
  datoscamposFinanciamientos.value.estado_civil = 'SOLTERO';
  datoscamposFinanciamientos.value.ocupcion = 'N/A';
  datoscamposFinanciamientos.value.salario = '0.00';
  datoscamposFinanciamientos.value.tiempo_laborando = '0';
  datoscamposFinanciamientos.value.tipo_empresa = 'PUBLICA';
  datoscamposFinanciamientos.value.empresa_labora = 'N/A';
  datoscamposFinanciamientos.value.ingresos_adicionales = '0.00';
  datoscamposFinanciamientos.value.tipo_vivienda = 'PROPIA';
  datoscamposFinanciamientos.value.vehiculo = 'NO';
  datoscamposFinanciamientos.value.cantidad_hijos = '0';
  datoscamposFinanciamientos.value.edad_cliente = '0';
  datoscamposFinanciamientos.value.cantidad_dependientes = '0';
  datoscamposFinanciamientos.value.no_financiamiento = generarCodigoUnico();
  datoscamposFinanciamientos.value.fecha_solicitud = nfecha('fecha');
  datoscamposFinanciamientos.value.hora_emision = nfecha('hora');
  datoscamposFinanciamientos.value.etapa_solicitud = 'PROSPECTO';
  datoscamposFinanciamientos.value.score_aa = '20';
  datoscamposFinanciamientos.value.agente = datosEmpresa.usuario.nombre;
  datoscamposFinanciamientos.value.resultados_prospecto = 'PENDIENTE';
  datoscamposFinanciamientos.value.resultado_analisis = 'PENDIENTE';
  datoscamposFinanciamientos.value.sexo = 'HOMBRE';
  datoscamposFinanciamientos.value.vinculo_deudor = 'ESPOSO(A)';
  datoscamposFinanciamientos.value.inicial = '0.00';
  datoscamposFinanciamientos.value.capital = '0.00';
  datoscamposFinanciamientos.value.total_capital = '0.00';
  datoscamposFinanciamientos.value.tasa_interes = '5.00';
  datoscamposFinanciamientos.value.porcentaje_seguro = '5.00';
  datoscamposFinanciamientos.value.interes_total = '0.00';
  datoscamposFinanciamientos.value.no_cuotas = '1';
  datoscamposFinanciamientos.value.valor_cuotas = '0.00';
  datoscamposFinanciamientos.value.gastos_legales = '0.00';
  datoscamposFinanciamientos.value.monto_total = '0.00';
  datoscamposFinanciamientos.value.total_abonado = '0.00';
  datoscamposFinanciamientos.value.total_pendiente = '0.00';
  datoscamposFinanciamientos.value.frecuencia_pago = 'QUINCENAL';
  datoscamposFinanciamientos.value.prorrateo = '0.00';
  datoscamposFinanciamientos.value.proxima_cuota = '0.00';
  datoscamposFinanciamientos.value.proximo_pago= agregarDiasalaFechaActual(30);
  datoscamposFinanciamientos.value.fecha_entrega = agregarDiasalaFechaActual(10);
  datoscamposFinanciamientos.value.estado_financiamiento = 'AL DIA';
/*  datoscamposFinanciamientos.value.articulos = '[]';*/
  datoscamposFinanciamientos.value.historial_pagos = '[]';
  datoscamposFinanciamientos.value.fechas_pago = [];
  datoscamposFinanciamientos.value.articulos = [];

}
/************************************************************************/
const datosConfig = async()=>{
    const response = await envioElectron('datosarchivo');
    datosJSON.value = response;
    link.value = response.VITE_LINKURL;
    api.value = response.VITE_LINK_API;
    token.value = response.VITE_TOKEN;
    patronTelefono.value = response.VITE_PATRON_TELEFONO;
    //linkImpresora.value = response.VITE_IMPRESORA_LOCAL;
    patroncedula.value = response.VITE_PATRON_CEDULA;
    tokenCorto.value = response.VITE_TOKEN_CORTO;
}
/************************************************************************/
const fnProductos = async()=>{
      const response = await peticionesFetchOffline('getDataAsArray', 'productos');
      productosArray.value = response;
}
/************************************************************************/
const fnProductosLocal = async()=>{
  productosVentaArray.value = []
  const productoLocalStorage = JSON.parse(localStorage.getItem('productosVenta')) || [];
  if (productoLocalStorage.length > 0) {
      productosVentaArray.value = productoLocalStorage
      sumaTotal()
  }
}
/************************************************************************/
const articulosNormalizados = computed(() => {
  try {
    return typeof datoscamposFinanciamientos.articulos === 'string'
      ? JSON.parse(datoscamposFinanciamientos.articulos)
      : datoscamposFinanciamientos.articulos || [];
  } catch (e) {
    console.warn('Error al parsear artículos:', e);
    return [];
  }
});

/************************************************************************/
onMounted(async() => {
await datosConfig()
tokenCifrado.value = await encryptarPassword(token.value, 10);
await crearTablaSiNoExisteOffline('financiamientos', camposArray.join(','), toast)
await campos()
await fnProductos()

await fnProductosLocal()

uploadUrl.value = link.value+api.value+"/subirunaimagen2";

});
/************************************************************************/
/************************************************/
const sumaTotal = () => {
  totalImpuestos.value = 0;
  subtotalFactura.value = 0;
  totalFactura.value = 0;
  totalGanancias.value = 0;
  const articulos = [];

  productosVentaArray.value.forEach(producto => {
    const impuestoPorProducto = parseFloat(producto.impuesto_venta) || 0; // Total de impuestos por producto
    const subtotalPorProducto = parseFloat(producto.precio_venta) * producto.cantidad; // Subtotal por producto (sin impuesto)
    const totalPorProducto = parseFloat(producto.total) || 0; 
    const totalGananciaProducto = parseFloat(producto.ganancia) || 0; 

    // Acumular los valores para cada categoría
    totalImpuestos.value += impuestoPorProducto;
    subtotalFactura.value += subtotalPorProducto;
    totalFactura.value += totalPorProducto;
    totalGanancias.value += totalGananciaProducto;

     articulos.push({nombre:producto.nombre,codigo:producto.codigo,codigo_barra:producto.codigo_barra,categoria:producto.categoria,marca:producto.marca,cantidad:producto.cantidad,precio_venta:producto.precio_venta,precio_compra:producto.precio_compra,precio_final:producto.precio_final,total:producto.total,ganancia:producto.ganancia_pura})

  });

  datoscamposFinanciamientos.value.articulos = articulos

  // Asegurarse de que el valor final está redondeado a dos decimales
  totalImpuestos.value = totalImpuestos.value.toFixed(2);
  subtotalFactura.value = subtotalFactura.value.toFixed(2);
  totalFactura.value = totalFactura.value.toFixed(2);
  datoscamposFinanciamientos.value.capital = totalFactura.value


};
/************************************************************************/

/************************************************************************/
async function enviarDatos(event) {
    event.preventDefault();
  const url = link.value+api.value+"/insertar/financiamientos";
  if (!datoscamposFinanciamientos.value) {
    toast.add({ severity: 'error', summary: 'Error', detail: 'Datos incompletos, no se puede Enviar.', life: 3000 });
    return;
  }
  if (datoscamposFinanciamientos.value.hasOwnProperty('created_at')) {
     datoscamposFinanciamientos.value.created_at = nfecha('timestamp')
     datoscamposFinanciamientos.value.updated_at = nfecha('timestamp')
    }
   
const fechasP = datoscamposFinanciamientos.value.fechas_pago.map(fecha => ({
  fecha,
  estado: 'NO PAGADO'
}));

datoscamposFinanciamientos.value.fechas_pago = JSON.stringify(fechasP);


   datoscamposFinanciamientos.value.articulos = JSON.stringify(datoscamposFinanciamientos.value.articulos)

  const datosEnviar = JSON.parse(JSON.stringify(datoscamposFinanciamientos.value));
  const envioDatos = await peticionesFetchOffline('insertData','financiamientos', JSON.stringify(datosEnviar));
  if (envioDatos[0] == 'ok') {
     toast.add({ severity: 'success', summary: 'Éxito', detail: 'Datos Agregados con éxito.', life: 3000 });

if (archivosParaSubir.value.length > 0) {
      for (const archivo of archivosParaSubir.value) {
        const nombreFinal = archivo.name;
        const carpeta = datoscamposFinanciamientos.value.imagen;
        await subirImagenDespuesDeInsertar(archivo, carpeta, nombreFinal);
      }
      }


Swal.fire({
  title: "Datos Agregados",
  text: "Que hacemos ahora?",
  icon: "warning",
  showCancelButton: true,
  confirmButtonText: "Agregar Otro!",
  cancelButtonText: "No, Regresar al Inicio!",
 }).then(async(result) => {
  if (result.isConfirmed) {
      await campos()
      router.push({ path: `/crearfinanciamientos` });
} else if (result.dismiss === Swal.DismissReason.cancel) {
    router.push({ path: `/financiamientos` });
  }
})
  }else{
    toast.add({ severity: 'error', summary: 'Error', detail: 'Fallo al Agregar los datos.', life: 3000 });
  }
}
/************************************************************************/
const fnBuscarCedula = async () => {
  const cedula = datoscamposFinanciamientos.value.cedula_cliente;

  if (!cedula || cedula.trim() === '') {
    toast.add({ severity: 'warn', summary: 'Atención', detail: 'Debes ingresar una cédula primero', life: 3000 });
    return;
  }

  const loader = $loading.show({ canCancel: true, loader: 'bars' });
  try {
    const docValue = cedula.replaceAll('-', '');

    // 🔹 Buscar en la base local primero
    const verificaLocal = await peticionesFetchOffline('getDataByField', 'clientes', 'cedula', docValue);
    if (verificaLocal) {
      datoscamposFinanciamientos.value.nombre_cliente = verificaLocal.nombre;
      datoscamposFinanciamientos.value.telefono_cliente = verificaLocal.telefono;
      datoscamposFinanciamientos.value.whatsapp_cliente = verificaLocal.whatsapp || verificaLocal.telefono;
      datoscamposFinanciamientos.value.direccion_cliente = verificaLocal.direccion;
      datoscamposFinanciamientos.value.email_cliente = verificaLocal.email || '';
      loader.hide();
      toast.add({ severity: 'success', summary: 'OK', detail: 'Cliente encontrado en base local', life: 3000 });
      return;
    }

    // 🔹 Si no existe, consultar API remota
    const consulta = await peticionesFetch(
      'https://demo.tmposrd.com/api2',
      'buscarcedula',
      { cedula: docValue },
      tokenCifrado.value,
      'POST'
    );

    const datosCedula = consulta?.datos;
    if (!datosCedula) {
      toast.add({ severity: 'error', summary: 'Error', detail: 'No se encuentra esta cédula', life: 3000 });
      loader.hide();
      return;
    }

    toast.add({ severity: 'success', summary: 'OK', detail: 'Datos encontrados', life: 3000 });

    const clientData = {
      ...datosCedula,
      nombrerazon_social: `${datosCedula.nombre} ${datosCedula.apellido}`,
      cedularnc: docValue
    };

    loader.hide();

    // 🔸 Solicitar datos adicionales
    const { value: additionalData } = await Swal.fire({
      title: 'Ingresa datos adicionales',
      html: `
        <input id="telefono" class="swal2-input mt-2 p-2 border rounded" placeholder="Teléfono" value="${clientData.telefono || ''}">
        <input id="whatsapp" class="swal2-input mt-2 p-2 border rounded" placeholder="WhatsApp">
        <input id="direccion" class="swal2-input mt-2 p-2 border rounded" placeholder="Dirección">
        <input id="email" class="swal2-input mt-2 p-2 border rounded" placeholder="Email">
      `,
      focusConfirm: false,
      showCancelButton: true,
      preConfirm: () => ({
        telefono: document.getElementById('telefono').value,
        whatsapp: document.getElementById('whatsapp').value,
        direccion: document.getElementById('direccion').value,
        email: document.getElementById('email').value
      }),
      customClass: {
        title: 'text-lg font-semibold',
        input: 'mt-4',
        validationMessage: 'text-red-500 text-sm mt-2'
      }
    });

    if (!additionalData) return;

    // Guardar cliente en la base de datos
    const filterUndefined = (obj) => Object.fromEntries(Object.entries(obj).filter(([_, v]) => v !== undefined));
    const jsonDataC = await arrayToObjetoFromTabla('clientes');

    jsonDataC.nombre = clientData.name || clientData.nombrerazon_social;
    jsonDataC.direccion = additionalData.direccion;
    jsonDataC.cedula = docValue;
    jsonDataC.rnc = docValue;
    jsonDataC.codigo = docValue;
    jsonDataC.precio_fijado = 'Normal';
    jsonDataC.telefono = additionalData.telefono;
    jsonDataC.whatsapp = additionalData.whatsapp || additionalData.telefono;
    jsonDataC.email = additionalData.email || '';

    const filteredJsonDataC = filterUndefined(jsonDataC);
    const envioDatos = await peticionesFetchOffline('insertData', 'clientes', JSON.stringify(filteredJsonDataC));

    if (envioDatos[0] === 'ok') {
      datoscamposFinanciamientos.value.nombre_cliente = jsonDataC.nombre;
      datoscamposFinanciamientos.value.telefono_cliente = jsonDataC.telefono;
      datoscamposFinanciamientos.value.whatsapp_cliente = jsonDataC.whatsapp;
      datoscamposFinanciamientos.value.direccion_cliente = jsonDataC.direccion;
      datoscamposFinanciamientos.value.email_cliente = jsonDataC.email;
      toast.add({ severity: 'success', summary: 'OK', detail: 'Cliente agregado correctamente', life: 3000 });
    }

  } catch (error) {
    console.error('Error consultando cliente:', error);
    toast.add({ severity: 'error', summary: 'Error', detail: 'Error al consultar datos', life: 3000 });
    loader.hide();
  }
};
/************************************************************************/
const fnBuscarCedulaGarante = async () => {
  const cedula = datoscamposFinanciamientos.value.cedula_garante;

  if (!cedula || cedula.trim() === '') {
    toast.add({ severity: 'warn', summary: 'Atención', detail: 'Debes ingresar una cédula primero', life: 3000 });
    return;
  }

  const loader = $loading.show({ canCancel: true, loader: 'bars' });
  try {
    const docValue = cedula.replaceAll('-', '');

    // 🔹 Buscar en la base local primero
    const verificaLocal = await peticionesFetchOffline('getDataByField', 'clientes', 'cedula', docValue);
    if (verificaLocal) {
      datoscamposFinanciamientos.value.nombre_garante = verificaLocal.nombre;
      datoscamposFinanciamientos.value.telefono_garante = verificaLocal.telefono;
      datoscamposFinanciamientos.value.whatsapp_garante = verificaLocal.whatsapp || verificaLocal.telefono;
      datoscamposFinanciamientos.value.direccion_garante = verificaLocal.direccion;
      datoscamposFinanciamientos.value.email_garante = verificaLocal.email || '';
      loader.hide();
      toast.add({ severity: 'success', summary: 'OK', detail: 'Garante encontrado en base local', life: 3000 });
      return;
    }

    // 🔹 Si no existe, consultar API remota
    const consulta = await peticionesFetch(
      'https://demo.tmposrd.com/api2',
      'buscarcedula',
      { cedula: docValue },
      tokenCifrado.value,
      'POST'
    );

    const datosCedula = consulta?.datos;
    if (!datosCedula) {
      toast.add({ severity: 'error', summary: 'Error', detail: 'No se encuentra esta cédula', life: 3000 });
      loader.hide();
      return;
    }

    toast.add({ severity: 'success', summary: 'OK', detail: 'Datos encontrados', life: 3000 });

    const clientData = {
      ...datosCedula,
      nombrerazon_social: `${datosCedula.nombre} ${datosCedula.apellido}`,
      cedularnc: docValue
    };

    loader.hide();

    // 🔸 Solicitar datos adicionales
    const { value: additionalData } = await Swal.fire({
      title: 'Ingresa datos adicionales del garante',
      html: `
        <input id="telefono" class="swal2-input mt-2 p-2 border rounded" placeholder="Teléfono" value="${clientData.telefono || ''}">
        <input id="whatsapp" class="swal2-input mt-2 p-2 border rounded" placeholder="WhatsApp">
        <input id="direccion" class="swal2-input mt-2 p-2 border rounded" placeholder="Dirección">
        <input id="email" class="swal2-input mt-2 p-2 border rounded" placeholder="Email">
      `,
      focusConfirm: false,
      showCancelButton: true,
      preConfirm: () => ({
        telefono: document.getElementById('telefono').value,
        whatsapp: document.getElementById('whatsapp').value,
        direccion: document.getElementById('direccion').value,
        email: document.getElementById('email').value
      }),
      customClass: {
        title: 'text-lg font-semibold',
        input: 'mt-4',
        validationMessage: 'text-red-500 text-sm mt-2'
      }
    });

    if (!additionalData) return;

    // Guardar garante en la base de datos
    const filterUndefined = (obj) => Object.fromEntries(Object.entries(obj).filter(([_, v]) => v !== undefined));
    const jsonDataC = await arrayToObjetoFromTabla('clientes');

    jsonDataC.nombre = clientData.name || clientData.nombrerazon_social;
    jsonDataC.direccion = additionalData.direccion;
    jsonDataC.cedula = docValue;
    jsonDataC.rnc = docValue;
    jsonDataC.codigo = docValue;
    jsonDataC.precio_fijado = 'Normal';
    jsonDataC.telefono = additionalData.telefono;
    jsonDataC.whatsapp = additionalData.whatsapp || additionalData.telefono;
    jsonDataC.email = additionalData.email || '';

    const filteredJsonDataC = filterUndefined(jsonDataC);
    const envioDatos = await peticionesFetchOffline('insertData', 'clientes', JSON.stringify(filteredJsonDataC));

    if (envioDatos[0] === 'ok') {
      datoscamposFinanciamientos.value.nombre_garante = jsonDataC.nombre;
      datoscamposFinanciamientos.value.telefono_garante = jsonDataC.telefono;
      datoscamposFinanciamientos.value.whatsapp_garante = jsonDataC.whatsapp;
      datoscamposFinanciamientos.value.direccion_garante = jsonDataC.direccion;
      datoscamposFinanciamientos.value.email_garante = jsonDataC.email;
      toast.add({ severity: 'success', summary: 'OK', detail: 'Garante agregado correctamente', life: 3000 });
    }

  } catch (error) {
    console.error('Error consultando garante:', error);
    toast.add({ severity: 'error', summary: 'Error', detail: 'Error al consultar datos', life: 3000 });
    loader.hide();
  }
};
/************************************************************************/
const cm = ref(null);
  const columns = [
    { field: 'codigo', header: 'Código' },
    { field: 'nombre', header: 'Nombre' },
    { field: 'stock', header: 'Stock' },
    { field: 'precio_venta', header: 'Precio' },
    { field: 'precio_min', header: 'PrecioMin' },
    { field: 'precio_xmayor', header: 'PrecioXmayor' },
  ];
/************************************************/
  const filteredProducts = computed(() => {
    if (!searchQuery.value) return productosArray.value;
    return productosArray.value.filter(product => {
      return Object.values(product).some(value =>
        String(value).toLowerCase().includes(searchQuery.value.toLowerCase())
      );
    });
  });
/************************************************************************/
const onRowSelect = (event) => {
  visibleProductos.value = false;
  searchQuery.value = ''
  Swal.fire({
    title: 'Producto Seleccionado',
    html: `
      <p><strong>Nombre:</strong> ${event.data.nombre}</p>
      <label for="precio_venta">Precio:</label>
      <input id="precio_venta" class="swal2-input" type="number" value="${event.data.precio_venta}" step="0.01">
      <label for="cantidad">Cantidad:</label>
      <input id="cantidad" class="swal2-input" type="number" value="1" min="1">
    `,
    icon: 'info',
    showCancelButton: true,
    confirmButtonText: 'Agregar Producto',
    cancelButtonText: 'Cancelar',
    preConfirm: () => {
      const precio = document.getElementById('precio_venta').value;
      const cantidad = document.getElementById('cantidad').value;

      if (!precio || !cantidad || cantidad <= 0) {
        Swal.showValidationMessage('Debes ingresar un precio y una cantidad válida');
        return false;
      }

      return {
        precio_venta: parseFloat(precio),
        cantidad: parseInt(cantidad),
      };
    }
  }).then(async(result) => {
    if (result.isConfirmed) {
      const { precio_venta, cantidad } = result.value;

       const total = (Number(precio_venta) * cantidad);
       const ganancia_pura = ((Number(event.data.precio_venta) - Number(event.data.precio_compra)) * cantidad)

      const nProd = {
        ...event.data,
        precio_venta,
        cantidad,
        ganancia_pura,
        total
      }

        productosVentaArray.value.push(nProd);
  window.localStorage.setItem('productosVenta',JSON.stringify(productosVentaArray.value))
   await fnProductosLocal()

      // Aquí podrías agregar el producto a una lista, carrito, etc.
    } else if (result.dismiss === Swal.DismissReason.cancel) {
      visibleProductos.value = true;
    }
  });
};

/************************************************************************/
function calcularEdad(fechaNacimientoStr) {
  // Dividir la fecha en partes: día, mes y año
  const [dia, mes, año] = fechaNacimientoStr.split('/').map(Number);

  // Crear objeto Date con la fecha de nacimiento
  const fechaNacimiento = new Date(año, mes - 1, dia); // mes es base 0

  // Obtener la fecha actual
  const hoy = new Date();

  // Calcular la edad
  let edad = hoy.getFullYear() - fechaNacimiento.getFullYear();

  // Ajustar si aún no ha cumplido años este año
  const mesActual = hoy.getMonth();
  const diaActual = hoy.getDate();
  if (mesActual < (mes - 1) || (mesActual === (mes - 1) && diaActual < dia)) {
    edad--;
  }

  return edad;
}

/************************************************************************/
const fnBirthday = (fecha)=>{
  const laFecha = fecha.target.value;
  if(laFecha){
    const edad = calcularEdad(laFecha)
    datoscamposFinanciamientos.value.edad_cliente = edad
  }

}
/************************************************************************/
function editarProducto(index, item, tableId) {
  Swal.fire({
    title: 'Editar producto',
    html: `
      <label>Nombre:</label>
      <input id="edit-nombre" class="swal2-input" value="${item.nombre}" />
      <label>Precio:</label>
      <input id="edit-precio" class="swal2-input" type="number" step="0.01" value="${item.precio}" />
      <label>Cantidad:</label>
      <input id="edit-cantidad" class="swal2-input" type="number" value="${item.cantidad}" />
    `,
    confirmButtonText: 'Guardar',
    showCancelButton: true,
    preConfirm: () => {
      const nombre = document.getElementById('edit-nombre').value;
      const precio = parseFloat(document.getElementById('edit-precio').value);
      const cantidad = parseInt(document.getElementById('edit-cantidad').value);

      if (!nombre || isNaN(precio) || isNaN(cantidad)) {
        Swal.showValidationMessage('Todos los campos son obligatorios');
        return false;
      }

      return { nombre, precio, cantidad };
    }
  }).then(result => {
    if (result.isConfirmed) {
      const { nombre, precio, cantidad } = result.value;

      productos.value[index] = {
        ...productos.value[index],
        nombre,
        precio,
        cantidad
      };

      Swal.fire('Actualizado', 'El producto fue actualizado.', 'success');
    }
  });
}

/************************************************************************/

async function eliminarProducto(index, tableId) {
  productosVentaArray.value.splice(index, 1);
  window.localStorage.setItem('productosVenta',JSON.stringify(productosVentaArray.value))
   await fnProductosLocal()
  Swal.fire('Eliminado', 'Producto eliminado correctamente.', 'success');
}


/************************************************************************/
const handleClickConfig = (uno,dos,tres)=>{
  console.log("tres", tres);
  console.log("dos", dos);
  console.log("uno", uno);

}
/************************************************************************/
const fnClickProducto = (index, item, tableId) => {
  Swal.fire({
    title: '¿Qué deseas hacer?',
    html: `<strong>${item.nombre}</strong>`,
    icon: 'question',
    showCancelButton: true,
    showDenyButton: true,
    confirmButtonText: 'Modificar',
    denyButtonText: 'Eliminar',
    cancelButtonText: 'Cancelar'
  }).then((result) => {
    if (result.isConfirmed) {
      // Llamar a la función de editar
      editarProducto(index, item, tableId);
    } else if (result.isDenied) {
      Swal.fire({
        title: '¿Estás seguro?',
        text: `Vas a eliminar el producto: ${item.nombre}`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar'
      }).then((res) => {
        if (res.isConfirmed) {
          // Llamar a la función de eliminar
          eliminarProducto(index, tableId);
        }
      });
    }
  });
};


/************************************************************************/
const handleSuccess = ()=>{

}
const handleError = ()=>{

}
/************************************************************************/
const fnSeleccionarTiempoCobro = () => {
  const { frecuencia_pago, no_cuotas, fecha_solicitud,tasa_interes,inicial,capital,total_capital,gastos_legales,porcentaje_seguro,total_seguro } = datoscamposFinanciamientos.value;
  const fechas = [];
  const cantidadCuotas = parseInt(no_cuotas, 10);
  let fechaInicial = new Date(fecha_solicitud.split("/").reverse().join("-"));

  // Asegurarse de que la primera fecha de pago sea el día siguiente a la fecha de emisión
  fechaInicial.setDate(fechaInicial.getDate() + 1);

  const formatDate = (date) => {
  if (!(date instanceof Date)) return ''
  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const year = date.getFullYear()
  return `${day}/${month}/${year}`
  };

  const getNextDate = (currentDate, dayOfMonth) => {
    const date = new Date(currentDate);
    if (date.getDate() >= dayOfMonth) {
      date.setMonth(date.getMonth() + 1);
    }
    date.setDate(dayOfMonth);
    return date;
  };

  let division = 7;
  let prorrateo = false;

  for (let i = 0; i < cantidadCuotas; i++) {
    let nuevaFecha = new Date(fechaInicial);

    switch (frecuencia_pago) {
      case "DIARIO":
        nuevaFecha.setDate(fechaInicial.getDate() + 1);
        fechaInicial = nuevaFecha;
        break;
      case "SEMANAL":
        nuevaFecha.setDate(fechaInicial.getDate() + 7);
        fechaInicial = nuevaFecha;
        division = 7
        prorrateo = true
        break;
      case "QUINCENAL":
        nuevaFecha.setDate(fechaInicial.getDate() + 15);
        fechaInicial = nuevaFecha;
        division = 15
        prorrateo = false
        break;
      case "MENSUAL":
        nuevaFecha.setMonth(fechaInicial.getMonth() + 1);
        fechaInicial = nuevaFecha;
        division = 30
        prorrateo = false
        break;
      case "ANUAL":
        nuevaFecha.setFullYear(fechaInicial.getFullYear() + 1);
        fechaInicial = nuevaFecha;
        break;
      case "LOS 15":
        nuevaFecha = getNextDate(fechaInicial, 15);
        fechaInicial = new Date(nuevaFecha);
        division = 30
        prorrateo = true
        break;
      case "LOS 30":
        nuevaFecha = getNextDate(fechaInicial, 30);
        fechaInicial = new Date(nuevaFecha);
        division = 30
        prorrateo = true
        break;
      case "LOS 15 Y 30":
        const is15th = i % 2 === 0;
        nuevaFecha = getNextDate(fechaInicial, is15th ? 15 : 30);
        if (!is15th) {
          fechaInicial.setMonth(fechaInicial.getMonth() + 1);
        }
        fechaInicial = new Date(nuevaFecha);
        division = 15
        prorrateo = true
        break;
      default:
        // For specific days like "LUNES", "MARTES", etc.
        const diasSemana = {
          LUNES: 1,
          MARTES: 2,
          MIERCOLES: 3,
          JUEVES: 4,
          VIERNES: 5,
          SABADOS: 6,
          DOMINGOS: 0,
        };
        const diaObjetivo = diasSemana[frecuencia_pago];
        if (diaObjetivo !== undefined) {
          nuevaFecha = new Date(fechaInicial);
          const diaActual = nuevaFecha.getDay();
          let diasParaSumar = diaObjetivo - diaActual;
          if (diasParaSumar <= 0) {
            diasParaSumar += 7;
          }
          nuevaFecha.setDate(fechaInicial.getDate() + diasParaSumar);
          fechaInicial = new Date(nuevaFecha);
        }
        break;
    }

    fechas.push(formatDate(nuevaFecha));
  }

  //datoscamposFinanciamientos.value.fechas_pago = fechas.join(", ");
  datoscamposFinanciamientos.value.fechas_pago = fechas;
  datoscamposFinanciamientos.value.proximo_pago = fechas[0]
  // 💰 Cálculo del total a pagar con interés simple
  const capitalNum = parseFloat(capital) || 0;
  const capitalRest = parseFloat(total_capital) || 0;
  const tasa = parseFloat(tasa_interes) / 100 || 0;
  const interesTotal = capitalRest * tasa;
  const montoTotal = capitalNum + interesTotal;

  const tasaSeguro = parseFloat(porcentaje_seguro) / 100 || 0;
  const totaSeguro = capitalRest * tasaSeguro;

  const totalCApital = (capital - inicial);

  datoscamposFinanciamientos.value.fechas_pago = fechas;
  datoscamposFinanciamientos.value.proximo_pago = fechas[0];
  datoscamposFinanciamientos.value.interes_total = interesTotal.toFixed(2);
  datoscamposFinanciamientos.value.monto_total = (Number(gastos_legales) + montoTotal + totaSeguro).toFixed(2);
  datoscamposFinanciamientos.value.total_capital = totalCApital.toFixed(2);
  datoscamposFinanciamientos.value.total_seguro = totaSeguro.toFixed(2)

  const sumaTotales = (Number(gastos_legales) + Number(total_seguro))
  const totalPendiente =  (Number(datoscamposFinanciamientos.value.monto_total) - Number(datoscamposFinanciamientos.value.inicial) + sumaTotales - totaSeguro).toFixed(2);

  const cuota = totalPendiente / cantidadCuotas;

  datoscamposFinanciamientos.value.valor_cuotas = cuota.toFixed(2);

const hoy = new Date();
  //const primeraFecha = new Date(fechas[0].split("/").reverse().join("-"));

  //const diferenciaDias = Math.max(1, Math.ceil((primeraFecha - hoy) / (1000 * 60 * 60 * 24))); // mínimo 1 día para evitar división por cero
  const diferenciaDias = calcularDiferenciaEnDias(fechas[0],nfecha('fecha'))
  
  const prorrateoN = ((Number(datoscamposFinanciamientos.value.valor_cuotas) / division) * diferenciaDias);

  if(prorrateo){
    datoscamposFinanciamientos.value.prorrateo = prorrateoN.toFixed(2);
  }else{
    datoscamposFinanciamientos.value.prorrateo = '0.00';
  }




  datoscamposFinanciamientos.value.total_abonado = datoscamposFinanciamientos.value.inicial;
  datoscamposFinanciamientos.value.total_pendiente = totalPendiente;



};

watch(
  () => [
datoscamposFinanciamientos.value.inicial,
datoscamposFinanciamientos.value.capital,
datoscamposFinanciamientos.value.porcentaje_seguro,
datoscamposFinanciamientos.value.tasa_interes,
datoscamposFinanciamientos.value.no_cuotas,
datoscamposFinanciamientos.value.gastos_legales,
datoscamposFinanciamientos.value.monto_total,
datoscamposFinanciamientos.value.total_abonado,
datoscamposFinanciamientos.value.frecuencia_pago,

  ],
  fnSeleccionarTiempoCobro,
  { deep: true }
);
/************************************************************************/
function ordenarFechas(dates) {
  // NO actualizar directamente fechasPago aquí
  // porque causa ciclo infinito
  // Solo dejamos que v-model lo maneje
  // y usamos un computed para tenerlo ordenado
}
/************************************************************************/
const fechasPagoOrdenadas = computed(() => {
  return [...datoscamposFinanciamientos.value.fechas_pago].sort((a, b) => new Date(a) - new Date(b))
})
/************************************************************************/
function formatearFecha(date) {
  if (!(date instanceof Date)) return ''
  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const year = date.getFullYear()
  return `${day}/${month}/${year}`
}
/************************************************************************/

/************************************************************************/
function ordenarFechasAntesDeGuardar() {
  const fechas = datoscamposFinanciamientos.value.fechas_pago || []
  const ordenadas = [...fechas]
    .map(f => f instanceof Date ? f : new Date(f))
    .sort((a, b) => a - b)

  datoscamposFinanciamientos.value.fechas_pago = ordenadas
}

/************************************************************************/
const calcularScoreCliente = (cliente) => {
  let score = 0;

  // Hijos
  const hijos = parseInt(cliente.cantidad_hijos || 0);
  if (hijos <= 1) score += 10;
  else if (hijos <= 3) score += 5;

  // Salario
  const salario = parseFloat(cliente.salario || 0);
  if (salario >= 50000) score += 25;
  else if (salario >= 25000) score += 15;
  else score += 5;

  // Ingresos adicionales
  const ingresosAdicionales = parseFloat(cliente.ingresos_adicionales || 0);
  if (ingresosAdicionales > 10000) score += 10;
  else if (ingresosAdicionales >= 5000) score += 5;

  // Tiempo laborando
  const tiempo = parseInt(cliente.tiempo_laborando || 0);
  if (tiempo >= 12) score += 20;
  else if (tiempo >= 6) score += 10;
  else score += 5;

  // Casa
  const casa = (cliente.tipo_vivienda || '').toUpperCase();
  if (casa === 'PROPIO') score += 10;
  else if (casa === 'ALQUILADA') score -= 10;

  // Carro
  const carro = (cliente.vehiculo || '').toUpperCase();
  if (carro === 'PROPIO') score += 10;
  else if (carro === 'OPOSICION') score -= 10;

  // Estado civil
  const estadoCivil = (cliente.estado_civil || '').toUpperCase();
  if (estadoCivil === 'CASADO') score += 10;
  else if (estadoCivil === 'SOLTERO') score += 5;

  // Dependientes
  const dependientes = parseInt(cliente.cantidad_dependientes || 0);
  if (dependientes <= 1) score += 10;
  else if (dependientes <= 3) score += 5;
  return score;
};


/************************************************************************/
//const scoreCliente = computed(() => calcularScoreCliente(datoscamposFinanciamientos.value));

const scoreAAVisual = computed(() => {
  if (!datoscamposFinanciamientos.value) {
    return {
      score: 0,
      label: 'NO APTO',
      percentage: 0,
      color: '#dc2626',
      gradient: 'linear-gradient(90deg, #f87171 0%, #dc2626 100%)',
      glow: 'rgba(220, 38, 38, 0.25)',
      textClass: 'score-risk',
      recommendation: 'Se requiere validar mejor el perfil antes de aprobar.'
    };
  }

  const score = Math.min(Math.max(calcularScoreCliente(datoscamposFinanciamientos.value) || 0, 0), 100);
  datoscamposFinanciamientos.value.score_aa = score;

  if (score >= 70) {
    return {
      score,
      label: 'APTO',
      percentage: score,
      color: '#16a34a',
      gradient: 'linear-gradient(90deg, #34d399 0%, #16a34a 100%)',
      glow: 'rgba(22, 163, 74, 0.25)',
      textClass: 'score-success',
      recommendation: 'Perfil estable con buena capacidad para continuar el proceso.'
    };
  }

  if (score >= 50) {
    return {
      score,
      label: 'RIESGO MEDIO',
      percentage: score,
      color: '#f59e0b',
      gradient: 'linear-gradient(90deg, #fcd34d 0%, #f59e0b 100%)',
      glow: 'rgba(245, 158, 11, 0.25)',
      textClass: 'score-warning',
      recommendation: 'Conviene revisar referencias e ingresos antes de decidir.'
    };
  }

  return {
    score,
    label: 'NO APTO',
    percentage: score,
    color: '#dc2626',
    gradient: 'linear-gradient(90deg, #f87171 0%, #dc2626 100%)',
    glow: 'rgba(220, 38, 38, 0.25)',
    textClass: 'score-risk',
    recommendation: 'Se requiere validar mejor el perfil antes de aprobar.'
  };
});



/************************************************************************/
const updateTags = (fecha)=>{
  console.log("fecha", fecha);

}
/************************************************************************/
const handleClickTag = (tag) => {
  console.log('Etiqueta clickeada:', tag);

  // Puedes mostrarla en un modal, notificación o guardarla para edición
  toast.add({ severity: 'info', summary: 'Fecha seleccionada', detail: tag.text || tag, life: 3000 });
};

/************************************************************************/
const fnCambiaPrimeraFecha = (selected)=>{
  const nuevaFecha = selected.target.value;
  const fechasArray = datoscamposFinanciamientos.value.fechas_pago
  fechasArray[0] = nuevaFecha

}
/************************************************************************/

/************************************************************************/
const generarDatosPrueba = () => {
  datoscamposFinanciamientos.value.nombre_cliente = faker.person.fullName();
  datoscamposFinanciamientos.value.cedula_cliente = faker.string.numeric(11);
  datoscamposFinanciamientos.value.telefono_cliente = faker.phone.number('809-###-####');
  datoscamposFinanciamientos.value.whatsapp_cliente = faker.phone.number('809-###-####');
  datoscamposFinanciamientos.value.email_cliente = faker.internet.email();
  datoscamposFinanciamientos.value.direccion_cliente = faker.location.streetAddress();
  datoscamposFinanciamientos.value.estado_civil = faker.helpers.arrayElement(['SOLTERO', 'CASADO', 'DIVORCIADO']);

  datoscamposFinanciamientos.value.nombre_conyugue= faker.person.fullName();
  datoscamposFinanciamientos.value.telefono_conyugue = faker.phone.number('809-###-####');

  datoscamposFinanciamientos.value.ocupcion = faker.person.jobTitle();
  datoscamposFinanciamientos.value.empresa_labora = faker.company.name();
  datoscamposFinanciamientos.value.contacto_empresa = faker.phone.number('809-###-####');

  datoscamposFinanciamientos.value.referencia_familiar1 = faker.person.fullName();
  datoscamposFinanciamientos.value.contacto_familiar1 = faker.phone.number('809-###-####');

  datoscamposFinanciamientos.value.referencia_familiar2 = faker.person.fullName();
  datoscamposFinanciamientos.value.contacto_familiar2 = faker.phone.number('809-###-####');

  datoscamposFinanciamientos.value.referencia_personal1 = faker.person.fullName();
  datoscamposFinanciamientos.value.contacto_personal1 = faker.phone.number('809-###-####');

  datoscamposFinanciamientos.value.referencia_personal2 = faker.person.fullName();
  datoscamposFinanciamientos.value.contacto_personal2 = faker.phone.number('809-###-####');



  datoscamposFinanciamientos.value.tipo_empresa = faker.helpers.arrayElement(['PUBLICA', 'PRIVADA']);
  datoscamposFinanciamientos.value.tiempo_laborando = faker.number.int({ min: 1, max: 24 });
  datoscamposFinanciamientos.value.no_cuotas = faker.number.int({ min: 1, max: 24 });
  datoscamposFinanciamientos.value.salario = faker.number.int({ min: 15000, max: 70000 });
  datoscamposFinanciamientos.value.ingresos_adicionales = faker.number.int({ min: 0, max: 10000 });
  datoscamposFinanciamientos.value.cantidad_hijos = faker.number.int({ min: 0, max: 5 });
  datoscamposFinanciamientos.value.cantidad_dependientes = faker.number.int({ min: 0, max: 5 });
  datoscamposFinanciamientos.value.tipo_vivienda = faker.helpers.arrayElement(['PROPIA', 'ALQUILADA']);
  datoscamposFinanciamientos.value.vehiculo = faker.helpers.arrayElement(['PROPIO', 'NO', 'OPOSICION']);
  datoscamposFinanciamientos.value.vinculo_deudor = faker.helpers.arrayElement(['AMIGO', 'FAMILIAR', 'NINGUNO']);
  datoscamposFinanciamientos.value.agente = faker.person.fullName();
  datoscamposFinanciamientos.value.empresa_labora = faker.company.name();
  //datoscamposFinanciamientos.value.articulos = faker.commerce.productName();
  //datoscamposFinanciamientos.value.capital = faker.number.int({ min: 5000, max: 100000 });
  datoscamposFinanciamientos.value.inicial = faker.number.int({ min: 1000, max: 5000 });
  datoscamposFinanciamientos.value.tasa_interes = faker.number.float({ min: 1.5, max: 5.5, precision: 0.1 });
  datoscamposFinanciamientos.value.valor_cuotas = faker.number.int({ min: 1000, max: 10000 });
  datoscamposFinanciamientos.value.frecuencia_pago = faker.helpers.arrayElement(['SEMANAL', 'QUINCENAL', 'MENSUAL']);
  datoscamposFinanciamientos.value.fecha_entrega = faker.date.future().toISOString().split('T')[0];
  //datoscamposFinanciamientos.value.fecha_solicitud = faker.date.recent().toISOString().split('T')[0];

const fechaNacimiento = faker.date.birthdate({ min: 18, max: 40, mode: 'age' });
const fechaFormateada = fechaNacimiento.toLocaleDateString('es-DO', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric'
});

datoscamposFinanciamientos.value.fecha_nacimiento = fechaFormateada;
datoscamposFinanciamientos.value.edad_cliente = calcularEdad(fechaFormateada);



  //fnBirthday(fechaEnvio)
/*  datoscamposFinanciamientos.value.fechas_pago = [
    faker.date.future().toISOString().split('T')[0],
    faker.date.future().toISOString().split('T')[0]
  ];*/
  datoscamposFinanciamientos.value.estado_financiamiento = faker.helpers.arrayElement(['PENDIENTE', 'APROBADO', 'RECHAZADO']);
  datoscamposFinanciamientos.value.etapa_solicitud = faker.helpers.arrayElement(['INICIO', 'VERIFICACION', 'FIRMA']);
  datoscamposFinanciamientos.value.gastos_legales = faker.number.int({ min: 500, max: 3000 });
  datoscamposFinanciamientos.value.interes_total = faker.number.int({ min: 1000, max: 10000 });
  datoscamposFinanciamientos.value.total_abonado = faker.number.int({ min: 0, max: 50000 });
  datoscamposFinanciamientos.value.total_pendiente = faker.number.int({ min: 0, max: 50000 });
  datoscamposFinanciamientos.value.monto_total = faker.number.int({ min: 10000, max: 200000 });
  datoscamposFinanciamientos.value.proximo_pago = faker.date.future().toISOString().split('T')[0];
  datoscamposFinanciamientos.value.proxima_cuota = faker.date.future().toISOString().split('T')[0];
  datoscamposFinanciamientos.value.resultado_analisis = faker.lorem.sentence();
  datoscamposFinanciamientos.value.resultados_prospecto = faker.lorem.sentence();
  datoscamposFinanciamientos.value.imagen = faker.image.avatar();
  datoscamposFinanciamientos.value.no_financiamiento = faker.string.alphanumeric(8).toUpperCase();
  datoscamposFinanciamientos.value.hora_emision = `${faker.number.int({ min: 8, max: 17 })}:${faker.number.int({ min: 0, max: 59 }).toString().padStart(2, '0')}`;
  datoscamposFinanciamientos.value.score_aa = 0; // Se recalcula automáticamente

};

const crearRegistroFinanciamiento = async () => {
  const data = {
    nombre_cliente: faker.person.fullName(),
    cedula_cliente: faker.string.numeric({ length: 11, allowLeadingZeros: false }),
    telefono_cliente: faker.phone.number('809-###-####'),
    whatsapp_cliente: faker.phone.number('809-###-####'),
    email_cliente: faker.internet.email(),
    direccion_cliente: faker.location.streetAddress(),
    referencia_direccion_cliente: faker.location.streetAddress(),
    estado_civil: faker.helpers.arrayElement(['SOLTERO', 'CASADO', 'DIVORCIADO', 'UNION LIBRE']),
    nombre_conyugue: faker.person.fullName(),
    telefono_conyugue: faker.phone.number('809-###-####'),
    ocupcion: faker.person.jobTitle(),
    empresa_labora: faker.company.name(),
    contacto_empresa: faker.phone.number('809-###-####'),
    salario: faker.number.int({ min: 15000, max: 70000 }).toString(),
    ingresos_adicionales: faker.number.int({ min: 0, max: 10000 }).toString(),
    tiempo_laborando: faker.number.int({ min: 1, max: 24 }).toString(),
    tipo_empresa: faker.helpers.arrayElement(['PUBLICA', 'PRIVADA']),
    tipo_vivienda: faker.helpers.arrayElement(['PROPIA', 'ALQUILADA']),
    vehiculo: faker.helpers.arrayElement(['PROPIO', 'NO', 'OPOSICION']),
    cantidad_hijos: faker.number.int({ min: 0, max: 5 }).toString(),
    cantidad_dependientes: faker.number.int({ min: 0, max: 5 }).toString(),
    referencia_familiar1: faker.person.fullName(),
    contacto_familiar1: faker.phone.number('809-###-####'),
    referencia_familiar2: faker.person.fullName(),
    contacto_familiar2: faker.phone.number('809-###-####'),
    referencia_personal1: faker.person.fullName(),
    contacto_personal1: faker.phone.number('809-###-####'),
    referencia_personal2: faker.person.fullName(),
    contacto_personal2: faker.phone.number('809-###-####'),
    redes_solciales: JSON.stringify({ instagram: faker.internet.username(), facebook: faker.internet.username() }),
    vinculo_deudor: faker.helpers.arrayElement(['ESPOSO(A)', 'FAMILIAR', 'AMIGO', 'NINGUNO']),
    vinculo_referencia_familiar1: faker.helpers.arrayElement(['HERMANO(A)', 'PADRE', 'MADRE', 'TIO(A)']),
    vinculo_referencia_familiar2: faker.helpers.arrayElement(['HERMANO(A)', 'PADRE', 'MADRE', 'TIO(A)']),
    vinculo_contacto_personal1: 'AMIGO',
    vinculo_contacto_personal2: 'AMIGO',
    nombre_garante: faker.person.fullName(),
    cedula_garante: faker.string.numeric({ length: 11, allowLeadingZeros: false }),
    telefono_garante: faker.phone.number('809-###-####'),
    whatsapp_garante: faker.phone.number('809-###-####'),
    email_garante: faker.internet.email(),
    direccion_garante: faker.location.streetAddress(),
    referencia_direccion_garante: faker.location.streetAddress(),
    no_financiamiento: faker.string.alphanumeric(8).toUpperCase(),
    fecha_solicitud: new Date().toLocaleDateString('es-DO', { day: '2-digit', month: '2-digit', year: 'numeric' }),
    hora_emision: `${String(faker.number.int({ min: 8, max: 17 })).padStart(2, '0')}:${String(faker.number.int({ min: 0, max: 59 })).padStart(2, '0')}`,
    etapa_solicitud: faker.helpers.arrayElement(['PROSPECTO', 'VALIDACION', 'ANALISIS', 'FIRMA CLIENTE', 'ENTREGA']),
    score_aa: faker.number.int({ min: 10, max: 100 }).toString(),
    agente: faker.person.fullName(),
    resultados_prospecto: faker.helpers.arrayElement(['PENDIENTE', 'APROBADO', 'APLAZADO', 'DECLINADO']),
    resultado_analisis: faker.helpers.arrayElement(['PENDIENTE', 'APROBADO', 'APLAZADO', 'DECLINADO']),
    motivo: faker.lorem.sentence(),
    articulos: JSON.stringify([{ nombre: faker.commerce.productName(), cantidad: faker.number.int({ min: 1, max: 5 }), precio_venta: faker.number.int({ min: 1000, max: 50000 }) }]),
    inicial: faker.number.int({ min: 1000, max: 5000 }).toString(),
    capital: faker.number.int({ min: 5000, max: 100000 }).toString(),
    total_capital: '0.00',
    tasa_interes: faker.number.float({ min: 1.5, max: 5.5, precision: 0.1 }).toString(),
    interes_total: faker.number.int({ min: 1000, max: 10000 }).toString(),
    porcentaje_seguro: '5.00',
    total_seguro: '0.00',
    no_cuotas: faker.number.int({ min: 3, max: 24 }).toString(),
    valor_cuotas: faker.number.int({ min: 1000, max: 10000 }).toString(),
    gastos_legales: faker.number.int({ min: 500, max: 3000 }).toString(),
    monto_total: faker.number.int({ min: 10000, max: 200000 }).toString(),
    total_abonado: '0.00',
    total_pendiente: faker.number.int({ min: 5000, max: 150000 }).toString(),
    frecuencia_pago: faker.helpers.arrayElement(['SEMANAL', 'QUINCENAL', 'MENSUAL']),
    fechas_pago: JSON.stringify([]),
    proximo_pago: faker.date.future().toISOString().split('T')[0],
    prorrateo: '0.00',
    proxima_cuota: '1',
    fecha_vencimiento: faker.date.future().toISOString().split('T')[0],
    fecha_entrega: faker.date.future().toISOString().split('T')[0],
    responsable_entrega: faker.person.fullName(),
    cobrador_asignado: faker.person.fullName(),
    geolocalizacion: JSON.stringify({ lat: faker.location.latitude(), lng: faker.location.longitude() }),
    estado_financiamiento: faker.helpers.arrayElement(['AL DIA', 'ATRASADO', 'PENDIENTE', 'PAGADO']),
    historial_pagos: JSON.stringify([]),
    comentario: faker.lorem.paragraph(),
    imagen: faker.string.alphanumeric(16).toLowerCase(),
    sexo: faker.helpers.arrayElement(['HOMBRE', 'MUJER']),
    fecha_nacimiento: faker.date.birthdate({ min: 18, max: 65, mode: 'age' }).toLocaleDateString('es-DO', { day: '2-digit', month: '2-digit', year: 'numeric' }),
    edad_cliente: faker.number.int({ min: 18, max: 65 }).toString(),
    almacen: datosEmpresa.empresa.nombre || '',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
  const envioDatos = await peticionesFetchOffline('insertData', 'financiamientos', JSON.stringify(data));
  return envioDatos && envioDatos[0] === 'ok'
}

const generarMultiplesEntradas = async () => {
  const { value: cantidad } = await Swal.fire({
    title: 'Cuantos registros deseas crear?',
    input: 'number',
    inputValue: 10,
    showCancelButton: true,
    confirmButtonText: 'Crear',
    cancelButtonText: 'Cancelar'
  })
  if (!cantidad || cantidad <= 0) return

  const loader = $loading.show({ loader: 'bars' })
  let creados = 0
  for (let i = 0; i < cantidad; i++) {
    const ok = await crearRegistroFinanciamiento()
    if (ok) creados++
  }
  loader.hide()
  Swal.fire({
    icon: 'success',
    title: 'Registros creados',
    text: `${creados} de ${cantidad} financiamientos generados correctamente.`,
    confirmButtonText: 'OK'
  })
}




/************************************************************************/
const fnAbonar = async () => {
  const { value: formValues } = await Swal.fire({
    title: '<span class="text-blue-600 dark:text-blue-400 text-lg font-semibold">Realizar Abono</span>',
    html: `
      <div class="grid grid-cols-1 gap-4 text-left text-gray-800 dark:text-gray-200">
        <div class="flex flex-col">
          <label for="swal-input-monto" class="text-sm font-medium mb-1">Monto a abonar</label>
          <input id="swal-input-monto" type="number" min="0" step="0.01"
            class="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white p-2 focus:ring-2 focus:ring-blue-500"
            placeholder="Ej: 2500.00" />
        </div>

        <div class="flex flex-col">
          <label for="swal-input-metodo" class="text-sm font-medium mb-1">Método de pago</label>
          <select id="swal-input-metodo"
            class="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white p-2 focus:ring-2 focus:ring-blue-500">
            <option value="EFECTIVO">EFECTIVO</option>
            <option value="TARJETA">TARJETA</option>
            <option value="TRANSFERENCIA">TRANSFERENCIA</option>
          </select>
        </div>
      </div>
    `,
    background: '#ffffff',
    customClass: {
      popup: 'rounded-xl p-6 dark:bg-gray-900',
      confirmButton: 'bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700',
      cancelButton: 'bg-gray-300 text-black px-4 py-2 rounded-md hover:bg-gray-400 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600',
    },
    showCancelButton: true,
    confirmButtonText: 'Abonar',
    cancelButtonText: 'Cancelar',
    focusConfirm: false,
    preConfirm: () => {
      const monto = parseFloat(document.getElementById('swal-input-monto').value);
      const metodo = document.getElementById('swal-input-metodo').value;

      if (isNaN(monto) || monto <= 0) {
        Swal.showValidationMessage('Debes ingresar un monto válido mayor que 0');
        return false;
      }

      return { monto, metodo };
    }
  });

  if (formValues) {

    formValues.fecha = nfecha('fecha')
    formValues.hora = nfecha('hora')

    const pagosRegistrados = JSON.parse(datoscamposFinanciamientos.value.historial_pagos)
    pagosRegistrados.push(formValues)
    datoscamposFinanciamientos.value.historial_pagos = JSON.stringify(pagosRegistrados)
    datoscamposFinanciamientos.value.inicial = formValues.monto

    Swal.fire({
      icon: 'success',
      title: 'Abono registrado',
      html: `
        <p class="text-lg font-semibold text-green-600 dark:text-green-400">Monto: RD$ ${formValues.monto.toFixed(2)}</p>
        <p class="text-sm text-gray-700 dark:text-gray-300">Método: ${formValues.metodo}</p>
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-2">${new Date().toLocaleString()}</p>
      `,
      background: '#ffffff',
      customClass: {
        popup: 'rounded-xl p-6 dark:bg-gray-900',
        title: 'text-lg font-semibold text-green-600 dark:text-green-400'
      }
    });
  }
};

/************************************************************************/
const editarAbono = ()=>{

}
/************************************************************************/
const eliminarAbono = ()=>{

}
/************************************************************************/
function generarPlanPagoPDF() {
  try {
    const doc = new jsPDF();

    // Validar que haya fechas de pago
    if (!datoscamposFinanciamientos.value.fechas_pago || datoscamposFinanciamientos.value.fechas_pago.length === 0) {
      toast.add({
        severity: 'warn',
        summary: 'Advertencia',
        detail: 'No hay fechas de pago programadas. Configure las condiciones primero.',
        life: 3000
      });
      return;
    }

    // Generar el plan de pagos automáticamente
    const totalCuotas = datoscamposFinanciamientos.value.no_cuotas; // por ejemplo, 12 meses
    const montoPrincipal = parseFloat(datoscamposFinanciamientos.value.monto_total || 0);
    const interesTotal = parseFloat(datoscamposFinanciamientos.value.interes_total || 0);
    const tasaInteres = parseFloat(datoscamposFinanciamientos.value.tasa_interes || 0);
    const montoSeguro = parseFloat(datoscamposFinanciamientos.value.total_seguro || 0) / totalCuotas;
    const montoCuota = parseFloat((montoPrincipal + interesTotal) / totalCuotas);
    const interesPorCuota = interesTotal / totalCuotas;
    const montoPorCuota = montoPrincipal / totalCuotas;
    const totalInteresMensual = montoPorCuota + interesPorCuota;

    let balance = montoPrincipal;
    const fechaPago = datoscamposFinanciamientos.value.fechas_pago;
    const planPagos = [];

    for (let fecha of fechaPago) {
      const laFecha = fecha.split('/');

      planPagos.push({
        fecha: fecha,
        dia: laFecha[0],
        monto: montoPorCuota.toFixed(2),
        seguro: montoSeguro.toFixed(2),
        balance: balance.toFixed(2),
        tasaInteres: tasaInteres.toFixed(2),
        totalInteres: totalInteresMensual.toFixed(2),
        cuota: (totalInteresMensual + montoSeguro).toFixed(2)
      });

      balance -= montoPorCuota;
    }

    // Título
    doc.setFontSize(12);
    doc.text(datosEmpresa.empresa.nombre, 105, 10, { align: 'center' });
    doc.setFontSize(10);
    doc.text(datosEmpresa.empresa.legal, 105, 15, { align: 'center' });
    doc.text('Tabla de Amortización', 105, 22, { align: 'center' });

  // Información cliente
  const info = [
    [`Número de Financiamiento:`, datoscamposFinanciamientos.value.no_financiamiento, `Código del Cliente:`, datoscamposFinanciamientos.value.cedula_cliente],
    [`Monto Principal:`, `$${montoPrincipal.toLocaleString()}`, `Nombre:`, datoscamposFinanciamientos.value.nombre_cliente],
    [`Monto de intereses:`, `$${interesTotal.toLocaleString()}`, `Periodicidad:`, datoscamposFinanciamientos.value.frecuencia_pago],
    [`Fecha de apertura:`, datoscamposFinanciamientos.value.fecha_solicitud, `Fecha de vencimiento:`, datoscamposFinanciamientos.value.fecha_vencimiento]
  ];

  let y = 30;
  info.forEach(row => {
    doc.text(`${row[0]} ${row[1]}`, 10, y);
    doc.text(`${row[2]} ${row[3]}`, 110, y);
    y += 6;
  });

  // Tabla
  autoTable(doc, {
    head: [[
      'Línea', 'Fecha', 'Estado', 'DÍA', 'Monto', 'Seguro',
      'Balance', 'Tasa de interes', 'Principal mas Interes', 'Cuota'
    ]],
    body: planPagos.map((p, index) => [
      index + 1,
      p.fecha,
      'Pendiente',
      p.dia,
      `$${p.monto.toLocaleString()}`,
      `$${p.seguro.toLocaleString()}`,
      `$${p.balance.toLocaleString()}`,
      `${p.tasaInteres}%`,
      `$${p.totalInteres.toLocaleString()}`,
      `$${p.cuota.toLocaleString()}`
    ]),
    startY: y + 5,
    theme: 'grid',
    styles: { fontSize: 8 },
  });

  // Firmas
  const finalY = doc.lastAutoTable.finalY + 20;
  doc.text('_________________________', 30, finalY)
  doc.text('_________________________', 130, finalY)
  doc.text('FIRMA DEL CLIENTE', 40, finalY + 6)
  doc.text('FIRMA DEL GARANTE', 140, finalY + 6)

  // Alerta
/*  Swal.fire({
    title: '¡Plan de Pagos Generado!',
    text: '¿Deseas descargar el PDF?',
    icon: 'success',
    showCancelButton: true,
    confirmButtonText: 'Sí, descargar',
    cancelButtonText: 'Cancelar',
  }).then(result => {
    if (result.isConfirmed) {
      doc.save(`PlanPago-${datoscamposFinanciamientos.value.no_financiamiento}.pdf`)
    }
  });
*/
    const blob = doc.output('blob');
    const pdfObjectUrl = URL.createObjectURL(blob);

    Swal.fire({
      title: 'Vista previa de la Tabla de Amortización',
      html: `
        <iframe src="${pdfObjectUrl}" width="100%" height="500px" style="border: none;"></iframe>
      `,
      width: '80%',
      showCloseButton: true,
      showCancelButton: true,
      confirmButtonText: 'Descargar PDF',
      cancelButtonText: 'Cerrar',
      didOpen: () => {
        // Puedes hacer focus u otra cosa si quieres
      }
    }).then(result => {
      if (result.isConfirmed) {
        const link = document.createElement('a');
        link.href = pdfObjectUrl;
        link.download = `TablaAmortizacion-${datoscamposFinanciamientos.value.no_financiamiento}.pdf`;
        link.click();
      }
      // Liberar el objeto URL cuando se cierre el modal
      URL.revokeObjectURL(pdfObjectUrl);
    });

  } catch (error) {
    console.error('Error generando tabla de amortización:', error);
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Hubo un error al generar la tabla de amortización. Verifique que todos los datos estén completos.',
      life: 5000
    });
  }
}

/************************************************************************/
function cargarImagenComoBase64(rutaImagen) {
  return new Promise((resolve, reject) => {
    fetch(`file://${rutaImagen}`)
      .then(response => response.blob())
      .then(blob => {
        const reader = new FileReader()
        reader.onloadend = () => resolve(reader.result)
        reader.onerror = reject
        reader.readAsDataURL(blob)
      })
      .catch(reject)
  })
}

/************************************************************************/
const getBase64ImageFromURLAutoSize = async (url, maxWidth, maxHeight) => {
  const response = await fetch(url)
  const blob = await response.blob()
  const img = await createImageBitmap(blob)

  const originalWidth = img.width
  const originalHeight = img.height

  // Calcular escala proporcional
  let width = originalWidth
  let height = originalHeight

  const widthRatio = maxWidth / width
  const heightRatio = maxHeight / height
  const scale = Math.min(widthRatio, heightRatio)

  width *= scale
  height *= scale

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height

  const ctx = canvas.getContext('2d')
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(img, 0, 0, width, height)

  return {
    base64: canvas.toDataURL(),
    width,
    height
  }
}

/************************************************************************/
async function generarAutorizacionPDF() {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: 'letter' // Tamaño carta
  })
  let startY = 10;
const pageWidth = doc.internal.pageSize.getWidth(); // 📌 Ancho de la página
    const { base64, width, height } = await getBase64ImageFromURLAutoSize(
    datosEmpresa.empresa.imagen,
    150, // ancho máximo
    60   // alto máximo
  )

    const logoWidth = 30; // 📌 Tamaño del logo
    const logoX = (pageWidth - logoWidth) / 2; // 📌 Calcular centro

    doc.addImage(base64, "PNG", logoX, startY, width, height);

    doc.setFont('times', 'bold')
    doc.setFontSize(12)
    doc.text('AUTORIZACIÓN PARA CONSULTA INFORMACIÓN CREDITICIA,', 306, 100, { align: 'center' })
    doc.text('CAPTURA Y ALMACENAMIENTO DE DATOS BIOMÉTRICOS', 306, 115, { align: 'center' })

    doc.setFont('times', 'normal')
    doc.setFontSize(11)
    const text = `Conforme a las leyes 172-13 sobre Protección Integral de Datos Personales y la Ley 4-23 sobre sobre registro civil, respecto de la captura y almacenamiento de datos biométricos, EL FIRMANTE otorga su consentimiento formal y expreso, para que, AA Solutions Comercial pueda: 1. Consultar su información personal reportada en las bases de datos de las Sociedades de Información Crediticia, y 2. Capturar y almacenar sus datos biométricos.`

    doc.text(text, 55, 140, { maxWidth: 500, lineHeightFactor: 1.5 })

    doc.text('El firmante da su autorización expresa para los fines de:', 55, 225)

    // Recolección y Validación encabezados
    doc.setFont('times', 'bold')
    doc.text('Recolección y almacenamiento', 55, 245)
    doc.text('Validación y consulta', 330, 245)

    // Cuadros y checkboxes
    doc.setFont('times', 'normal')
    // Recolección
    doc.rect(55, 255, 10, 10)
    doc.text('X', 57, 263)
    doc.text('Fotografía de su rostro', 70, 263)

    doc.rect(55, 275, 10, 10)
    doc.text('X', 57, 283)
    doc.text('Huella dactilar', 70, 283)

    // Validación
    doc.rect(330, 255, 10, 10)
    doc.text('X', 332, 263)
    doc.text('Buró de crédito', 345, 263)

    doc.rect(330, 275, 10, 10)
    doc.text('', 332, 283) // vacío
    doc.text('Otro (Especificar cual en observaciones)', 345, 283)

    // Firmas
    doc.line(55, 330, 250, 330)
    doc.text('(Firmar igual que en su cédula)', 55, 340)

    doc.line(330, 330, 555, 330)
    doc.text('(Cédula escrita por el cliente)', 330, 340)

    doc.line(190, 370, 420, 370)
    doc.text('(Fecha escrita por el cliente)', 230, 380)

    // Huella
    doc.rect(55, 400, 120, 90)
    doc.text('Huella dactilar dedo INDICE DERECHO', 55, 500)

    // Observaciones
    doc.text('Observaciones:', 55, 530)
    doc.line(55, 540, 555, 540)
    doc.line(55, 560, 555, 560)

    // Footer
doc.setFontSize(9)
doc.text(
  'Autorización para consulta información crediticia, captura y almacenamiento de datos biométricos',
  555,
  760,
  { align: 'right' }
)
doc.text('Código: GA-DCC-03     Versión 01, Abril 2025', 555, 770, { align: 'right' })


    // Mostrar en Swal
    const pdfData = doc.output('datauristring')
    Swal.fire({
      title: 'Autorización Generada',
      html: `<embed src="${pdfData}" type="application/pdf" width="100%" height="500px"/>`,
      width: '80%',
      showCloseButton: true,
      confirmButtonText: 'Cerrar'
    })
  }

/************************************************************************/
  function formatearFechaTexto(fechaISO) {
  const date = new Date(fechaISO)
  return date.toLocaleDateString('es-DO', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  })
}
/************************************************************************/
async function generarPagarePDF() {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: [612, 1008] // Legal size en puntos (8.5 x 14 pulgadas)
  });
  const pageWidth = doc.internal.pageSize.getWidth();

  // 📦 Extraemos los datos del componente
  const data = datoscamposFinanciamientos.value;
  const nombre = data.nombre_cliente;
  const cedula = data.cedula_cliente;
  const direccion = data.direccion_cliente;
  const estadoCivil = data.estado_civil || 'soltero(a)';
  const monto = formatearRD(data.monto_total);
  const cuotas = data.no_cuotas;
  const valorCuota = formatearRD(data.valor_cuotas);
  const interes = data.tasa_interes;
  const tiempoCobro = data.frecuencia_pago
  const fechaInicio = formatearFechaTexto(data.fecha_solicitud);

  const ultimaFecha = data.fechas_pago[data.fechas_pago.length - 1]
  const fechaFin = formatearFechaTexto(ultimaFecha);

  const senorSenora = data.sexo === 'HOMBRE' ? 'el señor' : 'la señora';
  const deudor_a = data.sexo === 'HOMBRE' ? 'EL DEUDOR' : 'LA DEUDORA';
  

  const equipo = data.articulos.map(e => e.nombre).join(', ');
  const fechaHoy = new Date().toLocaleDateString('es-DO', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });

  doc.text('PAGARÉ NOTARIAL', pageWidth / 2, 40, { align: 'center' });

  // 🧾 Texto legal completo con variables dinámicas
  const texto = `
ACTO NUMERO ________________. En la ciudad de Santiago, Santiago de los Caballeros, República Dominicana, a los ${fechaHoy}, Por ante mí, LIC. EDUARDO RAFAEL POLANCO RAMIREZ, Notario Público Número 5477, para el municipio de Santiago, con estudio Profesional abierto en la calle Buena Vista No. 147, La Gallera, Santiago, encontrándome en mi despacho y en el regular ejercicio de mis funciones, COMPARECIÓ libre y voluntariamente ${senorSenora} ${nombre.toUpperCase()} de nacionalidad dominicana, mayor de edad, estado civil ${estadoCivil}, provisto/a de la cédula de identidad y electoral No. ${cedula}, domiciliado/a y residente en ${direccion}, lugar donde hace formal elección de domicilio para todos los actos y consecuencias legales que se deriven del presente compromiso y ME HA DECLARADO bajo la fe del juramento lo siguiente:PRIMERO: Que reconoce, por medio del presente acto, ser ${deudor_a}, de la Razón Social AETM AA SOLUTIONS COMERCIAL, SRL, compañía comercial, debidamente registrada conforme a las leyes de la República, con domicilio social abierto al público en la Plaza Bella Terra Mall, 3er nivel módulo C-32, ubicada en la Ave. Juan Pablo Duarte, La Esmeralda, de esta ciudad de Santiago, debidamente representada por su Gerente General la Sra. Jenniffer Marleny Gómez Torres, dominicana, mayor de edad, portadora de la cédula de identidad y electoral No. 402-2359496-7, domiciliada y residente en esta ciudad de Santiago, calle 11 no.61, El Invi, por la suma de ${monto}, por concepto de financiamiento de los siguientes artículos: ${equipo}, suma que se compromete a pagar en ${cuotas} cuotas ${tiempoCobro} y consecutivas, a razón de ${valorCuota} cada una, todos los días 15 y 30 de cada mes, iniciando en la fecha ${fechaInicio} y finalizando el ${fechaFin};SEGUNDO: ${deudor_a} reconoce que la suma adeudada generara un interés de ${interes}% por ciento mensual, en caso de no saldar este compromiso al término de cinco (5) meses como se ha pactado, contados a partir del vencimiento del término convenido;TERCERO: ${deudor_a} reconoce y acepta pagar a la Razón Social AETM AA SOLUTIONS COMERCIAL, SRL, la suma equivalente al siete (7%) por ciento del valor de la cuota vencida y dejada de pagar, como penalización por el retraso. Además reconoce que este porcentaje a pagar puede acumularse mes tras mes si no realiza el pago de las cuotas en las fechas convenidas. En caso de pagar la cuota que ha generado esta moratoria y dejar pendiente la mora generada, la misma seguirá vigente;CUARTO: Que ${deudor_a} constituye y acepta que la firma de este acto está basada sobre un pagaré notarial en favor de AETM AA SOLUTIONS COMERCIAL, SRL;QUINTO: El presente pagaré notarial quedará resuelto de pleno derecho y exigible en su totalidad la deuda al beneficio del término, quedando EL ACREEDOR en tiempo hábil para ejecutar el presente pagaré sin previa gestión judicial o extrajudicial alguna;SEXTO: ${deudor_a} y/o DECLARANTE autoriza y faculta al ACREEDOR para que, en caso de incumplimiento de este pagaré notarial, pueda apropiarse de cualquier cantidad de dinero u otros bienes para cubrir el pago del capital y sus accesorios;SÉPTIMO: Las partes han decidido dar su consentimiento para que este pagaré notarial tenga condición de título ejecutorio con la misma fuerza que una sentencia judicial con autoridad irrevocable;OCTAVO: Para lo no estipulado, las partes se remiten al derecho común;NOVENO: ${deudor_a} acepta la operatividad del artículo 545 del Código de Procedimiento Civil de la República Dominicana;DÉCIMO: ${deudor_a} reconoce que si dejare de pagar las obligaciones aquí reconocidas, acepta pagar todos los gastos judiciales y extrajudiciales, incluyendo honorarios legales;DÉCIMO PRIMERO: LAS PARTES avalan como buenos y válidos todos los ordinales anteriores.HECHO Y FIRMADO en original, en mi presencia, acto al cual he dado lectura y ha sido aprobado y firmado por los comparecientes.Monto total: ${monto}
  `;

  const fontSize = 10;
  const lineHeight = fontSize * 1.5;
  const margin = 55;
  const maxWidth = 502;
  let yM = 60;

  doc.setFontSize(fontSize);
  doc.setFont('times', 'normal');

  // Dividimos el texto según los saltos definidos por el usuario
  const bloques = texto.split('[[SALTO]]');

  bloques.forEach(p => {
    const limpio = p.trim();

    doc.text(limpio, margin, yM, {
      maxWidth,
      align: 'justify',
      lineHeightFactor: 1.5
    });

    const altura = doc.getTextDimensions(limpio, { maxWidth }).h;
    yM += altura + lineHeight + 10; // Ajustamos el espacio entre párrafos
  });

const lineY = doc.lastAutoTable ? doc.lastAutoTable.finalY:620
doc.line(margin, lineY, pageWidth - margin, lineY)
doc.line(margin, lineY+15, pageWidth - margin, lineY+15)
doc.line(margin, lineY+30, pageWidth - margin, lineY+30)



  // 🖋️ Firmas
  const y = doc.lastAutoTable ? doc.lastAutoTable.finalY + 60 : 730;

doc.text('_______________________________________', pageWidth / 2, y + 40, { align: 'center' })
doc.text(`${nombre.toUpperCase()}`, pageWidth / 2, y + 55, { align: 'center' })
doc.text('DEUDOR(A)', pageWidth / 2, y + 70, { align: 'center' })

doc.text('_______________________________________', pageWidth / 2, y + 100, { align: 'center' })
doc.text('JENNIFFER MARLENY GOMEZ TORRES', pageWidth / 2, y + 115, { align: 'center' })
doc.text('POR AETM AA SOLUTIONS COMERCIAL SRL', pageWidth / 2, y + 130, { align: 'center' })
doc.text('ACREEDOR', pageWidth / 2, y + 145, { align: 'center' })

doc.text('_______________________________________', pageWidth / 2, y + 175, { align: 'center' })
doc.text('EDUARDO RAFAEL POLANCO RAMIREZ', pageWidth / 2, y + 190, { align: 'center' })
doc.text('NOTARIO', pageWidth / 2, y + 205, { align: 'center' })

  const pdfData = doc.output('datauristring');

  Swal.fire({
    title: 'Pagaré Notarial Generado',
    html: `<embed src="${pdfData}" type="application/pdf" width="100%" height="500px"/>`,
    width: '80%',
    showCloseButton: true,
    confirmButtonText: 'Cerrar'
  });
}

// Utilidades
function formatearRD(valor) {
  return `RD$${parseFloat(valor).toLocaleString('es-DO', {
    minimumFractionDigits: 2
  })}`
}

/************************************************************************/
const fnGenerarSolicitud = async () => {
  const doc = new jsPDF();

  // Obtener datos del componente
  const datosSolicitud = {
    articulos: datoscamposFinanciamientos.value.articulos.map(art => art.nombre).join(', '),
    monto: datoscamposFinanciamientos.value.monto_total,
    inicial: datoscamposFinanciamientos.value.inicial,
    tasa: datoscamposFinanciamientos.value.tasa_interes,
    no_cuotas: datoscamposFinanciamientos.value.no_cuotas,
    seguro: datoscamposFinanciamientos.value.porcentaje_seguro,
    cuotaTotal: datoscamposFinanciamientos.value.valor_cuotas,
    frecuencia: datoscamposFinanciamientos.value.frecuencia_pago,
  };

  const datosSolicitante = {
    nombres: datoscamposFinanciamientos.value.nombre_cliente,
    apellidos: '', // Si no tienes apellidos en el componente, puedes omitirlo o agregarlo
    cedula: datoscamposFinanciamientos.value.cedula_cliente,
    fechaNacimiento: datoscamposFinanciamientos.value.fecha_nacimiento,
    sexo: datoscamposFinanciamientos.value.sexo,
    estadoCivil: datoscamposFinanciamientos.value.estado_civil,
    telefonoResidencial: datoscamposFinanciamientos.value.telefono_cliente,
    telefonoMovil: datoscamposFinanciamientos.value.whatsapp_cliente,
    email: datoscamposFinanciamientos.value.email_cliente,
    nacionalidad: 'Dominicana', // Asumiendo que es dominicana
    provincia: '', // Si no tienes provincia en el componente, puedes omitirlo o agregarlo
    direccion: datoscamposFinanciamientos.value.direccion_cliente,
    referencia: datoscamposFinanciamientos.value.referencia_direccion_cliente,
    nombreEmpresa: datoscamposFinanciamientos.value.empresa_labora,
    tiempoLaborando: datoscamposFinanciamientos.value.tiempo_laborando,
    cargo: datoscamposFinanciamientos.value.ocupcion,
    direccionTrabajo: datoscamposFinanciamientos.value.direccion_cliente, // Asumiendo que es la misma dirección
    telefonoTrabajo: datoscamposFinanciamientos.value.contacto_empresa,
    salario: datoscamposFinanciamientos.value.salario,
    nombreConyugue: datoscamposFinanciamientos.value.nombre_conyugue,
    telefonoConyugue: datoscamposFinanciamientos.value.telefono_conyugue,
  };


  const referenciasFamiliares = [
    { referencia: datoscamposFinanciamientos.value.referencia_familiar1, contacto: datoscamposFinanciamientos.value.contacto_familiar1, vinculo: datoscamposFinanciamientos.value.vinculo_referencia_familiar1 },
    { referencia: datoscamposFinanciamientos.value.referencia_familiar2, contacto: datoscamposFinanciamientos.value.contacto_familiar2, vinculo: datoscamposFinanciamientos.value.vinculo_referencia_familiar2 },
  ];

  const referenciasPersonales = [
    { referencia: datoscamposFinanciamientos.value.referencia_personal1, contacto: datoscamposFinanciamientos.value.contacto_personal1, vinculo: datoscamposFinanciamientos.value.vinculo_contacto_personal1 },
    { referencia: datoscamposFinanciamientos.value.referencia_personal2, contacto: datoscamposFinanciamientos.value.contacto_personal2, vinculo: datoscamposFinanciamientos.value.vinculo_contacto_personal2 },
  ];

  const datosGarante = {
    nombres: datoscamposFinanciamientos.value.nombre_garante,
    apellidos: '', // Si no tienes apellidos en el componente, puedes omitirlo o agregarlo
    cedula: datoscamposFinanciamientos.value.cedula_garante,
    fechaNacimiento: '', // Si no tienes fecha de nacimiento en el componente, puedes omitirlo o agregarlo
    sexo: '', // Si no tienes sexo en el componente, puedes omitirlo o agregarlo
    estadoCivil: '', // Si no tienes estado civil en el componente, puedes omitirlo o agregarlo
    telefonoResidencial: datoscamposFinanciamientos.value.telefono_garante,
    telefonoMovil: datoscamposFinanciamientos.value.whatsapp_garante,
    email: datoscamposFinanciamientos.value.email_garante,
    nacionalidad: 'Dominicana', // Asumiendo que es dominicana
    provincia: '', // Si no tienes provincia en el componente, puedes omitirlo o agregarlo
    direccion: datoscamposFinanciamientos.value.direccion_garante,
    referencia: datoscamposFinanciamientos.value.referencia_direccion_garante,
    nombreEmpresa: '', // Si no tienes nombre de empresa en el componente, puedes omitirlo o agregarlo
    tiempoLaborando: '', // Si no tienes tiempo laborando en el componente, puedes omitirlo o agregarlo
    cargo: '', // Si no tienes cargo en el componente, puedes omitirlo o agregarlo
    direccionTrabajo: '', // Si no tienes dirección de trabajo en el componente, puedes omitirlo o agregarlo
    telefonoTrabajo: '', // Si no tienes teléfono de trabajo en el componente, puedes omitirlo o agregarlo
    salario: '', // Si no tienes salario en el componente, puedes omitirlo o agregarlo
    nombreConyugue: '', // Si no tienes nombre de cónyuge en el componente, puedes omitirlo o agregarlo
    telefonoConyugue: '', // Si no tienes teléfono de cónyuge en el componente, puedes omitirlo o agregarlo
  };

  // Título
  doc.setFontSize(16);
  doc.text('SOLICITUD DE FINANCIAMIENTO', 105, 15, { align: 'center' });

  // Datos de la Solicitud
  doc.setFontSize(12);
  doc.text('DATOS DE LA SOLICITUD', 10, 25);
  autoTable(doc, {
    startY: 30,
    body: [
      ['Artículos:', datosSolicitud.articulos, 'Monto:', datosSolicitud.monto],
      ['Frecuencia:', datosSolicitud.frecuencia, 'No. cuotas:', datosSolicitud.no_cuotas],
      ['Inicial:', datosSolicitud.inicial, 'Seguro:', datosSolicitud.seguro],
      ['Tasa:', datosSolicitud.tasa, 'Cuota total:', datosSolicitud.cuotaTotal],
    ],
    theme: 'grid',
    styles: { fontSize: 10 }
  });

  // Datos del Solicitante
  doc.text('DATOS DEL SOLICITANTE', 10, doc.lastAutoTable.finalY + 10);
  autoTable(doc, {
    startY: doc.lastAutoTable.finalY + 15,
    body: [
      ['Nombres:', datosSolicitante.nombres, 'Apellidos:', datosSolicitante.apellidos],
      ['Cédula:', datosSolicitante.cedula, 'Fecha Nacimiento:', datosSolicitante.fechaNacimiento],
      ['Sexo:', datosSolicitante.sexo, 'Estado Civil:', datosSolicitante.estadoCivil],
      ['Teléfono Residencial:', datosSolicitante.telefonoResidencial, 'Teléfono Móvil:', datosSolicitante.telefonoMovil],
      ['E-mail:', datosSolicitante.email, 'Nacionalidad:', datosSolicitante.nacionalidad],
      ['Provincia:', datosSolicitante.provincia, 'Dirección:', datosSolicitante.direccion],
      ['Referencia:', datosSolicitante.referencia, 'Nombre Empresa:', datosSolicitante.nombreEmpresa],
      ['Tiempo Laborando:', datosSolicitante.tiempoLaborando, 'Cargo:', datosSolicitante.cargo],
      ['Dirección Trabajo:', datosSolicitante.direccionTrabajo, 'Teléfono Trabajo:', datosSolicitante.telefonoTrabajo],
      ['Salario:', datosSolicitante.salario, 'Nombre Cónyuge:', datosSolicitante.nombreConyugue],
      ['Teléfono Cónyuge:', datosSolicitante.telefonoConyugue, ''],
    ],
    theme: 'grid',
    styles: { fontSize: 10 }
  });



  // Referencias Familiares
  doc.text('REFERENCIAS FAMILIARES', 10, doc.lastAutoTable.finalY + 10);
  autoTable(doc, {
    startY: doc.lastAutoTable.finalY + 15,
    body: referenciasFamiliares.map(r => [r.referencia, r.vinculo, r.contacto]),
    head: [['Referencia', 'Vínculo', 'Contacto']],
    theme: 'grid',
    styles: { fontSize: 10 }
  });

  // Referencias Personales
  doc.text('REFERENCIAS PERSONALES', 10, doc.lastAutoTable.finalY + 10);
  autoTable(doc, {
    startY: doc.lastAutoTable.finalY + 15,
    body: referenciasPersonales.map(r => [r.referencia, r.vinculo, r.contacto]),
    head: [['Referencia', 'Vínculo', 'Contacto']],
    theme: 'grid',
    styles: { fontSize: 10 }
  });

  // Datos del Garante
  doc.text('DATOS DEL GARANTE', 10, doc.lastAutoTable.finalY + 10);
  autoTable(doc, {
    startY: doc.lastAutoTable.finalY + 15,
    body: [
      ['Nombres:', datosGarante.nombres, 'Apellidos:', datosGarante.apellidos],
      ['Cédula:', datosGarante.cedula, 'Fecha Nacimiento:', datosGarante.fechaNacimiento],
      ['Sexo:', datosGarante.sexo, 'Estado Civil:', datosGarante.estadoCivil],
      ['Teléfono Residencial:', datosGarante.telefonoResidencial, 'Teléfono Móvil:', datosGarante.telefonoMovil],
      ['E-mail:', datosGarante.email, 'Nacionalidad:', datosGarante.nacionalidad],
      ['Provincia:', datosGarante.provincia, 'Dirección:', datosGarante.direccion],
      ['Referencia:', datosGarante.referencia, 'Nombre Empresa:', datosGarante.nombreEmpresa],
      ['Tiempo Laborando:', datosGarante.tiempoLaborando, 'Cargo:', datosGarante.cargo],
      ['Dirección Trabajo:', datosGarante.direccionTrabajo, 'Teléfono Trabajo:', datosGarante.telefonoTrabajo],
      ['Salario:', datosGarante.salario, 'Nombre Cónyuge:', datosGarante.nombreConyugue],
      ['Teléfono Cónyuge:', datosGarante.telefonoConyugue, ''],
    ],
    theme: 'grid',
    styles: { fontSize: 10 }
  });

  // Firmas
  const finalY = doc.lastAutoTable.finalY + 20;
  doc.text('Firma del Solicitante', 30, finalY);
  doc.text('Firma del Garante', 140, finalY);

  // Mostrar en Swal
  const pdfData = doc.output('datauristring');
  Swal.fire({
    title: 'Solicitud de Financiamiento',
    html: `<embed src="${pdfData}" type="application/pdf" width="100%" height="500px"/>`,
    width: '80%',
    showCloseButton: true,
    confirmButtonText: 'Cerrar'
  });
};

/************************************************************************/
const handleUpload = async (event) => {
  const archivos = event.files;
  archivosParaSubir.value = archivos;
};

// archivo: File, subcarpeta: string (ej: 'productos'), nombreFinal: string
async function subirImagenDespuesDeInsertar(archivo, subcarpeta, nombreFinal) {
  if (!archivo) {
    console.error('❌ No se seleccionaron archivos');
    return;
  }

    const formData = new FormData();
    formData.append('archivo', archivo);
    formData.append('ruta', `imagenes/financiamientos/${datoscamposFinanciamientos.value.imagen}`);
    formData.append('nombre', archivo.name);

    try {
      const response = await fetch(link.value+api.value+'/subirarchivo', {
        method: 'POST',
        headers: {
          Authorization: tokenCifrado.value // ⚠️ No pongas Content-Type manual
        },
        body: formData
      });

      const resultado = await response.json();
      if (resultado.success) {
         toast.add({ severity: 'success', summary: 'Ok', detail: 'imagen Subida con exito', life: 3000 });
        console.log(`✅ Archivo ${archivo.name} subido en:`, resultado.path);
      } else {
        console.error(`❌ Error subiendo ${archivo.name}:`, resultado.message);
      }
    } catch (err) {
      console.error(`❌ Error de red con ${archivo.name}:`, err.message);
    }
  
}

/************************************************************************/
</script>
<template>
<main class="content-wrapper">
  <div class="p-4 md:p-6">
    <div class="flex flex-col gap-6">

      <!-- HEADER -->
      <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 class="text-2xl font-bold text-slate-900 dark:text-slate-100">Nuevo Financiamiento</h1>
          <p class="text-sm text-slate-500 dark:text-slate-400 mt-1">Complete los datos del solicitante y las condiciones del financiamiento</p>
        </div>
        <div class="flex flex-wrap items-center gap-2">
          <Button as="router-link" label="Listado" icon="pi pi-home" severity="secondary" to="/financiamientos" />
          <Button label="Generar Pruebas" icon="pi pi-bolt" severity="info" @click="generarDatosPrueba" />
          <Button label="Multiples" icon="pi pi-database" severity="success" @click="generarMultiplesEntradas" />
        </div>
      </div>

      <!-- SCORE CARD -->
      <div class="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-5">
        <div class="flex flex-col lg:flex-row lg:items-center gap-6">
          <div class="flex-1">
            <span class="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Evaluacion automatica</span>
            <h3 class="text-lg font-bold text-slate-900 dark:text-slate-100 mt-1">Score AA</h3>
          </div>
          <div class="flex items-center gap-4">
            <div class="text-center">
              <div class="text-4xl font-extrabold text-slate-900 dark:text-slate-100">{{ scoreAAVisual.score }}</div>
              <div class="text-xs text-slate-500 dark:text-slate-400">de 100 pts</div>
            </div>
            <div class="flex-1 min-w-[200px]">
              <div class="flex justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
                <span>0</span><span>50</span><span>100</span>
              </div>
              <div class="h-3 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden shadow-inner">
                <div class="h-full rounded-full transition-all duration-300" :style="{ width: `${scoreAAVisual.percentage}%`, background: scoreAAVisual.gradient }"></div>
              </div>
              <div class="flex items-center gap-2 mt-2">
                <span :class="['text-sm font-bold', scoreAAVisual.textClass]">{{ scoreAAVisual.label }}</span>
                <span class="text-xs text-slate-400 dark:text-slate-500">{{ scoreAAVisual.percentage }}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- FORM -->
      <div class="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
        <form id="formularioGenerar" action="" method="">
          <div class="border-b border-slate-200 dark:border-slate-700 px-5 py-3 bg-slate-50 dark:bg-slate-800/50">
            <Tabs v-model:value="value" class="custom-tabs">
              <TabList>
                <Tab value="0"><i class="pi pi-user mr-2"></i>Cliente</Tab>
                <Tab value="1"><i class="pi pi-file-edit mr-2"></i>Solicitud</Tab>
                <Tab value="2"><i class="pi pi-users mr-2"></i>Garante</Tab>
                <Tab value="3"><i class="pi pi-box mr-2"></i>Articulos</Tab>
                <Tab value="4"><i class="pi pi-file mr-2"></i>Documentos</Tab>
                <Tab value="5"><i class="pi pi-chart-line mr-2"></i>Condiciones</Tab>
                <Tab value="6"><i class="pi pi-truck mr-2"></i>Entrega</Tab>
                <Tab value="7"><i class="pi pi-dollar mr-2"></i>Pagos</Tab>
                <Tab value="8"><i class="pi pi-print mr-2"></i>Generar</Tab>
              </TabList>
            </Tabs>
          </div>
        <Tabs v-model:value="value" scrollable>
            <TabList>
                <Tab value="0">Datos del Cliente</Tab>
                <Tab value="1">Datos Solicitud</Tab>
                <Tab value="2">Datos Codeudor</Tab>
                <Tab value="3">Artículos</Tab>
                <Tab value="5">Condiciones</Tab>
                <Tab value="8">Documentos a Generar</Tab>
                <Tab value="4">Documentos Adjuntos</Tab>
                <Tab value="9">Generar Financiamiento</Tab>
            </TabList>
            <TabPanels>
                <TabPanel value="0">
          <div class="grid grid-cols-12 gap-4 mt-4" id="campos">

<!-- Sección de Información del Cliente -->
<div class="col-span-12">
  <div class="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-4 rounded-t-lg flex items-center gap-3">
    <i class="pi pi-user text-2xl"></i>
    <h3 class="text-lg font-bold">Información del Cliente</h3>
  </div>
  <div class="bg-white dark:bg-gray-800 p-6 rounded-b-lg shadow-md border border-gray-200 dark:border-gray-700">
    <div class="grid grid-cols-12 gap-4">
      <div class="col-span-12 sm:col-span-6 md:col-span-4">
        <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2" for="cedula_cliente">
          <i class="pi pi-id-card mr-2 text-blue-500"></i>Cédula del Cliente
        </label>
        <InputGroup>
          <InputMask
            fluid
            :mask="patroncedula"
            v-model="datoscamposFinanciamientos.cedula_cliente"
            placeholder="000-0000000-0"
            @keydown.enter="fnBuscarCedula"
            name="crearcedula_cliente"
            id="cedula_cliente"
            class="border-blue-300 focus:border-blue-500"
          />
          <InputGroupAddon>
            <Button icon="pi pi-search" @click="fnBuscarCedula" severity="info" text v-tooltip.top="'Buscar Cliente'" />
          </InputGroupAddon>
        </InputGroup>
      </div>

      <div class="col-span-12 sm:col-span-6 md:col-span-8">
        <label for="nombre_cliente" class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
          <i class="pi pi-user mr-2 text-blue-500"></i>Nombre Completo
        </label>
        <InputText
          type="text"
          fluid
          v-mayuscula
          v-model="datoscamposFinanciamientos.nombre_cliente"
          placeholder="Nombre completo del cliente"
          name="crearnombre_cliente"
          id="nombre_cliente"
          class="border-blue-300 focus:border-blue-500"
        />
      </div>
      <div class="col-span-12 sm:col-span-6 md:col-span-4">
        <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2" for="telefono_cliente">
          <i class="pi pi-phone mr-2 text-green-500"></i>Teléfono
        </label>
        <InputMask
          fluid
          :mask="patronTelefono"
          v-model="datoscamposFinanciamientos.telefono_cliente"
          placeholder="809-000-0000"
          name="creartelefono_cliente"
          id="telefono_cliente"
          class="border-blue-300 focus:border-blue-500"
        />
      </div>

      <div class="col-span-12 sm:col-span-6 md:col-span-4">
        <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2" for="whatsapp_cliente">
          <i class="pi pi-whatsapp mr-2 text-green-500"></i>WhatsApp
        </label>
        <InputMask
          fluid
          :mask="patronTelefono"
          v-model="datoscamposFinanciamientos.whatsapp_cliente"
          placeholder="809-000-0000"
          name="crearwhatsapp_cliente"
          id="whatsapp_cliente"
          class="border-blue-300 focus:border-blue-500"
        />
      </div>

      <div class="col-span-12 sm:col-span-6 md:col-span-4">
        <label for="email_cliente" class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
          <i class="pi pi-envelope mr-2 text-blue-500"></i>Email
        </label>
        <InputText
          type="email"
          fluid
          v-model="datoscamposFinanciamientos.email_cliente"
          placeholder="correo@ejemplo.com"
          name="crearemail_cliente"
          id="email_cliente"
          class="border-blue-300 focus:border-blue-500"
        />
      </div>

      <div class="col-span-12">
        <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2" for="direccion_cliente">
          <i class="pi pi-map-marker mr-2 text-red-500"></i>Dirección
        </label>
        <Textarea
          id="creardireccion_cliente"
          rows="2"
          fluid
          v-model="datoscamposFinanciamientos.direccion_cliente"
          placeholder="Dirección completa del cliente"
          class="border-blue-300 focus:border-blue-500"
        />
      </div>

      <div class="col-span-12">
        <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2" for="referencia_direccion_cliente">
          <i class="pi pi-map mr-2 text-orange-500"></i>Referencia de Dirección
        </label>
        <Textarea
          id="crearreferencia_direccion_cliente"
          rows="2"
          fluid
          v-model="datoscamposFinanciamientos.referencia_direccion_cliente"
          placeholder="Puntos de referencia (cerca de...)"
          class="border-blue-300 focus:border-blue-500"
        />
      </div>
    </div>
  </div>
</div>

<!-- Sección de Datos Personales -->
<div class="col-span-12 mt-6">
  <div class="bg-gradient-to-r from-purple-500 to-purple-600 text-white p-4 rounded-t-lg flex items-center gap-3">
    <i class="pi pi-calendar text-2xl"></i>
    <h3 class="text-lg font-bold">Datos Personales</h3>
  </div>
  <div class="bg-white dark:bg-gray-800 p-6 rounded-b-lg shadow-md border border-gray-200 dark:border-gray-700">
    <div class="grid grid-cols-12 gap-4">
      <div class="col-span-12 sm:col-span-6 md:col-span-3">
        <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2" for="fecha_nacimiento">
          <i class="pi pi-calendar mr-2 text-purple-500"></i>Fecha de Nacimiento
        </label>
        <InputMask
          v-model="datoscamposFinanciamientos.fecha_nacimiento"
          mask="99/99/9999"
          placeholder="dd/mm/yyyy"
          @change="fnBirthday"
          @keydown.enter="fnBirthday"
          fluid
          class="border-purple-300 focus:border-purple-500"
        />
      </div>

      <div class="col-span-12 sm:col-span-6 md:col-span-3">
        <label for="edad_cliente" class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
          <i class="pi pi-hashtag mr-2 text-purple-500"></i>Edad
        </label>
        <InputText
          type="text"
          fluid
          v-solonumeros
          v-model="datoscamposFinanciamientos.edad_cliente"
          placeholder="Edad"
          name="crearedad_cliente"
          id="edad_cliente"
          class="border-purple-300 focus:border-purple-500"
        />
      </div>

      <div class="col-span-12 sm:col-span-6 md:col-span-3">
        <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2" for="sexo">
          <i class="pi pi-users mr-2 text-purple-500"></i>Sexo
        </label>
        <Dropdown
          v-model="datoscamposFinanciamientos.sexo"
          :options="['HOMBRE','MUJER']"
          placeholder="Seleccione sexo"
          fluid
          class="border-purple-300"
        />
      </div>

      <div class="col-span-12 sm:col-span-6 md:col-span-3">
        <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2" for="estado_civil">
          <i class="pi pi-heart mr-2 text-purple-500"></i>Estado Civil
        </label>
        <Dropdown
          v-model="datoscamposFinanciamientos.estado_civil"
          :options="['SOLTERO/A','CASADO/A','UNION_LIBRE','DIVORCIADO/A']"
          placeholder="Seleccione estado civil"
          fluid
          class="border-purple-300"
        />
      </div>

      <div class="col-span-12 sm:col-span-6 md:col-span-3">
        <label for="cantidad_hijos" class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
          <i class="pi pi-users mr-2 text-purple-500"></i>Cantidad de Hijos
        </label>
        <InputText
          type="text"
          fluid
          v-solonumeros
          v-model="datoscamposFinanciamientos.cantidad_hijos"
          placeholder="0"
          name="crearcantidad_hijos"
          id="cantidad_hijos"
          class="border-purple-300 focus:border-purple-500"
        />
      </div>

      <div class="col-span-12 sm:col-span-6 md:col-span-3">
        <label for="cantidad_dependientes" class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
          <i class="pi pi-users mr-2 text-purple-500"></i>Dependientes
        </label>
        <InputText
          type="text"
          fluid
          v-solonumeros
          v-model="datoscamposFinanciamientos.cantidad_dependientes"
          placeholder="0"
          name="crearcantidad_dependientes"
          id="cantidad_dependientes"
          class="border-purple-300 focus:border-purple-500"
        />
      </div>
    </div>
  </div>
</div>

<!-- Sección de Información del Cónyuge -->
<div class="col-span-12 mt-6">
  <div class="bg-gradient-to-r from-pink-500 to-pink-600 text-white p-4 rounded-t-lg flex items-center gap-3">
    <i class="pi pi-heart-fill text-2xl"></i>
    <h3 class="text-lg font-bold">Información del Cónyuge</h3>
  </div>
  <div class="bg-white dark:bg-gray-800 p-6 rounded-b-lg shadow-md border border-gray-200 dark:border-gray-700">
    <div class="grid grid-cols-12 gap-4">
      <div class="col-span-12 sm:col-span-6 md:col-span-6">
        <label for="nombre_conyugue" class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
          <i class="pi pi-user mr-2 text-pink-500"></i>Nombre Completo
        </label>
        <InputText
          type="text"
          fluid
          v-mayuscula
          v-model="datoscamposFinanciamientos.nombre_conyugue"
          placeholder="Nombre del cónyuge"
          name="crearnombre_conyugue"
          id="nombre_conyugue"
          class="border-pink-300 focus:border-pink-500"
        />
      </div>

      <div class="col-span-12 sm:col-span-6 md:col-span-3">
        <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2" for="telefono_conyugue">
          <i class="pi pi-phone mr-2 text-pink-500"></i>Teléfono
        </label>
        <InputMask
          fluid
          :mask="patronTelefono"
          v-model="datoscamposFinanciamientos.telefono_conyugue"
          placeholder="809-000-0000"
          name="creartelefono_conyugue"
          id="telefono_conyugue"
          class="border-pink-300 focus:border-pink-500"
        />
      </div>

      <div class="col-span-12 sm:col-span-6 md:col-span-3">
        <label for="ocupcion" class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
          <i class="pi pi-briefcase mr-2 text-pink-500"></i>Ocupación
        </label>
        <InputText
          type="text"
          fluid
          v-mayuscula
          v-model="datoscamposFinanciamientos.ocupcion"
          placeholder="Ocupación"
          name="crearocupcion"
          id="ocupcion"
          class="border-pink-300 focus:border-pink-500"
        />
      </div>
    </div>
  </div>
</div>

<!-- Sección de Información Laboral -->
<div class="col-span-12 mt-6">
  <div class="bg-gradient-to-r from-green-500 to-green-600 text-white p-4 rounded-t-lg flex items-center gap-3">
    <i class="pi pi-briefcase text-2xl"></i>
    <h3 class="text-lg font-bold">Información Laboral</h3>
  </div>
  <div class="bg-white dark:bg-gray-800 p-6 rounded-b-lg shadow-md border border-gray-200 dark:border-gray-700">
    <div class="grid grid-cols-12 gap-4">
      <div class="col-span-12 sm:col-span-6 md:col-span-4">
        <label for="empresa_labora" class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
          <i class="pi pi-building mr-2 text-green-500"></i>Empresa donde Labora
        </label>
        <InputText
          type="text"
          fluid
          v-mayuscula
          v-model="datoscamposFinanciamientos.empresa_labora"
          placeholder="Nombre de la empresa"
          name="crearempresa_labora"
          id="empresa_labora"
          class="border-green-300 focus:border-green-500"
        />
      </div>

      <div class="col-span-12 sm:col-span-6 md:col-span-2">
        <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2" for="tipo_empresa">
          <i class="pi pi-tag mr-2 text-green-500"></i>Tipo
        </label>
        <Dropdown
          v-model="datoscamposFinanciamientos.tipo_empresa"
          :options="['PUBLICA','PRIVADA']"
          placeholder="Tipo"
          fluid
          class="border-green-300"
        />
      </div>

      <div class="col-span-12 sm:col-span-6 md:col-span-3">
        <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2" for="contacto_empresa">
          <i class="pi pi-phone mr-2 text-green-500"></i>Teléfono Empresa
        </label>
        <InputMask
          fluid
          :mask="patronTelefono"
          v-model="datoscamposFinanciamientos.contacto_empresa"
          placeholder="809-000-0000"
          name="crearcontacto_empresa"
          id="contacto_empresa"
          class="border-green-300 focus:border-green-500"
        />
      </div>

      <div class="col-span-12 sm:col-span-6 md:col-span-3">
        <label for="tiempo_laborando" class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
          <i class="pi pi-clock mr-2 text-green-500"></i>Tiempo Laborando (Meses)
        </label>
        <InputText
          type="text"
          fluid
          v-solonumeros
          v-model="datoscamposFinanciamientos.tiempo_laborando"
          placeholder="0"
          name="creartiempo_laborando"
          id="tiempo_laborando"
          class="border-green-300 focus:border-green-500"
        />
      </div>

      <div class="col-span-12 sm:col-span-6 md:col-span-3">
        <label for="salario" class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
          <i class="pi pi-dollar mr-2 text-green-500"></i>Salario Mensual
        </label>
        <InputText
          type="text"
          fluid
          v-solonumeros
          v-decimales
          v-numeroFocusinOut
          v-model="datoscamposFinanciamientos.salario"
          placeholder="0.00"
          name="crearsalario"
          id="salario"
          class="border-green-300 focus:border-green-500"
        />
      </div>

      <div class="col-span-12 sm:col-span-6 md:col-span-3">
        <label for="ingresos_adicionales" class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
          <i class="pi pi-money-bill mr-2 text-green-500"></i>Ingresos Adicionales
        </label>
        <InputText
          type="text"
          fluid
          v-solonumeros
          v-decimales
          v-numeroFocusinOut
          v-model="datoscamposFinanciamientos.ingresos_adicionales"
          placeholder="0.00"
          name="crearingresos_adicionales"
          id="ingresos_adicionales"
          class="border-green-300 focus:border-green-500"
        />
      </div>
    </div>
  </div>
</div>

<!-- Sección de Información Patrimonial -->
<div class="col-span-12 mt-6">
  <div class="bg-gradient-to-r from-orange-500 to-orange-600 text-white p-4 rounded-t-lg flex items-center gap-3">
    <i class="pi pi-home text-2xl"></i>
    <h3 class="text-lg font-bold">Información Patrimonial</h3>
  </div>
  <div class="bg-white dark:bg-gray-800 p-6 rounded-b-lg shadow-md border border-gray-200 dark:border-gray-700">
    <div class="grid grid-cols-12 gap-4">
      <div class="col-span-12 sm:col-span-6 md:col-span-4">
        <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2" for="tipo_vivienda">
          <i class="pi pi-home mr-2 text-orange-500"></i>Tipo de Vivienda
        </label>
        <Dropdown
          v-model="datoscamposFinanciamientos.tipo_vivienda"
          :options="['PROPIA','ALQUILADA']"
          placeholder="Seleccione tipo de vivienda"
          fluid
          class="border-orange-300"
        />
      </div>

      <div class="col-span-12 sm:col-span-6 md:col-span-4">
        <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2" for="vehiculo">
          <i class="pi pi-car mr-2 text-orange-500"></i>Vehículo
        </label>
        <Dropdown
          v-model="datoscamposFinanciamientos.vehiculo"
          :options="['NO','PROPIO','OPOSICION']"
          placeholder="Seleccione vehículo"
          fluid
          class="border-orange-300"
        />
      </div>
    </div>
  </div>
</div>

<!-- Sección de Referencias Familiares -->
<div class="col-span-12 mt-6">
  <div class="bg-gradient-to-r from-indigo-500 to-indigo-600 text-white p-4 rounded-t-lg flex items-center gap-3">
    <i class="pi pi-users text-2xl"></i>
    <h3 class="text-lg font-bold">Referencias Familiares</h3>
  </div>
  <div class="bg-white dark:bg-gray-800 p-6 rounded-b-lg shadow-md border border-gray-200 dark:border-gray-700">
    <div class="grid grid-cols-12 gap-4">
      <!-- Referencia Familiar 1 -->
      <div class="col-span-12">
        <h4 class="text-sm font-bold text-indigo-600 dark:text-indigo-400 mb-3">Referencia Familiar #1</h4>
      </div>
      <div class="col-span-12 sm:col-span-6 md:col-span-4">
        <label for="referencia_familiar1" class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
          <i class="pi pi-user mr-2 text-indigo-500"></i>Nombre Completo
        </label>
        <InputText
          type="text"
          fluid
          v-mayuscula
          v-model="datoscamposFinanciamientos.referencia_familiar1"
          placeholder="Nombre completo"
          name="crearreferencia_familiar1"
          id="referencia_familiar1"
          class="border-indigo-300 focus:border-indigo-500"
        />
      </div>

      <div class="col-span-12 sm:col-span-6 md:col-span-4">
        <label for="vinculo_referencia_familiar1" class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
          <i class="pi pi-link mr-2 text-indigo-500"></i>Vínculo
        </label>
        <InputText
          type="text"
          fluid
          v-mayuscula
          v-model="datoscamposFinanciamientos.vinculo_referencia_familiar1"
          placeholder="Ej: Hermano, Padre, etc."
          name="vinculo_referencia_familiar1"
          class="border-indigo-300 focus:border-indigo-500"
        />
      </div>

      <div class="col-span-12 sm:col-span-6 md:col-span-4">
        <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2" for="contacto_familiar1">
          <i class="pi pi-phone mr-2 text-indigo-500"></i>Teléfono
        </label>
        <InputMask
          fluid
          :mask="patronTelefono"
          v-model="datoscamposFinanciamientos.contacto_familiar1"
          placeholder="809-000-0000"
          name="crearcontacto_familiar1"
          id="contacto_familiar1"
          class="border-indigo-300 focus:border-indigo-500"
        />
      </div>

      <!-- Referencia Familiar 2 -->
      <div class="col-span-12 mt-4">
        <h4 class="text-sm font-bold text-indigo-600 dark:text-indigo-400 mb-3">Referencia Familiar #2</h4>
      </div>
      <div class="col-span-12 sm:col-span-6 md:col-span-4">
        <label for="referencia_familiar2" class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
          <i class="pi pi-user mr-2 text-indigo-500"></i>Nombre Completo
        </label>
        <InputText
          type="text"
          fluid
          v-mayuscula
          v-model="datoscamposFinanciamientos.referencia_familiar2"
          placeholder="Nombre completo"
          name="crearreferencia_familiar2"
          id="referencia_familiar2"
          class="border-indigo-300 focus:border-indigo-500"
        />
      </div>

      <div class="col-span-12 sm:col-span-6 md:col-span-4">
        <label for="vinculo_referencia_familiar2" class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
          <i class="pi pi-link mr-2 text-indigo-500"></i>Vínculo
        </label>
        <InputText
          type="text"
          fluid
          v-mayuscula
          v-model="datoscamposFinanciamientos.vinculo_referencia_familiar2"
          placeholder="Ej: Hermano, Padre, etc."
          name="vinculo_referencia_familiar2"
          class="border-indigo-300 focus:border-indigo-500"
        />
      </div>

      <div class="col-span-12 sm:col-span-6 md:col-span-4">
        <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2" for="contacto_familiar2">
          <i class="pi pi-phone mr-2 text-indigo-500"></i>Teléfono
        </label>
        <InputMask
          fluid
          :mask="patronTelefono"
          v-model="datoscamposFinanciamientos.contacto_familiar2"
          placeholder="809-000-0000"
          name="crearcontacto_familiar2"
          id="contacto_familiar2"
          class="border-indigo-300 focus:border-indigo-500"
        />
      </div>
    </div>
  </div>
</div>

<!-- Sección de Referencias Personales -->
<div class="col-span-12 mt-6">
  <div class="bg-gradient-to-r from-cyan-500 to-cyan-600 text-white p-4 rounded-t-lg flex items-center gap-3">
    <i class="pi pi-id-card text-2xl"></i>
    <h3 class="text-lg font-bold">Referencias Personales</h3>
  </div>
  <div class="bg-white dark:bg-gray-800 p-6 rounded-b-lg shadow-md border border-gray-200 dark:border-gray-700">
    <div class="grid grid-cols-12 gap-4">
      <!-- Referencia Personal 1 -->
      <div class="col-span-12">
        <h4 class="text-sm font-bold text-cyan-600 dark:text-cyan-400 mb-3">Referencia Personal #1</h4>
      </div>
      <div class="col-span-12 sm:col-span-6 md:col-span-4">
        <label for="referencia_personal1" class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
          <i class="pi pi-user mr-2 text-cyan-500"></i>Nombre Completo
        </label>
        <InputText
          type="text"
          fluid
          v-mayuscula
          v-model="datoscamposFinanciamientos.referencia_personal1"
          placeholder="Nombre completo"
          name="crearreferencia_personal1"
          id="referencia_personal1"
          class="border-cyan-300 focus:border-cyan-500"
        />
      </div>

      <div class="col-span-12 sm:col-span-6 md:col-span-4">
        <label for="vinculo_contacto_personal1" class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
          <i class="pi pi-link mr-2 text-cyan-500"></i>Vínculo
        </label>
        <InputText
          type="text"
          fluid
          v-mayuscula
          v-model="datoscamposFinanciamientos.vinculo_contacto_personal1"
          placeholder="Ej: Amigo, Compañero, etc."
          name="vinculo_contacto_personal1"
          id="vinculo_contacto_personal1"
          class="border-cyan-300 focus:border-cyan-500"
        />
      </div>

      <div class="col-span-12 sm:col-span-6 md:col-span-4">
        <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2" for="contacto_personal1">
          <i class="pi pi-phone mr-2 text-cyan-500"></i>Teléfono
        </label>
        <InputMask
          fluid
          :mask="patronTelefono"
          v-model="datoscamposFinanciamientos.contacto_personal1"
          placeholder="809-000-0000"
          name="crearcontacto_personal1"
          id="contacto_personal1"
          class="border-cyan-300 focus:border-cyan-500"
        />
      </div>

      <!-- Referencia Personal 2 -->
      <div class="col-span-12 mt-4">
        <h4 class="text-sm font-bold text-cyan-600 dark:text-cyan-400 mb-3">Referencia Personal #2</h4>
      </div>
      <div class="col-span-12 sm:col-span-6 md:col-span-4">
        <label for="referencia_personal2" class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
          <i class="pi pi-user mr-2 text-cyan-500"></i>Nombre Completo
        </label>
        <InputText
          type="text"
          fluid
          v-mayuscula
          v-model="datoscamposFinanciamientos.referencia_personal2"
          placeholder="Nombre completo"
          name="crearreferencia_personal2"
          id="referencia_personal2"
          class="border-cyan-300 focus:border-cyan-500"
        />
      </div>

      <div class="col-span-12 sm:col-span-6 md:col-span-4">
        <label for="vinculo_contacto_personal2" class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
          <i class="pi pi-link mr-2 text-cyan-500"></i>Vínculo
        </label>
        <InputText
          type="text"
          fluid
          v-mayuscula
          v-model="datoscamposFinanciamientos.vinculo_contacto_personal2"
          placeholder="Ej: Amigo, Compañero, etc."
          name="vinculo_contacto_personal2"
          id="vinculo_contacto_personal2"
          class="border-cyan-300 focus:border-cyan-500"
        />
      </div>

      <div class="col-span-12 sm:col-span-6 md:col-span-4">
        <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2" for="contacto_personal2">
          <i class="pi pi-phone mr-2 text-cyan-500"></i>Teléfono
        </label>
        <InputMask
          fluid
          :mask="patronTelefono"
          v-model="datoscamposFinanciamientos.contacto_personal2"
          placeholder="809-000-0000"
          name="crearcontacto_personal2"
          id="contacto_personal2"
          class="border-cyan-300 focus:border-cyan-500"
        />
      </div>
    </div>
  </div>
</div>

<!-- Sección de Redes Sociales -->
<div class="col-span-12 mt-6">
  <div class="bg-gradient-to-r from-violet-500 to-violet-600 text-white p-4 rounded-t-lg flex items-center gap-3">
    <i class="pi pi-share-alt text-2xl"></i>
    <h3 class="text-lg font-bold">Redes Sociales</h3>
  </div>
  <div class="bg-white dark:bg-gray-800 p-6 rounded-b-lg shadow-md border border-gray-200 dark:border-gray-700">
    <div class="grid grid-cols-12 gap-4">
      <div class="col-span-12">
        <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2" for="redes_solciales">
          <i class="pi pi-at mr-2 text-violet-500"></i>Enlaces de Redes Sociales
        </label>
        <Textarea
          id="crearredes_solciales"
          rows="3"
          fluid
          v-model="datoscamposFinanciamientos.redes_solciales"
          placeholder="Facebook, Instagram, LinkedIn, etc."
          class="border-violet-300 focus:border-violet-500"
        />
      </div>
    </div>
  </div>
</div>

</div>
                </TabPanel>
                <TabPanel value="1">
                  <div class="p-4 space-y-6">

<!-- Card 1: Información General de Solicitud -->
<div class="col-span-12">
  <div class="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-4 rounded-t-lg flex items-center gap-3">
    <i class="pi pi-file-edit text-2xl"></i>
    <h3 class="text-lg font-bold">Información General de Solicitud</h3>
  </div>
  <div class="bg-white dark:bg-gray-800 p-6 rounded-b-lg shadow-md border border-gray-200 dark:border-gray-700">
    <div class="grid grid-cols-12 gap-4">

      <div class="col-span-12 md:col-span-3">
        <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2" for="no_financiamiento">
          <i class="pi pi-hashtag mr-2 text-blue-500"></i>No. Financiamiento
        </label>
        <InputText
          type="text"
          fluid
          v-model="datoscamposFinanciamientos.no_financiamiento"
          placeholder="Número de financiamiento"
          name="crearno_financiamiento"
          id="no_financiamiento"
          class="border-blue-300 focus:border-blue-500"
        />
      </div>

      <div class="col-span-12 md:col-span-3">
        <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2" for="fecha_solicitud">
          <i class="pi pi-calendar mr-2 text-blue-500"></i>Fecha de Solicitud
        </label>
        <InputMask
          v-model="datoscamposFinanciamientos.fecha_solicitud"
          fluid
          mask="99/99/9999"
          placeholder="dd/mm/yyyy"
          id="fecha_solicitud"
          class="border-blue-300 focus:border-blue-500"
        />
      </div>

      <div class="col-span-12 md:col-span-3">
        <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2" for="hora_emision">
          <i class="pi pi-clock mr-2 text-blue-500"></i>Hora de Emisión
        </label>
        <InputText
          type="text"
          fluid
          readonly
          v-model="datoscamposFinanciamientos.hora_emision"
          placeholder="Hora"
          name="crearhora_emision"
          id="hora_emision"
          class="border-blue-300 focus:border-blue-500 bg-gray-50 dark:bg-gray-700"
        />
      </div>

      <div class="col-span-12 md:col-span-3">
        <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2" for="agente">
          <i class="pi pi-user-edit mr-2 text-blue-500"></i>Agente
        </label>
        <InputText
          type="text"
          fluid
          v-mayuscula
          v-model="datoscamposFinanciamientos.agente"
          placeholder="Nombre del agente"
          name="crearagente"
          id="agente"
          readonly
          class="border-blue-300 focus:border-blue-500 bg-gray-50 dark:bg-gray-700"
        />
      </div>

    </div>
  </div>
</div>

<!-- Card 2: Estado y Evaluación -->
<div class="col-span-12 mt-6">
  <div class="bg-gradient-to-r from-purple-500 to-purple-600 text-white p-4 rounded-t-lg flex items-center gap-3">
    <i class="pi pi-chart-line text-2xl"></i>
    <h3 class="text-lg font-bold">Estado y Evaluación</h3>
  </div>
  <div class="bg-white dark:bg-gray-800 p-6 rounded-b-lg shadow-md border border-gray-200 dark:border-gray-700">
    <div class="grid grid-cols-12 gap-4">

      <div class="col-span-12 md:col-span-3">
        <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2" for="etapa_solicitud">
          <i class="pi pi-sitemap mr-2 text-purple-500"></i>Etapa de Solicitud
        </label>
        <Dropdown
          v-model="datoscamposFinanciamientos.etapa_solicitud"
          :options="['PROSPECTO','VALIDACION','ANALISIS','FIRMA CLIENTE','ENTREGA','']"
          placeholder="Seleccione la etapa"
          fluid
          id="etapa_solicitud"
          class="border-purple-300 focus:border-purple-500"
        />
      </div>

      <div class="col-span-12 md:col-span-3">
        <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2" for="score_aa">
          <i class="pi pi-star mr-2 text-purple-500"></i>Score AA
        </label>
        <InputText
          type="text"
          fluid
          v-solonumeros
          v-model="datoscamposFinanciamientos.score_aa"
          placeholder="Puntuación"
          name="crearscore_aa"
          id="score_aa"
          class="border-purple-300 focus:border-purple-500"
        />
      </div>

      <div class="col-span-12 md:col-span-3">
        <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2" for="resultados_prospecto">
          <i class="pi pi-check-circle mr-2 text-purple-500"></i>Resultado Prospecto
        </label>
        <Dropdown
          v-model="datoscamposFinanciamientos.resultados_prospecto"
          :options="['PENDIENTE','APROBADO','APLAZADO','DECLINADO']"
          placeholder="Seleccione resultado"
          fluid
          id="resultados_prospecto"
          class="border-purple-300 focus:border-purple-500"
        />
      </div>

      <div class="col-span-12 md:col-span-3">
        <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2" for="resultado_analisis">
          <i class="pi pi-verified mr-2 text-purple-500"></i>Resultado Análisis
        </label>
        <Dropdown
          v-model="datoscamposFinanciamientos.resultado_analisis"
          :options="['PENDIENTE','APROBADO','APLAZADO','DECLINADO']"
          placeholder="Seleccione resultado"
          fluid
          id="resultado_analisis"
          class="border-purple-300 focus:border-purple-500"
        />
      </div>

    </div>
  </div>
</div>

<!-- Card 3: Motivo de Solicitud -->
<div class="col-span-12 mt-6">
  <div class="bg-gradient-to-r from-orange-500 to-orange-600 text-white p-4 rounded-t-lg flex items-center gap-3">
    <i class="pi pi-comment text-2xl"></i>
    <h3 class="text-lg font-bold">Motivo de Solicitud</h3>
  </div>
  <div class="bg-white dark:bg-gray-800 p-6 rounded-b-lg shadow-md border border-gray-200 dark:border-gray-700">
    <div class="grid grid-cols-12 gap-4">

      <div class="col-span-12">
        <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2" for="motivo">
          <i class="pi pi-align-left mr-2 text-orange-500"></i>Descripción del Motivo
        </label>
        <Textarea
          id="crearmotivo"
          rows="4"
          fluid
          v-model="datoscamposFinanciamientos.motivo"
          placeholder="Describa el motivo de la solicitud de financiamiento..."
          class="border-orange-300 focus:border-orange-500"
        />
      </div>

    </div>
  </div>
</div>

                  </div>
                </TabPanel>
<!-- ///////////////////////////////////////////////////////////////////////// --> 
                <TabPanel value="2">
                  <div class="p-4 space-y-6">

<!-- Card 1: Información del Garante -->
<div class="col-span-12">
  <div class="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-4 rounded-t-lg flex items-center gap-3">
    <i class="pi pi-users text-2xl"></i>
    <h3 class="text-lg font-bold">Información del Codeudor</h3>
  </div>
  <div class="bg-white dark:bg-gray-800 p-6 rounded-b-lg shadow-md border border-gray-200 dark:border-gray-700">
    <div class="grid grid-cols-12 gap-4">

      <div class="col-span-12 md:col-span-4">
        <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2" for="cedula_garante">
          <i class="pi pi-id-card mr-2 text-blue-500"></i>Cédula del Codeudor
        </label>
        <InputGroup>
          <InputMask
            fluid
            :mask="patroncedula"
            @keydown.enter="fnBuscarCedulaGarante"
            v-model="datoscamposFinanciamientos.cedula_garante"
            placeholder="000-0000000-0"
            name="crearcedula_garante"
            id="cedula_garante"
            class="border-blue-300 focus:border-blue-500"
          />
          <InputGroupAddon>
            <Button icon="pi pi-search" @click="fnBuscarCedulaGarante" variant="text" />
          </InputGroupAddon>
        </InputGroup>
      </div>

      <div class="col-span-12 md:col-span-8">
        <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2" for="nombre_garante">
          <i class="pi pi-user mr-2 text-blue-500"></i>Nombre Completo
        </label>
        <InputText
          type="text"
          fluid
          v-mayuscula
          v-model="datoscamposFinanciamientos.nombre_garante"
          placeholder="Nombre completo del garante"
          name="crearnombre_garante"
          id="nombre_garante"
          class="border-blue-300 focus:border-blue-500"
        />
      </div>

      <div class="col-span-12 md:col-span-3">
        <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2" for="telefono_garante">
          <i class="pi pi-phone mr-2 text-blue-500"></i>Teléfono
        </label>
        <InputMask
          fluid
          :mask="patronTelefono"
          v-model="datoscamposFinanciamientos.telefono_garante"
          placeholder="809-000-0000"
          name="creartelefono_garante"
          id="telefono_garante"
          class="border-blue-300 focus:border-blue-500"
        />
      </div>

      <div class="col-span-12 md:col-span-3">
        <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2" for="whatsapp_garante">
          <i class="pi pi-whatsapp mr-2 text-blue-500"></i>WhatsApp
        </label>
        <InputMask
          fluid
          :mask="patronTelefono"
          v-model="datoscamposFinanciamientos.whatsapp_garante"
          placeholder="809-000-0000"
          name="crearwhatsapp_garante"
          id="whatsapp_garante"
          class="border-blue-300 focus:border-blue-500"
        />
      </div>

      <div class="col-span-12 md:col-span-3">
        <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2" for="email_garante">
          <i class="pi pi-envelope mr-2 text-blue-500"></i>Email
        </label>
        <InputText
          type="text"
          fluid
          v-model="datoscamposFinanciamientos.email_garante"
          placeholder="correo@ejemplo.com"
          name="crearemail_garante"
          id="email_garante"
          class="border-blue-300 focus:border-blue-500"
        />
      </div>

      <div class="col-span-12 md:col-span-3">
        <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2" for="vinculo_deudor">
          <i class="pi pi-link mr-2 text-blue-500"></i>Vínculo con Deudor
        </label>
        <Dropdown
          v-model="datoscamposFinanciamientos.vinculo_deudor"
          :options="['ESPOSO(A)','HERMANO(A)','MADRE','PADRE','FAMILIAR','AMIGO']"
          placeholder="Seleccione el vínculo"
          fluid
          class="border-blue-300 focus:border-blue-500"
        />
      </div>

    </div>
  </div>
</div>

<!-- Card 2: Dirección del Garante -->
<div class="col-span-12 mt-6">
  <div class="bg-gradient-to-r from-green-500 to-green-600 text-white p-4 rounded-t-lg flex items-center gap-3">
    <i class="pi pi-map-marker text-2xl"></i>
    <h3 class="text-lg font-bold">Dirección del Codeudor</h3>
  </div>
  <div class="bg-white dark:bg-gray-800 p-6 rounded-b-lg shadow-md border border-gray-200 dark:border-gray-700">
    <div class="grid grid-cols-12 gap-4">

      <div class="col-span-12">
        <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2" for="direccion_garante">
          <i class="pi pi-home mr-2 text-green-500"></i>Dirección Completa
        </label>
        <Textarea
          id="creardireccion_garante"
          rows="3"
          fluid
          v-model="datoscamposFinanciamientos.direccion_garante"
          placeholder="Calle, número, sector, ciudad..."
          class="border-green-300 focus:border-green-500"
        />
      </div>

      <div class="col-span-12">
        <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2" for="referencia_direccion_garante">
          <i class="pi pi-compass mr-2 text-green-500"></i>Referencia de Dirección
        </label>
        <Textarea
          id="crearreferencia_direccion_garante"
          rows="3"
          fluid
          v-model="datoscamposFinanciamientos.referencia_direccion_garante"
          placeholder="Puntos de referencia cercanos..."
          class="border-green-300 focus:border-green-500"
        />
      </div>

    </div>
  </div>
</div>

                  </div>
                </TabPanel>
<!-- ///////////////////////////////////////////////////////////////////////// -->
                <TabPanel value="3">
                     <div class="grid grid-cols-12 gap-4 mt-4 text-blue-600" id="campos4">
                  <div class="form-group col-span-12 col-span-2 mb-5 mt-5">
                    <Button label="Agregar Productos" fluid  @click="visibleProductos = true" />
                  </div>

                     <div class="col-span-12 sm:col-span-12 md:col-span-12 lg:col-span-12 xl:col-span-12 2xl:col-span-12">
                      <label  class="block text-sm font-medium text-gray-700 dark:text-gray-400" for="articulos">   ARTICULOS
                      </label>

                      <TablaJSON 
                      :productos="datoscamposFinanciamientos.articulos" 
                      :onEditar="editarProducto"
                      :onEliminar="eliminarProducto"
                      :onClickProducto="handleClickConfig"
                      :indice="true"
                      :botones="true"
                      tableId="tablaConfig"
                       />
<!-- 
                    <div class="table-responsive p-3 rounded mb-2 overflow-x-auto">
                      <div  v-html="generarTablaFromStringJSON(datoscamposFinanciamientos.articulos,true,false,null,null,null,null,null,null,null,null,fnClickProducto)" class="border p-3 rounded mb-2 overflow-x-auto">
                      </div>
                    </div> -->


                </div>
                </div>
                </TabPanel>
<!-- ///////////////////////////////////////////////////////////////////////// -->
                <TabPanel value="4">
<div class="grid grid-cols-12 gap-4 mt-4 text-blue-600" id="campos8">
<div class="col-span-12 sm:col-span-12 md:col-span-12 lg:col-span-12 xl:col-span-12 2xl:col-span-12">
                    <label  class="block text-sm font-medium text-gray-700 dark:text-gray-400" for="comentario">COMENTARIO</label>
                   <Textarea id="crearcomentario" rows="3" fluid class="form-textarea w-full "  v-model="datoscamposFinanciamientos.comentario" placeholder="Comentario" />
                </div>
<div class="form-group col-span-12" >
<label for="imagenAgregarDatos">IMAGEN</label>
<!--     <FileUploader 
       ref="fileUploaderRef"
      :uploadUrl="uploadUrl" 
      :additionalData="additionalData" 
      :autoUpload="false" 
      :onSuccess="handleSuccess"
      :onError="handleError"
      :showPreview="true"
      class="undefined"
      undefined
    />  -->

<FileUpload
  :customUpload="true"
  :auto="false"
  chooseLabel="Seleccionar Imagenes"
  @uploader="handleUpload"
  :multiple="true" 
/>


</div>

<div class="form-group col-span-6" hidden>
<label for="created_atAgregarDatos">CREATED_AT</label>
<input type="input" v-model="datoscamposFinanciamientos.created_at" name="created_at"  class="form-control " id="created_atAgregarDatos"  placeholder="created_at" maxlength="">
</div>
<div class="form-group col-span-6" hidden>
<label for="updated_atAgregarDatos">UPDATED_AT</label>
<input type="input" v-model="datoscamposFinanciamientos.updated_at" name="updated_at"  class="form-control " id="updated_atAgregarDatos"  placeholder="updated_at" maxlength="">
</div>

<div class="form-group col-span-12" hidden>
<label for="usuarioAgregarDatos">USUARIO</label>
<input type="input" v-model="datoscamposFinanciamientos.usuario" name="usuario"  class="form-control " id="usuarioAgregarDatos"  placeholder="usuario" maxlength="250">
</div>

  </div>
                </TabPanel>
<!-- ///////////////////////////////////////////////////////////////////////// -->
                <TabPanel value="5">
                  <div class="p-4 space-y-6">

<!-- Card 1: Montos Iniciales -->
<div class="col-span-12">
  <div class="bg-gradient-to-r from-green-500 to-green-600 text-white p-4 rounded-t-lg flex items-center gap-3">
    <i class="pi pi-money-bill text-2xl"></i>
    <h3 class="text-lg font-bold">Montos Iniciales</h3>
  </div>
  <div class="bg-white dark:bg-gray-800 p-6 rounded-b-lg shadow-md border border-gray-200 dark:border-gray-700">
    <div class="grid grid-cols-12 gap-4">

      <div class="col-span-12 md:col-span-4">
        <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2" for="inicial">
          <i class="pi pi-wallet mr-2 text-green-500"></i>Inicial
        </label>
        <InputText
          type="text"
          fluid
          v-solonumeros
          v-decimales
          v-numeroFocusinOut
          v-model="datoscamposFinanciamientos.inicial"
          placeholder="Monto inicial"
          name="crearinicial"
          id="inicial"
          readonly
          class="border-green-300 focus:border-green-500 bg-gray-50 dark:bg-gray-700"
        />
      </div>

      <div class="col-span-12 md:col-span-4">
        <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2" for="capital">
          <i class="pi pi-dollar mr-2 text-green-500"></i>Capital
        </label>
        <InputText
          type="text"
          fluid
          v-solonumeros
          v-decimales
          v-numeroFocusinOut
          v-model="datoscamposFinanciamientos.capital"
          placeholder="Capital"
          name="crearcapital"
          id="capital"
          readonly
          class="border-green-300 focus:border-green-500 bg-gray-50 dark:bg-gray-700"
        />
      </div>

      <div class="col-span-12 md:col-span-4">
        <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2" for="total_capital">
          <i class="pi pi-exclamation-circle mr-2 text-green-500"></i>Pendiente
        </label>
        <InputText
          type="text"
          fluid
          v-solonumeros
          v-decimales
          v-numeroFocusinOut
          v-model="datoscamposFinanciamientos.total_capital"
          placeholder="Total pendiente"
          name="creartotal_capital"
          id="total_capital"
          readonly
          class="border-green-300 focus:border-green-500 bg-gray-50 dark:bg-gray-700"
        />
      </div>

    </div>
  </div>
</div>

<!-- Card 2: Configuración de Intereses -->
<div class="col-span-12 mt-6">
  <div class="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-4 rounded-t-lg flex items-center gap-3">
    <i class="pi pi-percentage text-2xl"></i>
    <h3 class="text-lg font-bold">Configuración de Intereses y Cuotas</h3>
  </div>
  <div class="bg-white dark:bg-gray-800 p-6 rounded-b-lg shadow-md border border-gray-200 dark:border-gray-700">
    <div class="grid grid-cols-12 gap-4">

      <div class="col-span-12 md:col-span-3">
        <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2" for="tasa_interes">
          <i class="pi pi-percentage mr-2 text-blue-500"></i>Tasa de Interés (%)
        </label>
        <InputText
          type="text"
          fluid
          v-solonumeros
          v-decimales
          v-numeroFocusinOut
          v-model="datoscamposFinanciamientos.tasa_interes"
          placeholder="Porcentaje"
          name="creartasa_interes"
          id="tasa_interes"
          class="border-blue-300 focus:border-blue-500"
        />
      </div>

      <div class="col-span-12 md:col-span-3">
        <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2" for="interes_total">
          <i class="pi pi-chart-bar mr-2 text-blue-500"></i>Interés Total
        </label>
        <InputText
          type="text"
          fluid
          v-solonumeros
          v-decimales
          v-numeroFocusinOut
          v-model="datoscamposFinanciamientos.interes_total"
          placeholder="Interés calculado"
          name="crearinteres_total"
          id="interes_total"
          readonly
          class="border-blue-300 focus:border-blue-500 bg-gray-50 dark:bg-gray-700"
        />
      </div>

      <div class="col-span-12 md:col-span-3">
        <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2" for="no_cuotas">
          <i class="pi pi-hashtag mr-2 text-blue-500"></i>No. de Cuotas
        </label>
        <InputText
          type="text"
          fluid
          v-solonumeros
          v-decimales
          v-numeroFocusinOut
          v-model="datoscamposFinanciamientos.no_cuotas"
          placeholder="Cantidad de cuotas"
          name="crearno_cuotas"
          id="no_cuotas"
          class="border-blue-300 focus:border-blue-500"
        />
      </div>

      <div class="col-span-12 md:col-span-3">
        <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2" for="valor_cuotas">
          <i class="pi pi-credit-card mr-2 text-blue-500"></i>Valor de Cuota
        </label>
        <InputText
          type="text"
          fluid
          v-solonumeros
          v-decimales
          v-numeroFocusinOut
          v-model="datoscamposFinanciamientos.valor_cuotas"
          placeholder="Valor por cuota"
          name="crearvalor_cuotas"
          id="valor_cuotas"
          readonly
          class="border-blue-300 focus:border-blue-500 bg-gray-50 dark:bg-gray-700"
        />
      </div>

    </div>
  </div>
</div>

<!-- Card 3: Costos Adicionales -->
<div class="col-span-12 mt-6">
  <div class="bg-gradient-to-r from-orange-500 to-orange-600 text-white p-4 rounded-t-lg flex items-center gap-3">
    <i class="pi pi-tag text-2xl"></i>
    <h3 class="text-lg font-bold">Costos Adicionales</h3>
  </div>
  <div class="bg-white dark:bg-gray-800 p-6 rounded-b-lg shadow-md border border-gray-200 dark:border-gray-700">
    <div class="grid grid-cols-12 gap-4">

      <div class="col-span-12 md:col-span-4">
        <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2" for="gastos_legales">
          <i class="pi pi-briefcase mr-2 text-orange-500"></i>Gastos Legales
        </label>
        <InputText
          type="text"
          fluid
          v-solonumeros
          v-decimales
          v-numeroFocusinOut
          v-model="datoscamposFinanciamientos.gastos_legales"
          placeholder="Gastos legales"
          name="creargastos_legales"
          id="gastos_legales"
          class="border-orange-300 focus:border-orange-500"
        />
      </div>

      <div class="col-span-12 md:col-span-4">
        <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2" for="porcentaje_seguro">
          <i class="pi pi-shield mr-2 text-orange-500"></i>Seguro (%)
        </label>
        <InputText
          type="text"
          fluid
          v-solonumeros
          v-decimales
          v-numeroFocusinOut
          v-model="datoscamposFinanciamientos.porcentaje_seguro"
          placeholder="Porcentaje de seguro"
          name="crearporcentaje_seguro"
          id="porcentaje_seguro"
          class="border-orange-300 focus:border-orange-500"
        />
      </div>

      <div class="col-span-12 md:col-span-4">
        <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2" for="total_seguro">
          <i class="pi pi-shield mr-2 text-orange-500"></i>Total Seguro
        </label>
        <InputText
          type="text"
          fluid
          v-solonumeros
          v-decimales
          v-numeroFocusinOut
          v-model="datoscamposFinanciamientos.total_seguro"
          placeholder="Total del seguro"
          name="creartotal_seguro"
          id="total_seguro"
          readonly
          class="border-orange-300 focus:border-orange-500 bg-gray-50 dark:bg-gray-700"
        />
      </div>

    </div>
  </div>
</div>

<!-- Card 4: Resumen Financiero -->
<div class="col-span-12 mt-6">
  <div class="bg-gradient-to-r from-purple-500 to-purple-600 text-white p-4 rounded-t-lg flex items-center gap-3">
    <i class="pi pi-calculator text-2xl"></i>
    <h3 class="text-lg font-bold">Resumen Financiero</h3>
  </div>
  <div class="bg-white dark:bg-gray-800 p-6 rounded-b-lg shadow-md border border-gray-200 dark:border-gray-700">
    <div class="grid grid-cols-12 gap-4">

      <div class="col-span-12 md:col-span-4">
        <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2" for="monto_total">
          <i class="pi pi-dollar mr-2 text-purple-500"></i>Monto Total
        </label>
        <InputText
          type="text"
          fluid
          v-solonumeros
          v-decimales
          v-numeroFocusinOut
          v-model="datoscamposFinanciamientos.monto_total"
          placeholder="Monto total"
          name="crearmonto_total"
          id="monto_total"
          readonly
          class="border-purple-300 focus:border-purple-500 bg-gray-50 dark:bg-gray-700"
        />
      </div>

      <div class="col-span-12 md:col-span-4">
        <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2" for="total_abonado">
          <i class="pi pi-check-circle mr-2 text-purple-500"></i>Total Abonado
        </label>
        <InputText
          type="text"
          fluid
          v-solonumeros
          v-decimales
          v-numeroFocusinOut
          v-model="datoscamposFinanciamientos.total_abonado"
          placeholder="Total abonado"
          name="creartotal_abonado"
          id="total_abonado"
          readonly
          class="border-purple-300 focus:border-purple-500 bg-gray-50 dark:bg-gray-700"
        />
      </div>

      <div class="col-span-12 md:col-span-4">
        <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2" for="total_pendiente">
          <i class="pi pi-exclamation-triangle mr-2 text-purple-500"></i>Total Pendiente
        </label>
        <InputText
          type="text"
          fluid
          v-solonumeros
          v-decimales
          v-numeroFocusinOut
          v-model="datoscamposFinanciamientos.total_pendiente"
          placeholder="Total pendiente"
          name="creartotal_pendiente"
          id="total_pendiente"
          readonly
          class="border-purple-300 focus:border-purple-500 bg-gray-50 dark:bg-gray-700"
        />
      </div>

    </div>
  </div>
</div>

<!-- Card 5: Calendario de Pagos -->
<div class="col-span-12 mt-6">
  <div class="bg-gradient-to-r from-cyan-500 to-cyan-600 text-white p-4 rounded-t-lg flex items-center gap-3">
    <i class="pi pi-calendar text-2xl"></i>
    <h3 class="text-lg font-bold">Calendario de Pagos</h3>
  </div>
  <div class="bg-white dark:bg-gray-800 p-6 rounded-b-lg shadow-md border border-gray-200 dark:border-gray-700">
    <div class="grid grid-cols-12 gap-4">

      <div class="col-span-12 md:col-span-3">
        <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2" for="frecuencia_pago">
          <i class="pi pi-sync mr-2 text-cyan-500"></i>Frecuencia de Pago
        </label>
        <Dropdown
          v-model="datoscamposFinanciamientos.frecuencia_pago"
          :options="['SEMANAL','LOS 15','LOS 30','LOS 15 Y 30','QUINCENAL','MENSUAL']"
          placeholder="Seleccione frecuencia"
          fluid
          id="frecuencia_pago"
          class="border-cyan-300 focus:border-cyan-500"
        />
      </div>

      <div class="col-span-12 md:col-span-3">
        <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2" for="proximo_pago">
          <i class="pi pi-calendar-plus mr-2 text-cyan-500"></i>Próximo Pago
        </label>
        <flat-pickr
          v-model="datoscamposFinanciamientos.proximo_pago"
          @change="fnCambiaPrimeraFecha"
          class="form-input w-full p-inputtext p-component p-filled p-inputtext-fluid border-cyan-300 focus:border-cyan-500"
          :config="basic"
        />
      </div>

      <div class="col-span-12 md:col-span-3">
        <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2" for="prorrateo">
          <i class="pi pi-chart-pie mr-2 text-cyan-500"></i>Prorrateo
        </label>
        <InputText
          type="text"
          fluid
          v-decimales
          v-numeroFocusinOut
          v-solonumeros
          v-model="datoscamposFinanciamientos.prorrateo"
          placeholder="Prorrateo"
          name="crearprorrateo"
          id="prorrateo"
          class="border-cyan-300 focus:border-cyan-500"
        />
      </div>

      <div class="col-span-12 md:col-span-3">
        <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2" for="proxima_cuota">
          <i class="pi pi-forward mr-2 text-cyan-500"></i>Próxima Cuota
        </label>
        <InputText
          type="text"
          fluid
          v-decimales
          v-numeroFocusinOut
          v-solonumeros
          v-model="datoscamposFinanciamientos.proxima_cuota"
          placeholder="Valor próxima cuota"
          name="crearproxima_cuota"
          id="proxima_cuota"
          class="border-cyan-300 focus:border-cyan-500"
        />
      </div>

      <div class="col-span-12">
        <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2" for="fechas_pago">
          <i class="pi pi-calendar-times mr-2 text-cyan-500"></i>Fechas de Pago Programadas
        </label>
        <vue3-tags-input
          :tags="datoscamposFinanciamientos.fechas_pago"
          placeholder="Nueva Fecha"
          :read-only="true"
          :remove-tag="() => false"
          @update:tags="updateTags"
          @on-click-tag="handleClickTag"
          class="border-cyan-300 focus:border-cyan-500"
        />
      </div>

    </div>
  </div>
</div>

                  </div>
                </TabPanel>
<!-- ///////////////////////////////////////////////////////////////////////// -->
                <TabPanel value="8">
                  <div class="p-6">

                    <div class="text-center mb-6">
                      <h2 class="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-2">
                        <i class="pi pi-file-pdf text-red-500 mr-2"></i>
                        Documentos del Financiamiento
                      </h2>
                      <p class="text-gray-600 dark:text-gray-400">Genere los documentos legales y administrativos necesarios</p>
                    </div>

                    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

                      <!-- Pagaré -->
                      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden border-t-4 border-blue-500">
                        <div class="p-6">
                          <div class="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-blue-100 dark:bg-blue-900 rounded-full">
                            <i class="pi pi-file-edit text-3xl text-blue-600 dark:text-blue-300"></i>
                          </div>
                          <h3 class="text-lg font-bold text-center text-gray-800 dark:text-gray-200 mb-2">Pagaré</h3>
                          <p class="text-sm text-center text-gray-600 dark:text-gray-400 mb-4">Documento de compromiso de pago</p>
                          <Button
                            label="Generar PDF"
                            @click="generarPagarePDF"
                            severity="info"
                            fluid
                            icon="pi pi-download"
                            class="mt-2"
                          />
                        </div>
                      </div>

                      <!-- Contrato -->
                      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden border-t-4 border-purple-500">
                        <div class="p-6">
                          <div class="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-purple-100 dark:bg-purple-900 rounded-full">
                            <i class="pi pi-book text-3xl text-purple-600 dark:text-purple-300"></i>
                          </div>
                          <h3 class="text-lg font-bold text-center text-gray-800 dark:text-gray-200 mb-2">Contrato</h3>
                          <p class="text-sm text-center text-gray-600 dark:text-gray-400 mb-4">Contrato de financiamiento</p>
                          <Button
                            label="Generar PDF"
                            severity="help"
                            fluid
                            icon="pi pi-download"
                            class="mt-2"
                          />
                        </div>
                      </div>

                      <!-- Solicitud -->
                      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden border-t-4 border-green-500">
                        <div class="p-6">
                          <div class="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-green-100 dark:bg-green-900 rounded-full">
                            <i class="pi pi-file-check text-3xl text-green-600 dark:text-green-300"></i>
                          </div>
                          <h3 class="text-lg font-bold text-center text-gray-800 dark:text-gray-200 mb-2">Solicitud</h3>
                          <p class="text-sm text-center text-gray-600 dark:text-gray-400 mb-4">Formulario de solicitud</p>
                          <Button
                            label="Generar PDF"
                            @click="fnGenerarSolicitud"
                            severity="success"
                            fluid
                            icon="pi pi-download"
                            class="mt-2"
                          />
                        </div>
                      </div>

                      <!-- Autorización -->
                      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden border-t-4 border-orange-500">
                        <div class="p-6">
                          <div class="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-orange-100 dark:bg-orange-900 rounded-full">
                            <i class="pi pi-verified text-3xl text-orange-600 dark:text-orange-300"></i>
                          </div>
                          <h3 class="text-lg font-bold text-center text-gray-800 dark:text-gray-200 mb-2">Autorización</h3>
                          <p class="text-sm text-center text-gray-600 dark:text-gray-400 mb-4">Documento de autorización</p>
                          <Button
                            label="Generar PDF"
                            @click="generarAutorizacionPDF"
                            severity="warning"
                            fluid
                            icon="pi pi-download"
                            class="mt-2"
                          />
                        </div>
                      </div>

                      <!-- Seguro -->
                      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden border-t-4 border-cyan-500">
                        <div class="p-6">
                          <div class="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-cyan-100 dark:bg-cyan-900 rounded-full">
                            <i class="pi pi-shield text-3xl text-cyan-600 dark:text-cyan-300"></i>
                          </div>
                          <h3 class="text-lg font-bold text-center text-gray-800 dark:text-gray-200 mb-2">Seguro</h3>
                          <p class="text-sm text-center text-gray-600 dark:text-gray-400 mb-4">Póliza de seguro</p>
                          <Button
                            label="Generar PDF"
                            severity="secondary"
                            fluid
                            icon="pi pi-download"
                            class="mt-2"
                          />
                        </div>
                      </div>

                      <!-- Tabla de Amortización -->
                      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden border-t-4 border-indigo-500">
                        <div class="p-6">
                          <div class="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-indigo-100 dark:bg-indigo-900 rounded-full">
                            <i class="pi pi-table text-3xl text-indigo-600 dark:text-indigo-300"></i>
                          </div>
                          <h3 class="text-lg font-bold text-center text-gray-800 dark:text-gray-200 mb-2">Tabla de Amortización</h3>
                          <p class="text-sm text-center text-gray-600 dark:text-gray-400 mb-4">Detalle de cuotas y pagos</p>
                          <Button
                            label="Generar PDF"
                            @click="generarPlanPagoPDF"
                            severity="contrast"
                            fluid
                            icon="pi pi-download"
                            class="mt-2"
                          />
                        </div>
                      </div>

                    </div>

                  </div>
                </TabPanel>
                <TabPanel value="9">
                  <div class="grid grid-cols-12 gap-4 mt-4 text-blue-600" id="campos8">
<div class="form-group col-span-12 mb-5 mt-5">
  <Button label="Enviar Datos" fluid  @click="enviarDatos" />
</div>

  </div>
                </TabPanel>
            </TabPanels>
        </Tabs>
        </form>
      </div>
    </div>
    <Toast />
  </div>
</main>

<Dialog v-model:visible="visibleProductos" position="top" modal :style="{ width: '75rem' }" header="Productos">
  <template #header>
    <div class="inline-flex align-items-center justify-content-center gap-2">
      <span class="font-bold white-space-nowrap">Productos</span>
    </div>
  </template>
  <fieldset class="border p-3 rounded mb-2">
    <legend class="float-none w-auto px-2">Productos</legend>
    <div class="grid grid-cols-1 gap-4">
<div>
  <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 10px;">
    <input
      v-model="searchQuery"
      placeholder="Buscar productos..."
      class="p-inputtext p-component"
      style="flex: 1;"
    />
    <button
      @click="searchQuery = ''"
      class="p-button p-component"
      style="height: 2.5rem;"
    >
      Limpiar
    </button>
  </div>

  <ContextMenu ref="cm" :model="menuModel" @hide="selectedProduct = null" />

  <DataTable
    :value="filteredProducts"
    scrollable
    scrollHeight="600px"
    @rowSelect="onRowSelect"
    selectionMode="single"
    dataKey="id"
    paginator
    :rows="10"
    :rowsPerPageOptions="[5, 10, 20, 50]"
    tableStyle="min-width: 50rem"
  >
    <Column
      sortable
      v-for="col of columns"
      :key="col.field"
      :field="col.field"
      :header="col.header"
    />
  </DataTable>
</div>
    </div>
  </fieldset>
  <template #footer>
      <Button label="Cerrar" outlined severity="secondary" @click="visibleProductos = false" autofocus />
  </template>
</Dialog>
</template>
<style scoped>
.score-card {
  --score-surface: linear-gradient(145deg, #ffffff 0%, #f8fafc 100%);
  background: var(--score-surface);
  border: 1px solid rgba(148, 163, 184, 0.22);
  border-radius: 22px;
  padding: 1.25rem;
  box-shadow: 0 20px 40px rgba(15, 23, 42, 0.08);
}

.score-card__header,
.score-card__body,
.score-card__footer,
.score-card__scale {
  display: flex;
  align-items: center;
}

.score-card__header,
.score-card__footer {
  justify-content: space-between;
  gap: 1rem;
}

.score-card__body {
  gap: 1.5rem;
  margin-top: 1rem;
}

.score-card__eyebrow {
  display: inline-block;
  font-size: 0.72rem;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: #64748b;
  margin-bottom: 0.25rem;
}

.score-card__title {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 700;
  color: #0f172a;
}

.score-card__badge {
  border-radius: 999px;
  padding: 0.45rem 0.85rem;
  font-size: 0.82rem;
  font-weight: 700;
  background: rgba(148, 163, 184, 0.14);
}

.score-card__value-wrap {
  min-width: 120px;
  text-align: center;
  padding: 1rem 1.1rem;
  border-radius: 18px;
  background: linear-gradient(180deg, rgba(241, 245, 249, 0.92) 0%, rgba(226, 232, 240, 0.65) 100%);
}

.score-card__value {
  font-size: 2.4rem;
  line-height: 1;
  font-weight: 800;
  color: #0f172a;
}

.score-card__meta,
.score-card__hint,
.score-card__scale {
  color: #64748b;
}

.score-card__meta {
  margin-top: 0.35rem;
  font-size: 0.82rem;
}

.score-card__progress-block {
  flex: 1;
}

.score-card__scale {
  justify-content: space-between;
  margin-bottom: 0.55rem;
  font-size: 0.8rem;
}

.score-card__track {
  position: relative;
  overflow: hidden;
  width: 100%;
  height: 16px;
  border-radius: 999px;
  background:
    linear-gradient(90deg, rgba(226, 232, 240, 0.95) 0%, rgba(241, 245, 249, 0.95) 100%);
  box-shadow: inset 0 1px 2px rgba(15, 23, 42, 0.12);
}

.score-card__fill {
  position: relative;
  height: 100%;
  border-radius: inherit;
  transition: width 0.35s ease, box-shadow 0.35s ease;
}

.score-card__fill::after {
  content: '';
  position: absolute;
  inset: 2px;
  border-radius: inherit;
  background: linear-gradient(90deg, rgba(255, 255, 255, 0.28), rgba(255, 255, 255, 0));
}

.score-card__footer {
  margin-top: 0.75rem;
}

.score-card__percent {
  font-size: 0.95rem;
  font-weight: 700;
  color: #0f172a;
}

.score-card__hint {
  font-size: 0.84rem;
}

.score-success {
  color: #166534;
  background: rgba(34, 197, 94, 0.12);
}

.score-warning {
  color: #b45309;
  background: rgba(245, 158, 11, 0.15);
}

.score-risk {
  color: #b91c1c;
  background: rgba(239, 68, 68, 0.12);
}

@media (max-width: 768px) {
  .score-card__body,
  .score-card__header,
  .score-card__footer {
    flex-direction: column;
    align-items: flex-start;
  }

  .score-card__value-wrap,
  .score-card__progress-block {
    width: 100%;
  }

  .score-card__value-wrap {
    text-align: left;
  }
}
</style>
