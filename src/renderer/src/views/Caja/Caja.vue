<template>
  <main class="content-wrapper">
    <div class="containerS mx-auto px-4 py-6">

      <!-- Header Section -->
      <div class="mb-6">
        <h1 class="text-3xl font-bold text-gray-800 mb-2">Gestión de Caja</h1>
        <p class="text-gray-600">Administra facturas pendientes y operaciones de caja</p>
      </div>

      <div class="caja-dashboard-grid">

        <div class="caja-main-column">

          <!-- User Data Card -->
          <Card class="caja-card caja-card--summary">
            <template #header>
              <div class="card-header-modern">
                <div class="flex items-center gap-3">
                  <div class="icon-wrapper-modern bg-blue-500">
                    <i class="pi pi-user text-white text-2xl"></i>
                  </div>
                  <div>
                    <h2 class="text-xl font-bold text-gray-800">Datos del Usuario</h2>
                    <p class="text-sm text-gray-500">Información del cajero activo</p>
                  </div>
                </div>
              </div>
            </template>
            <template #content>
              <div class="user-summary-grid">
                <div class="user-summary-item">
                  <span class="user-summary-item__label">Fecha</span>
                  <span class="user-summary-item__value">{{ fechaHoy }}</span>
                </div>
                <div class="user-summary-item">
                  <span class="user-summary-item__label">Vendedor</span>
                  <span class="user-summary-item__value">{{ usuarioLocal.nombre }}</span>
                </div>
                <div class="user-summary-item">
                  <span class="user-summary-item__label">Turno</span>
                  <span class="user-summary-item__value">{{ usuarioLocal.token }}</span>
                </div>
                <div class="user-summary-item user-summary-item--invoices">
                  <span class="user-summary-item__label">Facturas del turno</span>
                  <span class="user-summary-item__value">
                    <i class="pi pi-file mr-2 text-blue-500"></i>{{ cantidadFacturasTurno }}
                  </span>
                </div>
              </div>
            </template>
          </Card>

          <!-- Actions Card -->
          <Card class="caja-card caja-card--summary">
            <template #header>
              <div class="card-header-modern">
                <div class="flex items-center gap-3">
                  <div class="icon-wrapper-modern bg-purple-500">
                    <i class="pi pi-bolt text-white text-2xl"></i>
                  </div>
                  <h2 class="text-xl font-bold text-gray-800">Acciones Rápidas</h2>
                </div>
              </div>
            </template>
            <template #content>
              <div class="quick-actions-grid">
                <Button label="Cobrar Todo" @click="fnCobrarTodo" icon="pi pi-check-circle" class="action-btn-modern action-btn-modern--compact" severity="success" />
                <Button label="Eliminar Todo" @click="fnEliminarTodo" icon="pi pi-trash" class="action-btn-modern action-btn-modern--compact" severity="danger" />
                <Button label="Recargar" @click="recargarFacturasFull" icon="pi pi-refresh" class="action-btn-modern action-btn-modern--compact" severity="info" />
              </div>
            </template>
          </Card>

          <!-- Invoices Card -->
          <Card class="caja-card caja-card--invoices">
            <template #header>
              <div class="card-header-modern card-header-modern--invoices">
                <div class="flex items-center gap-3">
                  <div class="icon-wrapper-modern bg-green-500">
                    <i class="pi pi-file text-white text-2xl"></i>
                  </div>
                  <div>
                    <h2 class="text-xl font-bold text-gray-800">Facturas Pendientes</h2>
                    <p class="text-sm text-gray-500">{{ facturasSinCobrar.length }} facturas por cobrar</p>
                  </div>
                </div>
              </div>
            </template>
            <template #content>
              <div v-if="facturasSinCobrar.length > 0" class="facturas-grid-priority">
                <div
                  v-for="factura in facturasSinCobrar"
                  :key="factura.id"
                  class="factura-card-modern"
                >
                  <div class="factura-header">
                    <div class="flex-1">
                      <span class="factura-cliente">
                        {{ factura.nombre_cliente }}
                      </span>
                      <span class="factura-numero">({{ factura.no_factura }})</span>
                      <div class="factura-total">{{ factura.total }}</div>
                    </div>
                    <div class="factura-icon-wrapper">
                      <i class="pi text-2xl" :class="'icon-' + tipoFacturaInfo(factura.metodo_pago).icono"></i>
                    </div>
                  </div>
                  <div class="factura-actions">
                    <Button
                      label="Cobrar"
                      @click="cobrarFactura(factura)"
                      icon="pi pi-check"
                      severity="success"
                      size="small"
                      class="flex-1"
                    />
                    <Button
                      icon="pi pi-eye"
                      @click="fnProductos(factura)"
                      severity="secondary"
                      size="small"
                      outlined
                    />
                    <Button
                      icon="pi pi-print"
                      @click="fnImprimirFactura(factura)"
                      severity="secondary"
                      size="small"
                      outlined
                    />
                    <Button
                      icon="pi pi-times"
                      @click="eliminarFactura(factura.no_factura, factura.id)"
                      severity="danger"
                      size="small"
                      outlined
                    />
                  </div>
                </div>
              </div>

              <!-- Empty State -->
              <div v-else class="empty-state-modern">
                <i class="pi pi-inbox text-6xl text-gray-300 mb-4"></i>
                <p class="text-gray-500 text-lg font-medium">No hay facturas pendientes</p>
                <p class="text-gray-400 text-sm">Las facturas sin cobrar aparecerán aquí</p>
              </div>
            </template>
          </Card>
        </div>

        <div class="caja-side-column">
          <Card class="caja-card sticky top-6">
            <template #header>
              <div class="card-header-modern">
                <div class="flex items-center gap-3">
                  <div class="icon-wrapper-modern bg-orange-500">
                    <i class="pi pi-th-large text-white text-2xl"></i>
                  </div>
                  <h2 class="text-xl font-bold text-gray-800">Acciones de Caja</h2>
                </div>
              </div>
            </template>
            <template #content>
              <div class="grid grid-cols-2 gap-3">
<!--                 <Button
                  label="AGREGAR ABONO"
                  @click="visibleabono = true"
                  icon="pi pi-money-bill"
                  class="caja-action-btn"
                  severity="success"
                />
                <Button
                  label="AGREGAR ENTRADA"
                  @click="visiblentrada = true"
                  icon="pi pi-shopping-bag"
                  class="caja-action-btn"
                  severity="info"
                /> -->
                <Button
                  label="AGREGAR GASTO"
                  @click="visiblegastos = true"
                  icon="pi pi-wallet"
                  class="caja-action-btn"
                  severity="warning"
                />
                <Button
                  label="C. POR COBRAR"
                  as="router-link"
                  to="/cuentas_cobrar"
                  icon="pi pi-credit-card"
                  class="caja-action-btn"
                  severity="secondary"
                  outlined
                />
                <Button
                  label="FACTURAS"
                  @click="visibleimprimirfactura = true"
                  icon="pi pi-print"
                  class="caja-action-btn"
                  severity="secondary"
                  outlined
                />
                <Button
                  label="TALLER"
                  v-if="datosDefault.modo === 'CELULAR' || datosDefault.modo === 'FULL'"
                  @click="visibletaller = true"
                  icon="pi pi-wrench"
                  class="caja-action-btn"
                  severity="secondary"
                  outlined
                />
                <Button
                  label="PRODUCTOS"
                  as="router-link"
                  to="/productos"
                  icon="pi pi-th-large"
                  class="caja-action-btn"
                  severity="secondary"
                  outlined
                />
                <Button
                  label="VENDER"
                  as="router-link"
                  to="/vender"
                  icon="pi pi-cart-plus"
                  class="caja-action-btn"
                  severity="help"
                />
                <Button
                  label="CUADRAR CAJA"
                  @click="cuadrarCaja = true"
                  icon="pi pi-calculator"
                  class="caja-action-btn"
                  severity="contrast"
                />
                <Button
                  label="SALIR"
                  @click="fnRealizarCierre"
                  icon="pi pi-sign-out"
                  class="caja-action-btn"
                  severity="danger"
                />
              </div>
            </template>
          </Card>
        </div>
      </div>
    </div>


   <Toast />

<!-- ////////////////////////////////////////////////////////////////////////////////////////// -->

<Dialog v-model:visible="registrarSocios" position="top" modal :style="{ width: '50rem' }" header="registrarSocios">
  <template #header>
    <div class="inline-flex align-items-center justify-content-center gap-2">
      <span class="font-bold white-space-nowrap">Registrar Socios</span>
    </div>
  </template>

  <fieldset class="border p-3 rounded mb-2">
    <legend class="float-none w-auto px-2">Registrar Socios</legend>
    <div class="grid grid-cols-12  gap-4">
      <div class="col-span-12 md:col-span-4">
        <label >CODIGO</label>
        <InputText
          type="text"
          v-model="registroSocios.codigo"
          placeholder="Codigo"
          v-solonumeros
          @keyup="verificaCodigoSocio"
          @keydown.enter="verificaCodigoSocio"
          class="w-full"
        />
      </div>
      <div class="col-span-12 md:col-span-8">
        <label >NOMBRE</label>
        <InputText
          type="text"
          v-model="registroSocios.nombre"
          placeholder="Nombre"
          v-mayuscula
          class="w-full"
        />
      </div>

      <div class="col-span-12 md:col-span-6 lg:col-span-4">
        <label >CEDULA</label>
        <InputText
          type="text"
          v-model="registroSocios.cedula"
          placeholder="Cedula"
          v-solonumeros
          fluid
          @keydown.enter="cobrandoFactura"
        />
      </div>

      <div class="col-span-12 md:col-span-6 lg:col-span-4">
        <label >TELEFONO</label>
        <InputText
          type="text"
          v-model="registroSocios.telefono"
          placeholder="Telefono"
          v-solonumeros
          class="w-full"
        />
      </div>


      <div class="col-span-12 md:col-span-6 lg:col-span-4">
        <label >EMAIL</label>
        <InputText
          type="text"
          v-model="registroSocios.email"
          placeholder="Email"
          class="w-full"
        />
      </div>


      <div class="col-span-12 md:col-span-6 lg:col-span-4">
        <label >SEXO</label>
        <Select v-model="registroSocios.sexo"
         :options="['HOMBRE','MUJER']"
         fluid
           />
      </div>

      <div class="col-span-12 md:col-span-6 lg:col-span-4">
        <label >CUMPLEAÑO</label>
        <InputText
          type="text"
          v-model="registroSocios.fecha_nacimiento"
          placeholder="Fecha de Nacimiento"
          class="w-full"
        />
      </div>

      <div class="col-span-12 md:col-span-6 lg:col-span-4">
        <label >EDAD</label>
        <InputText
          type="text"
          v-model="registroSocios.edad"
          placeholder="Edad"
          class="w-full"
        />
      </div>

      <div class="col-span-12 ">
        <label >DIRECCION</label>
        <InputText
          type="text"
          v-model="registroSocios.direccion"
          placeholder="Direccion"
          class="w-full"
        />
      </div>

    </div>
  </fieldset>

  <template #footer>
      <Button label="Agregar Socio" outlined severity="secondary" @click="fnAgregarSocio"  />
      <Button label="Cerrar" outlined severity="secondary" @click="registrarSocios = false"  />
  </template>
</Dialog>


<!-- ////////////////////////////////////////////////////////////////////////////////////////// -->
<Dialog v-model:visible="visiblecobrar" modal :style="{ width: '58rem', maxWidth: '96vw' }" header="Cobrar Factura" :pt="{ root: { class: 'cobrar-factura-dialog' } }">
  <template #header>
    <div class="cobro-factura-header">
      <div class="cobro-factura-header__icon">
        <i class="pi pi-credit-card"></i>
      </div>
      <div>
        <span class="cobro-factura-header__title">Cobrar Factura</span>
        <p class="cobro-factura-header__subtitle">Registra el pago y distribuye el cobro correctamente</p>
      </div>
    </div>
  </template>

  <div class="cobro-factura-shell">
    <div class="cobro-factura-summary">
      <div class="cobro-factura-stat">
        <span class="cobro-factura-stat__label">TOTAL</span>
        <span class="cobro-factura-stat__value">{{ totalFactura }}</span>
      </div>
      <div class="cobro-factura-stat">
        <span class="cobro-factura-stat__label">RECIBIDO</span>
        <span class="cobro-factura-stat__value cobro-factura-stat__value--info">{{ recibidoFactura }}</span>
      </div>
      <div class="cobro-factura-stat">
        <span class="cobro-factura-stat__label">DEVUELTA</span>
        <span class="cobro-factura-stat__value cobro-factura-stat__value--success">{{ devueltaFactura }}</span>
      </div>
    </div>

    <div class="cobro-factura-grid">
      <div class="cobro-factura-panel cobro-factura-panel--primary">
        <div class="cobro-factura-field cobro-factura-field--full">
          <label for="dineroRecibido" class="cobro-factura-label">RECIBIDO</label>
          <div class="cobro-factura-money">
            <InputText
              type="text"
              ref="moneyrecibidoRef"
              id="dineroRecibido"
              v-model="recibidoFactura"
              placeholder="0.00"
              v-solonumeros
              v-numeroFocusinOut
              @keyup="calcularVuelto"
              @keydown.enter="cobrandoFactura"
              class="w-full cobro-factura-input cobro-factura-input--hero"
            />
          </div>
        </div>

        <div class="cobro-factura-field">
          <label for="facturaEfectivo" class="cobro-factura-label">EFECTIVO</label>
          <InputText
            id="facturaEfectivo"
            type="text"
            v-model="facturaEfectivo"
            v-solonumeros
            v-decimales
            v-numeroFocusinOut
            @blur="handleEfectivoChange"
            class="w-full cobro-factura-input"
          />
        </div>

        <div class="cobro-factura-field">
          <label for="facturaTarjeta" class="cobro-factura-label">TARJETA</label>
          <InputText
            id="facturaTarjeta"
            type="text"
            v-model="facturaTarjeta"
            v-solonumeros
            v-decimales
            v-numeroFocusinOut
            @blur="handleTarjetaChange"
            class="w-full cobro-factura-input"
          />
        </div>

        <div class="cobro-factura-field">
          <label for="facturaTransferencia" class="cobro-factura-label">TRANSFERENCIA</label>
          <InputText
            id="facturaTransferencia"
            type="text"
            v-model="facturaTransferencia"
            v-solonumeros
            v-decimales
            v-numeroFocusinOut
            @blur="handleTransferenciaChange"
            class="w-full cobro-factura-input"
          />
        </div>

        <div class="cobro-factura-field">
          <label for="propinaFactura" class="cobro-factura-label">PROPINA</label>
          <InputText
            id="propinaFactura"
            type="text"
            v-model="propinaFactura"
            v-solonumeros
            v-decimales
            v-numeroFocusinOut
            @keyup="handlePropinaChange"
            @keydown.enter="cobrandoFactura"
            class="w-full cobro-factura-input"
          />
        </div>
      </div>

      <div class="cobro-factura-panel cobro-factura-panel--aside">
        <div class="cobro-factura-field">
          <label for="totalFacturaCobro" class="cobro-factura-label">TOTAL A COBRAR</label>
          <InputText
            id="totalFacturaCobro"
            type="text"
            v-model="totalFactura"
            readonly
            class="w-full cobro-factura-input cobro-factura-input--readonly"
          />
        </div>

        <div class="cobro-factura-field">
          <label for="devueltaFacturaCobro" class="cobro-factura-label">CAMBIO</label>
          <InputText
            id="devueltaFacturaCobro"
            type="text"
            v-model="devueltaFactura"
            readonly
            class="w-full cobro-factura-input cobro-factura-input--readonly cobro-factura-input--success"
          />
        </div>

        <div class="cobro-factura-shortcuts">
          <button type="button" class="cobro-factura-shortcut" @click="fnDejaCambioPropina">
            <span class="cobro-factura-shortcut__key">F1</span>
            <span class="cobro-factura-shortcut__text">Dejar cambio como propina</span>
          </button>
          <button type="button" class="cobro-factura-shortcut" @click="fnCobrarPorTarjeta">
            <span class="cobro-factura-shortcut__key">F2</span>
            <span class="cobro-factura-shortcut__text">Cobrar por tarjeta</span>
          </button>
          <button type="button" class="cobro-factura-shortcut" @click="fnCobrarPorTransferencia">
            <span class="cobro-factura-shortcut__key">F3</span>
            <span class="cobro-factura-shortcut__text">Cobrar por transferencia</span>
          </button>
        </div>
      </div>
    </div>
  </div>

  <template #footer>
    <div class="cobro-factura-footer">
      <Button label="Cancelar" text severity="secondary" @click="visiblecobrar = false" class="cobro-factura-footer__btn" />
      <Button label="Cobrar Factura" icon="pi pi-check-circle" @click="cobrandoFactura" class="cobro-factura-footer__btn cobro-factura-footer__btn--primary" />
    </div>
  </template>
</Dialog>


<!-- ////////////////////////////////////////////////////////////////////////////////////////// -->
<Dialog v-model:visible="visibleimprimirfactura" modal :style="{ width: '70rem' }" :pt="{ root: { class: 'imprimir-factura-dialog' } }">
  <template #header>
    <div class="flex items-center gap-3">
      <div class="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg">
        <i class="pi pi-print text-blue-600 text-2xl"></i>
      </div>
      <div>
        <h3 class="text-xl font-bold text-gray-800 m-0">Imprimir Factura</h3>
        <p class="text-sm text-gray-500 m-0">Busca y selecciona la factura a imprimir</p>
      </div>
    </div>
  </template>

  <div class="imprimir-factura-content">
    <!-- Sección de Búsqueda -->
    <div class="search-section">
      <div class="flex items-center gap-3 mb-4">
        <div class="flex-1">
          <label class="block text-sm font-medium text-gray-700 mb-2">
            <i class="pi pi-search mr-2"></i>Buscar Factura
          </label>
          <InputGroup>
            <InputGroupAddon>
              <i class="pi pi-search"></i>
            </InputGroupAddon>
            <InputText
              v-model="busquedaFactura"
              placeholder="Buscar por número de factura o nombre de cliente..."
              class="w-full"
              fluid
            />
            <Button icon="pi pi-times" @click="busquedaFactura = ''" severity="secondary" v-if="busquedaFactura" text />
          </InputGroup>
          <div class="flex items-center justify-between gap-3 mt-2">
            <small class="text-gray-500">
              {{ facturasFiltradasComputed.length }} factura(s) encontrada(s)
            </small>
            <label class="flex items-center gap-2 text-sm font-medium text-gray-700 cursor-pointer">
              <InputSwitch
                v-model="soloFacturasTurno"
                inputId="solo-facturas-turno"
                @update:modelValue="cambiarFiltroFacturasTurno"
              />
              <span>Solo este turno</span>
            </label>
          </div>
        </div>
        <div class="mt-6">
          <Button icon="pi pi-refresh" label="Recargar" @click="recargarFacturas" :loading="cargandoFacturasTurno" severity="info" outlined />
        </div>
      </div>
    </div>

    <!-- Grid de 2 columnas -->
    <div class="grid grid-cols-12 gap-4">
      <!-- Columna Izquierda: Lista de Facturas -->
      <div class="col-span-7">
        <Card class="facturas-list-card">
          <template #header>
            <div class="p-3 border-b">
              <h4 class="font-semibold text-gray-700 flex items-center gap-2">
                <i class="pi pi-list"></i>
                Facturas Disponibles
              </h4>
            </div>
          </template>
          <template #content>
            <div class="facturas-table-wrapper" style="max-height: 400px; overflow-y: auto;">
              <div v-if="facturasFiltradasComputed.length === 0" class="text-center py-8 text-gray-500">
                <i class="pi pi-inbox text-4xl mb-3 block"></i>
                <p>No se encontraron facturas</p>
                <small>Intenta con otra búsqueda o recarga las facturas</small>
              </div>

              <div
                v-for="factura in facturasFiltradasComputed"
                :key="factura.no_factura"
                @click="seleccionarFacturaDesdeTabla(factura)"
                :class="[
                  'factura-item',
                  { 'factura-selected': campoFactura?.no_factura === factura.no_factura }
                ]"
              >
                <div class="flex items-center justify-between">
                  <div class="flex-1">
                    <div class="flex items-center gap-2 mb-1">
                      <Badge :value="factura.no_factura" severity="info" />
                      <span class="font-semibold text-gray-800">{{ factura.nombre_cliente }}</span>
                    </div>
                    <div class="text-sm text-gray-600">
                      <span class="mr-3">
                        <i class="pi pi-calendar mr-1"></i>{{ factura.fecha }}
                      </span>
                      <span class="font-semibold text-green-600">
                        <i class="pi pi-dollar mr-1"></i>{{ factura.total || '0.00' }}
                      </span>
                    </div>
                  </div>
                  <i class="pi pi-chevron-right text-gray-400"></i>
                </div>
              </div>
            </div>
          </template>
        </Card>
      </div>

      <!-- Columna Derecha: Detalles e Impresión -->
      <div class="col-span-5">
        <Card class="config-card">
          <template #header>
            <div class="p-3 border-b">
              <h4 class="font-semibold text-gray-700 flex items-center gap-2">
                <i class="pi pi-cog"></i>
                Configuración de Impresión
              </h4>
            </div>
          </template>
          <template #content>
            <div class="space-y-4">
              <!-- Factura Seleccionada -->
              <div v-if="campoFactura" class="selected-invoice-info">
                <label class="block text-sm font-medium text-gray-700 mb-2">Factura Seleccionada</label>
                <div class="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <div class="flex items-center gap-2 mb-2">
                    <Badge :value="campoFactura.no_factura" severity="info" />
                    <span class="font-semibold text-gray-800">{{ campoFactura.nombre_cliente }}</span>
                  </div>
                  <div class="text-sm text-gray-600">
                    <div class="flex justify-between">
                      <span>Fecha:</span>
                      <span>{{ campoFactura.fecha }}</span>
                    </div>
                    <div class="flex justify-between font-semibold text-green-600">
                      <span>Total:</span>
                      <span>{{ campoFactura.total || '0.00' }}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div v-else class="text-center py-4 text-gray-500">
                <i class="pi pi-arrow-left text-2xl mb-2 block"></i>
                <p class="text-sm">Selecciona una factura de la lista</p>
              </div>

              <Divider />

              <!-- Selector de Impresora -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  <i class="pi pi-print mr-2"></i>Tipo de Impresora
                </label>
                <div class="grid grid-cols-2 gap-3" role="group" aria-label="Formato de impresión">
                  <Button
                    label="Carta"
                    icon="pi pi-file"
                    class="w-full"
                    :outlined="impresoraSeleccionada !== 'Impresora Normal'"
                    :severity="impresoraSeleccionada === 'Impresora Normal' ? 'primary' : 'secondary'"
                    @click="impresoraSeleccionada = 'Impresora Normal'"
                  />
                  <Button
                    label="Ticket"
                    icon="pi pi-receipt"
                    class="w-full"
                    :outlined="impresoraSeleccionada !== 'Impresora Ticket'"
                    :severity="impresoraSeleccionada === 'Impresora Ticket' ? 'primary' : 'secondary'"
                    @click="impresoraSeleccionada = 'Impresora Ticket'"
                  />
                </div>
              </div>

              <!-- Botón de Imprimir -->
              <Button
                :disabled="!campoFactura || !impresoraSeleccionada || imprimiendoFacturaSeleccionada"
                :loading="imprimiendoFacturaSeleccionada"
                @click="imprimirFactura"
                label="Imprimir Factura"
                icon="pi pi-print"
                severity="primary"
                size="large"
                class="w-full mt-4"
              />
            </div>
          </template>
        </Card>
      </div>
    </div>
  </div>

  <template #footer>
    <div class="flex justify-end gap-2">
      <Button label="Cerrar" icon="pi pi-times" @click="visibleimprimirfactura = false" severity="secondary" outlined />
    </div>
  </template>
</Dialog>

<!-- Selección moderna del formato para la impresión rápida -->
<Dialog
  v-model:visible="visibleSeleccionTipoImpresion"
  modal
  header="Imprimir factura"
  :style="{ width: '32rem' }"
  @hide="cancelarSeleccionImpresion"
>
  <div class="pb-2">
    <p class="text-gray-500 mt-0 mb-5">Selecciona el formato que deseas utilizar.</p>

    <div class="grid grid-cols-2 gap-4">
      <Button
        class="print-format-card print-format-card--letter"
        severity="secondary"
        outlined
        @click="confirmarSeleccionImpresion('carta')"
      >
        <div class="flex flex-col items-center gap-2 py-3">
          <span class="print-format-icon"><i class="pi pi-file-pdf"></i></span>
          <strong class="text-lg">Carta</strong>
          <small class="font-normal text-gray-500">Documento completo</small>
        </div>
      </Button>

      <Button
        class="print-format-card print-format-card--ticket"
        severity="primary"
        @click="confirmarSeleccionImpresion('ticket')"
      >
        <div class="flex flex-col items-center gap-2 py-3">
          <span class="print-format-icon"><i class="pi pi-ticket"></i></span>
          <strong class="text-lg">Ticket</strong>
          <small class="font-normal opacity-80">Impresora térmica</small>
        </div>
      </Button>
    </div>
  </div>

  <template #footer>
    <Button
      label="Cancelar"
      icon="pi pi-times"
      severity="secondary"
      text
      @click="cancelarSeleccionImpresion"
    />
  </template>
</Dialog>

<!-- ////////////////////////////////////////////////////////////////////////////////////////// -->
<Dialog v-model:visible="visiblegastos" modal :style="{ width: '55rem' }" :dismissableMask="true">
  <template #header>
    <div class="flex align-items-center gap-3">
      <i class="pi pi-wallet text-3xl text-primary"></i>
      <div>
        <h3 class="m-0 text-2xl font-semibold">Registro de Gastos</h3>
        <p class="m-0 mt-1 text-sm text-gray-500">Complete la información del gasto</p>
      </div>
    </div>
  </template>

  <div class="p-4">
    <!-- Información Financiera -->
    <div class="mb-5">
      <h4 class="text-lg font-semibold mb-3 text-gray-700 border-b pb-2">
        <i class="pi pi-dollar mr-2"></i>Información Financiera
      </h4>
      <div class="grid grid-cols-12 gap-4">
        <div class="col-span-6">
          <label for="cantidadGasto" class="block mb-2 font-medium text-gray-700">
            <i class="pi pi-money-bill mr-1"></i>Monto
          </label>
          <InputText
            v-model="camposGastos.cantidad"
            v-solonumeros
            v-numeroFocusinOut
            v-decimales
            fluid
            class="w-full"
            id="cantidadGasto"
            placeholder="0.00"
            maxlength="250"
          />
        </div>

        <div class="col-span-6">
          <label for="metodoGasto" class="block mb-2 font-medium text-gray-700">
            <i class="pi pi-credit-card mr-1"></i>Método de Pago
          </label>
          <Select
            v-model="camposGastos.metodo"
            :options="['EFECTIVO','TRANSFERENCIA']"
            placeholder="Seleccione método"
            fluid
            class="w-full"
            id="metodoGasto"
          />
        </div>
      </div>
    </div>

    <!-- Información Temporal -->
    <div class="mb-5">
      <h4 class="text-lg font-semibold mb-3 text-gray-700 border-b pb-2">
        <i class="pi pi-calendar mr-2"></i>Fecha y Hora
      </h4>
      <div class="grid grid-cols-12 gap-4">
        <div class="col-span-6">
          <label for="fechaGasto" class="block mb-2 font-medium text-gray-700">
            <i class="pi pi-calendar mr-1"></i>Fecha
          </label>
          <Calendar
            v-model="camposGastos.fecha"
            fluid
            class="w-full"
            id="fechaGasto"
            placeholder="Seleccione fecha"
            dateFormat="dd/mm/yy"
            showIcon
          />
        </div>

        <div class="col-span-6">
          <label for="horaGasto" class="block mb-2 font-medium text-gray-700">
            <i class="pi pi-clock mr-1"></i>Hora
          </label>
          <InputText
            type="text"
            v-model="camposGastos.hora"
            fluid
            class="w-full"
            id="horaGasto"
            placeholder="HH:mm"
            maxlength="250"
          />
        </div>
      </div>
    </div>

    <!-- Descripción -->
    <div class="mb-3">
      <h4 class="text-lg font-semibold mb-3 text-gray-700 border-b pb-2">
        <i class="pi pi-file-edit mr-2"></i>Detalles
      </h4>
      <label for="descripcionGasto" class="block mb-2 font-medium text-gray-700">
        Descripción del Gasto
      </label>
      <Textarea
        v-model="camposGastos.descripcion"
        fluid
        class="w-full"
        id="descripcionGasto"
        name="descripcion"
        rows="4"
        placeholder="Ingrese una descripción detallada del gasto..."
      />
    </div>

    <div v-if="camposGastos.metodo === 'TRANSFERENCIA'" class="mb-3">
      <label for="bancoGastoCaja" class="block mb-2 font-medium text-gray-700">
        Banco
      </label>
      <select id="bancoGastoCaja" v-model="cuentaBancaria" class="w-full border rounded p-3">
        <option :value="null" disabled>Seleccione un banco</option>
        <option :value="banco" v-for="banco in bancoArray" :key="banco.id">{{ banco.nombre }}</option>
      </select>
    </div>

    <!-- Campos ocultos -->
    <div class="hidden">
      <InputText v-model="camposGastos.turno" />
      <InputText v-model="camposGastos.mes" />
      <InputText v-model="camposGastos.year" />
    </div>
  </div>

  <template #footer>
    <div class="flex justify-between w-full">
      <Button
        label="Imprimir Último"
        icon="pi pi-print"
        severity="info"
        outlined
        @click="imprimirUltimoGasto"
      />
      <div class="flex gap-2">
        <Button
          label="Cancelar"
          icon="pi pi-times"
          severity="secondary"
          text
          :disabled="guardandoGasto"
          @click="visiblegastos = false"
        />
        <Button
          :label="guardandoGasto ? 'Guardando...' : 'Guardar Gasto'"
          icon="pi pi-check"
          severity="success"
          :loading="guardandoGasto"
          :disabled="guardandoGasto"
          @click="agregarGasto"
          autofocus
        />
      </div>
    </div>
  </template>
</Dialog>

<!-- ////////////////////////////////////////////////////////////////////////////////////////// -->
<Dialog v-model:visible="visibleabono" modal :position="position" header="Editar Producto" :style="{ width: '50rem' }">
  <template #header>
    <div class="inline-flex align-items-center justify-content-center gap-2">
      <span class="font-bold white-space-nowrap">ABONO</span>
    </div>
  </template>

      <fieldset class="border p-3 rounded mb-2">
        <legend class="float-none w-auto px-2">ABONO</legend>
          <div class="grid grid-cols-12 gap-4">


          </div>
      </fieldset>

  <template #footer>
    <Button label="Cancel" text severity="secondary" @click="visibleabono = false" autofocus />
    <Button label="Imprimir" outlined severity="secondary" @click="imprimirAbono" autofocus />
  </template>
</Dialog>
<!-- ////////////////////////////////////////////////////////////////////////////////////////// -->
<Dialog v-model:visible="visiblentrada" modal :style="{ width: '50rem' }" header="ENTRADA">
  <template #header>
    <div class="inline-flex align-items-center justify-content-center gap-2">
      <span class="font-bold white-space-nowrap">ENTRADA</span>
    </div>
  </template>

  <fieldset class="border p-3 rounded mb-2">
    <legend class="float-none w-auto px-2">ENTRADA</legend>
    <div class="grid grid-cols-12  gap-4">
      <div class="col-span-4">
        <label for="cantidadAgregarDatos">CANTIDAD</label>
        <InputNumber
          v-model="camposEntrada.cantidad"
          v-solonumeros
          v-numeroFocusinOut
          v-decimales
          class="w-full"
          id="cantidadAgregarDatos"
          placeholder="cantidad"
          maxlength="250"
        />
      </div>

      <div class="col-span-4">
        <label for="fechaAgregarDatos">FECHA</label>
        <Calendar
          v-model="camposEntrada.fecha"
          class="w-full"
          id="fechaAgregarDatos"
          placeholder="fecha"
          maxlength="250"
        />
      </div>

      <div class="col-span-4">
        <label for="horaAgregarDatos">HORA</label>
        <InputText
          type="text"
          v-model="camposEntrada.hora"
          class="w-full"
          id="horaAgregarDatos"
          placeholder="hora"
          maxlength="250"
        />
      </div>

      <div class="col-span-4">
        <label for="turnoAgregarDatos">TURNO</label>
        <InputText
          type="text"
          v-model="camposEntrada.turno"
          class="w-full"
          id="turnoAgregarDatos"
          readonly
          placeholder="turno"
          maxlength="250"
        />
      </div>


      <div class="col-span-4">
        <label for="mesAgregarDatos">MES</label>
        <InputText
          v-model="camposEntrada.mes"
          v-solonumeros
          v-numeroFocusinOut
          class="w-full"
          id="mesAgregarDatos"
          placeholder="mes"
          maxlength="250"
        />
      </div>

      <div class="col-span-4">
        <label for="yearAgregarDatos">YEAR</label>
        <InputText
          v-model="camposEntrada.year"
          v-solonumeros
          v-numeroFocusinOut
          class="w-full"
          id="yearAgregarDatos"
          placeholder="year"
          maxlength="250"
        />
      </div>

      <div class="col-span-12">
        <label for="descripcionAgregarDatos">DESCRIPCION</label>
        <Textarea
          v-model="camposEntrada.descripcion"
          class="w-full"
          id="descripcionAgregarDatos"
          name="descripcion"
          rows="3"
        />
      </div>

    </div>
  </fieldset>

  <template #footer>
    <Button label="Cancel" text severity="secondary" @click="visiblentrada = false" autofocus />
    <Button label="Imprimir" outlined severity="secondary" @click="imprimirEntrada" autofocus />
  </template>
</Dialog>

<!-- ////////////////////////////////////////////////////////////////////////////////////////// -->
<Dialog v-model:visible="visibletaller" modal :style="{ width: '75rem' }" :pt="{ root: { class: 'taller-dialog' } }">
  <template #header>
    <div class="flex items-center gap-3">
      <div class="flex items-center justify-center w-12 h-12 bg-orange-100 rounded-lg">
        <i class="pi pi-wrench text-orange-600 text-2xl"></i>
      </div>
      <div>
        <h3 class="text-xl font-bold text-gray-800 m-0">Gestión de Taller</h3>
        <p class="text-sm text-gray-500 m-0">Busca y gestiona órdenes de reparación</p>
      </div>
    </div>
  </template>

  <div class="taller-content">
    <!-- Sección de Búsqueda -->
    <div class="search-section">
      <div class="flex items-center gap-3 mb-4">
        <div class="flex-1">
          <label class="block text-sm font-medium text-gray-700 mb-2">
            <i class="pi pi-search mr-2"></i>Buscar Orden de Reparación
          </label>
          <InputGroup>
            <InputGroupAddon>
              <i class="pi pi-search"></i>
            </InputGroupAddon>
            <InputText
              v-model="busquedaTaller"
              placeholder="Buscar por # orden, nombre de cliente o equipo..."
              class="w-full"
              fluid
            />
            <Button icon="pi pi-times" @click="busquedaTaller = ''" severity="secondary" v-if="busquedaTaller" text />
          </InputGroup>
          <small class="text-gray-500 mt-1 block">
            {{ ordenesTallerFiltradasComputed.length }} orden(es) encontrada(s)
          </small>
        </div>
        <div class="mt-6">
          <Button icon="pi pi-refresh" label="Recargar" @click="fetchDataTaller" severity="info" outlined />
        </div>
      </div>
    </div>

    <!-- Grid de 2 columnas -->
    <div class="grid grid-cols-12 gap-4">
      <!-- Columna Izquierda: Lista de Órdenes -->
      <div class="col-span-7">
        <Card class="ordenes-list-card">
          <template #header>
            <div class="p-3 border-b">
              <h4 class="font-semibold text-gray-700 flex items-center gap-2">
                <i class="pi pi-list"></i>
                Órdenes de Reparación
              </h4>
            </div>
          </template>
          <template #content>
            <div class="ordenes-table-wrapper" style="max-height: 450px; overflow-y: auto;">
              <div v-if="ordenesTallerFiltradasComputed.length === 0" class="text-center py-8 text-gray-500">
                <i class="pi pi-inbox text-4xl mb-3 block"></i>
                <p>No se encontraron órdenes</p>
                <small>Intenta con otra búsqueda o recarga las órdenes</small>
              </div>

              <div
                v-for="orden in ordenesTallerFiltradasComputed"
                :key="orden.no_factura"
                @click="seleccionarOrdenDesdeTabla(orden)"
                :class="[
                  'orden-item',
                  { 'orden-selected': facturaTallerSeleccionada?.no_factura === orden.no_factura }
                ]"
              >
                <div class="flex items-center justify-between">
                  <div class="flex-1">
                    <div class="flex items-center gap-2 mb-1">
                      <Badge :value="orden.no_factura" :severity="orden.estado === 'Entregado' ? 'success' : orden.estado === 'Reparado' ? 'info' : 'warning'" />
                      <span class="font-semibold text-gray-800">{{ orden.nombre }}</span>
                    </div>
                    <div class="text-sm text-gray-600">
                      <span class="mr-3">
                        <i class="pi pi-mobile mr-1"></i>{{ orden.equipo }} {{ orden.marca }}
                      </span>
                      <span class="font-semibold" :class="orden.estado === 'Entregado' ? 'text-green-600' : orden.estado === 'Reparado' ? 'text-blue-600' : 'text-orange-600'">
                        <i class="pi pi-circle-fill mr-1 text-xs"></i>{{ orden.estado }}
                      </span>
                    </div>
                    <div class="text-xs text-gray-500 mt-1">
                      <span class="mr-3">
                        <i class="pi pi-calendar mr-1"></i>{{ orden.fecha_entrada }}
                      </span>
                      <span class="font-semibold text-green-600">
                        <i class="pi pi-dollar mr-1"></i>{{ orden.total || '0.00' }}
                      </span>
                    </div>
                  </div>
                  <i class="pi pi-chevron-right text-gray-400"></i>
                </div>
              </div>
            </div>
          </template>
        </Card>
      </div>

      <!-- Columna Derecha: Detalles y Acciones -->
      <div class="col-span-5">
        <Card class="details-card">
          <template #header>
            <div class="p-3 border-b">
              <h4 class="font-semibold text-gray-700 flex items-center gap-2">
                <i class="pi pi-cog"></i>
                Detalles y Acciones
              </h4>
            </div>
          </template>
          <template #content>
            <div class="space-y-4">
              <!-- Orden Seleccionada -->
              <div v-if="facturaTallerSeleccionada" class="selected-order-info">
                <label class="block text-sm font-medium text-gray-700 mb-2">Orden Seleccionada</label>
                <div class="bg-orange-50 border border-orange-200 rounded-lg p-3">
                  <div class="flex items-center gap-2 mb-2">
                    <Badge :value="facturaTallerSeleccionada.no_factura" severity="warning" />
                    <span class="font-semibold text-gray-800">{{ facturaTallerSeleccionada.nombre }}</span>
                  </div>
                  <div class="text-sm text-gray-600 space-y-1">
                    <div class="flex justify-between">
                      <span>Equipo:</span>
                      <span class="font-medium">{{ facturaTallerSeleccionada.equipo }} {{ facturaTallerSeleccionada.marca }}</span>
                    </div>
                    <div class="flex justify-between">
                      <span>Estado:</span>
                      <span class="font-medium">{{ facturaTallerSeleccionada.estado }}</span>
                    </div>
                    <div class="flex justify-between">
                      <span>Fecha:</span>
                      <span>{{ facturaTallerSeleccionada.fecha_entrada }}</span>
                    </div>
                    <div class="flex justify-between font-semibold text-green-600">
                      <span>Total:</span>
                      <span>{{ facturaTallerSeleccionada.total || '0.00' }}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div v-else class="text-center py-4 text-gray-500">
                <i class="pi pi-arrow-left text-2xl mb-2 block"></i>
                <p class="text-sm">Selecciona una orden de la lista</p>
              </div>

              <Divider />

              <!-- Método de Pago -->
              <div v-if="facturaTallerSeleccionada">
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  <i class="pi pi-credit-card mr-2"></i>Método de Pago
                </label>
                <Select
                  v-model="facturaTallerSeleccionada.metodopago"
                  :options="[
                    { label: 'EFECTIVO', value: 'EFECTIVO', icon: 'pi-money-bill' },
                    { label: 'TRANSFERENCIA', value: 'TRANSFERENCIA', icon: 'pi-send' },
                    { label: 'TARJETA', value: 'TARJETA', icon: 'pi-credit-card' }
                  ]"
                  optionLabel="label"
                  optionValue="value"
                  placeholder="Seleccione método de pago"
                  fluid
                >
                  <template #option="slotProps">
                    <div class="flex items-center gap-2">
                      <i :class="['pi', slotProps.option.icon]"></i>
                      <span>{{ slotProps.option.label }}</span>
                    </div>
                  </template>
                </Select>
              </div>

              <!-- Acciones Rápidas -->
              <div v-if="facturaTallerSeleccionada && facturaTallerSeleccionada.metodopago === 'TRANSFERENCIA'">
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  <i class="pi pi-building-columns mr-2"></i>Banco
                </label>
                <select v-model="cuentaBancaria" class="w-full border rounded p-3">
                  <option :value="null" disabled>Seleccione un banco</option>
                  <option :value="banco" v-for="banco in bancoArray" :key="banco.id">{{ banco.nombre }}</option>
                </select>
              </div>

              <div v-if="facturaTallerSeleccionada" class="space-y-2">
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  <i class="pi pi-bolt mr-2"></i>Acciones Rápidas
                </label>
                <div class="grid grid-cols-2 gap-2">
                  <Button label="Ver Fallas" icon="pi pi-eye" outlined severity="warning" size="small" @click="fnVerFallas" fluid />
                  <Button label="Imprimir" icon="pi pi-print" outlined severity="info" size="small" @click="imprimirTaller" fluid />
                  <Button label="Etiqueta" icon="pi pi-tag" outlined severity="secondary" size="small" @click="imprimirEtiquetaTaller" fluid />
                  <Button label="Pedido" icon="pi pi-cart-plus" outlined severity="success" size="small" @click="visiblePedidos = true" fluid />
                </div>
              </div>
            </div>
          </template>
        </Card>
      </div>
    </div>
  </div>

  <template #footer>
    <div class="flex justify-between items-center">
      <div class="flex gap-2">
        <Button label="Nueva Orden" icon="pi pi-plus" @click="nuevoTaller" severity="success" outlined />
        <Button label="Ver Todas" icon="pi pi-list" as="router-link" to="/taller" severity="info" outlined />
      </div>
      <div class="flex gap-2">
        <Button label="Comentario" icon="pi pi-comment" @click="visibleModificarTaller = true" severity="secondary" outlined v-if="facturaTallerSeleccionada" />
        <Button label="Editar" icon="pi pi-pencil" @click="fnEditarTaller" severity="secondary" outlined v-if="facturaTallerSeleccionada" />
        <Button label="Ver Clave" icon="pi pi-key" @click="verClaveTaller" severity="secondary" outlined v-if="facturaTallerSeleccionada" />
        <Button label="Costo Rep." icon="pi pi-money-bill" @click="fnReparacionTaller" severity="secondary" outlined v-if="facturaTallerSeleccionada" />
        <Button label="Costo Piezas" icon="pi pi-wrench" @click="visibleCostoPiezas = true" severity="secondary" outlined v-if="facturaTallerSeleccionada" />
        <Button label="Abonar" icon="pi pi-dollar" @click="abonoVisible" severity="primary" v-if="facturaTallerSeleccionada" />
        <Button label="Entregar" icon="pi pi-check" @click="entregarTaller" severity="success" v-if="facturaTallerSeleccionada" />
        <Button label="Cerrar" icon="pi pi-times" @click="visibletaller = false" severity="secondary" outlined />
      </div>
    </div>
  </template>
</Dialog>

<!-- ************************************************************************************* -->
<Dialog v-model:visible="visibleModificarTaller" position="top" modal :style="{ width: '50rem' }" header="ModificarTaller">
  <template #header>
    <div class="inline-flex align-items-center justify-content-center gap-2">
      <span class="font-bold white-space-nowrap">ModificarTaller</span>
    </div>
  </template>

  <fieldset class="border p-3 rounded mb-2">
    <legend class="float-none w-auto px-2">Agregar Comentario {{facturaTallerSeleccionada.no_factura}}</legend>
    <div class="grid grid-cols-1 gap-4">
      <div>
        <TextArea v-model="comentarioTaller" fluid />
      </div>
    </div>
  </fieldset>

  <template #footer>
      <Button label="Agregar Comentario" icon="pi pi-comment" outlined severity="secondary" @click="fnComentario" />
      <Button label="Cerrar" outlined severity="secondary" @click="visibleModificarTaller = false" />
  </template>
</Dialog>

<!-- ************************************************************************************* -->
<Dialog
  v-model:visible="cuadrarCaja"
  modal
  :style="{ width: 'min(96vw, 1180px)' }"
  :pt="{ root: { class: 'contar-dinero-dialog' }, content: { class: 'contar-dinero-dialog-content' } }"
>
  <template #header>
    <div class="flex items-center gap-3">
      <div class="flex items-center justify-center w-12 h-12 bg-green-100 rounded-lg">
        <i class="pi pi-calculator text-green-600 text-2xl"></i>
      </div>
      <div>
        <h3 class="text-xl font-bold text-gray-800 m-0">Contar Dinero</h3>
        <p class="text-sm text-gray-500 m-0">Registro y cuadre de efectivo en caja</p>
      </div>
    </div>
  </template>

  <div class="contar-dinero-layout">
  <!-- Información del Turno -->
  <Card class="mb-4 shadow-sm contar-dinero-turno-card">
    <template #content>
      <div class="grid grid-cols-12 gap-3">
        <div class="col-span-12 md:col-span-4">
          <label class="block text-sm font-medium text-gray-700 mb-2">
            <i class="pi pi-clock mr-1 text-green-600"></i>
            TURNO
          </label>
          <Dropdown
            v-model="turnoUsuarioSelected"
            :options="opcionesTurnoCuadre"
            @change="cambioTurnoSelected"
            fluid
            class="w-full"
          />
        </div>

        <div class="col-span-12 md:col-span-4">
          <label class="block text-sm font-medium text-gray-700 mb-2">
            <i class="pi pi-calendar mr-1 text-green-600"></i>
            Hora Inicio
          </label>
          <InputText
            v-model="cuadre.horainicio"
            fluid
            class="w-full"
            readonly
          />
        </div>

        <div class="col-span-12 md:col-span-4">
          <label class="block text-sm font-medium text-gray-700 mb-2">
            <i class="pi pi-calendar mr-1 text-green-600"></i>
            Hora Fin
          </label>
          <InputText
            v-model="cuadre.horafin"
            fluid
            class="w-full"
            readonly
          />
        </div>
      </div>
    </template>
  </Card>

  <div class="contar-dinero-main-grid">
  <!-- Conteo de Dinero -->
  <div class="grid grid-cols-12 gap-4 mb-4 contar-dinero-secciones">
    <!-- Monedas -->
    <div class="col-span-12 lg:col-span-6">
      <Card class="h-full shadow-sm contar-dinero-card">
        <template #title>
          <div class="flex items-center gap-2">
            <i class="pi pi-circle text-amber-500 text-lg"></i>
            <span class="text-base font-semibold text-gray-700">MONEDAS</span>
          </div>
        </template>
        <template #content>
          <div class="grid grid-cols-2 gap-2.5">
            <div class="dinero-item">
              <label class="dinero-item-label">
                <i class="pi pi-money-bill mr-1"></i>
                1 {{ datosConfiguracion.moneda }}
              </label>
              <InputText
                v-model="pesos"
                v-solonumeros
                v-numeroFocusinOut
                fluid
                class="w-full dinero-input dinero-input-compact"
                id="pesos"
              />
            </div>

            <div class="dinero-item">
              <label class="dinero-item-label">
                <i class="pi pi-money-bill mr-1"></i>
                5 {{ datosConfiguracion.plural }}
              </label>
              <InputText
                v-model="cincopesos"
                v-solonumeros
                v-numeroFocusinOut
                fluid
                class="w-full dinero-input dinero-input-compact"
                id="cincopesos"
              />
            </div>

            <div class="dinero-item">
              <label class="dinero-item-label">
                <i class="pi pi-money-bill mr-1"></i>
                10 {{ datosConfiguracion.plural }}
              </label>
              <InputText
                v-model="diezpesos"
                v-solonumeros
                v-numeroFocusinOut
                fluid
                class="w-full dinero-input dinero-input-compact"
                id="diezpesos"
              />
            </div>

            <div class="dinero-item">
              <label class="dinero-item-label">
                <i class="pi pi-money-bill mr-1"></i>
                25 {{ datosConfiguracion.plural }}
              </label>
              <InputText
                v-model="veinticincopesos"
                v-solonumeros
                v-numeroFocusinOut
                fluid
                class="w-full dinero-input dinero-input-compact"
                id="veinticincopesos"
              />
            </div>
          </div>
        </template>
      </Card>
    </div>

    <!-- Billetes -->
    <div class="col-span-12 lg:col-span-6">
      <Card class="h-full shadow-sm contar-dinero-card">
        <template #title>
          <div class="flex items-center gap-2">
            <i class="pi pi-wallet text-green-600 text-lg"></i>
            <span class="text-base font-semibold text-gray-700">BILLETES</span>
          </div>
        </template>
        <template #content>
          <div class="grid grid-cols-2 gap-2.5">
            <div class="dinero-item">
              <label class="dinero-item-label">
                <i class="pi pi-dollar mr-1"></i>
                50 {{ datosConfiguracion.plural }}
              </label>
              <InputText
                v-model="cincuentapesos"
                v-solonumeros
                v-numeroFocusinOut
                fluid
                class="w-full dinero-input dinero-input-compact"
                id="cincuentapesos"
              />
            </div>

            <div class="dinero-item">
              <label class="dinero-item-label">
                <i class="pi pi-dollar mr-1"></i>
                100 {{ datosConfiguracion.plural }}
              </label>
              <InputText
                v-model="cienpesos"
                v-solonumeros
                v-numeroFocusinOut
                fluid
                class="w-full dinero-input dinero-input-compact"
                id="cienpesos"
              />
            </div>

            <div class="dinero-item">
              <label class="dinero-item-label">
                <i class="pi pi-dollar mr-1"></i>
                200 {{ datosConfiguracion.plural }}
              </label>
              <InputText
                v-model="docientospesos"
                v-solonumeros
                v-numeroFocusinOut
                fluid
                class="w-full dinero-input dinero-input-compact"
                id="docientospesos"
              />
            </div>

            <div class="dinero-item">
              <label class="dinero-item-label">
                <i class="pi pi-dollar mr-1"></i>
                500 {{ datosConfiguracion.plural }}
              </label>
              <InputText
                v-model="quinientoscopesos"
                v-solonumeros
                v-numeroFocusinOut
                fluid
                class="w-full dinero-input dinero-input-compact"
                id="quinientoscopesos"
              />
            </div>

            <div class="dinero-item">
              <label class="dinero-item-label">
                <i class="pi pi-dollar mr-1"></i>
                1000 {{ datosConfiguracion.plural }}
              </label>
              <InputText
                v-model="milpesos"
                v-solonumeros
                v-numeroFocusinOut
                fluid
                class="w-full dinero-input dinero-input-compact"
                id="milpesos"
              />
            </div>

            <div class="dinero-item">
              <label class="dinero-item-label">
                <i class="pi pi-dollar mr-1"></i>
                2000 {{ datosConfiguracion.plural }}
              </label>
              <InputText
                v-model="dosmilpesos"
                v-solonumeros
                v-numeroFocusinOut
                fluid
                class="w-full dinero-input dinero-input-compact"
                id="dosmilpesos"
              />
            </div>
          </div>
        </template>
      </Card>
    </div>
  </div>

  <!-- Resumen y Totales -->
  <Card class="shadow-sm contar-dinero-totales-card contar-dinero-resumen-card">
    <template #content>
      <div class="grid grid-cols-12 gap-3">
        <div class="col-span-12">
          <label class="block text-sm font-semibold text-gray-700 mb-2">
            <i class="pi pi-box mr-1 text-blue-600"></i>
            INICIO CAJA
          </label>
          <InputText
            v-model="contidadInicioCaja"
            v-solonumeros
            v-numeroFocusinOut
            fluid
            class="w-full dinero-input-total"
          />
        </div>

        <div class="col-span-12">
          <label class="block text-sm font-semibold text-gray-700 mb-2">
            <i class="pi pi-calculator mr-1 text-green-600"></i>
            TOTAL CONTADO
          </label>
          <InputText
            v-model="totalModal"
            v-solonumeros
            v-decimales
            v-numeroFocusinOut
            fluid
            class="w-full dinero-input-total bg-green-50"
            readonly
          />
        </div>

        <div class="col-span-12">
          <label class="block text-sm font-semibold text-gray-700 mb-2">
            <i class="pi pi-database mr-1 text-purple-600"></i>
            TOTAL REGISTRADO
          </label>
          <InputText
            v-model="totalModalEnCaja"
            fluid
            class="w-full dinero-input-total bg-purple-50"
            readonly
          />
        </div>

        <div class="col-span-12">
          <Divider />
          <div class="flex items-center justify-between p-3 rounded-lg" :class="{
            'bg-green-50 border border-green-200': alerta === 'success',
            'bg-red-50 border border-red-200': alerta === 'danger',
            'bg-yellow-50 border border-yellow-200': alerta === 'warning'
          }">
            <div class="flex items-center gap-2">
              <i class="text-2xl" :class="{
                'pi pi-check-circle text-green-600': alerta === 'success',
                'pi pi-exclamation-circle text-red-600': alerta === 'danger',
                'pi pi-info-circle text-yellow-600': alerta === 'warning'
              }"></i>
              <div>
                <span class="font-semibold" :class="{
                  'text-green-800': alerta === 'success',
                  'text-red-800': alerta === 'danger',
                  'text-yellow-800': alerta === 'warning'
                }">ESTADO:</span>
                <span class="ml-2 font-medium" :class="{
                  'text-green-700': alerta === 'success',
                  'text-red-700': alerta === 'danger',
                  'text-yellow-700': alerta === 'warning'
                }">{{ colorModal }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>
  </Card>
  </div>
  </div>

  <template #footer>
    <div class="contar-dinero-footer">
      <div class="contar-dinero-footer-group">
        <Button label="Facturas" icon="pi pi-print" outlined severity="secondary" @click="fnTodasLasFacturas" />
        <Button label="Resumen Venta" icon="pi pi-chart-bar" outlined severity="secondary" @click="fnResumenVenta" />
        <Button label="Productos Vendidos" icon="pi pi-box" outlined severity="secondary" @click="fnProductosVendidos" />
      </div>
      <div class="contar-dinero-footer-group">
        <Button label="Abrir caja" icon="pi pi-unlock" outlined severity="success" @click="fnAbrirCaja" />
        <Button label="Cuadrar Caja" icon="pi pi-dollar" severity="success" @click="visibleCuadre = true" />
        <Button label="Cerrar" outlined severity="secondary" @click="cuadrarCaja = false" />
      </div>
    </div>
  </template>
</Dialog>

<!-- ************************************************************************************* -->
<Dialog v-model:visible="visibleInicioCaja" modal :style="{ width: '25rem' }" header="INICIO DE CAJA">
  <template #header>
    <div class="inline-flex align-items-center justify-content-center gap-2">
      <span class="font-bold white-space-nowrap">INICIO DE CAJA</span>
    </div>
  </template>

  <fieldset class="border p-3 rounded mb-2">
    <legend class="float-none w-auto px-2">CANTIDAD</legend>
    <div class="grid grid-cols-1 gap-4">
      <div>
        <label for="cantidadInicio">Cantidad en {{ datosConfiguracion.plural }}</label>
        <InputText
          v-model="cantidadInicio"
          v-solonumeros
          v-numeroFocusinOut
          style="height: 5rem; font-size: 2.5rem; padding: 0.5rem;"
          class="w-full"
          id="cantidadInicio"
        />
      </div>
    </div>
  </fieldset>

  <template #footer>
    <Button label="Agregar Cantidad" icon="pi pi-send" outlined severity="secondary" @click="fnAgregarCantidadCaja" />
    <Button label="Cerrar" outlined severity="secondary" @click="visibleInicioCaja = false" autofocus />
  </template>
</Dialog>

<!-- ************************************************************************************* -->
<Dialog v-model:visible="visibleCuadre" modal :style="{ width: '40rem' }" header="Cuadre">
  <template #header>
    <div class="inline-flex align-items-center justify-content-center gap-2">
      <span class="font-bold white-space-nowrap">Cuadre</span>
    </div>
  </template>

    <fieldset class="border p-3 rounded mb-2">
      <legend class="float-none w-auto px-2">Elige una Opción</legend>
      <div class="flex flex-wrap gap-4 justify-center">
         <Button label="Ver Cuadre" icon="pi pi-print" @click="fnVerCuadre" iconPos="bottom" />
         <Button label="Imprimir Cuadre y Salir" id="botonImprimir" icon="pi pi-print" @click="imprimirCuadre" iconPos="bottom" />
     </div >
    </fieldset>

  <template #footer>
    <Button label="Transferir Efectivo" text severity="secondary" @click="visibleTranferirFondo = true" />
<!--     <Button label="Ver" text severity="secondary" @click="fnVerCuadre" />
    <Button label="Imprimir" outlined severity="secondary" @click="imprimirCuadre" /> -->
    <Button label="Cancel" text severity="secondary" @click="visibleCuadre = false" />
  </template>
</Dialog>

<!-- ************************************************************************************* -->
<CrearGastosDialog v-model:visible="visiblecrearGastos" />
<!-- ************************************************************************************* -->

<Dialog v-model:visible="visibleTranferirFondo" position="top" modal :style="{ width: '30rem' }" header="TranferirFondo">
  <template #header>
    <div class="inline-flex align-items-center justify-content-center gap-2">
      <span class="font-bold white-space-nowrap">TranferirFondo</span>
    </div>
  </template>

  <fieldset class="border p-3 rounded mb-2">
    <legend class="float-none w-auto px-2">TranferirFondo</legend>
    <div class="grid grid-cols-2  gap-4">
      <div>
        <label for="transaccionesCantidad">Cantidad</label>
        <InputNumber
          v-model="transaccionesCantidad"
          locale="en-US"
          :minFractionDigits="2" 
          highlightOnFocus
          class="w-full"
        />     
       </div>
      <div>
        <label for="transaccionesHasta">Destino</label>
        <Dropdown
          v-model="transaccionesHasta"
          :options="cuentasDataNames"
          editable
          class="w-full"
        />     
       </div>

    </div>
  </fieldset>

  <template #footer>
      <Button label="Transferir" outlined severity="secondary" @click="fnTransferir"  />
      <Button label="Cerrar" outlined severity="secondary" @click="visibletaller = false" autofocus />
  </template>
</Dialog>


<!-- ************************************************************************************* -->
<Dialog v-model:visible="visibleTransacciones" position="top" modal :style="{ width: '50rem' }" header="Transacciones">
  <template #header>
    <div class="inline-flex align-items-center justify-content-center gap-2">
      <span class="font-bold white-space-nowrap">Transacciones</span>
    </div>
  </template>

  <fieldset class="border p-3 rounded mb-2">
    <legend class="float-none w-auto px-2">Transacciones</legend>
    <div class="grid grid-cols-3  gap-4">
      <div>
        <label for="transaccionesCantidad">Cantidad</label>
        <InputNumber
          v-model="transaccionesCantidad"
          locale="en-US"
          :minFractionDigits="2" 
          highlightOnFocus
          class="w-full"
        />     
       </div>
      <div>
        <label for="transaccionesDesde">Desde</label>
        <Dropdown
          v-model="transaccionesDesde"
          :options="cuentasDataNames"
          editable
          class="w-full"
        />     
       </div>
      <div>
        <label for="transaccionesHasta">Hasta</label>
        <Dropdown
          v-model="transaccionesHasta"
          :options="cuentasDataNames"
          editable
          class="w-full"
        />     
       </div>

    </div>
  </fieldset>

  <template #footer>
      <Button label="Transferir Efectivo en Caja" icon="pi pi-dollar" outlined severity="secondary" @click="visibleTranferirFondo = true"  />
      <Button label="Realizar" icon="pi pi-send" outlined severity="secondary" @click="fnTransaccion"  />
      <Button label="Cerrar" outlined severity="secondary" @click="visibletaller = false" autofocus />
  </template>
</Dialog>


<!-- /**************************************************************************************/ -->

<Dialog v-model:visible="visibleIA" position="top" modal :style="{ width: '75rem' }" header="IA">
  <template #header>
    <div class="inline-flex align-items-center justify-content-center gap-2">
      <span class="font-bold white-space-nowrap">IA</span>
    </div>
  </template>

  <fieldset class="border p-3 rounded mb-2">
    <legend class="float-none w-auto px-2">IA</legend>


<div class="chat-container p-4 bg-gray-100 h-screen flex flex-col">
  <!-- Mensajes del chat -->
  <div ref="chatMessages" class="chat-messages space-y-4 overflow-y-auto flex-1">
    <div v-for="(message, index) in messages" :key="index" class="message flex">
      <!-- Mensaje del usuario -->
      <template v-if="message.sender === 'user'">
        <div class="ml-auto bg-blue-500 text-white py-2 px-4 rounded-lg max-w-2xl shadow">
          <p class="text-lg">{{ message.text }}</p>
        </div>
      </template>
      <!-- Mensaje de la IA -->
      <template v-else>
        <div class="mr-auto bg-gray-300 text-gray-800 py-2 px-4 rounded-lg max-w-2xl shadow">
          <p class="text-lg">{{ message.text }}</p>
        </div>
      </template>
    </div>
  </div>

  <!-- Input del chat -->
  <div class="chat-input mt-4">
    <input
      type="text"
      v-model="newMessage"
      @keydown.enter="sendMessage"
      placeholder="Escribe tu mensaje..."
      class="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
    />
  </div>
</div>


  </fieldset>

  <template #footer>
      <Button label="Cerrar" outlined severity="secondary" @click="visibleIA = false" autofocus />
  </template>
</Dialog>


<!-- /**************************************************************************************/ -->
<Dialog v-model:visible="visiblePedidos" position="top" modal :style="{ width: '50rem' }" header="Pedidos">
  <template #header>
    <div class="inline-flex align-items-center justify-content-center gap-2">
      <span class="font-bold white-space-nowrap">Pedidos</span>
    </div>
  </template>

    <fieldset class="border p-3 rounded mb-2">
      <legend class="float-none w-auto px-2">Pedidos</legend>
      <div class="grid grid-cols-1 gap-4">
        <div v-for="category in parsedFallas" :key="category.key" class="flex items-center gap-2">
          <Checkbox v-model="piezasPedido" :inputId="category.key" name="category" :value="category.propiedad" />
          <label :for="category.key">{{ category.propiedad }}</label>
        </div>

        <div>
          <Select name="proveedor" v-model="proveedorWhatsapp" :options="proveedoresData" optionLabel="nombre" placeholder="Selecciones proveedor" fluid />
        </div>
      </div>
    </fieldset>

  <template #footer>
      <Button label="Realizar Pedido" outlined severity="secondary" @click="fnRealizarPedido" />
      <Button label="Cerrar" outlined severity="secondary" @click="visibletaller = false" />
  </template>
</Dialog>
<!-- /**************************************************************************************/ -->
 <LoadingOverlay :visible="loading" :message="loadingMessage" />

 <!-- Impresora de Taller -->
 <ImpresoraTaller
   v-model:visible="visibleImpresoraTaller"
   :ordenData="ordenParaImprimir"
   :empresaData="datosEmpresa.empresa"
   :formatoImpresion="formatoImpresion"
   @close="visibleImpresoraTaller = false"
 />

 <EnviarWhatsApp ref="enviarWhatsAppRef" :initialDatosWhatsApp="datosWhatsApp" />
<!-- ************************************************************************************* -->
<Dialog v-model:visible="visibleCostoPiezas" position="top" modal :style="{ width: '30rem' }" header="CostoPiezas">
  <template #header>
    <div class="inline-flex align-items-center justify-content-center gap-2">
      <span class="font-bold white-space-nowrap">CostoPiezas</span>
    </div>
  </template>

  <fieldset class="border p-3 rounded mb-2">
    <legend class="float-none w-auto px-2">CostoPiezas</legend>
    <div class="grid grid-cols-1 gap-4">
      <div>
<div class="form-group " >
<label for="emailAgregarDatos">COSTO PIEZA</label><br>
     <InputText v-model="costoPieza" fluid @change="fnAplicarPrecioPieza" v-solonumeros v-focus-in-focus-out />
</div>
      </div>
    </div>
  </fieldset>

  <template #footer>
      <Button label="Aplicar Precio" outlined severity="secondary" @click="fnAplicarPrecioPieza"  />
      <Button label="Cerrar" outlined severity="secondary" @click="visibleCostoPiezas = false"  />
  </template>
</Dialog>
<!-- /********************************************************************************************/ -->
   <TecladoVirtual ref="virtualKeyboard" />
<!-- ************************************************************************************* -->
   <Toast />
<Patron :visiblePatron="showPatron" :patron="clavePatron"
      @close="closePatron"  />
  </main>
</template>

<script setup>
import { ref, onMounted, watchEffect, onUnmounted,watch,nextTick,computed  } from 'vue';
import { useToast } from 'primevue/usetoast';
import { useRouter,useRoute} from 'vue-router';
//import router from '../../router';
import TecladoVirtual from '@/components/TecladoVirtual.vue'
import CrearGastosDialog from '@/components/Gastos.vue'
const route = useRoute();
const router = useRouter();


import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import Swal from 'sweetalert2'
import {enviarDatosPorPost,
  eliminarDatos,
  obtenerIdsSeleccionados,
  borrarTodoslosDatos,
  lenguajeDataTable,
  nfecha,
  enviarDatosLocalStorage,
  asientoDiario,
  peticiones,
formatearFecha,
  convertirAFechaTimestamp,
esFechaEnRango,
  permisosPagina,
  arrayToObjetoFromTabla,
  arrayToObjetoFromTablaOffline,
  transformarFechaTimestamp,
  peticionesFetch,
  encryptarPassword,
  envioElectron,
  mensajetoast,
  crearTablaSiNoExisteOffline,
  peticionesFetchOffline,
  buscadorArrayObjeto,
  formatearFechaLarga,
  lasMayusculas} from '@/funciones/funciones.js';
  import EnviarWhatsApp from '@/components/WhatsappModal.vue';
import Patron from '../Patron/Patron.vue';
const toast = useToast();
import LoadingOverlay from '@/Loading/LoadingOverlay.vue';
import ImpresoraTaller from '@/components/ImpresoraTaller.vue';
/************************************************************************/
import { generarHTMLReporteCaja } from '@/utils/cortes.js';
/************************************************************************/
onMounted(inicializarCaja);
onUnmounted(limpiarCaja);
/************************************************************************/
const turnosHoyArray = ref([])
const datosEnvio = ref([])
const fechaDeInicioHoy = ref('')
const fechaDeFinHoy = ref('')
const cantidadInicial = ref(0)
//const datosFechaHoy = nfecha('timestampcompleta');
/************************************************************************/
const dataFacturas = ref([])
const cantidadFacturasTurno = ref(0)
const facturasDelTurnoActual = ref([])
const gastosArray = ref([])
const tallerArray = ref([])
const cxcArray = ref([])
/************************************************************************/
const visibleImpresoraTaller = ref(false);
const ordenParaImprimir = ref({});
const formatoImpresion = ref('80mm');
/************************************************************************/
const registroSocios = ref({'sexo':'HOMBRE'})
/************************************************************************/
const enviarWhatsAppRef = ref(null);
const datosWhatsApp = ref({
  nombre: 'John Doe',
  numero: '123456789',
  texto: 'Hola, este es un mensaje predefinido.'
});
/****************************************************/
const showWhatsAppModal = async () => {
  if (enviarWhatsAppRef.value) {
          enviarWhatsAppRef.value.updateDatosWhatsApp(datosWhatsApp.value);
          enviarWhatsAppRef.value.visible = true;
  }
};

const abrirWhatsapp = ()=>{
     showWhatsAppModal()
}

/***************************************************** */
const visiblecobrar = ref(false);
const visibleCostoPiezas = ref(false);
const costoPieza = ref(0);
const sonidoON = ref(false)
/***************************************************** */
const contidadInicioCaja = ref(0);
const cajaAbiertaArray = ref([])
/***************************************************** */
const mensaje = ref('')
const showWhatsapp = ref(false);
const closeWhatsapp = () => {
    showWhatsapp.value = false;
};
/***********************************************************/
watchEffect(() => {
  if (showWhatsapp.value) {
    datosWhatsApp.value.nombre = datoscampos.value.nombre;
    datosWhatsApp.value.numero = datoscampos.value.whatsapp || datoscampos.value.telefono
    datosWhatsApp.value.texto = `Hola ${datoscampos.value.nombre} le escribimos de  *${datosEmpresa.empresa.nombre}* para informarle que su equipo se encuentra *${datoscampos.value.estado}*`;
    showWhatsAppModal()
  }
});
/************************************************************************/

/************************************************************************/
const loading = ref(false)
const loadingMessage = ref('')
const position = 'top';
const totalModalEnCaja = ref('0.00')
/************************************************************************/
const datosBarcode = ref({})
/************************************************************************/
const baseTotalFactura = ref(0.00); 
const propinaFactura = ref('0.00'); 
/************************************************************************/
const cuadre = ref({})
const turnosXfecha = ref([])
const turnoUsuarioSelected = ref('')
const usuarioEsCajero = () => {
  const rol = datosEmpresaStore.usuario?.nivel_seguridad || datosEmpresaStore.usuario?.usuario || '';
  return String(rol).trim().toLowerCase() === 'cajero';
};
const opcionesTurnoCuadre = computed(() => {
  const turnos = Array.from(new Set(turnosXfecha.value.filter(Boolean)));
  return usuarioEsCajero()
    ? turnos
    : ['COMPLETO', ...turnos];
})
/************************************************************************/
const visibleIA = ref(false);
const datoscamposIa = ref({});
const visibleAverias = ref(false);
const fallasChips = ref([]);
/************************************************************************/
const visiblePedidos = ref(false);
const visiblePedidoIndividual = ref(false);
const datoscamposPedido = ref({});
const proveedorWhatsapp = ref({});
const proveedorWhatsappIndividual = ref({});
/************************************************************************/
const cambioTurnoSelected = async()=>{
  const cadena = turnoUsuarioSelected.value
  let datos = turnosHoyArray.value.find(turno=>turno.turno === cadena)

  if (!datos && cadena && cadena !== 'COMPLETO') {
    const cajaConsultada = await obtenerCajaActual();
    datos = cajaConsultada?.turno === cadena ? cajaConsultada : null;
    if (datos && !turnosHoyArray.value.some(turno => turno.turno === datos.turno)) {
      turnosHoyArray.value.push(datos);
    }
  }

  if(datos && cadena !== 'COMPLETO'){
    cuadre.value = { ...datos }
    cuadre.value.horainicio = datos.hora_inicio || '00:00:01'
    cuadre.value.horafin = datos.hora_cierre || nfecha('horaAmericana')
    contidadInicioCaja.value = Number(datos.cant_inicio || 0).toFixed(2)
    datosDelDia.value.inicioCaja = Number(datos.cant_inicio || 0)

    fechaDeInicioHoy.value = datos.created_at || `${nfecha('fechaAmericana')} ${cuadre.value.horainicio}`
    fechaDeFinHoy.value = `${nfecha('fechaAmericana')} ${cuadre.value.horafin}`
  }else{
    cuadre.value.horainicio = '00:00:01'
    cuadre.value.horafin = nfecha('horaAmericana')

    fechaDeInicioHoy.value = `${nfecha('fechaAmericana')} ${cuadre.value.horainicio}`
    fechaDeFinHoy.value = `${nfecha('fechaAmericana')} ${cuadre.value.horafin}`
  }

await fetchAndSetupDatosdelDia()
if (usuarioEsCajero()) {
  await actualizarCantidadFacturasTurno()
}

}
/************************************************************************/
const scrollToBottom = () => {
  nextTick(() => {
    if (chatMessages.value) {
      chatMessages.value.scrollTop = chatMessages.value.scrollHeight;
    }
  });
};
/************************************************************************/
const messages = ref([
  { sender: 'ia', text: 'Hola, ¿en qué puedo ayudarte hoy?' }
]);
const newMessage = ref('');
const chatMessages = ref(null);
/************************************************************************/
const parsedFallas = computed(() => {
  return JSON.parse(facturaTallerSeleccionada.value.fallas);
});
/************************************************************************/
const proveedoresData = ref([])
const clientesData = ref([])
/************************************************************************/
const fnConsultaIA = async()=>{
  visiblePedidoIndividual.value = false
  loading.value = true
  const falla = datoscamposPedido.value.pieza_pedido;
  const consulta = `Tengo un ${datoscampos.value.equipo} ${datoscampos.value.marca} ${datoscampos.value.modelo} con la falla de ${falla}`;
    messages.value.push({ sender: 'user', text: consulta });
    try {
      if(window.electron){
        const result = await window.electron.ipcRenderer.invoke('chatGpt',consulta);
        loading.value = false
         toast.add({ severity: 'success', summary: 'Ok', detail: 'Respuesta del Bot', life: 3000 });
        datoscamposIa.value.contexto = result
        messages.value.push({ sender: 'ia', text: result });
        visibleIA.value = true;
         scrollToBottom();

      }

  } catch (error) {
    loading.value = false
     toast.add({ severity: 'error', summary: 'Error', detail: 'Error de consulta', life: 3000 });
  }
}
/************************************************************************/
const fetchDataBarcode = async () => {
const response = await peticionesFetchOffline('getDataByField', 'barcode','id',1);
    const jsonData = response;
    datosBarcode.value = jsonData;
};
/************************************************************************/
const fnEnvioIA = async () => {
  const contexto = datoscamposIa.value.contexto;
  const consulta = datoscamposIa.value.consulta;
  try {
    if (window.electron) {
        loading.value = true;
        const result = await window.electron.ipcRenderer.invoke('chatGpt', consulta);
        loading.value = false;
        toast.add({ severity: 'success', summary: 'Ok', detail: 'Respuesta del Bot', life: 3000 });
        datoscamposIa.value.contexto = result;
        visibleIA.value = true;
        // Agregar la respuesta de la IA al chat
        messages.value.push({ sender: 'ia', text: result });
         scrollToBottom();

    }
  } catch (error) {
    loading.value = false;
    toast.add({ severity: 'error', summary: 'Error', detail: 'Error de consulta', life: 3000 });
  }
};

const sendMessage = () => {
  if (newMessage.value.trim() === '') return;

  // Agregar el mensaje del usuario
  messages.value.push({ sender: 'user', text: newMessage.value });

  // Actualizar el campo de consulta
  datoscamposIa.value.consulta = newMessage.value;

  // Llamar a la función para enviar la consulta a la IA
  fnEnvioIA();

  // Limpiar el campo de entrada
  newMessage.value = '';
};
/************************************************************************/
const cuentasData = ref([])
const cuentasDataNames = ref([])
const transaccionesDesde = ref('EFECTIVO EN CAJA')
const transaccionesHasta = ref('BANCOS')
const transaccionesCantidad = ref('0.00')
/************************************************************************/
const virtualKeyboard = ref(null);

const handleInput = ()=>{
  fnCalcularCambio()
}

const handleFocus = (keyboardType, inputElement) => {
  if (virtualKeyboard.value) {
    virtualKeyboard.value.show(inputElement, keyboardType);
  }
};

// Función para activar/desactivar el teclado virtual
const toggleKeyboard = () => {
  if (virtualKeyboard.value) {
    virtualKeyboard.value.isEnabled = !virtualKeyboard.value.isEnabled;
    console.log("Teclado virtual habilitado:", virtualKeyboard.value.isEnabled);
  }
};
/************************************************************************/
import {useDatosEmpresa} from '@/stores'
import { notifyCompanyPayment } from '@/funciones/notificacionesAbonos.js'
const datosEmpresa = useDatosEmpresa();
const datosEmpresaStore = useDatosEmpresa();

const link = ref('');
const api = ref('');
const token = ref('');
const patronTelefono = ref('');
const linkImpresora = ref('');
const tokenCorto = ref('');
const tokenSoloUso = ref('');
const token24H = ref('');

const tokenCifrado = ref(null);
const fechaHoy = ref(nfecha('fecha'));
const datosDefault = ref({})
/*************************************************************/
const datosDelDiaArray = ref({})
/*************************************************************/
const cantidadInicio = ref(0)
const visibleCuadre = ref(false)
/*************************************************************/
const visibleTransacciones = ref(false)
const visibleTranferirFondo = ref(false)
/*************************************************************/
const abonoVisible = async()=>{

//facturaTallerSeleccionada
  const saldoTotal = facturaTallerSeleccionada.value.saldo;

    if (Number(facturaTallerSeleccionada.value.total) === 0) {
    toast.add({ severity: 'error', summary: 'Error', detail: 'Debe agregar Costo de Reparación', life: 3000 });
    return;
  }
  if (facturaTallerSeleccionada.value.metodopago === 'TRANSFERENCIA' && !cuentaBancaria.value?.id) {
    toast.add({ severity: 'error', summary: 'Error', detail: 'Debe seleccionar un banco', life: 3000 });
    return;
  }
  if (facturaTallerSeleccionada.value.metodopago === 'TRANSFERENCIA' && !cuentaBancaria.value?.id) {
    toast.add({ severity: 'error', summary: 'Error', detail: 'Debe seleccionar un banco', life: 3000 });
    return;
  }

visibletaller.value = false

  // Mostrar el SweetAlert con input para la cantidad de abono y método de pago
  const { value: formValues, isDenied } = await Swal.fire({
    title: 'Abonar',
    html:
      `<input id="swal-input-abono" class="swal2-input" placeholder="Cantidad a abonar" type="number" step="0.01" min="0">` +
      `<select id="swal-input-metodo-pago" class="swal2-input">
         <option value="EFECTIVO">Efectivo</option>
         <option value="TARJETA">Tarjeta</option>
         <option value="TRANSFERENCIA">Transferencia</option>
       </select>`,
    focusConfirm: false,
    showCancelButton: true,
    showDenyButton: true,
    confirmButtonText: 'Abonar',
    denyButtonText: 'Pagar Completo',
    preConfirm: () => {
      const abono = document.getElementById('swal-input-abono').value;
      const metodoPago = document.getElementById('swal-input-metodo-pago').value;
      
      if (!abono || abono <= 0) {
        Swal.showValidationMessage('Debes ingresar una cantidad válida de abono');
      }
      
      return { abono, metodoPago };
    }
  });

  if (!formValues) {
    // Si el usuario cancela, no hacemos nada
    Swal.fire('Cancelado', 'No se realizó ningún abono', 'info');
    return;
  }

  let cantidadAbono = Number(formValues.abono);
  const metodoPago = formValues.metodoPago;

  if (isDenied) {
    // Si el usuario selecciona "Pagar Completo", el abono es el saldo total
    cantidadAbono = saldoTotal;
  }

  if (metodoPago === 'TRANSFERENCIA' && !cuentaBancaria.value?.id) {
    visibletaller.value = true;
    toast.add({ severity: 'error', summary: 'Error', detail: 'Debe seleccionar un banco', life: 3000 });
    return;
  }

  // Actualizamos el JSON de abonos con el nuevo abono
  const abonoJSON = JSON.parse(facturaTallerSeleccionada.value.abono);
  
  const nuevoAbono = {
    "abono": cantidadAbono,
    "turno": usuarioLocal.value.token,
    "cajero": usuarioLocal.value.email,
    "recibidopor": usuarioLocal.value.email,
    "prioridad": 3,
    "metodo_pago": metodoPago,
    "hora": nfecha('hora'),
    "fecha": nfecha('fecha'),
    "saldo": Math.max(Number(saldoTotal) - cantidadAbono, 0).toFixed(2)
  };
  abonoJSON.push(nuevoAbono);

  // Convertir el abono actualizado a cadena JSON
  facturaTallerSeleccionada.value.abono = JSON.stringify(abonoJSON);
  

  const url = link.value+api.value+"/actualizarcampos/taller";
  if (!facturaTallerSeleccionada.value) {
    console.error("Datos incompletos, no se puede actualizar.");
    return;
  }
  if (facturaTallerSeleccionada.value.hasOwnProperty('created_at')) {
      facturaTallerSeleccionada.value.updated_at = nfecha('timestamp')
    }
  const envioDatos = await peticionesFetchOffline('updateData', 'taller',JSON.stringify(facturaTallerSeleccionada.value));
  if (envioDatos[0] == 'ok') {
     const bancoOk = await registrarEntradaBancoTaller(
      cantidadAbono,
      `ABONO TALLER POR TRANSFERENCIA (${facturaTallerSeleccionada.value.no_factura})`,
      metodoPago
    );
    if (!bancoOk) {
      visibletaller.value = true;
      return;
    }
     notificarAbonoTaller(facturaTallerSeleccionada.value, nuevoAbono);
     toast.add({ severity: 'success', summary: 'Éxito', detail: 'Datos Actualizados', life: 3000 });

  window.electron.ipcRenderer.invoke('open-new-window', link.value+'/vista/tallertermica?factura='+facturaTallerSeleccionada.value.no_factura,'url', true,false)

  }else{
    toast.add({ severity: 'error', summary: 'Error', detail: 'Fallo al actualizar los datos.', life: 3000 });
  }


  // Mostrar confirmación de que el abono se realizó con éxito
  Swal.fire({
    title: 'Abono realizado',
    text: `Has abonado ${cantidadAbono} mediante ${metodoPago}.`,
    icon: 'success'
  });
}
/*************************************************************/
const registrarSocios = ref(false);
const cuadrarCaja = ref(false);
const visibleabono = ref(false);
const visiblentrada = ref(false);
const visibletaller = ref(false);
const visiblecrearGastos = ref(false);
const datosFactCoti = ref({'numero':'','tipo':'Factura','nombre':'','impresora':'Termica'});
const visibleimprimirfactura = ref(false);
const visibleSeleccionTipoImpresion = ref(false);
let resolverSeleccionImpresion = null;
const visiblegastos = ref(false);
const totalFactura = ref(0.00);
const recibidoFactura = ref(0.00);
const devueltaFactura = ref(0.00);
const numeroFactura = ref(null);
const facturaEfectivo = ref(0.00)
const facturaTarjeta = ref(0.00)
const facturaTransferencia = ref(0.00)
/*************************************************************/
const camposGastos = ref({});
const guardandoGasto = ref(false);
const bancoArray = ref([]);
const cuentaBancaria = ref(null);
const camposEntrada = ref({});
/*************************************************************/
const usuarioLocal = ref({});
const notificarAbonoTaller = (orden, pago, origen = 'Caja') => {
  void notifyCompanyPayment({
    type: 'taller',
    reference: orden?.no_factura,
    client: orden?.nombre || orden?.cliente,
    amount: pago?.abono,
    balance: pago?.saldo ?? orden?.saldo,
    method: pago?.metodo_pago,
    cashier: pago?.cajero || usuarioLocal.value?.nombre || usuarioLocal.value?.email,
    date: pago?.fecha,
    time: pago?.hora,
    source: origen,
    company: datosEmpresaStore.empresa
  });
};
const datosConfiguracion = ref({});
/*************************************************************/
const campoFactura = ref(null);
const impresoraSeleccionada = ref(null);
const imprimiendoFacturaSeleccionada = ref(false);
const facturas = ref([]);
const campoNombreFactura = ref(null)
const busquedaFactura = ref('');
const facturasFiltradasImprimir = ref([]);
const soloFacturasTurno = ref(false);
const cargandoFacturasTurno = ref(false);
/*************************************************************/
const clienteTaller = ref('');
const facturaTallerSeleccionada = ref(null);
const facturasTaller = ref([]);
const busquedaTaller = ref('');
const ordenesFiltradasTaller = ref([]);
/*************************************************************/
const showPatron = ref(false);
const clavePatron = ref('');
/*************************************************************/
const seleccionarTaller = async()=>{
  const facturaTaller = facturaTallerSeleccionada.value;
  clienteTaller.value = facturaTaller.nombre;
}
/*************************************************************/
// Computed para filtrar órdenes de taller por número o nombre
const ordenesTallerFiltradasComputed = computed(() => {
  if (!busquedaTaller.value) {
    return facturasTaller.value.slice(0, 20); // Mostrar solo las primeras 20 si no hay búsqueda
  }

  const busqueda = busquedaTaller.value.toLowerCase().trim();
  return facturasTaller.value.filter(orden => {
    const numeroOrden = orden.no_factura?.toString().toLowerCase() || '';
    const nombreCliente = orden.nombre?.toLowerCase() || '';
    const equipo = orden.equipo?.toLowerCase() || '';
    return numeroOrden.includes(busqueda) || nombreCliente.includes(busqueda) || equipo.includes(busqueda);
  });
});

// Función para seleccionar una orden desde la lista
const seleccionarOrdenDesdeTabla = (orden) => {
  facturaTallerSeleccionada.value = orden;
  clienteTaller.value = orden.nombre;
  toast.add({ severity: 'success', summary: 'Éxito', detail: 'Orden Seleccionada', life: 3000 });
}

// Limpiar búsqueda al abrir el modal de taller
watch(visibletaller, (newVal) => {
  if (newVal) {
    busquedaTaller.value = '';
  }
});

// Volver a abrir la modal de gestión cuando se cierre la modal de impresión
watch(visibleImpresoraTaller, (newVal) => {
  if (!newVal && facturaTallerSeleccionada.value) {
    // Solo reabrir si hay una orden seleccionada
    nextTick(() => {
      visibletaller.value = true;
    });
  }
});
/*************************************************************/
const fnEditarTaller = async()=>{
    const facturaTaller = facturaTallerSeleccionada.value;
    router.push({ path: `/editartaller/${facturaTaller.id}` });
}
/*************************************************************/
const fnComentario = async()=>{
  const facturaTaller = facturaTallerSeleccionada.value;
    facturaTaller.observaciones = facturaTaller.observaciones +"\n"+comentarioTaller.value;

    if (facturaTaller.hasOwnProperty('created_at')) {
      facturaTaller.updated_at = nfecha('timestamp');
    }

    const url = link.value + api.value + "/actualizarcampos/taller";
    const envioDatos = await peticionesFetchOffline('updateData', 'taller',JSON.stringify(facturaTaller));

    if (envioDatos[0] == 'ok') {
      toast.add({ severity: 'success', summary: 'Éxito', detail: 'Datos Actualizados', life: 3000 });
      await fetchDataTaller();
      visibleModificarTaller.value = false
      comentarioTaller.value = ''
      visibletaller.value = true
    } else {
      toast.add({ severity: 'error', summary: 'Error', detail: 'Fallo al actualizar los datos.', life: 3000 });
    }
}
/*************************************************************/
const fnReparacionTaller = async () => {
  const facturaTaller = facturaTallerSeleccionada.value;
  visibletaller.value = false
  if (!facturaTaller) {
    Swal.fire("Error", "No hay una factura seleccionada", "error");
    return;
  }

  if (Number(facturaTaller.total) !== 0) {
    Swal.fire("No permitido", "No se puede alterar este costo", "warning");
    return;
  }

  const { value: precioReparacion } = await Swal.fire({
    title: "Ingrese el costo de reparación",
    input: "number",
    inputAttributes: {
      min: 0,
      step: "any",
    },
    showCancelButton: true,
    confirmButtonText: "Aceptar",
    cancelButtonText: "Cancelar",
    inputValidator: (value) => {
      if (!value || isNaN(value) || value <= 0) {
        return "Debe ingresar un número válido";
      }
    },
  });

  if (precioReparacion) {
    facturaTaller.total = parseFloat(precioReparacion);
    facturaTaller.manodeobra = parseFloat(precioReparacion);
    facturaTaller.saldo = parseFloat(precioReparacion);
    toast.add({ severity: 'success', summary: 'OK', detail: 'Orden Actualizada con éxito', life: 3000 });
    await funcionActualizarTaller()
    visibletaller.value = true
  }
};

/*************************************************************/
const fnPiezasTaller = async()=>{
const facturaTaller = facturaTallerSeleccionada.value;

}
const fnAplicarPrecioPieza = async()=>{
//const facturaTaller = facturaTallerSeleccionada.value;
   const data = facturaTallerSeleccionada.value;
   const total = Number(data.total)
   const porcentajeTecnico = Number(data.porcentaje_tecnico)
   const preciopiezas = Number(costoPieza.value)

   const beneficioTecnico = ((total - preciopiezas) * (porcentajeTecnico / 100)).toFixed(2);
   const beneficioEmpresa = ((total - preciopiezas)  - beneficioTecnico).toFixed(2);

   if(preciopiezas >= total){
    toast.add({ severity: 'error', summary: 'Error', detail: 'la Pieza no puede superar el costo de la Reparación', life: 3000 });
    return
   }


   data.preciopiezas = preciopiezas
   data.beneficio_empresa = beneficioEmpresa
   data.beneficio_tecnico = beneficioTecnico

  const url = link.value+api.value+"/actualizarcampos/taller";
  if (!data) {
    console.error("Datos incompletos, no se puede actualizar.");
    return;
  }
  if (data.hasOwnProperty('created_at')) {
      data.updated_at = nfecha('timestamp')
    }

  const envioDatos = await peticionesFetchOffline('updateData', 'taller',JSON.stringify(data));
  if (envioDatos[0] == 'ok') {
     toast.add({ severity: 'success', summary: 'Éxito', detail: 'Datos Actualizados', life: 3000 });
  }else{
    toast.add({ severity: 'error', summary: 'Error', detail: 'Fallo al actualizar los datos.', life: 3000 });
  }

}
/*************************************************************/
const comentarioTaller = ref('')
const visibleModificarTaller = ref(false)
/*************************************************************/
const imprimirTaller = async()=>{
  const facturaTaller = facturaTallerSeleccionada.value;

  // Cerrar la modal de gestión de taller
  visibletaller.value = false;

  // Preparar datos para impresión (por defecto formato 80mm)
  ordenParaImprimir.value = facturaTaller;
  formatoImpresion.value = '80mm';

  // Abrir modal de impresión profesional
  visibleImpresoraTaller.value = true;
}
/*************************************************************/
const nuevoTaller = async()=>{
 router.push({ path: `/creartaller` });
}
/*************************************************************/
const imprimirEtiquetaTaller = async()=>{
  const facturaTaller = facturaTallerSeleccionada.value
  //window.electron.ipcRenderer.invoke('open-new-window', link.value+'/vista/impresoraequipo?factura='+facturaTaller.no_factura,'url', true,false)

   await printBarcode(facturaTaller.no_factura,facturaTaller.nombre)

}
/*************************************************************/
const verClaveTaller = async () => {
  const facturaTaller = facturaTallerSeleccionada.value;

  if (facturaTaller.clave.includes('-')) {
    clavePatron.value = facturaTaller.clave;
    showPatron.value = true;
  } else {
    visibletaller.value = false
    Swal.fire({
      title: 'Clave',
      text: facturaTaller.clave,
      icon: 'info',
      confirmButtonText: 'OK'
    });
  }
};

/*************************************************************/
const closePatron = () => {
    showPatron.value = false;
};
/*************************************************************/
const funcionActualizarTaller = async ()=> {
  const url = link.value+api.value+"/actualizarcampos/taller";
  if (!facturaTallerSeleccionada.value) {
    console.error("Datos incompletos, no se puede actualizar.");
    return false;
  }
  if (facturaTallerSeleccionada.value.hasOwnProperty('created_at')) {
      facturaTallerSeleccionada.value.updated_at = nfecha('timestamp')
    }
  const envioDatos = await peticionesFetchOffline('updateData', 'taller',JSON.stringify(facturaTallerSeleccionada.value));
  if (envioDatos[0] == 'ok') {
     toast.add({ severity: 'success', summary: 'Éxito', detail: 'Datos Actualizados', life: 3000 });
     return true;
  }else{
    toast.add({ severity: 'error', summary: 'Error', detail: 'Fallo al actualizar los datos.', life: 3000 });
    return false;
  }
}
/*************************************************************/
const moneyrecibidoRef = ref(null);
/*************************************************************/
watch(visiblecobrar, (newVal) => {
  if (newVal) {
    nextTick(() => {
      setTimeout(() => {
        const campoDinero = document.getElementById('dineroRecibido');
        if (campoDinero) {
          campoDinero.focus();
        }
      }, 500); // Ajusta el tiempo según sea necesario
    });
  }
});

/*************************************************************/
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
        headerText: datosEmpresaStore.empresa.nombre,
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
/*************************************************************/
// visibletaller.value = false
/*************************************************************/
const entregarTaller = async () => {
  if (facturaTallerSeleccionada.value.estado === 'Entregado') {
    toast.add({ severity: 'error', summary: 'Error', detail: 'Esta Orden ya ha sido Entregada', life: 3000 });
    return;
  }

   if (Number(facturaTallerSeleccionada.value.total) === 0) {
    toast.add({ severity: 'error', summary: 'Error', detail: 'Debe agregar Costo de Reparación', life: 3000 });
    return;
  }

  if (facturaTallerSeleccionada.value.metodopago === 'TRANSFERENCIA' && !cuentaBancaria.value?.id) {
    toast.add({ severity: 'error', summary: 'Error', detail: 'Debe seleccionar un banco', life: 3000 });
    return;
  }

visibletaller.value = false
  const result = await Swal.fire({
    title: 'Confirmación',
    text: '¿Ha revisado el equipo antes de entregar?',
    icon: 'question',
    showCancelButton: true,
    confirmButtonText: 'Sí',
    cancelButtonText: 'No'
  });

  if (result.isConfirmed) {
    const montoPendiente = Number(facturaTallerSeleccionada.value.saldo || 0);
    facturaTallerSeleccionada.value.estado = 'Entregado';
    const abonoJSON = JSON.parse(facturaTallerSeleccionada.value.abono);
    const nuevoAbono = {
      "abono": facturaTallerSeleccionada.value.saldo,
      "prioridad": 3,
      "turno": usuarioLocal.value.token,
      "cajero": usuarioLocal.value.email,
      "entregado_por": usuarioLocal.value.nombre,
      "metodo_pago": facturaTallerSeleccionada.value.metodopago,
      "hora": nfecha('hora'),
      "fecha": nfecha('fecha'),
      "saldo": '0.00'
    };
    abonoJSON.push(nuevoAbono);
    facturaTallerSeleccionada.value.abono = JSON.stringify(abonoJSON);
    facturaTallerSeleccionada.value.saldo = '0.00';
    facturaTallerSeleccionada.value.fecha_entrega = nfecha('fecha');
    const tallerActualizado = await funcionActualizarTaller();
    if (!tallerActualizado) return;
    const bancoOk = await registrarEntradaBancoTaller(
      montoPendiente,
      `COBRO TALLER POR TRANSFERENCIA (${facturaTallerSeleccionada.value.no_factura})`
    );
    if (!bancoOk) {
      visibletaller.value = true;
      return;
    }
    notificarAbonoTaller(facturaTallerSeleccionada.value, nuevoAbono, 'Caja - entrega de taller');
    imprimirTaller();
  } else if (result.dismiss === Swal.DismissReason.cancel) {
    visibletaller.value = true

  }
};


/*************************************************************/
const facturasSinCobrar = ref([]);
const tipoFactura = {
  'EFECTIVO': { 'tipo': 'success', 'icono': 'money' },
  'TARJETA': { 'tipo': 'danger', 'icono': 'credit-card' },
  'TARJETA Y EFECTIVO': { 'tipo': 'danger', 'icono': 'credit-card' },
  'TARJETA Y TRANSFERENCIA': { 'tipo': 'danger', 'icono': 'credit-card' },
  'TRANSFERENCIA': { 'tipo': 'warning', 'icono': 'bank' },
  'EFECTIVO Y TRANSFERENCIA': { 'tipo': 'warning', 'icono': 'bank' },
  'TARJETA TRANSFERENCIA Y EFECTIVO': { 'tipo': 'warning', 'icono': 'bank' },
  'CHEQUE': { 'tipo': 'warning', 'icono': 'bank' },
  'APARTADO': { 'tipo': 'warning', 'icono': 'bank' },
  'CREDITO': { 'tipo': 'dark', 'icono': 'money' }
};

const tipoFacturaDefault = { 'tipo': 'secondary', 'icono': 'money' };

const tipoFacturaInfo = (metodoPago) => {
  const metodoNormalizado = String(metodoPago || '').trim().toUpperCase().replace(/\s+/g, ' ');
  return tipoFactura[metodoNormalizado] || tipoFacturaDefault;
};
/************************************************************/
const handlePropinaChange = () => {
  // Convertir el valor ingresado a número; si no es válido, se considera 0
  const tip = parseFloat(propinaFactura.value) || 0;
  
  // Validar que la propina no sea negativa
  if (tip < 0) {
    // Por ejemplo, podrías notificar al usuario con un Toast
    toast.add({
      severity: 'error',
      summary: 'Valor incorrecto',
      detail: 'La propina no puede ser negativa.',
      life: 3000
    });
    // Reiniciamos el campo a 0.00 y salimos
    propinaFactura.value = '0.00';
    return;
  }
  
  // Actualizamos el total a cobrar sumando la propina al total base
  // Es importante que baseTotalFactura tenga el valor original (sin propina)
  //totalFactura.value = (parseFloat(baseTotalFactura.value) + tip).toFixed(2);
  
  // Recalcular el vuelto en base al nuevo total
  calcularVuelto();
};
/************************************************************/
const fetchAndSetupData = async () => {
  try {
    // 1) Traes TODAS las facturas pendientes
    const pending = await peticionesFetchOffline(
      'getDataArrayByCondition',
      'facturas',
      'estado_factura',
      'Pendiente'
    );

    // 2) Si lo que quieres es reemplazar por completo:
    facturasSinCobrar.value = pending.filter(ft=>ft.almacen === datosEmpresaStore.empresa.nombre);

    // 3) Sólo si quieres detectar cuántas son nuevas y tocar sonido/toast:
    const existingIds = new Set(facturasSinCobrar.value.map(f => f.id));
    const newFacturas = pending.filter(ft=>ft.almacen === datosEmpresaStore.empresa.nombre).filter(f => !existingIds.has(f.id));

    if (newFacturas.length > 0) {
      toast.add({
        severity: 'success',
        summary: 'Nuevas Facturas',
        detail: 'Hay nuevas facturas pendientes',
        life: 3000
      });

      const { SOUND: sonidoR } = await envioElectron('datosarchivo');
      if (sonidoR) {
        window.electron.ipcRenderer.invoke('play-sound', 'Subtle.mp3');
      }
    }

  } catch (error) {
    console.error('Error fetching data', error);
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to fetch data',
      life: 3000
    });
  }
};


/************************************************************/
const fetchDataFactura = async () => {
const response = await peticionesFetchOffline('getLastXRows', 'facturas','100');
    const jsonData = response.filter(ft=>ft.almacen === datosEmpresaStore.empresa.nombre);
    facturas.value = jsonData;
};
/************************************************************/
const recargarFacturasFull = async()=>{
  facturasSinCobrar.value = []
  await fetchDataFactura();
  await fetchAndSetupDatosdelDia();
  await actualizarCantidadFacturasTurno();
}
/************************************************************/
const fetchDataTaller = async () => {
const response = await peticionesFetchOffline('getDataAsArray', 'taller');
    const jsonData = response.filter(ft=>ft.almacen === datosEmpresaStore.empresa.nombre);
    facturasTaller.value = jsonData.reverse();
    if (facturasTaller.value[0]) {
      facturaTallerSeleccionada.value = facturasTaller.value[0];
      const datosJSON = facturasTaller.value[0]
      clienteTaller.value = datosJSON.nombre;

    }
};
/************************************************************/
const datosDelDia = ref({
    "venta": 0.00,
    "efectivo": 0.00,
    "transferencia": 0.00,
    "tarjeta": 0.00,
    "ganancia": 0.00,
    "gastos": 0.00,
    "entradas": 0.00,
    "devoluciones": 0.00,
    "inicioCaja": 0.00,
    "abono": 0.00,
    "cuentasXcobrar": 0.00,
    "taller": 0.00,
    "tallerEfectivo": 0.00
});
/************************************************************/
const fetchAndSetupDatosdelDia = async () => {
  const datosFechaHoy = nfecha('timestampcompleta');
  const fechaInicioN = fechaDeInicioHoy.value;
  const fechaFinN = fechaDeFinHoy.value || nfecha('timestamp');

  const tablas_created = ["facturas", "gastos", "entradas","registrocaja","devoluciones"]
  const tablas_updated = ["cuentas_cobrar", "taller"]

const response = await peticionesFetchOffline('datosVentasPorRango2', fechaInicioN,fechaFinN,tablas_created,tablas_updated);

    if (!response) {
      console.warn('⚠️ Response vacío en fetchAndSetupDatosdelDia');
      dataFacturas.value = [];
      gastosArray.value = [];
      tallerArray.value = [];
      cxcArray.value = [];
      datosDelDia.value.data = {};
      datosEnvio.value = {};
      return;
    }

    const jsonData = response;
    datosDelDia.value.data = jsonData;
    datosEnvio.value = JSON.parse(JSON.stringify(jsonData));

    const copiaResponse = JSON.parse(JSON.stringify(response));
    // Una cuenta por cobrar puede haberse creado en una fecha anterior y
    // recibir un abono hoy. Consultar todas las cuentas evita que el filtro
    // por updated_at del reporte omita ese pago; los pagos se filtran abajo
    // por token y por la hora exacta del turno.
    const [cuentasCobrarCompletas, tallerCompleto] = await Promise.all([
      peticionesFetchOffline('getDataAsArray', 'cuentas_cobrar'),
      peticionesFetchOffline('getDataAsArray', 'taller')
    ]);
    if (Array.isArray(cuentasCobrarCompletas)) {
      copiaResponse.cuentas_cobrar = cuentasCobrarCompletas;
    }
    if (Array.isArray(tallerCompleto)) {
      copiaResponse.taller = tallerCompleto;
    }
    const asArray = valor => Array.isArray(valor) ? valor : [];
    const normalizar = valor => String(valor || '').trim().toLowerCase();
    const almacenActual = normalizar(datosEmpresaStore.empresa?.nombre);
    const turnoActual = turnoUsuarioSelected.value && turnoUsuarioSelected.value !== 'COMPLETO'
      ? turnoUsuarioSelected.value
      : '';

    // Las fechas devueltas por el servidor pueden venir convertidas a UTC.
    // Para el turno individual, consultar por token evita perder facturas por
    // diferencias de zona horaria.
    if (turnoActual) {
      const facturasPorToken = await peticionesFetchOffline(
        'getDataArrayByCondition',
        'facturas',
        'token',
        turnoActual
      );
      if (Array.isArray(facturasPorToken)) {
        copiaResponse.facturas = facturasPorToken;
      } else if (Array.isArray(facturasPorToken?.data)) {
        copiaResponse.facturas = facturasPorToken.data;
      }
    }
    const obtenerTurnoMovimiento = registro => {
      if (registro?.turno || registro?.token) return registro.turno || registro.token;
      try {
        const otro = Array.isArray(registro?.otro) ? registro.otro : JSON.parse(registro?.otro || '[]');
        return otro?.[0]?.turno || otro?.[0]?.token || '';
      } catch (error) {
        return '';
      }
    };
    // Las órdenes creadas por versiones anteriores guardaban este turno fijo
    // en el abono inicial. Se trata como un movimiento sin turno y se asigna
    // por la fecha/hora real de apertura de caja.
    const esTurnoTallerLegacy = registro =>
      normalizar(obtenerTurnoMovimiento(registro)) === '280420241514073';
    const perteneceAlTurno = registro => !turnoActual ||
      normalizar(obtenerTurnoMovimiento(registro)) === normalizar(turnoActual);
    const perteneceAlAlmacen = registro => !almacenActual || !normalizar(registro?.almacen) ||
      normalizar(registro?.almacen) === almacenActual;
    const filtrarMovimientos = registros => asArray(registros)
      .filter(perteneceAlAlmacen)
      .filter(perteneceAlTurno);

    const facturasTurno = filtrarMovimientos(copiaResponse.facturas);
    const gastosTurno = filtrarMovimientos(copiaResponse.gastos);
    const entradasTurno = filtrarMovimientos(copiaResponse.entradas);
    const devolucionesTurno = filtrarMovimientos(copiaResponse.devoluciones);
    const registrosCajaTurno = filtrarMovimientos(copiaResponse.registrocaja);

    const totalEfectivoFactura = (factura) => {
      const metodoPago = String(factura.metodo_pago || '').trim().toUpperCase();
      const efectivoRegistrado = Number(factura.efectivo || 0);
      const totalFactura = Number(factura.total || 0);
      const totalCliente = Number(factura.total_cliente || 0);

      if (efectivoRegistrado > 0) {
        return efectivoRegistrado;
      }

      if (metodoPago === 'EFECTIVO') {
        return totalFactura > 0 ? totalFactura : totalCliente;
      }

      return 0;
    };

    const estadosNoValidos = ['devolucion', 'anulada', 'anulado', 'cancelada', 'cancelado'];
    const facturasValidas = facturasTurno
      .filter(factura => !estadosNoValidos.includes(normalizar(factura.estado_factura)))
      .filter(factura => normalizar(factura.metodo_pago) !== 'credito');
    const totalVentasEfectivo = facturasValidas
      .map(totalEfectivoFactura)
      .reduce((acc, total) => acc + total, 0) || 0;

    dataFacturas.value = facturasTurno;
    gastosArray.value = gastosTurno;
    tallerArray.value = asArray(copiaResponse.taller).filter(perteneceAlAlmacen);
    cxcArray.value = asArray(copiaResponse.cuentas_cobrar).filter(perteneceAlAlmacen);

    const cantidadGastoEfectivo = gastosTurno
      .filter(gasto => !gasto.metodo || normalizar(gasto.metodo) === 'efectivo')
      .reduce((total, gasto) => total + Number(gasto.cantidad || 0), 0);
    const cantidadEntradas = entradasTurno
      .reduce((total, entrada) => total + Number(entrada.cantidad || 0), 0);
    const cantidadDevoluciones = devolucionesTurno
      .reduce((total, devolucion) => total + Number(devolucion.cantidad || 0), 0);

    const turnoSeleccionado = turnosHoyArray.value.find(
      turno => normalizar(turno.turno) === normalizar(turnoUsuarioSelected.value)
    );
    const cantidadInicio = turnoActual
      ? Number(turnoSeleccionado?.cant_inicio ?? registrosCajaTurno[0]?.cant_inicio ?? 0)
      : registrosCajaTurno.reduce((total, caja) => total + Number(caja.cant_inicio || 0), 0);

const abonado = asArray(copiaResponse.cuentas_cobrar)
.filter(perteneceAlAlmacen)
  .map(factura => {
    let totalAbono = 0;
    let abonos = [];

    try {
        abonos = JSON.parse(factura.pagos);
    } catch (error) {
        console.error('Error al parsear abonos:', error);
        return 0; 
    }

    for (let pago of abonos) {
        const fechaBuscar = pago.timestamp || convertirAFechaTimestamp(pago.fecha, pago.hora);
        const estaFecha = esFechaEnRango(fechaBuscar, fechaInicioN, fechaFinN);
        // Compatibilidad con abonos creados antes de guardar el token:
        // si no tienen turno, el rango exacto de apertura los identifica.
        const tieneTurno = Boolean(normalizar(obtenerTurnoMovimiento(pago)));
        const esDelTurno = perteneceAlTurno(pago) || (turnoActual && !tieneTurno);
        if (estaFecha && esDelTurno) {
            if (normalizar(pago.metodo) === 'efectivo') {
            totalAbono += Number(pago.cantidad); 
            }

        }
    }

    return totalAbono; 
  })
  .reduce((acc, total) => acc + total, 0) || 0; 
let cantidadTallerEfectivo = 0

const cantidadTaller = asArray(copiaResponse.taller)
.filter(perteneceAlAlmacen)
  .map(factura => {
    let totalAbono = 0;
    let abonos = [];

    try {
        abonos = JSON.parse(factura.abono);
    } catch (error) {
        console.error('Error al parsear abonos:', error);
        return 0; 
    }

    for (let abono of abonos) {
        const fechaBuscar = abono.timestamp || convertirAFechaTimestamp(abono.fecha, abono.hora);
        const estaFecha = esFechaEnRango(fechaBuscar, fechaInicioN, fechaFinN);
        const tieneTurno = Boolean(normalizar(obtenerTurnoMovimiento(abono))) && !esTurnoTallerLegacy(abono);
        const esDelTurno = perteneceAlTurno(abono) || (turnoActual && !tieneTurno);
        if (estaFecha && esDelTurno) {
  
            totalAbono += Number(abono.abono); 
            if (normalizar(abono.metodo_pago) === 'efectivo') {
               cantidadTallerEfectivo += Number(abono.abono);
            }
        }
    }

    return totalAbono; 
  })
  .reduce((acc, total) => acc + total, 0) || 0; 


    datosDelDia.value = {
      ...datosDelDia.value,
      venta: facturasValidas.reduce((total, factura) => total + Number(factura.total || 0), 0),
      efectivo: totalVentasEfectivo + abonado + cantidadTallerEfectivo,
      transferencia: facturasValidas.reduce((total, factura) => total + Number(factura.transferencia || 0), 0),
      tarjeta: facturasValidas.reduce((total, factura) => total + Number(factura.tarjeta || 0), 0),
      ganancia: facturasValidas.reduce((total, factura) => total + Number(factura.ganancia || 0), 0),
      gastos: cantidadGastoEfectivo,
      entradas: cantidadEntradas,
      devoluciones: cantidadDevoluciones,
      inicioCaja: cantidadInicio,
      abono: abonado,
      taller: cantidadTaller,
      tallerEfectivo: cantidadTallerEfectivo
    };

    contidadInicioCaja.value = Number(cantidadInicio).toFixed(2);
    totalModalEnCaja.value = (
      cantidadInicio +
      totalVentasEfectivo +
      abonado +
      cantidadTallerEfectivo +
      cantidadEntradas -
      cantidadGastoEfectivo -
      cantidadDevoluciones
    ).toFixed(2);
    transaccionesCantidad.value = jsonData.efectivo

};
/************************************************************/
const visibleInicioCaja = ref(false)
/************************************************************/
const actualizarTokenSoloUso = async()=>{
    tokenSoloUso.value = Math.floor(1000 + Math.random() * 9000).toString();
const datosJSON = await envioElectron('datosarchivo');
  datosJSON.TOKEN_SOLOUSO = tokenSoloUso.value;
  try {
    const envioDatosJSON = await window.electron.ipcRenderer.invoke('actualizarjson', datosJSON);
    toast.add({ severity: 'success', summary: 'OK', detail: 'Datos Actualizados', life: 3000 });
  } catch (error) {
    console.error("Error sending data to Electron:", error);
    toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to update data', life: 3000 });
  }

}
/************************************************************/
const turnosAbiertos = async()=>{
    const fecha = nfecha('timestampcompleta')
    //const response = await peticionesFetchOffline('getRowsByTimestampRange','cuadres','created_at',fechaDeInicioHoy.value,fechaDeFinHoy.value);
      const response = await peticionesFetchOffline('getDataArrayByCondition', 'registrocaja','estado','ABIERTO');
      turnosHoyArray.value = response;
     const turnosAbiertosA = response
    cajaAbiertaArray.value = turnosAbiertosA
    if(turnosAbiertosA.length > 0){
      const turnoActual = datosEmpresaStore.usuario?.token || usuarioLocal.value?.token || '';
      const cajaActual = turnosAbiertosA.find(caja => caja.turno === turnoActual) || turnosAbiertosA[0];
      fechaDeInicioHoy.value = cajaActual?.created_at || fecha.fechainicio
      cuadre.value = cajaActual
      contidadInicioCaja.value = Number(cajaActual?.cant_inicio || 0).toFixed(2);
    }else{
      fechaDeInicioHoy.value = fecha.fechainicio
    }


}
/************************************************************/
const obtenerCajaActual = async () => {
  const turnoActual = datosEmpresaStore.usuario?.token || usuarioLocal.value?.token || '';
  const emailActual = datosEmpresaStore.usuario?.email || usuarioLocal.value?.email || '';

  let datosCaja = null;

  if (turnoActual) {
    datosCaja = await peticionesFetchOffline('getDataByField', 'registrocaja', 'turno', turnoActual);
  }

  if (!datosCaja && emailActual) {
    const sesionesAbiertas = await peticionesFetchOffline('getDataByDoubleCondition', 'registrocaja', 'estado', 'ABIERTO', 'username', emailActual);
    if (Array.isArray(sesionesAbiertas) && sesionesAbiertas.length > 0) {
      datosCaja = sesionesAbiertas
        .slice()
        .sort((a, b) => Number(b.id || 0) - Number(a.id || 0))[0];
    }
  }

  if (!datosCaja) {
    const todasLasCajas = await peticionesFetchOffline('getDataAsArray', 'registrocaja');
    const almacenActual = String(datosEmpresaStore.empresa?.nombre || '').trim().toLowerCase();
    const cajasAbiertas = (Array.isArray(todasLasCajas) ? todasLasCajas : [])
      .filter(caja => ['abierto', 'abierta'].includes(String(caja?.estado || '').trim().toLowerCase()))
      .filter(caja => !almacenActual || String(caja?.almacen || '').trim().toLowerCase() === almacenActual)
      .sort((a, b) => Number(b.id || 0) - Number(a.id || 0));
    datosCaja = cajasAbiertas[0] || null;
  }

  return datosCaja;
}
/************************************************************/
const actualizarCantidadFacturasTurno = async () => {
  try {
    const cajaActual = await obtenerCajaActual();
    const inicioTurno = cajaActual?.created_at;
    if (!inicioTurno) {
      cantidadFacturasTurno.value = 0;
      facturasDelTurnoActual.value = [];
      totalModalEnCaja.value = '0.00';
      return;
    }

    const response = await peticionesFetchOffline(
      'getRowsByTimestampRange',
      'facturas',
      'created_at',
      inicioTurno,
      nfecha('timestamp')
    );
    const facturasConsultadas = Array.isArray(response)
      ? response
      : Array.isArray(response?.data)
        ? response.data
        : [];
    const almacenActual = String(datosEmpresaStore.empresa?.nombre || '').trim();
    const convertirTimestamp = (valor) => {
      const timestamp = Date.parse(String(valor || '').replace(' ', 'T'));
      return Number.isFinite(timestamp) ? timestamp : null;
    };
    const inicioTimestamp = convertirTimestamp(inicioTurno);
    const finTimestamp = Date.now();

    const facturasTurno = facturasConsultadas.filter((factura) => {
      if (almacenActual && String(factura.almacen || '').trim() !== almacenActual) return false;
      const fechaFactura = convertirTimestamp(factura.created_at);
      return fechaFactura !== null && inicioTimestamp !== null &&
        fechaFactura >= inicioTimestamp && fechaFactura <= finTimestamp;
    });

    facturasDelTurnoActual.value = facturasTurno;
    cantidadFacturasTurno.value = facturasTurno.length;

    // La misma colección que muestra "Facturas del turno" aporta las ventas.
    // Los demás importes ya fueron filtrados por el token del turno en
    // fetchAndSetupDatosdelDia.
    const totalFacturasTurno = facturasTurno.reduce(
      (total, factura) => {
        const metodo = String(factura.metodo_pago || '').trim().toUpperCase();
        const efectivo = Number(factura.efectivo || 0);
        if (efectivo > 0) return total + efectivo;
        return metodo === 'EFECTIVO'
          ? total + Number(factura.total || factura.total_cliente || 0)
          : total;
      },
      0
    );
    const turnoCaja = String(cajaActual.turno || '').trim();
    const movimientoPerteneceAlTurno = (movimiento) => {
      const turnoMovimiento = String(movimiento?.turno || movimiento?.token || '').trim();
      // Compatibilidad con el turno fijo usado antiguamente al crear talleres.
      if (turnoMovimiento && turnoMovimiento !== '280420241514073') {
        return turnoMovimiento === turnoCaja;
      }

      const fechaMovimiento = convertirTimestamp(
        movimiento?.timestamp || convertirAFechaTimestamp(movimiento?.fecha, movimiento?.hora)
      );
      return fechaMovimiento !== null && inicioTimestamp !== null &&
        fechaMovimiento >= inicioTimestamp && fechaMovimiento <= finTimestamp;
    };
    const leerMovimientos = (registro, campo) => {
      try {
        return Array.isArray(registro?.[campo])
          ? registro[campo]
          : JSON.parse(registro?.[campo] || '[]');
      } catch (error) {
        return [];
      }
    };
    const [cuentasCobrarTurno, talleresTurno] = await Promise.all([
      peticionesFetchOffline('getDataAsArray', 'cuentas_cobrar'),
      peticionesFetchOffline('getDataAsArray', 'taller')
    ]);
    const perteneceAlAlmacen = registro => !almacenActual ||
      !String(registro?.almacen || '').trim() ||
      String(registro.almacen).trim() === almacenActual;
    const abonosCuentasCobrar = (Array.isArray(cuentasCobrarTurno) ? cuentasCobrarTurno : [])
      .filter(perteneceAlAlmacen)
      .flatMap(cuenta => leerMovimientos(cuenta, 'pagos'))
      .filter(movimientoPerteneceAlTurno)
      .filter(pago => String(pago.metodo || '').trim().toUpperCase() === 'EFECTIVO')
      .reduce((total, pago) => total + Number(pago.cantidad || 0), 0);
    const abonosTallerEfectivo = (Array.isArray(talleresTurno) ? talleresTurno : [])
      .filter(perteneceAlAlmacen)
      .flatMap(taller => leerMovimientos(taller, 'abono'))
      .filter(movimientoPerteneceAlTurno)
      .filter(abono => String(abono.metodo_pago || '').trim().toUpperCase() === 'EFECTIVO')
      .reduce((total, abono) => total + Number(abono.abono || 0), 0);
    const fondoInicialTurno = Number(cajaActual.cant_inicio || 0);
    const entradasTurno = Number(datosDelDia.value.entradas || 0);
    const gastosTurno = Number(datosDelDia.value.gastos || 0);
    const devolucionesTurno = Number(datosDelDia.value.devoluciones || 0);

    contidadInicioCaja.value = fondoInicialTurno.toFixed(2);
    datosDelDia.value.inicioCaja = fondoInicialTurno;
    datosDelDia.value.venta = totalFacturasTurno;
    datosDelDia.value.abono = abonosCuentasCobrar;
    datosDelDia.value.tallerEfectivo = abonosTallerEfectivo;
    datosDelDia.value.efectivo = totalFacturasTurno + abonosCuentasCobrar + abonosTallerEfectivo;
    totalModalEnCaja.value = (
      fondoInicialTurno +
      totalFacturasTurno +
      abonosCuentasCobrar +
      abonosTallerEfectivo +
      entradasTurno -
      gastosTurno -
      devolucionesTurno
    ).toFixed(2);
  } catch (error) {
    console.warn('No se pudo actualizar la cantidad de facturas del turno:', error);
    cantidadFacturasTurno.value = 0;
    facturasDelTurnoActual.value = [];
  }
};

watch(dataFacturas, () => {
  void actualizarCantidadFacturasTurno();
});
/************************************************************/

/************************************************************/
const cerrarSessiones = async(sessiones)=>{

  for(let session of sessiones){
      session.estado = 'Cerrada'
      session.updated_at = nfecha('timestamp');
      session.otro = nombrePC.value
     const datosEnCaja = await peticionesFetchOffline('updateData', 'registrocaja',JSON.stringify(session));
  }

}
/************************************************************/

const fetchCuentas = async () => {
  try {
    const response = await peticionesFetchOffline('getDataAsArray', 'cuentas');
    cuentasData.value = response;
    cuentasDataNames.value = response.map(cuenta=>cuenta.nombre);
  } catch (error) {
    toast.add({ 
      severity: 'error', 
      summary: 'Error', 
      detail: 'Failed to fetch data from cuentas', 
      life: 3000 
    });
  }
};

/************************************************************/
const fetchCxC = async () => {
  try {
    const fecha = nfecha('timestampcompleta')

    const response = await peticionesFetchOffline('getRowsByTimestampRange','cuentas_cobrar','created_at',fechaDeInicioHoy.value,nfecha('timestamp'));

    const jsonData = response;

    if (Array.isArray(jsonData)) {
     // cuentasXcobrarArray.value = jsonData;

      datosDelDia.value.cuentasXcobrar = jsonData
        .map(factura => Number(factura.monto_credito))
        .reduce((acc, total) => acc + total, 0) || 0;
    } else {
      console.error('La respuesta no es un array válido:', jsonData);
    }

  } catch (error) {
    console.error('Error al obtener las cuentas por cobrar:', error);
  }
};
/************************************************************/
function convertirATimestamp(fecha, hora) {
  // Dividir la fecha en día, mes y año
  const partesFecha = fecha.split('/');
  const dia = partesFecha[0];
  const mes = partesFecha[1] - 1; // Los meses en JavaScript son 0-indexados
  const año = partesFecha[2];

  // Dividir la hora en horas, minutos y segundos
  const partesHora = hora.split(':');
  const horas = partesHora[0];
  const minutos = partesHora[1];
  const segundos = partesHora[2];

  // Crear un objeto Date con la fecha y hora proporcionadas
  const fechaHora = new Date(año, mes, dia, horas, minutos, segundos);

  // Devolver el timestamp
  return fechaHora.getTime();
}
/************************************************************/
const fnVerCuadre = async () => {
  cuadrarCaja.value = false
  visibleCuadre.value = false
  try {
    if (!totalModal.value) {
      toast.add({
        severity: "error",
        summary: "Error",
        detail: "Debe hacer el conteo del dinero",
        life: 3000,
      })
      return
    }

    // Selección del formato
    const { value: formato } = await Swal.fire({
      title: "Seleccionar Formato de PDF",
      input: "select",
      inputOptions: {
        carta: "📄 Carta (A4)",
        ticket: "🧾 Ticket 80mm",
      },
      inputPlaceholder: "Elige un formato",
      inputValue: "carta",
      showCancelButton: true,
      confirmButtonText: "Continuar",
      cancelButtonText: "Cancelar",
    })
    if (!formato) return

    // 💰 Monedero
    const monedero = {
      "1": Number(pesos.value) || 0,
      "5": Number(cincopesos.value) || 0,
      "10": Number(diezpesos.value) || 0,
      "25": Number(veinticincopesos.value) || 0,
      "50": Number(cincuentapesos.value) || 0,
      "100": Number(cienpesos.value) || 0,
      "200": Number(docientospesos.value) || 0,
      "500": Number(quinientoscopesos.value) || 0,
      "1000": Number(milpesos.value) || 0,
      "2000": Number(dosmilpesos.value) || 0,
    }

    // Datos base
    const data = datosDelDia.value?.data || {}
    const facturas = data.facturas || []
    const gastos = data.gastos || []
    //const cuadres = data.cuadres || []
    const cuadres = data.registrocaja || []
    const cuentas = data.cuentas_cobrar || []
    const taller = data.taller || []

    // ================= 🔹 FACTURAS =================
    const efectivoVentas = facturas
      .filter((f) => f.estado_factura === "Cobrado" && f.metodo_pago === "EFECTIVO")
      .reduce((a, f) => a + Number(f.efectivo || 0), 0)
    const tarjetaVentas = facturas
      .filter((f) => f.estado_factura === "Cobrado")
      .reduce((a, f) => a + Number(f.tarjeta || 0), 0)
    const transferenciaVentas = facturas
      .filter((f) => f.estado_factura === "Cobrado")
      .reduce((a, f) => a + Number(f.transferencia || 0), 0)
    const totalVenta = efectivoVentas + tarjetaVentas + transferenciaVentas

    // ================= 🔹 CUENTAS POR COBRAR =================
    let totalCxC = 0,
      abonado = 0,
      efectivoCxC = 0,
      tarjetaCxC = 0,
      transferenciaCxC = 0
    const resumenCxC = []

    cuentas.forEach((f) => {
      const montoCredito = Number(f.monto_credito || 0)
      totalCxC += montoCredito
      let totalPagos = 0

      try {
        const pagos = JSON.parse(f.pagos || "[]")
        pagos.forEach((p) => {
          const cantidad = Number(p.cantidad || 0)
          if (cantidad > 0) {
            totalPagos += cantidad
            abonado += cantidad
            switch (p.metodo) {
              case "EFECTIVO":
                efectivoCxC += cantidad
                break
              case "TARJETA":
                tarjetaCxC += cantidad
                break
              case "TRANSFERENCIA":
                transferenciaCxC += cantidad
                break
            }
          }
        })
      } catch {}

      const pendiente = montoCredito - totalPagos
      resumenCxC.push([
        f.nombre_cliente || "Sin nombre",
        montoCredito.toFixed(2),
        totalPagos.toFixed(2),
        pendiente.toFixed(2),
      ])
    })

    // ================= 🔹 TALLER (ABONOS REALES) =================
    let efectivoTaller = 0,
      tarjetaTaller = 0,
      transferenciaTaller = 0,
      totalTaller = 0
    const resumenTaller = []

    taller.forEach((t) => {
      let totalAbonos = 0
      let efectivo = 0,
        tarjeta = 0,
        transferencia = 0

      try {
        const abonos = JSON.parse(t.abono || "[]")
        abonos.forEach((ab) => {
          const monto = Number(ab.abono || 0)
          if (monto > 0) {
            totalAbonos += monto
            switch (ab.metodo_pago) {
              case "EFECTIVO":
                efectivo += monto
                efectivoTaller += monto
                break
              case "TARJETA":
                tarjeta += monto
                tarjetaTaller += monto
                break
              case "TRANSFERENCIA":
                transferencia += monto
                transferenciaTaller += monto
                break
            }
          }
        })
      } catch {}

      totalTaller += totalAbonos

      const fallas = (() => {
        try {
          const f = JSON.parse(t.fallas || "[]")
          return f.map((x) => x.propiedad).join(", ") || "N/A"
        } catch {
          return "N/A"
        }
      })()

      const pendiente = Number(t.total || 0) - totalAbonos

      resumenTaller.push([
        t.nombre || "Sin nombre",
        `${t.equipo || ""} ${t.modelo || ""}`,
        fallas,
        totalAbonos.toFixed(2),
        pendiente.toFixed(2),
      ])
    })

    // ================= 🔹 GASTOS =================
// --- Detalle de Gastos ---
const tablaGastos = gastos.map((g) => [
  g.descripcion || "Sin descripción",
  (g.metodo || "N/D").toUpperCase(),
  Number(g.cantidad || 0).toFixed(2),
  g.cajero || g.usuario || "Desconocido",
]);

// --- Calcular subtotales por método ---
const gastoEfectivo = gastos
  .filter((g) => (g.metodo || "").toUpperCase() === "EFECTIVO")
  .reduce((a, g) => a + Number(g.cantidad || 0), 0);

const gastoTarjeta = gastos
  .filter((g) => (g.metodo || "").toUpperCase() === "TARJETA")
  .reduce((a, g) => a + Number(g.cantidad || 0), 0);

const gastoTransferencia = gastos
  .filter((g) => (g.metodo || "").toUpperCase() === "TRANSFERENCIA")
  .reduce((a, g) => a + Number(g.cantidad || 0), 0);

const totalGastos = gastoEfectivo + gastoTarjeta + gastoTransferencia;

    // ================= 🔹 TOTALES =================
    const cantidadInicio = cuadres.reduce((acc, c) => acc + Number(c.cant_inicio || 0), 0)
    //const totalGastos = gastos.reduce((acc, g) => acc + Number(g.cantidad || 0), 0)
    const totalEfectivo = efectivoVentas + efectivoCxC + efectivoTaller
    const totalTarjeta = tarjetaVentas + tarjetaCxC + tarjetaTaller
    const totalTransferencia = transferenciaVentas + transferenciaCxC + transferenciaTaller
    const totalEnCaja = totalEfectivo + cantidadInicio - totalGastos
    const totalGeneral = totalEfectivo + totalTarjeta + totalTransferencia + cantidadInicio - totalGastos
    const diferencia = Number(totalModal.value) - totalEnCaja

    const nDatosEmpresa = JSON.parse(JSON.stringify(enviarDatosLocalStorage()))
    nDatosEmpresa.usuario = datosEmpresaStore.usuario

    const doc =
      formato === "ticket"
        ? new jsPDF({ orientation: "portrait", unit: "mm", format: [80, 1000] })
        : new jsPDF({ orientation: "portrait", unit: "mm", format: "A4" })

    // ========================================================
    // ==================== 📄 FORMATO CARTA ==================
    // ========================================================
    if (formato === "carta") {
      doc.setFontSize(14)
      doc.text(nDatosEmpresa.empresa?.nombre || "Empresa", 105, 15, { align: "center" })
      doc.setFontSize(11)
      doc.text("REPORTE DE CUADRE DE CAJA", 105, 22, { align: "center" })
      doc.line(10, 25, 200, 25)

      doc.setFontSize(10)
      doc.text(`Usuario: ${nDatosEmpresa.usuario.nombre}`, 10, 32)
      doc.text(`Fecha: ${nfecha("fecha")}`, 150, 32)

      // --- Totales Generales ---
autoTable(doc, {
  startY: 40,
  theme: "grid",
  head: [["Concepto", "Monto (RD$)"]],
  body: [
    [{ content: "VENTAS", colSpan: 2, styles: { halign: "center", fillColor: [33, 150, 243], textColor: 255 } }],
    ["Efectivo", efectivoVentas.toFixed(2)],
    ["Tarjeta", tarjetaVentas.toFixed(2)],
    ["Transferencia", transferenciaVentas.toFixed(2)],
    ["Total Ventas", (efectivoVentas + tarjetaVentas + transferenciaVentas).toFixed(2)],

    [{ content: "CUENTAS POR COBRAR", colSpan: 2, styles: { halign: "center", fillColor: [255, 152, 0], textColor: 255 } }],
    ["Efectivo", efectivoCxC.toFixed(2)],
    ["Tarjeta", tarjetaCxC.toFixed(2)],
    ["Transferencia", transferenciaCxC.toFixed(2)],
    ["Total CxC", (efectivoCxC + tarjetaCxC + transferenciaCxC).toFixed(2)],

    [{ content: "TALLER", colSpan: 2, styles: { halign: "center", fillColor: [76, 175, 80], textColor: 255 } }],
    ["Efectivo", efectivoTaller.toFixed(2)],
    ["Tarjeta", tarjetaTaller.toFixed(2)],
    ["Transferencia", transferenciaTaller.toFixed(2)],
    ["Total Taller", (efectivoTaller + tarjetaTaller + transferenciaTaller).toFixed(2)],

    [{ content: "GASTOS", colSpan: 2, styles: { halign: "center", fillColor: [244, 67, 54], textColor: 255 } }],
    ["Efectivo", gastoEfectivo.toFixed(2)],
    ["Tarjeta", gastoTarjeta.toFixed(2)],
    ["Transferencia", gastoTransferencia.toFixed(2)],
    ["Total Gastos", totalGastos.toFixed(2)],

    [{ content: "TOTALES FINALES", colSpan: 2, styles: { halign: "center", fillColor: [0, 188, 212], textColor: 255 } }],
    ["Inicio Caja", cantidadInicio.toFixed(2)],
    ["Total en Caja (Efectivo + Inicio - Gastos)", totalEnCaja.toFixed(2)],
    ["Diferencia", diferencia.toFixed(2)]
  ],
  styles: { fontSize: 9, cellPadding: 2 }
});

      // --- Detalle Facturas ---
      const ventasY = doc.lastAutoTable.finalY + 10
      doc.setFontSize(12)
      doc.text("Detalle de Facturas", 105, ventasY, { align: "center" })
      const detalleFacturas = facturas.map((f) => [
        f.no_factura,
        f.nombre_cliente || "CLIENTE",
        f.metodo_pago,
        Number(f.total).toFixed(2),
      ])
      autoTable(doc, {
        startY: ventasY + 5,
        theme: "striped",
        head: [["Factura", "Cliente", "Método", "Total RD$"]],
        body: detalleFacturas,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [33, 150, 243], textColor: 255 },
      })

      // --- Cuentas por Cobrar ---
      const cxcY = doc.lastAutoTable.finalY + 10
      doc.text("Resumen de Cuentas por Cobrar", 105, cxcY, { align: "center" })
      autoTable(doc, {
        startY: cxcY + 5,
        theme: "grid",
        head: [["Cliente", "Crédito", "Pagado", "Pendiente"]],
        body: resumenCxC,
        styles: { fontSize: 9 },
        headStyles: { fillColor: [255, 152, 0], textColor: 255 },
      })

      // --- Taller ---
      const tallerY = doc.lastAutoTable.finalY + 10
      doc.text("Resumen de Taller (Abonos)", 105, tallerY, { align: "center" })
      autoTable(doc, {
        startY: tallerY + 5,
        theme: "grid",
        head: [["Cliente", "Equipo", "Fallas", "Abonado", "Pendiente"]],
        body: resumenTaller,
        styles: { fontSize: 9 },
        headStyles: { fillColor: [76, 175, 80], textColor: 255 },
      })

      // --- Gastos ---
      const gastosY = doc.lastAutoTable.finalY + 10
      doc.text("Resumen de Gastos", 105, gastosY, { align: "center" })
      autoTable(doc, {
        startY: gastosY + 5,
        theme: "grid",
        head: [["Descripción", "Método", "Monto RD$", "Cajero"]],
        body: tablaGastos,
        styles: { fontSize: 9 },
        headStyles: { fillColor: [244, 67, 54], textColor: 255 },
      })
    }

    // ========================================================
    // ==================== 🧾 FORMATO 80MM ==================
    // ========================================================
    else {
      const ancho = 40
      let y = 10

      doc.setFontSize(10)
      doc.text(nDatosEmpresa.empresa?.nombre || "EMPRESA", ancho, y, { align: "center" })
      y += 5
      doc.text("CUADRE DE CAJA", ancho, y, { align: "center" })
      y += 5
      doc.text(`Usuario: ${nDatosEmpresa.usuario.nombre}`, 5, y)
      y += 4
      doc.text(`Fecha: ${nfecha("fecha")}`, 5, y)
      y += 4
      doc.line(5, y, 75, y)
      y += 5

      // --- Totales ---
      const line = (label, val) => {
        doc.text(`${label}: RD$${val.toFixed(2)}`, 5, y)
        y += 4
      }
      line("Ventas Efectivo", efectivoVentas)
      line("Ventas Tarjeta", tarjetaVentas)
      line("Ventas Transf.", transferenciaVentas)
      line("CxC Abonos", abonado)
      line("Taller Abonos", totalTaller)
      line("Gastos", totalGastos)
      line("Inicio Caja", cantidadInicio)
      line("Total en Caja", totalEnCaja)
      line("Diferencia", diferencia)
      doc.line(5, y, 75, y)
      y += 5

      // --- Facturas ---
      doc.text("FACTURAS", ancho, y, { align: "center" })
      y += 4
      facturas.forEach((f) => {
        doc.text(`${f.no_factura} - ${f.metodo_pago} - ${Number(f.total).toFixed(2)}`, 5, y)
        y += 4
      })
      doc.line(5, y, 75, y)
      y += 5

      // --- CxC ---
      doc.text("CUENTAS X COBRAR", ancho, y, { align: "center" })
      y += 4
      resumenCxC.forEach((c) => {
        doc.text(`${c[0]} Pag: ${c[2]} Pend: ${c[3]}`, 5, y)
        y += 4
      })
      doc.line(5, y, 75, y)
      y += 5

      // --- Taller ---
      doc.text("TALLER (Abonos)", ancho, y, { align: "center" })
      y += 4
      resumenTaller.forEach((t) => {
        doc.text(`${t[0]} Ab:${t[3]} Pend:${t[4]}`, 5, y)
        y += 4
      })
      doc.line(5, y, 75, y)
      y += 5

      // --- Gastos ---
      doc.text("GASTOS", ancho, y, { align: "center" })
      y += 4
      tablaGastos.forEach((g) => {
        doc.text(`${g[0]}: ${g[2]}`, 5, y)
        y += 4
      })
      doc.text(`Total Gastos: ${totalGastos.toFixed(2)}`, 5, y)
      y += 6

      doc.line(5, y, 75, y)
      y += 5
      doc.setFontSize(8)
      doc.text("Gracias por usar TM POS SRL", ancho, y, { align: "center" })
    }

    // Mostrar PDF
    const pdfBlob = doc.output("blob")
    const pdfUrl = URL.createObjectURL(pdfBlob)
    await Swal.fire({
      title: "Vista Previa del Cuadre",
      html: `<iframe src="${pdfUrl}" width="100%" height="${formato === "ticket" ? "600px" : "500px"}" style="border:none;"></iframe>`,
      width: formato === "ticket" ? "400px" : "80%",
      showCancelButton: true,
      confirmButtonText: "Descargar PDF",
      cancelButtonText: "Cerrar",
      preConfirm: () =>
        doc.save(`cuadre_${formato === "ticket" ? "80mm" : "carta"}_${nfecha("fecha")}.pdf`),
    })
  } catch (error) {
    console.error("❌ Error generando el PDF del cuadre:", error)
    toast.add({
      severity: "error",
      summary: "Error",
      detail: "No se pudo generar el PDF",
      life: 3000,
    })
  }
}



/************************************************************/
const fnTransaccion = async()=>{
 

}
/************************************************************/
let intervalId;
/************************************************************/
const fetchProveedores = async () => {
  try {
    const response = await peticionesFetchOffline('getDataAsArray', 'proveedores');
    proveedoresData.value = response;
  } catch (error) {
    toast.add({ 
      severity: 'error', 
      summary: 'Error', 
      detail: 'Failed to fetch data from proveedores', 
      life: 3000 
    });
  }
};
/************************************************************/
const fetchClientes = async () => {
  try {
    const response = await peticionesFetchOffline('getDataAsArray', 'clientes');
    clientesData.value = response;
  } catch (error) {
    toast.add({ 
      severity: 'error', 
      summary: 'Error', 
      detail: 'Failed to fetch data from proveedores', 
      life: 3000 
    });
  }
};
/************************************************************/
const handleKeyDown = (event) => {
  // Solo ejecuta si la modal de cobrar está visible
  if (!visiblecobrar.value) return;

  switch (event.key) {
    case 'F1':
      event.preventDefault(); // Evita la acción por defecto del navegador
      fnDejaCambioPropina();
      break;
    case 'F2':
      event.preventDefault();
      fnCobrarPorTarjeta();
      break;
    case 'F3':
      event.preventDefault();
      fnCobrarPorTransferencia();
      break;
    default:
      break;
  }
};
/************************************************************/

async function inicializarCaja() {
permisosPagina(router,'Cajero')

const datosJSON = await envioElectron('datosarchivo');
link.value = datosJSON.VITE_LINKURL;
api.value = datosJSON.VITE_LINK_API;
token.value = datosJSON.VITE_TOKEN;
patronTelefono.value = datosJSON.VITE_PATRON_TELEFONO;
linkImpresora.value = datosJSON.VITE_IMPRESORA_LOCAL;
tokenCorto.value = datosJSON.VITE_TOKEN_CORTO;
tokenSoloUso.value = datosJSON.VITE_TOKEN_SOLOUSO;
token24H.value = datosJSON.VITE_TOKEN_24H;


tokenCifrado.value = await encryptarPassword(token.value, 10);
const sonido = datosJSON.SOUND;

  if(!sonido){
     sonidoON.value = sonido;
  }else{
     sonidoON.value = sonido;
  }

const laFechaHoy = nfecha('timestampcompleta')

//fechaDeInicioHoy.value = laFechaHoy.fechainicio
//fechaDeFinHoy.value = laFechaHoy.fechafin



camposGastos.value = await arrayToObjetoFromTabla('gastos');
await fetchBanco();
camposEntrada.value = await arrayToObjetoFromTabla('entradas');
usuarioLocal.value = datosEmpresaStore.usuario;
datosConfiguracion.value = JSON.parse(window.localStorage.getItem('configuracion'));
datosDefault.value = JSON.parse(window.localStorage.getItem('datosDefault')) || {modo:'FULL'}

  await turnosAbiertos();
  const turnoUsuarioActual = datosEmpresaStore.usuario?.token || usuarioLocal.value?.token || '';
  if (usuarioEsCajero() && turnoUsuarioActual) {
    turnosXfecha.value = [turnoUsuarioActual];
    turnoUsuarioSelected.value = turnoUsuarioActual;
  } else {
    turnosXfecha.value = cajaAbiertaArray.value.map(caja=>caja.turno)
    turnoUsuarioSelected.value = 'COMPLETO';
  }
  await fetchAndSetupData();
  await cambioTurnoSelected();
  await fetchDataFactura();
  await fetchDataTaller();
  await fetchCxC();
  await fetchCuentas();
  await fetchProveedores();
  await fetchClientes();
  await fetchDataBarcode();

  //await imprimirCuadre(false)
   
  console.log("datosDelDia.value", datosDelDia.value);
  const cajaActual = await obtenerCajaActual();
  if (Number(cajaActual?.cant_inicio || 0) <= 0) {
    if(usuarioEsCajero()){
       visibleInicioCaja.value = true;
    }
  }

const fechasInicioLocal = usuarioLocal.value.hora_inicio.split(' ')

cuadre.value.fechainicio = nfecha('fecha')
cuadre.value.fechafin = nfecha('fecha')
cuadre.value.usuario = usuarioLocal.value.usuario
cuadre.value.turnos = usuarioLocal.value.token
//cuadre.value.horainicio = fechasInicioLocal[1]
cuadre.value.horainicio = '07:00:00'

cuadre.value.horafin = nfecha('horaAmericana')

window.addEventListener('keydown', handleKeyDown);
  // Solo sondeo automatico para Cajero (busca facturas pendientes)
  if (usuarioEsCajero()) {
    intervalId = setInterval(fetchAndSetupData, 30000);
  }


}

  // Limpiar el intervalo cuando el componente se desmonte
function limpiarCaja() {

 window.removeEventListener('keydown', handleKeyDown);

    clearInterval(intervalId);
}
/******************************************************/
const pesos = ref('0.00')
const cincopesos = ref('0.00')
const diezpesos = ref('0.00')
const veinticincopesos = ref('0.00')
const cincuentapesos = ref('0.00')
const cienpesos = ref('0.00')
const docientospesos = ref('0.00')
const quinientoscopesos = ref('0.00')
const milpesos = ref('0.00')
const dosmilpesos = ref('0.00')
const totalModal = ref('0.00')
const colorModal = ref('Verificando Cuadre ....')
const alerta = ref('info')

/******************************************************/
watch(cuadrarCaja, async (nuevoValor, viejoValor) => {
  if (nuevoValor === true) {
     const cajaActual = await obtenerCajaActual();
     const turnoUsuarioActual = cajaActual?.turno || datosEmpresaStore.usuario?.token || usuarioLocal.value?.token || '';
     if (cajaActual && !turnosHoyArray.value.some(caja => caja.turno === cajaActual.turno)) {
       turnosHoyArray.value.push(cajaActual);
     }
     if (usuarioEsCajero() && turnoUsuarioActual) {
      turnosXfecha.value = [turnoUsuarioActual];
      turnoUsuarioSelected.value = turnoUsuarioActual;
     } else {
      turnosXfecha.value = cajaAbiertaArray.value.map(caja=>caja.turno)
      turnoUsuarioSelected.value = turnoUsuarioSelected.value || 'COMPLETO';
     }
     await cambioTurnoSelected();
   pesos.value = '0.00'
   cincopesos.value = '0.00'
   diezpesos.value = '0.00'
   veinticincopesos.value = '0.00'
   cincuentapesos.value = '0.00'
   cienpesos.value = '0.00'
   docientospesos.value = '0.00'
   quinientoscopesos.value = '0.00'
   milpesos.value = '0.00'
   dosmilpesos.value = '0.00'
   totalModal.value = '0.00'
   colorModal.value = 'Verificando Cuadre ....'
   alerta.value = 'info'
  }
});
/******************************************************/
watchEffect(async() => {
  if (visiblegastos.value) {
      camposGastos.value.fecha = nfecha('fecha');
      camposGastos.value.hora = nfecha('hora');
      camposGastos.value.cantidad = '0.00';
      camposGastos.value.mes = nfecha('mes');
      camposGastos.value.year = nfecha('year');
      camposGastos.value.turno = usuarioLocal.value.token;
      camposGastos.value.metodo = 'EFECTIVO';
      cuentaBancaria.value = bancoArray.value[bancoArray.value.length - 1] || null;
  }

/*if (cuadrarCaja.value) {
    await fetchAndSetupDatosdelDia();
   pesos.value = '0.00'
   cincopesos.value = '0.00'
   diezpesos.value = '0.00'
   veinticincopesos.value = '0.00'
   cincuentapesos.value = '0.00'
   cienpesos.value = '0.00'
   docientospesos.value = '0.00'
   quinientoscopesos.value = '0.00'
   milpesos.value = '0.00'
   dosmilpesos.value = '0.00'
   totalModal.value = '0.00'
   colorModal.value = 'Verificando Cuadre ....'
   alerta.value = 'info'
}*/



if (visibleimprimirfactura.value) {
   impresoraSeleccionada.value = datosConfiguracion.value.tipo_impresora
}

//camposEntrada
  if (visiblentrada.value) {
      camposEntrada.value.fecha = nfecha('fecha');
      camposEntrada.value.hora = nfecha('hora');
      camposEntrada.value.cantidad = '0.00';
      camposEntrada.value.mes = nfecha('mes');
      camposEntrada.value.year = nfecha('year');
      camposEntrada.value.turno = usuarioLocal.value.token;
  }


});
/******************************************************/
const calcularTotal = () => {
  totalModal.value =
    (Number(pesos.value) || 0) +
    (Number(cincopesos.value) * 5 || 0) +
    (Number(diezpesos.value) * 10 || 0) +
    (Number(veinticincopesos.value) * 25 || 0) +
    (Number(cincuentapesos.value) * 50 || 0) +
    (Number(cienpesos.value) * 100 || 0) +
    (Number(docientospesos.value) * 200 || 0) +
    (Number(quinientoscopesos.value) * 500 || 0) +
    (Number(milpesos.value) * 1000 || 0) +
    //(Number(contidadInicioCaja.value) * 1 || 0) +
    (Number(dosmilpesos.value) * 2000 || 0);
};

const verificarCantidad = () => {
  calcularTotal();
  const diferencia = totalModal.value - (Number(totalModalEnCaja.value) );

  if (diferencia === 0) {
    colorModal.value = "Efectivo correcto";
    alerta.value = "success"; // Verde si está correcto
  } else if (diferencia > 0) {
    colorModal.value = `Sobra ${diferencia} ${datosConfiguracion.value.plural}`;
    alerta.value = "info"; // Azul si sobra
  } else {
    colorModal.value = `Faltan ${Math.abs(diferencia)} ${datosConfiguracion.value.plural}`;
    alerta.value = "danger"; // Rojo si falta
  }
};

// Watch para recalcular el total y verificar cantidad cuando cambia algún valor
watch(
  [pesos, cincopesos, diezpesos, veinticincopesos, cincuentapesos, cienpesos, docientospesos, quinientoscopesos, milpesos, dosmilpesos],
  verificarCantidad
);
/******************************************************/
const handleEfectivoChange = () => {
  const efectivoValue = parseFloat(facturaEfectivo.value) || 0;
  const tarjetaValue = parseFloat(facturaTarjeta.value) || 0;
  const transferenciaValue = parseFloat(facturaTransferencia.value) || 0;
  const totalValue = parseFloat(totalFactura.value) || 0;

  const nuevoTotal = efectivoValue + tarjetaValue + transferenciaValue;

  if (nuevoTotal > totalValue) {
    facturaEfectivo.value = (totalValue - tarjetaValue - transferenciaValue).toFixed(2);
  } else {
    // Handle other fields without affecting the current input
    facturaTarjeta.value = (totalValue - efectivoValue - transferenciaValue).toFixed(2);
  }

  distribuirRestante('efectivo');
};

const handleTarjetaChange = () => {
  const efectivoValue = parseFloat(facturaEfectivo.value) || 0;
  const tarjetaValue = parseFloat(facturaTarjeta.value) || 0;
  const transferenciaValue = parseFloat(facturaTransferencia.value) || 0;
  const totalValue = parseFloat(totalFactura.value) || 0;

  const nuevoTotal = efectivoValue + tarjetaValue + transferenciaValue;

  if (nuevoTotal > totalValue) {
    facturaTarjeta.value = (totalValue - efectivoValue - transferenciaValue).toFixed(2);
  } else {
    // Handle other fields without affecting the current input
    facturaTransferencia.value = (totalValue - efectivoValue - tarjetaValue).toFixed(2);
  }

  distribuirRestante('tarjeta');
};

const handleTransferenciaChange = () => {
  const efectivoValue = parseFloat(facturaEfectivo.value) || 0;
  const tarjetaValue = parseFloat(facturaTarjeta.value) || 0;
  const transferenciaValue = parseFloat(facturaTransferencia.value) || 0;
  const totalValue = parseFloat(totalFactura.value) || 0;

  const nuevoTotal = efectivoValue + tarjetaValue + transferenciaValue;

  if (nuevoTotal > totalValue) {
    facturaTransferencia.value = (totalValue - efectivoValue - tarjetaValue).toFixed(2);
  } else {
    // Handle other fields without affecting the current input
    facturaEfectivo.value = (totalValue - tarjetaValue - transferenciaValue).toFixed(2);
  }

  distribuirRestante('transferencia');
};


/******************************************************/
const distribuirRestante = (campoModificado) => {
  const total = parseFloat(totalFactura.value);
  const campos = {
    efectivo: facturaEfectivo,
    tarjeta: facturaTarjeta,
    transferencia: facturaTransferencia
  };

  let sumOtrosCampos = 0;
  Object.keys(campos).forEach(campo => {
    if (campo !== campoModificado) {
      sumOtrosCampos += parseFloat(campos[campo].value) || 0;
    }
  });

  let restante = total - parseFloat(campos[campoModificado].value);
  if (restante < 0) {
    restante = 0;
  }

  const otrosCampos = Object.keys(campos).filter(campo => campo !== campoModificado);

  if (restante < sumOtrosCampos) {
    const nuevoValor = restante / otrosCampos.length;
    otrosCampos.forEach(campo => {
      if (campo !== campoModificado) {
        campos[campo].value = nuevoValor.toFixed(2);
      }
    });
  }
};


/******************************************************/
/*const cobrarFactura = async(factura)=>{
  numeroFactura.value = factura.no_factura
  visiblecobrar.value = true
  totalFactura.value = factura.total
  recibidoFactura.value = factura.total
  facturaEfectivo.value = factura.efectivo || 0.00
  facturaTarjeta.value = factura.tarjeta || 0.00
  facturaTransferencia.value = factura.transferencia || 0.00
}*/
const cobrarFactura = async (factura) => {
  numeroFactura.value = factura.no_factura;
  visiblecobrar.value = true;
  
  // Guarda el total original sin propina
  baseTotalFactura.value = parseFloat(factura.total);
  totalFactura.value = factura.total;
  recibidoFactura.value = factura.total;
  
  facturaEfectivo.value = factura.efectivo || '0.00';
  facturaTarjeta.value = factura.tarjeta || '0.00';
  facturaTransferencia.value = factura.transferencia || '0.00';
  
  // Inicializa la propina en 0
  propinaFactura.value = '0.00';
};

/******************************************************/
const fnDejaCambioPropina = async()=>{
  propinaFactura.value = devueltaFactura.value;
  await cobrandoFactura()
}

/******************************************************/
const fnProductos = (factura) => {
  // Parsear los productos desde la factura
  const productos = JSON.parse(factura.productos);

  // Extraer solo los nombres de los productos
  const nombresProductos = productos.map(producto => producto.nombre);

  // Crear el contenido para SweetAlert
  const contenido = nombresProductos.join('<br>');

  // Mostrar la modal con SweetAlert
  Swal.fire({
    title: 'Productos',
    html: contenido,
    icon: 'info',
    confirmButtonText: 'Cerrar'
  });
};

/******************************************************/
const prepararFacturaParaTicket = async (factura) => {
  if (!factura || typeof factura !== 'object') return factura;

  let numeroOrdenTurno = null;

  try {
    const cajaActual = await obtenerCajaActual();
    const fechaInicioTurno = cajaActual?.created_at || fechaDeInicioHoy.value;

    if (fechaInicioTurno) {
      const respuesta = await peticionesFetchOffline(
        'getRowsByTimestampRange',
        'facturas',
        'created_at',
        fechaInicioTurno,
        nfecha('timestamp')
      );
      const facturasTurno = Array.isArray(respuesta)
        ? respuesta
        : Array.isArray(respuesta?.data)
          ? respuesta.data
          : [];
      const almacenActual = String(datosEmpresaStore.empresa?.nombre || '').trim();
      const facturasOrdenadas = facturasTurno
        .filter(item => !almacenActual || String(item.almacen || '').trim() === almacenActual)
        .sort((a, b) => {
          const idA = Number(a.id);
          const idB = Number(b.id);
          if (Number.isFinite(idA) && Number.isFinite(idB) && idA !== idB) return idA - idB;
          return String(a.created_at || '').localeCompare(String(b.created_at || ''));
        });
      const idFactura = String(factura.id || '').trim();
      const numeroFactura = String(factura.no_factura || '').trim();
      const posicionFactura = facturasOrdenadas.findIndex(item =>
        (idFactura && String(item.id || '').trim() === idFactura) ||
        (numeroFactura && String(item.no_factura || '').trim() === numeroFactura)
      );

      numeroOrdenTurno = posicionFactura >= 0 ? posicionFactura + 1 : null;
    }
  } catch (error) {
    console.warn('No se pudo obtener la posición de la factura dentro del turno:', error);
  }

  return {
    ...factura,
    numero_orden_turno: numeroOrdenTurno
  };
};

/******************************************************/
const solicitarTipoImpresion = () => new Promise((resolve) => {
  resolverSeleccionImpresion = resolve;
  visibleSeleccionTipoImpresion.value = true;
});

const confirmarSeleccionImpresion = (tipo) => {
  const resolver = resolverSeleccionImpresion;
  resolverSeleccionImpresion = null;
  visibleSeleccionTipoImpresion.value = false;
  resolver?.(tipo);
};

const cancelarSeleccionImpresion = () => {
  const resolver = resolverSeleccionImpresion;
  resolverSeleccionImpresion = null;
  visibleSeleccionTipoImpresion.value = false;
  resolver?.(null);
};

/******************************************************/
const fnImprimirFactura = async(fact)=>{

 const datosFactura = await prepararFacturaParaTicket(fact);
    const arrayClientes = await peticionesFetchOffline('getDataAsArray', 'clientes');

if (datosFactura.metodo_pago === 'CREDITO') {
  const datosCredito = await peticionesFetchOffline('getDataByField', 'cuentas_cobrar', 'no_factura', datosFactura.no_factura)

  const tipoImpresion = await solicitarTipoImpresion();
  if (!tipoImpresion) return;

  if (tipoImpresion === 'ticket') {
    // Si elige TÉRMICA (confirmado)
  if(window.electron){
       const datosCliente = arrayClientes.find(cl=>cl.codigo === datosCredito.cod_cliente)
 
       const datosLocal = enviarDatosLocalStorage();
       datosLocal.empresa = datosEmpresa.empresa
       const datosEmpresa1 = JSON.stringify(datosLocal);
         const datosFacturapendientes = await peticionesFetchOffline('getDataByDoubleCondition', 'cuentas_cobrar','cod_cliente',datosCliente.codigo,'estatus','PENDIENTE');

       const envio = await window.electron.ipcRenderer.invoke('ticketCXC', JSON.stringify(datosFacturapendientes),JSON.stringify(datosCliente), datosEmpresa1);
   
 }


  } else {
    // Si elige TINTA (cancelado)

  if(window.electron){
           const datosCliente = arrayClientes.find(cl=>cl.codigo === datosCredito.cod_cliente)
       const datosLocal = enviarDatosLocalStorage();
       datosLocal.empresa = datosEmpresa.empresa
       const datosEmpresa1 = JSON.stringify(datosLocal);

         const datosFacturapendientes = await peticionesFetchOffline('getDataByDoubleCondition', 'cuentas_cobrar','cod_cliente',datosCliente.codigo,'estatus','PENDIENTE');
       const envio = await window.electron.ipcRenderer.invoke('creditoPDF', JSON.stringify(datosFacturapendientes),JSON.stringify(datosCliente), datosEmpresa1);
   
 }


  }
}else{

          var impresionpagina = link.value+'/vista/impresoratermica.php?factura='+datosFactura.no_factura;
         // window.electron.ipcRenderer.invoke('open-new-window', impresionpagina, 'url', true,false);

          const datosEmpresaA = JSON.stringify(enviarDatosLocalStorage())
         // window.electron.ipcRenderer.invoke('ticket',datosFactura.no_factura,datosEmpresaA);


  const tipoImpresion = await solicitarTipoImpresion();
  if (!tipoImpresion) return;

  if (tipoImpresion === 'ticket') {
    // Si elige TÉRMICA (confirmado)
      if(window.electron){
           const datosCliente = arrayClientes.find(cl=>cl.codigo === datosFactura.cod_cliente)
            const datosLocal = enviarDatosLocalStorage();
           datosLocal.empresa = datosEmpresa.empresa
           const datosEmpresa1 = JSON.stringify(datosLocal);
           const envio = await window.electron.ipcRenderer.invoke('ticket',JSON.stringify(datosFactura),JSON.stringify(datosCliente),datosEmpresa1);
     
     }

  } else {
    // Si elige TINTA (cancelado)

  if(window.electron){
      const datosCliente = arrayClientes.find(cl=>cl.codigo === datosFactura.cod_cliente)
       const datosLocal = enviarDatosLocalStorage();
       datosLocal.empresa = datosEmpresa.empresa
       const datosEmpresa1 = JSON.stringify(datosLocal);
       const envio = await window.electron.ipcRenderer.invoke('facturaPDF', JSON.stringify(datosFactura),JSON.stringify(datosCliente), datosEmpresa1,null);
   
 }


  }





    }


}
/******************************************************/
const calcularVuelto = () => {
  const recibido = parseFloat(recibidoFactura.value);
  const total = parseFloat(totalFactura.value);
  const propina = parseFloat(propinaFactura.value);
  const vuelto = recibido - total - propina;
  devueltaFactura.value = vuelto.toFixed(2);
};

/******************************************************/
const suCambioN = async(otroJSON)=>{
  otroJSON.cajero = usuarioLocal.value.nombre
otroJSON.token = usuarioLocal.value.token
otroJSON.pagocon = recibidoFactura.value
otroJSON.sucambio = devueltaFactura.value
otroJSON.propina = propinaFactura.value
return JSON.stringify([otroJSON])
}
/******************************************************/
const fnCobrarPorTarjeta = async()=>{

const datosFactura = facturasSinCobrar.value.find(factura=>factura.no_factura === numeroFactura.value);
datosFactura.metodo_pago = 'TARJETA'

datosFactura.estado_factura = 'Cobrado';

const otroJSON = JSON.parse(datosFactura.otro);
datosFactura.otro = await suCambioN(otroJSON[0]);

datosFactura.cajero = usuarioLocal.value.nombre
datosFactura.token = usuarioLocal.value.token

datosFactura.efectivo = 0.00;
datosFactura.transferencia = 0.00;
datosFactura.tarjeta = datosFactura.total;
datosFactura.updated_at = nfecha('timestamp');

const envio = await peticionesFetchOffline('updateData','facturas', JSON.stringify(datosFactura));

if (envio[0] == 'ok' ) {

       toast.add({ severity: 'success', summary: 'Correcta', detail: 'Factura ('+datosFactura.no_factura+') Actualizada correctamente', life: 3000 });

facturasSinCobrar.value = facturasSinCobrar.value.filter(factura => factura.no_factura !== datosFactura.no_factura);


       recibidoFactura.value = 0
       devueltaFactura.value = 0

        visiblecobrar.value = false
          const datosEmpresa = JSON.stringify(enviarDatosLocalStorage())
          const facturaTicket = await prepararFacturaParaTicket(datosFactura)
          await window.electron.ipcRenderer.invoke('ticket',JSON.stringify(facturaTicket),null,datosEmpresa)
       await fetchAndSetupData();
}


}
/******************************************************/
const fnCobrarPorTransferencia = async()=>{

const datosFactura = facturasSinCobrar.value.find(factura=>factura.no_factura === numeroFactura.value);
datosFactura.metodo_pago = 'TRANSFERENCIA'

datosFactura.estado_factura = 'Cobrado';

const otroJSON = JSON.parse(datosFactura.otro);
datosFactura.otro = await suCambioN(otroJSON[0]);

datosFactura.cajero = usuarioLocal.value.nombre
datosFactura.token = usuarioLocal.value.token

datosFactura.efectivo = '0.00';
datosFactura.transferencia = datosFactura.total;
datosFactura.tarjeta = '0.00';
datosFactura.updated_at = nfecha('timestamp');

const envio = await peticionesFetchOffline('updateData','facturas', JSON.stringify(datosFactura));


if (envio[0] == 'ok' ) {

       toast.add({ severity: 'success', summary: 'Correcta', detail: 'Factura ('+datosFactura.no_factura+') Actualizada correctamente', life: 3000 });

facturasSinCobrar.value = facturasSinCobrar.value.filter(factura => factura.no_factura !== datosFactura.no_factura);


       recibidoFactura.value = 0
       devueltaFactura.value = 0

        visiblecobrar.value = false
          const datosEmpresa = JSON.stringify(enviarDatosLocalStorage())
          const facturaTicket = await prepararFacturaParaTicket(datosFactura)
          await window.electron.ipcRenderer.invoke('ticket',JSON.stringify(facturaTicket),null,datosEmpresa)
       await fetchAndSetupData();
}


}
/******************************************************/
const cobrandoFactura = async()=>{
const datosFactura = facturasSinCobrar.value.find(factura=>factura.no_factura === numeroFactura.value);
datosFactura.estado_factura = 'Cobrado';

const otroJSON = JSON.parse(datosFactura.otro);
datosFactura.otro = await suCambioN(otroJSON[0]);

datosFactura.cajero = usuarioLocal.value.nombre
datosFactura.token = usuarioLocal.value.token

datosFactura.efectivo = facturaEfectivo.value;
datosFactura.transferencia = facturaTransferencia.value;
datosFactura.tarjeta = facturaTarjeta.value;
datosFactura.updated_at = nfecha('timestamp');

const envio = await peticionesFetchOffline('updateData','facturas', JSON.stringify(datosFactura));

if (envio[0] == 'ok' ) {
  visiblecobrar.value = false;
       toast.add({ severity: 'success', summary: 'Correcta', detail: 'Factura ('+datosFactura.no_factura+') Actualizada correctamente', life: 3000 });


facturasSinCobrar.value = facturasSinCobrar.value.filter(factura => factura.no_factura !== datosFactura.no_factura);

       await fetchAndSetupData();

       recibidoFactura.value = 0
       devueltaFactura.value = 0
       await fetchAndSetupDatosdelDia()


    await fnImprimirFactura(datosFactura)
    return




     if (datosConfiguracion.value.tipo_impresora == 'Impresora Ticket') {

    if (datosFactura.metodo_pago === 'CREDITO') {


       const datosCredito =  await peticionesFetchOffline('getDataByField', 'cuentas_cobrar','no_factura',numeroFactura.value);




       const impresionpagina = link.value+'/vista/cuentascobrartermica.php?factura=' + datosCredito.no_emision ;
      window.electron.ipcRenderer.invoke('open-new-window', impresionpagina, 'url',true,false);

    }else{

          var impresionpagina = link.value+'/vista/impresoratermica.php?factura='+numeroFactura.value;
          //window.electron.ipcRenderer.invoke('open-new-window', impresionpagina, 'url', true,false);
                    const datosEmpresa = JSON.stringify(enviarDatosLocalStorage())
          const facturaTicket = await prepararFacturaParaTicket(datosFactura)
          await window.electron.ipcRenderer.invoke('ticket',JSON.stringify(facturaTicket),null,datosEmpresa)

    }


     }else if(datosFactCoti.value.impresora == 'Offline'){
          var impresionpagina = link.value+'/receipt/ticket.php?factura='+numeroFactura.value;
          window.electron.ipcRenderer.invoke('open-new-window', impresionpagina,'url',false,true,false)
     } else{

    if (datosFactura.metodo_pago === 'CREDITO') {

       const datosCredito =  await peticionesFetchOffline('getDataByField', 'cuentas_cobrar','no_factura',datosFactura.no_factura);

       const impresionpagina = link.value+'/vista/cuentascobrartermica.php?factura=' + datosCredito.no_emision ;
      window.electron.ipcRenderer.invoke('open-new-window', impresionpagina, 'url',true,false);

    }else{

      var impresionpagina = link.value+'/receipt/factura.php?factura='+numeroFactura.value;
       window.electron.ipcRenderer.invoke('open-new-window', impresionpagina,'url',false,true,false)

    }




     }


}else{
         toast.add({ severity: 'error', summary: 'Upps', detail: 'Error al actualizar la Factura ('+datosFactura.no_factura+')', life: 3000 });
}
}
/******************************************************/
const eliminarFactura = async (noFactura,idFactura) => {
  const { value: password, isConfirmed } = await Swal.fire({
    title: 'TOKEN para borrar',
    input: 'password',
    inputPlaceholder: '*******',
    showCancelButton: true,
    confirmButtonText: 'Verificar y Borrar',
    cancelButtonText: 'Cancelar',
    inputValidator: (value) => {
      if (!value) {
        return '¡Necesitas ingresar un TOKEN!';
      }
    }
  });

  const tokenValido = password === tokenCorto.value || password === token.value || password === tokenSoloUso.value || password === token24H.value;

  if (!isConfirmed) {
    return;
  }

  if (tokenValido) {

   const envio = await peticionesFetchOffline('deleteEntry','facturas', idFactura);

if (envio[0] == 'ok' ) {
  visiblecobrar.value = false;
       toast.add({ severity: 'success', summary: 'Correcta', detail: 'Factura ('+noFactura+') Borrada correctamente', life: 3000 });
       facturasSinCobrar.value = facturasSinCobrar.value.filter(factura => factura.no_factura !== noFactura);
       await fetchAndSetupData();
      await actualizarTokenSoloUso();
      await fetchAndSetupDatosdelDia()

}else{
         toast.add({ severity: 'error', summary: 'Upps', detail: 'Error al borrar la Factura ('+noFactura+')', life: 3000 });
}


  } else {
      toast.add({ severity: 'error', summary: 'Error', detail: 'Error de TOKEN', life: 3000 });
  }
};

/******************************************************/
const enviarCorreo = async () => {
  try {
    if (!navigator.onLine) {
      toast.add({
        severity: "warn",
        summary: "Sin conexion",
        detail: "No hay internet. Se omite el envio de correo.",
        life: 4000,
      });
      return { ok: false, skipped: true, reason: 'offline' };
    }

    const datosCuadre = cuadre.value || {};
    const ventasArray = dataFacturas.value || [];
    const gastosArrayA = gastosArray.value || [];
    const tallerArrayA = tallerArray.value || [];
    const cxcArrayA = cxcArray.value || [];

    // Totales generales base (ventas)
    let ingreso_efectivo = ventasArray.reduce((a, f) => a + (parseFloat(f.efectivo) || 0), 0);
    let ingreso_tarjeta = ventasArray.reduce((a, f) => a + (parseFloat(f.tarjeta) || 0), 0);
    let ingreso_transferencia = ventasArray.reduce((a, f) => a + (parseFloat(f.transferencia) || 0), 0);
    let ingreso_total = ventasArray.reduce((a, f) => a + (parseFloat(f.total) || 0), 0);
    const egreso_total = gastosArrayA.reduce((a, g) => a + (parseFloat(g.cantidad) || 0), 0);

    // ================== 🔧 TALLER ==================
    const tallerPlano = Array.isArray(tallerArrayA)
      ? JSON.parse(JSON.stringify(tallerArrayA))
      : [];

    let totalEfectivoTaller = 0;
    let totalTarjetaTaller = 0;
    let totalTransferTaller = 0;

    const taller = tallerPlano.map((t) => {
      let totalAbonos = 0;
      let fallasTexto = "—";

      try {
        const abonos = JSON.parse(t.abono || "[]");
        abonos.forEach((ab) => {
          const monto = parseFloat(ab.abono || 0);
          const metodo = (ab.metodo_pago || "").toUpperCase();
          totalAbonos += monto;

          if (metodo === "EFECTIVO") totalEfectivoTaller += monto;
          else if (metodo === "TARJETA") totalTarjetaTaller += monto;
          else if (metodo === "TRANSFERENCIA") totalTransferTaller += monto;
        });
      } catch (err) {
        console.warn("⚠️ Error al parsear abonos:", err, t.abono);
      }

      try {
        const fallas = JSON.parse(t.fallas || "[]");
        fallasTexto = fallas.map((f) => f.propiedad).join(", ") || "—";
      } catch (err) {
        console.warn("⚠️ Error al parsear fallas:", err, t.fallas);
      }

      const pendiente = (parseFloat(t.total || 0) - totalAbonos).toFixed(2);

      return {
        nombre: t.nombre || "—",
        equipo: `${t.equipo || "—"} ${t.modelo || ""}`.trim(),
        fallas: fallasTexto,
        abonado: totalAbonos.toFixed(2),
        pendiente: pendiente,
      };
    });

    // 🔹 Sumar abonos del taller a los ingresos globales
    ingreso_efectivo += totalEfectivoTaller;
    ingreso_tarjeta += totalTarjetaTaller;
    ingreso_transferencia += totalTransferTaller;
    ingreso_total = ingreso_efectivo + ingreso_tarjeta + ingreso_transferencia;

// ================== 💳 CUENTAS POR COBRAR ==================
const cxcPlano = Array.isArray(cxcArrayA)
  ? JSON.parse(JSON.stringify(cxcArrayA))
  : [];

let totalEfectivoCxC = 0;
let totalTarjetaCxC = 0;
let totalTransferCxC = 0;

const cuentas_cobrar = cxcPlano.map((c) => {
  let totalPagos = 0;

  try {
    const pagos = JSON.parse(c.pagos || "[]");

    pagos.forEach((p) => {
      const monto = parseFloat(p.cantidad || 0);
      const metodo = (p.metodo || "").toUpperCase();

      totalPagos += monto;

      if (metodo === "EFECTIVO") totalEfectivoCxC += monto;
      else if (metodo === "TARJETA") totalTarjetaCxC += monto;
      else if (metodo === "TRANSFERENCIA") totalTransferCxC += monto;
    });
  } catch (err) {
    console.warn("⚠️ Error al parsear pagos de cuenta por cobrar:", err, c.pagos);
  }

  // 🔹 Pendiente es el campo saldo directamente
  const pendiente = parseFloat(c.saldo || 0).toFixed(2);

  return {
    concepto: c.nombre_cliente || c.cliente || "Cliente",
    fecha: c.fecha_emision || c.fecha || "",
    hora: c.hora || (c.created_at ? c.created_at.split(" ")[1] : ""),
    usuario: datosEmpresa.usuario?.nombre || "Cajero",
    tipo: "Ingreso",
    tipo_pago: "Crédito",
    total_pagado: totalPagos.toFixed(2),
    pendiente,
  };
});

// 🔹 Agregar totales de CxC a los ingresos globales
ingreso_efectivo += totalEfectivoCxC;
ingreso_tarjeta += totalTarjetaCxC;
ingreso_transferencia += totalTransferCxC;

// 🔹 Recalcular ingreso total
ingreso_total = ingreso_efectivo + ingreso_tarjeta + ingreso_transferencia;


    // Recalcular ingreso total final
    ingreso_total = ingreso_efectivo + ingreso_tarjeta + ingreso_transferencia;

 // ================== 📄 VENTAS ==================
    const ventas = ventasArray.map((f) => {
      let nombresProductos = 'Venta de Producto';

      try {
        // Si el campo viene como string, lo parseamos
        const lista = typeof f.productos === 'string'
          ? JSON.parse(f.productos || '[]')
          : Array.isArray(f.productos)
            ? f.productos
            : [];

        // Si hay productos válidos, concatenamos los nombres
        if (lista.length > 0) {
          nombresProductos = lista
            .map(p => p.nombre || p.producto || '—')
            .join(', ');
        }
      } catch (err) {
        console.warn('⚠️ Error al parsear productos en venta', f.id || f, err);
      }

      return {
        concepto: nombresProductos,
        fecha: f.fecha_emision,
        hora: f.hora || "",
        cliente: f.nombre_cliente || "AL CONTADO",
        tipo: "Ingreso",
        tipo_pago: f.metodo_pago || "N/D",
        total: f.total,
      };
    });

    // ================== 💸 GASTOS (restar por método) ==================
    let totalEfectivoGasto = 0;
    let totalTarjetaGasto = 0;
    let totalTransferGasto = 0;

    const gastos = gastosArrayA.map((g) => {
      const monto = parseFloat(g.cantidad || 0);
      const metodo = (g.metodo || "").toUpperCase();

      if (metodo === "EFECTIVO") totalEfectivoGasto += monto;
      else if (metodo === "TARJETA") totalTarjetaGasto += monto;
      else if (metodo === "TRANSFERENCIA") totalTransferGasto += monto;

      return {
        concepto: g.descripcion || "Gasto",
        fecha: g.fecha || "",
        hora: g.hora || "",
        usuario: datosEmpresa.usuario?.nombre || "Cajero",
        tipo: "Egreso",
        tipo_pago: metodo || "N/D",
        total: monto.toFixed(2),
      };
    });

    // 🔹 Restar los gastos según método del total global
    ingreso_efectivo -= totalEfectivoGasto;
    ingreso_tarjeta -= totalTarjetaGasto;
    ingreso_transferencia -= totalTransferGasto;

    // 🔹 Recalcular totales finales después de restar gastos
    ingreso_total = ingreso_efectivo + ingreso_tarjeta + ingreso_transferencia;


    // ================== 📋 TOTALES ==================
    const totales = {
      ingreso_total: `RD$ ${ingreso_total.toFixed(2)}`,
      egreso_total: `RD$ ${egreso_total.toFixed(2)}`,
      ingreso_efectivo: `RD$ ${ingreso_efectivo.toFixed(2)}`,
      ingreso_tarjeta: `RD$ ${ingreso_tarjeta.toFixed(2)}`,
      ingreso_transferencia: `RD$ ${ingreso_transferencia.toFixed(2)}`,
    };

    // ================== 🧾 ENCABEZADO ==================
    const header = {
      empresa: datosEmpresa.empresa?.nombre || "TM POS SRL",
      fecha_inicio: datosCuadre.fecha_inicio || "",
      fecha_final: new Date().toLocaleString(),
      usuario: datosEmpresa.usuario?.nombre || "",
      observacion: datosCuadre.observacion || "",
      efectivo_inicial: `RD$ ${parseFloat(datosCuadre.cant_inicio || 0).toFixed(2)}`,
      efectivo_final: `RD$ ${parseFloat(totalModal.value || 0).toFixed(2)}`,
    };

    // ================== 🧠 GENERAR HTML ==================
    const html = generarHTMLReporteCaja(header, totales, ventas, gastos, cuentas_cobrar, taller);
    const datoscorreo = await peticionesFetchOffline('getDataByField', 'configuracion_correo','id',1);
    //console.log("datoscorreo", datoscorreo);

    if (!datoscorreo?.email || !datoscorreo?.password) {
      console.warn("La configuración de correo está incompleta");
      toast.add({
        severity: "warn",
        summary: "Sin configuración",
        detail: "El correo o la contraseña no están configurados. El cuadre continuará sin enviar correo.",
        life: 5000,
      });
      return { ok: false, skipped: true, reason: 'sin-configuracion' };
    }

    if (!window.electron) {
      console.warn("window.electron no disponible");
      toast.add({
        severity: "warn",
        summary: "No disponible",
        detail: "El envío de correo solo funciona en la aplicación de escritorio.",
        life: 5000,
      });
      return { ok: false, skipped: true, reason: 'no-electron' };
    }

    // ================== 📧 CONFIGURACIÓN DEL CORREO ==================
    const envioCorreo = {
      mailto: datosEmpresa.empresa?.email || "gerencia@miempresa.com",
      subjet: `📊 Corte de Caja - ${header.empresa} (${header.usuario}) - ${new Date().toLocaleDateString()}`,
      mensaje: "Adjunto el resumen completo del corte de caja del día.",
      albody: html,
      correo: datoscorreo,
      empresa: header.empresa,
    };

    console.log("Enviando correo con config:", JSON.stringify({ mailto: envioCorreo.mailto, correoHost: datoscorreo.host || datoscorreo.servidor }));

    // ================== ✉️ ENVIAR ==================
    const resultado = await window.electron.ipcRenderer.invoke("enviarCorreo", envioCorreo);
    console.log("Resultado envío correo:", resultado);

    if (resultado?.ok) {
      toast.add({
        severity: "success",
        summary: "Correo enviado",
        detail: "El reporte del cuadre fue enviado correctamente.",
        life: 3000,
      });
      return { ok: true };
    } else {
      const rawError = String(resultado?.error || "");
      const timeoutError = rawError.includes("ETIMEDOUT") || rawError.includes("connect timeout");
      toast.add({
        severity: timeoutError ? "warn" : "error",
        summary: timeoutError ? "Tiempo de espera agotado" : "Error",
        detail: timeoutError
          ? "No se pudo conectar al servidor SMTP. Verifica host, puerto y conexion a internet."
          : `No se pudo enviar el correo: ${rawError || 'Error desconocido'}`,
        life: 6000,
      });
      return { ok: false, error: rawError || 'Error desconocido' };
    }
  } catch (err) {
    const errorMsg = String(err?.message || err || 'Error desconocido');
    const timeoutError = errorMsg.includes("ETIMEDOUT") || errorMsg.includes("connect timeout");
    console.warn("Error enviando correo:", err);
    toast.add({
      severity: timeoutError ? "warn" : "error",
      summary: timeoutError ? "Tiempo de espera agotado" : "Error",
      detail: timeoutError
        ? "No se pudo conectar al servidor SMTP. Verifica host, puerto y conexion a internet."
        : `No se pudo enviar el correo: ${errorMsg}`,
      life: 6000,
    });
    return { ok: false, error: errorMsg };
  }
};

/******************************************************/
const imprimirCuadre = async(imprimir = true)=>{
  try {
  visibleCuadre.value = false
  cuadrarCaja.value = false
  loadingMessage.value = 'Preparando cuadre...'
  loading.value = true

  const fechaTimeStamp =  transformarFechaTimestamp(nfecha('fecha'),false);

  const impresionpagina = `${link.value}/vista/impresorareporte.php?fecha=${usuarioLocal.value.hora_inicio}AND${nfecha('timestamp')}&usuario=${usuarioLocal.value.email}`;

const fechas = nfecha('timestampcompleta');
const datosLocal = enviarDatosLocalStorage()

  const datosEmpresaA = JSON.stringify(enviarDatosLocalStorage() )
  const datosUsuarioLocal = JSON.parse(window.localStorage.getItem('usuarioLocal')) 
  const datosFechaHoy = nfecha('timestampcompleta');
const fechaInicioN = fechaDeInicioHoy.value;
const fechaFinN = datosFechaHoy.fechafin;


loadingMessage.value = 'Calculando ventas...'
const response = await peticionesFetchOffline('datosVentasPorRango', fechaInicioN,fechaFinN);


const laFechaInicio = fechas.fechainicio;
const laFechaFin = fechas.fechafin;

    const jsonData = response || {};
    const asArray = (value) => (Array.isArray(value) ? value : []);
    if (usuarioEsCajero()) {
      await actualizarCantidadFacturasTurno();
      const cajaActualCuadre = await obtenerCajaActual();
      const turnoCuadre = datosEmpresaStore.usuario?.token || usuarioLocal.value?.token || '';
      const [cuentasCobrarCompletas, tallerCompleto] = await Promise.all([
        peticionesFetchOffline('getDataAsArray', 'cuentas_cobrar'),
        peticionesFetchOffline('getDataAsArray', 'taller')
      ]);
      const esDelTurno = registro => String(registro?.turno || registro?.token || '').trim() === String(turnoCuadre).trim();
      const esPagoDelTurno = pago => {
        const turnoPago = String(pago?.turno || pago?.token || '').trim();
        if (turnoPago && turnoPago !== '280420241514073') {
          return turnoPago === String(turnoCuadre).trim();
        }
        const fechaPago = pago?.timestamp || convertirAFechaTimestamp(pago?.fecha, pago?.hora);
        return esFechaEnRango(
          fechaPago,
          cajaActualCuadre?.created_at || fechaInicioN,
          fechaFinN
        );
      };
      const filtrarPagosTurno = (registros, campo) => asArray(registros).map(registro => {
        const copia = { ...registro };
        try {
          const pagos = Array.isArray(registro?.[campo])
            ? registro[campo]
            : JSON.parse(registro?.[campo] || '[]');
          copia[campo] = JSON.stringify(pagos.filter(esPagoDelTurno));
        } catch (error) {
          copia[campo] = '[]';
        }
        return copia;
      });

      jsonData.facturas = [...facturasDelTurnoActual.value];
      jsonData.gastos = asArray(jsonData.gastos).filter(esDelTurno);
      jsonData.entradas = asArray(jsonData.entradas).filter(esDelTurno);
      jsonData.devoluciones = asArray(jsonData.devoluciones).filter(esDelTurno);
      jsonData.cuentas_cobrar = filtrarPagosTurno(
        Array.isArray(cuentasCobrarCompletas) ? cuentasCobrarCompletas : jsonData.cuentas_cobrar,
        'pagos'
      );
      jsonData.taller = filtrarPagosTurno(
        Array.isArray(tallerCompleto) ? tallerCompleto : jsonData.taller,
        'abono'
      );
      jsonData.registrocaja = cajaActualCuadre ? [cajaActualCuadre] : [];
      jsonData.cuadres = cajaActualCuadre ? [cajaActualCuadre] : [];
    }
    datosDelDiaArray.value = response;

   let facturasFiltradas = asArray(jsonData['facturas'])

datosDelDia.value.efectivo = 0


const totalVentas = facturasFiltradas
  .map(factura => Number(factura.total)) 
  .reduce((acc, total) => acc + total, 0) || 0;

const totalGanancias = facturasFiltradas
  .map(factura => Number(factura.ganancia)) 
  .reduce((acc, total) => acc + total, 0) || 0;

const totalImpuestos = facturasFiltradas
  .map(factura => Number(factura.impuesto)) 
  .reduce((acc, total) => acc + total, 0) || 0;

const datosGastos = asArray(jsonData['gastos'])

const totalGastos = datosGastos
  .map(factura => Number(factura.cantidad)) 
  .reduce((acc, total) => acc + total, 0) || 0;

const totalDevoluciones = asArray(jsonData['devoluciones'])
  .map(factura => Number(factura.cantidad)) 
  .reduce((acc, total) => acc + total, 0) || 0;


   datosDelDia.value.venta = totalVentas;
   datosDelDia.value.ganancia = totalGanancias;
   datosDelDia.value.impuestos = totalImpuestos;
   datosDelDia.value.gastos = totalGastos;
   datosDelDia.value.devoluciones = totalDevoluciones;


   datosDelDia.value.efectivo = facturasFiltradas
  .map(factura => Number(factura.efectivo)) 
  .reduce((acc, total) => acc + total, 0);


   datosDelDia.value.tarjeta = facturasFiltradas
  .map(factura => Number(factura.tarjeta)) 
  .reduce((acc, total) => acc + total, 0);

   datosDelDia.value.transferencia = facturasFiltradas
  .map(factura => Number(factura.transferencia)) 
  .reduce((acc, total) => acc + total, 0);
/******************************************************************/
const registroCaja = asArray(jsonData['registrocaja'])

  datosDelDia.value.inicioCaja = registroCaja
  .map(factura => Number(factura.cant_inicio || factura.cantidad_inicio))
  .reduce((acc, total) => acc + total, 0) || 0;


    datosDelDia.value.abono = asArray(jsonData['cuentas_cobrar'])
  .map(factura => {
    let totalAbono = 0;
    let abonos = [];

    try {
        abonos = JSON.parse(factura.pagos);
    } catch (error) {
        console.error('Error al parsear abonos:', error);
        return 0; 
    }

    for (let pago of abonos) {
        const fechaBuscar = pago.timestamp || convertirAFechaTimestamp(pago.fecha, pago.hora);
        const estaFecha = esFechaEnRango(fechaBuscar, laFechaInicio, laFechaFin);
        if (estaFecha) {
            totalAbono += Number(pago.cantidad); 
            if (pago.metodo === 'EFECTIVO') {
               datosDelDia.value.efectivo += Number(pago.cantidad);

            }else if(pago.metodo === 'TARJETA'){
              datosDelDia.value.tarjeta += Number(pago.cantidad);

            }else if (pago.metodo === 'TRANSFERENCIA'){
              datosDelDia.value.transferencia += Number(pago.cantidad);

            }else{
               //datosDelDia.value.efectivo += Number(pago.cantidad);
            }

        }
    }

    return totalAbono; 
  })
  .reduce((acc, total) => acc + total, 0) || 0; 

/*************************************************************/
datosDelDia.value.taller = asArray(jsonData['taller'])
  .map(factura => {
    let totalAbono = 0;
    let abonos = [];

    try {
        abonos = JSON.parse(factura.abono);
    } catch (error) {
        console.error('Error al parsear abonos:', error);
        return 0; 
    }

    for (let abono of abonos) {
        const fechaBuscar = abono.timestamp || abono.created_at || convertirAFechaTimestamp(abono.fecha, abono.hora);
        const estaFecha = esFechaEnRango(fechaBuscar, laFechaInicio, laFechaFin);
        if (estaFecha) {
  


            totalAbono += Number(abono.abono); 
            if (abono.metodo_pago === 'EFECTIVO') {
               datosDelDia.value.efectivo += Number(abono.abono);

            }else if(abono.metodo_pago === 'TARJETA'){
              datosDelDia.value.tarjeta += Number(abono.abono);

            }else{
              datosDelDia.value.transferencia += Number(abono.abono);

            }




        }
    }

    return totalAbono; 
  })
  .reduce((acc, total) => acc + total, 0) || 0; 

/*************************************************************/
if (!totalModal.value) {
  loading.value = false
  loadingMessage.value = ''
  toast.add({ severity: 'error', summary: 'Error', detail: 'Debe hacer el conteo del dinero', life: 3000 });
  return;
}

await fetchCxC();

  const peticionDatos = {
    fechainicio:cuadre.value.fechainicio,
    horainicio:cuadre.value.horainicio,
    horafin:nfecha('horaAmericana'),
    fechafin:cuadre.value.fechafin,
    fondoinicial:datosDelDia.value.inicioCaja,
    taller:datosDelDia.value.taller,
    efectivo:datosDelDia.value.efectivo,
    transferencia:datosDelDia.value.transferencia,
    tarjeta:datosDelDia.value.tarjeta,
    gastos:datosDelDia.value.gastos,
    abono:datosDelDia.value.abono,
    ganancia:datosDelDia.value.ganancia,
    totalvendido:datosDelDia.value.venta,
    cuentasxcobrar:datosDelDia.value.cuentasXcobrar,
    devoluciones:datosDelDia.value.devoluciones,
    totalcontado:Number(totalModal.value),
    token:datosUsuarioLocal[0].token,
    impuestos:datosDelDia.value.impuestos,
    usuario:datosEmpresaStore.usuario
  }

  const totalContado = Number(totalModal.value)

  datosDelDiaArray.value.peticion = peticionDatos


  const nDatosEmpresa = JSON.parse(datosEmpresaA)

const monedero = {
  '1': Number(pesos.value) || 0,
  '5': Number(cincopesos.value) || 0,
  '10': Number(diezpesos.value) || 0,
  '25': Number(veinticincopesos.value) || 0,
  '50': Number(cincuentapesos.value) || 0,
  '100': Number(cienpesos.value) || 0,
  '200': Number(docientospesos.value) || 0,
  '500': Number(quinientoscopesos.value) || 0,
  '1000': Number(milpesos.value) || 0,
  '2000': Number(dosmilpesos.value) || 0
};

// 🔹 Filtrar solo los valores > 0
const monederoFiltrado = Object.fromEntries(
  Object.entries(monedero).filter(([_, cantidad]) => cantidad > 0)
);

// Asignar solo las denominaciones con dinero
nDatosEmpresa.monedero = monederoFiltrado;
  const datosCajaImpresion = {
    facturas: facturasFiltradas,
    gastos: asArray(jsonData.gastos),
    entradas: asArray(jsonData.entradas),
    devoluciones: asArray(jsonData.devoluciones),
    cuentas_cobrar: asArray(jsonData.cuentas_cobrar),
    taller: asArray(jsonData.taller),
    registrocaja: asArray(jsonData.registrocaja),
    cuadres: asArray(jsonData.cuadres).length > 0
      ? asArray(jsonData.cuadres)
      : asArray(jsonData.registrocaja)
  };
  datosEnvio.value = JSON.parse(JSON.stringify(datosCajaImpresion));
  nDatosEmpresa.datoscaja = datosCajaImpresion
  nDatosEmpresa.usuario = datosEmpresaStore.usuario

  if(imprimir){
loadingMessage.value = 'Generando impresión...'
const timestampInicio = convertirAFechaTimestamp(cuadre.value.fechainicio, cuadre.value.horainicio);
const timestampFin = convertirAFechaTimestamp(cuadre.value.fechafin, cuadre.value.horafin);
 

  const fechasEnviar = {
    fechainicio:fechaDeInicioHoy.value,
    fechafin:nfecha('timestamp'),
    cantidadInicio:contidadInicioCaja.value
  }

    let  enviarFecha = JSON.stringify(fechasEnviar)
          console.log("nDatosEmpresa", nDatosEmpresa);

          if (!window.electron?.ipcRenderer) {
            throw new Error('La impresión del cuadre solo está disponible en la aplicación de escritorio.');
          }
          const resultadoImpresion = await window.electron.ipcRenderer.invoke(
          'imprimirCuadreCompleto',
          totalContado,
          JSON.stringify(nDatosEmpresa),
          false,  // silent = false → no imprime directo
          true,   // visible = true → muestra la ventana
          true,   // ventana = true → habilita preview
          enviarFecha
        )
          if (!resultadoImpresion?.ok) {
            throw new Error(resultadoImpresion?.error || 'No se pudo generar la impresión del cuadre.');
          }



//return
      // 🔹 Marcar cuadre como cerrado
      const datosCuadre = cuadre.value;
         await enviarCorreo()

      if (!datosCuadre || !datosCuadre.id) {
        loading.value = false
        loadingMessage.value = ''
        toast.add({ severity: 'warn', summary: 'Aviso', detail: 'No hay un registro de caja abierto para este cajero.', life: 3000 });
        router.push('/login');
        return;
      }

      delete datosCuadre.fechainicio
      delete datosCuadre.fechafin
      delete datosCuadre.usuario
      delete datosCuadre.turnos
      delete datosCuadre.horainicio
      delete datosCuadre.horafin
      datosCuadre.estado = 'CERRADO';
      //datosCuadre.fecha_fin = nfecha('timestamp');
      datosCuadre.hora_cierre = nfecha('hora');
      datosCuadre.efectivo = parseFloat(totalContado).toFixed(2);
      if (datosCuadre.hasOwnProperty('created_at')) {
        datosCuadre.updated_at = nfecha('timestamp');
      }

      loadingMessage.value = 'Enviando correo...'
     // const correo = await enviarCorreo()

      loadingMessage.value = 'Guardando cuadre...'
      const datosEnviar = JSON.parse(JSON.stringify(datosCuadre));
      const envioDatos = await peticionesFetchOffline('updateData', 'registrocaja', JSON.stringify(datosEnviar));

      loading.value = false
      loadingMessage.value = ''

      if (envioDatos && envioDatos[0] === 'ok') {
        toast.add({ severity: 'success', summary: 'Éxito', detail: 'Corte realizado correctamente.', life: 3000 });

      //aqui va el corte de caja enviado al correo

        router.push('/login');
      } else {
        toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo actualizar el estado del cuadre.', life: 3000 });
      }




  }

   //window.electron.ipcRenderer.invoke('open-new-window', impresionpagina,'url',true,false)
  } catch (error) {
    console.error('Error al imprimir el cuadre:', error);
    toast.add({
      severity: 'error',
      summary: 'No se pudo imprimir el cuadre',
      detail: error?.message || 'Ocurrió un error preparando la impresión.',
      life: 6000
    });
  } finally {
    loading.value = false;
    loadingMessage.value = '';
  }
}
/******************************************************/
const imprimirUltimoGasto = async ()=>{
const ultimoRegistro = await peticionesFetchOffline('getLastXRows', 'gastos',1);
  if (ultimoRegistro) {
/*    const impresionpagina = `${link.value}/vista/gastosTermica.php?id=${ultimoRegistro[0].id}`;
      window.electron.ipcRenderer.invoke('open-new-window', impresionpagina,'url',true,false)*/

        const datosEnviar = JSON.stringify(ultimoRegistro[0])
        const datosEmpresaLoL = JSON.stringify(enviarDatosLocalStorage() )
        window.electron.ipcRenderer.invoke('gasto',datosEnviar,datosEmpresaLoL);
      
  }else{
    toast.add({ severity: 'error', summary: 'Error', detail: 'Error de Peticion.', life: 3000 });
  }

}
/******************************************************/
const imprimirUltimaEntrada = async ()=>{
  const ultimoRegistro = await peticionesFetchOffline('getLastXRows', 'entradas',1);
  if (ultimoRegistro) {
    const impresionpagina = `${link.value}/vista/entradastermica.php?id=${ultimoRegistro[0].id}`;
      window.electron.ipcRenderer.invoke('open-new-window', impresionpagina,'url',true,false)
  }else{
    toast.add({ severity: 'error', summary: 'Error', detail: 'Error de Peticion.', life: 3000 });
  }

}
/******************************************************/
const fetchBanco = async () => {
  try {
    const verificaLocalStorage = JSON.parse(window.localStorage.getItem('bancos')) || [];

    if (verificaLocalStorage.length > 0) {
      bancoArray.value = verificaLocalStorage;
      cuentaBancaria.value = verificaLocalStorage[verificaLocalStorage.length - 1];
      return;
    }

    const response = await peticionesFetchOffline('getDataAsArray', 'banco');
    const columnas = await peticionesFetchOffline('getTableColumns', 'banco');
    if (!columnas.includes('almacen')) {
      await peticionesFetchOffline('addColumnToTable', { tabla: 'banco', campo: 'almacen' });
      await peticionesFetchOffline('updateEntireColumn', 'banco', 'almacen', datosEmpresa.empresa.nombre);
    }

    bancoArray.value = response || [];
    cuentaBancaria.value = bancoArray.value[bancoArray.value.length - 1] || null;
    window.localStorage.setItem('bancos', JSON.stringify(bancoArray.value));
  } catch (error) {
    console.error('Error fetching banks', error);
    toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar los bancos', life: 3000 });
  }
}
/******************************************************/
const registrarRetiroBancoGasto = async () => {
  if (camposGastos.value.metodo !== 'TRANSFERENCIA') {
    return true;
  }

  if (!cuentaBancaria.value?.id) {
    toast.add({ severity: 'error', summary: 'Error', detail: 'Debe seleccionar un banco', life: 3000 });
    return false;
  }

  const banco = bancoArray.value.find(b => b.id == cuentaBancaria.value.id);
  if (!banco) {
    toast.add({ severity: 'error', summary: 'Error', detail: 'Banco no encontrado', life: 3000 });
    return false;
  }

  const saldoAnterior = Number(banco.saldo || 0);
  const nuevoSaldo = saldoAnterior - Number(camposGastos.value.cantidad || 0);
  const datosBanco = { ...banco, saldo: nuevoSaldo, updated_at: nfecha('timestamp') };
  const envioDatosBanco = await peticionesFetchOffline('updateData', 'banco', JSON.stringify(datosBanco));

  if (envioDatosBanco[0] !== 'ok') {
    toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo actualizar el saldo del banco', life: 3000 });
    return false;
  }

  const camposTransaccion = await arrayToObjetoFromTablaOffline('transaccionesbancarias');
  camposTransaccion.tipo = 'RETIRO';
  camposTransaccion.metodo = 'TRANSFERENCIA';
  camposTransaccion.cuenta_origen = banco.cuenta;
  camposTransaccion.cuenta_destino = '';
  camposTransaccion.monto = Number(camposGastos.value.cantidad || 0).toFixed(2);
  camposTransaccion.balance_anterior = saldoAnterior.toFixed(2);
  camposTransaccion.balance_actual = nuevoSaldo.toFixed(2);
  camposTransaccion.descripcion = `GASTO POR TRANSFERENCIA: ${camposGastos.value.descripcion || 'SIN DESCRIPCION'}`;
  camposTransaccion.depositante = '';
  camposTransaccion.beneficiario = datosEmpresa.empresa.nombre;
  camposTransaccion.fecha = nfecha('fecha');
  camposTransaccion.hora = nfecha('hora');
  camposTransaccion.estado = 'COMPLETADA';
  camposTransaccion.usuario = usuarioLocal.value?.usuario || usuarioLocal.value?.nombre || '';
  if (camposTransaccion.hasOwnProperty('created_at')) {
    camposTransaccion.created_at = nfecha('timestamp');
    camposTransaccion.updated_at = nfecha('timestamp');
  }

  const envioTransaccion = await peticionesFetchOffline('insertData', 'transaccionesbancarias', JSON.stringify(camposTransaccion));
  if (envioTransaccion[0] !== 'ok') {
    toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo registrar la transacción bancaria', life: 3000 });
    return false;
  }

  await fetchBanco();
  return true;
}
/******************************************************/
const registrarEntradaBancoTaller = async (monto, descripcion = '', metodoPago = null) => {
  const metodoTaller = String(metodoPago || facturaTallerSeleccionada.value?.metodopago || '').toUpperCase();
  if (metodoTaller !== 'TRANSFERENCIA') {
    return true;
  }

  if (!cuentaBancaria.value?.id) {
    toast.add({ severity: 'error', summary: 'Error', detail: 'Debe seleccionar un banco', life: 3000 });
    return false;
  }

  const banco = bancoArray.value.find(b => b.id == cuentaBancaria.value.id);
  if (!banco) {
    toast.add({ severity: 'error', summary: 'Error', detail: 'Banco no encontrado', life: 3000 });
    return false;
  }

  const saldoAnterior = Number(banco.saldo || 0);
  const nuevoSaldo = saldoAnterior + Number(monto || 0);
  const datosBanco = { ...banco, saldo: nuevoSaldo, updated_at: nfecha('timestamp') };
  const envioDatosBanco = await peticionesFetchOffline('updateData', 'banco', JSON.stringify(datosBanco));

  if (envioDatosBanco[0] !== 'ok') {
    toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo actualizar el saldo del banco', life: 3000 });
    return false;
  }

  const camposTransaccion = await arrayToObjetoFromTablaOffline('transaccionesbancarias');
  camposTransaccion.tipo = 'TRANSFERENCIA';
  camposTransaccion.metodo = 'TRANSFERENCIA';
  camposTransaccion.cuenta_origen = `TALLER (${facturaTallerSeleccionada.value?.no_factura || ''})`;
  camposTransaccion.cuenta_destino = banco.cuenta;
  camposTransaccion.monto = Number(monto || 0).toFixed(2);
  camposTransaccion.balance_anterior = saldoAnterior.toFixed(2);
  camposTransaccion.balance_actual = nuevoSaldo.toFixed(2);
  camposTransaccion.descripcion = descripcion || `COBRO TALLER POR TRANSFERENCIA (${facturaTallerSeleccionada.value?.no_factura || ''})`;
  camposTransaccion.depositante = facturaTallerSeleccionada.value?.nombre || '';
  camposTransaccion.beneficiario = datosEmpresa.empresa.nombre;
  camposTransaccion.fecha = nfecha('fecha');
  camposTransaccion.hora = nfecha('hora');
  camposTransaccion.estado = 'COMPLETADA';
  camposTransaccion.usuario = usuarioLocal.value?.usuario || usuarioLocal.value?.nombre || '';
  if (camposTransaccion.hasOwnProperty('created_at')) {
    camposTransaccion.created_at = nfecha('timestamp');
    camposTransaccion.updated_at = nfecha('timestamp');
  }

  const envioTransaccion = await peticionesFetchOffline('insertData', 'transaccionesbancarias', JSON.stringify(camposTransaccion));
  if (envioTransaccion[0] !== 'ok') {
    toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo registrar la transacción bancaria', life: 3000 });
    return false;
  }

  await fetchBanco();
  return true;
}
/******************************************************/
const agregarGasto = async()=>{
  if (guardandoGasto.value) {
    return;
  }

  guardandoGasto.value = true;

  try {
  const datosUsuarioLocal = JSON.parse(window.localStorage.getItem('usuarioLocal')) 
  const url = link.value+api.value+"/insertar/gastos";
  if (!camposGastos.value) {
    toast.add({ severity: 'error', summary: 'Error', detail: 'Datos incompletos, no se puede Enviar.', life: 3000 });
    return;
  }
  if (camposGastos.value.metodo === 'TRANSFERENCIA' && !cuentaBancaria.value?.id) {
    toast.add({ severity: 'error', summary: 'Error', detail: 'Debe seleccionar un banco', life: 3000 });
    return;
  }

  if (camposGastos.value.hasOwnProperty('created_at')) {
     camposGastos.value.created_at = nfecha('timestamp')
     camposGastos.value.updated_at = nfecha('timestamp')
    }

  camposGastos.value.cajero = datosUsuarioLocal[0].email
  camposGastos.value.usuario = datosUsuarioLocal[0].email
  camposGastos.value.almacen = datosEmpresa.empresa.nombre


  const envioDatos = await peticionesFetchOffline('insertData','gastos', JSON.stringify(camposGastos.value));

  if (envioDatos[0] == 'ok') {
     const bancoOk = await registrarRetiroBancoGasto();
     if (!bancoOk) {
      return;
     }

     toast.add({ severity: 'success', summary: 'Éxito', detail: 'Gasto Agregado con éxito.', life: 3000 });

   await asientoDiario(link.value,api.value,tokenCifrado.value,toast,'GASTOS','EFECTIVO EN CAJA',camposGastos.value.cantidad,'REGISTRO DE GASTO POR ('+camposGastos.value.cantidad+') '+camposGastos.value.descripcion);

   await imprimirUltimoGasto()
   camposGastos.value = await arrayToObjetoFromTabla('gastos');
   await fetchAndSetupDatosdelDia()
  }else{
    toast.add({ severity: 'error', summary: 'Error', detail: 'Fallo al Agregar el Gasto.', life: 3000 });
  }
  } finally {
    guardandoGasto.value = false;
  }

}
/******************************************************/
const cargarFacturasTurnoImpresion = async () => {
  cargandoFacturasTurno.value = true;
  facturasFiltradasImprimir.value = [];

  try {
    const cajaActual = await obtenerCajaActual();
    const fechaInicioTurno = cajaActual?.created_at || fechaDeInicioHoy.value;

    if (!cajaActual || !fechaInicioTurno) {
      toast.add({
        severity: 'warn',
        summary: 'Turno no disponible',
        detail: 'No se encontró una caja abierta para consultar sus facturas.',
        life: 3500
      });
      return;
    }

    const response = await peticionesFetchOffline(
      'getRowsByTimestampRange',
      'facturas',
      'created_at',
      fechaInicioTurno,
      nfecha('timestamp')
    );
    const facturasRango = Array.isArray(response)
      ? response
      : Array.isArray(response?.data)
        ? response.data
        : [];
    const normalizar = valor => String(valor || '').trim().toLowerCase();
    const almacenActual = normalizar(datosEmpresaStore.empresa?.nombre);
    const facturasAlmacen = facturasRango.filter(
      factura => !almacenActual || normalizar(factura.almacen) === almacenActual
    );
    const turnoActual = normalizar(cajaActual.turno);
    const facturasMismoTurno = turnoActual
      ? facturasAlmacen.filter(factura => normalizar(factura.token) === turnoActual)
      : [];

    // Los registros antiguos pueden no tener el token de caja. En ese caso,
    // el rango entre apertura y hora actual sigue representando el turno.
    facturasFiltradasImprimir.value = (
      facturasMismoTurno.length > 0 ? facturasMismoTurno : facturasAlmacen
    ).sort((a, b) => Number(b.id || 0) - Number(a.id || 0));
  } catch (error) {
    console.error('Error al cargar las facturas del turno:', error);
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'No se pudieron cargar las facturas del turno actual.',
      life: 3500
    });
  } finally {
    cargandoFacturasTurno.value = false;
  }
};
/******************************************************/
const cambiarFiltroFacturasTurno = async (activo) => {
  soloFacturasTurno.value = activo;
  campoFactura.value = null;
  campoNombreFactura.value = null;

  if (activo) {
    await cargarFacturasTurnoImpresion();
  }
};
/******************************************************/
const recargarFacturas = async()=>{
  if (soloFacturasTurno.value) {
    await cargarFacturasTurnoImpresion();
  } else {
    await fetchDataFactura();
  }
  toast.add({ severity: 'success', summary: 'Éxito', detail: 'Facturas Recargadas.', life: 3000 });
}
/******************************************************/
const facturaSeleccionada = async(factura)=>{
  const datosFactura = facturas.value.find(fact=>fact.no_factura === factura.value.no_factura);
  if (datosFactura) {
    toast.add({ severity: 'success', summary: 'Éxito', detail: 'Factura Seleccionada.', life: 3000 });
    campoNombreFactura.value = datosFactura.nombre_cliente
  }

}
/******************************************************/
// Computed para filtrar facturas por número o nombre
const facturasFiltradasComputed = computed(() => {
  const facturasDisponibles = soloFacturasTurno.value
    ? facturasFiltradasImprimir.value
    : facturas.value;

  if (!busquedaFactura.value) {
    return facturasDisponibles.slice(0, 20); // Mostrar solo las primeras 20 si no hay búsqueda
  }

  const busqueda = busquedaFactura.value.toLowerCase().trim();
  return facturasDisponibles.filter(factura => {
    const numeroFactura = factura.no_factura?.toString().toLowerCase() || '';
    const nombreCliente = factura.nombre_cliente?.toLowerCase() || '';
    return numeroFactura.includes(busqueda) || nombreCliente.includes(busqueda);
  });
});

// Función para seleccionar una factura desde la lista
const seleccionarFacturaDesdeTabla = (factura) => {
  campoFactura.value = factura;
  campoNombreFactura.value = factura.nombre_cliente;
  toast.add({ severity: 'success', summary: 'Éxito', detail: 'Factura Seleccionada', life: 3000 });
}
/******************************************************/
// Limpiar búsqueda al abrir el modal
watch(visibleimprimirfactura, (newVal) => {
  if (newVal) {
    busquedaFactura.value = '';
    campoFactura.value = null;
    campoNombreFactura.value = null;
    impresoraSeleccionada.value = null;
    soloFacturasTurno.value = false;
    facturasFiltradasImprimir.value = [];
  }
});
/******************************************************/
//impresoraSeleccionada
const imprimirFactura = async()=>{
  if (!campoFactura.value?.no_factura) {
    toast.add({ severity: 'error', summary: 'Error', detail: 'Seleccione una Factura', life: 3000 });
    return;
  }

  const facturasDisponibles = soloFacturasTurno.value
    ? facturasFiltradasImprimir.value
    : facturas.value;
  const facturaSeleccionada = facturasDisponibles.find(
    fact => String(fact.no_factura) === String(campoFactura.value.no_factura)
  );
  const datosFactura = await prepararFacturaParaTicket(facturaSeleccionada || campoFactura.value);
  if (!datosFactura) {
    toast.add({ severity: 'error', summary: 'Error', detail: 'No se encontraron los datos de la factura', life: 3000 });
    return;
  }

  if (!window.electron?.ipcRenderer) {
    toast.add({ severity: 'error', summary: 'Error', detail: 'La impresión solo está disponible en la aplicación de escritorio', life: 4000 });
    return;
  }

  imprimiendoFacturaSeleccionada.value = true;
  try {
    if (impresoraSeleccionada.value === 'Impresora Ticket') {
      const datosLocal = enviarDatosLocalStorage();
      datosLocal.empresa = datosEmpresa.empresa || datosEmpresaStore.empresa || datosLocal.empresa || {};
      const datosCliente = await peticionesFetchOffline(
        'getDataByField',
        'clientes',
        'codigo',
        datosFactura.cod_cliente
      );

      const resultado = await window.electron.ipcRenderer.invoke(
        'ticket',
        JSON.stringify(datosFactura),
        JSON.stringify(datosCliente || {}),
        JSON.stringify(datosLocal)
      );
      if (resultado?.error || resultado?.message) {
        throw new Error(resultado.error || resultado.message);
      }
    } else if (impresoraSeleccionada.value === 'Impresora Normal') {
      const impresionpagina = link.value+'/receipt/factura.php?factura='+encodeURIComponent(datosFactura.no_factura);
      await window.electron.ipcRenderer.invoke('open-new-window', impresionpagina,'url',false,true,false);
    } else {
      throw new Error('Seleccione un tipo de impresora válido');
    }

    toast.add({ severity: 'success', summary: 'Impresión enviada', detail: `Factura ${datosFactura.no_factura} enviada a imprimir`, life: 3000 });
  } catch (error) {
    console.error('Error al imprimir factura desde Caja:', error);
    toast.add({ severity: 'error', summary: 'Error de impresión', detail: error?.message || 'No se pudo imprimir la factura', life: 5000 });
  } finally {
    imprimiendoFacturaSeleccionada.value = false;
  }
}
/******************************************************/
const imprimirEntrada = async()=>{
  const url = link.value+api.value+"/insertar/entradas";
  if (!camposEntrada.value) {
    toast.add({ severity: 'error', summary: 'Error', detail: 'Datos incompletos, no se puede Enviar.', life: 3000 });
    return;
  }
  if (camposEntrada.value.hasOwnProperty('created_at')) {
     camposEntrada.value.created_at = nfecha('timestamp')
     camposEntrada.value.updated_at = nfecha('timestamp')
    }
  const envioDatos = await peticionesFetchOffline('insertData','entradas', JSON.stringify(camposEntrada.value));

  if (envioDatos[0] == 'ok') {
     toast.add({ severity: 'success', summary: 'Éxito', detail: 'Entrada Agregada con éxito.', life: 3000 });
   await imprimirUltimaEntrada()
   camposEntrada.value = await arrayToObjetoFromTabla('entradas');
  }else{
    toast.add({ severity: 'error', summary: 'Error', detail: 'Fallo al Agregar la Entrada.', life: 3000 });
  }
}
/******************************************************/
const fnRealizarCierreLegacy = async () => {
  const result = await Swal.fire({
    title: '¿Qué deseas hacer?',
    text: "Elige una opción:",
    icon: 'question',
    showCancelButton: true,
    confirmButtonText: 'Realizar cierre',
    cancelButtonText: 'Suspender',
    reverseButtons: true
  });

  if (result.isConfirmed) {
       const datosCaja = await peticionesFetchOffline('getDataByField', 'registrocaja','turno',datosEmpresa.usuario.token);
       console.log("datosCaja", datosCaja);

  if (!datosCaja) {
     toast.add({ severity: 'error', summary: 'Error', detail: 'Fallo el cierre de Caja, Cierre Manual.', life: 3000 });
    return
  }


  const url = `${link.value}${api.value}/actualizarcampos/registrocaja`;
  if (datosCaja.hasOwnProperty('created_at')) {
    datosCaja.updated_at = nfecha('timestamp');
  }

   datosCaja.estado = 'Cerrada'
   datosCaja.hora_cierre = nfecha('hora')
   datosCaja.efectivo = datosDelDia.value.efectivo
   datosCaja.tarjeta = datosDelDia.value.tarjeta
   datosCaja.transferencia = datosDelDia.value.transferencia
   datosCaja.abono = datosDelDia.value.abono
   datosCaja.devoluciones = datosDelDia.value.devoluciones
   datosCaja.entradas = datosDelDia.value.entradas
   datosCaja.taller = datosDelDia.value.taller
   


  const envioDatos = await peticionesFetchOffline('updateData','registrocaja', JSON.stringify(datosCaja));
  if (envioDatos[0] == 'ok') {
    toast.add({ severity: 'success', summary: 'Éxito', detail: 'Caja Cerrada', life: 3000 });
    await imprimirCuadre()
    localStorage.clear();
    router.push('/login')
  } else {
    toast.add({ severity: 'error', summary: 'Error', detail: 'Fallo al cerrar Caja.', life: 3000 });
  }


  } else if (result.dismiss === Swal.DismissReason.cancel) {
    router.push('/lock')
  }
};
/******************************************************/
const fnRealizarCierre = async () => {
  const result = await Swal.fire({
    title: 'Salir',
    text: 'Selecciona una opción',
    icon: 'question',
    showCancelButton: true,
    showDenyButton: true,
    confirmButtonText: 'Cuadrar Caja',
    denyButtonText: 'Salir',
    cancelButtonText: 'Cancelar',
    reverseButtons: true
  });

  if (result.isConfirmed) {
    cuadrarCaja.value = true;
  } else if (result.isDenied) {
    router.push('/login');
  }
};
/******************************************************/
const fnCobrarTodo = async()=>{
    Swal.fire({
        title: "¿Estás seguro?",
        text: "¡Se Cobrarán todas las Facturas PENDIENTES!",
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
               if (password === token.value || password === tokenCorto.value || password === tokenSoloUso.value || password === token24H.value) {


for(let factura of facturasSinCobrar.value){
  const url = link.value+api.value+"/actualizarcampos/facturas";
  if (!factura) {
    console.error("Datos incompletos, no se puede actualizar.");
    return;
  }

  if (factura.hasOwnProperty('created_at')) {
      factura.updated_at = nfecha('timestamp')
    }
   
   factura.cajero = usuarioLocal.value.nombre
   factura.token = usuarioLocal.value.token
   factura.estado_factura = 'Cobrado';


  const envioDatos = await peticionesFetchOffline('updateData','facturas', JSON.stringify(factura));
  if (envioDatos[0] == 'ok') {
     toast.add({ severity: 'success', summary: 'Éxito', detail: 'Datos Actualizados', life: 3000 });
  }else{
    toast.add({ severity: 'error', summary: 'Error', detail: 'Fallo al actualizar los datos.', life: 3000 });
  }
}
facturasSinCobrar.value = [];

await fetchAndSetupData();
  await fetchDataFactura();
  await actualizarTokenSoloUso();
await fetchAndSetupDatosdelDia()
                } else {
                    toast.add({ severity: 'error', summary: 'Error', detail: 'Contraseña incorrecta', life: 3000 });
                }
            }
        } else if (result.dismiss === Swal.DismissReason.cancel) {
            toast.add({ severity: 'success', summary: 'No te preocupes', detail: 'Datos seguros', life: 3000 });
        }
    });

}
/******************************************************/
const fnEliminarTodo = async()=>{
    Swal.fire({
        title: "¿Estás seguro?",
        text: "¡Se Eliminarán todas las Facturas PENDIENTES!",
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
               if (password === token.value || password === tokenCorto.value || password === tokenSoloUso.value || password === token24H.value) {


for(let factura of facturasSinCobrar.value){
                            try {
                                const envioDatos = await peticionesFetchOffline('deleteEntry','facturas', factura.id);

                            } catch (error) {
                                console.error(`Error al eliminar datos para ID: ${factura.id}`, error);
                               
                            }
}
facturasSinCobrar.value = [];
await fetchAndSetupData();
  await fetchDataFactura();
  await actualizarTokenSoloUso();
                } else {
                    toast.add({ severity: 'error', summary: 'Error', detail: 'Contraseña incorrecta', life: 3000 });
                }
            }
        } else if (result.dismiss === Swal.DismissReason.cancel) {
            toast.add({ severity: 'success', summary: 'No te preocupes', detail: 'Datos seguros', life: 3000 });
        }
    });
}
/******************************************************/
const fnAgregarCantidadCaja = async () => {
  const datos = await obtenerCajaActual();

  if (!datos) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'No se encontró la caja del turno actual.',
      life: 3000
    });
    return;
  }

  if (cantidadInicio.value == '') {
    cantidadInicio.value = '0.00';
  }

  datos.cant_inicio = cantidadInicio.value;

  const url = link.value + api.value + "/actualizarcampos/registrocaja";

  if (datos.hasOwnProperty('created_at')) {
    datos.updated_at = nfecha('timestamp');
  }



  const envioDatos = await peticionesFetchOffline('updateData', 'registrocaja', JSON.stringify(datos));
  console.log("envioDatos", envioDatos);

  if (envioDatos[0] === 'ok') {
    await fetchAndSetupDatosdelDia();
    visibleInicioCaja.value = false;
    toast.add({ severity: 'success', summary: 'Éxito', detail: 'Datos actualizados', life: 3000 });
  } else {
    toast.add({ severity: 'error', summary: 'Error', detail: 'Fallo al actualizar los datos.', life: 3000 });
  }
};

/******************************************************/
const fnAbrirCaja = async () => {
  cuadrarCaja.value = false;

  const { value: contrasenaIngresada, isConfirmed } = await Swal.fire({
    title: 'Introduce la contraseña',
    input: 'password',
    inputPlaceholder: 'Contraseña',
    showCancelButton: true,
    confirmButtonText: 'Abrir Caja',
    cancelButtonText: 'Cancelar'
  });

  if (isConfirmed) {
    if (
      contrasenaIngresada === token.value ||
      contrasenaIngresada === tokenCorto.value ||
      contrasenaIngresada === tokenSoloUso.value ||
      contrasenaIngresada === token24H.value
    ) {
      const datosEmpresaA = JSON.stringify(enviarDatosLocalStorage());
      await window.electron.ipcRenderer.invoke('abrircaja', null, datosEmpresaA);
      toast.add({
        severity: 'success',
        summary: 'Caja Abierta',
        detail: 'Se envio el ticket de apertura a la impresora.',
        life: 3000
      });
      cuadrarCaja.value = true;
    } else {
      toast.add({
        severity: 'error',
        summary: 'Contraseña Incorrecta',
        detail: 'La contraseña ingresada no es válida.',
        life: 3000
      });
      cuadrarCaja.value = true;
    }
  } else {
    toast.add({
      severity: 'info',
      summary: 'Cancelado',
      detail: 'Operación cancelada por el usuario.',
      life: 3000
    });
    cuadrarCaja.value = true;
  }
};

/******************************************************/
const cargarDatosTurnoParaImpresion = async () => {
  const normalizar = valor => String(valor || '').trim().toLowerCase();
  const turnoUsuario = datosEmpresaStore.usuario?.token || usuarioLocal.value?.token || '';
  const turnoSeleccionado = turnoUsuarioSelected.value && turnoUsuarioSelected.value !== 'COMPLETO'
    ? turnoUsuarioSelected.value
    : turnoUsuario;

  if (!turnoSeleccionado) {
    throw new Error('No se pudo identificar el turno actual.');
  }

  if (usuarioEsCajero()) {
    await actualizarCantidadFacturasTurno();
    const cajaActual = await obtenerCajaActual();
    const fechaInicioActual = cajaActual?.created_at || usuarioLocal.value?.hora_inicio || fechaDeInicioHoy.value;

    return {
      caja: cajaActual || {
        turno: turnoUsuario,
        cant_inicio: contidadInicioCaja.value,
        nombre: usuarioLocal.value?.nombre,
        username: usuarioLocal.value?.email
      },
      turno: turnoUsuario,
      fechaInicio: fechaInicioActual,
      fechaFin: nfecha('timestamp'),
      facturas: [...facturasDelTurnoActual.value]
        .sort((a, b) => Number(a.id || 0) - Number(b.id || 0))
    };
  }

  let cajaTurno = turnosHoyArray.value.find(
    caja => normalizar(caja.turno) === normalizar(turnoSeleccionado)
  );

  if (!cajaTurno) {
    cajaTurno = await peticionesFetchOffline(
      'getDataByField',
      'registrocaja',
      'turno',
      turnoSeleccionado
    );
  }

  const fechaInicioTurno = cajaTurno?.created_at;
  if (!cajaTurno || !fechaInicioTurno) {
    throw new Error('No se encontró la apertura de la caja para este turno.');
  }

  const fechaFinTurno = nfecha('timestamp');
  const response = await peticionesFetchOffline(
    'getRowsByTimestampRange',
    'facturas',
    'created_at',
    fechaInicioTurno,
    fechaFinTurno
  );
  const facturasRango = Array.isArray(response)
    ? response
    : Array.isArray(response?.data)
      ? response.data
      : [];
  const responsePorTurno = await peticionesFetchOffline(
    'getDataArrayByCondition',
    'facturas',
    'token',
    turnoSeleccionado
  );
  const facturasPorTurno = Array.isArray(responsePorTurno)
    ? responsePorTurno
    : Array.isArray(responsePorTurno?.data)
      ? responsePorTurno.data
      : [];
  const facturasConsulta = facturasPorTurno.length > 0 ? facturasPorTurno : facturasRango;
  const almacenActual = normalizar(datosEmpresaStore.empresa?.nombre);
  const obtenerTurnoFactura = factura => {
    if (factura?.token || factura?.turno) return factura.token || factura.turno;
    try {
      const otro = Array.isArray(factura?.otro) ? factura.otro : JSON.parse(factura?.otro || '[]');
      return otro?.[0]?.token || otro?.[0]?.turno || '';
    } catch (error) {
      return '';
    }
  };

  // El rango limita la consulta y el token garantiza que no se mezclen
  // facturas de otras cajas abiertas al mismo tiempo.
  const facturas = facturasConsulta
    .filter(factura => normalizar(obtenerTurnoFactura(factura)) === normalizar(turnoSeleccionado))
    .filter(factura => !almacenActual || normalizar(factura.almacen) === almacenActual)
    .sort((a, b) => Number(a.id || 0) - Number(b.id || 0));

  return {
    caja: cajaTurno,
    turno: turnoSeleccionado,
    fechaInicio: fechaInicioTurno,
    fechaFin: fechaFinTurno,
    facturas
  };
};

const avisarTurnoSinFacturas = () => {
  toast.add({
    severity: 'info',
    summary: 'Turno sin facturas',
    detail: 'No hay facturas registradas en el turno seleccionado.',
    life: 3500
  });
};

const manejarErrorImpresionTurno = (error) => {
  console.error('Error al preparar la impresión del turno:', error);
  toast.add({
    severity: 'error',
    summary: 'No se pudo imprimir',
    detail: error?.message || 'No se pudieron consultar los datos del turno.',
    life: 4500
  });
};

const fnResumenVenta = async()=>{
  try {
    const { facturas } = await cargarDatosTurnoParaImpresion();
    if (facturas.length === 0) {
      avisarTurnoSinFacturas();
      return;
    }

    const datosEmpresa = JSON.stringify(enviarDatosLocalStorage());
    await window.electron.ipcRenderer.invoke('resumenfacturas', JSON.stringify(facturas), datosEmpresa, true, false, false);
  } catch (error) {
    manejarErrorImpresionTurno(error);
  }
}
/******************************************************/
const fnProductosVendidos = async()=>{
  try {
    const datosTurno = await cargarDatosTurnoParaImpresion();
    const jsonData = datosTurno.facturas;
    if (jsonData.length === 0) {
      avisarTurnoSinFacturas();
      return;
    }
  
const productosVendidos = jsonData.reduce((acc, factura) => {
    let productos = [];
    try {
      productos = Array.isArray(factura.productos)
        ? factura.productos
        : JSON.parse(factura.productos || '[]');
    } catch (error) {
      console.warn(`Productos inválidos en la factura ${factura.no_factura || factura.id}:`, error);
    }
    
    productos.forEach(producto => {
        const nombre = producto.nombre;
        const existente = acc.find(item => item.nombre === nombre);
        const cantidadProducto = Number(producto.cantidad || 0);
        const totalProducto = cantidadProducto * Number(producto.precio || 0);
        
        if (existente) {
            existente.cantidad += cantidadProducto;
            existente.total += totalProducto;
        } else {
            acc.push({ 
                nombre, 
                cantidad: cantidadProducto,
                total: totalProducto
            });
        }
    });
    
    return acc;
}, []);

  const peticionDatos = {
    fechainicio:String(datosTurno.fechaInicio).split(' ')[0],
    horainicio:String(datosTurno.fechaInicio).split(' ')[1] || datosTurno.caja.hora_inicio,
    horafin:String(datosTurno.fechaFin).split(' ')[1] || nfecha('horaAmericana'),
    fechafin:String(datosTurno.fechaFin).split(' ')[0] || nfecha('fechaAmericana'),
    taller:datosDelDia.value.taller,
    fondoinicial:datosDelDia.value.inicioCaja,
    efectivo:datosDelDia.value.efectivo,
    transferencia:datosDelDia.value.transferencia,
    tarjeta:datosDelDia.value.tarjeta,
    gastos:datosDelDia.value.gastos,
    abono:datosDelDia.value.abono,
    token:datosTurno.turno,
    ganancia:datosDelDia.value.ganancia,
    totalvendido:datosDelDia.value.venta,
    devoluciones:0.00,
    totalcontado:0.00,
    impuestos:datosDelDia.value.impuestos,
    usuario:datosTurno.caja.nombre || datosTurno.caja.username || usuarioLocal.value.nombre
  }




const datos = productosVendidos


const losDatos = {
    datos:datos,
    peticion:peticionDatos
}


  const datosEmpresaA = JSON.stringify(enviarDatosLocalStorage() )
  await window.electron.ipcRenderer.invoke('ticketproductosvendidos',JSON.stringify(losDatos),datosEmpresaA,true,false,false);
  } catch (error) {
    manejarErrorImpresionTurno(error);
  }
}
/******************************************************/
//transaccionesCantidad
//transaccionesHasta
const fnTransferir = async()=>{
  const datosCuenta = await peticionesFetchOffline('getDataByField', 'cuentas','nombre',transaccionesHasta.value);

  if (datosCuenta) {
      const saldo = Number(datosCuenta.saldo) || 0;

      const url = link.value+api.value+"/actualizarcampos/cuentas";
      if (!datosCuenta) {
        console.error("Datos incompletos, no se puede actualizar.");
        return;
      }
      if (datosCuenta.hasOwnProperty('created_at')) {
        datosCuenta.updated_at = nfecha('timestamp');
      }

       datosCuenta.saldo = (saldo + Number(transaccionesCantidad.value))

      const envioDatos = await peticionesFetchOffline('updateData','cuentas', JSON.stringify(datosCuenta));

      if (envioDatos[0] == 'ok') {

        toast.add({ severity: 'success', summary: 'Éxito', detail: 'Fondos Transferidos Exitosamente', life: 3000 });
      } else {
        toast.add({ severity: 'error', summary: 'Error', detail: 'Fallo al actualizar los datos.', life: 3000 });
      }



  }


}
/******************************************************/
const turnoFechaCambio = ()=>{

}
/******************************************************/
const fnVerFallas = () => {
  const datos = facturaTallerSeleccionada.value;
 visibletaller.value = false
  // Convertir el string JSON a un objeto real
  const fallas = JSON.parse(datos.fallas);

  // Generar un listado de las fallas para mostrar en el Swal
  const listaFallas = fallas.map(falla => `- ${falla.propiedad}`).join('<br>');

  // Mostrar las fallas en un SweetAlert2
  Swal.fire({
    title: 'Fallas registradas',
    html: listaFallas,
    icon: 'info',
    confirmButtonText: 'Aceptar'
  });
};

/******************************************************/
const piezasPedido = ref([])
const fnRealizarPedido = () => {
    const proveedor = proveedorWhatsapp.value;
//  const datos = facturaTallerSeleccionada.value;
    if (!proveedor || !proveedor.nombre || !proveedor.telefono) {
        console.error('Datos del proveedor no válidos');
        toast.add({ severity: 'error', summary: 'Error', detail: 'Datos del proveedor no válidos', life: 3000 });
        return;
    }

    if (!facturaTallerSeleccionada.value.equipo || !facturaTallerSeleccionada.value.marca || !facturaTallerSeleccionada.value.modelo) {
        console.error('Datos del equipo no válidos');
        toast.add({ severity: 'error', summary: 'Error', detail: 'Datos del equipo no válidos', life: 3000 });
        return;
    }

    if (piezasPedido.value.length === 0) {
        console.error('No hay piezas seleccionadas');
        toast.add({ severity: 'error', summary: 'Error', detail: 'No hay piezas seleccionadas', life: 3000 });
        return;
    }

    datosWhatsApp.value.nombre = proveedor.nombre;
    datosWhatsApp.value.numero = proveedor.telefono;
    datosWhatsApp.value.texto = `Hola, quiero cotizar las siguientes piezas para un *${facturaTallerSeleccionada.value.equipo}, ${facturaTallerSeleccionada.value.marca}, ${facturaTallerSeleccionada.value.modelo}*: ${piezasPedido.value.join(', ')}`;

    showWhatsAppModal();
};
/******************************************************/
const fnTodasLasFacturas = async () => {
let facturas = [];
try {
    const datosTurno = await cargarDatosTurnoParaImpresion();
    facturas = datosTurno.facturas;
} catch (error) {
    manejarErrorImpresionTurno(error);
    return;
}

if (facturas.length === 0) {
    avisarTurnoSinFacturas();
    return;
}

cuadrarCaja.value = false

    const datosEmpresaA = JSON.stringify(enviarDatosLocalStorage());

    // Crear un elemento de loading en la pantalla con Tailwind CSS
    const loadingElement = document.createElement('div');
    loadingElement.id = 'loading';
    loadingElement.className = 'fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white text-center p-6 rounded-lg shadow-lg border border-gray-200';
    loadingElement.innerHTML = `
        <div class="text-xl font-semibold text-gray-800 mb-2">Imprimiendo facturas...</div>
        <div id="loadingMessage" class="text-lg text-gray-600">Preparando...</div>
        <div class="mt-4">
            <div class="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                <div id="progressBar" class="bg-blue-500 h-2.5 rounded-full transition-all duration-300" style="width: 0%;"></div>
            </div>
        </div>
    `;
    document.body.appendChild(loadingElement);

    // Referencias a los elementos de progreso
    const loadingMessage = document.getElementById('loadingMessage');
    const progressBar = document.getElementById('progressBar');

    for (let i = 0; i < facturas.length; i++) {
        const factura = facturas[i];

        // Actualizar el mensaje y el progreso
        loadingMessage.innerText = `Imprimiendo factura #${factura.no_factura} (${i + 1} de ${facturas.length})`;
        const progressPercent = ((i + 1) / facturas.length) * 100;
        progressBar.style.width = `${progressPercent}%`;

        const facturaTicket = await prepararFacturaParaTicket(factura);
        await window.electron.ipcRenderer.invoke('ticket', JSON.stringify(facturaTicket),null, datosEmpresaA);
    }

    // Cambiar mensaje al finalizar
    loadingMessage.innerText = 'Todas las facturas han sido impresas.';
    progressBar.style.width = '100%';
    progressBar.classList.add('bg-green-500');

    // Remover el mensaje después de unos segundos
    setTimeout(() => {
        document.body.removeChild(loadingElement);
        cuadrarCaja.value = true
    }, 3000);
};
/******************************************************/
const fnAgregarSocio = async()=>{
    const campos = await arrayToObjetoFromTablaOffline('clientes');
    campos.nombre = registroSocios.value.nombre
    campos.codigo = registroSocios.value.codigo
    campos.direccion = registroSocios.value.direccion
    campos.cedula = registroSocios.value.cedula
    campos.sexo = registroSocios.value.sexo
    campos.edad = registroSocios.value.edad
    campos.email = registroSocios.value.email
    campos.fecha_nacimiento = registroSocios.value.fecha_nacimiento
    campos.telefono = registroSocios.value.telefono
    console.log("campos", campos);
}
/******************************************************/
const generaCodigoUnicoDigitos = ()=>{
    const codigosClientes = clientesData.value.map(cl => cl.codigo);
  let nuevoCodigo;
  do {
    nuevoCodigo = Math.floor(1000 + Math.random() * 9000).toString(); // entre 1000 y 9999
  } while (codigosClientes.includes(nuevoCodigo));

  registroSocios.value.codigo = nuevoCodigo;

}
/******************************************************/
watchEffect(() => {

if (registrarSocios.value) {
  registroSocios.value.sexo = 'HOMBRE';
  generaCodigoUnicoDigitos()
}


});
/******************************************************/
/******************************************************/
const verificaCodigoSocio = async()=>{
  const codigo = registroSocios.value.codigo
  const codigosClientes = clientesData.value.map(cl => cl.codigo);
  console.log("codigosClientes", codigosClientes);
  if(codigosClientes.includes(codigo)){
    generaCodigoUnicoDigitos()
  }
}
/******************************************************/
</script>

<style scoped>
.columna {
padding-top: 0 !important;
padding-bottom: 0 !important;
}

  .button-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr); /* Cuatro columnas iguales */
    gap: 10px; /* Espaciado entre los botones */
  }
  
  .button-grid button {
    width: 100%; /* Asegura que los botones ocupen el 100% de la celda */
    height: 100px; /* Puedes ajustar la altura a tus necesidades */
  }
.chat-container {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  height: 50vh;
}

.chat-messages {
  flex-grow: 1;
  overflow-y: auto;
}

.message {
  display: flex;
  justify-content: flex-start;
}

.user-message {
  background-color: #dcf8c6;
  border-radius: 8px;
  padding: 10px;
  max-width: 75%;
  align-self: flex-end;
}

.ia-message {
  background-color: #f1f0f0;
  border-radius: 8px;
  padding: 10px;
  max-width: 75%;
  align-self: flex-start;
}

/* ===================================
   MODERN CAJA COMPONENT STYLES
   =================================== */

/* Content Wrapper */
.content-wrapper {
  min-height: calc(100vh - 80px);
  background: linear-gradient(135deg, rgba(243, 244, 246, 0.5) 0%, rgba(229, 231, 235, 0.3) 100%);
}

.caja-dashboard-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.75fr) minmax(20rem, 0.95fr);
  gap: 1.5rem;
  align-items: start;
}

.caja-main-column {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1.5rem;
  align-items: start;
}

.caja-side-column {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

/* Modern Card Styling */
.caja-card {
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  border: 1px solid rgba(229, 231, 235, 0.8);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
}

.caja-card:hover {
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
  transform: translateY(-2px);
}

.caja-card--summary {
  min-height: 100%;
}

.caja-card--invoices {
  grid-column: 1 / -1;
  min-height: 18rem;
  display: flex;
  flex-direction: column;
}

.caja-card--invoices :deep(.p-card-body) {
  display: flex;
  flex: 1;
  flex-direction: column;
}

.caja-card--invoices :deep(.p-card-content) {
  flex: 1;
  min-height: 12rem;
}

/* Card Header Modern */
.card-header-modern {
  padding: 1.5rem;
  background: linear-gradient(135deg, rgba(249, 250, 251, 0.8) 0%, rgba(243, 244, 246, 0.6) 100%);
  border-bottom: 1px solid rgba(229, 231, 235, 0.6);
}

.card-header-modern h2 {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 700;
  color: #1f2937;
}

.card-header-modern p {
  margin: 0.25rem 0 0 0;
  font-size: 0.875rem;
  color: #6b7280;
}

.card-header-modern--invoices {
  padding-bottom: 1.15rem;
}

/* Icon Wrapper Modern */
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

.icon-wrapper-modern:hover {
  transform: scale(1.1) rotate(5deg);
}

.icon-wrapper-modern.bg-blue-500 {
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
}

.icon-wrapper-modern.bg-purple-500 {
  background: linear-gradient(135deg, #a855f7 0%, #9333ea 100%);
}

.icon-wrapper-modern.bg-green-500 {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
}

.icon-wrapper-modern.bg-orange-500 {
  background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
}

/* Input Modern Wrapper */
.input-modern-wrapper {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.label-modern {
  font-size: 0.875rem;
  font-weight: 600;
  color: #374151;
  margin-bottom: 0.25rem;
}

.input-modern {
  padding: 0.75rem 1rem;
  border: 2px solid #e5e7eb;
  border-radius: 10px;
  font-size: 0.95rem;
  transition: all 0.3s ease;
  background: white;
}

.input-modern:focus {
  border-color: #6366f1;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
  outline: none;
}

.input-modern:read-only {
  background: #f9fafb;
  cursor: not-allowed;
  color: #6b7280;
}

.user-summary-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.85rem;
}

.user-summary-item {
  padding: 0.9rem 1rem;
  border: 1px solid #e2e8f0;
  border-radius: 0.95rem;
  background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
}

.user-summary-item__label {
  display: block;
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  color: #64748b;
  margin-bottom: 0.35rem;
}

.user-summary-item__value {
  display: block;
  font-size: 1rem;
  font-weight: 700;
  color: #0f172a;
  line-height: 1.25;
}

.user-summary-item--invoices {
  border-color: color-mix(in srgb, var(--primary-color) 24%, #e2e8f0);
  background: linear-gradient(145deg, color-mix(in srgb, var(--primary-color) 7%, white), #ffffff);
}

/* Action Button Modern */
.action-btn-modern {
  padding: 0.75rem 1.5rem;
  font-weight: 600;
  border-radius: 10px;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.action-btn-modern:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
}

.action-btn-modern--compact {
  width: 100%;
  justify-content: center;
  min-height: 3rem;
}

.quick-actions-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.75rem;
}

.facturas-grid-priority {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1rem;
  max-height: calc(100vh - 18rem);
  min-height: 12rem;
  overflow-y: auto;
  padding-right: 0.35rem;
}

/* Factura Card Modern */
.factura-card-modern {
  background: white;
  border: 2px solid #e5e7eb;
  border-radius: 14px;
  padding: 1.25rem;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
}

.factura-card-modern::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 4px;
  height: 100%;
  background: linear-gradient(180deg, #6366f1 0%, #8b5cf6 100%);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.factura-card-modern:hover {
  border-color: #6366f1;
  box-shadow: 0 8px 24px rgba(99, 102, 241, 0.15);
  transform: translateY(-4px);
}

.factura-card-modern:hover::before {
  opacity: 1;
}

/* Factura Header */
.factura-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 1rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #f3f4f6;
}

.factura-cliente {
  display: block;
  font-size: 1.1rem;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 0.25rem;
}

.factura-numero {
  display: inline-block;
  font-size: 0.875rem;
  color: #6b7280;
  font-weight: 500;
}

.factura-total {
  font-size: 1.5rem;
  font-weight: 800;
  color: #10b981;
  margin-top: 0.5rem;
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

/* Factura Icon Wrapper */
.factura-icon-wrapper {
  width: 56px;
  height: 56px;
  border-radius: 12px;
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.factura-icon-wrapper i {
  color: #6366f1;
}

/* Factura Actions */
.factura-actions {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.factura-actions button {
  flex: 1;
  min-width: fit-content;
  font-size: 0.875rem;
  padding: 0.625rem 1rem;
  border-radius: 8px;
  transition: all 0.2s ease;
}

.factura-actions button:hover {
  transform: scale(1.05);
}

.cobro-factura-header {
  display: flex;
  align-items: center;
  gap: 0.95rem;
}

.cobro-factura-header__icon {
  width: 3rem;
  height: 3rem;
  border-radius: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
  color: #1d4ed8;
  font-size: 1.3rem;
  box-shadow: 0 12px 24px rgba(37, 99, 235, 0.18);
}

.cobro-factura-header__title {
  display: block;
  font-size: 1.1rem;
  font-weight: 800;
  color: #111827;
}

.cobro-factura-header__subtitle {
  margin: 0.2rem 0 0;
  font-size: 0.84rem;
  color: #6b7280;
}

.cobro-factura-shell {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 0.5rem 0.25rem 0.25rem;
}

.cobro-factura-summary {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.85rem;
}

.cobro-factura-stat {
  background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
  border: 1px solid #dbe4ee;
  border-radius: 1rem;
  padding: 1rem 1.1rem;
  box-shadow: 0 14px 28px rgba(15, 23, 42, 0.06);
}

.cobro-factura-stat__label {
  display: block;
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  color: #64748b;
  margin-bottom: 0.45rem;
}

.cobro-factura-stat__value {
  display: block;
  font-size: 1.5rem;
  font-weight: 800;
  line-height: 1.1;
  color: #0f172a;
}

.cobro-factura-stat__value--info {
  color: #1d4ed8;
}

.cobro-factura-stat__value--success {
  color: #047857;
}

.cobro-factura-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.35fr) minmax(18rem, 0.9fr);
  gap: 1rem;
}

.cobro-factura-panel {
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.98) 0%, rgba(248, 250, 252, 0.95) 100%);
  border: 1px solid #dbe4ee;
  border-radius: 1.2rem;
  box-shadow: 0 16px 32px rgba(15, 23, 42, 0.07);
}

.cobro-factura-panel--primary {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1rem;
  padding: 1rem;
}

.cobro-factura-panel--aside {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1rem;
}

.cobro-factura-field {
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
}

.cobro-factura-field--full {
  grid-column: 1 / -1;
}

.cobro-factura-label {
  font-size: 0.75rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  color: #475569;
}

.cobro-factura-money {
  position: relative;
}

.cobro-factura-money::before {
  content: 'RD$';
  position: absolute;
  left: 1rem;
  top: 50%;
  transform: translateY(-50%);
  font-size: 0.95rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  color: #64748b;
  z-index: 1;
}

.cobro-factura-input {
  min-height: 3.6rem;
  padding: 0.85rem 1rem;
  border: 1px solid #cbd5e1;
  border-radius: 1rem;
  background: #f8fafc;
  color: #0f172a;
  font-size: 1.35rem;
  font-weight: 700;
  transition: border-color 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;
}

.cobro-factura-input:focus {
  border-color: #2563eb;
  box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.12);
  background: #ffffff;
}

.cobro-factura-input--hero {
  min-height: 5.3rem;
  padding-left: 4rem;
  font-size: 2.5rem;
  font-weight: 800;
}

.cobro-factura-input--readonly {
  background: #eef2f7;
  color: #0f172a;
}

.cobro-factura-input--success {
  color: #047857;
  background: #ecfdf5;
  border-color: #a7f3d0;
}

.cobro-factura-shortcuts {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.cobro-factura-shortcut {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 0.85rem;
  padding: 0.9rem 1rem;
  border-radius: 1rem;
  border: 1px solid #dbe4ee;
  background: #ffffff;
  text-align: left;
  transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
}

.cobro-factura-shortcut:hover {
  transform: translateY(-1px);
  border-color: #93c5fd;
  box-shadow: 0 12px 24px rgba(37, 99, 235, 0.08);
}

.cobro-factura-shortcut__key {
  min-width: 2.8rem;
  height: 2.2rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 0.8rem;
  background: #eff6ff;
  color: #1d4ed8;
  font-size: 0.82rem;
  font-weight: 800;
}

.cobro-factura-shortcut__text {
  font-size: 0.92rem;
  font-weight: 700;
  color: #334155;
}

.cobro-factura-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  width: 100%;
}

.cobro-factura-footer__btn {
  min-width: 10rem;
}

:deep(.cobro-factura-footer__btn--primary.p-button) {
  min-height: 3.2rem;
  border: 0;
  color: #ffffff;
  font-weight: 800;
  background: linear-gradient(135deg, #16a34a 0%, #15803d 100%);
  box-shadow: 0 14px 30px rgba(22, 163, 74, 0.24);
}

:deep(.cobro-factura-footer__btn--primary.p-button:hover) {
  background: linear-gradient(135deg, #15803d 0%, #166534 100%);
}

:deep(.cobrar-factura-dialog .p-dialog-content) {
  background: linear-gradient(180deg, #f8fafc 0%, #eef2f7 100%);
}

/* Empty State Modern */
.empty-state-modern {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 12rem;
  padding: 4rem 2rem;
  text-align: center;
}

.empty-state-modern i {
  margin-bottom: 1rem;
  opacity: 0.4;
  animation: floatEmpty 3s ease-in-out infinite;
}

.empty-state-modern p {
  margin: 0.25rem 0;
}

@keyframes floatEmpty {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
}

/* Caja Action Button */
.caja-action-btn {
  width: 100%;
  padding: 1rem 1.25rem;
  font-weight: 600;
  font-size: 0.95rem;
  border-radius: 10px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  text-align: left;
  justify-content: flex-start;
}

.caja-action-btn:hover {
  transform: translateX(4px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
}

/* Responsive Adjustments */
@media (max-width: 768px) {
  .card-header-modern {
    padding: 1rem;
  }

  .caja-dashboard-grid,
  .caja-main-column,
  .quick-actions-grid,
  .user-summary-grid,
  .facturas-grid-priority {
    grid-template-columns: 1fr;
  }

  .factura-card-modern {
    padding: 1rem;
  }

  .factura-header {
    flex-direction: column;
    gap: 1rem;
  }

  .factura-icon-wrapper {
    width: 48px;
    height: 48px;
  }

  .factura-total {
    font-size: 1.25rem;
  }

  .caja-action-btn {
    padding: 0.875rem 1rem;
    font-size: 0.875rem;
  }

  .facturas-grid-priority {
    max-height: none;
    overflow: visible;
    padding-right: 0;
  }

  .cobro-factura-summary,
  .cobro-factura-grid,
  .cobro-factura-panel--primary {
    grid-template-columns: 1fr;
  }

  .cobro-factura-input--hero {
    font-size: 2rem;
    min-height: 4.6rem;
  }

  .cobro-factura-footer {
    flex-direction: column;
  }

  .cobro-factura-footer__btn {
    width: 100%;
  }
}

/* Sticky Right Sidebar */
.sticky {
  position: sticky;
}

.top-6 {
  top: 1.5rem;
}

/* Additional PrimeVue Overrides for Caja */
.caja-card .p-card-header {
  padding: 0;
}

.caja-card .p-card-content {
  padding: 1.5rem;
}

.caja-card .p-card-body {
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

.caja-card {
  animation: slideIn 0.4s ease-out;
}

.factura-card-modern {
  animation: slideIn 0.3s ease-out;
  animation-fill-mode: both;
}

.factura-card-modern:nth-child(1) { animation-delay: 0.05s; }
.factura-card-modern:nth-child(2) { animation-delay: 0.1s; }
.factura-card-modern:nth-child(3) { animation-delay: 0.15s; }
.factura-card-modern:nth-child(4) { animation-delay: 0.2s; }
.factura-card-modern:nth-child(5) { animation-delay: 0.25s; }
.factura-card-modern:nth-child(6) { animation-delay: 0.3s; }

/* Estilos para Modal de Imprimir Facturas */
.imprimir-factura-content {
  padding: 1rem;
}

.search-section {
  margin-bottom: 1.5rem;
}

.facturas-list-card,
.config-card {
  height: 100%;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  border: 1px solid #e5e7eb;
}

.facturas-list-card :deep(.p-card-content),
.config-card :deep(.p-card-content) {
  padding: 0;
}

.facturas-table-wrapper {
  padding: 0.5rem;
}

.factura-item {
  padding: 1rem;
  border-bottom: 1px solid #e5e7eb;
  cursor: pointer;
  transition: all 0.2s ease;
  border-radius: 8px;
  margin-bottom: 0.5rem;
}

.factura-item:hover {
  background-color: #f3f4f6;
  transform: translateX(4px);
}

.factura-item:last-child {
  border-bottom: none;
}

.factura-selected {
  background-color: #dbeafe !important;
  border: 2px solid #3b82f6;
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.2);
}

.factura-selected:hover {
  background-color: #dbeafe !important;
}

.selected-invoice-info {
  animation: fadeIn 0.3s ease-in;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.config-card .space-y-4 > * + * {
  margin-top: 1rem;
}

/* Estilo para scroll personalizado */
.facturas-table-wrapper::-webkit-scrollbar {
  width: 8px;
}

.facturas-table-wrapper::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 4px;
}

.facturas-table-wrapper::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 4px;
}

.facturas-table-wrapper::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}

/* Responsive */
@media (max-width: 768px) {
  .imprimir-factura-dialog {
    width: 95vw !important;
  }

  .grid-cols-12 > .col-span-7,
  .grid-cols-12 > .col-span-5 {
    grid-column: span 12 !important;
  }
}

/* Estilos para Modal de Taller */
.taller-content {
  padding: 1rem;
}

.ordenes-list-card,
.details-card {
  height: 100%;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  border: 1px solid #e5e7eb;
}

.ordenes-list-card :deep(.p-card-content),
.details-card :deep(.p-card-content) {
  padding: 0;
}

.ordenes-table-wrapper {
  padding: 0.5rem;
}

.orden-item {
  padding: 1rem;
  border-bottom: 1px solid #e5e7eb;
  cursor: pointer;
  transition: all 0.2s ease;
  border-radius: 8px;
  margin-bottom: 0.5rem;
}

.orden-item:hover {
  background-color: #fff7ed;
  transform: translateX(4px);
}

.orden-item:last-child {
  border-bottom: none;
}

.orden-selected {
  background-color: #fed7aa !important;
  border: 2px solid #f97316;
  box-shadow: 0 2px 8px rgba(249, 115, 22, 0.2);
}

.orden-selected:hover {
  background-color: #fed7aa !important;
}

.selected-order-info {
  animation: fadeIn 0.3s ease-in;
}

.details-card .space-y-4 > * + * {
  margin-top: 1rem;
}

/* Estilo para scroll personalizado en órdenes */
.ordenes-table-wrapper::-webkit-scrollbar {
  width: 8px;
}

.ordenes-table-wrapper::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 4px;
}

.ordenes-table-wrapper::-webkit-scrollbar-thumb {
  background: #fbbf24;
  border-radius: 4px;
}

.ordenes-table-wrapper::-webkit-scrollbar-thumb:hover {
  background: #f59e0b;
}

/* Responsive para modal de taller */
@media (max-width: 768px) {
  .taller-dialog {
    width: 95vw !important;
  }
}

/* Estilos para modal de Contar Dinero */
.contar-dinero-dialog {
  overflow: hidden;
}

.contar-dinero-dialog-content {
  overflow: hidden;
}

.contar-dinero-layout {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.contar-dinero-main-grid {
  display: grid;
  gap: 1rem;
  grid-template-columns: minmax(0, 2fr) minmax(320px, 0.95fr);
  align-items: start;
}

.contar-dinero-turno-card {
  border: 1px solid #e5e7eb;
  background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
}

.contar-dinero-card .p-card-title {
  padding-bottom: 0.65rem;
  border-bottom: 1px solid #e5e7eb;
}

.contar-dinero-card .p-card-content {
  padding-top: 0.85rem;
}

.dinero-item {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 0.65rem;
}

.dinero-item-label {
  display: block;
  color: #475569;
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.02em;
  margin-bottom: 0.45rem;
}

.dinero-input {
  height: 4rem;
  font-size: 1.875rem;
  padding: 0.5rem;
  text-align: center;
  font-weight: 600;
  transition: all 0.2s;
}

.dinero-input-compact {
  height: 2.85rem;
  font-size: 1.2rem;
  padding: 0.35rem 0.55rem;
}

.dinero-input:focus {
  box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.2);
  border-color: #10b981;
}

.dinero-input-total {
  height: 3.4rem;
  font-size: 1.55rem;
  padding: 0.45rem 0.65rem;
  text-align: center;
  font-weight: 700;
  border: 2px solid #e5e7eb;
}

.dinero-input-total:focus {
  box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.2);
  border-color: #10b981;
}

.contar-dinero-totales-card {
  background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
  border: 1px solid #e5e7eb;
}

.contar-dinero-totales-card .p-card-content {
  padding: 1.15rem;
}

.contar-dinero-resumen-card {
  position: sticky;
  top: 0;
}

.contar-dinero-footer {
  display: flex;
  justify-content: space-between;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.contar-dinero-footer-group {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

:deep(.print-format-card) {
  width: 100%;
  min-height: 9.5rem;
  justify-content: center;
  border-radius: 1rem;
  border-width: 1px;
  transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
}

:deep(.print-format-card:hover) {
  transform: translateY(-3px);
  box-shadow: 0 14px 30px rgba(15, 23, 42, 0.13);
}

:deep(.print-format-card--letter) {
  background: linear-gradient(145deg, rgba(255, 255, 255, 0.92), rgba(241, 245, 249, 0.86));
  border-color: rgba(100, 116, 139, 0.28);
}

:deep(.print-format-card--ticket) {
  background: linear-gradient(145deg, var(--primary-color), color-mix(in srgb, var(--primary-color) 76%, #312e81));
  box-shadow: 0 10px 24px color-mix(in srgb, var(--primary-color) 25%, transparent);
}

.print-format-icon {
  display: grid;
  place-items: center;
  width: 3rem;
  height: 3rem;
  border-radius: 0.85rem;
  background: rgba(148, 163, 184, 0.14);
  font-size: 1.4rem;
}

:deep(.print-format-card--ticket) .print-format-icon {
  background: rgba(255, 255, 255, 0.18);
}

/* Animación para el estado */
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Responsive para modal de contar dinero */
@media (max-width: 1200px) {
  .contar-dinero-main-grid {
    grid-template-columns: 1fr;
  }

  .contar-dinero-resumen-card {
    position: static;
  }
}

@media (max-width: 1024px) {
  .dinero-input {
    height: 3.5rem;
    font-size: 1.5rem;
  }

  .dinero-input-compact {
    height: 2.7rem;
    font-size: 1.1rem;
  }

  .dinero-input-total {
    height: 3.1rem;
    font-size: 1.35rem;
  }
}

@media (max-width: 768px) {
  .contar-dinero-dialog {
    width: 96vw !important;
  }

  .contar-dinero-secciones .col-span-12 {
    grid-column: span 12 !important;
  }

  .dinero-input {
    height: 3rem;
    font-size: 1.25rem;
  }

  .dinero-input-compact {
    height: 2.55rem;
    font-size: 1rem;
  }

  .dinero-input-total {
    height: 3rem;
    font-size: 1.2rem;
  }
}
</style>
