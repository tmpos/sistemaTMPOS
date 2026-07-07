# Mejoras para TM-POS

Sistema de análisis basado en la revisión completa del código fuente v49.6.0.

---

## Crítico

- [x] **Pruebas automatizadas (iniciado)** — Vitest + @vue/test-utils + jsdom instalados. Primer test suite: `useDelivery.spec.js` (9 tests). Falta expandir cobertura.
  - [x] Vitest configurado con alias `@/`
  - [x] `useDelivery.spec.js` — 9 tests de unidad
  - [ ] Tests para funciones.js
  - [ ] Tests para funcionesVentas.js
  - [ ] Tests para componentes (Vue Test Utils)
  - [ ] Tests e2e (Playwright/Cypress)
- [ ] **CI/CD** — No hay pipelines automatizados (GitHub Actions, etc.). Cada build es manual.
- [x] **Descomposición de monolitos (Fase 1)** — `Vender.vue` (~28K → ~28.1K). Extraído `TabDelivery.vue` (~200 líneas). Pendiente: Taller, Configuración, Pedidos, POS, Clientes, Documentos, Venta, Sidebar, Dialogs.
  - [x] `TabDelivery.vue` — Componente extraído
  - [x] `useDelivery.js` — Composable compartido (colores, estilos)
  - [ ] `useTaller.js` — Composable para taller
  - [ ] `usePedidosPendientes.js` — Composable para pedidos pendientes
  - [ ] TabTaller.vue, TabConfiguracion.vue, TabPedidos.vue, TabPOS.vue, TabClientes.vue, TabDocumentos.vue

## Arquitectura

- [ ] **TypeScript** — Migrar de JS plano a TS para reducir bugs y mejorar mantenibilidad.
- [ ] **Separación backend/frontend** — Hoy la lógica de negocio vive en el renderer de Electron. Un backend independiente permitiría multi-tenencia y versión web.
- [ ] **Docker** — Contenerizar para despliegues reproducibles.

## Seguridad

- [ ] **Eliminar tokens hardcodeados** — `VITE_TOKEN`, `VITE_TOKEN_CORTO` deben ir en variables de entorno o vault.
- [ ] **Revisar ventanas inseguras** — Ventanas de impresión con `nodeIntegration: true` y `contextIsolation: false`.
- [ ] **Sanitización de inputs** — En el código de scraping web no se validan entradas.

## Operaciones

- [ ] **Monitoreo de errores** — Integrar Sentry o similar para capturar crashes en cliente.
- [ ] **Backups automáticos** — Programar respaldos de SQLite (locales y/o cloud).
- [ ] **Modo multi-tenant/cloud** — Sincronización entre sucursales en tiempo real.

## Mobile

- [ ] **Soporte iOS** — Capacitor hoy solo configurado para Android.

## Calidad

- [ ] **Linter automático en CI** — ESLint existe pero no se ejecuta en pipelines.
- [ ] **Eliminar dependencias muertas** — jQuery, Bootstrap 5 y Bootswatch conviven con Vue 3 + Tailwind.
- [ ] **Guía de contribución** — Crear `CONTRIBUTING.md` con estándares para nuevos desarrolladores.

---

> Generado el 2026-07-06
