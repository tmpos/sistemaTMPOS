<template>
  <main class="content-wrapper bg-gray-50 min-h-screen">
    <div class="w-full px-4 py-6">
      <!-- Header -->
      <div class="mb-6">
        <h1 class="text-3xl font-bold text-gray-800 mb-2">Centro de Ayuda y Tutoriales</h1>
        <p class="text-gray-600">Aprende a usar todas las funcionalidades del sistema</p>
      </div>

      <!-- Buscador -->
      <div class="mb-6">
        <div class="relative">
          <i class="pi pi-search absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Busca tutoriales, guías o preguntas frecuentes..."
            class="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      <!-- Tabs de navegación -->
      <div class="mb-6">
        <div class="flex flex-wrap gap-2 border-b border-gray-200">
          <button
            v-for="tab in tabs"
            :key="tab.id"
            @click="activeTab = tab.id"
            :class="[
              'px-4 py-2 font-medium text-sm transition-all',
              activeTab === tab.id
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-600 hover:text-blue-600'
            ]"
          >
            <i :class="tab.icon + ' mr-2'"></i>
            {{ tab.label }}
          </button>
        </div>
      </div>

      <!-- Contenido de Videos -->
      <div v-show="activeTab === 'videos'">
        <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          <div
            v-for="video in filteredVideos"
            :key="video.id"
            class="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow"
          >
            <!-- Thumbnail clickeable -->
            <div class="relative pb-[56.25%] cursor-pointer group" @click="abrirVideoModal(video)">
              <img
                :src="`https://img.youtube.com/vi/${video.link}/maxresdefault.jpg`"
                :alt="video.nombre"
                class="absolute top-0 left-0 w-full h-full object-cover"
                @error="$event.target.src = `https://img.youtube.com/vi/${video.link}/hqdefault.jpg`"
              />
              <!-- Overlay con botón de play -->
              <div class="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center group-hover:bg-opacity-50 transition-all">
                <div class="w-20 h-20 bg-red-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                  <i class="pi pi-play text-white text-3xl ml-1"></i>
                </div>
              </div>
              <!-- Badge de duración -->
              <div class="absolute bottom-2 right-2 bg-black bg-opacity-80 text-white text-xs px-2 py-1 rounded">
                {{ video.duracion }}
              </div>
            </div>
            <div class="p-4">
              <h3 class="font-semibold text-gray-800 mb-2">{{ video.nombre }}</h3>
              <p class="text-sm text-gray-600 mb-3">{{ video.descripcion }}</p>
              <div class="flex items-center justify-between">
                <span class="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">{{ video.categoria }}</span>
                <button
                  @click="abrirVideoModal(video)"
                  class="text-xs text-blue-600 hover:text-blue-800 font-medium"
                >
                  Ver Tutorial →
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Contenido de Documentación -->
      <div v-show="activeTab === 'docs'">
        <div class="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <!-- Sidebar de categorías -->
          <div class="lg:col-span-1">
            <Card class="sticky top-4">
              <template #content>
                <h3 class="font-semibold mb-3">Categorías</h3>
                <div class="space-y-1">
                  <button
                    v-for="cat in categoriasDocs"
                    :key="cat.id"
                    @click="selectedCategory = cat.id"
                    :class="[
                      'w-full text-left px-3 py-2 rounded-md transition-colors text-sm',
                      selectedCategory === cat.id
                        ? 'bg-blue-100 text-blue-700 font-medium'
                        : 'text-gray-700 hover:bg-gray-100'
                    ]"
                  >
                    <i :class="cat.icon + ' mr-2'"></i>
                    {{ cat.nombre }}
                  </button>
                </div>
              </template>
            </Card>
          </div>

          <!-- Contenido de documentación -->
          <div class="lg:col-span-3">
            <Card>
              <template #content>
                <div v-for="doc in filteredDocs" :key="doc.id" class="mb-6">
                  <h2 class="text-2xl font-bold text-gray-800 mb-3">{{ doc.titulo }}</h2>
                  <div class="prose max-w-none" v-html="doc.contenido"></div>

                  <!-- Pasos si existen -->
                  <div v-if="doc.pasos && doc.pasos.length > 0" class="mt-4">
                    <h3 class="text-lg font-semibold mb-3">Pasos a seguir:</h3>
                    <div class="space-y-3">
                      <div
                        v-for="(paso, index) in doc.pasos"
                        :key="index"
                        class="flex gap-3 p-3 bg-gray-50 rounded-lg"
                      >
                        <div class="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                          {{ index + 1 }}
                        </div>
                        <div>
                          <h4 class="font-medium text-gray-800">{{ paso.titulo }}</h4>
                          <p class="text-sm text-gray-600 mt-1">{{ paso.descripcion }}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </template>
            </Card>
          </div>
        </div>
      </div>

      <!-- Contenido de FAQs -->
      <div v-show="activeTab === 'faqs'">
        <div class="max-w-4xl mx-auto">
          <div class="space-y-3">
            <div
              v-for="faq in filteredFaqs"
              :key="faq.id"
              class="bg-white rounded-lg shadow-sm overflow-hidden"
            >
              <button
                @click="toggleFaq(faq.id)"
                class="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
              >
                <span class="font-medium text-gray-800 text-left">{{ faq.pregunta }}</span>
                <i
                  :class="[
                    'pi transition-transform',
                    faqsOpen.includes(faq.id) ? 'pi-chevron-up' : 'pi-chevron-down'
                  ]"
                ></i>
              </button>
              <div
                v-show="faqsOpen.includes(faq.id)"
                class="px-6 py-4 bg-gray-50 border-t border-gray-200"
              >
                <p class="text-gray-700">{{ faq.respuesta }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Contenido de Guías Rápidas -->
      <div v-show="activeTab === 'guias'">
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div
            v-for="guia in filteredGuias"
            :key="guia.id"
            class="bg-white rounded-lg shadow-md p-6 hover:shadow-xl transition-shadow cursor-pointer"
            @click="abrirGuiaModal(guia)"
          >
            <div class="flex items-start gap-4">
              <div :class="['w-12 h-12 rounded-lg flex items-center justify-center', guia.color]">
                <i :class="guia.icon + ' text-2xl text-white'"></i>
              </div>
              <div class="flex-1">
                <h3 class="font-semibold text-gray-800 mb-2">{{ guia.titulo }}</h3>
                <p class="text-sm text-gray-600 mb-3">{{ guia.descripcion }}</p>
                <span class="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                  {{ guia.tiempoEstimado }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Modal de Video -->
      <Dialog
        v-model:visible="videoModalVisible"
        :style="{ width: '90vw', maxWidth: '1200px', height: '85vh' }"
        :breakpoints="{ '960px': '95vw' }"
        modal
        @hide="cerrarVideoModal"
      >
        <template #header>
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 bg-red-600 rounded-lg flex items-center justify-center">
              <i class="pi pi-youtube text-xl text-white"></i>
            </div>
            <div class="flex-1">
              <span class="font-bold text-lg">{{ videoSeleccionado?.nombre }}</span>
              <p class="text-sm text-gray-600 mt-1">{{ videoSeleccionado?.descripcion }}</p>
            </div>
          </div>
        </template>

        <div v-if="videoSeleccionado" class="space-y-4">
          <!-- Preview del video -->
          <div class="relative rounded-lg overflow-hidden cursor-pointer group" @click="confirmarAbrirVideo">
            <img
              :src="`https://img.youtube.com/vi/${videoSeleccionado.link}/maxresdefault.jpg`"
              :alt="videoSeleccionado.nombre"
              class="w-full h-auto"
              @error="$event.target.src = `https://img.youtube.com/vi/${videoSeleccionado.link}/hqdefault.jpg`"
            />
            <!-- Overlay oscuro -->
            <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent flex flex-col items-center justify-center group-hover:from-black/90 transition-all">
              <!-- Botón de play grande -->
              <div class="w-24 h-24 bg-red-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform shadow-2xl mb-4">
                <i class="pi pi-play text-white text-5xl ml-2"></i>
              </div>
              <!-- Texto -->
              <div class="text-center px-4">
                <p class="text-white text-xl font-bold mb-2">Ver en YouTube</p>
                <p class="text-white/80 text-sm">Haz clic para abrir el video</p>
              </div>
            </div>
            <!-- Badge de duración -->
            <div class="absolute top-4 right-4 bg-black/90 text-white px-3 py-1.5 rounded-lg font-semibold">
              <i class="pi pi-clock mr-1"></i>
              {{ videoSeleccionado.duracion }}
            </div>
          </div>

          <!-- Información del video -->
          <div class="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200">
            <div class="flex items-start gap-3">
              <div class="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                <i class="pi pi-youtube text-white text-2xl"></i>
              </div>
              <div class="flex-1">
                <h3 class="font-bold text-gray-800 mb-1">{{ videoSeleccionado.nombre }}</h3>
                <p class="text-sm text-gray-600 mb-2">{{ videoSeleccionado.descripcion }}</p>
                <div class="flex items-center gap-3 flex-wrap">
                  <span class="text-xs bg-blue-600 text-white px-2 py-1 rounded-full">
                    <i class="pi pi-tag mr-1"></i>
                    {{ videoSeleccionado.categoria }}
                  </span>
                  <span class="text-xs text-gray-600">
                    <i class="pi pi-eye mr-1"></i>
                    Tutorial en video
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- Llamado a la acción -->
          <div class="bg-gradient-to-r from-red-500 to-red-600 rounded-lg p-6 text-center text-white shadow-lg">
            <i class="pi pi-youtube text-5xl mb-3 opacity-90"></i>
            <h4 class="text-xl font-bold mb-2">¡Aprende con este tutorial!</h4>
            <p class="text-red-100 mb-4">El video se abrirá en YouTube en tu navegador predeterminado</p>
            <Button
              label="Ver Tutorial Completo"
              icon="pi pi-external-link"
              severity="contrast"
              size="large"
              class="w-full"
              @click="confirmarAbrirVideo"
            />
          </div>
        </div>

        <template #footer>
          <div class="flex gap-2 justify-end w-full">
            <Button
              label="Cerrar"
              icon="pi pi-times"
              severity="secondary"
              outlined
              @click="videoModalVisible = false"
            />
          </div>
        </template>
      </Dialog>

      <!-- Modal de Guía Detallada -->
      <Dialog
        v-model:visible="guiaModalVisible"
        :style="{ width: '800px' }"
        :breakpoints="{ '960px': '90vw' }"
        modal
      >
        <template #header>
          <div class="flex items-center gap-3">
            <div v-if="guiaSeleccionada" :class="['w-10 h-10 rounded-lg flex items-center justify-center', guiaSeleccionada.color]">
              <i :class="guiaSeleccionada.icon + ' text-xl text-white'"></i>
            </div>
            <span class="font-bold text-lg">{{ guiaSeleccionada?.titulo }}</span>
          </div>
        </template>

        <div v-if="guiaSeleccionada" class="space-y-4">
          <p class="text-gray-700">{{ guiaSeleccionada.descripcion }}</p>

          <div class="space-y-4">
            <div
              v-for="(paso, index) in guiaSeleccionada.pasos"
              :key="index"
              class="flex gap-4 p-4 bg-gray-50 rounded-lg"
            >
              <div class="flex-shrink-0 w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                {{ index + 1 }}
              </div>
              <div class="flex-1">
                <h4 class="font-semibold text-gray-800 mb-2">{{ paso.titulo }}</h4>
                <p class="text-gray-600 text-sm">{{ paso.descripcion }}</p>
                <div v-if="paso.nota" class="mt-2 p-2 bg-yellow-50 border-l-4 border-yellow-400 text-sm text-yellow-800">
                  <i class="pi pi-info-circle mr-1"></i>
                  {{ paso.nota }}
                </div>
              </div>
            </div>
          </div>
        </div>

        <template #footer>
          <Button label="Cerrar" @click="guiaModalVisible = false" />
        </template>
      </Dialog>

      <Toast />
    </div>
  </main>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { envioElectron } from '../../funciones/funciones.js';
import { useDatosEmpresa } from '../../stores';
import { useToast } from "primevue/usetoast";

const toast = useToast();
const datosEmpresa = useDatosEmpresa();

const searchQuery = ref('');
const activeTab = ref('videos');
const selectedCategory = ref('inicio');
const faqsOpen = ref([]);
const guiaModalVisible = ref(false);
const guiaSeleccionada = ref(null);
const videoModalVisible = ref(false);
const videoSeleccionado = ref(null);

const link = ref(null);
const api = ref(null);
const token = ref(null);

/************************************************************************/
const tabs = [
  { id: 'videos', label: 'Videos Tutoriales', icon: 'pi pi-youtube' },
  { id: 'docs', label: 'Documentación', icon: 'pi pi-book' },
  { id: 'guias', label: 'Guías Rápidas', icon: 'pi pi-directions' },
  { id: 'faqs', label: 'Preguntas Frecuentes', icon: 'pi pi-question-circle' }
];

/************************************************************************/
const videos = ref([
  {
    id: 1,
    nombre: 'Introducción al Sistema',
    link: 'tULsFIw46SM',
    descripcion: 'Conoce las funcionalidades principales del sistema POS',
    categoria: 'Introducción',
    duracion: '5:30'
  },
  {
    id: 2,
    nombre: 'Instalación del Sistema',
    link: 'rbduNdAvJms',
    descripcion: 'Guía paso a paso para instalar TMPOS en tu computadora',
    categoria: 'Configuración',
    duracion: '8:45'
  },
  {
    id: 3,
    nombre: 'Crear Productos',
    link: 'njeh8Rqq2uQ',
    descripcion: 'Aprende a registrar productos con precios, categorías e imágenes',
    categoria: 'Productos',
    duracion: '12:20'
  },
  {
    id: 4,
    nombre: 'Área de Ventas - Parte 1',
    link: 'MKjhFyPp_Bw',
    descripcion: 'Características principales del módulo de ventas',
    categoria: 'Ventas',
    duracion: '10:15'
  },
  {
    id: 5,
    nombre: 'Área de Ventas - Parte 2',
    link: '1hrK4-z7XrE',
    descripcion: 'Funciones avanzadas de facturación y métodos de pago',
    categoria: 'Ventas',
    duracion: '11:30'
  }
]);

/************************************************************************/
const categoriasDocs = [
  { id: 'inicio', nombre: 'Inicio Rápido', icon: 'pi pi-bolt' },
  { id: 'pos', nombre: 'Punto de Venta', icon: 'pi pi-shopping-cart' },
  { id: 'productos', nombre: 'Productos', icon: 'pi pi-box' },
  { id: 'clientes', nombre: 'Clientes', icon: 'pi pi-users' },
  { id: 'reportes', nombre: 'Reportes', icon: 'pi pi-chart-bar' },
  { id: 'configuracion', nombre: 'Configuración', icon: 'pi pi-cog' }
];

/************************************************************************/
const documentacion = ref([
  {
    id: 1,
    categoria: 'inicio',
    titulo: 'Bienvenido al Sistema POS',
    contenido: `
      <p class="text-gray-700 mb-4">Este sistema de punto de venta (POS) está diseñado para facilitar la gestión completa de tu negocio. Con una interfaz intuitiva y moderna, podrás:</p>
      <ul class="list-disc list-inside space-y-2 text-gray-700 mb-4">
        <li>Registrar ventas de forma rápida y eficiente</li>
        <li>Gestionar inventario de productos</li>
        <li>Administrar clientes y proveedores</li>
        <li>Generar reportes detallados</li>
        <li>Controlar gastos e ingresos</li>
      </ul>
      <p class="text-gray-700">El sistema funciona de manera offline, por lo que no necesitas conexión a internet para operar.</p>
    `,
    pasos: [
      {
        titulo: 'Primer inicio',
        descripcion: 'Al abrir el sistema por primera vez, configura los datos de tu empresa en Configuración > Empresa'
      },
      {
        titulo: 'Agregar productos',
        descripcion: 'Ve a la sección Productos y comienza a registrar tu inventario con precios y categorías'
      },
      {
        titulo: 'Realizar tu primera venta',
        descripcion: 'Accede al módulo POS y selecciona productos para generar tu primera factura'
      }
    ]
  },
  {
    id: 2,
    categoria: 'pos',
    titulo: 'Cómo usar el Punto de Venta (POS)',
    contenido: `
      <p class="text-gray-700 mb-4">El módulo POS es el corazón del sistema. Aquí realizarás todas tus ventas diarias de manera rápida y eficiente.</p>
      <h4 class="font-semibold text-gray-800 mb-2">Componentes principales:</h4>
      <ul class="list-disc list-inside space-y-2 text-gray-700 mb-4">
        <li><strong>Sidebar de categorías:</strong> Filtra productos por categoría</li>
        <li><strong>Buscador:</strong> Busca productos por nombre o código de barras</li>
        <li><strong>Grilla de productos:</strong> Visualiza todos los productos disponibles</li>
        <li><strong>Carrito:</strong> Revisa los productos agregados y las cantidades</li>
      </ul>
    `,
    pasos: [
      {
        titulo: 'Seleccionar productos',
        descripcion: 'Haz clic en cualquier producto de la grilla para agregarlo al carrito'
      },
      {
        titulo: 'Ajustar cantidad y extras',
        descripcion: 'En el modal que aparece, selecciona la cantidad y extras si aplica'
      },
      {
        titulo: 'Revisar carrito',
        descripcion: 'Verifica las cantidades y totales en el panel derecho'
      },
      {
        titulo: 'Procesar venta',
        descripcion: 'Haz clic en "Submit" para procesar el pago y completar la venta'
      },
      {
        titulo: 'Seleccionar método de pago',
        descripcion: 'Elige entre efectivo, tarjeta, transferencia o pago mixto'
      }
    ]
  },
  {
    id: 3,
    categoria: 'productos',
    titulo: 'Gestión de Productos',
    contenido: `
      <p class="text-gray-700 mb-4">La gestión de productos es fundamental para el correcto funcionamiento del sistema.</p>
      <h4 class="font-semibold text-gray-800 mb-2">Información requerida:</h4>
      <ul class="list-disc list-inside space-y-2 text-gray-700 mb-4">
        <li><strong>Código:</strong> Identificador único (puede ser código de barras)</li>
        <li><strong>Nombre:</strong> Nombre descriptivo del producto</li>
        <li><strong>Categoría:</strong> Clasificación para organizar el inventario</li>
        <li><strong>Precio de compra:</strong> Costo de adquisición</li>
        <li><strong>Precio de venta:</strong> Precio al público</li>
        <li><strong>Stock:</strong> Cantidad disponible</li>
        <li><strong>Imagen:</strong> Foto del producto (opcional pero recomendado)</li>
      </ul>
    `,
    pasos: [
      {
        titulo: 'Acceder al módulo de productos',
        descripcion: 'Desde el menú principal, haz clic en "Productos"'
      },
      {
        titulo: 'Crear nuevo producto',
        descripcion: 'Haz clic en el botón "Nuevo Producto" en la esquina superior derecha'
      },
      {
        titulo: 'Completar formulario',
        descripcion: 'Rellena todos los campos obligatorios marcados con asterisco (*)'
      },
      {
        titulo: 'Agregar imagen',
        descripcion: 'Haz clic en "Subir imagen" y selecciona una foto del producto'
      },
      {
        titulo: 'Guardar',
        descripcion: 'Haz clic en "Guardar" para registrar el producto en el sistema'
      }
    ]
  },
  {
    id: 4,
    categoria: 'clientes',
    titulo: 'Administración de Clientes',
    contenido: `
      <p class="text-gray-700 mb-4">Mantén un registro organizado de tus clientes para mejorar la atención y generar reportes personalizados.</p>
      <h4 class="font-semibold text-gray-800 mb-2">Datos importantes:</h4>
      <ul class="list-disc list-inside space-y-2 text-gray-700 mb-4">
        <li><strong>Nombre completo:</strong> Identificación del cliente</li>
        <li><strong>Cédula/RNC:</strong> Documento de identidad (opcional para comprobantes fiscales)</li>
        <li><strong>Teléfono:</strong> Para contacto y envío de facturas por WhatsApp</li>
        <li><strong>Email:</strong> Para envío de facturas electrónicas</li>
        <li><strong>Dirección:</strong> Para entregas a domicilio</li>
      </ul>
    `,
    pasos: [
      {
        titulo: 'Ir a la sección de clientes',
        descripcion: 'Desde el menú, selecciona "Clientes"'
      },
      {
        titulo: 'Registrar nuevo cliente',
        descripcion: 'Haz clic en "Nuevo Cliente" y completa el formulario'
      },
      {
        titulo: 'Asignar en ventas',
        descripcion: 'Al realizar una venta, busca el cliente por nombre o teléfono'
      }
    ]
  },
  {
    id: 5,
    categoria: 'reportes',
    titulo: 'Reportes y Análisis',
    contenido: `
      <p class="text-gray-700 mb-4">El sistema ofrece múltiples reportes para analizar el desempeño de tu negocio.</p>
      <h4 class="font-semibold text-gray-800 mb-2">Tipos de reportes disponibles:</h4>
      <ul class="list-disc list-inside space-y-2 text-gray-700 mb-4">
        <li><strong>Reporte del día:</strong> Ventas, ganancias e impuestos del día actual</li>
        <li><strong>Reporte semanal:</strong> Análisis de los últimos 7 días</li>
        <li><strong>Reporte mensual:</strong> Estadísticas del mes en curso</li>
        <li><strong>Por rango de fechas:</strong> Selecciona un período personalizado</li>
        <li><strong>Por vendedor/cajero:</strong> Desempeño individual del personal</li>
        <li><strong>Por cliente:</strong> Historial de compras por cliente</li>
      </ul>
    `,
    pasos: [
      {
        titulo: 'Acceder a reportes',
        descripcion: 'Haz clic en "Reportes" en el menú principal'
      },
      {
        titulo: 'Seleccionar tipo de reporte',
        descripcion: 'Elige el reporte que necesitas consultar'
      },
      {
        titulo: 'Filtrar por fecha',
        descripcion: 'Si es necesario, selecciona el rango de fechas a analizar'
      },
      {
        titulo: 'Exportar o imprimir',
        descripcion: 'Usa los botones de acción para descargar o imprimir el reporte'
      }
    ]
  },
  {
    id: 6,
    categoria: 'configuracion',
    titulo: 'Configuración del Sistema',
    contenido: `
      <p class="text-gray-700 mb-4">Personaliza el sistema según las necesidades de tu negocio.</p>
      <h4 class="font-semibold text-gray-800 mb-2">Configuraciones disponibles:</h4>
      <ul class="list-disc list-inside space-y-2 text-gray-700 mb-4">
        <li><strong>Datos de empresa:</strong> Logo, nombre, RNC, dirección, teléfono</li>
        <li><strong>Impresora:</strong> Configuración de impresora térmica o normal</li>
        <li><strong>Comprobantes fiscales:</strong> Secuencias de NCF si aplica</li>
        <li><strong>Usuarios:</strong> Gestión de usuarios y permisos</li>
        <li><strong>Categorías:</strong> Crear y editar categorías de productos</li>
      </ul>
    `,
    pasos: [
      {
        titulo: 'Ir a configuración',
        descripcion: 'Haz clic en el ícono de engranaje o "Configuración"'
      },
      {
        titulo: 'Configurar empresa',
        descripcion: 'Completa los datos de tu empresa en la primera pestaña'
      },
      {
        titulo: 'Configurar impresora',
        descripcion: 'Selecciona el tipo de impresora y prueba la impresión'
      },
      {
        titulo: 'Crear usuarios',
        descripcion: 'Agrega usuarios con diferentes niveles de acceso si es necesario'
      }
    ]
  }
]);

/************************************************************************/
const faqs = ref([
  {
    id: 1,
    pregunta: '¿Cómo puedo agregar un producto nuevo?',
    respuesta: 'Ve al módulo de Productos, haz clic en "Nuevo Producto", completa el formulario con código, nombre, categoría, precios y stock, y haz clic en Guardar.',
    categoria: 'productos'
  },
  {
    id: 2,
    pregunta: '¿Puedo usar el sistema sin conexión a internet?',
    respuesta: 'Sí, el sistema funciona completamente offline. Todos los datos se almacenan localmente en tu computadora.',
    categoria: 'general'
  },
  {
    id: 3,
    pregunta: '¿Cómo cambio el precio de un producto?',
    respuesta: 'En la sección Productos, busca el producto, haz clic en editar, modifica el precio y guarda los cambios.',
    categoria: 'productos'
  },
  {
    id: 4,
    pregunta: '¿Cómo proceso una venta con descuento?',
    respuesta: 'En el módulo POS, agrega los productos al carrito, luego en el resumen verás la opción de aplicar descuento antes de completar la venta.',
    categoria: 'ventas'
  },
  {
    id: 5,
    pregunta: '¿Puedo aceptar pagos mixtos (efectivo + tarjeta)?',
    respuesta: 'Sí, al completar la venta, selecciona "Pago Mixto" y el sistema te permitirá dividir el monto entre diferentes métodos de pago.',
    categoria: 'ventas'
  },
  {
    id: 6,
    pregunta: '¿Cómo imprimo una factura?',
    respuesta: 'Después de completar una venta, aparecerá un modal con opciones. Haz clic en "Imprimir" para enviar la factura a tu impresora configurada.',
    categoria: 'ventas'
  },
  {
    id: 7,
    pregunta: '¿Cómo veo las ventas del día?',
    respuesta: 'Ve a Reportes > Reporte del Día. Allí verás un resumen completo de ventas, ganancias, impuestos y métodos de pago del día actual.',
    categoria: 'reportes'
  },
  {
    id: 8,
    pregunta: '¿Puedo exportar reportes a Excel?',
    respuesta: 'Sí, en la mayoría de reportes encontrarás un botón de descarga que te permite exportar los datos a formato Excel (.xlsx).',
    categoria: 'reportes'
  },
  {
    id: 9,
    pregunta: '¿Cómo agrego extras a un producto (ej. ingredientes adicionales)?',
    respuesta: 'Al editar un producto, en el campo "Características" puedes agregar extras en formato JSON con su nombre y precio adicional.',
    categoria: 'productos'
  },
  {
    id: 10,
    pregunta: '¿Cómo configuro mi impresora térmica?',
    respuesta: 'Ve a Configuración > Impresora, selecciona "Impresora Térmica", ingresa la dirección IP o puerto COM y prueba la conexión.',
    categoria: 'configuracion'
  }
]);

/************************************************************************/
const guias = ref([
  {
    id: 1,
    titulo: 'Primera Venta',
    descripcion: 'Aprende a realizar tu primera venta paso a paso',
    icon: 'pi pi-shopping-cart',
    color: 'bg-blue-600',
    tiempoEstimado: '3 minutos',
    pasos: [
      {
        titulo: 'Acceder al POS',
        descripcion: 'Desde el menú principal, haz clic en "POS" o "Punto de Venta"',
        nota: 'Asegúrate de tener productos registrados antes de empezar'
      },
      {
        titulo: 'Buscar o seleccionar producto',
        descripcion: 'Usa el buscador o navega por categorías para encontrar el producto que deseas vender'
      },
      {
        titulo: 'Agregar al carrito',
        descripcion: 'Haz clic en el producto. Se abrirá un modal donde podrás ajustar la cantidad y agregar extras si aplica'
      },
      {
        titulo: 'Revisar carrito',
        descripcion: 'En el panel derecho verás los productos agregados. Verifica que todo esté correcto'
      },
      {
        titulo: 'Completar venta',
        descripcion: 'Haz clic en "Submit". Selecciona el cliente (o deja "AL CONTADO"), elige el método de pago y confirma'
      },
      {
        titulo: 'Imprimir factura',
        descripcion: 'Después de completar, podrás imprimir el ticket o enviarlo por WhatsApp'
      }
    ]
  },
  {
    id: 2,
    titulo: 'Registrar Producto',
    descripcion: 'Guía para agregar productos al inventario',
    icon: 'pi pi-box',
    color: 'bg-green-600',
    tiempoEstimado: '5 minutos',
    pasos: [
      {
        titulo: 'Ir a Productos',
        descripcion: 'En el menú lateral, selecciona "Productos"'
      },
      {
        titulo: 'Nuevo producto',
        descripcion: 'Haz clic en el botón "Nuevo Producto" (esquina superior derecha)'
      },
      {
        titulo: 'Código del producto',
        descripcion: 'Ingresa un código único. Puedes usar el código de barras o crear uno alfanumérico'
      },
      {
        titulo: 'Información básica',
        descripcion: 'Completa nombre, categoría, descripción y características del producto'
      },
      {
        titulo: 'Precios y stock',
        descripcion: 'Ingresa el precio de compra, precio de venta y cantidad en stock'
      },
      {
        titulo: 'Agregar imagen',
        descripcion: 'Haz clic en "Subir imagen" y selecciona una foto clara del producto',
        nota: 'La imagen ayuda a identificar rápidamente el producto en el POS'
      },
      {
        titulo: 'Guardar',
        descripcion: 'Haz clic en "Guardar" para registrar el producto'
      }
    ]
  },
  {
    id: 3,
    titulo: 'Configurar Impresora',
    descripcion: 'Conecta y configura tu impresora para tickets',
    icon: 'pi pi-print',
    color: 'bg-purple-600',
    tiempoEstimado: '4 minutos',
    pasos: [
      {
        titulo: 'Acceder a configuración',
        descripcion: 'Haz clic en el ícono de engranaje o "Configuración" en el menú'
      },
      {
        titulo: 'Seleccionar tipo de impresora',
        descripcion: 'Elige entre impresora térmica (58mm o 80mm) o impresora normal',
        nota: 'Las impresoras térmicas son más rápidas y no requieren tinta'
      },
      {
        titulo: 'Configurar conexión',
        descripcion: 'Para USB: selecciona el puerto COM. Para red: ingresa la dirección IP'
      },
      {
        titulo: 'Probar impresión',
        descripcion: 'Haz clic en "Imprimir prueba" para verificar que funcione correctamente'
      },
      {
        titulo: 'Guardar configuración',
        descripcion: 'Si la prueba fue exitosa, guarda la configuración'
      }
    ]
  },
  {
    id: 4,
    titulo: 'Generar Reporte',
    descripcion: 'Consulta las ventas y estadísticas de tu negocio',
    icon: 'pi pi-chart-bar',
    color: 'bg-orange-600',
    tiempoEstimado: '2 minutos',
    pasos: [
      {
        titulo: 'Ir a Reportes',
        descripcion: 'En el menú principal, selecciona "Reportes"'
      },
      {
        titulo: 'Elegir tipo de reporte',
        descripcion: 'Selecciona entre: Hoy, Semanal, Mensual, o Por rango de fechas'
      },
      {
        titulo: 'Filtrar si es necesario',
        descripcion: 'Para reportes por rango, selecciona las fechas de inicio y fin'
      },
      {
        titulo: 'Ver estadísticas',
        descripcion: 'Revisa los gráficos y tablas con ventas, ganancias, impuestos, etc.'
      },
      {
        titulo: 'Exportar o imprimir',
        descripcion: 'Usa los botones de acción para descargar en Excel o imprimir el reporte'
      }
    ]
  },
  {
    id: 5,
    titulo: 'Gestionar Clientes',
    descripcion: 'Registra y administra tu base de clientes',
    icon: 'pi pi-users',
    color: 'bg-cyan-600',
    tiempoEstimado: '3 minutos',
    pasos: [
      {
        titulo: 'Acceder a Clientes',
        descripcion: 'En el menú, haz clic en "Clientes"'
      },
      {
        titulo: 'Nuevo cliente',
        descripcion: 'Haz clic en "Nuevo Cliente" para abrir el formulario de registro'
      },
      {
        titulo: 'Datos personales',
        descripcion: 'Completa nombre, cédula/RNC, teléfono y email del cliente'
      },
      {
        titulo: 'Datos adicionales',
        descripcion: 'Agrega dirección, ciudad y cualquier observación relevante',
        nota: 'El teléfono es importante para enviar facturas por WhatsApp'
      },
      {
        titulo: 'Guardar cliente',
        descripcion: 'Haz clic en "Guardar" para registrar al cliente en el sistema'
      },
      {
        titulo: 'Usar en ventas',
        descripcion: 'Al realizar una venta, busca al cliente por nombre o teléfono para asignarlo'
      }
    ]
  }
]);

/************************************************************************/
// Computed properties para filtrado
const filteredVideos = computed(() => {
  if (!searchQuery.value) return videos.value;
  const query = searchQuery.value.toLowerCase();
  return videos.value.filter(v =>
    v.nombre.toLowerCase().includes(query) ||
    v.descripcion.toLowerCase().includes(query) ||
    v.categoria.toLowerCase().includes(query)
  );
});

const filteredDocs = computed(() => {
  let docs = documentacion.value.filter(d => d.categoria === selectedCategory.value);

  if (!searchQuery.value) return docs;

  const query = searchQuery.value.toLowerCase();
  return docs.filter(d =>
    d.titulo.toLowerCase().includes(query) ||
    d.contenido.toLowerCase().includes(query)
  );
});

const filteredFaqs = computed(() => {
  if (!searchQuery.value) return faqs.value;

  const query = searchQuery.value.toLowerCase();
  return faqs.value.filter(f =>
    f.pregunta.toLowerCase().includes(query) ||
    f.respuesta.toLowerCase().includes(query)
  );
});

const filteredGuias = computed(() => {
  if (!searchQuery.value) return guias.value;

  const query = searchQuery.value.toLowerCase();
  return guias.value.filter(g =>
    g.titulo.toLowerCase().includes(query) ||
    g.descripcion.toLowerCase().includes(query)
  );
});

/************************************************************************/
const toggleFaq = (id) => {
  const index = faqsOpen.value.indexOf(id);
  if (index > -1) {
    faqsOpen.value.splice(index, 1);
  } else {
    faqsOpen.value.push(id);
  }
};

const abrirGuiaModal = (guia) => {
  guiaSeleccionada.value = guia;
  guiaModalVisible.value = true;
};

const abrirVideoModal = (video) => {
  videoSeleccionado.value = video;
  videoModalVisible.value = true;
};

const cerrarVideoModal = () => {
  // Limpiar el video seleccionado al cerrar el modal
  videoSeleccionado.value = null;
};

const abrirVideoEnNavegador = async (videoId) => {
  const url = `https://www.youtube.com/watch?v=${videoId}`;

  try {
    // Para Electron, usar el shell para abrir en navegador externo
    if (window.electron && window.electron.ipcRenderer) {
      const result = await window.electron.ipcRenderer.invoke('open-external', url);

      if (result && result.success) {
        toast.add({
          severity: 'success',
          summary: 'Video abierto',
          detail: 'El video se abrió en tu navegador predeterminado',
          life: 3000
        });
      } else {
        throw new Error(result?.error || 'Error al abrir URL');
      }
    } else {
      // Fallback para navegador web normal
      window.open(url, '_blank');
      toast.add({
        severity: 'success',
        summary: 'Video abierto',
        detail: 'El video se abrió en una nueva pestaña',
        life: 3000
      });
    }
  } catch (error) {
    console.error('Error al abrir video:', error);
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'No se pudo abrir el video. Intenta copiar el enlace manualmente.',
      life: 4000
    });
  }
};

const confirmarAbrirVideo = async () => {
  if (!videoSeleccionado.value) return;

  await abrirVideoEnNavegador(videoSeleccionado.value.link);

  // Cerrar el modal después de abrir el video
  videoModalVisible.value = false;
};

/************************************************************************/
onMounted(async () => {
  try {
    const datosJSON = await envioElectron('datosarchivo');
    link.value = datosJSON.VITE_LINKURL;
    api.value = datosJSON.VITE_LINK_API;
    token.value = datosJSON.VITE_TOKEN;
  } catch (error) {
    console.error('Error al cargar configuración:', error);
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Error al cargar configuración',
      life: 3000
    });
  }
});
</script>

<style scoped>
.content-wrapper {
  min-height: calc(100vh - 60px);
}

/* Estilos para el contenido HTML */
.prose {
  line-height: 1.6;
}

.prose h4 {
  font-weight: 600;
  margin-bottom: 0.5rem;
}

.prose ul {
  margin-bottom: 1rem;
}

.prose p {
  margin-bottom: 1rem;
}

/* Animación para las FAQs */
.pi-chevron-down,
.pi-chevron-up {
  transition: transform 0.2s ease-in-out;
}
</style>
