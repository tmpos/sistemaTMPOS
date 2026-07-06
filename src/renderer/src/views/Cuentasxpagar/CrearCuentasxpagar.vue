<script setup>
import { ref, onMounted, computed, watch } from 'vue';
import { useRouter } from 'vue-router';
const router = useRouter();
import { peticionesFetchOffline, nfecha, envioElectron, peticiones,peticionesFetch,encryptarPassword } from '@/funciones/funciones.js';
import Swal from 'sweetalert2';
import { useToast } from "primevue/usetoast";
const toast = useToast();
/************************************************************************/
import SelectButton from 'primevue/selectbutton';
/************************************************************************/
import { useDatosEmpresa } from '@/stores';
const datosEmpresa = useDatosEmpresa();
const token = ref('');
const tokenCifrado = ref('');
const usuarioLocal = ref({});
/************************************************************************/
const proveedores = ref([]);
const compras = ref([]);
/************************************************************************/
const cuenta = ref({
  proveedor: '',
  rnc_proveedor: '',
  no_factura: '',
  ncf_proveedor: '',
  fecha_compra: new Date(),
  fecha_vencimiento: null,
  total: 0,
  abono: 0,
  saldo: 0,
  estado: 'PENDIENTE',
  recordatorio: true,
  nota: '',
  almacen: '',
  usuario: ''
});
/************************************************************************/
const seleccionarProveedor = (nombreProveedor) => {
  const prov = proveedores.value.find(p => p.nombre === nombreProveedor);
  if (prov) {
    cuenta.value.proveedor = prov.nombre;
    cuenta.value.rnc_proveedor = prov.rnc;

    // Buscar compras de este proveedor
    cargarComprasProveedor(prov.nombre);
  }
};
/************************************************************************/
const cargarComprasProveedor = async (nombreProveedor) => {
  const todasCompras = await peticionesFetchOffline('getDataAsArray', 'compras');
  compras.value = todasCompras.filter(c =>
    c.proveedor === nombreProveedor &&
    parseFloat(c.saldo) > 0 &&
    (c.estado === 'PENDIENTE' || c.estado === 'CREDITO' || c.estado === 'PARCIAL')
  );
};
/************************************************************************/
const seleccionarCompra = (noFactura) => {
  const compra = compras.value.find(c => c.no_factura === noFactura);
  if (compra) {
    cuenta.value.no_factura = compra.no_factura;
    cuenta.value.ncf_proveedor = compra.ncf_proveedor || '';
    cuenta.value.fecha_compra = new Date(compra.fecha);
    cuenta.value.total = parseFloat(compra.total) || 0;
    cuenta.value.abono = parseFloat(compra.abono) || 0;
    cuenta.value.saldo = parseFloat(compra.saldo) || 0;

    // Calcular fecha de vencimiento sugerida (30 días)
    if (!cuenta.value.fecha_vencimiento) {
      const fechaCompra = new Date(compra.fecha);
      fechaCompra.setDate(fechaCompra.getDate() + 30);
      cuenta.value.fecha_vencimiento = fechaCompra;
    }
  }
};
/************************************************************************/
watch(() => cuenta.value.abono, (nuevoAbono) => {
  const total = parseFloat(cuenta.value.total) || 0;
  const abono = parseFloat(nuevoAbono) || 0;
  cuenta.value.saldo = (total - abono).toFixed(2);

  // Actualizar estado automáticamente
  if (abono >= total) {
    cuenta.value.estado = 'PAGADO';
  } else if (abono > 0) {
    cuenta.value.estado = 'PARCIAL';
  } else {
    cuenta.value.estado = 'PENDIENTE';
  }
});
/************************************************************************/
const buscarRNC = async () => {
  if (!cuenta.value.rnc_proveedor || cuenta.value.rnc_proveedor.length < 9) {
    toast.add({ severity: 'warning', summary: 'Advertencia', detail: 'Ingrese un RNC válido', life: 3000 });
    return;
  }

  try {
/*    const response = await peticiones('https://demo.tmposrd.com/vista/buscadorRNCdgii.php',
      { 'rnc': cuenta.value.rnc_proveedor }, 'POST');*/

const response = await peticionesFetch(
          'https://demo.tmposrd.com/api2',
          `consultarrnc/${cuenta.value.rnc_proveedor}`,
          {},
          tokenCifrado.value,
          'GET'
        );


    if (response && response.razon_social) {
      cuenta.value.proveedor = response.razon_social;
      toast.add({ severity: 'success', summary: 'Encontrado', detail: 'Proveedor encontrado en DGII', life: 3000 });

      // Cargar compras de este proveedor
      cargarComprasProveedor(response.razon_social);
    } else {
      toast.add({ severity: 'error', summary: 'No encontrado', detail: 'RNC no encontrado en DGII', life: 3000 });
    }
  } catch (error) {
    console.error('Error al buscar RNC:', error);
    toast.add({ severity: 'error', summary: 'Error', detail: 'Error al buscar en DGII', life: 3000 });
  }
};
/************************************************************************/
const validarFormulario = () => {
  if (!cuenta.value.proveedor) {
    toast.add({ severity: 'error', summary: 'Error', detail: 'Seleccione un proveedor', life: 3000 });
    return false;
  }

  if (!cuenta.value.no_factura) {
    toast.add({ severity: 'error', summary: 'Error', detail: 'Ingrese el número de factura', life: 3000 });
    return false;
  }

  if (!cuenta.value.fecha_vencimiento) {
    toast.add({ severity: 'error', summary: 'Error', detail: 'Ingrese la fecha de vencimiento', life: 3000 });
    return false;
  }

  if (parseFloat(cuenta.value.total) <= 0) {
    toast.add({ severity: 'error', summary: 'Error', detail: 'El total debe ser mayor a 0', life: 3000 });
    return false;
  }

  if (parseFloat(cuenta.value.saldo) <= 0) {
    toast.add({ severity: 'error', summary: 'Error', detail: 'El saldo debe ser mayor a 0', life: 3000 });
    return false;
  }

  return true;
};
/************************************************************************/
const guardarCuenta = async () => {
  if (!validarFormulario()) return;

  try {
    // Preparar datos para guardar
    const datosCuenta = {
      ...cuenta.value,
      fecha_compra: cuenta.value.fecha_compra instanceof Date
        ? cuenta.value.fecha_compra.toISOString().split('T')[0]
        : cuenta.value.fecha_compra,
      fecha_vencimiento: cuenta.value.fecha_vencimiento instanceof Date
        ? cuenta.value.fecha_vencimiento.toISOString().split('T')[0]
        : cuenta.value.fecha_vencimiento,
      total: cuenta.value.total.toString(),
      abono: cuenta.value.abono.toString(),
      saldo: cuenta.value.saldo.toString(),
      recordatorio: cuenta.value.recordatorio ? 1 : 0,
      almacen: datosEmpresa.empresa.nombre,
      usuario: usuarioLocal.value.usuario || 'SISTEMA',
      created_at: nfecha('timestamp'),
      updated_at: nfecha('timestamp')
    };

    const resultado = await peticionesFetchOffline('insertData', 'cuentasxpagar', JSON.stringify(datosCuenta));

    if (resultado[0] === 'ok') {
      // Actualizar la compra relacionada si existe
      const compraRelacionada = await peticionesFetchOffline('getDataByField', 'compras', 'no_factura', cuenta.value.no_factura);
      if (compraRelacionada) {
        compraRelacionada.abono = cuenta.value.abono.toString();
        compraRelacionada.saldo = cuenta.value.saldo.toString();
        compraRelacionada.estado = cuenta.value.estado;
        await peticionesFetchOffline('updateData', 'compras', JSON.stringify(compraRelacionada));
      }

      toast.add({ severity: 'success', summary: 'Éxito', detail: 'Cuenta por pagar creada', life: 3000 });

      Swal.fire({
        title: "¡Cuenta Creada!",
        text: "¿Qué deseas hacer ahora?",
        icon: "success",
        showCancelButton: true,
        confirmButtonText: "Crear Otra Cuenta",
        cancelButtonText: "Ir a Cuentas por Pagar",
        confirmButtonColor: '#10b981'
      }).then((result) => {
        if (result.isConfirmed) {
          limpiarFormulario();
        } else {
          router.push('/cuentasxpagar');
        }
      });

    } else {
      toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo crear la cuenta', life: 3000 });
    }
  } catch (error) {
    console.error('Error al guardar cuenta:', error);
    toast.add({ severity: 'error', summary: 'Error', detail: 'Error al guardar', life: 3000 });
  }
};
/************************************************************************/
const limpiarFormulario = () => {
  cuenta.value = {
    proveedor: '',
    rnc_proveedor: '',
    no_factura: '',
    ncf_proveedor: '',
    fecha_compra: new Date(),
    fecha_vencimiento: null,
    total: 0,
    abono: 0,
    saldo: 0,
    estado: 'PENDIENTE',
    recordatorio: true,
    nota: '',
    almacen: '',
    usuario: ''
  };
  compras.value = [];
};
/************************************************************************/
const cargarProveedores = async () => {
  const todosProveedores = await peticionesFetchOffline('getDataAsArray', 'proveedores');
  proveedores.value = todosProveedores || [];
};
/************************************************************************/
const diasHastaVencimiento = computed(() => {
  if (!cuenta.value.fecha_vencimiento) return null;

  const hoy = new Date();
  const vencimiento = cuenta.value.fecha_vencimiento instanceof Date
    ? new Date(cuenta.value.fecha_vencimiento)
    : new Date(cuenta.value.fecha_vencimiento);

  hoy.setHours(0, 0, 0, 0);
  vencimiento.setHours(0, 0, 0, 0);

  const diferencia = Math.floor((vencimiento - hoy) / (1000 * 60 * 60 * 24));
  return diferencia;
});
/************************************************************************/
const estadoVencimiento = computed(() => {
  const dias = diasHastaVencimiento.value;
  if (dias === null) return '';
  if (dias < 0) return 'danger';
  if (dias <= 3) return 'warning';
  if (dias <= 7) return 'info';
  return 'success';
});
/************************************************************************/
onMounted(async () => {
  const datosJSON = await envioElectron('datosarchivo');
  token.value = datosJSON.VITE_TOKEN;

  usuarioLocal.value = datosEmpresa.usuario
  tokenCifrado.value = await encryptarPassword(token.value, 10);

  if (!datosEmpresa.empresa.nombre) {
    toast.add({
      severity: 'warning',
      summary: 'Advertencia',
      detail: 'No se han cargado los datos de la empresa',
      life: 3000
    });
  }

  await cargarProveedores();
});
/************************************************************************/
</script>

<template>
<main class="crear-cuenta-wrapper">
  <div class="container-cuenta mx-auto px-4 py-6">

    <!-- Header Section -->
    <div class="mb-6 flex items-center justify-between">
      <div>
        <h1 class="text-3xl font-bold text-gray-800 mb-2">Nueva Cuenta por Pagar</h1>
        <p class="text-gray-600">Registra una nueva obligación con un proveedor</p>
      </div>
      <Button
        icon="pi pi-arrow-left"
        label="Volver"
        severity="secondary"
        outlined
        @click="router.push('/cuentasxpagar')"
        class="nav-btn"
      />
    </div>

    <!-- Sección 1: Información del Proveedor -->
    <Card class="cuenta-section mb-6">
      <template #header>
        <div class="section-header proveedor-header">
          <i class="pi pi-user text-2xl mr-3"></i>
          <div>
            <h2 class="text-xl font-bold">Información del Proveedor</h2>
            <p class="text-sm opacity-90">Selecciona o busca el proveedor</p>
          </div>
        </div>
      </template>

      <template #content>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">

          <!-- Buscar por RNC -->
          <div class="form-field">
            <label for="rnc" class="field-label">
              <i class="pi pi-id-card mr-2"></i>RNC Proveedor
            </label>
            <InputGroup>
              <InputText
                id="rnc"
                v-model="cuenta.rnc_proveedor"
                placeholder="Ingrese RNC..."
                class="modern-input"
              />
              <Button
                icon="pi pi-search"
                @click="buscarRNC"
                severity="warning"
                label="Buscar DGII"
              />
            </InputGroup>
            <small class="field-hint">Busca el proveedor en la DGII por su RNC</small>
          </div>

          <!-- Seleccionar Proveedor -->
          <div class="form-field">
            <label for="proveedor" class="field-label">
              <i class="pi pi-building mr-2"></i>Seleccionar Proveedor
            </label>
            <Dropdown
              id="proveedor"
              v-model="cuenta.proveedor"
              :options="proveedores"
              optionLabel="nombre"
              optionValue="nombre"
              placeholder="Seleccione un proveedor..."
              filter
              @update:modelValue="seleccionarProveedor"
              class="modern-dropdown w-full"
            >
              <template #option="slotProps">
                <div class="dropdown-option">
                  <div class="font-semibold">{{ slotProps.option.nombre }}</div>
                  <div class="text-sm text-gray-500">RNC: {{ slotProps.option.rnc }}</div>
                </div>
              </template>
            </Dropdown>
            <small class="field-hint">Selecciona un proveedor de la lista</small>
          </div>

          <!-- Nombre del Proveedor (Solo lectura si viene de selección) -->
          <div class="form-field md:col-span-2">
            <label for="nombre-proveedor" class="field-label">
              <i class="pi pi-user mr-2"></i>Nombre del Proveedor
            </label>
            <InputText
              id="nombre-proveedor"
              v-model="cuenta.proveedor"
              placeholder="Nombre del proveedor..."
              class="modern-input"
            />
          </div>

        </div>
      </template>
    </Card>

    <!-- Sección 2: Datos de la Compra -->
    <Card class="cuenta-section mb-6">
      <template #header>
        <div class="section-header compra-header">
          <i class="pi pi-shopping-cart text-2xl mr-3"></i>
          <div>
            <h2 class="text-xl font-bold">Datos de la Compra</h2>
            <p class="text-sm opacity-90">Información de la factura y fechas</p>
          </div>
        </div>
      </template>

      <template #content>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">

          <!-- Seleccionar de compras pendientes -->
          <div class="form-field md:col-span-3" v-if="compras.length > 0">
            <label for="seleccionar-compra" class="field-label">
              <i class="pi pi-list mr-2"></i>Seleccionar de Compras Pendientes
            </label>
            <Dropdown
              id="seleccionar-compra"
              :options="compras"
              optionLabel="no_factura"
              optionValue="no_factura"
              placeholder="Seleccione una compra pendiente..."
              @update:modelValue="seleccionarCompra"
              class="modern-dropdown w-full"
            >
              <template #option="slotProps">
                <div class="dropdown-option">
                  <div class="font-semibold">Factura: {{ slotProps.option.no_factura }}</div>
                  <div class="text-sm text-gray-500">
                    Fecha: {{ slotProps.option.fecha }} |
                    Saldo: ${{ parseFloat(slotProps.option.saldo).toFixed(2) }}
                  </div>
                </div>
              </template>
            </Dropdown>
            <Message severity="info" :closable="false" class="mt-2">
              Este proveedor tiene {{ compras.length }} compra(s) pendiente(s) de pago
            </Message>
          </div>

          <!-- No. Factura -->
          <div class="form-field">
            <label for="no-factura" class="field-label required">
              <i class="pi pi-file mr-2"></i>No. Factura
            </label>
            <InputText
              id="no-factura"
              v-model="cuenta.no_factura"
              placeholder="Ej: FAC-00123"
              class="modern-input"
            />
          </div>

          <!-- NCF -->
          <div class="form-field">
            <label for="ncf" class="field-label">
              <i class="pi pi-hashtag mr-2"></i>NCF Proveedor
            </label>
            <InputText
              id="ncf"
              v-model="cuenta.ncf_proveedor"
              placeholder="NCF del proveedor..."
              class="modern-input"
            />
          </div>

          <!-- Fecha Compra -->
          <div class="form-field">
            <label for="fecha-compra" class="field-label required">
              <i class="pi pi-calendar mr-2"></i>Fecha de Compra
            </label>
            <Calendar
              id="fecha-compra"
              v-model="cuenta.fecha_compra"
              dateFormat="yy-mm-dd"
              placeholder="Seleccione fecha..."
              showIcon
              class="modern-calendar w-full"
            />
          </div>

          <!-- Fecha Vencimiento -->
          <div class="form-field">
            <label for="fecha-venc" class="field-label required">
              <i class="pi pi-calendar-times mr-2"></i>Fecha de Vencimiento
            </label>
            <Calendar
              id="fecha-venc"
              v-model="cuenta.fecha_vencimiento"
              dateFormat="yy-mm-dd"
              placeholder="Seleccione fecha..."
              showIcon
              class="modern-calendar w-full"
            />
            <div v-if="diasHastaVencimiento !== null" class="mt-2">
              <Tag
                :value="diasHastaVencimiento < 0
                  ? `Vencida hace ${Math.abs(diasHastaVencimiento)} días`
                  : diasHastaVencimiento === 0
                    ? 'Vence hoy'
                    : `Vence en ${diasHastaVencimiento} días`"
                :severity="estadoVencimiento"
              />
            </div>
          </div>

          <!-- Recordatorio -->
          <div class="form-field flex items-center md:col-span-2">
            <Checkbox
              v-model="cuenta.recordatorio"
              inputId="recordatorio"
              :binary="true"
              class="mr-3"
            />
            <label for="recordatorio" class="field-label mb-0 cursor-pointer">
              <i class="pi pi-bell mr-2"></i>Activar recordatorio de pago (3 días antes)
            </label>
          </div>

        </div>
      </template>
    </Card>

    <!-- Sección 3: Montos y Estado -->
    <Card class="cuenta-section mb-6">
      <template #header>
        <div class="section-header montos-header">
          <i class="pi pi-dollar text-2xl mr-3"></i>
          <div>
            <h2 class="text-xl font-bold">Montos y Estado de Pago</h2>
            <p class="text-sm opacity-90">Configure los valores de la cuenta</p>
          </div>
        </div>
      </template>

      <template #content>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">

          <!-- Total -->
          <div class="form-field">
            <label for="total" class="field-label required">
              <i class="pi pi-money-bill mr-2"></i>Total
            </label>
            <InputNumber
              id="total"
              v-model="cuenta.total"
              mode="currency"
              currency="USD"
              locale="en-US"
              :minFractionDigits="2"
              :maxFractionDigits="2"
              placeholder="0.00"
              class="modern-input-number w-full"
            />
          </div>

          <!-- Abono -->
          <div class="form-field">
            <label for="abono" class="field-label">
              <i class="pi pi-wallet mr-2"></i>Abono Inicial
            </label>
            <InputNumber
              id="abono"
              v-model="cuenta.abono"
              mode="currency"
              currency="USD"
              locale="en-US"
              :minFractionDigits="2"
              :maxFractionDigits="2"
              placeholder="0.00"
              class="modern-input-number w-full"
            />
          </div>

          <!-- Saldo (Calculado automáticamente) -->
          <div class="form-field">
            <label for="saldo" class="field-label">
              <i class="pi pi-chart-line mr-2"></i>Saldo Pendiente
            </label>
            <InputNumber
              id="saldo"
              v-model="cuenta.saldo"
              mode="currency"
              currency="USD"
              locale="en-US"
              :minFractionDigits="2"
              :maxFractionDigits="2"
              placeholder="0.00"
              disabled
              class="modern-input-number w-full saldo-field"
              :class="parseFloat(cuenta.saldo) > 0 ? 'saldo-pendiente' : 'saldo-pagado'"
            />
          </div>

          <!-- Estado -->
          <div class="form-field md:col-span-3">
            <label class="field-label">
              <i class="pi pi-info-circle mr-2"></i>Estado de la Cuenta
            </label>
            <SelectButton
              :allowEmpty="false"
              v-model="cuenta.estado"
              :options="['PENDIENTE', 'PARCIAL', 'PAGADO', 'VENCIDO']"
              class="estado-selector"
            >
              <template #option="slotProps">
                <div class="flex items-center gap-2">
                  <i :class="{
                    'pi pi-clock text-blue-500': slotProps.option === 'PENDIENTE',
                    'pi pi-hourglass text-orange-500': slotProps.option === 'PARCIAL',
                    'pi pi-check-circle text-green-500': slotProps.option === 'PAGADO',
                    'pi pi-times-circle text-red-500': slotProps.option === 'VENCIDO'
                  }"></i>
                  <span>{{ slotProps.option }}</span>
                </div>
              </template>
            </SelectButton>
          </div>

          <!-- Nota -->
          <div class="form-field md:col-span-3">
            <label for="nota" class="field-label">
              <i class="pi pi-comment mr-2"></i>Notas Adicionales
            </label>
            <Textarea
              id="nota"
              v-model="cuenta.nota"
              rows="3"
              placeholder="Ingrese notas adicionales sobre esta cuenta por pagar..."
              class="modern-textarea w-full"
            />
          </div>

        </div>
      </template>
    </Card>

    <!-- Botones de Acción -->
    <div class="action-buttons">
      <Button
        @click="router.push('/cuentasxpagar')"
        icon="pi pi-times"
        label="Cancelar"
        severity="secondary"
        outlined
        class="action-btn"
      />
      <Button
        @click="limpiarFormulario"
        icon="pi pi-refresh"
        label="Limpiar"
        severity="warning"
        outlined
        class="action-btn"
      />
      <Button
        @click="guardarCuenta"
        icon="pi pi-save"
        label="Guardar Cuenta"
        severity="success"
        class="action-btn"
      />
    </div>

    <Toast />
  </div>
</main>
</template>

<style scoped>
/* ===================================
   CREAR CUENTA X PAGAR STYLES
   =================================== */

.crear-cuenta-wrapper {
  min-height: calc(100vh - 80px);
  background: linear-gradient(135deg, rgba(254, 242, 242, 0.3) 0%, rgba(254, 226, 226, 0.2) 100%);
}

.container-cuenta {
  max-width: 1200px;
}

/* Navigation Button */
.nav-btn {
  padding: 0.75rem 1.5rem;
  font-weight: 600;
  border-radius: 10px;
  transition: all 0.3s ease;
}

.nav-btn:hover {
  transform: translateX(-4px);
}

/* Section Cards */
.cuenta-section {
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  border: 1px solid rgba(229, 231, 235, 0.8);
  transition: all 0.3s ease;
  animation: slideIn 0.4s ease-out;
}

.cuenta-section:hover {
  box-shadow: 0 6px 25px rgba(0, 0, 0, 0.12);
}

/* Section Headers */
.section-header {
  padding: 1.5rem;
  border-radius: 16px 16px 0 0;
  display: flex;
  align-items: center;
  color: white;
  font-weight: 600;
}

.proveedor-header {
  background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
}

.compra-header {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
}

.montos-header {
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
}

/* Form Fields */
.form-field {
  display: flex;
  flex-direction: column;
}

.field-label {
  font-weight: 600;
  color: #374151;
  margin-bottom: 0.5rem;
  font-size: 0.95rem;
  display: flex;
  align-items: center;
}

.field-label.required::after {
  content: '*';
  color: #ef4444;
  margin-left: 0.25rem;
}

.field-hint {
  color: #6b7280;
  font-size: 0.875rem;
  margin-top: 0.375rem;
  font-style: italic;
}

/* Modern Inputs */
.modern-input,
.modern-textarea {
  border: 2px solid #e5e7eb;
  border-radius: 10px;
  padding: 0.75rem;
  font-size: 0.95rem;
  transition: all 0.3s ease;
}

.modern-input:focus,
.modern-textarea:focus {
  border-color: #ef4444;
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
  outline: none;
}

/* Dropdown Custom */
.modern-dropdown :deep(.p-dropdown) {
  border: 2px solid #e5e7eb;
  border-radius: 10px;
  transition: all 0.3s ease;
}

.modern-dropdown :deep(.p-dropdown:not(.p-disabled):hover) {
  border-color: #d1d5db;
}

.modern-dropdown :deep(.p-dropdown:not(.p-disabled).p-focus) {
  border-color: #ef4444;
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
}

.dropdown-option {
  padding: 0.5rem 0;
}

/* Calendar Custom */
.modern-calendar :deep(.p-inputtext) {
  border: 2px solid #e5e7eb;
  border-radius: 10px;
  padding: 0.75rem;
}

.modern-calendar :deep(.p-inputtext:focus) {
  border-color: #ef4444;
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
}

/* InputNumber Custom */
.modern-input-number :deep(.p-inputnumber-input) {
  border: 2px solid #e5e7eb;
  border-radius: 10px;
  padding: 0.75rem;
  font-size: 0.95rem;
  font-weight: 600;
}

.modern-input-number :deep(.p-inputnumber-input:focus) {
  border-color: #ef4444;
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
}

.saldo-field :deep(.p-inputnumber-input) {
  font-size: 1.125rem;
  font-weight: 700;
}

.saldo-pendiente :deep(.p-inputnumber-input) {
  color: #dc2626;
  background: rgba(220, 38, 38, 0.05);
}

.saldo-pagado :deep(.p-inputnumber-input) {
  color: #059669;
  background: rgba(5, 150, 105, 0.05);
}

/* Estado Selector */
.estado-selector :deep(.p-button) {
  padding: 0.75rem 1.5rem;
  font-weight: 600;
  transition: all 0.3s ease;
}

.estado-selector :deep(.p-button:not(.p-highlight):hover) {
  background: rgba(0, 0, 0, 0.04);
}

/* Action Buttons */
.action-buttons {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  margin-top: 2rem;
  padding: 1.5rem;
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
}

.action-btn {
  padding: 0.875rem 2rem;
  font-weight: 600;
  border-radius: 10px;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.action-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
}

/* PrimeVue Card Override */
.cuenta-section :deep(.p-card-header) {
  padding: 0;
}

.cuenta-section :deep(.p-card-content) {
  padding: 1.5rem;
}

.cuenta-section :deep(.p-card-body) {
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

/* Responsive */
@media (max-width: 768px) {
  .action-buttons {
    flex-direction: column;
  }

  .action-btn {
    width: 100%;
  }

  .section-header {
    padding: 1rem;
  }

  .cuenta-section :deep(.p-card-content) {
    padding: 1rem;
  }
}
</style>
