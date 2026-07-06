<script setup>
import { ref, onMounted, nextTick, watchEffect } from 'vue';
import { useToast } from "primevue/usetoast";
import { useRouter,useRoute } from 'vue-router';
const router = useRouter();
const route = useRoute(); 
import { enviarDatosPorPost, eliminarDatos, obtenerIdsSeleccionados, borrarTodoslosDatos, lenguajeDataTable, nfecha, arrayToObjetoFromTabla, peticionesFetch, encryptarPassword, envioElectron, generadorCodigo, generarCodigoUnico, peticiones, sumaFiscal, mensajetoast, lasMayusculas, peticionesFetchOffline, arrayToObjetoFromTablaOffline, crearTablaSiNoExisteOffline } from '../../funciones/funciones.js';
import Swal from 'sweetalert2'
const toast = useToast();
import Awesomplete from '../../components/Awesomplete.vue';
/************************************************************************/
//import config from '../../../../../resources/config.json';
/************************************************************************/
document.body.classList.add('sidebar-close');
/************************************************************************/
import {useDatosEmpresa} from '../../stores'
const datosEmpresa = useDatosEmpresa();
const link = ref('');
const api = ref('');
const token = ref('');
const patronTelefono = ref('');
const linkImpresora = ref('');
const patroncedula = ref('');
const tokenCifrado = ref(null);
/************************************************************************/
const datoscamposNotacredito = ref({})
const codigoUnico = ref(generarCodigoUnico());
const fecha = ref(nfecha('fecha'));
const listaBuscador = ref([]);
const arrayCliente = ref([]);
const listaBuscadorNombre = ref([]);
const listaBuscadorCodigo = ref([]);
const arrayFacturas = ref([]);
const objetoConfiscal = ref({});
const camposArray = ["no_credito","no_factura","b04","ncf","cliente","cod_cliente","concepto","total","fecha","hora","nota","estado","fecha_uso","hora_uso","usuario","created_at","updated_at"];
/************************************************************************/
/************************************************************************/
const fetchAndSetupData = async () => {
    const jsonData = await arrayToObjetoFromTablaOffline('notacredito');
    datoscamposNotacredito.value = jsonData;
      const ultimaFactura = await peticionesFetchOffline('getMaxValue', 'notacredito', 'no_credito');
      datoscamposNotacredito.value.no_credito = generadorCodigo(ultimaFactura[0], '', 7);
      datoscamposNotacredito.value.estado = 'DISPONIBLE';
      datoscamposNotacredito.value.fecha_uso = '';
      datoscamposNotacredito.value.hora_uso = '';

      const arrayConfiscal = await peticionesFetchOffline('getDataAsArray', 'confiscal');
      
      const ultimaB04 = arrayConfiscal.find(tipo=>tipo.prefijo == 'B04')  

      objetoConfiscal.value = ultimaB04;
      datoscamposNotacredito.value.b04 = generadorCodigo(ultimaB04.contador, 'B04', 8);

};
/************************************************************************/
const fetchfacturas = async () => {
   const response = await peticionesFetchOffline('getDataAsArray', 'facturas');
   arrayFacturas.value = response;

    let arraybuscador = [];
    response.forEach((index) => {
        const keys = Object.keys(index);
        const values = Object.values(index);
        for (let i = 0; i < keys.length; i++) {
            if (keys[i] === 'no_factura') {
                arraybuscador.push(values[i]);
            }
        }
    });
    listaBuscador.value = arraybuscador;



};
/************************************************************************/
const fetchClientes = async () => {
   const response = await peticionesFetchOffline('getDataAsArray', 'clientes');
   arrayCliente.value = response;
   listaBuscadorNombre.value = response.map(cliente=>cliente.nombre)
   listaBuscadorCodigo.value = response.map(cliente=>cliente.codigo)


};
/************************************************************************/
onMounted(async() => {


const datosJSON = await envioElectron('datosarchivo');
link.value = datosJSON.VITE_LINKURL;
api.value = datosJSON.VITE_LINK_API;
token.value = datosJSON.VITE_TOKEN;
patronTelefono.value = datosJSON.VITE_PATRON_TELEFONO;
linkImpresora.value = datosJSON.VITE_IMPRESORA_LOCAL;
patroncedula.value = datosJSON.VITE_PATRON_CEDULA;

tokenCifrado.value = await encryptarPassword(token.value, 10);
    if (!datosEmpresa.empresa.nombre) {
    await datosEmpresa.inicializarDatosEmpresa(link.value+api.value);
  }

await crearTablaSiNoExisteOffline('notacredito', camposArray, toast);
await fetchAndSetupData()
await fetchfacturas()
await fetchClientes()

      datoscamposNotacredito.value.total = '0.00'
      datoscamposNotacredito.value.fecha = nfecha('fecha')
      datoscamposNotacredito.value.hora = nfecha('hora')
      datoscamposNotacredito.value.estado = 'DISPONIBLE'
      datoscamposNotacredito.value.fecha_uso = ''
      datoscamposNotacredito.value.hora_uso = ''

});
/************************************************************************/
async function enviarDatos(event) {
    event.preventDefault();
  const url = link.value+api.value+"/insertar/notacredito";
  if (!datoscamposNotacredito.value) {
    toast.add({ severity: 'error', summary: 'Error', detail: 'Datos incompletos, no se puede Enviar.', life: 3000 });
    return;
  }
  if (datoscamposNotacredito.value.hasOwnProperty('created_at')) {
     datoscamposNotacredito.value.created_at = nfecha('timestamp')
     datoscamposNotacredito.value.updated_at = nfecha('timestamp')
    }
  datoscamposNotacredito.value.estado = datoscamposNotacredito.value.estado || 'DISPONIBLE'
  datoscamposNotacredito.value.fecha_uso = datoscamposNotacredito.value.fecha_uso || ''
  datoscamposNotacredito.value.hora_uso = datoscamposNotacredito.value.hora_uso || ''
  const envioDatos = await peticionesFetchOffline('insertData', 'notacredito', JSON.stringify(datoscamposNotacredito.value));
  if (envioDatos[0] == 'ok') {
    await sumaFiscal(link.value,api.value,objetoConfiscal.value,'B04',tokenCifrado.value);
     toast.add({ severity: 'success', summary: 'Ē%xito', detail: 'Datos Agregados con Ēøxito.', life: 3000 });
Swal.fire({
  title: "Datos Agregados",
  text: "Que hacemos ahora?",
  icon: "warning",
  showCancelButton: true,
  confirmButtonText: "Agregar Otro!",
  cancelButtonText: "No, Regresar al Inicio!",
 }).then(async(result) => {
  if (result.isConfirmed) {
      fetchAndSetupData()
} else if (result.dismiss === Swal.DismissReason.cancel) {
    router.push({ path: `/notacredito` });
  }
})
  }else{
    toast.add({ severity: 'error', summary: 'Error', detail: 'Fallo al Agregar los datos.', life: 3000 });
  }
}
/************************************************************************/
const fnAwesomplete = ()=>{

}
const handleSelectComplete = (selected)=>{

    const datosFactura = arrayFacturas.value.find((factura) =>
        factura.no_factura === selected.value
    );

    if (datosFactura) {
      const productos = JSON.parse(datosFactura.productos);
      datoscamposNotacredito.value.concepto = `PRODUCTOS DEVUELTOS (` +productos.map(prod=>prod.nombre).join(',')+')'
      datoscamposNotacredito.value.ncf = datosFactura.comprobante
      datoscamposNotacredito.value.cliente = datosFactura.nombre_cliente
      datoscamposNotacredito.value.cod_cliente = datosFactura.cod_cliente
      datoscamposNotacredito.value.total = datosFactura.total
      datoscamposNotacredito.value.fecha = nfecha('fecha')
      datoscamposNotacredito.value.hora = nfecha('hora')


    } else {
        toast.add({ severity: 'error', summary: 'Error', detail: 'No se Encuentra la Factura', life: 3000 });
    }

}
/************************************************************************/
const fnAwesompleteNombre = ()=>{

}
const handleSelectCompleteNombre = (selected)=>{
    const datosCliente = arrayCliente.value.find(cliente=>cliente.nombre == selected.value)
    datoscamposNotacredito.value.cod_cliente = datosCliente.codigo
}
/************************************************************************/
const fnAwesompleteCodigo = ()=>{

}
const handleSelectCompleteCodigo = (selected)=>{
    const datosCliente = arrayCliente.value.find(cliente=>cliente.codigo == selected.value)
    datoscamposNotacredito.value.cliente = datosCliente.nombre
}
/************************************************************************/
</script>
<template>
  <main class="create-credit-wrapper">
    <div class="max-w-6xl mx-auto px-4 py-6 space-y-6">
      <section class="credit-hero shadow-lg">
        <div class="credit-hero__text">
          <p class="eyebrow">Crear nota de credito</p>
          <h1>Registrar nueva nota</h1>
          <p>Completa los campos, vincula la factura y deja asentado el ajuste de credito.</p>
          <div class="credit-hero__meta">
            <span class="meta-pill">
              <i class="pi pi-hashtag"></i>
              No. {{ datoscamposNotacredito.no_credito || '---' }}
            </span>
            <span class="meta-pill">
              <i class="pi pi-calendar"></i>
              {{ datoscamposNotacredito.fecha || nfecha('fecha') }}
            </span>
          </div>
        </div>
        <div class="credit-hero__actions">
          <div class="primary-actions">
            <router-link to="/notacredito">
              <Button icon="pi pi-arrow-left" label="Volver al listado" severity="secondary" outlined />
            </router-link>
            <Button icon="pi pi-save" label="Guardar nota" severity="primary" @click="enviarDatos" />
          </div>
        </div>
      </section>

      <section class="panel shadow-md">
        <div class="panel__header">
          <div>
            <p class="eyebrow">Formulario</p>
            <h2>Datos de la nota</h2>
            <span class="helper-text">Asocia la factura, cliente y describe el motivo de la nota.</span>
          </div>
        </div>

        <form @submit.prevent="enviarDatos">
          <div class="form-grid">
            <div class="field">
              <label for="no_creditoAgregarDatos">No credito</label>
              <input id="no_creditoAgregarDatos" v-model="datoscamposNotacredito.no_credito" type="text" placeholder="No credito" maxlength="250" />
            </div>
            <div class="field">
              <label for="no_facturaAgregarDatos">No factura</label>
              <awesomplete
                id="no_facturaAgregarDatos"
                class="form-control"
                v-model="datoscamposNotacredito.no_factura"
                @change="fnAwesomplete"
                @selectComplete="handleSelectComplete"
                ref="awesompleteInput"
                :list="listaBuscador"
              />
            </div>
            <div class="field">
              <label for="b04AgregarDatos">B04</label>
              <input id="b04AgregarDatos" v-model="datoscamposNotacredito.b04" type="text" placeholder="B04" readonly />
            </div>
            <div class="field">
              <label for="ncfAgregarDatos">NCF</label>
              <input id="ncfAgregarDatos" v-model="datoscamposNotacredito.ncf" type="text" placeholder="NCF" />
            </div>
            <div class="field full">
              <label for="clienteAgregarDatos">Cliente</label>
              <awesomplete
                id="clienteAgregarDatos"
                class="form-control"
                v-model="datoscamposNotacredito.cliente"
                @change="fnAwesompleteNombre"
                @selectComplete="handleSelectCompleteNombre"
                ref="awesompleteInputNombre"
                :list="listaBuscadorNombre"
              />
            </div>
            <div class="field">
              <label for="cod_clienteAgregarDatos">Codigo cliente</label>
              <awesomplete
                id="cod_clienteAgregarDatos"
                class="form-control"
                v-model="datoscamposNotacredito.cod_cliente"
                @change="fnAwesompleteCodigo"
                @selectComplete="handleSelectCompleteCodigo"
                ref="awesompleteInputCodigo"
                :list="listaBuscadorCodigo"
              />
            </div>
            <div class="field full">
              <label for="conceptoAgregarDatos">Concepto</label>
              <textarea id="conceptoAgregarDatos" v-model="datoscamposNotacredito.concepto" rows="3" placeholder="Detalle de la nota"></textarea>
            </div>
            <div class="field">
              <label for="totalAgregarDatos">Total</label>
              <input id="totalAgregarDatos" v-model="datoscamposNotacredito.total" type="text" placeholder="Total" maxlength="250" />
            </div>
            <div class="field">
              <label for="estadoAgregarDatos">Estado</label>
              <select id="estadoAgregarDatos" v-model="datoscamposNotacredito.estado">
                <option value="DISPONIBLE">DISPONIBLE</option>
                <option value="USADA">USADA</option>
              </select>
            </div>
            <div class="field">
              <label for="fechaAgregarDatos">Fecha</label>
              <input id="fechaAgregarDatos" v-model="datoscamposNotacredito.fecha" type="text" placeholder="Fecha" maxlength="250" />
            </div>
            <div class="field">
              <label for="horaAgregarDatos">Hora</label>
              <input id="horaAgregarDatos" v-model="datoscamposNotacredito.hora" type="text" placeholder="Hora" maxlength="250" />
            </div>
            <div class="field full">
              <label for="notaAgregarDatos">Nota</label>
              <textarea id="notaAgregarDatos" v-model="datoscamposNotacredito.nota" rows="3" placeholder="Nota adicional"></textarea>
            </div>
          </div>
          <div class="form-footer">
            <Button type="submit" icon="pi pi-save" label="Agregar nota" severity="primary" class="w-full md:w-auto" />
          </div>
        </form>
      </section>
      <Toast />
    </div>
  </main>
</template>
<style scoped>
.create-credit-wrapper {
  min-height: 100vh;
  background: linear-gradient(180deg, #f8fafc 0%, #eef2ff 45%, #ffffff 100%);
  color: #0f172a;
}

.credit-hero {
  background: linear-gradient(135deg, #0f172a, #1e293b 45%, #0ea5e9);
  color: #e2e8f0;
  border-radius: 18px;
  padding: 24px;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 20px;
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.credit-hero__text h1 {
  margin: 4px 0 8px;
  font-size: 1.8rem;
  font-weight: 800;
}

.credit-hero__text p {
  margin: 0;
  color: #cbd5e1;
}

.credit-hero__meta {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  margin-top: 12px;
}

.meta-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: rgba(226, 232, 240, 0.12);
  color: #e2e8f0;
  padding: 8px 12px;
  border-radius: 9999px;
  font-size: 0.9rem;
  border: 1px solid rgba(226, 232, 240, 0.2);
}

.credit-hero__actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
}

.primary-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.panel {
  background: #ffffff;
  border-radius: 14px;
  border: 1px solid #e2e8f0;
  padding: 20px;
}

.panel__header {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: flex-start;
  flex-wrap: wrap;
  border-bottom: 1px solid #e2e8f0;
  padding-bottom: 14px;
}

.panel__header h2 {
  margin: 2px 0 4px;
  font-size: 1.4rem;
  color: #0f172a;
}

.helper-text {
  color: #64748b;
  font-size: 0.95rem;
}

.eyebrow {
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-weight: 700;
  color: #0ea5e9;
  margin: 0;
  font-size: 0.85rem;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 14px;
  margin-top: 16px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.field.full {
  grid-column: 1 / -1;
}

.field label {
  font-weight: 700;
  color: #0f172a;
  font-size: 0.95rem;
}

.field input,
.field textarea {
  width: 100%;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 10px 12px;
  font-size: 0.95rem;
  color: #0f172a;
  background: #f8fafc;
  outline: none;
}

.field input:focus,
.field textarea:focus {
  border-color: #0ea5e9;
  box-shadow: 0 0 0 2px rgba(14, 165, 233, 0.15);
}

.form-footer {
  margin-top: 18px;
  display: flex;
  justify-content: flex-end;
}

@media (max-width: 768px) {
  .credit-hero {
    padding: 18px;
  }

  .panel {
    padding: 16px;
  }

  .primary-actions {
    flex-direction: column;
  }

  .form-footer {
    justify-content: stretch;
  }
}
</style>
