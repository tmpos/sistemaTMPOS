import { createRouter, createWebHistory } from 'vue-router'
import AppLayout from '@/layout/AppLayout.vue'
import { useAuthStore } from '@/stores/auth'

// ============================================================================
// 🟢 RUTAS SIN LAYOUT (acceso público, sin AppLayout)
// ============================================================================
const publicRoutes = [
  {
    path: '/login',
    name: 'login',
    component: () => import('@/views/pages/auth/Login.vue'),
    props: (route) => ({ almacen: route.query.almacen })
  },
  {
    path: '/bloqueo',
    name: 'bloqueo',
    component: () => import('@/views/Login/Bloqueo.vue'),
    props: true
  },
  {
    path: '/access',
    name: 'accessDenied',
    component: () => import('@/views/pages/auth/Access.vue')
  },

  {
    path: '/registroclientes',
    name: 'registroclientes',
    component: () => import('@/views/Registro/RegistroCliente.vue')
  },
  {
    path: '/catalogo',
    name: 'catalogo',
    component: () => import('@/views/Registro/Catalogo.vue')
  },
  {
    path: '/comanda',
    name: 'comanda',
    component: () => import('@/views/Registro/Comanda.vue')
  },
  {
    path: '/comandataller',
    name: 'comandataller',
    component: () => import('@/views/Taller/ComandaTaller.vue')
  },
  {
    path: '/consultar-taller',
    name: 'consultataller',
    component: () => import('@/views/Taller/ConsultarTaller.vue')
  },
  {
    path: '/firma-entrega-taller/:no_factura',
    name: 'firma-entrega-taller',
    component: () => import('@/views/Taller/FirmaEntregaTaller.vue')
  },
  {
    path: '/consulta-facturas',
    name: 'consulta-facturas',
    component: () => import('@/views/Facturas/ConsultaFacturas.vue')
  },
  {
    path: '/historial-facturas-cliente',
    name: 'historial-facturas-cliente',
    component: () => import('@/views/Facturas/HistorialClienteFacturas.vue')
  },
  {
    path: '/consulta-cuentas-cobrar',
    name: 'consulta-cuentas-cobrar',
    component: () => import('@/views/Consultas/ConsultaCuentasCobrar.vue')
  },
  {
    path: '/consulta-cotizaciones',
    name: 'consulta-cotizaciones',
    component: () => import('@/views/Consultas/ConsultaCotizaciones.vue')
  },
  {
    path: '/consulta-apartados',
    name: 'consulta-apartados',
    component: () => import('@/views/Consultas/ConsultaApartados.vue')
  },
  {
    path: '/consulta-reclamaciones',
    name: 'consulta-reclamaciones',
    component: () => import('@/views/Consultas/ConsultaReclamaciones.vue')
  },
  {
    path: '/consulta-fidelizacion',
    name: 'consulta-fidelizacion',
    component: () => import('@/views/Consultas/ConsultaFidelizacion.vue')
  },
  {
    path: '/consulta-inventario',
    name: 'consulta-inventario',
    component: () => import('@/views/Consultas/ConsultaInventarioPublica.vue')
  },
  {
    path: '/entrarcliente',
    name: 'entrarcliente',
    component: () => import('@/views/Registro/Entrar.vue')
  },
  {
    path: '/error',
    name: 'error',
    component: () => import('@/views/pages/auth/Error.vue')
  },
  {
    path: '/notpermission',
    name: 'notpermission',
    component: () => import('@/views/pages/NoPermission.vue')
  },
  {
    path: '/lock',
    name: 'Lock',
    component: () => import('@/views/pages/Lock.vue')
  },
  {
    path: '/notfound',
    name: 'notfound',
    component: () => import('@/views/pages/NotFound.vue')
  }
]

// ============================================================================
// 🧩 RUTAS CON LAYOUT PRINCIPAL (todas las internas del sistema)
// ============================================================================
const privateRoutes = [
  {
    path: '/',
    component: AppLayout,
    children: [
      { path: '', name: 'home', component: () => import('@/views/Home.vue') },
      { path: 'home', name: 'Home', component: () => import('@/views/Home.vue') },
      {
        path: 'asistente-ia',
        name: 'asistente-ia',
        component: () => import('@/views/AiAsistente/AiAsistente.vue')
      },
      {
        path: 'integraciones',
        name: 'integraciones',
        component: () => import('@/views/Integraciones/Integraciones.vue')
      },
      {
        path: 'centro-empresarial',
        name: 'centro-empresarial',
        component: () => import('@/views/Empresa/CentroEmpresarial.vue')
      },
      { path: '/citas', name: 'citas', component: () => import('@/views/Citas/CitasClientes.vue') },
      { path: 'index', name: 'index', component: () => import('@/views/Home.vue') },
      {
        path: 'calendar',
        name: 'calendar',
        component: () => import('@/views/Calendar/Calendar.vue')
      },
      {
        path: 'whatsappweb',
        name: 'whatsappweb',
        component: () => import('@/views/chat/Index.vue')
      },
      { path: 'marcos', name: 'marcos', component: () => import('@/views/Marcos/Marcos.vue') },
      {
        path: 'config_correo',
        name: 'config_correo',
        component: () => import('@/views/Config_correo/Config_correo.vue')
      },
      { path: 'metas', name: 'metas', component: () => import('@/views/Metas/Metas.vue') },
      {
        path: 'android',
        name: 'android',
        component: () => import('@/views/InfoAndroid/InfoAndroid.vue')
      },
      {
        path: 'internet',
        name: 'internet',
        component: () => import('@/views/Internet/Internet.vue')
      },
      {
        path: 'factura/:factura/:tipo',
        name: 'factura',
        component: () => import('@/views/Printer/Printer.vue')
      },
      {
        path: 'transacciones',
        name: 'transacciones',
        component: () => import('@/views/Transacciones/Transacciones.vue')
      },
      {
        path: 'reclamaciones',
        name: 'reclamaciones',
        component: () => import('@/views/Reclamaciones/Reclamaciones.vue')
      },
      {
        path: 'crearreclamaciones',
        name: 'crearreclamaciones',
        component: () => import('@/views/Reclamaciones/CrearReclamaciones.vue')
      },
      {
        path: 'editarreclamaciones/:id',
        name: 'editarreclamaciones',
        component: () => import('@/views/Reclamaciones/EditarReclamaciones.vue')
      },
      {
        path: 'fidelizacion',
        name: 'fidelizacion',
        component: () => import('@/views/Fidelizacion/Fidelizacion.vue')
      },
      {
        path: 'instituciones',
        name: 'instituciones',
        component: () => import('@/views/Instituciones/Instituciones.vue')
      },
      {
        path: 'apartados',
        name: 'apartados',
        component: () => import('@/views/Apartados/Apartados.vue')
      },
      {
        path: 'crearapartados',
        name: 'crearapartados',
        component: () => import('@/views/Apartados/CrearApartados.vue')
      },
      {
        path: 'editarapartados/:id',
        name: 'editarapartados',
        component: () => import('@/views/Apartados/EditarApartados.vue')
      },
      {
        path: 'cuentasxpagar',
        name: 'cuentasxpagar',
        component: () => import('@/views/Cuentasxpagar/Cuentasxpagar.vue')
      },
      {
        path: 'crearcuentasxpagar',
        name: 'crearcuentasxpagar',
        component: () => import('@/views/Cuentasxpagar/CrearCuentasxpagar.vue')
      },
      {
        path: 'editarcuentasxpagar/:id',
        name: 'editarcuentasxpagar',
        component: () => import('@/views/Cuentasxpagar/EditarCuentasxpagar.vue')
      },
      {
        path: 'mensajes',
        name: 'mensajes',
        component: () => import('@/views/Mensajes/Mensajes.vue')
      },
      { path: 'soporte', name: 'Soporte', component: () => import('@/views/Soporte/Soporte.vue') },
      {
        path: 'documentacion',
        name: 'documentacion',
        component: () => import('@/views/Documentacion/Documentacion.vue')
      },
      {
        path: 'manual-sistema',
        name: 'manual-sistema',
        component: () => import('@/views/Documentacion/ManualSistema.vue')
      },
      {
        path: 'creardocumentacion',
        name: 'creardocumentacion',
        component: () => import('@/views/Documentacion/CrearDocumentacion.vue')
      },
      {
        path: 'editardocumentacion/:id',
        name: 'editardocumentacion',
        component: () => import('@/views/Documentacion/EditarDocumentacion.vue')
      },
      {
        path: 'fabricacion',
        name: 'fabricacion',
        component: () => import('@/views/Fabricacion/Fabricacion.vue')
      },
      {
        path: 'crearfabricacion',
        name: 'crearfabricacion',
        component: () => import('@/views/Fabricacion/CrearFabricacion.vue')
      },
      {
        path: 'editarfabricacion/:id',
        name: 'editarfabricacion',
        component: () => import('@/views/Fabricacion/EditarFabricacion.vue')
      },
      {
        path: 'productos',
        name: 'productos',
        component: () => import('@/views/Productos/Productos.vue')
      },
      {
        path: 'productos-poco-stock',
        name: 'productos-poco-stock',
        component: () => import('@/views/Productos/ProductosPocoStock.vue')
      },
      {
        path: 'crearproductos',
        name: 'crearproducto',
        component: () => import('@/views/Productos/CrearProductos.vue')
      },
      {
        path: 'editarproductos/:id',
        name: 'editarproductos',
        component: () => import('@/views/Productos/EditarProductos.vue')
      },
      {
        path: 'productos-danados',
        name: 'productos-danados',
        component: () => import('@/views/ProductosDanados/ProductosDanados.vue')
      },
      {
        path: 'piezas',
        name: 'piezas',
        component: () => import('@/views/Piezas/Piezas.vue')
      },
      {
        path: 'refurbished',
        name: 'refurbished',
        component: () => import('@/views/Refurbished/Refurbished.vue')
      },
      {
        path: 'productos-uso-interno',
        name: 'productos-uso-interno',
        component: () => import('@/views/ProductosUsoInterno/ProductosUsoInterno.vue')
      },
      {
        path: 'almacenes',
        name: 'almacenes',
        component: () => import('@/views/Almacenes/Almacenes.vue')
      },
      {
        path: 'asientodiario2',
        name: 'asientodiario2',
        component: () => import('@/views/Asientodiario2/Asientodiario2.vue')
      },

      {
        path: 'pageviewer/:url',
        name: 'pageviewer',
        component: () => import('@/views/PageViewer/PageViewer.vue'),
        props: true
      },

      {
        path: '/cuadres',
        name: 'cuadres',
        component: () => import('../views/Cuadres/Cuadres.vue')
      },
      {
        path: '/crearcuadres',
        name: 'crearcuadres',
        component: () => import('@/views/Cuadres/CrearCuadres.vue')
      },
      {
        path: '/editarcuadres/:id',
        name: 'editarcuadres',
        component: () => import('@/views/Cuadres/EditarCuadres.vue')
      },
      {
        path: 'caja-chica',
        name: 'caja-chica',
        component: () => import('@/views/CajaChica/CajaChica.vue')
      },

      {
        path: 'clientes',
        name: 'clientes',
        component: () => import('@/views/Clientes/Clientes.vue')
      },
      {
        path: 'crearclientes',
        name: 'crearclientes',
        component: () => import('@/views/Clientes/CrearClientes.vue')
      },
      {
        path: 'editarclientes/:id',
        name: 'editarclientes',
        component: () => import('@/views/Clientes/EditarClientes.vue')
      },
      {
        path: 'proveedores',
        name: 'proveedores',
        component: () => import('@/views/Proveedores/Proveedores.vue')
      },
      { path: 'medidas', name: 'medidas', component: () => import('@/views/Medidas/Medidas.vue') },
      { path: 'meseros', name: 'meseros', component: () => import('@/views/Meseros/Meseros.vue') },
      {
        path: 'delivery',
        name: 'delivery',
        component: () => import('@/views/Delivery/Delivery.vue')
      },
      {
        path: 'categorias',
        name: 'categorias',
        component: () => import('@/views/Categorias/Categorias.vue')
      },
      { path: 'marcas', name: 'marcas', component: () => import('@/views/Marcas/Marcas.vue') },
      {
        path: 'facturas',
        name: 'facturas',
        component: () => import('@/views/Facturas/Facturas.vue')
      },
      {
        path: 'crearfacturas',
        name: 'crearfacturas',
        component: () => import('@/views/Facturas/CrearFacturas.vue')
      },
      {
        path: 'editarfacturas/:id',
        name: 'editarfacturas',
        component: () => import('@/views/Facturas/EditarFacturas.vue')
      },
      {
        path: 'printer/:id',
        name: 'printer',
        component: () => import('@/components/ImpresionFactura.vue'),
        props: true
      },
      // ============================================================================
      // 🎡 RUTAS DE RULETA DE PREMIOS
      // ============================================================================
      {
        path: 'ruleta',
        name: 'ruleta',
        component: () => import('@/views/Ruleta/Ruleta.vue')
      },
      {
        path: 'ruleta/premios',
        name: 'ruleta-premios',
        component: () => import('@/views/Ruleta/Premios.vue')
      },
      {
        path: 'ruleta/configuracion',
        name: 'ruleta-configuracion',
        component: () => import('@/views/Ruleta/ConfiguracionRuleta.vue')
      },
      // ============================================================================
      { path: 'vender', name: 'vender', component: () => import('@/views/Vender.vue') },
      {
        path: 'configuracion',
        name: 'configuracion',
        component: () => import('@/views/Sistema/Configuracion.vue')
      },
      { path: 'rutas', name: 'rutas', component: () => import('@/views/Rutas/Rutas.vue') },
      { path: 'caja', name: 'caja', component: () => import('@/views/Caja/Caja.vue') },
      {
        path: 'cuentas_cobrar',
        name: 'cuentas_cobrar',
        component: () => import('@/views/Cuentas_cobrar/Cuentas_cobrar.vue')
      },
      {
        path: 'crearcuentas_cobrar',
        name: 'crearcuentas_cobrar',
        component: () => import('@/views/Cuentas_cobrar/CrearCuentas_cobrar.vue')
      },
      {
        path: 'editarcuentas_cobrar/:id',
        name: 'editarcuentas_cobrar',
        component: () => import('@/views/Cuentas_cobrar/EditarCuentas_cobrar.vue')
      },
      {
        path: 'usuarios',
        name: 'usuarios',
        component: () => import('@/views/Usuarios/Usuarios.vue')
      },
      {
        path: 'crearusuarios',
        name: 'crearusuarios',
        component: () => import('@/views/Usuarios/CrearUsuarios.vue')
      },
      {
        path: 'editarusuarios/:id',
        name: 'editarusuarios',
        component: () => import('@/views/Usuarios/EditarUsuarios.vue')
      },
      {
        path: 'instaladores',
        name: 'instaladores',
        component: () => import('@/views/Instaladores/Instaladores.vue')
      },
      { path: 'imei', name: 'imei', component: () => import('@/views/Imei/Imei.vue') },
      {
        path: 'electrodomesticos',
        name: 'electrodomesticos',
        component: () => import('@/views/Electrodomesticos/Electrodomesticos.vue')
      },
      {
        path: 'empaques',
        name: 'empaques',
        component: () => import('@/views/Empaques/Empaques.vue')
      },
      { path: 'barcode', name: 'barcode', component: () => import('@/views/Barcode/Barcode.vue') },
      {
        path: 'etiquetas',
        name: 'etiquetas',
        component: () => import('@/views/Etiquetas/ImprimirEtiquetas.vue')
      },
      {
        path: 'backupexcel',
        name: 'backupexcel',
        component: () => import('@/views/Backupexcel/Backupexcel.vue')
      },
      {
        path: 'mitaller',
        name: 'mitaller',
        component: () => import('@/views/Mitaller/Mitaller.vue')
      },
      {
        path: 'confiscal',
        name: 'confiscal',
        component: () => import('@/views/Confiscal/Confiscal.vue')
      },
      {
        path: 'comprobantes-electronicos',
        name: 'comprobantes-electronicos',
        component: () => import('@/views/ComprobantesElectronicos/ComprobantesElectronicos.vue')
      },
      {
        path: 'configuracion-alanube',
        name: 'configuracion-alanube',
        component: () => import('@/views/ConfiguracionAlanube/ConfiguracionAlanube.vue')
      },
      {
        path: 'facturacion-electronica-log',
        name: 'facturacion-electronica-log',
        component: () => import('@/views/FacturacionElectronicaLog/FacturacionElectronicaLog.vue')
      },
      {
        path: 'impresoras',
        name: 'impresoras',
        component: () => import('@/views/Impresoras/Impresoras.vue')
      },
      { path: 'default', name: 'default', component: () => import('@/views/Default/Default.vue') },
      {
        path: 'metodopago',
        name: 'metodopago',
        component: () => import('@/views/Metodopago/Metodopago.vue')
      },
      {
        path: 'garantia',
        name: 'garantia',
        component: () => import('@/views/Garantia/Garantia.vue')
      },
      {
        path: 'garantia_global',
        name: 'garantia_global',
        component: () => import('@/views/Garantia_global/Garantia_global.vue')
      },
      {
        path: 'creargarantia_global',
        name: 'creargarantia_global',
        component: () => import('@/views/Garantia_global/CrearGarantia_global.vue')
      },
      {
        path: 'editargarantia_global/:id',
        name: 'editargarantia_global',
        component: () => import('@/views/Garantia_global/EditarGarantia_global.vue')
      },
      {
        path: 'mensajeria',
        name: 'mensajeria',
        component: () => import('@/views/Mensajeria/Mensajeria.vue')
      },
      { path: 'paises', name: 'paises', component: () => import('@/views/Paises/Paises.vue') },
      { path: 'theme', name: 'theme', component: () => import('@/views/Theme/Theme.vue') },
      {
        path: 'registrocaja',
        name: 'registrocaja',
        component: () => import('@/views/Registrocaja/Registrocaja.vue')
      },
      {
        path: 'variables',
        name: 'variables',
        component: () => import('@/views/Variables/Variables.vue')
      },
      {
        path: 'cotizacion',
        name: 'cotizacion',
        component: () => import('@/views/Cotizacion/Cotizacion.vue')
      },
      {
        path: 'crearcotizacion',
        name: 'crearcotizacion',
        component: () => import('@/views/Cotizacion/CrearCotizacion.vue')
      },
      {
        path: 'editarcotizacion/:id',
        name: 'editarcotizacion',
        component: () => import('@/views/Cotizacion/EditarCotizacion.vue')
      },
      {
        path: 'financiamientos',
        name: 'financiamientos',
        component: () => import('@/views/Financiamientos/Financiamientos.vue')
      },
      {
        path: 'crearfinanciamientos',
        name: 'crearfinanciamientos',
        component: () => import('@/views/Financiamientos/CrearFinanciamientos.vue')
      },
      {
        path: 'editarfinanciamientos/:id',
        name: 'editarfinanciamientos',
        component: () => import('@/views/Financiamientos/EditarFinanciamientos.vue')
      },
      {
        path: 'notacredito',
        name: 'notacredito',
        component: () => import('@/views/Notacredito/Notacredito.vue')
      },
      {
        path: 'crearnotacredito',
        name: 'crearnotacredito',
        component: () => import('@/views/Notacredito/CrearNotacredito.vue')
      },
      {
        path: 'editarnotacredito/:id',
        name: 'editarnotacredito',
        component: () => import('@/views/Notacredito/EditarNotacredito.vue')
      },
      { path: 'conduce', name: 'conduce', component: () => import('@/views/Conduce/Conduce.vue') },
      {
        path: 'crearconduce',
        name: 'crearconduce',
        component: () => import('@/views/Conduce/CrearConduce.vue')
      },
      {
        path: 'editarconduce/:id',
        name: 'editarconduce',
        component: () => import('@/views/Conduce/EditarConduce.vue')
      },
      {
        path: 'ventasenproceso',
        name: 'ventasenproceso',
        component: () => import('@/views/Ventasenproceso/Ventasenproceso.vue')
      },
      { path: 'equipos', name: 'equipos', component: () => import('@/views/Equipos/Equipos.vue') },
      {
        path: 'tecnicos',
        name: 'tecnicos',
        component: () => import('@/views/Tecnicos/Tecnicos.vue')
      },
      { path: 'taller', name: 'taller', component: () => import('@/views/Taller/Taller.vue') },
      {
        path: 'creartaller',
        name: 'creartaller',
        component: () => import('@/views/Taller/CrearTaller.vue')
      },
      {
        path: 'editartaller/:id',
        name: 'editartaller',
        component: () => import('@/views/Taller/EditarTaller.vue')
      },
      {
        path: 'historial_consulta',
        name: 'historial_consulta',
        component: () => import('@/views/Historial_consulta/Historial_consulta.vue')
      },
      {
        path: 'crearhistorial_consulta',
        name: 'crearhistorial_consulta',
        component: () => import('@/views/Historial_consulta/CrearHistorial_consulta.vue')
      },
      {
        path: 'editarhistorial_consulta/:id',
        name: 'editarhistorial_consulta',
        component: () => import('@/views/Historial_consulta/EditarHistorial_consulta.vue')
      },
      { path: 'cuentas', name: 'cuentas', component: () => import('@/views/Cuentas/Cuentas.vue') },
      {
        path: 'mayorgeneral',
        name: 'mayorgeneral',
        component: () => import('@/views/Mayorgeneral/Mayorgeneral.vue')
      },
      {
        path: 'asientodiario',
        name: 'asientodiario',
        component: () => import('@/views/Asientodiario/Asientodiario.vue')
      },
      { path: 'recibos', name: 'recibos', component: () => import('@/views/Recibos/Recibos.vue') },
      { path: 'balance', name: 'balance', component: () => import('@/views/Balance/Balance.vue') },
      { path: 'gastos', name: 'gastos', component: () => import('@/views/Gastos/Gastos.vue') },
      {
        path: 'entradas',
        name: 'entradas',
        component: () => import('@/views/Entradas/Entradas.vue')
      },
      {
        path: 'gastosfijos',
        name: 'gastosfijos',
        component: () => import('@/views/Gastosfijos/Gastosfijos.vue')
      },
      {
        path: 'entradasfijas',
        name: 'entradasfijas',
        component: () => import('@/views/Entradasfijas/Entradasfijas.vue')
      },
      {
        path: 'devoluciones',
        name: 'devoluciones',
        component: () => import('@/views/Devoluciones/Devoluciones.vue')
      },
      { path: 'banco', name: 'banco', component: () => import('@/views/Banco/Banco.vue') },
      { path: 'nomina', name: 'nomina', component: () => import('@/views/Nomina/Nomina.vue') },
      {
        path: 'crearnomina',
        name: 'crearnomina',
        component: () => import('@/views/Nomina/CrearNomina.vue')
      },
      {
        path: 'editarnomina/:id',
        name: 'editarnomina',
        component: () => import('@/views/Nomina/EditarNomina.vue')
      },
      { path: 'compras', name: 'compras', component: () => import('@/views/Compras/Compras.vue') },
      {
        path: 'crearcompras',
        name: 'crearcompras',
        component: () => import('@/views/Compras/CrearCompras.vue')
      },
      {
        path: 'editarcompras/:id',
        name: 'editarcompras',
        component: () => import('@/views/Compras/EditarCompras.vue')
      },
      {
        path: 'reportes',
        name: 'reportes',
        component: () => import('@/views/Reportes/Reportes.vue')
      },
      {
        path: 'reporte-mes',
        name: 'reportes-mes',
        component: () => import('@/views/Reportes/Mes.vue')
      },
      {
        path: 'reporte-semana',
        name: 'reportes-semana',
        component: () => import('@/views/Reportes/Semana.vue')
      },
      {
        path: 'reporte-hoy',
        name: 'reportes-dia',
        component: () => import('@/views/Reportes/Dia.vue')
      },
      {
        path: 'informepordia',
        name: 'informepordia',
        component: () => import('@/views/Informepordia/Informepordia.vue')
      },
      {
        path: 'ultimos7dias',
        name: 'ultimos7dias',
        component: () => import('@/views/Reportes/Ultimos7dias.vue')
      },
      {
        path: 'rango/:fechainicio/:fechafin',
        name: 'rango',
        component: () => import('@/views/Reportes/Rango.vue')
      },
      {
        path: 'ventas/:fechainicio/:fechafin',
        name: 'ventas',
        component: () => import('@/views/Reportes/Ventas.vue')
      },
      {
        path: 'tutoriales',
        name: 'tutoriales',
        component: () => import('@/views/Tutoriales/Tutoriales.vue')
      },
      { path: '/pos', name: 'pos', component: () => import('@/POS/POS.vue') },
      {
        path: 'contabilidad',
        name: 'contabilidad',
        component: () => import('@/views/Contabilidad/Contabilidad.vue')
      },
      {
        path: 'estado-resultados',
        name: 'estado-resultados',
        component: () => import('@/views/EstadoResultados/EstadoResultados.vue')
      },
      {
        path: 'estado-situacion',
        name: 'estado-situacion',
        component: () => import('@/views/EstadoSituacion/EstadoSituacion.vue')
      },
      {
        path: 'cierre-fiscal',
        name: 'cierre-fiscal',
        component: () => import('@/views/CierreFiscal/CierreFiscal.vue')
      },
      {
        path: 'utilidades',
        name: 'utilidades',
        component: () => import('@/views/Utilidades/Utilidades.vue')
      },
      {
        path: 'distribucion-utilidades',
        name: 'distribucion-utilidades',
        component: () => import('@/views/DistribucionUtilidades/DistribucionUtilidades.vue')
      },
      {
        path: 'reporte-vendedores',
        name: 'reporte-vendedores',
        component: () => import('@/views/ReporteVendedores/ReporteVendedores.vue')
      },
      {
        path: 'ventas-por-cajero',
        name: 'ventas-por-cajero',
        component: () => import('@/views/VentasPorCajero/VentasPorCajero.vue')
      },
      {
        path: 'ventas-por-clientes',
        name: 'ventas-por-clientes',
        component: () => import('@/views/VentasPorClientes/VentasPorClientes.vue')
      },
      {
        path: 'taller-por-tecnicos',
        name: 'taller-por-tecnicos',
        component: () => import('@/views/TallerPorTecnicos/TallerPorTecnicos.vue')
      },
      {
        path: 'comisiones-ventas',
        name: 'comisiones-ventas',
        component: () => import('@/views/ComisionesVentas/ComisionesVentas.vue')
      },
      {
        path: 'reporte-606',
        name: 'reporte-606',
        component: () => import('@/views/Reporte606/Reporte606.vue')
      },
      {
        path: 'reporte-607',
        name: 'reporte-607',
        component: () => import('@/views/Reporte607/Reporte607.vue')
      },
      {
        path: 'inventario',
        name: 'inventario',
        component: () => import('@/views/Inventario/Inventario.vue')
      },
      {
        path: 'inventario_celular',
        name: 'inventario_celular',
        component: () => import('@/views/Inventario_celular/Inventario_celular.vue')
      },
      {
        path: 'crearinventario_celular',
        name: 'crearinventario_celular',
        component: () => import('@/views/Inventario_celular/CrearInventario_celular.vue')
      },
      {
        path: 'editarinventario_celular/:id',
        name: 'editarinventario_celular',
        component: () => import('@/views/Inventario_celular/EditarInventario_celular.vue')
      },
      {
        path: 'inventario_accesorios',
        name: 'inventario_accesorios',
        component: () => import('@/views/Inventario_accesorios/Inventario_accesorios.vue')
      },
      {
        path: 'crearinventario_accesorios',
        name: 'crearinventario_accesorios',
        component: () => import('@/views/Inventario_accesorios/CrearInventario_accesorios.vue')
      },
      {
        path: 'editarinventario_accesorios/:id',
        name: 'editarinventario_accesorios',
        component: () => import('@/views/Inventario_accesorios/EditarInventario_accesorios.vue')
      },
      { path: 'tokens', name: 'tokens', component: () => import('@/views/Tokens/Tokens.vue') },
      {
        path: 'phone_check',
        name: 'phone_check',
        component: () => import('@/views/Phone_check/Phone_check.vue')
      },
      {
        path: 'crearphone_check',
        name: 'crearphone_check',
        component: () => import('@/views/Phone_check/CrearPhone_check.vue')
      },
      {
        path: 'editarphone_check/:id',
        name: 'editarphone_check',
        component: () => import('@/views/Phone_check/EditarPhone_check.vue')
      },
      { path: 'mesas', name: 'mesas', component: () => import('@/views/Mesas/Mesas.vue') },
      {
        path: 'informes',
        name: 'informes',
        component: () => import('@/views/Informes/Informes.vue')
      },
      {
        path: 'graficos',
        name: 'graficos',
        component: () => import('@/views/Graficos/Graficos.vue')
      },
      { path: 'ia', name: 'ia', component: () => import('@/views/Ia/Ia.vue') },
      {
        path: 'cellinfo',
        name: 'cellinfo',
        component: () => import('@/views/Cellinfo/Cellinfo.vue')
      },
      {
        path: 'informe607/:fecha',
        name: 'informe607',
        component: () => import('@/views/Informe607/Informe607.vue')
      },
      {
        path: 'hojaentrada',
        name: 'hojaentrada',
        component: () => import('@/views/Hojaentrada/Hojaentrada.vue')
      },
      {
        path: 'crearhojaentrada',
        name: 'crearhojaentrada',
        component: () => import('@/views/Hojaentrada/CrearHojaentrada.vue')
      },
      {
        path: 'editarhojaentrada/:id',
        name: 'editarhojaentrada',
        component: () => import('@/views/Hojaentrada/EditarHojaentrada.vue')
      },
      {
        path: 'recibirequipo',
        name: 'recibirequipo',
        component: () => import('@/views/Recibirequipo/Recibirequipo.vue')
      },
      {
        path: 'whatsapp',
        name: 'whatsapp',
        component: () => import('@/views/Whatsapp/Whatsapp.vue')
      },
      { path: 'salir', name: 'Salir', component: () => import('@/views/Salir/Salir.vue') },
      {
        path: 'permisos',
        name: 'permisos',
        component: () => import('@/views/Permisos/Permisos.vue')
      },
      { path: 'pin', name: 'pin', component: () => import('@/views/Pin/Pin.vue') },
      {
        path: '/bitacora',
        name: 'bitacora',
        component: () => import('@/views/Bitacora/Bitacora.vue')
      },
      {
        path: '/ordenes',
        name: 'OrdenesList',
        component: () => import('@/views/ordenes/OrdenesList.vue'),
        meta: {
          title: 'ordenes',
          requiresAuth: true // Cambia a false si no requiere autenticación
        }
      },

      {
        path: '/crearOrdenes',
        name: 'OrdenesCreate',
        component: () => import('@/views/ordenes/OrdenesCreate.vue'),
        meta: {
          title: 'Nuevo Ordenes',
          requiresAuth: true
        }
      },
      {
        path: '/editarOrdenes/:id',
        name: 'OrdenesEdit',
        component: () => import('@/views/ordenes/OrdenesEdit.vue'),
        meta: {
          title: 'Editar Ordenes',
          requiresAuth: true
        }
      },

      {
        path: '/pre_facturas',
        name: 'PreFacturasList',
        component: () => import('@/views/pre_facturas/PreFacturasList.vue'),
        meta: {
          title: 'pre_facturas',
          requiresAuth: true // Cambia a false si no requiere autenticación
        }
      },
      {
        path: '/crearPreFacturas',
        name: 'PreFacturasCreate',
        component: () => import('@/views/pre_facturas/PreFacturasCreate.vue'),
        meta: {
          title: 'Nuevo PreFacturas',
          requiresAuth: true
        }
      },
      {
        path: '/editarPreFacturas/:id',
        name: 'PreFacturasEdit',
        component: () => import('@/views/pre_facturas/PreFacturasEdit.vue'),
        meta: {
          title: 'Editar PreFacturas',
          requiresAuth: true
        }
      },

      {
        path: 'printerconfig',
        name: 'printerconfig',
        component: () => import('@/views/Printerconfig/Printerconfig.vue')
      },
      //{ path: 'menu', name: 'menu', component: () => import('@/views/Menu/Menu.vue') },

      {
        path: '/menu',
        name: 'MenuList',
        component: () => import('@/views/Menu/Menu.vue'),
        meta: {
          title: 'menu',
          requiresAuth: true // Cambia a false si no requiere autenticación
        }
      },

      { path: 'prueba', name: 'prueba', component: () => import('@/views/Prueba/Prueba.vue') },
      {
        path: 'crearprueba',
        name: 'crearprueba',
        component: () => import('@/views/Prueba/CrearPrueba.vue')
      },
      {
        path: 'editarprueba/:id',
        name: 'editarprueba',
        component: () => import('@/views/Prueba/EditarPrueba.vue')
      },
      { path: 'perfil', name: 'Perfil', component: () => import('@/views/pages/Perfil.vue') },
      {
        path: 'transaccionesbancarias',
        name: 'transaccionesbancarias',
        component: () => import('@/views/Transaccionesbancarias/Transaccionesbancarias.vue')
      },
      {
        path: 'creartransaccionesbancarias',
        name: 'creartransaccionesbancarias',
        component: () => import('@/views/Transaccionesbancarias/CrearTransaccionesbancarias.vue')
      },
      {
        path: 'editartransaccionesbancarias/:id',
        name: 'editartransaccionesbancarias',
        component: () => import('@/views/Transaccionesbancarias/EditarTransaccionesbancarias.vue')
      },
      { path: 'cheques', name: 'cheques', component: () => import('@/views/Cheques/Cheques.vue') },
      {
        path: 'conciliaciones',
        name: 'conciliaciones',
        component: () => import('@/views/Conciliaciones/Conciliaciones.vue')
      },
      {
        path: 'reportes-analitica',
        name: 'reportes-analitica',
        component: () => import('@/views/ReportesAnalitica/ReportesAnalitica.vue')
      },
      {
        path: 'comisionesbancarias',
        name: 'comisionesbancarias',
        component: () => import('@/views/Comisiones/Comisiones.vue')
      },
      {
        path: 'libro-diario',
        name: 'libro-diario',
        component: () => import('@/views/LibroDiario/LibroDiario.vue')
      },
      {
        path: 'movimientos-cuentas',
        name: 'movimientos-cuentas',
        component: () => import('@/views/MovimientosCuentas/MovimientosCuentas.vue')
      },
      {
        path: 'notificaciones',
        name: 'notificaciones',
        component: () => import('@/views/Notificaciones/Notificaciones.vue')
      },

      {
        path: '/empleados',
        name: 'empleados',
        component: () => import('../views/Empleados/Empleados.vue')
      },
      {
        path: '/crearempleados',
        name: 'crearempleados',
        component: () => import('@/views/Empleados/CrearEmpleados.vue')
      },
      {
        path: '/editarempleados/:id',
        name: 'editarempleados',
        component: () => import('@/views/Empleados/EditarEmpleados.vue')
      },
      {
        path: '/cargos',
        name: 'cargos',
        component: () => import('../views/Cargos/Cargos.vue')
      },
      {
        path: '/configuracion_correo',
        name: 'configuracion_correo',
        component: () => import('../views/Configuracion_correo/Configuracion_correo.vue')
      }
    ]
  }
]

// ============================================================================
// 🚨 RUTA COMODÍN FINAL (404)
// ============================================================================
const notFoundRoute = [
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('@/views/pages/auth/Login.vue')
    //component: () => import('@/views/pages/NotFound.vue')
  }
]

// ============================================================================
// 🚀 CREACIÓN DEL ROUTER
// ============================================================================
const router = createRouter({
  history: createWebHistory(),
  routes: [...publicRoutes, ...privateRoutes, ...notFoundRoute]
})

// ============================================================================
// 🧠 GUARDIA DE AUTENTICACIÓN
// ============================================================================
router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()
  const loggedIn = !!authStore?.isAuthenticated

  // Nombres de rutas públicas
  const publicNames = publicRoutes.map((r) => r.name).concat(['NotFound'])

  // Guarda la ruta anterior
  if (from.name) {
    localStorage.setItem('previousRoute', JSON.stringify({ ruta: from.name }))
  }

  // 🟢 Permitir siempre login (con o sin parámetro, incluso codificado)
  if (to.path.startsWith('/login')) {
    next()
    return
  }

  // 🟢 Permitir también rutas públicas sin layout
  if (publicNames.includes(to.name)) {
    next()
    return
  }

  // 🔒 Si no está autenticado, redirigir a login
  if (!loggedIn) {
    next({ path: '/login' })
    return
  }

  // ✅ Si todo está bien, continuar
  next()
})

export default router
