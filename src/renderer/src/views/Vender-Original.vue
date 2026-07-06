<template>
  <!-- HEADER MODERNO CON INFORMACIÓN DEL USUARIO -->
  <div class="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">

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
                    :options="['factura', 'cotizacion', 'pre-factura', 'orden', 'apartado']"
                  />
                </div>

                <!-- Usuario y Cliente en una sola línea -->
                <div class="flex flex-col lg:flex-row items-start lg:items-center gap-4">

                  <!-- Info del Usuario -->
                  <div class="flex items-center space-x-3">
                    <div class="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold shadow-lg">
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
                      <FloatLabel variant="on">
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
                        showClear
                         class="flex-1"
                      />
                      <label for="on_label">Nombre del Cliente</label>
                     </FloatLabel>
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
                <div class="flex items-center space-x-2 mb-4">
                  <i class="pi pi-shopping-cart text-xl text-green-600 dark:text-green-400"></i>
                  <h3 class="text-lg font-bold text-slate-800 dark:text-slate-100">{{ $t('Search Product') }}</h3>
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
<!--                     <awesomplete
                      class="form-control"
                      v-model="awesompleteproductoprincipal"
                      @change="fnAwesompleteproductoprincipal"
                      @selectComplete="buscadorFerreteria"
                      ref="awesompleteInput"
                      :list="listaBuscador"
                      style="border: 2px #f0fdf4 solid;border-radius: 5px;">
                    </awesomplete> -->

                  <AutoCompletar
                    v-model="awesompleteproductoprincipal"
                    :list="listaBuscador"
                    :placeholder="$t('Type the name, code or scan barcode...')"
                    :mostrarBoton="true"
                    ref="awesompleteInput"
                    @onBotonClick="visibleBuscarProducto = true"
                    @selectComplete="buscadorFerreteria"
                  />


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
                    <i class="pi pi-list text-xl text-purple-600 dark:text-purple-400"></i>
                    <h3 class="text-lg font-bold text-slate-800 dark:text-slate-100">
                      {{ $t('Products Added') }}
                      <span class="ml-2 px-3 py-1 bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 rounded-full text-sm font-semibold">
                        {{cantidadProductosLocal}}
                      </span>
                    </h3>
                  </div>
                </div>

                <div class="rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
                  <table class="min-w-full text-sm text-left text-slate-700 dark:text-slate-200">
                    <thead class="bg-gradient-to-r from-slate-100 to-slate-50 dark:from-slate-800 dark:to-slate-700">
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
                                <Button
                                  v-if="producto.categoria === 'CELULARES'"
                                  icon="pi pi-eye"
                                  size="small"
                                  severity="secondary"
                                  text
                                  rounded
                                  @click.prevent="verListadoImei(index)"
                                  v-tooltip.left="'Ver IMEI'"
                                />
                              </div>

                              <!-- Menú de opciones avanzadas para administradores -->
                              <div v-if="usuarioLocal.usuario === 'Administrador' || usuarioLocal.usuario === 'Soporte' || usuarioLocal.usuario === 'Gerente'" class="border-t border-slate-200 dark:border-slate-600 pt-2">
                                <div class="flex flex-wrap gap-1 justify-center max-h-24 overflow-y-auto">
                                  <Button @click.prevent="fmImpuestoIncluido(producto.codigo)" size="small" severity="secondary" text rounded class="!text-xs !px-2 !py-1" v-tooltip.left="'Impuesto Incluido'">
                                    <i class="fas icon-balance-scale"></i>
                                  </Button>
                                  <Button @click.prevent="fnPrecioNormal(producto)" size="small" severity="secondary" text rounded class="!text-xs !px-2 !py-1" label="PN" v-tooltip.left="$t('Normal Price')" />
                                  <Button @click.prevent="fnPrecioMinimo(producto)" size="small" severity="secondary" text rounded class="!text-xs !px-2 !py-1" label="PM" v-tooltip.left="$t('Minimum Price')" />
                                  <Button @click.prevent="fnXmayor(producto)" size="small" severity="secondary" text rounded class="!text-xs !px-2 !py-1" label="XM" v-tooltip.left="$t('Wholesale')" />
                                  <!-- <Button @click.prevent="fnOferta(producto)" size="small" severity="secondary" text rounded class="!text-xs !px-2 !py-1" label="OF" v-tooltip.left="$t('Offer')" /> -->
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
                            class="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:underline font-medium transition-colors"
                          >
                            {{ producto.nombre }}
                          </a> -->
                        </td>

                        <td class="px-4 py-3 text-center">
                          <InputNumber
                            v-model.number="producto.cantidad"
                            inputId="horizontal-buttons"
                            :readonly="producto.categoria === 'CELULARES'"
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
            <Card class="shadow-2xl border-2 border-blue-300 dark:border-blue-700 bg-gradient-to-br from-white to-blue-50 dark:from-slate-800 dark:to-slate-900">
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
                    <i class="pi pi-calculator text-2xl text-blue-600 dark:text-blue-400"></i>
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
                      <span class="text-lg font-bold text-blue-600 dark:text-blue-400">${{ impuesto }}</span>
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

                  <div v-if="datosDefault.modo === 'CELULAR'" class="mt-3">
                    <Button
                      icon="pi pi-mobile"
                      :label="$t('Search IMEI')"
                      @click="visibleBuscadorIMEI = true"
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
<!-- ////////////////////////////////////////////////////////////////////////////////////////// -->
    <Toast />

<!-- ////////////////////////////////////////////////////////////////////////////////////////// -->
<Dialog v-model:visible="visibleprecio" modal :position="position" :header="$t('Edit Product')" :style="{ width: '50rem' }">
  <template #header>
    <div class="inline-flex align-items-center justify-content-center gap-2">
      <span class="font-bold white-space-nowrap">{{ $t('Edit Product') }}</span>
    </div>
  </template>

  <div class="grid grid-cols-12 gap-4">

<!-- <div class="col-span-12 form-group">
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
    </div> -->

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

          <!-- Botones de Precios -->
          <div class="col-span-12 mb-3">
            <div class="flex flex-wrap gap-2 justify-center">
              <Button
                label="P. Venta"
                icon="pi pi-tag"
                severity="info"
                @click="fnAplicarPrecioVenta"
                v-tooltip.top="'Aplicar Precio de Venta'"
                size="small"
              />
              <Button
                label="P. Mínimo"
                icon="pi pi-arrow-down"
                severity="warning"
                @click="fnAplicarPrecioMinimo"
                v-tooltip.top="'Aplicar Precio Mínimo'"
                size="small"
              />
              <Button
                label="X Mayor"
                icon="pi pi-shopping-cart"
                severity="success"
                @click="fnAplicarPrecioXMayor"
                v-tooltip.top="'Aplicar Precio Por Mayor'"
                size="small"
              />
              <Button
                label="Gratis"
                icon="pi pi-gift"
                severity="danger"
                @click="fnAplicarGratis"
                v-tooltip.top="'Poner en Cero (Gratis)'"
                size="small"
              />
            </div>
          </div>

          <div class="col-span-3 form-group">
            <label for="precio-base">P. Base</label>
            <input type="text" class="form-control  " v-solonumeros v-decimales v-numeroFocusinOut v-model="productoSeleccionado.precio_venta" @input="calcularPrecioFinal">
          </div>
          <div class="col-span-3 form-group">
            <label for="impuestoA">Impuesto</label>
            <input type="text" class="form-control " v-solonumeros v-decimales v-numeroFocusinOut v-model="productoSeleccionado.impuestos" @input="calcularPrecioFinal">
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


  </div>

  <template #footer>
    <Button :label="$t('Cancel')" text severity="secondary" @click="visibleprecio = false" autofocus />
    <Button :label="$t('Save')" outlined severity="secondary" @click="guardarProducto" autofocus />
  </template>
</Dialog>

 <!-- ////////////////////////////////////////////////////////////////////////////////////////// -->
    <Drawer v-model:visible="visiblecobrar" position="right" :header="$t('Generate Invoice')" :style="{ width: '30rem' }">
    <template #header>
      <div class="inline-flex align-items-center justify-content-center gap-2">
        <span class="font-bold white-space-nowrap">{{ $t('Generate Invoice') }}</span>
      </div>
    </template>
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4 p-4">


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
      

      <div class="col-span-2 grid grid-cols-3">

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


      <div class="col-span-1 md:col-span-2">
        <label for="pagacon" class="block text-sm font-medium text-gray-700 dark:text-gray-300">PAGA CON</label>
        <input 
        type="text" 
        class="form-control w-full p-4 text-4xl border rounded dark:bg-gray-700 dark:border-gray-600" 
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
        <input type="text" class="form-control w-full p-4 text-4xl border rounded dark:bg-gray-700 dark:border-gray-600" v-model="suCambio" readonly>
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

<div class="form-group sm:col-span-12 md:col-span-4 lg:col-span-4">
<label for="telefonoAgregarDatos">TELEFONO</label>

 <InputMask id="telefonoAgregarDatos" @blur="actualizarCliente" v-model="clienteSelected.telefono" :mask="patronTelefono" :placeholder="patronTelefono" />

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
                   <OptionButtonTM
                    v-model="datosFactCoti.tipo"
                    label="TIPO DOCUMENTO"
                    @change="tipodocumento"
                    :options="['Factura','Cotizacion','Pre-Factura','Orden','Apartado']"
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
            <Button icon="pi pi-file-pdf" fluid label="PDF" @click="generadorpdf"  />
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
            <Button v-if="datosFactCoti.tipo === 'Cotizacion'" label="Institución" icon="pi pi-building" severity="info" @click="fnAbrirEditarInstCotizacion" outlined iconPos="top" />
            <Button label="Editar Método de Pago" v-if="datosFactCoti.tipo ==='Factura'" @click="fnEditarMetodoPago" icon="pi icon-dollar" severity="warning"  outlined iconPos="top"/>

            <Button label="Aplicar NCF" v-if="datosFactCoti.tipo ==='Factura'" icon="pi icon-balance-scale" severity="warning"  @click="visibleComprobantes = true" outlined iconPos="top"/>
            <Button label="Conduce" icon="pi pi-truck" severity="warn" v-if="datosFactCoti.tipo ==='Factura'"  @click="visibleConduce = true" outlined iconPos="top"/>

            <Button label="Crédito" v-if="datosFactCoti.tipo ==='Factura'" icon="pi pi-money-bill" iconPos="top" severity="danger"  @click="fnAplicarCredito" outlined />

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
        <Button label="Productos" icon="pi pi-list" @click="fnVerProductosDocumento" outlined />
        <Button label="Cambiar Cliente" icon="pi pi-user" @click="visibleClientes = true" outlined />
        <Button label="Whatsapp" icon="pi pi-whatsapp" @click="showWhatsAppModal" outlined />
        <Button label="Editar" icon="pi pi-pencil" outlined @click="editarFactura" />
        <Button label="Imprimir" icon="pi pi-print" @click="impresionFactura" outlined />
        <Button label="Devolución" icon="pi pi-undo" v-if="datosFactCoti.tipo ==='Factura'" @click="fnDevoluciones" outlined />
        <Button label="Cancel" icon="pi pi-times" severity="danger" @click="visiblefatcoti = false" outlined />
      </ButtonGroup>
    </template>
  </Dialog>
 <!-- ////////////////////////////////////////////////////////////////////////////////////////// -->

  <!-- Modal de productos del documento -->
  <!-- Modal de conversión de cotización -->
  <Dialog
    v-model:visible="visibleProductosDocumento"
    modal
    :position="position"
    :header="`Productos de ${datosFactCoti.tipo} #${datosFactCoti.numero || ''}`"
    :style="{ width: '70rem' }"
  >
    <div class="p-4">
      <div class="mb-4">
        <InputText
          v-model="busquedaProductosDocumento"
          placeholder="Buscar productos..."
          class="w-full"
        />
      </div>
      <DataTable
        :value="productosDocumentoFiltrados"
        paginator
        :rows="10"
        :rowsPerPageOptions="[10, 20, 50]"
        responsiveLayout="scroll"
        stripedRows
        showGridlines
        class="p-datatable-sm"
      >
        <template #empty>
          <div class="text-center p-4">
            No hay productos en este documento
          </div>
        </template>

        <Column field="codigo" header="Codigo" />
        <Column field="nombre" header="Nombre" />
        <Column field="categoria" header="Categoria" />
        <Column field="cantidad" header="Cantidad" />
        <Column field="precio_venta" header="Precio" />
        <Column field="total" header="Total" />
      </DataTable>
    </div>

    <template #footer>
      <Button label="Cerrar" icon="pi pi-times" severity="danger" @click="visibleProductosDocumento = false" outlined />
    </template>
  </Dialog>

  <Dialog v-model:visible="visibleConvertirCotizacion" modal header="Convertir Cotización a Factura" :style="{ width: '35rem' }" :closable="false">
    <template #header>
      <div class="flex items-center gap-3">
        <i class="pi pi-question-circle text-3xl text-blue-500"></i>
        <span class="font-bold text-lg">Convertir Cotización a Factura</span>
      </div>
    </template>

    <div class="py-4">
      <p class="text-gray-700 dark:text-gray-300 mb-6 text-center">
        Cotización <strong>#{{ datosFactCoti.numero }}</strong>
      </p>
      <p class="text-gray-600 dark:text-gray-400 mb-4 text-center">
        ¿Cómo deseas proceder con esta cotización?
      </p>

      <div class="flex flex-col gap-3">
        <Button
          label="Convertir tal cual como está"
          icon="pi pi-check-circle"
          severity="success"
          class="w-full justify-center"
          size="large"
          @click="accionConversionCotizacion = 'directa'; visibleConvertirCotizacion = false"
        />

        <Button
          label="Modificarla antes de convertir"
          icon="pi pi-pencil"
          severity="info"
          class="w-full justify-center"
          size="large"
          outlined
          @click="accionConversionCotizacion = 'modificar'; visibleConvertirCotizacion = false"
        />

        <Button
          label="Cancelar"
          icon="pi pi-times"
          severity="secondary"
          class="w-full justify-center"
          text
          @click="accionConversionCotizacion = 'cancelar'; visibleConvertirCotizacion = false"
        />
      </div>
    </div>
  </Dialog>
 <!-- ////////////////////////////////////////////////////////////////////////////////////////// -->

  <!-- Modal de selección de comprobante para conversión -->
  <Dialog v-model:visible="visibleComprobanteConversion" modal header="Tipo de Comprobante" :style="{ width: '35rem' }" :closable="false">
    <template #header>
      <div class="flex items-center gap-3">
        <i class="pi pi-file-check text-3xl text-green-500"></i>
        <span class="font-bold text-lg">Seleccionar Comprobante</span>
      </div>
    </template>

    <div class="py-4">
      <p class="text-gray-600 dark:text-gray-400 mb-6 text-center">
        ¿La factura lleva comprobante fiscal?
      </p>

      <div class="flex flex-col gap-3">
        <Button
          label="SIN COMPROBANTE"
          icon="pi pi-times-circle"
          severity="secondary"
          class="w-full justify-center"
          size="large"
          @click="comprobanteSeleccionadoConversion = 'NORMAL'; visibleComprobanteConversion = false"
        />

        <Button
          label="COMPROBANTE CON VALOR FISCAL (B01)"
          icon="pi pi-file"
          severity="success"
          class="w-full justify-center"
          size="large"
          outlined
          @click="comprobanteSeleccionadoConversion = 'FISCAL'; visibleComprobanteConversion = false"
        />

        <Button
          label="CONSUMIDOR FINAL (B02)"
          icon="pi pi-user"
          severity="info"
          class="w-full justify-center"
          size="large"
          outlined
          @click="comprobanteSeleccionadoConversion = 'FINAL'; visibleComprobanteConversion = false"
        />

        <Button
          label="REGIMEN ESPECIAL (B14)"
          icon="pi pi-star"
          severity="warning"
          class="w-full justify-center"
          size="large"
          outlined
          @click="comprobanteSeleccionadoConversion = 'REGIMEN ESPECIAL'; visibleComprobanteConversion = false"
        />

        <Button
          label="COMPROBANTE GUBERNAMENTAL (B15)"
          icon="pi pi-building"
          severity="help"
          class="w-full justify-center"
          size="large"
          outlined
          @click="comprobanteSeleccionadoConversion = 'GUBERNAMENTAL'; visibleComprobanteConversion = false"
        />

        <Button
          label="Cancelar"
          icon="pi pi-arrow-left"
          severity="secondary"
          class="w-full justify-center mt-2"
          text
          @click="comprobanteSeleccionadoConversion = 'cancelar'; visibleComprobanteConversion = false"
        />
      </div>
    </div>
  </Dialog>
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
      <!-- Grid de métodos de pago -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">

        <!-- Efectivo Card -->
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

        <!-- Tarjeta Card -->
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

        <!-- Transferencia Card -->
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

      <!-- Selector de Método de Pago con Porcentaje para Tarjeta -->
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

            <!-- Mostrar cálculo del recargo -->
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

            <!-- Sección de Distribución de Recargo en Productos -->
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

                <!-- Lista de productos con checkboxes -->
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

                  <!-- Mensaje si no hay productos -->
                  <div v-if="productosVenta.length === 0" class="p-4 text-center text-gray-500 text-sm">
                    No hay productos en la venta
                  </div>
                </div>

                <!-- Resumen de distribución -->
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

                <!-- Botón para aplicar distribución -->
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

      <!-- Total Section -->
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
      <div class="flex justify-end gap-3">
        <Button
          label="Cerrar"
          icon="pi pi-times"
          severity="secondary"
          @click="visibledinero = false"
          outlined
          class="px-6"
        />
      </div>
    </template>
  </Dialog>
 <!-- ////////////////////////////////////////////////////////////////////////////////////////// -->

    <Dialog v-model:visible="visiblebuscarImei" modal :position="position" header="Buscar Imei" :style="{ width: '30rem' }">
    <template #header>
      <div class="inline-flex align-items-center justify-content-center gap-2">
        <span class="font-bold white-space-nowrap">Buscar Imei</span>
      </div>
    </template>
    <div class="grid grid-cols-12 gap-4">

  <fieldset class="border p-3 rounded mb-2">
    <legend class="float-none w-auto px-2">IMEI</legend>
     <form id="formularioAgregarClientes" action="" method="">
         <div  style="margin-top: 15px;color: #34AAB2;" class="grid grid-cols-12 gap-4">

            <div class="form-group col-span-12">
            <label for="ingresenumeroModifcarfactura">#IMEI</label>
            <InputGroup>
          <Select v-model="datosIMEI" filter @keyup.enter="fnagregarImei" emptySelectionMessage="NO hay Imei Seleccionado" editable :options="imeiArray"  optionLabel="imei" placeholder="IMEI" class="w-full md:w-14rem" />
        </InputGroup>
           </div>


        </div>
        </form>
</fieldset>

    </div>
    <template #footer>

<ButtonGroup >
    <Button label="Agregar" icon="pi pi-barcode" @click="fnagregarImei" outlined />
    <Button label="Cancel" icon="pi pi-times" severity="danger" @click="visiblebuscarImei = false" outlined />
</ButtonGroup>


    </template>
  </Dialog>
 <!-- ///////////// MODAL INSTITUCION COTIZACION ///////////// -->
 <Dialog v-model:visible="visibleInstitucionCotizacion" modal :position="position" header="Institución para Cotización" :style="{ width: '25rem' }">
    <div class="p-4 space-y-4">
      <div class="flex flex-col">
        <label class="font-semibold mb-2 text-gray-700 dark:text-gray-300">Seleccionar Institución</label>
        <Select
          v-model="institucionCotizacion"
          :options="['NINGUNA', ...intitucionesDataNames]"
          placeholder="Seleccionar institución"
          class="w-full"
        />
      </div>
      <div class="flex justify-end gap-2 mt-4">
        <Button label="Cancelar" severity="secondary" @click="visibleInstitucionCotizacion = false" outlined />
        <Button label="Aceptar" @click="fnAceptarInstitucionCotizacion" />
      </div>
    </div>
 </Dialog>

 <!-- ///////////// MODAL EDITAR INSTITUCION COTIZACION EXISTENTE ///////////// -->
 <Dialog v-model:visible="visibleEditarInstCotizacion" modal :position="position" header="Cambiar Institución de Cotización" :style="{ width: '25rem' }">
    <div class="p-4 space-y-4">
      <div class="flex flex-col">
        <label class="font-semibold mb-2 text-gray-700 dark:text-gray-300">Seleccionar Institución</label>
        <Select
          v-model="editInstCotizacion"
          :options="['NINGUNA', ...intitucionesDataNames]"
          placeholder="Seleccionar institución"
          class="w-full"
        />
      </div>
      <div class="flex justify-end gap-2 mt-4">
        <Button label="Cancelar" severity="secondary" @click="visibleEditarInstCotizacion = false" outlined />
        <Button label="Guardar" icon="pi pi-check" @click="fnGuardarEditInstCotizacion" />
      </div>
    </div>
 </Dialog>

 <!-- ///////////// MODAL QUIEN PAGA COTIZACION ///////////// -->
 <Dialog v-model:visible="visibleQuienPagaCotizacion" modal :position="position" header="¿Quién asume el costo?" :style="{ width: '30rem' }">
    <div class="p-4 space-y-4">
      <div class="flex flex-col">
        <label class="font-semibold mb-2 text-gray-700 dark:text-gray-300">Seleccione quién asumirá el costo</label>
        <Select
          v-model="quienPagaCotizacion"
          :options="['INSTITUCION', 'CLIENTE', 'AMBAS']"
          placeholder="Seleccionar"
          class="w-full"
          @change="cambiosQuienPagaCotizacion"
        />
      </div>

      <!-- Mostrar montos cuando sea AMBAS -->
      <div v-if="quienPagaCotizacion === 'AMBAS'" class="space-y-3 mt-4">
        <div class="flex flex-col">
          <label class="font-semibold mb-1 text-gray-700 dark:text-gray-300">Monto Institución</label>
          <InputNumber
            v-model="montoInstitucionCotizacion"
            mode="currency"
            currency="DOP"
            locale="es-DO"
            class="w-full"
            @input="fnRecalcularCotizacionAmbas"
          />
        </div>
        <div class="flex flex-col">
          <label class="font-semibold mb-1 text-gray-700 dark:text-gray-300">Monto Cliente</label>
          <InputNumber
            v-model="montoClienteCotizacion"
            mode="currency"
            currency="DOP"
            locale="es-DO"
            class="w-full"
            disabled
          />
        </div>
      </div>

      <!-- Mostrar solo el total cuando sea INSTITUCION o CLIENTE -->
      <div v-else class="mt-4">
        <div class="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <p class="text-sm text-gray-600 dark:text-gray-400">
            <span class="font-semibold">{{ quienPagaCotizacion === 'INSTITUCION' ? 'La institución' : 'El cliente' }}</span> asumirá el costo total:
          </p>
          <p class="text-xl font-bold text-blue-600 dark:text-blue-400 mt-1">
            {{ new Intl.NumberFormat('es-DO', { style: 'currency', currency: 'DOP' }).format(total) }}
          </p>
        </div>
      </div>

      <div class="flex justify-end gap-2 mt-4">
        <Button label="Cancelar" severity="secondary" @click="visibleQuienPagaCotizacion = false" outlined />
        <Button label="Aceptar" @click="fnAceptarQuienPagaCotizacion" />
      </div>
    </div>
 </Dialog>
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

          <div class="col-span-12 md:col-span-6" v-if="datosDefault.modo === 'CELULAR'">
            <label for="ncategoriaArticulo" class="block text-sm font-medium">IMEI</label>
          <InputGroup>
              <InputMask id="ncategoriaArticulo" @keydown.enter="verificaIMEI" @update:modelValue="fnCategoriaDesdeImei" v-model="productoOtro.imei" mask="999999999999999" class="w-full" />
              <InputGroupAddon>
                 <Button icon="pi pi-search" severity="secondary"  @click="verificaIMEI" />
              </InputGroupAddon>
          </InputGroup>
          </div>

          <div class="col-span-12 md:col-span-6">
            <label for="ncategoriaArticulo">CATEGORIA</label>
            <Select
              id="ncategoriaArticulo"
              v-model="categoriaNProducto"
              :options="categoriasArray"
              optionLabel="nombre"
              optionValue="nombre"
              filter
              class="w-full"
              placeholder="Seleccione una categoría"
            />
          </div>

          <div class="col-span-12">
            <label for="nnombreArticulo">NOMBRE</label>

          <InputGroup>
            <InputText type="text" name="nnombreArticulo" v-mayuscula v-model="nombreNProducto" class="w-full p-2 border rounded-md" id="nnombreArticulo" />

              <InputGroupAddon>
                 <Button icon="pi pi-times" severity="secondary"  @click="nombreNProducto = ''" />
              </InputGroupAddon>
          </InputGroup>

          </div>

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
  <Dialog
    v-model:visible="visibleListadoImei"
    modal
    :position="position"
    :style="{ width: '50rem' }"
    class="imei-list-dialog"
  >
    <template #header>
      <div class="flex items-center gap-3">
        <div class="imei-dialog-icon">
          <i class="pi pi-mobile text-2xl"></i>
        </div>
        <div>
          <h3 class="text-xl font-bold text-gray-800 m-0">Listado de IMEIs</h3>
          <p class="text-sm text-gray-500 m-0">Total: {{ listadoImei.length }} IMEI(s)</p>
        </div>
      </div>
    </template>

    <div class="imei-list-content">
      <DataTable
        :value="listadoImei.map((item, idx) => ({ imei: item, index: idx }))"
        stripedRows
        :paginator="listadoImei.length > 10"
        :rows="10"
        class="imei-datatable-modern"
      >
        <Column header="#" style="width: 80px">
          <template #body="slotProps">
            <div class="imei-number-badge">
              {{ slotProps.data.index + 1 }}
            </div>
          </template>
        </Column>

        <Column header="IMEI" style="min-width: 200px">
          <template #body="slotProps">
            <div class="imei-cell-modern">
              <i class="pi pi-mobile text-blue-500"></i>
              <code class="imei-code-modern">{{ slotProps.data.imei }}</code>
            </div>
          </template>
        </Column>

        <Column header="Acciones" style="width: 120px">
          <template #body="slotProps">
            <Button
              icon="pi pi-refresh"
              severity="info"
              text
              rounded
              @click="fnAbrirReemplazarImei(slotProps.data.index, slotProps.data.imei)"
              v-tooltip.top="'Reemplazar IMEI'"
            />
            <Button
              icon="pi pi-trash"
              severity="danger"
              text
              rounded
              @click="fnBorrarImei(slotProps.data.index, slotProps.data.imei)"
              v-tooltip.top="'Eliminar IMEI'"
            />
          </template>
        </Column>

        <template #empty>
          <div class="no-imeis-found">
            <i class="pi pi-inbox text-4xl text-gray-300"></i>
            <p class="text-gray-500 mt-3">No hay IMEIs en la lista</p>
          </div>
        </template>
      </DataTable>
    </div>

    <template #footer>
      <div class="flex justify-end gap-2">
        <Button
          label="Borrar Todo"
          icon="pi pi-trash"
          severity="danger"
          @click="eliminarProducto(indexCelular)"
          outlined
        />
        <Button
          label="Cerrar"
          icon="pi pi-times"
          severity="secondary"
          @click="visibleListadoImei = false"
          outlined
        />
      </div>
    </template>
  </Dialog>

  <Dialog v-model:visible="visibleReemplazarImei" modal :position="position" header="Reemplazar IMEI" :style="{ width: '35rem' }">
    <div class="p-4 space-y-4">
      <div>
        <label class="block text-sm font-medium mb-2">IMEI actual</label>
        <InputText :modelValue="imeiActualReemplazo" class="w-full" readonly />
      </div>
      <div>
        <label class="block text-sm font-medium mb-2">Nuevo IMEI disponible</label>
        <Select
          v-model="imeiNuevoSeleccionado"
          :options="imeisDisponiblesReemplazo"
          optionLabel="imei"
          optionValue="imei"
          filter
          class="w-full"
          placeholder="Seleccione un IMEI"
        />
      </div>
    </div>
    <template #footer>
      <Button label="Cancelar" icon="pi pi-times" severity="secondary" @click="visibleReemplazarImei = false" outlined />
      <Button label="Reemplazar" icon="pi pi-check" severity="info" @click="fnConfirmarReemplazoImei" />
    </template>
  </Dialog>

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
      <i class="pi pi-box text-blue-600 text-xl"></i>
      <span class="font-bold text-lg">Listado de Productos</span>
    </div>
  </template>

  <!-- CONTENIDO -->
  <div class="p-4">

    <!-- SELECTOR DE ALMACÉN -->
    <div class="mb-4">
      <label class="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
        <i class="pi pi-building mr-2"></i>Almacén
      </label>
      <Dropdown
        v-model="selectedAlmacenBusqueda"
        :options="listaAlmacenes"
        optionLabel="nombre"
        optionValue="nombre"
        placeholder="Seleccione un almacén"
        class="w-full"
      />
    </div>

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
<Dialog 
  v-model:visible="visibleBuscadorIMEI" 
  modal 
  header="Listado de IMEI"
  :style="{ width: '75rem', maxWidth: '95vw' }"
  class="imei-dialog"
>
  <template #header>
    <div class="flex items-center gap-2">
      <span class="font-bold text-xl">Listado de IMEI</span>
    </div>
  </template>

  <div class="w-full space-y-4">

    <!-- Buscador -->
    <div>
      <input 
        v-model="searchQueryImei" 
        placeholder="Buscar IMEI..." 
        class="p-inputtext p-component w-full"
      />
    </div>

    <!-- Tabla -->
    <DataTable 
      :value="filteredIMEI"
      scrollable 
      scrollHeight="600px"
      @rowSelect="onRowSelectIMEI"
      selectionMode="single" 
      dataKey="imei"
      paginator
      :rows="10"
      :rowsPerPageOptions="[5, 10, 20, 50]"
      class="w-full"
      tableStyle="min-width: 100%"
    >
      <Column 
        v-for="col of columnsIMEI" 
        :key="col.field" 
        :field="col.field" 
        :header="col.header" 
        sortable
      />
    </DataTable>

  </div>

  <template #footer>
    <div class="flex justify-end">
      <Button 
        label="Cerrar" 
        icon="pi pi-times" 
        severity="danger" 
        outlined
        @click="visibleBuscadorIMEI = false"
      />
    </div>
  </template>
</Dialog>

 <!-- ////////////////////////////////////////////////////////////////////////////////////////// -->
    <!-- Modal de Selección de Precio para IMEI -->
    <Dialog
      v-model:visible="visiblePrecioIMEI"
      modal
      header="Seleccionar Precio"
      :style="{ width: '35rem', maxWidth: '95vw' }"
      class="precio-imei-dialog"
    >
      <template #header>
        <div class="flex items-center gap-2">
          <i :class="imeiSeleccionadoData?.esElectrodomestico ? 'pi pi-box' : 'pi pi-mobile'" class="text-2xl text-blue-600"></i>
          <span class="font-bold text-xl">Seleccionar Precio para {{ imeiSeleccionadoData?.esElectrodomestico ? 'Serial' : 'IMEI' }}</span>
        </div>
      </template>

      <div v-if="imeiSeleccionadoData" class="space-y-4">
        <!-- Información del Producto -->
        <div class="bg-slate-100 dark:bg-slate-800 p-4 rounded-lg">
          <p class="text-sm font-semibold text-slate-700 dark:text-slate-300">Producto:</p>
          <p class="text-lg font-bold text-slate-900 dark:text-slate-100">{{ imeiSeleccionadoData.datosEquipo.nombre }}</p>
          <p class="text-sm text-slate-600 dark:text-slate-400">{{ imeiSeleccionadoData.esElectrodomestico ? 'Serial' : 'IMEI' }}: {{ imeiSeleccionadoData.imei }}</p>
          <p v-if="imeiSeleccionadoData.capacidad" class="text-sm font-semibold text-green-600 dark:text-green-400">Capacidad: {{ imeiSeleccionadoData.capacidad }}</p>
        </div>

        <!-- Opciones de Precio -->
        <div class="space-y-3">
          <label class="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Seleccione el precio de venta:</label>

          <div class="flex items-center gap-3 p-3 border-2 rounded-lg cursor-pointer hover:bg-blue-50 dark:hover:bg-slate-700 transition-colors"
               :class="precioSeleccionadoIMEI === imeiSeleccionadoData.precio_venta ? 'border-blue-500 bg-blue-50 dark:bg-slate-700' : 'border-slate-300 dark:border-slate-600'"
               @click="precioSeleccionadoIMEI = imeiSeleccionadoData.precio_venta; precioManualIMEI = 0">
            <RadioButton v-model="precioSeleccionadoIMEI" :value="imeiSeleccionadoData.precio_venta" />
            <div class="flex-1">
              <span class="font-semibold">Precio Normal</span>
              <span class="float-right text-lg font-bold text-green-600">{{ formatoMonedaRD(imeiSeleccionadoData.precio_venta) }}</span>
            </div>
          </div>

          <div class="flex items-center gap-3 p-3 border-2 rounded-lg cursor-pointer hover:bg-blue-50 dark:hover:bg-slate-700 transition-colors"
               :class="precioSeleccionadoIMEI === imeiSeleccionadoData.precio_min ? 'border-blue-500 bg-blue-50 dark:bg-slate-700' : 'border-slate-300 dark:border-slate-600'"
               @click="precioSeleccionadoIMEI = imeiSeleccionadoData.precio_min; precioManualIMEI = 0">
            <RadioButton v-model="precioSeleccionadoIMEI" :value="imeiSeleccionadoData.precio_min" />
            <div class="flex-1">
              <span class="font-semibold">Precio Mínimo</span>
              <span class="float-right text-lg font-bold text-orange-600">{{ formatoMonedaRD(imeiSeleccionadoData.precio_min) }}</span>
            </div>
          </div>

          <div class="flex items-center gap-3 p-3 border-2 rounded-lg cursor-pointer hover:bg-blue-50 dark:hover:bg-slate-700 transition-colors"
               :class="precioSeleccionadoIMEI === imeiSeleccionadoData.precio_xmayor ? 'border-blue-500 bg-blue-50 dark:bg-slate-700' : 'border-slate-300 dark:border-slate-600'"
               @click="precioSeleccionadoIMEI = imeiSeleccionadoData.precio_xmayor; precioManualIMEI = 0">
            <RadioButton v-model="precioSeleccionadoIMEI" :value="imeiSeleccionadoData.precio_xmayor" />
            <div class="flex-1">
              <span class="font-semibold">Precio Por Mayor</span>
              <span class="float-right text-lg font-bold text-blue-600">{{ formatoMonedaRD(imeiSeleccionadoData.precio_xmayor) }}</span>
            </div>
          </div>
        </div>

        <!-- Precio Manual -->
        <div class="space-y-2">
          <label class="block text-sm font-semibold text-slate-700 dark:text-slate-300">O ingrese un precio manual:</label>
          <InputNumber
            v-model="precioManualIMEI"
            mode="decimal"
            :minFractionDigits="2"
            :maxFractionDigits="2"
            placeholder="0.00"
            @update:modelValue="precioSeleccionadoIMEI = 0"
            fluid
            class="w-full"
          />
        </div>

        <!-- Precio Final -->
        <div class="bg-green-100 dark:bg-green-900 p-4 rounded-lg border-2 border-green-500">
          <p class="text-sm font-semibold text-green-800 dark:text-green-200">Precio a Aplicar:</p>
          <p class="text-2xl font-bold text-green-900 dark:text-green-100">
            {{ formatoMonedaRD(precioManualIMEI && precioManualIMEI > 0 ? precioManualIMEI : precioSeleccionadoIMEI) }}
          </p>
        </div>
      </div>

      <template #footer>
        <div class="flex justify-between gap-2">
          <Button
            label="Cancelar"
            icon="pi pi-times"
            severity="danger"
            outlined
            @click="visiblePrecioIMEI = false; imeiSeleccionadoData = null"
          />
          <Button
            label="Agregar Producto"
            icon="pi pi-check"
            severity="success"
            @click="fnAgregarIMEIConPrecio"
          />
        </div>
      </template>
    </Dialog>

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
<EnviarWhatsApp ref="enviarWhatsAppRef" :initialDatosWhatsApp="datosWhatsApp" />
 <!-- ////////////////////////////////////////////////////////////////////////////////////////// -->
    <Dock :model="filteredItemsMenuFixed" :position="posicionMenu" :class="menuClasses">
                <template #itemicon="{ item }" >
                  <a v-tooltip.top="item.label" href="#" class="p-dock-item-link" @click="onDockItemClick($event, item)">
                    <img :alt="item.label" :src="item.icon" style="width: 32px; height: 32px; object-fit: contain;" />
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
            
            <Button label="Recibir Equipo"  icon="pi pi-mobile" v-if="datosDefault.modo === 'CELULAR' && barraMenu.equipo" @click="fnRecibirEquipo" raised iconPos="top" size="small" />

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

      <!-- Distribución del crédito cuando es AMBAS -->
      <div v-if="quienCredito === 'AMBAS'" class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label class="font-semibold mb-1 text-gray-700 dark:text-gray-300">Monto a Institución</label>
          <InputNumber
            v-model="montoInstitucionCREDITO"
            mode="currency"
            currency="DOP"
            locale="es-DO"
            :min="0"
            :max="Number(totalCreditoConInteres || saldoCREDITO || 0)"
            @update:modelValue="fnRecalcularCreditoAmbas"
            class="w-full"
          />
        </div>
        <div>
          <label class="font-semibold mb-1 text-gray-700 dark:text-gray-300">Faltante a Cliente</label>
          <InputNumber
            v-model="montoClienteCREDITO"
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

          <!-- Institución (solo para Cotizaciones) -->
          <Column v-if="datosFactCoti.tipo === 'Cotizacion' || datosFactCoti.tipo === 'cotizacion'" field="entidad_financiera" header="INSTITUCIÓN" />

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

<!-- Modal de Selección: Orden Fast o Normal -->
<Dialog v-model:visible="visibleSeleccionTaller" modal :style="{ width: '30rem' }" :dismissableMask="false">
  <template #header>
    <div class="flex items-center gap-3">
      <div class="bg-blue-500 rounded-full p-2">
        <i class="pi pi-wrench text-white text-xl"></i>
      </div>
      <div>
        <h2 class="text-xl font-bold text-gray-800 m-0">Crear Orden de Taller</h2>
        <p class="text-sm text-gray-500 m-0">Seleccione el tipo de creación</p>
      </div>
    </div>
  </template>

  <div class="space-y-4">
    <div class="text-center mb-4">
      <p class="text-gray-600">¿Cómo desea crear la orden de taller?</p>
    </div>

    <!-- Botones de selección -->
    <div class="grid grid-cols-1 gap-3">
      <Button
        label="Orden Rápida ⚡"
        icon="pi pi-bolt"
        severity="warning"
        size="large"
        @click="abrirOrdenRapida"
        class="w-full p-4"
      >
        <template #default>
          <div class="flex flex-col items-center gap-2 w-full">
            <div class="flex items-center gap-2">
              <i class="pi pi-bolt text-2xl"></i>
              <span class="text-lg font-bold">Orden Rápida</span>
            </div>
            <span class="text-xs opacity-90">Creación rápida con campos mínimos</span>
          </div>
        </template>
      </Button>

      <Button
        label="Orden Completa 📋"
        icon="pi pi-file-edit"
        severity="info"
        size="large"
        @click="irACrearTaller"
        class="w-full p-4"
      >
        <template #default>
          <div class="flex flex-col items-center gap-2 w-full">
            <div class="flex items-center gap-2">
              <i class="pi pi-file-edit text-2xl"></i>
              <span class="text-lg font-bold">Orden Completa</span>
            </div>
            <span class="text-xs opacity-90">Formulario completo paso a paso</span>
          </div>
        </template>
      </Button>
    </div>
  </div>

  <template #footer>
    <div class="flex justify-end gap-2">
      <Button
        label="Cancelar"
        icon="pi pi-times"
        severity="secondary"
        outlined
        @click="visibleSeleccionTaller = false"
      />
    </div>
  </template>
</Dialog>

<!-- Modal de Orden Rápida -->
<Dialog v-model:visible="visibleOrdenRapida" modal :style="{ width: '50rem' }" :dismissableMask="false">
  <template #header>
    <div class="flex items-center gap-3">
      <div class="bg-orange-500 rounded-full p-2">
        <i class="pi pi-bolt text-white text-xl"></i>
      </div>
      <div>
        <h2 class="text-2xl font-bold text-gray-800 m-0">Orden Rápida</h2>
        <p class="text-sm text-gray-500 m-0">Crear orden de taller con campos mínimos</p>
      </div>
    </div>
  </template>

  <div class="space-y-4">
    <!-- Sección Cliente -->
    <div class="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-500">
      <h3 class="text-lg font-semibold mb-3 text-gray-700">
        <i class="pi pi-user mr-2"></i>Datos del Cliente
      </h3>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label for="cedulaRapidaVender" class="block text-sm font-medium text-gray-700 mb-2">
            Cédula
          </label>
          <InputGroup>
            <InputMask
              id="cedulaRapidaVender"
              v-model="ordenRapida.cedula"
              mask="999-9999999-9"
              placeholder="000-0000000-0"
              class="w-full"
            />
            <Button
              icon="pi pi-search"
              severity="info"
              @click="buscarClientePorCedula"
              v-tooltip.top="'Buscar cliente'"
            />
          </InputGroup>
        </div>

        <div>
          <label for="nombreRapidaVender" class="block text-sm font-medium text-gray-700 mb-2">
            Nombre <span class="text-red-500">*</span>
          </label>
          <InputText
            id="nombreRapidaVender"
            v-model="ordenRapida.nombre"
            placeholder="Nombre del cliente"
            class="w-full"
          />
        </div>

        <div>
          <label for="telefonoRapidaVender" class="block text-sm font-medium text-gray-700 mb-2">
            Teléfono
          </label>
          <InputMask
            id="telefonoRapidaVender"
            v-model="ordenRapida.telefono"
            mask="(999) 999-9999"
            placeholder="(000) 000-0000"
            class="w-full"
          />
        </div>
      </div>
    </div>

    <!-- Sección Equipo -->
    <div class="bg-purple-50 p-4 rounded-lg border-l-4 border-purple-500">
      <h3 class="text-lg font-semibold mb-3 text-gray-700">
        <i class="pi pi-mobile mr-2"></i>Datos del Equipo
      </h3>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label for="imeiRapidaVender" class="block text-sm font-medium text-gray-700 mb-2">
            IMEI
          </label>
          <InputGroup>
            <InputMask
              id="imeiRapidaVender"
              v-model="ordenRapida.imei"
              mask="999999999999999"
              placeholder="000000000000000"
              class="w-full"
            />
            <Button
              icon="pi pi-search"
              severity="help"
              @click="buscarEquipoPorIMEI"
              v-tooltip.top="'Consultar IMEI'"
            />
          </InputGroup>
        </div>

        <div>
          <label for="equipoRapidaVender" class="block text-sm font-medium text-gray-700 mb-2">
            Tipo de Equipo
          </label>
          <Select
            id="equipoRapidaVender"
            v-model="ordenRapida.equipo"
            :options="['CELULAR', 'TABLET', 'LAPTOP', 'PC']"
            placeholder="Seleccione tipo"
            class="w-full"
          />
        </div>

        <div>
          <label for="marcaRapidaVender" class="block text-sm font-medium text-gray-700 mb-2">
            Marca
          </label>
          <InputText
            id="marcaRapidaVender"
            v-model="ordenRapida.marca"
            placeholder="Marca del equipo"
            class="w-full"
          />
        </div>

        <div>
          <label for="modeloRapidaVender" class="block text-sm font-medium text-gray-700 mb-2">
            Modelo
          </label>
          <InputText
            id="modeloRapidaVender"
            v-model="ordenRapida.modelo"
            placeholder="Modelo del equipo"
            class="w-full"
          />
        </div>

        <div>
          <label for="claveRapidaVender" class="block text-sm font-medium text-gray-700 mb-2">
            Clave/PIN
          </label>
          <InputText
            id="claveRapidaVender"
            v-model="ordenRapida.clave"
            placeholder="Clave del dispositivo"
            class="w-full"
          />
        </div>
      </div>
    </div>

    <!-- Sección Reparación -->
    <div class="bg-green-50 p-4 rounded-lg border-l-4 border-green-500">
      <h3 class="text-lg font-semibold mb-3 text-gray-700">
        <i class="pi pi-wrench mr-2"></i>Datos de la Reparación
      </h3>

      <!-- Switch para incluir/separar costo de pieza -->
      <div class="mb-4 p-3 bg-white rounded-lg border border-green-200">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <i class="pi pi-cog text-green-600"></i>
            <label for="switchCostoPiezaVender" class="text-sm font-semibold text-gray-700">
              {{ incluyeCostoPieza ? 'Costo incluye pieza' : 'Costo de pieza separado' }}
            </label>
          </div>
          <ToggleSwitch
            v-model="incluyeCostoPieza"
            inputId="switchCostoPiezaVender"
            @change="ordenRapida.preciopiezas = '0.00'"
          />
        </div>
        <p class="text-xs text-gray-500 mt-1 ml-6">
          {{ incluyeCostoPieza ? 'La mano de obra ya incluye el costo de las piezas' : 'El costo de las piezas se suma a la mano de obra' }}
        </p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div class="md:col-span-2">
          <label for="fallaRapidaVender" class="block text-sm font-medium text-gray-700 mb-2">
            Falla Reportada <span class="text-red-500">*</span>
          </label>
          <Textarea
            id="fallaRapidaVender"
            v-model="ordenRapida.falla"
            rows="3"
            placeholder="Describa la falla del equipo..."
            class="w-full"
          />
        </div>

        <div>
          <label for="tecnicoRapidaVender" class="block text-sm font-medium text-gray-700 mb-2">
            Técnico Asignado
          </label>
          <Select
            id="tecnicoRapidaVender"
            v-model="ordenRapida.tecnico"
            :options="usuariosData.filter(u => u.nivel_seguridad === 'Tecnico')"
            optionLabel="nombre"
            placeholder="Seleccione técnico"
            class="w-full"
          />
        </div>

        <div>
          <label for="fechaEntregaRapidaVender" class="block text-sm font-medium text-gray-700 mb-2">
            Fecha de Entrega
          </label>
          <InputText
            id="fechaEntregaRapidaVender"
            v-model="ordenRapida.fecha_entrega"
            type="date"
            class="w-full"
          />
        </div>

        <div>
          <label for="manoobraRapidaVender" class="block text-sm font-medium text-gray-700 mb-2">
            {{ incluyeCostoPieza ? 'Costo Total (incluye pieza)' : 'Mano de Obra' }} <span class="text-red-500">*</span>
          </label>
          <InputNumber
            id="manoobraRapidaVender"
            v-model="ordenRapida.manodeobra"
            mode="decimal"
            :minFractionDigits="2"
            :maxFractionDigits="2"
            placeholder="0.00"
            class="w-full"
          />
        </div>

        <div v-if="!incluyeCostoPieza">
          <label for="piezasRapidaVender" class="block text-sm font-medium text-gray-700 mb-2">
            Costo Piezas
          </label>
          <InputNumber
            id="piezasRapidaVender"
            v-model="ordenRapida.preciopiezas"
            mode="decimal"
            :minFractionDigits="2"
            :maxFractionDigits="2"
            placeholder="0.00"
            class="w-full"
          />
        </div>
      </div>

      <!-- Total -->
      <div class="mt-4 p-3 bg-gray-100 rounded-lg">
        <div class="flex justify-between items-center">
          <span class="text-lg font-semibold text-gray-700">Total:</span>
          <span class="text-2xl font-bold text-green-600">
            ${{ incluyeCostoPieza
                ? parseFloat(ordenRapida.manodeobra || 0).toFixed(2)
                : (parseFloat(ordenRapida.manodeobra || 0) + parseFloat(ordenRapida.preciopiezas || 0)).toFixed(2)
            }}
          </span>
        </div>
        <p v-if="incluyeCostoPieza" class="text-xs text-gray-500 mt-1 text-right">
          <i class="pi pi-info-circle mr-1"></i>Costo incluye pieza
        </p>
        <p v-else class="text-xs text-gray-500 mt-1 text-right">
          <i class="pi pi-info-circle mr-1"></i>Mano de obra: ${{ parseFloat(ordenRapida.manodeobra || 0).toFixed(2) }} + Piezas: ${{ parseFloat(ordenRapida.preciopiezas || 0).toFixed(2) }}
        </p>
      </div>
    </div>
  </div>

  <template #footer>
    <div class="flex justify-end gap-2">
      <Button
        label="Cancelar"
        icon="pi pi-times"
        severity="secondary"
        outlined
        @click="visibleOrdenRapida = false"
      />
      <Button
        label="Crear Orden"
        icon="pi pi-check"
        severity="success"
        @click="crearOrdenRapida"
      />
    </div>
  </template>
</Dialog>

<!-- Modal de Selección de Formato de Impresión -->
<Dialog v-model:visible="visibleSeleccionFormato" modal :style="{ width: '30rem' }" :dismissableMask="false">
  <template #header>
    <div class="flex items-center gap-3">
      <div class="bg-indigo-500 rounded-full p-2">
        <i class="pi pi-print text-white text-xl"></i>
      </div>
      <div>
        <h2 class="text-2xl font-bold text-gray-800 m-0">Formato de Impresión</h2>
        <p class="text-sm text-gray-500 m-0">Seleccione el formato deseado</p>
      </div>
    </div>
  </template>

  <div class="space-y-4 p-4">
    <p class="text-gray-600 mb-4">¿En qué formato desea imprimir la orden de taller?</p>

    <!-- Opción 80mm -->
    <div
      class="border-2 border-gray-200 rounded-lg p-4 hover:border-indigo-500 hover:bg-indigo-50 cursor-pointer transition-all"
      @click="seleccionarFormatoImpresion('80mm')"
    >
      <div class="flex items-center gap-3">
        <div class="bg-indigo-100 rounded-full p-3">
          <i class="pi pi-receipt text-indigo-600 text-2xl"></i>
        </div>
        <div>
          <h4 class="text-lg font-semibold text-gray-800 m-0">Térmico 80mm</h4>
          <p class="text-sm text-gray-500 m-0">Ideal para impresoras térmicas de recibo</p>
        </div>
      </div>
    </div>

    <!-- Opción Carta -->
    <div
      class="border-2 border-gray-200 rounded-lg p-4 hover:border-indigo-500 hover:bg-indigo-50 cursor-pointer transition-all"
      @click="seleccionarFormatoImpresion('carta')"
    >
      <div class="flex items-center gap-3">
        <div class="bg-indigo-100 rounded-full p-3">
          <i class="pi pi-file text-indigo-600 text-2xl"></i>
        </div>
        <div>
          <h4 class="text-lg font-semibold text-gray-800 m-0">Carta (Letter)</h4>
          <p class="text-sm text-gray-500 m-0">Formato estándar para impresoras de oficina</p>
        </div>
      </div>
    </div>
  </div>

  <template #footer>
    <div class="flex justify-end">
      <Button
        label="Cancelar"
        icon="pi pi-times"
        severity="secondary"
        outlined
        @click="cancelarImpresion"
      />
    </div>
  </template>
</Dialog>

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
<div class="grid grid-cols-12 gap-4 mt-4 text-blue-600" id="campos">

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
<div class="col-span-12 sm:col-span-12 md:col-span-2 lg:col-span-2 xl:col-span-2 2xl:col-span-2">
                    <label for="telefono" class="block text-sm font-medium text-gray-700 dark:text-gray-400">Telefono</label>
                    <InputMask id="telefono" fluid v-model="datoscamposConduce.telefono" :mask="patronTelefono" :placeholder="patronTelefono" />
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

<Dialog v-model:visible="visibleListaImei" position="top" modal :style="{ width: '50rem' }" header="ListaImei">
  <template #header>
    <div class="inline-flex align-items-center justify-content-center gap-2">
      <span class="font-bold white-space-nowrap">ListaImei</span>
    </div>
  </template>

  <fieldset class="border p-3 rounded mb-2">
    <legend class="float-none w-auto px-2">ListaImei</legend>
    <div class="grid grid-cols-1  gap-4">
      <div>
        <InputText v-model="searchQueryIMEI" fluid  placeholder="Buscar Teléfono..." class="p-inputtext p-component" style="margin-bottom: 10px;" />
      </div>
      <div>

<DataTable :value="filteredImeiArray" 
           scrollable 
           scrollHeight="600px" 
           @rowSelect="onRowSelectImeiR"
           v-model:selection="selectedImei" 
           selectionMode="multiple" 
           dataKey="id" 
           paginator 
           :rows="10" 
           :rowsPerPageOptions="[5, 10, 20, 50]" 
           tableStyle="min-width: 50rem"
           >
      <!--      <Column selectionMode="multiple" headerStyle="width: 3rem"></Column> -->
<!--           <Column header="Options">
            <template #body="slotProps">
              <Button
                icon="pi pi-cog"
                @click="toggleImei($event, slotProps.data)"
                aria-haspopup="true"
                aria-controls="overlay_menu_factura"
              />
              <Menu
                ref="menuImei"
                id="overlay_menu_Imei"
                :model="itemsIMenuImei"
                :popup="true"
              />
            </template>
          </Column> -->
  <Column sortable v-for="col of columnsImei" :key="col.field" :field="col.field" :header="col.header"></Column>
</DataTable>
      </div>
    </div>
  </fieldset>

  <template #footer>
    <Button icon="pi pi-plus" severity="primary" label="Agregar Seleccionados" id="nuevoregistro" @click="agregarImeiSeleccionados" />
      <Button label="Cerrar" outlined severity="secondary" @click="visibleListaImei = false"  />
  </template>
</Dialog>
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
      <Button label="Aplicar" outlined severity="secondary" @click="fnCambiarClienteFactura"  />
      <Button label="Cerrar" outlined severity="secondary" @click="visibleClientes = false"  />
  </template>
</Dialog>


 <!-- ////////////////////////////////////////////////////////////////////////////////////////// -->
  <!-- ////////////////////////////////////////////////////////////////////////////////////////// -->
  <Dialog
    v-model:visible="recibirEquipo"
    modal
    header="📱 Recibir Equipo"
    :style="{ width: '50rem' }"
    :breakpoints="{ '1199px': '75vw', '575px': '90vw' }"
  >
    <template #header>
      <div class="flex items-center gap-2">
        <i class="pi pi-mobile text-teal-500 text-xl"></i>
        <span class="font-semibold text-lg">Registrar Equipo Recibido</span>
      </div>
    </template>

    <div class="p-4 space-y-6">

      <!-- Campo IMEI -->
      <div>
        <label for="imei" class="font-medium text-gray-700 dark:text-gray-300">IMEI</label>
        <InputGroup>
          <InputMask
            id="imei"
            v-model="datoscamposRecibirequipo.imei"
            mask="999999999999999"
            placeholder="123456789012345"
            @keydown.enter="fnBuscarImei"
            class="w-full"
          />
          <Button icon="pi pi-search" severity="warn" @click="fnBuscarImei" />
        </InputGroup>
      </div>

      <!-- Equipo -->
      <div>
        <label for="equipo" class="font-medium text-gray-700 dark:text-gray-300">Equipo</label>
        <InputGroup>
          <InputText id="equipo" v-model="datoscamposRecibirequipo.equipo" placeholder="Nombre del equipo" class="w-full" />
          <Button icon="pi pi-list" severity="info" @click="visibleSeleccionarProducto = true" v-tooltip.top="'Seleccionar de la lista de productos'" />
        </InputGroup>
      </div>

      <!-- Marca, Batería y Capacidad -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label for="marca" class="font-medium text-gray-700 dark:text-gray-300">Marca</label>
          <InputText id="marca" v-model="datoscamposRecibirequipo.marca" placeholder="Ej: Apple" class="w-full" />
        </div>
        <div>
          <label for="bateria" class="font-medium text-gray-700 dark:text-gray-300">Batería (%)</label>
          <InputNumber
            id="bateria"
            v-model="datoscamposRecibirequipo.bateria"
            :min="0"
            :max="100"
            placeholder="0-100"
            suffix="%"
            class="w-full"
          />
        </div>
        <div>
          <label for="capacidad" class="font-medium text-gray-700 dark:text-gray-300">Capacidad</label>
          <Dropdown id="capacidad" v-model="datoscamposRecibirequipo.capacidad" :options="opcionesCapacidad" placeholder="Seleccionar" class="w-full" />
        </div>
      </div>

      <!-- Precio compra / venta -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label for="preciocompra" class="font-medium text-gray-700 dark:text-gray-300">Precio Compra</label>
          <InputNumber
            id="preciocompra"
            v-model="datoscamposRecibirequipo.preciocompra"
            mode="currency"
            currency="DOP"
            locale="es-DO"
            class="w-full"
          />
        </div>
        <div>
          <label for="precioventa" class="font-medium text-gray-700 dark:text-gray-300">Precio Venta</label>
          <InputNumber
            id="precioventa"
            v-model="datoscamposRecibirequipo.precioventa"
            mode="currency"
            currency="DOP"
            locale="es-DO"
            class="w-full"
          />
        </div>
      </div>

      <!-- Precio mínimo / por mayor -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label for="preciomin" class="font-medium text-gray-700 dark:text-gray-300">Precio Mínimo</label>
          <InputNumber
            id="preciomin"
            v-model="datoscamposRecibirequipo.preciomin"
            mode="currency"
            currency="DOP"
            locale="es-DO"
            class="w-full"
          />
        </div>
        <div>
          <label for="precioxmayor" class="font-medium text-gray-700 dark:text-gray-300">Precio x Mayor</label>
          <InputNumber
            id="precioxmayor"
            v-model="datoscamposRecibirequipo.precioxmayor"
            mode="currency"
            currency="DOP"
            locale="es-DO"
            class="w-full"
          />
        </div>
      </div>

      <!-- Detalles -->
      <div>
        <label for="detalles" class="font-medium text-gray-700 dark:text-gray-300">Detalles</label>
        <Textarea id="detalles" v-model="datoscamposRecibirequipo.detalles" rows="4" placeholder="Detalles del equipo" class="w-full" />
      </div>

      <!-- Proveedor -->
      <div>
        <label for="proveedorRecibirEquipo" class="font-medium text-gray-700 dark:text-gray-300">Proveedor</label>
        <Select
          id="proveedorRecibirEquipo"
          v-model="proveedorRecibirSeleccionado"
          :options="proveedoresRecibirData"
          optionLabel="nombre"
          filter
          showClear
          placeholder="Seleccionar proveedor"
          class="w-full"
          @change="onProveedorRecibirChange"
        />
        <small v-if="proveedorRecibirSeleccionado?.rnc" class="text-slate-500 dark:text-slate-400">
          RNC: {{ proveedorRecibirSeleccionado.rnc }} | Tel: {{ proveedorRecibirSeleccionado.telefono || 'N/D' }}
        </small>
      </div>

      <!-- Vendedor -->
      <div>
        <label for="vendedor" class="font-medium text-gray-700 dark:text-gray-300">Vendedor</label>
        <InputText id="vendedor" v-model="datoscamposRecibirequipo.vendedor" placeholder="Nombre del vendedor" class="w-full" />
      </div>

      <!-- Cédula y Teléfono -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label for="cedula" class="font-medium text-gray-700 dark:text-gray-300">Cédula</label>
          <InputGroup>
            <InputText id="cedula" v-model="datoscamposRecibirequipo.cedula" placeholder="000-0000000-0" @keydown.enter="fnBuscarCedula" />
            <Button icon="pi pi-search" severity="warn" @click="fnBuscarCedula" />
          </InputGroup>
        </div>
        <div>
          <label for="telefono" class="font-medium text-gray-700 dark:text-gray-300">Teléfono</label>
          <InputMask
            id="telefono"
            v-model="datoscamposRecibirequipo.telefono"
            :mask="patronTelefono"
            :placeholder="patronTelefono"
            class="w-full"
          />
        </div>
      </div>

      <!-- Dirección -->
      <div>
        <label for="direccion" class="font-medium text-gray-700 dark:text-gray-300">Dirección</label>
        <Textarea id="direccion" v-model="datoscamposRecibirequipo.direccion" rows="3" placeholder="Dirección del vendedor" class="w-full" />
      </div>

      <!-- Nota -->
      <div>
        <label for="nota" class="font-medium text-gray-700 dark:text-gray-300">Nota</label>
        <Textarea id="nota" v-model="datoscamposRecibirequipo.nota" rows="3" placeholder="Notas adicionales" class="w-full" />
      </div>

    </div>

    <template #footer>
      <div class="flex justify-end gap-2">
        <Button label="Cancelar" icon="pi pi-times" text severity="danger" @click="recibirEquipo = false" />
        <Button label="Crear" icon="pi pi-check" severity="success" @click="funcionRecibirEquipo" />
      </div>
    </template>
  </Dialog>
 <!-- ////////////////////////////////////////////////////////////////////////////////////////// -->
 <!-- Modal Seleccionar Producto Existente -->
 <!-- ////////////////////////////////////////////////////////////////////////////////////////// -->
  <Dialog
    v-model:visible="visibleSeleccionarProducto"
    modal
    header="📦 Seleccionar Producto Existente"
    :style="{ width: '60rem' }"
    :breakpoints="{ '1199px': '75vw', '575px': '90vw' }"
  >
    <template #header>
      <div class="flex items-center gap-2">
        <i class="pi pi-box text-blue-500 text-xl"></i>
        <span class="font-semibold text-lg">Seleccionar Producto de CELULARES</span>
      </div>
    </template>

    <div class="p-4">
      <!-- Buscador -->
      <div class="mb-4">
        <InputText
          v-model="searchProducto"
          placeholder="Buscar por nombre, marca o modelo..."
          class="w-full"
          @input="filtrarProductos"
        >
          <template #prefix>
            <i class="pi pi-search"></i>
          </template>
        </InputText>
      </div>

      <!-- Lista de productos -->
      <DataTable
        :value="productosFiltrados"
        :rows="10"
        :paginator="true"
        scrollable
        scrollHeight="400px"
        selectionMode="single"
        @row-select="onProductoSelect"
        class="p-datatable-sm"
      >
        <Column field="nombre" header="Nombre" sortable></Column>
        <Column field="marca" header="Marca" sortable></Column>
        <Column field="modelo" header="Modelo" sortable></Column>
        <Column field="almacen" header="Almacén" sortable></Column>
        <Column field="stock" header="Stock" sortable>
          <template #body="slotProps">
            <span :class="{'text-red-500': slotProps.data.stock <= 0}">
              {{ slotProps.data.stock }}
            </span>
          </template>
        </Column>
        <Column field="precio_venta" header="Precio Venta" sortable>
          <template #body="slotProps">
            {{ formatCurrency(slotProps.data.precio_venta) }}
          </template>
        </Column>
        <Column header="Acción">
          <template #body="slotProps">
            <Button
              label="Seleccionar"
              icon="pi pi-check"
              size="small"
              @click="seleccionarProducto(slotProps.data)"
            />
          </template>
        </Column>
      </DataTable>
    </div>

    <template #footer>
      <div class="flex justify-end gap-2">
        <Button label="Cancelar" icon="pi pi-times" text severity="danger" @click="visibleSeleccionarProducto = false" />
      </div>
    </template>
  </Dialog>
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
<!-- ////////////////////////////////////////////////////////////////////////////////////////// -->
  <!-- Componentes de impresión PDF/Print -->
  <FacturaPdfPrint ref="facturaPdfPrintRef" />
  <CotizacionPdfPrint ref="cotizacionPdfPrintRef" />
  <TicketFacturaPdf ref="ticketFacturaPdfRef" />
  <TicketFacturaPrint ref="ticketFacturaPrintRef" />

  <!-- Componente de impresión Taller -->
  <ImpresoraTaller
    v-model:visible="visibleImpresoraTaller"
    :ordenData="ordenParaImprimir"
    :empresaData="datosEmpresa"
    :formatoImpresion="formatoImpresion"
  />
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
import Tag from 'primevue/tag';
import Checkbox from 'primevue/checkbox';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import EnviarWhatsApp from '../components/WhatsappModal.vue';
//import InvoicePrint from '../components/Factura.vue'
import TecladoVirtual from '../components/TecladoVirtual.vue'

import AwesompleteFull from 'awesomplete';
import 'awesomplete/awesomplete.css';

import Keyboard from "simple-keyboard";
import "simple-keyboard/build/css/index.css";


import AutoCompletar from '@/components/AutoCompletar.vue'
import FacturaPdfPrint from '@/components/FacturaPdfPrint.vue'
import CotizacionPdfPrint from '@/components/CotizacionPdfPrint.vue'
import TicketFacturaPdf from '@/components/TicketFacturaPdf.vue'
import TicketFacturaPrint from '@/components/TicketFacturaPrint.vue'
import ImpresoraTaller from '@/components/ImpresoraTaller.vue'

import { useLoading } from 'vue-loading-overlay';
const $loading = useLoading();
let loader = null;

const router = useRouter();

//router.push('/ferreteria')

import { peticiones,generadorCodigo,generarCodigoUnico,formatoMonedaRD, arrayToObjetoFromTabla,mensajetoast,actualizarLocalStorage,nfecha,peticionesFetch,encryptarPassword,enviarDatosPorPost,verificaAutentificado,enviarSolicitudGet,extraerNumerosEntreParentesis,stringParentesis, agregarDiasalaFechaActual,formatearFecha,crearGasto,crearTablaSiNoExiste,crearTransferencia,extraerCamposDeObjeto,asientoDiario,enviarDatosLocalStorage,envioElectron,generarTablaFromStringJSON,agregarDiasAFecha,permisosPagina,buscarDatosIMEI,crearNotaCredito,peticionesFetchOffline,generarCodigoUnico4Digitos,arrayToObjetoFromTablaOffline,sincronizarStockProductoPorImeiDisponible } from '@/funciones/funciones.js';
import { facturaNueva,cotizacionNueva,facturaActualizar,restarStock } from '@/funciones/funcionesVentas.js';
//import bcrypt from 'bcryptjs';
//import config from '../../../../resources/config.json';
import LoadingOverlay from '../Loading/LoadingOverlay.vue';
import noIMG from '@/assets/img/noimagen.jpg';
const toast = useToast();
/****************************************************/
const existeImei = ref(false)
const existeImeiProducto = ref({})
/****************************************************/
const facturaPdfPrintRef = ref(null)
const cotizacionPdfPrintRef = ref(null)
const ticketFacturaPdfRef = ref(null)
const ticketFacturaPrintRef = ref(null)
/****************************************************/
// Variables para conversión de cotización
const visibleConvertirCotizacion = ref(false);
const accionConversionCotizacion = ref(null);
const visibleComprobanteConversion = ref(false);
const comprobanteSeleccionadoConversion = ref(null);
/****************************************************/
// Variables para Orden de Taller
const visibleSeleccionTaller = ref(false);
const visibleOrdenRapida = ref(false);
const incluyeCostoPieza = ref(false);
const ordenRapida = ref({
  cedula: '',
  nombre: '',
  telefono: '',
  imei: '',
  marca: '',
  modelo: '',
  equipo: 'CELULAR',
  falla: '',
  clave: '',
  tecnico: null,
  manodeobra: '0.00',
  preciopiezas: '0.00',
  total: '0.00',
  fecha_entrega: nfecha('fechaManana')
});
const usuariosData = ref([]);
const clientesData = ref([]);
const visibleImpresoraTaller = ref(false);
const visibleSeleccionFormato = ref(false);
const ordenParaImprimir = ref(null);
const formatoImpresion = ref('80mm');
/****************************************************/
/*import Awesomplete from 'awesomplete'
import 'awesomplete/awesomplete.css';*/
import Awesomplete from '@/components/Awesomplete.vue';
import OptionButtonTM from '@/components/OptionButtomTM.vue';
/****************************************************/
import {useDatosEmpresa} from '@/stores'
const datosEmpresa = useDatosEmpresa();
/****************************************************/
const intitucionesData = ref([])
const intitucionesDataNames = ref([])
const porcientoInstitucionAplicado = ref(0)
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
      if(cliente.value.precio_fijado === 'Normal'){
        productosVenta.value.forEach(producto => {
          const datosProd = productosArraySinModificaciones.value.find(prod => prod.codigo === producto.codigo);
          if (datosProd) {
            producto.precio_venta = Number(datosProd.precio_venta) || 0;
            producto.precio_final = Number(datosProd.precio_final || datosProd.precio_venta) || 0;
          }
        });
            toast.add({ severity: 'warn', summary: 'Precio Cambiado', detail: 'Precio Normal Seleccionado', life: 3000 });
        precioFijado.value = 'Normal'
      }else if(cliente.value.precio_fijado === 'Minimo'){
        productosVenta.value.forEach(producto => {
          const datosProd = productosArraySinModificaciones.value.find(prod => prod.codigo === producto.codigo);
          if (datosProd) {
            const precioMin = Number(datosProd.precio_min) || Number(datosProd.precio_venta) || 0;
            producto.precio_venta = precioMin;
            producto.precio_final = precioMin;
          }
        });
            toast.add({ severity: 'warn', summary: 'Precio Cambiado', detail: 'Precio Mínimo Seleccionado', life: 3000 });
        precioFijado.value = 'Minimo'
      }else if(cliente.value.precio_fijado === 'PorMayor'){

        productosVenta.value.forEach(producto => {
          const datosProd = productosArraySinModificaciones.value.find(prod => prod.codigo === producto.codigo);
          if (datosProd) {
            const precioXmayor = Number(datosProd.precio_xmayor) || Number(datosProd.precio_venta) || 0;
            producto.precio_venta = precioXmayor;
            producto.precio_final = precioXmayor;
          }
        });
            toast.add({ severity: 'warn', summary: 'Precio Cambiado', detail: 'Precio Al Por Mayor Seleccionado', life: 3000 });

       precioFijado.value = 'Al Por Mayor'

      }else{
        productosVenta.value.forEach(producto => {
          const datosProd = productosArraySinModificaciones.value.find(prod => prod.codigo === producto.codigo);
          if (datosProd) {
            producto.precio_venta = Number(datosProd.precio_venta) || 0;
            producto.precio_final = Number(datosProd.precio_final || datosProd.precio_venta) || 0;
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
const visibleClientes = ref(false)
const menuModel = ref('')
/****************************************************/
const barraMenu = ref({})
/****************************************************/
const toastLeft = ref(null)
/****************************************************/
const recibirEquipo = ref(false);
const datoscamposRecibirequipo = ref({});
const proveedoresRecibirData = ref([]);
const proveedorRecibirSeleccionado = ref(null);
const opcionesCapacidad = ref(['32GB', '64GB', '128GB', '256GB', '512GB', '1TB', '2TB']);
/****************************************************/
const visibleSeleccionarProducto = ref(false);
const productosCelulares = ref([]);
const productosFiltrados = ref([]);
const searchProducto = ref('');
const productoSeleccionadoExistente = ref(null);
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
const visibleListaImei = ref(false)
const listaImeiArray = ref([])
const columnsImei = ref([])
const searchQueryIMEI = ref('')
const selectedImei = ref([]); 
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
const patronTelefono = ref(null);
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
    //incluirImpuesto.value = true

  productosVenta.value.forEach(producto => {
    if(producto.nombre != 'DESCUENTO APLICADO'){
        // Si tiene precio personalizado, aplicar impuesto sobre el precio base personalizado
        if(producto.precio_personalizado){
          const precioTotalOriginal = Number(producto.precio_base_personalizado) || 0;
          const impuestoValor = Number(impuestoSistema.value) || 18;

          // Calcular precio base sin impuesto (desglosando el precio total)
          const precioBase = precioTotalOriginal / (1 + impuestoValor / 100);
          const montoImpuesto = precioTotalOriginal - precioBase;

          producto.impuestos = impuestoValor;
          producto.impuesto = montoImpuesto.toFixed(2);
          producto.impuesto_venta = montoImpuesto.toFixed(2);
          producto.precio_venta = precioBase.toFixed(2);
          producto.precio_final = precioTotalOriginal;
          producto.total = precioTotalOriginal * Number(producto.cantidad);
          producto.tipo_impuesto = 'Incluido';
        } else {
          fmImpuestoIncluido(producto.codigo)
        }
    }

  });


    // fnincluirImpuesto()
  }else if(tipoImpuestoFactura.value === 'AGREGADO'){
    agregarImpuesto.value = true

    productosVenta.value.forEach(producto => {
      if(producto.nombre != 'DESCUENTO APLICADO'){
        // Si tiene precio personalizado, agregar impuesto sobre el precio base personalizado
        if(producto.precio_personalizado){
          const precioBase = Number(producto.precio_base_personalizado) || 0;
          const impuestoValor = Number(impuestoSistema.value) || 18;
          const montoImpuesto = precioBase * (impuestoValor / 100);
          const precioConImpuesto = precioBase + montoImpuesto;

          producto.impuestos = impuestoValor;
          producto.impuesto = montoImpuesto.toFixed(2);
          producto.impuesto_venta = montoImpuesto.toFixed(2);
          producto.precio_venta = precioBase;
          producto.precio_final = precioConImpuesto.toFixed(2);
          producto.total = precioConImpuesto * Number(producto.cantidad);
          producto.tipo_impuesto = 'Agregado';
        } else {
          fnagregarImpuesto()
        }
     }

    });


  }else{
    incluirImpuesto.value = false
    agregarImpuesto.value = false
    comprobante.value = 'NORMAL'
    fnCambiarComprobante()
      //fnResetComprobante();

  productosVenta.value.forEach(producto => {

   if (producto.nombre != 'DESCUENTO' && producto.nombre != 'DESCUENTO APLICADO') {

     // Si el producto tiene precio personalizado, mantenerlo
     if (producto.precio_personalizado) {
       producto.precio_venta = producto.precio_base_personalizado;
       producto.impuestos = 0;
       producto.impuesto = 0;
       producto.impuesto_venta = 0;
       producto.precio_final = Number(producto.precio_base_personalizado) || 0;
       producto.total = (Number(producto.precio_base_personalizado) || 0) * (Number(producto.cantidad) || 0);
       producto.tipo_impuesto = 'Sin Imp.';
     } else if(producto.tipo_impuesto){
       // Restaurar precio_venta original desde productosArraySinModificaciones
       const datosProd = productosArraySinModificaciones.value.find(prod => prod.codigo === producto.codigo);
       if (datosProd) {
         let precioOriginal = Number(datosProd.precio_venta) || 0;
         if (precioFijado.value === 'Minimo') {
           precioOriginal = Number(datosProd.precio_min) || precioOriginal;
         } else if (precioFijado.value === 'Al Por Mayor') {
           precioOriginal = Number(datosProd.precio_xmayor) || precioOriginal;
         }
         producto.precio_venta = precioOriginal;
       }
       producto.impuestos = 0;
       producto.impuesto = 0;
       producto.impuesto_venta = 0;
       producto.precio_final = Number(producto.precio_venta) || 0;
       producto.total = (Number(producto.precio_venta) || 0) * (Number(producto.cantidad) || 0);
       producto.tipo_impuesto = 'Sin Imp.';
     }

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
const datosIMEI = ref('')
const imeiArray = ref([])
const indexCelular = ref(null)
const searchQuery = ref('')
/****************************************************/
const electrodomesticosArray = ref([])
const datosElectrodomestico = ref({})
/****************************************************/
const enviarWhatsAppRef = ref(null);
const datosWhatsApp = ref({
  nombre: 'John Doe',
  numero: '123456789',
  texto: 'Hola, este es un mensaje predefinido.'
});

const showWhatsAppModal = async () => {
  if (enviarWhatsAppRef.value) {
    if (datosFactCoti.value.tipo === 'Factura') {
      try {
/*        const response = await fetch(`${link.value}${api.value}/datoscampo/facturas/no_factura/${datosFactCoti.value.numero}`, {
          method: 'GET',
          headers: {
            'Authorization': `${tokenCifrado.value}`
          }
        });*/

      const datosFactura = await peticionesFetchOffline('getDataByField', 'facturas','no_factura',datosFactCoti.value.numero);

  
       const mensajaeEnviar = `Hola *${datosFactura.nombre_cliente}* Aquí tiene un enlace para ver o descargar su *Factura* ${datosConfiguracion.value.urlsitio}receipt/factura?factura=${datosFactura.no_factura}`;

          datosWhatsApp.value.nombre = datosFactura.nombre_cliente;
          datosWhatsApp.value.numero = datosFactura.telefono_cliente;
          datosWhatsApp.value.texto = mensajaeEnviar;
          enviarWhatsAppRef.value.updateDatosWhatsApp(datosWhatsApp.value);
          enviarWhatsAppRef.value.visible = true;

      } catch (error) {
        console.error('Error fetching datosFactura:', error);
      }
    }
  }
};
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
const searchQueryImei = ref('');
const selectedProduct = ref(null);
const cm = ref(null);
  const columns = [
    { field: 'codigo', header: 'Código' },
    { field: 'nombre', header: 'Nombre' },
    { field: 'almacen', header: 'Almacén' },
    { field: 'stock', header: 'Stock' },
    { field: 'precio_venta', header: 'Precio' },
  ];
  const columnsIMEI = [
    { field: 'imei', header: 'Imei' },
    { field: 'id_equi', header: 'ID_Equipo' },
    { field: 'equipo', header: 'Equipo' },
  ];

/****************************************************/
const onRowSelect = (event) => {
  // Validar que el producto sea del almacén actual
  if (event.data.almacen !== datosEmpresa.empresa.nombre) {
    visibleBuscarProducto.value = false;

    Swal.fire({
      title: 'Producto de otro almacén',
      html: `
        <p>Este producto pertenece al almacén: <strong>${event.data.almacen}</strong></p>
        <p>No puedes agregar productos de otros almacenes.</p>
        <p class="text-sm text-gray-600 mt-2">Solo puedes consultar productos de otros almacenes, pero no agregarlos a la venta.</p>
      `,
      icon: 'warning',
      confirmButtonText: 'Entendido',
      confirmButtonColor: '#3085d6'
    }).then(() => {
      visibleBuscarProducto.value = true;
    });
    return;
  }

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
//onRowSelectIMEI
const onRowSelectIMEI = async (event) => {
  visibleBuscadorIMEI.value = false;

  // Verificar si el IMEI ya está en la lista
  const imeiArrayLocalStorage = JSON.parse(window.localStorage.getItem('arrayIMEI')) || [];
  const verifica = imeiArrayLocalStorage.find(equipo => equipo.imei == event.data.imei);

  if (verifica) {
    toast.add({ severity: 'error', summary: 'Upps', detail: `Equipo ${event.data.equipo} ya está en la lista`, life: 3000 });
    return;
  }

  // Obtener datos del producto
  const datosEquipo = await peticionesFetchOffline('getDataByField', 'productos', 'id', event.data.id_equi);

  if (datosEquipo) {
    // Guardar datos del IMEI seleccionado
    imeiSeleccionadoData.value = {
      imei: event.data.imei,
      id_equi: event.data.id_equi,
      datosEquipo: datosEquipo,
      precio_compra: parseFloat(event.data.precio_compra) || parseFloat(datosEquipo.precio_compra) || 0,
      precio_venta: parseFloat(event.data.precio_venta) || 0,
      precio_min: parseFloat(event.data.precio_min) || 0,
      precio_xmayor: parseFloat(event.data.precio_xmayor) || 0,
      capacidad: event.data.capacidad || '64GB'
    };

    // Inicializar precio seleccionado con precio_venta por defecto
    precioSeleccionadoIMEI.value = imeiSeleccionadoData.value.precio_venta;
    precioManualIMEI.value = 0;

    // Mostrar modal de selección de precio
    visiblePrecioIMEI.value = true;
  }
};

// Función para agregar el IMEI con el precio seleccionado
const fnAgregarIMEIConPrecio = () => {
  if (!imeiSeleccionadoData.value) return;

  const esElectrodomestico = imeiSeleccionadoData.value.esElectrodomestico || false;
  const storageKey = esElectrodomestico ? 'arrayElectrodomesticos' : 'arrayIMEI';
  const localStorageArray = JSON.parse(window.localStorage.getItem(storageKey)) || [];
  const { imei, id_equi, datosEquipo } = imeiSeleccionadoData.value;
  const costoDesdeImei = parseFloat(imeiSeleccionadoData.value.precio_compra) || parseFloat(datosEquipo.precio_compra) || 0;

  // Determinar el precio a usar
  const precioFinal = precioManualIMEI.value > 0 ? precioManualIMEI.value : precioSeleccionadoIMEI.value;

  // Agregar a localStorage
  if (esElectrodomestico) {
    localStorageArray.push({ serial: imei, id_equi });
  } else {
    localStorageArray.push({ imei, id_equi });
  }

  // Crear producto individual para este IMEI (no agrupar)
  const productoNuevo = { ...datosEquipo };
  productoNuevo.cantidad = 1;
  productoNuevo.descuento = 0.00;
  productoNuevo.precio_compra = costoDesdeImei;
  productoNuevo.costo = costoDesdeImei;
  productoNuevo.precio_personalizado = true; // Marcar como precio personalizado
  productoNuevo.precio_base_personalizado = precioFinal; // Guardar el precio base
  const capacidadTexto = imeiSeleccionadoData.value.capacidad ? ` - ${imeiSeleccionadoData.value.capacidad}` : '';
  productoNuevo.nombre = datosEquipo.nombre + capacidadTexto + ` (${imei})`;
  productoNuevo.imei = imei;
  productoNuevo.lista_imei = imei;

  // Manejar impuestos según configuración actual
  const impuestoValor = Number(impuestoSistema.value) || 18;

  if (tipoImpuestoFactura.value === 'INCLUIDO') {
    // Impuesto incluido: el precio final es el que seleccionó, desglosar el impuesto
    const precioTotalOriginal = precioFinal;
    const precioBase = precioTotalOriginal / (1 + impuestoValor / 100);
    const montoImpuesto = precioTotalOriginal - precioBase;

    productoNuevo.impuestos = impuestoValor;
    productoNuevo.impuesto = montoImpuesto.toFixed(2);
    productoNuevo.impuesto_venta = montoImpuesto.toFixed(2);
    productoNuevo.precio_venta = precioBase.toFixed(2);
    productoNuevo.precio_final = precioTotalOriginal;
    productoNuevo.total = precioTotalOriginal * 1;
    productoNuevo.ganancia_pura = Number(precioBase.toFixed(2)) - costoDesdeImei;
    productoNuevo.tipo_impuesto = 'Incluido';
  } else if (tipoImpuestoFactura.value === 'AGREGADO') {
    // Impuesto agregado: el precio base es el que seleccionó, agregar impuesto encima
    const precioBase = precioFinal;
    const montoImpuesto = precioBase * (impuestoValor / 100);
    const precioConImpuesto = precioBase + montoImpuesto;

    productoNuevo.impuestos = impuestoValor;
    productoNuevo.impuesto = montoImpuesto.toFixed(2);
    productoNuevo.impuesto_venta = montoImpuesto.toFixed(2);
    productoNuevo.precio_venta = precioBase;
    productoNuevo.precio_final = precioConImpuesto.toFixed(2);
    productoNuevo.total = precioConImpuesto * 1;
    productoNuevo.ganancia_pura = precioBase - costoDesdeImei;
    productoNuevo.tipo_impuesto = 'Agregado';
  } else {
    // Sin impuesto
    productoNuevo.impuestos = 0;
    productoNuevo.impuesto = 0;
    productoNuevo.impuesto_venta = 0;
    productoNuevo.precio_venta = precioFinal;
    productoNuevo.precio_final = precioFinal;
    productoNuevo.total = precioFinal * 1;
    productoNuevo.ganancia_pura = precioFinal - costoDesdeImei;
    productoNuevo.tipo_impuesto = 'Sin Imp.';
  }

  delete productoNuevo.otro;
  delete productoNuevo.caracteristicas;

  // Agregar como nueva línea (no agrupar con productos existentes)
  productosVenta.value.push(productoNuevo);

  window.localStorage.setItem(storageKey, JSON.stringify(localStorageArray));
  window.localStorage.setItem('productosVenta', JSON.stringify(productosVenta.value));

  toast.removeAllGroups();
  const tipoEquipo = esElectrodomestico ? 'Electrodoméstico' : 'Equipo';
  toast.add({ severity: 'success', summary: 'Agregado', detail: `${tipoEquipo} ${datosEquipo.nombre} agregado con precio ${formatoMonedaRD(precioFinal)}`, life: 3000 });

  calcularTotalFactura();

  // Cerrar modal
  visiblePrecioIMEI.value = false;
  imeiSeleccionadoData.value = null;
};
/****************************************************/
const datosDefault = ref({})
/****************************************************/
import inicioImg from '@/assets/Botones/inicio.png';
import productoImg from '@/assets/Botones/producto.png';
import facturaImg from '@/assets/Botones/factura.png';
import borrarImg from '@/assets/Botones/borrar.png';
import procesoImg from '@/assets/Botones/proceso.png';
import movilImg from '@/assets/Botones/movil.png';
import rapidoImg from '@/assets/Botones/rapido.png';
import descuentoImg from '@/assets/Botones/descuento.png';
import facturarImg from '@/assets/Botones/facturar.png';
import menuImg from '@/assets/Botones/menu.png';
import fabricaImg from '@/assets/Botones/fabrica.png';
import touchImg from '@/assets/Botones/touch.png';
import mesaImg from '@/assets/Botones/mesa.png';
import repararImg from '@/assets/Botones/reparar.png';
import cobrarImg from '@/assets/Botones/cobrar.png';
import notaCreditoImg from '@/assets/Botones/notaCredito.png';
/****************************************************/
const posicionMenu = ref('bottom')
/****************************************************/
const cambiarPosicionMenu = () => {
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
    productoOtro.value.imei = '';
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
        label: 'Taller',
        icon: repararImg,
        visible: computed(() => datosDefault.value.modo === 'CELULAR'),
        command: () => {
            visibleSeleccionTaller.value = true;
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
        label: 'Recibir Equipo',
        icon: movilImg,
        visible: computed(() => datosDefault.value.modo === 'CELULAR'),
        command: async () => {
          datoscamposRecibirequipo.value = await arrayToObjetoFromTablaOffline('recibirequipo');
          datoscamposRecibirequipo.value.bateria = 100;
          datoscamposRecibirequipo.value.capacidad = '64GB';
          recibirEquipo.value = true;
            //fnRecibirEquipo()
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

/*    {
        label: 'Facturar',
        icon: facturarImg,
        visible:true,
         command: () => {
            visiblecobrar.value = true
        }
    },*/
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
const indiceBusquedaProductos = ref([]);
const LIMITE_SUGERENCIAS_BUSQUEDA = 80;
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
const listaAlmacenes = ref([]);
const selectedAlmacenBusqueda = ref(null);
const productosDelAlmacen = ref([]);
/****************************************************/
  const filteredProducts = computed(() => {
    let filtered = productosDelAlmacen.value;

    // Filtrar por búsqueda
    if (searchQuery.value) {
      filtered = filtered.filter(product => {
        return Object.values(product).some(value =>
          String(value).toLowerCase().includes(searchQuery.value.toLowerCase())
        );
      });
    }

    return filtered;
  });
/****************************************************/
  const filteredIMEI = ref([])
  const filteredImeiArray = ref([])
/****************************************************/
  //imeiArray.value
/*  const filteredIMEI = computed(() => {
    if (!searchQueryImei.value) return imeiArray.value;
    return imeiArray.value.filter(product => {
      return Object.values(product).some(value =>
        String(value).toLowerCase().includes(searchQueryImei.value.toLowerCase())
      );
    });
  });*/
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
const optionsSearch = ref(['nombre', 'barcode','codigo','imei']);
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
/****************************************************/
const value = ref('');
const items = ref([]);
const searchMode = ref('nombre');
const filteredItems = ref([]);
const datosConfiguracion = ref({});
const productosVenta = ref([]);
const totalfactura = ref(0);
const clickedButton = ref('nombre');
/****************************************************/
const visibleCobro = ref(true);
const visibleprecio = ref(false);
const modalMedidas = ref(false);
const visiblecobrar = ref(false);
const visiblecliente = ref(false);
const busquedaProductosDocumento = ref('' );
const visiblePOS = ref(false);
const visibleMESAS = ref(false);
const visiblefatcoti = ref(false);
const visibleComprobantes = ref(false);
const visibleProductosDocumento = ref(false);
const productosDocumentoSeleccionado = ref([]);
const visiblebuscarImei = ref(false);
const visibledinero = ref(false);
const visibleDescuento = ref(false);
const visibleBuscarPrecio = ref(false);
const visibleOtroArticulo = ref(false);
const visibleListadoImei = ref(false);
const visibleBuscarProducto = ref(false);
const visibleBuscadorIMEI = ref(false);
const visibleReemplazarImei = ref(false);
const imeiActualReemplazo = ref('' );
const imeiNuevoSeleccionado = ref(null);
const imeisDisponiblesReemplazo = ref([]);
/****************************************************/
const visiblePrecioIMEI = ref(false);
const precioSeleccionadoIMEI = ref(0);
const precioManualIMEI = ref(0);
const imeiSeleccionadoData = ref(null);
const visibleSideBar = ref(false);
const visibleNotaCredito = ref(false);
const visibleNota = ref(false);
const visibleCredito = ref(false);
const visibleInstitucionCotizacion = ref(false);
const institucionCotizacion = ref('NINGUNA');
const visibleEditarInstCotizacion = ref(false);
const editInstCotizacion = ref('NINGUNA');
const visibleQuienPagaCotizacion = ref(false);
const quienPagaCotizacion = ref('INSTITUCION');
const montoInstitucionCotizacion = ref(0);
const montoClienteCotizacion = ref(0);
const showWhatsapp = ref(false);
const productoSeleccionado = ref({});
const position = "top";
const impuestoSistema = ref(18);
const ventasXMayor = true;
const otroPrecio = true;
const tabladefault = ref('');
/****************************************************/
const listadoImei = ref([])
/****************************************************/
const checkedvermascampos = ref(false)
const checkededitarclientes = ref(false)
const checkedpormayor = ref(false)
const clienteSeleccionado = ref(null)
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
/****************************************************/
const fnVerProductosDocumento = async () => {
  const tipo = datosFactCoti.value.tipo;
  const numero = datosFactCoti.value.numero;

  if (!tipo || !numero) {
    toast.add({ severity: 'warn', summary: 'Atención', detail: 'Debe seleccionar un documento', life: 3000 });
    return;
  }

  const tablaMap = {
    'Factura': 'facturas',
    'Cotizacion': 'cotizacion',
    'Pre-Factura': 'pre_facturas',
    'Orden': 'ordenes',
    'Apartado': 'apartados'
  };

  const campoMap = {
    'Factura': 'no_factura',
    'Cotizacion': 'no_cotizacion',
    'Pre-Factura': 'no_factura',
    'Orden': 'no_orden',
    'Apartado': 'no_factura'
  };

  try {
    const tabla = tablaMap[tipo];
    const campo = campoMap[tipo];

    if (!tabla || !campo) {
      toast.add({ severity: 'warn', summary: 'Atención', detail: 'Tipo de documento no soportado', life: 3000 });
      return;
    }

    const datosDocumento = await peticionesFetchOffline('getDataByField', tabla, campo, numero);
    const productos = datosDocumento?.productos ? parseProductos(datosDocumento.productos) : [];

    productosDocumentoSeleccionado.value = productos.map(prod => ({
      ...prod,
      cantidad: Number(prod.cantidad) || 0,
      precio_venta: Number(prod.precio_venta ?? prod.precio_final ?? 0).toFixed(2),
      total: Number(prod.total ?? ((Number(prod.cantidad) || 0) * Number(prod.precio_venta ?? prod.precio_final ?? 0))).toFixed(2)
    }));
    visibleProductosDocumento.value = true;
  } catch (error) {
    console.error('Error al cargar productos del documento:', error);
    toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar los productos del documento', life: 3000 });
  }
};
const nombreFacturaSelectedNombre = (event)=>{
  datosFactCoti.value.numero = event.value.value

}
/****************************************************/
const rnc = ref('');
/****************************************************/
const productosDocumentoFiltrados = computed(() => {
  const termino = String(busquedaProductosDocumento.value || '').toLowerCase().trim();

  if (!termino) {
    return productosDocumentoSeleccionado.value;
  }

  return productosDocumentoSeleccionado.value.filter(prod =>
    String(prod.codigo || '').toLowerCase().includes(termino) ||
    String(prod.nombre || '').toLowerCase().includes(termino) ||
    String(prod.categoria || '').toLowerCase().includes(termino)
  );
});
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

/****************************************************/
const itemsIMenuImei = ref([]);
const menuImei = ref(null);
const currentRowData = ref(null);
const toggleImei = (event, rowData) => {
currentRowData.value = rowData;
itemsIMenuImei.value = [
{ label: 'Agregar', icon: 'pi pi-check', command: () => { 
console.log("currentRowData.value", currentRowData.value);


} },

];
menuImei.value.toggle(event);
};
/****************************************************/

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
const estadoFactura = ref('Pendiente');
const institucion = ref('Ninguna');
const subtotal = ref(0.00);
const descuento = ref(0.00);
const impuesto = ref(0.00);
const total = ref(0.00);
const total_institucion = ref(0.00);
const total_cliente = ref(0.00);
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
const montoInstitucionCREDITO = ref(0)
const montoClienteCREDITO = ref(0)
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
watchEffect(()=>{
  if(recibirEquipo.value){
    datoscamposRecibirequipo.value.preciocompra = '0.00'
    datoscamposRecibirequipo.value.precioventa = '0.00'
    datoscamposRecibirequipo.value.fecha = nfecha('fecha')
    datoscamposRecibirequipo.value.estado = 'DISPONIBLE'
    productoSeleccionadoExistente.value = null
  }
})
/****************************************************/
watchEffect(()=>{
  if(visibleSeleccionarProducto.value){
    cargarProductosCelulares()
    searchProducto.value = ''
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
const cambiosQuienCredito = (selected)=>{
  if(selected.value === 'INSTITUCION'){
     if(institucion.value === 'Ninguna'){
        institucion.value = intitucionesDataNames.value[0]
     }
     montoInstitucionCREDITO.value = Number((Number(totalCreditoConInteres.value) || Number(saldoCREDITO.value) || 0).toFixed(2))
     montoClienteCREDITO.value = 0
  } else if (selected.value === 'AMBAS') {
     if(institucion.value === 'Ninguna'){
        institucion.value = intitucionesDataNames.value[0]
     }
     const saldoBase = Number(totalCreditoConInteres.value) || Number(saldoCREDITO.value) || 0
     if (!montoInstitucionCREDITO.value || Number(montoInstitucionCREDITO.value) <= 0) {
       montoInstitucionCREDITO.value = Number(saldoBase.toFixed(2))
     }
     const restante = saldoBase - Number(montoInstitucionCREDITO.value || 0)
     montoClienteCREDITO.value = Number(Math.max(0, restante).toFixed(2))
  } else {
     montoInstitucionCREDITO.value = 0
     montoClienteCREDITO.value = Number((Number(totalCreditoConInteres.value) || Number(saldoCREDITO.value) || 0).toFixed(2))
  }

}
/****************************************************/
const fnRecalcularCreditoAmbas = () => {
  const saldoBase = Number(totalCreditoConInteres.value) || Number(saldoCREDITO.value) || 0
  if (quienCredito.value !== 'AMBAS') {
    if (quienCredito.value === 'INSTITUCION') {
      montoInstitucionCREDITO.value = Number(saldoBase.toFixed(2))
      montoClienteCREDITO.value = 0
    } else {
      montoInstitucionCREDITO.value = 0
      montoClienteCREDITO.value = Number(saldoBase.toFixed(2))
    }
    return
  }

  let institucionMonto = Number(montoInstitucionCREDITO.value || 0)
  if (institucionMonto < 0) institucionMonto = 0
  if (institucionMonto > saldoBase) institucionMonto = saldoBase

  montoInstitucionCREDITO.value = Number(institucionMonto.toFixed(2))
  montoClienteCREDITO.value = Number((saldoBase - institucionMonto).toFixed(2))
}
/****************************************************/
const cambiosQuienPagaCotizacion = (selected) => {
  const totalCoti = Number(total.value) || 0;
  if (selected.value === 'INSTITUCION') {
    montoInstitucionCotizacion.value = Number(totalCoti.toFixed(2));
    montoClienteCotizacion.value = 0;
  } else if (selected.value === 'AMBAS') {
    if (!montoInstitucionCotizacion.value || Number(montoInstitucionCotizacion.value) <= 0) {
      montoInstitucionCotizacion.value = Number(totalCoti.toFixed(2));
    }
    const restante = totalCoti - Number(montoInstitucionCotizacion.value || 0);
    montoClienteCotizacion.value = Number(Math.max(0, restante).toFixed(2));
  } else {
    montoInstitucionCotizacion.value = 0;
    montoClienteCotizacion.value = Number(totalCoti.toFixed(2));
  }
}

const fnRecalcularCotizacionAmbas = () => {
  const totalCoti = Number(total.value) || 0;
  if (quienPagaCotizacion.value !== 'AMBAS') {
    if (quienPagaCotizacion.value === 'INSTITUCION') {
      montoInstitucionCotizacion.value = Number(totalCoti.toFixed(2));
      montoClienteCotizacion.value = 0;
    } else {
      montoInstitucionCotizacion.value = 0;
      montoClienteCotizacion.value = Number(totalCoti.toFixed(2));
    }
    return;
  }

  let institucionMonto = Number(montoInstitucionCotizacion.value || 0);
  if (institucionMonto < 0) institucionMonto = 0;
  if (institucionMonto > totalCoti) institucionMonto = totalCoti;

  montoInstitucionCotizacion.value = Number(institucionMonto.toFixed(2));
  montoClienteCotizacion.value = Number((totalCoti - institucionMonto).toFixed(2));
}

const fnAceptarQuienPagaCotizacion = () => {
  // Actualizar los valores de total_institucion y total_cliente
  total_institucion.value = Number(montoInstitucionCotizacion.value || 0);
  total_cliente.value = Number(montoClienteCotizacion.value || 0);
  visibleQuienPagaCotizacion.value = false;
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
   fnRecalcularCreditoAmbas()
}
/****************************************************/
const ventasGuardadas = ref([])
/****************************************************/
const fetchFabrica = async () => {
  try {

        const verificaLocalStorage = JSON.parse(window.localStorage.getItem('fabricacion')) || [];
   if (verificaLocalStorage.length > 0) {
      datosFabrica.value = verificaLocalStorage;
   }else{
/*    const response = await peticionesFetch(`${link.value}${api.value}`,'datosarraypost',{'tabla':'fabricacion'},tokenCifrado.value,'POST');*/
/*    const response = await peticionesFetchOffline('getDataAsArray', 'fabricacion');*/
    const columnas = await peticionesFetchOffline('getTableColumns', 'fabricacion');
    if (!columnas.includes('almacen')) {
      await peticionesFetchOffline('addColumnToTable', { tabla: 'fabricacion', campo: 'almacen' });
      await peticionesFetchOffline('updateEntireColumn', 'fabricacion','almacen',datosEmpresa.empresa.nombre);
    }
    const response = await peticionesFetchOffline('getDataArrayByCondition', 'fabricacion','almacen',datosEmpresa.empresa.nombre);
    datosFabrica.value = response;
     localStorage.setItem('fabricacion', JSON.stringify(response));

   }

    /*********************************************/
  } catch (error) {
    toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to fetch data Fabricacion', life: 3000 });
  }
};
/****************************************************/
const fetchMedidas = async () => {
  try {
        const verificaLocalStorage = JSON.parse(window.localStorage.getItem('medidas')) || [];
   if (verificaLocalStorage.length > 0) {
      datosMedidaArray.value = verificaLocalStorage;
   }else{

/*    const response = await peticionesFetch(`${link.value}${api.value}`,'datosarraypost',{'tabla':'medidas'},tokenCifrado.value,'POST');*/
/*    const response = await peticionesFetchOffline('getDataAsArray', 'medidas');*/
    const columnas = await peticionesFetchOffline('getTableColumns', 'medidas');
    if (!columnas.includes('almacen')) {
      await peticionesFetchOffline('addColumnToTable', { tabla: 'medidas', campo: 'almacen' });
      await peticionesFetchOffline('updateEntireColumn', 'medidas','almacen',datosEmpresa.empresa.nombre);
    }
    const response = await peticionesFetchOffline('getDataArrayByCondition', 'medidas','almacen',datosEmpresa.empresa.nombre);
    datosMedidaArray.value = response;
    localStorage.setItem('medidas', JSON.stringify(response));

   }
    /*********************************************/
  } catch (error) {
    toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to fetch data Fabricacion', life: 3000 });
  }
};
/****************************************************/
const fetchventasGuardadas = async () => {
  try {
   // const response = await peticionesFetch(`${link.value}${api.value}`,'datosarraypost',{'tabla':'ventasenproceso'},tokenCifrado.value,'POST');
/*    const response = await peticionesFetchOffline('getDataAsArray', 'ventasenproceso');*/
    const columnas = await peticionesFetchOffline('getTableColumns', 'ventasenproceso');
    if (!columnas.includes('almacen')) {
      await peticionesFetchOffline('addColumnToTable', { tabla: 'ventasenproceso', campo: 'almacen' });
      await peticionesFetchOffline('updateEntireColumn', 'ventasenproceso','almacen',datosEmpresa.empresa.nombre);
    }
    const response = await peticionesFetchOffline('getDataArrayByCondition', 'ventasenproceso','almacen',datosEmpresa.empresa.nombre);
    ventasGuardadas.value = response;
    /*********************************************/
  } catch (error) {
    toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to fetch data Ventas EN Proceso', life: 3000 });
  }
};

/****************************************************/
const fetchNotaCredito = async () => {
  try {
/*    const response = await peticionesFetch(`${link.value}${api.value}`,'datosarraypost',{'tabla':'notacredito'},tokenCifrado.value,'POST');*/
/*    const response = await peticionesFetchOffline('getDataAsArray', 'notacredito');*/
    const columnas = await peticionesFetchOffline('getTableColumns', 'notacredito');
    if (!columnas.includes('almacen')) {
      await peticionesFetchOffline('addColumnToTable', { tabla: 'notacredito', campo: 'almacen' });
      await peticionesFetchOffline('updateEntireColumn', 'notacredito','almacen',datosEmpresa.empresa.nombre);
    }
    const response = await peticionesFetchOffline('getDataArrayByCondition', 'notacredito','almacen',datosEmpresa.empresa.nombre);
    arrayNC.value = response;
    listaBuscadorNC.value = response.map(nc=>nc.no_credito)
    /*********************************************/
  } catch (error) {
    toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to fetch data Ventas EN Proceso', life: 3000 });
  }
};
/****************************************************/
const fetchMesas = async () => {
  try {

    //const response = await peticionesFetch(`${link.value}${api.value}`,'datosarraypost',{'tabla':'mesas'},tokenCifrado.value,'POST');
/*    const response = await peticionesFetchOffline('getDataAsArray', 'mesas');*/
    const columnas = await peticionesFetchOffline('getTableColumns', 'mesas');
    if (!columnas.includes('almacen')) {
      await peticionesFetchOffline('addColumnToTable', { tabla: 'mesas', campo: 'almacen' });
      await peticionesFetchOffline('updateEntireColumn', 'mesas','almacen',datosEmpresa.empresa.nombre);
    }
    const response = await peticionesFetchOffline('getDataArrayByCondition', 'mesas','almacen',datosEmpresa.empresa.nombre);
    mesasArray.value = response;
    localStorage.setItem('mesas', JSON.stringify(response));

 
    /*********************************************/
  } catch (error) {
    toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to fetch data MESAS', life: 3000 });
  }
};
/****************************************************/

const fetchCombos = async () => {
  try {
       const verificaLocalStorage = JSON.parse(window.localStorage.getItem('combos')) || [];

   if (verificaLocalStorage.length > 0) {
      combosArray.value = verificaLocalStorage;
   }else{

   //const response = await peticionesFetch(`${link.value}${api.value}`,'datosarraypost',{'tabla':'combos'},tokenCifrado.value,'POST');
/*      const response = await peticionesFetchOffline('getDataAsArray', 'combos');*/
      const columnas = await peticionesFetchOffline('getTableColumns', 'combos');
      if (!columnas.includes('almacen')) {
        await peticionesFetchOffline('addColumnToTable', { tabla: 'combos', campo: 'almacen' });
        await peticionesFetchOffline('updateEntireColumn', 'combos','almacen',datosEmpresa.empresa.nombre);
      }
      const response = await peticionesFetchOffline('getDataArrayByCondition', 'combos','almacen',datosEmpresa.empresa.nombre);
    combosArray.value = response;
    localStorage.setItem('combos', JSON.stringify(response));
}
    /*********************************************/
  } catch (error) {
    console.error('Error fetching data', error);
    toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to fetch data', life: 3000 });
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
  // const response = await peticionesFetch(`${link.value}${api.value}`,'datosarraypost',{'tabla':'banco'},tokenCifrado.value,'POST');
    const response = await peticionesFetchOffline('getDataAsArray', 'banco');
    const columnas = await peticionesFetchOffline('getTableColumns', 'banco');
    if (!columnas.includes('almacen')) {
      await peticionesFetchOffline('addColumnToTable', { tabla: 'banco', campo: 'almacen' });
      await peticionesFetchOffline('updateEntireColumn', 'banco','almacen',datosEmpresa.empresa.nombre);
    }
    //const response = await peticionesFetchOffline('getDataArrayByCondition', 'banco','almacen',datosEmpresa.empresa.nombre);
/*      const response = await consultarConWorker({
        tipo: 'consultar',
        payload: {
          endpoint: '/datosarraypost',
          datos: {'tabla':'banco'},
          metodo: 'POST'
        }
      });*/
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
   const verificaLocalStorage = JSON.parse(window.localStorage.getItem('categorias')) || [];

   //const response = await peticionesFetch(`${link.value}${api.value}`,'datosarraypost',{'tabla':'categorias'},tokenCifrado.value,'POST');
    const response = await peticionesFetchOffline('getDataAsArray', 'categorias');
/*      const response = await consultarConWorker({
        tipo: 'consultar',
        payload: {
          endpoint: '/datosarraypost',
          datos: {'tabla':'categorias'},
          metodo: 'POST'
        }
      });*/
    categoriasArray.value = response?.length ? response : verificaLocalStorage;
    localStorage.setItem('categorias', JSON.stringify(categoriasArray.value));
    /*********************************************/
  } catch (error) {
    console.error('Error fetching data', error);
    const verificaLocalStorage = JSON.parse(window.localStorage.getItem('categorias')) || [];
    categoriasArray.value = verificaLocalStorage;
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
/*      const response = await peticionesFetch(
        `${link.value}${api.value}`,
        'datosarraypost',
        { 'tabla': 'garantia' },
        tokenCifrado.value,
        'POST'
      );*/
      const response = await peticionesFetchOffline('getDataAsArray', 'garantia');
      const columnas = await peticionesFetchOffline('getTableColumns', 'garantia');
      if (!columnas.includes('almacen')) {
        await peticionesFetchOffline('addColumnToTable', { tabla: 'garantia', campo: 'almacen' });
        await peticionesFetchOffline('updateEntireColumn', 'garantia','almacen',datosEmpresa.empresa.nombre);
      }
      //const response = await peticionesFetchOffline('getDataArrayByCondition', 'garantia','almacen',datosEmpresa.empresa.nombre);
/*   const response = await consultarConWorker({
        tipo: 'consultar',
        payload: {
          endpoint: '/datosarraypost',
          datos: {'tabla':'garantia'},
          metodo: 'POST'
        }
      });*/

      garantiaArray.value = [{ referencia: 'Ninguna' }, ...response];
      localStorage.setItem('garantia', JSON.stringify(response));
    }

  } catch (error) {
    console.error('Error fetching data', error);
    toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to fetch data', life: 3000 });
  }
};

/****************************************************/

const fetchAndSetupData = async (reintento = false) => {
  try {

    let response;
    const datosDefaultLocal = JSON.parse( localStorage.getItem('tabladefault')) || {}
// Verifica si la columna 'almacen' existe
    const columnas = await peticionesFetchOffline('getTableColumns', 'productos');

    if (!columnas.includes('almacen')) {
      await peticionesFetchOffline('addColumnToTable', { tabla: 'productos', campo: 'almacen' });

    const datosAlmacen = {
      'tabla': 'productos',
      'campo': 'almacen',
      'nuevovalor': datosEmpresa.empresa.nombre,
    };

/*    const envio = await peticiones(link.value + api.value + '/actualizarcolumnacompletadb', datosAlmacen, 'POST', tokenCifrado.value);*/
    const envio = await peticionesFetchOffline('updateEntireColumn', 'productos','almacen',datosEmpresa.empresa.nombre);

    }

    if (datosDefaultLocal.activar_pos == 'true') {
/*    response = await peticionesFetch(`${link.value}${api.value}`,'datosarraypostconimg',{'tabla':'productos','link':link.value},tokenCifrado.value,'POST');*/
    response = await peticionesFetchOffline('getDataAsArrayWithIMG', 'productos');
    response = response.filter(ft=>ft.almacen === datosEmpresa.empresa.nombre)


    }else{

    // response = await peticionesFetch(`${link.value}${api.value}`,'datosarraypost',{'tabla':'productos'},tokenCifrado.value,'POST');
/*     response = await peticionesFetchOffline('getDataAsArray', 'productos');*/
     response = await peticionesFetchOffline('getDataArrayByCondition', 'productos','almacen',datosEmpresa.empresa.nombre);
    }
    
    const copiaoriginal = JSON.parse(JSON.stringify(response));
    productosArraySinModificaciones.value = copiaoriginal
    response = response.filter(prod=>prod.almacen === datosEmpresa.empresa.nombre)

    const productosSinStock = copiaoriginal.filter(prod=>prod.stock < 1)
  const camposNotificacion = await arrayToObjetoFromTablaOffline('notificaciones');
  const urlNotificacionProd = link.value+api.value+"/insertar/notificaciones";

    if (productosSinStock.length < 20 ) {
     // loading.value = true

//const notificacionesArray = await peticionesFetch(`${link.value}${api.value}`,'datosarraypost',{'tabla':'notificaciones'},tokenCifrado.value,'POST');
/*const notificacionesArray = await peticionesFetchOffline('getDataAsArray', 'notificaciones');*/
const notificacionesArray = await peticionesFetchOffline('getDataArrayByCondition', 'notificaciones','almacen',datosEmpresa.empresa.nombre);

    for(let prod of productosSinStock){
  if (camposNotificacion.hasOwnProperty('created_at')) {
    camposNotificacion.created_at = nfecha('timestamp');
    camposNotificacion.updated_at = nfecha('timestamp');
  }

   camposNotificacion.titulo = 'Producto Sin Stock';
   camposNotificacion.mensaje = `${prod.nombre} ya no tiene en Stock Ver mas Detalles`;
   camposNotificacion.accion = '/editarproductos/'+prod.id;


  const verificaNotificacion = notificacionesArray.find(notif=>notif.accion == camposNotificacion.accion)

  if (!verificaNotificacion) {
  /*const envioDatosNotificacion = await enviarDatosPorPost(urlNotificacionProd, camposNotificacion, tokenCifrado.value);*/
  const envioDatosNotificacion = await peticionesFetchOffline('insertData','notificaciones', JSON.stringify(camposNotificacion));
      }
    }
    //loading.value = false
    }else{

  if (camposNotificacion.hasOwnProperty('created_at')) {
    camposNotificacion.created_at = nfecha('timestamp');
    camposNotificacion.updated_at = nfecha('timestamp');
  }

   camposNotificacion.titulo = 'Mas de 20 Productos Sin Stock';
   camposNotificacion.mensaje = `Tienes Muchos Productos sin Stock`;
   camposNotificacion.accion = '/productos';

/*const verificaNotificacion = await peticionesFetch(`${link.value}${api.value}`,`datoscampo/notificaciones/accion${camposNotificacion.accion}`,{},tokenCifrado.value,'GET')*/
const verificaNotificacion = await peticionesFetchOffline('getDataByField', 'notificaciones','accion',camposNotificacion.accion);


  if (!verificaNotificacion) {
/*  const envioDatosNotificacion = await enviarDatosPorPost(urlNotificacionProd, camposNotificacion, tokenCifrado.value);*/
  const envioDatosNotificacion = await peticionesFetchOffline('insertData','notificaciones', JSON.stringify(camposNotificacion));
      }


      toast.add({ severity: 'error', summary: 'Error', detail: 'Upps Tienes '+productosSinStock.length+' Productos sin STOCK', life: 3000 });

  const datosJSOND = await envioElectron('datosarchivo');
  const sonidoR = datosJSOND.VITE_SOUND;
   let activado = false
  if(!sonidoR){
     activado = false;
  }else{
     activado = sonidoR;
  }

      if(activado){
               if(window.electron){
                window.electron.ipcRenderer.invoke("play-sound",'error-1.mp3');
           }else{
          toast.add({ severity: 'error', summary: 'Upps', detail: 'Esta funcion es solo para la aplicacion Desktop', life: 3000 });
         }
      }


    }


    items.value = response;
    productosArray.value = response;
 
      var arraybuscador = [];
      var arraybuscadorSoloProductos = [];
       response.forEach(function(index) {
        var keys = Object.keys(index);
        var values = Object.values(index);

        for (var i = 0; i < keys.length; i++) {
          if (keys[i] == 'codigo' || keys[i] == 'codigo_barra' || keys[i] == 'nombre') {
            arraybuscador.push(values[i])
            arraybuscadorSoloProductos.push(values[i])
          }
        }

      });

     if(imeiArray.value.length > 0){
       imeiArray.value.forEach(function(index) {
        var keys = Object.keys(index);
        var values = Object.values(index);

        for (var i = 0; i < keys.length; i++) {
          if (keys[i] == 'imei') {
            arraybuscador.push(values[i])
          }
        }
      });
      
     }


     combosArray.value.forEach(function(index) {
      var keys = Object.keys(index);
      var values = Object.values(index);

      for (var i = 0; i < keys.length; i++) {
        if (keys[i] == 'nombre') {
          arraybuscador.push(values[i])
        }
      }
    });


   listaBuscador.value = arraybuscador;


    /*********************************************/
  } catch (error) {
    console.error('Error fetching data', error);
    toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to fetch data', life: 3000 });
  }
};

/************************************************************/
const fetchClientes = async () => {
  try {

/*const responseclientes = await consultarConWorker({
    tipo: 'consultar',
    payload: {
      endpoint: '/datosarraypost',
      datos: {'tabla':'clientes'},
      metodo: 'POST'
    }
  });*/

 /*   const responseclientes = await peticionesFetch(`${link.value}${api.value}`,'datosarraypost',{'tabla':'clientes'},tokenCifrado.value,'POST');*/
    const responseclientes =  await peticionesFetchOffline('getDataAsArray', 'clientes');
    const columnas = await peticionesFetchOffline('getTableColumns', 'clientes');
    if (!columnas.includes('almacen')) {
      await peticionesFetchOffline('addColumnToTable', { tabla: 'clientes', campo: 'almacen' });
      await peticionesFetchOffline('updateEntireColumn', 'clientes','almacen',datosEmpresa.empresa.nombre);
    }
   
/*    const responseclientes =  await peticionesFetchOffline('getDataArrayByCondition', 'clientes','almacen',datosEmpresa.empresa.nombre);*/

    const datosFiltrados = responseclientes.filter(cliente => cliente.nombre && cliente.nombre.trim() !== '');

    nombreClientsArray.value = datosFiltrados.map(item => item.nombre);
    itemsclientes.value = responseclientes;
    allClientes.value = responseclientes;


const clienteLocalStorage = window.localStorage.getItem('clienteLocalStorage');

// Validar que no sea null, undefined, "null" ni "undefined"
if (clienteLocalStorage && clienteLocalStorage !== 'undefined' && clienteLocalStorage !== 'null') {
  try {
    const datosCliente = JSON.parse(clienteLocalStorage);
    if (datosCliente) {
      clienteSelected.value = datosCliente;
    } else {
      throw new Error('JSON vacío');
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
  clienteSelected.value = responseclientes.find(client => client.codigo === '0000000');
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
const fetchAlmacenes = async () => {
  try {
    const response = await peticionesFetchOffline('getDataAsArray', 'empresa');
    listaAlmacenes.value = response || [];
    // Agregar opción "TODOS" al inicio
    listaAlmacenes.value.unshift({ id: 0, nombre: 'TODOS' });
    // Establecer el almacén actual como seleccionado por defecto
    selectedAlmacenBusqueda.value = datosEmpresa.empresa?.nombre || 'TODOS';
    // Cargar productos del almacén seleccionado
    await cargarProductosDelAlmacen();
  } catch (error) {
    console.error('Error al cargar almacenes:', error);
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'No se pudieron cargar los almacenes',
      life: 3000
    });
  }
};

// Watcher para cargar productos cuando cambie el almacén seleccionado
watch(() => selectedAlmacenBusqueda.value, async (newValue) => {
  if (newValue) {
    await cargarProductosDelAlmacen();
  }
});

/************************************************************/
const cargarProductosDelAlmacen = async () => {
  try {
    let response;

    if (selectedAlmacenBusqueda.value === 'TODOS') {
      // Cargar todos los productos de todos los almacenes
      response = await peticionesFetchOffline('getDataAsArray', 'productos');
    } else {
      // Cargar solo productos del almacén seleccionado
      response = await peticionesFetchOffline('getDataArrayByCondition', 'productos', 'almacen', selectedAlmacenBusqueda.value);
    }

    productosDelAlmacen.value = response || [];
  } catch (error) {
    console.error('Error al cargar productos del almacén:', error);
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'No se pudieron cargar los productos',
      life: 3000
    });
  }
};

/************************************************************/
const fetchFacturas = async () => {
  try {
/*    const responseFacturas = await peticionesFetch(`${link.value}${api.value}`,`ultimosx/facturas/1000`,{},tokenCifrado.value,'GET');*/
    const responseFacturas = await peticionesFetchOffline('getLastXRows', 'facturas','1000');

/*    const responseFacturas = await consultarConWorker({
    tipo: 'consultar',
    payload: {
      endpoint: '/ultimosx/facturas/1000',
      datos: {},
      metodo: 'GET'
    }
  });*/



    const facturasData = responseFacturas.filter(ft=>ft.almacen === datosEmpresa.empresa.nombre);
    const columnas = await peticionesFetchOffline('getTableColumns', 'facturas');

    if (!columnas.includes('almacen')) {
      await peticionesFetchOffline('addColumnToTable', { tabla: 'facturas', campo: 'almacen' });

    const datosAlmacen = {
      'tabla': 'facturas',
      'campo': 'almacen',
      'nuevovalor': datosEmpresa.empresa.nombre,
    };

/*    const envio = await peticiones(link.value + api.value + '/actualizarcolumnacompletadb', datosAlmacen, 'POST', tokenCifrado.value);*/
    const envio = await peticionesFetchOffline('updateEntireColumn', 'facturas','almacen',datosEmpresa.empresa.nombre);


    }

    allFacturasFull.value = responseFacturas

    if (facturasData.length >0) {
      noFacturasArray.value = facturasData.map(item => item.no_factura);
      allFacturasArray.value = facturasData.map(item => ({ label: item.nombre_cliente, value: item.no_factura }));
        datosFactCoti.value.numero = noFacturasArray.value[0];
     }

  } catch (error) {
    console.error('Error fetching facturas data:', error);
    toast.add({ severity: 'error', summary: 'Error', detail: 'Error fetching data of Facturas', life: 3000 });
  }
}
//facturaEsCredito
/************************************************************/
const preFacturasArray = ref([]);
/************************************************************/
//await peticionesFetchOffline('getDataArrayByCondition', 'clientes','almacen',datosEmpresa.empresa.nombre);
const fetchPreFacturas = async () => {
  try {
    const responsePreFacturas = await peticionesFetchOffline('getLastXRows', 'pre_facturas', '1000');

    if (responsePreFacturas && responsePreFacturas.length > 0) {
      preFacturasArray.value = responsePreFacturas;
      // Actualizar noFacturasArray para el buscador
      noFacturasArray.value = responsePreFacturas.filter(ft=>ft.almacen === datosEmpresa.empresa.nombre).map(item => item.no_factura);
      allFacturasArray.value = responsePreFacturas.filter(ft=>ft.almacen === datosEmpresa.empresa.nombre).map(item => ({ label: item.cliente, value: item.no_factura }));
      datosFactCoti.value.numero = noFacturasArray.value[0];
      console.log(`✅ ${responsePreFacturas.length} pre-facturas cargadas`);
    } else {
      preFacturasArray.value = [];
      noFacturasArray.value = [];
      allFacturasArray.value = [];
      console.log('⚠️ No hay pre-facturas disponibles');
    }
  } catch (error) {
    console.error('Error fetching pre-facturas data:', error);
    toast.add({ severity: 'error', summary: 'Error', detail: 'Error al cargar pre-facturas', life: 3000 });
    preFacturasArray.value = [];
    noFacturasArray.value = [];
    allFacturasArray.value = [];
  }
};
/************************************************************/
const ordenesArray = ref([]);
/************************************************************/
const fetchOrdenes = async () => {
  try {
    const responseOrdenes = await peticionesFetchOffline('getLastXRows', 'ordenes', '1000');

    if (responseOrdenes && responseOrdenes.length > 0) {
      ordenesArray.value = responseOrdenes;
      // Actualizar noFacturasArray para el buscador
      noFacturasArray.value = responseOrdenes.filter(ft=>ft.almacen === datosEmpresa.empresa.nombre).map(item => item.no_orden);
      allFacturasArray.value = responseOrdenes.filter(ft=>ft.almacen === datosEmpresa.empresa.nombre).map(item => ({ label: item.cliente, value: item.no_orden }));
      datosFactCoti.value.numero = noFacturasArray.value[0];
      console.log(`✅ ${responseOrdenes.length} órdenes cargadas`);
    } else {
      ordenesArray.value = [];
      noFacturasArray.value = [];
      allFacturasArray.value = [];
      console.log('⚠️ No hay órdenes disponibles');
    }
  } catch (error) {
    console.error('Error fetching órdenes data:', error);
    toast.add({ severity: 'error', summary: 'Error', detail: 'Error al cargar órdenes', life: 3000 });
    ordenesArray.value = [];
    noFacturasArray.value = [];
    allFacturasArray.value = [];
  }
};
/************************************************************/
const apartadosArray = ref([]);
/************************************************************/
const fetchApartados = async () => {
  try {
    const responseApartados = await peticionesFetchOffline('getLastXRows', 'apartados', '1000');

    if (responseApartados && responseApartados.length > 0) {
      apartadosArray.value = responseApartados;
      // Actualizar noFacturasArray para el buscador
      noFacturasArray.value = responseApartados.filter(ft=>ft.almacen === datosEmpresa.empresa.nombre).map(item => item.no_factura);
      allFacturasArray.value = responseApartados.filter(ft=>ft.almacen === datosEmpresa.empresa.nombre).map(item => ({ label: item.nombre_cliente, value: item.no_factura }));
      datosFactCoti.value.numero = noFacturasArray.value[0];
      console.log(`✅ ${responseApartados.length} apartados cargados`);
    } else {
      apartadosArray.value = [];
      noFacturasArray.value = [];
      allFacturasArray.value = [];
      console.log('⚠️ No hay apartados disponibles');
    }
  } catch (error) {
    console.error('Error fetching apartados data:', error);
    toast.add({ severity: 'error', summary: 'Error', detail: 'Error al cargar apartados', life: 3000 });
    apartadosArray.value = [];
    noFacturasArray.value = [];
    allFacturasArray.value = [];
  }
};
/************************************************************/
const fetchCotizaciones = async () => {
  try {
/*    const responseFacturas = await peticionesFetch(`${link.value}${api.value}`,`ultimosx/cotizacion/100`,{},tokenCifrado.value,'GET');*/
    const responseFacturas =  await peticionesFetchOffline('getLastXRows', 'cotizacion','1000');

    const facturasData = responseFacturas; // Invertir el array aquí
    allCotizacionesFull.value = responseFacturas
    noFacturasArray.value = facturasData.filter(ft=>ft.almacen === datosEmpresa.empresa.nombre).map(item => item.no_cotizacion);
    allFacturasArray.value = facturasData.filter(ft=>ft.almacen === datosEmpresa.empresa.nombre).map(item => ({ label: item.nombre_cliente, value: item.no_cotizacion }));

    datosFactCoti.value.numero = noFacturasArray.value[0];

  } catch (error) {
    console.error('Error fetching Cotizaciones data:', error);
    toast.add({ severity: 'error', summary: 'Error', detail: 'Error fetching data of Cotizaciones', life: 3000 });
  }
}

/************************************************************/
const tipodocumento = async(doc)=>{
  const tipo = datosFactCoti.value.tipo;
  if (tipo == 'Cotizacion' || tipo == 'cotizacion' || doc == 'cotizacion') {
   await  fetchCotizaciones();
   documentoActual.value = 'COTIZACIÓN';
   institucionCotizacion.value = 'NINGUNA';
   // Solo mostrar la modal de instrucciones si NO estamos en la modal de facturas y cotizaciones
   if (!visiblefatcoti.value) {
     visibleInstitucionCotizacion.value = true;
   }
  }else if(tipo == 'Pre-Factura' || tipo == 'pre-factura' || doc == 'pre-factura'){
    await fetchPreFacturas();
    documentoActual.value = 'PRE-FACTURA';
  }else if(tipo == 'Orden' || tipo == 'orden' || doc == 'orden'){
    await fetchOrdenes();
    documentoActual.value = 'ORDEN';
  }else if(tipo == 'Apartado' || tipo == 'apartado' || doc == 'apartado'){
    await fetchApartados();
    documentoActual.value = 'APARTADO';
  }else if(doc == 'financiamiento'){
    router.push('/crearfinanciamientos')
  }else{
    await fetchFacturas();
    documentoActual.value = 'FACTURA';
  }
}
/************************************************************/
const fnAceptarInstitucionCotizacion = () => {
  if (institucionCotizacion.value && institucionCotizacion.value !== 'NINGUNA') {
    institucion.value = institucionCotizacion.value;
    fnCambioInstitucion(); // Aplicar el porcentaje de la institución
    visibleInstitucionCotizacion.value = false;
    // Esperar a que se actualice el total después de aplicar el porcentaje
    nextTick(() => {
      // Mostrar modal de quién paga con el total actualizado
      visibleQuienPagaCotizacion.value = true;
      quienPagaCotizacion.value = 'INSTITUCION';
      montoInstitucionCotizacion.value = Number(total.value.toFixed(2));
      montoClienteCotizacion.value = 0;
    });
  } else {
    institucion.value = 'Ninguna';
    visibleInstitucionCotizacion.value = false;
  }
}

const fnAbrirEditarInstCotizacion = () => {
  const coti = allCotizacionesFull.value.find(c => c.no_cotizacion === datosFactCoti.value.numero);
  editInstCotizacion.value = coti?.entidad_financiera || 'NINGUNA';
  visibleEditarInstCotizacion.value = true;
};

const fnGuardarEditInstCotizacion = async () => {
  const coti = await peticionesFetchOffline('getDataByField', 'cotizacion', 'no_cotizacion', datosFactCoti.value.numero);
  if (!coti) {
    toast.add({ severity: 'error', summary: 'Error', detail: 'No se encontró la cotización', life: 3000 });
    return;
  }
  coti.entidad_financiera = editInstCotizacion.value === 'NINGUNA' ? '' : editInstCotizacion.value;
  if (coti.hasOwnProperty('updated_at')) coti.updated_at = nfecha('timestamp');
  const result = await peticionesFetchOffline('updateData', 'cotizacion', JSON.stringify(coti));
  if (result && result[0] === 'ok') {
    toast.add({ severity: 'success', summary: 'Éxito', detail: 'Institución actualizada', life: 2500 });
    await fetchCotizaciones();
  } else {
    toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo actualizar la institución', life: 3000 });
  }
  visibleEditarInstCotizacion.value = false;
};
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
/************************************************************/
//buscarPorImei
const buscarPorImei = () => {
     toast.removeAllGroups();
    toast.add({ severity: 'success', summary: 'OK', detail: 'Buscando por IMEI', life: 3000 });
    visiblebuscarImei.value = true;

};
/************************************************************/
const fetchDataConfiguracion = async () => {
  try {

   const verificaLocalStorage = JSON.parse(window.localStorage.getItem('configuracion')) || [];

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

    tipoImpuestoFactura.value = datosConfiguracion.value.tipo_papel

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

   if (Object.keys(verificaLocalStorage).length > 0) {
    tabladefault.value = verificaLocalStorage;
    metodoPago.value = tabladefault.value.metodo_pago
    comprobante.value = tabladefault.value.comprobantes
   }else{
/*    const response = await peticionesFetch(`${link.value}${api.value}`,`datoscampo/tabladefault/id/1`,{},tokenCifrado.value,'GET');*/
    const response = await peticionesFetchOffline('getDataByField', 'tabladefault','id',1);
    tabladefault.value = response;
    metodoPago.value = tabladefault.value.metodo_pago
    comprobante.value = tabladefault.value.comprobantes
    localStorage.setItem('tabladefault', JSON.stringify(response));

   }

  } catch (error) {
    console.error('Error fetching data', error);
    toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to fetch data Default', life: 3000 });
  }
};
/************************************************************/
//imeiArray
const fetchDataImei = async () => {
  try {
    /*const response = await peticionesFetch(`${link.value}${api.value}`,`datosarraycondicion/imei`,{campo:'estado',valor:'DISPONIBLE'},tokenCifrado.value,'POST');*/
    const response = await peticionesFetchOffline('getDataArrayByCondition', 'imei','estado','DISPONIBLE');
    imeiArray.value = response.filter(ft=>ft.almacen === datosEmpresa.empresa.nombre);
  } catch (error) {
    console.error('Error fetching data', error);
    toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to fetch data IMEI', life: 3000 });
  }
};
/************************************************************/
//electrodomesticosArray
//await peticionesFetchOffline('getDataArrayByCondition', 'clientes','almacen',datosEmpresa.empresa.nombre);
const fetchDataElectrodomesticos = async () => {
  try {
    const response = await peticionesFetchOffline('getDataArrayByCondition', 'electrodomesticos','estado','DISPONIBLE');
    electrodomesticosArray.value = response.filter(ft=>ft.almacen === datosEmpresa.empresa.nombre);
  } catch (error) {
    console.error('Error fetching data', error);
    toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to fetch data Electrodomesticos', life: 3000 });
  }
};
/************************************************************/
const limpiarProductos = ()=>{
  mesaActiva.value = null
  localStorage.removeItem('productosVenta');
  localStorage.removeItem('arrayIMEI');
  localStorage.removeItem('arrayElectrodomesticos');
  productosVenta.value = [];
  documentoActual.value = 'Factura Nueva';
  documentoEditado.value = null;
  numerodocumentoEditado.value = null;
  datosIMEI.value = ''
  datosElectrodomestico.value = {}
  clienteSelected.value = allClientes.value.find(client=>client.codigo === '0000000')
  window.localStorage.setItem('clienteLocalStorage',JSON.stringify(clienteSelected.value))
  tipoFactura.value = 'factura'
  porcientoInstitucionAplicado.value = 0
  // Reiniciar valores de cotización
  institucionCotizacion.value = 'NINGUNA'
  quienPagaCotizacion.value = 'INSTITUCION'
  montoInstitucionCotizacion.value = 0
  montoClienteCotizacion.value = 0
  institucion.value = 'Ninguna'

}

/************************************************************/
const nuevaFactura = ()=>{
  clienteSeleccionado.value = null
  limpiarProductos();
  documentoActual.value = 'Factura Nueva';
  documentoEditado.value = null;
  numerodocumentoEditado.value = null;
  comprobante.value = 'NORMAL'
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

    intitucionesData.value = response.filter(ft=>ft.almacen === datosEmpresa.empresa.nombre);
    intitucionesDataNames.value = response.filter(ft=>ft.almacen === datosEmpresa.empresa.nombre).map(intitucion=>intitucion.nombre);
    localStorage.setItem('instituciones', JSON.stringify(response));

}
//await peticionesFetchOffline('getDataArrayByCondition', 'clientes','almacen',datosEmpresa.empresa.nombre);

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


    confiscalData.value = response.filter(ft=>ft.almacen === datosEmpresa.empresa.nombre);
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
    fabricacionData.value = response.filter(ft=>ft.almacen === datosEmpresa.empresa.nombre);
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
    //localStorage.setItem('usuarios', JSON.stringify(response));
    vendedoresNombre.value = response.filter(ft=>ft.almacen === datosEmpresa.empresa.nombre).filter(usr=>usr.nivel_seguridad === 'Vendedor').map(users=>users.nombre);
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
// Funciones para Orden de Taller
/************************************************************/
const fetchUsuariosData = async () => {
  try {
    const response = await peticionesFetchOffline('getDataAsArray', 'usuarios');
    usuariosData.value = response;
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
const fetchClientesData = async () => {
  try {
    const response = await peticionesFetchOffline('getDataAsArray', 'clientes');
    clientesData.value = response;
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to fetch data from clientes',
      life: 3000
    });
  }
};
/************************************************************/
const buscarClientePorCedula = async() => {
  if (!ordenRapida.value.cedula || ordenRapida.value.cedula.trim() === '') {
    toast.add({ severity: 'error', summary: 'Error', detail: 'Ingrese una cédula válida', life: 3000 });
    return;
  }

  loading.value = true;

  try {
    const clienteLocal = await peticionesFetchOffline('getDataByField', 'clientes', 'cedula', ordenRapida.value.cedula);

    if (clienteLocal) {
      ordenRapida.value.nombre = clienteLocal.nombre;
      ordenRapida.value.telefono = clienteLocal.telefono || '';
      loading.value = false;
      toast.add({ severity: 'success', summary: 'Éxito', detail: 'Cliente encontrado', life: 3000 });
      return;
    }

    const response = await peticionesFetch(
      window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? '/api2' : 'https://demo.tmposrd.com/api2',
      'buscarcedula',
      { cedula: ordenRapida.value.cedula },
      tokenCifrado.value,
      'POST'
    );

    if (response && response.datos) {
      ordenRapida.value.nombre = response.datos.name;
      toast.add({ severity: 'success', summary: 'Éxito', detail: 'Cliente encontrado en API', life: 3000 });
    } else {
      toast.add({ severity: 'warning', summary: 'Aviso', detail: 'Cliente no encontrado', life: 3000 });
    }

    loading.value = false;
  } catch (error) {
    loading.value = false;
    toast.add({ severity: 'error', summary: 'Error', detail: 'Error al buscar cliente', life: 3000 });
  }
};
/************************************************************/
const buscarEquipoPorIMEI = async() => {
  if (!ordenRapida.value.imei || ordenRapida.value.imei.trim() === '') {
    toast.add({ severity: 'error', summary: 'Error', detail: 'Ingrese un IMEI válido', life: 3000 });
    return;
  }

  loading.value = true;

  const datos = {
    servicio: "0",
    imei: ordenRapida.value.imei.trim()
  };

  try {
    const consulta = await enviarDatosPorPost(
      window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? '/api2/consultaimei' : 'https://demo.tmposrd.com/api2/consultaimei',
      datos,
      tokenCifrado.value
    );

    const ok = consulta?.response?.success === true;

    if (ok) {
      const obj = consulta.response.object || {};
      ordenRapida.value.marca = obj.brand || '';
      ordenRapida.value.modelo = obj.modelName || '';
      toast.add({
        severity: 'success',
        summary: 'Éxito',
        detail: `Equipo encontrado: ${obj.modelName || 'N/A'}`,
        life: 3000
      });
    } else {
      toast.add({
        severity: 'error',
        summary: 'Error',
        detail: consulta?.response?.status || 'No se encuentran datos del IMEI',
        life: 3000
      });
    }

    loading.value = false;
  } catch (error) {
    loading.value = false;
    toast.add({ severity: 'error', summary: 'Error', detail: 'Error al consultar IMEI', life: 3000 });
  }
};
/************************************************************/
const crearOrdenRapida = async() => {
  if (!ordenRapida.value.nombre || ordenRapida.value.nombre.trim() === '') {
    toast.add({ severity: 'error', summary: 'Error', detail: 'El nombre del cliente es obligatorio', life: 3000 });
    return;
  }

  if (!ordenRapida.value.falla || ordenRapida.value.falla.trim() === '') {
    toast.add({ severity: 'error', summary: 'Error', detail: 'Debe especificar la falla del equipo', life: 3000 });
    return;
  }

  if (!ordenRapida.value.manodeobra || parseFloat(ordenRapida.value.manodeobra) <= 0) {
    toast.add({ severity: 'error', summary: 'Error', detail: 'Debe especificar el costo de mano de obra', life: 3000 });
    return;
  }

  loading.value = true;

  try {
    const ultimoReg = await peticionesFetchOffline('getLastXRows', 'taller', '1');
    let noFactura = '0000001';

    if (ultimoReg.length > 0) {
      noFactura = generadorCodigo(ultimoReg[0].no_factura, '', 7);
    }

    const manoDeObra = parseFloat(ordenRapida.value.manodeobra);
    const costoPiezas = incluyeCostoPieza.value ? 0 : parseFloat(ordenRapida.value.preciopiezas);
    const totalOrden = incluyeCostoPieza.value ? manoDeObra : (manoDeObra + costoPiezas);

    const nuevaOrden = {
      no_factura: noFactura,
      nombre: ordenRapida.value.nombre,
      cedula: ordenRapida.value.cedula || '',
      telefono: ordenRapida.value.telefono || '',
      whatsapp: ordenRapida.value.telefono || '',
      email: '',
      direccion: '',
      equipo: ordenRapida.value.equipo,
      marca: ordenRapida.value.marca || 'N/A',
      modelo: ordenRapida.value.modelo || 'N/A',
      imei: ordenRapida.value.imei || '',
      serial: '',
      clave: ordenRapida.value.clave || 'N/A',
      fallas: JSON.stringify([{ propiedad: ordenRapida.value.falla }]),
      accesorios: JSON.stringify([]),
      observaciones: incluyeCostoPieza.value ? 'Costo incluye pieza' : '',
      reparacion: '',
      piezas: '',
      tecnico: ordenRapida.value.tecnico?.nombre || datosEmpresa.usuario.nombre,
      estado: 'En Revision',
      metodopago: 'EFECTIVO',
      manodeobra: manoDeObra.toFixed(2),
      preciopiezas: costoPiezas.toFixed(2),
      total: totalOrden.toFixed(2),
      saldo: totalOrden.toFixed(2),
      abono: JSON.stringify([]),
      fecha_entrada: nfecha('fecha'),
      fecha_entrega: ordenRapida.value.fecha_entrega,
      almacen: datosEmpresa.empresa.nombre,
      usuario: datosEmpresa.usuario.nombre,
      pago_tecnico: 'NO COBRADO',
      beneficio_tecnico: '0.00',
      beneficio_empresa: '0.00',
      created_at: nfecha('timestamp'),
      updated_at: nfecha('timestamp')
    };

    const datosTecnico = usuariosData.value.find(t => t.nombre === nuevaOrden.tecnico);
    nuevaOrden.porcentaje_tecnico = datosTecnico?.porcentaje || '0.00';

    const envioDatos = await peticionesFetchOffline('insertData', 'taller', JSON.stringify(nuevaOrden));

    if (envioDatos[0] === 'ok') {
      toast.add({
        severity: 'success',
        summary: 'Éxito',
        detail: `Orden #${noFactura} creada exitosamente`,
        life: 3000
      });

      // Preparar datos para impresión
      ordenParaImprimir.value = nuevaOrden;

      // Limpiar formulario
      incluyeCostoPieza.value = false;
      ordenRapida.value = {
        cedula: '',
        nombre: '',
        telefono: '',
        imei: '',
        marca: '',
        modelo: '',
        equipo: 'CELULAR',
        falla: '',
        clave: '',
        tecnico: null,
        manodeobra: '0.00',
        preciopiezas: '0.00',
        total: '0.00',
        fecha_entrega: nfecha('fechaManana')
      };

      // Cerrar modal de orden rápida y mostrar selección de formato
      visibleOrdenRapida.value = false;
      visibleSeleccionFormato.value = true;
    } else {
      toast.add({ severity: 'error', summary: 'Error', detail: 'Error al crear la orden', life: 3000 });
    }

    loading.value = false;
  } catch (error) {
    loading.value = false;
    console.error('Error al crear orden:', error);
    toast.add({ severity: 'error', summary: 'Error', detail: 'Error al procesar la orden', life: 3000 });
  }
};
/************************************************************/
const abrirOrdenRapida = () => {
  incluyeCostoPieza.value = false;
  ordenRapida.value = {
    cedula: '',
    nombre: '',
    telefono: '',
    imei: '',
    marca: '',
    modelo: '',
    equipo: 'CELULAR',
    falla: '',
    clave: '',
    tecnico: usuariosData.value.find(u => u.nivel_seguridad === 'Tecnico') || null,
    manodeobra: '0.00',
    preciopiezas: '0.00',
    total: '0.00',
    fecha_entrega: nfecha('fechaManana')
  };
  visibleSeleccionTaller.value = false;
  visibleOrdenRapida.value = true;
};
/************************************************************/
const irACrearTaller = () => {
  visibleSeleccionTaller.value = false;
  router.push('/creartaller');
};
/************************************************************/
const seleccionarFormatoImpresion = (formato) => {
  formatoImpresion.value = formato;
  visibleSeleccionFormato.value = false;
  visibleImpresoraTaller.value = true;
};
/************************************************************/
const cancelarImpresion = () => {
  visibleSeleccionFormato.value = false;
  ordenParaImprimir.value = null;
};
/************************************************************/
//vendedoresNombre
onMounted(async () => {

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


if(datosDefault.value?.activar_pos){
  if(datosDefault.value?.activar_pos === 'true')
    router.push('/pos')
}


configuracionFactura.value = JSON.parse(window.localStorage.getItem('configuracionfactura')) || {}
barraMenu.value = JSON.parse(window.localStorage.getItem('barramenu')) || []


cajero.value = usuarioLocal.value.nombre
vendedor.value = usuarioLocal.value.nombre

//const datosJSON = await window.electron.ipcRenderer.invoke('datosarchivo');
const datosJSON = await envioElectron('datosarchivo');


link.value = datosJSON.VITE_LINKURL;
api.value = datosJSON.VITE_LINK_API;
token.value = datosJSON.VITE_TOKEN;
patronTelefono.value = datosJSON.VITE_PATRON_TELEFONO;
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
  { fn: fetchProveedoresRecibirEquipo, nombre: 'Proveedores' },
  { fn: fetchAlmacenes, nombre: 'Almacenes' },
  { fn: usuariosDatosarray, nombre: 'Usuarios' },
  { fn: fetchBanco, nombre: 'Banco' },
  { fn: fetchNotaCredito, nombre: 'Notas de Crédito' },
  { fn: fetchFacturas, nombre: 'Facturas' },
  { fn: fetchPreFacturas, nombre: 'Pre-Facturas' },
  { fn: fetchventasGuardadas, nombre: 'Ventas Guardadas' },
  { fn: fetchConfiscal, nombre: 'Configuración Fiscal' },
  { fn: fetchIntituciones, nombre: 'Instituciones' }
];

// Agregar funciones condicionales según el modo
if (tabladefault.value.modo === 'CELULAR') {
  funcionesBase.push({ fn: fetchDataImei, nombre: 'IMEI' });
  funcionesBase.push({ fn: fetchDataElectrodomesticos, nombre: 'Electrodomésticos' });
}

if (tabladefault.value.modo === 'RESTAURANTE') {
  funcionesBase.push(
    { fn: fetchCombos, nombre: 'Combos' },
    { fn: fetchMesas, nombre: 'Mesas' }
  );
}

if (tabladefault.value.modo === 'FABRICA') {
  funcionesBase.push(
    { fn: fetchFabrica, nombre: 'Fábrica' },
    { fn: fetchMedidas, nombre: 'Medidas' },
    { fn: fetchFabricacionDatosarray, nombre: 'Fabricación' }
  );
}

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
nota.value = notaEncontrada ? notaEncontrada.garantia : garantiaArray.value[0]?.garantia;


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
    tipoImpuestoFactura.value = datosConfiguracion.value.tipo_papel
  } else {
    await fetchDataConfiguracion();
  }
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

// Cargar datos para orden de taller
await fetchUsuariosData();
await fetchClientesData();

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
            jsonDataC.telefono = datosEmpresa.empresa.telefono;
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

    // 🔸 Siempre solicitar teléfono y dirección (sin importar Electron)
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
        <input id="telefono" class="swal2-input mt-2 p-2 border rounded" placeholder="Teléfono">
        <input id="rnc" class="swal2-input mt-2 p-2 border rounded" placeholder="RNC/CÉDULA">
        <input id="direccion" class="swal2-input mt-2 p-2 border rounded" placeholder="Dirección">
      `,
      focusConfirm: false,
      preConfirm: () => ({
        nombre: document.getElementById('nombre').value.toUpperCase(),
        telefono: document.getElementById('telefono').value,
        rnc: document.getElementById('rnc').value,
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
    jsonDataC.cedula = clientData.cedularnc;
    jsonDataC.rnc = clientData.cedularnc;
    jsonDataC.codigo = clientData.cedularnc;
  } else {
    jsonDataC.nombre = clientData.nombre;
    jsonDataC.rnc = clientData.rnc;
    jsonDataC.cedula = clientData.rnc;
    jsonDataC.direccion = clientData.direccion;
    jsonDataC.codigo = generarCodigoUnico();
  }

  jsonDataC.precio_fijado = 'Normal';
  jsonDataC.telefono = clientData.telefono;

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
        clienteSelected.telefono = '+1(809) 000-0000'
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
        datoscamposConduce.value.telefono = clienteSelected.telefono;
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
              telefono: datosCliente?.telefono || '',
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
          var impresionpagina = link.value+'/receipt/ticket.php?factura='+factura;
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
         // var impresionpagina = link.value+'/receipt/ticket.php?cotizacion='+factura;
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
       var impresionpagina = link.value+'/receipt/ticket.php?factura='+factura;
       visiblefatcoti.value = false
       Swal.fire({
        html: '<iframe src="' + impresionpagina + '" width="100%" height="600" style="border: none;"></iframe>',
        confirmButtonText: 'Cerrar',
        showCloseButton: true
       });

     }




     }else if(datosFactCoti.value.impresora == 'Termica2'){
          var impresionpagina = link.value+'/receipt/ticket.php?factura='+factura;
      if(window.electron){
          window.electron.ipcRenderer.invoke('open-new-window', impresionpagina,'url',false,true,false)
       }else{
       var impresionpagina = link.value+'/receipt/ticket.php?factura='+factura;
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
         // var impresionpagina = link.value+'/receipt/ticket.php?cotizacion='+factura;
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

    if (productoSeleccionado.value.categoria === 'CELULARES') {
      toast.add({ severity: 'error', summary: 'Error', detail: 'No se pueda agregar CELULARES sin IMEI', life: 3000 });
      return
    }

    const productoExistente = productosVenta.value.find(prod => prod.codigo === productoSeleccionado.value.codigo);
    if (productoExistente) {
      productoExistente.cantidad += 1;
    } else {
      productoSeleccionado.value.cantidad = 1
      productoSeleccionado.value.descuento = 0.00
      delete productoSeleccionado.otro
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
    if (datos.categoria == 'CELULARES') {
      toast.add({ severity: 'error', summary: 'Error', detail: 'No se pueda agregar CELULARES sin IMEI', life: 3000 });
      return
    }
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

if (newValue.categoria === 'CELULARES') {
  toast.add({ severity: 'error', summary: 'Error', detail: 'No se pueda agregar CELULARES sin IMEI', life: 3000 });
  value.value = '';
  return
}

  const productoExistente = productosVenta.value.find(prod => prod.codigo === newValue.codigo);
  if (productoExistente) {
    productoExistente.cantidad += 1;
  } else {
    const producto = productosArray.value.find(prod => prod.codigo === newValue.codigo);
    if (producto) {
     delete producto.otro
      productosVenta.value.push({
        ...producto,
        cantidad: 1,
        descuento: producto.descuento ? producto.descuento : 0,
        precio_venta: producto.precio_venta ? producto.precio_venta : producto.precio,
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
  // Usar precio_final que ya incluye el impuesto calculado, fallback a precio_venta
  const cantidad = Number(producto.cantidad) || 1;
  const descuento = Number(producto.descuento) || 0;
  const precioFinal = Number(producto.precio_final) || Number(producto.precio_venta) || 0;

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
    cantidadProductosLocal.value += parseFloat(producto.cantidad) || 0;
    producto.total = Number(calcularTotal(producto)) || 0;
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
const datosProducto = await peticionesFetchOffline('getDataByField', 'productos','codigo',datosProductoIndex.codigo);

if (datosProducto) {
    datosProducto.stock = (Number(datosProducto.stock) + datosProductoIndex.cantidad)


if (datosProducto.categoria == 'CELULARES') {
   const listadoIMEI = JSON.parse(localStorage.getItem('arrayIMEI')) || [];
   const listadoNuevo = listadoIMEI.filter(prod=>prod.id_equi != datosProducto.id);
   localStorage.setItem('arrayIMEI',JSON.stringify(listadoNuevo))
   
  let listaImei = datosProductoIndex.lista_imei?.split(',') || [];
  let imeisProcesados = [];
  if(listaImei.length > 0){ 
      for(let imei of listaImei){
/*        const datosServidor = await peticionesFetch(
          `${link.value}${api.value}`,
          `datoscampo/imei/imei/${imei}`,
          {},
          tokenCifrado.value,
          'GET'
        );*/

        const datosServidor = await peticionesFetchOffline('getDataByField', 'imei','imei',imei);
        if(datosServidor){
        const urlImei = `${link.value}${api.value}/actualizarcampos/imei`;
        if (datosServidor.hasOwnProperty('created_at')) {
          datosServidor.updated_at = nfecha('timestamp');
        }
        datosServidor.estado = 'DISPONIBLE';
/*        const envio = await enviarDatosPorPost(urlImei, datosServidor, tokenCifrado.value);*/
        const envio = await peticionesFetchOffline('updateData','imei', JSON.stringify(datosServidor));
       }

      }
      }

      // Quitar los que se enviaron correctamente
listaImei = listaImei.filter(imei => !imeisProcesados.includes(imei));

// Actualizar la lista en datosProductoIndex (si aún la vas a usar más adelante)
datosProductoIndex.lista_imei = listaImei.join(',');

}

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

const fmImpuestoIncluido = async(codigo) => {
  const producto = productosVenta.value.find(prod => prod.codigo === codigo);
  if (!producto) return;

  const impuesto = impuestoSistema.value;

  // Verificar si ya tiene el impuesto incluido correctamente
  if (producto.tipo_impuesto === 'Incluido') {
    toast.removeAllGroups();
    toast.add({
      severity: 'info',
      summary: 'Impuesto ya aplicado',
      detail: `El producto "${producto.nombre}" ya tiene el impuesto incluido.`,
      life: 2000
    });
    return;
  }

  // Restaurar precio_venta original desde productosArraySinModificaciones
  const datosProd = productosArraySinModificaciones.value.find(prod => prod.codigo === codigo);
  if (datosProd) {
    let precioOriginal = Number(datosProd.precio_venta) || 0;
    if (precioFijado.value === 'Minimo') {
      precioOriginal = Number(datosProd.precio_min) || precioOriginal;
    } else if (precioFijado.value === 'Al Por Mayor') {
      precioOriginal = Number(datosProd.precio_xmayor) || precioOriginal;
    }
    producto.precio_venta = precioOriginal;
  }

  // Guardar el precio total original (que ya incluye el impuesto)
  const precioTotalOriginal = Number(producto.precio_venta);

  // Calcular precio base sin impuesto (desglosando el precio total)
  // Fórmula: precio_base = precio_total / (1 + tasa_impuesto)
  const precioBase = precioTotalOriginal / (1 + impuesto / 100);
  const montoImpuesto = precioTotalOriginal - precioBase;

  // Actualizar producto con impuesto incluido (SIN cambiar el precio final)
  producto.impuestos = impuesto;
  producto.impuesto = montoImpuesto.toFixed(2);
  producto.impuesto_venta = montoImpuesto.toFixed(2);
  producto.precio_venta = precioBase.toFixed(2);
  producto.precio_final = precioTotalOriginal; // Mantener el precio total original
  producto.tipo_impuesto = 'Incluido';

  // Recalcular totales y guardar
  calcularTotalFactura();
  window.localStorage.setItem('productosVenta', JSON.stringify(productosVenta.value));
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

const obtenerProductoVentaContexto = (productoRef) => {
  const producto =
    typeof productoRef === 'object' && productoRef !== null
      ? productoRef
      : productosVenta.value.find(prod => prod.codigo === productoRef);

  if (!producto) {
    return { producto: null, index: -1 };
  }

  const index =
    typeof productoRef === 'object' && productoRef !== null
      ? productosVenta.value.findIndex(prod => {
          if (productoRef.lista_imei && prod.lista_imei === productoRef.lista_imei) {
            return true;
          }

          if (productoRef.imei && prod.imei === productoRef.imei) {
            return true;
          }

          return (
            prod.codigo === productoRef.codigo &&
            prod.nombre === productoRef.nombre
          );
        })
      : productosVenta.value.findIndex(prod => prod.codigo === producto.codigo);

  return { producto, index };
};

const obtenerImeiDesdeProducto = (producto) => {
  if (producto?.lista_imei) {
    return producto.lista_imei.split(',')[0].trim();
  }

  if (producto?.imei) {
    return String(producto.imei).trim();
  }

  return '';
};

const aplicarPrecioDesdeImei = async (productoRef, campoPrecio) => {
  const { producto, index } = obtenerProductoVentaContexto(productoRef);

  if (!producto || index === -1 || producto.categoria !== 'CELULARES') {
    return false;
  }

  const imei = obtenerImeiDesdeProducto(producto);
  if (!imei) {
    return false;
  }

  const datosImei = await peticionesFetchOffline('getDataByField', 'imei', 'imei', imei);
  if (!datosImei) {
    return false;
  }

  const precioBase = Number(datosImei[campoPrecio]) || Number(datosImei.precio_venta) || 0;
  const productoActual = productosVenta.value[index];

  productoActual.precio_personalizado = true;
  productoActual.precio_base_personalizado = precioBase;
  productoActual.precio_venta = precioBase;
  productoActual.precio_final = precioBase;
  productoActual.total = precioBase * (Number(productoActual.cantidad) || 0);
  productoSeleccionado.value = { ...productoActual };

  calcularTotalFactura();
  fncambioTipoImpuesto();
  return true;
};

const fnPrecioNormal = async(productoRef)=>{

   const aplicadoDesdeImei = await aplicarPrecioDesdeImei(productoRef, 'precio_venta');
   if (aplicadoDesdeImei) {
    return;
   }

   const { producto, index } = obtenerProductoVentaContexto(productoRef);
   if (!producto || index === -1) {
    return;
   }

   const productoNormal = await peticionesFetchOffline('getDataByField', 'productos','codigo',producto.codigo);

   productoSeleccionado.value = producto
  if (index !== -1) {
    const copiaProductoActual = { ...productosVenta.value[index] };
   if(productoNormal){
    productoNormal.cantidad = productoSeleccionado.value.cantidad
    productoNormal.descuento = productoSeleccionado.value.descuento
productoNormal.precio_venta = parseFloat(productoNormal.precio_venta) !== 0 
  ? productoNormal.precio_venta 
  : productoSeleccionado.value.precio_venta;

productoNormal.precio_final = Number(productoNormal.precio_final) > 0 
  ? productoNormal.precio_final 
  : (Number(productoNormal.precio_venta) > 0
      ? productoNormal.precio_venta
      : productoSeleccionado.value.precio_final);

    productosVenta.value[index] = { ...productoNormal };

   }


    // 🔵 Restaurar el nombre modificado
    productosVenta.value[index].nombre = copiaProductoActual.nombre;

    // 🔵 Si existe la propiedad lista_imei, también restaurarla
    if ('lista_imei' in copiaProductoActual) {
      productosVenta.value[index].lista_imei = copiaProductoActual.lista_imei;
    }
    if ('imei' in copiaProductoActual) {
      productosVenta.value[index].imei = copiaProductoActual.imei;
    }
    calcularTotalFactura();
     fncambioTipoImpuesto()
  }

}



const fnPrecioMinimo = async(productoRef)=>{

   const aplicadoDesdeImei = await aplicarPrecioDesdeImei(productoRef, 'precio_min');
   if (aplicadoDesdeImei) {
    return;
   }

   const { producto, index } = obtenerProductoVentaContexto(productoRef);
   if (!producto || index === -1) {
    return;
   }

   const productoNormal = await peticionesFetchOffline('getDataByField', 'productos','codigo',producto.codigo);

   productoSeleccionado.value = producto
  if (index !== -1) {
    const copiaProductoActual = { ...productosVenta.value[index] };
    productoNormal.cantidad = productoSeleccionado.value.cantidad
    const precioMin = Number(productoNormal.precio_min) || Number(productoNormal.precio_venta) || 0
    productoNormal.precio_venta = precioMin
    productoNormal.precio_final = precioMin
    productoNormal.descuento = productoSeleccionado.value.descuento
    productosVenta.value[index] = { ...productoNormal };

    // 🔵 Restaurar el nombre modificado
    productosVenta.value[index].nombre = copiaProductoActual.nombre;

    // 🔵 Si existe la propiedad lista_imei, también restaurarla
    if ('lista_imei' in copiaProductoActual) {
      productosVenta.value[index].lista_imei = copiaProductoActual.lista_imei;
    }
    if ('imei' in copiaProductoActual) {
      productosVenta.value[index].imei = copiaProductoActual.imei;
    }

    calcularTotalFactura();
  }

}
/*********************************************************/
const fnXmayor = async(productoRef)=>{

   const aplicadoDesdeImei = await aplicarPrecioDesdeImei(productoRef, 'precio_xmayor');
   if (aplicadoDesdeImei) {
    return;
   }

   const { producto, index } = obtenerProductoVentaContexto(productoRef);
   if (!producto || index === -1) {
    return;
   }

   const productoNormal = await peticionesFetchOffline('getDataByField', 'productos','codigo',producto.codigo);

   productoSeleccionado.value = producto
  if (index !== -1) {
        const copiaProductoActual = { ...productosVenta.value[index] };
    productoNormal.cantidad = productoSeleccionado.value.cantidad
    const precioXmayor = Number(productoNormal.precio_xmayor) || Number(productoNormal.precio_venta) || 0
    productoNormal.precio_venta = precioXmayor
    productoNormal.precio_final = precioXmayor
    productoNormal.descuento = productoSeleccionado.value.descuento
    productosVenta.value[index] = { ...productoNormal };
    // 🔵 Restaurar el nombre modificado
    productosVenta.value[index].nombre = copiaProductoActual.nombre;

    // 🔵 Si existe la propiedad lista_imei, también restaurarla
    if ('lista_imei' in copiaProductoActual) {
      productosVenta.value[index].lista_imei = copiaProductoActual.lista_imei;
    }
    if ('imei' in copiaProductoActual) {
      productosVenta.value[index].imei = copiaProductoActual.imei;
    }
    calcularTotalFactura();
  }

}
/*********************************************************/
// Funciones para botones de precio en modal de edición
const fnAplicarPrecioVenta = async() => {
  const aplicadoDesdeImei = await aplicarPrecioDesdeImei(productoSeleccionado.value, 'precio_venta');
  if (aplicadoDesdeImei) {
    productoSeleccionado.value = { ...productoSeleccionado.value, ...obtenerProductoVentaContexto(productoSeleccionado.value).producto };
    toast.add({
      severity: 'success',
      summary: 'Precio Aplicado',
      detail: 'Precio de Venta aplicado correctamente',
      life: 2000
    });
    return;
  }

  const productoOriginal = await peticionesFetchOffline('getDataByField', 'productos', 'codigo', productoSeleccionado.value.codigo);
  if (productoOriginal) {
    const { index } = obtenerProductoVentaContexto(productoSeleccionado.value);
    if (index !== -1) {
      const copiaProductoActual = { ...productosVenta.value[index] };
      productoOriginal.cantidad = productoSeleccionado.value.cantidad;
      productoOriginal.descuento = productoSeleccionado.value.descuento;
      productoOriginal.precio_venta = parseFloat(productoOriginal.precio_venta) !== 0
        ? productoOriginal.precio_venta
        : productoSeleccionado.value.precio_venta;
      productoOriginal.precio_final = Number(productoOriginal.precio_final) > 0
        ? productoOriginal.precio_final
        : (Number(productoOriginal.precio_venta) > 0
            ? productoOriginal.precio_venta
            : productoSeleccionado.value.precio_final);

      productosVenta.value[index] = { ...productoOriginal };
      productosVenta.value[index].nombre = copiaProductoActual.nombre;
      if ('lista_imei' in copiaProductoActual) {
        productosVenta.value[index].lista_imei = copiaProductoActual.lista_imei;
      }
      if ('imei' in copiaProductoActual) {
        productosVenta.value[index].imei = copiaProductoActual.imei;
      }

      // Actualizar productoSeleccionado para que la modal refleje los cambios
      productoSeleccionado.value = { ...productosVenta.value[index] };
      calcularTotalFactura();
    }
    toast.add({
      severity: 'success',
      summary: 'Precio Aplicado',
      detail: 'Precio de Venta aplicado correctamente',
      life: 2000
    });
  }
};

const fnAplicarPrecioMinimo = async() => {
  const aplicadoDesdeImei = await aplicarPrecioDesdeImei(productoSeleccionado.value, 'precio_min');
  if (aplicadoDesdeImei) {
    productoSeleccionado.value = { ...productoSeleccionado.value, ...obtenerProductoVentaContexto(productoSeleccionado.value).producto };
    toast.add({
      severity: 'warning',
      summary: 'Precio Aplicado',
      detail: 'Precio Mínimo aplicado correctamente',
      life: 2000
    });
    return;
  }

  const productoOriginal = await peticionesFetchOffline('getDataByField', 'productos', 'codigo', productoSeleccionado.value.codigo);
  if (productoOriginal) {
    const { index } = obtenerProductoVentaContexto(productoSeleccionado.value);
    if (index !== -1) {
      const copiaProductoActual = { ...productosVenta.value[index] };
      productoOriginal.cantidad = productoSeleccionado.value.cantidad;
      const precioMin = Number(productoOriginal.precio_min) || Number(productoOriginal.precio_venta) || 0;
      productoOriginal.precio_venta = precioMin;
      productoOriginal.precio_final = precioMin;
      productoOriginal.descuento = productoSeleccionado.value.descuento;

      productosVenta.value[index] = { ...productoOriginal };
      productosVenta.value[index].nombre = copiaProductoActual.nombre;
      if ('lista_imei' in copiaProductoActual) {
        productosVenta.value[index].lista_imei = copiaProductoActual.lista_imei;
      }
      if ('imei' in copiaProductoActual) {
        productosVenta.value[index].imei = copiaProductoActual.imei;
      }

      // Actualizar productoSeleccionado para que la modal refleje los cambios
      productoSeleccionado.value = { ...productosVenta.value[index] };
      calcularTotalFactura();
    }
    toast.add({
      severity: 'warning',
      summary: 'Precio Aplicado',
      detail: 'Precio Mínimo aplicado correctamente',
      life: 2000
    });
  }
};

const fnAplicarPrecioXMayor = async() => {
  const aplicadoDesdeImei = await aplicarPrecioDesdeImei(productoSeleccionado.value, 'precio_xmayor');
  if (aplicadoDesdeImei) {
    productoSeleccionado.value = { ...productoSeleccionado.value, ...obtenerProductoVentaContexto(productoSeleccionado.value).producto };
    toast.add({
      severity: 'success',
      summary: 'Precio Aplicado',
      detail: 'Precio Por Mayor aplicado correctamente',
      life: 2000
    });
    return;
  }

  const productoOriginal = await peticionesFetchOffline('getDataByField', 'productos', 'codigo', productoSeleccionado.value.codigo);
  if (productoOriginal) {
    const { index } = obtenerProductoVentaContexto(productoSeleccionado.value);
    if (index !== -1) {
      const copiaProductoActual = { ...productosVenta.value[index] };
      productoOriginal.cantidad = productoSeleccionado.value.cantidad;
      const precioXMayor = Number(productoOriginal.precio_xmayor) || Number(productoOriginal.precio_venta) || 0;
      productoOriginal.precio_venta = precioXMayor;
      productoOriginal.precio_final = precioXMayor;
      productoOriginal.descuento = productoSeleccionado.value.descuento;

      productosVenta.value[index] = { ...productoOriginal };
      productosVenta.value[index].nombre = copiaProductoActual.nombre;
      if ('lista_imei' in copiaProductoActual) {
        productosVenta.value[index].lista_imei = copiaProductoActual.lista_imei;
      }
      if ('imei' in copiaProductoActual) {
        productosVenta.value[index].imei = copiaProductoActual.imei;
      }

      // Actualizar productoSeleccionado para que la modal refleje los cambios
      productoSeleccionado.value = { ...productosVenta.value[index] };
      calcularTotalFactura();
    }
    toast.add({
      severity: 'success',
      summary: 'Precio Aplicado',
      detail: 'Precio Por Mayor aplicado correctamente',
      life: 2000
    });
  }
};

const fnAplicarGratis = () => {
  const index = productosVenta.value.findIndex(prod => prod.codigo === productoSeleccionado.value.codigo);
  if (index !== -1) {
    const copiaProductoActual = { ...productosVenta.value[index] };
    productoSeleccionado.value.precio_venta = 0;
    productoSeleccionado.value.precio_final = 0;
    productoSeleccionado.value.impuestos = 0;

    productosVenta.value[index] = { ...productoSeleccionado.value };
    productosVenta.value[index].nombre = copiaProductoActual.nombre;
    if ('lista_imei' in copiaProductoActual) {
      productosVenta.value[index].lista_imei = copiaProductoActual.lista_imei;
    }

    // Actualizar productoSeleccionado para que la modal refleje los cambios
    productoSeleccionado.value = { ...productosVenta.value[index] };
    calcularTotalFactura();
  }
  toast.add({
    severity: 'info',
    summary: 'Producto Gratis',
    detail: 'Precio puesto en cero (Gratis)',
    life: 2000
  });
};

/*********************************************************/
const fnOferta = async(productoRef)=>{
/*   const productoNormal = await peticionesFetch(`${link.value}${api.value}`,`datoscampo/productos/codigo/${codigo}`,{},tokenCifrado.value,'GET');*/
   const { producto, index } = obtenerProductoVentaContexto(productoRef);
   if (!producto || index === -1) {
    return;
   }

   const productoNormal = await peticionesFetchOffline('getDataByField', 'productos','codigo',producto.codigo);

   productoSeleccionado.value = producto
  if (index !== -1) {
    const copiaProductoActual = { ...productosVenta.value[index] };
    productoNormal.cantidad = productoSeleccionado.value.cantidad
    const precioOferta = Number(productoNormal.oferta) || Number(productoNormal.precio_venta) || 0
    productoNormal.precio_venta = precioOferta
    productoNormal.precio_final = precioOferta
    productoNormal.descuento = productoSeleccionado.value.descuento
    productosVenta.value[index] = { ...productoNormal };
     productosVenta.value[index].nombre = copiaProductoActual.nombre;
    if ('lista_imei' in copiaProductoActual) {
      productosVenta.value[index].lista_imei = copiaProductoActual.lista_imei;
    }
    if ('imei' in copiaProductoActual) {
      productosVenta.value[index].imei = copiaProductoActual.imei;
    }
    calcularTotalFactura();
     fncambioTipoImpuesto()
  }
}
/************************************************************/
//fnincluirImpuesto
//fnagregarImpuesto
const fnCambiarComprobante = ()=>{
  if(comprobante.value === 'FINAL'){
    tipoImpuestoFactura.value = 'INCLUIDO';
    fncambioTipoImpuesto();
  }
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
  const index = productosVenta.value.findIndex(prod => prod.codigo === productoSeleccionado.value.codigo);

  if (index !== -1) {
    // Crear nuevo objeto con todos los datos del producto actual
/*    const productoActualizado = { ...productosVenta.value[index] };

    // Actualizar los valores de los inputs
    productoActualizado.precio_venta = Number(productoSeleccionado.value.precio_venta);
    productoActualizado.precio_final = Number(productoSeleccionado.value.precio_final);
    productoActualizado.impuestos = Number(productoSeleccionado.value.impuestos);*/

    productosVenta.value[index].precio_venta = Number(productoSeleccionado.value.precio_venta);
    productosVenta.value[index].precio_final = Number(productoSeleccionado.value.precio_final);
    productosVenta.value[index].impuestos = Number(productoSeleccionado.value.impuestos);

    // Calcular el impuesto_venta (diferencia entre precio_final y precio_venta)
    const calculoImpuesto = Number(productoSeleccionado.value.precio_final) - Number(productoSeleccionado.value.precio_venta);
    productosVenta.value[index].impuesto_venta = calculoImpuesto.toFixed(2);
    productosVenta.value[index].impuesto = calculoImpuesto.toFixed(2);

    // Marcar como precio personalizado para que fncambioTipoImpuesto no lo sobrescriba
    productosVenta.value[index].precio_personalizado = true;
    productosVenta.value[index].precio_base_personalizado = Number(productoSeleccionado.value.precio_final);

    // RECALCULAR EL TOTAL: cantidad * precio_final - descuento
/*    productoActualizado.total = (Number(productoActualizado.precio_final) * Number(productoActualizado.cantidad)) - Number(productoActualizado.descuento || 0);*/

    productosVenta.value[index].total = (Number(productoSeleccionado.value.precio_final) * Number(productoSeleccionado.value.cantidad)) - Number(productoSeleccionado.value.descuento || 0);

    // Usar splice para forzar reactividad
   // productosVenta.value.splice(index, 1, productoActualizado);

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
    if ('lista_imei' in copiaProductoActual) {
      productosVenta.value[index].lista_imei = copiaProductoActual.lista_imei;
    }
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
const parseDetallesTelefono = (detallesString) => {
  const detallesArray = detallesString.split(' ');
  const detallesObj = {};

  for (let i = 0; i < detallesArray.length; i += 2) {
    const key = detallesArray[i].replace(':', '').toLowerCase();
    const value = detallesArray[i + 1];
    detallesObj[key] = value;
  }

  return detallesObj;
};
/************************************************************/
const verListadoImei = async(index)=>{
    indexCelular.value = index
    const producto = productosVenta.value[index];
    if (producto && producto.categoria === 'CELULARES') {
      if (producto.lista_imei) {
        const listaImei = producto.lista_imei.split(',')
        productoSeleccionadoLista.value = producto.codigo
        listadoImei.value = listaImei
      }
       visibleListadoImei.value = true
    }
}
/************************************************************/
const verProducto = async (index) => {
  const producto = productosVenta.value[index];
  if (producto && producto.categoria === 'CELULARES') {
    const imei = extraerNumerosEntreParentesis(producto.nombre);
    try {
/*      const datosImei = await peticionesFetch(`${link.value}${api.value}`, `datoscampo/imei/imei/${imei}`, {}, tokenCifrado.value, 'GET');*/
      const datosImei = await peticionesFetchOffline('getDataByField', 'imei','imei',imei);

      // Suponiendo que datosImei contiene los detalles del teléfono
      if (datosImei) {
        const detalles = parseDetallesTelefono(datosImei.detalles);

        Swal.fire({
          title: 'Detalles del Teléfono',
          html: `
            <p><strong>Equipo:</strong> ${datosImei.equipo}</p>
            <p><strong>IMEI:</strong> ${imei}</p>
            <p>${datosImei.detalles}</p>
            <!-- Añade aquí más detalles según la estructura de datosImei -->
          `,
          icon: 'info',
        });
      } else {
        Swal.fire({
          title: 'Error',
          text: 'No se encontraron detalles para este IMEI.',
          icon: 'error',
        });
      }
    } catch (error) {
      Swal.fire({
        title: 'Error',
        text: 'Ocurrió un error al obtener los detalles del teléfono.',
        icon: 'error',
      });
    }
  }
};
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
        <input type="radio" name="impuesto" value="solo" class="form-radio text-blue-600" />
        <span>Solo agregar impuesto</span>
      </label>
      <label class="flex items-center gap-2">
        <input type="radio" name="impuesto" value="todo" class="form-radio text-blue-600" />
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

    if (esAgregarImpuesto) {
      // AGREGAR IMPUESTO: Solo aplicar si no tiene impuesto agregado
      if (producto.tipo_impuesto !== 'Agregado') {
        const precioBase = Number(producto.precio_venta);
        const montoImpuesto = precioBase * (impuesto / 100);
        const precioConImpuesto = precioBase + montoImpuesto;

        producto.impuestos = impuesto;
        producto.impuesto = montoImpuesto.toFixed(2);
        producto.impuesto_venta = montoImpuesto.toFixed(2);
        producto.precio_final = precioConImpuesto.toFixed(2);
        producto.tipo_impuesto = 'Agregado';
      }
    } else {
      // QUITAR IMPUESTO: Solo aplicar si tiene impuesto agregado
      if (producto.tipo_impuesto === 'Agregado') {
        producto.impuestos = 0;
        producto.impuesto = 0;
        producto.impuesto_venta = 0;
        producto.precio_final = producto.precio_venta;
        producto.tipo_impuesto = 'Sin Imp.';
      }
    }
  });

  // Actualizar comprobante fiscal según el estado
  comprobante.value = esAgregarImpuesto ? 'FISCAL' : 'NORMAL';

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
// Asignar puntos de fidelización al cliente
const asignarPuntosFidelizacion = async (nofactura, codigoCliente, totalFactura) => {
  try {
    console.log('🎯 Asignando puntos - Factura:', nofactura, 'Cliente:', codigoCliente, 'Total:', totalFactura);

    // No asignar puntos al cliente genérico
    if (!codigoCliente || codigoCliente === '0000000') {
      console.log('⚠️ Cliente genérico, no se asignan puntos');
      return;
    }

    // Calcular puntos: 1 punto por cada 100 pesos
    const puntosGanados = Math.floor(Number(totalFactura) / 100);

    if (puntosGanados <= 0) {
      console.log('⚠️ Monto insuficiente para puntos');
      return;
    }

    console.log(`💰 Puntos a asignar: ${puntosGanados}`);

    // Obtener el cliente por código usando getDataByField
    const cliente = await peticionesFetchOffline('getDataByField', 'clientes', 'codigo', codigoCliente);

    if (!cliente || !cliente.codigo) {
      console.error('❌ Cliente no encontrado:', codigoCliente);
      return;
    }

    console.log(`👤 Cliente encontrado: ${cliente.nombre}`);
    console.log(`📊 Puntos actuales en BD: ${cliente.puntos || 0}`);

    // Obtener puntos actuales del cliente y sumar los nuevos
    const puntosActuales = Number(cliente.puntos || 0);
    const puntosNuevos = puntosActuales + puntosGanados;

    console.log(`📈 Cálculo: ${puntosActuales} + ${puntosGanados} = ${puntosNuevos}`);

    // Actualizar el campo puntos del cliente
    cliente.puntos = puntosNuevos;
    cliente.updated_at = nfecha('timestamp');

    // Guardar la actualización en la tabla clientes
    const resultado = await peticionesFetchOffline('updateData', 'clientes', JSON.stringify(cliente));

    console.log('💾 Resultado actualización:', resultado);

    if (resultado[0] === 'ok') {
      console.log(`✅ Puntos actualizados: ${cliente.nombre} ahora tiene ${puntosNuevos} puntos`);

      // Registrar en historial
      try {
        const historial = {
          codigo_cliente: codigoCliente,
          tipo_movimiento: 'compra',
          puntos: puntosGanados,
          descripcion: `Compra en factura #${nofactura}`,
          no_factura: nofactura,
          fecha: nfecha('fecha'),
          hora: nfecha('hora'),
          usuario: usuarioLocal.value?.nombre || 'Sistema',
          created_at: nfecha('timestamp'),
          updated_at: nfecha('timestamp')
        };

        await peticionesFetchOffline('insertData', 'historial_puntos', JSON.stringify(historial));
        console.log('📝 Historial registrado');
      } catch (errorHistorial) {
        console.warn('⚠️ No se pudo registrar historial:', errorHistorial);
      }

      // Recargar clientes para reflejar los cambios
      await fetchClientes();

      // Notificar al usuario
      toast.add({
        severity: 'success',
        summary: '🎉 Puntos Ganados',
        detail: `${cliente.nombre} ganó ${puntosGanados} puntos (Total: ${puntosNuevos})`,
        life: 4000
      });
    } else {
      console.error('❌ Error al actualizar puntos:', resultado);
    }

  } catch (error) {
    console.error('❌ Error al asignar puntos:', error);
  }
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

  const elComprobante = comprobantes.value[comprobante.value];


  if (comprobante.value != 'NORMAL') {
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

/**********************************************************/
const actualizarStockporIMEI = async(idProducto)=>{

         const producto = productosArray.value.find(prod=>prod.id == idProducto)

         if (producto) {
         const imeisDisponibles = imeiArray.value.filter(imei => imei.id_equi == idProducto);
        producto.stock = imeisDisponibles.length;
        if (producto.hasOwnProperty('created_at')) {
          producto.updated_at = nfecha('timestamp');
        }

        const url = `${link.value + api.value}/actualizarcampos/productos`;
/*        const envioDatos = await enviarDatosPorPost(url, producto, tokenCifrado.value);*/
        const envioDatos = await peticionesFetchOffline('updateData','productos', JSON.stringify(producto));

     }

}
/**********************************************************/
const imeiVendido = async(datosfactura)=>{
  console.log("datosfactura", datosfactura);

const listaImeiLocal = JSON.parse(window.localStorage.getItem('arrayIMEI')) || [];

  for(let imei of listaImeiLocal){
     const datosIMEI = imeiArray.value.find(prod=>prod.imei == imei.imei);
     if (datosIMEI) {
           const url = link.value+api.value+"/actualizarcampos/imei";

          if (datosIMEI.hasOwnProperty('created_at')) {
                datosIMEI.updated_at = nfecha('timestamp');
          }

          // Encontrar el producto en el carrito para obtener el precio de venta
          const productoVendido = productosVenta.value.find(prod =>
            prod.lista_imei && prod.lista_imei.includes(imei.imei)
          );

          const precioVenta = productoVendido ? parseFloat(productoVendido.precio_venta) : parseFloat(datosIMEI.precio_venta);
          const precioCompra = parseFloat(datosIMEI.precio_compra) || 0;
          const ganancia = precioVenta - precioCompra;

          datosIMEI.estado = 'VENDIDO';
          datosIMEI.fecha_venta = nfecha('fecha');
          datosIMEI.hora_venta = nfecha('hora');
          datosIMEI.factura = datosfactura.nofactura;
          datosIMEI.no_factura = datosfactura.nofactura;
          datosIMEI.comprador = datosfactura.cliente.nombre;
          datosIMEI.precio_venta = precioVenta;
          datosIMEI.ganancia = ganancia.toFixed(2);
          datosIMEI.vendedor = datosfactura.vendedor || usuarioLocal.value.nombre;


/*          const envioDatos = await enviarDatosPorPost(url, datosIMEI,tokenCifrado.value);*/
          const envioDatos = await peticionesFetchOffline('updateData','imei', JSON.stringify(datosIMEI));
            if (envioDatos[0] == 'ok') {
                localStorage.removeItem('arrayIMEI');
                localStorage.removeItem('arrayElectrodomesticos');
               await fetchDataImei();
               await fetchDataElectrodomesticos();
               await actualizarStockporIMEI(datosIMEI.id_equi);
          }else{
              toast.add({ severity: 'error', summary: 'Error', detail: 'Fallo al actualizar los datos del IMEI.', life: 3000 });
            }
     }
  }

}
/**********************************************************/
const electrodomesticoVendido = async(datosfactura)=>{
  console.log("datosfactura electrodomesticos", datosfactura);

  const listaElectroLocal = JSON.parse(window.localStorage.getItem('arrayElectrodomesticos')) || [];

  // Si no hay electrodomésticos vendidos, retornar sin hacer nada
  if (!listaElectroLocal || listaElectroLocal.length === 0) {
    console.log("No hay electrodomésticos para actualizar");
    return;
  }

  for(let electro of listaElectroLocal){
    const datosElectro = electrodomesticosArray.value.find(prod=>prod.serial == electro.serial);
    if (datosElectro) {
      if (datosElectro.hasOwnProperty('created_at')) {
        datosElectro.updated_at = nfecha('timestamp');
      }

      // Encontrar el producto en el carrito para obtener el precio de venta
      const productoVendido = productosVenta.value.find(prod =>
        prod.lista_imei && prod.lista_imei.includes(electro.serial)
      );

      const precioVenta = productoVendido ? parseFloat(productoVendido.precio_venta) : parseFloat(datosElectro.precio_venta);
      const precioCompra = parseFloat(datosElectro.precio_compra) || 0;
      const ganancia = precioVenta - precioCompra;

      datosElectro.estado = 'VENDIDO';
      datosElectro.fecha_venta = nfecha('fecha');
      datosElectro.hora_venta = nfecha('hora');
      datosElectro.no_factura = datosfactura.nofactura;
      datosElectro.comprador = datosfactura.cliente.nombre;
      datosElectro.precio_venta = precioVenta;
      datosElectro.ganancia = ganancia.toFixed(2);
      datosElectro.vendedor = datosfactura.vendedor || usuarioLocal.value.nombre;

      const envioDatos = await peticionesFetchOffline('updateData','electrodomesticos', JSON.stringify(datosElectro));
      if (envioDatos && envioDatos[0] == 'ok') {
        await actualizarStockporSerial(datosElectro.id_equi);
      } else {
        console.error('Error al actualizar electrodoméstico:', envioDatos);
        toast.add({ severity: 'error', summary: 'Error', detail: 'Fallo al actualizar los datos del electrodoméstico.', life: 3000 });
      }
    }
  }
}
/**********************************************************/
const actualizarStockporSerial = async(idProducto)=>{
  const producto = productosArray.value.find(prod=>prod.id == idProducto)

  if (producto) {
    const serialesDisponibles = electrodomesticosArray.value.filter(electro =>
      electro.id_equi == idProducto && electro.estado === 'DISPONIBLE'
    );
    producto.stock = serialesDisponibles.length;
    if (producto.hasOwnProperty('created_at')) {
      producto.updated_at = nfecha('timestamp');
    }

    const envioDatos = await peticionesFetchOffline('updateData','productos', JSON.stringify(producto));
  }
}
/**********************************************************/
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

/*    const verificaCredito = await enviarDatosPorPost(
      `${link.value + api.value}/datosarraydoblecondicion/cuentas_cobrar`,
      { campo1: 'cod_cliente', valor1: clienteSelected.value.codigo, campo2: 'estatus', valor2: 'PENDIENTE' },
      tokenCifrado.value
    );*/

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
    total_institucion: total_institucion.value,
    total_cliente: total_cliente.value,
    quien_paga: quienPagaCotizacion.value,
    monto_institucion: montoInstitucionCotizacion.value,
    monto_cliente: montoClienteCotizacion.value,
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

    // Asignar puntos de fidelización al cliente
    console.log('🎯 Iniciando asignación de puntos...', {
      factura: noFacturaFN.value,
      cliente: clienteSelected.value.codigo,
      total: total.value
    });

    try {
      await asignarPuntosFidelizacion(noFacturaFN.value, clienteSelected.value.codigo, total.value);
    } catch (error) {
      console.error('❌ Error crítico al asignar puntos:', error);
    }

    //inputBuscador[0].value = ''

    if (navigator.onLine) {
      if (metodoPago.value == 'TRANSFERENCIA') {
        const transaccion = await crearTransferencia(link.value, api.value, tokenCifrado.value, toast, noFacturaFN.value, transferenciaFN.value, cuentaBancaria.value, clienteSelected.value.nombre, datosEmpresa.empresa.nombre);
        await asientoDiario(link.value, api.value, tokenCifrado.value, toast, 'EFECTIVO EN BANCO', 'VENTAS', transferenciaFN.value, 'REGISTRO DE VENTA DE PRODUCTOS POR (' + transferenciaFN.value + '), FACTURA #' + noFacturaFN.value+' REGISTRO #'+noTransferencia.value);
        await fetchBanco();
      } else if (metodoPago.value == 'TARJETA') {
        const transaccion = await crearTransferencia(link.value, api.value, tokenCifrado.value, toast, noFacturaFN.value, tarjetaFN.value, cuentaBancaria.value, clienteSelected.value.nombre, datosEmpresa.empresa.nombre);
        await asientoDiario(link.value, api.value, tokenCifrado.value, toast, 'EFECTIVO EN BANCO', 'VENTAS', tarjetaFN.value, 'REGISTRO DE VENTA DE PRODUCTOS POR (' + tarjetaFN.value + '), FACTURA #' + noFacturaFN.value +' REGISTRO #'+noTransferencia.value);
        await fetchBanco();
      } else if (metodoPago.value == 'EFECTIVO') {
        await asientoDiario(link.value, api.value, tokenCifrado.value, toast, 'EFECTIVO EN CAJA', 'VENTAS', efetivoFN.value, 'REGISTRO DE VENTA DE PRODUCTOS POR (' + efetivoFN.value + '), FACTURA #' + noFacturaFN.value);
      } else if (metodoPago.value == 'EFECTIVO Y TRANSFERENCIA') {
        const transaccion = await crearTransferencia(link.value, api.value, tokenCifrado.value, toast, noFacturaFN.value, transferenciaFN.value, cuentaBancaria.value, clienteSelected.value.nombre, datosEmpresa.empresa.nombre);
        await asientoDiario(link.value, api.value, tokenCifrado.value, toast, 'EFECTIVO EN BANCO', 'VENTAS', transferenciaFN.value, 'REGISTRO DE VENTA DE PRODUCTOS POR (' + transferenciaFN.value + '), FACTURA #' + noFacturaFN.value +' REGISTRO #'+noTransferencia.value);
        await asientoDiario(link.value, api.value, tokenCifrado.value, toast, 'EFECTIVO EN CAJA', 'VENTAS', efetivoFN.value, 'REGISTRO DE VENTA DE PRODUCTOS POR (' + efetivoFN.value + '), FACTURA #' + noFacturaFN.value);
        await fetchBanco();
      } else if (metodoPago.value == 'TARJETA TRANSFERENCIA Y EFECTIVO') {
        const transaccionT = await crearTransferencia(link.value, api.value, tokenCifrado.value, toast, noFacturaFN.value, transferenciaFN.value, cuentaBancaria.value, clienteSelected.value.nombre, datosEmpresa.empresa.nombre);
        const transaccion = await crearTransferencia(link.value, api.value, tokenCifrado.value, toast, noFacturaFN.value, tarjetaFN.value, cuentaBancaria.value, clienteSelected.value.nombre, datosEmpresa.empresa.nombre);
        await asientoDiario(link.value, api.value, tokenCifrado.value, toast, 'EFECTIVO EN BANCO', 'VENTAS', tarjetaFN.value, 'REGISTRO DE VENTA DE PRODUCTOS POR (' + tarjetaFN.value + '), FACTURA #' + noFacturaFN.value +' REGISTRO #'+noTransferencia.value);
        await asientoDiario(link.value, api.value, tokenCifrado.value, toast, 'EFECTIVO EN BANCO', 'VENTAS', transferenciaFN.value, 'REGISTRO DE VENTA DE PRODUCTOS POR (' + transferenciaFN.value + '), FACTURA #' + noFacturaFN.value);
        await asientoDiario(link.value, api.value, tokenCifrado.value, toast, 'EFECTIVO EN CAJA', 'VENTAS', efetivoFN.value, 'REGISTRO DE VENTA DE PRODUCTOS POR (' + efetivoFN.value + '), FACTURA #' + noFacturaFN.value);
        await fetchBanco();
      }
    }

    if (facturaAcredito.value) {
      const originalCliente = JSON.parse(JSON.stringify(clienteSelected.value));
      const montoCreditoTotal = Number(totalCreditoConInteres.value) > 0
        ? Number(totalCreditoConInteres.value)
        : Number(saldoCREDITO.value);

      const construirCuentaCobrar = async ({ montoCredito, tipoDestino }) => {
        const camposCUENTASCOBRAR = await arrayToObjetoFromTablaOffline('cuentas_cobrar');
        facturaAcreditoEmision.value = generarCodigoUnico();

        const monto = Number(montoCredito || 0).toFixed(2);

        camposCUENTASCOBRAR.no_emision = facturaAcreditoEmision.value;
        camposCUENTASCOBRAR.no_factura = noFacturaFN.value;
        camposCUENTASCOBRAR.comprobante = comprobanteFN.value;

        // Siempre registrar el cliente real de la venta en la cuenta por cobrar.
        camposCUENTASCOBRAR.cod_cliente = originalCliente?.codigo || '';
        camposCUENTASCOBRAR.nombre_cliente = originalCliente?.nombre || '';
        camposCUENTASCOBRAR.cedula_cliente = originalCliente?.cedula || '';
        camposCUENTASCOBRAR.telefono_cliente = originalCliente?.telefono || '';
        camposCUENTASCOBRAR.whatsapp_cliente = originalCliente?.whatsapp || '';
        camposCUENTASCOBRAR.email_cliente = originalCliente?.email || '';
        camposCUENTASCOBRAR.direccion_cliente = originalCliente?.direccion || '';
        camposCUENTASCOBRAR.rnc_cliente = originalCliente?.rnc || '';
        camposCUENTASCOBRAR.nombrecomercial_cliente = originalCliente?.n_comercial || '';

        camposCUENTASCOBRAR.quiencredito = tipoDestino;
        camposCUENTASCOBRAR.institucion = tipoDestino === 'INSTITUCION' ? institucion.value : '';
        camposCUENTASCOBRAR.cliente = originalCliente.nombre;
        camposCUENTASCOBRAR.fecha_emision = nfecha('fecha');
        camposCUENTASCOBRAR.monto_credito = monto;
        camposCUENTASCOBRAR.interes = interesCredito.value;
        camposCUENTASCOBRAR.fecha_vencimiento = formatearFecha(fechaCREDITO.value);
        camposCUENTASCOBRAR.cuotas = cuotasCredito.value;
        camposCUENTASCOBRAR.abonado = '0.00';
        camposCUENTASCOBRAR.saldo = monto;
        camposCUENTASCOBRAR.fecha_pago = formatearFecha(fechaCREDITO.value);
        camposCUENTASCOBRAR.fechas_pago_credito = fechasPagocredito.value;
        camposCUENTASCOBRAR.pagos = JSON.stringify([{ "nopago": "1", "cantidad": '0.00', "turno": '', "cajero": cajeroFN.value, "metodo": metodoPagoCREDITO.value, "fecha": nfecha('fecha'), "hora": nfecha('hora'), "saldo": monto }]);
        camposCUENTASCOBRAR.estatus = 'PENDIENTE';
        camposCUENTASCOBRAR.hora = nfecha('hora');
        camposCUENTASCOBRAR.vendedor = vendedorFN.value;
        camposCUENTASCOBRAR.delivery = deliveryFN.value;
        camposCUENTASCOBRAR.valorcuotascredito = valorCuotasCredito.value;
        camposCUENTASCOBRAR.tipocredito = tipoCredito.value;
        camposCUENTASCOBRAR.tiempocredito = tiempoCredito.value;
        camposCUENTASCOBRAR.nota = notaCREDITO.value;
        camposCUENTASCOBRAR.created_at = nfecha('timestamp');
        camposCUENTASCOBRAR.updated_at = nfecha('timestamp');
        camposCUENTASCOBRAR.almacen = datosEmpresa.empresa.nombre;

        return camposCUENTASCOBRAR;
      };

      const cuentasCrear = [];

      if (quienCredito.value === 'CLIENTE') {
        cuentasCrear.push({ montoCredito: montoCreditoTotal, tipoDestino: 'CLIENTE' });
      } else if (quienCredito.value === 'INSTITUCION') {
        cuentasCrear.push({ montoCredito: montoCreditoTotal, tipoDestino: 'INSTITUCION' });
      } else if (quienCredito.value === 'AMBAS') {
        const montoInst = Number(montoInstitucionCREDITO.value || 0);
        const montoCliente = Number(montoClienteCREDITO.value || 0);
        const sumaPartes = Number((montoInst + montoCliente).toFixed(2));
        const totalCredito = Number(montoCreditoTotal.toFixed(2));

        if (Math.abs(sumaPartes - totalCredito) > 0.01) {
          toast.add({ severity: 'warn', summary: 'Validación', detail: 'La suma de institución + cliente debe ser igual al saldo del crédito', life: 4000 });
          loading.value = false;
          return;
        }

        if (montoInst > 0) {
          cuentasCrear.push({ montoCredito: montoInst, tipoDestino: 'INSTITUCION' });
        }
        if (montoCliente > 0) {
          cuentasCrear.push({ montoCredito: montoCliente, tipoDestino: 'CLIENTE' });
        }

        if (cuentasCrear.length === 0) {
          toast.add({ severity: 'warn', summary: 'Validación', detail: 'Debes asignar monto a institución o cliente', life: 4000 });
          loading.value = false;
          return;
        }
      }
for (const cuentaData of cuentasCrear) {
        const payloadCxc = await construirCuentaCobrar(cuentaData);
        const envioDatosCUENTASCOBRAR = await peticionesFetchOffline('insertData', 'cuentas_cobrar', JSON.stringify(payloadCxc));
        if (envioDatosCUENTASCOBRAR[0] !== 'ok') {
          toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo crear una cuenta por cobrar', life: 4000 });
          loading.value = false;
          return;
        }
      }

      if (navigator.onLine) {
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
    }

    if (facturaApartado.value) {
      const camposApartado = await arrayToObjetoFromTabla(link.value + api.value, tokenCifrado.value, 'apartados');

      facturaAcreditoEmision.value = generarCodigoUnico()

      camposApartado.no_emision = facturaAcreditoEmision.value;
      camposApartado.no_factura = noFacturaFN.value;
      camposApartado.cod_cliente = clienteSelected.value.codigo;
      camposApartado.nombre_cliente = clienteSelected.value.nombre;
      camposApartado.cedula_cliente = clienteSelected.value.cedula;
      camposApartado.telefono_cliente = clienteSelected.value.telefono;
      camposApartado.whatsapp_cliente = clienteSelected.value.whatsapp;
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

      if (navigator.onLine) {
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
    tipoImpuestoFactura.value = datosConfiguracion.value.tipo_papel;

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

    // Actualizar IMEIs y Electrodomésticos vendidos
    const datosFacturaVendida = {
      nofactura: noFacturaFN.value,
      cliente: clienteSelected.value,
      vendedor: vendedorFN.value,
      no_factura: noFacturaFN.value
    };
    await imeiVendido(datosFacturaVendida);
    await electrodomesticoVendido(datosFacturaVendida);

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
          generadorpdf();
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
    //comprobanteFN: comprobanteFN.value,
    //tipocomprobanteFN: mensajeComprobantes.value[comprobante.value],
    estadoFN: estadoFN.value,
    //metodoPagoFN: metodoPago.value,
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
    total_institucion: total_institucion.value,
    total_cliente: total_cliente.value,
    quien_paga: quienPagaCotizacion.value,
    monto_institucion: montoInstitucionCotizacion.value,
    monto_cliente: montoClienteCotizacion.value,
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

    // Si la factura es a CRÉDITO, actualizar también la cuenta por cobrar
    if (datosFactura.metodo_pago === 'CREDITO') {
      const cuentaCobrar = await peticionesFetchOffline('getDataByField', 'cuentas_cobrar', 'no_factura', numerodocumentoEditado.value);
      if (cuentaCobrar) {
        const nuevoMonto = Number(datosFN.total || 0).toFixed(2);
        const abonadoActual = Number(cuentaCobrar.abonado || 0);
        const nuevoSaldo = Math.max(0, Number(nuevoMonto) - abonadoActual).toFixed(2);

        cuentaCobrar.monto_credito = nuevoMonto;
        cuentaCobrar.saldo = nuevoSaldo;
        cuentaCobrar.comprobante = datosFN.comprobanteFN;
        cuentaCobrar.nota = datosFN.nota;

        const cliente = datosFN.cliente;
        if (cliente) {
          cuentaCobrar.cod_cliente = cliente.codigo || cuentaCobrar.cod_cliente;
          cuentaCobrar.nombre_cliente = cliente.nombre || cuentaCobrar.nombre_cliente;
          cuentaCobrar.cedula_cliente = cliente.cedula || cuentaCobrar.cedula_cliente;
          cuentaCobrar.telefono_cliente = cliente.telefono || cuentaCobrar.telefono_cliente;
          cuentaCobrar.whatsapp_cliente = cliente.whatsapp || cuentaCobrar.whatsapp_cliente;
          cuentaCobrar.email_cliente = cliente.email || cuentaCobrar.email_cliente;
          cuentaCobrar.direccion_cliente = cliente.direccion || cuentaCobrar.direccion_cliente;
          cuentaCobrar.cliente = cliente.nombre || cuentaCobrar.cliente;
        }

        cuentaCobrar.updated_at = nfecha('timestamp');

        const updateCxc = await peticionesFetchOffline('updateData', 'cuentas_cobrar', JSON.stringify(cuentaCobrar));
        if (updateCxc[0] !== 'ok') {
          toast.add({ severity: 'warn', summary: 'Atención', detail: 'Factura actualizada pero no se pudo actualizar la cuenta por cobrar', life: 4000 });
        }
      }
    }

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
          telefono: clienteSelected.value.telefono || '',
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
          telefono: clienteSelected.value.telefono || '',
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
    telefono_cliente: clienteSelected.value.telefono || '',
    whatsapp_cliente: clienteSelected.value.whatsapp || clienteSelected.value.telefono || '',
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
          telefono: clienteSelected.value.telefono || '',
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

// Recalcular impuestos antes de guardar
let impuestosCotizacion = 0;
productosVenta.value.forEach(producto => {
  if (producto.nombre !== 'DESCUENTO' && producto.nombre !== 'DESCUENTO APLICADO') {
    const impuestoUnitario = Number(producto.impuesto_venta) || 0;
    const cantidad = Number(producto.cantidad) || 1;
    impuestosCotizacion += impuestoUnitario * cantidad;
  }
});

// Asignar valores de total_institucion y total_cliente según quienPagaCotizacion
total_institucion.value = Number(montoInstitucionCotizacion.value || 0);
total_cliente.value = Number(montoClienteCotizacion.value || 0);

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
 quien_paga: quienPagaCotizacion.value,
 monto_institucion: montoInstitucionCotizacion.value,
 monto_cliente: montoClienteCotizacion.value,
 impuesto : impuestosCotizacion.toFixed(2),
 ganancia : gananciaFN.value,
 vencimiento : agregarDiasalaFechaActual(Number(datosDefault.value.dias_cotizacion)),
 descuento : descuento.value,
 total_institucion:total_institucion.value,
 total_cliente:total_cliente.value,
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
    total_institucion.value = 0.00;
    total_cliente.value = 0.00;
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
    "imei":prods.imei,
    "lista_imei":prods.lista_imei || prods.imei || "",
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
    // Mantener el cliente de la cotización en lugar de resetearlo
    const verificarCliente = allClientes.value.find(client => client.codigo === datosCotizacion.cod_cliente);
    if (verificarCliente) {
      clienteSelected.value = verificarCliente;
    }
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
const generadorpdf = async () => {
  const factura = datosFactCoti.value.numero;
  const tipo = datosFactCoti.value.tipo;

  datosFactCoti.value.impresora = 'Tinta'

  if (factura == '') {
    toast.add({ severity: 'error', summary: 'Error', detail: 'Debe seleccionar una Factura Primero', life: 3000 });
    return;
  }

  // Cerrar la modal de facturas y cotizaciones
  visiblefatcoti.value = false;

  // Solo mostrar opciones para Factura y Cotización
  if (tipo === 'Factura' || tipo === 'Cotizacion') {
    const { value: opcion } = await Swal.fire({
      title: '¿Dónde deseas ver el PDF?',
      icon: 'question',
      showDenyButton: true,
      showCancelButton: true,
      confirmButtonText: 'Ver en Local',
      denyButtonText: 'Ver en Servidor',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#3B82F6',
      denyButtonColor: '#10B981',
      cancelButtonColor: '#6B7280'
    });

    if (opcion === undefined) {
      // Usuario canceló
      return;
    }

    const datosEmpresaLocal = enviarDatosLocalStorage();

    if (opcion) {
      // Ver en Local (confirmado)
      if (tipo === 'Factura') {
        const datosFactura = allFacturasFull.value.find(fact => fact.no_factura === factura);
        if (!datosFactura) {
          toast.add({ severity: 'error', summary: 'Error', detail: 'No se encontró la factura', life: 3000 });
          return;
        }
        const datosCliente = allClientes.value.find(cl => cl.codigo === datosFactura.cod_cliente);
        let creditoData = null
        if (String(datosFactura?.metodo_pago || '').toUpperCase() === 'CREDITO') {
          const datosCxC = await peticionesFetchOffline('getDataByField', 'cuentas_cobrar', 'no_factura', datosFactura.no_factura)
          if (datosCxC && datosCxC.length > 0) creditoData = datosCxC[0]
        }
        await facturaPdfPrintRef.value.printFactura({ factura: datosFactura, cliente: datosCliente, datosEmpresa: datosEmpresaLocal, creditoData });
      } else if (tipo === 'Cotizacion') {
        const datosCotizacion = await peticionesFetchOffline('getDataByField','cotizacion','no_cotizacion',factura);
        if (!datosCotizacion) {
          toast.add({ severity: 'error', summary: 'Error', detail: 'No se encontró la cotización', life: 3000 });
          return;
        }
        const datosCliente = allClientes.value.find(cl => cl.codigo === datosCotizacion?.cod_cliente);
        await cotizacionPdfPrintRef.value.printCotizacion({ cotizacion: datosCotizacion, cliente: datosCliente, datosEmpresa: datosEmpresaLocal });
      }
    } else {
      // Ver en Servidor (denegado)
      if (!link.value) {
        toast.add({ severity: 'error', summary: 'Error', detail: 'No hay URL de servidor configurada', life: 3000 });
        return;
      }
      const tipoParam = tipo === 'Factura' ? 'factura' : 'cotizacion';
      const url = `${link.value}/receipt/factura?${tipoParam}=${factura}`;

      if (window.electron) {
        window.electron.ipcRenderer.invoke('open-new-window', url, 'url', false, true, false);
        return;
      }

      const isiOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
      if (isiOS) {
        window.open(url, "_blank");
        return;
      }

      Swal.fire({
        title: `Vista previa del PDF - Servidor`,
        width: '80%',
        padding: '1rem',
        html: `<iframe src="${url}" style="width:100%; height:80vh; border:none; border-radius:8px;"></iframe>`,
        showCancelButton: true,
        confirmButtonText: 'Descargar',
        cancelButtonText: 'Cerrar',
        confirmButtonColor: '#3B82F6',
        cancelButtonColor: '#EF4444',
        customClass: { popup: 'rounded-xl' },
        preConfirm: () => {
          const a = document.createElement('a');
          a.href = url;
          a.download = `${tipoParam}-${factura}.pdf`;
          a.click();
        }
      });
    }
  } else {
    // Fallback para otros tipos que no tienen componente PDF dedicado
    const datosEmpresaLocal = enviarDatosLocalStorage();
    const tipoN = { 'Factura': 'factura', 'Cotizacion': 'cotizacion', 'Pre-Factura': 'prefactura', 'Orden': 'orden', 'Apartado': 'apartado' };
    let url = `${link.value}/receipt/factura?${tipoN[tipo] || 'factura'}=${factura}`;

    const isiOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    if (isiOS) {
      window.open(url, "_blank");
      return;
    }

    Swal.fire({
      title: `Vista previa del PDF`,
      width: '80%',
      padding: '1rem',
      html: `<embed src="${url}" type="application/pdf" style="width:100%; height:80vh; border-radius:8px;" />`,
      showCancelButton: true,
      confirmButtonText: 'Descargar',
      cancelButtonText: 'Cerrar',
      confirmButtonColor: '#3B82F6',
      cancelButtonColor: '#EF4444',
      customClass: { popup: 'rounded-xl' },
      preConfirm: () => {
        const a = document.createElement('a');
        a.href = url;
        a.download = 'documento-' + factura + '.pdf';
        a.click();
      }
    });
  }
};

/************************************************************/
function extractIMEIs(text) {
    const regex = /\((\d{15}(,\d{15})*)\)/g;
    const matches = [];
    let match;

    while ((match = regex.exec(text)) !== null) {
        const imeis = match[1].split(',');
        matches.push(...imeis);
    }

    return matches;
}
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
         
         for(let prod of productosFactura){

              if (prod.categoria == 'CELULARES') {

                 let listaImei = [];
                
                  if(prod.lista_imei){
                     listaImei = prod.lista_imei.split(',')
                  }else{
                    listaImei = extractIMEIs(prod.nombre)
                  }

                 for(let imei of listaImei){
                   /* const datosImei = await peticionesFetch(`${link.value}${api.value}`,`datoscampo/imei/imei/${imei}`,{},tokenCifrado.value,'GET');*/
                    const datosImei = await peticionesFetchOffline('getDataByField', 'imei','imei',imei);
                    if(datosImei){
                      datosImei.estado = 'DISPONIBLE';
                      datosImei.comprador = '';
                      datosImei.fecha_venta = '';
                      datosImei.hora_venta = '';
                          const url = link.value+api.value+"/actualizarcampos/imei";
                            if (datosImei.hasOwnProperty('created_at')) {
                            datosImei.updated_at = nfecha('timestamp')
                          }
/*                           const envioDatos = await enviarDatosPorPost(url, datosImei,tokenCifrado.value);*/
                           const envioDatos = await peticionesFetchOffline('updateData','imei', JSON.stringify(datosImei));
                           await fetchDataImei()
                           const stockProducto = imeiArray.value.filter(prod=>prod.id_equi == datosImei.id_equi)
                           
                           const datosProdArray = productosArray.value.find(prod=>prod.id == datosImei.id_equi)

                           if (datosProdArray) {

                          const urlProd = link.value+api.value+"/actualizarcampos/productos";
                            if (datosProdArray.hasOwnProperty('created_at')) {
                              datosProdArray.updated_at = nfecha('timestamp')
                          }

                           datosProdArray.stock = stockProducto.length
                        /*  const envioDatosProd = await enviarDatosPorPost(urlProd, datosProdArray,tokenCifrado.value);*/
                          const envioDatosProd = await peticionesFetchOffline('updateData','productos', JSON.stringify(datosProdArray));
                           if (envioDatosProd[0] == 'ok') {
                             toast.removeAllGroups();
                             toast.removeAllGroups();
                            toast.add({ severity: 'success', summary: 'Éxito', detail: 'Producto Restaurado correctamente', life: 3000 });
                           }
                        }
                    }


                 }
              }else{
                
                const datosProdArray = productosArray.value.find(producto=>producto.codigo == prod.codigo)
            
                if (datosProdArray) {

                        const urlProd = link.value+api.value+"/actualizarcampos/productos";
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



              }

              await fetchAndSetupData()
         }

                         if(datosFacturaFull.metodo_pago === 'CREDITO'){
/*                            const datosCredito = await peticionesFetch(`${link.value}${api.value}`, `datoscampo/cuentas_cobrar/no_factura/${datosFacturaFull.no_factura}`, {}, tokenCifrado.value, 'GET');*/
                            const datosCredito = await peticionesFetchOffline('getDataByField', 'cuentas_cobrar','no_factura',datosFacturaFull.no_factura);
                            if(datosCredito){
  /*                              const datosFacturaCredito = await peticionesFetch(`${link.value}${api.value}`, `borrarporcampo/cuentas_cobrar`, { campo: 'id', valor: datosCredito.id }, tokenCifrado.value, 'POST');*/
                                const datosFacturaCredito = await peticionesFetchOffline('deleteEntry','cuentas_cobrar',datosCredito.id);

                             if (datosFacturaCredito[0] == 'ok') {
                                 toast.removeAllGroups();
                                toast.add({ severity: 'success', summary: 'Éxito', detail: 'Datos CREDITO eliminados correctamente', life: 3000 });
                             }


                            }

                         }
      }


 /*     const datosFactura = await peticionesFetch(`${link.value}${api.value}`,`borrarporcampo/facturas`,{campo:'no_factura',valor:factura},tokenCifrado.value,'POST');*/
      const datosFactura = await peticionesFetchOffline('deleteByField', tipo, campo, factura);

      if (datosFactura[0]=='ok') {

            toast.removeAllGroups();
           toast.add({ severity: 'success', summary: 'Éxito', detail: 'Factura eliminada correctamente', life: 3000 });

           // Enviar correo de advertencia de eliminación
           try {
             const datoscorreo = await peticionesFetchOffline('getDataByField', 'configuracion_correo', 'id', 1);

             if (datoscorreo && window.electron?.ipcRenderer) {
               const datosEmpresaLocal = enviarDatosLocalStorage();
               const productosArray = JSON.parse(datosFacturaFull.productos || '[]');

               // Crear tabla HTML de productos
               let tablaProductos = `
                 <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
                   <thead>
                     <tr style="background-color: #dc2626; color: white;">
                       <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Código</th>
                       <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Descripción</th>
                       <th style="border: 1px solid #ddd; padding: 8px; text-align: center;">Cant.</th>
                       <th style="border: 1px solid #ddd; padding: 8px; text-align: right;">Precio</th>
                       <th style="border: 1px solid #ddd; padding: 8px; text-align: right;">Total</th>
                     </tr>
                   </thead>
                   <tbody>
               `;

               productosArray.forEach(prod => {
                 tablaProductos += `
                   <tr>
                     <td style="border: 1px solid #ddd; padding: 8px;">${prod.codigo || ''}</td>
                     <td style="border: 1px solid #ddd; padding: 8px;">${prod.nombre || ''}</td>
                     <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${prod.cantidad || 0}</td>
                     <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">${formatoMonedaRD(prod.precio || 0)}</td>
                     <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">${formatoMonedaRD((prod.cantidad || 0) * (prod.precio || 0))}</td>
                   </tr>
                 `;
               });

               tablaProductos += `
                   </tbody>
                 </table>
               `;

               // Crear HTML del correo
               const htmlCorreo = `
                 <!DOCTYPE html>
                 <html>
                 <head>
                   <meta charset="UTF-8">
                   <style>
                     body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                     .header { background-color: #dc2626; color: white; padding: 20px; text-align: center; }
                     .content { padding: 20px; }
                     .alert-box { background-color: #fee2e2; border-left: 4px solid #dc2626; padding: 15px; margin: 20px 0; }
                     .info-section { background-color: #f9fafb; padding: 15px; margin: 15px 0; border-radius: 5px; }
                     .info-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e5e7eb; }
                     .label { font-weight: bold; color: #4b5563; }
                     .value { color: #111827; }
                     .footer { margin-top: 30px; padding: 15px; background-color: #f3f4f6; text-align: center; font-size: 12px; color: #6b7280; }
                   </style>
                 </head>
                 <body>
                   <div class="header">
                     <h1>⚠️ ALERTA: FACTURA ELIMINADA</h1>
                   </div>

                   <div class="content">
                     <div class="alert-box">
                       <strong>⚠️ ADVERTENCIA:</strong> Se ha eliminado una factura del sistema.
                       Esta acción ha sido registrada para fines de auditoría.
                     </div>

                     <div class="info-section">
                       <h3 style="margin-top: 0; color: #dc2626;">📋 Información de la Factura Eliminada</h3>
                       <div class="info-row">
                         <span class="label">Tipo:</span>
                         <span class="value">${datosFactCoti.value.tipo || 'N/A'}</span>
                       </div>
                       <div class="info-row">
                         <span class="label">Número:</span>
                         <span class="value">${datosFacturaFull.no_factura || datosFacturaFull.no_cotizacion || 'N/A'}</span>
                       </div>
                       <div class="info-row">
                         <span class="label">Fecha de Emisión:</span>
                         <span class="value">${datosFacturaFull.fecha || 'N/A'}</span>
                       </div>
                       <div class="info-row">
                         <span class="label">Cliente:</span>
                         <span class="value">${datosFacturaFull.cliente || 'N/A'}</span>
                       </div>
                       <div class="info-row">
                         <span class="label">Método de Pago:</span>
                         <span class="value">${datosFacturaFull.metodo_pago || 'N/A'}</span>
                       </div>
                       <div class="info-row">
                         <span class="label">Subtotal:</span>
                         <span class="value">${formatoMonedaRD(datosFacturaFull.subtotal || 0)}</span>
                       </div>
                       <div class="info-row">
                         <span class="label">Descuento:</span>
                         <span class="value">${formatoMonedaRD(datosFacturaFull.descuento || 0)}</span>
                       </div>
                       <div class="info-row">
                         <span class="label">ITBIS:</span>
                         <span class="value">${formatoMonedaRD(datosFacturaFull.itbis || 0)}</span>
                       </div>
                       <div class="info-row" style="border-bottom: none;">
                         <span class="label" style="font-size: 18px; color: #dc2626;">Total:</span>
                         <span class="value" style="font-size: 18px; font-weight: bold; color: #dc2626;">${formatoMonedaRD(datosFacturaFull.total || 0)}</span>
                       </div>
                     </div>

                     <div class="info-section">
                       <h3 style="margin-top: 0; color: #dc2626;">📦 Productos</h3>
                       ${tablaProductos}
                     </div>

                     <div class="info-section">
                       <h3 style="margin-top: 0; color: #dc2626;">👤 Información de Eliminación</h3>
                       <div class="info-row">
                         <span class="label">Eliminado por:</span>
                         <span class="value">${datosEmpresa.usuario?.nombre || 'N/A'}</span>
                       </div>
                       <div class="info-row">
                         <span class="label">Empresa/Almacén:</span>
                         <span class="value">${datosEmpresa.empresa?.nombre || 'N/A'}</span>
                       </div>
                       <div class="info-row">
                         <span class="label">Fecha de Eliminación:</span>
                         <span class="value">${nfecha('fecha')}</span>
                       </div>
                       <div class="info-row" style="border-bottom: none;">
                         <span class="label">Hora de Eliminación:</span>
                         <span class="value">${nfecha('hora')}</span>
                       </div>
                     </div>
                   </div>

                   <div class="footer">
                     <p style="margin: 5px 0;">Este es un mensaje automático del sistema ${datosEmpresaLocal.empresa?.nombre || 'Sistema AA'}</p>
                     <p style="margin: 5px 0;">Por favor, no responda a este correo.</p>
                   </div>
                 </body>
                 </html>
               `;

               const envioCorreo = {
                 mailto: datosEmpresaLocal.empresa?.email || datoscorreo.email || 'admin@empresa.com',
                 subjet: `⚠️ ALERTA: Factura Eliminada - ${datosFactCoti.value.tipo} #${factura} - ${datosEmpresa.empresa?.nombre || 'Sistema AA'}`,
                 mensaje: `Se ha eliminado la ${datosFactCoti.value.tipo} #${factura} por ${datosEmpresa.usuario?.nombre || 'Usuario'} el ${nfecha('fecha')} a las ${nfecha('hora')}`,
                 albody: htmlCorreo,
                 correo: datoscorreo,
                 empresa: datosEmpresaLocal.empresa?.nombre || 'Sistema AA'
               };

               // Enviar correo en segundo plano (sin bloquear la UI)
               window.electron.ipcRenderer.invoke('enviarCorreo', envioCorreo)
                 .then(resultado => {
                   if (resultado?.ok) {
                     console.log('Correo de eliminación enviado exitosamente');
                   } else {
                     console.error('Error al enviar correo de eliminación:', resultado?.error);
                   }
                 })
                 .catch(err => {
                   console.error('Error al enviar correo de eliminación:', err);
                 });
             }
           } catch (errorCorreo) {
             console.error('Error al preparar/enviar correo de eliminación:', errorCorreo);
             // No mostrar error al usuario, solo registrar en consola
           }

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

  // Si es Factura, preguntar si quiere convertir a Cotización
  if (tipo === 'Factura') {
    const resultAccion = await Swal.fire({
      title: '¿Qué deseas hacer?',
      text: `Factura #${numero}`,
      icon: 'question',
      showDenyButton: true,
      showCancelButton: true,
      confirmButtonText: 'Solo cambiar cliente',
      denyButtonText: 'Convertir a Cotización',
      cancelButtonText: 'Cancelar'
    });

    if (resultAccion.isDismissed) {
      visiblefatcoti.value = true;
      return;
    }

    // Pedir contraseña
    const resultPassword = await Swal.fire({
      title: 'Introduce la contraseña',
      input: 'password',
      inputPlaceholder: 'Contraseña',
      showCancelButton: true,
      confirmButtonText: 'Confirmar',
      cancelButtonText: 'Cancelar'
    });

    if (!resultPassword.isConfirmed) {
      visiblefatcoti.value = true;
      return;
    }

    const contrasenaIngresada = resultPassword.value;
    if (contrasenaIngresada !== token.value && contrasenaIngresada !== tokenCorto.value && contrasenaIngresada !== tokenSoloUso.value && contrasenaIngresada !== token24H.value) {
      toast.add({ severity: 'error', summary: 'Error', detail: 'Contraseña incorrecta', life: 3000 });
      visiblefatcoti.value = true;
      return;
    }

    // Obtener datos de la factura
    const datosFactura = await peticionesFetchOffline('getDataByField', 'facturas', 'no_factura', numero);
    const cliente = clienteSelected.value;

    if (resultAccion.isConfirmed) {
      // Solo cambiar cliente de la factura
      datosFactura.nombre_cliente = cliente.nombre;
      datosFactura.cod_cliente = cliente.codigo;

      const envioDatos = await peticionesFetchOffline('updateData', 'facturas', JSON.stringify(datosFactura));
      if (envioDatos[0] == 'ok') {
        toast.removeAllGroups();
        toast.add({ severity: 'success', summary: 'Éxito', detail: 'Cliente actualizado en la Factura', life: 3000 });
        visiblefatcoti.value = true;
      } else {
        toast.add({ severity: 'error', summary: 'Error', detail: 'Fallo al actualizar los datos.', life: 3000 });
      }
    } else if (resultAccion.isDenied) {
      // Convertir factura a cotización
      const datosCotizacion = {
        no_cotizacion: datosFactura.no_factura,
        cod_cliente: cliente.codigo,
        nombre_cliente: cliente.nombre,
        telefono_cliente: datosFactura.telefono_cliente || cliente.telefono || '',
        rnc_cliente: datosFactura.rnc_cliente || cliente.rnc || '',
        direccion_cliente: datosFactura.direccion_cliente || cliente.direccion || '',
        productos: datosFactura.productos,
        subtotal: datosFactura.subtotal || 0,
        descuento: datosFactura.descuento || 0,
        impuesto: datosFactura.impuesto || 0,
        total: datosFactura.total || 0,
        total_institucion: datosFactura.total_institucion || 0,
        total_cliente: datosFactura.total_cliente || 0,
        entidad_financiera: datosFactura.entidad_financiera || '',
        quien_paga: datosFactura.quien_paga || '',
        nota: datosFactura.nota || '',
        fecha_emision: datosFactura.fecha || nfecha('fecha'),
        vencimiento: agregarDiasalaFechaActual(Number(datosDefault.value.dias_cotizacion || 30)),
        vendedor: datosFactura.vendedor || datosEmpresa.usuario.nombre,
        almacen: datosFactura.almacen || datosEmpresa.empresa.nombre,
        estado: 'ACTIVA',
        created_at: nfecha('timestamp'),
        updated_at: nfecha('timestamp')
      };

      // Insertar cotización
      const insertCotizacion = await peticionesFetchOffline('insertData', 'cotizacion', JSON.stringify(datosCotizacion));

      if (insertCotizacion[0] == 'ok') {
        // Eliminar la factura
        const deleteFactura = await peticionesFetchOffline('deleteEntry', 'facturas', datosFactura.id);

        if (deleteFactura[0] == 'ok') {
          toast.removeAllGroups();
          toast.add({ severity: 'success', summary: 'Éxito', detail: 'Factura convertida a Cotización exitosamente', life: 3000 });
          visiblefatcoti.value = true;
        } else {
          toast.add({ severity: 'warn', summary: 'Atención', detail: 'Cotización creada pero no se pudo eliminar la factura', life: 3000 });
        }
      } else {
        toast.add({ severity: 'error', summary: 'Error', detail: 'Error al crear la Cotización', life: 3000 });
      }
    }

  } else {
    // Es Cotización, solo cambiar cliente
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

          const datos = await peticionesFetchOffline('getDataByField', 'cotizacion', 'no_cotizacion', numero);
          const cliente = clienteSelected.value;

          datos.nombre_cliente = cliente.nombre;
          datos.cod_cliente = cliente.codigo;

          const envioDatos = await peticionesFetchOffline('updateData', 'cotizacion', JSON.stringify(datos));
          if (envioDatos[0] == 'ok') {
            toast.removeAllGroups();
            toast.add({ severity: 'success', summary: 'Éxito', detail: 'Datos Actualizados', life: 3000 });
            visiblefatcoti.value = true;
          } else {
            toast.add({ severity: 'error', summary: 'Error', detail: 'Fallo al actualizar los datos.', life: 3000 });
          }
        }
      }
    });
  }

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

        const productos = JSON.parse(datos.productos).map(prod => ({
          ...prod,
          lista_imei: prod.categoria === 'CELULARES'
            ? (prod.lista_imei || prod.imei || '')
            : prod.lista_imei
        }));

        const verificaCLiente = allClientes.value.find(cliente => cliente.codigo === datos.cod_cliente);

        if (!verificaCLiente) {
          toast.add({ severity: 'error', summary: 'Error', detail: 'Este cliente no se encuentra', life: 3000 });
          return;
        } else {
          clienteSelected.value = verificaCLiente;
          if(verificaCLiente.precio_fijado === 'PorMayor'){
            checkedpormayor.value = true
            //alporMayor()
          }
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

       for(let prod of productos){
        console.log("prod", prod);


          
           if (prod.categoria === 'CELULARES') {

                 let listaImei = [];
                
                  if(prod.lista_imei){
                     listaImei = prod.lista_imei.split(',')
                  }else{
                    listaImei = extractIMEIs(prod.nombre)
                  }

                 for(let imei of listaImei){
/*                    const datosImei = await peticionesFetch(`${link.value}${api.value}`,`datoscampo/imei/imei/${imei}`,{},tokenCifrado.value,'GET');*/
                    const datosImei = await peticionesFetchOffline('getDataByField', 'imei','imei',imei);
                    if(datosImei){
                      datosImei.estado = 'DISPONIBLE';
                      datosImei.comprador = '';
                      datosImei.fecha_venta = '';
                      datosImei.hora_venta = '';
                          const url = link.value+api.value+"/actualizarcampos/imei";
                            if (datosImei.hasOwnProperty('created_at')) {
                            datosImei.updated_at = nfecha('timestamp')
                          }
                          /* const envioDatos = await enviarDatosPorPost(url, datosImei,tokenCifrado.value);*/
                           const envioDatos = await peticionesFetchOffline('updateData','imei', JSON.stringify(datosImei));
                           await fetchDataImei()
                           const stockProducto = imeiArray.value.filter(prod=>prod.id_equi == datosImei.id_equi)
                           
                           const datosProdArray = productosArray.value.find(prod=>prod.id == datosImei.id_equi)

                           if (datosProdArray) {

                          const urlProd = link.value+api.value+"/actualizarcampos/productos";
                            if (datosProdArray.hasOwnProperty('created_at')) {
                              datosProdArray.updated_at = nfecha('timestamp')
                          }

                           datosProdArray.stock = stockProducto.length
                       /*   const envioDatosProd = await enviarDatosPorPost(urlProd, datosProdArray,tokenCifrado.value);*/
                          const envioDatosProd = await peticionesFetchOffline('updateData','productos', JSON.stringify(datosProdArray));
                           if (envioDatosProd[0] == 'ok') {
                             toast.removeAllGroups();
                            toast.add({ severity: 'success', summary: 'Éxito', detail: 'Producto Restaurado correctamente', life: 3000 });
                           }
                        }
                    }


                 }

           }else{

/*              const datosPro = await peticionesFetch(`${link.value}${api.value}`,`datoscampo/productos/codigo/${prod.codigo}`,{},tokenCifrado.value,'GET');*/
              const datosPro = await peticionesFetchOffline('getDataByField', 'productos','codigo',prod.codigo);

               if(datosPro){
                  const url = link.value+api.value+"/actualizarcampos/productos";
                  datosPro.stock = (Number(datosPro.stock) + Number(prod.cantidad))
/*                  const envioDatos = await enviarDatosPorPost(url, datosPro,tokenCifrado.value);*/
                  const envioDatos = await peticionesFetchOffline('updateData','productos', JSON.stringify(datosPro));

                  if (envioDatos[0] == 'ok') {
                      toast.removeAllGroups();
                     toast.add({ severity: 'success', summary: 'Éxito', detail: 'Datos Actualizados', life: 3000 });

                  }else{
                    toast.add({ severity: 'error', summary: 'Error', detail: 'Fallo al actualizar los datos.', life: 3000 });
                  }

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



              const productos = JSON.parse(datos.productos).map(prod => ({
          ...prod,
          lista_imei: prod.categoria === 'CELULARES'
            ? (prod.lista_imei || prod.imei || '')
            : prod.lista_imei
        }));
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

      if(tabladefault.value.modo === 'CELULAR'){
        await fetchDataImei();
      }
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
 const actualizarNombreProducto = (nombreProducto, imeiSeleccionado) => {
    // 📌 Expresión regular para extraer los IMEIs dentro de paréntesis
    const regex = /\(([^)]+)\)/;
    const match = nombreProducto.match(regex);

    if (match) {
        // 📌 Reemplazar el contenido entre paréntesis con el IMEI seleccionado
        return nombreProducto.replace(regex, `(${imeiSeleccionado})`);
    }

    // 📌 Si no hay paréntesis, simplemente agregamos el IMEI
    return `${nombreProducto} (${imeiSeleccionado})`;
};

 /************************************************/
const crearGarantia = async (factura, cliente, producto) => {
    const url = `${link.value}${api.value}/insertar/garantia_global`;

    try {
        //const ultimaGarantia = await peticiones(`${link.value}${api.value}/datosmax`, {"tabla":'garantia_global',"campo":'no_garantia'}, 'POST', tokenCifrado.value);
        //const numeroGarantia = generadorCodigo(ultimaGarantia[0], '', 7);
        const numeroGarantia = generarCodigoUnico()
        
        let campos = await arrayToObjetoFromTablaOffline('garantia_global');

        // 📌 Verificar si es un celular y tiene más de un IMEI
        if (producto.categoria === 'CELULARES') {
            let listaImei = [];

            if (!producto.lista_imei) {
                const imeis = extractIMEIs(producto.nombre);
                listaImei = [...imeis];
            } else {
                listaImei = producto.lista_imei.split(',');
            }

            if (listaImei.length > 1) {
                // 📌 Esperar a que el usuario seleccione un IMEI antes de continuar
                const { isConfirmed, value } = await Swal.fire({
                    title: 'Seleccione un IMEI',
                    input: 'select',
                    inputOptions: listaImei.reduce((acc, imei, index) => {
                        acc[index] = imei;
                        return acc;
                    }, {}),
                    inputPlaceholder: 'Seleccione un IMEI',
                    showCancelButton: true,
                    confirmButtonText: "Confirmar",
                    cancelButtonText: "Cancelar",
                    inputValidator: (value) => {
                        if (!value) return 'Debe seleccionar un IMEI.';
                    }
                });

                if (!isConfirmed) {
                    console.log("Selección de IMEI cancelada.");
                    return; // 📌 Si el usuario cancela, detenemos la ejecución
                }

                // 📌 Guardar el IMEI seleccionado en los campos de garantía
                campos.imei = listaImei[value];

                // 📌 Actualizar el nombre del producto con solo el IMEI seleccionado
                producto.nombre = actualizarNombreProducto(producto.nombre, listaImei[value]);
            } else {
                // 📌 Solo hay un IMEI, lo asignamos directamente
                campos.imei = listaImei[0];

                // 📌 Actualizar el nombre del producto con solo el IMEI existente
                producto.nombre = actualizarNombreProducto(producto.nombre, listaImei[0]);
            }
        }

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
        campos.telefono_cliente = cliente.telefono || '+1(809) 000-0000';
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

  // Si no hay porcentaje, no hacer nada (evita modificar productos innecesariamente)
  if (pct === 0) {
    console.log('⏭️ No hay porcentaje, no se modifican los productos');
    return;
  }

  console.log('🔍 fnAplicarPorcentajeMetodoPago - Aplicando porcentaje:', pct, '%');

  productosVenta.value = productosVenta.value.map(prod => {
    // Obtener el impuesto del producto (si existe)
    const impuestoVenta = Number(prod.impuesto_venta || 0);

    // Si tiene precio_real_institucion, significa que tiene porcentaje de institución aplicado
    // En ese caso, usar ese precio como base (no el precio_real del método de pago)
    let precioBase;
    if (prod.precio_real_institucion && prod.porcentaje_institucion > 0) {
      // Tiene porcentaje de institución, mantener ese precio
      const precioConInstitucion = Number(prod.precio_real_institucion) * (1 + Number(prod.porcentaje_institucion) / 100);
      precioBase = precioConInstitucion;
    } else {
      // No tiene institución, usar precio_real o precio_venta (SIN impuestos)
      precioBase = Number(prod.precio_real ?? prod.precio_venta ?? 0);
    }

    // Aplicar porcentaje solo al precio base (sin impuestos)
    const nuevoPrecioVenta = Number((precioBase * (1 + pct / 100)).toFixed(2));
    // Recalcular precio_final sumando el impuesto
    const nuevoPrecioFinal = Number((nuevoPrecioVenta + impuestoVenta).toFixed(2));

    return {
      ...prod,
      precio_real: precioBase,
      porcentaje: pct,
      precio_venta: nuevoPrecioVenta,
      precio_final: nuevoPrecioFinal
    };
  })
}
/************************************************************/
const aplicarRecargoTarjeta = () => {
  if (!metodoPagoTarjetaSeleccionado.value) {
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

// Watch para recalcular cuando cambia el monto de tarjeta
watch([tarjetaFN, metodoPagoTarjetaSeleccionado], () => {
  aplicarRecargoTarjeta();
});

// Watch para resetear selección al cerrar modal
watch(() => visibledinero.value, (newVal) => {
  if (!newVal) {
    productosSeleccionadosRecargo.value = [];
  }
});
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

  // Calcular el total de los productos seleccionados
  const totalProductosSeleccionados = productosSeleccionadosRecargo.value.reduce((sum, index) => {
    const producto = productosVenta.value[index];
    return sum + (Number(producto.precio_final || producto.precio_venta || 0) * Number(producto.cantidad || 1));
  }, 0);

  if (totalProductosSeleccionados === 0) {
    toast.add({ severity: 'warn', summary: 'Advertencia', detail: 'Los productos seleccionados no tienen precio', life: 3000 });
    return;
  }

  // Distribuir el recargo proporcionalmente
  productosSeleccionadosRecargo.value.forEach(index => {
    const producto = productosVenta.value[index];
    const precioActual = Number(producto.precio_final || producto.precio_venta || 0);
    const cantidad = Number(producto.cantidad || 1);
    const subtotalProducto = precioActual * cantidad;

    // Calcular la proporción del recargo que le corresponde a este producto
    const proporcion = subtotalProducto / totalProductosSeleccionados;
    const recargoProducto = recargo * proporcion;

    // Distribuir el recargo entre las unidades del producto
    const recargoUnidad = recargoProducto / cantidad;
    const nuevoPrecio = Number((precioActual + recargoUnidad).toFixed(2));

    // Actualizar el precio del producto
    producto.precio_venta = nuevoPrecio;
    producto.precio_final = nuevoPrecio;
    producto.recargo_aplicado = recargoUnidad;
  });

  toast.add({ severity: 'success', summary: 'Éxito', detail: `Recargo de $${recargo.toFixed(2)} distribuido entre ${productosSeleccionadosRecargo.value.length} producto(s)`, life: 3000 });

  // Limpiar selección
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

// Observa cambios en productosVenta para recalcular el total de la factura
watch(productosVenta, (newProductosVenta) => {
  calcularTotalFactura();
  localStorage.setItem('productosVenta', JSON.stringify(newProductosVenta)); // Guardar los productos actualizados en localStorage
}, { deep: true });

/************************************************************/
//datosIMEI
const fnagregarImei = async()=>{
  //event.stopImmediatePropagation()
  const imeiArrayLocalStorage = JSON.parse(window.localStorage.getItem('arrayIMEI')) || [];

 const verifica = imeiArrayLocalStorage.find(equipo=>equipo.imei == datosIMEI.value.imei)
 if (verifica) {
  toast.add({ severity: 'error', summary: 'Upps', detail: `Equipo ${datosIMEI.value.equipo} ya está en la lista`, life: 3000 });
  return
 }

/* const datosEquipo = await peticionesFetch(`${link.value}${api.value}`,`datoscampo/productos/id/${datosIMEI.value.id_equi}`,{},tokenCifrado.value,'GET');*/
 const datosEquipo = await peticionesFetchOffline('getDataByField', 'productos','id',datosIMEI.value.id_equi);
 //const datosEquipo = productosArray.value.find(prod=>prod.id == datosIMEI.value.id_equi)

 if (datosEquipo) {
   // Guardar datos del IMEI seleccionado para el modal de precios
   imeiSeleccionadoData.value = {
     imei: datosIMEI.value.imei,
     id_equi: datosIMEI.value.id_equi,
     datosEquipo: datosEquipo,
     precio_compra: parseFloat(datosIMEI.value.precio_compra) || parseFloat(datosEquipo.precio_compra) || 0,
     precio_venta: parseFloat(datosIMEI.value.precio_venta) || parseFloat(datosEquipo.precio_venta) || 0,
     precio_min: parseFloat(datosIMEI.value.precio_min) || parseFloat(datosEquipo.precio_min) || 0,
     precio_xmayor: parseFloat(datosIMEI.value.precio_xmayor) || parseFloat(datosEquipo.precio_xmayor) || 0,
     capacidad: datosIMEI.value.capacidad || '64GB'
   };

   // Inicializar precio seleccionado con precio_venta por defecto
   precioSeleccionadoIMEI.value = imeiSeleccionadoData.value.precio_venta;
   precioManualIMEI.value = 0;

   // Limpiar buscador
   awesompleteproductoprincipal.value = '';
   datosIMEI.value = '';

   // Mostrar modal de selección de precio
   visiblePrecioIMEI.value = true;
 }
}
/************************************************************/
//fnagregarElectrodomestico
const fnagregarElectrodomestico = async()=>{
  const electroArrayLocalStorage = JSON.parse(window.localStorage.getItem('arrayElectrodomesticos')) || [];

 const verifica = electroArrayLocalStorage.find(equipo=>equipo.serial == datosElectrodomestico.value.serial)
 if (verifica) {
  toast.add({ severity: 'error', summary: 'Upps', detail: `Electrodoméstico ${datosElectrodomestico.value.equipo} ya está en la lista`, life: 3000 });
  return
 }

 const datosEquipo = await peticionesFetchOffline('getDataByField', 'productos','id',datosElectrodomestico.value.id_equi);

 if (datosEquipo) {
   // Guardar datos del electrodoméstico seleccionado para el modal de precios
   // Reutilizamos las mismas variables del modal de IMEI
   imeiSeleccionadoData.value = {
     imei: datosElectrodomestico.value.serial, // Usamos el campo imei para guardar el serial
     id_equi: datosElectrodomestico.value.id_equi,
     datosEquipo: datosEquipo,
     precio_compra: parseFloat(datosElectrodomestico.value.precio_compra) || parseFloat(datosEquipo.precio_compra) || 0,
     precio_venta: parseFloat(datosElectrodomestico.value.precio_venta) || parseFloat(datosEquipo.precio_venta) || 0,
     precio_min: parseFloat(datosElectrodomestico.value.precio_min) || parseFloat(datosEquipo.precio_min) || 0,
     precio_xmayor: parseFloat(datosElectrodomestico.value.precio_xmayor) || parseFloat(datosEquipo.precio_xmayor) || 0,
     capacidad: datosElectrodomestico.value.capacidad || '',
     esElectrodomestico: true // Marcador para saber que es electrodoméstico
   };

   // Inicializar precio seleccionado con precio_venta por defecto
   precioSeleccionadoIMEI.value = imeiSeleccionadoData.value.precio_venta;
   precioManualIMEI.value = 0;

   // Limpiar buscador
   awesompleteproductoprincipal.value = '';
   datosElectrodomestico.value = '';

   // Mostrar modal de selección de precio
   visiblePrecioIMEI.value = true;
 }
}
/************************************************************/

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
    productoOtro.value.imei = ''
    categoriaNProducto.value = 'ACCESORIOS'
  }else{
    nombreNProducto.value = ''
    descripcionNProducto.value = ''
    pVentaNProducto.value = '0.00'
    costoNProducto.value = '0.00'
    stockNProducto.value = '1'
  }
});

/************************************************************/
const fnCategoriaDesdeImei = (valor) => {
  if (valor && String(valor).replace(/\D/g, '').length > 0) {
    categoriaNProducto.value = 'CELULARES';
  }
};

/************************************************************/
const verificaIMEI = async () => {
  if (!productoOtro.value.imei || productoOtro.value.imei.trim() === '') {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Debe escribir un IMEI válido',
      life: 3000
    });
    return;
  }

  // 🔹 Datos del POST (igual que el ejemplo PHP)
  const datos = {
    service: 0,
    imei: productoOtro.value.imei,
    key: "JKD-QC9-9L9-9C6-GT7-J2I-LIV-U3M" // usa tu propia key
  };

  try {
    const response = await fetch("https://api.ifreeicloud.co.uk", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: new URLSearchParams(datos).toString(), // igual que PHP -> POSTFIELDS
    });

    const status = response.status;

    if (status !== 200) {
      toast.add({
        severity: 'error',
        summary: 'Error HTTP',
        detail: `Código ${status}`,
        life: 3000
      });
      return;
    }

    const myResult = await response.json();

    if (myResult.success !== true) {
      toast.add({
        severity: 'error',
        summary: 'Error API',
        detail: myResult.error || 'Error desconocido',
        life: 3000
      });
      return;
    }

    // ✅ Si todo salió bien:
    console.log('Respuesta:', myResult.response);
    console.log('Objeto:', myResult.object);

    toast.removeAllGroups();
    toast.add({
      severity: 'success',
      summary: 'Éxito',
      detail: `Datos encontrados (${myResult.object.modelName})`,
      life: 3000
    });

    productoOtro.value.marca = myResult.object.brand;
    productoOtro.value.modelo = myResult.object.modelName;
    categoriaNProducto.value = 'CELULARES';
    nombreNProducto.value = `${myResult.object.model} (${myResult.object.modelName})`;

  } catch (error) {
    console.error("Error de conexión:", error);
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Error de conexión o petición fallida',
      life: 3000
    });
  }
};


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

  if(productoOtro.value.imei != ''){
    camposProducto.nombre = camposProducto.nombre + '-(' + productoOtro.value.imei+')'
    camposProducto.lista_imei = productoOtro.value.imei
  }

    const productoExistente = productosVenta.value.find(prod => prod.codigo === camposProducto.codigo);
    if (productoExistente) {
      productoExistente.cantidad += 1;
    } else {
      camposProducto.cantidad = Number(cantidadNProducto.value)
      camposProducto.descuento = 0.00
      camposProducto.total = (Number(cantidadNProducto.value) * Number(pVentaNProducto.value))
      camposProducto.ganancia = ((Number(pVentaNProducto.value) - Number(costoNProducto.value)) * Number(cantidadNProducto.value))
      camposProducto.ganancia_pura = ((Number(pVentaNProducto.value) - Number(costoNProducto.value)) * Number(cantidadNProducto.value))
      camposProducto.marca = 'SIN REGISTRO'
      delete camposProducto.otro
      productosVenta.value.push(camposProducto);
    }
    calcularTotalFactura();
    visibleOtroArticulo.value = false
 nombreNProducto.value = "";
 categoriaNProducto.value = 'CELULARES'

};
/************************************************************/
    const fnAgregarProductoPOS = (codigo) => {
      const selected = productosArray.value.find(prod => prod.codigo === codigo);
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
const filteredImei = computed(() => {
  if (!searchQueryIMEI.value) return listaImeiArray.value;
  return listaImeiArray.value.filter(product => {
    return Object.values(product).some(value =>
      String(value).toLowerCase().includes(searchQueryIMEI.value.toLowerCase())
    );
  });
});
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
const agregarImeiSeleccionados = async () => {
  //selectedImei.value = [];
  if (selectedImei.value.length === 0) {
    toast.add({
      severity: 'warn',
      summary: 'Advertencia',
      detail: 'No se han seleccionado IMEIs.',
      life: 3000,
    });
    return;
  }

   const dataR = selectedImei.value;
   
   for(let imei of dataR){
    handleSelectCompleteproductoprincipal(imei.imei)
   }


}
/************************************************************/
const onRowSelectImeiR = async(selected)=>{
  // Detectar si es IMEI o Serial
  const valorBusqueda = selected.data.imei || selected.data.serial;
  await handleSelectCompleteproductoprincipal(valorBusqueda)

}
/************************************************************/
const fetchImeiDatosarraydoblecondicion = async (id) => {
  try {
/*    const response = await peticionesFetch(
      `${link.value}${api.value}`,
      'datosarraydoblecondicion/imei',
      { campo1: 'id_equi',
        valor1: id,
        campo2: 'estado',
        valor2: 'DISPONIBLE',
        },
      tokenCifrado.value,
      'POST'
    );*/
    const response = await peticionesFetchOffline('getDataByDoubleCondition', 'imei','id_equi',id,'estado','DISPONIBLE');
    return response.filter(ft=>ft.almacen === datosEmpresa.empresa.nombre)
    //imeiData.value = response;
    //imeiDataNames.value = response.map(imei=>imei.name);
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to fetch data from imei',
      life: 3000
    });
  }
};

/************************************************************/
const fnagregarProductoBuscado = async() => {
  // Validar si el producto es de categoría CELULARES y mostrar error si es así
if (datosProductoBuscado.value?.categoria === 'CELULARES') {
    // Mostrar notificación de error
    toast.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Los Celulares solo se agregan por IMEI',
        life: 3000
    });


/*    const data = await peticionesFetch(
      `${link.value}${api.value}`,
      'datosarraydoblecondicion/imei',
      { campo1: 'id_equi',
        valor1: datosProductoBuscado.value.id,
        campo2: 'estado',
        valor2: 'DISPONIBLE',
        },
      tokenCifrado.value,
      'POST'
    );*/
    const data = await peticionesFetchOffline('getDataByDoubleCondition', 'imei','id_equi',datosProductoBuscado.value.id,'estado','DISPONIBLE');

     columnsImei.value = [{'header':'IMEI','field':'imei'}];
    filteredImeiArray.value = data.filter(ft=>ft.almacen === datosEmpresa.empresa.nombre);
    // Hacer visible la lista de IMEI en la interfaz de usuario
    visibleListaImei.value = true;

    // Si es necesario, descomenta la siguiente línea para hacer visible el buscador de IMEI
    // visibleBuscadorIMEI.value = true;

    return;
}


  // Crear una copia del producto buscado para evitar modificar el original
  const productoParaAgregar = { ...datosProductoBuscado.value };
  productoParaAgregar.cantidad = Number(cantidadProductoBuscado.value || 1);
  productoParaAgregar.descuento = 0.00;

  // Verificar si el producto ya existe en productosVenta
  const productoExistente = productosVenta.value.find(prod => prod.codigo === productoParaAgregar.codigo);
  if (productoExistente) {
    productoExistente.cantidad += productoParaAgregar.cantidad;
  } else {
    delete productoParaAgregar.caracteristicas
    delete productoParaAgregar.otro

    // Aplicar porcentaje del método de pago activo si corresponde
    const selectedMetodo = metodoPagoOptions.value.find(m => m.nombre === metodoPago.value)
    const pct = Number(selectedMetodo?.porcentaje || 0)
    if (pct > 0) {
      const precioBase = Number(productoParaAgregar.precio_final ?? productoParaAgregar.precio_venta ?? 0)
      const nuevoPrecio = Number((precioBase * (1 + pct / 100)).toFixed(2))
      productoParaAgregar.precio_real = precioBase
      productoParaAgregar.porcentaje = pct
      productoParaAgregar.precio_venta = nuevoPrecio
      productoParaAgregar.precio_final = nuevoPrecio
    }

    productosVenta.value.push(productoParaAgregar);
  }

  verificaPreciosPorCliente(productoParaAgregar)

  // Calcular el total de la factura después de agregar el producto
  calcularTotalFactura();
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
     actualizarListaBuscadorPrincipal(awesompleteproductoprincipal.value)
  }else if(searchMode.value == 'codigo'){
     actualizarListaBuscadorPrincipal(awesompleteproductoprincipal.value)
  }else if(searchMode.value == 'imei'){
      visiblebuscarImei.value = true;
      listaBuscador.value = []
  }else{
     actualizarListaBuscadorPrincipal(awesompleteproductoprincipal.value)
  }
}
/************************************************************/
let lastSearchedValue = ''; // Almacena el último valor buscado
/************************************************************/
const normalizarTextoBusqueda = (valor) =>
  String(valor || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

const reconstruirIndiceBusquedaProductos = () => {
  indiceBusquedaProductos.value = productosArray.value.map(prod => ({
    nombre: prod.nombre || '',
    nombreNormalizado: normalizarTextoBusqueda(prod.nombre),
    codigo: prod.codigo || '',
    codigoNormalizado: normalizarTextoBusqueda(prod.codigo),
    codigoBarra: prod.codigo_barra || '',
    codigoBarraNormalizado: normalizarTextoBusqueda(prod.codigo_barra)
  }));
};

const actualizarListaBuscadorPrincipal = (query = '') => {
  const termino = normalizarTextoBusqueda(query);

  if (searchMode.value === 'imei') {
    listaBuscador.value = [];
    return;
  }

  const campoBusqueda =
    searchMode.value === 'codigo'
      ? 'codigoNormalizado'
      : searchMode.value === 'barcode'
        ? 'codigoBarraNormalizado'
        : 'nombreNormalizado';

  const campoValor =
    searchMode.value === 'codigo'
      ? 'codigo'
      : searchMode.value === 'barcode'
        ? 'codigoBarra'
        : 'nombre';

  const fuente = indiceBusquedaProductos.value;
  let resultados = [];

  if (!termino) {
    resultados = fuente.slice(0, LIMITE_SUGERENCIAS_BUSQUEDA);
  } else {
    const coincidenciasInicio = [];
    const coincidenciasContenido = [];

    for (const item of fuente) {
      const valorNormalizado = item[campoBusqueda];
      if (!valorNormalizado) {
        continue;
      }

      if (valorNormalizado.startsWith(termino)) {
        coincidenciasInicio.push(item);
      } else if (valorNormalizado.includes(termino)) {
        coincidenciasContenido.push(item);
      }

      if ((coincidenciasInicio.length + coincidenciasContenido.length) >= LIMITE_SUGERENCIAS_BUSQUEDA) {
        break;
      }
    }

    resultados = [...coincidenciasInicio, ...coincidenciasContenido];
  }

  const sugerenciasBase = resultados
    .slice(0, LIMITE_SUGERENCIAS_BUSQUEDA)
    .map(item => item[campoValor])
    .filter(Boolean);

  if (searchMode.value === 'nombre') {
    const sugerenciasImei = imeiArray.value
      .filter(item => normalizarTextoBusqueda(item.imei).includes(termino))
      .slice(0, LIMITE_SUGERENCIAS_BUSQUEDA)
      .map(item => item.imei)
      .filter(Boolean);

    listaBuscador.value = [...new Set([...sugerenciasBase, ...sugerenciasImei])]
      .slice(0, LIMITE_SUGERENCIAS_BUSQUEDA);
    return;
  }

  listaBuscador.value = sugerenciasBase;
};

watch(productosArray, () => {
  reconstruirIndiceBusquedaProductos();
  actualizarListaBuscadorPrincipal(awesompleteproductoprincipal.value);
});

watch(awesompleteproductoprincipal, (newValue) => {
  actualizarListaBuscadorPrincipal(newValue);
});

watch(searchMode, () => {
  actualizarListaBuscadorPrincipal(awesompleteproductoprincipal.value);
});

function buscarProducto(value) {
  lastSearchedValue = value;
  datosProductoSeleccionadoPrincipal.value = '';

  const camposABuscar = ['codigo', 'codigo_barra', 'nombre'];
  let datosPro = null;

  // Find the product in productosArray based on multiple fields
  for (const campo of camposABuscar) {
    const encontrado = productosArray.value.find(prod => prod[campo] === value);
    if (encontrado) {
      datosPro = encontrado;

      // If category is CELULARES, stop the search immediately
      if (encontrado.categoria === 'CELULARES') {
         toast.add({ severity: 'error', summary: 'Error', detail: 'Celulares solo se agregan por IMEI', life: 3000 });
        break;
      } else {
        datosProductoSeleccionadoPrincipal.value = encontrado;
        break;
      }
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
  const camposABuscar = ['codigo', 'codigo_barra', 'nombre'];
  let datosPro = null;

  // Limpiar datos previos
  datosProductoSeleccionadoPrincipal.value = '';
  preciosArrayFerreteria.value = [];

  // Buscar el producto y crear una copia si es encontrado
  for (const campo of camposABuscar) {
    datosPro = productosArray.value.find((prod) => prod[campo] == selected.value);
    if (datosPro) {
      if (datosPro.categoria === 'CELULARES') {
        break;
      } else {
        datosProductoSeleccionadoPrincipal.value = {cantidad:cantidad.value || 1, ...datosPro }; // Crear una copia
        break;
      }
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

if (!datosProductoSeleccionadoPrincipal.value || typeof datosProductoSeleccionadoPrincipal.value !== 'object' || !datosProductoSeleccionadoPrincipal.value.codigo) {
  return;
}

let productoSeleccionadoCopia;

const prodSelectOriginal = JSON.parse(JSON.stringify(datosProductoSeleccionadoPrincipal.value))

const datosProdOriginal = productosArray.value.find((prod) => prod.codigo === datosProductoSeleccionadoPrincipal.value.codigo);

if(datosProdOriginal){
 productoSeleccionadoCopia = JSON.parse(JSON.stringify(datosProdOriginal));
}else{
 productoSeleccionadoCopia = JSON.parse(JSON.stringify(datosProductoSeleccionadoPrincipal.value));

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
      visibleOtroArticulo.value = false;
      const camposABuscar = ["codigo", "codigo_barra", "nombre"];
      let datosPro = null;
      datosProductoSeleccionadoPrincipal.value = "";
      tipoFactura.value;
      for (const campo of camposABuscar) {
        datosPro = productosArray.value.find((prod) => prod[campo] == selected);
        if (datosPro) {
          if (tipoFactura.value === "factura") {
            if (datosPro.categoria === "CELULARES") {
              const data = await peticionesFetchOffline("getDataByDoubleCondition", "imei", "id_equi", datosPro.id, "estado", "DISPONIBLE");
              columnsImei.value = [{ "header": "IMEI", "field": "imei" }];
              filteredImeiArray.value = data.filter(ft=>ft.almacen === datosEmpresa.empresa.nombre);
              visibleListaImei.value = true;
              break;
            } else if (datosPro.categoria === "ELECTRODOMESTICOS") {
              const data = await peticionesFetchOffline("getDataByDoubleCondition", "electrodomesticos", "id_equi", datosPro.id, "estado", "DISPONIBLE");
              columnsImei.value = [{ "header": "Serial", "field": "serial" }];
              filteredImeiArray.value = data.filter(ft=>ft.almacen === datosEmpresa.empresa.nombre);
              visibleListaImei.value = true;
              break;
            } else {
              datosProductoSeleccionadoPrincipal.value = JSON.parse(JSON.stringify(datosPro));
              break;
            }
          } else {
            datosProductoSeleccionadoPrincipal.value = JSON.parse(JSON.stringify(datosPro));
            break;
          }
        } else {
          visibleOtroArticulo.value = false;
        }
      }
      if (!datosProductoSeleccionadoPrincipal.value.nombre) {
        const datosCombo = combosArray.value.find((prod) => prod["nombre"] == selected);
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
      if (tipoFactura.value === "factura") {
        if (!datosProductoSeleccionadoPrincipal.value.nombre) {
          // Buscar por IMEI
          const datosImei = imeiArray.value.find((prod) => prod["imei"] == selected);
          if (datosImei) {
            datosIMEI.value = JSON.parse(JSON.stringify(datosImei));
            fnagregarImei();
            awesompleteproductoprincipal.value = "";
            return;
          }

          // Buscar por Serial de electrodoméstico
          const datosSerial = electrodomesticosArray.value.find((prod) => prod["serial"] == selected);
          if (datosSerial) {
            datosElectrodomestico.value = JSON.parse(JSON.stringify(datosSerial));
            fnagregarElectrodomestico();
            awesompleteproductoprincipal.value = "";
            return;
          }

          // Si no se encuentra ni IMEI ni Serial
          toast.add({ severity: "error", summary: "Error", detail: "NO DISPONIBLE", life: 3e3 });
          return;
        }
        if (datosProductoSeleccionadoPrincipal.value.categoria === "CELULARES" || datosProductoSeleccionadoPrincipal.value.categoria === "ELECTRODOMESTICOS") {
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
      const productoExistente = productosVenta.value.find((prod) => prod.codigo === datosProductoSeleccionadoPrincipal.value.codigo);
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
        if (Number(copiaProducto.precio_final) === Number(copiaProducto.precio_venta)) {
          copiaProducto.precio_venta -= Number(copiaProducto.impuesto_venta);
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
const fnAbrirReemplazarImei = async (index, imeiActual) => {
  const producto = productosVenta.value[indexCelular.value];

  if (!producto) {
    return;
  }

  const imeisDisponibles = imeiArray.value.filter(item =>
    item.id_equi == producto.id &&
    item.estado === 'DISPONIBLE' &&
    item.imei !== imeiActual
  );

  if (imeisDisponibles.length === 0) {
    toast.add({ severity: 'warn', summary: 'Atención', detail: 'No hay IMEIs disponibles para reemplazar', life: 3000 });
    return;
  }

  imeiActualReemplazo.value = imeiActual;
  imeiNuevoSeleccionado.value = null;
  imeisDisponiblesReemplazo.value = imeisDisponibles;
  visibleReemplazarImei.value = true;
};

/************************************************************/
const fnConfirmarReemplazoImei = async () => {
  const producto = productosVenta.value[indexCelular.value];

  if (!producto || !imeiActualReemplazo.value || !imeiNuevoSeleccionado.value) {
    toast.add({ severity: 'warn', summary: 'Atención', detail: 'Debe seleccionar el nuevo IMEI', life: 3000 });
    return;
  }

  try {
    const imeiAnterior = await peticionesFetchOffline('getDataByField', 'imei', 'imei', imeiActualReemplazo.value);
    const imeiNuevo = await peticionesFetchOffline('getDataByField', 'imei', 'imei', imeiNuevoSeleccionado.value);

    if (!imeiAnterior || !imeiNuevo) {
      toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar los IMEIs', life: 3000 });
      return;
    }

    imeiAnterior.estado = 'DISPONIBLE';
    imeiAnterior.updated_at = nfecha('timestamp');
    imeiAnterior.comprador = '';
    imeiAnterior.fecha_venta = '';
    imeiAnterior.hora_venta = '';

    imeiNuevo.estado = 'VENDIDO';
    imeiNuevo.updated_at = nfecha('timestamp');

    await peticionesFetchOffline('updateData', 'imei', JSON.stringify(imeiAnterior));
    await peticionesFetchOffline('updateData', 'imei', JSON.stringify(imeiNuevo));

    const listaActual = String(producto.lista_imei || '').split(',').map(x => x.trim()).filter(Boolean);
    const nuevaLista = listaActual.map(item => item === imeiActualReemplazo.value ? imeiNuevoSeleccionado.value : item);

    producto.lista_imei = nuevaLista.join(',');
    if (producto.imei === imeiActualReemplazo.value) {
      producto.imei = imeiNuevoSeleccionado.value;
    }
    producto.nombre = String(producto.nombre || '').replace(imeiActualReemplazo.value, imeiNuevoSeleccionado.value);

    const imeiArrayLocalStorage = JSON.parse(localStorage.getItem('arrayIMEI')) || [];
    const nuevoArrayImei = imeiArrayLocalStorage.map(item => {
      if (item.imei === imeiActualReemplazo.value) {
        return { ...item, imei: imeiNuevoSeleccionado.value };
      }
      return item;
    });
    localStorage.setItem('arrayIMEI', JSON.stringify(nuevoArrayImei));

    listadoImei.value = [...nuevaLista];
    visibleReemplazarImei.value = false;
    imeiActualReemplazo.value = '';
    imeiNuevoSeleccionado.value = null;
    imeisDisponiblesReemplazo.value = [];

    await fetchDataImei();

    toast.add({ severity: 'success', summary: 'Éxito', detail: 'IMEI reemplazado correctamente', life: 3000 });

    if (documentoEditado.value === 'Factura') {
      await actualizarFactura();
    }
  } catch (error) {
    console.error('Error al reemplazar IMEI:', error);
    toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo reemplazar el IMEI', life: 3000 });
  }
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
const fnBorrarImei = async (index, imei) => {
  // Recuperar IMEIs desde localStorage y obtener los datos del servidor
  const imeiArrayLocalStorage = JSON.parse(localStorage.getItem('arrayIMEI')) || [];
/*  const datosServidor = await peticionesFetch(
    `${link.value}${api.value}`,
    `datoscampo/imei/imei/${imei}`,
    {},
    tokenCifrado.value,
    'GET'
  );*/
  const datosServidor = await peticionesFetchOffline('getDataByField', 'imei','imei',imei);

  // Obtener datos del producto seleccionado en la lista
  const datosCompletosProducto = productosVenta.value.find(prod => prod.codigo === productoSeleccionadoLista.value);

  // Actualizar la lista de IMEIs en el producto seleccionado
  const listadoImeiN = datosCompletosProducto.lista_imei.split(',');
  const nuevaListaImei = listadoImeiN.filter(prod => prod != imei);
  
  // Actualizar propiedades del producto sin mutar el objeto original
  datosCompletosProducto.lista_imei = nuevaListaImei.join(',');
  datosCompletosProducto.cantidad = nuevaListaImei.length;

  // Actualizar el estado de listadoImei en la interfaz
  listadoImei.value = [...nuevaListaImei];

  // Eliminar el producto si no quedan IMEIs en la lista
  if (listadoImei.value.length === 0) {
    eliminarProducto(indexCelular.value);
  }

  // Actualizar el nombre del producto con la lista de IMEIs actualizada
  datosCompletosProducto.nombre = `${datosServidor.equipo} (${nuevaListaImei.join(',')})`;

  // Filtrar el IMEI del almacenamiento local y actualizar localStorage
  const listdoNuevoImei = imeiArrayLocalStorage.filter(prod => prod.imei != imei);
  localStorage.setItem('arrayIMEI', JSON.stringify(listdoNuevoImei));

  // Preparar datos para actualizar el IMEI en el servidor
  const url = `${link.value}${api.value}/actualizarcampos/imei`;
  if (datosServidor.hasOwnProperty('created_at')) {
    datosServidor.updated_at = nfecha('timestamp');
  }
  datosServidor.estado = 'DISPONIBLE';

  // Enviar actualización de datos al servidor
/*  await enviarDatosPorPost(url, datosServidor, tokenCifrado.value);*/
  await peticionesFetchOffline('updateData','imei', JSON.stringify(datosServidor));

  // Actualizar la interfaz con la lista de IMEIs
  await fetchDataImei();

  // Notificar al usuario sobre el éxito de la operación
   toast.removeAllGroups();
  toast.add({ severity: 'success', summary: 'Ok', detail: 'IMEI eliminado', life: 3000 });

  // Actualizar factura si corresponde
  if (documentoEditado.value && documentoEditado.value === 'Factura') {
    actualizarFactura();
  }
};

/************************************************************/
const obtenerNombreProveedorRecibirEquipo = () => {
  return proveedorRecibirSeleccionado.value?.nombre || datoscamposRecibirequipo.value.vendedor || 'PROVEEDOR';
}

const obtenerRncProveedorRecibirEquipo = () => {
  return proveedorRecibirSeleccionado.value?.rnc || datoscamposRecibirequipo.value.cedula || '';
}

const onProveedorRecibirChange = (event) => {
  const proveedor = event?.value || proveedorRecibirSeleccionado.value;
  if (!proveedor) return;

  datoscamposRecibirequipo.value.vendedor = proveedor.nombre || datoscamposRecibirequipo.value.vendedor;
  datoscamposRecibirequipo.value.cedula = proveedor.rnc || datoscamposRecibirequipo.value.cedula;
  datoscamposRecibirequipo.value.telefono = proveedor.telefono || datoscamposRecibirequipo.value.telefono;
  datoscamposRecibirequipo.value.direccion = proveedor.direccion || datoscamposRecibirequipo.value.direccion;
}

const registrarProveedorRecibirEquipo = async () => {
  const nombreProveedor = obtenerNombreProveedorRecibirEquipo();
  if (!nombreProveedor || nombreProveedor.trim() === '' || nombreProveedor === 'PROVEEDOR') {
    return null;
  }

  const proveedorExistente = proveedoresRecibirData.value.find(
    (prov) => String(prov?.nombre || '').toUpperCase() === nombreProveedor.toUpperCase()
  );

  if (proveedorExistente) {
    proveedorRecibirSeleccionado.value = proveedorExistente;
    return proveedorExistente;
  }

  const camposProveedor = await arrayToObjetoFromTablaOffline('proveedores');
  camposProveedor.nombre = nombreProveedor;
  camposProveedor.rnc = obtenerRncProveedorRecibirEquipo();
  camposProveedor.telefono = datoscamposRecibirequipo.value.telefono || '';
  camposProveedor.email = proveedorRecibirSeleccionado.value?.email || '';
  camposProveedor.encargado = proveedorRecibirSeleccionado.value?.encargado || datoscamposRecibirequipo.value.vendedor || '';
  camposProveedor.cuenta_bancaria = proveedorRecibirSeleccionado.value?.cuenta_bancaria || '';
  camposProveedor.direccion = datoscamposRecibirequipo.value.direccion || proveedorRecibirSeleccionado.value?.direccion || '';
  camposProveedor.usuario = usuarioLocal.value.usuario || datosEmpresa.usuario.nombre || '';
  if (camposProveedor.hasOwnProperty('almacen')) {
    camposProveedor.almacen = datosEmpresa.empresa.nombre;
  }
  if (camposProveedor.hasOwnProperty('identificadordb')) {
    camposProveedor.identificadordb = proveedorRecibirSeleccionado.value?.identificadordb || '';
  }

  if (camposProveedor.hasOwnProperty('created_at')) {
    camposProveedor.created_at = nfecha('timestamp');
    camposProveedor.updated_at = nfecha('timestamp');
  }

  const envioProveedor = await peticionesFetchOffline('insertData', 'proveedores', JSON.stringify(camposProveedor));
  if (envioProveedor && envioProveedor[0] === 'ok') {
    await fetchProveedoresRecibirEquipo();
    proveedorRecibirSeleccionado.value = proveedoresRecibirData.value.find(
      (prov) => String(prov?.nombre || '').toUpperCase() === nombreProveedor.toUpperCase()
    ) || null;
  }

  return proveedorRecibirSeleccionado.value;
}

const fetchProveedoresRecibirEquipo = async () => {
  try {
    const response = await peticionesFetchOffline('getDataAsArray', 'proveedores');
    const almacenActual = datosEmpresa.empresa.nombre;
    proveedoresRecibirData.value = (response || []).filter((prov) => !prov.almacen || prov.almacen === almacenActual);
  } catch (error) {
    proveedoresRecibirData.value = [];
    toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar los proveedores', life: 3000 });
  }
}

/************************************************************/
const fnRecibirEquipo = async ()=>{
  //router.push('/recibirequipo')
  if (!proveedoresRecibirData.value.length) {
    await fetchProveedoresRecibirEquipo();
  }
  datoscamposRecibirequipo.value = await arrayToObjetoFromTablaOffline('recibirequipo');
  datoscamposRecibirequipo.value.bateria = 100;
  datoscamposRecibirequipo.value.capacidad = '64GB';
  proveedorRecibirSeleccionado.value = null;
  recibirEquipo.value = true
}
/************************************************************/
/************************************************************/
const fnBuscarImei = async () => {
  const imei = datoscamposRecibirequipo.value.imei;

/*  const revisarExistencia = await peticionesFetch(
    `${link.value}${api.value}`,
    `datoscampo/imei/imei/${imei}`,
    {},
    tokenCifrado.value,
    'GET'
  );*/

  const revisarExistencia = await peticionesFetchOffline('getDataByField', 'imei','imei',imei);


  if (revisarExistencia) {
    recibirEquipo.value = false
    const resultado = await Swal.fire({
      title: 'IMEI ya registrado',
      text: 'Este IMEI ya existe. ¿Deseas reintegrarlo y cambiar su estado a DISPONIBLE?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Reintegrar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#28a745',
      cancelButtonColor: '#d33',
    });

    if (resultado.isConfirmed) {

/*  const datosEquipo = await peticionesFetch(
    `${link.value}${api.value}`,
    `datoscampo/productos/id/${revisarExistencia.id_equi}`,
    {},
    tokenCifrado.value,
    'GET'
  );*/
  const datosEquipo = await peticionesFetchOffline('getDataByField', 'productos','id',revisarExistencia.id_equi);



     if(datosEquipo){
      datoscamposRecibirequipo.value.marca = datosEquipo.marca
      datoscamposRecibirequipo.value.modelo = datosEquipo.modelo
      datoscamposRecibirequipo.value.equipo = datosEquipo.nombre
      datoscamposRecibirequipo.value.detalles = revisarExistencia.detalles
      datoscamposRecibirequipo.value.vendedor = revisarExistencia.comprador
      proveedorRecibirSeleccionado.value = null
      datoscamposRecibirequipo.value.bateria = revisarExistencia.bateria || 100
      datoscamposRecibirequipo.value.capacidad = revisarExistencia.capacidad || '64GB'
     }

      existeImei.value = true
      existeImeiProducto.value = revisarExistencia
      recibirEquipo.value = true
      toast.add({ severity: 'success', summary: 'Reintegrado', detail: 'IMEI será reintegrado.', life: 3000 });
      // Aquí haces la lógica para reintegrar el IMEI
/*      revisarExistencia.estado = 'DISPONIBLE'
      const reintegrar = await peticionesFetch(
        `${link.value}${api.value}`,
        `actualizarcampos/imei`,
        revisarExistencia,
        tokenCifrado.value,
        'POST'
      );

      if (reintegrar[0] === 'ok') {
        toast.add({ severity: 'success', summary: 'Reintegrado', detail: 'IMEI reintegrado con éxito.', life: 3000 });
      } else {
        toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo reintegrar el IMEI.', life: 3000 });
      }*/
    }

    return;
  }

  const datos = await buscarDatosIMEI(0, imei, tokenCifrado.value, toast, Swal, false);

  if (datos) {
    datoscamposRecibirequipo.value.equipo = datos.modelName;
    datoscamposRecibirequipo.value.marca = datos.brand;
    datoscamposRecibirequipo.value.modelo = datos.model;
    datoscamposRecibirequipo.value.detalles = `ALMACENAMIENTO: 
BATERIA TESTEADA: si
BATERIA QUE MARCA: original
DETALLES ESTETICOS: Ninguno
DETALLES INTERNOS: Ninguno
BATERIA MARCA: 100%`;
  }
};

/************************************************************/
const fnBuscarCedula = async () => {
  if(!navigator.onLine){
    toast.add({ severity: 'error', summary: 'Error', detail: 'No tenemos internet para realizar esta consulta', life: 3000 });
    return
  }
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
  
        //const response = await window.electron.ipcRenderer.invoke('consultarCedula', cedula);
        //const response = await window.electron.ipcRenderer.invoke('consultarPasaporte', cedula);
        const response = await peticionesFetch(
                window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? '/api2' : 'https://demo.tmposrd.com/api2',
                'buscarcedula',
                { cedula: cedula },
                tokenCifrado.value,
                'POST'
              );

        //console.log("response", response);


        if (!response.error) {
           response.nombrerazon_social = response.datos.name;
           //response.nombrerazon_social = response.nombre + ' '+response.apellido;
           toast.removeAllGroups()
            toast.removeAllGroups();
            toast.add({ severity: 'success', summary: 'Encontrado', detail: 'Datos Encontrados', life: 3000 });
            datoscamposRecibirequipo.value.vendedor = response.nombrerazon_social;
            proveedorRecibirSeleccionado.value = null;
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
/************************************************************/
/************************************************************/
const codigoUnico = ref(generarCodigoUnico())
/************************************************************************/
const agregarImei = async(no_compra = null)=>{
/*    const datosProducto = await peticionesFetch(`${link.value}${api.value}`,`datoscampo/productos/codigo/${codigoUnico.value}`,{},tokenCifrado.value,'GET');*/
    const datosProducto = await peticionesFetchOffline('getDataByField', 'productos','codigo',codigoUnico.value);

    const camposImei = await arrayToObjetoFromTablaOffline('imei');
    const url = link.value+api.value+"/insertar/imei";
    camposImei.imei = datoscamposRecibirequipo.value.imei
    camposImei.equipo = datoscamposRecibirequipo.value.equipo
    camposImei.id_equi = datosProducto.id
    camposImei.detalles = datoscamposRecibirequipo.value.detalles
    camposImei.fecha = datoscamposRecibirequipo.value.fecha
    camposImei.proveedor = obtenerNombreProveedorRecibirEquipo()
    camposImei.estado = 'DISPONIBLE'
    camposImei.costo = datoscamposRecibirequipo.value.preciocompra
    camposImei.precio_compra = datoscamposRecibirequipo.value.preciocompra
    camposImei.precio_venta = datoscamposRecibirequipo.value.precioventa
    camposImei.precio_min = datoscamposRecibirequipo.value.preciomin || datoscamposRecibirequipo.value.precioventa
    camposImei.precio_xmayor = datoscamposRecibirequipo.value.precioxmayor || datoscamposRecibirequipo.value.precioventa
    camposImei.bateria = datoscamposRecibirequipo.value.bateria || 100
    camposImei.capacidad = datoscamposRecibirequipo.value.capacidad || '64GB'
    camposImei.no_compra = no_compra
    console.log('Agregando IMEI nuevo con no_compra:', no_compra);
    console.log('Datos del IMEI a insertar:', camposImei);
/*   const envioDatos = await enviarDatosPorPost(url, camposImei, tokenCifrado.value);*/
   const envioDatos = await peticionesFetchOffline('insertData','imei', JSON.stringify(camposImei));
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
   camposProductos.proveedor = obtenerNombreProveedorRecibirEquipo()
   camposProductos.almacen = datosEmpresa.empresa.nombre
/*   const envioDatos = await enviarDatosPorPost(url, camposProductos, tokenCifrado.value);*/
   const envioDatos = await peticionesFetchOffline('insertData','productos', JSON.stringify(camposProductos));

}
/************************************************************************/
const sincronizarStockProductoRecibido = async (idProducto) => {
  if (!idProducto) return;
  try {
    const resultado = await sincronizarStockProductoPorImeiDisponible(idProducto);
    if (!resultado?.success) {
      console.warn('No se pudo sincronizar stock por IMEI en recibir equipo:', resultado);
    }
  } catch (error) {
    console.error('Error al sincronizar stock por IMEI en recibir equipo:', error);
  }
}
/************************************************************/
const funcionRecibirEquipo = async () => {

 try {

  const url = link.value + api.value + "/insertar/recibirequipo";

  if (datoscamposRecibirequipo.value.hasOwnProperty('created_at')) {
    datoscamposRecibirequipo.value.created_at = nfecha('timestamp');
    datoscamposRecibirequipo.value.updated_at = nfecha('timestamp');
  }

   const nombreEquipo = datoscamposRecibirequipo.value.equipo +'('+ generarCodigoUnico4Digitos()+')'
   datoscamposRecibirequipo.value.equipo = nombreEquipo

  datoscamposRecibirequipo.value.estado = 'DISPONIBLE';
  datoscamposRecibirequipo.value.fecha = nfecha('fecha');
  await registrarProveedorRecibirEquipo();

  // Crear copia sin el campo bateria y capacidad para guardar en recibirequipo
  const datosRecibirEquipo = { ...datoscamposRecibirequipo.value };
  delete datosRecibirEquipo.bateria;
  delete datosRecibirEquipo.capacidad;
  delete datosRecibirEquipo.preciomin;
  delete datosRecibirEquipo.precioxmayor;

/*  const envioDatos = await enviarDatosPorPost(url, datoscamposRecibirequipo.value, tokenCifrado.value);*/
  const envioDatos = await peticionesFetchOffline('insertData','recibirequipo', JSON.stringify(datosRecibirEquipo));

  if (envioDatos[0] == 'ok') {
    recibirEquipo.value = false;

    // Variable para almacenar el no_factura de la compra
    let no_factura_compra = null;

    while (true) {
      const result = await Swal.fire({
        title: "Selecciona una opción",
        text: "Debes elegir entre crear una Nota de Crédito o un Gasto.",
        icon: "warning",
        showDenyButton: true,
        showCancelButton: true,
        confirmButtonText: "Nota de Crédito",
        denyButtonText: "Gasto",
        cancelButtonText: "Cerrar",
        confirmButtonColor: '#10b981',
        denyButtonColor: '#f59e0b',
        cancelButtonColor: '#6b7280',
        allowOutsideClick: false,
        allowEscapeKey: false,
        allowEnterKey: false
      });

      if (result.isDismissed) {
        // Usuario cerró la modal sin seleccionar Nota de Crédito o Gasto
        // Pero de todas formas registramos la compra
        const resultadoCompra = await registrarCompraEquipo();
        console.log('Resultado de registrar compra (cerrado):', resultadoCompra);
        if (resultadoCompra && resultadoCompra.success) {
          no_factura_compra = resultadoCompra.no_factura;
          console.log('No factura compra asignado (cerrado):', no_factura_compra);
        } else {
          console.error('Error al registrar compra o no se retornó success (cerrado)');
        }
        break;
      }

      if (result.isConfirmed) {
        // Crear nota de crédito usando peticiones offline
        const camposNC = await arrayToObjetoFromTablaOffline('notacredito');

        // Obtener el último número de NC
        const todasLasNC = await peticionesFetchOffline('getDataAsArray', 'notacredito');
        const ultimoNumero = todasLasNC.length > 0
          ? Math.max(...todasLasNC.map(nc => parseInt(nc.no_credito) || 0))
          : 0;

        const nuevoNumeroNC = String(ultimoNumero + 1).padStart(7, '0');

        // Configurar la nota de crédito
        camposNC.no_credito = nuevoNumeroNC;
        camposNC.b04 = `B04${String(ultimoNumero + 1).padStart(8, '0')}`;
        camposNC.fecha = nfecha('fecha');
        camposNC.hora = nfecha('hora');
        camposNC.cod_cliente = '';
        camposNC.cliente = obtenerNombreProveedorRecibirEquipo();
        camposNC.concepto = `COMPRA DE EQUIPO (${datoscamposRecibirequipo.value.equipo}, ${datoscamposRecibirequipo.value.imei} a ${obtenerNombreProveedorRecibirEquipo()} con cédula ${obtenerRncProveedorRecibirEquipo()})`;
        camposNC.total = datoscamposRecibirequipo.value.preciocompra;
        camposNC.nota = `Esta NOTA DE CREDITO vence ${agregarDiasalaFechaActual(30)}`;
        camposNC.almacen = datosEmpresa.empresa.nombre;
        camposNC.created_at = nfecha('timestamp');
        camposNC.updated_at = nfecha('timestamp');

        // Guardar la nota de crédito
        const envioDatosNC = await peticionesFetchOffline('insertData', 'notacredito', JSON.stringify(camposNC));

        const notaCredito = {
          success: envioDatosNC[0] === 'ok',
          no_credito: nuevoNumeroNC
        };

        if (envioDatosNC[0] === 'ok') {
          toast.add({
            severity: 'success',
            summary: 'Éxito',
            detail: `Nota de Crédito ${nuevoNumeroNC} creada con éxito`,
            life: 3000
          });
        }

        if (notaCredito.success) {
          console.log('Nota de crédito creada:', notaCredito.no_credito);

          // Recargar las notas de crédito
          await fetchNotaCredito();

          // Espera adicional para asegurar sincronización
          await new Promise(resolve => setTimeout(resolve, 500));

          console.log('Array NC después de fetch:', arrayNC.value);
          console.log('Buscando NC:', notaCredito.no_credito);

          const accionNota = await Swal.fire({
            title: "¿Qué deseas hacer?",
            text: "¿Imprimir la nota de crédito o agregarla a una venta?",
            icon: "info",
            showDenyButton: true,
            showCancelButton: true,
            confirmButtonText: "Imprimir",
            denyButtonText: "Agregar a Venta Actual",
            cancelButtonText: "Cancelar"
          });

          if (accionNota.isConfirmed) {
            // lógica para imprimir la nota de crédito
            const datosEmpresa2 = JSON.stringify(enviarDatosLocalStorage() )
            const impresion = await window.electron.ipcRenderer.invoke('imprimirNC', notaCredito.no_credito,datosEmpresa2);
          } else if (accionNota.isDenied) {
            // Buscar la NC en el array actualizado
            const ncEncontrada = arrayNC.value.find(nc => nc.no_credito === notaCredito.no_credito);

            console.log('NC encontrada:', ncEncontrada);

            if (ncEncontrada) {
              // Agregar directamente usando la NC encontrada
              descuento.value = ncEncontrada.total;
              nota.value = `SE HA AGREGADO UN DESCUENTO DE ${ncEncontrada.total} POR CONCEPTO DE NOTA DE CREDITO (${ncEncontrada.no_credito})\n` + nota.value;
              descuentoEntero.value = ncEncontrada.total;
              fnAplicarDescuento();

              toast.add({
                severity: 'success',
                summary: 'NC Agregada',
                detail: `Nota de crédito ${notaCredito.no_credito} por ${formatCurrency(ncEncontrada.total)} agregada a la venta`,
                life: 4000
              });
            } else {
              // Si no se encuentra, intentar buscar por fecha reciente
              const ncRecientes = arrayNC.value
                .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
                .slice(0, 5);

              console.log('NCs recientes:', ncRecientes);

              toast.add({
                severity: 'error',
                summary: 'Error',
                detail: `No se encontró la NC ${notaCredito.no_credito} en el sistema. Total NCs: ${arrayNC.value.length}`,
                life: 5000
              });
            }
          }
        }

        // Registrar la compra automáticamente y capturar el no_factura
        const resultadoCompra = await registrarCompraEquipo();
        console.log('Resultado de registrar compra:', resultadoCompra);
        if (resultadoCompra && resultadoCompra.success) {
          no_factura_compra = resultadoCompra.no_factura;
          console.log('No factura compra asignado:', no_factura_compra);
        } else {
          console.error('Error al registrar compra o no se retornó success');
        }

        break;

      } else if (result.isDenied) {
        // Usuario seleccionó "Gasto"
        const gasto = await crearGasto(
          link.value + api.value, datoscamposRecibirequipo.value.preciocompra,
          `COMPRA DE EQUIPO (${datoscamposRecibirequipo.value.equipo}, ${datoscamposRecibirequipo.value.imei} a ${obtenerNombreProveedorRecibirEquipo()} con cédula ${obtenerRncProveedorRecibirEquipo()})`,
          toast, tokenCifrado.value
        );

        if (gasto.success) {
          const accionGasto = await Swal.fire({
            title: "¿Qué deseas hacer?",
            text: "¿Imprimir el gasto o cancelar?",
            icon: "info",
            showCancelButton: true,
            confirmButtonText: "Imprimir",
            cancelButtonText: "Cancelar"
          });

          if (accionGasto.isConfirmed) {
            const datosEmpresa2 = JSON.stringify(enviarDatosLocalStorage() )
            const impresion = await window.electron.ipcRenderer.invoke('gasto', JSON.stringify(gasto),datosEmpresa2);
          }
        }

        // Registrar la compra automáticamente y capturar el no_factura
        const resultadoCompra = await registrarCompraEquipo();
        console.log('Resultado de registrar compra:', resultadoCompra);
        if (resultadoCompra && resultadoCompra.success) {
          no_factura_compra = resultadoCompra.no_factura;
          console.log('No factura compra asignado:', no_factura_compra);
        } else {
          console.error('Error al registrar compra o no se retornó success');
        }

        break;
      }
    }

    codigoUnico.value = generarCodigoUnico();
    if(existeImei.value){

      const datosProd = existeImeiProducto.value

      // Aquí haces la lógica para reintegrar el IMEI
      datosProd.estado = 'DISPONIBLE'
      datosProd.equipo = nombreEquipo
      datosProd.costo = datoscamposRecibirequipo.value.preciocompra
      datosProd.proveedor = obtenerNombreProveedorRecibirEquipo()
      datosProd.almacen = datosEmpresa.empresa.nombre
      datosProd.precio_compra = datoscamposRecibirequipo.value.preciocompra
      datosProd.precio_venta = datoscamposRecibirequipo.value.precioventa
      datosProd.precio_min = datoscamposRecibirequipo.value.preciomin || datoscamposRecibirequipo.value.precioventa
      datosProd.precio_xmayor = datoscamposRecibirequipo.value.precioxmayor || datoscamposRecibirequipo.value.precioventa
      datosProd.bateria = datoscamposRecibirequipo.value.bateria || 100
      datosProd.no_compra = no_factura_compra
      console.log('Reintegrando IMEI con no_compra:', no_factura_compra);
/*      const reintegrar = await peticionesFetch(
        `${link.value}${api.value}`,
        `actualizarcampos/imei`,
        datosProd,
        tokenCifrado.value,
        'POST'
      );*/
      const reintegrar = await peticionesFetchOffline('updateData','imei', JSON.stringify(datosProd));

/*      const datosProducto = await peticionesFetch(
        `${link.value}${api.value}`,
        `datoscampo/productos/id/${datosProd.id_equi}`,
        {},
        tokenCifrado.value,
        'GET'
      );*/
      const datosProducto = await peticionesFetchOffline('getDataByField', 'productos','id',datosProd.id_equi);

      if(datosProducto){
        datosProducto.stock = '1'
        datosProducto.nombre = nombreEquipo
        datosProducto.precio_compra = datoscamposRecibirequipo.value.preciocompra
        datosProducto.precio_venta = datoscamposRecibirequipo.value.precioventa
        datosProducto.precio_min = datoscamposRecibirequipo.value.precioventa
        datosProducto.precio_xmayor = datoscamposRecibirequipo.value.precioventa
        datosProducto.oferta = datoscamposRecibirequipo.value.precioventa
        datosProducto.impuestos = '0.00'
        datosProducto.categoria = 'CELULARES'
        datosProducto.proveedor = obtenerNombreProveedorRecibirEquipo()
        datosProducto.almacen = datosEmpresa.empresa.nombre
        datosProducto.otro = JSON.stringify([{imei:datoscamposRecibirequipo.value.imei,fecha:nfecha('fecha')}])
/*        const actualizarProd = await peticionesFetch(
        `${link.value}${api.value}`,
        `actualizarcampos/productos`,
        datosProducto,
        tokenCifrado.value,
        'POST'
      );*/
        const actualizarProd = await peticionesFetchOffline('updateData','productos', JSON.stringify(datosProducto));
      }
      await sincronizarStockProductoRecibido(datosProd.id_equi);


    }else{

      try {
        // Verificar si se seleccionó un producto existente
        if (productoSeleccionadoExistente.value) {
          // Agregar IMEI al producto existente
          const camposImei = await arrayToObjetoFromTablaOffline('imei');
          camposImei.imei = datoscamposRecibirequipo.value.imei;
          camposImei.equipo = productoSeleccionadoExistente.value.nombre;
          camposImei.id_equi = productoSeleccionadoExistente.value.id;
          camposImei.detalles = datoscamposRecibirequipo.value.detalles;
          camposImei.fecha = datoscamposRecibirequipo.value.fecha;
          camposImei.proveedor = obtenerNombreProveedorRecibirEquipo();
          camposImei.estado = 'DISPONIBLE';
          camposImei.almacen = datosEmpresa.empresa.nombre
          camposImei.costo = datoscamposRecibirequipo.value.preciocompra;
          camposImei.precio_compra = datoscamposRecibirequipo.value.preciocompra;
          camposImei.precio_venta = datoscamposRecibirequipo.value.precioventa;
          camposImei.precio_min = datoscamposRecibirequipo.value.preciomin || datoscamposRecibirequipo.value.precioventa;
          camposImei.precio_xmayor = datoscamposRecibirequipo.value.precioxmayor || datoscamposRecibirequipo.value.precioventa;
          camposImei.bateria = datoscamposRecibirequipo.value.bateria || 100;
          camposImei.capacidad = datoscamposRecibirequipo.value.capacidad || '64GB';
          camposImei.no_compra = no_factura_compra;
          console.log('Agregando IMEI a producto existente con no_compra:', no_factura_compra);

          const envioDatosImei = await peticionesFetchOffline('insertData', 'imei', JSON.stringify(camposImei));

          if (envioDatosImei[0] === 'ok') {
            // Incrementar el stock del producto existente
            productoSeleccionadoExistente.value.stock = Number(productoSeleccionadoExistente.value.stock) + 1;
            productoSeleccionadoExistente.value.updated_at = nfecha('timestamp');
            delete productoSeleccionadoExistente.value.otro;

            const actualizarProducto = await peticionesFetchOffline('updateData', 'productos', JSON.stringify(productoSeleccionadoExistente.value));
            await sincronizarStockProductoRecibido(productoSeleccionadoExistente.value.id);

            if (actualizarProducto[0] === 'ok') {
              toast.add({
                severity: 'success',
                summary: 'Producto Actualizado',
                detail: `IMEI agregado al producto ${productoSeleccionadoExistente.value.nombre}. Stock: ${productoSeleccionadoExistente.value.stock}`,
                life: 4000
              });
            }
          }
        } else {
          // Crear nuevo producto si no se seleccionó uno existente
          await agregarProducto();
          await agregarImei(no_factura_compra);
          const productoCreado = await peticionesFetchOffline('getDataByField', 'productos','codigo',codigoUnico.value);
          await sincronizarStockProductoRecibido(productoCreado?.id);
        }
      } catch (e) {
        console.error('Error al agregar producto o IMEI:', e);
      }

    }

     toast.removeAllGroups();
    toast.add({ severity: 'success', summary: 'Éxito', detail: 'Datos Agregados', life: 3000 });
  } else {
    toast.add({ severity: 'error', summary: 'Error', detail: 'Fallo al Agregar los datos.', life: 3000 });
  }

  existeImei.value = false

  } catch (error) {
    console.error('Error general en funcionRecibirEquipo:', error);
    toast.add({ severity: 'error', summary: 'Error', detail: 'Ocurrió un error inesperado', life: 3000 });
  }

}

/************************************************************/
// Funciones para seleccionar producto existente
/************************************************************/
const cargarProductosCelulares = async () => {
  try {
    const response = await peticionesFetchOffline('getDataAsArray', 'productos');
    productosCelulares.value = response.filter(prod => prod.categoria === 'CELULARES');
    productosFiltrados.value = productosCelulares.value;
  } catch (error) {
    console.error('Error al cargar productos CELULARES:', error);
    toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar los productos', life: 3000 });
  }
};

const filtrarProductos = () => {
  const search = searchProducto.value.toLowerCase();
  if (!search) {
    productosFiltrados.value = productosCelulares.value;
  } else {
    productosFiltrados.value = productosCelulares.value.filter(prod =>
      prod.nombre?.toLowerCase().includes(search) ||
      prod.marca?.toLowerCase().includes(search) ||
      prod.modelo?.toLowerCase().includes(search)
    );
  }
};

const seleccionarProducto = (producto) => {
  productoSeleccionadoExistente.value = producto;
  datoscamposRecibirequipo.value.equipo = producto.nombre;
  datoscamposRecibirequipo.value.marca = producto.marca;
  datoscamposRecibirequipo.value.modelo = producto.modelo;
  datoscamposRecibirequipo.value.preciocompra = Number(producto.precio_compra) || 0;
  datoscamposRecibirequipo.value.precioventa = Number(producto.precio_venta) || 0;
  datoscamposRecibirequipo.value.preciomin = Number(producto.precio_min) || Number(producto.precio_venta) || 0;
  datoscamposRecibirequipo.value.precioxmayor = Number(producto.precio_xmayor) || Number(producto.precio_venta) || 0;
  datoscamposRecibirequipo.value.bateria = 100;
  datoscamposRecibirequipo.value.capacidad = '64GB';
  visibleSeleccionarProducto.value = false;
  toast.add({
    severity: 'success',
    summary: 'Producto Seleccionado',
    detail: `${producto.nombre} - Compra: ${formatCurrency(producto.precio_compra)}, Venta: ${formatCurrency(producto.precio_venta)}`,
    life: 4000
  });
};

const onProductoSelect = (event) => {
  seleccionarProducto(event.data);
};

const formatCurrency = (value) => {
  return new Intl.NumberFormat('es-DO', { style: 'currency', currency: 'DOP' }).format(value || 0);
};

/************************************************************/
// Registrar compra del equipo recibido
/************************************************************/
const registrarCompraEquipo = async () => {
  try {
    // Obtener estructura de campos de compras
    const camposCompra = await arrayToObjetoFromTablaOffline('compras');

    // Generar número de factura único
    const nuevoNumeroFactura = generarCodigoUnico();

    // Crear el array de productos comprados
    const productosCompra = [{
      codigo: productoSeleccionadoExistente.value ? productoSeleccionadoExistente.value.codigo : codigoUnico.value,
      nombre: datoscamposRecibirequipo.value.equipo,
      marca: datoscamposRecibirequipo.value.marca,
      cantidad: 1,
      stock: 1,
      categoria: "CELULARES",
      precio: datoscamposRecibirequipo.value.preciocompra,
      precio_compra: datoscamposRecibirequipo.value.preciocompra,
      precio_venta: datoscamposRecibirequipo.value.precioventa,
      precio_min: datoscamposRecibirequipo.value.preciomin || datoscamposRecibirequipo.value.precioventa,
      precio_xmayor: datoscamposRecibirequipo.value.precioxmayor || datoscamposRecibirequipo.value.precioventa,
      subtotal: datoscamposRecibirequipo.value.preciocompra,
      imei: datoscamposRecibirequipo.value.imei
    }];

    // Configurar la compra
    camposCompra.proveedor = obtenerNombreProveedorRecibirEquipo();
    camposCompra.rnc_proveedor = obtenerRncProveedorRecibirEquipo();
    camposCompra.fecha = nfecha('fecha');
    camposCompra.no_factura = nuevoNumeroFactura;
    camposCompra.ncf_proveedor = '';
    camposCompra.productos = JSON.stringify(productosCompra);
    camposCompra.estado = 'PAGADO';
    camposCompra.subtotal = datoscamposRecibirequipo.value.preciocompra;
    camposCompra.descuento = 0;
    camposCompra.impuesto = 0;
    camposCompra.total = datoscamposRecibirequipo.value.preciocompra;
    camposCompra.abono = datoscamposRecibirequipo.value.preciocompra;
    camposCompra.saldo = 0;
    camposCompra.nota = `Compra de equipo: ${datoscamposRecibirequipo.value.equipo} (IMEI: ${datoscamposRecibirequipo.value.imei})`;
    camposCompra.almacen = datosEmpresa.empresa.nombre;
    camposCompra.usuario = usuarioLocal.value.usuario || datosEmpresa.usuario.nombre;
    camposCompra.created_at = nfecha('timestamp');
    camposCompra.updated_at = nfecha('timestamp');

    // Guardar la compra
    const envioDatosCompra = await peticionesFetchOffline('insertData', 'compras', JSON.stringify(camposCompra));

    if (envioDatosCompra[0] === 'ok') {
      console.log('Compra registrada exitosamente:', nuevoNumeroFactura);

      // Actualizar los precios del producto
      try {
        const codigoProducto = productoSeleccionadoExistente.value
          ? productoSeleccionadoExistente.value.codigo
          : codigoUnico.value;

        const producto = await peticionesFetchOffline('getDataByField', 'productos', 'codigo', codigoProducto);

        if (producto) {
          producto.precio_compra = datoscamposRecibirequipo.value.preciocompra;
          producto.precio_venta = datoscamposRecibirequipo.value.precioventa;
          producto.precio_min = datoscamposRecibirequipo.value.preciomin || datoscamposRecibirequipo.value.precioventa;
          producto.precio_xmayor = datoscamposRecibirequipo.value.precioxmayor || datoscamposRecibirequipo.value.precioventa;
          producto.stock = 1;
          //producto.cantidad = 1;
          producto.categoria = 'CELULARES';
          producto.updated_at = nfecha('timestamp');

          await peticionesFetchOffline('updateData', 'productos', JSON.stringify(producto));
          console.log('Precios y stock del producto actualizados:', producto.codigo);
        }
      } catch (errorProducto) {
        console.error('Error al actualizar precios del producto:', errorProducto);
      }

      toast.add({
        severity: 'success',
        summary: 'Compra Registrada',
        detail: `Compra #${nuevoNumeroFactura} registrada con estado PAGADO`,
        life: 3000
      });
      return { success: true, no_factura: nuevoNumeroFactura };
    } else {
      console.error('Error al registrar la compra');
      toast.add({
        severity: 'error',
        summary: 'Error',
        detail: 'No se pudo registrar la compra',
        life: 3000
      });
      return { success: false };
    }
  } catch (error) {
    console.error('Error en registrarCompraEquipo:', error);
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Error al registrar la compra: ' + error.message,
      life: 3000
    });
    return { success: false };
  }
};

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
    camposClientes.telefono = datosFactura.telefono_cliente
    camposClientes.nombre = datosFactura.nombre_cliente
    camposClientes.cedula = datosFactura.cod_cliente
    camposClientes.whatsapp = datosFactura.telefono_cliente
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
      camposCUENTASCOBRAR.telefono_cliente = datosCliente.telefono;
      camposCUENTASCOBRAR.whatsapp_cliente = datosCliente.whatsapp;
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
  //const datosProd = productosArray.value.find(prod => prod.codigo === codigo);
  const datosProd = await peticionesFetchOffline('getDataByField', 'productos','codigo',codigo);
  console.log("datosProd", datosProd);
  const productoEnVenta = productosVenta.value.find(prod => prod.codigo === codigo);

  // Buscar el producto en todos los almacenes por nombre
  const todosLosProductos = await peticionesFetchOffline('getDataAsArray', 'productos');
  const productosEnOtrosAlmacenes = todosLosProductos.filter(prod =>
    prod.nombre === datosProd.nombre && prod.almacen !== datosEmpresa.empresa.nombre
  );

  // Construir HTML de disponibilidad en otros almacenes
  let disponibilidadHTML = '';
  if (productosEnOtrosAlmacenes.length > 0) {
    disponibilidadHTML = '<div style="margin-top: 15px; padding-top: 15px; border-top: 2px solid #e0e0e0;"><p style="font-weight: bold; color: #2196F3; margin-bottom: 10px;">📦 Disponibilidad en otros almacenes:</p>';
    productosEnOtrosAlmacenes.forEach(prod => {
      const stockColor = prod.stock > 0 ? '#4CAF50' : '#f44336';
      const stockIcon = prod.stock > 0 ? '✓' : '✗';
      disponibilidadHTML += `<p style="margin: 5px 0; padding: 5px; background-color: #f5f5f5; border-radius: 4px;">
        <strong style="color: #1976D2;">${prod.almacen}:</strong>
        <span style="color: ${stockColor}; font-weight: bold;">${stockIcon} ${prod.stock} unidades</span>
      </p>`;
    });
    disponibilidadHTML += '</div>';
  }

  if (datosProd) {
      const rutaIMG = `${datosProd.imagen}`
   await imagenesProducto(rutaIMG)

    // Obtener capacidad si es CELULARES y tiene IMEI
    let capacidadHTML = '';
    console.log('🔍 Categoria:', datosProd.categoria);
    console.log('🔍 productoEnVenta:', productoEnVenta);
    console.log('🔍 lista_imei:', productoEnVenta?.lista_imei);

    if (datosProd.categoria === 'CELULARES' && productoEnVenta?.lista_imei) {
      const imeiProducto = productoEnVenta.lista_imei.split(',')[0].trim(); // Tomar el primer IMEI y limpiar espacios
      console.log('🔍 IMEI a buscar:', imeiProducto);
      const datosImei = await peticionesFetchOffline('getDataByField', 'imei', 'imei', imeiProducto);
      console.log('🔍 Datos IMEI encontrados:', datosImei);
      if (datosImei?.capacidad) {
        capacidadHTML = `<p><strong>Capacidad:</strong> <span style="color: #4CAF50; font-weight: bold;">${datosImei.capacidad}</span></p>`;
        console.log('✅ Capacidad HTML creado:', capacidadHTML);
      } else {
        console.log('❌ No se encontró capacidad en el IMEI');
      }
    } else {
      console.log('❌ No cumple condiciones: categoria=' + datosProd.categoria + ', lista_imei=' + productoEnVenta?.lista_imei);
    }

    Swal.fire({
      title: 'Información del Producto',
  html: `
    <div style="display: flex;">
      <div style="text-align: left; flex: 1;">
        <p><strong>Nombre:</strong> ${datosProd.nombre}</p>
        <p><strong>Almacén Actual:</strong> <span style="color: #1976D2; font-weight: bold;">${datosProd.almacen}</span></p>
        <p><strong>Disponibles:</strong> ${datosProd.stock}</p>
        ${capacidadHTML}
        <p><strong>Precio de Venta:</strong> ${datosProd.precio_venta}</p>
        <p><strong>Precio Min:</strong> ${datosProd.precio_min}</p>
        <p><strong>Precio X Mayor:</strong> ${datosProd.precio_xmayor}</p>
        <p><strong>Ubicación:</strong> ${datosProd.ubicacion}</p>
        <p><strong>Cantidad en Venta:</strong> ${productoEnVenta.cantidad}</p>
        ${disponibilidadHTML}
      </div>
      <div style="flex: 1; display: flex; justify-content: center; align-items: center;">
        <img src="${primeraIMG.value}" alt="Imagen del Producto" style="max-width: 100%; max-height: 100%;">
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
    const matchesSearch = searchQuery.value === '' || producto.nombre.toLowerCase().includes(searchQuery.value.toLowerCase());
    return matchesCategory && matchesSearch;
  });
});
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
    return activarPos ? imageUrl : new URL('@/assets/img/producto.png', import.meta.url).href;
  }).value; // Ensure to access the value of computed property
};
/************************************************************/
const fnConvertirEnFactura = async()=>{
  visiblefatcoti.value = false

  // Mostrar modal de selección
  visibleConvertirCotizacion.value = true;
  accionConversionCotizacion.value = null;

  // Esperar a que el usuario seleccione una opción
  await new Promise((resolve) => {
    const checkInterval = setInterval(() => {
      if (accionConversionCotizacion.value !== null) {
        clearInterval(checkInterval);
        resolve();
      }
    }, 100);
  });

  // Si canceló, volver a la modal de facturas
  if (accionConversionCotizacion.value === 'cancelar') {
    visiblefatcoti.value = true;
    return;
  }

  // Usar peticionesFetchOffline para soporte offline
  const datosCotizacion = await peticionesFetchOffline('getDataByField', 'cotizacion', 'no_cotizacion', datosFactCoti.value.numero);

  if (!datosCotizacion) {
    toast.add({ severity: 'error', summary: 'Error', detail: 'Cotización no encontrada', life: 3000 });
    return;
  }

  cotizacionConvertida.value = datosCotizacion.no_cotizacion;
  const productos = JSON.parse(datosCotizacion.productos);

  // Obtener el porcentaje de la institución si existe
  let porcientoInstitucion = 0;
  if (datosCotizacion.entidad_financiera && datosCotizacion.entidad_financiera !== 'Ninguna') {
    const instituc = intitucionesData.value.find(inst => inst.nombre === datosCotizacion.entidad_financiera);
    if (instituc) {
      porcientoInstitucion = Number(instituc.porciento) || 0;
    }
  }

  for(let prod of productos){
      prod.ganancia = calcularGanancias(prod);
      prod.ganancia_pura = calcularGanancias(prod);

      // Si tiene porcentaje de institución, calcular el precio_real_institucion
      if (porcientoInstitucion > 0) {
        // El precio actual ya tiene el porcentaje aplicado, calcular el precio original
        const precioActual = Number(prod.precio_venta || prod.precio_final);
        const precioOriginal = precioActual / (1 + porcientoInstitucion / 100);
        prod.precio_real_institucion = precioOriginal;
        prod.porcentaje_institucion = porcientoInstitucion;
      }
  }

  if (accionConversionCotizacion.value === 'directa') {
    // CONVERTIR TAL CUAL COMO ESTÁ - Preguntar por comprobante primero
    visibleComprobanteConversion.value = true;
    comprobanteSeleccionadoConversion.value = null;

    // Esperar a que el usuario seleccione el comprobante
    await new Promise((resolve) => {
      const checkInterval = setInterval(() => {
        if (comprobanteSeleccionadoConversion.value !== null) {
          clearInterval(checkInterval);
          resolve();
        }
      }, 100);
    });

    // Si canceló la selección de comprobante, volver a la modal de facturas
    if (comprobanteSeleccionadoConversion.value === 'cancelar') {
      visiblefatcoti.value = true;
      return;
    }

    // Crear factura directamente con el comprobante seleccionado
    await fnConvertirCotizacionDirecta(datosCotizacion, productos, comprobanteSeleccionadoConversion.value);
  } else if (accionConversionCotizacion.value === 'modificar') {
    // MODIFICAR ANTES - Cargar en el carrito (comportamiento original)
    const cliente = allClientes.value.find(cliente => cliente.codigo === datosCotizacion.cod_cliente);
    clienteSelected.value = cliente;

    // PRIMERO: Cargar productos y nota
    productosVenta.value = productos;
    nota.value = datosCotizacion.nota;

    // SEGUNDO: Cargar datos de institución ANTES de aplicar porcentaje
    if (datosCotizacion.entidad_financiera && datosCotizacion.entidad_financiera !== 'Ninguna') {
      institucion.value = datosCotizacion.entidad_financiera;
      porcientoInstitucionAplicado.value = porcientoInstitucion;
    }

    // TERCERO: Cargar datos de quién paga y montos
    if (datosCotizacion.quien_paga) {
      quienPagaCotizacion.value = datosCotizacion.quien_paga;
    }
    if (datosCotizacion.total_institucion) {
      total_institucion.value = Number(datosCotizacion.total_institucion || 0);
      montoInstitucionCotizacion.value = Number(datosCotizacion.monto_institucion || datosCotizacion.total_institucion || 0);
    }
    if (datosCotizacion.total_cliente) {
      total_cliente.value = Number(datosCotizacion.total_cliente || 0);
      montoClienteCotizacion.value = Number(datosCotizacion.monto_cliente || datosCotizacion.total_cliente || 0);
    }

    // CUARTO: Calcular totales y cambiar tipo
    calcularTotalFactura();
    fncambioTipoImpuesto();
    tipoFactura.value = 'factura';

    toast.add({ severity: 'success', summary: 'Éxito', detail: 'Cotización cargada. Procede a guardar como Factura.', life: 3000 });
  }

}

/************************************************************/
const fnConvertirCotizacionDirecta = async (datosCotizacion, productos, tipoComprobante) => {
  try {
    loading.value = true;

    // Generar número de factura
    const noFactura = generarCodigoUnico();

    // Obtener cliente
    const cliente = allClientes.value.find(c => c.codigo === datosCotizacion.cod_cliente);
    if (!cliente) {
      toast.add({ severity: 'error', summary: 'Error', detail: 'Cliente no encontrado', life: 3000 });
      loading.value = false;
      return;
    }

    // Resolver comprobante/tipo de factura y preparar actualización fiscal si aplica
    let comprobanteNumero = 'SIN COMPROBANTE';
    const comprobanteTexto = mensajeComprobantes.value[tipoComprobante] || 'SIN COMPROBANTE';
    let confiscalRegistro = null;

    if (tipoComprobante !== 'NORMAL') {
      const prefijo = comprobantes.value[tipoComprobante];
      if (!prefijo || !/^B\d{2}$/.test(prefijo)) {
        toast.add({ severity: 'error', summary: 'Error', detail: 'NCF inválido para este tipo de comprobante', life: 3000 });
        loading.value = false;
        return;
      }

      confiscalRegistro = confiscalData.value.find(
        c => c.prefijo === prefijo && c.almacen === datosEmpresa.empresa.nombre
      );
      if (!confiscalRegistro) {
        confiscalRegistro = await peticionesFetchOffline('getDataByField', 'confiscal', 'prefijo', prefijo);
      }
      if (!confiscalRegistro) {
        toast.add({ severity: 'error', summary: 'Error', detail: `No existe configuración fiscal para ${prefijo}`, life: 3000 });
        loading.value = false;
        return;
      }

      const secuenciaActual = String(confiscalRegistro.secuencia || '').trim();
      const contadorActual = Number(confiscalRegistro.contador || 0);
      let siguienteConsecutivo = contadorActual + 1;

      if (secuenciaActual.startsWith(prefijo)) {
        const parteNumerica = secuenciaActual.slice(prefijo.length).replace(/\D/g, '');
        if (parteNumerica) {
          siguienteConsecutivo = Number(parteNumerica) + 1;
        }
      }

      comprobanteNumero = `${prefijo}${String(siguienteConsecutivo).padStart(8, '0')}`;
    }

    // Preparar datos de la factura basados en la cotización (usando campos correctos de la tabla facturas)
    const datosFactura = {
      no_factura: noFactura,
      tipo_factura: comprobanteTexto,
      comprobante: comprobanteNumero,
      cod_cliente: cliente.codigo,
      nombre_cliente: cliente.nombre,
      telefono_cliente: datosCotizacion.telefono_cliente || cliente.telefono || '',
      productos: JSON.stringify(productos),
      vendedor: datosCotizacion.vendedor || datosEmpresa.usuario.nombre,
      metodo_pago: datosCotizacion.metodo_pago || 'EFECTIVO',
      tarjeta: '0.00',
      transferencia: '0.00',
      efectivo: String(datosCotizacion.total || 0),
      cheque: '0.00',
      token: generarCodigoUnico(),
      cajero: datosEmpresa.usuario.nombre,
      canal_venta: datosEmpresa.empresa.nombre,
      fecha_emision: nfecha('fecha'),
      impuesto: datosCotizacion.impuesto || 0,
      descuento: datosCotizacion.descuento || 0,
      subtotal: datosCotizacion.subtotal || 0,
      total: datosCotizacion.total || 0,
      ganancia: productos.reduce((sum, p) => sum + (Number(p.ganancia_pura || 0) * Number(p.cantidad || 1)), 0),
      financiera: datosCotizacion.entidad_financiera || '',
      estado_factura: 'Cobrado',
      fecha_estado: nfecha('fecha'),
      mes: nfecha('mes'),
      year: new Date().getFullYear().toString(),
      hora: nfecha('hora'),
      otro: JSON.stringify([{
        delivery: "No Registrado",
        mesero: "No Registrado",
        mesa: "No Registrado",
        vendedor: datosCotizacion.vendedor || datosEmpresa.usuario.nombre,
        instalador: "No Registrado",
        pagocon: datosCotizacion.total || 0,
        sucambio: 0,
        cajero: datosEmpresa.usuario.nombre,
        noCheque: "",
        bancoCheque: "",
        token: generarCodigoUnico()
      }]),
      nota: datosCotizacion.nota || '',
      usuario: datosEmpresa.usuario.nombre,
      updated_at: nfecha('timestamp'),
      created_at: nfecha('timestamp'),
      identificadordb: '',
      almacen: datosCotizacion.almacen || datosEmpresa.empresa.nombre,
      total_institucion: datosCotizacion.total_institucion || 0,
      total_cliente: datosCotizacion.total_cliente || 0
    };

    // Verificar que la factura no exista
    const verificaFactura = await peticionesFetchOffline('getDataByField', 'facturas', 'no_factura', noFactura);
    if (verificaFactura?.no_factura) {
      toast.add({ severity: 'error', summary: 'Error', detail: 'Error generando número de factura', life: 3000 });
      loading.value = false;
      return;
    }

    // Insertar factura
    const insertFactura = await peticionesFetchOffline('insertData', 'facturas', JSON.stringify(datosFactura));

    if (insertFactura && insertFactura[0] === 'ok') {
      // Actualizar consecutivo fiscal (contador y secuencia) cuando aplique comprobante
      if (confiscalRegistro) {
        confiscalRegistro.contador = Number(confiscalRegistro.contador || 0) + 1;
        confiscalRegistro.secuencia = comprobanteNumero;
        if (confiscalRegistro.hasOwnProperty('created_at')) {
          confiscalRegistro.updated_at = nfecha('timestamp');
        }

        const updateConfiscal = await peticionesFetchOffline('updateData', 'confiscal', JSON.stringify(confiscalRegistro));
        if (!updateConfiscal || updateConfiscal[0] !== 'ok') {
          toast.add({ severity: 'warn', summary: 'Atención', detail: 'Factura creada, pero no se pudo actualizar la secuencia fiscal', life: 3500 });
        }
      }

      // Descontar stock
      await restarStock(`${link.value}${api.value}/restarStockN`, productos, 'POST', tokenCifrado.value);

      // Eliminar la cotización
      const deleteCotizacion = await peticionesFetchOffline('deleteEntry', 'cotizacion', datosCotizacion.id);

      if (deleteCotizacion[0] === 'ok') {
        toast.removeAllGroups();
        toast.add({ severity: 'success', summary: 'Éxito', detail: `Factura #${noFactura} creada exitosamente`, life: 4000 });

        // Cerrar la modal de facturas y cotizaciones
        visiblefatcoti.value = false;

        // Preparar datos para impresión
        const datosEmpresaLocal = enviarDatosLocalStorage();
        let creditoData = null;

        // Si es crédito, obtener datos de cuentas por cobrar
        if (String(datosFactura?.metodo_pago || '').toUpperCase() === 'CREDITO') {
          const datosCxC = await peticionesFetchOffline('getDataByField', 'cuentas_cobrar', 'no_factura', noFactura);
          if (datosCxC && datosCxC.length > 0) creditoData = datosCxC[0];
        }

        // Llamar a la función de impresión del componente FacturaPdfPrint
        // Este componente maneja internamente la selección de formato (Ticket 80mm o Carta A4)
        await facturaPdfPrintRef.value.printFactura({
          factura: datosFactura,
          cliente: cliente,
          datosEmpresa: datosEmpresaLocal,
          creditoData
        });
      } else {
        toast.add({ severity: 'warn', summary: 'Atención', detail: 'Factura creada pero no se pudo eliminar la cotización', life: 3000 });
      }
    } else {
      toast.add({ severity: 'error', summary: 'Error', detail: 'Error al crear la Factura', life: 3000 });
    }

    loading.value = false;
  } catch (error) {
    console.error('Error al convertir cotización:', error);
    toast.add({ severity: 'error', summary: 'Error', detail: 'Error inesperado al convertir cotización', life: 3000 });
    loading.value = false;
  }
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
      telefono_cliente: datosApartado.telefono_cliente,
      whatsapp_cliente: datosApartado.whatsapp_cliente,
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
      telefono_cliente: datosApartado.telefono_cliente,
      whatsapp_cliente: datosApartado.whatsapp_cliente,
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
      telefono: datosCliente?.telefono || '',
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
    const responseFacturas = await peticionesFetchOffline('getLastXRows', endpoint,1000);

    return (responseFacturas || []).filter(factura => factura.almacen === datosEmpresa.empresa.nombre);
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
  const instituc = intitucionesData.value.find(inst => inst.nombre === institucion.value)
  if (instituc) {
    const porcientoNuevo = Number(instituc.porciento) || 0;
    const porcientoAnterior = porcientoInstitucionAplicado.value;

    // Actualizar fecha de vencimiento según días_vencimiento de la institución
    const diasVencimiento = Number(instituc.dias_vencimiento) || 30;
    fechaCREDITO.value = agregarDiasalaFechaActual(diasVencimiento);

    if (porcientoNuevo !== porcientoAnterior) {
      productosVenta.value.forEach(producto => {
        if (producto.nombre !== 'DESCUENTO' && producto.nombre !== 'DESCUENTO APLICADO') {
          // Guardar precio_real si no existe (precio original sin porcentajes)
          if (!producto.precio_real_institucion) {
            producto.precio_real_institucion = Number(producto.precio_venta);
          }

          // Usar precio_real_institucion como base
          let precioBase = Number(producto.precio_real_institucion);
          let precioVenta = precioBase;
          let precioFinal = precioBase;

          // Aplicar nuevo porcentaje de institución
          if (porcientoNuevo > 0) {
            precioVenta = precioBase * (1 + porcientoNuevo / 100);
            precioFinal = precioBase * (1 + porcientoNuevo / 100);
          }

          producto.precio_venta = precioVenta.toFixed(2);
          producto.precio_final = precioFinal.toFixed(2);
          producto.porcentaje_institucion = porcientoNuevo;
        }
      });

      porcientoInstitucionAplicado.value = porcientoNuevo;
      calcularTotalFactura();
    }

    fnCalcularCREDITO()
    fnRecalcularCreditoAmbas()
  } else {
    toast.add({
      severity: 'warn',
      summary: 'Upps',
      detail: 'No se encuentra la Intitucion',
      life: 3000
    })
  }
}
/************************************************************/
/************************************************/
const fnImpresoraGrande = async()=>{
 visiblefatcoti.value = false
 visiblePrint.value = false

    const factura  = datosFactCoti.value.numero;

    if (factura == '') {
      toast.add({ severity: 'error', summary: 'Error', detail: 'Debe seleccionar un documento para imprimir', life: 3000 });
      return
    }

if (datosFactCoti.value.tipo == 'Factura') {
    const datosFactura = allFacturasFull.value.find(fact=>fact.no_factura === datosFactCoti.value.numero)
    if (!datosFactura) {
      toast.add({ severity: 'error', summary: 'Error', detail: 'No se encontró la factura', life: 3000 });
      return
    }
    const datosCliente = allClientes.value.find(cl=>cl.codigo === datosFactura.cod_cliente)
    const datosEmpresaLocal = enviarDatosLocalStorage()
    let creditoData = null
    if (String(datosFactura?.metodo_pago || '').toUpperCase() === 'CREDITO') {
      const datosCxC = await peticionesFetchOffline('getDataByField', 'cuentas_cobrar', 'no_factura', datosFactura.no_factura)
      if (datosCxC && datosCxC.length > 0) creditoData = datosCxC[0]
    }
    await facturaPdfPrintRef.value.printFactura({ factura: datosFactura, cliente: datosCliente, datosEmpresa: datosEmpresaLocal, creditoData })

}else if(datosFactCoti.value.tipo == 'Pre-Factura'){
    if (window.electron) {
        const datosPreFactura = preFacturasArray.value.find(pf => pf.no_factura === datosFactCoti.value.numero);
        const datosCliente = allClientes.value.find(cl => cl.codigo === datosPreFactura?.cod_cliente);
        const datosEmpresa1 = JSON.stringify(enviarDatosLocalStorage());
        await window.electron.ipcRenderer.invoke('prefacturaPDF', JSON.stringify(datosPreFactura), JSON.stringify(datosCliente), datosEmpresa1);
    } else {
        router.push({ path: `/factura/${datosFactCoti.value.numero}/pre_facturas` });
    }
}else if(datosFactCoti.value.tipo == 'Orden'){
    if (window.electron) {
        const datosOrden = ordenesArray.value.find(ord => ord.no_orden === datosFactCoti.value.numero);
        const datosCliente = allClientes.value.find(cl => cl.codigo === datosOrden?.cod_cliente);
        const datosEmpresa1 = JSON.stringify(enviarDatosLocalStorage());
        await window.electron.ipcRenderer.invoke('ordenPDF', JSON.stringify(datosOrden), JSON.stringify(datosCliente), datosEmpresa1);
    } else {
        router.push({ path: `/factura/${datosFactCoti.value.numero}/ordenes` });
    }
}else{
    // Cotizacion
    const datosCotizacion = await peticionesFetchOffline('getDataByField','cotizacion','no_cotizacion',datosFactCoti.value.numero)
    if (!datosCotizacion) {
      toast.add({ severity: 'error', summary: 'Error', detail: 'No se encontró la cotización', life: 3000 });
      return
    }
    const datosCliente = allClientes.value.find(cl => cl.codigo === datosCotizacion?.cod_cliente);
    const datosEmpresaLocal = enviarDatosLocalStorage()
    await cotizacionPdfPrintRef.value.printCotizacion({ cotizacion: datosCotizacion, cliente: datosCliente, datosEmpresa: datosEmpresaLocal })
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
      toast.add({ severity: 'error', summary: 'Error', detail: 'No se encontró la factura', life: 3000 });
      return
    }
    const datosCliente = allClientes.value.find(cl=>cl.codigo === datosFactura.cod_cliente)
    const datosEmpresaLocal = enviarDatosLocalStorage()
    await ticketFacturaPrintRef.value.printTicket({ factura: datosFactura, cliente: datosCliente, datosEmpresa: datosEmpresaLocal })

}else if(datosFactCoti.value.tipo == 'Pre-Factura'){
    if(window.electron){
        const datosEmpresaA = JSON.stringify(enviarDatosLocalStorage());
        const datosPreFactura = preFacturasArray.value.find(pf => pf.no_factura === factura);
        window.electron.ipcRenderer.invoke('ticketprefactura', JSON.stringify(datosPreFactura), datosEmpresaA);
    }else{
        toast.add({ severity: 'error', summary: 'Upps', detail: 'Esta funcion es solo para la aplicacion Desktop', life: 3000 });
    }
}else if(datosFactCoti.value.tipo == 'Orden'){
    if(window.electron){
        const datosEmpresaA = JSON.stringify(enviarDatosLocalStorage());
        const datosOrden = ordenesArray.value.find(ord => ord.no_orden === factura);
        window.electron.ipcRenderer.invoke('ticketOrden', JSON.stringify(datosOrden), datosEmpresaA);
    }else{
        toast.add({ severity: 'error', summary: 'Upps', detail: 'Esta funcion es solo para la aplicacion Desktop', life: 3000 });
    }
}else if(datosFactCoti.value.tipo == 'Apartado'){
    if(window.electron){
        const datosEmpresaA = JSON.stringify(enviarDatosLocalStorage());
        const datosApartado = apartadosArray.value.find(ap => ap.no_factura === factura);

        const datosApartadoLimpio = {
          no_emision: datosApartado.no_emision,
          no_factura: datosApartado.no_factura,
          cod_cliente: datosApartado.cod_cliente,
          nombre_cliente: datosApartado.nombre_cliente,
          cedula_cliente: datosApartado.cedula_cliente,
          telefono_cliente: datosApartado.telefono_cliente,
          whatsapp_cliente: datosApartado.whatsapp_cliente,
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
        toast.add({ severity: 'error', summary: 'Upps', detail: 'Esta funcion es solo para la aplicacion Desktop', life: 3000 });
    }
}else{
    // Cotizacion - usar TicketFacturaPrint con datos de cotizacion
    const datosCotizacion = await peticionesFetchOffline('getDataByField','cotizacion','no_cotizacion',factura)
    if (!datosCotizacion) {
      toast.add({ severity: 'error', summary: 'Error', detail: 'No se encontró la cotización', life: 3000 });
      return
    }
    const datosCliente = allClientes.value.find(cl => cl.codigo === datosCotizacion?.cod_cliente);
    const datosEmpresaLocal = enviarDatosLocalStorage()
    await ticketFacturaPrintRef.value.printTicket({ factura: datosCotizacion, cliente: datosCliente, datosEmpresa: datosEmpresaLocal })

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
    watch(() => saldoCREDITO.value, fnRecalcularCreditoAmbas);
    watch(() => totalCreditoConInteres.value, fnRecalcularCreditoAmbas);
    watch(() => quienCredito.value, fnRecalcularCreditoAmbas);
    watch(() => montoInstitucionCREDITO.value, fnRecalcularCreditoAmbas);
/************************************************************************/
    // Watchers para cotización
    watch(() => total.value, () => {
      if (documentoActual.value === 'COTIZACIÓN' && visibleQuienPagaCotizacion.value) {
        fnRecalcularCotizacionAmbas();
      }
    });
    watch(() => quienPagaCotizacion.value, fnRecalcularCotizacionAmbas);
    watch(() => montoInstitucionCotizacion.value, fnRecalcularCotizacionAmbas);
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


</script>

<style scoped>

/* ===================================
   MODAL DISTRIBUIR DINERO - MODERN UI
   =================================== */

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

/* Efectivo Card Specific */
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

/* Tarjeta Card Specific */
.tarjeta-card:hover {
  border-color: #3b82f6;
}

.tarjeta-card:hover .payment-icon-wrapper {
  background: #dbeafe !important;
}

/* Transferencia Card Specific */
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

/* Responsive adjustments */
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
  background-color: #007bff;
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
  scrollbar-color: #42b883 #f1f1f1; /* Verde de Vue.js */
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
  background: #42b883; /* Verde de Vue.js */
  border-radius: 10px;
}

.category-scroll-container::-webkit-scrollbar-thumb:hover {
  background: #359a6d;
}

/* Estilos para el contenedor de productos */
.product-scroll-container {
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
  border: 2px solid #42b883; /* Verde de Vue.js */
  border-radius: 4px;
}


.tab {
  background-color: #007bff;
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

/* ===== IMEI LIST DIALOG STYLES ===== */
.imei-list-dialog :deep(.p-dialog-header) {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 1.5rem;
  border-radius: 12px 12px 0 0;
}

.imei-list-dialog :deep(.p-dialog-content) {
  padding: 1.5rem;
  background: #f9fafb;
}

.imei-dialog-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}

.imei-list-content {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.imei-datatable-modern {
  border-radius: 12px;
  overflow: hidden;
}

.imei-datatable-modern :deep(.p-datatable-header) {
  background: #f3f4f6;
  border-bottom: 2px solid #e5e7eb;
  padding: 1rem;
}

.imei-datatable-modern :deep(.p-datatable-thead > tr > th) {
  background: linear-gradient(to bottom, #f9fafb, #f3f4f6);
  color: #374151;
  font-weight: 600;
  font-size: 0.875rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 1rem;
  border-bottom: 2px solid #e5e7eb;
}

.imei-datatable-modern :deep(.p-datatable-tbody > tr) {
  transition: all 0.3s ease;
}

.imei-datatable-modern :deep(.p-datatable-tbody > tr:hover) {
  background: #f0f9ff !important;
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.imei-datatable-modern :deep(.p-datatable-tbody > tr > td) {
  padding: 1rem;
  vertical-align: middle;
}

.imei-number-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 8px;
  font-weight: 600;
  font-size: 0.875rem;
  box-shadow: 0 2px 4px rgba(102, 126, 234, 0.3);
}

.imei-cell-modern {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.imei-cell-modern i {
  font-size: 1.25rem;
}

.imei-code-modern {
  font-family: 'Courier New', monospace;
  font-size: 0.95rem;
  font-weight: 600;
  background: linear-gradient(135deg, #e0e7ff 0%, #f0f9ff 100%);
  padding: 0.5rem 1rem;
  border-radius: 8px;
  color: #1e40af;
  border: 1px solid #bfdbfe;
}

.no-imeis-found {
  text-align: center;
  padding: 3rem 1rem;
}

.no-imeis-found i {
  display: block;
  margin-bottom: 1rem;
}

.imei-list-dialog :deep(.p-dialog-footer) {
  background: white;
  border-top: 1px solid #e5e7eb;
  padding: 1rem 1.5rem;
}

/* Responsive */
@media (max-width: 768px) {
  .imei-list-dialog :deep(.p-dialog) {
    width: 95vw !important;
  }

  .imei-datatable-modern :deep(.p-datatable-thead > tr > th),
  .imei-datatable-modern :deep(.p-datatable-tbody > tr > td) {
    padding: 0.75rem 0.5rem;
    font-size: 0.875rem;
  }

  .imei-code-modern {
    font-size: 0.8rem;
    padding: 0.4rem 0.6rem;
  }
}

</style>









