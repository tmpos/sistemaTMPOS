<template>
  <div class="almacenes-container">
    <!-- Header -->
    <div class="page-header">
      <div class="header-content">
        <div class="header-left">
          <i class="pi pi-building header-icon"></i>
          <div>
            <h1 class="page-title">Gestión de Almacenes</h1>
            <p class="page-subtitle">Administra tus sucursales y puntos de venta</p>
          </div>
        </div>
        <Button
          label="Nuevo Almacén"
          icon="pi pi-plus"
          @click="abrirDialogoNuevo"
          severity="success"
          raised
        />
      </div>
    </div>

    <!-- Statistics Cards -->
    <div class="stats-grid">
      <Card class="stat-card stat-card-primary">
        <template #content>
          <div class="stat-content">
            <div class="stat-icon">
              <i class="pi pi-building"></i>
            </div>
            <div class="stat-info">
              <span class="stat-label">Total Almacenes</span>
              <span class="stat-value">{{ almacenes.length }}</span>
            </div>
          </div>
        </template>
      </Card>

      <Card class="stat-card stat-card-success">
        <template #content>
          <div class="stat-content">
            <div class="stat-icon">
              <i class="pi pi-check-circle"></i>
            </div>
            <div class="stat-info">
              <span class="stat-label">Almacén Actual</span>
              <span class="stat-value">{{ datosEmpresa.empresa?.nombre || 'N/A' }}</span>
            </div>
          </div>
        </template>
      </Card>

      <Card class="stat-card stat-card-info">
        <template #content>
          <div class="stat-content">
            <div class="stat-icon">
              <i class="pi pi-map-marker"></i>
            </div>
            <div class="stat-info">
              <span class="stat-label">Ubicaciones</span>
              <span class="stat-value">{{ almacenes.filter(a => a.direccion).length }}</span>
            </div>
          </div>
        </template>
      </Card>
    </div>

    <!-- Almacenes Cards Grid -->
    <div class="almacenes-cards-grid">
      <Card
        v-for="almacen in almacenes"
        :key="almacen.id"
        class="almacen-card"
        @click="(e) => toggleCardMenu(e, almacen)"
      >
        <template #content>
          <div class="almacen-card-content">
            <div class="almacen-card-header">
              <Avatar
                :label="almacen.nombre?.substring(0, 2)"
                shape="circle"
                size="xlarge"
                style="background-color: var(--primary-color); color: white"
              />
              <Tag
                v-if="almacen.nombre === datosEmpresa.empresa?.nombre"
                value="Activo"
                severity="success"
                class="almacen-active-tag"
              />
            </div>
            <div class="almacen-card-body">
              <h3 class="almacen-card-title">{{ almacen.nombre }}</h3>
              <div v-if="almacen.telefono" class="almacen-card-info">
                <i class="pi pi-phone"></i>
                <span>{{ almacen.telefono }}</span>
              </div>
              <div v-if="almacen.direccion" class="almacen-card-info">
                <i class="pi pi-map-marker"></i>
                <span>{{ almacen.direccion }}</span>
              </div>
              <div v-if="almacen.legal" class="almacen-card-info">
                <i class="pi pi-id-card"></i>
                <span>{{ almacen.legal }}</span>
              </div>
            </div>
          </div>
        </template>
      </Card>
    </div>

    <!-- Context Menu for Cards -->
    <Menu ref="cardMenu" :model="cardMenuItems" :popup="true" />

    <!-- Data Table -->
    <Card class="table-card">
      <template #content>
        <DataTable
          v-model:filters="filters"
          :value="almacenes"
          :loading="loading"
          :paginator="true"
          :rows="10"
          :rowsPerPageOptions="[5, 10, 20, 50]"
          dataKey="id"
          filterDisplay="row"
          :globalFilterFields="['nombre', 'direccion', 'telefono', 'email', 'legal']"
          showGridlines
          stripedRows
          class="p-datatable-sm"
          responsiveLayout="scroll"
        >
          <template #header>
            <div class="table-header">
              <span class="p-input-icon-left">
                <i class="pi pi-search" />
                <InputText
                  v-model="filters['global'].value"
                  placeholder="Buscar almacén..."
                  class="search-input"
                />
              </span>
              <Button
                icon="pi pi-refresh"
                @click="cargarAlmacenes"
                text
                rounded
                v-tooltip.top="'Actualizar'"
              />
            </div>
          </template>

          <template #empty>
            <div class="empty-state">
              <i class="pi pi-inbox"></i>
              <p>No hay almacenes registrados</p>
              <Button
                label="Crear Primer Almacén"
                icon="pi pi-plus"
                @click="abrirDialogoNuevo"
                text
              />
            </div>
          </template>

          <Column field="nombre" header="Nombre" sortable style="min-width: 200px">
            <template #body="{ data }">
              <div class="nombre-cell">
                <Avatar
                  v-if="data.imagen"
                  :image="data.imagen"
                  shape="circle"
                  size="large"
                />
                <Avatar
                  v-else
                  :label="data.nombre?.charAt(0)"
                  shape="circle"
                  size="large"
                  style="background-color: var(--primary-color); color: white"
                />
                <span class="nombre-text">{{ data.nombre }}</span>
              </div>
            </template>
          </Column>

          <Column field="telefono" header="Teléfono" sortable style="min-width: 150px">
            <template #body="{ data }">
              <div class="contact-cell">
                <i class="pi pi-phone"></i>
                <span>{{ data.telefono || 'N/A' }}</span>
              </div>
            </template>
          </Column>

          <Column field="email" header="Email" sortable style="min-width: 200px">
            <template #body="{ data }">
              <div class="contact-cell">
                <i class="pi pi-envelope"></i>
                <span>{{ data.email || 'N/A' }}</span>
              </div>
            </template>
          </Column>

          <Column field="direccion" header="Dirección" sortable style="min-width: 250px">
            <template #body="{ data }">
              <div class="contact-cell">
                <i class="pi pi-map-marker"></i>
                <span>{{ data.direccion || 'N/A' }}</span>
              </div>
            </template>
          </Column>

          <Column field="rnc" header="RNC" sortable style="min-width: 150px">
            <template #body="{ data }">
              <Tag v-if="data.legal" :value="data.legal" severity="info" />
              <span v-else class="text-muted">N/A</span>
            </template>
          </Column>

          <Column header="Acciones" :exportable="false" style="min-width: 300px">
            <template #body="{ data }">
              <div class="action-buttons">
                <Button
                  icon="pi pi-sync"
                  @click="fnCambiarAlmacen(data)"
                  text
                  rounded
                  severity="success"
                  v-tooltip.top="'Cambiar a este almacén'"
                />
                <Button
                  v-if="data.nombre !== datosEmpresa.empresa?.nombre"
                  icon="pi pi-copy"
                  @click="confirmarReplicarProductos(data)"
                  text
                  rounded
                  severity="warning"
                  v-tooltip.top="'Replicar productos del almacén principal'"
                />
                <Button
                  v-if="data.nombre !== datosEmpresa.empresa?.nombre"
                  icon="pi pi-times-circle"
                  @click="confirmarEliminarProductos(data)"
                  text
                  rounded
                  severity="danger"
                  v-tooltip.top="'Eliminar todos los productos de este almacén'"
                />
                <Button
                  icon="pi pi-pencil"
                  @click="editarAlmacen(data)"
                  text
                  rounded
                  severity="info"
                  v-tooltip.top="'Editar'"
                />
                <Button
                  icon="pi pi-trash"
                  @click="confirmarEliminar(data)"
                  text
                  rounded
                  severity="danger"
                  v-tooltip.top="'Eliminar almacén'"
                />
              </div>
            </template>
          </Column>
        </DataTable>
      </template>
    </Card>

    <!-- Dialog Crear/Editar -->
    <Dialog
      v-model:visible="dialogVisible"
      :header="modoEdicion ? 'Editar Almacén' : 'Nuevo Almacén'"
      :modal="true"
      :closable="true"
      :style="{ width: '600px' }"
      :breakpoints="{ '960px': '75vw', '640px': '90vw' }"
    >
      <div class="dialog-content">
        <!-- Logo Preview -->
        <div class="logo-section">
          <div class="logo-preview">
            <Avatar
              :label="formData.nombre?.substring(0, 2) || '??'"
              shape="circle"
              size="xlarge"
              style="background-color: var(--primary-color); color: white"
            />
          </div>
        </div>

        <!-- Form Fields -->
        <div class="form-grid">
          <div class="form-field">
            <label for="nombre" class="required">Nombre del Almacén</label>
            <InputText
              id="nombre"
              v-model="formData.nombre"
              v-mayuscula
              placeholder="Ej: Almacén Central"
              :class="{ 'p-invalid': errors.nombre }"
            />
            <small v-if="errors.nombre" class="p-error">{{ errors.nombre }}</small>
          </div>

          <div class="form-field">
            <label for="telefono">Teléfono</label>
            <InputText
              id="telefono"
              v-model="formData.telefono"
              placeholder="Ej: 809-555-1234"
            />
          </div>

          <div class="form-field">
            <label for="email">Email</label>
            <InputText
              id="email"
              v-model="formData.email"
              placeholder="Ej: almacen@empresa.com"
              type="email"
            />
          </div>

          <div class="form-field">
            <label for="rnc">RNC</label>
            <InputText
              id="rnc"
              v-model="formData.legal"
              placeholder="Ej: 123-4567890-1"
            />
          </div>

          <div class="form-field full-width">
            <label for="direccion">Dirección</label>
            <Textarea
              id="direccion"
              v-model="formData.direccion"
              placeholder="Dirección completa del almacén"
              rows="3"
            />
          </div>
        </div>
      </div>

      <template #footer>
        <Button
          label="Cancelar"
          icon="pi pi-times"
          @click="cerrarDialogo"
          text
        />
        <Button
          :label="modoEdicion ? 'Actualizar' : 'Crear'"
          :icon="modoEdicion ? 'pi pi-check' : 'pi pi-plus'"
          @click="guardarAlmacen"
          :loading="guardando"
        />
      </template>
    </Dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useToast } from 'primevue/usetoast';
import { useRouter } from 'vue-router';
import { useDatosEmpresa } from '@/stores';
import { peticionesFetchOffline, nfecha, envioElectron, cerrarSession,crearTablaSiNoExisteOffline } from '@/funciones/funciones.js';
import Swal from 'sweetalert2';

const toast = useToast();
const router = useRouter();
const datosEmpresa = useDatosEmpresa();

// Refs
const almacenes = ref([]);
const loading = ref(false);
const dialogVisible = ref(false);
const modoEdicion = ref(false);
const guardando = ref(false);
const token = ref('');
const tokenCorto = ref('');
const cardMenu = ref(null);
const selectedAlmacen = ref(null);
const cardMenuItems = ref([]);

// Form data
const formData = ref({
  nombre: '',
  telefono: '',
  email: '',
  direccion: '',
  legal: '',
  imagen: ''
});

const errors = ref({
  nombre: ''
});

// Filters
const filters = ref({
  global: { value: null, matchMode: 'contains' }
});

// Campo array para la tabla empresa
//const camposArray = ['nombre', 'telefono', 'email', 'direccion', 'legal', 'imagen'];
const camposArray = ['almacen', 'alerta', 'nombre', 'legal', 'telefono', 'link', 'email', 'direccion', 'actualizacion', 'bloqueo', 'token', 'imagen', 'usuario', 'identificadordb','created_at','updated_at'];

// Cargar almacenes
const cargarAlmacenes = async () => {
  loading.value = true;
  try {
    const response = await peticionesFetchOffline('getDataAsArray', 'empresa');
    almacenes.value = response || [];
  } catch (error) {
    console.error('Error al cargar almacenes:', error);
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'No se pudieron cargar los almacenes',
      life: 3000
    });
  } finally {
    loading.value = false;
  }
};

// Abrir diálogo para nuevo almacén
const abrirDialogoNuevo = () => {
  modoEdicion.value = false;

  // Obtener datos del almacén principal
  const almacenPrincipal = almacenes.value[0] || {};
  const nombrePrincipal = datosEmpresa.empresa?.nombre || '';

  // Generar nombre automático basado en el almacén principal
  let nombreAutomatico = '';

  if (nombrePrincipal) {
    // Contar almacenes que comienzan con el nombre principal
    const almacenesRelacionados = almacenes.value.filter(a =>
      a.nombre.startsWith(nombrePrincipal)
    );

    // El número será la cantidad total de almacenes relacionados + 1
    // Pero si ya existe el almacén sin número, empezamos desde 2
    const totalRelacionados = almacenesRelacionados.length;

    if (totalRelacionados === 0) {
      nombreAutomatico = nombrePrincipal;
    } else {
      // Buscar el siguiente número disponible
      let numero = totalRelacionados + 1;
      let nombreTemporal = `${nombrePrincipal} ${numero}`;

      // Asegurarse de que el nombre no existe
      while (almacenes.value.some(a => a.nombre === nombreTemporal)) {
        numero++;
        nombreTemporal = `${nombrePrincipal} ${numero}`;
      }

      nombreAutomatico = nombreTemporal;
    }
  }

  // Copiar TODOS los campos del almacén principal excepto id, nombre, created_at y updated_at
  formData.value = {
    ...almacenPrincipal, // Copiar todos los campos
    nombre: nombreAutomatico, // Solo cambiar el nombre
    id: undefined, // No copiar el ID
    created_at: undefined,
    updated_at: undefined
  };

  errors.value = { nombre: '' };
  dialogVisible.value = true;
};

// Editar almacén
const editarAlmacen = (almacen) => {
  modoEdicion.value = true;
  formData.value = { ...almacen };
  errors.value = { nombre: '' };
  dialogVisible.value = true;
};

// Cerrar diálogo
const cerrarDialogo = () => {
  dialogVisible.value = false;
  formData.value = {
    nombre: '',
    telefono: '',
    email: '',
    direccion: '',
    legal: '',
    imagen: ''
  };
  errors.value = { nombre: '' };
};

// Validar formulario
const validarFormulario = () => {
  errors.value = { nombre: '' };
  let valido = true;

  if (!formData.value.nombre || formData.value.nombre.trim() === '') {
    errors.value.nombre = 'El nombre es requerido';
    valido = false;
  }

  return valido;
};

// Confirmar replicación de productos
const confirmarReplicarProductos = async (almacen) => {
  const result = await Swal.fire({
    title: 'Replicar Productos',
    html: `
      <div style="text-align: left; padding: 1rem;">
        <p>¿Desea replicar todos los productos del almacén principal <strong>${datosEmpresa.empresa?.nombre}</strong> al almacén <strong>${almacen.nombre}</strong>?</p>
        <br>
        <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 0.75rem; border-radius: 4px; margin-bottom: 1rem;">
          <p style="color: #92400e; font-size: 0.9rem; margin: 0;">
            <i class="pi pi-exclamation-triangle" style="margin-right: 0.5rem;"></i>
            <strong>Advertencia:</strong> Los productos se agregarán con stock en cero.
          </p>
        </div>
        <p style="color: #6b7280; font-size: 0.9rem;">
          <i class="pi pi-info-circle"></i> Si un producto ya existe en el almacén destino, se omitirá.
        </p>
        <p style="color: #6b7280; font-size: 0.9rem;">
          <i class="pi pi-info-circle"></i> Se copiarán precios, categorías y toda la información.
        </p>
      </div>
    `,
    icon: 'question',
    showCancelButton: true,
    confirmButtonText: 'Sí, replicar productos',
    cancelButtonText: 'Cancelar',
    confirmButtonColor: '#f59e0b',
    cancelButtonColor: '#6b7280'
  });

  if (result.isConfirmed) {
    await replicarProductos(almacen.nombre);
  }
};

// Replicar productos del almacén principal al nuevo
const replicarProductos = async (nombreNuevoAlmacen) => {
  try {
    // Obtener todos los productos del almacén actual (principal)
    const productosActuales = await peticionesFetchOffline('getDataArrayByCondition', 'productos', 'almacen', datosEmpresa.empresa.nombre);

    if (!productosActuales || productosActuales.length === 0) {
      Swal.fire({
        icon: 'warning',
        title: 'Sin productos',
        text: 'No hay productos en el almacén principal para replicar',
        confirmButtonText: 'Entendido'
      });
      return;
    }

    // Mostrar loading con SweetAlert2
    Swal.fire({
      title: 'Replicando Productos',
      html: `
        <div style="text-align: center; padding: 1rem;">
          <div style="font-size: 3rem; color: #6366f1; margin-bottom: 1rem;">
            <i class="pi pi-spin pi-spinner"></i>
          </div>
          <p style="font-size: 1.1rem; margin-bottom: 0.5rem;">
            Procesando <strong>0</strong> de <strong>${productosActuales.length}</strong> productos
          </p>
          <div style="background: #f3f4f6; border-radius: 8px; height: 8px; overflow: hidden; margin-top: 1rem;">
            <div id="progress-bar" style="background: linear-gradient(90deg, #6366f1, #8b5cf6); height: 100%; width: 0%; transition: width 0.3s ease;"></div>
          </div>
          <p style="color: #6b7280; font-size: 0.9rem; margin-top: 1rem;">
            Por favor espera...
          </p>
        </div>
      `,
      allowOutsideClick: false,
      allowEscapeKey: false,
      showConfirmButton: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    let productosReplicados = 0;
    let productosOmitidos = 0;
    const totalProductos = productosActuales.length;

    // Obtener productos existentes en el almacén destino
    const productosDestino = await peticionesFetchOffline('getDataArrayByCondition', 'productos', 'almacen', nombreNuevoAlmacen);
    const codigosExistentes = new Set(productosDestino.map(p => p.codigo));

    // Replicar cada producto
    for (let i = 0; i < productosActuales.length; i++) {
      const producto = productosActuales[i];

      // Verificar si el producto ya existe en el almacén destino
      if (codigosExistentes.has(producto.codigo)) {
        productosOmitidos++;
      } else {
        // Crear una copia del producto con el nuevo almacén y stock en cero
        const nuevoProducto = {
          codigo: producto.codigo,
          codigo_barra: producto.codigo_barra,
          nombre: producto.nombre,
          categoria: producto.categoria,
          marca: producto.marca,
          precio_compra: producto.precio_compra,
          precio_venta: producto.precio_venta,
          precio_final: producto.precio_final,
          precio_min: producto.precio_min,
          precio_xmayor: producto.precio_xmayor,
          oferta: producto.oferta,
          ganancia: producto.ganancia,
          impuestos: producto.impuestos,
          impuesto_venta: producto.impuesto_venta,
          tipo_impuesto: producto.tipo_impuesto,
          stock: '0', // Stock en cero
          proveedor: producto.proveedor,
          empaque: producto.empaque,
          alerta: producto.alerta,
          almacen: nombreNuevoAlmacen, // Nuevo almacén
          otro: '',
          created_at: nfecha('timestamp'),
          updated_at: nfecha('timestamp')
        };

        // Insertar el nuevo producto
        const resultado = await peticionesFetchOffline('insertData', 'productos', JSON.stringify(nuevoProducto));

        if (resultado[0] === 'ok') {
          productosReplicados++;
        }
      }

      // Actualizar el progreso
      const porcentaje = ((i + 1) / totalProductos) * 100;
      const progressBar = document.getElementById('progress-bar');
      if (progressBar) {
        progressBar.style.width = `${porcentaje}%`;
      }

      // Actualizar el texto del modal
      Swal.update({
        html: `
          <div style="text-align: center; padding: 1rem;">
            <div style="font-size: 3rem; color: #6366f1; margin-bottom: 1rem;">
              <i class="pi pi-spin pi-spinner"></i>
            </div>
            <p style="font-size: 1.1rem; margin-bottom: 0.5rem;">
              Procesando <strong>${i + 1}</strong> de <strong>${totalProductos}</strong> productos
            </p>
            <div style="background: #f3f4f6; border-radius: 8px; height: 8px; overflow: hidden; margin-top: 1rem;">
              <div id="progress-bar" style="background: linear-gradient(90deg, #6366f1, #8b5cf6); height: 100%; width: ${porcentaje}%; transition: width 0.3s ease;"></div>
            </div>
            <p style="color: #6b7280; font-size: 0.9rem; margin-top: 1rem;">
              <strong>${producto.nombre}</strong>
            </p>
          </div>
        `
      });
    }

    // Cerrar el loading y mostrar resultado
    Swal.fire({
      icon: 'success',
      title: 'Replicación Completada',
      html: `
        <div style="text-align: center; padding: 1rem;">
          <p style="font-size: 1.2rem; margin-bottom: 1rem;">
            <i class="pi pi-check-circle" style="color: #10b981; font-size: 2rem; display: block; margin-bottom: 0.5rem;"></i>
            Se replicaron <strong style="color: #10b981;">${productosReplicados}</strong> productos correctamente
          </p>
          ${productosOmitidos > 0 ? `
            <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 0.75rem; border-radius: 4px; margin-bottom: 1rem; text-align: left;">
              <p style="color: #92400e; font-size: 0.9rem; margin: 0;">
                <i class="pi pi-info-circle" style="margin-right: 0.5rem;"></i>
                <strong>${productosOmitidos}</strong> productos omitidos (ya existían en el almacén destino)
              </p>
            </div>
          ` : ''}
          <p style="color: #6b7280; font-size: 0.9rem;">
            <i class="pi pi-warehouse"></i> Almacén destino: <strong>${nombreNuevoAlmacen}</strong>
          </p>
          <p style="color: #6b7280; font-size: 0.85rem; margin-top: 0.5rem;">
            Total procesado: ${totalProductos} productos
          </p>
        </div>
      `,
      confirmButtonText: 'Excelente',
      confirmButtonColor: '#10b981'
    });

  } catch (error) {
    console.error('Error al replicar productos:', error);
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: 'Ocurrió un error al replicar los productos',
      confirmButtonText: 'Cerrar'
    });
  }
};

// Confirmar eliminación de productos del almacén
const confirmarEliminarProductos = async (almacen) => {
  // Obtener cantidad de productos en el almacén
  const productosAlmacen = await peticionesFetchOffline('getDataArrayByCondition', 'productos', 'almacen', almacen.nombre);
  const cantidadProductos = productosAlmacen?.length || 0;

  if (cantidadProductos === 0) {
    Swal.fire({
      icon: 'info',
      title: 'Sin productos',
      text: `El almacén ${almacen.nombre} no tiene productos para eliminar`,
      confirmButtonText: 'Entendido'
    });
    return;
  }

  const result = await Swal.fire({
    title: '¿Estás completamente seguro?',
    html: `
      <div style="text-align: left; padding: 1rem;">
        <p style="font-size: 1.1rem; margin-bottom: 1rem;">
          Estás a punto de <strong style="color: #dc2626;">eliminar TODOS los productos</strong> del almacén <strong>${almacen.nombre}</strong>
        </p>
        <div style="background: #fee2e2; border-left: 4px solid #dc2626; padding: 0.75rem; border-radius: 4px; margin-bottom: 1rem;">
          <p style="color: #991b1b; font-size: 0.9rem; margin: 0;">
            <i class="pi pi-exclamation-triangle" style="margin-right: 0.5rem;"></i>
            <strong>¡ADVERTENCIA!</strong> Esta acción es IRREVERSIBLE
          </p>
        </div>
        <p style="color: #dc2626; font-weight: 600; font-size: 1rem; margin-bottom: 0.5rem;">
          Se eliminarán <strong>${cantidadProductos}</strong> productos permanentemente
        </p>
        <p style="color: #6b7280; font-size: 0.9rem;">
          <i class="pi pi-info-circle"></i> El almacén <strong>${almacen.nombre}</strong> quedará sin inventario
        </p>
        <p style="color: #6b7280; font-size: 0.9rem;">
          <i class="pi pi-shield"></i> Los productos del almacén principal NO se verán afectados
        </p>
      </div>
    `,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Sí, eliminar todos los productos',
    cancelButtonText: 'Cancelar',
    confirmButtonColor: '#dc2626',
    cancelButtonColor: '#6b7280',
    reverseButtons: true
  });

  if (result.isConfirmed) {
    // Segunda confirmación con contraseña
    const { value: password } = await Swal.fire({
      title: 'Confirmación final',
      html: `
        <div style="text-align: left; padding: 1rem;">
          <p style="margin-bottom: 1rem;">
            Para confirmar la eliminación de <strong style="color: #dc2626;">${cantidadProductos} productos</strong>, ingresa tu contraseña:
          </p>
        </div>
      `,
      input: 'password',
      inputPlaceholder: 'Contraseña de administrador',
      showCancelButton: true,
      confirmButtonText: 'Confirmar eliminación',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#dc2626',
      inputAttributes: {
        maxlength: 10,
        autocapitalize: 'off',
        autocorrect: 'off'
      },
      inputValidator: (value) => {
        if (!value) {
          return 'Debes ingresar tu contraseña';
        }
      }
    });

    if (password) {
      if (password === token.value || password === tokenCorto.value) {
        await eliminarProductosAlmacen(almacen.nombre, cantidadProductos);
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Contraseña incorrecta',
          text: 'No se pudieron eliminar los productos',
          confirmButtonText: 'Cerrar'
        });
      }
    }
  }
};

// Eliminar todos los productos de un almacén
const eliminarProductosAlmacen = async (nombreAlmacen, cantidadTotal) => {
  try {
    // Mostrar loading con SweetAlert2
    Swal.fire({
      title: 'Eliminando Productos',
      html: `
        <div style="text-align: center; padding: 1rem;">
          <div style="font-size: 3rem; color: #dc2626; margin-bottom: 1rem;">
            <i class="pi pi-spin pi-spinner"></i>
          </div>
          <p style="font-size: 1.1rem; margin-bottom: 0.5rem;">
            Eliminando <strong>0</strong> de <strong>${cantidadTotal}</strong> productos
          </p>
          <div style="background: #f3f4f6; border-radius: 8px; height: 8px; overflow: hidden; margin-top: 1rem;">
            <div id="delete-progress-bar" style="background: linear-gradient(90deg, #dc2626, #991b1b); height: 100%; width: 0%; transition: width 0.3s ease;"></div>
          </div>
          <p style="color: #6b7280; font-size: 0.9rem; margin-top: 1rem;">
            Por favor espera...
          </p>
        </div>
      `,
      allowOutsideClick: false,
      allowEscapeKey: false,
      showConfirmButton: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    // Obtener todos los productos del almacén
    const productosAlmacen = await peticionesFetchOffline('getDataArrayByCondition', 'productos', 'almacen', nombreAlmacen);
    let productosEliminados = 0;
    let imeisEliminados = 0;

    // Eliminar cada producto
    for (let i = 0; i < productosAlmacen.length; i++) {
      const producto = productosAlmacen[i];

      // Si el producto es CELULARES, eliminar sus IMEIs primero
      if (producto.categoria === 'CELULARES') {
        const todosLosImeis = await peticionesFetchOffline('getDataAsArray', 'imei');
        const imeisDelProducto = todosLosImeis.filter(imei => imei.id_equi == producto.id);

        for (const imei of imeisDelProducto) {
          await peticionesFetchOffline('deleteEntry', 'imei', imei.id);
          imeisEliminados++;
        }
      }

      // Eliminar el producto
      const resultado = await peticionesFetchOffline('deleteEntry', 'productos', producto.id);

      if (resultado[0] === 'ok') {
        productosEliminados++;
      }

      // Actualizar el progreso
      const porcentaje = ((i + 1) / cantidadTotal) * 100;
      const progressBar = document.getElementById('delete-progress-bar');
      if (progressBar) {
        progressBar.style.width = `${porcentaje}%`;
      }

      // Actualizar el texto del modal
      Swal.update({
        html: `
          <div style="text-align: center; padding: 1rem;">
            <div style="font-size: 3rem; color: #dc2626; margin-bottom: 1rem;">
              <i class="pi pi-spin pi-spinner"></i>
            </div>
            <p style="font-size: 1.1rem; margin-bottom: 0.5rem;">
              Eliminando <strong>${i + 1}</strong> de <strong>${cantidadTotal}</strong> productos
            </p>
            <div style="background: #f3f4f6; border-radius: 8px; height: 8px; overflow: hidden; margin-top: 1rem;">
              <div id="delete-progress-bar" style="background: linear-gradient(90deg, #dc2626, #991b1b); height: 100%; width: ${porcentaje}%; transition: width 0.3s ease;"></div>
            </div>
            <p style="color: #6b7280; font-size: 0.9rem; margin-top: 1rem;">
              <strong>${producto.nombre}</strong>
            </p>
          </div>
        `
      });
    }

    // Cerrar el loading y mostrar resultado
    Swal.fire({
      icon: 'success',
      title: 'Productos Eliminados',
      html: `
        <div style="text-align: center; padding: 1rem;">
          <p style="font-size: 1.2rem; margin-bottom: 1rem;">
            <i class="pi pi-check-circle" style="color: #10b981; font-size: 2rem; display: block; margin-bottom: 0.5rem;"></i>
            Se eliminaron <strong style="color: #dc2626;">${productosEliminados}</strong> productos correctamente
          </p>
          ${imeisEliminados > 0 ? `
            <div style="background: #f0f9ff; border-left: 4px solid #3b82f6; padding: 0.75rem; border-radius: 4px; margin-bottom: 1rem; text-align: left;">
              <p style="color: #1e40af; font-size: 0.9rem; margin: 0;">
                <i class="pi pi-mobile" style="margin-right: 0.5rem;"></i>
                También se eliminaron <strong>${imeisEliminados}</strong> IMEIs de celulares
              </p>
            </div>
          ` : ''}
          <p style="color: #6b7280; font-size: 0.9rem;">
            <i class="pi pi-warehouse"></i> Almacén: <strong>${nombreAlmacen}</strong>
          </p>
          <p style="color: #6b7280; font-size: 0.85rem; margin-top: 0.5rem;">
            El almacén ahora está vacío
          </p>
        </div>
      `,
      confirmButtonText: 'Aceptar',
      confirmButtonColor: '#10b981'
    });

  } catch (error) {
    console.error('Error al eliminar productos:', error);
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: 'Ocurrió un error al eliminar los productos',
      confirmButtonText: 'Cerrar'
    });
  }
};

// Guardar almacén
const guardarAlmacen = async () => {
  if (!validarFormulario()) {
    return;
  }

  guardando.value = true;

  try {
    // Preparar datos base
    const datosBase = {
      nombre: formData.value.nombre.trim().toUpperCase(),
      telefono: formData.value.telefono || '',
      email: formData.value.email || '',
      direccion: formData.value.direccion || '',
      legal: formData.value.legal || '',
      imagen: formData.value.imagen || ''
    };

    let response;
    let datos;

    if (modoEdicion.value) {
      // Actualizar - incluir todos los campos del almacén existente
      datos = {
        ...formData.value,
        ...datosBase,
        updated_at: nfecha('datetime')
      };
      response = await peticionesFetchOffline('updateData', 'empresa', JSON.stringify(datos));
    } else {
      // Crear - solo enviar los campos necesarios
      datos = {
        ...datosBase,
        created_at: nfecha('timestamp'),
        updated_at: nfecha('timestamp')
      };
      response = await peticionesFetchOffline('insertData', 'empresa', JSON.stringify(datos));
    }

    if (response[0] === 'ok') {
      const nombreAlmacen = datos.nombre;

      toast.add({
        severity: 'success',
        summary: 'Éxito',
        detail: modoEdicion.value
          ? 'Almacén actualizado correctamente'
          : 'Almacén creado correctamente',
        life: 3000
      });

      cerrarDialogo();
      await cargarAlmacenes();

      // Si es un nuevo almacén, preguntar si desea replicar productos
      if (!modoEdicion.value) {
        const result = await Swal.fire({
          title: 'Replicar Productos',
          html: `
            <div style="text-align: left; padding: 1rem;">
              <p>¿Desea replicar los productos del almacén principal al nuevo almacén <strong>${nombreAlmacen}</strong>?</p>
              <br>
              <p style="color: #6b7280; font-size: 0.9rem;">
                <i class="pi pi-info-circle"></i> Los productos se copiarán con <strong>stock en cero</strong>.
              </p>
              <p style="color: #6b7280; font-size: 0.9rem;">
                <i class="pi pi-info-circle"></i> Esto incluye precios, categorías y demás información.
              </p>
            </div>
          `,
          icon: 'question',
          showCancelButton: true,
          confirmButtonText: 'Sí, replicar productos',
          cancelButtonText: 'No, gracias',
          confirmButtonColor: '#10b981',
          cancelButtonColor: '#6b7280'
        });

        if (result.isConfirmed) {
          await replicarProductos(nombreAlmacen);
        }
      }
    } else {
      throw new Error(response[1] || 'Error al guardar');
    }
  } catch (error) {
    console.error('Error al guardar almacén:', error);
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'No se pudo guardar el almacén',
      life: 3000
    });
  } finally {
    guardando.value = false;
  }
};

// Confirmar eliminar
const confirmarEliminar = async (almacen) => {
  // Obtener cantidad de productos en el almacén
  const productosAlmacen = await peticionesFetchOffline('getDataArrayByCondition', 'productos', 'almacen', almacen.nombre);
  const cantidadProductos = productosAlmacen?.length || 0;

  // Primera confirmación
  const result = await Swal.fire({
    title: '¿Estás seguro?',
    html: `
      <div style="text-align: left; padding: 1rem;">
        <p style="font-size: 1.1rem; margin-bottom: 1rem;">
          Estás a punto de eliminar el almacén <strong>${almacen.nombre}</strong>
        </p>
        ${cantidadProductos > 0 ? `
          <div style="background: #fee2e2; border-left: 4px solid #dc2626; padding: 0.75rem; border-radius: 4px; margin-bottom: 1rem;">
            <p style="color: #991b1b; font-size: 0.9rem; margin: 0;">
              <i class="pi pi-exclamation-triangle" style="margin-right: 0.5rem;"></i>
              <strong>¡ADVERTENCIA!</strong> Este almacén tiene <strong>${cantidadProductos} productos</strong>
            </p>
          </div>
          <p style="color: #dc2626; font-size: 0.95rem; margin-bottom: 0.5rem;">
            Al eliminar el almacén, también se eliminarán todos sus productos permanentemente
          </p>
        ` : `
          <p style="color: #6b7280; font-size: 0.9rem;">
            <i class="pi pi-info-circle"></i> Este almacén no tiene productos
          </p>
        `}
        <p style="color: #6b7280; font-size: 0.9rem; margin-top: 0.5rem;">
          Esta acción no se puede deshacer
        </p>
      </div>
    `,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#d33',
    cancelButtonColor: '#3085d6',
    confirmButtonText: 'Sí, eliminar todo',
    cancelButtonText: 'Cancelar',
    reverseButtons: true
  });

  if (result.isConfirmed) {
    // Segunda confirmación con password
    const { value: password } = await Swal.fire({
      title: 'Introduce la contraseña',
      html: `
        <div style="text-align: left; padding: 1rem;">
          <p style="margin-bottom: 1rem;">
            ${cantidadProductos > 0
              ? `Se eliminarán <strong style="color: #dc2626;">${cantidadProductos} productos</strong> y el almacén <strong>${almacen.nombre}</strong>`
              : `Se eliminará el almacén <strong>${almacen.nombre}</strong>`
            }
          </p>
          <p style="color: #6b7280; font-size: 0.9rem;">
            Ingresa tu contraseña para confirmar:
          </p>
        </div>
      `,
      input: 'password',
      inputPlaceholder: 'Contraseña de administrador',
      showCancelButton: true,
      confirmButtonText: 'Confirmar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#dc2626'
    });

    if (password) {
      await eliminarAlmacen(almacen, password, cantidadProductos);
    }
  }
};

// Eliminar almacén
const eliminarAlmacen = async (almacen, password, cantidadProductos) => {
  try {
    // Validar password con token
    if (password != tokenCorto.value && password != token.value) {
      Swal.fire({
        icon: 'error',
        title: 'Contraseña incorrecta',
        text: 'No se pudo eliminar el almacén',
        confirmButtonText: 'Cerrar'
      });
      return;
    }

    let imeisEliminados = 0;

    // Si hay productos, mostrar loading y eliminarlos primero
    if (cantidadProductos > 0) {
      Swal.fire({
        title: 'Eliminando Almacén',
        html: `
          <div style="text-align: center; padding: 1rem;">
            <div style="font-size: 3rem; color: #dc2626; margin-bottom: 1rem;">
              <i class="pi pi-spin pi-spinner"></i>
            </div>
            <p style="font-size: 1.1rem; margin-bottom: 0.5rem;">
              Eliminando <strong>0</strong> de <strong>${cantidadProductos}</strong> productos
            </p>
            <div style="background: #f3f4f6; border-radius: 8px; height: 8px; overflow: hidden; margin-top: 1rem;">
              <div id="delete-almacen-progress-bar" style="background: linear-gradient(90deg, #dc2626, #991b1b); height: 100%; width: 0%; transition: width 0.3s ease;"></div>
            </div>
            <p style="color: #6b7280; font-size: 0.9rem; margin-top: 1rem;">
              Paso 1/2: Eliminando productos...
            </p>
          </div>
        `,
        allowOutsideClick: false,
        allowEscapeKey: false,
        showConfirmButton: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });

      // Obtener y eliminar todos los productos del almacén
      const productosAlmacen = await peticionesFetchOffline('getDataArrayByCondition', 'productos', 'almacen', almacen.nombre);
      let productosEliminados = 0;

      for (let i = 0; i < productosAlmacen.length; i++) {
        const producto = productosAlmacen[i];

        // Si el producto es CELULARES, eliminar sus IMEIs primero
        if (producto.categoria === 'CELULARES') {
          const todosLosImeis = await peticionesFetchOffline('getDataAsArray', 'imei');
          const imeisDelProducto = todosLosImeis.filter(imei => imei.id_equi == producto.id);

          for (const imei of imeisDelProducto) {
            await peticionesFetchOffline('deleteEntry', 'imei', imei.id);
            imeisEliminados++;
          }
        }

        // Eliminar el producto
        const resultado = await peticionesFetchOffline('deleteEntry', 'productos', producto.id);

        if (resultado[0] === 'ok') {
          productosEliminados++;
        }

        // Actualizar el progreso
        const porcentaje = ((i + 1) / cantidadProductos) * 100;
        const progressBar = document.getElementById('delete-almacen-progress-bar');
        if (progressBar) {
          progressBar.style.width = `${porcentaje}%`;
        }

        // Actualizar el texto del modal
        Swal.update({
          html: `
            <div style="text-align: center; padding: 1rem;">
              <div style="font-size: 3rem; color: #dc2626; margin-bottom: 1rem;">
                <i class="pi pi-spin pi-spinner"></i>
              </div>
              <p style="font-size: 1.1rem; margin-bottom: 0.5rem;">
                Eliminando <strong>${i + 1}</strong> de <strong>${cantidadProductos}</strong> productos
              </p>
              <div style="background: #f3f4f6; border-radius: 8px; height: 8px; overflow: hidden; margin-top: 1rem;">
                <div id="delete-almacen-progress-bar" style="background: linear-gradient(90deg, #dc2626, #991b1b); height: 100%; width: ${porcentaje}%; transition: width 0.3s ease;"></div>
              </div>
              <p style="color: #6b7280; font-size: 0.9rem; margin-top: 1rem;">
                Paso 1/2: <strong>${producto.nombre}</strong>
              </p>
            </div>
          `
        });
      }

      // Actualizar modal para mostrar que se está eliminando el almacén
      Swal.update({
        html: `
          <div style="text-align: center; padding: 1rem;">
            <div style="font-size: 3rem; color: #dc2626; margin-bottom: 1rem;">
              <i class="pi pi-spin pi-spinner"></i>
            </div>
            <p style="font-size: 1.1rem; margin-bottom: 0.5rem;">
              Productos eliminados: <strong style="color: #10b981;">${productosEliminados}</strong>
            </p>
            <div style="background: #f3f4f6; border-radius: 8px; height: 8px; overflow: hidden; margin-top: 1rem;">
              <div style="background: linear-gradient(90deg, #dc2626, #991b1b); height: 100%; width: 100%;"></div>
            </div>
            <p style="color: #6b7280; font-size: 0.9rem; margin-top: 1rem;">
              Paso 2/2: Eliminando almacén...
            </p>
          </div>
        `
      });
    } else {
      // Si no hay productos, mostrar loading simple
      Swal.fire({
        title: 'Eliminando Almacén',
        html: `
          <div style="text-align: center; padding: 1rem;">
            <div style="font-size: 3rem; color: #dc2626; margin-bottom: 1rem;">
              <i class="pi pi-spin pi-spinner"></i>
            </div>
            <p style="color: #6b7280; font-size: 0.9rem;">
              Eliminando almacén ${almacen.nombre}...
            </p>
          </div>
        `,
        allowOutsideClick: false,
        allowEscapeKey: false,
        showConfirmButton: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });
    }

    // Eliminar el almacén
    const response = await peticionesFetchOffline('deleteEntry', 'empresa', almacen.id);

    if (response[0] === 'ok') {
      await cargarAlmacenes();

      // Mostrar resultado final
      Swal.fire({
        icon: 'success',
        title: 'Almacén Eliminado',
        html: `
          <div style="text-align: center; padding: 1rem;">
            <p style="font-size: 1.2rem; margin-bottom: 1rem;">
              <i class="pi pi-check-circle" style="color: #10b981; font-size: 2rem; display: block; margin-bottom: 0.5rem;"></i>
              Almacén <strong>${almacen.nombre}</strong> eliminado correctamente
            </p>
            ${cantidadProductos > 0 ? `
              <p style="color: #6b7280; font-size: 0.9rem; margin-bottom: 0.5rem;">
                También se eliminaron <strong>${cantidadProductos}</strong> productos
              </p>
            ` : ''}
            ${imeisEliminados > 0 ? `
              <div style="background: #f0f9ff; border-left: 4px solid #3b82f6; padding: 0.75rem; border-radius: 4px; margin-top: 1rem; text-align: left;">
                <p style="color: #1e40af; font-size: 0.9rem; margin: 0;">
                  <i class="pi pi-mobile" style="margin-right: 0.5rem;"></i>
                  Y <strong>${imeisEliminados}</strong> IMEIs de celulares
                </p>
              </div>
            ` : ''}
          </div>
        `,
        confirmButtonText: 'Aceptar',
        confirmButtonColor: '#10b981'
      });
    } else {
      throw new Error(response[1] || 'Error al eliminar');
    }
  } catch (error) {
    console.error('Error al eliminar almacén:', error);
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: 'No se pudo eliminar el almacén',
      confirmButtonText: 'Cerrar'
    });
  }
};

// Toggle card menu
const toggleCardMenu = (event, almacen) => {
  selectedAlmacen.value = almacen;

  // Build menu items based on the selected almacen
  cardMenuItems.value = [
    {
      label: 'Cambiar a este almacén',
      icon: 'pi pi-sync',
      command: () => fnCambiarAlmacen(selectedAlmacen.value)
    },
    {
      label: 'Editar',
      icon: 'pi pi-pencil',
      command: () => editarAlmacen(selectedAlmacen.value)
    }
  ];

  // Add conditional menu items
  if (selectedAlmacen.value.nombre !== datosEmpresa.empresa?.nombre) {
    cardMenuItems.value.push(
      { separator: true },
      {
        label: 'Replicar productos',
        icon: 'pi pi-copy',
        command: () => confirmarReplicarProductos(selectedAlmacen.value)
      },
      {
        label: 'Eliminar productos',
        icon: 'pi pi-times-circle',
        command: () => confirmarEliminarProductos(selectedAlmacen.value)
      }
    );
  }

  cardMenuItems.value.push(
    { separator: true },
    {
      label: 'Eliminar almacén',
      icon: 'pi pi-trash',
      command: () => confirmarEliminar(selectedAlmacen.value)
    }
  );

  cardMenu.value.toggle(event);
};

// Cambiar de almacén
const fnCambiarAlmacen = async (almacen) => {
  const { value: password } = await Swal.fire({
    title: 'Cambiar Almacén',
    html: `¿Desea cambiar al almacén <strong>${almacen.nombre}</strong>?<br>Ingrese la contraseña para continuar`,
    input: 'password',
    inputPlaceholder: 'Contraseña de administrador',
    showCancelButton: true,
    confirmButtonText: 'Confirmar',
    cancelButtonText: 'Cancelar',
    inputAttributes: {
      maxlength: 10,
      autocapitalize: 'off',
      autocorrect: 'off'
    }
  });

  if (!password) {
    return;
  }

  if (password === token.value || password === tokenCorto.value) {
    // Si es Electron, actualizar el JSON
    if (window.electron) {
      const nJSONResponse = await envioElectron('datosarchivo');
      const nJSON = nJSONResponse;
      nJSON.almacen = almacen.nombre;
      const clonedData = JSON.parse(JSON.stringify(nJSON));
      await window.electron.ipcRenderer.invoke('actualizarjson', clonedData);

      toast.add({
        severity: 'success',
        summary: 'Éxito',
        detail: `Almacén cambiado a ${almacen.nombre}`,
        life: 2000
      });

      setTimeout(() => {
        cerrarSession();
        router.push('/login');
      }, 2000);
    } else {
      // Si es navegador, redirigir al login con el almacén como query parameter
      toast.add({
        severity: 'success',
        summary: 'Éxito',
        detail: `Almacén cambiado a ${almacen.nombre}`,
        life: 2000
      });

      setTimeout(() => {
        cerrarSession();
        router.push({
          name: 'login',
          query: { almacen: almacen.nombre }
        });
      }, 2000);
    }
  } else {
    Swal.fire('Error', 'Contraseña incorrecta', 'error');
  }
};

// Mounted
onMounted(async () => {
  // Cargar tokens desde datosJSON
    const datosJSON = await envioElectron('datosarchivo');
    token.value = datosJSON.VITE_TOKEN;
    tokenCorto.value = datosJSON.VITE_TOKEN_CORTO;
  await crearTablaSiNoExisteOffline('empresa', camposArray, toast);
  await cargarAlmacenes();
});
</script>

<style scoped>
.almacenes-container {
  padding: 1.5rem;
  max-width: 1400px;
  margin: 0 auto;
}

/* Header */
.page-header {
  margin-bottom: 2rem;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.header-icon {
  font-size: 2.5rem;
  color: var(--primary-color);
}

.page-title {
  margin: 0;
  font-size: 1.8rem;
  font-weight: 700;
  color: var(--text-color);
}

.page-subtitle {
  margin: 0.25rem 0 0 0;
  font-size: 0.95rem;
  color: var(--text-color-secondary);
}

/* Stats Grid */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

/* Almacenes Cards Grid */
.almacenes-cards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.almacen-card {
  border-radius: 12px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 2px solid transparent;
  position: relative;
}

.almacen-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.15);
  border-color: var(--primary-color);
}

.almacen-card-content {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 0.5rem;
}

.almacen-card-header {
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
  padding: 1rem 0;
}

.almacen-active-tag {
  position: absolute;
  top: 0;
  right: 0;
  font-size: 0.75rem;
}

.almacen-card-body {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 0 0.5rem;
}

.almacen-card-title {
  margin: 0;
  font-size: 1.2rem;
  font-weight: 700;
  color: var(--text-color);
  text-align: center;
  word-break: break-word;
}

.almacen-card-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9rem;
  color: var(--text-color-secondary);
}

.almacen-card-info i {
  color: var(--primary-color);
  font-size: 0.85rem;
  flex-shrink: 0;
}

.almacen-card-info span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.stat-card {
  border-radius: 12px;
  overflow: hidden;
}

.stat-card.stat-card-primary {
  border-left: 4px solid var(--primary-color);
}

.stat-card.stat-card-success {
  border-left: 4px solid var(--green-500);
}

.stat-card.stat-card-info {
  border-left: 4px solid var(--blue-500);
}

.stat-content {
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.stat-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 60px;
  height: 60px;
  border-radius: 12px;
  font-size: 1.8rem;
}

.stat-card-primary .stat-icon {
  background-color: var(--primary-50);
  color: var(--primary-color);
}

.stat-card-success .stat-icon {
  background-color: var(--green-50);
  color: var(--green-500);
}

.stat-card-info .stat-icon {
  background-color: var(--blue-50);
  color: var(--blue-500);
}

.stat-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.stat-label {
  font-size: 0.9rem;
  color: var(--text-color-secondary);
  font-weight: 500;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text-color);
}

/* Table Card */
.table-card {
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
}

.search-input {
  min-width: 250px;
}

/* Empty State */
.empty-state {
  text-align: center;
  padding: 3rem 1rem;
  color: var(--text-color-secondary);
}

.empty-state i {
  font-size: 4rem;
  color: var(--text-color-secondary);
  opacity: 0.5;
  margin-bottom: 1rem;
}

.empty-state p {
  font-size: 1.1rem;
  margin-bottom: 1rem;
}

/* Table Cells */
.nombre-cell {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.nombre-text {
  font-weight: 600;
  color: var(--text-color);
}

.contact-cell {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.contact-cell i {
  color: var(--text-color-secondary);
  font-size: 0.9rem;
}

.text-muted {
  color: var(--text-color-secondary);
  font-style: italic;
}

.action-buttons {
  display: flex;
  gap: 0.25rem;
}

/* Dialog */
.dialog-content {
  padding: 1rem 0;
}

.logo-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 2rem;
  padding: 1.5rem;
  background-color: var(--surface-50);
  border-radius: 12px;
}

.logo-preview {
  display: flex;
  justify-content: center;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1.5rem;
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-field.full-width {
  grid-column: 1 / -1;
}

.form-field label {
  font-weight: 600;
  color: var(--text-color);
  font-size: 0.95rem;
}

.form-field label.required::after {
  content: ' *';
  color: var(--red-500);
}

.p-error {
  color: var(--red-500);
  font-size: 0.85rem;
}

/* Responsive */
@media (max-width: 768px) {
  .almacenes-container {
    padding: 1rem;
  }

  .header-content {
    flex-direction: column;
    align-items: stretch;
  }

  .header-left {
    flex-direction: column;
    align-items: flex-start;
  }

  .stats-grid {
    grid-template-columns: 1fr;
  }

  .almacenes-cards-grid {
    grid-template-columns: 1fr;
  }

  .form-grid {
    grid-template-columns: 1fr;
  }

  .search-input {
    min-width: 100%;
  }
}
</style>

