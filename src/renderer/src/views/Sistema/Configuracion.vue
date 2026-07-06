<template>
<main class="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-slate-900 dark:to-indigo-950 py-6 px-4 sm:px-6 lg:px-8">
  <div class="max-w-7xl mx-auto">

    <!-- 🎯 Header Principal con Breadcrumb -->
    <div class="mb-8 space-y-4">
      <!-- Breadcrumb -->
      <nav class="flex items-center space-x-2 text-sm">
        <i class="pi pi-home text-blue-600 dark:text-blue-400"></i>
        <i class="pi pi-angle-right text-gray-400"></i>
        <span class="text-gray-600 dark:text-gray-400">Sistema</span>
        <i class="pi pi-angle-right text-gray-400"></i>
        <span class="font-semibold text-gray-900 dark:text-white">Configuración</span>
      </nav>

      <!-- Header Card -->
      <div class="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 p-8 shadow-2xl">
        <!-- Decorative elements -->
        <div class="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl"></div>
        <div class="absolute bottom-0 left-0 w-48 h-48 bg-purple-400/20 rounded-full -ml-24 -mb-24 blur-2xl"></div>

        <div class="relative flex flex-col md:flex-row items-center justify-between gap-6">
          <div class="flex items-center gap-6">
            <div class="relative">
              <div class="absolute inset-0 bg-white/20 rounded-2xl blur-xl"></div>
              <div class="relative bg-white/10 backdrop-blur-xl p-5 rounded-2xl border border-white/20 shadow-xl">
                <i class="pi pi-cog text-5xl text-white animate-spin-slow"></i>
              </div>
            </div>
            <div class="text-white">
              <h1 class="text-4xl font-black mb-2 tracking-tight">Configuración del Sistema</h1>
              <p class="text-blue-100 text-lg font-medium">Personalice y administre todos los ajustes de su empresa</p>
            </div>
          </div>

          <div class="flex flex-col gap-2 text-white/90">
            <div class="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full">
              <i class="pi pi-building text-xl"></i>
              <span class="font-semibold">{{ datosEmpresa.nombre || 'Mi Empresa' }}</span>
            </div>
            <div class="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full">
              <i class="pi pi-calendar text-xl"></i>
              <span>{{ new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 📑 TabView Principal -->
    <TabView class="config-tabs">

      <!-- ═══════════════════════════════════════════════════════════ -->
      <!-- TAB 1: INFORMACIÓN DE LA EMPRESA -->
      <!-- ═══════════════════════════════════════════════════════════ -->
      <TabPanel>
        <template #header>
          <div class="flex items-center gap-2 px-4 py-2">
            <i class="pi pi-building text-xl"></i>
            <span class="font-bold">Información de la Empresa</span>
          </div>
        </template>

        <div class="space-y-6">
          <!-- Datos Principales -->
          <Panel header="Datos Principales" toggleable :collapsed="false" class="modern-panel shadow-lg">
            <template #header>
              <div class="flex items-center gap-3">
                <div class="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg">
                  <i class="pi pi-info-circle text-white text-xl"></i>
                </div>
                <span class="text-xl font-bold text-gray-800 dark:text-white">📊 Datos Principales</span>
              </div>
            </template>

            <form action="#" id="form-empresa">
              <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-6">

                <!-- Nombre -->
                <div class="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-md hover:shadow-xl transition-all duration-300 border border-gray-200 dark:border-gray-700 hover:border-blue-400 dark:hover:border-blue-500">
                  <div class="flex items-center gap-2 mb-3">
                    <span class="text-2xl">🏢</span>
                    <label for="nombre-empresa" class="text-sm font-bold text-gray-700 dark:text-gray-200">Nombre de la Empresa</label>
                  </div>
                  <InputText
                    id="nombre-empresa"
                    v-model="datosEmpresa.nombre"
                    class="w-full"
                    placeholder="Ingrese el nombre"
                  />
                </div>

                <!-- Datos Legales -->
                <div class="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-md hover:shadow-xl transition-all duration-300 border border-gray-200 dark:border-gray-700 hover:border-blue-400 dark:hover:border-blue-500">
                  <div class="flex items-center gap-2 mb-3">
                    <span class="text-2xl">🆔</span>
                    <label for="datos-legales" class="text-sm font-bold text-gray-700 dark:text-gray-200">RNC / Datos Legales</label>
                  </div>
                  <InputText
                    id="datos-legales"
                    v-model="datosEmpresa.legal"
                    class="w-full"
                    placeholder="Ej: 123-45678-9"
                  />
                </div>

                <!-- Teléfono -->
                <div class="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-md hover:shadow-xl transition-all duration-300 border border-gray-200 dark:border-gray-700 hover:border-blue-400 dark:hover:border-blue-500">
                  <div class="flex items-center gap-2 mb-3">
                    <span class="text-2xl">📞</span>
                    <label for="telefono" class="text-sm font-bold text-gray-700 dark:text-gray-200">Teléfono</label>
                  </div>
                  <InputText
                    id="telefono"
                    v-model="datosEmpresa.telefono"
                    type="text"
                    class="w-full"
                    autocomplete="tel"
                    placeholder="Ej: +1 (809) 000-0000"
                  />
                </div>

                <!-- Email -->
                <div class="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-md hover:shadow-xl transition-all duration-300 border border-gray-200 dark:border-gray-700 hover:border-blue-400 dark:hover:border-blue-500">
                  <div class="flex items-center gap-2 mb-3">
                    <span class="text-2xl">✉️</span>
                    <label for="email" class="text-sm font-bold text-gray-700 dark:text-gray-200">Correo Electrónico</label>
                  </div>
                  <InputText
                    id="email"
                    v-model="datosEmpresa.email"
                    type="email"
                    class="w-full"
                    placeholder="ejemplo@empresa.com"
                  />
                </div>

                <!-- Dirección -->
                <div class="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-md hover:shadow-xl transition-all duration-300 border border-gray-200 dark:border-gray-700 hover:border-blue-400 dark:hover:border-blue-500 md:col-span-2">
                  <div class="flex items-center gap-2 mb-3">
                    <span class="text-2xl">📍</span>
                    <label for="direccion" class="text-sm font-bold text-gray-700 dark:text-gray-200">Dirección Completa</label>
                  </div>
                  <Textarea
                    id="direccion"
                    v-model="datosEmpresa.direccion"
                    rows="3"
                    class="w-full"
                    placeholder="Calle, número, sector, ciudad..."
                  />
                </div>

              </div>
            </form>
          </Panel>

          <!-- Imágenes de la Empresa -->
          <Panel header="Galería de Imágenes" toggleable class="modern-panel">
            <template #header>
              <div class="flex items-center gap-3">
                <div class="p-2 bg-purple-500 rounded-lg">
                  <i class="pi pi-images text-white"></i>
                </div>
                <span class="font-bold text-gray-800 dark:text-white">Galería de Imágenes</span>
              </div>
            </template>

            <div class="p-4 space-y-6">
              <!-- File Uploader -->
              <div class="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-900 p-6 rounded-xl border-2 border-dashed border-blue-300 dark:border-blue-700 hover:border-blue-500 transition-all duration-300">
<!--                 <FileUpload
                  :customUpload="true"
                  :auto="true"
                  :showUploadButton="false"
                  chooseLabel="📤 Seleccionar Imágenes"
                  @uploader="handleUpload"
                  :multiple="true"
                  class="modern-file-upload"
                /> -->
                  <FileUploader
                   ref="fileUpload"
                  :url-IMAGEN="link+api+'/subirunaimagen2'"
                  :ruta-IMAGEN="'../vista/img/empresa/'+datosEmpresa.direccionimagenes"
                  :autoUpload="true"
                  @uploadSuccess="handleUploadSuccess"
                  @uploadError="handleUploadError"
              
                />

                <p class="text-sm text-gray-600 dark:text-gray-400 mt-2 text-center">
                  Formatos permitidos: JPG, PNG, SVG - Máximo 5MB por archivo
                </p>
              </div>

              <!-- Galería de Imágenes -->
              <Divider align="center">
                <div class="flex items-center gap-2">
                  <i class="pi pi-images text-xl text-blue-600"></i>
                  <span class="font-bold text-gray-700 dark:text-gray-300">Imágenes Actuales</span>
                </div>
              </Divider>

              <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                <div
                  v-for="imagen in imagenesEmpresa"
                  :key="imagen"
                  class="group relative bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 overflow-hidden border-2 border-gray-100 dark:border-gray-700 hover:border-blue-400 dark:hover:border-blue-600 transform hover:-translate-y-2"
                >
                  <!-- Imagen -->
                  <div class="relative aspect-square overflow-hidden bg-gray-100 dark:bg-gray-900">
                    <Image
                      :src="imagen"
                      alt="Imagen de la empresa"
                      width="100%"
                      preview
                      class="object-cover w-full h-full group-hover:scale-110 transition-transform duration-500"
                    />
                    <!-- Overlay -->
                    <div class="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <div class="absolute bottom-0 left-0 right-0 p-4">
                        <p class="text-white text-xs font-semibold truncate">
                          {{ obtenerNombreArchivo(imagen) }}
                        </p>
                      </div>
                    </div>
                  </div>

                  <!-- Botón eliminar -->
                  <div class="p-3">
                    <Button
                      icon="pi pi-trash"
                      label="Eliminar"
                      severity="danger"
                      outlined
                      size="small"
                      class="w-full hover:scale-105 transition-transform"
                     @click="deleteImage(datosEmpresa.direccionimagenes, imagen)"
                    />
                  </div>
                </div>
              </div>
            </div>
          </Panel>

          <!-- Botón Guardar Empresa -->
          <div class="flex justify-end p-6 bg-gradient-to-r from-gray-50 to-blue-50 dark:from-gray-900 dark:to-indigo-950 rounded-xl">
            <Button
              icon="pi pi-save"
              label="💾 Guardar Cambios de la Empresa"
              severity="success"
              size="large"
              class="px-10 py-4 text-lg font-bold shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300"
              id="actualizarEmpresa"
              @click="actualizarEmpresa"
            />
          </div>
        </div>
      </TabPanel>

      <!-- ═══════════════════════════════════════════════════════════ -->
      <!-- TAB 2: CONFIGURACIÓN GENERAL -->
      <!-- ═══════════════════════════════════════════════════════════ -->
      <TabPanel>
        <template #header>
          <div class="flex items-center gap-2 px-4 py-2">
            <i class="pi pi-cog text-xl"></i>
            <span class="font-bold">Configuración General</span>
          </div>
        </template>


<div class="md:col-span-12">
  <Card class="mt-3 shadow-lg">
    <template #content>
      <fieldset class="border-2 border-gray-200 dark:border-gray-700 p-6 rounded-xl bg-gradient-to-br from-purple-50 to-white dark:from-gray-900 dark:to-gray-800">
        <legend class="float-none w-auto px-4 text-lg font-bold text-gray-700 dark:text-gray-200">
          🔧 Datos de Configuración
        </legend>

        <form id="form-configuracion" @submit.prevent="actualizarConfiguracion">
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mt-4">

            <!-- 🌍 País -->
            <div class="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-md hover:shadow-xl transition-all duration-300 border border-gray-200 dark:border-gray-700 hover:border-purple-400 dark:hover:border-purple-500">
              <div class="flex items-center gap-2 mb-2">
                <span class="text-2xl">🌍</span>
                <label for="pais" class="text-sm font-bold text-gray-700 dark:text-gray-200">País</label>
              </div>
              <Dropdown
                v-model="datosConfiguracion.pais"
                :options="paisesArray.map(p => p.nombre)"
                placeholder="Seleccione un país"
                class="w-full"
                @change="fnCambiarPais"
              />
            </div>

            <!-- 🗣 Idioma -->
            <div class="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-md hover:shadow-xl transition-all duration-300 border border-gray-200 dark:border-gray-700 hover:border-purple-400 dark:hover:border-purple-500">
              <div class="flex items-center gap-2 mb-2">
                <span class="text-2xl">🗣</span>
                <label for="idioma" class="text-sm font-bold text-gray-700 dark:text-gray-200">Idioma</label>
              </div>
              <InputText id="idioma" v-model="datosConfiguracion.idioma" fluid class="w-full" placeholder="Español" />
            </div>

            <!-- 💵 Moneda -->
            <div class="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-md hover:shadow-xl transition-all duration-300 border border-gray-200 dark:border-gray-700 hover:border-purple-400 dark:hover:border-purple-500">
              <div class="flex items-center gap-2 mb-2">
                <span class="text-2xl">💵</span>
                <label for="moneda" class="text-sm font-bold text-gray-700 dark:text-gray-200">Moneda</label>
              </div>
              <InputText id="moneda" v-model="datosConfiguracion.moneda" class="w-full" fluid placeholder="Dólar" />
            </div>

            <!-- 🔢 Plural -->
            <div class="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-md hover:shadow-xl transition-all duration-300 border border-gray-200 dark:border-gray-700 hover:border-purple-400 dark:hover:border-purple-500">
              <div class="flex items-center gap-2 mb-2">
                <span class="text-2xl">🔢</span>
                <label for="plural" class="text-sm font-bold text-gray-700 dark:text-gray-200">Plural</label>
              </div>
              <InputText id="plural" v-model="datosConfiguracion.plural" class="w-full" fluid placeholder="Productos" />
            </div>

            <!-- 💲 Símbolo -->
            <div class="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-md hover:shadow-xl transition-all duration-300 border border-gray-200 dark:border-gray-700 hover:border-purple-400 dark:hover:border-purple-500">
              <div class="flex items-center gap-2 mb-2">
                <span class="text-2xl">💲</span>
                <label for="simbolo" class="text-sm font-bold text-gray-700 dark:text-gray-200">Símbolo</label>
              </div>
              <InputText id="simbolo" v-model="datosConfiguracion.simbolo" class="w-full" fluid placeholder="$" />
            </div>

            <!-- 🔠 Prefijo -->
            <div class="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-md hover:shadow-xl transition-all duration-300 border border-gray-200 dark:border-gray-700 hover:border-purple-400 dark:hover:border-purple-500">
              <div class="flex items-center gap-2 mb-2">
                <span class="text-2xl">🔠</span>
                <label for="prefijo" class="text-sm font-bold text-gray-700 dark:text-gray-200">Prefijo</label>
              </div>
              <InputText id="prefijo" v-model="datosConfiguracion.prefijo" class="w-full" fluid placeholder="RD$" />
            </div>

            <!-- 🔢 Dígitos -->
            <div class="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-md hover:shadow-xl transition-all duration-300 border border-gray-200 dark:border-gray-700 hover:border-purple-400 dark:hover:border-purple-500">
              <div class="flex items-center gap-2 mb-2">
                <span class="text-2xl">🔢</span>
                <label for="digitos" class="text-sm font-bold text-gray-700 dark:text-gray-200">Dígitos</label>
              </div>
              <InputText id="digitos" v-model="datosConfiguracion.digitos" v-solonumeros class="w-full" fluid  />
            </div>

            <!-- 📦 Nombre Impuesto -->
            <div class="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-md hover:shadow-xl transition-all duration-300 border border-gray-200 dark:border-gray-700 hover:border-purple-400 dark:hover:border-purple-500">
              <div class="flex items-center gap-2 mb-2">
                <span class="text-2xl">📝</span>
                <label for="nombre_impuesto" class="text-sm font-bold text-gray-700 dark:text-gray-200">Nombre Impuesto</label>
              </div>
              <InputText id="nombre_impuesto" v-model="datosConfiguracion.nombre_impuesto" class="w-full" fluid placeholder="ITBIS" />
            </div>

            <!-- 💰 Impuesto -->
            <div class="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-md hover:shadow-xl transition-all duration-300 border border-gray-200 dark:border-gray-700 hover:border-purple-400 dark:hover:border-purple-500">
              <div class="flex items-center gap-2 mb-2">
                <span class="text-2xl">💰</span>
                <label for="impuesto" class="text-sm font-bold text-gray-700 dark:text-gray-200">Impuesto (%)</label>
              </div>
              <InputNumber id="impuesto" v-model="datosConfiguracion.impuesto" class="w-full" fluid suffix="%" />
            </div>

            <!-- 🔘 Estado Impuesto -->
            <div class="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-md hover:shadow-xl transition-all duration-300 border border-gray-200 dark:border-gray-700 hover:border-purple-400 dark:hover:border-purple-500">
              <div class="flex flex-col items-center justify-center space-y-3">
                <span class="text-2xl">🔘</span>

                <!-- Custom Toggle Switch -->
                <div class="relative">
                  <input
                    type="checkbox"
                    id="switch-estado-impuesto"
                    :checked="datosConfiguracion.switch_impuesto === 'On'"
                    @change="datosConfiguracion.switch_impuesto = $event.target.checked ? 'On' : 'Off'"
                    class="sr-only peer"
                  />
                  <label for="switch-estado-impuesto" class="relative flex items-center cursor-pointer">
                    <div
                      class="w-14 h-7 rounded-full shadow-inner transition-all duration-300"
                      :class="datosConfiguracion.switch_impuesto === 'On'
                        ? 'bg-gradient-to-r from-purple-500 to-purple-600 ring-4 ring-purple-300 dark:ring-purple-800'
                        : 'bg-gray-300 dark:bg-gray-600'"
                    >
                      <div
                        class="absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow-lg transition-transform duration-300 transform flex items-center justify-center"
                        :class="datosConfiguracion.switch_impuesto === 'On' ? 'translate-x-7' : 'translate-x-0'"
                      >
                        <span v-if="datosConfiguracion.switch_impuesto === 'On'" class="text-purple-600 text-xs">✓</span>
                        <span v-else class="text-gray-400 text-xs">✕</span>
                      </div>
                    </div>
                  </label>
                </div>

                <!-- Label Text -->
                <div class="text-center">
                  <div class="text-sm font-semibold text-gray-700 dark:text-gray-200 leading-tight">Estado Impuesto</div>
                  <div class="text-xs font-medium mt-1 transition-colors duration-300" :class="datosConfiguracion.switch_impuesto === 'On' ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400'">
                    {{ datosConfiguracion.switch_impuesto === 'On' ? 'Activado' : 'Desactivado' }}
                  </div>
                </div>

                <!-- Status Indicator Dot -->
                <div class="absolute top-2 right-2">
                  <div class="w-2 h-2 rounded-full transition-all duration-300" :class="datosConfiguracion.switch_impuesto === 'On' ? 'bg-green-500 shadow-lg shadow-green-500/50' : 'bg-gray-400'"></div>
                </div>
              </div>
            </div>

            <!-- ⚙️ Tipo Impuesto -->
            <div class="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-md hover:shadow-xl transition-all duration-300 border border-gray-200 dark:border-gray-700 hover:border-purple-400 dark:hover:border-purple-500">
              <div class="flex items-center gap-2 mb-2">
                <span class="text-2xl">⚙️</span>
                <label for="tipo_papel" class="text-sm font-bold text-gray-700 dark:text-gray-200">Opción Impuesto</label>
              </div>
              <Dropdown
                v-model="datosConfiguracion.tipo_papel"
                :options="['NO', 'INCLUIDO', 'AGREGADO']"
                placeholder="Seleccionar"
                class="w-full"
              />
            </div>

            <!-- 🕓 Zona horaria -->
            <div class="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-md hover:shadow-xl transition-all duration-300 border border-gray-200 dark:border-gray-700 hover:border-purple-400 dark:hover:border-purple-500">
              <div class="flex items-center gap-2 mb-2">
                <span class="text-2xl">🕓</span>
                <label for="zona_horaria" class="text-sm font-bold text-gray-700 dark:text-gray-200">Zona Horaria</label>
              </div>
              <InputText id="zona_horaria" v-model="datosConfiguracion.zona_horaria" class="w-full" fluid placeholder="America/Santo_Domingo" />
            </div>

            <!-- 🖨 Tipo impresora -->
            <div class="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-md hover:shadow-xl transition-all duration-300 border border-gray-200 dark:border-gray-700 hover:border-purple-400 dark:hover:border-purple-500 lg:col-span-2">
              <div class="flex items-center gap-2 mb-2">
                <span class="text-2xl">🖨</span>
                <label for="tipo_impresora" class="text-sm font-bold text-gray-700 dark:text-gray-200">Impresora Predeterminada</label>
              </div>
              <Dropdown
                v-model="datosConfiguracion.tipo_impresora"
                :options="['Impresora Normal', 'Impresora Ticket', 'Offline']"
                class="w-full"
                fluid
              />
            </div>

            <!-- 🌐 URL sitio -->
            <div class="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-md hover:shadow-xl transition-all duration-300 border border-gray-200 dark:border-gray-700 hover:border-purple-400 dark:hover:border-purple-500 lg:col-span-2">
              <div class="flex items-center gap-2 mb-2">
                <span class="text-2xl">🌐</span>
                <label for="urlsitio" class="text-sm font-bold text-gray-700 dark:text-gray-200">URL Sitio</label>
              </div>
              <InputText id="urlsitio" v-model="datosConfiguracion.urlsitio" fluid class="w-full" placeholder="https://tmposrd.com" />
            </div>

            <!-- 🧭 Default Menu -->
            <div class="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-md hover:shadow-xl transition-all duration-300 border border-gray-200 dark:border-gray-700 hover:border-purple-400 dark:hover:border-purple-500">
              <div class="flex flex-col items-center justify-center space-y-3">
                <span class="text-2xl">🧭</span>

                <!-- Custom Toggle Switch -->
                <div class="relative">
                  <input
                    type="checkbox"
                    id="switch-default-menu"
                    :checked="datosConfiguracion.notificacion === 'SIDEBAR'"
                    @change="datosConfiguracion.notificacion = $event.target.checked ? 'SIDEBAR' : 'NAVBAR'"
                    class="sr-only peer"
                  />
                  <label for="switch-default-menu" class="relative flex items-center cursor-pointer">
                    <div
                      class="w-14 h-7 rounded-full shadow-inner transition-all duration-300"
                      :class="datosConfiguracion.notificacion === 'SIDEBAR'
                        ? 'bg-gradient-to-r from-purple-500 to-purple-600 ring-4 ring-purple-300 dark:ring-purple-800'
                        : 'bg-gray-300 dark:bg-gray-600'"
                    >
                      <div
                        class="absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow-lg transition-transform duration-300 transform flex items-center justify-center"
                        :class="datosConfiguracion.notificacion === 'SIDEBAR' ? 'translate-x-7' : 'translate-x-0'"
                      >
                        <span v-if="datosConfiguracion.notificacion === 'SIDEBAR'" class="text-purple-600 text-xs">✓</span>
                        <span v-else class="text-gray-400 text-xs">✕</span>
                      </div>
                    </div>
                  </label>
                </div>

                <!-- Label Text -->
                <div class="text-center">
                  <div class="text-sm font-semibold text-gray-700 dark:text-gray-200 leading-tight">Default Menu</div>
                  <div class="text-xs font-medium mt-1 transition-colors duration-300" :class="datosConfiguracion.notificacion === 'SIDEBAR' ? 'text-blue-600 dark:text-blue-400' : 'text-orange-600 dark:text-orange-400'">
                    {{ datosConfiguracion.notificacion }}
                  </div>
                </div>

                <!-- Status Indicator Dot -->
                <div class="absolute top-2 right-2">
                  <div class="w-2 h-2 rounded-full transition-all duration-300" :class="datosConfiguracion.notificacion === 'SIDEBAR' ? 'bg-blue-500 shadow-lg shadow-blue-500/50' : 'bg-orange-500 shadow-lg shadow-orange-500/50'"></div>
                </div>
              </div>
            </div>

            <!-- 📧 Correo -->
            <div class="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-md hover:shadow-xl transition-all duration-300 border border-gray-200 dark:border-gray-700 hover:border-purple-400 dark:hover:border-purple-500 lg:col-span-2">
              <div class="flex items-center gap-2 mb-2">
                <span class="text-2xl">📧</span>
                <label for="correo_notificacion" class="text-sm font-bold text-gray-700 dark:text-gray-200">Correo de Notificación</label>
              </div>
              <InputText id="correo_notificacion" fluid v-model="datosConfiguracion.correo_notificacion" class="w-full" placeholder="ejemplo@empresa.com" />
            </div>

            <!-- 📝 Mensaje de entrega -->
            <div class="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-md hover:shadow-xl transition-all duration-300 border border-gray-200 dark:border-gray-700 hover:border-purple-400 dark:hover:border-purple-500 col-span-full">
              <div class="flex items-center gap-2 mb-2">
                <span class="text-2xl">📝</span>
                <label for="entrega" class="text-sm font-bold text-gray-700 dark:text-gray-200">Mensaje de entrega</label>
              </div>
              <Textarea id="entrega" v-model="datosConfiguracion.entrega" fluid rows="3" autoResize class="w-full" placeholder="Gracias por su compra, ¡vuelva pronto!" />
            </div>

            <!-- 💾 Botón Guardar -->
            <div class="col-span-full flex justify-end mt-4">
              <Button label="Guardar Cambios" icon="pi pi-save" severity="success" size="large" raised class="px-8" @click="actualizarConfiguracion" />
            </div>
          </div>
        </form>

        <div class="mt-6 rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 to-white p-6 shadow-md dark:border-amber-800 dark:from-gray-900 dark:to-gray-800">
          <div class="mb-4 flex items-center gap-3">
            <div class="rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 p-3 shadow-lg">
              <i class="pi pi-key text-xl text-white"></i>
            </div>
            <div>
              <h3 class="text-lg font-bold text-gray-800 dark:text-white">Tokens del Sistema</h3>
              <p class="text-sm text-gray-600 dark:text-gray-300">Modifique el token principal, el token corto y el token de 24 horas.</p>
            </div>
          </div>

          <div class="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <div class="rounded-xl border border-amber-200 bg-white p-4 shadow-sm dark:border-amber-900 dark:bg-gray-800">
              <label for="token-principal" class="mb-2 block text-sm font-bold text-gray-700 dark:text-gray-200">TOKEN</label>
              <Password id="token-principal" v-model="token" class="w-full" inputClass="w-full" :feedback="false" toggleMask placeholder="Ingrese el token principal" />
            </div>

            <div class="rounded-xl border border-amber-200 bg-white p-4 shadow-sm dark:border-amber-900 dark:bg-gray-800">
              <div class="mb-2 flex items-center justify-between gap-2">
                <label for="token-corto" class="block text-sm font-bold text-gray-700 dark:text-gray-200">TOKEN_CORTO</label>
                <Button label="Generar" icon="pi pi-refresh" severity="secondary" text size="small" @click="fnCodeN" />
              </div>
              <Password id="token-corto" v-model="tokenCorto" class="w-full" inputClass="w-full" :feedback="false" toggleMask placeholder="Ingrese el token corto" />
            </div>

            <div class="rounded-xl border border-amber-200 bg-white p-4 shadow-sm dark:border-amber-900 dark:bg-gray-800">
              <div class="mb-2 flex items-center justify-between gap-2">
                <label for="token-24h" class="block text-sm font-bold text-gray-700 dark:text-gray-200">TOKEN_24H</label>
                <Button label="Generar" icon="pi pi-refresh" severity="secondary" text size="small" @click="fnCodeN24H" />
              </div>
              <Password id="token-24h" v-model="token24Horas" class="w-full" inputClass="w-full" :feedback="false" toggleMask placeholder="Ingrese el token de 24 horas" />
            </div>
          </div>

          <div class="mt-4 flex justify-end">
            <Button label="Guardar Tokens" icon="pi pi-save" severity="warning" raised @click="guardarTokensSistema" />
          </div>
        </div>
      </fieldset>
    </template>
  </Card>
</div>

<!-- /*******************************************************************************/ -->
      <div class="md:col-span-12">
   <Card class="mt-1 shadow-lg">
        <template #content>
<fieldset class="border-2 border-gray-200 dark:border-gray-700 p-6 rounded-xl mb-2 bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
       <legend class="float-none w-auto px-4 text-lg font-bold text-gray-700 dark:text-gray-200">
         📋 Datos de Configuración de Facturas
       </legend>

  <form action="#" id="form-factura">
  <div class="card-body grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 mt-4">

<div
  v-for="(value, key) in datosConfiguracionFactura"
  :key="key"
  class="group relative bg-white dark:bg-gray-800 rounded-xl p-4 shadow-md hover:shadow-xl transition-all duration-300 border border-gray-200 dark:border-gray-700 hover:border-blue-400 dark:hover:border-blue-500"
>
  <!-- Switch Container -->
  <div class="flex flex-col items-center justify-center space-y-3">

    <!-- Custom Toggle Switch -->
    <div class="relative">
      <input
        type="checkbox"
        :id="'switch-' + key"
        v-model="datosConfiguracionFactura[key]"
        @change="actualizarconfiguracionfactura"
        class="sr-only peer"
      />
      <label
        :for="'switch-' + key"
        class="relative flex items-center cursor-pointer"
      >
        <!-- Toggle Background -->
        <div
          class="w-14 h-7 rounded-full shadow-inner transition-all duration-300"
          :class="datosConfiguracionFactura[key]
            ? 'bg-gradient-to-r from-blue-500 to-blue-600 ring-4 ring-blue-300 dark:ring-blue-800'
            : 'bg-gray-300 dark:bg-gray-600'"
        >
          <!-- Toggle Circle -->
          <div
            class="absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow-lg transition-transform duration-300 transform flex items-center justify-center"
            :class="datosConfiguracionFactura[key] ? 'translate-x-7' : 'translate-x-0'"
          >
            <!-- Icon inside circle -->
            <span v-if="datosConfiguracionFactura[key]" class="text-blue-600 text-xs">✓</span>
            <span v-else class="text-gray-400 text-xs">✕</span>
          </div>
        </div>
      </label>
    </div>

    <!-- Label Text -->
    <div class="text-center">
      <div class="text-sm font-semibold text-gray-700 dark:text-gray-200 capitalize leading-tight break-words">
        {{ key.replace(/_/g, ' ') }}
      </div>
      <div
        class="text-xs font-medium mt-1 transition-colors duration-300"
        :class="datosConfiguracionFactura[key] ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400'"
      >
        {{ datosConfiguracionFactura[key] ? 'Activado' : 'Desactivado' }}
      </div>
    </div>

    <!-- Status Indicator Dot -->
    <div class="absolute top-2 right-2">
      <div
        class="w-2 h-2 rounded-full transition-all duration-300"
        :class="datosConfiguracionFactura[key] ? 'bg-green-500 shadow-lg shadow-green-500/50' : 'bg-gray-400'"
      ></div>
    </div>

  </div>
</div>



  </div>
</form>

    </fieldset>
        </template>
    </Card>

      </div>

<!-- //////////////////////////////////////////////////////////////////////////// -->
 <div class="md:col-span-12">
  <Card class="mt-3 shadow-lg">
    <template #content>
      <fieldset class="border-2 border-gray-200 dark:border-gray-700 p-6 rounded-xl bg-gradient-to-br from-blue-50 to-white dark:from-gray-900 dark:to-gray-800">
        <legend class="float-none w-auto px-4 text-lg font-bold text-gray-700 dark:text-gray-200">
          ⚙️ Configuración Default
        </legend>

        <form id="form-default" @submit.prevent="fnDefault">
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mt-4">

            <!-- 🧾 Comprobantes -->
            <div class="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-md hover:shadow-xl transition-all duration-300 border border-gray-200 dark:border-gray-700 hover:border-blue-400 dark:hover:border-blue-500">
              <div class="flex items-center gap-2 mb-2">
                <span class="text-2xl">🧾</span>
                <label for="comprobantes" class="text-sm font-bold text-gray-700 dark:text-gray-200">Comprobantes</label>
              </div>
              <Dropdown
                v-model="datosDefault.comprobantes"
                :options="['NORMAL', 'FISCAL', 'FINAL']"
                class="w-full"
                placeholder="Seleccionar"
                @change="fnDefault"
              />
            </div>

            <!-- 💳 Método de pago -->
            <div class="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-md hover:shadow-xl transition-all duration-300 border border-gray-200 dark:border-gray-700 hover:border-blue-400 dark:hover:border-blue-500">
              <div class="flex items-center gap-2 mb-2">
                <span class="text-2xl">💳</span>
                <label for="metodo_pago" class="text-sm font-bold text-gray-700 dark:text-gray-200">Método de pago</label>
              </div>
              <Dropdown
                v-model="datosDefault.metodo_pago"
                :options="metodosPago.map(m => m.nombre)"
                placeholder="Seleccionar método"
                class="w-full"
                @change="fnDefault"
              />
            </div>

            <!-- 💰 Tarjeta -->
            <div class="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-md hover:shadow-xl transition-all duration-300 border border-gray-200 dark:border-gray-700 hover:border-blue-400 dark:hover:border-blue-500">
              <div class="flex items-center gap-2 mb-2">
                <span class="text-2xl">💰</span>
                <label class="text-sm font-bold text-gray-700 dark:text-gray-200">Tarjeta (%)</label>
              </div>
              <InputNumber
                v-model="datosDefault.tarjeta"
                suffix="%"
                :min="0"
                :max="100"
                fluid
                @blur="fnDefault"
                class="w-full"
              />
            </div>

            <!-- 🏢 Tipo de negocio -->
            <div class="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-md hover:shadow-xl transition-all duration-300 border border-gray-200 dark:border-gray-700 hover:border-blue-400 dark:hover:border-blue-500">
              <div class="flex items-center gap-2 mb-2">
                <span class="text-2xl">🏢</span>
                <label class="text-sm font-bold text-gray-700 dark:text-gray-200">Tipo de negocio</label>
              </div>
              <Dropdown
                v-model="datosDefault.modo"
                :options="['FULL', 'CELULAR', 'TIENDA', 'FERRETERIA', 'RESTAURANTE', 'FABRICA']"
                class="w-full"
                fluid
                placeholder="Seleccionar"
                @change="fnDefault"
              />
            </div>

            <!-- 📅 Días cotización -->
            <div class="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-md hover:shadow-xl transition-all duration-300 border border-gray-200 dark:border-gray-700 hover:border-blue-400 dark:hover:border-blue-500">
              <div class="flex items-center gap-2 mb-2">
                <span class="text-2xl">📅</span>
                <label class="text-sm font-bold text-gray-700 dark:text-gray-200">Días cotización</label>
              </div>
              <InputNumber
                v-model="datosDefault.dias_cotizacion"
                :min="0"
                :max="365"
                fluid
                @blur="fnDefault"
                class="w-full"
              />
            </div>

            <!-- 🧾 Cantidad copias -->
            <div class="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-md hover:shadow-xl transition-all duration-300 border border-gray-200 dark:border-gray-700 hover:border-blue-400 dark:hover:border-blue-500">
              <div class="flex items-center gap-2 mb-2">
                <span class="text-2xl">📄</span>
                <label class="text-sm font-bold text-gray-700 dark:text-gray-200">Cant. copias</label>
              </div>
              <InputNumber
                v-model="datosDefault.copias"
                :min="1"
                :max="10"
                @blur="fnDefault"
                class="w-full"
              />
            </div>

            <!-- 💵 Botón impuestos -->
            <div class="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-md hover:shadow-xl transition-all duration-300 border border-gray-200 dark:border-gray-700 hover:border-blue-400 dark:hover:border-blue-500">
              <div class="flex flex-col items-center justify-center space-y-3">
                <span class="text-2xl">💵</span>

                <!-- Custom Toggle Switch -->
                <div class="relative">
                  <input
                    type="checkbox"
                    id="switch-btn-impuestos"
                    :checked="datosDefault.btn_impuestos === 'enabled'"
                    @change="datosDefault.btn_impuestos = $event.target.checked ? 'enabled' : 'disabled'; fnDefault()"
                    class="sr-only peer"
                  />
                  <label for="switch-btn-impuestos" class="relative flex items-center cursor-pointer">
                    <div
                      class="w-14 h-7 rounded-full shadow-inner transition-all duration-300"
                      :class="datosDefault.btn_impuestos === 'enabled'
                        ? 'bg-gradient-to-r from-blue-500 to-blue-600 ring-4 ring-blue-300 dark:ring-blue-800'
                        : 'bg-gray-300 dark:bg-gray-600'"
                    >
                      <div
                        class="absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow-lg transition-transform duration-300 transform flex items-center justify-center"
                        :class="datosDefault.btn_impuestos === 'enabled' ? 'translate-x-7' : 'translate-x-0'"
                      >
                        <span v-if="datosDefault.btn_impuestos === 'enabled'" class="text-blue-600 text-xs">✓</span>
                        <span v-else class="text-gray-400 text-xs">✕</span>
                      </div>
                    </div>
                  </label>
                </div>

                <!-- Label Text -->
                <div class="text-center">
                  <div class="text-sm font-semibold text-gray-700 dark:text-gray-200 leading-tight">Botón impuestos</div>
                  <div class="text-xs font-medium mt-1 transition-colors duration-300" :class="datosDefault.btn_impuestos === 'enabled' ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400'">
                    {{ datosDefault.btn_impuestos === 'enabled' ? 'Habilitado' : 'Deshabilitado' }}
                  </div>
                </div>

                <!-- Status Indicator Dot -->
                <div class="absolute top-2 right-2">
                  <div class="w-2 h-2 rounded-full transition-all duration-300" :class="datosDefault.btn_impuestos === 'enabled' ? 'bg-green-500 shadow-lg shadow-green-500/50' : 'bg-gray-400'"></div>
                </div>
              </div>
            </div>

            <!-- 📦 Producto paréntesis -->
            <div class="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-md hover:shadow-xl transition-all duration-300 border border-gray-200 dark:border-gray-700 hover:border-blue-400 dark:hover:border-blue-500">
              <div class="flex items-center gap-2 mb-2">
                <span class="text-2xl">📦</span>
                <label class="text-sm font-bold text-gray-700 dark:text-gray-200">Prod. paréntesis</label>
              </div>
              <Dropdown
                v-model="datosDefault.prod_parentesis"
                :options="['marca', 'empaque', 'modelo', 'categoria', 'codigo']"
                class="w-full"
                @change="fnDefault"
              />
            </div>

            <!-- 🧾 Activar POS -->
            <div class="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-md hover:shadow-xl transition-all duration-300 border border-gray-200 dark:border-gray-700 hover:border-blue-400 dark:hover:border-blue-500">
              <div class="flex flex-col items-center justify-center space-y-3">
                <span class="text-2xl">💻</span>

                <!-- Custom Toggle Switch -->
                <div class="relative">
                  <input
                    type="checkbox"
                    id="switch-activar-pos"
                    :checked="datosDefault.activar_pos === 'true'"
                    @change="datosDefault.activar_pos = $event.target.checked ? 'true' : 'false'; fnDefault()"
                    class="sr-only peer"
                  />
                  <label for="switch-activar-pos" class="relative flex items-center cursor-pointer">
                    <div
                      class="w-14 h-7 rounded-full shadow-inner transition-all duration-300"
                      :class="datosDefault.activar_pos === 'true'
                        ? 'bg-gradient-to-r from-blue-500 to-blue-600 ring-4 ring-blue-300 dark:ring-blue-800'
                        : 'bg-gray-300 dark:bg-gray-600'"
                    >
                      <div
                        class="absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow-lg transition-transform duration-300 transform flex items-center justify-center"
                        :class="datosDefault.activar_pos === 'true' ? 'translate-x-7' : 'translate-x-0'"
                      >
                        <span v-if="datosDefault.activar_pos === 'true'" class="text-blue-600 text-xs">✓</span>
                        <span v-else class="text-gray-400 text-xs">✕</span>
                      </div>
                    </div>
                  </label>
                </div>

                <!-- Label Text -->
                <div class="text-center">
                  <div class="text-sm font-semibold text-gray-700 dark:text-gray-200 leading-tight">Activar POS</div>
                  <div class="text-xs font-medium mt-1 transition-colors duration-300" :class="datosDefault.activar_pos === 'true' ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400'">
                    {{ datosDefault.activar_pos === 'true' ? 'Activado' : 'Desactivado' }}
                  </div>
                </div>

                <!-- Status Indicator Dot -->
                <div class="absolute top-2 right-2">
                  <div class="w-2 h-2 rounded-full transition-all duration-300" :class="datosDefault.activar_pos === 'true' ? 'bg-green-500 shadow-lg shadow-green-500/50' : 'bg-gray-400'"></div>
                </div>
              </div>
            </div>

            <!-- 🔄 Actualización automática -->
            <div class="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-md hover:shadow-xl transition-all duration-300 border border-gray-200 dark:border-gray-700 hover:border-blue-400 dark:hover:border-blue-500">
              <div class="flex flex-col items-center justify-center space-y-3">
                <span class="text-2xl">🔄</span>

                <!-- Custom Toggle Switch -->
                <div class="relative">
                  <input
                    type="checkbox"
                    id="switch-actualizacion-automatica"
                    :checked="datosDefault.actualizacion_automatica === 'true'"
                    @change="datosDefault.actualizacion_automatica = $event.target.checked ? 'true' : 'false'; fnDefault()"
                    class="sr-only peer"
                  />
                  <label for="switch-actualizacion-automatica" class="relative flex items-center cursor-pointer">
                    <div
                      class="w-14 h-7 rounded-full shadow-inner transition-all duration-300"
                      :class="datosDefault.actualizacion_automatica === 'true'
                        ? 'bg-gradient-to-r from-blue-500 to-blue-600 ring-4 ring-blue-300 dark:ring-blue-800'
                        : 'bg-gray-300 dark:bg-gray-600'"
                    >
                      <div
                        class="absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow-lg transition-transform duration-300 transform flex items-center justify-center"
                        :class="datosDefault.actualizacion_automatica === 'true' ? 'translate-x-7' : 'translate-x-0'"
                      >
                        <span v-if="datosDefault.actualizacion_automatica === 'true'" class="text-blue-600 text-xs">✓</span>
                        <span v-else class="text-gray-400 text-xs">✕</span>
                      </div>
                    </div>
                  </label>
                </div>

                <!-- Label Text -->
                <div class="text-center">
                  <div class="text-sm font-semibold text-gray-700 dark:text-gray-200 leading-tight">Actualización automática</div>
                  <div class="text-xs font-medium mt-1 transition-colors duration-300" :class="datosDefault.actualizacion_automatica === 'true' ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400'">
                    {{ datosDefault.actualizacion_automatica === 'true' ? 'Activado' : 'Desactivado' }}
                  </div>
                </div>

                <!-- Status Indicator Dot -->
                <div class="absolute top-2 right-2">
                  <div class="w-2 h-2 rounded-full transition-all duration-300" :class="datosDefault.actualizacion_automatica === 'true' ? 'bg-green-500 shadow-lg shadow-green-500/50' : 'bg-gray-400'"></div>
                </div>
              </div>
            </div>

            <!-- 💬 WhatsApp -->
            <div class="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-md hover:shadow-xl transition-all duration-300 border border-gray-200 dark:border-gray-700 hover:border-blue-400 dark:hover:border-blue-500">
              <div class="flex flex-col items-center justify-center space-y-3">
                <span class="text-2xl">💬</span>

                <!-- Custom Toggle Switch -->
                <div class="relative">
                  <input
                    type="checkbox"
                    id="switch-whatsapp"
                    :checked="datosDefault.whatsapp === 'true'"
                    @change="datosDefault.whatsapp = $event.target.checked ? 'true' : 'false'; fnDefault()"
                    class="sr-only peer"
                  />
                  <label for="switch-whatsapp" class="relative flex items-center cursor-pointer">
                    <div
                      class="w-14 h-7 rounded-full shadow-inner transition-all duration-300"
                      :class="datosDefault.whatsapp === 'true'
                        ? 'bg-gradient-to-r from-blue-500 to-blue-600 ring-4 ring-blue-300 dark:ring-blue-800'
                        : 'bg-gray-300 dark:bg-gray-600'"
                    >
                      <div
                        class="absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow-lg transition-transform duration-300 transform flex items-center justify-center"
                        :class="datosDefault.whatsapp === 'true' ? 'translate-x-7' : 'translate-x-0'"
                      >
                        <span v-if="datosDefault.whatsapp === 'true'" class="text-blue-600 text-xs">✓</span>
                        <span v-else class="text-gray-400 text-xs">✕</span>
                      </div>
                    </div>
                  </label>
                </div>

                <!-- Label Text -->
                <div class="text-center">
                  <div class="text-sm font-semibold text-gray-700 dark:text-gray-200 leading-tight">WhatsApp</div>
                  <div class="text-xs font-medium mt-1 transition-colors duration-300" :class="datosDefault.whatsapp === 'true' ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400'">
                    {{ datosDefault.whatsapp === 'true' ? 'Activado' : 'Desactivado' }}
                  </div>
                </div>

                <!-- Status Indicator Dot -->
                <div class="absolute top-2 right-2">
                  <div class="w-2 h-2 rounded-full transition-all duration-300" :class="datosDefault.whatsapp === 'true' ? 'bg-green-500 shadow-lg shadow-green-500/50' : 'bg-gray-400'"></div>
                </div>
              </div>
            </div>

          </div>
        </form>
      </fieldset>
    </template>
  </Card>
</div>


<!-- //////////////////////////////////////////////////////////////////////////////////////////// -->

<div class="col-md-12">
  <Card class="mt-1">
    <template #content>
      <fieldset class="border p-3 rounded mb-2">
        <legend class="float-none w-auto px-2">Switch Almacen</legend>

        <!-- Contenedor para poner los dos fieldsets en línea -->
        <div class="flex flex-wrap gap-4">
          <Fieldset legend="Almacenes" class="flex-1 min-w-[200px]">
            <Button
              v-for="item in empresaData"
              :key="item.id + '-almacen'"
              :label="item.nombre"
              icon="pi pi-building"
              class="mx-1 my-1"
              iconPos="top"
              @click="fnCambiarAlmacen(item)"
            />
          </Fieldset>

<!--           <Fieldset legend="Empresas" class="flex-1 min-w-[200px]">
            <Button
              v-for="item in empresaData"
              :key="item.id + '-empresa'"
              :label="item.nombre"
              icon="pi pi-building"
              class="mx-1 my-1"
              iconPos="top"
              @click="fnCambiarEmpresa(item)"
            />
          </Fieldset> -->
        </div>
      </fieldset>
    </template>
  </Card>
</div>
<!-- //////////////////////////////////////////////////////////////////////////////////////////// -->
<Card
  class="mt-6 border-[3px] border-blue-400/40 shadow-2xl rounded-2xl bg-gradient-to-br 
        from-white to-blue-50 dark:from-gray-800 dark:to-gray-900 overflow-hidden animate-fade-in"
>
  <template #content>
    <div class="p-6 space-y-6">

      <!-- HEADER -->
      <div class="flex items-center gap-4 mb-4">
        <div class="p-3 rounded-xl bg-blue-600 text-white shadow-lg">
          <i class="pi pi-key text-3xl"></i>
        </div>
        <div>
          <h2 class="text-2xl font-bold text-gray-800 dark:text-white">
            Gestión de Licencia
          </h2>
          <p class="text-gray-500 dark:text-gray-400 text-sm">
            Ingrese, valide o actualice la licencia de su sistema
          </p>
        </div>
      </div>

      <!-- LICENCIA ACTUAL -->
      <div class="p-4 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-md">
        <p class="text-sm text-gray-500 dark:text-gray-400">Licencia actual:</p>
        <p class="font-mono text-lg font-bold text-blue-700 dark:text-blue-400 break-all">
          {{ licenciaActual || "No registrada" }}
        </p>
      </div>

      <!-- INPUT -->
      <div>
        <label class="font-semibold text-gray-700 dark:text-gray-300 text-sm mb-1 block">
          Nueva licencia
        </label>
        <InputText
          v-model="licenciaNueva"
          maxlength="17"
          placeholder="XXXX-XXXX-XXXX-XXXX"
          class="w-full text-lg p-inputtext-lg border-2 hover:border-blue-400 focus:border-blue-500 transition-all duration-300 rounded-xl"
        />
      </div>

      <!-- BOTÓN -->
      <Button
        label="Validar y Activar Licencia"
        icon="pi pi-check-circle"
        class="w-full py-3 text-lg rounded-xl shadow-lg hover:shadow-xl bg-blue-600 text-white font-bold"
        @click="verificarYGuardarLicencia"
      />

    </div>
  </template>
</Card>

<!-- //////////////////////////////////////////////////////////////////////////////////////////// -->
<Card
  class="mt-6 border-[3px] border-emerald-400/40 shadow-2xl rounded-2xl bg-gradient-to-br 
        from-white to-emerald-50 dark:from-gray-800 dark:to-gray-900 overflow-hidden animate-fade-in"
>
  <template #content>
    <div class="p-6 space-y-6">
      <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div class="flex items-center gap-3">
          <div class="p-3 rounded-xl bg-emerald-600 text-white shadow-lg">
            <i class="pi pi-cloud-download text-2xl"></i>
          </div>
          <div>
            <h3 class="text-xl font-bold text-gray-800 dark:text-white">Versiones disponibles</h3>
            <p class="text-sm text-gray-500 dark:text-gray-400">
              Descarga el instalador (.exe) que necesites
            </p>
          </div>
        </div>

        <div
          v-if="versionSugerida"
          class="flex items-center gap-3 px-4 py-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 dark:bg-emerald-900/40 dark:border-emerald-800 dark:text-emerald-100"
        >
          <i class="pi pi-star-fill text-lg"></i>
          <div>
            <p class="text-xs uppercase tracking-wide">Sugerencia</p>
            <p class="font-semibold">Versión v{{ versionSugerida.version }}</p>
          </div>
        </div>
      </div>

      <div
        v-if="versionSugerida"
        class="p-4 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm"
      >
        <p class="text-sm text-gray-600 dark:text-gray-300">
          Se sugiere instalar la versión más reciente para acceder a las mejoras y correcciones.
        </p>
        <p class="mt-2 font-semibold text-gray-900 dark:text-white break-all">
          {{ versionSugerida.nombre }}
        </p>
      </div>

      <div v-if="versionesOrdenadas.length" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div
          v-for="item in versionesOrdenadas"
          :key="item.nombre"
          class="border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm flex flex-col gap-3"
        >
          <div class="flex items-start justify-between gap-3">
            <div class="space-y-1">
              <p class="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Versión</p>
              <p class="text-lg font-bold text-gray-900 dark:text-white">v{{ item.version }}</p>
              <p class="text-xs text-gray-500 dark:text-gray-400 break-all">{{ item.nombre }}</p>
            </div>
            <span
              v-if="versionSugerida && item.nombre === versionSugerida.nombre"
              class="px-2 py-1 text-xs font-semibold rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-100"
            >
              Más reciente
            </span>
          </div>
          <Button
            label="Descargar"
            icon="pi pi-download"
            class="w-full justify-center"
            @click="descargarVersion(item.nombre)"
          />
        </div>
      </div>

      <div
        v-else
        class="p-4 rounded-xl border border-dashed border-gray-300 dark:border-gray-700 text-gray-500 dark:text-gray-400 text-center"
      >
        No se encontraron ejecutables disponibles en este equipo.
      </div>
    </div>
  </template>
</Card>

<!-- //////////////////////////////////////////////////////////////////////////////////////////// -->
<div class="col-span-12 mt-2">
  <div
    class="bg-white dark:bg-gray-900 shadow-md rounded-xl p-6 border border-gray-200 dark:border-gray-700 
           flex flex-col md:flex-row justify-between items-start gap-6 transition-colors duration-300"
  >

    <!-- 🖥️ Información del equipo -->
    <div class="w-full md:w-2/3">
      <h5 class="text-lg font-semibold mb-4 text-blue-700 dark:text-blue-400 flex items-center gap-2">
        🖥️ Información del equipo
      </h5>

      <ul class="divide-y divide-gray-200 dark:divide-gray-700">
        <li class="py-2 flex flex-wrap">
          <span class="font-medium text-gray-700 dark:text-gray-300 w-40">Nombre del equipo:</span>
          <span class="text-gray-900 dark:text-gray-100">{{ datosEquipo.hostname }}</span>
        </li>

        <li class="py-2 flex flex-wrap">
          <span class="font-medium text-gray-700 dark:text-gray-300 w-40">Sistema:</span>
          <span class="text-gray-900 dark:text-gray-100">
            {{ datosEquipo.versionSistema }} ({{ datosEquipo.plataforma }})
          </span>
        </li>

        <li class="py-2 flex flex-wrap">
          <span class="font-medium text-gray-700 dark:text-gray-300 w-40">Arquitectura:</span>
          <span class="text-gray-900 dark:text-gray-100">{{ datosEquipo.arquitectura }}</span>
        </li>

        <li class="py-2 flex flex-wrap" v-if="datosEquipo.cpus && datosEquipo.cpus.length">
          <span class="font-medium text-gray-700 dark:text-gray-300 w-40">CPU:</span>
          <span class="text-gray-900 dark:text-gray-100">{{ datosEquipo.cpus[0].model }}</span>
        </li>

        <li class="py-2 flex flex-wrap">
          <span class="font-medium text-gray-700 dark:text-gray-300 w-40">Memoria Total:</span>
          <span class="text-gray-900 dark:text-gray-100">
            {{ (datosEquipo.memoriaTotal / (1024 * 1024 * 1024)).toFixed(2) }} GB
          </span>
        </li>

        <li class="py-2 flex flex-wrap">
          <span class="font-medium text-gray-700 dark:text-gray-300 w-40">Memoria Libre:</span>
          <span class="text-gray-900 dark:text-gray-100">
            {{ (datosEquipo.memoriaLibre / (1024 * 1024 * 1024)).toFixed(2) }} GB
          </span>
        </li>

        <li class="py-2 flex flex-wrap" v-if="datosEquipo.red && datosEquipo.red['Wi-Fi']">
          <span class="font-medium text-gray-700 dark:text-gray-300 w-40">IP:</span>
          <span class="text-gray-900 dark:text-gray-100">
            {{
              datosEquipo.red['Wi-Fi'].find(item => item.family === 'IPv4' && !item.internal)?.address ||
              'No disponible'
            }}
          </span>
        </li>

        <li class="py-2 flex flex-wrap" v-if="datosEquipo.red && datosEquipo.red['Wi-Fi']">
          <span class="font-medium text-gray-700 dark:text-gray-300 w-40">Servidor local:</span>
          <span class="text-gray-900 dark:text-gray-100">{{ direccionIP }}</span>
        </li>
      </ul>
    </div>

    <!-- 📱 Código QR -->
    <div
      class="flex flex-col items-center justify-center w-full md:w-1/3 border-t md:border-t-0 md:border-l 
             border-gray-200 dark:border-gray-700 pt-4 md:pt-0 md:pl-6 text-center transition-colors duration-300"
    >
      <h6 class="text-sm font-medium text-gray-600 dark:text-gray-400 mb-3">
        Escanea para conectar
      </h6>

      <div class="flex items-center justify-center w-full">
        <Image
          v-if="qrSrc"
          :src="qrSrc"
          alt="QR del servidor local"
          class="w-44 h-44 md:w-52 md:h-52 lg:w-60 lg:h-60 object-contain rounded-md border border-gray-300 dark:border-gray-600"
          preview
        />
      </div>

      <p class="text-xs text-gray-500 dark:text-gray-400 mt-3 break-words max-w-[90%] mx-auto select-text">
        {{ direccionIP }}
      </p>
    </div>

        </div>
      </div>
      </TabPanel>

      <TabPanel>
        <template #header>
          <div class="flex items-center gap-2 px-4 py-2">
            <i class="pi pi-palette text-xl"></i>
            <span class="font-bold">Theme</span>
          </div>
        </template>

        <div class="space-y-6">
          <Panel header="Personalizacion visual" toggleable :collapsed="false" class="modern-panel shadow-lg">
            <template #header>
              <div class="flex items-center gap-3">
                <div class="p-3 rounded-xl shadow-lg" :style="{ background: themeConfig.primaryColor }">
                  <i class="pi pi-palette text-white text-xl"></i>
                </div>
                <span class="text-xl font-bold text-gray-800 dark:text-white">Theme local del usuario</span>
              </div>
            </template>

            <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 p-6">
              <div class="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div
                  v-for="field in themeFields"
                  :key="field.key"
                  class="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 shadow-sm"
                >
                  <label class="block text-sm font-bold text-gray-700 dark:text-gray-200 mb-3">
                    {{ field.label }}
                  </label>
                  <div class="flex items-center gap-3">
                    <input
                      v-model="themeConfig[field.key]"
                      type="color"
                      class="w-12 h-11 rounded-lg border border-gray-300 cursor-pointer"
                      @input="aplicarThemePreview"
                    />
                    <InputText
                      v-model="themeConfig[field.key]"
                      class="w-full"
                      placeholder="#6366f1"
                      @input="aplicarThemePreview"
                    />
                  </div>
                </div>
              </div>

              <div class="space-y-4">
                <div
                  class="rounded-xl border shadow-lg overflow-hidden"
                  :style="{ background: themeConfig.surfaceColor, color: themeConfig.textColor, borderColor: themeConfig.primaryColor }"
                >
                  <div
                    class="px-4 py-3 flex items-center justify-between"
                    :style="{ background: themeConfig.appTopbarBg, color: themeConfig.appTopbarText }"
                  >
                    <div class="font-bold">AppTopbar</div>
                    <div class="flex gap-2">
                      <span
                        class="w-8 h-8 rounded-lg flex items-center justify-center"
                        :style="{ background: themeConfig.appTopbarButtonBg, color: themeConfig.appTopbarButtonText }"
                      >
                        <i class="pi pi-search"></i>
                      </span>
                      <span
                        class="w-8 h-8 rounded-lg flex items-center justify-center"
                        :style="{ background: themeConfig.primaryColor, color: '#ffffff' }"
                      >
                        <i class="pi pi-plus"></i>
                      </span>
                    </div>
                  </div>
                  <div class="p-5 space-y-4">
                    <div class="text-lg font-bold">Vista previa</div>
                    <div class="h-3 rounded-full" :style="{ background: themeConfig.primaryColor }"></div>
                    <div class="h-3 rounded-full w-2/3" :style="{ background: themeConfig.secondaryColor }"></div>
                    <Button label="Boton primario" icon="pi pi-check" :style="{ background: themeConfig.primaryColor, borderColor: themeConfig.primaryColor }" />
                  </div>
                </div>

                <div class="flex flex-col gap-3">
                  <Button label="Guardar theme" icon="pi pi-save" severity="success" @click="guardarThemeConfig" />
                  <Button label="Restablecer valores" icon="pi pi-refresh" severity="secondary" outlined @click="restablecerThemeConfig" />
                </div>
              </div>
            </div>
          </Panel>
        </div>
      </TabPanel>

    </TabView>

  </div>
</main>

    <Toast />
  <LoadingOverlay :visible="loading" />
</template>

<script setup>
import { ref, onMounted, watch,computed } from 'vue';
import { useRouter,useRoute } from 'vue-router';
const router = useRouter();
import axios from 'axios';
import QRCode from 'qrcode'
import { useToast } from 'primevue/usetoast';
import { peticiones,generadorCodigo,generarCodigoUnico,encryptarPassword,peticionImagen, arrayToObjetoFromTabla,envioElectron,cerrarSession,arrayToObjetoFromTablaOffline,peticionesFetch,enviarSolicitudGet,peticionesFetchOffline,enviarDatosPorPost,nfecha } from '@/funciones/funciones.js';
import FileUploader from '../Componentes/FileUploader.vue';
const toast = useToast();
import Swal from 'sweetalert2'
import LoadingOverlay from '@/Loading/LoadingOverlay.vue';
import OptionButtonTM from '@/components/OptionButtomTM.vue';
import { applyCustomThemeToDocument, DEFAULT_CUSTOM_THEME } from '@/layout/composables/layout';

import SelectButton from 'primevue/selectbutton';

/****************************************************/
import { useDatosEmpresa } from '@/stores'
const datosEmpresaStore = useDatosEmpresa();
/****************************************************/
const datosEmpresa = ref({});
  //import config from '../../../../../resources/config.json';
/****************************************************/
//import {useDatosEmpresa} from '../../stores'
//const datosEmpresa = useDatosEmpresa();
//const production = config.VITE_PRODUCTION;
const link = ref('');
const api = ref('');
const token = ref('');
const patronTelefonoDefault = ref('');
const linkImpresora = ref('');
const patroncedula = ref('');
const tokenCifrado = ref('');
const tokenCorto = ref('');
const tokenUnSoloUso = ref('');
const token24Horas = ref('');
const linkInventario = ref('');
/****************************************************/
const versionesDisponibles = ref([]);
/****************************************************/
const empresaData = ref([])
const turnos = ref([])
/****************************************************/
const datosEquipo = ref({})
const datosEquipoLocal = ref({})
/****************************************************/
const loading = ref(false)
/*********************************************/
const cambiarEmpresaToggle = ref('')
const optionsEmpresas = ref([]);
/*********************************************/
/******************************************************
 * SISTEMA DE LICENCIAS – PROFESIONAL
 ******************************************************/
const licenciaActual = ref("");
const licenciaNueva = ref("");
const visibleAgregarLicencia = ref(false);
/*********************************************/
const isOn = computed(() => datosEmpresa.value.id === 1);

/*********************************************/
// Patrón de teléfono dinámico según el país configurado
const patronTelefono = computed(() => {
  let patron = '';

  // Si digitos es un patrón (contiene 9, -, (, ), etc.), usarlo directamente
  if (datosConfiguracion.value?.digitos && typeof datosConfiguracion.value.digitos === 'string' && datosConfiguracion.value.digitos.includes('9')) {
    patron = datosConfiguracion.value.digitos;
  }
  // Si existe dígitos como número, generar patrón basado en cantidad
  else if (datosConfiguracion.value?.digitos) {
    const numDigitos = parseInt(datosConfiguracion.value.digitos);

    // Si es un número válido, generar el patrón
    if (!isNaN(numDigitos) && numDigitos > 0) {
      // Crear patrón según cantidad de dígitos (sin incluir el prefijo en el conteo)
      if (numDigitos === 10) {
        patron = '(999) 999-9999'; // Formato: (809) 555-1234
      } else if (numDigitos === 8) {
        patron = '9999-9999'; // Formato simple: 5555-1234
      } else if (numDigitos === 7) {
        patron = '999-9999'; // Formato: 555-1234
      } else {
        // Patrón genérico para otros casos
        patron = '9'.repeat(numDigitos);
      }
    }
  }

  // Si no se pudo generar un patrón, usar el valor por defecto
  if (!patron) {
    patron = patronTelefonoDefault.value || '(999) 999-9999';
  }

  // Agregar el prefijo telefónico si existe y NO es un símbolo monetario
  // El prefijo es un código telefónico si: empieza con "+", o no contiene símbolos monetarios ($, €, £, ¥, etc.)
  const simbolosMonetarios = ['$', '€', '£', '¥', '¢', '₡', '₱', '₹', '₽', '₴', '₦', '₨', '₩', '₪', '₫', '฿'];
  const esSimboloMonetario = datosConfiguracion.value?.prefijo && simbolosMonetarios.some(simbolo => datosConfiguracion.value.prefijo.includes(simbolo));

  // Si el prefijo existe y NO es un símbolo monetario, agregarlo al patrón de teléfono
  if (datosConfiguracion.value?.prefijo && !esSimboloMonetario) {
    return `${datosConfiguracion.value.prefijo} ${patron}`;
  }

  return patron;
});

const fnCambiarEmpresa = async(empresa)=>{
const datos = empresa
const nJSONResponse = await envioElectron('datosarchivo');
  const { value: password } = await Swal.fire({
    title: 'Cambiar Empresa',
    text: 'Ingrese la contraseña para cambiar de empresa',
    input: 'password',
    inputPlaceholder: 'Ingrese la contraseña',
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
    Swal.fire('Error', 'Debe ingresar una contraseña', 'error');
    return;
  }


  if (password === token.value || password === tokenCorto.value) {
 const nJSON = nJSONResponse;

  nJSON.VITE_LINKURL = datos.link.replace(/\/$/, '');
  nJSON.almacen = datos.nombre;
  const clonedData = JSON.parse(JSON.stringify(nJSON));
  const envioDatosJSON = await window.electron.ipcRenderer.invoke('actualizarjson', clonedData);

cerrarSession()
router.push('/login')
  } else {
    Swal.fire('Error', 'Contraseña incorrecta', 'error');
  }
};

/*********************************************/
const fnCambiarAlmacen = async(empresa)=>{
const datos = empresa
  const { value: password } = await Swal.fire({
    title: 'Cambiar Almacén',
    text: 'Ingrese la contraseña para cambiar de almacén',
    input: 'password',
    inputPlaceholder: 'Ingrese la contraseña',
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
    Swal.fire('Error', 'Debe ingresar una contraseña', 'error');
    return;
  }

  if (password === token.value || password === tokenCorto.value) {
    // Si es Electron, actualizar el JSON
    if (window.electron) {
      const nJSONResponse = await envioElectron('datosarchivo');
      const nJSON = nJSONResponse;
      nJSON.almacen = datos.nombre;
      const clonedData = JSON.parse(JSON.stringify(nJSON));
      const envioDatosJSON = await window.electron.ipcRenderer.invoke('actualizarjson', clonedData);

      cerrarSession();
      router.push('/login');
    } else {
      // Si es navegador, redirigir al login con el almacén como query parameter
      cerrarSession();
      router.push({
        name: 'login',
        query: { almacen: datos.nombre }
      });
    }
  } else {
    Swal.fire('Error', 'Contraseña incorrecta', 'error');
  }
};
/*********************************************/
//DATOS DE LA EMPRESA
/*********************************************/

const imagenesEmpresa = ref([])
/*********************************************/
//DATOS DE CONFIGURACION FACTURA
/*********************************************/
const datosConfiguracionFactura = ref({});
/*********************************************/
/*********************************************/
//DATOS DE CONFIGURACION
/*********************************************/
const datosConfiguracion = ref({})
/*********************************************/
const datosDefault = ref({})
/*********************************************/
const metodosPago = ref([])
const paisesArray = ref([])

/*********************************************/
const barraMenu = ref([])
const nBarraBoolean = ref({})
/***************************************************/
const themeConfig = ref({ ...DEFAULT_CUSTOM_THEME })
const themeFields = [
  { key: 'primaryColor', label: 'Color primario' },
  { key: 'secondaryColor', label: 'Color secundario' },
  { key: 'accentColor', label: 'Color de acento' },
  { key: 'surfaceColor', label: 'Fondo / superficie' },
  { key: 'textColor', label: 'Color de texto' },
  { key: 'appTopbarBg', label: 'Fondo AppTopbar' },
  { key: 'appTopbarText', label: 'Texto AppTopbar' },
  { key: 'appTopbarButtonBg', label: 'Botones AppTopbar' },
  { key: 'appTopbarButtonText', label: 'Texto botones AppTopbar' }
]

const cargarThemeConfig = (datosJSON = {}) => {
  themeConfig.value = {
    ...DEFAULT_CUSTOM_THEME,
    ...(datosJSON.themeConfig || {})
  }
  localStorage.setItem('custom_theme_config', JSON.stringify(themeConfig.value))
  applyCustomThemeToDocument(themeConfig.value)
}

const guardarThemeConfig = async () => {
  try {
    const datosJSON = await envioElectron('datosarchivo')
    const clonedData = JSON.parse(JSON.stringify(datosJSON))
    clonedData.themeConfig = {
      ...DEFAULT_CUSTOM_THEME,
      ...themeConfig.value
    }
    await window.electron.ipcRenderer.invoke('actualizarjson', clonedData)
    localStorage.setItem('custom_theme_config', JSON.stringify(clonedData.themeConfig))
    applyCustomThemeToDocument(clonedData.themeConfig)
    toast.add({ severity: 'success', summary: 'OK', detail: 'Tema guardado correctamente', life: 3000 })
  } catch (error) {
    toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo guardar el tema', life: 3000 })
  }
}

const restablecerThemeConfig = () => {
  themeConfig.value = { ...DEFAULT_CUSTOM_THEME }
  applyCustomThemeToDocument(themeConfig.value)
}

const aplicarThemePreview = () => {
  applyCustomThemeToDocument(themeConfig.value)
}


const fetchPaises = async () => {
  try {
   const response = await peticionesFetchOffline('getDataAsArray', 'paises');
    paisesArray.value = response;

    /*********************************************/
  } catch (error) {
    console.error('Error fetching data', error);
    toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to fetch data', life: 3000 });
  }
};


/*********************************************/
const fetchDataConfiguracionFactura = async () => {
  try {
/*    const response = await axios.get(`${link.value}${api.value}/datoscampo/configuracionfactura/id/1/`);*/
    const response = await peticionesFetchOffline('getDataByField', 'configuracionfactura','id',1);

    delete response.id;
    const nuevosDatos = {};
    for(let item in response){
      if (response[item] == 'True') {
         nuevosDatos[item] = true
      }else{
        nuevosDatos[item] = false
      }

    }
    datosConfiguracionFactura.value = nuevosDatos;
    localStorage.setItem('configuracionFactura', JSON.stringify(response));

  } catch (error) {
    console.error('Error fetching data', error);
    toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to fetch data Configuración factura', life: 3000 });
  }
};
/*********************************************/
const actualizarEmpresa = async ()=>{
  delete datosEmpresa.value.logoprinter
  delete datosEmpresa.value.logo
  delete datosEmpresa.value.imagenesArray
  delete datosEmpresa.value.direccionimagenes
  delete datosEmpresa.value.error
  delete datosEmpresa.value.details

const datosEnviar = JSON.parse(JSON.stringify(datosEmpresa.value));
datosEnviar.imagen = datosEmpresaStore.empresa.direccionimagenes

 if(!datosEnviar.imagen){
  toast.add({ severity: 'error', summary: 'Error', detail: 'Error al Actualizar los Datos IMG', life: 3000 });
  return
 }

/*  const envio = await peticiones(link.value+api.value+'/actualizarcampos/empresa',datosEnviar,'POST',tokenCifrado.value)*/
  const envio = await peticionesFetchOffline('updateData','empresa', JSON.stringify(datosEnviar));
  if (envio[0] == 'ok') {

  datosEmpresa.value.logoprinter = datosEmpresaStore.empresa.logoprinter
  datosEmpresa.value.logo = datosEmpresaStore.empresa.logo
  datosEmpresa.value.imagenesArray = datosEmpresaStore.empresa.imagenesArray
  datosEmpresa.value.direccionimagenes = datosEmpresaStore.empresa.direccionimagenes
  datosEnviar.imagen = datosEmpresaStore.empresa.imagen
    toast.add({ severity: 'success', summary: 'OK', detail: 'Datos Actualizados Correctamente', life: 3000 });
  }else{
    toast.add({ severity: 'error', summary: 'Error', detail: 'Error al Actualizar los Datos', life: 3000 });
  }
}
/*********************************************/
const actualizarConfiguracion = async ()=>{
/*  const envio = await peticiones(link.value+api.value+'/actualizarcampos/configuracion',datosConfiguracion.value,'POST',tokenCifrado.value)*/
  const envio = await peticionesFetchOffline('updateData','configuracion', JSON.stringify(datosConfiguracion.value));
  if (envio[0] == 'ok') {
    toast.add({ severity: 'success', summary: 'OK', detail: 'Datos Actualizados Correctamente', life: 3000 });

    window.localStorage.setItem('configuracion',JSON.stringify(datosConfiguracion.value))

  }else{
    toast.add({ severity: 'error', summary: 'Error', detail: 'Error al Actualizar los Datos', life: 3000 });
  }
}
/*********************************************/
const actualizarconfiguracionfactura = async(event)=>{
    const nuevosDatos = {'id':1};
    for(let item in datosConfiguracionFactura.value){
      if (item != 'id') {
      if (datosConfiguracionFactura.value[item] === true) {
         nuevosDatos[item] = 'True'
      }else{
        nuevosDatos[item] = 'False'
      }
      }
      }

/*  const envio = await peticiones(link.value+api.value+'/actualizarcampos/configuracionfactura',nuevosDatos,'POST',tokenCifrado.value)*/
  const envio = await peticionesFetchOffline('updateData','configuracionfactura', JSON.stringify(nuevosDatos));
  if (envio[0] == 'ok') {
    
    window.localStorage.setItem('configuracionfactura',JSON.stringify(nuevosDatos))


    toast.add({ severity: 'success', summary: 'OK', detail: 'Datos Actualizados Correctamente', life: 3000 });
  }else{
    toast.add({ severity: 'error', summary: 'Error', detail: 'Error al Actualizar los Datos', life: 3000 });
  }

}
/*********************************************/

const fetchEmpresaDatosarraypost = async () => {
  try {

    const response = await peticionesFetchOffline('getDataAsArray', 'empresa');
    empresaData.value = response;
    const nombres = response.map(empresa=>empresa.nombre);
     optionsEmpresas.value = nombres
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to fetch data from empresa',
      life: 3000
    });
  }
};

/*********************************************/
const fetchEmpresa = async () => {
  try {
    const response = await peticionesFetchOffline('getDataByField', 'empresa', 'id', 1);
    const copiaResponse = JSON.parse(JSON.stringify(response));
    const arrayIMG = await peticionesFetchOffline('listarArchivosDeCarpeta', 'empresa/'+copiaResponse.imagen);
    const copia = JSON.parse(JSON.stringify(response))

if (arrayIMG) {
    const base = `${link.value}/vista/img/empresa/${copia.imagen}/`;

    // Crear las URLs completas de TODAS las imágenes
    const imagenesCompletas = arrayIMG.map(img => base + img);

    response.imagen = imagenesCompletas[0] || null;
    response.logoprinter = imagenesCompletas[1] || null;

    response.imagenesArray = imagenesCompletas;
    response.direccionimagenes = copia.imagen;

    imagenesEmpresa.value = imagenesCompletas;
}



    //datosEmpresa.setDatosEmpresa(response);
    //datosEmpresaP.value = response;

  } catch (error) {
    console.error('Error al obtener la empresa:', error);
  }
};
/*********************************************/
// 🧠 Computar la dirección IP con http:// al inicio
const direccionIP = computed(() => {
  const ip = datosEquipo.value.red?.['Wi-Fi']
    ?.find(item => item.family === 'IPv4' && !item.internal)?.address
  return ip ? `http://${ip}:3000` : 'No disponible'
})

const normalizarBaseUrl = (url = '') => url.replace(/\/$/, '');

const extraerVersionDeNombre = (nombre = '') => {
  const coincidencia = nombre.match(/(\d+(?:\.\d+){1,3})/);
  return coincidencia ? coincidencia[1] : '0.0.0';
};

const compararVersiones = (a = '0.0.0', b = '0.0.0') => {
  const partesA = a.split('.').map(Number);
  const partesB = b.split('.').map(Number);
  const longitud = Math.max(partesA.length, partesB.length);

  for (let i = 0; i < longitud; i++) {
    const valA = partesA[i] || 0;
    const valB = partesB[i] || 0;
    if (valA !== valB) return valA - valB;
  }
  return 0;
};

const versionesOrdenadas = computed(() => {
  return versionesDisponibles.value
    .map(item => ({
      ...item,
      version: item.version || '0.0.0'
    }))
    .sort((a, b) => compararVersiones(b.version, a.version) || b.nombre.localeCompare(a.nombre));
});

const versionSugerida = computed(() => versionesOrdenadas.value[0] || null);

const descargarVersion = (nombre) => {
  if (!nombre) return;

  const base = normalizarBaseUrl(`https://actualizaciones.tmposrd.com`);
  if (!base) {
    toast.add({
      severity: 'warn',
      summary: 'Enlace no disponible',
      detail: 'Configura la URL base antes de descargar una versión.',
      life: 3000
    });
    return;
  }

  const urlDescarga = `${base}/windows/${nombre}`;

  try {
    window.open(urlDescarga, '_blank');
  } catch (error) {
    console.error('Error al iniciar la descarga:', error);
    toast.add({
      severity: 'error',
      summary: 'Error al descargar',
      detail: 'No se pudo iniciar la descarga de esta versión.',
      life: 3000
    });
  }
};

const qrSrc = ref('')
/*********************************************/
onMounted(async() => {

const datosJSON = await envioElectron('datosarchivo');
cargarThemeConfig(datosJSON);

link.value = datosJSON.VITE_LINKURL;
api.value = datosJSON.VITE_LINK_API;
token.value = datosJSON.VITE_TOKEN;
patronTelefonoDefault.value = datosJSON.VITE_PATRON_TELEFONO;
linkImpresora.value = datosJSON.VITE_IMPRESORA_LOCAL;
tokenCorto.value = datosJSON.VITE_TOKEN_CORTO;
tokenUnSoloUso.value = datosJSON.VITE_TOKEN_SOLOUSO;
token24Horas.value = datosJSON.VITE_TOKEN_24H;
linkInventario.value = datosJSON.VITE_LINK_INVENTARIO;

tokenCifrado.value = await encryptarPassword(token.value, 10);

licenciaActual.value = "REGISTRADA";

const turnosOrigen = datosJSON.VITE_TURNOS;

if(turnosOrigen){
  turnos.value = turnosOrigen
}else{
    const nJSON = datosJSON;
  nJSON.VITE_TURNOS = [{turno:'COMPLETO'}];
  const clonedData = JSON.parse(JSON.stringify(nJSON));
  const envioDatosJSON = await window.electron.ipcRenderer.invoke('actualizarjson', clonedData);
}

if(window.electron){
  datosEquipo.value = await window.electron.ipcRenderer.invoke('datos_del_equipo');

  if (direccionIP.value !== 'No disponible') {
    qrSrc.value = await QRCode.toDataURL(direccionIP.value, {
      width: 200,
      color: { dark: '#000000', light: '#ffffff' }
    })
  }
  
}


const arrayEXE = await peticionesFetchOffline('listarDirectorio', '../../actualizaciones/windows/');
const ejecutables = Object.values(arrayEXE).filter(
  archivo => archivo.endsWith('.exe')
);
versionesDisponibles.value = ejecutables.map(nombre => ({
  nombre,
  version: extraerVersionDeNombre(nombre)
}));


datosEmpresa.value = JSON.parse(JSON.stringify(datosEmpresaStore.empresa));
cambiarEmpresaToggle.value = datosEmpresa.value.nombre

datosConfiguracion.value = JSON.parse(window.localStorage.getItem('configuracion')) || {}
datosDefault.value = JSON.parse(window.localStorage.getItem('tabladefault')) || {}
metodosPago.value = JSON.parse(window.localStorage.getItem('metodoPago')) || []
barraMenu.value = JSON.parse(window.localStorage.getItem('barramenu')) || []

const nBarra = Object.keys(barraMenu.value).filter(key=>!['id', 'created_at', 'updated_at'].includes(key)).reduce((obj, key) => {
      const value = barraMenu.value[key];
      // Convertir las cadenas "true" y "false" en booleanos
      if (value === 'true') {
        obj[key] = true;
      } else if (value === 'false') {
        obj[key] = false;
      } else {
        obj[key] = value;
      }

      return obj;
    }, {});

barraMenu.value = nBarra


await fetchEmpresa();
await fetchDataConfiguracionFactura();
await fetchPaises();
await fetchEmpresaDatosarraypost();


})
/*********************************************/
const eliminarTurnos = async (index) => {
  // Eliminar el turno del array local
  turnos.value.splice(index, 1);

  // Actualizar el archivo JSON con los turnos restantes
  const datosJSON = await envioElectron('datosarchivo');
  const nJSON = datosJSON;
  nJSON.VITE_TURNOS = turnos.value;

  // Guardar los cambios en el archivo JSON
  const clonedData = JSON.parse(JSON.stringify(nJSON));
  const envioDatosJSON = await window.electron.ipcRenderer.invoke('actualizarjson', clonedData);

  // Mostrar una notificación de éxito
  toast.add({ severity: 'success', summary: 'Éxito', detail: 'Turno eliminado correctamente', life: 3000 });
  cargarTurnos()
};

/*********************************************/
const cargarTurnos = async()=>{
    const datosJSON = await envioElectron('datosarchivo');
    const nJSON = datosJSON;
        if(nJSON.VITE_TURNOS){
      turnos.value = nJSON.VITE_TURNOS
    }else{
      nJSON.VITE_TURNOS = [{turno:'COMPLETO'}];
      const clonedData = JSON.parse(JSON.stringify(nJSON));
      const envioDatosJSON = await window.electron.ipcRenderer.invoke('actualizarjson', clonedData);
      turnos.value = nJSON.VITE_TURNOS
    }
}
/*********************************************/
const fnGuardar = async () => {
  // Obtener los datos actuales del archivo JSON
  const datosJSON = await envioElectron('datosarchivo');

  // Actualizar los turnos en el objeto JSON
  const nJSON = datosJSON;
  nJSON.VITE_TURNOS = turnos.value;

  // Guardar los cambios en el archivo JSON
  const clonedData = JSON.parse(JSON.stringify(nJSON));
  const envioDatosJSON = await window.electron.ipcRenderer.invoke('actualizarjson', clonedData);

  // Mostrar una notificación de éxito
  toast.add({ severity: 'success', summary: 'Éxito', detail: 'Cambios guardados correctamente', life: 3000 });
};

/*********************************************/
const fnAgregarTurno = async () => {
    const { value: formValues } = await Swal.fire({
        title: 'Agregar Turno',
        html:
            '<input id="nombre-turno" class="swal2-input" placeholder="Nombre del turno">' +
            '<input id="hora-inicio" type="time" class="swal2-input" placeholder="Hora de inicio">' +
            '<input id="hora-fin" type="time" class="swal2-input" placeholder="Hora de fin">',
        focusConfirm: false,
        preConfirm: () => {
            return {
                nombreTurno: document.getElementById('nombre-turno').value,
                horaInicio: document.getElementById('hora-inicio').value,
                horaFin: document.getElementById('hora-fin').value
            };
        }
    });

    if (formValues) {
        const { nombreTurno, horaInicio, horaFin } = formValues;

    const datosJSON = await envioElectron('datosarchivo');
    const nJSON = datosJSON;

    if(nJSON.VITE_TURNOS){
      nJSON.VITE_TURNOS.push({turno:nombreTurno,horaInicio,horaFin})
    }else{
      nJSON.VITE_TURNOS = [{turno:nombreTurno,horaInicio,horaFin}]
    }
    const clonedData = JSON.parse(JSON.stringify(nJSON));
    const envioDatosJSON = await window.electron.ipcRenderer.invoke('actualizarjson', clonedData);

    cargarTurnos()

    }
};

/*********************************************/
const fnDefault = async()=>{
  const url = link.value+api.value+"/actualizarcampos/tabladefault";
  if (!datosDefault.value) {
    console.error("Datos incompletos, no se puede actualizar.");
    return;
  }

  if (datosDefault.value.hasOwnProperty('created_at')) {
    datosDefault.value.updated_at = nfecha('timestamp');
  }

  const envioDatos = await peticionesFetchOffline('updateData','tabladefault', JSON.stringify(datosDefault.value));
  if (envioDatos[0] == 'ok') {
    window.localStorage.setItem('datosDefault', JSON.stringify(datosDefault.value));
    window.localStorage.setItem('tabladefault', JSON.stringify(datosDefault.value));
    toast.add({ severity: 'success', summary: 'Éxito', detail: 'Datos Actualizados', life: 3000 });
  } else {
    toast.add({ severity: 'error', summary: 'Error', detail: 'Fallo al actualizar los datos.', life: 3000 });
  }
}
/*********************************************/
const fnCambiarPais = ()=>{
  const datosPais = paisesArray.value.find(pais=>pais.nombre === datosConfiguracion.value.pais)
  datosConfiguracion.value.idioma = datosPais.idioma
  datosConfiguracion.value.moneda = datosPais.moneda

datosConfiguracion.value.simbolo = datosPais.simbolo
datosConfiguracion.value.prefijo = datosPais.prefijo
datosConfiguracion.value.digitos = datosPais.digitos
datosConfiguracion.value.nombre_impuesto = datosPais.nombre_imp
datosConfiguracion.value.impuesto = datosPais.c_imp
datosConfiguracion.value.zona_horaria = datosPais.z_horaria

}
/*********************************************/
/*********************************************/
const fnBarraMenu = async()=>{

  const url = link.value+api.value+"/actualizarcampos/barramenu";
  if (!barraMenu.value) {
    console.error("Datos incompletos, no se puede actualizar.");
    return;
  }

    barraMenu.value.updated_at = nfecha('timestamp');
    barraMenu.value.id = 1

  const envioDatos = await peticionesFetchOffline('updateData','barramenu', JSON.stringify(barraMenu.value));

  if (envioDatos[0] == 'ok') {
    window.localStorage.setItem('barramenu', JSON.stringify(barraMenu.value));

const nBarra = Object.keys(barraMenu.value).filter(key=>!['id', 'created_at', 'updated_at'].includes(key)).reduce((obj, key) => {
      const value = barraMenu.value[key];
      // Convertir las cadenas "true" y "false" en booleanos
      if (value === 'true') {
        obj[key] = true;
      } else if (value === 'false') {
        obj[key] = false;
      } else {
        obj[key] = value;
      }

      return obj;
    }, {});

barraMenu.value = nBarra

    
    toast.add({ severity: 'success', summary: 'Éxito', detail: 'Datos Actualizados', life: 3000 });
  } else {
    toast.add({ severity: 'error', summary: 'Error', detail: 'Fallo al actualizar los datos.', life: 3000 });
  }
}
/*********************************************/
const fnCodeN = async()=>{
    tokenCorto.value = Math.floor(1000 + Math.random() * 9000).toString();
}
/*********************************************/
const fnGuardarCodeN = async()=>{
const datosJSON = await envioElectron('datosarchivo');
  datosJSON.VITE_TOKEN_CORTO = tokenCorto.value;
  try {
    const envioDatosJSON = await window.electron.ipcRenderer.invoke('actualizarjson', datosJSON);
    toast.add({ severity: 'success', summary: 'OK', detail: 'Datos Actualizados', life: 3000 });
  } catch (error) {
    console.error("Error sending data to Electron:", error);
    toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to update data', life: 3000 });
  }

}
/*********************************************/
const fnCodeNSU = async()=>{
    tokenUnSoloUso.value = Math.floor(1000 + Math.random() * 9000).toString();
}
/*********************************************/
const fnGuardarCodeNSU = async()=>{
const datosJSON = await envioElectron('datosarchivo');
  datosJSON.VITE_TOKEN_SOLOUSO = tokenUnSoloUso.value;
  try {
    const envioDatosJSON = await window.electron.ipcRenderer.invoke('actualizarjson', datosJSON);
    toast.add({ severity: 'success', summary: 'OK', detail: 'Datos Actualizados', life: 3000 });
  } catch (error) {
    console.error("Error sending data to Electron:", error);
    toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to update data', life: 3000 });
  }

}
/*********************************************/
const fnCodeN24H = async()=>{
    token24Horas.value = Math.floor(1000 + Math.random() * 9000).toString();
}
/*********************************************/
const fnGuardarCodeN24H = async()=>{
const datosJSON = await envioElectron('datosarchivo');
  datosJSON.VITE_TOKEN_24H = token24Horas.value;
  try {
    const envioDatosJSON = await window.electron.ipcRenderer.invoke('actualizarjson', datosJSON);
    toast.add({ severity: 'success', summary: 'OK', detail: 'Datos Actualizados', life: 3000 });
  } catch (error) {
    console.error("Error sending data to Electron:", error);
    toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to update data', life: 3000 });
  }

}
/*********************************************/
const guardarTokensSistema = async () => {
  try {
    const datosJSON = await envioElectron('datosarchivo');
    datosJSON.VITE_TOKEN = token.value;
    datosJSON.VITE_TOKEN_CORTO = tokenCorto.value;
    datosJSON.VITE_TOKEN_24H = token24Horas.value;

    const clonedData = JSON.parse(JSON.stringify(datosJSON));
    await window.electron.ipcRenderer.invoke('actualizarjson', clonedData);

    tokenCifrado.value = await encryptarPassword(token.value, 10);

    toast.add({ severity: 'success', summary: 'OK', detail: 'Tokens actualizados correctamente', life: 3000 });
  } catch (error) {
    console.error('Error actualizando tokens del sistema:', error);
    toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron actualizar los tokens', life: 3000 });
  }
}
/*********************************************/
function obtenerNombreArchivo(rutaCompleta) {
  return rutaCompleta.split(/[\\/]/).pop();
}
/*********************************************/
const deleteImage = async(ruta,imagen) => {
  const url = link.value+api.value+"/borrararchivo";
  const datos = {
    ruta:'../vista/img/empresa/'+ruta,
    archivo:obtenerNombreArchivo(imagen),
  }
  const envioDatos = await enviarDatosPorPost(url, datos,tokenCifrado.value);

    if (envioDatos[0] == 'ok') {
    
    await fetchEmpresa()

       toast.add({ severity: 'success', summary: 'Éxito', detail: 'Imagen Borrada', life: 3000 });
    }else{
      toast.add({ severity: 'error', summary: 'Error', detail: 'Fallo al Borrar la Imagen.', life: 3000 });
    }


};
  const handleUploadSuccess = async(result) => {
   await fetchEmpresa()
};
/*********************************************/
/*********************************************/
const handleUpload = async (event) => {
  const archivos = event.files;
  const ruta = 'imagenes/empresa/'+empresaData.value[0].imagen;
  for (const archivo of archivos) {
    const reader = new FileReader();
    reader.onload = async () => {
      const buffer = reader.result;
      const byteArray = Array.from(new Uint8Array(buffer));
      try {
        const respuesta = await window.electron.ipcRenderer.invoke(
          'consultaservidor',
          'subirArchivo', // este es el nombre de la función registrada en tu objeto `servidor`
          ruta,
          archivo.name,
          byteArray
        );
        if (respuesta.success) {
            imagenesEmpresa.value = await peticionesFetchOffline('listarArchivosDeCarpeta', `empresa/${empresaData.value[0].imagen}`);
          console.log('✅ Archivo guardado:', respuesta.path);
          // Aquí puedes mostrar un toast o alerta de éxito si usas PrimeVue o SweetAlert
        } else {
          console.error('❌ Error al guardar:', respuesta.message);
          // Mostrar alerta de error aquí
        }
      } catch (err) {
        console.error('❌ Error invocando consultaservidor:', err);
        // Mostrar alerta de error general
      }
    };
    reader.readAsArrayBuffer(archivo);
  }
};
/*********************************************/
const fnStockAlmacen = async () => {
  const { value: password } = await Swal.fire({
    title: 'Trayendo inventario del almacén',
    text: 'Por favor, ingresa la contraseña para continuar',
    input: 'password',
    inputPlaceholder: 'Ingresa tu contraseña',
    showCancelButton: true,
    confirmButtonText: 'Continuar',
    cancelButtonText: 'Cancelar',
    inputAttributes: {
      maxlength: 10,
      autocapitalize: 'off',
      autocorrect: 'off'
    },
    preConfirm: (password) => {
      if (!password) {
        Swal.showValidationMessage('Por favor, ingresa la contraseña');
      }
    }
  });

  if (password === token.value || password === tokenCorto.value || password === tokenUnSoloUso.value || password === token24Horas.value) {
   // const nURL = 'https://jrsimport.mrsolutionrd.com/api';
    const nURL = linkInventario.value;
    loading.value = true;

    try {
      const productosAlmacen = await peticionesFetch(
        `${nURL}`,
        `datosarray/productos/${token.value}`,
        { tabla: 'productos' },
        tokenCifrado.value,
        'GET'
      );

      const productosLocal = await peticionesFetch(
        `${link.value}${api.value}`,
        `datosarray/productos`,
        {},
        tokenCifrado.value,
        'GET'
      );

      const camposProductos = await arrayToObjetoFromTablaOffline('productos');
      const urlActualizar = link.value + api.value + "/actualizarcampos/productos";
      const urlCrear = link.value + api.value + "/insertar/productos";

      for (let producto of productosAlmacen) {
        const buscarProducto = productosLocal.find(prod => prod.codigo === producto.codigo);

        if (buscarProducto) {
          if (buscarProducto.hasOwnProperty('created_at')) {
            buscarProducto.updated_at = nfecha('timestamp');
          }
          buscarProducto.stock = producto.stock;
          if (buscarProducto.tipo_impuesto == '') {
              buscarProducto.tipo_impuesto = 'Incluido'
              producto.impuestos = '18.00'
          }
/*          const envioDatosUpdate = await enviarDatosPorPost(urlActualizar, buscarProducto, tokenCifrado.value);*/
          const envioDatosUpdate = await peticionesFetchOffline('updateData','productos', JSON.stringify(buscarProducto));

        } else {
          delete producto.id
          if (producto.alerta == '') {
            producto.alerta = '1'
          }
          producto.tipo_impuesto = 'Incluido'
          producto.impuestos = '18.00'
          const nuevoProducto = { ...camposProductos, ...producto };
          nuevoProducto.almacen = datosEmpresaStore.empresa.nombre
          const envioDatosCreate = await peticionesFetchOffline('insertData','productos', JSON.stringify(nuevoProducto));
        }
      }

      loading.value = false;
    } catch (error) {
      loading.value = false;
      toast.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to fetch data from productos',
        life: 3000
      });
    }
  } else {
    Swal.fire('Operación cancelada', 'No se ingresó la contraseña correcta', 'error');
  }
};

const fnStockTienda = async()=>{

}

/******************************************************
 * VALIDAR, ACTUALIZAR JSON Y REINICIAR APP
 ******************************************************/
const verificarYGuardarLicencia = async () => {
/*  if (licenciaNueva.value.length !== 17) {
    Swal.fire({
      icon: "error",
      title: "Formato inválido",
      text: "La licencia debe tener exactamente 17 caracteres.",
      timer: 3000,
      toast: true,
      position: "top-end",
      showConfirmButton: false
    });
    return;
  }*/

  Swal.fire({
    title: "Validando licencia...",
    text: "Por favor espere",
    allowOutsideClick: false,
    didOpen: () => Swal.showLoading()
  });

  try {
    // Datos del JSON
    const datosJSON = await envioElectron("datosarchivo");

    // Petición al servidor para validar licencia
    const response = await peticionesFetch(
      "https://master.tmposrd.com" + api.value,
      `datoscampo/empresas/licencia/${licenciaNueva.value}`,
      {},
      tokenCifrado.value,
      "GET"
    );

    if (!response.id) {
      Swal.fire("Licencia inválida", "No se encontró esta licencia.", "error");
      return;
    }

    // Actualizar JSON local con datos del servidor
    datosJSON.VITE_LINKURL = response.link.replace(/\/$/, "");
    datosJSON.almacen = response.nombre;
    datosJSON.VITE_LICENCIA = licenciaNueva.value;

    const clonedData = JSON.parse(JSON.stringify(datosJSON));
    await window.electron.ipcRenderer.invoke("actualizarjson", clonedData);

    Swal.fire("Licencia activada", "La licencia fue verificada correctamente.", "success");

    licenciaActual.value = licenciaNueva.value;

    // Reiniciar sesión para entrar a login
    await cerrarSession();
    router.push("/login");

  } catch (error) {
    console.error(error);
    Swal.fire("Error", "No se pudo verificar la licencia.", "error");
  }
};


</script>
<style scoped>
/* ═══════════════════════════════════════════════════════════
   🎨 ANIMACIONES GLOBALES
   ═══════════════════════════════════════════════════════════ */

@keyframes animate-spin-slow {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.animate-spin-slow {
  animation: animate-spin-slow 20s linear infinite;
}

/* ═══════════════════════════════════════════════════════════
   📑 TABS PERSONALIZADOS
   ═══════════════════════════════════════════════════════════ */

.config-tabs :deep(.p-tabview-nav) {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 1rem 1rem 0 0;
  padding: 0.5rem;
  border: none;
}

.config-tabs :deep(.p-tabview-nav-link) {
  background: rgba(255, 255, 255, 0.1);
  border: 2px solid transparent;
  color: rgba(255, 255, 255, 0.7);
  border-radius: 0.75rem;
  margin: 0 0.25rem;
  padding: 1rem 1.5rem;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  font-weight: 600;
}

.config-tabs :deep(.p-tabview-nav-link:hover) {
  background: rgba(255, 255, 255, 0.2);
  color: white;
  transform: translateY(-2px);
}

.config-tabs :deep(.p-highlight .p-tabview-nav-link) {
  background: white;
  color: #667eea;
  border-color: white;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
}

.config-tabs :deep(.p-tabview-panels) {
  background: transparent;
  border: none;
  padding: 2rem 0;
}

/* ═══════════════════════════════════════════════════════════
   🎯 PANELS MODERNOS
   ═══════════════════════════════════════════════════════════ */

.modern-panel {
  border-radius: 1.5rem !important;
  border: 2px solid transparent;
  background: white;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
}

.modern-panel:hover {
  border-color: rgba(99, 102, 241, 0.3);
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  transform: translateY(-4px);
}

.modern-panel :deep(.p-panel-header) {
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
  border-bottom: 2px solid #e2e8f0;
  padding: 1.5rem;
  border-radius: 1.5rem 1.5rem 0 0 !important;
}

:deep(.dark) .modern-panel {
  background: #1f2937;
  border-color: #374151;
}

:deep(.dark) .modern-panel :deep(.p-panel-header) {
  background: linear-gradient(135deg, #1f2937 0%, #111827 100%);
  border-bottom-color: #374151;
}

.modern-panel :deep(.p-panel-content) {
  padding: 0;
}

/* ═══════════════════════════════════════════════════════════
   📝 FLOAT LABELS
   ═══════════════════════════════════════════════════════════ */

:deep(.p-float-label) {
  margin-top: 1.5rem;
}

:deep(.p-float-label label) {
  font-weight: 600;
  color: #6b7280;
  transition: all 0.3s ease;
}

:deep(.p-float-label input:focus ~ label),
:deep(.p-float-label input.p-filled ~ label),
:deep(.p-float-label textarea:focus ~ label),
:deep(.p-float-label textarea.p-filled ~ label) {
  color: #3b82f6;
  font-size: 0.875rem;
}

/* ═══════════════════════════════════════════════════════════
   📤 FILE UPLOAD MODERNO
   ═══════════════════════════════════════════════════════════ */

.modern-file-upload :deep(.p-fileupload) {
  border: none;
  background: transparent;
}

.modern-file-upload :deep(.p-fileupload-choose) {
  background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
  border: none;
  padding: 1rem 2rem;
  font-size: 1.125rem;
  font-weight: 700;
  border-radius: 1rem;
  box-shadow: 0 10px 15px -3px rgba(59, 130, 246, 0.4);
  transition: all 0.3s ease;
}

.modern-file-upload :deep(.p-fileupload-choose:hover) {
  transform: translateY(-3px) scale(1.05);
  box-shadow: 0 20px 25px -5px rgba(59, 130, 246, 0.5);
}

/* ═══════════════════════════════════════════════════════════
   🖼️ DIVIDER PERSONALIZADO
   ═══════════════════════════════════════════════════════════ */

:deep(.p-divider) {
  margin: 2rem 0;
}

:deep(.p-divider::before),
:deep(.p-divider::after) {
  border-top: 2px solid #e5e7eb;
}

:deep(.dark .p-divider::before),
:deep(.dark .p-divider::after) {
  border-top-color: #374151;
}

/* ═══════════════════════════════════════════════════════════
   🎨 INPUTS MEJORADOS
   ═══════════════════════════════════════════════════════════ */

:deep(.p-inputtext),
:deep(.p-inputnumber-input),
:deep(.p-dropdown),
:deep(.p-calendar),
:deep(.p-textarea) {
  border-radius: 0.75rem;
  border-width: 2px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

:deep(.p-inputtext:enabled:hover),
:deep(.p-dropdown:not(.p-disabled):hover),
:deep(.p-calendar:not(.p-disabled):hover .p-inputtext),
:deep(.p-textarea:enabled:hover) {
  border-color: #93c5fd;
}

:deep(.p-inputtext:enabled:focus),
:deep(.p-dropdown:not(.p-disabled).p-focus),
:deep(.p-calendar:not(.p-disabled).p-inputwrapper-focus .p-inputtext),
:deep(.p-textarea:enabled:focus) {
  box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1), 0 4px 6px -1px rgba(59, 130, 246, 0.2);
  border-color: #3b82f6;
}

/* ═══════════════════════════════════════════════════════════
   🔘 BOTONES MEJORADOS
   ═══════════════════════════════════════════════════════════ */

:deep(.p-button) {
  border-radius: 0.75rem;
  font-weight: 600;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border-width: 2px;
}

:deep(.p-button:not(.p-button-outlined):not(.p-button-text)) {
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
}

:deep(.p-button:hover) {
  transform: translateY(-2px);
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.2), 0 4px 6px -2px rgba(0, 0, 0, 0.1);
}

:deep(.p-button:active) {
  transform: translateY(0);
}

/* ═══════════════════════════════════════════════════════════
   📊 SELECT BUTTON
   ═══════════════════════════════════════════════════════════ */

:deep(.p-selectbutton .p-button) {
  border-radius: 0.5rem;
  margin: 0 0.125rem;
}

:deep(.p-selectbutton .p-highlight) {
  background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
  box-shadow: 0 4px 6px -1px rgba(59, 130, 246, 0.4);
}

/* ═══════════════════════════════════════════════════════════
   🌓 DARK MODE
   ═══════════════════════════════════════════════════════════ */

:deep(.dark) .config-tabs :deep(.p-tabview-nav) {
  background: linear-gradient(135deg, #4c1d95 0%, #581c87 100%);
}

:deep(.dark) .config-tabs :deep(.p-highlight .p-tabview-nav-link) {
  background: #1f2937;
  color: #60a5fa;
}

/* ═══════════════════════════════════════════════════════════
   📱 RESPONSIVE
   ═══════════════════════════════════════════════════════════ */

@media (max-width: 768px) {
  .config-tabs :deep(.p-tabview-nav-link) {
    padding: 0.75rem 1rem;
    font-size: 0.875rem;
  }

  .modern-panel :deep(.p-panel-header) {
    padding: 1rem;
  }

  :deep(.p-float-label) {
    margin-top: 1.25rem;
  }
}

/* ═══════════════════════════════════════════════════════════
   ✨ ANIMACIONES ADICIONALES
   ═══════════════════════════════════════════════════════════ */

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.modern-panel {
  animation: fadeIn 0.6s ease-out;
}

.modern-panel:nth-child(1) { animation-delay: 0.1s; }
.modern-panel:nth-child(2) { animation-delay: 0.2s; }
.modern-panel:nth-child(3) { animation-delay: 0.3s; }
</style>
