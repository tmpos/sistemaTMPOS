<script setup>
import { ref, onMounted, computed } from 'vue';
import { useToast } from 'primevue/usetoast';
import { useRouter } from 'vue-router';
import Swal from 'sweetalert2';
import {
  peticionesFetchOffline,
  crearTablaSiNoExisteOffline,
  arrayToObjetoFromTablaOffline,
  nfecha,
  envioElectron,
  encryptarPassword,
  formatoMonedaRD
} from '@/funciones/funciones.js';
import { useDatosEmpresa } from '@/stores';

const toast = useToast();
const router = useRouter();
const datosEmpresa = useDatosEmpresa();

/************************************************************************/
// Variables de configuración
const token = ref('');
const tokenCorto = ref('');

// Esquema de historial de puntos
const camposHistorial = [
  'codigo_cliente',
  'tipo_movimiento', // 'compra', 'cumpleanos', 'canje', 'ajuste'
  'puntos',
  'descripcion',
  'no_factura',
  'fecha',
  'hora',
  'usuario'
];

// Datos
const clientesFidelizacion = ref([]);
const historialPuntos = ref([]);
const facturas = ref([]);
const clientes = ref([]);
const searchQuery = ref('');
const selectedCliente = ref(null);

// Modal states
const visibleDetalles = ref(false);
const visibleAjustar = ref(false);
const visibleCanjear = ref(false);
const visibleConfiguracion = ref(false);

// Configuración del programa
const configuracion = ref({
  puntosxpeso: 100, // 1 punto por cada 100 pesos gastados
  puntosCumpleanos: 100, // Puntos de regalo por cumpleaños
  niveles: [
    { nombre: 'BRONCE', minPuntos: 0, maxPuntos: 99, descuento: 0, color: '#CD7F32', icono: 'pi-circle' },
    { nombre: 'PLATA', minPuntos: 100, maxPuntos: 499, descuento: 5, color: '#C0C0C0', icono: 'pi-star' },
    { nombre: 'ORO', minPuntos: 500, maxPuntos: 1499, descuento: 10, color: '#FFD700', icono: 'pi-star-fill' },
    { nombre: 'PLATINO', minPuntos: 1500, maxPuntos: 2999, descuento: 15, color: '#E5E4E2', icono: 'pi-crown' },
    { nombre: 'DIAMANTE', minPuntos: 3000, maxPuntos: 999999999, descuento: 20, color: '#B9F2FF', icono: 'pi-trophy' }
  ]
});

// Formularios
const formAjuste = ref({
  puntos: 0,
  tipo: 'ganancia',
  descripcion: ''
});

const formCanje = ref({
  puntos: 0,
  descripcion: ''
});

/************************************************************************/
// Funciones de inicialización
onMounted(async () => {
  const datosJSON = await envioElectron('datosarchivo');
  token.value = datosJSON.VITE_TOKEN;
  tokenCorto.value = datosJSON.VITE_TOKEN_CORTO;

  // Crear tabla de historial si no existe
  await crearTablaSiNoExisteOffline('historial_puntos', camposHistorial, toast);

  await cargarDatos();
});

/************************************************************************/
// Cargar datos
const cargarDatos = async () => {
  try {
    // Cargar todos los clientes
    clientes.value = await peticionesFetchOffline('getDataAsArray', 'clientes');

    // Cargar todas las facturas
    facturas.value = await peticionesFetchOffline('getDataAsArray', 'facturas');

    // Cargar historial
    const dataHistorial = await peticionesFetchOffline('getDataAsArray', 'historial_puntos');
    historialPuntos.value = dataHistorial.reverse();

    // Procesar clientes con compras
    await procesarClientesConCompras();
  } catch (error) {
    console.error('Error al cargar datos:', error);
  }
};

/************************************************************************/
// Procesar clientes que han comprado
const procesarClientesConCompras = async () => {
  try {
    const clientesConCompras = [];

    // Obtener clientes únicos de facturas
    const codigosClientes = [...new Set(facturas.value.map(f => f.cod_cliente))];

    for (const codigoCliente of codigosClientes) {
      const cliente = clientes.value.find(c => c.codigo === codigoCliente);

      if (cliente) {
        // Calcular estadísticas del cliente
        const facturasCliente = facturas.value.filter(f => f.cod_cliente === codigoCliente);

        const totalCompras = facturasCliente.length;
        const montoTotal = facturasCliente.reduce((sum, f) => sum + Number(f.total || 0), 0);

        // Obtener última compra
        const ultimaFactura = facturasCliente.sort((a, b) =>
          new Date(b.fecha_emision || b.created_at) - new Date(a.fecha_emision || a.created_at)
        )[0];

        const ultimaCompra = ultimaFactura?.fecha_emision || ultimaFactura?.created_at?.substring(0, 10) || '';

        // Calcular puntos desde cero basados en el monto total
        const puntosCalculados = Math.floor(montoTotal / configuracion.value.puntosxpeso);

        // Obtener puntos actuales del cliente (si tiene puntos canjeados, restarlos)
        const puntosActuales = Number(cliente.puntos || 0);

        const clienteConDatos = {
          ...cliente,
          puntos_actuales: puntosActuales,
          total_compras: totalCompras,
          monto_total_gastado: montoTotal,
          ultima_compra: ultimaCompra,
          nivel: calcularNivel(puntosActuales).nombre
        };

        clientesConCompras.push(clienteConDatos);
      }
    }

    clientesFidelizacion.value = clientesConCompras;
  } catch (error) {
    console.error('Error al procesar clientes:', error);
  }
};

/************************************************************************/
// Sincronizar y recalcular puntos
const sincronizarClientes = async () => {
  try {
    toast.add({ severity: 'info', summary: 'Sincronizando', detail: 'Recalculando puntos de clientes...', life: 2000 });

    // Recalcular puntos para cada cliente basado en sus compras
    for (const clienteData of clientesFidelizacion.value) {
      const facturasCliente = facturas.value.filter(f => f.cod_cliente === clienteData.codigo);
      const montoTotal = facturasCliente.reduce((sum, f) => sum + Number(f.total || 0), 0);

      // Calcular puntos que deberían tener
      const puntosGanados = Math.floor(montoTotal / configuracion.value.puntosxpeso);

      // Actualizar puntos en la tabla clientes
      const cliente = clientes.value.find(c => c.codigo === clienteData.codigo);
      if (cliente) {
        cliente.puntos = puntosGanados;
        cliente.updated_at = nfecha('timestamp');

        await peticionesFetchOffline('updateData', 'clientes', JSON.stringify(cliente));
      }
    }

    await cargarDatos();
    toast.add({ severity: 'success', summary: 'Sincronizado', detail: 'Puntos recalculados correctamente', life: 3000 });
  } catch (error) {
    console.error('Error al sincronizar:', error);
    toast.add({ severity: 'error', summary: 'Error', detail: 'Error al sincronizar puntos', life: 3000 });
  }
};

/************************************************************************/
// Calcular nivel según puntos
const calcularNivel = (puntos) => {
  for (let nivel of configuracion.value.niveles) {
    if (puntos >= nivel.minPuntos && puntos <= nivel.maxPuntos) {
      return nivel;
    }
  }
  return configuracion.value.niveles[0]; // Default: BRONCE
};

/************************************************************************/
// Actualizar nivel de cliente
const actualizarNivelCliente = async (cliente) => {
  const nuevoNivel = calcularNivel(cliente.puntos_actuales);

  if (cliente.nivel !== nuevoNivel.nombre) {
    cliente.nivel = nuevoNivel.nombre;
    cliente.updated_at = nfecha('timestamp');

    await peticionesFetchOffline('updateData', 'fidelizacion', JSON.stringify(cliente));

    return true; // Cambió de nivel
  }

  return false;
};

/************************************************************************/
// Filtrar clientes
const clientesFiltrados = computed(() => {
  if (!searchQuery.value) return clientesFidelizacion.value;

  return clientesFidelizacion.value.filter(cliente => {
    return Object.values(cliente).some(value =>
      String(value).toLowerCase().includes(searchQuery.value.toLowerCase())
    );
  });
});

/************************************************************************/
// Estadísticas
const estadisticas = computed(() => {
  const total = clientesFidelizacion.value.length;
  const niveles = {};

  configuracion.value.niveles.forEach(nivel => {
    niveles[nivel.nombre] = clientesFidelizacion.value.filter(c => c.nivel === nivel.nombre).length;
  });

  const puntosTotal = clientesFidelizacion.value.reduce((sum, c) => sum + Number(c.puntos_actuales || 0), 0);
  const puntosCanjeados = clientesFidelizacion.value.reduce((sum, c) => sum + Number(c.puntos_canjeados || 0), 0);

  return {
    total,
    niveles,
    puntosTotal,
    puntosCanjeados
  };
});

/************************************************************************/
// Verificar cumpleaños y regalar puntos
const verificarCumpleanos = async (cliente) => {
  try {
    if (!cliente.fecha_nacimiento) return false;

    const hoy = new Date();
    const fechaNac = new Date(cliente.fecha_nacimiento);

    // Verificar si hoy es su cumpleaños
    if (hoy.getMonth() === fechaNac.getMonth() && hoy.getDate() === fechaNac.getDate()) {
      // Verificar si ya se le regalaron puntos este año
      const historialHoy = historialPuntos.value.filter(h =>
        h.codigo_cliente === cliente.codigo &&
        h.tipo_movimiento === 'cumpleanos' &&
        h.fecha === nfecha('fecha')
      );

      if (historialHoy.length === 0) {
        // Regalar puntos de cumpleaños
        cliente.puntos = Number(cliente.puntos || 0) + configuracion.value.puntosCumpleanos;
        cliente.updated_at = nfecha('timestamp');

        await peticionesFetchOffline('updateData', 'clientes', JSON.stringify(cliente));

        // Registrar en historial
        const historial = {
          codigo_cliente: cliente.codigo,
          tipo_movimiento: 'cumpleanos',
          puntos: configuracion.value.puntosCumpleanos,
          descripcion: `¡Feliz cumpleaños! Regalo de ${configuracion.value.puntosCumpleanos} puntos`,
          no_factura: '',
          fecha: nfecha('fecha'),
          hora: nfecha('hora'),
          usuario: 'Sistema',
          created_at: nfecha('timestamp'),
          updated_at: nfecha('timestamp')
        };

        await peticionesFetchOffline('insertData', 'historial_puntos', JSON.stringify(historial));

        return true;
      }
    }

    return false;
  } catch (error) {
    console.error('Error al verificar cumpleaños:', error);
    return false;
  }
};

/************************************************************************/
// Enviar correo de felicitación
const enviarCorreoFelicitacion = async (cliente) => {
  try {
    if (!window.electron?.ipcRenderer) {
      toast.add({ severity: 'warn', summary: 'No disponible', detail: 'El envío de correo solo funciona en la aplicación de escritorio', life: 3000 });
      return;
    }

    if (!cliente.email) {
      toast.add({ severity: 'warn', summary: 'Sin email', detail: 'Este cliente no tiene email registrado', life: 3000 });
      return;
    }

    const datoscorreo = await peticionesFetchOffline('getDataByField', 'configuracion_correo', 'id', 1);

    if (!datoscorreo) {
      toast.add({ severity: 'error', summary: 'Error', detail: 'No se encontró configuración de correo', life: 3000 });
      return;
    }

    const nivel = calcularNivel(cliente.puntos_actuales || cliente.puntos || 0);
    const datosEmpresaLocal = enviarDatosLocalStorage();

    const htmlCorreo = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 0 auto; background: #fff; }
          .header { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 30px; text-align: center; }
          .header h1 { margin: 0; font-size: 28px; }
          .content { padding: 30px; }
          .puntos-box { background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border-left: 4px solid #f59e0b; padding: 20px; margin: 20px 0; border-radius: 8px; text-align: center; }
          .puntos-number { font-size: 48px; font-weight: bold; color: #f59e0b; margin: 10px 0; }
          .nivel-badge { display: inline-block; padding: 10px 20px; background: ${nivel.color}; color: white; border-radius: 20px; font-weight: bold; margin: 10px 0; }
          .beneficios { background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .beneficio-item { padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
          .footer { background: #f3f4f6; padding: 20px; text-align: center; font-size: 12px; color: #6b7280; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>💛 ¡Hola ${cliente.nombre}! 💛</h1>
            <p style="margin: 10px 0; font-size: 18px;">Gracias por ser parte de nuestra familia</p>
          </div>

          <div class="content">
            <h2 style="color: #f59e0b;">🎉 ¡Tus Puntos AA!</h2>
            <p>Nos complace informarte sobre tu estado en nuestro programa de fidelización.</p>

            <div class="puntos-box">
              <p style="margin: 0; font-size: 16px; color: #92400e;">Puntos Acumulados</p>
              <div class="puntos-number">${Number(cliente.puntos_actuales || cliente.puntos || 0).toLocaleString()}</div>
              <p style="margin: 0; color: #92400e;">¡Sigue sumando!</p>
            </div>

            <div style="text-align: center; margin: 20px 0;">
              <p style="margin: 5px 0; font-size: 14px; color: #6b7280;">Tu Nivel Actual</p>
              <span class="nivel-badge">${nivel.nombre}</span>
              <p style="margin: 5px 0; font-size: 14px; color: #6b7280;">Descuento: ${nivel.descuento}%</p>
            </div>

            <div class="beneficios">
              <h3 style="margin-top: 0; color: #f59e0b;">🎁 Tus Beneficios</h3>
              <div class="beneficio-item">
                <strong>✓</strong> ${nivel.descuento}% de descuento en todas tus compras
              </div>
              <div class="beneficio-item">
                <strong>✓</strong> 1 punto por cada $100 en compras
              </div>
              <div class="beneficio-item">
                <strong>✓</strong> 100 puntos de regalo en tu cumpleaños
              </div>
              <div class="beneficio-item" style="border-bottom: none;">
                <strong>✓</strong> Promociones exclusivas para miembros ${nivel.nombre}
              </div>
            </div>

            <div style="background: #fef2f2; border-left: 4px solid #dc2626; padding: 15px; margin: 20px 0; border-radius: 8px;">
              <p style="margin: 0; color: #991b1b;">
                <strong>💡 ¿Sabías que?</strong><br>
                Has realizado <strong>${cliente.total_compras || 0}</strong> compras con nosotros por un total de <strong>${formatoMonedaRD(cliente.monto_total_gastado || 0)}</strong>
              </p>
            </div>

            <p style="text-align: center; margin: 30px 0;">
              ¡Gracias por confiar en nosotros!<br>
              <strong style="color: #f59e0b; font-size: 18px;">${datosEmpresaLocal.empresa?.nombre || 'AA Solutions'}</strong>
            </p>
          </div>

          <div class="footer">
            <p style="margin: 5px 0;">Este es un correo automático, por favor no responder</p>
            <p style="margin: 5px 0;">${datosEmpresaLocal.empresa?.nombre || 'AA Solutions'} - Programa de Fidelización</p>
            <p style="margin: 5px 0;">📧 ${datosEmpresaLocal.empresa?.email || ''} | 📞 ${datosEmpresaLocal.empresa?.telefono || ''}</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const envioCorreo = {
      mailto: cliente.email,
      subjet: `🎉 ¡Tus puntos AA! - ${Number(cliente.puntos_actuales || cliente.puntos || 0).toLocaleString()} puntos acumulados`,
      mensaje: `Hola ${cliente.nombre}, tienes ${Number(cliente.puntos_actuales || cliente.puntos || 0).toLocaleString()} puntos en tu cuenta.`,
      albody: htmlCorreo,
      correo: datoscorreo,
      empresa: datosEmpresaLocal.empresa?.nombre || 'AA Solutions'
    };

    const resultado = await window.electron.ipcRenderer.invoke('enviarCorreo', envioCorreo);

    if (resultado?.ok) {
      toast.add({ severity: 'success', summary: 'Correo enviado', detail: `Correo enviado a ${cliente.nombre}`, life: 3000 });
    } else {
      throw new Error(resultado?.error || 'Error al enviar correo');
    }
  } catch (error) {
    console.error('Error al enviar correo:', error);
    toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo enviar el correo', life: 3000 });
  }
};

/************************************************************************/
// Ver detalles de cliente
const verDetalles = async (cliente) => {
  selectedCliente.value = cliente;

  // Verificar cumpleaños al abrir detalles
  const esCumpleanos = await verificarCumpleanos(cliente);
  if (esCumpleanos) {
    await cargarDatos();
    Swal.fire({
      icon: 'success',
      title: '🎂 ¡Feliz Cumpleaños!',
      html: `<p>Se han agregado <strong>${configuracion.value.puntosCumpleanos} puntos</strong> a ${cliente.nombre}</p>`,
      confirmButtonColor: '#f59e0b'
    });
  }

  visibleDetalles.value = true;
};

/************************************************************************/
// Ajustar puntos manualmente
const abrirAjustarPuntos = (cliente) => {
  selectedCliente.value = cliente;
  formAjuste.value = {
    puntos: 0,
    tipo: 'ganancia',
    descripcion: ''
  };
  visibleAjustar.value = true;
};

const ajustarPuntos = async () => {
  if (!formAjuste.value.puntos || formAjuste.value.puntos === 0) {
    toast.add({ severity: 'warn', summary: 'Advertencia', detail: 'Debe ingresar una cantidad de puntos', life: 3000 });
    return;
  }

  const result = await Swal.fire({
    title: 'Confirmar ajuste',
    text: `¿Ajustar ${formAjuste.value.puntos} puntos al cliente ${selectedCliente.value.nombre}?`,
    icon: 'question',
    showCancelButton: true,
    confirmButtonText: 'Sí, ajustar',
    cancelButtonText: 'Cancelar',
    confirmButtonColor: '#16a34a'
  });

  if (!result.isConfirmed) return;

  try {
    const clienteData = selectedCliente.value;
    const puntosAjuste = formAjuste.value.tipo === 'ganancia'
      ? Number(formAjuste.value.puntos)
      : -Number(formAjuste.value.puntos);

    // Buscar cliente en la tabla clientes
    const cliente = clientes.value.find(c => c.codigo === clienteData.codigo);

    if (!cliente) {
      toast.add({ severity: 'error', summary: 'Error', detail: 'Cliente no encontrado', life: 3000 });
      return;
    }

    // Actualizar puntos del cliente
    cliente.puntos = Number(cliente.puntos || 0) + puntosAjuste;
    cliente.updated_at = nfecha('timestamp');

    await peticionesFetchOffline('updateData', 'clientes', JSON.stringify(cliente));

    // Registrar en historial
    const historial = {
      codigo_cliente: cliente.codigo,
      tipo_movimiento: formAjuste.value.tipo === 'ganancia' ? 'ajuste' : 'descuento',
      puntos: Math.abs(puntosAjuste),
      descripcion: formAjuste.value.descripcion || 'Ajuste manual',
      no_factura: '',
      fecha: nfecha('fecha'),
      hora: nfecha('hora'),
      usuario: datosEmpresa.usuario?.nombre || 'Sistema',
      created_at: nfecha('timestamp'),
      updated_at: nfecha('timestamp')
    };

    await peticionesFetchOffline('insertData', 'historial_puntos', JSON.stringify(historial));

    await cargarDatos();
    visibleAjustar.value = false;

    toast.add({ severity: 'success', summary: 'Éxito', detail: 'Puntos ajustados correctamente', life: 3000 });
  } catch (error) {
    console.error('Error al ajustar puntos:', error);
    toast.add({ severity: 'error', summary: 'Error', detail: 'Error al ajustar puntos', life: 3000 });
  }
};

/************************************************************************/
// Canjear puntos
const abrirCanjearPuntos = (cliente) => {
  selectedCliente.value = cliente;
  formCanje.value = {
    puntos: 0,
    descripcion: ''
  };
  visibleCanjear.value = true;
};

const canjearPuntos = async () => {
  if (!formCanje.value.puntos || formCanje.value.puntos === 0) {
    toast.add({ severity: 'warn', summary: 'Advertencia', detail: 'Debe ingresar una cantidad de puntos', life: 3000 });
    return;
  }

  const clienteData = selectedCliente.value;
  const puntosActuales = Number(clienteData.puntos_actuales || clienteData.puntos || 0);

  if (formCanje.value.puntos > puntosActuales) {
    toast.add({ severity: 'error', summary: 'Error', detail: 'El cliente no tiene suficientes puntos', life: 3000 });
    return;
  }

  const result = await Swal.fire({
    title: 'Confirmar canje',
    text: `¿Canjear ${formCanje.value.puntos} puntos del cliente ${clienteData.nombre}?`,
    icon: 'question',
    showCancelButton: true,
    confirmButtonText: 'Sí, canjear',
    cancelButtonText: 'Cancelar',
    confirmButtonColor: '#dc2626'
  });

  if (!result.isConfirmed) return;

  try {
    // Buscar cliente en la tabla clientes
    const cliente = clientes.value.find(c => c.codigo === clienteData.codigo);

    if (!cliente) {
      toast.add({ severity: 'error', summary: 'Error', detail: 'Cliente no encontrado', life: 3000 });
      return;
    }

    // Actualizar puntos del cliente (restar los puntos canjeados)
    cliente.puntos = Number(cliente.puntos || 0) - Number(formCanje.value.puntos);
    cliente.updated_at = nfecha('timestamp');

    await peticionesFetchOffline('updateData', 'clientes', JSON.stringify(cliente));

    // Registrar en historial
    const historial = {
      codigo_cliente: cliente.codigo,
      tipo_movimiento: 'canje',
      puntos: formCanje.value.puntos,
      descripcion: formCanje.value.descripcion || 'Canje de puntos',
      no_factura: '',
      fecha: nfecha('fecha'),
      hora: nfecha('hora'),
      usuario: datosEmpresa.usuario?.nombre || 'Sistema',
      created_at: nfecha('timestamp'),
      updated_at: nfecha('timestamp')
    };

    await peticionesFetchOffline('insertData', 'historial_puntos', JSON.stringify(historial));

    await cargarDatos();
    visibleCanjear.value = false;

    toast.add({ severity: 'success', summary: 'Éxito', detail: 'Puntos canjeados correctamente', life: 3000 });
  } catch (error) {
    console.error('Error al canjear puntos:', error);
    toast.add({ severity: 'error', summary: 'Error', detail: 'Error al canjear puntos', life: 3000 });
  }
};

/************************************************************************/
// Obtener historial de un cliente
const obtenerHistorialCliente = (codigoCliente) => {
  return historialPuntos.value.filter(h => h.codigo_cliente === codigoCliente);
};

/************************************************************************/
// Función auxiliar para obtener datos del localStorage
const enviarDatosLocalStorage = () => {
  try {
    const empresaData = localStorage.getItem('empresa');
    return {
      empresa: empresaData ? JSON.parse(empresaData) : null
    };
  } catch (error) {
    console.error('Error al obtener datos del localStorage:', error);
    return { empresa: null };
  }
};

/************************************************************************/
// Severidad del badge según nivel
const getSeveridadNivel = (nivel) => {
  const severidades = {
    'BRONCE': 'secondary',
    'PLATA': 'info',
    'ORO': 'warning',
    'PLATINO': 'contrast',
    'DIAMANTE': 'success'
  };
  return severidades[nivel] || 'secondary';
};
</script>

<template>
  <main class="fidelizacion-container">
    <div class="w-full">
      <!-- Header -->
      <div class="fidelizacion-header mb-4">
        <div class="fidelizacion-header-content">
          <div class="fidelizacion-icon-wrapper">
            <i class="pi pi-heart fidelizacion-icon"></i>
          </div>
          <div>
            <h1 class="fidelizacion-title">Programa de Fidelización</h1>
            <p class="fidelizacion-subtitle">Sistema de recompensas y beneficios para clientes leales</p>
          </div>
        </div>
      </div>

      <!-- Estadísticas -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-4 mb-4">
        <div class="stats-card stats-total">
          <div class="stats-icon-wrapper">
            <i class="pi pi-users stats-icon"></i>
          </div>
          <div class="stats-content">
            <p class="stats-label">Total Clientes</p>
            <p class="stats-value">{{ estadisticas.total }}</p>
          </div>
        </div>

        <div
          v-for="nivel in configuracion.niveles"
          :key="nivel.nombre"
          class="stats-card"
          :style="{ borderLeftColor: nivel.color }"
        >
          <div class="stats-icon-wrapper" :style="{ background: nivel.color }">
            <i :class="`pi ${nivel.icono} stats-icon`" style="color: white;"></i>
          </div>
          <div class="stats-content">
            <p class="stats-label">{{ nivel.nombre }}</p>
            <p class="stats-value">{{ estadisticas.niveles[nivel.nombre] || 0 }}</p>
          </div>
        </div>

        <div class="stats-card stats-puntos col-span-1 md:col-span-2 lg:col-span-1">
          <div class="stats-icon-wrapper">
            <i class="pi pi-star stats-icon"></i>
          </div>
          <div class="stats-content">
            <p class="stats-label">Puntos Activos</p>
            <p class="stats-value">{{ estadisticas.puntosTotal.toLocaleString() }}</p>
          </div>
        </div>
      </div>

      <!-- Toolbar -->
      <Card class="mb-4 toolbar-card">
        <template #content>
          <div class="flex flex-wrap gap-3 items-center justify-between">
            <div class="flex flex-wrap gap-2">
              <Button
                icon="pi pi-refresh"
                label="Recargar"
                severity="secondary"
                @click="cargarDatos"
                class="btn-action"
              />
              <Button
                icon="pi pi-sync"
                label="Sincronizar Clientes"
                severity="info"
                @click="sincronizarClientes"
                class="btn-action"
              />
            </div>
          </div>
        </template>
      </Card>

      <!-- Filtros -->
      <Card class="mb-4 filters-card">
        <template #content>
          <div class="filter-item">
            <label class="filter-label">
              <i class="pi pi-search mr-2"></i>
              Buscar Cliente
            </label>
            <InputText
              v-model="searchQuery"
              placeholder="Buscar por nombre, código, nivel..."
              class="w-full filter-input"
            />
          </div>
        </template>
      </Card>

      <!-- DataTable -->
      <Card class="datatable-card">
        <template #content>
          <DataTable
            :value="clientesFiltrados"
            scrollable
            scrollHeight="600px"
            dataKey="id"
            paginator
            :rows="10"
            :rowsPerPageOptions="[5, 10, 20, 50]"
            class="fidelizacion-table"
            tableStyle="min-width: 80rem">

            <Column field="codigo" header="Código" style="min-width: 100px"></Column>
            <Column field="nombre" header="Cliente" style="min-width: 250px"></Column>

            <Column field="nivel" header="Nivel" style="min-width: 130px">
              <template #body="slotProps">
                <Badge
                  :value="slotProps.data.nivel"
                  :severity="getSeveridadNivel(slotProps.data.nivel)"
                  size="large"
                />
              </template>
            </Column>

            <Column field="puntos_actuales" header="Puntos Actuales" style="min-width: 140px">
              <template #body="slotProps">
                <span class="font-bold text-lg" style="color: #f59e0b;">
                  {{ Number(slotProps.data.puntos || slotProps.data.puntos_actuales || 0).toLocaleString() }}
                </span>
              </template>
            </Column>

            <Column field="monto_total_gastado" header="Total Gastado" style="min-width: 140px">
              <template #body="slotProps">
                {{ formatoMonedaRD(slotProps.data.monto_total_gastado || 0) }}
              </template>
            </Column>

            <Column field="total_compras" header="Total Compras" style="min-width: 120px"></Column>

            <Column field="ultima_compra" header="Última Compra" style="min-width: 130px"></Column>

            <Column header="Acciones" frozen alignFrozen="right" style="min-width: 250px">
              <template #body="slotProps">
                <div class="flex gap-2">
                  <Button
                    icon="pi pi-eye"
                    severity="info"
                    size="small"
                    rounded
                    @click="verDetalles(slotProps.data)"
                    v-tooltip.top="'Ver Detalles'"
                  />
                  <Button
                    icon="pi pi-envelope"
                    severity="secondary"
                    size="small"
                    rounded
                    @click="enviarCorreoFelicitacion(slotProps.data)"
                    v-tooltip.top="'Enviar Email'"
                  />
                  <Button
                    icon="pi pi-plus"
                    severity="success"
                    size="small"
                    rounded
                    @click="abrirAjustarPuntos(slotProps.data)"
                    v-tooltip.top="'Ajustar Puntos'"
                  />
                  <Button
                    icon="pi pi-gift"
                    severity="warning"
                    size="small"
                    rounded
                    @click="abrirCanjearPuntos(slotProps.data)"
                    v-tooltip.top="'Canjear Puntos'"
                  />
                </div>
              </template>
            </Column>
          </DataTable>
        </template>
      </Card>
    </div>

    <!-- Modal Detalles -->
    <Dialog v-model:visible="visibleDetalles" modal :style="{ width: '800px' }" header="Detalles del Cliente">
      <div v-if="selectedCliente" class="p-4">
        <div class="grid grid-cols-2 gap-4 mb-6">
          <div>
            <p class="text-sm text-gray-600 mb-1">Cliente</p>
            <p class="font-bold text-lg">{{ selectedCliente.nombre }}</p>
          </div>
          <div>
            <p class="text-sm text-gray-600 mb-1">Nivel</p>
            <Badge :value="selectedCliente.nivel" :severity="getSeveridadNivel(selectedCliente.nivel)" size="large" />
          </div>
          <div>
            <p class="text-sm text-gray-600 mb-1">Puntos Actuales</p>
            <p class="font-bold text-2xl text-yellow-600">{{ Number(selectedCliente.puntos || selectedCliente.puntos_actuales || 0).toLocaleString() }}</p>
          </div>
          <div>
            <p class="text-sm text-gray-600 mb-1">Total Gastado</p>
            <p class="font-bold text-lg">{{ formatoMonedaRD(selectedCliente.monto_total_gastado || 0) }}</p>
          </div>
          <div>
            <p class="text-sm text-gray-600 mb-1">Total Compras</p>
            <p class="font-bold text-lg">{{ selectedCliente.total_compras || 0 }}</p>
          </div>
          <div>
            <p class="text-sm text-gray-600 mb-1">Última Compra</p>
            <p class="font-bold text-lg">{{ selectedCliente.ultima_compra || 'N/A' }}</p>
          </div>
        </div>

        <Divider />

        <h3 class="font-bold text-lg mb-3">Historial de Movimientos</h3>
        <DataTable
          :value="obtenerHistorialCliente(selectedCliente.codigo)"
          scrollable
          scrollHeight="300px"
          :rows="5"
          paginator
        >
          <Column field="fecha" header="Fecha" style="min-width: 100px"></Column>
          <Column field="hora" header="Hora" style="min-width: 80px"></Column>
          <Column field="tipo_movimiento" header="Tipo" style="min-width: 100px">
            <template #body="slotProps">
              <Badge
                :value="slotProps.data.tipo_movimiento.toUpperCase()"
                :severity="slotProps.data.tipo_movimiento === 'compra' || slotProps.data.tipo_movimiento === 'ajuste' || slotProps.data.tipo_movimiento === 'cumpleanos' ? 'success' : 'danger'"
              />
            </template>
          </Column>
          <Column field="puntos" header="Puntos" style="min-width: 80px"></Column>
          <Column field="descripcion" header="Descripción" style="min-width: 200px"></Column>
        </DataTable>
      </div>
    </Dialog>

    <!-- Modal Ajustar Puntos -->
    <Dialog v-model:visible="visibleAjustar" modal :style="{ width: '500px' }" header="Ajustar Puntos">
      <div class="p-4">
        <div class="mb-4">
          <label class="block mb-2 font-semibold">Tipo de Ajuste</label>
          <SelectButton v-model="formAjuste.tipo" :options="['ganancia', 'descuento']" />
        </div>

        <div class="mb-4">
          <label class="block mb-2 font-semibold">Cantidad de Puntos</label>
          <InputNumber v-model="formAjuste.puntos" class="w-full" :min="0" />
        </div>

        <div class="mb-4">
          <label class="block mb-2 font-semibold">Descripción</label>
          <Textarea v-model="formAjuste.descripcion" rows="3" class="w-full" />
        </div>
      </div>

      <template #footer>
        <Button label="Cancelar" severity="secondary" @click="visibleAjustar = false" outlined />
        <Button label="Ajustar" severity="success" @click="ajustarPuntos" />
      </template>
    </Dialog>

    <!-- Modal Canjear Puntos -->
    <Dialog v-model:visible="visibleCanjear" modal :style="{ width: '500px' }" header="Canjear Puntos">
      <div class="p-4" v-if="selectedCliente">
        <div class="mb-4 p-4 bg-yellow-50 border-l-4 border-yellow-500 rounded">
          <p class="text-sm text-gray-700">Puntos disponibles:</p>
          <p class="text-2xl font-bold text-yellow-600">{{ Number(selectedCliente.puntos || selectedCliente.puntos_actuales || 0).toLocaleString() }}</p>
        </div>

        <div class="mb-4">
          <label class="block mb-2 font-semibold">Cantidad de Puntos a Canjear</label>
          <InputNumber v-model="formCanje.puntos" class="w-full" :min="0" :max="Number(selectedCliente.puntos || selectedCliente.puntos_actuales || 0)" />
        </div>

        <div class="mb-4">
          <label class="block mb-2 font-semibold">Descripción del Canje</label>
          <Textarea v-model="formCanje.descripcion" rows="3" class="w-full" placeholder="Ej: Descuento en compra, Regalo, etc." />
        </div>
      </div>

      <template #footer>
        <Button label="Cancelar" severity="secondary" @click="visibleCanjear = false" outlined />
        <Button label="Canjear" severity="danger" @click="canjearPuntos" />
      </template>
    </Dialog>

    <Toast />
  </main>
</template>

<style scoped>
/* Container */
.fidelizacion-container {
  padding: 1rem;
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
  min-height: 100vh;
}

/* Header */
.fidelizacion-header {
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 8px 20px rgba(245, 158, 11, 0.3);
  animation: slideIn 0.5s ease-out;
}

.fidelizacion-header-content {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.fidelizacion-icon-wrapper {
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(10px);
  width: 60px;
  height: 60px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.fidelizacion-icon {
  font-size: 1.75rem;
  color: white;
}

.fidelizacion-title {
  font-size: 1.75rem;
  font-weight: 700;
  color: white;
  margin: 0;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.fidelizacion-subtitle {
  font-size: 0.875rem;
  color: rgba(255, 255, 255, 0.9);
  margin: 0.25rem 0 0 0;
}

/* Stats Cards */
.stats-card {
  background: white;
  border-radius: 12px;
  padding: 1.25rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
  animation: fadeIn 0.5s ease-out;
  border-left: 4px solid;
}

.stats-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
}

.stats-total {
  border-left-color: #3b82f6;
}

.stats-puntos {
  border-left-color: #f59e0b;
}

.stats-icon-wrapper {
  width: 50px;
  height: 50px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
}

.stats-total .stats-icon-wrapper {
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  color: white;
}

.stats-puntos .stats-icon-wrapper {
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  color: white;
}

.stats-content {
  flex: 1;
}

.stats-label {
  font-size: 0.75rem;
  font-weight: 600;
  color: #6b7280;
  text-transform: uppercase;
  margin: 0 0 0.25rem 0;
}

.stats-value {
  font-size: 1.75rem;
  font-weight: 700;
  color: #111827;
  margin: 0;
}

/* Cards */
.toolbar-card,
.filters-card,
.datatable-card {
  border-radius: 10px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  border: none;
}

.toolbar-card :deep(.p-card-body),
.filters-card :deep(.p-card-body) {
  padding: 1rem;
}

.toolbar-card :deep(.p-card-content),
.filters-card :deep(.p-card-content) {
  padding: 0;
}

.datatable-card :deep(.p-card-body) {
  padding: 0;
}

.datatable-card :deep(.p-card-content) {
  padding: 0;
}

/* Buttons */
.btn-action {
  transition: all 0.3s ease;
  font-weight: 600;
}

.btn-action:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

/* Filter */
.filter-item {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.filter-label {
  display: flex;
  align-items: center;
  font-weight: 600;
  color: #374151;
  font-size: 0.875rem;
}

.filter-label i {
  color: #f59e0b;
}

.filter-input {
  transition: all 0.3s ease;
}

.filter-input:focus {
  border-color: #f59e0b;
  box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.1);
}

/* DataTable */
.fidelizacion-table :deep(.p-datatable-thead > tr > th) {
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  color: white;
  font-weight: 600;
  padding: 1rem 0.75rem;
  border: none;
  font-size: 0.8125rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.fidelizacion-table :deep(.p-datatable-tbody > tr) {
  transition: all 0.2s ease;
}

.fidelizacion-table :deep(.p-datatable-tbody > tr:hover) {
  background-color: #fef3c7 !important;
  transform: scale(1.001);
}

.fidelizacion-table :deep(.p-datatable-tbody > tr > td) {
  padding: 0.875rem 0.75rem;
  border-bottom: 1px solid #e5e7eb;
  color: #374151;
  font-size: 0.8125rem;
}

.fidelizacion-table :deep(.p-paginator) {
  background: #f9fafb;
  border-top: 2px solid #e5e7eb;
  padding: 0.75rem 1rem;
  border-radius: 0 0 10px 10px;
}

.fidelizacion-table :deep(.p-paginator .p-paginator-pages .p-paginator-page.p-highlight) {
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  border-color: #f59e0b;
  color: white;
}

/* Animations */
@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Responsive */
@media (max-width: 1024px) {
  .fidelizacion-container {
    padding: 0.75rem;
  }

  .fidelizacion-header {
    padding: 1rem;
  }

  .fidelizacion-title {
    font-size: 1.5rem;
  }

  .stats-card {
    padding: 1rem;
  }

  .stats-value {
    font-size: 1.5rem;
  }
}

@media (max-width: 640px) {
  .fidelizacion-container {
    padding: 0.5rem;
  }

  .fidelizacion-header-content {
    flex-direction: column;
    text-align: center;
  }

  .fidelizacion-title {
    font-size: 1.25rem;
  }
}
</style>
