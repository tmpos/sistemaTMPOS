<script setup>
import { ref, onMounted, computed } from 'vue';
import AppMenuItem from './AppMenuItem.vue';
import axios from 'axios';
import bcrypt from 'bcryptjs';
import Swal from 'sweetalert2';
import { useToast } from "primevue/usetoast";
import { useDatosEmpresa } from '../stores';
import {
  enviarDatosPorPost, eliminarDatos, obtenerIdsSeleccionados, borrarTodoslosDatos,
  lenguajeDataTable, nfecha, arrayToObjetoFromTabla, peticionesFetch,
  encryptarPassword, envioElectron, mensajetoast, peticiones, lasMayusculas
} from '../funciones/funciones.js';

const toast = useToast();
const datosEmpresa = useDatosEmpresa();
const link = ref('');
const api = ref('');
const token = ref('');
const patronTelefono = ref('');
const linkImpresora = ref('');
const tokenCifrado = ref(null);

const menuArray = ref([]);
const model = ref([
    {
        label: 'Home',
        items: [{ 
          label: 'Home', 
          icon: 'pi pi-fw pi-home',
          permiso: "Administrador,Gerente,Soporte", 
          to: '/' 
        }]
    },
    {
        label: 'Pages',
        icon: 'pi pi-fw pi-briefcase',
        to: '/pages',
        items: [

        {
        "label": "Sistema",
        "icon": "fas icon-arrows-cw",
        "permiso": "Administrador,Gerente,Soporte",
        "items": [
          {
            "label": "Configuracion",
            "to": "/configuracion",
            "permiso": "Administrador,Gerente,Soporte",
            "icon": "far icon-cog"
          },
          {
            "label": "Manual Sistema",
            "to": "/manual-sistema",
            "permiso": "Administrador,Gerente,Soporte",
            "icon": "pi pi-book"
          },
          {
            "label": "Config. Alanube",
            "to": "/configuracion-alanube",
            "permiso": "Administrador,Gerente,Soporte",
            "icon": "pi pi-cloud-upload"
          },
          {
            "label": "Log E-CF",
            "to": "/facturacion-electronica-log",
            "permiso": "Administrador,Gerente,Soporte",
            "icon": "pi pi-list"
          },
          {
            "label": "Centro Empresarial",
            "to": "/centro-empresarial",
            "permiso": "Administrador,Gerente,Soporte",
            "icon": "pi pi-chart-line"
          },
          {
          "label": "Almacenes",
          "to": "/almacenes",
          "permiso": "Administrador,Gerente,Soporte",
          "icon": "pi pi-building"
          },
          {
          "label": "Config_correo",
          "to": "/config_correo",
          "permiso": "Administrador,Gerente,Soporte",
          "icon": "pi pi-circle"
          },
          {
          "label": "Notificaciones",
          "to": "/notificaciones",
          "permiso": "Administrador,Gerente,Soporte",
          "icon": "fas icon-alert"
          },
          {
          "label": "Backupexcel",
          "to": "/backupexcel",
          "permiso": "Administrador,Gerente,Soporte",
          "icon": "fas icon-circle"
          },
          {
          "label": "Impresoras",
          "to": "/impresoras",
          "permiso": "Administrador,Gerente,Soporte",
          "icon": "fas icon-print"
          },
          {
          "label": "Default",
          "to": "/default",
          "permiso": "Administrador,Gerente,Soporte",
          "icon": "pi pi-sync"
          },
          {
          "label": "Metodopago",
          "to": "/metodopago",
          "permiso": "Administrador,Gerente,Soporte",
          "icon": "fas icon-money"
          },
          {
          "label": "Notas",
          "to": "/garantia",
          "permiso": "Administrador,Gerente,Soporte",
          "icon": "fas icon-newspaper-1"
          },
          {
          "label": "Garantia Global",
          "to": "/garantia_global",
          "permiso": "Administrador,Gerente,Soporte",
          "icon": "pi pi-globe"
          },
          {
          "label": "Mensajeria",
          "to": "/mensajeria",
          "permiso": "Administrador,Gerente,Soporte",
          "icon": "fas icon-news"
          },
          {
          "label": "Rutas",
          "to": "/rutas",
          "permiso": "Administrador,Gerente,Soporte",
          "icon": "pi pi-map"
          },
          {
          "label": "Paises",
          "to": "/paises",
          "permiso": "Administrador,Gerente,Soporte",
          "icon": "fas icon-flag"
          },
          {
          "label": "Theme",
          "to": "/theme",
          "permiso": "Administrador,Gerente,Soporte",
          "icon": "fas icon-brush-1"
          },
          {
          "label": "Whatsapp",
          "to": "/whatsappweb",
          "icon": "fas icon-whatsapp"
          },
          {
          "label": "Registrocaja",
          "to": "/registrocaja",
          "permiso": "Administrador,Gerente,Soporte",
          "icon": "fas icon-inbox"
          }
        ]
      },
      {
        "label": "Productos",
        "icon": "fas icon-th",
        "permiso": "Administrador,Gerente,Soporte",
        "items": [
          {
            "label": "Productos",
            "to": "/productos",
            "permiso": "Administrador,Gerente,Soporte",
            "icon": "far icon-th"
          },
          {
            "label": "Marcas",
            "to": "/marcas",
            "permiso": "Administrador,Gerente,Soporte",
            "icon": "fas icon-users"
          },
          {
            "label": "Categorias",
            "to": "/categorias",
            "permiso": "Administrador,Gerente,Soporte",
            "icon": "far icon-circle"
          },
          {
          "label": "Imei",
          "to": "/imei",
          "permiso": "Administrador,Gerente,Soporte",
          "icon": "fas icon-barcode"
          },
          {
          "label": "Electrodomésticos",
          "to": "/electrodomesticos",
          "permiso": "Administrador,Gerente,Soporte",
          "icon": "fas icon-box"
          },
          {
          "label": "Phone Check",
          "to": "/phone_check",
          "permiso": "Administrador,Gerente,Soporte",
          "icon": "fas icon-mobile"
          },
          {
          "label": "Inventario Celular",
          "to": "/inventario_celular",
          "permiso": "Administrador,Gerente,Soporte",
          "icon": "fas icon-mobile"
          },
          {
          "label": "Inventario_accesorios",
          "to": "/inventario_accesorios",
          "permiso": "Administrador,Soporte",
          "icon": "pi pi-circle"
          },
          {
          "label": "Empaques",
          "to": "/empaques",
          "permiso": "Administrador,Gerente,Soporte",
          "icon": "fas icon-box-4"
          },
          {
          "label": "Barcode",
          "to": "/barcode",
          "permiso": "Administrador,Gerente,Soporte",
          "icon": "fas icon-barcode"
          },
          {
          "label": "Productos Dañados",
          "to": "/productos-danados",
          "permiso": "Administrador,Gerente,Soporte",
          "icon": "fas icon-attention-alt"
          },
          {
          "label": "Refurbished",
          "to": "/refurbished",
          "permiso": "Administrador,Gerente,Soporte",
          "icon": "fas icon-tools"
          },
          {
          "label": "Piezas",
          "to": "/piezas",
          "permiso": "Administrador,Gerente,Soporte",
          "icon": "fas icon-tools"
          },
          {
          "label": "Uso Interno",
          "to": "/productos-uso-interno",
          "permiso": "Administrador,Gerente,Soporte",
          "icon": "fas icon-box"
          }
        ]
      },
      {
        "label": "Contactos",
        "icon": "fas icon-users",
        "permiso": "Administrador,Gerente,Soporte",
        "items": [
          {
          "label": "Usuarios",
          "to": "/usuarios",
          "permiso": "Administrador,Gerente,Soporte",
          "icon": "fas icon-users"
          },
          {
            "label": "Clientes",
            "to": "/clientes",
            "permiso": "Administrador,Gerente,Soporte",
            "icon": "fas icon-users"
          },
          {
            "label": "Meseros",
            "to": "/meseros",
            "permiso": "Administrador,Gerente,Soporte",
            "icon": "fas icon-users"
          },
          {
          "label": "Proveedores",
          "to": "/proveedores",
          "permiso": "Administrador,Gerente,Soporte",
          "icon": "fas icon-users"
          },
          {
          "label": "Empleados",
          "to": "/empleados",
          "permiso": "Administrador,Soporte",
          "icon": "pi pi-circle"
          },
          {
          "label": "Cargos",
          "to": "/cargos",
          "permiso": "Administrador,Soporte",
          "icon": "pi pi-circle"
          },
          {
          "label": "Delivery",
          "to": "/delivery",
          "permiso": "Administrador,Gerente,Soporte",
          "icon": "fas icon-motorcycle"
          },
          {
          "label": "Instituciones",
          "to": "/instituciones",
          "permiso": "Administrador,Gerente,Soporte",
          "icon": "fas icon-circle-empty"
          },
          {
        "label": "Instaladores",
        "to": "/instaladores",
        "permiso": "Administrador,Gerente,Soporte",
        "icon": "fas "
        }
                
        ]
      },
      {
        "label": "Ventas",
        "icon": "fas icon-doc",
        "permiso": "Administrador,Gerente,Soporte",
        "items": [
          {
            "label": "Facturas",
            "to": "facturas",
            "permiso": "Administrador,Gerente,Soporte",
            "icon": "fas icon-doc"
          },
          {
          "label": "Cotizacion",
          "to": "/cotizacion",
          "permiso": "Administrador,Gerente,Soporte",
          "icon": "fas icon-doc"
          },
          {
          "label": "Ordenes",
          "to": "/ordenes",
          "permiso": "Administrador,Gerente,Soporte",
          "icon": "fas icon-doc"
          },
          {
          "label": "Pre Facturas",
          "to": "/pre_facturas",
          "permiso": "Administrador,Gerente,Soporte",
          "icon": "fas icon-doc"
          },
          {
          "label": "Financiamientos",
          "to": "/financiamientos",
          "permiso": "Administrador,Gerente,Soporte",
          "icon": "fas icon-doc"
          },
          {
          "label": "Apartados",
          "to": "/apartados",
          "permiso": "Administrador,Gerente,Soporte",
          "icon": "pi pi-circle"
          },
          {
          "label": "Reclamaciones",
          "to": "/reclamaciones",
          "permiso": "Administrador,Gerente,Soporte",
          "icon": "pi pi-circle"
          },
          {
          "label": "Notacredito",
          "to": "/notacredito",
          "permiso": "Administrador,Gerente,Soporte",
          "icon": "fas icon-docs-1"
          },
          {
          "label": "Conduce",
          "to": "/conduce",
          "permiso": "Administrador,Gerente,Soporte",
          "icon": "fas icon-truck"
          },
          {
          "label": "Metas",
          "to": "/metas",
          "permiso": "Administrador,Soporte",
          "icon": "pi pi-circle"
          },
          {
          "label": "Ventasenproceso",
          "to": "/ventasenproceso",
          "permiso": "Administrador,Gerente,Soporte",
          "icon": "fas icon-hourglass"
          },
          {
          "label": "Devoluciones",
          "to": "/devoluciones",
          "permiso": "Administrador,Gerente,Soporte",
          "icon": "fas icon-back"
          }

        ]
      },
      {
        "label": "Ruleta de Premios",
        "icon": "pi pi-gift",
        "permiso": "Administrador,Gerente,Soporte",
        "items": [
          {
            "label": "Girar Ruleta",
            "to": "/ruleta",
            "permiso": "Administrador,Gerente,Soporte,Cajero,Vendedor",
            "icon": "pi pi-spin"
          },
          {
            "label": "Gestionar Premios",
            "to": "/ruleta/premios",
            "permiso": "Administrador,Gerente,Soporte",
            "icon": "pi pi-cog"
          },
          {
            "label": "Configuración",
            "to": "/ruleta/configuracion",
            "permiso": "Administrador,Soporte",
            "icon": "pi pi-wrench"
          }
        ]
      },
      {
        "label": "Taller",
        "icon": "fas icon-tools",
        "items": [
          {
            "label": "Mi Taller",
            "to": "/mitaller",
            "permiso": "Administrador,Gerente,Soporte,Tecnico",
            "icon": "fas icon-wrench"
          },

          {
          "label": "Equipos",
          "to": "/equipos",
          "permiso": "Administrador,Gerente,Soporte",
          "icon": "fas icon-tablet"
          },
          {
          "label": "Tecnicos",
          "to": "/tecnicos",
          "permiso": "Administrador,Gerente,Soporte",
          "icon": "fas icon-users-1"
          },
          {
          "label": "Taller",
          "to": "/taller",
          "permiso": "Administrador,Gerente,Soporte",
          "icon": "fas icon-tools"
          },
          {
          "label": "Cellinfo",
          "to": "/cellinfo",
          "permiso": "Soporte",
          "icon": "fas icon-circle-empty"
          },
          {
          "label": "Recibirequipo",
          "to": "/recibirequipo",
          "permiso": "Administrador,Gerente,Soporte,Vendedor,Cajero",
          "icon": "fas icon-mobile"
          },
          {
          "label": "Hojaentrada",
          "to": "/hojaentrada",
          "permiso": "Administrador,Gerente,Soporte",
          "icon": "fas icon-circle-empty"
          }
        ]
      },
        {
        "label": "Contabilidad",
        "permiso": "Administrador,Gerente,Soporte,Contable",
        "icon": "fas icon-doc",
        "items": [
             {
              "label": "Cuentas",
              "to": "/cuentas",
              "permiso": "Administrador,Gerente,Soporte",
              "icon": "fas icon-th-list"
              },
              {
              "label": "Banco",
              "to": "/banco",
              "permiso": "Administrador,Gerente,Soporte",
              "icon": "fas icon-bank"
              },
              {
              "label": "Transaccionesbancarias",
              "to": "/transaccionesbancarias",
               "permiso": "Administrador,Gerente,Soporte,Contable",
              "icon": "fas icon-circle-empty"
              },
              {
              "label": "Cheques",
              "to": "/cheques",
              "permiso": "Administrador,Gerente,Soporte,Contable",
              "icon": "fas icon-doc-text"
              },
              {
              "label": "Conciliaciones Bancarias",
              "to": "/conciliaciones",
              "permiso": "Administrador,Gerente,Soporte,Contable",
              "icon": "fas icon-calculator"
              },
              {
              "label": "Reportes y Analítica",
              "to": "/reportes-analitica",
              "permiso": "Administrador,Gerente,Contable",
              "icon": "pi pi-chart-bar"
              },
              {
              "label": "Comisiones Bancarias",
              "to": "/comisionesbancarias",
              "permiso": "Administrador,Gerente,Soporte,Contable",
              "icon": "fas icon-money"
              },
              {
              "label": "Mayorgeneral",
              "to": "/mayorgeneral",
              "permiso": "Administrador,Gerente,Soporte",
              "icon": "fas icon-book"
              },
              {
              "label": "Asientodiario",
              "to": "/asientodiario",
              "permiso": "Administrador,Gerente,Soporte",
              "icon": "fas icon-book"
              },
              {
              "label": "Balance",
              "to": "/balance",
              "permiso": "Administrador,Gerente,Soporte",
              "icon": "fas icon-balance-scale"
              },
              {
              "label": "Entradas Extra",
              "to": "/entradas",
              "permiso": "Administrador,Gerente,Soporte",
              "icon": "fas icon-sort-alt-up"
              },
              {
              "label": "Entradas Fijas",
              "to": "/entradasfijas",
              "permiso": "Administrador,Gerente,Soporte",
              "icon": "fas icon-sort-alt-up"
              },
              {
              "label": "Gastos",
              "to": "/gastos",
              "permiso": "Administrador,Gerente,Soporte",
              "icon": "fas icon-sort-alt-down"
              },
              {
              "label": "Gastos Fijos",
              "to": "/gastosfijos",
              "permiso": "Administrador,Gerente,Soporte",
              "icon": "fas icon-sort-alt-down"
              },
              {
              "label": "Recibos",
              "to": "/recibos",
              "permiso": "Administrador,Gerente,Soporte",
              "icon": "fas icon-doc"
              },
              {
              "label": "Cuentas Cobrar",
              "to": "/cuentas_cobrar",
              "permiso": "Administrador,Gerente,Soporte",
              "icon": "fas icon-doc"
              },

              {
              "label": "Cuentas Pagar",
              "to": "/cuentasxpagar",
              "permiso": "Administrador,Gerente,Soporte",
              "icon": "fas icon-doc"
              },
              {
              "label": "Caja",
              "to": "/caja",
              "permiso": "Administrador,Gerente,Soporte",
              "icon": "fas icon-money"
              },
              {
              "label": "Confiscal",
              "to": "/confiscal",
              "permiso": "Administrador,Gerente,Soporte",
              "icon": "fas icon-balance-scale"
              },
              {
              "label": "Comprobantes E",
              "to": "/comprobantes-electronicos",
              "permiso": "Administrador,Gerente,Soporte",
              "icon": "fas icon-doc-text"
              },
              {
              "label": "Compras",
              "to": "/compras",
              "permiso": "Administrador,Gerente,Soporte",
              "icon": "fas icon-basket-alt"
              }
        ]
      },
      {
        "label": "Nómina",
        "icon": "fas icon-book",
        "permiso": "Administrador,Gerente,Soporte,Contable",
        "items": [
                  {
                  "label": "Nomina",
                  "to": "/nomina",
                  "permiso": "Administrador,Gerente,Soporte",
                  "icon": "fas icon-docs-1"
                  },
                  {
                  "label": "Prueba",
                  "to": "/prueba",
                  "icon": "fas icon-docs-1"
                  },
                  {
                  "label": "Printer",
                  "to": "/factura",
                  "icon": "fas pi pi-print"
                  }
        ]
      },
            {
                label: 'Fabrica',
                icon: 'pi pi-cart-plus',
                "permiso": "Soporte,Administrador,Gerente",
                  items: [
                  {
                  "label": "Fabrica",
                  "to": "/fabricacion",
                  "permiso": "Soporte,Administrador,Gerente",
                  "icon": "fas icon-docs-1"
                  },
                  {
                  "label": "Medidas",
                  "to": "/medidas",
                  "permiso": "Soporte,Administrador,Gerente",
                  "icon": "fas icon-circle-empty"
                  },
                  {
                  "label": "Marcos",
                  "to": "/marcos",
                  "permiso": "Administrador,Gerente,Soporte",
                  "icon": "pi pi-circle"
                  },
                  ]
            },

            {
                label: 'Soporte',
                icon: 'pi pi-cart-plus',
                "permiso": "Soporte",
                  items: [
                  {
                  "label": "Soporte",
                  "to": "/soporte",
                  "permiso": "Soporte",
                  "icon": "fas icon-docs-1"
                  },
                  {
                  "label": "Bitacora",
                  "to": "/bitacora",
                  "permiso": "Soporte",
                  "icon": "fas icon-docs-1"
                  },                  {
                  "label": "Tokens",
                  "to": "/tokens",
                  "permiso": "Administrador,Soporte",
                  "icon": "pi pi-circle"
                  },
                  {
                  "label": "Variables",
                  "to": "/variables",
                  "permiso": "Soporte",
                  "icon": "fas icon-docs-1"
                  },
                  {
                  "label": "Internet",
                  "to": "/internet",
                  "permiso": "Soporte",
                  "icon": "fas pi pi-globe"
                  },
                  {
                  "label": "Historial Consulta",
                  "to": "/historial_consulta",
                  "permiso": "Soporte",
                  "icon": "fas icon-circle-empty"
                  },
                  {
                  "label": "Configuracion_correo",
                  "to": "/configuracion_correo",
                  "permiso": "Administrador,Soporte",
                  "icon": "pi pi-circle"
                  },
                  {
                  "label": "Documentacion",
                  "to": "/documentacion",
                  "permiso": "Administrador,Gerente,Soporte",
                  "icon": "pi pi-circle"
                  },
                  {
                  "label": "Ferreteria",
                  "to": "/ferreteria",
                  "permiso": "Soporte",
                  "icon": "fas icon-docs-1"
                  },
                  {
                  "label": "Cuadres",
                  "to": "/cuadres",
                  "permiso": "Administrador,Soporte",
                  "icon": "pi pi-circle"
                  },
                  {
                  "label": "Menu",
                  "to": "/menu",
                  "permiso": "Soporte",
                  "icon": "fas icon-th"
                  },
                  {
                  "label": "Permisos",
                  "to": "/permisos",
                  "permiso": "Soporte",
                  "icon": "fas icon-lock-open-alt"
                  },
                  {
                  "label": "Printerconfig",
                  "to": "/printerconfig",
                  "icon": "fas icon-print"
                  },
                  {
                  "label": "Mensajes",
                  "to": "/mensajes",
                  "icon": "fas icon-mail"
                  },
                  {
                  "label": "Android",
                  "to": "/android",
                  "icon": "fas icon-mail"
                  },
                  {
                  "label": "Pin",
                  "to": "/pin",
                  "permiso": "Soporte",
                  "icon": "fas icon-circle-empty"
                  }

                  ]
            },

            {
                label: 'Vender',
                icon: 'pi pi-cart-plus',
                permiso: "Administrador,Gerente,Soporte,Cajero", 
                to: '/vender'
            },
            {
                label: 'Asistente AI',
                icon: 'pi pi-bolt',
                permiso: "Administrador,Gerente,Soporte,Cajero,Vendedor,Técnico",
                to: '/asistente-ia'
            },
            {
                label: 'Integraciones',
                icon: 'pi pi-plug',
                permiso: "Administrador,Gerente,Soporte",
                to: '/integraciones'
            },
            {
                label: 'Salir',
                icon: 'pi pi-times-circle',
                to: '/salir'
            }
        ]
    },


]);

const userPermissions = ref(['Soporte']); // Example user permissions

const verMenu = async () => {
  const datos = await peticiones(`${link.value}${api.value}/datosarray/menu`, {}, 'GET', tokenCifrado.value);
  menuArray.value = datos;
}

onMounted(async () => {
  const datosJSON = await envioElectron('datosarchivo');
  link.value = datosJSON.VITE_LINKURL;
  api.value = datosJSON.VITE_LINK_API;
  token.value = datosJSON.VITE_TOKEN;
  patronTelefono.value = datosJSON.VITE_PATRON_TELEFONO;
  linkImpresora.value = datosJSON.VITE_IMPRESORA_LOCAL;

  tokenCifrado.value = await encryptarPassword(token.value, 10);

  await verMenu();

  const usuarioLocal = localStorage.getItem('usuarioLocal');
  if (usuarioLocal) {
    const datosUser = JSON.parse(usuarioLocal);
    userPermissions.value = [datosUser[0].usuario];
  }
});

const hasPermission = (item) => {
  if (!item.permiso) return true; // Allow access if no permission required
  const requiredPermissions = item.permiso.split(',');
  return requiredPermissions.some(permission => userPermissions.value.includes(permission));
};

const searchQuery = ref('');

const deepCopy = (obj) => {
  return JSON.parse(JSON.stringify(obj));
};

const filterItems = (items) => {
  return items.filter(item => {
    const matchesSearchQuery = searchQuery.value
      ? item.label.toLowerCase().includes(searchQuery.value.toLowerCase())
      : true;

    if (item.items) {
      const filteredSubItems = filterItems(item.items);
      item.items = filteredSubItems; // Always update the items to the filtered list
    }

    const hasMatchingSubItems = item.items && item.items.length > 0;

    return hasPermission(item) && (matchesSearchQuery || hasMatchingSubItems);
  });
};

const filteredModel = computed(() => filterItems(deepCopy(model.value)));

</script>

<template>
  <label for="buscador"><i class="icon-search"></i> Buscador</label>
  <input v-model="searchQuery" id="buscador" type="text" placeholder="Buscar en el menú..." />
  <ul class="layout-menu">
    <template v-for="(item, i) in filteredModel" :key="item.label">
      <app-menu-item v-if="!item.separator" :item="item" :index="i"></app-menu-item>
      <li v-if="item.separator" class="menu-separator"></li>
    </template>
  </ul>
</template>

<style scoped>
input {
  margin-bottom: 1em;
  margin-top: 1em;
  padding: 0.5em;
  width: 100%;
  border-radius: 10px;
  box-sizing: border-box;
  border: 2px solid var(--primary-color); /* Cambia el borde al verde de PrimeVue */
}


</style>
