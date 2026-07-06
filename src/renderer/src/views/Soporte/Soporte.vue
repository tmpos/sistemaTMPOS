<script setup>
import { ref, onMounted, nextTick, watchEffect,computed,reactive } from 'vue';
import { useRouter,useRoute } from 'vue-router';
const router = useRouter();
import axios from 'axios';
//import * as XLSX from 'xlsx-lite';
import * as XLSX from 'xlsx';
import {enviarDatosPorPost,
  eliminarDatos,
  obtenerIdsSeleccionados,
  borrarTodoslosDatos,
  lenguajeDataTable,
  nfecha,
  transformarFechaTimestamp,
  convertirAFechaTimestamp,
  arrayToObjetoFromTabla,
  peticionesFetch,
  encryptarPassword,
  envioElectron,
  mensajetoast,
  peticiones,
  peticionImagen,
  enviarDatosLocalStorage,
  arrayToObjetoFromTablaOffline,
  cerrarSession,
  peticionesFetchOffline,
  crearTablaSiNoExiste,
  lasMayusculas} from '@/funciones/funciones.js';
  import bcrypt from 'bcryptjs';
import Swal from 'sweetalert2'
import QRCode from 'qrcode';
import { useToast } from "primevue/usetoast";
const toast = useToast();

import SelectButton from 'primevue/selectbutton';
import Dialog from 'primevue/dialog';
import Textarea from 'primevue/textarea';

import Button from 'primevue/button';
import FacturaPdfPrint from '@/components/FacturaPdfPrint.vue';

/************************************************************************/
//import { ipcRenderer } from "electron";
const empresaData = ref([])
const onLineOffline = ref('Online')
/************************************************************************/
const empresa1Inventario = ref("")
const link1Inventario = ref("")
const tabla1Inventario = ref("")
const empresa2Inventario = ref("")
const link2Inventario = ref("")
const tabla2Inventario = ref("")
/************************************************************************/
import LoadingOverlay from '../../Loading/LoadingOverlay.vue';
const loading = ref(false)
const inventario = ref(false)
const visibleCambioEmpresa = ref(false)
/************************************************************************/
const facturaPdfPrintRef = ref(null);
/************************************************************************/
const visibleImportarFactura = ref(false);
const facturaJsonInput = ref('');
const excelFacturaRows = ref([]);
const excelFacturaColumns = ref([]);
const excelFacturaSeleccionada = ref(null);
const excelFacturaArchivo = ref('');
const excelFacturaBusqueda = ref('');
/************************************************************************/
const visibleApiTest = ref(false);
const apiTestResult = ref('');
const apiTestLoading = ref(false);
const apiTestQuery = ref('');
/************************************************************************/
const qrCode = ref("");
const qrDialog = ref(false);
const phoneNumber = ref("");
const messageText = ref("");
/************************************************************************/
//import productos from '../../../../../resources/productos.json';
/************************************************************************/
const empresaPrincipal = ref([])
const empresaSecundaria = ref([])
/************************************************************************/
import {useDatosEmpresa} from '../../stores'
const datosEmpresa = useDatosEmpresa();

const link = ref(null);
const api = ref(null);
const token = ref(null);
const patronTelefono = ref(null);
const linkImpresora = ref(null);
const tokenCorto = ref(null)
const position = ref('top')
const tokenCifrado = ref(null);
/************************************************************************/
const tablasDemo = ref([]);
const tablasLocal = ref([]);
/************************************************************************/
const sqliteFileName = ref('');
const sqliteDB = ref(null);
const sqliteTablas = ref([]);
const sqliteTablaSeleccionada = ref(null);
const sqliteDestinoSeleccionado = ref(null);
const sqlitePreviewRows = ref([]);
const sqlitePreviewColumns = ref([]);
const sqliteLimit = ref(200);
const sqliteLoading = ref(false);
const sqliteImportando = ref(false);
const sqliteModoEnvio = ref('ARRAY COMPLETO');
const sqliteTamanoLote = ref(300);
/************************************************************************/
/************************************************************************/
const empresasArray = ref([]);
const empresaSelected = ref(null);
const busquedaEmpresaCtrlP = ref('');
const empresasFiltradasCtrlP = computed(() => {
  const termino = String(busquedaEmpresaCtrlP.value || '').trim().toLowerCase();
  if (!termino) return empresasArray.value;

  return empresasArray.value.filter((empresa) => {
    const nombre = String(empresa?.nombre || '').toLowerCase();
    const linkEmpresa = String(empresa?.link || '').toLowerCase();
    return nombre.includes(termino) || linkEmpresa.includes(termino);
  });
});
/************************************************************************/
const visibledatosEmpresa = ref(false)
const visibleDataTabla = ref(false)
const allDataTabla = ref([])
/************************************************************************/
watchEffect(async() => {
    //Aqui para vigilar eventos
  if(visibledatosEmpresa.value){
    await fnCargarEmpresasMaster();
  }


 if(inventario.value){
    tablasArray.value = await peticionesFetch(`${link.value}${api.value}`,`tablas`,{},tokenCifrado.value,'GET');
    await fnCargarEmpresasMaster();

 }

});
/************************************************************************/

const fnTablasDemo = async ()=>{
const response = await peticionesFetch(`https://demo.tmposrd.com/api2`, `tablas`, {}, tokenCifrado.value, 'GET');
    const jsonData = response;
    tablasDemo.value = jsonData;
}

/************************************************************************/
const fnTablasLocal = async ()=>{
const response = await peticionesFetchOffline('getAllTables');
    const jsonData = response;
    tablasLocal.value = jsonData;
}
/************************************************************************/
const cargarSqlJsDesdeCDN = async () => {
  if (window.__initSqlJs) {
    return window.__initSqlJs;
  }

  await new Promise((resolve, reject) => {
    const existente = document.querySelector('script[data-sqljs="1"]');
    if (existente) {
      if (window.initSqlJs) {
        resolve();
      } else {
        existente.addEventListener('load', resolve, { once: true });
        existente.addEventListener('error', reject, { once: true });
      }
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/sql.js@1.10.3/dist/sql-wasm.js';
    script.async = true;
    script.dataset.sqljs = '1';
    script.onload = resolve;
    script.onerror = () => reject(new Error('No se pudo cargar SQL.js desde CDN'));
    document.head.appendChild(script);
  });

  if (!window.initSqlJs) {
    throw new Error('SQL.js no esta disponible en este entorno');
  }

  window.__initSqlJs = await window.initSqlJs({
    locateFile: (file) => `https://cdn.jsdelivr.net/npm/sql.js@1.10.3/dist/${file}`
  });

  return window.__initSqlJs;
};

const escaparNombreTablaSQL = (tabla) => String(tabla || '').replace(/"/g, '""');

const procesarResultadoSql = (resultado) => {
  if (!Array.isArray(resultado) || resultado.length === 0) {
    return { columns: [], rows: [] };
  }

  const primera = resultado[0] || {};
  const columns = Array.isArray(primera.columns) ? primera.columns : [];
  const values = Array.isArray(primera.values) ? primera.values : [];
  const rows = values.map((arr) => {
    const obj = {};
    columns.forEach((col, idx) => {
      obj[col] = arr[idx];
    });
    return obj;
  });

  return { columns, rows };
};

const fnCargarSqliteExterno = async (event) => {
  const file = event?.target?.files?.[0];
  if (!file) {
    return;
  }

  sqliteLoading.value = true;
  try {
    const SQL = await cargarSqlJsDesdeCDN();
    const buffer = await file.arrayBuffer();

    if (sqliteDB.value) {
      try {
        sqliteDB.value.close();
      } catch (_) {}
    }

    const db = new SQL.Database(new Uint8Array(buffer));
    sqliteDB.value = db;
    sqliteFileName.value = file.name;

    const tablasResult = db.exec("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name");
    const { rows } = procesarResultadoSql(tablasResult);
    sqliteTablas.value = rows.map((r) => r.name).filter(Boolean);

    sqliteTablaSeleccionada.value = sqliteTablas.value[0] || null;
    sqliteDestinoSeleccionado.value = sqliteTablas.value.includes(sqliteDestinoSeleccionado.value)
      ? sqliteDestinoSeleccionado.value
      : sqliteTablaSeleccionada.value;

    await fnSqlitePreview();
    toast.add({ severity: 'success', summary: 'Ok', detail: 'Base SQLite cargada correctamente', life: 2500 });
  } catch (error) {
    console.error('Error cargando SQLite externo:', error);
    toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo leer la base SQLite', life: 3000 });
  } finally {
    sqliteLoading.value = false;
    if (event?.target) {
      event.target.value = '';
    }
  }
};

const fnSqlitePreview = async () => {
  if (!sqliteDB.value || !sqliteTablaSeleccionada.value) {
    sqlitePreviewRows.value = [];
    sqlitePreviewColumns.value = [];
    return;
  }

  try {
    const tablaEscapada = escaparNombreTablaSQL(sqliteTablaSeleccionada.value);
    const limit = Number(sqliteLimit.value) > 0 ? Number(sqliteLimit.value) : 200;
    const result = sqliteDB.value.exec(`SELECT * FROM "${tablaEscapada}" LIMIT ${limit}`);
    const { columns, rows } = procesarResultadoSql(result);
    sqlitePreviewColumns.value = columns.map((col) => ({ field: col, header: col }));
    sqlitePreviewRows.value = rows;
  } catch (error) {
    console.error('Error previsualizando tabla SQLite:', error);
    toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo cargar la vista previa de la tabla', life: 3000 });
  }
};

const fnImportarTablaSqliteASistema = async () => {
  if (!sqliteDB.value || !sqliteTablaSeleccionada.value) {
    toast.add({ severity: 'warn', summary: 'Aviso', detail: 'Primero carga y selecciona una tabla SQLite', life: 3000 });
    return;
  }

  const tablaDestino = String(sqliteDestinoSeleccionado.value || sqliteTablaSeleccionada.value || '').trim();
  if (!tablaDestino) {
    toast.add({ severity: 'warn', summary: 'Aviso', detail: 'Selecciona la tabla destino en el sistema', life: 3000 });
    return;
  }

  sqliteImportando.value = true;
  try {
    const columnasDestino = await peticionesFetchOffline('getTableColumns', tablaDestino);
    if (!Array.isArray(columnasDestino) || columnasDestino.length === 0) {
      toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron leer columnas de la tabla destino', life: 3000 });
      return;
    }

    const tablaEscapada = escaparNombreTablaSQL(sqliteTablaSeleccionada.value);
    const allResult = sqliteDB.value.exec(`SELECT * FROM "${tablaEscapada}"`);
    const { rows } = procesarResultadoSql(allResult);

    if (rows.length === 0) {
      toast.add({ severity: 'warn', summary: 'Aviso', detail: 'La tabla SQLite seleccionada no tiene datos', life: 3000 });
      return;
    }

    const columnasPermitidas = columnasDestino.filter((c) => c !== 'id');
    const registrosPreparados = [];
    let omitidos = 0;

    for (const row of rows) {
      const datosFiltrados = {};
      for (const col of columnasPermitidas) {
        if (Object.prototype.hasOwnProperty.call(row, col)) {
          datosFiltrados[col] = row[col] == null ? '' : row[col];
        }
      }

      if (Object.keys(datosFiltrados).length === 0) {
        omitidos += 1;
        continue;
      }

      if (datosFiltrados.hasOwnProperty('created_at') && !datosFiltrados.created_at) {
        datosFiltrados.created_at = nfecha('timestamp');
      }
      if (datosFiltrados.hasOwnProperty('updated_at')) {
        datosFiltrados.updated_at = nfecha('timestamp');
      }

      registrosPreparados.push(datosFiltrados);
    }

    if (registrosPreparados.length === 0) {
      toast.add({ severity: 'warn', summary: 'Aviso', detail: 'No hay registros validos para importar', life: 3000 });
      return;
    }

    let insertados = 0;

    if (sqliteModoEnvio.value === 'ARRAY COMPLETO') {
      const respuesta = await peticionesFetch(
        `${link.value}${api.value}`,
        `insertararray/${tablaDestino}`,
        registrosPreparados,
        tokenCifrado.value,
        'POST',
        'online'
      );

      if (respuesta?.ok) {
        insertados += Number(respuesta.insertados || registrosPreparados.length);
      } else if (Array.isArray(respuesta) && respuesta[0] === 'ok') {
        insertados += registrosPreparados.length;
      } else {
        omitidos += registrosPreparados.length;
      }
    } else if (sqliteModoEnvio.value === 'LOTE') {
      const tamano = Math.max(1, Number(sqliteTamanoLote.value) || 300);

      for (let i = 0; i < registrosPreparados.length; i += tamano) {
        const lote = registrosPreparados.slice(i, i + tamano);
        const respuesta = await peticionesFetch(
          `${link.value}${api.value}`,
          `insertararray/${tablaDestino}`,
          lote,
          tokenCifrado.value,
          'POST',
          'online'
        );

        if (respuesta?.ok) {
          insertados += Number(respuesta.insertados || lote.length);
        } else if (Array.isArray(respuesta) && respuesta[0] === 'ok') {
          insertados += lote.length;
        } else {
          omitidos += lote.length;
        }
      }
    } else {
      for (const datosFiltrados of registrosPreparados) {
        const res = await peticionesFetchOffline('insertData', tablaDestino, JSON.stringify(datosFiltrados));
        if (Array.isArray(res) && res[0] === 'ok') {
          insertados += 1;
        } else {
          omitidos += 1;
        }
      }
    }

    toast.add({
      severity: 'success',
      summary: 'Importacion completada',
      detail: `Modo: ${sqliteModoEnvio.value} | Insertados: ${insertados} | Omitidos: ${omitidos}`,
      life: 4000
    });
  } catch (error) {
    console.error('Error importando tabla SQLite al sistema:', error);
    toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo importar la tabla al sistema', life: 3500 });
  } finally {
    sqliteImportando.value = false;
  }
};
/************************************************************************/
const respuestaOk = (respuesta) => {
  return (Array.isArray(respuesta) && respuesta[0] === 'ok') || respuesta?.ok === true;
};

const fnCargarEmpresasMaster = async () => {
  try {
    const empresas = await peticionesFetch(
      `https://master.tmposrd.com${api.value}`,
      'datosarraypost',
      { tabla: 'empresas' },
      tokenCifrado.value,
      'POST'
    );
    empresasArray.value = Array.isArray(empresas) ? empresas : [];
  } catch (error) {
    console.error('Error cargando empresas master:', error);
    empresasArray.value = [];
    toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar las empresas', life: 3000 });
  }
};

const formatearFechaDDMMYYYY = (fecha) => {
  const dia = String(fecha.getDate()).padStart(2, '0');
  const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  const anio = fecha.getFullYear();
  return `${dia}/${mes}/${anio}`;
};

const obtenerProximoPago = () => {
  const hoy = new Date();
  const proximo = new Date(hoy);
  const diaOriginal = proximo.getDate();
  proximo.setMonth(proximo.getMonth() + 1);
  if (proximo.getDate() < diaOriginal) {
    proximo.setDate(0);
  }
  return formatearFechaDDMMYYYY(proximo);
};

const fnRegistrarEmpresa = async () => {
  const fechaActual = nfecha('fecha');
  const fechaProximoPago = obtenerProximoPago();

  const { value: valores } = await Swal.fire({
    title: 'Registrar empresa',
    html: `
      <div style="text-align:left;display:grid;gap:10px;">
        <div style="font-size:12px;color:#475569;font-weight:600;">Informacion principal</div>
        <button id="swal-empresa-defaults" type="button" class="swal2-styled" style="margin:0;background:#f59e0b;color:#111827;box-shadow:none;">
          Usar datos por defecto
        </button>
        <input id="swal-empresa-nombre" class="swal2-input" placeholder="Nombre de empresa">
        <input id="swal-empresa-link" class="swal2-input" placeholder="https://empresa.com">
        <input id="swal-empresa-token" class="swal2-input" placeholder="Token">
        <input id="swal-empresa-licencia" class="swal2-input" placeholder="Licencia">
        <input id="swal-empresa-encargado" class="swal2-input" placeholder="Encargado">

        <div style="font-size:12px;color:#475569;font-weight:600;margin-top:4px;">Contacto</div>
        <input id="swal-empresa-telefono" class="swal2-input" placeholder="Telefono">
        <input id="swal-empresa-email" class="swal2-input" placeholder="Email">
        <input id="swal-empresa-direccion" class="swal2-input" placeholder="Direccion">
        <input id="swal-empresa-legal" class="swal2-input" placeholder="Legal / RNC">

        <div style="font-size:12px;color:#475569;font-weight:600;margin-top:4px;">Datos comerciales</div>
        <input id="swal-empresa-estado" class="swal2-input" placeholder="Estado">
        <input id="swal-empresa-tipo" class="swal2-input" placeholder="Tipo">
        <input id="swal-empresa-precio" class="swal2-input" placeholder="Precio">
        <input id="swal-empresa-ultimopago" class="swal2-input" placeholder="Ultimo pago dd/mm/yyyy">
        <input id="swal-empresa-proximopago" class="swal2-input" placeholder="Proximo pago dd/mm/yyyy">
        <input id="swal-empresa-fecha" class="swal2-input" placeholder="Fecha dd/mm/yyyy">
      </div>
    `,
    focusConfirm: false,
    width: '52rem',
    showCancelButton: true,
    confirmButtonText: 'Registrar',
    cancelButtonText: 'Cancelar',
    didOpen: () => {
      const setValue = (id, value) => {
        const el = document.getElementById(id);
        if (el) el.value = value;
      };

      const aplicarDatosDefault = () => {
        setValue('swal-empresa-nombre', EMPRESA_PRINCIPAL_DEFAULT.nombre);
        setValue('swal-empresa-link', 'https://');
        setValue('swal-empresa-telefono', EMPRESA_PRINCIPAL_DEFAULT.telefono);
        setValue('swal-empresa-email', EMPRESA_PRINCIPAL_DEFAULT.email);
        setValue('swal-empresa-direccion', EMPRESA_PRINCIPAL_DEFAULT.direccion);
        setValue('swal-empresa-legal', EMPRESA_PRINCIPAL_DEFAULT.legal);
        setValue('swal-empresa-estado', 'ACTIVO');
        setValue('swal-empresa-tipo', 'FACTURACION');
        setValue('swal-empresa-precio', '2,000.00');
        setValue('swal-empresa-ultimopago', fechaActual);
        setValue('swal-empresa-proximopago', fechaProximoPago);
        setValue('swal-empresa-fecha', fechaActual);
      };

      aplicarDatosDefault();

      const botonDefaults = document.getElementById('swal-empresa-defaults');
      if (botonDefaults) {
        botonDefaults.addEventListener('click', aplicarDatosDefault);
      }
    },
    preConfirm: () => {
      const nombre = document.getElementById('swal-empresa-nombre')?.value?.trim();
      const linkEmpresa = document.getElementById('swal-empresa-link')?.value?.trim();
      const tokenEmpresa = document.getElementById('swal-empresa-token')?.value?.trim();
      const licencia = document.getElementById('swal-empresa-licencia')?.value?.trim();
      const encargado = String(document.getElementById('swal-empresa-encargado')?.value || '').trim().toUpperCase();
      const email = document.getElementById('swal-empresa-email')?.value?.trim();
      const telefono = document.getElementById('swal-empresa-telefono')?.value?.trim();
      const direccion = document.getElementById('swal-empresa-direccion')?.value?.trim();
      const legal = document.getElementById('swal-empresa-legal')?.value?.trim();
      const estado = document.getElementById('swal-empresa-estado')?.value?.trim() || 'ACTIVO';
      const tipo = document.getElementById('swal-empresa-tipo')?.value?.trim() || 'FACTURACION';
      const precio = document.getElementById('swal-empresa-precio')?.value?.trim() || '2,000.00';
      const ultimopago = document.getElementById('swal-empresa-ultimopago')?.value?.trim() || nfecha('fecha');
      const proximopago = document.getElementById('swal-empresa-proximopago')?.value?.trim() || obtenerProximoPago();
      const fecha = document.getElementById('swal-empresa-fecha')?.value?.trim() || nfecha('fecha');

      if (!nombre || !linkEmpresa) {
        Swal.showValidationMessage('Nombre y link son obligatorios');
        return false;
      }

      return {
        nombre,
        link: linkEmpresa,
        token: tokenEmpresa,
        licencia,
        estado,
        tipo,
        ultimopago,
        proximopago,
        precio,
        encargado,
        telefono,
        email,
        direccion,
        legal,
        fecha
      };
    }
  });

  if (!valores) return;

  try {
    //const dataBase = await arrayToObjetoFromTabla('empresas');
    const dataBase = await peticionesFetch(`https://master.tmposrd.com${api.value}`, `campos/empresas`, {}, tokenCifrado.value, 'GET')

    if (dataBase) {
      dataBase.shift()
    }

    var miObjeto = dataBase.reduce(function (obj, elemento, index, dataBase) {
      obj[elemento] = ''

      return obj
    }, {})

    
    const datosEnvio = { ...(miObjeto || {}), ...valores };

    if (datosEnvio.hasOwnProperty('created_at')) {
      datosEnvio.created_at = nfecha('timestamp');
    }
    if (datosEnvio.hasOwnProperty('updated_at')) {
      datosEnvio.updated_at = nfecha('timestamp');
    }
    
    delete datosEnvio.legal
    const respuesta = await peticionesFetch(
      `https://master.tmposrd.com${api.value}`,
      'insertar/empresas',
      datosEnvio,
      tokenCifrado.value,
      'POST'
    );

    if (respuestaOk(respuesta)) {
      toast.add({ severity: 'success', summary: 'Exito', detail: 'Empresa registrada correctamente', life: 2800 });
      await fnCargarEmpresasMaster();
    } else {
      toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo registrar la empresa', life: 3200 });
    }
  } catch (error) {
    console.error('Error registrando empresa:', error);
    toast.add({ severity: 'error', summary: 'Error', detail: 'Fallo al registrar empresa', life: 3200 });
  }
};

const fnEditarEmpresa = async (empresa) => {
  if (!empresa || !empresa.id) {
    toast.add({ severity: 'warn', summary: 'Aviso', detail: 'Empresa invalida para editar', life: 2600 });
    return;
  }

  const { value: valores } = await Swal.fire({
    title: 'Editar empresa',
    html: `
      <div style="text-align:left;display:grid;gap:10px;">
        <div style="font-size:12px;color:#475569;font-weight:600;">Informacion principal</div>
        <input id="swal-edit-nombre" class="swal2-input" placeholder="Nombre de empresa">
        <input id="swal-edit-link" class="swal2-input" placeholder="https://empresa.com">
        <input id="swal-edit-token" class="swal2-input" placeholder="Token">
        <input id="swal-edit-licencia" class="swal2-input" placeholder="Licencia">
        <input id="swal-edit-encargado" class="swal2-input" placeholder="Encargado">

        <div style="font-size:12px;color:#475569;font-weight:600;margin-top:4px;">Contacto</div>
        <input id="swal-edit-telefono" class="swal2-input" placeholder="Telefono">
        <input id="swal-edit-email" class="swal2-input" placeholder="Email">
        <input id="swal-edit-direccion" class="swal2-input" placeholder="Direccion">
        <input id="swal-edit-legal" class="swal2-input" placeholder="Legal / RNC">

        <div style="font-size:12px;color:#475569;font-weight:600;margin-top:4px;">Datos comerciales</div>
        <input id="swal-edit-estado" class="swal2-input" placeholder="Estado">
        <input id="swal-edit-tipo" class="swal2-input" placeholder="Tipo">
        <input id="swal-edit-precio" class="swal2-input" placeholder="Precio">
        <input id="swal-edit-ultimopago" class="swal2-input" placeholder="Ultimo pago dd/mm/yyyy">
        <input id="swal-edit-proximopago" class="swal2-input" placeholder="Proximo pago dd/mm/yyyy">
        <input id="swal-edit-fecha" class="swal2-input" placeholder="Fecha dd/mm/yyyy">
      </div>
    `,
    focusConfirm: false,
    width: '52rem',
    showCancelButton: true,
    confirmButtonText: 'Guardar cambios',
    cancelButtonText: 'Cancelar',
    didOpen: () => {
      const nombre = document.getElementById('swal-edit-nombre');
      const linkEmpresa = document.getElementById('swal-edit-link');
      const tokenEmpresa = document.getElementById('swal-edit-token');
      const licencia = document.getElementById('swal-edit-licencia');
      const encargado = document.getElementById('swal-edit-encargado');
      const estado = document.getElementById('swal-edit-estado');
      const tipo = document.getElementById('swal-edit-tipo');
      const precio = document.getElementById('swal-edit-precio');
      const ultimopago = document.getElementById('swal-edit-ultimopago');
      const proximopago = document.getElementById('swal-edit-proximopago');
      const fecha = document.getElementById('swal-edit-fecha');
      const email = document.getElementById('swal-edit-email');
      const telefono = document.getElementById('swal-edit-telefono');
      const direccion = document.getElementById('swal-edit-direccion');
      const legal = document.getElementById('swal-edit-legal');

      if (nombre) nombre.value = String(empresa.nombre || '');
      if (linkEmpresa) linkEmpresa.value = String(empresa.link || '');
      if (tokenEmpresa) tokenEmpresa.value = String(empresa.token || '');
      if (licencia) licencia.value = String(empresa.licencia || '');
      if (encargado) encargado.value = String(empresa.encargado || '').toUpperCase();
      if (estado) estado.value = String(empresa.estado || 'ACTIVO');
      if (tipo) tipo.value = String(empresa.tipo || 'FACTURACION');
      if (precio) precio.value = String(empresa.precio || '2,000.00');
      if (ultimopago) ultimopago.value = String(empresa.ultimopago || nfecha('fecha'));
      if (proximopago) proximopago.value = String(empresa.proximopago || obtenerProximoPago());
      if (fecha) fecha.value = String(empresa.fecha || nfecha('fecha'));
      if (email) email.value = String(empresa.email || '');
      if (telefono) telefono.value = String(empresa.telefono || '');
      if (direccion) direccion.value = String(empresa.direccion || '');
      if (legal) legal.value = String(empresa.legal || '');
    },
    preConfirm: () => {
      const nombre = document.getElementById('swal-edit-nombre')?.value?.trim();
      const linkEmpresa = document.getElementById('swal-edit-link')?.value?.trim();
      const tokenEmpresa = document.getElementById('swal-edit-token')?.value?.trim();
      const licencia = document.getElementById('swal-edit-licencia')?.value?.trim();
      const encargado = String(document.getElementById('swal-edit-encargado')?.value || '').trim().toUpperCase();
      const estado = document.getElementById('swal-edit-estado')?.value?.trim() || 'ACTIVO';
      const tipo = document.getElementById('swal-edit-tipo')?.value?.trim() || 'FACTURACION';
      const precio = document.getElementById('swal-edit-precio')?.value?.trim() || '2,000.00';
      const ultimopago = document.getElementById('swal-edit-ultimopago')?.value?.trim() || nfecha('fecha');
      const proximopago = document.getElementById('swal-edit-proximopago')?.value?.trim() || obtenerProximoPago();
      const fecha = document.getElementById('swal-edit-fecha')?.value?.trim() || nfecha('fecha');
      const email = document.getElementById('swal-edit-email')?.value?.trim();
      const telefono = document.getElementById('swal-edit-telefono')?.value?.trim();
      const direccion = document.getElementById('swal-edit-direccion')?.value?.trim();
      const legal = document.getElementById('swal-edit-legal')?.value?.trim();

      if (!nombre || !linkEmpresa) {
        Swal.showValidationMessage('Nombre y link son obligatorios');
        return false;
      }

      return {
        nombre,
        link: linkEmpresa,
        token: tokenEmpresa,
        licencia,
        estado,
        tipo,
        ultimopago,
        proximopago,
        precio,
        encargado,
        telefono,
        email,
        direccion,
        legal,
        fecha
      };
    }
  });

  if (!valores) return;

  try {
    const datosEnvio = { ...empresa, ...valores };
    if (datosEnvio.hasOwnProperty('updated_at')) {
      datosEnvio.updated_at = nfecha('timestamp');
    }

    const respuesta = await peticionesFetch(
      `https://master.tmposrd.com${api.value}`,
      'actualizarcampos/empresas',
      datosEnvio,
      tokenCifrado.value,
      'POST'
    );

    if (respuestaOk(respuesta)) {
      toast.add({ severity: 'success', summary: 'Exito', detail: 'Empresa actualizada correctamente', life: 2800 });
      await fnCargarEmpresasMaster();
    } else {
      toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo actualizar la empresa', life: 3200 });
    }
  } catch (error) {
    console.error('Error editando empresa:', error);
    toast.add({ severity: 'error', summary: 'Error', detail: 'Fallo al editar empresa', life: 3200 });
  }
};

const fnEliminarEmpresa = async (empresa) => {
  if (!empresa || !empresa.id) {
    toast.add({ severity: 'warn', summary: 'Aviso', detail: 'Empresa invalida para eliminar', life: 2600 });
    return;
  }

  const confirmacion = await Swal.fire({
    title: 'Eliminar empresa',
    html: `Se eliminara <b>${String(empresa.nombre || 'esta empresa')}</b>. Esta accion no se puede deshacer.`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Si, eliminar',
    cancelButtonText: 'Cancelar',
    confirmButtonColor: '#dc2626'
  });

  if (!confirmacion.isConfirmed) return;

  try {
    let respuesta = await peticionesFetch(
      `https://master.tmposrd.com${api.value}`,
      'borrarporcampo/empresas',
      { campo: 'id', valor: empresa.id },
      tokenCifrado.value,
      'POST'
    );

    if (!respuestaOk(respuesta)) {
      respuesta = await peticionesFetch(
        `https://master.tmposrd.com${api.value}`,
        `borrar/empresas/id/${empresa.id}`,
        {},
        tokenCifrado.value,
        'GET'
      );
    }

    if (respuestaOk(respuesta)) {
      if (empresaSelected.value?.id === empresa.id) {
        empresaSelected.value = null;
      }
      toast.add({ severity: 'success', summary: 'Exito', detail: 'Empresa eliminada correctamente', life: 2800 });
      await fnCargarEmpresasMaster();
    } else {
      toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo eliminar la empresa', life: 3200 });
    }
  } catch (error) {
    console.error('Error eliminando empresa:', error);
    toast.add({ severity: 'error', summary: 'Error', detail: 'Fallo al eliminar empresa', life: 3200 });
  }
};
/************************************************************************/
// Initialize `updateInfo` with a safe default structure
const updateInfo = ref({
  available: false,
  version: null,
  error: null
});

// Async function to check for updates
const revisarActualizacion = async () => {
  try {
    const result = await window.electron.ipcRenderer.invoke('revisarActualizacionDisponible');
    updateInfo.value = {
      available: result.available,
      version: result.version,
      error: null
    };
  } catch (error) {
    // Handle error and update `updateInfo` with the error message
    updateInfo.value.error = error.message;
  }
};
/************************************************************************/
const fnCrearTablasDesdeAPI = async () => {
  const tablas = await peticionesFetch(`${link.value}${api.value}`, 'tablas', {}, tokenCifrado.value, 'GET','online'); // Obtener las tablas de la API

  for (const tabla of tablas) {
    const campos = await peticionesFetch(`${link.value}${api.value}`, `campos/${tabla}`, {}, tokenCifrado.value, 'GET','online');

    const camposFiltrados = campos
      .filter(campo => campo !== 'id')
      .map(campo => campo.includes(' ') ? campo : `${campo} TEXT`);

    const camposString = camposFiltrados.join(', ');

    const datosArray = await peticionesFetch(`${link.value}${api.value}`,'datosarraypost',{'tabla':tabla},tokenCifrado.value,'POST','online');

    for (let verificaIMG of datosArray) {
        if (verificaIMG.imagen && verificaIMG.imagen !='') {
            const crearDirectorio = await window.electron.ipcRenderer.invoke(
                'consultaservidor',
                'crearDirectorio',
                `${tabla}/${verificaIMG.imagen}`
            );


const arrayIMG = await peticionImagen(link.value, api.value, tabla, verificaIMG.imagen, tokenCifrado.value, 'full', 'online');

// Verifica que arrayIMG sea un array y no esté vacío
if (Array.isArray(arrayIMG) && arrayIMG.length > 0) {
    console.log("arrayIMG", arrayIMG);
    for (let imagen of arrayIMG) {
        console.log("imagen", imagen);

        // Construye la URL y la ruta de destino para la imagen
        const imagenURL = `${link.value}/vista/img/${tabla}/${verificaIMG.imagen}/${imagen}`;
        const rutaDestino = `${tabla}/${verificaIMG.imagen}/${imagen}`;

        // Invoca la función para descargar la imagen
        const descargarImagen = await window.electron.ipcRenderer.invoke(
            'consultaservidor',
            'descargarImagen',
            imagenURL,
            rutaDestino
        );

        console.log(`Imagen descargada: ${rutaDestino}`);
    }
} else {
    console.log("arrayIMG no es un array o está vacío");
}



        }
    }




    //const resultado = await window.electron.ipcRenderer.invoke('creartabla', tabla, camposString);
    const resultado = await window.electron.ipcRenderer.invoke('creartablacondatos', tabla, camposString,datosArray);

    // Manejar el resultado
    if (resultado.success) {
      toast.add({
        severity: "success",
        summary: "Éxito",
        detail: `Tabla ${tabla} creada correctamente`,
        life: 3000,
      });
    } else {
      toast.add({
        severity: "error",
        summary: "Error",
        detail: `Error al crear la tabla ${tabla}: ${resultado.message}`,
        life: 3000,
      });
    }
  }
};

/************************************************************************/
const handleKeyDown = (event) => {
  if (event.ctrlKey && event.key === 'p') {
    event.preventDefault();

  Swal.fire({
    title: 'Introduce la contraseña',
    input: 'password',
    inputPlaceholder: 'Contraseña',
    showCancelButton: true,
    confirmButtonText: 'Aceptar',
    cancelButtonText: 'Cancelar'
  }).then(async(result) => {
    if (result.isConfirmed) {

      const contrasenaIngresada = result.value;

      if (contrasenaIngresada === token.value || contrasenaIngresada === tokenCorto.value ) {

        await fnCargarEmpresasMaster();

        busquedaEmpresaCtrlP.value = ''
        visibleCambioEmpresa.value = true
        } else {
         toast.add({ severity: 'error', summary: 'Error', detail: 'Contraseña incorrecta', life: 3000 });
        }

    }
  })

  }
};
/************************************************************************/
const fetchEmpresaDatosarraypost = async () => {
  try {
    const response = await peticionesFetchOffline('getDataAsArray', 'empresa');
    empresaData.value = response;
    //empresaDataNames.value = response.map(empresa=>empresa.name);
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to fetch data from empresa',
      life: 3000
    });
  }
};
/************************************************************************/
const datosJSONR = ref({})
/************************************************************************/
const parseFacturaJsonSeguro = (payload) => {
  if (payload == null) {
    return null;
  }

  if (typeof payload === 'string') {
    try {
      return JSON.parse(payload);
    } catch (error) {
      console.error('No se pudo parsear el JSON de la factura:', error);
      return null;
    }
  }

  return payload;
};
/************************************************************************/
const normalizarClaveFactura = (value) => String(value || '')
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase()
  .replace(/[^a-z0-9]/g, '');
/************************************************************************/
const normalizarHeaderExcel = (value, index = 0) => {
  const limpio = String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');

  return limpio || `columna_${index + 1}`;
};
/************************************************************************/
const HEADER_FACTURA_ALIASES = [
  'no_factura',
  'factura',
  'numero_factura',
  'nombre_cliente',
  'cod_cliente',
  'cliente',
  'productos',
  'metodo_pago',
  'fecha_emision',
  'comprobante',
  'tipo_factura',
  'total',
  'subtotal',
  'impuesto',
  'descuento',
  'token'
];
/************************************************************************/
const encontrarFilaEncabezadoExcel = (filas = []) => {
  const limite = Math.min(filas.length, 15);
  let mejorIndice = 0;
  let mejorPuntaje = -1;

  for (let i = 0; i < limite; i++) {
    const fila = Array.isArray(filas[i]) ? filas[i] : [];
    const celdas = fila
      .map((cell, index) => normalizarHeaderExcel(cell, index))
      .filter(Boolean);

    const noVacias = fila.filter((cell) => String(cell ?? '').trim() !== '').length;
    if (!noVacias) continue;

    const coincidencias = celdas.filter((cell) => HEADER_FACTURA_ALIASES.includes(cell)).length;
    const unicas = new Set(celdas).size;
    const puntaje = (coincidencias * 10) + unicas + noVacias;

    if (puntaje > mejorPuntaje) {
      mejorPuntaje = puntaje;
      mejorIndice = i;
    }
  }

  return mejorIndice;
};
/************************************************************************/
const obtenerValorFilaPorAlias = (fila, aliases = []) => {
  if (!fila || typeof fila !== 'object') {
    return null;
  }

  const mapa = new Map(
    Object.keys(fila).map((key) => [normalizarClaveFactura(key), fila[key]])
  );

  for (const alias of aliases) {
    const valor = mapa.get(normalizarClaveFactura(alias));
    if (valor !== undefined && valor !== null && valor !== '') {
      return valor;
    }
  }

  return null;
};
/************************************************************************/
const obtenerNumeroFacturaDesdeFila = (fila) => obtenerValorFilaPorAlias(fila, [
  'no_factura',
  'nofactura',
  'factura',
  'numero_factura',
  'numerofactura',
  'no_comprobante',
  'nocomprobante',
  'comprobante',
  'token'
]);
/************************************************************************/
const normalizarRegistroUnico = (data) => {
  if (Array.isArray(data)) {
    return data[0] || null;
  }

  return data || null;
};
/************************************************************************/
const construirFacturaDesdeFila = (fila) => {
  if (!fila || typeof fila !== 'object') {
    return null;
  }

  const facturaJson = obtenerValorFilaPorAlias(fila, ['factura_json', 'json_factura', 'facturajson', 'json']);
  if (facturaJson) {
    const parsed = parseFacturaJsonSeguro(facturaJson);
    if (parsed) {
      return parsed.factura ?? parsed;
    }
  }

  const productosJson = obtenerValorFilaPorAlias(fila, ['productos', 'detalle', 'items']);
  const factura = { ...fila };
  const noFactura = obtenerNumeroFacturaDesdeFila(fila);

  if (noFactura && !factura.no_factura) {
    factura.no_factura = noFactura;
  }

  if (productosJson && typeof productosJson === 'string') {
    const productos = parseFacturaJsonSeguro(productosJson);
    if (productos) {
      factura.productos = productos;
    }
  }

  return factura;
};
/************************************************************************/
const prepararPayloadFactura = async (payload) => {
  const data = parseFacturaJsonSeguro(payload);

  if (!data) {
    throw new Error('Debes enviar un JSON valido');
  }

  let factura = data.factura ?? data;
  let cliente = data.cliente ?? null;
  let creditoData = data.creditoData ?? null;

  const numeroFactura = factura?.no_factura || factura?.factura || factura?.numero;
  if ((!factura?.productos || !factura?.cod_cliente || !factura?.fecha_emision) && numeroFactura) {
    const facturaOffline = normalizarRegistroUnico(
      await peticionesFetchOffline('getDataByField', 'facturas', 'no_factura', numeroFactura)
    );
    if (facturaOffline) {
      factura = facturaOffline;
    }
  }

  if (!factura?.no_factura) {
    throw new Error('La factura debe incluir no_factura');
  }

  if (!cliente && factura.cod_cliente) {
    cliente = normalizarRegistroUnico(
      await peticionesFetchOffline('getDataByField', 'clientes', 'codigo', factura.cod_cliente)
    );
  }

  if (!creditoData && String(factura?.metodo_pago || '').toUpperCase() === 'CREDITO') {
    creditoData = await peticionesFetchOffline('getDataByField', 'cuentas_cobrar', 'no_factura', factura.no_factura);
  }

  return {
    factura,
    cliente,
    creditoData,
    datosEmpresa: data.datosEmpresa ?? enviarDatosLocalStorage()
  };
};
/************************************************************************/
const fnGenerarFacturaDesdeJson = async (payload) => {
  try {
    const facturaData = await prepararPayloadFactura(payload);

    await nextTick();

    if (!facturaPdfPrintRef.value?.printFactura) {
      toast.add({ severity: 'error', summary: 'Error', detail: 'El componente FacturaPdfPrint no esta disponible', life: 3000 });
      return false;
    }

    await facturaPdfPrintRef.value.printFactura({
      factura: facturaData.factura,
      cliente: facturaData.cliente,
      datosEmpresa: facturaData.datosEmpresa,
      creditoData: facturaData.creditoData
    });

    return true;
  } catch (error) {
    console.error('Error generando factura desde JSON:', error);
    toast.add({ severity: 'error', summary: 'Error', detail: error?.message || 'No se pudo generar la factura', life: 3000 });
    return false;
  }
};
/************************************************************************/
const fnProcesarFacturaPegada = async () => {
  if (!String(facturaJsonInput.value || '').trim()) {
    toast.add({ severity: 'warn', summary: 'Aviso', detail: 'Pega el objeto de la factura', life: 3000 });
    return;
  }

  const ok = await fnGenerarFacturaDesdeJson(facturaJsonInput.value);
  if (ok) {
    visibleImportarFactura.value = false;
  }
};
/************************************************************************/
const fnAbrirImportadorFacturas = async () => {
  visibleImportarFactura.value = true;
  facturaJsonInput.value = '';
  excelFacturaRows.value = [];
  excelFacturaColumns.value = [];
  excelFacturaSeleccionada.value = null;
  excelFacturaArchivo.value = '';
  excelFacturaBusqueda.value = '';
  await nextTick();
};
/************************************************************************/
const fnCargarExcelFacturas = async (event) => {
  const file = event?.target?.files?.[0];
  if (!file) {
    return;
  }

  try {
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: 'array' });
    const firstSheet = workbook.SheetNames[0];

    if (!firstSheet) {
      throw new Error('El archivo no contiene hojas');
    }

    const worksheet = workbook.Sheets[firstSheet];
    const rowsRaw = XLSX.utils.sheet_to_json(worksheet, {
      header: 1,
      defval: '',
      blankrows: false
    });

    const filasExcel = Array.isArray(rowsRaw) ? rowsRaw : [];
    const indiceEncabezado = encontrarFilaEncabezadoExcel(filasExcel);
    const encabezadosOriginales = Array.isArray(filasExcel[indiceEncabezado]) ? filasExcel[indiceEncabezado] : [];
    const filasDatos = filasExcel.slice(indiceEncabezado + 1);

    const headersNormalizados = encabezadosOriginales.map((header, index) => normalizarHeaderExcel(header, index));

    const headersUnicos = headersNormalizados.map((header, index) => {
      const repetidosAntes = headersNormalizados.slice(0, index).filter((item) => item === header).length;
      return repetidosAntes > 0 ? `${header}_${repetidosAntes + 1}` : header;
    });

    excelFacturaRows.value = filasDatos
      .filter((row) => Array.isArray(row) && row.some((cell) => String(cell ?? '').trim() !== ''))
      .map((row, index) => {
        const fila = { __rowId: index + 1 };
        headersUnicos.forEach((header, headerIndex) => {
          fila[header] = row[headerIndex] ?? '';
        });
        return fila;
      });

    excelFacturaColumns.value = [
      { field: '__rowId', header: '#' },
      ...headersUnicos.map((key) => ({ field: key, header: key }))
    ];
    excelFacturaArchivo.value = file.name;
    excelFacturaSeleccionada.value = null;

    if (!excelFacturaRows.value.length) {
      toast.add({ severity: 'warn', summary: 'Aviso', detail: 'El Excel no tiene filas con encabezados', life: 3000 });
      return;
    }

    toast.add({ severity: 'success', summary: 'Ok', detail: `Excel cargado: ${excelFacturaRows.value.length} filas`, life: 2500 });
  } catch (error) {
    console.error('Error leyendo Excel de facturas:', error);
    toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo leer el archivo Excel', life: 3000 });
  } finally {
    if (event?.target) {
      event.target.value = '';
    }
  }
};
/************************************************************************/
const fnImprimirFacturaSeleccionadaExcel = async (fila = null) => {
  const row = fila || excelFacturaSeleccionada.value;
  if (!row) {
    toast.add({ severity: 'warn', summary: 'Aviso', detail: 'Selecciona una fila del Excel', life: 3000 });
    return;
  }

  const factura = construirFacturaDesdeFila(row);
  if (!factura) {
    toast.add({ severity: 'warn', summary: 'Aviso', detail: 'No se pudo interpretar la fila como factura', life: 3000 });
    return;
  }

  const ok = await fnGenerarFacturaDesdeJson({ factura });
  if (ok) {
    visibleImportarFactura.value = false;
  }
};
/************************************************************************/
onMounted(async() => {

const datosJSON = await envioElectron('datosarchivo');
datosJSONR.value = datosJSON
link.value = datosJSONR.value.VITE_LINKURL;
api.value = datosJSONR.value.VITE_LINK_API;
token.value = datosJSONR.value.VITE_TOKEN;
patronTelefono.value = datosJSONR.value.VITE_PATRON_TELEFONO;
linkImpresora.value = datosJSONR.value.VITE_IMPRESORA_LOCAL;
tokenCorto.value = datosJSONR.value.VITE_TOKEN_CORTO;
const online = datosJSONR.value.ONLINE;
const offline = datosJSONR.value.OFFLINE;
console.log("offline", offline);
tokenCifrado.value = await encryptarPassword(token.value, 10);

if(online === 'true'){
   onLineOffline.value = 'Online'

}else if(offline === 'true'){
   onLineOffline.value = 'Offline'
}else{
   onLineOffline.value = 'Both'

}




window.addEventListener('keydown', handleKeyDown);
window.fnGenerarFacturaDesdeJson = fnGenerarFacturaDesdeJson;

await fetchEmpresaDatosarraypost()
await fnTablasLocal()


});
/************************************************************************/
const fnSincronizar = async()=>{
loading.value = true
    await crearTablaSiNoExiste(link.value,api.value,'ventasenproceso',["cod_cliente","nombre","productos","turno","fecha","token","usuario"],tokenCifrado.value,toast);

    await crearTablaSiNoExiste(link.value,api.value,'notacredito',["no_credito","no_factura","b04","ncf","cliente","cod_cliente","concepto","total","fecha","hora","nota","usuario"],tokenCifrado.value,toast);

    await crearTablaSiNoExiste(link.value,api.value,'mesas',["cod_cliente","nombre","productos","turno","fecha","token","usuario"],tokenCifrado.value,toast);

    await crearTablaSiNoExiste(link.value,api.value,'combos',["nombre","productos","usuario"],tokenCifrado.value,toast);

    await crearTablaSiNoExiste(link.value,api.value,'categorias',["nombre", "icono", "usuario"],tokenCifrado.value,toast);

    await crearTablaSiNoExiste(link.value,api.value,'garantia',["referencia","garantia","usuario"],tokenCifrado.value,toast);

    await crearTablaSiNoExiste(link.value,api.value,'productos',[
     "codigo",
    "codigo_barra",
    "nombre",
    "categoria",
    "proveedor",
    "marca",
    "modelo",
    "precio_compra",
    "impuestos",
    "tipo_impuesto",
    "ganancia",
    "precio_venta",
    "precio_min",
    "precio_xmayor",
    "oferta",
    "impuesto_venta",
    "precio_final",
    "stock",
    "alerta",
    "empaque",
    "instalacion",
    "comision",
    "vencimiento",
    "ubicacion",
    "imagen",
    "usuario",
    "otro",
    "caracteristicas",
    "descripcion",
],tokenCifrado.value,toast);

    await crearTablaSiNoExiste(link.value,api.value,'clientes',["nombre", "cedula", "telefono", "email", "password", "direccion", "whatsapp", "genero", "estado_civil", "apodo", "fecha_nacimiento", "edad", "precio_fijado", "empresa", "cargo", "telefono_empresa", "direccion_empresa", "codigo", "n_comercial", "rnc", "imagen", "activo", "usuario"],tokenCifrado.value,toast);

    await crearTablaSiNoExiste(link.value,api.value,'facturas',["no_factura","tipo_factura","comprobante","cod_cliente","nombre_cliente","telefono_cliente","productos","vendedor","metodo_pago","tarjeta","transferencia","efectivo","canal_venta","fecha_emision","impuesto","descuento","subtotal","total","ganancia","financiera","estado_factura","fecha_estado","mes","year","hora","otro","nota","cajero","token","usuario"],tokenCifrado.value,toast);

    await crearTablaSiNoExiste(link.value,api.value,'cotizacion',["no_cotizacion","cod_cliente","nombre_cliente","telefono_cliente","whatsapp_cliente","email_cliente","direccion_cliente","rnc_cliente","nombre_comercial","productos","vendedor","metodo_pago","fecha_emision","impuesto","descuento","subtotal","total","estado_cotizacion","no_factura","fecha_cambio","entidad_financiera","vencimiento","nota","year","mes","hora","usuario"],tokenCifrado.value,toast);
    await crearTablaSiNoExiste(link.value,api.value,'metodopago',["nombre","usuario"],tokenCifrado.value,toast);
    await crearTablaSiNoExiste(link.value,api.value,'imei',["imei, estado, fecha, equipo, proveedor, id_equi, fecha_venta, hora_venta, comprador, detalles, usuario"],tokenCifrado.value,toast);

    await crearTablaSiNoExiste(link.value,api.value,'cuentas_cobrar',["no_emision", "no_factura", "cod_cliente", "nombre_cliente", "cedula_cliente", "telefono_cliente", "whatsapp_cliente", "email_cliente", "direccion_cliente", "rnc_cliente", "nombrecomercial_cliente", "fecha_emision", "monto_credito", "interes", "fecha_vencimiento", "cuotas", "saldo", "fecha_pago", "pagos", "estatus", "hora", "vendedor", "delivery", "nota", "usuario"],tokenCifrado.value,toast);

    await crearTablaSiNoExiste(link.value,api.value,'asientodiario',["numero","fecha","hora","asiento","descripcion","usuario"],tokenCifrado.value,toast);

loading.value = false
}
/************************************************************************/
const verTablas = ref(false);
const visibleAgregarTabla = ref(false);
const tablasArray = ref([]);
const fnVerTablas = async()=>{
  verTablas.value = !verTablas.value;
  tablasArray.value = await peticionesFetchOffline('getAllTables');
}
/************************************************************************/
const tablaSelected = ref(null);
const visibledatosTabla = ref(false)
const visibleActualizarCampos = ref(false)
const camposTablaSelected = ref('')
const camposTablaSelectedSolos = ref([])


const fnDatostabla = async(tabla)=>{
  visibledatosTabla.value = true;
  tablaSelected.value = tabla
  const campos = await peticionesFetchOffline('getTableColumns',tabla);
  camposTablaSelectedSolos.value = campos
  camposTablaSelected.value = campos.join(', ');
}

/************************************************************************/
const fnEliminartabla = async()=>{

  visibledatosTabla.value = false;

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
      if (contrasenaIngresada === token.value || contrasenaIngresada === tokenCorto.value) {
     const envio = await peticionesFetchOffline('dropTable',tablaSelected.value);
     console.log("envio", envio);

      if (envio[0] === "ok") {
            toast.add({
            severity: "success",
            summary: "Éxito",
            detail: "Tabla Eliminada correctamente",
            life: 3000,
          });

          fnVerTablas()
        }else{
          toast.add({
            severity: "error",
            summary: "Error",
            detail: "Error al eliminar Tabla",
            life: 3000,
          });
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
}

/************************************************************************/
const fnActualizarCampos = async () => {
  // Convierte el texto del textarea en un array
  const camposModificados = camposTablaSelected.value.split(',').map(campo => campo.trim());

  // Obtiene los campos originales desde el servidor
/*  const camposOriginales = await peticionesFetch(
    `${link.value}${api.value}`, `campos/${tablaSelected.value}`,
    {},
    tokenCifrado.value,
    "GET"
  );*/

  // Obtiene los campos originales (VIENE COMO OBJETO)
    const camposOriginalesObj = await arrayToObjetoFromTablaOffline(tablaSelected.value);

    // Convertir objeto -> array de campos
    const camposOriginales = Object.keys(camposOriginalesObj || {});

  // Campos que se deben agregar
  const camposParaAgregar = camposModificados.filter(campo => !camposOriginales.includes(campo));

  // Campos que se deben eliminar
  const camposParaEliminar = camposOriginales.filter(campo => !camposModificados.includes(campo));

  // Agregar nuevos campos en la posición correcta
  for (const campo of camposParaAgregar) {
    // Encuentra la posición del campo en el array modificado
    const index = camposModificados.indexOf(campo);
    let despuesde = "id"; // Valor por defecto

    // Si no es el primer campo, encuentra el campo anterior
    if (index > 0) {
      despuesde = camposModificados[index - 1];
    }

    // Envía la solicitud para agregar el campo
/*   const agregaCampo = await peticionesFetch(
      `${link.value}${api.value}`, 'agregarcampodb',
      { tabla: tablaSelected.value, campo: campo, despuesde: despuesde },
      tokenCifrado.value,
      "POST"
    );*/
   const agregaCampo = await peticionesFetchOffline('addColumnToTable', 
      tablaSelected.value,
      campo
    );

  }

  // Eliminar los campos que ya no están en la lista modificada
  for (const campo of camposParaEliminar) {
/*    await peticionesFetch(
      `${link.value}${api.value}`, 'borrarcampodb',
      { tabla: tablaSelected.value, campo: campo },
      tokenCifrado.value,
      "POST"
    );*/
    await peticionesFetchOffline('deleteColumnFromTable', 
      tablaSelected.value,
      campo
    );
  }

  // Mostrar mensaje de éxito
  toast.add({
    severity: "success",
    summary: "Éxito",
    detail: "Tabla Actualizada correctamente",
    life: 3000,
  });
};


/************************************************************************/
const nuevaTabla = ref(null)
const camposTablaNueva = ref('')
const fnAgregarTabla = async()=>{
  if (nuevaTabla.value) {
/*        const verificaTabla = await peticionesFetch(
      `${link.value}${api.value}`,`verificatabla/${nuevaTabla.value}`,
      {},
      tokenCifrado.value,
      "GET"
    );*/
        const verificaTabla = await peticionesFetchOffline('tableExists',`${nuevaTabla.value}`);
        console.log("verificaTabla", verificaTabla);


    if (verificaTabla[0] === "error") {

      const camposParaAgregar = camposTablaNueva.value.split(',').map(campo => campo.trim()).reverse();
      const crearTabla = await peticionesFetchOffline('crearTabla', 
        nuevaTabla.value,
        camposParaAgregar.join(',')
      );


            if (crearTabla.success) {

          toast.add({
            severity: "success",
            summary: "Éxito",
            detail: "Tabla creada correctamente",
            life: 3000,
          });

          fnVerTablas()
        }
    }else{
          toast.add({
            severity: "warn",
            summary: "Upps",
            detail: "Esta tabla ya existe",
            life: 3000,
          });
    }
  }
}
/************************************************************************/
function useCampoArray(refValue) {
  return computed({
    get() {
      return refValue.value.split(',').map(campo => campo.trim());
    },
    set(value) {
      refValue.value = value.join(', ');
    }
  });
}
const camposArray = useCampoArray(camposTablaSelected);
const camposArrayN = useCampoArray(camposTablaNueva);
/************************************************************************/
const fnVaciartabla = async()=>{
  visibledatosTabla.value = false;
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
      if (contrasenaIngresada === token.value || contrasenaIngresada === tokenCorto.value) {

/*    const envio = await peticionesFetch(
      `${link.value}${api.value}`,`borrartodo`,
      {tabla:tablaSelected.value},
      tokenCifrado.value,
      "POST"
    );*/
    const envio = await peticionesFetchOffline('deleteAll', tablaSelected.value);

        if (envio[0] == 'ok') {
                    toast.add({
                    severity: "success",
                    summary: "Éxito",
                    detail: "Tabla limpiada correctamente",
                    life: 3000,
                  });
        }else{
                      toast.add({
                    severity: "error",
                    summary: "Error",
                    detail: "Error al limpiar la Tabla",
                    life: 3000,
                  });
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


}
/************************************************************************/
const fnReseteoID = async()=>{
  visibledatosTabla.value = false;
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
      if (contrasenaIngresada === token.value || contrasenaIngresada === tokenCorto.value) {

/*    const envio = await peticionesFetch(
      `${link.value}${api.value}`,`resetearcampoid`,
      {tabla:tablaSelected.value},
      tokenCifrado.value,
      "POST"
    );*/
    const envio = await peticionesFetchOffline('resetAutoIncrementField', tablaSelected.value);

if (envio[0] == 'ok') {
            toast.add({
            severity: "success",
            summary: "Éxito",
            detail: "ID reseteado correctamente",
            life: 3000,
          });
}else{
              toast.add({
            severity: "error",
            summary: "Error",
            detail: "Error al Resetear el ID",
            life: 3000,
          });
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

}
/*****************************************************************************************/
const visibleRelleno = ref(false);
const relleno = ref({
  columna: '',
  nuevovalor: ''
});

const fnRealizarRelleno = async () => {
  // Show SweetAlert dialog with input fields
  const result = await Swal.fire({
    title: 'Rellenar Campo',
    html: `
      <input id="swal-columna" class="swal2-input" placeholder="Campo">
      <input id="swal-nuevovalor" class="swal2-input" placeholder="Nuevo Valor">
    `,
    focusConfirm: false,
    preConfirm: () => {
      // Get the values from the input fields
      relleno.value.columna = document.getElementById('swal-columna').value;
      relleno.value.nuevovalor = document.getElementById('swal-nuevovalor').value;

      if (!relleno.value.columna || !relleno.value.nuevovalor) {
        Swal.showValidationMessage('Por favor, ingresa el campo y el nuevo valor');
        return false;
      }
      return true;
    },
    showCancelButton: true,
    confirmButtonText: 'Rellenar',
    cancelButtonText: 'Cancelar'
  });

  // If user confirms
  if (result.isConfirmed) {
    const datos = {
      'tabla': tablaSelected.value,
      'campo': relleno.value.columna,
      'nuevovalor': relleno.value.nuevovalor,
    };
/*
    const envio = await peticiones(link.value + api.value + '/actualizarcolumnacompletadb', datos, 'POST', tokenCifrado.value);*/
    const envio = await peticionesFetchOffline('updateEntireColumn', tablaSelected.value,relleno.value.columna,relleno.value.nuevovalor);

    if (envio[0] == 'ok') {
      toast.add({
        severity: "success",
        summary: "Éxito",
        detail: "Relleno correctamente",
        life: 3000,
      });
    } else {
      toast.add({
        severity: "error",
        summary: "Error",
        detail: "Error al Rellenar",
        life: 3000,
      });
    }
  }
};

/*****************************************************************************************/
const fnRellenar = async()=>{
    visibledatosTabla.value = false;
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
      if (contrasenaIngresada === token.value || contrasenaIngresada === tokenCorto.value) {
        await fnRealizarRelleno()
       visibleRelleno.value = true
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
}
/*****************************************************************************/
const fnBackup = async()=>{
    visibledatosTabla.value = false;
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
      if (contrasenaIngresada === token.value || contrasenaIngresada === tokenCorto.value) {


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
}
/************************************************************************/
/************************************************************************/
//const selectedData = ref({});
//const idData = ref(1);
/************************************************************************/
// Objeto donde se almacenan los datos del objeto encontrado por ID
const selectedData = ref({});

// Variable que contiene el ID actual mostrado en el campo de texto
const idData = ref(1);

const TEXT_LENGTH_LIMIT = 50;
// Función para cargar el objeto por ID
const loadDataById = (id) => {
  const foundData = allDataTabla.value.find(item => item.id === Number(id));
  if (foundData) {
    selectedData.value = { ...foundData }; // Clonamos el objeto para evitar mutaciones directas
  }
};

// Función para ir al primer registro
const goToFirst = () => {
  idData.value = allDataTabla.value[0].id; // Ir al primer ID
  loadDataById(idData.value);
};

// Función para ir al último registro
const goToLast = () => {
  idData.value = allDataTabla.value[allDataTabla.value.length - 1].id; // Ir al último ID
  loadDataById(idData.value);
};

// Función para ir al registro anterior
const goToPrevious = () => {
  const currentIndex = allDataTabla.value.findIndex(item => item.id === Number(idData.value));
  if (currentIndex > 0) {
    idData.value = allDataTabla.value[currentIndex - 1].id;
    loadDataById(idData.value);
  }
};

// Función para ir al siguiente registro
const goToNext = () => {
  const currentIndex = allDataTabla.value.findIndex(item => item.id === Number(idData.value));
  if (currentIndex < allDataTabla.value.length - 1) {
    idData.value = allDataTabla.value[currentIndex + 1].id;
    loadDataById(idData.value);
  }
};

const fnBorrarDatos = async () => {
  visibleDataTabla.value = false
  const tabla = tablaSelected.value
  const datos = selectedData.value

  const confirmacion = await Swal.fire({
    title: '¿Estás seguro?',
    text: 'Esta acción eliminará el registro permanentemente.',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Sí, borrar',
    cancelButtonText: 'Cancelar',
    confirmButtonColor: '#d33',
    cancelButtonColor: '#3085d6',
    reverseButtons: true
  })

  if (confirmacion.isConfirmed) {
    const borrador = await peticionesFetchOffline('deleteEntry',tabla, datos.id);
/*    const borrador = await peticionesFetch(
      `${link.value}${api.value}`,
      `borrarporcampo/${tabla}`,
      { campo: 'id', valor: datos.id },
      tokenCifrado.value,
      'POST'
    )*/

    if (borrador[0] === 'ok') {
      toast.add({ severity: 'success', summary: 'Éxito', detail: 'Datos eliminados correctamente', life: 3000 })
/*      allDataTabla.value = await peticionesFetch(`${link.value}${api.value}`,'datosarraypost',{'tabla':tablaSelected.value},tokenCifrado.value,'POST');*/
      allDataTabla.value = await peticionesFetchOffline('getDataAsArray', tablaSelected.value);
      
      visibleDataTabla.value = true
      goToFirst()
    } else {
      toast.add({ severity: 'error', summary: 'Error', detail: 'Error al eliminar los datos', life: 3000 })
    }

  }else{
    visibleDataTabla.value = true
  }
}

/************************************************************************/
// Función para determinar si el valor es un texto largo
const isLongText = (value) => {
  return typeof value === 'string' && value.length > TEXT_LENGTH_LIMIT;
};

// Función para determinar si un valor es un JSON válido
const isJsonString = (value) => {
  try {
    const parsed = JSON.parse(value);
    return typeof parsed === 'object' && parsed !== null;
  } catch (e) {
    return false;
  }
};
/************************************************************************/
const fnData = async()=>{
      visibledatosTabla.value = false;
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
      if (contrasenaIngresada === token.value || contrasenaIngresada === tokenCorto.value) {

         visibleDataTabla.value = true;
         allDataTabla.value = await peticionesFetchOffline('getDataAsArray', tablaSelected.value);
         if (allDataTabla.value.length > 0) {
            idData.value = allDataTabla.value[0].id
            loadDataById(allDataTabla.value[0].id);
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
}
/************************************************************************/
const fnUltimoRegistro = async()=>{
      visibledatosTabla.value = false;
  const pedirContrasena = async () => {
    const result = await Swal.fire({
      title: 'Introduce la contrase\u00f1a',
      input: 'password',
      inputPlaceholder: 'Contrase\u00f1a',
      showCancelButton: true,
      confirmButtonText: 'Devolver',
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      const contrasenaIngresada = result.value;
      if (contrasenaIngresada === token.value || contrasenaIngresada === tokenCorto.value) {

         visibleDataTabla.value = true;
         allDataTabla.value = await peticionesFetchOffline('getDataAsArray', tablaSelected.value);
         if (allDataTabla.value.length > 0) {
            const ultimoRegistro = allDataTabla.value[allDataTabla.value.length - 1];
            idData.value = ultimoRegistro.id;
            loadDataById(ultimoRegistro.id);
         }

      } else {
        Swal.fire({
          title: 'Contrase\u00f1a incorrecta',
          icon: 'error',
          confirmButtonText: 'Reintentar'
        }).then(() => {
          pedirContrasena();
        });
      }
    }
  };

  pedirContrasena();
}
/************************************************************************/
const fnActualizarData = async() => {
  const index = allDataTabla.value.findIndex(item => item.id === Number(idData.value));

  if (index !== -1) {
    // Actualizamos el objeto encontrado con los valores editados en selectedData
    allDataTabla.value[index] = { ...selectedData.value };

       const datosEnvio = allDataTabla.value[index];

        const url = link.value+api.value+"/actualizarcampos/"+tablaSelected.value;
        if (!datosEnvio) {
          console.error("Datos incompletos, no se puede actualizar.");
          return;
        }

        if (datosEnvio.hasOwnProperty('created_at')) {
          datosEnvio.updated_at = nfecha('timestamp');
        }


/*        const envioDatos = await enviarDatosPorPost(url, datosEnvio, tokenCifrado.value);*/
        const envioDatos = await peticionesFetchOffline('updateData',tablaSelected.value, JSON.stringify(datosEnvio));
        if (envioDatos[0] == 'ok') {
          toast.add({ severity: 'success', summary: 'Éxito', detail: 'Datos Actualizados', life: 3000 });
        } else {
          toast.add({ severity: 'error', summary: 'Error', detail: 'Fallo al actualizar los datos.', life: 3000 });
        }


  } else {
     toast.add({ severity: 'error', summary: 'Error', detail: 'Error: no se encontró el ID en los datos.', life: 3000 });
  }
};
/************************************************************************/
const fnDevTool = ()=>{
    window.electron.ipcRenderer.invoke('devtools');
}
/************************************************************************/
/************************************************************************/
const fnAgregarTablaDesdeDemo = async (tabla) => {
  const camposDemo = await peticionesFetch(
    `https://demo.tmposrd.com/api2`,
    `campos/${tabla}`,
    {},
    tokenCifrado.value,
    "GET"
  );

  const crearTabla = await peticionesFetchOffline('crearTabla', 
    tabla,
    ''
  );
/*  const crearTabla = await peticionesFetch(
    `${link.value}${api.value}`,
    `creartabla/${tabla}`,
    {},
    tokenCifrado.value,
    "GET"
  );*/

  if (crearTabla[0] === "ok") {
    for (const campo of camposDemo) {
/*      await peticionesFetch(
        `${link.value}${api.value}`,
        'agregarcampodb',
        { tabla: tabla, campo: campo, despuesde: "id" },
        tokenCifrado.value,
        "POST"
      );*/
      await peticionesFetchOffline('addColumnToTable', 
      tabla,
      campo
    );

    }
    toast.add({
      severity: "success",
      summary: "Éxito",
      detail: `Tabla ${tabla} sincronizada correctamente desde Demo`,
      life: 3000,
    });
    await fnVerificarTablas(); // Re-verifica las tablas después de la sincronización
  }
};

/************************************************************************/
const fnSincronizarCampos = async (tabla) => {
  const camposDemo = await peticionesFetch(
    `https://demo.tmposrd.com/api2`,
    `campos/${tabla}`,
    {},
    tokenCifrado.value,
    "GET"
  );

  const camposLocal = await arrayToObjetoFromTablaOffline(tabla);
/*  const camposLocal = await peticionesFetch(
    `${link.value}${api.value}`,
    `campos/${tabla}`,
    {},
    tokenCifrado.value,
    "GET"
  );*/

  const camposParaAgregar = camposDemo.filter(campo => !camposLocal.includes(campo));
  const camposParaEliminar = camposLocal.filter(campo => !camposDemo.includes(campo));

  // Agregar nuevos campos desde Demo a Local
  for (const campo of camposParaAgregar) {
/*    await peticionesFetch(
      `${link.value}${api.value}`,
      'agregarcampodb',
      { tabla: tabla, campo: campo, despuesde: "id" },
      tokenCifrado.value,
      "POST"
    );*/
    await peticionesFetchOffline('addColumnToTable', 
      tabla,
      campo
    );
  }

  // Eliminar campos de Local que no están en Demo
  for (const campo of camposParaEliminar) {
/*    await peticionesFetch(
      `${link.value}${api.value}`,
      'borrarcampodb',
      { tabla: tabla, campo: campo },
      tokenCifrado.value,
      "POST"
    );*/
    await peticionesFetchOffline('deleteColumnFromTable', 
      tabla,
      campo
    );
  }

  toast.add({
    severity: "success",
    summary: "Éxito",
    detail: `Campos de la tabla ${tabla} sincronizados correctamente`,
    life: 3000,
  });
  await fnVerificarTablas(); // Re-verifica las tablas después de la sincronización
};

/************************************************************************/

/************************************************************************/
const tablasVerificadas = ref([]); // Array to hold the result of table verification
const verTablasVerificada = ref(false); // Controls visibility of the table

const tablasEnAmbas = computed(() => {
    return tablasDemo.value.filter(tabla => tablasLocal.value.includes(tabla));
});

const tablasSoloDemo = computed(() => {
    return tablasDemo.value.filter(tabla => !tablasLocal.value.includes(tabla));
});

const tablasSoloLocal = computed(() => {
    return tablasLocal.value.filter(tabla => !tablasDemo.value.includes(tabla));
});

/************************************************************************/
const fnVerificarTablas = async () => {
  loading.value = true;
  await fnTablasDemo();
  await fnTablasLocal();

  // Combine results into an array of objects for easier rendering
  tablasVerificadas.value = [
    ...tablasEnAmbas.value.map(tabla => ({ tabla, estado: 'Ambas' })),
    ...tablasSoloDemo.value.map(tabla => ({ tabla, estado: 'Demo' })),
    ...tablasSoloLocal.value.map(tabla => ({ tabla, estado: 'Local' })),
  ];

  verTablasVerificada.value = true;
  loading.value = false;
}

/************************************************************************/
const fnSincronizarTodosCampos = async () => {
  loading.value = true;
  for (const tabla of tablasEnAmbas.value) {
    await fnSincronizarCampos(tabla); // Reutilizamos la función existente para cada tabla
  }
  loading.value = false;
  toast.add({
    severity: "success",
    summary: "Éxito",
    detail: "Todos los campos de las tablas sincronizados correctamente",
    life: 3000,
  });
};


/************************************************************************/
const fnRealizarCambioEmpresa = async()=>{
const datos = empresaSelected.value
if (!datos || !datos.link) {
  toast.add({ severity: 'warn', summary: 'Aviso', detail: 'Selecciona una empresa valida', life: 2500 });
  return;
}
const nJSONResponse = await envioElectron('datosarchivo');

  const nJSON = nJSONResponse;
  nJSON.VITE_LINKURL = datos.link.replace(/\/$/, '');
  const clonedData = JSON.parse(JSON.stringify(nJSON));
  const envioDatosJSON = await window.electron.ipcRenderer.invoke('actualizarjson', clonedData);

cerrarSession()
router.push('/login')
}
/************************************************************************/
const fnAccionEmpresaRapida = async (empresa, accion = 'cambio') => {
  empresaSelected.value = empresa;

  if (accion === 'bloqueo') {
    await fnBlockUnblock();
    return;
  }

  await fnRealizarCambioEmpresa();
};
/************************************************************************/
const fnGenerarQRLicenciaEmpresa = async (empresa) => {
  const licencia = String(empresa?.licencia || '').trim();
  const nombreEmpresa = String(empresa?.nombre || 'Empresa');

  if (!licencia) {
    toast.add({ severity: 'warn', summary: 'Aviso', detail: 'Esta empresa no tiene licencia registrada', life: 2800 });
    return;
  }

  try {
    const qrDataUrl = await QRCode.toDataURL(licencia, {
      width: 320,
      margin: 2,
      errorCorrectionLevel: 'H'
    });

    await Swal.fire({
      title: `QR de licencia - ${nombreEmpresa}`,
      html: `
        <div style="display:flex;flex-direction:column;align-items:center;gap:10px;">
          <img src="${qrDataUrl}" alt="QR Licencia" style="width:220px;height:220px;border-radius:12px;border:1px solid #e2e8f0;padding:8px;background:#fff;" />
          <div style="font-size:12px;color:#64748b;">Licencia</div>
          <div style="font-size:13px;font-weight:600;color:#0f172a;word-break:break-all;">${licencia}</div>
        </div>
      `,
      width: 420,
      showCancelButton: true,
      confirmButtonText: 'Descargar QR',
      cancelButtonText: 'Cerrar',
      preConfirm: () => {
        const linkDescarga = document.createElement('a');
        linkDescarga.href = qrDataUrl;
        linkDescarga.download = `QR_Licencia_${nombreEmpresa.replace(/\s+/g, '_')}.png`;
        linkDescarga.click();
      }
    });
  } catch (error) {
    console.error('Error generando QR de licencia:', error);
    toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo generar el QR de la licencia', life: 3000 });
  }
};
/************************************************************************/
const campoRef = ref(null)
const campoFinal = ref(null)
/************************************************************************/
const fnAjustarFecha = async () => {
  try {
    // Petición a la API para obtener los datos
    const datosArray = await peticionesFetchOffline('getDataAsArray', tablaSelected.value);
/*    const datosArray = await peticionesFetch(
      `${link.value}${api.value}`,
      'datosarraypost',
      { 'tabla': tablaSelected.value },
      tokenCifrado.value,
      'POST'
    );*/

    // Recorrer el array y ajustar las fechas
    for (let datos of datosArray) {
      const fechaInicioN = convertirAFechaTimestamp(datos.fecha || datos.fecha_emision, '07:00:00');
      datos.updated_at = fechaInicioN;
      datos.created_at = fechaInicioN;


    const urlFactura = `${link.value}${api.value}/actualizarcampos/${tablaSelected.value}`;
/*    const envioDatosFactura = await enviarDatosPorPost(urlFactura, datos, tokenCifrado.value);*/
    const envioDatosFactura = await peticionesFetchOffline('updateData',tablaSelected.value, JSON.stringify(datos));
    if (envioDatosFactura[0] == 'ok') {
      toast.removeAllGroups();
        toast.add({ severity: 'success', summary: 'Éxito', detail: 'Comprobante eliminado', life: 3000 });
    } else {
      toast.removeAllGroups();
        toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo eliminar el comprobante', life: 3000 });
    }


    }

    





/*    // Convertir el array en un archivo Excel
    const worksheet = XLSX.utils.json_to_sheet(datosArray); // Convierte el array en una hoja de Excel
    const workbook = XLSX.utils.book_new(); // Crea un nuevo libro de Excel
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Datos Modificados'); // Añade la hoja con los datos
    XLSX.writeFile(workbook, 'DatosModificados.xlsx'); // Escribe el archivo Excel en tu disco

    console.log('Archivo Excel generado exitosamente');*/
  } catch (error) {
    console.error('Error al ajustar las fechas o generar el archivo Excel:', error);
  }



};
/************************************************************************/
const fnCrearBackup = async()=>{
/*const crearBackUp = await peticionesFetch(`${link.value}${api.value}`, 'backupdb', {}, tokenCifrado.value, 'GET', 'online');*/
const crearBackUp = await peticionesFetchOffline('crearBackupSQLConControl');
if (crearBackUp && crearBackUp[0] === 'ok') {
  toast.add({
    severity: "success",
    summary: "Éxito",
    detail: "Se ha creado el Backup correctamente",
    life: 3000,
  });
 }
}
/************************************************************************/
const fnBuscarDuplicados = async()=>{

const duplicados = await peticionesFetch(`${link.value}${api.value}`, 'buscarduplicados/'+tablaSelected.value+'/codigo', {}, tokenCifrado.value, 'GET', 'online');

}
/************************************************************************/
const fnAgregarAlmacenAtabla = async()=>{


       const datos = {
        'tabla': tablaSelected.value,
        'campo': 'almacen',
        'nuevovalor': datosEmpresa.empresa.nombre,
      };

 /*     const envio = await peticiones(link.value + api.value + '/actualizarcolumnacompletadb', datos, 'POST', tokenCifrado.value);*/
      const envio = await peticionesFetchOffline('updateEntireColumn', tablaSelected.value,'almacen',datosEmpresa.empresa.nombre);

           if(envio[0] === 'ok'){
        toast.removeAllGroups();
         toast.add({ severity: 'success', summary: 'Éxito', detail: `Tabla Actualizada correctamente.`, life: 3000 });
       }else{
        toast.removeAllGroups();
          toast.add({ severity: 'error', summary: 'Error', detail: 'Fallo al actualizar los datos de la Tabla', life: 3000 });

       }
}
/************************************************************************/
const fnPrueba = async () => {
  try {
    // Crear una copia profunda con lodash
    const datosEmp = JSON.stringify(datosEmpresa);

    const envioDatosJSON = await window.electron.ipcRenderer.invoke(
      "consultarIMEI",
      "358649255421945"
    );

    console.log("envioDatosJSON", envioDatosJSON);
  } catch (error) {
    console.error("Error:", error);
  }
};
/************************************************************************/
const fnDatosDefault = async()=>{
   const userDefault = await arrayToObjetoFromTablaOffline('clientes');
   userDefault.nombre = 'AL CONTADO'
   userDefault.direccion = 'SIN REGISTRO'
   userDefault.email = 'SIN REGISTRO'
   userDefault.telefono = '+1(000) 000-0000'
   userDefault.codigo = '0000000'

    userDefault.whatsapp = '+1(000) 000-0000'
    userDefault.genero = 'SIN REGISTRO'
    userDefault.estado_civil = 'SIN REGISTRO'

    userDefault.precio_fijado = 'NORMAL'
    userDefault.empresa = 'SIN REGISTRO'
    userDefault.cargo = 'SIN REGISTRO'
    userDefault.telefono_empresa = 'SIN REGISTRO'
    userDefault.direccion_empresa = 'SIN REGISTRO'
    userDefault.n_comercial = 'SIN REGISTRO'
    userDefault.rnc = '0000000'
    userDefault.activo = 'ON'
    userDefault.imagen = 'SIN REGISTRO'
    userDefault.usuario = 'SIN REGISTRO'

  const url = link.value+api.value+"/insertar/clientes";
  if (userDefault.hasOwnProperty('created_at')) {
     userDefault.created_at = nfecha('timestamp')
     userDefault.updated_at = nfecha('timestamp')
    }


    Swal.fire({
        title: "¿Estás seguro?",
        text: "¡Se borrarán los datos!",
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
               if (password === token.value || password === tokenCorto.value) {

       

                  const tablasEliminar = [
                    'clientes',
                    'productos',
                    'facturas',
                    'cotizacion',
                    'imei',
                    'registrocaja',
                    'asientodiario',
                    'financiamientos',
                    'reclamaciones',
                    'categorias',
                    'marcas',
                    'taller'
                  ];

                  for (const tabla of tablasEliminar) {
                    const envioDatos = await peticionesFetchOffline('deleteAll', tabla);
/*                    const envioDatos = await borrarTodoslosDatos(
                      `${link.value}${api.value}/borrartodo`,
                      tabla,
                      tokenCifrado.value
                    );*/


                    if (envioDatos[0] == 'ok') {
                          toast.add({ severity: 'success', summary: 'Éxito', detail: 'Datos borrados', life: 3000 });

                  } else {
                        toast.add({ severity: 'error', summary: 'Error', detail: 'Fallo al borrar datos.', life: 3000 });
                   }


                  }

                      /*  const envioDatos = await enviarDatosPorPost(url, userDefault,tokenCifrado.value);*/
                        const envioDatos = await peticionesFetchOffline('insertData','clientes', JSON.stringify(userDefault));


                } else {
                    toast.add({ severity: 'error', summary: 'Error', detail: 'Contraseña incorrecta', life: 3000 });
                }
            }
        } else if (result.dismiss === Swal.DismissReason.cancel) {
            toast.add({ severity: 'success', summary: 'No te preocupes', detail: 'Datos seguros', life: 3000 });
        }
    });




}
/************************************************************************/
const qrCodeImage = computed(() => qrCode.value ? `https://api.qrserver.com/v1/create-qr-code/?data=${qrCode.value}&size=250x250` : "");

/************************************************************************/
const startWhatsApp = async () => {
  try {
    const response = await window.electron.ipcRenderer.invoke("start-whatsapp");
    if (response.success) {
      qrDialog.value = true;
    }
  } catch (error) {
    console.error("Error iniciando WhatsApp Web:", error);
  }
};
/************************************************************************/
// Función para enviar mensaje
const sendMessage = async () => {
  if (!phoneNumber.value || !messageText.value) {
    alert("Por favor, introduce un número y un mensaje.");
    return;
  }
  try {
    const response = await window.electron.ipcRenderer.invoke("send-message", {
      number: phoneNumber.value,
      message: messageText.value
    });
    if (response.success) {
      alert("Mensaje enviado correctamente.");
    }
  } catch (error) {
    console.error("Error enviando mensaje:", error);
  }
};

// Escuchar el QR desde el backend
const onQrCodeReceived = (event, qr) => {
  qrCode.value = qr;
  qrDialog.value = true;
};

/************************************************************************/
const fnWhatsapp = async () => {
  try {
    const response = await window.electron.ipcRenderer.invoke("start-whatsapp");
    if (response) {
      qrDialog.value = true;
    } else {
      console.error("ERROR No se pudo inicializar WhatsApp.");
    }
  } catch (error) {
    console.error("ERROR Error al iniciar WhatsApp Web:", error);
  }
};

/************************************************************************/
const fnActualizar = async()=>{
    try {
    const response = await window.electron.ipcRenderer.invoke("revisarActualizacionDisponible");
    if (response) {
      console.log("response", response);
     toast.add({ severity: 'success', summary: 'ok', detail: ' Actualizacion disponible', life: 3000 });
    } else {
      console.error("ERROR No hay respuestas.");
       toast.add({ severity: 'error', summary: 'Upps', detail: 'ERROR No hay respuestas.', life: 3000 });
    }
  } catch (error) {
       toast.add({ severity: 'error', summary: 'Upps', detail: 'ERROR Error al enviar datos de Actualizacion.', life: 3000 });
    console.error("ERROR Error al enviar datos de Actualizacion:", error);
  }
}
/************************************************************************/
const selectedEmpresa1 = ref(null);
const selectedEmpresa2 = ref(null);
const empresa1 = reactive({});
const empresa2 = reactive({});
const EMPRESA_PRINCIPAL_DEFAULT = Object.freeze({
  nombre: 'TM POS SRL',
  telefono: '+18297842912',
  direccion: 'Santiago, Republica Dominicana',
  legal: 'RNC: 133023539',
  email: 'tmposrd@gmail.com'
});
/************************************************************************/

/************************************************************************/
const guardarDatosEmpresa = async() => {
  // Lógica para guardar los datos de las empresas seleccionadas
  const datosEmpresas = empresaData.value
  const url = link.value+api.value+"/actualizarcampos/empresa";

  for(let empresa of datosEmpresas){
      if(empresa.id === 1){
        empresa.link = empresa1.link
        empresa.nombre = empresa1.nombre;
        empresa.legal = empresa1.legal;
        empresa.email = empresa1.email;
        empresa.telefono = empresa1.telefono;
        empresa.direccion = empresa1.direccion;
      }else{
        empresa.link = empresa2.link;
        empresa.nombre = empresa2.nombre;
        empresa.email = empresa2.email;
        empresa.telefono = empresa2.telefono;
        empresa.direccion = empresa2.direccion;
      }

  if (!empresa) {
    console.error("Datos incompletos, no se puede actualizar.");
    return;
  }
  if (empresa.hasOwnProperty('created_at')) {
     empresa.updated_at = nfecha('timestamp');
  }
/*  const envioDatos = await enviarDatosPorPost(url, empresa, tokenCifrado.value);*/
  const envioDatos = await peticionesFetchOffline('updateData','empresa', JSON.stringify(empresa));
  if (envioDatos[0] == 'ok') {
    toast.add({ severity: 'success', summary: 'Éxito', detail: 'Datos Actualizados', life: 3000 });
  } else {
    toast.add({ severity: 'error', summary: 'Error', detail: 'Fallo al actualizar los datos.', life: 3000 });
  }

  }




  toast.add({ severity: 'success', summary: 'Éxito', detail: 'Datos de empresa guardados', life: 3000 });
};

const restaurarEmpresaPrincipalDefault = () => {
  Object.assign(empresa1, {
    ...empresa1,
    ...EMPRESA_PRINCIPAL_DEFAULT
  });

  if (selectedEmpresa1.value) {
    Object.assign(selectedEmpresa1.value, {
      ...selectedEmpresa1.value,
      ...EMPRESA_PRINCIPAL_DEFAULT
    });
  }

  toast.add({
    severity: 'info',
    summary: 'Valores restaurados',
    detail: 'Se cargaron los datos por defecto de la empresa principal',
    life: 2500
  });
};

/************************************************************************/
const updateEmpresa1 = (selected) => {
  console.log("selected", selected);
  Object.assign(empresa1, selectedEmpresa1.value || {});
};

const updateEmpresa2 = (selected) => {
  Object.assign(empresa2, selectedEmpresa2.value || {});
};
/************************************************************************/
//     visibleCambioEmpresa.value = true
/************************************************************************/
const fnBlockUnblock = async () => {
  const datos = empresaSelected.value;
  if (!datos || !datos.link) {
    toast.add({ severity: 'warn', summary: 'Aviso', detail: 'Selecciona una empresa valida', life: 2500 });
    return;
  }
  let baseUrl = datos.link.endsWith('/') ? datos.link : datos.link + '/'; // Asegurar que termine en "/"
  
  let url = baseUrl + "api2/actualizaruncampo/empresa"; // URL inicial con api2

  // Mostrar alerta de confirmación
  const { isConfirmed, value } = await Swal.fire({
    title: "¿Qué acción deseas realizar?",
    input: "radio",
    inputOptions: {
      ON: "Bloquear",
      OFF: "Desbloquear"
    },
    inputValidator: (value) => {
      if (!value) {
        return "Debes seleccionar una opción";
      }
    },
    showCancelButton: true,
    confirmButtonText: "Confirmar",
    cancelButtonText: "Cancelar",
    icon: "question"
  });

  if (isConfirmed) {
    const datosEnviar = {
      campo: 'bloqueo',
      valor: value,
      id: 1
    };

    try {
      // Intentamos la primera petición con api2
      let envioDatos = await enviarDatosPorPost(url, datosEnviar, tokenCifrado.value);
      
      if (envioDatos[0] !== 'ok') {
        throw new Error("Fallo con api2"); // Si falla, lanzamos un error
      }

      toast.add({ severity: 'success', summary: 'Éxito', detail: `Empresa ${value === 'ON' ? 'bloqueada' : 'desbloqueada'} correctamente.`, life: 3000 });

    } catch (error) {
      console.error("Error con api2, intentando con api...");

      // Si la primera petición falla, intentamos con api
      url = baseUrl + `api/actualizaruncampo/empresa/${token.value}`;

      try {
        let envioDatosAlt = await enviarDatosPorPost(url, datosEnviar, tokenCifrado.value);

        if (envioDatosAlt[0] === 'ok') {
          toast.add({ severity: 'success', summary: 'Éxito', detail: `Empresa ${value === 'ON' ? 'bloqueada' : 'desbloqueada'} correctamente.`, life: 3000 });
        } else {
          throw new Error("Fallo con api");
        }

      } catch (error) {
        toast.add({ severity: 'error', summary: 'Error', detail: 'Fallo al actualizar los datos en ambos intentos.', life: 3000 });
      }
    }
  }
};
/************************************************************************/
const generarGanancias = async(productos, productosArray = []) => {
  let gananciaPura = 0;

  for (let prod of productos) {
    // Ignorar productos con nombre "DESCUENTO", "DELIVERY", etc.
    if (/descuento|delivery/i.test(prod.nombre || '')) continue;

    const datosProd = productosArray.find(product => product.codigo === prod.codigo);
    const precioVenta = parseFloat(prod.precio_venta) || 0;
    const cantidad = parseFloat(prod.cantidad) || 0;
    let precioCompra = 0;
    if (datosProd) {
      precioCompra = parseFloat(datosProd.precio_compra) || 0;
    } else {
      precioCompra = parseFloat(prod.costo) || 0;
    }

    gananciaPura += (precioVenta - precioCompra) * cantidad;
  }

  return gananciaPura.toFixed(2);
}
/************************************************************************/
const fnCalcularGanancias = async()=>{
  const productosArray = await peticionesFetchOffline('getDataAsArray', 'productos')
  const facturasArray = await peticionesFetchOffline('getDataAsArray', 'facturas')

  for(let factura of facturasArray){

     const productos = JSON.parse(factura.productos)

     for(let prod of productos){

    let costoProdObj = productosArray.find(prodA => prodA.codigo === prod.codigo);
    let costoProd = costoProdObj ? parseFloat(costoProdObj.precio_compra) : parseFloat(prod.precio_compra);

        const impuesto = Number(prod.precio_venta) * (prod.impuestos / 100);
        const ganancia = ((parseFloat(prod.precio_venta) - parseFloat(costoProd)) * parseFloat(prod.cantidad))
        const total = (parseFloat(prod.precio_venta)  * parseFloat(prod.cantidad)).toFixed(2)

        prod.ganancia = ganancia
        prod.ganancia_pura = ganancia
        prod.total = total
     }

     factura.ganancia = await generarGanancias(productos,productosArray)

     const envio = await peticionesFetchOffline('updateData', 'facturas',JSON.stringify(factura))
     if(envio[0] === 'ok'){
      toast.removeAllGroups();
       toast.add({ severity: 'success', summary: 'Éxito', detail: `Factura Actualizada correctamente.`, life: 3000 });
     }else{
      toast.removeAllGroups();
        toast.add({ severity: 'error', summary: 'Error', detail: 'Fallo al actualizar los datos de la Factura', life: 3000 });

     }

  }

}
/************************************************************************/
const generarUUID = () => {
  if (crypto?.randomUUID) return crypto.randomUUID();
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
};

const CAMPOS_ADICIONALES = [
  { campo: 'almacen', valorPorFila: () => String(datosEmpresa?.empresa?.nombre || '').trim(), requiereUnicoPorFila: false },
  { campo: 'created_at', valorPorFila: () => nfecha('timestamp'), requiereUnicoPorFila: false },
  { campo: 'updated_at', valorPorFila: () => nfecha('timestamp'), requiereUnicoPorFila: false },
  { campo: 'uid', valorPorFila: () => generarUUID(), requiereUnicoPorFila: true }
];

const fnAgregarAlmacen = async () => {
  const almacenActual = String(datosEmpresa?.empresa?.nombre || '').trim();

  if (!almacenActual) {
    toast.removeAllGroups();
    toast.add({ severity: 'warn', summary: 'Falta almacen', detail: 'No se encontro datosEmpresa.empresa.nombre.', life: 4000 });
    return;
  }

  const respuestaTablas = await peticionesFetch(`${link.value}${api.value}`, 'tablas', {}, tokenCifrado.value, 'GET', 'online');
  const listaTablas = (Array.isArray(respuestaTablas) ? respuestaTablas : [])
    .map((tabla) => String(tabla || '').trim())
    .filter((tabla) => tabla && !tabla.startsWith('sqlite_'));

  if (!listaTablas.length) {
    toast.removeAllGroups();
    toast.add({ severity: 'warn', summary: 'Sin tablas', detail: 'No se encontraron tablas online para actualizar.', life: 4000 });
    return;
  }

  const confirmacion = await Swal.fire({
    title: 'Agregar campos a todas las tablas',
    html: `
      Se agregaran los campos <b>almacen, created_at, updated_at, uid</b>
      en ${listaTablas.length} tablas online.
      <br><br>
      <small>uid se generara con un UUID unico por fila.</small>
    `,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Si, ejecutar',
    cancelButtonText: 'Cancelar'
  });

  if (!confirmacion.isConfirmed) return;

  const resumen = {
    tablas: 0,
    columnasCreadas: 0,
    columnasExistentes: 0,
    actualizadas: 0,
    filasActualizadas: 0,
    errores: []
  };

  Swal.fire({
    title: 'Agregando campos',
    html: `Procesando 0 de ${listaTablas.length} tablas...`,
    allowOutsideClick: false,
    allowEscapeKey: false,
    didOpen: () => Swal.showLoading()
  });

  for (const [index, tabla] of listaTablas.entries()) {
    try {
      Swal.update({ html: `Procesando ${index + 1} de ${listaTablas.length}: <b>${tabla}</b>` });

      const columnas = await peticionesFetch(`${link.value}${api.value}`, `campos/${tabla}`, {}, tokenCifrado.value, 'GET', 'online');
      const columnasTabla = Array.isArray(columnas) ? columnas : [];

      for (const { campo, valorPorFila, requiereUnicoPorFila } of CAMPOS_ADICIONALES) {
        const columnaExiste = columnasTabla.includes(campo);

        if (!columnaExiste) {
          const respuestaAgregar = await peticionesFetch(
            `${link.value}${api.value}`,
            'agregarcampodbalfinal',
            { tabla, campo },
            tokenCifrado.value,
            'POST',
            'online'
          );

          if (Array.isArray(respuestaAgregar) && respuestaAgregar[0] !== 'ok') {
            throw new Error(`No se pudo crear el campo ${campo}: ${JSON.stringify(respuestaAgregar)}`);
          }

          resumen.columnasCreadas += 1;
        } else {
          resumen.columnasExistentes += 1;
        }

        if (!requiereUnicoPorFila) {
          const valor = valorPorFila();
          if (valor) {
            const envio = await peticionesFetch(
              `${link.value}${api.value}`,
              'actualizarcolumnacompletadb',
              { tabla, campo, nuevovalor: valor },
              tokenCifrado.value,
              'POST',
              'online'
            );

            if (Array.isArray(envio) && envio[0] !== 'ok') {
              throw new Error(`Respuesta inesperada al actualizar ${campo}: ${JSON.stringify(envio)}`);
            }
          }
        }
      }

      const necesitaUIDporFila = !columnasTabla.includes('uid');
      if (necesitaUIDporFila) {
        const datosArray = await peticionesFetch(
          `${link.value}${api.value}`,
          'datosarraypost',
          { tabla },
          tokenCifrado.value,
          'POST',
          'online'
        );

        const filas = Array.isArray(datosArray) ? datosArray : [];
        const filasActualizar = [];
        for (const fila of filas) {
          if (fila.id != null) {
            const uid = generarUUID();
            const timestamp = nfecha('timestamp');
            filasActualizar.push({
              ...fila,
              uid: fila.uid || uid,
              created_at: fila.created_at || timestamp,
              updated_at: timestamp
            });
          }
        }

        if (filasActualizar.length > 0) {
          const resp = await peticionesFetch(
            `${link.value}${api.value}`,
            'insertararray/' + tabla,
            filasActualizar,
            tokenCifrado.value,
            'POST',
            'online'
          );

          if (resp?.ok || (Array.isArray(resp) && resp[0] === 'ok')) {
            resumen.filasActualizadas += filasActualizar.length;
          } else {
            resumen.errores.push(`${tabla}: error al insertararray uid (${resp?.error || JSON.stringify(resp)})`);
          }
        }
      }

      resumen.actualizadas += 1;
      resumen.tablas += 1;
    } catch (error) {
      resumen.errores.push(`${tabla}: ${error?.message || error}`);
      console.error(`Error actualizando ${tabla}:`, error);
    }
  }

  tablasArray.value = listaTablas;

  if (resumen.errores.length) {
    await Swal.fire({
      title: 'Proceso terminado con errores',
      html: `
        <div class="text-left">
          <p>Tablas procesadas: <b>${resumen.actualizadas}</b></p>
          <p>Columnas creadas: <b>${resumen.columnasCreadas}</b></p>
          <p>Filas con uid actualizado: <b>${resumen.filasActualizadas}</b></p>
          <p>Errores: <b>${resumen.errores.length}</b></p>
          <small>${resumen.errores.slice(0, 8).join('<br>')}</small>
        </div>
      `,
      icon: 'warning'
    });
    return;
  }

  toast.removeAllGroups();
  toast.add({
    severity: 'success',
    summary: 'Campos agregados',
    detail: `${resumen.actualizadas} tablas actualizadas. ${resumen.filasActualizadas} filas con uid.`,
    life: 4000
  });

  await Swal.fire({
    title: 'Proceso completado',
    html: `
      <div class="text-left">
        <p>Tablas procesadas: <b>${resumen.actualizadas}</b></p>
        <p>Columnas creadas: <b>${resumen.columnasCreadas}</b></p>
        <p>Columnas existentes: <b>${resumen.columnasExistentes}</b></p>
        <p>Filas con uid asignado: <b>${resumen.filasActualizadas}</b></p>
      </div>
    `,
    icon: 'success'
  });
}
/************************************************************************/
const fnNombreEmpresa = async()=>{
  const response = await peticionesFetch(`https://master.tmposrd.com${api.value}`, `datoscampo/empresas/nombre/${datosJSONR.value.almacen}`, {}, tokenCifrado.value, 'GET');

 const datosEmpresa = await peticionesFetch(`${link.value}${api.value}`, `datoscampo/empresa/id/1`, {}, tokenCifrado.value, 'GET');

datosEmpresa.nombre = response.nombre
datosEmpresa.direccion = response.direccion
datosEmpresa.email = response.email
datosEmpresa.telefono = response.telefono
datosEmpresa.link = response.link
//datosEmpresa.licencia = response.licencia


empresaData.value = [datosEmpresa]
await guardarDatosEmpresa()


}
/************************************************************************/
const fnCambiarDEMO = async()=>{
//  "VITE_LINKURL": "https://demo.tmposrd.com",
const nJSONResponse = await envioElectron('datosarchivo');
  const nJSON = nJSONResponse;
  nJSON.VITE_LINKURL = "https://demo.tmposrd.com";
  nJSON.almacen = "TMPOS SRL";
  const clonedData = JSON.parse(JSON.stringify(nJSON));
  const envioDatosJSON = await window.electron.ipcRenderer.invoke('actualizarjson', clonedData);

cerrarSession()
router.push('/login')
}
/************************************************************************/
const selectEmpresaOrigen = (empresa)=>{
 link1Inventario.value = empresa.value.link
 tabla1Inventario.value = tablasArray.value[0]
 tabla2Inventario.value = tablasArray.value[0]
 empresa2Inventario.value = empresasArray.value[1]
 link2Inventario.value = empresasArray.value[1].link
}
/************************************************************************/
const fnTablaOrigen = (tabla)=>{
   tabla2Inventario.value = tabla.value
}
/************************************************************************/
const fnEmpresaOrigen = (empresa)=>{
   link2Inventario.value = empresa.value.link
}
/************************************************************************/
const fnRestaurarEmpresaId1Default = async () => {
  try {
    const empresa = await peticionesFetchOffline('getDataByField', 'empresa', 'id', 1);

    if (!empresa) {
      toast.add({ severity: 'error', summary: 'Error', detail: 'No se encontró la empresa con id 1', life: 3000 });
      return;
    }

    empresa.nombre = EMPRESA_PRINCIPAL_DEFAULT.nombre;
    empresa.telefono = EMPRESA_PRINCIPAL_DEFAULT.telefono;
    empresa.direccion = EMPRESA_PRINCIPAL_DEFAULT.direccion;
    empresa.legal = EMPRESA_PRINCIPAL_DEFAULT.legal;
    empresa.email = EMPRESA_PRINCIPAL_DEFAULT.email;

    if (empresa.hasOwnProperty('updated_at')) {
      empresa.updated_at = nfecha('timestamp');
    }

    const actualizacion = await peticionesFetchOffline('updateData', 'empresa', JSON.stringify(empresa));

    if (Array.isArray(actualizacion) && actualizacion[0] === 'ok') {
      await fetchEmpresaDatosarraypost();
      if (datosEmpresa?.empresa) {
        datosEmpresa.empresa.nombre = EMPRESA_PRINCIPAL_DEFAULT.nombre;
        datosEmpresa.empresa.telefono = EMPRESA_PRINCIPAL_DEFAULT.telefono;
        datosEmpresa.empresa.direccion = EMPRESA_PRINCIPAL_DEFAULT.direccion;
        datosEmpresa.empresa.legal = EMPRESA_PRINCIPAL_DEFAULT.legal;
        datosEmpresa.empresa.email = EMPRESA_PRINCIPAL_DEFAULT.email;
      }
      toast.add({
        severity: 'success',
        summary: 'Empresa restaurada',
        detail: 'La empresa con id 1 fue actualizada con los datos por defecto',
        life: 3000
      });
      return;
    }

    toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo actualizar la empresa con id 1', life: 3000 });
  } catch (error) {
    console.error('Error restaurando empresa id 1:', error);
    toast.add({ severity: 'error', summary: 'Error', detail: 'Fallo al restaurar la empresa con id 1', life: 3000 });
  }
}
/************************************************************************/
const realizarOperacionInventario = async () => {
  try {
    // 1. Obtener datos desde la tabla origen
    const datosTablaOrigen = await peticionesFetch(
      `${link1Inventario.value}${api.value}`,
      'datosarraypost',
      { tabla: tabla1Inventario.value },
      tokenCifrado.value,
      'POST',
      'online'
    );

    // 2. Enviar los datos a la tabla destino
    const datosTablaDestino = await peticionesFetch(
      `${link2Inventario.value}${api.value}`,
      'insertararray/' + tabla2Inventario.value,
      datosTablaOrigen,
      tokenCifrado.value,
      'POST',
      'online'
    );

    if (datosTablaDestino.ok) {
      toast.add({
        severity: 'success',
        summary: 'Éxito',
        detail: `Se insertaron ${datosTablaDestino.insertados} registros correctamente`,
        life: 3000
      });
    } else {
      toast.add({
        severity: 'error',
        summary: 'Error',
        detail: datosTablaDestino.error || 'Error al insertar los datos',
        life: 3000
      });
    }
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Error inesperado',
      detail: error.message || 'Ocurrió un problema en la operación',
      life: 3000
    });
    console.error(error);
  }
};
/************************************************************************/
const fnProbarPeticion = async()=>{
  const prueba = await peticionesFetchOffline('getDataByField', 'empresa','id',1);
  console.log("prueba", prueba);
}
/************************************************************************/
const fnBajarData = async () => {

const todasLasTablasLocal = await peticionesFetchOffline('getAllTables');

  // 1) ¿Todas o una?
  const { isConfirmed, isDenied } = await Swal.fire({
    title: '¿Qué deseas descargar?',
    text: 'Puedes bajar todas las tablas o solo una.',
    icon: 'question',
    showDenyButton: true,
    showCancelButton: true,
    confirmButtonText: 'Todas las tablas',
    denyButtonText: 'Solo una',
    cancelButtonText: 'Cancelar'
  });

  if (!isConfirmed && !isDenied) return;

  let tablasSeleccionadas = [];

  if (isDenied) {
    // Solo una tabla
    const { value: nombreTabla } = await Swal.fire({
      title: 'Descargar tabla',
      input: 'text',
      inputLabel: 'Nombre de la tabla a descargar',
      inputPlaceholder: 'Ej. productos, clientes, etc.',
      confirmButtonText: 'Descargar',
      cancelButtonText: 'Cancelar',
      showCancelButton: true,
      inputValidator: (value) => {
        if (!value) return 'Debes escribir el nombre de la tabla';
      }
    });
    if (!nombreTabla) return;
    tablasSeleccionadas = [String(nombreTabla).trim()];
  } else {
    // Todas
    if (!Array.isArray(todasLasTablasLocal) || todasLasTablasLocal.length === 0) {
      await Swal.fire({
        icon: 'info',
        title: 'Sin lista de tablas',
        text: 'No hay tablas configuradas en todasLasTablasLocal.'
      });
      return;
    }
    tablasSeleccionadas = [...new Set(todasLasTablasLocal.map(t => String(t).trim()).filter(Boolean))];

  }

  // === Helper: normalizar e inferir tipo ===
  const norm = k => String(k).trim().toLowerCase();
  const inferirTipoSQLite = (valor) => {
    if (valor === null || valor === undefined) return 'TEXT';
    const t = typeof valor;
    if (t === 'number') return Number.isInteger(valor) ? 'INTEGER' : 'REAL';
    if (t === 'boolean') return 'INTEGER'; // 0/1
    return 'TEXT';
  };

  try {
    // 2) PRE-CÁLCULO: traer datos, comparar columnas y armar plan con total de operaciones
    const plan = []; // [{ tabla, datos, registroMuestraOnline, faltantes }]
    let totalOps = 0;

    for (const nombreTabla of tablasSeleccionadas) {
      await peticionesFetchOffline('deleteAll', nombreTabla);
      let datos = [];
      try {
        datos = await peticionesFetch(
          `${link.value}${api.value}`,
          'datosarraypost',
          { tabla: nombreTabla },
          tokenCifrado.value,
          'POST',
          'online'
        );
        if (!Array.isArray(datos)) datos = [];
      } catch (e) {
        console.warn(`AVISO Falló fetch de "${nombreTabla}"`, e);
        datos = [];
      }

      // columnas online (solo si hay al menos 1 registro para tomar muestra)
      const registroMuestraOnline = datos[0] || {};
      const camposOnline = Object.keys(registroMuestraOnline);

      // columnas locales
      let camposLocal = [];
      try {
        const local = await arrayToObjetoFromTablaOffline(nombreTabla);
        if (Array.isArray(local)) {
          if (local.length > 0) {
            if (typeof local[0] === 'string') {
              camposLocal = local;
            } else if (typeof local[0] === 'object' && local[0] !== null) {
              camposLocal = local
                .map(c => c.name || c.nombre || c.field || c.column || Object.keys(c)[0])
                .filter(Boolean);
            }
          }
        } else if (local && typeof local === 'object') {
          camposLocal = Object.keys(local);
        }
      } catch (e) {
        console.warn(`AVISO Falló lectura de columnas locales en "${nombreTabla}"`, e);
      }

      const setLocal = new Set(camposLocal.map(norm));
      const faltantes = camposOnline.filter(k => !setLocal.has(norm(k)));

      totalOps += (faltantes.length) + (datos.length); // columnas a agregar + filas a insertar
      plan.push({ tabla: nombreTabla, datos, registroMuestraOnline, faltantes });
    }

    // Si no hay nada que hacer
    if (plan.length === 0 || totalOps === 0) {
      await Swal.fire({
        icon: 'info',
        title: 'Nada para descargar',
        text: 'No se encontraron operaciones pendientes (sin columnas nuevas ni filas).'
      });
      return;
    }

    // 3) Mostrar PROGRESO (sin await para no bloquear)
    let done = 0;
    Swal.fire({
      title: 'Procesando...',
      html: `
        <div style="text-align:left;min-width:320px">
          <div id="fase" style="margin-bottom:8px;">Preparando...</div>
          <div style="margin-bottom:8px;">
            <b><span id="done">0</span></b>/<b><span id="total">${totalOps}</span></b> operaciones
          </div>
          <div style="height:8px;background:#e5e7eb;border-radius:9999px;overflow:hidden;position:relative;">
            <div id="bar" style="
              position:absolute;left:0;top:0;height:100%;width:0%;
              background:#3b82f6;transition:width .2s ease;
            "></div>
          </div>
        </div>
      `,
      allowOutsideClick: false,
      allowEscapeKey: false,
      didOpen: () => Swal.showLoading()
    });
    await new Promise(r => setTimeout(r, 20)); // dejar renderizar

    const container = Swal.getHtmlContainer?.();
    const $fase = container?.querySelector('#fase');
    const $done = container?.querySelector('#done');
    const $bar  = container?.querySelector('#bar');

    const setProgress = (p) => {
      if ($bar) $bar.style.width = `${Math.max(0, Math.min(100, p)).toFixed(1)}%`;
    };
    const tick = (fase) => {
      done++;
      if ($fase) $fase.textContent = fase;
      if ($done) $done.textContent = String(done);
      setProgress((done / totalOps) * 100);
    };

    // 4) Ejecutar plan: agregar columnas faltantes e insertar filas
    let totalFilasDescargadas = 0;
    const resumen = [];

/******************************************************************/
// Dentro de fnBajarData
for (const item of plan) {
  const { tabla, datos, registroMuestraOnline, faltantes } = item;

  const faltantesSinId = faltantes.filter(c => norm(c) !== 'id');

  //  Agregar columnas faltantes
  if (faltantesSinId.length) {
    for (const campo of faltantesSinId) {
      const tipo = inferirTipoSQLite(registroMuestraOnline[campo]);
      try {
        let res;
        try {
          res = await peticionesFetchOffline('addColumnToTable', tabla, campo, tipo);
        } catch {
          res = await peticionesFetchOffline('addColumnToTable', tabla, campo);
        }
        if (!res || (Array.isArray(res) && res[0] !== 'ok')) {
          console.warn(`No se pudo agregar la columna "${campo}" en "${tabla}"`, res);
        }
      } catch (e) {
        console.warn(`Error agregando columna "${campo}" en "${tabla}"`, e);
      }
      tick(`Agregando columna "${campo}" en ${tabla}...`);
    }
  }

  //  Insertar múltiples filas en bloque
  if (datos.length > 0) {
    try {
      // Quitar id para evitar conflictos
      const datosSinId = datos.map(f => {
        const clone = { ...f };
        delete clone.id;
        return clone;
      });

      // Llamada única a insertMultipleData
        console.log("datosSinId", datosSinId);
      const datosMultiples = await peticionesFetchOffline(
        'insertMultipleData',
        tabla,
        JSON.stringify(datosSinId)
      );
      console.log("datosMultiples", datosMultiples);

      // Progresar manualmente en bloque
      for (let i = 0; i < datosSinId.length; i++) {
        tick(`Insertando datos en ${tabla}...`);
      }

    } catch (e) {
      console.warn(`Fallo insertando múltiples filas en "${tabla}"`, e);
    }
  }

  totalFilasDescargadas += datos.length;
  resumen.push(`${tabla}: ${datos.length} filas`);
}

/******************************************************************/


/*
    for (const item of plan) {
      const { tabla, datos, registroMuestraOnline, faltantes } = item;

     const faltantesSinId = faltantes.filter(c => norm(c) !== 'id');


      // Agregar columnas faltantes
      if (faltantesSinId.length) {
        for (const campo of faltantesSinId) {
          const tipo = inferirTipoSQLite(registroMuestraOnline[campo]);
          try {
            let res;
            try {
              res = await peticionesFetchOffline('addColumnToTable', tabla, campo, tipo);
            } catch {
              res = await peticionesFetchOffline('addColumnToTable', tabla, campo);
            }
            if (!res || (Array.isArray(res) && res[0] !== 'ok')) {
              console.warn(`No se pudo agregar la columna "${campo}" en "${tabla}"`, res);
            }
          } catch (e) {
            console.warn(`Error agregando columna "${campo}" en "${tabla}"`, e);
          }
          tick(`Agregando columna "${campo}" en ${tabla}...`);
        }
      }

      // Insertar filas
      for (const fila of datos) {
        try {
          delete fila.id
          await peticionesFetchOffline('insertData', tabla, JSON.stringify(fila));
        } catch (e) {
          console.warn(`Fallo insertando fila en "${tabla}"`, e);
        }
        tick(`Insertando datos en ${tabla}...`);
      }

      totalFilasDescargadas += datos.length;
      resumen.push(`${tabla}: ${datos.length} filas`);
    }*/

    setProgress(100);
    Swal.close();

    await Swal.fire({
      icon: 'success',
      title: 'Descarga completada',
      html: `
        <div>Tablas procesadas: <b>${plan.length}</b></div>
        <div>Total de registros descargados: <b>${totalFilasDescargadas}</b></div>
        <hr/>
        <div style="text-align:left;max-height:200px;overflow:auto">
          ${resumen.map(r => `<div>* ${r}</div>`).join('')}
        </div>
      `
    });

  } catch (error) {
    console.error('Error en el proceso:', error);
    Swal.close();
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: error?.message || 'Hubo un problema durante la descarga.'
    });
  }
};

/************************************************************************/
const fnCambiaOnlineOffline = async(tipo)=>{

  const nJSONResponse = await envioElectron('datosarchivo');

  if(tipo.value === 'Offline'){
    nJSONResponse.OFFLINE = 'true'
    nJSONResponse.ONLINE = 'false'
  const envioDatosJSON = await window.electron.ipcRenderer.invoke('actualizarjson', nJSONResponse);

  }else if(tipo.value === 'Online'){
    nJSONResponse.OFFLINE = 'false'
    nJSONResponse.ONLINE = 'true'
  const envioDatosJSON = await window.electron.ipcRenderer.invoke('actualizarjson', nJSONResponse);
  }else{
    nJSONResponse.OFFLINE = 'true'
    nJSONResponse.ONLINE = 'true'
    const envioDatosJSON = await window.electron.ipcRenderer.invoke('actualizarjson', nJSONResponse);
  }

}
/************************************************************************/
const fnSubirDatos = async()=>{
  const datos = await peticionesFetchOffline('subirDatos');
  console.log("datos", datos);
}
/************************************************************************/
const limpiarTabla = async(tabla)=>{
  const response = await peticionesFetch(`${datosJSONR.value.VITE_LINKURL}${datosJSONR.value.VITE_LINK_API}`, `borrartodo`, {tabla:tabla}, tokenCifrado.value, 'POST');
 return response;
}
/************************************************************************/
const insertarDatosArray = async(tabla,datos)=>{
  const response = await peticionesFetch(`${datosJSONR.value.VITE_LINKURL}${datosJSONR.value.VITE_LINK_API}`, `insertararray/${tabla}`, datos, tokenCifrado.value, 'POST');
 return response;
}
/************************************************************************/
const fnSubirTodaLaData = async()=>{
  const tablasAsubir = ['empresa','facturas','productos','imei','cotizacion','taller','usuarios','clientes','cuentas_cobrar']
  
  for(let tabla of tablasAsubir){
       const borrar = await limpiarTabla(tabla)
         if(borrar[0] === 'ok'){
            const datosLocal = await peticionesFetchOffline('getDataAsArray', tabla);
            const subirdatos = await insertarDatosArray(tabla,datosLocal);

         }
  }


}
/************************************************************************/

const nextPaint = () => new Promise(requestAnimationFrame);

const fnBajarProductos = async () => {
  // 1) Traer datos
  const datos = await peticionesFetch(
    `${link.value}${api.value}`,
    'datosarraypost',
    { tabla: 'productos' },
    tokenCifrado.value,
    'POST',
    'online'
  );
  const productosLocal = await peticionesFetchOffline('getDataAsArray', 'productos');

  // 2) Normalizar fuentes (por si vienen como {datos: [...]})
  const toArray = (x) =>
    Array.isArray(x) ? x :
    (Array.isArray(x?.datos) ? x.datos :
    (Array.isArray(x?.data) ? x.data : []));

  const remotos = toArray(datos);
  const locales = toArray(productosLocal);

  // 3) Armar set de códigos locales normalizados
  const norm = (c) => String(c ?? '').trim().replace(/[\s\-_.]/g, '').toUpperCase();
  const codigosLocales = new Set(locales.map(p => p?.codigo).filter(Boolean).map(norm));

  // 4) Faltantes
  const productosFaltantes = [];
  const vistos = new Set();
  for (const p of remotos) {
    const k = norm(p?.codigo);
    if (!k) continue;
    if (codigosLocales.has(k)) continue;
    if (vistos.has(k)) continue;
    vistos.add(k);
    productosFaltantes.push(p);
  }

  if (productosFaltantes.length === 0) {
    await Swal.fire({ icon: 'success', title: 'Todo al día', text: 'No hay productos nuevos.' });
    return { total: 0, insertados: 0, fallidos: 0 };
  }

  // 5) Mostrar modal (¡SIN await!)
  let refs = {};
  const total = productosFaltantes.length;

  Swal.fire({
    title: 'Sincronizando productos',
    html: `
      <div style="margin-bottom:8px;">
        Insertando <b id="swal-ins">0</b> de <b id="swal-tot">${total}</b>
      </div>
      <div style="width:100%;height:10px;background:#eee;border-radius:6px;overflow:hidden;">
        <div id="swal-bar" style="height:10px;width:0%;background:#3085d6;"></div>
      </div>
      <div id="swal-sub" style="margin-top:8px;font-size:12px;color:#666;">Preparando...</div>
    `,
    allowOutsideClick: false,
    showConfirmButton: false,
    didOpen: () => {
      Swal.showLoading();
      const html = Swal.getHtmlContainer();
      refs.ins = html.querySelector('#swal-ins');
      refs.bar = html.querySelector('#swal-bar');
      refs.sub = html.querySelector('#swal-sub');
    }
  });

  // 6) Insertar con progreso
  let ok = 0, fail = 0;

  for (let i = 0; i < total; i++) {
    const pro = { ...productosFaltantes[i] };
    delete pro.id;

    // actualizar UI ANTES de la operación para que pinte
    if (refs.sub) refs.sub.textContent = `Insertando ${pro?.codigo ?? '(sin código)'}`;
    if (refs.ins) refs.ins.textContent = String(i);
    if (refs.bar) refs.bar.style.width = `${Math.round((i / total) * 100)}%`;
    await nextPaint();

    try {
      await peticionesFetchOffline('insertData', 'productos', JSON.stringify(pro));
      ok++;
    } catch (e) {
      console.error('Error insertando', pro?.codigo, e);
      fail++;
    }

    // actualizar UI DESPUÉS de la operación
    if (refs.ins) refs.ins.textContent = String(i + 1);
    if (refs.bar) refs.bar.style.width = `${Math.round(((i + 1) / total) * 100)}%`;
    await nextPaint();
  }

  await Swal.close();

  await Swal.fire({
    icon: fail ? 'warning' : 'success',
    title: fail ? 'Sincronizado con advertencias' : 'Sincronización completa',
    html: `
      <div><b>Total:</b> ${total}</div>
      <div><b>Insertados:</b> ${ok}</div>
      <div><b>Fallidos:</b> ${fail}</div>
    `
  });

  return { total, insertados: ok, fallidos: fail };
};


/************************************************************************/
const KEY_BY_TABLE = {
  facturas: 'no_factura',
  clientes: 'codigo',
  productos: 'codigo',
};

// Normaliza lo que devuelva tu offline (objeto o arreglo)
const normalizeLocal = (res) => {
  if (!res) return null;
  if (Array.isArray(res)) return res[0] || null;
  return res;
};

const cloneWithoutId = (row) => {
  const copy = JSON.parse(JSON.stringify(row || {}));
  delete copy.id; // muy importante
  return copy;
};

const upsertOffline = async (tabla, claveCampo, filaRemota) => {
  const valorClave = filaRemota?.[claveCampo];
  if (valorClave == null || valorClave === '') return { tabla, skip: true, reason: `Fila sin ${claveCampo}` };

  // 1) Buscar en local por el campo clave
  const localFound = normalizeLocal(await peticionesFetchOffline('getDataByField', tabla, claveCampo, valorClave));

  if (localFound && localFound.id != null) {
    // 2) UPDATE -> reusar id local, borrar id remoto
    const datos = cloneWithoutId(filaRemota);
    datos.id = localFound.id; // conservar PK local
    await peticionesFetchOffline('updateData', tabla, JSON.stringify(datos));
    return { tabla, op: 'update', key: claveCampo, value: valorClave, idLocal: localFound.id };
  } else {
    // 3) INSERT -> sin id
    const datos = cloneWithoutId(filaRemota);
    // Si tu adapter usa otro nombre, cambia 'insertData' por 'addData'
    await peticionesFetchOffline('insertData', tabla, JSON.stringify(datos));
    return { tabla, op: 'insert', key: claveCampo, value: valorClave };
  }
};

const revisaCambios = async () => {
  try {
    const payload = {
      since: "2025-08-21 00:00:00",
      tablas: ["productos","clientes","facturas"],
      campo: "updated_at",
      modo: "filas",                 // importantísimo para traer filas
      //campos_select: "*",            // asegúrate de tener todas las columnas
      limit: 1000,
      offset: 0
    };

    const cambios = await peticionesFetch(
      `${link.value}${api.value}`,
      'haycambios',                  // usa 'haycambios_detalle' si ahí fue donde implementaste "filas"
      payload,
      tokenCifrado.value,
      'POST',
      'online'
    );

    console.log("cambios", cambios);

    if (!cambios?.changed) {
      console.log('Sin cambios.');
      return;
    }

    const detalles = cambios?.detalles || {};
    const resumen = [];

    // Procesa sólo las tablas que definiste
    for (const tabla of payload.tablas) {
      const det = detalles[tabla];
      if (!det) continue;

      const claveCampo = KEY_BY_TABLE[tabla];
      if (!claveCampo) {
        console.warn(`No hay clave definida para ${tabla}.`);
        continue;
      }

      const filas = det.filas || []; // el endpoint debe devolver 'filas'
      if (!Array.isArray(filas) || filas.length === 0) {
        console.log(`No hay filas para ${tabla}`);
        continue;
      }

      // Secuencial para evitar saturar tu storage local
      for (const fila of filas) {
        try {
          const r = await upsertOffline(tabla, claveCampo, fila);
          if (!r?.skip) resumen.push(r);
        } catch (e) {
          console.error(`Error procesando ${tabla}:`, e, fila);
        }
      }
    }

    console.table(resumen);
  } catch (error) {
    console.log("error", error);
  }
};

/************************************************************************/
function obtenerDiferencias(objeto1, objeto2, camposIgnorar = []) {
    const diferencias = {};
    const claves1 = Object.keys(objeto1);
    const claves2 = Object.keys(objeto2);

    // Unir todas las claves únicas de ambos objetos
    const todasLasClaves = [...new Set([...claves1, ...claves2])];

    for (const clave of todasLasClaves) {
        // Ignorar los campos que no se deben comparar
        if (camposIgnorar.includes(clave)) {
            continue;
        }

        // Verificar si la clave existe en ambos objetos
        if (!objeto1.hasOwnProperty(clave) || !objeto2.hasOwnProperty(clave)) {
            diferencias[clave] = {
                objeto1: objeto1[clave],
                objeto2: objeto2[clave]
            };
            continue;
        }

        // Comparar valores
        if (typeof objeto1[clave] === 'object' && objeto1[clave] !== null && typeof objeto2[clave] === 'object' && objeto2[clave] !== null) {
            // Si es un objeto, comparar recursivamente
            const diffAnidada = obtenerDiferencias(objeto1[clave], objeto2[clave], camposIgnorar);
            if (diffAnidada) {
                diferencias[clave] = diffAnidada;
            }
        } else if (objeto1[clave] !== objeto2[clave]) {
            diferencias[clave] = {
                objeto1: objeto1[clave],
                objeto2: objeto2[clave]
            };
        }
    }

    // Si no hay diferencias, devolver false
    return Object.keys(diferencias).length > 0 ? diferencias : false;
}

/************************************************************************/
const arrayTablasPermitidas = ['facturas'];
/************************************************************************/

const revisaCambiosLocal = async () => {
    const responseArray = await peticionesFetchOffline('sincronizacionSubirDatos');
    const tablasArray = responseArray.map(tb=>tb.tabla)

    for (const registro of responseArray) {

      const datosArrayMultiple = await peticionesFetch(
                  `${link.value}${api.value}`,
                  'datosarraymultiples',
                  { tablas: tablasArray },
                  tokenCifrado.value,
                  'POST',
                  'online'
              );

        for (const buscado of registro.registros) {
            // Buscar si el registro existe en el servidor
            let verificaExiste = null
            if(registro.tabla  === 'facturas'){
                verificaExiste = datosArrayMultiple[registro.tabla].find(bs => bs.no_factura === buscado.no_factura);
            }else if(registro.tabla  === 'productos'){
                verificaExiste = datosArrayMultiple[registro.tabla].find(bs => bs.codigo === buscado.codigo);
            }else if(registro.tabla  === 'taller'){
                verificaExiste = datosArrayMultiple[registro.tabla].find(bs => bs.no_factura === buscado.no_factura);
            }else if(registro.tabla  === 'cuentas_cobrar'){
                verificaExiste = datosArrayMultiple[registro.tabla].find(bs => bs.no_emision === buscado.no_emision);
            }else{
                verificaExiste = datosArrayMultiple[registro.tabla].find(bs => bs.identificadordb === buscado.identificadordb);
            }

            if (verificaExiste) {
                // Si existe, comparar los datos (ignorando el campo 'id')
                const diferencias = obtenerDiferencias(buscado, verificaExiste, ['id']);

                if (diferencias) {
                    console.log(`El registro ${buscado.identificadordb} tiene diferencias:`, diferencias);
                     verificaExiste.id = buscado.id
                    const actualizacion = await peticionesFetch(
                      `${link.value}${api.value}`,
                      'actualizarcampos/'+registro.tabla,
                      buscado,
                      tokenCifrado.value,
                      'POST',
                      'online'
                  );
                    console.log("actualizacion", actualizacion);
                } else {
                    console.log(`El registro ${buscado.identificadordb} no tiene cambios.`);
                }
            } else {
                console.log(`El registro ${buscado.identificadordb} no existe en el servidor. Se creará.`);
                delete buscado.id
                const crear = await peticionesFetch(
                      `${link.value}${api.value}`,
                      'insertar/'+registro.tabla,
                      buscado,
                      tokenCifrado.value,
                      'POST',
                      'online'
                  );
            }
        }
    }
};

/************************************************************************/
const fnProbandoFunciones = async()=>{
  const datosCliente = await peticionesFetchOffline('getDataByField', 'clientes','id',1);
  const campos = await arrayToObjetoFromTablaOffline('clientes');
  campos.nombre = "Probando"
  const tabla = 'empresa'

    const data = {
      tabla: tabla,
      campo: 'created_at',
      fechainicio: '2025-09-06 00:00:00',
      fechafin: '2025-09-06 23:00:00',
    };


  const envio = await peticionesFetch(
        `${link.value}${api.value}`,
        `peticionimagenes`,
        {"origen":'../vista/img/empresa/6917781922'},
         tokenCifrado.value,
        'POST'
      );
  console.log("envio", envio);
}
/************************************************************************/
const fnCLienteDefault = async()=>{
  try{
    const camposBase = await arrayToObjetoFromTabla("clientes");
    camposBase.nombre = 'AL CONTADO'
    camposBase.apodo = 'AL CONTADO'
    camposBase.codigo = '0000000'
    camposBase.cedula = '0000000'
    camposBase.estado_membresia = 'ACTIVO'
    camposBase.estado = 'ACTIVO'
    camposBase.direccion = 'SIN REGISTRO'
    camposBase.telefono = '000-000-0000'
    const agregado = await peticionesFetchOffline("insertData", "clientes", JSON.stringify(camposBase));
    if(agregado[0] === 'ok'){

     toast.add({
        severity: "success",
        summary: "Éxito",
        detail: `Cliente por Default Creado Correctamente`,
        life: 3000,
      });
    } else {
      toast.add({
        severity: "error",
        summary: "Error",
        detail: `Error al crear CLiente por Default`,
        life: 3000,
      });
    }
  }catch(error){
    console.log("error", error);

  }
}
/************************************************************************/
const fnBajarDataGuason = async () => {
  try {
    //  Traer data remota
    const dataServidor = await peticionesFetch(
      `https://guason.tmposrd.com${api.value}`,
      "datosarraypost",
      { tabla: "facturas" },
      tokenCifrado.value,
      "POST"
    );

    //  Traer data local
    const datosServidorLocal = await peticionesFetchOffline(
      "getDataAsArray",
      "facturas"
    );

    //  Crear un set con los no_emision locales
    const noEmisionesLocales = new Set(
      (datosServidorLocal || []).map(item => item.codigo)
    );

    //  Filtrar solo los que no existen localmente
    const datosFiltrados = (dataServidor || []).filter(
      item => !noEmisionesLocales.has(item.no_factura)
    );

    console.log("Datos faltantes que vienen del servidor:", datosFiltrados);

   for(let data of datosFiltrados){
    delete data.id
    const envio = await peticionesFetchOffline('insertData', 'facturas', JSON.stringify(data));
    console.log("envio", envio);
   }


    //return datosFiltrados;
  } catch (error) {
    console.error("ERROR Error en fnBajarDataGuason:", error);
    return [];
  }
};

/************************************************************************/
const fnProbarCosas = async()=>{
  const datosOffline = await peticionesFetchOffline('crearBackupSQLConControl');
  console.log("datosOffline", datosOffline);
}
/************************************************************************/
const backupsDisponibles = ref([]);

/**
 * Obtener lista de backups disponibles
 */
const fnListarBackups = async () => {
  const response = await peticionesFetchOffline('listarBackupsSQL');
  if (response[0] === 'ok') {
    backupsDisponibles.value = response[1];
  } else {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'No se pudieron listar los backups',
      life: 3000
    });
  }
};

/**
 * Restaurar un backup seleccionado
 */
const fnRestaurarBackup = async (backup) => {
  const confirmar = await Swal.fire({
    title: '¿Restaurar base de datos?',
    html: `
      <p>¿Deseas restaurar el sistema desde <b>${backup.nombre}</b>?</p>
      <p style="color:red;font-weight:bold;">AVISO Se sobrescribirá la base de datos actual.</p>
    `,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Sí, restaurar',
    cancelButtonText: 'Cancelar',
    confirmButtonColor: '#dc2626',
    cancelButtonColor: '#6b7280'
  });

  if (!confirmar.isConfirmed) return;

  const resp = await peticionesFetchOffline('restaurarBackupSQL', backup.nombre);
  if (resp[0] === 'ok') {
    await Swal.fire('OK Éxito', 'Base de datos restaurada correctamente.', 'success');
    toast.add({ severity: 'success', summary: 'Restaurado', detail: resp[1], life: 3000 });
  } else {
    Swal.fire('ERROR Error', resp[1], 'error');
  }
};

/************************************************************************/
const colores = [
  { severity: 'secondary', color: '#6b7280' }, // gris
  { severity: 'info', color: '#3b82f6' },      // azul
  { severity: 'success', color: '#22c55e' },   // verde
  { severity: 'warning', color: '#f59e0b' },   // amarillo
  { severity: 'danger', color: '#ef4444' },    // rojo
  { severity: 'help', color: '#8b5cf6' },      // violeta
  { severity: 'contrast', color: '#14b8a6' },  // turquesa
  { severity: 'secondary', color: '#f97316' }  // naranja
];

/************************************************************************/
const enviarConfig = async()=>{

try{
  const response = await envioElectron('datosarchivo');
  const campos = await arrayToObjetoFromTabla('config');

  for (const [campo, valor] of Object.entries(response)) {

    const composR = JSON.parse(JSON.stringify(campos))

       if (composR.hasOwnProperty('created_at')) {
    composR.created_at = nfecha('timestamp');
    composR.updated_at = nfecha('timestamp');
  }
    composR.nombre = campo
    
     let valorProcesado = valor;
      if (
        typeof valor === "object" && 
        valor !== null
      ) {
        try {
          valorProcesado = JSON.stringify(valor);
        } catch (e) {
          console.warn(`AVISO No se pudo stringify el valor de ${campo}:`, e);
        }
      }

      composR.valor = valorProcesado;

  const datosEnviar = JSON.parse(JSON.stringify(composR));
  const envioDatos = await peticionesFetchOffline('insertData','config', JSON.stringify(datosEnviar));
  console.log("envioDatos", envioDatos);


      
/*    const response = await fetch("http://192.168.0.50:3000/api2/insertar/config", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": tokenCifrado.value
      },
      body: JSON.stringify({
        nombre: campo,
        valor: valor
      })
    });
      console.log("response", response);*/


    }

}catch(error){
  console.log(error)
}

}
/************************************************************************/
const busquedaTabla = ref('')

// Aseguramos que todos los nombres sean cadenas
const tablasFiltradas = computed(() => {
  if (!busquedaTabla.value) return tablasArray.value.map(t => String(t))
  return tablasArray.value
    .map(t => String(t))
    .filter(tabla =>
      tabla.toLowerCase().includes(busquedaTabla.value.toLowerCase())
    )
})
/************************************************************************/
const fnExportSQL = async () => {
  try {
    const tabla = tablaSelected.value;
    if (!tabla) {
      return Swal.fire("Aviso", "Selecciona una tabla primero.", "warning");
    }

    //  Obtener el SQL desde el backend
    const response = await peticionesFetchOffline("exportSQL", tabla);

    // Validar respuesta
    if (!response || response[0] === "error" || response.length === 0) {
      return Swal.fire("Error", response?.[1] || "No se pudo exportar la tabla.", "error");
    }

    // Si la función devuelve directamente el SQL (string)
    const sqlText = typeof response === "string" ? response : response[1] || JSON.stringify(response, null, 2);

    //  Mostrar el SQL en un SweetAlert2 con textarea
    Swal.fire({
      title: `Exportar SQL de ${tabla}`,
      html: `
        <textarea id="sql-textarea" readonly
          style="width:100%;height:300px;padding:10px;
          border:1px solid #ccc;border-radius:6px;
          font-family:monospace;font-size:12px;
          color:#111;background:#f8f9fa;">${sqlText}</textarea>
      `,
      width: 800,
      confirmButtonText: "Copiar SQL",
      showCancelButton: true,
      cancelButtonText: "Cerrar",
      didOpen: () => {
        const textarea = document.getElementById("sql-textarea");
        textarea.scrollTop = 0; // Ir al inicio
      },
      preConfirm: async () => {
        const textarea = document.getElementById("sql-textarea");
        await navigator.clipboard.writeText(textarea.value);
        Swal.fire("OK Copiado", "El SQL se copió al portapapeles.", "success");
      },
    });
  } catch (error) {
    console.error("ERROR Error en fnExportSQL:", error);
    Swal.fire("Error", "No se pudo exportar la tabla.", "error");
  }
};
/************************************************************************/
const fnImportSQL = async () => {
  try {
    const { value: sqlString } = await Swal.fire({
      title: "Ejecutar Sentencia SQL",
      html: `
        <textarea id="sql-textarea" placeholder="Pega aquí tu sentencia SQL..."
          style="width:100%;height:300px;padding:10px;
          border:1px solid #ccc;border-radius:6px;
          font-family:monospace;font-size:12px;
          color:#111;background:#f8f9fa;"></textarea>
      `,
      width: 800,
      focusConfirm: false,
      confirmButtonText: "Ejecutar SQL",
      showCancelButton: true,
      cancelButtonText: "Cancelar",
      preConfirm: () => {
        const textarea = document.getElementById("sql-textarea");
        const value = textarea.value.trim();
        if (!value) {
          Swal.showValidationMessage("Debes escribir o pegar una sentencia SQL.");
          return false;
        }
        return value;
      },
      didOpen: () => {
        const textarea = document.getElementById("sql-textarea");
        textarea.focus();
      },
    });

    if (!sqlString) return;

    //  Enviar la sentencia al backend
    const response = await peticionesFetchOffline("importSQL", sqlString);

    if (response[0] === "ok") {
      Swal.fire("OK Éxito", response[1] || "SQL ejecutado correctamente.", "success");
    } else {
      Swal.fire("ERROR Error", response[1] || "Error al ejecutar la sentencia SQL.", "error");
    }
  } catch (error) {
    console.error("ERROR Error en fnImportSQL:", error);
    Swal.fire("Error", "No se pudo ejecutar el SQL.", "error");
  }
};
/************************************************************************/
const fnEliminarIMEI = async () => {
  try {
    // Consultar IMEI con estado DISPONIBLE y VENDIDO
    const imeiDisponible = await peticionesFetchOffline('getDataArrayByCondition', 'imei', 'estado', 'DISPONIBLE');
    const imeiVendido = await peticionesFetchOffline('getDataArrayByCondition', 'imei', 'estado', 'VENDIDO');

    const totalDisponible = imeiDisponible?.length || 0;
    const totalVendido = imeiVendido?.length || 0;

    // Mostrar modal con opciones
    const { value: opcion } = await Swal.fire({
      title: "Eliminar IMEI por Estado",
      html: `
        <div style="text-align: left; padding: 10px;">
          <p style="margin-bottom: 15px;">Selecciona qué IMEI deseas eliminar:</p>
          <div style="background: #f8f9fa; padding: 10px; border-radius: 6px; margin-bottom: 10px;">
            <strong>DISPONIBLE:</strong> ${totalDisponible} registros
          </div>
          <div style="background: #f8f9fa; padding: 10px; border-radius: 6px;">
            <strong>VENDIDO:</strong> ${totalVendido} registros
          </div>
        </div>
      `,
      showDenyButton: true,
      showCancelButton: true,
      confirmButtonText: `Eliminar DISPONIBLE (${totalDisponible})`,
      denyButtonText: `Eliminar VENDIDO (${totalVendido})`,
      cancelButtonText: "Cerrar",
      confirmButtonColor: "#d33",
      denyButtonColor: "#e67e22",
    });

    if (!opcion) return;

    // Determinar qué estado eliminar
    const estadoAEliminar = opcion === true ? "DISPONIBLE" : "VENDIDO";
    const totalAEliminar = opcion === true ? totalDisponible : totalVendido;

    if (totalAEliminar === 0) {
      Swal.fire("INFO Información", `No hay registros con estado ${estadoAEliminar} para eliminar.`, "info");
      return;
    }

    // Pedir confirmación
    const confirmacion = await Swal.fire({
      title: "AVISO Confirmación",
      html: `
        <p>¿Estás seguro de eliminar <strong>${totalAEliminar}</strong> IMEI con estado <strong>${estadoAEliminar}</strong>?</p>
        <p style="color: #d33; margin-top: 10px;">Esta acción no se puede deshacer.</p>
      `,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#d33",
    });

    if (!confirmacion.isConfirmed) return;

        // Ejecutar eliminación
    const resp = await peticionesFetchOffline(
      "ejecutarSQL",
      `DELETE FROM imei WHERE estado = '${estadoAEliminar}'`
    );

    if (resp?.ok) {
      Swal.fire(
        "OK Éxito",
        `Se eliminaron ${resp.affectedRows ?? 0} IMEI con estado ${estadoAEliminar}.`,
        "success"
      );
    } else {
      Swal.fire("ERROR Error", resp?.error || "Error al eliminar los IMEI.", "error");
    }
  } catch (error) {
    console.error("ERROR Error en fnEliminarIMEI:", error);
    Swal.fire("Error", "No se pudo completar la operación.", "error");
  }
};
/************************************************************************/
function jsonIsValid(val) {
  if (typeof val !== 'string') return false
  const s = val.trim()
  try {
    JSON.parse(s)
    return true
  } catch {
    return false
  }
}

function parseJson(val) {
  try {
    return JSON.parse(String(val))
  } catch {
    return null
  }
}

/* -----------------------
   JSON -> DataTable rows/cols
----------------------- */
function jsonRows(jsonStr) {
  const data = parseJson(jsonStr)
  if (data === null) return []

  // Array
  if (Array.isArray(data)) {
    // array de objetos
    if (data.length && typeof data[0] === 'object' && data[0] !== null && !Array.isArray(data[0])) {
      return data
    }
    // array simple (strings/numbers/bools)
    return data.map((v, i) => ({ index: i + 1, value: stringifyCell(v) }))
  }

  // Object
  if (typeof data === 'object') {
    // lo mostramos como key/value
    return Object.entries(data).map(([k, v]) => ({
      key: k,
      value: stringifyCell(v)
    }))
  }

  // primitives
  return [{ value: stringifyCell(data) }]
}

function jsonColumns(jsonStr) {
  const data = parseJson(jsonStr)
  if (data === null) return []

  // Array
  if (Array.isArray(data)) {
    // array de objetos
    if (data.length && typeof data[0] === 'object' && data[0] !== null && !Array.isArray(data[0])) {
      const keys = uniqueKeysFromArrayObjects(data)
      return keys.map(k => ({ field: k, header: k }))
    }
    // array simple
    return [
      { field: 'index', header: '#' },
      { field: 'value', header: 'value' }
    ]
  }

  // Object
  if (typeof data === 'object' && data !== null) {
    return [
      { field: 'key', header: 'key' },
      { field: 'value', header: 'value' }
    ]
  }

  // primitive
  return [{ field: 'value', header: 'value' }]
}

function uniqueKeysFromArrayObjects(arr) {
  const set = new Set()
  for (const obj of arr) {
    if (obj && typeof obj === 'object' && !Array.isArray(obj)) {
      Object.keys(obj).forEach(k => set.add(k))
    }
  }
  return Array.from(set)
}

function stringifyCell(v) {
  if (v === null || v === undefined) return ''
  if (typeof v === 'object') return JSON.stringify(v)
  return String(v)
}
/************************************************************************/
const excelFacturaRowsFiltradas = computed(() => {
  const termino = String(excelFacturaBusqueda.value || '').trim().toLowerCase();
  if (!termino) {
    return excelFacturaRows.value;
  }

  return excelFacturaRows.value.filter((fila) =>
    Object.entries(fila || {}).some(([key, value]) => {
      if (key === '__rowId') return false;
      return String(stringifyCell(value)).toLowerCase().includes(termino);
    })
  );
});
/************************************************************************/
const fnAbrirModalApiTest = () => {
  // Inicializar el textarea con el ejemplo exacto que funciona
  if (!apiTestQuery.value) {
    apiTestQuery.value = JSON.stringify({
      "idDoc": {
        "incomeType": 1,
        "paymentType": 1,
        "encf": "E310019645001",
        "sequenceDueDate": "2028-12-31",
        "paymentFormsTable": [
          {
            "paymentMethod": 1,
            "paymentAmount": 100
          },
          {
            "paymentMethod": 1,
            "paymentAmount": 100
          },
          {
            "paymentMethod": 1,
            "paymentAmount": 100
          }
        ]
      },
      "sender": {
        "rnc": "132109122",
        "companyName": "Prueba",
        "address": "santiago",
        "stampDate": "2026-03-26"
      },
      "buyer": {
        "rnc": "133023539",
        "companyName": "Compania de prueba"
      },
      "totals": {
        "totalTaxedAmount": 100,
        "totalAmount": 100
      },
      "otherCurrency": {
        "currencyType": "USD",
        "exchangeRate": 60,
        "totalAmountOtherCurrency": 100
      },
      "itemDetails": [
        {
          "billingIndicator": 1,
          "retention": {
            "indicatorAgentWithholdingPerception": 1
          },
          "goodServiceIndicator": 1,
          "otherCurrencyDetail": {
            "priceOtherCurrency": 100,
            "amountItemOtherCurrency": 100
          },
          "lineNumber": 1,
          "itemName": "Producto de prueba",
          "quantityItem": 1,
          "unitPriceItem": 100,
          "itemAmount": 100
        }
      ]
    }, null, 2);
  }
  visibleApiTest.value = true;
};

const fnProbarApiALaNube = async () => {
  try {
    apiTestLoading.value = true;
    apiTestResult.value = '';

    // Token de autenticación
    const token = 'eyJhbGciOiJSUzI1NiIsImtpZCI6ImU1ZTEzYzFiLTJiYTgtNGYzOC1hNWMxLTQ5NWEzMjk3ZjE4ZiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIwZTIwYTFlYi1kYjJkLTQ0YTMtOTM3ZC1hMTk1YWQ4M2NjMmQiLCJlbWFpbCI6InRtcG9zc3JsQGFsYW51YmUuY28iLCJzY29wZSI6ImMuci51OmFwaWRvbV9mdWxsX2FjY2VzcyBnZW5lcmljIiwibGFzdFVwZGF0ZWRQYXNzd29yZCI6IjIwMjYtMDMtMjYgMjI6Mzc6MDkiLCJpc3MiOiJzYW5kLWF1dGgtYXBpLmFsZWdyYS5jb20iLCJpYXQiOjE3NzQ1NjQ2MzgsImV4cCI6MTE3MTczNDAyMiwianRpIjoiZTY4N2FhMDMtODc2NS00YWVmLWE5NTgtZTkwMzQzM2FiNjM2In0.UXoIZIoyhbXUlUFC-e7zcPed503KPm04nkq75C71KXJAlIhvpHwUvUszTnMuWfLLmPj_SVjuqnIkI7PRHSJ0awNmNq5H7fajjQnigNviTEfhxVkN-XiAj2UvLY5DZtBKbcDMdVvRO1K8XAExy-oHH43zuj1Tzx6hOhdIqdOmvmOEUda6VZ-gjUnI2RPY0ha2AgfL56lxx2pZSTQ_CB0cTvNU-YgO5Z6PZNW7krGRGkWalVUaZykJOZd1cWYe_g1fB143nsqiWj7PZIN6McjBXzt5iKGDDFmZI7fD1FsK75frBgLmIgPKWLrABhb9V1NbTIrHxNoJSQunFaLC-3VmAQ';

    // URL del endpoint de sandbox
    const apiUrl = 'https://sandbox.alanube.co/dom/v1/fiscal-invoices';

    // Parsear el JSON del textarea
    let facturaData;
    try {
      facturaData = JSON.parse(apiTestQuery.value);
    } catch (parseError) {
      throw new Error('JSON inválido en la consulta: ' + parseError.message);
    }

    // Hacer la petición HTTP directamente con axios
    const response = await axios.post(apiUrl, facturaData, {
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    apiTestResult.value = JSON.stringify(response.data, null, 2);
    toast.add({
      severity: 'success',
      summary: 'Éxito',
      detail: 'API probada correctamente',
      life: 3000
    });
  } catch (error) {
    console.error('Error al probar API:', error);
    apiTestResult.value = JSON.stringify({
      error: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      details: error.response?.data || error
    }, null, 2);
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Error al probar la API: ' + (error.response?.data?.message || error.message),
      life: 5000
    });
  } finally {
    apiTestLoading.value = false;
  }
};
/************************************************************************/
</script>
<template>
<main class="content-wrapper card">
  <div class="w-full px-4 mt-5">
    <div class="grid grid-cols-12 gap-4">
      <div class="md:col-span-12">
        <fieldset class="border p-3 rounded mb-2">
          <legend class="float-none w-auto px-2">Datos de Soporte</legend>

  <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-10 gap-4">
    <Button @click="fnSincronizar" class="p-button-outline p-button-primary">
      <i class="pi pi-refresh"></i><br/>
      <span>Sincronizar</span>
    </Button>
    <Button @click="fnVerTablas" class="p-button-outline p-button-success">
      <i class="pi pi-table"></i><br/>
      <span>Tablas</span>
    </Button>
    <Button @click="visibleAgregarTabla = true" class="p-button-outline p-button-success">
      <i class="pi pi-table"></i><br/>
      <span>Agregar Tabla</span>
    </Button>
    <Button @click="fnDevTool" class="p-button-outline p-button-secondary">
      <i class="pi pi-cog"></i><br/>
      <span>DevTools</span>
    </Button>
    <Button @click="fnVerificarTablas" class="p-button-outline p-button-secondary">
      <i class="pi pi-table"></i><br/>
      <span>Verificar Tablas</span>
    </Button>
    <Button @click="fnSincronizarTodosCampos" class="p-button-outline p-button-warning">
      <i class="pi pi-refresh"></i><br/>
      <span>Sincronizar Todos los Campos</span>
    </Button>
    <Button @click="fnCrearBackup" class="p-button-outline p-button-warning">
      <i class="pi pi-refresh"></i><br/>
      <span>Backup DATA</span>
    </Button>
    <Button @click="fnCrearTablasDesdeAPI" class="p-button-outline p-button-success">
      <i class="pi pi-refresh"></i><br/>
      <span>Backup Offline</span>
    </Button>
    <Button @click="revisarActualizacion" class="p-button-outline p-button-success">
      <i class="pi pi-refresh"></i><br/>
      <span>Actualizar Sistema</span>
    </Button>
    <Button @click="fnDatosDefault" class="p-button-outline p-button-success">
      <i class="pi pi-eraser"></i><br/>
      <span>Datos Default</span>
    </Button>
    <Button @click="fnPrueba" class="p-button-outline p-button-success">
      <i class="pi pi-refresh"></i><br/>
      <span>Prueba</span>
    </Button>
    <Button @click="fnWhatsapp" class="p-button-outline p-button-success">
      <i class="pi pi-whatsapp"></i><br/>
      <span>Whatsapp</span>
    </Button>
    <Button @click="fnActualizar" class="p-button-outline p-button-success">
      <i class="pi pi-sync"></i><br/>
      <span>Actualizar Sistema</span>
    </Button>
    <Button @click="visibledatosEmpresa = true" class="p-button-outline p-button-primary">
      <i class="pi pi-sync"></i><br/>
      <span>Datos Empresa</span>
    </Button>
    <Button @click="fnCalcularGanancias" class="p-button-outline p-button-primary">
      <i class="pi pi-sync"></i><br/>
      <span>Calcular Ganancias</span>
    </Button>
    <Button @click="fnNombreEmpresa" class="p-button-outline p-button-primary">
      <i class="pi pi-sync"></i><br/>
      <span>Nombre de Empresa</span>
    </Button>
    <Button @click="fnCambiarDEMO" class="p-button-outline p-button-primary">
      <i class="pi pi-sync"></i><br/>
      <span>Cambiar para DEMO</span>
    </Button>
    <Button @click="inventario = true" class="p-button-outline p-button-primary">
      <i class="pi pi-sync"></i><br/>
      <span>Inventario</span>
    </Button>
    <Button @click="fnProbarPeticion" class="p-button-outline p-button-primary">
      <i class="pi pi-sync"></i><br/>
      <span>Probar Peticion</span>
    </Button>
    <Button @click="fnBajarData" class="p-button-outline p-button-primary">
      <i class="pi pi-sync"></i><br/>
      <span>Bajar Data</span>
    </Button>

    <SelectButton v-model="onLineOffline" @change="fnCambiaOnlineOffline" :allowEmpty="false" :options="['Online','Offline','Both']" />

    <Button @click="fnSubirDatos" class="p-button-outline p-button-primary">
      <i class="pi pi-sync"></i><br/>
      <span>Subir Data</span>
    </Button>

    <Button @click="fnAbrirModalApiTest" class="p-button-outline p-button-info">
      <i class="pi pi-cloud"></i><br/>
      <span>Probar API A La Nube</span>
    </Button>

    <Button @click="fnSubirTodaLaData" class="p-button-outline p-button-primary">
      <i class="pi pi-sync"></i><br/>
      <span>Subir Toda la Data</span>
    </Button>

    <Button @click="fnBajarProductos" class="p-button-outline p-button-primary">
      <i class="pi pi-sync"></i><br/>
      <span>Bajar Productos</span>
    </Button>

    <Button @click="revisaCambios" class="p-button-outline p-button-primary">
      <i class="pi pi-sync"></i><br/>
      <span>Revisa Cambios</span>
    </Button>

    <Button @click="revisaCambiosLocal" class="p-button-outline p-button-primary">
      <i class="pi pi-sync"></i><br/>
      <span>Revisa Cambios Local</span>
    </Button>


    <Button @click="fnProbandoFunciones" class="p-button-outline p-button-primary">
      <i class="pi pi-sync"></i><br/>
      <span>Probando Funciones</span>
    </Button>

    <Button @click="fnCLienteDefault" class="p-button-outline p-button-primary">
      <i class="pi pi-sync"></i><br/>
      <span>CLiente por Default</span>
    </Button>

    <Button @click="fnBajarDataGuason" class="p-button-outline p-button-primary">
      <i class="pi pi-sync"></i><br/>
      <span>Data Guason</span>
    </Button>

    <Button @click="enviarConfig" class="p-button-outline p-button-primary">
      <i class="pi pi-sync"></i><br/>
      <span>Probar Cosas</span>
    </Button>

    <Button @click="fnImportSQL" class="p-button-outline p-button-primary">
      <i class="pi pi-sync"></i><br/>
      <span>Agregar Sentencia SQL</span>
    </Button>

    <Button @click="fnEliminarIMEI" class="p-button-outline p-button-danger">
      <i class="pi pi-trash"></i><br/>
      <span>Eliminar IMEI</span>
    </Button>

    <Button @click="fnAbrirImportadorFacturas" class="p-button-outline p-button-help">
      <i class="pi pi-file-import"></i><br/>
      <span>Importar Factura</span>
    </Button>

    <Button @click="fnRestaurarEmpresaId1Default" class="p-button-danger">
      <i class="pi pi-refresh"></i><br/>
      <span>Restaurar Empresa ID 1</span>
    </Button>

    <Button @click="fnAgregarAlmacen" class="p-button-outline p-button-primary">
      <i class="pi pi-building"></i><br/>
      <span>Campos Base a Tablas</span>
    </Button>


  </div>
        </fieldset>

<Fieldset legend="Restaurar Backup SQL">
  <div class="p-4">
    <Button label="Actualizar lista" icon="pi pi-refresh" class="mb-3" @click="fnListarBackups" />

    <table class="w-full border text-sm">
      <thead class="bg-blue-600 text-white">
        <tr>
          <th class="p-2 text-left">Archivo</th>
          <th class="p-2 text-center">Acción</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="b in backupsDisponibles" :key="b.nombre">
          <td class="border p-2">{{ b.nombre }}</td>
          <td class="border p-2 text-center">
            <Button label="Restaurar" severity="danger" icon="pi pi-database" @click="fnRestaurarBackup(b)" />
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</Fieldset>

<Fieldset legend="Explorador SQLite Externo" class="mt-4">
  <div class="p-4">
    <div class="grid grid-cols-12 gap-4 items-end">
      <div class="col-span-12 md:col-span-4">
        <label class="block text-sm font-semibold mb-2">Archivo SQLite</label>
        <input
          type="file"
          accept=".db,.sqlite,.sqlite3,.db3"
          class="form-control"
          @change="fnCargarSqliteExterno"
        />
        <small class="text-gray-500" v-if="sqliteFileName">Archivo: {{ sqliteFileName }}</small>
      </div>

      <div class="col-span-12 md:col-span-3">
        <label class="block text-sm font-semibold mb-2">Tabla SQLite</label>
        <Dropdown
          v-model="sqliteTablaSeleccionada"
          :options="sqliteTablas"
          :disabled="sqliteTablas.length === 0"
          placeholder="Selecciona tabla"
          class="w-full"
          @change="fnSqlitePreview"
        />
      </div>

      <div class="col-span-12 md:col-span-3">
        <label class="block text-sm font-semibold mb-2">Tabla destino sistema</label>
        <Dropdown
          v-model="sqliteDestinoSeleccionado"
          :options="tablasLocal"
          :disabled="tablasLocal.length === 0"
          placeholder="Selecciona destino"
          class="w-full"
        />
      </div>

      <div class="col-span-12 md:col-span-2">
        <label class="block text-sm font-semibold mb-2">Limite preview</label>
        <InputText v-model="sqliteLimit" class="w-full" />
      </div>

      <div class="col-span-12 md:col-span-4">
        <label class="block text-sm font-semibold mb-2">Modo de envio</label>
        <SelectButton v-model="sqliteModoEnvio" :options="['ARRAY COMPLETO', 'LOTE', 'UNO A UNO']" :allowEmpty="false" />
      </div>

      <div class="col-span-12 md:col-span-2" v-if="sqliteModoEnvio === 'LOTE'">
        <label class="block text-sm font-semibold mb-2">Tamano lote</label>
        <InputText v-model="sqliteTamanoLote" class="w-full" />
      </div>

      <div class="col-span-12 flex flex-wrap gap-2">
        <Button
          label="Actualizar preview"
          icon="pi pi-refresh"
          severity="info"
          outlined
          :loading="sqliteLoading"
          :disabled="!sqliteTablaSeleccionada"
          @click="fnSqlitePreview"
        />
        <Button
          label="Importar al sistema"
          icon="pi pi-upload"
          severity="success"
          :loading="sqliteImportando"
          :disabled="!sqliteTablaSeleccionada || !sqliteDestinoSeleccionado"
          @click="fnImportarTablaSqliteASistema"
        />
      </div>
    </div>

    <div class="mt-4" v-if="sqlitePreviewRows.length > 0">
      <DataTable
        :value="sqlitePreviewRows"
        paginator
        :rows="10"
        :rowsPerPageOptions="[10, 20, 50, 100]"
        scrollable
        scrollHeight="420px"
        tableStyle="min-width: 60rem"
      >
        <Column
          v-for="col in sqlitePreviewColumns"
          :key="`sqlite-col-${col.field}`"
          :field="col.field"
          :header="col.header"
        />
      </DataTable>
    </div>

    <div class="mt-4 text-sm text-gray-600" v-else>
      Carga una base SQLite y selecciona una tabla para ver su contenido.
    </div>
  </div>
</Fieldset>

<div v-if="visibleCambioEmpresa" class="mt-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
  <div class="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
    <div>
      <h3 class="text-lg font-semibold text-slate-800">Empresas</h3>
      <p class="text-xs text-slate-500">Selecciona una empresa para cambiar o bloquear/desbloquear</p>
    </div>
    <div class="flex items-center gap-2">
      <Button label="Registrar empresa" icon="pi pi-plus" size="small" @click="fnRegistrarEmpresa" />
      <Button label="Cerrar" outlined size="small" severity="secondary" @click="visibleCambioEmpresa = false" />
    </div>
  </div>

  <div class="mb-4 rounded-xl border border-slate-200 bg-slate-50 p-3">
    <label for="busquedaEmpresaCtrlP" class="mb-2 block text-xs font-medium text-slate-600">Buscar empresa</label>
    <InputText
      id="busquedaEmpresaCtrlP"
      v-model="busquedaEmpresaCtrlP"
      type="text"
      class="w-full"
      placeholder="Escribe nombre o link"
    />
  </div>

  <div v-if="!empresasFiltradasCtrlP.length" class="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-700">
    No hay empresas que coincidan con la busqueda.
  </div>

  <div v-else class="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
    <div
      v-for="empresa in empresasFiltradasCtrlP"
      :key="empresa.id || empresa.nombre"
      class="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:border-sky-400 hover:shadow-md"
    >
      <button
        type="button"
        class="w-full text-left"
        @click="fnAccionEmpresaRapida(empresa, 'cambio')"
      >
        <div class="font-semibold text-slate-800">{{ empresa.nombre || 'Empresa sin nombre' }}</div>
        <div class="mt-1 text-xs text-slate-500 break-all">{{ empresa.link || 'Sin enlace' }}</div>
      </button>

      <div class="mt-3 flex justify-end gap-2">
        <Button
          label="QR Licencia"
          icon="pi pi-qrcode"
          outlined
          severity="help"
          size="small"
          @click="fnGenerarQRLicenciaEmpresa(empresa)"
        />
        <Button
          label="Editar"
          icon="pi pi-pencil"
          outlined
          severity="info"
          size="small"
          @click="fnEditarEmpresa(empresa)"
        />
        <Button
          label="Eliminar"
          icon="pi pi-trash"
          outlined
          severity="danger"
          size="small"
          @click="fnEliminarEmpresa(empresa)"
        />
        <Button
          label="Bloqueo / Desbloqueo"
          outlined
          severity="secondary"
          size="small"
          @click="fnAccionEmpresaRapida(empresa, 'bloqueo')"
        />
      </div>
    </div>
  </div>
</div>



      </div>

  
<div class="md:col-span-12" v-if="verTablas">
  <fieldset class="border p-3 rounded mb-2 shadow-sm">
    <legend class="float-none w-auto px-2 fs-5 fw-semibold">Tablas</legend>

    <!--  Campo de búsqueda -->
    <div class="flex justify-center mb-3">
      <InputText
        v-model="busquedaTabla"
        placeholder="Buscar tabla..."
        class="w-full md:w-1/2 p-inputtext-lg"
        style="text-align:center"
      />
    </div>

    <!-- Listado filtrado -->
    <div class="flex flex-wrap gap-3 justify-center">
      <Button
        v-for="(tabla, i) in tablasFiltradas"
        :key="i"
        :label="String(tabla).toUpperCase()"
        raised
        outlined
        :severity="colores[i % colores.length].severity"
        icon="pi pi-database"
        iconPos="top"
        class="p-button-lg font-semibold text-center"
        :style="{
          width: '140px',
          height: '140px',
          borderWidth: '2px',
          borderColor: colores[i % colores.length].color,
          color: colores[i % colores.length].color,
          fontSize: '13px',
        }"
        @click="fnDatostabla(String(tabla))"
      />

    </div>
  </fieldset>
</div>


<div class="md:col-span-12" v-if="verTablasVerificada">
  <fieldset class="border p-3 rounded mb-2">
    <legend class="float-none w-auto px-2">Verificación de Tablas</legend>
    <div class="grid grid-cols-12 gap-4">
      <div class="sm:col-span-12">
        <table class="table">
          <thead>
            <tr>
              <th>Tabla</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(tabla, index) in tablasVerificadas" :key="index">
              <td>{{ tabla.tabla }}</td>
              <td :class="{
                    'text-success': tabla.estado === 'Ambas',
                    'text-warning': tabla.estado === 'Demo',
                    'text-danger': tabla.estado === 'Local'
                  }">
                {{ tabla.estado === 'Ambas' ? 'Sincronizada' : (tabla.estado === 'Demo' ? 'Solo en Demo' : 'Solo en Local') }}
              </td>
              <td>
                <!-- Botón para agregar la tabla si no existe en Local -->
                <Button v-if="tabla.estado === 'Demo'"
                        label="Agregar Tabla"
                        icon="pi pi-plus"
                        class="p-button-success"
                        @click="fnAgregarTablaDesdeDemo(tabla.tabla)" />

                <!-- Botón para sincronizar campos si la tabla existe en ambas fuentes -->
                <Button v-if="tabla.estado === 'Ambas'"
                        label="Sincronizar Campos"
                        icon="pi pi-refresh"
                        class="p-button-warning"
                        @click="fnSincronizarCampos(tabla.tabla)" />


              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </fieldset>
</div>


 <!-- ////////////////////////////////////////////////////////////////////////////////////////// -->
<Drawer v-model:visible="inventario" position="bottom" header="Pase de Inventario" style="height: 30rem">
  <div class="p-4 space-y-4">
    <!-- Fila 1 -->
    <div class="grid grid-cols-12 gap-4">
      <div class="col-span-2">
        <label for="empresa1" class="font-semibold">Empresa Origen</label>
        <Dropdown id="empresa1" v-model="empresa1Inventario" @change="selectEmpresaOrigen" editable :options="empresasArray" optionLabel="nombre" placeholder="Empresa" class="w-full" />
      </div>
      <div class="col-span-7">
        <label for="link1" class="font-semiboldInventario">Link</label>
        <InputText id="link1" v-model="link1Inventario" placeholder="Ingrese link" class="w-full" />
      </div>
      <div class="col-span-3">
        <label for="tabla1" class="font-semibold">Tabla</label>
        <Dropdown id="tabla1" v-model="tabla1Inventario" editable @change="fnTablaOrigen" :options="tablasArray"  placeholder="Seleccione tabla" class="w-full" />
      </div>
    </div>

    <!-- Fila 2 -->
    <div class="grid grid-cols-12 gap-4">
      <div class="col-span-2">
        <label for="empresa2" class="font-semibold">Empresa Destino</label>
        <Dropdown id="empresa2" v-model="empresa2Inventario" @change="fnEmpresaOrigen" editable :options="empresasArray" optionLabel="nombre" placeholder="Empresa" class="w-full" />
      </div>
      <div class="col-span-7">
        <label for="link2" class="font-semibold">Link</label>
        <InputText id="link2" v-model="link2Inventario" placeholder="Ingrese link" class="w-full" />
      </div>
      <div class="col-span-3">
        <label for="tabla2" class="font-semibold">Tabla</label>
        <Dropdown id="tabla2" v-model="tabla2Inventario" editable :options="tablasArray"  placeholder="Seleccione tabla" class="w-full" />
      </div>
    </div>

    <!-- Botón de acción -->
    <div class="text-right">
      <Button label="Ejecutar Operación" icon="pi pi-check" class="p-button-success" @click="realizarOperacionInventario" />
    </div>
  </div>
</Drawer>

 <!-- ////////////////////////////////////////////////////////////////////////////////////////// -->
          <Sidebar v-model:visible="visibledatosTabla" :header="'ACCION TABLA ' + tablaSelected">

          <div class="grid grid-cols-12 gap-4">
            <div class="col-span-12">

              <Button label="Actualizar Campos" @click="visibleActualizarCampos = true" fluid class="w-100"   />
              <Button label="Eliminar Tabla" @click="fnEliminartabla" class="w-100 mt-2" fluid   />
              <Button label="Vaciar Tabla" @click="fnVaciartabla" class="w-100 mt-2" fluid   />
              <Button label="Reseteo de ID" @click="fnReseteoID" class="w-100 mt-2" fluid   />
              <Button label="Rellenar" @click="fnRellenar" class="w-100 mt-2" fluid   />
              <Button label="Backup" @click="fnBackup" class="w-100 mt-2" fluid   />

              <Button label="Ajustar Fecha" @click="fnAjustarFecha" fluid class="w-100 mt-2"   />

              <Button label="Buscar Duplicados" @click="fnBuscarDuplicados" fluid class="w-100 mt-2"   />
              <Button label="Agregar Almacen" @click="fnAgregarAlmacenAtabla" fluid class="w-100 mt-2"   />
              <Button label="Export SQL" @click="fnExportSQL" class="w-100 mt-2" fluid   />

              <Button label="Data" @click="fnData" class="w-100 mt-2"  fluid  />
              <Button :label="'\u00daltimo registro'" @click="fnUltimoRegistro" class="w-100 mt-2" fluid />

            </div>

             </div>
        </Sidebar>
 <!-- ////////////////////////////////////////////////////////////////////////////////////////// -->
           <Sidebar v-model:visible="visibleActualizarCampos" :header="'ACCION TABLA ' + tablaSelected" position="bottom" style="height: 50vh">

          <div class="grid grid-cols-12 gap-4">
            <div class="col-span-12">
            <textarea name="campos" id="campos" class="form-control" cols="30" rows="3" v-model="camposTablaSelected"></textarea>
            <Chips v-model="camposArray" separator=","  />
            </div>

            <div class="col-span-12">
                <Button label="Actualizar Campos" @click="fnActualizarCampos" class="" severity="info" raised />
            </div>


             </div>
        </Sidebar>

 <!-- ////////////////////////////////////////////////////////////////////////////////////////// -->
 <Sidebar
    v-model:visible="visibleDataTabla"
    :header="'ACCION TABLA ' + tablaSelected"
    position="bottom"
    style="height: 100vh"
  >
    <div class="p-6 bg-gray-50 rounded-t-xl shadow-inner min-h-[90vh]">

      <!-- Controles de navegacion -->
      <div class="flex flex-wrap items-center gap-3 mb-6">
        <Button
          icon="pi pi-fast-backward"
          label="Primero"
          class="bg-rose-500 hover:bg-rose-600 text-white px-4"
          @click="goToFirst"
        />
        <Button
          icon="pi pi-step-backward"
          class="bg-rose-400 hover:bg-rose-500 text-white h-10"
          @click="goToPrevious"
        />

        <InputText
          v-model="idData"
          type="text"
          placeholder="ID"
          class="w-24 text-center font-semibold border border-gray-300 rounded-md focus:ring-2 focus:ring-rose-400"
          @input="loadDataById(idData)"
        />

        <Button
          icon="pi pi-forward"
          class="bg-rose-400 hover:bg-rose-500 text-white h-10"
          @click="goToNext"
        />
        <Button
          icon="pi pi-step-forward"
          :label="'\u00daltimo'"
          class="bg-rose-500 hover:bg-rose-600 text-white px-4"
          @click="goToLast"
        />

        <Button
          icon="pi pi-trash"
          label="Borrar"
          class="bg-red-600 hover:bg-red-700 text-white ml-auto px-4"
          severity="danger"
          @click="fnBorrarDatos"
        />
      </div>

      <!-- Campos dinamicos -->
      <div class="grid grid-cols-12 gap-4">
        <div
          v-for="(value, key) in selectedData"
          :key="key"
          :class="[
            'col-span-12 flex flex-col space-y-1',
            (isJsonString(value) || isLongText(value))
              ? 'sm:col-span-12 lg:col-span-12'
              : 'sm:col-span-6 lg:col-span-4'
          ]"
        >
          <label
            :for="key"
            class="text-gray-700 font-semibold text-sm capitalize tracking-wide"
          >
            {{ String(key).replaceAll('_', ' ') }}
          </label>

          <!-- JSON: Textarea + DataTable -->
          <template v-if="isJsonString(value)">
            <Textarea
              v-model="selectedData[key]"
              :id="key + '-Actualizador'"
              rows="5"
              class="w-full rounded-md border border-gray-300 shadow-sm focus:ring-2 focus:ring-rose-400 focus:border-rose-400 resize-y"
            />

            <!-- Solo si el JSON parsea bien -->
            <div v-if="jsonIsValid(selectedData[key])" class="mt-2">
              <div class="text-xs text-gray-500 mb-2">
                Vista previa del JSON (tabla)
              </div>

              <DataTable
                :value="jsonRows(selectedData[key])"
                :scrollable="true"
                scrollHeight="240px"
                responsiveLayout="scroll"
                size="small"
                class="rounded-lg overflow-hidden"
              >
                <Column
                  v-for="col in jsonColumns(selectedData[key])"
                  :key="col.field"
                  :field="col.field"
                  :header="col.header"
                />
              </DataTable>
            </div>

            <div v-else class="mt-2 text-xs text-red-600">
              JSON inv&aacute;lido: revisa comillas, llaves o comas.
            </div>
          </template>

          <!-- Textarea para campos largos (no JSON) -->
          <Textarea
            v-else-if="isLongText(value)"
            v-model="selectedData[key]"
            :id="key + '-Actualizador'"
            rows="4"
            class="w-full rounded-md border border-gray-300 shadow-sm focus:ring-2 focus:ring-rose-400 focus:border-rose-400 resize-y"
          />

          <!-- Input normal -->
          <InputText
            v-else
            v-model="selectedData[key]"
            :id="key + '-Actualizador'"
            type="text"
            class="w-full rounded-md border border-gray-300 shadow-sm focus:ring-2 focus:ring-rose-400 focus:border-rose-400"
          />
        </div>
        <!-- Boton Actualizar -->
        <div class="col-span-12 mt-6 flex justify-end">
          <Button
            label="Actualizar Campos"
            icon="pi pi-save"
            @click="fnActualizarData"
            severity="info"
            raised
            class="px-6 py-2"
          />
        </div>
      </div>

    </div>
  </Sidebar>

 <!-- ////////////////////////////////////////////////////////////////////////////////////////// -->
 <Dialog v-model:visible="visibleAgregarTabla" modal :position="position" header="Editar Producto" :style="{ width: '50rem' }">
  <template #header>
    <div class="inline-flex align-items-center justify-content-center gap-2">
      <span class="font-bold white-space-nowrap">AGREGAR TABLA</span>
    </div>
  </template>

      <fieldset class="border p-3 rounded mb-2">
        <legend class="float-none w-auto px-2">AGREGAR TABLA</legend>
          <div class="grid grid-cols-12 gap-4">

           <div class="col-span-12 form-group">
            <label for="elegircliente">Tabla</label><br>
            <input type="text" v-model="nuevaTabla" id="nuevaTabla" class="form-control">
           </div>

           <div class="col-span-12 form-group">
            <label for="elegircliente">Campos</label><br>
            <textarea name="campos" id="camposD" class="form-control" cols="30" rows="3" v-model="camposTablaNueva"></textarea>
            <Chips v-model="camposArrayN" separator=","  />
           </div>


          </div>
      </fieldset>

  <template #footer>

    <Button label="Agregar" icon="pi pi-print" outlined severity="secondary" @click="fnAgregarTabla"  />
    <Button label="Cerrar" outlined severity="secondary" @click="visibleAgregarTabla = false" autofocus />

  </template>
</Dialog>
 <!-- ////////////////////////////////////////////////////////////////////////////////////////// -->
 <!-- ////////////////////////////////////////////////////////////////////////////////////////// -->
<Dialog v-model:visible="visibleImportarFactura" modal :style="{ width: '90rem', maxWidth: '95vw' }" header="Importar Facturas para Imprimir">
  <div class="grid grid-cols-12 gap-4">
    <div class="col-span-12 lg:col-span-5">
      <fieldset class="border p-3 rounded h-full">
        <legend class="float-none w-auto px-2">Pegar Objeto JSON</legend>
        <div class="flex flex-col gap-3">
          <div class="text-sm text-gray-600">
            Pega un objeto de factura o un objeto con `factura`, `cliente`, `creditoData` y `datosEmpresa`.
          </div>
          <Textarea
            v-model="facturaJsonInput"
            rows="18"
            class="w-full"
            placeholder='{"factura":{"no_factura":"2025102214EBM7"}}'
          />
          <div class="flex justify-end gap-2">
            <Button label="Procesar JSON" icon="pi pi-print" severity="info" @click="fnProcesarFacturaPegada" />
          </div>
        </div>
      </fieldset>
    </div>

    <div class="col-span-12 lg:col-span-7">
      <fieldset class="border p-3 rounded h-full">
        <legend class="float-none w-auto px-2">Cargar Excel</legend>
        <div class="grid grid-cols-12 gap-3 items-end mb-3">
          <div class="col-span-12 md:col-span-7">
            <label class="block text-sm font-semibold mb-2">Archivo Excel</label>
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              class="form-control"
              @change="fnCargarExcelFacturas"
            />
          </div>
          <div class="col-span-12 md:col-span-5 text-sm text-gray-600">
            <div><strong>Archivo:</strong> {{ excelFacturaArchivo || 'Sin cargar' }}</div>
            <div><strong>Filas:</strong> {{ excelFacturaRows.length }}</div>
          </div>
        </div>

        <div v-if="excelFacturaRows.length" class="mb-3">
          <div class="flex flex-wrap items-center justify-between gap-3 mb-2">
            <div class="text-sm text-gray-600">
              Si una fila tiene `no_factura`, se intentará completar la factura desde la base local.
            </div>
            <Button
              label="Imprimir Seleccionada"
              icon="pi pi-print"
              severity="success"
              @click="fnImprimirFacturaSeleccionadaExcel()"
              :disabled="!excelFacturaSeleccionada"
            />
          </div>

          <div class="mb-3">
            <InputText
              v-model="excelFacturaBusqueda"
              class="w-full"
              placeholder="Buscar en el Excel por factura, cliente, comprobante, token..."
            />
          </div>

          <DataTable
            v-model:selection="excelFacturaSeleccionada"
            :value="excelFacturaRowsFiltradas"
            selectionMode="single"
            dataKey="__rowId"
            paginator
            :rows="10"
            scrollable
            scrollHeight="420px"
            responsiveLayout="scroll"
            size="small"
            class="rounded-lg overflow-hidden"
          >
            <Column selectionMode="single" headerStyle="width: 3rem" />
            <Column
              v-for="col in excelFacturaColumns"
              :key="col.field"
              :field="col.field"
              :header="col.header"
            />
            <Column header="Accion" style="min-width: 9rem">
              <template #body="{ data }">
                <Button label="Imprimir" icon="pi pi-print" size="small" @click="fnImprimirFacturaSeleccionadaExcel(data)" />
              </template>
            </Column>
          </DataTable>
        </div>

        <div v-else class="text-sm text-gray-500 border rounded p-4 bg-gray-50">
          Carga un Excel con encabezados. Cada fila se mostrará en tabla para que elijas la factura a imprimir.
        </div>
      </fieldset>
    </div>
  </div>

  <template #footer>
    <Button label="Cerrar" outlined severity="secondary" @click="visibleImportarFactura = false" />
  </template>
</Dialog>
 <!-- ////////////////////////////////////////////////////////////////////////////////////////// -->
<Dialog v-model:visible="visibledatosEmpresa" position="top" modal :style="{ width: '50rem' }" header="Datos de Empresas">
  <template #header>
    <div class="inline-flex align-items-center justify-content-center gap-2">
      <span class="font-bold white-space-nowrap">Datos de Empresas</span>
    </div>
  </template>

  <fieldset class="border p-3 rounded mb-2">
    <legend class="float-none w-auto px-2">Empresa Principal</legend>
    <div class="grid grid-cols-12 gap-4">
      <div class="col-span-12">
        <div class="flex items-center justify-between gap-3 mb-2">
          <label>Seleccionar Empresa Principal</label>
          <Button
            label="Restaurar Default"
            icon="pi pi-refresh"
            size="small"
            severity="warning"
            outlined
            @click="restaurarEmpresaPrincipalDefault"
          />
        </div>
        <Select v-model="selectedEmpresa1" :options="empresasArray" optionLabel="nombre" class="w-full" @change="updateEmpresa1" />
      </div>
      <div class="col-span-6" v-for="(value, key) in empresa1" :key="key">
        <label :for="key">{{ key }}</label>
        <input type="text" :id="key" class="form-control" v-model="empresa1[key]" disabled />
      </div>
    </div>
  </fieldset>

  <fieldset class="border p-3 rounded mb-2">
    <legend class="float-none w-auto px-2">Empresa Secundaria</legend>
    <div class="grid grid-cols-12 gap-4">
      <div class="col-span-12">
        <label>Seleccionar Empresa Secundaria</label>
        <Select v-model="selectedEmpresa2" :options="empresasArray" optionLabel="nombre" class="w-full" @change="updateEmpresa2" />
      </div>
      <div class="col-span-6" v-for="(value, key) in empresa2" :key="key">
        <label :for="key">{{ key }}</label>
        <input type="text" :id="key" class="form-control" v-model="empresa2[key]" disabled />
      </div>
    </div>
  </fieldset>

  <template #footer>
    <Button label="Guardar Información" outlined severity="secondary" @click="guardarDatosEmpresa"  />
    <Button label="Cerrar" outlined severity="secondary" @click="visibledatosEmpresa = false"  />
  </template>
</Dialog>
 <!-- ////////////////////////////////////////////////////////////////////////////////////////// -->

<Dialog v-model:visible="visibleApiTest" modal :style="{ width: '90rem', maxWidth: '95vw' }" header="Probar API A La Nube DOM">
  <div class="p-4">
    <div class="mb-4">
      <h3 class="text-lg font-semibold mb-2">Prueba de API de Facturación Electrónica</h3>
      <p class="text-sm text-gray-600 mb-2">
        Edita el JSON a continuación para probar diferentes consultas a la API.
      </p>
    </div>

    <div class="mb-4">
      <label class="block text-sm font-medium mb-2">Consulta JSON:</label>
      <Textarea
        v-model="apiTestQuery"
        rows="20"
        class="w-full font-mono text-sm"
        placeholder="Escribe tu consulta JSON aquí..."
        style="resize: vertical;"
      />
    </div>

    <div class="mb-4">
      <Button
        label="Ejecutar Prueba"
        icon="pi pi-play"
        @click="fnProbarApiALaNube"
        :loading="apiTestLoading"
        class="p-button-success"
      />
    </div>

    <div v-if="apiTestResult" class="mt-4">
      <h4 class="text-md font-semibold mb-2">Resultado:</h4>
      <pre class="bg-gray-100 p-4 rounded overflow-auto max-h-96 text-sm">{{ apiTestResult }}</pre>
    </div>
  </div>

  <template #footer>
    <Button label="Cerrar" outlined severity="secondary" @click="visibleApiTest = false" />
  </template>
</Dialog>
 <!-- ////////////////////////////////////////////////////////////////////////////////////////// -->

<Toast />

  <FacturaPdfPrint ref="facturaPdfPrintRef" />

  <LoadingOverlay :visible="loading" />

  </div>
  </div>
</main>
</template>
<style scoped>

</style>
