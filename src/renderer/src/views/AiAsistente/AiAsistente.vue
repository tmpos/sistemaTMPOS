<script setup>
import { computed, onMounted, ref } from 'vue';
import axios from 'axios';
import Button from 'primevue/button';
import Card from 'primevue/card';
import Dialog from 'primevue/dialog';
import ProgressSpinner from 'primevue/progressspinner';
import Tag from 'primevue/tag';
import { useToast } from 'primevue/usetoast';
import { useRouter } from 'vue-router';
import {
  arrayToObjetoFromTablaOffline,
  generarCodigoUnico,
  generadorCodigo,
  mensajetoast,
  nfecha,
  peticionesFetchOffline
} from '@/funciones/funciones.js';
import { useDatosEmpresa } from '@/stores';

const router = useRouter();
const toast = useToast();
const datosEmpresa = useDatosEmpresa();

const loading = ref(false);
const grabandoVoz = ref(false);
const vozDisponible = ref(false);
const reconocimientoVoz = ref(null);
const modoEscuchaActivo = ref(false);
const transcripcionVozFinal = ref('');
const transcripcionVozParcial = ref('');
const promptUsuario = ref('');
const resultadoIA = ref(null);
const ultimoRegistro = ref(null);
const datosConfiguracion = ref({});
const clientes = ref([]);
const productos = ref([]);
const esquemasTablas = ref({});
const ejemplosTablas = ref({});
const modalClienteNoEncontrado = ref(false);
const clientePendiente = ref(null);
const respuestaIAPendiente = ref(null);

const ejemplosPrompt = [
  'Crea un cliente llamado Maria Lopez, telefono 8095550101, whatsapp 8095550101 y direccion en Santiago.',
  'Crea un producto Samsung A55 color azul con precio de venta 19500, costo 15000 y stock 3.',
  'Haz una cotizacion para Juan Perez con 2 Samsung A55 a 24000 cada uno.',
  'Crea una factura borrador para Ana Gomez con 1 cargador USB-C a 950.'
];

const datosEmpresaNombre = computed(() => datosEmpresa?.empresa?.nombre || 'PRINCIPAL');
const usuarioNombre = computed(() => datosEmpresa?.usuario?.nombre || 'IA');
const usuarioEmail = computed(() => datosEmpresa?.usuario?.email || 'ia@local');

const extraerJsonDesdeTexto = (texto) => {
  let limpio = String(texto || '').trim();

  if (limpio.startsWith('```')) {
    limpio = limpio.replace(/^```(?:json)?/i, '').replace(/```$/i, '').trim();
  }

  try {
    return JSON.parse(limpio);
  } catch (error) {
    const matchObjeto = limpio.match(/\{[\s\S]*\}/);
    if (matchObjeto?.[0]) {
      return JSON.parse(matchObjeto[0]);
    }
    throw error;
  }
};

const aNumero = (valor, fallback = 0) => {
  const texto = String(valor ?? '').trim();
  if (texto === '') return fallback;

  const limpio = texto
    .replace(/[^0-9.,-]/g, '')
    .replace(/,/g, '');
  if (limpio === '' || limpio === '-' || limpio === '.' || limpio === '-.') return fallback;

  const numero = Number(limpio);
  return Number.isFinite(numero) ? numero : fallback;
};

const formatoMonto = (valor) => aNumero(valor, 0).toFixed(2);
const tieneValor = (valor) => !(valor === null || valor === undefined || String(valor).trim() === '');

const textoPlano = (valor) => String(valor || '').trim();

const normalizarTexto = (valor) =>
  textoPlano(valor)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .toUpperCase();

const tokenizarTexto = (valor) =>
  normalizarTexto(valor)
    .split(' ')
    .map((token) => token.trim())
    .filter((token) => token.length > 1);

const puntuarCoincidencia = (textoBusqueda, candidatos = []) => {
  const busquedaNormalizada = normalizarTexto(textoBusqueda);
  const tokensBusqueda = tokenizarTexto(textoBusqueda);
  let puntaje = 0;

  for (const candidato of candidatos) {
    const candidatoNormalizado = normalizarTexto(candidato);
    if (!candidatoNormalizado) continue;

    if (candidatoNormalizado === busquedaNormalizada) {
      puntaje += 120;
    } else if (candidatoNormalizado.includes(busquedaNormalizada) && busquedaNormalizada) {
      puntaje += 80;
    } else if (busquedaNormalizada.includes(candidatoNormalizado) && candidatoNormalizado.length > 3) {
      puntaje += 50;
    }

    const tokensCandidato = tokenizarTexto(candidato);
    for (const token of tokensBusqueda) {
      if (tokensCandidato.includes(token)) {
        puntaje += 15;
      } else if (candidatoNormalizado.includes(token)) {
        puntaje += 8;
      }
    }
  }

  return puntaje;
};

const buscarMejorCoincidencia = (coleccion = [], textoBusqueda, extractorCampos, puntajeMinimo = 20) => {
  if (!textoPlano(textoBusqueda)) return null;

  let mejor = null;
  let mejorPuntaje = 0;

  for (const item of coleccion) {
    const campos = extractorCampos(item).filter(Boolean);
    const puntaje = puntuarCoincidencia(textoBusqueda, campos);
    if (puntaje > mejorPuntaje) {
      mejor = item;
      mejorPuntaje = puntaje;
    }
  }

  return mejorPuntaje >= puntajeMinimo ? { item: mejor, puntaje: mejorPuntaje } : null;
};

const obtenerApiKey = () => datosConfiguracion.value?.openai_api_key || '';

const inicializarReconocimientoVoz = () => {
  const SpeechRecognition =
    typeof window !== 'undefined'
      ? window.SpeechRecognition || window.webkitSpeechRecognition
      : null;

  if (!SpeechRecognition) {
    vozDisponible.value = false;
    return;
  }

  const recognition = new SpeechRecognition();
  recognition.lang = 'es-DO';
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.maxAlternatives = 1;

  recognition.onstart = () => {
    grabandoVoz.value = true;
    transcripcionVozFinal.value = textoPlano(promptUsuario.value);
    transcripcionVozParcial.value = '';
  };

  recognition.onresult = (event) => {
    let transcripcionFinal = '';
    let transcripcionParcial = '';

    for (let i = event.resultIndex; i < event.results.length; i += 1) {
      const texto = event.results[i][0]?.transcript || '';
      if (event.results[i].isFinal) {
        transcripcionFinal += `${texto} `;
      } else {
        transcripcionParcial += `${texto} `;
      }
    }

    if (textoPlano(transcripcionFinal)) {
      transcripcionVozFinal.value = textoPlano(
        `${transcripcionVozFinal.value} ${transcripcionFinal}`
      );
    }

    transcripcionVozParcial.value = textoPlano(transcripcionParcial);
    promptUsuario.value = textoPlano(
      `${transcripcionVozFinal.value} ${transcripcionVozParcial.value}`
    );
  };

  recognition.onerror = (event) => {
    grabandoVoz.value = false;
    modoEscuchaActivo.value = false;
    mensajetoast(
      toast,
      'Voz',
      `No se pudo transcribir el audio${event?.error ? `: ${event.error}` : '.'}`,
      'warn',
      4000
    );
  };

  recognition.onend = () => {
    grabandoVoz.value = false;
    promptUsuario.value = textoPlano(transcripcionVozFinal.value || promptUsuario.value);
    transcripcionVozParcial.value = '';
    if (modoEscuchaActivo.value) {
      window.setTimeout(() => {
        try {
          reconocimientoVoz.value?.start();
        } catch (error) {
          modoEscuchaActivo.value = false;
          console.error('Error reiniciando reconocimiento de voz:', error);
        }
      }, 150);
    }
  };

  reconocimientoVoz.value = recognition;
  vozDisponible.value = true;
};

const alternarMicrofono = () => {
  if (!vozDisponible.value || !reconocimientoVoz.value) {
    mensajetoast(
      toast,
      'Voz no disponible',
      'Este equipo no soporta reconocimiento de voz desde el navegador.',
      'warn',
      4000
    );
    return;
  }

  try {
    if (grabandoVoz.value) {
      modoEscuchaActivo.value = false;
      reconocimientoVoz.value.stop();
      return;
    }

    modoEscuchaActivo.value = true;
    reconocimientoVoz.value.start();
  } catch (error) {
    modoEscuchaActivo.value = false;
    console.error('Error iniciando reconocimiento de voz:', error);
    mensajetoast(toast, 'Error', 'No se pudo iniciar el microfono.', 'error', 4000);
  }
};

const tablasAsistente = ['clientes', 'productos', 'cotizacion', 'facturas'];

const limpiarCamposTabla = (campos) => {
  if (!Array.isArray(campos)) return [];
  return campos
    .map((campo) => textoPlano(campo))
    .filter((campo) => campo !== '');
};

const cargarEsquemasTablas = async () => {
  const entries = await Promise.all(
    tablasAsistente.map(async (tabla) => {
      const campos = await peticionesFetchOffline('getTableColumns', tabla);
      return [tabla, limpiarCamposTabla(campos)];
    })
  );

  esquemasTablas.value = Object.fromEntries(entries);
};

const construirCatalogoClientesIA = (limite = 200) =>
  clientes.value.slice(0, limite).map((cliente) => ({
    codigo: textoPlano(cliente.codigo),
    nombre: textoPlano(cliente.nombre),
    apodo: textoPlano(cliente.apodo),
    telefono: textoPlano(cliente.telefono)
  }));

const construirCatalogoProductosIA = (limite = 300) =>
  productos.value.slice(0, limite).map((producto) => ({
    codigo: textoPlano(producto.codigo),
    codigo_barra: textoPlano(producto.codigo_barra),
    nombre: textoPlano(producto.nombre),
    descripcion: textoPlano(producto.descripcion),
    categoria: textoPlano(producto.categoria),
    marca: textoPlano(producto.marca),
    precio_venta: formatoMonto(producto.precio_venta || 0)
  }));

const construirEjemploManual = (tabla, campos = []) => {
  const ejemploBase = campos.reduce((acc, campo) => {
    acc[campo] = '';
    return acc;
  }, {});

  if (tabla === 'cotizacion') {
    return {
      ...ejemploBase,
      no_cotizacion: '0000123',
      cod_cliente: 'CLI-001',
      nombre_cliente: 'JUAN PEREZ',
      telefono_cliente: '809-555-0101',
      whatsapp_cliente: '809-555-0101',
      email_cliente: 'juanperez@email.com',
      direccion_cliente: 'SANTIAGO',
      rnc_cliente: '00112345678',
      nombre_comercial: 'JP TECH',
      productos:
        '[{"codigo":"PROD-001","descripcion":"IPHONE 13 128GB","cantidad":2,"precio_venta":24000,"total":48000}]',
      vendedor: 'MOSTRADOR',
      metodo_pago: 'TRANSFERENCIA',
      fecha_emision: '13/03/2026',
      impuesto: '0.00',
      descuento: '0.00',
      subtotal: '48000.00',
      total: '48000.00',
      estado_cotizacion: 'ACTIVA',
      no_factura: '',
      fecha_cambio: '',
      entidad_financiera: '',
      vencimiento: '20/03/2026',
      nota: 'COTIZACION GENERADA POR IA',
      mes: '03',
      year: '2026',
      hora: '10:30:00',
      usuario: usuarioNombre.value,
      almacen: datosEmpresaNombre.value
    };
  }

  if (tabla === 'facturas') {
    return {
      ...ejemploBase,
      id: '1',
      delivery: '',
      garantia: '',
      direccion_cliente: '',
      cheque: '0',
      expiracion: '',
      token: '2026030518OGVA',
      cajero: 'Soporte',
      no_factura: '20260305198WS2',
      tipo_factura: 'SIN COMPROBANTE',
      comprobante: 'SIN COMPROBANTE',
      cod_cliente: '0000000',
      nombre_cliente: 'AL CONTADO',
      telefono_cliente: '+1(000) 000-0000',
      productos:
        '[{"id":9,"codigo":"2026030419KEHX","nombre":"IPHONE 6 (2014) - 64GB (354618330051401)","categoria":"CELULARES","cantidad":1,"precio":2500,"precio_venta":2500,"descuento":0,"impuesto_venta":0,"impuestos":0,"precio_final":2500,"no_compra":"","costo":1500,"total":2500,"impuesto":0,"ganancia":2500,"ganancia_pura":2500,"imei":"354618330051401"}]',
      vendedor: 'Soporte',
      metodo_pago: 'EFECTIVO',
      tarjeta: '0',
      transferencia: '0',
      efectivo: '2500.00',
      canal_venta: 'TMPOS SRL',
      fecha_emision: '05/03/2026',
      impuesto: '0.00',
      descuento: '0.00',
      subtotal: '950.00',
      total: '2500.00',
      ganancia: '1000.00',
      financiera: 'Ninguna',
      estado_factura: 'Cobrado',
      fecha_estado: '05/03/2026',
      mes: '03',
      year: '2026',
      hora: '7:09:51 pm',
      otro:
        '[{"delivery":"No Registrado","mesero":"No Registrado","mesa":"No Registrado","vendedor":"Soporte","instalador":"No Registrado","pagocon":"2500.00","sucambio":0,"cajero":"Soporte","noCheque":"","bancoCheque":"","token":"2026030518OGVA"}]',
      nota: 'Ejemplo de factura del sistema',
      usuario: 'Soporte',
      updated_at: '2026-03-05 19:09:51',
      created_at: '2026-03-05 18:24:55',
      identificadordb: '',
      almacen: 'TMPOS SRL',
      total_institucion: '0',
      total_cliente: '0'
    };
  }

  return {};
};

const cargarEjemplosTablas = async () => {
  ejemplosTablas.value = {
    cotizacion: construirEjemploManual('cotizacion', esquemasTablas.value.cotizacion || []),
    facturas: construirEjemploManual('facturas', esquemasTablas.value.facturas || [])
  };
};

const construirPlantillasTablasParaIA = () => {
  const resumen = tablasAsistente.map((tabla) => {
    const campos = esquemasTablas.value[tabla] || [];
    const plantilla = campos.reduce((acc, campo) => {
      acc[campo] = '';
      return acc;
    }, {});

    if (tabla === 'cotizacion' || tabla === 'facturas') {
      plantilla.items = [
        {
          codigo: '',
          descripcion: '',
          cantidad: '',
          precio: '',
          impuesto: '',
          descuento: ''
        }
      ];
    }

    return {
      tabla,
      campos,
      plantilla,
      ejemplo: tabla === 'cotizacion' || tabla === 'facturas' ? ejemplosTablas.value[tabla] || {} : undefined
    };
  });

  return JSON.stringify(resumen, null, 2);
};

const cargarDatosBase = async () => {
  datosConfiguracion.value = (await peticionesFetchOffline('getDataByField', 'tabladefault', 'id', '1') || '{}');
  clientes.value = (await peticionesFetchOffline('getDataAsArray', 'clientes')) || [];
  productos.value = (await peticionesFetchOffline('getDataAsArray', 'productos')) || [];
  await cargarEsquemasTablas();
  await cargarEjemplosTablas();
};

const siguienteSecuencia = async (tabla, campo, cantidadCeros = 7) => {
  const registros = (await peticionesFetchOffline('getDataAsArray', tabla)) || [];
  if (!Array.isArray(registros) || !registros.length) {
    return generadorCodigo([], '', cantidadCeros);
  }

  const ultimo = [...registros]
    .filter((item) => textoPlano(item?.[campo]) !== '')
    .sort((a, b) => aNumero(a?.[campo]) - aNumero(b?.[campo]))
    .at(-1);

  return generadorCodigo(ultimo?.[campo] || [], '', cantidadCeros);
};

const buscarCliente = (busqueda) => {
  return (
    buscarMejorCoincidencia(clientes.value, busqueda, (cliente) => [
      cliente.codigo,
      cliente.nombre,
      cliente.apodo,
      cliente.telefono,
      cliente.cedula,
      cliente.rnc
    ], 30)?.item ||
    null
  );
};

const extraerMarcaProbable = (texto) => {
  const tokens = tokenizarTexto(texto);
  return tokens[0] || '';
};

const buscarProducto = (busqueda) => {
  const resultado = buscarMejorCoincidencia(productos.value, busqueda, (producto) => [
      producto.codigo,
      producto.codigo_barra,
      producto.nombre,
      producto.descripcion,
      producto.marca,
      producto.modelo,
      producto.categoria
    ], 45);

  if (!resultado?.item) return null;

  const marcaBuscada = extraerMarcaProbable(busqueda);
  const marcaProducto = normalizarTexto(resultado.item.marca);

  if (marcaBuscada && marcaProducto && marcaBuscada !== marcaProducto && !marcaProducto.includes(marcaBuscada)) {
    return null;
  }

  return resultado;
};

const crearClienteProvisional = async (nombre, overrides = {}) => {
  const base = await arrayToObjetoFromTablaOffline('clientes');
  const codigo = overrides.codigo || generarCodigoUnico();

  const cliente = {
    ...base,
    codigo,
    nombre: textoPlano(nombre) || 'CLIENTE IA',
    apodo: textoPlano(overrides.apodo || nombre) || 'CLIENTE IA',
    cedula: textoPlano(overrides.cedula || codigo),
    rnc: textoPlano(overrides.rnc || codigo),
    telefono: textoPlano(overrides.telefono || ''),
    whatsapp: textoPlano(overrides.whatsapp || overrides.telefono || ''),
    email: textoPlano(overrides.email || ''),
    direccion: textoPlano(overrides.direccion || 'SIN REGISTRO'),
    activo: 'ON',
    estado: textoPlano(overrides.estado || 'ACTIVO'),
    estado_membresia: textoPlano(overrides.estado_membresia || 'ACTIVO'),
    genero: textoPlano(overrides.genero || 'HOMBRE'),
    estado_civil: textoPlano(overrides.estado_civil || 'SOLTERO'),
    precio_fijado: textoPlano(overrides.precio_fijado || 'Normal'),
    limite_credito: textoPlano(overrides.limite_credito || '1'),
    almacen: datosEmpresaNombre.value,
    created_at: nfecha('timestamp'),
    updated_at: nfecha('timestamp'),
    usuario: usuarioNombre.value
  };

  const respuesta = await peticionesFetchOffline('insertData', 'clientes', JSON.stringify(cliente));
  if (respuesta?.[0] !== 'ok') {
    throw new Error('No se pudo crear el cliente provisional');
  }

  clientes.value.push(cliente);
  return cliente;
};

const construirItems = (itemsIA = []) => {
  return (Array.isArray(itemsIA) ? itemsIA : []).map((item, index) => {
    const textoProducto =
      item.codigo ||
      item.producto ||
      item.descripcion ||
      item.nombre ||
      item.detalle ||
      item.referencia ||
      '';
    const coincidenciaProducto = buscarProducto(textoProducto);
    const referencia = coincidenciaProducto?.item || null;
    const cantidad = aNumero(item.cantidad, 1) || 1;
    const precioItemIA = aNumero(item.precio_venta ?? item.precio, 0);
    const precioReferencia = referencia ? aNumero(referencia.precio_venta, precioItemIA) : 0;
    const precioVenta = precioReferencia > 0 ? precioReferencia : precioItemIA;
    const costo = referencia ? aNumero(referencia.precio_compra, 0) : aNumero(item.costo, 0);
    const subtotalLinea = cantidad * precioVenta;
    const descuentoLinea = aNumero(item.descuento, 0);
    const impuestoDirecto = aNumero(item.impuesto, 0) || aNumero(item.impuesto_venta, 0);
    const impuestoPorPorcentaje =
      impuestoDirecto > 0
        ? impuestoDirecto
        : aNumero(item.impuestos, 0) > 0 && aNumero(item.impuestos, 0) <= 100
          ? (subtotalLinea - descuentoLinea) * (aNumero(item.impuestos, 0) / 100)
          : 0;
    const impuestoLinea = impuestoPorPorcentaje;
    const total = subtotalLinea - descuentoLinea + impuestoLinea;
    const descripcion =
      textoPlano(item.descripcion) ||
      textoPlano(item.nombre) ||
      textoPlano(item.producto) ||
      textoPlano(referencia?.nombre) ||
      textoPlano(referencia?.descripcion) ||
      `ITEM ${index + 1}`;

    return {
      codigo: textoPlano(referencia?.codigo || item.codigo || generarCodigoUnico()),
      codigo_barra: textoPlano(referencia?.codigo_barra || item.codigo || ''),
      descripcion,
      nombre: descripcion,
      cantidad,
      precio: precioVenta,
      precio_venta: precioVenta,
      descuento: descuentoLinea,
      impuesto_venta: impuestoLinea,
      impuestos: aNumero(referencia?.impuestos ?? item.impuestos, 0),
      precio_final: precioVenta,
      no_compra: textoPlano(referencia?.no_compra || ''),
      precio_compra: costo,
      costo,
      porcentaje: aNumero(referencia?.porcentaje, 0),
      precio_real: precioVenta,
      total,
      impuesto: impuestoLinea,
      ganancia: total - cantidad * costo,
      ganancia_pura: total - cantidad * costo,
      imei: textoPlano(item.imei || '')
    };
  });
};

const calcularTotales = (items = []) => {
  const subtotal = items.reduce(
    (acc, item) => acc + aNumero(item.precio_venta) * aNumero(item.cantidad, 1),
    0
  );
  const descuento = items.reduce((acc, item) => acc + aNumero(item.descuento, 0), 0);
  const impuesto = items.reduce(
    (acc, item) =>
      acc +
      (aNumero(item.impuesto, 0) || aNumero(item.impuesto_venta, 0)),
    0
  );
  const total = subtotal - descuento + impuesto;
  const ganancia = items.reduce((acc, item) => acc + aNumero(item.ganancia, 0), 0);

  return { subtotal, descuento, impuesto, total, ganancia };
};

const validarTotalesDocumento = (items = [], totales = {}) => {
  if (!items.length) {
    throw new Error('La IA no devolvio items validos para calcular el documento.');
  }

  if (aNumero(totales.subtotal, 0) <= 0) {
    throw new Error('No se pudo calcular el subtotal del documento.');
  }

  if (aNumero(totales.total, 0) <= 0) {
    throw new Error('No se pudo calcular el total del documento.');
  }
};

const aplicarPayloadATabla = async (tabla, payload = {}) => {
  const base = await arrayToObjetoFromTablaOffline(tabla);
  const camposValidos = new Set(Object.keys(base || {}));

  Object.entries(payload || {}).forEach(([campo, valor]) => {
    if (campo === 'items') return;
    if (camposValidos.has(campo)) {
      base[campo] = valor ?? '';
    }
  });

  return base;
};

const crearRegistroCliente = async (payload) => {
  const cliente = {
    ...(await aplicarPayloadATabla('clientes', payload)),
    codigo: textoPlano(payload.codigo || generarCodigoUnico()),
    nombre: textoPlano(payload.nombre || payload.cliente || 'CLIENTE IA'),
    apodo: textoPlano(payload.apodo || payload.nombre || 'CLIENTE IA'),
    cedula: textoPlano(payload.cedula || payload.codigo || generarCodigoUnico()),
    rnc: textoPlano(payload.rnc || payload.cedula || ''),
    telefono: textoPlano(payload.telefono || ''),
    whatsapp: textoPlano(payload.whatsapp || payload.telefono || ''),
    email: textoPlano(payload.email || ''),
    direccion: textoPlano(payload.direccion || ''),
    genero: textoPlano(payload.genero || 'HOMBRE'),
    estado_civil: textoPlano(payload.estado_civil || 'SOLTERO'),
    precio_fijado: textoPlano(payload.precio_fijado || 'Normal'),
    limite_credito: textoPlano(payload.limite_credito || '1'),
    activo: 'ON',
    estado: textoPlano(payload.estado || 'ACTIVO'),
    estado_membresia: textoPlano(payload.estado_membresia || 'ACTIVO'),
    almacen: datosEmpresaNombre.value,
    created_at: nfecha('timestamp'),
    updated_at: nfecha('timestamp'),
    usuario: usuarioNombre.value
  };

  return {
    tabla: 'clientes',
    ruta: '/clientes',
    registro: cliente
  };
};

const crearRegistroProducto = async (payload) => {
  const codigo = textoPlano(payload.codigo || generarCodigoUnico());
  const descripcion = textoPlano(payload.descripcion || payload.nombre || payload.modelo || 'PRODUCTO IA');
  const marca = textoPlano(payload.marca || payload.proveedor || 'SIN REGISTRO').toUpperCase();
  const precioCompra = aNumero(payload.precio_compra, 0);
  const precioVenta = aNumero(payload.precio_venta, 0);

  const producto = {
    ...(await aplicarPayloadATabla('productos', payload)),
    codigo,
    codigo_barra: textoPlano(payload.codigo_barra || codigo),
    nombre: descripcion,
    descripcion,
    categoria: textoPlano(payload.categoria || 'GENERAL').toUpperCase(),
    proveedor: textoPlano(payload.proveedor || marca || 'SIN REGISTRO').toUpperCase(),
    marca,
    modelo: textoPlano(payload.modelo || descripcion),
    stock: String(aNumero(payload.stock, 0)),
    alerta: String(aNumero(payload.alerta, 1)),
    precio_compra: formatoMonto(precioCompra),
    precio_venta: formatoMonto(precioVenta),
    precio_min: formatoMonto(payload.precio_min ?? precioVenta),
    precio_xmayor: formatoMonto(payload.precio_xmayor ?? precioVenta),
    impuestos: formatoMonto(payload.impuestos ?? 0),
    impuesto_venta: formatoMonto(payload.impuesto_venta ?? 0),
    precio_final: formatoMonto(payload.precio_final ?? precioVenta),
    ganancia: formatoMonto(payload.ganancia ?? precioVenta - precioCompra),
    condicion: textoPlano(payload.condicion || 'NUEVO').toUpperCase(),
    situacion: textoPlano(payload.situacion || 'DISPONIBLE').toUpperCase(),
    t_garantia: textoPlano(payload.t_garantia || '30'),
    empaque: textoPlano(payload.empaque || 'UNIDAD'),
    imagen: textoPlano(payload.imagen || codigo),
    almacen: datosEmpresaNombre.value,
    created_at: nfecha('timestamp'),
    updated_at: nfecha('timestamp'),
    usuario: usuarioNombre.value
  };

  return {
    tabla: 'productos',
    ruta: '/productos',
    registro: producto
  };
};

const resolverClienteDocumento = async (payload) => {
  const nombreCliente =
    payload.nombre_cliente || payload.cliente || payload.client_name || payload.nombre || '';

  let cliente = buscarCliente(payload.cod_cliente || nombreCliente);
  const datosClientePendiente = !cliente && textoPlano(nombreCliente)
    ? {
        nombre: nombreCliente,
        telefono: payload.telefono_cliente || payload.telefono || '',
        whatsapp: payload.whatsapp_cliente || payload.whatsapp || payload.telefono || '',
        email: payload.email_cliente || payload.email || '',
        direccion: payload.direccion_cliente || payload.direccion || '',
        cedula: payload.rnc_cliente || payload.cedula || '',
        cod_cliente: payload.cod_cliente || ''
      }
    : null;

  return {
    cliente,
    datosClientePendiente
  };
};

const crearRegistroCotizacion = async (payload) => {
  const cliente = payload.__clienteResuelto || null;
  const items = construirItems(payload.items || payload.productos || []);
  const totales = calcularTotales(items);
  validarTotalesDocumento(items, totales);
  const noCotizacion = textoPlano(payload.no_cotizacion || (await siguienteSecuencia('cotizacion', 'no_cotizacion')));

  const cotizacion = {
    ...(await aplicarPayloadATabla('cotizacion', payload)),
    no_cotizacion: noCotizacion,
    cod_cliente: textoPlano(cliente?.codigo || payload.cod_cliente || generarCodigoUnico()),
    nombre_cliente: textoPlano(cliente?.nombre || payload.nombre_cliente || payload.cliente || 'CLIENTE IA'),
    telefono_cliente: textoPlano(cliente?.telefono || payload.telefono_cliente || ''),
    whatsapp_cliente: textoPlano(cliente?.whatsapp || payload.whatsapp_cliente || ''),
    email_cliente: textoPlano(cliente?.email || payload.email_cliente || ''),
    direccion_cliente: textoPlano(cliente?.direccion || payload.direccion_cliente || ''),
    rnc_cliente: textoPlano(cliente?.rnc || payload.rnc_cliente || ''),
    nombre_comercial: textoPlano(payload.nombre_comercial || cliente?.nombre || ''),
    productos: JSON.stringify(items),
    vendedor: textoPlano(payload.vendedor || usuarioNombre.value),
    metodo_pago: textoPlano(payload.metodo_pago || 'POR DEFINIR'),
    fecha_emision: textoPlano(payload.fecha_emision || nfecha('fecha')),
    impuesto: formatoMonto(totales.impuesto),
    descuento: formatoMonto(totales.descuento),
    subtotal: formatoMonto(totales.subtotal),
    total: formatoMonto(totales.total),
    estado_cotizacion: textoPlano(payload.estado_cotizacion || 'ACTIVA'),
    no_factura: textoPlano(payload.no_factura || ''),
    fecha_cambio: textoPlano(payload.fecha_cambio || ''),
    entidad_financiera: textoPlano(payload.entidad_financiera || ''),
    vencimiento: textoPlano(payload.vencimiento || ''),
    nota: textoPlano(payload.nota || 'CREADA POR IA'),
    almacen: datosEmpresaNombre.value,
    mes: nfecha('mes'),
    year: nfecha('year'),
    hora: nfecha('hora'),
    created_at: nfecha('timestamp'),
    updated_at: nfecha('timestamp'),
    usuario: usuarioNombre.value
  };

  return {
    tabla: 'cotizacion',
    ruta: '/cotizacion',
    registro: cotizacion
  };
};

const crearRegistroFactura = async (payload) => {
  const cliente = payload.__clienteResuelto || null;
  const items = construirItems(payload.items || payload.productos || []);
  const totales = calcularTotales(items);
  validarTotalesDocumento(items, totales);
  const noFactura = textoPlano(payload.no_factura || (await siguienteSecuencia('facturas', 'no_factura')));

  const factura = {
    ...(await aplicarPayloadATabla('facturas', payload)),
    no_factura: noFactura,
    tipo_factura: textoPlano(payload.tipo_factura || 'BORRADOR IA'),
    comprobante: textoPlano(payload.comprobante || 'SIN COMPROBANTE'),
    cod_cliente: textoPlano(cliente?.codigo || payload.cod_cliente || generarCodigoUnico()),
    nombre_cliente: textoPlano(cliente?.nombre || payload.nombre_cliente || payload.cliente || 'CLIENTE IA'),
    telefono_cliente: textoPlano(cliente?.telefono || payload.telefono_cliente || ''),
    productos: JSON.stringify(items),
    vendedor: textoPlano(payload.vendedor || usuarioNombre.value),
    metodo_pago: textoPlano(payload.metodo_pago || 'POR DEFINIR'),
    fecha_emision: textoPlano(payload.fecha_emision || nfecha('fecha')),
    impuesto: formatoMonto(totales.impuesto),
    descuento: formatoMonto(totales.descuento),
    subtotal: formatoMonto(totales.subtotal),
    total: formatoMonto(totales.total),
    total_institucion: formatoMonto(payload.total_institucion ?? 0),
    total_cliente: formatoMonto(totales.total),
    ganancia: formatoMonto(payload.ganancia ?? totales.ganancia),
    estado_factura: textoPlano(payload.estado_factura || 'BORRADOR IA'),
    efectivo: formatoMonto(payload.efectivo ?? 0),
    canal_venta: textoPlano(payload.canal_venta || 'ASISTENTE IA'),
    transferencia: formatoMonto(payload.transferencia ?? 0),
    tarjeta: formatoMonto(payload.tarjeta ?? 0),
    cheque: formatoMonto(payload.cheque ?? 0),
    fecha_estado: nfecha('fecha'),
    financiera: textoPlano(payload.financiera || payload.entidad_financiera || ''),
    nota: textoPlano(payload.nota || 'FACTURA BORRADOR CREADA POR IA'),
    almacen: datosEmpresaNombre.value,
    otro: JSON.stringify([
      {
        delivery: '',
        mesero: '',
        mesa: '',
        vendedor: usuarioNombre.value,
        instalador: '',
        pagocon: '',
        sucambio: '',
        cajero: usuarioEmail.value,
        noCheque: '',
        bancoCheque: '',
        token: ''
      }
    ]),
    mes: nfecha('mes'),
    cajero: usuarioEmail.value,
    token: '',
    year: nfecha('year'),
    hora: nfecha('hora'),
    created_at: nfecha('timestamp'),
    updated_at: nfecha('timestamp'),
    usuario: usuarioNombre.value
  };

  return {
    tabla: 'facturas',
    ruta: '/facturas',
    registro: factura
  };
};

const construirRegistro = async (respuesta) => {
  const entidad = normalizarTexto(respuesta.entityType || respuesta.entidad || respuesta.tipo);
  const payload = respuesta.data || {};

  switch (entidad) {
    case 'CLIENTE':
    case 'CLIENTES':
      return crearRegistroCliente(payload);
    case 'PRODUCTO':
    case 'PRODUCTOS':
      return crearRegistroProducto(payload);
    case 'COTIZACION':
    case 'COTIZACIONES':
      return crearRegistroCotizacion(payload);
    case 'FACTURA':
    case 'FACTURAS':
      return crearRegistroFactura(payload);
    default:
      throw new Error('La IA devolvio un tipo no soportado');
  }
};

const validarClienteDocumento = async (respuesta) => {
  const entidad = normalizarTexto(respuesta.entityType || respuesta.entidad || respuesta.tipo);
  if (!['FACTURA', 'FACTURAS', 'COTIZACION', 'COTIZACIONES'].includes(entidad)) {
    return { ok: true, payload: respuesta.data || {} };
  }

  const payload = { ...(respuesta.data || {}) };
  const { cliente, datosClientePendiente } = await resolverClienteDocumento(payload);

  if (!cliente && datosClientePendiente) {
    clientePendiente.value = datosClientePendiente;
    respuestaIAPendiente.value = respuesta;
    modalClienteNoEncontrado.value = true;
    return { ok: false };
  }

  payload.__clienteResuelto = cliente;
  return { ok: true, payload };
};

const procesarRespuestaIA = async (respuesta, payloadForzado = null) => {
  const respuestaProcesable = {
    ...respuesta,
    data: payloadForzado || respuesta.data || {}
  };

  const armado = await construirRegistro(respuestaProcesable);
  const insercion = await peticionesFetchOffline(
    'insertData',
    armado.tabla,
    JSON.stringify(armado.registro)
  );

  if (insercion?.[0] !== 'ok') {
    throw new Error(`No se pudo guardar en la tabla ${armado.tabla}`);
  }

  ultimoRegistro.value = {
    ...armado,
    respuesta: insercion
  };

  await cargarDatosBase();

  mensajetoast(
    toast,
    'Registro creado',
    `${respuesta.summary || 'Se creo el registro correctamente.'}`,
    'success',
    4000
  );
};

const crearClienteYContinuar = async () => {
  try {
    if (!clientePendiente.value || !respuestaIAPendiente.value) {
      modalClienteNoEncontrado.value = false;
      return;
    }

    const cliente = await crearClienteProvisional(clientePendiente.value.nombre, clientePendiente.value);
    const payload = {
      ...(respuestaIAPendiente.value.data || {}),
      __clienteResuelto: cliente
    };

    modalClienteNoEncontrado.value = false;
    await procesarRespuestaIA(respuestaIAPendiente.value, payload);
  } catch (error) {
    console.error('Error creando cliente pendiente:', error);
    mensajetoast(toast, 'Error', error.message || 'No se pudo crear el cliente.', 'error', 5000);
  } finally {
    clientePendiente.value = null;
    respuestaIAPendiente.value = null;
  }
};

const cancelarClientePendiente = () => {
  modalClienteNoEncontrado.value = false;
  clientePendiente.value = null;
  respuestaIAPendiente.value = null;
  mensajetoast(toast, 'Cancelado', 'No se creo el documento porque el cliente no existe.', 'warn', 4000);
};

const construirPromptSistema = () => {
  const contextoTablas = construirPlantillasTablasParaIA();
  const catalogoClientes = JSON.stringify(construirCatalogoClientesIA(), null, 2);
  const catalogoProductos = JSON.stringify(construirCatalogoProductosIA(), null, 2);

  return `Eres un asistente para un sistema ERP/POS. Tu trabajo es convertir instrucciones del usuario en un JSON valido, sin markdown.

Debes basarte en los campos reales de las tablas del sistema que se te entregan a continuacion. Todas incluyen campos y plantilla vacia. Solo facturas y cotizacion incluyen ejemplos detallados del documento:
${contextoTablas}

Tambien tienes estos arrays resumidos para buscar coincidencias antes de responder:
CLIENTES:
${catalogoClientes}

PRODUCTOS:
${catalogoProductos}

Responde exclusivamente con esta estructura:
{
  "operation": "create",
  "entityType": "cliente|producto|cotizacion|factura",
  "targetTable": "clientes|productos|cotizacion|facturas",
  "summary": "resumen corto",
  "missingFields": [],
  "warnings": [],
  "requiredFields": [],
  "data": {}
}

Reglas:
1. Solo tipos soportados: cliente, producto, cotizacion, factura.
2. Debes elegir la tabla correcta en "targetTable".
3. En "data" devuelve la plantilla de la tabla elegida, usando los mismos nombres de campos.
4. Llena los campos que puedas inferir y deja vacio "" lo que no sepas.
5. No inventes nombres de campos que no existan en la plantilla.
6. Si faltan datos criticos, llena "missingFields" con nombres concretos.
7. Para cotizacion y factura, si el usuario describe items, agrega un arreglo "items" aunque luego el sistema lo transforme.
8. Campos numericos pueden venir como numero o texto numerico.
9. Usa los ejemplos de facturas y cotizacion como referencia principal de formato y estilo de llenado.
10. Si el usuario menciona un cliente, intenta elegirlo del array CLIENTES por nombre, apodo o codigo.
11. Si el usuario menciona un producto, intenta elegirlo del array PRODUCTOS por nombre, descripcion, codigo, marca o modelo.
12. Solo usa un producto del array PRODUCTOS si la coincidencia es clara y pertenece a la misma marca o modelo pedido.
13. Si no hay coincidencia clara, conserva exactamente el producto descrito por el usuario y usa el precio indicado por el usuario.
14. No sustituyas LG o Samsung por iPhone ni por otro producto distinto.
15. Para FACTURA y COTIZACION, considera obligatorios: productos/items, cod_cliente, nombre_cliente, subtotal, impuesto, descuento, total, metodo_pago, fecha_emision.
16. En "requiredFields" devuelve la lista de campos obligatorios de la tabla elegida.
17. Aunque envies subtotal, impuesto, descuento y total, el sistema recalculara esos valores usando los items.
18. Si el usuario indica impuestos, distribuyelos en los items usando "impuesto", "impuesto_venta" o "impuestos".
19. Si el usuario pide cliente, producto, factura o cotizacion, "data" debe venir lista para insertarse en la tabla destino.
20. No expliques nada fuera del JSON.
21. Usa espanol en "summary" y "warnings".`;
};

const solicitarIA = async () => {
  if (!textoPlano(promptUsuario.value)) {
    mensajetoast(toast, 'Aviso', 'Escribe una instruccion para crear un registro.', 'warn');
    return;
  }

  const apiKey = obtenerApiKey();
  if (!apiKey) {
    mensajetoast(
      toast,
      'OpenAI no configurado',
      'No hay API Key de OpenAI en la configuracion del sistema.',
      'warn',
      5000
    );
    return;
  }

  loading.value = true;
  resultadoIA.value = null;
  ultimoRegistro.value = null;

  try {
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-3.5-turbo',
        temperature: 0.1,
        messages: [
          {
            role: 'system',
            content: construirPromptSistema()
          },
          {
            role: 'user',
            content: promptUsuario.value
          }
        ],
        max_tokens: 1600
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const contenido = response.data?.choices?.[0]?.message?.content || '{}';
    resultadoIA.value = extraerJsonDesdeTexto(contenido);

    if (Array.isArray(resultadoIA.value?.missingFields) && resultadoIA.value.missingFields.length) {
      mensajetoast(
        toast,
        'Faltan datos',
        `La IA necesita: ${resultadoIA.value.missingFields.join(', ')}`,
        'warn',
        5000
      );
      return;
    }

    const entidadDocumento = normalizarTexto(
      resultadoIA.value?.entityType || resultadoIA.value?.entidad || resultadoIA.value?.tipo
    );
    if (['FACTURA', 'FACTURAS', 'COTIZACION', 'COTIZACIONES'].includes(entidadDocumento)) {
      const itemsIA = resultadoIA.value?.data?.items || resultadoIA.value?.data?.productos || [];
      if (!Array.isArray(itemsIA) || !itemsIA.length) {
        throw new Error('La IA no devolvio items suficientes para generar el documento.');
      }
    }

    const validacionCliente = await validarClienteDocumento(resultadoIA.value);
    if (!validacionCliente.ok) {
      return;
    }

    await procesarRespuestaIA(resultadoIA.value, validacionCliente.payload);
  } catch (error) {
    console.error('Error creando registro con IA:', error);
    mensajetoast(
      toast,
      'Error',
      error?.response?.data?.error?.message || error.message || 'No se pudo completar la operacion.',
      'error',
      6000
    );
  } finally {
    loading.value = false;
  }
};

onMounted(async () => {
  await cargarDatosBase();
  inicializarReconocimientoVoz();
});
</script>

<template>
  <main class="ai-assistant-page">
    <div class="ai-assistant-container">
      <section class="ai-hero">
        <div>
          <p class="ai-kicker">ASISTENTE IA</p>
          <h1>Crea registros con lenguaje natural</h1>
          <p class="ai-hero-copy">
            Escribe una instruccion como "crea un cliente", "haz una cotizacion" o "genera un producto".
          </p>
        </div>
        <Button label="Volver al inicio" icon="pi pi-home" severity="secondary" outlined @click="router.push('/home')" />
      </section>

      <section class="ai-grid">
        <Card class="ai-main-card">
          <template #content>
            <div class="ai-form-head">
              <div>
                <h2>Solicitud</h2>
                <p>El asistente analizara tu texto, armara el registro y lo guardara en el sistema.</p>
              </div>
              <Tag value="OpenAI" severity="info" />
            </div>

            <textarea
              v-model="promptUsuario"
              class="ai-textarea"
              rows="8"
              placeholder="Ejemplo: crea una cotizacion para Juan Perez con 2 Samsung A15 a 9500 cada uno."
            />

            <div class="ai-actions">
              <Button
                :label="grabandoVoz ? 'Escuchando...' : 'Microfono'"
                :severity="grabandoVoz ? 'danger' : 'secondary'"
                :outlined="!grabandoVoz"
                icon="pi pi-microphone"
                @click="alternarMicrofono"
              />
              <Button label="Crear con IA" icon="pi pi-bolt" :loading="loading" @click="solicitarIA" />
            </div>

            <p class="ai-voice-hint" v-if="vozDisponible">
              {{ grabandoVoz ? 'Habla ahora. Al terminar se colocara el texto en la solicitud.' : 'Puedes dictar la instruccion con el boton de microfono.' }}
            </p>
            <p class="ai-voice-hint" v-else>
              El reconocimiento de voz no esta disponible en este equipo.
            </p>

            <div class="ai-loading" v-if="loading">
              <ProgressSpinner style="width: 40px; height: 40px" strokeWidth="4" />
              <span>Consultando OpenAI y creando el registro...</span>
            </div>

            <div class="ai-result" v-if="resultadoIA">
              <h3>Lectura de la IA</h3>
              <p><strong>Tipo:</strong> {{ resultadoIA.entityType }}</p>
              <p><strong>Resumen:</strong> {{ resultadoIA.summary || 'Sin resumen' }}</p>
              <p v-if="resultadoIA.warnings?.length">
                <strong>Notas:</strong> {{ resultadoIA.warnings.join(' | ') }}
              </p>
            </div>

            <div class="ai-result ai-result-success" v-if="ultimoRegistro">
              <h3>Registro guardado</h3>
              <p><strong>Tabla:</strong> {{ ultimoRegistro.tabla }}</p>
              <p>
                <strong>Identificador:</strong>
                {{ ultimoRegistro.registro.no_factura || ultimoRegistro.registro.no_cotizacion || ultimoRegistro.registro.codigo || ultimoRegistro.registro.nombre }}
              </p>
              <Button
                label="Abrir listado"
                icon="pi pi-arrow-right"
                link
                @click="router.push(ultimoRegistro.ruta)"
              />
            </div>
          </template>
        </Card>

        <Card class="ai-side-card">
          <template #content>
            <h3>Ideas rapidas</h3>
            <div class="ai-example-list">
              <button
                v-for="ejemplo in ejemplosPrompt"
                :key="ejemplo"
                type="button"
                class="ai-example"
                @click="promptUsuario = ejemplo"
              >
                {{ ejemplo }}
              </button>
            </div>

            <div class="ai-help-box">
              <h4>Soportado ahora</h4>
              <ul>
                <li>Clientes</li>
                <li>Productos</li>
                <li>Cotizaciones</li>
                <li>Facturas borrador</li>
              </ul>
            </div>

            <div class="ai-help-box">
              <h4>Nota tecnica</h4>
              <p>
                Las facturas creadas aqui se guardan como borrador para evitar movimientos automaticos de stock o cobros.
              </p>
            </div>
          </template>
        </Card>
      </section>
    </div>
    <Dialog
      v-model:visible="modalClienteNoEncontrado"
      modal
      header="Cliente no encontrado"
      :style="{ width: '32rem' }"
    >
      <div class="ai-dialog-copy">
        <p>
          No se encontro el cliente
          <strong>{{ clientePendiente?.nombre || clientePendiente?.cod_cliente || 'sin nombre' }}</strong>
          en la tabla de clientes.
        </p>
        <p>Deseas crearlo y continuar con el documento, o cancelar?</p>
      </div>
      <template #footer>
        <Button label="Cancelar" severity="secondary" outlined @click="cancelarClientePendiente" />
        <Button label="Crear y continuar" severity="success" @click="crearClienteYContinuar" />
      </template>
    </Dialog>
    <Toast />
  </main>
</template>

<style scoped>
.ai-assistant-page {
  min-height: 100%;
  padding: 1.5rem;
  background:
    radial-gradient(circle at top left, rgba(34, 197, 94, 0.18), transparent 28%),
    radial-gradient(circle at bottom right, rgba(14, 165, 233, 0.18), transparent 30%),
    linear-gradient(180deg, #f6fbf8 0%, #eef4ff 100%);
}

.ai-assistant-container {
  max-width: 1280px;
  margin: 0 auto;
}

.ai-hero {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
  padding: 1.5rem;
  border-radius: 24px;
  background: linear-gradient(135deg, #0f172a 0%, #164e63 100%);
  color: #fff;
  box-shadow: 0 24px 50px rgba(15, 23, 42, 0.18);
}

.ai-kicker {
  margin: 0 0 0.5rem;
  font-size: 0.8rem;
  letter-spacing: 0.2em;
  color: rgba(255, 255, 255, 0.7);
}

.ai-hero h1 {
  margin: 0;
  font-size: clamp(1.8rem, 3vw, 2.8rem);
  line-height: 1.05;
}

.ai-hero-copy {
  max-width: 720px;
  margin: 0.75rem 0 0;
  color: rgba(255, 255, 255, 0.82);
}

.ai-grid {
  display: grid;
  grid-template-columns: minmax(0, 2fr) minmax(300px, 1fr);
  gap: 1.25rem;
  margin-top: 1.25rem;
}

.ai-main-card,
.ai-side-card {
  border-radius: 22px;
  overflow: hidden;
  border: 1px solid rgba(15, 23, 42, 0.08);
  box-shadow: 0 18px 40px rgba(15, 23, 42, 0.08);
}

.ai-form-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
  margin-bottom: 1rem;
}

.ai-form-head h2,
.ai-side-card h3,
.ai-result h3,
.ai-help-box h4 {
  margin: 0 0 0.35rem;
}

.ai-form-head p,
.ai-help-box p,
.ai-result p {
  margin: 0.15rem 0;
  color: #475569;
}

.ai-textarea {
  width: 100%;
  border: 1px solid #cbd5e1;
  border-radius: 16px;
  padding: 1rem;
  resize: vertical;
  font-size: 1rem;
  line-height: 1.5;
  background: #fcfdfd;
}

.ai-textarea:focus {
  outline: none;
  border-color: #0891b2;
  box-shadow: 0 0 0 4px rgba(8, 145, 178, 0.12);
}

.ai-actions {
  display: flex;
  gap: 0.75rem;
  justify-content: flex-end;
  margin-top: 1rem;
}

.ai-voice-hint {
  margin: 0.75rem 0 0;
  color: #475569;
  font-size: 0.92rem;
}

.ai-loading {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-top: 1rem;
  padding: 1rem;
  border-radius: 16px;
  background: #eff6ff;
  color: #1e3a8a;
}

.ai-result {
  margin-top: 1rem;
  padding: 1rem;
  border-radius: 16px;
  background: #f8fafc;
}

.ai-result-success {
  background: #ecfdf5;
}

.ai-example-list {
  display: grid;
  gap: 0.75rem;
}

.ai-example {
  width: 100%;
  border: 1px solid #dbeafe;
  border-radius: 14px;
  padding: 0.85rem;
  text-align: left;
  background: linear-gradient(180deg, #ffffff 0%, #f8fbff 100%);
  color: #0f172a;
  cursor: pointer;
  transition:
    transform 0.18s ease,
    box-shadow 0.18s ease,
    border-color 0.18s ease;
}

.ai-example:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 24px rgba(14, 165, 233, 0.12);
  border-color: #7dd3fc;
}

.ai-help-box {
  margin-top: 1rem;
  padding: 1rem;
  border-radius: 16px;
  background: #f8fafc;
}

.ai-help-box ul {
  margin: 0.5rem 0 0;
  padding-left: 1rem;
}

.ai-dialog-copy p {
  margin: 0 0 0.75rem;
  color: #334155;
}

@media (max-width: 960px) {
  .ai-grid {
    grid-template-columns: 1fr;
  }

  .ai-hero {
    flex-direction: column;
  }
}
</style>
