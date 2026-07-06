<script setup>
import { ref, onMounted, watchEffect, watch } from 'vue';
import JsBarcode from 'jsbarcode';
import Swal from 'sweetalert2';
import { useToast } from 'primevue/usetoast';
import Awesomplete from '@/components/Awesomplete.vue';
import { peticionesFetch, encryptarPassword, envioElectron,nfecha, lasMayusculas, enviarDatosPorPost,
peticionesFetchOffline,
arrayToObjetoFromTablaOffline,
arrayToObjetoFromTabla } from '@/funciones/funciones.js';
import { useDatosEmpresa } from '@/stores';
const toast = useToast();

const datosEmpresa = useDatosEmpresa();
const link = ref(null);
const api = ref(null);
const token = ref(null);
const patronTelefono = ref(null);
const linkImpresora = ref(null);
const patroncedula = ref(null);
const tokenCifrado = ref(null);

const position = ref('top');
const openPosition = (pos) => {
    position.value = pos;
    visible.value = true;
};

/*****************************************************/
const incluirCabecera = ref(true);
const incluirTexto = ref(true);
const incluirCodigo = ref(true);
const incluirOtro = ref(false);
const incluirPrecio = ref(true);
const orientacion = ref('vertical');
const qr = ref(false);
/*****************************************************/

const cabecera = ref('');

const datoscamposEmpaques = ref({});
const visible = ref(false);
const visiblecrear = ref(false);
const value = ref(null);
const id = ref(null);
const datoscampos = ref({});
const data = ref([]);
const EmpaquesEditar = ref(null);
const dataImpresoras = ref([]);
const dataSelected = ref({});
const impresoraselected = ref('GUARDADO');
const dataProductos = ref([]);
const listaBuscador = ref([]);
const productoBuscado = ref({});
const productoSelected = ref(null);
const precio = ref('0.00');
/*****************************************************/
// Nuevas variables para selección múltiple
const productosSeleccionados = ref([]);
const vistaActual = ref('simple'); // 'simple' o 'multiple'
const perfilImpresora = ref('custom'); // 'zebra', 'datamax', 'brother', 'custom'
/*****************************************************/
// Perfiles de impresoras predefinidos
const perfilesImpresoras = ref({
  zebra: {
    nombre: 'Zebra',
    labelwidth: 203,
    labelheight: 152,
    barwidth: 2,
    barheight: 50,
    fontsize: 10,
    margen_izq: 5,
    margen_der: 5,
    margen_sup: 5,
    margen_inf: 5,
  },
  datamax: {
    nombre: 'Datamax',
    labelwidth: 203,
    labelheight: 203,
    barwidth: 2,
    barheight: 60,
    fontsize: 12,
    margen_izq: 10,
    margen_der: 10,
    margen_sup: 10,
    margen_inf: 10,
  },
  brother: {
    nombre: 'Brother',
    labelwidth: 190,
    labelheight: 140,
    barwidth: 1,
    barheight: 40,
    fontsize: 9,
    margen_izq: 3,
    margen_der: 3,
    margen_sup: 3,
    margen_inf: 3,
  },
  tsc: {
    nombre: 'TSC',
    labelwidth: 200,
    labelheight: 150,
    barwidth: 2,
    barheight: 50,
    fontsize: 10,
    margen_izq: 5,
    margen_der: 5,
    margen_sup: 5,
    margen_inf: 5,
  },
  custom: {
    nombre: 'Personalizado',
  }
});

async function limpiarCamposCrear() {
    datoscamposEmpaques.value = {};
    await campos();
}

watchEffect(() => {
  if (visiblecrear.value) {
    lasMayusculas();
  }
});

const fetchDataBARCODE = async () => {
    const response = await peticionesFetchOffline('getDataAsArray', 'barcode');
    const jsonData = response;
    dataImpresoras.value = jsonData;
    if (jsonData.length > 0) {
        dataSelected.value = jsonData[0];
        dataSelected.value.cantidad = 1;
    }
};

const fetchAndSetupDataProductos = async () => {
    const response = await peticionesFetchOffline('getDataAsArray', 'productos');
    const jsonData = response;
    dataProductos.value = jsonData;

    let arraybuscador = [];
    response.forEach((index) => {
        const keys = Object.keys(index);
        const values = Object.values(index);
        for (let i = 0; i < keys.length; i++) {
            if (keys[i] === 'codigo' || keys[i] === 'codigo_barra' || keys[i] === 'nombre') {
                arraybuscador.push(values[i]);
            }
        }
    });
    listaBuscador.value = arraybuscador;
};

const datosEmpresaLocal = ref({})

onMounted(async () => {
    const datosJSON = await envioElectron('datosarchivo');
    link.value = datosJSON.VITE_LINKURL;
    api.value = datosJSON.VITE_LINK_API;
    token.value = datosJSON.VITE_TOKEN;
    patronTelefono.value = datosJSON.VITE_PATRON_TELEFONO;
    linkImpresora.value = datosJSON.VITE_IMPRESORA_LOCAL;

    tokenCifrado.value = await encryptarPassword(token.value, 10);

    cabecera.value = datosEmpresa.empresa.nombre;
    await fetchAndSetupDataProductos();
    await fetchDataBARCODE();

    datosEmpresaLocal.value = JSON.parse(window.localStorage.getItem('empresa'))
});

const handleSelectComplete = async (selected) => {
    const producto = dataProductos.value.find((prod) =>
        prod.nombre === selected.value ||
        prod.codigo === selected.value ||
        prod.codigoBarra === selected.value
    );

    if (producto) {
        productoSelected.value = producto;
        productoBuscado.value = { ...producto, imei: '', nStock: '0', cantidad: 1 };
        dataSelected.value.texto = producto.nombre;
        dataSelected.value.codigo = producto.codigo_barra;
        precio.value = parseFloat(producto.precio_venta).toFixed(2);
    } else {
        toast.add({ severity: 'error', summary: 'Error', detail: 'No se Encuentra el Producto', life: 3000 });
    }
};

const fnSeleccionarImpresora = async () => {
    if (impresoraselected.value === 'GUARDADO') {
        await fetchDataBARCODE();
    }
};

const dialogVisible = ref(false);
const listaImpresoras = ref([]);

const buscarImpresoras = async () => {
    dialogVisible.value = true;

    try {
        if (window.electron) {
            const impresorasDisponibles = await window.electron.ipcRenderer.invoke('get-printers');
            listaImpresoras.value = impresorasDisponibles || [];
        } else {
            toast.add({
                severity: 'error',
                summary: 'Error',
                detail: 'Esta función solo está disponible en la aplicación de escritorio',
                life: 3000
            });
            dialogVisible.value = false;
        }
    } catch (error) {
        console.error('Error buscando impresoras:', error);
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: 'No se pudo obtener la lista de impresoras.',
            life: 3000
        });
        dialogVisible.value = false;
    }
};

const seleccionarImpresora = (nombre) => {
    dataSelected.value.impresora = nombre;
    toast.add({
        severity: 'success',
        summary: 'Impresora seleccionada',
        detail: `Impresora "${nombre}" registrada.`,
        life: 2000
    });
    dialogVisible.value = false;
};

const fnGuardar = async () => {
    const campos = await arrayToObjetoFromTablaOffline('barcode');
    const url = link.value + api.value + "/actualizarcampos/barcode";

    if (!campos) {
        console.error("Datos incompletos, no se puede actualizar.");
        return;
    }

    if (campos.hasOwnProperty('created_at')) {
        campos.updated_at = nfecha('timestamp');
    }

    if (dataSelected.value) {
        for (const key in campos) {
            if (campos.hasOwnProperty(key) && dataSelected.value.hasOwnProperty(key)) {
                campos[key] = dataSelected.value[key];
            }
        }
    }

    campos['id'] = dataSelected.value.id

    const envioDatos = await peticionesFetchOffline('updateData', 'barcode', JSON.stringify(campos));
    if (envioDatos[0] == 'ok') {
        toast.add({ severity: 'success', summary: 'Éxito', detail: 'Datos Actualizados', life: 3000 });
    } else {
        toast.add({ severity: 'error', summary: 'Error', detail: 'Fallo al actualizar los datos.', life: 3000 });
    }
}

const printBarcode = () => {
    const barcodeCanvas = document.getElementById('barcodeCanvas');
    const content = {
        barcodeData: {
            barcodetype: dataSelected.value.barcodetype,
            barwidth: parseInt(dataSelected.value.barwidth),
            barheight: parseInt(dataSelected.value.barheight),
            labelwidth: parseInt(dataSelected.value.labelwidth),
            labelheight: parseInt(dataSelected.value.labelheight),
            fontsize: parseInt(dataSelected.value.fontsize),
            margen_izq: parseInt(dataSelected.value.margen_izq),
            margen_der: parseInt(dataSelected.value.margen_der),
            margen_sup: parseInt(dataSelected.value.margen_sup),
            margen_inf: parseInt(dataSelected.value.margen_inf),
            codigo: dataSelected.value.codigo,
        },
        labelWidth: parseInt(dataSelected.value.labelwidth),
        labelHeight: parseInt(dataSelected.value.labelheight),
        margins: {
            top: parseInt(dataSelected.value.margen_sup),
            right: parseInt(dataSelected.value.margen_der),
            bottom: parseInt(dataSelected.value.margen_inf),
            left: parseInt(dataSelected.value.margen_izq)
        },
        incluirCabecera: incluirCabecera.value,
        incluirTexto: incluirTexto.value,
        incluirCodigo: incluirCodigo.value,
        incluirOtro: incluirOtro.value,
        incluirPrecio: incluirPrecio.value,
        code: dataSelected.value.codigo,
        imagen: datosEmpresaLocal.value.logoprinter,
        text: dataSelected.value.texto,
        precio: parseFloat(precio.value).toFixed(2),
        width: parseInt(dataSelected.value.barwidth),
        height: parseInt(dataSelected.value.barheight),
        fontSize: parseInt(dataSelected.value.fontsize),
        cantidad: parseInt(dataSelected.value.cantidad),
        tipo: dataSelected.value.barcodetype,
        headerText: cabecera.value,
        printerName: dataSelected.value.impresora,
        orientacion: orientacion.value,
        qr: qr.value,
    };
    window.electron.ipcRenderer.invoke('print-barcode', content);
};

/***********************************************************/
watch(incluirOtro, (newVal) => {
  if (newVal) {
    incluirCabecera.value = false;
  }
});

watch(incluirCabecera, (newVal) => {
  if (newVal) {
    incluirOtro.value = false;
  }
});
/***********************************************************/
const toggleOrientation = () => {
  orientacion.value = orientacion.value === 'horizontal' ? 'vertical' : 'horizontal';
};

/***********************************************************/
const fnAwesomplete = () => {

}
/***********************************************************/
const generateBarcode = async () => {
    const { value: barcodeType } = await Swal.fire({
        title: 'Selecciona el tipo de código de barras',
        showCancelButton: true,
        confirmButtonText: 'SKU',
        cancelButtonText: 'EAN128',
        showDenyButton: true,
        denyButtonText: 'Cancelar',
    });

    if (barcodeType === true) {
        const productName = dataSelected.value.texto;
        const skuCode = generateSKUCode(productName);
        dataSelected.value.codigo = skuCode;
    } else if (barcodeType === false) {
        dataSelected.value.codigo = generarCodigoUnico();
    }
};

const generateSKUCode = (productName) => {
  const palabras = productName.split(' ');
  const codigoBase = palabras.map(palabra => palabra.substring(0, 2).toUpperCase()).join('');
  const identificadorUnico = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  const code = `${codigoBase}-${identificadorUnico}`;
  return code;
};
/***********************************************************/
const fnQR = (cod) => {
  qr.value = cod.target.checked

  const impresionpagina = `${link.value}/vista/imprimirdatosproducto?id=${productoSelected.value.id}`;

  if (qr.value) {
    incluirCabecera.value = false
    incluirTexto.value = false
    incluirCodigo.value = false
    incluirOtro.value = false
    incluirPrecio.value = false
    dataSelected.value.codigo = impresionpagina;
  } else {
    incluirCabecera.value = true
    incluirTexto.value = true
    incluirCodigo.value = true
    incluirOtro.value = false
    incluirPrecio.value = true
    dataSelected.value.codigo = productoSelected.value.codigo_barra;
  }
}
/***********************************************************/
// Función para cambiar perfil de impresora
const cambiarPerfilImpresora = (perfil) => {
  perfilImpresora.value = perfil;
  if (perfil !== 'custom') {
    const config = perfilesImpresoras.value[perfil];
    dataSelected.value.labelwidth = config.labelwidth;
    dataSelected.value.labelheight = config.labelheight;
    dataSelected.value.barwidth = config.barwidth;
    dataSelected.value.barheight = config.barheight;
    dataSelected.value.fontsize = config.fontsize;
    dataSelected.value.margen_izq = config.margen_izq;
    dataSelected.value.margen_der = config.margen_der;
    dataSelected.value.margen_sup = config.margen_sup;
    dataSelected.value.margen_inf = config.margen_inf;

    toast.add({
      severity: 'success',
      summary: 'Perfil aplicado',
      detail: `Configuración de ${config.nombre} cargada`,
      life: 2000
    });
  }
};
/***********************************************************/
// Función para agregar producto a la selección múltiple
const agregarProductoMultiple = () => {
  if (!productoSelected.value) {
    toast.add({ severity: 'warn', summary: 'Advertencia', detail: 'Selecciona un producto primero', life: 2000 });
    return;
  }

  const yaExiste = productosSeleccionados.value.find(p => p.id === productoSelected.value.id);
  if (yaExiste) {
    toast.add({ severity: 'warn', summary: 'Advertencia', detail: 'Este producto ya está en la lista', life: 2000 });
    return;
  }

  productosSeleccionados.value.push({
    ...productoSelected.value,
    cantidad: 1,
    precio: parseFloat(productoSelected.value.precio_venta || 0).toFixed(2)
  });

  toast.add({ severity: 'success', summary: 'Producto agregado', detail: productoSelected.value.nombre, life: 2000 });
};
/***********************************************************/
// Función para eliminar producto de la selección múltiple
const eliminarProductoMultiple = (index) => {
  productosSeleccionados.value.splice(index, 1);
  toast.add({ severity: 'info', summary: 'Producto eliminado', life: 2000 });
};
/***********************************************************/
// Función para limpiar selección múltiple
const limpiarSeleccionMultiple = () => {
  productosSeleccionados.value = [];
  toast.add({ severity: 'info', summary: 'Lista limpiada', life: 2000 });
};
/***********************************************************/
// Función para imprimir múltiples productos
const imprimirMultiplesProductos = async () => {
  if (productosSeleccionados.value.length === 0) {
    toast.add({ severity: 'warn', summary: 'Advertencia', detail: 'No hay productos seleccionados', life: 2500 });
    return;
  }

  const totalEtiquetas = productosSeleccionados.value.reduce((sum, p) => sum + parseInt(p.cantidad || 1), 0);

  const resultado = await Swal.fire({
    title: '¿Imprimir etiquetas?',
    html: `Se imprimirán <b>${totalEtiquetas}</b> etiquetas de <b>${productosSeleccionados.value.length}</b> productos diferentes.`,
    icon: 'question',
    showCancelButton: true,
    confirmButtonColor: '#3085d6',
    cancelButtonColor: '#d33',
    confirmButtonText: 'Sí, imprimir',
    cancelButtonText: 'Cancelar'
  });

  if (!resultado.isConfirmed) {
    return;
  }

  for (const producto of productosSeleccionados.value) {
    const content = {
      barcodeData: {
        barcodetype: dataSelected.value.barcodetype,
        barwidth: parseInt(dataSelected.value.barwidth),
        barheight: parseInt(dataSelected.value.barheight),
        labelwidth: parseInt(dataSelected.value.labelwidth),
        labelheight: parseInt(dataSelected.value.labelheight),
        fontsize: parseInt(dataSelected.value.fontsize),
        margen_izq: parseInt(dataSelected.value.margen_izq),
        margen_der: parseInt(dataSelected.value.margen_der),
        margen_sup: parseInt(dataSelected.value.margen_sup),
        margen_inf: parseInt(dataSelected.value.margen_inf),
        codigo: producto.codigo_barra,
      },
      labelWidth: parseInt(dataSelected.value.labelwidth),
      labelHeight: parseInt(dataSelected.value.labelheight),
      margins: {
        top: parseInt(dataSelected.value.margen_sup),
        right: parseInt(dataSelected.value.margen_der),
        bottom: parseInt(dataSelected.value.margen_inf),
        left: parseInt(dataSelected.value.margen_izq)
      },
      incluirCabecera: incluirCabecera.value,
      incluirTexto: incluirTexto.value,
      incluirCodigo: incluirCodigo.value,
      incluirOtro: incluirOtro.value,
      incluirPrecio: incluirPrecio.value,
      code: producto.codigo_barra,
      imagen: datosEmpresaLocal.value.logoprinter,
      text: producto.nombre,
      precio: parseFloat(producto.precio || producto.precio_venta || 0).toFixed(2),
      width: parseInt(dataSelected.value.barwidth),
      height: parseInt(dataSelected.value.barheight),
      fontSize: parseInt(dataSelected.value.fontsize),
      cantidad: parseInt(producto.cantidad || 1),
      tipo: dataSelected.value.barcodetype,
      headerText: cabecera.value,
      printerName: dataSelected.value.impresora,
      orientacion: orientacion.value,
      qr: false,
    };

    await window.electron.ipcRenderer.invoke('print-barcode', content);
  }

  toast.add({
    severity: 'success',
    summary: 'Impresión completada',
    detail: `${totalEtiquetas} etiquetas enviadas a impresión`,
    life: 3000
  });
};
/***********************************************************/

</script>

<template>
  <main class="barcode-wrapper">
    <div class="container-barcode mx-auto px-4 py-6">

      <!-- Header Section -->
      <div class="header-section mb-6">
        <div class="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div class="flex items-center gap-4">
            <div class="header-icon">
              <i class="pi pi-qrcode"></i>
            </div>
            <div>
              <h1 class="text-3xl font-bold text-gray-800">Generador de Códigos</h1>
              <p class="text-gray-600">Crea e imprime códigos de barras y QR profesionales</p>
            </div>
          </div>

          <div class="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
            <!-- Selector de vista -->
            <SelectButton
              v-model="vistaActual"
              :options="[
                { label: 'Simple', value: 'simple', icon: 'pi pi-file' },
                { label: 'Múltiple', value: 'multiple', icon: 'pi pi-list' }
              ]"
              optionLabel="label"
              optionValue="value"
              class="vista-selector"
            >
              <template #option="slotProps">
                <i :class="slotProps.option.icon + ' mr-2'"></i>
                <span>{{ slotProps.option.label }}</span>
              </template>
            </SelectButton>

            <!-- Selector de perfil de impresora -->
            <Dropdown
              v-model="perfilImpresora"
              @change="cambiarPerfilImpresora(perfilImpresora)"
              :options="[
                { label: 'Zebra', value: 'zebra' },
                { label: 'Datamax', value: 'datamax' },
                { label: 'Brother', value: 'brother' },
                { label: 'TSC', value: 'tsc' },
                { label: 'Personalizado', value: 'custom' }
              ]"
              optionLabel="label"
              optionValue="value"
              placeholder="Perfil Impresora"
              class="perfil-dropdown"
            >
              <template #value="slotProps">
                <div v-if="slotProps.value" class="flex items-center gap-2">
                  <i class="pi pi-print"></i>
                  <span>{{ perfilesImpresoras[slotProps.value]?.nombre || 'Perfil' }}</span>
                </div>
                <span v-else>{{ slotProps.placeholder }}</span>
              </template>
            </Dropdown>
          </div>
        </div>
      </div>

      <!-- Options Toggle Section -->
      <Card class="options-card mb-6">
        <template #header>
          <div class="card-header-custom">
            <i class="pi pi-sliders-h text-xl mr-3"></i>
            <h2 class="text-xl font-bold">Opciones de Visualización</h2>
          </div>
        </template>

        <template #content>
          <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">

            <div class="toggle-option">
              <div class="toggle-label">
                <i class="pi pi-bookmark mr-2 text-blue-500"></i>
                Cabecera
              </div>
              <InputSwitch v-model="incluirCabecera" inputId="switch-cabecera" />
            </div>

            <div class="toggle-option">
              <div class="toggle-label">
                <i class="pi pi-align-left mr-2 text-purple-500"></i>
                Texto
              </div>
              <InputSwitch v-model="incluirTexto" inputId="switch-texto" />
            </div>

            <div class="toggle-option">
              <div class="toggle-label">
                <i class="pi pi-hashtag mr-2 text-green-500"></i>
                Código
              </div>
              <InputSwitch v-model="incluirCodigo" inputId="switch-codigo" />
            </div>

            <div class="toggle-option">
              <div class="toggle-label">
                <i class="pi pi-image mr-2 text-orange-500"></i>
                Imagen
              </div>
              <InputSwitch v-model="incluirOtro" inputId="switch-otro" />
            </div>

            <div class="toggle-option">
              <div class="toggle-label">
                <i class="pi pi-dollar mr-2 text-emerald-500"></i>
                Precio
              </div>
              <InputSwitch v-model="incluirPrecio" inputId="switch-precio" />
            </div>

            <div class="toggle-option">
              <div class="toggle-label">
                <i class="pi pi-arrows-h mr-2 text-indigo-500"></i>
                {{ orientacion === 'vertical' ? 'Vertical' : 'Horizontal' }}
              </div>
              <InputSwitch
                :checked="orientacion === 'vertical'"
                @change="toggleOrientation"
                inputId="switch-orientacion"
              />
            </div>

            <div class="toggle-option">
              <div class="toggle-label">
                <i class="pi pi-qrcode mr-2 text-pink-500"></i>
                QR Code
              </div>
              <InputSwitch
                :checked="qr"
                @change="fnQR"
                inputId="switch-qr"
              />
            </div>

          </div>
        </template>
      </Card>

      <!-- Main Configuration Section -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">

        <!-- Left Panel - Product & Printer -->
        <div class="lg:col-span-4">
          <Card class="config-card h-full">
            <template #header>
              <div class="card-header-custom">
                <i class="pi pi-cog text-xl mr-3"></i>
                <h2 class="text-xl font-bold">Configuración</h2>
              </div>
            </template>

            <template #content>
              <div class="space-y-4">

                <div class="form-field-modern">
                  <label class="field-label-modern">
                    <i class="pi pi-box mr-2"></i>
                    Producto
                  </label>
                  <awesomplete
                    class="awesomplete-barcode"
                    v-model="productoBuscado.nombre"
                    @change="fnAwesomplete"
                    @selectComplete="handleSelectComplete"
                    :list="listaBuscador">
                  </awesomplete>
                </div>

                <div class="form-field-modern">
                  <label class="field-label-modern">
                    <i class="pi pi-print mr-2"></i>
                    Impresora
                  </label>
                  <div class="flex items-center gap-2">
                    <InputText
                      v-model="dataSelected.impresora"
                      class="modern-input-barcode flex-1"
                      placeholder="Selecciona impresora"
                    />
                    <Button
                      label="Buscar"
                      icon="pi pi-search"
                      @click="buscarImpresoras"
                      severity="info"
                      class="search-printer-btn-barcode"
                    />
                  </div>
                </div>

                <div class="grid grid-cols-2 gap-4">
                  <div class="form-field-modern">
                    <label class="field-label-modern">
                      <i class="pi pi-arrows-h mr-2"></i>
                      Ancho Label
                    </label>
                    <InputNumber
                      v-model="dataSelected.labelwidth"
                      class="modern-number-barcode w-full"
                      :min="1"
                      showButtons
                    />
                  </div>

                  <div class="form-field-modern">
                    <label class="field-label-modern">
                      <i class="pi pi-arrows-v mr-2"></i>
                      Alto Label
                    </label>
                    <InputNumber
                      v-model="dataSelected.labelheight"
                      class="modern-number-barcode w-full"
                      :min="1"
                      showButtons
                    />
                  </div>
                </div>

                <div class="form-field-modern">
                  <label class="field-label-modern">
                    <i class="pi pi-font mr-2"></i>
                    Tamaño de Fuente
                  </label>
                  <InputNumber
                    v-model="dataSelected.fontsize"
                    class="modern-number-barcode w-full"
                    :min="8"
                    :max="72"
                    showButtons
                  />
                </div>

              </div>
            </template>
          </Card>
        </div>

        <!-- Center Panel - Barcode Settings -->
        <div class="lg:col-span-4">
          <Card class="config-card h-full">
            <template #header>
              <div class="card-header-custom">
                <i class="pi pi-barcode text-xl mr-3"></i>
                <h2 class="text-xl font-bold">Código de Barras</h2>
              </div>
            </template>

            <template #content>
              <div class="space-y-4">

                <div class="form-field-modern">
                  <label class="field-label-modern">
                    <i class="pi pi-list mr-2"></i>
                    Tipo de Código
                  </label>
                  <Dropdown
                    v-model="dataSelected.barcodetype"
                    :options="['CODE128', 'CODE128A', 'CODE128B', 'CODE39', 'CODE39E', 'CODE93', 'EAN8', 'EAN13']"
                    class="modern-dropdown-barcode w-full"
                    placeholder="Selecciona tipo"
                  />
                </div>

                <div class="grid grid-cols-2 gap-4">
                  <div class="form-field-modern">
                    <label class="field-label-modern">
                      <i class="pi pi-arrows-h mr-2"></i>
                      Ancho Barras
                    </label>
                    <InputText
                      v-model="dataSelected.barwidth"
                      class="modern-number-barcode w-full"
                      :min="1"
                      showButtons
                    />
                  </div>

                  <div class="form-field-modern">
                    <label class="field-label-modern">
                      <i class="pi pi-arrows-v mr-2"></i>
                      Alto Barras
                    </label>
                    <InputNumber
                      v-model="dataSelected.barheight"
                      class="modern-number-barcode w-full"
                      :min="10"
                      showButtons
                    />
                  </div>
                </div>

                <div class="form-field-modern">
                  <label class="field-label-modern">
                    <i class="pi pi-bookmark mr-2"></i>
                    Cabecera
                  </label>
                  <InputText
                    v-model="cabecera"
                    class="modern-input-barcode w-full"
                    placeholder="Texto de cabecera"
                  />
                </div>

                <div class="form-field-modern">
                  <label class="field-label-modern">
                    <i class="pi pi-align-left mr-2"></i>
                    Texto
                  </label>
                  <InputText
                    v-model="dataSelected.texto"
                    class="modern-input-barcode w-full"
                    placeholder="Texto del producto"
                  />
                </div>

                <div class="form-field-modern">
                  <label class="field-label-modern">
                    <i class="pi pi-hashtag mr-2"></i>
                    Código
                  </label>
                  <InputText
                    v-model="dataSelected.codigo"
                    class="modern-input-barcode w-full"
                    placeholder="Código de barras"
                  />
                </div>

              </div>
            </template>
          </Card>
        </div>

        <!-- Right Panel - Margins & Actions -->
        <div class="lg:col-span-4">
          <Card class="config-card h-full">
            <template #header>
              <div class="card-header-custom">
                <i class="pi pi-th-large text-xl mr-3"></i>
                <h2 class="text-xl font-bold">Márgenes y Acciones</h2>
              </div>
            </template>

            <template #content>
              <div class="space-y-4">

                <div class="form-field-modern">
                  <label class="field-label-modern">
                    <i class="pi pi-dollar mr-2"></i>
                    Precio
                  </label>
                  <InputText
                    v-model="precio"
                    v-solonumeros
                    class="modern-input-barcode w-full price-input"
                    placeholder="0.00"
                  />
                </div>

                <div class="margins-grid">
                  <div class="form-field-modern">
                    <label class="field-label-modern-small">
                      <i class="pi pi-arrow-left text-xs mr-1"></i>
                      Izq.
                    </label>
                    <InputNumber
                      v-model="dataSelected.margen_izq"
                      class="modern-number-small w-full"
                      :min="0"
                      showButtons
                      buttonLayout="horizontal"
                    />
                  </div>

                  <div class="form-field-modern">
                    <label class="field-label-modern-small">
                      <i class="pi pi-arrow-up text-xs mr-1"></i>
                      Sup.
                    </label>
                    <InputNumber
                      v-model="dataSelected.margen_sup"
                      class="modern-number-small w-full"
                      :min="0"
                      fluid
                      showButtons
                      buttonLayout="horizontal"
                    />
                  </div>

                  <div class="form-field-modern">
                    <label class="field-label-modern-small">
                      <i class="pi pi-arrow-right text-xs mr-1"></i>
                      Der.
                    </label>
                    <InputNumber
                      v-model="dataSelected.margen_der"
                      class="modern-number-small w-full"
                      :min="0"
                      showButtons
                      fluid
                      buttonLayout="horizontal"
                    />
                  </div>

                  <div class="form-field-modern">
                    <label class="field-label-modern-small">
                      <i class="pi pi-arrow-down text-xs mr-1"></i>
                      Inf.
                    </label>
                    <InputNumber
                      v-model="dataSelected.margen_inf"
                      class="modern-number-small w-full"
                      :min="0"
                      fluid
                      showButtons
                      buttonLayout="horizontal"
                    />
                  </div>
                </div>

                <div class="form-field-modern">
                  <label class="field-label-modern">
                    <i class="pi pi-copy mr-2"></i>
                    Cantidad
                  </label>
                  <InputNumber
                    v-model="dataSelected.cantidad"
                    class="modern-number-barcode w-full"
                    :min="1"
                    fluid
                    :max="1000"
                    showButtons
                  />
                </div>

                <div class="action-buttons-barcode">
                  <Button
                    label="Generar"
                    icon="pi pi-refresh"
                    @click="generateBarcode"
                    severity="info"
                    class="action-btn-barcode"
                  />
                  <Button
                    label="Imprimir"
                    icon="pi pi-print"
                    @click="printBarcode"
                    severity="success"
                    class="action-btn-barcode"
                  />
                  <Button
                    label="Guardar"
                    icon="pi pi-save"
                    @click="fnGuardar"
                    severity="primary"
                    class="action-btn-barcode"
                  />
                </div>

              </div>
            </template>
          </Card>
        </div>

      </div>

      <!-- Vista Múltiple - Tabla de Productos Seleccionados -->
      <Card v-if="vistaActual === 'multiple'" class="multiple-products-card mt-6">
        <template #header>
          <div class="card-header-custom">
            <i class="pi pi-shopping-cart text-xl mr-3"></i>
            <h2 class="text-xl font-bold">Productos Seleccionados</h2>
            <div class="ml-auto flex gap-2">
              <Button
                label="Agregar Producto"
                icon="pi pi-plus"
                @click="agregarProductoMultiple"
                severity="success"
                size="small"
              />
              <Button
                label="Limpiar Lista"
                icon="pi pi-trash"
                @click="limpiarSeleccionMultiple"
                severity="danger"
                size="small"
                outlined
                :disabled="productosSeleccionados.length === 0"
              />
            </div>
          </div>
        </template>

        <template #content>
          <div v-if="productosSeleccionados.length === 0" class="text-center py-8">
            <i class="pi pi-inbox text-6xl text-gray-300 mb-4"></i>
            <p class="text-gray-500 text-lg">No hay productos seleccionados</p>
            <p class="text-gray-400 text-sm">Busca un producto arriba y haz clic en "Agregar Producto"</p>
          </div>

          <DataTable
            v-else
            :value="productosSeleccionados"
            class="products-table"
            stripedRows
            responsiveLayout="scroll"
          >
            <Column header="#" style="width: 60px">
              <template #body="slotProps">
                <div class="font-bold text-gray-600">{{ slotProps.index + 1 }}</div>
              </template>
            </Column>

            <Column field="codigo" header="Código" style="min-width: 120px">
              <template #body="slotProps">
                <div class="font-mono text-sm">{{ slotProps.data.codigo }}</div>
              </template>
            </Column>

            <Column field="nombre" header="Producto" style="min-width: 250px">
              <template #body="slotProps">
                <div class="font-semibold text-gray-800">{{ slotProps.data.nombre }}</div>
                <div class="text-xs text-gray-500">{{ slotProps.data.categoria }}</div>
              </template>
            </Column>

            <Column field="codigo_barra" header="Código de Barras" style="min-width: 150px">
              <template #body="slotProps">
                <div class="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                  {{ slotProps.data.codigo_barra || 'N/A' }}
                </div>
              </template>
            </Column>

            <Column field="precio" header="Precio" style="width: 120px">
              <template #body="slotProps">
                <InputNumber
                  v-model="slotProps.data.precio"
                  mode="currency"
                  currency="DOP"
                  locale="es-DO"
                  :minFractionDigits="2"
                  class="w-full"
                  size="small"
                />
              </template>
            </Column>

            <Column field="cantidad" header="Cantidad" style="width: 140px">
              <template #body="slotProps">
                <InputNumber
                  v-model="slotProps.data.cantidad"
                  :min="1"
                  :max="1000"
                  showButtons
                  buttonLayout="horizontal"
                  class="w-full"
                  size="small"
                >
                  <template #incrementbuttonicon>
                    <span class="pi pi-plus text-xs"></span>
                  </template>
                  <template #decrementbuttonicon>
                    <span class="pi pi-minus text-xs"></span>
                  </template>
                </InputNumber>
              </template>
            </Column>

            <Column header="Acciones" style="width: 100px">
              <template #body="slotProps">
                <Button
                  icon="pi pi-trash"
                  severity="danger"
                  text
                  rounded
                  @click="eliminarProductoMultiple(slotProps.index)"
                  v-tooltip.top="'Eliminar'"
                />
              </template>
            </Column>

            <template #footer>
              <div class="flex justify-between items-center px-4 py-3 bg-gray-50 rounded-lg">
                <div class="flex gap-6">
                  <div>
                    <span class="text-gray-600 font-semibold">Total Productos:</span>
                    <span class="ml-2 text-xl font-bold text-blue-600">
                      {{ productosSeleccionados.length }}
                    </span>
                  </div>
                  <div>
                    <span class="text-gray-600 font-semibold">Total Etiquetas:</span>
                    <span class="ml-2 text-xl font-bold text-green-600">
                      {{ productosSeleccionados.reduce((sum, p) => sum + parseInt(p.cantidad || 1), 0) }}
                    </span>
                  </div>
                </div>
                <Button
                  label="Imprimir Todo"
                  icon="pi pi-print"
                  @click="imprimirMultiplesProductos"
                  severity="success"
                  size="large"
                  class="print-all-btn"
                />
              </div>
            </template>
          </DataTable>
        </template>
      </Card>

    </div>

    <!-- Dialog para seleccionar impresora -->
    <Dialog
      v-model:visible="dialogVisible"
      modal
      header="Seleccionar Impresora"
      :style="{ width: '420px' }"
      class="animate-slideInDown"
    >
      <div v-if="listaImpresoras.length === 0" class="text-center py-3">
        Cargando impresoras...
      </div>

      <ul v-else class="space-y-2 max-h-80 overflow-auto custom-scroll">
        <li v-for="(impresora, index) in listaImpresoras" :key="index">
          <Button
            @click="seleccionarImpresora(impresora)"
            outlined
            class="w-full text-left justify-start"
            :label="impresora"
          />
        </li>
      </ul>
    </Dialog>

    <Toast />
  </main>
</template>

<style scoped>
/* ===================================
   BARCODE GENERATOR STYLES
   =================================== */

.barcode-wrapper {
  min-height: calc(100vh - 80px);
  background: linear-gradient(135deg, rgba(249, 250, 251, 1) 0%, rgba(243, 244, 246, 1) 100%);
}

.container-barcode {
  max-width: 1600px;
}

/* Header Section */
.header-section {
  background: white;
  border-radius: 16px;
  padding: 2rem;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  border: 1px solid rgba(229, 231, 235, 0.8);
  animation: slideIn 0.4s ease-out;
}

.header-icon {
  width: 80px;
  height: 80px;
  border-radius: 16px;
  background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2.5rem;
  color: white;
  box-shadow: 0 8px 20px rgba(99, 102, 241, 0.3);
}

/* Options Card */
.options-card {
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  border: 1px solid rgba(229, 231, 235, 0.8);
  animation: slideIn 0.5s ease-out;
}

.options-card :deep(.p-card-body) {
  padding: 0;
}

.options-card :deep(.p-card-content) {
  padding: 1.5rem;
}

.card-header-custom {
  padding: 1.5rem;
  background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%);
  border-radius: 16px 16px 0 0;
  display: flex;
  align-items: center;
  color: #374151;
  font-weight: 600;
}

.toggle-option {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem;
  background: linear-gradient(135deg, #fafafa 0%, #f5f5f5 100%);
  border-radius: 12px;
  border: 2px solid #e5e7eb;
  transition: all 0.3s ease;
}

.toggle-option:hover {
  border-color: #6366f1;
  background: linear-gradient(135deg, #eef2ff 0%, #e0e7ff 100%);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.15);
}

.toggle-label {
  font-size: 0.875rem;
  font-weight: 600;
  color: #374151;
  display: flex;
  align-items: center;
  text-align: center;
}

/* Config Cards */
.config-card {
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  border: 1px solid rgba(229, 231, 235, 0.8);
  transition: all 0.3s ease;
  animation: slideIn 0.6s ease-out;
}

.config-card:hover {
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
}

.config-card :deep(.p-card-body) {
  padding: 0;
}

.config-card :deep(.p-card-content) {
  padding: 1.5rem;
}

/* Form Fields */
.form-field-modern {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.field-label-modern {
  font-weight: 600;
  color: #374151;
  font-size: 0.875rem;
  display: flex;
  align-items: center;
}

.field-label-modern-small {
  font-weight: 600;
  color: #6b7280;
  font-size: 0.75rem;
  display: flex;
  align-items: center;
}

/* Inputs */
.modern-input-barcode {
  border: 2px solid #e5e7eb;
  border-radius: 10px;
  padding: 0.75rem;
  font-size: 0.95rem;
  transition: all 0.3s ease;
}

.modern-input-barcode:focus {
  border-color: #6366f1;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
  outline: none;
}

.price-input {
  font-weight: 700;
  font-size: 1.1rem;
  color: #10b981;
}

.modern-number-barcode :deep(.p-inputnumber-input) {
  border: 2px solid #e5e7eb;
  border-radius: 10px;
  padding: 0.75rem;
  font-size: 0.95rem;
  font-weight: 600;
}

.modern-number-barcode :deep(.p-inputnumber-input:focus) {
  border-color: #6366f1;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
}

.modern-number-small :deep(.p-inputnumber-input) {
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  padding: 0.5rem;
  font-size: 0.875rem;
  font-weight: 600;
  text-align: center;
}

.modern-number-small :deep(.p-inputnumber-input:focus) {
  border-color: #6366f1;
  box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.1);
}

.modern-dropdown-barcode :deep(.p-dropdown) {
  border: 2px solid #e5e7eb;
  border-radius: 10px;
  transition: all 0.3s ease;
}

.modern-dropdown-barcode :deep(.p-dropdown:focus) {
  border-color: #6366f1;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
}

/* Awesomplete */
.awesomplete-barcode :deep(input) {
  border: 2px solid #e5e7eb;
  border-radius: 10px;
  padding: 0.75rem;
  width: 100%;
  font-size: 0.95rem;
  transition: all 0.3s ease;
}

.awesomplete-barcode :deep(input:focus) {
  border-color: #6366f1;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
  outline: none;
}

/* Search Printer Button */
.search-printer-btn-barcode {
  white-space: nowrap;
  flex-shrink: 0;
  border-radius: 10px;
  transition: all 0.3s ease;
}

.search-printer-btn-barcode:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
}

/* Margins Grid */
.margins-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
}

/* Action Buttons */
.action-buttons-barcode {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-top: 1.5rem;
  padding-top: 1.5rem;
  border-top: 2px solid #e5e7eb;
}

.action-btn-barcode {
  padding: 0.875rem 1.5rem;
  font-weight: 600;
  border-radius: 10px;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.action-btn-barcode:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
}

/* InputSwitch Custom */
:deep(.p-inputswitch) {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

:deep(.p-inputswitch.p-inputswitch-checked .p-inputswitch-slider) {
  background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
}

/* Animations */
@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes slideInDown {
  from {
    transform: translateY(-20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.animate-slideInDown {
  animation: slideInDown 0.4s ease-out;
}

/* Scrollbar personalizado para lista de impresoras */
.custom-scroll::-webkit-scrollbar {
  width: 8px;
}

.custom-scroll::-webkit-scrollbar-thumb {
  background: #6366f1;
  border-radius: 10px;
}

.custom-scroll::-webkit-scrollbar-thumb:hover {
  background: #4338ca;
}

/* Vista Selector */
.vista-selector {
  background: white;
  border-radius: 10px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.vista-selector :deep(.p-button) {
  border-radius: 8px;
  padding: 0.75rem 1.5rem;
  font-weight: 600;
  transition: all 0.3s ease;
}

.vista-selector :deep(.p-button.p-highlight) {
  background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
  color: white;
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
}

/* Perfil Dropdown */
.perfil-dropdown {
  min-width: 200px;
}

.perfil-dropdown :deep(.p-dropdown) {
  border: 2px solid #e5e7eb;
  border-radius: 10px;
  background: white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
}

.perfil-dropdown :deep(.p-dropdown:hover) {
  border-color: #6366f1;
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.15);
}

.perfil-dropdown :deep(.p-dropdown:focus) {
  border-color: #6366f1;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
}

/* Multiple Products Card */
.multiple-products-card {
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  border: 1px solid rgba(229, 231, 235, 0.8);
  animation: slideIn 0.6s ease-out;
}

.multiple-products-card :deep(.p-card-body) {
  padding: 0;
}

.multiple-products-card :deep(.p-card-content) {
  padding: 1.5rem;
}

.multiple-products-card .card-header-custom {
  display: flex;
  align-items: center;
  padding: 1.5rem;
  background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%);
  border-radius: 16px 16px 0 0;
  color: #374151;
  font-weight: 600;
}

/* Products Table */
.products-table {
  border-radius: 12px;
  overflow: hidden;
}

.products-table :deep(.p-datatable-header) {
  background: linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%);
  border-bottom: 2px solid #e5e7eb;
  padding: 1rem;
}

.products-table :deep(.p-datatable-thead > tr > th) {
  background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
  color: white;
  font-weight: 700;
  padding: 1rem;
  border: none;
}

.products-table :deep(.p-datatable-tbody > tr) {
  transition: all 0.3s ease;
}

.products-table :deep(.p-datatable-tbody > tr:hover) {
  background: linear-gradient(135deg, #eef2ff 0%, #e0e7ff 100%);
  transform: scale(1.01);
  box-shadow: 0 2px 8px rgba(99, 102, 241, 0.1);
}

.products-table :deep(.p-datatable-tbody > tr > td) {
  padding: 1rem;
  border-bottom: 1px solid #f3f4f6;
}

.products-table :deep(.p-inputnumber-input) {
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  padding: 0.5rem;
  font-weight: 600;
  text-align: center;
}

.products-table :deep(.p-inputnumber-input:focus) {
  border-color: #6366f1;
  box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.1);
}

.products-table :deep(.p-inputnumber-button) {
  background: #6366f1;
  color: white;
  border: none;
  width: 2rem;
  border-radius: 6px;
}

.products-table :deep(.p-inputnumber-button:hover) {
  background: #4f46e5;
}

/* Print All Button */
.print-all-btn {
  padding: 0.875rem 2rem;
  font-weight: 700;
  border-radius: 10px;
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  border: none;
  box-shadow: 0 4px 16px rgba(16, 185, 129, 0.3);
  transition: all 0.3s ease;
}

.print-all-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(16, 185, 129, 0.4);
  background: linear-gradient(135deg, #059669 0%, #10b981 100%);
}

/* Empty State */
.text-center i.pi-inbox {
  display: block;
  margin: 0 auto 1rem;
}

/* Responsive */
@media (max-width: 768px) {
  .header-icon {
    width: 60px;
    height: 60px;
    font-size: 2rem;
  }

  .toggle-option {
    padding: 0.75rem;
  }

  .margins-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .action-buttons-barcode {
    flex-direction: column;
  }

  .vista-selector :deep(.p-button) {
    padding: 0.5rem 1rem;
    font-size: 0.875rem;
  }

  .products-table :deep(.p-datatable-tbody > tr > td) {
    padding: 0.75rem 0.5rem;
  }

  .print-all-btn {
    width: 100%;
    margin-top: 1rem;
  }

  .multiple-products-card .card-header-custom {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }

  .multiple-products-card .card-header-custom .ml-auto {
    margin-left: 0;
    width: 100%;
  }

  .multiple-products-card .card-header-custom .flex.gap-2 {
    flex-direction: column;
    width: 100%;
  }
}

@media (max-width: 640px) {
  .products-table {
    font-size: 0.875rem;
  }

  .products-table :deep(.p-datatable-thead > tr > th) {
    padding: 0.75rem 0.5rem;
    font-size: 0.75rem;
  }
}
</style>
