<script setup>
import { ref, onMounted, nextTick, watchEffect, computed,watch } from 'vue';
import { useRouter,useRoute } from 'vue-router';
const router = useRouter();
import axios from 'axios';
import { enviarDatosPorPost, eliminarDatos, obtenerIdsSeleccionados, borrarTodoslosDatos, lenguajeDataTable, nfecha, decimales, arrayToObjetoFromTabla, peticionesFetch,enviarDatosLocalStorage, encryptarPassword, envioElectron, mensajetoast, peticiones,peticionesFetchOffline, lasMayusculas } from '../../funciones/funciones.js';
import bcrypt from 'bcryptjs';
import Swal from 'sweetalert2';
import { useToast } from "primevue/usetoast";
const toast = useToast();
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
/************************************************************************/
const almacenes = ref([])
const empresas = ref([])
/************************************************************************/
import { useDatosEmpresa } from '../../stores';
const datosEmpresa = useDatosEmpresa();
const link = ref('');
const api = ref('');
const token = ref('');
const patronTelefono = ref('');
const linkImpresora = ref('');
const patroncedula = ref('');
const tokenCifrado = ref('');
/************************************************************************/
/************************************************************************/
watchEffect(() => {
  // Aqui para vigilar eventos
});
/************************************************************************/
const totalInventario = ref(0);
const totalGanancias = ref(0);
/************************************************************************/
const searchQuery = ref('');
const productosArray = ref([]);
const selectedFilter = ref('all');
const selectedCategory = ref('all');
const imeiDisponiblesArray = ref([]);
/************************************************************************/
const datosConfiguracion = ref({});
/************************************************************************/
const formatCurrency = (value) => {
  const simbolo = datosConfiguracion.value?.simbolo || '$';
  return `${simbolo}${decimales(Number(value) || 0)}`;
};

const calcularPromedio = (arr, campo) => {
  if (!Array.isArray(arr) || arr.length === 0) return 0;
  const suma = arr.reduce((acc, item) => acc + (Number(item?.[campo]) || 0), 0);
  return suma / arr.length;
};

const fetchAndSetupData = async () => {
  const [productosResponse, imeiResponse] = await Promise.all([
    peticionesFetchOffline('getDataAsArray', 'productos'),
    peticionesFetchOffline('getDataArrayByCondition', 'imei', 'estado', 'DISPONIBLE')
  ]);

  const jsonData = Array.isArray(productosResponse) ? productosResponse : [];
  imeiDisponiblesArray.value = Array.isArray(imeiResponse) ? imeiResponse : [];

  productosArray.value = jsonData.map((product) => {
    const esCelular = product.categoria === 'CELULARES';

    if (!esCelular) {
      const precioCompra = Number(product.precio_compra) || 0;
      const precioVenta = Number(product.precio_venta) || 0;
      const stock = Number(product.stock) || 0;
      return {
        ...product,
        precio_compra: precioCompra,
        precio_venta: precioVenta,
        stock,
        ganancia_unitaria: precioVenta - precioCompra,
        inversion: precioCompra * stock,
        fuente_precio: 'PRODUCTO'
      };
    }

    const imeisProducto = imeiDisponiblesArray.value.filter(
      (imei) => String(imei.id_equi) === String(product.id)
    );

    const stockReal = imeisProducto.length;
    const precioCompraImei = stockReal > 0
      ? calcularPromedio(imeisProducto, 'precio_compra')
      : (Number(product.precio_compra) || 0);
    const precioVentaImei = stockReal > 0
      ? calcularPromedio(imeisProducto, 'precio_venta')
      : (Number(product.precio_venta) || 0);

    return {
      ...product,
      precio_compra: Number(precioCompraImei) || 0,
      precio_venta: Number(precioVentaImei) || 0,
      stock: stockReal,
      ganancia_unitaria: (Number(precioVentaImei) || 0) - (Number(precioCompraImei) || 0),
      inversion: (Number(precioCompraImei) || 0) * stockReal,
      fuente_precio: 'IMEI'
    };
  });
};
/************************************************************************/
const fetchDataEmpresas = async () => {
  try {
   const response = await peticionesFetchOffline('getDataAsArray', 'empresa');
    const soloNombres = response.map(emp=>emp.nombre)
    soloNombres.push('TODOS')
    empresas.value = soloNombres;
    almacenes.value = datosEmpresa.empresa.nombre
    /*********************************************/
  } catch (error) {
    console.error('Error fetching data', error);
    toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to fetch data', life: 3000 });
  }
};
/************************************************************************/
onMounted(async () => {
 
    const datosJSON = await envioElectron('datosarchivo');
    link.value = datosJSON.VITE_LINKURL;
    api.value = datosJSON.VITE_LINK_API;
    token.value = datosJSON.VITE_TOKEN;
    patronTelefono.value = datosJSON.VITE_PATRON_TELEFONO;
    linkImpresora.value = datosJSON.VITE_IMPRESORA_LOCAL;

  tokenCifrado.value = await encryptarPassword(token.value, 10);
  datosConfiguracion.value = JSON.parse(window.localStorage.getItem('configuracion'));
  await fetchDataEmpresas();
  await fetchAndSetupData();


});
/************************************************************************/
const filteredProducts = computed(() => {
  let filtered = productosArray.value;

  if (searchQuery.value) {
    filtered = filtered.filter(product => {
      return Object.values(product).some(value =>
        String(value).toLowerCase().includes(searchQuery.value.toLowerCase())
      );
    });
  }

  if (selectedFilter.value === 'outOfStock') {
    filtered = filtered.filter(product => product.stock <= 0);
  } else if (selectedFilter.value === 'inStock') {
    filtered = filtered.filter(product => product.stock > 0);
  } else if (selectedFilter.value === 'alert') {
    filtered = filtered.filter(product => product.stock > 0 && product.stock <= product.alerta);
  }

  if (selectedCategory.value !== 'all') {
    filtered = filtered.filter(product => product.categoria === selectedCategory.value);
  }

    if (almacenes.value !== 'TODOS') {
    filtered = filtered.filter(product => product.almacen === almacenes.value);
  }

  return filtered;
});
/************************************************************************/
const updateTotals = () => {
  const productosFiltrados = filteredProducts.value;

  // Calcular el total del inventario
/*  totalInventario.value = productosFiltrados.reduce((acc, product) => acc + product.inversion, 0);*/
  totalInventario.value = productosFiltrados.reduce((acc, product) => {
    const totalInversion = Number(product.precio_compra) * Number(product.stock);
    return acc + totalInversion
  }, 0);

  // Calcular el total de ganancias
  totalGanancias.value = productosFiltrados.reduce((acc, product) => {
    const gananciaPorUnidad = Number(product.ganancia_unitaria ?? (Number(product.precio_venta) - Number(product.precio_compra)));
    const gananciaTotalProducto = gananciaPorUnidad * product.stock;
    return acc + gananciaTotalProducto;
  }, 0);
};

watch(filteredProducts, updateTotals, { immediate: true });
/************************************************************************/
const onRowSelect = (event) => {
  console.log("event", event);
    const texto = `<div><h2>${event.data.nombre}</h2></div>`;
    Swal.fire({
        title: 'Producto Seleccionado',
        html: texto,
        icon: 'info',
        showCancelButton: true,
        confirmButtonText: 'Modificar Producto',
        cancelButtonText: 'Cancelar'
    }).then((result) => {
        if (result.isConfirmed) {
           router.push({ path: `/editarproductos/${event.data.id}` });
        } else if (result.dismiss === Swal.DismissReason.cancel) {
        }
    });
};
/************************************************************************/
const getRowClass = (data) => {
  if (Number(data.stock) <= 0) {
    return 'row-red';
  } else if (Number(data.stock) > 0 && Number(data.stock) <= Number(data.alerta)) {
    return 'row-yellow';
  } else if (Number(data.stock) > Number(data.alerta)) {
    return 'row-green';
  }
  return '';
};

/************************************************************************/
const uniqueCategories = computed(() => {
  const categories = productosArray.value.map(product => product.categoria);
  return [...new Set(categories)];
});

const celularesFiltrados = computed(() => {
  return filteredProducts.value.filter((product) => product.categoria === 'CELULARES').length;
});


/************************************************************************/
const descargarInventario = ()=>{

         const data = productosArray.value.map(item => ({
            cod: item.codigo,
            producto: item.nombre,
            cantidad: item.stock,

        }));

        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Inventario');
        const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
        const blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
        const link = document.createElement('a');
        link.href = window.URL.createObjectURL(blob);
        link.download = 'Inventario-'+nfecha('fechaAmericana')+'.xlsx';
        link.click();
}
/************************************************************************/
const fnProductosInventario = async ()=>{
   const productosArray = await peticionesFetch(`${link.value}${api.value}`,'datosarraypost',{'tabla':'productos'},tokenCifrado.value,'POST');
  const inventario = productosArray
  const datosEmpresa = JSON.stringify(enviarDatosLocalStorage() )
  const impresion = window.electron.ipcRenderer.invoke('ticketinventario',JSON.stringify(inventario),datosEmpresa,true,false,false);
}
/************************************************************************/
const generarPDFInventarioEmbedido = async () => {
  try {
    const doc = new jsPDF('l', 'mm', 'a4');
    const hoy = nfecha('fecha');
    const hora = nfecha('hora');
    const simbolo = datosConfiguracion.value?.simbolo || '$';
    const plural = datosConfiguracion.value?.plural || '';

    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, 297, 26, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.text('Reporte Profesional de Inventario', 14, 11);
    doc.setFontSize(10);
    doc.text(`Fecha: ${hoy}  Hora: ${hora}`, 14, 18);
    doc.text(`Almacen: ${almacenes.value}  Categoria: ${selectedCategory.value}`, 220, 18);

    doc.setTextColor(15, 23, 42);
    doc.setFontSize(11);
    doc.text(`Total Inventario: ${simbolo}${decimales(totalInventario.value)} ${plural}`, 14, 34);
    doc.text(`Ganancia Proyectada: ${simbolo}${decimales(totalGanancias.value)} ${plural}`, 102, 34);
    doc.text(`Productos Filtrados: ${filteredProducts.value.length}`, 206, 34);

    const body = filteredProducts.value.map((p) => [
      p.codigo || '',
      p.nombre || '',
      p.categoria || '',
      p.proveedor || '',
      p.fuente_precio || 'PRODUCTO',
      `${simbolo}${decimales(Number(p.precio_compra) || 0)}`,
      `${simbolo}${decimales(Number(p.precio_venta) || 0)}`,
      `${simbolo}${decimales(Number(p.ganancia_unitaria ?? ((Number(p.precio_venta) || 0) - (Number(p.precio_compra) || 0))) || 0)}`,
      Number(p.stock) || 0,
      `${simbolo}${decimales(Number(p.inversion) || 0)}`,
      p.impuestos ?? ''
    ]);

    autoTable(doc, {
      startY: 40,
      head: [['Codigo', 'Producto', 'Categoria', 'Proveedor', 'Fuente', 'Costo', 'Venta', 'Ganancia U.', 'Stock', 'Inversion', 'Impuesto']],
      body,
      styles: { fontSize: 8, cellPadding: 1.8, overflow: 'linebreak' },
      headStyles: { fillColor: [30, 64, 175], textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      columnStyles: {
        0: { cellWidth: 18 },
        1: { cellWidth: 52 },
        2: { cellWidth: 24 },
        3: { cellWidth: 32 },
        4: { cellWidth: 18 },
        5: { halign: 'right', cellWidth: 20 },
        6: { halign: 'right', cellWidth: 20 },
        7: { halign: 'right', cellWidth: 22 },
        8: { halign: 'center', cellWidth: 14 },
        9: { halign: 'right', cellWidth: 24 },
        10: { halign: 'center', cellWidth: 16 }
      },
      didDrawPage: () => {
        const pages = doc.getNumberOfPages();
        const page = doc.getCurrentPageInfo().pageNumber;
        doc.setFontSize(8);
        doc.setTextColor(100);
        doc.text(`Pagina ${page} de ${pages}`, 270, 205);
      }
    });

    const pdfBlob = doc.output('blob');
    const pdfUrl = URL.createObjectURL(pdfBlob);

    const res = await Swal.fire({
      title: 'Vista previa del reporte',
      width: '96vw',
      html: `<iframe src="${pdfUrl}" style="width:100%;height:75vh;border:1px solid #e2e8f0;border-radius:12px;"></iframe>`,
      showCancelButton: true,
      showDenyButton: true,
      confirmButtonText: 'Descargar PDF',
      denyButtonText: 'Imprimir',
      cancelButtonText: 'Cerrar'
    });

    if (res.isConfirmed) {
      const a = document.createElement('a');
      a.href = pdfUrl;
      a.download = `Inventario-Detallado-${nfecha('fechaAmericana')}.pdf`;
      a.click();
    } else if (res.isDenied) {
      const printWindow = window.open(pdfUrl, '_blank');
      if (!printWindow) {
        toast.add({ severity: 'warn', summary: 'Aviso', detail: 'No se pudo abrir la ventana de impresion', life: 2500 });
      }
    }

    URL.revokeObjectURL(pdfUrl);
  } catch (error) {
    console.error('Error generando PDF embebido:', error);
    toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo generar el reporte PDF', life: 3000 });
  }
}
/************************************************************************/
</script>

<template>
<main class="content-wrapper">
  <div class="containerS mx-auto px-4 py-6">

    <!-- Header Section -->
    <div class="mb-6">
      <h1 class="text-3xl font-bold text-gray-800 mb-2">Gestión de Inventario</h1>
      <p class="text-gray-600">Administra y monitorea el stock de productos en tiempo real</p>
    </div>

    <!-- Stats Cards -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">

      <!-- Total Inventario Card -->
      <Card class="inventario-card">
        <template #content>
          <div class="stat-card-content">
            <div class="stat-icon-wrapper bg-gradient-blue">
              <i class="pi pi-shopping-cart text-white text-3xl"></i>
            </div>
            <div class="stat-info">
              <span class="stat-label">Total en Inventario</span>
              <div class="stat-value">{{datosConfiguracion.simbolo+decimales(totalInventario)+' '+datosConfiguracion.plural}}</div>
            </div>
          </div>
        </template>
      </Card>

      <!-- Ganancias Card -->
      <Card class="inventario-card">
        <template #content>
          <div class="stat-card-content">
            <div class="stat-icon-wrapper bg-gradient-orange">
              <i class="pi icon-money text-white text-3xl"></i>
            </div>
            <div class="stat-info">
              <span class="stat-label">Ganancias Proyectadas</span>
              <div class="stat-value">{{datosConfiguracion.simbolo+decimales(totalGanancias)+' '+datosConfiguracion.plural}}</div>
            </div>
          </div>
        </template>
      </Card>

      <!-- Total Products Card -->
      <Card class="inventario-card">
        <template #content>
          <div class="stat-card-content">
            <div class="stat-icon-wrapper bg-gradient-green">
              <i class="pi pi-box text-white text-3xl"></i>
            </div>
            <div class="stat-info">
              <span class="stat-label">Total Productos</span>
              <div class="stat-value">{{ filteredProducts.length }}</div>
            </div>
          </div>
        </template>
      </Card>

      <!-- Categories Card -->
      <Card class="inventario-card">
        <template #content>
          <div class="stat-card-content">
            <div class="stat-icon-wrapper bg-gradient-purple">
              <i class="pi pi-th-large text-white text-3xl"></i>
            </div>
            <div class="stat-info">
              <span class="stat-label">Categorías</span>
              <div class="stat-value">{{ uniqueCategories.length }}</div>
            </div>
          </div>
        </template>
      </Card>

    </div>

    <!-- Main Content Card -->
    <Card class="inventario-main-card">
      <template #header>
        <div class="card-header-modern">
          <div class="flex items-center gap-3">
            <div class="icon-wrapper-modern bg-indigo-500">
              <i class="pi pi-database text-white text-2xl"></i>
            </div>
            <div>
              <h2 class="text-xl font-bold text-gray-800">Control de Inventario</h2>
              <p class="text-sm text-gray-500">Filtros y acciones rápidas</p>
            </div>
          </div>
        </div>
      </template>

      <template #content>
        <!-- Filters and Actions Section -->
        <div class="filters-section mb-6">

          <!-- Filters Row -->
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">

            <div class="filter-group">
              <label class="filter-label">
                <i class="pi pi-filter text-gray-500 mr-2"></i>
                Estado del Stock
              </label>
              <Dropdown
                v-model="selectedFilter"
                :options="[
                  { label: 'Todos los productos', value: 'all' },
                  { label: 'Productos sin stock', value: 'outOfStock' },
                  { label: 'Productos con stock', value: 'inStock' },
                  { label: 'Productos en alerta', value: 'alert' }
                ]"
                optionLabel="label"
                optionValue="value"
                class="w-full filter-dropdown"
                fluid
              />
            </div>
            <div class="filter-group">
              <label class="filter-label">
                <i class="pi pi-tag text-gray-500 mr-2"></i>
                Categoría
              </label>
              <Dropdown
                v-model="selectedCategory"
                :options="[{ label: 'Todas las categorías', value: 'all' }, ...uniqueCategories.map(cat => ({ label: cat, value: cat }))]"
                optionLabel="label"
                optionValue="value"
                class="w-full filter-dropdown"
                fluid
              />
            </div>

            <div class="filter-group">
              <label class="filter-label">
                <i class="pi pi-building text-gray-500 mr-2"></i>
                Almacén
              </label>
              <Dropdown
                id="situacion"
                v-model="almacenes"
                :options="empresas"
                class="w-full filter-dropdown"
                fluid
              />
            </div>

            <div class="filter-group">
              <label class="filter-label">
                <i class="pi pi-search text-gray-500 mr-2"></i>
                Buscar
              </label>
              <InputGroup>
                <InputGroupAddon>
                  <i class="pi pi-search text-slate-500"></i>
                </InputGroupAddon>
                <InputText
                  v-model="searchQuery"
                  placeholder="Nombre, codigo, proveedor..."
                  class="w-full filter-input"
                />
                <InputGroupAddon v-if="searchQuery">
                  <Button icon="pi pi-times" text severity="secondary" @click="searchQuery = ''" />
                </InputGroupAddon>
              </InputGroup>
            </div>

          </div>

          <div class="flex flex-wrap items-center gap-2 mb-4">
            <span class="pill pill-slate">Filtrados: {{ filteredProducts.length }}</span>
            <span class="pill pill-indigo">CELULARES: {{ celularesFiltrados }}</span>
            <span class="pill pill-emerald">Almacen: {{ almacenes }}</span>
          </div>

          <!-- Actions Row -->
          <div class="flex flex-wrap gap-3 justify-end">
            <ButtonGroup>
              <Button
                label="Imprimir"
                @click="fnProductosInventario"
                icon="pi pi-print"
                severity="contrast"
                class="action-btn-inventario"
              />
              <Button
                label="Descargar"
                @click="descargarInventario"
                icon="pi pi-download"
                severity="success"
                class="action-btn-inventario"
              />
              <Button
                label="Reporte PDF"
                @click="generarPDFInventarioEmbedido"
                icon="pi pi-file-pdf"
                severity="danger"
                class="action-btn-inventario"
              />
              <Button
                as="router-link"
                label="Pasar Inventario"
                icon="pi pi-plus-circle"
                to="/crearinventario_accesorios"
                severity="info"
                class="action-btn-inventario"
              />
            </ButtonGroup>
          </div>

        </div>

        <!-- DataTable Section -->
        <div class="datatable-wrapper">
          <DataTable
            :value="filteredProducts"
            scrollable
            scrollHeight="600px"
            dataKey="id"
            paginator
            :rows="10"
            @rowSelect="onRowSelect"
            selectionMode="single"
            :rowsPerPageOptions="[5, 10, 20, 50]"
            tableStyle="min-width: 50rem"
            :rowClass="getRowClass"
            class="inventario-datatable"
          >
            <Column field="codigo" header="Codigo"></Column>
            <Column field="nombre" header="Producto"></Column>
            <Column field="categoria" header="Categoria"></Column>
            <Column field="proveedor" header="Proveedor"></Column>
            <Column field="fuente_precio" header="Fuente Precio">
              <template #body="slotProps">
                <span :class="slotProps.data.fuente_precio === 'IMEI' ? 'price-source-imei' : 'price-source-producto'">
                  {{ slotProps.data.fuente_precio }}
                </span>
              </template>
            </Column>
            <Column field="precio_compra" header="Costo">
              <template #body="slotProps">
                <span class="money-cell">{{ formatCurrency(slotProps.data.precio_compra) }}</span>
              </template>
            </Column>
            <Column field="precio_venta" header="Precio Venta">
              <template #body="slotProps">
                <span class="money-cell money-sale">{{ formatCurrency(slotProps.data.precio_venta) }}</span>
              </template>
            </Column>
            <Column field="ganancia_unitaria" header="Ganancia U.">
              <template #body="slotProps">
                <span class="money-cell" :class="Number(slotProps.data.ganancia_unitaria) >= 0 ? 'text-emerald-600' : 'text-red-600'">
                  {{ formatCurrency(slotProps.data.ganancia_unitaria) }}
                </span>
              </template>
            </Column>
            <Column field="impuestos" header="Impuesto"></Column>
            <Column field="stock" header="Stock">
              <template #body="slotProps">
                <span :class="Number(slotProps.data.stock) <= 0 ? 'stock-badge stock-danger' : Number(slotProps.data.stock) <= Number(slotProps.data.alerta) ? 'stock-badge stock-warn' : 'stock-badge stock-ok'">
                  {{ slotProps.data.stock }}
                </span>
              </template>
            </Column>
            <Column field="inversion" header="Inversion">
              <template #body="slotProps">
                <span class="money-cell">{{ formatCurrency(slotProps.data.inversion) }}</span>
              </template>
            </Column>
          </DataTable>
        </div>

      </template>
    </Card>

    <Toast />
  </div>
</main>
</template>

<style scoped>
/* ===================================
   MODERN INVENTARIO COMPONENT STYLES
   =================================== */

/* Content Wrapper */
.content-wrapper {
  min-height: calc(100vh - 80px);
  background: linear-gradient(135deg, rgba(243, 244, 246, 0.5) 0%, rgba(229, 231, 235, 0.3) 100%);
}

/* Stats Cards */
.inventario-card {
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  border: 1px solid rgba(229, 231, 235, 0.8);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
  animation: slideIn 0.4s ease-out;
}

.inventario-card:hover {
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.15);
  transform: translateY(-4px);
}

.stat-card-content {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.5rem;
}

.stat-icon-wrapper {
  width: 64px;
  height: 64px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
  transition: all 0.3s ease;
}

.stat-icon-wrapper:hover {
  transform: scale(1.1) rotate(5deg);
}

.bg-gradient-blue {
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
}

.bg-gradient-orange {
  background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
}

.bg-gradient-green {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
}

.bg-gradient-purple {
  background: linear-gradient(135deg, #a855f7 0%, #9333ea 100%);
}

.stat-info {
  flex: 1;
}

.stat-label {
  display: block;
  font-size: 0.875rem;
  font-weight: 600;
  color: #6b7280;
  margin-bottom: 0.5rem;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: 800;
  color: #1f2937;
  line-height: 1.2;
}

/* Main Card */
.inventario-main-card {
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  border: 1px solid rgba(229, 231, 235, 0.8);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
  animation: slideIn 0.5s ease-out;
}

/* Card Header */
.card-header-modern {
  padding: 1.5rem;
  background: linear-gradient(135deg, rgba(249, 250, 251, 0.8) 0%, rgba(243, 244, 246, 0.6) 100%);
  border-bottom: 1px solid rgba(229, 231, 235, 0.6);
}

.icon-wrapper-modern {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  transition: all 0.3s ease;
}

.icon-wrapper-modern.bg-indigo-500 {
  background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
}

.icon-wrapper-modern:hover {
  transform: scale(1.1) rotate(5deg);
}

/* Filters Section */
.filters-section {
  padding: 0;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.filter-label {
  display: flex;
  align-items: center;
  font-size: 0.875rem;
  font-weight: 600;
  color: #374151;
  margin-bottom: 0.25rem;
}

.filter-input {
  padding: 0.75rem 1rem;
  border: 2px solid #e5e7eb;
  border-radius: 10px;
  font-size: 0.95rem;
  transition: all 0.3s ease;
  background: white;
}

.filter-input:focus {
  border-color: #6366f1;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
  outline: none;
}

.filter-input:hover {
  border-color: #9ca3af;
}

/* Filter Dropdown Styles */
.filter-dropdown {
  border-radius: 10px;
  transition: all 0.3s ease;
}

:deep(.filter-dropdown .p-dropdown) {
  border: 2px solid #e5e7eb;
  border-radius: 10px;
  transition: all 0.3s ease;
}

:deep(.filter-dropdown .p-dropdown:hover) {
  border-color: #9ca3af;
}

:deep(.filter-dropdown .p-dropdown:focus) {
  border-color: #6366f1;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
}

/* Info Pills */
.pill {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.35rem 0.7rem;
  border-radius: 9999px;
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.01em;
}

.pill-slate {
  background: #e2e8f0;
  color: #334155;
}

.pill-indigo {
  background: #e0e7ff;
  color: #4338ca;
}

.pill-emerald {
  background: #d1fae5;
  color: #065f46;
}

/* Table value accents */
.money-cell {
  font-weight: 700;
  color: #0f172a;
}

.money-sale {
  color: #047857;
}

.price-source-imei {
  display: inline-flex;
  padding: 0.2rem 0.55rem;
  border-radius: 9999px;
  background: #dbeafe;
  color: #1d4ed8;
  font-size: 0.72rem;
  font-weight: 700;
}

.price-source-producto {
  display: inline-flex;
  padding: 0.2rem 0.55rem;
  border-radius: 9999px;
  background: #f1f5f9;
  color: #334155;
  font-size: 0.72rem;
  font-weight: 700;
}

.stock-badge {
  display: inline-flex;
  min-width: 2.25rem;
  justify-content: center;
  padding: 0.2rem 0.55rem;
  border-radius: 9999px;
  font-size: 0.78rem;
  font-weight: 700;
}

.stock-ok {
  background: #dcfce7;
  color: #166534;
}

.stock-warn {
  background: #fef3c7;
  color: #92400e;
}

.stock-danger {
  background: #fee2e2;
  color: #991b1b;
}

/* Action Buttons */
.action-btn-inventario {
  padding: 0.75rem 1.5rem;
  font-weight: 600;
  border-radius: 10px;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.action-btn-inventario:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
}

/* DataTable Wrapper */
.datatable-wrapper {
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid #e5e7eb;
}

.inventario-datatable {
  font-size: 0.95rem;
}

/* Row Colors - Mantener funcionalidad original */
.row-red {
  color: #ef4444 !important;
  font-weight: 600;
}

.row-yellow {
  color: #f59e0b !important;
  font-weight: 600;
}

.row-green {
  color: #10b981 !important;
  font-weight: 500;
}

/* DataTable Custom Styles */
:deep(.inventario-datatable .p-datatable-thead > tr > th) {
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.05) 0%, rgba(139, 92, 246, 0.05) 100%);
  color: #374151;
  font-weight: 700;
  padding: 1rem;
  border-bottom: 2px solid #e5e7eb;
}

:deep(.inventario-datatable .p-datatable-tbody > tr) {
  transition: all 0.2s ease;
}

:deep(.inventario-datatable .p-datatable-tbody > tr:hover) {
  background: rgba(99, 102, 241, 0.05);
  cursor: pointer;
}

:deep(.inventario-datatable .p-datatable-tbody > tr > td) {
  padding: 1rem;
  border-bottom: 1px solid #f3f4f6;
}

:deep(.inventario-datatable .p-paginator) {
  background: #f9fafb;
  border-top: 1px solid #e5e7eb;
  padding: 1rem;
}

/* PrimeVue Card Override */
.inventario-card :deep(.p-card-content) {
  padding: 0;
}

.inventario-main-card :deep(.p-card-header) {
  padding: 0;
}

.inventario-main-card :deep(.p-card-content) {
  padding: 1.5rem;
}

.inventario-main-card :deep(.p-card-body) {
  padding: 0;
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

/* Responsive Adjustments */
@media (max-width: 768px) {
  .stat-card-content {
    padding: 1rem;
  }

  .stat-icon-wrapper {
    width: 56px;
    height: 56px;
  }

  .stat-value {
    font-size: 1.25rem;
  }

  .card-header-modern {
    padding: 1rem;
  }

  .filters-section {
    padding: 0;
  }

  .filter-label {
    font-size: 0.8125rem;
  }

  .filter-input {
    padding: 0.625rem 0.875rem;
    font-size: 0.875rem;
  }

  .action-btn-inventario {
    padding: 0.625rem 1rem;
    font-size: 0.875rem;
  }
}

/* Loading State */
.datatable-wrapper.loading {
  opacity: 0.6;
  pointer-events: none;
}
</style>

