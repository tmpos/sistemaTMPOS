<template>
  <div class="etiquetas-container">
    <!-- Header -->
    <div class="header-section">
      <h1 class="titulo-principal">
        <i class="pi pi-print"></i>
        Sistema de Impresión de Etiquetas
      </h1>
      <p class="subtitulo">Genera e imprime etiquetas profesionales con control total de diseño</p>
    </div>

    <div class="main-content">
      <!-- Panel de Configuración -->
      <Card class="config-panel">
        <template #title>
          <i class="pi pi-cog"></i> Configuración de Etiqueta
        </template>
        <template #content>
          <!-- Buscador de Productos -->
          <div class="field">
            <label for="buscador">
              <i class="pi pi-search mr-2"></i>
              Buscar Producto
            </label>
            <Awesomplete
              v-model="busqueda"
              :list="listaBuscador"
              @selectComplete="handleSelectComplete"
              @change="handleBusquedaChange"
              placeholder="Ingresa código, IMEI o nombre del producto..."
              class="w-full"
            />
          </div>

          <!-- Selector de Impresora -->
          <div class="field">
            <label for="impresora">
              <i class="pi pi-print mr-2"></i>
              Impresora
            </label>
            <div class="p-inputgroup">
              <InputText
                id="impresora"
                v-model="configuracion.impresora"
                placeholder="Selecciona una impresora"
                readonly
                class="input-impresora"
              />
              <Button
                icon="pi pi-search"
                @click="buscarImpresoras"
                label="Buscar"
                severity="info"
              />
            </div>
            <small class="text-muted" v-if="configuracion.impresora">
              Impresora seleccionada: {{ configuracion.impresora }}
            </small>
          </div>

          <!-- Producto Seleccionado -->
          <div v-if="productoSeleccionado" class="producto-seleccionado">
            <Divider />
            <h3>
              <i class="pi pi-check-circle text-green-500"></i>
              Producto Seleccionado
            </h3>
            <div class="info-producto">
              <p><strong>Nombre:</strong> {{ productoSeleccionado.nombre }}</p>
              <p><strong>Código:</strong> {{ productoSeleccionado.codigo }}</p>
              <p><strong>Precio:</strong> {{ formatearPrecio(productoSeleccionado.precio_venta) }}</p>
              <p v-if="productoSeleccionado.categoria === 'CELULARES'">
                <strong>Categoría:</strong> Celular
              </p>
            </div>

            <!-- Selector de IMEI (solo para celulares) -->
            <div v-if="productoSeleccionado.categoria === 'CELULARES' && imeisDisponibles.length > 0" class="field">
              <label for="imei-selector">Seleccionar IMEI</label>
              <Dropdown
                id="imei-selector"
                v-model="imeiSeleccionado"
                :options="imeisDisponibles"
                optionLabel="display"
                placeholder="Selecciona un IMEI..."
                class="w-full"
              >
                <template #value="slotProps">
                  <div v-if="slotProps.value">
                    <strong>{{ slotProps.value.imei }}</strong> -
                    {{ slotProps.value.capacidad }} -
                    Batería: {{ slotProps.value.bateria }}%
                  </div>
                  <span v-else>{{ slotProps.placeholder }}</span>
                </template>
                <template #option="slotProps">
                  <div class="imei-option">
                    <div><strong>IMEI:</strong> {{ slotProps.option.imei }}</div>
                    <div class="imei-details">
                      <span class="badge-capacidad">{{ slotProps.option.capacidad }}</span>
                      <span class="badge-bateria">Batería {{ slotProps.option.bateria }}%</span>
                      <span class="badge-precio">{{ formatearPrecio(slotProps.option.precio_venta || slotProps.option.precio) }}</span>
                    </div>
                  </div>
                </template>
              </Dropdown>
            </div>

            <Divider />

            <!-- Tabs para Configuraciones -->
            <TabView>
              <!-- Tab 1: Tamaño de Etiqueta -->
              <TabPanel header="Tamaño">
                <div class="configuracion-section">
                  <div class="field">
                    <label for="tamano-preset">Tamaño Predefinido</label>
                    <Dropdown
                      id="tamano-preset"
                      v-model="configuracion.tamanoPreset"
                      :options="tamanosDisponibles"
                      optionLabel="label"
                      optionValue="value"
                      placeholder="Selecciona un tamaño"
                      class="w-full"
                      @change="aplicarTamanoPreset"
                    />
                  </div>

                  <Divider align="center">
                    <span class="text-sm text-muted">O personaliza las dimensiones</span>
                  </Divider>

                  <div class="grid">
                    <div class="col-6">
                      <div class="field">
                        <label for="ancho">Ancho (mm)</label>
                        <InputNumber
                          id="ancho"
                          v-model="configuracion.ancho"
                          :min="30"
                          :max="200"
                          showButtons
                          suffix=" mm"
                          class="w-full"
                        />
                      </div>
                    </div>
                    <div class="col-6">
                      <div class="field">
                        <label for="alto">Alto (mm)</label>
                        <InputNumber
                          id="alto"
                          v-model="configuracion.alto"
                          :min="20"
                          :max="150"
                          showButtons
                          suffix=" mm"
                          class="w-full"
                        />
                      </div>
                    </div>
                  </div>

                  <div class="info-box">
                    <i class="pi pi-info-circle"></i>
                    <span>Dimensiones actuales: {{ configuracion.ancho }}mm x {{ configuracion.alto }}mm</span>
                  </div>
                </div>
              </TabPanel>

              <!-- Tab 2: Código de Barras/QR -->
              <TabPanel header="Código">
                <div class="configuracion-section">
                  <div class="field">
                    <label for="tipoCodigo">Tipo de Código</label>
                    <SelectButton
                      id="tipoCodigo"
                      v-model="configuracion.tipoCodigo"
                      :options="tiposCodigo"
                      optionLabel="label"
                      optionValue="value"
                      class="w-full"
                    />
                  </div>

                  <div v-if="configuracion.tipoCodigo === 'barras'">
                    <h4 class="config-subtitle">Configuración de Código de Barras</h4>

                    <div class="field">
                      <label for="barcode-ancho">Ancho de Barra</label>
                      <Slider
                        id="barcode-ancho"
                        v-model="configuracion.barcodeAncho"
                        :min="1"
                        :max="5"
                        :step="0.5"
                        class="w-full"
                      />
                      <small class="text-muted">{{ configuracion.barcodeAncho }}px</small>
                    </div>

                    <div class="field">
                      <label for="barcode-alto">Alto de Código</label>
                      <Slider
                        id="barcode-alto"
                        v-model="configuracion.barcodeAlto"
                        :min="30"
                        :max="120"
                        :step="5"
                        class="w-full"
                      />
                      <small class="text-muted">{{ configuracion.barcodeAlto }}px</small>
                    </div>
                  </div>

                  <div v-else>
                    <h4 class="config-subtitle">Configuración de Código QR</h4>

                    <div class="field">
                      <label for="qr-tamano">Tamaño de QR</label>
                      <Slider
                        id="qr-tamano"
                        v-model="configuracion.qrTamano"
                        :min="80"
                        :max="200"
                        :step="10"
                        class="w-full"
                      />
                      <small class="text-muted">{{ configuracion.qrTamano }}px</small>
                    </div>
                  </div>
                </div>
              </TabPanel>

              <!-- Tab 3: Texto y Fuentes -->
              <TabPanel header="Texto">
                <div class="configuracion-section">
                  <div class="field">
                    <label for="plantillaEtiqueta">Plantilla rápida</label>
                    <div class="p-inputgroup">
                      <Dropdown
                        id="plantillaEtiqueta"
                        v-model="configuracion.plantilla"
                        :options="plantillasDisponibles"
                        optionLabel="label"
                        optionValue="value"
                        class="w-full"
                      />
                      <Button
                        label="Aplicar"
                        icon="pi pi-bolt"
                        severity="warning"
                        @click="aplicarPlantillaRapida"
                      />
                    </div>
                  </div>

                  <div class="field">
                    <label for="font-empresa">Tamaño Nombre Empresa</label>
                    <Slider
                      id="font-empresa"
                      v-model="configuracion.fontSize.empresa"
                      :min="6"
                      :max="16"
                      :step="1"
                      class="w-full"
                    />
                    <small class="text-muted">{{ configuracion.fontSize.empresa }}px</small>
                  </div>

                  <div class="field">
                    <label for="font-producto">Tamaño Nombre Producto</label>
                    <Slider
                      id="font-producto"
                      v-model="configuracion.fontSize.producto"
                      :min="8"
                      :max="20"
                      :step="1"
                      class="w-full"
                    />
                    <small class="text-muted">{{ configuracion.fontSize.producto }}px</small>
                  </div>

                  <div class="field">
                    <label for="font-marca">Tamaño Marca/Modelo</label>
                    <Slider
                      id="font-marca"
                      v-model="configuracion.fontSize.marca"
                      :min="6"
                      :max="14"
                      :step="1"
                      class="w-full"
                    />
                    <small class="text-muted">{{ configuracion.fontSize.marca }}px</small>
                  </div>

                  <div class="field">
                    <label for="font-specs">Tamaño Especificaciones</label>
                    <Slider
                      id="font-specs"
                      v-model="configuracion.fontSize.especificaciones"
                      :min="6"
                      :max="14"
                      :step="1"
                      class="w-full"
                    />
                    <small class="text-muted">{{ configuracion.fontSize.especificaciones }}px</small>
                  </div>

                  <div class="field">
                    <label for="font-codigo">Tamaño Código (texto)</label>
                    <Slider
                      id="font-codigo"
                      v-model="configuracion.fontSize.codigo"
                      :min="6"
                      :max="14"
                      :step="1"
                      class="w-full"
                    />
                    <small class="text-muted">{{ configuracion.fontSize.codigo }}px</small>
                  </div>

                  <div class="field">
                    <label for="font-precio">Tamaño Precio</label>
                    <Slider
                      id="font-precio"
                      v-model="configuracion.fontSize.precio"
                      :min="10"
                      :max="24"
                      :step="1"
                      class="w-full"
                    />
                    <small class="text-muted">{{ configuracion.fontSize.precio }}px</small>
                  </div>

                  <div class="field">
                    <label for="font-detalle">Tamaño Líneas Detalle</label>
                    <Slider
                      id="font-detalle"
                      v-model="configuracion.fontSize.detalle"
                      :min="8"
                      :max="22"
                      :step="1"
                      class="w-full"
                    />
                    <small class="text-muted">{{ configuracion.fontSize.detalle }}px</small>
                  </div>
                </div>
              </TabPanel>
            </TabView>
          </div>
        </template>
      </Card>

      <!-- Columna Derecha -->
      <div class="preview-column">
        <Card class="preview-panel">
        <template #title>
          <i class="pi pi-eye"></i> Vista Previa
        </template>
        <template #content>
          <div v-if="!tieneContenidoVistaPrevia" class="no-preview">
            <i class="pi pi-tag" style="font-size: 4rem; opacity: 0.3;"></i>
            <p>Selecciona un producto o agrega una línea manual para ver la vista previa</p>
          </div>

          <div v-else class="preview-wrapper">
            <div
              ref="etiquetaRef"
              class="etiqueta-preview"
              :style="estiloEtiquetaPreview"
            >
              <!-- Nombre de Empresa -->
              <div
                v-if="productoSeleccionado && configuracion.mostrarNombreEmpresa"
                class="bloque-editable empresa-nombre"
                :class="{ 'bloque-arrastrando': dragState.activo && dragState.bloque === 'empresa' }"
                :style="estiloBloque('empresa', { fontSize: configuracion.fontSize.empresa + 'px' })"
                @pointerdown="iniciarArrastre($event, 'empresa')"
                @contextmenu.prevent="abrirMenuBloque($event, 'empresa')"
              >
                {{ obtenerTextoEmpresaEtiqueta() }}
              </div>

              <!-- Código de Barras o QR -->
              <div
                v-if="productoSeleccionado && configuracion.mostrarCodigoGrafico"
                class="bloque-editable codigo-container"
                :class="{ 'bloque-arrastrando': dragState.activo && dragState.bloque === 'codigo' }"
                :style="estiloBloque('codigo', { transform: `translateY(${configuracion.separacionEmpresaCodigo}px)` })"
                @pointerdown="iniciarArrastre($event, 'codigo')"
                @contextmenu.prevent="abrirMenuBloque($event, 'codigo')"
              >
                <canvas
                  v-if="configuracion.tipoCodigo === 'barras'"
                  :id="`barcode-${_uid}`"
                  class="codigo-barras"
                ></canvas>
                <canvas
                  v-else
                  :id="`qrcode-${_uid}`"
                  class="codigo-qr"
                ></canvas>
              </div>

              <!-- Código mostrado debajo -->
              <div
                v-if="productoSeleccionado && configuracion.mostrarCodigoTexto"
                class="bloque-editable codigo-texto"
                :class="{ 'bloque-arrastrando': dragState.activo && dragState.bloque === 'codigoTexto' }"
                :style="estiloBloque('codigoTexto', { fontSize: configuracion.fontSize.codigo + 'px', transform: `translateY(${configuracion.separacionCodigoTexto}px)` })"
                @pointerdown="iniciarArrastre($event, 'codigoTexto')"
                @contextmenu.prevent="abrirMenuBloque($event, 'codigoTexto')"
              >
                {{ obtenerTextoCodigoEtiqueta() }}
              </div>

              <!-- Nombre del Producto -->
              <div
                v-if="productoSeleccionado && configuracion.mostrarProducto"
                class="bloque-editable producto-nombre"
                :class="{ 'bloque-arrastrando': dragState.activo && dragState.bloque === 'producto' }"
                :style="estiloBloque('producto', { fontSize: configuracion.fontSize.producto + 'px' })"
                @pointerdown="iniciarArrastre($event, 'producto')"
                @contextmenu.prevent="abrirMenuBloque($event, 'producto')"
              >
                {{ obtenerTextoProductoEtiqueta() }}
              </div>

              <!-- Marca y Modelo -->
              <div
                v-if="productoSeleccionado && configuracion.mostrarMarca && (productoSeleccionado.marca || productoSeleccionado.modelo)"
                class="bloque-editable marca-modelo"
                :class="{ 'bloque-arrastrando': dragState.activo && dragState.bloque === 'marca' }"
                :style="estiloBloque('marca', { fontSize: configuracion.fontSize.marca + 'px' })"
                @pointerdown="iniciarArrastre($event, 'marca')"
                @contextmenu.prevent="abrirMenuBloque($event, 'marca')"
              >
                {{ obtenerTextoMarcaEtiqueta() }}
              </div>

              <div
                v-if="productoSeleccionado && configuracion.mostrarColor && obtenerColorEtiqueta()"
                class="bloque-editable color-linea"
                :class="{ 'bloque-arrastrando': dragState.activo && dragState.bloque === 'color' }"
                :style="estiloBloque('color', { fontSize: configuracion.fontSize.detalle + 'px' })"
                @pointerdown="iniciarArrastre($event, 'color')"
                @contextmenu.prevent="abrirMenuBloque($event, 'color')"
              >
                {{ obtenerColorEtiqueta() }}
              </div>

              <div
                v-if="productoSeleccionado && configuracion.mostrarImei && obtenerImeiEtiqueta()"
                class="bloque-editable imei-linea"
                :class="{ 'bloque-arrastrando': dragState.activo && dragState.bloque === 'imei' }"
                :style="estiloBloque('imei', { fontSize: configuracion.fontSize.detalle + 'px' })"
                @pointerdown="iniciarArrastre($event, 'imei')"
                @contextmenu.prevent="abrirMenuBloque($event, 'imei')"
              >
                IMEI:{{ obtenerImeiEtiqueta() }}
              </div>

              <div
                v-if="productoSeleccionado && configuracion.mostrarCodigoProducto && obtenerCodigoProductoTexto()"
                class="bloque-editable codigo-producto-linea"
                :class="{ 'bloque-arrastrando': dragState.activo && dragState.bloque === 'codigoProducto' }"
                :style="estiloBloque('codigoProducto', { fontSize: configuracion.fontSize.detalle + 'px' })"
                @pointerdown="iniciarArrastre($event, 'codigoProducto')"
                @contextmenu.prevent="abrirMenuBloque($event, 'codigoProducto')"
              >
                COD:{{ obtenerCodigoProductoTexto() }}
              </div>

              <!-- Especificaciones (Celulares) -->
              <div
                v-if="productoSeleccionado && configuracion.mostrarEspecificaciones && productoSeleccionado.categoria === 'CELULARES' && imeiSeleccionado"
                class="bloque-editable especificaciones"
                :class="{ 'bloque-arrastrando': dragState.activo && dragState.bloque === 'especificaciones' }"
                :style="estiloBloque('especificaciones', { fontSize: configuracion.fontSize.especificaciones + 'px' })"
                @pointerdown="iniciarArrastre($event, 'especificaciones')"
                @contextmenu.prevent="abrirMenuBloque($event, 'especificaciones')"
              >
                {{ obtenerTextoEspecificacionesEtiqueta() }}
              </div>

              <!-- Precio -->
              <div
                v-if="productoSeleccionado && configuracion.mostrarPrecio"
                class="bloque-editable precio"
                :class="{ 'bloque-arrastrando': dragState.activo && dragState.bloque === 'precio' }"
                :style="estiloBloque('precio', { fontSize: configuracion.fontSize.precio + 'px' })"
                @pointerdown="iniciarArrastre($event, 'precio')"
                @contextmenu.prevent="abrirMenuBloque($event, 'precio')"
              >
                {{ obtenerTextoPrecioEtiqueta() }}
              </div>

              <div
                v-for="linea in configuracion.manualLines"
                :key="linea.id"
                class="bloque-editable linea-manual"
                :class="{ 'bloque-arrastrando': dragState.activo && dragState.bloque === `manual:${linea.id}` }"
                :style="estiloLineaManual(linea)"
                @pointerdown="iniciarArrastre($event, `manual:${linea.id}`)"
                @mousedown.prevent="iniciarArrastre($event, `manual:${linea.id}`)"
                @touchstart.prevent="iniciarArrastre($event, `manual:${linea.id}`)"
                @contextmenu.prevent="abrirMenuBloque($event, `manual:${linea.id}`)"
              >
                <template v-if="linea.tipo === 'codigo'">
                  <img
                    v-if="codigosManualesPreview[linea.id]?.src"
                    :src="codigosManualesPreview[linea.id].src"
                    :class="configuracion.tipoCodigo === 'barras' ? 'codigo-barras' : 'codigo-qr'"
                    class="linea-manual-codigo"
                  />
                  <div class="linea-manual-valor">{{ obtenerValorLineaCodigo(linea) || 'Valor del código' }}</div>
                </template>
                <template v-else>
                  {{ obtenerTextoLineaManual(linea) || 'Texto manual' }}
                </template>
              </div>
            </div>

            <div class="preview-info">
              <p><i class="pi pi-info-circle"></i> Esta es una vista previa. El tamaño real dependerá de tu impresora.</p>
              <p class="mt-2"><strong>Dimensiones:</strong> {{ configuracion.ancho }}mm x {{ configuracion.alto }}mm ({{ pixelesAncho }}px x {{ pixelesAlto }}px)</p>
              <div class="preview-zoom-control">
                <label for="preview-zoom">Zoom del lienzo</label>
                <Slider
                  id="preview-zoom"
                  v-model="configuracion.previewZoom"
                  :min="1"
                  :max="4"
                  :step="0.25"
                  class="w-full"
                />
                <small class="text-muted">{{ configuracion.previewZoom.toFixed(2) }}x</small>
              </div>
              <p class="mt-2"><strong>Editor manual:</strong> arrastra cada bloque dentro de la etiqueta para ajustar su posición.</p>
            </div>
          </div>

          <div
            v-if="menuBloque.visible"
            class="menu-bloque"
            :style="{ top: `${menuBloque.y}px`, left: `${menuBloque.x}px` }"
          >
            <button type="button" class="menu-bloque-item" @click="editarBloqueSeleccionado">
              Editar
            </button>
            <button type="button" class="menu-bloque-item" @click="quitarBloqueSeleccionado">
              Quitar de la etiqueta
            </button>
          </div>
        </template>
      </Card>

      <Card class="workspace-tabs-panel">
        <template #title>
          <i class="pi pi-folder-open"></i> Herramientas de Etiqueta
        </template>
        <template #content>
          <TabView class="workspace-tabs">
            <TabPanel header="Líneas Manuales">
      <Card class="manual-lines-panel">
        <template #title>
          <i class="pi pi-pencil"></i> Líneas Manuales
        </template>
        <template #content>
          <div class="manual-editor">
            <div class="manual-editor-header">
              <strong>Campos manuales de etiqueta</strong>
              <div class="manual-editor-actions">
                <Dropdown
                  v-model="patronManualSeleccionado"
                  :options="patronesManuales"
                  optionLabel="label"
                  optionValue="value"
                  placeholder="Aplicar patrón"
                  class="manual-pattern-select"
                />
                <Button
                  label="Usar patrón"
                  icon="pi pi-th-large"
                  severity="secondary"
                  size="small"
                  @click="aplicarPatronManual"
                />
                <Button
                  label="Agregar línea"
                  icon="pi pi-plus"
                  severity="help"
                  size="small"
                  @click="agregarLineaManual"
                />
              </div>
            </div>

            <div v-if="editorBloque.visible" class="editor-bloque-rapido">
              <div class="editor-bloque-header">
                <strong>{{ editorBloque.titulo }}</strong>
                <Button
                  icon="pi pi-times"
                  severity="secondary"
                  text
                  size="small"
                  @click="cerrarEditorBloque"
                />
              </div>

              <div v-if="editorBloque.manual" class="manual-line-grid">
                <div class="field">
                  <label for="editor-manual-tipo">Tipo</label>
                  <Dropdown
                    id="editor-manual-tipo"
                    v-model="editorBloque.linea.tipo"
                    :options="tiposLineaManual"
                    optionLabel="label"
                    optionValue="value"
                    class="w-full"
                  />
                </div>

                <div v-if="editorBloque.linea.tipo === 'custom'" class="field">
                  <label for="editor-manual-texto">Texto</label>
                  <InputText
                    id="editor-manual-texto"
                    v-model="editorBloque.linea.texto"
                    class="w-full"
                  />
                </div>

                <div v-else-if="editorBloque.linea.tipo === 'codigo'" class="field">
                  <label for="editor-manual-codigo">Valor del código</label>
                  <InputText
                    id="editor-manual-codigo"
                    v-model="editorBloque.linea.valorCodigo"
                    class="w-full"
                  />
                </div>

                <div v-else class="field">
                  <label>Vista del valor</label>
                  <InputText :modelValue="obtenerTextoLineaManual(editorBloque.linea)" readonly class="w-full" />
                </div>
              </div>

              <div v-else class="manual-line-grid">
                <div class="field" v-if="editorBloque.contentType === 'text' && editorBloque.contentKey">
                  <label for="editor-native-text">Contenido</label>
                  <InputText
                    id="editor-native-text"
                    :modelValue="obtenerOverrideContenido(editorBloque.contentKey)"
                    @update:modelValue="actualizarContenidoBloque(editorBloque.contentKey, $event)"
                    class="w-full"
                    placeholder="Escribe el texto del bloque"
                  />
                </div>

                <div class="field" v-if="editorBloque.contentType === 'code' && editorBloque.contentKey">
                  <label for="editor-native-code">Valor del código</label>
                  <InputText
                    id="editor-native-code"
                    :modelValue="obtenerOverrideContenido(editorBloque.contentKey)"
                    @update:modelValue="actualizarContenidoBloque(editorBloque.contentKey, $event)"
                    class="w-full"
                    placeholder="Escribe el valor del código"
                  />
                </div>

                <div class="field" v-if="editorBloque.fontKey">
                  <label for="editor-native-font">Tamaño</label>
                  <InputNumber
                    id="editor-native-font"
                    v-model="configuracion.fontSize[editorBloque.fontKey]"
                    :min="6"
                    :max="36"
                    showButtons
                    class="w-full"
                  />
                </div>

                <div class="field">
                  <label for="editor-native-width">Ancho %</label>
                  <InputNumber
                    id="editor-native-width"
                    :modelValue="obtenerLayoutBloque(editorBloque.bloque).width"
                    @update:modelValue="actualizarWidthBloque(editorBloque.bloque, $event)"
                    :min="20"
                    :max="100"
                    showButtons
                    class="w-full"
                  />
                </div>
              </div>

              <div class="manual-line-grid">
                <div class="field">
                  <label v-if="editorBloque.manual" for="editor-manual-font">Tamaño</label>
                  <InputNumber
                    v-if="editorBloque.manual"
                    id="editor-manual-font"
                    v-model="editorBloque.linea.fontSize"
                    :min="6"
                    :max="36"
                    showButtons
                    class="w-full"
                  />
                </div>

                <div class="field" v-if="editorBloque.manual">
                  <label for="editor-manual-width">Ancho %</label>
                  <InputNumber
                    id="editor-manual-width"
                    v-model="editorBloque.linea.width"
                    :min="20"
                    :max="100"
                    showButtons
                    class="w-full"
                  />
                </div>
              </div>

              <div v-if="editorBloque.manual" class="manual-line-grid">
                <div class="field">
                  <label>Alineación</label>
                  <SelectButton
                    v-model="editorBloque.linea.align"
                    :options="alineacionesTexto"
                    optionLabel="label"
                    optionValue="value"
                    class="w-full"
                  />
                </div>

                <div class="field-checkbox manual-line-bold">
                  <Checkbox
                    id="editor-manual-bold"
                    v-model="editorBloque.linea.bold"
                    :binary="true"
                  />
                  <label for="editor-manual-bold">Negrita</label>
                </div>
              </div>
            </div>

            <div v-if="configuracion.manualLines.length === 0" class="manual-editor-empty">
              Agrega líneas por tipo: empresa, producto, código, precio, marca, especificaciones o texto libre.
            </div>

            <div v-else class="manual-lines-list">
              <div
                v-for="(linea, index) in configuracion.manualLines"
                :key="linea.id"
                class="manual-line-item"
              >
                <div class="manual-line-header">
                  <span>Línea {{ index + 1 }}</span>
                  <Button
                    icon="pi pi-trash"
                    severity="danger"
                    text
                    @click="eliminarLineaManual(linea.id)"
                  />
                </div>

                <div class="manual-line-grid">
                  <div class="field">
                    <label :for="`manual-tipo-${linea.id}`">Tipo</label>
                    <Dropdown
                      :id="`manual-tipo-${linea.id}`"
                      v-model="linea.tipo"
                      :options="tiposLineaManual"
                      optionLabel="label"
                      optionValue="value"
                      class="w-full"
                    />
                  </div>

                  <div v-if="linea.tipo === 'custom'" class="field">
                    <label :for="`manual-texto-${linea.id}`">Texto</label>
                    <InputText
                      :id="`manual-texto-${linea.id}`"
                      v-model="linea.texto"
                      placeholder="Escribe lo que quieras imprimir"
                      class="w-full"
                    />
                  </div>

                  <div v-else-if="linea.tipo === 'codigo'" class="field">
                    <label :for="`manual-codigo-${linea.id}`">Valor del código</label>
                    <InputText
                      :id="`manual-codigo-${linea.id}`"
                      v-model="linea.valorCodigo"
                      placeholder="Valor que se convertirá en código"
                      class="w-full"
                    />
                  </div>

                  <div v-else class="field">
                    <label>Vista del valor</label>
                    <InputText
                      :modelValue="obtenerTextoLineaManual(linea)"
                      readonly
                      class="w-full"
                    />
                  </div>
                </div>

                <div class="manual-line-grid">
                  <div class="field">
                    <label :for="`manual-font-${linea.id}`">Tamaño</label>
                    <InputNumber
                      :id="`manual-font-${linea.id}`"
                      v-model="linea.fontSize"
                      :min="6"
                      :max="36"
                      showButtons
                      class="w-full"
                    />
                  </div>

                  <div class="field">
                    <label :for="`manual-width-${linea.id}`">Ancho %</label>
                    <InputNumber
                      :id="`manual-width-${linea.id}`"
                      v-model="linea.width"
                      :min="20"
                      :max="100"
                      showButtons
                      class="w-full"
                    />
                  </div>
                </div>

                <div class="manual-line-grid">
                  <div class="field">
                    <label>Alineación</label>
                    <SelectButton
                      v-model="linea.align"
                      :options="alineacionesTexto"
                      optionLabel="label"
                      optionValue="value"
                      class="w-full"
                    />
                  </div>

                  <div class="field-checkbox manual-line-bold">
                    <Checkbox
                      :id="`manual-bold-${linea.id}`"
                      v-model="linea.bold"
                      :binary="true"
                    />
                    <label :for="`manual-bold-${linea.id}`">Negrita</label>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </template>
      </Card>

            </TabPanel>
            <TabPanel header="Acciones Rápidas">
      <Card class="quick-panel">
        <template #title>
          <i class="pi pi-sliders-h"></i> Acciones Rápidas
        </template>
        <template #content>
          <div class="quick-actions-content">
            <div class="quick-options-grid">
              <div class="field">
                <label for="cantidad-rapida">Cantidad de Etiquetas</label>
                <InputNumber
                  id="cantidad-rapida"
                  v-model="configuracion.cantidad"
                  :min="1"
                  :max="100"
                  showButtons
                  class="w-full"
                />
              </div>

              <div class="field">
                <label for="padding-rapido">Espaciado Interno (padding)</label>
                <Slider
                  id="padding-rapido"
                  v-model="configuracion.padding"
                  :min="2"
                  :max="20"
                  :step="1"
                  class="w-full"
                />
                <small class="text-muted">{{ configuracion.padding }}px</small>
              </div>

              <div class="field">
                <label for="margen-superior-rapido">Margen superior</label>
                <Slider
                  id="margen-superior-rapido"
                  v-model="configuracion.margenSuperior"
                  :min="0"
                  :max="20"
                  :step="1"
                  class="w-full"
                />
                <small class="text-muted">{{ configuracion.margenSuperior }}px</small>
              </div>

              <div class="field">
                <label for="margen-inferior-rapido">Margen inferior</label>
                <Slider
                  id="margen-inferior-rapido"
                  v-model="configuracion.margenInferior"
                  :min="0"
                  :max="20"
                  :step="1"
                  class="w-full"
                />
                <small class="text-muted">{{ configuracion.margenInferior }}px</small>
              </div>

              <div class="field">
                <label for="margen-izquierdo-rapido">Margen izquierdo</label>
                <Slider
                  id="margen-izquierdo-rapido"
                  v-model="configuracion.margenIzquierdo"
                  :min="0"
                  :max="20"
                  :step="1"
                  class="w-full"
                />
                <small class="text-muted">{{ configuracion.margenIzquierdo }}px</small>
              </div>

              <div class="field">
                <label for="margen-derecho-rapido">Margen derecho</label>
                <Slider
                  id="margen-derecho-rapido"
                  v-model="configuracion.margenDerecho"
                  :min="0"
                  :max="20"
                  :step="1"
                  class="w-full"
                />
                <small class="text-muted">{{ configuracion.margenDerecho }}px</small>
              </div>

              <div class="field">
                <label for="separacion-empresa-codigo">Separación empresa / código</label>
                <Slider
                  id="separacion-empresa-codigo"
                  v-model="configuracion.separacionEmpresaCodigo"
                  :min="-4"
                  :max="20"
                  :step="1"
                  class="w-full"
                />
                <small class="text-muted">{{ configuracion.separacionEmpresaCodigo }}px</small>
              </div>

              <div class="field">
                <label for="separacion-codigo-texto">Separación texto / código</label>
                <Slider
                  id="separacion-codigo-texto"
                  v-model="configuracion.separacionCodigoTexto"
                  :min="-4"
                  :max="20"
                  :step="1"
                  class="w-full"
                />
                <small class="text-muted">{{ configuracion.separacionCodigoTexto }}px</small>
              </div>
            </div>

            <div class="quick-toggles">
              <div class="field-checkbox">
                <Checkbox
                  id="mostrarNombreEmpresaRapido"
                  v-model="configuracion.mostrarNombreEmpresa"
                  :binary="true"
                />
                <label for="mostrarNombreEmpresaRapido">Empresa</label>
              </div>

              <div class="field-checkbox">
                <Checkbox
                  id="mostrarMarcaRapido"
                  v-model="configuracion.mostrarMarca"
                  :binary="true"
                />
                <label for="mostrarMarcaRapido">Marca y modelo</label>
              </div>

              <div class="field-checkbox">
                <Checkbox
                  id="mostrarEspecificacionesRapido"
                  v-model="configuracion.mostrarEspecificaciones"
                  :binary="true"
                />
                <label for="mostrarEspecificacionesRapido">Especificaciones</label>
              </div>

              <div class="field-checkbox">
                <Checkbox
                  id="mostrarCodigoGraficoRapido"
                  v-model="configuracion.mostrarCodigoGrafico"
                  :binary="true"
                />
                <label for="mostrarCodigoGraficoRapido">Código gráfico</label>
              </div>

              <div class="field-checkbox">
                <Checkbox
                  id="mostrarCodigoTextoRapido"
                  v-model="configuracion.mostrarCodigoTexto"
                  :binary="true"
                />
                <label for="mostrarCodigoTextoRapido">Código en texto</label>
              </div>

              <div class="field-checkbox">
                <Checkbox
                  id="mostrarPrecioRapido"
                  v-model="configuracion.mostrarPrecio"
                  :binary="true"
                />
                <label for="mostrarPrecioRapido">Precio</label>
              </div>

              <div class="field-checkbox">
                <Checkbox
                  id="mostrarColorRapido"
                  v-model="configuracion.mostrarColor"
                  :binary="true"
                />
                <label for="mostrarColorRapido">Color</label>
              </div>

              <div class="field-checkbox">
                <Checkbox
                  id="mostrarImeiRapido"
                  v-model="configuracion.mostrarImei"
                  :binary="true"
                />
                <label for="mostrarImeiRapido">IMEI</label>
              </div>

              <div class="field-checkbox">
                <Checkbox
                  id="mostrarCodigoProductoRapido"
                  v-model="configuracion.mostrarCodigoProducto"
                  :binary="true"
                />
                <label for="mostrarCodigoProductoRapido">Código producto</label>
              </div>
            </div>

            <div class="acciones-etiqueta acciones-etiqueta-grid">
              <Button
                label="Agregar a Lista"
                icon="pi pi-plus"
                @click="agregarProductoALista"
                severity="help"
                class="w-full"
              />
              <Button
                label="Vista Previa"
                icon="pi pi-eye"
                @click="mostrarVistaPrevia"
                severity="secondary"
                class="w-full"
              />
              <Button
                label="Guardar Formato Actual"
                icon="pi pi-save"
                @click="guardarConfiguracionEtiquetas"
                severity="info"
                outlined
                class="w-full"
              />
              <Button
                label="Guardar Como Nuevo"
                icon="pi pi-bookmark"
                @click="guardarComoNuevoFormato"
                severity="contrast"
                outlined
                class="w-full"
              />
              <Button
                label="Restaurar Valores"
                icon="pi pi-refresh"
                @click="restaurarDefaults"
                severity="warning"
                outlined
                class="w-full"
              />
              <Button
                label="Restaurar Posiciones"
                icon="pi pi-directions-alt"
                @click="restaurarPosiciones"
                severity="contrast"
                outlined
                class="w-full"
              />
              <Button
                label="Limpiar Etiqueta"
                icon="pi pi-eraser"
                @click="limpiarEtiqueta"
                severity="danger"
                outlined
                class="w-full"
              />
              <Button
                label="Imprimir Etiquetas"
                icon="pi pi-print"
                @click="imprimirEtiquetas"
                severity="success"
                class="w-full"
              />
            </div>
          </div>
        </template>
      </Card>

            </TabPanel>
            <TabPanel header="Lista de Impresión">
      <Card class="lista-panel">
        <template #title>
          <i class="pi pi-list"></i> Lista de Impresión
        </template>
        <template #content>
          <div v-if="listaEtiquetas.length === 0" class="lista-vacia">
            Agrega productos para imprimir varios en un solo lote.
          </div>

          <div v-else class="lista-etiquetas">
            <div
              v-for="item in listaEtiquetas"
              :key="item.id"
              class="lista-item"
            >
              <div class="lista-item-info">
                <div class="lista-item-nombre">{{ item.producto.nombre }}</div>
                <div class="lista-item-meta">
                  <span>{{ item.codigo }}</span>
                  <span v-if="item.imei">IMEI {{ item.imei.imei }}</span>
                  <span v-if="item.imei?.capacidad">{{ item.imei.capacidad }}</span>
                  <span v-if="item.imei?.bateria">Batería {{ item.imei.bateria }}%</span>
                  <span v-if="item.imei">{{ formatearPrecio(item.imei.precio_venta || item.imei.precio) }}</span>
                </div>
              </div>

              <div class="lista-item-cantidad">
                <label :for="`cantidad-item-${item.id}`">Cantidad</label>
                <InputNumber
                  :id="`cantidad-item-${item.id}`"
                  v-model="item.cantidad"
                  :min="1"
                  :max="500"
                  showButtons
                  class="w-full"
                />
              </div>

              <Button
                icon="pi pi-trash"
                severity="danger"
                text
                @click="eliminarProductoDeLista(item.id)"
              />
            </div>

            <div class="lista-footer">
              <strong>Total etiquetas: {{ totalEtiquetasLista }}</strong>
              <Button
                label="Vaciar Lista"
                icon="pi pi-times"
                severity="contrast"
                outlined
                @click="vaciarListaEtiquetas"
              />
            </div>
          </div>
        </template>
      </Card>

            </TabPanel>
            <TabPanel header="Formatos Guardados">
      <Card class="lista-panel formatos-panel">
        <template #title>
          <i class="pi pi-bookmark"></i> Formatos Guardados
        </template>
        <template #content>
          <div class="formatos-toolbar">
            <div class="field formatos-search">
              <label for="busquedaFormato">Buscar formato</label>
              <InputText
                id="busquedaFormato"
                v-model="busquedaFormato"
                placeholder="Buscar por nombre..."
                class="w-full"
              />
            </div>
            <div class="formatos-toolbar-actions">
              <Button
                label="Guardar como nuevo"
                icon="pi pi-plus"
                severity="secondary"
                outlined
                @click="guardarComoNuevoFormato"
              />
            </div>
          </div>

          <DataTable
            :value="formatosFiltrados"
            responsiveLayout="scroll"
            dataKey="id"
            class="formatos-table"
            :rows="6"
            paginator
          >
            <Column field="nombre" header="Formato">
              <template #body="slotProps">
                <div class="formato-nombre-cell">
                  <strong>{{ slotProps.data.nombre === 'default' ? 'Base actual' : slotProps.data.nombre }}</strong>
                  <Tag
                    v-if="slotProps.data.id === formatoSeleccionadoId"
                    value="Activo"
                    severity="success"
                  />
                </div>
              </template>
            </Column>
            <Column field="updated_at" header="Última actualización">
              <template #body="slotProps">
                {{ formatearFechaFormato(slotProps.data.updated_at) }}
              </template>
            </Column>
            <Column header="Acciones" style="width: 14rem">
              <template #body="slotProps">
                <div class="formatos-actions">
                  <Button
                    icon="pi pi-upload"
                    label="Cargar"
                    size="small"
                    severity="info"
                    text
                    @click="aplicarFormatoGuardado(slotProps.data, { impresoraFallback: configuracion.impresora || '', mostrarToast: true })"
                  />
                  <Button
                    icon="pi pi-save"
                    label="Guardar"
                    size="small"
                    severity="success"
                    text
                    @click="formatoSeleccionadoId = slotProps.data.id; guardarConfiguracionEtiquetas()"
                  />
                  <Button
                    icon="pi pi-trash"
                    label="Eliminar"
                    size="small"
                    severity="danger"
                    text
                    :disabled="slotProps.data.nombre === 'default'"
                    @click="eliminarFormatoGuardado(slotProps.data)"
                  />
                </div>
              </template>
            </Column>
            <template #empty>
              <div class="lista-vacia">
                No hay formatos guardados todavía.
              </div>
            </template>
          </DataTable>
        </template>
      </Card>
            </TabPanel>
          </TabView>
        </template>
      </Card>
    </div>
    </div>

    <!-- Dialog para resultados de búsqueda múltiple -->
    <Dialog
      v-model:visible="mostrarResultados"
      modal
      header="Resultados de Búsqueda"
      :style="{ width: '50rem' }"
    >
      <DataTable
        :value="resultadosBusqueda"
        selectionMode="single"
        @row-select="seleccionarDesdeResultados"
        :paginator="true"
        :rows="10"
        responsiveLayout="scroll"
      >
        <Column field="codigo" header="Código" sortable></Column>
        <Column field="nombre" header="Nombre" sortable></Column>
        <Column field="codigo_barra" header="Código de Barras" sortable></Column>
        <Column field="categoria" header="Categoría" sortable></Column>
        <Column field="precio_venta" header="Precio" sortable>
          <template #body="slotProps">
            {{ formatearPrecio(slotProps.data.precio_venta) }}
          </template>
        </Column>
      </DataTable>
    </Dialog>

    <!-- Dialog para seleccionar impresora -->
    <Dialog
      v-model:visible="dialogImpresoras"
      modal
      header="Seleccionar Impresora"
      :style="{ width: '450px' }"
    >
      <div v-if="listaImpresoras.length === 0" class="text-center py-4">
        <i class="pi pi-spin pi-spinner" style="font-size: 2rem;"></i>
        <p class="mt-3">Buscando impresoras...</p>
      </div>

      <div v-else class="impresoras-lista">
        <Button
          v-for="(impresora, index) in listaImpresoras"
          :key="index"
          @click="seleccionarImpresora(impresora)"
          outlined
          class="w-full mb-2 impresora-item"
        >
          <i class="pi pi-print mr-2"></i>
          {{ impresora }}
        </Button>
      </div>
    </Dialog>

    <!-- Toast para notificaciones -->
    <Toast />
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, watch, nextTick, computed, getCurrentInstance } from 'vue'
import JsBarcode from 'jsbarcode'
import QRCode from 'qrcode'
import Card from 'primevue/card'
import InputText from 'primevue/inputtext'
import Button from 'primevue/button'
import Dropdown from 'primevue/dropdown'
import SelectButton from 'primevue/selectbutton'
import Checkbox from 'primevue/checkbox'
import InputNumber from 'primevue/inputnumber'
import Slider from 'primevue/slider'
import Divider from 'primevue/divider'
import Dialog from 'primevue/dialog'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import TabView from 'primevue/tabview'
import TabPanel from 'primevue/tabpanel'
import Toast from 'primevue/toast'
import { useToast } from 'primevue/usetoast'
import Awesomplete from '@/components/Awesomplete.vue'
import { peticionesFetchOffline, envioElectron } from '@/funciones/funciones'

const toast = useToast()
const instance = getCurrentInstance()
const _uid = instance.uid

// Referencias
const etiquetaRef = ref(null)
const busqueda = ref('')
const productoSeleccionado = ref(null)
const imeiSeleccionado = ref(null)
const listaEtiquetas = ref([])
const imeisDisponibles = ref([])
const resultadosBusqueda = ref([])
const mostrarResultados = ref(false)

// Referencias para autocompletado y impresoras
const listaBuscador = ref([])
const dataProductos = ref([])
const dataIMEIs = ref([])
const dialogImpresoras = ref(false)
const listaImpresoras = ref([])
const codigosManualesPreview = ref({})
const patronManualSeleccionado = ref('empresa-capacidad-color-codigo')
const formatosGuardados = ref([])
const busquedaFormato = ref('')
const formatoSeleccionadoId = ref(null)

// Datos de empresa
const datosEmpresa = ref({
  nombre: 'JTA SMART SYSTEMS',
  telefono: '+1(829)784-2912',
  direccion: 'Direccion de la empresa'
})

const crearLayoutDefault = () => ({
  empresa: { top: 4, left: 5, width: 90 },
  codigo: { top: 16, left: 10, width: 80 },
  codigoTexto: { top: 52, left: 8, width: 84 },
  producto: { top: 62, left: 5, width: 90 },
  marca: { top: 75, left: 8, width: 84 },
  color: { top: 47, left: 8, width: 84 },
  imei: { top: 60, left: 6, width: 88 },
  codigoProducto: { top: 72, left: 6, width: 88 },
  especificaciones: { top: 84, left: 7, width: 86 },
  precio: { top: 92, left: 12, width: 76 }
})

const crearIdManual = () => `manual-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`

const crearLineaManual = (indice = 0, linea = {}) => ({
  id: linea.id || crearIdManual(),
  tipo: linea.tipo || 'custom',
  texto: linea.texto || '',
  valorCodigo: linea.valorCodigo || '',
  top: typeof linea.top === 'number' ? linea.top : Math.min(12 + (indice * 10), 88),
  left: typeof linea.left === 'number' ? linea.left : 10,
  width: typeof linea.width === 'number' ? linea.width : 80,
  fontSize: typeof linea.fontSize === 'number' ? linea.fontSize : 12,
  bold: Boolean(linea.bold),
  align: linea.align || 'center'
})

// Configuración de la etiqueta con valores por defecto
const configuracionDefault = {
  tamanoPreset: '60x40',
  ancho: 60,
  alto: 40,
  plantilla: 'labelife-texto',
  impresora: '',
  tipoCodigo: 'barras',
  barcodeAncho: 2,
  barcodeAlto: 60,
  qrTamano: 120,
  fontSize: {
    empresa: 8,
    producto: 11,
    marca: 8,
    especificaciones: 8,
    codigo: 9,
    precio: 14,
    detalle: 10
  },
  mostrarNombreEmpresa: true,
  mostrarProducto: true,
  mostrarMarca: true,
  mostrarEspecificaciones: true,
  mostrarCodigoGrafico: true,
  mostrarCodigoTexto: true,
  mostrarPrecio: true,
  mostrarColor: true,
  mostrarImei: true,
  mostrarCodigoProducto: true,
  margenSuperior: 6,
  margenInferior: 4,
  margenIzquierdo: 4,
  margenDerecho: 4,
  separacionEmpresaCodigo: 0,
  separacionCodigoTexto: 0,
  cantidad: 1,
  previewZoom: 2,
  layout: crearLayoutDefault(),
  contentOverrides: {},
  manualLines: []
}

const configuracion = ref({ ...configuracionDefault })
const ETIQUETAS_TABLE = 'etiquetas'
const ETIQUETAS_FIELDS = ['nombre', 'configuracion', 'created_at', 'updated_at']
const FORMATO_ETIQUETA_DEFAULT = 'default'

const timestampActual = () => new Date().toISOString()
const duplicarConfiguracion = (config = configuracion.value) => JSON.parse(JSON.stringify(config))
const normalizarNombreFormato = (valor) => (valor || '').toString().trim()
const formatearFechaFormato = (fecha) => {
  if (!fecha) return 'Sin fecha'
  const parsed = new Date(fecha)
  if (Number.isNaN(parsed.getTime())) return fecha
  return parsed.toLocaleString()
}

const normalizarConfiguracionGuardada = (configGuardada = {}, impresoraFallback = '') => ({
  ...configuracionDefault,
  ...configGuardada,
  impresora: configGuardada.impresora || impresoraFallback || configuracionDefault.impresora,
  fontSize: {
    ...configuracionDefault.fontSize,
    ...(configGuardada.fontSize || {})
  },
  contentOverrides: {
    ...(configGuardada.contentOverrides || {})
  },
  previewZoom: Number(configGuardada.previewZoom) || configuracionDefault.previewZoom,
  layout: {
    ...crearLayoutDefault(),
    ...(configGuardada.layout || {})
  },
  manualLines: Array.isArray(configGuardada.manualLines)
    ? configGuardada.manualLines.map((linea, indice) => crearLineaManual(indice, linea))
    : []
})

const asegurarTablaEtiquetas = async (impresoraFallback = '') => {
  const existeTabla = await peticionesFetchOffline('tableExists', ETIQUETAS_TABLE)
  if (!Array.isArray(existeTabla) || existeTabla[0] !== 'ok') {
    await peticionesFetchOffline('crearTabla', ETIQUETAS_TABLE, ETIQUETAS_FIELDS.join(','))
  }

  const columnas = await peticionesFetchOffline('getTableColumns', ETIQUETAS_TABLE)
  const columnasActuales = Array.isArray(columnas) ? columnas : []

  for (const campo of ETIQUETAS_FIELDS) {
    if (!columnasActuales.includes(campo)) {
      await peticionesFetchOffline('addColumnToTable', ETIQUETAS_TABLE, campo)
    }
  }

  const registros = await peticionesFetchOffline('getDataAsArray', ETIQUETAS_TABLE)
  if (!Array.isArray(registros) || registros.length === 0) {
    const ahora = timestampActual()
    const configuracionInicial = normalizarConfiguracionGuardada({}, impresoraFallback)
    await peticionesFetchOffline(
      'insertData',
      ETIQUETAS_TABLE,
      JSON.stringify({
        nombre: FORMATO_ETIQUETA_DEFAULT,
        configuracion: JSON.stringify(configuracionInicial),
        created_at: ahora,
        updated_at: ahora
      })
    )
  }
}

const ordenarFormatosGuardados = (registros = []) => {
  return [...registros].sort((a, b) => {
    if (a.nombre === FORMATO_ETIQUETA_DEFAULT) return -1
    if (b.nombre === FORMATO_ETIQUETA_DEFAULT) return 1
    return new Date(b.updated_at || 0).getTime() - new Date(a.updated_at || 0).getTime()
  })
}

const formatosFiltrados = computed(() => {
  const query = busquedaFormato.value.trim().toLowerCase()
  if (!query) return formatosGuardados.value

  return formatosGuardados.value.filter((formato) =>
    String(formato.nombre || '').toLowerCase().includes(query)
  )
})

const cargarFormatosEtiquetas = async (impresoraFallback = '') => {
  await asegurarTablaEtiquetas(impresoraFallback)

  const registros = await peticionesFetchOffline('getDataAsArray', ETIQUETAS_TABLE)
  formatosGuardados.value = Array.isArray(registros) ? ordenarFormatosGuardados(registros) : []
}

const aplicarFormatoGuardado = async (registro, opciones = {}) => {
  const { impresoraFallback = '', mostrarToast = false } = opciones
  if (!registro) return

  let configGuardada = {}

  try {
    configGuardada = registro.configuracion ? JSON.parse(registro.configuracion) : {}
  } catch (error) {
    console.error('Error al parsear configuración de etiquetas:', error)
  }

  configuracion.value = normalizarConfiguracionGuardada(configGuardada, impresoraFallback)
  formatoSeleccionadoId.value = registro.id

  if (mostrarToast) {
    toast.add({
      severity: 'success',
      summary: 'Formato cargado',
      detail: `Se cargó el formato "${registro.nombre}".`,
      life: 2500
    })
  }
}

const cargarConfiguracionEtiquetas = async (impresoraFallback = '') => {
  await cargarFormatosEtiquetas(impresoraFallback)
  if (!formatosGuardados.value.length) return

  const formatoActivo =
    formatosGuardados.value.find((item) => item.id === formatoSeleccionadoId.value) ||
    formatosGuardados.value.find((item) => item.nombre === FORMATO_ETIQUETA_DEFAULT) ||
    formatosGuardados.value[0]

  await aplicarFormatoGuardado(formatoActivo, { impresoraFallback })
}

const guardarConfiguracionEtiquetas = async () => {
  try {
    await asegurarTablaEtiquetas(configuracion.value.impresora || '')

    const registros = await peticionesFetchOffline('getDataAsArray', ETIQUETAS_TABLE)
    if (!Array.isArray(registros) || registros.length === 0) {
      throw new Error('No hay registro base en la tabla etiquetas')
    }

    const registro =
      registros.find((item) => item.id === formatoSeleccionadoId.value) ||
      registros.find((item) => item.nombre === FORMATO_ETIQUETA_DEFAULT) ||
      registros[0]
    const ahora = timestampActual()
    const datosActualizar = {
      ...registro,
      nombre: registro.nombre || FORMATO_ETIQUETA_DEFAULT,
      configuracion: JSON.stringify(duplicarConfiguracion()),
      updated_at: ahora
    }

    const respuesta = await peticionesFetchOffline('updateData', ETIQUETAS_TABLE, JSON.stringify(datosActualizar))

    if (Array.isArray(respuesta) && respuesta[0] === 'ok') {
      await cargarFormatosEtiquetas(configuracion.value.impresora || '')
      formatoSeleccionadoId.value = registro.id
      toast.add({
        severity: 'success',
        summary: 'Configuración guardada',
        detail: `El formato "${registro.nombre || FORMATO_ETIQUETA_DEFAULT}" fue guardado correctamente`,
        life: 3000
      })
      return
    }

    throw new Error('No se pudo guardar la configuración')
  } catch (error) {
    console.error('Error guardando configuración de etiquetas:', error)
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'No se pudo guardar la configuración de etiquetas',
      life: 3000
    })
  }
}

// Tamaños disponibles de etiquetas
const tamanosDisponibles = [
  { label: '50.8mm x 25.4mm (2" x 1")', value: '50.8x25.4', ancho: 50.8, alto: 25.4 },
  { label: '50mm x 30mm (Pequeña)', value: '50x30', ancho: 50, alto: 30 },
  { label: '60mm x 40mm (Mediana)', value: '60x40', ancho: 60, alto: 40 },
  { label: '80mm x 50mm (Grande)', value: '80x50', ancho: 80, alto: 50 },
  { label: '100mm x 60mm (Extra Grande)', value: '100x60', ancho: 100, alto: 60 },
  { label: '100mm x 100mm (Cuadrada)', value: '100x100', ancho: 100, alto: 100 }
]

const plantillasDisponibles = [
  { label: 'Texto tipo Labelife', value: 'labelife-texto' },
  { label: 'Etiqueta con código', value: 'codigo-estandar' }
]

// Tipos de código
const tiposCodigo = [
  { label: 'Código de Barras', value: 'barras' },
  { label: 'Código QR', value: 'qr' }
]

const alineacionesTexto = [
  { label: 'Izq', value: 'left' },
  { label: 'Centro', value: 'center' },
  { label: 'Der', value: 'right' }
]

const tiposLineaManual = [
  { label: 'Texto libre', value: 'custom' },
  { label: 'Empresa', value: 'empresa' },
  { label: 'Producto', value: 'producto' },
  { label: 'Capacidad', value: 'capacidad' },
  { label: 'Color', value: 'color' },
  { label: 'Código', value: 'codigo' },
  { label: 'Precio', value: 'precio' },
  { label: 'Marca y modelo', value: 'marca' },
  { label: 'Especificaciones', value: 'especificaciones' }
]

const patronesManuales = [
  { label: 'Empresa + Capacidad + Color + Código', value: 'empresa-capacidad-color-codigo' },
  { label: 'Empresa + Producto + Precio + Código', value: 'empresa-producto-precio-codigo' },
  { label: 'Producto + Capacidad + Color + Precio', value: 'producto-capacidad-color-precio' }
]

// Computed: Convertir mm a píxeles (aproximadamente 3.78 px por mm)
const pixelesAncho = computed(() => Math.round(configuracion.value.ancho * 3.78))
const pixelesAlto = computed(() => Math.round(configuracion.value.alto * 3.78))
const totalEtiquetasLista = computed(() =>
  listaEtiquetas.value.reduce((total, item) => total + (Number(item.cantidad) || 0), 0)
)
const tieneContenidoVistaPrevia = computed(() =>
  Boolean(productoSeleccionado.value) || configuracion.value.manualLines.length > 0
)
const dragState = ref({
  activo: false,
  bloque: null,
  pointerId: null,
  offsetX: 0,
  offsetY: 0,
  anchoBloque: 0,
  altoBloque: 0
})
const menuBloque = ref({
  visible: false,
  x: 0,
  y: 0,
  bloque: null
})
const editorBloque = ref({
  visible: false,
  bloque: null,
  manual: false,
  linea: null,
  titulo: '',
  fontKey: null,
  contentType: null,
  contentKey: null
})

// Computed: Estilo dinámico de la etiqueta
const estiloEtiqueta = computed(() => ({
  width: `${pixelesAncho.value}px`,
  height: `${pixelesAlto.value}px`,
  paddingTop: `${configuracion.value.padding + configuracion.value.margenSuperior}px`,
  paddingRight: `${configuracion.value.padding + configuracion.value.margenDerecho}px`,
  paddingBottom: `${configuracion.value.padding + configuracion.value.margenInferior}px`,
  paddingLeft: `${configuracion.value.padding + configuracion.value.margenIzquierdo}px`,
  position: 'relative'
}))

const estiloEtiquetaPreview = computed(() => ({
  ...estiloEtiqueta.value,
  width: `${Math.round(pixelesAncho.value * configuracion.value.previewZoom)}px`,
  height: `${Math.round(pixelesAlto.value * configuracion.value.previewZoom)}px`
}))

const limitarValor = (valor, minimo, maximo) => Math.min(Math.max(valor, minimo), maximo)
const BLOQUE_MANUAL_PREFIX = 'manual:'
const esBloqueManual = (bloque) => typeof bloque === 'string' && bloque.startsWith(BLOQUE_MANUAL_PREFIX)
const obtenerIdLineaManual = (bloque) => bloque.replace(BLOQUE_MANUAL_PREFIX, '')
const obtenerLineaManual = (id) => configuracion.value.manualLines.find(linea => linea.id === id)
const obtenerPuntoEvento = (event) => {
  if (event?.touches?.length) {
    return event.touches[0]
  }

  if (event?.changedTouches?.length) {
    return event.changedTouches[0]
  }

  return event
}

const obtenerLayoutBloque = (bloque) => ({
  ...crearLayoutDefault()[bloque],
  ...(configuracion.value.layout?.[bloque] || {})
})

const estiloBloque = (bloque, adicionales = {}) => {
  const layout = obtenerLayoutBloque(bloque)
  return {
    position: 'absolute',
    top: `${layout.top}%`,
    left: `${layout.left}%`,
    width: `${layout.width}%`,
    ...adicionales
  }
}

const estiloLineaManual = (linea) => ({
  position: 'absolute',
  top: `${linea.top}%`,
  left: `${linea.left}%`,
  width: `${linea.width}%`,
  fontSize: `${linea.fontSize}px`,
  fontWeight: linea.bold ? '700' : '400',
  textAlign: linea.align || 'center'
})

const obtenerValorLineaCodigo = (linea) => (linea?.valorCodigo || '').toString().trim()

const obtenerOverrideContenido = (clave) => {
  return (configuracion.value.contentOverrides?.[clave] || '').toString()
}

const obtenerTextoLineaManual = (linea) => {
  switch (linea.tipo) {
    case 'empresa':
      return datosEmpresa.value?.nombre || ''
    case 'producto':
      return productoSeleccionado.value?.nombre || ''
    case 'capacidad':
      return imeiSeleccionado.value?.capacidad || productoSeleccionado.value?.capacidad || ''
    case 'color':
      return imeiSeleccionado.value?.color ||
        productoSeleccionado.value?.color ||
        productoSeleccionado.value?.color_nombre ||
        productoSeleccionado.value?.tono ||
        ''
    case 'codigo':
      return obtenerValorLineaCodigo(linea)
    case 'precio':
      return productoSeleccionado.value ? formatearPrecio(obtenerPrecioFinal()) : ''
    case 'marca': {
      if (!productoSeleccionado.value) return ''
      return [productoSeleccionado.value.marca, productoSeleccionado.value.modelo].filter(Boolean).join(' ')
    }
    case 'especificaciones':
      if (
        !productoSeleccionado.value ||
        productoSeleccionado.value.categoria !== 'CELULARES' ||
        !imeiSeleccionado.value
      ) {
        return ''
      }
      return [imeiSeleccionado.value.capacidad, `Batería ${imeiSeleccionado.value.bateria}%`]
        .filter(Boolean)
        .join(' | ')
    case 'custom':
    default:
      return linea.texto || ''
  }
}

const obtenerColorEtiqueta = (producto = productoSeleccionado.value, imei = imeiSeleccionado.value) => {
  const override = obtenerOverrideContenido('color')
  if (override) return override
  if (imei?.color) return imei.color
  if (producto?.color) return producto.color
  if (producto?.color_nombre) return producto.color_nombre
  if (producto?.tono) return producto.tono
  return ''
}

const obtenerTextoEmpresaEtiqueta = () => {
  return obtenerOverrideContenido('empresa') || datosEmpresa.value?.nombre || ''
}

const obtenerTextoProductoEtiqueta = (producto = productoSeleccionado.value) => {
  return obtenerOverrideContenido('producto') || producto?.nombre || ''
}

const obtenerTextoMarcaEtiqueta = (producto = productoSeleccionado.value) => {
  const override = obtenerOverrideContenido('marca')
  if (override) return override
  if (!producto) return ''
  return [producto.marca, producto.modelo].filter(Boolean).join(' ')
}

const obtenerTextoCodigoEtiqueta = (producto = productoSeleccionado.value, imei = imeiSeleccionado.value) => {
  return obtenerOverrideContenido('codigoTexto') || obtenerCodigoParaEtiqueta(producto, imei)
}

const obtenerTextoEspecificacionesEtiqueta = (producto = productoSeleccionado.value, imei = imeiSeleccionado.value) => {
  const override = obtenerOverrideContenido('especificaciones')
  if (override) return override

  if (!producto || producto.categoria !== 'CELULARES' || !imei) {
    return ''
  }

  return [imei.capacidad, imei.bateria ? `Batería ${imei.bateria}%` : '']
    .filter(Boolean)
    .join(' | ')
}

const obtenerImeiEtiqueta = (producto = productoSeleccionado.value, imei = imeiSeleccionado.value) => {
  const override = obtenerOverrideContenido('imei')
  return override || imei?.imei || producto?.imei || ''
}

const obtenerCodigoProductoTexto = (producto = productoSeleccionado.value) => {
  const override = obtenerOverrideContenido('codigoProducto')
  return override || producto?.codigo || producto?.codigo_barra || ''
}

const actualizarPosicionBloque = (bloque, top, left) => {
  if (esBloqueManual(bloque)) {
    const lineaId = obtenerIdLineaManual(bloque)
    configuracion.value.manualLines = configuracion.value.manualLines.map(linea =>
      linea.id === lineaId
        ? {
            ...linea,
            top: limitarValor(top, 0, 96),
            left: limitarValor(left, 0, Math.max(0, 100 - linea.width))
          }
        : linea
    )
    return
  }

  const layoutActual = obtenerLayoutBloque(bloque)
  configuracion.value.layout = {
    ...configuracion.value.layout,
    [bloque]: {
      ...layoutActual,
      top: limitarValor(top, 0, 96),
      left: limitarValor(left, 0, Math.max(0, 100 - layoutActual.width))
    }
  }
}

const iniciarArrastre = (event, bloque) => {
  if (!etiquetaRef.value) return

  const punto = obtenerPuntoEvento(event)
  if (!punto) return

  const contenedor = etiquetaRef.value.getBoundingClientRect()
  const layout = esBloqueManual(bloque)
    ? obtenerLineaManual(obtenerIdLineaManual(bloque))
    : obtenerLayoutBloque(bloque)

  if (!layout) return
  const topPx = (layout.top / 100) * contenedor.height
  const leftPx = (layout.left / 100) * contenedor.width

  dragState.value = {
    activo: true,
    bloque,
    pointerId: event?.pointerId ?? null,
    offsetX: punto.clientX - (contenedor.left + leftPx),
    offsetY: punto.clientY - (contenedor.top + topPx),
    anchoBloque: (layout.width / 100) * contenedor.width,
    altoBloque: event.currentTarget?.getBoundingClientRect().height || 0
  }

  if (event?.pointerId != null) {
    event.currentTarget?.setPointerCapture?.(event.pointerId)
  }
  event.preventDefault()
}

const moverBloque = (event) => {
  if (!dragState.value.activo || !etiquetaRef.value) return
  if (event?.pointerId != null && dragState.value.pointerId != null && dragState.value.pointerId !== event.pointerId) return

  const punto = obtenerPuntoEvento(event)
  if (!punto) return

  const contenedor = etiquetaRef.value.getBoundingClientRect()
  const leftPx = limitarValor(
    punto.clientX - contenedor.left - dragState.value.offsetX,
    0,
    Math.max(0, contenedor.width - dragState.value.anchoBloque)
  )
  const topPx = limitarValor(
    punto.clientY - contenedor.top - dragState.value.offsetY,
    0,
    Math.max(0, contenedor.height - dragState.value.altoBloque)
  )

  actualizarPosicionBloque(
    dragState.value.bloque,
    contenedor.height ? (topPx / contenedor.height) * 100 : 0,
    contenedor.width ? (leftPx / contenedor.width) * 100 : 0
  )
}

const terminarArrastre = (event) => {
  if (!dragState.value.activo) return
  if (event?.pointerId != null && dragState.value.pointerId != null && dragState.value.pointerId !== event.pointerId) return

  dragState.value = {
    activo: false,
    bloque: null,
    pointerId: null,
    offsetX: 0,
    offsetY: 0,
    anchoBloque: 0,
    altoBloque: 0
  }
}

const agregarLineaManual = () => {
  configuracion.value.manualLines = [
    ...configuracion.value.manualLines,
    crearLineaManual(configuracion.value.manualLines.length, { texto: 'Nuevo texto' })
  ]
}

const eliminarLineaManual = (id) => {
  configuracion.value.manualLines = configuracion.value.manualLines.filter(linea => linea.id !== id)
  if (editorBloque.value.bloque === `${BLOQUE_MANUAL_PREFIX}${id}`) {
    cerrarEditorBloque()
  }
}

const fuentesPorBloque = {
  empresa: 'empresa',
  codigoTexto: 'codigo',
  producto: 'producto',
  marca: 'marca',
  color: 'detalle',
  imei: 'detalle',
  codigoProducto: 'detalle',
  especificaciones: 'especificaciones',
  precio: 'precio'
}

const titulosPorBloque = {
  empresa: 'Editar empresa',
  codigo: 'Editar código gráfico',
  codigoTexto: 'Editar código en texto',
  producto: 'Editar producto',
  marca: 'Editar marca y modelo',
  color: 'Editar color',
  imei: 'Editar IMEI',
  codigoProducto: 'Editar código de producto',
  especificaciones: 'Editar especificaciones',
  precio: 'Editar precio'
}

const contenidoPorBloque = {
  empresa: { type: 'text', key: 'empresa' },
  codigo: { type: 'code', key: 'codigo' },
  codigoTexto: { type: 'text', key: 'codigoTexto' },
  producto: { type: 'text', key: 'producto' },
  marca: { type: 'text', key: 'marca' },
  color: { type: 'text', key: 'color' },
  imei: { type: 'text', key: 'imei' },
  codigoProducto: { type: 'text', key: 'codigoProducto' },
  especificaciones: { type: 'text', key: 'especificaciones' },
  precio: { type: 'text', key: 'precio' }
}

const cerrarMenuBloque = () => {
  menuBloque.value = {
    visible: false,
    x: 0,
    y: 0,
    bloque: null
  }
}

const abrirMenuBloque = (event, bloque) => {
  menuBloque.value = {
    visible: true,
    x: event.clientX,
    y: event.clientY,
    bloque
  }
}

const cerrarEditorBloque = () => {
  editorBloque.value = {
    visible: false,
    bloque: null,
    manual: false,
    linea: null,
    titulo: '',
    fontKey: null,
    contentType: null,
    contentKey: null
  }
}

const actualizarWidthBloque = (bloque, valor) => {
  const width = limitarValor(Number(valor) || 20, 20, 100)
  const layoutActual = obtenerLayoutBloque(bloque)
  configuracion.value.layout = {
    ...configuracion.value.layout,
    [bloque]: {
      ...layoutActual,
      width,
      left: limitarValor(layoutActual.left, 0, Math.max(0, 100 - width))
    }
  }
}

const editarBloque = (bloque) => {
  if (!bloque) return

  if (esBloqueManual(bloque)) {
    const linea = obtenerLineaManual(obtenerIdLineaManual(bloque))
    if (!linea) return

  editorBloque.value = {
    visible: true,
    bloque,
    manual: true,
    linea,
    titulo: 'Editar línea manual',
    fontKey: null,
    contentType: linea.tipo === 'codigo' ? 'code' : 'text',
    contentKey: null
  }
  return
}

  const contenidoConfig = contenidoPorBloque[bloque] || { type: null, key: null }
  editorBloque.value = {
    visible: true,
    bloque,
    manual: false,
    linea: null,
    titulo: titulosPorBloque[bloque] || 'Editar bloque',
    fontKey: fuentesPorBloque[bloque] || null,
    contentType: contenidoConfig.type,
    contentKey: contenidoConfig.key
  }
}

const quitarBloque = (bloque) => {
  if (!bloque) return

  if (esBloqueManual(bloque)) {
    eliminarLineaManual(obtenerIdLineaManual(bloque))
    if (editorBloque.value.bloque === bloque) {
      cerrarEditorBloque()
    }
    return
  }

  const togglesPorBloque = {
    empresa: 'mostrarNombreEmpresa',
    codigo: 'mostrarCodigoGrafico',
    codigoTexto: 'mostrarCodigoTexto',
    producto: 'mostrarProducto',
    marca: 'mostrarMarca',
    color: 'mostrarColor',
    imei: 'mostrarImei',
    codigoProducto: 'mostrarCodigoProducto',
    especificaciones: 'mostrarEspecificaciones',
    precio: 'mostrarPrecio'
  }

  const campoToggle = togglesPorBloque[bloque]
  if (campoToggle) {
    configuracion.value[campoToggle] = false
  }
}

const quitarBloqueSeleccionado = () => {
  quitarBloque(menuBloque.value.bloque)
  cerrarMenuBloque()
}

const editarBloqueSeleccionado = () => {
  editarBloque(menuBloque.value.bloque)
  cerrarMenuBloque()
}

const limpiarEtiqueta = () => {
  configuracion.value.manualLines = []
  configuracion.value.mostrarNombreEmpresa = false
  configuracion.value.mostrarProducto = false
  configuracion.value.mostrarMarca = false
  configuracion.value.mostrarEspecificaciones = false
  configuracion.value.mostrarCodigoGrafico = false
  configuracion.value.mostrarCodigoTexto = false
  configuracion.value.mostrarPrecio = false
  configuracion.value.mostrarColor = false
  configuracion.value.mostrarImei = false
  configuracion.value.mostrarCodigoProducto = false
  cerrarEditorBloque()
  cerrarMenuBloque()

  toast.add({
    severity: 'info',
    summary: 'Etiqueta limpia',
    detail: 'Se quitaron los elementos de la etiqueta',
    life: 2500
  })
}

const actualizarContenidoBloque = (clave, valor) => {
  configuracion.value.contentOverrides = {
    ...configuracion.value.contentOverrides,
    [clave]: valor || ''
  }

  if (clave === 'codigo') {
    nextTick(() => {
      generarCodigo()
    })
  }
}

const guardarComoNuevoFormato = async () => {
  const { value } = await Swal.fire({
    title: 'Guardar formato de etiqueta',
    input: 'text',
    inputLabel: 'Nombre del formato',
    inputPlaceholder: 'Ejemplo: Label iPhone 2x1',
    showCancelButton: true,
    confirmButtonText: 'Guardar',
    cancelButtonText: 'Cancelar',
    inputValidator: (input) => {
      const nombre = normalizarNombreFormato(input)
      if (!nombre) return 'Debe indicar un nombre.'
      const existe = formatosGuardados.value.some((formato) => normalizarNombreFormato(formato.nombre).toLowerCase() === nombre.toLowerCase())
      if (existe) return 'Ya existe un formato con ese nombre.'
      return null
    }
  })

  const nombre = normalizarNombreFormato(value)
  if (!nombre) return

  try {
    await asegurarTablaEtiquetas(configuracion.value.impresora || '')
    const ahora = timestampActual()
    const respuesta = await peticionesFetchOffline(
      'insertData',
      ETIQUETAS_TABLE,
      JSON.stringify({
        nombre,
        configuracion: JSON.stringify(duplicarConfiguracion()),
        created_at: ahora,
        updated_at: ahora
      })
    )

    if (Array.isArray(respuesta) && respuesta[0] === 'ok') {
      await cargarFormatosEtiquetas(configuracion.value.impresora || '')
      const nuevoFormato = formatosGuardados.value.find((item) => item.nombre === nombre)
      if (nuevoFormato) {
        formatoSeleccionadoId.value = nuevoFormato.id
      }
      toast.add({
        severity: 'success',
        summary: 'Formato guardado',
        detail: `Se guardó el formato "${nombre}".`,
        life: 3000
      })
      return
    }

    throw new Error('No se pudo guardar el formato')
  } catch (error) {
    console.error('Error guardando formato de etiqueta:', error)
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'No se pudo guardar el formato de etiqueta',
      life: 3000
    })
  }
}

const eliminarFormatoGuardado = async (formato) => {
  if (!formato?.id) return
  if (formato.nombre === FORMATO_ETIQUETA_DEFAULT) {
    toast.add({
      severity: 'warn',
      summary: 'Formato protegido',
      detail: 'El formato base no se puede eliminar.',
      life: 3000
    })
    return
  }

  const confirmacion = await Swal.fire({
    title: 'Eliminar formato',
    text: `Se eliminará el formato "${formato.nombre}".`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Eliminar',
    cancelButtonText: 'Cancelar'
  })

  if (!confirmacion.isConfirmed) return

  try {
    const respuesta = await peticionesFetchOffline('deleteEntry', ETIQUETAS_TABLE, formato.id)
    if (Array.isArray(respuesta) && respuesta[0] === 'ok') {
      const eraActivo = formatoSeleccionadoId.value === formato.id
      await cargarFormatosEtiquetas(configuracion.value.impresora || '')
      if (eraActivo) {
        const fallback =
          formatosGuardados.value.find((item) => item.nombre === FORMATO_ETIQUETA_DEFAULT) ||
          formatosGuardados.value[0]
        if (fallback) {
          await aplicarFormatoGuardado(fallback, {
            impresoraFallback: configuracion.value.impresora || '',
            mostrarToast: false
          })
        }
      }
      toast.add({
        severity: 'success',
        summary: 'Formato eliminado',
        detail: `Se eliminó el formato "${formato.nombre}".`,
        life: 3000
      })
      return
    }

    throw new Error('No se pudo eliminar el formato')
  } catch (error) {
    console.error('Error eliminando formato de etiqueta:', error)
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'No se pudo eliminar el formato de etiqueta',
      life: 3000
    })
  }
}

const crearPatronLineas = (patron) => {
  switch (patron) {
    case 'empresa-producto-precio-codigo':
      return [
        crearLineaManual(0, { tipo: 'empresa', top: 6, left: 8, width: 84, fontSize: 12, bold: true }),
        crearLineaManual(1, { tipo: 'producto', top: 20, left: 8, width: 84, fontSize: 13, bold: true }),
        crearLineaManual(2, { tipo: 'precio', top: 40, left: 15, width: 70, fontSize: 15, bold: true }),
        crearLineaManual(3, { tipo: 'codigo', valorCodigo: productoSeleccionado.value ? obtenerCodigoParaEtiqueta() : '', top: 58, left: 10, width: 80, fontSize: 10 })
      ]
    case 'producto-capacidad-color-precio':
      return [
        crearLineaManual(0, { tipo: 'producto', top: 8, left: 6, width: 88, fontSize: 13, bold: true }),
        crearLineaManual(1, { tipo: 'capacidad', top: 26, left: 10, width: 36, fontSize: 11, bold: true }),
        crearLineaManual(2, { tipo: 'color', top: 26, left: 54, width: 36, fontSize: 11, bold: true }),
        crearLineaManual(3, { tipo: 'precio', top: 48, left: 18, width: 64, fontSize: 16, bold: true })
      ]
    case 'empresa-capacidad-color-codigo':
    default:
      return [
        crearLineaManual(0, { tipo: 'empresa', top: 6, left: 8, width: 84, fontSize: 12, bold: true }),
        crearLineaManual(1, { tipo: 'capacidad', top: 24, left: 10, width: 36, fontSize: 11, bold: true }),
        crearLineaManual(2, { tipo: 'color', top: 24, left: 54, width: 36, fontSize: 11, bold: true }),
        crearLineaManual(3, { tipo: 'codigo', valorCodigo: productoSeleccionado.value ? obtenerCodigoParaEtiqueta() : '', top: 42, left: 10, width: 80, fontSize: 10 })
      ]
  }
}

const aplicarPatronManual = () => {
  configuracion.value.manualLines = crearPatronLineas(patronManualSeleccionado.value)
  toast.add({
    severity: 'success',
    summary: 'Patrón aplicado',
    detail: 'Se cargó el patrón de líneas manuales',
    life: 2500
  })
}

const normalizarTexto = (valor) => (valor || '').toString().trim().toLowerCase()

const obtenerTextosProducto = (producto) => {
  return [
    producto.nombre,
    producto.descripcion,
    producto.codigo,
    producto.codigo_barra,
    producto.codigo_interno,
    producto.nombre_comercial
  ]
    .filter(Boolean)
    .map(normalizarTexto)
}

const actualizarListaBuscador = () => {
  const sugerencias = new Set()

  dataProductos.value.forEach(producto => {
    const nombre = producto.nombre || producto.nombre_comercial || 'Producto sin nombre'
    const codigo = producto.codigo || producto.codigo_barra || producto.codigo_interno || ''
    const codigoBarra = producto.codigo_barra || ''

    sugerencias.add(nombre)

    if (codigo) {
      sugerencias.add(codigo)
      sugerencias.add(`${codigo} - ${nombre}`)
    }

    if (codigoBarra && codigoBarra !== codigo) {
      sugerencias.add(codigoBarra)
      sugerencias.add(`${codigoBarra} - ${nombre}`)
    }
  })

  dataIMEIs.value.forEach(imei => {
    if (!imei.imei) return

    const producto = dataProductos.value.find(prod =>
      prod.codigo_barra === imei.codigo_barra ||
      prod.codigo === imei.codigo_barra ||
      String(prod.id || '') === String(imei.id_equi || '')
    )

    const nombreProducto = producto?.nombre || producto?.nombre_comercial || imei.equipo || 'Producto'
    sugerencias.add(imei.imei)
    sugerencias.add(`${imei.imei} - ${nombreProducto}`)
  })

  listaBuscador.value = Array.from(sugerencias)
}

const cargarDatosBuscador = async () => {
  const [productos, imeis] = await Promise.all([
    peticionesFetchOffline('getDataAsArray', 'productos'),
    peticionesFetchOffline('getDataAsArray', 'imei')
  ])

  dataProductos.value = Array.isArray(productos) ? productos : []
  dataIMEIs.value = Array.isArray(imeis) ? imeis : []
  actualizarListaBuscador()
}

const buscarProductoPorTermino = (terminoBusqueda) => {
  const termino = normalizarTexto(terminoBusqueda)
  const terminoBase = termino.split(' - ')[0]

  if (!termino) {
    return { producto: null, imei: null, multiples: [] }
  }

  const productoExacto = dataProductos.value.find(producto => {
    return [
      producto.codigo,
      producto.codigo_barra,
      producto.codigo_interno,
      producto.nombre,
      producto.nombre_comercial
    ]
      .filter(Boolean)
      .some(valor => {
        const valorNormalizado = normalizarTexto(valor)
        return valorNormalizado === termino || valorNormalizado === terminoBase
      })
  })

  if (productoExacto) {
    return { producto: productoExacto, imei: null, multiples: [] }
  }

  const imeiEncontrado = dataIMEIs.value.find(imei => {
    const imeiNormalizado = normalizarTexto(imei.imei)
    return imeiNormalizado === termino || imeiNormalizado === terminoBase
  })
  if (imeiEncontrado) {
    const productoPorImei = dataProductos.value.find(producto =>
      producto.codigo_barra === imeiEncontrado.codigo_barra ||
      producto.codigo === imeiEncontrado.codigo_barra ||
      String(producto.id || '') === String(imeiEncontrado.id_equi || '')
    )

    if (productoPorImei) {
      return { producto: productoPorImei, imei: imeiEncontrado, multiples: [] }
    }
  }

  const productosParciales = dataProductos.value.filter(producto =>
    obtenerTextosProducto(producto).some(texto => texto.includes(termino) || texto.includes(terminoBase))
  )

  if (productosParciales.length === 1) {
    return { producto: productosParciales[0], imei: null, multiples: [] }
  }

  return { producto: null, imei: null, multiples: productosParciales }
}

const seleccionarProducto = async (producto, imeiPreferido = null) => {
  productoSeleccionado.value = producto
  busqueda.value = producto.nombre || producto.nombre_comercial || producto.codigo || ''

  await cargarIMEIs()

  if (imeiPreferido) {
    const imeiNormalizado = normalizarTexto(imeiPreferido.imei)
    const imeiEnLista = imeisDisponibles.value.find(imei => normalizarTexto(imei.imei) === imeiNormalizado)

    if (imeiEnLista) {
      imeiSeleccionado.value = imeiEnLista
      busqueda.value = imeiEnLista.imei
    }
  }

  await generarCodigo()
}

// Funciones
const formatearPrecio = (precio) => {
  return new Intl.NumberFormat('es-DO', {
    style: 'currency',
    currency: 'DOP'
  }).format(precio || 0)
}

const obtenerTextoPrecioEtiqueta = (producto = productoSeleccionado.value, imei = imeiSeleccionado.value) => {
  const override = obtenerOverrideContenido('precio')
  if (override) {
    return override
  }

  return formatearPrecio(obtenerPrecioFinal(producto, imei))
}

const obtenerTextoEtiquetaImpresion = () => {
  if (!productoSeleccionado.value) return ''

  const partes = [productoSeleccionado.value.nombre]

  if (configuracion.value.mostrarMarca) {
    const marcaModelo = [productoSeleccionado.value.marca, productoSeleccionado.value.modelo]
      .filter(Boolean)
      .join(' ')

    if (marcaModelo) {
      partes.push(marcaModelo)
    }
  }

  if (
    configuracion.value.mostrarEspecificaciones &&
    productoSeleccionado.value.categoria === 'CELULARES' &&
    imeiSeleccionado.value
  ) {
    const especificaciones = [imeiSeleccionado.value.capacidad, `Batería ${imeiSeleccionado.value.bateria}%`]
      .filter(Boolean)
      .join(' | ')

    if (especificaciones) {
      partes.push(especificaciones)
    }
  }

  return partes.join('<br>')
}


const obtenerCodigoParaEtiqueta = (producto = productoSeleccionado.value, imei = imeiSeleccionado.value) => {
  const override = obtenerOverrideContenido('codigo')
  if (override) {
    return override
  }

  if (!producto) {
    return ''
  }

  if (producto.categoria === 'CELULARES' && imei) {
    return imei.imei
  }
  return producto.codigo_barra || producto.codigo
}

const obtenerPrecioFinal = (producto = productoSeleccionado.value, imei = imeiSeleccionado.value) => {
  const override = obtenerOverrideContenido('precio')
  if (override) {
    return override
  }

  if (!producto) {
    return 0
  }

  if (producto.categoria === 'CELULARES' && imei) {
    return imei.precio_venta || imei.precio
  }
  return producto.precio_venta
}

const obtenerCodigoParaItem = (producto, imei = null) => {
  if (producto?.categoria === 'CELULARES' && imei) {
    return imei.imei
  }

  return producto?.codigo_barra || producto?.codigo || ''
}

const obtenerPrecioItem = (producto, imei = null) => {
  if (producto?.categoria === 'CELULARES' && imei) {
    return imei.precio_venta || imei.precio
  }

  return producto?.precio_venta || 0
}

const generarIdLista = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

const agregarProductoALista = () => {
  if (!productoSeleccionado.value) {
    toast.add({
      severity: 'warn',
      summary: 'Sin producto',
      detail: 'Selecciona un producto antes de agregarlo a la lista',
      life: 3000
    })
    return
  }

  if (productoSeleccionado.value.categoria === 'CELULARES' && !imeiSeleccionado.value) {
    toast.add({
      severity: 'warn',
      summary: 'Sin IMEI',
      detail: 'Selecciona un IMEI antes de agregar este celular a la lista',
      life: 3000
    })
    return
  }

  const cantidad = Number(configuracion.value.cantidad) || 1
  const codigo = obtenerCodigoParaEtiqueta()
  const imeiActual = imeiSeleccionado.value ? { ...imeiSeleccionado.value } : null

  const itemExistente = listaEtiquetas.value.find(item =>
    item.producto.codigo === productoSeleccionado.value.codigo &&
    (item.imei?.imei || '') === (imeiActual?.imei || '')
  )

  if (itemExistente) {
    itemExistente.cantidad += cantidad
  } else {
    listaEtiquetas.value.push({
      id: generarIdLista(),
      producto: { ...productoSeleccionado.value },
      imei: imeiActual,
      codigo,
      cantidad
    })
  }

  toast.add({
    severity: 'success',
    summary: 'Agregado',
    detail: 'Producto agregado a la lista de impresión',
    life: 2000
  })
}

const eliminarProductoDeLista = (id) => {
  listaEtiquetas.value = listaEtiquetas.value.filter(item => item.id !== id)
}

const vaciarListaEtiquetas = () => {
  listaEtiquetas.value = []
}

const aplicarTamanoPreset = () => {
  const preset = tamanosDisponibles.find(t => t.value === configuracion.value.tamanoPreset)
  if (preset) {
    configuracion.value.ancho = preset.ancho
    configuracion.value.alto = preset.alto
  }
}

const aplicarPlantillaRapida = () => {
  if (configuracion.value.plantilla === 'labelife-texto') {
    configuracion.value = {
      ...configuracion.value,
      tamanoPreset: '50.8x25.4',
      ancho: 50.8,
      alto: 25.4,
      mostrarNombreEmpresa: false,
      mostrarProducto: true,
      mostrarMarca: false,
      mostrarEspecificaciones: false,
      mostrarCodigoGrafico: false,
      mostrarCodigoTexto: false,
      mostrarPrecio: true,
      mostrarColor: true,
      mostrarImei: true,
      mostrarCodigoProducto: true,
      tipoCodigo: 'barras',
      previewZoom: 4,
      layout: {
        ...configuracion.value.layout,
        producto: { top: 6, left: 4, width: 92 },
        precio: { top: 25, left: 10, width: 80 },
        color: { top: 45, left: 6, width: 88 },
        imei: { top: 60, left: 6, width: 88 },
        codigoProducto: { top: 78, left: 8, width: 84 }
      },
      fontSize: {
        ...configuracion.value.fontSize,
        producto: 19,
        precio: 22,
        detalle: 14
      }
    }
  } else {
    configuracion.value = {
      ...configuracion.value,
      mostrarNombreEmpresa: true,
      mostrarProducto: true,
      mostrarMarca: true,
      mostrarEspecificaciones: true,
      mostrarCodigoGrafico: true,
      mostrarCodigoTexto: true,
      mostrarPrecio: true,
      mostrarColor: false,
      mostrarImei: false,
      mostrarCodigoProducto: false
    }
  }

  nextTick(() => {
    regenerarCodigosManualesPreview()
    generarCodigo()
  })
}

const restaurarDefaults = () => {
  configuracion.value = normalizarConfiguracionGuardada(configuracionDefault)
  toast.add({
    severity: 'success',
    summary: 'Restaurado',
    detail: 'Configuración restaurada a valores por defecto',
    life: 3000
  })
  if (productoSeleccionado.value) {
    generarCodigo()
  }
}

const restaurarPosiciones = () => {
  configuracion.value.layout = crearLayoutDefault()
  toast.add({
    severity: 'success',
    summary: 'Posiciones restauradas',
    detail: 'Los bloques volvieron a su posición inicial',
    life: 2500
  })
}

const buscarProducto = async () => {
  if (!busqueda.value.trim()) {
    toast.add({
      severity: 'warn',
      summary: 'Búsqueda vacía',
      detail: 'Ingresa un término de búsqueda',
      life: 3000
    })
    return
  }

  try {
    if (dataProductos.value.length === 0) {
      await cargarDatosBuscador()
    }

    if (dataProductos.value.length === 0) {
      toast.add({
        severity: 'error',
        summary: 'Error',
        detail: 'No hay productos en el sistema',
        life: 3000
      })
      return
    }

    const terminoBusqueda = busqueda.value.trim()
    const resultado = buscarProductoPorTermino(terminoBusqueda)

    if (resultado.producto) {
      await seleccionarProducto(resultado.producto, resultado.imei)
      toast.add({
        severity: 'success',
        summary: 'Producto encontrado',
        detail: resultado.imei
          ? `Producto encontrado por IMEI: ${resultado.imei.imei}`
          : productoSeleccionado.value.nombre,
        life: 3000
      })
      return
    }

    if (resultado.multiples.length === 0) {
      toast.add({
        severity: 'error',
        summary: 'No encontrado',
        detail: 'No se encontraron productos con ese criterio',
        life: 3000
      })
      return
    }

    if (resultado.multiples.length === 1) {
      await seleccionarProducto(resultado.multiples[0])
      toast.add({
        severity: 'success',
        summary: 'Producto encontrado',
        detail: productoSeleccionado.value.nombre,
        life: 3000
      })
    } else {
      resultadosBusqueda.value = resultado.multiples
      mostrarResultados.value = true
    }
  } catch (error) {
    console.error('Error al buscar producto:', error)
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Error al buscar el producto',
      life: 3000
    })
  }
}

const handleSelectComplete = async (event) => {
  const valorSeleccionado = event?.value || event?.label || event?.text || event
  if (!valorSeleccionado) return

  busqueda.value = valorSeleccionado
  await buscarProducto()
}

const handleBusquedaChange = async (valor) => {
  if (!valor || !valor.trim()) return

  const resultado = buscarProductoPorTermino(valor)
  if (resultado.producto || resultado.multiples.length === 1) {
    busqueda.value = valor
    await buscarProducto()
  }
}

const seleccionarDesdeResultados = async (event) => {
  await seleccionarProducto(event.data)
  mostrarResultados.value = false
}

const cargarIMEIs = async () => {
  if (productoSeleccionado.value.categoria !== 'CELULARES') {
    imeisDisponibles.value = []
    imeiSeleccionado.value = null
    return
  }

  try {
    if (dataIMEIs.value.length === 0) {
      const imeis = await peticionesFetchOffline('getDataAsArray', 'imei')
      dataIMEIs.value = Array.isArray(imeis) ? imeis : []
    }

    const todosIMEIs = dataIMEIs.value

    if (todosIMEIs && todosIMEIs.length > 0) {
      const imeisProducto = todosIMEIs.filter(
        imei =>
          imei.codigo_barra === productoSeleccionado.value.codigo_barra ||
          imei.codigo_barra === productoSeleccionado.value.codigo ||
          String(imei.id_equi || '') === String(productoSeleccionado.value.id || '')
      )

      if (imeisProducto.length > 0) {
        imeisDisponibles.value = imeisProducto.map(imei => ({
          ...imei,
          display: `${imei.imei} - ${imei.capacidad} - ${imei.bateria}%`
        }))

        // Seleccionar el primero por defecto
        if (imeisDisponibles.value.length > 0) {
          imeiSeleccionado.value = imeisDisponibles.value[0]
        }
      } else {
        imeisDisponibles.value = []
        imeiSeleccionado.value = null
      }
    } else {
      imeisDisponibles.value = []
      imeiSeleccionado.value = null
    }
  } catch (error) {
    console.error('Error al cargar IMEIs:', error)
    imeisDisponibles.value = []
    imeiSeleccionado.value = null
  }
}

const generarCodigo = async () => {
  await nextTick()

  const codigo = obtenerCodigoParaEtiqueta()

  if (configuracion.value.tipoCodigo === 'barras') {
    try {
      const canvas = document.getElementById(`barcode-${_uid}`)
      if (canvas) {
        JsBarcode(canvas, codigo, {
          format: 'CODE128',
          width: configuracion.value.barcodeAncho,
          height: configuracion.value.barcodeAlto,
          displayValue: false,
          margin: 0,
          marginTop: 0,
          marginBottom: 0,
          marginLeft: 0,
          marginRight: 0,
          textMargin: 0
        })
      }
    } catch (error) {
      console.error('Error al generar código de barras:', error)
    }
  } else {
    try {
      const canvas = document.getElementById(`qrcode-${_uid}`)
      if (canvas) {
        await QRCode.toCanvas(canvas, codigo, {
          width: configuracion.value.qrTamano,
          margin: 0,
          color: {
            dark: '#000000',
            light: '#FFFFFF'
          }
        })
      }
    } catch (error) {
      console.error('Error al generar código QR:', error)
    }
  }
}

const buscarImpresoras = async () => {
  dialogImpresoras.value = true
  listaImpresoras.value = []

  try {
    if (window.electron) {
      const impresorasDisponibles = await window.electron.ipcRenderer.invoke('get-printers')
      listaImpresoras.value = impresorasDisponibles || []
      return
    }

    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Esta función solo está disponible en la aplicación de escritorio',
      life: 3000
    })
    dialogImpresoras.value = false
  } catch (error) {
    console.error('Error buscando impresoras:', error)
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'No se pudo obtener la lista de impresoras.',
      life: 3000
    })
    dialogImpresoras.value = false
  }
}

const seleccionarImpresora = (nombre) => {
  configuracion.value.impresora = nombre
  toast.add({
    severity: 'success',
    summary: 'Impresora seleccionada',
    detail: `Impresora "${nombre}" registrada.`,
    life: 2000
  })
  dialogImpresoras.value = false
}

const mostrarVistaPrevia = () => {
  generarCodigo()
  toast.add({
    severity: 'info',
    summary: 'Vista Previa',
    detail: 'Vista previa actualizada',
    life: 2000
  })
}

const escaparHTML = (valor) => (valor || '')
  .toString()
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#39;')

const generarImagenCodigoItem = async (producto, imei = null) => {
  const codigo = obtenerCodigoParaItem(producto, imei)
  const canvas = document.createElement('canvas')

  if (configuracion.value.tipoCodigo === 'barras') {
    JsBarcode(canvas, codigo, {
      format: 'CODE128',
      width: configuracion.value.barcodeAncho,
      height: configuracion.value.barcodeAlto,
      displayValue: false,
      margin: 0,
      marginTop: 0,
      marginBottom: 0,
      marginLeft: 0,
      marginRight: 0,
      textMargin: 0
    })
  } else {
    await QRCode.toCanvas(canvas, codigo, {
      width: configuracion.value.qrTamano,
      margin: 0,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    })
  }

  return {
    src: canvas.toDataURL('image/png'),
    width: canvas.width,
    height: canvas.height
  }
}

const generarImagenCodigoManual = async (valor) => {
  const codigo = (valor || '').toString().trim()
  if (!codigo) return null

  const canvas = document.createElement('canvas')

  if (configuracion.value.tipoCodigo === 'barras') {
    JsBarcode(canvas, codigo, {
      format: 'CODE128',
      width: configuracion.value.barcodeAncho,
      height: configuracion.value.barcodeAlto,
      displayValue: false,
      margin: 0,
      marginTop: 0,
      marginBottom: 0,
      marginLeft: 0,
      marginRight: 0,
      textMargin: 0
    })
  } else {
    await QRCode.toCanvas(canvas, codigo, {
      width: configuracion.value.qrTamano,
      margin: 0,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    })
  }

  return {
    src: canvas.toDataURL('image/png'),
    width: canvas.width,
    height: canvas.height
  }
}

const regenerarCodigosManualesPreview = async () => {
  const siguientesImagenes = {}

  for (const linea of configuracion.value.manualLines) {
    if (linea.tipo !== 'codigo') continue

    try {
      const imagen = await generarImagenCodigoManual(obtenerValorLineaCodigo(linea))
      if (imagen) {
        siguientesImagenes[linea.id] = imagen
      }
    } catch (error) {
      console.error('Error generando código manual:', error)
    }
  }

  codigosManualesPreview.value = siguientesImagenes
}

const obtenerStyleLayoutHTML = (bloque) => {
  const layout = obtenerLayoutBloque(bloque)
  return `position:absolute;top:${layout.top}%;left:${layout.left}%;width:${layout.width}%;`
}

const construirLineasManualesHTML = async () => {
  const bloques = await Promise.all(configuracion.value.manualLines.map(async (linea) => {
    if (linea.tipo === 'codigo') {
      const imagen = await generarImagenCodigoManual(obtenerValorLineaCodigo(linea))

      return `
        <div
          class="linea-manual bloque-impresion"
          style="position:absolute;top:${linea.top}%;left:${linea.left}%;width:${linea.width}%;font-size:${linea.fontSize}px;font-weight:${linea.bold ? '700' : '400'};text-align:${linea.align || 'center'};"
        >
          ${imagen ? `<img src="${imagen.src}" class="${configuracion.value.tipoCodigo === 'barras' ? 'codigo-barras' : 'codigo-qr'} linea-manual-codigo" style="width:${imagen.width}px;height:${imagen.height}px" />` : ''}
          <div class="linea-manual-valor">${escaparHTML(obtenerValorLineaCodigo(linea))}</div>
        </div>
      `
    }

    return `
      <div
        class="linea-manual bloque-impresion"
        style="position:absolute;top:${linea.top}%;left:${linea.left}%;width:${linea.width}%;font-size:${linea.fontSize}px;font-weight:${linea.bold ? '700' : '400'};text-align:${linea.align || 'center'};"
      >
        ${escaparHTML(obtenerTextoLineaManual(linea))}
      </div>
    `
  }))

  return bloques.join('')
}

const construirBloqueEtiquetaHTML = async (producto, imei = null) => {
  const tieneProducto = Boolean(producto)
  const imagenCodigo = tieneProducto ? await generarImagenCodigoItem(producto, imei) : null
  const partesMarca = tieneProducto ? [producto.marca, producto.modelo].filter(Boolean) : []
  const especificaciones = obtenerTextoEspecificacionesEtiqueta(producto, imei)
  const codigoTexto = obtenerTextoCodigoEtiqueta(producto, imei)
  const precio = obtenerTextoPrecioEtiqueta(producto, imei)
  const colorTexto = obtenerColorEtiqueta(producto, imei)
  const imeiTexto = obtenerImeiEtiqueta(producto, imei)
  const codigoProductoTexto = obtenerCodigoProductoTexto(producto)

  return `
    <div
      class="etiqueta-preview"
      style="width:${pixelesAncho.value}px;height:${pixelesAlto.value}px;padding:${configuracion.value.padding}px;padding-top:${configuracion.value.padding + configuracion.value.margenSuperior}px;padding-right:${configuracion.value.padding + configuracion.value.margenDerecho}px;padding-bottom:${configuracion.value.padding + configuracion.value.margenInferior}px;padding-left:${configuracion.value.padding + configuracion.value.margenIzquierdo}px;position:relative"
    >
      ${tieneProducto && configuracion.value.mostrarNombreEmpresa ? `
        <div class="empresa-nombre bloque-impresion" style="${obtenerStyleLayoutHTML('empresa')}font-size:${configuracion.value.fontSize.empresa}px">
          ${escaparHTML(obtenerTextoEmpresaEtiqueta())}
        </div>
      ` : ''}
      ${tieneProducto && configuracion.value.mostrarCodigoGrafico ? `
      <div class="codigo-container bloque-impresion" style="${obtenerStyleLayoutHTML('codigo')}transform:translateY(${configuracion.value.separacionEmpresaCodigo}px);">
        <img
          src="${imagenCodigo?.src || ''}"
          class="${configuracion.value.tipoCodigo === 'barras' ? 'codigo-barras' : 'codigo-qr'}"
          style="width:${imagenCodigo?.width || 0}px;height:${imagenCodigo?.height || 0}px"
        />
      </div>
      ` : ''}
      ${tieneProducto && configuracion.value.mostrarCodigoTexto ? `
        <div class="codigo-texto bloque-impresion" style="${obtenerStyleLayoutHTML('codigoTexto')}font-size:${configuracion.value.fontSize.codigo}px;transform:translateY(${configuracion.value.separacionCodigoTexto}px);">
          ${escaparHTML(codigoTexto)}
        </div>
      ` : ''}
      ${tieneProducto && configuracion.value.mostrarProducto ? `
      <div class="producto-nombre bloque-impresion" style="${obtenerStyleLayoutHTML('producto')}font-size:${configuracion.value.fontSize.producto}px">
        ${escaparHTML(obtenerTextoProductoEtiqueta(producto))}
      </div>
      ` : ''}
      ${tieneProducto && configuracion.value.mostrarMarca && partesMarca.length ? `
        <div class="marca-modelo bloque-impresion" style="${obtenerStyleLayoutHTML('marca')}font-size:${configuracion.value.fontSize.marca}px">
          ${escaparHTML(obtenerTextoMarcaEtiqueta(producto))}
        </div>
      ` : ''}
      ${tieneProducto && configuracion.value.mostrarColor && colorTexto ? `
        <div class="color-linea bloque-impresion" style="${obtenerStyleLayoutHTML('color')}font-size:${configuracion.value.fontSize.detalle}px">
          ${escaparHTML(colorTexto)}
        </div>
      ` : ''}
      ${tieneProducto && configuracion.value.mostrarImei && imeiTexto ? `
        <div class="imei-linea bloque-impresion" style="${obtenerStyleLayoutHTML('imei')}font-size:${configuracion.value.fontSize.detalle}px">
          IMEI:${escaparHTML(imeiTexto)}
        </div>
      ` : ''}
      ${tieneProducto && configuracion.value.mostrarCodigoProducto && codigoProductoTexto ? `
        <div class="codigo-producto-linea bloque-impresion" style="${obtenerStyleLayoutHTML('codigoProducto')}font-size:${configuracion.value.fontSize.detalle}px">
          COD:${escaparHTML(codigoProductoTexto)}
        </div>
      ` : ''}
      ${tieneProducto && configuracion.value.mostrarEspecificaciones && especificaciones ? `
        <div class="especificaciones bloque-impresion" style="${obtenerStyleLayoutHTML('especificaciones')}font-size:${configuracion.value.fontSize.especificaciones}px">
          ${escaparHTML(especificaciones)}
        </div>
      ` : ''}
      ${tieneProducto && configuracion.value.mostrarPrecio ? `
      <div class="precio bloque-impresion" style="${obtenerStyleLayoutHTML('precio')}font-size:${configuracion.value.fontSize.precio}px">
        ${escaparHTML(precio)}
      </div>
      ` : ''}
      ${await construirLineasManualesHTML()}
    </div>
  `
}

const construirHTMLImpresionEtiquetas = async () => {
  if (!productoSeleccionado.value && listaEtiquetas.value.length === 0 && configuracion.value.manualLines.length === 0) {
    throw new Error('No hay vista previa disponible para imprimir')
  }
  const itemsImpresion = listaEtiquetas.value.length > 0
    ? listaEtiquetas.value.map(item => ({
        producto: item.producto,
        imei: item.imei,
        cantidad: Number(item.cantidad) || 1
      }))
    : [{
        producto: productoSeleccionado.value,
        imei: imeiSeleccionado.value,
        cantidad: Number(configuracion.value.cantidad) || 1
      }]

  const bloques = []
  for (const item of itemsImpresion) {
    const etiquetaHTML = await construirBloqueEtiquetaHTML(item.producto, item.imei)
    for (let index = 0; index < item.cantidad; index += 1) {
      bloques.push(etiquetaHTML)
    }
  }

  const etiquetasHTML = bloques.join('')

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Imprimir Etiquetas</title>
      <style>
        * {
          box-sizing: border-box;
        }

        body {
          margin: 0;
          padding: 0;
          background: white;
          font-family: Arial, sans-serif;
        }

        .etiqueta-container {
          display: flex;
          flex-wrap: wrap;
          gap: 0;
          align-items: flex-start;
          justify-content: flex-start;
        }

        .etiqueta-preview {
          background: white;
          border: none;
          page-break-inside: avoid;
          overflow: hidden;
          padding: 0 !important;
          position: relative;
        }

        .bloque-impresion {
          position: absolute;
        }

        .empresa-nombre {
          font-weight: bold;
          text-align: center;
          margin: 0;
          text-transform: uppercase;
          line-height: 1;
        }

        .producto-nombre {
          font-weight: bold;
          text-align: center;
          margin: 0;
          line-height: 1;
        }

        .marca-modelo {
          text-align: center;
          color: #666;
          margin: 0;
          line-height: 1;
        }

        .marca-modelo span:not(:last-child)::after {
          content: ' • ';
        }

        .especificaciones {
          display: flex;
          gap: 4px;
          margin: 0;
          flex-wrap: wrap;
          justify-content: center;
          line-height: 1;
        }

        .spec-item {
          display: flex;
          align-items: center;
          gap: 2px;
          line-height: 1;
        }

        .spec-item i {
          display: none;
        }

        .codigo-container {
          margin: -2px 0;
          display: flex;
          align-items: center;
          justify-content: center;
          line-height: 0;
        }

        .codigo-barras,
        .codigo-qr {
          display: block;
          max-width: 100%;
          height: auto;
          margin: 0;
        }

        .codigo-texto {
          font-family: 'Courier New', monospace;
          text-align: center;
          margin: -2px 0 0;
          word-break: break-all;
          line-height: 1;
        }

        .precio {
          font-weight: bold;
          color: #000;
          text-align: center;
          margin: -1px 0 0;
          line-height: 1;
        }

        @page {
          margin: 0;
          size: ${configuracion.value.ancho}mm ${configuracion.value.alto}mm;
        }
      </style>
    </head>
    <body>
      <div class="etiqueta-container">${etiquetasHTML}</div>
    </body>
    </html>
  `
}

const imprimirEtiquetas = async () => {
  if (!productoSeleccionado.value && listaEtiquetas.value.length === 0 && configuracion.value.manualLines.length === 0) {
    toast.add({
      severity: 'warn',
      summary: 'Sin contenido',
      detail: 'Selecciona un producto o agrega al menos una línea manual primero',
      life: 3000
    })
    return
  }

  if (!configuracion.value.impresora) {
    toast.add({
      severity: 'warn',
      summary: 'Sin impresora',
      detail: 'Selecciona una impresora primero',
      life: 3000
    })
    return
  }

  if (productoSeleccionado.value) {
    await generarCodigo()
  }

  const totalEtiquetas = listaEtiquetas.value.length > 0
    ? totalEtiquetasLista.value
    : (Number(configuracion.value.cantidad) || 1)

  const htmlImpresion = await construirHTMLImpresionEtiquetas()

  if (window.electron) {
    try {
      const widthMicrons = Math.round((pixelesAncho.value * 1000 * 25.4) / 96)
      const heightMicrons = Math.round((pixelesAlto.value * 1000 * 25.4) / 96)

      await window.electron.ipcRenderer.invoke('print-html', {
        html: htmlImpresion,
        printerName: configuracion.value.impresora,
        width: pixelesAncho.value + 40,
        height: pixelesAlto.value + 40,
        pageSize: {
          width: widthMicrons,
          height: heightMicrons
        },
        copies: 1,
        silent: true
      })

      toast.add({
        severity: 'success',
        summary: 'Imprimiendo',
        detail: `Enviando ${totalEtiquetas} etiqueta(s) a ${configuracion.value.impresora}...`,
        life: 3000
      })
      return
    } catch (error) {
      console.error('Error al imprimir etiquetas:', error)
      toast.add({
        severity: 'error',
        summary: 'Error',
        detail: 'No se pudo imprimir en la impresora seleccionada',
        life: 3000
      })
      return
    }
  }

  const ventanaImpresion = window.open('', '_blank', 'width=800,height=600')
  ventanaImpresion.document.write(htmlImpresion)
  ventanaImpresion.document.close()

  toast.add({
    severity: 'success',
    summary: 'Imprimiendo',
    detail: `Generando ${totalEtiquetas} etiqueta(s)...`,
    life: 3000
  })
}

// Cargar datos de empresa
onMounted(async () => {
  try {
    const [empresas, configuracionBarcode, configArchivo] = await Promise.all([
      peticionesFetchOffline('getDataAsArray', 'empresa'),
      peticionesFetchOffline('getDataAsArray', 'barcode'),
      envioElectron('datosarchivo'),
      cargarDatosBuscador()
    ])

    if (empresas && empresas.length > 0) {
      datosEmpresa.value = empresas[0]
    }

    const barcodeConfig = Array.isArray(configuracionBarcode) && configuracionBarcode.length > 0
      ? configuracionBarcode[0]
      : {}
    const impresoraFallback = configArchivo?.impresoraLabel?.printerName || barcodeConfig.impresora || ''

    await cargarConfiguracionEtiquetas(impresoraFallback)
  } catch (error) {
    console.error('Error al cargar datos de empresa:', error)
  }

  await regenerarCodigosManualesPreview()
  window.addEventListener('pointermove', moverBloque)
  window.addEventListener('pointerup', terminarArrastre)
  window.addEventListener('pointercancel', terminarArrastre)
  window.addEventListener('mousemove', moverBloque)
  window.addEventListener('mouseup', terminarArrastre)
  window.addEventListener('touchmove', moverBloque, { passive: false })
  window.addEventListener('touchend', terminarArrastre)
  window.addEventListener('touchcancel', terminarArrastre)
  window.addEventListener('click', cerrarMenuBloque)
})

onBeforeUnmount(() => {
  window.removeEventListener('pointermove', moverBloque)
  window.removeEventListener('pointerup', terminarArrastre)
  window.removeEventListener('pointercancel', terminarArrastre)
  window.removeEventListener('mousemove', moverBloque)
  window.removeEventListener('mouseup', terminarArrastre)
  window.removeEventListener('touchmove', moverBloque)
  window.removeEventListener('touchend', terminarArrastre)
  window.removeEventListener('touchcancel', terminarArrastre)
  window.removeEventListener('click', cerrarMenuBloque)
})

// Watchers para regenerar código cuando cambie la configuración
watch(() => configuracion.value.tipoCodigo, () => {
  if (productoSeleccionado.value) {
    generarCodigo()
  }
  regenerarCodigosManualesPreview()
})

watch(() => [
  configuracion.value.barcodeAncho,
  configuracion.value.barcodeAlto,
  configuracion.value.qrTamano
], () => {
  if (productoSeleccionado.value) {
    generarCodigo()
  }
  regenerarCodigosManualesPreview()
})

watch(imeiSeleccionado, () => {
  if (productoSeleccionado.value) {
    generarCodigo()
  }
})

watch(
  () => configuracion.value.manualLines.map(linea => ({
    id: linea.id,
    tipo: linea.tipo,
    texto: linea.texto,
    valorCodigo: linea.valorCodigo,
    width: linea.width,
    fontSize: linea.fontSize
  })),
  () => {
    regenerarCodigosManualesPreview()
  },
  { deep: true }
)
</script>

<style scoped>
.etiquetas-container {
  padding: 20px;
  max-width: 1600px;
  margin: 0 auto;
}

.header-section {
  margin-bottom: 30px;
  text-align: center;
}

.titulo-principal {
  font-size: 2rem;
  color: #2c3e50;
  margin-bottom: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
}

.subtitulo {
  color: #7f8c8d;
  font-size: 1.1rem;
}

.main-content {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

@media (max-width: 1200px) {
  .main-content {
    grid-template-columns: 1fr;
  }

  .quick-options-grid,
  .quick-toggles,
  .acciones-etiqueta-grid {
    grid-template-columns: 1fr;
  }

  .lista-item {
    grid-template-columns: 1fr;
  }

  .lista-footer {
    flex-direction: column;
    align-items: stretch;
  }

  .formatos-toolbar {
    flex-direction: column;
    align-items: stretch;
  }

  .formatos-toolbar-actions {
    width: 100%;
  }

  .formatos-toolbar-actions > * {
    width: 100%;
  }
}



.preview-column {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.workspace-tabs-panel :deep(.p-card-content) {
  padding-top: 0;
}

.workspace-tabs :deep(.p-tabview-panels) {
  padding: 1rem 0 0;
}

.workspace-tabs .manual-lines-panel,
.workspace-tabs .quick-panel,
.workspace-tabs .lista-panel {
  box-shadow: none;
}

.input-buscador {
  flex: 1;
}

.producto-seleccionado {
  margin-top: 20px;
}

.info-producto {
  background: #f8f9fa;
  padding: 15px;
  border-radius: 8px;
  margin-bottom: 15px;
}

.info-producto p {
  margin: 5px 0;
}

.imei-option {
  padding: 5px 0;
}

.imei-details {
  display: flex;
  gap: 10px;
  margin-top: 5px;
  flex-wrap: wrap;
}

.badge-capacidad,
.badge-bateria,
.badge-precio {
  background: #e3f2fd;
  color: #1976d2;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 0.85rem;
}

.badge-bateria {
  background: #e8f5e9;
  color: #388e3c;
}

.badge-precio {
  background: #fff3e0;
  color: #f57c00;
  font-weight: bold;
}

.configuracion-section {
  padding: 10px 0;
}

.config-subtitle {
  font-size: 0.95rem;
  color: #495057;
  margin: 15px 0 10px 0;
  font-weight: 600;
}

.info-box {
  background: #e7f3ff;
  border-left: 4px solid #2196F3;
  padding: 10px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 15px;
}

.info-box i {
  color: #2196F3;
}

.acciones-etiqueta {
  margin-top: 20px;
}

.quick-actions-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.manual-editor {
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  padding: 14px;
  background: #fafafa;
}

.manual-editor-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
  flex-wrap: wrap;
}

.manual-editor-actions {
  display: flex;
  gap: 8px;
  align-items: center;
  flex-wrap: wrap;
}

.manual-pattern-select {
  min-width: 260px;
}

.manual-editor-empty {
  color: #6b7280;
  font-size: 0.92rem;
}

.editor-bloque-rapido {
  border: 1px solid #dbeafe;
  background: #eff6ff;
  border-radius: 12px;
  padding: 14px;
  margin-bottom: 14px;
}

.editor-bloque-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 10px;
}

.manual-lines-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.manual-line-item {
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  padding: 12px;
  background: #fff;
}

.manual-line-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  font-weight: 700;
}

.manual-line-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.manual-line-bold {
  min-height: 100%;
  align-items: center;
}

.lista-vacia {
  text-align: center;
  color: #7f8c8d;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;
}

.formatos-panel {
  margin-top: 20px;
}

.formatos-toolbar {
  display: flex;
  gap: 16px;
  align-items: flex-end;
  justify-content: space-between;
  margin-bottom: 14px;
  flex-wrap: wrap;
}

.formatos-search {
  flex: 1;
  min-width: 240px;
}

.formatos-toolbar-actions {
  display: flex;
  gap: 10px;
  align-items: center;
}

.formatos-table {
  margin-top: 8px;
}

.formato-nombre-cell {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.formatos-actions {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-wrap: wrap;
}

.lista-etiquetas {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.lista-item {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 140px auto;
  gap: 12px;
  align-items: end;
  padding: 12px;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  background: #fff;
}

.lista-item-info {
  min-width: 0;
}

.lista-item-nombre {
  font-weight: 700;
  color: #1f2937;
}

.lista-item-meta {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  color: #6b7280;
  font-size: 0.9rem;
  margin-top: 4px;
}

.lista-item-cantidad label {
  margin-bottom: 6px;
}

.lista-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  margin-top: 4px;
}

.quick-options-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.quick-toggles {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px 16px;
}

.field-checkbox {
  display: flex;
  align-items: center;
  gap: 8px;
}

.field-checkbox label {
  margin-bottom: 0;
  cursor: pointer;
}

.acciones-etiqueta-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.no-preview {
  text-align: center;
  padding: 60px 20px;
  color: #95a5a6;
}

.no-preview p {
  margin-top: 20px;
  font-size: 1.1rem;
}

.preview-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  overflow: auto;
  position: relative;
}

.etiqueta-preview {
  border: 2px dashed #ddd;
  margin: 0 auto;
  background: white;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  overflow: hidden;
  position: relative;
  touch-action: none;
}

.bloque-editable {
  cursor: grab;
  user-select: none;
  touch-action: none;
}

.bloque-arrastrando {
  cursor: grabbing;
  z-index: 2;
  outline: 1px dashed #2563eb;
  background: rgba(37, 99, 235, 0.05);
}

.menu-bloque {
  position: fixed;
  z-index: 60;
  min-width: 190px;
  background: #ffffff;
  border: 1px solid #d1d5db;
  border-radius: 10px;
  box-shadow: 0 12px 30px rgba(15, 23, 42, 0.18);
  padding: 6px;
}

.menu-bloque-item {
  width: 100%;
  border: none;
  background: transparent;
  text-align: left;
  padding: 10px 12px;
  border-radius: 8px;
  font-size: 0.92rem;
  color: #111827;
  cursor: pointer;
}

.menu-bloque-item:hover {
  background: #f3f4f6;
}

.linea-manual {
  margin: 0;
  line-height: 1.15;
  white-space: pre-wrap;
  word-break: break-word;
  min-height: 24px;
  padding: 4px 6px;
  border: 1px dashed #60a5fa;
  border-radius: 6px;
  background: rgba(96, 165, 250, 0.12);
  color: #111827;
}

.linea-manual-codigo {
  display: block;
  max-width: 100%;
  margin: 0 auto 4px;
}

.linea-manual-valor {
  text-align: center;
  font-size: 0.82em;
  line-height: 1.1;
  word-break: break-all;
}

.empresa-nombre {
  font-weight: bold;
  text-align: center;
  margin: 0;
  line-height: 1;
}

.producto-nombre {
  font-weight: bold;
  text-align: center;
  margin: 0;
  line-height: 1;
  word-wrap: break-word;
}

.marca-modelo {
  text-align: center;
  color: #666;
  margin: 0;
  line-height: 1;
}

.color-linea,
.imei-linea,
.codigo-producto-linea {
  text-align: center;
  color: #111827;
  margin: 0;
  line-height: 1.05;
  font-weight: 700;
  text-transform: uppercase;
  word-break: break-word;
}

.color-linea,
.imei-linea,
.codigo-producto-linea {
  text-align: center;
  color: #111827;
  margin: 0;
  line-height: 1.05;
  font-weight: 700;
  text-transform: uppercase;
  word-break: break-word;
}

.marca-modelo span:not(:last-child)::after {
  content: ' • ';
}

.especificaciones {
  display: flex;
  justify-content: center;
  gap: 4px;
  margin: 0;
  flex-wrap: wrap;
  line-height: 1;
}

.spec-item {
  display: flex;
  align-items: center;
  gap: 2px;
  color: #555;
  line-height: 1;
}

.spec-item i {
  display: none;
}

.codigo-container {
  display: flex;
  justify-content: center;
  align-items: center;
  margin: 0;
  overflow: hidden;
  line-height: 0;
}

.codigo-barras,
.codigo-qr {
  display: block;
  max-width: 100%;
  height: auto;
}

.codigo-texto {
  font-family: "Courier New", monospace;
  text-align: center;
  margin: 0;
  word-break: break-all;
  line-height: 1;
}

.precio {
  font-weight: bold;
  color: #000;
  text-align: center;
  margin-top: 0;
  line-height: 1;
}

.preview-info {
  text-align: center;
  color: #7f8c8d;
  font-size: 0.9rem;
  padding: 10px;
  background: #f8f9fa;
  border-radius: 8px;
  width: 100%;
}

.preview-zoom-control {
  margin-top: 10px;
  text-align: left;
}

.preview-zoom-control label {
  display: block;
  margin-bottom: 6px;
  font-weight: 600;
  color: #34495e;
}

.preview-info i {
  margin-right: 5px;
}

.field {
  margin-bottom: 15px;
}

.field label {
  display: block;
  margin-bottom: 5px;
  font-weight: 600;
  color: #34495e;
}

.text-muted {
  color: #95a5a6;
  font-size: 0.9rem;
  display: block;
  margin-top: 5px;
}

:deep(.p-tabview-panels) {
  padding: 1rem 0;
}

:deep(.p-slider) {
  margin-bottom: 0.5rem;
}
</style>







