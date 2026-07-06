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
  enviarSolicitudGet,
  generarCodigoUnico,
  peticiones,
  peticionesFetchOffline,
  mensajetoast,
  lasMayusculas} from '@/funciones/funciones.js';
import Swal from 'sweetalert2'
const toast = useToast();
/************************************************************************/
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
const usuarioLocal = ref({})
/************************************************************************/
const datoscampos = ref({})
const codigoUnico = ref(generarCodigoUnico());
const fecha = ref(nfecha('fecha'));
const todosLosClientes = ref([]);
const productosPrecioCliente = ref([]);
const productoPrecioClienteSeleccionado = ref(null);
const precioProductoCliente = ref(null);
const preciosProductosCliente = ref([]);
const arrayIMG = ref([]);
/************************************************************************/
/************************************************************************/
const parsePreciosProductosCliente = (valor) => {
    try {
        const datos = typeof valor === 'string' ? JSON.parse(valor || '[]') : valor;
        return Array.isArray(datos) ? datos : [];
    } catch (error) {
        return [];
    }
};

const sincronizarPreciosProductosCliente = () => {
    if (!datoscampos.value) return;
    datoscampos.value.precios_productos = JSON.stringify(preciosProductosCliente.value);
};

const asegurarImagenCliente = async () => {
    if (!datoscampos.value) return;
    if (!datoscampos.value.imagen) {
        datoscampos.value.imagen = generarCodigoUnico();
        await funcionActualizar();
    }
};

const getRutaImagenCliente = () => `../vista/img/clientes/${datoscampos.value.imagen}`;

const cargarImagenesCliente = async () => {
    if (!datoscampos.value?.imagen) {
        arrayIMG.value = [];
        return;
    }

    try {
        const rutaCompleta = getRutaImagenCliente();
        const verificaDir = await peticiones(
            link.value + api.value + '/verificadirectorio',
            { ruta: rutaCompleta },
            'POST',
            tokenCifrado.value
        );

        if (verificaDir?.[0] === 'error') {
            await peticiones(
                link.value + api.value + '/creardirectorio',
                { ruta: rutaCompleta },
                'POST',
                tokenCifrado.value
            );
            arrayIMG.value = [];
            return;
        }

        const archivosNombres = await peticiones(
            link.value + api.value + '/peticionimagenes',
            { origen: rutaCompleta },
            'POST',
            tokenCifrado.value
        );

        arrayIMG.value = Array.isArray(archivosNombres) && archivosNombres[0] !== 'error'
            ? archivosNombres
            : [];
    } catch (error) {
        console.error('[ClientesImagen] Error cargando imagenes:', error);
        arrayIMG.value = [];
    }
};

const getImagenClienteSrc = (imagen) => {
    if (!imagen) return '';
    if (typeof imagen === 'object') {
        if (imagen.url && !String(imagen.url).startsWith('file:')) return imagen.url;
        if (imagen.nombre) return `${link.value}/vista/img/clientes/${datoscampos.value.imagen}/${imagen.nombre}`;
    }
    if (/^(https?:|data:|blob:)/.test(String(imagen))) return imagen;
    return `${link.value}/vista/img/clientes/${datoscampos.value.imagen}/${imagen}`;
};

const obtenerNombreArchivo = (imagen) => {
    if (!imagen) return '';
    if (typeof imagen === 'object') return imagen.nombre || imagen.name || imagen.path?.split(/[\\/]/).pop() || '';
    return String(imagen).split(/[\\/]/).pop();
};

const prepararClienteParaEdicion = async (cliente) => {
    datoscampos.value = cliente || {};
    preciosProductosCliente.value = parsePreciosProductosCliente(datoscampos.value.precios_productos);
    sincronizarPreciosProductosCliente();
    await asegurarImagenCliente();
    await cargarImagenesCliente();
};

const asegurarCamposCliente = async () => {
    const columnas = await peticionesFetchOffline('getTableColumns', 'clientes');
    if (Array.isArray(columnas) && !columnas.includes('precios_productos')) {
        await peticionesFetchOffline('addColumnToTable', { tabla: 'clientes', campo: 'precios_productos' });
    }
    if (Array.isArray(columnas) && !columnas.includes('imagen')) {
        await peticionesFetchOffline('addColumnToTable', { tabla: 'clientes', campo: 'imagen' });
    }
};

const cargarProductosPrecioCliente = async () => {
    const productos = await peticionesFetchOffline('getDataAsArray', 'productos');
    productosPrecioCliente.value = (Array.isArray(productos) ? productos : [])
        .filter(producto => producto?.codigo && producto?.nombre)
        .sort((a, b) => String(a.nombre || '').localeCompare(String(b.nombre || '')));
};

const seleccionarProductoPrecioCliente = () => {
    const producto = productoPrecioClienteSeleccionado.value;
    precioProductoCliente.value = Number(producto?.precio_final || producto?.precio_venta || 0);
};

const agregarPrecioProductoCliente = () => {
    const producto = productoPrecioClienteSeleccionado.value;
    const precio = Number(precioProductoCliente.value || 0);

    if (!producto?.codigo || precio <= 0) {
        toast.add({ severity: 'warn', summary: 'Validacion', detail: 'Seleccione un producto y un precio valido.', life: 3000 });
        return;
    }

    const precioCliente = {
        codigo: producto.codigo,
        nombre: producto.nombre,
        precio_cliente: Number(precio.toFixed(2)),
        precio_venta: Number(producto.precio_venta || 0),
        precio_min: Number(producto.precio_min || 0),
        precio_xmayor: Number(producto.precio_xmayor || 0)
    };

    const index = preciosProductosCliente.value.findIndex(item => item.codigo === producto.codigo);
    if (index >= 0) {
        preciosProductosCliente.value[index] = precioCliente;
    } else {
        preciosProductosCliente.value.push(precioCliente);
    }

    sincronizarPreciosProductosCliente();
    productoPrecioClienteSeleccionado.value = null;
    precioProductoCliente.value = null;
};

const eliminarPrecioProductoCliente = (codigo) => {
    preciosProductosCliente.value = preciosProductosCliente.value.filter(item => item.codigo !== codigo);
    sincronizarPreciosProductosCliente();
};

const fetchAllData = async () => {
    await asegurarCamposCliente();
    const response = await peticionesFetchOffline('getDataAsArray', 'clientes');
    const jsonData = response.filter(cliente=>cliente.codigo != '0000000');
    todosLosClientes.value = jsonData;
    await prepararClienteParaEdicion(jsonData.find(datos=>datos.id == route.params.id));
};
/************************************************************************/
async function navigate(action) {
    const currentIndex = todosLosClientes.value.findIndex(clientes => clientes.id == route.params.id);
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
            newIndex = currentIndex + 1 < todosLosClientes.value.length ? currentIndex + 1 : currentIndex;
            break;
        case 'ultimo':
            newIndex = todosLosClientes.value.length - 1;
            break;
        default:
            return;
    }
    await prepararClienteParaEdicion(todosLosClientes.value[newIndex]);
    router.push({ path: `/editarclientes/${todosLosClientes.value[newIndex].id}` });
}
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
usuarioLocal.value = JSON.parse(window.localStorage.getItem('usuarioLocal'))[0] || {};
await cargarProductosPrecioCliente();
await fetchAllData()
});
/************************************************************************/
async function funcionActualizar(e) {
  if(e){
    e.preventDefault();
  }
  const url = link.value+api.value+"/actualizarcampos/clientes";
  if (!datoscampos.value) {
    console.error("Datos incompletos, no se puede actualizar.");
    return;
  }
  if (datoscampos.value.hasOwnProperty('created_at')) {
      datoscampos.value.updated_at = nfecha('timestamp')
    }
  sincronizarPreciosProductosCliente();
  const envioDatos =  await peticionesFetchOffline('updateData','clientes', JSON.stringify(datoscampos.value));
  if (envioDatos[0] == 'ok') {
     toast.add({ severity: 'success', summary: 'Éxito', detail: 'Datos Actualizados', life: 3000 });
  }else{
    toast.add({ severity: 'error', summary: 'Error', detail: 'Fallo al actualizar los datos.', life: 3000 });
  }
}
/************************************************************************/
const handleUpload = async (event) => {
  console.log('[ClientesImagen] Evento FileUpload recibido:', event);

  try {
    await asegurarImagenCliente();
  } catch (err) {
    console.error('[ClientesImagen] Error asegurando imagen del cliente:', err);
    toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo preparar el cliente para subir imagen.', life: 3000 });
    return;
  }

  const archivos = event.files || [];
  const ruta = getRutaImagenCliente();
  console.log('[ClientesImagen] Archivos seleccionados:', archivos);
  console.log('[ClientesImagen] Ruta destino:', ruta);

  for (const archivo of archivos) {
    console.log('[ClientesImagen] Leyendo archivo:', {
      name: archivo.name,
      type: archivo.type,
      size: archivo.size
    });

    const formData = new FormData();
    formData.append('imagen[]', archivo);
    formData.append('ruta', ruta);

    try {
      const response = await fetch(link.value + api.value + '/subirunaimagen2', {
        method: 'POST',
        headers: {
          Authorization: tokenCifrado.value
        },
        body: formData
      });
      const resultado = await response.json();

      console.log('[ClientesImagen] Respuesta servidor subirunaimagen2:', resultado);

      if (resultado?.[0]?.status === 'ok' || resultado?.[0]?.status === true || resultado?.[0]?.status) {
        await cargarImagenesCliente();
        console.log('[ClientesImagen] Imagenes recargadas:', arrayIMG.value);
        toast.add({ severity: 'success', summary: 'Exito', detail: 'Imagen subida', life: 3000 });
      } else {
        console.error('[ClientesImagen] Error devuelto por subirunaimagen2:', resultado);
        toast.add({ severity: 'error', summary: 'Error', detail: 'Fallo al subir la imagen.', life: 3000 });
      }
    } catch (err) {
      console.error('[ClientesImagen] Error subiendo imagen al servidor:', err);
      toast.add({ severity: 'error', summary: 'Error', detail: 'Fallo al subir la imagen.', life: 3000 });
    }
  }
};
/************************************************************************/
const deleteImage = async (imagen) => {
  const nombreArchivo = obtenerNombreArchivo(imagen);
  if (!nombreArchivo || !datoscampos.value?.imagen) return;

  const envioDatos = await enviarDatosPorPost(
    link.value + api.value + '/borrararchivo',
    {
      ruta: getRutaImagenCliente(),
      archivo: nombreArchivo
    },
    tokenCifrado.value
  );

  if (envioDatos?.success || envioDatos?.[0] === 'ok') {
    await cargarImagenesCliente();
    toast.add({ severity: 'success', summary: 'Exito', detail: 'Imagen borrada', life: 3000 });
  } else {
    toast.add({ severity: 'error', summary: 'Error', detail: 'Fallo al borrar la imagen.', life: 3000 });
  }
};
/************************************************************************/
</script>
<template>
  <main class="min-h-screen bg-gradient-to-br from-slate-100 via-sky-50 to-cyan-100 px-3 py-4 sm:px-6 sm:py-8 lg:px-10">
    <div class="mx-auto flex w-full max-w-7xl flex-col gap-5 sm:gap-6">
      <section class="rounded-2xl bg-gradient-to-r from-slate-900 via-blue-900 to-cyan-800 p-4 text-white shadow-xl sm:p-6 lg:p-8">
        <div class="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div class="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20 text-2xl backdrop-blur sm:h-16 sm:w-16">
            <i class="pi pi-user-edit"></i>
          </div>
          <div class="min-w-0">
            <h1 class="text-xl font-bold tracking-tight sm:text-2xl lg:text-3xl">Editar Cliente</h1>
            <p class="mt-1 truncate text-sm text-white/90 sm:text-base">
              Actualiza la informacion del cliente: {{ datoscampos.nombre }}
            </p>
          </div>
        </div>
      </section>

      <Card class="rounded-2xl shadow-lg">
        <template #content>
          <div class="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div class="flex flex-col gap-3 sm:flex-row">
              <Button
                icon="pi pi-home"
                severity="secondary"
                label="Inicio"
                @click="router.push('/clientes')"
                class="w-full sm:w-auto"
              />
              <Button
                icon="pi pi-plus"
                severity="success"
                label="Nuevo Cliente"
                @click="router.push('/crearclientes')"
                class="w-full sm:w-auto"
              />
            </div>
            <div class="grid grid-cols-4 gap-2 sm:w-auto">
              <Button
                icon="pi pi-angle-double-left"
                severity="secondary"
                @click="navigate('primero')"
                title="Primer registro"
                class="w-full"
              />
              <Button
                icon="pi pi-angle-left"
                severity="secondary"
                @click="navigate('anterior')"
                title="Registro anterior"
                class="w-full"
              />
              <Button
                icon="pi pi-angle-right"
                severity="secondary"
                @click="navigate('siguiente')"
                title="Siguiente registro"
                class="w-full"
              />
              <Button
                icon="pi pi-angle-double-right"
                severity="secondary"
                @click="navigate('ultimo')"
                title="Ultimo registro"
                class="w-full"
              />
            </div>
          </div>
        </template>
      </Card>

      <Card class="rounded-2xl shadow-lg">
        <template #content>
          <form @submit="funcionActualizar" class="space-y-7">
            <section class="space-y-4">
              <div class="border-b border-slate-200 pb-2">
                <h2 class="flex items-center gap-2 text-lg font-semibold text-slate-800">
                  <i class="pi pi-user text-sky-600"></i>
                  Informacion Personal
                </h2>
              </div>
              <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-12">
                <div class="lg:col-span-12">
                  <label class="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-600">
                    <i class="pi pi-user text-blue-500"></i>
                    Nombre completo
                  </label>
                  <InputText v-model="datoscampos.nombre" placeholder="Nombre completo" fluid />
                </div>

                <div class="lg:col-span-4">
                  <label class="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-600">
                    <i class="pi pi-id-card text-violet-500"></i>
                    Cedula
                  </label>
                  <InputText v-model="datoscampos.cedula" placeholder="000-0000000-0" fluid />
                </div>

                <div class="lg:col-span-4">
                  <label class="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-600">
                    <i class="pi pi-phone text-emerald-500"></i>
                    Telefono
                  </label>
                  <InputMask v-model="datoscampos.telefono" :mask="patronTelefono" placeholder="(000) 000-0000" fluid />
                </div>

                <div class="lg:col-span-4">
                  <label class="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-600">
                    <i class="pi pi-whatsapp text-green-600"></i>
                    WhatsApp
                  </label>
                  <InputMask v-model="datoscampos.whatsapp" :mask="patronTelefono" placeholder="(000) 000-0000" fluid />
                </div>

                <div class="lg:col-span-6">
                  <label class="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-600">
                    <i class="pi pi-envelope text-orange-500"></i>
                    Email
                  </label>
                  <InputText v-model="datoscampos.email" type="email" placeholder="correo@ejemplo.com" fluid />
                </div>

                <div class="lg:col-span-6">
                  <label class="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-600">
                    <i class="pi pi-lock text-rose-500"></i>
                    Contrasena
                  </label>
                  <Password v-model="datoscampos.password" toggleMask :feedback="false" fluid />
                </div>

                <div class="lg:col-span-12">
                  <label class="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-600">
                    <i class="pi pi-map-marker text-indigo-500"></i>
                    Direccion
                  </label>
                  <Textarea v-model="datoscampos.direccion" rows="3" autoResize placeholder="Direccion completa" fluid />
                </div>

                <div class="lg:col-span-3">
                  <label class="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-600">
                    <i class="pi pi-users text-pink-500"></i>
                    Genero
                  </label>
                  <Dropdown v-model="datoscampos.genero" :options="['HOMBRE', 'MUJER', 'OTRO']" placeholder="Seleccione" fluid />
                </div>

                <div class="lg:col-span-3">
                  <label class="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-600">
                    <i class="pi pi-heart text-rose-400"></i>
                    Estado civil
                  </label>
                  <Dropdown v-model="datoscampos.estado_civil" :options="['SOLTERO', 'CASADO', 'UNIDO', 'VIUDO', 'OTRO']" placeholder="Seleccione" fluid />
                </div>

                <div class="lg:col-span-3">
                  <label class="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-600">
                    <i class="pi pi-calendar text-violet-500"></i>
                    Fecha nacimiento
                  </label>
                  <Calendar v-model="datoscampos.fecha_nacimiento" dateFormat="dd/mm/yy" showIcon fluid />
                </div>

                <div class="lg:col-span-3">
                  <label class="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-600">
                    <i class="pi pi-clock text-amber-500"></i>
                    Edad
                  </label>
                  <InputNumber v-model="datoscampos.edad" placeholder="Edad" fluid />
                </div>

                <div class="lg:col-span-4">
                  <label class="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-600">
                    <i class="pi pi-tag text-cyan-500"></i>
                    Apodo
                  </label>
                  <InputText v-model="datoscampos.apodo" placeholder="Apodo" fluid />
                </div>

                <div class="lg:col-span-4">
                  <label class="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-600">
                    <i class="pi pi-dollar text-emerald-600"></i>
                    Limite credito
                  </label>
                  <InputNumber v-model="datoscampos.limite_credito" mode="currency" currency="DOP" locale="es-DO" fluid />
                </div>

                <div class="lg:col-span-4">
                  <label class="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-600">
                    <i class="pi pi-money-bill text-teal-500"></i>
                    Precio fijado
                  </label>
                  <Dropdown v-model="datoscampos.precio_fijado" :options="['Normal', 'Minimo', 'PorMayor']" placeholder="Seleccione" fluid />
                </div>

                <div class="lg:col-span-4">
                  <label class="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-600">
                    <i class="pi pi-star-fill text-yellow-500"></i>
                    Puntos fidelizacion
                  </label>
                  <InputNumber v-model="datoscampos.puntos" placeholder="0" readonly fluid />
                </div>
              </div>
            </section>

            <section class="space-y-4">
              <div class="border-b border-slate-200 pb-2">
                <h2 class="flex items-center gap-2 text-lg font-semibold text-slate-800">
                  <i class="pi pi-images text-sky-600"></i>
                  Imagenes del cliente
                </h2>
              </div>

              <FileUpload
                :customUpload="true"
                :auto="true"
                chooseLabel="Seleccionar Imagenes"
                @uploader="handleUpload"
                :multiple="true"
                accept="image/*"
              />

              <div v-if="arrayIMG.length" class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div
                  v-for="imagen in arrayIMG"
                  :key="obtenerNombreArchivo(imagen)"
                  class="rounded-lg border border-slate-200 bg-white p-3 shadow-sm"
                >
                  <Image :src="getImagenClienteSrc(imagen)" preview imageClass="h-44 w-full rounded-md object-cover" />
                  <Button
                    type="button"
                    label="Eliminar"
                    icon="pi pi-trash"
                    severity="danger"
                    class="mt-3 w-full"
                    @click.prevent="deleteImage(imagen)"
                  />
                </div>
              </div>

              <div v-else class="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-5 text-center text-sm text-slate-500">
                Este cliente no tiene imagenes registradas.
              </div>
            </section>

            <section class="space-y-4">
              <div class="border-b border-slate-200 pb-2">
                <h2 class="flex items-center gap-2 text-lg font-semibold text-slate-800">
                  <i class="pi pi-tags text-emerald-600"></i>
                  Precios por producto
                </h2>
                <p class="mt-1 text-sm text-slate-500">
                  Define precios especiales para productos especificos de este cliente.
                </p>
              </div>

              <div class="grid grid-cols-1 gap-4 lg:grid-cols-12">
                <div class="lg:col-span-7">
                  <label class="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-600">
                    <i class="pi pi-box text-blue-500"></i>
                    Producto
                  </label>
                  <Dropdown
                    v-model="productoPrecioClienteSeleccionado"
                    :options="productosPrecioCliente"
                    optionLabel="nombre"
                    placeholder="Seleccione un producto"
                    filter
                    showClear
                    fluid
                    @change="seleccionarProductoPrecioCliente"
                  />
                </div>

                <div class="lg:col-span-3">
                  <label class="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-600">
                    <i class="pi pi-dollar text-emerald-600"></i>
                    Precio para este cliente
                  </label>
                  <InputNumber
                    v-model="precioProductoCliente"
                    mode="currency"
                    currency="DOP"
                    locale="es-DO"
                    :min="0"
                    fluid
                  />
                </div>

                <div class="flex items-end lg:col-span-2">
                  <Button
                    type="button"
                    label="Agregar"
                    icon="pi pi-plus"
                    severity="success"
                    class="w-full"
                    @click="agregarPrecioProductoCliente"
                  />
                </div>
              </div>

              <DataTable
                :value="preciosProductosCliente"
                dataKey="codigo"
                size="small"
                stripedRows
                class="p-datatable-gridlines"
              >
                <Column field="codigo" header="Codigo" />
                <Column field="nombre" header="Producto" />
                <Column field="precio_cliente" header="Precio cliente">
                  <template #body="slotProps">
                    {{ new Intl.NumberFormat('es-DO', { style: 'currency', currency: 'DOP' }).format(slotProps.data.precio_cliente || 0) }}
                  </template>
                </Column>
                <Column field="precio_venta" header="P. venta">
                  <template #body="slotProps">
                    {{ new Intl.NumberFormat('es-DO', { style: 'currency', currency: 'DOP' }).format(slotProps.data.precio_venta || 0) }}
                  </template>
                </Column>
                <Column header="Acciones">
                  <template #body="slotProps">
                    <Button
                      type="button"
                      icon="pi pi-trash"
                      severity="danger"
                      text
                      rounded
                      @click="eliminarPrecioProductoCliente(slotProps.data.codigo)"
                    />
                  </template>
                </Column>
                <template #empty>
                  <div class="py-5 text-center text-sm text-slate-500">
                    Este cliente no tiene precios especiales por producto.
                  </div>
                </template>
              </DataTable>
            </section>

            <section class="space-y-4">
              <div class="border-b border-slate-200 pb-2">
                <h2 class="flex items-center gap-2 text-lg font-semibold text-slate-800">
                  <i class="pi pi-building text-cyan-700"></i>
                  Informacion Empresarial
                </h2>
              </div>
              <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-12">
                <div class="lg:col-span-6">
                  <label class="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-600">
                    <i class="pi pi-building text-blue-600"></i>
                    Empresa
                  </label>
                  <InputText v-model="datoscampos.empresa" placeholder="Empresa" fluid />
                </div>

                <div class="lg:col-span-6">
                  <label class="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-600">
                    <i class="pi pi-briefcase text-indigo-600"></i>
                    Cargo
                  </label>
                  <InputText v-model="datoscampos.cargo" placeholder="Cargo" fluid />
                </div>

                <div class="lg:col-span-4">
                  <label class="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-600">
                    <i class="pi pi-phone text-green-700"></i>
                    Telefono empresa
                  </label>
                  <InputMask v-model="datoscampos.telefono_empresa" :mask="patronTelefono" placeholder="(000) 000-0000" fluid />
                </div>

                <div class="lg:col-span-4">
                  <label class="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-600">
                    <i class="pi pi-bookmark text-purple-600"></i>
                    Nombre comercial
                  </label>
                  <InputText v-model="datoscampos.n_comercial" placeholder="Nombre comercial" fluid />
                </div>

                <div class="lg:col-span-4">
                  <label class="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-600">
                    <i class="pi pi-file text-orange-600"></i>
                    RNC
                  </label>
                  <InputText v-model="datoscampos.rnc" placeholder="RNC" fluid />
                </div>

                <div class="lg:col-span-12">
                  <label class="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-600">
                    <i class="pi pi-map text-cyan-600"></i>
                    Direccion empresa
                  </label>
                  <Textarea v-model="datoscampos.direccion_empresa" rows="3" autoResize placeholder="Direccion empresa" fluid />
                </div>
              </div>
            </section>

            <section class="space-y-4">
              <div class="border-b border-slate-200 pb-2">
                <h2 class="flex items-center gap-2 text-lg font-semibold text-slate-800">
                  <i class="pi pi-cog text-slate-700"></i>
                  Configuracion
                </h2>
              </div>
              <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label class="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-600">
                    <i class="pi pi-hashtag text-slate-600"></i>
                    Codigo
                  </label>
                  <InputText
                    v-model="datoscampos.codigo"
                    placeholder="Codigo"
                    :readonly="usuarioLocal.usuario !== 'Soporte'"
                    fluid
                  />
                </div>

                <div>
                  <label class="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-600">
                    <i class="pi pi-power-off text-emerald-600"></i>
                    Estado
                  </label>
                  <Dropdown v-model="datoscampos.activo" :options="['ON', 'OFF']" placeholder="Seleccione" fluid />
                </div>
              </div>
            </section>

            <div class="pt-2">
              <Button
                type="submit"
                label="Actualizar Cliente"
                icon="pi pi-save"
                class="w-full sm:w-auto"
              />
            </div>
          </form>
        </template>
      </Card>

      <Toast />
    </div>
  </main>
</template>
