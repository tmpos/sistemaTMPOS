<template>
  <div class="p-8 space-y-8 bg-gray-50 dark:bg-gray-900 min-h-screen">
    <div class="max-w-4xl mx-auto">
      <h1 class="text-4xl font-bold text-gray-900 dark:text-white mb-4">
        OptionButtomTM - Ejemplos de Uso
      </h1>
      <p class="text-gray-600 dark:text-gray-400 mb-8">
        Componente basado en SelectButton de PrimeVue con diseño mejorado
      </p>

      <!-- Ejemplo 1: Uso Básico -->
      <Card class="mb-8">
        <template #header>
          <div class="bg-blue-500 text-white p-4">
            <h2 class="text-xl font-bold">1. Uso Básico</h2>
          </div>
        </template>
        <template #content>
          <OptionButtomTM
            v-model="example1"
            :options="['RNC', 'CEDULA', 'PASAPORTE']"
            label="Tipo de Documento"
          />
          <p class="mt-4 text-sm text-gray-600 dark:text-gray-400">
            Valor seleccionado: <strong>{{ example1 }}</strong>
          </p>

          <Divider />

          <pre class="bg-gray-800 text-green-400 p-4 rounded-lg overflow-x-auto"><code>&lt;OptionButtomTM
  v-model="documentType"
  :options="['RNC', 'CEDULA', 'PASAPORTE']"
  label="Tipo de Documento"
/&gt;</code></pre>
        </template>
      </Card>

      <!-- Ejemplo 2: Con Iconos -->
      <Card class="mb-8">
        <template #header>
          <div class="bg-purple-500 text-white p-4">
            <h2 class="text-xl font-bold">2. Con Iconos en Opciones</h2>
          </div>
        </template>
        <template #content>
          <OptionButtomTM
            v-model="example2"
            :options="paymentOptions"
            label="Método de Pago"
            label-icon="pi pi-wallet"
            option-label="name"
            option-value="code"
            option-icon="icon"
          />
          <p class="mt-4 text-sm text-gray-600 dark:text-gray-400">
            Valor seleccionado: <strong>{{ example2 }}</strong>
          </p>

          <Divider />

          <pre class="bg-gray-800 text-green-400 p-4 rounded-lg overflow-x-auto"><code>&lt;OptionButtomTM
  v-model="paymentMethod"
  :options="[
    { name: 'Efectivo', code: 'cash', icon: 'pi pi-money-bill' },
    { name: 'Tarjeta', code: 'card', icon: 'pi pi-credit-card' },
    { name: 'Transferencia', code: 'transfer', icon: 'pi pi-send' }
  ]"
  label="Método de Pago"
  label-icon="pi pi-wallet"
  option-label="name"
  option-value="code"
  option-icon="icon"
/&gt;</code></pre>
        </template>
      </Card>

      <!-- Ejemplo 3: Con Descripción y Ayuda -->
      <Card class="mb-8">
        <template #header>
          <div class="bg-green-500 text-white p-4">
            <h2 class="text-xl font-bold">3. Con Descripción y Texto de Ayuda</h2>
          </div>
        </template>
        <template #content>
          <OptionButtomTM
            v-model="example3"
            :options="['Mensual', 'Trimestral', 'Anual']"
            label="Plan de Suscripción"
            label-icon="pi pi-calendar"
            description="Seleccione la frecuencia de facturación"
            help-text="El plan anual incluye 2 meses gratis"
          />
          <p class="mt-4 text-sm text-gray-600 dark:text-gray-400">
            Valor seleccionado: <strong>{{ example3 }}</strong>
          </p>

          <Divider />

          <pre class="bg-gray-800 text-green-400 p-4 rounded-lg overflow-x-auto"><code>&lt;OptionButtomTM
  v-model="subscription"
  :options="['Mensual', 'Trimestral', 'Anual']"
  label="Plan de Suscripción"
  label-icon="pi pi-calendar"
  description="Seleccione la frecuencia de facturación"
  help-text="El plan anual incluye 2 meses gratis"
/&gt;</code></pre>
        </template>
      </Card>

      <!-- Ejemplo 4: Campo Requerido con Error -->
      <Card class="mb-8">
        <template #header>
          <div class="bg-red-500 text-white p-4">
            <h2 class="text-xl font-bold">4. Campo Requerido con Validación</h2>
          </div>
        </template>
        <template #content>
          <OptionButtomTM
            v-model="example4"
            :options="['Si', 'No']"
            label="¿Acepta los términos y condiciones?"
            label-icon="pi pi-shield"
            required
            :error-message="example4 === 'No' ? 'Debe aceptar los términos para continuar' : ''"
          />
          <p class="mt-4 text-sm text-gray-600 dark:text-gray-400">
            Valor seleccionado: <strong>{{ example4 }}</strong>
          </p>

          <Divider />

          <pre class="bg-gray-800 text-green-400 p-4 rounded-lg overflow-x-auto"><code>&lt;OptionButtomTM
  v-model="acceptTerms"
  :options="['Si', 'No']"
  label="¿Acepta los términos y condiciones?"
  label-icon="pi pi-shield"
  required
  :error-message="acceptTerms === 'No' ? 'Debe aceptar los términos' : ''"
/&gt;</code></pre>
        </template>
      </Card>

      <!-- Ejemplo 5: Tamaños -->
      <Card class="mb-8">
        <template #header>
          <div class="bg-indigo-500 text-white p-4">
            <h2 class="text-xl font-bold">5. Diferentes Tamaños</h2>
          </div>
        </template>
        <template #content>
          <div class="space-y-6">
            <OptionButtomTM
              v-model="example5Small"
              :options="['Pequeño', 'A', 'B']"
              label="Tamaño Small"
              size="small"
            />

            <OptionButtomTM
              v-model="example5Normal"
              :options="['Normal', 'A', 'B']"
              label="Tamaño Normal (Default)"
              size="normal"
            />

            <OptionButtomTM
              v-model="example5Large"
              :options="['Grande', 'A', 'B']"
              label="Tamaño Large"
              size="large"
            />
          </div>

          <Divider />

          <pre class="bg-gray-800 text-green-400 p-4 rounded-lg overflow-x-auto"><code>&lt;!-- Small --&gt;
&lt;OptionButtomTM size="small" ... /&gt;

&lt;!-- Normal (default) --&gt;
&lt;OptionButtomTM size="normal" ... /&gt;

&lt;!-- Large --&gt;
&lt;OptionButtomTM size="large" ... /&gt;</code></pre>
        </template>
      </Card>

      <!-- Ejemplo 6: Deshabilitado -->
      <Card class="mb-8">
        <template #header>
          <div class="bg-gray-500 text-white p-4">
            <h2 class="text-xl font-bold">6. Estado Deshabilitado</h2>
          </div>
        </template>
        <template #content>
          <OptionButtomTM
            v-model="example6"
            :options="['Opción 1', 'Opción 2', 'Opción 3']"
            label="Campo Deshabilitado"
            disabled
            help-text="Este campo está deshabilitado"
          />

          <Divider />

          <pre class="bg-gray-800 text-green-400 p-4 rounded-lg overflow-x-auto"><code>&lt;OptionButtomTM
  v-model="field"
  :options="['Opción 1', 'Opción 2', 'Opción 3']"
  label="Campo Deshabilitado"
  disabled
/&gt;</code></pre>
        </template>
      </Card>

      <!-- Ejemplo 7: Opciones de Estado -->
      <Card class="mb-8">
        <template #header>
          <div class="bg-teal-500 text-white p-4">
            <h2 class="text-xl font-bold">7. Selector de Estado con Iconos</h2>
          </div>
        </template>
        <template #content>
          <OptionButtomTM
            v-model="example7"
            :options="statusOptions"
            label="Estado del Usuario"
            label-icon="pi pi-user"
            option-label="label"
            option-value="value"
            option-icon="icon"
            description="Seleccione el estado del usuario en el sistema"
          />
          <p class="mt-4 text-sm text-gray-600 dark:text-gray-400">
            Valor seleccionado: <strong>{{ example7 }}</strong>
          </p>

          <Divider />

          <pre class="bg-gray-800 text-green-400 p-4 rounded-lg overflow-x-auto"><code>&lt;OptionButtomTM
  v-model="userStatus"
  :options="[
    { label: 'Activo', value: 'active', icon: 'pi pi-check-circle' },
    { label: 'Inactivo', value: 'inactive', icon: 'pi pi-times-circle' },
    { label: 'Bloqueado', value: 'blocked', icon: 'pi pi-ban' }
  ]"
  label="Estado del Usuario"
  label-icon="pi pi-user"
  option-label="label"
  option-value="value"
  option-icon="icon"
/&gt;</code></pre>
        </template>
      </Card>

      <!-- Propiedades del Componente -->
      <Card class="mb-8">
        <template #header>
          <div class="bg-orange-500 text-white p-4">
            <h2 class="text-xl font-bold">📋 Propiedades Disponibles</h2>
          </div>
        </template>
        <template #content>
          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead class="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Propiedad</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Tipo</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Default</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Descripción</th>
                </tr>
              </thead>
              <tbody class="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                <tr>
                  <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">modelValue</td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">String|Number|Object</td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">-</td>
                  <td class="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">Valor seleccionado (v-model)</td>
                </tr>
                <tr>
                  <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">options</td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">Array</td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">['RNC', 'CEDULA']</td>
                  <td class="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">Array de opciones (strings u objetos)</td>
                </tr>
                <tr>
                  <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">label</td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">String</td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">-</td>
                  <td class="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">Label principal</td>
                </tr>
                <tr>
                  <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">labelIcon</td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">String</td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">-</td>
                  <td class="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">Clase de icono para el label (ej: 'pi pi-home')</td>
                </tr>
                <tr>
                  <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">description</td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">String</td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">-</td>
                  <td class="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">Texto descriptivo debajo del label</td>
                </tr>
                <tr>
                  <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">helpText</td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">String</td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">-</td>
                  <td class="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">Texto de ayuda debajo del componente</td>
                </tr>
                <tr>
                  <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">errorMessage</td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">String</td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">-</td>
                  <td class="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">Mensaje de error (con animación)</td>
                </tr>
                <tr>
                  <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">required</td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">Boolean</td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">false</td>
                  <td class="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">Marca el campo como requerido (*)</td>
                </tr>
                <tr>
                  <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">disabled</td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">Boolean</td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">false</td>
                  <td class="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">Deshabilita el componente</td>
                </tr>
                <tr>
                  <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">size</td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">String</td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">'normal'</td>
                  <td class="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">'small', 'normal', 'large'</td>
                </tr>
              </tbody>
            </table>
          </div>
        </template>
      </Card>

    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import OptionButtomTM from './OptionButtomTM.vue';
import Card from 'primevue/card';
import Divider from 'primevue/divider';

// Estados de los ejemplos
const example1 = ref('RNC');
const example2 = ref('cash');
const example3 = ref('Mensual');
const example4 = ref('Si');
const example5Small = ref('Pequeño');
const example5Normal = ref('Normal');
const example5Large = ref('Grande');
const example6 = ref('Opción 1');
const example7 = ref('active');

// Opciones con objetos
const paymentOptions = ref([
  { name: 'Efectivo', code: 'cash', icon: 'pi pi-money-bill' },
  { name: 'Tarjeta', code: 'card', icon: 'pi pi-credit-card' },
  { name: 'Transferencia', code: 'transfer', icon: 'pi pi-send' }
]);

const statusOptions = ref([
  { label: 'Activo', value: 'active', icon: 'pi pi-check-circle' },
  { label: 'Inactivo', value: 'inactive', icon: 'pi pi-times-circle' },
  { label: 'Bloqueado', value: 'blocked', icon: 'pi pi-ban' }
]);
</script>

<style scoped>
pre {
  font-family: 'Courier New', monospace;
  white-space: pre-wrap;
  word-wrap: break-word;
}

table {
  font-size: 0.875rem;
}
</style>
