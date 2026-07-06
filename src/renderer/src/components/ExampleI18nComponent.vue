<script setup>
import { useI18n } from 'vue-i18n';
import { computed } from 'vue';

const { t, locale } = useI18n();

// Ejemplo de uso de traducciones en JavaScript
const welcomeMessage = computed(() => t('Welcome'));
const currentLocale = computed(() => locale.value);

// Función que usa traducciones
const showAlert = () => {
  alert(t('Success') + '!');
};
</script>

<template>
  <div class="p-4">
    <h1 class="text-2xl font-bold mb-4">{{ $t('Dashboard') }}</h1>

    <div class="card p-4 mb-4">
      <h2>{{ welcomeMessage }}</h2>
      <p>{{ $t('Hello') }}, {{ $t('User') }}!</p>
      <p>{{ $t('Language') }}: {{ currentLocale }}</p>
    </div>

    <div class="card p-4 mb-4">
      <h3 class="mb-2">{{ $t('Actions') }}</h3>
      <div class="flex gap-2">
        <Button :label="$t('Save')" @click="showAlert" icon="pi pi-check" />
        <Button :label="$t('Cancel')" severity="secondary" icon="pi pi-times" />
        <Button :label="$t('Delete')" severity="danger" icon="pi pi-trash" />
      </div>
    </div>

    <div class="card p-4 mb-4">
      <h3 class="mb-2">{{ $t('Form Elements') }}</h3>
      <div class="flex flex-col gap-3">
        <InputText :placeholder="$t('Search...')" />
        <Button :label="$t('Confirm')" />
        <Button :label="$t('Close')" severity="secondary" outlined />
      </div>
    </div>

    <div class="card p-4">
      <h3 class="mb-2">{{ $t('Notifications') }}</h3>
      <Message :severity="'success'" :closable="false">
        {{ $t('Success') }}: {{ $t('Update') }}
      </Message>
      <Message :severity="'warn'" :closable="false" class="mt-2">
        {{ $t('Warning') }}: {{ $t('Please wait') }}
      </Message>
      <Message :severity="'info'" :closable="false" class="mt-2">
        {{ $t('Info') }}: {{ $t('Loading') }}...
      </Message>
    </div>
  </div>
</template>

<style scoped>
.card {
  background: var(--surface-card);
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}
</style>
