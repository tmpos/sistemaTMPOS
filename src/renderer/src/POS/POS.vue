<template>
  <!-- UI POS ESTILO FARMACIA -->
  <div class="min-h-screen pos-background" ref="posScrollContainer">
    <div class="pos-shell">
      <div class="grid grid-cols-1 xl:grid-cols-12 gap-4">
        <section class="xl:col-span-9 space-y-4">
          <div class="pos-header">
            <div class="pos-header-top">
              <div class="pos-title">Punto de Venta</div>
              <div class="pos-subtitle">{{ documentoActual }} </div>
            </div>

            <div class="pos-header-rows">
              <div class="pos-header-actions pos-header-actions-scrollable">
                <Button label="Comporbante F7" class="pos-action-button" @click="visibleComprobanteRapido = true" />
                <Button label="Facturas" class="pos-action-button" @click="visiblefatcoti = true" />
                <Button label="Descuento" class="pos-action-button" @click="visibleDescuento = true" />
                <Button label="Otro producto" class="pos-action-button" @click="visibleOtroArticulo = true" />
                <Button label="Recibir equipo" class="pos-action-button" @click="visibleRecibirEquipos = true" />
                <Button label="Método de Pago" class="pos-action-button" @click="visiblecobrar = true" />
                <Button label="Asistente IA" class="pos-action-button" @click="visibleAsistenteIA = true" />
                <Button
                  :label="ocultarImagenProductos ? 'Mostrar imagenes' : 'Ocultar imagenes'"
                  class="pos-action-button"
                  @click="ocultarImagenProductos = !ocultarImagenProductos"
                />
              </div>

              <div class="pos-tabs pos-tabs-scrollable">
                <Button
                  label="Todos"
                  class="pos-tab"
                  :class="{ 'pos-tab-active': selectedCategory === null }"
                  @click="filterProductsByCategory(null)"
                />
                <Button
                  v-for="category in categoriasArray"
                  :key="category.id"
                  :label="category.nombre"
                  class="pos-tab"
                  :class="{ 'pos-tab-active': selectedCategory === category.nombre }"
                  @click="filterProductsByCategory(category.nombre)"
                />
              </div>
            </div>
          </div>

          <div class="pos-search">
            <div class="pos-search-field">
              <AutoCompletar
                v-model="awesompleteproductoprincipal"
                :list="listaBuscador"
                placeholder="Codigo de barra | IMEI"
                :mostrarBoton="true"
                @onBotonClick="visibleBuscarProducto = true"
                @selectComplete="handleSelectCompleteproductoprincipal"
              />
            </div>
            <div class="pos-search-field">
              <InputText
                v-model="searchQuery"
                placeholder="Filtrar por nombre"
                class="w-full"
              />
            </div>
            <div class="pos-search-field flex items-center gap-2">
              <InputSwitch v-model="ocultarSinStock" />
              <span class="text-xs text-slate-600 dark:text-slate-300">Ocultar sin stock</span>
            </div>
            <div class="pos-search-field flex items-center gap-2">
              <InputSwitch v-model="agregarDirectoCarrito" />
              <span class="text-xs text-slate-600 dark:text-slate-300">Agregar directo</span>
            </div>
          </div>

          <div class="pos-product-grid">
            <div v-if="cargandoProductos" class="pos-loading-container">
              <i class="pi pi-spin pi-spinner" style="font-size: 3rem"></i>
              <span class="pos-loading-text">Cargando productos...</span>
            </div>
            <button
              v-else
              v-for="item in filteredProductos"
              :key="item.id"
              :class="['pos-product-card', stockCardClass(item)]"
              @click="abrirModalProducto(item)"
            >
              <div v-if="!ocultarImagenProductos" class="pos-product-image-container">
                <img
                  :src="getProductImage(item.imagen)"
                  :alt="item.nombre"
                  class="pos-product-image"
                  @error="$event.target.src = getProductImage(null)"
                />
              </div>
              <div class="pos-product-row">
                <span class="pos-product-code">Cod.: {{ item.codigo || item.codigo }}</span>
                <span class="pos-product-icon pi pi-briefcase"></span>
              </div>
              <div class="pos-product-name">{{ item.nombre || item.nombre }}</div>
              <div class="pos-product-meta">Codigo de Barra: {{ item.codigo_barra || '-' }}</div>
              <div class="pos-product-meta">Inventario</div>
              <div class="pos-product-footer">
                <span :class="['pos-product-stock', stockBadgeClass(item)]">
                  Cant: {{ Number(item.stock || item.stock || 0).toFixed(1) }}
                </span>
                <span class="pos-product-price">P1: {{ datosConfiguracion.simbolo }}{{ Number(item.precio_venta || 0).toFixed(2) }}</span>
              </div>
            </button>
          </div>
        </section>

        <aside class="xl:col-span-3">
          <div class="pos-aside">
            <div class="pos-panel">
              <div class="pos-panel-header">
                <span>Cliente F3</span>
                <div class="pos-panel-header-actions">
                  <Button icon="pi pi-user" severity="secondary" text @click="fnClienteDefault" v-tooltip.bottom="'Cliente por Default'" />
                  <Button icon="pi pi-plus" severity="secondary" text @click="fnAgregarCliente" />
                </div>
              </div>
              <AutoComplete
                v-model="clienteSelected"
                optionLabel="nombre"
                :placeholder="$t('Search client by name...')"
                :suggestions="allClientes"
                :virtualScrollerOptions="{ itemSize: 38 }"
                @complete="searchCliente"
                @option-select="fnCambiarClientes"
                @focus="fnFocusClientes"
                @blur="fnBlurClientes"
                fluid
                :autoOptionFocus="true"
                :forceSelection="true"
                dropdown
                class="w-full"
              />
              <div :class="comprobanteClase" class="pos-comprobante-ribbon">
                {{ comprobanteEtiqueta }}
              </div>
              <div class="pos-panel-row pos-panel-row-inline pos-panel-row-tight">
    <!--             <div class="pos-checkbox">
                  <Checkbox v-model="impresionDirecta" binary inputId="impresionDirecta" />
                  <label for="impresionDirecta">Impresion directo</label>
                </div> -->
                <div class="pos-checkbox">
                  <Checkbox v-model="impuestoSin" binary inputId="sinImpuesto" />
                  <label for="sinImpuesto">Sin impuesto</label>
                </div>
                <div class="pos-checkbox">
                  <Checkbox v-model="impuestoIncluido" binary inputId="incluyeImpuesto" />
                  <label for="incluyeImpuesto">Incluye impuesto</label>
                </div>
                <div class="pos-checkbox">
                  <Checkbox v-model="impuestoAgregado" binary inputId="agregaImpuesto" />
                  <label for="agregaImpuesto">Agregar impuesto</label>
                </div>
              </div>
              <Select
                v-if="mostrarVendedorPanel"
                v-model="vendedor"
                :options="vendedoresNombre"
                placeholder="Seleccionar vendedor"
                class="w-full"
              />
            </div>

            <div class="pos-cart pos-cart-flex pos-cart-desktop">
              <div class="pos-cart-header" style="display: flex; justify-content: space-between; align-items: center; padding: 8px 12px; background: #f0f0f0; border-radius: 8px; margin-bottom: 8px;">
                <span style="font-weight: 600;">Carrito</span>
                <span style="background: #10b981; color: white; padding: 2px 10px; border-radius: 12px; font-size: 13px; font-weight: 600;">{{ totalProductosCarrito }} productos</span>
              </div>
              <div class="pos-cart-search" style="margin-bottom: 8px; position: relative;">
                <i class="pi pi-search" style="position: absolute; left: 10px; top: 50%; transform: translateY(-50%); color: #94a3b8; font-size: 0.85rem; z-index: 1;"></i>
                <InputText v-model="busquedaCarrito" placeholder="Buscar en carrito..." style="width: 100%; padding-left: 32px; border-radius: 8px; font-size: 0.85rem; height: 34px;" />
              </div>
              <div v-if="productosVenta.length === 0" class="pos-cart-empty">
                <i class="pi pi-shopping-cart"></i>
              </div>
              <div v-else-if="productosVentaFiltrados.length === 0" class="pos-cart-empty" style="padding: 20px; text-align: center; color: #64748b;">
                <i class="pi pi-search" style="font-size: 1.5rem; margin-bottom: 8px;"></i>
                <div>No se encontraron productos</div>
              </div>
              <div v-else class="pos-cart-list">
                <div v-for="producto in productosVentaFiltrados" :key="producto.id_unico_imei || producto.codigo || producto._indexOriginal" class="pos-cart-item">
                  <div class="pos-cart-top">
                    <div class="pos-cart-name">{{ producto.nombre || producto.nombre_comercial }}</div>
                    <Button icon="pi pi-pencil" text rounded @click="editarProducto(producto)" />
                  </div>
                  <div class="pos-cart-controls">
                    <Button icon="pi pi-minus" class="pos-cart-btn pos-cart-btn-danger" :disabled="producto.categoria === 'CELULARES' || producto.nombre === 'DESCUENTO APLICADO'" @click="ajustarCantidadProducto(producto._indexOriginal, -1)" />
                    <span class="pos-cart-qty">{{ Number(producto.cantidad || 0).toFixed(1) }}</span>
                    <Button icon="pi pi-plus" class="pos-cart-btn pos-cart-btn-primary" :disabled="producto.categoria === 'CELULARES' || producto.nombre === 'DESCUENTO APLICADO'" @click="ajustarCantidadProducto(producto._indexOriginal, 1)" />
                    <div class="pos-cart-price">{{ datosConfiguracion.simbolo }}{{ Number(producto.total || 0).toFixed(2) }}</div>
                    <Button icon="pi pi-trash" class="pos-cart-btn pos-cart-btn-danger" @click="eliminarProducto(producto._indexOriginal)" />
                  </div>
                </div>
              </div>
            </div>

            <div class="pos-cart-bubble-wrapper">
              <button
                class="pos-cart-bubble"
                type="button"
                :aria-expanded="mostrarCarritoFlotante"
                @click="mostrarCarritoFlotante = !mostrarCarritoFlotante"
              >
                <i class="pi pi-shopping-cart"></i>
                <span v-if="totalProductosCarrito > 0" class="pos-cart-bubble-count">{{ totalProductosCarrito }}</span>
              </button>
              <div v-if="mostrarCarritoFlotante" class="pos-cart pos-cart-flyout">
                <div class="pos-cart-flyout-header">
                  <span>Carrito ({{ totalProductosCarrito }})</span>
                  <Button icon="pi pi-times" text rounded @click="mostrarCarritoFlotante = false" />
                </div>
                <div class="pos-cart-search" style="margin-bottom: 8px; position: relative;">
                  <i class="pi pi-search" style="position: absolute; left: 10px; top: 50%; transform: translateY(-50%); color: #94a3b8; font-size: 0.85rem; z-index: 1;"></i>
                  <InputText v-model="busquedaCarrito" placeholder="Buscar..." style="width: 100%; padding-left: 32px; border-radius: 8px; font-size: 13px; height: 34px;" />
                </div>
                <div v-if="productosVenta.length === 0" class="pos-cart-empty pos-cart-empty-flyout">
                  <i class="pi pi-shopping-cart"></i>
                  <span class="pos-cart-empty-text">Sin productos agregados</span>
                </div>
                <div v-else-if="productosVentaFiltrados.length === 0" class="pos-cart-empty pos-cart-empty-flyout">
                  <i class="pi pi-search"></i>
                  <span class="pos-cart-empty-text">No se encontraron productos</span>
                </div>
                <div v-else class="pos-cart-list">
                  <div v-for="producto in productosVentaFiltrados" :key="producto.id_unico_imei || producto.codigo || producto._indexOriginal" class="pos-cart-item">
                    <div class="pos-cart-top">
                      <div class="pos-cart-name">{{ producto.nombre || producto.nombre_comercial }}</div>
                      <Button icon="pi pi-pencil" text rounded @click="editarProducto(producto)" />
                    </div>
                    <div class="pos-cart-controls">
                      <Button icon="pi pi-minus" class="pos-cart-btn pos-cart-btn-danger" :disabled="producto.categoria === 'CELULARES' || producto.nombre === 'DESCUENTO APLICADO'" @click="ajustarCantidadProducto(producto._indexOriginal, -1)" />
                      <span class="pos-cart-qty">{{ Number(producto.cantidad || 0).toFixed(1) }}</span>
                      <Button icon="pi pi-plus" class="pos-cart-btn pos-cart-btn-primary" :disabled="producto.categoria === 'CELULARES' || producto.nombre === 'DESCUENTO APLICADO'" @click="ajustarCantidadProducto(producto._indexOriginal, 1)" />
                      <div class="pos-cart-price">{{ datosConfiguracion.simbolo }}{{ Number(producto.total || 0).toFixed(2) }}</div>
                      <Button icon="pi pi-trash" class="pos-cart-btn pos-cart-btn-danger" @click="eliminarProducto(producto._indexOriginal)" />
                    </div>
                  </div>
                </div>
                <div class="pos-cart-flyout-footer" style="padding-top: 10px; border-top: 1px solid #e5e7eb; margin-top: 8px;">
                  <Button label="Cerrar" icon="pi pi-times" severity="secondary" outlined size="small" style="width: 100%;" @click="mostrarCarritoFlotante = false" />
                </div>
              </div>
            </div>
          </div>
          <div class="pos-aside-footer" v-show="isDesktop || mostrarCarritoFlotante">
            <div class="pos-total">
              <div class="pos-total-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                <button class="pos-clear" @click="limpiarProductos">Limpiar carrito</button>
                <Button
                  :icon="mostrarTotalCard ? 'pi pi-eye-slash' : 'pi pi-eye'"
                  text
                  rounded
                  size="small"
                  @click="mostrarTotalCard = !mostrarTotalCard"
                  v-tooltip.left="mostrarTotalCard ? 'Ocultar detalles' : 'Mostrar detalles'"
                />
              </div>
              <div v-show="mostrarTotalCard">
                <div class="pos-total-breakdown">
                  <div class="pos-total-row">
                    <span>SubTotal</span>
                    <span>{{ datosConfiguracion.simbolo }}{{ Number(subtotal || 0).toFixed(2) }}</span>
                  </div>
                  <div class="pos-total-row">
                    <span>Descuento</span>
                    <span>{{ datosConfiguracion.simbolo }}{{ Number(descuento || 0).toFixed(2) }}</span>
                  </div>
                  <div class="pos-total-row">
                    <span>Impuestos</span>
                    <span>{{ datosConfiguracion.simbolo }}{{ Number(impuesto || 0).toFixed(2) }}</span>
                  </div>
                </div>
              </div>
              <div class="pos-total-row pos-total-row-strong">
                <span>Total</span>
                <span>{{ datosConfiguracion.simbolo }}{{ Number(total || 0).toFixed(2) }}</span>
              </div>
            </div>

            <div class="pos-footer-actions">
              <Button label="Ventas en proceso" class="pos-primary" @click="crearventaProceso" />
              <Button label="Facturar F2" class="pos-secondary" @click="visiblecobrar = true" />
            </div>
            <button class="pos-link" @click="visibleBuscarProducto = true">Ver existencia</button>
          </div>
        </aside>
      </div>
    </div>
  </div>

  <template v-if="false">
  <!-- HEADER MODERNO CON INFORMACIÓN DEL USUARIO -->
  <div class="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">

    <!-- CONTENEDOR PRINCIPAL -->
    <div class="px-4 lg:px-6 ">
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">

        <!-- COLUMNA PRINCIPAL - AREA DE TRABAJO -->
        <div class="lg:col-span-8 xl:col-span-9 space-y-6">

          <!-- CARD: INFORMACIÓN DEL CLIENTE Y CONFIGURACIÓN -->
          <Card class="shadow-lg border border-slate-200 dark:border-slate-700 hover:shadow-xl transition-shadow duration-300">
            <template #content>
              <div class="space-y-4">

                <!-- TIPO DE DOCUMENTO -->
                <div class="flex justify-center">
                  <OptionButtonTM
                    v-model="tipoFactura"
                    @change="tipodocumento"
                    :label="$t('Document Type').toUpperCase()"
                    :options="['factura', 'cotizacion']"
                  />
                </div>

                <!-- Usuario y Cliente en una sola línea -->
                <div class="flex flex-col lg:flex-row items-start lg:items-center gap-4">

                  <!-- Info del Usuario -->
                  <div class="flex items-center space-x-3">
                    <div class="w-10 h-10 rounded-full bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center text-white font-bold shadow-lg">
                      {{datosEmpresa.usuario.nombre.substring(0, 2).toUpperCase()}}
                    </div>
                    <div>
                      <p class="text-sm font-semibold text-slate-800 dark:text-slate-100">{{datosEmpresa.usuario.nombre}}</p>
                      <p class="text-xs text-slate-500 dark:text-slate-400">{{ documentoActual }}</p>
                    </div>
                  </div>

                  <!-- Cliente - Ocupa todo el espacio restante -->
                  <div class="flex-1 w-full">
                    <label class="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                      {{ $t('Client').toUpperCase() }} - {{precioFijado}}
                    </label>
                    <InputGroup>
                      <InputGroupAddon>
                        <Button icon="pi pi-sync" severity="secondary" text @click="fnResetearCliente" v-tooltip.top="$t('Reset')" />
                        <Button icon="pi pi-building" severity="secondary" text @click="fnVentaPropia" v-if="datosDefault.modo === 'FABRICA'" v-tooltip.top="$t('Own Sale')" />
                        <Button icon="pi pi-plus" severity="success" text @click="fnAgregarCliente" v-tooltip.top="$t('Add Client')" />
                        <Button icon="pi pi-times" severity="danger" text @click="limpiarCliente" v-tooltip.top="$t('Clear')" />
                      </InputGroupAddon>
                      <AutoComplete
                        v-model="clienteSelected"
                        optionLabel="nombre"
                        :placeholder="$t('Search client by name...')"
                        :suggestions="allClientes"
                        :virtualScrollerOptions="{ itemSize: 38 }"
                        @complete="searchCliente"
                        @option-select="fnCambiarClientes"
                        @focus="fnFocusClientes"
                        @blur="fnBlurClientes"
                        fluid
                        :autoOptionFocus="true"
                        :forceSelection="true"
                        dropdown
                        class="flex-1"
                      />
                    </InputGroup>
                  </div>

              </div>
              </div>
            </template>
          </Card>

          <!-- CARD: ÁREA DE BÚSQUEDA DE PRODUCTOS -->
          <Card class="shadow-lg border border-slate-200 dark:border-slate-700 hover:shadow-xl transition-shadow duration-300">
            <template #content>
              <div class="space-y-4">
                <div class="flex items-center justify-between mb-4">
                  <div class="flex items-center space-x-2">
                    <i class="pi pi-search text-xl text-teal-600 dark:text-teal-400"></i>
                    <h3 class="text-lg font-bold text-slate-800 dark:text-slate-100">{{ $t('Search Product') }}</h3>
                  </div>
                  <Button
                    @click="visibleAsistenteIA = true"
                    icon="pi pi-comment"
                    label="Asistente IA"
                    severity="help"
                    size="small"
                    v-tooltip.left="'Consultar medicamentos con IA'"
                  />
                </div>

                <!-- MODO NORMAL -->
                <div v-if="datosDefault.modo != 'FERRETERIA'">
                  <AutoCompletar
                    v-model="awesompleteproductoprincipal"
                    :list="listaBuscador"
                    :placeholder="$t('Type the name, code or scan barcode...')"
                    :mostrarBoton="true"
                    @onBotonClick="visibleBuscarProducto = true"
                    @selectComplete="handleSelectCompleteproductoprincipal"
                  />
                </div> 

                <!-- MODO FERRETERIA -->
                <div v-if="datosDefault.modo == 'FERRETERIA'" class="grid grid-cols-1 md:grid-cols-12 gap-4">
                  <div class="md:col-span-12">
                    <label class="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">{{ $t('Searcher') }}</label>
                    <awesomplete
                      class="form-control"
                      v-model="awesompleteproductoprincipal"
                      @change="fnAwesompleteproductoprincipal"
                      @selectComplete="buscadorFerreteria"
                      ref="awesompleteInput"
                      :list="listaBuscador"
                      style="border: 2px #f0fdf4 solid;border-radius: 5px;">
                    </awesomplete>
                  </div>

                  <div class="md:col-span-4">
                    <label class="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">{{ $t('Name') }}</label>
                    <InputText type="text" class="form-control sistemaNN" v-model="nombreProductFerreteria" id="nombreNN" readonly fluid />
                  </div>

                  <div class="md:col-span-2">
                    <label class="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">{{ $t('Unit') }}</label>
                    <InputText type="text" class="form-control sistemaNN" v-model="empaqueProductFerreteria" id="unidadNN" fluid />
                  </div>

                  <div class="md:col-span-2">
                    <label class="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">{{ $t('Quantity') }}</label>
                    <InputText type="text" class="form-control" v-solonumeros v-decimales v-numeroFocusinOut v-model="cantidadProductoBuscado" ref="cantidadProductFerreteria"  data-siguiente="precioFerreteria" @keydown.enter="focusNextField" id="cantidadNN" />
                  </div>

                  <div class="md:col-span-4">
                    <label class="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">{{ $t('Price') }}</label>
                    <InputGroup>
                      <InputText
                        type="text"
                        class="soloNumero sistemaNN"
                        v-solonumeros
                        v-decimales
                        v-numeroFocusinOut
                        v-model="precioProductFerreteria"
                        @keydown.enter="fnAgregarProdFerreteria"
                        @keydown.space="fnPrecioProdFerreteria"
                        id="precioFerreteria"
                      />
                      <InputGroupAddon>
                        <Button @click="fnAgregarProdFerreteria" icon="pi pi-check" severity="success" v-tooltip.top="$t('Add')" />
                        <Button @click="borrarProductoBuscador = true" icon="pi pi-trash" severity="danger" v-tooltip.top="$t('Delete')" />
                        <Button @click="visibleBuscarProducto = true" icon="pi pi-search" severity="info" v-tooltip.top="$t('Search')" />
                      </InputGroupAddon>
                    </InputGroup>
                  </div>
                </div>
              </div>
            </template>
          </Card>

          <!-- CARD: TABLA DE PRODUCTOS AGREGADOS -->
         <!-- CARD: TABLA DE PRODUCTOS AGREGADOS -->
          <Card class="shadow-lg border border-slate-200 dark:border-slate-700 hover:shadow-xl transition-shadow duration-300">
            <template #content>
              <div class="space-y-4">
                <div class="flex items-center justify-between mb-4">
                  <div class="flex items-center space-x-2">
                    <i class="pi pi-list text-xl text-teal-600 dark:text-teal-400"></i>
                    <h3 class="text-lg font-bold text-slate-800 dark:text-slate-100">
                      {{ $t('Products Added') }}
                      <span class="ml-2 px-3 py-1 bg-teal-100 dark:bg-teal-900 text-teal-800 dark:text-teal-200 rounded-full text-sm font-semibold">
                        {{cantidadProductosLocal}}
                      </span>
                    </h3>
                  </div>
                </div>

                <div class="rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
                  <table class="min-w-full text-sm text-left text-slate-700 dark:text-slate-200">
                    <thead class="bg-gradient-to-r from-teal-50 to-emerald-50 dark:from-slate-800 dark:to-slate-700">
                      <tr>
                        <th scope="col" class="px-4 py-3 font-bold text-center hidden md:table-cell text-slate-700 dark:text-slate-200">{{ $t('CODE') }}</th>
                        <th scope="col" class="px-4 py-3 font-bold text-slate-700 dark:text-slate-200">{{ $t('DESCRIPTION') }}</th>
                        <th scope="col" class="px-4 py-3 font-bold text-center text-slate-700 dark:text-slate-200">{{ $t('QTY') }}</th>
                        <th scope="col" class="px-4 py-3 font-bold text-center text-slate-700 dark:text-slate-200">{{ $t('PRICE') }}</th>
                        <th scope="col" class="px-4 py-3 font-bold text-center hidden lg:table-cell text-slate-700 dark:text-slate-200">{{ datosConfiguracion.nombre_impuesto }}</th>
                        <th scope="col" class="px-4 py-3 font-bold text-center hidden lg:table-cell text-slate-700 dark:text-slate-200">{{ $t('DISC.') }}</th>
                        <th scope="col" class="px-4 py-3 font-bold text-center text-slate-700 dark:text-slate-200">{{ $t('TOTAL') }}</th>
                      </tr>
                    </thead>

                    <tbody id="productosDesplegados">
                      <tr
                        class="productoAgregado group relative border-b border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors duration-200"
                        v-for="(producto, index) in productosVenta"
                        :key="producto.codigo"
                        :data-codigo="producto.codigo"
                      >
                        <td class="px-4 py-3 text-center font-mono text-xs font-semibold hidden md:table-cell text-slate-600 dark:text-slate-300">
                          {{ producto.codigo }}
                        </td>

                        <td class="px-4 py-3">
                          <!-- Botones flotantes de acción (posicionado relativo al <tr>) -->
                          <div class="fixed-to-row action-buttons bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200
  dark:border-slate-600 p-2 max-w-xs">
                            <div class="flex flex-col gap-2">
                              <!-- Botones principales -->
                              <div class="flex items-center justify-center gap-1 flex-shrink-0">
                                <Button
                                  icon="pi pi-pencil"
                                  size="small"
                                  severity="info"
                                  text
                                  rounded
                                  @click.prevent="editarProducto(producto)"
                                  v-tooltip.left="'Editar'"
                                />
                                <Button
                                  icon="pi pi-trash"
                                  size="small"
                                  severity="danger"
                                  text
                                  rounded
                                  @click.prevent="eliminarProducto(index)"
                                  v-tooltip.left="'Eliminar'"
                                />
                              </div>

                              <!-- Menú de opciones avanzadas para administradores -->
                              <div v-if="usuarioLocal.usuario === 'Administrador' || usuarioLocal.usuario === 'Soporte' || usuarioLocal.usuario === 'Gerente'" class="border-t border-slate-200 dark:border-slate-600 pt-2">
                                <div class="flex flex-wrap gap-1 justify-center max-h-24 overflow-y-auto">
                                  <Button @click.prevent="fmImpuestoIncluido(producto.codigo)" size="small" severity="secondary" text rounded class="!text-xs !px-2 !py-1" v-tooltip.left="'Impuesto Incluido'">
                                    <i class="fas icon-balance-scale"></i>
                                  </Button>
                                  <Button @click.prevent="fnPrecioNormal(producto.codigo)" size="small" severity="secondary" text rounded class="!text-xs !px-2 !py-1" label="PN" v-tooltip.left="$t('Normal Price')" />
                                  <Button @click.prevent="fnPrecioMinimo(producto.codigo)" size="small" severity="secondary" text rounded class="!text-xs !px-2 !py-1" label="PM" v-tooltip.left="$t('Minimum Price')" />
                                  <Button @click.prevent="fnXmayor(producto.codigo)" size="small" severity="secondary" text rounded class="!text-xs !px-2 !py-1" label="XM" v-tooltip.left="$t('Wholesale')" />
                                  <Button @click.prevent="fnOferta(producto.codigo)" size="small" severity="secondary" text rounded class="!text-xs !px-2 !py-1" label="OF" v-tooltip.left="$t('Offer')" />
                                  <Button @click.prevent="fnDescuento(producto)" size="small" severity="warning" text rounded class="!text-xs !px-2 !py-1" label="DE" v-tooltip.left="$t('Discount')" />
                                </div>
                              </div>
                            </div>
                          </div>
                          <Button :label="producto.nombre" :codigo="producto.codigo" @click="fnInfoProduct(producto.codigo)" variant="link" />
<!--                           <a
                            href="#"
                            :codigo="producto.codigo"
                            @click="fnInfoProduct(producto.codigo)"
                            class="text-teal-600 dark:text-teal-400 hover:text-blue-800 dark:hover:text-blue-300 hover:underline font-medium transition-colors"
                          >
                            {{ producto.nombre }}
                          </a> -->
                        </td>

                        <td class="px-4 py-3 text-center">
                          <InputNumber
                            v-model.number="producto.cantidad"
                            inputId="horizontal-buttons"
                            :min="0"
                            :step="1"
                            :minFractionDigits="2"
                            showButtons
                            buttonLayout="horizontal"
                            size="small"
                            incrementButtonClass="!h-8"
                            decrementButtonClass="!h-8"
                            inputClass="!w-20 !h-8 text-center text-sm"
                            @update:modelValue="() => { calcularTotalFactura(); fnActualizarGuardado(); }"
                          >
                            <template #incrementbuttonicon>
                              <span class="pi pi-plus text-xs" />
                            </template>
                            <template #decrementbuttonicon>
                              <span class="pi pi-minus text-xs" />
                            </template>
                          </InputNumber>
                        </td>

                        <td class="px-4 py-3 text-center font-semibold text-slate-700 dark:text-slate-300">
                          ${{ Number(producto.precio_venta).toFixed(2) }}
                        </td>

                        <td class="px-4 py-3 text-center hidden lg:table-cell text-slate-600 dark:text-slate-400">
                          ${{ calcularImpuesto(producto) }}
                        </td>

                        <td class="px-4 py-3 text-center hidden lg:table-cell text-orange-600 dark:text-orange-400 font-semibold">
                          ${{ Number(producto.descuento).toFixed(2) }}
                        </td>

                        <td class="px-4 py-3 text-center font-bold text-green-700 dark:text-green-400 text-base">
                           ${{ parseFloat(producto.total).toFixed(2) }}
                        </td>

                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </template>
          </Card>
          <!-- CARD: NOTA -->
          <Card class="shadow-lg border border-slate-200 dark:border-slate-700 hover:shadow-xl transition-shadow duration-300">
            <template #content>
              <div class="space-y-4">
                <div class="flex items-center space-x-2 mb-4">
                  <i class="pi pi-file-edit text-xl text-yellow-600 dark:text-yellow-400"></i>
                  <h3 class="text-lg font-bold text-slate-800 dark:text-slate-100">Nota / Garantía</h3>
                </div>

                <div class="space-y-3">
                  <InputGroup>
                    <Select
                      v-model="garantiaSelect"
                      :options="garantiaArray"
                      optionLabel="referencia"
                      optionValue="referencia"
                      :placeholder="$t('Select a warranty')"
                      class="w-full"
                      @change="fnNota"
                    >
                      <template #value="slotProps">
                        <span v-if="slotProps.value">{{ slotProps.value }}</span>
                        <span v-else class="text-slate-400">Ninguna</span>
                      </template>
                    </Select>
                    <InputGroupAddon>
                      <Button
                        icon="pi pi-plus"
                        @click="fnAgregarNota"
                        severity="success"
                        v-tooltip.top="$t('Add') + ' ' + $t('Note')"
                      />
                    </InputGroupAddon>
                  </InputGroup>

                  <Textarea
                    v-model="nota"
                    id="nuevaNota"
                    name="nuevaNota"
                    rows="4"
                    class="w-full"
                    :placeholder="$t('Write here any additional notes for this sale...')"
                  />
                </div>
              </div>
            </template>
          </Card>

        </div>
        <!-- FIN COLUMNA PRINCIPAL -->

        <!-- COLUMNA LATERAL DERECHA - TOTALES Y ACCIONES -->
        <div class="lg:col-span-4 xl:col-span-3">
          <div class="sticky top-24 space-y-6">

            <!-- CARD: RESUMEN DE TOTALES -->
            <Card class="shadow-2xl border-2 border-teal-300 dark:border-teal-700 bg-gradient-to-br from-white to-teal-50 dark:from-slate-800 dark:to-slate-900">
              <template #content>


               <div class="grid grid-cols-12 gap-4">
                                   <!-- Impuestos -->
                  <div class="col-span-12 md:col-span-6">
                    <label class="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">{{ $t('TAXES') }}</label>
                    <Select
                      v-model="tipoImpuestoFactura"
                      :options="['NO','INCLUIDO','AGREGADO']"
                      class="w-full"
                      @change="fncambioTipoImpuesto"
                    />
                  </div>

                  <!-- Comprobante -->
                  <div class="col-span-12 md:col-span-6">
                    <label class="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">{{ $t('RECEIPT') }}</label>
                    <InputGroup>
                      <Select
                        v-model="comprobante"
                        @change="fnCambiarComprobante"
                        fluid
                        :options="['FISCAL','FINAL','GUBERNAMENTAL','REGIMEN ESPECIAL','NORMAL']"
                        :placeholder="$t('RECEIPT')"
                      />
                      <InputGroupAddon>
                        <Button icon="pi pi-sync" severity="secondary" text @click="fnResetComprobante" v-tooltip.top="$t('Reset')" />
                      </InputGroupAddon>
                    </InputGroup>
                  </div>

                  <!-- Método de Pago -->
                  <div class="col-span-12 md:col-span-12">
                    <label class="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">{{ $t('Payment Method').toUpperCase() }}</label>
                    <InputGroup>
                      <Select
                        v-model="metodoPago"
                        :options="metodoPagoOptions"
                        optionLabel="nombre"
                        optionValue="nombre"
                        :placeholder="$t('Payment Method')"
                        class="w-full"
                        @change="fncambioMetodoPago"
                      />
                      <InputGroupAddon>
                        <Button icon="pi pi-sync" severity="secondary" text @click="fnResetMetodoPago" v-tooltip.top="$t('Reset')" />
                      </InputGroupAddon>
                    </InputGroup>
                  </div>
               </div>

                <div class="space-y-4">
                  <div class="flex items-center justify-center space-x-2 mb-4 pb-3 border-b-2 border-blue-200 dark:border-blue-800">
                    <i class="pi pi-calculator text-2xl text-teal-600 dark:text-teal-400"></i>
                    <h3 class="text-xl font-bold text-slate-800 dark:text-slate-100">Resumen</h3>
                  </div>

                  <div class="space-y-3">
                    <!-- Subtotal -->
                    <div class="flex justify-between items-center p-3 bg-white dark:bg-slate-800 rounded-lg shadow-sm">
                      <span class="text-sm font-semibold text-slate-600 dark:text-slate-400">Subtotal:</span>
                      <span class="text-lg font-bold text-slate-800 dark:text-slate-200">${{ subtotal }}</span>
                    </div>

                    <!-- Impuestos -->
                    <div class="flex justify-between items-center p-3 bg-white dark:bg-slate-800 rounded-lg shadow-sm">
                      <span class="text-sm font-semibold text-slate-600 dark:text-slate-400">{{ datosConfiguracion.nombre_impuesto }}:</span>
                      <span class="text-lg font-bold text-teal-600 dark:text-teal-400">${{ impuesto }}</span>
                    </div>

                    <!-- Descuento -->
                    <div class="flex justify-between items-center p-3 bg-white dark:bg-slate-800 rounded-lg shadow-sm">
                      <span class="text-sm font-semibold text-slate-600 dark:text-slate-400">Descuento:</span>
                      <span class="text-lg font-bold text-orange-600 dark:text-orange-400">-${{ descuento }}</span>
                    </div>

                    <!-- Divider -->
                    <div class="border-t-2 border-dashed border-slate-300 dark:border-slate-600 my-3"></div>

                    <!-- Total -->
                    <div class="flex justify-between items-center p-4 bg-gradient-to-r from-green-500 to-emerald-600 dark:from-green-700 dark:to-emerald-800 rounded-xl shadow-lg">
                      <span class="text-base font-bold text-white">{{ $t('TOTAL') }}:</span>
                      <span class="text-3xl font-black text-white">${{ total }}</span>
                    </div>

                    <!-- Ganancia -->
<!--                     <div class="flex justify-between items-center p-3 bg-purple-100 dark:bg-purple-900 rounded-lg">
                      <span class="text-sm font-semibold text-purple-700 dark:text-purple-300">Ganancia:</span>
                      <span class="text-lg font-bold text-purple-800 dark:text-purple-200">${{ gananciaFN }}</span>
                    </div> -->
                  </div>

                  <!-- Botones de Acción -->
                  <div class="space-y-3 mt-6">
                    <Button
                      :label="$t('CHARGE (F4)')"
                      icon="pi pi-shopping-cart"
                      @click="visiblecobrar = true"
                      class="w-full !py-4 !text-lg font-bold"
                      severity="success"
                      size="large"
                    />

                    <div class="grid grid-cols-2 gap-3">
                      <Button
                        :label="$t('POS')"
                        icon="pi pi-tablet"
                        @click="visiblePOS = true"
                        severity="info"
                        outlined
                        class="w-full"
                        v-if="datosDefault.activar_pos == 'true'"
                      />
                      <Button
                        :label="$t('Tables')"
                        icon="pi pi-table"
                        @click="visibleMESAS = true"
                        severity="info"
                        outlined
                        class="w-full"
                        v-if="datosDefault.modo === 'RESTAURANTE'"
                      />
                    </div>

                    <Button
                      :label="$t('Discount')"
                      icon="pi pi-percentage"
                      @click="visibleDescuento = true"
                      severity="warning"
                      outlined
                      class="w-full"
                    />

                    <Button
                      :label="$t('N. Credit')"
                      icon="pi pi-money-bill"
                      @click="visibleNotaCredito = true"
                      severity="warning"
                      outlined
                      class="w-full"
                    />

                    <Button
                      :label="$t('Clear All')"
                      icon="pi pi-trash"
                      @click="limpiarProductos"
                      severity="danger"
                      outlined
                      class="w-full"
                    />
                  </div>
                </div>
              </template>
            </Card>

            <!-- CARD: ACCIONES RÁPIDAS -->
            <Card class="shadow-lg border border-slate-200 dark:border-slate-700">
              <template #content>
                <div class="space-y-3">
                  <h4 class="text-sm font-bold text-slate-700 dark:text-slate-300 mb-3">{{ $t('Actions') }}</h4>

                  <div class="grid grid-cols-2 gap-2">
                    <Button
                      icon="pi pi-list"
                      :label="$t('Sales')"
                      @click="visibleSideBar = true"
                      size="small"
                      severity="secondary"
                      outlined
                      class="w-full"
                    />
                    <Button
                      icon="pi pi-users"
                      :label="$t('Client')"
                      @click="fnAgregarCliente"
                      size="small"
                      severity="secondary"
                      outlined
                      class="w-full"
                    />
                    <Button
                      icon="pi pi-search"
                      :label="$t('Search')"
                      @click="visibleBuscarProducto = true"
                      size="small"
                      severity="secondary"
                      outlined
                      class="w-full"
                    />
                    <Button
                      icon="pi pi-file-edit"
                      :label="$t('Note')"
                      @click="visibleNota = true"
                      size="small"
                      severity="secondary"
                      outlined
                      class="w-full"
                    />
                  </div>

                  <div v-if="datosDefault.modo === 'FABRICA'" class="mt-3">
                    <Button
                      icon="pi pi-box"
                      :label="$t('Measures')"
                      @click="modalMedidas = true"
                      size="small"
                      severity="info"
                      outlined
                      class="w-full"
                    />
                  </div>

                </div>
              </template>
            </Card>

          </div>
        </div>
        <!-- FIN COLUMNA LATERAL -->

      </div>
    </div>

  </div>
  <!-- FIN CONTENEDOR PRINCIPAL -->
</template>
<!-- ////////////////////////////////////////////////////////////////////////////////////////// -->
    <Toast />

  <button
    v-if="mostrarScrollTop"
    class="pos-scroll-top"
    type="button"
    @click="irArriba"
  >
    <i class="pi pi-arrow-up"></i>
  </button>

<!-- ////////////////////////////////////////////////////////////////////////////////////////// -->
<Dialog v-model:visible="visibleComprobanteRapido" modal header="Comprobante" :style="{ width: '26rem' }">
  <div class="pos-modal">
    <div class="pos-modal-title">Selecciona comprobante</div>
    <div class="pos-comprobante-actions">
      <Button label="Fiscal (B01)" class="pos-primary" @click="aplicarComprobanteRapido('FISCAL')" />
      <Button label="Consumo (B02)" class="pos-secondary" @click="aplicarComprobanteRapido('FINAL')" />
      <Button label="Sin comprobante" severity="secondary" text @click="aplicarComprobanteRapido('NORMAL')" />
    </div>
  </div>
</Dialog>

<!-- ////////////////////////////////////////////////////////////////////////////////////////// -->
<Dialog v-model:visible="visibleProductoModal" modal :position="position" header="Detalles del Producto" :style="{ width: '58rem' }" class="pos-modal-dialog">
  <div class="pos-product-modal">
    <div class="pos-product-hero">
      <div class="pos-product-hero-main">
        <div class="pos-product-badge">
          <i class="pi pi-box"></i>
          <span>{{ productoModal.categoria || 'PRODUCTO' }}</span>
        </div>
        <div class="pos-product-title">{{ productoModal.nombre || productoModal.nombre_comercial || 'Sin nombre' }}</div>
        <div class="pos-product-subtitle">{{ productoModal.descripcion || productoModal.codigo || 'Configura cantidad y precio antes de agregar' }}</div>
      </div>
      <div class="pos-product-total">
        <span class="pos-product-total-label">Precio actual</span>
        <span class="pos-product-total-value">{{ datosConfiguracion.simbolo }}{{ Number(productoModal.precio_venta || 0).toFixed(2) }}</span>
      </div>
    </div>
    <div class="pos-product-summary">
      <div class="pos-product-summary-card">
        <span class="pos-product-summary-label">Stock</span>
        <span class="pos-product-summary-value">{{ productoModal.stock || 0 }}</span>
      </div>
      <div class="pos-product-summary-card">
        <span class="pos-product-summary-label">Código</span>
        <span class="pos-product-summary-value">{{ productoModal.codigo || '-' }}</span>
      </div>
      <div class="pos-product-summary-card">
        <span class="pos-product-summary-label">Costo</span>
        <span class="pos-product-summary-value">{{ datosConfiguracion.simbolo }}{{ Number(productoModal.precio_compra || 0).toFixed(2) }}</span>
      </div>
    </div>
    <div class="pos-product-layout">
      <div class="pos-product-quantity-card">
        <div class="pos-section-heading">
          <span>Cantidad</span>
          <small>Ajusta la cantidad a vender</small>
        </div>
        <div class="pos-modal-qty">
          <Button icon="pi pi-minus" class="pos-modal-qty-btn pos-modal-qty-btn-danger" @click="decrementarCantidadProductoModal" />
          <div class="pos-modal-qty-input">
        <InputText
          type="text"
          v-model.number="cantidadProductoModal"
          v-solonumeros
          v-decimales
          v-numeroFocusinOut
          @blur="validarCantidadProductoModal"
          class="pos-input pos-product-qty-field"
        />
          </div>
          <Button icon="pi pi-plus" class="pos-modal-qty-btn" @click="incrementarCantidadProductoModal" />
        </div>
      </div>
      <div v-if="productoModal.categoria !== 'CELULARES'" class="pos-product-pricing-card">
        <div class="pos-section-heading">
          <span>Selector de Precio</span>
          <small>Elige una tarifa rapida o ajusta un precio manual</small>
      <div>Código: {{ productoModal.codigo || productoModal.codigo || '-' }}</div>
      
        </div>
        <div class="pos-price-grid">
          <button type="button" class="pos-price-option" @click="seleccionarPrecioModal(1)">
            <span class="pos-price-option-title">Precio 1</span>
            <strong>{{ datosConfiguracion.simbolo }}{{ modalPrecio1 }}</strong>
          </button>
          <button type="button" class="pos-price-option" @click="seleccionarPrecioModal(2)">
            <span class="pos-price-option-title">Precio 2</span>
            <strong>{{ datosConfiguracion.simbolo }}{{ modalPrecio2 }}</strong>
          </button>
          <button type="button" class="pos-price-option" @click="seleccionarPrecioModal(3)">
            <span class="pos-price-option-title">Precio 3</span>
            <strong>{{ datosConfiguracion.simbolo }}{{ modalPrecio3 }}</strong>
          </button>
        </div>
        <div class="pos-price-manual-card">
          <label class="pos-label">Precio Manual</label>
          <InputNumber
            v-model="productoModal.precio_venta"
            inputClass="pos-input pos-input-compact"
            :minFractionDigits="2"
            :maxFractionDigits="2"
          />
        </div>
      </div>
    </div>
    <!-- DataTable de IMEI -->
    <div v-if="imeiProductoModal.length > 0" class="mt-3">
      <div class="flex justify-between items-center mb-2">
        <div class="text-sm font-semibold text-orange-500">
          <i class="pi pi-mobile mr-1"></i> IMEI Disponibles ({{ imeiProductoModal.length }})
        </div>
        <div v-if="imeisSeleccionadosModal.length > 0" class="text-sm text-green-600 font-semibold">
          <i class="pi pi-check-circle mr-1"></i> {{ imeisSeleccionadosModal.length }} seleccionado(s)
        </div>
      </div>
      <!-- Buscador de IMEI -->
      <div class="mb-2">
        <span class="p-input-icon-left w-full">
          <i class="pi pi-search" />
          <InputText
            v-model="filtroImeiModal"
            placeholder="Buscar IMEI..."
            class="w-full text-sm"
            style="padding-left: 2.5rem;"
          />
        </span>
      </div>
      <DataTable
        :value="imeiProductoModalFiltrados"
        v-model:selection="imeisSeleccionadosModal"
        dataKey="imei"
        size="small"
        scrollable
        scrollHeight="200px"
        class="text-xs"
      >
        <Column selectionMode="multiple" headerStyle="width: 3rem"></Column>
        <Column field="imei" header="IMEI" style="min-width: 130px"></Column>
        <Column header="Seleccionar Precio" style="min-width: 420px">
          <template #body="{ data }">
            <div class="flex gap-1 flex-wrap items-center">
              <Button
                :label="`P1: ${datosConfiguracion.simbolo}${Number(data.precio_venta || 0).toFixed(2)}`"
                size="small"
                :severity="data.precio_seleccionado === 'precio_venta' ? 'success' : 'secondary'"
                :outlined="data.precio_seleccionado !== 'precio_venta'"
                @click="seleccionarPrecioImei(data, 'precio_venta')"
                class="text-xs px-2 py-1"
              />
              <Button
                :label="`P2: ${datosConfiguracion.simbolo}${Number(data.precio_min || 0).toFixed(2)}`"
                size="small"
                :severity="data.precio_seleccionado === 'precio_min' ? 'success' : 'secondary'"
                :outlined="data.precio_seleccionado !== 'precio_min'"
                @click="seleccionarPrecioImei(data, 'precio_min')"
                class="text-xs px-2 py-1"
              />
              <Button
                :label="`P3: ${datosConfiguracion.simbolo}${Number(data.precio_xmayor || 0).toFixed(2)}`"
                size="small"
                :severity="data.precio_seleccionado === 'precio_xmayor' ? 'success' : 'secondary'"
                :outlined="data.precio_seleccionado !== 'precio_xmayor'"
                @click="seleccionarPrecioImei(data, 'precio_xmayor')"
                class="text-xs px-2 py-1"
              />
              <div class="flex items-center gap-1">
                <InputNumber
                  v-model="data.precio_manual"
                  :minFractionDigits="2"
                  :maxFractionDigits="2"
                  :min="0"
                  inputClass="text-xs w-20 px-1 py-1"
                  :inputStyle="{
                    width: '70px',
                    textAlign: 'right',
                    borderColor: (data.precio_manual || 0) < (data.precio_compra || productoModal?.precio_compra || 0) ? '#ef4444' : undefined,
                    backgroundColor: (data.precio_manual || 0) < (data.precio_compra || productoModal?.precio_compra || 0) ? '#fef2f2' : undefined
                  }"
                  @focus="seleccionarPrecioImei(data, 'precio_manual')"
                  v-tooltip.top="'Mín: ' + datosConfiguracion.simbolo + Number(data.precio_compra || productoModal?.precio_compra || 0).toFixed(2)"
                />
                <Button
                  icon="pi pi-check"
                  size="small"
                  :severity="data.precio_seleccionado === 'precio_manual' ? 'success' : 'secondary'"
                  :outlined="data.precio_seleccionado !== 'precio_manual'"
                  @click="seleccionarPrecioImei(data, 'precio_manual')"
                  class="text-xs px-2 py-1"
                  v-tooltip="'Usar precio manual'"
                />
              </div>
            </div>
          </template>
        </Column>
        <Column header="Precio Final" style="min-width: 100px">
          <template #body="{ data }">
            <span class="font-bold text-green-600">
              {{ datosConfiguracion.simbolo }}{{ obtenerPrecioFinalImei(data) }}
            </span>
          </template>
        </Column>
      </DataTable>
    </div>

    <div class="pos-modal-actions pos-modal-actions-main">
      <Button label="Consultar IA" icon="pi pi-sparkles" class="pos-secondary" @click="consultarIAProductoModal" />
      <Button label="Editar producto" icon="pi pi-pencil" class="pos-secondary" @click="abrirEditarProductoModal" />
      <Button label="Agregar al carrito" icon="pi pi-shopping-cart" class="pos-primary" @click="agregarProductoDesdeModal" />
    </div>
  </div>

</Dialog>

<Dialog v-model:visible="visibleEditarProductoModal" modal :position="position" header="Editar Producto" :style="{ width: '34rem' }">
  <div class="pos-modal">
    <div class="pos-modal-title">Editar producto</div>
    <div class="pos-modal-field">
      <label class="pos-label">Nombre comercial</label>
      <InputText v-model="productoEditando.nombre" class="pos-input" />
    </div>
    <div class="pos-modal-field">
      <label class="pos-label">Stock actual</label>
      <InputText v-model="productoEditando.stock" class="pos-input" v-solonumeros v-decimales v-numeroFocusinOut />
    </div>
    <div class="pos-modal-field">
      <label class="pos-label">Precio venta</label>
      <InputText v-model="productoEditando.precio_venta" class="pos-input" v-solonumeros v-decimales v-numeroFocusinOut />
    </div>
    <div class="pos-modal-field">
      <label class="pos-label">Precio mayorista</label>
      <InputText v-model="productoEditando.precio_xmayor" class="pos-input" v-solonumeros v-decimales v-numeroFocusinOut />
    </div>
    <div class="pos-modal-field">
      <label class="pos-label">Vencimiento</label>
      <InputText v-model="productoEditando.vencimiento" class="pos-input" />
    </div>
    <div class="pos-footer-actions">
      <Button label="Cancelar" text severity="secondary" @click="visibleEditarProductoModal = false" />
      <Button label="Guardar cambios" class="pos-primary" @click="guardarEdicionProducto" />
    </div>
  </div>
</Dialog>

<Dialog v-model:visible="visibleprecio" modal :position="position" :header="$t('Edit Product')" :style="{ width: '32rem' }" class="pos-modal-dialog">
  <template #header>
    <div class="inline-flex align-items-center justify-content-center gap-2">
      <span class="font-bold white-space-nowrap">Producto</span>
    </div>
  </template>

  <div class="pos-modal">
    <div class="pos-modal-title">Producto</div>
    <div class="pos-modal-name">{{ productoSeleccionado.nombre || productoSeleccionado.nombre }}</div>

    <div class="pos-modal-qty">
      <Button icon="pi pi-plus" class="pos-modal-qty-btn" @click="incrementarCantidadModal" />
      <div class="pos-modal-qty-input">
        <label class="pos-label">Cantidad</label>
        <InputNumber
          v-model.number="productoSeleccionado.cantidad"
          :min="1"
          :step="1"
          :minFractionDigits="0"
          inputClass="pos-input"
          @update:modelValue="actualizarProductoSeleccionado"
        />
      </div>
      <Button icon="pi pi-minus" class="pos-modal-qty-btn pos-modal-qty-btn-danger" @click="decrementarCantidadModal" />
    </div>

    <div class="pos-modal-prices">
      <div>P1: {{ datosConfiguracion.simbolo }}{{ modalPrecio1 }}</div>
      <div>P2: {{ datosConfiguracion.simbolo }}{{ modalPrecio2 }}</div>
      <div>P3: {{ datosConfiguracion.simbolo }}{{ modalPrecio3 }}</div>
    </div>

    <div class="pos-modal-discount">Descuento: {{ modalDescuentoPorcentaje }}%</div>
    <Button label="Autorizar Descuento" class="pos-modal-discount-btn" @click="fnDescuento(productoSeleccionado)" />

    <div class="pos-modal-field">
      <label class="pos-label">Precio</label>
      <InputText
        v-model="productoSeleccionado.precio_venta"
        class="pos-input"
        v-solonumeros
        v-decimales
        v-numeroFocusinOut
        @input="calcularPrecioFinal"
      />
    </div>

    <div class="pos-modal-summary">
      <span>Sub Total: {{ datosConfiguracion.simbolo }}{{ modalSubtotal }}</span>
      <span>Desc.: {{ datosConfiguracion.simbolo }}{{ modalDescuento }}</span>
      <span>Imp.: {{ datosConfiguracion.simbolo }}{{ modalImpuesto }}</span>
      <span>Total: {{ datosConfiguracion.simbolo }}{{ modalTotal }}</span>
    </div>

    <div class="pos-modal-field">
      <label class="pos-label">Nota</label>
      <Textarea v-model="productoSeleccionado.nota" rows="3" class="pos-input" />
    </div>
  </div>

  <div class="pos-modal-advanced">
  <div class="grid grid-cols-12 gap-4">

<div class="col-span-12 form-group">
<fieldset class="border p-3 rounded mb-2">
        <legend class="float-none w-auto px-2">Elige el Precio</legend>
  <div class="grid grid-cols-12 gap-4">
    <div class="col-span-4 sm:col-span-4 md:col-span-4 form-group">
      <label>CODIGO</label>
      <input type="text" class="form-control" v-model="productoSeleccionado.codigo" readonly>
    </div>
    <div class="col-span-4 sm:col-span-4 md:col-span-8 form-group">
      <label>NOMBRE</label>
      <input type="text" class="form-control" v-model="productoSeleccionado.nombre" readonly>
    </div>

    <div class="col-span-4 sm:col-span-2 md:col-span-3 form-group">
      <label>P. Normal</label>
      <input type="text" class="form-control" v-model="productoSeleccionado.precio_venta" readonly>
    </div>
    <div class="col-span-4 sm:col-span-3 md:col-span-3 form-group">
      <label>P. Mínimo</label>
      <input type="text" class="form-control" v-model="productoSeleccionado.precio_min" readonly>
    </div>
    <div class="col-span-4 sm:col-span-3 md:col-span-3 form-group">
      <label>X Mayor</label>
      <input type="text" class="form-control" v-model="productoSeleccionado.precio_xmayor" readonly>
    </div>

    <div class="col-span-4 sm:col-span-3 md:col-span-3 form-group">
      <label>Otro</label>
      <input type="text" class="form-control" v-solonumeros v-decimales v-numeroFocusinOut v-model="productoSeleccionado.precio_otro">
    </div>
    </div>

          <div class="col-span-12 m-2">
            <div class="flex justify-center">
               <OptionButtonTM v-model="elegirPrecio" @change="fnElegirPrecio" :options="['Normal','Minimo','X Mayor','Oferta','Costo']" aria-labelledby="basic"  />
           </div>
          </div>
</fieldset>
    </div>

<!-- <div class="col-span-12">
  <fieldset class="border p-3 rounded mb-2">
    <legend class="float-none w-auto px-2">Descuento?</legend>
    <div class="grid grid-cols-12 gap-4">


      <div class="col-span-4 form-group">
        <label for="descuento">Entero</label>
        <input type="text" class="form-control" v-solonumeros v-decimales v-numeroFocusinOut v-model="productoSeleccionado.descuento" @input="actualizarPorcentajeDescuento">
      </div>
      <div class="col-span-4 form-group">
        <label for="descuento_porcentaje">Porcentaje %</label>
        <input type="text" class="form-control" v-solonumeros v-decimales v-numeroFocusinOut v-model="productoSeleccionado.descuento_porcentaje" @input="actualizarDescuento">
      </div>
      <div class="col-span-4">
        <label for="btnagregarprecio">Aplicar</label>
        <a href="#" class="btn btn-dark w-100" @click.prevent="aplicarDescuento">Descuento</a>
      </div>
      <div class="col-span-12 mt-3">
        <a href="#" class="btn btn-success" @click.prevent="fnProductoenCero">Producto en Cero</a>
        <a href="#" class="btn btn-success ml-3" @click.prevent="fnGererarGastoProduct">Generar un Gasto</a>
      </div>
    </div>
  </fieldset>
</div>
 -->

    <div class="col-span-12">
      <fieldset class="border p-3 rounded mb-2">
        <legend class="float-none w-auto px-2">Como va el Impuesto?</legend>
        <div class="grid grid-cols-12 gap-4">
          <div class="col-span-12 md:col-span-6 mb-2">
            <div class="card flex justify-center">
               <OptionButtonTM v-model="comoVaElImpuesto" @change="fncomoImpuesto" :options="optionsImpuesto" aria-labelledby="basic"  />
           </div>
          </div>
          <div class="col-span-12 md:col-span-6 mb-2">
            <div class="card flex flex-row gap-4">
               <Button label="Impuestos" icon="pi pi-plus" @click="fnAgregarImpuestoSeleccionado" />
               <Button label="Impuestos" icon="pi pi-minus" @click="fnEliminarImpuestoSeleccionado" />
           </div>
          </div>


          <div class="col-span-3 form-group">
            <label for="precio-base">P. Base</label>
            <input type="text" class="form-control  " v-solonumeros v-decimales v-numeroFocusinOut v-model="productoSeleccionado.precio_venta" @input="calcularPrecioFinal">
          </div>
          <div class="col-span-3 form-group">
            <label for="impuestoA">Impuesto</label>
            <input type="text" class="form-control " v-solonumeros v-decimales v-model="productoSeleccionado.impuestos" readonly>
          </div>
          <div class="col-span-3 form-group">
            <label for="precio-final">P. Final</label>
            <input type="text" class="form-control soloNumero decimales" v-model="productoSeleccionado.precio_final" v-solonumeros v-decimales v-numeroFocusinOut @input="calcularPrecioBase">
          </div>
          <div class="col-span-3">
            <label for="btnagregarprecio">Agregar</label>
            <a href="#" class="btn btn-dark w-100" @click.prevent="agregarProductoModificado"><i class="icon-ok-circle"></i> ok</a>
          </div>
        </div>
      </fieldset>
    </div>

    <div class="col-span-12">
      <fieldset class="border p-3 rounded mb-2">
        <legend class="float-none w-auto px-2">Comisión por Producto</legend>
        <div class="grid grid-cols-12 gap-4">
          <div class="col-span-12">
            <div class="input-group">
              <select class="form-control custom-select" v-model="productoSeleccionado.vendedor">
                <!-- <option :value="usuario.nombre">{{ usuario.nombre }}</option> -->
              </select>
              <div class="input-group-append">
                <button class="btn btn-outline-secondary" type="button">Agregar</button>
              </div>
            </div>
          </div>
        </div>
      </fieldset>
    </div>
  </div>
  </div>

  <template #footer>
    <Button label="Salir" text severity="secondary" @click="visibleprecio = false" autofocus />
    <Button label="Guardar" severity="success" @click="guardarProducto" autofocus />
  </template>
</Dialog>

 <!-- ////////////////////////////////////////////////////////////////////////////////////////// -->
    <Drawer v-model:visible="visiblecobrar" position="right" :header="$t('Generate Invoice')" :style="{ width: '30rem' }">
    <template #header>
      <div class="inline-flex align-items-center justify-content-center gap-2">
        <span class="font-bold white-space-nowrap">{{ $t('Generate Invoice') }}</span>
      </div>
    </template>
    <div class="invoice-drawer grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4 p-4">


      <div class="form-group">
        <label for="estadofactura" class="block text-sm font-medium text-gray-700 dark:text-gray-300">ESTADO</label>
        <select class="form-control w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600" v-model="estadoFN">
          <option value="Pendiente">Pendiente</option>
          <option value="Cobrado">Cobrado</option>
          <option value="Entregado">Entregado</option>
        </select>
      </div>


      <div class="form-group">
        <label for="totalAgregarDatos" class="block text-sm font-medium text-gray-700 dark:text-gray-300">TOTAL</label>
        <input type="text" class="form-control w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600" v-model="total" readonly>
      </div>
      

      <div class="invoice-drawer-switches col-span-2 grid grid-cols-3">

      <div class="form-group">
        <label for="incluirimpuesto" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Inc {{ datosConfiguracion.nombre_impuesto }}</label>
        <InputSwitch v-model="incluirImpuesto" @change="fnincluirImpuesto" class="mt-2" />
      </div>

      <div class="form-group">
        <label for="agregarimpuesto" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Add {{ datosConfiguracion.nombre_impuesto }}</label>
        <InputSwitch v-model="agregarImpuesto" @change="fnagregarImpuesto" class="mt-2" />
      </div>


      <div class="form-group" v-if="ventasXMayor">
        <label for="btnxmayor" class="block text-sm font-medium text-gray-700 dark:text-gray-300">X Mayor</label>
        <InputSwitch v-model="checkedpormayor" @change="alporMayor" class="mt-2" />
      </div>
</div>

      <div class="form-group col-span-1 md:col-span-2">
        <label for="metodoPagoFN" class="block text-sm font-medium text-gray-700 dark:text-gray-300">MÉTODO DE PAGO</label>
        <Select
          v-model="metodoPago"
          :options="metodoPagoOptions"
          optionLabel="nombre"
          optionValue="nombre"
          placeholder="Seleccionar método"
          class="w-full"
          @change="fncambioMetodoPago"
        />
      </div>

      <div class="form-group col-span-1 md:col-span-2">
        <label for="tipoDocumentoFN" class="block text-sm font-medium text-gray-700 dark:text-gray-300">TIPO DE DOCUMENTO</label>
        <Select
          v-model="tipoFactura"
          :options="[
            { label: 'FACTURA', value: 'factura' },
            { label: 'COTIZACION', value: 'cotizacion' }
          ]"
          optionLabel="label"
          optionValue="value"
          class="w-full"
        />
      </div>

      <div class="form-group col-span-1 md:col-span-2" v-if="metodoPagoRequiereBanco">
        <label for="bancoMetodoPago" class="block text-sm font-medium text-gray-700 dark:text-gray-300">BANCO</label>
        <Select
          v-model="cuentaBancaria"
          :options="bancoArray"
          optionLabel="nombre"
          placeholder="Seleccionar banco"
          class="w-full"
        />
      </div>


      <div class="col-span-1 md:col-span-2">
        <label for="pagacon" class="block text-sm font-medium text-gray-700 dark:text-gray-300">PAGA CON</label>
        <input 
        type="text" 
        class="invoice-drawer-amount form-control w-full p-4 text-4xl border rounded dark:bg-gray-700 dark:border-gray-600" 
        v-tecladovirtual="(event) => handleFocus('number', event.target)" 
        @input="handleInput" 
        @virtual-keyboard-input="fnCalcularCambio" 
        @change="fnCalcularCambio" 
        v-numeroFocusinOut 
        v-solonumeros 
        v-model="pagaCon" 
      />

      </div>

      <div class="col-span-1 md:col-span-2">
        <label for="sucambio" class="block text-sm font-medium text-gray-700 dark:text-gray-300">SU CAMBIO</label>
        <input type="text" class="invoice-drawer-amount form-control w-full p-4 text-4xl border rounded dark:bg-gray-700 dark:border-gray-600" v-model="suCambio" readonly>
      </div>


      <div class="form-group">
        <label for="cajero" class="block text-sm font-medium text-gray-700 dark:text-gray-300">CAJERO</label>
        <input type="text" class="form-control w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600" v-model="cajero" readonly>
      </div>

      <div class="form-group">
        <label for="seleccionecliente" class="block text-sm font-medium text-gray-700 dark:text-gray-300">CLIENTE</label>
        <select class="form-control w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600" v-model="clienteSelected.nombre" @change="fnCambiarCliente">
          <option value="default">DEFAULT</option>
          <option value="otro">OTRO</option>
          <option :value="clienteSelected.nombre">{{clienteSelected.nombre}}</option>
        </select>
      </div>

      <div class="form-group">
        <label for="vendedor" class="block text-sm font-medium text-gray-700 dark:text-gray-300">VENDEDOR</label>
            <Select 
              v-model="vendedor" 
              fluid 
              :options="vendedoresNombre"
              placeholder="VENDEDOR" 
              class="w-full"
            />
      </div>

<!--       <div class="form-group">
        <label for="instalador" class="block text-sm font-medium text-gray-700 dark:text-gray-300">INSTALADOR</label>
        <select class="form-control w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600" v-model="instalador">
          <option value="Ninguno">Ninguno</option>
        </select>
      </div> -->

      <div class="form-group">
        <label for="delivery" class="block text-sm font-medium text-gray-700 dark:text-gray-300">DELIVERY</label>
        <select class="form-control w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600" v-model="delivery">
          <option value="Ninguno">Ninguno</option>
        </select>
      </div>

<!--   <div class="flex flex-col col-span-2">
    <label for="financierasAgregarDatos" class="font-bold mb-2">INSTITUCIÓN</label>
    <Select 
      v-model="institucion" 
      fluid 
      @change="fnCambioInstitucion"
      :options="intitucionesDataNames"
      placeholder="INSTITUCION" 
      class="w-full"
    />
  </div> -->

      <div class="form-group">
        <label for="btncredito" class="block text-sm font-medium text-gray-700 dark:text-gray-300">APLICAR NC</label>
        <Button label="N. CREDITO" icon="pi icon-money" severity="warning" rounded @click="visibleNotaCredito = true" outlined class="w-full" />
      </div>

      <div class="form-group">
        <label for="btndescuento" class="block text-sm font-medium text-gray-700 dark:text-gray-300">AP. DESC.</label>
        <Button label="DESCUENTO" icon="pi icon-sort-alt-down" severity="warning" rounded @click="visibleDescuento = true" outlined class="w-full" />
      </div>


    </div>

    <template #footer>
      <Button label="Nota" text severity="secondary" @click="visibleNota = true" class="mr-2" />
      <Button label="Cancel" text severity="secondary" @click="visiblecobrar = false" class="mr-2" />
      <Button label="Generar (F4)" outlined severity="secondary" :loading="!visiblecobrar" @click="guardarFactura" autofocus class="mr-2" />
    </template>
  </Drawer>
 <!-- ////////////////////////////////////////////////////////////////////////////////////////// -->
    <Drawer v-model:visible="visiblecliente"  header="Editar Producto" :style="{ width: '50rem' }">
    <template #header>
      <div class="inline-flex align-items-center justify-content-center gap-2">
        <span class="font-bold white-space-nowrap">Agregar Cliente</span>
      </div>
    </template>
    <div class="grid grid-cols-12 gap-4">

 <fieldset class="border p-3 rounded ">
    <legend class="float-none w-auto px-2">Datos del cliente</legend>


<form id="formularioAgregarClientes" action="" method="">
         <div  style="margin-top: 15px;color: #34AAB2;" class="">
         </div>
         <div class="box-body">
          <div class="grid grid-cols-12 gap-4">

<div class="form-group col-span-4 mb-2" >
  <label for="elBuscadorCliente">TIPO</label>
    <select  id="elBuscadorCliente" class="form-control" v-model="tipoclientebuscar" @change="seleccionarCliente">
      <option value="NADA" selected>SELECCIONE CLIENTE</option>
      <option value="dafault">DEFAULT</option>
      <option value="nuevo">NUEVO</option>
    </select>

</div>
<div class="form-group col-span-4 md:col-span-8 mb-2" >
  <label for="elBuscadorCliente">DEFAULT</label><br>
<InputGroup>
    <Button label="Cliente por Default" @click="fnClienteDefault" icon="pi pi-user" />
    <Button label="Limpiar" class="ml-1" severity="contrast" @click="fnLimpiarCliente" icon="pi pi-eraser" />
    <OptionButtonTM v-model="switchbuscarRNC"  :options="['RNC','CEDULA']" aria-labelledby="basic" />
</InputGroup>

</div>


  <div class="col-span-12 form-group">
    <div class="input-group mb-3">
      <input v-model="rnc" type="text" class="form-control soloNumero" placeholder="RNC DGII" aria-describedby="btnbuscarnrc" id="camporncdgii">
      <div class="input-group-append">
        <button class="btn btn-outline-secondary" type="button" @click="buscarRNC" id="btnbuscarnrc"><i class="icon-search"></i> Buscar</button>
      </div>
    </div>
  </div>


<div class="form-group col-span-8" id="divpadrenombre" style="padding-top: 0 !important;">
<label for="nombreAgregarDatos">NOMBRE</label>

            <awesomplete
                    class=""
                    v-model="clienteSelected.nombre"
                    @change="nombreClientesSelected"
                    @selectComplete="searchclientes"
                    :list="nombreClientsArray" style="border: 2px #f0fdf4 solid;border-radius: 5px;">
            </awesomplete>

</div>



<div class="form-group sm:col-span-12 md:col-span-4 lg:col-span-4 campooculto" v-if="camposClienteVisibles">
<label for="cedulaAgregarDatos">CEDULA</label>
<input type="text" name="cedula" v-model="clienteSelected.cedula"  class="form-control  igualar dcliente verificaDuplicado awesomplete " id="cedulaAgregarDatos" campoigualado="rncAgregarDatos" nombre="cedula" db="clientes" campounico="cedula" tabla="clientes" boton="btnAgregarCliente">
</div>



<div class="form-group sm:col-span-12 md:col-span-4 lg:col-span-4 campooculto" hidden>
<label for="emailAgregarDatos">EMAIL</label>
<input type="text" name="email" v-model="clienteSelected.email"   nombrecampo="email"  class="form-control  data-mask dcliente" id="emailAgregarDatos"  >
</div>

<input type="hidden" name="password"   class="form-control  dcliente" id="passwordAgregarDatos"  >


<div class="form-group sm:col-span-12 md:col-span-12 lg:col-span-12">
<label for="direccionAgregarDatos">DIRECCION</label><br>
<Textarea v-model="clienteSelected.direccion" class="form-control  dcliente" rows="3" cols="30" />
</div>

<div class="form-group sm:col-span-12 md:col-span-4 lg:col-span-4 campooculto" v-if="camposClienteVisibles" >
<label for="rncAgregarDatos">RNC</label>
<input type="text" name="rnc" v-model="clienteSelected.rnc"  class="form-control dcliente verificaDuplicado awesomplete" id="rncAgregarDatos" >
</div>

<div class="form-group sm:col-span-12 md:col-span-4 lg:col-span-4 campooculto" v-if="camposClienteVisibles">
<label for="n_comercialAgregarDatos">NOMBRE COMERCIAL</label>
<input type="text" name="n_comercial" v-model="clienteSelected.n_comercial"   class="form-control  mayusc dcliente awesomplete" id="n_comercialAgregarDatos" >
</div>

<div class="form-group sm:col-span-12 md:col-span-4 lg:col-span-4 campooculto" v-if="camposClienteVisibles">
<label for="codigoAgregarDatos">CODIGO</label>
<input type="text" name="codigo" v-model="clienteSelected.codigo"  class="form-control dcliente" id="codigoAgregarDatos"    readonly>
</div>


<div class="form-group col-span-6 sm:col-span-4">
  <label for="btnvermascampos">Ver Mas Campos</label>
<br>
<InputSwitch v-model="checkedvermascampos" @change="toggleCamposVisibles" />
</div>

<div class="form-group col-span-6 sm:col-span-4">
  <label for="btneditarclientes">Editar</label>
<br>
<InputSwitch v-model="checkededitarclientes" />
</div>




    <div class="form-group col-span-6 sm:col-span-4">
      <label for="btnpormayor">AL POR MAYOR</label>
    <br>
    <InputSwitch v-model="checkedpormayor" @change="alporMayor" />
    </div>





          <div class="form-group sm:col-span-12">
          <input type="hidden" name="usuario"   class="form-control readonly" id="usuarioAgregarDatos" readonly>
                   </div>
           </div>
        </div>
        </form>


</fieldset>
    </div>
    <div class="grid grid-cols-12 gap-4">
<div class="col-span-12">
 <fieldset class="border p-3 rounded ">
    <legend class="float-none w-auto px-2">Acción</legend>

      <Button label="Guardar en Venta" outlined severity="secondary" @click="crearventaProceso" autofocus />
      <Button label="Cancel" outlined severity="secondary" @click="visiblecliente = false" autofocus />
      <Button :label="guardarActualizar" outlined severity="secondary" @click="guardarCliente" autofocus />
  </fieldset>
</div>
</div>
    <template #footer>
    </template>
  </Drawer>

 <!-- ////////////////////////////////////////////////////////////////////////////////////////// -->
 <Dialog v-model:visible="visiblefatcoti" modal :position="position" header="Editar Producto" :style="{ width: '50rem' }">
    <template #header>
      <div class="inline-flex items-center justify-center gap-2">
        <span class="font-bold whitespace-nowrap">Buscar Factura</span>
      </div>
    </template>

    <div class="grid grid-cols-12 gap-4">
      <fieldset class="border p-4 rounded col-span-12 ">
        <legend class="px-2">Facturas y Cotizaciones</legend>
        <form id="formularioAgregarClientes" action="" method="" class="grid grid-cols-12">

          <!-- Tipo de Documento - PRIMERO -->
          <div class="col-span-12 mb-3">
            <label class="block mb-2 font-semibold text-slate-700 dark:text-slate-300">TIPO DOCUMENTO</label>
            <SelectButton
              v-model="datosFactCoti.tipo"
              :options="['Factura','Cotizacion']"
              class="w-full"
              :allowEmpty="false"
              @change="tipodocumento"
            />
          </div>

          <!-- Número de Factura -->
          <div class="col-span-12 md:col-span-8">
            <label for="ingresenumeroModifcarfactura">#DOCUMENTO</label>

<div class="flex flex-col md:flex-row gap-2 items-center w-full">
  <!-- AutoCompletar -->
  <div class="w-full">

    <AutoCompletar
      v-model="datosFactCoti.numero"
      :list="noFacturasArray"
       placeholder="Buscar por #"
       :mostrarBoton="true"
       :mostrarAlFocus="true"
       @onBotonClick="fnBuscarDocNombre"
       @selectComplete="nombreFacturaSelected"
    />
  </div>

  <!-- Select de tipo de búsqueda -->
  <div class="w-full md:w-56">
    <Select
      v-model="datosFactCoti.buscadorPor"
      :options="['HOY', 'AYER', 'ANTIER', 'TODAS']"
      class="w-full"
    />
  </div>
</div>

          </div>
          <div class="col-span-12 md:col-span-4 px-2 ">
            <label for="buscadorpornombre">Ver Todas</label>

<Button icon="pi pi-eye" as="router-link" fluid severity="success" :label="'Ver mas ' + datosFactCoti.tipo"  :to="rutaTipo" />
          </div>

          <!-- Generar PDF -->
          <div class="col-span-12 md:col-span-3 px-2 mt-2">
            <label for="ultimaFactura">GENERAR</label>
            <Button icon="pi pi-file-pdf" fluid label="PDF" @click="fnImpresoraGrande"  />
          </div>


          <!-- Buscar por Nombre -->


          <!-- Impresora -->
<!--           <div class="col-span-12 md:col-span-3 px-2 mt-2">
                   <OptionButtonTM
                    v-model="datosFactCoti.impresora"
                    label="IMPRESORA"
                    :options="['Termica','Tinta']"
                  />

          </div> -->


           <div class="col-span-12 md:col-span-2 mt-2 mt-2">
            <label for="ultimaFactura">GARANTIA</label>
            <Button icon="pi pi-shield" fluid label="GARANTIA" @click="fnGarantia"  />
          </div>

          <!-- Botones de Acción -->
          <div class="col-span-12 flex space-around gap-2 mt-3">
            <Button :label="'Eliminar ' + datosFactCoti.tipo" icon="pi pi-trash" severity="danger"  @click="eliminarFactura" outlined iconPos="top" />
            <Button :label="'Replicar ' + datosFactCoti.tipo" icon="pi pi-clone" severity="warning"  @click="clonarFactura" outlined iconPos="top"/>
            <Button label="Editar Método de Pago" v-if="datosFactCoti.tipo ==='Factura'" @click="fnEditarMetodoPago" icon="pi icon-dollar" severity="warning"  outlined iconPos="top"/>

            <Button label="Aplicar NCF" v-if="datosFactCoti.tipo ==='Factura'" icon="pi icon-balance-scale" severity="warning"  @click="visibleComprobantes = true" outlined iconPos="top"/>
            <Button label="Conduce" icon="pi pi-truck" severity="warn" v-if="datosFactCoti.tipo ==='Factura'"  @click="visibleConduce = true" outlined iconPos="top"/>

            <Button label="Crédito" v-if="datosFactCoti.tipo ==='Factura' && !facturaEsCredito" icon="pi pi-money-bill" iconPos="top" severity="danger"  @click="fnAplicarCredito" outlined />

          </div>

          <div class="col-span-12 flex flex-wrap gap-2 mt-3">

            <Button label="Datos Crédito" v-if="datosFactCoti.tipo ==='Factura' && facturaEsCredito" icon="pi pi-money-bill" iconPos="top" severity="contrast"  @click="fnDatosCredito" outlined />

            <Button label="Ver Crédito" v-if="datosFactCoti.tipo ==='Factura' && facturaEsCredito" icon="pi pi-money-bill" iconPos="top" severity="contrast"  @click="fnVerCredito" outlined />

            <Button label="Abonar Crédito" v-if="datosFactCoti.tipo ==='Factura' && facturaEsCredito" icon="pi pi-money-bill" iconPos="top" severity="contrast"  @click="fnAbonarCredito" outlined />

            <Button label="Cancelar Crédito" v-if="datosFactCoti.tipo ==='Factura' && facturaEsCredito" icon="pi pi-money-bill" iconPos="top" severity="contrast"  @click="fnCancelarCredito" outlined />

            <Button label="Imprimir Crédito" v-if="datosFactCoti.tipo ==='Factura' && facturaEsCredito" icon="pi pi-money-bill" iconPos="top" severity="contrast"  @click="fnImprimircredito" outlined />
          </div>

          <!-- Convertir en Factura -->
          <div v-if="datosFactCoti.tipo === 'Cotizacion'" class="col-span-12 mt-2">
            <Button label="Convertir en Factura" class="w-full" severity="contrast" rounded @click="fnConvertirEnFactura" />
          </div>

          <!-- Convertir Pre-Factura en Factura -->
          <div v-if="datosFactCoti.tipo === 'Pre-Factura'" class="col-span-12 mt-2">
            <Button label="Convertir Pre-Factura en Factura" class="w-full" severity="contrast" rounded @click="fnConvertirPreFacturaEnFactura" />
          </div>

          <!-- Botones para Orden -->
          <div v-if="datosFactCoti.tipo === 'Orden'" class="col-span-12 mt-2 space-y-2">
            <Button label="Agregar Materiales" icon="pi pi-box" class="w-full" severity="info" rounded @click="fnAgregarMaterialesOrden" />
            <Button label="PDF de Materiales" icon="pi pi-file-pdf" class="w-full" severity="warning" rounded @click="fnGenerarPDFMateriales" />
            <Button label="Convertir Orden en Factura" class="w-full" severity="contrast" rounded @click="fnConvertirOrdenEnFactura" />
          </div>

          <!-- Botones para Apartado -->
          <div v-if="datosFactCoti.tipo === 'Apartado'" class="col-span-12 mt-2 space-y-2">
            <Button label="Abonar al Apartado" icon="pi pi-wallet" class="w-full" severity="success" rounded @click="fnAbonarApartadoModal" />
            <Button label="Imprimir Ticket" icon="pi pi-ticket" class="w-full" severity="secondary" rounded @click="fnImprimirTicketApartado" />
            <Button label="Imprimir PDF Carta" icon="pi pi-file-pdf" class="w-full" severity="warning" rounded @click="fnImprimirPDFApartado" />
            <Button label="Convertir Apartado en Factura" class="w-full" severity="contrast" rounded @click="fnConvertirApartadoEnFactura" />
          </div>

        </form>
      </fieldset>
    </div>

    <template #footer>
      <ButtonGroup>
        <Button label="Cambiar Cliente" icon="pi pi-user" @click="visibleClientes = true" outlined />
        <Button label="Editar" icon="pi pi-pencil" outlined @click="editarFactura" />
        <Button label="Imprimir" icon="pi pi-print" @click="impresionFactura" outlined />
        <Button label="WhatsApp" icon="pi pi-whatsapp" severity="success" @click="fnEnviarWhatsApp" outlined />
        <Button label="Devolución" icon="pi pi-undo" v-if="datosFactCoti.tipo ==='Factura'" @click="fnDevoluciones" outlined />
        <Button label="Cancel" icon="pi pi-times" severity="danger" @click="visiblefatcoti = false" outlined />
      </ButtonGroup>
    </template>
  </Dialog>

  <!-- Modal de WhatsApp -->
  <WhatsappModal ref="whatsappModalRef" :initialDatosWhatsApp="datosWhatsApp" />

 <!-- ////////////////////////////////////////////////////////////////////////////////////////// -->

     <Dialog v-model:visible="visibleBuscarPrecio" modal :position="position" header="Buscar Precio" :style="{ width: '50rem' }">
    <template #header>
      <div class="inline-flex align-items-center justify-content-center gap-2">
        <span class="font-bold white-space-nowrap">Buscar Precio</span>
      </div>
    </template>
        <fieldset class="border p-3 rounded mb-2">
        <legend class="float-none w-auto px-2">PRECIO</legend>
       <div class="grid grid-cols-12 gap-4">

<div class="col-span-12">

        <OptionButtonTM v-model="switchbuscarpor" @change="fnSwitchBuscadorPor" :options="optionsBUscarpor" aria-labelledby="basic" />

</div>

       <div class="form-group col-span-12">
            <label for="buscadorNombre">Buscar Producto</label><br>
            <awesomplete
                    class="dropdown-input"
                    v-model="awesompleteprecio"
                    @change="fnAwesomplete"
                    @selectComplete="handleSelectComplete"
                    :list="listaBuscador">
            </awesomplete>


          </div>



                    <div class="sm:col-span-8 md:col-span-8 form-group">
                  <label for="precioventabuscador">Nombre del Producto</label>
                  <div id="nombreproductoBuscador" class="text-uppercase p-2" style="border: solid 1px #000;border-radius: 5px;">
                    {{nombreProductoBuscado}}
                  </div>
                </div>


                <div class="sm:col-span-4 md:col-span-4 form-group">
                  <label for="cantidadventabuscador">Cantidad</label>
                  <input type="text" v-model="cantidadProductoBuscado" v-solonumeros v-numeroFocusinOut v-decimales class="form-control" id="cantidadventabuscador">
                </div>


                <div class="col-span-12 md:col-span-4 form-group">
                  <label for="precioventabuscador">Precio de Venta</label>
                  <input type="text" v-model="precioVentaProductoBuscado" class="form-control" id="precioventabuscador" readonly>
                </div>
                <div class="col-span-12 md:col-span-4 form-group">
                  <label for="impuestobuscador">{{datosConfiguracion.nombre_impuesto}}</label>
                  <input type="text" v-model="impuestosProductoBuscado" class="form-control" id="impuestobuscador" readonly>
                </div>
                <div class="col-span-12 md:col-span-4 form-group">
                  <label for="preciototalbuscador">Precio Total</label>
                  <input type="text" v-model="precioTotalProductoBuscado" class="form-control" id="preciototalbuscador" readonly>
                </div>
                <div class="col-span-12 md:col-span-6 form-group">
                  <label for="preciominimobuscador">Precio Mínimo</label>
                  <input type="text" v-model="precioMinimoProductoBuscado" class="form-control" id="preciominimobuscador" readonly>
                </div>

                <div class="col-span-12 md:col-span-6 form-group">
                  <label for="precioxmayorbuscador">Precio X Mayor</label>
                  <input type="text" v-model="precioXMayorProductoBuscado" class="form-control" id="precioxmayorbuscador" readonly>
                </div>

                <div class="col-span-8 form-group">
                  <label for="disponibilidadBuscador">Disponibilidad</label>
                  <div id="disponibilidadBuscador" :class="disponibilidadProductoBuscado" class="text-uppercase p-2 text-white" style="border: solid 1px #000;border-radius: 5px;">
                    {{disponibilidadProducto}}
                  </div>
                </div>

                <div class="col-span-4 form-group">
                  <label for="stockbuscador">Stock</label>
                  <input type="text" v-model="stockProductoBuscado" class="form-control" id="stockbuscador" readonly>
                </div>

                <div class="col-span-12 form-group">
                  <label for="ubicacionbuscador">Ubicación en el Almacén</label>
                   <input type="text" v-model="ubicacionProductoBuscado" class="form-control" id="ubicacionbuscador" readonly>
                </div>



        </div>
      </fieldset>
    <template #footer>

<ButtonGroup >
    <Button label="Vender este Producto" icon="pi pi-barcode" @click="fnagregarProductoBuscado" outlined />
    <Button label="Cancel" icon="pi pi-times" severity="danger" @click="visibleBuscarPrecio = false" outlined />
</ButtonGroup>


    </template>
  </Dialog>
 <!-- ////////////////////////////////////////////////////////////////////////////////////////// -->
  <Dialog v-model:visible="visibledinero" modal :position="position" :style="{ width: '45rem' }" :draggable="false">
    <template #header>
      <div class="flex items-center gap-3">
        <div class="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-full p-3">
          <i class="pi pi-wallet text-2xl"></i>
        </div>
        <div>
          <h3 class="text-xl font-bold text-gray-800 m-0">Distribuir Dinero</h3>
          <p class="text-sm text-gray-500 m-0">Asignar montos por método de pago</p>
        </div>
      </div>
    </template>

    <div class="p-4">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div class="payment-card efectivo-card">
          <div class="payment-icon-wrapper bg-green-100">
            <i class="pi pi-money-bill text-green-600 text-2xl"></i>
          </div>
          <label class="payment-label">Efectivo</label>
          <div class="payment-input-wrapper">
            <span class="currency-symbol">$</span>
            <input
              :readonly="efetivoFNRef"
              type="text"
              class="payment-input"
              v-model="efetivoFN"
              v-solonumeros
              v-numeroFocusinOut
              v-decimales
              placeholder="0.00"
            >
          </div>
        </div>

        <div class="payment-card tarjeta-card">
          <div class="payment-icon-wrapper bg-blue-100">
            <i class="pi pi-credit-card text-blue-600 text-2xl"></i>
          </div>
          <label class="payment-label">Tarjeta</label>
          <div class="payment-input-wrapper">
            <span class="currency-symbol">$</span>
            <input
              :readonly="tarjetaFNRef"
              type="text"
              class="payment-input"
              v-model="tarjetaFN"
              v-solonumeros
              v-numeroFocusinOut
              v-decimales
              placeholder="0.00"
            >
          </div>
        </div>

        <div class="payment-card transferencia-card">
          <div class="payment-icon-wrapper bg-purple-100">
            <i class="pi pi-arrow-right-arrow-left text-purple-600 text-2xl"></i>
          </div>
          <label class="payment-label">Transferencia</label>
          <div class="payment-input-wrapper">
            <span class="currency-symbol">$</span>
            <input
              :readonly="transferenciaFNRef"
              type="text"
              class="payment-input"
              v-model="transferenciaFN"
              v-solonumeros
              v-numeroFocusinOut
              v-decimales
              placeholder="0.00"
            >
          </div>
        </div>
      </div>

      <div v-if="Number(tarjetaFN || 0) > 0 && metodosConPorcentaje.length > 0" class="mt-6">
        <div class="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
          <div class="flex items-center gap-2 mb-3">
            <i class="pi pi-percentage text-blue-600 text-lg"></i>
            <h4 class="text-sm font-bold text-blue-800 m-0">Aplicar Recargo a Tarjeta</h4>
          </div>

          <div class="space-y-3">
            <div>
              <label class="text-xs font-semibold text-gray-700 mb-2 block">Seleccionar Método de Pago:</label>
              <Select
                v-model="metodoPagoTarjetaSeleccionado"
                :options="metodosConPorcentaje"
                optionLabel="nombre"
                placeholder="Seleccionar método con recargo"
                class="w-full"
              >
                <template #value="slotProps">
                  <div v-if="slotProps.value" class="flex items-center gap-2">
                    <span class="font-semibold">{{ slotProps.value.nombre }}</span>
                    <Tag severity="info" class="text-xs">{{ slotProps.value.porcentaje }}%</Tag>
                  </div>
                  <span v-else>{{ slotProps.placeholder }}</span>
                </template>
                <template #option="slotProps">
                  <div class="flex items-center justify-between w-full">
                    <span>{{ slotProps.option.nombre }}</span>
                    <Tag severity="info" class="text-xs">+{{ slotProps.option.porcentaje }}%</Tag>
                  </div>
                </template>
              </Select>
            </div>

            <div v-if="metodoPagoTarjetaSeleccionado" class="bg-white rounded-lg p-3 border border-blue-200">
              <div class="space-y-2 text-sm">
                <div class="flex justify-between items-center">
                  <span class="text-gray-600">Monto Base:</span>
                  <span class="font-semibold text-gray-800">${{ Number(montoTarjetaOriginal).toFixed(2) }}</span>
                </div>
                <div class="flex justify-between items-center">
                  <span class="text-gray-600">Recargo ({{ metodoPagoTarjetaSeleccionado.porcentaje }}%):</span>
                  <span class="font-semibold text-orange-600">+${{ (montoTarjetaConRecargo - montoTarjetaOriginal).toFixed(2) }}</span>
                </div>
                <div class="border-t pt-2 flex justify-between items-center">
                  <span class="text-gray-700 font-bold">Total con Recargo:</span>
                  <span class="text-xl font-bold text-blue-600">${{ Number(montoTarjetaConRecargo).toFixed(2) }}</span>
                </div>
              </div>
            </div>

            <div v-if="diferenciaRecargo > 0 && productosVenta.length > 0" class="mt-4">
              <div class="bg-gradient-to-r from-orange-50 to-amber-50 border-2 border-orange-200 rounded-lg p-4">
                <div class="flex items-center gap-2 mb-3">
                  <i class="pi pi-box text-orange-600 text-lg"></i>
                  <h4 class="text-sm font-bold text-orange-800 m-0">Distribuir Recargo en Productos</h4>
                </div>

                <p class="text-xs text-gray-600 mb-3">
                  Selecciona los productos a los que se les aplicará el recargo de
                  <span class="font-bold text-orange-600">${{ diferenciaRecargo.toFixed(2) }}</span>
                  de forma proporcional a su precio.
                </p>

                <div class="bg-white rounded-lg border border-orange-200 max-h-60 overflow-y-auto">
                  <div class="divide-y divide-gray-200">
                    <div
                      v-for="(producto, index) in productosVenta"
                      :key="index"
                      class="p-3 hover:bg-orange-50 transition-colors cursor-pointer"
                      @click="toggleProductoRecargo(index)"
                    >
                      <div class="flex items-center gap-3">
                        <Checkbox
                          :modelValue="productosSeleccionadosRecargo.includes(index)"
                          :binary="true"
                          @update:modelValue="toggleProductoRecargo(index)"
                          @click.stop
                        />
                        <div class="flex-1">
                          <div class="flex justify-between items-start">
                            <div>
                              <p class="font-semibold text-gray-800 text-sm m-0">
                                {{ producto.nombre || producto.descripcion }}
                              </p>
                              <p class="text-xs text-gray-500 m-0">
                                Cantidad: {{ producto.cantidad }} × ${{ Number(producto.precio_final || producto.precio_venta || 0).toFixed(2) }}
                              </p>
                            </div>
                            <div class="text-right">
                              <p class="font-bold text-blue-600 text-sm m-0">
                                ${{ (Number(producto.precio_final || producto.precio_venta || 0) * Number(producto.cantidad || 1)).toFixed(2) }}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div v-if="productosVenta.length === 0" class="p-4 text-center text-gray-500 text-sm">
                    No hay productos en la venta
                  </div>
                </div>

                <div v-if="productosSeleccionadosRecargo.length > 0" class="mt-3 p-3 bg-white rounded-lg border border-orange-200">
                  <div class="text-sm space-y-1">
                    <div class="flex justify-between">
                      <span class="text-gray-600">Productos seleccionados:</span>
                      <span class="font-semibold text-gray-800">{{ productosSeleccionadosRecargo.length }}</span>
                    </div>
                    <div class="flex justify-between">
                      <span class="text-gray-600">Recargo a distribuir:</span>
                      <span class="font-semibold text-orange-600">${{ diferenciaRecargo.toFixed(2) }}</span>
                    </div>
                  </div>
                </div>

                <Button
                  v-if="productosSeleccionadosRecargo.length > 0"
                  @click="distribuirRecargoEnProductos"
                  label="Aplicar Distribución"
                  icon="pi pi-check"
                  severity="warning"
                  class="w-full mt-3"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="mt-6 p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg border border-gray-200">
        <div class="flex justify-between items-center">
          <span class="text-gray-600 font-semibold text-lg">Total Distribuido:</span>
          <span class="text-2xl font-bold text-blue-600">
            ${{ (parseFloat(efetivoFN || 0) + parseFloat(montoTarjetaConRecargo || tarjetaFN || 0) + parseFloat(transferenciaFN || 0)).toFixed(2) }}
          </span>
        </div>
      </div>
    </div>

    <template #footer>
      <ButtonGroup>
        <Button label="Cerrar" icon="pi pi-times" severity="danger" @click="visibledinero = false" outlined />
      </ButtonGroup>
    </template>
  </Dialog>
 <!-- ////////////////////////////////////////////////////////////////////////////////////////// -->

    
 <!-- ////////////////////////////////////////////////////////////////////////////////////////// -->
 <Dialog v-model:visible="visibleOtroArticulo" modal :position="position" header="Agregar Producto" :style="{ width: '50rem' }">
  <template #header>
    <div class="inline-flex items-center justify-center gap-2">
      <span class="font-bold whitespace-nowrap">Agregar Producto</span>
    </div>
  </template>
  <div class="p-4">
    <fieldset class="border p-3 rounded mb-4">
      <legend class="px-2 font-semibold">PRODUCTO NO REGISTRADO</legend>
      <form id="formularioAgregarClientes">
        <div class="grid grid-cols-12 gap-4">
          
          <div class="hidden col-span-12 md:col-span-3">
            <label for="ncodigo_cortoArticulo" class="block text-sm font-medium">CODIGO</label>
            <InputText id="ncodigo_cortoArticulo" v-mayuscula v-model="productoOtro.codigo" class="w-full" />
          </div>

          

          <div class="col-span-12 ">
            <label for="nnombreArticulo">NOMBRE</label>

          <InputGroup>
            <InputText type="text" name="nnombreArticulo" v-mayuscula v-model="nombreNProducto" class="w-full p-2 border rounded-md" id="nnombreArticulo" />

              <InputGroupAddon>
                 <Button icon="pi pi-times" severity="secondary"  @click="nombreNProducto = ''" />
              </InputGroupAddon>
          </InputGroup>

          </div>

<!--           <div class="col-span-12 md:col-span-3">
            <label for="ncategoriaArticulo">CATEGORIA</label>
            <input type="text" id="ncategoriaArticulo" v-model="categoriaNProducto" class="w-full p-2 border rounded-md" value="ACCESORIOS">
          </div> -->

          <div class="col-span-12" hidden>
            <label for="ndescripcionArticulo">DESCRIPCION</label>
            <input type="text" name="ndescripcionArticulo" v-model="descripcionNProducto" class="w-full p-2 border rounded-md" id="ndescripcionArticulo">
          </div>

          <div class="col-span-6 md:col-span-3">
            <label for="npventaArticulo">P. VENTA</label>
            <input type="text" name="npventaArticulo" v-focus-in-focus-out v-solonumeros v-model="pVentaNProducto" class="w-full p-2 border rounded-md" @keydown.enter="fnAgregarProducto" id="nprecio_ventaArticulo">
          </div>

          <div class="col-span-6 md:col-span-3">
            <label for="nimpuesto_ventaArticulo">{{ datosConfiguracion.nombre_impuesto }}</label>
            <input type="text" name="nimpuesto_ventaArticulo" v-solonumeros v-focus-in-focus-out v-model="impuestoNProducto" class="w-full p-2 border rounded-md" id="nimpuesto_ventaArticulo">
          </div>

          <div class="col-span-6 md:col-span-3">
            <label for="nprecio_compraArticulo">COSTO</label>
            <input type="text" name="nprecio_compraArticulo" v-solonumeros v-focus-in-focus-out v-model="costoNProducto" class="w-full p-2 border rounded-md" id="nprecio_compraArticulo">
          </div>

<!--           <div class="col-span-6 md:col-span-2">
            <label for="nstockArticulo">STOCK</label>
            <input type="text" name="nstockArticulo" v-model="stockNProducto" class="w-full p-2 border rounded-md" id="nstockArticulo">
          </div> -->

          <div class="col-span-6 md:col-span-3">
            <label for="ncantidadArticulo">CANTIDAD</label>
            <input type="text" name="ncantidadArticulo" v-solonumeros v-focus-in-focus-out v-model="cantidadNProducto" class="w-full p-2 border rounded-md" id="ncantidadArticulo">
          </div>

          <div class="col-span-12 md:col-span-6">
            <label for="nimeiArticulo">IMEI (15 dígitos)</label>
            <div class="flex gap-2">
              <input
                type="text"
                name="nimeiArticulo"
                v-model="imeiNProducto"
                maxlength="15"
                placeholder="Ingrese el IMEI del equipo"
                class="flex-1 p-2 border rounded-md"
                :class="{
                  'border-green-500 bg-green-50': imeiVerificado === true,
                  'border-blue-500 bg-blue-50': imeiVerificado === 'api',
                  'border-orange-500 bg-orange-50': imeiVerificado === false
                }"
                id="nimeiArticulo"
              >
              <Button
                icon="pi pi-search"
                :loading="verificandoImei"
                @click="verificarImeiNProducto"
                :disabled="!imeiNProducto || imeiNProducto.length !== 15"
                severity="info"
                v-tooltip.top="'Verificar IMEI'"
              />
            </div>
            <div class="mt-1">
              <small v-if="imeiNProducto && imeiNProducto.length !== 15" class="text-red-500">
                El IMEI debe tener 15 dígitos ({{ imeiNProducto.length }}/15)
              </small>
              <small v-else-if="imeiVerificado === true" class="text-green-600">
                <i class="pi pi-check-circle mr-1"></i> IMEI encontrado en inventario
              </small>
              <small v-else-if="imeiVerificado === 'api'" class="text-blue-600">
                <i class="pi pi-globe mr-1"></i> Equipo identificado via API - se agregará como nuevo
              </small>
              <small v-else-if="imeiVerificado === false" class="text-orange-600">
                <i class="pi pi-info-circle mr-1"></i> IMEI no registrado - ingrese los datos manualmente
              </small>
            </div>
          </div>
<!--
          <div class="col-span-6 md:col-span-3">
            <label for="gratisArticulo">GRATIS</label>
            <ToggleButton v-model="btnGratis" onIcon="pi pi-check" offIcon="pi pi-times" class="w-full" />
          </div>

          <div class="col-span-6 md:col-span-3">
            <label for="ncostocero">COSTO CERO</label>
            <ToggleButton v-model="btnCostoCero" onIcon="pi pi-check" offIcon="pi pi-times" class="w-full" />
          </div>

          <div class="col-span-6 md:col-span-3">
            <label for="nrestarimpuesto">RESTAR {{ datosConfiguracion.nombre_impuesto }}</label>
            <ToggleButton v-model="btnRestarImpuestos" onIcon="pi pi-check" offIcon="pi pi-times" class="w-full" />
          </div>

          <div class="col-span-6 md:col-span-3">
            <label for="nswitcharticulo">GUARDAR</label>
            <ToggleButton v-model="btnGuardarProducto" onIcon="pi pi-check" offIcon="pi pi-times" class="w-full" />
          </div> -->

        </div>
      </form>
    </fieldset>
  </div>
  <template #footer>
    <div class="flex justify-end gap-2">
      <Button label="Agregar" icon="pi pi-check" severity="success" @click="fnAgregarProducto" outlined />
      <Button label="Cerrar" icon="pi pi-times" severity="danger" @click="visibleOtroArticulo = false" outlined />
    </div>
  </template>
</Dialog>

 <!-- ////////////////////////////////////////////////////////////////////////////////////////// -->
  
 <!-- ////////////////////////////////////////////////////////////////////////////////////////// -->

<Dialog
  v-model:visible="visibleBuscarProducto"
  modal
  :position="position"
  class="rounded-xl"
  :style="{ width: '75rem' }"
>
  <!-- HEADER -->
  <template #header>
    <div class="flex items-center gap-3 py-1">
      <i class="pi pi-box text-teal-600 text-xl"></i>
      <span class="font-bold text-lg">Listado de Productos</span>
    </div>
  </template>

  <!-- CONTENIDO -->
  <div class="p-4">

    <!-- BUSCADOR -->
    <div class="mb-4">
      <input
        v-model="searchQuery"
        v-tecladovirtual="(event) => handleFocus('text', event.target)"
        placeholder="Buscar productos..."
        class="p-inputtext p-component w-full border border-slate-300 dark:border-slate-600 rounded-md px-3 py-2
               focus:ring-2 focus:ring-blue-500 dark:bg-slate-800 dark:text-white transition"
      />
    </div>

    <!-- CONTEXT MENU -->
    <ContextMenu ref="cm" :model="menuModel" @hide="selectedProduct = null" />

    <!-- TABLA -->
    <div class="rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700">
      <DataTable
        :value="filteredProducts"
        scrollable
        scrollHeight="55vh"
        @rowSelect="onRowSelect"
        selectionMode="single"
        dataKey="id"
        paginator
        :rows="10"
        :rowsPerPageOptions="[5, 10, 20, 50]"
        class="p-datatable-gridlines p-datatable-sm"
        tableStyle="min-width: 100%"
      >
        <Column
          v-for="col in columns"
          :key="col.field"
          :field="col.field"
          :header="col.header"
          sortable
        />
      </DataTable>
    </div>
  </div>

  <!-- FOOTER -->
  <template #footer>
    <div class="flex justify-end w-full pt-3">
      <Button
        label="Cerrar"
        icon="pi pi-times"
        severity="danger"
        outlined
        class="!rounded-lg"
        @click="visibleBuscarProducto = false"
      />
    </div>
  </template>
</Dialog>

 <!-- ////////////////////////////////////////////////////////////////////////////////////////// -->


 <!-- ////////////////////////////////////////////////////////////////////////////////////////// -->
    <Dialog v-model:visible="visibleNota" modal :position="position" header="Nota" :style="{ width: '50rem' }">
    <template #header>
      <div class="inline-flex align-items-center justify-content-center gap-2">
        <span class="font-bold white-space-nowrap">Nota</span>
      </div>
    </template>
    <div class="grid grid-cols-1 gap-4">
      <fieldset class="border p-3 rounded mb-2">
        <legend class="float-none w-auto px-2">Nota</legend>
            <select v-model="garantiaSelect" @change="fnNota" name="tipogarantia" id="tipogarantia" class="form-control">
             <option value="Ninguna">Ninguna</option>
             <option  :value="garantia.referencia"  v-for="garantia in garantiaArray">{{garantia.referencia}}</option>
            </select>

            <Textarea fluid v-model="nota" class="form-control mt-2" id="nuevaNota" name="nuevaNota" cols="30" rows="3" />

        </fieldset>
    </div>
    <template #footer>
      <ButtonGroup>
        <Button label="Cerrar" icon="pi pi-times" severity="danger" @click="visibleNota = false" outlined />
      </ButtonGroup>
    </template>
  </Dialog>
 <!-- ////////////////////////////////////////////////////////////////////////////////////////// -->
<Dialog
  v-model:visible="visibleNotaCredito"
  modal
  :position="position"
  :style="{ width: '25rem' }"
>
  <!-- Header -->
  <template #header>
    <h2 class="text-lg font-semibold text-slate-700 dark:text-slate-200">
      Nota de Crédito
    </h2>
  </template>

  <!-- Contenido -->
  <div class="p-2">
    <fieldset
      class="border border-slate-300 dark:border-slate-700 rounded-lg p-4"
    >
      <legend
        class="px-2 text-sm font-medium text-slate-600 dark:text-slate-300"
      >
        Nota de Crédito
      </legend>

      <div class="mt-2">
        <awesomplete
          class="dropdown-input w-full p-2 border rounded-md 
                 border-slate-300 dark:border-slate-600 
                 focus:outline-none focus:ring-2 focus:ring-blue-500"
          v-model="numeroNC"
          @change="fnAwesompleteNC"
          @selectComplete="handleSelectCompleteNC"
          :list="listaBuscadorNC"
        />
      </div>
    </fieldset>
  </div>

  <!-- Footer -->
  <template #footer>
    <ButtonGroup>
      <Button
        label="Cerrar"
        icon="pi pi-times"
        severity="danger"
        @click="visibleNotaCredito = false"
        outlined
      />
    </ButtonGroup>
  </template>
</Dialog>

<!-- ////////////////////////////////////////////////////////////////////////////////////////// -->
<!-- DIALOG RECIBIR EQUIPOS (CAMBIAZO) -->
<!-- ////////////////////////////////////////////////////////////////////////////////////////// -->
<Dialog
  v-model:visible="visibleRecibirEquipos"
  modal
  :style="{ width: '95vw', maxWidth: '900px' }"
  :closable="!recibirEquiposLoading"
  @hide="resetRecibirEquipos"
>
  <template #header>
    <div class="flex items-center gap-3">
      <div class="bg-gradient-to-r from-blue-500 to-purple-600 p-2 rounded-lg">
        <i class="pi pi-mobile text-white text-xl"></i>
      </div>
      <div>
        <h2 class="text-lg font-bold text-slate-800 dark:text-white m-0">Recibir Equipos (Cambiazo)</h2>
        <p class="text-sm text-slate-500 dark:text-slate-400 m-0">Registrar equipo usado entrante al inventario</p>
      </div>
    </div>
  </template>

  <!-- Stepper Indicador -->
  <div class="flex justify-center mb-6">
    <div class="flex items-center gap-2">
      <div :class="['flex items-center justify-center w-10 h-10 rounded-full font-bold text-sm transition-all', recibirEquiposStep >= 0 ? 'bg-blue-500 text-white' : 'bg-slate-200 text-slate-500']">
        1
      </div>
      <span :class="['text-sm font-medium', recibirEquiposStep >= 0 ? 'text-blue-600' : 'text-slate-400']">Equipo</span>
      <div class="w-12 h-1 bg-slate-200 rounded">
        <div :class="['h-full rounded transition-all', recibirEquiposStep >= 1 ? 'bg-blue-500 w-full' : 'w-0']"></div>
      </div>
      <div :class="['flex items-center justify-center w-10 h-10 rounded-full font-bold text-sm transition-all', recibirEquiposStep >= 1 ? 'bg-blue-500 text-white' : 'bg-slate-200 text-slate-500']">
        2
      </div>
      <span :class="['text-sm font-medium', recibirEquiposStep >= 1 ? 'text-blue-600' : 'text-slate-400']">Persona</span>
      <div class="w-12 h-1 bg-slate-200 rounded">
        <div :class="['h-full rounded transition-all', recibirEquiposStep >= 2 ? 'bg-blue-500 w-full' : 'w-0']"></div>
      </div>
      <div :class="['flex items-center justify-center w-10 h-10 rounded-full font-bold text-sm transition-all', recibirEquiposStep >= 2 ? 'bg-blue-500 text-white' : 'bg-slate-200 text-slate-500']">
        3
      </div>
      <span :class="['text-sm font-medium', recibirEquiposStep >= 2 ? 'text-blue-600' : 'text-slate-400']">Confirmar</span>
    </div>
  </div>

  <!-- PASO 1: DATOS DEL EQUIPO -->
  <div v-show="recibirEquiposStep === 0" class="space-y-4">
    <div class="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-slate-800 dark:to-slate-700 rounded-xl p-4">
      <h3 class="text-base font-semibold text-slate-700 dark:text-white mb-4 flex items-center gap-2">
        <i class="pi pi-mobile text-blue-500"></i>
        Datos del Equipo Recibido
      </h3>

      <!-- IMEI -->
      <div class="mb-4">
        <label class="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">IMEI *</label>
        <div class="flex gap-2">
          <InputText
            v-model="equipoRecibido.imei"
            placeholder="Ingrese el IMEI del equipo"
            class="flex-1"
            :class="{ 'p-invalid': recibirEquiposErrors.imei }"
            maxlength="16"
          />
          <Button
            icon="pi pi-search"
            label="Buscar"
            :loading="recibirEquiposBuscandoImei"
            @click="buscarEquipoPorIMEI"
            severity="info"
          />
        </div>
        <small v-if="recibirEquiposErrors.imei" class="text-red-500">{{ recibirEquiposErrors.imei }}</small>
        <small v-if="imeiYaExiste" class="text-orange-500 block mt-1">
          <i class="pi pi-exclamation-triangle"></i> Este IMEI ya existe en el sistema
        </small>
      </div>

      <!-- Marca y Modelo -->
      <div class="grid grid-cols-2 gap-4 mb-4">
        <div>
          <label class="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">Marca *</label>
          <InputText
            v-model="equipoRecibido.marca"
            placeholder="Ej: Apple, Samsung"
            class="w-full"
            :class="{ 'p-invalid': recibirEquiposErrors.marca }"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">Modelo *</label>
          <InputText
            v-model="equipoRecibido.modelo"
            placeholder="Ej: iPhone 14 Pro"
            class="w-full"
            :class="{ 'p-invalid': recibirEquiposErrors.modelo }"
          />
        </div>
      </div>

      <!-- Color y Capacidad -->
      <div class="grid grid-cols-2 gap-4 mb-4">
        <div>
          <label class="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">Color</label>
          <InputText
            v-model="equipoRecibido.color"
            placeholder="Ej: Negro, Azul"
            class="w-full"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">Capacidad</label>
          <InputText
            v-model="equipoRecibido.capacidad"
            placeholder="Ej: 128GB, 256GB"
            class="w-full"
          />
        </div>
      </div>

      <!-- Condición -->
      <div class="mb-4">
        <label class="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">Condición del Equipo</label>
        <Select
          v-model="equipoRecibido.condicion"
          :options="opcionesCondicion"
          optionLabel="label"
          optionValue="value"
          placeholder="Seleccione condición"
          class="w-full"
        />
      </div>

      <!-- Estado Batería y Pantalla -->
      <div class="grid grid-cols-2 gap-4 mb-4">
        <div>
          <label class="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">Estado Batería</label>
          <Select
            v-model="equipoRecibido.estado_bateria"
            :options="opcionesEstado"
            optionLabel="label"
            optionValue="value"
            class="w-full"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">Estado Pantalla</label>
          <Select
            v-model="equipoRecibido.estado_pantalla"
            :options="opcionesEstado"
            optionLabel="label"
            optionValue="value"
            class="w-full"
          />
        </div>
      </div>

      <!-- Accesorios incluidos -->
      <div class="mb-4">
        <label class="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">Accesorios Incluidos</label>
        <div class="flex flex-wrap gap-4">
          <div class="flex items-center gap-2">
            <Checkbox v-model="equipoRecibido.incluye_cargador" binary inputId="incluyeCargador" />
            <label for="incluyeCargador" class="text-sm">Cargador</label>
          </div>
          <div class="flex items-center gap-2">
            <Checkbox v-model="equipoRecibido.incluye_caja" binary inputId="incluyeCaja" />
            <label for="incluyeCaja" class="text-sm">Caja Original</label>
          </div>
          <div class="flex items-center gap-2">
            <Checkbox v-model="equipoRecibido.incluye_audifonos" binary inputId="incluyeAudifonos" />
            <label for="incluyeAudifonos" class="text-sm">Audífonos</label>
          </div>
        </div>
      </div>

      <!-- Observaciones -->
      <div class="mb-4">
        <label class="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">Observaciones</label>
        <Textarea
          v-model="equipoRecibido.observaciones"
          rows="2"
          placeholder="Rayones, detalles de la batería, etc."
          class="w-full"
        />
      </div>

      <!-- Precios -->
      <div class="grid grid-cols-2 gap-4 p-4 bg-white dark:bg-slate-800 rounded-lg border-2 border-blue-200 dark:border-blue-800">
        <div>
          <label class="block text-sm font-bold text-green-600 mb-1">
            <i class="pi pi-arrow-down"></i> Precio Compra (Lo que se paga) *
          </label>
          <InputNumber
            v-model="equipoRecibido.precio_compra"
            mode="currency"
            currency="DOP"
            locale="es-DO"
            class="w-full"
            :class="{ 'p-invalid': recibirEquiposErrors.precio_compra }"
          />
          <small v-if="recibirEquiposErrors.precio_compra" class="text-red-500">{{ recibirEquiposErrors.precio_compra }}</small>
        </div>
        <div>
          <label class="block text-sm font-bold text-blue-600 mb-1">
            <i class="pi pi-arrow-up"></i> Precio Venta Sugerido *
          </label>
          <InputNumber
            v-model="equipoRecibido.precio_venta"
            mode="currency"
            currency="DOP"
            locale="es-DO"
            class="w-full"
            :class="{ 'p-invalid': recibirEquiposErrors.precio_venta }"
          />
          <small v-if="recibirEquiposErrors.precio_venta" class="text-red-500">{{ recibirEquiposErrors.precio_venta }}</small>
        </div>
      </div>

      <!-- Ganancia estimada -->
      <div v-if="equipoRecibido.precio_compra > 0 && equipoRecibido.precio_venta > 0" class="mt-3 p-3 rounded-lg text-center"
        :class="equipoRecibido.precio_venta > equipoRecibido.precio_compra ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'">
        <span class="font-semibold">
          Ganancia Estimada: RD$ {{ (equipoRecibido.precio_venta - equipoRecibido.precio_compra).toFixed(2) }}
        </span>
      </div>
    </div>
  </div>

  <!-- PASO 2: DATOS DE LA PERSONA -->
  <div v-show="recibirEquiposStep === 1" class="space-y-4">
    <div class="bg-gradient-to-r from-green-50 to-teal-50 dark:from-slate-800 dark:to-slate-700 rounded-xl p-4">
      <h3 class="text-base font-semibold text-slate-700 dark:text-white mb-4 flex items-center gap-2">
        <i class="pi pi-user text-green-500"></i>
        Datos de la Persona que Entrega el Equipo
      </h3>

      <!-- Cédula -->
      <div class="mb-4">
        <label class="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">Cédula / RNC *</label>
        <div class="flex gap-2">
          <InputText
            v-model="personaCambiazo.cedula"
            placeholder="Ej: 001-1234567-8"
            class="flex-1"
            :class="{ 'p-invalid': recibirEquiposErrors.cedula }"
          />
          <Button
            icon="pi pi-search"
            label="Consultar"
            :loading="recibirEquiposBuscandoCedula"
            @click="consultarPersonaPorCedula"
            severity="success"
          />
        </div>
        <small v-if="recibirEquiposErrors.cedula" class="text-red-500">{{ recibirEquiposErrors.cedula }}</small>
      </div>

      <!-- Nombre -->
      <div class="mb-4">
        <label class="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">Nombre Completo *</label>
        <InputText
          v-model="personaCambiazo.nombre"
          placeholder="Nombre de la persona"
          class="w-full"
          :class="{ 'p-invalid': recibirEquiposErrors.nombre }"
        />
        <small v-if="recibirEquiposErrors.nombre" class="text-red-500">{{ recibirEquiposErrors.nombre }}</small>
      </div>

      <!-- Teléfono y Dirección -->
      <div class="grid grid-cols-2 gap-4 mb-4">
        <div>
          <label class="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">Teléfono</label>
          <InputText
            v-model="personaCambiazo.telefono"
            placeholder="809-000-0000"
            class="w-full"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">Dirección</label>
          <InputText
            v-model="personaCambiazo.direccion"
            placeholder="Dirección"
            class="w-full"
          />
        </div>
      </div>

      <!-- Botón guardar nueva persona -->
      <div v-if="personaCambiazo.es_nuevo && personaCambiazo.nombre" class="mt-4">
        <Button
          icon="pi pi-save"
          label="Guardar como Nueva Persona"
          @click="guardarNuevaPersona"
          severity="warning"
          outlined
          class="w-full"
        />
      </div>
    </div>
  </div>

  <!-- PASO 3: CONFIGURACIÓN Y CONFIRMACIÓN -->
  <div v-show="recibirEquiposStep === 2" class="space-y-4">
    <!-- Resumen del equipo -->
    <div class="bg-slate-100 dark:bg-slate-800 rounded-xl p-4 mb-4">
      <h4 class="font-semibold text-slate-700 dark:text-white mb-3">Resumen del Equipo</h4>
      <div class="grid grid-cols-2 gap-2 text-sm">
        <div><span class="text-slate-500">IMEI:</span> <span class="font-medium">{{ equipoRecibido.imei }}</span></div>
        <div><span class="text-slate-500">Equipo:</span> <span class="font-medium">{{ equipoRecibido.marca }} {{ equipoRecibido.modelo }}</span></div>
        <div><span class="text-slate-500">Precio Compra:</span> <span class="font-bold text-green-600">RD$ {{ equipoRecibido.precio_compra?.toFixed(2) }}</span></div>
        <div><span class="text-slate-500">Precio Venta:</span> <span class="font-bold text-blue-600">RD$ {{ equipoRecibido.precio_venta?.toFixed(2) }}</span></div>
        <div><span class="text-slate-500">Persona:</span> <span class="font-medium">{{ personaCambiazo.nombre }}</span></div>
        <div><span class="text-slate-500">Cédula:</span> <span class="font-medium">{{ personaCambiazo.cedula }}</span></div>
      </div>
    </div>

    <!-- Configuración de la transacción -->
    <div class="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-slate-800 dark:to-slate-700 rounded-xl p-4">
      <h3 class="text-base font-semibold text-slate-700 dark:text-white mb-4 flex items-center gap-2">
        <i class="pi pi-cog text-purple-500"></i>
        Configuración de la Transacción
      </h3>

      <!-- Tipo de registro -->
      <div class="mb-4">
        <label class="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">Registrar cambiazo como:</label>
        <div class="flex flex-col gap-3">
          <div v-for="opcion in opcionesTipoRegistro" :key="opcion.value"
            :class="['p-3 rounded-lg border-2 cursor-pointer transition-all', transaccionCambiazo.tipo_registro === opcion.value ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/30' : 'border-slate-200 dark:border-slate-600 hover:border-purple-300']"
            @click="transaccionCambiazo.tipo_registro = opcion.value">
            <div class="flex items-center gap-2">
              <RadioButton v-model="transaccionCambiazo.tipo_registro" :inputId="opcion.value" :value="opcion.value" />
              <label :for="opcion.value" class="font-medium cursor-pointer">{{ opcion.label }}</label>
            </div>
          </div>
        </div>
      </div>

      <!-- Método de pago -->
      <div class="mb-4">
        <label class="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">Origen del Dinero:</label>
        <Select
          v-model="transaccionCambiazo.metodo_pago"
          :options="opcionesMetodoPago"
          optionLabel="label"
          optionValue="value"
          class="w-full"
        />
      </div>

      <!-- Checkboxes -->
      <div class="flex flex-wrap gap-4 mb-4">
        <div class="flex items-center gap-2">
          <Checkbox v-model="transaccionCambiazo.sale_de_caja" binary inputId="saleDeCaja" />
          <label for="saleDeCaja" class="text-sm font-medium">Afecta efectivo en caja</label>
        </div>
        <div class="flex items-center gap-2">
          <Checkbox v-model="transaccionCambiazo.afecta_compras" binary inputId="afectaCompras" />
          <label for="afectaCompras" class="text-sm font-medium">Registrar en compras</label>
        </div>
      </div>

      <!-- Alerta de efectivo insuficiente -->
      <div v-if="efectivoCajaInsuficiente && transaccionCambiazo.metodo_pago === 'EFECTIVO'" class="p-3 bg-red-100 dark:bg-red-900/30 rounded-lg mb-4">
        <p class="text-red-700 dark:text-red-300 text-sm font-medium">
          <i class="pi pi-exclamation-triangle mr-1"></i>
          Efectivo insuficiente en caja para completar esta operación.
        </p>
      </div>

      <!-- Nota adicional -->
      <div>
        <label class="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">Nota Adicional</label>
        <Textarea
          v-model="transaccionCambiazo.nota"
          rows="2"
          placeholder="Nota adicional para esta transacción..."
          class="w-full"
        />
      </div>
    </div>
  </div>

  <!-- Footer con botones de navegación -->
  <template #footer>
    <div class="flex justify-between items-center w-full">
      <Button
        v-if="recibirEquiposStep > 0"
        icon="pi pi-arrow-left"
        label="Anterior"
        severity="secondary"
        outlined
        @click="anteriorPasoRecibirEquipos"
        :disabled="recibirEquiposLoading"
      />
      <div v-else></div>

      <div class="flex gap-2">
        <Button
          label="Cancelar"
          icon="pi pi-times"
          severity="danger"
          outlined
          @click="visibleRecibirEquipos = false"
          :disabled="recibirEquiposLoading"
        />

        <Button
          v-if="recibirEquiposStep < 2"
          icon="pi pi-arrow-right"
          label="Siguiente"
          iconPos="right"
          @click="siguientePasoRecibirEquipos"
        />

        <Button
          v-else
          icon="pi pi-check"
          label="Confirmar Cambiazo"
          severity="success"
          :loading="recibirEquiposLoading"
          @click="procesarCambiazo"
        />
      </div>
    </div>
  </template>
</Dialog>

 <!-- ////////////////////////////////////////////////////////////////////////////////////////// -->
 <!-- ////////////////////////////////////////////////////////////////////////////////////////// -->
    <Dock :model="filteredItemsMenuFixed" :position="posicionMenu"  :class="menuClasses">
                <template #itemicon="{ item }" >
                  <a v-tooltip.top="item.label" href="#" class="p-dock-item-link" @click="onDockItemClick($event, item)">
                    <img :alt="item.label" :src="item.icon" style="width: 100%" />
                   </a>
                </template>
    </Dock>
 <!-- ////////////////////////////////////////////////////////////////////////////////////////// -->
 <div v-if="visibleCobro" class="fixed-div0 p-fluid" hidden>
    <div class="content">
      <div class="w-full px-4"  :data-bs-theme="isDarkMode ? 'dark' : 'light'">
        <div class="grid grid-cols-12 gap-4">
          <div class="col-span-9">
          
          <!--   <Button label="Cliente (F8)" v-if="barraMenu.cliente" icon="pi pi-users" @click="visiblecliente = true" size="small" iconPos="top" raised /> -->
           <!--  <Button label="OTRO PROD" v-if="barraMenu.otro"  icon="pi icon-th" @click="visibleOtroArticulo = true" raised iconPos="top" size="small" />

            <Button label="Nueva (Del)" v-if="barraMenu.nueva"  icon="pi pi-eraser" @click="nuevaFactura" raised iconPos="top" size="small" />
            <Button label="Fact / Coti (F3)" v-if="barraMenu.factcoti"  icon="pi pi-file" @click="visiblefatcoti = true" raised iconPos="top" size="small" />
            <Button label="Ventas en Proceso" v-if="barraMenu.proceso"  icon="pi pi-users" @click="visibleSideBar = true" raised iconPos="top" size="small" />
            

            <Button label="POS" v-if="datosDefault.activar_pos == 'true' && barraMenu.pos"  icon="pi pi-credit-card" @click="visiblePOS = true" style="padding-left: 20px;padding-right: 20px;" raised iconPos="top" size="small" />
           
            <Button label="MESAS"  icon="pi pi-table" v-if="datosDefault.modo === 'RESTAURANTE' && barraMenu.mesas" @click="visibleMESAS = true" raised iconPos="top" size="small" />
            
            <Button label="Venta Rápida (F4)" v-if="barraMenu.generar" icon="pi pi-angle-double-right" @click="guardarFactura" raised iconPos="top" size="small" />

            <Button label="Descuento" icon="pi pi-money-bill" @click="visibleDescuento = true" raised iconPos="top" size="small" />

            <Button label="Facturar (F2)" v-if="barraMenu.generar" icon="pi pi-check" @click="visiblecobrar = true" raised iconPos="top" size="small" />


            <Button label="Imprimir"  icon="pi pi-print" v-if="numerodocumentoEditado && barraMenu.imprimir" @click="fnimpresionFactura" raised iconPos="top" size="small" /> -->

            <Button label="Ocultar" v-if="barraMenu.ocultar" icon="pi pi-eye-slash" @click="visibleCobro = false" raised iconPos="top" size="small" />
            <!-- <Button label="Medidas"  v-if="datosDefault.modo == 'FABRICA' && barraMenu.medidas"  icon="pi pi-sort-numeric-up" @click="modalMedidas = true" raised iconPos="top" size="small" /> -->
          
          </div>

<!--           <div class="md:col-span-3 bordeado">
            <div id="totalfactura">{{ datosConfiguracion.simbolo }}{{ totalfactura.toFixed(2) }}</div>
          </div> -->
        </div>
      </div>
    </div>
  </div>
  <div v-else class="tab-hidden">
    <Button label="Mostrar" icon="pi pi-eye" @click="visibleCobro = true" raised iconPos="top"  />
  </div>

    <!--       <div class="md:col-span-3 bordeado">
            <div id="totalfactura">{{ formatoMonedaRD(totalfactura) }}</div>
          </div> -->
 <!-- ////////////////////////////////////////////////////////////////////////////////////////// -->
         <Drawer v-model:visible="visibleSideBar" header="Ventas En Proceso">
          <div class="grid grid-cols-12 gap-4">
            <div class="col-span-12">
              <div class="card flex justify-content-center">
                <Button :label="botonLabel" @click="crearventaProceso" />
               </div>
            </div>
            <div class="col-span-12 mt-1" v-if="ventasGuardadas.length > 0">


  <fieldset class="border p-3 rounded mb-2">
    <legend class="float-none w-auto px-2">Ventas Guardadas</legend>
    <div class="grid-container">
      <div v-for="item in ventasGuardadas" :key="item.id" class="grid-item">
        <div class="button-container">
          <Button
            type="button"
            :label="item.nombre"
            :badge="calcularTotalProductos(item.productos)"
            :class="{ 'btn-seleccionado': item.cod_cliente === clienteSeleccionado }"
            @click="ventaProceso(item.cod_cliente)"
            class="full-width-button mr-2"
          />
          <Button
            v-if="item.cod_cliente === clienteSeleccionado"
            type="button"
            icon="pi pi-times"
            class="p-button-danger p-button-rounded p-button-icon-only"
            @click.prevent="eliminarVenta(item.id)"
          />
        </div>
      </div>
    </div>
  </fieldset>


</div>
</div>
        </Drawer>
 <!-- ////////////////////////////////////////////////////////////////////////////////////////// -->
  <Drawer v-model:visible="visiblePOS" :header="`POS ATENDIENDO A (${ documentoActual })`" position="bottom" style="height: 100vh">
    <div class="category-scroll-container">
      <Button
        outlined
        label="Todos"
        class="category-item"
        @click="filterProductsByCategory(null)"
        :class="{ 'active-category': selectedCategory === null }"
      />

      <Button
        outlined
        :label="category.nombre"
        v-for="category in categoriasArray"
        :key="category.id"
        class="category-item"
        @click="filterProductsByCategory(category.nombre)"
        :class="{ 'active-category': category.nombre === selectedCategory }"
        :icon="`pi ${category.icono}`"
      />
    </div>
    <div class="search-container">
      <input
        v-model="searchQuery"
        type="text"
        v-tecladovirtual="(event) => handleFocus('text', event.target)"
        placeholder="Buscar productos..."
        class="search-input"
      />
     </div>
    <div class="grid grid-cols-12 gap-4">
      <div class="col-span-12 mt-1" v-if="filteredProductos.length > 0">
        <div class="scroll-container">
          <fieldset class="border p-3 rounded mb-2">
            <legend class="float-none w-auto px-2">PRODUCTOS</legend>
            <div class="grid grid-cols-12 gap-4 product-scroll-container">
              <div v-for="item in filteredProductos" :key="item.id" style="max-height: 300px;" class="col-span-12 sm:col-span-4 md:col-span-3 lg:col-span-2 mt-3">
                <a href="#" @click="fnAgregarProductoPOS(item.codigo)">
                <Card class="custom-card">
                  <template #header>
                  </template>
                  <template #title> <span class="texto-nombre-producto">{{ item.nombre }}</span></template>
                  <template #subtitle><span class="texto-precio-producto">{{datosConfiguracion.simbolo+ Number(item.precio_venta).toFixed(2) }}</span></template>
                  <template #content>
                                         <img 
                        alt="user header" 
                        :src="getProductImage(item.imagen)" 
                        class="custom-image" 
                      />
                  </template>
                </Card>
                </a>
              </div>
            </div>
          </fieldset>
        </div>
      </div>
    </div>
  </Drawer>
 <!-- ////////////////////////////////////////////////////////////////////////////////////////// -->
  <Drawer v-model:visible="visibleMESAS" header="SISTEMA DE MESAS" position="bottom" style="height: 100vh">
    <div class="grid grid-cols-12 gap-4">
      <div class="col-span-12 mt-1" v-if="mesasArray.length > 0">
        <div class="scroll-container">
          <fieldset class="border p-3 rounded mb-2">
            <legend class="float-none w-auto px-2">MESAS</legend>
            <div class="grid grid-cols-12 gap-4">
              <div v-for="item in mesasArray" :key="item.id" class="col-span-12 md:col-span-6 mb-3">
                <Card :class="{'card-empty': isEmpty(item.productos), 'card-filled': !isEmpty(item.productos)}">
                  <template #header>
                  </template>
                  <template #content>
                    <table v-if="!isEmpty(item.productos)" class="table">
                      <thead>
                        <tr>
                          <th>Prod.</th>
                          <th>Cant.</th>
                          <th>Precio</th>
                          <th>Subtotal</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr v-for="prod in parseProductos(item.productos)" :key="prod.id">
                          <td>{{ prod.nombre }}</td>
                          <td>{{ prod.cantidad }}</td>
                          <td>{{ prod.precio_venta }}</td>
                          <td>{{ calculateSubtotal(prod.cantidad, prod.precio_venta) }}</td>
                        </tr>
                      </tbody>
                    </table>
                    <p v-else class="text-center">No hay productos</p>
                  </template>
                  <template #footer>
                    <div class="flex gap-3 mt-1">
                      <Button label="Agregar" @click="fnAgregarProductoMESA(item.id)" class="w-full" />
                      <Button label="Limpiar" @click="fnLimpiarMesa(item.id)" class="w-full" />
                      <Button label="Imprimir" @click="fnImprimirMesa(item.id)" class="w-full" />
                      <Button label="Cobrar" @click="fnCobrarMesa(item.id)" class="w-full" />
                    </div>
                  </template>
                    <h1 class="text-center">{{ item.nombre }}</h1>
                </Card>
              </div>
            </div>
          </fieldset>
        </div>
      </div>
    </div>
  </Drawer>
 <!-- ////////////////////////////////////////////////////////////////////////////////////////// -->

  <Drawer
    v-model:visible="visibleCredito"
    header="💳 Venta a Crédito"
    class="!w-full md:!w-96 lg:!w-[30rem]"
  >
    <div class="space-y-4 p-2">

      <!-- OPCIÓN DE DÍAS -->
      <div class="card flex justify-center">
        <OptionButtonTM
          v-model="diasCREDITO"
          @change="fncantDiasCREDITO"
          :options="optionsCREDITO"
          aria-labelledby="basic"
        />
      </div>

      <!-- FECHA DE VENCIMIENTO E INSTITUCIÓN -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div class="flex flex-col">
          <label for="fechaCREDITO" class="font-semibold mb-1 text-gray-700 dark:text-gray-300">
            Fecha de Vencimiento
          </label>
          <Calendar
            v-model="fechaCREDITO"
            showIcon
            dateFormat="dd/mm/yy"
            inputId="fechaCREDITO"
            class="w-full"
          />
        </div>

        <div class="flex flex-col">
          <label for="institucion" class="font-semibold mb-1 text-gray-700 dark:text-gray-300">
            Institución
          </label>
          <Select
            v-model="institucion"
            :options="intitucionesDataNames"
            placeholder="Seleccionar institución"
            class="w-full"
            @change="fnCambioInstitucion"
          />
        </div>
      </div>

      <!-- A QUIÉN VA EL CRÉDITO -->
      <div class="flex flex-col items-center justify-center mt-2">
        <label class="font-semibold mb-1 text-gray-700 dark:text-gray-300">
          ¿A quién va el crédito?
        </label>
        <SelectButton
          v-model="quienCredito"
          :options="['CLIENTE', 'INSTITUCION', 'AMBAS']"
          @change="cambiosQuienCredito"
          :allowEmpty="false"
        />
      </div>

      <!-- TIPO DE CRÉDITO -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label for="tipoCredito" class="font-semibold mb-1 text-gray-700 dark:text-gray-300">Tipo</label>
          <Select
            v-model="tipoCredito"
            :options="['NORMAL', 'CUOTAS']"
            placeholder="Tipo de crédito"
            class="w-full"
          />
        </div>

        <div v-if="tipoCredito === 'CUOTAS'">
          <label for="cuotasCredito" class="font-semibold mb-1 text-gray-700 dark:text-gray-300">Cuotas</label>
          <InputNumber
            v-model="cuotasCredito"
            :min="1"
            :max="100"
            mode="decimal"
            class="w-full"
          />
        </div>
      </div>

      <!-- INTERÉS Y TIEMPO -->
      <div v-if="tipoCredito === 'CUOTAS'" class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label for="interesCredito" class="font-semibold mb-1 text-gray-700 dark:text-gray-300">Interés (%)</label>
          <InputText
            v-model="interesCredito"
            v-solonumeros
            v-numeroFocusinOut 
            v-decimales
            class="w-full"
          />
        </div>

        <div>
          <label for="tiempoCredito" class="font-semibold mb-1 text-gray-700 dark:text-gray-300">Tiempo</label>
          <Select
            v-model="tiempoCredito"
            :options="['DIARIO', 'SEMANAL', 'QUINCENAL', 'MENSUAL', 'LOS 15', 'LOS 30']"
            placeholder="Periodo"
            class="w-full"
          />
        </div>
      </div>

      <!-- ABONO Y MÉTODO -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label for="abono" class="font-semibold mb-1 text-gray-700 dark:text-gray-300">Abono</label>
          <InputText
            v-model="abonoCREDITO"
            @keyup="fnCalcularCREDITO"
            v-solonumeros
            v-numeroFocusinOut 
            v-decimales
            class="w-full"
          />
        </div>

        <div>
          <label for="metodoCREDITO" class="font-semibold mb-1 text-gray-700 dark:text-gray-300">Método</label>
          <Select
            v-model="metodoPagoCREDITO"
            :options="['EFECTIVO', 'TRANSFERENCIA', 'TARJETA']"
            placeholder="Seleccionar método"
            class="w-full"
          />
        </div>
      </div>

      <!-- Monto y Saldo -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label class="font-semibold mb-1 text-gray-700 dark:text-gray-300">Monto</label>
          <InputNumber
            v-model="montoCREDITO"
            mode="currency"
            currency="DOP"
            locale="es-DO"
            readonly
            class="w-full"
          />
        </div>
        <div>
          <label class="font-semibold mb-1 text-gray-700 dark:text-gray-300">Saldo</label>
          <InputNumber
            v-model="saldoCREDITO"
            mode="currency"
            currency="DOP"
            locale="es-DO"
            readonly
            class="w-full"
          />
        </div>
      </div>

      <!-- Campos exclusivos de CUOTAS -->
      <div v-if="tipoCredito === 'CUOTAS'" class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label class="font-semibold mb-1 text-gray-700 dark:text-gray-300">Valor por Cuota</label>
          <InputNumber
            v-model="valorCuotasCredito"
            mode="currency"
            currency="DOP"
            locale="es-DO"
            readonly
            class="w-full"
          />
        </div>
        <div>
          <label class="font-semibold mb-1 text-gray-700 dark:text-gray-300">Total (Saldo + Interés)</label>
          <InputNumber
            v-model="totalCreditoConInteres"
            mode="currency"
            currency="DOP"
            locale="es-DO"
            readonly
            class="w-full"
          />
        </div>
      </div>

      <!-- Fechas de pago -->
      <div v-if="tipoCredito === 'CUOTAS'">
        <label for="fechasPago" class="font-semibold mb-1 text-gray-700 dark:text-gray-300">
          Fechas de Pago
        </label>
        <Textarea
          id="fechasPago"
          v-model="fechasPagocredito"
          rows="3"
          placeholder="Ejemplo: 15/05, 30/05, 15/06..."
          class="w-full"
        />
      </div>

      <!-- Nota -->
      <div>
        <label for="notaCREDITO" class="font-semibold mb-1 text-gray-700 dark:text-gray-300">
          Nota
        </label>
        <Textarea
          id="notaCREDITO"
          v-model="notaCREDITO"
          rows="3"
          placeholder="Escriba una nota u observación"
          class="w-full"
        />
      </div>

      <!-- BOTONES -->
      <div class="flex justify-end gap-3 mt-5">
        <Button
          label="Cancelar"
          icon="pi pi-times"
          text
          severity="danger"
          @click="visibleCredito = false"
        />
        <Button
          label="Guardar"
          icon="pi pi-check"
          severity="success"
          @click="fnGuardarCredito"
        />
      </div>

    </div>
  </Drawer>
 <!-- ////////////////////////////////////////////////////////////////////////////////////////// -->
           <Drawer v-model:visible="modalMedidas"  position="top" header="MEDIDAS" :style="{ height: '30rem' }">
        <fieldset class="border p-3 rounded mb-2">
         <legend class="float-none w-auto px-2">Seleccione Las Medidas</legend>
           <div class="grid grid-cols-12 gap-4">
  <div class="col-span-4 md:col-span-2 form-group">
    <label for="descuento">ANCHO - PULGADAS</label>
    <div class="input-group">
      <input
        type="text"
        class="form-control"
        style="height: 50px;"
        v-solonumeros
        v-decimales
        v-numeroFocusinOut
        v-model="medidaA"
        @input="updateCmFromInches('A')"
              />
      <select
        class="form-select"
        style="height: 50px;"
        v-model="selectedFractionA"
        @change="updateMedida('A')"
      >
        <option value="0">0</option>
        <option value="1/16">1/16</option>
        <option value="1/8">1/8</option>
        <option value="3/16">3/16</option>
        <option value="1/4">1/4</option>
        <option value="5/16">5/16</option>
        <option value="3/8">3/8</option>
        <option value="7/16">7/16</option>
        <option value="1/2">1/2</option>
        <option value="9/16">9/16</option>
        <option value="5/8">5/8</option>
        <option value="11/16">11/16</option>
        <option value="3/4">3/4</option>
        <option value="13/16">13/16</option>
        <option value="7/8">7/8</option>
        <option value="15/16">15/16</option>
      </select>
    </div>
  </div>


  <div class="col-span-4 md:col-span-2 form-group">
    <label for="descuento">ALTURA - PULGADAS</label>
    <div class="input-group">
      <input
        type="text"
        class="form-control"
        style="height: 50px;"
        v-solonumeros
        v-decimales
        v-numeroFocusinOut
        v-model="medidaB"
        @input="updateCmFromInches('B')"
      />
      <select
        class="form-select"
        style="height: 50px;"
        v-model="selectedFractionB"
        @change="updateMedida('B')"
      >
        <option value="0">0</option>
        <option value="1/16">1/16</option>
        <option value="1/8">1/8</option>
        <option value="3/16">3/16</option>
        <option value="1/4">1/4</option>
        <option value="5/16">5/16</option>
        <option value="3/8">3/8</option>
        <option value="7/16">7/16</option>
        <option value="1/2">1/2</option>
        <option value="9/16">9/16</option>
        <option value="5/8">5/8</option>
        <option value="11/16">11/16</option>
        <option value="3/4">3/4</option>
        <option value="13/16">13/16</option>
        <option value="7/8">7/8</option>
        <option value="15/16">15/16</option>
      </select>
    </div>
  </div>

  <div class="col-span-4 md:col-span-1 form-group">
    <label for="descuento">ANCHO - CM</label>
      <input
        type="text"
        class="form-control"
        style="height: 50px;"
        v-solonumeros
        v-decimales
        v-numeroFocusinOut
        v-model="medidaACM"
        @input="updateInchesFromCm('A')"
      />
  </div>

  <div class="col-span-4 md:col-span-1 form-group">
    <label for="descuento">ALTURA - CM</label>
      <input
        type="text"
        class="form-control"
        style="height: 50px;"
        v-solonumeros
        v-decimales
        v-numeroFocusinOut
        v-model="medidaBCM"
         @input="updateInchesFromCm('B')"
      />
  </div>


            <div class="col-span-4 md:col-span-2 form-group">
              <label for="descuento">Resultado Pulgadas</label>
              <input
                type="text"
                class="form-control"
                style="height: 50px;"
                v-model="cantidadMedida"
               readonly
               />
            </div>

            <div class="col-span-4 md:col-span-2 form-group">
              <label for="descuento">Resultado (pie cuadrado)</label>
              <input
                type="text"
                class="form-control"
                style="height: 50px;"
                v-model="resultadoMedida"
                v-solonumeros
                v-decimales
               v-numeroFocusinOut
               @keyup="fnCalculoPie"
              />
            </div>



            <div class="col-span-4 md:col-span-2 form-group">
              <label for="descuento">DESCRIPCION</label>
             <select name="metodoCREDITO" style="height: 50px;" class="form-control" id="colorMedida"  v-model="descripcionMedida" @change="calculoMedida">
                 <option :value="item.descripcion"  v-for="item in datosFabrica">{{item.descripcion}}</option>
              </select>
            </div>

            <div class="col-span-4 md:col-span-1 form-group">
              <label for="descuento">COLOR</label>
             <select name="metodoCREDITO" style="height: 50px;" class="form-control" id="colorMedida"  v-model="colorMedida"  @change="calculoMedida">
                 <option value="BLANCO">BLANCO</option>
                 <option value="PLATA">PLATA</option>
                 <option value="NEGRO">NEGRO</option>
                 <option value="MADERA">MADERA</option>
                 <option value="INOX">INOX</option>
                 <option value="ROBLE">ROBLE</option>
                 <option value="NEGRO TEXTURIZADO">NEGRO TEXTURIZADO</option>
              </select>
            </div>

            <div class="col-span-4 md:col-span-2 form-group">
              <label for="descuento">VIDRIO</label>
             <select name="metodoCREDITO" style="height: 50px;" class="form-control" id="colorMedida"  v-model="vidrioMedida" @change="fnCalcularVidrio">
                 <option :value="medida.nombre" :key="medida.id" v-for="medida in datosMedidaArray">{{medida.nombre}} {{medida.medida}}</option>
               </select>
            </div>


            <div class="col-span-4 md:col-span-2 form-group">
              <label for="descuento">MEDIDA VIDRIO</label>
             <select name="metodoCREDITO" style="height: 50px;" class="form-control" id="colorMedida"  v-model="medidaVidrioMedida">
                 <option :value="medida.medida" v-for="medida in datosMedidaArray">{{medida.medida}}</option>
              </select>
            </div>




            <div class="col-span-4 md:col-span-1 form-group">
              <label for="descuento">P. VIDRIO</label>
              <input
                type="text"
                class="form-control"
                style="height: 50px;"
                v-solonumeros
                v-decimales
                v-numeroFocusinOut
                v-model="preciovidrioMedida"
                @input="fnCalcularVidrio"
               />
            </div>


<div class="col-span-4 md:col-span-2 form-group">
    <label for="descuento">MARCOS 3 VIAS + SCREEN</label>
    <div class="input-group">
      <input
        type="text"
        class="form-control"
        style="height: 50px;"
        v-solonumeros
        v-decimales
        v-numeroFocusinOut
        v-model="medidaMarco"
        @input="fnCambioFullMarcoKeyDown"
      />
      <select
        class="form-select"
        style="height: 50px;"
        v-model="selectedmedidaMarco"
        @change="fnCambioFullMarco"
      >
        <option value="FULL">FULL</option>
        <option value="SOLO MARCO">SOLO MARCO</option>
      </select>
    </div>
  </div>



            <div class="col-span-4 md:col-span-2 form-group">
              <label for="descuento">TOTAL VIDRIO</label>
              <input
                type="text"
                class="form-control"
                style="height: 50px;"
                readonly
                v-model="preciovidrioMedidaTotal"
                @input="calculoMedida"
               />
            </div>


            <div class="col-span-4 md:col-span-2 form-group">
              <label for="descuento">PRECIO FINAL</label>
              <input
                type="text"
                class="form-control"
                style="height: 50px;"
                 readonly
                v-model="cantidadFinalMedida"
               />
            </div>

  <div class="col-span-12 form-group text-right mt-2">
    <label for="">Botones de Acción</label>
    <div class="button-group">
      <Button label="Generar Producto" class="ml-2" severity="warn" @click="fnGenerarPorMedidas" />
      <Button label="Mínimo" class="ml-2" severity="primary" @click="fnAplicarMinimo" />
      <Button label="Cerrar" class="ml-2" severity="contrast" @click="modalMedidas = false" />
    </div>
  </div>
             </div>
          </fieldset>
        </Drawer>
 <!-- ////////////////////////////////////////////////////////////////////////////////////////// -->
  <Dialog v-model:visible="visibleDescuento" modal :position="position" header="Editar Producto" :style="{ width: '40rem' }">
    <template #header>
      <div class="inline-flex align-items-center justify-content-center gap-2">
        <span class="font-bold white-space-nowrap">DESCUENTO</span>
      </div>
    </template>

    <fieldset class="border p-3 rounded mb-2">
      <legend class="float-none w-auto px-2">Descuento?</legend>
      <div class="grid grid-cols-12 gap-4">


    <div class="col-span-12">


    <ButtonGroup>
      <Button 
        v-for="(opcion, index) in opcionesDescuento"
        :key="index"
        :label="'Descuento: ' + descuentoRequerido(opcion)"
        outlined 
        severity="secondary" 
        @click="fnNuevoDescuento(descuentoRequerido(opcion))" 
      />
    </ButtonGroup>

    </div>

        <!-- Descuento en Entero -->
        <div class="col-span-4 form-group">
          <label for="descuento">Entero</label>
          <InputText
            type="text"
            class="form-control"
            v-solonumeros
            v-decimales
            fluid
            v-numeroFocusinOut
            v-model="descuentoEntero"
            @input="calcularDescuentoDesdeEntero"
          />
        </div>
        <!-- Descuento en Porcentaje -->
        <div class="col-span-4 form-group">
          <label for="descuento_porcentaje">Porcentaje %</label>
          <InputText
            type="text"
            class="form-control"
            v-solonumeros
            v-decimales
            fluid
            v-numeroFocusinOut
            v-model="descuentoPorcentaje"
            @input="calcularDescuentoDesdePorcentaje"
          />
        </div>
        <!-- Botón para Aplicar -->
        <div class="col-span-4">
          <label for="btnagregarprecio">Aplicar</label>
<!--           <Button href="#" class="btn btn-dark w-100" @click.prevent="fnAplicarDescuento">Descuento</Button> -->
          <Button label="Descuento" fluid  @click.prevent="fnAplicarDescuento"  />
        </div>
      </div>
    </fieldset>

    <template #footer>
      <Button label="Cerrar" outlined severity="secondary" @click="visibleDescuento = false"  />
    </template>
  </Dialog>
 <!-- ////////////////////////////////////////////////////////////////////////////////////////// -->
   <TecladoVirtual ref="virtualKeyboard" />
 <!-- ////////////////////////////////////////////////////////////////////////////////////////// -->
<Dialog
  v-model:visible="docVisible"
  modal
  header="Listado de Facturas"
  :style="{ width: '60rem' }"
  class="rounded-xl"
>
  <div class="p-4 bg-gray-50 dark:bg-gray-900">

    <!-- FIELDSET ESTILO TAILWIND -->
    <fieldset class="border border-gray-300 dark:border-gray-700 rounded-xl p-4">

      <legend
        class="px-3 py-1 text-sm font-semibold bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg"
      >
        DOCUMENTOS ({{ datosFactCoti.tipo }})
      </legend>

      <!-- BUSCADOR -->
      <div class="mt-3 mb-4">
        <input
          v-model="searchQueryFactura"
          placeholder="Buscar facturas..."
          class="w-full p-inputtext p-component rounded-lg 
                 text-sm border border-gray-300 dark:border-gray-600 
                 bg-white dark:bg-gray-800 
                 focus:ring-2 focus:ring-blue-500 outline-none"
        />
      </div>

      <!-- TABLA -->
      <div class="card bg-white dark:bg-gray-800 rounded-xl shadow-sm">

        <DataTable
          :value="filteredFacturas"
          scrollable
          scrollHeight="600px"
          dataKey="facturaNumero"
          selectionMode="single"
          paginator
          :rows="10"
          size="small"
          resizableColumns
          columnResizeMode="fit"
          :rowClass="getRowClass"
          @rowSelect="onRowSelectFactura"
          :rowsPerPageOptions="[5, 10, 20, 50]"
          tableClass="rounded-xl"
          headerClass="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200"
        >

          <!-- FACTURA -->
          <Column field="no_factura" header="FACTURA #">
            <template #body="slotProps">
              <Badge
                :value="slotProps.data.no_factura"
                :severity="colorEstado(slotProps.data)"
                class="px-2 py-1 rounded-md text-xs"
              />
            </template>
          </Column>

          <!-- Fecha -->
          <Column field="fecha_emision" header="FECHA" />

          <!-- Cliente -->
          <Column field="nombre_cliente" header="CLIENTE" />

          <!-- Método pago -->
          <Column field="metodo_pago" header="METODO" />

          <!-- Hora -->
          <Column field="hora" header="HORA" />

          <!-- ITBIS -->
          <Column field="impuesto" header="ITBIS" />

          <!-- Total -->
          <Column field="total" header="TOTAL">
            <template #body="slotProps">
              <Badge
                :value="'RD$ ' + slotProps.data.total"
                class="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200 rounded-md text-xs"
              />
            </template>
          </Column>

        </DataTable>
      </div>

    </fieldset>

  </div>
</Dialog>

 <!-- ////////////////////////////////////////////////////////////////////////////////////////// -->
 <!-- ////////////////////////////////////////////////////////////////////////////////////////// -->
 <Dialog v-model:visible="visibleComprobantes" position="top" modal :style="{ width: '30rem' }" header="Comprobantes">
  <template #header>
    <div class="inline-flex align-items-center justify-content-center gap-2">
      <span class="font-bold white-space-nowrap">Comprobantes</span>
    </div>
  </template>

  <fieldset class="border p-3 rounded mb-2">
    <legend class="float-none w-auto px-2">Comprobantes</legend>
    <div class="grid grid-cols-12  gap-4">
 



      <div class="col-span-12 sm:col-span-12 md:col-span-12 lg:col-span-12 xl:col-span-12 2xl:col-span-12">
                    <label for="nfc">NFC</label>

              <Select v-model="datoscamposComprobantes.nfc" :options="confiscalData" optionLabel="nombre" placeholder="Seleccione nfc" class="w-full" />
            </div>

    </div>
  </fieldset>

  <template #footer>
      <Button label="Aplicar Comprobante" outlined severity="success" @click="fnAplicarComprobante"  />
      <Button label="Eliminar Comprobante" outlined severity="danger" @click="fnEliminarComprobante"  />
      <Button label="Cerrar" outlined severity="secondary" @click="visibleComprobantes = false" autofocus />
  </template>
</Dialog>
 <!-- ////////////////////////////////////////////////////////////////////////////////////////// -->
  <LoadingOverlay :visible="loading" />

<!--     <InvoicePrint
      v-if="showInvoice"
      :company="company"
      :invoice="invoice"
      :customer="customer"
      @close="showInvoice = false"
    /> -->


  <Dialog v-model:visible="visibleBanco" :position="position" modal header="Productos" :style="{ width: '30rem' }" :breakpoints="{ '1199px': '75vw', '575px': '90vw' }">
    <template #header>
      <div class="inline-flex align-items-center justify-content-center gap-2">
        <span class="font-bold white-space-nowrap">Modal Banco</span>
      </div>
    </template>

    <fieldset class="border p-3 rounded mb-2">
      <legend class="float-none w-auto px-2">Elige tu Banco</legend>

      <div class="flex flex-wrap gap-4 justify-center">
      <select name="banco" v-model="cuentaBancaria" class="form-control">
        <option :value="banco" v-for="banco in bancoArray">{{banco.nombre}}</option>
      </select>
     </div >

      <div class="gap-4 justify-center mt-2">
        <label>No. Transferencia</label>
        <InputText v-model="noTransferencia" fluid />
     </div >


    </fieldset>

    <template #footer>
      <Button label="Cancel" text severity="secondary" @click="visibleBanco = false" />
    </template>
  </Dialog>

<!-- ////////////////////////////////////////////////////////////////////////////////////////// -->
 <Dialog v-model:visible="visibleCheque" :position="position" modal header="Productos" :style="{ width: '30rem' }" :breakpoints="{ '1199px': '75vw', '575px': '90vw' }">
    <template #header>
      <div class="inline-flex align-items-center justify-content-center gap-2">
        <span class="font-bold white-space-nowrap">Modal Cheque</span>
      </div>
    </template>

    <fieldset class="border p-3 rounded mb-2">
      <legend class="float-none w-auto px-2">Datos del Cheque</legend>

      <div class="mt-2">
        <label>No. Cheque</label>
        <InputText v-solonumeros v-model="noCheque" fluid />
     </div >

      <div class="mt-2">
        <label>Banco</label>
        <InputText v-mayuscula v-model="bancoCheque" fluid />
     </div >


    </fieldset>

    <template #footer>
      <Button label="Cerrar" text severity="secondary" @click="visibleCheque = false" />
    </template>
  </Dialog>
<!-- ////////////////////////////////////////////////////////////////////////////////////////// -->

<Dialog v-model:visible="visibleConduce" position="bottom" modal :style="{ width: '75rem' }" header="Conduce">
  <template #header>
    <div class="inline-flex align-items-center justify-content-center gap-2">
      <span class="font-bold white-space-nowrap">Conduce</span>
    </div>
  </template>

  <fieldset class="border p-3 rounded mb-2">
    <legend class="float-none w-auto px-2">Conduce</legend>
    <div class="grid grid-cols-1 gap-4">
<div class="grid grid-cols-12 gap-4 mt-4 text-teal-600" id="campos">

<div class="col-span-12 sm:col-span-12 md:col-span-2 lg:col-span-2 xl:col-span-2 2xl:col-span-2">
                    <label for="no_conduce" class="block text-sm font-medium text-gray-700 dark:text-gray-400">No conduce</label>
                    <InputText type="text" class="form-input w-full "  v-solonumeros readonly v-model="datoscamposConduce.no_conduce" placeholder="no_conduce" name="crearno_conduce" id="no_conduce" />
                </div>
<div class="col-span-12 sm:col-span-12 md:col-span-2 lg:col-span-2 xl:col-span-2 2xl:col-span-2">
                    <label for="no_factura" class="block text-sm font-medium text-gray-700 dark:text-gray-400">No factura</label>
                    <InputText type="text" class="form-input w-full "  v-solonumeros readonly v-model="datoscamposConduce.no_factura" placeholder="no_factura" name="crearno_factura" id="no_factura" />
                </div>
<div class="col-span-12 sm:col-span-12 md:col-span-2 lg:col-span-2 xl:col-span-2 2xl:col-span-2">
                    <label for="cod_cliente" class="block text-sm font-medium text-gray-700 dark:text-gray-400">Cod cliente</label>
                    <InputText type="text" class="form-input w-full "   readonly v-model="datoscamposConduce.cod_cliente" placeholder="cod_cliente" name="crearcod_cliente" id="cod_cliente" />
                </div>
<div class="col-span-12 sm:col-span-12 md:col-span-4 lg:col-span-4 xl:col-span-4 2xl:col-span-4">
                    <label for="cliente" class="block text-sm font-medium text-gray-700 dark:text-gray-400">Cliente</label>
                    <InputText type="text" class="form-input w-full "   readonly v-model="datoscamposConduce.cliente" placeholder="cliente" name="crearcliente" id="cliente" />
                </div>

<div class="col-span-12 sm:col-span-12 md:col-span-12 lg:col-span-12 xl:col-span-12 2xl:col-span-12">
                    <label for="direccion" class="block text-sm font-medium text-gray-700 dark:text-gray-400">Direccion</label>
                   <Textarea id="creardireccion" rows="3" class="form-textarea w-full "  v-model="datoscamposConduce.direccion" placeholder="Direccion"></textarea>
                </div>
<div class="col-span-12 sm:col-span-12 md:col-span-3 lg:col-span-3 xl:col-span-3 2xl:col-span-3">
                    <label for="fecha" class="block text-sm font-medium text-gray-700 dark:text-gray-400">Fecha</label>
                   <InputText type="text" class="form-input w-full " v-model="datoscamposConduce.fecha" placeholder="fecha" readonly name="crearfecha" id="fecha" />
            </div>
<div class="col-span-12 sm:col-span-12 md:col-span-3 lg:col-span-3 xl:col-span-3 2xl:col-span-3">
                    <label for="vencimiento" class="block text-sm font-medium text-gray-700 dark:text-gray-400">Vencimiento</label>
                   <InputText type="text" class="form-input w-full " v-model="datoscamposConduce.vencimiento" placeholder="vencimiento" readonly name="crearvencimiento" id="vencimiento" />
            </div>
<div class="col-span-12 sm:col-span-12 md:col-span-6 lg:col-span-6 xl:col-span-6 2xl:col-span-6">
                    <label for="chofer" class="block text-sm font-medium text-gray-700 dark:text-gray-400">Chofer</label>
                    <InputText type="text" class="form-input w-full "   v-mayuscula v-model="datoscamposConduce.chofer" placeholder="chofer" name="crearchofer" id="chofer" />
                </div>
<div class="col-span-12 sm:col-span-12 md:col-span-4 lg:col-span-4 xl:col-span-4 2xl:col-span-4">
                    <label for="placa" class="block text-sm font-medium text-gray-700 dark:text-gray-400">Placa</label>
                    <InputText type="text" class="form-input w-full "  v-model="datoscamposConduce.placa" placeholder="placa" name="crearplaca" id="placa" />
                </div>
<div class="col-span-12 sm:col-span-12 md:col-span-4 lg:col-span-4 xl:col-span-4 2xl:col-span-4">
                    <label for="entrega" class="block text-sm font-medium text-gray-700 dark:text-gray-400">Entrega</label>

              <Select v-model="datoscamposConduce.entrega" :options="['PARCIAL','TOTAL']" placeholder="Seleccione entrega" class="w-full" />
            </div>
<div class="col-span-12 sm:col-span-12 md:col-span-4 lg:col-span-4 xl:col-span-4 2xl:col-span-4">
                    <label for="total" class="block text-sm font-medium text-gray-700 dark:text-gray-400">Total</label>
                    <InputText type="text" class="form-input w-full "  v-solonumeros v-model="datoscamposConduce.total" readonly placeholder="total" name="creartotal" id="total" />
                </div>

<div class="col-span-12 sm:col-span-12 md:col-span-12 lg:col-span-12 xl:col-span-12 2xl:col-span-12">
                    <label for="productos" class="block text-sm font-medium text-gray-700 dark:text-gray-400">Productos</label>

<div class="table-responsive">
  <div v-html="generarTablaFromStringJSON(datoscamposConduce.productos,true)" class="border p-3 rounded mb-2">
  </div>
</div>

</div>

<div class="form-group col-span-12 mb-5 mt-5">
  <Button label="Enviar Datos" fluid  @click="enviarDatosConduce" autofocus />
</div>

  </div>
    </div>
  </fieldset>

  <template #footer>
      <Button label="Cerrar" outlined severity="secondary" @click="visibleConduce = false" autofocus />
  </template>
</Dialog>


 <!-- ////////////////////////////////////////////////////////////////////////////////////////// -->

 <!-- ////////////////////////////////////////////////////////////////////////////////////////// -->
 <Dialog v-model:visible="visibleApartado" position="top" modal :style="{ width: '50rem' }" header="Apartado">
  <template #header>
    <div class="inline-flex align-items-center justify-content-center gap-2">
      <span class="font-bold white-space-nowrap">Apartado</span>
    </div>
  </template>

  <fieldset class="border p-3 rounded mb-2">
    <legend class="float-none w-auto px-2">Apartado</legend>
    <div class="grid grid-cols-12  gap-4">

      <div class="col-span-12 md:col-span-6">
        <label>TIEMPO</label>
        <Select v-model="apartado.tiempo" :options="['DIARIO','SEMANAL','QUINCENAL','MENSUAL','LOS 15','LOS 30']" placeholder="Seleccione tiempo" class="w-full" />
      </div>

      <div class="col-span-12 md:col-span-2">
        <label>CUOTAS</label>
        <Select v-model="apartado.cuotas" 
        fluid 
        :options="['1','2','3','4','5','6','7','8','9','10']"
         />
      </div>

      <div class="col-span-12 md:col-span-4">
        <label>ABONO</label>
        <InputText v-model="apartado.abono" v-solonumeros v-focus-in-focus-out @keyup="calcularApartado" class="w-full" />
      </div>


      <div class="col-span-12 md:col-span-4">
        <label>PENDIENTE</label>
        <InputText v-model="apartado.saldo" readonly class="w-full" />
      </div>

      <div class="col-span-12 md:col-span-4">
        <label>METODO DE PAGO</label>
        <Select v-model="metodoPagoApartado" 
        @change="fnCambiarMetodoApartado"
        fluid 
        :options="['EFECTIVO','TARJETA','TRANSFERENCIA']"
        placeholder="METODO DE PAGO" 
         />
      </div>

      <div class="col-span-12 md:col-span-4">
        <label>VENCIMIENTO</label>
        <DatePicker v-model="apartado.vencimiento" dateFormat="dd/mm/yy" class="w-full" />
      </div>
  
    </div>
  </fieldset>

  <template #footer>
    <Button icon="pi pi-plus" severity="primary" label="Agregar Datos" @click="visibleApartado = false" />
  </template>
</Dialog>
 <!-- ////////////////////////////////////////////////////////////////////////////////////////// -->

<Dialog v-model:visible="visibleClientes" position="top" modal :style="{ width: '50rem' }" header="Clientes">
  <template #header>
    <div class="inline-flex align-items-center justify-content-center gap-2">
      <span class="font-bold white-space-nowrap">Clientes</span>
    </div>
  </template>

  <fieldset class="border p-3 rounded mb-2">
    <legend class="float-none w-auto px-2">Seleccione Cliente</legend>
    <div class="grid grid-cols-1 md:grid-cols-1 gap-4">
      <div>
         <Select v-model="clienteSelected" filter filterPlaceholder="Escriba aqui el nombre" fluid resetFilterOnHide resetFilterOnClear  checkmark focusOnHover autoFilterFocus :options="allClientes" optionLabel="nombre" placeholder="Select a Client" class="w-full " ref="clientSelect" />
      </div>
    </div>
  </fieldset>

  <template #footer>
      <Button label="Cliente por Default" outlined severity="secondary" @click="seleccionarClienteDefaultBuscador" />
      <Button label="Aplicar" outlined severity="secondary" @click="fnCambiarClienteFactura"  />
      <Button label="Cerrar" outlined severity="secondary" @click="visibleClientes = false"  />
  </template>
</Dialog>


 <!-- ////////////////////////////////////////////////////////////////////////////////////////// -->
  <!-- ////////////////////////////////////////////////////////////////////////////////////////// -->
 <!-- ////////////////////////////////////////////////////////////////////////////////////////// -->
 <!-- ////////////////////////////////////////////////////////////////////////////////////////// -->

<Dialog v-model:visible="visiblePrint" :position="position" modal header="Productos" :style="{ width: '30rem' }" :breakpoints="{ '1199px': '75vw', '575px': '90vw' }">
  <template #header>
    <div class="inline-flex align-items-center justify-content-center gap-2">
      <span class="font-bold white-space-nowrap">Modal Editar</span>
    </div>
  </template>

    <fieldset class="border p-3 rounded mb-2">
      <legend class="float-none w-auto px-2">Elige la Impresora</legend>
      <div class="flex flex-wrap gap-4 justify-center">
         <Button label="Impresora Grande" icon="pi pi-print" @click="fnImpresoraGrande" iconPos="bottom" />
         <Button label="Impresora Térmica" id="botonImprimir" icon="pi pi-print" @click="fnImpresoraChica" iconPos="bottom" />
     </div >
    </fieldset>

    <template #footer>
      <Button label="Cancel" text severity="secondary" @click="visiblePrint = false" />
    </template>
  </Dialog>

  <FacturaPdfPrint ref="facturaPdfPrintRef" />
  <TicketFacturaPrint ref="ticketFacturaPrintRef" />
  <TicketFacturaPdf ref="ticketFacturaPdfRef" />
  <TicketCotizacionPrint ref="ticketCotizacionPrintRef" />
  <CotizacionPdfPrint ref="cotizacionPdfPrintRef" />

  <!-- DIALOG: ASISTENTE IA CELULARES -->
  <Dialog
    v-model:visible="visibleAsistenteIA"
    modal
    header="Asistente IA - Celulares"
    :style="{ width: '60rem' }"
    :breakpoints="{ '1199px': '85vw', '575px': '95vw' }"
    position="top"
  >
    <TabView v-model:activeIndex="iaActiveTab">
      <!-- TAB 1: CHAT CON IA -->
      <TabPanel>
        <template #header>
          <div class="flex items-center gap-2">
            <i class="pi pi-comment"></i>
            <span>Chat IA</span>
          </div>
        </template>

        <div class="flex flex-col" style="height: 400px;">
          <!-- Área de mensajes -->
          <div class="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 dark:bg-slate-800 rounded-lg mb-4" ref="chatContainerRef">
            <!-- Mensaje de bienvenida -->
            <div v-if="mensajesIA.length === 0" class="text-center text-slate-500 dark:text-slate-400 py-8">
              <i class="pi pi-mobile text-4xl mb-4"></i>
              <p class="font-semibold">Asistente de Celulares IA</p>
              <p class="text-sm mt-2">Pregúntame sobre especificaciones, comparaciones, recomendaciones y características de teléfonos celulares.</p>
              <div class="mt-4 flex flex-wrap gap-2 justify-center">
                <Button size="small" severity="secondary" outlined label="¿iPhone o Samsung?" @click="preguntaRapidaIA('¿Cuáles son las principales diferencias entre iPhone y Samsung? ¿Cuál me recomiendas?')" />
                <Button size="small" severity="secondary" outlined label="Mejor cámara 2024" @click="preguntaRapidaIA('¿Cuáles son los celulares con mejor cámara en 2024?')" />
                <Button size="small" severity="secondary" outlined label="Celular para gaming" @click="preguntaRapidaIA('¿Qué celulares son mejores para jugar videojuegos?')" />
                <Button size="small" severity="secondary" outlined label="Batería duradera" @click="preguntaRapidaIA('¿Cuáles celulares tienen la mejor duración de batería?')" />
              </div>
            </div>

            <!-- Mensajes del chat -->
            <div v-for="(msg, index) in mensajesIA" :key="index" :class="msg.rol === 'user' ? 'flex justify-end' : 'flex justify-start'">
              <div :class="msg.rol === 'user'
                ? 'bg-teal-600 text-white rounded-lg rounded-br-none px-4 py-2 max-w-[80%]'
                : 'bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-lg rounded-bl-none px-4 py-2 max-w-[80%] shadow'">
                <p class="text-sm whitespace-pre-wrap">{{ msg.contenido }}</p>
              </div>
            </div>

            <!-- Indicador de carga -->
            <div v-if="cargandoIA" class="flex justify-start">
              <div class="bg-white dark:bg-slate-700 rounded-lg px-4 py-2 shadow">
                <i class="pi pi-spin pi-spinner text-teal-600"></i>
                <span class="ml-2 text-slate-600 dark:text-slate-300 text-sm">Consultando...</span>
              </div>
            </div>
          </div>

          <!-- Input de mensaje -->
          <div class="flex gap-2">
            <InputText
              v-model="mensajeUsuarioIA"
              :placeholder="'Escribe tu pregunta sobre celulares...'"
              class="flex-1"
              @keydown.enter="enviarMensajeIA"
              :disabled="cargandoIA"
            />
            <Button
              icon="pi pi-send"
              @click="enviarMensajeIA"
              :disabled="!mensajeUsuarioIA.trim() || cargandoIA"
              severity="success"
            />
            <Button
              icon="pi pi-trash"
              @click="limpiarChatIA"
              severity="danger"
              outlined
              v-tooltip.top="'Limpiar conversación'"
            />
          </div>
        </div>
      </TabPanel>

      <!-- TAB 2: COMPARAR MODELOS -->
      <TabPanel>
        <template #header>
          <div class="flex items-center gap-2">
            <i class="pi pi-mobile"></i>
            <span>Comparar Modelos</span>
          </div>
        </template>

        <div class="space-y-4">
          <!-- Selector de celular -->
          <div class="bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-slate-800 dark:to-slate-700 p-4 rounded-lg">
            <label class="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
              <i class="pi pi-search mr-2"></i>Selecciona un celular para buscar alternativas similares:
            </label>
            <AutoComplete
              v-model="medicamentoParaEquivalentes"
              :suggestions="sugerenciasMedicamentos"
              @complete="buscarSugerenciasMedicamentos"
              @item-select="seleccionarMedicamentoEquivalente"
              optionLabel="nombre_comercial"
              placeholder="Escribe el nombre del celular..."
              class="w-full"
              :dropdown="true"
            >
              <template #option="slotProps">
                <div class="flex justify-between items-center w-full">
                  <div>
                    <span class="font-semibold">{{ slotProps.option.nombre }}</span>
                    <span class="text-xs text-slate-500 ml-2">({{ slotProps.option.marca }})</span>
                  </div>
                  <span class="text-xs text-teal-600">${{ slotProps.option.precio_venta }}</span>
                </div>
              </template>
            </AutoComplete>
          </div>

          <!-- Información del celular seleccionado -->
          <div v-if="medicamentoSeleccionadoIA" class="bg-white dark:bg-slate-800 p-4 rounded-lg border-2 border-teal-200 dark:border-teal-700">
            <div class="flex items-start justify-between">
              <div>
                <h4 class="font-bold text-lg text-slate-800 dark:text-slate-200">{{ medicamentoSeleccionadoIA.nombre }}</h4>
                <p class="text-sm text-slate-600 dark:text-slate-400">
                  <span class="font-semibold">Marca:</span> {{ medicamentoSeleccionadoIA.marca || 'No especificado' }}
                </p>
                <p class="text-sm text-slate-600 dark:text-slate-400">
                  <span class="font-semibold">Categoría:</span> {{ medicamentoSeleccionadoIA.categoria || 'No especificado' }}
                </p>
                <p class="text-sm text-slate-600 dark:text-slate-400">
                  <span class="font-semibold">Proveedor:</span> {{ medicamentoSeleccionadoIA.proveedor || 'No especificado' }}
                </p>
              </div>
              <div class="text-right">
                <p class="text-2xl font-bold text-teal-600">${{ medicamentoSeleccionadoIA.precio_venta }}</p>
                <p :class="medicamentoSeleccionadoIA.stock > 0 ? 'text-green-600' : 'text-red-600'" class="text-sm font-semibold">
                  Stock: {{ medicamentoSeleccionadoIA.stock || 0 }}
                </p>
              </div>
            </div>
            <div class="mt-3 flex gap-2">
              <Button
                label="Buscar Similares en Stock"
                icon="pi pi-search"
                @click="buscarEquivalentesEnStock"
                severity="info"
                size="small"
              />
              <Button
                label="Comparar con IA"
                icon="pi pi-sparkles"
                @click="consultarEquivalentesConIA"
                severity="help"
                size="small"
                :loading="cargandoEquivalentesIA"
              />
            </div>
          </div>

          <!-- Alternativas en Stock -->
          <div v-if="equivalentesEnStock.length > 0" class="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-700">
            <h4 class="font-bold text-green-800 dark:text-green-300 mb-3 flex items-center gap-2">
              <i class="pi pi-check-circle"></i>
              Alternativas disponibles en tu inventario ({{ equivalentesEnStock.length }}):
            </h4>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-48 overflow-y-auto">
              <div
                v-for="med in equivalentesEnStock"
                :key="med.codigo"
                class="flex justify-between items-center p-3 bg-white dark:bg-slate-800 rounded-lg border border-green-200 dark:border-green-700 hover:bg-green-50 dark:hover:bg-green-900/30 cursor-pointer transition-all"
                @click="agregarProductoDesdeIA(med)"
              >
                <div>
                  <p class="font-semibold text-sm text-slate-800 dark:text-slate-200">{{ med.nombre }}</p>
                  <p class="text-xs text-slate-500 dark:text-slate-400">{{ med.marca }} - {{ med.categoria }}</p>
                </div>
                <div class="text-right">
                  <p class="font-bold text-teal-600">${{ med.precio_venta }}</p>
                  <p class="text-xs text-green-600 font-semibold">Stock: {{ med.stock }}</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Sin alternativas en stock -->
          <div v-if="medicamentoSeleccionadoIA && equivalentesEnStock.length === 0 && busquedaEquivalentesRealizada" class="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg border border-yellow-200 dark:border-yellow-700">
            <p class="text-yellow-800 dark:text-yellow-300 flex items-center gap-2">
              <i class="pi pi-exclamation-triangle"></i>
              No se encontraron alternativas similares en tu inventario.
            </p>
          </div>

          <!-- Respuesta de IA sobre alternativas -->
          <div v-if="respuestaEquivalentesIA" class="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg border border-purple-200 dark:border-purple-700">
            <h4 class="font-bold text-purple-800 dark:text-purple-300 mb-3 flex items-center gap-2">
              <i class="pi pi-sparkles"></i>
              Comparación y alternativas sugeridas por IA:
            </h4>
            <p class="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{{ respuestaEquivalentesIA }}</p>
          </div>
        </div>
      </TabPanel>

    </TabView>
  </Dialog>
<!-- ////////////////////////////////////////////////////////////////////////////////////////// -->
</template>

<script setup>
import { ref, onMounted, watch,computed,onUnmounted,nextTick,watchEffect } from 'vue';
import { useI18n } from 'vue-i18n';
import axios from 'axios';
import { parseStringPromise } from 'xml2js';
import { useToast } from 'primevue/usetoast';
import Swal from 'sweetalert2'
import { useRouter,useRoute } from 'vue-router';

const { t } = useI18n();

import SelectButton from 'primevue/selectbutton';
//import InvoicePrint from '../components/Factura.vue'
import TecladoVirtual from '../components/TecladoVirtual.vue'
import FacturaPdfPrint from '../components/FacturaPdfPrint.vue'
import TicketFacturaPrint from '../components/TicketFacturaPrint.vue'
import TicketFacturaPdf from '../components/TicketFacturaPdf.vue'
import TicketCotizacionPrint from '../components/TicketCotizacionPrint.vue'
import CotizacionPdfPrint from '../components/CotizacionPdfPrint.vue'

import AwesompleteFull from 'awesomplete';
import 'awesomplete/awesomplete.css';

import Keyboard from "simple-keyboard";
import "simple-keyboard/build/css/index.css";


import AutoCompletar from '@/components/AutoCompletar.vue'

import { useLoading } from 'vue-loading-overlay';
const $loading = useLoading();
let loader = null;

const router = useRouter();

//router.push('/ferreteria')

import { peticiones,generadorCodigo,generarCodigoUnico,formatoMonedaRD, arrayToObjetoFromTabla,mensajetoast,actualizarLocalStorage,nfecha,peticionesFetch,encryptarPassword,enviarDatosPorPost,verificaAutentificado,enviarSolicitudGet, agregarDiasalaFechaActual,formatearFecha,crearGasto,crearTablaSiNoExiste,crearTransferencia,extraerCamposDeObjeto,asientoDiario,enviarDatosLocalStorage,envioElectron,generarTablaFromStringJSON,agregarDiasAFecha,permisosPagina,crearNotaCredito,peticionesFetchOffline,generarCodigoUnico4Digitos,arrayToObjetoFromTablaOffline } from '@/funciones/funciones.js';
import { facturaNueva,cotizacionNueva,facturaActualizar,restarStock,actualizarImeisVendidos,actualizarStockPorImei } from '@/funciones/funcionesVentas.js';
//import bcrypt from 'bcryptjs';
//import config from '../../../../resources/config.json';
import LoadingOverlay from '../Loading/LoadingOverlay.vue';
const toast = useToast();
/****************************************************/
/****************************************************/
/****************************************************/
const isDesktop = ref(true);
const updateIsDesktop = () => {
  isDesktop.value = window.innerWidth >= 1280;
};
/*import Awesomplete from 'awesomplete'
import 'awesomplete/awesomplete.css';*/
import Awesomplete from '@/components/Awesomplete.vue';
import OptionButtonTM from '@/components/OptionButtomTM.vue';
import WhatsappModal from '@/components/WhatsappModal.vue';
/****************************************************/
import {useDatosEmpresa} from '@/stores'
const datosEmpresa = useDatosEmpresa();
/****************************************************/
const intitucionesData = ref([])
const intitucionesDataNames = ref([])
/****************************************************/
const searchCliente = (event) => {
  const query = event.query?.toLowerCase() ?? '';
  allClientes.value = itemsclientes.value.filter(cliente =>
    cliente.nombre?.toLowerCase().includes(query)
  );

};

/****************************************************/
const precioFijado = ref('Normal')
/****************************************************/
const facturaEsCredito = ref(false)
const allCotizacionesFull = ref([])
/****************************************************/
const getRowClass = (data) => {
  if (data.metodo_pago === 'EFECTIVO') {
    return 'efectivo';
  } else if (data.metodo_pago === 'TARJETA') {
    return 'tarjeta';
  } else if (data.metodo_pago === 'TRANSFERENCIA') {
    return 'transferencia';
  }else{
    return 'efectivo';
  }
  return '';
};
/****************************************************/

/****************************************************/
const colorEstado = (data) => {
  switch (data.metodo_pago?.toUpperCase()) {
    case 'EFECTIVO':
      return 'success';   // Verde → success
    case 'TARJETA':
      return 'info';      // Azul → info
    case 'TRANSFERENCIA':
      return 'warn';      // Amarillo/Naranja → warn
    default:
      return 'contrast'; // Gris neutro
  }
};

/****************************************************/
const fnCambiarClientes = async(cliente)=>{
  if(cliente){
      // Ignorar productos especiales como DESCUENTO APLICADO
      const productosActualizables = productosVenta.value.filter(p =>
        p.nombre !== 'DESCUENTO APLICADO' && p.nombre !== 'DESCUENTO' && p.categoria !== 'DESCUENTO APLICADO'
      );

      if(cliente.value.precio_fijado === 'Normal'){
        productosActualizables.forEach(producto => {
          const datosProd = productosArraySinModificaciones.value.find(prod => prod.codigo === producto.codigo);
          if (datosProd && datosProd.precio_venta) {
            producto.precio_venta = datosProd.precio_venta;
            producto.precio_final = datosProd.precio_final || datosProd.precio_venta;
          }
        });
            toast.add({ severity: 'warn', summary: 'Precio Cambiado', detail: 'Precio Normal Seleccionado', life: 3000 });
        precioFijado.value = 'Normal'
      }else if(cliente.value.precio_fijado === 'Minimo'){
        productosActualizables.forEach(producto => {
          const datosProd = productosArraySinModificaciones.value.find(prod => prod.codigo === producto.codigo);
          if (datosProd && datosProd.precio_min) {
            producto.precio_venta = datosProd.precio_min;
            producto.precio_final = datosProd.precio_min;
          }
        });
            toast.add({ severity: 'warn', summary: 'Precio Cambiado', detail: 'Precio Mínimo Seleccionado', life: 3000 });
        precioFijado.value = 'Minimo'
      }else if(cliente.value.precio_fijado === 'PorMayor'){

        productosActualizables.forEach(producto => {
          const datosProd = productosArraySinModificaciones.value.find(prod => prod.codigo === producto.codigo);
          if (datosProd && datosProd.precio_xmayor) {
            producto.precio_venta = datosProd.precio_xmayor;
            producto.precio_final = datosProd.precio_xmayor;
          }
        });
            toast.add({ severity: 'warn', summary: 'Precio Cambiado', detail: 'Precio Al Por Mayor Seleccionado', life: 3000 });

       precioFijado.value = 'Al Por Mayor'

      }else{
        productosActualizables.forEach(producto => {
          const datosProd = productosArraySinModificaciones.value.find(prod => prod.codigo === producto.codigo);
          if (datosProd && datosProd.precio_venta) {
            producto.precio_venta = datosProd.precio_venta;
            producto.precio_final = datosProd.precio_final || datosProd.precio_venta;
          }
        });
            toast.add({ severity: 'warn', summary: 'Precio Cambiado', detail: 'Precio Normal Seleccionado', life: 3000 });
        precioFijado.value = 'Normal'
      }

    calcularTotalFactura();
     fncambioTipoImpuesto()
    window.localStorage.setItem('clienteLocalStorage', JSON.stringify(cliente.value));
  }

}
/****************************************************/
const fnBlurClientes = (cliente)=>{
  if(!clienteSelected.value || clienteSelected.value ===''){
    clienteSelected.value = allClientes.value.find(client=>client.codigo === '0000000')
  }
}
/****************************************************/
const fnFocusClientes = ()=>{
  if(!clienteSelected.value || clienteSelected.value.codigo === '0000000'){
     clienteSelected.value = null;
  }

}
/****************************************************/
const limpiarCliente = () => {
  clienteSelected.value = null;
};
/****************************************************/
const loading = ref(false)
const cargandoProductos = ref(false)
const visibleClientes = ref(false)
const menuModel = ref('')
/****************************************************/
const barraMenu = ref({})
/****************************************************/
const toastLeft = ref(null)
/****************************************************/
/****************************************************/
const showKeyboard = ref(false)
const cantidadProductosLocal = ref(0)
/****************************************************/
const visibleApartado = ref(false)
const metodoPagoOptionsNombres = ref([])
const metodoPagoOptionsNombresApartado = ref([])
const metodoPagoApartado = ref('EFECTIVO')
const apartado = ref({tiempo:'MENSUAL',abono:'0.00',vencimiento:agregarDiasalaFechaActual(90),cuotas:'1'})
/****************************************************/
const isDarkMode = ref(false)
/****************************************************/
const switchbuscarRNC = ref('RNC')
/****************************************************/
const showInvoice = ref(false)
const visibleBanco = ref(false)
/****************************************************/
const noCheque = ref('')
const bancoCheque = ref('')
const visibleCheque = ref(false)
/****************************************************/
const productoOtro = ref({})
/****************************************************/
const productosArraySinModificaciones = ref([]); 
/****************************************************/
const datosFactCoti = ref({'numero':'','tipo':'Factura','nombre':'','impresora':'Termica','buscadorPor':'TODAS'});
/****************************************************/
const rutaTipo = computed(() => {
  const tipo = datosFactCoti.value.tipo?.toLowerCase() || ''
  const rutaMap = {
    'factura': '/facturas',
    'cotizacion': '/cotizacion',
    'pre-factura': '/pre_facturas',
    'orden': '/ordenes'
  }
  return rutaMap[tipo] || '/facturas'
})
/****************************************************/
const production = true;
const link = ref(null);
const api = ref(null);
const token = ref(null);
const tokenCorto = ref(null);
const linkImpresora = ref(null);
const tokenSoloUso = ref('');
const token24H = ref('');
/****************************************************/
const elegirPrecio = ref('Normal')
/****************************************************/
const cuentaBancaria = ref(null);
const noTransferencia = ref('');
const bancoArray = ref([]);
const confiscalData = ref([]);
const datoscamposComprobantes = ref({});
/****************************************************/
const sonidoON = ref(false)
/****************************************************/
const currentFacturaData = ref({})
/****************************************************/
const medidaA = ref('0.00')
const medidaB = ref('0.00')
const cantidadMedida = ref('0.00')
const resultadoMedida = ref('0.00')
const colorMedida = ref('BLANCO')
const descripcionMedida = ref('CORR.P-65')
const vidrioMedida = ref('BRONCE LISO')
const medidaVidrioMedida = ref('3/16')
const preciovidrioMedida = ref('0.00')
const preciovidrioMedidaTotal = ref('0.00')
const cantidadFinalMedida = ref('0.00')
const medidaACM = ref('0.00')
const medidaBCM = ref('0.00')
const datosFabrica = ref([])
const datosMedidaArray = ref([])
const medidaMarco = ref('0')
const selectedmedidaMarco = ref('FULL')
const fabricacionData = ref([])
/****************************************************/
//const clienteSelected = ref({})
const garantiaN = ref('3 Months')
/****************************************************/
const cotizacionConvertida = ref(null)
/****************************************************/
const tipoImpuestoFactura = ref('NO')
/****************************************************/
const fncambioTipoImpuesto = ()=>{

  if(tipoImpuestoFactura.value === 'INCLUIDO'){
    incluirImpuesto.value = true
    agregarImpuesto.value = false
    comprobante.value = 'FINAL' // Consumidor Final
    fnCambiarComprobante()

    productosVenta.value.forEach(producto => {
      if(producto.nombre != 'DESCUENTO APLICADO'){
        fmImpuestoIncluido(producto.codigo, producto.id_unico_imei)
      }
    });

    // Recalcular totales después de aplicar impuestos a todos los productos
    localStorage.setItem('productosVenta', JSON.stringify(productosVenta.value));
    calcularTotalFactura();
  }else if(tipoImpuestoFactura.value === 'AGREGADO'){
    incluirImpuesto.value = false
    agregarImpuesto.value = true
    comprobante.value = 'FINAL' // Consumidor Final
    fnCambiarComprobante()
    // Llamar una sola vez ya que fnagregarImpuesto procesa todos los productos internamente
    fnagregarImpuesto()
  }else{
    incluirImpuesto.value = false
    agregarImpuesto.value = false
    comprobante.value = 'NORMAL'
    fnCambiarComprobante()

  productosVenta.value.forEach(producto => {
    if (producto.nombre != 'DESCUENTO' && producto.nombre != 'DESCUENTO APLICADO') {
      // Restaurar precio original
      const precioOriginal = Number(producto.precio_venta_original || producto.precio_venta);

      // Guardar precio original si no existe
      if (!producto.precio_venta_original) {
        producto.precio_venta_original = precioOriginal;
      }

      // Guardar impuesto original si no existe (no borrar el porcentaje)
      if (producto.impuestos_original === undefined) {
        producto.impuestos_original = Number(producto.impuestos || 0);
      }

      producto.precio_venta = precioOriginal;
      producto.precio_final = precioOriginal;
      // No borrar producto.impuestos, mantener el porcentaje original para futuras aplicaciones
      producto.impuesto = 0;
      producto.impuesto_venta = 0;
      producto.total = precioOriginal * parseFloat(producto.cantidad);
      producto.tipo_impuesto = 'Sin Imp.';
    }
  });

  localStorage.setItem('productosVenta', JSON.stringify(productosVenta.value));
  calcularTotalFactura();

  }
}
/****************************************************/
function cmToInches(cm) {
  const inches = cm / 2.54;
  return inches.toFixed(2); 
}

function inchesToCm(inches) {
  const cm = inches * 2.54;
  return cm.toFixed(2); 
}

// Actualiza el valor en centímetros al cambiar el valor en pulgadas
function updateCmFromInches(medida) {
  if (medida === 'A') {
    medidaACM.value = inchesToCm(Number(medidaA.value) || 0);
  } else if (medida === 'B') {
    medidaBCM.value = inchesToCm(Number(medidaB.value) || 0);
  }
    calculoMedida();
}

// Actualiza el valor en pulgadas al cambiar el valor en centímetros
function updateInchesFromCm(medida) {
  if (medida === 'A') {
    medidaA.value = cmToInches(Number(medidaACM.value) || 0);
  } else if (medida === 'B') {
    medidaB.value = cmToInches(Number(medidaBCM.value) || 0);
  }
  calculoMedida();
}

/****************************************************/
const worker = ref('')
const worker2 = ref('')
function consultarConWorker(mensaje) {
  return new Promise((resolve, reject) => {
    const workerInstance = worker.value;

    const listener = (e) => {
      const { tipo, respuesta, mensaje: mensajeError } = e.data;

      if (tipo === 'resultado') {
        workerInstance.removeEventListener('message', listener);
        resolve(respuesta);
      } else if (tipo === 'error') {
        workerInstance.removeEventListener('message', listener);
        reject(new Error(mensajeError));
      }
    };

    workerInstance.addEventListener('message', listener);
    workerInstance.postMessage(mensaje);
  });
}

/****************************************************/
const selectedFractionA = ref('0');
const selectedFractionB = ref('0');


function updateMedida(medida) {
  const fractions = {
    "0": 0,
    "1/16": 1 / 16,
    "1/8": 1 / 8,
    "3/16": 3 / 16,
    "1/4": 1 / 4,
    "5/16": 5 / 16,
    "3/8": 3 / 8,
    "7/16": 7 / 16,
    "1/2": 1 / 2,
    "9/16": 9 / 16,
    "5/8": 5 / 8,
    "11/16": 11 / 16,
    "3/4": 3 / 4,
    "13/16": 13 / 16,
    "7/8": 7 / 8,
    "15/16": 15 / 16,
  };

  if (medida === 'A') {
    const entero = Number(medidaA.value) || 0;
    medidaA.value = (entero + fractions[selectedFractionA.value]).toFixed(2);
    updateCmFromInches('A');
  } else if (medida === 'B') {
    const entero = Number(medidaB.value) || 0;
    medidaB.value = (entero + fractions[selectedFractionB.value]).toFixed(2);
    updateCmFromInches('B');
  }
  calculoMedida();
}
//  calculoMedida();
/****************************************************/
const calculoMedida = ()=>{
    const datosFab = datosFabrica.value.find(fab=>fab.descripcion === descripcionMedida.value)
    //const precios = JSON.parse(datosFab.precios)

  const calculo = (Number(medidaA.value) * Number(medidaB.value))
  cantidadMedida.value = calculo.toFixed(2)
  resultadoMedida.value = (calculo / 144).toFixed(2)
  cantidadFinalMedida.value = ((resultadoMedida.value * Number(datosFab[colorMedida.value.toLowerCase()])) + Number(preciovidrioMedidaTotal.value)).toFixed(2)

 const marcos = fabricacionData.value.find(marco=>marco.nombre === datosFab.descripcion)

  if(marcos){
    const precioFull = Number(marcos.precio_full)
    const precioSinMarco = Number(marcos.precio_sin_marco)
    if(selectedmedidaMarco.value === 'FULL'){
        medidaMarco.value = precioFull.toFixed(2)
    }else{
        medidaMarco.value = precioSinMarco.toFixed(2)
    }
    //medidaMarco
     const calculoMarco = (Number(resultadoMedida.value) * Number(medidaMarco.value))
     const resultadoFinal = (Number(cantidadFinalMedida.value) + Number(calculoMarco))
     cantidadFinalMedida.value = resultadoFinal.toFixed(2)

  }else{
    medidaMarco.value = '0.00'
  }


if (Number(medidaA.value) != 0 && Number(medidaB.value) !=0) {

if (Number(resultadoMedida.value)< Number(datosFab.minimo)) {
  toast.add({ severity: 'warn', summary: 'Éxito', detail: 'No llega al Minimo', life: 3000 });
}
}

}
/****************************************************/
const fnCambioFullMarco = ()=>{
  const datosFab = datosFabrica.value.find(fab=>fab.descripcion === descripcionMedida.value)
  const marcos = fabricacionData.value.find(marco=>marco.nombre === datosFab.descripcion)

  const calculo = (Number(medidaA.value) * Number(medidaB.value))
  cantidadMedida.value = calculo.toFixed(2)
  resultadoMedida.value = (calculo / 144).toFixed(2)
  cantidadFinalMedida.value = ((resultadoMedida.value * Number(datosFab[colorMedida.value.toLowerCase()])) + Number(preciovidrioMedidaTotal.value)).toFixed(2)

   if(marcos){
    const precioFull = Number(marcos.precio_full)
    const precioSinMarco = Number(marcos.precio_sin_marco)

    if(selectedmedidaMarco.value === 'FULL'){
        medidaMarco.value = precioFull.toFixed(2)
    }else{
        medidaMarco.value = precioSinMarco.toFixed(2)
    }
     const calculoMarco = (Number(resultadoMedida.value) * Number(medidaMarco.value))
     const resultadoFinal = (Number(cantidadFinalMedida.value) + Number(calculoMarco))
     cantidadFinalMedida.value = resultadoFinal.toFixed(2)

  }else{
    medidaMarco.value = '0.00'
  }


}
/****************************************************/
const fnCambioFullMarcoKeyDown = ()=>{
    const datosFab = datosFabrica.value.find(fab=>fab.descripcion === descripcionMedida.value)
  //const marcos = fabricacionData.value.find(marco=>marco.nombre === datosFab.descripcion)

  const calculo = (Number(medidaA.value) * Number(medidaB.value))
  cantidadMedida.value = calculo.toFixed(2)
  //resultadoMedida.value = (calculo / 144).toFixed(2)
  cantidadFinalMedida.value = ((resultadoMedida.value * Number(datosFab[colorMedida.value.toLowerCase()])) + Number(preciovidrioMedidaTotal.value)).toFixed(2)

     const calculoMarco = (Number(resultadoMedida.value) * Number(medidaMarco.value))
     const resultadoFinal = (Number(cantidadFinalMedida.value) + Number(calculoMarco))
     cantidadFinalMedida.value = resultadoFinal.toFixed(2)
//resultadoMedida

}
/****************************************************/
const visiblePrint = ref(false)
const facturaPdfPrintRef = ref(null)
const ticketFacturaPrintRef = ref(null)
const ticketFacturaPdfRef = ref(null)
const ticketCotizacionPrintRef = ref(null)
const cotizacionPdfPrintRef = ref(null)
/****************************************************/
const fncalcularMedidas = ()=>{
  const datosFab = datosFabrica.value.find(fab=>fab.descripcion === descripcionMedida.value)


}
/****************************************************/
const visibleConduce = ref(false)
const datoscamposConduce = ref({})
/****************************************************/
const fnCalcularVidrio = (event)=>{
  const selectedIndex = event.target.selectedIndex;
  const datosVidrio = datosMedidaArray.value[selectedIndex];
  //const datosVidrio = datosMedidaArray.value.find(vidrio=>vidrio.nombre == vidrioMedida.value)
  medidaVidrioMedida.value = datosVidrio.medida
  preciovidrioMedida.value = datosVidrio.precio
  const calculo = (Number(resultadoMedida.value) * Number(preciovidrioMedida.value))
  preciovidrioMedidaTotal.value = calculo
  calculoMedida()

}

/****************************************************/
const fnCalculoPie = ()=>{
    const datosFab = datosFabrica.value.find(fab=>fab.descripcion === descripcionMedida.value)

  cantidadFinalMedida.value = ((resultadoMedida.value * Number(datosFab[colorMedida.value.toLowerCase()])) + Number(preciovidrioMedidaTotal.value)).toFixed(2)
 // calculoMedida()
}
/****************************************************/
const fnGenerarPorMedidas = async()=>{
    const descuentoAplicado = descuentoEntero.value ? Number(descuentoEntero.value) : 0;
  const nuevoTotal = total.value - descuentoAplicado;
   const campos = await arrayToObjetoFromTabla(link.value+api.value,tokenCifrado.value,'productos',true);
  let nombreProd;

    nombreProd = `${descripcionMedida.value}/(${medidaA.value} X ${medidaB.value})(${resultadoMedida.value} PIE2)/${colorMedida.value}/${vidrioMedida.value}/${medidaVidrioMedida.value}` 

 if(Number(medidaMarco.value) > 0){
     nombreProd = `${descripcionMedida.value}/(${medidaA.value} X ${medidaB.value})(${resultadoMedida.value} PIE2)/${colorMedida.value}/${vidrioMedida.value}/${medidaVidrioMedida.value}/MARCO 3 VIAS + SCREEN ${selectedmedidaMarco.value} ` 
 }


   campos.nombre = nombreProd
   campos.categoria = 'PRODUCTO FABRICADO'
   campos.codigo = generarCodigoUnico();
   campos.codigo_barra = generarCodigoUnico();
   campos.precio_venta = cantidadFinalMedida.value;
   campos.precio_final = cantidadFinalMedida.value;
   campos.precio_min = cantidadFinalMedida.value;
   campos.precio_xmayor = cantidadFinalMedida.value;
   campos.impuestos = '0.00';
   campos.impuesto = '0.00';
   campos.impuesto_venta = '0.00';
   campos.precio_compra = '0.00';
        datosProductoBuscado.value = campos;
        fnagregarProductoBuscado();


  visibleDescuento.value = false;
  modalMedidas.value = false

medidaA.value = '0.00'
medidaB.value = '0.00'
cantidadMedida.value = '0.00'
resultadoMedida.value = '0.00'
colorMedida.value = 'BLANCO'
descripcionMedida.value = 'CORR.P-65'
vidrioMedida.value = 'BRONCE LISO'
medidaVidrioMedida.value = '3/16'
preciovidrioMedida.value = '0.00'
preciovidrioMedidaTotal.value = '0.00'
cantidadFinalMedida.value = '0.00'
medidaACM.value = '0.00'
medidaBCM.value = '0.00'


}
/****************************************************/
const calculoMedidaMinimo = ()=>{
    const datosFab = datosFabrica.value.find(fab=>fab.descripcion === descripcionMedida.value)
     const calculoMarco = (Number(resultadoMedida.value) * Number(medidaMarco.value))

  cantidadFinalMedida.value = ((resultadoMedida.value * Number(datosFab[colorMedida.value.toLowerCase()])) + Number(preciovidrioMedidaTotal.value) + calculoMarco).toFixed(2)

}
/****************************************************/
const fnAplicarMinimo = ()=>{
    const datosFab = datosFabrica.value.find(fab=>fab.descripcion === descripcionMedida.value)
   resultadoMedida.value = datosFab.minimo
   calculoMedidaMinimo()
 toast.removeAllGroups();
toast.add({ severity: 'success', summary: 'Éxito', detail: 'minimo Aplicado', life: 3000 });
}
/****************************************************/
const tokenCifrado = ref(null);
const searchQuery = ref('')
/****************************************************/
/****************************************************/

const positionMenu = ref('bottom');
const positions = ref([
    {
        label: 'Bottom',
        value: 'bottom'
    },
    {
        label: 'Top',
        value: 'top'
    },
    {
        label: 'Left',
        value: 'left'
    },
    {
        label: 'Right',
        value: 'right'
    }
]);

/****************************************************/
const selectedProduct = ref(null);
const cm = ref(null);
  const columns = [
    { field: 'codigo', header: 'Código' },
    { field: 'nombre', header: 'Nombre' },
    { field: 'stock', header: 'Stock' },
    { field: 'precio_venta', header: 'Precio' },
  ];

/****************************************************/
const onRowSelect = (event) => {
  visibleBuscarProducto.value = false
    Swal.fire({
        title: 'Producto Seleccionado',
        text: 'Nombre: ' + event.data.nombre,
        icon: 'info',
        showCancelButton: true,
        confirmButtonText: 'Agregar Producto',
        cancelButtonText: 'Cancelar'
    }).then((result) => {
        if (result.isConfirmed) {
           datosProductoBuscado.value = event.data
           fnagregarProductoBuscado()
        } else if (result.dismiss === Swal.DismissReason.cancel) {
            visibleBuscarProducto.value = true
        }
    });
};
/****************************************************/

/****************************************************/
const datosDefault = ref({})
/****************************************************/
import inicioImg from '@/assets/Botones/inicio.png';
import productoImg from '@/assets/Botones/producto.png';
import facturaImg from '@/assets/Botones/factura.png';
import borrarImg from '@/assets/Botones/borrar.png';
import procesoImg from '@/assets/Botones/proceso.png';
import rapidoImg from '@/assets/Botones/rapido.png';
import descuentoImg from '@/assets/Botones/descuento.png';
import facturarImg from '@/assets/Botones/facturar.png';
import menuImg from '@/assets/Botones/menu.png';
import fabricaImg from '@/assets/Botones/fabrica.png';
import touchImg from '@/assets/Botones/touch.png';
import mesaImg from '@/assets/Botones/mesa.png';
import cobrarImg from '@/assets/Botones/cobrar.png';
import notaCreditoImg from '@/assets/Botones/notaCredito.png';
import movilImg from '@/assets/Botones/movil.png';
import tallerImg from '@/assets/Botones/reparar.png';
/****************************************************/
const posicionMenu = ref('bottom')
/****************************************************/
const cambiarPosicionMenu = () => {
  visibleprecio.value = false;
  Swal.fire({
    title: 'Selecciona la posición del menú',
    showCancelButton: true,
    showConfirmButton: true,
    cancelButtonText: '➡️ Derecha',
    confirmButtonText: '⬅️ Izquierda',
    footer: `<button id="btnAbajo" class="swal2-styled swal2-default">⬇️ Abajo</button>`,
    didOpen: () => {
      document.getElementById('btnAbajo').addEventListener('click', () => {
        posicionMenu.value = 'bottom';
        Swal.close();
      });
    }
  }).then((result) => {
    if (result.isConfirmed) {
      posicionMenu.value = 'left';
    } else if (result.dismiss === Swal.DismissReason.cancel) {
      posicionMenu.value = 'right';
    }
  });
};

const menuClasses = computed(() => ({
  'dock-fijo': posicionMenu.value === 'bottom',
  'dock-top': posicionMenu.value === 'top',
  'dock-right': posicionMenu.value === 'right',
  'dock-left': posicionMenu.value === 'left',
}));
/****************************************************/
const filteredItemsMenuFixed = computed(() => {
    return itemsMenuFixed.value.filter(item => item.visible !== false);
});
/****************************************************/
/****************************************************/
const fnCrearProductosDevs = async () => {
  // 1. Preguntar la cantidad
  const { value: cantidad } = await Swal.fire({
    title: '¿Cuántos productos quieres crear?',
    input: 'number',
    inputAttributes: {
      min: 1,
      step: 1
    },
    inputLabel: 'Cantidad de productos',
    inputPlaceholder: 'Ej: 5',
    confirmButtonText: 'Siguiente',
    showCancelButton: true,
    cancelButtonText: 'Cancelar',
    inputValidator: (value) => {
      if (!value || isNaN(value) || value <= 0) {
        return 'Ingresa una cantidad válida';
      }
    }
  });

  if (!cantidad) return;

  // 2. Preguntar el precio
  const { value: precio } = await Swal.fire({
    title: '¿Cuál será el precio de venta?',
    input: 'number',
    inputAttributes: {
      min: 1,
      step: 0.01
    },
    inputLabel: 'Precio unitario del producto',
    inputPlaceholder: 'Ej: 150',
    confirmButtonText: 'Crear productos',
    showCancelButton: true,
    cancelButtonText: 'Cancelar',
    inputValidator: (value) => {
      if (!value || isNaN(value) || value <= 0) {
        return 'Ingresa un precio válido';
      }
    }
  });

  if (!precio) return;

  // 3. Crear productos individualmente
  for (let i = 1; i <= parseInt(cantidad); i++) {
    codigoNProducto.value = generarCodigoUnico()+i;
    categoriaNProducto.value = 'ACCESORIOS';
    nombreNProducto.value = `PRODUCTO PRUEBA ${i}`;
    pVentaNProducto.value = parseFloat(precio);
    impuestoNProducto.value = 0;
    costoNProducto.value = 0;
     cantidadNProducto.value = 1;

    await fnAgregarProducto();
  }

  Swal.fire('✅ ¡Listo!', `Se crearon ${cantidad} productos a $${precio} c/u.`, 'success');
};

/****************************************************/
const itemsMenuFixed = ref([
    {
        label: 'Home',
        icon: inicioImg,
        visible:true,
        command: () => {
            router.push('/home');
        }
    },

    {
        label: 'Otro Producto',
        icon: productoImg,
        visible:true,
        command: () => {
            visibleOtroArticulo.value = true
        }
    },
    {
        label: 'Borrar | Nuevo',
        icon: borrarImg,
        visible:true,
        command: () => {
            nuevaFactura()
        }
    },
    {
        label: 'Facturas Y Cotizaciones',
        icon: facturaImg,
        command: () => {
            visiblefatcoti.value = true
        }
    },
    {
        label: 'Ventas en Proceso',
        icon: procesoImg,
        visible:true,
        command: () => {
            visibleSideBar.value = true
        }
    },
    {
        label: 'POS',
        icon: touchImg,
        visible: computed(() => datosDefault.value.modo === 'RESTAURANTE'),
        command: () => {
            visiblePOS.value = true;
        }
    },
    {
        label: 'MESAS',
        icon: mesaImg,
        visible: computed(() => datosDefault.value.modo === 'RESTAURANTE'),
        command: () => {
            visibleMESAS.value = true;
        }
    },
    {
        label: 'Cobrar',
        icon: cobrarImg,
        visible:true,
         command: () => {
            guardarFactura()
        }
    },
    {
        label: 'Descuento',
        icon: descuentoImg,
        visible:true,
         command: () => {
            visibleDescuento.value = true
        }
    },
{
    label: 'Fábrica',
    icon: fabricaImg,
    visible: computed(() => datosDefault.value.modo === 'FABRICA'),
    command: () => {
        modalMedidas.value = true;
    }
},

    {
        label: 'Crear Productos DEVs',
        icon: touchImg,
        visible:computed(() => datosEmpresa.usuario.usuario === 'Soporte'),
         command: () => {
            fnCrearProductosDevs()
        }
    },

    {
        label: 'Nota de Crédito',
        icon: notaCreditoImg,
        visible:true,
         command: () => {
            visibleNotaCredito.value = true
        }
    },
    {
        label: 'Recibir Equipos',
        icon: movilImg,
        visible: true,
        command: () => {
            visibleRecibirEquipos.value = true
        }
    },
    {
        label: 'Taller',
        icon: tallerImg,
        visible: true,
        command: () => {
            router.push('/taller')
        }
    }
]);
/****************************************************/
const onDockItemClick = (event, item) => {
    if (item.command) {
        item.command();
    }
    event.preventDefault();
};
/****************************************************/
const awesompleteprecio = ref(null)
const listaBuscador = ref([])
const datosProductoBuscado = ref({})
const datosProductoSeleccionadoPrincipal = ref({})
const nombreProductoBuscado = ref('PRODUCTO A BUSCAR')
const cantidadProductoBuscado = ref('1.00')
const precioVentaProductoBuscado = ref('0.00')
const impuestosProductoBuscado = ref('0.00')
const precioTotalProductoBuscado = ref('0.00')
const precioMinimoProductoBuscado = ref('0.00')
const precioXMayorProductoBuscado = ref('0.00')
const stockProductoBuscado = ref('0.00')
const ubicacionProductoBuscado = ref('0.00')
const disponibilidadProductoBuscado = ref('bg-dark')
const disponibilidadProducto = ref('REALICE CONSULTA')
const productosArray = ref([]);
const mesasArray = ref([]);
const combosArray = ref([]);
const garantiaArray = ref([]);
const categoriasArray = ref([]);
const imeisDisponiblesArray = ref([]);
const vendedoresNombre = ref([]);
/****************************************************/
const garantiaSelect = ref('VENTAS')
const garantiatextArea = ref(null)
/****************************************************/
const numeroNC = ref(null)
const arrayNC = ref([])
const listaBuscadorNC = ref([])
/****************************************************/
const switchbuscarpor = ref('Nombre')
const optionsBUscarpor = ref(['Nombre', 'Codigo de Barra']);
/****************************************************/
const awesompleteproductoprincipal = ref(null)
/****************************************************/
const comoVaElImpuesto = ref('No')
const optionsImpuesto = ref(['No','Interno','Externo'])
/****************************************************/
const documentoActual = ref('Factura Nueva');
const documentoEditado = ref(null);
const numerodocumentoEditado = ref(null);
/****************************************************/
const productoSeleccionadoLista = ref(null)
/****************************************************/
const usuarioLocal = ref({})
const configuracionFactura = ref({})
/****************************************************/
const allFacturasArray = ref([]);
const noFacturasArray = ref([]);
const allFacturasFull = ref([]);
/****************************************************/
  const filteredProducts = computed(() => {
    if (!searchQuery.value) return productosArray.value;
    return productosArray.value.filter(product => {
      return Object.values(product).some(value =>
        String(value).toLowerCase().includes(searchQuery.value.toLowerCase())
      );
    });
  });
/****************************************************/
/****************************************************/
const searchfactura = (event) => {
  if (event.query !== undefined) {
    const query = event.query.toLowerCase();
    if (!query) {
      noFacturasArray.value = [...allFacturasArray.value];
    } else {
      noFacturasArray.value = allFacturasArray.value.filter(item =>
        item.value.toLowerCase().includes(query)
      );
    }
  } else {
    console.error('El evento no contiene la propiedad query');
  }
};
/****************************************************/
document.body.classList.add('sidebar-close');
/****************************************************/
const optionsSearch = ref(['nombre', 'barcode','codigo']);
/****************************************************/
const actualizarScrollTop = () => {
  const container = posScrollContainer.value;
  const containerScroll = container ? container.scrollTop : 0;
  const windowScroll = window.scrollY || document.documentElement.scrollTop || 0;
  mostrarScrollTop.value = Math.max(containerScroll, windowScroll) > 320;
};

const irArriba = () => {
  const container = posScrollContainer.value;
  if (container) {
    container.scrollTo({ top: 0, behavior: 'smooth' });
  }
  window.scrollTo({ top: 0, behavior: 'smooth' });
};
/****************************************************/
const btnGratis = ref(false)
const btnCostoCero = ref(false)
const btnRestarImpuestos = ref(false)
const btnGuardarProducto = ref(false)
const codigoNProducto = ref('');
const nombreNProducto = ref('')
const categoriaNProducto = ref('ACCESORIOS')
const descripcionNProducto = ref('')
const pVentaNProducto = ref('0.00')
const impuestoNProducto = ref('0.00')
const costoNProducto = ref('0.00')
const stockNProducto = ref('1.00')
const cantidadNProducto = ref('1.00')
const imeiNProducto = ref('')
const verificandoImei = ref(false)
const imeiVerificado = ref(null) // null = no verificado, true = encontrado, false = no encontrado
/****************************************************/
const value = ref('');
const items = ref([]);
const searchMode = ref('nombre');
const filteredItems = ref([]);
const datosConfiguracion = ref({});
const productosVenta = ref([]);
const mostrarCarritoFlotante = ref(false);
const totalProductosCarrito = computed(() => {
  return productosVenta.value.reduce((total, producto) => total + Number(producto.cantidad || 0), 0);
});
const busquedaCarrito = ref('');
const mostrarTotalCard = ref(false);
const productosVentaFiltrados = computed(() => {
  const termino = busquedaCarrito.value.toLowerCase().trim();
  if (!termino) {
    return productosVenta.value.map((producto, index) => ({ ...producto, _indexOriginal: index }));
  }
  return productosVenta.value
    .map((producto, index) => ({ ...producto, _indexOriginal: index }))
    .filter(producto => {
      const nombre = (producto.nombre || producto.nombre_comercial || '').toLowerCase();
      const codigo = (producto.codigo || producto.codigo_interno || '').toLowerCase();
      const imei = (producto.imei_seleccionado || producto.imei || '').toLowerCase();
      return nombre.includes(termino) || codigo.includes(termino) || imei.includes(termino);
    });
});
const totalfactura = ref(0);
const clickedButton = ref('nombre');
/****************************************************/
const visibleCobro = ref(true);
const visibleprecio = ref(false);
const modalMedidas = ref(false);
const visiblecobrar = ref(false);
const visiblecliente = ref(false);
const visiblePOS = ref(false);
const visibleMESAS = ref(false);
const visiblefatcoti = ref(false);
const visibleComprobantes = ref(false);
const visibledinero = ref(false);
const visibleDescuento = ref(false);
const visibleBuscarPrecio = ref(false);
const visibleOtroArticulo = ref(false);
const visibleBuscarProducto = ref(false);
const visibleSideBar = ref(false);
const visibleNotaCredito = ref(false);
const visibleRecibirEquipos = ref(false);
const ocultarSinStock = ref(true); // Por defecto ocultar productos con stock <= 0
const agregarDirectoCarrito = ref(false); // Agregar productos (no CELULARES/ELECTRODOMESTICOS) directo al carrito

// ============================================================================
// VARIABLES PARA WHATSAPP
// ============================================================================
const whatsappModalRef = ref(null);
const datosWhatsApp = ref({
  nombre: '',
  numero: '',
  texto: ''
});

// ============================================================================
// VARIABLES PARA RECIBIR EQUIPOS (CAMBIAZO)
// ============================================================================
const recibirEquiposStep = ref(0);
const recibirEquiposLoading = ref(false);
const recibirEquiposBuscandoImei = ref(false);
const recibirEquiposBuscandoCedula = ref(false);

// Datos del equipo recibido
const equipoRecibido = ref({
  imei: '',
  marca: '',
  modelo: '',
  color: '',
  capacidad: '',
  condicion: 'USADO',
  observaciones: '',
  precio_compra: 0,
  precio_venta: 0,
  incluye_cargador: false,
  incluye_caja: false,
  incluye_audifonos: false,
  estado_bateria: 'BUENO',
  estado_pantalla: 'BUENO'
});

// Datos del vendedor/persona que entrega el equipo
const personaCambiazo = ref({
  cedula: '',
  nombre: '',
  telefono: '',
  direccion: '',
  id_persona: null,
  es_nuevo: false
});

// Configuración de la transacción
const transaccionCambiazo = ref({
  tipo_registro: 'GASTO', // 'NOTA_CREDITO' o 'GASTO'
  metodo_pago: 'EFECTIVO', // 'EFECTIVO', 'TRANSFERENCIA', 'TARJETA', 'OTRO'
  sale_de_caja: true,
  afecta_compras: true,
  nota: ''
});

// Opciones para selects
const opcionesTipoRegistro = ref([
  { label: 'Registrar como Gasto', value: 'GASTO' },
  { label: 'Crear Nota de Crédito', value: 'NOTA_CREDITO' }
]);

const opcionesMetodoPago = ref([
  { label: 'Efectivo (De Caja)', value: 'EFECTIVO' },
  { label: 'Transferencia', value: 'TRANSFERENCIA' },
  { label: 'Tarjeta', value: 'TARJETA' },
  { label: 'Otro', value: 'OTRO' }
]);

const opcionesCondicion = ref([
  { label: 'Usado - Excelente', value: 'USADO_EXCELENTE' },
  { label: 'Usado - Bueno', value: 'USADO_BUENO' },
  { label: 'Usado - Regular', value: 'USADO_REGULAR' },
  { label: 'Usado - Para Piezas', value: 'USADO_PIEZAS' }
]);

const opcionesEstado = ref([
  { label: 'Excelente', value: 'EXCELENTE' },
  { label: 'Bueno', value: 'BUENO' },
  { label: 'Regular', value: 'REGULAR' },
  { label: 'Malo', value: 'MALO' }
]);

// Validaciones y alertas
const recibirEquiposErrors = ref({});
const imeiYaExiste = ref(false);
const efectivoCajaInsuficiente = ref(false);

const visibleNota = ref(false);
const visibleCredito = ref(false);
const productoSeleccionado = ref({});

// Variables para Asistente IA
const visibleAsistenteIA = ref(false);
const iaActiveTab = ref(0);
const mensajesIA = ref([]);
const mensajeUsuarioIA = ref('');
const cargandoIA = ref(false);
const buscarPrincipioActivoIA = ref('');
const resultadosBusquedaIA = ref([]);
const chatContainerRef = ref(null);
const OPENAI_API_KEY = ref(''); // Se cargará desde configuración

// Variables para Equivalentes
const medicamentoParaEquivalentes = ref(null);
const sugerenciasMedicamentos = ref([]);
const medicamentoSeleccionadoIA = ref(null);
const equivalentesEnStock = ref([]);
const respuestaEquivalentesIA = ref('');
const cargandoEquivalentesIA = ref(false);
const busquedaEquivalentesRealizada = ref(false);
const busquedaPrincipioRealizada = ref(false);
const mostrarPrincipioActivoModal = ref(false);
const imeiProductoModal = ref([]);
const imeisSeleccionadosModal = ref([]);
const filtroImeiModal = ref('');

// Computed para filtrar IMEIs en la modal de producto
const imeiProductoModalFiltrados = computed(() => {
  if (!filtroImeiModal.value.trim()) {
    return imeiProductoModal.value;
  }
  const filtro = filtroImeiModal.value.trim().toLowerCase();
  return imeiProductoModal.value.filter(imei =>
    imei.imei.toLowerCase().includes(filtro)
  );
});

const position = "top";
const impuestoSistema = ref(18);
const ventasXMayor = true;
const otroPrecio = true;
const tabladefault = ref('');
/****************************************************/
/****************************************************/
const checkedvermascampos = ref(false)
const checkededitarclientes = ref(false)
const checkedpormayor = ref(false)
const clienteSeleccionado = ref(null)
const ocultarImagenProductos = ref(true)
/****************************************************/
const efetivoFNRef = ref(false);
const tarjetaFNRef = ref(false);
const transferenciaFNRef = ref(false);
/****************************************************/
const buscarpor = ref('nombre');
/****************************************************/
/****************************************************/
//datos del cliente
const clienteSelected = ref({})
const itemsclientes = ref([]);
const allClientes = ref([]);
const nombreClientsArray = ref([]);
/****************************************************/
const searchclientes = (event) => {

  const dCliente = allClientes.value.find(cliente=>cliente.nombre == event.value)
  if (dCliente) {
     clienteSelected.value = dCliente
     clienteSelected.value = dCliente
     visiblecliente.value = false
     visiblecobrar.value = true
  }

};
/****************************************************/
const nombreClientesSelected = (event) => {

  const datosC = allClientes.value.find(cliente => cliente.nombre === event);
  if (datosC) {
    clienteSelected.value = { ...datosC };
    guardarActualizar.value = 'Actualizar';
    if (datosC.precio_fijado === 'PorMayor') {
      checkedpormayor.value = true;
    } else {
      checkedpormayor.value = false;
    }
  } else {
    guardarActualizar.value = 'Guardar';
    checkedpormayor.value = false;
  }
};

/****************************************************/
const nombreFacturaSelected = (event)=>{
  //datosFactCoti.value.nombre = event.value[buscarpor]
  datosFactCoti.value.numero = event

  let datos;

  if(datosFactCoti.value.tipo === 'Factura'){
   datos = allFacturasFull.value.find(fact=>fact.no_factura === event)
     if(datos){
        if(datos.metodo_pago === 'CREDITO'){
          facturaEsCredito.value = true
        }else{
          facturaEsCredito.value = false
        }
     }
  }


}
/****************************************************/
const nombreFacturaSelectedNombre = (event)=>{
  datosFactCoti.value.numero = event.value.value

}
/****************************************************/
const rnc = ref('');
const guardarActualizar = ref('Guardar');
const tipoclientebuscar = ref('NADA');
const resultado = ref({});
const camposClienteVisibles = ref(false);

const toggleCamposVisibles = () => {
  camposClienteVisibles.value = checkedvermascampos.value;
};

/****************************************************/
const buscarRNC = async () => {
  loading.value = true;
  visiblecliente.value = false;
  
      clienteSelected.value.nombre = '';
      clienteSelected.value.rnc = '';
      clienteSelected.value.cedula = '';
      clienteSelected.value.direccion = '';
      clienteSelected.value.n_comercial = '';
      clienteSelected.value.codigo = generarCodigoUnico();


  // Comprobar si el RNC ya está en `allClientes`
  const encontrar = allClientes.value.find(cliente => cliente.rnc === rnc.value);

  if (encontrar) {
     toast.removeAllGroups();
    toast.add({ severity: 'success', summary: 'Encontrado', detail: 'Datos Encontrados', life: 3000 });
    clienteSelected.value = encontrar;
    clienteSelected.value = encontrar;
    guardarActualizar.value = 'Actualizar';
    loading.value = false;
    //visiblecliente.value = true;
    return;
  }

  try {
    // Solicitud al proceso principal de Electron
    let response;
    if(switchbuscarRNC.value === 'RNC'){ 
       if(window.electron){
           response = await window.electron.ipcRenderer.invoke('consultarRNC', rnc.value);
       }else{
      toast.add({ severity: 'error', summary: 'Upps', detail: 'Esta funcion es solo para la aplicacion Desktop', life: 3000 });
     }
    }else{
       if(window.electron){
       response = await window.electron.ipcRenderer.invoke('consultarPasaporte', rnc.value);
       response.nombrerazon_social = response.nombre + ' '+response.apellido;
       response.cedularnc = rnc.value;
     }else{
      toast.add({ severity: 'error', summary: 'Upps', detail: 'Esta funcion es solo para la aplicacion Desktop', life: 3000 });
     }
    }

    // Verificar si la respuesta tiene datos
    if (response && Object.keys(response).length > 0 && !response.error) {
      loading.value = false;
               const formattedData = Object.entries(response)
            .map(([key, value]) => `<li><strong>${key}:</strong> ${value}</li>`)
            .join('');

          // Mostrar prueba.object con SweetAlert2
          Swal.fire({
            title: 'Datos de la Empresa',
            html: `<ul style="text-align: left; margin: 0; padding: 0;">${formattedData}</ul>`,
            icon: 'success',
            confirmButtonText: 'Cerrar'
          });
       toast.removeAllGroups();
      toast.add({ severity: 'success', summary: 'Encontrado', detail: 'Datos Encontrados', life: 3000 });
      resultado.value = response;
      
      // Mapear la respuesta a los campos del cliente
      clienteSelected.value.nombre = response.nombrerazon_social;
      clienteSelected.value.rnc = response.cedularnc;
      clienteSelected.value.cedula = response.cedularnc;
      clienteSelected.value.direccion = response.administracion_local;
      clienteSelected.value.n_comercial = response.nombrerazon_social;
      clienteSelected.value.precio_fijado = 'Normal';
      clienteSelected.value.codigo = rnc.value;
      
      guardarActualizar.value = 'Guardar';
      //visiblecliente.value = true;
    } else {
      // Manejar caso de datos vacíos o sin resultados
      loading.value = false;
      toast.add({ severity: 'error', summary: 'Error', detail: 'No se encontraron los datos para el RNC proporcionado.', life: 3000 });
      //visiblecliente.value = true;
    }
  } catch (error) {
    // Manejo de errores en la solicitud
    loading.value = false;
    console.error('Error en la solicitud:', error);
    toast.add({ severity: 'error', summary: 'Error', detail: 'Ocurrió un error al consultar los datos.', life: 3000 });
    //visiblecliente.value = true;
  }
};


// Datos del formulario
const comprobante = ref('NORMAL');
const metodoPago = ref('EFECTIVO');
const metodoPagoOptions = ref([]);
const metodoPagoTarjetaSeleccionado = ref(null);
const metodosConPorcentaje = computed(() => {
  return metodoPagoOptions.value.filter(m => Number(m.porcentaje || 0) > 0);
});
const montoTarjetaOriginal = ref(0);
const montoTarjetaConRecargo = ref(0);
const productosSeleccionadosRecargo = ref([]);
const diferenciaRecargo = computed(() => {
  return Number((montoTarjetaConRecargo.value - montoTarjetaOriginal.value).toFixed(2));
});
const metodoPagoRequiereBanco = computed(() => {
  const metodo = (metodoPago.value || '').toUpperCase();
  return metodo.includes('TRANSFERENCIA') || metodo.includes('TARJETA');
});
const estadoFactura = ref('Pendiente');
const institucion = ref('Ninguna');
const subtotal = ref(0.00);
const descuento = ref(0.00);
const impuesto = ref(0.00);
const total = ref(0.00);
const chequeFN = ref(0.00);
const nota = ref('');
const incluirImpuesto = ref(false);
const agregarImpuesto = ref(false);
const impresora = ref('Impresora Ticket');
const cliente = ref('default');
const tipoFactura = ref('factura');
const pagaCon = ref(0.00);
const suCambio = ref(0.00);
const cajero = ref(''); // Defina el nombre del cajero
const vendedor = ref(''); // Defina el nombre del vendedor
const instalador = ref('Ninguno');
const delivery = ref('Ninguno');
const xMayor = ref(false);
const impresionOffline = ref(null);
const visibleProductoModal = ref(false);
const productoModal = ref({});
const cantidadProductoModal = ref(1);
const mostrarScrollTop = ref(false);
const posScrollContainer = ref(null);
const visibleEditarProductoModal = ref(false);
const productoEditando = ref({});
const visibleComprobanteRapido = ref(false);
/************************************************************/
const diasCREDITO = ref('10 DIAS')
const optionsCREDITO = ref(['10 DIAS', '20 DIAS','30 DIAS','60 DIAS']);
const fechaCREDITO = ref(agregarDiasalaFechaActual(10))
const abonoCREDITO = ref('0.00')
const metodoPagoCREDITO = ref('EFECTIVO')
const tipoCredito = ref('NORMAL')
const quienCredito = ref('CLIENTE')
const cuotasCredito = ref(1)
const montoCREDITO = ref(0)
const interesCredito = ref(0)
const saldoCREDITO = ref(0)
const valorCuotasCredito = ref(0)
const totalCreditoConInteres = ref(0)
const notaCREDITO = ref('')
const tiempoCredito = ref('MENSUAL')
const fechasPagocredito = ref(fechaCREDITO.value)
/************************************************************/

/************************************************************/
const fncantDiasCREDITO = ()=>{
   if (diasCREDITO.value =='10 DIAS') {
      fechaCREDITO.value = agregarDiasalaFechaActual(10);
   }else if(diasCREDITO.value =='20 DIAS'){
      fechaCREDITO.value = agregarDiasalaFechaActual(20);
   }else if(diasCREDITO.value =='30 DIAS'){
      fechaCREDITO.value = agregarDiasalaFechaActual(30);
   }else if(diasCREDITO.value =='60 DIAS'){
      fechaCREDITO.value = agregarDiasalaFechaActual(60);
   }
}
/************************************************************/
watchEffect(()=>{
  if(visibleApartado.value){
    apartado.value.abono = '0.00'
    apartado.value.saldo = totalfactura.value
    apartado.value.vencimiento = agregarDiasalaFechaActual(90)
  }
})
/****************************************************/
const calcularApartado = ()=>{
  const abono = Number(apartado.value.abono);
  const monto = Number(totalfactura.value);
  let saldo = (monto - abono);

   if(abono > monto){
    apartado.value.saldo = totalfactura.value
    apartado.value.abono = 0
    return
   }

    apartado.value.saldo = saldo.toFixed(2);

   if (metodoPagoApartado.value == 'EFECTIVO') {
      efetivoFN.value = abono; 
   }else if(metodoPagoApartado.value == 'TARJETA'){
      tarjetaFN.value = abono; 
   }else if(metodoPagoApartado.value == 'TRANSFERENCIA'){
      transferenciaFN.value = abono; 
   }


}
/****************************************************/
const fnCambiarMetodoApartado = (metodo)=>{
    const abono = Number(apartado.value.abono);
     if (metodo.value == 'EFECTIVO') {
      efetivoFN.value = abono; 
   }else if(metodo.value == 'TARJETA'){
      tarjetaFN.value = abono; 
   }else if(metodo.value == 'TRANSFERENCIA'){
      transferenciaFN.value = abono; 
   }

}
/****************************************************/
/////////////--VARIABLES DE LA FACTURA NUEVA--///////
/****************************************************/
const noFacturaFN = ref('0000001');
const comprobanteFN = ref('SIN COMPROBANTE');
const estadoFN = ref('Cobrado');
const efetivoFN = ref(0.00);
const tarjetaFN = ref(0.00);
const transferenciaFN = ref(0.00);
const vendedorFN = ref('No Registrado');
const cajeroFN = ref('No Registrado');
const instaladorFN = ref('No Registrado');
const meseroFN = ref('No Registrado');
const mesaFN = ref('No Registrado');
const deliveryFN = ref('No Registrado');
const gananciaFN = ref(0.00);
const comprobantes = ref({
  'NORMAL':'',
  'FISCAL':'B01',
  'FINAL':'B02',
  'REGIMEN ESPECIAL':'B14',
  'GUBERNAMENTAL':'B15',
})

const mensajeComprobantes = ref({
  'NORMAL':'SIN COMPROBANTE',
  'FISCAL':'COMPROBANTE CON VALOR FISCAL',
  'FINAL':'CONSUMIDOR FINAL',
  'REGIMEN ESPECIAL':'REGIMEN ESPECIAL',
  'GUBERNAMENTAL':'COMPROBANTE GUBERNAMENTAL',
})
/****************************************************/
const mensajeComprobantes02 = ref({
  'NORMAL':'SIN COMPROBANTE',
  'B01':'COMPROBANTE CON VALOR FISCAL',
  'B02':'CONSUMIDOR FINAL',
  'B14':'REGIMEN ESPECIAL',
  'B15':'COMPROBANTE GUBERNAMENTAL',
})
/****************************************************/
const comprobanteEtiqueta = computed(() => {
  return mensajeComprobantes.value[comprobante.value] || 'SIN COMPROBANTE';
});

const comprobanteClase = computed(() => {
  if (comprobante.value === 'FISCAL') return 'pos-comprobante-fiscal';
  if (comprobante.value === 'FINAL') return 'pos-comprobante-consumo';
  if (comprobante.value === 'REGIMEN ESPECIAL') return 'pos-comprobante-especial';
  if (comprobante.value === 'GUBERNAMENTAL') return 'pos-comprobante-gubernamental';
  return 'pos-comprobante-normal';
});
/****************************************************/
const cambiosQuienCredito = (selected)=>{
  if(selected.value === 'INSTITUCION'){
     if(institucion.value === 'Ninguna'){
        institucion.value = intitucionesDataNames.value[0]
     }
  }

}
/****************************************************/
const fnCalcularCREDITO = ()=>{
  const abono = Number(abonoCREDITO.value);
  const monto = Number(montoCREDITO.value);
  const saldo = monto - abono;
  saldoCREDITO.value = saldo.toFixed(2);
   if (metodoPagoCREDITO.value == 'EFECTIVO') {
      efetivoFN.value = abono; 
   }else if(metodoPagoCREDITO.value == 'TARJETA'){
      tarjetaFN.value = abono; 
   }else if(metodoPagoCREDITO.value == 'TRANSFERENCIA'){
      transferenciaFN.value = abono; 
   }
}
/****************************************************/
const ventasGuardadas = ref([])
/****************************************************/
const fetchventasGuardadas = async () => {
  try {

    const response = await peticionesFetchOffline('getDataByCondition', 'ventasenproceso','almacen',datosEmpresa.empresa.nombre);
    ventasGuardadas.value = response;
    /*********************************************/
  } catch (error) {
    toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to fetch data Ventas EN Proceso', life: 3000 });
  }
};

/****************************************************/
const fetchNotaCredito = async () => {
  try {
    const response = await peticionesFetchOffline('getDataByCondition', 'notacredito','almacen',datosEmpresa.empresa.nombre);
    arrayNC.value = response;
    listaBuscadorNC.value = response.map(nc=>nc.no_credito)
    /*********************************************/
  } catch (error) {
    toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to fetch data Ventas EN Proceso', life: 3000 });
  }
};

/****************************************************/
const fetchBanco = async () => {
  try {
   const verificaLocalStorage = JSON.parse(window.localStorage.getItem('bancos')) || [];
   if(verificaLocalStorage.length > 0){
      cuentaBancaria.value = verificaLocalStorage[verificaLocalStorage.length - 1];
       bancoArray.value = verificaLocalStorage;
   }else{
    const response = await peticionesFetchOffline('getDataByCondition', 'banco','almacen',datosEmpresa.empresa.nombre);

      cuentaBancaria.value = response[response.length - 1];
       bancoArray.value = response;
    localStorage.setItem('bancos', JSON.stringify(response));

   }
  
    /*********************************************/
  } catch (error) {
    console.error('Error fetching data', error);
    toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to fetch data', life: 3000 });
  }
};
/****************************************************/
const fetchCategorias = async () => {
  try {

    const response = await peticionesFetchOffline('getDataByCondition', 'categorias','almacen',datosEmpresa.empresa.nombre);

    categoriasArray.value = response;
    /*********************************************/
  } catch (error) {
    console.error('Error fetching data', error);
    toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to fetch data', life: 3000 });
  }
};
/****************************************************/
const fetchGarantias = async () => {
  try {
    const verificaLocalStorage = JSON.parse(window.localStorage.getItem('garantia')) || [];

    if (verificaLocalStorage.length > 0) {
      garantiaArray.value = [{ referencia: 'Ninguna' }, ...verificaLocalStorage];
    } else {

      const response = await peticionesFetchOffline('getDataByCondition', 'garantia','almacen',datosEmpresa.empresa.nombre);

      garantiaArray.value = [{ referencia: 'Ninguna' }, ...response];
      localStorage.setItem('garantia', JSON.stringify(response));
    }

  } catch (error) {
    console.error('Error fetching data', error);
    toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to fetch data', life: 3000 });
  }
};

/****************************************************/

const normalizarTexto = (valor) => (valor || '').toString().trim().toUpperCase();

const obtenerAlmacenNombre = () => {
  const base = datosEmpresa.empresa?.nombre || datosEmpresa.empresa?.almacen || '';
  return normalizarTexto(base);
};

const asegurarColumnaAlmacen = async (tabla, almacenNombre) => {
  const columnas = await peticionesFetchOffline('getTableColumns', tabla);
  if (!columnas.includes('almacen')) {
    await peticionesFetchOffline('addColumnToTable', { tabla, campo: 'almacen' });
    if (almacenNombre) {
      await peticionesFetchOffline('updateEntireColumn', tabla, 'almacen', almacenNombre);
    }
  }
};
/**************************************************************/
const obtenerProductos = async (activarPos) => {
  if (activarPos == 'true') {
    return await peticionesFetchOffline('getDataAsArrayWithIMG', 'productos');
  }
    return await peticionesFetchOffline('getDataProductosArray', 'productos');
};

const filtrarPorAlmacen = (productos, almacenNombre) => {
  if (!almacenNombre) return productos;
  return productos.filter(prod => {
    const prodAlmacen = normalizarTexto(prod.almacen || almacenNombre);
    return prodAlmacen === almacenNombre;
  });
};

const construirListaBuscador = (productos, combos, imeis = []) => {
  const lista = [];
  productos.forEach(prod => {
    ['codigo_interno', 'codigo_barra', 'nombre_comercial'].forEach(key => {
      const valor = prod[key];
      if (valor) lista.push(valor);
    });
  });
  combos.forEach(combo => {
    if (combo.nombre) lista.push(combo.nombre);
  });
  // Agregar IMEIs disponibles al buscador
  imeis.forEach(imei => {
    if (imei.imei) lista.push(imei.imei);
    if (imei.equipo) lista.push(`${imei.imei} - ${imei.equipo}`);
  });
  return lista;
};

const notificarProductosSinStock = async (productos) => {
  const productosSinStock = productos.filter(prod => Number(prod.stock) < 1);
  const camposNotificacion = await arrayToObjetoFromTablaOffline('notificaciones');
  const urlNotificacionProd = link.value + api.value + "/insertar/notificaciones";

  if (productosSinStock.length < 20) {
    const notificacionesArray = await peticionesFetchOffline('getDataAsArray', 'notificaciones');
    for (let prod of productosSinStock) {
      if (camposNotificacion.hasOwnProperty('created_at')) {
        camposNotificacion.created_at = nfecha('timestamp');
        camposNotificacion.updated_at = nfecha('timestamp');
      }

      camposNotificacion.titulo = 'Producto Sin Stock';
      camposNotificacion.mensaje = `${prod.nombre} ya no tiene en Stock Ver mas Detalles`;
      camposNotificacion.accion = '/editarproductos/' + prod.id;

      const verificaNotificacion = notificacionesArray.find(notif => notif.accion == camposNotificacion.accion);
      if (!verificaNotificacion) {
        /*const envioDatosNotificacion = await enviarDatosPorPost(urlNotificacionProd, camposNotificacion, tokenCifrado.value);*/
        await peticionesFetchOffline('insertData', 'notificaciones', JSON.stringify(camposNotificacion));
      }
    }
    return;
  }

  if (camposNotificacion.hasOwnProperty('created_at')) {
    camposNotificacion.created_at = nfecha('timestamp');
    camposNotificacion.updated_at = nfecha('timestamp');
  }

  camposNotificacion.titulo = 'Mas de 20 Productos Sin Stock';
  camposNotificacion.mensaje = `Tienes Muchos Productos sin Stock`;
  camposNotificacion.accion = '/productos';

  const verificaNotificacion = await peticionesFetchOffline('getDataByField', 'notificaciones', 'accion', camposNotificacion.accion);
  if (!verificaNotificacion) {
    /*  const envioDatosNotificacion = await enviarDatosPorPost(urlNotificacionProd, camposNotificacion, tokenCifrado.value);*/
    await peticionesFetchOffline('insertData', 'notificaciones', JSON.stringify(camposNotificacion));
  }

  toast.add({ severity: 'error', summary: 'Error', detail: 'Upps Tienes ' + productosSinStock.length + ' Productos sin STOCK', life: 3000 });

  const datosJSOND = await envioElectron('datosarchivo');
  const sonidoR = datosJSOND.VITE_SOUND;
  const activado = !!sonidoR;

  if (activado) {
    if (window.electron) {
      window.electron.ipcRenderer.invoke("play-sound", 'error-1.mp3');
    } else {
      toast.add({ severity: 'error', summary: 'Upps', detail: 'Esta funcion es solo para la aplicacion Desktop', life: 3000 });
    }
  }
};
/************************************************************/
const fetchAndSetupData = async (reintento = false) => {
  cargandoProductos.value = true;
  try {
    const datosDefaultLocal = JSON.parse(localStorage.getItem('tabladefault')) || {};
    const almacenNombre = obtenerAlmacenNombre();

    await asegurarColumnaAlmacen('productos', almacenNombre);

    let response = await obtenerProductos(datosDefaultLocal.activar_pos);

    response = filtrarPorAlmacen(response, almacenNombre);

    const copiaoriginal = JSON.parse(JSON.stringify(response));
    productosArraySinModificaciones.value = copiaoriginal;

    await notificarProductosSinStock(copiaoriginal);

    items.value = response;
    productosArray.value = response;

    // Cargar IMEIs disponibles
    try {
      const imeisResponse = await peticionesFetchOffline('getDataByCondition', 'imei', 'almacen', almacenNombre);
      imeisDisponiblesArray.value = imeisResponse.filter(imei => imei.estado === 'DISPONIBLE');
    } catch (e) {
      console.error('Error cargando IMEIs:', e);
      imeisDisponiblesArray.value = [];
    }

    listaBuscador.value = construirListaBuscador(response, combosArray.value, imeisDisponiblesArray.value);
  } catch (error) {
    console.error('Error fetching data', error);
    toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to fetch data', life: 3000 });
  } finally {
    cargandoProductos.value = false;
  }
};

/************************************************************/
const fetchClientes = async () => {
  try {

 let responseclientes = await peticionesFetchOffline('getDataArrayByCondition', 'clientes','almacen',datosEmpresa.empresa.nombre);

    // Verificar si existe el cliente "AL CONTADO", si no existe, crearlo en memoria
    const clienteAlContado = responseclientes.find(client => client.codigo === '0000000' || client.nombre === 'AL CONTADO');
    if (!clienteAlContado) {
      const clientePorDefecto = {
        id: 0,
        codigo: '0000000',
        nombre: 'AL CONTADO',
        cedula: '000-0000000-0',
        telefono: '',
        direccion: '',
        email: '',
        rnc: '',
        limite_credito: 0,
        saldo: 0,
        almacen: datosEmpresa.empresa?.nombre || '',
        precio_fijado: 'Normal'
      };
      responseclientes.unshift(clientePorDefecto);
    }

    const datosFiltrados = responseclientes.filter(cliente => cliente.nombre && cliente.nombre.trim() !== '');

    nombreClientsArray.value = datosFiltrados.map(item => item.nombre);
    itemsclientes.value = responseclientes;
    allClientes.value = responseclientes;


const clienteLocalStorage = window.localStorage.getItem('clienteLocalStorage');

// Validar que no sea null, undefined, "null" ni "undefined"
if (clienteLocalStorage && clienteLocalStorage !== 'undefined' && clienteLocalStorage !== 'null') {
  try {
    const datosCliente = JSON.parse(clienteLocalStorage);
    if (datosCliente && datosCliente.nombre) {
      clienteSelected.value = datosCliente;
    } else {
      throw new Error('JSON vacío o sin nombre');
    }
  } catch (error) {
    // En caso de error al parsear o contenido inválido
    console.warn('⚠️ Error al leer cliente del localStorage:', error);
    setClientePorDefecto();
  }
} else {
  setClientePorDefecto();
}

// Función para establecer el cliente por defecto y guardar en localStorage
function setClientePorDefecto() {
  const clienteDefault = responseclientes.find(client => client.codigo === '0000000' || client.nombre === 'AL CONTADO');
  clienteSelected.value = clienteDefault || responseclientes[0] || { nombre: 'AL CONTADO', codigo: '0000000' };
  window.localStorage.setItem('clienteLocalStorage', JSON.stringify(clienteSelected.value));
}


    /***************************************/
  } catch (error) {
    console.error('Error fetching clients data:', error);
    toast.add({ severity: 'error', summary: 'Error', detail: 'Error fetching clients data', life: 3000 });
  }
};
/************************************************************/
const cambiarCliente = ()=>{
    window.localStorage.setItem('clienteLocalStorage',JSON.stringify(clienteSelected.value))
precioFijado.value = clienteSelected.value?.precio_fijado || 'Normal';

}

watch(() => clienteSelected.value, cambiarCliente);

/************************************************************/
const fetchFacturas = async () => {
  try {
    // 1) Verificar columna almacen (y crearla si no existe)
    const columnas = await peticionesFetchOffline('getTableColumns', 'facturas');

    if (!columnas.includes('almacen')) {
      await peticionesFetchOffline('addColumnToTable', { tabla: 'facturas', campo: 'almacen' });

      // llenar toda la columna con el almacén actual
      await peticionesFetchOffline(
        'updateEntireColumn',
        'facturas',
        'almacen',
        datosEmpresa.empresa.nombre
      );
    }

    // 2) Traer facturas ya con columna lista
    const responseFacturas = await peticionesFetchOffline(
      'getDataArrayByCondition',
      'facturas',
      'almacen',
      datosEmpresa.empresa.nombre
    );

    // 3) Últimas 1000 (más nuevas primero)
    const facturasData = (responseFacturas || [])
      .slice()
      .sort((a, b) => Number(b.id || 0) - Number(a.id || 0)) // cambia a created_at si aplica
      .slice(0, 1000);

    allFacturasFull.value = facturasData;

    if (facturasData.length > 0) {
      noFacturasArray.value = facturasData.map(item => item.no_factura);
      allFacturasArray.value = facturasData.map(item => ({
        label: item.nombre_cliente,
        value: item.no_factura
      }));
      datosFactCoti.value.numero = noFacturasArray.value[0] || null;
    } else {
      noFacturasArray.value = [];
      allFacturasArray.value = [];
      datosFactCoti.value.numero = null;
    }

  } catch (error) {
    console.error('Error fetching facturas data:', error);
    toast.add({ severity: 'error', summary: 'Error', detail: 'Error fetching data of Facturas', life: 3000 });
  }
};

//facturaEsCredito
/************************************************************/
const preFacturasArray = ref([]);
/************************************************************/

/************************************************************/
const ordenesArray = ref([]);
/************************************************************/
const apartadosArray = ref([]);
/************************************************************/
const fetchCotizaciones = async () => {
  try {
    const responseFacturas = await peticionesFetchOffline(
      'getDataArrayByCondition',
      'cotizacion',
      'almacen',
      datosEmpresa.empresa.nombre
    );

    // ✅ ordenar (más nuevas primero) y limitar a 1000
    const facturasData = (responseFacturas || [])
      .slice() // copia pa no mutar el original
      .sort((a, b) => (Number(b.id || 0) - Number(a.id || 0))) // si tienes id incremental
      .slice(0, 1000);

    allCotizacionesFull.value = facturasData;

    noFacturasArray.value = facturasData.map(item => item.no_cotizacion);
    allFacturasArray.value = facturasData.map(item => ({
      label: item.nombre_cliente,
      value: item.no_cotizacion
    }));

    datosFactCoti.value.numero = noFacturasArray.value[0] || null;

  } catch (error) {
    console.error('Error fetching Cotizaciones data:', error);
    toast.add({ severity: 'error', summary: 'Error', detail: 'Error fetching data of Cotizaciones', life: 3000 });
  }
};

/************************************************************/
const tipodocumento = async(doc)=>{
  const tipo = datosFactCoti.value.tipo;
  if (tipo == 'Cotizacion' || tipo == 'cotizacion') {
   await  fetchCotizaciones();
   documentoActual.value = 'COTIZACIÓN';
  }else{
    await fetchFacturas();
    documentoActual.value = 'FACTURA';
  }
}
/************************************************************/
const buscarPorNombre = () => {
   toast.removeAllGroups();
  toast.add({ severity: 'success', summary: 'OK', detail: 'Buscando por Nombre', life: 3000 });
  searchMode.value = 'nombre';
  clickedButton.value = 'nombre';
  buscarpor.value = 'nombre';
  value.value = ''; // Limpiar el campo de búsqueda

};

/************************************************************/
const buscarPorBarcode = () => {
   toast.removeAllGroups();
  toast.add({ severity: 'success', summary: 'OK', detail: 'Buscando por Barcode', life: 3000 });
  searchMode.value = 'barcode';
  clickedButton.value = 'barcode';
  buscarpor.value = 'codigo_barra';
  value.value = ''; // Limpiar el campo de búsqueda
};
/************************************************************/
const buscarPorCodigo = () => {
     toast.removeAllGroups();
    toast.add({ severity: 'success', summary: 'OK', detail: 'Buscando por Código Corto', life: 3000 });
  searchMode.value = 'codigo';
  clickedButton.value = 'codigo';
  value.value = ''; // Limpiar el campo de búsqueda
};
const fetchDataConfiguracion = async () => {
  try {

   const verificaLocalStorage = JSON.parse(window.localStorage.getItem('configuracion')) || [];
   console.log("verificaLocalStorage", verificaLocalStorage);

   if (verificaLocalStorage.length > 0) {
      datosConfiguracion.value = verificaLocalStorage;
   }else{

    const response = await peticionesFetchOffline('getDataByField', 'configuracion','id',1);

    datosConfiguracion.value = response;
    localStorage.setItem('configuracion', JSON.stringify(response));
   }

    const printer = {
      'Impresora Ticket':'Termica',
      'Offline':'Termica2',
      'Impresora Normal':'Tinta',
    }
    datosFactCoti.value.impresora = printer[datosConfiguracion.value.tipo_impresora];

    // tipoImpuestoFactura ahora depende de tabladefault.comprobantes, no de tipo_papel

  } catch (error) {
    console.error('Error fetching data', error);
    toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to fetch data Configuracion', life: 3000 });
  }
};

/************************************************************/
const fetchDatametodoPago = async () => {
  try {

   const verificaLocalStorage = JSON.parse(window.localStorage.getItem('metodopago')) || [];

   if (verificaLocalStorage.length > 0) {
      metodoPagoOptions.value = verificaLocalStorage;
   }else{
/*    const response = await peticionesFetch(`${link.value}${api.value}`,`datosarray/metodopago`,{},tokenCifrado.value,'GET');*/
    const response = await peticionesFetchOffline('getDataAsArray', 'metodopago');

    metodoPagoOptions.value = response;
    localStorage.setItem('metodopago', JSON.stringify(response));
   }

   metodoPagoOptionsNombres.value = metodoPagoOptions.value.map(metodo=>metodo.nombre);
   metodoPagoOptionsNombresApartado.value = metodoPagoOptionsNombres.value.filter(ap=>ap !== 'APARTADO');

  } catch (error) {
    console.error('Error fetching data', error);
    toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to fetch data Metodo Pago', life: 3000 });
  }
};
/************************************************************/
const fetchDefault = async () => {
  try {

   const verificaLocalStorage = JSON.parse(window.localStorage.getItem('tabladefault')) || {};

   // Función para configurar tipo de impuesto según comprobante
   const configurarTipoImpuestoSegunComprobante = (tipoComprobante) => {
     switch (tipoComprobante) {
       case 'FISCAL':
         tipoImpuestoFactura.value = 'AGREGADO';
         break;
       case 'FINAL':
         tipoImpuestoFactura.value = 'INCLUIDO';
         break;
       case 'NORMAL':
       default:
         tipoImpuestoFactura.value = 'NO';
         break;
     }
   };

   if (Object.keys(verificaLocalStorage).length > 0) {
    tabladefault.value = verificaLocalStorage;
    metodoPago.value = tabladefault.value.metodo_pago
    comprobante.value = tabladefault.value.comprobantes
    configurarTipoImpuestoSegunComprobante(tabladefault.value.comprobantes);
   }else{
/*    const response = await peticionesFetch(`${link.value}${api.value}`,`datoscampo/tabladefault/id/1`,{},tokenCifrado.value,'GET');*/
    const response = await peticionesFetchOffline('getDataByField', 'tabladefault','id',1);
    tabladefault.value = response;
    metodoPago.value = tabladefault.value.metodo_pago
    comprobante.value = tabladefault.value.comprobantes
    configurarTipoImpuestoSegunComprobante(tabladefault.value.comprobantes);
    localStorage.setItem('tabladefault', JSON.stringify(response));

   }

  } catch (error) {
    console.error('Error fetching data', error);
    toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to fetch data Default', life: 3000 });
  }
};
const limpiarProductos = ()=>{
  mesaActiva.value = null
  localStorage.removeItem('productosVenta');
  productosVenta.value = [];
  documentoActual.value = 'Factura Nueva';
  documentoEditado.value = null;
  numerodocumentoEditado.value = null;
  clienteSelected.value = allClientes.value.find(client=>client.codigo === '0000000')
  window.localStorage.setItem('clienteLocalStorage',JSON.stringify(clienteSelected.value))
  tipoFactura.value = 'factura'

}

/************************************************************/
const nuevaFactura = ()=>{
  clienteSeleccionado.value = null
  limpiarProductos();
  documentoActual.value = 'Factura Nueva';
  documentoEditado.value = null;
  numerodocumentoEditado.value = null;
  // Resetear comprobante y tipo de impuesto según tabladefault
  const comprobanteDefault = tabladefault.value?.comprobantes || 'NORMAL';
  comprobante.value = comprobanteDefault;
  if (comprobanteDefault === 'FISCAL') {
    tipoImpuestoFactura.value = 'AGREGADO';
  } else if (comprobanteDefault === 'FINAL') {
    tipoImpuestoFactura.value = 'INCLUIDO';
  } else {
    tipoImpuestoFactura.value = 'NO';
  }
}
/************************************************************/
const handleKeydown = (event) => {
  if (event.key === 'F2') {
    visiblecobrar.value = true
  } else if (event.key === 'F1') {
     router.push('/login')
  } else if (event.key === 'F4') {
     guardarFactura()
  } else if (event.key === 'F5') {
     visibleCredito.value = true
     metodoPago.value = 'CREDITO'
  } else if (event.key === 'F6') {
     visibleDescuento.value = true
  } else if (event.key === 'F7') {
     visibleComprobanteRapido.value = true
  } else if (event.key === 'F8') {
   // visiblecliente.value =  true
    fnAgregarCliente()

  } else if (event.key === 'F3') {
    visiblefatcoti.value =  true
  } else if (event.key === 'Delete') {
    limpiarProductos()
  } else if (event.key === 'Escape') {
    loading.value = false;
  }


}

/************************************************************/
watchEffect(async () => {
  if (visiblefatcoti.value) {
    tipodocumento();
    facturaEsCredito.value = false
  }
});
/************************************************************/
const actualizarTokenSoloUso = async()=>{
    tokenSoloUso.value = Math.floor(1000 + Math.random() * 9000).toString();
const datosJSON = await envioElectron('datosarchivo');
  datosJSON.VITE_TOKEN_SOLOUSO = tokenSoloUso.value;
      if(window.electron){
  try {
    const envioDatosJSON = await window.electron.ipcRenderer.invoke('actualizarjson', datosJSON);
     toast.removeAllGroups();
    toast.add({ severity: 'success', summary: 'OK', detail: 'Datos Actualizados', life: 3000 });
  } catch (error) {
    console.error("Error sending data to Electron:", error);
    toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to update data', life: 3000 });
  }
       }else{
         toast.add({ severity: 'error', summary: 'Upps', detail: 'Esta funcion es solo para la aplicacion Desktop', life: 3000 });
     }

}
/************************************************************/
const fetchIntituciones = async () => {
  try {
       const verificaLocalStorage = JSON.parse(window.localStorage.getItem('instituciones')) || [];

   if (verificaLocalStorage.length > 0) {
      intitucionesData.value = verificaLocalStorage;
      intitucionesDataNames.value = verificaLocalStorage.map(intitucion=>intitucion.nombre);
   }else{

/*    const response = await peticionesFetch(
      `${link.value}${api.value}`,
      'datosarraypost',
      { tabla: 'instituciones' },
      tokenCifrado.value,
      'POST'
    );*/
    const response = await peticionesFetchOffline('getDataAsArray', 'instituciones');
/*
   const response = await consultarConWorker({
        tipo: 'consultar',
        payload: {
          endpoint: '/datosarraypost',
          datos: {'tabla':'instituciones'},
          metodo: 'POST'
        }
      });*/

    intitucionesData.value = response;
    intitucionesDataNames.value = response.map(intitucion=>intitucion.nombre);
    localStorage.setItem('instituciones', JSON.stringify(response));

}


  } catch (error) {
    toast.add({ 
      severity: 'error', 
      summary: 'Error', 
      detail: 'Failed to fetch data from intituciones', 
      life: 3000 
    });
  }
};
/************************************************************/
const fetchConfiscal = async () => {
  try {
/*    const response = await peticionesFetch(
      `${link.value}${api.value}`,
      'datosarraypost',
      { tabla: 'confiscal' },
      tokenCifrado.value,
      'POST'
    );*/
    const response = await peticionesFetchOffline('getDataAsArray', 'confiscal');
/*   const response = await consultarConWorker({
        tipo: 'consultar',
        payload: {
          endpoint: '/datosarraypost',
          datos: {'tabla':'confiscal'},
          metodo: 'POST'
        }
      });*/


    confiscalData.value = response;
    //confiscalDataNames.value = response.map(confiscal=>confiscal.name);
    datoscamposComprobantes.value.nfc = response[0]
  } catch (error) {
    toast.add({ 
      severity: 'error', 
      summary: 'Error', 
      detail: 'Failed to fetch data from confiscal', 
      life: 3000 
    });
  }
};
/************************************************************/
const fetchFabricacionDatosarray = async () => {
  try {

       const verificaLocalStorage = JSON.parse(window.localStorage.getItem('marcos')) || [];

   if (verificaLocalStorage.length > 0) {
      fabricacionData.value = verificaLocalStorage;

   }else{
    const response = await peticionesFetchOffline('getDataAsArray', 'marcos');
/*   const response = await consultarConWorker({
        tipo: 'consultar',
        payload: {
          endpoint: '/datosarraypost',
          datos: {'tabla':'marcos'},
          metodo: 'POST'
        }
      });*/
    fabricacionData.value = response;
    localStorage.setItem('marcos', JSON.stringify(response));
}


    //fabricacionDataNames.value = response.map(fabricacion=>fabricacion.nombre);
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to fetch data from marcos',
      life: 3000
    });
  }
};
/************************************************************/
const usuariosDatosarray = async () => {
  try {

   const verificaLocalStorage = JSON.parse(window.localStorage.getItem('usuarios')) || [];
   if (verificaLocalStorage.length > 0) {
const datosArray = [datosEmpresa.usuario.nombre];
const todosLosDatos = verificaLocalStorage.filter(usr => usr.nivel_seguridad === 'Vendedor').map(users => users.nombre);
vendedoresNombre.value = [...datosArray, ...todosLosDatos];

   }else{
    const response = await peticionesFetchOffline('getDataAsArray', 'usuarios');
    localStorage.setItem('usuarios', JSON.stringify(response));
    vendedoresNombre.value = response.filter(usr=>usr.nivel_seguridad === 'Vendedor').map(users=>users.nombre);
}

  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to fetch data from usuarios',
      life: 3000
    });
  }
};
/************************************************************/
//vendedoresNombre
onMounted(async () => {
  actualizarScrollTop();
  const container = posScrollContainer.value;
  if (container) {
    container.addEventListener('scroll', actualizarScrollTop, { passive: true });
  }
  window.addEventListener('scroll', actualizarScrollTop, { passive: true });
  updateIsDesktop();
  window.addEventListener('resize', updateIsDesktop);

//router.push('/ferreteria')

verificaAutentificado(router)

const permitidosArray = ['Administrador', 'Soporte', 'Vendedor', 'Cajero','Gerente'];

if (!permitidosArray.includes(datosEmpresa.usuario.usuario)) {
  if (datosEmpresa.usuario.usuario === 'Tecnico') {
    router.push('/mitaller');
  } else {
    router.push('/login');
  }
}



usuarioLocal.value = datosEmpresa.usuario || {}
datosDefault.value = JSON.parse(window.localStorage.getItem('datosDefault')) || {}
configuracionFactura.value = JSON.parse(window.localStorage.getItem('configuracionfactura')) || {}
barraMenu.value = JSON.parse(window.localStorage.getItem('barramenu')) || []


cajero.value = usuarioLocal.value.nombre
vendedor.value = usuarioLocal.value.nombre

//const datosJSON = await window.electron.ipcRenderer.invoke('datosarchivo');
const datosJSON = await envioElectron('datosarchivo');


link.value = datosJSON.VITE_LINKURL;
api.value = datosJSON.VITE_LINK_API;
token.value = datosJSON.VITE_TOKEN;
linkImpresora.value = datosJSON.VITE_IMPRESORA_LOCAL;
tokenCorto.value = datosJSON.VITE_TOKEN_CORTO;
tokenSoloUso.value = datosJSON.VITE_TOKEN_SOLOUSO;
token24H.value = datosJSON.VITE_TOKEN_24H;

  const sonido = datosJSON.VITE_SOUND;

  if(!sonido){
     sonidoON.value = false;
  }else{
     sonidoON.value = sonido;
  }

if (datosJSON.VITE_CAJERO_ACTIVO === 'true') {
   estadoFN.value = 'Pendiente'
}else{
  estadoFN.value = 'Cobrado'
}


tokenCifrado.value = await encryptarPassword(token.value, 10);
/************************************************************/
worker.value = new Worker(new URL('@/workers/apiWorker.js', import.meta.url), { type: 'module' });

// 1. Configura el worker con la URL base y token
worker.value.postMessage({
  tipo: 'configurar',
  payload: {
    link: link.value,
    api: api.value,
    token: tokenCifrado.value
  }
});

onUnmounted(() => {
  const container = posScrollContainer.value;
  if (container) {
    container.removeEventListener('scroll', actualizarScrollTop);
  }
  window.removeEventListener('scroll', actualizarScrollTop);
  window.removeEventListener('resize', updateIsDesktop);
});


// 2. Recibe la respuesta
worker.value.onmessage = (e) => {
  const { tipo, respuesta, mensaje } = e.data;

  if (tipo === 'listo') {
    console.log('✅ Worker listo');
   // consultarUsuarios(); // puedes llamar la función aquí si quieres

  } else if (tipo === 'resultado') {
    //console.log('📦 Datos recibidos:', respuesta);

  } else if (tipo === 'error') {
    console.error('❌ Error:', mensaje);
  }
};

/************************************************************/

// ⚡ CARGA OPTIMIZADA CON MANEJO DE ERRORES INDEPENDIENTE
// Primero cargamos fetchDefault porque otros dependen de tabladefault.value
try {
  await fetchDefault();
} catch (error) {
  console.error('❌ Error cargando configuración default:', error);
  toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo cargar configuración default', life: 3000 });
}

// Preparar funciones base que siempre se ejecutan
const funcionesBase = [
  { fn: fetchGarantias, nombre: 'Garantías' },
  { fn: fetchCategorias, nombre: 'Categorías' },
  { fn: fetchAndSetupData, nombre: 'Productos' },
  { fn: fetchClientes, nombre: 'Clientes' },
  { fn: usuariosDatosarray, nombre: 'Usuarios' },
  { fn: fetchBanco, nombre: 'Banco' },
  { fn: fetchNotaCredito, nombre: 'Notas de Crédito' },
  { fn: fetchFacturas, nombre: 'Facturas' },
/*  { fn: fetchPreFacturas, nombre: 'Pre-Facturas' },*/
  { fn: fetchventasGuardadas, nombre: 'Ventas Guardadas' },
  { fn: fetchConfiscal, nombre: 'Configuración Fiscal' },
  { fn: fetchIntituciones, nombre: 'Instituciones' }
];

// Agregar funciones condicionales según el modo




// Ejecutar todas las funciones en paralelo con manejo de errores independiente
const resultados = await Promise.allSettled(
  funcionesBase.map(({ fn, nombre }) =>
    fn().catch(error => {
      console.error(`❌ Error cargando ${nombre}:`, error);
      return { error: true, nombre };
    })
  )
);

// Revisar si hubo errores y mostrar resumen
const errores = resultados.filter(r => r.status === 'rejected' || (r.value && r.value.error));
if (errores.length > 0) {
  console.warn(`⚠️ ${errores.length} funciones fallaron al cargar`);
  // Opcionalmente mostrar un toast con las funciones que fallaron
  // toast.add({ severity: 'warn', summary: 'Advertencia', detail: `${errores.length} elementos no se cargaron correctamente`, life: 3000 });
} else {
  console.log('✅ Todas las funciones se cargaron correctamente');
}
 
 const datosConfig = localStorage.getItem('configuracion');
  const ventaArray = localStorage.getItem('productosVenta');
  const metodoPagoArray = localStorage.getItem('metodoPago');

  //nota.value = "¡GRACIAS POR SU COMPRA!"
const notaEncontrada = garantiaArray.value.find(nt => nt.referencia === 'VENTAS');
nota.value = notaEncontrada ? notaEncontrada.garantia : garantiaArray.value[0].garantia;


/********************************************************************************************/
/**************************************AUTOMATICO********************************************/
  if (configuracionFactura.value.automatico == 'True') {
  clienteSelected.value = allClientes.value.find(cliente => cliente.codigo == '0000000');
}
/********************************************************************************************/

  if (datosConfig) {
    datosConfiguracion.value = JSON.parse(datosConfig);
  const printer = {
      'Impresora Ticket':'Termica',
      'Offline':'Termica2',
      'Impresora Normal':'Tinta',
    }
    datosFactCoti.value.impresora = printer[datosConfiguracion.value.tipo_impresora];
    impuestoSistema.value = Number(datosConfiguracion.value.impuesto);
    // tipoImpuestoFactura ahora depende de tabladefault.comprobantes, no de tipo_papel
  } else {
    await fetchDataConfiguracion();

  }
    await fetchDataConfiguracion();
/*-----------------------------------*/
    if (metodoPagoArray) {
    const nProductos = JSON.parse(metodoPagoArray);
    metodoPagoOptions.value = nProductos;
    metodoPagoOptionsNombres.value = metodoPagoOptions.value.map(metodo=>metodo.nombre);
    metodoPagoOptionsNombresApartado.value = metodoPagoOptionsNombres.value.filter(ap=>ap !== 'APARTADO');
   }else{
    await fetchDatametodoPago()
   }
/*-----------------------------------*/
  if (ventaArray) {
    const nProductos = JSON.parse(ventaArray);
    productosVenta.value = nProductos;
    calcularTotalFactura();
     fncambioTipoImpuesto()
  }
/*-----------------------------------*/

/*-----------------------------------*/
   loading.value = false
/*-----------------------------------*/

/*  new Awesomplete(awesompleteprecio.value, {
    list: ["Apple", "Banana", "Cherry", "Date", "Elderberry", "Fig", "Grape", "Honeydew"]
  });*/

window.addEventListener('keydown', handleKeydown)


});

/************************************************************/
const fnResetearCliente = async()=>{
let clienteDefault = allClientes.value.find(cl=>cl.codigo === '0000000');

if(clienteDefault){
   clienteSelected.value = clienteDefault;
}else{
/*   clienteSelected.value = await peticionesFetch(`${link.value}${api.value}`, `datoscampo/clientes/codigo/0000000`, {}, tokenCifrado.value, 'GET');*/
   clienteSelected.value =  await peticionesFetchOffline('getDataByField', 'clientes','codigo','0000000');
}

 toast.removeAllGroups();
toast.add({ severity: 'success', summary: 'Ok', detail: 'Cliente Default Seleccionado', life: 3000 });

}
/************************************************************/
/************************************************************/
const fnVentaPropia = async()=>{
  const clienteDefault = allClientes.value.find(cl=>cl.nombre === datosEmpresa.empresa.nombre);

   if(clienteDefault){
    clienteSelected.value = clienteDefault;
     toast.removeAllGroups();
    toast.add({ severity: 'success', summary: 'Ok', detail: 'Venta Propia', life: 3000 });
  }else{

     try{
        const url = link.value + api.value + "/insertar/clientes";
        const jsonDataC = await arrayToObjetoFromTablaOffline('clientes');

            jsonDataC.nombre = datosEmpresa.empresa.nombre;
            jsonDataC.direccion = datosEmpresa.empresa.direccion;
            jsonDataC.cedula = datosEmpresa.empresa.legal;
            jsonDataC.email = datosEmpresa.empresa.email;
            jsonDataC.codigo = generarCodigoUnico();

    /*    const envioDatos = await enviarDatosPorPost(url, jsonDataC, tokenCifrado.value);*/
        const envioDatos = await peticionesFetchOffline('insertData','clientes', JSON.stringify(jsonDataC));
        if (envioDatos[0] == 'ok') {
            allClientes.value.push(jsonDataC);
            clienteSelected.value = jsonDataC;
        }

     }catch(error){
        toast.add({ severity: 'error', summary: 'Upps', detail: 'No se pudo agregar la empresa', life: 3000 });
     }finally{
         toast.removeAllGroups();
        toast.add({ severity: 'success', summary: 'Ok', detail: 'Venta Propia', life: 3000 });
     }
  }
}
/************************************************************/
const fnAgregarCliente = async () => {
  const { value: option } = await Swal.fire({
    title: '¿Cómo deseas agregar el cliente?',
    html: `
      <div class="flex flex-col space-y-4">
        <button id="cedula" class="option-button bg-blue-500 text-white px-4 py-2 rounded">Buscar por Cédula</button>
        <button id="rnc" class="option-button bg-blue-500 text-white px-4 py-2 rounded">Buscar por RNC</button>
        <button id="manual" class="option-button bg-blue-500 text-white px-4 py-2 rounded">Agregar Manualmente</button>
      </div>
    `,
    showCancelButton: false,
    showConfirmButton: false,
    didOpen: () => {
      document.querySelectorAll('.option-button').forEach(button => {
        button.addEventListener('click', async () => {
          Swal.close();
          await handleOptionSelection(button.id);
        });
      });
    },
    customClass: { title: 'text-lg font-semibold' }
  });
};

const handleOptionSelection = async (option) => {
  let clientData = {};

  const filterUndefined = (obj) =>
    Object.fromEntries(Object.entries(obj).filter(([_, v]) => v !== undefined));

  if (option === 'cedula' || option === 'rnc') {
    const { value: rncValue } = await Swal.fire({
      title: `Ingresa ${option === 'cedula' ? 'la Cédula' : 'el RNC'}`,
      input: 'text',
      inputValidator: (value) => (!value ? `Debes ingresar el ${option === 'cedula' ? 'Cédula' : 'RNC'}` : null),
      customClass: {
        title: 'text-lg font-semibold',
        input: 'mt-4 p-2 border rounded',
        validationMessage: 'text-red-500 text-sm mt-2'
      }
    });

    if (!rncValue) return;

    const loader = $loading.show({ canCancel: true, loader: 'bars' });
    try {
      // 🔹 Buscar en la base local primero
      const verificaLocal = await peticionesFetchOffline('getDataByField', 'clientes', 'cedula', rncValue);
      if (verificaLocal) {
        clientData = verificaLocal;
        clienteSelected.value = verificaLocal;
        loader.hide();
        return;
      }

      // 🔹 Si no existe, consultar API remota
      if (option === 'rnc') {
        const datosRNC = await peticionesFetch(
          window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? '/api2' : 'https://demo.tmposrd.com/api2',
          `consultarrnc/${rncValue}`,
          {},
          tokenCifrado.value,
          'GET'
        );
        if (!datosRNC) {
          toast.add({ severity: 'error', summary: 'Error', detail: 'No se encuentra este RNC', life: 3000 });
          loader.hide();
          return;
        }
        toast.add({ severity: 'success', summary: 'OK', detail: 'Datos encontrados', life: 3000 });
        clientData = {
          ...datosRNC,
          nombrerazon_social: datosRNC.razon_social,
          cedularnc: rncValue
        };
      } else {
        const consulta = await peticionesFetch(
          window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? '/api2' : 'https://demo.tmposrd.com/api2',
          'buscarcedula',
          { cedula: rncValue },
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
        clientData = {
          ...datosCedula,
          nombrerazon_social: `${datosCedula.nombre} ${datosCedula.apellido}`,
          cedularnc: rncValue
        };

      }
    } catch (error) {
      console.error('Error consultando cliente:', error);
    } finally {
      loader.hide();
    }

    // 🔸 Siempre solicitar dirección y teléfono (sin importar Electron)
    const { value: additionalData } = await Swal.fire({
      title: 'Ingresa datos adicionales',
      html: `
        <input id="telefono" class="swal2-input mt-2 p-2 border rounded" placeholder="Teléfono">
        <input id="direccion" class="swal2-input mt-2 p-2 border rounded" placeholder="Dirección">
      `,
      focusConfirm: false,
      preConfirm: () => ({
        telefono: document.getElementById('telefono').value,
        direccion: document.getElementById('direccion').value
      }),
      customClass: {
        title: 'text-lg font-semibold',
        input: 'mt-4',
        validationMessage: 'text-red-500 text-sm mt-2'
      }
    });

    if (additionalData) {
      clientData = { ...clientData, ...additionalData };
    }
  } 
  // 🔹 Agregar cliente manualmente
  else if (option === 'manual') {
    const { value: formValues } = await Swal.fire({
      title: 'Ingresa los datos del cliente',
      html: `
        <input id="nombre" class="swal2-input mt-2 p-2 border rounded" placeholder="Nombre">
        <input id="rnc" class="swal2-input mt-2 p-2 border rounded" placeholder="RNC/CÉDULA">
        <input id="telefono" class="swal2-input mt-2 p-2 border rounded" placeholder="Teléfono">
        <input id="direccion" class="swal2-input mt-2 p-2 border rounded" placeholder="Dirección">
      `,
      focusConfirm: false,
      preConfirm: () => ({
        nombre: document.getElementById('nombre').value.toUpperCase(),
        rnc: document.getElementById('rnc').value,
        telefono: document.getElementById('telefono').value,
        direccion: document.getElementById('direccion').value
      })
    });
    if (formValues) clientData = formValues;
  }

  // 🧩 Procesar datos finales y guardar
  clientData.optionSelected = option;

  if (!clientData || clientData.error) {
    toast.add({ severity: 'error', summary: 'Error', detail: 'No se encontraron los datos', life: 3000 });
    return;
  }

  const url = `${link.value}${api.value}/insertar/clientes`;
  const jsonDataC = await arrayToObjetoFromTablaOffline('clientes');

  // 🔹 Estandarizar datos según el tipo
  if (clientData.optionSelected === 'rnc') {
    jsonDataC.nombre = clientData.nombrerazon_social;
    jsonDataC.direccion = clientData.direccion || clientData.administracion_local;
    jsonDataC.cedula = clientData.cedularnc;
    jsonDataC.rnc = clientData.cedularnc;
    jsonDataC.codigo = clientData.cedularnc;
  } else if (clientData.optionSelected === 'cedula') {
    jsonDataC.nombre = clientData.name || clientData.nombrerazon_social;
    jsonDataC.direccion = clientData.direccion;
    jsonDataC.telefono = clientData.telefono;
    jsonDataC.cedula = clientData.cedularnc;
    jsonDataC.rnc = clientData.cedularnc;
    jsonDataC.codigo = clientData.cedularnc;
  } else {
    jsonDataC.nombre = clientData.nombre;
    jsonDataC.rnc = clientData.rnc;
    jsonDataC.cedula = clientData.rnc;
    jsonDataC.telefono = clientData.telefono;
    jsonDataC.direccion = clientData.direccion;
    jsonDataC.codigo = generarCodigoUnico();
  }

  jsonDataC.precio_fijado = 'Normal';
  jsonDataC.almacen = datosEmpresa.empresa.nombre;

  const filteredJsonDataC = filterUndefined(jsonDataC);

  const envioDatos = await peticionesFetchOffline('insertData', 'clientes', JSON.stringify(filteredJsonDataC));
  if (envioDatos[0] === 'ok') {
    allClientes.value.push(filteredJsonDataC);
    clienteSelected.value = filteredJsonDataC;
  }
};


/**********************************************************************/
watch(() => visibleConduce.value, async(newValue) => {
  if (newValue) {
    if (datosFactCoti.value.tipo !== 'Factura') {
      toast.add({
        severity: 'error',
        summary: 'Error',
        detail: 'No es una Factura',
        life: 3000
      });
      visibleConduce.value = false;
      return;
    }

/*   const verificaFacturaConduce = await peticionesFetch(`${link.value}${api.value}`,`datoscampo/conduce/no_factura/${datosFactCoti.value.numero}`,{},tokenCifrado.value,'GET');*/
   const verificaFacturaConduce = await peticionesFetchOffline('getDataByField', 'conduce','no_factura',datosFactCoti.value.numero);


    if(verificaFacturaConduce){
        toast.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Ya existe in conduce para esta Factura',
        life: 3000
      });
      visibleConduce.value = false;
      return
    }


  //const ultimoConduce = await peticiones(`${link.value}${api.value}/datosmax`, {"tabla":'conduce',"campo":'no_conduce'},'POST',tokenCifrado.value);

  //const numeroConduce = generadorCodigo(ultimoConduce[0], '', 7);
  const numeroConduce = generarCodigoUnico()


  const datosfact = allFacturasFull.value.find(fact => fact.no_factura === datosFactCoti.value.numero);
    if (datosfact) {
      const productosFact = JSON.parse(datosfact.productos);
      const clienteSelected = allClientes.value.find(client=>client.codigo === datosfact.cod_cliente)
      if(!clienteSelected){
        clienteSelected.codigo = datosfact.cod_cliente
        clienteSelected.nombre = datosfact.nombre_cliente
        clienteSelected.direccion = ''
      }
      
const propProductos = productosFact.map(prods => {
  const retorno = {
    codigo: prods.codigo,
    nombre: prods.nombre,
    cantidad: prods.cantidad,
    impuestos: prods.impuestos,
    precio: prods.precio_venta,
    total: prods.total,
    estado: 'NO ENTREGADO',
  };
  return retorno;
});

      if (datoscamposConduce.value.entrega !== 'TOTAL' || datoscamposConduce.value.total !== datosfact.total) {
        datoscamposConduce.value.no_conduce = numeroConduce;
        datoscamposConduce.value.no_factura = datosfact.no_factura;
        datoscamposConduce.value.cod_cliente = clienteSelected.codigo;
        datoscamposConduce.value.cliente = clienteSelected.nombre;
        datoscamposConduce.value.direccion = clienteSelected.direccion;
        datoscamposConduce.value.entrega = 'TOTAL';
        datoscamposConduce.value.placa = 'N/A';
        datoscamposConduce.value.chofer = 'N/A';
        datoscamposConduce.value.fecha = datosfact.fecha_emision;
        datoscamposConduce.value.vencimiento = agregarDiasAFecha(datosfact.fecha_emision,30);
        datoscamposConduce.value.total = datosfact.total;
        datoscamposConduce.value.productos = propProductos;
      }

    }
 

  }
});
/**********************************************************************/
const enviarDatosConduce = async()=>{

    let camposConduce = await arrayToObjetoFromTablaOffline('conduce');

      const url = link.value+api.value+"/insertar/conduce";
     datoscamposConduce.value.created_at = nfecha('timestamp')
     datoscamposConduce.value.updated_at = nfecha('timestamp')
     
     datoscamposConduce.value.productos = JSON.stringify(datoscamposConduce.value.productos)

     camposConduce = {...datoscamposConduce.value}
     camposConduce.almacen = datosEmpresa.empresa.nombre

/*  const envioDatos = await enviarDatosPorPost(url, camposConduce,tokenCifrado.value);*/
  const envioDatos = await peticionesFetchOffline('insertData','conduce', JSON.stringify(camposConduce));
  if (envioDatos[0] == 'ok') {
      toast.add({
        severity: 'success',
        summary: 'OK',
        detail: 'Conduce Creado Exitosamente',
        life: 3000
      });
    visibleConduce.value = false;

  }

}
/**********************************************************************/
/************************************************************/
const revisaSiFacturaEditar = ()=>{
  if (numerodocumentoEditado.value) {
      nuevaFactura()
  }
}
/************************************************************/
onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
  revisaSiFacturaEditar()
})
/************************************************************/
const fnimpresionFactura = async()=>{
      const factura  = numerodocumentoEditado.value;
    if (!factura) {
      toast.add({ severity: 'error', summary: 'Error', detail: 'Debe seleccionar un documento para imprimir', life: 3000 });
      return
    }
      if (datosFactCoti.value.tipo == 'Pre-Factura' || documentoActual.value.startsWith('Pre-Factura')) {
        // Imprimir Pre-Factura
        const datosEmpresaA = JSON.stringify(enviarDatosLocalStorage())
        if(window.electron){
          // Obtener datos de la pre-factura
          const datosPreFactura = await peticionesFetchOffline('getDataByField', 'pre_facturas', 'no_factura', factura);
          if (datosPreFactura) {
            const datosCliente = await peticionesFetchOffline('getDataByField', 'clientes', 'codigo', datosPreFactura.cod_cliente);
            const clienteLimpio = {
              codigo: datosCliente?.codigo || '',
              nombre: datosCliente?.nombre || datosPreFactura.cliente,
              direccion: datosCliente?.direccion || '',
              rnc: datosCliente?.rnc || '',
              email: datosCliente?.email || ''
            };

            // Preguntar al usuario qué formato desea
            const { value: formato } = await Swal.fire({
              title: '¿Cómo deseas ver la Pre-Factura?',
              text: 'Ambas opciones se abrirán en PDF para que puedas imprimir o descargar',
              icon: 'question',
              showDenyButton: true,
              showCancelButton: true,
              confirmButtonText: 'Ticket (80mm)',
              denyButtonText: 'Carta (A4)',
              cancelButtonText: 'Cancelar'
            });

            if (formato === true) {
              // Ticket 80mm
              await window.electron.ipcRenderer.invoke('ticketprefactura', JSON.stringify(datosPreFactura), datosEmpresaA);
            } else if (formato === false) {
              // Carta A4
              await window.electron.ipcRenderer.invoke('prefacturaPDF', JSON.stringify(datosPreFactura), JSON.stringify(clienteLimpio), datosEmpresaA);
            }
          } else {
            toast.add({ severity: 'error', summary: 'Error', detail: 'No se encontró la pre-factura', life: 3000 });
          }
        }else{
          toast.add({ severity: 'error', summary: 'Upps', detail: 'Esta funcion es solo para la aplicacion Desktop', life: 3000 });
        }
    }else if (datosFactCoti.value.tipo == 'Factura') {
     if (datosFactCoti.value.impresora == 'Termica') {

         var impresionpagina = link.value+'/vista/impresoratermica.php?factura='+factura;
        // window.electron.ipcRenderer.invoke('open-new-window', impresionpagina, 'url', true,false);

         const datosEmpresaB = JSON.stringify(enviarDatosLocalStorage() )

      if(window.electron){
        window.electron.ipcRenderer.invoke('ticket',factura,datosEmpresaB);
       }else{
         toast.add({ severity: 'error', summary: 'Upps', detail: 'Esta funcion es solo para la aplicacion Desktop', life: 3000 });
     }


     }else if(datosFactCoti.value.impresora == 'Termica2'){
          var impresionpagina = link.value+'/receipt/factura?factura='+factura;
      if(window.electron){
          window.electron.ipcRenderer.invoke('open-new-window', impresionpagina,'url',false,true,false)
       }else{
         toast.add({ severity: 'error', summary: 'Upps', detail: 'Esta funcion es solo para la aplicacion Desktop', life: 3000 });
     }
     } else{
      var impresionpagina = link.value+'/receipt/factura.php?factura='+factura;
      if(window.electron){
      window.electron.ipcRenderer.invoke('open-new-window', impresionpagina,'url',false,true,false)
       }else{
         toast.add({ severity: 'error', summary: 'Upps', detail: 'Esta funcion es solo para la aplicacion Desktop', life: 3000 });
     }
     }
    }else{

     if (datosFactCoti.value.impresora == 'Termica') {
         // var impresionpagina = link.value+'/receipt/factura?cotizacion='+factura;
          var impresionpagina = link.value+'/vista/impresoratermica.php?cotizacion='+factura;
         // window.electron.ipcRenderer.invoke('open-new-window', impresionpagina, 'url', true,false);

         const datosEmpresa = JSON.stringify(enviarDatosLocalStorage() )
      if(window.electron){
         window.electron.ipcRenderer.invoke('ticketcotizacion',factura,datosEmpresa);
       }else{
         toast.add({ severity: 'error', summary: 'Upps', detail: 'Esta funcion es solo para la aplicacion Desktop', life: 3000 });
     }

     }else{
         var impresionpagina = link.value+'/receipt/factura.php?cotizacion='+factura;
      if(window.electron){
          window.electron.ipcRenderer.invoke('open-new-window', impresionpagina,'url',false,true)
       }else{
         toast.add({ severity: 'error', summary: 'Upps', detail: 'Esta funcion es solo para la aplicacion Desktop', life: 3000 });
     }
     }


    }
}
/************************************************************/
/*
    datosFactCoti.value.tipo = 'Cotizacion'
    datosFactCoti.value.impresora = 'Tinta'
    datosFactCoti.value.numero = noFacturaFN.value
    visiblePrint.value = true
 */
//imrpesion de facturas
const impresionFactura = async()=>{


    const factura  = datosFactCoti.value.numero;
visiblePrint.value = true

return
    if (factura == '') {
      toast.add({ severity: 'error', summary: 'Error', detail: 'Debe seleccionar un documento para imprimir', life: 3000 });
      return
    }
      if (datosFactCoti.value.tipo == 'Factura') {
     if (datosFactCoti.value.impresora == 'Termica') {
          var impresionpagina = link.value+'/vista/impresoratermica.php?factura='+factura;
         //window.electron.ipcRenderer.invoke('open-new-window', impresionpagina, 'url', true,false);

      if(window.electron){
         const datosEmpresa = JSON.stringify(enviarDatosLocalStorage() )
         const datosFactura = allFacturasFull.value.find(fact=>fact.no_factura === factura)
         const datosCliente = allClientes.value.find(cl=>cl.codigo === datosFactura.cod_cliente)

        window.electron.ipcRenderer.invoke('ticket',JSON.stringify(datosFactura),JSON.stringify(datosCliente),datosEmpresa);
       }else{
       var impresionpagina = link.value+'/receipt/factura?factura='+factura;
       visiblefatcoti.value = false
       Swal.fire({
        html: '<iframe src="' + impresionpagina + '" width="100%" height="600" style="border: none;"></iframe>',
        confirmButtonText: 'Cerrar',
        showCloseButton: true
       });

     }




     }else if(datosFactCoti.value.impresora == 'Termica2'){
          var impresionpagina = link.value+'/receipt/factura?factura='+factura;
      if(window.electron){
          window.electron.ipcRenderer.invoke('open-new-window', impresionpagina,'url',false,true,false)
       }else{
       var impresionpagina = link.value+'/receipt/factura?factura='+factura;
       visiblefatcoti.value = false
        Swal.fire({
        html: '<iframe src="' + impresionpagina + '" width="100%" height="600" style="border: none;"></iframe>',
        confirmButtonText: 'Cerrar',
        showCloseButton: true
       });
     }
     } else{
      var impresionpagina = link.value+'/receipt/factura.php?factura='+factura;
      if(window.electron){
      window.electron.ipcRenderer.invoke('open-new-window', impresionpagina,'url',false,true,false)
       }else{
        visiblefatcoti.value = false
        Swal.fire({
        html: '<iframe src="' + impresionpagina + '" width="100%" height="600" style="border: none;"></iframe>',
        confirmButtonText: 'Cerrar',
        showCloseButton: true
       });
     }
     }
    }else{

     if (datosFactCoti.value.impresora == 'Termica') {
         // var impresionpagina = link.value+'/receipt/factura?cotizacion='+factura;
          var impresionpagina = link.value+'/vista/impresoratermica.php?cotizacion='+factura;
         // window.electron.ipcRenderer.invoke('open-new-window', impresionpagina, 'url', true,false);

      if(window.electron){
         const datosEmpresa = JSON.stringify(enviarDatosLocalStorage() )
        window.electron.ipcRenderer.invoke('ticketcotizacion',factura,datosEmpresa);
       }else{
        visiblefatcoti.value = false
      Swal.fire({
        html: '<iframe src="' + impresionpagina + '" width="100%" height="600" style="border: none;"></iframe>',
        confirmButtonText: 'Cerrar',
        showCloseButton: true
       });
     }


     }else{
         var impresionpagina = link.value+'/receipt/factura.php?cotizacion='+factura;
      if(window.electron){
          window.electron.ipcRenderer.invoke('open-new-window', impresionpagina,'url',false,true)
       }else{
       visiblefatcoti.value = false
        Swal.fire({
        html: '<iframe src="' + impresionpagina + '" width="100%" height="600" style="border: none;"></iframe>',
        confirmButtonText: 'Cerrar',
        showCloseButton: true
       });
     }
     }


    }
}
/************************************************************/

const search = (event) => {
  const query = event.query.toLowerCase();
  if (searchMode.value === 'nombre') {
    filteredItems.value = items.value.filter(item =>
      item.nombre.toLowerCase().includes(query)
    );
  } else if (searchMode.value === 'barcode') {
    filteredItems.value = items.value.filter(item =>
      item.codigo_barra.toLowerCase().includes(query)
    );
  } else if (searchMode.value === 'codigo') {
    filteredItems.value = items.value.filter(item =>
      item.codigo.toLowerCase().includes(query)
    );
  }
};
/************************************************************/
const agregarProductoSeleccionado = () => {
  if (productoSeleccionado.value.codigo) {

    const productoExistente = productosVenta.value.find(prod => prod.codigo === productoSeleccionado.value.codigo);
    if (productoExistente) {
      productoExistente.cantidad += 1;
    } else {
      productoSeleccionado.value.cantidad = 1
      productoSeleccionado.value.descuento = 0.00
      delete productoSeleccionado.otro

      const selectedMetodo = metodoPagoOptions.value.find(m => m.nombre === metodoPago.value)
      const pct = Number(selectedMetodo?.porcentaje || 0)
      const metodoActual = String(metodoPago.value || '').toUpperCase()
      const aplicaRecargoTarjeta = metodoActual === 'TARJETA' || metodoActual === 'TARJETA CUOTA'
      if (pct > 0 && aplicaRecargoTarjeta) {
        const impuestoVenta = Number(productoSeleccionado.value.impuesto_venta || 0)
        const precioBase = Number(productoSeleccionado.value.precio_real ?? productoSeleccionado.value.precio_venta ?? 0)
        const nuevoPrecioVenta = Number((precioBase * (1 + pct / 100)).toFixed(2))
        productoSeleccionado.value.precio_real = precioBase
        productoSeleccionado.value.porcentaje = pct
        productoSeleccionado.value.precio_venta = nuevoPrecioVenta
        productoSeleccionado.value.precio_final = Number((nuevoPrecioVenta + impuestoVenta).toFixed(2))
      }

      productosVenta.value.push(productoSeleccionado.value);
    }
    calcularTotalFactura();
     fncambioTipoImpuesto()
    value.value = ''; // Limpiar el campo de búsqueda
    productoSeleccionado.value = {}; // Limpiar el producto seleccionado temporal
  }
};

/************************************************************/
const selectFirstSuggestion = (event) => {
  if (event.key === 'Enter' && filteredItems.value.length > 0) {
    const firstSuggestion = filteredItems.value[0];

    const datos = productosArray.value.find(prod => prod.codigo === firstSuggestion.value);
    productoSeleccionado.value = datos;
    agregarProductoSeleccionado();
  }
};
/************************************************************/
const handleSelect = (e) => {
  toast.add({ severity: 'info', summary: 'Item Selected', detail: `You selected ${e.label}`, life: 3000 });

};

/************************************************************/
const verificaVentaProceso = async()=>{
     if (clienteSeleccionado.value) {
        const datosVentaproceso = ventasGuardadas.value.find(venta=>venta.cod_cliente === clienteSeleccionado.value)
        datosVentaproceso.productos = JSON.stringify(productosVenta.value)
/*        const envio = await peticionesFetch(`${link.value}${api.value}`,`actualizarcampos/ventasenproceso`,datosVentaproceso,tokenCifrado.value,'POST');*/
        const envio = await peticionesFetchOffline('updateData','ventasenproceso', JSON.stringify(datosVentaproceso));

        if (envio[0] == 'ok') {
          await fetchventasGuardadas();
        }

    }

}
/************************************************************/
const handleChange = (newValue) => {

/*console.log(numero.value)
console.log(tipo.value)*/


/***************************************************/
  //Verifica la existencia de factura
/***************************************************/

  const productoExistente = productosVenta.value.find(prod => prod.codigo === newValue.codigo);
  if (productoExistente) {
    productoExistente.cantidad += 1;
  } else {
    const producto = productosArray.value.find(prod => prod.codigo === newValue.codigo);
    if (producto) {
      delete producto.otro

      const selectedMetodo = metodoPagoOptions.value.find(m => m.nombre === metodoPago.value)
      const pct = Number(selectedMetodo?.porcentaje || 0)
      const metodoActual = String(metodoPago.value || '').toUpperCase()
      const aplicaRecargoTarjeta = metodoActual === 'TARJETA' || metodoActual === 'TARJETA CUOTA'
      const impuestoVenta = Number(producto.impuesto_venta || 0)
      const precioBaseNuevo = Number(producto.precio_real ?? producto.precio_venta ?? producto.precio ?? 0)
      const nuevoPrecioVenta = pct > 0 && aplicaRecargoTarjeta
        ? Number((precioBaseNuevo * (1 + pct / 100)).toFixed(2))
        : precioBaseNuevo
      const nuevoPrecioFinal = Number((nuevoPrecioVenta + impuestoVenta).toFixed(2))

      productosVenta.value.push({
        ...producto,
        cantidad: 1,
        descuento: producto.descuento ? producto.descuento : 0,
        precio_venta: nuevoPrecioVenta,
        precio_final: nuevoPrecioFinal,
        precio_real: pct > 0 && aplicaRecargoTarjeta ? precioBaseNuevo : null,
        porcentaje: pct > 0 && aplicaRecargoTarjeta ? pct : 0,
      });
    }
  }
  calcularTotalFactura();
   fncambioTipoImpuesto()
  value.value = ''; // Limpiar el campo de búsqueda

if (numerodocumentoEditado.value && numerodocumentoEditado.value !='') {
    if (documentoEditado.value == 'Factura') {
        actualizarFactura()
    }
}

};
/************************************************************/
const calcularDescuento = (producto) => {
  return Number(producto.descuento) || 0;
};
/************************************************************/

const calcularImpuesto = (producto) => {
  // Si no hay impuesto, retornar 0
  const impuestoPorcentaje = Number(producto.impuestos) || 0;
  if (!impuestoPorcentaje) return 0;

  // Usar el impuesto ya calculado por producto (impuesto_venta)
  const cantidad = Number(producto.cantidad) || 1;
  const impuestoUnitario = Number(producto.impuesto_venta) || 0;

  return (impuestoUnitario * cantidad).toFixed(2);
};


/************************************************************/

const verificaComoVaElImpuesto = (producto) => {
  const precioVenta = Number(producto.precio_venta) || 0;
  const precioFinal = Number(producto.precio_final) || 0;
  const impuestoPorcentaje = Number(producto.impuestos) || 0;

  if (impuestoPorcentaje && precioVenta === precioFinal) {
    // Impuesto incluido
   // const precioBase = Math.round(precioVenta / (1 + (impuestoPorcentaje / 100)));
    const precioBase = (precioVenta / (1 + (impuestoPorcentaje / 100)));
    producto.precio_base = precioBase.toFixed(2);
    producto.precio_venta = precioBase.toFixed(2); // Precio a mostrar es el base sin impuesto
    producto.precio_final = (precioBase * (1 + (impuestoPorcentaje / 100))).toFixed(2); // Precio final con impuesto incluido
  } else if (impuestoPorcentaje && precioFinal > precioVenta) {
    // Impuesto agregado
   // const precioFinalConImpuesto = Math.round(precioVenta * (1 + (impuestoPorcentaje / 100)));
    const precioFinalConImpuesto = (precioVenta * (1 + (impuestoPorcentaje / 100)));
    producto.precio_final = precioFinalConImpuesto.toFixed(2);
    producto.precio_base = precioVenta.toFixed(2); // Precio a mostrar es el precio de venta
  } else {
    // Sin impuesto
    producto.precio_base = precioVenta.toFixed(2);
    producto.precio_final = precioVenta.toFixed(2);
  }
};


/************************************************************/
//gananciaFN
/*const calcularGanancias = (producto) => {

  const datosProd = productosArray.value.find(prod => prod.codigo == producto.codigo);

  const precioVenta = Number(producto.precio_venta) || 0;
  const precioCompra = Number(producto.precio_compra) || (datosProd ? Number(datosProd.precio_compra) : 0) || 0;
  const cantidad = Number(producto.cantidad) || 0;
  //const calculo = Math.round((precioVenta - precioCompra) * cantidad);
  const calculo = ((precioVenta - precioCompra) * cantidad);
  return calculo;
};*/

const calcularGanancias = (producto) => {
  // Buscar el producto en productosArray por su código
  const datosProd = productosArray.value ? productosArray.value.find(prod => prod.codigo == producto.codigo) : null;

  // Convertir precio_venta y precio_compra a número, y manejar valores por defecto
  const precioVenta = Number(producto.precio_venta) || 0;
  const precioCompra = Number(producto.precio_compra) || (datosProd ? Number(datosProd.precio_compra) : 0) || 0;
  const cantidad = Number(producto.cantidad) || 0;

  // Calcular la ganancia
  const calculo = Math.round((precioVenta - precioCompra) * cantidad); // usando redondeo
  //console.log("calculo", calculo);
  
  return calculo;
};


/************************************************************/
const calcularTotal = (producto) => {
  // Usar precio_final que ya incluye el impuesto calculado
  const cantidad = Number(producto.cantidad) || 1;
  const descuento = Number(producto.descuento) || 0;
  const precioFinal = Number(producto.precio_final) || 0;

  const total = (precioFinal * cantidad) - descuento;

  return total;
};


/************************************************************/
const visiblepreciomodal = (producto) => {
  visibleprecio.value = true;
};

/************************************************************/
const calcularGananciaReal = () => {
  let gananciaPura = 0;

  productosVenta.value.forEach(producto => {
    const nombre = (producto.nombre || "").toUpperCase();

    if (
      nombre.includes("DESCUENTO") ||
      nombre.includes("DELIVERY")
    ) {
      return; // Saltar este producto
    }

    const precioVenta = parseFloat(producto.precio_venta) || 0;
    const precioCompra = parseFloat(producto.precio_compra) || 0;
    const cantidad = parseFloat(producto.cantidad) || 0;

    const calculo = (precioVenta - precioCompra) * cantidad;
    gananciaPura += calculo;
  });

  return gananciaPura;
};

/************************************************************/
let recalculando = false;

const calcularTotalFactura = async () => {
  if (recalculando) return;
  recalculando = true;

  let totalN = 0;
  let impuestosN = 0;
  let descuentoN = 0;
  let ganancias = 0;
  cantidadProductosLocal.value = 0;

  productosVenta.value.forEach(producto => {
    totalN += Number(calcularTotal(producto)) || 0;
    if (producto.nombre != 'DESCUENTO' && producto.nombre != 'DESCUENTO APLICADO') {
      impuestosN += Number(calcularImpuesto(producto)) || 0;
    }
    descuentoN += Number(calcularDescuento(producto)) || 0;
    ganancias += Number(calcularGanancias(producto)) || 0;
    cantidadProductosLocal.value += parseFloat(producto.cantidad);
    producto.total = parseFloat(producto.cantidad) * parseFloat(producto.precio_final);
  });

  totalfactura.value = totalN;
  total.value = totalN.toFixed(2);
  impuesto.value = impuestosN.toFixed(2);
  descuento.value = descuentoN.toFixed(2);
  gananciaFN.value = calcularGananciaReal();
  subtotal.value = (totalN - descuentoN - impuestosN).toFixed(2);
  pagaCon.value = total.value;
  localStorage.setItem('productosVenta', JSON.stringify(productosVenta.value));

  if (clienteSeleccionado.value) {
    crearventaProceso();
  }

  if (mesaActiva.value) {
    agregarProductosAmesa(mesaActiva.value);
  }


  abonoCREDITO.value = '0.00';
  montoCREDITO.value = total.value;
  saldoCREDITO.value = total.value;

  // Evitar recursión infinita
  setTimeout(() => {
    recalculando = false;
  }, 0);

  if (documentoEditado.value === 'Factura') await actualizarFactura();
};


/************************************************************/
// Calcula las opciones de descuento según el total
const calcularOpcionesDescuento = (total) => {
  const opciones = [];
  const intervalo = 5; // Intervalos de 5 para los descuentos

  for (let i = 1; i <= 3; i++) {
    opciones.push(redondearAlIntervaloInferior(total - i * intervalo, intervalo));
  }

  return opciones;
};

// Redondea el total al intervalo inferior más cercano
const redondearAlIntervaloInferior = (valor, intervalo) => {
  return Math.floor(valor / intervalo) * intervalo;
};

// Calcula las opciones de descuento basadas en el total de la factura
const opcionesDescuento = computed(() => calcularOpcionesDescuento(totalfactura.value));

// Calcula el descuento requerido para llegar al nuevo total
const descuentoRequerido = (nuevoTotal) => {
  return (totalfactura.value - nuevoTotal).toFixed(2);
};
/************************************************************/
const editarProducto = (producto) => {

if(datosDefault.value.modo ==='FERRETERIA'){

  const copiaProducto = { ...producto }; 
nombreProductFerreteria.value = copiaProducto.nombre
empaqueProductFerreteria.value = copiaProducto.empaque
cantidadProductoBuscado.value = 1
precioProductFerreteria.value = copiaProducto.precio_venta

datosProductoSeleccionadoPrincipal.value = copiaProducto
    preciosArrayFerreteria.value = [
      copiaProducto.precio_venta,
      copiaProducto.precio_min,
      copiaProducto.precio_xmayor,
    ];

  const index = productosVenta.value.findIndex(prod => prod.codigo === producto.codigo);

  if (index !== -1) {
    eliminarProducto(index); // Llamar a la función eliminarProducto con el índice encontrado
  } else {
    console.error('Producto no encontrado en productosVenta.value');
  }
    


    const siguienteRef = "cantidadNN"
    const nextField = document.getElementById(siguienteRef);
    if (nextField) {
      nextField.focus();  // Mover el foco al siguiente campo
    } else {
      console.warn(`El campo con ID '${siguienteRef}' no se encontró.`);
    }

}else{
  //const producto = productosVenta.value.find(prod => prod.codigo === codigo);
  if (producto) {
    const total = (calcularTotal(producto) / producto.cantidad);
    producto.total = total;
    productoSeleccionado.value = { ...producto };

    productoSeleccionado.value.simboloporcentaje = producto.impuestos

    if (usuarioLocal.value.usuario === 'Administrador' || usuarioLocal.value.usuario === 'Soporte' || usuarioLocal.value.usuario === 'Gerente') {
      visibleprecio.value = true;
    } else {
      Swal.fire({
        title: 'Ingrese la contraseña',
        input: 'password',
        inputPlaceholder: 'Contraseña',
        showCancelButton: true,
        confirmButtonText: 'Enviar',
        cancelButtonText: 'Cancelar'
      }).then((result) => {
        if (result.isConfirmed) {
          const contrasenaIngresada = result.value;
          if (contrasenaIngresada === token.value || contrasenaIngresada === tokenCorto.value || contrasenaIngresada === tokenSoloUso.value || contrasenaIngresada === token24H.value) {
            visibleprecio.value = true;
          } else {
            Swal.fire({
              icon: 'error',
              title: 'Contraseña incorrecta',
              text: 'La contraseña ingresada es incorrecta.'
            });
          }
        }
      });
    }
  }

}


};
/************************************************************/
const eliminarProducto = async(index) => {
  const url = link.value+api.value+"/actualizarcampos/productos";
const datosProductoIndex = productosVenta.value[index];
//const datosProducto = productosArray.value.find(prod=>prod.codigo === datosProductoIndex.codigo);
/*const datosProducto = await peticionesFetch(`${link.value}${api.value}`,`datoscampo/productos/codigo/${datosProductoIndex.codigo}`,{},tokenCifrado.value,'GET');*/
const datosProducto = await peticionesFetchOffline('getDataByField', 'productos','codigo_interno',datosProductoIndex.codigo);

if (datosProducto) {
    datosProducto.stock = (Number(datosProducto.stock) + datosProductoIndex.cantidad)


}

  productosVenta.value.splice(index, 1);
    if (documentoEditado.value == 'Factura') {
/*        const envioDatos = await enviarDatosPorPost(url, datosProducto,tokenCifrado.value);*/
        const envioDatos = await peticionesFetchOffline('updateData','productos', JSON.stringify(datosProducto));
        await actualizarFactura();
        await fetchAndSetupData()
    }
  calcularTotalFactura();
   fncambioTipoImpuesto()

    if (clienteSeleccionado.value) {
      crearventaProceso()
   }

  if (mesaActiva.value) {
      agregarProductosAmesa(mesaActiva.value)
   }

};

/************************************************************/
/************************************************************/

const fmImpuestoIncluido = async(codigo, idUnicoImei = null) => {
  // Buscar por id_unico_imei si está disponible, sino por código
  const producto = productosVenta.value.find(prod => {
    if (idUnicoImei && prod.id_unico_imei) {
      return prod.id_unico_imei === idUnicoImei;
    }
    return prod.codigo === codigo && !prod.id_unico_imei;
  });
  if (!producto) return;

  // Usar impuesto del sistema
  const impuesto = impuestoSistema.value;

  // Verificar si ya tiene el impuesto incluido correctamente
  if (producto.tipo_impuesto === 'Incluido') {
    return;
  }

  // Usar precio original si existe, sino el precio_venta actual
  const precioOriginal = Number(producto.precio_venta_original || producto.precio_venta);

  // Guardar precio original si no existe
  if (!producto.precio_venta_original) {
    producto.precio_venta_original = precioOriginal;
  }

  // Guardar impuesto original si no existe
  if (producto.impuestos_original === undefined) {
    producto.impuestos_original = Number(producto.impuestos || 0);
  }

  // Calcular precio base sin impuesto (desglosando el precio total)
  // Fórmula: precio_base = precio_total / (1 + tasa_impuesto)
  const precioBase = precioOriginal / (1 + impuesto / 100);
  const montoImpuesto = precioOriginal - precioBase;

  // Actualizar producto con impuesto incluido (SIN cambiar el precio final)
  producto.impuestos = impuesto;
  producto.impuesto = montoImpuesto.toFixed(2);
  producto.impuesto_venta = montoImpuesto.toFixed(2);
  producto.precio_venta = precioBase.toFixed(2);
  producto.precio_final = precioOriginal; // Mantener el precio total original
  producto.tipo_impuesto = 'Incluido';
};

/*********************************************************/

const fnMasImpruesto = (codigo)=>{
   const producto = productosVenta.value.find(prod => prod.codigo === codigo);
   productoSeleccionado.value = producto
   productoSeleccionado.value.simboloporcentaje = "1"
   productoSeleccionado.value.impuestos = "18"
   comoVaElImpuesto.value = 'Agregado';
   fncomoImpuesto()
}

/*********************************************************/

const fnPrecioNormal = async(codigo)=>{
   if(!codigo) return;

   const productoNormal = await peticionesFetchOffline('getDataByField', 'productos','codigo',codigo);

   const producto = productosVenta.value.find(prod => prod.codigo === codigo);
   if (!producto) return; // Si no encuentra el producto en el carrito, salir

   productoSeleccionado.value = producto
  const index = productosVenta.value.findIndex(prod => prod.codigo === productoSeleccionado.value.codigo);
  if (index !== -1) {
    const copiaProductoActual = { ...productosVenta.value[index] };
   if(productoNormal && productoNormal.precio_venta){
    // Solo actualizar si el producto de la BD tiene precio válido
    const precioNormalBD = parseFloat(productoNormal.precio_venta);
    if (precioNormalBD > 0) {
      productoNormal.cantidad = productoSeleccionado.value.cantidad
      productoNormal.descuento = productoSeleccionado.value.descuento
      productoNormal.precio_venta = precioNormalBD;
      productoNormal.precio_final = parseFloat(productoNormal.precio_final) > 0
        ? productoNormal.precio_final
        : copiaProductoActual.precio_final;

      productosVenta.value[index] = { ...productoNormal };

      // 🔵 Restaurar el nombre modificado
      productosVenta.value[index].nombre = copiaProductoActual.nombre;
      // Preservar el total si ya existe
      if (copiaProductoActual.total > 0) {
        productosVenta.value[index].total = copiaProductoActual.total;
      }
    }
   }

    calcularTotalFactura();
    fncambioTipoImpuesto()
  }

}



const fnPrecioMinimo = async(codigo)=>{
   if(!codigo) return;

   const productoNormal = await peticionesFetchOffline('getDataByField', 'productos','codigo',codigo);

   const producto = productosVenta.value.find(prod => prod.codigo === codigo);
   productoSeleccionado.value = producto
  const index = productosVenta.value.findIndex(prod => prod.codigo === productoSeleccionado.value.codigo);
  if (index !== -1) {
    const copiaProductoActual = { ...productosVenta.value[index] };
    productoNormal.cantidad = productoSeleccionado.value.cantidad
    productoNormal.precio_venta = productoNormal.precio_min
    productoNormal.precio_final = productoNormal.precio_min
    productoNormal.descuento = productoSeleccionado.value.descuento
    productosVenta.value[index] = { ...productoNormal };

    // 🔵 Restaurar el nombre modificado
    productosVenta.value[index].nombre = copiaProductoActual.nombre;


    calcularTotalFactura();
     fncambioTipoImpuesto()
  }

}
/*********************************************************/
const fnXmayor = async(codigo)=>{
   if(!codigo) return;

   const productoNormal = await peticionesFetchOffline('getDataByField', 'productos','codigo',codigo);

   const producto = productosVenta.value.find(prod => prod.codigo === codigo);
   productoSeleccionado.value = producto
  const index = productosVenta.value.findIndex(prod => prod.codigo === productoSeleccionado.value.codigo);
  if (index !== -1) {
        const copiaProductoActual = { ...productosVenta.value[index] };
    productoNormal.cantidad = productoSeleccionado.value.cantidad
    productoNormal.precio_venta = productoNormal.precio_xmayor
    productoNormal.precio_final = productoNormal.precio_xmayor
    productoNormal.descuento = productoSeleccionado.value.descuento
    productosVenta.value[index] = { ...productoNormal };
    // 🔵 Restaurar el nombre modificado
    productosVenta.value[index].nombre = copiaProductoActual.nombre;

    calcularTotalFactura();
     fncambioTipoImpuesto()
  }

}
/*********************************************************/
const fnOferta = async(codigo)=>{
/*   const productoNormal = await peticionesFetch(`${link.value}${api.value}`,`datoscampo/productos/codigo/${codigo}`,{},tokenCifrado.value,'GET');*/
   const productoNormal = await peticionesFetchOffline('getDataByField', 'productos','codigo',codigo);

   const producto = productosVenta.value.find(prod => prod.codigo === codigo);
   productoSeleccionado.value = producto
  const index = productosVenta.value.findIndex(prod => prod.codigo === productoSeleccionado.value.codigo);
  if (index !== -1) {
    const copiaProductoActual = { ...productosVenta.value[index] };
    productoNormal.cantidad = productoSeleccionado.value.cantidad
    productoNormal.precio_venta = productoNormal.oferta
    productoNormal.precio_final = productoNormal.oferta
    productoNormal.descuento = productoSeleccionado.value.descuento
    productosVenta.value[index] = { ...productoNormal };
     productosVenta.value[index].nombre = copiaProductoActual.nombre;
    calcularTotalFactura();
     fncambioTipoImpuesto()
  }
}
/************************************************************/
//fnincluirImpuesto
//fnagregarImpuesto
const fnCambiarComprobante = ()=>{
   return
  const comprobanteSelected = comprobante.value;
  if(comprobanteSelected === 'FINAL'){
    if (productosVenta.value.length > 0) {
        toast.removeAllGroups();
  toast.add({ severity: 'warn', summary: 'NCF FINAL', detail: 'NCF FINAL SELECCIONADO', life: 3000 });

  productosVenta.value.forEach(producto => {

   if (producto.nombre != 'DESCUENTO' && producto.nombre != 'DESCUENTO APLICADO') {

if ((producto.tipo_impuesto && producto.tipo_impuesto !== 'Incluido') || producto.tipo_impuesto == null || producto.tipo_impuesto === '') {

    const impuesto = impuestoSistema.value;
    const impuestoCalculado = (producto.precio_venta / (1 + impuesto / 100)).toFixed(2);

    const precioFinal = producto.precio_venta

    producto.impuestos = impuesto;
    producto.impuesto = (Number(producto.precio_venta) - impuestoCalculado).toFixed(2);
    producto.impuesto_venta = (Number(producto.precio_venta) - impuestoCalculado).toFixed(2);
    producto.precio_venta = impuestoCalculado;
    producto.precio_final = precioFinal;
    producto.tipo_impuesto = 'Incluido';
   }

  }

  });

  window.localStorage.setItem('productosVenta', JSON.stringify(productosVenta.value));
}else{
  comprobante.value = 'NORMAL'
  toast.removeAllGroups();
  toast.add({ severity: 'error', summary: 'Éxito', detail: 'Upsps debes agregar Productos', life: 3000 });
}


  }else if(comprobanteSelected === 'FISCAL'){
    if (productosVenta.value.length > 0) {
        toast.removeAllGroups();
  toast.add({ severity: 'warn', summary: 'NCF FISCAL', detail: 'NCF FISCAL SELECCIONADO', life: 3000 });

  productosVenta.value.forEach(producto => {

   if (producto.nombre != 'DESCUENTO' && producto.nombre != 'DESCUENTO APLICADO') {

     if(producto.tipo_impuesto && producto.tipo_impuesto !='Incluido' && producto.tipo_impuesto !='Agregado' || producto.tipo_impuesto == null || producto.tipo_impuesto === ''){ 

    const impuesto = impuestoSistema.value;
    const impuestoCalculado = ((Number(producto.precio_final) * (1 + Number(impuesto) / 100)) - Number(producto.precio_final)).toFixed(2);

    const impuestoCalculado2 = (Number(producto.precio_final) * (1 + Number(impuesto) / 100)).toFixed(2);
    
    producto.impuestos = impuesto;
    producto.impuesto = impuestoCalculado;
    producto.impuesto_venta = impuestoCalculado;
    //producto.precio_venta = impuestoCalculado2.toFixed(2);
    producto.precio_final = impuestoCalculado2;
    producto.tipo_impuesto = 'Agregado';
   }

  }

  });

  window.localStorage.setItem('productosVenta', JSON.stringify(productosVenta.value));
}

  }else if(comprobanteSelected === 'NORMAL'){
if (productosVenta.value.length > 0) {
        toast.removeAllGroups();
  toast.add({ severity: 'warn', summary: 'NORMAL', detail: 'SIN COMPROBANTE', life: 3000 });
  const copiaProductos = JSON.parse(JSON.stringify(productosArraySinModificaciones.value));

  productosVenta.value.forEach(producto => {
    const datosprod = copiaProductos.find((prod) => prod.codigo === producto.codigo);

    if (producto.nombre !== 'DESCUENTO' && producto.nombre !== 'DESCUENTO APLICADO') {
      if (producto.tipo_impuesto) {
        const impuesto = impuestoSistema.value;
        const impuestoCalculado = (producto.precio_venta / (1 + impuesto / 100)).toFixed(2);

        producto.impuestos = 0;
        producto.impuesto = 0;
        producto.impuesto_venta = 0;

        // Verificar si datosprod existe antes de acceder a sus propiedades
        if (datosprod) {
          if (producto.tipo_impuesto === 'Agregado') {
            producto.precio_venta = datosprod.precio_venta ?? producto.precio_venta;
            producto.precio_final = datosprod.precio_final ?? producto.precio_final;
          } else if (producto.tipo_impuesto === 'Incluido') {
            producto.precio_venta = datosprod.precio_final ?? producto.precio_final;
          }
        } else {
          // Si datosprod no existe, deja los valores como están o maneja el caso
          console.warn(`Producto con código ${producto.codigo} no encontrado en copiaProductos.`);
        }

        producto.tipo_impuesto = 'Sin Imp.';
      }
    }
  });

  window.localStorage.setItem('productosVenta', JSON.stringify(productosVenta.value));
}

  }
}
/************************************************************/
const fnResetComprobante = ()=>{
  if (productosVenta.value.length > 0) {
  productosVenta.value.forEach(producto => {

   if (producto.nombre != 'DESCUENTO' && producto.nombre != 'DESCUENTO APLICADO') {

     if(producto.tipo_impuesto){ 
    const impuesto = impuestoSistema.value;
    const impuestoCalculado = (producto.precio_venta / (1 + impuesto / 100)).toFixed(2);
    producto.impuestos = 0;
    producto.impuesto = 0;
    producto.impuesto_venta = 0;

    if(producto.tipo_impuesto === 'Agregado'){
      producto.precio_venta = producto.precio_venta;
      producto.precio_final = producto.precio_final;
    }else if(producto.tipo_impuesto === 'Incluido'){
      producto.precio_venta = producto.precio_final;

    }



    producto.tipo_impuesto = 'Sin Imp.';
   }

  }

  });

  window.localStorage.setItem('productosVenta', JSON.stringify(productosVenta.value));
  comprobante.value = 'NORMAL'
   toast.removeAllGroups();
  toast.add({ severity: 'success', summary: 'Éxito', detail: 'Comprobante Reseteado', life: 3000 });
 }else{
    toast.add({ severity: 'error', summary: 'Upps', detail: 'No hay Productos', life: 3000 });
 }



}
/************************************************************/
const fnDescuento = (producto) => {
  productoSeleccionado.value = producto;

  Swal.fire({
    title: `
      <div class="flex items-center justify-center gap-2 mb-2">
        <i class="pi pi-percentage text-blue-500 text-lg"></i>
        <span class="text-base font-semibold text-gray-800 dark:text-gray-100">Ingrese el descuento</span>
      </div>
    `,
    html: `
      <div class="flex flex-col gap-4 text-left max-w-xs mx-auto">
        <div>
          <label for="descuento" class="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">
            Descuento (valor fijo)
          </label>
          <input id="descuento" type="number" placeholder="Ej: 200"
            class="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 text-sm px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all" />
        </div>
        <div>
          <label for="descuento_porcentaje" class="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">
            Descuento (%)
          </label>
          <input id="descuento_porcentaje" type="number" placeholder="Ej: 10"
            class="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 text-sm px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all" />
        </div>
      </div>
    `,
    color: '#111827',
    width: '28rem',
    showCancelButton: true,
    confirmButtonText: 'Aplicar Descuento',
    cancelButtonText: 'Cancelar',
    focusConfirm: false,
    customClass: {
      popup: `
        !p-6 !pb-4 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700
        bg-white dark:bg-gray-900 w-full max-w-md overflow-hidden
      `,
      confirmButton: `
        bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-5 rounded-md
        focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all
      `,
      cancelButton: `
        bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200
        font-medium py-2 px-5 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600
        focus:outline-none transition-all
      `,
      actions: '!mt-6 flex justify-center gap-3',
      htmlContainer: '!overflow-visible !p-0'
    },
    didOpen: () => {
      const descuentoInput = document.getElementById('descuento');
      const descuentoPorcentajeInput = document.getElementById('descuento_porcentaje');

      descuentoInput.addEventListener('keyup', () => {
        const descuento = Number(descuentoInput.value);
        if (!isNaN(descuento)) {
          productoSeleccionado.value.descuento = descuento;
          actualizarPorcentajeDescuento();
          descuentoPorcentajeInput.value = productoSeleccionado.value.descuento_porcentaje;
        }
      });

      descuentoPorcentajeInput.addEventListener('keyup', () => {
        const descuentoPorcentaje = Number(descuentoPorcentajeInput.value);
        if (!isNaN(descuentoPorcentaje)) {
          productoSeleccionado.value.descuento_porcentaje = descuentoPorcentaje;
          actualizarDescuento();
          descuentoInput.value = productoSeleccionado.value.descuento;
        }
      });
    },
    preConfirm: () => {
      const descuento = document.getElementById('descuento').value;
      const descuento_porcentaje = document.getElementById('descuento_porcentaje').value;

      if (!descuento && !descuento_porcentaje) {
        Swal.showValidationMessage(`Por favor, ingrese al menos un valor`);
        return false;
      }
      return true;
    }
  }).then((result) => {
    if (result.isConfirmed) {
      aplicarDescuento();
      Swal.fire({
        icon: 'success',
        title: '✅ Descuento aplicado correctamente',
         customClass: {
          popup: `
            rounded-xl shadow-lg border border-gray-200 dark:border-gray-700
            bg-white dark:bg-gray-900
          `,
          confirmButton: `
            bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-md transition-all
          `
        }
      });
    }
  });
};

/************************************************************/
const agregarProductoModificado = () => {
  // Lógica para agregar el producto modificado
  guardarProducto();
  visibleprecio.value = false;
      if (clienteSeleccionado.value) {
      crearventaProceso()
   }
};

/************************************************************/
const guardarProducto = () => {
  // Lógica para guardar el producto modificado
  const index = productosVenta.value.findIndex(prod => prod.codigo === productoSeleccionado.value.codigo);
  
  const calculoImpuesto = (Number(productoSeleccionado.value.precio_final) - Number(productoSeleccionado.value.precio_venta))

   productoSeleccionado.value.impuesto_venta = calculoImpuesto.toFixed(2)

  if (index !== -1) {
    productosVenta.value[index] = { ...productoSeleccionado.value };
    calcularTotalFactura();
     fncambioTipoImpuesto()
  }
  visibleprecio.value = false;
      if (clienteSeleccionado.value) {
      crearventaProceso()
   }
};

/************************************************************/
const fnCosto = async(pr)=>{
/*   const productoCosto = await peticionesFetch(`${link.value}${api.value}`,`datoscampo/productos/codigo/${pr.codigo}`,{},tokenCifrado.value,'GET');*/
   const productoCosto = await peticionesFetchOffline('getDataByField', 'productos','codigo',pr.codigo);

   const producto = productosVenta.value.find(prod => prod.codigo === pr.codigo);
   productoSeleccionado.value = producto
  const index = productosVenta.value.findIndex(prod => prod.codigo === productoSeleccionado.value.codigo);
  if (index !== -1) {
    const copiaProductoActual = { ...productosVenta.value[index] };
    productoCosto.precio_venta = productoCosto.precio_compra
    productoCosto.cantidad = productoSeleccionado.value.cantidad
    productoCosto.descuento = productoSeleccionado.value.descuento
    productosVenta.value[index] = { ...productoCosto };
    productosVenta.value[index].nombre = copiaProductoActual.nombre;
    calcularTotalFactura();
     fncambioTipoImpuesto()
  }




}
/************************************************************/
const fnElegirPrecio = async(precio)=>{
  const producto = productosVenta.value.find(prod => prod.codigo === productoSeleccionado.value.codigo);
  let tipo = 'success'
   if(precio === 'Normal'){
      fnPrecioNormal(producto.codigo)
   }else if(precio === 'Minimo'){
    tipo = 'warn'
      fnPrecioMinimo(producto.codigo)

   }else if(precio === 'X Mayor'){
    tipo = 'warn'
      fnXmayor(producto.codigo)

   }else if(precio === 'Oferta'){
    tipo = 'warn'
      fnOferta(producto.codigo)

   }else if(precio === 'Costo'){
    tipo = 'error'
      fnCosto(producto)
   }

 toast.add({ severity: tipo, summary: 'Precio Seleccionado', detail: 'precio '+precio+' Seleccionado.', life: 3000 });

}
/************************************************************/
const actualizarImpuesto = () => {
  const producto = productosVenta.value.find(prod => prod.codigo === productoSeleccionado.value.codigo);
  const simboloPorcentaje = productoSeleccionado.value.simboloporcentaje;
  if (simboloPorcentaje === '0.00') {
    productoSeleccionado.value.impuestos = '0.00';
  } else if (simboloPorcentaje === '1') {
    productoSeleccionado.value.impuestos = producto.impuestos;
  } else {
    productoSeleccionado.value.impuestos = simboloPorcentaje;
  }
  calcularPrecioFinal();

  if (clienteSeleccionado.value) {
      crearventaProceso()
   }


};
/************************************************************/
const calcularPrecioFinal = () => {
  const base = Number(productoSeleccionado.value.precio_venta);
  const impuesto = Number(productoSeleccionado.value.impuestos) / 100;
  //productoSeleccionado.value.precio_final = Math.round((base * (1 + impuesto)).toFixed(2));
  productoSeleccionado.value.precio_final = ((base * (1 + impuesto)).toFixed(2));

  if (clienteSeleccionado.value) {
      crearventaProceso()
   }

};

/************************************************************/
const calcularPrecioBase = () => {
  const final = Number(productoSeleccionado.value.precio_final);
  const impuesto = Number(productoSeleccionado.value.impuestos) / 100;
  //productoSeleccionado.value.precio_venta = Math.round((final / (1 + impuesto)).toFixed(2));
  productoSeleccionado.value.precio_venta = ((final / (1 + impuesto)).toFixed(2));

};
/************************************************************/
/************************************************************/
const actualizarStockProducto = async(id,cantidad,operacion = 'restar')=>{
/*  const datosProducto = await peticionesFetch(`${link.value}${api.value}`, `datoscampo/productos/id/${id}`, {}, tokenCifrado.value, 'GET');*/
  const datosProducto = await peticionesFetchOffline('getDataByField', 'productos','id',id);

   if(!datosProducto){
    return
   }

  if (operacion == 'sumar') {
    datosProducto.stock = (cantidad + Number(datosProducto.stock))
  }else{
    datosProducto.stock = (Number(datosProducto.stock) - cantidad)
  }
    const url = link.value+api.value+"/actualizarcampos/productos";
      if (datosProducto.hasOwnProperty('created_at')) {
      datosProducto.updated_at = nfecha('timestamp')
    }

/* const envioDatos = await enviarDatosPorPost(url, datosProducto,tokenCifrado.value);*/
 const envioDatos = await peticionesFetchOffline('updateData','productos', JSON.stringify(datosProducto));
  if (envioDatos[0] == 'ok') {
      toast.removeAllGroups();
     toast.add({ severity: 'success', summary: 'Éxito', detail: 'Datos Actualizados', life: 3000 });
  }else{
    toast.add({ severity: 'error', summary: 'Error', detail: 'Fallo al actualizar los datos.', life: 3000 });
  }

}
/************************************************************/
const aplicarDescuento = () => {
  const producto = productosVenta.value.find(prod => prod.codigo === productoSeleccionado.value.codigo);
  if (producto) {
    producto.descuento = productoSeleccionado.value.descuento;
    producto.descuento_porcentaje = productoSeleccionado.value.descuento_porcentaje;
    calcularTotalFactura();
     fncambioTipoImpuesto()
     toast.removeAllGroups();
    toast.add({ severity: 'success', summary: 'Exito', detail: 'Descuento Aplicado de '+producto.descuento_porcentaje+'%', life: 3000 });
  }
};

const actualizarPorcentajeDescuento = () => {
  const producto = productosVenta.value.find(prod => prod.codigo === productoSeleccionado.value.codigo);
  if (producto) {
    const descuento = Number(productoSeleccionado.value.descuento);
    const precioVenta = Number(productoSeleccionado.value.precio_venta);
    productoSeleccionado.value.descuento_porcentaje = ((descuento / precioVenta) * 100).toFixed(2);
    calcularTotalFactura();
     fncambioTipoImpuesto()
  }
};

const actualizarDescuento = () => {
  const producto = productosVenta.value.find(prod => prod.codigo === productoSeleccionado.value.codigo);
  if (producto) {
    const porcentaje = Number(productoSeleccionado.value.descuento_porcentaje);
    const precioVenta = Number(productoSeleccionado.value.precio_venta);
    productoSeleccionado.value.descuento = ((porcentaje / 100) * precioVenta).toFixed(2);
    calcularTotalFactura();
     fncambioTipoImpuesto()
  }
};

/************************************************************/

const aplicarNotaCredito = () => {
  visibleNotaCredito.value = true
};

/************************************************************/
const guardarCliente = async ()=>{
    const clienteSelected = allClientes.value.find(cliente=>cliente.codigo === clienteSelected.value.codigo);
  if (clienteSelected) {
    await actualizarCliente();
    return
  }

/*  const envio = await peticionesFetch(`${link.value}${api.value}`,`insertar/clientes`,clienteSelected.value,tokenCifrado.value,'POST');*/
  const envio = await peticionesFetchOffline('insertData','clientes', JSON.stringify(clienteSelected.value));
  if (envio[0] == 'ok') {
     toast.removeAllGroups();
    toast.add({ severity: 'success', summary: 'OK', detail: `Cliente ${clienteSelected.value.nombre} agregado exitosamente`, life: 3000 });
    visiblecliente.value = false
  }else{
    toast.add({ severity: 'error', summary: 'Error', detail: `Error al agregar el cliente ${clienteSelected.value.nombre}`, life: 3000 });
  }
}
/************************************************************/
const actualizarCliente = async ()=>{
  const clienteSelected = allClientes.value.find(cliente=>cliente.codigo === clienteSelected.value.codigo);
  if (clienteSelected && clienteSelected.value.codigo != '0000000') {

/*  const envio = await peticionesFetch(`${link.value}${api.value}`,`actualizarcampos/clientes`,clienteSelected.value,tokenCifrado.value,'POST');*/
  const envio = await peticionesFetchOffline('insertData','clientes', JSON.stringify(clienteSelected.value));
  if (envio[0] == 'ok') {
     toast.removeAllGroups();
    toast.add({ severity: 'success', summary: 'OK', detail: `Cliente ${clienteSelected.value.nombre} actualizado exitosamente`, life: 3000 });
    visiblecliente.value = false
  }else{
    toast.add({ severity: 'error', summary: 'Error', detail: `Error al actualizar el cliente ${clienteSelected.value.nombre}`, life: 3000 });
  }
}else{
    toast.add({ severity: 'error', summary: 'Error', detail: `Este cliente ${clienteSelected.value.nombre} no se puede modificar`, life: 3000 });
}
}
/************************************************************/
const seleccionarCliente = async ()=>{
  if (tipoclientebuscar.value === 'NADA') {
    clienteSelected.value = await arrayToObjetoFromTabla(link,tokenCifrado.value,'clientes');
  }else if(tipoclientebuscar.value === 'nuevo'){
   // clienteSelected.value = await arrayToObjetoFromTabla(link,tokenCifrado.value,'clientes');
   fnLimpiarCliente()
  }else{
    const clienteDefault = allClientes.value.find(cliente=>cliente.codigo === '0000000');
    clienteSelected.value = clienteDefault;
    clienteSelected.value = clienteDefault;
  }

}
/************************************************************/
const fnClienteDefault = ()=>{
    const clienteDefault = allClientes.value.find(cliente=>cliente.codigo === '0000000');
    clienteSelected.value = clienteDefault;
    clienteSelected.value = clienteDefault;
    visiblecliente.value = false;
}
/************************************************************/
const seleccionarClienteDefaultBuscador = () => {
  const clienteDefault = allClientes.value.find(cliente => cliente.codigo === '0000000');
  if (!clienteDefault) {
    toast.add({ severity: 'error', summary: 'Upps', detail: 'No se encuentra el Cliente por Default', life: 3000 });
    return;
  }
  clienteSelected.value = clienteDefault;
  visibleClientes.value = false;
  toast.add({ severity: 'success', summary: 'OK', detail: 'Cliente por Default seleccionado', life: 2000 });
};
/************************************************************/
const fnLimpiarCliente = ()=>{
  clienteSelected.value = {}
  clienteSelected.value.codigo = generarCodigoUnico()
}
/************************************************************/
const alporMayor = () => {
  if (checkedpormayor.value) {
    productosVenta.value.forEach(producto => {
      const datosProd = productosArray.value.find(prod => prod.codigo === producto.codigo);
      if (datosProd) {
        producto.precio_venta = datosProd.precio_xmayor;
        producto.precio_final = datosProd.precio_xmayor;
      }
    });
    calcularTotalFactura();
     fncambioTipoImpuesto()
  }
};

watch(checkedpormayor, (newVal) => {
  if (newVal) {
    alporMayor();
  } else {
    productosVenta.value.forEach(producto => {
      const datosProd = productosArray.value.find(prod => prod.codigo === producto.codigo);
      if (datosProd) {
        producto.precio_venta = datosProd.precio_venta;
      }
    });
    calcularTotalFactura();
     fncambioTipoImpuesto()
  }
});

/************************************************************/
//visibleCredito
watch(visibleCredito, (newVal) => {
  if (newVal) {

   montoCREDITO.value = total.value;
   saldoCREDITO.value = total.value;

  } else {

  }
});
/************************************************************/
const fnincluirImpuesto = async () => {
  if (incluirImpuesto.value) {
    visiblecobrar.value = false
    // Mostrar alerta con opciones
const { value: opcion } = await Swal.fire({
  title: '¿Cómo deseas aplicar el impuesto?',
  html: `
    <div class="flex flex-col gap-4 text-left text-gray-700">
      <label class="flex items-center gap-2">
        <input type="radio" name="impuesto" value="solo" class="form-radio text-teal-600" />
        <span>Solo agregar impuesto</span>
      </label>
      <label class="flex items-center gap-2">
        <input type="radio" name="impuesto" value="todo" class="form-radio text-teal-600" />
        <span>Agregar impuesto y comprobante FINAL</span>
      </label>
    </div>
  `,
  focusConfirm: false,
  preConfirm: () => {
    const checked = document.querySelector('input[name="impuesto"]:checked');
    return checked ? checked.value : null;
  },
  showCancelButton: true,
  confirmButtonText: 'Aplicar',
  cancelButtonText: 'Cancelar',
  customClass: {
    popup: 'rounded-2xl shadow-xl',
    confirmButton: 'bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg focus:outline-none',
    cancelButton: 'bg-gray-300 hover:bg-gray-400 text-gray-800 px-6 py-2 rounded-lg ml-2',
  }
});


    // Si el usuario cancela, no hacer nada
    if (!opcion) {
      incluirImpuesto.value = false;
      return;
    }

    const soloImpuesto = opcion === 'solo';

    // Reset de checkbox si estaba activo
    if (agregarImpuesto.value) {
      agregarImpuesto.value = false;
      fnagregarImpuesto();
    }

    if (productosVenta.value.length > 0) {
      productosVenta.value.forEach(producto => {
        if (producto.nombre !== 'DESCUENTO' && producto.nombre !== 'DESCUENTO APLICADO') {
          if (producto.tipo_impuesto && producto.tipo_impuesto !== 'Incluido') {
            const impuesto = impuestoSistema.value;
            const impuestoCalculado = (producto.precio_venta / (1 + impuesto / 100)).toFixed(2);
            producto.impuestos = impuesto;
            producto.impuesto = (Number(producto.precio_venta) - impuestoCalculado).toFixed(2);
            producto.impuesto_venta = (Number(producto.precio_venta) - impuestoCalculado).toFixed(2);
            producto.precio_venta = impuestoCalculado;
            producto.tipo_impuesto = 'Incluido';
          }
        }
      });

      tipoImpuestoFactura.value = 'INCLUIDO'
      fncambioTipoImpuesto()

      window.localStorage.setItem('productosVenta', JSON.stringify(productosVenta.value));
    }

    if (!soloImpuesto && comprobante.value !== 'FINAL') {
      comprobante.value = 'FINAL';
    }
    visiblecobrar.value = true

  } else {
    // Cuando se desactiva el checkbox de incluir impuesto
    if (productosVenta.value.length > 0) {
      productosVenta.value.forEach(producto => {
        if (producto.nombre !== 'DESCUENTO' && producto.nombre !== 'DESCUENTO APLICADO') {
          if (producto.tipo_impuesto && producto.tipo_impuesto === 'Incluido') {
            producto.impuestos = 0;
            producto.impuesto = 0;
            producto.impuesto_venta = 0;
            producto.precio_venta = producto.precio_final;
            producto.tipo_impuesto = 'Sin Imp.';
          }
        }
      });
      tipoImpuestoFactura.value = 'NO'
      fncambioTipoImpuesto()

      window.localStorage.setItem('productosVenta', JSON.stringify(productosVenta.value));
    }

    comprobante.value = 'NORMAL';
    visiblecobrar.value = true
  }

  calcularTotalFactura();
};

/************************************************************/
const fnagregarImpuesto = async() => {
  // Early return si no hay productos
  if (productosVenta.value.length === 0) return;

  // Si se intenta agregar impuesto pero incluir está activo, desactivar incluir
  if (agregarImpuesto.value && incluirImpuesto.value) {
    incluirImpuesto.value = false;
    fnincluirImpuesto();
    return; // fnincluirImpuesto ya maneja el resto
  }

  const impuesto = impuestoSistema.value;
  const esAgregarImpuesto = agregarImpuesto.value;

  // Procesar cada producto
  productosVenta.value.forEach(producto => {
    // Ignorar descuentos
    if (producto.nombre === 'DESCUENTO' || producto.nombre === 'DESCUENTO APLICADO') {
      return;
    }

    // Ignorar productos con impuesto incluido
    if (producto.tipo_impuesto === 'Incluido') {
      return;
    }

    // Guardar precio original si no existe
    if (!producto.precio_venta_original) {
      producto.precio_venta_original = Number(producto.precio_venta);
    }

    // Guardar impuesto original si no existe
    if (producto.impuestos_original === undefined) {
      producto.impuestos_original = Number(producto.impuestos || 0);
    }

    // Usar siempre el precio original para los cálculos
    const precioOriginal = Number(producto.precio_venta_original);

    if (esAgregarImpuesto) {
      // AGREGAR IMPUESTO: Usar precio original como base
      const montoImpuesto = precioOriginal * (impuesto / 100);
      const precioConImpuesto = precioOriginal + montoImpuesto;

      producto.precio_venta = precioOriginal; // Restaurar precio base original
      producto.impuestos = impuesto;
      producto.impuesto = montoImpuesto.toFixed(2);
      producto.impuesto_venta = montoImpuesto.toFixed(2);
      producto.precio_final = precioConImpuesto.toFixed(2);
      producto.tipo_impuesto = 'Agregado';
    } else {
      // QUITAR IMPUESTO: Restaurar precio original (no borrar el porcentaje de impuestos)
      producto.precio_venta = precioOriginal;
      producto.impuesto = 0;
      producto.impuesto_venta = 0;
      producto.precio_final = precioOriginal;
      producto.tipo_impuesto = 'Sin Imp.';
    }
  });

  // Actualizar comprobante a Consumidor Final cuando se agrega impuesto
  if (esAgregarImpuesto) {
    comprobante.value = 'FINAL';
    fnCambiarComprobante();
  }

  // Guardar y recalcular
  window.localStorage.setItem('productosVenta', JSON.stringify(productosVenta.value));
  calcularTotalFactura();
};


/************************************************************/
const actualizarDescuentoFactura = () => {
  let totalDescuento = Number(descuento.value) || 0;
  let totalConDescuento = 0;
  let impuestosTotales = 0;

  productosVenta.value.forEach(producto => {
    const totalProducto = calcularTotal(producto);
    totalConDescuento += totalProducto;
    impuestosTotales += calcularImpuesto(producto) * producto.cantidad;
  });

  totalConDescuento -= totalDescuento;
  totalfactura.value = totalConDescuento;
  impuesto.value = impuestosTotales.toFixed(2);
};

/************************************************************/
const guardarFactura = async () => {

visiblecobrar.value = false

const tipo = tipoFactura.value;

const tipoN = {
  'factura':'facturas',
  'cotizacion':'cotizacion',
  'pre-factura':'pre_facturas',
  'orden':'ordenes',
  'apartado':'apartados',
}

const campoN = {
  'factura':'no_factura',
  'cotizacion':'no_cotizacion',
  'pre-factura':'no_factura',
  'orden':'no_orden',
  'apartado':'no_factura',
}

/*
  console.log("numerodocumentoEditado.value", numerodocumentoEditado.value);
  console.log("documentoEditado.value", documentoEditado.value);

return

*/

if (productosVenta.value.length < 1) {
  console.log("productosVenta.value.length", productosVenta.value.length);
  toast.add({ severity: 'error', summary: 'Error', detail: 'No tienes Productos Agregados.', life: 3000 });
  return
}


    if (documentoEditado.value == 'Factura') {
        await actualizarFactura()
        return
    }


    if (documentoEditado.value == 'Cotizacion') {
        await actualizarCotizacion()
        return
    }


  //const ultimaFactura = await peticiones(`${link.value}${api.value}/datosmax`, {"tabla":tipoN[tipoFactura.value],"campo":campoN[tipoFactura.value]},'POST',tokenCifrado.value);


  //noFacturaFN.value = generadorCodigo(ultimaFactura[0], '', 7);
  noFacturaFN.value = generarCodigoUnico()

  const elComprobante = comprobantes.value?.[comprobante.value];

  if (comprobante.value === 'NORMAL') {
    comprobanteFN.value = 'SIN COMPROBANTE';
  }

  if (comprobante.value != 'NORMAL') {
    if (!elComprobante) {
      toast.add({ severity: 'error', summary: 'Error', detail: 'Comprobante inválido o vacío', life: 3000 });
      comprobante.value = 'NORMAL';
      comprobanteFN.value = 'SIN COMPROBANTE';
    } else {
/*    const comprob = await peticionesFetch(`${link.value}${api.value}`,`datoscampo/confiscal/prefijo/${elComprobante}`,{},tokenCifrado.value,'GET');*/
    const comprob = await peticionesFetchOffline('getDataByField', 'confiscal','prefijo',elComprobante);
    comprobanteFN.value = generadorCodigo(comprob.contador, elComprobante, 8);

   const url = link.value+api.value+"/actualizarcampos/confiscal";

  if (!comprob) {
    console.error("Datos incompletos, no se puede actualizar.");
    return;
  }

   comprob.contador = (Number(comprob.contador) + 1)
   comprob.secuencia = comprobanteFN.value


  if (comprob.hasOwnProperty('created_at')) {
    comprob.updated_at = nfecha('timestamp');
  }

/*  const envioDatos = await enviarDatosPorPost(url, comprob, tokenCifrado.value);*/
  const envioDatos = await peticionesFetchOffline('updateData','confiscal', JSON.stringify(comprob));
    }
  }

if (
  clienteSelected.value === null ||
  typeof clienteSelected.value !== 'object' ||
  !clienteSelected.value.nombre ||
  clienteSelected.value.nombre.trim() === ''
) {
  loading.value = false;
  toast.add({ severity: 'error', summary: 'Error', detail: 'Debe Agregar un Cliente', life: 3000 });
  return;
}

if (clienteSelected.value.nombre === '') {
  Swal.fire({
    title: 'Se Requiere Cliente',
    html: '<input type="text" id="cliente-input" class="swal2-input" style="width: 300px; z-index: 10000 !important;" placeholder="Nombre del cliente">',
    showCancelButton: true,
    confirmButtonText: 'Agregar Cliente',
    cancelButtonText: 'Sin Registro',
    showDenyButton: true,
    denyButtonText: 'Guardar Venta',
    didOpen: () => {
      const input = document.getElementById('cliente-input');
      const awesomplete = new AwesompleteFull(input, {
        list: allClientes.value.map(cliente => cliente.nombre),
        minChars: 1,
        autoFirst: true,
        item: function (text, input) {
          const itemElement = document.createElement('li');
          itemElement.textContent = text;
          return itemElement;
        },
        replace: async function (text) {
          this.input.value = text.value;
          const selectedClient = allClientes.value.find(cliente => cliente.nombre === text.value);
          if (selectedClient) {
            clienteSelected.value = selectedClient;
            clienteSelected.value = selectedClient;
            Swal.close();
                if (tipo == 'cotizacion') {
                  await continuarGuardandoCotizacion();
                } else if (tipo == 'pre-factura') {
                  await continuarGuardandoPreFactura();
                } else {
                  await continuarGuardandoFactura();
                }
          }
        }
      });

const applyZIndex = () => {
  const awesompleteList = document.querySelector('.awesomplete ul');
  if (awesompleteList) {
    awesompleteList.style.zIndex = '10001';
    awesompleteList.style.position = 'relative'; // Add position relative
  }
};

    // Apply z-index when Awesomplete opens
    input.addEventListener('awesomplete-open', applyZIndex);
    // Apply initially in case it's already opened
    applyZIndex();



    }
  }).then(async (result) => {
    const input = document.getElementById('cliente-input');

    if (result.isConfirmed) {
      if (input.value === '') {
        toast.add({ severity: 'error', summary: 'Error', detail: 'Debe Agregar un Cliente', life: 3000 });
        //visiblecliente.value = true;
        return;
      }else{
        if (clienteSelected.value.nombre === '') {
               clienteSelected.value.nombre = input.value;
               clienteSelected.value.codigo = generarCodigoUnico();
              await guardarCliente();
        }else{
            const clienteExiste = allClientes.value.find(cliente => cliente.nombre === clienteSelected.value.nombre);

            if (!clienteExiste) {
               clienteSelected.value.nombre = input.value;
               clienteSelected.value.codigo = generarCodigoUnico();
               //visiblecliente.value = true;
            }

        }
      }


      if (tipo == 'cotizacion') {
        await continuarGuardandoCotizacion();
      } else if (tipo == 'pre-factura') {
        await continuarGuardandoPreFactura();
      } else {
        await continuarGuardandoFactura();
      }

    } else if (result.isDenied) {
      // Guardar Venta
      if (tipo == 'pre-factura') {
        await continuarGuardandoPreFactura();
      } else {
        await continuarGuardandoFactura();
      }
    } else if (result.dismiss === Swal.DismissReason.cancel) {
      const clienteSinRegistro = allClientes.value.find(cliente => cliente.codigo === '0000000');
      clienteSelected.value = clienteSinRegistro;
      clienteSelected.value = clienteSinRegistro;

      if (tipo == 'cotizacion') {
        await continuarGuardandoCotizacion();
      } else if (tipo == 'pre-factura') {
        await continuarGuardandoPreFactura();
      } else {
        await continuarGuardandoFactura();
      }
    }
  });
  return;
}



        if (tipo == 'cotizacion') {
           await continuarGuardandoCotizacion();
        }else if (tipo == 'pre-factura') {
           await continuarGuardandoPreFactura();
        }else if (tipo == 'orden') {
           await continuarGuardandoOrden();
        }else if (tipo == 'apartado') {
           await continuarGuardandoApartado();
        }else{
           await continuarGuardandoFactura();
        }
};

const fnAbrirCaja = async()=>{
const datosEmpresa = JSON.stringify(enviarDatosLocalStorage() )
      if(window.electron){
const impresion = window.electron.ipcRenderer.invoke('abrircaja','AbrirCaja',datosEmpresa,true,false,false);
       }else{
         toast.add({ severity: 'error', summary: 'Upps', detail: 'Esta funcion es solo para la aplicacion Desktop', life: 3000 });
     }

}
/**********************************************************/

const continuarGuardandoFactura = async () => {
  loading.value = true;

if (
  clienteSelected.value === null ||
  typeof clienteSelected.value !== 'object' ||
  !clienteSelected.value.nombre ||
  clienteSelected.value.nombre.trim() === ''
) {
  loading.value = false;
  toast.add({ severity: 'error', summary: 'Error', detail: 'Debe Agregar un Cliente', life: 3000 });
  return;
}

//clienteSelected.value = allClientes.value.find(client=>client.codigo === '0000000')
  const facturaAcredito = ref(false);
  const facturaApartado = ref(false);
  const facturaAcreditoEmision = ref(null);

if (metodoPago.value == 'EFECTIVO') {
    efetivoFN.value = total.value;
  }else if (metodoPago.value == 'APARTADO') {
    facturaApartado.value = true;
  } else if (metodoPago.value == 'CREDITO') {
    facturaAcredito.value = true;

    if (clienteSelected.value.codigo == '0000000') {
      loading.value = false;
      toast.add({ severity: 'error', summary: 'Error', detail: 'Este Cliente no puede tener CREDITO', life: 3000 });
      return;
    }

    const verificaCredito = await peticionesFetchOffline('getDataByDoubleCondition', 'cuentas_cobrar','cod_cliente',clienteSelected.value.codigo,'estatus','PENDIENTE');


    let limiteCredito = 1;

    if (!clienteSelected.value.limite_credito) {
      limiteCredito = 1;
    } else {
      limiteCredito = Number(clienteSelected.value.limite_credito);
    }

    if (verificaCredito.length >= limiteCredito) {
      const totalSaldo = verificaCredito.reduce((acumulador, cuenta) => {
        return acumulador + Number(cuenta.saldo);
      }, 0);

      loading.value = false;

      const { isConfirmed: continueProcess } = await Swal.fire({
        title: 'Advertencia',
        text: `Este Cliente Ya Llegó al Límite de Crédito, Debe Pagar el Saldo Pendiente de ${totalSaldo}`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Continuar de todas formas',
        cancelButtonText: 'Cancelar',
        reverseButtons: true
      });

      if (continueProcess) {
        const { value: password } = await Swal.fire({
          title: 'Ingrese la Contraseña',
          input: 'password',
          inputPlaceholder: 'Contraseña',
          showCancelButton: true,
          confirmButtonText: 'Confirmar',
          cancelButtonText: 'Cancelar',
          inputValidator: (value) => {
            if (!value) {
              return 'Debe ingresar una contraseña';
            }
          }
        });

        if (password === token.value || password === tokenSoloUso.value || password === token24H.value) {
          Swal.fire('Contraseña correcta', 'Puede continuar con el proceso', 'success');
        } else {
          Swal.fire('Acceso denegado', 'No puede continuar con el proceso', 'error');
          return;
        }
      } else {
        Swal.fire('Proceso cancelado', 'El proceso ha sido cancelado', 'info');
        return;
      }
    }
  }
  const datosFN = {
    nofactura: noFacturaFN.value,
    cliente: clienteSelected.value,
    canalventa: datosEmpresa.empresa.nombre,
    entidad_financiera: institucion.value || datosEmpresa.empresa.nombre,
    comprobanteFN: comprobanteFN.value,
    tipocomprobanteFN: mensajeComprobantes.value[comprobante.value],
    estadoFN: estadoFN.value,
    metodoPagoFN: metodoPago.value,
    efectivoFN: efetivoFN.value,
    tarjetaFN: tarjetaFN.value,
    transferenciaFN: transferenciaFN.value,
    vendedorFN: vendedor.value,
    cajeroFN: cajero.value,
    instaladorFN: instaladorFN.value,
    meseroFN: meseroFN.value,
    mesaFN: mesaFN.value,
    pagaCon: pagaCon.value,
    suCambio: suCambio.value,
    noCheque:noCheque.value,
    bancoCheque:bancoCheque.value,
    chequeFN:chequeFN.value,
    deliveryFN: deliveryFN.value,
    subtotal: subtotal.value,
    total: total.value,
    impuesto: impuesto.value,
    ganancia: gananciaFN.value,
    descuento: descuento.value,
    nota: nota.value,
    almacen: datosEmpresa.empresa.nombre,
    productosArray: productosVenta.value,
  };

/*  const verificaFactura = await peticionesFetch(`${link.value}${api.value}`, `datoscampo/facturas/no_factura/${noFacturaFN.value}`, {}, tokenCifrado.value, 'GET');*/
  const verificaFactura = await peticionesFetchOffline('getDataByField', 'facturas','no_factura',noFacturaFN.value);

  if (verificaFactura?.no_factura && verificaFactura?.no_factura == noFacturaFN.value) {
    toast.add({ severity: 'error', summary: 'Error', detail: 'Esta Factura Ya existe', life: 3000 });
    loading.value = false;
    return;
  }

  const url = `${link.value}${api.value}/insertar/facturas`;
  const retorno = await facturaNueva(url, datosFN, 'POST', tokenCifrado.value);

  if (retorno[0] == 'ok') {

    //inputBuscador[0].value = ''

    // Actualizar IMEIs vendidos (cambiar estado a VENDIDO y actualizar stock)
    try {
      const datosVentaImei = {
        cliente: clienteSelected.value,
        vendedor: vendedor.value,
        no_factura: noFacturaFN.value
      };
      await actualizarImeisVendidos(productosVenta.value, datosVentaImei);
    } catch (errorImei) {
      console.error('Error al actualizar IMEIs:', errorImei);
    }

    const tieneBanco = !!cuentaBancaria.value?.id;
    const avisarBancoOpcional = () => {
      toast.add({ severity: 'warn', summary: 'Aviso', detail: 'No se seleccionó banco; se omitió el registro bancario.', life: 3000 });
    };

    if (metodoPago.value == 'TRANSFERENCIA') {
      if (tieneBanco) {
        const transaccion = await crearTransferencia(link.value, api.value, tokenCifrado.value, toast, noFacturaFN.value, transferenciaFN.value, cuentaBancaria.value, clienteSelected.value.nombre, datosEmpresa.empresa.nombre);
        await asientoDiario(link.value, api.value, tokenCifrado.value, toast, 'EFECTIVO EN BANCO', 'VENTAS', transferenciaFN.value, 'REGISTRO DE VENTA DE PRODUCTOS POR (' + transferenciaFN.value + '), FACTURA #' + noFacturaFN.value+' REGISTRO #'+noTransferencia.value);
        await fetchBanco();
      } else {
        avisarBancoOpcional();
      }
    } else if (metodoPago.value == 'TARJETA') {
      if (tieneBanco) {
        const transaccion = await crearTransferencia(link.value, api.value, tokenCifrado.value, toast, noFacturaFN.value, tarjetaFN.value, cuentaBancaria.value, clienteSelected.value.nombre, datosEmpresa.empresa.nombre);
        await asientoDiario(link.value, api.value, tokenCifrado.value, toast, 'EFECTIVO EN BANCO', 'VENTAS', tarjetaFN.value, 'REGISTRO DE VENTA DE PRODUCTOS POR (' + tarjetaFN.value + '), FACTURA #' + noFacturaFN.value +' REGISTRO #'+noTransferencia.value);
        await fetchBanco();
      } else {
        avisarBancoOpcional();
      }
    } else if (metodoPago.value == 'EFECTIVO') {
      await asientoDiario(link.value, api.value, tokenCifrado.value, toast, 'EFECTIVO EN CAJA', 'VENTAS', efetivoFN.value, 'REGISTRO DE VENTA DE PRODUCTOS POR (' + efetivoFN.value + '), FACTURA #' + noFacturaFN.value);
    } else if (metodoPago.value == 'EFECTIVO Y TRANSFERENCIA') {
      if (tieneBanco) {
        const transaccion = await crearTransferencia(link.value, api.value, tokenCifrado.value, toast, noFacturaFN.value, transferenciaFN.value, cuentaBancaria.value, clienteSelected.value.nombre, datosEmpresa.empresa.nombre);
        await asientoDiario(link.value, api.value, tokenCifrado.value, toast, 'EFECTIVO EN BANCO', 'VENTAS', transferenciaFN.value, 'REGISTRO DE VENTA DE PRODUCTOS POR (' + transferenciaFN.value + '), FACTURA #' + noFacturaFN.value +' REGISTRO #'+noTransferencia.value);
        await fetchBanco();
      } else {
        avisarBancoOpcional();
      }
      await asientoDiario(link.value, api.value, tokenCifrado.value, toast, 'EFECTIVO EN CAJA', 'VENTAS', efetivoFN.value, 'REGISTRO DE VENTA DE PRODUCTOS POR (' + efetivoFN.value + '), FACTURA #' + noFacturaFN.value);
    } else if (metodoPago.value == 'TARJETA TRANSFERENCIA Y EFECTIVO') {
      if (tieneBanco) {
        const transaccionT = await crearTransferencia(link.value, api.value, tokenCifrado.value, toast, noFacturaFN.value, transferenciaFN.value, cuentaBancaria.value, clienteSelected.value.nombre, datosEmpresa.empresa.nombre);
        const transaccion = await crearTransferencia(link.value, api.value, tokenCifrado.value, toast, noFacturaFN.value, tarjetaFN.value, cuentaBancaria.value, clienteSelected.value.nombre, datosEmpresa.empresa.nombre);
        await asientoDiario(link.value, api.value, tokenCifrado.value, toast, 'EFECTIVO EN BANCO', 'VENTAS', tarjetaFN.value, 'REGISTRO DE VENTA DE PRODUCTOS POR (' + tarjetaFN.value + '), FACTURA #' + noFacturaFN.value +' REGISTRO #'+noTransferencia.value);
        await asientoDiario(link.value, api.value, tokenCifrado.value, toast, 'EFECTIVO EN BANCO', 'VENTAS', transferenciaFN.value, 'REGISTRO DE VENTA DE PRODUCTOS POR (' + transferenciaFN.value + '), FACTURA #' + noFacturaFN.value);
        await fetchBanco();
      } else {
        avisarBancoOpcional();
      }
      await asientoDiario(link.value, api.value, tokenCifrado.value, toast, 'EFECTIVO EN CAJA', 'VENTAS', efetivoFN.value, 'REGISTRO DE VENTA DE PRODUCTOS POR (' + efetivoFN.value + '), FACTURA #' + noFacturaFN.value);
    }

    if (facturaAcredito.value) {
      const camposCUENTASCOBRAR = await arrayToObjetoFromTablaOffline('cuentas_cobrar');
      //const ultimaFactura = await peticiones(`${link.value}${api.value}/datosmax`, { "tabla": "cuentas_cobrar", "campo": "no_emision" }, 'POST', tokenCifrado.value);
      //facturaAcreditoEmision.value = generadorCodigo(ultimaFactura[0], '', 7);
      facturaAcreditoEmision.value = generarCodigoUnico();

      camposCUENTASCOBRAR.no_emision = facturaAcreditoEmision.value;
      camposCUENTASCOBRAR.no_factura = noFacturaFN.value;

      const originalCliente = JSON.parse(JSON.stringify(clienteSelected.value))

      if(quienCredito.value === 'INSTITUCION'){
          const verificainstitucion = allClientes.value.find(inst=>inst.nombre === institucion.value)
          if(!verificainstitucion){
            const url = link.value + api.value + "/insertar/clientes";
            const jsonDataC = await arrayToObjetoFromTablaOffline('clientes');

                jsonDataC.nombre = institucion.value;
                jsonDataC.codigo = generarCodigoUnico();

         /*   const envioDatos = await enviarDatosPorPost(url, jsonDataC, tokenCifrado.value);*/
            const envioDatos = await peticionesFetchOffline('insertData','clientes', JSON.stringify(jsonDataC));
            if (envioDatos[0] == 'ok') {
                allClientes.value.push(jsonDataC);
                clienteSelected.value = jsonDataC;
            }
          }else{
            clienteSelected.value = verificainstitucion;
          }

      }else if(quienCredito.value === 'AMBAS'){

      }

     camposCUENTASCOBRAR.cod_cliente = clienteSelected.value.codigo;
     camposCUENTASCOBRAR.nombre_cliente = clienteSelected.value.nombre;
     camposCUENTASCOBRAR.cedula_cliente = clienteSelected.value.cedula;
     camposCUENTASCOBRAR.email_cliente = clienteSelected.value.email;
     camposCUENTASCOBRAR.direccion_cliente = clienteSelected.value.direccion;
     camposCUENTASCOBRAR.rnc_cliente = clienteSelected.value.rnc;
     camposCUENTASCOBRAR.nombrecomercial_cliente = clienteSelected.value.n_comercial;


      camposCUENTASCOBRAR.quiencredito = quienCredito.value;
      camposCUENTASCOBRAR.institucion = institucion.value;
      camposCUENTASCOBRAR.cliente = originalCliente.nombre;
      camposCUENTASCOBRAR.fecha_emision = nfecha('fecha');
      //camposCUENTASCOBRAR.monto_credito = total.value;
      camposCUENTASCOBRAR.monto_credito = totalCreditoConInteres.value;
      camposCUENTASCOBRAR.interes = interesCredito.value;
      camposCUENTASCOBRAR.fecha_vencimiento = formatearFecha(fechaCREDITO.value);
      camposCUENTASCOBRAR.cuotas = cuotasCredito.value;
      camposCUENTASCOBRAR.abonado = abonoCREDITO.value;
      camposCUENTASCOBRAR.saldo = totalCreditoConInteres.value;
      camposCUENTASCOBRAR.fecha_pago = formatearFecha(fechaCREDITO.value);
      camposCUENTASCOBRAR.fechas_pago_credito = fechasPagocredito.value;
      camposCUENTASCOBRAR.pagos = JSON.stringify([{ "nopago": "1", "cantidad": abonoCREDITO.value, "turno": '', "cajero": cajeroFN.value, "metodo": metodoPagoCREDITO.value, "fecha": nfecha('fecha'), "hora": nfecha('hora'), "saldo": totalCreditoConInteres.value }]);
      camposCUENTASCOBRAR.estatus = 'PENDIENTE';
      camposCUENTASCOBRAR.hora = nfecha('hora');
      camposCUENTASCOBRAR.vendedor = vendedorFN.value;
      camposCUENTASCOBRAR.delivery = deliveryFN.value;
      //camposCUENTASCOBRAR.totalcreditoconinteres = totalCreditoConInteres.value;
      camposCUENTASCOBRAR.valorcuotascredito = valorCuotasCredito.value;
      camposCUENTASCOBRAR.tipocredito = tipoCredito.value;
      camposCUENTASCOBRAR.tiempocredito = tiempoCredito.value;
      camposCUENTASCOBRAR.nota = notaCREDITO.value;
      camposCUENTASCOBRAR.created_at = nfecha('timestamp');
      camposCUENTASCOBRAR.updated_at = nfecha('timestamp');
      camposCUENTASCOBRAR.almacen = datosEmpresa.empresa.nombre;

      const urlCUENTASCOBRAR = link.value + api.value + "/insertar/cuentas_cobrar";
/*      const envioDatosCUENTASCOBRAR = await enviarDatosPorPost(urlCUENTASCOBRAR, camposCUENTASCOBRAR, tokenCifrado.value);*/
      const envioDatosCUENTASCOBRAR = await peticionesFetchOffline('insertData','cuentas_cobrar', JSON.stringify(camposCUENTASCOBRAR));

      await asientoDiario(link.value, api.value, tokenCifrado.value, toast, 'CUENTAS POR COBRAR', 'VENTAS', saldoCREDITO.value, 'REGISTRO DE VENTA DE PRODUCTOS PENDIENTES DE PAGO POR (' + total.value + '), FACTURA #' + noFacturaFN.value);

      if (metodoPagoCREDITO.value == 'EFECTIVO') {
        await asientoDiario(link.value, api.value, tokenCifrado.value, toast, 'EFECTIVO EN CAJA', 'VENTAS', efetivoFN.value, 'REGISTRO DE VENTA DE PRODUCTOS POR (' + efetivoFN.value + '), FACTURA #' + noFacturaFN.value);
      } else if (metodoPagoCREDITO.value == 'TARJETA') {
        const transaccion = await crearTransferencia(link.value, api.value, tokenCifrado.value, toast, noFacturaFN.value, tarjetaFN.value, cuentaBancaria.value, clienteSelected.value.nombre, datosEmpresa.empresa.nombre);
        await asientoDiario(link.value, api.value, tokenCifrado.value, toast, 'EFECTIVO EN BANCO', 'VENTAS', tarjetaFN.value, 'REGISTRO DE VENTA DE PRODUCTOS POR (' + tarjetaFN.value + '), FACTURA #' + noFacturaFN.value);
      } else if (metodoPagoCREDITO.value == 'TRANSFERENCIA') {
        const transaccionT = await crearTransferencia(link.value, api.value, tokenCifrado.value, toast, noFacturaFN.value, transferenciaFN.value, cuentaBancaria.value, clienteSelected.value.nombre, datosEmpresa.empresa.nombre);
        await asientoDiario(link.value, api.value, tokenCifrado.value, toast, 'EFECTIVO EN BANCO', 'VENTAS', transferenciaFN.value, 'REGISTRO DE VENTA DE PRODUCTOS POR (' + transferenciaFN.value + '), FACTURA #' + noFacturaFN.value);
      }
    }

    if (facturaApartado.value) {
      const camposApartado = await arrayToObjetoFromTabla(link.value + api.value, tokenCifrado.value, 'apartados');

      facturaAcreditoEmision.value = generarCodigoUnico()

      camposApartado.no_emision = facturaAcreditoEmision.value;
      camposApartado.no_factura = noFacturaFN.value;
      camposApartado.cod_cliente = clienteSelected.value.codigo;
      camposApartado.nombre_cliente = clienteSelected.value.nombre;
      camposApartado.cedula_cliente = clienteSelected.value.cedula;
      camposApartado.email_cliente = clienteSelected.value.email;
      camposApartado.direccion_cliente = clienteSelected.value.direccion;

      camposApartado.fecha_emision = nfecha('fecha');
      camposApartado.monto_credito = total.value;

      camposApartado.fecha_vencimiento = formatearFecha(apartado.value.vencimiento);
      camposApartado.tiempo = apartado.value.tiempo;
      camposApartado.cuotas = apartado.value.cuotas || 1;
      camposApartado.abonado = apartado.value.abono;
      camposApartado.saldo = apartado.value.saldo;

     // camposApartado.productos = JSON.stringify(productosVenta.value);
     
      const productosLimpios = productosVenta.value.map(p => {
        const copia = { ...p };
        delete copia.caracteristicas;
        return copia;
      });

      camposApartado.productos = JSON.stringify(productosLimpios);




      camposApartado.pagos = JSON.stringify([{ "nopago": "1", "cantidad": apartado.value.abono, "turno": '', "cajero": cajeroFN.value, "metodo": metodoPagoApartado.value, "fecha": nfecha('fecha'), "hora": nfecha('hora'), "saldo": apartado.value.saldo }]);

      camposApartado.estatus = 'PENDIENTE';
      camposApartado.hora = nfecha('hora');
      camposApartado.vendedor = vendedorFN.value;
      camposApartado.nota = apartado.value.nota || nota.value;
      camposApartado.created_at = nfecha('timestamp');
      camposApartado.updated_at = nfecha('timestamp');

      const urlApartado = link.value + api.value + "/insertar/apartados";
/*      const envioDatosApartado = await enviarDatosPorPost(urlApartado, camposApartado, tokenCifrado.value);*/
      const envioDatosApartado = await peticionesFetchOffline('insertData','apartados', JSON.stringify(camposApartado));

      await asientoDiario(link.value, api.value, tokenCifrado.value, toast, 'CUENTAS POR COBRAR', 'VENTAS', saldoCREDITO.value, 'REGISTRO DE VENTA DE PRODUCTOS PENDIENTES DE PAGO POR (' + total.value + '), FACTURA #' + noFacturaFN.value);

      if (metodoPagoCREDITO.value == 'EFECTIVO') {
        await asientoDiario(link.value, api.value, tokenCifrado.value, toast, 'EFECTIVO EN CAJA', 'VENTAS', efetivoFN.value, 'REGISTRO DE VENTA DE PRODUCTOS POR (' + efetivoFN.value + '), FACTURA #' + noFacturaFN.value);
      } else if (metodoPagoCREDITO.value == 'TARJETA') {
        const transaccion = await crearTransferencia(link.value, api.value, tokenCifrado.value, toast, noFacturaFN.value, tarjetaFN.value, cuentaBancaria.value, clienteSelected.value.nombre, datosEmpresa.empresa.nombre);
        await asientoDiario(link.value, api.value, tokenCifrado.value, toast, 'EFECTIVO EN BANCO', 'VENTAS', tarjetaFN.value, 'REGISTRO DE VENTA DE PRODUCTOS POR (' + tarjetaFN.value + '), FACTURA #' + noFacturaFN.value);
      } else if (metodoPagoCREDITO.value == 'TRANSFERENCIA') {
        const transaccionT = await crearTransferencia(link.value, api.value, tokenCifrado.value, toast, noFacturaFN.value, transferenciaFN.value, cuentaBancaria.value, clienteSelected.value.nombre, datosEmpresa.empresa.nombre);
        await asientoDiario(link.value, api.value, tokenCifrado.value, toast, 'EFECTIVO EN BANCO', 'VENTAS', transferenciaFN.value, 'REGISTRO DE VENTA DE PRODUCTOS POR (' + transferenciaFN.value + '), FACTURA #' + noFacturaFN.value);
      }
    }



    const nStock = await restarStock(`${link.value}${api.value}/restarStockN`, productosVenta.value, 'POST', tokenCifrado.value);
    efetivoFN.value = 0.00;
    tarjetaFN.value = 0.00;
    transferenciaFN.value = 0.00;
    pagaCon.value = 0.00;
    suCambio.value = 0.00;
    

     /////////////----ACTUALIZAR EL ESTADO DE LA COTIZACION -----////////
     if(cotizacionConvertida.value){
        const datosCotizacion = await peticionesFetchOffline('getDataByField', 'cotizacion','no_cotizacion',cotizacionConvertida.value);
        if(datosCotizacion){
            const urlCoti = link.value+api.value+"/actualizarcampos/cotizacion";
            datosCotizacion.estado_cotizacion = 'CONVERTIDA'
            datosCotizacion.no_factura = noFacturaFN.value
/*            const envioDatos = await enviarDatosPorPost(urlCoti, datosCotizacion,tokenCifrado.value);*/
            const envioDatos = await peticionesFetchOffline('updateData','cotizacion', JSON.stringify(datosCotizacion));
        if (envioDatos[0] == 'ok') {
            toast.removeAllGroups();
           toast.add({ severity: 'success', summary: 'Éxito', detail: 'Estado de Cotizacion Actualizados', life: 3000 });
        }else{
          toast.add({ severity: 'error', summary: 'Error', detail: 'Falló al actualizar el estado de la cotización.', life: 3000 });
        }

        }
     }

    /////////////////////////----CREAR NOTIFICAION DE VENTA----///////////
    /********************************************************************/
    const camposNotificacion = await arrayToObjetoFromTabla('notificaciones');
    const urlNotificacion = link.value + api.value + "/insertar/notificaciones";
    if (camposNotificacion.hasOwnProperty('created_at')) {
      camposNotificacion.created_at = nfecha('timestamp');
      camposNotificacion.updated_at = nfecha('timestamp');
    }

    camposNotificacion.titulo = 'Nueva Venta';
    camposNotificacion.mensaje = 'Se ha realizado la Factura #' + noFacturaFN.value;

    var impresionpagina = link.value + '/receipt/factura?factura=' + noFacturaFN.value;
    const encodedUrl = encodeURIComponent(impresionpagina);

    camposNotificacion.accion = '/pageviewer/' + encodedUrl;

    const envioDatosNotificacion = await peticionesFetchOffline('insertData', 'notificaciones',JSON.stringify(camposNotificacion));

    /********************************************************************/

    await fetchAndSetupData();

    descuentoEntero.value = '0.00';
    descuentoPorcentaje.value = '0.00';
    // Resetear tipo de impuesto y comprobante según tabladefault.comprobantes
    const comprobanteDefault = tabladefault.value?.comprobantes || 'NORMAL';
    comprobante.value = comprobanteDefault;
    if (comprobanteDefault === 'FISCAL') {
      tipoImpuestoFactura.value = 'AGREGADO';
    } else if (comprobanteDefault === 'FINAL') {
      tipoImpuestoFactura.value = 'INCLUIDO';
    } else {
      tipoImpuestoFactura.value = 'NO';
    }

     toast.removeAllGroups();
    toast.add({ severity: 'success', summary: 'Exito', detail: 'Factura Creada con éxito', life: 3000 });
    //const impresionpagina = `${link.value}/receipt/ticket?factura=${noFacturaFN.value}`;
    var impresionpagina = link.value + '/vista/impresoratermica.php?factura=' + noFacturaFN.value;


    //clienteSelected.value = allClientes.value.find(client=>client.codigo === '0000000')
    //window.localStorage.setItem('clienteLocalStorage',JSON.stringify(clienteSelected.value))


    const datosVenta = ventasGuardadas.value.find(venta => venta.cod_cliente === clienteSelected.value.codigo);

    if (datosVenta) {
      const envio = await peticionesFetchOffline('deleteEntry','ventasenproceso', datosVenta.id);
      if (envio[0] == 'ok') {
        ventasGuardadas.value = null;
        loading.value = false;
        fetchventasGuardadas();
      } else {
        loading.value = false;
      }
    }

    limpiarProductos();
    await fetchClientes();
    await fetchDefault();

    abonoCREDITO.value = '0.00';
    visiblecobrar.value = false;
    incluirImpuesto.value = false;
    agregarImpuesto.value = false;
    garantiaSelect.value = 'VENTAS' || 'Ninguna'
    fnNota()
    /***********************************************************/
    if (configuracionFactura.value.automatico != 'True') {
      loading.value = false;
      Swal.fire({
        title: 'Elige una opción',
        icon: 'question',
        showCancelButton: true,
        showDenyButton: true,
        showConfirmButton: true,
        confirmButtonText: 'WhatsApp',
        denyButtonText: 'Imprimir',
        cancelButtonText: 'PDF',
        focusDeny: true
      }).then(async (result) => {
        if (result.isConfirmed) {

          //enviarWhatsAppRef.value = true
          datosFactCoti.value.tipo = 'Factura';
          await showWhatsAppModal();

        } else if (result.isDenied) {


           datosFactCoti.value.numero = noFacturaFN.value;
           datosFactCoti.value.tipo = 'Factura'
           visiblePrint.value = true



        } else if (result.dismiss === Swal.DismissReason.cancel) {
          datosFactCoti.value.numero = noFacturaFN.value;
          datosFactCoti.value.tipo = 'Factura';
          await fnImpresoraGrande();
        }
      });
    } else {

      Swal.fire({
        title: 'Seleccione una opción',
        text: "¿Qué desea hacer?",
        icon: 'question',
        showCancelButton: true,
        showDenyButton: true, // Mostrar el tercer botón
        confirmButtonText: 'Imprimir',
        denyButtonText: 'Cobrar sin imprimir',
        cancelButtonText: 'Salir',
        reverseButtons: true,
      }).then((result) => {
        if (result.isConfirmed) {


           datosFactCoti.value.numero = noFacturaFN.value;
           datosFactCoti.value.tipo = 'Factura'
           visiblePrint.value = true

        } else if (result.isDenied) {
          // Lógica para "Cobrar sin imprimir"
          if (estadoFN.value === 'Cobrado') {
            // Aquí podrías implementar la lógica de cobro sin impresión.
            fnAbrirCaja();
          }
        } else if (result.dismiss === Swal.DismissReason.cancel) {
          // Lógica para la opción "Salir"
          console.log("Saliste sin realizar acciones.");
        }
      });

      clienteSelected.value = allClientes.value.find(cliente => cliente.codigo === '0000000');
    }

    /*************************************************************/

    await fetchFacturas();
    loading.value = false;
  } else {
    loading.value = false;
    toast.add({ severity: 'error', summary: 'Error', detail: 'Error al crear la Factura', life: 3000 });
  }

  //configuracionFactura.value

};


/************************************************************/
const actualizarFactura = async () => {
  loading.value = true;

  if (clienteSelected.value.nombre == '') {
    loading.value = false;
    toast.add({ severity: 'error', summary: 'Error', detail: 'Debe Agregar un Cliente', life: 3000 });
    return;
  }

  if (documentoEditado.value != 'Factura'){
    toast.add({ severity: 'error', summary: 'Error', detail: 'No es una factura', life: 3000 });
    return;
  }

/*  const datosFactura = await enviarSolicitudGet(`${link.value+api.value}/datoscampo/facturas/no_factura/${numerodocumentoEditado.value}`, tokenCifrado.value);*/
  const datosFactura = await peticionesFetchOffline('getDataByField', 'facturas','no_factura',numerodocumentoEditado.value);

  if (!datosFactura) {
    toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo Cargar la factura', life: 3000 });
    return;
  }

  if (metodoPago.value == 'EFECTIVO') {
    efetivoFN.value = total.value;
  }

  const datosFN = {
    id: datosFactura.id,
    nofactura: datosFactura.no_factura,
    cliente: clienteSelected.value,
    canalventa: datosEmpresa.empresa.nombre,
    comprobanteFN: comprobanteFN.value,
    tipocomprobanteFN: mensajeComprobantes.value[comprobante.value],
    estadoFN: estadoFN.value,
    metodoPagoFN: metodoPago.value,
    efectivoFN: efetivoFN.value,
    tarjetaFN: tarjetaFN.value,
    transferenciaFN: transferenciaFN.value,
    vendedorFN: datosFactura.vendedor,
    cajeroFN: cajeroFN.value,
    instaladorFN: datosFactura.instalador,
    meseroFN: datosFactura.mesero,
    mesaFN: mesaFN.value,
    deliveryFN: datosFactura.delivery,
    subtotal: subtotal.value,
    total: total.value,
    impuesto: impuesto.value,
    //entidad_financiera:institucion.value;
    //ganancia: gananciaFN.value,
    descuento: descuento.value,
    nota: nota.value,
    created_at: datosFactura.created_at,
    productosArray: productosVenta.value,
  };

  const productosFacturaOriginal = JSON.parse(datosFactura.productos);

  const actualizarStock = async(id, cantidad, accion) => {
    await actualizarStockProducto(id,cantidad,accion)
  };

  productosVenta.value.forEach(productoActual => {
    const datosProd = productosArray.value.find(prod=>prod.codigo === productoActual.codigo)
    const productoOriginal = productosFacturaOriginal.find(prod => prod.codigo === productoActual.codigo);
    if (productoOriginal) {
      const diferenciaCantidad = (productoActual.cantidad - Number(productoOriginal.cantidad));
      if (diferenciaCantidad > 0) {
         if(datosProd){
            actualizarStock(datosProd.id, diferenciaCantidad, 'restar');
         }
      } else if (diferenciaCantidad < 0) {
         if(datosProd){
           actualizarStock(datosProd.id, -diferenciaCantidad, 'sumar');
         }
      }
    } else {
      // Producto nuevo, restar todo el stock
      //actualizarStock(productoActual.id, productoActual.cantidad, 'restar');
    }
  });

  productosFacturaOriginal.forEach(productoOriginal => {
    const productoActual = productosVenta.value.find(prod => prod.id === productoOriginal.id);
    if (!productoActual) {
      // Producto eliminado, sumar todo el stock
      actualizarStock(productoOriginal.id, productoOriginal.cantidad, 'sumar');
    }
  });

  loading.value = false;

  const url = `${link.value}${api.value}/actualizarcampos/facturas`;
  const retorno = await facturaActualizar(url, datosFN, 'POST', tokenCifrado.value);

  if (retorno[0] == 'ok') {
     toast.removeAllGroups();
    toast.add({ severity: 'success', summary: 'Exito', detail: 'Factura Actualizada con éxito', life: 3000 });
    const impresionpagina = `${link.value}/receipt/ticket?factura=${noFacturaFN.value}`;
    visiblecobrar.value = false;
    loading.value = false;
    //clienteSelected.value = allClientes.value.find(client=>client.codigo === '0000000')
  } else {
    loading.value = false;
    toast.add({ severity: 'error', summary: 'Error', detail: 'Error al Actualizar la Factura', life: 3000 });
  }
};


/************************************************************/
const continuarGuardandoPreFactura = async () => {
  loading.value = true;

  // Validar que haya cliente seleccionado
  if (
    clienteSelected.value === null ||
    typeof clienteSelected.value !== 'object' ||
    !clienteSelected.value.nombre ||
    clienteSelected.value.nombre.trim() === ''
  ) {
    loading.value = false;
    toast.add({ severity: 'error', summary: 'Error', detail: 'Debe Agregar un Cliente', life: 3000 });
    return;
  }

  // Preparar datos de la pre-factura
  const datosPreFactura = {
    nota: nota.value,
    productos: JSON.stringify(productosVenta.value),
    cliente: clienteSelected.value.nombre,
    cod_cliente: clienteSelected.value.codigo,
    no_factura: noFacturaFN.value,
    total: total.value,
    estado: 'PENDIENTE',
    fecha: nfecha('fecha'),
    no_orden: noFacturaFN.value,
    created_at: nfecha('timestamp'),
    updated_at: nfecha('timestamp')
  };

  // Verificar que la pre-factura no exista
  const verificaPreFactura = await peticionesFetchOffline('getDataByField', 'pre_facturas', 'no_factura', noFacturaFN.value);

  if (verificaPreFactura?.no_factura && verificaPreFactura?.no_factura == noFacturaFN.value) {
    toast.add({ severity: 'error', summary: 'Error', detail: 'Esta Pre-Factura Ya existe', life: 3000 });
    loading.value = false;
    return;
  }

  // Insertar pre-factura (SIN descontar stock)
  const retorno = await peticionesFetchOffline('insertData', 'pre_facturas', JSON.stringify(datosPreFactura));

  if (retorno[0] == 'ok') {
    toast.removeAllGroups();
    toast.add({ severity: 'success', summary: 'Éxito', detail: 'Pre-Factura Creada con éxito (Sin descontar stock)', life: 3000 });

    // Limpiar productos y reiniciar valores
    limpiarProductos();
    await fetchClientes();

    // Eliminar venta guardada si existe
    const datosVenta = ventasGuardadas.value.find(venta => venta.cod_cliente === clienteSelected.value.codigo);
    if (datosVenta) {
      const envio = await peticionesFetchOffline('deleteEntry', 'ventasenproceso', datosVenta.id);
      if (envio[0] == 'ok') {
        ventasGuardadas.value = [];
        await fetchventasGuardadas();
      }
    }

    visiblecobrar.value = false;

    // Preguntar al usuario qué formato de impresión prefiere
    if (window.electron) {
      const datosEmpresa2 = JSON.stringify(enviarDatosLocalStorage());

      // Obtener datos completos de la pre-factura para imprimir
      const datosPreFacturaCompleta = await peticionesFetchOffline('getDataByField', 'pre_facturas', 'no_factura', noFacturaFN.value);

      if (datosPreFacturaCompleta) {
        // Crear copia limpia del cliente sin referencias circulares
        const clienteLimpio = {
          codigo: clienteSelected.value.codigo,
          nombre: clienteSelected.value.nombre,
          direccion: clienteSelected.value.direccion || '',
          rnc: clienteSelected.value.rnc || '',
          email: clienteSelected.value.email || ''
        };

        // Preguntar al usuario qué formato desea
        const { value: formato } = await Swal.fire({
          title: '¿Cómo deseas ver la Pre-Factura?',
          text: 'Ambas opciones se abrirán en PDF para que puedas imprimir o descargar',
          icon: 'question',
          showDenyButton: true,
          showCancelButton: true,
          confirmButtonText: 'Ticket (80mm)',
          denyButtonText: 'Carta (A4)',
          cancelButtonText: 'No mostrar'
        });

        if (formato === true) {
          // Ticket 80mm
          await window.electron.ipcRenderer.invoke('ticketprefactura', JSON.stringify(datosPreFacturaCompleta), datosEmpresa2);
        } else if (formato === false) {
          // Carta A4
          await window.electron.ipcRenderer.invoke('prefacturaPDF', JSON.stringify(datosPreFacturaCompleta), JSON.stringify(clienteLimpio), datosEmpresa2);
        }
      }
    }

    loading.value = false;
    documentoActual.value = 'Pre-Factura: ' + noFacturaFN.value;
    numerodocumentoEditado.value = noFacturaFN.value;
  } else {
    loading.value = false;
    toast.add({ severity: 'error', summary: 'Error', detail: 'Error al Crear la Pre-Factura', life: 3000 });
  }
};

/************************************************************/
const continuarGuardandoOrden = async () => {
  loading.value = true;

  // Validar que haya cliente seleccionado
  if (
    clienteSelected.value === null ||
    typeof clienteSelected.value !== 'object' ||
    !clienteSelected.value.nombre ||
    clienteSelected.value.nombre.trim() === ''
  ) {
    loading.value = false;
    toast.add({ severity: 'error', summary: 'Error', detail: 'Debe Agregar un Cliente', life: 3000 });
    return;
  }

  // Preparar datos de la orden
  const datosOrden = {
    nota: nota.value,
    materiales: '',  // Campo materiales vacío por ahora
    productos: JSON.stringify(productosVenta.value),
    cliente: clienteSelected.value.nombre,
    cod_cliente: clienteSelected.value.codigo,
    no_factura: noFacturaFN.value,
    total: total.value,
    estado: 'PENDIENTE',
    fecha: nfecha('fecha'),
    no_orden: noFacturaFN.value,
    created_at: nfecha('timestamp'),
    updated_at: nfecha('timestamp')
  };

  // Verificar que la orden no exista
  const verificaOrden = await peticionesFetchOffline('getDataByField', 'ordenes', 'no_orden', noFacturaFN.value);

  if (verificaOrden?.no_orden && verificaOrden?.no_orden == noFacturaFN.value) {
    toast.add({ severity: 'error', summary: 'Error', detail: 'Esta Orden Ya existe', life: 3000 });
    loading.value = false;
    return;
  }

  // Insertar orden (SIN descontar stock)
  const retorno = await peticionesFetchOffline('insertData', 'ordenes', JSON.stringify(datosOrden));

  if (retorno[0] == 'ok') {
    toast.removeAllGroups();
    toast.add({ severity: 'success', summary: 'Éxito', detail: 'Orden Creada con éxito (Sin descontar stock)', life: 3000 });

    // Limpiar productos y reiniciar valores
    limpiarProductos();
    await fetchClientes();

    // Eliminar venta guardada si existe
    const datosVenta = ventasGuardadas.value.find(venta => venta.cod_cliente === clienteSelected.value.codigo);
    if (datosVenta) {
      const envio = await peticionesFetchOffline('deleteEntry', 'ventasenproceso', datosVenta.id);
      if (envio[0] == 'ok') {
        ventasGuardadas.value = [];
        await fetchventasGuardadas();
      }
    }

    visiblecobrar.value = false;

    // Preguntar al usuario qué formato de impresión prefiere
    if (window.electron) {
      const datosEmpresa2 = JSON.stringify(enviarDatosLocalStorage());

      // Obtener datos completos de la orden para imprimir
      const datosOrdenCompleta = await peticionesFetchOffline('getDataByField', 'ordenes', 'no_orden', noFacturaFN.value);

      if (datosOrdenCompleta) {
        // Crear copia limpia del cliente sin referencias circulares
        const clienteLimpio = {
          codigo: clienteSelected.value.codigo,
          nombre: clienteSelected.value.nombre,
          direccion: clienteSelected.value.direccion || '',
          rnc: clienteSelected.value.rnc || '',
          email: clienteSelected.value.email || ''
        };

        // Preguntar al usuario qué formato desea
        const { value: formato } = await Swal.fire({
          title: '¿Cómo deseas ver la Orden?',
          text: 'Ambas opciones se abrirán en PDF para que puedas imprimir o descargar',
          icon: 'question',
          showDenyButton: true,
          showCancelButton: true,
          confirmButtonText: 'Ticket (80mm)',
          denyButtonText: 'Carta (A4)',
          cancelButtonText: 'No mostrar'
        });

        if (formato === true) {
          // Ticket 80mm
          await window.electron.ipcRenderer.invoke('ticketOrden', JSON.stringify(datosOrdenCompleta), datosEmpresa2);
        } else if (formato === false) {
          // Carta A4
          await window.electron.ipcRenderer.invoke('ordenPDF', JSON.stringify(datosOrdenCompleta), JSON.stringify(clienteLimpio), datosEmpresa2);
        }
      }
    }

    loading.value = false;
    documentoActual.value = 'Orden: ' + noFacturaFN.value;
    numerodocumentoEditado.value = noFacturaFN.value;
  } else {
    loading.value = false;
    toast.add({ severity: 'error', summary: 'Error', detail: 'Error al Crear la Orden', life: 3000 });
  }
};

/************************************************************/
const continuarGuardandoApartado = async () => {
  loading.value = true;

  // Validar que haya cliente seleccionado
  if (
    clienteSelected.value === null ||
    typeof clienteSelected.value !== 'object' ||
    !clienteSelected.value.nombre ||
    clienteSelected.value.nombre.trim() === ''
  ) {
    loading.value = false;
    toast.add({ severity: 'error', summary: 'Error', detail: 'Debe Agregar un Cliente', life: 3000 });
    return;
  }

      const productosLimpios = productosVenta.value.map(p => {
        const copia = { ...p };
        delete copia.caracteristicas;
        return copia;
      });

  // Preparar datos del apartado
  const datosApartado = {
    almacen: datosEmpresa.empresa.nombre || 'TM POS RD',
    no_emision: noFacturaFN.value,
    no_factura: noFacturaFN.value,
    cod_cliente: clienteSelected.value.codigo,
    nombre_cliente: clienteSelected.value.nombre,
    cedula_cliente: clienteSelected.value.rnc || '',
    email_cliente: clienteSelected.value.email || '',
    direccion_cliente: clienteSelected.value.direccion || '',
    //productos: JSON.stringify(productosVenta.value),
    fecha_emision: nfecha('fecha'),
    hora: nfecha('hora'),
    fecha_vencimiento: '',
    monto_credito: total.value,
    cuotas: '',
    tiempo: '',
    fecha_ultimo_pago: '',
    proxima_fecha_pago: '',
    abonado: '0',
    saldo: total.value,
    estatus: 'PENDIENTE',
    vendedor: datosEmpresa.usuario.nombre,
    pagos: JSON.stringify([]),
    nota: nota.value,
    created_at: nfecha('timestamp'),
    updated_at: nfecha('timestamp'),
    identificadordb: ''
  };

    datosApartado.productos = JSON.stringify(productosLimpios);

  // Verificar que el apartado no exista
  const verificaApartado = await peticionesFetchOffline('getDataByField', 'apartados', 'no_factura', noFacturaFN.value);

  if (verificaApartado?.no_factura && verificaApartado?.no_factura == noFacturaFN.value) {
    toast.add({ severity: 'error', summary: 'Error', detail: 'Este Apartado Ya existe', life: 3000 });
    loading.value = false;
    return;
  }

  // Insertar apartado Y DESCONTAR STOCK
  const retorno = await peticionesFetchOffline('insertData', 'apartados', JSON.stringify(datosApartado));

  if (retorno[0] == 'ok') {
    // DESCONTAR STOCK (esta es la diferencia con Orden y Pre-Factura)
    await restarStock(`${link.value}${api.value}/restarStockN`, productosVenta.value, 'POST', tokenCifrado.value);

    toast.removeAllGroups();
    toast.add({ severity: 'success', summary: 'Éxito', detail: 'Apartado Creado con éxito (Stock descontado)', life: 3000 });

    // Limpiar productos y reiniciar valores
    limpiarProductos();
    await fetchClientes();

    // Eliminar venta guardada si existe
    const datosVenta = ventasGuardadas.value.find(venta => venta.cod_cliente === clienteSelected.value.codigo);
    if (datosVenta) {
      const envio = await peticionesFetchOffline('deleteEntry', 'ventasenproceso', datosVenta.id);
      if (envio[0] == 'ok') {
        ventasGuardadas.value = [];
        await fetchventasGuardadas();
      }
    }

    visiblecobrar.value = false;

    // Preguntar al usuario qué formato de impresión prefiere
    if (window.electron) {
      const datosEmpresa2 = JSON.stringify(enviarDatosLocalStorage());

      // Obtener datos completos del apartado para imprimir
      const datosApartadoCompleto = await peticionesFetchOffline('getDataByField', 'apartados', 'no_factura', noFacturaFN.value);

      if (datosApartadoCompleto) {
        // Crear copia limpia del cliente sin referencias circulares
        const clienteLimpio = {
          codigo: clienteSelected.value.codigo,
          nombre: clienteSelected.value.nombre,
          direccion: clienteSelected.value.direccion || '',
          rnc: clienteSelected.value.rnc || '',
          email: clienteSelected.value.email || ''
        };

        // Preguntar al usuario qué formato desea
        const { value: formato } = await Swal.fire({
          title: '¿Cómo deseas ver el Apartado?',
          text: 'Ambas opciones se abrirán en PDF para que puedas imprimir o descargar',
          icon: 'question',
          showDenyButton: true,
          showCancelButton: true,
          confirmButtonText: 'Ticket (80mm)',
          denyButtonText: 'Carta (A4)',
          cancelButtonText: 'No mostrar'
        });

        if (formato === true) {
          // Ticket 80mm
          await window.electron.ipcRenderer.invoke('ticketApartado', JSON.stringify(datosApartadoCompleto), datosEmpresa2);
        } else if (formato === false) {
          // Carta A4
          await window.electron.ipcRenderer.invoke('apartadoPDF', JSON.stringify(datosApartadoCompleto), JSON.stringify(clienteLimpio), datosEmpresa2);
        }
      }
    }

    loading.value = false;
    documentoActual.value = 'Apartado: ' + noFacturaFN.value;
    numerodocumentoEditado.value = noFacturaFN.value;
  } else {
    loading.value = false;
    toast.add({ severity: 'error', summary: 'Error', detail: 'Error al Crear el Apartado', life: 3000 });
  }
};

/************************************************************/
const continuarGuardandoCotizacion = async () => {
loading.value = true
      if (clienteSelected.value.nombre == '') {
        loading.value = false
        toast.add({ severity: 'error', summary: 'Error', detail: 'Debe Agregar un Cliente', life: 3000 });
        return
      }



const datosFN = {
 nofactura : noFacturaFN.value,
 cliente:clienteSelected.value,
 comprobanteFN : comprobanteFN.value,
 tipocomprobanteFN : mensajeComprobantes.value[comprobante.value],
 estadoFN : estadoFN.value ,
 metodoPagoFN : metodoPago.value ,
 efectivoFN : efetivoFN.value ,
 tarjetaFN : tarjetaFN.value ,
 transferenciaFN : transferenciaFN.value ,
 vendedorFN : vendedorFN.value ,
 cajeroFN : cajeroFN.value ,
 instaladorFN : instaladorFN.value ,
 meseroFN : meseroFN.value ,
 mesaFN : mesaFN.value ,
 deliveryFN : deliveryFN.value,
 subtotal : subtotal.value,
 total : total.value,
 entidad_financiera:institucion.value,
 impuesto : impuesto.value,
 ganancia : gananciaFN.value,
 vencimiento : agregarDiasalaFechaActual(Number(datosDefault.value.dias_cotizacion)),
 descuento : descuento.value,
 nota : nota.value,
 almacen : datosEmpresa.empresa.nombre,
 productosArray : productosVenta.value,
}

  const url = `${link.value}${api.value}/insertar/cotizacion`;
  const retorno = await cotizacionNueva(url, datosFN, 'POST',tokenCifrado.value);

  if (retorno[0] == 'ok') {

   toast.removeAllGroups();
     toast.removeAllGroups();
    toast.add({ severity: 'success', summary: 'Exito', detail: 'Factura Creada con éxito', life: 3000 });
    const impresionpagina = `${link.value}/receipt/factura?cotizacion=${noFacturaFN.value}`;
    limpiarProductos();
    await fetchClientes();
    efetivoFN.value = 0.00;
    tarjetaFN.value = 0.00;
    transferenciaFN.value = 0.00;
    const datosVenta = ventasGuardadas.value.find(venta=>venta.cod_cliente === clienteSelected.value.codigo);

    if (datosVenta) {
/*        const envio = await peticiones(link.value+api.value+'/borrar/ventasenproceso',{"id":datosVenta.id},'POST',tokenCifrado.value);*/
        const envio = await peticionesFetchOffline('deleteEntry','ventasenproceso', datosVenta.id);
        if (envio[0] == 'ok') {
          ventasGuardadas.value = [];
          await fetchventasGuardadas();
        }
       }
    visiblecobrar.value = false;


/*   if (datosConfiguracion.value.tipo_impresora == 'Impresora Normal') {
      if(window.electron){
         window.electron.ipcRenderer.invoke('open-new-window', impresionpagina,'url')
       }else{
         toast.add({ severity: 'error', summary: 'Upps', detail: 'Esta funcion es solo para la aplicacion Desktop', life: 3000 });
     }
   }else{
         const datosEmpresa = JSON.stringify(enviarDatosLocalStorage() )
      if(window.electron){
        window.electron.ipcRenderer.invoke('ticketcotizacion',noFacturaFN.value,datosEmpresa);
       }else{
         toast.add({ severity: 'error', summary: 'Upps', detail: 'Esta funcion es solo para la aplicacion Desktop', life: 3000 });
     }

   }*/


    await fetchCotizaciones()
    tipoFactura.value = 'factura'
    loading.value = false

    datosFactCoti.value.tipo = 'Cotizacion'
    datosFactCoti.value.impresora = 'Tinta'
    datosFactCoti.value.numero = noFacturaFN.value
    visiblePrint.value = true


  } else {
    loading.value = false
    toast.add({ severity: 'error', summary: 'Error', detail: 'Error al crear la Cotizacion', life: 3000 });
  }
};

/************************************************************/
const actualizarCotizacion = async()=>{


/*    const datosCotizacion = await peticionesFetch(`${link.value}${api.value}`,`datoscampo/cotizacion/no_cotizacion/${datosFactCoti.value.numero}`,{},tokenCifrado.value,'GET');*/
    const datosCotizacion = await peticionesFetchOffline('getDataByField', 'cotizacion','no_cotizacion',datosFactCoti.value.numero);


  const url = link.value+api.value+"/actualizarcampos/cotizacion";
  if (!datosCotizacion) {
    console.error("Datos incompletos, no se puede actualizar.");
    toast.add({ severity: 'error', summary: 'Error', detail: 'Datos incompletos, no se puede actualizar.', life: 3000 });
    return;
  }

  if (datosCotizacion.hasOwnProperty('created_at')) {
      datosCotizacion.updated_at = nfecha('timestamp')
    }

  const productos = productosVenta.value.map(prods=>{
    const impuesto = Number(prods.precio_venta) * (prods.impuestos / 100);
    return {
    "codigo":prods.codigo,
    "nombre":prods.nombre,
    "categoria":prods.categoria,
    "empaque":prods.empaque,
    "cantidad":prods.cantidad,
    "precio":prods.precio_venta,
    "precio_venta":prods.precio_venta,
    "descuento":prods.descuento,
    "impuesto_venta":prods.impuesto_venta,
    "impuestos":prods.impuestos,
    //"impuesto":impuesto,
    "impuesto": prods.impuesto_venta,
    "ganancia":prods.ganancia,
    "stock":prods.stock,
    "imagen":prods.imagen}
  })


    datosCotizacion.fecha_emision = nfecha('fecha');
    datosCotizacion.hora = nfecha('hora');
   
    datosCotizacion.subtotal = subtotal.value;
    datosCotizacion.total = total.value;
    datosCotizacion.impuesto = impuesto.value;

 
    datosCotizacion.productos = JSON.stringify(productos)
    datosCotizacion.nota = nota.value


/*  const envioDatos = await enviarDatosPorPost(url, datosCotizacion,tokenCifrado.value);*/
  const envioDatos = await peticionesFetchOffline('updateData','cotizacion', JSON.stringify(datosCotizacion));
  if (envioDatos[0] == 'ok') {
    clienteSelected.value = allClientes.value.find(client=>client.codigo === '0000000')
      toast.removeAllGroups();
     toast.add({ severity: 'success', summary: 'Éxito', detail: 'Datos Actualizados', life: 3000 });
  }else{
    toast.add({ severity: 'error', summary: 'Error', detail: 'Fallo al actualizar los datos.', life: 3000 });
  }


}
/************************************************************/
const actualizarPrecioProducto = () => {

  const datosProd = productosArray.value.find(prod=>prod.codigo === productoSeleccionado.value.codigo)

  const precioElegido = productoSeleccionado.value.elegir_precio;

  switch (precioElegido) {
    case 'precio_normal':
      productoSeleccionado.value.precio_venta = datosProd.precio_venta;
      break;
    case 'precio_minimo':
      productoSeleccionado.value.precio_venta = datosProd.precio_min;
      break;
    case 'precio_xmayor':
      productoSeleccionado.value.precio_venta = datosProd.precio_xmayor;
      break;
    case 'precio_otro':
      if (Number(productoSeleccionado.value.precio_otro) <= Number(productoSeleccionado.value.precio_minimo)) {
        toast.add({ severity: 'error', summary: 'Error', detail: 'El precio otro debe ser mayor que el precio mínimo', life: 3000 });
        return;
      }
      productoSeleccionado.value.precio_venta = productoSeleccionado.value.precio_otro;
      break;
    default:
      break;
  }

  // Actualizar el producto en productosVenta
  const index = productosVenta.value.findIndex(prod => prod.codigo === productoSeleccionado.value.codigo);
  if (index !== -1) {
    productosVenta.value[index] = { ...productoSeleccionado.value };
    calcularTotalFactura();
  }

  // Guardar en localStorage
  localStorage.setItem('productosVenta', JSON.stringify(productosVenta.value));
};

/************************************************************/
const downloadURI = (uri, name) =>
{
    var link = document.createElement("a");
    link.href = uri;
    link.target = '_blank';
    link.download = name;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
}
/************************************************************/
const generarPDF = async(tipo,numero,url) =>{
  try {
    const response = await fetch(url, {
      method: "GET",
    });
    const envio = await response.text();

        mensajetoast(toast,"Ok", "PDF creado correctamente", "success");
      visiblefatcoti.value = false;
Swal.fire({
  title: 'Archivo Creado',
  text: "Deseas Descargarlo?",
  icon: 'warning',
  showCancelButton: true,
  showDenyButton: true, // Agregamos el botón para abrir el PDF
  confirmButtonColor: '#3085d6',
  denyButtonColor: '#ffb300', // Color del botón para abrir el PDF
  cancelButtonColor: '#d33',
  confirmButtonText: 'Descargar',
  denyButtonText: 'Abrir PDF', // Texto del botón para abrir el PDF
  cancelButtonText: 'Cerrar'
}).then((result) => {
  if (result.isConfirmed) {
    var archivo = tipo;
    if (tipo === 'cotizacion') {
      downloadURI(link.value+"/vista/cotizacionesPDF/cotizacion" + numero + '.pdf', numero);
    } else {
      downloadURI(link.value+"/vista/facturasPDF/factura" + numero + '.pdf', numero);
    }
  } else if (result.isDenied) {
    // Logica para abrir el PDF en una nueva pestaña
    var archivoURL;
    if (tipo === 'cotizacion') {
      archivoURL = link.value+"/vista/lectorPDF.php?cotizacion=cotizacion" + numero+ '.pdf';
    } else {
      archivoURL = link.value+"/vista/lectorPDF.php?factura=factura" + numero+ '.pdf';
    }
     window.open(archivoURL, "Impresion", "width=600, height=800")
  }
});




  } catch (error) {
    mensajetoast(toast,"Error", "No se ha podido realizar la operación", "error");

  }
}
/************************************************************/
/************************************************************/
/************************************************************/
const eliminarFactura = () =>{
  visiblefatcoti.value = false;

const tipoN = {
  'Factura':'facturas',
  'Cotizacion':'cotizacion',
}

const campoN = {
  'Factura':'no_factura',
  'Cotizacion':'no_cotizacion',
}

const factura = datosFactCoti.value.numero;
const tipo = tipoN[datosFactCoti.value.tipo];
const campo = campoN[datosFactCoti.value.tipo];

  Swal.fire({
    title: 'Introduce la contraseña',
    input: 'password',
    inputPlaceholder: 'Contraseña',
    showCancelButton: true,
    confirmButtonText: 'Eliminar',
    cancelButtonText: 'Cancelar'
  }).then(async(result) => {
    if (result.isConfirmed) {
      const contrasenaIngresada = result.value;
      if (contrasenaIngresada === token.value || contrasenaIngresada === tokenCorto.value || contrasenaIngresada === tokenSoloUso.value || contrasenaIngresada === token24H.value) {

/*      const datosFacturaFull = await peticionesFetch(`${link.value}${api.value}`,`datoscampo/facturas/no_factura/${factura}`,{},tokenCifrado.value,'GET');*/
      const datosFacturaFull = await peticionesFetchOffline('getDataByField', 'facturas','no_factura',factura);
      if (datosFacturaFull) {
      const productosFactura = JSON.parse(datosFacturaFull.productos)
         
         for (let prod of productosFactura) {
           const datosProdArray = productosArray.value.find(producto => producto.codigo == prod.codigo)

           if (datosProdArray) {
             const urlProd = link.value + api.value + "/actualizarcampos/productos";
             if (datosProdArray.hasOwnProperty('created_at')) {
               datosProdArray.updated_at = nfecha('timestamp')
             }

             datosProdArray.stock = (Number(datosProdArray.stock) + Number(prod.cantidad))
             /*const envioDatosProd = await enviarDatosPorPost(urlProd, datosProdArray,tokenCifrado.value);*/
             const envioDatosProd = await peticionesFetchOffline('updateData','productos', JSON.stringify(datosProdArray));

             if (envioDatosProd[0] == 'ok') {
               toast.removeAllGroups();
               toast.add({ severity: 'success', summary: 'Éxito', detail: 'Producto Restaurado correctamente', life: 3000 });
             }
           }

           await fetchAndSetupData()
         }

                         if(datosFacturaFull.metodo_pago === 'CREDITO'){
/*                            const datosCredito = await peticionesFetch(`${link.value}${api.value}`, `datoscampo/cuentas_cobrar/no_factura/${datosFacturaFull.no_factura}`, {}, tokenCifrado.value, 'GET');*/
                            const datosCredito = await peticionesFetchOffline('getDataByField', 'cuentas_cobrar','no_factura',datosFacturaFull.no_factura);
                            if(datosCredito){
  /*                              const datosFacturaCredito = await peticionesFetch(`${link.value}${api.value}`, `borrarporcampo/cuentas_cobrar`, { campo: 'id', valor: datosCredito.id }, tokenCifrado.value, 'POST');*/
                                const datosFacturaCredito = await peticionesFetchOffline('deleteEntry','cuentas_cobrar',id);

                             if (datosFacturaCredito[0] == 'ok') {
                                 toast.removeAllGroups();
                                toast.add({ severity: 'success', summary: 'Éxito', detail: 'Datos CREDITO eliminados correctamente', life: 3000 });
                             }


                            }

                         }
      }


 /*     const datosFactura = await peticionesFetch(`${link.value}${api.value}`,`borrarporcampo/facturas`,{campo:'no_factura',valor:factura},tokenCifrado.value,'POST');*/
      const datosFactura = await peticionesFetchOffline('deleteByField','cuentas_cobrar','no_factura',factura);

      if (datosFactura[0]=='ok') {

            toast.removeAllGroups();
           toast.add({ severity: 'success', summary: 'Éxito', detail: 'Factura eliminada correctamente', life: 3000 });
           await fetchFacturas()
      }else{
          toast.add({ severity: 'error', summary: 'Error', detail: 'Error al eliminar la Factura', life: 3000 });
      }

      } else {
        toast.add({ severity: 'error', summary: 'Error', detail: 'Contraseña incorrecta', life: 3000 });
      }
    }
  });
}
/************************************************************/
const calcularTotalProductos = (productos) => {

  // Primero intentamos parsear el array directamente. Puede fallar si tiene esas cadenas conflictivas
  let productosParsed;
  try {
    productosParsed = JSON.parse(productos);
  } catch (error) {
    // Si falla el parseo, probablemente por esos campos "otro" y "caracteristicas", hacemos la limpieza
    console.warn("JSON.parse falló, limpiando manualmente...");

    // Reemplazar el campo "otro": elimina todo el bloque "otro":"[...]"
    let productosLimpios = productos.replace(/"otro":"\[[^\]]*?\]",?/g, '');
    // Reemplazar el campo "caracteristicas":"[]"
    productosLimpios = productosLimpios.replace(/"caracteristicas":"\[\]",?/g, '');
    productosParsed = JSON.parse(productosLimpios);
  }

  // Si aún existen campos "otro" y "caracteristicas", eliminarlos directamente del objeto
  productosParsed.forEach(producto => {
    delete producto.otro;
    delete producto.caracteristicas;
  });


  // Calcular el total
  const total = productosParsed.reduce((acumulado, producto) => {
    return acumulado + Number(producto.total);
  }, 0);

  return total.toFixed(2);
};

/************************************************************/
const ventaProceso = async (codigo) => {
  try {
    if (!clienteSeleccionado.value || clienteSeleccionado.value !== codigo) {
      const datosVenta = ventasGuardadas.value.find(venta => venta.cod_cliente === codigo);
      let clienteSelected01 = allClientes.value.find(cliente => cliente.codigo === codigo);

      // 🔥 Limpiar el JSON conflictivo de los productos antes de parsearlo
      let productosLimpiosStr = datosVenta.productos
        .replace(/"otro":"\[[^\]]*?\]",?/g, '')              // elimina el campo "otro"
        .replace(/"caracteristicas":"\[\]",?/g, '');         // elimina el campo "caracteristicas"

      let productos = JSON.parse(productosLimpiosStr);

      // 🔥 Eliminar también directamente por si algún objeto aún tiene esos campos
      productos.forEach(producto => {
        delete producto.otro;
        delete producto.caracteristicas;
      });

      let datoClienteN = clienteSelected01;

      documentoActual.value = datosVenta.nombre;

      if (!clienteSelected01) {
        datoClienteN = await arrayToObjetoFromTabla(link.value + api.value, tokenCifrado.value, 'clientes');
        datoClienteN.nombre = datosVenta.nombre;
        datoClienteN.codigo = datosVenta.cod_cliente;
      }

      productosVenta.value = productos;
      clienteSelected.value = datoClienteN;
      clienteSeleccionado.value = codigo;
      calcularTotalFactura();
    } else {
      clienteSeleccionado.value = null;
      limpiarProductos();

      clienteSelected.value = allClientes.value.find(client => client.codigo === '0000000');
    }
  } catch (error) {
    console.error("Error al procesar la venta:", error);
  }
};



/************************************************************/
const botonLabel = computed(() => {
  return clienteSeleccionado.value !== null ? 'Actualizar' : 'Agregar Nuevo';
});
/************************************************************/
const crearventaProceso = async () => {

  if (!clienteSelected.value.nombre) {
    mensajetoast(toast, "Upps", "Debe agregar un Cliente", "error");
    //visiblecliente.value = true;
    return;
  }

  const verificaVenta = ventasGuardadas.value.find(venta => venta.cod_cliente === clienteSelected.value.codigo);

  if (verificaVenta) {
    verificaVentaProceso();
    return;
  }

  const datos = {
    cod_cliente: clienteSelected.value.codigo,
    nombre: clienteSelected.value.nombre,
    productos: JSON.stringify(
      productosVenta.value.map(prod => {
        const { otro, caracteristicas, ...resto } = prod;
        return resto;
      })
    ),
    turno: '',
    fecha: nfecha('fecha'),
    token: '',
    usuario: datosEmpresa.usuario.nombre,
  };

/*  const envio = await peticiones(link.value + api.value + '/insertar/ventasenproceso', datos, 'POST', tokenCifrado.value);*/
  const envio = await peticionesFetchOffline('insertData','ventasenproceso', JSON.stringify(datos));

  if (envio[0] === 'ok') {
    visiblecliente.value = false;
    mensajetoast(toast, "Ok", "Venta Guardada correctamente", "success");
    fetchventasGuardadas();
    limpiarProductos();
    clienteSelected.value.nombre = '';
    clienteSelected.value = await arrayToObjetoFromTabla(link.value, token.value, 'clientes');
   //clienteSelected.value = await arrayToObjetoFromTabla(link.value, token.value, 'clientes');
  }
};

/************************************************************/
const fnCambiarClienteFactura = async()=>{
  visibleClientes.value = false
  const numero = datosFactCoti.value.numero;
  const tipo = datosFactCoti.value.tipo;

  if (numero == '') {
      mensajetoast(toast,"Upps", "Debes seleccionar una Factura o Cotizacion", "error");
    return
  }else{
      mensajetoast(toast,"OK", `${tipo} #${numero} seleccionada`, "success");
  }

   visiblefatcoti.value = false

  Swal.fire({
    title: 'Introduce la contraseña',
    input: 'password',
    inputPlaceholder: 'Contraseña',
    showCancelButton: true,
    confirmButtonText: 'Editar',
    cancelButtonText: 'Cancelar'
  }).then(async(result) => {
    if (result.isConfirmed) {
      const contrasenaIngresada = result.value;
      if (contrasenaIngresada === token.value || contrasenaIngresada === tokenCorto.value || contrasenaIngresada === tokenSoloUso.value || contrasenaIngresada === token24H.value) {


 const tTabla = {
    'Factura':'facturas',
    'Cotizacion':'cotizacion'
  }
 const tCampo = {
    'Factura':'no_factura',
    'Cotizacion':'no_cotizacion'
 }

  tipoFactura.value = tipo.toLowerCase()

/*  const datos = await peticiones(`${link.value}${api.value}/datoscampo/${tTabla[tipo]}/${tCampo[tipo]}/${numero}`,{},'GET',tokenCifrado.value)*/
  const datos = await peticionesFetchOffline('getDataByField', tTabla[tipo],tCampo[tipo],numero);
   
  const cliente = clienteSelected.value

  const url = link.value+api.value+"/actualizarcampos/facturas";
  
  datos.nombre_cliente = cliente.nombre
  datos.cod_cliente = cliente.codigo

 /* const envioDatos = await enviarDatosPorPost(url, datos,tokenCifrado.value);*/
  const envioDatos = await peticionesFetchOffline('updateData','facturas', JSON.stringify(datos));
  if (envioDatos[0] == 'ok') {
      toast.removeAllGroups();
     toast.add({ severity: 'success', summary: 'Éxito', detail: 'Datos Actualizados', life: 3000 });
     visiblefatcoti.value = true
  }else{
    toast.add({ severity: 'error', summary: 'Error', detail: 'Fallo al actualizar los datos.', life: 3000 });
  }


}
}
})

}
/************************************************************/
const editarFactura = async () => {
  try {
    const numero = datosFactCoti.value.numero;
    const tipo = datosFactCoti.value.tipo;

    if (!numero) {
      mensajetoast(toast, "Upps", "Debes seleccionar una Factura o Cotizacion", "error");
      return;
    } else {
      mensajetoast(toast, "OK", `${tipo} #${numero} seleccionada`, "success");
    }

    visiblefatcoti.value = false;

    const result = await Swal.fire({
      title: 'Introduce la contraseña',
      input: 'password',
      inputPlaceholder: 'Contraseña',
      showCancelButton: true,
      confirmButtonText: 'Editar',
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      const contrasenaIngresada = result.value;

      if (
        contrasenaIngresada === token.value ||
        contrasenaIngresada === tokenCorto.value ||
        contrasenaIngresada === tokenSoloUso.value ||
        contrasenaIngresada === token24H.value
      ) {
        const tTabla = {
          'Factura': 'facturas',
          'Cotizacion': 'cotizacion'
        };
        const tCampo = {
          'Factura': 'no_factura',
          'Cotizacion': 'no_cotizacion'
        };

        tipoFactura.value = tipo.toLowerCase();

/*        const datos = await peticiones(
          `${link.value}${api.value}/datoscampo/${tTabla[tipo]}/${tCampo[tipo]}/${numero}`,
          {},
          'GET',
          tokenCifrado.value
        );*/
        const datos = await peticionesFetchOffline('getDataByField', tTabla[tipo],tCampo[tipo],numero);

        const productos = JSON.parse(datos.productos);

        const verificaCLiente = allClientes.value.find(cliente => cliente.codigo === datos.cod_cliente);

        checkedpormayor.value = false;

        if (!verificaCLiente) {
          const clienteBase = allClientes.value.find(cliente => cliente.codigo === '0000000') || {};
          clienteSelected.value = {
            ...clienteBase,
            codigo: datos.cod_cliente || clienteBase.codigo || '0000000',
            nombre: clienteBase.nombre || `Cliente no encontrado (${datos.cod_cliente || 'sin codigo'})`,
            n_comercial: clienteBase.n_comercial || `Cliente no encontrado (${datos.cod_cliente || 'sin codigo'})`,
            precio_fijado: clienteBase.precio_fijado || 'Normal'
          };
          toast.add({ severity: 'warn', summary: 'Aviso', detail: 'El cliente original no se encontro, pero puedes editar la factura/cotizacion.', life: 4000 });
        } else {
          clienteSelected.value = verificaCLiente;
          checkedpormayor.value = verificaCLiente.precio_fijado === 'PorMayor';
          //alporMayor()
        }

        productosVenta.value = productos;
        nota.value = datos.nota;
        calcularTotalFactura();

        documentoActual.value = `Editando la ${tipo} - ${numero}`;
        documentoEditado.value = tipo;
        numerodocumentoEditado.value = numero;
        visiblefatcoti.value = false;
      } else {
        toast.add({ severity: 'error', summary: 'Error', detail: 'Contraseña incorrecta', life: 3000 });
      }
    }
  } catch (error) {
    console.error("❌ Error en editarFactura:", error);
    toast.add({ severity: 'error', summary: 'Error inesperado', detail: error.message || 'Algo salió mal.', life: 4000 });
  }
};

/************************************************************/
 const devolucionProductos = async(productos)=>{

       for (let prod of productos) {
/*         const datosPro = await peticionesFetch(`${link.value}${api.value}`,`datoscampo/productos/codigo/${prod.codigo}`,{},tokenCifrado.value,'GET');*/
         const datosPro = await peticionesFetchOffline('getDataByField', 'productos','codigo',prod.codigo);

         if (datosPro) {
           const url = link.value + api.value + "/actualizarcampos/productos";
           datosPro.stock = (Number(datosPro.stock) + Number(prod.cantidad))
/*         const envioDatos = await enviarDatosPorPost(url, datosPro,tokenCifrado.value);*/
           const envioDatos = await peticionesFetchOffline('updateData','productos', JSON.stringify(datosPro));

           if (envioDatos[0] == 'ok') {
             toast.removeAllGroups();
             toast.add({ severity: 'success', summary: 'Éxito', detail: 'Datos Actualizados', life: 3000 });
           } else {
             toast.add({ severity: 'error', summary: 'Error', detail: 'Fallo al actualizar los datos.', life: 3000 });
           }
         }
       }

 }
/************************************************************/
const fnDevolucionTotal = async () => {
  const pedirContrasena = async () => {
    const result = await Swal.fire({
      title: 'Introduce la contraseña',
      input: 'password',
      inputPlaceholder: 'Contraseña',
      showCancelButton: true,
      confirmButtonText: 'Devolver',
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      const contrasenaIngresada = result.value;
      if (contrasenaIngresada === token.value || contrasenaIngresada === tokenCorto.value || contrasenaIngresada === tokenSoloUso.value || contrasenaIngresada === token24H.value) {
        
     //Devolucion Total
       const noFactura = datosFactCoti.value.numero
       const tipoDoc = datosFactCoti.value.tipo
     
       if (tipoDoc == 'Factura') {
/*             const datos = await peticiones(`${link.value}${api.value}/datoscampo/facturas/no_factura/${noFactura}`,{},'GET',tokenCifrado.value)*/
             const datos = await peticionesFetchOffline('getDataByField', 'facturas','no_factura',noFactura);


               if (datos.estado_factura == 'DEVOLUCION') {
                 toast.add({ severity: 'error', summary: 'Error', detail: 'Esta Factura ya ha sido Devuelta.', life: 3000 });
                return
               }



              const productos = JSON.parse(datos.productos);
              const totalFactura = datos.total;

              await devolucionProductos(productos);

           datos.total = '0.00'
           datos.efectivo = '0.00'
           datos.transferencia = '0.00'
           datos.cheque = '0.00'
           datos.tarjeta = '0.00'
           datos.ganancia = '0.00'
           datos.estado_factura = 'DEVOLUCION'

        const url = link.value+api.value+"/actualizarcampos/facturas";

       /* const envioDatos = await enviarDatosPorPost(url, datos,tokenCifrado.value);*/
        const envioDatos = await peticionesFetchOffline('updateData','facturas', JSON.stringify(datos));
        if (envioDatos[0] == 'ok') {
            toast.removeAllGroups();
           toast.add({ severity: 'success', summary: 'Éxito', detail: 'Datos Actualizados', life: 3000 });

       const jsonDataDevoluciones = await arrayToObjetoFromTablaOffline('devoluciones');

       const urlDevoluciones = link.value+api.value+"/insertar/devoluciones";

     jsonDataDevoluciones.created_at = nfecha('timestamp')
     jsonDataDevoluciones.updated_at = nfecha('timestamp')
     jsonDataDevoluciones.fecha = nfecha('fecha')
     jsonDataDevoluciones.hora = nfecha('hora')
     jsonDataDevoluciones.mes = nfecha('mes')
     jsonDataDevoluciones.year = nfecha('year')
     jsonDataDevoluciones.descripcion = 'FACTURA ('+datos.no_factura+') DEVOLUCION TOTAL'
     jsonDataDevoluciones.cantidad = totalFactura
     jsonDataDevoluciones.almacen = datosEmpresa.empresa.nombre

    /*const envioDatos = await enviarDatosPorPost(urlDevoluciones, jsonDataDevoluciones,tokenCifrado.value);*/
    const envioDatos = await peticionesFetchOffline('insertData','devoluciones', JSON.stringify(jsonDataDevoluciones));

      await fetchFacturas()

      await fetchAndSetupData();//Productos


        }else{
          toast.add({ severity: 'error', summary: 'Error', detail: 'Fallo al actualizar los datos.', life: 3000 });
        }

       }else{
         toast.add({ severity: 'error', summary: 'Error', detail: 'Las Cotizaciones NO se pueden devolver', life: 3000 });
       }

      } else {
        Swal.fire({
          title: 'Contraseña incorrecta',
          icon: 'error',
          confirmButtonText: 'Reintentar'
        }).then(() => {
          pedirContrasena();
        });
      }
    }
  };

  pedirContrasena();
};
/************************************************************/
 const fnDevoluciones = ()=>{
  visiblefatcoti.value = false;
  Swal.fire({
    title: 'Devolución',
    icon: 'question',
    showDenyButton: true,
    showConfirmButton: true,
    confirmButtonText: 'Parcial',
    denyButtonText: 'Total'
  }).then(async(result) => {
    if (result.isConfirmed) {
      editarFactura()
    } else if (result.isDenied) {
      fnDevolucionTotal()
    }
  });


 }
/************************************************************/
 /************************************************/
const crearGarantia = async (factura, cliente, producto) => {
    const url = `${link.value}${api.value}/insertar/garantia_global`;

    try {
        //const ultimaGarantia = await peticiones(`${link.value}${api.value}/datosmax`, {"tabla":'garantia_global',"campo":'no_garantia'}, 'POST', tokenCifrado.value);
        //const numeroGarantia = generadorCodigo(ultimaGarantia[0], '', 7);
        const numeroGarantia = generarCodigoUnico()
        
        let campos = await arrayToObjetoFromTablaOffline('garantia_global');

        // 📌 Continuamos con la creación de la garantía
        campos.created_at = nfecha('timestamp');
        campos.updated_at = nfecha('timestamp');
        campos.tipo = 'PROPIO';
        campos.no_garantia = numeroGarantia;
        campos.no_factura = factura.no_factura;
        campos.proveedor = producto.proveedor || datosEmpresa.empresa.nombre;
        campos.equipo = producto.nombre || 'N/A';
        campos.marca = producto.marca || 'N/A';
        campos.modelo = producto.modelo || 'N/A';
        campos.fecha_ingreso = nfecha('fecha');
        campos.hora = nfecha('hora');
        campos.fecha_venta = factura.fecha_emision;
        campos.estado = 'PENDIENTE';
        campos.cliente = factura.nombre_cliente;
        campos.recibido_por = datosEmpresa.usuario.nombre;

/*        const envioDatos = await enviarDatosPorPost(url, campos, tokenCifrado.value);*/
        const envioDatos = await peticionesFetchOffline('insertData','garantia_global', JSON.stringify(campos));

        if (envioDatos[0] === 'ok') {
             toast.removeAllGroups();
            toast.add({ severity: 'success', summary: 'OK', detail: 'Se ha creado la Garantía para ' + producto.nombre, life: 3000 });

            // 📌 Actualizar la factura
            const urlFact = `${link.value}${api.value}/actualizarcampos/facturas`;

            if (factura.hasOwnProperty('created_at')) {
                factura.updated_at = nfecha('timestamp');
            }

            factura.nota = (factura.nota || '') + '\n ' + producto.nombre + ' EN GARANTIA';

          /*  const envioDatosFact = await enviarDatosPorPost(urlFact, factura, tokenCifrado.value);*/
            const envioDatosFact = await peticionesFetchOffline('updateData','facturas', JSON.stringify(factura));

            if (envioDatosFact[0]) {
                impresionFactura();
            }
        } else {
            toast.add({ severity: 'error', summary: 'Error', detail: 'Hubo un problema al crear la Garantía.', life: 3000 });
        }

    } catch (error) {
        console.error("Error al crear la garantía:", error);
        toast.add({ severity: 'error', summary: 'Error', detail: 'Hubo un problema al crear la Garantía.', life: 3000 });
    }
};

 /************************************************/
const fnGarantia = async () => {
  visiblefatcoti.value = false
  // datosFactCoti.numero
  // datosFactCoti.tipo
  if (datosFactCoti.value.tipo !== 'Factura') {
    toast.add({ severity: 'error', summary: 'Error', detail: 'Solo Factura puede entrar en Garantía.', life: 3000 });
    visiblefatcoti.value = true
    return;
  } else {

/*   const verificaFacturaGarantia = await peticionesFetch(`${link.value}${api.value}`,`datoscampo/garantia_global/no_factura/${datosFactCoti.value.numero}`,{},tokenCifrado.value,'GET');*/
   const verificaFacturaGarantia = await peticionesFetchOffline('getDataByField', 'garantia_global','no_factura',datosFactCoti.value.numero);


    if(verificaFacturaGarantia){
        toast.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Ya existe Una Garantia para esta Factura',
        life: 3000
      });
        visiblefatcoti.value = true
       return
    }


/*    const factura = await peticionesFetch(
      `${link.value}${api.value}`,
      `datoscampo/facturas/no_factura/${datosFactCoti.value.numero}`,
      {},
      tokenCifrado.value,
      'GET'
    );*/

    const factura = await peticionesFetchOffline('getDataByField', 'facturas','no_factura',datosFactCoti.value.numero);

/*    const cliente = await peticionesFetch(
      `${link.value}${api.value}`,
      `datoscampo/clientes/codigo/${factura.cod_cliente}`,
      {},
      tokenCifrado.value,
      'GET'
    );*/

    const cliente = await peticionesFetchOffline('getDataByField', 'clientes','codigo',factura.cod_cliente);

    if(!cliente){
      toast.add({ severity: 'error', summary: 'Error', detail: 'No se encuentra el cliente', life: 3000 });
      return
    }


    const productos = JSON.parse(factura.productos);
    if (productos.length < 1) {
      toast.add({ severity: 'error', summary: 'Error', detail: 'Esta Factura no contiene productos.', life: 3000 });
      visiblefatcoti.value = true
      return;
    }

    if (productos.length > 1) {
      const { value: option } = await Swal.fire({
        title: 'Seleccione una opción',
        text: '¿Desea entrar a garantía un producto o todos?',
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Todos',
        cancelButtonText: 'Uno',
      });

      if (option) {

       for(let prod of productos){
        await crearGarantia(factura,cliente,prod)
      }


      } else {
        // User selected "Uno"
        const { value: selectedProductIndex } = await Swal.fire({
          title: 'Seleccione un producto',
          input: 'select',
          inputOptions: productos.reduce((acc, producto, index) => {
            acc[index] = producto.nombre; // Assuming 'nombre' is the product name
            return acc;
          }, {}),
        });

        if (selectedProductIndex !== undefined) {
          const productoEnGarantia = productos[selectedProductIndex];
          await crearGarantia(factura,cliente,productoEnGarantia)

        }
      }
    } else {
      // Only one product, proceed directly
      const productoEnGarantia = productos[0];
       await crearGarantia(factura,cliente,productoEnGarantia)
    }
  }
};
/************************************************************/
watch(visiblecliente,(evento)=>{
  if(evento){
    if (clienteSelected.value.codigo == '') {
     clienteSelected.value.codigo = generarCodigoUnico()
   }
  }else{
    if (clienteSelected.value.nombre == '') {
        fetchClientes();
    }
  }
})
/************************************************************/
const fnResetMetodoPago = ()=>{
  metodoPago.value = 'EFECTIVO'
}
/************************************************************/
const fnAplicarPorcentajeMetodoPago = () => {
  const selectedMetodo = metodoPagoOptions.value.find(m => m.nombre === metodoPago.value)
  const pct = Number(selectedMetodo?.porcentaje || 0)
  const metodoActual = String(metodoPago.value || '').toUpperCase()
  const aplicaRecargoTarjeta = metodoActual === 'TARJETA' || metodoActual === 'TARJETA CUOTA'

  if (!aplicaRecargoTarjeta) {
    productosVenta.value = productosVenta.value.map(prod => {
      const impuestoVenta = Number(prod.impuesto_venta || 0)
      const precioBase = Number(prod.precio_real ?? prod.precio_venta ?? prod.precio_final ?? 0)
      const precioFinalBase = Number((precioBase + impuestoVenta).toFixed(2))
      return {
        ...prod,
        precio_real: null,
        porcentaje: 0,
        precio_venta: precioBase,
        precio_final: precioFinalBase,
      }
    })
    return
  }

  productosVenta.value = productosVenta.value.map(prod => {
    const impuestoVenta = Number(prod.impuesto_venta || 0)
    const precioBase = Number(prod.precio_real ?? prod.precio_venta ?? 0)
    const nuevoPrecioVenta = Number((precioBase * (1 + pct / 100)).toFixed(2))
    const nuevoPrecioFinal = Number((nuevoPrecioVenta + impuestoVenta).toFixed(2))

    return {
      ...prod,
      precio_real: precioBase,
      porcentaje: pct,
      precio_venta: nuevoPrecioVenta,
      precio_final: nuevoPrecioFinal,
    }
  })
}
/************************************************************/
const aplicarRecargoTarjeta = () => {
  if (!metodoPagoTarjetaSeleccionado.value) {
    montoTarjetaOriginal.value = Number(tarjetaFN.value || 0);
    montoTarjetaConRecargo.value = Number(tarjetaFN.value || 0);
    return;
  }

  const porcentaje = Number(metodoPagoTarjetaSeleccionado.value.porcentaje || 0);
  const montoBase = Number(tarjetaFN.value || 0);

  if (porcentaje > 0 && montoBase > 0) {
    montoTarjetaOriginal.value = montoBase;
    montoTarjetaConRecargo.value = Number((montoBase * (1 + porcentaje / 100)).toFixed(2));
  } else {
    montoTarjetaOriginal.value = montoBase;
    montoTarjetaConRecargo.value = montoBase;
  }
};
/************************************************************/
const distribuirRecargoEnProductos = () => {
  if (!metodoPagoTarjetaSeleccionado.value || productosSeleccionadosRecargo.value.length === 0) {
    return;
  }

  const recargo = diferenciaRecargo.value;
  if (recargo <= 0) {
    toast.add({ severity: 'warn', summary: 'Advertencia', detail: 'No hay recargo para distribuir', life: 3000 });
    return;
  }

  const totalProductosSeleccionados = productosSeleccionadosRecargo.value.reduce((sum, index) => {
    const producto = productosVenta.value[index];
    return sum + (Number(producto.precio_final || producto.precio_venta || 0) * Number(producto.cantidad || 1));
  }, 0);

  if (totalProductosSeleccionados === 0) {
    toast.add({ severity: 'warn', summary: 'Advertencia', detail: 'Los productos seleccionados no tienen precio', life: 3000 });
    return;
  }

  productosSeleccionadosRecargo.value.forEach(index => {
    const producto = productosVenta.value[index];
    const precioActual = Number(producto.precio_final || producto.precio_venta || 0);
    const cantidad = Number(producto.cantidad || 1);
    const subtotalProducto = precioActual * cantidad;
    const proporcion = subtotalProducto / totalProductosSeleccionados;
    const recargoProducto = recargo * proporcion;
    const recargoUnidad = recargoProducto / cantidad;
    const nuevoPrecio = Number((precioActual + recargoUnidad).toFixed(2));

    producto.precio_venta = nuevoPrecio;
    producto.precio_final = nuevoPrecio;
    producto.recargo_aplicado = recargoUnidad;
  });

  toast.add({ severity: 'success', summary: 'Éxito', detail: `Recargo de $${recargo.toFixed(2)} distribuido entre ${productosSeleccionadosRecargo.value.length} producto(s)`, life: 3000 });
  productosSeleccionadosRecargo.value = [];
};
/************************************************************/
const toggleProductoRecargo = (index) => {
  const idx = productosSeleccionadosRecargo.value.indexOf(index);
  if (idx > -1) {
    productosSeleccionadosRecargo.value.splice(idx, 1);
  } else {
    productosSeleccionadosRecargo.value.push(index);
  }
};
/************************************************************/
const fncambioMetodoPago = ()=>{
fnAplicarPorcentajeMetodoPago()
//visibleApartado
if (metodoPago.value === 'EFECTIVO') {
    efetivoFN.value = total.value;
    tarjetaFN.value = 0.00;
    transferenciaFN.value = 0.00
    chequeFN.value = 0.00
}else if(metodoPago.value === 'CREDITO'){
   visibleCredito.value = true
   efetivoFN.value = 0.00;
   tarjetaFN.value = 0.00;
   transferenciaFN.value = 0.00
   chequeFN.value = 0.00
}else if(metodoPago.value === 'APARTADO'){
   visibleApartado.value = true
   efetivoFN.value = 0.00;
   tarjetaFN.value = 0.00;
   transferenciaFN.value = 0.00
   chequeFN.value = 0.00
}else if (metodoPago.value === 'TARJETA') {

         efetivoFN.value = 0.00;
         tarjetaFN.value = total.value; 
         transferenciaFN.value = 0.00;
         visiblecobrar.value = false
         chequeFN.value = 0.00
   Swal.fire({
      title: '¿Aplicar '+datosDefault.value.tarjeta+'%?',
      text: "Se aplicará el porciento del uso de Tarjeta",
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Aplicar Porciento',
      cancelButtonText: 'Cancelar'
   }).then(async(result) => {
      if (result.isConfirmed) {


const porcentajeTarjeta = Number(datosDefault.value.tarjeta) || 0;
const porcientoAplicado = (porcentajeTarjeta / 100) * Number(total.value);
const nuevoTotal = Number(total.value) - porcientoAplicado;

const campos = await arrayToObjetoFromTabla(link.value + api.value, tokenCifrado.value, 'productos', true);
campos.nombre = `(${porcentajeTarjeta}%) POR USO DE TARJETA APLICADO`;
campos.categoria = 'USO DE TARJETA APLICADO';
campos.codigo = 'TARJETA';
campos.codigo_barra = 'TARJETA';
campos.precio_venta = porcientoAplicado;
campos.precio_final = porcientoAplicado;
campos.precio_min = porcientoAplicado;
campos.precio_xmayor = porcientoAplicado;
campos.impuestos = '0.00';
campos.impuesto = '0.00';
campos.impuesto_venta = '0.00';
campos.precio_compra = '0.00';

datosProductoBuscado.value = campos;
fnagregarProductoBuscado();




        visiblecobrar.value = true
          toast.removeAllGroups();
         toast.add({ severity: 'success', summary: 'Ok', detail: `Porcentaje de uso de Tarjeta Aplicado`, life: 3000 });

      } else if (result.dismiss === Swal.DismissReason.cancel) {
        toast.add({ severity: 'warn', summary: 'Upps', detail: `Porcentaje de uso de Tarjeta NOAplicado`, life: 3000 });
         visiblecobrar.value = true
      }
   });
}else if(metodoPago.value === 'TARJETA CUOTA'){
   efetivoFN.value = 0.00;
   tarjetaFN.value = total.value;
   transferenciaFN.value = 0.00
   chequeFN.value = 0.00
}else if(metodoPago.value === 'TRANSFERENCIA'){
//visibleCheque
   visibleBanco.value = true
   efetivoFN.value = 0.00;
   tarjetaFN.value = 0.00;
   chequeFN.value = 0.00
   transferenciaFN.value = total.value;
}else if(metodoPago.value === 'CHEQUE'){
   visibleCheque.value = true
   efetivoFN.value = 0.00;
   tarjetaFN.value = 0.00;
   transferenciaFN.value = 0.00;
   chequeFN.value = total.value
}else if(metodoPago.value === 'EFECTIVO Y TRANSFERENCIA'){
  const operacionDivide = (total.value / 2);
   efetivoFN.value = operacionDivide.toFixed(2);
   tarjetaFN.value = 0.00;
   chequeFN.value = 0.00;
   transferenciaFN.value = operacionDivide.toFixed(2);
   visibledinero.value = true;
}else if(metodoPago.value === 'TARJETA Y EFECTIVO'){
  const operacionDivide = (total.value / 2);
   efetivoFN.value = operacionDivide.toFixed(2);
   tarjetaFN.value = operacionDivide.toFixed(2);
   transferenciaFN.value = 0.00;
   chequeFN.value = 0.00;
   visibledinero.value = true;
}else if(metodoPago.value === 'TARJETA Y TRANSFERENCIA'){
  const operacionDivide = (total.value / 2);
   efetivoFN.value = 0.00;
   chequeFN.value = 0.00;
   tarjetaFN.value = operacionDivide.toFixed(2);
   transferenciaFN.value = operacionDivide.toFixed(2);
   visibledinero.value = true;
}else if(metodoPago.value === 'TARJETA TRANSFERENCIA Y EFECTIVO'){
  const operacionDivide = (total.value / 3);
   efetivoFN.value = operacionDivide.toFixed(2);
   tarjetaFN.value = operacionDivide.toFixed(2);
   transferenciaFN.value = operacionDivide.toFixed(2);
   chequeFN.value = 0.00;
   visibledinero.value = true;
}

}
/************************************************************/
watch(visibledinero, (newValue) => {
  if (newValue) {
    const metodo = metodoPago.value;
    if (metodo === 'EFECTIVO Y TRANSFERENCIA') {
      tarjetaFN.value = 0.00;
       tarjetaFNRef.value = true;
      transferenciaFNRef.value = false;
      efetivoFNRef.value = false;
      chequeFN.value = 0.00;
    } else if (metodo === 'TARJETA Y EFECTIVO') {
      transferenciaFN.value = 0.00;
      chequeFN.value = 0.00;
      transferenciaFNRef.value = true;
      efetivoFNRef.value = false;
      tarjetaFNRef.value = false;
    } else if (metodo === 'TARJETA Y TRANSFERENCIA') {
      efetivoFN.value = 0.00;
      chequeFN.value = 0.00;
      efetivoFNRef.value = true;
      tarjetaFNRef.value = false;
      transferenciaFNRef.value = false;
    } else if (metodo === 'TARJETA TRANSFERENCIA Y EFECTIVO') {
      efetivoFNRef.value = false;
      tarjetaFNRef.value = false;
      chequeFN.value = 0.00;
      transferenciaFNRef.value = false;
    }
  }
});

watch(visibledinero, (newValue) => {
  if (newValue) {
    const metodo = metodoPago.value;
    if (metodo === 'EFECTIVO Y TRANSFERENCIA') {
      tarjetaFN.value = 0.00;
      chequeFN.value = 0.00;
       tarjetaFNRef.value = true;
      transferenciaFNRef.value = false;
      efetivoFNRef.value = false;
    } else if (metodo === 'TARJETA Y EFECTIVO') {
      transferenciaFN.value = 0.00;
      chequeFN.value = 0.00;
      transferenciaFNRef.value = true;
      efetivoFNRef.value = false;
      tarjetaFNRef.value = false;
    } else if (metodo === 'TARJETA Y TRANSFERENCIA') {
      efetivoFN.value = 0.00;
      chequeFN.value = 0.00;
      efetivoFNRef.value = true;
      tarjetaFNRef.value = false;
      transferenciaFNRef.value = false;
    } else if (metodo === 'TARJETA TRANSFERENCIA Y EFECTIVO') {
      efetivoFNRef.value = false;
      tarjetaFNRef.value = false;
      chequeFN.value = 0.00;
      transferenciaFNRef.value = false;
    }
  }else{
    visibleBanco.value = true
  }
});

/*   visibledinero.value = true;
      visibleBanco.value = true*/

const handleEfectivoChange = () => {
  if (metodoPago.value === 'EFECTIVO Y TRANSFERENCIA') {
    const nuevoTransferencia = total.value - efetivoFN.value;
    transferenciaFN.value = nuevoTransferencia >= 0 ? nuevoTransferencia : 0;
  } else if (metodoPago.value === 'TARJETA Y EFECTIVO') {
    const nuevoTarjeta = total.value - efetivoFN.value;
    tarjetaFN.value = nuevoTarjeta >= 0 ? nuevoTarjeta : 0;
  } else if (metodoPago.value === 'TARJETA TRANSFERENCIA Y EFECTIVO') {
    // Custom logic to handle three-way split can be added here if needed
  }
};

const handleTarjetaChange = () => {
  if (metodoPago.value === 'TARJETA Y EFECTIVO') {
    const nuevoEfectivo = total.value - tarjetaFN.value;
    efetivoFN.value = nuevoEfectivo >= 0 ? nuevoEfectivo : 0;
  } else if (metodoPago.value === 'TARJETA Y TRANSFERENCIA') {
    const nuevoTransferencia = total.value - tarjetaFN.value;
    transferenciaFN.value = nuevoTransferencia >= 0 ? nuevoTransferencia : 0;
  } else if (metodoPago.value === 'TARJETA TRANSFERENCIA Y EFECTIVO') {
    // Custom logic to handle three-way split can be added here if needed
  }
};

const handleTransferenciaChange = () => {
  if (metodoPago.value === 'EFECTIVO Y TRANSFERENCIA') {
    const nuevoEfectivo = total.value - transferenciaFN.value;
    efetivoFN.value = nuevoEfectivo >= 0 ? nuevoEfectivo : 0;
  } else if (metodoPago.value === 'TARJETA Y TRANSFERENCIA') {
    const nuevoTarjeta = total.value - transferenciaFN.value;
    tarjetaFN.value = nuevoTarjeta >= 0 ? nuevoTarjeta : 0;
  } else if (metodoPago.value === 'TARJETA TRANSFERENCIA Y EFECTIVO') {
    // Custom logic to handle three-way split can be added here if needed
  }
};

watch(efetivoFN, handleEfectivoChange);
watch(tarjetaFN, handleTarjetaChange);
watch(transferenciaFN, handleTransferenciaChange);
/************************************************************/
watch([tarjetaFN, metodoPagoTarjetaSeleccionado], () => {
  aplicarRecargoTarjeta();
});

watch(() => visibledinero.value, (newVal) => {
  if (!newVal) {
    productosSeleccionadosRecargo.value = [];
  }
});
/************************************************************/

// Observa cambios en productosVenta para recalcular el total de la factura
watch(productosVenta, (newProductosVenta) => {
  calcularTotalFactura();
  localStorage.setItem('productosVenta', JSON.stringify(newProductosVenta)); // Guardar los productos actualizados en localStorage
}, { deep: true });


/************************************************************/
watch(visibleOtroArticulo,(newValue) => {
  if (newValue) {

    if(nombreNProducto.value != ''){
      nombreNProducto.value = ''
    }

    const codigo = generarCodigoUnico();
    codigoNProducto.value = codigo;
    nombreNProducto.value = ''
    descripcionNProducto.value = ''
    pVentaNProducto.value = '0.00'
    costoNProducto.value = '0.00'
    stockNProducto.value = '1'
    categoriaNProducto.value = 'ACCESORIOS'
    imeiNProducto.value = ''
    imeiVerificado.value = null
    verificandoImei.value = false
  }else{
    nombreNProducto.value = ''
    descripcionNProducto.value = ''
    pVentaNProducto.value = '0.00'
    costoNProducto.value = '0.00'
    stockNProducto.value = '1'
    imeiNProducto.value = ''
    imeiVerificado.value = null
    verificandoImei.value = false
  }
});

/************************************************************/
watch(btnGratis,(newValue) => {
  if (newValue) {
     pVentaNProducto.value = '0.00';
     impuestoNProducto.value = '0.00';
  }
});
/************************************************************/
watch(visiblefatcoti,(newValue) => {
  if (newValue) {
    const ultimaFactura = noFacturasArray.value[0]
    if (ultimaFactura) {
    datosFactCoti.value.numero = ultimaFactura.value

    }

  }
});
/************************************************************/
// Función para verificar IMEI y obtener información del equipo
const verificarImeiNProducto = async () => {
  const imei = imeiNProducto.value.trim();

  // Validar que tenga 15 dígitos
  if (imei.length !== 15) {
    toast.add({ severity: 'warn', summary: 'Advertencia', detail: 'El IMEI debe tener 15 dígitos', life: 3000 });
    return;
  }

  // Validar que solo contenga números
  if (!/^\d+$/.test(imei)) {
    toast.add({ severity: 'warn', summary: 'Advertencia', detail: 'El IMEI solo debe contener números', life: 3000 });
    return;
  }

  verificandoImei.value = true;
  imeiVerificado.value = null;

  try {
    // 1. Primero buscar el IMEI en la base de datos local
    const verificaIMEILocal = await peticionesFetchOffline('getDataByField', 'imei', 'imei', imei);

    if (verificaIMEILocal) {
      // IMEI encontrado en BD local - llenar los datos del producto
      imeiVerificado.value = true;
      nombreNProducto.value = verificaIMEILocal.equipo || '';

      // También llenar los precios si están disponibles
      if (verificaIMEILocal.precio_venta) {
        pVentaNProducto.value = Number(verificaIMEILocal.precio_venta).toFixed(2);
      }
      if (verificaIMEILocal.precio_compra) {
        costoNProducto.value = Number(verificaIMEILocal.precio_compra).toFixed(2);
      }

      // Cambiar categoría a CELULARES
      categoriaNProducto.value = 'CELULARES';

      toast.add({
        severity: 'success',
        summary: 'IMEI Encontrado',
        detail: `Equipo: ${verificaIMEILocal.equipo || 'Sin nombre'}`,
        life: 3000
      });
    } else {
      // 2. Si no está en BD local, consultar API externa para obtener info del equipo
      toast.add({
        severity: 'info',
        summary: 'Buscando...',
        detail: 'IMEI no en inventario. Consultando información del equipo...',
        life: 2000
      });

      const datos = {
        service: 0,
        imei: imei,
        key: "JKD-QC9-9L9-9C6-GT7-J2I-LIV-U3M"
      };

      const response = await fetch("https://api.ifreeicloud.co.uk", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded"
        },
        body: new URLSearchParams(datos).toString(),
      });

      const status = response.status;

      if (status !== 200) {
        imeiVerificado.value = false;
        toast.add({
          severity: 'error',
          summary: 'Error HTTP',
          detail: `Código ${status}`,
          life: 3000
        });
        verificandoImei.value = false;
        return;
      }

      const myResult = await response.json();

      if (myResult.success !== true) {
        imeiVerificado.value = false;
        toast.add({
          severity: 'warn',
          summary: 'IMEI No Encontrado',
          detail: myResult.error || 'No se encontró información del equipo',
          life: 3000
        });
        verificandoImei.value = false;
        return;
      }

      // ✅ API respondió con datos del equipo
      imeiVerificado.value = 'api'; // Marcamos que vino de la API

      console.log('Respuesta API:', myResult.response);
      console.log('Objeto:', myResult.object);

      // Llenar los datos del producto con la info de la API
      categoriaNProducto.value = 'CELULARES';
      nombreNProducto.value = `${myResult.object.model || ''} (${myResult.object.modelName || ''})`.trim();

      toast.removeAllGroups();
      toast.add({
        severity: 'success',
        summary: 'Equipo Identificado',
        detail: `${myResult.object.brand || ''} ${myResult.object.modelName || ''}`,
        life: 4000
      });
    }
  } catch (error) {
    console.error('Error al verificar IMEI:', error);
    imeiVerificado.value = false;
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Error al verificar el IMEI',
      life: 3000
    });
  }

  verificandoImei.value = false;
};

// Watch para auto-verificar cuando el IMEI tenga 15 dígitos
watch(imeiNProducto, (newValue) => {
  // Resetear estado de verificación cuando cambia el IMEI
  imeiVerificado.value = null;

  // Auto-verificar cuando tenga exactamente 15 dígitos numéricos
  if (newValue && newValue.trim().length === 15 && /^\d+$/.test(newValue.trim())) {
    verificarImeiNProducto();
  }
});
/************************************************************/

const fnAgregarProducto = async () => {
   const camposProducto = await arrayToObjetoFromTabla(link.value+api.value,tokenCifrado.value,'productos');

const nombreCopia = JSON.parse(JSON.stringify(nombreNProducto.value));
 nombreNProducto.value = "";
camposProducto.codigo = codigoNProducto.value
camposProducto.codigo_barra = codigoNProducto.value
camposProducto.nombre = nombreCopia
camposProducto.descripcion = '' /*descripcionNProducto.value*/
camposProducto.categoria = categoriaNProducto.value
camposProducto.precio_venta = Number(pVentaNProducto.value)
camposProducto.precio_final = Number(pVentaNProducto.value)
camposProducto.precio_min = Number(pVentaNProducto.value)
camposProducto.precio_xmayor = Number(pVentaNProducto.value)
camposProducto.impuestos = Number(impuestoNProducto.value)
camposProducto.impuesto_venta = Number(impuestoNProducto.value)
camposProducto.precio_compra = Number(costoNProducto.value)
camposProducto.stock = Number(stockNProducto.value)
camposProducto.tipo_impuesto = 'Sin Imp.';

  if (btnGuardarProducto.value) {

/*    const verifica = await peticionesFetch(`${link.value}${api.value}`,`datoscampo/productos/nombre/${nombreCopia}`,{},tokenCifrado.value,'GET');*/
    const verifica = await peticionesFetchOffline('getDataByField', 'productos','nombre',nombreCopia);

      if (verifica) {
        toast.add({ severity: 'error', summary: 'Error', detail: 'Este Producto ya existe', life: 3000 });
        return
      }

       delete verifica.otro

      const url = link.value+api.value+"/insertar/productos";
      if (camposProducto.hasOwnProperty('created_at')) {
         camposProducto.created_at = nfecha('timestamp')
         camposProducto.updated_at = nfecha('timestamp')
        }
         camposProducto.almacen = datosEmpresa.empresa.nombre

      /*  const envioDatos = await enviarDatosPorPost(url, camposProducto,tokenCifrado.value);*/
        const envioDatos = await peticionesFetchOffline('insertData','productos', JSON.stringify(camposProducto));
        if (envioDatos[0] == 'ok') {
            toast.removeAllGroups();
           toast.add({ severity: 'success', summary: 'Éxito', detail: 'Producto Agregado exitosamente', life: 3000 });
            await fetchAndSetupData();

        }else{
          toast.add({ severity: 'error', summary: 'Error', detail: 'Fallo al Agregar el Producto.', life: 3000 });
       }
    }

    // Validar IMEI si se ingresó
    const imeiIngresado = imeiNProducto.value.trim();
    if (imeiIngresado && imeiIngresado.length !== 15) {
      toast.add({ severity: 'warn', summary: 'Advertencia', detail: 'El IMEI debe tener exactamente 15 dígitos', life: 3000 });
      return;
    }
    if (imeiIngresado && !/^\d+$/.test(imeiIngresado)) {
      toast.add({ severity: 'warn', summary: 'Advertencia', detail: 'El IMEI solo debe contener números', life: 3000 });
      return;
    }

    const productoExistente = productosVenta.value.find(prod => prod.codigo === camposProducto.codigo && !prod.imei_seleccionado);
    if (productoExistente && !imeiIngresado) {
      productoExistente.cantidad += 1;
    } else {
      camposProducto.cantidad = Number(cantidadNProducto.value)
      camposProducto.descuento = 0.00
      camposProducto.total = (Number(cantidadNProducto.value) * Number(pVentaNProducto.value))
      camposProducto.ganancia = ((Number(pVentaNProducto.value) - Number(costoNProducto.value)) * Number(cantidadNProducto.value))
      camposProducto.ganancia_pura = ((Number(pVentaNProducto.value) - Number(costoNProducto.value)) * Number(cantidadNProducto.value))
      camposProducto.marca = 'SIN REGISTRO'
      // Agregar IMEI si se ingresó
      if (imeiIngresado) {
        camposProducto.imei_seleccionado = imeiIngresado;
        camposProducto.nombre = `${nombreCopia} - ${imeiIngresado}`; // Nombre con IMEI
        camposProducto.cantidad = 1; // Con IMEI siempre es cantidad 1
        camposProducto.total = Number(pVentaNProducto.value);
        camposProducto.ganancia = Number(pVentaNProducto.value) - Number(costoNProducto.value);
        camposProducto.ganancia_pura = Number(pVentaNProducto.value) - Number(costoNProducto.value);
      }
      delete camposProducto.otro
      productosVenta.value.push(camposProducto);
    }
    calcularTotalFactura();
    visibleOtroArticulo.value = false
 nombreNProducto.value = "";
 categoriaNProducto.value = 'ACCESORIOS'
 imeiNProducto.value = "";

};
/************************************************************/
    const fnAgregarProductoPOS = (producto) => {
      if (!producto) {
        toast.add({ severity: 'error', summary: 'Upps', detail: 'Producto invalido', life: 500 });
        return;
      }
      const selected = productosArray.value.find((prod) => {
        if (producto.id && prod.id === producto.id) return true;
        if (producto.codigo && prod.codigo === producto.codigo) return true;
        if (producto.codigo && prod.codigo === producto.codigo) return true;
        if (producto.codigo_barra && prod.codigo_barra === producto.codigo_barra) return true;
        return false;
      });
      if (selected) {
        datosProductoBuscado.value = selected;
        fnagregarProductoBuscado();
         toast.removeAllGroups();
        toast.add({ severity: 'success', summary: 'OK', detail: `${selected.nombre} Agregado`, life: 500 });
      } else {
        toast.add({ severity: 'error', summary: 'Upps', detail: 'Error al Agregar', life: 500 });
      }
    };
/************************************************************/
const fnSwitchBuscadorPor = ()=>{
  if (switchbuscarpor.value == 'Nombre') {
      listaBuscador.value = productosArray.value.map(prod=>prod.nombre);
  }else{
     listaBuscador.value = productosArray.value.map(prod=>prod.codigo_barra);
  }


}
/************************************************************/
const fnAwesomplete = (event)=>{
  //console.log(awesompleteprecio.value)
}
/************************************************************/
const abrirModalProducto = async (producto) => {
  if (!producto) {
    toast.add({ severity: 'error', summary: 'Upps', detail: 'Producto inválido', life: 800 });
    return;
  }

  // Si está activo "Agregar directo" y el producto NO es CELULARES ni ELECTRODOMESTICOS, agregar al carrito directamente
  const categoriaProducto = (producto.categoria || '').toUpperCase();
  if (agregarDirectoCarrito.value && categoriaProducto !== 'CELULARES' && categoriaProducto !== 'ELECTRODOMESTICOS') {
    datosProductoBuscado.value = { ...producto };
    cantidadProductoBuscado.value = 1;
    await fnagregarProductoBuscado();
    return;
  }
  const precioVenta = Number(producto.precio_venta || 0);
  productoModal.value = {
    ...producto,
    precio_min: producto.precio_min ?? producto.precio_venta,
    precio_xmayor: producto.precio_xmayor ?? producto.precio_venta,
    precio_venta: precioVenta || Number(producto.precio_min || producto.precio_xmayor || 0)
  };
  mostrarPrincipioActivoModal.value = false;
  cantidadProductoModal.value = 1;
  imeisSeleccionadosModal.value = [];
  filtroImeiModal.value = '';

  // Cargar IMEI del producto
  await fetchImeiProductoModal(producto.id);

  // Verificar qué IMEIs ya están en el carrito y pre-seleccionarlos
  const imeisEnCarrito = productosVenta.value.filter(p => p.imei_seleccionado && p.id === producto.id);
  if (imeisEnCarrito.length > 0) {
    imeisEnCarrito.forEach(prodCarrito => {
      // Buscar el IMEI en la lista de disponibles
      const imeiEnLista = imeiProductoModal.value.find(i => i.imei === prodCarrito.imei_seleccionado);
      if (imeiEnLista) {
        // Determinar qué tipo de precio se usó basándose en el precio_venta del carrito
        const precioCarrito = Number(prodCarrito.precio_venta || 0);
        const precioP1 = Number(imeiEnLista.precio_venta || productoModal.value.precio_venta || 0);
        const precioP2 = Number(imeiEnLista.precio_min || productoModal.value.precio_min || 0);
        const precioP3 = Number(imeiEnLista.precio_xmayor || productoModal.value.precio_xmayor || 0);

        // Determinar el precio seleccionado
        let tipoPrecio = 'precio_venta';
        if (precioCarrito === precioP2) tipoPrecio = 'precio_min';
        else if (precioCarrito === precioP3) tipoPrecio = 'precio_xmayor';

        imeiEnLista.precio_seleccionado = tipoPrecio;
        // Agregar a los seleccionados
        imeisSeleccionadosModal.value.push(imeiEnLista);
      }
    });
    cantidadProductoModal.value = imeisSeleccionadosModal.value.length;
  }

  visibleProductoModal.value = true;
};

// Función para cargar los IMEI del producto seleccionado
const fetchImeiProductoModal = async (idProducto) => {
  try {
    if (!idProducto) {
      imeiProductoModal.value = [];
      return;
    }
    const response = await peticionesFetchOffline(
      'getDataArrayByTwoConditions',
      'imei',
      'id_equi',
      idProducto,
      'estado',
      'DISPONIBLE'
    );
    // Agregar precio_seleccionado por defecto a cada IMEI (el precio más alto)
    imeiProductoModal.value = (response || []).map(imei => {
      // Determinar cuál es el precio más alto del IMEI
      const precioVenta = Number(imei.precio_venta || 0);
      const precioMin = Number(imei.precio_min || 0);
      const precioXmayor = Number(imei.precio_xmayor || 0);

      let precioMasAlto = 'precio_venta';
      let valorMasAlto = precioVenta;

      if (precioMin > valorMasAlto) {
        precioMasAlto = 'precio_min';
        valorMasAlto = precioMin;
      }
      if (precioXmayor > valorMasAlto) {
        precioMasAlto = 'precio_xmayor';
      }

      return {
        ...imei,
        precio_seleccionado: precioMasAlto,
        precio_manual: precioVenta // Por defecto el precio_venta para editar
      };
    });
  } catch (error) {
    console.error('Error al cargar IMEI:', error);
    imeiProductoModal.value = [];
  }
};

// Función para seleccionar el precio de un IMEI específico
const seleccionarPrecioImei = (imeiData, tipoPrecio) => {
  const index = imeiProductoModal.value.findIndex(i => i.imei === imeiData.imei);
  if (index !== -1) {
    imeiProductoModal.value[index].precio_seleccionado = tipoPrecio;

    // Verificar si el IMEI ya está seleccionado
    const indexSeleccionado = imeisSeleccionadosModal.value.findIndex(i => i.imei === imeiData.imei);
    if (indexSeleccionado !== -1) {
      // Actualizar el precio seleccionado y precio manual si ya está en la lista
      imeisSeleccionadosModal.value[indexSeleccionado].precio_seleccionado = tipoPrecio;
      imeisSeleccionadosModal.value[indexSeleccionado].precio_manual = imeiProductoModal.value[index].precio_manual;
    } else {
      // Auto-seleccionar el IMEI cuando se elige un precio
      imeisSeleccionadosModal.value.push({
        ...imeiProductoModal.value[index],
        precio_seleccionado: tipoPrecio
      });
    }

    // Si el IMEI ya está en el carrito, actualizar el precio del producto
    const productoEnCarrito = productosVenta.value.find(p => p.imei_seleccionado === imeiData.imei);
    if (productoEnCarrito) {
      // Obtener el nuevo precio según el tipo seleccionado
      let nuevoPrecio;
      if (tipoPrecio === 'precio_manual') {
        nuevoPrecio = Number(imeiProductoModal.value[index].precio_manual || 0);
      } else {
        const precioDelImei = Number(imeiData[tipoPrecio] || 0);
        const precioDelProducto = Number(productoModal.value[tipoPrecio] || productoModal.value.precio_venta || 0);
        nuevoPrecio = precioDelImei > 0 ? precioDelImei : precioDelProducto;
      }

      // Calcular precio de compra
      const precioCompraImei = Number(imeiData.precio_compra || 0);
      const precioCompraProducto = Number(productoModal.value?.precio_compra || 0);
      const precioCompra = precioCompraImei > 0 ? precioCompraImei : precioCompraProducto;
      const gananciaCalculada = nuevoPrecio - precioCompra;

      // Actualizar el producto en el carrito
      productoEnCarrito.precio_venta = nuevoPrecio;
      productoEnCarrito.precio_final = nuevoPrecio;
      productoEnCarrito.total = nuevoPrecio;
      productoEnCarrito.ganancia = gananciaCalculada;
      productoEnCarrito.ganancia_pura = gananciaCalculada;

      // Recalcular totales de la factura
      calcularTotalFactura();
    }
  }
};

// Obtener el precio final de un IMEI según su selección
const obtenerPrecioFinalImei = (imeiData) => {
  if (imeiData.precio_seleccionado === 'precio_manual') {
    return Number(imeiData.precio_manual || 0).toFixed(2);
  }
  return Number(imeiData[imeiData.precio_seleccionado] || imeiData.precio_venta || 0).toFixed(2);
};

// Obtener los IMEI seleccionados para agregar al carrito
const getImeisSeleccionados = () => {
  return imeisSeleccionadosModal.value.map(imei => imei.imei);
};

// Watch para actualizar la cantidad cuando se seleccionan IMEI
watch(imeisSeleccionadosModal, (nuevosImeis) => {
  if (nuevosImeis.length > 0) {
    cantidadProductoModal.value = nuevosImeis.length;
  }
}, { deep: true });

const togglePrincipioActivoModal = () => {
  mostrarPrincipioActivoModal.value = !mostrarPrincipioActivoModal.value;
};

const consultarIAProductoModal = () => {
  if (!productoModal.value) return;

  // Limpiar chat anterior
  mensajesIA.value = [];

  // Ir al tab de chat (tab 0)
  iaActiveTab.value = 0;

  // Abrir el modal del asistente IA
  visibleAsistenteIA.value = true;

  // Construir pregunta sobre el equipo específico
  const producto = productoModal.value;
  const nombreEquipo = producto.nombre || 'este equipo';
  const marca = producto.marca || '';
  const categoria = producto.categoria || '';
  const precio = producto.precio_venta ? `$${Number(producto.precio_venta).toFixed(2)}` : '';

  let preguntaEquipo = `Dame información detallada sobre el ${nombreEquipo}`;
  if (marca) preguntaEquipo += ` de la marca ${marca}`;
  preguntaEquipo += `. Incluye: especificaciones técnicas principales, puntos fuertes, puntos débiles, para qué tipo de usuario es ideal y comparación con modelos similares en el mercado.`;

  // Enviar la pregunta automáticamente
  setTimeout(() => {
    preguntaRapidaIA(preguntaEquipo);
  }, 300);
};

const obtenerStockProductoModal = () => {
  return Number(productoModal.value?.stock ?? productoModal.value?.stock ?? 0);
};

const validarCantidadProductoModal = () => {
  if (!productoModal.value) return;
  const stockDisponible = obtenerStockProductoModal();
  let cantidad = Number(cantidadProductoModal.value || 0);

  if (cantidad < 1) cantidad = 1;

  if (stockDisponible > 0 && cantidad > stockDisponible) {
    cantidad = stockDisponible;
    Swal.fire({
      icon: 'warning',
      title: 'Stock insuficiente',
      text: `Solo hay ${stockDisponible} en stock.`
    });
  }

  cantidadProductoModal.value = cantidad;
};

const incrementarCantidadProductoModal = () => {
  const cantidadActual = Number(cantidadProductoModal.value || 0);
  const stockDisponible = obtenerStockProductoModal();
  const siguiente = cantidadActual + 1;

  if (stockDisponible > 0 && siguiente > stockDisponible) {
    Swal.fire({
      icon: 'warning',
      title: 'Stock insuficiente',
      text: `Solo hay ${stockDisponible} en stock.`
    });
    return;
  }

  cantidadProductoModal.value = siguiente;
};

const decrementarCantidadProductoModal = () => {
  const cantidadActual = Number(cantidadProductoModal.value || 0);
  if (cantidadActual > 1) {
    cantidadProductoModal.value = cantidadActual - 1;
  }
};

const agregarProductoDesdeModal = () => {
  if (!productoModal.value) return;
  const stockDisponible = Number(productoModal.value.stock ?? productoModal.value.stock ?? 0);

  // Si hay IMEI seleccionados, usar la cantidad de IMEI como cantidad
  const tieneImeisSeleccionados = imeisSeleccionadosModal.value.length > 0;
  const cantidadFinal = tieneImeisSeleccionados
    ? imeisSeleccionadosModal.value.length
    : Number(cantidadProductoModal.value || 1);

  if (stockDisponible <= 0 && !tieneImeisSeleccionados) {
    Swal.fire({
      icon: 'error',
      title: 'Sin stock',
      text: 'No se puede agregar al carrito sin stock'
    });
    visibleProductoModal.value = false;
    return;
  }

  if (!tieneImeisSeleccionados && cantidadFinal > stockDisponible) {
    Swal.fire({
      icon: 'warning',
      title: 'Stock insuficiente',
      text: `Solo hay ${stockDisponible} en stock.`
    });
    cantidadProductoModal.value = stockDisponible;
    return;
  }

  // Si es CELULARES debe tener IMEI seleccionado obligatoriamente
  if (productoModal.value.categoria === 'CELULARES' && !tieneImeisSeleccionados) {
    visibleProductoModal.value = false;
    Swal.fire({
      icon: 'warning',
      title: 'IMEI requerido',
      html: `
        <div style="text-align: center; padding: 10px;">
          <p>Para agregar productos de la categoría <strong>CELULARES</strong> al carrito, debe seleccionar al menos un <strong>IMEI</strong>.</p>
          <hr style="margin: 15px 0;">
          <p style="color: #6b7280; font-size: 14px;">Seleccione uno o más IMEI desde la tabla de detalles del producto.</p>
        </div>
      `,
      confirmButtonText: 'Entendido',
      confirmButtonColor: '#3085d6'
    });
    return;
  }

  // Si es categoria CELULARES y hay IMEIs seleccionados, agregar cada IMEI como producto individual
  if (productoModal.value.categoria === 'CELULARES' && tieneImeisSeleccionados) {
    // Primero validar que ningún IMEI tenga precio menor al costo
    for (const imeiData of imeisSeleccionadosModal.value) {
      const precioSeleccionado = imeiData.precio_seleccionado || 'precio_venta';
      let precioAValidar;
      if (precioSeleccionado === 'precio_manual') {
        precioAValidar = Number(imeiData.precio_manual || 0);
      } else {
        precioAValidar = Number(imeiData[precioSeleccionado] || 0);
      }
      const precioCompraImei = Number(imeiData.precio_compra || 0);
      const precioCompraProducto = Number(productoModal.value.precio_compra || 0);
      const precioCompraValidar = precioCompraImei > 0 ? precioCompraImei : precioCompraProducto;

      if (precioAValidar < precioCompraValidar) {
        // Cerrar la modal para que se vea la alerta
        visibleProductoModal.value = false;

        Swal.fire({
          icon: 'warning',
          title: 'Precio por debajo del costo',
          html: `
            <div style="text-align: left; padding: 10px;">
              <p><strong>IMEI:</strong> ${imeiData.imei}</p>
              <p><strong>Precio ingresado:</strong> <span style="color: #dc2626;">${datosConfiguracion.value?.simbolo || '$'}${precioAValidar.toFixed(2)}</span></p>
              <p><strong>Precio de compra:</strong> ${datosConfiguracion.value?.simbolo || '$'}${precioCompraValidar.toFixed(2)}</p>
              <hr style="margin: 10px 0;">
              <p style="color: #dc2626;">El precio de venta no puede ser menor al precio de compra.</p>
            </div>
          `,
          confirmButtonText: 'Entendido',
          confirmButtonColor: '#3085d6'
        });
        return;
      }
    }

    for (const imeiData of imeisSeleccionadosModal.value) {
      const precioSeleccionado = imeiData.precio_seleccionado || 'precio_venta';
      // Calcular precio final según el tipo seleccionado
      let precioFinal;
      if (precioSeleccionado === 'precio_manual') {
        // Usar precio manual editado por el usuario
        precioFinal = Number(imeiData.precio_manual || 0);
      } else {
        // Usar precio del IMEI si existe, sino usar el precio del producto
        const precioDelImei = Number(imeiData[precioSeleccionado] || 0);
        const precioDelProducto = Number(productoModal.value[precioSeleccionado] || productoModal.value.precio_venta || 0);
        precioFinal = precioDelImei > 0 ? precioDelImei : precioDelProducto;
      }
      // Usar precio de compra del IMEI si existe, sino usar el del producto
      const precioCompraImei = Number(imeiData.precio_compra || 0);
      const precioCompraProducto = Number(productoModal.value.precio_compra || 0);
      const precioCompra = precioCompraImei > 0 ? precioCompraImei : precioCompraProducto;
      const gananciaCalculada = precioFinal - precioCompra;
      const nombreConImei = `${productoModal.value.nombre} - ${imeiData.imei}`;

      // Verificar si el IMEI ya está en el carrito
      const productoExistenteEnCarrito = productosVenta.value.find(p => p.imei_seleccionado === imeiData.imei);

      if (productoExistenteEnCarrito) {
        // Actualizar el producto existente en el carrito
        productoExistenteEnCarrito.precio_venta = precioFinal;
        productoExistenteEnCarrito.precio_final = precioFinal;
        productoExistenteEnCarrito.total = precioFinal;
        productoExistenteEnCarrito.precio_compra = precioCompra;
        productoExistenteEnCarrito.ganancia = gananciaCalculada;
        productoExistenteEnCarrito.ganancia_pura = gananciaCalculada;
      } else {
        // Crear nuevo producto con IMEI
        const productoConImei = {
          ...productoModal.value,
          nombre: nombreConImei,
          nombre_comercial: nombreConImei, // Para que aparezca en la factura
          precio_venta: precioFinal,
          precio_venta_original: precioFinal, // Guardar precio original para cambios de impuesto
          precio_final: precioFinal,
          total: precioFinal,
          precio_compra: precioCompra, // Precio de compra del IMEI
          ganancia: gananciaCalculada,
          ganancia_pura: gananciaCalculada,
          cantidad: 1,
          imei: imeiData.imei,
          imei_seleccionado: imeiData.imei, // Solo el IMEI sin el nombre
          imei_unico: imeiData.imei, // Para evitar que se combinen productos con diferentes IMEIs
          id_unico_imei: `${productoModal.value.id}_${imeiData.imei}`, // ID unico para el carrito
          descuento: 0,
          impuestos_original: Number(productoModal.value.impuestos || 0) // Guardar impuesto original
        };

        // Agregar directamente al carrito sin usar la función compartida
        delete productoConImei.caracteristicas;
        delete productoConImei.otro;
        productosVenta.value.push(productoConImei);
      }
    }

    // Primero aplicar impuestos según configuración, luego recalcular totales
    fncambioTipoImpuesto();
    visibleProductoModal.value = false;
    return;
  }

  // Comportamiento original para otros productos (no CELULARES)
  const precioVenta = Number(productoModal.value.precio_venta || 0);
  const precioCompra = Number(productoModal.value.precio_compra || 0);
  const gananciaCalculada = (precioVenta - precioCompra) * cantidadFinal;
  const totalCalculado = precioVenta * cantidadFinal;

  const productoParaCarrito = {
    ...productoModal.value,
    nombre: productoModal.value.nombre || productoModal.value.nombre_comercial || 'SIN NOMBRE',
    nombre_comercial: productoModal.value.nombre_comercial || productoModal.value.nombre || 'SIN NOMBRE',
    precio_venta: precioVenta,
    precio_final: precioVenta,
    total: totalCalculado,
    ganancia: gananciaCalculada,
    ganancia_pura: gananciaCalculada,
    cantidad: cantidadFinal,
    imeis_seleccionados: imeisSeleccionadosModal.value.map(i => ({
      imei: i.imei,
      precio_venta: i.precio_venta,
      precio_min: i.precio_min,
      precio_xmayor: i.precio_xmayor,
      precio_seleccionado: i.precio_seleccionado || 'precio_venta',
      precio_final: Number(i[i.precio_seleccionado] || i.precio_venta || 0)
    }))
  };

  datosProductoBuscado.value = productoParaCarrito;
  cantidadProductoBuscado.value = cantidadFinal;
  fnagregarProductoBuscado();
  visibleProductoModal.value = false;
};

/************************************************************/
const seleccionarPrecioModal = async (precioIndex) => {
  const precioActual = Number(productoModal.value?.precio_venta || 0);
  const precio1 = Number(productoModal.value?.precio_venta || 0);
  const precio2 = Number(productoModal.value?.precio_min || precio1);
  const precio3 = Number(productoModal.value?.precio_xmayor || precio1);

  if (precioIndex === 1) {
    const datosProd = await peticionesFetchOffline('getDataByField', 'productos', 'id', productoModal.value.id);
    // Usar el precio de la BD si existe, sino mantener el precio actual
    const nuevoPrecio = Number(datosProd?.precio_venta || 0);
    productoModal.value.precio_venta = nuevoPrecio > 0 ? nuevoPrecio : precioActual;
  } else if (precioIndex === 2) {
    productoModal.value.precio_venta = precio2 || precio1 || precio3 || precioActual;
  } else if (precioIndex === 3) {
    productoModal.value.precio_venta = precio3 || precio1 || precio2 || precioActual;
  }
};

/************************************************************/
const abrirEditarProductoModal = () => {
  if (!productoModal.value) return;
  productoEditando.value = { ...productoModal.value };
  visibleEditarProductoModal.value = true;
};

const guardarEdicionProducto = async () => {
  const actualizado = { ...productoEditando.value };
  const esMismoProducto = (prod) => {
    if (actualizado.id && prod.id === actualizado.id) return true;
    if (actualizado.codigo && prod.codigo === actualizado.codigo) return true;
    if (actualizado.codigo && prod.codigo === actualizado.codigo) return true;
    return false;
  };

  // Persistir en la tabla productos (offline)
  try {
    let productoDB = null;
    if (actualizado.codigo) {
      productoDB = await peticionesFetchOffline('getDataByField', 'productos', 'codigo_interno', actualizado.codigo);
    }
    if (!productoDB && actualizado.id) {
      productoDB = await peticionesFetchOffline('getDataByField', 'productos', 'id', actualizado.id);
    }
    if (productoDB) {
      const productoActualizadoDB = { ...productoDB, ...actualizado };
      await peticionesFetchOffline('updateData', 'productos', JSON.stringify(productoActualizadoDB));
    }
  } catch (error) {
    console.error('Error actualizando producto en BD:', error);
    toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo guardar en productos', life: 3000 });
  }

  const indexProducto = productosArray.value.findIndex(esMismoProducto);
  if (indexProducto >= 0) {
    productosArray.value[indexProducto] = { ...productosArray.value[indexProducto], ...actualizado };
  }
  const indexProductoBase = productosArraySinModificaciones.value.findIndex(esMismoProducto);
  if (indexProductoBase >= 0) {
    productosArraySinModificaciones.value[indexProductoBase] = { ...productosArraySinModificaciones.value[indexProductoBase], ...actualizado };
  }

  const indexVenta = productosVenta.value.findIndex(esMismoProducto);
  if (indexVenta >= 0) {
    productosVenta.value[indexVenta] = { ...productosVenta.value[indexVenta], ...actualizado };
  }

  productoModal.value = { ...productoModal.value, ...actualizado };
  visibleEditarProductoModal.value = false;
};

/************************************************************/
const aplicarComprobanteRapido = (tipoComprobante) => {
  comprobante.value = tipoComprobante;
  visibleComprobanteRapido.value = false;
  toast.add({ severity: 'success', summary: 'Ok', detail: `Comprobante: ${mensajeComprobantes.value[tipoComprobante]}`, life: 1500 });
};

/************************************************************/
const handleSelectComplete = (selected) => {

    if (switchbuscarpor.value == 'Nombre') {
      datosProductoBuscado.value = productosArray.value.find(prod=>prod.nombre == selected.value);
  }else{
     datosProductoBuscado.value = productosArray.value.find(prod=>prod.codigo_barra == selected.value);
  }

nombreProductoBuscado.value = datosProductoBuscado.value.nombre
precioVentaProductoBuscado.value = datosProductoBuscado.value.precio_venta
impuestosProductoBuscado.value = datosProductoBuscado.value.impuesto_venta
precioTotalProductoBuscado.value = datosProductoBuscado.value.precio_final
precioMinimoProductoBuscado.value = datosProductoBuscado.value.precio_min
precioXMayorProductoBuscado.value = datosProductoBuscado.value.precio_xmayor
stockProductoBuscado.value = datosProductoBuscado.value.stock
ubicacionProductoBuscado.value = datosProductoBuscado.value.ubicacion

if (Number(datosProductoBuscado.value.stock) < 1) {
    disponibilidadProductoBuscado.value = 'bg-danger';
    disponibilidadProducto.value = 'NO HAY DISPONIBILIDAD';
} else if (Number(datosProductoBuscado.value.stock) <= Number(datosProductoBuscado.value.alerta)) {
    disponibilidadProductoBuscado.value = 'bg-warning';
    disponibilidadProducto.value = 'DISPONIBILIDAD BAJA';
} else {
    disponibilidadProductoBuscado.value = 'bg-success';
    disponibilidadProducto.value = 'DISPONIBILIDAD ALTA';
}



};
/************************************************************/
const fnagregarProductoBuscado = async() => {
  // Crear una copia del producto buscado para evitar modificar el original
  const productoParaAgregar = { ...datosProductoBuscado.value };
  const cantidadNueva = Number(cantidadProductoBuscado.value || 1);
  productoParaAgregar.cantidad = cantidadNueva;
  productoParaAgregar.descuento = productoParaAgregar.descuento || 0.00;

  // Asegurar que tenga nombre
  if (!productoParaAgregar.nombre) {
    productoParaAgregar.nombre = productoParaAgregar.nombre_comercial || 'SIN NOMBRE';
  }
  if (!productoParaAgregar.nombre_comercial) {
    productoParaAgregar.nombre_comercial = productoParaAgregar.nombre || 'SIN NOMBRE';
  }

  // Asegurar precio_final
  if (!productoParaAgregar.precio_final || productoParaAgregar.precio_final <= 0) {
    productoParaAgregar.precio_final = Number(productoParaAgregar.precio_venta || 0);
  }

  // Calcular total si no viene calculado o es inválido
  const precioVenta = Number(productoParaAgregar.precio_venta || 0);
  const precioCompra = Number(productoParaAgregar.precio_compra || 0);

  // Guardar precio original si no existe (para cambios de impuesto)
  if (!productoParaAgregar.precio_venta_original) {
    productoParaAgregar.precio_venta_original = precioVenta;
  }

  // Guardar porcentaje de impuesto original del producto
  if (productoParaAgregar.impuestos_original === undefined) {
    productoParaAgregar.impuestos_original = Number(productoParaAgregar.impuestos || 0);
  }

  if (!productoParaAgregar.total || isNaN(productoParaAgregar.total) || productoParaAgregar.total <= 0) {
    productoParaAgregar.total = precioVenta * cantidadNueva;
  }

  // Calcular ganancia si no viene calculada o es inválida
  if (productoParaAgregar.ganancia === undefined || isNaN(productoParaAgregar.ganancia)) {
    productoParaAgregar.ganancia = (precioVenta - precioCompra) * cantidadNueva;
  }
  if (productoParaAgregar.ganancia_pura === undefined || isNaN(productoParaAgregar.ganancia_pura)) {
    productoParaAgregar.ganancia_pura = (precioVenta - precioCompra) * cantidadNueva;
  }

  // Asegurar que productos CELULARES tengan el campo imei
  if (productoParaAgregar.categoria === 'CELULARES' && productoParaAgregar.imei_seleccionado) {
    productoParaAgregar.imei = productoParaAgregar.imei_seleccionado;
  }

  // Verificar si el producto ya existe en productosVenta
  // Si tiene id_unico_imei, es un celular con IMEI individual y debe compararse por ese ID
  const productoExistente = productosVenta.value.find((prod) => {
    // Si es producto con IMEI individual, comparar por id_unico_imei
    if (productoParaAgregar.id_unico_imei && prod.id_unico_imei) {
      return prod.id_unico_imei === productoParaAgregar.id_unico_imei;
    }
    // Si el producto a agregar tiene IMEI individual, no combinar con otros
    if (productoParaAgregar.id_unico_imei) return false;
    // Comparacion normal para productos sin IMEI individual
    if (productoParaAgregar.id && prod.id === productoParaAgregar.id && !prod.id_unico_imei) return true;
    if (productoParaAgregar.codigo && prod.codigo === productoParaAgregar.codigo && !prod.id_unico_imei) return true;
    if (productoParaAgregar.codigo_barra && prod.codigo_barra === productoParaAgregar.codigo_barra && !prod.id_unico_imei) return true;
    return false;
  });
  if (productoExistente) {
    productoExistente.cantidad += productoParaAgregar.cantidad;
    // Recalcular total y ganancia
    const precioExistente = Number(productoExistente.precio_venta || 0);
    const costoExistente = Number(productoExistente.precio_compra || 0);
    productoExistente.total = precioExistente * productoExistente.cantidad;
    productoExistente.ganancia = (precioExistente - costoExistente) * productoExistente.cantidad;
    productoExistente.ganancia_pura = productoExistente.ganancia;
  } else {
    delete productoParaAgregar.caracteristicas
    delete productoParaAgregar.otro
    productosVenta.value.push(productoParaAgregar);
  }

  // No aplicar verificacion de precios por cliente a productos agregados desde modal
  // ya que ya tienen su precio establecido correctamente
  // if (!productoParaAgregar.id_unico_imei) {
  //   verificaPreciosPorCliente(productoParaAgregar)
  // }

  // Aplicar impuestos según configuración y recalcular totales
  fncambioTipoImpuesto()

  // Restablecer datos y campos de entrada relacionados con el producto buscado
  datosProductoBuscado.value = {};
  awesompleteprecio.value = '';
  nombreProductoBuscado.value = 'BUSCAR PRODUCTO';
  precioVentaProductoBuscado.value = '0.00';
  impuestosProductoBuscado.value = '0.00';
  precioTotalProductoBuscado.value = '0.00';
  precioMinimoProductoBuscado.value = '0.00';
  precioXMayorProductoBuscado.value = '0.00';
  stockProductoBuscado.value = '0.00';
  ubicacionProductoBuscado.value = '';
  disponibilidadProductoBuscado.value = 'bg-dark';
  disponibilidadProducto.value = 'CONSULTE PRODUCTO';

  // Si hay una mesa activa, actualizar los productos en la mesa
  if (mesaActiva.value) {
    agregarProductosAmesa(mesaActiva.value);
  }


};

/************************************************************/
//buscarPorImei
const switchBuscadorPrincipal = ()=>{
  if (searchMode.value == 'nombre') {
     listaBuscador.value = productosArray.value.map(prod=>prod.nombre)
  }else if(searchMode.value == 'codigo'){
     listaBuscador.value = productosArray.value.map(prod=>prod.codigo)
  }else{
     listaBuscador.value = productosArray.value.map(prod=>prod.codigo_barra)
  }
}
/************************************************************/
let lastSearchedValue = ''; // Almacena el último valor buscado
/************************************************************/
function buscarProducto(value) {
  const valorSeleccionado = value?.value ?? value?.label ?? value;
  if (!valorSeleccionado) return;
  lastSearchedValue = valorSeleccionado;
  datosProductoSeleccionadoPrincipal.value = '';

  const camposABuscar = ['codigo', 'codigo_interno', 'codigo_barra', 'nombre', 'nombre_comercial', 'nombre_generico'];
  let datosPro = null;

  // Find the product in productosArray based on multiple fields
  for (const campo of camposABuscar) {
    const encontrado = productosArray.value.find(prod => prod[campo] == valorSeleccionado);
    if (encontrado) {
      datosPro = encontrado;

      datosProductoSeleccionadoPrincipal.value = encontrado;
      break;
    }
  }


  if (datosPro) {
    visibleOtroArticulo.value = false;
  } else {
    const articulo = awesompleteproductoprincipal.value;
    
    // Check if articulo is numeric or text
    const isNumeric = !isNaN(parseFloat(articulo)) && isFinite(articulo);

      if (isNumeric) {
        codigoNProducto.value = articulo
      }else{
        nombreNProducto.value = articulo.toUpperCase()
      }
    
    awesompleteproductoprincipal.value = '';
    //visibleOtroArticulo.value = true; 
    //toast.add({ severity: 'error', summary: 'Error', detail: 'Producto no Encontrado', life: 3000 });
  }
}



/************************************************************/
const productoFinded = ref(null)
/************************************************************/
const fnAwesompleteproductoprincipal = (selected)=>{
  productoFinded.value = selected
    //handleKeydownEnter()
   //console.log(awesompleteproductoprincipal.value)
   //alert('ok')
   //actualizarFactura()
}
/************************************************************/
function handleEnterKey() {
  if (isManualInput) {
    buscarProducto(productoFinded.value);
  }
}
/************************************************************/
const verificaPreciosPorCliente = async(prod)=>{
  const cliente = clienteSelected.value
  
   const precioSelected = parseFloat(prod.precio_venta)
   const copiaProductos = JSON.parse(JSON.stringify(productosArraySinModificaciones.value))
   const existeProducto = copiaProductos.find(pr=> pr.codigo === prod.codigo )
   
   if(existeProducto){
      const precioOriginal = parseFloat(existeProducto.precio_venta)
      if(precioSelected === precioOriginal){
          if(cliente.precio_fijado === 'Normal'){
            fnPrecioNormal(prod.codigo)
          }else if(cliente.precio_fijado === 'Minimo'){
            fnPrecioMinimo(prod.codigo)
          }else if(cliente.precio_fijado === 'PorMayor'){
            fnXmayor(prod.codigo)
          }else{
            fnPrecioNormal(prod.codigo)
          }
      }

   }

}
/************************************************************/
/*const verificaComprobante = async()=>{
  productosVenta.value.forEach(producto => {
      fmImpuestoIncluido(prod.codigo)
  });

}*/
/************************************************************/


const nombreProductFerreteria = ref('')
const empaqueProductFerreteria = ref('UNIDAD')
const cantidadProductFerreteria = ref(null)
const cantidadFerreteria = ref(1)
const precioFerreteria = ref(null)
const precioProductFerreteria = ref('0.00')
const cantidad = ref(1);
const preciosArrayFerreteria = ref([])
/************************************************************/
const buscadorFerreteria = async(selected) => {
  const camposABuscar = ['codigo_interno', 'codigo_barra', 'nombre_comercial','nombre_generico'];
  let datosPro = null;

  // Limpiar datos previos
  datosProductoSeleccionadoPrincipal.value = '';
  preciosArrayFerreteria.value = [];

  // Buscar el producto y crear una copia si es encontrado
  for (const campo of camposABuscar) {
    datosPro = productosArray.value.find((prod) => prod[campo] == selected.value);
    if (datosPro) {
      datosProductoSeleccionadoPrincipal.value = {cantidad:cantidad.value || 1, ...datosPro }; // Crear una copia
      break;
    }
  }

  // Verificar si `datosPro` fue encontrado antes de asignar valores
  if (datosPro) {
    preciosArrayFerreteria.value = [
      datosPro.precio_venta,
      datosPro.precio_min,
      datosPro.precio_xmayor,
    ];

    // Asignar valores al formulario sin modificar `datosPro`
    nombreProductFerreteria.value = datosPro.nombre;
    empaqueProductFerreteria.value = datosPro.empaque;
    precioProductFerreteria.value = datosPro.precio_venta;
    awesompleteproductoprincipal.value = '';

    const siguienteRef = "cantidadNN"
    const nextField = document.getElementById(siguienteRef);
    if (nextField) {
      nextField.focus();  // Mover el foco al siguiente campo
    } else {
      console.warn(`El campo con ID '${siguienteRef}' no se encontró.`);
    }


  } else {
    console.warn("Producto no encontrado");
  }
};

/************************************************************/
const borrarProductoBuscador = ()=>{
  nombreProductFerreteria.value = ''
empaqueProductFerreteria.value = 'UNIDAD'
precioProductFerreteria.value = '0.00'
cantidadProductFerreteria.value = 1
 

let elementos = document.getElementsByClassName('awesomplete');

const input = document.getElementById('precioFerreteria');
if (input) {
  input.blur();
}


  let inputDentroDeAwesomplete = elementos[0].querySelector('input');
    if (inputDentroDeAwesomplete) {
        inputDentroDeAwesomplete.focus();
    } else {
        console.warn('No se encontró un input dentro del primer elemento con clase awesomplete.');
    }
}
/************************************************************/

const focusNextField = (event) => {
  event.preventDefault();  // Prevenir el comportamiento por defecto
  
  // Obtener el valor del atributo data-siguiente
  const siguienteRef = event.target.dataset['siguiente'];
  
  if (siguienteRef) {
    // Intentar enfocar el campo referenciado
    const nextField = document.getElementById(siguienteRef);
    if (nextField) {
      nextField.focus();  // Mover el foco al siguiente campo
    } else {
      console.warn(`El campo con ID '${siguienteRef}' no se encontró.`);
    }
  } else {
    console.warn('No se especificó ningún campo siguiente en data-siguiente.');
  }
};

/************************************************************/
const awesompleteInput = ref(null)
/************************************************************/
const fnAgregarProdFerreteria = () => {

let productoSeleccionadoCopia;

const prodSelectOriginal = JSON.parse(JSON.stringify(datosProductoSeleccionadoPrincipal.value))

const datosProdOriginal = productosArray.value.find((prod) => prod.codigo === datosProductoSeleccionadoPrincipal.value.codigo);

if(datosProdOriginal){
 productoSeleccionadoCopia = JSON.parse(JSON.stringify(datosProdOriginal));
}else{
 productoSeleccionadoCopia = datosProductoSeleccionadoPrincipal.value;

}



  // Parsear los valores relevantes
  const precioFinal = parseFloat(precioProductFerreteria.value);
  const precioCompra = parseFloat(productoSeleccionadoCopia.precio_compra);
  const tasaImpuesto = parseFloat(productoSeleccionadoCopia.impuestos);

  // Cálculo de valores basado en el tipo de impuesto
  if (productoSeleccionadoCopia.tipo_impuesto === 'Incluido') {
    // Calcular precio sin impuesto y el impuesto aplicado
    const precioSinImpuesto = precioFinal / (1 + (tasaImpuesto / 100));
    const impuestoCalculado = precioFinal - precioSinImpuesto;

    productoSeleccionadoCopia.precio_venta = precioSinImpuesto.toFixed(2);
    productoSeleccionadoCopia.impuesto_venta = impuestoCalculado.toFixed(2);
    productoSeleccionadoCopia.precio_final = precioFinal.toFixed(2);

    // Calcular ganancia correctamente
    const gananciaCalculada = ((precioSinImpuesto - precioCompra) / precioCompra) * 100;
    productoSeleccionadoCopia.ganancia = gananciaCalculada.toFixed(2);
  } else {
    // Si el impuesto no está incluido, simplemente asignar el precio de venta
    productoSeleccionadoCopia.precio_venta = precioFinal.toFixed(2);
    productoSeleccionadoCopia.precio_final = precioFinal.toFixed(2);
    productoSeleccionadoCopia.impuesto_venta = '0.00';
    productoSeleccionadoCopia.impuestos = '0.00';

    // Calcular ganancia sobre el precio de compra
    const gananciaCalculada = ((precioFinal - precioCompra) / precioCompra) * 100;
    productoSeleccionadoCopia.ganancia = gananciaCalculada.toFixed(2);
    productoSeleccionadoCopia.total = parseFloat(prodSelectOriginal.precio_final).toFixed(2);



  }

  // Asignar la cantidad predeterminada si está vacía
  productoSeleccionadoCopia.cantidad = Number(cantidad.value || 1);

  // Asignar copia del producto a `datosProductoBuscado` y agregarlo a la lista de productos
  datosProductoBuscado.value = { ...productoSeleccionadoCopia };
  fnagregarProductoBuscado();

  // Mostrar notificación de éxito
  toast.add({
    severity: 'success',
    summary: 'OK',
    detail: `${datosProductoBuscado.value.nombre} Agregado`,
    life: 500,
  });

  // Limpiar valores de la interfaz de ferretería
  nombreProductFerreteria.value = '';
  empaqueProductFerreteria.value = 'UNIDAD';
  precioProductFerreteria.value = '0.00';
  cantidadProductFerreteria.value = 1;
  cantidadProductoBuscado.value = 1;
  cantidad.value = 1;

  // Enfocar el input de precio en la interfaz
  const elementos = document.getElementsByClassName('awesomplete');

const input = document.getElementById('precioFerreteria');
if (input) {
  input.blur();
}

calcularTotalFactura()

  const inputDentroDeAwesomplete = elementos[0]?.querySelector('input');
  if (inputDentroDeAwesomplete) {
    inputDentroDeAwesomplete.focus();
  } else {
    console.warn('No se encontró un input dentro del primer elemento con clase awesomplete.');
  }
};

/************************************************************/
let currentPriceIndex = 0;  // Variable para llevar el seguimiento del índice del precio

const fnPrecioProdFerreteria = (event) => {
  event.preventDefault();  // Prevenir el comportamiento por defecto de la barra espaciadora
 
  const datosProd = datosProductoSeleccionadoPrincipal.value;
  const precios = preciosArrayFerreteria.value;  // Obtener el array de precios

  if (precios.length > 0) {
    // Asignar el precio actual basado en el índice
    precioProductFerreteria.value = precios[currentPriceIndex];

    let tipo = '';
    // Comparar el precio actual con los valores en datosProd para identificar el tipo
    if (precioProductFerreteria.value == datosProd.precio_venta) {
      tipo = 'Precio de Venta';
    } else if (precioProductFerreteria.value == datosProd.precio_min) {
      tipo = 'Precio Minimo';
    } else if (precioProductFerreteria.value == datosProd.precio_xmayor) {
      tipo = 'Precio x Mayor';
    }

      console.log("datosProd", datosProd);
    console.log("Precio actual:", precioProductFerreteria.value);
      
    if (tipo) {
      console.log("tipo", tipo);
       toast.removeAllGroups();
      toast.add({ severity: 'success', summary: 'OK', detail: `Precio ${tipo} Seleccionado`, life: 500 });
    } else {
       toast.removeAllGroups();
      toast.add({ severity: 'success', summary: 'OK', detail: `Precio no encontrado en el Producto`, life: 500 });
    }

    // Incrementar el índice y resetearlo si llega al final del array
    currentPriceIndex = (currentPriceIndex + 1) % precios.length;
  }
};


/************************************************************/
let isManualInput = true;
/************************************************************/
    const handleSelectCompleteproductoprincipal = async (selected) => {
      const valorSeleccionado = selected?.value ?? selected?.label ?? selected;
      if (!valorSeleccionado) {
        awesompleteproductoprincipal.value = "";
        return;
      }
      visibleOtroArticulo.value = false;

      // Buscar primero en IMEIs disponibles
      const valorBusqueda = valorSeleccionado.split(' - ')[0]; // Extraer solo el IMEI si viene con formato "IMEI - equipo"
      const imeiEncontrado = imeisDisponiblesArray.value.find(
        imei => imei.imei === valorBusqueda || imei.imei === valorSeleccionado
      );

      if (imeiEncontrado) {
        // Buscar el producto asociado al IMEI
        let productoImei = null;
        if (imeiEncontrado.id_equi) {
          productoImei = productosArray.value.find(prod => prod.id == imeiEncontrado.id_equi);
        }
        if (!productoImei) {
          // Buscar por código de barra = IMEI
          productoImei = productosArray.value.find(prod => prod.codigo_barra === imeiEncontrado.imei);
        }

        if (productoImei) {
          // Agregar directamente al carrito con el IMEI seleccionado
          const productoConImei = JSON.parse(JSON.stringify(productoImei));
          productoConImei.imei_seleccionado = imeiEncontrado.imei;
          productoConImei.imei = imeiEncontrado.imei;
          productoConImei.cantidad = 1;
          productoConImei.precio_venta = Number(imeiEncontrado.precio_venta) || Number(productoImei.precio_venta);
          productoConImei.precio_final = productoConImei.precio_venta;
          productoConImei.total = productoConImei.precio_venta;
          productoConImei.precio_compra = Number(imeiEncontrado.precio_compra) || Number(productoImei.precio_compra) || 0;
          // Asegurar que el nombre esté presente (nombre y nombre_comercial para la factura)
          const nombreProducto = productoImei.nombre || imeiEncontrado.equipo || `IMEI: ${imeiEncontrado.imei}`;
          productoConImei.nombre = nombreProducto;
          productoConImei.nombre_comercial = nombreProducto;

          productosVenta.value.push(productoConImei);
          // Limpiar el input del buscador
          awesompleteproductoprincipal.value = null;
          awesompleteproductoprincipal.value = '';
          nextTick(() => {
            awesompleteproductoprincipal.value = '';
          });
          toast.add({
            severity: 'success',
            summary: 'IMEI Agregado',
            detail: `${imeiEncontrado.equipo || productoImei.nombre} - IMEI: ${imeiEncontrado.imei}`,
            life: 3000
          });
          return;
        } else {
          toast.add({
            severity: 'warn',
            summary: 'Producto no encontrado',
            detail: `El IMEI ${imeiEncontrado.imei} no tiene un producto asociado`,
            life: 3000
          });
          awesompleteproductoprincipal.value = null;
          awesompleteproductoprincipal.value = '';
          return;
        }
      }

      const camposABuscar = ["codigo", "codigo_interno", "codigo_barra", "nombre", "nombre_comercial", "nombre_generico"];
      let datosPro = null;
      datosProductoSeleccionadoPrincipal.value = "";
      tipoFactura.value;
      for (const campo of camposABuscar) {
        datosPro = productosArray.value.find((prod) => prod[campo] == valorSeleccionado);
        if (datosPro) {
          datosProductoSeleccionadoPrincipal.value = JSON.parse(JSON.stringify(datosPro));
          break;
        } else {
          visibleOtroArticulo.value = false;
        }
      }
      if (!datosProductoSeleccionadoPrincipal.value.nombre) {
        const datosCombo = combosArray.value.find((prod) => prod["nombre"] == valorSeleccionado);
        if (datosCombo) {
          const productosCombo = JSON.parse(datosCombo.productos);
          for (let product of productosCombo) {
            const prodComb = productosArray.value.find((prod) => prod["id"] === product.id);
            if (prodComb) {
              datosProductoBuscado.value = JSON.parse(JSON.stringify(prodComb));
              fnagregarProductoBuscado();
            } else {
              if (product.nombre && product.nombre === "DESCUENTO") {
                const camposProd = await arrayToObjetoFromTablaOffline("productos");
                const codigoPro = generarCodigoUnico();
                Object.assign(camposProd, {
                  cantidad: 1,
                  precio_venta: product.precio,
                  precio_xmayor: product.precio,
                  precio_min: product.precio,
                  precio_final: product.precio,
                  nombre: product.nombre,
                  codigo: codigoPro,
                  impuesto: "0.00",
                  empaque: "UNIDAD",
                  categoria: "DESCUENTO",
                  impuestos: "0.00",
                  impuesto_venta: "0.00",
                  ganancia: "0.00",
                  stock: "0.00",
                  codigo_barra: codigoPro
                });
                datosProductoBuscado.value = camposProd;
                fnagregarProductoBuscado();
              }
            }
          }
          awesompleteproductoprincipal.value = "";
          return;
        }
      }
      const checkStockAndConfirm = async () => {
        if (Number(datosProductoSeleccionadoPrincipal.value.stock) < 1 && datosProductoSeleccionadoPrincipal.value.empaque !== "INFINITO") {
          const result = await Swal.fire({
            title: "Sin Existencia",
            text: "Agregar de todos modos?",
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Agregar",
            cancelButtonText: "Cancel",
            reverseButtons: true
          });
          return result.isConfirmed;
        }
        return true;
      };
      if (!await checkStockAndConfirm()) {
        awesompleteproductoprincipal.value = "";
        return;
      }
      const productoExistente = productosVenta.value.find(
        (prod) => prod.codigo === datosProductoSeleccionadoPrincipal.value.codigo
      );
      if (productoExistente) {
        delete productoExistente.caracteristicas;
        delete productoExistente.otro;
        productoExistente.cantidad += 1;
        productoExistente.total = Number(productoExistente.precio_venta) * Number(productoExistente.cantidad);
        productoExistente.ganancia_pura = Number(productoExistente.precio_venta) - Number(productoExistente.precio_compra) * Number(productoExistente.cantidad);
        verificaPreciosPorCliente(productoExistente);
      } else {
        const copiaProducto = JSON.parse(JSON.stringify(datosProductoSeleccionadoPrincipal.value));
        if (!copiaProducto) {
          toast.add({ severity: "warn", summary: "Upps", detail: "Error en el Producto", life: 3e3 });
          return;
        }
        const precioVentaNumero = Number(copiaProducto.precio_venta || 0);
        const precioFinalNumero = Number(copiaProducto.precio_final || 0);
        if (!precioVentaNumero && precioFinalNumero) {
          copiaProducto.precio_venta = precioFinalNumero;
        }
        if (!precioFinalNumero && precioVentaNumero) {
          copiaProducto.precio_final = precioVentaNumero;
        }
        if (Number(copiaProducto.precio_final) === Number(copiaProducto.precio_venta)) {
          const impuestoVentaNumero = Number(copiaProducto.impuesto_venta || 0);
          if (impuestoVentaNumero > 0) {
            copiaProducto.precio_venta = Number(copiaProducto.precio_venta) - impuestoVentaNumero;
          }
        }
        Object.assign(copiaProducto, { cantidad: 1, descuento: 0 });
        delete copiaProducto.caracteristicas;
        delete copiaProducto.otro;
        copiaProducto.total = Number(copiaProducto.precio_venta) * Number(copiaProducto.cantidad);
        copiaProducto.ganancia_pura = Number(copiaProducto.precio_venta) - Number(copiaProducto.precio_compra) * Number(copiaProducto.cantidad);
        productosVenta.value.push(copiaProducto);
        verificaPreciosPorCliente(copiaProducto);
      }
      calcularTotalFactura();
      fncambioTipoImpuesto();
      if (mesaActiva.value) agregarProductosAmesa(mesaActiva.value);
      awesompleteproductoprincipal.value = "";
      toast.removeAllGroups();
      toast.add({ severity: "success", summary: "Ok", detail: "Producto Agregado", life: 3e3 });
      if (documentoEditado.value === "Factura") actualizarFactura();
    };



/************************************************************/
const eliminarVenta = async(item)=>{
 /* const eliminado = await peticionesFetch(`${link.value}${api.value}`,`borrarporcampo/ventasenproceso`,{campo:'id',valor:item},tokenCifrado.value,'POST');*/
  const eliminado = await peticionesFetchOffline('deleteEntry', 'ventasenproceso',item);

  if (eliminado[0] == 'ok') {
       toast.removeAllGroups();
      toast.add({ severity: 'success', summary: 'Ok', detail: 'Venta en Proceso Eliminada', life: 3000 });
        clienteSeleccionado.value = null;
        limpiarProductos()
        clienteSelected.value = {}
        await fetchventasGuardadas()
  }else{
       toast.removeAllGroups();
      toast.add({ severity: 'success', summary: 'Ok', detail: 'Error al eliminar Venta', life: 3000 });
  }

}
/************************************************************/
const fnirCaja = ()=>{
  router.push('/caja')
}

/************************************************************/
const fnAgregarImpuestoSeleccionado = ()=>{
  productoSeleccionado.value.impuestos = 18
  calcularPrecioBase()
}
/************************************************************/
const fnEliminarImpuestoSeleccionado = ()=>{
    productoSeleccionado.value.impuestos = 0
    calcularPrecioBase()
}
/************************************************************/
const fncomoImpuesto = () => {
  // Hacer una copia de los datos del producto para evitar modificar el original
  const datosPro = productosArray.value.find(prod => prod.codigo === productoSeleccionado.value.codigo);
  if (!datosPro) return; // Verificar que el producto exista

  // Actualizar valores de `productoSeleccionado` basados en el tipo de impuesto
  if (comoVaElImpuesto.value === 'Interno') {
    // Asignar valores de `impuesto` y `precio_venta` para el caso "Interno"
    productoSeleccionado.value = {
      ...productoSeleccionado.value,
      impuestos: datosConfiguracion.value.impuesto,
      precio_venta: datosPro.precio_venta
    };
    calcularPrecioBase();
    
  } else if (comoVaElImpuesto.value === 'Externo') {
    // Asignar valores de `impuesto` y `precio_venta` para el caso "Externo"
    productoSeleccionado.value = {
      ...productoSeleccionado.value,
      impuestos: datosConfiguracion.value.impuesto,
      precio_venta: datosPro.precio_final
    };
    calcularPrecioFinal();
    
  } else {
    // Para el caso sin impuestos, asignar valores de `precio_venta` y `impuestos`
    productoSeleccionado.value = {
      ...productoSeleccionado.value,
      precio_venta: datosPro.precio_venta,
      impuestos: '0.00'
    };
    calcularPrecioFinal();
  }
};

/************************************************************/
const clonarFactura = async () => {
  const tipoDoc = datosFactCoti.value.tipo;
  const numero = datosFactCoti.value.numero;
  visiblefatcoti.value = false;

    try {
      const endpoint = tipoDoc === 'Factura' ? 'facturas' : 'cotizacion';
      tipoFactura.value = tipoDoc.toLowerCase();
      const campoNo = `no_${endpoint.replace(/s$/, '')}`;

/*      const datosFactura = await peticionesFetch(
        `${link.value}${api.value}`,
        `datoscampo/${endpoint}/${campoNo}/${numero}`,
        {},
        tokenCifrado.value,
        'GET'
      );*/
      const datosFactura = await peticionesFetchOffline('getDataByField', endpoint,campoNo,numero);

      const productos = JSON.parse(datosFactura.productos);

      for (let prod of productos) {
        let datosProd = productosArray.value.find((product) => product.codigo === prod.codigo);

        if (!datosProd) {
          const jsonData = await arrayToObjetoFromTablaOffline('productos');
          // Combinar los campos de jsonData con prod
          datosProd = { ...jsonData, ...prod };
        }

        datosProductoBuscado.value = { ...datosProd };
        fnagregarProductoBuscado();
      }
    } catch (error) {
      console.error('Error cloning invoice:', error);
      toast.add({ severity: 'error', summary: 'Error', detail: 'Error al clonar la factura', life: 3000 });
    }



};

/************************************************************/
/************************************************/
async function ejecutarFuncionTarjeta() {
    const { value: bancoSeleccionado } = await Swal.fire({
        title: 'Seleccione el banco para Tarjeta',
        input: 'select',
        inputOptions: bancoArray.value.reduce((options, banco) => {
            options[banco.id] = `${banco.nombre} - Cuenta: ${banco.cuenta}`;
            return options;
        }, {}),
        inputPlaceholder: 'Seleccionar banco',
        showCancelButton: true,
        confirmButtonText: 'Confirmar',
        cancelButtonText: 'Cancelar',
        inputValidator: (value) => {
            if (!value) {
                return 'Debe seleccionar un banco';
            }
        }
    });

    if (!bancoSeleccionado) return;

    const banco = bancoArray.value.find(b => b.id == bancoSeleccionado);
    if (!banco) {
        toast.add({ severity: 'error', summary: 'Error', detail: 'Banco no encontrado', life: 3000 });
        return;
    }

    const nuevoSaldo = Number(banco.saldo) + Number(currentFacturaData.value.total);

    const urlBanco = `${link.value}${api.value}/actualizarcampos/banco`;
    const datosBanco = { ...banco, saldo: nuevoSaldo, updated_at: nfecha('timestamp') };

/*    const envioDatosBanco = await enviarDatosPorPost(urlBanco, datosBanco, tokenCifrado.value);*/
    const envioDatosBanco = await peticionesFetchOffline('updateData','banco', JSON.stringify(datosBanco));

    if (envioDatosBanco[0] === 'ok') {
         toast.removeAllGroups();
        toast.add({ severity: 'success', summary: 'Éxito', detail: `Saldo actualizado en ${banco.nombre}`, life: 3000 });
        await fetchBanco(); // Actualizar la lista de bancos
           visiblefatcoti.value = true;
    } else {
        toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo actualizar el saldo', life: 3000 });
    }
}
/***********************************************************************/
async function ejecutarFuncionTransferencia() {
    const { value: bancoSeleccionado } = await Swal.fire({
        title: 'Seleccione el banco para Transferencia',
        input: 'select',
        inputOptions: bancoArray.value.reduce((options, banco) => {
            options[banco.id] = `${banco.nombre} - Cuenta: ${banco.cuenta}`;
            return options;
        }, {}),
        inputPlaceholder: 'Seleccionar banco',
        showCancelButton: true,
        confirmButtonText: 'Confirmar',
        cancelButtonText: 'Cancelar',
        inputValidator: (value) => {
            if (!value) {
                return 'Debe seleccionar un banco';
            }
        }
    });

    if (!bancoSeleccionado) return;

    const banco = bancoArray.value.find(b => b.id == bancoSeleccionado);
    if (!banco) {
        toast.add({ severity: 'error', summary: 'Error', detail: 'Banco no encontrado', life: 3000 });
        return;
    }

    const nuevoSaldo = Number(banco.saldo) + Number(currentFacturaData.value.total);

    const urlBanco = `${link.value}${api.value}/actualizarcampos/banco`;
    const datosBanco = { ...banco, saldo: nuevoSaldo, updated_at: nfecha('timestamp') };

/*    const envioDatosBanco = await enviarDatosPorPost(urlBanco, datosBanco, tokenCifrado.value);*/
    const envioDatosBanco = await peticionesFetchOffline('updateData','banco', JSON.stringify(datosBanco));

    if (envioDatosBanco[0] === 'ok') {
         toast.removeAllGroups();
        toast.add({ severity: 'success', summary: 'Éxito', detail: `Saldo actualizado en ${banco.nombre}`, life: 3000 });
        await fetchBanco(); // Actualizar la lista de bancos
           visiblefatcoti.value = true;
    } else {
        toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo actualizar el saldo', life: 3000 });
    }
}
/************************************************/
/************************************************/
const fnAplicarCredito = async()=>{
     const numero = datosFactCoti.value.numero;
   const tipo = datosFactCoti.value.tipo;
  if(tipo != 'Factura'){
    toast.add({ severity: 'error', summary: 'Error', detail: 'No se puede aplicar CREDITO a una Cotización', life: 3000 });
    return
  }

    const datosFactura = allFacturasFull.value.find(fact=>fact.no_factura === numero)
     if(datosFactura){

/*----------------------------------------------------------------*/
  if(datosFactura.cod_cliente == '0000000'){
    toast.add({ severity: 'error', summary: 'Error', detail: 'No se puede aplicar CREDITO a Cliente AL CONTADO', life: 3000 });
    return
  }
/*----------------------------------------------------------------*/
  visiblefatcoti.value = false
/*----------------------------------------------------------------*/
    const loader = $loading.show({
      canCancel: true,
      loader: 'bars',
      onCancel: () => {
          loader.hide();
      },
  });
/*----------------------------------------------------------------*/
    try{
/*----------------------------------------------------------------*/
      const verificaExistencia = await peticionesFetchOffline('getDataByField', 'cuentas_cobrar','no_factura',datosFactura.no_factura);
    if(verificaExistencia){
    toast.add({ severity: 'error', summary: 'Error', detail: 'Ya existe un Credito para esta Factura', life: 3000 });
    return
    }

/*----------------------------------------------------------------*/

      let datosCliente = await peticionesFetchOffline('getDataByField', 'clientes','codigo',datosFactura.cod_cliente);
      
      if(!datosCliente){
         const camposClientes = await arrayToObjetoFromTablaOffline('clientes');

    const urlCliente = link.value+api.value+"/insertar/clientes";

  if (camposClientes.hasOwnProperty('created_at')) {
     camposClientes.created_at = nfecha('timestamp')
     camposClientes.updated_at = nfecha('timestamp')
    }

    camposClientes.codigo = datosFactura.cod_cliente
    camposClientes.nombre = datosFactura.nombre_cliente
    camposClientes.cedula = datosFactura.cod_cliente
    camposClientes.email = 'N/A'
    camposClientes.direccion = 'N/A'
    camposClientes.rnc = datosFactura.cod_cliente
    camposClientes.n_comercial = 'N/A'
    const envioDatos = await peticionesFetchOffline('insertData', 'clientes',JSON.stringify(camposClientes));
          if(envioDatos[0] != 'ok'){
                toast.add({ severity: 'error', summary: 'Error', detail: 'No se puede Agregar este Cliente', life: 3000 });
               return
          }
          datosCliente = camposClientes;
      }
/*----------------------------------------------------------------*/

      const camposCUENTASCOBRAR = await arrayToObjetoFromTablaOffline('cuentas_cobrar');
      //const ultimaFactura = await peticiones(`${link.value}${api.value}/datosmax`, { "tabla": "cuentas_cobrar", "campo": "no_emision" }, 'POST', tokenCifrado.value);
      //const noCredito = generadorCodigo(ultimaFactura[0], '', 7);
      const noCredito = generarCodigoUnico()


      camposCUENTASCOBRAR.no_emision = noCredito;
      camposCUENTASCOBRAR.no_factura = datosFactura.no_factura;
      camposCUENTASCOBRAR.cod_cliente = datosCliente.codigo;
      camposCUENTASCOBRAR.nombre_cliente = datosCliente.nombre;
      camposCUENTASCOBRAR.cedula_cliente = datosCliente.cedula;
      camposCUENTASCOBRAR.email_cliente = datosCliente.email;
      camposCUENTASCOBRAR.direccion_cliente = datosCliente.direccion;
      camposCUENTASCOBRAR.rnc_cliente = datosCliente.rnc;
      camposCUENTASCOBRAR.nombrecomercial_cliente = datosCliente.n_comercial;
      camposCUENTASCOBRAR.fecha_emision = nfecha('fecha');
      camposCUENTASCOBRAR.monto_credito = datosFactura.total;
      camposCUENTASCOBRAR.interes = '0.00';
      camposCUENTASCOBRAR.fecha_vencimiento = agregarDiasalaFechaActual(30);
      camposCUENTASCOBRAR.cuotas = '1';
      camposCUENTASCOBRAR.abonado = '0.00';
      camposCUENTASCOBRAR.saldo = datosFactura.total;
      camposCUENTASCOBRAR.fecha_pago = agregarDiasalaFechaActual(30);
      camposCUENTASCOBRAR.pagos = JSON.stringify([{ "nopago": "1", "cantidad": '0.00', "turno": '', "cajero": datosEmpresa.usuario.email, "metodo": 'EFECTIVO', "fecha": nfecha('fecha'), "hora": nfecha('hora'), "saldo": datosFactura.total }]);
      camposCUENTASCOBRAR.estatus = 'PENDIENTE';
      camposCUENTASCOBRAR.hora = nfecha('hora');
      camposCUENTASCOBRAR.vendedor = datosEmpresa.usuario.email;
      camposCUENTASCOBRAR.delivery = 'N/A';
      camposCUENTASCOBRAR.nota = '';
      camposCUENTASCOBRAR.created_at = nfecha('timestamp');
      camposCUENTASCOBRAR.updated_at = nfecha('timestamp');

      const urlCUENTASCOBRAR = link.value + api.value + "/insertar/cuentas_cobrar";

      const envioDatosCUENTASCOBRAR = await peticionesFetchOffline('insertData', 'cuentas_cobrar',JSON.stringify(camposCUENTASCOBRAR));

       if(envioDatosCUENTASCOBRAR[0] == 'ok'){
         toast.removeAllGroups();
        toast.add({ severity: 'success', summary: 'Éxito', detail: `CREDITO creado con éxito`, life: 3000 });

        datosFactura.metodo_pago = 'CREDITO';
        datosFactura.updated_at = nfecha('timestamp');

        const urlFactura = `${link.value}${api.value}/actualizarcampos/facturas`;
        const envioDatosFact = await peticionesFetchOffline('updateData', 'facturas',JSON.stringify(datosFactura));

        if (envioDatosFact[0] == 'ok') {
             toast.removeAllGroups();
            toast.add({ severity: 'success', summary: 'Éxito', detail: 'Método de pago actualizado', life: 3000 });
            await fetchFacturas();

        } else {
            toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo actualizar el método de pago', life: 3000 });
        }

       }
    }catch(error){
       toast.add({ severity: 'error', summary: 'Error', detail: error, life: 3000 });
    }finally{
      loader.hide();
      visiblefatcoti.value = true
      datosFactCoti.value.numero = numero
    }

     }



}
/************************************************/
const fnEditarMetodoPago = async()=>{
   const numero = datosFactCoti.value.numero;
   const tipo = datosFactCoti.value.tipo;
   visiblefatcoti.value = false;
   if(tipo === 'Factura'){
    const datosFactura = allFacturasFull.value.find(fact=>fact.no_factura === numero)
     if(datosFactura){

     currentFacturaData.value = datosFactura

        const { value: metodoPago } = await Swal.fire({
            title: 'Selecciona el método de pago',
            input: 'select',
            inputOptions: {
                EFECTIVO: 'Efectivo',
                TRANSFERENCIA: 'Transferencia',
                TARJETA: 'Tarjeta'
            },
            inputPlaceholder: 'Seleccionar método',
            showCancelButton: true,
            confirmButtonText: 'Actualizar',
            cancelButtonText: 'Cancelar',
            inputValidator: (value) => {
                if (!value) {
                    return 'Debe seleccionar un método de pago';
                }
            }
        });

        if (!metodoPago) return;

        // Pedir contraseña antes de confirmar el cambio
        const { value: password } = await Swal.fire({
            title: 'Ingrese la contraseña',
            input: 'password',
            inputPlaceholder: 'Contraseña',
            showCancelButton: true,
            confirmButtonText: 'Confirmar',
            cancelButtonText: 'Cancelar'
        });

        if (!password || (password !== token.value && password !== tokenCorto.value)) {
            toast.add({ severity: 'error', summary: 'Error', detail: 'Contraseña incorrecta', life: 3000 });
            return;
        }

        // Obtener el total de la factura
        const totalFactura = Number(currentFacturaData.value.total);

        // Determinar el nuevo valor del método de pago y resetear los otros
        switch (metodoPago) {
            case 'EFECTIVO':
                currentFacturaData.value.efectivo = totalFactura;
                currentFacturaData.value.tarjeta = 0;
                currentFacturaData.value.transferencia = 0;
                break;
            case 'TRANSFERENCIA':
                currentFacturaData.value.transferencia = totalFactura;
                currentFacturaData.value.efectivo = 0;
                currentFacturaData.value.tarjeta = 0;
                ejecutarFuncionTransferencia(); // Ejecuta función adicional
                break;
            case 'TARJETA':
                currentFacturaData.value.tarjeta = totalFactura;
                currentFacturaData.value.efectivo = 0;
                currentFacturaData.value.transferencia = 0;
                ejecutarFuncionTarjeta(); // Ejecuta función adicional
                break;
        }

        // Actualizar en la base de datos
        currentFacturaData.value.metodo_pago = metodoPago;
        currentFacturaData.value.updated_at = nfecha('timestamp');

        const urlFactura = `${link.value}${api.value}/actualizarcampos/facturas`;
/*        const envioDatos = await enviarDatosPorPost(urlFactura, currentFacturaData.value, tokenCifrado.value);*/
        const envioDatos = await peticionesFetchOffline('updateData','facturas', JSON.stringify(currentFacturaData.value));

        if (envioDatos[0] == 'ok') {
             toast.removeAllGroups();
            toast.add({ severity: 'success', summary: 'Éxito', detail: 'Método de pago actualizado', life: 3000 });
            await fetchFacturas();
        } else {
            toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo actualizar el método de pago', life: 3000 });
        }

     }else{
      toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'No se encuentra la factura',
      life: 3000,
    });
      visiblefatcoti.value = true;
      return
     }

   }else{
      toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'No se puede cambiar a una Cotizacion',
      life: 3000,
    });
      visiblefatcoti.value = true;
      return
   }


}
/************************************************************/
const fnEliminarComprobante = async()=>{
   visiblefatcoti.value = false;
   visibleComprobantes.value = false;
    //const datosFactura = currentRowData.value;

          const nofactura = datosFactCoti.value.numero;
/*          const datosFactura = await peticionesFetch(
            `${link.value}${api.value}`,
            `datoscampo/facturas/no_factura/${nofactura}`,
            {},
            tokenCifrado.value,
            'GET'
          );*/
          const datosFactura = await peticionesFetchOffline('getDataByField', 'facturas','no_factura',nofactura);


    if (!datosFactura || datosFactura.tipo_factura === 'SIN COMPROBANTE') {
        toast.add({ severity: 'error', summary: 'Error', detail: 'Esta factura no contiene comprobante.', life: 3000 });
        return;
    }

    const confirmacion = await Swal.fire({
        title: '¿Estás seguro?',
        text: 'Se eliminará el comprobante de la factura',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar'
    });

    if (!confirmacion.isConfirmed) return;

    const passwordResponse = await Swal.fire({
        title: 'Ingrese la contraseña',
        input: 'password',
        inputPlaceholder: 'Contraseña',
        showCancelButton: true,
        confirmButtonText: 'Confirmar',
        cancelButtonText: 'Cancelar'
    });

    if (!passwordResponse.value || (passwordResponse.value !== token.value && passwordResponse.value !== tokenCorto.value)) {
        toast.add({ severity: 'error', summary: 'Error', detail: 'Contraseña incorrecta', life: 3000 });
        return;
    }

    datosFactura.tipo_factura = 'SIN COMPROBANTE';
    datosFactura.comprobante = 'SIN COMPROBANTE';

    const urlFactura = `${link.value}${api.value}/actualizarcampos/facturas`;
/*    const envioDatosFactura = await enviarDatosPorPost(urlFactura, datosFactura, tokenCifrado.value);*/
    const envioDatosFactura = await peticionesFetchOffline('updateData','facturas', JSON.stringify(datosFactura));
    if (envioDatosFactura[0] == 'ok') {
         toast.removeAllGroups();
        toast.add({ severity: 'success', summary: 'Éxito', detail: 'Comprobante eliminado', life: 3000 });
        await fetchAndSetupData();
       // visiblePrint.value = true
         visiblefatcoti.value = true;
    } else {
        toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo eliminar el comprobante', life: 3000 });
    }
}
/************************************************************/
 const fnAplicarComprobante = async()=>{
    const comprobante = datoscamposComprobantes.value.nfc

  const url = link.value+api.value+"/actualizarcampos/confiscal";
  if (!comprobante) {
    console.error("Datos incompletos, no se puede actualizar.");
    return;
  }
  if (comprobante.hasOwnProperty('created_at')) {
    comprobante.updated_at = nfecha('timestamp');
  }

  const tipo = datosFactCoti.value.tipo;
  const numero = datosFactCoti.value.numero;
   visiblefatcoti.value = false;
   visibleComprobantes.value = false;
  Swal.fire({
    title: 'Introduce la contraseña',
    input: 'password',
    inputPlaceholder: 'Contraseña',
    showCancelButton: true,
    confirmButtonText: 'Aplicar Comprobante',
    cancelButtonText: 'Cancelar'
  }).then(async(result) => {
    if (result.isConfirmed) {

      const contrasenaIngresada = result.value;
      if (tipo == 'Factura') {
      if (contrasenaIngresada === token.value || contrasenaIngresada === tokenCorto.value || contrasenaIngresada === tokenSoloUso.value || contrasenaIngresada === token24H.value) {


          const nofactura = datosFactCoti.value.numero;
/*          const datosFactura = await peticionesFetch(
            `${link.value}${api.value}`,
            `datoscampo/facturas/no_factura/${nofactura}`,
            {},
            tokenCifrado.value,
            'GET'
          );*/
          const datosFactura = await peticionesFetchOffline('getDataByField', 'facturas','no_factura',nofactura);

          const urlFactura = link.value+api.value+"/actualizarcampos/facturas";
          if (!datosFactura) {
            console.error("Datos incompletos, no se puede actualizar.");
            toast.add({ severity: 'error', summary: 'Error', detail: 'Datos incompletos, no se puede actualizar.', life: 3000 });
            return;
          }

           if(datosFactura.tipo_factura != 'SIN COMPROBANTE'){
               toast.add({ severity: 'error', summary: 'Error', detail: 'Esta Factura ya tiene un Comprobante.', life: 3000 });
             return
           }

          if (datosFactura.hasOwnProperty('created_at')) {
              datosFactura.updated_at = nfecha('timestamp')
            }

          const tipoComprobante = mensajeComprobantes02.value[comprobante.prefijo];
           
           if(!tipoComprobante){
            toast.add({ severity: 'error', summary: 'Error', detail: 'Este tipo de Comporbante de no se puede aplicar a esta Factura.', life: 3000 });
            return
           }
          const elComprobante = generadorCodigo(comprobante.contador, comprobante.prefijo, 8);


          datosFactura.tipo_factura = tipoComprobante;
          datosFactura.comprobante = elComprobante;

/*          const envioDatosFactura = await enviarDatosPorPost(urlFactura, datosFactura,tokenCifrado.value);*/
          const envioDatosFactura = await peticionesFetchOffline('updateData','facturas', JSON.stringify(datosFactura));

          if (envioDatosFactura[0] == 'ok') {
              toast.removeAllGroups();
             toast.add({ severity: 'success', summary: 'Éxito', detail: 'Comprobante Aplicado con éxito', life: 3000 });
           comprobante.contador = (Number(comprobante.contador) + 1)
           comprobante.secuencia = elComprobante

/*          const envioDatos = await enviarDatosPorPost(url, comprobante, tokenCifrado.value);*/
          const envioDatos = await peticionesFetchOffline('updateData','confiscal', JSON.stringify(comprobante));
          if (envioDatos[0] == 'ok') {
            visibleComprobantes.value = false;
             toast.removeAllGroups();
            toast.add({ severity: 'success', summary: 'Éxito', detail: 'Datos Actualizados', life: 3000 });
          } else {
            toast.add({ severity: 'error', summary: 'Error', detail: 'Fallo al actualizar los datos.', life: 3000 });
          }
             await fetchAndSetupData()
            // visiblePrint.value = true
             visiblefatcoti.value = true;
          }else{
            toast.add({ severity: 'error', summary: 'Error', detail: 'Fallo al actualizar los datos.', life: 3000 });
          }

          } else {
         toast.add({ severity: 'error', summary: 'Error', detail: 'Contraseña incorrecta', life: 3000 });
        }
      }
    }
  })

}
/************************************************************/
const fnNota = ()=>{
if (garantiaSelect.value !='Ninguna') {
    const garAnTia = garantiaArray.value.find(garant=>garant.referencia == garantiaSelect.value)
    nota.value = garAnTia.garantia
}else{
  nota.value = datosConfiguracion.value.entrega
}

}
/************************************************************/
const fnAgregarNota = async () => {
  const { value: formValues } = await Swal.fire({
    title: 'Agregar Nueva Garantía',
    html:
      `<input id="swal-input1" class="swal2-input" placeholder="Referencia (ej: Garantía 90 días)">` +
      `<textarea id="swal-input2" class="swal2-textarea" placeholder="Descripción de la garantía"></textarea>`,
    focusConfirm: false,
    showCancelButton: true,
    confirmButtonText: 'Agregar',
    cancelButtonText: 'Cancelar',
    preConfirm: () => {
      const referencia = document.getElementById('swal-input1').value.trim()
      const descripcion = document.getElementById('swal-input2').value.trim()
      if (!referencia || !descripcion) {
        Swal.showValidationMessage('Debe completar ambos campos')
        return false
      }
      return { referencia, descripcion }
    }
  });

  if (formValues) {
     garantiaArray.value.push({
      referencia: formValues.referencia,
      garantia: formValues.descripcion
    });

   // garantiaSelect.value = formValues.referencia;

    // Opcional: actualizar localStorage
    const datosSinNinguna = garantiaArray.value.filter(g => g.referencia !== 'Ninguna');
    localStorage.setItem('garantia', JSON.stringify(datosSinNinguna));

    const campos = await arrayToObjetoFromTablaOffline('garantia');


     campos.referencia = formValues.referencia
     campos.garantia = formValues.descripcion

      const urlGarantia = link.value+api.value+"/insertar/garantia";
  if (campos.hasOwnProperty('created_at')) {
    campos.created_at = nfecha('timestamp');
    campos.updated_at = nfecha('timestamp');
  }
/*  const envioDatos = await enviarDatosPorPost(urlGarantia, campos, tokenCifrado.value);*/
  const envioDatos = await peticionesFetchOffline('insertData','garantia', JSON.stringify(campos));
  if (envioDatos[0] == 'ok') {
     toast.removeAllGroups();
    toast.add({ severity: 'success', summary: 'Éxito', detail: 'Datos Agregados', life: 3000 });
     await fetchGarantias()
  } else {
    toast.add({ severity: 'error', summary: 'Error', detail: 'Fallo al Agregar los datos.', life: 3000 });
  }

     toast.removeAllGroups();
    toast.add({ severity: 'success', summary: 'Garantía Agregada', detail: 'Se agregó correctamente.', life: 3000 });
  }
};

/************************************************************/
const fnAwesompleteNC = ()=>{

}
const handleSelectCompleteNC = (selected)=>{
  console.log("selected", selected);

    const datoNC = arrayNC.value.find((nc) =>
        nc.no_credito === selected.value
    );
      console.log("datoNC", datoNC);

    if (datoNC) {

      descuento.value = datoNC.total;
      nota.value = `SE HA AGREGADO UN DESCUENTO DE ${datoNC.total} POR CONCEPTO DE NOTA DE CREDITO (${datoNC.no_credito})\n` + nota.value
      descuentoEntero.value = datoNC.total
      fnAplicarDescuento()
      //actualizarDescuentoFactura()
      visibleNotaCredito.value = false

    } else {
        toast.add({ severity: 'error', summary: 'Error', detail: 'No se Encuentra la NC', life: 3000 });
    }
}

// ============================================================================
// FUNCIONES PARA RECIBIR EQUIPOS (CAMBIAZO)
// ============================================================================

/**
 * Resetea el formulario de Recibir Equipos
 */
const resetRecibirEquipos = () => {
  recibirEquiposStep.value = 0;
  recibirEquiposLoading.value = false;
  recibirEquiposBuscandoImei.value = false;
  recibirEquiposBuscandoCedula.value = false;
  imeiYaExiste.value = false;
  efectivoCajaInsuficiente.value = false;
  recibirEquiposErrors.value = {};

  equipoRecibido.value = {
    imei: '',
    marca: '',
    modelo: '',
    color: '',
    capacidad: '',
    condicion: 'USADO_BUENO',
    observaciones: '',
    precio_compra: 0,
    precio_venta: 0,
    incluye_cargador: false,
    incluye_caja: false,
    incluye_audifonos: false,
    estado_bateria: 'BUENO',
    estado_pantalla: 'BUENO'
  };

  personaCambiazo.value = {
    cedula: '',
    nombre: '',
    telefono: '',
    direccion: '',
    id_persona: null,
    es_nuevo: false
  };

  transaccionCambiazo.value = {
    tipo_registro: 'GASTO',
    metodo_pago: 'EFECTIVO',
    sale_de_caja: true,
    afecta_compras: true,
    nota: ''
  };
};

/**
 * Busca equipo por IMEI en la base de datos
 */
const buscarEquipoPorIMEI = async () => {
  const imei = equipoRecibido.value.imei.trim();

  if (!imei || imei.length < 14) {
    toast.add({
      severity: 'warn',
      summary: 'IMEI Inválido',
      detail: 'El IMEI debe tener al menos 14 dígitos',
      life: 3000
    });
    return;
  }

  recibirEquiposBuscandoImei.value = true;
  imeiYaExiste.value = false;

  try {
    // Buscar en la tabla de IMEI
    const response = await peticionesFetchOffline('getDataByCondition', 'imei','almacen',datosEmpresa.empresa.nombre);
    const imeiEncontrado = response.find(item => item.imei === imei);

    if (imeiEncontrado) {
      // IMEI ya existe
      imeiYaExiste.value = true;

      if (imeiEncontrado.estado === 'DISPONIBLE') {
        toast.add({
          severity: 'warn',
          summary: 'IMEI Ya Registrado',
          detail: `Este IMEI ya existe en inventario como DISPONIBLE. Equipo: ${imeiEncontrado.equipo || imeiEncontrado.modelo}`,
          life: 5000
        });
      } else if (imeiEncontrado.estado === 'VENDIDO') {
        toast.add({
          severity: 'info',
          summary: 'IMEI Vendido Anteriormente',
          detail: `Este equipo fue vendido. Cliente: ${imeiEncontrado.comprador || 'N/A'}. Puede continuar con el cambiazo.`,
          life: 5000
        });
      }

      // Autocompletar datos del equipo si existen
      equipoRecibido.value.marca = imeiEncontrado.marca || '';
      equipoRecibido.value.modelo = imeiEncontrado.modelo || imeiEncontrado.equipo || '';
    } else {
      // IMEI no existe en la tabla local, buscar en la API de IMEI
      toast.add({
        severity: 'info',
        summary: 'Buscando...',
        detail: 'IMEI no en inventario. Consultando información del equipo...',
        life: 2000
      });

      const datos = {
        service: 0,
        imei: imei,
        key: "JKD-QC9-9L9-9C6-GT7-J2I-LIV-U3M"
      };

      const responseAPI = await fetch("https://api.ifreeicloud.co.uk", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded"
        },
        body: new URLSearchParams(datos).toString(),
      });

      const status = responseAPI.status;

      if (status === 200) {
        const myResult = await responseAPI.json();

        if (myResult.success === true) {
          // Autocompletar datos del equipo con la info de la API
          equipoRecibido.value.marca = myResult.object.brand || '';
          equipoRecibido.value.modelo = myResult.object.modelName || myResult.object.model || '';

          toast.removeAllGroups();
          toast.add({
            severity: 'success',
            summary: 'Equipo Identificado',
            detail: `${myResult.object.brand || ''} ${myResult.object.modelName || ''}`,
            life: 4000
          });
        } else {
          toast.add({
            severity: 'info',
            summary: 'IMEI Disponible',
            detail: 'No se encontró información del equipo. Puede registrarlo manualmente.',
            life: 3000
          });
        }
      } else {
        toast.add({
          severity: 'info',
          summary: 'IMEI Disponible',
          detail: 'Este IMEI no existe en el sistema. Puede registrarlo como equipo nuevo.',
          life: 3000
        });
      }
    }

  } catch (error) {
    console.error('Error buscando IMEI:', error);
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'No se pudo buscar el IMEI. Intente de nuevo.',
      life: 3000
    });
  } finally {
    recibirEquiposBuscandoImei.value = false;
  }
};

/**
 * Consulta persona por cédula
 */
const consultarPersonaPorCedula = async () => {
  const cedula = personaCambiazo.value.cedula.trim().replace(/[^0-9]/g, '');

  if (!cedula || cedula.length < 9) {
    toast.add({
      severity: 'warn',
      summary: 'Cédula Inválida',
      detail: 'Ingrese una cédula válida',
      life: 3000
    });
    return;
  }

  recibirEquiposBuscandoCedula.value = true;
  personaCambiazo.value.es_nuevo = false;

  try {
    // Buscar en clientes
    const clientes = await peticionesFetchOffline('getDataAsArray', 'clientes');
    let personaEncontrada = clientes.find(c =>
      c.cedula?.replace(/[^0-9]/g, '') === cedula ||
      c.rnc?.replace(/[^0-9]/g, '') === cedula
    );

    if (!personaEncontrada) {
      // Buscar en proveedores
      const proveedores = await peticionesFetchOffline('getDataAsArray', 'proveedores');
      personaEncontrada = proveedores.find(p =>
        p.cedula?.replace(/[^0-9]/g, '') === cedula ||
        p.rnc?.replace(/[^0-9]/g, '') === cedula
      );
    }

    if (personaEncontrada) {
      personaCambiazo.value.nombre = personaEncontrada.nombre || '';
      personaCambiazo.value.telefono = personaEncontrada.telefono || '';
      personaCambiazo.value.direccion = personaEncontrada.direccion || '';
      personaCambiazo.value.id_persona = personaEncontrada.id;
      personaCambiazo.value.es_nuevo = false;

      toast.add({
        severity: 'success',
        summary: 'Persona Encontrada',
        detail: `${personaEncontrada.nombre}`,
        life: 3000
      });
    } else {
      personaCambiazo.value.es_nuevo = true;

      // Mock: Si la cédula es específica, simular datos
      if (cedula === '00112345678') {
        personaCambiazo.value.nombre = 'Juan Pérez Ejemplo';
        personaCambiazo.value.telefono = '809-555-1234';
        personaCambiazo.value.direccion = 'Calle Principal #123, Santo Domingo';
        personaCambiazo.value.es_nuevo = false;
      } else {
        toast.add({
          severity: 'info',
          summary: 'Persona No Encontrada',
          detail: 'Complete los datos manualmente o guarde como nueva persona.',
          life: 3000
        });
      }
    }

  } catch (error) {
    console.error('Error consultando cédula:', error);
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'No se pudo consultar la cédula.',
      life: 3000
    });
  } finally {
    recibirEquiposBuscandoCedula.value = false;
  }
};

/**
 * Guarda una nueva persona (cliente/proveedor)
 */
const guardarNuevaPersona = async () => {
  if (!personaCambiazo.value.nombre || !personaCambiazo.value.cedula) {
    toast.add({
      severity: 'warn',
      summary: 'Datos Incompletos',
      detail: 'Nombre y cédula son requeridos',
      life: 3000
    });
    return;
  }

  try {
    const nuevaPersona = {
      nombre: personaCambiazo.value.nombre,
      cedula: personaCambiazo.value.cedula,
      telefono: personaCambiazo.value.telefono,
      direccion: personaCambiazo.value.direccion,
      tipo: 'CLIENTE_PROVEEDOR',
      almacen: datosEmpresa.empresa.nombre,
      created_at: nfecha('fecha') + ' ' + nfecha('hora')
    };

    // Guardar como cliente
    const response = await peticionesFetch(
      `${link.value}${api.value}`,
      'insertar/clientes',
      nuevaPersona,
      tokenCifrado.value,
      'POST'
    );

    if (response && response.id) {
      personaCambiazo.value.id_persona = response.id;
      personaCambiazo.value.es_nuevo = false;

      toast.add({
        severity: 'success',
        summary: 'Persona Guardada',
        detail: 'La persona se registró correctamente',
        life: 3000
      });
    }
  } catch (error) {
    console.error('Error guardando persona:', error);
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'No se pudo guardar la persona',
      life: 3000
    });
  }
};

/**
 * Valida el formulario de Recibir Equipos
 */
const validarRecibirEquipos = () => {
  const errors = {};

  // Validar equipo
  if (!equipoRecibido.value.imei || equipoRecibido.value.imei.length < 14) {
    errors.imei = 'IMEI requerido (mínimo 14 dígitos)';
  }

  if (!equipoRecibido.value.marca) {
    errors.marca = 'Marca requerida';
  }

  if (!equipoRecibido.value.modelo) {
    errors.modelo = 'Modelo requerido';
  }

  if (equipoRecibido.value.precio_compra <= 0) {
    errors.precio_compra = 'Precio de compra debe ser mayor a 0';
  }

  if (equipoRecibido.value.precio_venta <= 0) {
    errors.precio_venta = 'Precio de venta debe ser mayor a 0';
  }

  // Warning si precio venta < precio compra
  if (equipoRecibido.value.precio_venta < equipoRecibido.value.precio_compra) {
    toast.add({
      severity: 'warn',
      summary: 'Advertencia',
      detail: 'El precio de venta es menor al precio de compra. Esto generará pérdida.',
      life: 5000
    });
  }

  // Validar persona
  if (!personaCambiazo.value.cedula) {
    errors.cedula = 'Cédula requerida';
  }

  if (!personaCambiazo.value.nombre) {
    errors.nombre = 'Nombre requerido';
  }

  recibirEquiposErrors.value = errors;
  return Object.keys(errors).length === 0;
};

/**
 * Verifica el efectivo en caja
 */
const verificarEfectivoCaja = async () => {
  if (transaccionCambiazo.value.metodo_pago !== 'EFECTIVO') {
    efectivoCajaInsuficiente.value = false;
    return true;
  }

  try {
    efectivoCajaInsuficiente.value = false;
    return true;
  } catch (error) {
    console.error('Error verificando caja:', error);
    return true; // Permitir continuar si hay error
  }
};

/**
 * Procesa el cambiazo completo
 */
const procesarCambiazo = async () => {
  // Validar formulario
  if (!validarRecibirEquipos()) {
    toast.add({
      severity: 'error',
      summary: 'Formulario Incompleto',
      detail: 'Por favor complete todos los campos requeridos',
      life: 3000
    });
    return;
  }

  // Verificar efectivo si aplica
  const efectivoOk = await verificarEfectivoCaja();
  if (!efectivoOk && transaccionCambiazo.value.sale_de_caja) {
    return;
  }

  // Guardar datos antes de cerrar el modal (por si se resetean)
  const datosEquipo = JSON.parse(JSON.stringify(equipoRecibido.value));
  const datosPersona = JSON.parse(JSON.stringify(personaCambiazo.value));
  const datosTransaccion = JSON.parse(JSON.stringify(transaccionCambiazo.value));

  // Cerrar el modal primero
  visibleRecibirEquipos.value = false;

  // Confirmar operación (ahora el Swal se verá correctamente)
  const result = await Swal.fire({
    title: 'Confirmar Cambiazo',
    html: `¿Confirmar recepción del equipo?<br><br>
           <b>IMEI:</b> ${datosEquipo.imei}<br>
           <b>Equipo:</b> ${datosEquipo.marca} ${datosEquipo.modelo}<br>
           <b>Precio Compra:</b> RD$ ${datosEquipo.precio_compra.toFixed(2)}<br>
           <b>Persona:</b> ${datosPersona.nombre}`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Confirmar',
    cancelButtonText: 'Cancelar'
  });

  if (result.isConfirmed) {
    await ejecutarCambiazo(datosEquipo, datosPersona, datosTransaccion);
  }
};

/**
 * Ejecuta todas las operaciones del cambiazo
 * @param {Object} datosEquipo - Datos del equipo recibido
 * @param {Object} datosPersona - Datos de la persona que entrega
 * @param {Object} datosTransaccion - Datos de la transacción
 */
const ejecutarCambiazo = async (datosEquipo, datosPersona, datosTransaccion) => {
  recibirEquiposLoading.value = true;

  try {
    const fechaActual = nfecha('fecha');
    const horaActual = nfecha('hora');
    const usuario = datosEmpresa.usuario?.nombre || 'Sistema';
    const almacen = datosEmpresa.empresa?.nombre || 'Principal';

    // Nombre del equipo con marca, modelo e IMEI
    const nombreEquipo = `${datosEquipo.marca} ${datosEquipo.modelo} - ${datosEquipo.imei} (USADO)`;

    // 1. Primero registrar en tabla PRODUCTOS (celular usado) para obtener el ID
    const nuevoProducto = {
      codigo: `CEL-${datosEquipo.imei.slice(-6)}`,
      codigo_barra: datosEquipo.imei,
      nombre: nombreEquipo,
      precio_compra: datosEquipo.precio_compra,
      ganancia: datosEquipo.precio_venta - datosEquipo.precio_compra,
      precio_venta: datosEquipo.precio_venta,
      impuestos: 0,
      precio_min: datosEquipo.precio_venta * 0.9,
      categoria: 'CELULARES',
      marca: datosEquipo.marca,
      proveedor: datosPersona.nombre,
      stock: 1,
      alerta: 1,
      almacen: almacen,
      created_at: nfecha('timestamp'),
      updated_at: nfecha('timestamp')
    };

    const respuestaProducto = await peticionesFetchOffline('insertData', 'productos', JSON.stringify(nuevoProducto));

    // Obtener el ID del producto insertado
    // Respuesta esperada: {"0":"ok","id":7}
    let idProducto = null;
    if (respuestaProducto && (respuestaProducto[0] === 'ok' || respuestaProducto["0"] === 'ok') && respuestaProducto.id) {
      idProducto = respuestaProducto.id;
    }

    // 2. Registrar en tabla IMEI con el id_equi del producto
    const nuevoImei = {
      imei: datosEquipo.imei,
      estado: 'DISPONIBLE',
      fecha: fechaActual,
      equipo: nombreEquipo,
      id_equi: idProducto,
      proveedor: datosPersona.nombre,
      precio_compra: datosEquipo.precio_compra,
      precio_venta: datosEquipo.precio_venta,
      precio_min: datosEquipo.precio_venta * 0.9,
      precio_xmayor: datosEquipo.precio_venta * 0.8,
      ganancia: datosEquipo.precio_venta - datosEquipo.precio_compra,
      detalles: JSON.stringify({
        condicion: datosEquipo.condicion,
        capacidad: datosEquipo.capacidad,
        color: datosEquipo.color,
        observaciones: datosEquipo.observaciones,
        incluye_cargador: datosEquipo.incluye_cargador,
        incluye_caja: datosEquipo.incluye_caja,
        incluye_audifonos: datosEquipo.incluye_audifonos,
        estado_bateria: datosEquipo.estado_bateria,
        estado_pantalla: datosEquipo.estado_pantalla,
        tipo_entrada: 'CAMBIAZO'
      }),
      usuario: usuario,
      almacen: almacen,
      marca: datosEquipo.marca,
      modelo: datosEquipo.modelo,
      cedula: datosPersona.cedula,
      telefono: datosPersona.telefono,
      direccion: datosPersona.direccion,
      nota: datosTransaccion.nota || 'Equipo recibido por cambiazo',
      created_at: nfecha('timestamp'),
      updated_at: nfecha('timestamp')
    };

    await peticionesFetchOffline('insertData', 'imei', JSON.stringify(nuevoImei));

    // 3. Registrar en COMPRAS si afecta compras
    if (datosTransaccion.afecta_compras) {
      const nuevaCompra = {
        almacen: almacen,
        proveedor: datosPersona.nombre,
        rnc_proveedor: datosPersona.cedula,
        fecha: fechaActual,
        metodo_pago: datosTransaccion.metodo_pago,
        no_factura: `CAMBIAZO-${Date.now()}`,
        estado: 'PAGADA',
        subtotal: datosEquipo.precio_compra,
        descuento: 0,
        impuesto: 0,
        total: datosEquipo.precio_compra,
        abono: datosEquipo.precio_compra,
        saldo: 0,
        productos: JSON.stringify([{
          nombre: nombreEquipo,
          cantidad: 1,
          precio: datosEquipo.precio_compra,
          imei: datosEquipo.imei
        }]),
        nota: `CAMBIAZO - ${datosTransaccion.nota || 'Equipo recibido'}`,
        usuario: usuario,
        created_at: nfecha('timestamp'),
        updated_at: nfecha('timestamp')
      };

      await peticionesFetchOffline('insertData', 'compras', JSON.stringify(nuevaCompra));
    }

    // 4. Registrar según tipo (GASTO o NOTA_CREDITO)
    if (datosTransaccion.tipo_registro === 'GASTO') {
      const nuevoGasto = {
        metodo: datosTransaccion.metodo_pago,
        almacen: almacen,
        cantidad: datosEquipo.precio_compra,
        fecha: fechaActual,
        hora: horaActual,
        turno: 'DIA',
        cajero: usuario,
        descripcion: `CAMBIAZO - Equipo recibido: ${nombreEquipo} | De: ${datosPersona.nombre}`,
        mes: new Date().getMonth() + 1,
        year: new Date().getFullYear(),
        usuario: usuario,
        created_at: nfecha('timestamp'),
        updated_at: nfecha('timestamp')
      };

      await peticionesFetchOffline('insertData', 'gastos', JSON.stringify(nuevoGasto));
    } else if (datosTransaccion.tipo_registro === 'NOTA_CREDITO') {
      // Obtener siguiente número de nota de crédito
/*      const notasCredito = await peticionesFetchOffline('getDataAsArray', 'notacredito');*/
      const notasCredito = await peticionesFetchOffline('getDataByCondition', 'notacredito','almacen',datosEmpresa.empresa.nombre);
      const ultimoNumero = notasCredito.length > 0
        ? Math.max(...notasCredito.map(n => parseInt(n.no_credito?.replace(/\D/g, '') || 0)))
        : 0;
      const nuevoNumero = `NC-${String(ultimoNumero + 1).padStart(6, '0')}`;

      // Obtener B04 de confiscal para Nota de Crédito
      let ncfB04 = '';
      let b04Value = '';
      try {
        const comprobB04 = await peticionesFetchOffline('getDataByField', 'confiscal', 'prefijo', 'B04');
        if (comprobB04 && comprobB04.contador) {
          ncfB04 = generadorCodigo(comprobB04.contador, 'B04', 8);
          b04Value = ncfB04;

          // Actualizar contador de B04
          comprobB04.contador = (Number(comprobB04.contador) + 1);
          comprobB04.secuencia = ncfB04;
          if (comprobB04.hasOwnProperty('created_at')) {
            comprobB04.updated_at = nfecha('timestamp');
          }
          await peticionesFetchOffline('updateData', 'confiscal', JSON.stringify(comprobB04));
        }
      } catch (errorB04) {
        console.error('Error obteniendo B04:', errorB04);
      }

      const conceptoNotaCredito = `CAMBIAZO - Equipo recibido: ${datosEquipo.marca} ${datosEquipo.modelo} | IMEI: ${datosEquipo.imei}`;

      const nuevaNotaCredito = {
        almacen: almacen,
        no_credito: nuevoNumero,
        no_factura: '',
        b04: b04Value,
        ncf: ncfB04,
        cliente: datosPersona.nombre,
        cod_cliente: datosPersona.cedula,
        concepto: conceptoNotaCredito,
        total: datosEquipo.precio_compra,
        fecha: fechaActual,
        hora: horaActual,
        nota: datosTransaccion.nota || 'Nota de crédito por cambiazo',
        usuario: usuario,
        created_at: nfecha('timestamp'),
        updated_at: nfecha('timestamp')
      };

      await peticionesFetchOffline('insertData', 'notacredito', JSON.stringify(nuevaNotaCredito));

      toast.add({
        severity: 'info',
        summary: 'Nota de Crédito Creada',
        detail: `Número: ${nuevoNumero} | NCF: ${ncfB04 || 'Sin NCF'}`,
        life: 5000
      });

      // Preguntar si desea aplicar la nota de crédito a la factura actual
      const montoCredito = Number(datosEquipo.precio_compra);
      const resultAplicar = await Swal.fire({
        title: 'Aplicar Nota de Crédito',
        html: `
          <p>Se ha creado la Nota de Crédito <strong>${nuevoNumero}</strong></p>
          <p>NCF: <strong>${ncfB04 || 'Sin NCF'}</strong></p>
          <p>Monto: <strong>RD$ ${montoCredito.toLocaleString('es-DO', { minimumFractionDigits: 2 })}</strong></p>
          <br>
          <p>¿Desea aplicar esta nota de crédito como descuento a la factura actual?</p>
        `,
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Sí, aplicar descuento',
        cancelButtonText: 'No, solo guardar',
        confirmButtonColor: '#10b981',
        cancelButtonColor: '#6b7280',
        reverseButtons: true
      });

      if (resultAplicar.isConfirmed && productosVenta.value.length > 0) {
        // Aplicar como descuento a la factura actual
        const campos = await arrayToObjetoFromTablaOffline('productos', true);
        campos.nombre = 'DESCUENTO APLICADO';
        campos.categoria = 'DESCUENTO APLICADO';
        campos.codigo = generarCodigoUnico();
        campos.codigo_barra = generarCodigoUnico();
        campos.precio_venta = -montoCredito;
        campos.precio_final = -montoCredito;
        campos.precio_min = -montoCredito;
        campos.precio_xmayor = -montoCredito;
        campos.impuestos = '0.00';
        campos.ganancia = '0.00';
        campos.ganancia_pura = '0.00';
        campos.impuesto = '0.00';
        campos.impuesto_venta = '0.00';
        campos.precio_compra = '0.00';
        campos.cantidad = 1;
        campos.total = -montoCredito;

        // Agregar el descuento a los productos de venta
        productosVenta.value.push(campos);

        // Agregar el concepto de la nota de crédito a la nota de la factura
        const notaCreditoInfo = `[NC: ${nuevoNumero}] ${conceptoNotaCredito}`;
        if (nota.value && nota.value.trim() !== '') {
          nota.value = nota.value + ' | ' + notaCreditoInfo;
        } else {
          nota.value = notaCreditoInfo;
        }

        // Recalcular totales
        await calcularTotalFactura();

        toast.add({
          severity: 'success',
          summary: 'Descuento Aplicado',
          detail: `Se aplicó un descuento de RD$ ${montoCredito.toLocaleString('es-DO', { minimumFractionDigits: 2 })} por nota de crédito`,
          life: 5000
        });
      }
    }

    // 5. Éxito
    toast.add({
      severity: 'success',
      summary: 'Cambiazo Registrado',
      detail: `Equipo ${datosEquipo.marca} ${datosEquipo.modelo} agregado al inventario`,
      life: 5000
    });

    // Recargar productos
    await fetchAndSetupData();

  } catch (error) {
    console.error('Error procesando cambiazo:', error);
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'No se pudo completar el cambiazo. Intente de nuevo.',
      life: 5000
    });
  } finally {
    recibirEquiposLoading.value = false;
  }
};

/**
 * Avanza al siguiente paso del stepper
 */
const siguientePasoRecibirEquipos = () => {
  if (recibirEquiposStep.value === 0) {
    // Validar datos del equipo
    if (!equipoRecibido.value.imei || !equipoRecibido.value.marca || !equipoRecibido.value.modelo) {
      toast.add({
        severity: 'warn',
        summary: 'Datos Incompletos',
        detail: 'Complete IMEI, Marca y Modelo del equipo',
        life: 3000
      });
      return;
    }
    if (equipoRecibido.value.precio_compra <= 0 || equipoRecibido.value.precio_venta <= 0) {
      toast.add({
        severity: 'warn',
        summary: 'Precios Requeridos',
        detail: 'Ingrese el precio de compra y venta',
        life: 3000
      });
      return;
    }
  } else if (recibirEquiposStep.value === 1) {
    // Validar datos de la persona
    if (!personaCambiazo.value.cedula || !personaCambiazo.value.nombre) {
      toast.add({
        severity: 'warn',
        summary: 'Datos Incompletos',
        detail: 'Complete la cédula y nombre de la persona',
        life: 3000
      });
      return;
    }
  }

  recibirEquiposStep.value++;
};

/**
 * Retrocede al paso anterior
 */
const anteriorPasoRecibirEquipos = () => {
  if (recibirEquiposStep.value > 0) {
    recibirEquiposStep.value--;
  }
};

// ============================================================================
// FIN FUNCIONES RECIBIR EQUIPOS
// ============================================================================

/************************************************************/
const fnCalcularCambio = ()=>{
  const calculo = (Number(pagaCon.value) - Number(total.value))
  suCambio.value = calculo.toFixed(2)
  total.value
//pagaCon
//suCambio
}

//fnirCaja
/************************************************************/
const fnProductoenCero = ()=>{
  productoSeleccionado.value.precio_venta = 0.00
  calcularTotalFactura();
   fncambioTipoImpuesto()
   toast.removeAllGroups();
  toast.add({ severity: 'success', summary: 'Éxito', detail: 'Producto En Cero', life: 3000 });
visibleprecio.value = false
}
const fnGererarGastoProduct = ()=>{
crearGasto(link.value+api.value,productoSeleccionado.value.precio_venta,'SE HA AGREGADO EL PRODUCTO ('+productoSeleccionado.value.nombre+') COMO REGALO',toast,tokenCifrado.value);

nota.value = nota.value + '\n'+'SE HA AGREGADO EL PRODUCTO ('+productoSeleccionado.value.nombre+') COMO REGALO';
visibleprecio.value = false
}
/************************************************************/
/************************************************/
import noIMG from '@/assets/img/noimagen.jpg';
/************************************************/
const primeraIMG = ref(noIMG)
/************************************************/
const imagenesProducto = async(ruta)=>{
/*  const img = await peticiones(link.value+api.value+'/peticionimagenes',{"origen":`../${ruta}`},'POST',tokenCifrado.value)*/
  const img = await peticionesFetchOffline('listarArchivosDeCarpeta', 'productos/'+ruta);
  
  if(img && img.length > 0){
    primeraIMG.value = `${link.value}/vista/img/productos/${ruta}/${img[0]}`;
  }else{
    primeraIMG.value = noIMG;
  }
}
/************************************************************/
const fnInfoProduct = async(codigo) => {
  const datosProd = productosArray.value.find(prod => prod.codigo === codigo);
  const productoEnVenta = productosVenta.value.find(prod => prod.codigo === codigo);
  if (datosProd) {
      const rutaIMG = `${datosProd.imagen}`
   await imagenesProducto(rutaIMG)

    Swal.fire({
      title: 'Información del Producto',
  html: `
    <div style="display: flex; gap: 20px;">
      <div style="text-align: left; flex: 1;">
        <p><strong>Código Interno:</strong> ${datosProd.codigo || '-'}</p>
        <p><strong>Código de Barra:</strong> ${datosProd.codigo_barra || '-'}</p>
        <p><strong>Nombre Comercial:</strong> ${datosProd.nombre || '-'}</p>
        <p><strong>Nombre Genérico:</strong> ${datosProd.nombre_generico || '-'}</p>
        <p><strong>Principio Activo:</strong> ${datosProd.principio_activo || '-'}</p>
        <p><strong>Laboratorio:</strong> ${datosProd.laboratorio || '-'}</p>
        <p><strong>Marca:</strong> ${datosProd.marca || '-'}</p>
        <p><strong>Forma Farmacéutica:</strong> ${datosProd.forma_farmaceutica || '-'}</p>
        <p><strong>Concentración:</strong> ${datosProd.concentracion || '-'}</p>
        <p><strong>Stock Disponible:</strong> ${datosProd.stock || 0}</p>
        <p><strong>Precio de Venta:</strong> ${datosProd.precio_venta || 0}</p>
        <p><strong>Cantidad en Venta:</strong> ${productoEnVenta ? productoEnVenta.cantidad : 0}</p>
      </div>
      <div style="flex: 1; display: flex; justify-content: center; align-items: center;">
        <img src="${primeraIMG.value}" alt="Imagen del Producto" style="max-width: 100%; max-height: 200px; object-fit: contain;">
       </div>
    </div>
  `,
      icon: 'info',
      showCancelButton: true,
      showDenyButton: true,
      confirmButtonText: 'Ver Producto',
      cancelButtonText: 'Cerrar',
      denyButtonText: 'Agregar Otro'
    }).then((result) => {
  if (result.isConfirmed) {
        router.push({ path: `/editarproductos/${datosProd.id}` });
  } else if (result.isDenied) {

       //aqui buscar en el array de productos y sumar la cantidad en 1

        const prodIndex = productosVenta.value.findIndex(prod => prod.codigo === codigo);
        if (prodIndex !== -1) {
          //productosVenta.value[prodIndex].cantidad += 1;
          handleSelectCompleteproductoprincipal(productosVenta.value[prodIndex].codigo)
          toast.add({
            severity: 'success',
            summary: 'Producto actualizado',
            detail: `Se agregó 1 más de ${datosProd.nombre}.`,
            life: 3000
          });
        } else {
                delete datosProd.otro
          // Si el producto no está en productosVenta (caso raro), lo agregamos
          productosVenta.value.push({ ...datosProd, cantidad: 1 });
          toast.add({
            severity: 'info',
            summary: 'Producto agregado',
            detail: `Se agregó ${datosProd.nombre} al carrito.`,
            life: 3000
          });
        }


  }

      })
  } else {
    toast.add({ severity: 'error', summary: 'Upps', detail: 'Este producto no se encuentra registrado', life: 3000 });
  }
};
/************************************************************/
const fnCambiarCliente = ()=>{
  if (clienteSelected.value.nombre === 'otro') {
      //visiblecliente.value = true
      clienteSelected.value.codigo = ''
      clienteSelected.value.nombre = ''
  }else{
     const clienteSelected = itemsclientes.value.find(client =>client.codigo == '0000000')
     if (clienteSelected) {
      clienteSelected.value = clienteSelected
      clienteSelected.value = clienteSelected
       toast.removeAllGroups();
      toast.add({ severity: 'success', summary: 'Upps', detail: 'Cliente por Default Seleccionado', life: 3000 });
    }else{
      toast.add({ severity: 'error', summary: 'Upps', detail: 'No se encuentra el CLiente por Default', life: 3000 });
    }
  }
}
/************************************************************/
const selectedCategory = ref(null);
const filterProductsByCategory = (categoryName) => {
  selectedCategory.value = categoryName;
};

const filteredProductos = computed(() => {
  return productosArray.value.filter(producto => {
    const matchesCategory = selectedCategory.value === null || producto.categoria === selectedCategory.value;
    const nombreComercial = String(producto.nombre || producto.nombre || '').toLowerCase();
    const matchesSearch = searchQuery.value === '' || nombreComercial.includes(searchQuery.value.toLowerCase());
    // Filtrar por stock si está activado el switch
    const stock = Number(producto.stock || 0);
    const matchesStock = !ocultarSinStock.value || stock > 0;
    return matchesCategory && matchesSearch && matchesStock;
  });
});

const getStockValue = (producto) => Number(producto?.stock ?? producto?.stock ?? 0);
const getStockAlert = (producto) => {
  const alerta = Number(producto?.alerta ?? producto?.stock_alerta ?? 0);
  return Number.isFinite(alerta) && alerta > 0 ? alerta : 5;
};

const stockCardClass = (producto) => {
  const stock = getStockValue(producto);
  const alerta = getStockAlert(producto);
  if (stock <= 0) return 'pos-product-card--out';
  if (stock <= alerta) return 'pos-product-card--low';
  return 'pos-product-card--ok';
};

const stockBadgeClass = (producto) => {
  const stock = getStockValue(producto);
  const alerta = getStockAlert(producto);
  if (stock <= 0) return 'pos-product-stock--out';
  if (stock <= alerta) return 'pos-product-stock--low';
  return 'pos-product-stock--ok';
};
/************************************************************/
const impresionDirecta = ref(false);
const mostrarVendedorPanel = ref(false);

const categoriaGenerico = computed(() => {
  const generico = categoriasArray.value.find(cat =>
    String(cat.nombre || '').toLowerCase().includes('generico')
  );
  return generico ? generico.nombre : null;
});

const setTipoImpuestoFactura = (tipo) => {
  tipoImpuestoFactura.value = tipo;
  fncambioTipoImpuesto();
};

const impuestoSin = computed({
  get: () => tipoImpuestoFactura.value === 'NO',
  set: (value) => {
    if (value) {
      setTipoImpuestoFactura('NO');
    }
  }
});

const impuestoIncluido = computed({
  get: () => tipoImpuestoFactura.value === 'INCLUIDO',
  set: (value) => {
    if (value) {
      setTipoImpuestoFactura('INCLUIDO');
    } else if (tipoImpuestoFactura.value === 'INCLUIDO') {
      setTipoImpuestoFactura('NO');
    }
  }
});

const impuestoAgregado = computed({
  get: () => tipoImpuestoFactura.value === 'AGREGADO',
  set: (value) => {
    if (value) {
      setTipoImpuestoFactura('AGREGADO');
    } else if (tipoImpuestoFactura.value === 'AGREGADO') {
      setTipoImpuestoFactura('NO');
    }
  }
});

const modalPrecio1 = computed(() => Number(productoModal.value?.precio_venta || 0).toFixed(2));
const modalPrecio2 = computed(() => Number(productoModal.value?.precio_min || 0).toFixed(2));
const modalPrecio3 = computed(() => Number(productoModal.value?.precio_xmayor || 0).toFixed(2));
const modalDescuentoPorcentaje = computed(() => Number(productoSeleccionado.value?.descuento_porcentaje || 0).toFixed(1));
const modalSubtotal = computed(() => {
  const cantidad = Number(productoSeleccionado.value?.cantidad || 0);
  const precioFinal = Number(productoSeleccionado.value?.precio_final || productoSeleccionado.value?.precio_venta || 0);
  return (cantidad * precioFinal).toFixed(2);
});
const modalDescuento = computed(() => Number(productoSeleccionado.value?.descuento || 0).toFixed(2));
const modalImpuesto = computed(() => {
  const cantidad = Number(productoSeleccionado.value?.cantidad || 0);
  const impuestoUnitario = Number(productoSeleccionado.value?.impuesto_venta || 0);
  return (cantidad * impuestoUnitario).toFixed(2);
});
const modalTotal = computed(() => {
  const subtotal = Number(modalSubtotal.value || 0);
  const descuento = Number(modalDescuento.value || 0);
  return (subtotal - descuento).toFixed(2);
});

const actualizarProductoSeleccionado = () => {
  if (!productoSeleccionado.value) return;
  productoSeleccionado.value.total = calcularTotal(productoSeleccionado.value);
};

const incrementarCantidadModal = () => {
  const cantidad = Number(productoSeleccionado.value?.cantidad || 0) + 1;
  productoSeleccionado.value.cantidad = cantidad;
  actualizarProductoSeleccionado();
};

const decrementarCantidadModal = () => {
  const cantidadActual = Number(productoSeleccionado.value?.cantidad || 0);
  if (cantidadActual <= 1) return;
  productoSeleccionado.value.cantidad = cantidadActual - 1;
  actualizarProductoSeleccionado();
};

const ajustarCantidadProducto = (index, delta) => {
  const producto = productosVenta.value[index];
  if (!producto) return;
  const nuevaCantidad = Number(producto.cantidad || 0) + delta;
  if (nuevaCantidad <= 0) {
    eliminarProducto(index);
    return;
  }
  producto.cantidad = nuevaCantidad;
  producto.total = calcularTotal(producto);
  calcularTotalFactura();
  fnActualizarGuardado();
};

const cantidadEnVenta = (codigo) => {
  const producto = productosVenta.value.find(item =>
    item.codigo === codigo || item.codigo === codigo
  );
  return Number(producto?.cantidad || 0);
};
/************************************************************/
function parseProductos(productos) {
  try {
    // 1️⃣ Limpia específicamente la propiedad "otro" con triple comilla
    const limpioOtro = productos.replace(/"otro":"""\[\]"""/g, '"otro":""');

    // 2️⃣ También maneja casos con doble comilla o corchete raro en "otro"
    const limpioOtro2 = limpioOtro.replace(/"otro":"{0,1}\[\]{0,1}"/g, '"otro":""');

    // 3️⃣ Limpia otras propiedades que desees dejar vacías
    const limpio = limpioOtro2
      .replace(/"usuario":"[^"]*"/g, '"usuario":""')
      .replace(/"imagen":"[^"]*"/g, '"imagen":""')
      .replace(/"ubicacion":"[^"]*"/g, '"ubicacion":""')
      .replace(/"vencimiento":"[^"]*"/g, '"vencimiento":""');


    // 4️⃣ Parseamos normalmente
    const productosArray = JSON.parse(limpio);

    return productosArray;
  } catch (e) {
    console.error('Error parsing productos', e);
    return [];
  }
}

/************************************************************/
function calculateSubtotal(cantidad, precioVenta) {
  const cantidadNumerica = Number(cantidad);
  const precioVentaNumerico = Number(precioVenta);
  return cantidadNumerica * precioVentaNumerico;
}

function isEmpty(productos) {
  const parsedProductos = parseProductos(productos);
  return parsedProductos.length === 0;
}
/************************************************************/
const mesaActiva = ref(null);
/************************************************************/
const fnAgregarProductoMESA = async (idMesa) => {
  limpiarProductos();
  mesaActiva.value = idMesa;

  const datosMesa = mesasArray.value.find((mesa) => mesa.id === idMesa);

  if (datosMesa) {
     toast.removeAllGroups();
    toast.add({ severity: 'success', summary: 'Éxito', detail: `${datosMesa.nombre} Seleccionada`, life: 3000 });
    documentoActual.value = `${datosMesa.nombre} ACTIVA`;

    const productos = JSON.parse(datosMesa.productos);

    // Crear copias de cada producto para evitar modificar los originales
    productosVenta.value = productos.map((producto) => ({ ...producto }));

    calcularTotalFactura();
     fncambioTipoImpuesto()
    visibleMESAS.value = false;
    visiblePOS.value = true;
  } else {
    toast.add({ severity: 'error', summary: 'Error', detail: 'Mesa no encontrada', life: 3000 });
  }
};

/************************************************************/
const agregarProductosAmesa = async (idMesa) => {
  const datosMesa = mesasArray.value.find((mesa) => mesa.id === idMesa);
  const url = `${link.value}${api.value}/actualizarcampos/mesas`;

  if (!datosMesa) {
    toast.add({ severity: 'error', summary: 'Error', detail: 'Fallo al agregar Productos.', life: 500 });
    return;
  }

  // Actualizamos el campo `updated_at` si es necesario
  if (datosMesa.hasOwnProperty('created_at')) {
    datosMesa.updated_at = nfecha('timestamp');
  }

  // Obtener productos de `productosVenta` en localStorage y clonarlos
  const productos = JSON.parse(window.localStorage.getItem('productosVenta')) || [];
  const productosClonados = productos.map((producto) => ({ ...producto })); // Crear copias de los productos

  // Asignar la lista de productos clonados a la mesa en formato JSON
  datosMesa.productos = JSON.stringify(productosClonados);

  // Enviar los datos actualizados al servidor
/*  const envioDatos = await enviarDatosPorPost(url, datosMesa, tokenCifrado.value);*/
  const envioDatos = await peticionesFetchOffline('updateData','mesas', JSON.stringify(datosMesa));

  if (envioDatos[0] === 'ok') {
    await fetchMesas();
     toast.removeAllGroups();
    toast.add({ severity: 'success', summary: 'Éxito', detail: 'Datos Actualizados', life: 500 });
  } else {
    toast.add({ severity: 'error', summary: 'Error', detail: 'Fallo al actualizar los datos.', life: 500 });
  }
};

/************************************************************/
const fnLimpiarMesa = async(idMesa)=>{
  const datosMesa = mesasArray.value.find(mesa=>mesa.id === idMesa)

  const url = link.value+api.value+"/actualizarcampos/mesas";
  if (!datosMesa) {
    console.error("Datos incompletos, no se puede actualizar.");
    return;
  }
  if (datosMesa.hasOwnProperty('created_at')) {
    datosMesa.updated_at = nfecha('timestamp');
  }

 datosMesa.productos = '[]';


  const envioDatos = await peticionesFetchOffline('updateData','mesas', JSON.stringify(datosMesa));
  if (envioDatos[0] == 'ok') {
    await fetchMesas();
     toast.removeAllGroups();
    toast.add({ severity: 'success', summary: 'Éxito', detail: 'Datos Actualizados', life: 500 });
  } else {
    toast.add({ severity: 'error', summary: 'Error', detail: 'Fallo al actualizar los datos.', life: 500 });
  }


}
/**********************************************************************/
const fnCobrarMesa = async(idMesa)=>{
visibleMESAS.value = false
visiblecobrar.value = true
 limpiarProductos()
mesaActiva.value = idMesa
const datosMesa = mesasArray.value.find(mesa=>mesa.id === idMesa)
 toast.removeAllGroups();
toast.add({ severity: 'success', summary: 'Éxito', detail: datosMesa.nombre +' Seleccionada', life: 500 });
documentoActual.value = datosMesa.nombre + ' ACTIVA';
const productos = JSON.parse(datosMesa.productos)
productosVenta.value = productos;
calcularTotalFactura();
 fncambioTipoImpuesto()
visibleMESAS.value = false

}
/************************************************************/
const fnImprimirMesa = async(idMesa)=>{
    const impresionpagina = link.value + '/vista/imprimirmesa.php?id=' + idMesa;
      if(window.electron){
     // window.electron.ipcRenderer.invoke('imprimirMesa', impresionpagina, 'url', true, false);
     const datosEmpresa2 = JSON.stringify(enviarDatosLocalStorage() )
      await window.electron.ipcRenderer.invoke('imprimirMesa', idMesa,datosEmpresa2);
       }else{
         toast.add({ severity: 'error', summary: 'Upps', detail: 'Esta funcion es solo para la aplicacion Desktop', life: 3000 });
     }
}
/************************************************************/
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
/************************************************************/
const descuentoEntero = ref('0.00')
const descuentoPorcentaje = ref('0.00')

const calcularDescuentoDesdeEntero = () => {
  if (descuentoEntero.value) {
    descuentoPorcentaje.value = ((descuentoEntero.value / total.value) * 100).toFixed(2);
  } else {
    descuentoPorcentaje.value = '';
  }
};

/*******************************************/
const calcularDescuentoDesdePorcentaje = () => {
  if (descuentoPorcentaje.value) {
    descuentoEntero.value = ((descuentoPorcentaje.value / 100) * total.value).toFixed(2);
  } else {
    descuentoEntero.value = '';
  }
};
/*******************************************/
const fnAplicarDescuento = async() => {
  const descuentoAplicado = descuentoEntero.value ? Number(descuentoEntero.value) : 0;
  const nuevoTotal = total.value - descuentoAplicado;
   const campos = await arrayToObjetoFromTablaOffline('productos',true);
   campos.nombre = 'DESCUENTO APLICADO'
   campos.categoria = 'DESCUENTO APLICADO'
   campos.codigo = generarCodigoUnico();
   campos.codigo_barra = generarCodigoUnico();
   campos.precio_venta = -descuentoAplicado;
   campos.precio_final = -descuentoAplicado;
   campos.precio_min = -descuentoAplicado;
   campos.precio_xmayor = -descuentoAplicado;
   campos.impuestos = '0.00';
   campos.ganancia = '0.00';
   campos.ganancia_pura = '0.00';
   campos.impuesto = '0.00';
   campos.impuesto_venta = '0.00';
   campos.precio_compra = '0.00';
        datosProductoBuscado.value = campos;
        fnagregarProductoBuscado();

  visibleDescuento.value = false;
};
/************************************************************/
// Retrieve and parse the tabladefault object from localStorage
const tabladefaultD = localStorage.getItem('tabladefault');
let activarPos = false;

if (tabladefaultD) {
  try {
    const parsedData = JSON.parse(tabladefaultD);
    activarPos = parsedData.activar_pos === "true";
  } catch (e) {
    console.error("Error parsing tabladefault from localStorage", e);
  }
}

// Computed function to determine which image to use
const getProductImage = (imageUrl) => {
  return computed(() => {
    return imageUrl;
  }).value; // Ensure to access the value of computed property
};
/************************************************************/
const fnConvertirEnFactura = async()=>{
  visiblefatcoti.value = false
  const datosCotizacion = await peticionesFetch(`${link.value}${api.value}`,`datoscampo/cotizacion/no_cotizacion/${datosFactCoti.value.numero}`,{},tokenCifrado.value,'GET');

  cotizacionConvertida.value = datosCotizacion.no_cotizacion;
  const productos = JSON.parse(datosCotizacion.productos)

  for(let prod of productos){
      prod.ganancia = calcularGanancias(prod)
      prod.ganancia_pura = calcularGanancias(prod)
  }

  const cliente = allClientes.value.find(cliente => cliente.codigo === datosCotizacion.cod_cliente);
  const clienteBase = allClientes.value.find(c => c.codigo === '0000000') || {};
  clienteSelected.value = cliente || {
    ...clienteBase,
    codigo: datosCotizacion.cod_cliente || clienteBase.codigo || '0000000',
    nombre: datosCotizacion.nombre_cliente || datosCotizacion.nombre_comercial || clienteBase.nombre || `Cliente no encontrado (${datosCotizacion.cod_cliente || 'sin codigo'})`,
    n_comercial: datosCotizacion.nombre_comercial || datosCotizacion.nombre_cliente || clienteBase.n_comercial || `Cliente no encontrado (${datosCotizacion.cod_cliente || 'sin codigo'})`,
    telefono: datosCotizacion.telefono_cliente || datosCotizacion.whatsapp_cliente || clienteBase.telefono || '',
    email: datosCotizacion.email_cliente || clienteBase.email || '',
    direccion: datosCotizacion.direccion_cliente || clienteBase.direccion || '',
    rnc: datosCotizacion.rnc_cliente || clienteBase.rnc || '',
    cedula: datosCotizacion.rnc_cliente || clienteBase.cedula || '',
    precio_fijado: clienteBase.precio_fijado || 'Normal'
  };

  if (!cliente) {
    toast.add({ severity: 'warn', summary: 'Aviso', detail: 'El cliente no existe en el maestro, se usaran los datos guardados en la cotizacion.', life: 4000 });
  }

   productosVenta.value = productos
   nota.value = datosCotizacion.nota
   calcularTotalFactura();
    fncambioTipoImpuesto()
    tipoFactura.value = 'factura'

}
/************************************************************/
const fnConvertirPreFacturaEnFactura = async () => {
  visiblefatcoti.value = false;

  try {
    // Obtener datos de la pre-factura
    const datosPreFactura = await peticionesFetchOffline('getDataByField', 'pre_facturas', 'no_factura', datosFactCoti.value.numero);

    if (!datosPreFactura) {
      toast.add({ severity: 'error', summary: 'Error', detail: 'Pre-Factura no encontrada', life: 3000 });
      return;
    }

    // Parsear productos
    const productos = JSON.parse(datosPreFactura.productos);

    // Calcular ganancias para cada producto
    for (let prod of productos) {
      prod.ganancia = calcularGanancias(prod);
      prod.ganancia_pura = calcularGanancias(prod);
    }

    // Buscar y seleccionar cliente
    clienteSelected.value = allClientes.value.find(cliente => cliente.codigo === datosPreFactura.cod_cliente);

    // Cargar productos y nota
    productosVenta.value = productos;
    nota.value = datosPreFactura.nota || '';

    // Cambiar tipo de documento a factura
    tipoFactura.value = 'factura';
    documentoActual.value = 'FACTURA';

    // Recalcular totales
    calcularTotalFactura();
    fncambioTipoImpuesto();

    toast.add({ severity: 'success', summary: 'Éxito', detail: 'Pre-Factura cargada. Procede a guardar como Factura.', life: 3000 });
  } catch (error) {
    console.error('Error al convertir pre-factura:', error);
    toast.add({ severity: 'error', summary: 'Error', detail: 'Error al convertir Pre-Factura', life: 3000 });
  }
};
/************************************************************/
const fnConvertirOrdenEnFactura = async () => {
  visiblefatcoti.value = false;

  try {
    // Obtener datos de la orden
    const datosOrden = await peticionesFetchOffline('getDataByField', 'ordenes', 'no_orden', datosFactCoti.value.numero);

    if (!datosOrden) {
      toast.add({ severity: 'error', summary: 'Error', detail: 'Orden no encontrada', life: 3000 });
      return;
    }

    // Parsear productos
    const productos = JSON.parse(datosOrden.productos);

    // Calcular ganancias para cada producto
    for (let prod of productos) {
      prod.ganancia = calcularGanancias(prod);
      prod.ganancia_pura = calcularGanancias(prod);
    }

    // Buscar y seleccionar cliente
    clienteSelected.value = allClientes.value.find(cliente => cliente.codigo === datosOrden.cod_cliente);

    // Cargar productos y nota
    productosVenta.value = productos;
    nota.value = datosOrden.nota || '';

    // Cambiar tipo de documento a factura
    tipoFactura.value = 'factura';
    documentoActual.value = 'FACTURA';

    // Recalcular totales
    calcularTotalFactura();
    fncambioTipoImpuesto();

    toast.add({ severity: 'success', summary: 'Éxito', detail: 'Orden cargada. Procede a guardar como Factura.', life: 3000 });
  } catch (error) {
    console.error('Error al convertir orden:', error);
    toast.add({ severity: 'error', summary: 'Error', detail: 'Error al convertir Orden', life: 3000 });
  }
};
/************************************************************/
/************************************************************/
// FUNCIONES PARA APARTADO
/************************************************************/
const fnConvertirApartadoEnFactura = async () => {
  visiblefatcoti.value = false;

  try {
    const datosApartado = await peticionesFetchOffline('getDataByField', 'apartados', 'no_factura', datosFactCoti.value.numero);

    if (!datosApartado) {
      toast.add({ severity: 'error', summary: 'Error', detail: 'Apartado no encontrado', life: 3000 });
      return;
    }

    if (datosApartado.saldo > 0) {
      const result = await Swal.fire({
        title: '¿Convertir Apartado con Saldo Pendiente?',
        html: `
          <p>Este apartado tiene un saldo pendiente de <strong>${datosConfiguracion.value.simbolo}${datosApartado.saldo}</strong></p>
          <p>¿Deseas convertirlo en factura de todas formas?</p>
        `,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Sí, convertir',
        cancelButtonText: 'Cancelar'
      });

      if (!result.isConfirmed) return;
    }

    // Parsear productos
    const productos = JSON.parse(datosApartado.productos);

    // Calcular ganancias para cada producto
    for (let prod of productos) {
      prod.ganancia = calcularGanancias(prod);
      prod.ganancia_pura = calcularGanancias(prod);
    }

    // Buscar y seleccionar cliente
    clienteSelected.value = allClientes.value.find(cliente => cliente.codigo === datosApartado.cod_cliente);

    // Cargar productos y nota
    productosVenta.value = productos;
    nota.value = datosApartado.nota || '';

    // Cambiar tipo de documento a factura
    tipoFactura.value = 'factura';
    documentoActual.value = 'FACTURA';

    // Recalcular totales
    calcularTotalFactura();
    fncambioTipoImpuesto();

    toast.add({ severity: 'success', summary: 'Éxito', detail: 'Apartado cargado. Procede a guardar como Factura.', life: 3000 });
  } catch (error) {
    console.error('Error al convertir apartado:', error);
    toast.add({ severity: 'error', summary: 'Error', detail: 'Error al convertir Apartado', life: 3000 });
  }
};
/************************************************************/
const fnAbonarApartadoModal = async () => {
  // Cerrar modal de facturas y cotizaciones
  visiblefatcoti.value = false;

  try {
    const datosApartado = await peticionesFetchOffline('getDataByField', 'apartados', 'no_factura', datosFactCoti.value.numero);

    if (!datosApartado) {
      toast.add({ severity: 'error', summary: 'Error', detail: 'Apartado no encontrado', life: 3000 });
      return;
    }

    const saldo = parseFloat(datosApartado.saldo || 0);

    if (saldo <= 0) {
      toast.add({ severity: 'info', summary: 'Info', detail: 'Este apartado ya está saldado', life: 3000 });
      return;
    }

    const { value: formValues } = await Swal.fire({
      title: 'Abonar al Apartado',
      html: `
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium mb-1">Cliente</label>
            <input type="text" value="${datosApartado.nombre_cliente}" disabled class="w-full p-2 border rounded bg-gray-100">
          </div>
          <div>
            <label class="block text-sm font-medium mb-1">Saldo Pendiente</label>
            <input type="text" value="${datosConfiguracion.value.simbolo}${saldo.toFixed(2)}" disabled class="w-full p-2 border rounded bg-gray-100 font-bold">
          </div>
          <div>
            <label class="block text-sm font-medium mb-1">Monto del Abono</label>
            <input
              id="swal-input-monto"
              type="number"
              step="0.01"
              max="${saldo}"
              placeholder="0.00"
              class="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
            >
          </div>
          <div>
            <label class="block text-sm font-medium mb-1">Método de Pago</label>
            <select id="swal-input-metodo" class="w-full p-2 border rounded">
              <option value="EFECTIVO">EFECTIVO</option>
              <option value="TARJETA">TARJETA</option>
              <option value="TRANSFERENCIA">TRANSFERENCIA</option>
            </select>
          </div>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: 'Registrar Abono',
      cancelButtonText: 'Cancelar',
      preConfirm: () => {
        const monto = parseFloat(document.getElementById('swal-input-monto').value);
        const metodo = document.getElementById('swal-input-metodo').value;

        if (!monto || monto <= 0) {
          Swal.showValidationMessage('Por favor ingresa un monto válido');
          return false;
        }

        if (monto > saldo) {
          Swal.showValidationMessage('El monto no puede ser mayor al saldo');
          return false;
        }

        return { monto, metodo };
      }
    });

    if (!formValues) return;

    // Parsear pagos existentes
    let pagosArray = [];
    try {
      if (datosApartado.pagos && datosApartado.pagos.trim() !== '') {
        pagosArray = JSON.parse(datosApartado.pagos);
      }
    } catch (e) {
      pagosArray = [];
    }

    // Agregar nuevo pago
    const nuevoSaldo = (saldo - formValues.monto).toFixed(2);
    const nuevoPago = {
      nopago: pagosArray.length + 1,
      fecha: nfecha('fecha'),
      hora: nfecha('hora'),
      cantidad: formValues.monto.toFixed(2),
      metodo: formValues.metodo,
      saldo: nuevoSaldo,
      cajero: datosEmpresa.usuario.nombre,
      turno: ''
    };

    pagosArray.push(nuevoPago);

    // Actualizar apartado
    const totalAbonado = pagosArray.reduce((sum, pago) => sum + parseFloat(pago.cantidad), 0).toFixed(2);
    datosApartado.pagos = JSON.stringify(pagosArray);
    datosApartado.abonado = totalAbonado;
    datosApartado.saldo = nuevoSaldo;
    datosApartado.estatus = nuevoSaldo <= 0 ? 'SALDADO' : 'PENDIENTE';
    datosApartado.updated_at = nfecha('timestamp');

    // Guardar en base de datos
    const resultado = await peticionesFetchOffline('updateData', 'apartados', JSON.stringify(datosApartado));

    if (resultado[0] === 'ok') {
      toast.add({ severity: 'success', summary: 'Éxito', detail: 'Abono registrado correctamente', life: 3000 });

      // Preguntar si desea imprimir
      const { value: imprimir } = await Swal.fire({
        title: 'Abono Registrado',
        text: '¿Deseas imprimir el comprobante?',
        icon: 'success',
        showDenyButton: true,
        confirmButtonText: 'Ticket',
        denyButtonText: 'PDF Carta',
        showCancelButton: true,
        cancelButtonText: 'No imprimir'
      });

      if (imprimir === true) {
        await fnImprimirTicketApartado();
      } else if (imprimir === false) {
        await fnImprimirPDFApartado();
      }
    } else {
      toast.add({ severity: 'error', summary: 'Error', detail: 'Error al registrar el abono', life: 3000 });
    }
  } catch (error) {
    console.error('Error al abonar apartado:', error);
    toast.add({ severity: 'error', summary: 'Error', detail: 'Error al procesar el abono', life: 3000 });
  }
};
/************************************************************/
const fnImprimirTicketApartado = async () => {
  try {
    const datosApartado = await peticionesFetchOffline('getDataByField', 'apartados', 'no_factura', datosFactCoti.value.numero);

    if (!datosApartado) {
      toast.add({ severity: 'error', summary: 'Error', detail: 'Apartado no encontrado', life: 3000 });
      return;
    }

    const datosEmpresaA = JSON.stringify(enviarDatosLocalStorage());

    // Crear copia limpia sin referencias circulares
    const datosApartadoLimpio = {
      no_emision: datosApartado.no_emision,
      no_factura: datosApartado.no_factura,
      cod_cliente: datosApartado.cod_cliente,
      nombre_cliente: datosApartado.nombre_cliente,
      cedula_cliente: datosApartado.cedula_cliente,
      email_cliente: datosApartado.email_cliente,
      direccion_cliente: datosApartado.direccion_cliente,
      productos: datosApartado.productos,
      fecha_emision: datosApartado.fecha_emision,
      hora: datosApartado.hora,
      monto_credito: datosApartado.monto_credito,
      abonado: datosApartado.abonado,
      saldo: datosApartado.saldo,
      estatus: datosApartado.estatus,
      vendedor: datosApartado.vendedor,
      pagos: datosApartado.pagos,
      nota: datosApartado.nota
    };

    await window.electron.ipcRenderer.invoke('ticketApartado', JSON.stringify(datosApartadoLimpio), datosEmpresaA);
    toast.add({ severity: 'success', summary: 'Éxito', detail: 'Imprimiendo ticket...', life: 3000 });
  } catch (error) {
    console.error('Error al imprimir ticket:', error);
    toast.add({ severity: 'error', summary: 'Error', detail: 'Error al imprimir ticket', life: 3000 });
  }
};
/************************************************************/
const fnImprimirPDFApartado = async () => {
  try {
    const datosApartado = await peticionesFetchOffline('getDataByField', 'apartados', 'no_factura', datosFactCoti.value.numero);

    if (!datosApartado) {
      toast.add({ severity: 'error', summary: 'Error', detail: 'Apartado no encontrado', life: 3000 });
      return;
    }

    const datosEmpresaA = JSON.stringify(enviarDatosLocalStorage());
    const datosCliente = allClientes.value.find(cl => cl.codigo === datosApartado.cod_cliente);

    // Crear copia limpia sin referencias circulares
    const datosApartadoLimpio = {
      no_emision: datosApartado.no_emision,
      no_factura: datosApartado.no_factura,
      cod_cliente: datosApartado.cod_cliente,
      nombre_cliente: datosApartado.nombre_cliente,
      cedula_cliente: datosApartado.cedula_cliente,
      email_cliente: datosApartado.email_cliente,
      direccion_cliente: datosApartado.direccion_cliente,
      productos: datosApartado.productos,
      fecha_emision: datosApartado.fecha_emision,
      hora: datosApartado.hora,
      monto_credito: datosApartado.monto_credito,
      abonado: datosApartado.abonado,
      saldo: datosApartado.saldo,
      estatus: datosApartado.estatus,
      vendedor: datosApartado.vendedor,
      pagos: datosApartado.pagos,
      nota: datosApartado.nota
    };

    const clienteLimpio = {
      nombre: datosCliente?.nombre || '',
      rnc: datosCliente?.rnc || '',
      direccion: datosCliente?.direccion || ''
    };

    await window.electron.ipcRenderer.invoke('apartadoPDF', JSON.stringify(datosApartadoLimpio), JSON.stringify(clienteLimpio), datosEmpresaA);
    toast.add({ severity: 'success', summary: 'Éxito', detail: 'Generando PDF...', life: 3000 });
  } catch (error) {
    console.error('Error al generar PDF:', error);
    toast.add({ severity: 'error', summary: 'Error', detail: 'Error al generar PDF', life: 3000 });
  }
};
/************************************************************/
const fnAgregarMaterialesOrden = async () => {
  try {
    const numeroOrden = datosFactCoti.value.numero;

    if (!numeroOrden) {
      toast.add({ severity: 'error', summary: 'Error', detail: 'Debe seleccionar una orden', life: 3000 });
      return;
    }

    // Ocultar modal de facturas
    visiblefatcoti.value = false;

    // Obtener datos de la orden
    const datosOrden = await peticionesFetchOffline('getDataByField', 'ordenes', 'no_orden', numeroOrden);

    if (!datosOrden) {
      toast.add({ severity: 'error', summary: 'Error', detail: 'Orden no encontrada', life: 3000 });
      return;
    }

    // Parsear materiales existentes
    let materiales = [];
    try {
      if (datosOrden.materiales && datosOrden.materiales.trim() !== '') {
        materiales = JSON.parse(datosOrden.materiales);
      }
    } catch (e) {
      console.error('Error al parsear materiales:', e);
      materiales = [];
    }

    // Mostrar modal principal
    await mostrarModalMateriales(numeroOrden, materiales, datosOrden);

  } catch (error) {
    console.error('Error al agregar materiales:', error);
    toast.add({ severity: 'error', summary: 'Error', detail: 'Error al procesar materiales', life: 3000 });
  }
};

const mostrarModalMateriales = async (numeroOrden, materiales, datosOrden) => {
  // Generar tabla HTML
  let tablaHTML = '';
  if (materiales.length === 0) {
    tablaHTML = '<p class="text-center text-gray-500 my-4">No hay materiales agregados</p>';
  } else {
    tablaHTML = '<table class="w-full text-sm border-collapse"><thead><tr class="bg-gray-100"><th class="p-2 text-left border">Material</th><th class="p-2 text-center border">Cantidad</th><th class="p-2 text-center border">Unidad</th></tr></thead><tbody>';

    materiales.forEach((mat) => {
      tablaHTML += '<tr class="border-b"><td class="p-2 border">' + mat.nombre + '</td><td class="p-2 text-center border">' + mat.cantidad + '</td><td class="p-2 text-center border">' + (mat.unidad || 'UND') + '</td></tr>';
    });

    tablaHTML += '</tbody></table>';
  }

  const resultado = await Swal.fire({
    title: 'Materiales de Orden ' + numeroOrden,
    html: '<div class="space-y-4"><div>' + tablaHTML + '</div><hr class="my-4"><div class="text-left"><h4 class="font-bold mb-2">Agregar Nuevo Material</h4><div class="space-y-2"><input type="text" id="nombreMaterial" class="swal2-input w-full" placeholder="Nombre del material"><div class="flex gap-2"><input type="number" id="cantidadMaterial" class="swal2-input flex-1" placeholder="Cantidad" min="1" step="0.01"><select id="unidadMaterial" class="swal2-input flex-1"><option value="UND">Unidad</option><option value="KG">Kilogramo</option><option value="LB">Libra</option><option value="M">Metro</option><option value="M2">Metro²</option><option value="L">Litro</option><option value="GAL">Galón</option><option value="PZA">Pieza</option><option value="CAJA">Caja</option></select></div></div></div></div>',
    width: '600px',
    showDenyButton: materiales.length > 0,
    showCancelButton: true,
    confirmButtonText: 'Agregar Material',
    denyButtonText: 'Eliminar Último',
    cancelButtonText: 'Guardar y Cerrar',
    preConfirm: () => {
      const nombre = document.getElementById('nombreMaterial').value;
      const cantidad = document.getElementById('cantidadMaterial').value;
      const unidad = document.getElementById('unidadMaterial').value;

      if (!nombre || !cantidad) {
        Swal.showValidationMessage('Debe completar nombre y cantidad');
        return false;
      }

      return { nombre, cantidad: parseFloat(cantidad), unidad };
    }
  });

  // Verificar qué botón se presionó
  if (resultado.isConfirmed && resultado.value) {
    // Botón "Agregar Material" presionado
    materiales.push({
      nombre: resultado.value.nombre,
      cantidad: resultado.value.cantidad,
      unidad: resultado.value.unidad
    });
    // Volver a mostrar el modal
    await mostrarModalMateriales(numeroOrden, materiales, datosOrden);
  } else if (resultado.isDenied) {
    // Botón "Eliminar Último" presionado
    if (materiales.length > 0) {
      materiales.pop();
    }
    await mostrarModalMateriales(numeroOrden, materiales, datosOrden);
  } else if (resultado.isDismissed && resultado.dismiss === Swal.DismissReason.cancel) {
    // Botón "Guardar y Cerrar" presionado
    const materialesJSON = JSON.stringify(materiales);

    const ordenActualizada = {
      ...datosOrden,
      materiales: materialesJSON,
      updated_at: nfecha('timestamp')
    };

    const resultado2 = await peticionesFetchOffline('updateData', 'ordenes', JSON.stringify(ordenActualizada));

    if (resultado2[0] === 'ok') {
      const indexOrden = ordenesArray.value.findIndex(ord => ord.no_orden === numeroOrden);
      if (indexOrden !== -1) {
        ordenesArray.value[indexOrden] = ordenActualizada;
      }

      toast.add({
        severity: 'success',
        summary: 'Éxito',
        detail: 'Materiales guardados: ' + materiales.length + ' items',
        life: 3000
      });
    } else {
      toast.add({ severity: 'error', summary: 'Error', detail: 'Error al guardar los materiales', life: 3000 });
    }
  }
  // Si presionó ESC o click fuera (isDismissed con otro dismiss), simplemente cierra
};
/************************************************************/
const fnGenerarPDFMateriales = async () => {
  try {
    const numeroOrden = datosFactCoti.value.numero;

    if (!numeroOrden) {
      toast.add({ severity: 'error', summary: 'Error', detail: 'Debe seleccionar una orden', life: 3000 });
      return;
    }

    // Obtener datos de la orden
    const datosOrden = await peticionesFetchOffline('getDataByField', 'ordenes', 'no_orden', numeroOrden);

    if (!datosOrden) {
      toast.add({ severity: 'error', summary: 'Error', detail: 'Orden no encontrada', life: 3000 });
      return;
    }

    // Verificar si tiene materiales
    if (!datosOrden.materiales || datosOrden.materiales.trim() === '' || datosOrden.materiales === '[]') {
      toast.add({
        severity: 'warn',
        summary: 'Advertencia',
        detail: 'Esta orden no tiene materiales registrados',
        life: 3000
      });
      return;
    }

    // Generar PDF usando IPC
    const datosEmpresa = JSON.stringify(enviarDatosLocalStorage());
    await window.electron.ipcRenderer.invoke('materialesOrdenPDF', JSON.stringify(datosOrden), datosEmpresa);

    toast.add({
      severity: 'success',
      summary: 'Éxito',
      detail: 'PDF de materiales generado correctamente',
      life: 3000
    });

  } catch (error) {
    console.error('Error al generar PDF de materiales:', error);
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Error al generar el PDF de materiales',
      life: 3000
    });
  }
};
/************************************************************/
const fnActualizarGuardado = async()=>{

//datosFactCoti.value.impresora

    if (documentoEditado.value == 'Factura') {
        await actualizarFactura()
        return
    }


    if (documentoEditado.value == 'Cotizacion') {
        await actualizarCotizacion()
        return
    }

}
const docArray = ref([])
const docVisible = ref(false)
const searchQueryFactura = ref('');
/************************************************************/
const fetchFacturasDoc = async (endpoint) => {
    docVisible.value = true;
  try {
    const responseFacturas = await peticionesFetchOffline('getDataArrayByCondition', endpoint,'almacen',datosEmpresa.empresa.nombre);

    return responseFacturas;
  } catch (error) {
    console.error('Error fetching facturas data:', error);
    toast.add({ severity: 'error', summary: 'Error', detail: 'Error fetching data of Facturas', life: 3000 });
    return [];
  }
};
/************************************************************/

const fnBuscarDocNombre = async () => {
  const tipo = datosFactCoti.value.tipo;

  // Mapeo de tipos a endpoints
  const endpointMap = {
    'Factura': 'facturas',
    'Cotizacion': 'cotizacion',
    'Pre-Factura': 'pre_facturas',
    'Orden': 'ordenes'
  };

  const endpoint = endpointMap[tipo] || 'facturas';
  const responseFacturas = await fetchFacturasDoc(endpoint);

  // Normalizar campos según el tipo
  if (tipo === 'Cotizacion') {
    docArray.value = responseFacturas.map(factura => ({
      ...factura,
      no_factura: factura.no_cotizacion
    }));
  } else if (tipo === 'Orden') {
    docArray.value = responseFacturas.map(orden => ({
      ...orden,
      nombre_cliente: orden.cliente // Mapear cliente a nombre_cliente
    }));
  } else {
    docArray.value = responseFacturas;
  }

};

/************************************************************/
const filteredFacturas = computed(() => {
  const searchTerm = searchQueryFactura.value.toLowerCase(); // Convertir a minúsculas para búsqueda insensible a mayúsculas

  return docArray.value.filter(factura => {
    return (
      (factura.no_factura?.toString().toLowerCase().includes(searchTerm) || '') || 
      (factura.fecha_emision?.toLowerCase().includes(searchTerm) || '') ||  
      (factura.nombre_cliente?.toLowerCase().includes(searchTerm) || '') || 
      (factura.total?.toString().includes(searchTerm) || '') 
    );
  });
});


/************************************************************/
const onRowSelectFactura = (event) => {
   //visiblefatcoti.value = false;
    datosFactCoti.value.numero = event.data.no_factura;
   docVisible.value = false;


  if(datosFactCoti.value.tipo === 'Factura'){
        let datos = event.data

     if(datos){
        if(datos.metodo_pago === 'CREDITO'){
          facturaEsCredito.value = true
        }else{
          facturaEsCredito.value = false
        }
     }
  }




   return
  Swal.fire({
    title: '¿Qué deseas hacer?',
    text: `Seleccionaste la ${datosFactCoti.value.tipo} No.${event.data.no_factura}, elige una opción`,
    icon: 'question',
    showCancelButton: true,
    showDenyButton: true,
    confirmButtonText: 'Editar',
    denyButtonText: 'Imprimir',
    cancelButtonText: 'Otro'
  }).then((result) => {
    if (result.isConfirmed) {

    datosFactCoti.value.numero = event.data.no_factura;

     editarFactura() 

    } else if (result.isDenied) {
        const docNumber = event.data.no_factura

        if(datosFactCoti.value.tipo === 'Cotizacion'){
          datosFactCoti.value.numero = event.data.no_cotizacion
        }else{
         const datosEmpresa = JSON.stringify(enviarDatosLocalStorage() )
         //window.electron.ipcRenderer.invoke('ticket',docNumber,datosEmpresa);
          datosFactCoti.value.numero = event.data.no_factura
          
       }

           visiblePrint.value = true
    } else if (result.dismiss === Swal.DismissReason.cancel) {
      visiblefatcoti.value = true
      datosFactCoti.value.numero = event.data.no_factura;
      docVisible.value = false;
    }
  });
};
/************************************************************/
const fnNuevoDescuento = (desc)=>{
descuentoEntero.value = desc
fnAplicarDescuento()

}
/************************************************************/
const fnBorrarProducto = (producto)=>{
    const datosLocalStorage = JSON.parse(localStorage.getItem('productosVenta')) || [];
        const index = datosLocalStorage.findIndex(prod => prod.codigo === producto.codigo);
        if (index !== -1) {
          datosLocalStorage.splice(index, 1);
          localStorage.setItem('productosVenta', JSON.stringify(datosLocalStorage));
          productosVenta.value = [...datosLocalStorage];  // Sincronizar con el array reactivo
           //fnAgregarProdFerreteria() 
          toast.add({
            severity: 'success',
            summary: 'Producto Eliminado',
            detail: `El producto ${producto.nombre} ha sido eliminado de la venta.`,
            life: 3000,
          });
        }
}
/************************************************************/
const fnCambioInstitucion = ()=>{
  const instituc = intitucionesData.value.find(inst=>inst.nombre === institucion.value)
  if(instituc){
     const porciento = Number(instituc.porciento)
      
        productosVenta.value.forEach(producto => {
        const incremento = (Number(producto.precio_final) * porciento) / 100;
        const nuevoPrecio = (Number(producto.precio_final) + incremento);

        producto.precio_final = nuevoPrecio

//const datosProducto = await peticionesFetch(`${link.value}${api.value}`, `datoscampo/productos/id/${producto.id}`, {}, tokenCifrado.value, 'GET');


fnBorrarProducto(producto)


datosProductoSeleccionadoPrincipal.value = producto
nombreProductFerreteria.value = producto.nombre
cantidadProductFerreteria.value = 1
precioProductFerreteria.value = nuevoPrecio

   preciosArrayFerreteria.value = [
      producto.precio_venta,
      producto.precio_min,
      producto.precio_xmayor,
    ];

    fnAgregarProdFerreteria()


    });
    
          //console.log("productosVentaArray.value", productosVentaArray.value);
//sumaTotal()
 calcularTotalFactura();
 fncambioTipoImpuesto()

  }else{
    toast.add({
      severity: 'warn',
      summary: 'Upps',
      detail: 'No se encuentra la Intitucion',
      life: 3000
    });
  }
}
/************************************************************/
/************************************************/
// Función para enviar factura/cotización por WhatsApp
const fnEnviarWhatsApp = async () => {
  const numeroDoc = datosFactCoti.value.numero;
  const tipoDoc = datosFactCoti.value.tipo;

  if (!numeroDoc) {
    toast.add({ severity: 'error', summary: 'Error', detail: 'Debe seleccionar un documento', life: 3000 });
    return;
  }

  let clienteData = null;
  let linkDocumento = '';

  // Obtener id de la empresa
  const empresaId = datosEmpresa.empresa?.id || '';

  // Obtener datos según el tipo de documento
  if (tipoDoc === 'Factura') {
    const datosFactura = allFacturasFull.value.find(fact => fact.no_factura === numeroDoc);
    if (datosFactura) {
      clienteData = allClientes.value.find(cl => cl.codigo === datosFactura.cod_cliente);
      linkDocumento = `${link.value}/receipt/factura?factura=${numeroDoc}&empresa=${empresaId}`;
    }
  } else if (tipoDoc === 'Cotizacion') {
    const datosCotizacion = allCotizacionesFull.value.find(cot => cot.no_cotizacion === numeroDoc);
    if (datosCotizacion) {
      clienteData = allClientes.value.find(cl => cl.codigo === datosCotizacion.cod_cliente);
      linkDocumento = `${link.value}/receipt/cotizacion?cotizacion=${numeroDoc}&empresa=${empresaId}`;
    }
  }

  if (!clienteData) {
    toast.add({ severity: 'error', summary: 'Error', detail: 'No se encontró el cliente del documento', life: 3000 });
    return;
  }

  if (!clienteData.telefono) {
    toast.add({ severity: 'warn', summary: 'Advertencia', detail: 'El cliente no tiene teléfono registrado', life: 3000 });
  }

  // Preparar mensaje
  const nombreEmpresa = datosEmpresa.empresa?.nombre || 'Nuestra empresa';
  const mensaje = tipoDoc === 'Factura'
    ? `Hola ${clienteData.nombre}, le enviamos su factura #${numeroDoc} de ${nombreEmpresa}. Puede verla en el siguiente enlace: ${linkDocumento}`
    : `Hola ${clienteData.nombre}, le enviamos su cotización #${numeroDoc} de ${nombreEmpresa}. Puede verla en el siguiente enlace: ${linkDocumento}`;

  // Actualizar datos del modal de WhatsApp
  datosWhatsApp.value = {
    nombre: clienteData.nombre || '',
    numero: clienteData.telefono || '',
    texto: mensaje
  };

  // Abrir modal de WhatsApp
  if (whatsappModalRef.value) {
    whatsappModalRef.value.updateDatosWhatsApp(datosWhatsApp.value);
    whatsappModalRef.value.visible = true;
  }
};
/************************************************/
// Función para enviar WhatsApp después de crear factura (desde el Swal)
const showWhatsAppModal = async () => {
  const numeroDoc = noFacturaFN.value;
  const tipoDoc = datosFactCoti.value.tipo || 'Factura';

  if (!numeroDoc) {
    toast.add({ severity: 'error', summary: 'Error', detail: 'No hay documento para enviar', life: 3000 });
    return;
  }

  // Obtener id de la empresa
  const empresaId = datosEmpresa.empresa?.id || '';

  // Obtener datos del cliente desde la factura creada
  let clienteData = null;

  if (tipoDoc === 'Factura') {
    const datosFactura = await peticionesFetchOffline('getDataByField', 'facturas', 'no_factura', numeroDoc);
    if (datosFactura) {
      clienteData = allClientes.value.find(cl => cl.codigo === datosFactura.cod_cliente);
    }
  } else if (tipoDoc === 'Cotizacion') {
    const datosCotizacion = await peticionesFetchOffline('getDataByField', 'cotizacion', 'no_cotizacion', numeroDoc);
    if (datosCotizacion) {
      clienteData = allClientes.value.find(cl => cl.codigo === datosCotizacion.cod_cliente);
    }
  }

  if (!clienteData) {
    toast.add({ severity: 'error', summary: 'Error', detail: 'No se encontró el cliente de la factura', life: 3000 });
    return;
  }

  if (!clienteData.telefono) {
    toast.add({ severity: 'warn', summary: 'Advertencia', detail: 'El cliente no tiene teléfono registrado', life: 3000 });
  }

  // Generar link del documento
  let linkDocumento = '';
  if (tipoDoc === 'Factura') {
    linkDocumento = `${link.value}/receipt/factura?factura=${numeroDoc}&empresa=${empresaId}`;
  } else if (tipoDoc === 'Cotizacion') {
    linkDocumento = `${link.value}/receipt/cotizacion?cotizacion=${numeroDoc}&empresa=${empresaId}`;
  }

  // Preparar mensaje
  const nombreEmpresa = datosEmpresa.empresa?.nombre || 'Nuestra empresa';
  const mensaje = tipoDoc === 'Factura'
    ? `Hola ${clienteData.nombre}, le enviamos su factura #${numeroDoc} de ${nombreEmpresa}. Puede verla en el siguiente enlace: ${linkDocumento}`
    : `Hola ${clienteData.nombre}, le enviamos su cotización #${numeroDoc} de ${nombreEmpresa}. Puede verla en el siguiente enlace: ${linkDocumento}`;

  // Actualizar datos del modal de WhatsApp
  datosWhatsApp.value = {
    nombre: clienteData.nombre || '',
    numero: clienteData.telefono || '',
    texto: mensaje
  };

  // Abrir modal de WhatsApp
  if (whatsappModalRef.value) {
    whatsappModalRef.value.updateDatosWhatsApp(datosWhatsApp.value);
    whatsappModalRef.value.visible = true;
  }
};
/************************************************/
const fnImpresoraGrande = async()=>{
           // const impresionpagina = link.value+'/receipt/factura.php?factura='+datosFactCoti.value.numero;
          //window.electron.ipcRenderer.invoke('open-new-window', impresionpagina,'url',false,true,false)
   //await impresoraGrande()
   //return
 visiblefatcoti.value = false
 visiblePrint.value = false

//tipoFactura
    const factura  = datosFactCoti.value.numero;

    if (factura == '') {
      toast.add({ severity: 'error', summary: 'Error', detail: 'Debe seleccionar un documento para imprimir', life: 3000 });
      visiblePrint.value = false
      return
    }
if (datosFactCoti.value.tipo == 'Factura') {
    const datosFactura = allFacturasFull.value.find(fact=>fact.no_factura === datosFactCoti.value.numero)
    if (!datosFactura) {
      toast.add({ severity: 'error', summary: 'Error', detail: 'No se encontró la factura para imprimir', life: 3000 })
      return
    }
    const datosCliente = allClientes.value.find(cl=>cl.codigo === datosFactura.cod_cliente) || {}
    const datosEmpresaLocal = enviarDatosLocalStorage()

    if (!facturaPdfPrintRef.value?.printFactura) {
      toast.add({ severity: 'error', summary: 'Error', detail: 'Componente de impresión no disponible', life: 3000 })
      return
    }

    await facturaPdfPrintRef.value.printFactura({
      factura: datosFactura,
      cliente: datosCliente,
      datosEmpresa: datosEmpresaLocal
    })
}else if(datosFactCoti.value.tipo == 'Pre-Factura'){
    if (window.electron) {
        visiblePrint.value = false;
        const datosPreFactura = preFacturasArray.value.find(pf => pf.no_factura === datosFactCoti.value.numero);
        const datosCliente = allClientes.value.find(cl => cl.codigo === datosPreFactura?.cod_cliente);
        const datosEmpresa1 = JSON.stringify(enviarDatosLocalStorage());
        const envio = await window.electron.ipcRenderer.invoke('prefacturaPDF', JSON.stringify(datosPreFactura), JSON.stringify(datosCliente), datosEmpresa1);
    } else {
        router.push({ path: `/factura/${datosFactCoti.value.numero}/pre_facturas` });
    }
}else if(datosFactCoti.value.tipo == 'Orden'){
    if (window.electron) {
        visiblePrint.value = false;
        const datosOrden = ordenesArray.value.find(ord => ord.no_orden === datosFactCoti.value.numero);
        const datosCliente = allClientes.value.find(cl => cl.codigo === datosOrden?.cod_cliente);
        const datosEmpresa1 = JSON.stringify(enviarDatosLocalStorage());
        const envio = await window.electron.ipcRenderer.invoke('ordenPDF', JSON.stringify(datosOrden), JSON.stringify(datosCliente), datosEmpresa1);
    } else {
        router.push({ path: `/factura/${datosFactCoti.value.numero}/ordenes` });
    }
}else{
     const datosCotizacion = await peticionesFetchOffline('getDataByField','cotizacion','no_cotizacion',datosFactCoti.value.numero)
     if (!datosCotizacion) {
       toast.add({ severity: 'error', summary: 'Error', detail: 'No se encontró la cotización para imprimir', life: 3000 })
       return
     }
     const datosCliente = allClientes.value.find(cl => cl.codigo === datosCotizacion?.cod_cliente) || {}
     const datosEmpresaLocal = enviarDatosLocalStorage()

     if (!cotizacionPdfPrintRef.value?.printCotizacion) {
       toast.add({ severity: 'error', summary: 'Error', detail: 'Componente de cotización PDF no disponible', life: 3000 })
       return
     }

     await cotizacionPdfPrintRef.value.printCotizacion({
       cotizacion: datosCotizacion,
       cliente: datosCliente,
       datosEmpresa: datosEmpresaLocal
     })
     visiblePrint.value = false;
    }


}
/************************************************/
//impresionOffline
const fnImpresoraChica = async()=>{

 visiblefatcoti.value = false
 visiblePrint.value = false
    const factura  = datosFactCoti.value.numero;

if (datosFactCoti.value.tipo == 'Factura') {
       const datosFactura = allFacturasFull.value.find(fact=>fact.no_factura === factura)
       if (!datosFactura) {
         toast.add({ severity: 'error', summary: 'Error', detail: 'No se encontró la factura para imprimir', life: 3000 })
         return
       }
       const datosCliente = allClientes.value.find(cl=>cl.codigo === datosFactura.cod_cliente) || {}
       const datosEmpresaLocal = enviarDatosLocalStorage()

       if (window.electron) {
         if (!ticketFacturaPrintRef.value?.printTicket) {
           toast.add({ severity: 'error', summary: 'Error', detail: 'Componente ticket no disponible', life: 3000 })
           return
         }
         await ticketFacturaPrintRef.value.printTicket({
           factura: datosFactura,
           cliente: datosCliente,
           datosEmpresa: datosEmpresaLocal
         })
       } else {
         if (!ticketFacturaPdfRef.value?.generatePdfBlobUrl) {
           toast.add({ severity: 'error', summary: 'Error', detail: 'Componente ticket PDF no disponible', life: 3000 })
           return
         }
         const pdf = await ticketFacturaPdfRef.value.generatePdfBlobUrl({
           factura: datosFactura,
           cliente: datosCliente,
           datosEmpresa: datosEmpresaLocal
         })
         if (!pdf?.url) {
           toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo generar el PDF', life: 3000 })
           return
         }
         const win = window.open(pdf.url, '_blank')
         if (win) win.focus()
         setTimeout(() => pdf.revoke?.(), 10000)
       }

}else if(datosFactCoti.value.tipo == 'Pre-Factura'){
    if(window.electron){
        const datosEmpresaA = JSON.stringify(enviarDatosLocalStorage());
        const datosPreFactura = preFacturasArray.value.find(pf => pf.no_factura === factura);
        const datosCliente = allClientes.value.find(cl => cl.codigo === datosPreFactura?.cod_cliente);
        window.electron.ipcRenderer.invoke('ticketprefactura', JSON.stringify(datosPreFactura), datosEmpresaA);
    }else{
        var impresionpagina = link.value+'/receipt/factura?prefactura='+factura;
        visiblefatcoti.value = false
        Swal.fire({
            html: '<iframe src="' + impresionpagina + '" width="100%" height="600" style="border: none;"></iframe>',
            confirmButtonText: 'Cerrar',
            showCloseButton: true
        });
    }
}else if(datosFactCoti.value.tipo == 'Orden'){
    if(window.electron){
        const datosEmpresaA = JSON.stringify(enviarDatosLocalStorage());
        const datosOrden = ordenesArray.value.find(ord => ord.no_orden === factura);
        const datosCliente = allClientes.value.find(cl => cl.codigo === datosOrden?.cod_cliente);
        window.electron.ipcRenderer.invoke('ticketOrden', JSON.stringify(datosOrden), datosEmpresaA);
    }else{
        var impresionpagina = link.value+'/receipt/factura?orden='+factura;
        visiblefatcoti.value = false
        Swal.fire({
            html: '<iframe src="' + impresionpagina + '" width="100%" height="600" style="border: none;"></iframe>',
            confirmButtonText: 'Cerrar',
            showCloseButton: true
        });
    }
}else if(datosFactCoti.value.tipo == 'Apartado'){
    if(window.electron){
        const datosEmpresaA = JSON.stringify(enviarDatosLocalStorage());
        const datosApartado = apartadosArray.value.find(ap => ap.no_factura === factura);

        // Crear copia limpia
        const datosApartadoLimpio = {
          no_emision: datosApartado.no_emision,
          no_factura: datosApartado.no_factura,
          cod_cliente: datosApartado.cod_cliente,
          nombre_cliente: datosApartado.nombre_cliente,
          cedula_cliente: datosApartado.cedula_cliente,
          email_cliente: datosApartado.email_cliente,
          direccion_cliente: datosApartado.direccion_cliente,
          productos: datosApartado.productos,
          fecha_emision: datosApartado.fecha_emision,
          hora: datosApartado.hora,
          monto_credito: datosApartado.monto_credito,
          abonado: datosApartado.abonado,
          saldo: datosApartado.saldo,
          estatus: datosApartado.estatus,
          vendedor: datosApartado.vendedor,
          pagos: datosApartado.pagos,
          nota: datosApartado.nota
        };

        window.electron.ipcRenderer.invoke('ticketApartado', JSON.stringify(datosApartadoLimpio), datosEmpresaA);
    }else{
        var impresionpagina = link.value+'/receipt/factura?apartado='+factura;
        visiblefatcoti.value = false
        Swal.fire({
            html: '<iframe src="' + impresionpagina + '" width="100%" height="600" style="border: none;"></iframe>',
            confirmButtonText: 'Cerrar',
            showCloseButton: true
        });
    }
}else{
           const datosCotizacion = allFacturasFull.value.find(fact=>fact.no_cotizacion === factura)
           if (!datosCotizacion) {
             toast.add({ severity: 'error', summary: 'Error', detail: 'No se encontró la cotización para imprimir', life: 3000 })
             return
           }
           const datosCliente = allClientes.value.find(cl=>cl.codigo === datosCotizacion.cod_cliente) || {}
           const datosEmpresaLocal = enviarDatosLocalStorage()

           if (!ticketCotizacionPrintRef.value?.printTicket) {
             toast.add({ severity: 'error', summary: 'Error', detail: 'Componente ticket cotización no disponible', life: 3000 })
             return
           }
           await ticketCotizacionPrintRef.value.printTicket({
             cotizacion: datosCotizacion,
             cliente: datosCliente,
             datosEmpresa: datosEmpresaLocal
           })
           visiblePrint.value = false;

}



}
/************************************************************************/
const fnSeleccionarCapital = () => {
  const cantidad = Number(saldoCREDITO.value);
  const interes = Number(interesCredito.value);
  const cuotas = Number(cuotasCredito.value);
  const principal = Number(cantidad);
  const totalConInteres = principal + (principal * (interes / 100));
  const valorCuota = totalConInteres / cuotas;
  valorCuotasCredito.value = valorCuota.toFixed(2);
  totalCreditoConInteres.value = totalConInteres.toFixed(2);
  fnSeleccionarTiempoCobro()
};
/************************************************************************/
    watch(() => saldoCREDITO.value, fnSeleccionarCapital);
    watch(() => interesCredito.value, fnSeleccionarCapital);
    watch(() => totalCreditoConInteres.value, fnSeleccionarCapital);
    watch(() => cuotasCredito.value, fnSeleccionarCapital);
    watch(() => tiempoCredito.value, fnSeleccionarCapital);
/************************************************************************/
//const tiempoCobro = datoscamposPrestamos.value.tiempo_cobro;
const fnSeleccionarTiempoCobro = () => {
  //const { tiempo_cobro, cuotas, fecha_emision } = datoscamposPrestamos.value;
  const tiempo_cobro = tiempoCredito.value
  const cuotas = cuotasCredito.value
  const fecha_emision = nfecha('fecha')

  const fechas = [];
  const cantidadCuotas = parseInt(cuotas, 10);
  let fechaInicial = new Date(fecha_emision.split("/").reverse().join("-"));

  // Asegurarse de que la primera fecha de pago sea el día siguiente a la fecha de emisión
  fechaInicial.setDate(fechaInicial.getDate() + 1);

  const formatDate = (date) => {
    const day = ("0" + date.getDate()).slice(-2);
    const month = ("0" + (date.getMonth() + 1)).slice(-2);
    const year = date.getFullYear().toString();
    return `${day}/${month}/${year}`;
  };

  const getNextDate = (currentDate, dayOfMonth) => {
    const date = new Date(currentDate);
    if (date.getDate() >= dayOfMonth) {
      date.setMonth(date.getMonth() + 1);
    }
    date.setDate(dayOfMonth);
    return date;
  };

  for (let i = 0; i < cantidadCuotas; i++) {
    let nuevaFecha = new Date(fechaInicial);

    switch (tiempo_cobro) {
      case "DIARIO":
        nuevaFecha.setDate(fechaInicial.getDate() + 1);
        fechaInicial = nuevaFecha;
        break;
      case "SEMANAL":
        nuevaFecha.setDate(fechaInicial.getDate() + 7);
        fechaInicial = nuevaFecha;
        break;
      case "QUINCENAL":
        nuevaFecha.setDate(fechaInicial.getDate() + 15);
        fechaInicial = nuevaFecha;
        break;
      case "MENSUAL":
        nuevaFecha.setMonth(fechaInicial.getMonth() + 1);
        fechaInicial = nuevaFecha;
        break;
      case "ANUAL":
        nuevaFecha.setFullYear(fechaInicial.getFullYear() + 1);
        fechaInicial = nuevaFecha;
        break;
      case "LOS 15":
        nuevaFecha = getNextDate(fechaInicial, 15);
        fechaInicial = new Date(nuevaFecha);
        break;
      case "LOS 30":
        nuevaFecha = getNextDate(fechaInicial, 30);
        fechaInicial = new Date(nuevaFecha);
        break;
      case "LOS 15 Y 30":
        const is15th = i % 2 === 0;
        nuevaFecha = getNextDate(fechaInicial, is15th ? 15 : 30);
        if (!is15th) {
          fechaInicial.setMonth(fechaInicial.getMonth() + 1);
        }
        fechaInicial = new Date(nuevaFecha);
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
        const diaObjetivo = diasSemana[tiempo_cobro];
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

  //datoscamposPrestamos.value.fechas_pago = fechas.join(", ");
  fechasPagocredito.value = fechas.join(", ");
};
/************************************************************/
const fnDatosCredito = async () => {
  visiblefatcoti.value = false;

  const datos = await peticionesFetch(
    `${link.value}${api.value}`,
    `datoscampo/cuentas_cobrar/no_factura/${datosFactCoti.value.numero}`,
    {},
    tokenCifrado.value,
    'GET'
  );

  if (datos) {
    const {
      fecha_emision,
      monto_credito,
      tipocredito,
      interes,
      abonado,
      saldo,
      fecha_vencimiento
    } = datos;

    const pagos = JSON.parse(datos.pagos || '[]');

    const tablaPagos = pagos.length > 0
      ? `
        <table style="width:100%; margin-top: 15px; border-collapse: collapse; font-size: 13px;">
          <thead>
            <tr style="background-color:#f0f0f0;">
              <th style="border: 1px solid #ccc; padding: 5px;">#</th>
              <th style="border: 1px solid #ccc; padding: 5px;">Monto</th>
              <th style="border: 1px solid #ccc; padding: 5px;">Método</th>
              <th style="border: 1px solid #ccc; padding: 5px;">Fecha</th>
              <th style="border: 1px solid #ccc; padding: 5px;">Hora</th>
              <th style="border: 1px solid #ccc; padding: 5px;">Cajero</th>
              <th style="border: 1px solid #ccc; padding: 5px;">Saldo</th>
            </tr>
          </thead>
          <tbody>
            ${pagos.map(p => `
              <tr>
                <td style="border: 1px solid #ccc; padding: 5px; text-align:center;">${p.nopago}</td>
                <td style="border: 1px solid #ccc; padding: 5px;">$${parseFloat(p.cantidad).toFixed(2)}</td>
                <td style="border: 1px solid #ccc; padding: 5px;">${p.metodo}</td>
                <td style="border: 1px solid #ccc; padding: 5px;">${p.fecha}</td>
                <td style="border: 1px solid #ccc; padding: 5px;">${p.hora}</td>
                <td style="border: 1px solid #ccc; padding: 5px;">${p.cajero}</td>
                <td style="border: 1px solid #ccc; padding: 5px;">$${parseFloat(p.saldo).toFixed(2)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `
      : `<p style="margin-top: 15px;"><em>No se han realizado pagos aún.</em></p>`;

    // ✅ IMPORTANTE: guarda el resultado del Swal
    const result = await Swal.fire({
      title: 'Detalle del Crédito',
      html: `
        <div id="contenido-credito">
          <ul style="text-align:left; line-height:1.8; margin-bottom: 10px;">
            <li><strong>Fecha de Emisión:</strong> ${fecha_emision}</li>
            <li><strong>Monto del Crédito:</strong> $${parseFloat(monto_credito).toFixed(2)}</li>
            <li><strong>Tipo de Crédito:</strong> ${tipocredito}</li>
            <li><strong>Interés:</strong> ${parseFloat(interes).toFixed(2)}%</li>
            <li><strong>Total Abonado:</strong> $${parseFloat(abonado).toFixed(2)}</li>
            <li><strong>Saldo Pendiente:</strong> $${parseFloat(saldo).toFixed(2)}</li>
            <li><strong>Fecha de Vencimiento:</strong> ${fecha_vencimiento}</li>
          </ul>
          <hr style="margin: 10px 0;" />
          <h4 style="text-align:left; font-weight:bold; margin-bottom:5px;">Pagos Realizados:</h4>
          ${tablaPagos}
        </div>
      `,
      confirmButtonText: 'Cerrar',
      showDenyButton: true,
      denyButtonText: 'Imprimir',
      confirmButtonColor: '#0ea5e9',
      denyButtonColor: '#4b5563',
      width: 750
    });

    // ✅ Callback para el botón Imprimir
    if (result.isDenied) {
      fnImprimircredito(datos);
    }
  }
};

/************************************************************/
const fnVerCredito = async()=>{
    visiblefatcoti.value = false
/*  const datos = await peticionesFetch(
    `${link.value}${api.value}`,
    `datoscampo/cuentas_cobrar/no_factura/${datosFactCoti.value.numero}`,
    {},
    tokenCifrado.value,
    'GET'
  );*/
  const datos = await peticionesFetchOffline('getDataByField', 'cuentas_cobrar','no_factura',datosFactCoti.value.numero);

  if(datos){
     router.push({ path: `/editarcuentas_cobrar/${datos.id}` });
  }
}
/************************************************************/
const fnAbonarCredito = async () => {
  // Obtener datos del crédito
  visiblefatcoti.value = false
/*  const datos = await peticionesFetch(
    `${link.value}${api.value}`,
    `datoscampo/cuentas_cobrar/no_factura/${datosFactCoti.value.numero}`,
    {},
    tokenCifrado.value,
    'GET'
  );*/
const datos = await peticionesFetchOffline('getDataByField', 'cuentas_cobrar','no_factura',datosFactCoti.value.numero);

  const saldo = parseFloat(datos?.saldo || 0);

  const { value: formValues } = await Swal.fire({
    title: 'Abonar a Crédito',
    html: `
<div>
  <label for="swal-input-monto">Monto del Abono</label>
  <input 
    id="swal-input-monto" 
    type="number" 
    min="1" 
    class="swal2-input " 
    value="${saldo}" 
    placeholder="Ingrese el monto" 
  />

  <label for="swal-input-metodo" style="margin-top: 1rem; display: block;">Método de Pago</label>
  <select id="swal-input-metodo" class="swal2-input ">
    <option value="EFECTIVO">EFECTIVO</option>
    <option value="TRANSFERENCIA">TRANSFERENCIA</option>
    <option value="TARJETA">TARJETA</option>
  </select>
</div>

    `,
    focusConfirm: false,
    confirmButtonText: 'Guardar Abono',
    confirmButtonColor: '#10b981',
    showCancelButton: true,
    cancelButtonText: 'Cancelar',
    cancelButtonColor: '#ef4444',
    preConfirm: () => {
      const monto = parseFloat(document.getElementById('swal-input-monto').value);
      const metodo = document.getElementById('swal-input-metodo').value;

      if (!monto || monto <= 0) {
        Swal.showValidationMessage('Debes ingresar un monto válido');
        return false;
      }

      return { monto, metodo };
    }
  });

  if (formValues) {
   
    let totalAbonado = formValues.monto;

        if (totalAbonado <= 0) return; 
        let factura = datos;
        const pagosArray = JSON.parse(factura.pagos) || [];
        const saldoFactura = Number(factura.saldo);

        let abonoActual = Math.min(totalAbonado, saldoFactura); // Abonar lo máximo posible sin exceder el saldo
        let saldoN = (saldoFactura - abonoActual).toFixed(2);

        var estado = 'PENDIENTE';
        if (saldoN <= 0) {
            estado = 'SALDADO';
        }

        const numeroPago = pagosArray.length + 1;
        const npago = {
            "nopago": numeroPago,
            "cantidad": formValues.monto.toFixed(2),
            "metodo": formValues.metodo,
            "fecha": nfecha('fecha'),
            "timestamp": nfecha('timestamp'),
            "hora": nfecha('hora'),
            "turno": datosEmpresa.usuario.nombre,
            "cajero": datosEmpresa.usuario.nombre,
            "saldo": saldoN
        };

        pagosArray.push(npago);

        const sumaAbono = pagosArray
            .map(abono => Number(abono.cantidad))
            .reduce((acc, curr) => acc + curr, 0)
            .toFixed(2);

        factura.pagos = JSON.stringify(pagosArray);
        factura.estatus = estado;
        factura.abonado = sumaAbono;
        factura.saldo = saldoN;
        factura.updated_at = nfecha('timestamp');

        // Actualizar la factura en la base de datos
/*        const peticion = await peticionesFetch(
            `${link.value}${api.value}`,
            `actualizarcampos/cuentas_cobrar`,
            factura,
            tokenCifrado.value,
            'POST'
        );*/
        const peticion = await peticionesFetchOffline('updateData','cuentas_cobrar', JSON.stringify(factura));

        totalAbonado -= abonoActual; // Restar el abono actual del total
    

    if (totalAbonado > 0) {
        toast.add({ severity: 'warn', summary: 'Aviso', detail: `Quedó un sobrante de ${totalAbonado.toFixed(2)}`, life: 3000 });
    }
    Swal.close();
     visiblefatcoti.value = true
        const datosEmpresa1 = JSON.stringify(enviarDatosLocalStorage() )
        window.electron.ipcRenderer.invoke('facturaCredito',factura.no_emision,datosEmpresa1);


  }
};
/****************************************************************/
const fnCancelarCredito = async()=>{
/*   const datos = await peticionesFetch(`${link.value}${api.value}`,`datoscampo/cuentas_cobrar/no_factura/${datosFactCoti.value.numero}`,{},tokenCifrado.value,'GET');*/
   const datos = await peticionesFetchOffline('getDataByField', 'cuentas_cobrar','no_factura',datosFactCoti.value.numero);

}
/****************************************************************/
const fnImprimircredito = async (datosE = null) => {
  let datos;
  let factura;

  // Si es un evento, ignorar y hacer el fetch
  if (datosE && datosE instanceof Event) {
    datosE = null;
  }

  // Si se pasa como parámetro, lo usa. Si no, lo busca.
  if (datosE) {
    datos = datosE;
  } else {
/*    datos = await peticionesFetch(
      `${link.value}${api.value}`,
      `datoscampo/cuentas_cobrar/no_factura/${datosFactCoti.value.numero}`,
      {},
      tokenCifrado.value,
      'GET'
    );*/
    datos = await peticionesFetchOffline('getDataByField', 'cuentas_cobrar','no_factura',datosFactCoti.value.numero);
    factura = await peticionesFetchOffline('getDataByField', 'facturas','no_factura',datosFactCoti.value.numero);
  }

  // Validación simple por si no hay datos
  if (!datos || !datos.no_emision) {
    console.warn('No se encontró la factura o está incompleta.');
    return;
  }

  const datosEmpresa1 = JSON.stringify(enviarDatosLocalStorage());

  // Envío a proceso de impresión vía Electron

  window.electron.ipcRenderer.invoke('facturaCredito', JSON.stringify(datos),JSON.stringify(factura), datosEmpresa1);

  // Mostrar nuevamente el modal si aplica
  visiblefatcoti.value = true;
};


/************************************************************/

/************************************************************/
// FUNCIONES ASISTENTE IA - CHATGPT
/************************************************************/
const scrollToBottomChat = () => {
  nextTick(() => {
    if (chatContainerRef.value) {
      chatContainerRef.value.scrollTop = chatContainerRef.value.scrollHeight;
    }
  });
};

const enviarMensajeIA = async () => {
  if (!mensajeUsuarioIA.value.trim() || cargandoIA.value) return;

  const pregunta = mensajeUsuarioIA.value.trim();
  mensajesIA.value.push({ rol: 'user', contenido: pregunta });
  mensajeUsuarioIA.value = '';
  cargandoIA.value = true;
  scrollToBottomChat();

  try {
    // Obtener API Key de configuración
    const apiKey = OPENAI_API_KEY.value || datosConfiguracion.value.openai_api_key || '';

    if (!apiKey) {
      mensajesIA.value.push({
        rol: 'assistant',
        contenido: 'No se ha configurado la API Key de OpenAI. Por favor, configúrala en los ajustes del sistema.'
      });
      cargandoIA.value = false;
      scrollToBottomChat();
      return;
    }

    // Construir contexto con inventario de medicamentos
    const inventarioResumen = productosArray.value.slice(0, 50).map(p =>
      `- ${p.nombre || p.nombre}: ${p.principio_activo || 'N/A'} (Stock: ${p.stock || p.stock || 0})`
    ).join('\n');

    const mensajesParaAPI = [
      {
        role: 'system',
        content: `Eres un asistente experto en teléfonos celulares y tecnología móvil. Ayudas a los usuarios a:
1. Comparar especificaciones técnicas entre diferentes modelos de celulares.
2. Recomendar celulares según las necesidades del cliente (fotografía, gaming, batería, precio).
3. Explicar características técnicas de forma sencilla (procesadores, RAM, cámaras, pantallas).
4. Informar sobre las últimas tendencias y lanzamientos en el mercado de smartphones.
5. Asesorar sobre accesorios compatibles y complementarios.

IMPORTANTE:
- Sé objetivo al comparar marcas, menciona pros y contras de cada una.
- Considera el presupuesto del cliente al hacer recomendaciones.
- Sé conciso y claro en tus respuestas.
- Si preguntan por un modelo específico, menciona sus especificaciones principales.
- Ayuda a identificar el mejor celular según el uso: trabajo, entretenimiento, fotografía, etc.

Inventario disponible en la tienda (parcial):
${inventarioResumen}

Responde en español y de forma amigable.`
      },
      ...mensajesIA.value.map(m => ({
        role: m.rol === 'user' ? 'user' : 'assistant',
        content: m.contenido
      }))
    ];

    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-3.5-turbo',
        messages: mensajesParaAPI,
        max_tokens: 500,
        temperature: 0.7
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const respuestaIA = response.data.choices[0].message.content;
    mensajesIA.value.push({ rol: 'assistant', contenido: respuestaIA });

  } catch (error) {
    console.error('Error al consultar ChatGPT:', error);
    let mensajeError = 'Error al consultar el asistente IA.';

    if (error.response?.status === 401) {
      mensajeError = 'API Key inválida. Por favor, verifica tu configuración de OpenAI.';
    } else if (error.response?.status === 429) {
      mensajeError = 'Límite de consultas excedido. Intenta de nuevo en unos minutos.';
    } else if (error.response?.data?.error?.message) {
      mensajeError = error.response.data.error.message;
    }

    mensajesIA.value.push({ rol: 'assistant', contenido: mensajeError });
  }

  cargandoIA.value = false;
  scrollToBottomChat();
};

const preguntaRapidaIA = (pregunta) => {
  mensajeUsuarioIA.value = pregunta;
  enviarMensajeIA();
};

const limpiarChatIA = () => {
  mensajesIA.value = [];
  resultadosBusquedaIA.value = [];
  buscarPrincipioActivoIA.value = '';
};

const buscarMedicamentosPorPrincipioActivo = () => {
  const busqueda = buscarPrincipioActivoIA.value.trim().toLowerCase();
  if (!busqueda) {
    resultadosBusquedaIA.value = [];
    busquedaPrincipioRealizada.value = false;
    return;
  }

  resultadosBusquedaIA.value = productosArray.value.filter(producto => {
    const principioActivo = (producto.principio_activo || '').toLowerCase();
    const nombreComercial = (producto.nombre || producto.nombre || '').toLowerCase();
    const nombreGenerico = (producto.nombre_generico || '').toLowerCase();

    return principioActivo.includes(busqueda) ||
           nombreComercial.includes(busqueda) ||
           nombreGenerico.includes(busqueda);
  }).slice(0, 20); // Limitar a 20 resultados

  busquedaPrincipioRealizada.value = true;

  if (resultadosBusquedaIA.value.length === 0) {
    toast.add({
      severity: 'info',
      summary: 'Sin resultados',
      detail: `No se encontraron medicamentos con "${buscarPrincipioActivoIA.value}"`,
      life: 3000
    });
  }
};

const agregarProductoDesdeIA = (producto) => {
  handleSelectCompleteproductoprincipal(producto.codigo);
  toast.add({
    severity: 'success',
    summary: 'Producto agregado',
    detail: `${producto.nombre || producto.nombre} añadido al carrito`,
    life: 3000
  });
};

/************************************************************/
// FUNCIONES PARA BUSCAR EQUIVALENTES
/************************************************************/

const buscarSugerenciasMedicamentos = (event) => {
  const query = event.query.toLowerCase();
  sugerenciasMedicamentos.value = productosArray.value.filter(producto => {
    const nombreComercial = (producto.nombre || producto.nombre || '').toLowerCase();
    const nombreGenerico = (producto.nombre_generico || '').toLowerCase();
    const principioActivo = (producto.principio_activo || '').toLowerCase();
    const codigoInterno = (producto.codigo || '').toLowerCase();

    return nombreComercial.includes(query) ||
           nombreGenerico.includes(query) ||
           principioActivo.includes(query) ||
           codigoInterno.includes(query);
  }).slice(0, 15);
};

const seleccionarMedicamentoEquivalente = (event) => {
  medicamentoSeleccionadoIA.value = event.value;
  equivalentesEnStock.value = [];
  respuestaEquivalentesIA.value = '';
  busquedaEquivalentesRealizada.value = false;
};

const buscarEquivalentesEnStock = () => {
  if (!medicamentoSeleccionadoIA.value) return;

  const marca = (medicamentoSeleccionadoIA.value.marca || '').toLowerCase().trim();
  const categoria = (medicamentoSeleccionadoIA.value.categoria || '').toLowerCase().trim();
  const precioVenta = parseFloat(medicamentoSeleccionadoIA.value.precio_venta) || 0;
  const rangoPrecios = precioVenta * 0.3; // 30% de rango de precio

  // Buscar celulares similares (misma categoría o marca, rango de precio similar)
  equivalentesEnStock.value = productosArray.value.filter(producto => {
    const prodMarca = (producto.marca || '').toLowerCase().trim();
    const prodCategoria = (producto.categoria || '').toLowerCase().trim();
    const prodPrecio = parseFloat(producto.precio_venta) || 0;
    const esElMismo = producto.codigo === medicamentoSeleccionadoIA.value.codigo;

    // Coincidir por marca o categoría
    const coincideMarca = marca && prodMarca === marca;
    const coincideCategoria = categoria && prodCategoria === categoria;

    // Rango de precio similar (+-30%)
    const precioEnRango = prodPrecio >= (precioVenta - rangoPrecios) && prodPrecio <= (precioVenta + rangoPrecios);

    return !esElMismo && (coincideMarca || coincideCategoria || precioEnRango) && (producto.stock > 0);
  }).sort((a, b) => {
    // Ordenar por precio (más barato primero)
    return (a.precio_venta || 0) - (b.precio_venta || 0);
  }).slice(0, 15);

  busquedaEquivalentesRealizada.value = true;

  if (equivalentesEnStock.value.length > 0) {
    toast.add({
      severity: 'success',
      summary: 'Alternativas encontradas',
      detail: `Se encontraron ${equivalentesEnStock.value.length} alternativas en stock`,
      life: 3000
    });
  }
};

const consultarEquivalentesConIA = async () => {
  if (!medicamentoSeleccionadoIA.value) return;

  cargandoEquivalentesIA.value = true;
  respuestaEquivalentesIA.value = '';

  try {
    const apiKey = OPENAI_API_KEY.value || datosConfiguracion.value?.openai_api_key || '';

    if (!apiKey) {
      respuestaEquivalentesIA.value = 'No se ha configurado la API Key de OpenAI. Por favor, configúrala en los ajustes del sistema.';
      cargandoEquivalentesIA.value = false;
      return;
    }

    const celular = medicamentoSeleccionadoIA.value;

    // Construir lista de alternativas que tenemos en inventario
    const inventarioAlternativas = equivalentesEnStock.value.map(p =>
      `- ${p.nombre}: ${p.marca} (${p.categoria}) - $${p.precio_venta}`
    ).join('\n');

    const prompt = `El cliente busca alternativas o comparaciones para el celular:
- Modelo: ${celular.nombre}
- Marca: ${celular.marca || 'No especificado'}
- Categoría: ${celular.categoria || 'No especificada'}
- Precio: $${celular.precio_venta || 'No especificado'}

${inventarioAlternativas ? `Ya tenemos estas alternativas en stock:\n${inventarioAlternativas}\n\n` : ''}

Por favor proporciona:
1. Comparación con otros modelos similares en rango de precio.
2. Ventajas y desventajas de este modelo vs alternativas.
3. Para qué tipo de usuario es más recomendado (gaming, fotografía, trabajo, uso básico).
4. Si hay algún modelo más reciente o mejor opción disponible.

Responde de forma concisa y práctica para un vendedor de celulares.`;

    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'Eres un asistente experto en teléfonos celulares. Ayudas a comparar modelos y encontrar alternativas según las necesidades del cliente. Sé objetivo, menciona pros y contras, y considera el presupuesto del cliente.'
          },
          { role: 'user', content: prompt }
        ],
        max_tokens: 600,
        temperature: 0.7
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      }
    );

    respuestaEquivalentesIA.value = response.data.choices[0].message.content;

  } catch (error) {
    console.error('Error al consultar equivalentes con IA:', error);

    if (error.response?.status === 401) {
      respuestaEquivalentesIA.value = 'API Key inválida. Por favor, verifica tu configuración de OpenAI.';
    } else if (error.response?.status === 429) {
      respuestaEquivalentesIA.value = 'Límite de consultas excedido. Intenta de nuevo en unos minutos.';
    } else {
      respuestaEquivalentesIA.value = 'Error al consultar el asistente IA. Verifica tu conexión a internet.';
    }
  }

  cargandoEquivalentesIA.value = false;
};

/************************************************************/

</script>

<style scoped>

.pos-loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 200px;
  width: 100%;
  gap: 1rem;
  grid-column: 1 / -1;
}

.pos-loading-text {
  font-size: 1.1rem;
  color: var(--text-color-secondary, #6c757d);
}

.pos-product-image-container {
  width: 100%;
  height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border-radius: 8px;
  background: var(--surface-100, #f8f9fa);
  margin-bottom: 0.5rem;
}

.pos-product-image {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.efectivo {
  color: #155724 !important;            /* verde oscuro para el texto */
}

.tarjeta {
  color: #0c5460 !important;            /* azul oscuro para el texto */
}

.transferencia {
  color: #856404 !important;            /* amarillo oscuro para el texto */
}



.btnaccion {
  min-height: 70px;
}

a, u {
  text-decoration: none;
}

#totalfactura {
  font-size: 2.5rem;
  font-weight: bold;
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  width: 100%; /* Asegura que el div use todo el ancho del contenedor */
  display: flex;
  justify-content: center;
  align-items: center;
}
.productoAgregado {
  position: relative;
}

.botones-flotantes {
  position: absolute;
  top: 50%;
  right: 10px;
  transform: translateY(-50%);
  display: flex;
  gap: 10px;
  z-index: 10;
  visibility: hidden; /* Ocultar por defecto */
}

.productoAgregado:hover .botones-flotantes {
  visibility: visible; /* Mostrar al hacer hover */
}

.fixed-to-row {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  z-index: 10;
  max-width: calc(100vw - 2rem); /* No exceder el ancho de la pantalla */
}

/* Ajuste para pantallas pequeñas */
@media (max-width: 768px) {
  .fixed-to-row {
    max-width: 200px; /* Ancho reducido en móviles */
    right: 0.25rem;
  }
}

/* Scroll personalizado para los botones de admin */
.fixed-to-row .overflow-y-auto::-webkit-scrollbar {
  width: 4px;
}

.fixed-to-row .overflow-y-auto::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.05);
  border-radius: 4px;
}

.fixed-to-row .overflow-y-auto::-webkit-scrollbar-thumb {
  background: rgba(99, 102, 241, 0.5);
  border-radius: 4px;
}

.fixed-to-row .overflow-y-auto::-webkit-scrollbar-thumb:hover {
  background: rgba(99, 102, 241, 0.7);
}

.boton-editar, .boton-borrar, .boton-ver {
  background-color: #ffffff;
  border: 1px solid #ddd;
  border-radius: 50%;
  width: 32px;
  height: 32px;
  display: flex;
  justify-content: center;
  align-items: center;
  box-shadow: 0px 2px 4px rgba(0, 0, 0, 0.1);
  cursor: pointer;
}

.boton-editar i, .boton-borrar i, .boton-ver i {
  font-size: 16px;
  color: #333;
}

.boton-editar:hover {
  background-color: #f0f0f0;
}

.boton-borrar:hover {
  background-color: #f8d7da;
}

.btn-seleccionado {
  background-color: #0d9488;
  color: white;
}

.active-button {
  background-color: black;
  color: white;
}

.columna {
padding-top: 0 !important;
padding-bottom: 0 !important;
}

.grid-container {
 display: flex;
  flex-wrap: wrap;
}
.grid-item {
  width: 100%;
  margin-bottom: 10px;
}
.button-container {
  display: flex;
  justify-content: space-between;
  width: 100%;
}


.full-width-button {
  flex: 1;
}

.mr-2 {
  margin-right: 10px;
}
        .floating-div {
            position: fixed;
            bottom: 0;
            left: 0;
            width: 100%;
            background-color: white;
            box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);
            padding: 10px;
            z-index: 998;
            overflow-y: auto;
            max-height: 50vh; /* Adjust this value as needed */
        }



.card-empty {
  background-color: #d4edda; /* Verde bajito */
}

.card-filled {
  background-color: #f8d7da; /* Rojo bajito */
}

.category-scroll-container {
  display: flex;
  overflow-x: auto;
  white-space: nowrap;
  padding: 10px;
  scrollbar-width: thin;
  scrollbar-color: #0d9488 #f1f1f1; /* Verde de Vue.js */
}

.category-item {
  display: inline-block;
  margin-right: 10px;
  white-space: normal;
  flex-shrink: 0;
}

.category-scroll-container::-webkit-scrollbar {
  height: 8px;
}

.category-scroll-container::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 10px;
}

.category-scroll-container::-webkit-scrollbar-thumb {
  background: #0d9488; /* Verde de Vue.js */
  border-radius: 10px;
}

.category-scroll-container::-webkit-scrollbar-thumb:hover {
  background: #0f766e;
}

/* Estilos para el contenedor de productos */
.product-scroll-container {
  max-height: 70vh;
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: #0d9488 #f1f1f1;
}

.custom-card {
  display: flex;
  flex-direction: column;
  height: 100%;
  justify-content: space-between;
}

.custom-image {
  width: 100%;
  height: 100px;
  object-fit: cover;
}

.texto-nombre-producto{
  font-size: 0.8rem;
}
.texto-precio-producto{
  font-size: 1.2rem;
  font-weight: bold;
}

.p-card .p-card-body {
     gap: 0rem !important;
}

.search-container {
  padding: 10px;
  text-align: center;
}
.search-input {
  width: 100%;
  padding: 10px;
  font-size: 16px;
  border: 2px solid #0d9488; /* Verde de Vue.js */
  border-radius: 4px;
}


.tab {
  background-color: #0d9488;
  color: white;
  text-align: center;
  padding: 10px;
  cursor: pointer;
  font-weight: bold;
}

.contentL {
  /*padding: 20px;*/
}

.fixed-div {
  position: fixed;
  /*background-color: #fff;*/
  bottom: 0;
  width: 100%;
  box-shadow: 0 -2px 5px rgba(0, 0, 0, 0.2);
  left: 0;
  width: 100%;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);
  /*padding: 10px;*/
 /* z-index: 998;*/

}

.bordeado {
  position: fixed;
  bottom: 0;
  right:0;
  border: 1px solid var(--primary-color);
  border-radius:10px;
  margin-bottom: 10px;
  padding-top: 0px;
  padding-bottom: 0px;
  color:white;
  background-color: var(--primary-color);
 z-index: 1002;
}

@media screen and (max-width: 960px) {
    .bordeado {
        right: 50%;
        transform: translateX(50%);
        bottom: 60px; /* A 30px del fondo */
    }
}

.tab-hidden {
  position: fixed;
  bottom: 0;
  right: 10px;
  background-color: var(--surface-a);
  color: white;
  padding: 10px;
  cursor: pointer;
  border-radius: 5px 5px 0 0;
}

.button-group {
  display: flex;
  justify-content: flex-end;
}

.dock-fijo {
    position: fixed !important;
    bottom: 0;
    left: 0;
    width: 100%;
    z-index: 1001; 
}

.dock-top {
  position: fixed !important;
  top: 0;
  left: 0;
  width: 100%;
  z-index: 1001;
}

.dock-right {
  position: fixed !important;
  top: 0;
  right: 0;
  height: 100%;
  z-index: 1001;
}

:deep(.p-dock-list-container) {
  background-color: #fff !important; 
  border: 2px solid var(--primary-color-dark);
  padding: 10px;
  border-radius: 10px;
  box-shadow: 0px 4px 6px rgba(0, 0, 0, 0.2);
}

:deep(.p-dock-item) {
  transition: transform 0.2s ease-in-out;
}

:deep(.p-dock-item:hover) {
  transform: scale(1.3);
}



    .action-buttons {
      opacity: 0;
      transition: opacity 150ms ease-in-out;
      pointer-events: none;
    }

    .productoAgregado:hover .action-buttons {
      opacity: 1;
      pointer-events: auto;
    }

    :deep(.action-buttons .p-button) {
      color: var(--text-color);
      background-color: var(--surface-card);
      border: 1px solid var(--surface-border);
    }

:deep(.action-buttons .p-button .p-button-icon) {
  color: inherit;
}

.pos-background {
  background: #f4f6f9;
}

.pos-shell {
  padding: 1rem;
}

.pos-header {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 1rem;
  background: #ffffff;
  border-radius: 12px;
  padding: 0.85rem 1rem;
  box-shadow: 0 6px 18px rgba(15, 23, 42, 0.08);
}

.pos-header-rows {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.pos-header-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
}

.pos-title {
  font-size: 1.1rem;
  font-weight: 700;
  color: #0f172a;
}

.pos-subtitle {
  font-size: 0.85rem;
  color: #6b7280;
}

.pos-tabs {
  display: flex;
  gap: 0.5rem;
  flex-wrap: nowrap;
}

.pos-tabs-scrollable {
  overflow-x: auto;
  max-width: 100%;
  padding-bottom: 0.5rem;
  scrollbar-width: thin;
  scrollbar-color: #cbd5e1 transparent;
}

.pos-tabs-scrollable::-webkit-scrollbar {
  height: 6px;
}

.pos-tabs-scrollable::-webkit-scrollbar-track {
  background: transparent;
}

.pos-tabs-scrollable::-webkit-scrollbar-thumb {
  background-color: #cbd5e1;
  border-radius: 3px;
}

.pos-tabs-scrollable .pos-tab {
  white-space: nowrap;
  flex-shrink: 0;
}

.pos-header-actions {
  display: flex;
  gap: 0.5rem;
  flex-wrap: nowrap;
  justify-content: flex-start;
  width: 100%;
}

.pos-header-actions-scrollable,
.pos-tabs-scrollable {
  width: 100%;
}

@media (max-width: 1279px) {
  .pos-header-top {
    flex-wrap: wrap;
  }
}

.pos-tab {
  border-radius: 10px;
  font-weight: 600;
  background: #e2e8f0;
  color: #1f2937;
}

.pos-tab-active {
  background: #0f172a;
  color: #ffffff;
}

.pos-search {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
  background: #ffffff;
  border-radius: 12px;
  padding: 0.75rem;
  box-shadow: 0 6px 18px rgba(15, 23, 42, 0.06);
}

.pos-search-field {
  display: flex;
  align-items: center;
  width: 100%;
}

.pos-search-field-full {
  width: 100%;
}

.pos-search-action {
  display: flex;
  align-items: center;
}

.pos-scroll-top {
  position: fixed;
  right: 3rem;
  bottom: 14.25rem;
  width: 44px;
  height: 44px;
  border-radius: 999px;
  border: none;
  background: #0f172a;
  color: #ffffff;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 12px 24px rgba(15, 23, 42, 0.18);
  cursor: pointer;
  z-index: 1000;
}

@media (max-width: 1023px) {
  .pos-scroll-top {
    display: none;
  }
}

.pos-product-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 0.4rem;
}

.pos-product-card {
  --card-bg: linear-gradient(145deg, #e8fbf4 0%, #d8f5ff 100%);
  --card-border: #78d9c4;
  --card-shadow: 0 8px 16px rgba(15, 118, 110, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.8);
  background: var(--card-bg);
  border-radius: 8px;
  padding: 0.4rem 0.5rem;
  text-align: left;
  transition: transform 140ms ease, box-shadow 140ms ease;
  border: 1px solid var(--card-border);
  box-shadow: var(--card-shadow);
  position: relative;
  transform: translateZ(0);
}

.pos-product-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 20px rgba(15, 118, 110, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.85);
}

.pos-product-card--ok {
  --card-bg: linear-gradient(145deg, #e8fbf4 0%, #d6fff6 100%);
  --card-border: #6ee7b7;
  --card-shadow: 0 14px 26px rgba(16, 185, 129, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.8);
}

.pos-product-card--low {
  --card-bg: linear-gradient(145deg, #fff7e8 0%, #ffe7c6 100%);
  --card-border: #f59e0b;
  --card-shadow: 0 14px 26px rgba(245, 158, 11, 0.22), inset 0 1px 0 rgba(255, 255, 255, 0.8);
}

.pos-product-card--out {
  --card-bg: linear-gradient(145deg, #fff1f2 0%, #ffe4e6 100%);
  --card-border: #fb7185;
  --card-shadow: 0 14px 26px rgba(244, 63, 94, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.8);
}

.pos-product-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 0.65rem;
  color: #1f2937;
  margin-bottom: 0.15rem;
}

.pos-product-code {
  font-weight: 700;
}

.pos-product-name {
  font-weight: 700;
  font-size: 0.72rem;
  color: #0f172a;
  margin-bottom: 0.15rem;
}

.pos-product-meta {
  font-size: 0.7rem;
  color: #475569;
}

.pos-product-footer {
  display: flex;
  justify-content: space-between;
  font-weight: 700;
  font-size: 0.78rem;
  margin-top: 0.45rem;
  color: #0f172a;
}

.pos-product-stock {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0.15rem 0.35rem;
  border-radius: 999px;
  font-size: 0.68rem;
  border: 1px solid transparent;
  background: rgba(255, 255, 255, 0.7);
}

.pos-product-stock--ok {
  color: #0f766e;
  border-color: #6ee7b7;
}

.pos-product-stock--low {
  color: #b45309;
  border-color: #f59e0b;
}

.pos-product-stock--out {
  color: #be123c;
  border-color: #fb7185;
}

.pos-product-price {
  font-size: 0.78rem;
}

.pos-aside {
  position: sticky;
  top: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding-bottom: 7.5rem;
}

.pos-panel {
  background: #ffffff;
  border-radius: 12px;
  padding: 0.75rem;
  box-shadow: 0 6px 18px rgba(15, 23, 42, 0.06);
}

.pos-panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-weight: 600;
  color: #0f172a;
  margin-bottom: 0.5rem;
}

.pos-panel-header-actions {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
}

.pos-panel-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.85rem;
  color: #1f2937;
  margin-bottom: 0.4rem;
}

.pos-panel-row-inline {
  flex-wrap: wrap;
  gap: 0.75rem;
}

.pos-panel-row-tight {
  margin-top: 0.6rem;
}

.pos-checkbox {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
}

.pos-actions {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.pos-cart {
  background: #ffffff;
  border-radius: 12px;
  padding: 1rem;
  box-shadow: 0 6px 18px rgba(15, 23, 42, 0.06);
  min-height: 140px;
}

.pos-cart-flex {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.pos-cart-desktop {
  display: flex;
  flex-direction: column;
  flex: 1;
}

.pos-cart-bubble-wrapper {
  position: fixed;
  right: 3rem;
  bottom: 14.25rem;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.6rem;
  z-index: 20;
}

.pos-cart-bubble-wrapper {
  display: none;
}

.pos-cart-bubble {
  width: 56px;
  height: 56px;
  border-radius: 999px;
  background: #0f172a;
  color: #ffffff;
  border: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 12px 24px rgba(15, 23, 42, 0.2);
  cursor: pointer;
  position: relative;
}

.pos-cart-bubble i {
  font-size: 1.4rem;
}

.pos-cart-bubble-count {
  position: absolute;
  top: -6px;
  right: -6px;
  min-width: 22px;
  height: 22px;
  padding: 0 6px;
  border-radius: 999px;
  background: #ef4444;
  color: #ffffff;
  font-size: 0.72rem;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 6px 12px rgba(15, 23, 42, 0.2);
}

.pos-cart-flyout {
  width: min(92vw, 360px);
  max-height: 70vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.pos-cart-flyout .pos-cart-list {
  flex: 1;
  max-height: calc(70vh - 120px);
  overflow-y: auto;
}

.pos-cart-flyout-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-weight: 700;
  color: #0f172a;
  margin-bottom: 0.5rem;
}

.pos-cart-empty-flyout {
  flex-direction: column;
  gap: 0.4rem;
}

.pos-cart-empty-text {
  font-size: 0.85rem;
  color: #64748b;
}

@media (max-width: 1279px) {
  .pos-cart-desktop {
    display: none;
  }

  .pos-cart-bubble-wrapper {
    display: flex;
    bottom: 22rem;
  }

  .pos-cart-flyout {
    position: fixed;
    bottom: auto;
    top: 80px;
    right: 1rem;
    max-height: calc(100vh - 180px);
  }

  .pos-aside-footer {
    bottom: 4.5rem;
    margin-bottom: 2.75rem;
  }

  
}

@media (max-width: 767px) {
  .invoice-drawer {
    grid-template-columns: 1fr;
  }

  .invoice-drawer .form-group,
  .invoice-drawer .col-span-1,
  .invoice-drawer .col-span-2 {
    grid-column: 1 / -1;
  }

.invoice-drawer-switches {
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem 1.25rem;
    align-items: center;
  }

  .invoice-drawer-amount {
    padding: 0.75rem;
    font-size: 1.5rem;
  }
}

.pos-cart-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2.5rem;
  color: #94a3b8;
}

.pos-cart-list {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  min-height: 100px;
  flex: 1;
  overflow-y: auto;
}

/* En desktop, permitir que el carrito crezca segun contenido */
@media (min-width: 1280px) {
  .pos-cart-desktop .pos-cart-list {
    min-height: auto;
    max-height: none;
    flex: 1 1 auto;
  }

  .pos-cart-desktop {
    min-height: 200px;
    max-height: calc(100vh - 300px);
    overflow: hidden;
  }
}

.pos-cart-item {
  display: flex;
  flex-direction: column;
  gap: 0.05rem;
  border-bottom: 1px solid #e5e7eb;
  padding-bottom: 0.2rem;
  padding-top: 0.2rem;
}

.pos-cart-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
}

.pos-cart-controls {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  margin-top: 0.1rem;
}

.pos-cart-btn {
  border-radius: 999px;
  width: 28px;
  height: 28px;
  padding: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: none;
  font-size: 0.75rem;
}

.pos-cart-btn .pi {
  font-size: 0.7rem;
}

.pos-cart-btn-primary {
  background: #0f172a;
  color: #ffffff;
}

.pos-cart-btn-danger {
  background: #ef4444;
  color: #ffffff;
}

.pos-cart-qty {
  min-width: 28px;
  text-align: center;
  font-weight: 600;
  color: #0f172a;
  font-size: 0.8rem;
}

.pos-cart-price {
  margin-left: auto;
  font-weight: 600;
  color: #0f172a;
  font-size: 0.8rem;
}

.pos-cart-name {
  font-weight: 600;
  color: #111827;
  font-size: 0.8rem;
  line-height: 1.2;
}

.pos-cart-meta {
  font-size: 0.8rem;
  color: #6b7280;
}

.pos-cart-total {
  font-weight: 700;
  color: #0f172a;
}

.pos-total {
  display: flex;
  flex-direction: column;
  background: #ffffff;
  border-radius: 12px;
  padding: 0.9rem 1rem;
  box-shadow: 0 6px 18px rgba(15, 23, 42, 0.06);
  font-weight: 700;
  color: #0f172a;
}

.pos-total-breakdown {
  display: flex;
  flex-direction: column;
  font-size: 0.78rem;
  font-weight: 600;
  color: #475569;
  margin-top: 0.25rem;
  gap: 0.15rem;
}

.pos-total-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.pos-total-row-strong {
  font-size: 1.05rem;
  font-weight: 700;
  margin-top: 0.35rem;
}

.pos-clear {
  background: transparent;
  border: none;
  color: #ef4444;
  font-weight: 600;
  font-size: 0.8rem;
  padding: 0;
  cursor: pointer;
  text-align: left;
}

.pos-footer-actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.6rem;
}

.pos-aside-footer {
  position: fixed;
  right: 3rem;
  bottom: 1rem;
  width: min(100%, 340px);
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  z-index: 10;
}

.pos-link {
  background: transparent;
  border: none;
  color: #0f172a;
  font-weight: 600;
  cursor: pointer;
  text-decoration: underline;
  padding: 0;
}

.pos-comprobante-ribbon {
  margin-top: 0.5rem;
  padding: 0.4rem 0.6rem;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 700;
  text-align: center;
  letter-spacing: 0.02em;
}

.pos-comprobante-normal {
  background: #e2e8f0;
  color: #0f172a;
}

.pos-comprobante-fiscal {
  background: #10b981;
  color: #ffffff;
}

.pos-comprobante-consumo {
  background: #0ea5e9;
  color: #ffffff;
}

.pos-comprobante-especial {
  background: #f59e0b;
  color: #111827;
}

.pos-comprobante-gubernamental {
  background: #8b5cf6;
  color: #ffffff;
}

:deep(.pos-primary) {
  background: #0f172a;
  border: none;
  color: #ffffff;
  padding: 0.95rem 1.2rem;
  font-size: 0.95rem;
}

:deep(.pos-secondary) {
  background: #0ea5e9;
  border: none;
  color: #ffffff;
  padding: 0.95rem 1.2rem;
  font-size: 0.95rem;
}

:deep(.pos-action-button) {
  background: #0f172a;
  border: none;
  color: #ffffff;
  padding: 0.8rem 1.2rem;
  font-size: 0.9rem;
}

.pos-modal {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
  padding: 0.75rem 0.5rem 0.25rem;
}

.pos-modal-title {
  font-weight: 700;
  text-align: center;
  color: #0f172a;
}

.pos-modal-name {
  text-align: center;
  font-weight: 600;
  color: #1f2937;
}

.pos-modal-qty {
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: 0.75rem;
  align-items: center;
}

.pos-modal-qty-btn {
  width: 52px;
  height: 52px;
  border-radius: 999px;
  border: none;
  background: #0f172a;
  color: #ffffff;
}

.pos-modal-qty-btn-danger {
  background: #ef4444;
}

.pos-modal-qty-input {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.pos-modal-prices {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 0.75rem;
  flex-wrap: nowrap;
  font-weight: 600;
  color: #1f2937;
}

.pos-modal-prices > div {
  flex: 1 1 0;
  min-width: 0;
}

.pos-modal-price-manual {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  min-width: 150px;
}

.pos-input-compact {
  height: 32px;
  font-size: 0.85rem;
}

.pos-modal-discount {
  text-align: center;
  font-weight: 600;
  color: #0f172a;
}

.pos-modal-discount-btn {
  background: #0f172a;
  border: none;
  color: #ffffff;
  border-radius: 10px;
}

.pos-modal-field {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.pos-product-modal {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 0.75rem 0.5rem 0.25rem;
}

.pos-product-hero {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  padding: 1rem 1.1rem;
  border-radius: 18px;
  background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
  color: #fff;
}

.pos-product-hero-main {
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
  min-width: 0;
}

.pos-product-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  width: fit-content;
  padding: 0.35rem 0.7rem;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.12);
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

.pos-product-title {
  font-size: 1.35rem;
  font-weight: 800;
  line-height: 1.1;
}

.pos-product-subtitle {
  color: rgba(255, 255, 255, 0.72);
  font-size: 0.92rem;
}

.pos-product-total {
  min-width: 170px;
  padding: 0.9rem 1rem;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.08);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: flex-end;
  gap: 0.25rem;
}

.pos-product-total-label {
  font-size: 0.72rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: rgba(255, 255, 255, 0.68);
}

.pos-product-total-value {
  font-size: 1.6rem;
  font-weight: 800;
}

.pos-product-summary {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.75rem;
}

.pos-product-summary-card,
.pos-product-quantity-card,
.pos-product-pricing-card {
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  padding: 1rem;
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.06);
}

.pos-product-summary-label {
  display: block;
  font-size: 0.72rem;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin-bottom: 0.3rem;
}

.pos-product-summary-value {
  display: block;
  font-size: 1.05rem;
  font-weight: 800;
  color: #0f172a;
}

.pos-product-layout {
  display: grid;
  grid-template-columns: minmax(220px, 260px) 1fr;
  gap: 1rem;
}

.pos-section-heading {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  margin-bottom: 0.85rem;
}

.pos-section-heading span {
  font-size: 0.95rem;
  font-weight: 800;
  color: #0f172a;
}

.pos-section-heading small {
  font-size: 0.8rem;
  color: #64748b;
}

.pos-product-qty-field {
  height: 54px;
  font-size: 1.1rem;
  text-align: center;
  font-weight: 700;
}

.pos-price-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.75rem;
}

.pos-price-option {
  border: 1px solid #cbd5e1;
  background: linear-gradient(180deg, #fff 0%, #f8fafc 100%);
  border-radius: 14px;
  padding: 0.9rem 0.8rem;
  text-align: left;
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  transition: all 0.2s ease;
}

.pos-price-option:hover {
  border-color: #0f172a;
  transform: translateY(-1px);
  box-shadow: 0 10px 18px rgba(15, 23, 42, 0.08);
}

.pos-price-option-title {
  font-size: 0.74rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #64748b;
  font-weight: 700;
}

.pos-price-option strong {
  font-size: 1.05rem;
  color: #0f172a;
}

.pos-price-manual-card {
  margin-top: 0.85rem;
  padding-top: 0.85rem;
  border-top: 1px solid #e2e8f0;
}

@media (max-width: 900px) {
  .pos-product-hero,
  .pos-product-layout {
    grid-template-columns: 1fr;
    flex-direction: column;
  }

  .pos-product-summary,
  .pos-price-grid {
    grid-template-columns: 1fr;
  }

  .pos-product-total {
    align-items: flex-start;
    min-width: 100%;
  }
}

.pos-modal-actions {
  display: flex;
  gap: 0.75rem;
  justify-content: flex-end;
  flex-direction: row-reverse;
}

.pos-modal-actions-main {
  flex-direction: row;
  justify-content: flex-start;
}

.pos-modal-actions :deep(.p-button) {
  flex: 1 1 50%;
}

.pos-modal-actions-prices {
  flex-direction: row;
  justify-content: space-between;
  align-items: flex-end;
  gap: 0.75rem;
}

.pos-modal-price-manual-inline {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  min-width: 150px;
}

.pos-modal-actions-info {
  flex-direction: row;
  justify-content: space-between;
}

.pos-modal-info {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.5rem 0.7rem;
  border-radius: 10px;
  background: #f0fdf4;
  color: #14532d;
  font-size: 0.85rem;
  border: 1px solid #86efac;
}

.pos-modal-info-label {
  font-weight: 700;
}

.pos-modal-actions-prices :deep(.p-button) {
  flex: 1 1 33%;
}

.pos-comprobante-actions {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.pos-comprobante-actions :deep(.p-button) {
  width: 100%;
  padding: 1rem 1.2rem;
  font-size: 1rem;
}

.pos-label {
  font-size: 0.75rem;
  font-weight: 600;
  color: #64748b;
}

.pos-modal-summary {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.5rem 1rem;
  font-size: 0.85rem;
  font-weight: 600;
  color: #1f2937;
}

.pos-input {
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 0.55rem 0.75rem;
  width: 100%;
}

.pos-modal-advanced {
  display: none;
}

:deep(.pos-modal-dialog .p-dialog-content) {
  padding: 1.25rem 1.5rem;
}

.payment-card {
  background: white;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  padding: 1.5rem;
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.payment-card:hover {
  border-color: #3b82f6;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.15);
  transform: translateY(-2px);
}

.payment-icon-wrapper {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}

.payment-card:hover .payment-icon-wrapper {
  transform: scale(1.1);
}

.payment-label {
  font-size: 0.875rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: #6b7280;
  margin: 0;
}

.payment-input-wrapper {
  position: relative;
  width: 100%;
}

.currency-symbol {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 1.25rem;
  font-weight: 600;
  color: #6b7280;
  pointer-events: none;
}

.payment-input {
  width: 100%;
  padding: 0.75rem 1rem 0.75rem 2.5rem;
  font-size: 1.125rem;
  font-weight: 600;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  text-align: center;
  transition: all 0.3s ease;
  background: #f9fafb;
}

.payment-input:focus {
  outline: none;
  border-color: #3b82f6;
  background: white;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.payment-input:read-only {
  background: #f3f4f6;
  cursor: not-allowed;
  opacity: 0.7;
}

.payment-input::placeholder {
  color: #d1d5db;
}

.efectivo-card:hover {
  border-color: #10b981;
}

.efectivo-card:hover .payment-icon-wrapper {
  background: #d1fae5 !important;
}

.efectivo-card .payment-input:focus {
  border-color: #10b981;
  box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1);
}

.tarjeta-card:hover {
  border-color: #3b82f6;
}

.tarjeta-card:hover .payment-icon-wrapper {
  background: #dbeafe !important;
}

.transferencia-card:hover {
  border-color: #8b5cf6;
}

.transferencia-card:hover .payment-icon-wrapper {
  background: #ede9fe !important;
}

.transferencia-card .payment-input:focus {
  border-color: #8b5cf6;
  box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.1);
}

@media (max-width: 768px) {
  .payment-card {
    padding: 1rem;
  }

  .payment-icon-wrapper {
    width: 50px;
    height: 50px;
  }

  .payment-input {
    font-size: 1rem;
    padding: 0.625rem 0.875rem 0.625rem 2.25rem;
  }
}

</style>
