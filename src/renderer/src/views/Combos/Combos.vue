<script setup>
import { ref, onMounted, nextTick, watchEffect,computed } from 'vue';
import axios from 'axios';
import { enviarDatosPorPost, eliminarDatos, obtenerIdsSeleccionados, borrarTodoslosDatos, lenguajeDataTable, nfecha, arrayToObjetoFromTabla, peticionesFetch, encryptarPassword, envioElectron, mensajetoast, crearTablaSiNoExiste, peticiones, lasMayusculas,generarTablaFromStringJSON,peticionesFetchOffline,
arrayToObjetoFromTablaOffline,
crearTablaSiNoExisteOffline } from '../../funciones/funciones.js';
import Swal from 'sweetalert2'
import Awesomplete from '../../components/Awesomplete.vue';
import { useToast } from "primevue/usetoast";
const toast = useToast();
/************************************************************************/
/************************************************************************/
const usuarioLocal = ref({})
/************************************************************************/
const camposArray = ["nombre","productos","usuario"];
/************************************************************************/
import { useDatosEmpresa } from '../../stores'
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
const selectedItems = ref([]);
const nombresProductosArray = ref([]);
const productosArray = ref([]);
/************************************************************************/
const position = ref('top');
const openPosition = (pos) => {
    position.value = pos;
    visible.value = true;
}
/************************************************************************/
const datoscamposCombos = ref({})
const camposOriginal = ref({})
/************************************************************************/
const visible = ref(false);
const visiblecrear = ref(false);
const value = ref(null);
const id = ref(null);
const datoscampos = ref({});
const data = ref([]);
const searchQuery = ref('');
const CombosEditar = ref(null);
/************************************************************************/
async function limpiarCamposCrear() {
datoscamposCombos.value = {}
await campos();
}
/************************************************************************/
watchEffect(() => {
  if (visiblecrear.value) {
    //datoscamposCombos.value.precio = '0.00'
    //datoscamposCombos.value.cantidad = '1.00'
    //datoscamposCombos.value.precioproducto = '0.00'
  }
});
/************************************************************************/
const fetchAndSetupData = async () => {
const response =  await peticionesFetchOffline('getDataAsArray', 'combos');
    const jsonData = response;
    data.value = jsonData;
};
/************************************************************************/
const fetchProductos = async () => {
const response =  await peticionesFetchOffline('getDataAsArray', 'productos');
    const jsonData = response;
    productosArray.value = jsonData;
    nombresProductosArray.value = jsonData.map(prod=>prod.nombre);
};
/************************************************************************/
async function campos() {
  const campos = await arrayToObjetoFromTablaOffline('combos');
  datoscamposCombos.value = campos;
  camposOriginal.value = campos;
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
await crearTablaSiNoExisteOffline('combos', camposArray, toast);
usuarioLocal.value = JSON.parse(window.localStorage.getItem('usuarioLocal'))[0] || {};
await campos();
await fetchAndSetupData();
await fetchProductos();
});
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
                    const envioDatos = await peticionesFetchOffline('deleteAll', 'combos');
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
  const url = link.value+api.value+"/actualizarcampos/combos";
  if (!datoscampos.value) {
    console.error("Datos incompletos, no se puede actualizar.");
    return;
  }
  if (datoscampos.value.hasOwnProperty('created_at')) {
    datoscampos.value.updated_at = nfecha('timestamp');
  }
  const envioDatos = await peticionesFetchOffline('updateData', 'combos',JSON.stringify(datoscampos.value));
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
  const url = link.value+api.value+"/insertar/combos";


  if (datoscamposCombos.value.hasOwnProperty('created_at')) {
    datoscamposCombos.value.created_at = nfecha('timestamp');
    datoscamposCombos.value.updated_at = nfecha('timestamp');
  }
  delete(datoscamposCombos.value.precioproducto)
  delete(datoscamposCombos.value.cantidad)
  delete(datoscamposCombos.value.precio)
  const envioDatos = await peticionesFetchOffline('insertData', 'combos',JSON.stringify(datoscamposCombos.value));
  if (envioDatos[0] == 'ok') {
    fetchAndSetupData();
    toast.add({ severity: 'success', summary: 'Éxito', detail: 'Datos Agregados', life: 3000 });
    limpiarCamposCrear();
    visiblecrear.value = false;
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
                                const envioDatos = await peticionesFetchOffline('deleteEntry', 'combos',id);
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
const itemsCombos = ref([]);
const menu = ref(null);
const currentRowData = ref(null);
const toggleCombos = (event, rowData) => {
currentRowData.value = rowData;
itemsCombos.value = [
{ label: 'Editar', icon: 'pi pi-pencil', command: () => {
visible.value = true;
datoscampos.value = currentRowData.value;
} },
{ label: 'Eliminar', icon: 'pi pi-trash', command: () => {
            Swal.fire({
                title: 'Introduce la contraseña',
                input: 'password',
                inputPlaceholder: 'Contraseña',
                showCancelButton: true,
                confirmButtonText: 'Eliminar',
                cancelButtonText: 'Cancelar'
            }).then(async (result) => {
                if (result.isConfirmed) {
                    const contrasenaIngresada = result.value;
                    if (contrasenaIngresada === token.value || contrasenaIngresada === tokenCorto.value) {
                        const datosFactura = await peticionesFetchOffline('deleteEntry', 'combos',rowData.id);
                        if (datosFactura[0] == 'ok') {
                            toast.add({ severity: 'success', summary: 'Éxito', detail: 'Datos eliminados correctamente', life: 3000 });
                            await fetchAndSetupData()
                        } else {
                            toast.add({ severity: 'error', summary: 'Error', detail: 'Error al eliminar los datos', life: 3000 });
                        }
                    } else {
                        toast.add({ severity: 'error', summary: 'Error', detail: 'Contraseña incorrecta', life: 3000 });
                    }
                }
            });
        }
    },
];
menu.value.toggle(event);
};
/************************************************************************/
const filteredCombos = computed(() => {
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
const nuevoProducto = ref('');
const listaProductos = ref([]);

const agregarProducto = () => {
  if (nuevoProducto.value.trim() !== '') {
    listaProductos.value.push(nuevoProducto.value);
    nuevoProducto.value = '';
    actualizarProductosTextarea();
  }
};

const actualizarProductosTextarea = () => {
  datoscamposCombos.value.productos = JSON.stringify(listaProductos.value);
};

/****************************************************************************/
const prodSelected = ref(null)
const handleSelectCompleteproductoprincipal = (selected) => {
  const datosPro = productosArray.value.find(prod => prod.nombre == selected.value);
  if (datosPro) {
    visiblecrear.value = false;
    if (selected.value.trim() !== '') {
      Swal.fire({
        title: 'Are you sure?',
        text: `Do you want to select ${datosPro.nombre}?`,
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Agregar',
        cancelButtonText: 'Editar'
      }).then((result) => {
        if (result.isConfirmed) {
          prodSelected.value = datosPro;
          nuevoProducto.value = datosPro.nombre;
          datoscamposCombos.value.precioproducto = datosPro.precio_venta;
          datoscamposCombos.value.cantidad = '1.00'

         fnAgregarProducto()
          toast.add({
            severity: 'success',
            summary: 'Ok',
            detail: 'Producto Agregado',
            life: 3000
          });
           visiblecrear.value = true;

        } else {
          prodSelected.value = datosPro;
          nuevoProducto.value = datosPro.nombre;
          datoscamposCombos.value.precioproducto = datosPro.precio_venta;
          visiblecrear.value = true;
        }
      });
    }
  }
};

/****************************************************************************/
const fnLimpiarProductos = () => {
  listaProductos.value = [];
  datoscamposCombos.value.productos = '';
  nuevoProducto.value = '';
};
/****************************************************************************/
const fnAgregarProducto = () => {
  if (nuevoProducto.value === '') {
    toast.add({
      severity: 'error',
      summary: 'Upps',
      detail: 'Debe agregar un Producto',
      life: 3000
    });
    return;
  }

 listaProductos.value.push({
    id: prodSelected.value.id,
    nombre: prodSelected.value.nombre,
    cantidad: parseFloat(datoscamposCombos.value.cantidad),
    precio: parseFloat(datoscamposCombos.value.precioproducto)
  });

  // Calculate the total price for all products in the list
  const totalPrice = listaProductos.value.reduce((total, producto) => {
    return total + (producto.precio * producto.cantidad);
  }, 0);

  datoscamposCombos.value.precio = totalPrice.toFixed(2);

  nuevoProducto.value = '';
  prodSelected.value = null;
  datoscamposCombos.value.cantidad = '1.00';
  datoscamposCombos.value.precioproducto = '0.00';

  // Call any additional functions as needed
  actualizarProductosTextarea();
};

const fnEliminarProducto = ()=>{

}
/****************************************************************************/
const fnCambiarPrecio = () => {
  const totalPrice = listaProductos.value.reduce((total, producto) => {
    return total + (producto.precio * producto.cantidad);
  }, 0);

  const newPrice = parseFloat(datoscamposCombos.value.precio);

  // Check if the discount product already exists
  const discountProductIndex = listaProductos.value.findIndex(producto => producto.id === '0' && producto.nombre === 'DESCUENTO');

  if (newPrice < totalPrice) {
    // Calculate the discount
    const discount = totalPrice - newPrice;

    if (discountProductIndex !== -1) {
      // Discount already exists, update the price to the previous value
      datoscamposCombos.value.precio = totalPrice.toFixed(2)
      toast.add({
        severity: 'info',
        summary: 'Descuento Ya Existe',
        detail: 'El descuento ya está aplicado',
        life: 3000
      });
    } else {
      // Add a discount product to the list
      listaProductos.value.push({
        id: '0',
        nombre: 'DESCUENTO',
        cantidad: 1,
        precio: -discount
      });
      actualizarProductosTextarea();
      toast.add({
        severity: 'success',
        summary: 'Descuento Aplicado',
        detail: `Descuento de ${discount.toFixed(2)} agregado`,
        life: 3000
      });
    }
  } else {
    // If the new price is not less, update the total price
    datoscamposCombos.value.precio = totalPrice.toFixed(2);
  }
};

/****************************************************************************/

</script>
<template>
<main class="content-wrapper">
  <div class="w-full px-4 mt-5">
<Card>
      <template #content>
<div class="grid grid-cols-12 gap-4">
      <div class="md:col-span-12">
        <fieldset class="border p-3 rounded mb-2">
          <legend class="float-none w-auto px-2">Datos de Combos</legend>
            <div class="grid grid-cols-12 gap-4">
              <div class="sm:col-span-12">
                <a href="#" @click="fetchAndSetupData" class="btn btn-warning text-white cartelito" data-toggle="tooltip" title="Recargar" id="reload"><i class="icon-arrows-cw"></i></a>
               <a href="#" class="btn btn-success cartelito ms-1" title="Agregar Nuevo" id="nuevoregistro" @click="visiblecrear = true"><i class="icon-plus"></i></a>
               <a href="#" @click="borrarSeleccionados" class="btn btn-danger btnaccion cartelito ms-1" data-toggle="tooltip" title="Borrar Selección" id="borrador"><i class="icon-trash-4"></i></a>
<a href="#" v-if="usuarioLocal.usuario =='Soporte'"  @click="borrarTodo" class="btn btn-danger btnaccion cartelito float-end ms-1" data-toggle="tooltip" title="Borrar Todo" id="borrartodo"><i class="icon-trash"></i> Borrar Todo</a>
              </div>
            </div>
        </fieldset>
      </div>
      <div class="md:col-span-12">
 <div style="display: flex; justify-content: flex-end;">
 <input v-model="searchQuery" placeholder="Buscar combos..." class="p-inputtext p-component" style="margin-bottom: 10px;" />
</div>
<DataTable
    :value="filteredCombos"
    scrollable
    scrollHeight="600px"
    dataKey="id"
    paginator
    :rows="10"
    v-model:selection="selectedItems"
    selectionMode="single"
    :rowsPerPageOptions="[5, 10, 20, 50]"
    tableStyle="min-width: 50rem">
    <Column selectionMode="multiple" headerStyle="width: 3rem"></Column>
    <Column header="Options">
        <template #body="slotProps">
            <Button
                icon="pi pi-cog"
                @click="toggleCombos($event, slotProps.data)"
                aria-haspopup="true"
                aria-controls="overlay_menu_factura"
            />
            <Menu
                ref="menu"
                id="overlay_menu_Combos"
                :model="itemsCombos"
                :popup="true"
            />
        </template>
    </Column>
    <Column field="nombre" header="Nombre"></Column>
<Column field="productos" header="Productos"></Column>
<Column field="usuario" header="Usuario"></Column>

</DataTable>
      </div>
    </div>
      </template>
</Card>
<!-- ////////////////////////////////////////////////////////////////////////////////////////// -->
<Dialog v-model:visible="visible" :position="position" modal header="Modificar Combos" :style="{ width: '50rem' }" :breakpoints="{ '1199px': '75vw', '575px': '90vw' }">
            <template #header>
                <div class="inline-flex align-items-center justify-content-center gap-2">
                    <span class="font-bold white-space-nowrap">Modal Editar</span>
                </div>
            </template>
  <fieldset class="border p-3 rounded mb-2">
    <legend class="float-none w-auto px-2">Combos</legend>
     <form id="formularioActualizarCombos" action="" method="">
         <div  style="margin-top: 15px;color: #34AAB2;" class="grid grid-cols-12 gap-4">
<div class="form-group col-span-12" hidden>
<label for="id-Actualizador">ID</label>
<input type="input" v-model="datoscampos.id" name="id"  class="form-control" id="id-Actualizador" readonly placeholder="id"  maxlength="11">
</div>

<div class="form-group col-span-12 sm:col-span-12 md:col-span-12 lg:col-span-12 xl:col-span-12" >
<label for="nombre-Actualizador">NOMBRE</label>
<input type="input" v-model="datoscampos.nombre" name="nombre"  class="form-control" id="nombre-Actualizador"  placeholder="nombre" v-mayuscula maxlength="250">
</div>



<div class="form-group col-span-12 sm:col-span-12 md:col-span-12 lg:col-span-12 xl:col-span-12" >
<label for="productos-Actualizador">PRODUCTOS</label>

<div class="table-responsive">
  <div v-html="generarTablaFromStringJSON(datoscampos.productos)" class="border p-3 rounded mb-2"></div>
</div>

</div>
<div class="form-group col-span-6" hidden>
<label for="created_at-Actualizador">CREATED_AT</label>
<input type="input" v-model="datoscampos.created_at" name="created_at"  class="form-control" id="created_at-Actualizador"  placeholder="created_at"  maxlength="">
</div>
<div class="form-group col-span-6" hidden>
<label for="updated_at-Actualizador">UPDATED_AT</label>
<input type="input" v-model="datoscampos.updated_at" name="updated_at"  class="form-control" id="updated_at-Actualizador"  placeholder="updated_at"  maxlength="">
</div>
<div class="form-group col-span-12" hidden>
<label for="usuario-Actualizador">USUARIO</label>
<input type="input" v-model="datoscampos.usuario" name="usuario"  class="form-control" id="usuario-Actualizador"  placeholder="usuario"  maxlength="250">
</div>

        </div>
        </form>
</fieldset>
            <template #footer>
                <Button label="Cancel" text severity="secondary" @click="visible = false" autofocus />
                <Button label="Save" outlined severity="secondary" @click="funcionActualizar" autofocus />
            </template>
        </Dialog>
<!-- ////////////////////////////////////////////////////////////////////////////////////////// -->
<Dialog v-model:visible="visiblecrear" :position="position" modal header="Crear Combos" :style="{ width: '50rem' }" :breakpoints="{ '1199px': '75vw', '575px': '90vw' }">
            <template #header>
                <div class="inline-flex align-items-center justify-content-center gap-2">
                    <span class="font-bold white-space-nowrap">Modal Crear</span>
                </div>
            </template>
  <fieldset class="border p-3 rounded mb-2">
    <legend class="float-none w-auto px-2">Combos</legend>
     <form id="formularioActualizarCombos" action="" method="">
         <div  style="margin-top: 15px;color: #34AAB2;" class="grid grid-cols-12 gap-4">

<div class="form-group col-span-12 sm:col-span-12 md:col-span-12 lg:col-span-12 xl:col-span-12">
  <label for="nuevoProducto">Añadir Producto</label>
    <awesomplete
       class="form-control"
       v-model="nuevoProducto"
       @selectComplete="handleSelectCompleteproductoprincipal"
       :list="nombresProductosArray" aria-describedby="basic-addon2" style="border: 2px #f0fdf4 solid;border-radius: 5px;">
     </awesomplete>

  </div>

<div class="form-group col-span-12 md:col-span-4">
  <label for="cantidad">Cantidad</label>
<input type="input" v-model="datoscamposCombos.cantidad" name="cantidad"  class="form-control " id="cantidadAgregarDatos" v-solonumeros v-decimales v-numeroFocusinOut  maxlength="250">
</div>

<div class="form-group col-span-12 md:col-span-4">
  <label for="cantidad">Precio Producto</label>
<input type="input" v-model="datoscamposCombos.precioproducto" name="cantidad"  class="form-control " id="precioAgregarDatos" v-solonumeros v-decimales v-numeroFocusinOut  maxlength="250">
</div>

<div class="form-group col-span-12 md:col-span-4">
  <label for="accion">Acción Requerida</label>
<Button label="Agregar" severity="secondary" @click="fnAgregarProducto" />
<Button label="Eliminar" severity="secondary" @click="fnEliminarProducto" />
</div>


<div class="form-group col-span-12 sm:col-span-12 md:col-span-12 lg:col-span-12 xl:col-span-12" >
<label for="productosAgregarDatos">PRODUCTOS</label>

<div class="table-responsive">
  <div v-html="generarTablaFromStringJSON(datoscamposCombos.productos)" class="border p-3 rounded mb-2"></div>
</div>


</div>

<div class="form-group col-span-12 md:col-span-8" >
<label for="nombreAgregarDatos">NOMBRE</label>
<input type="input" v-model="datoscamposCombos.nombre" name="nombre"  class="form-control mayusc" id="nombreAgregarDatos" v-mayuscula placeholder="nombre" maxlength="250">
</div>

<div class="form-group col-span-12 md:col-span-4" >
<label for="precioAgregarDatos">PRECIO</label>
<input type="input" v-model="datoscamposCombos.precio" name="precio"  class="form-control mayusc" id="precioAgregarDatos" v-solonumeros v-decimales v-numeroFocusinOut @change="fnCambiarPrecio" maxlength="250">
</div>

<div class="form-group col-span-6" hidden>
<label for="created_atAgregarDatos">CREATED_AT</label>
<input type="input" v-model="datoscamposCombos.created_at" name="created_at"  class="form-control " id="created_atAgregarDatos"  placeholder="created_at" maxlength="">
</div>
<div class="form-group col-span-6" hidden>
<label for="updated_atAgregarDatos">UPDATED_AT</label>
<input type="input" v-model="datoscamposCombos.updated_at" name="updated_at"  class="form-control " id="updated_atAgregarDatos"  placeholder="updated_at" maxlength="">
</div>
<div class="form-group col-span-12" hidden>
<label for="usuarioAgregarDatos">USUARIO</label>
<input type="input" v-model="datoscamposCombos.usuario" name="usuario"  class="form-control " id="usuarioAgregarDatos"  placeholder="usuario" maxlength="250">
</div>

        </div>
        </form>
</fieldset>
            <template #footer>
                <Button label="Limpiar" text severity="secondary" @click="fnLimpiarProductos"  />
                <Button label="Cancel" text severity="secondary" @click="visiblecrear = false"  />
                <Button label="Crear" outlined severity="secondary" @click="funcionCrear" autofocus />
            </template>
        </Dialog>
<!-- ////////////////////////////////////////////////////////////////////////////////////////// -->
<Toast />
  </div>
</main>
</template>
<style scoped>
</style>
