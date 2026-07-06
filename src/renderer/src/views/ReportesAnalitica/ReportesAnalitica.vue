<template>
  <main class="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-slate-900 dark:to-indigo-950 py-6 px-4 sm:px-6 lg:px-8">
    <div class="max-w-7xl mx-auto">

      <!-- Header Principal -->
      <div class="mb-8 space-y-4">
        <!-- Breadcrumb -->
        <nav class="flex items-center space-x-2 text-sm">
          <i class="pi pi-home text-blue-600 dark:text-blue-400"></i>
          <i class="pi pi-angle-right text-gray-400"></i>
          <span class="text-gray-600 dark:text-gray-400">Reportes</span>
          <i class="pi pi-angle-right text-gray-400"></i>
          <span class="font-semibold text-gray-900 dark:text-white">Analítica</span>
        </nav>

        <!-- Header Card -->
        <div class="relative overflow-hidden rounded-3xl bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 p-8 shadow-2xl">
          <div class="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl"></div>
          <div class="relative flex flex-col md:flex-row items-center justify-between gap-6">
            <div class="flex items-center gap-6">
              <div class="relative">
                <div class="absolute inset-0 bg-white/20 rounded-2xl blur-xl"></div>
                <div class="relative bg-white/10 backdrop-blur-xl p-5 rounded-2xl border border-white/20 shadow-xl">
                  <i class="pi pi-chart-bar text-5xl text-white"></i>
                </div>
              </div>
              <div class="text-white">
                <h1 class="text-4xl font-black mb-2 tracking-tight">Reportes y Analítica</h1>
                <p class="text-pink-100 text-lg font-medium">Dashboard completo de métricas del negocio</p>
              </div>
            </div>

            <div class="flex gap-2">
              <Button icon="pi pi-refresh" label="Refrescar" severity="contrast" outlined @click="refrescarTodo" />
              <Button icon="pi pi-download" label="Exportar" severity="contrast" outlined @click="exportarDatos" />
            </div>
          </div>
        </div>
      </div>

      <!-- TabView Principal -->
      <TabView class="reportes-tabs">

        <!-- ═══════════════════════════════════════════════════════════ -->
        <!-- TAB 1: VENTAS -->
        <!-- ═══════════════════════════════════════════════════════════ -->
        <TabPanel>
          <template #header>
            <div class="flex items-center gap-2 px-4 py-2">
              <i class="pi pi-dollar text-xl"></i>
              <span class="font-bold">Ventas</span>
            </div>
          </template>

          <div class="space-y-6">
            <!-- Filtros de Ventas -->
            <Card class="modern-panel">
              <template #content>
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4 p-4">
                  <div>
                    <label class="block text-sm font-semibold mb-2">Rango de Fechas</label>
                    <Calendar v-model="rangoFechasVentas" selectionMode="range" dateFormat="yy-mm-dd"
                      @update:modelValue="cargarVentas" class="w-full" showIcon />
                  </div>
                  <div>
                    <label class="block text-sm font-semibold mb-2">Vendedor</label>
                    <Dropdown v-model="vendedorSeleccionado" :options="vendedores" optionLabel="label"
                      placeholder="Todos los vendedores" class="w-full" showClear />
                  </div>
                  <div>
                    <label class="block text-sm font-semibold mb-2">Almacén</label>
                    <Dropdown v-model="almacenSeleccionado" :options="almacenes" optionLabel="label"
                      placeholder="Todos los almacenes" class="w-full" showClear />
                  </div>
                </div>
              </template>
            </Card>

            <!-- Cards de Resumen -->
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card class="stats-card rounded-xl" style="background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);">
                <template #content>
                  <div class="flex items-center justify-between p-4">
                    <div>
                      <p class="text-blue-100 text-sm font-semibold">Total Ventas</p>
                      <p class="text-white text-3xl font-black">{{ formatoMonedaRD(ventasResumen.totalVentas) }}</p>
                    </div>
                    <div class="bg-white/20 p-4 rounded-xl">
                      <i class="pi pi-chart-line text-3xl text-white"></i>
                    </div>
                  </div>
                </template>
              </Card>

              <Card class="stats-card rounded-xl" style="background: linear-gradient(135deg, #10b981 0%, #059669 100%);">
                <template #content>
                  <div class="flex items-center justify-between p-4">
                    <div>
                      <p class="text-green-100 text-sm font-semibold">Ganancia</p>
                      <p class="text-white text-3xl font-black">{{ formatoMonedaRD(ventasResumen.totalGanancia) }}</p>
                    </div>
                    <div class="bg-white/20 p-4 rounded-xl">
                      <i class="pi pi-money-bill text-3xl text-white"></i>
                    </div>
                  </div>
                </template>
              </Card>

              <Card class="stats-card rounded-xl" style="background: linear-gradient(135deg, #a855f7 0%, #9333ea 100%);">
                <template #content>
                  <div class="flex items-center justify-between p-4">
                    <div>
                      <p class="text-purple-100 text-sm font-semibold">Impuestos</p>
                      <p class="text-white text-3xl font-black">{{ formatoMonedaRD(ventasResumen.totalImpuestos) }}</p>
                    </div>
                    <div class="bg-white/20 p-4 rounded-xl">
                      <i class="pi pi-percentage text-3xl text-white"></i>
                    </div>
                  </div>
                </template>
              </Card>

              <Card class="stats-card rounded-xl" style="background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);">
                <template #content>
                  <div class="flex items-center justify-between p-4">
                    <div>
                      <p class="text-orange-100 text-sm font-semibold">Tickets</p>
                      <p class="text-white text-3xl font-black">{{ ventasResumen.cantidadTickets }}</p>
                    </div>
                    <div class="bg-white/20 p-4 rounded-xl">
                      <i class="pi pi-receipt text-3xl text-white"></i>
                    </div>
                  </div>
                </template>
              </Card>
            </div>

            <!-- Gráficos de Ventas -->
            <Card class="modern-panel">
              <template #header>
                <div class="flex items-center justify-between gap-3 p-4">
                  <div class="flex items-center gap-3">
                    <i class="pi pi-calendar text-2xl text-indigo-600"></i>
                    <div>
                      <span class="block font-bold text-gray-800 dark:text-white">Semana actual por dia</span>
                      <span class="block text-sm text-gray-500 dark:text-gray-400">
                        Domingo {{ resumenSemanaVentas.rangoInicio }} - Sabado {{ resumenSemanaVentas.rangoFin }}
                      </span>
                    </div>
                  </div>
                  <Button icon="pi pi-refresh" label="Actualizar semana" severity="info" outlined @click="cargarResumenSemanaActual" />
                </div>
              </template>
              <template #content>
                <div class="h-96">
                  <Chart type="bar" :data="chartSemanaActual" :options="chartOptionsSemanaActual" class="h-full" />
                </div>

                <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-4">
                  <div class="rounded-xl bg-blue-50 p-4 dark:bg-blue-950/30">
                    <p class="m-0 text-xs font-semibold text-blue-700 dark:text-blue-300">Ventas semana</p>
                    <p class="m-0 text-xl font-black text-blue-900 dark:text-blue-100">{{ formatoMonedaRD(resumenSemanaVentas.totales.ventas) }}</p>
                  </div>
                  <div class="rounded-xl bg-emerald-50 p-4 dark:bg-emerald-950/30">
                    <p class="m-0 text-xs font-semibold text-emerald-700 dark:text-emerald-300">Ganancias semana</p>
                    <p class="m-0 text-xl font-black text-emerald-900 dark:text-emerald-100">{{ formatoMonedaRD(resumenSemanaVentas.totales.ganancias) }}</p>
                  </div>
                  <div class="rounded-xl bg-purple-50 p-4 dark:bg-purple-950/30">
                    <p class="m-0 text-xs font-semibold text-purple-700 dark:text-purple-300">Impuestos semana</p>
                    <p class="m-0 text-xl font-black text-purple-900 dark:text-purple-100">{{ formatoMonedaRD(resumenSemanaVentas.totales.impuestos) }}</p>
                  </div>
                  <div class="rounded-xl bg-red-50 p-4 dark:bg-red-950/30">
                    <p class="m-0 text-xs font-semibold text-red-700 dark:text-red-300">Gastos semana</p>
                    <p class="m-0 text-xl font-black text-red-900 dark:text-red-100">{{ formatoMonedaRD(resumenSemanaVentas.totales.gastos) }}</p>
                  </div>
                </div>
              </template>
            </Card>

            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card class="modern-panel">
                <template #header>
                  <div class="flex items-center gap-3 p-4">
                    <i class="pi pi-chart-line text-2xl text-blue-600"></i>
                    <span class="font-bold text-gray-800 dark:text-white">Ventas por Día</span>
                  </div>
                </template>
                <template #content>
                  <Chart type="line" :data="ventasPorDia" :options="chartOptions" class="h-80" />
                </template>
              </Card>

              <Card class="modern-panel">
                <template #header>
                  <div class="flex items-center gap-3 p-4">
                    <i class="pi pi-user text-2xl text-green-600"></i>
                    <span class="font-bold text-gray-800 dark:text-white">Ventas por Vendedor</span>
                  </div>
                </template>
                <template #content>
                  <Chart type="bar" :data="ventasPorVendedor" :options="chartOptions" class="h-80" />
                </template>
              </Card>
            </div>

            <!-- Tabla de Detalle -->
            <Card class="modern-panel">
              <template #header>
                <div class="flex items-center gap-3 p-4">
                  <i class="pi pi-list text-2xl text-purple-600"></i>
                  <span class="font-bold text-gray-800 dark:text-white">Detalle de Ventas</span>
                </div>
              </template>
              <template #content>
                <DataTable :value="ventasFiltradas" paginator :rows="10" stripedRows
                  :globalFilterFields="['no_factura', 'nombre_cliente', 'vendedor']"
                  class="p-datatable-sm">
                  <Column field="no_factura" header="Factura" sortable></Column>
                  <Column field="fecha_emision" header="Fecha" sortable></Column>
                  <Column field="nombre_cliente" header="Cliente" sortable></Column>
                  <Column field="vendedor" header="Vendedor" sortable></Column>
                  <Column field="metodo_pago" header="Método Pago"></Column>
                  <Column field="total" header="Total" sortable>
                    <template #body="slotProps">
                      {{ formatoMonedaRD(slotProps.data.total) }}
                    </template>
                  </Column>
                  <Column field="ganancia" header="Ganancia" sortable>
                    <template #body="slotProps">
                      {{ formatoMonedaRD(slotProps.data.ganancia) }}
                    </template>
                  </Column>
                </DataTable>
              </template>
            </Card>
          </div>
        </TabPanel>

        <!-- ═══════════════════════════════════════════════════════════ -->
        <!-- TAB 2: RENTABILIDAD -->
        <!-- ═══════════════════════════════════════════════════════════ -->
        <TabPanel>
          <template #header>
            <div class="flex items-center gap-2 px-4 py-2">
              <i class="pi pi-chart-pie text-xl"></i>
              <span class="font-bold">Rentabilidad</span>
            </div>
          </template>

          <div class="space-y-6">
            <!-- Cards de Resumen -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Card class="stats-card rounded-xl" style="background: linear-gradient(135deg, #10b981 0%, #059669 100%);">
                <template #content>
                  <div class="flex items-center justify-between p-4">
                    <div>
                      <p class="text-emerald-100 text-sm font-semibold">Utilidad Total</p>
                      <p class="text-white text-3xl font-black">{{ formatoMonedaRD(rentabilidadResumen.utilidadTotal) }}</p>
                    </div>
                    <div class="bg-white/20 p-4 rounded-xl">
                      <i class="pi pi-trophy text-3xl text-white"></i>
                    </div>
                  </div>
                </template>
              </Card>

              <Card class="stats-card rounded-xl" style="background: linear-gradient(135deg, #06b6d4 0%, #0891b2 100%);">
                <template #content>
                  <div class="flex items-center justify-between p-4">
                    <div>
                      <p class="text-cyan-100 text-sm font-semibold">Margen Promedio</p>
                      <p class="text-white text-3xl font-black">{{ rentabilidadResumen.margenPromedio.toFixed(2) }}%</p>
                    </div>
                    <div class="bg-white/20 p-4 rounded-xl">
                      <i class="pi pi-percentage text-3xl text-white"></i>
                    </div>
                  </div>
                </template>
              </Card>
            </div>

            <!-- Gráficos de Rentabilidad -->
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card class="modern-panel">
                <template #header>
                  <div class="flex items-center gap-3 p-4">
                    <i class="pi pi-chart-bar text-2xl text-emerald-600"></i>
                    <span class="font-bold text-gray-800 dark:text-white">Top 10 Productos por Utilidad</span>
                  </div>
                </template>
                <template #content>
                  <Chart type="bar" :data="top10Utilidad" :options="chartOptionsHorizontal" class="h-96" />
                </template>
              </Card>

              <Card class="modern-panel">
                <template #header>
                  <div class="flex items-center gap-3 p-4">
                    <i class="pi pi-chart-pie text-2xl text-cyan-600"></i>
                    <span class="font-bold text-gray-800 dark:text-white">Utilidad por Categoría</span>
                  </div>
                </template>
                <template #content>
                  <Chart type="pie" :data="utilidadPorCategoria" :options="chartOptionsPie" class="h-96" />
                </template>
              </Card>
            </div>

            <!-- Tabla de Rentabilidad -->
            <Card class="modern-panel">
              <template #header>
                <div class="flex items-center gap-3 p-4">
                  <i class="pi pi-list text-2xl text-emerald-600"></i>
                  <span class="font-bold text-gray-800 dark:text-white">Detalle de Rentabilidad por Producto</span>
                </div>
              </template>
              <template #content>
                <DataTable :value="productosVendidos" paginator :rows="15" stripedRows sortField="utilidadTotal" :sortOrder="-1">
                  <Column field="codigo" header="Código" sortable></Column>
                  <Column field="nombre" header="Producto" sortable></Column>
                  <Column field="categoria" header="Categoría" sortable></Column>
                  <Column field="cantidadVendida" header="Cant. Vendida" sortable></Column>
                  <Column field="utilidadTotal" header="Utilidad Total" sortable>
                    <template #body="slotProps">
                      {{ formatoMonedaRD(slotProps.data.utilidadTotal) }}
                    </template>
                  </Column>
                  <Column header="Margen %">
                    <template #body="slotProps">
                      <Tag :value="slotProps.data.margen?.toFixed(2) + '%'"
                        :severity="slotProps.data.margen > 30 ? 'success' : slotProps.data.margen > 15 ? 'warning' : 'danger'" />
                    </template>
                  </Column>
                </DataTable>
              </template>
            </Card>
          </div>
        </TabPanel>

        <!-- ═══════════════════════════════════════════════════════════ -->
        <!-- TAB 3: PRODUCTOS MÁS VENDIDOS -->
        <!-- ═══════════════════════════════════════════════════════════ -->
        <TabPanel>
          <template #header>
            <div class="flex items-center gap-2 px-4 py-2">
              <i class="pi pi-star text-xl"></i>
              <span class="font-bold">Productos</span>
            </div>
          </template>

          <div class="space-y-6">
            <!-- Cards de Resumen -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Card class="stats-card rounded-xl" style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);">
                <template #content>
                  <div class="flex items-center justify-between p-4">
                    <div>
                      <p class="text-amber-100 text-sm font-semibold">Total Productos Vendidos</p>
                      <p class="text-white text-3xl font-black">{{ productosResumen.totalVendidos }}</p>
                    </div>
                    <div class="bg-white/20 p-4 rounded-xl">
                      <i class="pi pi-shopping-cart text-3xl text-white"></i>
                    </div>
                  </div>
                </template>
              </Card>

              <Card class="stats-card rounded-xl" style="background: linear-gradient(135deg, #f43f5e 0%, #e11d48 100%);">
                <template #content>
                  <div class="flex items-center justify-between p-4">
                    <div>
                      <p class="text-rose-100 text-sm font-semibold">Rotación Promedio</p>
                      <p class="text-white text-3xl font-black">{{ productosResumen.rotacionPromedio.toFixed(2) }}</p>
                    </div>
                    <div class="bg-white/20 p-4 rounded-xl">
                      <i class="pi pi-sync text-3xl text-white"></i>
                    </div>
                  </div>
                </template>
              </Card>
            </div>

            <!-- Gráficos de Productos -->
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card class="modern-panel">
                <template #header>
                  <div class="flex items-center gap-3 p-4">
                    <i class="pi pi-chart-bar text-2xl text-amber-600"></i>
                    <span class="font-bold text-gray-800 dark:text-white">Top 20 Más Vendidos</span>
                  </div>
                </template>
                <template #content>
                  <Chart type="bar" :data="top20ProductosVendidos" :options="chartOptionsHorizontal" class="h-96" />
                </template>
              </Card>

              <Card class="modern-panel">
                <template #header>
                  <div class="flex items-center gap-3 p-4">
                    <i class="pi pi-chart-pie text-2xl text-rose-600"></i>
                    <span class="font-bold text-gray-800 dark:text-white">Distribución por Categoría</span>
                  </div>
                </template>
                <template #content>
                  <Chart type="doughnut" :data="ventasPorCategoria" :options="chartOptionsPie" class="h-96" />
                </template>
              </Card>
            </div>

            <!-- Top Ventas por Categorías y Top Vendedores -->
            <div class="grid grid-cols-1 gap-6">
              <Card class="modern-panel">
                <template #header>
                  <div class="flex items-center gap-3 p-4">
                    <i class="pi pi-tags text-2xl text-purple-600"></i>
                    <span class="font-bold text-gray-800 dark:text-white">Top Ventas por Categorías</span>
                  </div>
                </template>
                <template #content>
                  <div class="space-y-4">
                    <DataTable :value="topVentasPorCategorias" stripedRows>
                      <Column field="categoria" header="Categoría" sortable></Column>
                      <Column field="cantidadVendida" header="Cantidad" sortable style="text-align: center;"></Column>
                      <Column field="montoTotal" header="Monto Total" sortable style="text-align: right;">
                        <template #body="slotProps">
                          <span class="font-semibold text-green-600">
                            {{ formatoMonedaRD(slotProps.data.montoTotal) }}
                          </span>
                        </template>
                      </Column>
                    </DataTable>
                  </div>
                </template>
              </Card>
            </div>

            <!-- Top Vendedores por Categoría -->
            <div class="grid grid-cols-1 gap-6">
              <Card class="modern-panel">
                <template #header>
                  <div class="flex items-center gap-3 p-4">
                    <i class="pi pi-chart-bar text-2xl text-yellow-600"></i>
                    <span class="font-bold text-gray-800 dark:text-white">Ventas por Vendedor y Categoría</span>
                  </div>
                </template>
                <template #content>
                  <div class="space-y-4">
                    <Chart type="bar" :data="ventasPorVendedorYCategoria" :options="chartOptionsVendedoresCategoria" class="h-96" />
                  </div>
                </template>
              </Card>
            </div>

            <!-- Top Vendedores General -->
            <div class="grid grid-cols-1 gap-6">
              <Card class="modern-panel">
                <template #header>
                  <div class="flex items-center gap-3 p-4">
                    <i class="pi pi-users text-2xl text-blue-600"></i>
                    <span class="font-bold text-gray-800 dark:text-white">Top Vendedores General</span>
                  </div>
                </template>
                <template #content>
                  <div class="space-y-4">
                    <DataTable :value="topVendedores" stripedRows sortField="montoTotal" :sortOrder="-1" scrollable scrollHeight="400px">
                      <Column field="vendedor" header="Vendedor" sortable frozen style="min-width: 150px;"></Column>
                      <Column field="cantidadProductos" header="Productos" sortable style="text-align: center; min-width: 100px;"></Column>
                      <Column field="montoTotal" header="Monto Total" sortable style="text-align: right; min-width: 130px;">
                        <template #body="slotProps">
                          <span class="font-semibold text-blue-600">
                            {{ formatoMonedaRD(slotProps.data.montoTotal) }}
                          </span>
                        </template>
                      </Column>
                      <Column field="gananciaTotal" header="Ganancia Total" sortable style="text-align: right; min-width: 140px;">
                        <template #body="slotProps">
                          <span class="font-semibold text-green-600">
                            {{ formatoMonedaRD(slotProps.data.gananciaTotal) }}
                          </span>
                        </template>
                      </Column>
                      <Column field="gananciaVendedorPorGanancia" sortable style="text-align: right; min-width: 160px;">
                        <template #header>
                          <div class="flex flex-col items-end">
                            <span class="font-bold">Comisión por Ganancia</span>
                            <span class="text-xs text-gray-500 font-normal">(% sobre ganancia)</span>
                          </div>
                        </template>
                        <template #body="slotProps">
                          <span class="font-bold text-purple-600">
                            {{ formatoMonedaRD(slotProps.data.gananciaVendedorPorGanancia) }}
                          </span>
                        </template>
                      </Column>
                      <Column field="gananciaVendedorPorTotal" sortable style="text-align: right; min-width: 160px;">
                        <template #header>
                          <div class="flex flex-col items-end">
                            <span class="font-bold">Comisión por Total</span>
                            <span class="text-xs text-gray-500 font-normal">(% sobre venta)</span>
                          </div>
                        </template>
                        <template #body="slotProps">
                          <span class="font-bold text-orange-600">
                            {{ formatoMonedaRD(slotProps.data.gananciaVendedorPorTotal) }}
                          </span>
                        </template>
                      </Column>
                    </DataTable>
                  </div>
                </template>
              </Card>
            </div>

            <!-- Tabla de Productos con Rotación -->
            <Card class="modern-panel">
              <template #header>
                <div class="flex items-center gap-3 p-4">
                  <i class="pi pi-list text-2xl text-amber-600"></i>
                  <span class="font-bold text-gray-800 dark:text-white">Productos con Análisis de Rotación</span>
                </div>
              </template>
              <template #content>
                <DataTable :value="productosConRotacion" paginator :rows="15" stripedRows sortField="cantidadVendida" :sortOrder="-1">
                  <Column field="codigo" header="Código" sortable></Column>
                  <Column field="nombre" header="Producto" sortable></Column>
                  <Column field="categoria" header="Categoría" sortable></Column>
                  <Column field="cantidadVendida" header="Vendidos" sortable></Column>
                  <Column field="stock" header="Stock Actual" sortable></Column>
                  <Column field="rotacion" header="Rotación" sortable>
                    <template #body="slotProps">
                      <Tag :value="slotProps.data.rotacion"
                        :severity="slotProps.data.rotacion > 2 ? 'success' : slotProps.data.rotacion > 1 ? 'warning' : 'danger'" />
                    </template>
                  </Column>
                </DataTable>
              </template>
            </Card>

            <!-- Card de Productos Vendidos Detallados -->
            <Card class="modern-panel">
              <template #header>
                <div class="flex items-center justify-between p-4">
                  <div class="flex items-center gap-3">
                    <i class="pi pi-shopping-cart text-2xl text-blue-600"></i>
                    <span class="font-bold text-gray-800 dark:text-white">Productos Vendidos</span>
                  </div>
                  <Button
                    icon="pi pi-file-pdf"
                    label="Generar PDF"
                    severity="danger"
                    @click="generarPDFProductosVendidos"
                    outlined
                  />
                </div>
              </template>
              <template #content>
                <div class="space-y-4">
                  <!-- Buscador -->
                  <input
                    v-model="searchQueryProductos"
                    placeholder="Buscar productos..."
                    class="p-inputtext p-component w-full"
                  />

                  <!-- Tabla de Productos Vendidos -->
                  <DataTable
                    :value="filteredProductsVendidos"
                    scrollable
                    scrollHeight="500px"
                    paginator
                    :rows="10"
                    :rowsPerPageOptions="[10, 20, 50]"
                    stripedRows
                  >
                    <Column field="nombre" header="Producto" sortable></Column>
                    <Column field="cantidad" header="Cantidad" sortable style="text-align: center;"></Column>
                    <Column header="Costo" sortable field="costo" style="text-align: right;">
                      <template #body="slotProps">
                        {{ formatoMonedaRD(slotProps.data.costo || 0) }}
                      </template>
                    </Column>
                    <Column header="Precio Real" sortable field="precio_real" style="text-align: right;">
                      <template #body="slotProps">
                        <span v-if="slotProps.data.precio_real > 0" class="text-blue-600 font-medium">
                          {{ formatoMonedaRD(slotProps.data.precio_real) }}
                        </span>
                        <span v-else class="text-gray-400">—</span>
                      </template>
                    </Column>
                    <Column header="% Método" sortable field="porcentaje" style="text-align: center;">
                      <template #body="slotProps">
                        <Tag
                          v-if="slotProps.data.porcentaje > 0"
                          :value="slotProps.data.porcentaje + '%'"
                          severity="warn"
                        />
                        <span v-else class="text-gray-400">—</span>
                      </template>
                    </Column>
                    <Column header="Venta" sortable field="total" style="text-align: right;">
                      <template #body="slotProps">
                        {{ formatoMonedaRD(slotProps.data.total || 0) }}
                      </template>
                    </Column>
                    <Column header="Ganancia" sortable field="ganancia" style="text-align: right;">
                      <template #body="slotProps">
                        <div class="flex align-items-center justify-content-end gap-1">
                          <span :class="{ 'text-green-600 font-semibold': slotProps.data.ganancia > 0, 'text-red-600 font-semibold': slotProps.data.ganancia < 0 }">
                            {{ formatoMonedaRD(slotProps.data.ganancia || 0) }}
                          </span>
                          <i
                            v-if="slotProps.data.precio_real > 0"
                            class="pi pi-info-circle text-blue-400 text-xs"
                            v-tooltip.top="'Calculado con precio real (sin cargo de método de pago)'"
                          ></i>
                        </div>
                      </template>
                    </Column>
                  </DataTable>

                  <!-- Totales -->
                  <div class="grid grid-cols-4 gap-4 mt-4 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
                    <div class="text-center">
                      <span class="block text-sm text-gray-600 dark:text-gray-400 font-semibold">Total Productos</span>
                      <span class="block text-lg font-bold text-gray-800 dark:text-white">{{ totalesProductosVendidosDetallados.cantidad }}</span>
                    </div>
                    <div class="text-center">
                      <span class="block text-sm text-gray-600 dark:text-gray-400 font-semibold">Total Costo</span>
                      <span class="block text-lg font-bold text-gray-800 dark:text-white">{{ formatoMonedaRD(totalesProductosVendidosDetallados.costo) }}</span>
                    </div>
                    <div class="text-center">
                      <span class="block text-sm text-gray-600 dark:text-gray-400 font-semibold">Total Venta</span>
                      <span class="block text-lg font-bold text-blue-600">{{ formatoMonedaRD(totalesProductosVendidosDetallados.total) }}</span>
                    </div>
                    <div class="text-center">
                      <span class="block text-sm text-gray-600 dark:text-gray-400 font-semibold">Total Ganancia</span>
                      <span class="block text-lg font-bold" :class="totalesProductosVendidosDetallados.ganancia >= 0 ? 'text-green-600' : 'text-red-600'">
                        {{ formatoMonedaRD(totalesProductosVendidosDetallados.ganancia) }}
                      </span>
                    </div>
                  </div>
                </div>
              </template>
            </Card>
          </div>
        </TabPanel>

        <!-- ═══════════════════════════════════════════════════════════ -->
        <!-- TAB 4: INVENTARIO VALORIZADO -->
        <!-- ═══════════════════════════════════════════════════════════ -->
        <TabPanel>
          <template #header>
            <div class="flex items-center gap-2 px-4 py-2">
              <i class="pi pi-box text-xl"></i>
              <span class="font-bold">Inventario</span>
            </div>
          </template>

          <div class="space-y-6">
            <!-- Filtros de Inventario -->
            <Card class="modern-panel">
              <template #content>
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4 p-4">
                  <div>
                    <label class="block text-sm font-semibold mb-2">Categoría</label>
                    <Dropdown v-model="categoriaSeleccionada" :options="categorias" optionLabel="label"
                      placeholder="Todas las categorías" class="w-full" showClear />
                  </div>
                  <div>
                    <label class="block text-sm font-semibold mb-2">Almacén</label>
                    <Dropdown v-model="almacenInventarioSeleccionado" :options="almacenes" optionLabel="label"
                      placeholder="Todos los almacenes" class="w-full" showClear />
                  </div>
                  <div>
                    <label class="block text-sm font-semibold mb-2">Estado Stock</label>
                    <Dropdown v-model="estadoStock" :options="estadosStock" optionLabel="label" optionValue="value"
                      placeholder="Seleccionar estado" class="w-full" />
                  </div>
                </div>
              </template>
            </Card>

            <!-- Cards de Resumen Inventario -->
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card class="stats-card rounded-xl" style="background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);">
                <template #content>
                  <div class="flex items-center justify-between p-4">
                    <div>
                      <p class="text-indigo-100 text-sm font-semibold">Valor Total</p>
                      <p class="text-white text-3xl font-black">{{ formatoMonedaRD(resumenInventario.valorTotal) }}</p>
                    </div>
                    <div class="bg-white/20 p-4 rounded-xl">
                      <i class="pi pi-dollar text-3xl text-white"></i>
                    </div>
                  </div>
                </template>
              </Card>

              <Card class="stats-card rounded-xl" style="background: linear-gradient(135deg, #14b8a6 0%, #0d9488 100%);">
                <template #content>
                  <div class="flex items-center justify-between p-4">
                    <div>
                      <p class="text-teal-100 text-sm font-semibold">Ganancia Esperada</p>
                      <p class="text-white text-3xl font-black">{{ formatoMonedaRD(resumenInventario.gananciaEsperada) }}</p>
                    </div>
                    <div class="bg-white/20 p-4 rounded-xl">
                      <i class="pi pi-chart-line text-3xl text-white"></i>
                    </div>
                  </div>
                </template>
              </Card>

              <Card class="stats-card rounded-xl" style="background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);">
                <template #content>
                  <div class="flex items-center justify-between p-4">
                    <div>
                      <p class="text-violet-100 text-sm font-semibold">Total Productos</p>
                      <p class="text-white text-3xl font-black">{{ resumenInventario.totalProductos }}</p>
                    </div>
                    <div class="bg-white/20 p-4 rounded-xl">
                      <i class="pi pi-box text-3xl text-white"></i>
                    </div>
                  </div>
                </template>
              </Card>

              <Card class="stats-card rounded-xl" style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);">
                <template #content>
                  <div class="flex items-center justify-between p-4">
                    <div>
                      <p class="text-red-100 text-sm font-semibold">Bajo Stock</p>
                      <p class="text-white text-3xl font-black">{{ resumenInventario.bajoStock }}</p>
                    </div>
                    <div class="bg-white/20 p-4 rounded-xl">
                      <i class="pi pi-exclamation-triangle text-3xl text-white"></i>
                    </div>
                  </div>
                </template>
              </Card>
            </div>

            <!-- Gráficos de Inventario -->
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card class="modern-panel">
                <template #header>
                  <div class="flex items-center gap-3 p-4">
                    <i class="pi pi-chart-pie text-2xl text-indigo-600"></i>
                    <span class="font-bold text-gray-800 dark:text-white">Valor por Categoría</span>
                  </div>
                </template>
                <template #content>
                  <Chart type="pie" :data="valorPorCategoria" :options="chartOptionsPie" class="h-96" />
                </template>
              </Card>

              <Card class="modern-panel">
                <template #header>
                  <div class="flex items-center gap-3 p-4">
                    <i class="pi pi-chart-bar text-2xl text-teal-600"></i>
                    <span class="font-bold text-gray-800 dark:text-white">Cantidad por Categoría</span>
                  </div>
                </template>
                <template #content>
                  <Chart type="bar" :data="cantidadPorCategoria" :options="chartOptions" class="h-96" />
                </template>
              </Card>
            </div>

            <!-- Tabla de Inventario Valorizado -->
            <Card class="modern-panel">
              <template #header>
                <div class="flex items-center gap-3 p-4">
                  <i class="pi pi-list text-2xl text-indigo-600"></i>
                  <span class="font-bold text-gray-800 dark:text-white">Inventario Valorizado</span>
                </div>
              </template>
              <template #content>
                <DataTable :value="inventarioValorizado" paginator :rows="15" stripedRows sortField="valorInventario" :sortOrder="-1">
                  <Column field="codigo" header="Código" sortable></Column>
                  <Column field="nombre" header="Producto" sortable></Column>
                  <Column field="categoria" header="Categoría" sortable></Column>
                  <Column field="stock" header="Stock" sortable></Column>
                  <Column field="precio_compra" header="P. Compra" sortable>
                    <template #body="slotProps">
                      {{ formatoMonedaRD(slotProps.data.precio_compra) }}
                    </template>
                  </Column>
                  <Column field="valorInventario" header="Valor Inventario" sortable>
                    <template #body="slotProps">
                      {{ formatoMonedaRD(slotProps.data.valorInventario) }}
                    </template>
                  </Column>
                  <Column field="gananciaEsperada" header="Ganancia Esperada" sortable>
                    <template #body="slotProps">
                      {{ formatoMonedaRD(slotProps.data.gananciaEsperada) }}
                    </template>
                  </Column>
                </DataTable>
              </template>
            </Card>
          </div>
        </TabPanel>

        <!-- ═══════════════════════════════════════════════════════════ -->
        <!-- TAB 5: REPARACIONES -->
        <!-- ═══════════════════════════════════════════════════════════ -->
        <TabPanel>
          <template #header>
            <div class="flex items-center gap-2 px-4 py-2">
              <i class="pi pi-wrench text-xl"></i>
              <span class="font-bold">Reparaciones</span>
            </div>
          </template>

          <div class="space-y-6">
            <!-- Filtros de Reparaciones -->
            <Card class="modern-panel">
              <template #content>
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4 p-4">
                  <div>
                    <label class="block text-sm font-semibold mb-2">Rango de Fechas</label>
                    <Calendar v-model="rangoFechasReparaciones" selectionMode="range" dateFormat="yy-mm-dd"
                      @update:modelValue="cargarReparaciones" class="w-full" showIcon />
                  </div>
                  <div>
                    <label class="block text-sm font-semibold mb-2">Técnico</label>
                    <Dropdown v-model="tecnicoSeleccionado" :options="tecnicos" optionLabel="label"
                      placeholder="Todos los técnicos" class="w-full" showClear />
                  </div>
                  <div>
                    <label class="block text-sm font-semibold mb-2">Estado</label>
                    <Dropdown v-model="estadoSeleccionado" :options="estadosReparacion" optionLabel="label"
                      placeholder="Todos los estados" class="w-full" showClear />
                  </div>
                </div>
              </template>
            </Card>

            <!-- Cards de Resumen Reparaciones -->
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
              <Card class="stats-card rounded-xl" style="background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%);">
                <template #content>
                  <div class="flex items-center justify-between p-4">
                    <div>
                      <p class="text-sky-100 text-sm font-semibold">Total Ingresos</p>
                      <p class="text-white text-3xl font-black">{{ formatoMonedaRD(resumenReparaciones.totalIngresos) }}</p>
                    </div>
                    <div class="bg-white/20 p-4 rounded-xl">
                      <i class="pi pi-dollar text-3xl text-white"></i>
                    </div>
                  </div>
                </template>
              </Card>

              <Card class="stats-card rounded-xl" style="background: linear-gradient(135deg, #10b981 0%, #059669 100%);">
                <template #content>
                  <div class="flex items-center justify-between p-4">
                    <div>
                      <p class="text-green-100 text-sm font-semibold">Ganancia Taller</p>
                      <p class="text-white text-3xl font-black">{{ formatoMonedaRD(resumenReparaciones.totalGanancia) }}</p>
                    </div>
                    <div class="bg-white/20 p-4 rounded-xl">
                      <i class="pi pi-chart-line text-3xl text-white"></i>
                    </div>
                  </div>
                </template>
              </Card>

              <Card class="stats-card rounded-xl" style="background: linear-gradient(135deg, #84cc16 0%, #65a30d 100%);">
                <template #content>
                  <div class="flex items-center justify-between p-4">
                    <div>
                      <p class="text-lime-100 text-sm font-semibold">Tiempo Promedio</p>
                      <p class="text-white text-3xl font-black">{{ resumenReparaciones.tiempoPromedio }} días</p>
                    </div>
                    <div class="bg-white/20 p-4 rounded-xl">
                      <i class="pi pi-clock text-3xl text-white"></i>
                    </div>
                  </div>
                </template>
              </Card>

              <Card class="stats-card rounded-xl" style="background: linear-gradient(135deg, #eab308 0%, #ca8a04 100%);">
                <template #content>
                  <div class="flex items-center justify-between p-4">
                    <div>
                      <p class="text-yellow-100 text-sm font-semibold">Pendientes</p>
                      <p class="text-white text-3xl font-black">{{ resumenReparaciones.pendientes }}</p>
                    </div>
                    <div class="bg-white/20 p-4 rounded-xl">
                      <i class="pi pi-hourglass text-3xl text-white"></i>
                    </div>
                  </div>
                </template>
              </Card>

              <Card class="stats-card rounded-xl" style="background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);">
                <template #content>
                  <div class="flex items-center justify-between p-4">
                    <div>
                      <p class="text-green-100 text-sm font-semibold">Completadas</p>
                      <p class="text-white text-3xl font-black">{{ resumenReparaciones.completadas }}</p>
                    </div>
                    <div class="bg-white/20 p-4 rounded-xl">
                      <i class="pi pi-check-circle text-3xl text-white"></i>
                    </div>
                  </div>
                </template>
              </Card>
            </div>

            <!-- Gráficos de Reparaciones -->
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card class="modern-panel lg:col-span-2">
                <template #header>
                  <div class="flex items-center justify-between gap-3 p-4">
                    <div class="flex items-center gap-3">
                      <i class="pi pi-calendar-clock text-2xl text-sky-600"></i>
                      <div>
                        <span class="block font-bold text-gray-800 dark:text-white">Semana actual del taller</span>
                        <span class="block text-sm text-gray-500 dark:text-gray-400">
                          Domingo {{ resumenSemanaTaller.rangoInicio }} - Sabado {{ resumenSemanaTaller.rangoFin }}
                        </span>
                      </div>
                    </div>
                    <Button icon="pi pi-refresh" label="Actualizar semana" severity="info" outlined @click="cargarResumenSemanaTallerActual" />
                  </div>
                </template>
                <template #content>
                  <div class="h-96">
                    <Chart type="bar" :data="chartSemanaTaller" :options="chartOptionsSemanaTaller" class="h-full" />
                  </div>

                  <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-4">
                    <div class="rounded-xl bg-sky-50 p-4 dark:bg-sky-950/30">
                      <p class="m-0 text-xs font-semibold text-sky-700 dark:text-sky-300">Ingresos taller</p>
                      <p class="m-0 text-xl font-black text-sky-900 dark:text-sky-100">{{ formatoMonedaRD(resumenSemanaTaller.totales.ingresos) }}</p>
                    </div>
                    <div class="rounded-xl bg-emerald-50 p-4 dark:bg-emerald-950/30">
                      <p class="m-0 text-xs font-semibold text-emerald-700 dark:text-emerald-300">Ganancia taller</p>
                      <p class="m-0 text-xl font-black text-emerald-900 dark:text-emerald-100">{{ formatoMonedaRD(resumenSemanaTaller.totales.ganancia) }}</p>
                    </div>
                    <div class="rounded-xl bg-amber-50 p-4 dark:bg-amber-950/30">
                      <p class="m-0 text-xs font-semibold text-amber-700 dark:text-amber-300">Ordenes semana</p>
                      <p class="m-0 text-xl font-black text-amber-900 dark:text-amber-100">{{ resumenSemanaTaller.totales.ordenes }}</p>
                    </div>
                    <div class="rounded-xl bg-lime-50 p-4 dark:bg-lime-950/30">
                      <p class="m-0 text-xs font-semibold text-lime-700 dark:text-lime-300">Entregadas semana</p>
                      <p class="m-0 text-xl font-black text-lime-900 dark:text-lime-100">{{ resumenSemanaTaller.totales.completadas }}</p>
                    </div>
                  </div>
                </template>
              </Card>

              <Card class="modern-panel">
                <template #header>
                  <div class="flex items-center gap-3 p-4">
                    <i class="pi pi-chart-bar text-2xl text-sky-600"></i>
                    <span class="font-bold text-gray-800 dark:text-white">Reparaciones por Técnico</span>
                  </div>
                </template>
                <template #content>
                  <Chart type="bar" :data="reparacionesPorTecnico" :options="chartOptions" class="h-80" />
                </template>
              </Card>

              <Card class="modern-panel">
                <template #header>
                  <div class="flex items-center gap-3 p-4">
                    <i class="pi pi-chart-pie text-2xl text-lime-600"></i>
                    <span class="font-bold text-gray-800 dark:text-white">Estados de Reparaciones</span>
                  </div>
                </template>
                <template #content>
                  <Chart type="pie" :data="reparacionesPorEstado" :options="chartOptionsPie" class="h-80" />
                </template>
              </Card>
            </div>

            <!-- Tabla de Reparaciones -->
            <Card class="modern-panel">
              <template #header>
                <div class="flex items-center justify-between p-4">
                  <div class="flex items-center gap-3">
                    <i class="pi pi-list text-2xl text-sky-600"></i>
                    <span class="font-bold text-gray-800 dark:text-white">Detalle de Reparaciones</span>
                  </div>
                  <Button
                    icon="pi pi-file-pdf"
                    label="Generar PDF"
                    severity="danger"
                    @click="generarPDFReparaciones"
                    outlined
                  />
                </div>
              </template>
              <template #content>
                <DataTable :value="reparacionesFiltradas" paginator :rows="15" stripedRows>
                  <Column field="id" header="ID" sortable></Column>
                  <Column field="nombre" header="Cliente" sortable></Column>
                  <Column field="equipo" header="Equipo" sortable></Column>
                  <Column field="tecnico" header="Técnico" sortable></Column>
                  <Column field="fecha_entrada" header="Entrada" sortable></Column>
                  <Column field="fecha_entrega" header="Entrega" sortable></Column>
                  <Column header="Tiempo (días)">
                    <template #body="slotProps">
                      <span v-if="slotProps.data.fecha_entrega && slotProps.data.estado === 'Entregado'">
                        {{ calcularDiasReparacion(slotProps.data.fecha_entrada, slotProps.data.fecha_entrega) }}
                      </span>
                      <span v-else class="text-gray-400">-</span>
                    </template>
                  </Column>
                  <Column field="estado" header="Estado">
                    <template #body="slotProps">
                      <Tag :value="slotProps.data.estado"
                        :severity="slotProps.data.estado === 'Entregado' ? 'success' :
                                   slotProps.data.estado === 'Reparado' ? 'info' : 'warning'" />
                    </template>
                  </Column>
                  <Column field="total" header="Total" sortable>
                    <template #body="slotProps">
                      {{ formatoMonedaRD(slotProps.data.total) }}
                    </template>
                  </Column>
                  <Column field="beneficio_empresa" header="Ganancia" sortable>
                    <template #body="slotProps">
                      <span :class="parseFloat(slotProps.data.beneficio_empresa || 0) > 0 ? 'text-green-600 font-semibold' : 'text-gray-400'">
                        {{ formatoMonedaRD(slotProps.data.beneficio_empresa || 0) }}
                      </span>
                    </template>
                  </Column>
                </DataTable>
              </template>
            </Card>
          </div>
        </TabPanel>

        <!-- ═══════════════════════════════════════════════════════════ -->
        <!-- TAB 6: CLIENTES -->
        <!-- ═══════════════════════════════════════════════════════════ -->
        <TabPanel>
          <template #header>
            <div class="flex items-center gap-2 px-4 py-2">
              <i class="pi pi-users text-xl"></i>
              <span class="font-bold">Clientes</span>
            </div>
          </template>

          <div class="space-y-6">
            <!-- Cards de Resumen Clientes -->
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card class="stats-card rounded-xl" style="background: linear-gradient(135deg, #ec4899 0%, #db2777 100%);">
                <template #content>
                  <div class="flex items-center justify-between p-4">
                    <div>
                      <p class="text-pink-100 text-sm font-semibold">Total Clientes</p>
                      <p class="text-white text-3xl font-black">{{ resumenClientes.totalClientes }}</p>
                    </div>
                    <div class="bg-white/20 p-4 rounded-xl">
                      <i class="pi pi-users text-3xl text-white"></i>
                    </div>
                  </div>
                </template>
              </Card>

              <Card class="stats-card rounded-xl" style="background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);">
                <template #content>
                  <div class="flex items-center justify-between p-4">
                    <div>
                      <p class="text-green-100 text-sm font-semibold">Activos</p>
                      <p class="text-white text-3xl font-black">{{ resumenClientes.clientesActivos }}</p>
                    </div>
                    <div class="bg-white/20 p-4 rounded-xl">
                      <i class="pi pi-check-circle text-3xl text-white"></i>
                    </div>
                  </div>
                </template>
              </Card>

              <Card class="stats-card rounded-xl" style="background: linear-gradient(135deg, #6b7280 0%, #4b5563 100%);">
                <template #content>
                  <div class="flex items-center justify-between p-4">
                    <div>
                      <p class="text-gray-100 text-sm font-semibold">Inactivos</p>
                      <p class="text-white text-3xl font-black">{{ resumenClientes.clientesInactivos }}</p>
                    </div>
                    <div class="bg-white/20 p-4 rounded-xl">
                      <i class="pi pi-times-circle text-3xl text-white"></i>
                    </div>
                  </div>
                </template>
              </Card>

              <Card class="stats-card rounded-xl" style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);">
                <template #content>
                  <div class="flex items-center justify-between p-4">
                    <div>
                      <p class="text-red-100 text-sm font-semibold">Morosos</p>
                      <p class="text-white text-3xl font-black">{{ resumenClientes.clientesMorosos }}</p>
                    </div>
                    <div class="bg-white/20 p-4 rounded-xl">
                      <i class="pi pi-exclamation-triangle text-3xl text-white"></i>
                    </div>
                  </div>
                </template>
              </Card>
            </div>

            <!-- Gráficos de Clientes -->
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card class="modern-panel">
                <template #header>
                  <div class="flex items-center gap-3 p-4">
                    <i class="pi pi-chart-bar text-2xl text-pink-600"></i>
                    <span class="font-bold text-gray-800 dark:text-white">Top 10 Compradores</span>
                  </div>
                </template>
                <template #content>
                  <Chart type="bar" :data="top10CompradoresGrafico" :options="chartOptionsHorizontal" class="h-96" />
                </template>
              </Card>

              <Card class="modern-panel">
                <template #header>
                  <div class="flex items-center gap-3 p-4">
                    <i class="pi pi-chart-pie text-2xl text-green-600"></i>
                    <span class="font-bold text-gray-800 dark:text-white">Clientes Activos vs Inactivos</span>
                  </div>
                </template>
                <template #content>
                  <Chart type="pie" :data="clientesActivosInactivos" :options="chartOptionsPie" class="h-96" />
                </template>
              </Card>
            </div>

            <!-- Tabla Top Compradores -->
            <Card class="modern-panel">
              <template #header>
                <div class="flex items-center gap-3 p-4">
                  <i class="pi pi-star text-2xl text-pink-600"></i>
                  <span class="font-bold text-gray-800 dark:text-white">Top Compradores del Período</span>
                </div>
              </template>
              <template #content>
                <DataTable :value="topCompradores" paginator :rows="15" stripedRows>
                  <Column field="codigo" header="Código" sortable></Column>
                  <Column field="nombre" header="Cliente" sortable></Column>
                  <Column field="cantidadFacturas" header="# Compras" sortable></Column>
                  <Column field="totalCompras" header="Total Compras" sortable>
                    <template #body="slotProps">
                      <span class="font-bold text-green-600">{{ formatoMonedaRD(slotProps.data.totalCompras) }}</span>
                    </template>
                  </Column>
                  <Column header="Promedio">
                    <template #body="slotProps">
                      {{ formatoMonedaRD(slotProps.data.totalCompras / slotProps.data.cantidadFacturas) }}
                    </template>
                  </Column>
                </DataTable>
              </template>
            </Card>

            <!-- Tabla Clientes Morosos -->
            <Card class="modern-panel" v-if="clientesMorosos.length > 0">
              <template #header>
                <div class="flex items-center gap-3 p-4">
                  <i class="pi pi-exclamation-triangle text-2xl text-red-600"></i>
                  <span class="font-bold text-gray-800 dark:text-white">Clientes con Saldo Pendiente</span>
                </div>
              </template>
              <template #content>
                <DataTable :value="clientesMorosos" paginator :rows="15" stripedRows>
                  <Column field="codigo" header="Código" sortable></Column>
                  <Column field="nombre" header="Cliente" sortable></Column>
                  <Column field="telefono" header="Teléfono"></Column>
                  <Column field="saldoPendiente" header="Saldo Pendiente" sortable>
                    <template #body="slotProps">
                      <span class="font-bold text-red-600">{{ formatoMonedaRD(slotProps.data.saldoPendiente) }}</span>
                    </template>
                  </Column>
                  <Column field="diasVencido" header="Días Vencido" sortable>
                    <template #body="slotProps">
                      <Tag :value="slotProps.data.diasVencido + ' días'"
                        :severity="slotProps.data.diasVencido > 60 ? 'danger' : slotProps.data.diasVencido > 30 ? 'warning' : 'info'" />
                    </template>
                  </Column>
                </DataTable>
              </template>
            </Card>
          </div>
        </TabPanel>

        <!-- ═══════════════════════════════════════════════════════════ -->
        <!-- TAB 7: DELIVERY -->
        <!-- ═══════════════════════════════════════════════════════════ -->
        <TabPanel>
          <template #header>
            <div class="flex items-center gap-2 px-4 py-2">
              <i class="pi pi-car text-xl"></i>
              <span class="font-bold">Delivery</span>
            </div>
          </template>

          <div class="space-y-6">
            <!-- Filtros de Delivery -->
            <Card class="modern-panel">
              <template #content>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
                  <div>
                    <label class="block text-sm font-semibold mb-2">Rango de Fechas</label>
                    <Calendar v-model="rangoFechasDelivery" selectionMode="range" dateFormat="yy-mm-dd"
                      @update:modelValue="cargarDelivery" class="w-full" showIcon />
                  </div>
                  <div>
                    <label class="block text-sm font-semibold mb-2">Delivery</label>
                    <Dropdown v-model="deliverySeleccionado" :options="deliveryOptions" optionLabel="label"
                      placeholder="Todos los deliveries" class="w-full" showClear @change="cargarDelivery" />
                  </div>
                </div>
              </template>
            </Card>

            <!-- Cards de Resumen Delivery -->
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card class="stats-card rounded-xl" style="background: linear-gradient(135deg, #06b6d4 0%, #0891b2 100%);">
                <template #content>
                  <div class="flex items-center justify-between p-4">
                    <div>
                      <p class="text-cyan-100 text-sm font-semibold">Total Entregas</p>
                      <p class="text-white text-3xl font-black">{{ deliveryResumen.totalEntregas }}</p>
                    </div>
                    <div class="bg-white/20 p-4 rounded-xl">
                      <i class="pi pi-shopping-cart text-3xl text-white"></i>
                    </div>
                  </div>
                </template>
              </Card>

              <Card class="stats-card rounded-xl" style="background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);">
                <template #content>
                  <div class="flex items-center justify-between p-4">
                    <div>
                      <p class="text-blue-100 text-sm font-semibold">Monto Total</p>
                      <p class="text-white text-3xl font-black">{{ formatoMonedaRD(deliveryResumen.montoTotal) }}</p>
                    </div>
                    <div class="bg-white/20 p-4 rounded-xl">
                      <i class="pi pi-dollar text-3xl text-white"></i>
                    </div>
                  </div>
                </template>
              </Card>

              <Card class="stats-card rounded-xl" style="background: linear-gradient(135deg, #10b981 0%, #059669 100%);">
                <template #content>
                  <div class="flex items-center justify-between p-4">
                    <div>
                      <p class="text-green-100 text-sm font-semibold">Comisión Total</p>
                      <p class="text-white text-3xl font-black">{{ formatoMonedaRD(deliveryResumen.comisionTotal) }}</p>
                    </div>
                    <div class="bg-white/20 p-4 rounded-xl">
                      <i class="pi pi-money-bill text-3xl text-white"></i>
                    </div>
                  </div>
                </template>
              </Card>

              <Card class="stats-card rounded-xl" style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);">
                <template #content>
                  <div class="flex items-center justify-between p-4">
                    <div>
                      <p class="text-amber-100 text-sm font-semibold">Promedio Entrega</p>
                      <p class="text-white text-3xl font-black">{{ formatoMonedaRD(deliveryResumen.promedioEntrega) }}</p>
                    </div>
                    <div class="bg-white/20 p-4 rounded-xl">
                      <i class="pi pi-chart-line text-3xl text-white"></i>
                    </div>
                  </div>
                </template>
              </Card>
            </div>

            <!-- Gráfico de Entregas por Delivery -->
            <Card class="modern-panel">
              <template #header>
                <div class="flex items-center gap-3 p-4">
                  <i class="pi pi-chart-bar text-2xl text-cyan-600"></i>
                  <span class="font-bold text-gray-800 dark:text-white">Entregas por Delivery</span>
                </div>
              </template>
              <template #content>
                <Chart type="bar" :data="chartEntregasPorDelivery" :options="chartOptionsDelivery" class="h-80" />
              </template>
            </Card>

            <!-- Tabla de Detalle de Deliveries -->
            <Card class="modern-panel">
              <template #header>
                <div class="flex items-center justify-between p-4">
                  <div class="flex items-center gap-3">
                    <i class="pi pi-list text-2xl text-indigo-600"></i>
                    <span class="font-bold text-gray-800 dark:text-white">Detalle por Delivery</span>
                  </div>
                  <Button icon="pi pi-download" label="Exportar" severity="success" outlined @click="exportarDelivery" />
                </div>
              </template>
              <template #content>
                <DataTable :value="deliveryDetalleData" stripedRows paginator :rows="10"
                  :rowsPerPageOptions="[5, 10, 20, 50]" class="p-datatable-sm"
                  paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                  currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} registros">
                  <Column field="delivery" header="Delivery" sortable>
                    <template #body="slotProps">
                      <div class="flex items-center gap-2">
                        <i class="pi pi-car text-cyan-600"></i>
                        <span class="font-semibold">{{ slotProps.data.delivery }}</span>
                      </div>
                    </template>
                  </Column>
                  <Column field="cantidadEntregas" header="Entregas" sortable>
                    <template #body="slotProps">
                      <Tag :value="slotProps.data.cantidadEntregas" severity="info" />
                    </template>
                  </Column>
                  <Column field="montoTotal" header="Monto Total" sortable>
                    <template #body="slotProps">
                      <span class="font-bold text-blue-600">{{ formatoMonedaRD(slotProps.data.montoTotal) }}</span>
                    </template>
                  </Column>
                  <Column field="porcentaje" header="%" sortable>
                    <template #body="slotProps">
                      <span class="font-semibold">{{ slotProps.data.porcentaje }}%</span>
                    </template>
                  </Column>
                  <Column field="comision" header="Comisión" sortable>
                    <template #body="slotProps">
                      <span class="font-bold text-green-600">{{ formatoMonedaRD(slotProps.data.comision) }}</span>
                    </template>
                  </Column>
                  <Column field="promedioEntrega" header="Promedio" sortable>
                    <template #body="slotProps">
                      <span class="text-gray-700 dark:text-gray-300">{{ formatoMonedaRD(slotProps.data.promedioEntrega) }}</span>
                    </template>
                  </Column>
                </DataTable>
              </template>
            </Card>
          </div>
        </TabPanel>

      </TabView>
    </div>

    <Toast />
  </main>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useToast } from 'primevue/usetoast';
import { peticionesFetchOffline, formatoMonedaRD, nfecha } from '@/funciones/funciones.js';
import { FechaTools } from '@/utils/fechaTools.js';
import { useDatosEmpresa } from '@/stores';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import Swal from 'sweetalert2';

const toast = useToast();
const datosEmpresa = useDatosEmpresa();

// ═══════════════════════════════════════════════════════════
// DATOS REACTIVOS GENERALES
// ═══════════════════════════════════════════════════════════

const loading = ref(false);

// Datos de productos para inventario
const productosData = ref([]);
const imeiDisponiblesData = ref([]);

// Datos de usuarios (para obtener porcentajes de comisión de vendedores)
const usuariosData = ref([]);

const calcularPromedio = (arr, campo) => {
  if (!Array.isArray(arr) || arr.length === 0) return 0;
  const suma = arr.reduce((acc, item) => acc + (Number(item?.[campo]) || 0), 0);
  return suma / arr.length;
};

// Listas de opciones para filtros
const vendedores = ref([]);
const almacenes = ref([]);
const categorias = ref([]);
const tecnicos = ref([]);
const estadosStock = ref([
  { label: 'Todos', value: 'todos' },
  { label: 'En Stock', value: 'en_stock' },
  { label: 'Bajo Stock', value: 'bajo_stock' },
  { label: 'Sin Stock', value: 'sin_stock' }
]);
const estadosReparacion = ref([
  { label: 'En Revisión', value: 'En Revision' },
  { label: 'Reparado', value: 'Reparado' },
  { label: 'Entregado', value: 'Entregado' }
]);

// ═══════════════════════════════════════════════════════════
// TAB 1: VENTAS
// ═══════════════════════════════════════════════════════════

const ventasData = ref([]);
const facturasSemanaData = ref([]);
const gastosSemanaData = ref([]);
const rangoFechasVentas = ref(null);
const vendedorSeleccionado = ref(null);
const almacenSeleccionado = ref(null);

const nombresDiasSemana = ['Domingo', 'Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado'];

const clonarFecha = (fecha) => new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate());

const formatearFechaISO = (fecha) => {
  const year = fecha.getFullYear();
  const month = String(fecha.getMonth() + 1).padStart(2, '0');
  const day = String(fecha.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const formatearFechaCorta = (fecha) => {
  const day = String(fecha.getDate()).padStart(2, '0');
  const month = String(fecha.getMonth() + 1).padStart(2, '0');
  return `${day}/${month}`;
};

const obtenerRangoSemanaDomingo = (base = new Date()) => {
  const inicio = clonarFecha(base);
  inicio.setDate(inicio.getDate() - inicio.getDay());

  const fin = clonarFecha(inicio);
  fin.setDate(inicio.getDate() + 6);

  return { inicio, fin };
};

const crearDiasSemanaBase = () => {
  const { inicio, fin } = obtenerRangoSemanaDomingo();
  const hoyKey = formatearFechaISO(new Date());

  const dias = Array.from({ length: 7 }, (_, index) => {
    const fecha = clonarFecha(inicio);
    fecha.setDate(inicio.getDate() + index);
    const key = formatearFechaISO(fecha);

    return {
      key,
      nombre: nombresDiasSemana[index],
      fecha: formatearFechaCorta(fecha),
      ventas: 0,
      ganancias: 0,
      impuestos: 0,
      gastos: 0,
      esHoy: key === hoyKey
    };
  });

  return {
    rangoInicio: formatearFechaCorta(inicio),
    rangoFin: formatearFechaCorta(fin),
    dias,
    totales: { ventas: 0, ganancias: 0, impuestos: 0, gastos: 0 }
  };
};

const resumenSemanaVentas = computed(() => {
  const resumen = crearDiasSemanaBase();
  const diasPorKey = new Map(resumen.dias.map(dia => [dia.key, dia]));
  const almacenFiltro = almacenSeleccionado.value?.value || datosEmpresa?.empresa?.nombre || '';

  facturasSemanaData.value
    .filter(factura => !almacenFiltro || !factura?.almacen || factura.almacen === almacenFiltro)
    .forEach(factura => {
      const key = obtenerFechaKeyRegistro(factura, ['created_at', 'fecha_emision', 'fecha']);
      const dia = diasPorKey.get(key);
      if (!dia) return;

      dia.ventas += Number(factura?.total || 0);
      dia.ganancias += Number(factura?.ganancia || factura?.ganancia_pura || 0);
      dia.impuestos += Number(factura?.impuesto || factura?.impuestos || factura?.itbis || 0);
    });

  gastosSemanaData.value
    .filter(gasto => !almacenFiltro || !gasto?.almacen || gasto.almacen === almacenFiltro)
    .forEach(gasto => {
      const key = obtenerFechaKeyRegistro(gasto, ['created_at', 'fecha']);
      const dia = diasPorKey.get(key);
      if (!dia) return;

      dia.gastos += Number(gasto?.cantidad || gasto?.monto || gasto?.total || 0);
    });

  resumen.totales = resumen.dias.reduce((totales, dia) => ({
    ventas: totales.ventas + dia.ventas,
    ganancias: totales.ganancias + dia.ganancias,
    impuestos: totales.impuestos + dia.impuestos,
    gastos: totales.gastos + dia.gastos
  }), { ventas: 0, ganancias: 0, impuestos: 0, gastos: 0 });

  return resumen;
});

const chartSemanaActual = computed(() => {
  const dias = resumenSemanaVentas.value.dias;

  return {
    labels: dias.map(dia => `${dia.nombre} ${dia.fecha}`),
    datasets: [
      {
        label: 'Ventas',
        data: dias.map(dia => dia.ventas),
        backgroundColor: 'rgba(59, 130, 246, 0.75)',
        borderColor: 'rgb(37, 99, 235)',
        borderWidth: 1
      },
      {
        label: 'Ganancias',
        data: dias.map(dia => dia.ganancias),
        backgroundColor: 'rgba(16, 185, 129, 0.75)',
        borderColor: 'rgb(5, 150, 105)',
        borderWidth: 1
      },
      {
        label: 'Impuestos',
        data: dias.map(dia => dia.impuestos),
        backgroundColor: 'rgba(168, 85, 247, 0.75)',
        borderColor: 'rgb(147, 51, 234)',
        borderWidth: 1
      },
      {
        label: 'Gastos',
        data: dias.map(dia => dia.gastos),
        backgroundColor: 'rgba(239, 68, 68, 0.75)',
        borderColor: 'rgb(220, 38, 38)',
        borderWidth: 1
      }
    ]
  };
});

const obtenerFechaKeyRegistro = (registro, campos = ['created_at', 'fecha_emision', 'fecha']) => {
  for (const campo of campos) {
    const valor = registro?.[campo];
    if (!valor) continue;

    const texto = String(valor).trim();
    const iso = texto.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;

    const dominicana = texto.match(/^(\d{2})[/-](\d{2})[/-](\d{4})/);
    if (dominicana) return `${dominicana[3]}-${dominicana[2]}-${dominicana[1]}`;
  }

  return '';
};

const seleccionarAlmacenActualPorDefecto = () => {
  const nombreAlmacenActual = datosEmpresa?.empresa?.nombre;
  if (!nombreAlmacenActual || !Array.isArray(almacenes.value) || almacenes.value.length === 0) {
    return;
  }

  const almacenActual = almacenes.value.find(
    (almacen) => almacen?.value === nombreAlmacenActual || almacen?.label === nombreAlmacenActual
  );

  if (!almacenActual) {
    return;
  }

  if (!almacenSeleccionado.value) {
    almacenSeleccionado.value = almacenActual;
  }

  if (!almacenInventarioSeleccionado.value) {
    almacenInventarioSeleccionado.value = almacenActual;
  }
};

const cargarUsuarios = async () => {
  try {
    console.log('🔍 Cargando usuarios...');
    const usuarios = await peticionesFetchOffline('getDataAsArray', 'usuarios');
    usuariosData.value = Array.isArray(usuarios) ? usuarios : [];
    console.log('✅ Usuarios cargados:', usuariosData.value.length);
  } catch (error) {
    console.error('❌ Error cargando usuarios:', error);
  }
};

const cargarVentas = async () => {
  try {
    loading.value = true;
    if (!rangoFechasVentas.value || rangoFechasVentas.value.length === 0) {
      rangoFechasVentas.value = [
        new Date(FechaTools.nfecha('mestimestamp').fechainicio),
        new Date(FechaTools.nfecha('mestimestamp').fechafin)
      ];
    }

    // Convertir fechas a timestamps
    const fechaInicio = rangoFechasVentas.value[0] ?
      fechaATimestamp(rangoFechasVentas.value[0], true) :
      FechaTools.nfecha('mestimestamp').fechainicio;
    const fechaFin = rangoFechasVentas.value[1] ?
      fechaATimestamp(rangoFechasVentas.value[1], false) :
      FechaTools.nfecha('mestimestamp').fechafin;

    console.log('🔍 Cargando ventas con timestamps:', fechaInicio, 'hasta', fechaFin);

    const facturas = await peticionesFetchOffline(
      'getRowsByTimestampRange',
      'facturas',
      'created_at',
      fechaInicio,
      fechaFin
    );

    console.log('📊 Facturas recibidas:', facturas?.length || 0, facturas);

    ventasData.value = Array.isArray(facturas) ?
      facturas : [];

    console.log('✅ Ventas filtradas (tipo factura):', ventasData.value.length);

    // Extraer vendedores únicos
    const vendedoresUnicos = [...new Set(ventasData.value.map(v => v.vendedor).filter(Boolean))];
    vendedores.value = vendedoresUnicos.map(v => ({ label: v, value: v }));

    // Extraer almacenes únicos
    const almacenesUnicos = [...new Set(ventasData.value.map(v => v.almacen).filter(Boolean))];
    almacenes.value = almacenesUnicos.map(a => ({ label: a, value: a }));
    seleccionarAlmacenActualPorDefecto();

    loading.value = false;
  } catch (error) {
    console.error('❌ Error cargando ventas:', error);
    toast.add({ severity: 'error', summary: 'Error', detail: 'Error al cargar ventas', life: 3000 });
    loading.value = false;
  }
};

const cargarResumenSemanaActual = async () => {
  const { inicio, fin } = obtenerRangoSemanaDomingo();
  const fechaInicio = `${formatearFechaISO(inicio)} 00:00:00`;
  const fechaFin = `${formatearFechaISO(fin)} 23:59:59`;

  try {
    const columnasGastos = await peticionesFetchOffline('getTableColumns', 'gastos');
    const gastosTieneCreatedAt = Array.isArray(columnasGastos) && columnasGastos.includes('created_at');

    const [facturasSemana, gastosSemanaPorCreatedAt] = await Promise.all([
      peticionesFetchOffline('getRowsByTimestampRange', 'facturas', 'created_at', fechaInicio, fechaFin),
      gastosTieneCreatedAt
        ? peticionesFetchOffline('getRowsByTimestampRange', 'gastos', 'created_at', fechaInicio, fechaFin)
        : Promise.resolve([])
    ]);

    facturasSemanaData.value = Array.isArray(facturasSemana) ? facturasSemana : [];

    if (Array.isArray(gastosSemanaPorCreatedAt) && gastosSemanaPorCreatedAt.length > 0) {
      gastosSemanaData.value = gastosSemanaPorCreatedAt;
      return;
    }

    const gastos = await peticionesFetchOffline('getDataAsArray', 'gastos');
    const inicioKey = formatearFechaISO(inicio);
    const finKey = formatearFechaISO(fin);

    gastosSemanaData.value = (Array.isArray(gastos) ? gastos : []).filter(gasto => {
      const key = obtenerFechaKeyRegistro(gasto, ['created_at', 'fecha']);
      return key >= inicioKey && key <= finKey;
    });
  } catch (error) {
    console.error('Error cargando resumen semanal:', error);
    facturasSemanaData.value = [];
    gastosSemanaData.value = [];
    toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo cargar el resumen semanal', life: 3000 });
  }
};

const ventasFiltradas = computed(() => {
  let datos = ventasData.value;

  if (vendedorSeleccionado.value) {
    datos = datos.filter(v => v.vendedor === vendedorSeleccionado.value.value);
  }

  if (almacenSeleccionado.value) {
    datos = datos.filter(v => v.almacen === almacenSeleccionado.value.value);
  }

  return datos;
});

const ventasResumen = computed(() => {
  const datos = ventasFiltradas.value;
  return {
    totalVentas: datos.reduce((sum, f) => sum + parseFloat(f.total || 0), 0),
    totalGanancia: datos.reduce((sum, f) => sum + parseFloat(f.ganancia || 0), 0),
    totalImpuestos: datos.reduce((sum, f) => sum + parseFloat(f.impuesto || 0), 0),
    cantidadTickets: datos.length
  };
});

const ventasPorDia = computed(() => {
  const agrupado = {};
  ventasFiltradas.value.forEach(factura => {
    const fecha = factura.fecha_emision;
    if (!agrupado[fecha]) agrupado[fecha] = 0;
    agrupado[fecha] += parseFloat(factura.total || 0);
  });

  const labels = Object.keys(agrupado).sort();
  const data = labels.map(l => agrupado[l]);

  return {
    labels: labels,
    datasets: [{
      label: 'Ventas Diarias',
      data: data,
      borderColor: 'rgb(75, 192, 192)',
      backgroundColor: 'rgba(75, 192, 192, 0.2)',
      tension: 0.4,
      fill: true
    }]
  };
});

const ventasPorVendedor = computed(() => {
  const agrupado = {};
  ventasFiltradas.value.forEach(factura => {
    const vendedor = factura.vendedor || 'Sin asignar';
    if (!agrupado[vendedor]) agrupado[vendedor] = 0;
    agrupado[vendedor] += parseFloat(factura.total || 0);
  });

  return {
    labels: Object.keys(agrupado),
    datasets: [{
      label: 'Ventas por Vendedor',
      data: Object.values(agrupado),
      backgroundColor: [
        'rgba(54, 162, 235, 0.7)',
        'rgba(255, 99, 132, 0.7)',
        'rgba(255, 206, 86, 0.7)',
        'rgba(75, 192, 192, 0.7)',
        'rgba(153, 102, 255, 0.7)',
        'rgba(255, 159, 64, 0.7)'
      ]
    }]
  };
});

// ═══════════════════════════════════════════════════════════
// TAB 2: RENTABILIDAD
// ═══════════════════════════════════════════════════════════

const productosVendidos = ref([]);
const productosVendidosDetallados = ref([]);
const searchQueryProductos = ref('');

const cargarRentabilidad = async () => {
  try {
    const productosMap = {};

    ventasData.value.forEach(factura => {
      try {
        const productos = JSON.parse(factura.productos || '[]');
        productos.forEach(prod => {
          if (!productosMap[prod.codigo]) {
            productosMap[prod.codigo] = {
              codigo: prod.codigo,
              nombre: prod.nombre,
              categoria: prod.categoria || 'Sin categoría',
              cantidadVendida: 0,
              utilidadTotal: 0,
              precioCompraPromedio: 0,
              precioVentaPromedio: 0
            };
          }

          const cantidad = parseInt(prod.cantidad || 0);
          const precioCompra = parseFloat(prod.precio_compra || 0);
          const precioVenta = parseFloat(prod.precio_venta || 0);

          productosMap[prod.codigo].cantidadVendida += cantidad;
          const utilidad = (precioVenta - precioCompra) * cantidad;
          productosMap[prod.codigo].utilidadTotal += utilidad;
          productosMap[prod.codigo].precioCompraPromedio = precioCompra;
          productosMap[prod.codigo].precioVentaPromedio = precioVenta;
        });
      } catch (e) {
        console.error('Error parseando productos de factura:', e);
      }
    });

    productosVendidos.value = Object.values(productosMap).map(p => ({
      ...p,
      margen: p.precioVentaPromedio > 0 ?
        ((p.precioVentaPromedio - p.precioCompraPromedio) / p.precioVentaPromedio) * 100 : 0
    }));
  } catch (error) {
    console.error('Error cargando rentabilidad:', error);
  }
};

const rentabilidadResumen = computed(() => {
  const utilidadTotal = productosVendidos.value.reduce((sum, p) => sum + p.utilidadTotal, 0);
  const margenPromedio = productosVendidos.value.length > 0 ?
    productosVendidos.value.reduce((sum, p) => sum + p.margen, 0) / productosVendidos.value.length : 0;

  return {
    utilidadTotal,
    margenPromedio
  };
});

const top10Utilidad = computed(() => {
  const sorted = [...productosVendidos.value].sort((a, b) => b.utilidadTotal - a.utilidadTotal).slice(0, 10);
  return {
    labels: sorted.map(p => p.nombre),
    datasets: [{
      label: 'Utilidad Total',
      data: sorted.map(p => p.utilidadTotal),
      backgroundColor: 'rgba(75, 192, 192, 0.7)'
    }]
  };
});

const utilidadPorCategoria = computed(() => {
  const agrupado = {};
  productosVendidos.value.forEach(prod => {
    const cat = prod.categoria || 'Sin categoría';
    if (!agrupado[cat]) agrupado[cat] = 0;
    agrupado[cat] += prod.utilidadTotal;
  });

  return {
    labels: Object.keys(agrupado),
    datasets: [{
      data: Object.values(agrupado),
      backgroundColor: [
        'rgba(255, 99, 132, 0.7)',
        'rgba(54, 162, 235, 0.7)',
        'rgba(255, 206, 86, 0.7)',
        'rgba(75, 192, 192, 0.7)',
        'rgba(153, 102, 255, 0.7)',
        'rgba(255, 159, 64, 0.7)'
      ]
    }]
  };
});

// Función para cargar productos vendidos detallados (estilo Informes.vue)
const cargarProductosVendidosDetallados = async () => {
  try {
    productosVendidosDetallados.value = ventasData.value.reduce((acc, factura) => {
      try {
        const productos = JSON.parse(factura.productos || '[]');

        productos.forEach(producto => {
          const nombre = producto.nombre;
          const existente = acc.find(item => item.nombre === nombre);
          const cantidad = parseFloat(producto.cantidad) || 0;
          const precioVenta = parseFloat(producto.precio_venta || producto.precio) || 0;
          const precioFinal = parseFloat(producto.precio_final) || precioVenta;
          const costo = parseFloat(producto.costo) || 0;
          const totalProducto = parseFloat(producto.total) || (cantidad * precioFinal);
          const precioReal = parseFloat(producto.precio_real) || 0;
          const porcentaje = parseFloat(producto.porcentaje) || 0;
          const ganancia = precioReal > 0
            ? (precioReal - costo) * cantidad
            : (precioFinal - costo) * cantidad;
          const impuesto = parseFloat(producto.impuesto || producto.impuesto_venta) || 0;
          const descuento = parseFloat(producto.descuento) || 0;

          if (existente) {
            existente.cantidad += cantidad;
            existente.total += totalProducto;
            existente.costo += costo * cantidad;
            existente.ganancia += ganancia;
            existente.impuesto += impuesto * cantidad;
            existente.descuento += descuento;
            if (precioReal > 0) existente.precio_real = precioReal;
            if (porcentaje > 0) existente.porcentaje = porcentaje;
          } else {
            acc.push({
              nombre,
              cantidad,
              precio_venta: precioVenta,
              precio_real: precioReal,
              porcentaje,
              costo: costo * cantidad,
              total: totalProducto,
              ganancia,
              impuesto: impuesto * cantidad,
              descuento
            });
          }
        });
      } catch (e) {
        console.error('Error parseando productos de factura:', e);
      }

      return acc;
    }, []);
  } catch (error) {
    console.error('Error cargando productos vendidos detallados:', error);
  }
};

// Función para generar PDF de productos vendidos
const generarPDFProductosVendidos = () => {
  try {
    const doc = new jsPDF('p', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    let yPos = 20;

    // ═══════════════ ENCABEZADO ═══════════════
    doc.setFillColor(59, 130, 246); // Azul
    doc.rect(0, 0, pageWidth, 50, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont(undefined, 'bold');
    doc.text('REPORTE DE PRODUCTOS VENDIDOS', pageWidth / 2, 20, { align: 'center' });

    doc.setFontSize(12);
    doc.setFont(undefined, 'normal');
    doc.text('Reportes y Analítica', pageWidth / 2, 30, { align: 'center' });

    // Fechas del reporte
    const fechaInicio = rangoFechasVentas.value?.[0]
      ? new Date(rangoFechasVentas.value[0]).toLocaleDateString('es-DO')
      : 'N/A';
    const fechaFin = rangoFechasVentas.value?.[1]
      ? new Date(rangoFechasVentas.value[1]).toLocaleDateString('es-DO')
      : 'N/A';

    doc.text(`Período: ${fechaInicio} - ${fechaFin}`, pageWidth / 2, 38, { align: 'center' });
    doc.text(`Generado: ${new Date().toLocaleString('es-DO')}`, pageWidth / 2, 45, { align: 'center' });

    yPos = 60;

    // ═══════════════ RESUMEN ═══════════════
    doc.setFillColor(243, 244, 246); // Gris claro
    doc.rect(10, yPos, pageWidth - 20, 30, 'F');

    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    doc.setFont(undefined, 'bold');

    const totales = totalesProductosVendidosDetallados.value;
    const col1X = 20;
    const col2X = 70;
    const col3X = 120;
    const col4X = 170;

    doc.text('Total Productos:', col1X, yPos + 10);
    doc.setFont(undefined, 'normal');
    doc.text(String(totales.cantidad), col1X, yPos + 16);

    doc.setFont(undefined, 'bold');
    doc.text('Total Costo:', col2X, yPos + 10);
    doc.setFont(undefined, 'normal');
    doc.text(formatoMonedaRD(totales.costo), col2X, yPos + 16);

    doc.setFont(undefined, 'bold');
    doc.text('Total Venta:', col3X, yPos + 10);
    doc.setFont(undefined, 'normal');
    doc.setTextColor(37, 99, 235); // Azul
    doc.text(formatoMonedaRD(totales.total), col3X, yPos + 16);

    doc.setTextColor(0, 0, 0);
    doc.setFont(undefined, 'bold');
    doc.text('Total Ganancia:', col4X, yPos + 10);
    doc.setFont(undefined, 'normal');
    doc.setTextColor(totales.ganancia >= 0 ? 34 : 220, totales.ganancia >= 0 ? 197 : 38, totales.ganancia >= 0 ? 94 : 38);
    doc.text(formatoMonedaRD(totales.ganancia), col4X, yPos + 16);

    yPos += 40;

    // ═══════════════ TABLA DE PRODUCTOS ═══════════════
    doc.setTextColor(0, 0, 0);

    const tableData = filteredProductsVendidos.value.map(producto => [
      producto.nombre,
      String(producto.cantidad),
      formatoMonedaRD(producto.costo || 0),
      producto.precio_real > 0 ? formatoMonedaRD(producto.precio_real) : '—',
      producto.porcentaje > 0 ? `${producto.porcentaje}%` : '—',
      formatoMonedaRD(producto.total || 0),
      formatoMonedaRD(producto.ganancia || 0)
    ]);

    doc.autoTable({
      startY: yPos,
      head: [['Producto', 'Cant.', 'Costo', 'Precio Real', '% Método', 'Venta', 'Ganancia']],
      body: tableData,
      theme: 'striped',
      headStyles: {
        fillColor: [59, 130, 246],
        textColor: [255, 255, 255],
        fontSize: 10,
        fontStyle: 'bold',
        halign: 'center'
      },
      bodyStyles: {
        fontSize: 9,
        cellPadding: 3
      },
      columnStyles: {
        0: { cellWidth: 50, halign: 'left' },   // Producto
        1: { cellWidth: 18, halign: 'center' }, // Cantidad
        2: { cellWidth: 25, halign: 'right' },  // Costo
        3: { cellWidth: 25, halign: 'right' },  // Precio Real
        4: { cellWidth: 20, halign: 'center' }, // % Método
        5: { cellWidth: 25, halign: 'right' },  // Venta
        6: { cellWidth: 27, halign: 'right' }   // Ganancia
      },
      alternateRowStyles: {
        fillColor: [249, 250, 251]
      },
      margin: { left: 10, right: 10 },
      didDrawPage: (data) => {
        // Pie de página
        const pageCount = doc.internal.pages.length - 1;
        doc.setFontSize(8);
        doc.setTextColor(128, 128, 128);
        doc.text(
          `Página ${data.pageNumber} de ${pageCount}`,
          pageWidth / 2,
          doc.internal.pageSize.getHeight() - 10,
          { align: 'center' }
        );
      }
    });

    // ═══════════════ MOSTRAR PDF EN SWAL ═══════════════
    const pdfDataUri = doc.output('datauristring');
    const fileName = `Productos_Vendidos_${fechaInicio.replace(/\//g, '-')}_${fechaFin.replace(/\//g, '-')}.pdf`;

    Swal.fire({
      title: 'Reporte de Productos Vendidos',
      html: `
        <div style="width: 100%; height: 70vh;">
          <iframe
            src="${pdfDataUri}"
            style="width: 100%; height: 100%; border: none; border-radius: 8px;"
            type="application/pdf"
          ></iframe>
        </div>
      `,
      width: '90%',
      showCloseButton: true,
      showConfirmButton: true,
      confirmButtonText: '<i class="pi pi-download"></i> Descargar PDF',
      confirmButtonColor: '#3B82F6',
      didOpen: () => {
        // Agregar estilos personalizados al modal
        const popup = Swal.getPopup();
        popup.style.padding = '20px';
      }
    }).then((result) => {
      if (result.isConfirmed) {
        // Descargar el PDF cuando el usuario confirme
        doc.save(fileName);
        toast.add({
          severity: 'success',
          summary: 'PDF Descargado',
          detail: 'El archivo se ha descargado correctamente',
          life: 3000
        });
      }
    });

  } catch (error) {
    console.error('Error generando PDF:', error);
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Error al generar el PDF',
      life: 3000
    });
  }
};

// Computed para filtrar productos vendidos
const filteredProductsVendidos = computed(() => {
  if (!searchQueryProductos.value) return productosVendidosDetallados.value;
  return productosVendidosDetallados.value.filter(product => {
    return Object.values(product).some(value =>
      String(value).toLowerCase().includes(searchQueryProductos.value.toLowerCase())
    );
  });
});

// Computed para totales de productos vendidos
const totalesProductosVendidosDetallados = computed(() => {
  const productos = filteredProductsVendidos.value;
  return {
    cantidad: productos.reduce((sum, p) => sum + (p.cantidad || 0), 0),
    costo: productos.reduce((sum, p) => sum + (parseFloat(p.costo) || 0), 0),
    total: productos.reduce((sum, p) => sum + (p.total || 0), 0),
    ganancia: productos.reduce((sum, p) => sum + (p.ganancia || 0), 0)
  };
});

// ═══════════════════════════════════════════════════════════
// TAB 3: PRODUCTOS MÁS VENDIDOS
// ═══════════════════════════════════════════════════════════

const productosResumen = computed(() => {
  const totalVendidos = productosVendidos.value.reduce((sum, p) => sum + p.cantidadVendida, 0);

  // Filtrar solo productos con rotación numérica (excluir 'N/A')
  const productosConRotacionNumerica = productosConRotacion.value.filter(p => p.rotacion !== 'N/A');
  const rotacionPromedio = productosConRotacionNumerica.length > 0 ?
    productosConRotacionNumerica.reduce((sum, p) => sum + parseFloat(p.rotacion), 0) / productosConRotacionNumerica.length : 0;

  return {
    totalVendidos,
    rotacionPromedio
  };
});

const top20ProductosVendidos = computed(() => {
  const sorted = [...productosVendidos.value].sort((a, b) => b.cantidadVendida - a.cantidadVendida).slice(0, 20);
  return {
    labels: sorted.map(p => p.nombre),
    datasets: [{
      label: 'Cantidad Vendida',
      data: sorted.map(p => p.cantidadVendida),
      backgroundColor: 'rgba(255, 159, 64, 0.7)'
    }]
  };
});

const ventasPorCategoria = computed(() => {
  const agrupado = {};
  productosVendidos.value.forEach(prod => {
    const cat = prod.categoria || 'Sin categoría';
    if (!agrupado[cat]) agrupado[cat] = 0;
    agrupado[cat] += prod.cantidadVendida;
  });

  return {
    labels: Object.keys(agrupado),
    datasets: [{
      data: Object.values(agrupado),
      backgroundColor: [
        'rgba(255, 99, 132, 0.7)',
        'rgba(54, 162, 235, 0.7)',
        'rgba(255, 206, 86, 0.7)',
        'rgba(75, 192, 192, 0.7)',
        'rgba(153, 102, 255, 0.7)',
        'rgba(255, 159, 64, 0.7)'
      ]
    }]
  };
});

const productosConRotacion = computed(() => {
  return productosVendidos.value.map(pv => {
    const producto = productosData.value.find(p => p.codigo === pv.codigo);
    const stock = parseInt(producto?.stock || 0);
    return {
      ...pv,
      stock: stock,
      rotacion: stock > 0 ? (pv.cantidadVendida / stock).toFixed(2) : 'N/A'
    };
  });
});

// Top Ventas por Categorías (cantidad vendida y monto total por categoría)
const topVentasPorCategorias = computed(() => {
  const agrupado = {};

  // Agrupar productos vendidos por categoría
  ventasData.value.forEach(factura => {
    try {
      const productos = JSON.parse(factura.productos || '[]');
      productos.forEach(prod => {
        const cat = prod.categoria || 'Sin categoría';
        if (!agrupado[cat]) {
          agrupado[cat] = {
            categoria: cat,
            cantidadVendida: 0,
            montoTotal: 0
          };
        }
        agrupado[cat].cantidadVendida += parseInt(prod.cantidad || 0);
        agrupado[cat].montoTotal += parseFloat(prod.total || 0);
      });
    } catch (e) {
      console.error('Error parseando productos de factura:', e);
    }
  });

  // Convertir a array y ordenar por monto total descendente
  return Object.values(agrupado).sort((a, b) => b.montoTotal - a.montoTotal);
});

// Top Vendedores (cantidad de productos vendidos, monto total y ganancia del vendedor)
const topVendedores = computed(() => {
  const agrupado = {};

  // Agrupar ventas por vendedor
  ventasData.value.forEach(factura => {
    const vendedor = factura.vendedor || 'Sin asignar';
    if (!agrupado[vendedor]) {
      agrupado[vendedor] = {
        vendedor: vendedor,
        cantidadProductos: 0,
        montoTotal: 0,
        gananciaTotal: 0,
        gananciaVendedorPorGanancia: 0,
        gananciaVendedorPorTotal: 0
      };
    }

    // Sumar el monto total de la factura
    const totalFactura = parseFloat(factura.total || 0);
    agrupado[vendedor].montoTotal += totalFactura;

    // Sumar la ganancia total de la factura
    const gananciaFactura = parseFloat(factura.ganancia || 0);
    agrupado[vendedor].gananciaTotal += gananciaFactura;

    // Obtener el porcentaje de comisión del vendedor
    const usuario = usuariosData.value.find(u => u.nombre === vendedor);
    const porcentajeComision = parseFloat(usuario?.porcentaje || 0);

    // Calcular la ganancia del vendedor - FORMA 1: Basada en la ganancia de la factura
    const gananciaVendedorPorGanancia = gananciaFactura * (porcentajeComision / 100);
    agrupado[vendedor].gananciaVendedorPorGanancia += gananciaVendedorPorGanancia;

    // Calcular la ganancia del vendedor - FORMA 2: Basada en el total de la factura
    const gananciaVendedorPorTotal = totalFactura * (porcentajeComision / 100);
    agrupado[vendedor].gananciaVendedorPorTotal += gananciaVendedorPorTotal;

    // Contar la cantidad de productos vendidos en esta factura
    try {
      const productos = JSON.parse(factura.productos || '[]');
      productos.forEach(prod => {
        agrupado[vendedor].cantidadProductos += parseInt(prod.cantidad || 0);
      });
    } catch (e) {
      console.error('Error parseando productos de factura:', e);
    }
  });

  // Convertir a array y ordenar por monto total descendente
  return Object.values(agrupado).sort((a, b) => b.montoTotal - a.montoTotal);
});

// Ventas por Vendedor y Categoría (para gráfico de barras)
const ventasPorVendedorYCategoria = computed(() => {
  const datosAgrupados = {};
  const vendedoresSet = new Set();
  const categoriasSet = new Set();

  // Agrupar ventas por vendedor y categoría
  ventasData.value.forEach(factura => {
    try {
      const productos = JSON.parse(factura.productos || '[]');
      const vendedor = factura.vendedor || 'Sin asignar';
      vendedoresSet.add(vendedor);

      productos.forEach(prod => {
        const categoria = prod.categoria || 'Sin categoría';
        categoriasSet.add(categoria);

        // Crear estructura de datos
        if (!datosAgrupados[vendedor]) {
          datosAgrupados[vendedor] = {};
        }
        if (!datosAgrupados[vendedor][categoria]) {
          datosAgrupados[vendedor][categoria] = 0;
        }

        // Sumar cantidad vendida
        datosAgrupados[vendedor][categoria] += parseInt(prod.cantidad || 0);
      });
    } catch (e) {
      console.error('Error parseando productos de factura:', e);
    }
  });

  // Convertir a formato de Chart.js
  const categorias = Array.from(categoriasSet).sort();
  const vendedores = Array.from(vendedoresSet).sort();

  // Colores para cada vendedor
  const colores = [
    'rgba(54, 162, 235, 0.8)',   // Azul
    'rgba(255, 99, 132, 0.8)',   // Rojo
    'rgba(75, 192, 192, 0.8)',   // Verde azulado
    'rgba(255, 206, 86, 0.8)',   // Amarillo
    'rgba(153, 102, 255, 0.8)',  // Morado
    'rgba(255, 159, 64, 0.8)',   // Naranja
    'rgba(199, 199, 199, 0.8)',  // Gris
    'rgba(83, 102, 255, 0.8)',   // Azul índigo
    'rgba(255, 99, 255, 0.8)',   // Rosa
    'rgba(99, 255, 132, 0.8)'    // Verde claro
  ];

  const datasets = vendedores.map((vendedor, index) => {
    const data = categorias.map(categoria => {
      return datosAgrupados[vendedor]?.[categoria] || 0;
    });

    return {
      label: vendedor,
      data: data,
      backgroundColor: colores[index % colores.length],
      borderColor: colores[index % colores.length].replace('0.8', '1'),
      borderWidth: 1
    };
  });

  return {
    labels: categorias,
    datasets: datasets
  };
});

// Opciones para el gráfico de vendedores por categoría
const chartOptionsVendedoresCategoria = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'top',
      labels: {
        font: {
          size: 12
        },
        padding: 15,
        usePointStyle: true
      }
    },
    tooltip: {
      callbacks: {
        label: function(context) {
          const vendedor = context.dataset.label;
          const cantidad = context.parsed.y;
          return `${vendedor}: ${cantidad} unidades`;
        }
      }
    }
  },
  scales: {
    x: {
      grid: {
        display: false
      },
      ticks: {
        font: {
          size: 11
        }
      }
    },
    y: {
      beginAtZero: true,
      grid: {
        color: 'rgba(0, 0, 0, 0.05)'
      },
      ticks: {
        font: {
          size: 11
        },
        callback: function(value) {
          return value.toLocaleString();
        }
      },
      title: {
        display: true,
        text: 'Cantidad de Productos Vendidos',
        font: {
          size: 12,
          weight: 'bold'
        }
      }
    }
  }
};

// ═══════════════════════════════════════════════════════════
// TAB 4: INVENTARIO VALORIZADO
// ═══════════════════════════════════════════════════════════

const categoriaSeleccionada = ref(null);
const almacenInventarioSeleccionado = ref(null);
const estadoStock = ref('todos');

const cargarInventario = async () => {
  try {
    console.log('🔍 Cargando inventario...');
    const [productosResponse, imeiResponse] = await Promise.all([
      peticionesFetchOffline('getDataAsArray', 'productos'),
      peticionesFetchOffline('getDataArrayByCondition', 'imei', 'estado', 'DISPONIBLE')
    ]);

    const productos = Array.isArray(productosResponse) ? productosResponse : [];
    imeiDisponiblesData.value = Array.isArray(imeiResponse) ? imeiResponse : [];

    productosData.value = productos.map((product) => {
      const esCelular = String(product.categoria || '').toUpperCase() === 'CELULARES';

      if (!esCelular) {
        return {
          ...product,
          stock: Number(product.stock) || 0,
          precio_compra: Number(product.precio_compra) || 0,
          precio_venta: Number(product.precio_venta) || 0
        };
      }

      const imeisProducto = imeiDisponiblesData.value.filter(
        (imei) => String(imei.id_equi) === String(product.id)
      );

      const stockReal = imeisProducto.length;
      const precioCompraImei = stockReal > 0
        ? calcularPromedio(imeisProducto, 'precio_compra')
        : (Number(product.precio_compra) || 0);
      const precioVentaImei = stockReal > 0
        ? calcularPromedio(imeisProducto, 'precio_venta')
        : (Number(product.precio_venta) || 0);

      return {
        ...product,
        stock: stockReal,
        precio_compra: Number(precioCompraImei) || 0,
        precio_venta: Number(precioVentaImei) || 0
      };
    });

    console.log('📦 Productos recibidos:', productosData.value?.length || 0);

    // Extraer categorías únicas
    const categoriasUnicas = [...new Set(productosData.value.map(p => p.categoria).filter(Boolean))];
    categorias.value = categoriasUnicas.map(c => ({ label: c, value: c }));

    // Extraer almacenes únicos si no están ya cargados
    if (almacenes.value.length === 0) {
      const almacenesUnicos = [...new Set(productosData.value.map(p => p.almacen).filter(Boolean))];
      almacenes.value = almacenesUnicos.map(a => ({ label: a, value: a }));
    }
    seleccionarAlmacenActualPorDefecto();

    console.log('✅ Inventario cargado, categorías:', categorias.value.length);
  } catch (error) {
    console.error('❌ Error cargando inventario:', error);
  }
};

const inventarioValorizado = computed(() => {
  let productos = Array.isArray(productosData.value) ? productosData.value : [];

  // Filtrar por categoría
  if (categoriaSeleccionada.value) {
    productos = productos.filter(p => p.categoria === categoriaSeleccionada.value.value);
  }

  // Filtrar por almacén
  if (almacenInventarioSeleccionado.value) {
    productos = productos.filter(p => p.almacen === almacenInventarioSeleccionado.value.value);
  }

  // Filtrar por estado de stock
  if (estadoStock.value === 'sin_stock') {
    productos = productos.filter(p => parseInt(p.stock || 0) <= 0);
  } else if (estadoStock.value === 'bajo_stock') {
    productos = productos.filter(p => {
      const stock = parseInt(p.stock || 0);
      const alerta = parseInt(p.alerta || 5);
      return stock > 0 && stock <= alerta;
    });
  } else if (estadoStock.value === 'en_stock') {
    productos = productos.filter(p => parseInt(p.stock || 0) > 0);
  }

  return productos.map(p => ({
    ...p,
    valorInventario: Number(p.precio_compra || 0) * Number(p.stock || 0),
    gananciaEsperada: (Number(p.precio_venta || 0) - Number(p.precio_compra || 0)) * Number(p.stock || 0)
  }));
});

const resumenInventario = computed(() => ({
  valorTotal: inventarioValorizado.value.reduce((sum, p) => sum + p.valorInventario, 0),
  gananciaEsperada: inventarioValorizado.value.reduce((sum, p) => sum + p.gananciaEsperada, 0),
  totalProductos: inventarioValorizado.value.length,
  bajoStock: inventarioValorizado.value.filter(p => {
    const stock = parseInt(p.stock || 0);
    const alerta = parseInt(p.alerta || 5);
    return stock > 0 && stock <= alerta;
  }).length
}));

const valorPorCategoria = computed(() => {
  const agrupado = {};
  inventarioValorizado.value.forEach(p => {
    const cat = p.categoria || 'Sin categoría';
    if (!agrupado[cat]) agrupado[cat] = 0;
    agrupado[cat] += p.valorInventario;
  });

  return {
    labels: Object.keys(agrupado),
    datasets: [{
      data: Object.values(agrupado),
      backgroundColor: [
        'rgba(255, 99, 132, 0.7)',
        'rgba(54, 162, 235, 0.7)',
        'rgba(255, 206, 86, 0.7)',
        'rgba(75, 192, 192, 0.7)',
        'rgba(153, 102, 255, 0.7)',
        'rgba(255, 159, 64, 0.7)'
      ]
    }]
  };
});

const cantidadPorCategoria = computed(() => {
  const agrupado = {};
  inventarioValorizado.value.forEach(p => {
    const cat = p.categoria || 'Sin categoría';
    if (!agrupado[cat]) agrupado[cat] = 0;
    agrupado[cat] += parseInt(p.stock || 0);
  });

  return {
    labels: Object.keys(agrupado),
    datasets: [{
      label: 'Cantidad en Stock',
      data: Object.values(agrupado),
      backgroundColor: 'rgba(54, 162, 235, 0.7)'
    }]
  };
});

// ═══════════════════════════════════════════════════════════
// TAB 5: REPARACIONES
// ═══════════════════════════════════════════════════════════

const reparacionesData = ref([]);
const reparacionesSemanaData = ref([]);
const rangoFechasReparaciones = ref(null);
const tecnicoSeleccionado = ref(null);
const estadoSeleccionado = ref(null);

const resumenSemanaTaller = computed(() => {
  const resumen = crearDiasSemanaBase();
  const diasPorKey = new Map(resumen.dias.map(dia => [dia.key, dia]));

  reparacionesSemanaData.value.forEach(reparacion => {
    const key = obtenerFechaKeyRegistro(reparacion, ['created_at', 'fecha_entrada', 'fecha']);
    const dia = diasPorKey.get(key);
    if (!dia) return;

    const estado = String(reparacion?.estado || '').trim().toLowerCase();

    dia.ingresos = Number(dia.ingresos || 0) + Number(reparacion?.total || 0);
    dia.ganancia = Number(dia.ganancia || 0) + Number(reparacion?.beneficio_empresa || 0);
    dia.ordenes = Number(dia.ordenes || 0) + 1;
    dia.completadas = Number(dia.completadas || 0) + (estado === 'entregado' ? 1 : 0);
  });

  resumen.dias = resumen.dias.map(dia => ({
    ...dia,
    ingresos: Number(dia.ingresos || 0),
    ganancia: Number(dia.ganancia || 0),
    ordenes: Number(dia.ordenes || 0),
    completadas: Number(dia.completadas || 0)
  }));

  resumen.totales = resumen.dias.reduce((totales, dia) => ({
    ingresos: totales.ingresos + dia.ingresos,
    ganancia: totales.ganancia + dia.ganancia,
    ordenes: totales.ordenes + dia.ordenes,
    completadas: totales.completadas + dia.completadas
  }), { ingresos: 0, ganancia: 0, ordenes: 0, completadas: 0 });

  return resumen;
});

const chartSemanaTaller = computed(() => {
  const dias = resumenSemanaTaller.value.dias;

  return {
    labels: dias.map(dia => `${dia.nombre} ${dia.fecha}`),
    datasets: [
      {
        label: 'Ingresos taller',
        data: dias.map(dia => dia.ingresos),
        backgroundColor: 'rgba(14, 165, 233, 0.75)',
        borderColor: 'rgb(2, 132, 199)',
        borderWidth: 1,
        yAxisID: 'y'
      },
      {
        label: 'Ganancia taller',
        data: dias.map(dia => dia.ganancia),
        backgroundColor: 'rgba(16, 185, 129, 0.75)',
        borderColor: 'rgb(5, 150, 105)',
        borderWidth: 1,
        yAxisID: 'y'
      },
      {
        type: 'line',
        label: 'Ordenes',
        data: dias.map(dia => dia.ordenes),
        borderColor: 'rgb(245, 158, 11)',
        backgroundColor: 'rgba(245, 158, 11, 0.25)',
        borderWidth: 3,
        tension: 0.35,
        yAxisID: 'y1'
      }
    ]
  };
});

const cargarResumenSemanaTallerActual = async () => {
  const { inicio, fin } = obtenerRangoSemanaDomingo();
  const fechaInicio = `${formatearFechaISO(inicio)} 00:00:00`;
  const fechaFin = `${formatearFechaISO(fin)} 23:59:59`;

  try {
    const columnasTaller = await peticionesFetchOffline('getTableColumns', 'taller');
    const tallerTieneCreatedAt = Array.isArray(columnasTaller) && columnasTaller.includes('created_at');

    if (tallerTieneCreatedAt) {
      const reparacionesSemana = await peticionesFetchOffline(
        'getRowsByTimestampRange',
        'taller',
        'created_at',
        fechaInicio,
        fechaFin
      );

      reparacionesSemanaData.value = Array.isArray(reparacionesSemana) ? reparacionesSemana : [];
      return;
    }

    const reparaciones = await peticionesFetchOffline('getDataAsArray', 'taller');
    const inicioKey = formatearFechaISO(inicio);
    const finKey = formatearFechaISO(fin);

    reparacionesSemanaData.value = (Array.isArray(reparaciones) ? reparaciones : []).filter(reparacion => {
      const key = obtenerFechaKeyRegistro(reparacion, ['created_at', 'fecha_entrada', 'fecha']);
      return key >= inicioKey && key <= finKey;
    });
  } catch (error) {
    console.error('Error cargando resumen semanal del taller:', error);
    reparacionesSemanaData.value = [];
    toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo cargar la semana del taller', life: 3000 });
  }
};

const cargarReparaciones = async () => {
  try {
    loading.value = true;

    if (!rangoFechasReparaciones.value || rangoFechasReparaciones.value.length === 0) {
      rangoFechasReparaciones.value = [
        new Date(FechaTools.nfecha('mestimestamp').fechainicio),
        new Date(FechaTools.nfecha('mestimestamp').fechafin)
      ];
    }

    // Convertir fechas a timestamps
    const fechaInicio = rangoFechasReparaciones.value[0] ?
      fechaATimestamp(rangoFechasReparaciones.value[0], true) :
      FechaTools.nfecha('mestimestamp').fechainicio;
    const fechaFin = rangoFechasReparaciones.value[1] ?
      fechaATimestamp(rangoFechasReparaciones.value[1], false) :
      FechaTools.nfecha('mestimestamp').fechafin;

    console.log('🔍 Cargando reparaciones con timestamps:', fechaInicio, 'hasta', fechaFin);

    const reparaciones = await peticionesFetchOffline(
      'getRowsByTimestampRange',
      'taller',
      'created_at',
      fechaInicio,
      fechaFin
    );

    console.log('🔧 Reparaciones recibidas:', reparaciones?.length || 0);

    reparacionesData.value = Array.isArray(reparaciones) ? reparaciones : [];

    // Extraer técnicos únicos
    const tecnicosUnicos = [...new Set(reparacionesData.value.map(r => r.tecnico).filter(Boolean))];
    tecnicos.value = tecnicosUnicos.map(t => ({ label: t, value: t }));

    console.log('✅ Reparaciones cargadas:', reparacionesData.value.length);

    loading.value = false;
  } catch (error) {
    console.error('❌ Error cargando reparaciones:', error);
    toast.add({ severity: 'error', summary: 'Error', detail: 'Error al cargar reparaciones', life: 3000 });
    loading.value = false;
  }
};

const reparacionesFiltradas = computed(() => {
  let datos = reparacionesData.value;

  if (tecnicoSeleccionado.value) {
    datos = datos.filter(r => r.tecnico === tecnicoSeleccionado.value.value);
  }

  if (estadoSeleccionado.value) {
    datos = datos.filter(r => r.estado === estadoSeleccionado.value.value);
  }

  return datos;
});

const resumenReparaciones = computed(() => {
  const datos = reparacionesFiltradas.value;
  const pendientes = datos.filter(r => r.estado !== 'Entregado');

  // Calcular tiempo promedio
  const tiempos = datos
    .filter(r => r.fecha_entrega && r.estado === 'Entregado')
    .map(r => {
      const entrada = new Date(r.fecha_entrada);
      const entrega = new Date(r.fecha_entrega);
      return Math.ceil((entrega - entrada) / (1000 * 60 * 60 * 24));
    });

  const tiempoPromedio = tiempos.length > 0 ?
    (tiempos.reduce((sum, t) => sum + t, 0) / tiempos.length).toFixed(1) : 0;

  return {
    totalIngresos: datos.reduce((sum, r) => sum + parseFloat(r.total || 0), 0),
    totalGanancia: datos.reduce((sum, r) => sum + parseFloat(r.beneficio_empresa || 0), 0),
    tiempoPromedio: tiempoPromedio,
    pendientes: pendientes.length,
    completadas: datos.filter(r => r.estado === 'Entregado').length
  };
});

const reparacionesPorTecnico = computed(() => {
  const agrupado = {};
  reparacionesFiltradas.value.forEach(r => {
    const tec = r.tecnico || 'Sin asignar';
    if (!agrupado[tec]) agrupado[tec] = { cantidad: 0, ingresos: 0 };
    agrupado[tec].cantidad++;
    agrupado[tec].ingresos += parseFloat(r.total || 0);
  });

  return {
    labels: Object.keys(agrupado),
    datasets: [{
      label: 'Cantidad de Reparaciones',
      data: Object.values(agrupado).map(t => t.cantidad),
      backgroundColor: 'rgba(153, 102, 255, 0.7)'
    }]
  };
});

const reparacionesPorEstado = computed(() => {
  const agrupado = {};
  reparacionesFiltradas.value.forEach(r => {
    const estado = r.estado || 'Sin estado';
    agrupado[estado] = (agrupado[estado] || 0) + 1;
  });

  return {
    labels: Object.keys(agrupado),
    datasets: [{
      data: Object.values(agrupado),
      backgroundColor: [
        'rgba(255, 205, 86, 0.7)',
        'rgba(75, 192, 192, 0.7)',
        'rgba(54, 162, 235, 0.7)',
        'rgba(255, 99, 132, 0.7)'
      ]
    }]
  };
});

const calcularDiasReparacion = (fechaEntrada, fechaEntrega) => {
  const entrada = new Date(fechaEntrada);
  const entrega = new Date(fechaEntrega);
  return Math.ceil((entrega - entrada) / (1000 * 60 * 60 * 24));
};

// Función para generar PDF de reparaciones
const generarPDFReparaciones = () => {
  try {
    const doc = new jsPDF('l', 'mm', 'a4'); // Landscape para más espacio
    const pageWidth = doc.internal.pageSize.getWidth();
    let yPos = 20;

    // ═══════════════ ENCABEZADO ═══════════════
    doc.setFillColor(14, 165, 233); // Azul cielo
    doc.rect(0, 0, pageWidth, 50, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont(undefined, 'bold');
    doc.text('REPORTE DE REPARACIONES', pageWidth / 2, 20, { align: 'center' });

    doc.setFontSize(12);
    doc.setFont(undefined, 'normal');
    doc.text('Taller - Reportes y Analítica', pageWidth / 2, 30, { align: 'center' });

    // Fechas del reporte
    const fechaInicio = rangoFechasReparaciones.value?.[0]
      ? new Date(rangoFechasReparaciones.value[0]).toLocaleDateString('es-DO')
      : 'N/A';
    const fechaFin = rangoFechasReparaciones.value?.[1]
      ? new Date(rangoFechasReparaciones.value[1]).toLocaleDateString('es-DO')
      : 'N/A';

    doc.text(`Período: ${fechaInicio} - ${fechaFin}`, pageWidth / 2, 38, { align: 'center' });
    doc.text(`Generado: ${new Date().toLocaleString('es-DO')}`, pageWidth / 2, 45, { align: 'center' });

    yPos = 60;

    // ═══════════════ RESUMEN ═══════════════
    doc.setFillColor(243, 244, 246); // Gris claro
    doc.rect(10, yPos, pageWidth - 20, 30, 'F');

    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    doc.setFont(undefined, 'bold');

    const resumen = resumenReparaciones.value;
    const col1X = 20;
    const col2X = 80;
    const col3X = 140;
    const col4X = 200;
    const col5X = 260;

    doc.text('Total Ingresos:', col1X, yPos + 10);
    doc.setFont(undefined, 'normal');
    doc.text(formatoMonedaRD(resumen.totalIngresos), col1X, yPos + 16);

    doc.setFont(undefined, 'bold');
    doc.text('Ganancia Taller:', col2X, yPos + 10);
    doc.setFont(undefined, 'normal');
    doc.setTextColor(34, 197, 94); // Verde
    doc.text(formatoMonedaRD(resumen.totalGanancia), col2X, yPos + 16);

    doc.setTextColor(0, 0, 0);
    doc.setFont(undefined, 'bold');
    doc.text('Tiempo Promedio:', col3X, yPos + 10);
    doc.setFont(undefined, 'normal');
    doc.text(`${resumen.tiempoPromedio} días`, col3X, yPos + 16);

    doc.setFont(undefined, 'bold');
    doc.text('Pendientes:', col4X, yPos + 10);
    doc.setFont(undefined, 'normal');
    doc.setTextColor(234, 179, 8); // Amarillo
    doc.text(String(resumen.pendientes), col4X, yPos + 16);

    doc.setTextColor(0, 0, 0);
    doc.setFont(undefined, 'bold');
    doc.text('Completadas:', col5X, yPos + 10);
    doc.setFont(undefined, 'normal');
    doc.setTextColor(34, 197, 94); // Verde
    doc.text(String(resumen.completadas), col5X, yPos + 16);

    yPos += 40;

    // ═══════════════ TABLA DE REPARACIONES ═══════════════
    doc.setTextColor(0, 0, 0);

    const tableData = reparacionesFiltradas.value.map(rep => {
      const dias = rep.fecha_entrega && rep.estado === 'Entregado'
        ? calcularDiasReparacion(rep.fecha_entrada, rep.fecha_entrega)
        : '-';

      return [
        String(rep.id || ''),
        rep.nombre || '-',
        rep.equipo || '-',
        rep.marca || '-',
        rep.tecnico || '-',
        rep.fecha_entrada || '-',
        rep.fecha_entrega || '-',
        String(dias),
        rep.estado || '-',
        formatoMonedaRD(rep.total || 0),
        formatoMonedaRD(rep.beneficio_empresa || 0)
      ];
    });

    doc.autoTable({
      startY: yPos,
      head: [['ID', 'Cliente', 'Equipo', 'Marca', 'Técnico', 'F. Entrada', 'F. Entrega', 'Días', 'Estado', 'Total', 'Ganancia']],
      body: tableData,
      theme: 'striped',
      headStyles: {
        fillColor: [14, 165, 233],
        textColor: [255, 255, 255],
        fontSize: 9,
        fontStyle: 'bold',
        halign: 'center'
      },
      bodyStyles: {
        fontSize: 8,
        cellPadding: 2
      },
      columnStyles: {
        0: { cellWidth: 15, halign: 'center' },  // ID
        1: { cellWidth: 35, halign: 'left' },    // Cliente
        2: { cellWidth: 25, halign: 'left' },    // Equipo
        3: { cellWidth: 20, halign: 'left' },    // Marca
        4: { cellWidth: 25, halign: 'left' },    // Técnico
        5: { cellWidth: 22, halign: 'center' },  // F. Entrada
        6: { cellWidth: 22, halign: 'center' },  // F. Entrega
        7: { cellWidth: 15, halign: 'center' },  // Días
        8: { cellWidth: 25, halign: 'center' },  // Estado
        9: { cellWidth: 25, halign: 'right' },   // Total
        10: { cellWidth: 25, halign: 'right' }   // Ganancia
      },
      alternateRowStyles: {
        fillColor: [249, 250, 251]
      },
      margin: { left: 10, right: 10 },
      didDrawPage: (data) => {
        // Pie de página
        const pageCount = doc.internal.pages.length - 1;
        doc.setFontSize(8);
        doc.setTextColor(128, 128, 128);
        doc.text(
          `Página ${data.pageNumber} de ${pageCount}`,
          pageWidth / 2,
          doc.internal.pageSize.getHeight() - 10,
          { align: 'center' }
        );
      }
    });

    // ═══════════════ MOSTRAR PDF EN SWAL ═══════════════
    const pdfDataUri = doc.output('datauristring');
    const fileName = `Reparaciones_Taller_${fechaInicio.replace(/\//g, '-')}_${fechaFin.replace(/\//g, '-')}.pdf`;

    Swal.fire({
      title: 'Reporte de Reparaciones',
      html: `
        <div style="width: 100%; height: 70vh;">
          <iframe
            src="${pdfDataUri}"
            style="width: 100%; height: 100%; border: none; border-radius: 8px;"
            type="application/pdf"
          ></iframe>
        </div>
      `,
      width: '95%',
      showCloseButton: true,
      showConfirmButton: true,
      confirmButtonText: '<i class="pi pi-download"></i> Descargar PDF',
      confirmButtonColor: '#0EA5E9',
      didOpen: () => {
        const popup = Swal.getPopup();
        popup.style.padding = '20px';
      }
    }).then((result) => {
      if (result.isConfirmed) {
        doc.save(fileName);
        toast.add({
          severity: 'success',
          summary: 'PDF Descargado',
          detail: 'El archivo se ha descargado correctamente',
          life: 3000
        });
      }
    });

  } catch (error) {
    console.error('Error generando PDF:', error);
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Error al generar el PDF de reparaciones',
      life: 3000
    });
  }
};

// ═══════════════════════════════════════════════════════════
// TAB 6: CLIENTES
// ═══════════════════════════════════════════════════════════

const clientesData = ref([]);
const facturasClientes = ref([]);

const cargarClientes = async () => {
  try {
    console.log('🔍 Cargando clientes...');
    clientesData.value = await peticionesFetchOffline('getDataAsArray', 'clientes');
    console.log('👥 Clientes recibidos:', clientesData.value?.length || 0);

    facturasClientes.value = ventasData.value; // Reutilizar datos de ventas
    console.log('✅ Facturas para análisis de clientes:', facturasClientes.value.length);
  } catch (error) {
    console.error('❌ Error cargando clientes:', error);
  }
};

const topCompradores = computed(() => {
  const comprasPorCliente = {};

  facturasClientes.value.forEach(f => {
    const codCliente = f.cod_cliente || '0000000';
    if (codCliente === '0000000') return;

    if (!comprasPorCliente[codCliente]) {
      comprasPorCliente[codCliente] = {
        codigo: codCliente,
        nombre: f.nombre_cliente,
        totalCompras: 0,
        cantidadFacturas: 0
      };
    }

    comprasPorCliente[codCliente].totalCompras += parseFloat(f.total || 0);
    comprasPorCliente[codCliente].cantidadFacturas++;
  });

  return Object.values(comprasPorCliente)
    .sort((a, b) => b.totalCompras - a.totalCompras)
    .slice(0, 10);
});

const clientesMorosos = computed(() => {
  // Placeholder - implementar lógica de cuentas por cobrar
  return [];
});

const resumenClientes = computed(() => ({
  totalClientes: clientesData.value.length,
  clientesActivos: clientesData.value.filter(c => c.activo === 'true' || c.activo === true).length,
  clientesInactivos: clientesData.value.filter(c => c.activo === 'false' || c.activo === false).length,
  clientesMorosos: clientesMorosos.value.length
}));

const top10CompradoresGrafico = computed(() => ({
  labels: topCompradores.value.map(c => c.nombre),
  datasets: [{
    label: 'Total Compras',
    data: topCompradores.value.map(c => c.totalCompras),
    backgroundColor: 'rgba(54, 162, 235, 0.7)'
  }]
}));

const clientesActivosInactivos = computed(() => ({
  labels: ['Activos', 'Inactivos'],
  datasets: [{
    data: [resumenClientes.value.clientesActivos, resumenClientes.value.clientesInactivos],
    backgroundColor: [
      'rgba(75, 192, 192, 0.7)',
      'rgba(255, 99, 132, 0.7)'
    ]
  }]
}));

// ═══════════════════════════════════════════════════════════
// CONFIGURACIÓN DE GRÁFICOS
// ═══════════════════════════════════════════════════════════

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: true,
      position: 'top'
    }
  },
  scales: {
    y: {
      beginAtZero: true
    }
  }
};

const chartOptionsSemanaActual = {
  responsive: true,
  maintainAspectRatio: false,
  interaction: {
    mode: 'index',
    intersect: false
  },
  plugins: {
    legend: {
      display: true,
      position: 'top'
    },
    tooltip: {
      callbacks: {
        label: (context) => `${context.dataset.label}: ${formatoMonedaRD(context.parsed.y || 0)}`
      }
    }
  },
  scales: {
    x: {
      stacked: false
    },
    y: {
      beginAtZero: true,
      ticks: {
        callback: (value) => formatoMonedaRD(value)
      }
    }
  }
};

const chartOptionsSemanaTaller = {
  responsive: true,
  maintainAspectRatio: false,
  interaction: {
    mode: 'index',
    intersect: false
  },
  plugins: {
    legend: {
      display: true,
      position: 'top'
    },
    tooltip: {
      callbacks: {
        label: (context) => {
          if (context.dataset.yAxisID === 'y1') {
            return `${context.dataset.label}: ${context.parsed.y || 0}`;
          }

          return `${context.dataset.label}: ${formatoMonedaRD(context.parsed.y || 0)}`;
        }
      }
    }
  },
  scales: {
    y: {
      beginAtZero: true,
      position: 'left',
      ticks: {
        callback: (value) => formatoMonedaRD(value)
      }
    },
    y1: {
      beginAtZero: true,
      position: 'right',
      grid: {
        drawOnChartArea: false
      },
      ticks: {
        precision: 0
      }
    }
  }
};

const chartOptionsHorizontal = {
  indexAxis: 'y',
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: false
    }
  },
  scales: {
    x: {
      beginAtZero: true
    }
  }
};

const chartOptionsPie = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: true,
      position: 'bottom'
    }
  }
};

// ═══════════════════════════════════════════════════════════
// FUNCIONES GENERALES
// ═══════════════════════════════════════════════════════════

// Función helper para convertir fecha a timestamp
const fechaATimestamp = (fecha, esInicio = true) => {
  const year = fecha.getFullYear();
  const month = String(fecha.getMonth() + 1).padStart(2, '0');
  const day = String(fecha.getDate()).padStart(2, '0');
  const tiempo = esInicio ? '00:00:00' : '23:59:59';
  return `${year}-${month}-${day} ${tiempo}`;
};

const refrescarTodo = async () => {
  console.log('🔄 Iniciando carga de todos los datos...');
  loading.value = true;
  try {
    await Promise.all([
      cargarUsuarios(),
      cargarVentas(),
      cargarResumenSemanaActual(),
      cargarInventario(),
      cargarReparaciones(),
      cargarResumenSemanaTallerActual(),
      cargarClientes(),
      cargarDelivery()
    ]);
    await cargarRentabilidad();
    await cargarProductosVendidosDetallados();
    console.log('✅ Todos los datos cargados correctamente');
    toast.add({ severity: 'success', summary: 'Éxito', detail: 'Datos actualizados', life: 3000 });
  } catch (error) {
    console.error('❌ Error al refrescar datos:', error);
    toast.add({ severity: 'error', summary: 'Error', detail: 'Error al cargar datos', life: 3000 });
  }
  loading.value = false;
};

const generarPDFReporte = async () => {
  try {
    console.log('📄 Generando PDF de Reportes y Analítica...');

    const doc = new jsPDF('p', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    let yPos = 20;

    // ═══════════════ PORTADA ═══════════════
    doc.setFillColor(102, 126, 234);
    doc.rect(0, 0, pageWidth, 60, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(28);
    doc.setFont('helvetica', 'bold');
    doc.text('REPORTES Y ANALÍTICA', pageWidth / 2, 30, { align: 'center' });

    doc.setFontSize(14);
    doc.setFont('helvetica', 'normal');
    doc.text('Dashboard Completo del Negocio', pageWidth / 2, 42, { align: 'center' });

    const fechaInicio = rangoFechasVentas.value[0]?.toLocaleDateString('es-DO') || '';
    const fechaFin = rangoFechasVentas.value[1]?.toLocaleDateString('es-DO') || '';
    doc.setFontSize(11);
    doc.text(`Período: ${fechaInicio} - ${fechaFin}`, pageWidth / 2, 52, { align: 'center' });

    doc.setTextColor(0, 0, 0);
    yPos = 75;

    // ═══════════════ RESUMEN EJECUTIVO ═══════════════
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(102, 126, 234);
    doc.text('📊 RESUMEN EJECUTIVO', 15, yPos);
    yPos += 10;

    const resumenData = [
      ['Métrica', 'Valor'],
      ['Total Ventas', formatoMonedaRD(ventasResumen.value.totalVentas)],
      ['Total Ganancia', formatoMonedaRD(ventasResumen.value.totalGanancia)],
      ['Total Impuestos', formatoMonedaRD(ventasResumen.value.totalImpuestos)],
      ['Tickets Vendidos', ventasResumen.value.cantidadTickets.toString()],
      ['Valor Inventario', formatoMonedaRD(resumenInventario.value.valorTotal)],
      ['Productos en Stock', resumenInventario.value.totalProductos.toString()],
      ['Total Clientes', resumenClientes.value.totalClientes.toString()]
    ];

    doc.autoTable({
      startY: yPos,
      head: [resumenData[0]],
      body: resumenData.slice(1),
      theme: 'grid',
      headStyles: { fillColor: [102, 126, 234], fontSize: 10, fontStyle: 'bold' },
      bodyStyles: { fontSize: 9 },
      alternateRowStyles: { fillColor: [245, 247, 250] },
      margin: { left: 15, right: 15 }
    });

    yPos = doc.lastAutoTable.finalY + 15;

    // ═══════════════ VENTAS ═══════════════
    if (yPos > 240) {
      doc.addPage();
      yPos = 20;
    }

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(59, 130, 246);
    doc.text('💰 ANÁLISIS DE VENTAS', 15, yPos);
    yPos += 8;

    // Ventas por Vendedor
    const ventasVendedorData = Object.entries(
      ventasFiltradas.value.reduce((acc, f) => {
        const vendedor = f.vendedor || 'Sin asignar';
        acc[vendedor] = (acc[vendedor] || 0) + parseFloat(f.total || 0);
        return acc;
      }, {})
    ).sort((a, b) => b[1] - a[1]).slice(0, 10);

    if (ventasVendedorData.length > 0) {
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(75, 85, 99);
      doc.text('Top 10 Vendedores', 15, yPos);
      yPos += 5;

      doc.autoTable({
        startY: yPos,
        head: [['Vendedor', 'Total Ventas', 'Tickets']],
        body: ventasVendedorData.map(([vendedor, total]) => [
          vendedor,
          formatoMonedaRD(total),
          ventasFiltradas.value.filter(f => (f.vendedor || 'Sin asignar') === vendedor).length.toString()
        ]),
        theme: 'striped',
        headStyles: { fillColor: [59, 130, 246], fontSize: 9 },
        bodyStyles: { fontSize: 8 },
        margin: { left: 15, right: 15 }
      });

      yPos = doc.lastAutoTable.finalY + 12;
    }

    // ═══════════════ RENTABILIDAD ═══════════════
    if (yPos > 200) {
      doc.addPage();
      yPos = 20;
    }

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(16, 185, 129);
    doc.text('📈 RENTABILIDAD', 15, yPos);
    yPos += 8;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(75, 85, 99);
    doc.text(`Utilidad Total: ${formatoMonedaRD(rentabilidadResumen.value.utilidadTotal)}`, 15, yPos);
    doc.text(`Margen Promedio: ${rentabilidadResumen.value.margenPromedio.toFixed(2)}%`, 110, yPos);
    yPos += 10;

    // Top 10 Productos por Utilidad
    const top10Productos = [...productosVendidos.value]
      .sort((a, b) => b.utilidadTotal - a.utilidadTotal)
      .slice(0, 10);

    if (top10Productos.length > 0) {
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('Top 10 Productos por Utilidad', 15, yPos);
      yPos += 5;

      doc.autoTable({
        startY: yPos,
        head: [['Producto', 'Cant.', 'Utilidad', 'Margen %']],
        body: top10Productos.map(p => [
          p.nombre.substring(0, 40),
          p.cantidadVendida.toString(),
          formatoMonedaRD(p.utilidadTotal),
          p.margen.toFixed(2) + '%'
        ]),
        theme: 'striped',
        headStyles: { fillColor: [16, 185, 129], fontSize: 9 },
        bodyStyles: { fontSize: 8 },
        margin: { left: 15, right: 15 }
      });

      yPos = doc.lastAutoTable.finalY + 12;
    }

    // ═══════════════ INVENTARIO ═══════════════
    if (yPos > 200) {
      doc.addPage();
      yPos = 20;
    }

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(99, 102, 241);
    doc.text('📦 INVENTARIO VALORIZADO', 15, yPos);
    yPos += 8;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(75, 85, 99);
    doc.text(`Valor Total: ${formatoMonedaRD(resumenInventario.value.valorTotal)}`, 15, yPos);
    doc.text(`Productos: ${resumenInventario.value.totalProductos}`, 110, yPos);
    yPos += 5;
    doc.text(`Ganancia Esperada: ${formatoMonedaRD(resumenInventario.value.gananciaEsperada)}`, 15, yPos);
    doc.text(`Bajo Stock: ${resumenInventario.value.bajoStock}`, 110, yPos);
    yPos += 10;

    // Top por Valor
    const topInventario = [...inventarioValorizado.value]
      .sort((a, b) => b.valorInventario - a.valorInventario)
      .slice(0, 15);

    if (topInventario.length > 0) {
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('Top 15 Productos por Valor', 15, yPos);
      yPos += 5;

      doc.autoTable({
        startY: yPos,
        head: [['Producto', 'Stock', 'Valor Inv.', 'Gan. Esp.']],
        body: topInventario.map(p => [
          p.nombre.substring(0, 35),
          p.stock?.toString() || '0',
          formatoMonedaRD(p.valorInventario),
          formatoMonedaRD(p.gananciaEsperada)
        ]),
        theme: 'striped',
        headStyles: { fillColor: [99, 102, 241], fontSize: 9 },
        bodyStyles: { fontSize: 8 },
        margin: { left: 15, right: 15 }
      });

      yPos = doc.lastAutoTable.finalY + 12;
    }

    // ═══════════════ CLIENTES ═══════════════
    if (yPos > 200) {
      doc.addPage();
      yPos = 20;
    }

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(236, 72, 153);
    doc.text('👥 ANÁLISIS DE CLIENTES', 15, yPos);
    yPos += 8;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(75, 85, 99);
    doc.text(`Total Clientes: ${resumenClientes.value.totalClientes}`, 15, yPos);
    doc.text(`Activos: ${resumenClientes.value.clientesActivos}`, 110, yPos);
    yPos += 10;

    // Top Compradores
    if (topCompradores.value.length > 0) {
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('Top 10 Compradores del Período', 15, yPos);
      yPos += 5;

      doc.autoTable({
        startY: yPos,
        head: [['Cliente', '# Compras', 'Total', 'Promedio']],
        body: topCompradores.value.map(c => [
          c.nombre.substring(0, 30),
          c.cantidadFacturas.toString(),
          formatoMonedaRD(c.totalCompras),
          formatoMonedaRD(c.totalCompras / c.cantidadFacturas)
        ]),
        theme: 'striped',
        headStyles: { fillColor: [236, 72, 153], fontSize: 9 },
        bodyStyles: { fontSize: 8 },
        margin: { left: 15, right: 15 }
      });
    }

    // ═══════════════ FOOTER EN TODAS LAS PÁGINAS ═══════════════
    const totalPages = doc.internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text(
        `Generado: ${new Date().toLocaleString('es-DO')} | Página ${i} de ${totalPages}`,
        pageWidth / 2,
        pageHeight - 10,
        { align: 'center' }
      );
    }

    // Generar PDF como data URI
    const pdfDataUri = doc.output('datauristring');

    // Mostrar en modal con SweetAlert2
    await Swal.fire({
      title: '📊 Reporte de Analítica',
      html: `
        <div style="width: 100%; height: 70vh;">
          <iframe
            src="${pdfDataUri}"
            style="width: 100%; height: 100%; border: none; border-radius: 8px;"
            title="Reporte PDF">
          </iframe>
        </div>
      `,
      width: '90%',
      showCloseButton: true,
      showCancelButton: true,
      confirmButtonText: '<i class="pi pi-download"></i> Descargar PDF',
      cancelButtonText: '<i class="pi pi-times"></i> Cerrar',
      confirmButtonColor: '#667eea',
      cancelButtonColor: '#6b7280',
      customClass: {
        popup: 'pdf-modal-custom',
        confirmButton: 'pdf-btn-download',
        cancelButton: 'pdf-btn-close'
      }
    }).then((result) => {
      if (result.isConfirmed) {
        doc.save(`Reporte_Analitica_${new Date().getTime()}.pdf`);
        toast.add({
          severity: 'success',
          summary: 'PDF Descargado',
          detail: 'El reporte ha sido descargado exitosamente',
          life: 3000
        });
      }
    });

    console.log('✅ PDF generado exitosamente');

  } catch (error) {
    console.error('❌ Error generando PDF:', error);
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'No se pudo generar el PDF',
      life: 3000
    });
  }
};

const exportarDatos = () => {
  generarPDFReporte();
};

// ═══════════════════════════════════════════════════════════
// TAB 7: DELIVERY
// ═══════════════════════════════════════════════════════════

const rangoFechasDelivery = ref(null);
const deliverySeleccionado = ref(null);
const deliveryOptions = ref([]);
const deliveryData = ref([]);
const deliveryDetalleData = ref([]);

const deliveryResumen = computed(() => {
  const entregas = deliveryData.value;

  if (!Array.isArray(entregas) || entregas.length === 0) {
    return {
      totalEntregas: 0,
      montoTotal: 0,
      comisionTotal: 0,
      promedioEntrega: 0
    };
  }

  const totalEntregas = entregas.length;
  const montoTotal = entregas.reduce((sum, item) => sum + (Number(item.total) || 0), 0);

  // Calcular comisión total basándose en el porcentaje de cada delivery
  let comisionTotal = 0;
  deliveryDetalleData.value.forEach(delivery => {
    comisionTotal += Number(delivery.comision) || 0;
  });

  const promedioEntrega = totalEntregas > 0 ? montoTotal / totalEntregas : 0;

  return {
    totalEntregas,
    montoTotal,
    comisionTotal,
    promedioEntrega
  };
});

const chartEntregasPorDelivery = computed(() => {
  const deliveries = deliveryDetalleData.value;

  if (!Array.isArray(deliveries) || deliveries.length === 0) {
    return {
      labels: [],
      datasets: []
    };
  }

  return {
    labels: deliveries.map(d => d.delivery),
    datasets: [
      {
        label: 'Entregas',
        data: deliveries.map(d => d.cantidadEntregas),
        backgroundColor: '#06b6d4',
        borderColor: '#0891b2',
        borderWidth: 2
      },
      {
        label: 'Comisión',
        data: deliveries.map(d => d.comision),
        backgroundColor: '#10b981',
        borderColor: '#059669',
        borderWidth: 2,
        yAxisID: 'y1'
      }
    ]
  };
});

const chartOptionsDelivery = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  interaction: {
    mode: 'index',
    intersect: false
  },
  plugins: {
    legend: {
      position: 'top',
      labels: {
        font: {
          size: 12,
          weight: 'bold'
        },
        padding: 15,
        usePointStyle: true
      }
    },
    tooltip: {
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      padding: 12,
      titleFont: {
        size: 14,
        weight: 'bold'
      },
      bodyFont: {
        size: 13
      },
      callbacks: {
        label: function(context) {
          let label = context.dataset.label || '';
          if (label) {
            label += ': ';
          }
          if (context.parsed.y !== null) {
            if (context.datasetIndex === 1) {
              label += formatoMonedaRD(context.parsed.y);
            } else {
              label += context.parsed.y;
            }
          }
          return label;
        }
      }
    }
  },
  scales: {
    y: {
      type: 'linear',
      position: 'left',
      beginAtZero: true,
      ticks: {
        font: {
          size: 11,
          weight: 'bold'
        }
      },
      grid: {
        color: 'rgba(0, 0, 0, 0.05)'
      },
      title: {
        display: true,
        text: 'Cantidad de Entregas',
        font: {
          size: 12,
          weight: 'bold'
        }
      }
    },
    y1: {
      type: 'linear',
      position: 'right',
      beginAtZero: true,
      ticks: {
        font: {
          size: 11,
          weight: 'bold'
        },
        callback: function(value) {
          return formatoMonedaRD(value);
        }
      },
      grid: {
        drawOnChartArea: false
      },
      title: {
        display: true,
        text: 'Comisión (RD$)',
        font: {
          size: 12,
          weight: 'bold'
        }
      }
    },
    x: {
      ticks: {
        font: {
          size: 11,
          weight: 'bold'
        }
      },
      grid: {
        color: 'rgba(0, 0, 0, 0.05)'
      }
    }
  }
}));

const cargarDelivery = async () => {
  try {
    loading.value = true;

    // Obtener facturas
    const facturas = await peticionesFetchOffline('getDataAsArray', 'facturas');
    console.log('📦 Facturas obtenidas:', facturas?.length || 0);

    // Obtener datos de deliveries para porcentajes
    const deliveriesInfo = await peticionesFetchOffline('getDataAsArray', 'delivery');
    console.log('🚚 Deliveries obtenidos:', deliveriesInfo?.length || 0);

    const deliveryPorcentajes = {};
    if (Array.isArray(deliveriesInfo)) {
      deliveriesInfo.forEach(d => {
        deliveryPorcentajes[d.nombre] = Number(d.porcentaje) || 0;
      });
    }

    // Filtrar por rango de fechas
    let facturasFiltradas = Array.isArray(facturas) ? facturas : [];
    console.log('📋 Facturas iniciales:', facturasFiltradas.length);

    if (rangoFechasDelivery.value && rangoFechasDelivery.value[0]) {
      const fechaInicio = formatearFechaISO(rangoFechasDelivery.value[0]);
      const fechaFin = rangoFechasDelivery.value[1]
        ? formatearFechaISO(rangoFechasDelivery.value[1])
        : fechaInicio;

      facturasFiltradas = facturasFiltradas.filter(factura => {
        const fechaEmision = factura.fecha_emision;
        return fechaEmision >= fechaInicio && fechaEmision <= fechaFin;
      });
    }

    // Filtrar solo facturas con delivery
    facturasFiltradas = facturasFiltradas.filter(factura => {
      // Verificar campo delivery directo
      if (factura.delivery && factura.delivery !== 'Ninguno' && factura.delivery.trim() !== '') {
        return true;
      }

      // Verificar campo otro (JSON)
      if (factura.otro) {
        try {
          const otroData = JSON.parse(factura.otro);
          if (Array.isArray(otroData) && otroData.length > 0) {
            const delivery = otroData[0].delivery;
            return delivery && delivery !== 'Ninguno' && delivery.trim() !== '';
          }
        } catch (e) {
          // Ignorar errores de parsing
        }
      }

      return false;
    });

    console.log('🚚 Facturas con delivery:', facturasFiltradas.length);

    // Filtrar por delivery seleccionado
    if (deliverySeleccionado.value) {
      facturasFiltradas = facturasFiltradas.filter(factura => {
        const deliveryNombre = factura.delivery ||
          (factura.otro ? JSON.parse(factura.otro)[0]?.delivery : null);
        return deliveryNombre === deliverySeleccionado.value.label;
      });
    }

    deliveryData.value = facturasFiltradas;

    // Agrupar por delivery
    const deliveryMap = new Map();

    facturasFiltradas.forEach(factura => {
      let deliveryNombre = factura.delivery;

      // Si no está en campo directo, buscar en otro
      if (!deliveryNombre || deliveryNombre === 'Ninguno') {
        try {
          const otroData = JSON.parse(factura.otro);
          if (Array.isArray(otroData) && otroData.length > 0) {
            deliveryNombre = otroData[0].delivery;
          }
        } catch (e) {
          // Ignorar
        }
      }

      if (!deliveryNombre || deliveryNombre === 'Ninguno') {
        return;
      }

      if (!deliveryMap.has(deliveryNombre)) {
        deliveryMap.set(deliveryNombre, {
          delivery: deliveryNombre,
          cantidadEntregas: 0,
          montoTotal: 0,
          porcentaje: deliveryPorcentajes[deliveryNombre] || 0,
          comision: 0,
          promedioEntrega: 0
        });
      }

      const deliveryStats = deliveryMap.get(deliveryNombre);
      deliveryStats.cantidadEntregas++;
      deliveryStats.montoTotal += Number(factura.total) || 0;
    });

    // Calcular comisión y promedio para cada delivery
    deliveryMap.forEach(stats => {
      stats.comision = (stats.montoTotal * stats.porcentaje) / 100;
      stats.promedioEntrega = stats.cantidadEntregas > 0
        ? stats.montoTotal / stats.cantidadEntregas
        : 0;
    });

    // Convertir a array y ordenar
    deliveryDetalleData.value = Array.from(deliveryMap.values())
      .sort((a, b) => b.cantidadEntregas - a.cantidadEntregas);

    console.log('📊 Delivery detalle generado:', deliveryDetalleData.value);

    // Actualizar opciones de delivery
    const deliveryNombres = [...new Set(facturas
      .map(f => {
        if (f.delivery && f.delivery !== 'Ninguno') return f.delivery;
        try {
          const otroData = JSON.parse(f.otro);
          if (Array.isArray(otroData) && otroData.length > 0) {
            return otroData[0].delivery;
          }
        } catch (e) {}
        return null;
      })
      .filter(Boolean))];

    deliveryOptions.value = deliveryNombres.map(nombre => ({ label: nombre, value: nombre }));

    console.log('✅ Carga de delivery completada. Entregas totales:', deliveryResumen.value.totalEntregas);

  } catch (error) {
    console.error('Error cargando delivery:', error);
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'No se pudieron cargar los datos de delivery',
      life: 3000
    });
  } finally {
    loading.value = false;
  }
};

const exportarDelivery = () => {
  const doc = new jsPDF();

  // Título
  doc.setFontSize(20);
  doc.setFont(undefined, 'bold');
  doc.text('Reporte de Delivery', 105, 20, { align: 'center' });

  // Información del reporte
  doc.setFontSize(10);
  doc.setFont(undefined, 'normal');
  doc.text(`Fecha: ${nfecha('fecha')}`, 20, 30);

  if (rangoFechasDelivery.value && rangoFechasDelivery.value[0]) {
    const fechaInicio = formatearFechaISO(rangoFechasDelivery.value[0]);
    const fechaFin = rangoFechasDelivery.value[1]
      ? formatearFechaISO(rangoFechasDelivery.value[1])
      : fechaInicio;
    doc.text(`Período: ${fechaInicio} a ${fechaFin}`, 20, 35);
  }

  // Resumen
  const yPos = 45;
  doc.setFontSize(12);
  doc.setFont(undefined, 'bold');
  doc.text('Resumen General', 20, yPos);

  doc.setFontSize(10);
  doc.setFont(undefined, 'normal');
  doc.text(`Total Entregas: ${deliveryResumen.value.totalEntregas}`, 20, yPos + 7);
  doc.text(`Monto Total: ${formatoMonedaRD(deliveryResumen.value.montoTotal)}`, 20, yPos + 14);
  doc.text(`Comisión Total: ${formatoMonedaRD(deliveryResumen.value.comisionTotal)}`, 20, yPos + 21);
  doc.text(`Promedio por Entrega: ${formatoMonedaRD(deliveryResumen.value.promedioEntrega)}`, 20, yPos + 28);

  // Tabla
  const tableData = deliveryDetalleData.value.map(d => [
    d.delivery,
    String(d.cantidadEntregas),
    formatoMonedaRD(d.montoTotal),
    `${d.porcentaje}%`,
    formatoMonedaRD(d.comision),
    formatoMonedaRD(d.promedioEntrega)
  ]);

  doc.autoTable({
    startY: yPos + 35,
    head: [['Delivery', 'Entregas', 'Monto Total', '%', 'Comisión', 'Promedio']],
    body: tableData,
    theme: 'striped',
    headStyles: {
      fillColor: [6, 182, 212],
      textColor: [255, 255, 255],
      fontSize: 10,
      fontStyle: 'bold'
    },
    styles: {
      fontSize: 9
    }
  });

  doc.save(`Reporte_Delivery_${nfecha('fecha')}.pdf`);

  toast.add({
    severity: 'success',
    summary: 'Exportado',
    detail: 'Reporte de delivery exportado exitosamente',
    life: 3000
  });
};

// ═══════════════════════════════════════════════════════════
// LIFECYCLE HOOKS
// ═══════════════════════════════════════════════════════════

onMounted(async () => {
  // Inicializar rangos de fechas
  rangoFechasVentas.value = [
    new Date(FechaTools.nfecha('mestimestamp').fechainicio),
    new Date(FechaTools.nfecha('mestimestamp').fechafin)
  ];
  rangoFechasReparaciones.value = [
    new Date(FechaTools.nfecha('mestimestamp').fechainicio),
    new Date(FechaTools.nfecha('mestimestamp').fechafin)
  ];
  rangoFechasDelivery.value = [
    new Date(FechaTools.nfecha('mestimestamp').fechainicio),
    new Date(FechaTools.nfecha('mestimestamp').fechafin)
  ];

  // Cargar todos los datos
  await refrescarTodo();
});

</script>

<style scoped>
/* ═══════════════════════════════════════════════════════════
   ESTILOS PERSONALIZADOS
   ═══════════════════════════════════════════════════════════ */

.reportes-tabs :deep(.p-tabview-nav) {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 1rem 1rem 0 0;
  padding: 0.5rem;
  border: none;
}

.reportes-tabs :deep(.p-tabview-nav-link) {
  background: rgba(255, 255, 255, 0.1);
  border: 2px solid transparent;
  color: rgba(255, 255, 255, 0.7);
  border-radius: 0.75rem;
  margin: 0 0.25rem;
  padding: 1rem 1.5rem;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  font-weight: 600;
}

.reportes-tabs :deep(.p-tabview-nav-link:hover) {
  background: rgba(255, 255, 255, 0.2);
  color: white;
  transform: translateY(-2px);
}

.reportes-tabs :deep(.p-highlight .p-tabview-nav-link) {
  background: white;
  color: #667eea;
  border-color: white;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
}

.reportes-tabs :deep(.p-tabview-panels) {
  background: transparent;
  border: none;
  padding: 2rem 0;
}

.modern-panel {
  border-radius: 1.5rem !important;
  border: 2px solid transparent;
  background: white;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
}

.modern-panel:hover {
  border-color: rgba(99, 102, 241, 0.3);
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  transform: translateY(-4px);
}

.stats-card {
  border-radius: 1rem !important;
  border: none !important;
  overflow: hidden;
  transition: all 0.3s ease;
}

.stats-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 20px 40px -10px rgba(0, 0, 0, 0.3);
}

/* Forzar que los cards stats muestren los gradientes inline */
.stats-card {
  overflow: hidden;
}

.stats-card :deep(.p-card),
.stats-card :deep(.p-card-body),
.stats-card :deep(.p-card-content) {
  background: transparent !important;
  border: none !important;
  box-shadow: none !important;
  padding: 0 !important;
}

:deep(.dark) .modern-panel {
  background: #1f2937;
  border-color: #374151;
}

/* Estilos para el modal del PDF */
:deep(.pdf-modal-custom) {
  border-radius: 16px !important;
}

:deep(.pdf-btn-download),
:deep(.pdf-btn-close) {
  border-radius: 8px !important;
  padding: 10px 24px !important;
  font-weight: 600 !important;
  transition: all 0.3s ease !important;
}

:deep(.pdf-btn-download:hover) {
  transform: translateY(-2px) !important;
  box-shadow: 0 8px 16px rgba(102, 126, 234, 0.3) !important;
}

:deep(.pdf-btn-close:hover) {
  transform: translateY(-2px) !important;
}
</style>
